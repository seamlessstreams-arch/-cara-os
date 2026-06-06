/* ──────────────────────────────────────────────────────────────
   Lessons Learned Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   compliance of lessons learned and organisational learning
   in residential care homes.

   Regulatory basis:
     - CHR 2015 Reg 13 — Leadership and management
     - CHR 2015 Reg 35 — Behaviour management
     - NMS 15 — Notifications and learning
     - SCCIF — Leadership and management
     - Children Act 1989 s.22 — Duty to safeguard welfare
     - WTSC 2023 — Learning from serious cases
     - Quality Standards 2015 Standard 9

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type LessonsLearnedCategory =
  | "incident_debrief"
  | "complaint_learning"
  | "safeguarding_review"
  | "practice_improvement"
  | "policy_update"
  | "training_outcome"
  | "near_miss_analysis"
  | "external_inspection_learning";

export type LessonsLearnedOutcome =
  | "fully_embedded"
  | "partially_embedded"
  | "action_planned"
  | "not_actioned"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const lessonsLearnedCategoryLabels: Record<LessonsLearnedCategory, string> = {
  incident_debrief: "Incident Debrief",
  complaint_learning: "Complaint Learning",
  safeguarding_review: "Safeguarding Review",
  practice_improvement: "Practice Improvement",
  policy_update: "Policy Update",
  training_outcome: "Training Outcome",
  near_miss_analysis: "Near Miss Analysis",
  external_inspection_learning: "External Inspection Learning",
};

const lessonsLearnedOutcomeLabels: Record<LessonsLearnedOutcome, string> = {
  fully_embedded: "Fully Embedded",
  partially_embedded: "Partially Embedded",
  action_planned: "Action Planned",
  not_actioned: "Not Actioned",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getLessonsLearnedCategoryLabel(category: LessonsLearnedCategory): string {
  return lessonsLearnedCategoryLabels[category];
}

export function getLessonsLearnedOutcomeLabel(outcome: LessonsLearnedOutcome): string {
  return lessonsLearnedOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface LessonsLearnedRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: LessonsLearnedCategory;
  outcome: LessonsLearnedOutcome;
  rootCauseIdentified: boolean;
  lessonsDocumented: boolean;
  staffBriefingCompleted: boolean;
  improvementMeasurable: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface LessonsLearnedPolicy {
  lessonsLearnedPolicy: boolean;
  postIncidentReviewPolicy: boolean;
  complaintLearningPolicy: boolean;
  practiceImprovementFramework: boolean;
  knowledgeSharingPolicy: boolean;
  externalLearningIntegration: boolean;
  auditAndReviewSchedule: boolean;
}

export interface StaffLessonsLearnedTraining {
  staffId: string;
  reflectivePracticeSkills: boolean;
  rootCauseAnalysisKnowledge: boolean;
  documentationSkills: boolean;
  improvementPlanningSkills: boolean;
  debriefFacilitationSkills: boolean;
  knowledgeSharingAbility: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface LessonsLearnedQualityResult {
  overallScore: number;
  totalRecords: number;
  rootCauseIdentifiedRate: number;
  lessonsDocumentedRate: number;
  staffBriefingCompletedRate: number;
  improvementMeasurableRate: number;
}

export interface LessonsLearnedComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  rootCauseIdentifiedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface LessonsLearnedPolicyResult {
  overallScore: number;
  lessonsLearnedPolicy: boolean;
  postIncidentReviewPolicy: boolean;
  complaintLearningPolicy: boolean;
  practiceImprovementFramework: boolean;
  knowledgeSharingPolicy: boolean;
  externalLearningIntegration: boolean;
  auditAndReviewSchedule: boolean;
}

export interface StaffLessonsLearnedReadinessResult {
  overallScore: number;
  totalStaff: number;
  reflectivePracticeSkillsRate: number;
  rootCauseAnalysisKnowledgeRate: number;
  documentationSkillsRate: number;
  improvementPlanningSkillsRate: number;
  debriefFacilitationSkillsRate: number;
  knowledgeSharingAbilityRate: number;
}

export interface ChildLessonsLearnedProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  rootCauseIdentifiedRate: number;
  lessonsDocumentedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface LessonsLearnedIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  lessonsLearnedQuality: LessonsLearnedQualityResult;
  lessonsLearnedCompliance: LessonsLearnedComplianceResult;
  lessonsLearnedPolicy: LessonsLearnedPolicyResult;
  staffReadiness: StaffLessonsLearnedReadinessResult;
  childProfiles: ChildLessonsLearnedProfile[];
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

export function evaluateLessonsLearnedQuality(
  records: LessonsLearnedRecord[],
): LessonsLearnedQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, rootCauseIdentifiedRate: 0, lessonsDocumentedRate: 0, staffBriefingCompletedRate: 0, improvementMeasurableRate: 0 };
  }

  const rootCauseIdentifiedRate = pct(records.filter((r) => r.rootCauseIdentified).length, n);
  const lessonsDocumentedRate = pct(records.filter((r) => r.lessonsDocumented).length, n);
  const staffBriefingCompletedRate = pct(records.filter((r) => r.staffBriefingCompleted).length, n);
  const improvementMeasurableRate = pct(records.filter((r) => r.improvementMeasurable).length, n);

  let score = 0;
  score += (rootCauseIdentifiedRate / 100) * 7;
  score += (lessonsDocumentedRate / 100) * 6;
  score += (staffBriefingCompletedRate / 100) * 6;
  score += (improvementMeasurableRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, rootCauseIdentifiedRate, lessonsDocumentedRate, staffBriefingCompletedRate, improvementMeasurableRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluateLessonsLearnedCompliance(
  records: LessonsLearnedRecord[],
): LessonsLearnedComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, rootCauseIdentifiedRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const rootCauseIdentifiedRate = pct(records.filter((r) => r.rootCauseIdentified).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (rootCauseIdentifiedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, rootCauseIdentifiedRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluateLessonsLearnedPolicy(
  policy: LessonsLearnedPolicy | null,
): LessonsLearnedPolicyResult {
  if (policy === null) {
    return { overallScore: 0, lessonsLearnedPolicy: false, postIncidentReviewPolicy: false, complaintLearningPolicy: false, practiceImprovementFramework: false, knowledgeSharingPolicy: false, externalLearningIntegration: false, auditAndReviewSchedule: false };
  }

  let score = 0;
  if (policy.lessonsLearnedPolicy) score += 4;
  if (policy.postIncidentReviewPolicy) score += 4;
  if (policy.complaintLearningPolicy) score += 4;
  if (policy.practiceImprovementFramework) score += 4;
  if (policy.knowledgeSharingPolicy) score += 3;
  if (policy.externalLearningIntegration) score += 3;
  if (policy.auditAndReviewSchedule) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    lessonsLearnedPolicy: policy.lessonsLearnedPolicy,
    postIncidentReviewPolicy: policy.postIncidentReviewPolicy,
    complaintLearningPolicy: policy.complaintLearningPolicy,
    practiceImprovementFramework: policy.practiceImprovementFramework,
    knowledgeSharingPolicy: policy.knowledgeSharingPolicy,
    externalLearningIntegration: policy.externalLearningIntegration,
    auditAndReviewSchedule: policy.auditAndReviewSchedule,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffLessonsLearnedReadiness(
  training: StaffLessonsLearnedTraining[],
): StaffLessonsLearnedReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, reflectivePracticeSkillsRate: 0, rootCauseAnalysisKnowledgeRate: 0, documentationSkillsRate: 0, improvementPlanningSkillsRate: 0, debriefFacilitationSkillsRate: 0, knowledgeSharingAbilityRate: 0 };
  }

  const reflectivePracticeSkillsRate = pct(training.filter((t) => t.reflectivePracticeSkills).length, n);
  const rootCauseAnalysisKnowledgeRate = pct(training.filter((t) => t.rootCauseAnalysisKnowledge).length, n);
  const documentationSkillsRate = pct(training.filter((t) => t.documentationSkills).length, n);
  const improvementPlanningSkillsRate = pct(training.filter((t) => t.improvementPlanningSkills).length, n);
  const debriefFacilitationSkillsRate = pct(training.filter((t) => t.debriefFacilitationSkills).length, n);
  const knowledgeSharingAbilityRate = pct(training.filter((t) => t.knowledgeSharingAbility).length, n);

  let score = 0;
  score += (reflectivePracticeSkillsRate / 100) * 6;
  score += (rootCauseAnalysisKnowledgeRate / 100) * 5;
  score += (documentationSkillsRate / 100) * 5;
  score += (improvementPlanningSkillsRate / 100) * 4;
  score += (debriefFacilitationSkillsRate / 100) * 3;
  score += (knowledgeSharingAbilityRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, reflectivePracticeSkillsRate, rootCauseAnalysisKnowledgeRate, documentationSkillsRate, improvementPlanningSkillsRate, debriefFacilitationSkillsRate, knowledgeSharingAbilityRate };
}

// ── Build Child Lessons Learned Profiles ────────────────────────────────

export function buildChildLessonsLearnedProfiles(
  records: LessonsLearnedRecord[],
): ChildLessonsLearnedProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: LessonsLearnedRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const rootCauseIdentifiedRate = pct(child.records.filter((r) => r.rootCauseIdentified).length, totalRecords);
    const lessonsDocumentedRate = pct(child.records.filter((r) => r.lessonsDocumented).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (rootCauseIdentifiedRate >= 80) rate1Score = 3;
    else if (rootCauseIdentifiedRate >= 60) rate1Score = 2;
    else if (rootCauseIdentifiedRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (lessonsDocumentedRate >= 80) rate2Score = 3;
    else if (lessonsDocumentedRate >= 60) rate2Score = 2;
    else if (lessonsDocumentedRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, rootCauseIdentifiedRate, lessonsDocumentedRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateLessonsLearnedIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: LessonsLearnedRecord[];
  policy: LessonsLearnedPolicy | null;
  staff: StaffLessonsLearnedTraining[];
}

export function generateLessonsLearnedIntelligence(
  input: GenerateLessonsLearnedIntelligenceInput,
): LessonsLearnedIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => withinPeriod(r.date, periodStart, periodEnd));

  const qualityResult = evaluateLessonsLearnedQuality(periodRecords);
  const complianceResult = evaluateLessonsLearnedCompliance(periodRecords);
  const policyResult = evaluateLessonsLearnedPolicy(policy);
  const staffResult = evaluateStaffLessonsLearnedReadiness(staff);

  const childProfiles = buildChildLessonsLearnedProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Lessons learned rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Lessons learned rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Lessons learned quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Lessons learned compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Lessons learned policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff lessons learned readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.rootCauseIdentifiedRate >= 90) strengths.push("Root cause identification rate at " + qualityResult.rootCauseIdentifiedRate + "%");
  if (periodRecords.length > 0 && qualityResult.lessonsDocumentedRate >= 90) strengths.push("Lessons documented at " + qualityResult.lessonsDocumentedRate + "%");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate >= 90) strengths.push("Documentation rate at " + complianceResult.documentationCompleteRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Lessons learned rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Lessons learned Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Lessons learned quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Lessons learned compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Lessons learned policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff lessons learned readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.rootCauseIdentifiedRate < 80) areasForImprovement.push("Root cause identification at " + qualityResult.rootCauseIdentifiedRate + "% — must improve for learning culture");
  if (periodRecords.length === 0) areasForImprovement.push("No lessons learned records — lessons must be documented");
  if (policy === null) areasForImprovement.push("No lessons learned policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff lessons learned training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No lessons learned policy — develop and implement comprehensive policy immediately");
  if (staff.length === 0) actions.push("URGENT: No staff lessons learned training — schedule training for all staff");
  if (periodRecords.length > 0 && qualityResult.rootCauseIdentifiedRate < 50) actions.push("HIGH: Root cause identification at " + qualityResult.rootCauseIdentifiedRate + "% — review analysis processes");
  if (periodRecords.length > 0 && qualityResult.lessonsDocumentedRate < 50) actions.push("HIGH: Lessons documented at " + qualityResult.lessonsDocumentedRate + "% — ensure lessons are consistently recorded");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all lessons must be recorded");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.reflectivePracticeSkillsRate < 50) actions.push("MEDIUM: Reflective practice skills at " + staffResult.reflectivePracticeSkillsRate + "% — schedule training for staff");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low lessons learned scores — review individual learning plans");
  if (actions.length === 0) actions.push("No immediate actions required. Lessons learned systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 13 — Leadership and management",
    "CHR 2015 Reg 35 — Behaviour management",
    "NMS 15 — Notifications and learning",
    "SCCIF — Leadership and management",
    "Children Act 1989 s.22 — Duty to safeguard welfare",
    "WTSC 2023 — Learning from serious cases",
    "Quality Standards 2015 Standard 9",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    lessonsLearnedQuality: qualityResult,
    lessonsLearnedCompliance: complianceResult,
    lessonsLearnedPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
