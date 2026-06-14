import { describe, it, expect } from "vitest";
import {
  computeFireRiskMetrics,
  computeFireRiskAlerts,
  generateFireRiskCaraInsights,
  type HomeFireRiskAssessmentRow,
} from "./home-fire-risk-assessment-service";

function makeRow(
  overrides: Partial<HomeFireRiskAssessmentRow> = {},
): HomeFireRiskAssessmentRow {
  return {
    id: "row-1",
    home_id: "home-1",
    assessor_name: "Assessor A",
    assessor_id: null,
    assessment_date: "2026-05-01",
    risk_rating: "low",
    assessment_area: "means_of_escape",
    compliance_status: "compliant",
    action_priority: "routine",
    escape_routes_clear: true,
    fire_doors_functional: true,
    detection_system_tested: true,
    extinguishers_serviced: true,
    evacuation_plan_current: true,
    staff_fire_trained: true,
    fire_drills_completed: true,
    compartmentation_intact: true,
    emergency_lighting_tested: true,
    signage_adequate: true,
    electrical_safety_tested: true,
    peep_in_place: true,
    next_review_date: null,
    action_details: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeFireRiskMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeFireRiskMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.intolerable_count).toBe(0);
    expect(m.escape_routes_clear_rate).toBe(0);
    expect(m.unique_assessors).toBe(0);
    expect(m.risk_breakdown).toEqual({});
  });

  it("counts populated data correctly", () => {
    const rows = [
      makeRow({ id: "r1", risk_rating: "high", compliance_status: "non_compliant", assessor_name: "A" }),
      makeRow({ id: "r2", risk_rating: "intolerable", compliance_status: "major_deficiency", assessor_name: "B" }),
      makeRow({ id: "r3", risk_rating: "low", compliance_status: "compliant", assessor_name: "A" }),
    ];
    const m = computeFireRiskMetrics(rows);
    expect(m.total_assessments).toBe(3);
    expect(m.high_risk_count).toBe(1);
    expect(m.intolerable_count).toBe(1);
    expect(m.non_compliant_count).toBe(1);
    expect(m.major_deficiency_count).toBe(1);
    expect(m.unique_assessors).toBe(2);
    expect(m.risk_breakdown).toEqual({ high: 1, intolerable: 1, low: 1 });
  });

  it("computes boolean rates correctly", () => {
    const rows = [
      makeRow({ escape_routes_clear: true, fire_drills_completed: false }),
      makeRow({ id: "r2", escape_routes_clear: false, fire_drills_completed: false }),
    ];
    const m = computeFireRiskMetrics(rows);
    expect(m.escape_routes_clear_rate).toBe(50);
    expect(m.fire_drills_completed_rate).toBe(0);
  });
});

describe("computeFireRiskAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(computeFireRiskAlerts([])).toEqual([]);
  });

  it("returns empty for all-good rows", () => {
    expect(computeFireRiskAlerts([makeRow()])).toEqual([]);
  });

  it("critical: intolerable_risk when risk_rating is intolerable", () => {
    const rows = [makeRow({ risk_rating: "intolerable" })];
    const alerts = computeFireRiskAlerts(rows);
    expect(alerts.some((a) => a.type === "intolerable_risk" && a.severity === "critical")).toBe(true);
  });

  it("critical: high_risk when risk_rating is high", () => {
    const rows = [makeRow({ risk_rating: "high" })];
    const alerts = computeFireRiskAlerts(rows);
    expect(alerts.some((a) => a.type === "high_risk" && a.severity === "critical")).toBe(true);
  });

  it("critical: non_compliant_critical_area when non_compliant in means_of_escape or fire_detection", () => {
    const rows = [
      makeRow({ compliance_status: "non_compliant", assessment_area: "means_of_escape" }),
    ];
    const alerts = computeFireRiskAlerts(rows);
    expect(alerts.some((a) => a.type === "non_compliant_critical_area" && a.severity === "critical")).toBe(true);

    const rows2 = [
      makeRow({ compliance_status: "non_compliant", assessment_area: "fire_detection" }),
    ];
    const alerts2 = computeFireRiskAlerts(rows2);
    expect(alerts2.some((a) => a.type === "non_compliant_critical_area")).toBe(true);
  });

  it("high: escape_routes_not_clear when escape_routes_clear is false", () => {
    const rows = [makeRow({ escape_routes_clear: false })];
    const alerts = computeFireRiskAlerts(rows);
    expect(alerts.some((a) => a.type === "escape_routes_not_clear" && a.severity === "high")).toBe(true);
  });

  it("high: fire_doors_not_functional when fire_doors_functional is false", () => {
    const rows = [makeRow({ fire_doors_functional: false })];
    const alerts = computeFireRiskAlerts(rows);
    expect(alerts.some((a) => a.type === "fire_doors_not_functional" && a.severity === "high")).toBe(true);
  });

  it("medium: fire_drills_not_completed when fire_drills_completed is false", () => {
    const rows = [makeRow({ fire_drills_completed: false })];
    const alerts = computeFireRiskAlerts(rows);
    expect(alerts.some((a) => a.type === "fire_drills_not_completed" && a.severity === "medium")).toBe(true);
  });

  it("medium: peep_not_in_place when peep_in_place is false", () => {
    const rows = [makeRow({ peep_in_place: false })];
    const alerts = computeFireRiskAlerts(rows);
    expect(alerts.some((a) => a.type === "peep_not_in_place" && a.severity === "medium")).toBe(true);
  });
});

describe("generateFireRiskCaraInsights", () => {
  it("returns 3 insights for populated data", () => {
    const insights = generateFireRiskCaraInsights([makeRow()]);
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights for empty data", () => {
    expect(generateFireRiskCaraInsights([])).toHaveLength(3);
  });
});
