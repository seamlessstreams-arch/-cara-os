// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Medication Error Prevention Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Analyses medication safety practice including:
//   - Administration quality (on-time, two-person checks, documentation)
//   - Error management (severity, reporting, root cause, preventive action)
//   - Storage safety (controlled drugs, temperature, expiry, MAR charts)
//   - Training compliance (currency, competency, controlled drugs training)
//
// Regulatory framework:
//   CHR 2015 Reg 23 — health needs including medication management
//   NICE SC1 — managing medicines in care homes
//   SCCIF — quality of care, health and well-being
//   NMS 6 — National Minimum Standards, health and well-being
//   MHRA guidance — medicines and healthcare products regulatory authority
//   Controlled Drugs (Supervision) Regulations 2013
//   CQC Medicines guidance — safe management of medicines
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type MedicationType =
  | "prescribed"
  | "over_the_counter"
  | "homely_remedy"
  | "controlled"
  | "prn"
  | "supplement";

export type AdministrationStatus =
  | "given_on_time"
  | "given_late"
  | "missed"
  | "refused"
  | "withheld"
  | "self_administered";

export type ErrorType =
  | "wrong_dose"
  | "wrong_time"
  | "wrong_medication"
  | "wrong_child"
  | "omission"
  | "double_dose"
  | "expired_medication"
  | "documentation_error"
  | "storage_error"
  | "near_miss";

export type ErrorSeverity =
  | "no_harm"
  | "minor_harm"
  | "moderate_harm"
  | "serious_harm";

export type StorageCompliance =
  | "fully_compliant"
  | "minor_issues"
  | "significant_issues"
  | "non_compliant";

export type TrainingStatus =
  | "current"
  | "expiring_soon"
  | "expired"
  | "not_completed";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Input Interfaces ────────────────────────────────────────────────────────

export interface MedicationAdministration {
  id: string;
  childId: string;
  childName: string;
  medicationName: string;
  medicationType: MedicationType;
  scheduledTime: string;
  actualTime: string | null;
  status: AdministrationStatus;
  administeredBy: string;
  witnessedBy: string | null;
  twoPersonCheck: boolean;
  documentedImmediately: boolean;
  childConsent: boolean;
  sideEffectsMonitored: boolean;
}

export interface MedicationError {
  id: string;
  childId: string;
  childName: string;
  errorType: ErrorType;
  severity: ErrorSeverity;
  date: string;
  discoveredBy: string;
  reportedImmediately: boolean;
  parentNotified: boolean;
  gpNotified: boolean;
  rootCauseIdentified: boolean;
  preventiveActionTaken: boolean;
  dutyOfCandourMet: boolean;
}

export interface StorageAudit {
  id: string;
  homeId: string;
  auditDate: string;
  auditor: string;
  controlledDrugsSecure: boolean;
  temperatureMonitored: boolean;
  temperatureInRange: boolean;
  expiryDatesChecked: boolean;
  expiredMedicationFound: boolean;
  marChartAccurate: boolean;
  stockReconciled: boolean;
  overallCompliance: StorageCompliance;
}

export interface StaffMedicationTraining {
  id: string;
  staffId: string;
  staffName: string;
  trainingDate: string;
  expiryDate: string;
  trainingStatus: TrainingStatus;
  competencyAssessed: boolean;
  controlledDrugsTraining: boolean;
  errorReportingTraining: boolean;
}

// ── Result Interfaces ───────────────────────────────────────────────────────

export interface AdministrationQualityResult {
  overallScore: number; // 0–25
  totalAdministrations: number;
  onTimeRate: number;
  missedRefusedCount: number;
  twoPersonCheckRate: number;
  documentedImmediatelyRate: number;
  childConsentRate: number;
  sideEffectsMonitoredRate: number;
}

export interface ErrorManagementResult {
  overallScore: number; // 0–25
  totalErrors: number;
  noHarmRate: number;
  reportedImmediatelyRate: number;
  rootCauseIdentifiedRate: number;
  preventiveActionRate: number;
  dutyOfCandourRate: number;
  nearMissCount: number;
}

export interface StorageSafetyResult {
  overallScore: number; // 0–25
  totalAudits: number;
  fullyCompliantRate: number;
  temperatureComplianceRate: number;
  expiryComplianceRate: number;
  marChartAccuracyRate: number;
  expiredMedicationAudits: number;
}

export interface TrainingComplianceResult {
  overallScore: number; // 0–25
  totalStaff: number;
  currentRate: number;
  competencyAssessedRate: number;
  controlledDrugsRate: number;
  errorReportingRate: number;
  expiringCount: number;
}

export interface ChildMedicationProfile {
  childId: string;
  childName: string;
  administrationCount: number;
  onTimeRate: number;
  errorCount: number;
  missedCount: number;
  overallScore: number; // 0–10
}

export interface MedicationErrorPreventionIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  administrationQuality: AdministrationQualityResult;
  errorManagement: ErrorManagementResult;
  storageSafety: StorageSafetyResult;
  trainingCompliance: TrainingComplianceResult;
  childProfiles: ChildMedicationProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 1000) / 10;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function ratingFromScore(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Label Functions ─────────────────────────────────────────────────────────

export function getMedicationTypeLabel(t: MedicationType): string {
  const labels: Record<MedicationType, string> = {
    prescribed: "Prescribed",
    over_the_counter: "Over the Counter",
    homely_remedy: "Homely Remedy",
    controlled: "Controlled",
    prn: "PRN (As Needed)",
    supplement: "Supplement",
  };
  return labels[t] || t;
}

export function getAdministrationStatusLabel(s: AdministrationStatus): string {
  const labels: Record<AdministrationStatus, string> = {
    given_on_time: "Given On Time",
    given_late: "Given Late",
    missed: "Missed",
    refused: "Refused",
    withheld: "Withheld",
    self_administered: "Self-Administered",
  };
  return labels[s] || s;
}

export function getErrorTypeLabel(t: ErrorType): string {
  const labels: Record<ErrorType, string> = {
    wrong_dose: "Wrong Dose",
    wrong_time: "Wrong Time",
    wrong_medication: "Wrong Medication",
    wrong_child: "Wrong Child",
    omission: "Omission",
    double_dose: "Double Dose",
    expired_medication: "Expired Medication",
    documentation_error: "Documentation Error",
    storage_error: "Storage Error",
    near_miss: "Near Miss",
  };
  return labels[t] || t;
}

export function getErrorSeverityLabel(s: ErrorSeverity): string {
  const labels: Record<ErrorSeverity, string> = {
    no_harm: "No Harm",
    minor_harm: "Minor Harm",
    moderate_harm: "Moderate Harm",
    serious_harm: "Serious Harm",
  };
  return labels[s] || s;
}

export function getStorageComplianceLabel(c: StorageCompliance): string {
  const labels: Record<StorageCompliance, string> = {
    fully_compliant: "Fully Compliant",
    minor_issues: "Minor Issues",
    significant_issues: "Significant Issues",
    non_compliant: "Non-Compliant",
  };
  return labels[c] || c;
}

export function getTrainingStatusLabel(s: TrainingStatus): string {
  const labels: Record<TrainingStatus, string> = {
    current: "Current",
    expiring_soon: "Expiring Soon",
    expired: "Expired",
    not_completed: "Not Completed",
  };
  return labels[s] || s;
}

// ── Core Evaluation Functions ───────────────────────────────────────────────

/**
 * Evaluate administration quality — are medications given on time, with
 * proper checks, documentation, consent, and side-effects monitoring?
 * Score: 0–25
 */
export function evaluateAdministrationQuality(
  administrations: MedicationAdministration[],
): AdministrationQualityResult {
  if (administrations.length === 0) {
    return {
      overallScore: 0,
      totalAdministrations: 0,
      onTimeRate: 0,
      missedRefusedCount: 0,
      twoPersonCheckRate: 0,
      documentedImmediatelyRate: 0,
      childConsentRate: 0,
      sideEffectsMonitoredRate: 0,
    };
  }

  const total = administrations.length;

  const onTimeCount = administrations.filter(
    (a) => a.status === "given_on_time" || a.status === "self_administered",
  ).length;
  const onTimeRate = pct(onTimeCount, total);

  const missedRefusedCount = administrations.filter(
    (a) => a.status === "missed" || a.status === "refused",
  ).length;

  const twoPersonCount = administrations.filter((a) => a.twoPersonCheck).length;
  const twoPersonCheckRate = pct(twoPersonCount, total);

  const docCount = administrations.filter((a) => a.documentedImmediately).length;
  const documentedImmediatelyRate = pct(docCount, total);

  const consentCount = administrations.filter((a) => a.childConsent).length;
  const childConsentRate = pct(consentCount, total);

  const sideEffectsCount = administrations.filter((a) => a.sideEffectsMonitored).length;
  const sideEffectsMonitoredRate = pct(sideEffectsCount, total);

  // Scoring — 25 points max
  let score = 0;
  score += (onTimeRate / 100) * 8;                 // On-time administration: 8 pts
  score += (twoPersonCheckRate / 100) * 5;         // Two-person checks: 5 pts
  score += (documentedImmediatelyRate / 100) * 5;  // Immediate documentation: 5 pts
  score += (childConsentRate / 100) * 4;           // Child consent: 4 pts
  score += (sideEffectsMonitoredRate / 100) * 3;   // Side effects monitoring: 3 pts

  return {
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
    totalAdministrations: total,
    onTimeRate,
    missedRefusedCount,
    twoPersonCheckRate,
    documentedImmediatelyRate,
    childConsentRate,
    sideEffectsMonitoredRate,
  };
}

/**
 * Evaluate error management — when errors occur, are they reported,
 * investigated, and acted upon? No errors = excellent (25).
 * Score: 0–25. Penalty: -5 per serious_harm error.
 */
export function evaluateErrorManagement(
  errors: MedicationError[],
): ErrorManagementResult {
  if (errors.length === 0) {
    return {
      overallScore: 25,
      totalErrors: 0,
      noHarmRate: 0,
      reportedImmediatelyRate: 0,
      rootCauseIdentifiedRate: 0,
      preventiveActionRate: 0,
      dutyOfCandourRate: 0,
      nearMissCount: 0,
    };
  }

  const total = errors.length;

  // "Of the errors that actually reached a child, how many caused no harm?"
  // Near-misses were caught before reaching the child, so they're tracked
  // separately (nearMissCount) and excluded here — otherwise they inflate the
  // no-harm rate and can mask a serious-harm error in the same period.
  const actualErrors = errors.filter((e) => e.errorType !== "near_miss");
  const noHarmCount = actualErrors.filter((e) => e.severity === "no_harm").length;
  const noHarmRate = actualErrors.length > 0 ? pct(noHarmCount, actualErrors.length) : 100;

  const reportedCount = errors.filter((e) => e.reportedImmediately).length;
  const reportedImmediatelyRate = pct(reportedCount, total);

  const rootCauseCount = errors.filter((e) => e.rootCauseIdentified).length;
  const rootCauseIdentifiedRate = pct(rootCauseCount, total);

  const preventiveCount = errors.filter((e) => e.preventiveActionTaken).length;
  const preventiveActionRate = pct(preventiveCount, total);

  const dutyCount = errors.filter((e) => e.dutyOfCandourMet).length;
  const dutyOfCandourRate = pct(dutyCount, total);

  const nearMissCount = errors.filter((e) => e.errorType === "near_miss").length;

  // Scoring — 25 points max
  let score = 0;
  score += (noHarmRate / 100) * 5;                 // No-harm rate: 5 pts
  score += (reportedImmediatelyRate / 100) * 6;    // Immediate reporting: 6 pts
  score += (rootCauseIdentifiedRate / 100) * 5;    // Root cause analysis: 5 pts
  score += (preventiveActionRate / 100) * 5;       // Preventive action: 5 pts
  score += (dutyOfCandourRate / 100) * 4;          // Duty of candour: 4 pts

  // Penalty: -5 per serious_harm error
  const seriousCount = errors.filter((e) => e.severity === "serious_harm").length;
  score -= seriousCount * 5;

  return {
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
    totalErrors: total,
    noHarmRate,
    reportedImmediatelyRate,
    rootCauseIdentifiedRate,
    preventiveActionRate,
    dutyOfCandourRate,
    nearMissCount,
  };
}

/**
 * Evaluate storage safety — are medications stored correctly, temperatures
 * monitored, expiry dates checked, and MAR charts accurate?
 * Score: 0–25
 */
export function evaluateStorageSafety(
  audits: StorageAudit[],
): StorageSafetyResult {
  if (audits.length === 0) {
    return {
      overallScore: 0,
      totalAudits: 0,
      fullyCompliantRate: 0,
      temperatureComplianceRate: 0,
      expiryComplianceRate: 0,
      marChartAccuracyRate: 0,
      expiredMedicationAudits: 0,
    };
  }

  const total = audits.length;

  const fullyCompliantCount = audits.filter(
    (a) => a.overallCompliance === "fully_compliant",
  ).length;
  const fullyCompliantRate = pct(fullyCompliantCount, total);

  const tempCompliantCount = audits.filter(
    (a) => a.temperatureMonitored && a.temperatureInRange,
  ).length;
  const temperatureComplianceRate = pct(tempCompliantCount, total);

  const expiryCheckedNoExpired = audits.filter(
    (a) => a.expiryDatesChecked && !a.expiredMedicationFound,
  ).length;
  const expiryComplianceRate = pct(expiryCheckedNoExpired, total);

  const marAccurateCount = audits.filter((a) => a.marChartAccurate).length;
  const marChartAccuracyRate = pct(marAccurateCount, total);

  const expiredMedicationAudits = audits.filter(
    (a) => a.expiredMedicationFound,
  ).length;

  // Scoring — 25 points max
  let score = 0;
  score += (fullyCompliantRate / 100) * 7;         // Overall compliance: 7 pts
  score += (temperatureComplianceRate / 100) * 6;  // Temperature compliance: 6 pts
  score += (expiryComplianceRate / 100) * 6;       // Expiry compliance: 6 pts
  score += (marChartAccuracyRate / 100) * 6;       // MAR chart accuracy: 6 pts

  return {
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
    totalAudits: total,
    fullyCompliantRate,
    temperatureComplianceRate,
    expiryComplianceRate,
    marChartAccuracyRate,
    expiredMedicationAudits,
  };
}

/**
 * Evaluate training compliance — are staff trained, competency-assessed,
 * and do they have controlled drugs and error reporting training?
 * Score: 0–25
 */
export function evaluateTrainingCompliance(
  training: StaffMedicationTraining[],
): TrainingComplianceResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      currentRate: 0,
      competencyAssessedRate: 0,
      controlledDrugsRate: 0,
      errorReportingRate: 0,
      expiringCount: 0,
    };
  }

  const total = training.length;

  const currentCount = training.filter(
    (t) => t.trainingStatus === "current",
  ).length;
  const currentRate = pct(currentCount, total);

  const competencyCount = training.filter((t) => t.competencyAssessed).length;
  const competencyAssessedRate = pct(competencyCount, total);

  const controlledCount = training.filter((t) => t.controlledDrugsTraining).length;
  const controlledDrugsRate = pct(controlledCount, total);

  const errorReportingCount = training.filter((t) => t.errorReportingTraining).length;
  const errorReportingRate = pct(errorReportingCount, total);

  const expiringCount = training.filter(
    (t) => t.trainingStatus === "expiring_soon",
  ).length;

  // Scoring — 25 points max
  let score = 0;
  score += (currentRate / 100) * 8;               // Current training: 8 pts
  score += (competencyAssessedRate / 100) * 7;    // Competency assessed: 7 pts
  score += (controlledDrugsRate / 100) * 5;       // Controlled drugs training: 5 pts
  score += (errorReportingRate / 100) * 5;        // Error reporting training: 5 pts

  return {
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
    totalStaff: total,
    currentRate,
    competencyAssessedRate,
    controlledDrugsRate,
    errorReportingRate,
    expiringCount,
  };
}

/**
 * Build per-child medication profiles.
 */
export function buildChildMedicationProfiles(
  administrations: MedicationAdministration[],
  errors: MedicationError[],
): ChildMedicationProfile[] {
  const byChild = new Map<string, { admins: MedicationAdministration[]; errors: MedicationError[] }>();

  for (const a of administrations) {
    if (!byChild.has(a.childId)) {
      byChild.set(a.childId, { admins: [], errors: [] });
    }
    byChild.get(a.childId)!.admins.push(a);
  }

  for (const e of errors) {
    if (!byChild.has(e.childId)) {
      byChild.set(e.childId, { admins: [], errors: [] });
    }
    byChild.get(e.childId)!.errors.push(e);
  }

  const profiles: ChildMedicationProfile[] = [];

  for (const [childId, data] of byChild) {
    const adminCount = data.admins.length;
    const onTimeCount = data.admins.filter(
      (a) => a.status === "given_on_time" || a.status === "self_administered",
    ).length;
    const onTimeRate = pct(onTimeCount, adminCount);

    const errorCount = data.errors.length;
    const missedCount = data.admins.filter((a) => a.status === "missed").length;

    const childName = data.admins[0]?.childName || data.errors[0]?.childName || "Unknown";

    // Score out of 10
    let score = 5; // Start at midpoint
    if (onTimeRate >= 90) score += 2;
    else if (onTimeRate >= 75) score += 1;
    if (errorCount === 0) score += 2;
    if (missedCount === 0) score += 1;
    // Penalties
    if (errorCount > 2) score -= 2;
    else if (errorCount > 0) score -= 1;
    if (missedCount > 2) score -= 1;
    if (onTimeRate < 50 && adminCount > 0) score -= 1;

    profiles.push({
      childId,
      childName,
      administrationCount: adminCount,
      onTimeRate,
      errorCount,
      missedCount,
      overallScore: clamp(Math.round(score * 10) / 10, 0, 10),
    });
  }

  return profiles.sort((a, b) => a.overallScore - b.overallScore);
}

// ── Main Intelligence Function ──────────────────────────────────────────────

export function generateMedicationErrorPreventionIntelligence(
  administrations: MedicationAdministration[],
  errors: MedicationError[],
  audits: StorageAudit[],
  training: StaffMedicationTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): MedicationErrorPreventionIntelligence {
  const administrationQuality = evaluateAdministrationQuality(administrations);
  const errorManagement = evaluateErrorManagement(errors);
  const storageSafety = evaluateStorageSafety(audits);
  const trainingCompliance = evaluateTrainingCompliance(training);
  const childProfiles = buildChildMedicationProfiles(administrations, errors);

  // Score only the pillars that were actually assessed (have data). Previously an
  // empty pillar scored 0 (admin / storage / training) while the error pillar scored
  // 25 for "no errors" — so a home with administrations but, say, no training records
  // loaded was structurally capped at 50/100. Rescale over the assessed pillars to a
  // /100 figure instead. When all four are assessed this is identical to the old sum.
  const pillars = [
    { score: administrationQuality.overallScore, assessed: administrationQuality.totalAdministrations > 0 },
    { score: errorManagement.overallScore, assessed: administrationQuality.totalAdministrations > 0 || errorManagement.totalErrors > 0 },
    { score: storageSafety.overallScore, assessed: storageSafety.totalAudits > 0 },
    { score: trainingCompliance.overallScore, assessed: trainingCompliance.totalStaff > 0 },
  ];
  const assessed = pillars.filter((p) => p.assessed);
  const overallScore = assessed.length > 0
    ? Math.round((assessed.reduce((s, p) => s + p.score, 0) / (assessed.length * 25)) * 1000) / 10
    : 0;
  const rating = ratingFromScore(overallScore);

  // ── Strengths ──
  const strengths: string[] = [];
  if (administrationQuality.totalAdministrations > 0 && administrationQuality.onTimeRate >= 90) {
    strengths.push("Medications are consistently administered on time, supporting children's health outcomes");
  }
  if (administrationQuality.twoPersonCheckRate >= 90 && administrationQuality.totalAdministrations > 0) {
    strengths.push("Two-person checks are routinely carried out, reducing administration error risk");
  }
  if (administrationQuality.documentedImmediatelyRate >= 90 && administrationQuality.totalAdministrations > 0) {
    strengths.push("Medication administration is documented immediately, ensuring accurate MAR records");
  }
  if (administrationQuality.childConsentRate >= 90 && administrationQuality.totalAdministrations > 0) {
    strengths.push("Children's consent is consistently obtained before medication administration");
  }
  if (errorManagement.totalErrors === 0) {
    strengths.push("No medication errors recorded in the period — a strong indicator of safe practice");
  }
  if (errorManagement.totalErrors > 0 && errorManagement.reportedImmediatelyRate >= 95) {
    strengths.push("All medication errors are reported immediately, enabling swift corrective action");
  }
  if (errorManagement.totalErrors > 0 && errorManagement.rootCauseIdentifiedRate >= 90) {
    strengths.push("Root cause analysis is consistently completed for medication errors");
  }
  if (errorManagement.totalErrors > 0 && errorManagement.preventiveActionRate >= 90) {
    strengths.push("Preventive actions are consistently taken following medication errors");
  }
  if (storageSafety.fullyCompliantRate >= 90 && storageSafety.totalAudits > 0) {
    strengths.push("Medication storage is consistently fully compliant across audits");
  }
  if (storageSafety.marChartAccuracyRate >= 95 && storageSafety.totalAudits > 0) {
    strengths.push("MAR charts are accurate, supporting safe medication management");
  }
  if (trainingCompliance.currentRate >= 90 && trainingCompliance.totalStaff > 0) {
    strengths.push("Staff medication training is current and up to date");
  }
  if (trainingCompliance.competencyAssessedRate >= 90 && trainingCompliance.totalStaff > 0) {
    strengths.push("Competency assessments are consistently completed for medication-administering staff");
  }

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];
  if (administrationQuality.totalAdministrations > 0 && administrationQuality.onTimeRate < 80) {
    areasForImprovement.push("Medication on-time administration rate is below acceptable threshold");
  }
  if (administrationQuality.missedRefusedCount > 0) {
    areasForImprovement.push(`${administrationQuality.missedRefusedCount} medication dose(s) were missed or refused — review reasons and follow-up actions`);
  }
  if (administrationQuality.twoPersonCheckRate < 80 && administrationQuality.totalAdministrations > 0) {
    areasForImprovement.push("Two-person medication checks are not consistently carried out");
  }
  if (administrationQuality.documentedImmediatelyRate < 80 && administrationQuality.totalAdministrations > 0) {
    areasForImprovement.push("Medication administration is not always documented immediately");
  }
  if (administrationQuality.childConsentRate < 80 && administrationQuality.totalAdministrations > 0) {
    areasForImprovement.push("Children's consent is not consistently obtained before medication administration");
  }
  if (errorManagement.totalErrors > 0) {
    areasForImprovement.push(`${errorManagement.totalErrors} medication error(s) occurred in the period — review systemic factors`);
  }
  if (errorManagement.totalErrors > 0 && errorManagement.reportedImmediatelyRate < 80) {
    areasForImprovement.push("Medication errors are not consistently reported immediately");
  }
  if (errorManagement.totalErrors > 0 && errorManagement.rootCauseIdentifiedRate < 80) {
    areasForImprovement.push("Root cause analysis is not consistently completed for medication errors");
  }
  if (storageSafety.totalAudits > 0 && storageSafety.fullyCompliantRate < 80) {
    areasForImprovement.push("Medication storage compliance is below acceptable standard");
  }
  if (storageSafety.expiredMedicationAudits > 0) {
    areasForImprovement.push("Expired medication was found during storage audits — review expiry checking procedures");
  }
  if (storageSafety.totalAudits > 0 && storageSafety.temperatureComplianceRate < 80) {
    areasForImprovement.push("Temperature monitoring and compliance needs improvement");
  }
  if (trainingCompliance.totalStaff > 0 && trainingCompliance.currentRate < 80) {
    areasForImprovement.push("Staff medication training currency is below acceptable threshold");
  }
  if (trainingCompliance.expiringCount > 0) {
    areasForImprovement.push(`${trainingCompliance.expiringCount} staff member(s) have medication training expiring soon — schedule refreshers`);
  }

  // ── Actions ──
  const actions: string[] = [];
  const seriousErrors = errors.filter((e) => e.severity === "serious_harm");
  if (seriousErrors.length > 0) {
    actions.push("URGENT: Review all serious harm medication errors and implement immediate corrective action");
  }
  if (errorManagement.totalErrors > 0 && errorManagement.reportedImmediatelyRate < 80) {
    actions.push("URGENT: Reinforce mandatory immediate reporting of all medication errors to the responsible person");
  }
  if (storageSafety.expiredMedicationAudits > 0) {
    actions.push("HIGH: Remove all expired medication and implement weekly expiry date checking protocol");
  }
  if (administrationQuality.totalAdministrations > 0 && administrationQuality.twoPersonCheckRate < 80) {
    actions.push("HIGH: Implement mandatory two-person checks for all controlled and high-risk medications");
  }
  if (administrationQuality.totalAdministrations > 0 && administrationQuality.onTimeRate < 80) {
    actions.push("HIGH: Review medication rounds scheduling to improve on-time administration rates");
  }
  if (trainingCompliance.totalStaff > 0 && trainingCompliance.currentRate < 80) {
    actions.push("MEDIUM: Schedule medication training refreshers for staff with expired or expiring certification");
  }
  if (administrationQuality.totalAdministrations > 0 && administrationQuality.documentedImmediatelyRate < 80) {
    actions.push("MEDIUM: Reinforce requirement for immediate documentation following medication administration");
  }
  if (trainingCompliance.totalStaff > 0 && trainingCompliance.controlledDrugsRate < 80) {
    actions.push("MEDIUM: Ensure all staff complete controlled drugs training as required by regulations");
  }
  if (administrationQuality.childConsentRate < 80 && administrationQuality.totalAdministrations > 0) {
    actions.push("LOW: Develop age-appropriate tools to support children's informed consent for medication");
  }
  if (administrationQuality.sideEffectsMonitoredRate < 80 && administrationQuality.totalAdministrations > 0) {
    actions.push("LOW: Implement systematic side-effects monitoring and recording following medication administration");
  }

  // ── Regulatory Links ──
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 23 — health needs, ensuring children receive appropriate medication management",
    "NICE SC1 — managing medicines in care homes, safe administration and storage",
    "SCCIF — quality of care, health and well-being, medication management as inspection focus",
    "NMS 6 — National Minimum Standards, health and well-being of looked-after children",
    "MHRA guidance — safe handling, storage, and administration of medicines",
    "Controlled Drugs (Supervision) Regulations 2013 — secure storage and administration of controlled substances",
    "CQC Medicines guidance — safe management of medicines in regulated settings",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    administrationQuality,
    errorManagement,
    storageSafety,
    trainingCompliance,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
