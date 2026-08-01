import { describe, it, expect } from "vitest";
import {
  computePlanCompliance,
  computeChildPlanProfile,
  computeLACReviewCompliance,
  identifyPlanAlerts,
  PLAN_TYPES,
} from "./placement-service";
import type { PlacementPlan, LACReview } from "./placement-service";

// -- Factories ----------------------------------------------------------------

function makePlan(overrides: Partial<PlacementPlan> = {}): PlacementPlan {
  return {
    id: "plan-1",
    home_id: "home-1",
    child_id: "child-1",
    plan_type: "placement_plan",
    title: "Placement Plan",
    status: "active",
    version: 1,
    sections: [
      { section: "personal_details", content: "Done", completed: true },
      { section: "education", content: "Done", completed: true },
    ],
    objectives: [
      { objective: "Settle in", status: "achieved" },
      { objective: "Education", status: "in_progress" },
    ],
    placing_authority: "LA-1",
    social_worker_name: "SW1",
    iro_name: null,
    created_by: "staff-1",
    approved_by: null,
    approved_date: null,
    review_date: null,
    next_review_date: "2026-07-01",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

function makeReview(overrides: Partial<LACReview> = {}): LACReview {
  return {
    id: "review-1",
    home_id: "home-1",
    child_id: "child-1",
    review_type: "subsequent",
    review_date: "2026-04-01",
    chaired_by: "IRO-1",
    attendees: ["staff-1", "sw-1"],
    outcomes: ["Positive progress"],
    actions: [
      { action: "Update plan", responsible: "staff-1", due_date: "2026-06-01", completed: false },
    ],
    child_participated: true,
    child_views_recorded: true,
    plan_changes: [],
    next_review_date: "2026-10-01",
    minutes_recorded: true,
    status: "completed",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computePlanCompliance ----------------------------------------------------

describe("computePlanCompliance", () => {
  it("returns zeroes for empty plans", () => {
    const m = computePlanCompliance([]);
    expect(m.total_plans).toBe(0);
    expect(m.active_plans).toBe(0);
    expect(m.draft_plans).toBe(0);
    expect(m.overdue_reviews).toBe(0);
    expect(m.completion_rate).toBeNull(); // fab-0.
    expect(m.objectives_met_rate).toBeNull(); // fab-0.
    expect(m.avg_sections_complete).toBe(0);
  });

  it("counts active and draft plans", () => {
    const plans = [
      makePlan({ id: "1", status: "active" }),
      makePlan({ id: "2", status: "draft" }),
      makePlan({ id: "3", status: "active" }),
      makePlan({ id: "4", status: "archived" }),
    ];
    const m = computePlanCompliance(plans);
    expect(m.total_plans).toBe(4);
    expect(m.active_plans).toBe(2);
    expect(m.draft_plans).toBe(1);
  });

  it("counts overdue reviews for active plans", () => {
    const plans = [
      makePlan({ id: "1", status: "active", next_review_date: "2025-01-01" }),
      makePlan({ id: "2", status: "active", next_review_date: "2099-01-01" }),
      makePlan({ id: "3", status: "draft", next_review_date: "2025-01-01" }), // not active, not counted
    ];
    const m = computePlanCompliance(plans);
    expect(m.overdue_reviews).toBe(1);
  });

  it("computes completion rate based on active plans with all sections completed", () => {
    const plans = [
      makePlan({
        id: "1",
        status: "active",
        sections: [
          { section: "a", content: "", completed: true },
          { section: "b", content: "", completed: true },
        ],
      }),
      makePlan({
        id: "2",
        status: "active",
        sections: [
          { section: "a", content: "", completed: true },
          { section: "b", content: "", completed: false },
        ],
      }),
    ];
    const m = computePlanCompliance(plans);
    expect(m.completion_rate).toBe(50); // 1 out of 2 active plans fully completed
  });

  it("computes objectives met rate", () => {
    const plans = [
      makePlan({
        id: "1",
        objectives: [
          { objective: "A", status: "achieved" },
          { objective: "B", status: "achieved" },
          { objective: "C", status: "in_progress" },
          { objective: "D", status: "not_started" },
        ],
      }),
    ];
    const m = computePlanCompliance(plans);
    expect(m.objectives_met_rate).toBe(50); // 2/4
  });

  it("builds by_type and by_status maps", () => {
    const plans = [
      makePlan({ id: "1", plan_type: "placement_plan", status: "active" }),
      makePlan({ id: "2", plan_type: "care_plan", status: "draft" }),
    ];
    const m = computePlanCompliance(plans);
    expect(m.by_type).toEqual({ placement_plan: 1, care_plan: 1 });
    expect(m.by_status).toEqual({ active: 1, draft: 1 });
  });
});

// -- computeLACReviewCompliance -----------------------------------------------

describe("computeLACReviewCompliance", () => {
  it("returns zeroes for empty reviews", () => {
    const m = computeLACReviewCompliance([]);
    expect(m.total_reviews).toBe(0);
    expect(m.completed).toBe(0);
    expect(m.scheduled).toBe(0);
    expect(m.cancelled).toBe(0);
    expect(m.child_participation_rate).toBeNull(); // fab-0.
    expect(m.action_completion_rate).toBeNull(); // fab-0.
  });

  it("counts completed, scheduled, cancelled", () => {
    const reviews = [
      makeReview({ id: "1", status: "completed" }),
      makeReview({ id: "2", status: "scheduled" }),
      makeReview({ id: "3", status: "cancelled" }),
    ];
    const m = computeLACReviewCompliance(reviews);
    expect(m.completed).toBe(1);
    expect(m.scheduled).toBe(1);
    expect(m.cancelled).toBe(1);
  });

  it("computes child participation and views rates from completed reviews only", () => {
    const reviews = [
      makeReview({ id: "1", status: "completed", child_participated: true, child_views_recorded: true }),
      makeReview({ id: "2", status: "completed", child_participated: false, child_views_recorded: false }),
      makeReview({ id: "3", status: "scheduled", child_participated: false, child_views_recorded: false }),
    ];
    const m = computeLACReviewCompliance(reviews);
    expect(m.child_participation_rate).toBe(50);
    expect(m.child_views_rate).toBe(50);
  });

  it("computes action completion rate and overdue actions", () => {
    const reviews = [
      makeReview({
        id: "1",
        actions: [
          { action: "A", responsible: "s1", due_date: "2025-01-01", completed: true },
          { action: "B", responsible: "s1", due_date: "2025-01-01", completed: false },
          { action: "C", responsible: "s1", due_date: "2099-01-01", completed: false },
        ],
      }),
    ];
    const m = computeLACReviewCompliance(reviews);
    expect(m.total_actions).toBe(3);
    expect(m.overdue_actions).toBe(1);
    // 1/3 completed = 33.3%
    expect(m.action_completion_rate).toBe(33.3);
  });
});

// -- identifyPlanAlerts -------------------------------------------------------

describe("identifyPlanAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyPlanAlerts([], [])).toEqual([]);
  });

  it("fires missing_placement_plan critical when no active placement plan", () => {
    const plans = [makePlan({ child_id: "c1", plan_type: "care_plan", status: "active" })];
    const alerts = identifyPlanAlerts(plans, []);
    expect(alerts.some((a) => a.type === "missing_placement_plan" && a.severity === "critical" && a.child_id === "c1")).toBe(true);
  });

  it("fires missing_care_plan high when no active care plan", () => {
    const plans = [makePlan({ child_id: "c1", plan_type: "placement_plan", status: "active" })];
    const alerts = identifyPlanAlerts(plans, []);
    expect(alerts.some((a) => a.type === "missing_care_plan" && a.severity === "high" && a.child_id === "c1")).toBe(true);
  });

  it("fires review_overdue when active plan review date is past", () => {
    const plans = [
      makePlan({ child_id: "c1", status: "active", next_review_date: "2025-01-01" }),
    ];
    const alerts = identifyPlanAlerts(plans, []);
    expect(alerts.some((a) => a.type === "review_overdue" && a.severity === "high")).toBe(true);
  });

  it("fires lac_review_overdue when child has no completed reviews", () => {
    const reviews = [makeReview({ child_id: "c1", status: "scheduled" })];
    const alerts = identifyPlanAlerts([], reviews);
    expect(alerts.some((a) => a.type === "lac_review_overdue" && a.child_id === "c1")).toBe(true);
  });

  it("fires low_completion for active plan with < 50% sections completed", () => {
    const plans = [
      makePlan({
        child_id: "c1",
        status: "active",
        plan_type: "placement_plan",
        sections: [
          { section: "a", content: "", completed: true },
          { section: "b", content: "", completed: false },
          { section: "c", content: "", completed: false },
          { section: "d", content: "", completed: false },
        ],
      }),
    ];
    const alerts = identifyPlanAlerts(plans, []);
    expect(alerts.some((a) => a.type === "low_completion" && a.severity === "medium")).toBe(true);
  });
});

// -- computeChildPlanProfile --------------------------------------------------

describe("computeChildPlanProfile", () => {
  it("returns empty profile when no data for child", () => {
    const p = computeChildPlanProfile("c-unknown", [], []);
    expect(p.active_plans).toEqual([]);
    expect(p.total_objectives).toBe(0);
    expect(p.lac_reviews_count).toBe(0);
    expect(p.child_participation_rate).toBeNull(); // fab-0.
    // All 3 statutory plan types should be missing
    const statutory = PLAN_TYPES.filter((pt) => pt.statutory).map((pt) => pt.type);
    expect(p.missing_plans).toEqual(statutory);
  });

  it("identifies missing statutory plans", () => {
    const plans = [
      makePlan({ child_id: "c1", plan_type: "placement_plan", status: "active" }),
    ];
    const p = computeChildPlanProfile("c1", plans, []);
    expect(p.missing_plans).toContain("care_plan");
    expect(p.missing_plans).toContain("pathway_plan");
    expect(p.missing_plans).not.toContain("placement_plan");
  });

  it("computes objectives achieved and in progress", () => {
    const plans = [
      makePlan({
        child_id: "c1",
        objectives: [
          { objective: "A", status: "achieved" },
          { objective: "B", status: "in_progress" },
          { objective: "C", status: "not_started" },
        ],
      }),
    ];
    const p = computeChildPlanProfile("c1", plans, []);
    expect(p.total_objectives).toBe(3);
    expect(p.objectives_achieved).toBe(1);
    expect(p.objectives_in_progress).toBe(1);
  });
});
