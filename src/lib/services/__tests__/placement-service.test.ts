// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PLACEMENT & CARE PLANNING SERVICE TESTS
// Pure-function unit tests for plan compliance computation, child plan profile
// aggregation, LAC review compliance, plan alerts, and constant validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  PLAN_TYPES,
  PLAN_SECTIONS,
  LAC_REVIEW_TYPES,
  PLAN_STATUSES,
} from "../placement-service";
import { _testing } from "../placement-service";

const {
  computePlanCompliance,
  computeChildPlanProfile,
  computeLACReviewCompliance,
  identifyPlanAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal PlacementPlan for testing. */
function makePlan(
  overrides: Record<string, unknown> = {},
): {
  id: string;
  home_id: string;
  child_id: string;
  plan_type: string;
  title: string;
  status: string;
  version: number;
  sections: { section: string; content: string; completed: boolean; last_updated?: string }[];
  objectives: { objective: string; target_date?: string; status: string; progress_notes?: string }[];
  placing_authority: string;
  social_worker_name?: string | null;
  iro_name?: string | null;
  created_by: string;
  approved_by?: string | null;
  approved_date?: string | null;
  review_date?: string | null;
  next_review_date?: string | null;
  created_at: string;
  updated_at: string;
} {
  return {
    id: "id" in overrides ? (overrides.id as string) : "plan-1",
    home_id: "home_id" in overrides ? (overrides.home_id as string) : "home-1",
    child_id: "child_id" in overrides ? (overrides.child_id as string) : "child-1",
    plan_type: "plan_type" in overrides ? (overrides.plan_type as string) : "placement_plan",
    title: "title" in overrides ? (overrides.title as string) : "Test Plan",
    status: "status" in overrides ? (overrides.status as string) : "active",
    version: "version" in overrides ? (overrides.version as number) : 1,
    sections: "sections" in overrides
      ? (overrides.sections as { section: string; content: string; completed: boolean; last_updated?: string }[])
      : [
          { section: "personal_details", content: "Details", completed: true },
          { section: "education", content: "Education", completed: false },
        ],
    objectives: "objectives" in overrides
      ? (overrides.objectives as { objective: string; target_date?: string; status: string; progress_notes?: string }[])
      : [{ objective: "Settle in", status: "in_progress" }],
    placing_authority: "placing_authority" in overrides ? (overrides.placing_authority as string) : "LA-1",
    social_worker_name: "social_worker_name" in overrides ? (overrides.social_worker_name as string | null) : null,
    iro_name: "iro_name" in overrides ? (overrides.iro_name as string | null) : null,
    created_by: "created_by" in overrides ? (overrides.created_by as string) : "user-1",
    approved_by: "approved_by" in overrides ? (overrides.approved_by as string | null) : null,
    approved_date: "approved_date" in overrides ? (overrides.approved_date as string | null) : null,
    review_date: "review_date" in overrides ? (overrides.review_date as string | null) : null,
    next_review_date: "next_review_date" in overrides ? (overrides.next_review_date as string | null) : null,
    created_at: "created_at" in overrides ? (overrides.created_at as string) : "2026-01-01T00:00:00Z",
    updated_at: "updated_at" in overrides ? (overrides.updated_at as string) : "2026-01-01T00:00:00Z",
  };
}

/** Build a minimal LACReview for testing. */
function makeReview(
  overrides: Record<string, unknown> = {},
): {
  id: string;
  home_id: string;
  child_id: string;
  review_type: string;
  review_date: string;
  chaired_by: string;
  attendees: string[];
  outcomes: string[];
  actions: { action: string; responsible: string; due_date: string; completed: boolean }[];
  child_participated: boolean;
  child_views_recorded: boolean;
  plan_changes: string[];
  next_review_date?: string | null;
  minutes_recorded: boolean;
  status: string;
  created_at: string;
  updated_at: string;
} {
  return {
    id: "id" in overrides ? (overrides.id as string) : "review-1",
    home_id: "home_id" in overrides ? (overrides.home_id as string) : "home-1",
    child_id: "child_id" in overrides ? (overrides.child_id as string) : "child-1",
    review_type: "review_type" in overrides ? (overrides.review_type as string) : "initial",
    review_date: "review_date" in overrides ? (overrides.review_date as string) : "2026-04-01",
    chaired_by: "chaired_by" in overrides ? (overrides.chaired_by as string) : "IRO Smith",
    attendees: "attendees" in overrides ? (overrides.attendees as string[]) : ["IRO Smith", "SW Jones"],
    outcomes: "outcomes" in overrides ? (overrides.outcomes as string[]) : ["Settled well"],
    actions: "actions" in overrides
      ? (overrides.actions as { action: string; responsible: string; due_date: string; completed: boolean }[])
      : [],
    child_participated: "child_participated" in overrides ? (overrides.child_participated as boolean) : true,
    child_views_recorded: "child_views_recorded" in overrides ? (overrides.child_views_recorded as boolean) : true,
    plan_changes: "plan_changes" in overrides ? (overrides.plan_changes as string[]) : [],
    next_review_date: "next_review_date" in overrides ? (overrides.next_review_date as string | null) : null,
    minutes_recorded: "minutes_recorded" in overrides ? (overrides.minutes_recorded as boolean) : true,
    status: "status" in overrides ? (overrides.status as string) : "completed",
    created_at: "created_at" in overrides ? (overrides.created_at as string) : "2026-04-01T00:00:00Z",
    updated_at: "updated_at" in overrides ? (overrides.updated_at as string) : "2026-04-01T00:00:00Z",
  };
}

// ── computePlanCompliance ───────────────────────────────────────────────

describe("computePlanCompliance", () => {
  it("returns zeroed metrics for an empty array", () => {
    const result = computePlanCompliance([]);
    expect(result.total_plans).toBe(0);
    expect(result.active_plans).toBe(0);
    expect(result.draft_plans).toBe(0);
    expect(result.overdue_reviews).toBe(0);
    expect(result.completion_rate).toBe(0);
    expect(result.objectives_met_rate).toBe(0);
    expect(result.avg_sections_complete).toBe(0);
    expect(result.by_type).toEqual({});
    expect(result.by_status).toEqual({});
  });

  it("counts active and draft plans correctly", () => {
    const plans = [
      makePlan({ id: "p1", status: "active" }),
      makePlan({ id: "p2", status: "active" }),
      makePlan({ id: "p3", status: "draft" }),
      makePlan({ id: "p4", status: "superseded" }),
    ];
    const result = computePlanCompliance(plans);
    expect(result.total_plans).toBe(4);
    expect(result.active_plans).toBe(2);
    expect(result.draft_plans).toBe(1);
  });

  it("groups by_type correctly", () => {
    const plans = [
      makePlan({ id: "p1", plan_type: "care_plan" }),
      makePlan({ id: "p2", plan_type: "care_plan" }),
      makePlan({ id: "p3", plan_type: "placement_plan" }),
    ];
    const result = computePlanCompliance(plans);
    expect(result.by_type).toEqual({ care_plan: 2, placement_plan: 1 });
  });

  it("groups by_status correctly", () => {
    const plans = [
      makePlan({ id: "p1", status: "active" }),
      makePlan({ id: "p2", status: "active" }),
      makePlan({ id: "p3", status: "draft" }),
    ];
    const result = computePlanCompliance(plans);
    expect(result.by_status).toEqual({ active: 2, draft: 1 });
  });

  it("detects overdue reviews on active plans", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", next_review_date: "2020-01-01" }),
      makePlan({ id: "p2", status: "active", next_review_date: "2099-01-01" }),
      makePlan({ id: "p3", status: "active", next_review_date: null }),
    ];
    const result = computePlanCompliance(plans);
    expect(result.overdue_reviews).toBe(1);
  });

  it("does not count overdue reviews on non-active plans", () => {
    const plans = [
      makePlan({ id: "p1", status: "draft", next_review_date: "2020-01-01" }),
      makePlan({ id: "p2", status: "superseded", next_review_date: "2020-01-01" }),
    ];
    const result = computePlanCompliance(plans);
    expect(result.overdue_reviews).toBe(0);
  });

  it("computes completion_rate as percentage of fully completed active plans", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "active",
        sections: [
          { section: "a", content: "", completed: true },
          { section: "b", content: "", completed: true },
        ],
      }),
      makePlan({
        id: "p2",
        status: "active",
        sections: [
          { section: "a", content: "", completed: true },
          { section: "b", content: "", completed: false },
        ],
      }),
    ];
    const result = computePlanCompliance(plans);
    // 1 of 2 active plans fully completed = 50%
    expect(result.completion_rate).toBe(50);
  });

  it("returns completion_rate 0 when no active plans exist", () => {
    const plans = [makePlan({ status: "draft" })];
    const result = computePlanCompliance(plans);
    expect(result.completion_rate).toBe(0);
  });

  it("treats active plans with empty sections as not fully completed", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", sections: [] }),
    ];
    const result = computePlanCompliance(plans);
    // sections.length === 0, so sections.every() would be true but the code checks sections.length > 0 first
    expect(result.completion_rate).toBe(0);
  });

  it("computes objectives_met_rate across all plans", () => {
    const plans = [
      makePlan({
        id: "p1",
        objectives: [
          { objective: "A", status: "achieved" },
          { objective: "B", status: "in_progress" },
        ],
      }),
      makePlan({
        id: "p2",
        objectives: [
          { objective: "C", status: "achieved" },
          { objective: "D", status: "achieved" },
        ],
      }),
    ];
    const result = computePlanCompliance(plans);
    // 3 achieved / 4 total = 75%
    expect(result.objectives_met_rate).toBe(75);
  });

  it("returns objectives_met_rate 0 when no objectives exist", () => {
    const plans = [makePlan({ objectives: [] })];
    const result = computePlanCompliance(plans);
    expect(result.objectives_met_rate).toBe(0);
  });

  it("computes avg_sections_complete across active plans", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "active",
        sections: [
          { section: "a", content: "", completed: true },
          { section: "b", content: "", completed: true },
          { section: "c", content: "", completed: false },
          { section: "d", content: "", completed: false },
        ],
      }),
      makePlan({
        id: "p2",
        status: "active",
        sections: [
          { section: "a", content: "", completed: true },
          { section: "b", content: "", completed: true },
          { section: "c", content: "", completed: true },
          { section: "d", content: "", completed: true },
        ],
      }),
    ];
    const result = computePlanCompliance(plans);
    // Plan 1: 50%, Plan 2: 100%. Average = 75%
    expect(result.avg_sections_complete).toBe(75);
  });

  it("handles active plans with empty sections in avg_sections_complete", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", sections: [] }),
    ];
    const result = computePlanCompliance(plans);
    // sections.length === 0 yields 0 for that plan
    expect(result.avg_sections_complete).toBe(0);
  });
});

// ── computeChildPlanProfile ─────────────────────────────────────────────

describe("computeChildPlanProfile", () => {
  it("returns empty profile when child has no plans or reviews", () => {
    const result = computeChildPlanProfile("child-1", [], []);
    expect(result.child_id).toBe("child-1");
    expect(result.active_plans).toEqual([]);
    expect(result.total_objectives).toBe(0);
    expect(result.objectives_achieved).toBe(0);
    expect(result.objectives_in_progress).toBe(0);
    expect(result.last_lac_review).toBeNull();
    expect(result.next_lac_review).toBeNull();
    expect(result.lac_reviews_count).toBe(0);
    expect(result.child_participation_rate).toBe(0);
  });

  it("lists all statutory plan types as missing when child has no active plans", () => {
    const result = computeChildPlanProfile("child-1", [], []);
    const statutoryTypes = PLAN_TYPES.filter((pt) => pt.statutory).map((pt) => pt.type);
    expect(result.missing_plans).toEqual(statutoryTypes);
  });

  it("filters plans and reviews to the specified child only", () => {
    const plans = [
      makePlan({ child_id: "child-1", status: "active", plan_type: "placement_plan" }),
      makePlan({ id: "p2", child_id: "child-2", status: "active", plan_type: "care_plan" }),
    ];
    const reviews = [
      makeReview({ child_id: "child-1" }),
      makeReview({ id: "r2", child_id: "child-2" }),
    ];
    const result = computeChildPlanProfile("child-1", plans, reviews);
    expect(result.active_plans).toHaveLength(1);
    expect(result.lac_reviews_count).toBe(1);
  });

  it("summarises active plans with sections_complete and sections_total", () => {
    const plans = [
      makePlan({
        child_id: "child-1",
        status: "active",
        plan_type: "placement_plan",
        next_review_date: "2026-08-01",
        sections: [
          { section: "a", content: "", completed: true },
          { section: "b", content: "", completed: false },
          { section: "c", content: "", completed: true },
        ],
      }),
    ];
    const result = computeChildPlanProfile("child-1", plans, []);
    expect(result.active_plans).toHaveLength(1);
    expect(result.active_plans[0].type).toBe("placement_plan");
    expect(result.active_plans[0].status).toBe("active");
    expect(result.active_plans[0].next_review).toBe("2026-08-01");
    expect(result.active_plans[0].sections_complete).toBe(2);
    expect(result.active_plans[0].sections_total).toBe(3);
  });

  it("excludes non-active plans from the active_plans summary", () => {
    const plans = [
      makePlan({ child_id: "child-1", status: "draft", plan_type: "placement_plan" }),
      makePlan({ id: "p2", child_id: "child-1", status: "superseded", plan_type: "care_plan" }),
    ];
    const result = computeChildPlanProfile("child-1", plans, []);
    expect(result.active_plans).toHaveLength(0);
  });

  it("counts objectives from all child plans (not just active)", () => {
    const plans = [
      makePlan({
        child_id: "child-1",
        status: "active",
        objectives: [
          { objective: "A", status: "achieved" },
          { objective: "B", status: "in_progress" },
        ],
      }),
      makePlan({
        id: "p2",
        child_id: "child-1",
        status: "draft",
        objectives: [
          { objective: "C", status: "achieved" },
          { objective: "D", status: "not_started" },
        ],
      }),
    ];
    const result = computeChildPlanProfile("child-1", plans, []);
    expect(result.total_objectives).toBe(4);
    expect(result.objectives_achieved).toBe(2);
    expect(result.objectives_in_progress).toBe(1);
  });

  it("returns last_lac_review as the most recent completed review date", () => {
    const reviews = [
      makeReview({ child_id: "child-1", status: "completed", review_date: "2026-01-15" }),
      makeReview({ id: "r2", child_id: "child-1", status: "completed", review_date: "2026-03-20" }),
      makeReview({ id: "r3", child_id: "child-1", status: "scheduled", review_date: "2026-07-01" }),
    ];
    const result = computeChildPlanProfile("child-1", [], reviews);
    expect(result.last_lac_review).toBe("2026-03-20");
  });

  it("returns next_lac_review from earliest scheduled review", () => {
    const reviews = [
      makeReview({ child_id: "child-1", status: "scheduled", review_date: "2026-09-01" }),
      makeReview({ id: "r2", child_id: "child-1", status: "scheduled", review_date: "2026-07-15" }),
    ];
    const result = computeChildPlanProfile("child-1", [], reviews);
    expect(result.next_lac_review).toBe("2026-07-15");
  });

  it("falls back to next_review_date from last completed review when no scheduled reviews", () => {
    const reviews = [
      makeReview({
        child_id: "child-1",
        status: "completed",
        review_date: "2026-03-01",
        next_review_date: "2026-09-01",
      }),
    ];
    const result = computeChildPlanProfile("child-1", [], reviews);
    expect(result.next_lac_review).toBe("2026-09-01");
  });

  it("returns null next_lac_review when no scheduled and no next_review_date", () => {
    const reviews = [
      makeReview({
        child_id: "child-1",
        status: "completed",
        review_date: "2026-03-01",
        next_review_date: null,
      }),
    ];
    const result = computeChildPlanProfile("child-1", [], reviews);
    expect(result.next_lac_review).toBeNull();
  });

  it("computes child_participation_rate from completed reviews only", () => {
    const reviews = [
      makeReview({ child_id: "child-1", status: "completed", child_participated: true }),
      makeReview({ id: "r2", child_id: "child-1", status: "completed", child_participated: false }),
      makeReview({ id: "r3", child_id: "child-1", status: "scheduled", child_participated: true }),
    ];
    const result = computeChildPlanProfile("child-1", [], reviews);
    // 1 participated out of 2 completed = 50%
    expect(result.child_participation_rate).toBe(50);
  });

  it("returns participation_rate 0 when there are no completed reviews", () => {
    const reviews = [
      makeReview({ child_id: "child-1", status: "scheduled", child_participated: true }),
    ];
    const result = computeChildPlanProfile("child-1", [], reviews);
    expect(result.child_participation_rate).toBe(0);
  });

  it("identifies missing statutory plans correctly", () => {
    const plans = [
      makePlan({ child_id: "child-1", status: "active", plan_type: "placement_plan" }),
      makePlan({ id: "p2", child_id: "child-1", status: "active", plan_type: "care_plan" }),
    ];
    const result = computeChildPlanProfile("child-1", plans, []);
    // placement_plan and care_plan are covered; pathway_plan is still missing
    expect(result.missing_plans).toContain("pathway_plan");
    expect(result.missing_plans).not.toContain("placement_plan");
    expect(result.missing_plans).not.toContain("care_plan");
  });
});

// ── computeLACReviewCompliance ──────────────────────────────────────────

describe("computeLACReviewCompliance", () => {
  it("returns zeroed metrics for an empty array", () => {
    const result = computeLACReviewCompliance([]);
    expect(result.total_reviews).toBe(0);
    expect(result.completed).toBe(0);
    expect(result.scheduled).toBe(0);
    expect(result.cancelled).toBe(0);
    expect(result.child_participation_rate).toBe(0);
    expect(result.child_views_rate).toBe(0);
    expect(result.minutes_recorded_rate).toBe(0);
    expect(result.overdue_actions).toBe(0);
    expect(result.total_actions).toBe(0);
    expect(result.action_completion_rate).toBe(0);
  });

  it("counts reviews by status correctly", () => {
    const reviews = [
      makeReview({ id: "r1", status: "completed" }),
      makeReview({ id: "r2", status: "completed" }),
      makeReview({ id: "r3", status: "scheduled" }),
      makeReview({ id: "r4", status: "cancelled" }),
    ];
    const result = computeLACReviewCompliance(reviews);
    expect(result.total_reviews).toBe(4);
    expect(result.completed).toBe(2);
    expect(result.scheduled).toBe(1);
    expect(result.cancelled).toBe(1);
  });

  it("computes child_participation_rate from completed reviews only", () => {
    const reviews = [
      makeReview({ id: "r1", status: "completed", child_participated: true }),
      makeReview({ id: "r2", status: "completed", child_participated: false }),
      makeReview({ id: "r3", status: "completed", child_participated: true }),
      makeReview({ id: "r4", status: "scheduled", child_participated: true }),
    ];
    const result = computeLACReviewCompliance(reviews);
    // 2 out of 3 completed reviews had participation
    expect(result.child_participation_rate).toBe(66.7);
  });

  it("computes child_views_rate from completed reviews only", () => {
    const reviews = [
      makeReview({ id: "r1", status: "completed", child_views_recorded: true }),
      makeReview({ id: "r2", status: "completed", child_views_recorded: false }),
    ];
    const result = computeLACReviewCompliance(reviews);
    expect(result.child_views_rate).toBe(50);
  });

  it("computes minutes_recorded_rate from completed reviews only", () => {
    const reviews = [
      makeReview({ id: "r1", status: "completed", minutes_recorded: true }),
      makeReview({ id: "r2", status: "completed", minutes_recorded: true }),
      makeReview({ id: "r3", status: "completed", minutes_recorded: false }),
    ];
    const result = computeLACReviewCompliance(reviews);
    expect(result.minutes_recorded_rate).toBe(66.7);
  });

  it("returns rate 0 for participation, views, and minutes when no completed reviews", () => {
    const reviews = [
      makeReview({ id: "r1", status: "scheduled", child_participated: true, child_views_recorded: true, minutes_recorded: true }),
    ];
    const result = computeLACReviewCompliance(reviews);
    expect(result.child_participation_rate).toBe(0);
    expect(result.child_views_rate).toBe(0);
    expect(result.minutes_recorded_rate).toBe(0);
  });

  it("counts overdue actions across all reviews", () => {
    const reviews = [
      makeReview({
        id: "r1",
        actions: [
          { action: "Update plan", responsible: "SW", due_date: "2020-01-01", completed: false },
          { action: "Contact school", responsible: "SW", due_date: "2020-02-01", completed: true },
          { action: "Future task", responsible: "SW", due_date: "2099-01-01", completed: false },
        ],
      }),
    ];
    const result = computeLACReviewCompliance(reviews);
    expect(result.total_actions).toBe(3);
    expect(result.overdue_actions).toBe(1);
  });

  it("computes action_completion_rate correctly", () => {
    const reviews = [
      makeReview({
        id: "r1",
        actions: [
          { action: "A", responsible: "SW", due_date: "2026-01-01", completed: true },
          { action: "B", responsible: "SW", due_date: "2026-01-01", completed: true },
          { action: "C", responsible: "SW", due_date: "2026-01-01", completed: false },
          { action: "D", responsible: "SW", due_date: "2026-01-01", completed: false },
        ],
      }),
    ];
    const result = computeLACReviewCompliance(reviews);
    // 2 of 4 completed = 50%
    expect(result.action_completion_rate).toBe(50);
  });

  it("returns action_completion_rate 0 when there are no actions", () => {
    const reviews = [makeReview({ actions: [] })];
    const result = computeLACReviewCompliance(reviews);
    expect(result.action_completion_rate).toBe(0);
    expect(result.total_actions).toBe(0);
  });

  it("returns 100% rates when all completed reviews have full participation, views, and minutes", () => {
    const reviews = [
      makeReview({ id: "r1", status: "completed", child_participated: true, child_views_recorded: true, minutes_recorded: true }),
      makeReview({ id: "r2", status: "completed", child_participated: true, child_views_recorded: true, minutes_recorded: true }),
    ];
    const result = computeLACReviewCompliance(reviews);
    expect(result.child_participation_rate).toBe(100);
    expect(result.child_views_rate).toBe(100);
    expect(result.minutes_recorded_rate).toBe(100);
  });
});

// ── identifyPlanAlerts ──────────────────────────────────────────────────

describe("identifyPlanAlerts", () => {
  it("returns empty alerts when no plans and no reviews", () => {
    const alerts = identifyPlanAlerts([], []);
    expect(alerts).toEqual([]);
  });

  it("generates missing_placement_plan alert (critical) when child has no active placement plan", () => {
    const plans = [makePlan({ child_id: "child-1", status: "active", plan_type: "care_plan" })];
    const alerts = identifyPlanAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "missing_placement_plan" && a.child_id === "child-1");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("critical");
  });

  it("does not generate missing_placement_plan alert when active placement plan exists", () => {
    const plans = [makePlan({ child_id: "child-1", status: "active", plan_type: "placement_plan" })];
    const alerts = identifyPlanAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "missing_placement_plan" && a.child_id === "child-1");
    expect(alert).toBeUndefined();
  });

  it("generates missing_care_plan alert (high) when child has no active care plan", () => {
    const plans = [makePlan({ child_id: "child-1", status: "active", plan_type: "placement_plan" })];
    const alerts = identifyPlanAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "missing_care_plan" && a.child_id === "child-1");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
  });

  it("does not generate missing_care_plan alert when active care plan exists", () => {
    const plans = [
      makePlan({ child_id: "child-1", status: "active", plan_type: "placement_plan" }),
      makePlan({ id: "p2", child_id: "child-1", status: "active", plan_type: "care_plan" }),
    ];
    const alerts = identifyPlanAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "missing_care_plan" && a.child_id === "child-1");
    expect(alert).toBeUndefined();
  });

  it("generates review_overdue alert (high) for active plans with overdue next_review_date", () => {
    const plans = [
      makePlan({ child_id: "child-1", status: "active", plan_type: "placement_plan", next_review_date: "2020-01-01" }),
    ];
    const alerts = identifyPlanAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "review_overdue" && a.child_id === "child-1");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
    expect(alert!.message).toContain("placement_plan");
    expect(alert!.message).toContain("2020-01-01");
  });

  it("does not generate review_overdue for future next_review_date", () => {
    const plans = [
      makePlan({ child_id: "child-1", status: "active", plan_type: "placement_plan", next_review_date: "2099-01-01" }),
    ];
    const alerts = identifyPlanAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "review_overdue" && a.child_id === "child-1");
    expect(alert).toBeUndefined();
  });

  it("generates plan_in_draft alert (medium) for drafts older than 14 days", () => {
    const plans = [
      makePlan({
        child_id: "child-1",
        status: "draft",
        plan_type: "placement_plan",
        created_at: "2020-01-01T00:00:00Z",
      }),
    ];
    const alerts = identifyPlanAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "plan_in_draft" && a.child_id === "child-1");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
  });

  it("does not generate plan_in_draft alert for recently created drafts", () => {
    const plans = [
      makePlan({
        child_id: "child-1",
        status: "draft",
        plan_type: "placement_plan",
        created_at: new Date().toISOString(),
      }),
    ];
    const alerts = identifyPlanAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "plan_in_draft" && a.child_id === "child-1");
    expect(alert).toBeUndefined();
  });

  it("generates lac_review_overdue alert (high) when child has never had a LAC review", () => {
    const plans = [makePlan({ child_id: "child-1", status: "active", plan_type: "placement_plan" })];
    const alerts = identifyPlanAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "lac_review_overdue" && a.child_id === "child-1");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
    expect(alert!.message).toContain("never had a LAC review");
  });

  it("generates lac_review_overdue alert when last review was more than 26 weeks ago", () => {
    const plans = [makePlan({ child_id: "child-1", status: "active", plan_type: "placement_plan" })];
    const reviews = [
      makeReview({ child_id: "child-1", status: "completed", review_date: "2020-01-01" }),
    ];
    const alerts = identifyPlanAlerts(plans, reviews);
    const alert = alerts.find((a) => a.type === "lac_review_overdue" && a.child_id === "child-1");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("2020-01-01");
  });

  it("does not generate lac_review_overdue when last review is recent", () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 7);
    const plans = [makePlan({ child_id: "child-1", status: "active", plan_type: "placement_plan" })];
    const reviews = [
      makeReview({ child_id: "child-1", status: "completed", review_date: recentDate.toISOString().split("T")[0] }),
    ];
    const alerts = identifyPlanAlerts(plans, reviews);
    const alert = alerts.find((a) => a.type === "lac_review_overdue" && a.child_id === "child-1");
    expect(alert).toBeUndefined();
  });

  it("generates action_overdue alert (medium) for incomplete actions past due", () => {
    const reviews = [
      makeReview({
        child_id: "child-1",
        actions: [
          { action: "Update contact plan", responsible: "SW", due_date: "2020-01-01", completed: false },
        ],
      }),
    ];
    const alerts = identifyPlanAlerts([], reviews);
    const alert = alerts.find((a) => a.type === "action_overdue" && a.child_id === "child-1");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
    expect(alert!.message).toContain("Update contact plan");
  });

  it("does not generate action_overdue for completed actions", () => {
    const reviews = [
      makeReview({
        child_id: "child-1",
        actions: [
          { action: "Done task", responsible: "SW", due_date: "2020-01-01", completed: true },
        ],
      }),
    ];
    const alerts = identifyPlanAlerts([], reviews);
    const alert = alerts.find((a) => a.type === "action_overdue" && a.child_id === "child-1");
    expect(alert).toBeUndefined();
  });

  it("generates low_completion alert (medium) for active plans with less than 50% sections", () => {
    const plans = [
      makePlan({
        child_id: "child-1",
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
    const alert = alerts.find((a) => a.type === "low_completion" && a.child_id === "child-1");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
    expect(alert!.message).toContain("25%");
  });

  it("does not generate low_completion alert when sections are 50% or more complete", () => {
    const plans = [
      makePlan({
        child_id: "child-1",
        status: "active",
        plan_type: "placement_plan",
        sections: [
          { section: "a", content: "", completed: true },
          { section: "b", content: "", completed: false },
        ],
      }),
    ];
    const alerts = identifyPlanAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "low_completion" && a.child_id === "child-1");
    expect(alert).toBeUndefined();
  });

  it("does not generate low_completion alert for plans with empty sections", () => {
    const plans = [
      makePlan({ child_id: "child-1", status: "active", plan_type: "placement_plan", sections: [] }),
    ];
    const alerts = identifyPlanAlerts(plans, []);
    const alert = alerts.find((a) => a.type === "low_completion" && a.child_id === "child-1");
    expect(alert).toBeUndefined();
  });

  it("generates alerts for multiple children independently", () => {
    const plans = [
      makePlan({ child_id: "child-1", status: "active", plan_type: "care_plan" }),
      makePlan({ id: "p2", child_id: "child-2", status: "active", plan_type: "placement_plan" }),
    ];
    const alerts = identifyPlanAlerts(plans, []);
    // child-1: missing placement_plan (critical), missing care_plan for child-2 (high)
    const c1Missing = alerts.find((a) => a.type === "missing_placement_plan" && a.child_id === "child-1");
    const c2Missing = alerts.find((a) => a.type === "missing_care_plan" && a.child_id === "child-2");
    expect(c1Missing).toBeDefined();
    expect(c2Missing).toBeDefined();
  });

  it("collects child IDs from both plans and reviews", () => {
    const plans: ReturnType<typeof makePlan>[] = [];
    const reviews = [
      makeReview({ child_id: "review-only-child", status: "completed", review_date: "2026-05-01" }),
    ];
    const alerts = identifyPlanAlerts(plans, reviews);
    // review-only-child should get missing_placement_plan and missing_care_plan alerts
    const childAlerts = alerts.filter((a) => a.child_id === "review-only-child");
    expect(childAlerts.length).toBeGreaterThanOrEqual(2);
    expect(childAlerts.some((a) => a.type === "missing_placement_plan")).toBe(true);
    expect(childAlerts.some((a) => a.type === "missing_care_plan")).toBe(true);
  });
});

// ── Constants ───────────────────────────────────────────────────────────

describe("PLAN_TYPES", () => {
  it("has exactly 8 entries", () => {
    expect(PLAN_TYPES).toHaveLength(8);
  });

  it("each entry has type, label, statutory, and review_weeks", () => {
    for (const entry of PLAN_TYPES) {
      expect(typeof entry.type).toBe("string");
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.statutory).toBe("boolean");
      expect(typeof entry.review_weeks).toBe("number");
    }
  });

  it("includes exactly 3 statutory plan types", () => {
    const statutory = PLAN_TYPES.filter((pt) => pt.statutory);
    expect(statutory).toHaveLength(3);
  });

  it("contains placement_plan as statutory", () => {
    const pp = PLAN_TYPES.find((pt) => pt.type === "placement_plan");
    expect(pp).toBeDefined();
    expect(pp!.statutory).toBe(true);
    expect(pp!.review_weeks).toBe(6);
  });

  it("contains care_plan as statutory with 26-week review cycle", () => {
    const cp = PLAN_TYPES.find((pt) => pt.type === "care_plan");
    expect(cp).toBeDefined();
    expect(cp!.statutory).toBe(true);
    expect(cp!.review_weeks).toBe(26);
  });

  it("contains pathway_plan as statutory", () => {
    const pp = PLAN_TYPES.find((pt) => pt.type === "pathway_plan");
    expect(pp).toBeDefined();
    expect(pp!.statutory).toBe(true);
  });
});

describe("PLAN_SECTIONS", () => {
  it("has exactly 13 entries", () => {
    expect(PLAN_SECTIONS).toHaveLength(13);
  });

  it("includes key sections", () => {
    expect(PLAN_SECTIONS).toContain("personal_details");
    expect(PLAN_SECTIONS).toContain("education");
    expect(PLAN_SECTIONS).toContain("health");
    expect(PLAN_SECTIONS).toContain("safeguarding");
    expect(PLAN_SECTIONS).toContain("wishes_feelings");
  });
});

describe("LAC_REVIEW_TYPES", () => {
  it("has exactly 3 entries", () => {
    expect(LAC_REVIEW_TYPES).toHaveLength(3);
  });

  it("contains initial, first_review, and subsequent", () => {
    expect(LAC_REVIEW_TYPES).toContain("initial");
    expect(LAC_REVIEW_TYPES).toContain("first_review");
    expect(LAC_REVIEW_TYPES).toContain("subsequent");
  });
});

describe("PLAN_STATUSES", () => {
  it("has exactly 5 entries", () => {
    expect(PLAN_STATUSES).toHaveLength(5);
  });

  it("contains all expected statuses", () => {
    expect(PLAN_STATUSES).toContain("draft");
    expect(PLAN_STATUSES).toContain("active");
    expect(PLAN_STATUSES).toContain("under_review");
    expect(PLAN_STATUSES).toContain("superseded");
    expect(PLAN_STATUSES).toContain("archived");
  });
});
