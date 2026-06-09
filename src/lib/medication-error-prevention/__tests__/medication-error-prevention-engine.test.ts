// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Medication Error Prevention Intelligence Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateAdministrationQuality,
  evaluateErrorManagement,
  evaluateStorageSafety,
  evaluateTrainingCompliance,
  buildChildMedicationProfiles,
  generateMedicationErrorPreventionIntelligence,
  getMedicationTypeLabel,
  getAdministrationStatusLabel,
  getErrorTypeLabel,
  getErrorSeverityLabel,
  getStorageComplianceLabel,
  getTrainingStatusLabel,
} from "../medication-error-prevention-engine";
import type {
  MedicationAdministration,
  MedicationError,
  StorageAudit,
  StaffMedicationTraining,
} from "../medication-error-prevention-engine";

// ── Shared Constants ───────────────────────────────────────────────────────

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-06-30";
const HOME_ID = "oak-house";

// ── Factory Helpers ────────────────────────────────────────────────────────

function makeAdministration(
  overrides: Partial<MedicationAdministration> = {},
): MedicationAdministration {
  return {
    id: "admin-1",
    childId: "child-alex",
    childName: "Alex",
    medicationName: "Sertraline 50mg",
    medicationType: "prescribed",
    scheduledTime: "2025-02-10T08:00:00",
    actualTime: "2025-02-10T08:05:00",
    status: "given_on_time",
    administeredBy: "Sarah Johnson",
    witnessedBy: "Tom Richards",
    twoPersonCheck: true,
    documentedImmediately: true,
    childConsent: true,
    sideEffectsMonitored: true,
    ...overrides,
  };
}

function makeError(overrides: Partial<MedicationError> = {}): MedicationError {
  return {
    id: "err-1",
    childId: "child-jordan",
    childName: "Jordan",
    errorType: "near_miss",
    severity: "no_harm",
    date: "2025-03-15",
    discoveredBy: "Sarah Johnson",
    reportedImmediately: true,
    parentNotified: true,
    gpNotified: false,
    rootCauseIdentified: true,
    preventiveActionTaken: true,
    dutyOfCandourMet: true,
    ...overrides,
  };
}

function makeAudit(overrides: Partial<StorageAudit> = {}): StorageAudit {
  return {
    id: "audit-1",
    homeId: HOME_ID,
    auditDate: "2025-02-01",
    auditor: "Sarah Johnson",
    controlledDrugsSecure: true,
    temperatureMonitored: true,
    temperatureInRange: true,
    expiryDatesChecked: true,
    expiredMedicationFound: false,
    marChartAccurate: true,
    stockReconciled: true,
    overallCompliance: "fully_compliant",
    ...overrides,
  };
}

function makeTraining(
  overrides: Partial<StaffMedicationTraining> = {},
): StaffMedicationTraining {
  return {
    id: "tr-1",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    trainingDate: "2025-01-10",
    expiryDate: "2026-01-10",
    trainingStatus: "current",
    competencyAssessed: true,
    controlledDrugsTraining: true,
    errorReportingTraining: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("Label Functions", () => {
  describe("getMedicationTypeLabel", () => {
    it("returns human-readable labels for all medication types", () => {
      expect(getMedicationTypeLabel("prescribed")).toBe("Prescribed");
      expect(getMedicationTypeLabel("over_the_counter")).toBe("Over the Counter");
      expect(getMedicationTypeLabel("homely_remedy")).toBe("Homely Remedy");
      expect(getMedicationTypeLabel("controlled")).toBe("Controlled");
      expect(getMedicationTypeLabel("prn")).toBe("PRN (As Needed)");
      expect(getMedicationTypeLabel("supplement")).toBe("Supplement");
    });
  });

  describe("getAdministrationStatusLabel", () => {
    it("returns human-readable labels for all statuses", () => {
      expect(getAdministrationStatusLabel("given_on_time")).toBe("Given On Time");
      expect(getAdministrationStatusLabel("given_late")).toBe("Given Late");
      expect(getAdministrationStatusLabel("missed")).toBe("Missed");
      expect(getAdministrationStatusLabel("refused")).toBe("Refused");
      expect(getAdministrationStatusLabel("withheld")).toBe("Withheld");
      expect(getAdministrationStatusLabel("self_administered")).toBe("Self-Administered");
    });
  });

  describe("getErrorTypeLabel", () => {
    it("returns human-readable labels for all error types", () => {
      expect(getErrorTypeLabel("wrong_dose")).toBe("Wrong Dose");
      expect(getErrorTypeLabel("wrong_time")).toBe("Wrong Time");
      expect(getErrorTypeLabel("wrong_medication")).toBe("Wrong Medication");
      expect(getErrorTypeLabel("wrong_child")).toBe("Wrong Child");
      expect(getErrorTypeLabel("omission")).toBe("Omission");
      expect(getErrorTypeLabel("double_dose")).toBe("Double Dose");
      expect(getErrorTypeLabel("expired_medication")).toBe("Expired Medication");
      expect(getErrorTypeLabel("documentation_error")).toBe("Documentation Error");
      expect(getErrorTypeLabel("storage_error")).toBe("Storage Error");
      expect(getErrorTypeLabel("near_miss")).toBe("Near Miss");
    });
  });

  describe("getErrorSeverityLabel", () => {
    it("returns human-readable labels for all severities", () => {
      expect(getErrorSeverityLabel("no_harm")).toBe("No Harm");
      expect(getErrorSeverityLabel("minor_harm")).toBe("Minor Harm");
      expect(getErrorSeverityLabel("moderate_harm")).toBe("Moderate Harm");
      expect(getErrorSeverityLabel("serious_harm")).toBe("Serious Harm");
    });
  });

  describe("getStorageComplianceLabel", () => {
    it("returns human-readable labels for all compliance levels", () => {
      expect(getStorageComplianceLabel("fully_compliant")).toBe("Fully Compliant");
      expect(getStorageComplianceLabel("minor_issues")).toBe("Minor Issues");
      expect(getStorageComplianceLabel("significant_issues")).toBe("Significant Issues");
      expect(getStorageComplianceLabel("non_compliant")).toBe("Non-Compliant");
    });
  });

  describe("getTrainingStatusLabel", () => {
    it("returns human-readable labels for all training statuses", () => {
      expect(getTrainingStatusLabel("current")).toBe("Current");
      expect(getTrainingStatusLabel("expiring_soon")).toBe("Expiring Soon");
      expect(getTrainingStatusLabel("expired")).toBe("Expired");
      expect(getTrainingStatusLabel("not_completed")).toBe("Not Completed");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateAdministrationQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateAdministrationQuality", () => {
  it("returns 0 score when no administrations", () => {
    const result = evaluateAdministrationQuality([]);
    expect(result.totalAdministrations).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("scores maximum for ideal administration practice", () => {
    const admins = [makeAdministration()];
    const result = evaluateAdministrationQuality(admins);
    expect(result.totalAdministrations).toBe(1);
    expect(result.onTimeRate).toBe(100);
    expect(result.twoPersonCheckRate).toBe(100);
    expect(result.documentedImmediatelyRate).toBe(100);
    expect(result.childConsentRate).toBe(100);
    expect(result.sideEffectsMonitoredRate).toBe(100);
    expect(result.overallScore).toBe(25);
  });

  it("counts self_administered as on-time", () => {
    const admins = [makeAdministration({ status: "self_administered", actualTime: null })];
    const result = evaluateAdministrationQuality(admins);
    expect(result.onTimeRate).toBe(100);
  });

  it("counts missed and refused doses", () => {
    const admins = [
      makeAdministration({ id: "a1", status: "missed", actualTime: null }),
      makeAdministration({ id: "a2", status: "refused", actualTime: null }),
      makeAdministration({ id: "a3", status: "given_on_time" }),
    ];
    const result = evaluateAdministrationQuality(admins);
    expect(result.missedRefusedCount).toBe(2);
    expect(result.onTimeRate).toBeCloseTo(33.3, 0);
  });

  it("penalises missing two-person checks", () => {
    const admins = [makeAdministration({ twoPersonCheck: false, witnessedBy: null })];
    const result = evaluateAdministrationQuality(admins);
    expect(result.twoPersonCheckRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("penalises lack of immediate documentation", () => {
    const admins = [makeAdministration({ documentedImmediately: false })];
    const result = evaluateAdministrationQuality(admins);
    expect(result.documentedImmediatelyRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("penalises lack of child consent", () => {
    const admins = [makeAdministration({ childConsent: false })];
    const result = evaluateAdministrationQuality(admins);
    expect(result.childConsentRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("penalises lack of side-effects monitoring", () => {
    const admins = [makeAdministration({ sideEffectsMonitored: false })];
    const result = evaluateAdministrationQuality(admins);
    expect(result.sideEffectsMonitoredRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("handles mixed quality across multiple administrations", () => {
    const admins = [
      makeAdministration({ id: "a1" }),
      makeAdministration({ id: "a2", status: "given_late", twoPersonCheck: false, childConsent: false }),
      makeAdministration({ id: "a3", status: "missed", actualTime: null, twoPersonCheck: false, documentedImmediately: false }),
    ];
    const result = evaluateAdministrationQuality(admins);
    expect(result.totalAdministrations).toBe(3);
    expect(result.onTimeRate).toBeCloseTo(33.3, 0);
    expect(result.twoPersonCheckRate).toBeCloseTo(33.3, 0);
    expect(result.missedRefusedCount).toBe(1);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(15);
  });

  it("scores zero when everything is wrong", () => {
    const admins = [makeAdministration({
      status: "missed",
      actualTime: null,
      twoPersonCheck: false,
      documentedImmediately: false,
      childConsent: false,
      sideEffectsMonitored: false,
    })];
    const result = evaluateAdministrationQuality(admins);
    expect(result.overallScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateErrorManagement
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateErrorManagement", () => {
  it("returns max score (25) when no errors — no errors is excellent", () => {
    const result = evaluateErrorManagement([]);
    expect(result.totalErrors).toBe(0);
    expect(result.overallScore).toBe(25);
  });

  it("scores well when errors are well-managed", () => {
    const errors = [makeError()];
    const result = evaluateErrorManagement(errors);
    expect(result.totalErrors).toBe(1);
    expect(result.noHarmRate).toBe(100);
    expect(result.reportedImmediatelyRate).toBe(100);
    expect(result.rootCauseIdentifiedRate).toBe(100);
    expect(result.preventiveActionRate).toBe(100);
    expect(result.dutyOfCandourRate).toBe(100);
    expect(result.overallScore).toBe(25);
  });

  it("counts near-miss errors", () => {
    const errors = [
      makeError({ id: "e1", errorType: "near_miss" }),
      makeError({ id: "e2", errorType: "wrong_dose" }),
    ];
    const result = evaluateErrorManagement(errors);
    expect(result.nearMissCount).toBe(1);
  });

  it("applies -5 penalty per serious_harm error", () => {
    const errors = [makeError({ severity: "serious_harm" })];
    const result = evaluateErrorManagement(errors);
    expect(result.overallScore).toBeLessThan(25);
    // With all good management but serious harm: base 25 - 5 penalty = capped result
    const errorsTwo = [
      makeError({ id: "e1", severity: "serious_harm" }),
      makeError({ id: "e2", severity: "serious_harm" }),
    ];
    const resultTwo = evaluateErrorManagement(errorsTwo);
    expect(resultTwo.overallScore).toBeLessThan(result.overallScore);
  });

  it("serious harm penalty can bring score to zero", () => {
    const errors = [
      makeError({ id: "e1", severity: "serious_harm", reportedImmediately: false, rootCauseIdentified: false, preventiveActionTaken: false, dutyOfCandourMet: false }),
      makeError({ id: "e2", severity: "serious_harm", reportedImmediately: false, rootCauseIdentified: false, preventiveActionTaken: false, dutyOfCandourMet: false }),
    ];
    const result = evaluateErrorManagement(errors);
    expect(result.overallScore).toBe(0);
  });

  it("penalises when errors not reported immediately", () => {
    const errors = [makeError({ reportedImmediately: false })];
    const result = evaluateErrorManagement(errors);
    expect(result.reportedImmediatelyRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("penalises when root cause not identified", () => {
    const errors = [makeError({ rootCauseIdentified: false })];
    const result = evaluateErrorManagement(errors);
    expect(result.rootCauseIdentifiedRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("penalises when preventive action not taken", () => {
    const errors = [makeError({ preventiveActionTaken: false })];
    const result = evaluateErrorManagement(errors);
    expect(result.preventiveActionRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("penalises when duty of candour not met", () => {
    const errors = [makeError({ dutyOfCandourMet: false })];
    const result = evaluateErrorManagement(errors);
    expect(result.dutyOfCandourRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("handles mixed error management quality", () => {
    // Two ACTUAL errors (not near-misses) so the no-harm rate reflects errors that
    // reached a child: 1 of 2 caused no harm -> 50%.
    const errors = [
      makeError({ id: "e1", errorType: "wrong_dose", severity: "no_harm", reportedImmediately: true, rootCauseIdentified: true }),
      makeError({ id: "e2", errorType: "wrong_time", severity: "minor_harm", reportedImmediately: false, rootCauseIdentified: false, preventiveActionTaken: false }),
    ];
    const result = evaluateErrorManagement(errors);
    expect(result.totalErrors).toBe(2);
    expect(result.noHarmRate).toBe(50);
    expect(result.reportedImmediatelyRate).toBe(50);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateStorageSafety
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStorageSafety", () => {
  it("returns 0 score when no audits", () => {
    const result = evaluateStorageSafety([]);
    expect(result.totalAudits).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("scores maximum for fully compliant audits", () => {
    const audits = [makeAudit()];
    const result = evaluateStorageSafety(audits);
    expect(result.totalAudits).toBe(1);
    expect(result.fullyCompliantRate).toBe(100);
    expect(result.temperatureComplianceRate).toBe(100);
    expect(result.expiryComplianceRate).toBe(100);
    expect(result.marChartAccuracyRate).toBe(100);
    expect(result.expiredMedicationAudits).toBe(0);
    expect(result.overallScore).toBe(25);
  });

  it("penalises temperature non-compliance", () => {
    const audits = [makeAudit({ temperatureInRange: false })];
    const result = evaluateStorageSafety(audits);
    expect(result.temperatureComplianceRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("penalises expired medication found", () => {
    const audits = [makeAudit({ expiredMedicationFound: true })];
    const result = evaluateStorageSafety(audits);
    expect(result.expiredMedicationAudits).toBe(1);
    expect(result.expiryComplianceRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("penalises inaccurate MAR charts", () => {
    const audits = [makeAudit({ marChartAccurate: false })];
    const result = evaluateStorageSafety(audits);
    expect(result.marChartAccuracyRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("handles mixed audit results", () => {
    const audits = [
      makeAudit({ id: "a1", overallCompliance: "fully_compliant" }),
      makeAudit({ id: "a2", auditDate: "2025-04-01", overallCompliance: "minor_issues", temperatureInRange: false, expiredMedicationFound: true }),
    ];
    const result = evaluateStorageSafety(audits);
    expect(result.totalAudits).toBe(2);
    expect(result.fullyCompliantRate).toBe(50);
    expect(result.temperatureComplianceRate).toBe(50);
    expect(result.expiredMedicationAudits).toBe(1);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("scores zero when everything is non-compliant", () => {
    const audits = [makeAudit({
      overallCompliance: "non_compliant",
      temperatureMonitored: false,
      temperatureInRange: false,
      expiryDatesChecked: false,
      expiredMedicationFound: true,
      marChartAccurate: false,
    })];
    const result = evaluateStorageSafety(audits);
    expect(result.overallScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateTrainingCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateTrainingCompliance", () => {
  it("returns 0 score when no training data", () => {
    const result = evaluateTrainingCompliance([]);
    expect(result.totalStaff).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("scores maximum for fully compliant training", () => {
    const training = [makeTraining()];
    const result = evaluateTrainingCompliance(training);
    expect(result.totalStaff).toBe(1);
    expect(result.currentRate).toBe(100);
    expect(result.competencyAssessedRate).toBe(100);
    expect(result.controlledDrugsRate).toBe(100);
    expect(result.errorReportingRate).toBe(100);
    expect(result.expiringCount).toBe(0);
    expect(result.overallScore).toBe(25);
  });

  it("penalises expired training", () => {
    const training = [makeTraining({ trainingStatus: "expired" })];
    const result = evaluateTrainingCompliance(training);
    expect(result.currentRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("counts expiring soon staff", () => {
    const training = [
      makeTraining({ id: "t1", trainingStatus: "current" }),
      makeTraining({ id: "t2", staffId: "staff-tom", staffName: "Tom", trainingStatus: "expiring_soon" }),
    ];
    const result = evaluateTrainingCompliance(training);
    expect(result.expiringCount).toBe(1);
    expect(result.currentRate).toBe(50);
  });

  it("penalises missing competency assessment", () => {
    const training = [makeTraining({ competencyAssessed: false })];
    const result = evaluateTrainingCompliance(training);
    expect(result.competencyAssessedRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("penalises missing controlled drugs training", () => {
    const training = [makeTraining({ controlledDrugsTraining: false })];
    const result = evaluateTrainingCompliance(training);
    expect(result.controlledDrugsRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("penalises missing error reporting training", () => {
    const training = [makeTraining({ errorReportingTraining: false })];
    const result = evaluateTrainingCompliance(training);
    expect(result.errorReportingRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("handles mixed training compliance", () => {
    const training = [
      makeTraining({ id: "t1" }),
      makeTraining({ id: "t2", staffId: "staff-tom", staffName: "Tom", trainingStatus: "expired", competencyAssessed: false, controlledDrugsTraining: false }),
    ];
    const result = evaluateTrainingCompliance(training);
    expect(result.totalStaff).toBe(2);
    expect(result.currentRate).toBe(50);
    expect(result.competencyAssessedRate).toBe(50);
    expect(result.controlledDrugsRate).toBe(50);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("scores zero when all training is deficient", () => {
    const training = [makeTraining({
      trainingStatus: "not_completed",
      competencyAssessed: false,
      controlledDrugsTraining: false,
      errorReportingTraining: false,
    })];
    const result = evaluateTrainingCompliance(training);
    expect(result.overallScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildMedicationProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildMedicationProfiles", () => {
  it("returns empty array when no data", () => {
    const profiles = buildChildMedicationProfiles([], []);
    expect(profiles).toEqual([]);
  });

  it("builds profile for child with ideal administration and no errors", () => {
    const admins = [makeAdministration()];
    const profiles = buildChildMedicationProfiles(admins, []);
    expect(profiles.length).toBe(1);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].administrationCount).toBe(1);
    expect(profiles[0].onTimeRate).toBe(100);
    expect(profiles[0].errorCount).toBe(0);
    expect(profiles[0].missedCount).toBe(0);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(8);
  });

  it("builds profiles for multiple children and sorts by score (lowest first)", () => {
    const admins = [
      makeAdministration({ id: "a1", childId: "child-alex", childName: "Alex" }),
      makeAdministration({ id: "a2", childId: "child-jordan", childName: "Jordan", status: "missed", actualTime: null }),
    ];
    const errors = [
      makeError({ childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildMedicationProfiles(admins, errors);
    expect(profiles.length).toBe(2);
    // Jordan should have lower score (sorted first)
    expect(profiles[0].childName).toBe("Jordan");
    expect(profiles[1].childName).toBe("Alex");
  });

  it("penalises children with multiple errors", () => {
    const admins = [makeAdministration({ childId: "child-a", childName: "A" })];
    const errors = [
      makeError({ id: "e1", childId: "child-a", childName: "A" }),
      makeError({ id: "e2", childId: "child-a", childName: "A" }),
      makeError({ id: "e3", childId: "child-a", childName: "A" }),
    ];
    const profiles = buildChildMedicationProfiles(admins, errors);
    expect(profiles[0].errorCount).toBe(3);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(6);
  });

  it("penalises children with multiple missed doses", () => {
    const admins = [
      makeAdministration({ id: "a1", status: "missed", actualTime: null }),
      makeAdministration({ id: "a2", status: "missed", actualTime: null }),
      makeAdministration({ id: "a3", status: "missed", actualTime: null }),
    ];
    const profiles = buildChildMedicationProfiles(admins, []);
    expect(profiles[0].missedCount).toBe(3);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(5);
  });

  it("includes children who have errors but no administrations", () => {
    const errors = [makeError({ childId: "child-z", childName: "Z" })];
    const profiles = buildChildMedicationProfiles([], errors);
    expect(profiles.length).toBe(1);
    expect(profiles[0].childId).toBe("child-z");
    expect(profiles[0].administrationCount).toBe(0);
    expect(profiles[0].errorCount).toBe(1);
  });

  it("clamps score to 0–10 range", () => {
    const admins = [makeAdministration({
      status: "missed",
      actualTime: null,
    })];
    const errors = [
      makeError({ id: "e1" }),
      makeError({ id: "e2" }),
      makeError({ id: "e3" }),
    ];
    const profiles = buildChildMedicationProfiles(admins, errors);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateMedicationErrorPreventionIntelligence — Integration
// ══════════════════════════════════════════════════════════════════════════════

describe("generateMedicationErrorPreventionIntelligence", () => {
  // ── Chamberlain House Demo Scenario ──────────────────────────────────────────────
  // Alex: daily prescribed + PRN, all on time
  // Jordan: prescribed + controlled, 1 late, 1 near-miss error
  // Morgan: self-administering with oversight
  // 2 storage audits: 1 fully compliant, 1 minor issues
  // Staff: Sarah current, Tom expiring soon, Lisa current with controlled drugs

  const demoAdministrations: MedicationAdministration[] = [
    // Alex — daily Sertraline 50mg (prescribed), all on time
    {
      id: "admin-a1", childId: "child-alex", childName: "Alex",
      medicationName: "Sertraline 50mg", medicationType: "prescribed",
      scheduledTime: "2025-02-10T08:00:00", actualTime: "2025-02-10T08:05:00",
      status: "given_on_time", administeredBy: "Sarah Johnson", witnessedBy: "Tom Richards",
      twoPersonCheck: true, documentedImmediately: true, childConsent: true, sideEffectsMonitored: true,
    },
    {
      id: "admin-a2", childId: "child-alex", childName: "Alex",
      medicationName: "Sertraline 50mg", medicationType: "prescribed",
      scheduledTime: "2025-02-11T08:00:00", actualTime: "2025-02-11T07:58:00",
      status: "given_on_time", administeredBy: "Sarah Johnson", witnessedBy: "Lisa Williams",
      twoPersonCheck: true, documentedImmediately: true, childConsent: true, sideEffectsMonitored: true,
    },
    // Alex — PRN Ibuprofen (as needed), on time
    {
      id: "admin-a3", childId: "child-alex", childName: "Alex",
      medicationName: "Ibuprofen 200mg", medicationType: "prn",
      scheduledTime: "2025-03-05T14:30:00", actualTime: "2025-03-05T14:35:00",
      status: "given_on_time", administeredBy: "Tom Richards", witnessedBy: "Sarah Johnson",
      twoPersonCheck: true, documentedImmediately: true, childConsent: true, sideEffectsMonitored: true,
    },
    // Jordan — prescribed Methylphenidate (controlled), on time
    {
      id: "admin-j1", childId: "child-jordan", childName: "Jordan",
      medicationName: "Methylphenidate 10mg", medicationType: "controlled",
      scheduledTime: "2025-02-10T07:30:00", actualTime: "2025-02-10T07:32:00",
      status: "given_on_time", administeredBy: "Lisa Williams", witnessedBy: "Sarah Johnson",
      twoPersonCheck: true, documentedImmediately: true, childConsent: true, sideEffectsMonitored: true,
    },
    // Jordan — prescribed Melatonin, given late
    {
      id: "admin-j2", childId: "child-jordan", childName: "Jordan",
      medicationName: "Melatonin 3mg", medicationType: "prescribed",
      scheduledTime: "2025-02-10T20:00:00", actualTime: "2025-02-10T21:15:00",
      status: "given_late", administeredBy: "Tom Richards", witnessedBy: null,
      twoPersonCheck: false, documentedImmediately: false, childConsent: true, sideEffectsMonitored: false,
    },
    // Morgan — self-administering Vitamin D (supplement) with oversight
    {
      id: "admin-m1", childId: "child-morgan", childName: "Morgan",
      medicationName: "Vitamin D 1000IU", medicationType: "supplement",
      scheduledTime: "2025-02-10T08:00:00", actualTime: "2025-02-10T08:10:00",
      status: "self_administered", administeredBy: "Morgan (self)", witnessedBy: "Sarah Johnson",
      twoPersonCheck: true, documentedImmediately: true, childConsent: true, sideEffectsMonitored: true,
    },
    {
      id: "admin-m2", childId: "child-morgan", childName: "Morgan",
      medicationName: "Vitamin D 1000IU", medicationType: "supplement",
      scheduledTime: "2025-02-11T08:00:00", actualTime: "2025-02-11T08:05:00",
      status: "self_administered", administeredBy: "Morgan (self)", witnessedBy: "Tom Richards",
      twoPersonCheck: true, documentedImmediately: true, childConsent: true, sideEffectsMonitored: true,
    },
  ];

  const demoErrors: MedicationError[] = [
    // Jordan — near-miss error (wrong time caught before admin)
    {
      id: "err-j1", childId: "child-jordan", childName: "Jordan",
      errorType: "near_miss", severity: "no_harm", date: "2025-03-15",
      discoveredBy: "Sarah Johnson",
      reportedImmediately: true, parentNotified: true, gpNotified: false,
      rootCauseIdentified: true, preventiveActionTaken: true, dutyOfCandourMet: true,
    },
  ];

  const demoAudits: StorageAudit[] = [
    // Fully compliant audit
    {
      id: "audit-1", homeId: HOME_ID, auditDate: "2025-02-01", auditor: "Sarah Johnson",
      controlledDrugsSecure: true, temperatureMonitored: true, temperatureInRange: true,
      expiryDatesChecked: true, expiredMedicationFound: false,
      marChartAccurate: true, stockReconciled: true, overallCompliance: "fully_compliant",
    },
    // Minor issues audit
    {
      id: "audit-2", homeId: HOME_ID, auditDate: "2025-04-01", auditor: "Lisa Williams",
      controlledDrugsSecure: true, temperatureMonitored: true, temperatureInRange: false,
      expiryDatesChecked: true, expiredMedicationFound: false,
      marChartAccurate: true, stockReconciled: true, overallCompliance: "minor_issues",
    },
  ];

  const demoTraining: StaffMedicationTraining[] = [
    // Sarah — current, fully trained
    {
      id: "tr-1", staffId: "staff-sarah", staffName: "Sarah Johnson",
      trainingDate: "2025-01-10", expiryDate: "2026-01-10",
      trainingStatus: "current", competencyAssessed: true,
      controlledDrugsTraining: true, errorReportingTraining: true,
    },
    // Tom — expiring soon
    {
      id: "tr-2", staffId: "staff-tom", staffName: "Tom Richards",
      trainingDate: "2024-07-15", expiryDate: "2025-07-15",
      trainingStatus: "expiring_soon", competencyAssessed: true,
      controlledDrugsTraining: false, errorReportingTraining: true,
    },
    // Lisa — current with controlled drugs training
    {
      id: "tr-3", staffId: "staff-lisa", staffName: "Lisa Williams",
      trainingDate: "2025-02-01", expiryDate: "2026-02-01",
      trainingStatus: "current", competencyAssessed: true,
      controlledDrugsTraining: true, errorReportingTraining: true,
    },
  ];

  it("produces a complete intelligence result", () => {
    const result = generateMedicationErrorPreventionIntelligence(
      demoAdministrations, demoErrors, demoAudits, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END,
    );

    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);

    expect(result.administrationQuality).toBeDefined();
    expect(result.errorManagement).toBeDefined();
    expect(result.storageSafety).toBeDefined();
    expect(result.trainingCompliance).toBeDefined();
    expect(result.childProfiles.length).toBe(3); // Alex, Jordan, Morgan
    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("calculates correct administration quality for demo data", () => {
    const result = generateMedicationErrorPreventionIntelligence(
      demoAdministrations, demoErrors, demoAudits, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END,
    );

    const aq = result.administrationQuality;
    expect(aq.totalAdministrations).toBe(7);
    // 6 on time + self_administered, 1 given_late = 6/7
    expect(aq.onTimeRate).toBeCloseTo(85.7, 0);
    expect(aq.missedRefusedCount).toBe(0);
  });

  it("calculates correct error management for demo data", () => {
    const result = generateMedicationErrorPreventionIntelligence(
      demoAdministrations, demoErrors, demoAudits, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END,
    );

    const em = result.errorManagement;
    expect(em.totalErrors).toBe(1);
    expect(em.nearMissCount).toBe(1);
    expect(em.noHarmRate).toBe(100);
    expect(em.reportedImmediatelyRate).toBe(100);
    expect(em.rootCauseIdentifiedRate).toBe(100);
    expect(em.preventiveActionRate).toBe(100);
    expect(em.dutyOfCandourRate).toBe(100);
    expect(em.overallScore).toBe(25);
  });

  it("calculates correct storage safety for demo data", () => {
    const result = generateMedicationErrorPreventionIntelligence(
      demoAdministrations, demoErrors, demoAudits, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END,
    );

    const ss = result.storageSafety;
    expect(ss.totalAudits).toBe(2);
    expect(ss.fullyCompliantRate).toBe(50);
    expect(ss.temperatureComplianceRate).toBe(50);
    expect(ss.expiryComplianceRate).toBe(100);
    expect(ss.marChartAccuracyRate).toBe(100);
    expect(ss.expiredMedicationAudits).toBe(0);
  });

  it("calculates correct training compliance for demo data", () => {
    const result = generateMedicationErrorPreventionIntelligence(
      demoAdministrations, demoErrors, demoAudits, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END,
    );

    const tc = result.trainingCompliance;
    expect(tc.totalStaff).toBe(3);
    // Sarah and Lisa are current (2/3)
    expect(tc.currentRate).toBeCloseTo(66.7, 0);
    expect(tc.competencyAssessedRate).toBe(100);
    // Sarah and Lisa have controlled drugs training (2/3)
    expect(tc.controlledDrugsRate).toBeCloseTo(66.7, 0);
    expect(tc.errorReportingRate).toBe(100);
    expect(tc.expiringCount).toBe(1); // Tom
  });

  it("generates strengths for good practice", () => {
    const result = generateMedicationErrorPreventionIntelligence(
      demoAdministrations, demoErrors, demoAudits, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END,
    );

    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("consent"),
      ]),
    );
  });

  it("generates areas for improvement for demo data", () => {
    const result = generateMedicationErrorPreventionIntelligence(
      demoAdministrations, demoErrors, demoAudits, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END,
    );

    // Training expiring count > 0 triggers improvement
    expect(result.areasForImprovement).toEqual(
      expect.arrayContaining([
        expect.stringContaining("expiring"),
      ]),
    );
  });

  it("generates regulatory links", () => {
    const result = generateMedicationErrorPreventionIntelligence(
      demoAdministrations, demoErrors, demoAudits, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END,
    );

    expect(result.regulatoryLinks).toEqual(
      expect.arrayContaining([
        expect.stringContaining("CHR 2015 Reg 23"),
        expect.stringContaining("NICE SC1"),
        expect.stringContaining("SCCIF"),
        expect.stringContaining("NMS 6"),
        expect.stringContaining("MHRA"),
        expect.stringContaining("Controlled Drugs"),
        expect.stringContaining("CQC"),
      ]),
    );
  });

  it("overall score is sum of component scores", () => {
    const result = generateMedicationErrorPreventionIntelligence(
      demoAdministrations, demoErrors, demoAudits, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END,
    );

    const expected = Math.round(
      (result.administrationQuality.overallScore +
        result.errorManagement.overallScore +
        result.storageSafety.overallScore +
        result.trainingCompliance.overallScore) * 10,
    ) / 10;
    expect(result.overallScore).toBe(expected);
  });

  // ── Edge Cases ──────────────────────────────────────────────────────────

  it("handles all empty inputs", () => {
    const result = generateMedicationErrorPreventionIntelligence(
      [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END,
    );

    // No data in ANY pillar → nothing assessed → overall 0. (Previously a misleading
    // 25, because the "no errors = perfect" pillar masked the three empty pillars.)
    expect(result.overallScore).toBe(0);
    expect(result.childProfiles.length).toBe(0);
    expect(result.errorManagement.overallScore).toBe(25);
    expect(result.administrationQuality.overallScore).toBe(0);
    expect(result.storageSafety.overallScore).toBe(0);
    expect(result.trainingCompliance.overallScore).toBe(0);
  });

  it("handles worst-case scenario — everything wrong", () => {
    const badAdmins = [
      makeAdministration({
        id: "bad-a1", status: "missed", actualTime: null,
        twoPersonCheck: false, documentedImmediately: false,
        childConsent: false, sideEffectsMonitored: false,
      }),
    ];
    const badErrors = [
      makeError({
        id: "bad-e1", severity: "serious_harm",
        reportedImmediately: false, rootCauseIdentified: false,
        preventiveActionTaken: false, dutyOfCandourMet: false,
      }),
    ];
    const badAudits = [
      makeAudit({
        overallCompliance: "non_compliant",
        temperatureMonitored: false, temperatureInRange: false,
        expiryDatesChecked: false, expiredMedicationFound: true,
        marChartAccurate: false,
      }),
    ];
    const badTraining = [
      makeTraining({
        trainingStatus: "not_completed",
        competencyAssessed: false, controlledDrugsTraining: false,
        errorReportingTraining: false,
      }),
    ];

    const result = generateMedicationErrorPreventionIntelligence(
      badAdmins, badErrors, badAudits, badTraining,
      HOME_ID, PERIOD_START, PERIOD_END,
    );

    expect(result.overallScore).toBeLessThan(10);
    expect(result.rating).toBe("inadequate");
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.actions.length).toBeGreaterThan(0);
    expect(result.actions).toEqual(
      expect.arrayContaining([
        expect.stringContaining("URGENT"),
      ]),
    );
  });

  it("rating thresholds work correctly", () => {
    const result = generateMedicationErrorPreventionIntelligence(
      demoAdministrations, demoErrors, demoAudits, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END,
    );

    if (result.overallScore >= 80) expect(result.rating).toBe("outstanding");
    else if (result.overallScore >= 60) expect(result.rating).toBe("good");
    else if (result.overallScore >= 40) expect(result.rating).toBe("requires_improvement");
    else expect(result.rating).toBe("inadequate");
  });

  it("builds child profiles sorted by lowest score first", () => {
    const result = generateMedicationErrorPreventionIntelligence(
      demoAdministrations, demoErrors, demoAudits, demoTraining,
      HOME_ID, PERIOD_START, PERIOD_END,
    );

    expect(result.childProfiles.length).toBe(3);
    for (let i = 0; i < result.childProfiles.length - 1; i++) {
      expect(result.childProfiles[i].overallScore).toBeLessThanOrEqual(
        result.childProfiles[i + 1].overallScore,
      );
    }
  });
});
