/* ──────────────────────────────────────────────────────────────
   Placement Stability Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   compliance of placement stability and permanence in
   residential children's care homes.

   Regulatory basis:
     - CHR 2015 Reg 36 — Assessment of prospective placements
     - CHR 2015 Reg 14 — Care planning
     - CHR 2015 Reg 9 — Quality of care
     - NMS 11 — Placement stability
     - SCCIF — Stability and permanence
     - Children Act 1989 s.22C — Suitable accommodation
     - Quality Standards 2015 — Standard 1 (child-centred care)

   Scoring model (100 points total):
     - Quality (25)     — matching, stability plan, child view, risk factors
     - Compliance (25)  — documentation, timely recording, matching rate, diversity
     - Policy (25)      — 7 policy booleans
     - Staff (25)       — 6 training skills

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type PlacementStabilityIntelligenceCategory =
  | "placement_review"
  | "stability_meeting"
  | "matching_assessment"
  | "disruption_meeting"
  | "transition_planning"
  | "placement_support"
  | "unplanned_ending_review"
  | "permanence_planning";

export type PlacementStabilityIntelligenceOutcome =
  | "placement_sustained"
  | "placement_improved"
  | "early_intervention"
  | "placement_at_risk"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const placementStabilityIntelligenceCategoryLabels: Record<PlacementStabilityIntelligenceCategory, string> = {
  placement_review: "Placement Review",
  stability_meeting: "Stability Meeting",
  matching_assessment: "Matching Assessment",
  disruption_meeting: "Disruption Meeting",
  transition_planning: "Transition Planning",
  placement_support: "Placement Support",
  unplanned_ending_review: "Unplanned Ending Review",
  permanence_planning: "Permanence Planning",
};

const placementStabilityIntelligenceOutcomeLabels: Record<PlacementStabilityIntelligenceOutcome, string> = {
  placement_sustained: "Placement Sustained",
  placement_improved: "Placement Improved",
  early_intervention: "Early Intervention",
  placement_at_risk: "Placement At Risk",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getPlacementStabilityIntelligenceCategoryLabel(category: PlacementStabilityIntelligenceCategory): string {
  return placementStabilityIntelligenceCategoryLabels[category];
}

export function getPlacementStabilityIntelligenceOutcomeLabel(outcome: PlacementStabilityIntelligenceOutcome): string {
  return placementStabilityIntelligenceOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface PlacementStabilityRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: PlacementStabilityIntelligenceCategory;
  outcome: PlacementStabilityIntelligenceOutcome;
  matchingNeedsAssessed: boolean;
  stabilityPlanInPlace: boolean;
  childViewIncorporated: boolean;
  riskFactorsIdentified: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface PlacementStabilityPolicy {
  placementStabilityPolicy: boolean;
  matchingProcedure: boolean;
  disruptionManagementPolicy: boolean;
  transitionPlanningFramework: boolean;
  unplannedEndingProtocol: boolean;
  permanencePlanningPolicy: boolean;
  placementReviewSchedule: boolean;
}

export interface StaffPlacementStabilityTraining {
  staffId: string;
  matchingAssessmentSkills: boolean;
  stabilityPlanningKnowledge: boolean;
  disruptionPreventionSkills: boolean;
  transitionSupportSkills: boolean;
  childParticipationSkills: boolean;
  permanencePlanningKnowledge: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface PlacementStabilityQualityResult {
  overallScore: number;
  totalRecords: number;
  matchingNeedsAssessedRate: number;
  stabilityPlanInPlaceRate: number;
  childViewIncorporatedRate: number;
  riskFactorsIdentifiedRate: number;
}

export interface PlacementStabilityComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  matchingNeedsAssessedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface PlacementStabilityPolicyResult {
  overallScore: number;
  placementStabilityPolicy: boolean;
  matchingProcedure: boolean;
  disruptionManagementPolicy: boolean;
  transitionPlanningFramework: boolean;
  unplannedEndingProtocol: boolean;
  permanencePlanningPolicy: boolean;
  placementReviewSchedule: boolean;
}

export interface StaffPlacementStabilityReadinessResult {
  overallScore: number;
  totalStaff: number;
  matchingAssessmentSkillsRate: number;
  stabilityPlanningKnowledgeRate: number;
  disruptionPreventionSkillsRate: number;
  transitionSupportSkillsRate: number;
  childParticipationSkillsRate: number;
  permanencePlanningKnowledgeRate: number;
}

export interface ChildPlacementStabilityProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  matchingNeedsAssessedRate: number;
  stabilityPlanInPlaceRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface PlacementStabilityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  placementStabilityQuality: PlacementStabilityQualityResult;
  placementStabilityCompliance: PlacementStabilityComplianceResult;
  placementStabilityPolicyResult: PlacementStabilityPolicyResult;
  staffReadiness: StaffPlacementStabilityReadinessResult;
  childProfiles: ChildPlacementStabilityProfile[];
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

export function evaluatePlacementStabilityQuality(
  records: PlacementStabilityRecord[],
): PlacementStabilityQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, matchingNeedsAssessedRate: 0, stabilityPlanInPlaceRate: 0, childViewIncorporatedRate: 0, riskFactorsIdentifiedRate: 0 };
  }

  const matchingNeedsAssessedRate = pct(records.filter((r) => r.matchingNeedsAssessed).length, n);
  const stabilityPlanInPlaceRate = pct(records.filter((r) => r.stabilityPlanInPlace).length, n);
  const childViewIncorporatedRate = pct(records.filter((r) => r.childViewIncorporated).length, n);
  const riskFactorsIdentifiedRate = pct(records.filter((r) => r.riskFactorsIdentified).length, n);

  let score = 0;
  score += (matchingNeedsAssessedRate / 100) * 7;
  score += (stabilityPlanInPlaceRate / 100) * 6;
  score += (childViewIncorporatedRate / 100) * 6;
  score += (riskFactorsIdentifiedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, matchingNeedsAssessedRate, stabilityPlanInPlaceRate, childViewIncorporatedRate, riskFactorsIdentifiedRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluatePlacementStabilityCompliance(
  records: PlacementStabilityRecord[],
): PlacementStabilityComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, matchingNeedsAssessedRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const matchingNeedsAssessedRate = pct(records.filter((r) => r.matchingNeedsAssessed).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (matchingNeedsAssessedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, matchingNeedsAssessedRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluatePlacementStabilityPolicyEval(
  policy: PlacementStabilityPolicy | null,
): PlacementStabilityPolicyResult {
  if (policy === null) {
    return { overallScore: 0, placementStabilityPolicy: false, matchingProcedure: false, disruptionManagementPolicy: false, transitionPlanningFramework: false, unplannedEndingProtocol: false, permanencePlanningPolicy: false, placementReviewSchedule: false };
  }

  let score = 0;
  if (policy.placementStabilityPolicy) score += 4;
  if (policy.matchingProcedure) score += 4;
  if (policy.disruptionManagementPolicy) score += 4;
  if (policy.transitionPlanningFramework) score += 4;
  if (policy.unplannedEndingProtocol) score += 3;
  if (policy.permanencePlanningPolicy) score += 3;
  if (policy.placementReviewSchedule) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    placementStabilityPolicy: policy.placementStabilityPolicy,
    matchingProcedure: policy.matchingProcedure,
    disruptionManagementPolicy: policy.disruptionManagementPolicy,
    transitionPlanningFramework: policy.transitionPlanningFramework,
    unplannedEndingProtocol: policy.unplannedEndingProtocol,
    permanencePlanningPolicy: policy.permanencePlanningPolicy,
    placementReviewSchedule: policy.placementReviewSchedule,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffPlacementStabilityReadiness(
  training: StaffPlacementStabilityTraining[],
): StaffPlacementStabilityReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, matchingAssessmentSkillsRate: 0, stabilityPlanningKnowledgeRate: 0, disruptionPreventionSkillsRate: 0, transitionSupportSkillsRate: 0, childParticipationSkillsRate: 0, permanencePlanningKnowledgeRate: 0 };
  }

  const matchingAssessmentSkillsRate = pct(training.filter((t) => t.matchingAssessmentSkills).length, n);
  const stabilityPlanningKnowledgeRate = pct(training.filter((t) => t.stabilityPlanningKnowledge).length, n);
  const disruptionPreventionSkillsRate = pct(training.filter((t) => t.disruptionPreventionSkills).length, n);
  const transitionSupportSkillsRate = pct(training.filter((t) => t.transitionSupportSkills).length, n);
  const childParticipationSkillsRate = pct(training.filter((t) => t.childParticipationSkills).length, n);
  const permanencePlanningKnowledgeRate = pct(training.filter((t) => t.permanencePlanningKnowledge).length, n);

  let score = 0;
  score += (matchingAssessmentSkillsRate / 100) * 6;
  score += (stabilityPlanningKnowledgeRate / 100) * 5;
  score += (disruptionPreventionSkillsRate / 100) * 5;
  score += (transitionSupportSkillsRate / 100) * 4;
  score += (childParticipationSkillsRate / 100) * 3;
  score += (permanencePlanningKnowledgeRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, matchingAssessmentSkillsRate, stabilityPlanningKnowledgeRate, disruptionPreventionSkillsRate, transitionSupportSkillsRate, childParticipationSkillsRate, permanencePlanningKnowledgeRate };
}

// ── Build Child Placement Stability Profiles ────────────────────────────

export function buildChildPlacementStabilityProfiles(
  records: PlacementStabilityRecord[],
): ChildPlacementStabilityProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: PlacementStabilityRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const matchingNeedsAssessedRate = pct(child.records.filter((r) => r.matchingNeedsAssessed).length, totalRecords);
    const stabilityPlanInPlaceRate = pct(child.records.filter((r) => r.stabilityPlanInPlace).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (matchingNeedsAssessedRate >= 80) rate1Score = 3;
    else if (matchingNeedsAssessedRate >= 60) rate1Score = 2;
    else if (matchingNeedsAssessedRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (stabilityPlanInPlaceRate >= 80) rate2Score = 3;
    else if (stabilityPlanInPlaceRate >= 60) rate2Score = 2;
    else if (stabilityPlanInPlaceRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, matchingNeedsAssessedRate, stabilityPlanInPlaceRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GeneratePlacementStabilityIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: PlacementStabilityRecord[];
  policy: PlacementStabilityPolicy | null;
  staff: StaffPlacementStabilityTraining[];
}

export function generatePlacementStabilityIntelligenceReport(
  input: GeneratePlacementStabilityIntelligenceInput,
): PlacementStabilityIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => r.date >= periodStart && r.date <= periodEnd);

  const qualityResult = evaluatePlacementStabilityQuality(periodRecords);
  const complianceResult = evaluatePlacementStabilityCompliance(periodRecords);
  const policyResult = evaluatePlacementStabilityPolicyEval(policy);
  const staffResult = evaluateStaffPlacementStabilityReadiness(staff);

  const childProfiles = buildChildPlacementStabilityProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Placement stability rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Placement stability rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Placement stability quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Placement stability compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Placement stability policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff placement stability readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.matchingNeedsAssessedRate >= 90) strengths.push("Matching needs assessment rate at " + qualityResult.matchingNeedsAssessedRate + "%");
  if (periodRecords.length > 0 && qualityResult.stabilityPlanInPlaceRate >= 90) strengths.push("Stability plans in place at " + qualityResult.stabilityPlanInPlaceRate + "%");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate >= 90) strengths.push("Documentation rate at " + complianceResult.documentationCompleteRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Placement stability rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Placement stability Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Placement stability quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Placement stability compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Placement stability policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff placement stability readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.matchingNeedsAssessedRate < 80) areasForImprovement.push("Matching needs assessment at " + qualityResult.matchingNeedsAssessedRate + "% — must improve to ensure proper child-home fit");
  if (periodRecords.length === 0) areasForImprovement.push("No placement stability records — stability activities must be documented");
  if (policy === null) areasForImprovement.push("No placement stability policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff placement stability training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No placement stability policy — develop and implement comprehensive policy immediately");
  if (staff.length === 0) actions.push("URGENT: No staff placement stability training — schedule training for all staff");
  if (periodRecords.length > 0 && qualityResult.matchingNeedsAssessedRate < 50) actions.push("HIGH: Matching needs assessment at " + qualityResult.matchingNeedsAssessedRate + "% — review matching processes");
  if (periodRecords.length > 0 && qualityResult.stabilityPlanInPlaceRate < 50) actions.push("HIGH: Stability plans at " + qualityResult.stabilityPlanInPlaceRate + "% — ensure stability plans are in place for all children");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all stability records must be completed");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.matchingAssessmentSkillsRate < 50) actions.push("MEDIUM: Matching assessment skills at " + staffResult.matchingAssessmentSkillsRate + "% — schedule training for staff");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low placement stability scores — review individual care plans");
  if (actions.length === 0) actions.push("No immediate actions required. Placement stability systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 36 — Assessment of prospective placements",
    "CHR 2015 Reg 14 — Care planning",
    "CHR 2015 Reg 9 — Quality of care",
    "NMS 11 — Placement stability",
    "SCCIF — Stability and permanence",
    "Children Act 1989 s.22C — Suitable accommodation",
    "Quality Standards 2015 — Standard 1 (child-centred care)",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    placementStabilityQuality: qualityResult,
    placementStabilityCompliance: complianceResult,
    placementStabilityPolicyResult: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
