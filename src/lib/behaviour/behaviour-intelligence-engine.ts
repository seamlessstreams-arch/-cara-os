/* ──────────────────────────────────────────────────────────────
   Behaviour Intelligence Engine

   Pure deterministic engine for evaluating the quality of
   behaviour support and management practices in children's
   residential care — positive reinforcement, de-escalation,
   behaviour support plans, restorative practice, physical
   intervention, sanctions, reward systems, and behaviour analysis.

   Regulatory basis:
     - CHR 2015 Reg 35 — Behaviour management
     - CHR 2015 Reg 12 — Protection of children standard
     - CHR 2015 Reg 20 — Restraint
     - NMS 12 — Promoting positive behaviour
     - SCCIF — Experiences and progress
     - Children Act 1989 — Welfare of the child
     - Quality Standards 2015 — Standard 3 (protection)

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type BehaviourIntelligenceCategory =
  | "positive_reinforcement"
  | "de_escalation"
  | "behaviour_support_plan"
  | "restorative_practice"
  | "physical_intervention"
  | "sanctions_review"
  | "reward_system"
  | "behaviour_analysis";

export type BehaviourIntelligenceOutcome =
  | "behaviour_improved"
  | "behaviour_maintained"
  | "partial_improvement"
  | "no_improvement"
  | "not_applicable";

export type BehaviourIntelligenceRating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const behaviourIntelligenceCategoryLabels: Record<BehaviourIntelligenceCategory, string> = {
  positive_reinforcement: "Positive Reinforcement",
  de_escalation: "De-escalation",
  behaviour_support_plan: "Behaviour Support Plan",
  restorative_practice: "Restorative Practice",
  physical_intervention: "Physical Intervention",
  sanctions_review: "Sanctions Review",
  reward_system: "Reward System",
  behaviour_analysis: "Behaviour Analysis",
};

const behaviourIntelligenceOutcomeLabels: Record<BehaviourIntelligenceOutcome, string> = {
  behaviour_improved: "Behaviour Improved",
  behaviour_maintained: "Behaviour Maintained",
  partial_improvement: "Partial Improvement",
  no_improvement: "No Improvement",
  not_applicable: "Not Applicable",
};

const behaviourIntelligenceRatingLabels: Record<BehaviourIntelligenceRating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getBehaviourIntelligenceCategoryLabel(category: BehaviourIntelligenceCategory): string {
  return behaviourIntelligenceCategoryLabels[category];
}

export function getBehaviourIntelligenceOutcomeLabel(outcome: BehaviourIntelligenceOutcome): string {
  return behaviourIntelligenceOutcomeLabels[outcome];
}

export function getBehaviourIntelligenceRatingLabel(rating: BehaviourIntelligenceRating): string {
  return behaviourIntelligenceRatingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface BehaviourIntelligenceRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: BehaviourIntelligenceCategory;
  outcome: BehaviourIntelligenceOutcome;
  childViewIncluded: boolean;
  deEscalationAttempted: boolean;
  positiveReinforcementUsed: boolean;
  supportPlanFollowed: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface BehaviourIntelligencePolicy {
  behaviourSupportPolicy: boolean;
  physicalInterventionPolicy: boolean;
  restorativePracticePolicy: boolean;
  deEscalationFramework: boolean;
  rewardAndSanctionsPolicy: boolean;
  behaviourAnalysisPolicy: boolean;
  postIncidentLearningPolicy: boolean;
}

export interface StaffBehaviourIntelligenceTraining {
  staffId: string;
  behaviourManagementKnowledge: boolean;
  deEscalationSkills: boolean;
  restorativePracticeSkills: boolean;
  physicalInterventionTraining: boolean;
  traumaInformedApproach: boolean;
  behaviourAnalysisSkills: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface BehaviourIntelligenceQualityResult {
  overallScore: number;
  totalRecords: number;
  childViewIncludedRate: number;
  deEscalationAttemptedRate: number;
  positiveReinforcementUsedRate: number;
  supportPlanFollowedRate: number;
}

export interface BehaviourIntelligenceComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  childViewIncludedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface BehaviourIntelligencePolicyResult {
  overallScore: number;
  behaviourSupportPolicy: boolean;
  physicalInterventionPolicy: boolean;
  restorativePracticePolicy: boolean;
  deEscalationFramework: boolean;
  rewardAndSanctionsPolicy: boolean;
  behaviourAnalysisPolicy: boolean;
  postIncidentLearningPolicy: boolean;
}

export interface StaffBehaviourIntelligenceReadinessResult {
  overallScore: number;
  totalStaff: number;
  behaviourManagementKnowledgeRate: number;
  deEscalationSkillsRate: number;
  restorativePracticeSkillsRate: number;
  physicalInterventionTrainingRate: number;
  traumaInformedApproachRate: number;
  behaviourAnalysisSkillsRate: number;
}

export interface ChildBehaviourIntelligenceProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  childViewIncludedRate: number;
  deEscalationAttemptedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface BehaviourIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: BehaviourIntelligenceRating;
  behaviourQuality: BehaviourIntelligenceQualityResult;
  behaviourCompliance: BehaviourIntelligenceComplianceResult;
  behaviourPolicy: BehaviourIntelligencePolicyResult;
  staffReadiness: StaffBehaviourIntelligenceReadinessResult;
  childProfiles: ChildBehaviourIntelligenceProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

export function getRating(score: number): BehaviourIntelligenceRating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Quality (0-25) ────────────────────────────────────────────
// Weights: childViewIncluded 7, deEscalationAttempted 6, positiveReinforcementUsed 6, supportPlanFollowed 6 = 25

export function evaluateBehaviourIntelligenceQuality(
  records: BehaviourIntelligenceRecord[],
): BehaviourIntelligenceQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, childViewIncludedRate: 0, deEscalationAttemptedRate: 0, positiveReinforcementUsedRate: 0, supportPlanFollowedRate: 0 };
  }

  const childViewIncludedRate = pct(records.filter((r) => r.childViewIncluded).length, n);
  const deEscalationAttemptedRate = pct(records.filter((r) => r.deEscalationAttempted).length, n);
  const positiveReinforcementUsedRate = pct(records.filter((r) => r.positiveReinforcementUsed).length, n);
  const supportPlanFollowedRate = pct(records.filter((r) => r.supportPlanFollowed).length, n);

  let score = 0;
  score += (childViewIncludedRate / 100) * 7;
  score += (deEscalationAttemptedRate / 100) * 6;
  score += (positiveReinforcementUsedRate / 100) * 6;
  score += (supportPlanFollowedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, childViewIncludedRate, deEscalationAttemptedRate, positiveReinforcementUsedRate, supportPlanFollowedRate };
}

// ── Evaluator 2: Compliance (0-25) ─────────────────────────────────────────
// Weights: documentationCompleteRate 8, timelyRecordingRate 7, childViewIncludedRate 5, categoryDiversityRatio 5 = 25

export function evaluateBehaviourIntelligenceCompliance(
  records: BehaviourIntelligenceRecord[],
): BehaviourIntelligenceComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, childViewIncludedRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const childViewIncludedRate = pct(records.filter((r) => r.childViewIncluded).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (childViewIncludedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, childViewIncludedRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ─────────────────────────────────────────────
// Weights: 4+4+4+4+3+3+3 = 25

export function evaluateBehaviourIntelligencePolicy(
  policy: BehaviourIntelligencePolicy | null,
): BehaviourIntelligencePolicyResult {
  if (policy === null) {
    return { overallScore: 0, behaviourSupportPolicy: false, physicalInterventionPolicy: false, restorativePracticePolicy: false, deEscalationFramework: false, rewardAndSanctionsPolicy: false, behaviourAnalysisPolicy: false, postIncidentLearningPolicy: false };
  }

  let score = 0;
  if (policy.behaviourSupportPolicy) score += 4;
  if (policy.physicalInterventionPolicy) score += 4;
  if (policy.restorativePracticePolicy) score += 4;
  if (policy.deEscalationFramework) score += 4;
  if (policy.rewardAndSanctionsPolicy) score += 3;
  if (policy.behaviourAnalysisPolicy) score += 3;
  if (policy.postIncidentLearningPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    behaviourSupportPolicy: policy.behaviourSupportPolicy,
    physicalInterventionPolicy: policy.physicalInterventionPolicy,
    restorativePracticePolicy: policy.restorativePracticePolicy,
    deEscalationFramework: policy.deEscalationFramework,
    rewardAndSanctionsPolicy: policy.rewardAndSanctionsPolicy,
    behaviourAnalysisPolicy: policy.behaviourAnalysisPolicy,
    postIncidentLearningPolicy: policy.postIncidentLearningPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ────────────────────────────────────
// Weights: behaviourManagementKnowledge 6, deEscalationSkills 5, restorativePracticeSkills 5,
//          physicalInterventionTraining 4, traumaInformedApproach 3, behaviourAnalysisSkills 2 = 25

export function evaluateStaffBehaviourIntelligenceReadiness(
  training: StaffBehaviourIntelligenceTraining[],
): StaffBehaviourIntelligenceReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, behaviourManagementKnowledgeRate: 0, deEscalationSkillsRate: 0, restorativePracticeSkillsRate: 0, physicalInterventionTrainingRate: 0, traumaInformedApproachRate: 0, behaviourAnalysisSkillsRate: 0 };
  }

  const behaviourManagementKnowledgeRate = pct(training.filter((t) => t.behaviourManagementKnowledge).length, n);
  const deEscalationSkillsRate = pct(training.filter((t) => t.deEscalationSkills).length, n);
  const restorativePracticeSkillsRate = pct(training.filter((t) => t.restorativePracticeSkills).length, n);
  const physicalInterventionTrainingRate = pct(training.filter((t) => t.physicalInterventionTraining).length, n);
  const traumaInformedApproachRate = pct(training.filter((t) => t.traumaInformedApproach).length, n);
  const behaviourAnalysisSkillsRate = pct(training.filter((t) => t.behaviourAnalysisSkills).length, n);

  let score = 0;
  score += (behaviourManagementKnowledgeRate / 100) * 6;
  score += (deEscalationSkillsRate / 100) * 5;
  score += (restorativePracticeSkillsRate / 100) * 5;
  score += (physicalInterventionTrainingRate / 100) * 4;
  score += (traumaInformedApproachRate / 100) * 3;
  score += (behaviourAnalysisSkillsRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, behaviourManagementKnowledgeRate, deEscalationSkillsRate, restorativePracticeSkillsRate, physicalInterventionTrainingRate, traumaInformedApproachRate, behaviourAnalysisSkillsRate };
}

// ── Build Child Behaviour Intelligence Profiles ────────────────────────────
// 0-10: freq [>=10->2, >=5->1] + rate1 childViewIncludedRate [>=80->3, >=60->2, >=40->1]
//       + rate2 deEscalationAttemptedRate [same] + diversity [>=4->2, >=2->1]

export function buildChildBehaviourIntelligenceProfiles(
  records: BehaviourIntelligenceRecord[],
): ChildBehaviourIntelligenceProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: BehaviourIntelligenceRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const childViewIncludedRate = pct(child.records.filter((r) => r.childViewIncluded).length, totalRecords);
    const deEscalationAttemptedRate = pct(child.records.filter((r) => r.deEscalationAttempted).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (childViewIncludedRate >= 80) rate1Score = 3;
    else if (childViewIncludedRate >= 60) rate1Score = 2;
    else if (childViewIncludedRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (deEscalationAttemptedRate >= 80) rate2Score = 3;
    else if (deEscalationAttemptedRate >= 60) rate2Score = 2;
    else if (deEscalationAttemptedRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, childViewIncludedRate, deEscalationAttemptedRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateBehaviourIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: BehaviourIntelligenceRecord[];
  policy: BehaviourIntelligencePolicy | null;
  staff: StaffBehaviourIntelligenceTraining[];
}

export function generateBehaviourIntelligenceReport(
  input: GenerateBehaviourIntelligenceInput,
): BehaviourIntelligenceResult {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => r.date >= periodStart && r.date <= periodEnd);

  const qualityResult = evaluateBehaviourIntelligenceQuality(periodRecords);
  const complianceResult = evaluateBehaviourIntelligenceCompliance(periodRecords);
  const policyResult = evaluateBehaviourIntelligencePolicy(policy);
  const staffResult = evaluateStaffBehaviourIntelligenceReadiness(staff);

  const childProfiles = buildChildBehaviourIntelligenceProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  // Strengths (high scores)
  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Behaviour management practice rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Behaviour management practice rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Behaviour quality practices are strong (" + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Behaviour compliance is strong (" + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Behaviour policy framework is robust (" + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff behaviour management readiness is strong (" + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.childViewIncludedRate >= 90) strengths.push("Child views included at " + qualityResult.childViewIncludedRate + "%");
  if (periodRecords.length > 0 && qualityResult.deEscalationAttemptedRate >= 90) strengths.push("De-escalation attempted at " + qualityResult.deEscalationAttemptedRate + "%");

  // Areas for improvement (low scores)
  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Behaviour management practice rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Behaviour management practice Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Behaviour quality practices need improvement (" + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Behaviour compliance needs improvement (" + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Behaviour policy needs strengthening (" + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff behaviour readiness needs improvement (" + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.childViewIncludedRate < 80) areasForImprovement.push("Child views included at " + qualityResult.childViewIncludedRate + "% — child's perspective must be consistently captured");
  if (periodRecords.length === 0) areasForImprovement.push("No behaviour records — behaviour management must be documented");
  if (policy === null) areasForImprovement.push("No behaviour management policy in place — statutory requirement under CHR 2015 Reg 35");
  if (staff.length === 0) areasForImprovement.push("No staff behaviour training records — training required");

  // Actions
  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No behaviour management policy — develop and implement behaviour support framework immediately (CHR 2015 Reg 35)");
  if (staff.length === 0) actions.push("URGENT: No staff behaviour training — schedule behaviour management training for all care staff");
  if (periodRecords.length > 0 && qualityResult.childViewIncludedRate < 50) actions.push("HIGH: Child views included at " + qualityResult.childViewIncludedRate + "% — all behaviour incidents must capture the child's perspective");
  if (periodRecords.length > 0 && qualityResult.deEscalationAttemptedRate < 50) actions.push("HIGH: De-escalation attempted at " + qualityResult.deEscalationAttemptedRate + "% — ensure de-escalation is always attempted before restrictive intervention (CHR 2015 Reg 20)");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all behaviour incidents must be properly documented");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — behaviour records must be completed promptly");
  if (staff.length > 0 && staffResult.behaviourManagementKnowledgeRate < 50) actions.push("MEDIUM: Behaviour management knowledge at " + staffResult.behaviourManagementKnowledgeRate + "% — schedule training");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low behaviour support scores — review individual behaviour support plans");
  if (actions.length === 0) actions.push("No immediate actions required. Behaviour management systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 35 — Behaviour management",
    "CHR 2015 Reg 12 — Protection of children standard",
    "CHR 2015 Reg 20 — Restraint",
    "NMS 12 — Promoting positive behaviour",
    "SCCIF — Experiences and progress",
    "Children Act 1989 — Welfare of the child",
    "Quality Standards 2015 — Standard 3 (protection)",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    behaviourQuality: qualityResult,
    behaviourCompliance: complianceResult,
    behaviourPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
