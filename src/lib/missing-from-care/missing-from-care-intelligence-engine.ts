/* ──────────────────────────────────────────────────────────────
   Missing-from-Care Intelligence Engine

   Pure deterministic engine for evaluating the quality of
   response to children going missing or absent from care.

   Regulatory basis:
     - CHR 2015 Reg 34 — Absence of child without permission
     - CHR 2015 Reg 12 — Protection of children standard
     - KCSIE 2024 — Children who go missing
     - NMS 5 — Absent children
     - SCCIF — Safety of children
     - Statutory guidance on missing children 2014
     - Working Together 2023 — Multi-agency response

   Scoring: 4 evaluators x 25 = 100. Cap 100.
   Rating: >=80 outstanding, >=60 good, >=40 requires_improvement,
           <40 inadequate.

   No AI. No external calls. Pure input -> output.
   ────────────────────────────────────────────────────────────── */

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type MissingFromCareIntelligenceCategory =
  | "missing_episode_response"
  | "return_home_interview"
  | "risk_assessment_review"
  | "police_notification"
  | "multi_agency_response"
  | "safety_planning"
  | "missing_prevention"
  | "pattern_analysis";

export type MissingFromCareIntelligenceOutcome =
  | "child_found_safe"
  | "child_returned_voluntarily"
  | "concerns_identified"
  | "ongoing_risk"
  | "not_applicable";

export type MissingFromCareIntelligenceRating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const missingFromCareIntelligenceCategoryLabels: Record<MissingFromCareIntelligenceCategory, string> = {
  missing_episode_response: "Missing Episode Response",
  return_home_interview: "Return Home Interview",
  risk_assessment_review: "Risk Assessment Review",
  police_notification: "Police Notification",
  multi_agency_response: "Multi-Agency Response",
  safety_planning: "Safety Planning",
  missing_prevention: "Missing Prevention",
  pattern_analysis: "Pattern Analysis",
};

const missingFromCareIntelligenceOutcomeLabels: Record<MissingFromCareIntelligenceOutcome, string> = {
  child_found_safe: "Child Found Safe",
  child_returned_voluntarily: "Child Returned Voluntarily",
  concerns_identified: "Concerns Identified",
  ongoing_risk: "Ongoing Risk",
  not_applicable: "Not Applicable",
};

const missingFromCareIntelligenceRatingLabels: Record<MissingFromCareIntelligenceRating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getMissingFromCareIntelligenceCategoryLabel(category: MissingFromCareIntelligenceCategory): string {
  return missingFromCareIntelligenceCategoryLabels[category];
}

export function getMissingFromCareIntelligenceOutcomeLabel(outcome: MissingFromCareIntelligenceOutcome): string {
  return missingFromCareIntelligenceOutcomeLabels[outcome];
}

export function getMissingFromCareIntelligenceRatingLabel(rating: MissingFromCareIntelligenceRating): string {
  return missingFromCareIntelligenceRatingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface MissingFromCareIntelligenceRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: MissingFromCareIntelligenceCategory;
  outcome: MissingFromCareIntelligenceOutcome;
  immediateResponseFollowed: boolean;
  policeNotifiedAppropriately: boolean;
  returnInterviewCompleted: boolean;
  safetyPlanUpdated: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface MissingFromCareIntelligencePolicy {
  missingChildrenPolicy: boolean;
  returnHomeInterviewPolicy: boolean;
  policeNotificationProtocol: boolean;
  riskAssessmentFramework: boolean;
  preventionStrategy: boolean;
  multiAgencyMissingProtocol: boolean;
  debriefAndLearningPolicy: boolean;
}

export interface StaffMissingFromCareIntelligenceTraining {
  staffId: string;
  missingResponseProcedures: boolean;
  returnInterviewSkills: boolean;
  riskAssessmentSkills: boolean;
  policeNotificationKnowledge: boolean;
  preventionStrategies: boolean;
  deEscalationSkills: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface MissingFromCareIntelligenceQualityResult {
  overallScore: number;
  totalRecords: number;
  immediateResponseFollowedRate: number;
  policeNotifiedAppropriatelyRate: number;
  returnInterviewCompletedRate: number;
  safetyPlanUpdatedRate: number;
}

export interface MissingFromCareIntelligenceComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  immediateResponseFollowedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface MissingFromCareIntelligencePolicyResult {
  overallScore: number;
  missingChildrenPolicy: boolean;
  returnHomeInterviewPolicy: boolean;
  policeNotificationProtocol: boolean;
  riskAssessmentFramework: boolean;
  preventionStrategy: boolean;
  multiAgencyMissingProtocol: boolean;
  debriefAndLearningPolicy: boolean;
}

export interface StaffMissingFromCareIntelligenceReadinessResult {
  overallScore: number;
  totalStaff: number;
  missingResponseProceduresRate: number;
  returnInterviewSkillsRate: number;
  riskAssessmentSkillsRate: number;
  policeNotificationKnowledgeRate: number;
  preventionStrategiesRate: number;
  deEscalationSkillsRate: number;
}

export interface ChildMissingFromCareIntelligenceProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  immediateResponseFollowedRate: number;
  returnInterviewCompletedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface MissingFromCareIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: MissingFromCareIntelligenceRating;
  quality: MissingFromCareIntelligenceQualityResult;
  compliance: MissingFromCareIntelligenceComplianceResult;
  policy: MissingFromCareIntelligencePolicyResult;
  staffReadiness: StaffMissingFromCareIntelligenceReadinessResult;
  childProfiles: ChildMissingFromCareIntelligenceProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function pctIntel(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

export function getRatingIntel(score: number): MissingFromCareIntelligenceRating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Quality (0-25) ────────────────────────────────────────────
// Weights: immediateResponseFollowed(7) + policeNotifiedAppropriately(6)
//          + returnInterviewCompleted(6) + safetyPlanUpdated(6) = 25

export function evaluateMissingFromCareIntelligenceQuality(
  records: MissingFromCareIntelligenceRecord[],
): MissingFromCareIntelligenceQualityResult {
  const n = records.length;

  if (n === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      immediateResponseFollowedRate: 0,
      policeNotifiedAppropriatelyRate: 0,
      returnInterviewCompletedRate: 0,
      safetyPlanUpdatedRate: 0,
    };
  }

  const immediateResponseFollowedRate = pctIntel(records.filter((r) => r.immediateResponseFollowed).length, n);
  const policeNotifiedAppropriatelyRate = pctIntel(records.filter((r) => r.policeNotifiedAppropriately).length, n);
  const returnInterviewCompletedRate = pctIntel(records.filter((r) => r.returnInterviewCompleted).length, n);
  const safetyPlanUpdatedRate = pctIntel(records.filter((r) => r.safetyPlanUpdated).length, n);

  let score = 0;
  score += (immediateResponseFollowedRate / 100) * 7;
  score += (policeNotifiedAppropriatelyRate / 100) * 6;
  score += (returnInterviewCompletedRate / 100) * 6;
  score += (safetyPlanUpdatedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return {
    overallScore: score,
    totalRecords: n,
    immediateResponseFollowedRate,
    policeNotifiedAppropriatelyRate,
    returnInterviewCompletedRate,
    safetyPlanUpdatedRate,
  };
}

// ── Evaluator 2: Compliance (0-25) ─────────────────────────────────────────
// Weights: documentationCompleteRate(8) + timelyRecordingRate(7)
//          + immediateResponseFollowedRate(5) + categoryDiversityRatio(5) = 25

export function evaluateMissingFromCareIntelligenceCompliance(
  records: MissingFromCareIntelligenceRecord[],
): MissingFromCareIntelligenceComplianceResult {
  const n = records.length;

  if (n === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      documentationCompleteRate: 0,
      timelyRecordingRate: 0,
      immediateResponseFollowedRate: 0,
      categoryDiversityRatio: 0,
      uniqueCategories: 0,
    };
  }

  const documentationCompleteRate = pctIntel(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pctIntel(records.filter((r) => r.timelyRecording).length, n);
  const immediateResponseFollowedRate = pctIntel(records.filter((r) => r.immediateResponseFollowed).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (immediateResponseFollowedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return {
    overallScore: score,
    totalRecords: n,
    documentationCompleteRate,
    timelyRecordingRate,
    immediateResponseFollowedRate,
    categoryDiversityRatio,
    uniqueCategories,
  };
}

// ── Evaluator 3: Policy (0-25) ─────────────────────────────────────────────
// Weights: 4+4+4+4+3+3+3 = 25

export function evaluateMissingFromCareIntelligencePolicy(
  policy: MissingFromCareIntelligencePolicy | null,
): MissingFromCareIntelligencePolicyResult {
  if (policy === null) {
    return {
      overallScore: 0,
      missingChildrenPolicy: false,
      returnHomeInterviewPolicy: false,
      policeNotificationProtocol: false,
      riskAssessmentFramework: false,
      preventionStrategy: false,
      multiAgencyMissingProtocol: false,
      debriefAndLearningPolicy: false,
    };
  }

  let score = 0;
  if (policy.missingChildrenPolicy) score += 4;
  if (policy.returnHomeInterviewPolicy) score += 4;
  if (policy.policeNotificationProtocol) score += 4;
  if (policy.riskAssessmentFramework) score += 4;
  if (policy.preventionStrategy) score += 3;
  if (policy.multiAgencyMissingProtocol) score += 3;
  if (policy.debriefAndLearningPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    missingChildrenPolicy: policy.missingChildrenPolicy,
    returnHomeInterviewPolicy: policy.returnHomeInterviewPolicy,
    policeNotificationProtocol: policy.policeNotificationProtocol,
    riskAssessmentFramework: policy.riskAssessmentFramework,
    preventionStrategy: policy.preventionStrategy,
    multiAgencyMissingProtocol: policy.multiAgencyMissingProtocol,
    debriefAndLearningPolicy: policy.debriefAndLearningPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ────────────────────────────────────
// Weights: 6+5+5+4+3+2 = 25

export function evaluateStaffMissingFromCareIntelligenceReadiness(
  training: StaffMissingFromCareIntelligenceTraining[],
): StaffMissingFromCareIntelligenceReadinessResult {
  const n = training.length;

  if (n === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      missingResponseProceduresRate: 0,
      returnInterviewSkillsRate: 0,
      riskAssessmentSkillsRate: 0,
      policeNotificationKnowledgeRate: 0,
      preventionStrategiesRate: 0,
      deEscalationSkillsRate: 0,
    };
  }

  const missingResponseProceduresRate = pctIntel(training.filter((t) => t.missingResponseProcedures).length, n);
  const returnInterviewSkillsRate = pctIntel(training.filter((t) => t.returnInterviewSkills).length, n);
  const riskAssessmentSkillsRate = pctIntel(training.filter((t) => t.riskAssessmentSkills).length, n);
  const policeNotificationKnowledgeRate = pctIntel(training.filter((t) => t.policeNotificationKnowledge).length, n);
  const preventionStrategiesRate = pctIntel(training.filter((t) => t.preventionStrategies).length, n);
  const deEscalationSkillsRate = pctIntel(training.filter((t) => t.deEscalationSkills).length, n);

  let score = 0;
  score += (missingResponseProceduresRate / 100) * 6;
  score += (returnInterviewSkillsRate / 100) * 5;
  score += (riskAssessmentSkillsRate / 100) * 5;
  score += (policeNotificationKnowledgeRate / 100) * 4;
  score += (preventionStrategiesRate / 100) * 3;
  score += (deEscalationSkillsRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return {
    overallScore: score,
    totalStaff: n,
    missingResponseProceduresRate,
    returnInterviewSkillsRate,
    riskAssessmentSkillsRate,
    policeNotificationKnowledgeRate,
    preventionStrategiesRate,
    deEscalationSkillsRate,
  };
}

// ── Build Child Missing-from-Care Profiles (0-10) ──────────────────────────
// freq [>=10->2, >=5->1] + rate1/immediateResponseFollowedRate [>=80->3, >=60->2, >=40->1]
// + rate2/returnInterviewCompletedRate [same] + diversity [>=4->2, >=2->1]. Cap 10.

export function buildChildMissingFromCareIntelligenceProfiles(
  records: MissingFromCareIntelligenceRecord[],
): ChildMissingFromCareIntelligenceProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: MissingFromCareIntelligenceRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const immediateResponseFollowedRate = pctIntel(child.records.filter((r) => r.immediateResponseFollowed).length, totalRecords);
    const returnInterviewCompletedRate = pctIntel(child.records.filter((r) => r.returnInterviewCompleted).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (immediateResponseFollowedRate >= 80) rate1Score = 3;
    else if (immediateResponseFollowedRate >= 60) rate1Score = 2;
    else if (immediateResponseFollowedRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (returnInterviewCompletedRate >= 80) rate2Score = 3;
    else if (returnInterviewCompletedRate >= 60) rate2Score = 2;
    else if (returnInterviewCompletedRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return {
      childId: child.childId,
      childName: child.childName,
      totalRecords,
      immediateResponseFollowedRate,
      returnInterviewCompletedRate,
      categoriesCovered,
      overallScore,
    };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateMissingFromCareIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: MissingFromCareIntelligenceRecord[];
  policy: MissingFromCareIntelligencePolicy | null;
  staff: StaffMissingFromCareIntelligenceTraining[];
}

export function generateMissingFromCareIntelligenceResult(
  input: GenerateMissingFromCareIntelligenceInput,
): MissingFromCareIntelligenceResult {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => withinPeriod(r.date, periodStart, periodEnd));

  const qualityResult = evaluateMissingFromCareIntelligenceQuality(periodRecords);
  const complianceResult = evaluateMissingFromCareIntelligenceCompliance(periodRecords);
  const policyResult = evaluateMissingFromCareIntelligencePolicy(policy);
  const staffResult = evaluateStaffMissingFromCareIntelligenceReadiness(staff);

  const childProfiles = buildChildMissingFromCareIntelligenceProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRatingIntel(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Missing-from-care response rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Missing-from-care response rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Missing-from-care quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Missing-from-care compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Missing-from-care policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff missing-from-care readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.immediateResponseFollowedRate >= 90) strengths.push("Immediate response protocol followed at " + qualityResult.immediateResponseFollowedRate + "%");
  if (periodRecords.length > 0 && qualityResult.policeNotifiedAppropriatelyRate >= 90) strengths.push("Police notification appropriately completed at " + qualityResult.policeNotifiedAppropriatelyRate + "%");
  if (periodRecords.length > 0 && qualityResult.returnInterviewCompletedRate >= 90) strengths.push("Return home interviews completed at " + qualityResult.returnInterviewCompletedRate + "%");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate >= 90) strengths.push("Documentation rate at " + complianceResult.documentationCompleteRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Missing-from-care response rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Missing-from-care response Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Missing-from-care quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Missing-from-care compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Missing-from-care policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff missing-from-care readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.immediateResponseFollowedRate < 80) areasForImprovement.push("Immediate response protocol followed at " + qualityResult.immediateResponseFollowedRate + "% — must improve for child safety");
  if (periodRecords.length === 0) areasForImprovement.push("No missing-from-care records — episodes must be documented");
  if (policy === null) areasForImprovement.push("No missing-from-care policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff missing-from-care training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No missing-from-care policy — develop and implement comprehensive policy immediately");
  if (staff.length === 0) actions.push("URGENT: No staff missing-from-care training — schedule training for all staff");
  if (periodRecords.length > 0 && qualityResult.immediateResponseFollowedRate < 50) actions.push("HIGH: Immediate response protocol at " + qualityResult.immediateResponseFollowedRate + "% — review response procedures");
  if (periodRecords.length > 0 && qualityResult.policeNotifiedAppropriatelyRate < 50) actions.push("HIGH: Police notification at " + qualityResult.policeNotifiedAppropriatelyRate + "% — strengthen notification protocols");
  if (periodRecords.length > 0 && qualityResult.returnInterviewCompletedRate < 50) actions.push("HIGH: Return interview completion at " + qualityResult.returnInterviewCompletedRate + "% — ensure statutory interviews are carried out");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all episodes must be recorded");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.missingResponseProceduresRate < 50) actions.push("MEDIUM: Missing response procedures training at " + staffResult.missingResponseProceduresRate + "% — schedule training for staff");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low missing-from-care scores — review individual response provisions");
  if (actions.length === 0) actions.push("No immediate actions required. Missing-from-care systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 34 — Absence of child without permission",
    "CHR 2015 Reg 12 — Protection of children standard",
    "KCSIE 2024 — Children who go missing",
    "NMS 5 — Absent children",
    "SCCIF — Safety of children",
    "Statutory guidance on missing children 2014",
    "Working Together 2023 — Multi-agency response",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    quality: qualityResult,
    compliance: complianceResult,
    policy: policyResult,
    staffReadiness: staffResult,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
