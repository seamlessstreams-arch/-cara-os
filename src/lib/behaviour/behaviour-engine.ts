import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// Cara Behaviour Intelligence Engine
//
// Deterministic engine for evaluating behaviour management quality in
// children's homes — positive behaviour strategies, de-escalation,
// behaviour support plans, and restraint reduction.
//
// Aligned to:
//   - CHR 2015 Reg 19 — Behaviour management
//   - CHR 2015 Reg 20 — Restraint (last resort only)
//   - CHR 2015 Reg 35 — Behaviour management policy
//   - SCCIF — Children's behaviour is well managed using positive strategies
//   - Reducing the Need for Restraint and Restrictive Intervention (DfE 2019)
//   - Children Act 1989 — Welfare of the child
//   - UNCRC Article 37 — Protection from cruel treatment
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type BehaviourCategory =
  | "positive_reinforcement"
  | "de_escalation"
  | "behaviour_support_plan"
  | "restorative_practice"
  | "risk_assessment"
  | "therapeutic_intervention"
  | "staff_debriefing"
  | "child_consultation";

export type BehaviourOutcome =
  | "successful"
  | "partially_successful"
  | "unsuccessful"
  | "escalated"
  | "ongoing";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Input Records ──────────────────────────────────────────────────────────

export interface BehaviourRecord {
  id: string;
  childId: string;
  childName: string;
  recordDate: string;
  category: BehaviourCategory;
  positiveApproachUsed: boolean;
  deEscalationAttempted: boolean;
  childViewCaptured: boolean;
  supportPlanFollowed: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface BehaviourPolicy {
  id: string;
  behaviourManagementPolicy: boolean;
  positiveReinforcementFramework: boolean;
  deEscalationProtocol: boolean;
  restraintReductionPlan: boolean;
  childParticipationGuidance: boolean;
  debriefingProcedure: boolean;
  reviewSchedule: boolean;
}

export interface StaffBehaviourTraining {
  id: string;
  staffId: string;
  staffName: string;
  positiveApproaches: boolean;
  deEscalationSkills: boolean;
  traumaInformedPractice: boolean;
  restorativePractice: boolean;
  riskAssessment: boolean;
  recordKeeping: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface BehaviourQualityResult {
  overallScore: number;
  rating: Rating;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  positiveApproachRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  deEscalationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childViewRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  supportPlanRate: number | null;
}

export interface BehaviourComplianceResult {
  overallScore: number;
  rating: Rating;
  /** null when the population is empty — nothing measured, not 0%. */
  documentationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  timelyRecordingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  supportPlanFollowedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  categoryDiversityRatio: number | null;
}

export interface BehaviourPolicyResult {
  overallScore: number;
  rating: Rating;
  behaviourManagementPolicy: boolean;
  positiveReinforcementFramework: boolean;
  deEscalationProtocol: boolean;
  restraintReductionPlan: boolean;
  childParticipationGuidance: boolean;
  debriefingProcedure: boolean;
  reviewSchedule: boolean;
}

export interface StaffBehaviourReadinessResult {
  overallScore: number;
  rating: Rating;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  positiveApproachesRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  deEscalationSkillsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  traumaInformedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  restorativePracticeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  riskAssessmentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  recordKeepingRate: number | null;
}

export interface ChildBehaviourProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  positiveApproachRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childViewRate: number | null;
  categoriesCovered: string[];
  overallScore: number;
}

export interface BehaviourIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  behaviourQuality: BehaviourQualityResult;
  behaviourCompliance: BehaviourComplianceResult;
  behaviourPolicy: BehaviourPolicyResult;
  staffReadiness: StaffBehaviourReadinessResult;
  childProfiles: ChildBehaviourProfile[];
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

export function getBehaviourCategoryLabel(cat: BehaviourCategory): string {
  const labels: Record<BehaviourCategory, string> = {
    positive_reinforcement: "Positive Reinforcement",
    de_escalation: "De-escalation",
    behaviour_support_plan: "Behaviour Support Plan",
    restorative_practice: "Restorative Practice",
    risk_assessment: "Risk Assessment",
    therapeutic_intervention: "Therapeutic Intervention",
    staff_debriefing: "Staff Debriefing",
    child_consultation: "Child Consultation",
  };
  return labels[cat] ?? cat;
}

export function getBehaviourOutcomeLabel(outcome: BehaviourOutcome): string {
  const labels: Record<BehaviourOutcome, string> = {
    successful: "Successful",
    partially_successful: "Partially Successful",
    unsuccessful: "Unsuccessful",
    escalated: "Escalated",
    ongoing: "Ongoing",
  };
  return labels[outcome] ?? outcome;
}

export function getRatingLabel(r: Rating): string {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_CATEGORIES: BehaviourCategory[] = [
  "positive_reinforcement", "de_escalation", "behaviour_support_plan",
  "restorative_practice", "risk_assessment", "therapeutic_intervention",
  "staff_debriefing", "child_consultation",
];

// ── Evaluator 1: Behaviour Quality (0-25) ─────────────────────────────────

export function evaluateBehaviourQuality(records: BehaviourRecord[]): BehaviourQualityResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", totalRecords: 0, positiveApproachRate: null, deEscalationRate: null, childViewRate: null, supportPlanRate: null };
  }

  const positiveApproachRate = rate(records.filter((r) => r.positiveApproachUsed).length, total);
  const deEscalationRate = rate(records.filter((r) => r.deEscalationAttempted).length, total);
  const childViewRate = rate(records.filter((r) => r.childViewCaptured).length, total);
  const supportPlanRate = rate(records.filter((r) => r.supportPlanFollowed).length, total);

  // Weighted: positiveApproachRate 7 + deEscalationRate 6 + childViewRate 6 + supportPlanRate 6 = 25
  const raw = ((positiveApproachRate ?? 0) / 100) * 7 + ((deEscalationRate ?? 0) / 100) * 6 + ((childViewRate ?? 0) / 100) * 6 + ((supportPlanRate ?? 0) / 100) * 6;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalRecords: total, positiveApproachRate, deEscalationRate, childViewRate, supportPlanRate };
}

// ── Evaluator 2: Behaviour Compliance (0-25) ──────────────────────────────

export function evaluateBehaviourCompliance(records: BehaviourRecord[]): BehaviourComplianceResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", documentationRate: null, timelyRecordingRate: null, supportPlanFollowedRate: null, categoryDiversityRatio: 0 };
  }

  const documentationRate = rate(records.filter((r) => r.documentationComplete).length, total);
  const timelyRecordingRate = rate(records.filter((r) => r.timelyRecording).length, total);
  const supportPlanFollowedRate = rate(records.filter((r) => r.supportPlanFollowed).length, total);

  const uniqueCategories = new Set(records.map((r) => r.category)).size;
  const categoryDiversityRatio = rate(uniqueCategories, ALL_CATEGORIES.length);

  // Weighted: documentationRate 8 + timelyRecordingRate 7 + supportPlanFollowedRate 5 + categoryDiversityRatio 5 = 25
  const raw = ((documentationRate ?? 0) / 100) * 8 + ((timelyRecordingRate ?? 0) / 100) * 7 + ((supportPlanFollowedRate ?? 0) / 100) * 5 + ((categoryDiversityRatio ?? 0) / 100) * 5;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), documentationRate, timelyRecordingRate, supportPlanFollowedRate, categoryDiversityRatio };
}

// ── Evaluator 3: Policy & Governance (0-25) ────────────────────────────────

export function evaluateBehaviourPolicy(policy: BehaviourPolicy | null): BehaviourPolicyResult {
  if (!policy) {
    return { overallScore: 0, rating: "inadequate", behaviourManagementPolicy: false, positiveReinforcementFramework: false, deEscalationProtocol: false, restraintReductionPlan: false, childParticipationGuidance: false, debriefingProcedure: false, reviewSchedule: false };
  }

  // First 4 at 4 points, last 3 at 3 points = 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.behaviourManagementPolicy) score += 4;
  if (policy.positiveReinforcementFramework) score += 4;
  if (policy.deEscalationProtocol) score += 4;
  if (policy.restraintReductionPlan) score += 4;
  if (policy.childParticipationGuidance) score += 3;
  if (policy.debriefingProcedure) score += 3;
  if (policy.reviewSchedule) score += 3;

  return {
    overallScore: score,
    rating: getRating(score * 4),
    behaviourManagementPolicy: policy.behaviourManagementPolicy,
    positiveReinforcementFramework: policy.positiveReinforcementFramework,
    deEscalationProtocol: policy.deEscalationProtocol,
    restraintReductionPlan: policy.restraintReductionPlan,
    childParticipationGuidance: policy.childParticipationGuidance,
    debriefingProcedure: policy.debriefingProcedure,
    reviewSchedule: policy.reviewSchedule,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ────────────────────────────────────

export function evaluateStaffBehaviourReadiness(staff: StaffBehaviourTraining[]): StaffBehaviourReadinessResult {
  const count = staff.length;
  if (count === 0) {
    return { overallScore: 0, rating: "inadequate", totalStaff: 0, positiveApproachesRate: null, deEscalationSkillsRate: null, traumaInformedRate: null, restorativePracticeRate: null, riskAssessmentRate: null, recordKeepingRate: null };
  }

  const positiveApproachesRate = rate(staff.filter((s) => s.positiveApproaches).length, count);
  const deEscalationSkillsRate = rate(staff.filter((s) => s.deEscalationSkills).length, count);
  const traumaInformedRate = rate(staff.filter((s) => s.traumaInformedPractice).length, count);
  const restorativePracticeRate = rate(staff.filter((s) => s.restorativePractice).length, count);
  const riskAssessmentRate = rate(staff.filter((s) => s.riskAssessment).length, count);
  const recordKeepingRate = rate(staff.filter((s) => s.recordKeeping).length, count);

  // Weighted: 6+5+5+4+3+2 = 25
  const raw =
    ((positiveApproachesRate ?? 0) / 100) * 6 +
    ((deEscalationSkillsRate ?? 0) / 100) * 5 +
    ((traumaInformedRate ?? 0) / 100) * 5 +
    ((restorativePracticeRate ?? 0) / 100) * 4 +
    ((riskAssessmentRate ?? 0) / 100) * 3 +
    ((recordKeepingRate ?? 0) / 100) * 2;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalStaff: count, positiveApproachesRate, deEscalationSkillsRate, traumaInformedRate, restorativePracticeRate, riskAssessmentRate, recordKeepingRate };
}

// ── Child Profiles (0-10) ──────────────────────────────────────────────────

export function buildChildBehaviourProfiles(records: BehaviourRecord[]): ChildBehaviourProfile[] {
  const grouped = new Map<string, BehaviourRecord[]>();
  for (const r of records) {
    const arr = grouped.get(r.childId) || [];
    arr.push(r);
    grouped.set(r.childId, arr);
  }

  const profiles: ChildBehaviourProfile[] = [];
  for (const [childId, recs] of grouped) {
    const childName = recs[0].childName;
    const totalRecords = recs.length;

    const positiveApproachRate = rate(recs.filter((r) => r.positiveApproachUsed).length, totalRecords);
    const childViewRate = rate(recs.filter((r) => r.childViewCaptured).length, totalRecords);

    const catsSet = new Set(recs.map((r) => r.category));
    const categoriesCovered = [...catsSet];

    // Scoring: freq [>=10→2, >=5→1] + rate1 positiveApproachRate [>=80→3, >=60→2, >=40→1] + rate2 childViewRate [same] + diversity [>=4→2, >=2→1]
    let score = 0;

    if (totalRecords >= 10) score += 2;
    else if (totalRecords >= 5) score += 1;

    if (meets(positiveApproachRate, 80)) score += 3;
    else if (meets(positiveApproachRate, 60)) score += 2;
    else if (meets(positiveApproachRate, 40)) score += 1;

    if (meets(childViewRate, 80)) score += 3;
    else if (meets(childViewRate, 60)) score += 2;
    else if (meets(childViewRate, 40)) score += 1;

    const catCount = categoriesCovered.length;
    if (catCount >= 4) score += 2;
    else if (catCount >= 2) score += 1;

    profiles.push({
      childId,
      childName,
      totalRecords,
      positiveApproachRate,
      childViewRate,
      categoriesCovered,
      overallScore: Math.min(10, score),
    });
  }

  return profiles;
}

// ── Master Intelligence Generator ──────────────────────────────────────────

export function generateBehaviourIntelligence(
  records: BehaviourRecord[],
  policy: BehaviourPolicy | null,
  staff: StaffBehaviourTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): BehaviourIntelligence {
  const behaviourQuality = evaluateBehaviourQuality(records);
  const behaviourCompliance = evaluateBehaviourCompliance(records);
  const behaviourPolicy = evaluateBehaviourPolicy(policy);
  const staffReadiness = evaluateStaffBehaviourReadiness(staff);
  const childProfiles = buildChildBehaviourProfiles(records);

  const overallScore = Math.min(
    100,
    behaviourQuality.overallScore + behaviourCompliance.overallScore + behaviourPolicy.overallScore + staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  // Strengths (>=80%)
  const strengths: string[] = [];
  if (meets(behaviourQuality.positiveApproachRate, 80)) strengths.push("Positive approaches are consistently used in behaviour management");
  if (meets(behaviourQuality.deEscalationRate, 80)) strengths.push("De-escalation is routinely attempted before any restrictive intervention");
  if (meets(behaviourQuality.childViewRate, 80)) strengths.push("Children's views are consistently captured during behaviour incidents");
  if (meets(behaviourQuality.supportPlanRate, 80)) strengths.push("Behaviour support plans are consistently followed");
  if (meets(behaviourCompliance.documentationRate, 80)) strengths.push("Behaviour incident documentation is thorough and complete");
  if (meets(behaviourCompliance.timelyRecordingRate, 80)) strengths.push("Behaviour records are completed in a timely manner");
  if (meets(staffReadiness.positiveApproachesRate, 80)) strengths.push("Staff are well trained in positive behaviour approaches");
  if (meets(staffReadiness.deEscalationSkillsRate, 80)) strengths.push("Strong de-escalation skills across the team");

  // Areas for improvement (<60%)
  const areasForImprovement: string[] = [];
  if (below(behaviourQuality.positiveApproachRate, 60)) areasForImprovement.push("Positive approaches are not being consistently used");
  if (below(behaviourQuality.deEscalationRate, 60)) areasForImprovement.push("De-escalation is not routinely attempted");
  if (below(behaviourQuality.childViewRate, 60)) areasForImprovement.push("Children's views are not being captured during behaviour incidents");
  if (below(behaviourQuality.supportPlanRate, 60)) areasForImprovement.push("Behaviour support plans are not consistently followed");
  if (below(behaviourCompliance.documentationRate, 60)) areasForImprovement.push("Behaviour documentation is incomplete or inconsistent");
  if (below(behaviourCompliance.timelyRecordingRate, 60)) areasForImprovement.push("Behaviour records are not being completed promptly");
  if (below(staffReadiness.positiveApproachesRate, 60)) areasForImprovement.push("Staff need more training in positive behaviour approaches");
  if (below(staffReadiness.deEscalationSkillsRate, 60)) areasForImprovement.push("Staff de-escalation skills require development");

  // Actions
  const actions: string[] = [];
  if (behaviourPolicy.overallScore === 0) actions.push("URGENT: Establish a behaviour management policy — CHR 2015 Reg 19/35 require documented positive behaviour strategies");
  if (staffReadiness.overallScore === 0) actions.push("URGENT: Provide behaviour management training to all staff — positive approaches depend on skilled practitioners");
  if (below(behaviourQuality.positiveApproachRate, 50)) actions.push("Implement structured positive reinforcement programmes for all children — positive strategies must be the primary approach (Reg 19)");
  if (below(behaviourQuality.deEscalationRate, 50)) actions.push("Ensure de-escalation is always attempted before restrictive intervention — CHR 2015 Reg 20");
  if (below(behaviourCompliance.documentationRate, 50)) actions.push("Improve behaviour incident documentation — all incidents must be fully recorded");
  if (below(behaviourCompliance.timelyRecordingRate, 50)) actions.push("Review recording timescales — behaviour records should be completed within 24 hours");
  if (below(behaviourQuality.childViewRate, 50)) actions.push("Capture children's views after every behaviour incident — child's voice is essential (SCCIF)");
  if (below(staffReadiness.traumaInformedRate, 50)) actions.push("Provide trauma-informed practice training — behaviour must be understood in context of children's experiences");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 19 — Behaviour management (positive strategies)",
    "CHR 2015 Reg 20 — Restraint (last resort only)",
    "CHR 2015 Reg 35 — Behaviour management policy",
    "SCCIF — Children's behaviour well managed with positive approaches",
    "DfE Reducing the Need for Restraint and Restrictive Intervention (2019)",
    "Children Act 1989 — Welfare of the child",
    "UNCRC Article 37 — Protection from cruel treatment",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    behaviourQuality,
    behaviourCompliance,
    behaviourPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
