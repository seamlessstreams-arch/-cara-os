// ══════════════════════════════════════════════════════════════════════════════
// CARA — ORGANISATIONAL LEARNING REPORT (pure engine)
//
// buildOrgLearningReport(input) reads a period's worth of records and derives a
// leadership picture across six sections. Deterministic; every theme carries an
// evidence count and its source records; honest "insufficient data" where the
// period is too thin. No model calls, no store access, no wall-clock.
// ══════════════════════════════════════════════════════════════════════════════

import {
  ORG_LEARNING_REPORT_VERSION,
  type LearningEvidenceRef,
  type LearningTheme,
  type OrgLearningReportInput,
  type OrgLearningReport,
  type OrgLearningReportSection,
  type ReportPeriod,
} from "./types";

const REGULATORY_LINKS = [
  "Children's Homes (England) Regulations 2015, Reg 45 — the independent person and monitoring.",
  "Quality Standards — leadership and management: learning and continuous improvement.",
  "Ofsted SCCIF — how leaders use learning to improve the experiences and progress of children.",
];

const periodDays = (p: ReportPeriod): number => (p === "month" ? 30 : 90);
const periodLabel = (p: ReportPeriod): string => (p === "month" ? "Last 30 days" : "Last quarter");

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}
const inWindow = (date: string, asOf: string, from: number, to: number): boolean => {
  if (!date) return false;
  const age = daysBetween(date, asOf);
  return age >= from && age <= to;
};
const humanise = (s: string): string => (s || "").replace(/_/g, " ").trim();
const cap = <T>(a: T[], n: number): T[] => a.slice(0, n);

/** Count occurrences of a key across items, keeping the source ids per key. */
function tally<T>(items: T[], keyOf: (t: T) => string, idOf: (t: T) => string): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const it of items) {
    const k = keyOf(it).trim().toLowerCase();
    if (!k) continue;
    const cur = m.get(k) ?? [];
    cur.push(idOf(it));
    m.set(k, cur);
  }
  return m;
}

export function buildOrgLearningReport(input: OrgLearningReportInput): OrgLearningReport {
  const period = input.period ?? "quarter";
  const windowDays = periodDays(period);
  const { asOf, homeId } = input;

  // Recent = this period; prior = the period before it (for trend/improvement).
  const inRecent = (d: string) => inWindow(d, asOf, 0, windowDays);
  const inPrior = (d: string) => inWindow(d, asOf, windowDays + 1, windowDays * 2);

  const incRecent = input.incidents.filter((i) => inRecent(i.date));
  const incPrior = input.incidents.filter((i) => inPrior(i.date));
  const behRecent = input.behaviour.filter((b) => inRecent(b.date) && /concern/i.test(b.direction));
  const escRecent = input.escalations.filter((e) => inRecent(e.createdAt));
  const ethRecent = input.ethical.filter((e) => inRecent(e.createdAt));
  const loopRecent = input.feedbackLoops.filter((f) => inRecent(f.feedbackDate));
  const voiceRecent = input.voice.filter((v) => inRecent(v.date));
  const rstRecent = input.restraints.filter((r) => inRecent(r.date));

  // ── 1. Repeated themes (incident types + behaviour triggers ≥2) ───────────
  const repeated: LearningTheme[] = [];
  for (const [key, ids] of tally(incRecent, (i) => i.type, (i) => i.id)) {
    if (ids.length >= 2) repeated.push({ id: `rep_inc_${key.replace(/\W+/g, "_")}`, kind: "repeated_theme", weight: "notable", title: `Recurring incident type: ${humanise(key)}`, detail: `${ids.length} incidents of this type this period.`, evidenceCount: ids.length, sources: ids.map((id) => ({ recordType: "incidents", recordId: id })) });
  }
  for (const [key, ids] of tally(behRecent, (b) => b.trigger, (b) => b.id)) {
    if (ids.length >= 3) repeated.push({ id: `rep_beh_${key.replace(/\W+/g, "_")}`, kind: "repeated_theme", weight: "watch", title: `Recurring trigger: "${humanise(key)}"`, detail: `Appears in ${ids.length} behaviour records this period — worth a whole-home look.`, evidenceCount: ids.length, sources: cap(ids.map((id) => ({ recordType: "behaviourLog", recordId: id })), 10) });
  }

  // ── 2. Emerging risks (HIGH/IMMEDIATE escalations + rising incident count) ─
  const emerging: LearningTheme[] = [];
  const seriousEsc = escRecent.filter((e) => e.status === "decided" && (e.confirmedLevel === "high_concern" || e.confirmedLevel === "immediate_safeguarding"));
  if (seriousEsc.length > 0) {
    emerging.push({ id: "emg_esc", kind: "emerging_risk", weight: "priority", title: `${seriousEsc.length} high/immediate escalation${seriousEsc.length === 1 ? "" : "s"} confirmed`, detail: "Managers confirmed serious risk levels this period — keep the linked plans and strategy discussions under review.", evidenceCount: seriousEsc.length, sources: seriousEsc.map((e) => ({ recordType: "escalationDecisions", recordId: e.id })) });
  }
  if (incPrior.length >= 2 && incRecent.length > incPrior.length) {
    emerging.push({ id: "emg_inc_rising", kind: "emerging_risk", weight: "watch", title: "Incident volume is rising", detail: `${incPrior.length} in the previous period → ${incRecent.length} this period.`, evidenceCount: incRecent.length, sources: cap(incRecent.map((i) => ({ recordType: "incidents", recordId: i.id })), 10) });
  }

  // ── 3. Unresolved learning (open ethical cycles, pending loops, no debrief) ─
  const unresolved: LearningTheme[] = [];
  const openCycles = ethRecent.filter((e) => !e.cycleComplete);
  if (openCycles.length > 0) {
    unresolved.push({ id: "unr_ethical", kind: "unresolved_learning", weight: "watch", title: `${openCycles.length} learning cycle${openCycles.length === 1 ? "" : "s"} still open`, detail: "Ethical-intelligence cycles started but not yet carried through to integration — the learning isn't closed.", evidenceCount: openCycles.length, sources: openCycles.map((e) => ({ recordType: "ethicalIntelligenceEvents", recordId: e.id })) });
  }
  const pendingLoops = loopRecent.filter((f) => f.decisionMade === "pending_consideration");
  if (pendingLoops.length > 0) {
    unresolved.push({ id: "unr_loops", kind: "unresolved_learning", weight: "watch", title: `${pendingLoops.length} piece${pendingLoops.length === 1 ? "" : "s"} of child feedback awaiting a response`, detail: "Children raised these and haven't yet heard back — close the loop.", evidenceCount: pendingLoops.length, sources: pendingLoops.map((f) => ({ recordType: "childFeedbackLoops", recordId: f.id })) });
  }
  const noDebrief = rstRecent.filter((r) => !r.childDebriefed && !r.hasDebriefRecord);
  if (noDebrief.length > 0) {
    unresolved.push({ id: "unr_debrief", kind: "unresolved_learning", weight: "priority", title: `${noDebrief.length} restraint${noDebrief.length === 1 ? "" : "s"} without a recorded child debrief`, detail: "The repair conversation after physical intervention is outstanding — safeguarding-critical.", evidenceCount: noDebrief.length, sources: noDebrief.map((r) => ({ recordType: "restraints", recordId: r.id })) });
  }

  // ── 4. Practice strengths (closed cycles w/ learning, closed loops) ────────
  const strengths: LearningTheme[] = [];
  const closedWithLearning = ethRecent.filter((e) => e.cycleComplete && e.hasLearning);
  if (closedWithLearning.length > 0) {
    strengths.push({ id: "str_cycles", kind: "practice_strength", weight: "positive", title: `${closedWithLearning.length} learning cycle${closedWithLearning.length === 1 ? "" : "s"} closed with learning embedded`, detail: "Events carried all the way through to a change in practice — this is the loop working.", evidenceCount: closedWithLearning.length, sources: closedWithLearning.map((e) => ({ recordType: "ethicalIntelligenceEvents", recordId: e.id })) });
  }
  const closedLoops = loopRecent.filter((f) => f.decisionMade.startsWith("acted_on"));
  if (closedLoops.length > 0) {
    strengths.push({ id: "str_loops", kind: "practice_strength", weight: "positive", title: `${closedLoops.length} piece${closedLoops.length === 1 ? "" : "s"} of child feedback acted on`, detail: "Children raised these and the home acted — strong 'you said / we did' evidence.", evidenceCount: closedLoops.length, sources: closedLoops.map((f) => ({ recordType: "childFeedbackLoops", recordId: f.id })) });
  }

  // ── 5. Child voice themes (repeated negative sentiment by category ≥2) ─────
  const voiceThemes: LearningTheme[] = [];
  const negVoice = voiceRecent.filter((v) => v.sentiment === "unhappy" || v.sentiment === "very_unhappy");
  for (const [key, ids] of tally(negVoice, (v) => v.category, (v) => v.id)) {
    if (ids.length >= 2) voiceThemes.push({ id: `cv_${key.replace(/\W+/g, "_")}`, kind: "child_voice_theme", weight: "priority", title: `Children unhappy about: ${humanise(key)}`, detail: `${ids.length} pieces of child feedback expressed unhappiness here this period — hear it directly.`, evidenceCount: ids.length, sources: ids.map((id) => ({ recordType: "ypFeedback", recordId: id })) });
  }

  // ── 6. Improvement evidence (incidents down; loops closing) ────────────────
  const improvement: LearningTheme[] = [];
  if (incPrior.length >= 3 && incRecent.length < incPrior.length) {
    improvement.push({ id: "imp_inc_down", kind: "improvement_evidence", weight: "positive", title: "Fewer incidents than the previous period", detail: `${incPrior.length} → ${incRecent.length}. Evidence the current approach is helping.`, evidenceCount: incPrior.length - incRecent.length, sources: cap(incRecent.map((i) => ({ recordType: "incidents", recordId: i.id })), 10) });
  }
  if (loopRecent.length >= 3) {
    const rate = closedLoops.length / loopRecent.length;
    if (rate >= 0.6) improvement.push({ id: "imp_loops", kind: "improvement_evidence", weight: "positive", title: "Feedback loops are closing well", detail: `${closedLoops.length} of ${loopRecent.length} pieces of feedback acted on (${Math.round(rate * 100)}%).`, evidenceCount: closedLoops.length, sources: cap(closedLoops.map((f) => ({ recordType: "childFeedbackLoops", recordId: f.id })), 10) });
  }

  const totalActivity = incRecent.length + behRecent.length + escRecent.length + ethRecent.length + loopRecent.length + voiceRecent.length + rstRecent.length;

  const section = (key: OrgLearningReportSection["key"], label: string, themes: LearningTheme[], enoughData: boolean): OrgLearningReportSection => ({
    key,
    label,
    themes: cap(themes, 8),
    insufficientData: !enoughData && themes.length === 0,
  });

  const sections: OrgLearningReportSection[] = [
    section("emerging_risk", "Emerging risks", emerging, escRecent.length + incRecent.length > 0),
    section("unresolved_learning", "Unresolved learning", unresolved, ethRecent.length + loopRecent.length + rstRecent.length > 0),
    section("child_voice_theme", "Child voice themes", voiceThemes, voiceRecent.length >= 2),
    section("repeated_theme", "Repeated themes", repeated, incRecent.length + behRecent.length > 0),
    section("practice_strength", "Practice strengths", strengths, ethRecent.length + loopRecent.length > 0),
    section("improvement_evidence", "Evidence of improvement", improvement, incPrior.length >= 3 || loopRecent.length >= 3),
  ];

  const totalEvidence = sections.reduce((s, sec) => s + sec.themes.reduce((a, t) => a + t.evidenceCount, 0), 0);
  const priorities = sections.flatMap((s) => s.themes).filter((t) => t.weight === "priority").length;
  const positives = sections.flatMap((s) => s.themes).filter((t) => t.weight === "positive").length;

  const headline =
    totalActivity === 0
      ? `Not enough activity in the ${period === "month" ? "last 30 days" : "last quarter"} to draw organisational themes yet.`
      : `${priorities} priority signal${priorities === 1 ? "" : "s"} and ${positives} positive${positives === 1 ? "" : "s"} across ${totalEvidence} evidenced record${totalEvidence === 1 ? "" : "s"} this ${period}.`;

  return {
    homeId,
    period,
    periodLabel: periodLabel(period),
    asOf,
    windowDays,
    headline,
    sections,
    totalEvidence,
    regulatoryLinks: REGULATORY_LINKS,
    disclaimer:
      "This report aggregates records that already exist into a leadership picture. Every theme links to its source records — nothing here is invented, and where the period is too thin the section says so. It supports management judgement and the Reg 45 process; it does not replace them.",
    engineVersion: ORG_LEARNING_REPORT_VERSION,
  };
}

export { ORG_LEARNING_REPORT_VERSION };
