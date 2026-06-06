/* ──────────────────────────────────────────────────────────────
   Care Planning Intelligence Engine

   Pure deterministic engine for evaluating the quality of care
   plan creation, review, and implementation — covering care
   plans, placement plans, risk assessments, health plans,
   education plans, contact plans, and transition plans.

   Regulatory basis:
     - CHR 2015 Reg 14 — Care planning
     - CHR 2015 Reg 36 — Assessments
     - NMS 2 — Promoting care
     - SCCIF — Experiences and progress
     - Children Act 1989 s.31A — Care plans
     - Quality Standards 2015 Standard 1
     - Working Together 2023

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type CarePlanningCategory =
  | "care_plan_creation"
  | "care_plan_review"
  | "placement_plan"
  | "risk_assessment_integration"
  | "health_plan"
  | "education_plan"
  | "contact_plan"
  | "transition_plan";

export type CarePlanningOutcome =
  | "plan_fully_implemented"
  | "plan_partially_implemented"
  | "plan_requires_update"
  | "plan_not_implemented"
  | "not_applicable";

export type CarePlanningRating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const carePlanningCategoryLabels: Record<CarePlanningCategory, string> = {
  care_plan_creation: "Care Plan Creation",
  care_plan_review: "Care Plan Review",
  placement_plan: "Placement Plan",
  risk_assessment_integration: "Risk Assessment Integration",
  health_plan: "Health Plan",
  education_plan: "Education Plan",
  contact_plan: "Contact Plan",
  transition_plan: "Transition Plan",
};

const carePlanningOutcomeLabels: Record<CarePlanningOutcome, string> = {
  plan_fully_implemented: "Plan Fully Implemented",
  plan_partially_implemented: "Plan Partially Implemented",
  plan_requires_update: "Plan Requires Update",
  plan_not_implemented: "Plan Not Implemented",
  not_applicable: "Not Applicable",
};

const carePlanningRatingLabels: Record<CarePlanningRating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getCarePlanningCategoryLabel(category: CarePlanningCategory): string {
  return carePlanningCategoryLabels[category];
}

export function getCarePlanningOutcomeLabel(outcome: CarePlanningOutcome): string {
  return carePlanningOutcomeLabels[outcome];
}

export function getCarePlanningRatingLabel(rating: CarePlanningRating): string {
  return carePlanningRatingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface CarePlanningRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: CarePlanningCategory;
  outcome: CarePlanningOutcome;
  childViewIncorporated: boolean;
  measurableOutcomesSet: boolean;
  multiAgencyInputIncluded: boolean;
  reviewDateSet: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface CarePlanningPolicy {
  carePlanningPolicy: boolean;
  placementPlanPolicy: boolean;
  reviewSchedulePolicy: boolean;
  multiAgencyPlanningPolicy: boolean;
  riskIntegrationPolicy: boolean;
  childParticipationPolicy: boolean;
  transitionPlanningPolicy: boolean;
}

export interface StaffCarePlanningCompetency {
  staffId: string;
  carePlanWritingSkills: boolean;
  outcomeFocusedPlanning: boolean;
  multiAgencyCoordination: boolean;
  childParticipationSkills: boolean;
  riskAssessmentIntegration: boolean;
  reviewFacilitationSkills: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface CarePlanningQualityResult {
  overallScore: number;
  totalRecords: number;
  childViewIncorporatedRate: number;
  measurableOutcomesSetRate: number;
  multiAgencyInputIncludedRate: number;
  reviewDateSetRate: number;
}

export interface CarePlanningComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  childViewIncorporatedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface CarePlanningPolicyResult {
  overallScore: number;
  carePlanningPolicy: boolean;
  placementPlanPolicy: boolean;
  reviewSchedulePolicy: boolean;
  multiAgencyPlanningPolicy: boolean;
  riskIntegrationPolicy: boolean;
  childParticipationPolicy: boolean;
  transitionPlanningPolicy: boolean;
}

export interface StaffCarePlanningCompetencyResult {
  overallScore: number;
  totalStaff: number;
  carePlanWritingSkillsRate: number;
  outcomeFocusedPlanningRate: number;
  multiAgencyCoordinationRate: number;
  childParticipationSkillsRate: number;
  riskAssessmentIntegrationRate: number;
  reviewFacilitationSkillsRate: number;
}

export interface ChildCarePlanningProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  childViewIncorporatedRate: number;
  measurableOutcomesSetRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface CarePlanningIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: CarePlanningRating;
  carePlanningQuality: CarePlanningQualityResult;
  carePlanningCompliance: CarePlanningComplianceResult;
  carePlanningPolicy: CarePlanningPolicyResult;
  staffCompetency: StaffCarePlanningCompetencyResult;
  childProfiles: ChildCarePlanningProfile[];
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

export function getRating(score: number): CarePlanningRating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Quality (0-25) ──────────────────────────────────────────

export function evaluateCarePlanningQuality(
  records: CarePlanningRecord[],
): CarePlanningQualityResult {
  const n = records.length;
  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, childViewIncorporatedRate: 0, measurableOutcomesSetRate: 0, multiAgencyInputIncludedRate: 0, reviewDateSetRate: 0 };
  }

  const childViewIncorporatedRate = pct(records.filter((r) => r.childViewIncorporated).length, n);
  const measurableOutcomesSetRate = pct(records.filter((r) => r.measurableOutcomesSet).length, n);
  const multiAgencyInputIncludedRate = pct(records.filter((r) => r.multiAgencyInputIncluded).length, n);
  const reviewDateSetRate = pct(records.filter((r) => r.reviewDateSet).length, n);

  let score = 0;
  score += (childViewIncorporatedRate / 100) * 7;
  score += (measurableOutcomesSetRate / 100) * 6;
  score += (multiAgencyInputIncludedRate / 100) * 6;
  score += (reviewDateSetRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, childViewIncorporatedRate, measurableOutcomesSetRate, multiAgencyInputIncludedRate, reviewDateSetRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluateCarePlanningCompliance(
  records: CarePlanningRecord[],
): CarePlanningComplianceResult {
  const n = records.length;
  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, childViewIncorporatedRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const childViewIncorporatedRate = pct(records.filter((r) => r.childViewIncorporated).length, n);
  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (childViewIncorporatedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, childViewIncorporatedRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluateCarePlanningPolicyCompliance(
  policy: CarePlanningPolicy | null,
): CarePlanningPolicyResult {
  if (policy === null) {
    return { overallScore: 0, carePlanningPolicy: false, placementPlanPolicy: false, reviewSchedulePolicy: false, multiAgencyPlanningPolicy: false, riskIntegrationPolicy: false, childParticipationPolicy: false, transitionPlanningPolicy: false };
  }

  let score = 0;
  if (policy.carePlanningPolicy) score += 4;
  if (policy.placementPlanPolicy) score += 4;
  if (policy.reviewSchedulePolicy) score += 4;
  if (policy.multiAgencyPlanningPolicy) score += 4;
  if (policy.riskIntegrationPolicy) score += 3;
  if (policy.childParticipationPolicy) score += 3;
  if (policy.transitionPlanningPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    carePlanningPolicy: policy.carePlanningPolicy,
    placementPlanPolicy: policy.placementPlanPolicy,
    reviewSchedulePolicy: policy.reviewSchedulePolicy,
    multiAgencyPlanningPolicy: policy.multiAgencyPlanningPolicy,
    riskIntegrationPolicy: policy.riskIntegrationPolicy,
    childParticipationPolicy: policy.childParticipationPolicy,
    transitionPlanningPolicy: policy.transitionPlanningPolicy,
  };
}

// ── Evaluator 4: Staff Competency (0-25) ─────────────────────────────────

export function evaluateStaffCarePlanningCompetency(
  staff: StaffCarePlanningCompetency[],
): StaffCarePlanningCompetencyResult {
  const n = staff.length;
  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, carePlanWritingSkillsRate: 0, outcomeFocusedPlanningRate: 0, multiAgencyCoordinationRate: 0, childParticipationSkillsRate: 0, riskAssessmentIntegrationRate: 0, reviewFacilitationSkillsRate: 0 };
  }

  const carePlanWritingSkillsRate = pct(staff.filter((s) => s.carePlanWritingSkills).length, n);
  const outcomeFocusedPlanningRate = pct(staff.filter((s) => s.outcomeFocusedPlanning).length, n);
  const multiAgencyCoordinationRate = pct(staff.filter((s) => s.multiAgencyCoordination).length, n);
  const childParticipationSkillsRate = pct(staff.filter((s) => s.childParticipationSkills).length, n);
  const riskAssessmentIntegrationRate = pct(staff.filter((s) => s.riskAssessmentIntegration).length, n);
  const reviewFacilitationSkillsRate = pct(staff.filter((s) => s.reviewFacilitationSkills).length, n);

  let score = 0;
  score += (carePlanWritingSkillsRate / 100) * 6;
  score += (outcomeFocusedPlanningRate / 100) * 5;
  score += (multiAgencyCoordinationRate / 100) * 5;
  score += (childParticipationSkillsRate / 100) * 4;
  score += (riskAssessmentIntegrationRate / 100) * 3;
  score += (reviewFacilitationSkillsRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, carePlanWritingSkillsRate, outcomeFocusedPlanningRate, multiAgencyCoordinationRate, childParticipationSkillsRate, riskAssessmentIntegrationRate, reviewFacilitationSkillsRate };
}

// ── Build Child Profiles ──────────────────────────────────────────────────

export function buildChildCarePlanningProfiles(
  records: CarePlanningRecord[],
): ChildCarePlanningProfile[] {
  if (records.length === 0) return [];
  const childMap = new Map<string, { childId: string; childName: string; records: CarePlanningRecord[] }>();
  for (const r of records) {
    if (!childMap.has(r.childId)) childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const childViewIncorporatedRate = pct(child.records.filter((r) => r.childViewIncorporated).length, totalRecords);
    const measurableOutcomesSetRate = pct(child.records.filter((r) => r.measurableOutcomesSet).length, totalRecords);
    const categoriesCovered = Array.from(new Set(child.records.map((r) => r.category)));

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (childViewIncorporatedRate >= 80) rate1Score = 3;
    else if (childViewIncorporatedRate >= 60) rate1Score = 2;
    else if (childViewIncorporatedRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (measurableOutcomesSetRate >= 80) rate2Score = 3;
    else if (measurableOutcomesSetRate >= 60) rate2Score = 2;
    else if (measurableOutcomesSetRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);
    return { childId: child.childId, childName: child.childName, totalRecords, childViewIncorporatedRate, measurableOutcomesSetRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateCarePlanningIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: CarePlanningRecord[];
  policy: CarePlanningPolicy | null;
  staff: StaffCarePlanningCompetency[];
}

export function generateCarePlanningIntelligenceReport(
  input: GenerateCarePlanningIntelligenceInput,
): CarePlanningIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;
  const periodRecords = records.filter((r) => withinPeriod(r.date, periodStart, periodEnd));

  const qualityResult = evaluateCarePlanningQuality(periodRecords);
  const complianceResult = evaluateCarePlanningCompliance(periodRecords);
  const policyResult = evaluateCarePlanningPolicyCompliance(policy);
  const staffResult = evaluateStaffCarePlanningCompetency(staff);
  const childProfiles = buildChildCarePlanningProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Care planning rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Care planning rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Planning quality is strong (" + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Care planning compliance is strong (" + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Care planning policy framework is robust (" + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff care planning competency is strong (" + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.childViewIncorporatedRate >= 90) strengths.push("Child view incorporation rate at " + qualityResult.childViewIncorporatedRate + "%");
  if (periodRecords.length > 0 && qualityResult.measurableOutcomesSetRate >= 90) strengths.push("Measurable outcomes setting at " + qualityResult.measurableOutcomesSetRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Care planning rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Care planning Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Planning quality needs improvement (" + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Care planning compliance needs improvement (" + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Care planning policy needs strengthening (" + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff competency needs improvement (" + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.childViewIncorporatedRate < 80) areasForImprovement.push("Child view incorporation at " + qualityResult.childViewIncorporatedRate + "% — must ensure children shape their own care plans");
  if (periodRecords.length === 0) areasForImprovement.push("No care planning records — all care plans must be documented");
  if (policy === null) areasForImprovement.push("No care planning policy in place — statutory requirement under CHR 2015 Reg 14");
  if (staff.length === 0) areasForImprovement.push("No staff care planning competency records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No care planning policy — develop and implement care planning framework immediately (CHR 2015 Reg 14)");
  if (staff.length === 0) actions.push("URGENT: No staff care planning competency records — schedule care planning training for all staff");
  if (periodRecords.length > 0 && qualityResult.childViewIncorporatedRate < 50) actions.push("HIGH: Child view incorporation at " + qualityResult.childViewIncorporatedRate + "% — all care plans must reflect the child's wishes and feelings");
  if (periodRecords.length > 0 && qualityResult.measurableOutcomesSetRate < 50) actions.push("HIGH: Measurable outcomes at " + qualityResult.measurableOutcomesSetRate + "% — ensure all care plans contain SMART objectives");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all care planning activities must be recorded");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.carePlanWritingSkillsRate < 50) actions.push("MEDIUM: Care plan writing skills at " + staffResult.carePlanWritingSkillsRate + "% — schedule training");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low care planning scores — review individual care plans");
  if (actions.length === 0) actions.push("No immediate actions required. Care planning operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 14 — Care planning",
    "CHR 2015 Reg 36 — Assessments",
    "NMS 2 — Promoting care",
    "SCCIF — Experiences and progress",
    "Children Act 1989 s.31A — Care plans",
    "Quality Standards 2015 Standard 1",
    "Working Together 2023",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    carePlanningQuality: qualityResult,
    carePlanningCompliance: complianceResult,
    carePlanningPolicy: policyResult,
    staffCompetency: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
