// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF PRACTICE SKILLS API
// GET ?staff_id=…  → one practitioner's unified practice picture (five lenses,
//     strengths, growing edges, supervision prompts).
// GET (no staff_id) → whole-team rollup (one row per staff member).
//
// A developmental view for supervision — never a rank or a grade. The engine is
// pure; this route only reads store snapshots and maps them in.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { synthesiseStaffPracticeSkills } from "@/lib/staff-practice-skills/skills-engine";
import type { StaffPracticeSkillsInput } from "@/lib/staff-practice-skills/types";
import { COMPETENCY_DOMAIN_LABELS } from "@/types/extended";

export const dynamic = "force-dynamic";

const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);
const num = (v: unknown): number => (typeof v === "number" ? v : Number(v) || 0);

function buildInput(store: ReturnType<typeof getStore>, staffId: string, staffName: string, asOf: string): StaffPracticeSkillsInput {
  return {
    staffId,
    staffName,
    asOf,
    windowDays: 180,
    domainLabels: COMPETENCY_DOMAIN_LABELS as unknown as Record<string, string>,
    competencyScores: (store.competencyScores ?? [])
      .filter((c: { staff_id?: string }) => c.staff_id === staffId)
      .map((c) => ({ id: String(c.id), staff_id: String(c.staff_id), domain: String(c.domain ?? ""), score: num(c.score), assessed_at: String(c.assessed_at ?? c.created_at ?? "") })),
    observations: (store.practiceObservations ?? [])
      .filter((o: { staff_id?: string }) => o.staff_id === staffId)
      .map((o) => ({ id: String(o.id), staff_id: String(o.staff_id), observation_date: String(o.observation_date ?? ""), outcome: String(o.outcome ?? ""), strengths_noted: arr(o.strengths_noted), areas_for_development: arr(o.areas_for_development) })),
    supervisions: (store.reflectiveSupervisions ?? [])
      .filter((s: { staff_id?: string }) => s.staff_id === staffId)
      .map((s) => ({ id: String(s.id), staff_id: String(s.staff_id), date: String(s.date ?? ""), wellbeing_score: num(s.wellbeing_score), confidence_level: num(s.confidence_level), training_needs: arr(s.training_needs) })),
    recordingAudits: (store.writingAssistantAuditEvents ?? [])
      .filter((a: { user_id?: string }) => a.user_id === staffId)
      .map((a) => ({ id: String(a.id), staff_id: String(a.user_id ?? ""), action: String(a.action ?? ""), created_at: String(a.created_at ?? "") })),
    keyWork: (store.keyWorkingSessions ?? [])
      .filter((k: { staff_id?: string }) => k.staff_id === staffId)
      .map((k) => ({ id: String(k.id), staff_id: String(k.staff_id), date: String(k.date ?? ""), child_voice: String(k.child_voice ?? "") })),
  };
}

const nameOf = (s: { id?: string; name?: string | null; preferred_name?: string | null; first_name?: string | null; last_name?: string | null }): string =>
  s.name || s.preferred_name || [s.first_name, s.last_name].filter(Boolean).join(" ") || "Staff member";

export async function GET(req: NextRequest) {
  try {
    const store = getStore();
    const asOf = new Date().toISOString().slice(0, 10);
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("staff_id");

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    if (staffId) {
      const s = (store.staff ?? []).find((x: { id: string }) => x.id === staffId);
      const profile = synthesiseStaffPracticeSkills(buildInput(store, staffId, s ? nameOf(s) : "Staff member", asOf));
      return NextResponse.json({ data: profile });
    }

    // StaffMember has is_active/employment_status — the old active/status reads hit
    // nonexistent fields, so LEFT staff were never filtered out.
    const team = (store.staff ?? []).filter((s) => s.is_active !== false && s.employment_status !== "left");
    const rows = team.map((s) => {
      const p = synthesiseStaffPracticeSkills(buildInput(store, s.id, nameOf(s), asOf));
      return {
        staffId: p.staffId,
        staffName: p.staffName,
        hasData: p.hasData,
        overallPicture: p.overallPicture,
        strengths: p.strengths.slice(0, 2),
        developmentAreas: p.developmentAreas.slice(0, 2),
        needsSupportLenses: p.lenses.filter((l) => l.signal === "needs_support").length,
        supervisionPromptCount: p.supervisionPrompts.length,
      };
    });
    rows.sort((a: { needsSupportLenses: number; hasData: boolean }, b: { needsSupportLenses: number; hasData: boolean }) =>
      b.needsSupportLenses - a.needsSupportLenses || Number(b.hasData) - Number(a.hasData),
    );

    return NextResponse.json({
      data: {
        asOf,
        staffWithData: rows.filter((r: { hasData: boolean }) => r.hasData).length,
        staffNeedingSupport: rows.filter((r: { needsSupportLenses: number }) => r.needsSupportLenses > 0).length,
        rows,
      },
    });
  } catch (error: unknown) {
    console.error("[api] staff-practice-skills error:", error);
    return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }
}
