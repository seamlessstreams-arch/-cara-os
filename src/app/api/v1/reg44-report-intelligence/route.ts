// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION 44 REPORT INTELLIGENCE API
// GET ?home_id=…&month=YYYY-MM[&spoken_to=N]
//   → per-Quality-Standard assessment + evidence-backed draft statutory-opinion
//     positions, assembled from the EXISTING Reg 44 evidence pack. No new
//     evidence store; reuses generateReg44Pack.
//
// CHR 2015 Reg 44 · the nine Quality Standards (Reg 6–14). Cara suggests; the
// visitor decides. The engine is pure; this route builds its input.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { generateReg44Pack } from "@/lib/care-events/reg44-pack";
import { assessReg44QualityStandards } from "@/lib/reg44-report-intelligence/qs-assessment-engine";
import { assembleReg44ReportDraft } from "@/lib/reg44-report-intelligence/report-assembly";
import { buildReg44BuildingSafety, type Reg44BuildingCheckInput } from "@/lib/reg44-report-intelligence/building-safety";
import type { Reg44AssessmentInput } from "@/lib/reg44-report-intelligence/types";

export const dynamic = "force-dynamic";

const day = (v: unknown): string => (typeof v === "string" ? v.slice(0, 10) : "");

/** month "2026-06" → {start,end}; default to the current month. */
function monthWindow(month: string): { start: string; end: string; month: string } {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  const asOf = new Date().toISOString().slice(0, 10);
  if (!m) {
    const ym = asOf.slice(0, 7);
    return { start: `${ym}-01`, end: `${ym}-31`, month: ym };
  }
  return { start: `${m[1]}-${m[2]}-01`, end: `${m[1]}-${m[2]}-31`, month: `${m[1]}-${m[2]}` };
}

export async function GET(req: NextRequest) {
  try {
    const store = getStore();
    const { searchParams } = new URL(req.url);
    const homeId = searchParams.get("home_id") || "home_oak";
    const win = monthWindow(searchParams.get("month") || "");
    const asOf = new Date().toISOString().slice(0, 10);

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    // Reuse the existing evidence pack — no duplication of evidence gathering.
    const pack = generateReg44Pack(homeId, { window: { start: win.start, end: win.end } });

    // Restraint → debrief linkage.
    const debriefs = (store.debriefRecords ?? []) as Array<{ linked_incident_id?: string }>;
    const restraints = (pack.restraints ?? []).map((r) => {
      const incId = String(r.linked_incident_id ?? "") || String(r.id ?? "").replace("rst_", "inc_");
      return { id: String(r.id), childDebriefed: !!r.child_debriefed, hasDebriefRecord: debriefs.some((d) => d.linked_incident_id === incId), date: day(r.date ?? r.created_at) };
    });

    const missingEpisodes = (pack.missing_episodes ?? []).map((m) => ({
      id: String(m.id),
      hasReturnInterview: !!m.return_interview_completed,
      date: day(m.date_missing),
    }));

    const keywork = (pack.keywork_sessions ?? []).map((k) => ({ id: String(k.id), childVoice: String(k.child_voice ?? ""), date: day(k.date) }));

    // Child voice for the month (feedback expressing wishes/feelings).
    const inMonth = (d: string) => d >= win.start && d <= win.end;
    const childVoice = (store.ypFeedback ?? [])
      .filter((f: { date?: string }) => inMonth(day(f.date)))
      .map((f) => ({ id: String(f.id), category: String(f.category ?? ""), sentiment: String(f.sentiment ?? ""), date: day(f.date) }));

    const complaints = (pack.complaints ?? []).map((c) => ({ id: String(c.id), resolved: !!c.date_resolved, date: day(c.complaint_date) }));

    const countInMonth = (coll: unknown): number =>
      Array.isArray(coll) ? (coll as Array<{ child_id?: string; date?: string; home_id?: string }>).filter((r) => inMonth(day(r.date))).length : 0;

    const input: Reg44AssessmentInput = {
      homeId,
      month: win.month,
      asOf,
      headline: pack.headline,
      restraints,
      missingEpisodes,
      keywork,
      childVoice,
      complaints,
      educationRecords: countInMonth((store as Record<string, unknown>).educationRecords),
      healthRecords: countInMonth((store as Record<string, unknown>).healthAppointments) + countInMonth((store as Record<string, unknown>).medicationRecords),
      achievementRecords: countInMonth((store as Record<string, unknown>).achievements),
      carePlanRecords: countInMonth((store as Record<string, unknown>).carePlans) + countInMonth((store as Record<string, unknown>).riskAssessments),
      childrenSpokenTo: Number(searchParams.get("spoken_to") ?? "0") || 0,
    };

    const assessment = assessReg44QualityStandards(input);

    // ── Assemble the A–Q report draft (deterministic; no AI). Child voice is
    //    anonymised to initials/reference codes before it enters the report. ──
    const initialsOf = (name: string, i: number): string => {
      const parts = (name || "").trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return `C${String(i + 1).padStart(3, "0")}`;
      return parts.map((p) => p[0]!.toUpperCase()).join(".") + ".";
    };
    const childName = new Map<string, string>();
    (pack.children ?? []).forEach((c, i) => childName.set(String(c.child_id), initialsOf(String(c.preferred_name ?? ""), i)));
    const childVoiceEntries = keywork
      .filter((k) => k.childVoice.trim().length > 0)
      .slice(0, 8)
      .map((k) => {
        const cid = (pack.keywork_sessions ?? []).find((s) => String(s.id) === k.id);
        return { ref: (cid && childName.get(String(cid.child_id))) || "Child", summary: k.childVoice.trim().slice(0, 160) };
      });
    const previousRecommendations = ((pack.previous_visit?.outstanding_recommendations ?? []) as unknown as Array<Record<string, unknown>>).map((r) => ({ text: String(r.recommendation ?? ""), status: String(r.status ?? "outstanding"), priority: r.priority ? String(r.priority) : undefined }));

    // Section H — project the home's building checks into the Reg 44 checklist.
    const buildingChecksInput: Reg44BuildingCheckInput[] = ((store.buildingChecks ?? []) as unknown as Array<Record<string, unknown>>)
      .filter((c) => c.home_id === homeId || !c.home_id)
      .map((c) => ({ id: String(c.id), check_type: String(c.check_type ?? ""), check_date: day(c.check_date), due_date: day(c.due_date), status: String(c.status ?? ""), result: (c.result ?? null) as string | null, risk_level: (c.risk_level ?? null) as string | null }));
    const buildingSafety = buildReg44BuildingSafety(buildingChecksInput, asOf);

    const assembly = assembleReg44ReportDraft({
      homeId,
      homeName: "Oak House",
      month: win.month,
      asOf,
      qs: assessment,
      headline: pack.headline,
      childVoiceEntries,
      previousRecommendations,
      reg45EvidenceCount: pack.headline.verified_reg45_evidence ?? 0,
      buildingSafety: { sectionContent: buildingSafety.sectionContent, summary: buildingSafety.summary },
    });

    return NextResponse.json({ data: { assessment, assembly, buildingSafety, pack: { id: pack.id, window: pack.window, headline: pack.headline } } });
  } catch (error: unknown) {
    console.error("[api] reg44-report-intelligence error:", error);
    return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }
}
