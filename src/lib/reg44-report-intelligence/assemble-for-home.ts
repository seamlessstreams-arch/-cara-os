// ══════════════════════════════════════════════════════════════════════════════
// CARA — ASSEMBLE A REG 44 DRAFT FOR A HOME + MONTH (server-side)
//
// One place that turns a home and a month into the gate draft and the A–Q
// sections, so every route that creates a report — the report API and the
// visit tracker's "Add Visit" — starts from the same evidence in the same way.
// Reads through the dal (Supabase in activated mode) plus the Reg 44 pack.
//
// EVIDENCE CAVEAT: generateReg44Pack still reads the in-memory store, which is
// empty on a live tenant, so a live draft starts thin — sections marked for
// the visitor's input rather than pre-filled. Honest, not fabricated; moving
// the pack onto the dal is its own piece of work.
// ══════════════════════════════════════════════════════════════════════════════

import { dal } from "@/lib/db";
import { localMonthKey, todayStr } from "@/lib/utils";
import { generateReg44Pack } from "@/lib/care-events/reg44-pack";
import { assessReg44QualityStandards } from "./qs-assessment-engine";
import { assembleReg44ReportDraft, type Reg44Section } from "./report-assembly";
import { buildReg44BuildingSafety } from "./building-safety";
import type { Reg44AssessmentInput } from "./types";
import type { Reg44ReportDraft } from "./report-validation";

const day = (v: unknown): string => (typeof v === "string" ? v.slice(0, 10) : "");

export function reg44MonthWindow(month: string): { start: string; end: string; month: string } {
  const m = /^(\d{4})-(\d{2})$/.exec(month || "");
  const ym = m ? `${m[1]}-${m[2]}` : localMonthKey();
  return { start: `${ym}-01`, end: `${ym}-31`, month: ym };
}

export interface AssembledReg44Draft {
  draft: Reg44ReportDraft;
  sections: Reg44Section[];
  month: string;
  homeName: string;
}

export async function assembleReg44DraftForHome(homeId: string, month: string): Promise<AssembledReg44Draft> {
  const [ypFeedbackList, buildingChecksList, home] = await Promise.all([
    dal.ypFeedback.findAll(),
    dal.buildingChecks.findAll(),
    dal.home.get().catch(() => null),
  ]);
  const homeName = (home as { name?: string } | null)?.name || "This home";
  const asOf = todayStr();
  const win = reg44MonthWindow(month);
  const pack = generateReg44Pack(homeId, { window: { start: win.start, end: win.end } });
  const inMonth = (d: string) => d >= win.start && d <= win.end;

  const input: Reg44AssessmentInput = {
    homeId, month: win.month, asOf,
    headline: pack.headline,
    restraints: (pack.restraints ?? []).map((r) => ({ id: String(r.id), childDebriefed: !!r.child_debriefed, hasDebriefRecord: false, date: day(r.date ?? r.created_at) })),
    missingEpisodes: (pack.missing_episodes ?? []).map((m) => ({ id: String(m.id), hasReturnInterview: !!m.return_interview_completed, date: day(m.date_missing) })),
    keywork: (pack.keywork_sessions ?? []).map((k) => ({ id: String(k.id), childVoice: String(k.child_voice ?? ""), date: day(k.date) })),
    childVoice: (ypFeedbackList ?? []).filter((f) => inMonth(day(f.date))).map((f) => ({ id: String(f.id), category: String(f.category ?? ""), sentiment: String(f.sentiment ?? ""), date: day(f.date) })),
    complaints: (pack.complaints ?? []).map((c) => ({ id: String(c.id), resolved: !!c.date_resolved, date: day(c.complaint_date) })),
    educationRecords: 0, healthRecords: 0, achievementRecords: 0, carePlanRecords: 0,
    childrenSpokenTo: 0,
  };
  const assessment = assessReg44QualityStandards(input);
  const buildingChecks = ((buildingChecksList ?? []) as unknown as Array<Record<string, unknown>>)
    .filter((c) => c.home_id === homeId || !c.home_id)
    .map((c) => ({ id: String(c.id), check_type: String(c.check_type ?? ""), check_date: day(c.check_date), due_date: day(c.due_date), status: String(c.status ?? ""), result: (c.result ?? null) as string | null, risk_level: (c.risk_level ?? null) as string | null }));
  const bs = buildReg44BuildingSafety(buildingChecks, asOf);
  const assembly = assembleReg44ReportDraft({
    homeId, homeName, month: win.month, asOf, qs: assessment, headline: pack.headline,
    childVoiceEntries: [], previousRecommendations: [], reg45EvidenceCount: pack.headline.verified_reg45_evidence ?? 0,
    buildingSafety: { sectionContent: bs.sectionContent, summary: bs.summary },
  });
  return { draft: assembly.draftForGate, sections: assembly.sections, month: win.month, homeName };
}
