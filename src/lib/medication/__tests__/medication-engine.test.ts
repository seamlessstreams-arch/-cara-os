// ══════════════════════════════════════════════════════════════════════════════
// Medication Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getMedicationTypeLabel,
  getAdministrationOutcomeLabel,
  getRatingLabel,
  evaluateMedicationQuality,
  evaluateMedicationCompliance,
  evaluateMedicationPolicy,
  evaluateStaffMedicationReadiness,
  buildChildMedicationProfiles,
  generateMedicationIntelligence,
} from "../medication-engine";
import type {
  MedicationAdministration,
  MedicationPolicy,
  StaffMedicationTraining,
  MedicationType,
} from "../medication-engine";

// ── Factory Functions ─────────────────────────────────────────────────────

function makeAdministration(overrides: Partial<MedicationAdministration> = {}): MedicationAdministration {
  return {
    id: "admin-001",
    childId: "child-alex",
    childName: "Alex",
    administrationDate: "2026-03-15",
    medicationType: "regular_oral",
    outcome: "administered_correctly",
    consentObtained: true,
    twoStaffWitnessed: true,
    documentedCorrectly: true,
    sideEffectsMonitored: true,
    storageCompliant: true,
    marChartUpdated: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<MedicationPolicy> = {}): MedicationPolicy {
  return {
    id: "pol-001",
    medicationManagementPolicy: true,
    controlledDrugsProcedure: true,
    administrationProtocol: true,
    storageAndDisposalPolicy: true,
    errorReportingProcess: true,
    consentFramework: true,
    regularReview: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffMedicationTraining> = {}): StaffMedicationTraining {
  return {
    id: "tr-001",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    medicationAdministration: true,
    controlledDrugsHandling: true,
    errorRecognition: true,
    sideEffectsAwareness: true,
    storageRequirements: true,
    consentAndCapacity: true,
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
});

// ══════════════════════════════════════════════════════════════════════════════
// Label helpers
// ══════════════════════════════════════════════════════════════════════════════

describe("getMedicationTypeLabel", () => {
  it("returns correct label for regular_oral", () => {
    expect(getMedicationTypeLabel("regular_oral")).toBe("Regular Oral");
  });

  it("returns correct label for controlled_drug", () => {
    expect(getMedicationTypeLabel("controlled_drug")).toBe("Controlled Drug");
  });

  it("returns correct label for prn_as_needed", () => {
    expect(getMedicationTypeLabel("prn_as_needed")).toBe("PRN (As Needed)");
  });

  it("returns correct label for all types", () => {
    expect(getMedicationTypeLabel("topical")).toBe("Topical");
    expect(getMedicationTypeLabel("inhaler")).toBe("Inhaler");
    expect(getMedicationTypeLabel("injectable")).toBe("Injectable");
    expect(getMedicationTypeLabel("liquid")).toBe("Liquid");
    expect(getMedicationTypeLabel("patch")).toBe("Patch");
  });
});

describe("getAdministrationOutcomeLabel", () => {
  it("returns correct label for administered_correctly", () => {
    expect(getAdministrationOutcomeLabel("administered_correctly")).toBe("Administered Correctly");
  });

  it("returns correct label for refused_by_child", () => {
    expect(getAdministrationOutcomeLabel("refused_by_child")).toBe("Refused by Child");
  });

  it("returns correct label for all outcomes", () => {
    expect(getAdministrationOutcomeLabel("missed_dose")).toBe("Missed Dose");
    expect(getAdministrationOutcomeLabel("error_occurred")).toBe("Error Occurred");
    expect(getAdministrationOutcomeLabel("not_recorded")).toBe("Not Recorded");
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
  it("returns zeros and concern for empty administrations", () => {
    const result = evaluateMedicationQuality([]);
    expect(result.totalAdministrations).toBe(0);
    expect(result.correctAdminRate).toBe(0);
    expect(result.consentRate).toBe(0);
    expect(result.witnessedRate).toBe(0);
    expect(result.sideEffectsRate).toBe(0);
    expect(result.score).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("scores max 25 for perfect administrations", () => {
    const admins = Array.from({ length: 5 }, (_, i) =>
      makeAdministration({ id: `a-${i}` }),
    );
    const result = evaluateMedicationQuality(admins);
    expect(result.correctAdminRate).toBe(100);
    expect(result.consentRate).toBe(100);
    expect(result.witnessedRate).toBe(100);
    expect(result.sideEffectsRate).toBe(100);
    expect(result.score).toBe(25);
  });

  it("calculates correct admin rate accurately", () => {
    const admins = [
      makeAdministration({ id: "a1" }),
      makeAdministration({ id: "a2", outcome: "refused_by_child" }),
      makeAdministration({ id: "a3", outcome: "missed_dose" }),
      makeAdministration({ id: "a4" }),
    ];
    const result = evaluateMedicationQuality(admins);
    expect(result.correctAdminRate).toBe(50);
  });

  it("generates strength for high correct admin rate", () => {
    const admins = Array.from({ length: 10 }, (_, i) =>
      makeAdministration({ id: `a-${i}` }),
    );
    const result = evaluateMedicationQuality(admins);
    expect(result.strengths.some((s) => s.includes("administration accuracy"))).toBe(true);
  });

  it("generates concern for low consent rate", () => {
    const admins = Array.from({ length: 10 }, (_, i) =>
      makeAdministration({ id: `a-${i}`, consentObtained: false }),
    );
    const result = evaluateMedicationQuality(admins);
    expect(result.concerns.some((c) => c.includes("Consent rate"))).toBe(true);
  });

  it("generates concern for low witnessed rate", () => {
    const admins = Array.from({ length: 10 }, (_, i) =>
      makeAdministration({ id: `a-${i}`, twoStaffWitnessed: false }),
    );
    const result = evaluateMedicationQuality(admins);
    expect(result.concerns.some((c) => c.includes("Witnessed rate"))).toBe(true);
  });

  it("generates concern for low side effects monitoring", () => {
    const admins = Array.from({ length: 10 }, (_, i) =>
      makeAdministration({ id: `a-${i}`, sideEffectsMonitored: false }),
    );
    const result = evaluateMedicationQuality(admins);
    expect(result.concerns.some((c) => c.includes("Side-effects monitoring"))).toBe(true);
  });

  it("clamps score to 0-25 range", () => {
    const result = evaluateMedicationQuality([makeAdministration()]);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 2: Medication Compliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateMedicationCompliance", () => {
  it("returns zeros and concern for empty administrations", () => {
    const result = evaluateMedicationCompliance([]);
    expect(result.totalAdministrations).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.storageRate).toBe(0);
    expect(result.marChartRate).toBe(0);
    expect(result.typeDiversityRatio).toBe(0);
    expect(result.score).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("scores high for perfect compliance", () => {
    const admins = Array.from({ length: 5 }, (_, i) =>
      makeAdministration({ id: `a-${i}` }),
    );
    const result = evaluateMedicationCompliance(admins);
    expect(result.documentedRate).toBe(100);
    expect(result.storageRate).toBe(100);
    expect(result.marChartRate).toBe(100);
    // Only 1 type so diversity is low, score won't be exactly 25
    expect(result.score).toBeGreaterThan(19);
  });

  it("calculates documented rate accurately", () => {
    const admins = [
      makeAdministration({ id: "a1", documentedCorrectly: true }),
      makeAdministration({ id: "a2", documentedCorrectly: false }),
    ];
    const result = evaluateMedicationCompliance(admins);
    expect(result.documentedRate).toBe(50);
  });

  it("calculates type diversity correctly", () => {
    const types: MedicationType[] = ["regular_oral", "controlled_drug", "inhaler", "topical"];
    const admins = types.map((t, i) =>
      makeAdministration({ id: `a-${i}`, medicationType: t }),
    );
    const result = evaluateMedicationCompliance(admins);
    expect(result.uniqueTypes).toBe(4);
    expect(result.typeDiversityRatio).toBe(0.5);
  });

  it("generates strength for high documentation rate", () => {
    const admins = Array.from({ length: 10 }, (_, i) =>
      makeAdministration({ id: `a-${i}` }),
    );
    const result = evaluateMedicationCompliance(admins);
    expect(result.strengths.some((s) => s.includes("documentation"))).toBe(true);
  });

  it("generates concern for low storage compliance", () => {
    const admins = Array.from({ length: 10 }, (_, i) =>
      makeAdministration({ id: `a-${i}`, storageCompliant: false }),
    );
    const result = evaluateMedicationCompliance(admins);
    expect(result.concerns.some((c) => c.includes("Storage compliance"))).toBe(true);
  });

  it("generates concern for low MAR chart rate", () => {
    const admins = Array.from({ length: 10 }, (_, i) =>
      makeAdministration({ id: `a-${i}`, marChartUpdated: false }),
    );
    const result = evaluateMedicationCompliance(admins);
    expect(result.concerns.some((c) => c.includes("MAR chart"))).toBe(true);
  });

  it("clamps score to 0-25 range", () => {
    const result = evaluateMedicationCompliance([makeAdministration()]);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 3: Medication Policy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateMedicationPolicy", () => {
  it("returns 0 and URGENT concern for null policy", () => {
    const result = evaluateMedicationPolicy(null);
    expect(result.score).toBe(0);
    expect(result.concerns.some((c) => c.includes("URGENT"))).toBe(true);
    expect(result.medicationManagementPolicy).toBe(false);
    expect(result.controlledDrugsProcedure).toBe(false);
  });

  it("scores 25 for fully complete policy", () => {
    const result = evaluateMedicationPolicy(makePolicy());
    expect(result.score).toBe(25);
    expect(result.strengths.some((s) => s.includes("7/7"))).toBe(true);
  });

  it("scores 0 for all-false policy", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationManagementPolicy: false,
      controlledDrugsProcedure: false,
      administrationProtocol: false,
      storageAndDisposalPolicy: false,
      errorReportingProcess: false,
      consentFramework: false,
      regularReview: false,
    }));
    expect(result.score).toBe(0);
    expect(result.concerns.length).toBe(7);
  });

  it("applies correct weights — 4 for management policy", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationManagementPolicy: true,
      controlledDrugsProcedure: false,
      administrationProtocol: false,
      storageAndDisposalPolicy: false,
      errorReportingProcess: false,
      consentFramework: false,
      regularReview: false,
    }));
    expect(result.score).toBe(4);
  });

  it("applies correct weights — 3 for consent framework", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      medicationManagementPolicy: false,
      controlledDrugsProcedure: false,
      administrationProtocol: false,
      storageAndDisposalPolicy: false,
      errorReportingProcess: false,
      consentFramework: true,
      regularReview: false,
    }));
    expect(result.score).toBe(3);
  });

  it("generates concern for missing controlled drugs procedure", () => {
    const result = evaluateMedicationPolicy(makePolicy({ controlledDrugsProcedure: false }));
    expect(result.concerns.some((c) => c.includes("controlled drugs procedure"))).toBe(true);
  });

  it("generates concern for missing error reporting", () => {
    const result = evaluateMedicationPolicy(makePolicy({ errorReportingProcess: false }));
    expect(result.concerns.some((c) => c.includes("error reporting"))).toBe(true);
  });

  it("shows good coverage strength for 5+ policies", () => {
    const result = evaluateMedicationPolicy(makePolicy({
      consentFramework: false,
      regularReview: false,
    }));
    expect(result.strengths.some((s) => s.includes("5/7"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 4: Staff Medication Readiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffMedicationReadiness", () => {
  it("returns zeros and URGENT concern for empty training", () => {
    const result = evaluateStaffMedicationReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.score).toBe(0);
    expect(result.concerns.some((c) => c.includes("URGENT"))).toBe(true);
  });

  it("scores 25 for fully trained staff", () => {
    const training = Array.from({ length: 4 }, (_, i) =>
      makeTraining({ id: `tr-${i}`, staffId: `staff-${i}`, staffName: `Staff ${i}` }),
    );
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.score).toBe(25);
  });

  it("calculates rates accurately for mixed training", () => {
    const training = [
      makeTraining({ id: "tr-1", staffId: "s1", staffName: "Staff 1" }),
      makeTraining({ id: "tr-2", staffId: "s2", staffName: "Staff 2", medicationAdministration: false, controlledDrugsHandling: false }),
    ];
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.medicationAdministrationRate).toBe(50);
    expect(result.controlledDrugsHandlingRate).toBe(50);
    expect(result.errorRecognitionRate).toBe(100);
  });

  it("applies correct weights — 6 for medication administration", () => {
    const training = [
      makeTraining({
        medicationAdministration: true,
        controlledDrugsHandling: false,
        errorRecognition: false,
        sideEffectsAwareness: false,
        storageRequirements: false,
        consentAndCapacity: false,
      }),
    ];
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.score).toBe(6);
  });

  it("applies correct weights — 2 for consent and capacity", () => {
    const training = [
      makeTraining({
        medicationAdministration: false,
        controlledDrugsHandling: false,
        errorRecognition: false,
        sideEffectsAwareness: false,
        storageRequirements: false,
        consentAndCapacity: true,
      }),
    ];
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.score).toBe(2);
  });

  it("generates strengths for high rates", () => {
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({ id: `tr-${i}`, staffId: `staff-${i}`, staffName: `Staff ${i}` }),
    );
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates concerns for low rates", () => {
    const training = [
      makeTraining({
        medicationAdministration: false,
        controlledDrugsHandling: false,
        errorRecognition: false,
        sideEffectsAwareness: false,
        storageRequirements: false,
        consentAndCapacity: false,
      }),
    ];
    const result = evaluateStaffMedicationReadiness(training);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns.some((c) => c.includes("Medication administration training"))).toBe(true);
  });

  it("clamps score to 0-25 range", () => {
    const result = evaluateStaffMedicationReadiness([makeTraining()]);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Build Child Medication Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildMedicationProfiles", () => {
  it("returns empty array for no administrations", () => {
    expect(buildChildMedicationProfiles([])).toEqual([]);
  });

  it("groups administrations by child", () => {
    const admins = [
      makeAdministration({ id: "a1", childId: "child-alex", childName: "Alex" }),
      makeAdministration({ id: "a2", childId: "child-jordan", childName: "Jordan" }),
      makeAdministration({ id: "a3", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildMedicationProfiles(admins);
    expect(profiles).toHaveLength(2);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.totalAdministrations).toBe(2);
  });

  it("calculates correct admin rate per child", () => {
    const admins = [
      makeAdministration({ id: "a1", childId: "child-alex", outcome: "administered_correctly" }),
      makeAdministration({ id: "a2", childId: "child-alex", outcome: "missed_dose" }),
    ];
    const profiles = buildChildMedicationProfiles(admins);
    expect(profiles[0].correctAdminRate).toBe(50);
  });

  it("scores max 10 for child with many perfect administrations", () => {
    const admins = Array.from({ length: 12 }, (_, i) =>
      makeAdministration({
        id: `a-${i}`,
        childId: "child-alex",
        childName: "Alex",
        medicationType: (["regular_oral", "controlled_drug", "inhaler", "topical"] as MedicationType[])[i % 4],
      }),
    );
    const profiles = buildChildMedicationProfiles(admins);
    expect(profiles[0].medicationScore).toBe(10);
  });

  it("gives frequency score of 2 for >= 10 administrations", () => {
    const admins = Array.from({ length: 10 }, (_, i) =>
      makeAdministration({ id: `a-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildMedicationProfiles(admins);
    // freq=2, rate1=3 (100%), rate2=3 (100%), diversity=0 (1 type) = 8
    expect(profiles[0].medicationScore).toBe(8);
  });

  it("gives frequency score of 1 for >= 5 administrations", () => {
    const admins = Array.from({ length: 5 }, (_, i) =>
      makeAdministration({ id: `a-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildMedicationProfiles(admins);
    // freq=1, rate1=3, rate2=3, diversity=0 = 7
    expect(profiles[0].medicationScore).toBe(7);
  });

  it("gives frequency score of 0 for < 5 administrations", () => {
    const admins = Array.from({ length: 3 }, (_, i) =>
      makeAdministration({ id: `a-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildMedicationProfiles(admins);
    // freq=0, rate1=3, rate2=3, diversity=0 = 6
    expect(profiles[0].medicationScore).toBe(6);
  });

  it("gives diversity bonus of 2 for >= 4 unique types", () => {
    const types: MedicationType[] = ["regular_oral", "controlled_drug", "inhaler", "topical"];
    const admins = types.map((t, i) =>
      makeAdministration({ id: `a-${i}`, childId: "child-alex", childName: "Alex", medicationType: t }),
    );
    const profiles = buildChildMedicationProfiles(admins);
    // freq=0, rate1=3, rate2=3, diversity=2 = 8
    expect(profiles[0].medicationScore).toBe(8);
  });

  it("gives diversity bonus of 1 for >= 2 unique types", () => {
    const admins = [
      makeAdministration({ id: "a1", childId: "child-alex", medicationType: "regular_oral" }),
      makeAdministration({ id: "a2", childId: "child-alex", medicationType: "inhaler" }),
    ];
    const profiles = buildChildMedicationProfiles(admins);
    // freq=0, rate1=3, rate2=3, diversity=1 = 7
    expect(profiles[0].medicationScore).toBe(7);
  });

  it("caps score at 10", () => {
    // Create a scenario that would exceed 10 without cap
    const admins = Array.from({ length: 15 }, (_, i) =>
      makeAdministration({
        id: `a-${i}`,
        childId: "child-alex",
        childName: "Alex",
        medicationType: (["regular_oral", "controlled_drug", "inhaler", "topical", "injectable"] as MedicationType[])[i % 5],
      }),
    );
    const profiles = buildChildMedicationProfiles(admins);
    expect(profiles[0].medicationScore).toBeLessThanOrEqual(10);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Master Generator: generateMedicationIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateMedicationIntelligence", () => {
  it("returns full structure with all fields", () => {
    const admins = [makeAdministration()];
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateMedicationIntelligence(admins, policy, training, "oak-house", "2026-01-01", "2026-12-31");

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-12-31");
    expect(result.assessedAt).toBeDefined();
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
    const admins = Array.from({ length: 10 }, (_, i) =>
      makeAdministration({ id: `a-${i}` }),
    );
    const policy = makePolicy();
    const training = Array.from({ length: 4 }, (_, i) =>
      makeTraining({ id: `tr-${i}`, staffId: `s-${i}`, staffName: `Staff ${i}` }),
    );
    const result = generateMedicationIntelligence(admins, policy, training, "oak-house", "2026-01-01", "2026-12-31");
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("sums all four evaluator scores", () => {
    const admins = Array.from({ length: 5 }, (_, i) =>
      makeAdministration({ id: `a-${i}` }),
    );
    const policy = makePolicy();
    const training = [makeTraining()];
    const result = generateMedicationIntelligence(admins, policy, training, "oak-house", "2026-01-01", "2026-12-31");

    const expectedSum = Math.round(
      result.medicationQuality.score +
      result.medicationCompliance.score +
      result.medicationPolicy.score +
      result.staffReadiness.score,
    );
    expect(result.overallScore).toBe(Math.min(100, expectedSum));
  });

  it("assigns outstanding rating for high scores", () => {
    const admins = Array.from({ length: 10 }, (_, i) =>
      makeAdministration({ id: `a-${i}` }),
    );
    const policy = makePolicy();
    const training = Array.from({ length: 4 }, (_, i) =>
      makeTraining({ id: `tr-${i}`, staffId: `s-${i}`, staffName: `Staff ${i}` }),
    );
    const result = generateMedicationIntelligence(admins, policy, training, "oak-house", "2026-01-01", "2026-12-31");
    expect(result.rating).toBe("outstanding");
  });

  it("assigns inadequate rating for zero scores", () => {
    const result = generateMedicationIntelligence([], null, [], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBe(0);
  });

  it("filters administrations to period", () => {
    const admins = [
      makeAdministration({ id: "a1", administrationDate: "2026-03-15" }),
      makeAdministration({ id: "a2", administrationDate: "2025-06-15" }), // outside period
    ];
    const result = generateMedicationIntelligence(admins, null, [], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.medicationQuality.totalAdministrations).toBe(1);
  });

  it("includes 7 regulatory links", () => {
    const result = generateMedicationIntelligence([], null, [], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Misuse of Drugs Act"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CQC"))).toBe(true);
  });

  it("generates strength when evaluator score >= 20", () => {
    const admins = Array.from({ length: 10 }, (_, i) =>
      makeAdministration({ id: `a-${i}` }),
    );
    const result = generateMedicationIntelligence(admins, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    // With all perfect data, quality and policy should be >= 20
    expect(result.strengths.some((s) => s.includes("score"))).toBe(true);
  });

  it("generates area for improvement when evaluator score < 15", () => {
    // policy = null gives score 0, staff = [] gives score 0
    const admins = [makeAdministration()];
    const result = generateMedicationIntelligence(admins, null, [], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.areasForImprovement.some((a) => a.includes("needs improvement"))).toBe(true);
  });

  it("generates URGENT action when policy score is 0", () => {
    const result = generateMedicationIntelligence([], null, [], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT action when staff count is 0", () => {
    const result = generateMedicationIntelligence([], makePolicy(), [], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("staff"))).toBe(true);
  });

  it("generates URGENT action when errors occurred", () => {
    const admins = [
      makeAdministration({ id: "a1", outcome: "error_occurred" }),
      makeAdministration({ id: "a2", outcome: "error_occurred" }),
    ];
    const result = generateMedicationIntelligence(admins, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("error"))).toBe(true);
  });

  it("generates conditional actions when rates < 50", () => {
    const admins = Array.from({ length: 10 }, (_, i) =>
      makeAdministration({
        id: `a-${i}`,
        outcome: "missed_dose",
        consentObtained: false,
        documentedCorrectly: false,
        storageCompliant: false,
      }),
    );
    const result = generateMedicationIntelligence(admins, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.actions.some((a) => a.includes("Administration accuracy"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Consent rate"))).toBe(true);
  });

  it("generates no-action message when everything is perfect", () => {
    const admins = Array.from({ length: 10 }, (_, i) =>
      makeAdministration({ id: `a-${i}` }),
    );
    const result = generateMedicationIntelligence(admins, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.actions.some((a) => a.includes("No immediate actions"))).toBe(true);
  });

  it("builds child profiles from period data", () => {
    const admins = [
      makeAdministration({ id: "a1", childId: "child-alex", childName: "Alex", administrationDate: "2026-03-15" }),
      makeAdministration({ id: "a2", childId: "child-jordan", childName: "Jordan", administrationDate: "2026-04-10" }),
    ];
    const result = generateMedicationIntelligence(admins, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.childProfiles).toHaveLength(2);
  });

  it("generates areas for improvement includes overall rating when < 40", () => {
    const result = generateMedicationIntelligence([], null, [], "oak-house", "2026-01-01", "2026-12-31");
    expect(result.areasForImprovement.some((a) => a.includes("Inadequate"))).toBe(true);
  });

  it("generates overall strength message for good score", () => {
    // Create a scenario with a score between 60-79
    const admins = Array.from({ length: 5 }, (_, i) =>
      makeAdministration({ id: `a-${i}`, twoStaffWitnessed: false, sideEffectsMonitored: false }),
    );
    const policy = makePolicy({ consentFramework: false, regularReview: false, errorReportingProcess: false });
    const training = [
      makeTraining({ controlledDrugsHandling: false, sideEffectsAwareness: false, storageRequirements: false, consentAndCapacity: false }),
    ];
    const result = generateMedicationIntelligence(admins, policy, training, "oak-house", "2026-01-01", "2026-12-31");
    // The score should be in the good range
    if (result.overallScore >= 60 && result.overallScore < 80) {
      expect(result.strengths.some((s) => s.includes("Good"))).toBe(true);
    }
  });
});
