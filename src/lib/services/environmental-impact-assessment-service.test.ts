import { describe, it, expect } from "vitest";
import {
  computeEnvironmentalImpactMetrics,
  computeEnvironmentalImpactAlerts,
  generateEnvironmentalImpactCaraInsights,
  type EnvironmentalImpactAssessmentRow,
} from "./environmental-impact-assessment-service";

function makeRow(overrides: Partial<EnvironmentalImpactAssessmentRow> = {}): EnvironmentalImpactAssessmentRow {
  return {
    id: "eia-1",
    home_id: "home-1",
    assessment_date: "2026-05-01",
    assessment_area: "energy_efficiency",
    performance_rating: "good",
    improvement_status: "in_progress",
    measurement_period: "monthly",
    assessor_name: "Jane Smith",
    baseline_value: 100,
    current_value: 80,
    target_value: 60,
    children_involved: true,
    staff_trained: true,
    cost_saving_identified: false,
    action_plan_created: true,
    progress_monitored: true,
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeEnvironmentalImpactMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeEnvironmentalImpactMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.poor_count).toBe(0);
    expect(m.below_standard_count).toBe(0);
    expect(m.not_started_count).toBe(0);
    expect(m.no_action_plan_count).toBe(0);
    expect(m.children_involved_rate).toBe(0);
    expect(m.staff_trained_rate).toBe(0);
    expect(m.cost_saving_rate).toBe(0);
    expect(m.action_plan_rate).toBe(0);
    expect(m.progress_monitored_rate).toBe(0);
    expect(m.unique_assessors).toBe(0);
  });

  it("computes correct counts and rates for populated data", () => {
    const rows: EnvironmentalImpactAssessmentRow[] = [
      makeRow({ id: "r1", performance_rating: "poor", improvement_status: "not_started", action_plan_created: false, children_involved: false, assessor_name: "A" }),
      makeRow({ id: "r2", performance_rating: "below_standard", improvement_status: "not_started", action_plan_created: true, children_involved: true, assessor_name: "B" }),
      makeRow({ id: "r3", performance_rating: "good", assessment_area: "waste_management", assessor_name: "A" }),
      makeRow({ id: "r4", performance_rating: "excellent", assessment_area: "waste_management", cost_saving_identified: true, assessor_name: "C" }),
    ];
    const m = computeEnvironmentalImpactMetrics(rows);
    expect(m.total_assessments).toBe(4);
    expect(m.poor_count).toBe(1);
    expect(m.below_standard_count).toBe(1);
    expect(m.not_started_count).toBe(2);
    expect(m.no_action_plan_count).toBe(1);
    // 3 of 4 children_involved = 75%
    expect(m.children_involved_rate).toBe(75);
    // 4 of 4 staff_trained = 100%
    expect(m.staff_trained_rate).toBe(100);
    // 1 of 4 cost_saving = 25%
    expect(m.cost_saving_rate).toBe(25);
    // area_breakdown
    expect(m.area_breakdown["energy_efficiency"]).toBe(2);
    expect(m.area_breakdown["waste_management"]).toBe(2);
    // rating_breakdown
    expect(m.rating_breakdown["poor"]).toBe(1);
    expect(m.rating_breakdown["below_standard"]).toBe(1);
    expect(m.rating_breakdown["good"]).toBe(1);
    expect(m.rating_breakdown["excellent"]).toBe(1);
    // unique assessors: A, B, C
    expect(m.unique_assessors).toBe(3);
  });
});

describe("computeEnvironmentalImpactAlerts", () => {
  it("returns no alerts for empty data", () => {
    const alerts = computeEnvironmentalImpactAlerts([]);
    expect(alerts).toEqual([]);
  });

  it("generates critical alert for poor rating with no action plan", () => {
    const rows = [makeRow({ performance_rating: "poor", action_plan_created: false })];
    const alerts = computeEnvironmentalImpactAlerts(rows);
    const critical = alerts.filter((a) => a.type === "poor_no_action_plan");
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe("critical");
    expect(critical[0].record_id).toBe("eia-1");
  });

  it("generates high alert for below_standard with not_started improvement", () => {
    const rows = [makeRow({ performance_rating: "below_standard", improvement_status: "not_started" })];
    const alerts = computeEnvironmentalImpactAlerts(rows);
    const high = alerts.filter((a) => a.type === "below_standard_not_started");
    expect(high).toHaveLength(1);
    expect(high[0].severity).toBe("high");
  });

  it("generates high alert when >= 2 areas without progress monitoring", () => {
    const rows = [
      makeRow({ id: "r1", progress_monitored: false }),
      makeRow({ id: "r2", progress_monitored: false }),
    ];
    const alerts = computeEnvironmentalImpactAlerts(rows);
    const noProgress = alerts.filter((a) => a.type === "multiple_no_progress_monitoring");
    expect(noProgress).toHaveLength(1);
    expect(noProgress[0].severity).toBe("high");
    expect(noProgress[0].message).toContain("2");
  });

  it("generates medium alert when >= 2 assessments don't involve children", () => {
    const rows = [
      makeRow({ id: "r1", children_involved: false }),
      makeRow({ id: "r2", children_involved: false }),
    ];
    const alerts = computeEnvironmentalImpactAlerts(rows);
    const noChildren = alerts.filter((a) => a.type === "children_not_involved");
    expect(noChildren).toHaveLength(1);
    expect(noChildren[0].severity).toBe("medium");
  });

  it("does not trigger children_not_involved alert with only 1 not involved", () => {
    const rows = [
      makeRow({ id: "r1", children_involved: false }),
      makeRow({ id: "r2", children_involved: true }),
    ];
    const alerts = computeEnvironmentalImpactAlerts(rows);
    const noChildren = alerts.filter((a) => a.type === "children_not_involved");
    expect(noChildren).toHaveLength(0);
  });
});

describe("generateEnvironmentalImpactCaraInsights", () => {
  it("returns 3 insights", () => {
    const metrics = computeEnvironmentalImpactMetrics([]);
    const alerts = computeEnvironmentalImpactAlerts([]);
    const insights = generateEnvironmentalImpactCaraInsights(metrics, alerts);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[cyan]");
    expect(insights[1]).toContain("[amber]");
    expect(insights[2]).toContain("[reflect]");
  });

  it("includes poor count in reflect insight when poor exists", () => {
    const rows = [makeRow({ performance_rating: "poor", action_plan_created: false })];
    const metrics = computeEnvironmentalImpactMetrics(rows);
    const alerts = computeEnvironmentalImpactAlerts(rows);
    const insights = generateEnvironmentalImpactCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("poor");
  });
});
