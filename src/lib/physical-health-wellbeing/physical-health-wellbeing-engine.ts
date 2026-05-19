// ==============================================================================
// PHYSICAL HEALTH & WELLBEING INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating how well a children's residential
// home supports children's physical health, medical appointments, and wellbeing.
//
// Regulatory basis:
//   - CHR 2015 Regulation 6  — The health and well-being standard
//   - CHR 2015 Regulation 10 — The health and well-being (health care) standard
//   - SCCIF — Health and well-being
//   - NMS 10 — Health
//   - Children Act 1989
//   - Promoting the health of looked after children (2015)
//   - NHS England looked-after children health guidance
//
// No AI. No external calls. Pure input -> output.
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type HealthArea =
  | "medical_appointment"
  | "dental_check"
  | "optician_visit"
  | "immunisation"
  | "health_assessment"
  | "physical_activity"
  | "nutrition_review"
  | "mental_health_review";

export type HealthOutcome =
  | "excellent"
  | "good"
  | "satisfactory"
  | "concern_raised"
  | "missed";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label Maps ---------------------------------------------------------------

const HEALTH_AREA_LABELS: Record<HealthArea, string> = {
  medical_appointment: "Medical Appointment",
  dental_check: "Dental Check",
  optician_visit: "Optician Visit",
  immunisation: "Immunisation",
  health_assessment: "Health Assessment",
  physical_activity: "Physical Activity",
  nutrition_review: "Nutrition Review",
  mental_health_review: "Mental Health Review",
};

const HEALTH_OUTCOME_LABELS: Record<HealthOutcome, string> = {
  excellent: "Excellent",
  good: "Good",
  satisfactory: "Satisfactory",
  concern_raised: "Concern Raised",
  missed: "Missed",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getHealthAreaLabel(v: HealthArea): string { return HEALTH_AREA_LABELS[v]; }
export function getHealthOutcomeLabel(v: HealthOutcome): string { return HEALTH_OUTCOME_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// -- Helpers ------------------------------------------------------------------

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

// -- Input Interfaces ---------------------------------------------------------

export interface HealthRecord {
  id: string;
  childId: string;
  childName: string;
  recordDate: string;
  healthArea: HealthArea;
  healthOutcome: HealthOutcome;
  appointmentAttended: boolean;
  healthPlanUpdated: boolean;
  consentObtained: boolean;
  staffAccompanied: boolean;
  documentedInRecord: boolean;
  followUpScheduled: boolean;
}

export interface HealthPolicy {
  id: string;
  healthAssessmentFramework: boolean;
  appointmentManagement: boolean;
  consentProtocol: boolean;
  healthPassportScheme: boolean;
  physicalActivityPlan: boolean;
  nutritionGuidelines: boolean;
  regularReview: boolean;
}

export interface StaffHealthTraining {
  id: string;
  staffId: string;
  staffName: string;
  healthAwareness: boolean;
  mentalHealthFirstAid: boolean;
  consentAndCapacity: boolean;
  medicationManagement: boolean;
  appointmentSupport: boolean;
  healthDocumentation: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface HealthQualityResult {
  overallScore: number;
  totalRecords: number;
  outcomeRate: number;
  appointmentAttendedRate: number;
  healthPlanRate: number;
  consentRate: number;
}

export interface HealthComplianceResult {
  overallScore: number;
  totalRecords: number;
  staffAccompaniedRate: number;
  documentedRate: number;
  followUpRate: number;
  areaDiversity: number;
}

export interface HealthPolicyResult {
  overallScore: number;
  healthAssessmentFramework: boolean;
  appointmentManagement: boolean;
  consentProtocol: boolean;
  healthPassportScheme: boolean;
  physicalActivityPlan: boolean;
  nutritionGuidelines: boolean;
  regularReview: boolean;
}

export interface StaffHealthReadinessResult {
  overallScore: number;
  totalStaff: number;
  healthAwarenessRate: number;
  mentalHealthFirstAidRate: number;
  consentAndCapacityRate: number;
  medicationManagementRate: number;
  appointmentSupportRate: number;
  healthDocumentationRate: number;
}

export interface ChildHealthProfile {
  childId: string;
  childName: string;
  recordCount: number;
  overallScore: number;
  outcomeRate: number;
  appointmentRate: number;
  uniqueAreas: number;
}

export interface PhysicalHealthWellbeingIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  healthQuality: HealthQualityResult;
  healthCompliance: HealthComplianceResult;
  healthPolicy: HealthPolicyResult;
  staffHealthReadiness: StaffHealthReadinessResult;
  childHealthProfiles: ChildHealthProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Evaluators ---------------------------------------------------------------

/**
 * Evaluates health quality from records.
 * Empty records = 0 (PRESENCE pattern).
 * Sub-scores: outcomeRate (0-7), appointmentAttendedRate (0-6),
 *             healthPlanRate (0-6), consentRate (0-6). Total 0-25.
 */
export function evaluateHealthQuality(records: HealthRecord[]): HealthQualityResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      outcomeRate: 0,
      appointmentAttendedRate: 0,
      healthPlanRate: 0,
      consentRate: 0,
    };
  }

  const excellentGood = records.filter(
    (r) => r.healthOutcome === "excellent" || r.healthOutcome === "good",
  ).length;
  const attended = records.filter((r) => r.appointmentAttended).length;
  const healthPlan = records.filter((r) => r.healthPlanUpdated).length;
  const consent = records.filter((r) => r.consentObtained).length;

  const outcomeRate = pct(excellentGood, records.length);
  const appointmentAttendedRate = pct(attended, records.length);
  const healthPlanRate = pct(healthPlan, records.length);
  const consentRate = pct(consent, records.length);

  let score = 0;
  score += Math.round((outcomeRate / 100) * 7);
  score += Math.round((appointmentAttendedRate / 100) * 6);
  score += Math.round((healthPlanRate / 100) * 6);
  score += Math.round((consentRate / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalRecords: records.length,
    outcomeRate,
    appointmentAttendedRate,
    healthPlanRate,
    consentRate,
  };
}

/**
 * Evaluates health compliance from records.
 * Empty records = 0 (PRESENCE pattern).
 * Sub-scores: staffAccompaniedRate (0-8), documentedRate (0-7),
 *             followUpRate (0-5), areaDiversity (0-5). Total 0-25.
 */
export function evaluateHealthCompliance(records: HealthRecord[]): HealthComplianceResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      staffAccompaniedRate: 0,
      documentedRate: 0,
      followUpRate: 0,
      areaDiversity: 0,
    };
  }

  const staffAccompanied = records.filter((r) => r.staffAccompanied).length;
  const documented = records.filter((r) => r.documentedInRecord).length;
  const followUp = records.filter((r) => r.followUpScheduled).length;
  const uniqueAreas = new Set(records.map((r) => r.healthArea)).size;

  const staffAccompaniedRate = pct(staffAccompanied, records.length);
  const documentedRate = pct(documented, records.length);
  const followUpRate = pct(followUp, records.length);
  const areaDiversity = uniqueAreas / 8;

  let score = 0;
  score += Math.round((staffAccompaniedRate / 100) * 8);
  score += Math.round((documentedRate / 100) * 7);
  score += Math.round((followUpRate / 100) * 5);
  score += Math.round(areaDiversity * 5);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalRecords: records.length,
    staffAccompaniedRate,
    documentedRate,
    followUpRate,
    areaDiversity,
  };
}

/**
 * Evaluates health policy completeness.
 * Accepts null (-> 0).
 * 7 booleans weighted 4+4+4+4+3+3+3 = 25.
 */
export function evaluateHealthPolicy(policy: HealthPolicy | null): HealthPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      healthAssessmentFramework: false,
      appointmentManagement: false,
      consentProtocol: false,
      healthPassportScheme: false,
      physicalActivityPlan: false,
      nutritionGuidelines: false,
      regularReview: false,
    };
  }

  let score = 0;
  if (policy.healthAssessmentFramework) score += 4;
  if (policy.appointmentManagement) score += 4;
  if (policy.consentProtocol) score += 4;
  if (policy.healthPassportScheme) score += 4;
  if (policy.physicalActivityPlan) score += 3;
  if (policy.nutritionGuidelines) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    healthAssessmentFramework: policy.healthAssessmentFramework,
    appointmentManagement: policy.appointmentManagement,
    consentProtocol: policy.consentProtocol,
    healthPassportScheme: policy.healthPassportScheme,
    physicalActivityPlan: policy.physicalActivityPlan,
    nutritionGuidelines: policy.nutritionGuidelines,
    regularReview: policy.regularReview,
  };
}

/**
 * Evaluates staff health readiness.
 * Empty training = 0 (PRESENCE pattern).
 * 6 skills weighted 6+5+5+4+3+2 = 25.
 */
export function evaluateStaffHealthReadiness(
  training: StaffHealthTraining[],
): StaffHealthReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      healthAwarenessRate: 0,
      mentalHealthFirstAidRate: 0,
      consentAndCapacityRate: 0,
      medicationManagementRate: 0,
      appointmentSupportRate: 0,
      healthDocumentationRate: 0,
    };
  }

  let healthAwareness = 0;
  let mentalHealthFirstAid = 0;
  let consentAndCapacity = 0;
  let medicationManagement = 0;
  let appointmentSupport = 0;
  let healthDocumentation = 0;

  for (const t of training) {
    if (t.healthAwareness) healthAwareness++;
    if (t.mentalHealthFirstAid) mentalHealthFirstAid++;
    if (t.consentAndCapacity) consentAndCapacity++;
    if (t.medicationManagement) medicationManagement++;
    if (t.appointmentSupport) appointmentSupport++;
    if (t.healthDocumentation) healthDocumentation++;
  }

  const healthAwarenessRate = pct(healthAwareness, training.length);
  const mentalHealthFirstAidRate = pct(mentalHealthFirstAid, training.length);
  const consentAndCapacityRate = pct(consentAndCapacity, training.length);
  const medicationManagementRate = pct(medicationManagement, training.length);
  const appointmentSupportRate = pct(appointmentSupport, training.length);
  const healthDocumentationRate = pct(healthDocumentation, training.length);

  let score = 0;
  score += Math.round((healthAwarenessRate / 100) * 6);
  score += Math.round((mentalHealthFirstAidRate / 100) * 5);
  score += Math.round((consentAndCapacityRate / 100) * 5);
  score += Math.round((medicationManagementRate / 100) * 4);
  score += Math.round((appointmentSupportRate / 100) * 3);
  score += Math.round((healthDocumentationRate / 100) * 2);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalStaff: training.length,
    healthAwarenessRate,
    mentalHealthFirstAidRate,
    consentAndCapacityRate,
    medicationManagementRate,
    appointmentSupportRate,
    healthDocumentationRate,
  };
}

// -- Child Profiles -----------------------------------------------------------

/**
 * Builds per-child health profiles.
 * Score 0-10 based on:
 *   frequency (0-2): >=10 records -> 2, >=5 -> 1
 *   outcomeRate (0-3): >=80% -> 3, >=60% -> 2, >=40% -> 1
 *   appointmentRate (0-3): >=80% -> 3, >=60% -> 2, >=40% -> 1
 *   diversity (0-2): unique areas >=4 -> 2, >=2 -> 1
 */
export function buildChildHealthProfiles(records: HealthRecord[]): ChildHealthProfile[] {
  const grouped = new Map<string, HealthRecord[]>();
  for (const r of records) {
    const existing = grouped.get(r.childId);
    if (existing) {
      existing.push(r);
    } else {
      grouped.set(r.childId, [r]);
    }
  }

  return Array.from(grouped.entries()).map(([childId, childRecords]) => {
    const childName = childRecords[0].childName;
    const recordCount = childRecords.length;

    const excellentGood = childRecords.filter(
      (r) => r.healthOutcome === "excellent" || r.healthOutcome === "good",
    ).length;
    const attended = childRecords.filter((r) => r.appointmentAttended).length;
    const uniqueAreas = new Set(childRecords.map((r) => r.healthArea)).size;

    const outcomeRate = pct(excellentGood, recordCount);
    const appointmentRate = pct(attended, recordCount);

    // frequency (0-2)
    let frequencyScore = 0;
    if (recordCount >= 10) frequencyScore = 2;
    else if (recordCount >= 5) frequencyScore = 1;

    // outcomeRate (0-3)
    let outcomeScore = 0;
    if (outcomeRate >= 80) outcomeScore = 3;
    else if (outcomeRate >= 60) outcomeScore = 2;
    else if (outcomeRate >= 40) outcomeScore = 1;

    // appointmentRate (0-3)
    let appointmentScore = 0;
    if (appointmentRate >= 80) appointmentScore = 3;
    else if (appointmentRate >= 60) appointmentScore = 2;
    else if (appointmentRate >= 40) appointmentScore = 1;

    // diversity (0-2)
    let diversityScore = 0;
    if (uniqueAreas >= 4) diversityScore = 2;
    else if (uniqueAreas >= 2) diversityScore = 1;

    const overallScore = Math.min(10, frequencyScore + outcomeScore + appointmentScore + diversityScore);

    return {
      childId,
      childName,
      recordCount,
      overallScore,
      outcomeRate,
      appointmentRate,
      uniqueAreas,
    };
  });
}

// -- Main Orchestrator --------------------------------------------------------

export function generatePhysicalHealthWellbeingIntelligence(
  records: HealthRecord[],
  policy: HealthPolicy | null,
  training: StaffHealthTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): PhysicalHealthWellbeingIntelligence {
  const healthQuality = evaluateHealthQuality(records);
  const healthCompliance = evaluateHealthCompliance(records);
  const healthPolicy = evaluateHealthPolicy(policy);
  const staffHealthReadiness = evaluateStaffHealthReadiness(training);
  const childHealthProfiles = buildChildHealthProfiles(records);

  const rawScore =
    healthQuality.overallScore +
    healthCompliance.overallScore +
    healthPolicy.overallScore +
    staffHealthReadiness.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  // -- Strengths (when rate >= 80) --
  const strengths: string[] = [];
  if (records.length > 0 && healthQuality.outcomeRate >= 80) {
    strengths.push("Strong health outcomes across recorded appointments and reviews");
  }
  if (records.length > 0 && healthQuality.appointmentAttendedRate >= 80) {
    strengths.push("Appointments consistently attended");
  }
  if (records.length > 0 && healthQuality.healthPlanRate >= 80) {
    strengths.push("Health plans regularly updated");
  }
  if (records.length > 0 && healthCompliance.documentedRate >= 80) {
    strengths.push("Excellent health documentation");
  }

  // -- Actions --
  const actions: string[] = [];
  if (records.length === 0) {
    actions.push("No health records found — ensure physical health is tracked and recorded");
  }
  if (!policy) {
    actions.push("URGENT: Develop and implement a comprehensive physical health and wellbeing policy");
  }
  if (training.length === 0) {
    actions.push("URGENT: Arrange health awareness and support training for all staff");
  }
  if (records.length > 0 && healthCompliance.followUpRate < 80) {
    actions.push("Improve follow-up scheduling for health appointments and reviews");
  }
  if (records.length > 0 && healthQuality.consentRate < 80) {
    actions.push("Strengthen consent processes for health-related activities");
  }

  // -- Areas for Improvement --
  const areasForImprovement: string[] = [];
  if (records.length === 0) {
    areasForImprovement.push("No health records available — unable to evaluate physical health provision");
  }
  if (records.length > 0 && healthQuality.outcomeRate < 80) {
    areasForImprovement.push("Health outcome rate at " + healthQuality.outcomeRate + "% — target 80%+");
  }
  if (records.length > 0 && healthQuality.appointmentAttendedRate < 80) {
    areasForImprovement.push("Appointment attendance at " + healthQuality.appointmentAttendedRate + "% — target 80%+");
  }
  if (records.length > 0 && healthCompliance.staffAccompaniedRate < 80) {
    areasForImprovement.push("Staff accompaniment rate at " + healthCompliance.staffAccompaniedRate + "% — children should be supported at health appointments");
  }
  if (records.length > 0 && healthCompliance.documentedRate < 80) {
    areasForImprovement.push("Health documentation at " + healthCompliance.documentedRate + "% — all health events must be recorded");
  }
  if (!policy) {
    areasForImprovement.push("No health policy in place — a comprehensive policy is a regulatory requirement");
  }
  if (training.length === 0) {
    areasForImprovement.push("No staff health training records — all care staff require health awareness training");
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 6 — The health and well-being standard",
    "CHR 2015 Regulation 10 — The health and well-being (health care) standard",
    "SCCIF — Health and well-being",
    "NMS 10 — Health",
    "Children Act 1989",
    "Promoting the health of looked after children (2015)",
    "NHS England looked-after children health guidance",
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
    childHealthProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
