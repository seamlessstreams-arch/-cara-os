// ══════════════════════════════════════════════════════════════════════════════
// Medication Intelligence Engine v2.0 — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getMedicationCategoryLabel,
  getMedicationOutcomeLabel,
  getRatingLabel,
  evaluateMedicationQuality,
  evaluateMedicationCompliance,
  evaluateMedicationPolicy,
  evaluateStaffMedicationReadiness,
  buildChildMedicationProfiles,
  generateMedicationIntelligence,
} from "../medication-engine";
import type {
  MedicationRecord,
  MedicationPolicy,
  StaffMedicationTraining,
  MedicationCategory,
} from "../medication-engine";

// ── Factory Functions ─────────────────────────────────────────────────────

function makeRecord(overrides: Partial<MedicationRecord> = {}): MedicationRecord {
  return {
    id: "rec-001",
    homeId: "oak-house",
    date: "2026-03-15",
    childId: "child-alex",
    childName: "Alex",
    category: "regular_administration",
    outcome: "administered_correctly",
    administeredCorrectly: true,
    signedByTwoStaff: true,
    consentOnFile: true,
    errorReported: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<MedicationPolicy> = {}): MedicationPolicy {
  return {
    medicationPolicy: true,
    controlledDrugPolicy: true,
    administrationProcedure: true,
    consentFramework: true,
    errorReportingPolicy: true,
    storagePolicy: true,
    reviewSchedulePolicy: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffMedicationTraining> = {}): StaffMedicationTraining {
  return {
    staffId: "staff-sarah",
    medicationAdministration: true,
    controlledDrugHandling: true,
    errorReporting: true,
    consentProcess: true,
    storageChecks: true,
    medicationReview: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct helper
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when both are 0", () => {
    expect(pct(0, 0)).toBe(0);
  });

  it("calculates percentage correctly", () => {
    expect(pct(3, 4)).toBe(75);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("returns 100 for equal numerator and denominator", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });

  it("handles exact boundaries correctly", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(60)).toBe("good");
    expect(getRating(40)).toBe("requires_improvement");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label helpers
// ══════════════════════════════════════════════════════════════════════════════

describe("getMedicationCategoryLabel", () => {
  it("returns correct label for regular_administration", () => {
    expect(getMedicationCategoryLabel("regular_administration")).toBe("Regular Administration");
  });

  it("returns correct label for prn_administration", () => {
    expect(getMedicationCategoryLabel("prn_administration")).toBe("PRN Administration");
  });

  it("returns correct label for controlled_drug", () => {
    expect(getMedicationCategoryLabel("controlled_drug")).toBe("Controlled Drug");
  });

  it("returns correct label for medication_storage", () => {
    expect(getMedicationCategoryLabel("medication_storage")).toBe("Medication Storage");
  });

  it("returns correct labels for all remaining categories", () => {
    expect(getMedicationCategoryLabel("consent_review")).toBe("Consent Review");
    expect(getMedicationCategoryLabel("medication_error")).toBe("Medication Error");
    expect(getMedicationCategoryLabel("medication_review")).toBe("Medication Review");
    expect(getMedicationCategoryLabel("competency_assessment")).toBe("Competency Assessment");
  });
});

describe("getMedicationOutcomeLabel", () => {
  it("returns correct label for administered_correctly", () => {
    expect(getMedicationOutcomeLabel("administered_correctly")).toBe("Administered Correctly");
  });

  it("returns correct label for dose_refused", () => {
    expect(getMedicationOutcomeLabel("dose_refused")).toBe("Dose Refused");
  });

  it("returns correct labels for all remaining outcomes", () => {
    expect(getMedicationOutcomeLabel("error_identified")).toBe("Error Identified");
    expect(getMedicationOutcomeLabel("review_completed")).toBe("Review Completed");
    expect(getMedicationOutcomeLabel("not_applicable")).toBe("Not Applicable");
  });
});

describe("getRatingLabel", () => {
  it("returns correct label for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });

  it("returns correct label for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });

  it("returns correct labels for all ratings", () => {
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 1: Medication Quality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateMedicationQuality", () => {
  it("returns zeros for empty records (PRESENCE pattern)", () => {
    const result = evaluateMedicationQuality([]);
    expect(result.totalRecords).toBe(0);
    expect(result.administeredCorrectlyRate).toBe(0);
    expect(result.signedByTwoStaffRate).toBe(0);
    expect(result.consentOnFileRate).toBe(0);
    expect(result.errorReportedRate).toBe(0);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("scores max 25 for perfect records", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}` }),
    );
    const result = evaluateMedicationQuality(recs);
    expect(result.administeredCorrectlyRate).toBe(100);
    expect(result.signedByTwoStaffRate).toBe(100);
    expect(result.consentOnFileRate).toBe(100);
    expect(result.errorReportedRate).toBe(100);
    expect(result.overallScore).toBe(25);
  });

  it("calculates administeredCorrectlyRate accurately", () => {
    const recs = [
      makeRecord({ id: "r1", administeredCorrectly: true }),
      makeRecord({ id: "r2", administeredCorrectly: false }),
      makeRecord({ id: "r3", administeredCorrectly: true }),
      makeRecord({ id: "r4", administeredCorrectly: false }),
    ];
    const result = evaluateMedicationQuality(recs);
    expect(result.administeredCorrectlyRate).toBe(50);
  });

  it("calculates signedByTwoStaffRate accurately", () => {
    const recs = [
      makeRecord({ id: "r1", signedByTwoStaff: true }),
      makeRecord({ id: "r2", signedByTwoStaff: false }),
      makeRecord({ id: "r3", signedByTwoStaff: false }),
    ];
    const result = evaluateMedicationQuality(recs);
    expect(result.signedByTwoStaffRate).toBe(33);
  });

  it("applies correct weight of 7 to administeredCorrectlyRate", () => {
    // 1 record with only administeredCorrectly = true, everything else false
    const recs = [
      makeRecord({
        administeredCorrectly: true,
        signedByTwoStaff: false,
        consentOnFile: false,
        errorReported: false,
      }),
    ];
    const result = evaluateMedicationQuality(recs);
    expect(result.overallScore).toBe(7);
  });

  it("applies correct weight of 6 to signedByTwoStaffRate", () => {
    const recs = [
      makeRecord({
        administeredCorrectly: false,
        signedByTwoStaff: true,
        consentOnFile: false,
        errorReported: false,
      }),
    ];
    const result = evaluateMedicationQuality(recs);
    expect(result.overallScore).toBe(6);
  });

  it("applies correct weight of 6 to consentOnFileRate", () => {
    const recs = [
      makeRecord({
        administeredCorrectly: false,
        signedByTwoStaff: false,
        consentOnFile: true,
        errorReported: false,
      }),
    ];
    const result = evaluateMedicationQuality(recs);
    expect(result.overallScore).toBe(6);
  });

  it("applies correct weight of 6 to errorReportedRate", () => {
    const recs = [
      makeRecord({
        administeredCorrectly: false,
        signedByTwoStaff: false,
        consentOnFile: false,
        errorReported: true,
      }),
    ];
    const result = evaluateMedicationQuality(recs);
    expect(result.overallScore).toBe(6);
  });

  it("clamps score to 0-25 range", () => {
    const result = evaluateMedicationQuality([makeRecord()]);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("assigns rating based on score * 4", () => {
    const recs = [makeRecord()];
    const result = evaluateMedicationQuality(recs);
    // 25 * 4 = 100 >= 80 => outstanding
    expect(result.rating).toBe("outstanding");
  });

  it("handles mixed data correctly", () => {
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        administeredCorrectly: i < 7,
        signedByTwoStaff: i < 5,
        consentOnFile: i < 8,
        errorReported: i < 6,
      }),
    );
    const result = evaluateMedicationQuality(recs);
    expect(result.administeredCorrectlyRate).toBe(70);
    expect(result.signedByTwoStaffRate).toBe(50);
    expect(result.consentOnFileRate).toBe(80);
    expect(result.errorReportedRate).toBe(60);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 2: Medication Compliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateMedicationCompliance", () => {
  it("returns zeros for empty records (PRESENCE pattern)", () => {
    const result = evaluateMedicationCompliance([]);
    expect(result.documentationRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.signedByTwoStaffRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("scores high for perfect compliance with all 8 categories", () => {
    const cats: MedicationCategory[] = [
      "regular_administration", "prn_administration", "controlled_drug",
      "medication_storage", "consent_review", "medication_error",
      "medication_review", "competency_assessment",
    ];
    const recs = cats.map((cat, i) =>
      makeRecord({ id: `r-${i}`, category: cat }),
    );
    const result = evaluateMedicationCompliance(recs);
    expect(result.documentationRate).toBe(100);
    expect(result.timelyRecordingRate).toBe(100);
    expect(result.signedByTwoStaffRate).toBe(100);
    expect(result.categoryDiversityRatio).toBe(100);
    expect(result.overallScore).toBe(25);
  });

  it("calculates documentation rate accurately", () => {
    const recs = [
      makeRecord({ id: "r1", documentationComplete: true }),
      makeRecord({ id: "r2", documentationComplete: false }),
    ];
    const result = evaluateMedicationCompliance(recs);
    expect(result.documentationRate).toBe(50);
  });

  it("calculates timely recording rate accurately", () => {
    const recs = [
      makeRecord({ id: "r1", timelyRecording: true }),
      makeRecord({ id: "r2", timelyRecording: false }),
      makeRecord({ id: "r3", timelyRecording: true }),
    ];
    const result = evaluateMedicationCompliance(recs);
    expect(result.timelyRecordingRate).toBe(67);
  });

  it("calculates category diversity ratio correctly", () => {
    const recs = [
      makeRecord({ id: "r1", category: "regular_administration" }),
      makeRecord({ id: "r2", category: "controlled_drug" }),
      makeRecord({ id: "r3", category: "consent_review" }),
      makeRecord({ id: "r4", category: "medication_review" }),
    ];
    const result = evaluateMedicationCompliance(recs);
    // 4/8 = 50
    expect(result.categoryDiversityRatio).toBe(50);
  });

  it("applies correct weight of 8 to documentation rate", () => {
    const recs = [
      makeRecord({
        documentationComplete: true,
        timelyRecording: false,
        signedByTwoStaff: false,
        category: "regular_administration", // 1/8 categories -> 13%
      }),
    ];
    const result = evaluateMedicationCompliance(recs);
    // 8 + 0 + 0 + (13/100)*5 = 8 + 0.65 = 8.65 -> round = 9
    expect(result.overallScore).toBe(9);
  });

  it("applies correct weight of 7 to timely recording rate", () => {
    const recs = [
      makeRecord({
        documentationComplete: false,
        timelyRecording: true,
        signedByTwoStaff: false,
        category: "regular_administration",
      }),
    ];
    const result = evaluateMedicationCompliance(recs);
    // 0 + 7 + 0 + (13/100)*5 = 7 + 0.65 = 7.65 -> round = 8
    expect(result.overallScore).toBe(8);
  });

  it("clamps score to 0-25 range", () => {
    const result = evaluateMedicationCompliance([makeRecord()]);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles single category properly (low diversity)", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, category: "regular_administration" }),
    );
    const result = evaluateMedicationCompliance(recs);
    // 1/8 = 12.5 -> rounds to 13
    expect(result.categoryDiversityRatio).toBe(13);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 3: Medication Policy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateMedicationPolicy", () => {
  it("returns all false and score 0 for null policy", () => {
    const result = evaluateMedicationPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.medicationPolicy).toBe(false);
    expect(result.controlledDrugPolicy).toBe(false);
    expect(result.administrationProcedure).toBe(false);
    expect(result.consentFramework).toBe(false);
    expect(result.errorReportingPolicy).toBe(false);
    expect(result.storagePolicy).toBe(false);
    expect(result.reviewSchedulePolicy).toBe(false);
  });

  it("scores 25 for fully complete policy", () => {
    const result = evaluateMedicationPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("scores 0 for all-false policy", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationPolicy: false,
      controlledDrugPolicy: false,
      administrationProcedure: false,
      consentFramework: false,
      errorReportingPolicy: false,
      storagePolicy: false,
      reviewSchedulePolicy: false,
    }));
    expect(result.overallScore).toBe(0);
  });

  it("applies correct weight of 4 for medicationPolicy", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationPolicy: true,
      controlledDrugPolicy: false,
      administrationProcedure: false,
      consentFramework: false,
      errorReportingPolicy: false,
      storagePolicy: false,
      reviewSchedulePolicy: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("applies correct weight of 4 for controlledDrugPolicy", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationPolicy: false,
      controlledDrugPolicy: true,
      administrationProcedure: false,
      consentFramework: false,
      errorReportingPolicy: false,
      storagePolicy: false,
      reviewSchedulePolicy: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("applies correct weight of 4 for administrationProcedure", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationPolicy: false,
      controlledDrugPolicy: false,
      administrationProcedure: true,
      consentFramework: false,
      errorReportingPolicy: false,
      storagePolicy: false,
      reviewSchedulePolicy: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("applies correct weight of 4 for consentFramework", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationPolicy: false,
      controlledDrugPolicy: false,
      administrationProcedure: false,
      consentFramework: true,
      errorReportingPolicy: false,
      storagePolicy: false,
      reviewSchedulePolicy: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("applies correct weight of 3 for errorReportingPolicy", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationPolicy: false,
      controlledDrugPolicy: false,
      administrationProcedure: false,
      consentFramework: false,
      errorReportingPolicy: true,
      storagePolicy: false,
      reviewSchedulePolicy: false,
    }));
    expect(result.overallScore).toBe(3);
  });

  it("applies correct weight of 3 for storagePolicy", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationPolicy: false,
      controlledDrugPolicy: false,
      administrationProcedure: false,
      consentFramework: false,
      errorReportingPolicy: false,
      storagePolicy: true,
      reviewSchedulePolicy: false,
    }));
    expect(result.overallScore).toBe(3);
  });

  it("applies correct weight of 3 for reviewSchedulePolicy", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationPolicy: false,
      controlledDrugPolicy: false,
      administrationProcedure: false,
      consentFramework: false,
      errorReportingPolicy: false,
      storagePolicy: false,
      reviewSchedulePolicy: true,
    }));
    expect(result.overallScore).toBe(3);
  });

  it("sums first 4 at 4 points correctly = 16", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationPolicy: true,
      controlledDrugPolicy: true,
      administrationProcedure: true,
      consentFramework: true,
      errorReportingPolicy: false,
      storagePolicy: false,
      reviewSchedulePolicy: false,
    }));
    expect(result.overallScore).toBe(16);
  });

  it("sums last 3 at 3 points correctly = 9", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationPolicy: false,
      controlledDrugPolicy: false,
      administrationProcedure: false,
      consentFramework: false,
      errorReportingPolicy: true,
      storagePolicy: true,
      reviewSchedulePolicy: true,
    }));
    expect(result.overallScore).toBe(9);
  });

  it("reflects policy booleans in result", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationPolicy: true,
      controlledDrugPolicy: false,
      storagePolicy: true,
    }));
    expect(result.medicationPolicy).toBe(true);
    expect(result.controlledDrugPolicy).toBe(false);
    expect(result.storagePolicy).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 4: Staff Medication Readiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffMedicationReadiness", () => {
  it("returns zeros for empty staff array", () => {
    const result = evaluateStaffMedicationReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.medicationAdministrationRate).toBe(0);
    expect(result.controlledDrugHandlingRate).toBe(0);
    expect(result.errorReportingRate).toBe(0);
    expect(result.consentProcessRate).toBe(0);
    expect(result.storageChecksRate).toBe(0);
    expect(result.medicationReviewRate).toBe(0);
  });

  it("scores 25 for fully trained staff", () => {
    const staff = Array.from({ length: 4 }, (_, i) =>
      makeTraining({ staffId: `staff-${i}` }),
    );
    const result = evaluateStaffMedicationReadiness(staff);
    expect(result.overallScore).toBe(25);
  });

  it("calculates rates accurately for mixed training", () => {
    const staff = [
      makeTraining({ staffId: "s1" }),
      makeTraining({ staffId: "s2", medicationAdministration: false, controlledDrugHandling: false }),
    ];
    const result = evaluateStaffMedicationReadiness(staff);
    expect(result.medicationAdministrationRate).toBe(50);
    expect(result.controlledDrugHandlingRate).toBe(50);
    expect(result.errorReportingRate).toBe(100);
  });

  it("applies correct weight of 6 for medicationAdministration", () => {
    const staff = [
      makeTraining({
        medicationAdministration: true,
        controlledDrugHandling: false,
        errorReporting: false,
        consentProcess: false,
        storageChecks: false,
        medicationReview: false,
      }),
    ];
    const result = evaluateStaffMedicationReadiness(staff);
    expect(result.overallScore).toBe(6);
  });

  it("applies correct weight of 5 for controlledDrugHandling", () => {
    const staff = [
      makeTraining({
        medicationAdministration: false,
        controlledDrugHandling: true,
        errorReporting: false,
        consentProcess: false,
        storageChecks: false,
        medicationReview: false,
      }),
    ];
    const result = evaluateStaffMedicationReadiness(staff);
    expect(result.overallScore).toBe(5);
  });

  it("applies correct weight of 5 for errorReporting", () => {
    const staff = [
      makeTraining({
        medicationAdministration: false,
        controlledDrugHandling: false,
        errorReporting: true,
        consentProcess: false,
        storageChecks: false,
        medicationReview: false,
      }),
    ];
    const result = evaluateStaffMedicationReadiness(staff);
    expect(result.overallScore).toBe(5);
  });

  it("applies correct weight of 4 for consentProcess", () => {
    const staff = [
      makeTraining({
        medicationAdministration: false,
        controlledDrugHandling: false,
        errorReporting: false,
        consentProcess: true,
        storageChecks: false,
        medicationReview: false,
      }),
    ];
    const result = evaluateStaffMedicationReadiness(staff);
    expect(result.overallScore).toBe(4);
  });

  it("applies correct weight of 3 for storageChecks", () => {
    const staff = [
      makeTraining({
        medicationAdministration: false,
        controlledDrugHandling: false,
        errorReporting: false,
        consentProcess: false,
        storageChecks: true,
        medicationReview: false,
      }),
    ];
    const result = evaluateStaffMedicationReadiness(staff);
    expect(result.overallScore).toBe(3);
  });

  it("applies correct weight of 2 for medicationReview", () => {
    const staff = [
      makeTraining({
        medicationAdministration: false,
        controlledDrugHandling: false,
        errorReporting: false,
        consentProcess: false,
        storageChecks: false,
        medicationReview: true,
      }),
    ];
    const result = evaluateStaffMedicationReadiness(staff);
    expect(result.overallScore).toBe(2);
  });

  it("clamps score to 0-25 range", () => {
    const result = evaluateStaffMedicationReadiness([makeTraining()]);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("counts total staff correctly", () => {
    const staff = Array.from({ length: 3 }, (_, i) =>
      makeTraining({ staffId: `s-${i}` }),
    );
    const result = evaluateStaffMedicationReadiness(staff);
    expect(result.totalStaff).toBe(3);
  });

  it("handles all skills false = score 0", () => {
    const staff = [
      makeTraining({
        medicationAdministration: false,
        controlledDrugHandling: false,
        errorReporting: false,
        consentProcess: false,
        storageChecks: false,
        medicationReview: false,
      }),
    ];
    const result = evaluateStaffMedicationReadiness(staff);
    expect(result.overallScore).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Build Child Medication Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildMedicationProfiles", () => {
  it("returns empty array for no records", () => {
    expect(buildChildMedicationProfiles([])).toEqual([]);
  });

  it("groups records by child", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ id: "r3", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildMedicationProfiles(recs);
    expect(profiles).toHaveLength(2);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.totalRecords).toBe(2);
  });

  it("calculates administeredCorrectlyRate per child", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "child-alex", administeredCorrectly: true }),
      makeRecord({ id: "r2", childId: "child-alex", administeredCorrectly: false }),
    ];
    const profiles = buildChildMedicationProfiles(recs);
    expect(profiles[0].administeredCorrectlyRate).toBe(50);
  });

  it("calculates consentOnFileRate per child", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "child-alex", consentOnFile: true }),
      makeRecord({ id: "r2", childId: "child-alex", consentOnFile: false }),
      makeRecord({ id: "r3", childId: "child-alex", consentOnFile: true }),
    ];
    const profiles = buildChildMedicationProfiles(recs);
    expect(profiles[0].consentOnFileRate).toBe(67);
  });

  it("gives frequency score of 2 for >= 10 records", () => {
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildMedicationProfiles(recs);
    // freq=2, rate1=3 (100%), rate2=3 (100%), diversity=0 (1 cat) = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("gives frequency score of 1 for >= 5 records", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildMedicationProfiles(recs);
    // freq=1, rate1=3, rate2=3, diversity=0 = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("gives frequency score of 0 for < 5 records", () => {
    const recs = Array.from({ length: 3 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildMedicationProfiles(recs);
    // freq=0, rate1=3, rate2=3, diversity=0 = 6
    expect(profiles[0].overallScore).toBe(6);
  });

  it("gives diversity bonus of 2 for >= 4 unique categories", () => {
    const cats: MedicationCategory[] = [
      "regular_administration", "controlled_drug", "consent_review", "medication_review",
    ];
    const recs = cats.map((cat, i) =>
      makeRecord({ id: `r-${i}`, childId: "child-alex", childName: "Alex", category: cat }),
    );
    const profiles = buildChildMedicationProfiles(recs);
    // freq=0, rate1=3, rate2=3, diversity=2 = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("gives diversity bonus of 1 for >= 2 unique categories", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "child-alex", category: "regular_administration" }),
      makeRecord({ id: "r2", childId: "child-alex", category: "controlled_drug" }),
    ];
    const profiles = buildChildMedicationProfiles(recs);
    // freq=0, rate1=3, rate2=3, diversity=1 = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("gives diversity bonus of 0 for 1 category", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "child-alex", category: "regular_administration" }),
    ];
    const profiles = buildChildMedicationProfiles(recs);
    // freq=0, rate1=3, rate2=3, diversity=0 = 6
    expect(profiles[0].overallScore).toBe(6);
  });

  it("scores max 10 for child with many perfect records across categories", () => {
    const cats: MedicationCategory[] = [
      "regular_administration", "prn_administration", "controlled_drug",
      "medication_storage", "consent_review", "medication_error",
    ];
    const recs = Array.from({ length: 12 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "child-alex",
        childName: "Alex",
        category: cats[i % 6],
      }),
    );
    const profiles = buildChildMedicationProfiles(recs);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("caps score at 10", () => {
    const cats: MedicationCategory[] = [
      "regular_administration", "prn_administration", "controlled_drug",
      "medication_storage", "consent_review",
    ];
    const recs = Array.from({ length: 15 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "child-alex",
        childName: "Alex",
        category: cats[i % 5],
      }),
    );
    const profiles = buildChildMedicationProfiles(recs);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("returns categoriesCovered list", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "child-alex", category: "regular_administration" }),
      makeRecord({ id: "r2", childId: "child-alex", category: "controlled_drug" }),
      makeRecord({ id: "r3", childId: "child-alex", category: "regular_administration" }),
    ];
    const profiles = buildChildMedicationProfiles(recs);
    expect(profiles[0].categoriesCovered).toContain("regular_administration");
    expect(profiles[0].categoriesCovered).toContain("controlled_drug");
    expect(profiles[0].categoriesCovered).toHaveLength(2);
  });

  it("handles rate1 thresholds: >=60 gives 2", () => {
    // 2 out of 3 = 67%
    const recs = [
      makeRecord({ id: "r1", childId: "child-alex", administeredCorrectly: true }),
      makeRecord({ id: "r2", childId: "child-alex", administeredCorrectly: true }),
      makeRecord({ id: "r3", childId: "child-alex", administeredCorrectly: false }),
    ];
    const profiles = buildChildMedicationProfiles(recs);
    // freq=0, rate1=2 (67%), rate2=3 (100%), diversity=0 = 5
    expect(profiles[0].overallScore).toBe(5);
  });

  it("handles rate1 thresholds: >=40 gives 1", () => {
    // 2 out of 5 = 40%
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "child-alex", administeredCorrectly: i < 2 }),
    );
    const profiles = buildChildMedicationProfiles(recs);
    // freq=1, rate1=1 (40%), rate2=3 (100%), diversity=0 = 5
    expect(profiles[0].overallScore).toBe(5);
  });

  it("handles rate1 thresholds: <40 gives 0", () => {
    // 1 out of 5 = 20%
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "child-alex", administeredCorrectly: i < 1 }),
    );
    const profiles = buildChildMedicationProfiles(recs);
    // freq=1, rate1=0 (20%), rate2=3 (100%), diversity=0 = 4
    expect(profiles[0].overallScore).toBe(4);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Orchestrator: generateMedicationIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateMedicationIntelligence", () => {
  it("returns full structure with all fields", () => {
    const recs = [makeRecord()];
    const policy = makePolicy();
    const staff = [makeTraining()];
    const result = generateMedicationIntelligence(recs, policy, staff, "oak-house", "2026-01-01", "2026-12-31");

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-12-31");
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.rating).toBeDefined();
    expect(result.medicationQuality).toBeDefined();
    expect(result.medicationCompliance).toBeDefined();
    expect(result.medicationPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("caps overall score at 100", () => {
    const cats: MedicationCategory[] = [
      "regular_administration", "prn_administration", "controlled_drug",
      "medication_storage", "consent_review", "medication_error",
      "medication_review", "competency_assessment",
    ];
    const recs = cats.map((cat, i) =>
      makeRecord({ id: `r-${i}`, category: cat }),
    );
    const policy = makePolicy();
    const staff = Array.from({ length: 4 }, (_, i) =>
      makeTraining({ staffId: `s-${i}` }),
    );
    const result = generateMedicationIntelligence(recs, policy, staff, "oak-house", "2026-01-01", "2026-12-31");
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("sums all four evaluator scores", () => {
    const recs = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}` }),
    );
    const policy = makePolicy();
    const staff = [makeTraining()];
    const result = generateMedicationIntelligence(recs, policy, staff, "oak-house", "2026-01-01", "2026-12-31");

    const expectedSum =
      result.medicationQuality.overallScore +
      result.medicationCompliance.overallScore +
      result.medicationPolicy.overallScore +
      result.staffReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(100, expectedSum));
  });

  it("assigns outstanding rating for high scores", () => {
    const cats: MedicationCategory[] = [
      "regular_administration", "prn_administration", "controlled_drug",
      "medication_storage", "consent_review", "medication_error",
      "medication_review", "competency_assessment",
    ];
    const recs = cats.map((cat, i) =>
      makeRecord({ id: `r-${i}`, category: cat }),
    );
    const policy = makePolicy();
    const staff = Array.from({ length: 4 }, (_, i) =>
      makeTraining({ staffId: `s-${i}` }),
    );
    const result = generateMedicationIntelligence(recs, policy, staff, "oak-house", "2026-01-01", "2026-12-31");
    expect(result.rating).toBe("outstanding");
  });

  it("assigns inadequate rating for zero scores", () => {
    const result = generateMedicationIntelligence([], null, [], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBe(0);
  });

  it("includes 7 regulatory links", () => {
    const result = generateMedicationIntelligence([], null, [], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 23"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Misuse of Drugs Act 1971"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CQC Guidance"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NICE CG76"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("HSCA 2008 Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 3"))).toBe(true);
  });

  it("generates strengths for high rates (>=80%)", () => {
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}` }),
    );
    const result = generateMedicationIntelligence(recs, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.strengths.some((s) => s.includes("administered correctly"))).toBe(true);
    expect(result.strengths.some((s) => s.includes("Dual-signature"))).toBe(true);
    expect(result.strengths.some((s) => s.includes("Consent records"))).toBe(true);
    expect(result.strengths.some((s) => s.includes("Error reporting"))).toBe(true);
  });

  it("generates areas for improvement for low rates (<60%)", () => {
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        administeredCorrectly: false,
        signedByTwoStaff: false,
        consentOnFile: false,
        errorReported: false,
        documentationComplete: false,
        timelyRecording: false,
      }),
    );
    const result = generateMedicationIntelligence(recs, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.areasForImprovement.some((a) => a.includes("accuracy"))).toBe(true);
    expect(result.areasForImprovement.some((a) => a.includes("Dual-signature"))).toBe(true);
  });

  it("generates URGENT action when policy score is 0", () => {
    const result = generateMedicationIntelligence([], null, [], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT action when staff readiness score is 0", () => {
    const result = generateMedicationIntelligence([], makePolicy(), [], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });

  it("builds child profiles from records", () => {
    const recs = [
      makeRecord({ id: "r1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generateMedicationIntelligence(recs, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.childProfiles).toHaveLength(2);
  });

  it("generates no urgent actions for perfect data", () => {
    const cats: MedicationCategory[] = [
      "regular_administration", "prn_administration", "controlled_drug",
      "medication_storage", "consent_review", "medication_error",
      "medication_review", "competency_assessment",
    ];
    const recs = cats.map((cat, i) =>
      makeRecord({ id: `r-${i}`, category: cat }),
    );
    const result = generateMedicationIntelligence(recs, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.actions.every((a) => !a.startsWith("URGENT"))).toBe(true);
  });

  it("generates conditional actions for low rates (<50%)", () => {
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        administeredCorrectly: false,
        signedByTwoStaff: false,
        documentationComplete: false,
        timelyRecording: false,
        consentOnFile: false,
      }),
    );
    const staff = [
      makeTraining({ errorReporting: false }),
    ];
    const result = generateMedicationIntelligence(recs, makePolicy(), staff, "oak-house", "2026-01-01", "2026-12-31");
    expect(result.actions.some((a) => a.includes("administration procedures"))).toBe(true);
    expect(result.actions.some((a) => a.includes("dual-signature"))).toBe(true);
    expect(result.actions.some((a) => a.includes("documentation"))).toBe(true);
  });

  it("handles empty records with full policy and staff", () => {
    const result = generateMedicationIntelligence([], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.medicationQuality.overallScore).toBe(0);
    expect(result.medicationCompliance.overallScore).toBe(0);
    expect(result.medicationPolicy.overallScore).toBe(25);
    expect(result.staffReadiness.overallScore).toBe(25);
    expect(result.overallScore).toBe(50);
  });

  it("sets homeId and period correctly", () => {
    const result = generateMedicationIntelligence([], null, [], "oak-house", "2026-01-01", "2026-06-30");
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-06-30");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Edge Cases
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge Cases", () => {
  it("single record with all false booleans scores 0 for quality", () => {
    const recs = [
      makeRecord({
        administeredCorrectly: false,
        signedByTwoStaff: false,
        consentOnFile: false,
        errorReported: false,
      }),
    ];
    const result = evaluateMedicationQuality(recs);
    expect(result.overallScore).toBe(0);
  });

  it("single staff with all false skills scores 0", () => {
    const staff = [
      makeTraining({
        medicationAdministration: false,
        controlledDrugHandling: false,
        errorReporting: false,
        consentProcess: false,
        storageChecks: false,
        medicationReview: false,
      }),
    ];
    const result = evaluateStaffMedicationReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("pct handles large numbers correctly", () => {
    expect(pct(999, 1000)).toBe(100);
    expect(pct(1, 1000)).toBe(0);
    expect(pct(5, 1000)).toBe(1);
  });

  it("child profile with all false booleans and single record", () => {
    const recs = [
      makeRecord({
        childId: "child-alex",
        administeredCorrectly: false,
        consentOnFile: false,
        category: "regular_administration",
      }),
    ];
    const profiles = buildChildMedicationProfiles(recs);
    // freq=0, rate1=0 (<40), rate2=0 (<40), diversity=0 (1 cat) = 0
    expect(profiles[0].overallScore).toBe(0);
  });

  it("orchestrator with completely zero data scores 0 overall", () => {
    const result = generateMedicationIntelligence([], null, [], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.childProfiles).toEqual([]);
  });

  it("policy null returns all 7 booleans as false", () => {
    const result = evaluateMedicationPolicy(null);
    expect(result.medicationPolicy).toBe(false);
    expect(result.controlledDrugPolicy).toBe(false);
    expect(result.administrationProcedure).toBe(false);
    expect(result.consentFramework).toBe(false);
    expect(result.errorReportingPolicy).toBe(false);
    expect(result.storagePolicy).toBe(false);
    expect(result.reviewSchedulePolicy).toBe(false);
  });

  it("compliance with all 8 categories gives 100% diversity", () => {
    const cats: MedicationCategory[] = [
      "regular_administration", "prn_administration", "controlled_drug",
      "medication_storage", "consent_review", "medication_error",
      "medication_review", "competency_assessment",
    ];
    const recs = cats.map((cat, i) => makeRecord({ id: `r-${i}`, category: cat }));
    const result = evaluateMedicationCompliance(recs);
    expect(result.categoryDiversityRatio).toBe(100);
  });

  it("quality scoring uses Math.round correctly for fractional results", () => {
    // 3 out of 4 = 75% for each rate
    const recs = Array.from({ length: 4 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        administeredCorrectly: i < 3,
        signedByTwoStaff: i < 3,
        consentOnFile: i < 3,
        errorReported: i < 3,
      }),
    );
    const result = evaluateMedicationQuality(recs);
    expect(result.administeredCorrectlyRate).toBe(75);
    // 0.75*7 + 0.75*6 + 0.75*6 + 0.75*6 = 5.25+4.5+4.5+4.5 = 18.75 -> round = 19
    expect(result.overallScore).toBe(19);
  });
});
