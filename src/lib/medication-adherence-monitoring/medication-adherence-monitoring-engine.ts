// ==============================================================================
// MEDICATION ADHERENCE MONITORING INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating the quality and compliance of
// medication administration, adherence tracking, and medication safety
// for looked-after children in residential care settings.
//
// Regulatory basis:
//   - CHR 2015 Regulation 10 — Health and wellbeing
//   - CHR 2015 Regulation 12 — The protection of children
//   - SCCIF — Safety of children
//   - NMS 6 — Health: medication
//   - Children Act 1989 — Welfare of the child
//   - Misuse of Drugs Act 1971 — Controlled substances
//   - NICE NG46 — Controlled drugs: safe use and management
//
// No AI. No external calls. Pure input -> output.
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type MedicationType =
  | "prescribed_regular"
  | "prescribed_prn"
  | "over_counter"
  | "supplement"
  | "controlled"
  | "topical"
  | "inhaler"
  | "injection";

export type AdministrationOutcome =
  | "administered_correctly"
  | "refused"
  | "missed"
  | "delayed"
  | "error";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label maps ---------------------------------------------------------------

const MEDICATION_TYPE_LABELS: Record<MedicationType, string> = {
  prescribed_regular: "Prescribed Regular",
  prescribed_prn: "Prescribed PRN",
  over_counter: "Over the Counter",
  supplement: "Supplement",
  controlled: "Controlled Drug",
  topical: "Topical",
  inhaler: "Inhaler",
  injection: "Injection",
};

const ADMINISTRATION_OUTCOME_LABELS: Record<AdministrationOutcome, string> = {
  administered_correctly: "Administered Correctly",
  refused: "Refused",
  missed: "Missed",
  delayed: "Delayed",
  error: "Error",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label getters ------------------------------------------------------------

export function getMedicationTypeLabel(v: MedicationType): string {
  return MEDICATION_TYPE_LABELS[v];
}

export function getAdministrationOutcomeLabel(v: AdministrationOutcome): string {
  return ADMINISTRATION_OUTCOME_LABELS[v];
}

export function getRatingLabel(v: Rating): string {
  return RATING_LABELS[v];
}

// -- Input Interfaces ---------------------------------------------------------

export interface MedicationRecord {
  id: string;
  childId: string;
  childName: string;
  administrationDate: string;
  medicationType: MedicationType;
  administrationOutcome: AdministrationOutcome;
  twoStaffWitnessed: boolean;
  consentObtained: boolean;
  sideEffectsMonitored: boolean;
  documentedImmediately: boolean;
  storageCorrect: boolean;
  reviewDue: string;
}

export interface MedicationPolicy {
  id: string;
  medicationAdministrationPolicy: boolean;
  controlledDrugsProtocol: boolean;
  consentFramework: boolean;
  errorReportingProcess: boolean;
  storageAuditSchedule: boolean;
  staffCompetencyCheck: boolean;
  regularReview: boolean;
}

export interface StaffMedicationTraining {
  id: string;
  staffId: string;
  staffName: string;
  medicationAdministration: boolean;
  controlledDrugs: boolean;
  errorReporting: boolean;
  consentPractice: boolean;
  sideEffectRecognition: boolean;
  storageCompliance: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface AdministrationQualityResult {
  overallScore: number;
  totalRecords: number;
  correctAdministrationRate: number;
  twoStaffWitnessedRate: number;
  documentedImmediatelyRate: number;
  consentObtainedRate: number;
  sideEffectsMonitoredRate: number;
}

export interface MedicationSafetyResult {
  overallScore: number;
  totalRecords: number;
  errorRate: number;
  storageCorrectRate: number;
  reviewComplianceRate: number;
}

export interface MedicationPolicyResult {
  overallScore: number;
  medicationAdministrationPolicy: boolean;
  controlledDrugsProtocol: boolean;
  consentFramework: boolean;
  errorReportingProcess: boolean;
  storageAuditSchedule: boolean;
  staffCompetencyCheck: boolean;
  regularReview: boolean;
}

export interface StaffMedicationReadinessResult {
  overallScore: number;
  totalStaff: number;
  medicationAdministrationRate: number;
  controlledDrugsRate: number;
  errorReportingRate: number;
  consentPracticeRate: number;
  sideEffectRecognitionRate: number;
  storageComplianceRate: number;
}

export interface ChildMedicationProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  overallScore: number;
  correctAdministrationRate: number;
  documentedImmediatelyRate: number;
  errorRate: number;
}

export interface MedicationAdherenceMonitoringIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  administrationQuality: AdministrationQualityResult;
  medicationSafety: MedicationSafetyResult;
  medicationPolicy: MedicationPolicyResult;
  staffMedicationReadiness: StaffMedicationReadinessResult;
  childMedicationProfiles: ChildMedicationProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

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

// -- Evaluators ---------------------------------------------------------------

/**
 * Evaluates administration quality across all medication records.
 * Empty records = 0 (no records = non-compliant).
 *
 * Weighted: correct administration rate (0-7), two staff witnessed rate (0-6),
 * documented immediately rate (0-6), combined consent+sideEffects monitored (0-6).
 */
export function evaluateAdministrationQuality(
  records: MedicationRecord[],
): AdministrationQualityResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      correctAdministrationRate: 0,
      twoStaffWitnessedRate: 0,
      documentedImmediatelyRate: 0,
      consentObtainedRate: 0,
      sideEffectsMonitoredRate: 0,
    };
  }

  let correct = 0;
  let witnessed = 0;
  let documented = 0;
  let consent = 0;
  let sideEffects = 0;

  for (const r of records) {
    if (r.administrationOutcome === "administered_correctly") correct++;
    if (r.twoStaffWitnessed) witnessed++;
    if (r.documentedImmediately) documented++;
    if (r.consentObtained) consent++;
    if (r.sideEffectsMonitored) sideEffects++;
  }

  const correctAdministrationRate = pct(correct, records.length);
  const twoStaffWitnessedRate = pct(witnessed, records.length);
  const documentedImmediatelyRate = pct(documented, records.length);
  const consentObtainedRate = pct(consent, records.length);
  const sideEffectsMonitoredRate = pct(sideEffects, records.length);

  // Combined consent + side effects average for the 0-6 bucket
  const consentSideEffectsAvg = (consentObtainedRate + sideEffectsMonitoredRate) / 2;

  let score = 0;
  score += Math.round((correctAdministrationRate / 100) * 7);
  score += Math.round((twoStaffWitnessedRate / 100) * 6);
  score += Math.round((documentedImmediatelyRate / 100) * 6);
  score += Math.round((consentSideEffectsAvg / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalRecords: records.length,
    correctAdministrationRate,
    twoStaffWitnessedRate,
    documentedImmediatelyRate,
    consentObtainedRate,
    sideEffectsMonitoredRate,
  };
}

/**
 * Evaluates medication safety.
 * Empty records = 25 (ABSENCE pattern - no medication issues is good).
 *
 * Weighted: error rate inverted (0-9 where score=9*(100-errorRate)/100
 * counting error+missed as errors), storage correct rate (0-8),
 * review compliance rate (0-8).
 */
export function evaluateMedicationSafety(
  records: MedicationRecord[],
): MedicationSafetyResult {
  if (records.length === 0) {
    return {
      overallScore: 25,
      totalRecords: 0,
      errorRate: 0,
      storageCorrectRate: 0,
      reviewComplianceRate: 0,
    };
  }

  let errors = 0;
  let storageCorrect = 0;
  let reviewCompliant = 0;

  for (const r of records) {
    if (
      r.administrationOutcome === "error" ||
      r.administrationOutcome === "missed"
    ) {
      errors++;
    }
    if (r.storageCorrect) storageCorrect++;
    if (r.reviewDue >= r.administrationDate) reviewCompliant++;
  }

  const errorRate = pct(errors, records.length);
  const storageCorrectRate = pct(storageCorrect, records.length);
  const reviewComplianceRate = pct(reviewCompliant, records.length);

  let score = 0;
  score += Math.round((9 * (100 - errorRate)) / 100);
  score += Math.round((storageCorrectRate / 100) * 8);
  score += Math.round((reviewComplianceRate / 100) * 8);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalRecords: records.length,
    errorRate,
    storageCorrectRate,
    reviewComplianceRate,
  };
}

/**
 * Evaluates medication policy completeness.
 * Null policy = 0 (no policy = non-compliant).
 *
 * 7 booleans weighted: 4+4+4+4+3+3+3 = 25.
 */
export function evaluateMedicationPolicy(
  policy: MedicationPolicy | null,
): MedicationPolicyResult {
  if (policy === null) {
    return {
      overallScore: 0,
      medicationAdministrationPolicy: false,
      controlledDrugsProtocol: false,
      consentFramework: false,
      errorReportingProcess: false,
      storageAuditSchedule: false,
      staffCompetencyCheck: false,
      regularReview: false,
    };
  }

  let score = 0;
  if (policy.medicationAdministrationPolicy) score += 4;
  if (policy.controlledDrugsProtocol) score += 4;
  if (policy.consentFramework) score += 4;
  if (policy.errorReportingProcess) score += 4;
  if (policy.storageAuditSchedule) score += 3;
  if (policy.staffCompetencyCheck) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    medicationAdministrationPolicy: policy.medicationAdministrationPolicy,
    controlledDrugsProtocol: policy.controlledDrugsProtocol,
    consentFramework: policy.consentFramework,
    errorReportingProcess: policy.errorReportingProcess,
    storageAuditSchedule: policy.storageAuditSchedule,
    staffCompetencyCheck: policy.staffCompetencyCheck,
    regularReview: policy.regularReview,
  };
}

/**
 * Evaluates staff medication readiness.
 * Empty training = 0 (no trained staff = non-compliant).
 *
 * 6 skills weighted: 6+5+5+4+3+2 = 25.
 */
export function evaluateStaffMedicationReadiness(
  training: StaffMedicationTraining[],
): StaffMedicationReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      medicationAdministrationRate: 0,
      controlledDrugsRate: 0,
      errorReportingRate: 0,
      consentPracticeRate: 0,
      sideEffectRecognitionRate: 0,
      storageComplianceRate: 0,
    };
  }

  let medAdmin = 0;
  let controlled = 0;
  let errorRep = 0;
  let consentPrac = 0;
  let sideEffect = 0;
  let storage = 0;

  for (const t of training) {
    if (t.medicationAdministration) medAdmin++;
    if (t.controlledDrugs) controlled++;
    if (t.errorReporting) errorRep++;
    if (t.consentPractice) consentPrac++;
    if (t.sideEffectRecognition) sideEffect++;
    if (t.storageCompliance) storage++;
  }

  const medicationAdministrationRate = pct(medAdmin, training.length);
  const controlledDrugsRate = pct(controlled, training.length);
  const errorReportingRate = pct(errorRep, training.length);
  const consentPracticeRate = pct(consentPrac, training.length);
  const sideEffectRecognitionRate = pct(sideEffect, training.length);
  const storageComplianceRate = pct(storage, training.length);

  let score = 0;
  score += Math.round((medicationAdministrationRate / 100) * 6);
  score += Math.round((controlledDrugsRate / 100) * 5);
  score += Math.round((errorReportingRate / 100) * 5);
  score += Math.round((consentPracticeRate / 100) * 4);
  score += Math.round((sideEffectRecognitionRate / 100) * 3);
  score += Math.round((storageComplianceRate / 100) * 2);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalStaff: training.length,
    medicationAdministrationRate,
    controlledDrugsRate,
    errorReportingRate,
    consentPracticeRate,
    sideEffectRecognitionRate,
    storageComplianceRate,
  };
}

// -- Child Medication Profiles ------------------------------------------------

/**
 * Groups records by childId. Per-child score 0-10:
 *   frequency (0-2): >=10 records -> 2, >=5 -> 1, else 0
 *   correctAdmin (0-3): based on correct admin rate
 *   documented (0-3): based on documented immediately rate
 *   safety (0-2): based on low error rate
 */
export function buildChildMedicationProfiles(
  records: MedicationRecord[],
): ChildMedicationProfile[] {
  const groups = new Map<
    string,
    { childName: string; records: MedicationRecord[] }
  >();

  for (const r of records) {
    const existing = groups.get(r.childId);
    if (existing) {
      existing.records.push(r);
    } else {
      groups.set(r.childId, { childName: r.childName, records: [r] });
    }
  }

  const profiles: ChildMedicationProfile[] = [];

  for (const [childId, group] of groups) {
    const childRecords = group.records;
    const total = childRecords.length;

    const correct = childRecords.filter(
      (r) => r.administrationOutcome === "administered_correctly",
    ).length;
    const documented = childRecords.filter(
      (r) => r.documentedImmediately,
    ).length;
    const errorsMissed = childRecords.filter(
      (r) =>
        r.administrationOutcome === "error" ||
        r.administrationOutcome === "missed",
    ).length;

    const correctAdministrationRate = pct(correct, total);
    const documentedImmediatelyRate = pct(documented, total);
    const errorRate = pct(errorsMissed, total);

    // frequency score 0-2
    let frequencyScore = 0;
    if (total >= 10) frequencyScore = 2;
    else if (total >= 5) frequencyScore = 1;

    // correctAdmin score 0-3
    const correctAdminScore = Math.round((correctAdministrationRate / 100) * 3);

    // documented score 0-3
    const documentedScore = Math.round((documentedImmediatelyRate / 100) * 3);

    // safety score 0-2 (based on low error rate)
    const safetyScore = Math.round((2 * (100 - errorRate)) / 100);

    const overallScore = Math.min(
      10,
      frequencyScore + correctAdminScore + documentedScore + safetyScore,
    );

    profiles.push({
      childId,
      childName: group.childName,
      totalRecords: total,
      overallScore,
      correctAdministrationRate,
      documentedImmediatelyRate,
      errorRate,
    });
  }

  return profiles;
}

// -- Main Function ------------------------------------------------------------

export function generateMedicationAdherenceMonitoringIntelligence(
  records: MedicationRecord[],
  policy: MedicationPolicy | null,
  training: StaffMedicationTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): MedicationAdherenceMonitoringIntelligence {
  const administrationQuality = evaluateAdministrationQuality(records);
  const medicationSafety = evaluateMedicationSafety(records);
  const medicationPolicyResult = evaluateMedicationPolicy(policy);
  const staffMedicationReadiness = evaluateStaffMedicationReadiness(training);

  const rawScore =
    administrationQuality.overallScore +
    medicationSafety.overallScore +
    medicationPolicyResult.overallScore +
    staffMedicationReadiness.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const childMedicationProfiles = buildChildMedicationProfiles(records);

  // -- Strengths --
  const strengths: string[] = [];

  if (
    records.length > 0 &&
    administrationQuality.correctAdministrationRate >= 80
  ) {
    strengths.push(
      "Strong medication administration with " +
        administrationQuality.correctAdministrationRate +
        "% correct administration rate",
    );
  }

  if (
    records.length > 0 &&
    administrationQuality.documentedImmediatelyRate >= 80
  ) {
    strengths.push(
      "Excellent documentation practice with " +
        administrationQuality.documentedImmediatelyRate +
        "% immediate documentation rate",
    );
  }

  if (
    records.length > 0 &&
    administrationQuality.twoStaffWitnessedRate >= 80
  ) {
    strengths.push(
      "Robust dual verification with " +
        administrationQuality.twoStaffWitnessedRate +
        "% two-staff witnessed rate",
    );
  }

  if (
    policy !== null &&
    policy.medicationAdministrationPolicy &&
    policy.controlledDrugsProtocol &&
    policy.consentFramework &&
    policy.errorReportingProcess
  ) {
    strengths.push(
      "Comprehensive medication policy framework in place",
    );
  }

  if (
    training.length > 0 &&
    staffMedicationReadiness.medicationAdministrationRate === 100
  ) {
    strengths.push(
      "All staff trained in medication administration",
    );
  }

  if (records.length > 0 && medicationSafety.storageCorrectRate >= 90) {
    strengths.push(
      "High medication storage compliance at " +
        medicationSafety.storageCorrectRate +
        "%",
    );
  }

  // -- Areas for Improvement --
  const areasForImprovement: string[] = [];

  if (
    records.length > 0 &&
    administrationQuality.correctAdministrationRate < 60
  ) {
    areasForImprovement.push(
      "Correct administration rate at " +
        administrationQuality.correctAdministrationRate +
        "% — requires immediate attention",
    );
  }

  if (records.length > 0 && medicationSafety.errorRate > 10) {
    areasForImprovement.push(
      "Medication error rate at " +
        medicationSafety.errorRate +
        "% — exceeds acceptable threshold of 10%",
    );
  }

  if (
    records.length > 0 &&
    administrationQuality.twoStaffWitnessedRate < 60
  ) {
    areasForImprovement.push(
      "Two-staff witness rate at " +
        administrationQuality.twoStaffWitnessedRate +
        "% — dual verification needs strengthening",
    );
  }

  if (
    records.length > 0 &&
    administrationQuality.documentedImmediatelyRate < 60
  ) {
    areasForImprovement.push(
      "Immediate documentation rate at " +
        administrationQuality.documentedImmediatelyRate +
        "% — records must be completed promptly",
    );
  }

  if (
    training.length > 0 &&
    staffMedicationReadiness.controlledDrugsRate < 75
  ) {
    areasForImprovement.push(
      "Controlled drugs training at " +
        staffMedicationReadiness.controlledDrugsRate +
        "% — all staff handling controlled drugs must be trained",
    );
  }

  // -- Actions --
  const actions: string[] = [];

  if (records.length === 0) {
    actions.push(
      "Begin recording medication administration data to enable compliance monitoring",
    );
  }

  if (policy === null) {
    actions.push(
      "URGENT: Establish medication administration policy — regulatory requirement under CHR 2015",
    );
  }

  if (training.length === 0) {
    actions.push(
      "URGENT: Implement staff medication training programme — no training records on file",
    );
  }

  if (
    records.length > 0 &&
    administrationQuality.correctAdministrationRate < 60
  ) {
    actions.push(
      "Review medication administration procedures — correct administration below 60%",
    );
  }

  if (records.length > 0 && medicationSafety.errorRate > 10) {
    actions.push(
      "Investigate medication errors — error rate of " +
        medicationSafety.errorRate +
        "% exceeds 10% threshold",
    );
  }

  if (
    policy !== null &&
    !policy.controlledDrugsProtocol
  ) {
    actions.push(
      "Develop controlled drugs protocol — required under Misuse of Drugs Act 1971",
    );
  }

  if (records.length > 0 && medicationSafety.reviewComplianceRate < 80) {
    actions.push(
      "Schedule medication reviews — " +
        (100 - medicationSafety.reviewComplianceRate) +
        "% of records have overdue reviews",
    );
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 10 — Health and wellbeing",
    "CHR 2015 Regulation 12 — The protection of children",
    "SCCIF — Safety of children",
    "NMS 6 — Health: medication",
    "Children Act 1989 — Welfare of the child",
    "Misuse of Drugs Act 1971 — Controlled substances",
    "NICE NG46 — Controlled drugs: safe use and management",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    administrationQuality,
    medicationSafety,
    medicationPolicy: medicationPolicyResult,
    staffMedicationReadiness,
    childMedicationProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
