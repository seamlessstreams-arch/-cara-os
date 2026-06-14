import { describe, it, expect } from "vitest";
import {
  computeLacHealthAssessmentMetrics,
  computeLacHealthAssessmentAlerts,
  generateLacHealthAssessmentCaraInsights,
  type LacHealthAssessmentRow,
} from "./lac-health-assessment-service";

function makeRow(overrides: Partial<LacHealthAssessmentRow> = {}): LacHealthAssessmentRow {
  return {
    id: "lha-1",
    home_id: "home-1",
    child_name: "Alice",
    child_id: "child-1",
    assessment_date: "2026-05-01",
    assessment_type: "initial_health_assessment",
    health_outcome: "all_actions_met",
    compliance_status: "within_timescale",
    health_domain: "physical_health",
    clinician_name: "Dr Smith",
    clinic_location: "Local Clinic",
    health_action_plan_created: true,
    actions_completed: true,
    child_attended: true,
    child_views_captured: true,
    carer_attended: true,
    shared_with_social_worker: true,
    next_assessment_due: null,
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeLacHealthAssessmentMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeLacHealthAssessmentMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.overdue_count).toBe(0);
    expect(m.urgent_concern_count).toBe(0);
    expect(m.child_attended_rate).toBe(0);
    expect(m.unique_children).toBe(0);
  });

  it("computes correct counts and rates for populated data", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alice", compliance_status: "overdue", health_outcome: "urgent_concern", child_views_captured: false }),
      makeRow({ id: "2", child_name: "Bob", compliance_status: "significantly_overdue", health_outcome: "referral_required" }),
      makeRow({ id: "3", child_name: "Alice", health_outcome: "not_completed", health_action_plan_created: false }),
    ];
    const m = computeLacHealthAssessmentMetrics(rows);
    expect(m.total_assessments).toBe(3);
    expect(m.overdue_count).toBe(2);
    expect(m.urgent_concern_count).toBe(1);
    expect(m.not_completed_count).toBe(1);
    expect(m.referral_required_count).toBe(1);
    expect(m.unique_children).toBe(2);
    // child_views_captured: 2 out of 3 = 66.7%
    expect(m.child_views_rate).toBe(66.7);
    // action_plan: 2 out of 3 = 66.7%
    expect(m.action_plan_rate).toBe(66.7);
  });
});

describe("computeLacHealthAssessmentAlerts", () => {
  it("returns empty alerts for empty data", () => {
    expect(computeLacHealthAssessmentAlerts([])).toEqual([]);
  });

  it("triggers urgent_concern_not_shared alert (critical)", () => {
    const rows = [
      makeRow({ id: "a1", health_outcome: "urgent_concern", shared_with_social_worker: false, child_name: "Alice" }),
    ];
    const alerts = computeLacHealthAssessmentAlerts(rows);
    const found = alerts.find((a) => a.type === "urgent_concern_not_shared");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
    expect(found!.record_id).toBe("a1");
  });

  it("triggers significantly_overdue alert (high)", () => {
    const rows = [
      makeRow({ id: "a2", compliance_status: "significantly_overdue", child_name: "Bob" }),
    ];
    const alerts = computeLacHealthAssessmentAlerts(rows);
    const found = alerts.find((a) => a.type === "significantly_overdue");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("triggers child_views_not_captured when >= 2 without views (high)", () => {
    const rows = [
      makeRow({ id: "1", child_views_captured: false }),
      makeRow({ id: "2", child_views_captured: false }),
    ];
    const alerts = computeLacHealthAssessmentAlerts(rows);
    const found = alerts.find((a) => a.type === "child_views_not_captured");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("does not trigger child_views_not_captured for only 1 without views", () => {
    const rows = [
      makeRow({ id: "1", child_views_captured: false }),
      makeRow({ id: "2", child_views_captured: true }),
    ];
    const alerts = computeLacHealthAssessmentAlerts(rows);
    const found = alerts.find((a) => a.type === "child_views_not_captured");
    expect(found).toBeUndefined();
  });

  it("triggers action_plans_not_created when >= 2 without plans (medium)", () => {
    const rows = [
      makeRow({ id: "1", health_action_plan_created: false }),
      makeRow({ id: "2", health_action_plan_created: false }),
    ];
    const alerts = computeLacHealthAssessmentAlerts(rows);
    const found = alerts.find((a) => a.type === "action_plans_not_created");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });
});

describe("generateLacHealthAssessmentCaraInsights", () => {
  it("returns 3 insights", () => {
    const rows = [makeRow(), makeRow({ id: "2", child_name: "Bob" })];
    const metrics = computeLacHealthAssessmentMetrics(rows);
    const alerts = computeLacHealthAssessmentAlerts(rows);
    const insights = generateLacHealthAssessmentCaraInsights(metrics, alerts);
    expect(insights.length).toBe(3);
    expect(insights[0]).toContain("[pink]");
    expect(insights[1]).toContain("[amber]");
    expect(insights[2]).toContain("[reflect]");
  });
});
