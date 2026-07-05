// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION 44 REPORT INTELLIGENCE (pure engine)
//
// assessReg44QualityStandards(input) maps the evidence Cara already holds against
// the nine Quality Standards, states the source + strength of each piece, flags
// gaps, and assembles evidence-backed DRAFT positions for the two statutory
// opinions. It never decides the opinions and never auto-asserts that children
// are safeguarded (protection is never auto-"met"). No model calls, no store
// access. Consumes a projection of generateReg44Pack.
// ══════════════════════════════════════════════════════════════════════════════

import {
  REG44_REPORT_INTEL_VERSION,
  type Confidence,
  type QualityStandardAssessment,
  type QualityStandardKey,
  type QualityStandardStatus,
  type Reg44AssessmentInput,
  type Reg44EvidenceLine,
  type Reg44QualityStandardsAssessment,
  type Reg44ValidationFlag,
  type StatutoryOpinion,
  type StatutoryOpinionPosition,
} from "./types";

const REGULATORY_LINKS = [
  "Children's Homes (England) Regulations 2015, Regulation 44 — independent person's monthly visit and report.",
  "The nine Quality Standards, Regulations 6–14.",
  "Regulation 44(4) — the visitor's opinion on whether children are effectively safeguarded and whether the home promotes their well-being.",
];

const DISCLAIMER =
  "Cara has assembled the evidence it already holds against the nine Quality Standards. Every line cites its source. The suggested statuses and the two statutory opinions are STARTING POINTS for the independent visitor's own judgement — Cara does not decide them, and it never concludes on its own that children are effectively safeguarded. Where the records cannot carry a standard, it says so rather than inventing evidence.";

interface StandardMeta {
  key: QualityStandardKey;
  regulation: string;
  label: string;
}
const STANDARDS: StandardMeta[] = [
  { key: "qs_quality_purpose", regulation: "Regulation 6", label: "Quality and purpose of care" },
  { key: "qs_views_wishes_feelings", regulation: "Regulation 7", label: "Children's views, wishes and feelings" },
  { key: "qs_education", regulation: "Regulation 8", label: "Education" },
  { key: "qs_enjoyment_achievement", regulation: "Regulation 9", label: "Enjoyment and achievement" },
  { key: "qs_health_wellbeing", regulation: "Regulation 10", label: "Health and well-being" },
  { key: "qs_positive_relationships", regulation: "Regulation 11", label: "Positive relationships" },
  { key: "qs_protection", regulation: "Regulation 12", label: "Protection of children" },
  { key: "qs_leadership_management", regulation: "Regulation 13", label: "Leadership and management" },
  { key: "qs_care_planning", regulation: "Regulation 14", label: "Care planning" },
];

const nonEmpty = (s?: string): boolean => !!s && s.trim().length > 0;

/** Assemble one standard. `build` returns evidence + concerns + gaps; status is
 *  derived conservatively (protection never auto-"met"). */
function assess(
  meta: StandardMeta,
  evidence: Reg44EvidenceLine[],
  concerns: string[],
  gaps: string[],
  opts: { protection?: boolean } = {},
): QualityStandardAssessment {
  let suggestedStatus: QualityStandardStatus;
  let confidence: Confidence;

  if (evidence.length === 0) {
    suggestedStatus = "insufficient_evidence";
    confidence = "low";
  } else if (concerns.length > 0) {
    // Serious/unaddressed concerns pull below "met"; protection is never "met".
    suggestedStatus = concerns.length >= 2 ? "not_met" : "partly_met";
    confidence = evidence.length >= 3 ? "medium" : "low";
  } else if (opts.protection) {
    // Records show no flagged concern — but Cara will NOT assert safeguarding is
    // met from records alone. The visitor must confirm through observation/voice.
    suggestedStatus = "insufficient_evidence";
    confidence = "medium";
  } else {
    suggestedStatus = evidence.length >= 3 && gaps.length === 0 ? "met" : "partly_met";
    confidence = evidence.length >= 3 ? "high" : "medium";
  }

  const narrative = buildNarrative(meta, evidence, concerns, gaps, suggestedStatus, opts.protection);

  return {
    key: meta.key,
    regulation: meta.regulation,
    label: meta.label,
    suggestedStatus,
    confidence,
    evidence,
    gaps,
    concerns,
    suggestedNarrative: narrative,
    requiresVisitorConfirmation: true,
  };
}

function buildNarrative(
  meta: StandardMeta,
  evidence: Reg44EvidenceLine[],
  concerns: string[],
  gaps: string[],
  status: QualityStandardStatus,
  protection?: boolean,
): string {
  if (evidence.length === 0) {
    return `Evidence not found in Cara for ${meta.label.toLowerCase()} this period. The independent visitor should gather this directly (${gaps[0] ?? "records, observation and speaking with children"}).`;
  }
  const src = `${evidence.length} record${evidence.length === 1 ? "" : "s"} reviewed`;
  if (concerns.length > 0) {
    return `Records for ${meta.label.toLowerCase()} (${src}) show matters to address: ${concerns.join("; ")}. The visitor should test how these are being managed.`;
  }
  if (protection) {
    return `The records reviewed (${src}) show no flagged safeguarding concern this period, but this is not on its own evidence that children are effectively protected — the visitor must form that judgement through observation and speaking with children.`;
  }
  return `Records reviewed (${src}) evidence ${meta.label.toLowerCase()}${gaps.length ? `, though gaps remain (${gaps.join("; ")})` : ""}. Suggested status: ${status.replace(/_/g, " ")} — visitor to confirm.`;
}

export function assessReg44QualityStandards(input: Reg44AssessmentInput): Reg44QualityStandardsAssessment {
  const h = input.headline;
  const byKey: Record<QualityStandardKey, QualityStandardAssessment> = {} as never;

  // ── QS1 Quality & purpose of care (Reg 6) ─────────────────────────────────
  {
    const ev: Reg44EvidenceLine[] = [];
    if (h.keywork_sessions > 0) ev.push({ summary: `${h.keywork_sessions} key-work session(s) recorded`, sourceType: "system_metric", recordType: "keyWorkingSessions", recordId: "count" });
    if (h.children_in_residence > 0) ev.push({ summary: `${h.children_in_residence} child(ren) in residence`, sourceType: "system_metric", recordType: "children", recordId: "count" });
    const gaps = h.keywork_sessions === 0 ? ["no key-work recorded this period"] : [];
    byKey.qs_quality_purpose = assess(STANDARDS[0], ev, [], gaps);
  }

  // ── QS2 Views, wishes & feelings (Reg 7) ──────────────────────────────────
  {
    const ev: Reg44EvidenceLine[] = [];
    for (const k of input.keywork.filter((k) => nonEmpty(k.childVoice)).slice(0, 6)) ev.push({ summary: "Child's voice captured in key-work", sourceType: "told_by_child", recordType: "keyWorkingSessions", recordId: k.id, date: k.date });
    for (const v of input.childVoice.slice(0, 6)) ev.push({ summary: `Feedback on ${v.category.replace(/_/g, " ")} (${v.sentiment.replace(/_/g, " ")})`, sourceType: "told_by_child", recordType: "ypFeedback", recordId: v.id, date: v.date });
    const concerns: string[] = [];
    if (input.childrenSpokenTo === 0) concerns.push("no child was spoken to on the visit");
    const negative = input.childVoice.filter((v) => v.sentiment === "unhappy" || v.sentiment === "very_unhappy").length;
    if (negative >= 2) concerns.push(`${negative} pieces of child feedback expressed unhappiness`);
    const gaps = ev.length === 0 ? ["no child voice captured in Cara this period"] : [];
    byKey.qs_views_wishes_feelings = assess(STANDARDS[1], ev, concerns, gaps);
  }

  // ── QS3 Education (Reg 8) — often a gap in the pack ────────────────────────
  {
    const ev: Reg44EvidenceLine[] = input.educationRecords > 0 ? [{ summary: `${input.educationRecords} education record(s)`, sourceType: "record_review", recordType: "education", recordId: "count" }] : [];
    byKey.qs_education = assess(STANDARDS[2], ev, [], ev.length === 0 ? ["no education records for this period in Cara"] : []);
  }

  // ── QS4 Enjoyment & achievement (Reg 9) ───────────────────────────────────
  {
    const ev: Reg44EvidenceLine[] = input.achievementRecords > 0 ? [{ summary: `${input.achievementRecords} activity/achievement record(s)`, sourceType: "record_review", recordType: "achievements", recordId: "count" }] : [];
    byKey.qs_enjoyment_achievement = assess(STANDARDS[3], ev, [], ev.length === 0 ? ["no activity/achievement records for this period"] : []);
  }

  // ── QS5 Health & well-being (Reg 10) ──────────────────────────────────────
  {
    const ev: Reg44EvidenceLine[] = input.healthRecords > 0 ? [{ summary: `${input.healthRecords} health record(s)`, sourceType: "record_review", recordType: "health", recordId: "count" }] : [];
    byKey.qs_health_wellbeing = assess(STANDARDS[4], ev, [], ev.length === 0 ? ["no health records for this period in Cara"] : []);
  }

  // ── QS6 Positive relationships (Reg 11) ───────────────────────────────────
  {
    const ev: Reg44EvidenceLine[] = [];
    if (h.keywork_sessions > 0) ev.push({ summary: "Key-work relationships evidenced", sourceType: "record_review", recordType: "keyWorkingSessions", recordId: "count" });
    const concerns: string[] = [];
    if (h.restraints > 0) concerns.push(`${h.restraints} restraint(s) this period — test how relationships are repaired`);
    byKey.qs_positive_relationships = assess(STANDARDS[5], ev, concerns, ev.length === 0 ? ["no relational key-work recorded"] : []);
  }

  // ── QS7 Protection of children (Reg 12) — safeguarding, never auto-"met" ───
  {
    const ev: Reg44EvidenceLine[] = [];
    if (h.safeguarding_events > 0) ev.push({ summary: `${h.safeguarding_events} safeguarding event(s)`, sourceType: "record_review", recordType: "safeguarding", recordId: "count" });
    if (h.incidents > 0) ev.push({ summary: `${h.incidents} incident(s) (${h.incidents_critical} critical)`, sourceType: "record_review", recordType: "incidents", recordId: "count" });
    if (h.missing_episodes > 0) ev.push({ summary: `${h.missing_episodes} missing episode(s) (${h.missing_high_risk} high risk)`, sourceType: "record_review", recordType: "missing_episodes", recordId: "count" });
    if (h.restraints > 0) ev.push({ summary: `${h.restraints} restraint(s)`, sourceType: "record_review", recordType: "restraints", recordId: "count" });
    if (h.reg40_notifications > 0) ev.push({ summary: `${h.reg40_notifications} Reg 40 notification(s)`, sourceType: "record_review", recordType: "reg40", recordId: "count" });

    const concerns: string[] = [];
    const noDebrief = input.restraints.filter((r) => !r.childDebriefed && !r.hasDebriefRecord);
    if (noDebrief.length > 0) concerns.push(`${noDebrief.length} restraint(s) without a recorded child debrief`);
    const noReturn = input.missingEpisodes.filter((m) => !m.hasReturnInterview);
    if (noReturn.length > 0) concerns.push(`${noReturn.length} missing episode(s) without a return interview`);
    if (h.complaints_unresolved > 0) concerns.push(`${h.complaints_unresolved} unresolved complaint(s)`);
    for (const r of noDebrief.slice(0, 4)) ev.push({ summary: "Restraint without recorded child debrief", sourceType: "record_review", recordType: "restraints", recordId: r.id, date: r.date });

    byKey.qs_protection = assess(STANDARDS[6], ev, concerns, [], { protection: true });
  }

  // ── QS8 Leadership & management (Reg 13) ──────────────────────────────────
  {
    const ev: Reg44EvidenceLine[] = [];
    const concerns: string[] = [];
    if (h.last_visit_recommendations_outstanding > 0) {
      ev.push({ summary: `${h.last_visit_recommendations_outstanding} recommendation(s) outstanding from the last visit`, sourceType: "record_review", recordType: "reg44Recommendations", recordId: "count" });
      concerns.push(`${h.last_visit_recommendations_outstanding} previous recommendation(s) still outstanding`);
    } else {
      ev.push({ summary: "No recommendations outstanding from the last visit", sourceType: "system_metric", recordType: "reg44Recommendations", recordId: "count" });
    }
    byKey.qs_leadership_management = assess(STANDARDS[7], ev, concerns, []);
  }

  // ── QS9 Care planning (Reg 14) ────────────────────────────────────────────
  {
    const ev: Reg44EvidenceLine[] = input.carePlanRecords > 0 ? [{ summary: `${input.carePlanRecords} care-planning record(s)`, sourceType: "record_review", recordType: "care_plans", recordId: "count" }] : [];
    byKey.qs_care_planning = assess(STANDARDS[8], ev, [], ev.length === 0 ? ["no care-planning records for this period in Cara"] : []);
  }

  const standards = STANDARDS.map((m) => byKey[m.key]);

  // ── Statutory opinions (evidence positions — the visitor's to decide) ─────
  const protection = byKey.qs_protection;
  const safeguardingConcerns = protection.concerns;
  const safeguardingOpinion = buildOpinion(
    "In your opinion, are children effectively safeguarded?",
    ["qs_protection", "qs_views_wishes_feelings", "qs_positive_relationships"],
    protection.evidence.length,
    safeguardingConcerns,
  );

  const wellbeingConcerns = [
    ...byKey.qs_health_wellbeing.concerns,
    ...byKey.qs_views_wishes_feelings.concerns,
    ...byKey.qs_positive_relationships.concerns,
  ];
  const wellbeingEvidenceCount =
    byKey.qs_health_wellbeing.evidence.length + byKey.qs_views_wishes_feelings.evidence.length + byKey.qs_enjoyment_achievement.evidence.length;
  const wellbeingOpinion = buildOpinion(
    "In your opinion, does the conduct of the home promote children's well-being?",
    ["qs_health_wellbeing", "qs_views_wishes_feelings", "qs_enjoyment_achievement", "qs_positive_relationships"],
    wellbeingEvidenceCount,
    wellbeingConcerns,
  );

  // ── Validation flags (subset of the master-prompt hard-blocks + warnings) ─
  const validationFlags: Reg44ValidationFlag[] = [];
  const block = (id: string, message: string) => validationFlags.push({ id, severity: "block", message });
  const warn = (id: string, message: string) => validationFlags.push({ id, severity: "warning", message });

  if (input.childrenSpokenTo === 0) warn("no_child_spoken", "No child was spoken to on this visit — record why, or speak with a child.");
  const insufficient = standards.filter((s) => s.suggestedStatus === "insufficient_evidence");
  if (insufficient.length > 0) warn("standards_insufficient", `${insufficient.length} Quality Standard(s) have insufficient evidence in Cara — gather this before forming a view.`);
  if (byKey.qs_views_wishes_feelings.evidence.length === 0) block("child_voice_blank", "The children's voice section has no evidence — it cannot be left blank without a reason.");
  if (safeguardingConcerns.length > 0) warn("safeguarding_concerns", `Protection shows ${safeguardingConcerns.length} matter(s) to address — the safeguarding opinion must account for them.`);
  if (protection.evidence.length === 0) warn("protection_no_evidence", "No protection evidence found in Cara — the safeguarding opinion needs a supporting basis.");
  if (h.last_visit_recommendations_outstanding > 0) warn("previous_recs_open", `${h.last_visit_recommendations_outstanding} previous recommendation(s) are outstanding — review progress in the report.`);

  // ── Readiness score ───────────────────────────────────────────────────────
  const standardsWithEvidence = standards.filter((s) => s.evidence.length > 0).length;
  const childVoiceCaptured = byKey.qs_views_wishes_feelings.evidence.length > 0;
  const coverageScore = Math.round((standardsWithEvidence / 9) * 60);
  const voiceScore = childVoiceCaptured ? 20 : 0;
  const safeguardingScore = protection.evidence.length > 0 ? 20 : 0;
  const score = coverageScore + voiceScore + safeguardingScore;
  const readiness: Reg44QualityStandardsAssessment["readiness"] = {
    score,
    standardsWithEvidence,
    status: score >= 80 ? "ready_for_visitor" : score >= 50 ? "needs_review" : "needs_evidence",
    childVoiceCaptured,
    safeguardingScrutiny: safeguardingConcerns.length > 0 ? "gaps" : protection.evidence.length > 0 ? "evidenced" : "insufficient",
  };

  const evidenceCount = standards.reduce((n, s) => n + s.evidence.length, 0);

  return {
    homeId: input.homeId,
    month: input.month,
    asOf: input.asOf,
    standards,
    safeguardingOpinion,
    wellbeingOpinion,
    validationFlags,
    readiness,
    evidenceCount,
    regulatoryLinks: REGULATORY_LINKS,
    disclaimer: DISCLAIMER,
    engineVersion: REG44_REPORT_INTEL_VERSION,
  };
}

function buildOpinion(
  question: string,
  supportingStandards: QualityStandardKey[],
  evidenceCount: number,
  concerns: string[],
): StatutoryOpinion {
  let position: StatutoryOpinionPosition;
  let basis: string;
  if (evidenceCount === 0) {
    position = "insufficient_evidence";
    basis = "Cara found no supporting evidence this period — the visitor must gather it directly before forming this opinion.";
  } else if (concerns.length > 0) {
    position = "concerns_identified";
    basis = `The records raise matters the opinion must address: ${concerns.join("; ")}.`;
  } else {
    position = "evidence_mixed";
    basis = "The records reviewed show no flagged concern this period, but records alone cannot carry this statutory opinion — it rests on the visitor's observation and conversations with children.";
  }
  return { question, position, basis, concerns, supportingStandards, requiresVisitorJudgement: true };
}

export { REG44_REPORT_INTEL_VERSION };
