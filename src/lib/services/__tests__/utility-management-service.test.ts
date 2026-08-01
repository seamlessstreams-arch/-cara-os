import { describe, it, expect } from "vitest";
import { _testing, type UtilityRecord } from "../utility-management-service";

const { computeUtilityMetrics, identifyUtilityAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<UtilityRecord>): UtilityRecord {
  return {
    id: overrides?.id ?? "u-1",
    home_id: overrides?.home_id ?? "home-1",
    utility_type: overrides?.utility_type ?? "electricity",
    reading_type: overrides?.reading_type ?? "meter_reading",
    reading_date: overrides?.reading_date ?? now.toISOString().split("T")[0],
    cost_status: overrides?.cost_status ?? "within_budget",
    energy_rating: overrides?.energy_rating ?? "c",
    meter_reading: "meter_reading" in (overrides ?? {}) ? (overrides!.meter_reading ?? null) : 1000,
    previous_reading: "previous_reading" in (overrides ?? {}) ? (overrides!.previous_reading ?? null) : 900,
    cost_amount: "cost_amount" in (overrides ?? {}) ? (overrides!.cost_amount ?? null) : 100,
    budget_amount: "budget_amount" in (overrides ?? {}) ? (overrides!.budget_amount ?? null) : 150,
    supplier_name: overrides?.supplier_name ?? "Supplier A",
    contract_end_date: "contract_end_date" in (overrides ?? {}) ? (overrides!.contract_end_date ?? null) : null,
    smart_meter_installed: overrides?.smart_meter_installed ?? true,
    heating_adequate: overrides?.heating_adequate ?? true,
    hot_water_available: overrides?.hot_water_available ?? true,
    children_comfortable: overrides?.children_comfortable ?? true,
    energy_saving_measures: overrides?.energy_saving_measures ?? true,
    renewable_energy_used: overrides?.renewable_energy_used ?? true,
    carbon_offset: overrides?.carbon_offset ?? true,
    issues_found: overrides?.issues_found ?? [],
    actions_taken: overrides?.actions_taken ?? [],
    recorded_by: overrides?.recorded_by ?? "Staff A",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("utility-management-service", () => {
  // ── computeUtilityMetrics ───────────────────────────────────────────

  describe("computeUtilityMetrics", () => {
    describe("empty records", () => {
      it("returns zeros for all fields", () => {
        const m = computeUtilityMetrics([]);
        expect(m.total_records).toBe(0);
        expect(m.electricity_count).toBe(0);
        expect(m.gas_count).toBe(0);
        expect(m.water_count).toBe(0);
        expect(m.meter_reading_count).toBe(0);
        expect(m.bill_count).toBe(0);
        expect(m.within_budget_rate).toBeNull();;
        expect(m.over_budget_count).toBe(0);
        expect(m.disputed_count).toBe(0);
        expect(m.total_cost).toBe(0);
        expect(m.average_cost).toBeNull();;
        expect(m.smart_meter_rate).toBeNull();;
        expect(m.heating_adequate_rate).toBeNull();;
        expect(m.hot_water_rate).toBeNull();;
        expect(m.children_comfortable_rate).toBeNull();;
        expect(m.energy_saving_rate).toBeNull();;
        expect(m.renewable_rate).toBeNull();;
        expect(m.fault_count).toBe(0);
      });

      it("returns empty breakdowns", () => {
        const m = computeUtilityMetrics([]);
        expect(m.by_utility_type).toEqual({});
        expect(m.by_reading_type).toEqual({});
        expect(m.by_cost_status).toEqual({});
        expect(m.by_energy_rating).toEqual({});
      });
    });

    describe("single record defaults", () => {
      it("returns correct counts", () => {
        const m = computeUtilityMetrics([makeRecord()]);
        expect(m.total_records).toBe(1);
        expect(m.electricity_count).toBe(1);
        expect(m.meter_reading_count).toBe(1);
      });

      it("returns 100% rates", () => {
        const m = computeUtilityMetrics([makeRecord()]);
        expect(m.within_budget_rate).toBe(100);
        expect(m.smart_meter_rate).toBe(100);
        expect(m.heating_adequate_rate).toBe(100);
        expect(m.hot_water_rate).toBe(100);
        expect(m.children_comfortable_rate).toBe(100);
        expect(m.energy_saving_rate).toBe(100);
        expect(m.renewable_rate).toBe(100);
      });

      it("returns correct cost values", () => {
        const m = computeUtilityMetrics([makeRecord()]);
        expect(m.total_cost).toBe(100);
        expect(m.average_cost).toBe(100);
      });
    });

    describe("utility type counting", () => {
      it("counts electricity", () => {
        const m = computeUtilityMetrics([makeRecord({ utility_type: "electricity" })]);
        expect(m.electricity_count).toBe(1);
      });

      it("counts gas", () => {
        const m = computeUtilityMetrics([makeRecord({ utility_type: "gas" })]);
        expect(m.gas_count).toBe(1);
        expect(m.electricity_count).toBe(0);
      });

      it("counts water", () => {
        const m = computeUtilityMetrics([makeRecord({ utility_type: "water" })]);
        expect(m.water_count).toBe(1);
      });

      it("builds by_utility_type for all 10 types", () => {
        const types = ["electricity", "gas", "water", "oil", "lpg", "solar", "waste_collection", "recycling", "broadband", "other"] as const;
        const recs = types.map((t, i) => makeRecord({ id: `u-${i}`, utility_type: t }));
        const m = computeUtilityMetrics(recs);
        expect(Object.keys(m.by_utility_type)).toHaveLength(10);
        for (const t of types) expect(m.by_utility_type[t]).toBe(1);
      });

      it("aggregates multiple of same type", () => {
        const m = computeUtilityMetrics([
          makeRecord({ id: "1", utility_type: "gas" }),
          makeRecord({ id: "2", utility_type: "gas" }),
          makeRecord({ id: "3", utility_type: "electricity" }),
        ]);
        expect(m.by_utility_type).toEqual({ gas: 2, electricity: 1 });
      });
    });

    describe("reading type counting", () => {
      it("counts meter_reading", () => {
        const m = computeUtilityMetrics([makeRecord({ reading_type: "meter_reading" })]);
        expect(m.meter_reading_count).toBe(1);
      });

      it("counts bill_received", () => {
        const m = computeUtilityMetrics([makeRecord({ reading_type: "bill_received" })]);
        expect(m.bill_count).toBe(1);
        expect(m.meter_reading_count).toBe(0);
      });

      it("counts fault_report", () => {
        const m = computeUtilityMetrics([makeRecord({ reading_type: "fault_report" })]);
        expect(m.fault_count).toBe(1);
      });

      it("builds by_reading_type for all 10 types", () => {
        const types = ["meter_reading", "bill_received", "efficiency_audit", "supplier_change", "tariff_review", "maintenance", "fault_report", "smart_meter_install", "sustainability_measure", "other"] as const;
        const recs = types.map((t, i) => makeRecord({ id: `u-${i}`, reading_type: t }));
        const m = computeUtilityMetrics(recs);
        expect(Object.keys(m.by_reading_type)).toHaveLength(10);
      });
    });

    describe("cost status counting", () => {
      it("counts within_budget", () => {
        const m = computeUtilityMetrics([makeRecord({ cost_status: "within_budget" })]);
        expect(m.within_budget_rate).toBe(100);
      });

      it("counts over_budget", () => {
        const m = computeUtilityMetrics([makeRecord({ cost_status: "over_budget" })]);
        expect(m.over_budget_count).toBe(1);
        expect(m.within_budget_rate).toBe(0);
      });

      it("counts disputed", () => {
        const m = computeUtilityMetrics([makeRecord({ cost_status: "disputed" })]);
        expect(m.disputed_count).toBe(1);
      });

      it("calculates within_budget_rate with rounding", () => {
        const m = computeUtilityMetrics([
          makeRecord({ id: "1", cost_status: "within_budget" }),
          makeRecord({ id: "2", cost_status: "within_budget" }),
          makeRecord({ id: "3", cost_status: "over_budget" }),
        ]);
        expect(m.within_budget_rate).toBe(66.7);
      });

      it("builds by_cost_status for all 5 statuses", () => {
        const statuses = ["within_budget", "over_budget", "under_budget", "pending_review", "disputed"] as const;
        const recs = statuses.map((s, i) => makeRecord({ id: `u-${i}`, cost_status: s }));
        const m = computeUtilityMetrics(recs);
        expect(Object.keys(m.by_cost_status)).toHaveLength(5);
      });
    });

    describe("energy rating breakdown", () => {
      it("builds by_energy_rating for all 8 ratings", () => {
        const ratings = ["a", "b", "c", "d", "e", "f", "g", "not_assessed"] as const;
        const recs = ratings.map((r, i) => makeRecord({ id: `u-${i}`, energy_rating: r }));
        const m = computeUtilityMetrics(recs);
        expect(Object.keys(m.by_energy_rating)).toHaveLength(8);
      });

      it("aggregates same ratings", () => {
        const m = computeUtilityMetrics([
          makeRecord({ id: "1", energy_rating: "c" }),
          makeRecord({ id: "2", energy_rating: "c" }),
          makeRecord({ id: "3", energy_rating: "a" }),
        ]);
        expect(m.by_energy_rating).toEqual({ c: 2, a: 1 });
      });
    });

    describe("cost calculations", () => {
      it("sums total_cost", () => {
        const m = computeUtilityMetrics([
          makeRecord({ id: "1", cost_amount: 100 }),
          makeRecord({ id: "2", cost_amount: 200 }),
          makeRecord({ id: "3", cost_amount: 150 }),
        ]);
        expect(m.total_cost).toBe(450);
      });

      it("calculates average_cost", () => {
        const m = computeUtilityMetrics([
          makeRecord({ id: "1", cost_amount: 100 }),
          makeRecord({ id: "2", cost_amount: 200 }),
        ]);
        expect(m.average_cost).toBe(150);
      });

      it("excludes null cost_amounts from total", () => {
        const m = computeUtilityMetrics([
          makeRecord({ id: "1", cost_amount: 100 }),
          makeRecord({ id: "2", cost_amount: null }),
        ]);
        expect(m.total_cost).toBe(100);
      });

      it("excludes null cost_amounts from average denominator", () => {
        const m = computeUtilityMetrics([
          makeRecord({ id: "1", cost_amount: 100 }),
          makeRecord({ id: "2", cost_amount: null }),
        ]);
        expect(m.average_cost).toBe(100);
      });

      it("returns 0 when all costs null", () => {
        const m = computeUtilityMetrics([
          makeRecord({ id: "1", cost_amount: null }),
        ]);
        expect(m.total_cost).toBe(0);
        expect(m.average_cost).toBeNull();;
      });

      it("rounds total_cost to 2 decimals", () => {
        const m = computeUtilityMetrics([
          makeRecord({ id: "1", cost_amount: 33.33 }),
          makeRecord({ id: "2", cost_amount: 33.33 }),
          makeRecord({ id: "3", cost_amount: 33.33 }),
        ]);
        expect(m.total_cost).toBe(99.99);
      });

      it("rounds average_cost to 2 decimals", () => {
        const m = computeUtilityMetrics([
          makeRecord({ id: "1", cost_amount: 10 }),
          makeRecord({ id: "2", cost_amount: 20 }),
          makeRecord({ id: "3", cost_amount: 30 }),
        ]);
        expect(m.average_cost).toBe(20);
      });
    });

    describe("boolean rates", () => {
      it("calculates smart_meter_rate", () => {
        const m = computeUtilityMetrics([
          makeRecord({ id: "1", smart_meter_installed: true }),
          makeRecord({ id: "2", smart_meter_installed: false }),
        ]);
        expect(m.smart_meter_rate).toBe(50);
      });

      it("calculates heating_adequate_rate", () => {
        const m = computeUtilityMetrics([
          makeRecord({ id: "1", heating_adequate: true }),
          makeRecord({ id: "2", heating_adequate: false }),
          makeRecord({ id: "3", heating_adequate: false }),
        ]);
        expect(m.heating_adequate_rate).toBe(33.3);
      });

      it("calculates hot_water_rate", () => {
        const m = computeUtilityMetrics([
          makeRecord({ id: "1", hot_water_available: false }),
        ]);
        expect(m.hot_water_rate).toBe(0);
      });

      it("calculates children_comfortable_rate", () => {
        const m = computeUtilityMetrics([
          makeRecord({ id: "1", children_comfortable: true }),
          makeRecord({ id: "2", children_comfortable: true }),
        ]);
        expect(m.children_comfortable_rate).toBe(100);
      });

      it("calculates energy_saving_rate", () => {
        const m = computeUtilityMetrics([
          makeRecord({ id: "1", energy_saving_measures: true }),
          makeRecord({ id: "2", energy_saving_measures: false }),
          makeRecord({ id: "3", energy_saving_measures: true }),
        ]);
        expect(m.energy_saving_rate).toBe(66.7);
      });

      it("calculates renewable_rate", () => {
        const m = computeUtilityMetrics([
          makeRecord({ id: "1", renewable_energy_used: false }),
          makeRecord({ id: "2", renewable_energy_used: false }),
        ]);
        expect(m.renewable_rate).toBe(0);
      });

      it("handles all booleans false", () => {
        const m = computeUtilityMetrics([makeRecord({
          smart_meter_installed: false,
          heating_adequate: false,
          hot_water_available: false,
          children_comfortable: false,
          energy_saving_measures: false,
          renewable_energy_used: false,
        })]);
        expect(m.smart_meter_rate).toBe(0);
        expect(m.heating_adequate_rate).toBe(0);
        expect(m.hot_water_rate).toBe(0);
        expect(m.children_comfortable_rate).toBe(0);
        expect(m.energy_saving_rate).toBe(0);
        expect(m.renewable_rate).toBe(0);
      });

      it("rounds 1/7 rate correctly", () => {
        const recs = Array.from({ length: 7 }, (_, i) =>
          makeRecord({ id: `u-${i}`, smart_meter_installed: i === 0 }),
        );
        const m = computeUtilityMetrics(recs);
        expect(m.smart_meter_rate).toBe(14.3);
      });
    });

    describe("fault counting", () => {
      it("counts fault_report reading type", () => {
        const m = computeUtilityMetrics([
          makeRecord({ id: "1", reading_type: "fault_report" }),
          makeRecord({ id: "2", reading_type: "fault_report" }),
          makeRecord({ id: "3", reading_type: "meter_reading" }),
        ]);
        expect(m.fault_count).toBe(2);
      });

      it("returns 0 when no faults", () => {
        const m = computeUtilityMetrics([makeRecord()]);
        expect(m.fault_count).toBe(0);
      });
    });
  });

  // ── identifyUtilityAlerts ───────────────────────────────────────────

  describe("identifyUtilityAlerts", () => {
    describe("no alerts from clean records", () => {
      it("returns empty for clean records", () => {
        const alerts = identifyUtilityAlerts([makeRecord()]);
        expect(alerts).toEqual([]);
      });

      it("returns empty for empty records", () => {
        const alerts = identifyUtilityAlerts([]);
        expect(alerts).toEqual([]);
      });
    });

    describe("heating_inadequate — critical per-record", () => {
      it("generates alert for inadequate heating", () => {
        const alerts = identifyUtilityAlerts([
          makeRecord({ id: "u-1", heating_adequate: false, reading_date: "2026-05-14" }),
        ]);
        expect(alerts).toHaveLength(1);
        expect(alerts[0].type).toBe("heating_inadequate");
        expect(alerts[0].severity).toBe("critical");
        expect(alerts[0].id).toBe("u-1");
      });

      it("includes reading_date in message", () => {
        const alerts = identifyUtilityAlerts([
          makeRecord({ id: "u-1", heating_adequate: false, reading_date: "2026-05-14" }),
        ]);
        expect(alerts[0].message).toBe("Heating inadequate on 2026-05-14 — children must have adequate warmth");
      });

      it("generates per-record alerts", () => {
        const alerts = identifyUtilityAlerts([
          makeRecord({ id: "u-1", heating_adequate: false, reading_date: "2026-05-13" }),
          makeRecord({ id: "u-2", heating_adequate: false, reading_date: "2026-05-14" }),
        ]);
        const heating = alerts.filter((a) => a.type === "heating_inadequate");
        expect(heating).toHaveLength(2);
        expect(heating[0].id).toBe("u-1");
        expect(heating[1].id).toBe("u-2");
      });

      it("does not alert when heating adequate", () => {
        const alerts = identifyUtilityAlerts([makeRecord({ heating_adequate: true })]);
        expect(alerts.filter((a) => a.type === "heating_inadequate")).toHaveLength(0);
      });
    });

    describe("over_budget — high", () => {
      it("generates alert for 1 over budget (singular)", () => {
        const alerts = identifyUtilityAlerts([
          makeRecord({ id: "1", cost_status: "over_budget" }),
        ]);
        const a = alerts.find((x) => x.type === "over_budget")!;
        expect(a.severity).toBe("high");
        expect(a.message).toBe("1 utility is over budget — review spending");
        expect(a.id).toBe("over_budget");
      });

      it("generates alert for 3 over budget (plural)", () => {
        const alerts = identifyUtilityAlerts([
          makeRecord({ id: "1", cost_status: "over_budget" }),
          makeRecord({ id: "2", cost_status: "over_budget" }),
          makeRecord({ id: "3", cost_status: "over_budget" }),
        ]);
        const a = alerts.find((x) => x.type === "over_budget")!;
        expect(a.message).toBe("3 utilities are over budget — review spending");
      });

      it("does not alert for within_budget", () => {
        const alerts = identifyUtilityAlerts([makeRecord({ cost_status: "within_budget" })]);
        expect(alerts.filter((a) => a.type === "over_budget")).toHaveLength(0);
      });
    });

    describe("utility_fault — high", () => {
      it("generates alert for 1 fault (singular)", () => {
        const alerts = identifyUtilityAlerts([
          makeRecord({ id: "1", reading_type: "fault_report" }),
        ]);
        const a = alerts.find((x) => x.type === "utility_fault")!;
        expect(a.severity).toBe("high");
        expect(a.message).toBe("1 utility fault has been reported — resolve promptly");
        expect(a.id).toBe("utility_fault");
      });

      it("generates alert for 2 faults (plural)", () => {
        const alerts = identifyUtilityAlerts([
          makeRecord({ id: "1", reading_type: "fault_report" }),
          makeRecord({ id: "2", reading_type: "fault_report" }),
        ]);
        const a = alerts.find((x) => x.type === "utility_fault")!;
        expect(a.message).toBe("2 utility faults have been reported — resolve promptly");
      });

      it("does not alert for non-fault reading types", () => {
        const alerts = identifyUtilityAlerts([makeRecord({ reading_type: "meter_reading" })]);
        expect(alerts.filter((a) => a.type === "utility_fault")).toHaveLength(0);
      });
    });

    describe("disputed_bill — medium", () => {
      it("generates alert for 1 disputed (singular)", () => {
        const alerts = identifyUtilityAlerts([
          makeRecord({ id: "1", cost_status: "disputed" }),
        ]);
        const a = alerts.find((x) => x.type === "disputed_bill")!;
        expect(a.severity).toBe("medium");
        expect(a.message).toBe("1 bill is disputed — follow up with supplier");
        expect(a.id).toBe("disputed_bill");
      });

      it("generates alert for 2 disputed (plural)", () => {
        const alerts = identifyUtilityAlerts([
          makeRecord({ id: "1", cost_status: "disputed" }),
          makeRecord({ id: "2", cost_status: "disputed" }),
        ]);
        const a = alerts.find((x) => x.type === "disputed_bill")!;
        expect(a.message).toBe("2 bills are disputed — follow up with supplier");
      });

      it("does not alert for non-disputed", () => {
        const alerts = identifyUtilityAlerts([makeRecord({ cost_status: "pending_review" })]);
        expect(alerts.filter((a) => a.type === "disputed_bill")).toHaveLength(0);
      });
    });

    describe("low_efficiency — medium, >=3 threshold", () => {
      it("does not alert for 2 without energy saving", () => {
        const alerts = identifyUtilityAlerts([
          makeRecord({ id: "1", energy_saving_measures: false }),
          makeRecord({ id: "2", energy_saving_measures: false }),
        ]);
        expect(alerts.filter((a) => a.type === "low_efficiency")).toHaveLength(0);
      });

      it("alerts for 3 without energy saving", () => {
        const alerts = identifyUtilityAlerts([
          makeRecord({ id: "1", energy_saving_measures: false }),
          makeRecord({ id: "2", energy_saving_measures: false }),
          makeRecord({ id: "3", energy_saving_measures: false }),
        ]);
        const a = alerts.find((x) => x.type === "low_efficiency")!;
        expect(a.severity).toBe("medium");
        expect(a.message).toBe("3 records without energy saving measures — review sustainability");
        expect(a.id).toBe("low_efficiency");
      });

      it("alerts for 5 without energy saving", () => {
        const recs = Array.from({ length: 5 }, (_, i) =>
          makeRecord({ id: `u-${i}`, energy_saving_measures: false }),
        );
        const alerts = identifyUtilityAlerts(recs);
        const a = alerts.find((x) => x.type === "low_efficiency")!;
        expect(a.message).toContain("5 records");
      });
    });

    describe("multiple alert types simultaneously", () => {
      it("generates all alert types together", () => {
        const alerts = identifyUtilityAlerts([
          makeRecord({ id: "1", heating_adequate: false }),
          makeRecord({ id: "2", cost_status: "over_budget" }),
          makeRecord({ id: "3", reading_type: "fault_report" }),
          makeRecord({ id: "4", cost_status: "disputed" }),
          makeRecord({ id: "5", energy_saving_measures: false }),
          makeRecord({ id: "6", energy_saving_measures: false }),
          makeRecord({ id: "7", energy_saving_measures: false }),
        ]);
        const types = alerts.map((a) => a.type);
        expect(types).toContain("heating_inadequate");
        expect(types).toContain("over_budget");
        expect(types).toContain("utility_fault");
        expect(types).toContain("disputed_bill");
        expect(types).toContain("low_efficiency");
      });

      it("critical alerts appear first", () => {
        const alerts = identifyUtilityAlerts([
          makeRecord({ id: "1", heating_adequate: false }),
          makeRecord({ id: "2", cost_status: "over_budget" }),
        ]);
        expect(alerts[0].severity).toBe("critical");
      });
    });
  });
});
