import { below, formatRate, meets, rate } from "@/lib/metrics/rate";
/* ──────────────────────────────────────────────────────────────
   Health Intelligence Engine

   Pure deterministic engine for tracking health assessments,
   medical appointments, immunisations, and wellbeing for
   looked-after children.

   Regulatory basis:
     - CHR 2015 Reg 10 — The health and wellbeing standard
     - Promoting Health of Looked After Children (DfE/DoH 2015)
     - IHA within 20 working days of becoming LAC
     - RHA annually (6-monthly for under-5s)
     - SDQ (Strengths & Difficulties Questionnaire) annually
     - SCCIF — Health and wellbeing of children
     - UNCRC Article 24 — Right to health

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type HealthAssessmentType =
  | "initial_health_assessment"
  | "review_health_assessment"
  | "dental_check"
  | "optical_check"
  | "immunisation_review"
  | "sdq_assessment"
  | "mental_health_review"
  | "specialist_referral";

export type AssessmentOutcome =
  | "completed_on_time"
  | "completed_late"
  | "overdue"
  | "missed"
  | "not_due";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ───────────────────────────────────────────────────────

export interface HealthRecord {
  id: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  assessmentType: HealthAssessmentType;
  outcome: AssessmentOutcome;
  childConsented: boolean;
  actionPlanCreated: boolean;
  gpNotified: boolean;
  documentedInCareFile: boolean;
  followUpScheduled: boolean;
  parentCarerInformed: boolean;
}

export interface HealthPolicy {
  id: string;
  healthAssessmentSchedule: boolean;
  mentalHealthStrategy: boolean;
  medicationProtocol: boolean;
  consentFramework: boolean;
  dentalOpticalTracking: boolean;
  immunisationMonitoring: boolean;
  regularReview: boolean;
}

export interface StaffHealthTraining {
  id: string;
  staffId: string;
  staffName: string;
  healthAssessmentProcess: boolean;
  mentalHealthAwareness: boolean;
  medicationAdministration: boolean;
  consentAndCapacity: boolean;
  firstAidCertified: boolean;
  healthPromotionSkills: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface HealthQualityResult {
  overallScore: number;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  completedOnTimeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childConsentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  actionPlanRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  followUpRate: number | null;
}

export interface HealthComplianceResult {
  overallScore: number;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  documentedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  gpNotifiedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  parentInformedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  typeDiversityRatio: number | null;
}

export interface HealthPolicyResult {
  overallScore: number;
  healthAssessmentSchedule: boolean;
  mentalHealthStrategy: boolean;
  medicationProtocol: boolean;
  consentFramework: boolean;
  dentalOpticalTracking: boolean;
  immunisationMonitoring: boolean;
  regularReview: boolean;
}

export interface StaffHealthReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  healthAssessmentProcessRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  mentalHealthAwarenessRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  medicationAdministrationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  consentAndCapacityRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  firstAidCertifiedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  healthPromotionSkillsRate: number | null;
}

export interface ChildHealthProfile {
  childId: string;
  childName: string;
  totalAssessments: number;
  overallScore: number;
  completedOnTimeRate: number;
  childConsentRate: number;
  diversityCount: number;
}

export interface HealthIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  healthQuality: HealthQualityResult;
  healthCompliance: HealthComplianceResult;
  healthPolicy: HealthPolicyResult;
  staffHealthReadiness: StaffHealthReadinessResult;
  childProfiles: ChildHealthProfile[];
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

// ── Label Maps ─────────────────────────────────────────────────────────────

const ASSESSMENT_TYPE_LABELS: Record<HealthAssessmentType, string> = {
  initial_health_assessment: "Initial Health Assessment",
  review_health_assessment: "Review Health Assessment",
  dental_check: "Dental Check",
  optical_check: "Optical Check",
  immunisation_review: "Immunisation Review",
  sdq_assessment: "SDQ Assessment",
  mental_health_review: "Mental Health Review",
  specialist_referral: "Specialist Referral",
};

const OUTCOME_LABELS: Record<AssessmentOutcome, string> = {
  completed_on_time: "Completed On Time",
  completed_late: "Completed Late",
  overdue: "Overdue",
  missed: "Missed",
  not_due: "Not Due",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getAssessmentTypeLabel(v: HealthAssessmentType): string {
  return ASSESSMENT_TYPE_LABELS[v];
}

export function getOutcomeLabel(v: AssessmentOutcome): string {
  return OUTCOME_LABELS[v];
}

export function getRatingLabel(v: Rating): string {
  return RATING_LABELS[v];
}

// ── Evaluator 1: Health Quality (0–25) ─────────────────────────────────────

export function evaluateHealthQuality(
  records: HealthRecord[],
): HealthQualityResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      completedOnTimeRate: null,
      childConsentRate: null,
      actionPlanRate: null,
      followUpRate: null,
    };
  }

  const completedOnTime = records.filter(
    (r) => r.outcome === "completed_on_time",
  ).length;
  const consented = records.filter((r) => r.childConsented).length;
  const actionPlan = records.filter((r) => r.actionPlanCreated).length;
  const followUp = records.filter((r) => r.followUpScheduled).length;

  const completedOnTimeRate = rate(completedOnTime, records.length);
  const childConsentRate = rate(consented, records.length);
  const actionPlanRate = rate(actionPlan, records.length);
  const followUpRate = rate(followUp, records.length);

  // Weights: completedOnTimeRate 7 + childConsentRate 6 + actionPlanRate 6 + followUpRate 6 = 25
  let score = 0;
  score += Math.round((completedOnTimeRate! / 100) * 7);
  score += Math.round((childConsentRate! / 100) * 6);
  score += Math.round((actionPlanRate! / 100) * 6);
  score += Math.round((followUpRate! / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalRecords: records.length,
    completedOnTimeRate,
    childConsentRate,
    actionPlanRate,
    followUpRate,
  };
}

// ── Evaluator 2: Health Compliance (0–25) ──────────────────────────────────

const ALL_ASSESSMENT_TYPES: HealthAssessmentType[] = [
  "initial_health_assessment",
  "review_health_assessment",
  "dental_check",
  "optical_check",
  "immunisation_review",
  "sdq_assessment",
  "mental_health_review",
  "specialist_referral",
];

export function evaluateHealthCompliance(
  records: HealthRecord[],
): HealthComplianceResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      documentedRate: null,
      gpNotifiedRate: null,
      parentInformedRate: null,
      typeDiversityRatio: 0,
    };
  }

  const documented = records.filter((r) => r.documentedInCareFile).length;
  const gpNotified = records.filter((r) => r.gpNotified).length;
  const parentInformed = records.filter((r) => r.parentCarerInformed).length;

  const uniqueTypes = new Set(records.map((r) => r.assessmentType));
  const typeDiversityRatio = rate(uniqueTypes.size, ALL_ASSESSMENT_TYPES.length);

  const documentedRate = rate(documented, records.length);
  const gpNotifiedRate = rate(gpNotified, records.length);
  const parentInformedRate = rate(parentInformed, records.length);

  // Weights: documentedRate 8 + gpNotifiedRate 7 + parentInformedRate 5 + typeDiversityRatio 5 = 25
  let score = 0;
  score += Math.round((documentedRate! / 100) * 8);
  score += Math.round((gpNotifiedRate! / 100) * 7);
  score += Math.round((parentInformedRate! / 100) * 5);
  score += Math.round(((typeDiversityRatio ?? 0) / 100) * 5);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalRecords: records.length,
    documentedRate,
    gpNotifiedRate,
    parentInformedRate,
    typeDiversityRatio,
  };
}

// ── Evaluator 3: Health Policy (0–25) ──────────────────────────────────────

export function evaluateHealthPolicy(
  policy: HealthPolicy | null,
): HealthPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      healthAssessmentSchedule: false,
      mentalHealthStrategy: false,
      medicationProtocol: false,
      consentFramework: false,
      dentalOpticalTracking: false,
      immunisationMonitoring: false,
      regularReview: false,
    };
  }

  // Weights: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.healthAssessmentSchedule) score += 4;
  if (policy.mentalHealthStrategy) score += 4;
  if (policy.medicationProtocol) score += 4;
  if (policy.consentFramework) score += 4;
  if (policy.dentalOpticalTracking) score += 3;
  if (policy.immunisationMonitoring) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    healthAssessmentSchedule: policy.healthAssessmentSchedule,
    mentalHealthStrategy: policy.mentalHealthStrategy,
    medicationProtocol: policy.medicationProtocol,
    consentFramework: policy.consentFramework,
    dentalOpticalTracking: policy.dentalOpticalTracking,
    immunisationMonitoring: policy.immunisationMonitoring,
    regularReview: policy.regularReview,
  };
}

// ── Evaluator 4: Staff Health Readiness (0–25) ─────────────────────────────

export function evaluateStaffHealthReadiness(
  training: StaffHealthTraining[],
): StaffHealthReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      healthAssessmentProcessRate: null,
      mentalHealthAwarenessRate: null,
      medicationAdministrationRate: null,
      consentAndCapacityRate: null,
      firstAidCertifiedRate: null,
      healthPromotionSkillsRate: null,
    };
  }

  let assessmentProcess = 0;
  let mentalHealth = 0;
  let medication = 0;
  let consent = 0;
  let firstAid = 0;
  let healthPromo = 0;

  for (const t of training) {
    if (t.healthAssessmentProcess) assessmentProcess++;
    if (t.mentalHealthAwareness) mentalHealth++;
    if (t.medicationAdministration) medication++;
    if (t.consentAndCapacity) consent++;
    if (t.firstAidCertified) firstAid++;
    if (t.healthPromotionSkills) healthPromo++;
  }

  const healthAssessmentProcessRate = rate(assessmentProcess, training.length);
  const mentalHealthAwarenessRate = rate(mentalHealth, training.length);
  const medicationAdministrationRate = rate(medication, training.length);
  const consentAndCapacityRate = rate(consent, training.length);
  const firstAidCertifiedRate = rate(firstAid, training.length);
  const healthPromotionSkillsRate = rate(healthPromo, training.length);

  // Weights: 6+5+5+4+3+2 = 25
  let score = 0;
  score += Math.round((healthAssessmentProcessRate! / 100) * 6);
  score += Math.round(((mentalHealthAwarenessRate ?? 0) / 100) * 5);
  score += Math.round(((medicationAdministrationRate ?? 0) / 100) * 5);
  score += Math.round(((consentAndCapacityRate ?? 0) / 100) * 4);
  score += Math.round(((firstAidCertifiedRate ?? 0) / 100) * 3);
  score += Math.round(((healthPromotionSkillsRate ?? 0) / 100) * 2);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalStaff: training.length,
    healthAssessmentProcessRate,
    mentalHealthAwarenessRate,
    medicationAdministrationRate,
    consentAndCapacityRate,
    firstAidCertifiedRate,
    healthPromotionSkillsRate,
  };
}

// ── Child Health Profiles (0–10 per child) ─────────────────────────────────

export function buildChildHealthProfiles(
  records: HealthRecord[],
): ChildHealthProfile[] {
  const childIds = new Set<string>();
  const childNames = new Map<string, string>();

  for (const r of records) {
    childIds.add(r.childId);
    childNames.set(r.childId, r.childName);
  }

  return Array.from(childIds).map((childId) => {
    const childRecords = records.filter((r) => r.childId === childId);

    const completedOnTime = childRecords.filter(
      (r) => r.outcome === "completed_on_time",
    ).length;
    const consented = childRecords.filter((r) => r.childConsented).length;
    const uniqueTypes = new Set(childRecords.map((r) => r.assessmentType));

    const completedOnTimeRate = rate(completedOnTime, childRecords.length)!;
    const childConsentRate = rate(consented, childRecords.length)!;

    // freq: >=10 -> 2, >=5 -> 1, else 0
    let freq = 0;
    if (childRecords.length >= 10) freq = 2;
    else if (childRecords.length >= 5) freq = 1;

    // rate1 (completedOnTimeRate): >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
    let rate1 = 0;
    if (meets(completedOnTimeRate, 80)) rate1 = 3;
    else if (meets(completedOnTimeRate, 60)) rate1 = 2;
    else if (meets(completedOnTimeRate, 40)) rate1 = 1;

    // rate2 (childConsentRate): same thresholds
    let rate2 = 0;
    if (meets(childConsentRate, 80)) rate2 = 3;
    else if (meets(childConsentRate, 60)) rate2 = 2;
    else if (meets(childConsentRate, 40)) rate2 = 1;

    // diversity (unique assessment types): >=4 -> 2, >=2 -> 1, else 0
    let diversity = 0;
    if (uniqueTypes.size >= 4) diversity = 2;
    else if (uniqueTypes.size >= 2) diversity = 1;

    const overallScore = Math.min(10, freq + rate1 + rate2 + diversity);

    return {
      childId,
      childName: childNames.get(childId) || "Unknown",
      totalAssessments: childRecords.length,
      overallScore,
      completedOnTimeRate,
      childConsentRate,
      diversityCount: uniqueTypes.size,
    };
  });
}

// ── Master Generator ───────────────────────────────────────────────────────

export function generateHealthIntelligence(
  records: HealthRecord[],
  policy: HealthPolicy | null,
  training: StaffHealthTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): HealthIntelligence {
  const healthQuality = evaluateHealthQuality(records);
  const healthCompliance = evaluateHealthCompliance(records);
  const healthPolicy = evaluateHealthPolicy(policy);
  const staffHealthReadiness = evaluateStaffHealthReadiness(training);

  const rawScore =
    healthQuality.overallScore +
    healthCompliance.overallScore +
    healthPolicy.overallScore +
    staffHealthReadiness.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const childProfiles = buildChildHealthProfiles(records);

  // ── Strengths (score >= 20) ──
  const strengths: string[] = [];
  if (healthQuality.overallScore >= 20)
    strengths.push("Health assessment quality is strong with " + formatRate(healthQuality.completedOnTimeRate) + " completed on time");
  if (healthCompliance.overallScore >= 20)
    strengths.push("Health compliance is excellent with " + formatRate(healthCompliance.documentedRate) + " documentation rate");
  if (healthPolicy.overallScore >= 20)
    strengths.push("Comprehensive health policies in place covering key regulatory areas");
  if (staffHealthReadiness.overallScore >= 20)
    strengths.push("Staff health readiness is strong with well-trained team across all competencies");
  if (meets(healthQuality.childConsentRate, 90))
    strengths.push("Excellent child consent practice at " + healthQuality.childConsentRate + "%");
  if (meets(healthQuality.actionPlanRate, 90))
    strengths.push("Action plans consistently created for health assessments");
  if (meets(healthCompliance.gpNotifiedRate, 90))
    strengths.push("GP notification rate excellent at " + healthCompliance.gpNotifiedRate + "%");
  if (meets(healthCompliance.parentInformedRate, 90))
    strengths.push("Parents/carers consistently informed of health outcomes");
  if (staffHealthReadiness.firstAidCertifiedRate === 100)
    strengths.push("All staff hold current first aid certification");

  // ── Areas for Improvement (score < 15) ──
  const areasForImprovement: string[] = [];
  if (healthQuality.overallScore < 15)
    areasForImprovement.push("Health assessment quality needs improvement — overall quality score " + healthQuality.overallScore + "/25");
  if (healthCompliance.overallScore < 15)
    areasForImprovement.push("Health compliance needs strengthening — documentation and notification gaps identified");
  if (healthPolicy.overallScore < 15)
    areasForImprovement.push("Health policy framework is incomplete — review and update policies");
  if (staffHealthReadiness.overallScore < 15)
    areasForImprovement.push("Staff health readiness requires improvement — training gaps identified");
  if (below(healthQuality.completedOnTimeRate, 50))
    areasForImprovement.push("Only " + healthQuality.completedOnTimeRate + "% of assessments completed on time — target 80%+");
  if (below(healthCompliance.documentedRate, 50))
    areasForImprovement.push("Documentation rate at " + healthCompliance.documentedRate + "% — all assessments must be recorded in care files");
  if (below(healthQuality.childConsentRate, 50))
    areasForImprovement.push("Child consent rate at " + healthQuality.childConsentRate + "% — ensure consent is obtained for all assessments");
  if (below(healthCompliance.gpNotifiedRate, 50))
    areasForImprovement.push("GP notification rate at " + healthCompliance.gpNotifiedRate + "% — GPs must be informed of all assessment outcomes");

  // ── Actions ──
  const actions: string[] = [];
  if (healthPolicy.overallScore === 0)
    actions.push("URGENT: No health policies in place — develop and implement health policy framework immediately");
  if (staffHealthReadiness.overallScore === 0)
    actions.push("URGENT: No staff health training recorded — arrange comprehensive health training programme");
  if (below(healthQuality.completedOnTimeRate, 50))
    actions.push("Review health assessment scheduling to improve timeliness — currently " + healthQuality.completedOnTimeRate + "%");
  if (below(healthCompliance.documentedRate, 50))
    actions.push("Implement documentation audit to ensure all assessments are recorded in care files");
  if (below(healthQuality.childConsentRate, 50))
    actions.push("Review consent processes and ensure age-appropriate consent is obtained");
  if (below(healthCompliance.gpNotifiedRate, 50))
    actions.push("Establish GP notification protocol for all health assessment outcomes");
  if (below(healthQuality.followUpRate, 60))
    actions.push("Strengthen follow-up scheduling after health assessments — current rate " + healthQuality.followUpRate + "%");
  if (below(healthCompliance.parentInformedRate, 60))
    actions.push("Improve communication with parents/carers about health assessment outcomes");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 10 — The health and wellbeing standard",
    "Promoting the Health of Looked After Children (DfE/DoH 2015)",
    "IHA within 20 working days of becoming LAC",
    "RHA annually (6-monthly for under-5s)",
    "SDQ completed annually for all looked-after children",
    "SCCIF — Health and wellbeing: timely, high-quality health care",
    "UNCRC Article 24 — Right to the highest attainable standard of health",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    healthQuality,
    healthCompliance,
    healthPolicy,
    staffHealthReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
