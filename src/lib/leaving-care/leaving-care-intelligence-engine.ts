/* ──────────────────────────────────────────────────────────────
   Leaving Care Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   compliance of leaving care preparation — pathway planning,
   independence readiness, transition support, and young person
   participation in their leaving care journey.

   Regulatory basis:
     - Children Act 1989 s.23C — Continuing functions
     - Children (Leaving Care) Act 2000 — Duties to care leavers
     - CHR 2015 Reg 14 — Preparation for leaving care
     - CHR 2015 Reg 7 — Children's plans
     - SCCIF — Experiences and progress
     - Quality Standards 2015 — Standard 6 (transitions)
     - Care Leavers Strategy 2013

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type LeavingCareCategory =
  | "pathway_plan_review"
  | "independence_assessment"
  | "accommodation_planning"
  | "personal_advisor_session"
  | "education_employment_support"
  | "health_transition"
  | "financial_capability"
  | "support_network_review";

export type LeavingCareOutcome =
  | "fully_prepared"
  | "good_progress"
  | "some_progress"
  | "not_prepared"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const leavingCareCategoryLabels: Record<LeavingCareCategory, string> = {
  pathway_plan_review: "Pathway Plan Review",
  independence_assessment: "Independence Assessment",
  accommodation_planning: "Accommodation Planning",
  personal_advisor_session: "Personal Advisor Session",
  education_employment_support: "Education/Employment Support",
  health_transition: "Health Transition",
  financial_capability: "Financial Capability",
  support_network_review: "Support Network Review",
};

const leavingCareOutcomeLabels: Record<LeavingCareOutcome, string> = {
  fully_prepared: "Fully Prepared",
  good_progress: "Good Progress",
  some_progress: "Some Progress",
  not_prepared: "Not Prepared",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getLeavingCareCategoryLabel(category: LeavingCareCategory): string {
  return leavingCareCategoryLabels[category];
}

export function getLeavingCareOutcomeLabel(outcome: LeavingCareOutcome): string {
  return leavingCareOutcomeLabels[outcome];
}

export function getLeavingCareRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface LeavingCareRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: LeavingCareCategory;
  outcome: LeavingCareOutcome;
  pathwayPlanReviewed: boolean;
  youngPersonConsulted: boolean;
  independenceSkillsAssessed: boolean;
  transitionPlanInPlace: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface LeavingCarePolicy {
  pathwayPlanningPolicy: boolean;
  independenceSkillsFramework: boolean;
  accommodationSupportPolicy: boolean;
  personalAdvisorPolicy: boolean;
  educationEmploymentTransitionPolicy: boolean;
  financialCapabilityPolicy: boolean;
  stayingPutArrangements: boolean;
}

export interface StaffLeavingCareTraining {
  staffId: string;
  pathwayPlanningKnowledge: boolean;
  independenceSkillsTeaching: boolean;
  transitionSupportSkills: boolean;
  benefitsAdviceKnowledge: boolean;
  accommodationSupportSkills: boolean;
  emotionalSupportSkills: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface LeavingCareQualityResult {
  overallScore: number;
  totalRecords: number;
  pathwayPlanReviewedRate: number;
  youngPersonConsultedRate: number;
  independenceSkillsAssessedRate: number;
  transitionPlanInPlaceRate: number;
}

export interface LeavingCareComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  pathwayPlanReviewedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface LeavingCarePolicyResult {
  overallScore: number;
  pathwayPlanningPolicy: boolean;
  independenceSkillsFramework: boolean;
  accommodationSupportPolicy: boolean;
  personalAdvisorPolicy: boolean;
  educationEmploymentTransitionPolicy: boolean;
  financialCapabilityPolicy: boolean;
  stayingPutArrangements: boolean;
}

export interface StaffLeavingCareReadinessResult {
  overallScore: number;
  totalStaff: number;
  pathwayPlanningKnowledgeRate: number;
  independenceSkillsTeachingRate: number;
  transitionSupportSkillsRate: number;
  benefitsAdviceKnowledgeRate: number;
  accommodationSupportSkillsRate: number;
  emotionalSupportSkillsRate: number;
}

export interface ChildLeavingCareProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  pathwayPlanReviewedRate: number;
  youngPersonConsultedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface LeavingCareIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  leavingCareQuality: LeavingCareQualityResult;
  leavingCareCompliance: LeavingCareComplianceResult;
  leavingCarePolicy: LeavingCarePolicyResult;
  staffReadiness: StaffLeavingCareReadinessResult;
  childProfiles: ChildLeavingCareProfile[];
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

export function getRatingIntel(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Quality (0-25) ──────────────────────────────────────────

export function evaluateLeavingCareQuality(
  records: LeavingCareRecord[],
): LeavingCareQualityResult {
  const n = records.length;
  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, pathwayPlanReviewedRate: 0, youngPersonConsultedRate: 0, independenceSkillsAssessedRate: 0, transitionPlanInPlaceRate: 0 };
  }

  const pathwayPlanReviewedRate = pct(records.filter((r) => r.pathwayPlanReviewed).length, n);
  const youngPersonConsultedRate = pct(records.filter((r) => r.youngPersonConsulted).length, n);
  const independenceSkillsAssessedRate = pct(records.filter((r) => r.independenceSkillsAssessed).length, n);
  const transitionPlanInPlaceRate = pct(records.filter((r) => r.transitionPlanInPlace).length, n);

  let score = 0;
  score += (pathwayPlanReviewedRate / 100) * 7;
  score += (youngPersonConsultedRate / 100) * 6;
  score += (independenceSkillsAssessedRate / 100) * 6;
  score += (transitionPlanInPlaceRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, pathwayPlanReviewedRate, youngPersonConsultedRate, independenceSkillsAssessedRate, transitionPlanInPlaceRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluateLeavingCareCompliance(
  records: LeavingCareRecord[],
): LeavingCareComplianceResult {
  const n = records.length;
  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, pathwayPlanReviewedRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const pathwayPlanReviewedRate = pct(records.filter((r) => r.pathwayPlanReviewed).length, n);
  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (pathwayPlanReviewedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, pathwayPlanReviewedRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluateLeavingCarePolicy(
  policy: LeavingCarePolicy | null,
): LeavingCarePolicyResult {
  if (policy === null) {
    return { overallScore: 0, pathwayPlanningPolicy: false, independenceSkillsFramework: false, accommodationSupportPolicy: false, personalAdvisorPolicy: false, educationEmploymentTransitionPolicy: false, financialCapabilityPolicy: false, stayingPutArrangements: false };
  }

  let score = 0;
  if (policy.pathwayPlanningPolicy) score += 4;
  if (policy.independenceSkillsFramework) score += 4;
  if (policy.accommodationSupportPolicy) score += 4;
  if (policy.personalAdvisorPolicy) score += 4;
  if (policy.educationEmploymentTransitionPolicy) score += 3;
  if (policy.financialCapabilityPolicy) score += 3;
  if (policy.stayingPutArrangements) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    pathwayPlanningPolicy: policy.pathwayPlanningPolicy,
    independenceSkillsFramework: policy.independenceSkillsFramework,
    accommodationSupportPolicy: policy.accommodationSupportPolicy,
    personalAdvisorPolicy: policy.personalAdvisorPolicy,
    educationEmploymentTransitionPolicy: policy.educationEmploymentTransitionPolicy,
    financialCapabilityPolicy: policy.financialCapabilityPolicy,
    stayingPutArrangements: policy.stayingPutArrangements,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffLeavingCareReadiness(
  training: StaffLeavingCareTraining[],
): StaffLeavingCareReadinessResult {
  const n = training.length;
  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, pathwayPlanningKnowledgeRate: 0, independenceSkillsTeachingRate: 0, transitionSupportSkillsRate: 0, benefitsAdviceKnowledgeRate: 0, accommodationSupportSkillsRate: 0, emotionalSupportSkillsRate: 0 };
  }

  const pathwayPlanningKnowledgeRate = pct(training.filter((t) => t.pathwayPlanningKnowledge).length, n);
  const independenceSkillsTeachingRate = pct(training.filter((t) => t.independenceSkillsTeaching).length, n);
  const transitionSupportSkillsRate = pct(training.filter((t) => t.transitionSupportSkills).length, n);
  const benefitsAdviceKnowledgeRate = pct(training.filter((t) => t.benefitsAdviceKnowledge).length, n);
  const accommodationSupportSkillsRate = pct(training.filter((t) => t.accommodationSupportSkills).length, n);
  const emotionalSupportSkillsRate = pct(training.filter((t) => t.emotionalSupportSkills).length, n);

  let score = 0;
  score += (pathwayPlanningKnowledgeRate / 100) * 6;
  score += (independenceSkillsTeachingRate / 100) * 5;
  score += (transitionSupportSkillsRate / 100) * 5;
  score += (benefitsAdviceKnowledgeRate / 100) * 4;
  score += (accommodationSupportSkillsRate / 100) * 3;
  score += (emotionalSupportSkillsRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, pathwayPlanningKnowledgeRate, independenceSkillsTeachingRate, transitionSupportSkillsRate, benefitsAdviceKnowledgeRate, accommodationSupportSkillsRate, emotionalSupportSkillsRate };
}

// ── Build Child Profiles ──────────────────────────────────────────────────

export function buildChildLeavingCareProfiles(
  records: LeavingCareRecord[],
): ChildLeavingCareProfile[] {
  if (records.length === 0) return [];
  const childMap = new Map<string, { childId: string; childName: string; records: LeavingCareRecord[] }>();
  for (const r of records) {
    if (!childMap.has(r.childId)) childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const pathwayPlanReviewedRate = pct(child.records.filter((r) => r.pathwayPlanReviewed).length, totalRecords);
    const youngPersonConsultedRate = pct(child.records.filter((r) => r.youngPersonConsulted).length, totalRecords);
    const categoriesCovered = Array.from(new Set(child.records.map((r) => r.category)));

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (pathwayPlanReviewedRate >= 80) rate1Score = 3;
    else if (pathwayPlanReviewedRate >= 60) rate1Score = 2;
    else if (pathwayPlanReviewedRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (youngPersonConsultedRate >= 80) rate2Score = 3;
    else if (youngPersonConsultedRate >= 60) rate2Score = 2;
    else if (youngPersonConsultedRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);
    return { childId: child.childId, childName: child.childName, totalRecords, pathwayPlanReviewedRate, youngPersonConsultedRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateLeavingCareIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: LeavingCareRecord[];
  policy: LeavingCarePolicy | null;
  staff: StaffLeavingCareTraining[];
}

export function generateLeavingCareIntelligence(
  input: GenerateLeavingCareIntelligenceInput,
): LeavingCareIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;
  const periodRecords = records.filter((r) => withinPeriod(r.date, periodStart, periodEnd));

  const qualityResult = evaluateLeavingCareQuality(periodRecords);
  const complianceResult = evaluateLeavingCareCompliance(periodRecords);
  const policyResult = evaluateLeavingCarePolicy(policy);
  const staffResult = evaluateStaffLeavingCareReadiness(staff);
  const childProfiles = buildChildLeavingCareProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRatingIntel(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Leaving care preparation rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Leaving care preparation rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Preparation quality is strong (" + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Leaving care compliance is strong (" + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Leaving care policy framework is robust (" + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff leaving care readiness is strong (" + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.pathwayPlanReviewedRate >= 90) strengths.push("Pathway plan review rate at " + qualityResult.pathwayPlanReviewedRate + "%");
  if (periodRecords.length > 0 && qualityResult.youngPersonConsultedRate >= 90) strengths.push("Young person consultation at " + qualityResult.youngPersonConsultedRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Leaving care preparation rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Leaving care preparation Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Preparation quality needs improvement (" + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Leaving care compliance needs improvement (" + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Leaving care policy needs strengthening (" + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff readiness needs improvement (" + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.youngPersonConsultedRate < 80) areasForImprovement.push("Young person consultation at " + qualityResult.youngPersonConsultedRate + "% — must ensure young people shape their own leaving care plans");
  if (periodRecords.length === 0) areasForImprovement.push("No leaving care preparation records — support must be documented");
  if (policy === null) areasForImprovement.push("No leaving care policy in place — statutory requirement under CHR 2015 Reg 14");
  if (staff.length === 0) areasForImprovement.push("No staff leaving care training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No leaving care policy — develop and implement pathway planning framework immediately (CHR 2015 Reg 14)");
  if (staff.length === 0) actions.push("URGENT: No staff leaving care training — schedule transition support training for all care staff");
  if (periodRecords.length > 0 && qualityResult.pathwayPlanReviewedRate < 50) actions.push("HIGH: Pathway plan review rate at " + qualityResult.pathwayPlanReviewedRate + "% — all pathway plans must be reviewed termly");
  if (periodRecords.length > 0 && qualityResult.youngPersonConsultedRate < 50) actions.push("HIGH: Young person consultation at " + qualityResult.youngPersonConsultedRate + "% — ensure young people are central to their leaving care planning");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all preparation activities must be recorded");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.pathwayPlanningKnowledgeRate < 50) actions.push("MEDIUM: Pathway planning knowledge at " + staffResult.pathwayPlanningKnowledgeRate + "% — schedule training");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " young person(s) with low preparation scores — review individual pathway plans");
  if (actions.length === 0) actions.push("No immediate actions required. Leaving care preparation operating within expected standards.");

  const regulatoryLinks: string[] = [
    "Children Act 1989 s.23C — Continuing functions",
    "Children (Leaving Care) Act 2000 — Duties to care leavers",
    "CHR 2015 Reg 14 — Preparation for leaving care",
    "CHR 2015 Reg 7 — Children's plans",
    "SCCIF — Experiences and progress",
    "Quality Standards 2015 — Standard 6 (transitions)",
    "Care Leavers Strategy 2013",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    leavingCareQuality: qualityResult,
    leavingCareCompliance: complianceResult,
    leavingCarePolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
