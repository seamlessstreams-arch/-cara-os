import { describe, it, expect } from "vitest";
import {
  generateMedicationAdherenceMonitoringIntelligence,
  evaluateAdministrationQuality,
  evaluateMedicationSafety,
  evaluateMedicationPolicy,
  evaluateStaffMedicationReadiness,
  buildChildMedicationProfiles,
  pct,
  getRating,
  getMedicationTypeLabel,
  getAdministrationOutcomeLabel,
  getRatingLabel,
} from "../medication-adherence-monitoring-engine";
import type {
  MedicationRecord,
  MedicationPolicy,
  StaffMedicationTraining,
} from "../medication-adherence-monitoring-engine";

// -- Factory Functions --------------------------------------------------------

function makeRecord(overrides: Partial<MedicationRecord> = {}): MedicationRecord {
  return {
    id: "mr-1",
    childId: "child-alex",
    childName: "Alex",
    administrationDate: "2026-05-01",
    medicationType: "prescribed_regular",
    administrationOutcome: "administered_correctly",
    twoStaffWitnessed: true,
    consentObtained: true,
    sideEffectsMonitored: true,
    documentedImmediately: true,
    storageCorrect: true,
    reviewDue: "2026-09-01",
    ...overrides,
  };
}

function makePolicy(overrides: Partial<MedicationPolicy> = {}): MedicationPolicy {
  return {
    id: "pol-1",
    medicationAdministrationPolicy: true,
    controlledDrugsProtocol: true,
    consentFramework: true,
    errorReportingProcess: true,
    storageAuditSchedule: true,
    staffCompetencyCheck: true,
    regularReview: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffMedicationTraining> = {}): StaffMedicationTraining {
  return {
    id: "smt-1",
    staffId: "staff-1",
    staffName: "Staff A",
    medicationAdministration: true,
    controlledDrugs: true,
    errorReporting: true,
    consentPractice: true,
    sideEffectRecognition: true,
    storageCompliance: true,
    ...overrides,
  };
}

// -- pct ----------------------------------------------------------------------

describe("pct", () => {
  it("returns 0 for 0/0", () => {
    expect(pct(0, 0)).toBe(0);
  });

  it("calculates correctly", () => {
    expect(pct(3, 4)).toBe(75);
  });

  it("rounds", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("returns 100 for full", () => {
    expect(pct(5, 5)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(1, 2)).toBe(50);
  });

  it("returns 0 for 0 numerator", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("handles large numbers", () => {
    expect(pct(999, 1000)).toBe(100);
  });
});

// -- getRating ----------------------------------------------------------------

describe("getRating", () => {
  it("outstanding >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("good >= 60", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("requires_improvement >= 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("inadequate < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });
});

// -- Label functions ----------------------------------------------------------

describe("label functions", () => {
  it("medication type labels", () => {
    expect(getMedicationTypeLabel("prescribed_regular")).toBe("Prescribed Regular");
    expect(getMedicationTypeLabel("prescribed_prn")).toBe("Prescribed PRN");
    expect(getMedicationTypeLabel("over_counter")).toBe("Over the Counter");
    expect(getMedicationTypeLabel("supplement")).toBe("Supplement");
    expect(getMedicationTypeLabel("controlled")).toBe("Controlled Drug");
    expect(getMedicationTypeLabel("topical")).toBe("Topical");
    expect(getMedicationTypeLabel("inhaler")).toBe("Inhaler");
    expect(getMedicationTypeLabel("injection")).toBe("Injection");
  });

  it("administration outcome labels", () => {
    expect(getAdministrationOutcomeLabel("administered_correctly")).toBe("Administered Correctly");
    expect(getAdministrationOutcomeLabel("refused")).toBe("Refused");
    expect(getAdministrationOutcomeLabel("missed")).toBe("Missed");
    expect(getAdministrationOutcomeLabel("delayed")).toBe("Delayed");
    expect(getAdministrationOutcomeLabel("error")).toBe("Error");
  });

  it("rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- evaluateAdministrationQuality --------------------------------------------

describe("evaluateAdministrationQuality", () => {
  it("returns 0 for empty records", () => {
    const result = evaluateAdministrationQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.correctAdministrationRate).toBe(0);
    expect(result.twoStaffWitnessedRate).toBe(0);
    expect(result.documentedImmediatelyRate).toBe(0);
    expect(result.consentObtainedRate).toBe(0);
    expect(result.sideEffectsMonitoredRate).toBe(0);
  });

  it("scores high for perfect records", () => {
    const records = [makeRecord(), makeRecord({ id: "mr-2" }), makeRecord({ id: "mr-3" })];
    const result = evaluateAdministrationQuality(records);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.correctAdministrationRate).toBe(100);
    expect(result.twoStaffWitnessedRate).toBe(100);
    expect(result.documentedImmediatelyRate).toBe(100);
    expect(result.consentObtainedRate).toBe(100);
    expect(result.sideEffectsMonitoredRate).toBe(100);
  });

  it("scores 0 for all-bad records", () => {
    const records = [
      makeRecord({
        administrationOutcome: "error",
        twoStaffWitnessed: false,
        consentObtained: false,
        sideEffectsMonitored: false,
        documentedImmediately: false,
      }),
    ];
    const result = evaluateAdministrationQuality(records);
    expect(result.overallScore).toBe(0);
    expect(result.correctAdministrationRate).toBe(0);
    expect(result.twoStaffWitnessedRate).toBe(0);
    expect(result.documentedImmediatelyRate).toBe(0);
  });

  it("calculates partial rates correctly", () => {
    const records = [
      makeRecord({ id: "mr-1", administrationOutcome: "administered_correctly" }),
      makeRecord({ id: "mr-2", administrationOutcome: "refused" }),
    ];
    const result = evaluateAdministrationQuality(records);
    expect(result.correctAdministrationRate).toBe(50);
    expect(result.totalRecords).toBe(2);
  });

  it("handles mixed consent and side effects", () => {
    const records = [
      makeRecord({ id: "mr-1", consentObtained: true, sideEffectsMonitored: false }),
      makeRecord({ id: "mr-2", consentObtained: false, sideEffectsMonitored: true }),
    ];
    const result = evaluateAdministrationQuality(records);
    expect(result.consentObtainedRate).toBe(50);
    expect(result.sideEffectsMonitoredRate).toBe(50);
  });

  it("calculates two-staff witnessed rate", () => {
    const records = [
      makeRecord({ id: "mr-1", twoStaffWitnessed: true }),
      makeRecord({ id: "mr-2", twoStaffWitnessed: true }),
      makeRecord({ id: "mr-3", twoStaffWitnessed: false }),
    ];
    const result = evaluateAdministrationQuality(records);
    expect(result.twoStaffWitnessedRate).toBe(67);
  });

  it("calculates documented immediately rate", () => {
    const records = [
      makeRecord({ id: "mr-1", documentedImmediately: true }),
      makeRecord({ id: "mr-2", documentedImmediately: false }),
      makeRecord({ id: "mr-3", documentedImmediately: false }),
      makeRecord({ id: "mr-4", documentedImmediately: true }),
    ];
    const result = evaluateAdministrationQuality(records);
    expect(result.documentedImmediatelyRate).toBe(50);
  });

  it("score capped at 25", () => {
    const result = evaluateAdministrationQuality([makeRecord()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score never negative", () => {
    const result = evaluateAdministrationQuality([
      makeRecord({
        administrationOutcome: "error",
        twoStaffWitnessed: false,
        consentObtained: false,
        sideEffectsMonitored: false,
        documentedImmediately: false,
      }),
    ]);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("handles single perfect record", () => {
    const result = evaluateAdministrationQuality([makeRecord()]);
    expect(result.overallScore).toBe(25);
    expect(result.totalRecords).toBe(1);
  });

  it("handles delayed outcome as not-correct", () => {
    const records = [makeRecord({ administrationOutcome: "delayed" })];
    const result = evaluateAdministrationQuality(records);
    expect(result.correctAdministrationRate).toBe(0);
  });

  it("handles refused outcome", () => {
    const records = [makeRecord({ administrationOutcome: "refused" })];
    const result = evaluateAdministrationQuality(records);
    expect(result.correctAdministrationRate).toBe(0);
  });

  it("handles missed outcome as not-correct", () => {
    const records = [makeRecord({ administrationOutcome: "missed" })];
    const result = evaluateAdministrationQuality(records);
    expect(result.correctAdministrationRate).toBe(0);
  });
});

// -- evaluateMedicationSafety -------------------------------------------------

describe("evaluateMedicationSafety", () => {
  it("returns 25 for empty records (ABSENCE pattern)", () => {
    const result = evaluateMedicationSafety([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalRecords).toBe(0);
    expect(result.errorRate).toBe(0);
    expect(result.storageCorrectRate).toBe(0);
    expect(result.reviewComplianceRate).toBe(0);
  });

  it("scores high for safe records", () => {
    const records = [makeRecord(), makeRecord({ id: "mr-2" })];
    const result = evaluateMedicationSafety(records);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.errorRate).toBe(0);
    expect(result.storageCorrectRate).toBe(100);
  });

  it("counts error and missed as errors", () => {
    const records = [
      makeRecord({ id: "mr-1", administrationOutcome: "error" }),
      makeRecord({ id: "mr-2", administrationOutcome: "missed" }),
      makeRecord({ id: "mr-3", administrationOutcome: "administered_correctly" }),
      makeRecord({ id: "mr-4", administrationOutcome: "administered_correctly" }),
    ];
    const result = evaluateMedicationSafety(records);
    expect(result.errorRate).toBe(50);
  });

  it("does not count refused as error", () => {
    const records = [
      makeRecord({ id: "mr-1", administrationOutcome: "refused" }),
      makeRecord({ id: "mr-2", administrationOutcome: "administered_correctly" }),
    ];
    const result = evaluateMedicationSafety(records);
    expect(result.errorRate).toBe(0);
  });

  it("does not count delayed as error", () => {
    const records = [
      makeRecord({ id: "mr-1", administrationOutcome: "delayed" }),
      makeRecord({ id: "mr-2", administrationOutcome: "administered_correctly" }),
    ];
    const result = evaluateMedicationSafety(records);
    expect(result.errorRate).toBe(0);
  });

  it("calculates storage correct rate", () => {
    const records = [
      makeRecord({ id: "mr-1", storageCorrect: true }),
      makeRecord({ id: "mr-2", storageCorrect: true }),
      makeRecord({ id: "mr-3", storageCorrect: false }),
    ];
    const result = evaluateMedicationSafety(records);
    expect(result.storageCorrectRate).toBe(67);
  });

  it("calculates review compliance rate", () => {
    const records = [
      makeRecord({ id: "mr-1", administrationDate: "2026-05-01", reviewDue: "2026-09-01" }),
      makeRecord({ id: "mr-2", administrationDate: "2026-05-01", reviewDue: "2026-04-01" }),
    ];
    const result = evaluateMedicationSafety(records);
    expect(result.reviewComplianceRate).toBe(50);
  });

  it("scores low for high error rate", () => {
    const records = [
      makeRecord({ id: "mr-1", administrationOutcome: "error", storageCorrect: false }),
      makeRecord({ id: "mr-2", administrationOutcome: "missed", storageCorrect: false }),
    ];
    const result = evaluateMedicationSafety(records);
    expect(result.errorRate).toBe(100);
    expect(result.overallScore).toBeLessThan(10);
  });

  it("score capped at 25", () => {
    const result = evaluateMedicationSafety([makeRecord()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score never negative", () => {
    const records = [
      makeRecord({
        administrationOutcome: "error",
        storageCorrect: false,
        administrationDate: "2026-09-01",
        reviewDue: "2026-01-01",
      }),
    ];
    const result = evaluateMedicationSafety(records);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("returns correct totalRecords", () => {
    const records = [makeRecord({ id: "mr-1" }), makeRecord({ id: "mr-2" }), makeRecord({ id: "mr-3" })];
    const result = evaluateMedicationSafety(records);
    expect(result.totalRecords).toBe(3);
  });

  it("100% error rate gives minimal error-inverted score", () => {
    const records = [makeRecord({ administrationOutcome: "error" })];
    const result = evaluateMedicationSafety(records);
    expect(result.errorRate).toBe(100);
    // 9 * (100-100)/100 = 0
  });

  it("0% error rate gives maximum error-inverted score component", () => {
    const records = [makeRecord({ administrationOutcome: "administered_correctly" })];
    const result = evaluateMedicationSafety(records);
    expect(result.errorRate).toBe(0);
    // 9 * (100-0)/100 = 9
  });
});

// -- evaluateMedicationPolicy -------------------------------------------------

describe("evaluateMedicationPolicy", () => {
  it("returns 0 for null policy", () => {
    const result = evaluateMedicationPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.medicationAdministrationPolicy).toBe(false);
    expect(result.controlledDrugsProtocol).toBe(false);
    expect(result.consentFramework).toBe(false);
    expect(result.errorReportingProcess).toBe(false);
    expect(result.storageAuditSchedule).toBe(false);
    expect(result.staffCompetencyCheck).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("scores 25 for complete policy", () => {
    const result = evaluateMedicationPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("weights medicationAdministrationPolicy as 4", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationAdministrationPolicy: true,
      controlledDrugsProtocol: false,
      consentFramework: false,
      errorReportingProcess: false,
      storageAuditSchedule: false,
      staffCompetencyCheck: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("weights controlledDrugsProtocol as 4", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationAdministrationPolicy: false,
      controlledDrugsProtocol: true,
      consentFramework: false,
      errorReportingProcess: false,
      storageAuditSchedule: false,
      staffCompetencyCheck: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("weights consentFramework as 4", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationAdministrationPolicy: false,
      controlledDrugsProtocol: false,
      consentFramework: true,
      errorReportingProcess: false,
      storageAuditSchedule: false,
      staffCompetencyCheck: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("weights errorReportingProcess as 4", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationAdministrationPolicy: false,
      controlledDrugsProtocol: false,
      consentFramework: false,
      errorReportingProcess: true,
      storageAuditSchedule: false,
      staffCompetencyCheck: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("weights storageAuditSchedule as 3", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationAdministrationPolicy: false,
      controlledDrugsProtocol: false,
      consentFramework: false,
      errorReportingProcess: false,
      storageAuditSchedule: true,
      staffCompetencyCheck: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(3);
  });

  it("weights staffCompetencyCheck as 3", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationAdministrationPolicy: false,
      controlledDrugsProtocol: false,
      consentFramework: false,
      errorReportingProcess: false,
      storageAuditSchedule: false,
      staffCompetencyCheck: true,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(3);
  });

  it("weights regularReview as 3", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationAdministrationPolicy: false,
      controlledDrugsProtocol: false,
      consentFramework: false,
      errorReportingProcess: false,
      storageAuditSchedule: false,
      staffCompetencyCheck: false,
      regularReview: true,
    }));
    expect(result.overallScore).toBe(3);
  });

  it("all 4-weighted items total 16", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationAdministrationPolicy: true,
      controlledDrugsProtocol: true,
      consentFramework: true,
      errorReportingProcess: true,
      storageAuditSchedule: false,
      staffCompetencyCheck: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(16);
  });

  it("all 3-weighted items total 9", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationAdministrationPolicy: false,
      controlledDrugsProtocol: false,
      consentFramework: false,
      errorReportingProcess: false,
      storageAuditSchedule: true,
      staffCompetencyCheck: true,
      regularReview: true,
    }));
    expect(result.overallScore).toBe(9);
  });

  it("reflects boolean values in result", () => {
    const policy = makePolicy({
      medicationAdministrationPolicy: true,
      controlledDrugsProtocol: false,
      regularReview: true,
    });
    const result = evaluateMedicationPolicy(policy);
    expect(result.medicationAdministrationPolicy).toBe(true);
    expect(result.controlledDrugsProtocol).toBe(false);
    expect(result.regularReview).toBe(true);
  });

  it("score capped at 25", () => {
    const result = evaluateMedicationPolicy(makePolicy());
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("all false yields 0", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationAdministrationPolicy: false,
      controlledDrugsProtocol: false,
      consentFramework: false,
      errorReportingProcess: false,
      storageAuditSchedule: false,
      staffCompetencyCheck: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(0);
  });
});

// -- evaluateStaffMedicationReadiness -----------------------------------------

describe("evaluateStaffMedicationReadiness", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffMedicationReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.medicationAdministrationRate).toBe(0);
    expect(result.controlledDrugsRate).toBe(0);
    expect(result.errorReportingRate).toBe(0);
    expect(result.consentPracticeRate).toBe(0);
    expect(result.sideEffectRecognitionRate).toBe(0);
    expect(result.storageComplianceRate).toBe(0);
  });

  it("scores high for fully trained staff", () => {
    const training = [makeTraining(), makeTraining({ id: "smt-2", staffId: "staff-2", staffName: "Staff B" })];
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.medicationAdministrationRate).toBe(100);
    expect(result.controlledDrugsRate).toBe(100);
    expect(result.errorReportingRate).toBe(100);
  });

  it("scores 0 for fully untrained staff", () => {
    const training = [
      makeTraining({
        medicationAdministration: false,
        controlledDrugs: false,
        errorReporting: false,
        consentPractice: false,
        sideEffectRecognition: false,
        storageCompliance: false,
      }),
    ];
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("calculates partial training rates", () => {
    const training = [
      makeTraining({ id: "smt-1", staffId: "s1" }),
      makeTraining({ id: "smt-2", staffId: "s2", medicationAdministration: false, controlledDrugs: false }),
    ];
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.medicationAdministrationRate).toBe(50);
    expect(result.controlledDrugsRate).toBe(50);
  });

  it("tracks error reporting rate", () => {
    const training = [
      makeTraining({ id: "smt-1", staffId: "s1", errorReporting: true }),
      makeTraining({ id: "smt-2", staffId: "s2", errorReporting: false }),
      makeTraining({ id: "smt-3", staffId: "s3", errorReporting: false }),
    ];
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.errorReportingRate).toBe(33);
  });

  it("tracks consent practice rate", () => {
    const training = [
      makeTraining({ id: "smt-1", staffId: "s1", consentPractice: true }),
      makeTraining({ id: "smt-2", staffId: "s2", consentPractice: true }),
      makeTraining({ id: "smt-3", staffId: "s3", consentPractice: false }),
      makeTraining({ id: "smt-4", staffId: "s4", consentPractice: false }),
    ];
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.consentPracticeRate).toBe(50);
  });

  it("tracks side effect recognition rate", () => {
    const training = [
      makeTraining({ id: "smt-1", staffId: "s1", sideEffectRecognition: true }),
      makeTraining({ id: "smt-2", staffId: "s2", sideEffectRecognition: false }),
    ];
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.sideEffectRecognitionRate).toBe(50);
  });

  it("tracks storage compliance rate", () => {
    const training = [
      makeTraining({ id: "smt-1", staffId: "s1", storageCompliance: true }),
      makeTraining({ id: "smt-2", staffId: "s2", storageCompliance: true }),
      makeTraining({ id: "smt-3", staffId: "s3", storageCompliance: true }),
    ];
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.storageComplianceRate).toBe(100);
  });

  it("score capped at 25", () => {
    const result = evaluateStaffMedicationReadiness([makeTraining()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("returns correct totalStaff", () => {
    const training = [
      makeTraining({ id: "smt-1", staffId: "s1" }),
      makeTraining({ id: "smt-2", staffId: "s2" }),
      makeTraining({ id: "smt-3", staffId: "s3" }),
    ];
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.totalStaff).toBe(3);
  });

  it("handles single fully trained staff", () => {
    const result = evaluateStaffMedicationReadiness([makeTraining()]);
    expect(result.overallScore).toBe(25);
  });

  it("weights medicationAdministration as 6", () => {
    const training = [
      makeTraining({
        medicationAdministration: true,
        controlledDrugs: false,
        errorReporting: false,
        consentPractice: false,
        sideEffectRecognition: false,
        storageCompliance: false,
      }),
    ];
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.overallScore).toBe(6);
  });

  it("weights controlledDrugs as 5", () => {
    const training = [
      makeTraining({
        medicationAdministration: false,
        controlledDrugs: true,
        errorReporting: false,
        consentPractice: false,
        sideEffectRecognition: false,
        storageCompliance: false,
      }),
    ];
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.overallScore).toBe(5);
  });

  it("weights errorReporting as 5", () => {
    const training = [
      makeTraining({
        medicationAdministration: false,
        controlledDrugs: false,
        errorReporting: true,
        consentPractice: false,
        sideEffectRecognition: false,
        storageCompliance: false,
      }),
    ];
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.overallScore).toBe(5);
  });

  it("weights consentPractice as 4", () => {
    const training = [
      makeTraining({
        medicationAdministration: false,
        controlledDrugs: false,
        errorReporting: false,
        consentPractice: true,
        sideEffectRecognition: false,
        storageCompliance: false,
      }),
    ];
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.overallScore).toBe(4);
  });

  it("weights sideEffectRecognition as 3", () => {
    const training = [
      makeTraining({
        medicationAdministration: false,
        controlledDrugs: false,
        errorReporting: false,
        consentPractice: false,
        sideEffectRecognition: true,
        storageCompliance: false,
      }),
    ];
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.overallScore).toBe(3);
  });

  it("weights storageCompliance as 2", () => {
    const training = [
      makeTraining({
        medicationAdministration: false,
        controlledDrugs: false,
        errorReporting: false,
        consentPractice: false,
        sideEffectRecognition: false,
        storageCompliance: true,
      }),
    ];
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.overallScore).toBe(2);
  });
});

// -- buildChildMedicationProfiles ---------------------------------------------

describe("buildChildMedicationProfiles", () => {
  it("returns empty for no records", () => {
    expect(buildChildMedicationProfiles([])).toEqual([]);
  });

  it("groups records by childId", () => {
    const records = [
      makeRecord({ id: "mr-1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "mr-2", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "mr-3", childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildMedicationProfiles(records);
    expect(profiles).toHaveLength(2);
  });

  it("counts total records per child", () => {
    const records = [
      makeRecord({ id: "mr-1", childId: "child-alex" }),
      makeRecord({ id: "mr-2", childId: "child-alex" }),
      makeRecord({ id: "mr-3", childId: "child-alex" }),
    ];
    const profiles = buildChildMedicationProfiles(records);
    expect(profiles[0].totalRecords).toBe(3);
  });

  it("calculates correct administration rate per child", () => {
    const records = [
      makeRecord({ id: "mr-1", childId: "child-alex", administrationOutcome: "administered_correctly" }),
      makeRecord({ id: "mr-2", childId: "child-alex", administrationOutcome: "refused" }),
    ];
    const profiles = buildChildMedicationProfiles(records);
    expect(profiles[0].correctAdministrationRate).toBe(50);
  });

  it("calculates documented immediately rate per child", () => {
    const records = [
      makeRecord({ id: "mr-1", childId: "child-alex", documentedImmediately: true }),
      makeRecord({ id: "mr-2", childId: "child-alex", documentedImmediately: false }),
      makeRecord({ id: "mr-3", childId: "child-alex", documentedImmediately: true }),
    ];
    const profiles = buildChildMedicationProfiles(records);
    expect(profiles[0].documentedImmediatelyRate).toBe(67);
  });

  it("calculates error rate per child", () => {
    const records = [
      makeRecord({ id: "mr-1", childId: "child-alex", administrationOutcome: "error" }),
      makeRecord({ id: "mr-2", childId: "child-alex", administrationOutcome: "administered_correctly" }),
      makeRecord({ id: "mr-3", childId: "child-alex", administrationOutcome: "missed" }),
      makeRecord({ id: "mr-4", childId: "child-alex", administrationOutcome: "administered_correctly" }),
    ];
    const profiles = buildChildMedicationProfiles(records);
    expect(profiles[0].errorRate).toBe(50);
  });

  it("gives frequency score 2 for >= 10 records", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `mr-${i}`, childId: "child-alex" }),
    );
    const profiles = buildChildMedicationProfiles(records);
    // 10 records -> frequency 2, correct 100% -> 3, documented 100% -> 3, safety (0% error) -> 2 = 10
    expect(profiles[0].overallScore).toBe(10);
  });

  it("gives frequency score 1 for >= 5 records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `mr-${i}`, childId: "child-alex" }),
    );
    const profiles = buildChildMedicationProfiles(records);
    // 5 records -> frequency 1, correct 3, documented 3, safety 2 = 9
    expect(profiles[0].overallScore).toBe(9);
  });

  it("gives frequency score 0 for < 5 records", () => {
    const records = [
      makeRecord({ id: "mr-1", childId: "child-alex" }),
      makeRecord({ id: "mr-2", childId: "child-alex" }),
    ];
    const profiles = buildChildMedicationProfiles(records);
    // 2 records -> frequency 0, correct 3, documented 3, safety 2 = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("score capped at 10", () => {
    const records = Array.from({ length: 15 }, (_, i) =>
      makeRecord({ id: `mr-${i}`, childId: "child-alex" }),
    );
    const profiles = buildChildMedicationProfiles(records);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("gives low score for poor records", () => {
    const records = [
      makeRecord({
        id: "mr-1",
        childId: "child-alex",
        administrationOutcome: "error",
        documentedImmediately: false,
      }),
    ];
    const profiles = buildChildMedicationProfiles(records);
    // frequency 0, correct 0, documented 0, safety 0 (100% error -> 2*(100-100)/100=0)
    expect(profiles[0].overallScore).toBe(0);
  });

  it("preserves child name", () => {
    const records = [makeRecord({ childId: "child-alex", childName: "Alex" })];
    const profiles = buildChildMedicationProfiles(records);
    expect(profiles[0].childName).toBe("Alex");
  });

  it("preserves child id", () => {
    const records = [makeRecord({ childId: "child-jordan" })];
    const profiles = buildChildMedicationProfiles(records);
    expect(profiles[0].childId).toBe("child-jordan");
  });
});

// -- generateMedicationAdherenceMonitoringIntelligence -------------------------

describe("generateMedicationAdherenceMonitoringIntelligence", () => {
  it("assembles all four evaluator scores", () => {
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [makeRecord()], makePolicy(), [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBe(
      result.administrationQuality.overallScore +
      result.medicationSafety.overallScore +
      result.medicationPolicy.overallScore +
      result.staffMedicationReadiness.overallScore,
    );
  });

  it("returns inadequate with no data except safety absence", () => {
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    // admin=0, safety=25 (absence), policy=0 (null), staff=0 = 25
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("inadequate");
  });

  it("returns outstanding for fully compliant home", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `mr-${i}` }));
    const policy = makePolicy();
    const training = [
      makeTraining({ id: "smt-1", staffId: "s1", staffName: "Staff A" }),
      makeTraining({ id: "smt-2", staffId: "s2", staffName: "Staff B" }),
    ];
    const result = generateMedicationAdherenceMonitoringIntelligence(
      records, policy, training,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("score capped at 100", () => {
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [makeRecord()], makePolicy(), [makeTraining()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("populates homeId and period", () => {
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
  });

  it("builds child medication profiles", () => {
    const records = [
      makeRecord({ id: "mr-1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "mr-2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generateMedicationAdherenceMonitoringIntelligence(
      records, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childMedicationProfiles).toHaveLength(2);
  });

  // -- Strengths --

  it("adds strength for correct administration >= 80%", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `mr-${i}` }));
    const result = generateMedicationAdherenceMonitoringIntelligence(
      records, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("correct administration"))).toBe(true);
  });

  it("adds strength for documented immediately >= 80%", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `mr-${i}` }));
    const result = generateMedicationAdherenceMonitoringIntelligence(
      records, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("documentation practice"))).toBe(true);
  });

  it("adds strength for two-staff witnessed >= 80%", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `mr-${i}` }));
    const result = generateMedicationAdherenceMonitoringIntelligence(
      records, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("dual verification"))).toBe(true);
  });

  it("adds strength for comprehensive policy", () => {
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], makePolicy(), [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("policy framework"))).toBe(true);
  });

  it("adds strength for all staff trained in medication admin", () => {
    const training = [makeTraining()];
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], null, training, "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("All staff trained"))).toBe(true);
  });

  it("adds strength for high storage compliance", () => {
    const records = Array.from({ length: 5 }, (_, i) => makeRecord({ id: `mr-${i}` }));
    const result = generateMedicationAdherenceMonitoringIntelligence(
      records, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("storage compliance"))).toBe(true);
  });

  it("does not add strength for correct admin below 80%", () => {
    const records = [
      makeRecord({ id: "mr-1", administrationOutcome: "administered_correctly" }),
      makeRecord({ id: "mr-2", administrationOutcome: "refused" }),
      makeRecord({ id: "mr-3", administrationOutcome: "refused" }),
      makeRecord({ id: "mr-4", administrationOutcome: "refused" }),
    ];
    const result = generateMedicationAdherenceMonitoringIntelligence(
      records, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("correct administration"))).toBe(false);
  });

  // -- Areas for Improvement --

  it("adds area for correct admin < 60%", () => {
    const records = [
      makeRecord({ id: "mr-1", administrationOutcome: "refused" }),
      makeRecord({ id: "mr-2", administrationOutcome: "missed" }),
      makeRecord({ id: "mr-3", administrationOutcome: "administered_correctly" }),
    ];
    const result = generateMedicationAdherenceMonitoringIntelligence(
      records, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Correct administration rate"))).toBe(true);
  });

  it("adds area for error rate > 10%", () => {
    const records = [
      makeRecord({ id: "mr-1", administrationOutcome: "error" }),
      makeRecord({ id: "mr-2", administrationOutcome: "administered_correctly" }),
      makeRecord({ id: "mr-3", administrationOutcome: "administered_correctly" }),
    ];
    const result = generateMedicationAdherenceMonitoringIntelligence(
      records, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("error rate"))).toBe(true);
  });

  it("no area for error rate at exactly 10%", () => {
    // 1 error out of 10 = 10%
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `mr-${i}`,
        administrationOutcome: i === 0 ? "error" : "administered_correctly",
      }),
    );
    const result = generateMedicationAdherenceMonitoringIntelligence(
      records, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("error rate"))).toBe(false);
  });

  it("adds area for low controlled drugs training", () => {
    const training = [
      makeTraining({ id: "smt-1", staffId: "s1", controlledDrugs: false }),
      makeTraining({ id: "smt-2", staffId: "s2", controlledDrugs: false }),
      makeTraining({ id: "smt-3", staffId: "s3", controlledDrugs: true }),
      makeTraining({ id: "smt-4", staffId: "s4", controlledDrugs: true }),
    ];
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], null, training, "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Controlled drugs training"))).toBe(true);
  });

  // -- Actions --

  it("adds action for no records (not urgent)", () => {
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    const noRecordAction = result.actions.find((a) => a.includes("Begin recording"));
    expect(noRecordAction).toBeDefined();
    expect(noRecordAction!.startsWith("URGENT")).toBe(false);
  });

  it("adds URGENT for no policy", () => {
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("adds URGENT for no training", () => {
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });

  it("adds action for low correct admin", () => {
    const records = [
      makeRecord({ id: "mr-1", administrationOutcome: "refused" }),
      makeRecord({ id: "mr-2", administrationOutcome: "missed" }),
    ];
    const result = generateMedicationAdherenceMonitoringIntelligence(
      records, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("administration procedures"))).toBe(true);
  });

  it("adds action for high error rate", () => {
    const records = [
      makeRecord({ id: "mr-1", administrationOutcome: "error" }),
      makeRecord({ id: "mr-2", administrationOutcome: "administered_correctly" }),
      makeRecord({ id: "mr-3", administrationOutcome: "administered_correctly" }),
    ];
    const result = generateMedicationAdherenceMonitoringIntelligence(
      records, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("Investigate medication errors"))).toBe(true);
  });

  it("adds action for missing controlled drugs protocol", () => {
    const policy = makePolicy({ controlledDrugsProtocol: false });
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], policy, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("controlled drugs protocol"))).toBe(true);
  });

  it("adds action for low review compliance", () => {
    const records = [
      makeRecord({ id: "mr-1", administrationDate: "2026-09-01", reviewDue: "2026-01-01" }),
      makeRecord({ id: "mr-2", administrationDate: "2026-09-01", reviewDue: "2026-01-01" }),
    ];
    const result = generateMedicationAdherenceMonitoringIntelligence(
      records, null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("Schedule medication reviews"))).toBe(true);
  });

  it("no URGENT for policy when policy provided", () => {
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], makePolicy(), [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(false);
  });

  it("no URGENT for training when training provided", () => {
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], null, [makeTraining()], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(false);
  });

  // -- Regulatory links --

  it("includes all 7 regulatory links", () => {
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("includes CHR 2015 Regulation 10", () => {
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 10"))).toBe(true);
  });

  it("includes CHR 2015 Regulation 12", () => {
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 12"))).toBe(true);
  });

  it("includes SCCIF", () => {
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes NMS 6", () => {
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 6"))).toBe(true);
  });

  it("includes Children Act 1989", () => {
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("includes Misuse of Drugs Act 1971", () => {
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Misuse of Drugs Act 1971"))).toBe(true);
  });

  it("includes NICE NG46", () => {
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("NICE NG46"))).toBe(true);
  });

  // -- Integration --

  it("handles realistic mixed scenario", () => {
    const records = [
      makeRecord({ id: "mr-1", childId: "child-alex", childName: "Alex", administrationOutcome: "administered_correctly" }),
      makeRecord({ id: "mr-2", childId: "child-alex", childName: "Alex", administrationOutcome: "administered_correctly" }),
      makeRecord({ id: "mr-3", childId: "child-alex", childName: "Alex", administrationOutcome: "refused" }),
      makeRecord({ id: "mr-4", childId: "child-jordan", childName: "Jordan", administrationOutcome: "administered_correctly" }),
      makeRecord({ id: "mr-5", childId: "child-jordan", childName: "Jordan", administrationOutcome: "administered_correctly" }),
      makeRecord({ id: "mr-6", childId: "child-morgan", childName: "Morgan", administrationOutcome: "administered_correctly" }),
      makeRecord({ id: "mr-7", childId: "child-morgan", childName: "Morgan", administrationOutcome: "delayed" }),
      makeRecord({ id: "mr-8", childId: "child-morgan", childName: "Morgan", administrationOutcome: "error", twoStaffWitnessed: false, documentedImmediately: false }),
    ];
    const policy = makePolicy();
    const training = [
      makeTraining({ id: "smt-1", staffId: "s1", staffName: "Sarah Johnson" }),
      makeTraining({ id: "smt-2", staffId: "s2", staffName: "Tom Richards" }),
      makeTraining({ id: "smt-3", staffId: "s3", staffName: "Lisa Williams" }),
      makeTraining({ id: "smt-4", staffId: "s4", staffName: "Darren Laville" }),
    ];
    const result = generateMedicationAdherenceMonitoringIntelligence(
      records, policy, training,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.rating).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.childMedicationProfiles).toHaveLength(3);
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("empty records does not produce URGENT no-records action", () => {
    const result = generateMedicationAdherenceMonitoringIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    const noRecordAction = result.actions.find((a) => a.includes("Begin recording"));
    expect(noRecordAction).toBeDefined();
    expect(noRecordAction!.startsWith("URGENT")).toBe(false);
  });

  it("full data produces no URGENT actions", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `mr-${i}` }));
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateMedicationAdherenceMonitoringIntelligence(
      records, policy, training,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    const urgentActions = result.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgentActions).toHaveLength(0);
  });

  it("only good records but no policy or training is not outstanding", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `mr-${i}` }));
    const result = generateMedicationAdherenceMonitoringIntelligence(
      records, null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.rating).not.toBe("outstanding");
  });

  it("returns correct rating for score exactly 80", () => {
    // This is a mathematical boundary test
    expect(getRating(80)).toBe("outstanding");
  });

  it("returns correct rating for score exactly 60", () => {
    expect(getRating(60)).toBe("good");
  });

  it("returns correct rating for score exactly 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
  });
});
