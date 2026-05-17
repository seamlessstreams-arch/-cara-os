// ══════════════════════════════════════════════════════════════════════════════
// Medication Management Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateChildMedicationCompliance,
  calculateHomeMedicationMetrics,
  getMedicationTypeLabel,
  getAdministrationStatusLabel,
  getErrorSeverityLabel,
  getSelfAdminLevelLabel,
} from "../medication-engine";
import type { Medication, Administration, MedicationError, StockCheck } from "../medication-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────

const NOW = "2026-05-17T12:00:00Z";

function makeMedication(overrides: Partial<Medication> = {}): Medication {
  return {
    id: "med-001",
    childId: "child-a",
    childName: "Alex Turner",
    name: "Methylphenidate 10mg",
    dose: "10mg",
    route: "oral",
    frequency: "twice daily",
    type: "regular",
    prescribedBy: "Dr Smith",
    prescribedDate: "2026-01-10T10:00:00Z",
    reviewDueDate: "2026-07-10T10:00:00Z",
    startDate: "2026-01-10T10:00:00Z",
    storage: "locked_cabinet",
    allergiesChecked: true,
    consentObtained: true,
    active: true,
    ...overrides,
  };
}

function makeAdmin(overrides: Partial<Administration> = {}): Administration {
  return {
    id: "admin-001",
    medicationId: "med-001",
    childId: "child-a",
    scheduledTime: "2026-05-16T08:00:00Z",
    actualTime: "2026-05-16T08:05:00Z",
    status: "given",
    administeredBy: "staff-sw-01",
    ...overrides,
  };
}

function makeError(overrides: Partial<MedicationError> = {}): MedicationError {
  return {
    id: "err-001",
    childId: "child-a",
    childName: "Alex Turner",
    medicationName: "Methylphenidate 10mg",
    date: "2026-05-10T08:00:00Z",
    errorType: "wrong_time",
    severity: "minor",
    description: "Given 1 hour late",
    discoveredBy: "staff-rm-01",
    actionsTaken: ["Staff reminded of schedule"],
    reportedToGP: false,
    reportedToOfsted: false,
    investigationCompleted: true,
    ...overrides,
  };
}

function makeStockCheck(overrides: Partial<StockCheck> = {}): StockCheck {
  return {
    id: "sc-001",
    medicationId: "med-001",
    date: "2026-05-15T10:00:00Z",
    expectedCount: 28,
    actualCount: 28,
    discrepancy: false,
    checkedBy: "staff-sw-01",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Child Compliance Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateChildMedicationCompliance", () => {
  it("marks fully compliant child", () => {
    const meds = [makeMedication()];
    const admins = [
      makeAdmin({ id: "a1", status: "given" }),
      makeAdmin({ id: "a2", scheduledTime: "2026-05-16T18:00:00Z", actualTime: "2026-05-16T18:05:00Z", status: "given" }),
    ];
    const result = evaluateChildMedicationCompliance(meds, admins, [], "child-a", NOW);
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.marCompletionRate).toBe(100);
  });

  it("flags incomplete MAR chart", () => {
    const meds = [makeMedication()];
    const admins = [
      makeAdmin({ id: "a1", status: "given" }),
      makeAdmin({ id: "a2", status: "omitted_error" }),
    ];
    const result = evaluateChildMedicationCompliance(meds, admins, [], "child-a", NOW);
    // omitted_error is NOT in the completed list, so MAR is 50%
    expect(result.marCompletionRate).toBe(50);
    expect(result.issues.some(i => i.includes("MAR chart incomplete"))).toBe(true);
  });

  it("flags PRN without protocol", () => {
    const meds = [makeMedication({ id: "prn-1", type: "prn", prnProtocol: undefined })];
    const result = evaluateChildMedicationCompliance(meds, [], [], "child-a", NOW);
    expect(result.prnProtocolsInPlace).toBe(false);
    expect(result.issues.some(i => i.includes("PRN"))).toBe(true);
  });

  it("passes PRN with protocol", () => {
    const meds = [makeMedication({
      id: "prn-1",
      type: "prn",
      prnProtocol: {
        indication: "Anxiety episodes",
        maxDoseIn24h: "3 doses",
        minTimeBetweenDoses: "4 hours",
        whenToSeekHelp: "If 3 doses given and no improvement",
        approvedBy: "Dr Smith",
        approvedDate: "2026-01-10T10:00:00Z",
      },
    })];
    const result = evaluateChildMedicationCompliance(meds, [], [], "child-a", NOW);
    expect(result.prnProtocolsInPlace).toBe(true);
  });

  it("flags controlled drug without witness", () => {
    const meds = [makeMedication({ id: "cd-1", type: "controlled", storage: "controlled_drugs_cabinet" })];
    const admins = [makeAdmin({ medicationId: "cd-1", status: "given", witnessedBy: undefined })];
    const result = evaluateChildMedicationCompliance(meds, admins, [], "child-a", NOW);
    expect(result.controlledDrugsCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("controlled drug") && i.includes("witness"))).toBe(true);
  });

  it("passes controlled drug with witness", () => {
    const meds = [makeMedication({ id: "cd-1", type: "controlled", storage: "controlled_drugs_cabinet" })];
    const admins = [makeAdmin({ medicationId: "cd-1", status: "given", witnessedBy: "staff-sw-02" })];
    const result = evaluateChildMedicationCompliance(meds, admins, [], "child-a", NOW);
    expect(result.controlledDrugsCompliant).toBe(true);
  });

  it("flags overdue medication review", () => {
    const meds = [makeMedication({ reviewDueDate: "2026-04-01T10:00:00Z" })];
    const result = evaluateChildMedicationCompliance(meds, [], [], "child-a", NOW);
    expect(result.reviewsUpToDate).toBe(false);
    expect(result.overdueReviews).toHaveLength(1);
    expect(result.warnings.some(w => w.includes("review"))).toBe(true);
  });

  it("flags missing consent", () => {
    const meds = [makeMedication({ consentObtained: false })];
    const result = evaluateChildMedicationCompliance(meds, [], [], "child-a", NOW);
    expect(result.consentComplete).toBe(false);
    expect(result.issues.some(i => i.includes("consent"))).toBe(true);
  });

  it("flags controlled drug wrong storage", () => {
    const meds = [makeMedication({ type: "controlled", storage: "locked_cabinet" })];
    const result = evaluateChildMedicationCompliance(meds, [], [], "child-a", NOW);
    expect(result.storageCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("Controlled drug") && i.includes("stored"))).toBe(true);
  });

  it("warns about high refusal rate", () => {
    const meds = [makeMedication()];
    const admins = [
      makeAdmin({ id: "a1", status: "refused" }),
      makeAdmin({ id: "a2", status: "refused" }),
      makeAdmin({ id: "a3", status: "given" }),
      makeAdmin({ id: "a4", status: "given" }),
      makeAdmin({ id: "a5", status: "given" }),
    ];
    const result = evaluateChildMedicationCompliance(meds, admins, [], "child-a", NOW);
    expect(result.refusalRate).toBe(40);
    expect(result.warnings.some(w => w.includes("refusal rate"))).toBe(true);
  });

  it("flags uninvestigated medication errors", () => {
    const meds = [makeMedication()];
    const errs = [makeError({ investigationCompleted: false })];
    const result = evaluateChildMedicationCompliance(meds, [], errs, "child-a", NOW);
    expect(result.errorCount30Days).toBe(1);
    expect(result.issues.some(i => i.includes("not yet investigated"))).toBe(true);
  });

  it("counts missed doses in 7 days", () => {
    const meds = [makeMedication()];
    const admins = [
      makeAdmin({ id: "a1", scheduledTime: "2026-05-15T08:00:00Z", status: "omitted_error" }),
      makeAdmin({ id: "a2", scheduledTime: "2026-05-16T08:00:00Z", status: "omitted_error" }),
    ];
    const result = evaluateChildMedicationCompliance(meds, admins, [], "child-a", NOW);
    expect(result.missedDoses7Days).toBe(2);
    expect(result.issues.some(i => i.includes("missed dose"))).toBe(true);
  });

  it("flags missing allergy check", () => {
    const meds = [makeMedication({ allergiesChecked: false })];
    const result = evaluateChildMedicationCompliance(meds, [], [], "child-a", NOW);
    expect(result.issues.some(i => i.includes("allergy check"))).toBe(true);
  });

  it("warns about self-admin without assessment", () => {
    const meds = [makeMedication({ selfAdminLevel: "level_3", selfAdminAssessmentDate: undefined })];
    const result = evaluateChildMedicationCompliance(meds, [], [], "child-a", NOW);
    expect(result.selfAdminAssessed).toBe(false);
    expect(result.warnings.some(w => w.includes("Self-administration"))).toBe(true);
  });

  it("handles child with no medications", () => {
    const result = evaluateChildMedicationCompliance([], [], [], "child-b", NOW);
    expect(result.isCompliant).toBe(true);
    expect(result.activeMedications).toBe(0);
    expect(result.marCompletionRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Home Metrics Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateHomeMedicationMetrics", () => {
  const baseMeds = [
    makeMedication({ id: "m1", childId: "child-a", childName: "Alex" }),
    makeMedication({ id: "m2", childId: "child-b", childName: "Beth", type: "prn", prnProtocol: { indication: "Pain", maxDoseIn24h: "4", minTimeBetweenDoses: "4h", whenToSeekHelp: "If persists", approvedBy: "Dr A", approvedDate: "2026-01-01" } }),
    makeMedication({ id: "m3", childId: "child-b", childName: "Beth", type: "controlled", storage: "controlled_drugs_cabinet" }),
  ];

  const baseAdmins = [
    makeAdmin({ id: "a1", medicationId: "m1", childId: "child-a", scheduledTime: "2026-05-15T08:00:00Z", status: "given" }),
    makeAdmin({ id: "a2", medicationId: "m1", childId: "child-a", scheduledTime: "2026-05-15T18:00:00Z", status: "given" }),
    makeAdmin({ id: "a3", medicationId: "m3", childId: "child-b", scheduledTime: "2026-05-15T08:00:00Z", status: "given", witnessedBy: "staff-02" }),
  ];

  it("calculates basic counts", () => {
    const result = calculateHomeMedicationMetrics(baseMeds, baseAdmins, [], [], "home-oak", 8, 10, NOW);
    expect(result.childCount).toBe(2);
    expect(result.totalActiveMedications).toBe(3);
    expect(result.controlledDrugCount).toBe(1);
  });

  it("calculates MAR completion rate", () => {
    const result = calculateHomeMedicationMetrics(baseMeds, baseAdmins, [], [], "home-oak", 8, 10, NOW);
    expect(result.overallMarCompletionRate).toBe(100);
  });

  it("calculates error rate", () => {
    const errs = [
      makeError({ id: "e1", date: "2026-05-10T08:00:00Z" }),
      makeError({ id: "e2", date: "2026-05-12T08:00:00Z", severity: "near_miss" }),
    ];
    const result = calculateHomeMedicationMetrics(baseMeds, baseAdmins, errs, [], "home-oak", 8, 10, NOW);
    expect(result.errorCount30Days).toBe(2);
    expect(result.nearMissCount30Days).toBe(1);
  });

  it("detects stock discrepancies", () => {
    const checks = [
      makeStockCheck({ discrepancy: true, actualCount: 26, date: "2026-05-15T10:00:00Z" }),
    ];
    const result = calculateHomeMedicationMetrics(baseMeds, baseAdmins, [], checks, "home-oak", 8, 10, NOW);
    expect(result.stockDiscrepancies).toBe(1);
  });

  it("calculates staff training compliance", () => {
    const compliant = calculateHomeMedicationMetrics(baseMeds, baseAdmins, [], [], "home-oak", 8, 10, NOW);
    expect(compliant.staffTrainingCompliant).toBe(true);

    const nonCompliant = calculateHomeMedicationMetrics(baseMeds, baseAdmins, [], [], "home-oak", 5, 10, NOW);
    expect(nonCompliant.staffTrainingCompliant).toBe(false);
  });

  it("identifies children with issues", () => {
    const meds = [
      makeMedication({ id: "m1", childId: "child-a", childName: "Alex", consentObtained: false }),
      makeMedication({ id: "m2", childId: "child-b", childName: "Beth" }),
    ];
    const result = calculateHomeMedicationMetrics(meds, [], [], [], "home-oak", 8, 10, NOW);
    expect(result.childrenWithIssues.length).toBeGreaterThanOrEqual(1);
    expect(result.childrenWithIssues[0].childName).toBe("Alex");
  });

  it("counts overdue reviews", () => {
    const meds = [
      makeMedication({ id: "m1", reviewDueDate: "2026-04-01T10:00:00Z" }),
      makeMedication({ id: "m2", childId: "child-b", childName: "Beth", reviewDueDate: "2026-04-15T10:00:00Z" }),
    ];
    const result = calculateHomeMedicationMetrics(meds, [], [], [], "home-oak", 8, 10, NOW);
    expect(result.overdueReviews).toBe(2);
  });

  it("tracks self-admin children", () => {
    const meds = [
      makeMedication({ id: "m1", childId: "child-a", selfAdminLevel: "level_3", selfAdminAssessmentDate: "2026-03-01T10:00:00Z" }),
      makeMedication({ id: "m2", childId: "child-b", childName: "Beth" }),
    ];
    const result = calculateHomeMedicationMetrics(meds, [], [], [], "home-oak", 8, 10, NOW);
    expect(result.selfAdminChildCount).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Helper functions", () => {
  it("getMedicationTypeLabel returns readable labels", () => {
    expect(getMedicationTypeLabel("controlled")).toBe("Controlled Drug");
    expect(getMedicationTypeLabel("prn")).toBe("PRN (As Needed)");
    expect(getMedicationTypeLabel("regular")).toBe("Regular");
  });

  it("getAdministrationStatusLabel returns readable labels", () => {
    expect(getAdministrationStatusLabel("given")).toBe("Given");
    expect(getAdministrationStatusLabel("omitted_error")).toBe("Missed (Error)");
    expect(getAdministrationStatusLabel("self_administered")).toBe("Self-Administered");
  });

  it("getErrorSeverityLabel returns readable labels", () => {
    expect(getErrorSeverityLabel("near_miss")).toBe("Near Miss");
    expect(getErrorSeverityLabel("serious")).toBe("Serious");
  });

  it("getSelfAdminLevelLabel returns readable labels", () => {
    expect(getSelfAdminLevelLabel("level_1")).toBe("Level 1 — Fully Supervised");
    expect(getSelfAdminLevelLabel("level_4")).toBe("Level 4 — Fully Independent");
  });
});
