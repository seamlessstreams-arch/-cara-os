import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  computeCaraInsights,
  type HomeLegionellaRiskAssessmentRow,
} from "./home-legionella-risk-assessment-service";

function makeRow(
  overrides: Partial<HomeLegionellaRiskAssessmentRow> = {},
): HomeLegionellaRiskAssessmentRow {
  return {
    id: "row-1",
    home_id: "home-1",
    assessment_date: "2026-05-01",
    assessor_name: "Assessor A",
    water_system_type: "Hot Water",
    risk_level: "Low",
    temperature_compliant: true,
    hot_water_temp_celsius: 60,
    cold_water_temp_celsius: 15,
    flushing_regime_compliant: true,
    water_treatment_in_place: true,
    legionella_test_completed: true,
    legionella_test_result: "Negative",
    remedial_action_required: false,
    remedial_action_details: null,
    next_assessment_date: null,
    compliance_status: "Compliant",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.intolerable_count).toBe(0);
    expect(m.temperature_compliance_rate).toBe(0);
    expect(m.negative_test_rate).toBe(0);
    expect(m.unique_assessors).toBe(0);
    expect(m.risk_breakdown).toEqual({});
  });

  it("counts populated data correctly", () => {
    const rows = [
      makeRow({ id: "r1", risk_level: "High", assessor_name: "A", compliance_status: "Minor Non-Compliance", remedial_action_required: true }),
      makeRow({ id: "r2", risk_level: "Intolerable", assessor_name: "B", compliance_status: "Critical Non-Compliance", legionella_test_result: "Immediate Action" }),
      makeRow({ id: "r3", risk_level: "Low", assessor_name: "A", compliance_status: "Compliant" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_assessments).toBe(3);
    expect(m.high_risk_count).toBe(1);
    expect(m.intolerable_count).toBe(1);
    expect(m.non_compliant_count).toBe(2); // anything not "Compliant"
    expect(m.remedial_action_count).toBe(1);
    expect(m.unique_assessors).toBe(2);
    expect(m.risk_breakdown).toEqual({ High: 1, Intolerable: 1, Low: 1 });
  });

  it("computes negative_test_rate from tested rows only", () => {
    const rows = [
      makeRow({ legionella_test_completed: true, legionella_test_result: "Negative" }),
      makeRow({ id: "r2", legionella_test_completed: true, legionella_test_result: "Action Level" }),
      makeRow({ id: "r3", legionella_test_completed: false, legionella_test_result: null }),
    ];
    const m = computeMetrics(rows);
    expect(m.legionella_test_rate).toBe(66.7); // 2/3 completed
    expect(m.negative_test_rate).toBe(50); // 1/2 tested were negative
  });

  it("computes boolean rates correctly", () => {
    const rows = [
      makeRow({ temperature_compliant: true, flushing_regime_compliant: false }),
      makeRow({ id: "r2", temperature_compliant: false, flushing_regime_compliant: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.temperature_compliance_rate).toBe(50);
    expect(m.flushing_compliance_rate).toBe(0);
  });
});

describe("computeAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("returns empty for all-good rows", () => {
    expect(computeAlerts([makeRow()])).toEqual([]);
  });

  it("critical: immediate_action_test_result when legionella_test_result is Immediate Action", () => {
    const rows = [makeRow({ legionella_test_result: "Immediate Action" })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "immediate_action_test_result" && a.severity === "critical")).toBe(true);
  });

  it("critical: intolerable_risk when risk_level is Intolerable", () => {
    const rows = [makeRow({ risk_level: "Intolerable" })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "intolerable_risk" && a.severity === "critical")).toBe(true);
  });

  it("high: high_risk_no_remedial when High risk but no remedial_action_required", () => {
    const rows = [makeRow({ risk_level: "High", remedial_action_required: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "high_risk_no_remedial" && a.severity === "high")).toBe(true);
  });

  it("does NOT fire high_risk_no_remedial when remedial IS required", () => {
    const rows = [makeRow({ risk_level: "High", remedial_action_required: true })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "high_risk_no_remedial")).toBe(false);
  });

  it("medium: temperature_non_compliant when temperature_compliant is false", () => {
    const rows = [makeRow({ temperature_compliant: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "temperature_non_compliant" && a.severity === "medium")).toBe(true);
  });

  it("medium: flushing_non_compliant when flushing_regime_compliant is false", () => {
    const rows = [makeRow({ flushing_regime_compliant: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "flushing_non_compliant" && a.severity === "medium")).toBe(true);
  });
});

describe("computeCaraInsights", () => {
  it("returns 3 insights for populated data", () => {
    const metrics = computeMetrics([makeRow()]);
    const insights = computeCaraInsights(metrics);
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights for empty data", () => {
    const metrics = computeMetrics([]);
    const insights = computeCaraInsights(metrics);
    expect(insights).toHaveLength(3);
  });
});
