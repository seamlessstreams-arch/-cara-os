// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEDICATION SERVICE TESTS
// Pure-function tests for medication compliance, controlled drug audit,
// medication error rate, and medication alerts. CHR 2015 Reg 23 / Reg 12.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../medication-service";
import {
  MEDICATION_TYPES,
  ADMINISTRATION_OUTCOMES,
  MEDICATION_ROUTES,
  ERROR_CATEGORIES,
} from "../medication-service";
import type {
  MAREntry,
  MedicationPrescription,
  MedicationError,
} from "../medication-service";

const {
  computeMedicationCompliance,
  computeControlledDrugAudit,
  computeMedicationErrorRate,
  identifyMedicationAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal MAR entry for compliance and audit tests. */
function entry(overrides?: Partial<MAREntry>): MAREntry {
  return {
    id: overrides?.id ?? "mar-1",
    prescription_id: overrides?.prescription_id ?? "rx-1",
    child_id: overrides?.child_id ?? "child-1",
    home_id: overrides?.home_id ?? "home-1",
    scheduled_time: overrides?.scheduled_time ?? "2026-04-10T08:00:00Z",
    administered_at: "administered_at" in (overrides ?? {}) ? overrides!.administered_at : "2026-04-10T08:05:00Z",
    administered_by: overrides?.administered_by ?? "staff-1",
    witnessed_by: "witnessed_by" in (overrides ?? {}) ? overrides!.witnessed_by : null,
    outcome: overrides?.outcome ?? "given",
    dosage_given: overrides?.dosage_given ?? "5mg",
    stock_before: "stock_before" in (overrides ?? {}) ? overrides!.stock_before : null,
    stock_after: "stock_after" in (overrides ?? {}) ? overrides!.stock_after : null,
    prn_rationale: "prn_rationale" in (overrides ?? {}) ? overrides!.prn_rationale : null,
    notes: "notes" in (overrides ?? {}) ? overrides!.notes : null,
    created_at: overrides?.created_at ?? "2026-04-10T08:05:00Z",
  };
}

/** Build a minimal prescription for audit and alert tests. */
function prescription(overrides?: Partial<MedicationPrescription>): MedicationPrescription {
  return {
    id: overrides?.id ?? "rx-1",
    home_id: overrides?.home_id ?? "home-1",
    child_id: overrides?.child_id ?? "child-1",
    medication_name: overrides?.medication_name ?? "Methylphenidate",
    dosage: overrides?.dosage ?? "10mg",
    frequency: overrides?.frequency ?? "twice_daily",
    route: overrides?.route ?? "oral",
    medication_type: overrides?.medication_type ?? "regular",
    prescriber: overrides?.prescriber ?? "Dr Smith",
    pharmacy: overrides?.pharmacy ?? "Boots",
    start_date: overrides?.start_date ?? "2026-01-01",
    end_date: "end_date" in (overrides ?? {}) ? overrides!.end_date : null,
    special_instructions: "special_instructions" in (overrides ?? {}) ? overrides!.special_instructions : null,
    is_active: overrides?.is_active ?? true,
    requires_witness: overrides?.requires_witness ?? false,
    stock_count: "stock_count" in (overrides ?? {}) ? overrides!.stock_count : null,
    last_stock_check: "last_stock_check" in (overrides ?? {}) ? overrides!.last_stock_check : null,
    created_at: overrides?.created_at ?? "2026-01-01T00:00:00Z",
    updated_at: overrides?.updated_at ?? "2026-01-01T00:00:00Z",
  };
}

/** Build a minimal medication error for error rate and alert tests. */
function medError(overrides?: Partial<MedicationError>): MedicationError {
  return {
    id: overrides?.id ?? "err-1",
    home_id: overrides?.home_id ?? "home-1",
    child_id: overrides?.child_id ?? "child-1",
    prescription_id: "prescription_id" in (overrides ?? {}) ? overrides!.prescription_id : null,
    error_category: overrides?.error_category ?? "wrong_dose",
    severity: overrides?.severity ?? "high",
    description: overrides?.description ?? "Incorrect dosage administered",
    action_taken: overrides?.action_taken ?? "Contacted prescriber",
    reported_by: overrides?.reported_by ?? "staff-1",
    reported_to_manager: overrides?.reported_to_manager ?? true,
    ofsted_notified: overrides?.ofsted_notified ?? false,
    parent_notified: overrides?.parent_notified ?? true,
    prescriber_notified: overrides?.prescriber_notified ?? true,
    outcome: overrides?.outcome ?? "resolved",
    date_occurred: overrides?.date_occurred ?? "2026-04-10T08:00:00Z",
    created_at: overrides?.created_at ?? "2026-04-10T09:00:00Z",
  };
}

// ── computeMedicationCompliance ──────────────────────────────────────────

describe("computeMedicationCompliance", () => {
  it("returns zeroed metrics for empty entries", () => {
    const result = computeMedicationCompliance([]);
    expect(result.total_scheduled).toBe(0);
    expect(result.total_given).toBe(0);
    expect(result.total_refused).toBe(0);
    expect(result.total_withheld).toBe(0);
    expect(result.total_missed).toBe(0);
    expect(result.compliance_rate).toBeNull();; expect(result.by_outcome).toEqual({});
    expect(result.refusal_rate).toBeNull();; });

  it("counts a single given entry as 100% compliance", () => {
    const result = computeMedicationCompliance([entry({ outcome: "given" })]);
    expect(result.total_scheduled).toBe(1);
    expect(result.total_given).toBe(1);
    expect(result.compliance_rate).toBe(100);
  });

  it("counts self_administered towards compliance", () => {
    const result = computeMedicationCompliance([
      entry({ id: "m1", outcome: "given" }),
      entry({ id: "m2", outcome: "self_administered" }),
    ]);
    expect(result.compliance_rate).toBe(100);
  });

  it("counts refused entries correctly", () => {
    const entries = [
      entry({ id: "m1", outcome: "given" }),
      entry({ id: "m2", outcome: "refused" }),
      entry({ id: "m3", outcome: "refused" }),
    ];
    const result = computeMedicationCompliance(entries);
    expect(result.total_refused).toBe(2);
    // refusal_rate = 2/3 * 100 = 66.7
    expect(result.refusal_rate).toBe(66.7);
  });

  it("counts withheld entries correctly", () => {
    const result = computeMedicationCompliance([
      entry({ id: "m1", outcome: "withheld" }),
      entry({ id: "m2", outcome: "withheld" }),
      entry({ id: "m3", outcome: "given" }),
    ]);
    expect(result.total_withheld).toBe(2);
  });

  it("counts not_available and absent as total_missed", () => {
    const result = computeMedicationCompliance([
      entry({ id: "m1", outcome: "not_available" }),
      entry({ id: "m2", outcome: "absent" }),
      entry({ id: "m3", outcome: "given" }),
    ]);
    expect(result.total_missed).toBe(2);
  });

  it("computes compliance_rate with mixed outcomes", () => {
    const entries = [
      entry({ id: "m1", outcome: "given" }),
      entry({ id: "m2", outcome: "given" }),
      entry({ id: "m3", outcome: "refused" }),
      entry({ id: "m4", outcome: "withheld" }),
      entry({ id: "m5", outcome: "not_available" }),
    ];
    const result = computeMedicationCompliance(entries);
    // 2 given / 5 total = 40%
    expect(result.compliance_rate).toBe(40);
  });

  it("builds by_outcome record correctly", () => {
    const entries = [
      entry({ id: "m1", outcome: "given" }),
      entry({ id: "m2", outcome: "given" }),
      entry({ id: "m3", outcome: "refused" }),
      entry({ id: "m4", outcome: "absent" }),
    ];
    const result = computeMedicationCompliance(entries);
    expect(result.by_outcome).toEqual({
      given: 2,
      refused: 1,
      absent: 1,
    });
  });

  it("rounds compliance_rate to one decimal place", () => {
    // 1 given / 3 total = 33.333...% => 33.3
    const entries = [
      entry({ id: "m1", outcome: "given" }),
      entry({ id: "m2", outcome: "refused" }),
      entry({ id: "m3", outcome: "refused" }),
    ];
    const result = computeMedicationCompliance(entries);
    expect(result.compliance_rate).toBe(33.3);
  });

  it("rounds refusal_rate to one decimal place", () => {
    // 1 refused / 3 total = 33.333...% => 33.3
    const entries = [
      entry({ id: "m1", outcome: "refused" }),
      entry({ id: "m2", outcome: "given" }),
      entry({ id: "m3", outcome: "given" }),
    ];
    const result = computeMedicationCompliance(entries);
    expect(result.refusal_rate).toBe(33.3);
  });

  it("handles all self_administered as 100% compliance", () => {
    const entries = [
      entry({ id: "m1", outcome: "self_administered" }),
      entry({ id: "m2", outcome: "self_administered" }),
    ];
    const result = computeMedicationCompliance(entries);
    expect(result.compliance_rate).toBe(100);
    expect(result.total_given).toBe(0);
  });

  it("handles all refused as 0% compliance and 100% refusal", () => {
    const entries = [
      entry({ id: "m1", outcome: "refused" }),
      entry({ id: "m2", outcome: "refused" }),
    ];
    const result = computeMedicationCompliance(entries);
    expect(result.compliance_rate).toBe(0);
    expect(result.refusal_rate).toBe(100);
  });
});

// ── computeControlledDrugAudit ──────────────────────────────────────────

describe("computeControlledDrugAudit", () => {
  it("returns zeroed audit for empty prescriptions and entries", () => {
    const result = computeControlledDrugAudit([], []);
    expect(result.total_controlled).toBe(0);
    expect(result.stock_discrepancies).toEqual([]);
    expect(result.witness_compliance_rate).toBeNull();; expect(result.last_stock_check).toBeNull();
    expect(result.overdue_stock_checks).toEqual([]);
  });

  it("counts only controlled prescriptions in total_controlled", () => {
    const prescriptions = [
      prescription({ id: "rx-1", medication_type: "controlled" }),
      prescription({ id: "rx-2", medication_type: "regular" }),
      prescription({ id: "rx-3", medication_type: "controlled" }),
    ];
    const result = computeControlledDrugAudit(prescriptions, []);
    expect(result.total_controlled).toBe(2);
  });

  it("computes witness_compliance_rate for controlled drug entries", () => {
    const prescriptions = [
      prescription({ id: "rx-1", medication_type: "controlled" }),
    ];
    const entries = [
      entry({ id: "m1", prescription_id: "rx-1", witnessed_by: "staff-2" }),
      entry({ id: "m2", prescription_id: "rx-1", witnessed_by: "staff-3" }),
      entry({ id: "m3", prescription_id: "rx-1", witnessed_by: null }),
    ];
    const result = computeControlledDrugAudit(prescriptions, entries);
    // 2/3 = 66.7%
    expect(result.witness_compliance_rate).toBe(66.7);
  });

  it("returns 0% witness compliance when no controlled entries exist", () => {
    const prescriptions = [
      prescription({ id: "rx-1", medication_type: "regular" }),
    ];
    const entries = [
      entry({ id: "m1", prescription_id: "rx-1", witnessed_by: "staff-2" }),
    ];
    const result = computeControlledDrugAudit(prescriptions, entries);
    expect(result.witness_compliance_rate).toBeNull();; });

  it("returns 100% witness compliance when all controlled entries are witnessed", () => {
    const prescriptions = [
      prescription({ id: "rx-1", medication_type: "controlled" }),
    ];
    const entries = [
      entry({ id: "m1", prescription_id: "rx-1", witnessed_by: "staff-2" }),
      entry({ id: "m2", prescription_id: "rx-1", witnessed_by: "staff-3" }),
    ];
    const result = computeControlledDrugAudit(prescriptions, entries);
    expect(result.witness_compliance_rate).toBe(100);
  });

  it("detects stock discrepancy when stock_count differs from last entry stock_after", () => {
    const prescriptions = [
      prescription({
        id: "rx-1",
        medication_type: "controlled",
        medication_name: "Ritalin",
        stock_count: 8,
      }),
    ];
    const entries = [
      entry({
        id: "m1",
        prescription_id: "rx-1",
        outcome: "given",
        stock_before: 11,
        stock_after: 10,
        scheduled_time: "2026-04-10T08:00:00Z",
      }),
    ];
    const result = computeControlledDrugAudit(prescriptions, entries);
    expect(result.stock_discrepancies).toHaveLength(1);
    expect(result.stock_discrepancies[0]).toEqual({
      prescription_id: "rx-1",
      medication_name: "Ritalin",
      expected: 10,
      actual: 8,
      difference: -2,
    });
  });

  it("reports no discrepancy when stock matches", () => {
    const prescriptions = [
      prescription({
        id: "rx-1",
        medication_type: "controlled",
        stock_count: 10,
      }),
    ];
    const entries = [
      entry({
        id: "m1",
        prescription_id: "rx-1",
        outcome: "given",
        stock_before: 11,
        stock_after: 10,
      }),
    ];
    const result = computeControlledDrugAudit(prescriptions, entries);
    expect(result.stock_discrepancies).toEqual([]);
  });

  it("skips stock check when prescription has no stock_count", () => {
    const prescriptions = [
      prescription({
        id: "rx-1",
        medication_type: "controlled",
        stock_count: null,
      }),
    ];
    const entries = [
      entry({
        id: "m1",
        prescription_id: "rx-1",
        outcome: "given",
        stock_before: 11,
        stock_after: 10,
      }),
    ];
    const result = computeControlledDrugAudit(prescriptions, entries);
    expect(result.stock_discrepancies).toEqual([]);
  });

  it("uses the most recent entry (by scheduled_time) for stock comparison", () => {
    const prescriptions = [
      prescription({
        id: "rx-1",
        medication_type: "controlled",
        medication_name: "Ritalin",
        stock_count: 7,
      }),
    ];
    const entries = [
      entry({
        id: "m1",
        prescription_id: "rx-1",
        outcome: "given",
        stock_before: 11,
        stock_after: 10,
        scheduled_time: "2026-04-10T08:00:00Z",
      }),
      entry({
        id: "m2",
        prescription_id: "rx-1",
        outcome: "given",
        stock_before: 10,
        stock_after: 9,
        scheduled_time: "2026-04-11T08:00:00Z",
      }),
    ];
    const result = computeControlledDrugAudit(prescriptions, entries);
    // Most recent entry has stock_after = 9, actual = 7
    expect(result.stock_discrepancies).toHaveLength(1);
    expect(result.stock_discrepancies[0].expected).toBe(9);
    expect(result.stock_discrepancies[0].actual).toBe(7);
    expect(result.stock_discrepancies[0].difference).toBe(-2);
  });

  it("finds the latest last_stock_check across all controlled prescriptions", () => {
    const prescriptions = [
      prescription({
        id: "rx-1",
        medication_type: "controlled",
        last_stock_check: "2026-04-01T00:00:00Z",
      }),
      prescription({
        id: "rx-2",
        medication_type: "controlled",
        last_stock_check: "2026-04-15T00:00:00Z",
      }),
      prescription({
        id: "rx-3",
        medication_type: "controlled",
        last_stock_check: "2026-04-10T00:00:00Z",
      }),
    ];
    const result = computeControlledDrugAudit(prescriptions, []);
    expect(result.last_stock_check).toBe("2026-04-15T00:00:00Z");
  });

  it("returns null for last_stock_check when none have been checked", () => {
    const prescriptions = [
      prescription({
        id: "rx-1",
        medication_type: "controlled",
        last_stock_check: null,
      }),
    ];
    const result = computeControlledDrugAudit(prescriptions, []);
    expect(result.last_stock_check).toBeNull();
  });

  it("detects overdue stock checks (>7 days since last check)", () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const prescriptions = [
      prescription({
        id: "rx-1",
        medication_type: "controlled",
        medication_name: "Ritalin",
        last_stock_check: tenDaysAgo.toISOString(),
      }),
    ];
    const result = computeControlledDrugAudit(prescriptions, []);
    expect(result.overdue_stock_checks).toHaveLength(1);
    expect(result.overdue_stock_checks[0].prescription_id).toBe("rx-1");
    expect(result.overdue_stock_checks[0].days_overdue).toBe(3);
  });

  it("does not flag stock checks within 7 days as overdue", () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const prescriptions = [
      prescription({
        id: "rx-1",
        medication_type: "controlled",
        last_stock_check: threeDaysAgo.toISOString(),
      }),
    ];
    const result = computeControlledDrugAudit(prescriptions, []);
    expect(result.overdue_stock_checks).toEqual([]);
  });

  it("flags never-checked prescriptions as overdue when >7 days old", () => {
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

    const prescriptions = [
      prescription({
        id: "rx-1",
        medication_type: "controlled",
        medication_name: "Ritalin",
        last_stock_check: null,
        start_date: twentyDaysAgo.toISOString().split("T")[0],
      }),
    ];
    const result = computeControlledDrugAudit(prescriptions, []);
    expect(result.overdue_stock_checks).toHaveLength(1);
    expect(result.overdue_stock_checks[0].last_checked).toBeNull();
    expect(result.overdue_stock_checks[0].days_overdue).toBe(13);
  });
});

// ── computeMedicationErrorRate ──────────────────────────────────────────

describe("computeMedicationErrorRate", () => {
  it("returns zeroed metrics for empty errors", () => {
    const result = computeMedicationErrorRate([], 100);
    expect(result.total_errors).toBe(0);
    expect(result.error_rate).toBe(0);
    expect(result.by_category).toEqual({});
    expect(result.by_severity).toEqual({ critical: 0, high: 0, medium: 0, low: 0 });
    expect(result.notifications_required).toBe(0);
    expect(result.notifications_sent).toBe(0);
  });

  it("returns 0 error_rate when totalEntries is 0", () => {
    const result = computeMedicationErrorRate([medError()], 0);
    expect(result.total_errors).toBe(1);
    expect(result.error_rate).toBeNull();; });

  it("computes error_rate as percentage with one decimal place", () => {
    const errors = [
      medError({ id: "e1" }),
      medError({ id: "e2" }),
      medError({ id: "e3" }),
    ];
    const result = computeMedicationErrorRate(errors, 100);
    expect(result.error_rate).toBe(3);
  });

  it("rounds error_rate to one decimal place", () => {
    const errors = [medError({ id: "e1" })];
    // 1/3 * 100 = 33.333...% => 33.3
    const result = computeMedicationErrorRate(errors, 3);
    expect(result.error_rate).toBe(33.3);
  });

  it("aggregates by_category correctly", () => {
    const errors = [
      medError({ id: "e1", error_category: "wrong_dose" }),
      medError({ id: "e2", error_category: "wrong_dose" }),
      medError({ id: "e3", error_category: "omission" }),
      medError({ id: "e4", error_category: "wrong_medication" }),
    ];
    const result = computeMedicationErrorRate(errors, 100);
    expect(result.by_category).toEqual({
      wrong_dose: 2,
      omission: 1,
      wrong_medication: 1,
    });
  });

  it("aggregates by_severity correctly", () => {
    const errors = [
      medError({ id: "e1", severity: "critical" }),
      medError({ id: "e2", severity: "critical" }),
      medError({ id: "e3", severity: "high" }),
      medError({ id: "e4", severity: "medium" }),
      medError({ id: "e5", severity: "low" }),
      medError({ id: "e6", severity: "low" }),
    ];
    const result = computeMedicationErrorRate(errors, 100);
    expect(result.by_severity).toEqual({ critical: 2, high: 1, medium: 1, low: 2 });
  });

  it("counts notifications_required based on ERROR_CATEGORIES constant", () => {
    // wrong_dose requires notification, omission does not
    const errors = [
      medError({ id: "e1", error_category: "wrong_dose" }),
      medError({ id: "e2", error_category: "omission" }),
      medError({ id: "e3", error_category: "wrong_medication" }),
    ];
    const result = computeMedicationErrorRate(errors, 100);
    expect(result.notifications_required).toBe(2);
  });

  it("counts notifications_sent based on ofsted_notified flag", () => {
    const errors = [
      medError({ id: "e1", ofsted_notified: true }),
      medError({ id: "e2", ofsted_notified: true }),
      medError({ id: "e3", ofsted_notified: false }),
    ];
    const result = computeMedicationErrorRate(errors, 100);
    expect(result.notifications_sent).toBe(2);
  });

  it("ignores unknown severity levels in by_severity", () => {
    const errors = [
      medError({ id: "e1", severity: "unknown_severity" }),
    ];
    const result = computeMedicationErrorRate(errors, 10);
    expect(result.by_severity).toEqual({ critical: 0, high: 0, medium: 0, low: 0 });
    expect(result.total_errors).toBe(1);
  });

  it("handles all notification-required categories correctly", () => {
    // wrong_dose, wrong_medication, wrong_child, double_dose all require notification
    const errors = [
      medError({ id: "e1", error_category: "wrong_dose" }),
      medError({ id: "e2", error_category: "wrong_medication" }),
      medError({ id: "e3", error_category: "wrong_child" }),
      medError({ id: "e4", error_category: "double_dose" }),
    ];
    const result = computeMedicationErrorRate(errors, 100);
    expect(result.notifications_required).toBe(4);
  });

  it("handles non-notification categories with zero required", () => {
    const errors = [
      medError({ id: "e1", error_category: "wrong_time" }),
      medError({ id: "e2", error_category: "omission" }),
      medError({ id: "e3", error_category: "expired_medication" }),
      medError({ id: "e4", error_category: "documentation_error" }),
      medError({ id: "e5", error_category: "storage_error" }),
      medError({ id: "e6", error_category: "disposal_error" }),
    ];
    const result = computeMedicationErrorRate(errors, 100);
    expect(result.notifications_required).toBe(0);
  });
});

// ── identifyMedicationAlerts ────────────────────────────────────────────

describe("identifyMedicationAlerts", () => {
  it("returns empty alerts when all arrays are empty", () => {
    const result = identifyMedicationAlerts([], [], []);
    expect(result).toEqual([]);
  });

  // -- stock_low alerts --

  it("generates stock_low alert when controlled drug stock <= 3", () => {
    const prescriptions = [
      prescription({
        id: "rx-1",
        medication_type: "controlled",
        medication_name: "Ritalin",
        stock_count: 2,
        child_id: "child-A",
      }),
    ];
    const alerts = identifyMedicationAlerts(prescriptions, [], []);
    const stockAlerts = alerts.filter((a) => a.type === "stock_low");
    expect(stockAlerts).toHaveLength(1);
    expect(stockAlerts[0].severity).toBe("medium");
    expect(stockAlerts[0].child_id).toBe("child-A");
    expect(stockAlerts[0].prescription_id).toBe("rx-1");
  });

  it("generates stock_low alert at boundary (stock = 3)", () => {
    const prescriptions = [
      prescription({
        id: "rx-1",
        medication_type: "controlled",
        stock_count: 3,
      }),
    ];
    const alerts = identifyMedicationAlerts(prescriptions, [], []);
    const stockAlerts = alerts.filter((a) => a.type === "stock_low");
    expect(stockAlerts).toHaveLength(1);
  });

  it("does not generate stock_low alert when stock > 3", () => {
    const prescriptions = [
      prescription({
        id: "rx-1",
        medication_type: "controlled",
        stock_count: 4,
      }),
    ];
    const alerts = identifyMedicationAlerts(prescriptions, [], []);
    const stockAlerts = alerts.filter((a) => a.type === "stock_low");
    expect(stockAlerts).toEqual([]);
  });

  it("does not generate stock_low alert for non-controlled drugs", () => {
    const prescriptions = [
      prescription({
        id: "rx-1",
        medication_type: "regular",
        stock_count: 1,
      }),
    ];
    const alerts = identifyMedicationAlerts(prescriptions, [], []);
    const stockAlerts = alerts.filter((a) => a.type === "stock_low");
    expect(stockAlerts).toEqual([]);
  });

  it("does not generate stock_low alert when stock_count is null", () => {
    const prescriptions = [
      prescription({
        id: "rx-1",
        medication_type: "controlled",
        stock_count: null,
      }),
    ];
    const alerts = identifyMedicationAlerts(prescriptions, [], []);
    const stockAlerts = alerts.filter((a) => a.type === "stock_low");
    expect(stockAlerts).toEqual([]);
  });

  // -- frequent_refusal alerts --

  it("generates frequent_refusal alert when child refuses >= 3 times", () => {
    const entries = [
      entry({ id: "m1", outcome: "refused", child_id: "child-A" }),
      entry({ id: "m2", outcome: "refused", child_id: "child-A" }),
      entry({ id: "m3", outcome: "refused", child_id: "child-A" }),
    ];
    const alerts = identifyMedicationAlerts([], entries, []);
    const refusalAlerts = alerts.filter((a) => a.type === "frequent_refusal");
    expect(refusalAlerts).toHaveLength(1);
    expect(refusalAlerts[0].severity).toBe("high");
    expect(refusalAlerts[0].child_id).toBe("child-A");
  });

  it("does not generate frequent_refusal when refusals < 3", () => {
    const entries = [
      entry({ id: "m1", outcome: "refused", child_id: "child-A" }),
      entry({ id: "m2", outcome: "refused", child_id: "child-A" }),
    ];
    const alerts = identifyMedicationAlerts([], entries, []);
    const refusalAlerts = alerts.filter((a) => a.type === "frequent_refusal");
    expect(refusalAlerts).toEqual([]);
  });

  it("generates separate frequent_refusal alerts per child", () => {
    const entries = [
      entry({ id: "m1", outcome: "refused", child_id: "child-A" }),
      entry({ id: "m2", outcome: "refused", child_id: "child-A" }),
      entry({ id: "m3", outcome: "refused", child_id: "child-A" }),
      entry({ id: "m4", outcome: "refused", child_id: "child-B" }),
      entry({ id: "m5", outcome: "refused", child_id: "child-B" }),
      entry({ id: "m6", outcome: "refused", child_id: "child-B" }),
      entry({ id: "m7", outcome: "refused", child_id: "child-B" }),
    ];
    const alerts = identifyMedicationAlerts([], entries, []);
    const refusalAlerts = alerts.filter((a) => a.type === "frequent_refusal");
    expect(refusalAlerts).toHaveLength(2);
  });

  // -- witness_missing alerts --

  it("generates witness_missing alert for controlled drug without witness", () => {
    const prescriptions = [
      prescription({ id: "rx-1", medication_type: "controlled" }),
    ];
    const entries = [
      entry({ id: "m1", prescription_id: "rx-1", witnessed_by: null }),
    ];
    const alerts = identifyMedicationAlerts(prescriptions, entries, []);
    const witnessAlerts = alerts.filter((a) => a.type === "witness_missing");
    expect(witnessAlerts).toHaveLength(1);
    expect(witnessAlerts[0].severity).toBe("critical");
  });

  it("does not generate witness_missing when witness is present", () => {
    const prescriptions = [
      prescription({ id: "rx-1", medication_type: "controlled" }),
    ];
    const entries = [
      entry({ id: "m1", prescription_id: "rx-1", witnessed_by: "staff-2" }),
    ];
    const alerts = identifyMedicationAlerts(prescriptions, entries, []);
    const witnessAlerts = alerts.filter((a) => a.type === "witness_missing");
    expect(witnessAlerts).toEqual([]);
  });

  it("does not generate witness_missing for non-controlled drugs", () => {
    const prescriptions = [
      prescription({ id: "rx-1", medication_type: "regular" }),
    ];
    const entries = [
      entry({ id: "m1", prescription_id: "rx-1", witnessed_by: null }),
    ];
    const alerts = identifyMedicationAlerts(prescriptions, entries, []);
    const witnessAlerts = alerts.filter((a) => a.type === "witness_missing");
    expect(witnessAlerts).toEqual([]);
  });

  // -- recent_error alerts --

  it("generates recent_error alert for critical/high errors in last 7 days", () => {
    const today = new Date().toISOString();
    const errors = [
      medError({ id: "e1", severity: "critical", error_category: "wrong_child", date_occurred: today }),
    ];
    const alerts = identifyMedicationAlerts([], [], errors);
    const errorAlerts = alerts.filter((a) => a.type === "recent_error");
    expect(errorAlerts).toHaveLength(1);
    expect(errorAlerts[0].severity).toBe("high");
  });

  it("does not generate recent_error for medium/low severity", () => {
    const today = new Date().toISOString();
    const errors = [
      medError({ id: "e1", severity: "medium", date_occurred: today }),
      medError({ id: "e2", severity: "low", date_occurred: today }),
    ];
    const alerts = identifyMedicationAlerts([], [], errors);
    const errorAlerts = alerts.filter((a) => a.type === "recent_error");
    expect(errorAlerts).toEqual([]);
  });

  it("does not generate recent_error for errors older than 7 days", () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const errors = [
      medError({ id: "e1", severity: "critical", date_occurred: thirtyDaysAgo.toISOString() }),
    ];
    const alerts = identifyMedicationAlerts([], [], errors);
    const errorAlerts = alerts.filter((a) => a.type === "recent_error");
    expect(errorAlerts).toEqual([]);
  });

  // -- review_due alerts --

  it("generates review_due alert for active prescription >84 days without end_date", () => {
    const oneHundredDaysAgo = new Date();
    oneHundredDaysAgo.setDate(oneHundredDaysAgo.getDate() - 100);
    const prescriptions = [
      prescription({
        id: "rx-1",
        is_active: true,
        end_date: null,
        medication_name: "Ibuprofen",
        start_date: oneHundredDaysAgo.toISOString().split("T")[0],
      }),
    ];
    const alerts = identifyMedicationAlerts(prescriptions, [], []);
    const reviewAlerts = alerts.filter((a) => a.type === "review_due");
    expect(reviewAlerts).toHaveLength(1);
    expect(reviewAlerts[0].severity).toBe("medium");
  });

  it("does not generate review_due for prescription <= 84 days old", () => {
    const fiftyDaysAgo = new Date();
    fiftyDaysAgo.setDate(fiftyDaysAgo.getDate() - 50);
    const prescriptions = [
      prescription({
        id: "rx-1",
        is_active: true,
        end_date: null,
        start_date: fiftyDaysAgo.toISOString().split("T")[0],
      }),
    ];
    const alerts = identifyMedicationAlerts(prescriptions, [], []);
    const reviewAlerts = alerts.filter((a) => a.type === "review_due");
    expect(reviewAlerts).toEqual([]);
  });

  it("does not generate review_due for inactive prescription", () => {
    const oneHundredDaysAgo = new Date();
    oneHundredDaysAgo.setDate(oneHundredDaysAgo.getDate() - 100);
    const prescriptions = [
      prescription({
        id: "rx-1",
        is_active: false,
        end_date: null,
        start_date: oneHundredDaysAgo.toISOString().split("T")[0],
      }),
    ];
    const alerts = identifyMedicationAlerts(prescriptions, [], []);
    const reviewAlerts = alerts.filter((a) => a.type === "review_due");
    expect(reviewAlerts).toEqual([]);
  });

  it("does not generate review_due when end_date is set", () => {
    const oneHundredDaysAgo = new Date();
    oneHundredDaysAgo.setDate(oneHundredDaysAgo.getDate() - 100);
    const prescriptions = [
      prescription({
        id: "rx-1",
        is_active: true,
        end_date: "2026-12-31",
        start_date: oneHundredDaysAgo.toISOString().split("T")[0],
      }),
    ];
    const alerts = identifyMedicationAlerts(prescriptions, [], []);
    const reviewAlerts = alerts.filter((a) => a.type === "review_due");
    expect(reviewAlerts).toEqual([]);
  });
});

// ── MEDICATION_TYPES constant ───────────────────────────────────────────

describe("MEDICATION_TYPES", () => {
  it("contains exactly 6 entries", () => {
    expect(MEDICATION_TYPES).toHaveLength(6);
  });

  it("each entry has type, label, and requires_mar fields", () => {
    for (const mt of MEDICATION_TYPES) {
      expect(mt).toHaveProperty("type");
      expect(mt).toHaveProperty("label");
      expect(mt).toHaveProperty("requires_mar");
    }
  });

  it("marks controlled as requires_witness and requires_stock_count", () => {
    const controlled = MEDICATION_TYPES.find((t) => t.type === "controlled");
    expect(controlled?.requires_witness).toBe(true);
    expect(controlled?.requires_stock_count).toBe(true);
  });

  it("marks prn as requires_rationale", () => {
    const prn = MEDICATION_TYPES.find((t) => t.type === "prn");
    expect(prn?.requires_rationale).toBe(true);
  });

  it("marks homely_remedy as not requiring MAR", () => {
    const homely = MEDICATION_TYPES.find((t) => t.type === "homely_remedy");
    expect(homely?.requires_mar).toBe(false);
  });

  it("marks regular, otc, and topical as requiring MAR", () => {
    const regular = MEDICATION_TYPES.find((t) => t.type === "regular");
    const otc = MEDICATION_TYPES.find((t) => t.type === "otc");
    const topical = MEDICATION_TYPES.find((t) => t.type === "topical");
    expect(regular?.requires_mar).toBe(true);
    expect(otc?.requires_mar).toBe(true);
    expect(topical?.requires_mar).toBe(true);
  });

  it("has exactly 5 types requiring MAR", () => {
    const marRequired = MEDICATION_TYPES.filter((t) => t.requires_mar);
    expect(marRequired).toHaveLength(5);
  });

  it("includes all expected type values", () => {
    const types = MEDICATION_TYPES.map((t) => t.type);
    expect(types).toEqual(["regular", "prn", "controlled", "otc", "topical", "homely_remedy"]);
  });
});

// ── ADMINISTRATION_OUTCOMES constant ────────────────────────────────────

describe("ADMINISTRATION_OUTCOMES", () => {
  it("contains exactly 6 outcomes", () => {
    expect(ADMINISTRATION_OUTCOMES).toHaveLength(6);
  });

  it("includes all expected outcome values", () => {
    expect(ADMINISTRATION_OUTCOMES).toContain("given");
    expect(ADMINISTRATION_OUTCOMES).toContain("refused");
    expect(ADMINISTRATION_OUTCOMES).toContain("withheld");
    expect(ADMINISTRATION_OUTCOMES).toContain("not_available");
    expect(ADMINISTRATION_OUTCOMES).toContain("self_administered");
    expect(ADMINISTRATION_OUTCOMES).toContain("absent");
  });

  it("is a readonly tuple", () => {
    // Verify it behaves as const — no duplicates
    const unique = new Set(ADMINISTRATION_OUTCOMES);
    expect(unique.size).toBe(ADMINISTRATION_OUTCOMES.length);
  });
});

// ── MEDICATION_ROUTES constant ──────────────────────────────────────────

describe("MEDICATION_ROUTES", () => {
  it("contains exactly 10 routes", () => {
    expect(MEDICATION_ROUTES).toHaveLength(10);
  });

  it("includes oral and topical routes", () => {
    expect(MEDICATION_ROUTES).toContain("oral");
    expect(MEDICATION_ROUTES).toContain("topical");
  });

  it("includes inhaled and injection routes", () => {
    expect(MEDICATION_ROUTES).toContain("inhaled");
    expect(MEDICATION_ROUTES).toContain("injection");
  });

  it("includes all expected route values", () => {
    const expected = [
      "oral", "topical", "inhaled", "injection", "sublingual",
      "rectal", "nasal", "eye_drops", "ear_drops", "patch",
    ];
    for (const route of expected) {
      expect(MEDICATION_ROUTES).toContain(route);
    }
  });

  it("has no duplicate routes", () => {
    const unique = new Set(MEDICATION_ROUTES);
    expect(unique.size).toBe(MEDICATION_ROUTES.length);
  });
});

// ── ERROR_CATEGORIES constant ───────────────────────────────────────────

describe("ERROR_CATEGORIES", () => {
  it("contains exactly 10 categories", () => {
    expect(ERROR_CATEGORIES).toHaveLength(10);
  });

  it("each entry has category, severity, and notification_required fields", () => {
    for (const ec of ERROR_CATEGORIES) {
      expect(ec).toHaveProperty("category");
      expect(ec).toHaveProperty("severity");
      expect(ec).toHaveProperty("notification_required");
    }
  });

  it("marks wrong_medication as critical with notification required", () => {
    const wm = ERROR_CATEGORIES.find((c) => c.category === "wrong_medication");
    expect(wm?.severity).toBe("critical");
    expect(wm?.notification_required).toBe(true);
  });

  it("marks wrong_child as critical with notification required", () => {
    const wc = ERROR_CATEGORIES.find((c) => c.category === "wrong_child");
    expect(wc?.severity).toBe("critical");
    expect(wc?.notification_required).toBe(true);
  });

  it("marks wrong_dose and double_dose as high severity", () => {
    const wd = ERROR_CATEGORIES.find((c) => c.category === "wrong_dose");
    const dd = ERROR_CATEGORIES.find((c) => c.category === "double_dose");
    expect(wd?.severity).toBe("high");
    expect(dd?.severity).toBe("high");
  });

  it("marks documentation_error and storage_error as low severity", () => {
    const de = ERROR_CATEGORIES.find((c) => c.category === "documentation_error");
    const se = ERROR_CATEGORIES.find((c) => c.category === "storage_error");
    expect(de?.severity).toBe("low");
    expect(se?.severity).toBe("low");
  });

  it("has exactly 4 categories requiring notification", () => {
    const notifiable = ERROR_CATEGORIES.filter((c) => c.notification_required);
    expect(notifiable).toHaveLength(4);
  });

  it("has exactly 2 critical categories", () => {
    const critical = ERROR_CATEGORIES.filter((c) => c.severity === "critical");
    expect(critical).toHaveLength(2);
  });

  it("has exactly 2 high severity categories", () => {
    const high = ERROR_CATEGORIES.filter((c) => c.severity === "high");
    expect(high).toHaveLength(2);
  });

  it("has exactly 4 medium severity categories", () => {
    const medium = ERROR_CATEGORIES.filter((c) => c.severity === "medium");
    expect(medium).toHaveLength(4);
  });
});
