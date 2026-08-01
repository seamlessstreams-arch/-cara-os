import { describe, it, expect } from "vitest";
import {
  computeCarePlanMetrics,
  identifyCarePlanAlerts,
  type CarePlan,
  type PlanObjective,
  type PlanReview,
} from "./care-planning-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makePlan(overrides: Partial<CarePlan> = {}): CarePlan {
  return {
    id: "plan-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex Smith",
    plan_type: "care_plan",
    status: "current",
    start_date: "2026-01-01",
    next_review_date: "2026-06-01",
    last_reviewed_date: "2026-03-01",
    social_worker: "SW Jones",
    key_worker: "KW Brown",
    objectives_count: 3,
    objectives_completed: 1,
    objectives_at_risk: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

function makeObjective(overrides: Partial<PlanObjective> = {}): PlanObjective {
  return {
    id: "obj-1",
    home_id: "home-1",
    plan_id: "plan-1",
    child_id: "child-1",
    child_name: "Alex Smith",
    objective: "Improve literacy",
    target_date: "2026-06-01",
    status: "in_progress",
    responsible_person: "KW Brown",
    progress_notes: [],
    evidence: [],
    date_completed: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

function makeReview(overrides: Partial<PlanReview> = {}): PlanReview {
  return {
    id: "rev-1",
    home_id: "home-1",
    plan_id: "plan-1",
    child_id: "child-1",
    child_name: "Alex Smith",
    review_type: "lac_review",
    review_date: "2026-04-01",
    chaired_by: "IRO Taylor",
    attendees: ["SW Jones", "KW Brown"],
    child_participated: true,
    child_views_recorded: true,
    outcome: "plan_amended",
    actions: ["Update PEP"],
    next_review_date: "2026-07-01",
    created_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeCarePlanMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeCarePlanMetrics([], [], [], 0, NOW);
    expect(result.total_plans).toBe(0);
    expect(result.current_plans).toBe(0);
    expect(result.overdue_reviews).toBe(0);
    expect(result.reviews_due_soon).toBe(0);
    expect(result.children_with_plans).toBe(0);
    expect(result.plan_coverage_rate).toBeNull(); // fab-0.;
    expect(result.total_objectives).toBe(0);
    expect(result.objectives_completed).toBe(0);
    expect(result.objectives_at_risk).toBe(0);
    expect(result.objective_completion_rate).toBeNull(); // fab-0.;
    expect(result.reviews_this_quarter).toBe(0);
    expect(result.child_participation_rate).toBeNull(); // fab-0.;
  });

  it("counts plans and statuses correctly", () => {
    const plans = [
      makePlan({ id: "p1", status: "current" }),
      makePlan({ id: "p2", status: "under_review", child_id: "child-2" }),
      makePlan({ id: "p3", status: "archived" }),
    ];
    const result = computeCarePlanMetrics(plans, [], [], 4, NOW);
    expect(result.total_plans).toBe(3);
    expect(result.current_plans).toBe(1);
    expect(result.children_with_plans).toBe(2); // archived excluded
    expect(result.plan_coverage_rate).toBe(50);
    expect(result.by_plan_status).toEqual({ current: 1, under_review: 1, archived: 1 });
  });

  it("detects overdue reviews and reviews due soon", () => {
    const plans = [
      makePlan({ id: "p1", next_review_date: "2026-05-01" }), // overdue (before NOW)
      makePlan({ id: "p2", next_review_date: "2026-05-28" }), // due within 14 days
      makePlan({ id: "p3", next_review_date: "2026-07-01" }), // not due soon
    ];
    const result = computeCarePlanMetrics(plans, [], [], 3, NOW);
    expect(result.overdue_reviews).toBe(1);
    expect(result.reviews_due_soon).toBe(1);
  });

  it("calculates objective metrics", () => {
    const objectives = [
      makeObjective({ id: "o1", status: "completed" }),
      makeObjective({ id: "o2", status: "at_risk" }),
      makeObjective({ id: "o3", status: "in_progress" }),
      makeObjective({ id: "o4", status: "not_achieved" }),
    ];
    const result = computeCarePlanMetrics([], objectives, [], 2, NOW);
    expect(result.total_objectives).toBe(4);
    expect(result.objectives_completed).toBe(1);
    expect(result.objectives_at_risk).toBe(1);
    expect(result.objective_completion_rate).toBe(25);
  });

  it("counts reviews this quarter and participation rate", () => {
    const reviews = [
      makeReview({ id: "r1", review_date: "2026-04-01", child_participated: true }),
      makeReview({ id: "r2", review_date: "2026-05-15", child_participated: false }),
      makeReview({ id: "r3", review_date: "2025-01-01", child_participated: true }), // too old
    ];
    const result = computeCarePlanMetrics([], [], reviews, 2, NOW);
    expect(result.reviews_this_quarter).toBe(2);
    expect(result.child_participation_rate).toBe(66.7);
  });

  it("builds by_plan_type from active plans only", () => {
    const plans = [
      makePlan({ id: "p1", plan_type: "care_plan", status: "current" }),
      makePlan({ id: "p2", plan_type: "placement_plan", status: "current" }),
      makePlan({ id: "p3", plan_type: "care_plan", status: "archived" }),
    ];
    const result = computeCarePlanMetrics(plans, [], [], 2, NOW);
    expect(result.by_plan_type).toEqual({ care_plan: 1, placement_plan: 1 });
  });
});

describe("identifyCarePlanAlerts", () => {
  it("returns no alerts for empty data", () => {
    const alerts = identifyCarePlanAlerts([], [], [], 0, NOW);
    expect(alerts).toEqual([]);
  });

  it("fires critical alert for review overdue > 14 days", () => {
    const plans = [makePlan({ next_review_date: "2026-04-01" })]; // 50 days overdue
    const alerts = identifyCarePlanAlerts(plans, [], [], 1, NOW);
    const overdue = alerts.filter((a) => a.type === "review_overdue" && a.severity === "critical");
    expect(overdue.length).toBe(1);
  });

  it("fires high alert for review overdue <= 14 days", () => {
    const plans = [makePlan({ next_review_date: "2026-05-15" })]; // 6 days overdue
    const alerts = identifyCarePlanAlerts(plans, [], [], 1, NOW);
    const overdue = alerts.filter((a) => a.type === "review_overdue" && a.severity === "high");
    expect(overdue.length).toBe(1);
  });

  it("fires medium alert for review due soon", () => {
    const plans = [makePlan({ next_review_date: "2026-05-28" })]; // within 14 days
    const alerts = identifyCarePlanAlerts(plans, [], [], 1, NOW);
    const dueSoon = alerts.filter((a) => a.type === "review_due_soon");
    expect(dueSoon.length).toBe(1);
    expect(dueSoon[0].severity).toBe("medium");
  });

  it("fires high alert for objectives at risk", () => {
    const objectives = [makeObjective({ status: "at_risk" })];
    const alerts = identifyCarePlanAlerts([], objectives, [], 1, NOW);
    const atRisk = alerts.filter((a) => a.type === "objective_at_risk");
    expect(atRisk.length).toBe(1);
    expect(atRisk[0].severity).toBe("high");
  });

  it("fires critical alert for children without plans", () => {
    // No active plans but 2 children
    const alerts = identifyCarePlanAlerts([], [], [], 2, NOW);
    const gap = alerts.filter((a) => a.type === "children_without_plans");
    expect(gap.length).toBe(1);
    expect(gap[0].severity).toBe("critical");
  });

  it("fires medium alert for low child participation (< 80% with >= 3 reviews)", () => {
    const reviews = [
      makeReview({ id: "r1", child_participated: true }),
      makeReview({ id: "r2", child_participated: false }),
      makeReview({ id: "r3", child_participated: false }),
    ];
    const alerts = identifyCarePlanAlerts([], [], reviews, 1, NOW);
    const low = alerts.filter((a) => a.type === "low_participation");
    expect(low.length).toBe(1);
    expect(low[0].severity).toBe("medium");
  });

  it("fires medium alert for overdue objectives", () => {
    const objectives = [makeObjective({ status: "in_progress", target_date: "2026-04-01" })];
    const alerts = identifyCarePlanAlerts([], objectives, [], 1, NOW);
    const overdue = alerts.filter((a) => a.type === "objective_overdue");
    expect(overdue.length).toBe(1);
  });
});
