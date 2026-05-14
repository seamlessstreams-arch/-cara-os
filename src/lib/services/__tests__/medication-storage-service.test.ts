import { describe, it, expect } from "vitest";
import { _testing, type MedicationStorageRecord } from "../medication-storage-service";

const { computeMedicationStorageMetrics, identifyMedicationStorageAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<MedicationStorageRecord>): MedicationStorageRecord {
  return {
    id: overrides?.id ?? "s-1",
    home_id: overrides?.home_id ?? "home-1",
    storage_type: overrides?.storage_type ?? "general_medication_cabinet",
    check_type: overrides?.check_type ?? "daily_check",
    storage_condition: overrides?.storage_condition ?? "satisfactory",
    temperature_status: overrides?.temperature_status ?? "in_range",
    check_date: overrides?.check_date ?? now.toISOString().split("T")[0],
    storage_location: overrides?.storage_location ?? "Main Office",
    temperature_reading: "temperature_reading" in (overrides ?? {}) ? (overrides!.temperature_reading ?? null) : 5.0,
    min_temperature: "min_temperature" in (overrides ?? {}) ? (overrides!.min_temperature ?? null) : 2.0,
    max_temperature: "max_temperature" in (overrides ?? {}) ? (overrides!.max_temperature ?? null) : 8.0,
    cabinet_locked: overrides?.cabinet_locked ?? true,
    keys_secure: overrides?.keys_secure ?? true,
    controlled_drugs_counted: overrides?.controlled_drugs_counted ?? true,
    all_drugs_accounted: overrides?.all_drugs_accounted ?? true,
    expired_items_found: overrides?.expired_items_found ?? false,
    items_in_date: overrides?.items_in_date ?? true,
    storage_clean: overrides?.storage_clean ?? true,
    labels_legible: overrides?.labels_legible ?? true,
    correct_storage_conditions: overrides?.correct_storage_conditions ?? true,
    ventilation_adequate: overrides?.ventilation_adequate ?? true,
    access_restricted: overrides?.access_restricted ?? true,
    disposal_needed: overrides?.disposal_needed ?? false,
    items_checked: overrides?.items_checked ?? 10,
    discrepancies_found: overrides?.discrepancies_found ?? 0,
    issues_found: overrides?.issues_found ?? [],
    actions_taken: overrides?.actions_taken ?? [],
    checked_by: overrides?.checked_by ?? "Staff A",
    witnessed_by: "witnessed_by" in (overrides ?? {}) ? (overrides!.witnessed_by ?? null) : null,
    next_check_date: "next_check_date" in (overrides ?? {}) ? (overrides!.next_check_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("medication-storage-service", () => {
  describe("computeMedicationStorageMetrics", () => {
    describe("empty records", () => {
      it("returns zeros for all fields", () => {
        const m = computeMedicationStorageMetrics([]);
        expect(m.total_checks).toBe(0);
        expect(m.satisfactory_count).toBe(0);
        expect(m.unsatisfactory_count).toBe(0);
        expect(m.satisfactory_rate).toBe(0);
        expect(m.in_range_count).toBe(0);
        expect(m.out_of_range_count).toBe(0);
        expect(m.temperature_in_range_rate).toBe(0);
        expect(m.cabinet_locked_rate).toBe(0);
        expect(m.keys_secure_rate).toBe(0);
        expect(m.all_drugs_accounted_rate).toBe(0);
        expect(m.items_in_date_rate).toBe(0);
        expect(m.storage_clean_rate).toBe(0);
        expect(m.correct_conditions_rate).toBe(0);
        expect(m.access_restricted_rate).toBe(0);
        expect(m.expired_items_count).toBe(0);
        expect(m.disposal_needed_count).toBe(0);
        expect(m.total_items_checked).toBe(0);
        expect(m.total_discrepancies).toBe(0);
        expect(m.average_temperature).toBe(0);
      });

      it("returns empty breakdowns", () => {
        const m = computeMedicationStorageMetrics([]);
        expect(m.by_storage_type).toEqual({});
        expect(m.by_check_type).toEqual({});
        expect(m.by_storage_condition).toEqual({});
        expect(m.by_temperature_status).toEqual({});
      });
    });

    describe("single record defaults", () => {
      it("returns correct counts", () => {
        const m = computeMedicationStorageMetrics([makeRecord()]);
        expect(m.total_checks).toBe(1);
        expect(m.satisfactory_count).toBe(1);
        expect(m.unsatisfactory_count).toBe(0);
        expect(m.in_range_count).toBe(1);
        expect(m.out_of_range_count).toBe(0);
        expect(m.expired_items_count).toBe(0);
        expect(m.disposal_needed_count).toBe(0);
        expect(m.total_items_checked).toBe(10);
        expect(m.total_discrepancies).toBe(0);
      });

      it("returns 100% satisfactory rate", () => {
        const m = computeMedicationStorageMetrics([makeRecord()]);
        expect(m.satisfactory_rate).toBe(100);
      });

      it("returns 100% temperature in range rate", () => {
        const m = computeMedicationStorageMetrics([makeRecord()]);
        expect(m.temperature_in_range_rate).toBe(100);
      });

      it("returns 100% for all boolean rates with defaults", () => {
        const m = computeMedicationStorageMetrics([makeRecord()]);
        expect(m.cabinet_locked_rate).toBe(100);
        expect(m.keys_secure_rate).toBe(100);
        expect(m.all_drugs_accounted_rate).toBe(100);
        expect(m.items_in_date_rate).toBe(100);
        expect(m.storage_clean_rate).toBe(100);
        expect(m.correct_conditions_rate).toBe(100);
        expect(m.access_restricted_rate).toBe(100);
      });

      it("returns correct average temperature", () => {
        const m = computeMedicationStorageMetrics([makeRecord()]);
        expect(m.average_temperature).toBe(5);
      });
    });

    describe("storage condition counting", () => {
      it("counts satisfactory", () => {
        const m = computeMedicationStorageMetrics([makeRecord({ storage_condition: "satisfactory" })]);
        expect(m.satisfactory_count).toBe(1);
      });
      it("counts unsatisfactory", () => {
        const m = computeMedicationStorageMetrics([makeRecord({ storage_condition: "unsatisfactory" })]);
        expect(m.unsatisfactory_count).toBe(1);
      });
    });

    describe("temperature status counting", () => {
      it("counts in_range", () => {
        const m = computeMedicationStorageMetrics([makeRecord({ temperature_status: "in_range" })]);
        expect(m.in_range_count).toBe(1);
        expect(m.out_of_range_count).toBe(0);
      });
      it("counts above_range as out of range", () => {
        const m = computeMedicationStorageMetrics([makeRecord({ temperature_status: "above_range" })]);
        expect(m.out_of_range_count).toBe(1);
      });
      it("counts below_range as out of range", () => {
        const m = computeMedicationStorageMetrics([makeRecord({ temperature_status: "below_range" })]);
        expect(m.out_of_range_count).toBe(1);
      });
      it("does not count not_recorded as out of range", () => {
        const m = computeMedicationStorageMetrics([makeRecord({ temperature_status: "not_recorded" })]);
        expect(m.out_of_range_count).toBe(0);
      });
    });

    describe("temperature_in_range_rate", () => {
      it("excludes not_recorded from denominator", () => {
        const records = [
          makeRecord({ temperature_status: "in_range" }),
          makeRecord({ temperature_status: "not_recorded" }),
        ];
        const m = computeMedicationStorageMetrics(records);
        expect(m.temperature_in_range_rate).toBe(100);
      });
      it("excludes equipment_fault from denominator", () => {
        const records = [
          makeRecord({ temperature_status: "in_range" }),
          makeRecord({ temperature_status: "equipment_fault" }),
        ];
        const m = computeMedicationStorageMetrics(records);
        expect(m.temperature_in_range_rate).toBe(100);
      });
      it("calculates correctly with mixed", () => {
        const records = [
          makeRecord({ temperature_status: "in_range" }),
          makeRecord({ temperature_status: "above_range" }),
          makeRecord({ temperature_status: "in_range" }),
        ];
        const m = computeMedicationStorageMetrics(records);
        expect(m.temperature_in_range_rate).toBe(66.7);
      });
    });

    describe("average_temperature", () => {
      it("averages with rounding", () => {
        const records = [
          makeRecord({ temperature_reading: 4.0 }),
          makeRecord({ temperature_reading: 6.0 }),
          makeRecord({ temperature_reading: 5.0 }),
        ];
        const m = computeMedicationStorageMetrics(records);
        expect(m.average_temperature).toBe(5);
      });
      it("excludes null readings", () => {
        const records = [
          makeRecord({ temperature_reading: 4.0 }),
          makeRecord({ temperature_reading: null }),
        ];
        const m = computeMedicationStorageMetrics(records);
        expect(m.average_temperature).toBe(4);
      });
      it("returns 0 when all null", () => {
        const m = computeMedicationStorageMetrics([makeRecord({ temperature_reading: null })]);
        expect(m.average_temperature).toBe(0);
      });
    });

    describe("item totals", () => {
      it("sums items_checked", () => {
        const records = [makeRecord({ items_checked: 5 }), makeRecord({ items_checked: 8 })];
        const m = computeMedicationStorageMetrics(records);
        expect(m.total_items_checked).toBe(13);
      });
      it("sums discrepancies_found", () => {
        const records = [makeRecord({ discrepancies_found: 2 }), makeRecord({ discrepancies_found: 3 })];
        const m = computeMedicationStorageMetrics(records);
        expect(m.total_discrepancies).toBe(5);
      });
    });

    describe("boolean rates", () => {
      it("cabinet_locked_rate 0 when false", () => {
        const m = computeMedicationStorageMetrics([makeRecord({ cabinet_locked: false })]);
        expect(m.cabinet_locked_rate).toBe(0);
      });
      it("keys_secure_rate 0 when false", () => {
        const m = computeMedicationStorageMetrics([makeRecord({ keys_secure: false })]);
        expect(m.keys_secure_rate).toBe(0);
      });
      it("all_drugs_accounted_rate 0 when false", () => {
        const m = computeMedicationStorageMetrics([makeRecord({ all_drugs_accounted: false })]);
        expect(m.all_drugs_accounted_rate).toBe(0);
      });
      it("storage_clean_rate 0 when false", () => {
        const m = computeMedicationStorageMetrics([makeRecord({ storage_clean: false })]);
        expect(m.storage_clean_rate).toBe(0);
      });
      it("calculates mixed boolean rates", () => {
        const records = [makeRecord({ cabinet_locked: true }), makeRecord({ cabinet_locked: false }), makeRecord({ cabinet_locked: true })];
        const m = computeMedicationStorageMetrics(records);
        expect(m.cabinet_locked_rate).toBe(66.7);
      });
    });

    describe("expired_items_count", () => {
      it("counts when true", () => {
        const m = computeMedicationStorageMetrics([makeRecord({ expired_items_found: true })]);
        expect(m.expired_items_count).toBe(1);
      });
    });

    describe("disposal_needed_count", () => {
      it("counts when true", () => {
        const m = computeMedicationStorageMetrics([makeRecord({ disposal_needed: true })]);
        expect(m.disposal_needed_count).toBe(1);
      });
    });

    describe("by_storage_type breakdown", () => {
      it("counts all 10 types", () => {
        const types = ["controlled_drug_cupboard", "general_medication_cabinet", "fridge_storage", "topical_storage", "liquid_storage", "inhaler_storage", "emergency_medication", "disposal_bin", "returns_box", "other"] as const;
        const records = types.map((t) => makeRecord({ storage_type: t }));
        const m = computeMedicationStorageMetrics(records);
        for (const t of types) expect(m.by_storage_type[t]).toBe(1);
      });
    });

    describe("by_check_type breakdown", () => {
      it("counts all 10 types", () => {
        const types = ["daily_check", "weekly_check", "monthly_audit", "temperature_check", "stock_count", "expiry_check", "lock_check", "key_check", "deep_clean", "other"] as const;
        const records = types.map((t) => makeRecord({ check_type: t }));
        const m = computeMedicationStorageMetrics(records);
        for (const t of types) expect(m.by_check_type[t]).toBe(1);
      });
    });

    describe("by_storage_condition breakdown", () => {
      it("counts all 5 conditions", () => {
        const conditions = ["satisfactory", "minor_issues", "major_issues", "unsatisfactory", "not_checked"] as const;
        const records = conditions.map((c) => makeRecord({ storage_condition: c }));
        const m = computeMedicationStorageMetrics(records);
        for (const c of conditions) expect(m.by_storage_condition[c]).toBe(1);
      });
    });

    describe("by_temperature_status breakdown", () => {
      it("counts all 5 statuses", () => {
        const statuses = ["in_range", "above_range", "below_range", "not_recorded", "equipment_fault"] as const;
        const records = statuses.map((s) => makeRecord({ temperature_status: s }));
        const m = computeMedicationStorageMetrics(records);
        for (const s of statuses) expect(m.by_temperature_status[s]).toBe(1);
      });
    });
  });

  describe("identifyMedicationStorageAlerts", () => {
    describe("no alerts", () => {
      it("returns empty for clean records", () => {
        expect(identifyMedicationStorageAlerts([makeRecord()])).toEqual([]);
      });
      it("returns empty for empty records", () => {
        expect(identifyMedicationStorageAlerts([])).toEqual([]);
      });
    });

    describe("controlled_drug_unlocked alert", () => {
      it("fires for unlocked controlled drug cupboard", () => {
        const alerts = identifyMedicationStorageAlerts([
          makeRecord({ storage_type: "controlled_drug_cupboard", cabinet_locked: false, storage_location: "Nurses Station", check_date: "2026-05-14" }),
        ]);
        expect(alerts).toHaveLength(1);
        expect(alerts[0].type).toBe("controlled_drug_unlocked");
        expect(alerts[0].severity).toBe("critical");
        expect(alerts[0].message).toContain("Nurses Station");
        expect(alerts[0].message).toContain("2026-05-14");
        expect(alerts[0].message).toContain("secure immediately");
      });
      it("fires per-record", () => {
        const alerts = identifyMedicationStorageAlerts([
          makeRecord({ id: "s-1", storage_type: "controlled_drug_cupboard", cabinet_locked: false }),
          makeRecord({ id: "s-2", storage_type: "controlled_drug_cupboard", cabinet_locked: false }),
        ]);
        const u = alerts.filter((a) => a.type === "controlled_drug_unlocked");
        expect(u).toHaveLength(2);
      });
      it("does not fire for general cabinet unlocked", () => {
        const alerts = identifyMedicationStorageAlerts([makeRecord({ storage_type: "general_medication_cabinet", cabinet_locked: false })]);
        const u = alerts.filter((a) => a.type === "controlled_drug_unlocked");
        expect(u).toHaveLength(0);
      });
    });

    describe("drugs_not_accounted alert", () => {
      it("fires for 1 controlled drug check with drugs not accounted", () => {
        const alerts = identifyMedicationStorageAlerts([makeRecord({ storage_type: "controlled_drug_cupboard", all_drugs_accounted: false })]);
        const a = alerts.find((x) => x.type === "drugs_not_accounted");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("critical");
        expect(a!.message).toContain("1 controlled drug check has");
      });
      it("uses plural for 2+", () => {
        const alerts = identifyMedicationStorageAlerts([
          makeRecord({ storage_type: "controlled_drug_cupboard", all_drugs_accounted: false }),
          makeRecord({ storage_type: "controlled_drug_cupboard", all_drugs_accounted: false }),
        ]);
        const a = alerts.find((x) => x.type === "drugs_not_accounted");
        expect(a!.message).toContain("2 controlled drug checks have");
      });
      it("does not fire for general cabinet not accounted", () => {
        const alerts = identifyMedicationStorageAlerts([makeRecord({ storage_type: "general_medication_cabinet", all_drugs_accounted: false })]);
        const a = alerts.find((x) => x.type === "drugs_not_accounted");
        expect(a).toBeUndefined();
      });
    });

    describe("temperature_out_of_range alert", () => {
      it("fires for 1 above range", () => {
        const alerts = identifyMedicationStorageAlerts([makeRecord({ temperature_status: "above_range" })]);
        const a = alerts.find((x) => x.type === "temperature_out_of_range");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("high");
        expect(a!.message).toContain("1 storage check has");
      });
      it("fires for below range", () => {
        const alerts = identifyMedicationStorageAlerts([makeRecord({ temperature_status: "below_range" })]);
        const a = alerts.find((x) => x.type === "temperature_out_of_range");
        expect(a).toBeDefined();
      });
      it("uses plural for 2+", () => {
        const alerts = identifyMedicationStorageAlerts([
          makeRecord({ temperature_status: "above_range" }),
          makeRecord({ temperature_status: "below_range" }),
        ]);
        const a = alerts.find((x) => x.type === "temperature_out_of_range");
        expect(a!.message).toContain("2 storage checks have");
      });
      it("does not fire for not_recorded", () => {
        const alerts = identifyMedicationStorageAlerts([makeRecord({ temperature_status: "not_recorded" })]);
        const a = alerts.find((x) => x.type === "temperature_out_of_range");
        expect(a).toBeUndefined();
      });
    });

    describe("expired_items alert", () => {
      it("fires for 1 expired", () => {
        const alerts = identifyMedicationStorageAlerts([makeRecord({ expired_items_found: true })]);
        const a = alerts.find((x) => x.type === "expired_items");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("high");
        expect(a!.message).toContain("1 check has");
      });
      it("uses plural for 2+", () => {
        const alerts = identifyMedicationStorageAlerts([
          makeRecord({ expired_items_found: true }),
          makeRecord({ expired_items_found: true }),
        ]);
        const a = alerts.find((x) => x.type === "expired_items");
        expect(a!.message).toContain("2 checks have");
      });
    });

    describe("storage_not_clean alert", () => {
      it("does not fire for 2 not clean", () => {
        const alerts = identifyMedicationStorageAlerts([makeRecord({ storage_clean: false }), makeRecord({ storage_clean: false })]);
        const a = alerts.find((x) => x.type === "storage_not_clean");
        expect(a).toBeUndefined();
      });
      it("fires for 3 not clean", () => {
        const alerts = identifyMedicationStorageAlerts([
          makeRecord({ storage_clean: false }),
          makeRecord({ storage_clean: false }),
          makeRecord({ storage_clean: false }),
        ]);
        const a = alerts.find((x) => x.type === "storage_not_clean");
        expect(a).toBeDefined();
        expect(a!.severity).toBe("medium");
        expect(a!.message).toContain("3 checks found storage not clean");
      });
    });

    describe("multiple alerts", () => {
      it("fires all applicable", () => {
        const alerts = identifyMedicationStorageAlerts([
          makeRecord({ storage_type: "controlled_drug_cupboard", cabinet_locked: false, all_drugs_accounted: false, temperature_status: "above_range", expired_items_found: true, storage_clean: false }),
          makeRecord({ temperature_status: "below_range", expired_items_found: true, storage_clean: false }),
          makeRecord({ storage_clean: false }),
        ]);
        const types = alerts.map((a) => a.type);
        expect(types).toContain("controlled_drug_unlocked");
        expect(types).toContain("drugs_not_accounted");
        expect(types).toContain("temperature_out_of_range");
        expect(types).toContain("expired_items");
        expect(types).toContain("storage_not_clean");
      });
    });
  });
});
