/* ──────────────────────────────────────────────────────────────
   Health Intelligence Engine (v2)

   Pure deterministic engine for evaluating the quality and
   compliance of health provision and health outcomes for
   children in residential care.

   Covers health assessments, medical appointments, dental
   checks, immunisation reviews, mental health screenings,
   health action plans, medication reviews, and health
   promotion activities.

   Regulatory basis:
     - CHR 2015 Reg 10 — Health standard
     - CHR 2015 Reg 14 — Care planning (health)
     - NMS 6 — Healthcare
     - SCCIF — Experiences and progress (health)
     - Children Act 1989 s.22(3A) — Duty to promote welfare
     - Quality Standards 2015 — Standard 2 (health)
     - Promoting the health of looked-after children 2015

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type HealthIntelligenceCategory =
  | "health_assessment"
  | "medical_appointment"
  | "dental_check"
  | "immunisation_review"
  | "mental_health_screening"
  | "health_action_plan"
  | "medication_review"
  | "health_promotion";

export type HealthIntelligenceOutcome =
  | "health_improved"
  | "health_maintained"
  | "health_concern_identified"
  | "health_deteriorated"
  | "not_applicable";

export type HealthIntelligenceRating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const healthIntelligenceCategoryLabels: Record<HealthIntelligenceCategory, string> = {
  health_assessment: "Health Assessment",
  medical_appointment: "Medical Appointment",
  dental_check: "Dental Check",
  immunisation_review: "Immunisation Review",
  mental_health_screening: "Mental Health Screening",
  health_action_plan: "Health Action Plan",
  medication_review: "Medication Review",
  health_promotion: "Health Promotion",
};

const healthIntelligenceOutcomeLabels: Record<HealthIntelligenceOutcome, string> = {
  health_improved: "Health Improved",
  health_maintained: "Health Maintained",
  health_concern_identified: "Health Concern Identified",
  health_deteriorated: "Health Deteriorated",
  not_applicable: "Not Applicable",
};

const healthIntelligenceRatingLabels: Record<HealthIntelligenceRating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getHealthIntelligenceCategoryLabel(category: HealthIntelligenceCategory): string {
  return healthIntelligenceCategoryLabels[category];
}

export function getHealthIntelligenceOutcomeLabel(outcome: HealthIntelligenceOutcome): string {
  return healthIntelligenceOutcomeLabels[outcome];
}

export function getHealthIntelligenceRatingLabel(rating: HealthIntelligenceRating): string {
  return healthIntelligenceRatingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface HealthIntelligenceRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: HealthIntelligenceCategory;
  outcome: HealthIntelligenceOutcome;
  healthNeedsAssessed: boolean;
  consentObtained: boolean;
  childViewIncluded: boolean;
  followUpPlanned: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface HealthIntelligencePolicy {
  healthCarePolicy: boolean;
  consentToTreatmentPolicy: boolean;
  medicationManagementPolicy: boolean;
  mentalHealthSupportPolicy: boolean;
  healthPromotionPolicy: boolean;
  dentalHealthPolicy: boolean;
  immunisationTrackingPolicy: boolean;
}

export interface StaffHealthIntelligenceTraining {
  staffId: string;
  healthAssessmentKnowledge: boolean;
  medicationAdministration: boolean;
  mentalHealthAwareness: boolean;
  firstAidTraining: boolean;
  healthPromotionSkills: boolean;
  consentProcedures: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface HealthIntelligenceQualityResult {
  overallScore: number;
  totalRecords: number;
  healthNeedsAssessedRate: number;
  consentObtainedRate: number;
  childViewIncludedRate: number;
  followUpPlannedRate: number;
}

export interface HealthIntelligenceComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  healthNeedsAssessedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface HealthIntelligencePolicyResult {
  overallScore: number;
  healthCarePolicy: boolean;
  consentToTreatmentPolicy: boolean;
  medicationManagementPolicy: boolean;
  mentalHealthSupportPolicy: boolean;
  healthPromotionPolicy: boolean;
  dentalHealthPolicy: boolean;
  immunisationTrackingPolicy: boolean;
}

export interface StaffHealthIntelligenceReadinessResult {
  overallScore: number;
  totalStaff: number;
  healthAssessmentKnowledgeRate: number;
  medicationAdministrationRate: number;
  mentalHealthAwarenessRate: number;
  firstAidTrainingRate: number;
  healthPromotionSkillsRate: number;
  consentProceduresRate: number;
}

export interface ChildHealthIntelligenceProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  healthNeedsAssessedRate: number;
  consentObtainedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface HealthIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: HealthIntelligenceRating;
  healthQuality: HealthIntelligenceQualityResult;
  healthCompliance: HealthIntelligenceComplianceResult;
  healthPolicy: HealthIntelligencePolicyResult;
  staffReadiness: StaffHealthIntelligenceReadinessResult;
  childProfiles: ChildHealthIntelligenceProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function healthIntelligencePct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

export function getHealthIntelligenceRating(score: number): HealthIntelligenceRating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Quality (0-25) ──────────────────────────────────────────

export function evaluateHealthIntelligenceQuality(
  records: HealthIntelligenceRecord[],
): HealthIntelligenceQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, healthNeedsAssessedRate: 0, consentObtainedRate: 0, childViewIncludedRate: 0, followUpPlannedRate: 0 };
  }

  const healthNeedsAssessedRate = healthIntelligencePct(records.filter((r) => r.healthNeedsAssessed).length, n);
  const consentObtainedRate = healthIntelligencePct(records.filter((r) => r.consentObtained).length, n);
  const childViewIncludedRate = healthIntelligencePct(records.filter((r) => r.childViewIncluded).length, n);
  const followUpPlannedRate = healthIntelligencePct(records.filter((r) => r.followUpPlanned).length, n);

  let score = 0;
  score += (healthNeedsAssessedRate / 100) * 7;
  score += (consentObtainedRate / 100) * 6;
  score += (childViewIncludedRate / 100) * 6;
  score += (followUpPlannedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, healthNeedsAssessedRate, consentObtainedRate, childViewIncludedRate, followUpPlannedRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluateHealthIntelligenceCompliance(
  records: HealthIntelligenceRecord[],
): HealthIntelligenceComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, healthNeedsAssessedRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = healthIntelligencePct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = healthIntelligencePct(records.filter((r) => r.timelyRecording).length, n);
  const healthNeedsAssessedRate = healthIntelligencePct(records.filter((r) => r.healthNeedsAssessed).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (healthNeedsAssessedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, healthNeedsAssessedRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluateHealthIntelligencePolicy(
  policy: HealthIntelligencePolicy | null,
): HealthIntelligencePolicyResult {
  if (policy === null) {
    return { overallScore: 0, healthCarePolicy: false, consentToTreatmentPolicy: false, medicationManagementPolicy: false, mentalHealthSupportPolicy: false, healthPromotionPolicy: false, dentalHealthPolicy: false, immunisationTrackingPolicy: false };
  }

  let score = 0;
  if (policy.healthCarePolicy) score += 4;
  if (policy.consentToTreatmentPolicy) score += 4;
  if (policy.medicationManagementPolicy) score += 4;
  if (policy.mentalHealthSupportPolicy) score += 4;
  if (policy.healthPromotionPolicy) score += 3;
  if (policy.dentalHealthPolicy) score += 3;
  if (policy.immunisationTrackingPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    healthCarePolicy: policy.healthCarePolicy,
    consentToTreatmentPolicy: policy.consentToTreatmentPolicy,
    medicationManagementPolicy: policy.medicationManagementPolicy,
    mentalHealthSupportPolicy: policy.mentalHealthSupportPolicy,
    healthPromotionPolicy: policy.healthPromotionPolicy,
    dentalHealthPolicy: policy.dentalHealthPolicy,
    immunisationTrackingPolicy: policy.immunisationTrackingPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffHealthIntelligenceReadiness(
  training: StaffHealthIntelligenceTraining[],
): StaffHealthIntelligenceReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, healthAssessmentKnowledgeRate: 0, medicationAdministrationRate: 0, mentalHealthAwarenessRate: 0, firstAidTrainingRate: 0, healthPromotionSkillsRate: 0, consentProceduresRate: 0 };
  }

  const healthAssessmentKnowledgeRate = healthIntelligencePct(training.filter((t) => t.healthAssessmentKnowledge).length, n);
  const medicationAdministrationRate = healthIntelligencePct(training.filter((t) => t.medicationAdministration).length, n);
  const mentalHealthAwarenessRate = healthIntelligencePct(training.filter((t) => t.mentalHealthAwareness).length, n);
  const firstAidTrainingRate = healthIntelligencePct(training.filter((t) => t.firstAidTraining).length, n);
  const healthPromotionSkillsRate = healthIntelligencePct(training.filter((t) => t.healthPromotionSkills).length, n);
  const consentProceduresRate = healthIntelligencePct(training.filter((t) => t.consentProcedures).length, n);

  let score = 0;
  score += (healthAssessmentKnowledgeRate / 100) * 6;
  score += (medicationAdministrationRate / 100) * 5;
  score += (mentalHealthAwarenessRate / 100) * 5;
  score += (firstAidTrainingRate / 100) * 4;
  score += (healthPromotionSkillsRate / 100) * 3;
  score += (consentProceduresRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, healthAssessmentKnowledgeRate, medicationAdministrationRate, mentalHealthAwarenessRate, firstAidTrainingRate, healthPromotionSkillsRate, consentProceduresRate };
}

// ── Build Child Health Intelligence Profiles ─────────────────────────────

export function buildChildHealthIntelligenceProfiles(
  records: HealthIntelligenceRecord[],
): ChildHealthIntelligenceProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: HealthIntelligenceRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const healthNeedsAssessedRate = healthIntelligencePct(child.records.filter((r) => r.healthNeedsAssessed).length, totalRecords);
    const consentObtainedRate = healthIntelligencePct(child.records.filter((r) => r.consentObtained).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (healthNeedsAssessedRate >= 80) rate1Score = 3;
    else if (healthNeedsAssessedRate >= 60) rate1Score = 2;
    else if (healthNeedsAssessedRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (consentObtainedRate >= 80) rate2Score = 3;
    else if (consentObtainedRate >= 60) rate2Score = 2;
    else if (consentObtainedRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, healthNeedsAssessedRate, consentObtainedRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateHealthIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: HealthIntelligenceRecord[];
  policy: HealthIntelligencePolicy | null;
  staff: StaffHealthIntelligenceTraining[];
}

export function generateHealthIntelligenceResult(
  input: GenerateHealthIntelligenceInput,
): HealthIntelligenceResult {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => withinPeriod(r.date, periodStart, periodEnd));

  const qualityResult = evaluateHealthIntelligenceQuality(periodRecords);
  const complianceResult = evaluateHealthIntelligenceCompliance(periodRecords);
  const policyResult = evaluateHealthIntelligencePolicy(policy);
  const staffResult = evaluateStaffHealthIntelligenceReadiness(staff);

  const childProfiles = buildChildHealthIntelligenceProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getHealthIntelligenceRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Health provision rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Health provision rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Health quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Health compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Health policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff health readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.healthNeedsAssessedRate >= 90) strengths.push("Health needs assessed at " + qualityResult.healthNeedsAssessedRate + "%");
  if (periodRecords.length > 0 && qualityResult.consentObtainedRate >= 90) strengths.push("Consent obtained at " + qualityResult.consentObtainedRate + "%");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate >= 90) strengths.push("Documentation rate at " + complianceResult.documentationCompleteRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Health provision rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Health provision Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Health quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Health compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Health policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff health readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.healthNeedsAssessedRate < 80) areasForImprovement.push("Health needs assessment at " + qualityResult.healthNeedsAssessedRate + "% — must improve for child welfare");
  if (periodRecords.length === 0) areasForImprovement.push("No health records — assessments must be documented");
  if (policy === null) areasForImprovement.push("No health policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff health training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No health policy — develop and implement comprehensive health policy immediately");
  if (staff.length === 0) actions.push("URGENT: No staff health training — schedule training for all staff");
  if (periodRecords.length > 0 && qualityResult.healthNeedsAssessedRate < 50) actions.push("HIGH: Health needs assessment at " + qualityResult.healthNeedsAssessedRate + "% — review assessment schedules and processes");
  if (periodRecords.length > 0 && qualityResult.childViewIncludedRate < 50) actions.push("HIGH: Child view inclusion at " + qualityResult.childViewIncludedRate + "% — strengthen child participation");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all assessments must be recorded");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.healthAssessmentKnowledgeRate < 50) actions.push("MEDIUM: Health assessment knowledge at " + staffResult.healthAssessmentKnowledgeRate + "% — schedule training for staff");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low health scores — review individual health provisions");
  if (actions.length === 0) actions.push("No immediate actions required. Health provision systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 10 — Health standard",
    "CHR 2015 Reg 14 — Care planning (health)",
    "NMS 6 — Healthcare",
    "SCCIF — Experiences and progress (health)",
    "Children Act 1989 s.22(3A) — Duty to promote welfare",
    "Quality Standards 2015 — Standard 2 (health)",
    "Promoting the health of looked-after children 2015",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    healthQuality: qualityResult,
    healthCompliance: complianceResult,
    healthPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
