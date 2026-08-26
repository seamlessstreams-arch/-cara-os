import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// Cara Restraint Intelligence Engine
//
// Deterministic engine for evaluating how effectively a children's residential
// home manages physical restraint — tracking incidents, compliance with
// recording and notification requirements, policy frameworks, and staff
// training in approved techniques and de-escalation.
//
// Scoring model:
//   restraintQuality          25  — de-escalation, debrief, body-map, parent-notified
//   restraintCompliance       25  — documentation, timely recording, debrief, category diversity
//   restraintPolicy           25  — governance framework completeness (7 booleans)
//   staffReadiness            25  — training across 6 competency areas
//   TOTAL                    100
//
// Rating thresholds:
//   >= 80  outstanding
//   >= 60  good
//   >= 40  requires_improvement
//   <  40  inadequate
//
// Regulatory basis:
//   - CHR 2015 Reg 20 — Restraint and deprivation of liberty
//   - CHR 2015 Reg 19 — Behaviour management
//   - CHR 2015 Reg 35 — Behaviour management record
//   - CHR 2015 Reg 40(4)(a) — Notification to Ofsted
//   - SCCIF — Safety: use of restraint
//   - DfE 2019 — Reducing the need for restraint
//   - Children Act 1989 s.22 — Duty to safeguard welfare
//
// No AI. No external calls. Pure input -> output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type RestraintCategory =
  | "physical_intervention"
  | "de_escalation"
  | "post_incident_debrief"
  | "medical_check"
  | "body_map_record"
  | "notification_to_parent"
  | "notification_to_ofsted"
  | "review_of_technique";

export type RestraintOutcome =
  | "de_escalation_successful"
  | "restraint_applied"
  | "injury_reported"
  | "no_further_action"
  | "not_applicable";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const restraintCategoryLabels: Record<RestraintCategory, string> = {
  physical_intervention: "Physical Intervention",
  de_escalation: "De-escalation",
  post_incident_debrief: "Post-Incident Debrief",
  medical_check: "Medical Check",
  body_map_record: "Body Map Record",
  notification_to_parent: "Notification to Parent",
  notification_to_ofsted: "Notification to Ofsted",
  review_of_technique: "Review of Technique",
};

const restraintOutcomeLabels: Record<RestraintOutcome, string> = {
  de_escalation_successful: "De-escalation Successful",
  restraint_applied: "Restraint Applied",
  injury_reported: "Injury Reported",
  no_further_action: "No Further Action",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// ── Label Getters ──────────────────────────────────────────────────────────

export function getRestraintCategoryLabel(cat: RestraintCategory): string {
  return restraintCategoryLabels[cat];
}

export function getRestraintOutcomeLabel(outcome: RestraintOutcome): string {
  return restraintOutcomeLabels[outcome];
}

export function getRatingLabel(r: Rating): string {
  return ratingLabels[r];
}

// ── Input Records ──────────────────────────────────────────────────────────

export interface RestraintRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: RestraintCategory;
  outcome: RestraintOutcome;
  // Quality flags (4)
  deEscalationAttempted: boolean;       // quality rate 1, weight 7
  debriefCompleted: boolean;            // quality rate 2, weight 6
  bodyMapRecorded: boolean;             // quality rate 3, weight 6
  parentNotified: boolean;              // quality rate 4, weight 6
  // Compliance flags (2 — other 2 are computed)
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface RestraintPolicy {
  restraintPolicy: boolean;             // 4
  deEscalationPolicy: boolean;          // 4
  postIncidentDebriefPolicy: boolean;   // 4
  bodyMapPolicy: boolean;               // 4
  notificationProcedure: boolean;       // 3
  techniqueReviewPolicy: boolean;       // 3
  reductionStrategyPolicy: boolean;     // 3
}

export interface StaffRestraintTraining {
  staffId: string;
  approvedTechniqueTraining: boolean;   // 6
  deEscalationSkills: boolean;          // 5
  postIncidentDebrief: boolean;         // 5
  bodyMapRecording: boolean;            // 4
  notificationProcedures: boolean;      // 3
  reductionStrategyKnowledge: boolean;  // 2
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface RestraintQualityResult {
  overallScore: number;
  rating: Rating;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  deEscalationAttemptedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  debriefCompletedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  bodyMapRecordedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  parentNotifiedRate: number | null;
}

export interface RestraintComplianceResult {
  overallScore: number;
  rating: Rating;
  /** null when the population is empty — nothing measured, not 0%. */
  documentationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  timelyRecordingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  debriefCompletedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  categoryDiversityRatio: number | null;
}

export interface RestraintPolicyResult {
  overallScore: number;
  rating: Rating;
  restraintPolicy: boolean;
  deEscalationPolicy: boolean;
  postIncidentDebriefPolicy: boolean;
  bodyMapPolicy: boolean;
  notificationProcedure: boolean;
  techniqueReviewPolicy: boolean;
  reductionStrategyPolicy: boolean;
}

export interface StaffRestraintReadinessResult {
  overallScore: number;
  rating: Rating;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  approvedTechniqueTrainingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  deEscalationSkillsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  postIncidentDebriefRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  bodyMapRecordingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  notificationProceduresRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  reductionStrategyKnowledgeRate: number | null;
}

export interface ChildRestraintProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  deEscalationAttemptedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  debriefCompletedRate: number | null;
  categoriesCovered: string[];
  overallScore: number;
}

export interface RestraintIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  restraintQuality: RestraintQualityResult;
  restraintCompliance: RestraintComplianceResult;
  restraintPolicy: RestraintPolicyResult;
  staffReadiness: StaffRestraintReadinessResult;
  childProfiles: ChildRestraintProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_CATEGORIES: RestraintCategory[] = [
  "physical_intervention",
  "de_escalation",
  "post_incident_debrief",
  "medical_check",
  "body_map_record",
  "notification_to_parent",
  "notification_to_ofsted",
  "review_of_technique",
];

// ── Evaluator 1: Restraint Quality (0-25) ──────────────────────────────────

export function evaluateRestraintQuality(records: RestraintRecord[]): RestraintQualityResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", totalRecords: 0, deEscalationAttemptedRate: null, debriefCompletedRate: null, bodyMapRecordedRate: null, parentNotifiedRate: null };
  }

  const deEscalationAttemptedRate = rate(records.filter((r) => r.deEscalationAttempted).length, total);
  const debriefCompletedRate = rate(records.filter((r) => r.debriefCompleted).length, total);
  const bodyMapRecordedRate = rate(records.filter((r) => r.bodyMapRecorded).length, total);
  const parentNotifiedRate = rate(records.filter((r) => r.parentNotified).length, total);

  // Weighted: deEscalationAttemptedRate 7 + debriefCompletedRate 6 + bodyMapRecordedRate 6 + parentNotifiedRate 6 = 25
  const raw = (deEscalationAttemptedRate! / 100) * 7 + (debriefCompletedRate! / 100) * 6 + (bodyMapRecordedRate! / 100) * 6 + (parentNotifiedRate! / 100) * 6;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalRecords: total, deEscalationAttemptedRate, debriefCompletedRate, bodyMapRecordedRate, parentNotifiedRate };
}

// ── Evaluator 2: Restraint Compliance (0-25) ───────────────────────────────

export function evaluateRestraintCompliance(records: RestraintRecord[]): RestraintComplianceResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", documentationRate: null, timelyRecordingRate: null, debriefCompletedRate: null, categoryDiversityRatio: 0 };
  }

  const documentationRate = rate(records.filter((r) => r.documentationComplete).length, total);
  const timelyRecordingRate = rate(records.filter((r) => r.timelyRecording).length, total);
  const debriefCompletedRate = rate(records.filter((r) => r.debriefCompleted).length, total);

  const uniqueCategories = new Set(records.map((r) => r.category)).size;
  const categoryDiversityRatio = rate(uniqueCategories, ALL_CATEGORIES.length);

  // Weighted: documentationRate 8 + timelyRecordingRate 7 + debriefCompletedRate 5 + categoryDiversityRatio 5 = 25
  const raw = (documentationRate! / 100) * 8 + (timelyRecordingRate! / 100) * 7 + (debriefCompletedRate! / 100) * 5 + ((categoryDiversityRatio ?? 0) / 100) * 5;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), documentationRate, timelyRecordingRate, debriefCompletedRate, categoryDiversityRatio };
}

// ── Evaluator 3: Restraint Policy (0-25) ───────────────────────────────────

export function evaluateRestraintPolicy(policy: RestraintPolicy | null): RestraintPolicyResult {
  if (!policy) {
    return { overallScore: 0, rating: "inadequate", restraintPolicy: false, deEscalationPolicy: false, postIncidentDebriefPolicy: false, bodyMapPolicy: false, notificationProcedure: false, techniqueReviewPolicy: false, reductionStrategyPolicy: false };
  }

  // First 4 at 4 points, last 3 at 3 points = 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.restraintPolicy) score += 4;
  if (policy.deEscalationPolicy) score += 4;
  if (policy.postIncidentDebriefPolicy) score += 4;
  if (policy.bodyMapPolicy) score += 4;
  if (policy.notificationProcedure) score += 3;
  if (policy.techniqueReviewPolicy) score += 3;
  if (policy.reductionStrategyPolicy) score += 3;

  return {
    overallScore: score,
    rating: getRating(score * 4),
    restraintPolicy: policy.restraintPolicy,
    deEscalationPolicy: policy.deEscalationPolicy,
    postIncidentDebriefPolicy: policy.postIncidentDebriefPolicy,
    bodyMapPolicy: policy.bodyMapPolicy,
    notificationProcedure: policy.notificationProcedure,
    techniqueReviewPolicy: policy.techniqueReviewPolicy,
    reductionStrategyPolicy: policy.reductionStrategyPolicy,
  };
}

// ── Evaluator 4: Staff Restraint Readiness (0-25) ──────────────────────────

export function evaluateStaffRestraintReadiness(staff: StaffRestraintTraining[]): StaffRestraintReadinessResult {
  const count = staff.length;
  if (count === 0) {
    return { overallScore: 0, rating: "inadequate", totalStaff: 0, approvedTechniqueTrainingRate: null, deEscalationSkillsRate: null, postIncidentDebriefRate: null, bodyMapRecordingRate: null, notificationProceduresRate: null, reductionStrategyKnowledgeRate: null };
  }

  const approvedTechniqueTrainingRate = rate(staff.filter((s) => s.approvedTechniqueTraining).length, count);
  const deEscalationSkillsRate = rate(staff.filter((s) => s.deEscalationSkills).length, count);
  const postIncidentDebriefRate = rate(staff.filter((s) => s.postIncidentDebrief).length, count);
  const bodyMapRecordingRate = rate(staff.filter((s) => s.bodyMapRecording).length, count);
  const notificationProceduresRate = rate(staff.filter((s) => s.notificationProcedures).length, count);
  const reductionStrategyKnowledgeRate = rate(staff.filter((s) => s.reductionStrategyKnowledge).length, count);

  // Weighted: 6+5+5+4+3+2 = 25
  const raw =
    (approvedTechniqueTrainingRate! / 100) * 6 +
    (deEscalationSkillsRate! / 100) * 5 +
    (postIncidentDebriefRate! / 100) * 5 +
    (bodyMapRecordingRate! / 100) * 4 +
    (notificationProceduresRate! / 100) * 3 +
    (reductionStrategyKnowledgeRate! / 100) * 2;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalStaff: count, approvedTechniqueTrainingRate, deEscalationSkillsRate, postIncidentDebriefRate, bodyMapRecordingRate, notificationProceduresRate, reductionStrategyKnowledgeRate };
}

// ── Child Profiles (0-10) ─────────────────────────────────────────────────

export function buildChildRestraintProfiles(records: RestraintRecord[]): ChildRestraintProfile[] {
  const grouped = new Map<string, RestraintRecord[]>();
  for (const r of records) {
    const arr = grouped.get(r.childId) || [];
    arr.push(r);
    grouped.set(r.childId, arr);
  }

  const profiles: ChildRestraintProfile[] = [];
  for (const [childId, recs] of grouped) {
    const childName = recs[0].childName;
    const totalRecords = recs.length;

    const deEscalationAttemptedRate = rate(recs.filter((r) => r.deEscalationAttempted).length, totalRecords);
    const debriefCompletedRate = rate(recs.filter((r) => r.debriefCompleted).length, totalRecords);

    const catsSet = new Set(recs.map((r) => r.category));
    const categoriesCovered = [...catsSet];

    // Scoring: freq [>=10->2, >=5->1] + rate1 deEscalationAttemptedRate [>=80->3, >=60->2, >=40->1] + rate2 debriefCompletedRate [same] + diversity [>=4->2, >=2->1]
    let score = 0;

    if (totalRecords >= 10) score += 2;
    else if (totalRecords >= 5) score += 1;

    if (meets(deEscalationAttemptedRate, 80)) score += 3;
    else if (meets(deEscalationAttemptedRate, 60)) score += 2;
    else if (meets(deEscalationAttemptedRate, 40)) score += 1;

    if (meets(debriefCompletedRate, 80)) score += 3;
    else if (meets(debriefCompletedRate, 60)) score += 2;
    else if (meets(debriefCompletedRate, 40)) score += 1;

    const catCount = categoriesCovered.length;
    if (catCount >= 4) score += 2;
    else if (catCount >= 2) score += 1;

    profiles.push({
      childId,
      childName,
      totalRecords,
      deEscalationAttemptedRate,
      debriefCompletedRate,
      categoriesCovered,
      overallScore: Math.min(10, score),
    });
  }

  return profiles;
}

// ── Master Intelligence Generator ─────────────────────────────────────────

export function generateRestraintIntelligence(input: {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: RestraintRecord[];
  policy: RestraintPolicy | null;
  staff: StaffRestraintTraining[];
}): RestraintIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const restraintQuality = evaluateRestraintQuality(records);
  const restraintCompliance = evaluateRestraintCompliance(records);
  const restraintPolicy = evaluateRestraintPolicy(policy);
  const staffReadiness = evaluateStaffRestraintReadiness(staff);
  const childProfiles = buildChildRestraintProfiles(records);

  const overallScore = Math.min(
    100,
    restraintQuality.overallScore + restraintCompliance.overallScore + restraintPolicy.overallScore + staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  // Strengths (>=80%)
  const strengths: string[] = [];
  if (meets(restraintQuality.deEscalationAttemptedRate, 80)) strengths.push("De-escalation is consistently attempted before any physical intervention");
  if (meets(restraintQuality.debriefCompletedRate, 80)) strengths.push("Post-incident debriefs are routinely completed with children and staff");
  if (meets(restraintQuality.bodyMapRecordedRate, 80)) strengths.push("Body maps are consistently recorded following incidents");
  if (meets(restraintQuality.parentNotifiedRate, 80)) strengths.push("Parents and carers are promptly notified of restraint incidents");
  if (meets(restraintCompliance.documentationRate, 80)) strengths.push("Restraint documentation is thorough and complete");
  if (meets(restraintCompliance.timelyRecordingRate, 80)) strengths.push("Incident records are completed within required timescales");
  if (meets(staffReadiness.approvedTechniqueTrainingRate, 80)) strengths.push("Staff are well trained in approved restraint techniques");
  if (meets(staffReadiness.deEscalationSkillsRate, 80)) strengths.push("Staff demonstrate strong de-escalation skills");

  // Areas for improvement (<60%)
  const areasForImprovement: string[] = [];
  if (below(restraintQuality.deEscalationAttemptedRate, 60)) areasForImprovement.push("De-escalation is not consistently attempted before physical intervention");
  if (below(restraintQuality.debriefCompletedRate, 60)) areasForImprovement.push("Post-incident debriefs are not routinely completed");
  if (below(restraintQuality.bodyMapRecordedRate, 60)) areasForImprovement.push("Body maps are not consistently recorded following incidents");
  if (below(restraintQuality.parentNotifiedRate, 60)) areasForImprovement.push("Parents and carers are not consistently notified of incidents");
  if (below(restraintCompliance.documentationRate, 60)) areasForImprovement.push("Restraint documentation is incomplete or inconsistent");
  if (below(restraintCompliance.timelyRecordingRate, 60)) areasForImprovement.push("Incident records are not being completed promptly");
  if (below(staffReadiness.approvedTechniqueTrainingRate, 60)) areasForImprovement.push("Staff need more training in approved restraint techniques");
  if (below(staffReadiness.deEscalationSkillsRate, 60)) areasForImprovement.push("Staff de-escalation skills need development");

  // Actions
  const actions: string[] = [];
  if (restraintPolicy.overallScore === 0) actions.push("URGENT: Establish a restraint policy — CHR 2015 Reg 20 requires a documented restraint reduction strategy and approved techniques framework");
  if (staffReadiness.overallScore === 0) actions.push("URGENT: Provide approved technique training to all staff — all staff must be certified in recognised restraint techniques before any physical intervention");
  if (below(restraintQuality.deEscalationAttemptedRate, 50)) actions.push("Review de-escalation practice — Reg 19 requires de-escalation to be attempted before any restraint");
  if (below(restraintQuality.debriefCompletedRate, 50)) actions.push("Ensure post-incident debriefs are completed — Reg 35 requires a full debrief following every incident");
  if (below(restraintCompliance.documentationRate, 50)) actions.push("Improve restraint documentation — all incidents must be fully recorded per Reg 35");
  if (below(restraintCompliance.timelyRecordingRate, 50)) actions.push("Review recording timescales — incident records should be completed within 24 hours");
  if (below(restraintQuality.bodyMapRecordedRate, 50)) actions.push("Ensure body maps are completed following every incident — this is a safeguarding requirement");
  if (below(staffReadiness.approvedTechniqueTrainingRate, 50)) actions.push("Schedule refresher training on approved techniques for all staff");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 20 — Restraint and deprivation of liberty",
    "CHR 2015 Reg 19 — Behaviour management",
    "CHR 2015 Reg 35 — Behaviour management record",
    "CHR 2015 Reg 40(4)(a) — Notification to Ofsted",
    "SCCIF — Safety: use of restraint",
    "DfE 2019 — Reducing the need for restraint",
    "Children Act 1989 s.22 — Duty to safeguard welfare",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    restraintQuality,
    restraintCompliance,
    restraintPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
