// ══════════════════════════════════════════════════════════════════════════════
// Ask CARA — LLM GROUNDING PACK (pure)
//
// The platform already KNOWS an enormous amount deterministically — the Digital
// Twin, the evaluation engines (outcome/emotional/relational), the child practice
// engines (care language, child voice, recording gaps, cumulative risk), the
// weekly narrative, the home evaluation and the operational domains. When the
// LLM layer answers, it must answer FROM that intelligence, never blind.
//
// buildGroundingPack() distils the snapshot into a compact, TIER-SCOPED context
// block for the model: only facts the asker's role may see, only strings already
// computed by the deterministic engines. The LLM is told: everything true is in
// here; anything not in here did not happen.
//
// PURE + deterministic — NO AI imports (the ask-cara import-guard test forbids
// them); the gateway call lives outside ask-cara/ (src/lib/cara/ask-cara-natural).
// ══════════════════════════════════════════════════════════════════════════════

import type { AccessTier, AskCaraAnswer, AskCaraChild, AskCaraSnapshot } from "./types";

const TIER_RANK: Record<AccessTier, number> = { everyone: 0, care_team: 1, management: 2 };

export interface GroundingInput {
  question: string;
  snapshot: AskCaraSnapshot;
  tier: AccessTier;
  /** The deterministic orchestrator's answer for this question (authoritative). */
  answer?: AskCaraAnswer;
  /** The child the question resolved to, if any. */
  child?: AskCaraChild | null;
  asOf: string;
}

const clip = (t: string, n: number): string => (t.length <= n ? t : t.slice(0, n).replace(/\s+\S*$/, "") + "…");
const line = (label: string, value: string | number | null | undefined): string =>
  value === null || value === undefined || value === "" ? "" : `- ${label}: ${value}`;
const block = (title: string, lines: (string | "")[]): string => {
  const body = lines.filter(Boolean).join("\n");
  return body ? `## ${title}\n${body}` : "";
};

function childBlock(snap: AskCaraSnapshot, child: AskCaraChild, asOf: string): string {
  const name = child.firstName || child.name;
  const lines: string[] = [];
  lines.push(line("Name", `${name} (${child.legalStatus ?? "status not recorded"})`));
  const twin = (snap.twins ?? []).find((t) => t.childId === child.id);
  if (twin) {
    if (twin.interests.length) lines.push(line("Who they are — interests", twin.interests.slice(0, 5).join(", ")));
    if (twin.strengths.length) lines.push(line("Strengths (their words)", twin.strengths.slice(0, 3).join("; ")));
    if (twin.aspirations.length) lines.push(line("Aspirations", twin.aspirations.map((a) => a.aspiration).slice(0, 2).join("; ")));
    if (twin.recentAchievements.length) lines.push(line("Recent achievements", twin.recentAchievements.map((a) => a.title).join("; ")));
    if (twin.curiosityPatterns.length) lines.push(line("Patterns CARA notices", twin.curiosityPatterns.slice(0, 2).join(" | ")));
    if (twin.parentingThin.length) lines.push(line("Lived-experience gaps", twin.parentingThin.slice(0, 2).join("; ")));
  }
  const ev = (snap.evaluations ?? []).find((e) => e.childId === child.id);
  if (ev?.outcome) lines.push(line("Direction of travel", `${ev.outcome.trajectory} — ${ev.outcome.headline}${ev.outcome.focus.length ? ` (focus: ${ev.outcome.focus.join(", ")})` : ""}`));
  if (ev?.emotional) lines.push(line("Emotional safety", `${ev.emotional.status} (${ev.emotional.trend}${ev.emotional.peakTime ? `, peaks ${ev.emotional.peakTime}` : ""}); triggers: ${ev.emotional.topTriggers.join(", ") || "none read"}; what helps: ${ev.emotional.whatHelps.join(", ") || "none read"}`));
  if (ev?.relational) lines.push(line("Relational safety", `${ev.relational.status}; trusted adults: ${ev.relational.trustedAdults.join(", ") || "none recorded"}; repairs ${ev.relational.repairs} vs ruptures ${ev.relational.ruptures} (30d)`));
  // Child practice-engine findings (leg four).
  const pr = snap.practice;
  const cl = pr?.careLanguage?.perChild.find((p) => p.childId === child.id);
  if (cl && cl.totalHits > 0) lines.push(line("Care-language flags", `${cl.totalHits} (${cl.topCategoryLabel ?? "mixed"})`));
  const cv = pr?.childVoice?.perChild.find((p) => p.childId === child.id);
  if (cv) lines.push(line("Voice presence", cv.hasData ? `${cv.score ?? 0}% of records${cv.topGapTypeLabel ? `, thinnest in ${cv.topGapTypeLabel}` : ""}` : "not yet captured — a gap"));
  const rg = pr?.recordingGaps?.perChild.find((p) => p.childId === child.id);
  if (rg) lines.push(line("Recording gaps", `${rg.severity}${rg.topGapLabel ? ` (${rg.topGapLabel})` : ""}`));
  const cr = pr?.cumulativeRisk?.perChild.find((p) => p.childId === child.id);
  if (cr) lines.push(line("Cumulative risk", `${cr.signal}, supervision priority ${cr.priority}${cr.topWorseningLabel ? ` (${cr.topWorseningLabel})` : ""}`));
  const srp = pr?.strengthsRecording?.perChild.find((p) => p.childId === child.id);
  if (srp && srp.rate !== null) lines.push(line("Strengths in the recording", `${srp.rate}% of records${srp.topPhrase ? ` (e.g. "${srp.topPhrase}")` : ""}`));
  const rcp = pr?.repairCycle?.perChild.find((p) => p.childId === child.id);
  if (rcp) lines.push(line("Repair cycles", `${rcp.completionRate}% complete${rcp.noRepair ? `, ${rcp.noRepair} unrepaired` : ""}${rcp.missingStep && rcp.missingStep !== "None" ? ` (missing: ${rcp.missingStep})` : ""}`));
  const rsp = pr?.relationalSafety?.perChild.find((p) => p.childId === child.id);
  if (rsp) lines.push(line("Relational safety map", `${rsp.status}; key worker ${rsp.keyWorkerName ?? "NOT assigned"}; ${rsp.sessions30d} key-work (30d); ${rsp.trustedAdults} trusted adults`));
  const tap = pr?.teamApproach?.perChild.find((p) => p.childId === child.id);
  if (tap) lines.push(line("Team approach", `${tap.level} (therapeutic ${tap.therapeuticRate}%, variance ${tap.variance})`));
  // 30-day counts + the precomputed weekly narrative (the richest single string).
  const in30 = (d: string) => { const t = Date.parse(d); return !Number.isNaN(t) && (Date.parse(asOf) - t) / 86_400_000 <= 30 && (Date.parse(asOf) - t) >= 0; };
  const inc = snap.incidents.filter((i) => i.childId === child.id && in30(i.date)).length;
  const res = snap.restraints.filter((r) => r.childId === child.id && in30(r.date));
  lines.push(line("Last 30 days", `${inc} incidents, ${res.length} restraints (${res.filter((r) => !r.childDebriefed).length} without child debrief)`));
  // The child's diary (calendar projection), health appointments, and their own feedback.
  const cal = (snap.childCalendar ?? []).find((c) => c.childId === child.id);
  if (cal?.upcoming.length) lines.push(line("Coming up (14d)", cal.upcoming.slice(0, 3).map((e) => `${e.date} ${e.title}`).join("; ")));
  if (cal?.attended.length) lines.push(line("Recently attended (30d)", cal.attended.slice(-3).map((e) => `${e.date} ${e.title}`).join("; ")));
  const ha = (snap.healthAppointments ?? []).filter((h) => h.childId === child.id).slice(-2);
  if (ha.length) lines.push(line("Health appointments on record", ha.map((h) => `${h.date} ${h.title}${h.outcome ? ` — ${h.outcome}` : ""}`).join("; ")));
  const fb = (snap.feedback ?? []).filter((f) => f.childId === child.id).slice(-2);
  if (fb.length) lines.push(line("Their recent feedback", fb.map((f) => `${f.date} (${f.sentiment.replace(/_/g, " ")}) "${clip(f.text, 110)}"${f.responded ? "" : " — NO RESPONSE RECORDED"}`).join("; ")));
  const weekly = (snap.weekly ?? []).find((w) => w.childId === child.id);
  // The frameworks the home is measured by — Quality Standards + five outcomes.
  if (weekly?.qualityStandardsEvidence.length) lines.push(line(`Quality Standards evidenced this week (${weekly.qualityStandardsEvidence.length} of 9)`, weekly.qualityStandardsEvidence.map((e) => e.label).join("; ")));
  if (weekly?.fiveOutcomesEvidence.length) lines.push(line("Five Outcomes evidenced", weekly.fiveOutcomesEvidence.map((e) => e.label).join("; ")));
  if (weekly?.narrative) lines.push(`- This week's manager-summary draft:\n${clip(weekly.narrative, 1400)}`);
  return block(`THE CHILD — ${name}`, lines);
}

function homeBlock(snap: AskCaraSnapshot, tier: AccessTier, asOf: string): string {
  const lines: string[] = [];
  const current = snap.children.filter((c) => (c.status ?? "current") === "current");
  lines.push(line("Home", `${snap.home?.name ?? "the home"} — ${current.length} young people placed: ${current.map((c) => c.firstName || c.name).join(", ")}`));
  const in30 = (d: string) => { const t = Date.parse(d); return !Number.isNaN(t) && (Date.parse(asOf) - t) / 86_400_000 <= 30 && (Date.parse(asOf) - t) >= 0; };
  const gaps = snap.restraints.filter((r) => !r.childDebriefed).length;
  const oversight = snap.incidents.filter((i) => i.requiresOversight && !i.hasOversight && i.status !== "closed").length;
  const rhi = snap.missingEpisodes.filter((m) => !m.hasReturnInterview).length;
  lines.push(line("Last 30 days", `${snap.incidents.filter((i) => in30(i.date)).length} incidents, ${snap.restraints.filter((r) => in30(r.date)).length} restraints`));
  lines.push(line("Outstanding", `${gaps} restraint debrief gaps, ${oversight} incidents awaiting oversight, ${rhi} missing return-home interviews`));
  if (TIER_RANK[tier] >= TIER_RANK.care_team) {
    const hs = snap.ops?.healthSafety;
    if (hs) lines.push(line("Premises", `${hs.overdue.length} overdue checks, ${hs.openMaintenance} open maintenance, ${hs.fireDrills90d} fire drills (90d)`));
  }
  if (TIER_RANK[tier] >= TIER_RANK.management) {
    if (snap.homeEvaluation) lines.push(line("Inspection evidence posture", `${snap.homeEvaluation.headline} (${snap.homeEvaluation.areasStrong} strong / ${snap.homeEvaluation.areasDeveloping} developing / ${snap.homeEvaluation.areasLimited} limited)`));
    const rs = snap.ops?.rotaSafety;
    if (rs) lines.push(line("Rota safety (7d)", rs.headline));
    const reg44 = snap.ops?.reg44.outstanding.length ?? 0;
    if (reg44) lines.push(line("Reg 44 actions outstanding", reg44));
    const pr = snap.practice;
    if (pr?.cumulativeRisk) lines.push(line("Cumulative risk (home)", `${pr.cumulativeRisk.escalatingCount} escalating, ${pr.cumulativeRisk.urgentSupervisionCount} urgent`));
    if (pr?.careLanguage) lines.push(line("Care language (home)", `${pr.careLanguage.totalHits} flags, ${pr.careLanguage.childrenAffected} children affected`));
    if (pr?.recordingGaps) lines.push(line("Recording gaps (home)", `${pr.recordingGaps.childrenWithCriticalGap} children with critical gaps`));
    if (pr?.strengthsRecording) lines.push(line("Strengths recording (home)", `${pr.strengthsRecording.overallRate}% of records carry a strength`));
    if (pr?.repairCycle) lines.push(line("Repair cycles (home)", `${pr.repairCycle.overallCompletionRate}% complete over ${pr.repairCycle.totalIncidents} incidents${pr.repairCycle.mostCommonMissingStep && pr.repairCycle.mostCommonMissingStep !== "None" ? `; most-missed step: ${pr.repairCycle.mostCommonMissingStep}` : ""}`));
    if (pr?.relationalSafety) lines.push(line("Relational safety (home)", `${pr.relationalSafety.secureCount} secure / ${pr.relationalSafety.developingCount} developing / ${pr.relationalSafety.fragileCount} fragile; ${pr.relationalSafety.noKeyWorker} without a key worker`));
    if (pr?.teamApproach) lines.push(line("Team approach (home)", `${pr.teamApproach.consistentCount} consistent / ${pr.teamApproach.mixedCount} mixed / ${pr.teamApproach.divergentCount} divergent; therapeutic ${pr.teamApproach.overallTherapeuticRate}%`));
    if (pr?.childVoice?.overallPresenceRate !== null && pr?.childVoice !== undefined) lines.push(line("Child voice presence (home)", `${pr.childVoice.overallPresenceRate}% of records`));
  }
  return block("THE HOME", lines);
}

/**
 * The tier-scoped grounding pack: the deterministic answer (authoritative) + the
 * platform's intelligence about the child and home. Capped ~6k chars.
 */
export function buildGroundingPack(input: GroundingInput): string {
  const { snapshot, tier, answer, child, asOf } = input;
  const parts: string[] = [];
  if (answer && answer.answered) {
    parts.push(block("CARA'S DETERMINISTIC ANSWER (authoritative — computed from the live records)", [
      clip(answer.text, 2200),
      answer.sources.length ? `- Evidence: ${answer.sources.map((s) => `${s.label} (${s.count})`).join("; ")}` : "",
    ]));
  }
  if (child && TIER_RANK[tier] >= TIER_RANK.care_team) parts.push(childBlock(snapshot, child, asOf));
  parts.push(homeBlock(snapshot, tier, asOf));
  return clip(parts.filter(Boolean).join("\n\n"), 6000);
}
