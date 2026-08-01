import { describe, it, expect } from "vitest";
import {
  computeMedicationAuditMetrics,
  identifyMedicationAuditAlerts,
  type MedicationAuditRecord,
} from "./medication-audit-service";

function makeRecord(
  overrides: Partial<MedicationAuditRecord> = {},
): MedicationAuditRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    audit_type: "storage_audit",
    audit_date: "2026-05-20",
    audit_outcome: "satisfactory",
    storage_condition: "appropriate",
    discrepancy_level: "none",
    controlled_drugs_checked: true,
    all_drugs_accounted: true,
    fridge_temperature_in_range: true,
    cabinet_locked: true,
    keys_secure: true,
    mar_charts_accurate: true,
    expiry_dates_checked: true,
    expired_items_found: false,
    disposal_witnessed: true,
    pharmacy_contacted: false,
    gp_informed: false,
    stock_count_accurate: true,
    items_checked: 20,
    discrepancies_found: 0,
    fridge_temperature: 4.5,
    audited_by: "Staff A",
    witnessed_by: "Staff B",
    issues_found: [],
    actions_taken: [],
    next_audit_date: null,
    notes: null,
    created_at: "2026-05-20T10:00:00Z",
    updated_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

describe("computeMedicationAuditMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMedicationAuditMetrics([]);
    expect(m.total_audits).toBe(0);
    expect(m.satisfactory_rate).toBeNull();;
    expect(m.failed_count).toBe(0);
    expect(m.total_discrepancies).toBe(0);
    expect(m.average_items_checked).toBeNull();;
  });

  it("computes correct counts and rates for populated data", () => {
    const records = [
      makeRecord({ id: "1", audit_type: "controlled_drug_count", audit_outcome: "satisfactory", items_checked: 10, discrepancies_found: 0 }),
      makeRecord({ id: "2", audit_type: "storage_audit", audit_outcome: "failed", items_checked: 15, discrepancies_found: 3, expired_items_found: true }),
      makeRecord({ id: "3", audit_type: "fridge_temperature", audit_outcome: "minor_issues", items_checked: 5, discrepancies_found: 1, discrepancy_level: "minor" }),
    ];
    const m = computeMedicationAuditMetrics(records);
    expect(m.total_audits).toBe(3);
    expect(m.satisfactory_rate).toBe(33.3);
    expect(m.failed_count).toBe(1);
    expect(m.major_issues_count).toBe(0);
    expect(m.controlled_drug_count).toBe(1);
    expect(m.storage_audit_count).toBe(1);
    expect(m.fridge_check_count).toBe(1);
    expect(m.expired_items_found_count).toBe(1);
    expect(m.total_discrepancies).toBe(4); // 0+3+1
    expect(m.average_items_checked).toBe(10); // (10+15+5)/3
    expect(m.by_audit_type["controlled_drug_count"]).toBe(1);
    expect(m.by_audit_outcome["failed"]).toBe(1);
    // no_discrepancy_rate: 2 out of 3 have "none"
    expect(m.no_discrepancy_rate).toBe(66.7);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", cabinet_locked: true, keys_secure: true }),
      makeRecord({ id: "2", cabinet_locked: false, keys_secure: false }),
    ];
    const m = computeMedicationAuditMetrics(records);
    expect(m.cabinet_locked_rate).toBe(50);
    expect(m.keys_secure_rate).toBe(50);
  });
});

describe("identifyMedicationAuditAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyMedicationAuditAlerts([])).toHaveLength(0);
  });

  it("triggers controlled_drug_discrepancy (critical) when CD count has critical discrepancy", () => {
    const records = [
      makeRecord({ id: "a1", audit_type: "controlled_drug_count", discrepancy_level: "critical" }),
    ];
    const alerts = identifyMedicationAuditAlerts(records);
    const a = alerts.find((x) => x.type === "controlled_drug_discrepancy");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("does NOT trigger controlled_drug_discrepancy for non-CD audit types with critical discrepancy", () => {
    const records = [
      makeRecord({ id: "a1", audit_type: "storage_audit", discrepancy_level: "critical" }),
    ];
    const alerts = identifyMedicationAuditAlerts(records);
    expect(alerts.find((x) => x.type === "controlled_drug_discrepancy")).toBeUndefined();
  });

  it("triggers failed_audit (high) when >= 1 audit has failed outcome", () => {
    const records = [
      makeRecord({ id: "a2", audit_outcome: "failed" }),
    ];
    const alerts = identifyMedicationAuditAlerts(records);
    const a = alerts.find((x) => x.type === "failed_audit");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers cabinet_unlocked (high) when >= 1 audit finds cabinet unlocked", () => {
    const records = [
      makeRecord({ id: "a3", cabinet_locked: false }),
    ];
    const alerts = identifyMedicationAuditAlerts(records);
    const a = alerts.find((x) => x.type === "cabinet_unlocked");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers expired_medication (high) when >= 1 audit finds expired items", () => {
    const records = [
      makeRecord({ id: "a4", expired_items_found: true }),
    ];
    const alerts = identifyMedicationAuditAlerts(records);
    const a = alerts.find((x) => x.type === "expired_medication");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers fridge_out_of_range (medium) when >= 2 fridge checks out of range", () => {
    const records = [
      makeRecord({ id: "1", audit_type: "fridge_temperature", fridge_temperature_in_range: false }),
      makeRecord({ id: "2", audit_type: "fridge_temperature", fridge_temperature_in_range: false }),
    ];
    const alerts = identifyMedicationAuditAlerts(records);
    const a = alerts.find((x) => x.type === "fridge_out_of_range");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });

  it("does NOT trigger fridge_out_of_range when only 1 fridge check is out of range", () => {
    const records = [
      makeRecord({ id: "1", audit_type: "fridge_temperature", fridge_temperature_in_range: false }),
    ];
    const alerts = identifyMedicationAuditAlerts(records);
    expect(alerts.find((x) => x.type === "fridge_out_of_range")).toBeUndefined();
  });

  it("does NOT trigger fridge_out_of_range for non-fridge audit types", () => {
    const records = [
      makeRecord({ id: "1", audit_type: "storage_audit", fridge_temperature_in_range: false }),
      makeRecord({ id: "2", audit_type: "storage_audit", fridge_temperature_in_range: false }),
    ];
    const alerts = identifyMedicationAuditAlerts(records);
    expect(alerts.find((x) => x.type === "fridge_out_of_range")).toBeUndefined();
  });
});
