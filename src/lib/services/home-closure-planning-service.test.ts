import { describe, it, expect } from "vitest";
import {
  computeHomeClosurePlanningMetrics,
  computeHomeClosurePlanningAlerts,
  generateHomeClosurePlanningCaraInsights,
  type HomeClosurePlanningRow,
} from "./home-closure-planning-service";

// ── Factory ──────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<HomeClosurePlanningRow> = {}): HomeClosurePlanningRow {
  return {
    id: "row-1",
    home_id: "home-1",
    closure_reason: "provider_decision",
    closure_phase: "consultation",
    planned_closure_date: "2026-08-01",
    actual_closure_date: null,
    child_name: "Alice",
    child_id: "child-1",
    child_transfer_status: "matching_in_progress",
    receiving_home: null,
    stakeholder_notified: "ofsted",
    notification_date: "2026-05-01",
    child_views_sought: true,
    child_wishes_documented: true,
    staff_consultation_completed: true,
    regulatory_notification_sent: true,
    transition_plan_in_place: true,
    risk_assessment_completed: true,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// ── computeHomeClosurePlanningMetrics ────────────────────────────────────

describe("computeHomeClosurePlanningMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeHomeClosurePlanningMetrics([]);
    expect(result.total_records).toBe(0);
    expect(result.disrupted_count).toBe(0);
    expect(result.not_started_count).toBe(0);
    expect(result.children_without_plan_count).toBe(0);
    expect(result.regulatory_not_sent_count).toBe(0);
    expect(result.child_views_rate).toBe(0);
    expect(result.transition_plan_rate).toBe(0);
    expect(result.unique_children).toBe(0);
  });

  it("computes correct counts with populated data", () => {
    const rows = [
      makeRow({ child_name: "Alice", child_transfer_status: "disrupted", transition_plan_in_place: false, regulatory_notification_sent: false }),
      makeRow({ id: "row-2", child_name: "Bob", child_transfer_status: "not_started", child_views_sought: false }),
      makeRow({ id: "row-3", child_name: "Charlie", child_transfer_status: "transferred" }),
    ];
    const result = computeHomeClosurePlanningMetrics(rows);
    expect(result.total_records).toBe(3);
    expect(result.disrupted_count).toBe(1);
    expect(result.not_started_count).toBe(1);
    expect(result.children_without_plan_count).toBe(1);
    expect(result.regulatory_not_sent_count).toBe(1);
    expect(result.unique_children).toBe(3);
    // child_views_rate: 2/3 = 66.7%
    expect(result.child_views_rate).toBe(66.7);
    // transition_plan_rate: 2/3 = 66.7%
    expect(result.transition_plan_rate).toBe(66.7);
  });

  it("builds phase and transfer status breakdowns", () => {
    const rows = [
      makeRow({ closure_phase: "consultation", child_transfer_status: "matching_in_progress" }),
      makeRow({ id: "row-2", closure_phase: "active_transition", child_transfer_status: "transferred" }),
      makeRow({ id: "row-3", closure_phase: "consultation", child_transfer_status: "matching_in_progress" }),
    ];
    const result = computeHomeClosurePlanningMetrics(rows);
    expect(result.phase_breakdown.consultation).toBe(2);
    expect(result.phase_breakdown.active_transition).toBe(1);
    expect(result.transfer_status_breakdown.matching_in_progress).toBe(2);
    expect(result.transfer_status_breakdown.transferred).toBe(1);
  });
});

// ── computeHomeClosurePlanningAlerts ─────────────────────────────────────

describe("computeHomeClosurePlanningAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(computeHomeClosurePlanningAlerts([])).toHaveLength(0);
  });

  it("raises critical alert for disrupted + no transition plan", () => {
    const rows = [makeRow({ child_transfer_status: "disrupted", transition_plan_in_place: false })];
    const alerts = computeHomeClosurePlanningAlerts(rows);
    const match = alerts.filter((a) => a.type === "disrupted_no_plan");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("critical");
  });

  it("does NOT raise critical alert for disrupted WITH transition plan", () => {
    const rows = [makeRow({ child_transfer_status: "disrupted", transition_plan_in_place: true })];
    const alerts = computeHomeClosurePlanningAlerts(rows);
    expect(alerts.filter((a) => a.type === "disrupted_no_plan")).toHaveLength(0);
  });

  it("raises high alert for active_transition without regulatory notification (>= 1)", () => {
    const rows = [makeRow({ closure_phase: "active_transition", regulatory_notification_sent: false })];
    const alerts = computeHomeClosurePlanningAlerts(rows);
    const match = alerts.filter((a) => a.type === "regulatory_not_sent_active");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("high");
  });

  it("raises high alert for child views not sought (>= 2)", () => {
    const rows = [
      makeRow({ child_views_sought: false }),
      makeRow({ id: "row-2", child_views_sought: false }),
    ];
    const alerts = computeHomeClosurePlanningAlerts(rows);
    const match = alerts.filter((a) => a.type === "child_views_not_sought");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("high");
  });

  it("does NOT raise child_views_not_sought with only 1 missing", () => {
    const rows = [makeRow({ child_views_sought: false })];
    const alerts = computeHomeClosurePlanningAlerts(rows);
    expect(alerts.filter((a) => a.type === "child_views_not_sought")).toHaveLength(0);
  });

  it("raises medium alert for staff consultation incomplete (>= 1)", () => {
    const rows = [makeRow({ staff_consultation_completed: false })];
    const alerts = computeHomeClosurePlanningAlerts(rows);
    const match = alerts.filter((a) => a.type === "staff_consultation_incomplete");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("medium");
  });
});

// ── generateHomeClosurePlanningCaraInsights ──────────────────────────────

describe("generateHomeClosurePlanningCaraInsights", () => {
  it("returns 3 insights", () => {
    const metrics = computeHomeClosurePlanningMetrics([makeRow()]);
    const alerts = computeHomeClosurePlanningAlerts([makeRow()]);
    const insights = generateHomeClosurePlanningCaraInsights(metrics, alerts);
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights for empty data", () => {
    const metrics = computeHomeClosurePlanningMetrics([]);
    const alerts = computeHomeClosurePlanningAlerts([]);
    const insights = generateHomeClosurePlanningCaraInsights(metrics, alerts);
    expect(insights).toHaveLength(3);
  });
});
