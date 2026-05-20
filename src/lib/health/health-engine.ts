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
  completedOnTimeRate: number;
  childConsentRate: number;
  actionPlanRate: number;
  followUpRate: number;
}

export interface HealthComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentedRate: number;
  gpNotifiedRate: number;
  parentInformedRate: number;
  typeDiversityRatio: number;
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
  healthAssessmentProcessRate: number;
  mentalHealthAwarenessRate: number;
  medicationAdministrationRate: number;
  consentAndCapacityRate: number;
  firstAidCertifiedRate: number;
  healthPromotionSkillsRate: number;
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
      completedOnTimeRate: 0,
      childConsentRate: 0,
      actionPlanRate: 0,
      followUpRate: 0,
    };
  }

  const completedOnTime = records.filter(
    (r) => r.outcome === "completed_on_time",
  ).length;
  const consented = records.filter((r) => r.childConsented).length;
  const actionPlan = records.filter((r) => r.actionPlanCreated).length;
  const followUp = records.filter((r) => r.followUpScheduled).length;

  const completedOnTimeRate = pct(completedOnTime, records.length);
  const childConsentRate = pct(consented, records.length);
  const actionPlanRate = pct(actionPlan, records.length);
  const followUpRate = pct(followUp, records.length);

  // Weights: completedOnTimeRate 7 + childConsentRate 6 + actionPlanRate 6 + followUpRate 6 = 25
  let score = 0;
  score += Math.round((completedOnTimeRate / 100) * 7);
  score += Math.round((childConsentRate / 100) * 6);
  score += Math.round((actionPlanRate / 100) * 6);
  score += Math.round((followUpRate / 100) * 6);

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
      documentedRate: 0,
      gpNotifiedRate: 0,
      parentInformedRate: 0,
      typeDiversityRatio: 0,
    };
  }

  const documented = records.filter((r) => r.documentedInCareFile).length;
  const gpNotified = records.filter((r) => r.gpNotified).length;
  const parentInformed = records.filter((r) => r.parentCarerInformed).length;

  const uniqueTypes = new Set(records.map((r) => r.assessmentType));
  const typeDiversityRatio = pct(uniqueTypes.size, ALL_ASSESSMENT_TYPES.length);

  const documentedRate = pct(documented, records.length);
  const gpNotifiedRate = pct(gpNotified, records.length);
  const parentInformedRate = pct(parentInformed, records.length);

  // Weights: documentedRate 8 + gpNotifiedRate 7 + parentInformedRate 5 + typeDiversityRatio 5 = 25
  let score = 0;
  score += Math.round((documentedRate / 100) * 8);
  score += Math.round((gpNotifiedRate / 100) * 7);
  score += Math.round((parentInformedRate / 100) * 5);
  score += Math.round((typeDiversityRatio / 100) * 5);

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
      healthAssessmentProcessRate: 0,
      mentalHealthAwarenessRate: 0,
      medicationAdministrationRate: 0,
      consentAndCapacityRate: 0,
      firstAidCertifiedRate: 0,
      healthPromotionSkillsRate: 0,
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

  const healthAssessmentProcessRate = pct(assessmentProcess, training.length);
  const mentalHealthAwarenessRate = pct(mentalHealth, training.length);
  const medicationAdministrationRate = pct(medication, training.length);
  const consentAndCapacityRate = pct(consent, training.length);
  const firstAidCertifiedRate = pct(firstAid, training.length);
  const healthPromotionSkillsRate = pct(healthPromo, training.length);

  // Weights: 6+5+5+4+3+2 = 25
  let score = 0;
  score += Math.round((healthAssessmentProcessRate / 100) * 6);
  score += Math.round((mentalHealthAwarenessRate / 100) * 5);
  score += Math.round((medicationAdministrationRate / 100) * 5);
  score += Math.round((consentAndCapacityRate / 100) * 4);
  score += Math.round((firstAidCertifiedRate / 100) * 3);
  score += Math.round((healthPromotionSkillsRate / 100) * 2);

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

    const completedOnTimeRate = pct(completedOnTime, childRecords.length);
    const childConsentRate = pct(consented, childRecords.length);

    // freq: >=10 -> 2, >=5 -> 1, else 0
    let freq = 0;
    if (childRecords.length >= 10) freq = 2;
    else if (childRecords.length >= 5) freq = 1;

    // rate1 (completedOnTimeRate): >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
    let rate1 = 0;
    if (completedOnTimeRate >= 80) rate1 = 3;
    else if (completedOnTimeRate >= 60) rate1 = 2;
    else if (completedOnTimeRate >= 40) rate1 = 1;

    // rate2 (childConsentRate): same thresholds
    let rate2 = 0;
    if (childConsentRate >= 80) rate2 = 3;
    else if (childConsentRate >= 60) rate2 = 2;
    else if (childConsentRate >= 40) rate2 = 1;

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
    strengths.push("Health assessment quality is strong with " + healthQuality.completedOnTimeRate + "% completed on time");
  if (healthCompliance.overallScore >= 20)
    strengths.push("Health compliance is excellent with " + healthCompliance.documentedRate + "% documentation rate");
  if (healthPolicy.overallScore >= 20)
    strengths.push("Comprehensive health policies in place covering key regulatory areas");
  if (staffHealthReadiness.overallScore >= 20)
    strengths.push("Staff health readiness is strong with well-trained team across all competencies");
  if (healthQuality.childConsentRate >= 90)
    strengths.push("Excellent child consent practice at " + healthQuality.childConsentRate + "%");
  if (healthQuality.actionPlanRate >= 90)
    strengths.push("Action plans consistently created for health assessments");
  if (healthCompliance.gpNotifiedRate >= 90)
    strengths.push("GP notification rate excellent at " + healthCompliance.gpNotifiedRate + "%");
  if (healthCompliance.parentInformedRate >= 90)
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
  if (healthQuality.completedOnTimeRate < 50)
    areasForImprovement.push("Only " + healthQuality.completedOnTimeRate + "% of assessments completed on time — target 80%+");
  if (healthCompliance.documentedRate < 50)
    areasForImprovement.push("Documentation rate at " + healthCompliance.documentedRate + "% — all assessments must be recorded in care files");
  if (healthQuality.childConsentRate < 50)
    areasForImprovement.push("Child consent rate at " + healthQuality.childConsentRate + "% — ensure consent is obtained for all assessments");
  if (healthCompliance.gpNotifiedRate < 50)
    areasForImprovement.push("GP notification rate at " + healthCompliance.gpNotifiedRate + "% — GPs must be informed of all assessment outcomes");

  // ── Actions ──
  const actions: string[] = [];
  if (healthPolicy.overallScore === 0)
    actions.push("URGENT: No health policies in place — develop and implement health policy framework immediately");
  if (staffHealthReadiness.overallScore === 0)
    actions.push("URGENT: No staff health training recorded — arrange comprehensive health training programme");
  if (healthQuality.completedOnTimeRate < 50)
    actions.push("Review health assessment scheduling to improve timeliness — currently " + healthQuality.completedOnTimeRate + "%");
  if (healthCompliance.documentedRate < 50)
    actions.push("Implement documentation audit to ensure all assessments are recorded in care files");
  if (healthQuality.childConsentRate < 50)
    actions.push("Review consent processes and ensure age-appropriate consent is obtained");
  if (healthCompliance.gpNotifiedRate < 50)
    actions.push("Establish GP notification protocol for all health assessment outcomes");
  if (healthQuality.followUpRate < 60)
    actions.push("Strengthen follow-up scheduling after health assessments — current rate " + healthQuality.followUpRate + "%");
  if (healthCompliance.parentInformedRate < 60)
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
