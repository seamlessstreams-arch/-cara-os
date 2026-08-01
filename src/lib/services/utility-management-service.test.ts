import { describe, it, expect } from "vitest";
import {
  computeUtilityMetrics,
  identifyUtilityAlerts,
  type UtilityRecord,
} from "./utility-management-service";

// ── Factory ────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<UtilityRecord> = {}): UtilityRecord {
  return {
    id: overrides.id ?? "rec-1",
    home_id: overrides.home_id ?? "home-1",
    utility_type: overrides.utility_type ?? "electricity",
    reading_type: overrides.reading_type ?? "meter_reading",
    reading_date: overrides.reading_date ?? "2025-01-15",
    cost_status: overrides.cost_status ?? "within_budget",
    energy_rating: overrides.energy_rating ?? "c",
    meter_reading: overrides.meter_reading ?? 1000,
    previous_reading: overrides.previous_reading ?? 900,
    cost_amount: overrides.cost_amount ?? 150,
    budget_amount: overrides.budget_amount ?? 200,
    supplier_name: overrides.supplier_name ?? "Energy Co",
    contract_end_date: overrides.contract_end_date ?? null,
    smart_meter_installed: overrides.smart_meter_installed ?? true,
    heating_adequate: overrides.heating_adequate ?? true,
    hot_water_available: overrides.hot_water_available ?? true,
    children_comfortable: overrides.children_comfortable ?? true,
    energy_saving_measures: overrides.energy_saving_measures ?? true,
    renewable_energy_used: overrides.renewable_energy_used ?? false,
    carbon_offset: overrides.carbon_offset ?? false,
    issues_found: overrides.issues_found ?? [],
    actions_taken: overrides.actions_taken ?? [],
    recorded_by: overrides.recorded_by ?? "Staff A",
    notes: overrides.notes ?? null,
    created_at: overrides.created_at ?? "2025-01-15T00:00:00Z",
    updated_at: overrides.updated_at ?? "2025-01-15T00:00:00Z",
  };
}

// ── computeUtilityMetrics ──────────────────────────────────────────────

describe("computeUtilityMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeUtilityMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.electricity_count).toBe(0);
    expect(m.gas_count).toBe(0);
    expect(m.water_count).toBe(0);
    expect(m.within_budget_rate).toBeNull();;
    expect(m.total_cost).toBe(0);
    expect(m.average_cost).toBeNull();;
    expect(m.smart_meter_rate).toBeNull();;
    expect(m.fault_count).toBe(0);
  });

  it("counts utility types correctly", () => {
    const records = [
      makeRecord({ utility_type: "electricity" }),
      makeRecord({ utility_type: "electricity" }),
      makeRecord({ utility_type: "gas" }),
      makeRecord({ utility_type: "water" }),
    ];
    const m = computeUtilityMetrics(records);
    expect(m.electricity_count).toBe(2);
    expect(m.gas_count).toBe(1);
    expect(m.water_count).toBe(1);
    expect(m.total_records).toBe(4);
  });

  it("calculates cost totals and averages", () => {
    const records = [
      makeRecord({ cost_amount: 100 }),
      makeRecord({ cost_amount: 200 }),
    ];
    const m = computeUtilityMetrics(records);
    expect(m.total_cost).toBe(300);
    expect(m.average_cost).toBe(150);
  });

  it("computes within_budget_rate correctly", () => {
    const records = [
      makeRecord({ cost_status: "within_budget" }),
      makeRecord({ cost_status: "over_budget" }),
    ];
    const m = computeUtilityMetrics(records);
    expect(m.within_budget_rate).toBe(50);
    expect(m.over_budget_count).toBe(1);
  });

  it("computes boolean rates for comfort metrics", () => {
    const records = [
      makeRecord({ heating_adequate: true, hot_water_available: true, children_comfortable: true }),
      makeRecord({ heating_adequate: false, hot_water_available: false, children_comfortable: false }),
    ];
    const m = computeUtilityMetrics(records);
    expect(m.heating_adequate_rate).toBe(50);
    expect(m.hot_water_rate).toBe(50);
    expect(m.children_comfortable_rate).toBe(50);
  });

  it("computes breakdown maps", () => {
    const records = [
      makeRecord({ utility_type: "gas", reading_type: "bill_received", cost_status: "disputed", energy_rating: "d" }),
    ];
    const m = computeUtilityMetrics(records);
    expect(m.by_utility_type["gas"]).toBe(1);
    expect(m.by_reading_type["bill_received"]).toBe(1);
    expect(m.by_cost_status["disputed"]).toBe(1);
    expect(m.by_energy_rating["d"]).toBe(1);
  });
});

// ── identifyUtilityAlerts ──────────────────────────────────────────────

describe("identifyUtilityAlerts", () => {
  it("returns empty array for empty input", () => {
    expect(identifyUtilityAlerts([])).toEqual([]);
  });

  it("fires critical alert for heating not adequate", () => {
    const records = [makeRecord({ heating_adequate: false })];
    const alerts = identifyUtilityAlerts(records);
    const match = alerts.find((a) => a.type === "heating_inadequate");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for over budget (>= 1)", () => {
    const records = [makeRecord({ cost_status: "over_budget" })];
    const alerts = identifyUtilityAlerts(records);
    const match = alerts.find((a) => a.type === "over_budget");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for fault reports (>= 1)", () => {
    const records = [makeRecord({ reading_type: "fault_report" })];
    const alerts = identifyUtilityAlerts(records);
    const match = alerts.find((a) => a.type === "utility_fault");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for disputed bills (>= 1)", () => {
    const records = [makeRecord({ cost_status: "disputed" })];
    const alerts = identifyUtilityAlerts(records);
    const match = alerts.find((a) => a.type === "disputed_bill");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("fires medium alert for low efficiency (>= 3 without energy saving)", () => {
    const records = [
      makeRecord({ energy_saving_measures: false }),
      makeRecord({ energy_saving_measures: false }),
      makeRecord({ energy_saving_measures: false }),
    ];
    const alerts = identifyUtilityAlerts(records);
    const match = alerts.find((a) => a.type === "low_efficiency");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("does NOT fire low efficiency alert for only 2 records without saving", () => {
    const records = [
      makeRecord({ energy_saving_measures: false }),
      makeRecord({ energy_saving_measures: false }),
    ];
    const alerts = identifyUtilityAlerts(records);
    expect(alerts.find((a) => a.type === "low_efficiency")).toBeUndefined();
  });
});
