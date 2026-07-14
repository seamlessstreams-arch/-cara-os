// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION 44 REPORT EXPORT API
// GET ?home_id=&month=YYYY-MM&format=docx|html|json|reg45
//   docx  → a real Word document matching the A–Q form headings
//   html  → print-ready HTML (→ PDF via the browser's Print / Save-as-PDF)
//   json  → the internal report payload
//   reg45 → the standalone Reg 45 EVIDENCE-EXTRACT (evidence only, not the review)
//
// Assembles the A–Q report from live evidence (reusing the pipeline) and merges
// any persisted sign-off / addenda, then renders the requested format.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { getStore, db } from "@/lib/db/store";
import { generateReg44Pack } from "@/lib/care-events/reg44-pack";
import { assessReg44QualityStandards } from "@/lib/reg44-report-intelligence/qs-assessment-engine";
import { assembleReg44ReportDraft } from "@/lib/reg44-report-intelligence/report-assembly";
import { buildReg44BuildingSafety } from "@/lib/reg44-report-intelligence/building-safety";
import { buildReg44ExportModel, renderReg44Html, renderReg44Json, renderReg45ExtractHtml } from "@/lib/reg44-report-intelligence/report-export";
import { renderReg44Docx } from "@/lib/reg44-report-intelligence/report-docx";
import type { Reg44AssessmentInput } from "@/lib/reg44-report-intelligence/types";

export const dynamic = "force-dynamic";

const day = (v: unknown): string => (typeof v === "string" ? v.slice(0, 10) : "");
function monthWindow(month: string): { start: string; end: string; month: string } {
  const m = /^(\d{4})-(\d{2})$/.exec(month || "");
  const ym = m ? `${m[1]}-${m[2]}` : new Date().toISOString().slice(0, 7);
  return { start: `${ym}-01`, end: `${ym}-31`, month: ym };
}

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const store = getStore();
    const { searchParams } = new URL(req.url);
    const homeId = searchParams.get("home_id") || "home_oak";
    const format = (searchParams.get("format") || "html").toLowerCase();
    const win = monthWindow(searchParams.get("month") || "");
    const asOf = new Date().toISOString().slice(0, 10);

    // Assemble the A–Q report from live evidence.
    const pack = generateReg44Pack(homeId, { window: { start: win.start, end: win.end } });
    const inMonth = (d: string) => d >= win.start && d <= win.end;
    const input: Reg44AssessmentInput = {
      homeId, month: win.month, asOf, headline: pack.headline,
      restraints: (pack.restraints ?? []).map((r) => ({ id: String(r.id), childDebriefed: !!r.child_debriefed, hasDebriefRecord: false, date: day(r.date ?? r.created_at) })),
      missingEpisodes: (pack.missing_episodes ?? []).map((m) => ({ id: String(m.id), hasReturnInterview: !!m.return_interview_completed, date: day(m.date_missing) })),
      keywork: (pack.keywork_sessions ?? []).map((k) => ({ id: String(k.id), childVoice: String(k.child_voice ?? ""), date: day(k.date) })),
      childVoice: (store.ypFeedback ?? []).filter((f: { date?: string }) => inMonth(day(f.date))).map((f) => ({ id: String(f.id), category: String(f.category ?? ""), sentiment: String(f.sentiment ?? ""), date: day(f.date) })),
      complaints: (pack.complaints ?? []).map((c) => ({ id: String(c.id), resolved: !!c.date_resolved, date: day(c.complaint_date) })),
      educationRecords: 0, healthRecords: 0, achievementRecords: 0, carePlanRecords: 0, childrenSpokenTo: 0,
    };
    const assessment = assessReg44QualityStandards(input);
    const buildingChecks = ((store.buildingChecks ?? []) as unknown as Array<Record<string, unknown>>).filter((c) => c.home_id === homeId || !c.home_id).map((c) => ({ id: String(c.id), check_type: String(c.check_type ?? ""), check_date: day(c.check_date), due_date: day(c.due_date), status: String(c.status ?? ""), result: (c.result ?? null) as string | null, risk_level: (c.risk_level ?? null) as string | null }));
    const bs = buildReg44BuildingSafety(buildingChecks, asOf);

    // Anonymise child voice to initials (never names in the export).
    const initialsOf = (name: string, i: number): string => {
      const parts = (name || "").trim().split(/\s+/).filter(Boolean);
      return parts.length ? parts.map((p) => p[0]!.toUpperCase()).join(".") + "." : `C${String(i + 1).padStart(3, "0")}`;
    };
    const childName = new Map<string, string>();
    (pack.children ?? []).forEach((c, i) => childName.set(String(c.child_id), initialsOf(String(c.preferred_name ?? ""), i)));
    const childVoiceEntries = (pack.keywork_sessions ?? [])
      .filter((k) => String(k.child_voice ?? "").trim().length > 0)
      .slice(0, 8)
      .map((k) => ({ ref: childName.get(String(k.child_id)) || "Child", summary: String(k.child_voice).trim().slice(0, 160) }));

    const assembly = assembleReg44ReportDraft({
      homeId, homeName: "Oak House", month: win.month, asOf, qs: assessment, headline: pack.headline,
      childVoiceEntries, previousRecommendations: [], reg45EvidenceCount: pack.headline.verified_reg45_evidence ?? 0,
      buildingSafety: { sectionContent: bs.sectionContent, summary: bs.summary },
    });

    const persisted = db.reg44Reports.findByHomeMonth(homeId, win.month);
    const model = buildReg44ExportModel(assembly, { homeName: "Oak House", ofstedUrn: "", generatedAt: new Date().toISOString(), persisted });

    const base = `reg44-report-${homeId}-${win.month}`;
    if (format === "docx") {
      const buf = await renderReg44Docx(model);
      return new NextResponse(new Uint8Array(buf), {
        headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": `attachment; filename="${base}.docx"` },
      });
    }
    if (format === "json") {
      return new NextResponse(renderReg44Json(model), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="${base}.json"` } });
    }
    if (format === "reg45") {
      return new NextResponse(renderReg45ExtractHtml(model), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    return new NextResponse(renderReg44Html(model), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (error: unknown) {
    console.error("[api] reg44-report export error:", error);
    return NextResponse.json({ error: "A server error occurred." }, { status: 500 });
  }
}
