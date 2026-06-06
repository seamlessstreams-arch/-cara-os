/* ──────────────────────────────────────────────────────────────
   Premises Intelligence Engine

   Pure deterministic engine for evaluating the quality, safety,
   and suitability of the physical environment in children's
   residential care homes.

   Regulatory basis:
     - CHR 2015 Reg 25 — Premises
     - CHR 2015 Reg 26 — Fire precautions
     - NMS 24 — Physical environment
     - SCCIF — Safety of children
     - Regulatory Reform (Fire Safety) Order 2005
     - Quality Standards 2015 Standard 10
     - Health and Safety at Work Act 1974

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type PremisesIntelligenceCategory =
  | "fire_safety_check"
  | "health_safety_inspection"
  | "maintenance_repair"
  | "bedroom_standard"
  | "communal_area_check"
  | "garden_outdoor_area"
  | "security_assessment"
  | "accessibility_review";

export type PremisesIntelligenceOutcome =
  | "fully_compliant"
  | "minor_issues"
  | "significant_issues"
  | "non_compliant"
  | "not_applicable";

export type PremisesIntelligenceRating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const premisesIntelligenceCategoryLabels: Record<PremisesIntelligenceCategory, string> = {
  fire_safety_check: "Fire Safety Check",
  health_safety_inspection: "Health & Safety Inspection",
  maintenance_repair: "Maintenance & Repair",
  bedroom_standard: "Bedroom Standard",
  communal_area_check: "Communal Area Check",
  garden_outdoor_area: "Garden & Outdoor Area",
  security_assessment: "Security Assessment",
  accessibility_review: "Accessibility Review",
};

const premisesIntelligenceOutcomeLabels: Record<PremisesIntelligenceOutcome, string> = {
  fully_compliant: "Fully Compliant",
  minor_issues: "Minor Issues",
  significant_issues: "Significant Issues",
  non_compliant: "Non-Compliant",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<PremisesIntelligenceRating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getPremisesIntelligenceCategoryLabel(category: PremisesIntelligenceCategory): string {
  return premisesIntelligenceCategoryLabels[category];
}

export function getPremisesIntelligenceOutcomeLabel(outcome: PremisesIntelligenceOutcome): string {
  return premisesIntelligenceOutcomeLabels[outcome];
}

export function getRatingLabel(rating: PremisesIntelligenceRating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface PremisesIntelligenceRecord {
  id: string;
  homeId: string;
  date: string;
  staffId: string;
  staffName: string;
  category: PremisesIntelligenceCategory;
  outcome: PremisesIntelligenceOutcome;
  hazardIdentified: boolean;
  riskMitigated: boolean;
  maintenanceCompleted: boolean;
  childFriendlyAssessed: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface PremisesIntelligencePolicy {
  healthSafetyPolicy: boolean;
  fireSafetyPolicy: boolean;
  maintenanceSchedulePolicy: boolean;
  bedroomStandardsPolicy: boolean;
  securityPolicy: boolean;
  accessibilityPolicy: boolean;
  environmentalSustainabilityPolicy: boolean;
}

export interface StaffPremisesTraining {
  staffId: string;
  healthSafetyKnowledge: boolean;
  fireSafetyTraining: boolean;
  maintenanceSkills: boolean;
  riskAssessmentSkills: boolean;
  firstAidTraining: boolean;
  accessibilityAwareness: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface PremisesIntelligenceQualityResult {
  overallScore: number;
  totalRecords: number;
  hazardIdentifiedRate: number;
  riskMitigatedRate: number;
  maintenanceCompletedRate: number;
  childFriendlyAssessedRate: number;
}

export interface PremisesIntelligenceComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  hazardIdentifiedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface PremisesIntelligencePolicyResult {
  overallScore: number;
  healthSafetyPolicy: boolean;
  fireSafetyPolicy: boolean;
  maintenanceSchedulePolicy: boolean;
  bedroomStandardsPolicy: boolean;
  securityPolicy: boolean;
  accessibilityPolicy: boolean;
  environmentalSustainabilityPolicy: boolean;
}

export interface StaffPremisesReadinessResult {
  overallScore: number;
  totalStaff: number;
  healthSafetyKnowledgeRate: number;
  fireSafetyTrainingRate: number;
  maintenanceSkillsRate: number;
  riskAssessmentSkillsRate: number;
  firstAidTrainingRate: number;
  accessibilityAwarenessRate: number;
}

export interface AreaProfile {
  category: PremisesIntelligenceCategory;
  categoryLabel: string;
  totalRecords: number;
  hazardIdentifiedRate: number;
  maintenanceCompletedRate: number;
  riskMitigatedRate: number;
  overallScore: number;
}

export interface PremisesIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: PremisesIntelligenceRating;
  premisesQuality: PremisesIntelligenceQualityResult;
  premisesCompliance: PremisesIntelligenceComplianceResult;
  premisesPolicy: PremisesIntelligencePolicyResult;
  staffReadiness: StaffPremisesReadinessResult;
  areaProfiles: AreaProfile[];
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

export function getRating(score: number): PremisesIntelligenceRating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Quality (0-25) ──────────────────────────────────────────

export function evaluatePremisesQuality(
  records: PremisesIntelligenceRecord[],
): PremisesIntelligenceQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, hazardIdentifiedRate: 0, riskMitigatedRate: 0, maintenanceCompletedRate: 0, childFriendlyAssessedRate: 0 };
  }

  const hazardIdentifiedRate = pct(records.filter((r) => r.hazardIdentified).length, n);
  const riskMitigatedRate = pct(records.filter((r) => r.riskMitigated).length, n);
  const maintenanceCompletedRate = pct(records.filter((r) => r.maintenanceCompleted).length, n);
  const childFriendlyAssessedRate = pct(records.filter((r) => r.childFriendlyAssessed).length, n);

  let score = 0;
  score += (hazardIdentifiedRate / 100) * 7;
  score += (riskMitigatedRate / 100) * 6;
  score += (maintenanceCompletedRate / 100) * 6;
  score += (childFriendlyAssessedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, hazardIdentifiedRate, riskMitigatedRate, maintenanceCompletedRate, childFriendlyAssessedRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluatePremisesCompliance(
  records: PremisesIntelligenceRecord[],
): PremisesIntelligenceComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, hazardIdentifiedRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const hazardIdentifiedRate = pct(records.filter((r) => r.hazardIdentified).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (hazardIdentifiedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, hazardIdentifiedRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluatePremisesPolicy(
  policy: PremisesIntelligencePolicy | null,
): PremisesIntelligencePolicyResult {
  if (policy === null) {
    return { overallScore: 0, healthSafetyPolicy: false, fireSafetyPolicy: false, maintenanceSchedulePolicy: false, bedroomStandardsPolicy: false, securityPolicy: false, accessibilityPolicy: false, environmentalSustainabilityPolicy: false };
  }

  let score = 0;
  if (policy.healthSafetyPolicy) score += 4;
  if (policy.fireSafetyPolicy) score += 4;
  if (policy.maintenanceSchedulePolicy) score += 4;
  if (policy.bedroomStandardsPolicy) score += 4;
  if (policy.securityPolicy) score += 3;
  if (policy.accessibilityPolicy) score += 3;
  if (policy.environmentalSustainabilityPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    healthSafetyPolicy: policy.healthSafetyPolicy,
    fireSafetyPolicy: policy.fireSafetyPolicy,
    maintenanceSchedulePolicy: policy.maintenanceSchedulePolicy,
    bedroomStandardsPolicy: policy.bedroomStandardsPolicy,
    securityPolicy: policy.securityPolicy,
    accessibilityPolicy: policy.accessibilityPolicy,
    environmentalSustainabilityPolicy: policy.environmentalSustainabilityPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffPremisesReadiness(
  training: StaffPremisesTraining[],
): StaffPremisesReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, healthSafetyKnowledgeRate: 0, fireSafetyTrainingRate: 0, maintenanceSkillsRate: 0, riskAssessmentSkillsRate: 0, firstAidTrainingRate: 0, accessibilityAwarenessRate: 0 };
  }

  const healthSafetyKnowledgeRate = pct(training.filter((t) => t.healthSafetyKnowledge).length, n);
  const fireSafetyTrainingRate = pct(training.filter((t) => t.fireSafetyTraining).length, n);
  const maintenanceSkillsRate = pct(training.filter((t) => t.maintenanceSkills).length, n);
  const riskAssessmentSkillsRate = pct(training.filter((t) => t.riskAssessmentSkills).length, n);
  const firstAidTrainingRate = pct(training.filter((t) => t.firstAidTraining).length, n);
  const accessibilityAwarenessRate = pct(training.filter((t) => t.accessibilityAwareness).length, n);

  let score = 0;
  score += (healthSafetyKnowledgeRate / 100) * 6;
  score += (fireSafetyTrainingRate / 100) * 5;
  score += (maintenanceSkillsRate / 100) * 5;
  score += (riskAssessmentSkillsRate / 100) * 4;
  score += (firstAidTrainingRate / 100) * 3;
  score += (accessibilityAwarenessRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, healthSafetyKnowledgeRate, fireSafetyTrainingRate, maintenanceSkillsRate, riskAssessmentSkillsRate, firstAidTrainingRate, accessibilityAwarenessRate };
}

// ── Build Area Profiles ────────────────────────────────────────────────────

export function buildAreaProfiles(
  records: PremisesIntelligenceRecord[],
): AreaProfile[] {
  if (records.length === 0) return [];

  const areaMap = new Map<PremisesIntelligenceCategory, PremisesIntelligenceRecord[]>();

  for (const r of records) {
    if (!areaMap.has(r.category)) {
      areaMap.set(r.category, []);
    }
    areaMap.get(r.category)!.push(r);
  }

  return Array.from(areaMap.entries()).map(([category, recs]) => {
    const totalRecords = recs.length;
    const hazardIdentifiedRate = pct(recs.filter((r) => r.hazardIdentified).length, totalRecords);
    const maintenanceCompletedRate = pct(recs.filter((r) => r.maintenanceCompleted).length, totalRecords);
    const riskMitigatedRate = pct(recs.filter((r) => r.riskMitigated).length, totalRecords);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (hazardIdentifiedRate >= 80) rate1Score = 3;
    else if (hazardIdentifiedRate >= 60) rate1Score = 2;
    else if (hazardIdentifiedRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (maintenanceCompletedRate >= 80) rate2Score = 3;
    else if (maintenanceCompletedRate >= 60) rate2Score = 2;
    else if (maintenanceCompletedRate >= 40) rate2Score = 1;

    let riskBonus = 0;
    if (riskMitigatedRate >= 80) riskBonus = 2;
    else if (riskMitigatedRate >= 40) riskBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + riskBonus);

    return {
      category,
      categoryLabel: premisesIntelligenceCategoryLabels[category],
      totalRecords,
      hazardIdentifiedRate,
      maintenanceCompletedRate,
      riskMitigatedRate,
      overallScore,
    };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GeneratePremisesIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: PremisesIntelligenceRecord[];
  policy: PremisesIntelligencePolicy | null;
  staff: StaffPremisesTraining[];
}

export function generatePremisesIntelligenceReport(
  input: GeneratePremisesIntelligenceInput,
): PremisesIntelligenceResult {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => withinPeriod(r.date, periodStart, periodEnd));

  const qualityResult = evaluatePremisesQuality(periodRecords);
  const complianceResult = evaluatePremisesCompliance(periodRecords);
  const policyResult = evaluatePremisesPolicy(policy);
  const staffResult = evaluateStaffPremisesReadiness(staff);

  const areaProfiles = buildAreaProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Premises intelligence rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Premises intelligence rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Premises quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Premises compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Premises policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff premises readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.hazardIdentifiedRate >= 90) strengths.push("Hazard identification rate at " + qualityResult.hazardIdentifiedRate + "%");
  if (periodRecords.length > 0 && qualityResult.maintenanceCompletedRate >= 90) strengths.push("Maintenance completion rate at " + qualityResult.maintenanceCompletedRate + "%");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate >= 90) strengths.push("Documentation rate at " + complianceResult.documentationCompleteRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Premises intelligence rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Premises intelligence Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Premises quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Premises compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Premises policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff premises readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.hazardIdentifiedRate < 80) areasForImprovement.push("Hazard identification at " + qualityResult.hazardIdentifiedRate + "% — must improve for child safety");
  if (periodRecords.length === 0) areasForImprovement.push("No premises records — inspections must be documented");
  if (policy === null) areasForImprovement.push("No premises policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff premises training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No premises policy — develop and implement comprehensive policy immediately");
  if (staff.length === 0) actions.push("URGENT: No staff premises training — schedule training for all premises staff");
  if (periodRecords.length > 0 && qualityResult.hazardIdentifiedRate < 50) actions.push("HIGH: Hazard identification at " + qualityResult.hazardIdentifiedRate + "% — review inspection procedures and checklists");
  if (periodRecords.length > 0 && qualityResult.maintenanceCompletedRate < 50) actions.push("HIGH: Maintenance completion at " + qualityResult.maintenanceCompletedRate + "% — ensure maintenance tasks are followed through");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all premises checks must be recorded");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.healthSafetyKnowledgeRate < 50) actions.push("MEDIUM: Health & safety knowledge at " + staffResult.healthSafetyKnowledgeRate + "% — schedule training for premises staff");
  const lowScoreAreas = areaProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreAreas.length > 0) actions.push("MEDIUM: " + lowScoreAreas.length + " area(s) with low premises scores — review individual area conditions");
  if (actions.length === 0) actions.push("No immediate actions required. Premises systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 25 — Premises",
    "CHR 2015 Reg 26 — Fire precautions",
    "NMS 24 — Physical environment",
    "SCCIF — Safety of children",
    "Regulatory Reform (Fire Safety) Order 2005",
    "Quality Standards 2015 Standard 10",
    "Health and Safety at Work Act 1974",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    premisesQuality: qualityResult,
    premisesCompliance: complianceResult,
    premisesPolicy: policyResult,
    staffReadiness: staffResult,
    areaProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
