/* ──────────────────────────────────────────────────────────────
   Regulatory Self-Assessment Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   compliance of regulatory self-assessment processes in
   children's residential care homes.

   Regulatory basis:
     - CHR 2015 Reg 13 — Leadership and management
     - CHR 2015 Reg 35 — Behaviour management
     - NMS 25 — Management and development
     - SCCIF — Overall effectiveness
     - Children Act 1989 s.22
     - Quality Standards 2015
     - Ofsted self-evaluation guidance

   Scoring model (quality 25 + compliance 25 +
     policy 25 + staff_readiness 25 = 100)

   Rating: outstanding >=80, good >=60, requires_improvement >=40,
           inadequate <40

   No AI. No external calls. Pure input -> output.
   ────────────────────────────────────────────────────────────── */

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type RegSelfAssessmentCategory =
  | "regulation_area_review"
  | "evidence_gathering"
  | "action_plan_tracking"
  | "improvement_monitoring"
  | "external_feedback_integration"
  | "compliance_gap_analysis"
  | "self_assessment_report"
  | "inspection_preparation";

export type RegSelfAssessmentOutcome =
  | "outstanding_evidence"
  | "good_evidence"
  | "partial_evidence"
  | "insufficient_evidence"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const regSelfAssessmentCategoryLabels: Record<RegSelfAssessmentCategory, string> = {
  regulation_area_review: "Regulation Area Review",
  evidence_gathering: "Evidence Gathering",
  action_plan_tracking: "Action Plan Tracking",
  improvement_monitoring: "Improvement Monitoring",
  external_feedback_integration: "External Feedback Integration",
  compliance_gap_analysis: "Compliance Gap Analysis",
  self_assessment_report: "Self-Assessment Report",
  inspection_preparation: "Inspection Preparation",
};

const regSelfAssessmentOutcomeLabels: Record<RegSelfAssessmentOutcome, string> = {
  outstanding_evidence: "Outstanding Evidence",
  good_evidence: "Good Evidence",
  partial_evidence: "Partial Evidence",
  insufficient_evidence: "Insufficient Evidence",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getRegSelfAssessmentCategoryLabel(category: RegSelfAssessmentCategory): string {
  return regSelfAssessmentCategoryLabels[category];
}

export function getRegSelfAssessmentOutcomeLabel(outcome: RegSelfAssessmentOutcome): string {
  return regSelfAssessmentOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface RegSelfAssessmentRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: RegSelfAssessmentCategory;
  outcome: RegSelfAssessmentOutcome;
  evidenceRobust: boolean;
  selfAssessmentAccurate: boolean;
  actionPlanAligned: boolean;
  improvementEvidenced: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface RegSelfAssessmentPolicy {
  selfAssessmentPolicy: boolean;
  evidenceGatheringPolicy: boolean;
  actionPlanPolicy: boolean;
  improvementMonitoringPolicy: boolean;
  externalFeedbackPolicy: boolean;
  inspectionPreparationPolicy: boolean;
  complianceReviewSchedule: boolean;
}

export interface StaffRegSelfAssessmentTraining {
  staffId: string;
  selfAssessmentKnowledge: boolean;
  evidenceGatheringSkills: boolean;
  actionPlanningSkills: boolean;
  regulatoryFrameworkKnowledge: boolean;
  inspectionPreparationSkills: boolean;
  qualityImprovementSkills: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface RegSelfAssessmentQualityResult {
  overallScore: number;
  totalRecords: number;
  evidenceRobustRate: number;
  selfAssessmentAccurateRate: number;
  actionPlanAlignedRate: number;
  improvementEvidencedRate: number;
}

export interface RegSelfAssessmentComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  evidenceRobustRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface RegSelfAssessmentPolicyResult {
  overallScore: number;
  selfAssessmentPolicy: boolean;
  evidenceGatheringPolicy: boolean;
  actionPlanPolicy: boolean;
  improvementMonitoringPolicy: boolean;
  externalFeedbackPolicy: boolean;
  inspectionPreparationPolicy: boolean;
  complianceReviewSchedule: boolean;
}

export interface StaffRegSelfAssessmentReadinessResult {
  overallScore: number;
  totalStaff: number;
  selfAssessmentKnowledgeRate: number;
  evidenceGatheringSkillsRate: number;
  actionPlanningSkillsRate: number;
  regulatoryFrameworkKnowledgeRate: number;
  inspectionPreparationSkillsRate: number;
  qualityImprovementSkillsRate: number;
}

export interface ChildRegSelfAssessmentProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  evidenceRobustRate: number;
  selfAssessmentAccurateRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface RegSelfAssessmentIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  regSelfAssessmentQuality: RegSelfAssessmentQualityResult;
  regSelfAssessmentCompliance: RegSelfAssessmentComplianceResult;
  regSelfAssessmentPolicy: RegSelfAssessmentPolicyResult;
  staffReadiness: StaffRegSelfAssessmentReadinessResult;
  childProfiles: ChildRegSelfAssessmentProfile[];
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

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Quality (0-25) ──────────────────────────────────────────

export function evaluateRegSelfAssessmentQuality(
  records: RegSelfAssessmentRecord[],
): RegSelfAssessmentQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, evidenceRobustRate: 0, selfAssessmentAccurateRate: 0, actionPlanAlignedRate: 0, improvementEvidencedRate: 0 };
  }

  const evidenceRobustRate = pct(records.filter((r) => r.evidenceRobust).length, n);
  const selfAssessmentAccurateRate = pct(records.filter((r) => r.selfAssessmentAccurate).length, n);
  const actionPlanAlignedRate = pct(records.filter((r) => r.actionPlanAligned).length, n);
  const improvementEvidencedRate = pct(records.filter((r) => r.improvementEvidenced).length, n);

  let score = 0;
  score += (evidenceRobustRate / 100) * 7;
  score += (selfAssessmentAccurateRate / 100) * 6;
  score += (actionPlanAlignedRate / 100) * 6;
  score += (improvementEvidencedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, evidenceRobustRate, selfAssessmentAccurateRate, actionPlanAlignedRate, improvementEvidencedRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluateRegSelfAssessmentCompliance(
  records: RegSelfAssessmentRecord[],
): RegSelfAssessmentComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, evidenceRobustRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const evidenceRobustRate = pct(records.filter((r) => r.evidenceRobust).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (evidenceRobustRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, evidenceRobustRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluateRegSelfAssessmentPolicy(
  policy: RegSelfAssessmentPolicy | null,
): RegSelfAssessmentPolicyResult {
  if (policy === null) {
    return { overallScore: 0, selfAssessmentPolicy: false, evidenceGatheringPolicy: false, actionPlanPolicy: false, improvementMonitoringPolicy: false, externalFeedbackPolicy: false, inspectionPreparationPolicy: false, complianceReviewSchedule: false };
  }

  let score = 0;
  if (policy.selfAssessmentPolicy) score += 4;
  if (policy.evidenceGatheringPolicy) score += 4;
  if (policy.actionPlanPolicy) score += 4;
  if (policy.improvementMonitoringPolicy) score += 4;
  if (policy.externalFeedbackPolicy) score += 3;
  if (policy.inspectionPreparationPolicy) score += 3;
  if (policy.complianceReviewSchedule) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    selfAssessmentPolicy: policy.selfAssessmentPolicy,
    evidenceGatheringPolicy: policy.evidenceGatheringPolicy,
    actionPlanPolicy: policy.actionPlanPolicy,
    improvementMonitoringPolicy: policy.improvementMonitoringPolicy,
    externalFeedbackPolicy: policy.externalFeedbackPolicy,
    inspectionPreparationPolicy: policy.inspectionPreparationPolicy,
    complianceReviewSchedule: policy.complianceReviewSchedule,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffRegSelfAssessmentReadiness(
  training: StaffRegSelfAssessmentTraining[],
): StaffRegSelfAssessmentReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, selfAssessmentKnowledgeRate: 0, evidenceGatheringSkillsRate: 0, actionPlanningSkillsRate: 0, regulatoryFrameworkKnowledgeRate: 0, inspectionPreparationSkillsRate: 0, qualityImprovementSkillsRate: 0 };
  }

  const selfAssessmentKnowledgeRate = pct(training.filter((t) => t.selfAssessmentKnowledge).length, n);
  const evidenceGatheringSkillsRate = pct(training.filter((t) => t.evidenceGatheringSkills).length, n);
  const actionPlanningSkillsRate = pct(training.filter((t) => t.actionPlanningSkills).length, n);
  const regulatoryFrameworkKnowledgeRate = pct(training.filter((t) => t.regulatoryFrameworkKnowledge).length, n);
  const inspectionPreparationSkillsRate = pct(training.filter((t) => t.inspectionPreparationSkills).length, n);
  const qualityImprovementSkillsRate = pct(training.filter((t) => t.qualityImprovementSkills).length, n);

  let score = 0;
  score += (selfAssessmentKnowledgeRate / 100) * 6;
  score += (evidenceGatheringSkillsRate / 100) * 5;
  score += (actionPlanningSkillsRate / 100) * 5;
  score += (regulatoryFrameworkKnowledgeRate / 100) * 4;
  score += (inspectionPreparationSkillsRate / 100) * 3;
  score += (qualityImprovementSkillsRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, selfAssessmentKnowledgeRate, evidenceGatheringSkillsRate, actionPlanningSkillsRate, regulatoryFrameworkKnowledgeRate, inspectionPreparationSkillsRate, qualityImprovementSkillsRate };
}

// ── Build Child Reg Self-Assessment Profiles ──────────────────────────────

export function buildChildRegSelfAssessmentProfiles(
  records: RegSelfAssessmentRecord[],
): ChildRegSelfAssessmentProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: RegSelfAssessmentRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const evidenceRobustRate = pct(child.records.filter((r) => r.evidenceRobust).length, totalRecords);
    const selfAssessmentAccurateRate = pct(child.records.filter((r) => r.selfAssessmentAccurate).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (evidenceRobustRate >= 80) rate1Score = 3;
    else if (evidenceRobustRate >= 60) rate1Score = 2;
    else if (evidenceRobustRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (selfAssessmentAccurateRate >= 80) rate2Score = 3;
    else if (selfAssessmentAccurateRate >= 60) rate2Score = 2;
    else if (selfAssessmentAccurateRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, evidenceRobustRate, selfAssessmentAccurateRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateRegSelfAssessmentIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: RegSelfAssessmentRecord[];
  policy: RegSelfAssessmentPolicy | null;
  staff: StaffRegSelfAssessmentTraining[];
}

export function generateRegSelfAssessmentIntelligence(
  input: GenerateRegSelfAssessmentIntelligenceInput,
): RegSelfAssessmentIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => withinPeriod(r.date, periodStart, periodEnd));

  const qualityResult = evaluateRegSelfAssessmentQuality(periodRecords);
  const complianceResult = evaluateRegSelfAssessmentCompliance(periodRecords);
  const policyResult = evaluateRegSelfAssessmentPolicy(policy);
  const staffResult = evaluateStaffRegSelfAssessmentReadiness(staff);

  const childProfiles = buildChildRegSelfAssessmentProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Regulatory self-assessment management rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Regulatory self-assessment management rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Self-assessment quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Self-assessment compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Regulatory self-assessment policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff self-assessment readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.evidenceRobustRate >= 90) strengths.push("Evidence robustness at " + qualityResult.evidenceRobustRate + "%");
  if (periodRecords.length > 0 && qualityResult.selfAssessmentAccurateRate >= 90) strengths.push("Self-assessment accuracy at " + qualityResult.selfAssessmentAccurateRate + "%");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate >= 90) strengths.push("Documentation completeness at " + complianceResult.documentationCompleteRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Regulatory self-assessment management rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Regulatory self-assessment management Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Self-assessment quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Self-assessment compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Regulatory self-assessment policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff self-assessment readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.evidenceRobustRate < 80) areasForImprovement.push("Evidence robustness at " + qualityResult.evidenceRobustRate + "% — must improve for regulatory compliance");
  if (periodRecords.length === 0) areasForImprovement.push("No regulatory self-assessment records — recording must be documented");
  if (policy === null) areasForImprovement.push("No regulatory self-assessment policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff self-assessment training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No regulatory self-assessment policy — develop and implement comprehensive policy immediately");
  if (staff.length === 0) actions.push("URGENT: No staff self-assessment training — schedule training for all staff");
  if (periodRecords.length > 0 && qualityResult.evidenceRobustRate < 50) actions.push("HIGH: Evidence robustness at " + qualityResult.evidenceRobustRate + "% — review evidence gathering procedures");
  if (periodRecords.length > 0 && qualityResult.selfAssessmentAccurateRate < 50) actions.push("HIGH: Self-assessment accuracy at " + qualityResult.selfAssessmentAccurateRate + "% — ensure assessments are thorough and accurate");
  if (periodRecords.length > 0 && qualityResult.actionPlanAlignedRate < 50) actions.push("HIGH: Action plan alignment at " + qualityResult.actionPlanAlignedRate + "% — all action plans must align with identified gaps");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.selfAssessmentKnowledgeRate < 50) actions.push("MEDIUM: Self-assessment knowledge at " + staffResult.selfAssessmentKnowledgeRate + "% — schedule training for staff");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low self-assessment scores — review individual assessment provisions");
  if (actions.length === 0) actions.push("No immediate actions required. Regulatory self-assessment systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 13 — Leadership and management",
    "CHR 2015 Reg 35 — Behaviour management",
    "NMS 25 — Management and development",
    "SCCIF — Overall effectiveness",
    "Children Act 1989 s.22",
    "Quality Standards 2015",
    "Ofsted self-evaluation guidance",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    regSelfAssessmentQuality: qualityResult,
    regSelfAssessmentCompliance: complianceResult,
    regSelfAssessmentPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
