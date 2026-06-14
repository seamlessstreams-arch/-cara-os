import { describe, it, expect } from "vitest";
import {
  computeEnergyEfficiencyMetrics,
  computeEnergyEfficiencyAlerts,
  generateEnergyEfficiencyCaraInsights,
  type HomeEnergyEfficiencyRow,
} from "./home-energy-efficiency-service";

function makeRow(
  overrides: Partial<HomeEnergyEfficiencyRow> = {},
): HomeEnergyEfficiencyRow {
  return {
    id: "row-1",
    home_id: "home-1",
    assessor_name: "Assessor A",
    assessor_id: null,
    assessment_date: "2026-05-01",
    energy_area: "heating",
    efficiency_rating: "b_rating",
    improvement_status: "completed",
    assessment_type: "epc_assessment",
    current_epc_valid: true,
    smart_meter_installed: true,
    led_lighting_throughout: true,
    insulation_adequate: true,
    draught_proofing_done: true,
    renewable_energy_installed: false,
    energy_saving_measures_active: true,
    children_involved_in_saving: true,
    monthly_cost_estimate: 150.0,
    carbon_footprint_tonnes: 2.5,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeEnergyEfficiencyMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeEnergyEfficiencyMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.poor_rating_count).toBe(0);
    expect(m.epc_valid_rate).toBe(0);
    expect(m.total_monthly_cost).toBe(0);
    expect(m.total_carbon).toBe(0);
    expect(m.unique_assessors).toBe(0);
  });

  it("counts populated data correctly", () => {
    const rows = [
      makeRow({ id: "r1", efficiency_rating: "e_rating", improvement_status: "identified", assessor_name: "A", monthly_cost_estimate: 200, carbon_footprint_tonnes: 3.0 }),
      makeRow({ id: "r2", efficiency_rating: "f_rating", improvement_status: "deferred", assessor_name: "B", monthly_cost_estimate: 100, carbon_footprint_tonnes: 1.5 }),
      makeRow({ id: "r3", efficiency_rating: "b_rating", improvement_status: "completed", assessor_name: "A", monthly_cost_estimate: null, carbon_footprint_tonnes: null }),
    ];
    const m = computeEnergyEfficiencyMetrics(rows);
    expect(m.total_assessments).toBe(3);
    expect(m.poor_rating_count).toBe(2); // e_rating + f_rating
    expect(m.improvement_identified_count).toBe(1);
    expect(m.completed_count).toBe(1);
    expect(m.deferred_count).toBe(1);
    expect(m.total_monthly_cost).toBe(300);
    expect(m.total_carbon).toBe(4.5);
    expect(m.unique_assessors).toBe(2);
    expect(m.rating_breakdown).toEqual({ e_rating: 1, f_rating: 1, b_rating: 1 });
  });

  it("computes boolean rates correctly", () => {
    const rows = [
      makeRow({ smart_meter_installed: true, children_involved_in_saving: false }),
      makeRow({ id: "r2", smart_meter_installed: false, children_involved_in_saving: false }),
    ];
    const m = computeEnergyEfficiencyMetrics(rows);
    expect(m.smart_meter_rate).toBe(50);
    expect(m.children_involved_rate).toBe(0);
  });
});

describe("computeEnergyEfficiencyAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(computeEnergyEfficiencyAlerts([])).toEqual([]);
  });

  it("critical: epc_not_valid when current_epc_valid is false", () => {
    const rows = [makeRow({ current_epc_valid: false })];
    const alerts = computeEnergyEfficiencyAlerts(rows);
    expect(alerts.some((a) => a.type === "epc_not_valid" && a.severity === "critical")).toBe(true);
  });

  it("high: poor_rating_no_improvement when e/f/g rating and status is deferred", () => {
    const rows = [makeRow({ efficiency_rating: "g_rating", improvement_status: "deferred" })];
    const alerts = computeEnergyEfficiencyAlerts(rows);
    expect(alerts.some((a) => a.type === "poor_rating_no_improvement" && a.severity === "high")).toBe(true);
  });

  it("does NOT fire poor_rating_no_improvement when improvement is identified/costed/approved/in_progress/completed", () => {
    for (const status of ["identified", "costed", "approved", "in_progress", "completed"] as const) {
      const rows = [makeRow({ efficiency_rating: "f_rating", improvement_status: status })];
      const alerts = computeEnergyEfficiencyAlerts(rows);
      expect(alerts.some((a) => a.type === "poor_rating_no_improvement")).toBe(false);
    }
  });

  it("high: insulation_inadequate_heating when energy_area is heating and insulation not adequate", () => {
    const rows = [makeRow({ energy_area: "heating", insulation_adequate: false })];
    const alerts = computeEnergyEfficiencyAlerts(rows);
    expect(alerts.some((a) => a.type === "insulation_inadequate_heating" && a.severity === "high")).toBe(true);
  });

  it("medium: smart_meter_not_installed when >= 1 record without smart meter", () => {
    const rows = [makeRow({ smart_meter_installed: false })];
    const alerts = computeEnergyEfficiencyAlerts(rows);
    expect(alerts.some((a) => a.type === "smart_meter_not_installed" && a.severity === "medium")).toBe(true);
  });

  it("medium: children_not_involved when >= 1 record without children involved", () => {
    const rows = [makeRow({ children_involved_in_saving: false })];
    const alerts = computeEnergyEfficiencyAlerts(rows);
    expect(alerts.some((a) => a.type === "children_not_involved" && a.severity === "medium")).toBe(true);
  });
});

describe("generateEnergyEfficiencyCaraInsights", () => {
  it("returns 3 insights for populated data", () => {
    const insights = generateEnergyEfficiencyCaraInsights([makeRow()]);
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights for empty data", () => {
    expect(generateEnergyEfficiencyCaraInsights([])).toHaveLength(3);
  });
});
