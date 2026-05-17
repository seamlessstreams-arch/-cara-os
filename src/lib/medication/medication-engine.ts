// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Medication Management Engine
//
// Deterministic engine for managing medication administration, storage,
// errors, PRN protocols, and controlled drug compliance in children's homes.
//
// Aligned to:
//   - CHR 2015 Reg 23 — Health and wellbeing (medication management)
//   - NICE CG76 — Medicines adherence
//   - SCCIF — Health & wellbeing judgement (medication administration)
//   - Regulation 12 (Health and Social Care Act) — Safe medication handling
//   - Misuse of Drugs Act 1971 — Controlled drug governance
//
// Key requirements:
//   - All medication administered by trained staff only
//   - MAR charts completed for every administration (no gaps)
//   - PRN protocols in place before any as-needed administration
//   - Controlled drugs: dual-witnessed, counted each shift, separate register
//   - Medication errors reported, investigated, and actioned
//   - Stock checks at regular intervals
//   - Self-administration risk-assessed and promoted where safe
//   - GP/pharmacy reviews at least annually
//   - Storage: locked, correct temperature, in-date
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type MedicationType =
  | "regular"
  | "prn"           // as needed
  | "controlled"
  | "otc"           // over-the-counter
  | "topical"
  | "inhaler"
  | "supplement";

export type AdministrationStatus =
  | "given"
  | "refused"
  | "omitted_clinical"
  | "omitted_error"
  | "self_administered"
  | "not_required"    // PRN not needed
  | "delayed";

export type MedicationErrorSeverity =
  | "near_miss"
  | "minor"         // no harm
  | "moderate"      // temporary harm
  | "serious"       // significant harm
  | "critical";     // life-threatening

export type StorageType =
  | "locked_cabinet"
  | "controlled_drugs_cabinet"
  | "fridge"
  | "child_possession";  // self-admin

export type SelfAdminLevel =
  | "level_1"   // fully supervised
  | "level_2"   // observed but self-managed
  | "level_3"   // independent with checks
  | "level_4";  // fully independent

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface Medication {
  id: string;
  childId: string;
  childName: string;
  name: string;
  dose: string;
  route: string;                   // oral, topical, inhaled, etc.
  frequency: string;               // "twice daily", "PRN", etc.
  type: MedicationType;
  prescribedBy: string;
  prescribedDate: string;
  reviewDueDate: string;
  startDate: string;
  endDate?: string;
  storage: StorageType;
  specialInstructions?: string;
  sideEffects?: string[];
  allergiesChecked: boolean;
  consentObtained: boolean;
  selfAdminLevel?: SelfAdminLevel;
  selfAdminAssessmentDate?: string;
  prnProtocol?: PrnProtocol;
  active: boolean;
}

export interface PrnProtocol {
  indication: string;              // when to give
  maxDoseIn24h: string;            // e.g. "4 doses"
  minTimeBetweenDoses: string;     // e.g. "4 hours"
  whenToSeekHelp: string;          // escalation guidance
  approvedBy: string;
  approvedDate: string;
}

export interface Administration {
  id: string;
  medicationId: string;
  childId: string;
  scheduledTime: string;
  actualTime?: string;
  status: AdministrationStatus;
  administeredBy?: string;
  witnessedBy?: string;            // required for controlled drugs
  batchNumber?: string;
  expiryDate?: string;
  stockBefore?: number;
  stockAfter?: number;
  notes?: string;
  prnReason?: string;              // reason for giving PRN
  prnOutcome?: string;             // effectiveness after admin
  refusalReason?: string;
  omissionReason?: string;
}

export interface MedicationError {
  id: string;
  childId: string;
  childName: string;
  medicationName: string;
  date: string;
  errorType: string;               // wrong dose, wrong time, missed, wrong child, etc.
  severity: MedicationErrorSeverity;
  description: string;
  discoveredBy: string;
  actionsTaken: string[];
  rootCause?: string;
  preventativeMeasures?: string[];
  reportedToGP: boolean;
  reportedToOfsted: boolean;       // if significant
  investigatedBy?: string;
  investigationCompleted: boolean;
  outcome?: string;
}

export interface StockCheck {
  id: string;
  medicationId: string;
  date: string;
  expectedCount: number;
  actualCount: number;
  discrepancy: boolean;
  checkedBy: string;
  witnessedBy?: string;
  actionTaken?: string;
}

export interface ControlledDrugEntry {
  id: string;
  medicationId: string;
  date: string;
  type: "received" | "administered" | "destroyed" | "returned";
  quantity: number;
  runningBalance: number;
  administeredTo?: string;
  witnessedBy: string;
  signedBy: string;
  notes?: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface MedicationComplianceResult {
  childId: string;
  childName: string;
  totalMedications: number;
  activeMedications: number;
  issues: string[];
  warnings: string[];
  isCompliant: boolean;
  marCompletionRate: number;       // % of scheduled doses with recorded outcome
  prnProtocolsInPlace: boolean;    // all PRN meds have protocols
  controlledDrugsCompliant: boolean;
  reviewsUpToDate: boolean;        // all review dates current
  consentComplete: boolean;        // all meds have consent
  storageCompliant: boolean;
  selfAdminAssessed: boolean;      // where applicable
  refusalRate: number;             // % refused
  errorCount30Days: number;
  overdueReviews: { medication: string; dueDate: string }[];
  missedDoses7Days: number;
}

export interface HomeMedicationMetrics {
  homeId: string;
  childCount: number;
  totalActiveMedications: number;
  controlledDrugCount: number;
  overallMarCompletionRate: number;
  overallComplianceRate: number;
  errorRate30Days: number;         // errors per 100 administrations
  errorCount30Days: number;
  nearMissCount30Days: number;
  refusalRate: number;
  prnUsageRate: number;            // PRN admins as % of all admins
  stockDiscrepancies: number;
  overdueReviews: number;
  selfAdminChildCount: number;
  controlledDrugCompliant: boolean;
  staffTrainingCompliant: boolean;
  childrenWithIssues: { childName: string; issueCount: number }[];
  recentErrors: { childName: string; errorType: string; severity: MedicationErrorSeverity; date: string }[];
  complianceIssues: string[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const REVIEW_OVERDUE_DAYS = 0;          // overdue if past review date
const MAR_COMPLETION_TARGET = 100;       // 100% target — every dose recorded
const ACCEPTABLE_REFUSAL_RATE = 15;      // above 15% flags concern
const ERROR_THRESHOLD_PER_100 = 2;       // more than 2 errors per 100 admins is concerning

// ── Core: Evaluate Child Medication Compliance ─────────────────────────────

export function evaluateChildMedicationCompliance(
  medications: Medication[],
  administrations: Administration[],
  errors: MedicationError[],
  childId: string,
  now?: string,
): MedicationComplianceResult {
  const currentTime = now ? new Date(now).getTime() : Date.now();
  const issues: string[] = [];
  const warnings: string[] = [];

  const childMeds = medications.filter(m => m.childId === childId);
  const activeMeds = childMeds.filter(m => m.active);
  const childAdmins = administrations.filter(a => a.childId === childId);
  const childErrors = errors.filter(e => e.childId === childId);

  const childName = childMeds[0]?.childName ?? "Unknown";

  // MAR completion rate
  const scheduledAdmins = childAdmins.filter(a =>
    a.status !== "not_required"
  );
  const completedAdmins = scheduledAdmins.filter(a =>
    a.status === "given" || a.status === "refused" || a.status === "self_administered" || a.status === "omitted_clinical" || a.status === "delayed"
  );
  const marCompletionRate = scheduledAdmins.length > 0
    ? Math.round((completedAdmins.length / scheduledAdmins.length) * 100)
    : 100;

  if (marCompletionRate < MAR_COMPLETION_TARGET) {
    issues.push(`MAR chart incomplete (${marCompletionRate}% — gaps in recording)`);
  }

  // PRN protocols
  const prnMeds = activeMeds.filter(m => m.type === "prn");
  const prnWithProtocol = prnMeds.filter(m => m.prnProtocol);
  const prnProtocolsInPlace = prnMeds.length === 0 || prnMeds.length === prnWithProtocol.length;
  if (!prnProtocolsInPlace) {
    issues.push(`${prnMeds.length - prnWithProtocol.length} PRN medication(s) without protocol`);
  }

  // Controlled drug compliance
  const controlledMeds = activeMeds.filter(m => m.type === "controlled");
  const controlledAdmins = childAdmins.filter(a => {
    const med = medications.find(m => m.id === a.medicationId);
    return med?.type === "controlled";
  });
  const unwitnessedControlled = controlledAdmins.filter(a => a.status === "given" && !a.witnessedBy);
  const controlledDrugsCompliant = unwitnessedControlled.length === 0;
  if (!controlledDrugsCompliant) {
    issues.push(`${unwitnessedControlled.length} controlled drug administration(s) without witness`);
  }

  // Review dates
  const overdueReviews: { medication: string; dueDate: string }[] = [];
  for (const med of activeMeds) {
    if (new Date(med.reviewDueDate).getTime() < currentTime) {
      overdueReviews.push({ medication: med.name, dueDate: med.reviewDueDate });
    }
  }
  const reviewsUpToDate = overdueReviews.length === 0;
  if (!reviewsUpToDate) {
    warnings.push(`${overdueReviews.length} medication review(s) overdue`);
  }

  // Consent
  const withoutConsent = activeMeds.filter(m => !m.consentObtained);
  const consentComplete = withoutConsent.length === 0;
  if (!consentComplete) {
    issues.push(`${withoutConsent.length} medication(s) without recorded consent`);
  }

  // Storage
  const controlledBadStorage = controlledMeds.filter(m => m.storage !== "controlled_drugs_cabinet");
  const storageCompliant = controlledBadStorage.length === 0;
  if (!storageCompliant) {
    issues.push("Controlled drug(s) not stored in controlled drugs cabinet");
  }

  // Self-admin assessment
  const selfAdminMeds = activeMeds.filter(m => m.selfAdminLevel && m.selfAdminLevel !== "level_1");
  const selfAdminAssessed = selfAdminMeds.every(m => m.selfAdminAssessmentDate);
  if (selfAdminMeds.length > 0 && !selfAdminAssessed) {
    warnings.push("Self-administration in place without documented assessment");
  }

  // Refusal rate
  const refusals = childAdmins.filter(a => a.status === "refused");
  const refusalRate = childAdmins.length > 0
    ? Math.round((refusals.length / childAdmins.length) * 100)
    : 0;
  if (refusalRate > ACCEPTABLE_REFUSAL_RATE) {
    warnings.push(`High medication refusal rate (${refusalRate}%) — consider GP/child review`);
  }

  // Errors in last 30 days
  const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60 * 1000;
  const recentErrors = childErrors.filter(e => new Date(e.date).getTime() > thirtyDaysAgo);
  if (recentErrors.length > 0) {
    warnings.push(`${recentErrors.length} medication error(s) in last 30 days`);
  }
  const uninvestigatedErrors = recentErrors.filter(e => !e.investigationCompleted);
  if (uninvestigatedErrors.length > 0) {
    issues.push(`${uninvestigatedErrors.length} medication error(s) not yet investigated`);
  }

  // Missed doses in 7 days
  const sevenDaysAgo = currentTime - 7 * 24 * 60 * 60 * 1000;
  const recentAdmins = childAdmins.filter(a => new Date(a.scheduledTime).getTime() > sevenDaysAgo);
  const missedDoses7Days = recentAdmins.filter(a => a.status === "omitted_error").length;
  if (missedDoses7Days > 0) {
    issues.push(`${missedDoses7Days} missed dose(s) in last 7 days due to error`);
  }

  // Allergies check
  const uncheckedAllergies = activeMeds.filter(m => !m.allergiesChecked);
  if (uncheckedAllergies.length > 0) {
    issues.push(`${uncheckedAllergies.length} medication(s) without allergy check recorded`);
  }

  return {
    childId,
    childName,
    totalMedications: childMeds.length,
    activeMedications: activeMeds.length,
    issues,
    warnings,
    isCompliant: issues.length === 0,
    marCompletionRate,
    prnProtocolsInPlace,
    controlledDrugsCompliant,
    reviewsUpToDate,
    consentComplete,
    storageCompliant,
    selfAdminAssessed,
    refusalRate,
    errorCount30Days: recentErrors.length,
    overdueReviews,
    missedDoses7Days,
  };
}

// ── Core: Calculate Home Medication Metrics ────────────────────────────────

export function calculateHomeMedicationMetrics(
  medications: Medication[],
  administrations: Administration[],
  errors: MedicationError[],
  stockChecks: StockCheck[],
  homeId: string,
  staffMedicationTrained: number,
  totalStaff: number,
  now?: string,
): HomeMedicationMetrics {
  const currentTime = now ? new Date(now).getTime() : Date.now();
  const thirtyDaysAgo = currentTime - 30 * 24 * 60 * 60 * 1000;

  const activeMeds = medications.filter(m => m.active);
  const childIds = [...new Set(activeMeds.map(m => m.childId))];

  // Total counts
  const controlledDrugCount = activeMeds.filter(m => m.type === "controlled").length;

  // MAR completion
  const recentAdmins = administrations.filter(a => new Date(a.scheduledTime).getTime() > thirtyDaysAgo);
  const scheduledRecent = recentAdmins.filter(a => a.status !== "not_required");
  const completedRecent = scheduledRecent.filter(a =>
    a.status === "given" || a.status === "refused" || a.status === "self_administered" || a.status === "omitted_clinical" || a.status === "delayed"
  );
  const overallMarCompletionRate = scheduledRecent.length > 0
    ? Math.round((completedRecent.length / scheduledRecent.length) * 100)
    : 100;

  // Per-child compliance
  const childResults = childIds.map(childId =>
    evaluateChildMedicationCompliance(medications, administrations, errors, childId, now)
  );
  const compliantChildren = childResults.filter(r => r.isCompliant);
  const overallComplianceRate = childResults.length > 0
    ? Math.round((compliantChildren.length / childResults.length) * 100)
    : 100;

  // Error rate
  const recentErrors = errors.filter(e => new Date(e.date).getTime() > thirtyDaysAgo);
  const nearMisses = recentErrors.filter(e => e.severity === "near_miss");
  const totalAdmins30Days = scheduledRecent.length;
  const errorRate30Days = totalAdmins30Days > 0
    ? Math.round((recentErrors.length / totalAdmins30Days) * 100 * 10) / 10
    : 0;

  // Refusal rate
  const refusals = recentAdmins.filter(a => a.status === "refused");
  const refusalRate = scheduledRecent.length > 0
    ? Math.round((refusals.length / scheduledRecent.length) * 100)
    : 0;

  // PRN usage rate
  const prnAdmins = recentAdmins.filter(a => {
    const med = medications.find(m => m.id === a.medicationId);
    return med?.type === "prn" && a.status === "given";
  });
  const totalGiven = recentAdmins.filter(a => a.status === "given" || a.status === "self_administered").length;
  const prnUsageRate = totalGiven > 0
    ? Math.round((prnAdmins.length / totalGiven) * 100)
    : 0;

  // Stock discrepancies
  const recentStockChecks = stockChecks.filter(sc => new Date(sc.date).getTime() > thirtyDaysAgo);
  const stockDiscrepancies = recentStockChecks.filter(sc => sc.discrepancy).length;

  // Overdue reviews
  const overdueReviews = activeMeds.filter(m => new Date(m.reviewDueDate).getTime() < currentTime).length;

  // Self-admin
  const selfAdminChildCount = childIds.filter(childId => {
    const childMeds = activeMeds.filter(m => m.childId === childId);
    return childMeds.some(m => m.selfAdminLevel && m.selfAdminLevel !== "level_1");
  }).length;

  // Controlled drug compliance
  const controlledAdmins = administrations.filter(a => {
    const med = medications.find(m => m.id === a.medicationId);
    return med?.type === "controlled" && a.status === "given";
  });
  const allWitnessed = controlledAdmins.every(a => a.witnessedBy);
  const controlledDrugCompliant = allWitnessed && stockDiscrepancies === 0;

  // Staff training
  const staffTrainingCompliant = totalStaff > 0 && (staffMedicationTrained / totalStaff) >= 0.8;

  // Children with issues
  const childrenWithIssues = childResults
    .filter(r => r.issues.length > 0)
    .map(r => ({ childName: r.childName, issueCount: r.issues.length }))
    .sort((a, b) => b.issueCount - a.issueCount);

  // Recent errors for display
  const recentErrorsDisplay = recentErrors
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(e => ({
      childName: e.childName,
      errorType: e.errorType,
      severity: e.severity,
      date: e.date,
    }));

  // Compliance issues
  const allIssues = childResults.flatMap(r => r.issues);
  const complianceIssues = [...new Set(allIssues)];

  return {
    homeId,
    childCount: childIds.length,
    totalActiveMedications: activeMeds.length,
    controlledDrugCount,
    overallMarCompletionRate,
    overallComplianceRate,
    errorRate30Days,
    errorCount30Days: recentErrors.length,
    nearMissCount30Days: nearMisses.length,
    refusalRate,
    prnUsageRate,
    stockDiscrepancies,
    overdueReviews,
    selfAdminChildCount,
    controlledDrugCompliant,
    staffTrainingCompliant,
    childrenWithIssues,
    recentErrors: recentErrorsDisplay,
    complianceIssues,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────

export function getMedicationTypeLabel(type: MedicationType): string {
  const labels: Record<MedicationType, string> = {
    regular: "Regular",
    prn: "PRN (As Needed)",
    controlled: "Controlled Drug",
    otc: "Over-the-Counter",
    topical: "Topical",
    inhaler: "Inhaler",
    supplement: "Supplement",
  };
  return labels[type] ?? type;
}

export function getAdministrationStatusLabel(status: AdministrationStatus): string {
  const labels: Record<AdministrationStatus, string> = {
    given: "Given",
    refused: "Refused",
    omitted_clinical: "Omitted (Clinical)",
    omitted_error: "Missed (Error)",
    self_administered: "Self-Administered",
    not_required: "Not Required",
    delayed: "Delayed",
  };
  return labels[status] ?? status;
}

export function getErrorSeverityLabel(severity: MedicationErrorSeverity): string {
  const labels: Record<MedicationErrorSeverity, string> = {
    near_miss: "Near Miss",
    minor: "Minor (No Harm)",
    moderate: "Moderate",
    serious: "Serious",
    critical: "Critical",
  };
  return labels[severity] ?? severity;
}

export function getSelfAdminLevelLabel(level: SelfAdminLevel): string {
  const labels: Record<SelfAdminLevel, string> = {
    level_1: "Level 1 — Fully Supervised",
    level_2: "Level 2 — Observed",
    level_3: "Level 3 — Independent with Checks",
    level_4: "Level 4 — Fully Independent",
  };
  return labels[level] ?? level;
}
