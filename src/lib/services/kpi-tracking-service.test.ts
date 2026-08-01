import { describe, it, expect } from "vitest";
import {
  computeKpiMetrics,
  identifyKpiAlerts,
  type KpiDefinition,
  type KpiMeasurement,
} from "./kpi-tracking-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeDefinition(overrides: Partial<KpiDefinition> = {}): KpiDefinition {
  return {
    id: "kpi-def-1",
    home_id: "home-1",
    name: "Safeguarding Compliance",
    description: "Monthly safeguarding compliance rate",
    domain: "safeguarding",
    unit: "%",
    target_value: 95,
    threshold_amber: 85,
    threshold_red: 70,
    higher_is_better: true,
    frequency: "monthly",
    data_source: "Manual",
    responsible_person: "Manager A",
    active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeMeasurement(overrides: Partial<KpiMeasurement> = {}): KpiMeasurement {
  return {
    id: "kpi-m-1",
    home_id: "home-1",
    kpi_id: "kpi-def-1",
    kpi_name: "Safeguarding Compliance",
    measurement_date: "2026-05-01",
    period: "May 2026",
    value: 96,
    target: 95,
    status: "on_target",
    trend: "stable",
    commentary: null,
    actions_if_below: null,
    measured_by: "Manager A",
    created_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeKpiMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeKpiMetrics([], []);
    expect(m.total_kpis).toBe(0);
    expect(m.active_kpis).toBe(0);
    expect(m.on_target).toBe(0);
    expect(m.on_target_rate).toBeNull();;
    expect(m.improving_count).toBe(0);
  });

  it("computes correct metrics for populated data", () => {
    const defs = [
      makeDefinition({ id: "d1", domain: "safeguarding", active: true }),
      makeDefinition({ id: "d2", domain: "health", active: true }),
      makeDefinition({ id: "d3", domain: "education", active: false }),
    ];
    const measurements = [
      makeMeasurement({ id: "m1", kpi_id: "d1", status: "on_target", trend: "improving", measurement_date: "2026-05-01" }),
      makeMeasurement({ id: "m2", kpi_id: "d2", status: "below_target", trend: "declining", measurement_date: "2026-05-01" }),
      makeMeasurement({ id: "m3", kpi_id: "d2", status: "at_risk", trend: "declining", measurement_date: "2026-04-01" }),
    ];
    const m = computeKpiMetrics(defs, measurements);
    expect(m.total_kpis).toBe(3);
    expect(m.active_kpis).toBe(2);
    expect(m.on_target).toBe(1);
    expect(m.below_target).toBe(1);
    // on_target_rate: 1 on_target + 0 above_target / 2 measured = 50%
    expect(m.on_target_rate).toBe(50);
    expect(m.improving_count).toBe(1);
    expect(m.declining_count).toBe(1);
    expect(m.by_domain).toHaveProperty("safeguarding");
    expect(m.by_domain.safeguarding.on_target).toBe(1);
  });

  it("uses latest measurement per KPI when duplicates exist", () => {
    const defs = [makeDefinition({ id: "d1" })];
    const measurements = [
      makeMeasurement({ id: "m1", kpi_id: "d1", status: "below_target", measurement_date: "2026-04-01" }),
      makeMeasurement({ id: "m2", kpi_id: "d1", status: "on_target", measurement_date: "2026-05-01" }),
    ];
    const m = computeKpiMetrics(defs, measurements);
    expect(m.on_target).toBe(1);
    expect(m.below_target).toBe(0);
  });
});

describe("identifyKpiAlerts", () => {
  it("returns empty alerts for empty data", () => {
    expect(identifyKpiAlerts([], [], NOW)).toEqual([]);
  });

  it("triggers kpi_at_risk alert (critical)", () => {
    const defs = [makeDefinition({ id: "d1" })];
    const measurements = [
      makeMeasurement({ id: "m1", kpi_id: "d1", status: "at_risk", value: 60, target: 95 }),
    ];
    const alerts = identifyKpiAlerts(defs, measurements, NOW);
    const found = alerts.find((a) => a.type === "kpi_at_risk");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("triggers kpi_below_target alert (high)", () => {
    const defs = [makeDefinition({ id: "d1" })];
    const measurements = [
      makeMeasurement({ id: "m1", kpi_id: "d1", status: "below_target", value: 80, target: 95 }),
    ];
    const alerts = identifyKpiAlerts(defs, measurements, NOW);
    const found = alerts.find((a) => a.type === "kpi_below_target");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("triggers kpi_declining alert (medium)", () => {
    const defs = [makeDefinition({ id: "d1" })];
    const measurements = [
      makeMeasurement({ id: "m1", kpi_id: "d1", status: "on_target", trend: "declining" }),
    ];
    const alerts = identifyKpiAlerts(defs, measurements, NOW);
    const found = alerts.find((a) => a.type === "kpi_declining");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("triggers kpi_not_measured for active KPI with no measurements (medium)", () => {
    const defs = [makeDefinition({ id: "d1", active: true })];
    const alerts = identifyKpiAlerts(defs, [], NOW);
    const found = alerts.find((a) => a.type === "kpi_not_measured");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("does not trigger kpi_not_measured for inactive KPI with no measurements", () => {
    const defs = [makeDefinition({ id: "d1", active: false })];
    const alerts = identifyKpiAlerts(defs, [], NOW);
    const found = alerts.find((a) => a.type === "kpi_not_measured");
    expect(found).toBeUndefined();
  });
});
