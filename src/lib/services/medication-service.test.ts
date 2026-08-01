import { describe, it, expect } from "vitest";
import {
  computeMedicationCompliance,
  computeControlledDrugAudit,
  computeMedicationErrorRate,
  identifyMedicationAlerts,
  type MAREntry,
  type MedicationPrescription,
  type MedicationError,
} from "./medication-service";

function makeEntry(overrides: Partial<MAREntry> = {}): MAREntry {
  return {
    id: "mar-1",
    prescription_id: "rx-1",
    child_id: "child-1",
    home_id: "home-1",
    scheduled_time: "2026-05-01T08:00:00Z",
    administered_at: "2026-05-01T08:05:00Z",
    administered_by: "Staff A",
    witnessed_by: "Staff B",
    outcome: "given",
    dosage_given: "5mg",
    stock_before: 10,
    stock_after: 9,
    prn_rationale: null,
    notes: null,
    created_at: "2026-05-01T08:05:00Z",
    ...overrides,
  };
}

function makePrescription(overrides: Partial<MedicationPrescription> = {}): MedicationPrescription {
  return {
    id: "rx-1",
    home_id: "home-1",
    child_id: "child-1",
    medication_name: "Methylphenidate",
    dosage: "10mg",
    frequency: "twice daily",
    route: "oral",
    medication_type: "controlled",
    prescriber: "Dr Smith",
    pharmacy: "Boots",
    start_date: "2026-01-01",
    end_date: null,
    special_instructions: null,
    is_active: true,
    requires_witness: true,
    stock_count: 9,
    last_stock_check: "2026-05-20",
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

function makeMedError(overrides: Partial<MedicationError> = {}): MedicationError {
  return {
    id: "err-1",
    home_id: "home-1",
    child_id: "child-1",
    prescription_id: null,
    error_category: "wrong_dose",
    severity: "high",
    description: "Wrong dose given",
    action_taken: "Contacted GP",
    reported_by: "Staff A",
    reported_to_manager: true,
    ofsted_notified: true,
    parent_notified: true,
    prescriber_notified: true,
    outcome: "No harm",
    date_occurred: "2026-05-20",
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

describe("computeMedicationCompliance", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMedicationCompliance([]);
    expect(m.total_scheduled).toBe(0);
    expect(m.total_given).toBe(0);
    expect(m.compliance_rate).toBeNull();; expect(m.refusal_rate).toBeNull();; });

  it("computes correct counts and rates", () => {
    const entries = [
      makeEntry({ id: "m1", outcome: "given" }),
      makeEntry({ id: "m2", outcome: "given" }),
      makeEntry({ id: "m3", outcome: "refused" }),
      makeEntry({ id: "m4", outcome: "self_administered" }),
      makeEntry({ id: "m5", outcome: "not_available" }),
    ];
    const m = computeMedicationCompliance(entries);
    expect(m.total_scheduled).toBe(5);
    expect(m.total_given).toBe(2);
    expect(m.total_refused).toBe(1);
    // compliance: (given 2 + self_administered 1) / 5 = 60%
    expect(m.compliance_rate).toBe(60);
    // refusal: 1/5 = 20%
    expect(m.refusal_rate).toBe(20);
    expect(m.total_missed).toBe(1); // not_available
  });
});

describe("computeControlledDrugAudit", () => {
  it("returns zeroes for empty data", () => {
    const m = computeControlledDrugAudit([], []);
    expect(m.total_controlled).toBe(0);
    expect(m.stock_discrepancies).toEqual([]);
    expect(m.witness_compliance_rate).toBeNull();; expect(m.last_stock_check).toBeNull();
    expect(m.overdue_stock_checks).toEqual([]);
  });

  it("detects stock discrepancy", () => {
    const prescriptions = [makePrescription({ stock_count: 7 })]; // actual = 7
    const entries = [makeEntry({ stock_before: 10, stock_after: 9 })]; // expected = 9
    const m = computeControlledDrugAudit(prescriptions, entries);
    expect(m.stock_discrepancies).toHaveLength(1);
    expect(m.stock_discrepancies[0].expected).toBe(9);
    expect(m.stock_discrepancies[0].actual).toBe(7);
    expect(m.stock_discrepancies[0].difference).toBe(-2);
  });

  it("calculates witness compliance rate", () => {
    const prescriptions = [makePrescription()];
    const entries = [
      makeEntry({ id: "m1", witnessed_by: "Staff B" }),
      makeEntry({ id: "m2", witnessed_by: null }),
    ];
    const m = computeControlledDrugAudit(prescriptions, entries);
    expect(m.witness_compliance_rate).toBe(50);
  });
});

describe("computeMedicationErrorRate", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMedicationErrorRate([], 0);
    expect(m.total_errors).toBe(0);
    expect(m.error_rate).toBeNull();; });

  it("computes rate and severity breakdown", () => {
    const errors = [
      makeMedError({ error_category: "wrong_dose", severity: "high" }),
      makeMedError({ id: "e2", error_category: "wrong_medication", severity: "critical", ofsted_notified: false }),
    ];
    const m = computeMedicationErrorRate(errors, 100);
    expect(m.total_errors).toBe(2);
    expect(m.error_rate).toBe(2); // 2/100 * 100 = 2%
    expect(m.by_severity.high).toBe(1);
    expect(m.by_severity.critical).toBe(1);
    // notification: wrong_dose and wrong_medication both require notification = 2
    expect(m.notifications_required).toBe(2);
    expect(m.notifications_sent).toBe(1); // only first has ofsted_notified
  });
});

describe("identifyMedicationAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(identifyMedicationAlerts([], [], [])).toEqual([]);
  });

  it("fires medium alert for stock_low when stock_count <= 3", () => {
    const prescriptions = [makePrescription({ stock_count: 3 })];
    const alerts = identifyMedicationAlerts(prescriptions, [], []);
    const match = alerts.find((a) => a.type === "stock_low");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("fires critical alert for witness_missing on controlled drug without witness", () => {
    const prescriptions = [makePrescription()];
    const entries = [makeEntry({ witnessed_by: null })];
    const alerts = identifyMedicationAlerts(prescriptions, entries, []);
    const match = alerts.find((a) => a.type === "witness_missing");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for frequent_refusal when >= 3 refusals for same child", () => {
    const prescriptions: MedicationPrescription[] = [];
    const entries = [
      makeEntry({ id: "m1", outcome: "refused", child_id: "child-1" }),
      makeEntry({ id: "m2", outcome: "refused", child_id: "child-1" }),
      makeEntry({ id: "m3", outcome: "refused", child_id: "child-1" }),
    ];
    const alerts = identifyMedicationAlerts(prescriptions, entries, []);
    const match = alerts.find((a) => a.type === "frequent_refusal");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });
});
