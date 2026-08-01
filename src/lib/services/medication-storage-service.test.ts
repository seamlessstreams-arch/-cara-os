import { describe, it, expect } from "vitest";
import {
  computeMedicationStorageMetrics,
  identifyMedicationStorageAlerts,
  type MedicationStorageRecord,
} from "./medication-storage-service";

function makeRecord(overrides: Partial<MedicationStorageRecord> = {}): MedicationStorageRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    storage_type: "general_medication_cabinet",
    check_type: "daily_check",
    storage_condition: "satisfactory",
    temperature_status: "in_range",
    check_date: "2026-05-01",
    storage_location: "Medication Room",
    temperature_reading: 4.5,
    min_temperature: 2.0,
    max_temperature: 8.0,
    cabinet_locked: true,
    keys_secure: true,
    controlled_drugs_counted: true,
    all_drugs_accounted: true,
    expired_items_found: false,
    items_in_date: true,
    storage_clean: true,
    labels_legible: true,
    correct_storage_conditions: true,
    ventilation_adequate: true,
    access_restricted: true,
    disposal_needed: false,
    items_checked: 20,
    discrepancies_found: 0,
    issues_found: [],
    actions_taken: [],
    checked_by: "Staff A",
    witnessed_by: "Staff B",
    next_check_date: "2026-05-02",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeMedicationStorageMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMedicationStorageMetrics([]);
    expect(m.total_checks).toBe(0);
    expect(m.satisfactory_count).toBe(0);
    expect(m.unsatisfactory_count).toBe(0);
    expect(m.satisfactory_rate).toBeNull();; expect(m.in_range_count).toBe(0);
    expect(m.average_temperature).toBeNull();; expect(m.total_items_checked).toBe(0);
    expect(m.total_discrepancies).toBe(0);
  });

  it("computes correct counts and rates for populated data", () => {
    const records = [
      makeRecord({ id: "r1", storage_condition: "satisfactory", temperature_status: "in_range", items_checked: 10, discrepancies_found: 0, temperature_reading: 4.0 }),
      makeRecord({ id: "r2", storage_condition: "unsatisfactory", temperature_status: "above_range", items_checked: 15, discrepancies_found: 2, temperature_reading: 10.0, expired_items_found: true, disposal_needed: true }),
      makeRecord({ id: "r3", storage_condition: "minor_issues", temperature_status: "below_range", items_checked: 5, discrepancies_found: 1, temperature_reading: 1.0, cabinet_locked: false, storage_clean: false }),
    ];
    const m = computeMedicationStorageMetrics(records);
    expect(m.total_checks).toBe(3);
    expect(m.satisfactory_count).toBe(1);
    expect(m.unsatisfactory_count).toBe(1);
    // satisfactory_rate: 1/3 = 33.3
    expect(m.satisfactory_rate).toBe(33.3);
    expect(m.in_range_count).toBe(1);
    expect(m.out_of_range_count).toBe(2);
    // temperature_in_range_rate: 1/3 (all have valid temp status) = 33.3
    expect(m.temperature_in_range_rate).toBe(33.3);
    expect(m.total_items_checked).toBe(30);
    expect(m.total_discrepancies).toBe(3);
    expect(m.expired_items_count).toBe(1);
    expect(m.disposal_needed_count).toBe(1);
    // average_temperature: (4 + 10 + 1) / 3 = 5.0
    expect(m.average_temperature).toBe(5);
    // cabinet_locked: 2/3 = 66.7
    expect(m.cabinet_locked_rate).toBe(66.7);
  });

  it("builds breakdowns by storage_type and check_type", () => {
    const records = [
      makeRecord({ storage_type: "fridge_storage", check_type: "temperature_check" }),
      makeRecord({ id: "r2", storage_type: "fridge_storage", check_type: "temperature_check" }),
      makeRecord({ id: "r3", storage_type: "controlled_drug_cupboard", check_type: "stock_count" }),
    ];
    const m = computeMedicationStorageMetrics(records);
    expect(m.by_storage_type).toEqual({ fridge_storage: 2, controlled_drug_cupboard: 1 });
    expect(m.by_check_type).toEqual({ temperature_check: 2, stock_count: 1 });
  });
});

describe("identifyMedicationStorageAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(identifyMedicationStorageAlerts([])).toEqual([]);
  });

  it("returns empty array when no alert conditions are met", () => {
    const records = [makeRecord()];
    expect(identifyMedicationStorageAlerts(records)).toEqual([]);
  });

  it("fires critical alert for controlled_drug_unlocked", () => {
    const records = [makeRecord({ storage_type: "controlled_drug_cupboard", cabinet_locked: false })];
    const alerts = identifyMedicationStorageAlerts(records);
    const match = alerts.find((a) => a.type === "controlled_drug_unlocked");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires critical alert for drugs_not_accounted when >= 1 controlled drug cupboard check", () => {
    const records = [makeRecord({ storage_type: "controlled_drug_cupboard", all_drugs_accounted: false })];
    const alerts = identifyMedicationStorageAlerts(records);
    const match = alerts.find((a) => a.type === "drugs_not_accounted");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for temperature_out_of_range when >= 1", () => {
    const records = [makeRecord({ temperature_status: "above_range" })];
    const alerts = identifyMedicationStorageAlerts(records);
    const match = alerts.find((a) => a.type === "temperature_out_of_range");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for expired_items when >= 1", () => {
    const records = [makeRecord({ expired_items_found: true })];
    const alerts = identifyMedicationStorageAlerts(records);
    const match = alerts.find((a) => a.type === "expired_items");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for storage_not_clean when >= 3", () => {
    // Only 2 — should NOT trigger
    expect(
      identifyMedicationStorageAlerts([
        makeRecord({ id: "r1", storage_clean: false }),
        makeRecord({ id: "r2", storage_clean: false }),
      ]).find((a) => a.type === "storage_not_clean"),
    ).toBeUndefined();
    // 3 — should trigger
    const records = [
      makeRecord({ id: "r1", storage_clean: false }),
      makeRecord({ id: "r2", storage_clean: false }),
      makeRecord({ id: "r3", storage_clean: false }),
    ];
    const alerts = identifyMedicationStorageAlerts(records);
    const match = alerts.find((a) => a.type === "storage_not_clean");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});
