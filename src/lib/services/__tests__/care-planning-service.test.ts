// ══════════════════════════════════════════════════════════════════════════════
// CARA — CARE PLANNING SERVICE TESTS
// Pure-function unit tests for care plan metrics, alerts, constants, and
// CRUD fallback behaviour when Supabase is not configured.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  computeCarePlanMetrics,
  identifyCarePlanAlerts,
  PLAN_TYPES,
  PLAN_STATUSES,
  OBJECTIVE_STATUSES,
  REVIEW_TYPES,
  REVIEW_OUTCOMES,
  listPlans,
  createPlan,
  updatePlan,
  listObjectives,
  createObjective,
  updateObjective,
  listReviews,
  createReview,
} from "../care-planning-service";
import type { CarePlan, PlanObjective, PlanReview } from "../care-planning-service";

// ── Helpers ────────────────────────────────────────────────────────────────

function makePlan(overrides: Partial<CarePlan> = {}): CarePlan {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Test Child",
    plan_type: "care_plan",
    status: "current",
    start_date: "2026-01-01",
    next_review_date: "2026-07-01",
    last_reviewed_date: null,
    social_worker: "SW Smith",
    key_worker: "KW Jones",
    objectives_count: 3,
    objectives_completed: 1,
    objectives_at_risk: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeObjective(overrides: Partial<PlanObjective> = {}): PlanObjective {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    plan_id: "plan-1",
    child_id: "child-1",
    child_name: "Test Child",
    objective: "Improve school attendance",
    target_date: "2026-06-01",
    status: "in_progress",
    responsible_person: "KW Jones",
    progress_notes: [],
    evidence: [],
    date_completed: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeReview(overrides: Partial<PlanReview> = {}): PlanReview {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    plan_id: "plan-1",
    child_id: "child-1",
    child_name: "Test Child",
    review_type: "lac_review",
    review_date: "2026-04-01",
    chaired_by: "IRO Williams",
    attendees: ["SW Smith", "KW Jones"],
    child_participated: true,
    child_views_recorded: true,
    outcome: "plan_unchanged",
    actions: ["Continue current plan"],
    next_review_date: "2026-10-01",
    created_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

const NOW = new Date("2026-05-13T12:00:00Z");

// ══════════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  describe("PLAN_TYPES", () => {
    it("contains exactly 11 items", () => {
      expect(PLAN_TYPES).toHaveLength(11);
    });

    it("has unique type values", () => {
      const types = PLAN_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it.each([
      "care_plan",
      "placement_plan",
      "pathway_plan",
      "personal_education_plan",
      "health_care_plan",
      "behaviour_support_plan",
      "risk_management_plan",
      "missing_protocol",
      "safe_care_plan",
      "therapeutic_plan",
      "other",
    ] as const)("includes type '%s'", (type) => {
      expect(PLAN_TYPES.find((t) => t.type === type)).toBeDefined();
    });

    it("has non-empty labels for every type", () => {
      for (const entry of PLAN_TYPES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("PLAN_STATUSES", () => {
    it("contains exactly 6 items", () => {
      expect(PLAN_STATUSES).toHaveLength(6);
    });

    it("has unique status values", () => {
      const statuses = PLAN_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it.each([
      "current",
      "under_review",
      "overdue_review",
      "draft",
      "superseded",
      "archived",
    ] as const)("includes status '%s'", (status) => {
      expect(PLAN_STATUSES.find((s) => s.status === status)).toBeDefined();
    });

    it("has non-empty labels for every status", () => {
      for (const entry of PLAN_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("OBJECTIVE_STATUSES", () => {
    it("contains exactly 6 items", () => {
      expect(OBJECTIVE_STATUSES).toHaveLength(6);
    });

    it("has unique status values", () => {
      const statuses = OBJECTIVE_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it.each([
      "not_started",
      "in_progress",
      "on_track",
      "at_risk",
      "completed",
      "not_achieved",
    ] as const)("includes status '%s'", (status) => {
      expect(OBJECTIVE_STATUSES.find((s) => s.status === status)).toBeDefined();
    });

    it("has non-empty labels for every status", () => {
      for (const entry of OBJECTIVE_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("REVIEW_TYPES", () => {
    it("contains exactly 6 items", () => {
      expect(REVIEW_TYPES).toHaveLength(6);
    });

    it("has unique type values", () => {
      const types = REVIEW_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it.each([
      "lac_review",
      "placement_plan_review",
      "pep_review",
      "health_review",
      "internal_review",
      "other",
    ] as const)("includes type '%s'", (type) => {
      expect(REVIEW_TYPES.find((t) => t.type === type)).toBeDefined();
    });

    it("has non-empty labels for every type", () => {
      for (const entry of REVIEW_TYPES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("REVIEW_OUTCOMES", () => {
    it("contains exactly 6 items", () => {
      expect(REVIEW_OUTCOMES).toHaveLength(6);
    });

    it("has unique outcome values", () => {
      const outcomes = REVIEW_OUTCOMES.map((o) => o.outcome);
      expect(new Set(outcomes).size).toBe(outcomes.length);
    });

    it.each([
      "plan_unchanged",
      "plan_amended",
      "plan_rewritten",
      "placement_confirmed",
      "placement_change",
      "escalation_required",
    ] as const)("includes outcome '%s'", (outcome) => {
      expect(REVIEW_OUTCOMES.find((o) => o.outcome === outcome)).toBeDefined();
    });

    it("has non-empty labels for every outcome", () => {
      for (const entry of REVIEW_OUTCOMES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeCarePlanMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeCarePlanMetrics", () => {
  // ── Empty inputs ─────────────────────────────────────────────────────────

  describe("empty inputs", () => {
    it("returns zeroes for all numeric fields when inputs are empty", () => {
      const m = computeCarePlanMetrics([], [], [], 0, NOW);
      expect(m.total_plans).toBe(0);
      expect(m.current_plans).toBe(0);
      expect(m.overdue_reviews).toBe(0);
      expect(m.reviews_due_soon).toBe(0);
      expect(m.children_with_plans).toBe(0);
      expect(m.plan_coverage_rate).toBeNull(); // fab-0.;
      expect(m.total_objectives).toBe(0);
      expect(m.objectives_completed).toBe(0);
      expect(m.objectives_at_risk).toBe(0);
      expect(m.objective_completion_rate).toBeNull(); // fab-0.;
      expect(m.reviews_this_quarter).toBe(0);
      expect(m.child_participation_rate).toBeNull(); // fab-0.;
    });

    it("returns empty objects for breakdown fields when inputs are empty", () => {
      const m = computeCarePlanMetrics([], [], [], 0, NOW);
      expect(m.by_plan_type).toEqual({});
      expect(m.by_plan_status).toEqual({});
      expect(m.by_review_outcome).toEqual({});
    });

    it("returns 0 coverage rate when totalChildren is 0 (avoid division by zero)", () => {
      const m = computeCarePlanMetrics([], [], [], 0, NOW);
      expect(m.plan_coverage_rate).toBeNull(); // fab-0.;
    });
  });

  // ── total_plans ──────────────────────────────────────────────────────────

  describe("total_plans", () => {
    it("counts all plans regardless of status", () => {
      const plans = [
        makePlan({ status: "current" }),
        makePlan({ status: "superseded" }),
        makePlan({ status: "archived" }),
        makePlan({ status: "draft" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.total_plans).toBe(4);
    });

    it("returns 1 for a single plan", () => {
      const m = computeCarePlanMetrics([makePlan()], [], [], 1, NOW);
      expect(m.total_plans).toBe(1);
    });
  });

  // ── current_plans ────────────────────────────────────────────────────────

  describe("current_plans", () => {
    it("counts only plans with status 'current'", () => {
      const plans = [
        makePlan({ status: "current" }),
        makePlan({ status: "current" }),
        makePlan({ status: "under_review" }),
        makePlan({ status: "draft" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.current_plans).toBe(2);
    });

    it("returns 0 when no plans are current", () => {
      const plans = [makePlan({ status: "draft" }), makePlan({ status: "archived" })];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.current_plans).toBe(0);
    });
  });

  // ── overdue_reviews ──────────────────────────────────────────────────────

  describe("overdue_reviews", () => {
    it("counts active plans where next_review_date is in the past", () => {
      const plans = [
        makePlan({ status: "current", next_review_date: "2026-05-01" }), // overdue
        makePlan({ status: "under_review", next_review_date: "2026-04-01" }), // overdue
        makePlan({ status: "current", next_review_date: "2026-06-01" }), // not overdue
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.overdue_reviews).toBe(2);
    });

    it("excludes superseded plans from overdue count", () => {
      const plans = [
        makePlan({ status: "superseded", next_review_date: "2026-01-01" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.overdue_reviews).toBe(0);
    });

    it("excludes archived plans from overdue count", () => {
      const plans = [
        makePlan({ status: "archived", next_review_date: "2026-01-01" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.overdue_reviews).toBe(0);
    });

    it("does not count plans where review is due exactly now", () => {
      // next_review_date is the same timestamp — new Date(nrd) < now is false
      const plans = [
        makePlan({ status: "current", next_review_date: "2026-05-13T12:00:00Z" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      // Exact same instant means "not overdue" (< now, not <=)
      expect(m.overdue_reviews).toBe(0);
    });

    it("treats draft and overdue_review status plans as active for overdue checks", () => {
      const plans = [
        makePlan({ status: "draft", next_review_date: "2026-03-01" }),
        makePlan({ status: "overdue_review", next_review_date: "2026-03-01" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.overdue_reviews).toBe(2);
    });
  });

  // ── reviews_due_soon ─────────────────────────────────────────────────────

  describe("reviews_due_soon", () => {
    it("counts active plans with next_review_date between now and now+14 days", () => {
      const plans = [
        makePlan({ status: "current", next_review_date: "2026-05-20" }), // within 14 days
        makePlan({ status: "current", next_review_date: "2026-05-27" }), // exactly 14 days
        makePlan({ status: "current", next_review_date: "2026-05-28" }), // beyond 14 days
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.reviews_due_soon).toBe(2);
    });

    it("includes reviews due today (>= now)", () => {
      const plans = [
        makePlan({ status: "current", next_review_date: "2026-05-13T12:00:00Z" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.reviews_due_soon).toBe(1);
    });

    it("excludes overdue reviews from due-soon count", () => {
      const plans = [
        makePlan({ status: "current", next_review_date: "2026-05-01" }), // overdue
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.reviews_due_soon).toBe(0);
    });

    it("excludes superseded plans from due-soon count", () => {
      const plans = [
        makePlan({ status: "superseded", next_review_date: "2026-05-20" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.reviews_due_soon).toBe(0);
    });
  });

  // ── children_with_plans ──────────────────────────────────────────────────

  describe("children_with_plans", () => {
    it("counts unique child IDs from active plans", () => {
      const plans = [
        makePlan({ child_id: "child-1", status: "current" }),
        makePlan({ child_id: "child-1", status: "under_review" }), // same child
        makePlan({ child_id: "child-2", status: "current" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.children_with_plans).toBe(2);
    });

    it("excludes superseded/archived plans from coverage", () => {
      const plans = [
        makePlan({ child_id: "child-1", status: "superseded" }),
        makePlan({ child_id: "child-2", status: "archived" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.children_with_plans).toBe(0);
    });

    it("returns 0 for empty plans", () => {
      const m = computeCarePlanMetrics([], [], [], 5, NOW);
      expect(m.children_with_plans).toBe(0);
    });
  });

  // ── plan_coverage_rate ───────────────────────────────────────────────────

  describe("plan_coverage_rate", () => {
    it("calculates percentage of children with active plans to 1 decimal", () => {
      const plans = [
        makePlan({ child_id: "child-1", status: "current" }),
        makePlan({ child_id: "child-2", status: "current" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 3, NOW);
      // 2/3 * 100 = 66.666... => 66.7
      expect(m.plan_coverage_rate).toBe(66.7);
    });

    it("returns 100 when all children have plans", () => {
      const plans = [
        makePlan({ child_id: "child-1", status: "current" }),
        makePlan({ child_id: "child-2", status: "current" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 2, NOW);
      expect(m.plan_coverage_rate).toBe(100);
    });

    it("returns 0 when totalChildren is 0", () => {
      const m = computeCarePlanMetrics([makePlan()], [], [], 0, NOW);
      expect(m.plan_coverage_rate).toBeNull(); // fab-0.;
    });

    it("rounds correctly (1/7 = 14.3)", () => {
      const plans = [makePlan({ child_id: "child-1", status: "current" })];
      const m = computeCarePlanMetrics(plans, [], [], 7, NOW);
      // 1/7 * 100 = 14.2857... => 14.3
      expect(m.plan_coverage_rate).toBe(14.3);
    });
  });

  // ── total_objectives ─────────────────────────────────────────────────────

  describe("total_objectives", () => {
    it("counts all objectives regardless of status", () => {
      const objs = [
        makeObjective({ status: "in_progress" }),
        makeObjective({ status: "completed" }),
        makeObjective({ status: "at_risk" }),
      ];
      const m = computeCarePlanMetrics([], objs, [], 5, NOW);
      expect(m.total_objectives).toBe(3);
    });

    it("returns 0 for no objectives", () => {
      const m = computeCarePlanMetrics([], [], [], 5, NOW);
      expect(m.total_objectives).toBe(0);
    });
  });

  // ── objectives_completed ─────────────────────────────────────────────────

  describe("objectives_completed", () => {
    it("counts only objectives with status 'completed'", () => {
      const objs = [
        makeObjective({ status: "completed" }),
        makeObjective({ status: "completed" }),
        makeObjective({ status: "in_progress" }),
        makeObjective({ status: "not_achieved" }),
      ];
      const m = computeCarePlanMetrics([], objs, [], 5, NOW);
      expect(m.objectives_completed).toBe(2);
    });

    it("returns 0 when none are completed", () => {
      const objs = [makeObjective({ status: "at_risk" })];
      const m = computeCarePlanMetrics([], objs, [], 5, NOW);
      expect(m.objectives_completed).toBe(0);
    });
  });

  // ── objectives_at_risk ───────────────────────────────────────────────────

  describe("objectives_at_risk", () => {
    it("counts only objectives with status 'at_risk'", () => {
      const objs = [
        makeObjective({ status: "at_risk" }),
        makeObjective({ status: "at_risk" }),
        makeObjective({ status: "in_progress" }),
      ];
      const m = computeCarePlanMetrics([], objs, [], 5, NOW);
      expect(m.objectives_at_risk).toBe(2);
    });

    it("returns 0 when none are at risk", () => {
      const objs = [makeObjective({ status: "completed" })];
      const m = computeCarePlanMetrics([], objs, [], 5, NOW);
      expect(m.objectives_at_risk).toBe(0);
    });
  });

  // ── objective_completion_rate ─────────────────────────────────────────────

  describe("objective_completion_rate", () => {
    it("calculates completed/total * 100 to 1 decimal", () => {
      const objs = [
        makeObjective({ status: "completed" }),
        makeObjective({ status: "in_progress" }),
        makeObjective({ status: "at_risk" }),
      ];
      const m = computeCarePlanMetrics([], objs, [], 5, NOW);
      // 1/3 * 100 = 33.333... => 33.3
      expect(m.objective_completion_rate).toBe(33.3);
    });

    it("returns 0 when there are no objectives", () => {
      const m = computeCarePlanMetrics([], [], [], 5, NOW);
      expect(m.objective_completion_rate).toBeNull(); // fab-0.;
    });

    it("returns 100 when all objectives are completed", () => {
      const objs = [
        makeObjective({ status: "completed" }),
        makeObjective({ status: "completed" }),
      ];
      const m = computeCarePlanMetrics([], objs, [], 5, NOW);
      expect(m.objective_completion_rate).toBe(100);
    });

    it("rounds correctly (2/7 = 28.6)", () => {
      const objs = Array.from({ length: 7 }, (_, i) =>
        makeObjective({ status: i < 2 ? "completed" : "in_progress" }),
      );
      const m = computeCarePlanMetrics([], objs, [], 5, NOW);
      expect(m.objective_completion_rate).toBe(28.6);
    });
  });

  // ── reviews_this_quarter ─────────────────────────────────────────────────

  describe("reviews_this_quarter", () => {
    it("counts reviews within the last 90 days", () => {
      const reviews = [
        makeReview({ review_date: "2026-05-01" }), // within 90 days
        makeReview({ review_date: "2026-03-15" }), // within 90 days
        makeReview({ review_date: "2026-01-01" }), // outside 90 days
      ];
      const m = computeCarePlanMetrics([], [], reviews, 5, NOW);
      expect(m.reviews_this_quarter).toBe(2);
    });

    it("includes review on exactly 90 days ago boundary", () => {
      // 90 days before 2026-05-13T12:00:00Z is 2026-02-12T12:00:00Z
      // But Date.setDate subtracts calendar days, so test just inside the boundary
      const ninetyDaysAgo = new Date(NOW);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const reviews = [makeReview({ review_date: ninetyDaysAgo.toISOString() })];
      const m = computeCarePlanMetrics([], [], reviews, 5, NOW);
      expect(m.reviews_this_quarter).toBe(1);
    });

    it("excludes reviews in the future", () => {
      const reviews = [makeReview({ review_date: "2026-06-01" })];
      const m = computeCarePlanMetrics([], [], reviews, 5, NOW);
      expect(m.reviews_this_quarter).toBe(0);
    });

    it("includes review on today's date", () => {
      const reviews = [makeReview({ review_date: "2026-05-13T12:00:00Z" })];
      const m = computeCarePlanMetrics([], [], reviews, 5, NOW);
      expect(m.reviews_this_quarter).toBe(1);
    });
  });

  // ── child_participation_rate ─────────────────────────────────────────────

  describe("child_participation_rate", () => {
    it("calculates child_participated / total reviews * 100 to 1 decimal", () => {
      const reviews = [
        makeReview({ child_participated: true }),
        makeReview({ child_participated: true }),
        makeReview({ child_participated: false }),
      ];
      const m = computeCarePlanMetrics([], [], reviews, 5, NOW);
      // 2/3 * 100 = 66.666... => 66.7
      expect(m.child_participation_rate).toBe(66.7);
    });

    it("returns 0 when there are no reviews", () => {
      const m = computeCarePlanMetrics([], [], [], 5, NOW);
      expect(m.child_participation_rate).toBeNull(); // fab-0.;
    });

    it("returns 100 when all children participated", () => {
      const reviews = [
        makeReview({ child_participated: true }),
        makeReview({ child_participated: true }),
      ];
      const m = computeCarePlanMetrics([], [], reviews, 5, NOW);
      expect(m.child_participation_rate).toBe(100);
    });

    it("returns 0 when no children participated", () => {
      const reviews = [
        makeReview({ child_participated: false }),
        makeReview({ child_participated: false }),
      ];
      const m = computeCarePlanMetrics([], [], reviews, 5, NOW);
      expect(m.child_participation_rate).toBe(0);
    });
  });

  // ── by_plan_type ─────────────────────────────────────────────────────────

  describe("by_plan_type", () => {
    it("groups active plans by plan_type", () => {
      const plans = [
        makePlan({ plan_type: "care_plan", status: "current" }),
        makePlan({ plan_type: "care_plan", status: "under_review" }),
        makePlan({ plan_type: "placement_plan", status: "current" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.by_plan_type).toEqual({ care_plan: 2, placement_plan: 1 });
    });

    it("excludes superseded and archived plans from type breakdown", () => {
      const plans = [
        makePlan({ plan_type: "care_plan", status: "superseded" }),
        makePlan({ plan_type: "care_plan", status: "archived" }),
        makePlan({ plan_type: "care_plan", status: "current" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.by_plan_type).toEqual({ care_plan: 1 });
    });

    it("returns empty object when all plans are inactive", () => {
      const plans = [makePlan({ status: "superseded" })];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.by_plan_type).toEqual({});
    });
  });

  // ── by_plan_status ───────────────────────────────────────────────────────

  describe("by_plan_status", () => {
    it("groups all plans by status", () => {
      const plans = [
        makePlan({ status: "current" }),
        makePlan({ status: "current" }),
        makePlan({ status: "superseded" }),
        makePlan({ status: "draft" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.by_plan_status).toEqual({ current: 2, superseded: 1, draft: 1 });
    });

    it("includes superseded and archived in status breakdown", () => {
      const plans = [
        makePlan({ status: "superseded" }),
        makePlan({ status: "archived" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.by_plan_status).toEqual({ superseded: 1, archived: 1 });
    });
  });

  // ── by_review_outcome ────────────────────────────────────────────────────

  describe("by_review_outcome", () => {
    it("groups all reviews by outcome", () => {
      const reviews = [
        makeReview({ outcome: "plan_unchanged" }),
        makeReview({ outcome: "plan_unchanged" }),
        makeReview({ outcome: "plan_amended" }),
      ];
      const m = computeCarePlanMetrics([], [], reviews, 5, NOW);
      expect(m.by_review_outcome).toEqual({ plan_unchanged: 2, plan_amended: 1 });
    });

    it("returns empty object when no reviews exist", () => {
      const m = computeCarePlanMetrics([], [], [], 5, NOW);
      expect(m.by_review_outcome).toEqual({});
    });
  });

  // ── Combined / integrated scenarios ──────────────────────────────────────

  describe("integrated scenarios", () => {
    it("handles a single plan, objective, and review correctly", () => {
      const plans = [makePlan({ child_id: "c1", status: "current", next_review_date: "2026-06-01" })];
      const objs = [makeObjective({ status: "completed" })];
      const reviews = [makeReview({ review_date: "2026-05-01", child_participated: true })];
      const m = computeCarePlanMetrics(plans, objs, reviews, 1, NOW);

      expect(m.total_plans).toBe(1);
      expect(m.current_plans).toBe(1);
      expect(m.overdue_reviews).toBe(0);
      expect(m.children_with_plans).toBe(1);
      expect(m.plan_coverage_rate).toBe(100);
      expect(m.total_objectives).toBe(1);
      expect(m.objectives_completed).toBe(1);
      expect(m.objective_completion_rate).toBe(100);
      expect(m.reviews_this_quarter).toBe(1);
      expect(m.child_participation_rate).toBe(100);
    });

    it("handles a large dataset", () => {
      const plans = Array.from({ length: 50 }, (_, i) =>
        makePlan({
          child_id: `child-${i % 10}`,
          plan_type: i % 2 === 0 ? "care_plan" : "placement_plan",
          status: i < 40 ? "current" : "superseded",
          next_review_date: i < 5 ? "2026-04-01" : "2026-07-01",
        }),
      );
      const objs = Array.from({ length: 100 }, (_, i) =>
        makeObjective({ status: i < 30 ? "completed" : i < 40 ? "at_risk" : "in_progress" }),
      );
      const reviews = Array.from({ length: 30 }, (_, i) =>
        makeReview({
          review_date: i < 20 ? "2026-05-01" : "2026-01-01",
          child_participated: i < 25,
          outcome: i < 15 ? "plan_unchanged" : "plan_amended",
        }),
      );
      const m = computeCarePlanMetrics(plans, objs, reviews, 15, NOW);

      expect(m.total_plans).toBe(50);
      expect(m.current_plans).toBe(40);
      expect(m.total_objectives).toBe(100);
      expect(m.objectives_completed).toBe(30);
      expect(m.objectives_at_risk).toBe(10);
      expect(m.objective_completion_rate).toBe(30);
      expect(m.child_participation_rate).toBe(83.3);
    });

    it("returns all 15 fields in the result object", () => {
      const m = computeCarePlanMetrics([], [], [], 0, NOW);
      const keys = Object.keys(m);
      expect(keys).toContain("total_plans");
      expect(keys).toContain("current_plans");
      expect(keys).toContain("overdue_reviews");
      expect(keys).toContain("reviews_due_soon");
      expect(keys).toContain("children_with_plans");
      expect(keys).toContain("plan_coverage_rate");
      expect(keys).toContain("total_objectives");
      expect(keys).toContain("objectives_completed");
      expect(keys).toContain("objectives_at_risk");
      expect(keys).toContain("objective_completion_rate");
      expect(keys).toContain("reviews_this_quarter");
      expect(keys).toContain("child_participation_rate");
      expect(keys).toContain("by_plan_type");
      expect(keys).toContain("by_plan_status");
      expect(keys).toContain("by_review_outcome");
      expect(keys).toHaveLength(15);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. identifyCarePlanAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyCarePlanAlerts", () => {
  // ── No alerts ────────────────────────────────────────────────────────────

  describe("no alerts", () => {
    it("returns empty array when inputs are empty and totalChildren is 0", () => {
      const alerts = identifyCarePlanAlerts([], [], [], 0, NOW);
      expect(alerts).toEqual([]);
    });

    it("returns empty array when all plans are future, no at-risk objectives, full coverage", () => {
      const plans = [
        makePlan({ child_id: "c1", status: "current", next_review_date: "2026-08-01" }),
        makePlan({ child_id: "c2", status: "current", next_review_date: "2026-08-01" }),
      ];
      const objs = [makeObjective({ status: "in_progress", target_date: "2026-08-01" })];
      const reviews = [
        makeReview({ child_participated: true }),
        makeReview({ child_participated: true }),
        makeReview({ child_participated: true }),
      ];
      const alerts = identifyCarePlanAlerts(plans, objs, reviews, 2, NOW);
      expect(alerts).toEqual([]);
    });
  });

  // ── review_overdue ───────────────────────────────────────────────────────

  describe("review_overdue alerts", () => {
    it("generates alert for active plan with past next_review_date", () => {
      const plans = [
        makePlan({ child_name: "Alice", plan_type: "care_plan", status: "current", next_review_date: "2026-05-01" }),
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 1, NOW);
      const overdue = alerts.filter((a) => a.type === "review_overdue");
      expect(overdue).toHaveLength(1);
      expect(overdue[0].message).toContain("Alice");
      expect(overdue[0].message).toContain("Care Plan");
      expect(overdue[0].id).toBe(plans[0].id);
    });

    it("assigns 'high' severity when overdue by 14 days or fewer", () => {
      const plans = [
        makePlan({ status: "current", next_review_date: "2026-05-05" }), // ~8 days overdue
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 1, NOW);
      const overdue = alerts.find((a) => a.type === "review_overdue");
      expect(overdue?.severity).toBe("high");
    });

    it("escalates to 'critical' severity when overdue by more than 14 days", () => {
      const plans = [
        makePlan({ status: "current", next_review_date: "2026-04-01" }), // ~42 days overdue
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 1, NOW);
      const overdue = alerts.find((a) => a.type === "review_overdue");
      expect(overdue?.severity).toBe("critical");
    });

    it("severity boundary: exactly 15 days overdue is critical", () => {
      // 15 days before 2026-05-13 is 2026-04-28
      const plans = [
        makePlan({ status: "current", next_review_date: "2026-04-28T12:00:00Z" }),
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 1, NOW);
      const overdue = alerts.find((a) => a.type === "review_overdue");
      expect(overdue?.severity).toBe("critical");
    });

    it("severity boundary: exactly 14 days overdue is high (not critical)", () => {
      // 14 days before 2026-05-13 12:00 is 2026-04-29 12:00
      const plans = [
        makePlan({ status: "current", next_review_date: "2026-04-29T12:00:00Z" }),
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 1, NOW);
      const overdue = alerts.find((a) => a.type === "review_overdue");
      expect(overdue?.severity).toBe("high");
    });

    it("excludes superseded plans from overdue alerts", () => {
      const plans = [
        makePlan({ status: "superseded", next_review_date: "2026-01-01" }),
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 0, NOW);
      expect(alerts.filter((a) => a.type === "review_overdue")).toHaveLength(0);
    });

    it("excludes archived plans from overdue alerts", () => {
      const plans = [
        makePlan({ status: "archived", next_review_date: "2026-01-01" }),
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 0, NOW);
      expect(alerts.filter((a) => a.type === "review_overdue")).toHaveLength(0);
    });

    it("includes message with days overdue count", () => {
      const plans = [
        makePlan({ status: "current", next_review_date: "2026-05-01" }),
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 1, NOW);
      const overdue = alerts.find((a) => a.type === "review_overdue");
      // Math.round is used in the service, so 12.5 days rounds to 13
      expect(overdue?.message).toContain("days overdue");
      expect(overdue?.message).toMatch(/\d+ days overdue/);
    });

    it("generates multiple overdue alerts for multiple plans", () => {
      const plans = [
        makePlan({ child_name: "Alice", status: "current", next_review_date: "2026-05-01" }),
        makePlan({ child_name: "Bob", status: "current", next_review_date: "2026-04-01" }),
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 2, NOW);
      const overdue = alerts.filter((a) => a.type === "review_overdue");
      expect(overdue).toHaveLength(2);
    });

    it("uses plan type label in message, not raw type value", () => {
      const plans = [
        makePlan({ plan_type: "behaviour_support_plan", status: "current", next_review_date: "2026-05-01" }),
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 1, NOW);
      const overdue = alerts.find((a) => a.type === "review_overdue");
      expect(overdue?.message).toContain("Behaviour Support Plan");
    });
  });

  // ── review_due_soon ──────────────────────────────────────────────────────

  describe("review_due_soon alerts", () => {
    it("generates alert for active plan with review due within 14 days", () => {
      const plans = [
        makePlan({ child_name: "Alice", plan_type: "care_plan", status: "current", next_review_date: "2026-05-20" }),
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 1, NOW);
      const dueSoon = alerts.filter((a) => a.type === "review_due_soon");
      expect(dueSoon).toHaveLength(1);
      expect(dueSoon[0].severity).toBe("medium");
      expect(dueSoon[0].message).toContain("Alice");
      expect(dueSoon[0].message).toContain("2026-05-20");
    });

    it("does not generate due-soon for review due today (>= now boundary)", () => {
      const plans = [
        makePlan({ status: "current", next_review_date: "2026-05-13T12:00:00Z" }),
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 1, NOW);
      const dueSoon = alerts.filter((a) => a.type === "review_due_soon");
      expect(dueSoon).toHaveLength(1);
    });

    it("does not generate due-soon for reviews beyond 14 days", () => {
      const plans = [
        makePlan({ status: "current", next_review_date: "2026-06-15" }),
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 1, NOW);
      expect(alerts.filter((a) => a.type === "review_due_soon")).toHaveLength(0);
    });

    it("does not generate due-soon for overdue reviews", () => {
      const plans = [
        makePlan({ status: "current", next_review_date: "2026-05-01" }),
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 1, NOW);
      expect(alerts.filter((a) => a.type === "review_due_soon")).toHaveLength(0);
    });

    it("excludes superseded plans from due-soon alerts", () => {
      const plans = [
        makePlan({ status: "superseded", next_review_date: "2026-05-20" }),
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 0, NOW);
      expect(alerts.filter((a) => a.type === "review_due_soon")).toHaveLength(0);
    });
  });

  // ── objective_at_risk ────────────────────────────────────────────────────

  describe("objective_at_risk alerts", () => {
    it("generates alert for each at-risk objective", () => {
      const objs = [
        makeObjective({ child_name: "Alice", objective: "Improve attendance", status: "at_risk", target_date: "2026-06-01" }),
        makeObjective({ child_name: "Bob", objective: "Build friendships", status: "at_risk", target_date: "2026-07-01" }),
      ];
      const alerts = identifyCarePlanAlerts([], objs, [], 0, NOW);
      const atRisk = alerts.filter((a) => a.type === "objective_at_risk");
      expect(atRisk).toHaveLength(2);
    });

    it("assigns 'high' severity", () => {
      const objs = [makeObjective({ status: "at_risk" })];
      const alerts = identifyCarePlanAlerts([], objs, [], 0, NOW);
      const atRisk = alerts.find((a) => a.type === "objective_at_risk");
      expect(atRisk?.severity).toBe("high");
    });

    it("includes child name and objective text in message", () => {
      const objs = [
        makeObjective({ child_name: "Alice", objective: "Improve attendance", status: "at_risk", target_date: "2026-06-01" }),
      ];
      const alerts = identifyCarePlanAlerts([], objs, [], 0, NOW);
      const atRisk = alerts.find((a) => a.type === "objective_at_risk");
      expect(atRisk?.message).toContain("Alice");
      expect(atRisk?.message).toContain("Improve attendance");
      expect(atRisk?.message).toContain("2026-06-01");
    });

    it("uses objective ID as alert ID", () => {
      const obj = makeObjective({ status: "at_risk" });
      const alerts = identifyCarePlanAlerts([], [obj], [], 0, NOW);
      expect(alerts.find((a) => a.type === "objective_at_risk")?.id).toBe(obj.id);
    });

    it("does not generate at-risk alert for completed objectives", () => {
      const objs = [makeObjective({ status: "completed" })];
      const alerts = identifyCarePlanAlerts([], objs, [], 0, NOW);
      expect(alerts.filter((a) => a.type === "objective_at_risk")).toHaveLength(0);
    });

    it("does not generate at-risk alert for in_progress objectives", () => {
      const objs = [makeObjective({ status: "in_progress" })];
      const alerts = identifyCarePlanAlerts([], objs, [], 0, NOW);
      expect(alerts.filter((a) => a.type === "objective_at_risk")).toHaveLength(0);
    });
  });

  // ── objective_overdue ────────────────────────────────────────────────────

  describe("objective_overdue alerts", () => {
    it("generates alert for not_started objective past target_date", () => {
      const objs = [
        makeObjective({ child_name: "Alice", objective: "Join a club", status: "not_started", target_date: "2026-04-01" }),
      ];
      const alerts = identifyCarePlanAlerts([], objs, [], 0, NOW);
      const overdue = alerts.filter((a) => a.type === "objective_overdue");
      expect(overdue).toHaveLength(1);
      expect(overdue[0].severity).toBe("medium");
      expect(overdue[0].message).toContain("Alice");
      expect(overdue[0].message).toContain("Join a club");
    });

    it("generates alert for in_progress objective past target_date", () => {
      const objs = [
        makeObjective({ status: "in_progress", target_date: "2026-04-01" }),
      ];
      const alerts = identifyCarePlanAlerts([], objs, [], 0, NOW);
      expect(alerts.filter((a) => a.type === "objective_overdue")).toHaveLength(1);
    });

    it("does not alert for completed objectives past target_date", () => {
      const objs = [
        makeObjective({ status: "completed", target_date: "2026-01-01" }),
      ];
      const alerts = identifyCarePlanAlerts([], objs, [], 0, NOW);
      expect(alerts.filter((a) => a.type === "objective_overdue")).toHaveLength(0);
    });

    it("does not alert for not_achieved objectives past target_date", () => {
      const objs = [
        makeObjective({ status: "not_achieved", target_date: "2026-01-01" }),
      ];
      const alerts = identifyCarePlanAlerts([], objs, [], 0, NOW);
      expect(alerts.filter((a) => a.type === "objective_overdue")).toHaveLength(0);
    });

    it("does not alert for at_risk objectives past target_date (separate alert type)", () => {
      const objs = [
        makeObjective({ status: "at_risk", target_date: "2026-01-01" }),
      ];
      const alerts = identifyCarePlanAlerts([], objs, [], 0, NOW);
      expect(alerts.filter((a) => a.type === "objective_overdue")).toHaveLength(0);
    });

    it("does not alert for on_track objectives past target_date", () => {
      const objs = [
        makeObjective({ status: "on_track", target_date: "2026-01-01" }),
      ];
      const alerts = identifyCarePlanAlerts([], objs, [], 0, NOW);
      expect(alerts.filter((a) => a.type === "objective_overdue")).toHaveLength(0);
    });

    it("does not alert when target_date is in the future", () => {
      const objs = [
        makeObjective({ status: "not_started", target_date: "2026-08-01" }),
      ];
      const alerts = identifyCarePlanAlerts([], objs, [], 0, NOW);
      expect(alerts.filter((a) => a.type === "objective_overdue")).toHaveLength(0);
    });

    it("includes target date in message", () => {
      const objs = [
        makeObjective({ status: "in_progress", target_date: "2026-03-15" }),
      ];
      const alerts = identifyCarePlanAlerts([], objs, [], 0, NOW);
      const overdue = alerts.find((a) => a.type === "objective_overdue");
      expect(overdue?.message).toContain("2026-03-15");
    });
  });

  // ── children_without_plans ───────────────────────────────────────────────

  describe("children_without_plans alerts", () => {
    it("generates alert when totalChildren > children with active plans", () => {
      const plans = [
        makePlan({ child_id: "c1", status: "current" }),
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 3, NOW);
      const coverage = alerts.find((a) => a.type === "children_without_plans");
      expect(coverage).toBeDefined();
      expect(coverage?.severity).toBe("critical");
      expect(coverage?.message).toContain("2");
      expect(coverage?.id).toBe("coverage-gap");
    });

    it("uses singular 'child' when only 1 child is missing a plan", () => {
      const plans = [
        makePlan({ child_id: "c1", status: "current" }),
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 2, NOW);
      const coverage = alerts.find((a) => a.type === "children_without_plans");
      expect(coverage?.message).toContain("1 child without");
    });

    it("uses plural 'children' when multiple children are missing plans", () => {
      const plans: CarePlan[] = [];
      const alerts = identifyCarePlanAlerts(plans, [], [], 3, NOW);
      const coverage = alerts.find((a) => a.type === "children_without_plans");
      expect(coverage?.message).toContain("3 children without");
    });

    it("does not generate alert when all children have active plans", () => {
      const plans = [
        makePlan({ child_id: "c1", status: "current" }),
        makePlan({ child_id: "c2", status: "current" }),
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 2, NOW);
      expect(alerts.filter((a) => a.type === "children_without_plans")).toHaveLength(0);
    });

    it("does not generate alert when totalChildren is 0", () => {
      const alerts = identifyCarePlanAlerts([], [], [], 0, NOW);
      expect(alerts.filter((a) => a.type === "children_without_plans")).toHaveLength(0);
    });

    it("excludes superseded/archived plans from child coverage count", () => {
      const plans = [
        makePlan({ child_id: "c1", status: "superseded" }),
        makePlan({ child_id: "c2", status: "archived" }),
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 2, NOW);
      const coverage = alerts.find((a) => a.type === "children_without_plans");
      expect(coverage).toBeDefined();
      expect(coverage?.message).toContain("2 children without");
    });

    it("counts unique children — duplicates do not inflate coverage", () => {
      const plans = [
        makePlan({ child_id: "c1", status: "current" }),
        makePlan({ child_id: "c1", status: "under_review" }), // same child
      ];
      const alerts = identifyCarePlanAlerts(plans, [], [], 2, NOW);
      const coverage = alerts.find((a) => a.type === "children_without_plans");
      expect(coverage).toBeDefined();
      expect(coverage?.message).toContain("1 child without");
    });
  });

  // ── low_participation ────────────────────────────────────────────────────

  describe("low_participation alerts", () => {
    it("generates alert when participation rate is below 80% with 3+ reviews", () => {
      const reviews = [
        makeReview({ child_participated: true }),
        makeReview({ child_participated: false }),
        makeReview({ child_participated: false }),
      ];
      const alerts = identifyCarePlanAlerts([], [], reviews, 0, NOW);
      const lowPart = alerts.find((a) => a.type === "low_participation");
      expect(lowPart).toBeDefined();
      expect(lowPart?.severity).toBe("medium");
      expect(lowPart?.id).toBe("participation-rate");
    });

    it("includes participation rate percentage in message", () => {
      const reviews = [
        makeReview({ child_participated: true }),
        makeReview({ child_participated: false }),
        makeReview({ child_participated: false }),
        makeReview({ child_participated: false }),
      ];
      const alerts = identifyCarePlanAlerts([], [], reviews, 0, NOW);
      const lowPart = alerts.find((a) => a.type === "low_participation");
      expect(lowPart?.message).toContain("25%");
    });

    it("does not generate alert when participation is exactly 80%", () => {
      const reviews = [
        makeReview({ child_participated: true }),
        makeReview({ child_participated: true }),
        makeReview({ child_participated: true }),
        makeReview({ child_participated: true }),
        makeReview({ child_participated: false }),
      ];
      const alerts = identifyCarePlanAlerts([], [], reviews, 0, NOW);
      expect(alerts.filter((a) => a.type === "low_participation")).toHaveLength(0);
    });

    it("does not generate alert when participation is above 80%", () => {
      const reviews = [
        makeReview({ child_participated: true }),
        makeReview({ child_participated: true }),
        makeReview({ child_participated: true }),
      ];
      const alerts = identifyCarePlanAlerts([], [], reviews, 0, NOW);
      expect(alerts.filter((a) => a.type === "low_participation")).toHaveLength(0);
    });

    it("does not generate alert when fewer than 3 reviews", () => {
      const reviews = [
        makeReview({ child_participated: false }),
        makeReview({ child_participated: false }),
      ];
      const alerts = identifyCarePlanAlerts([], [], reviews, 0, NOW);
      expect(alerts.filter((a) => a.type === "low_participation")).toHaveLength(0);
    });

    it("does not generate alert when exactly 3 reviews and all participated", () => {
      const reviews = [
        makeReview({ child_participated: true }),
        makeReview({ child_participated: true }),
        makeReview({ child_participated: true }),
      ];
      const alerts = identifyCarePlanAlerts([], [], reviews, 0, NOW);
      expect(alerts.filter((a) => a.type === "low_participation")).toHaveLength(0);
    });

    it("generates alert when exactly 3 reviews and 0 participated (0%)", () => {
      const reviews = [
        makeReview({ child_participated: false }),
        makeReview({ child_participated: false }),
        makeReview({ child_participated: false }),
      ];
      const alerts = identifyCarePlanAlerts([], [], reviews, 0, NOW);
      const lowPart = alerts.find((a) => a.type === "low_participation");
      expect(lowPart).toBeDefined();
      expect(lowPart?.message).toContain("0%");
    });
  });

  // ── Combined alert scenarios ─────────────────────────────────────────────

  describe("combined scenarios", () => {
    it("generates alerts of multiple types simultaneously", () => {
      const plans = [
        makePlan({ child_id: "c1", child_name: "Alice", status: "current", next_review_date: "2026-04-01" }), // overdue
        makePlan({ child_id: "c1", child_name: "Alice", status: "current", next_review_date: "2026-05-20" }), // due soon
      ];
      const objs = [
        makeObjective({ child_name: "Alice", status: "at_risk", target_date: "2026-06-01" }),
        makeObjective({ child_name: "Alice", status: "not_started", target_date: "2026-03-01" }),
      ];
      const reviews = [
        makeReview({ child_participated: false }),
        makeReview({ child_participated: false }),
        makeReview({ child_participated: true }),
      ];
      const alerts = identifyCarePlanAlerts(plans, objs, reviews, 3, NOW);

      const types = alerts.map((a) => a.type);
      expect(types).toContain("review_overdue");
      expect(types).toContain("review_due_soon");
      expect(types).toContain("objective_at_risk");
      expect(types).toContain("objective_overdue");
      expect(types).toContain("children_without_plans");
      expect(types).toContain("low_participation");
    });

    it("returns empty array when everything is healthy", () => {
      const plans = [
        makePlan({ child_id: "c1", status: "current", next_review_date: "2026-08-01" }),
      ];
      const objs = [makeObjective({ status: "on_track", target_date: "2026-08-01" })];
      const reviews = [
        makeReview({ child_participated: true }),
        makeReview({ child_participated: true }),
        makeReview({ child_participated: true }),
      ];
      const alerts = identifyCarePlanAlerts(plans, objs, reviews, 1, NOW);
      expect(alerts).toHaveLength(0);
    });

    it("all alerts have required shape (type, severity, message, id)", () => {
      const plans = [
        makePlan({ status: "current", next_review_date: "2026-04-01" }),
      ];
      const objs = [makeObjective({ status: "at_risk" })];
      const alerts = identifyCarePlanAlerts(plans, objs, [], 2, NOW);
      for (const a of alerts) {
        expect(a).toHaveProperty("type");
        expect(a).toHaveProperty("severity");
        expect(a).toHaveProperty("message");
        expect(a).toHaveProperty("id");
        expect(typeof a.type).toBe("string");
        expect(["critical", "high", "medium"]).toContain(a.severity);
        expect(typeof a.message).toBe("string");
        expect(a.message.length).toBeGreaterThan(0);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  describe("listPlans", () => {
    it("returns ok: true with empty array", async () => {
      const result = await listPlans("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok: true with empty array regardless of filters", async () => {
      const result = await listPlans("home-1", {
        childId: "c1",
        planType: "care_plan",
        status: "current",
        limit: 10,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });
  });

  describe("createPlan", () => {
    it("returns ok: false with 'Supabase not configured' error", async () => {
      const result = await createPlan({
        homeId: "home-1",
        childId: "child-1",
        childName: "Test Child",
        planType: "care_plan",
        startDate: "2026-01-01",
        nextReviewDate: "2026-07-01",
        socialWorker: "SW Smith",
        keyWorker: "KW Jones",
      });
      expect(result).toEqual({ ok: false, error: "Supabase not configured" });
    });
  });

  describe("updatePlan", () => {
    it("returns ok: false with 'Supabase not configured' error", async () => {
      const result = await updatePlan("plan-1", { status: "archived" });
      expect(result).toEqual({ ok: false, error: "Supabase not configured" });
    });
  });

  describe("listObjectives", () => {
    it("returns ok: true with empty array", async () => {
      const result = await listObjectives("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok: true with empty array regardless of filters", async () => {
      const result = await listObjectives("home-1", {
        planId: "p1",
        childId: "c1",
        status: "in_progress",
        limit: 5,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });
  });

  describe("createObjective", () => {
    it("returns ok: false with 'Supabase not configured' error", async () => {
      const result = await createObjective({
        homeId: "home-1",
        planId: "plan-1",
        childId: "child-1",
        childName: "Test Child",
        objective: "Improve attendance",
        targetDate: "2026-06-01",
        responsiblePerson: "KW Jones",
      });
      expect(result).toEqual({ ok: false, error: "Supabase not configured" });
    });
  });

  describe("updateObjective", () => {
    it("returns ok: false with 'Supabase not configured' error", async () => {
      const result = await updateObjective("obj-1", { status: "completed" });
      expect(result).toEqual({ ok: false, error: "Supabase not configured" });
    });
  });

  describe("listReviews", () => {
    it("returns ok: true with empty array", async () => {
      const result = await listReviews("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok: true with empty array regardless of filters", async () => {
      const result = await listReviews("home-1", {
        planId: "p1",
        childId: "c1",
        reviewType: "lac_review",
        dateFrom: "2026-01-01",
        dateTo: "2026-12-31",
        limit: 50,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });
  });

  describe("createReview", () => {
    it("returns ok: false with 'Supabase not configured' error", async () => {
      const result = await createReview({
        homeId: "home-1",
        planId: "plan-1",
        childId: "child-1",
        childName: "Test Child",
        reviewType: "lac_review",
        reviewDate: "2026-05-01",
        chairedBy: "IRO Williams",
        attendees: ["SW Smith"],
        childParticipated: true,
        childViewsRecorded: true,
        outcome: "plan_unchanged",
        actions: ["Continue"],
        nextReviewDate: "2026-11-01",
      });
      expect(result).toEqual({ ok: false, error: "Supabase not configured" });
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  describe("single item inputs", () => {
    it("computes metrics correctly with a single plan", () => {
      const plan = makePlan({ child_id: "c1", status: "current", next_review_date: "2026-06-01" });
      const m = computeCarePlanMetrics([plan], [], [], 1, NOW);
      expect(m.total_plans).toBe(1);
      expect(m.current_plans).toBe(1);
      expect(m.children_with_plans).toBe(1);
      expect(m.plan_coverage_rate).toBe(100);
    });

    it("computes metrics correctly with a single objective", () => {
      const obj = makeObjective({ status: "completed" });
      const m = computeCarePlanMetrics([], [obj], [], 1, NOW);
      expect(m.total_objectives).toBe(1);
      expect(m.objectives_completed).toBe(1);
      expect(m.objective_completion_rate).toBe(100);
    });

    it("computes metrics correctly with a single review", () => {
      const rev = makeReview({ review_date: "2026-05-01", child_participated: true });
      const m = computeCarePlanMetrics([], [], [rev], 1, NOW);
      expect(m.reviews_this_quarter).toBe(1);
      expect(m.child_participation_rate).toBe(100);
    });

    it("generates exactly one alert for single overdue plan", () => {
      const plan = makePlan({ child_id: "c1", status: "current", next_review_date: "2026-04-01" });
      const alerts = identifyCarePlanAlerts([plan], [], [], 1, NOW);
      const overdue = alerts.filter((a) => a.type === "review_overdue");
      expect(overdue).toHaveLength(1);
    });
  });

  describe("large datasets", () => {
    it("handles 200 plans without error", () => {
      const plans = Array.from({ length: 200 }, (_, i) =>
        makePlan({ child_id: `child-${i}`, status: "current", next_review_date: "2026-08-01" }),
      );
      const m = computeCarePlanMetrics(plans, [], [], 200, NOW);
      expect(m.total_plans).toBe(200);
      expect(m.children_with_plans).toBe(200);
      expect(m.plan_coverage_rate).toBe(100);
    });

    it("handles 500 objectives without error", () => {
      const objs = Array.from({ length: 500 }, (_, i) =>
        makeObjective({ status: i < 250 ? "completed" : "in_progress" }),
      );
      const m = computeCarePlanMetrics([], objs, [], 5, NOW);
      expect(m.total_objectives).toBe(500);
      expect(m.objectives_completed).toBe(250);
      expect(m.objective_completion_rate).toBe(50);
    });

    it("handles 100 reviews without error", () => {
      const reviews = Array.from({ length: 100 }, (_, i) =>
        makeReview({
          review_date: "2026-05-01",
          child_participated: i < 75,
          outcome: "plan_unchanged",
        }),
      );
      const m = computeCarePlanMetrics([], [], reviews, 5, NOW);
      expect(m.reviews_this_quarter).toBe(100);
      expect(m.child_participation_rate).toBe(75);
    });
  });

  describe("type checks", () => {
    it("computeCarePlanMetrics returns correct types", () => {
      const m = computeCarePlanMetrics([], [], [], 0, NOW);
      expect(typeof m.total_plans).toBe("number");
      expect(typeof m.current_plans).toBe("number");
      expect(typeof m.overdue_reviews).toBe("number");
      expect(typeof m.reviews_due_soon).toBe("number");
      expect(typeof m.children_with_plans).toBe("number");
      expect(["number", "object"]).toContain(typeof m.plan_coverage_rate); // number | null
      expect(typeof m.total_objectives).toBe("number");
      expect(typeof m.objectives_completed).toBe("number");
      expect(typeof m.objectives_at_risk).toBe("number");
      expect(["number", "object"]).toContain(typeof m.objective_completion_rate); // number | null
      expect(typeof m.reviews_this_quarter).toBe("number");
      expect(["number", "object"]).toContain(typeof m.child_participation_rate); // number | null
      expect(typeof m.by_plan_type).toBe("object");
      expect(typeof m.by_plan_status).toBe("object");
      expect(typeof m.by_review_outcome).toBe("object");
    });

    it("identifyCarePlanAlerts returns an array", () => {
      const alerts = identifyCarePlanAlerts([], [], [], 0, NOW);
      expect(Array.isArray(alerts)).toBe(true);
    });

    it("by_plan_type values are numbers", () => {
      const plans = [makePlan({ plan_type: "care_plan", status: "current" })];
      const m = computeCarePlanMetrics(plans, [], [], 1, NOW);
      for (const val of Object.values(m.by_plan_type)) {
        expect(typeof val).toBe("number");
      }
    });

    it("by_plan_status values are numbers", () => {
      const plans = [makePlan({ status: "current" })];
      const m = computeCarePlanMetrics(plans, [], [], 1, NOW);
      for (const val of Object.values(m.by_plan_status)) {
        expect(typeof val).toBe("number");
      }
    });

    it("by_review_outcome values are numbers", () => {
      const reviews = [makeReview({ outcome: "plan_amended" })];
      const m = computeCarePlanMetrics([], [], reviews, 1, NOW);
      for (const val of Object.values(m.by_review_outcome)) {
        expect(typeof val).toBe("number");
      }
    });
  });

  describe("date edge cases", () => {
    it("review exactly at the 14-day boundary is included in due-soon", () => {
      // 14 days from 2026-05-13T12:00:00Z = 2026-05-27T12:00:00Z
      const plans = [
        makePlan({ status: "current", next_review_date: "2026-05-27T12:00:00Z" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.reviews_due_soon).toBe(1);
    });

    it("review 1ms after 14-day boundary is not in due-soon", () => {
      const plans = [
        makePlan({ status: "current", next_review_date: "2026-05-27T12:00:01Z" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      // Date comparison — 1 second after is beyond 14 days
      expect(m.reviews_due_soon).toBe(0);
    });

    it("review on exactly now is due-soon, not overdue", () => {
      const plans = [
        makePlan({ status: "current", next_review_date: "2026-05-13T12:00:00Z" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.overdue_reviews).toBe(0);
      expect(m.reviews_due_soon).toBe(1);
    });

    it("review 1ms before now is overdue", () => {
      const plans = [
        makePlan({ status: "current", next_review_date: "2026-05-13T11:59:59Z" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 5, NOW);
      expect(m.overdue_reviews).toBe(1);
      expect(m.reviews_due_soon).toBe(0);
    });
  });

  describe("rounding precision", () => {
    it("1/3 rounds to 33.3", () => {
      const objs = [
        makeObjective({ status: "completed" }),
        makeObjective({ status: "in_progress" }),
        makeObjective({ status: "at_risk" }),
      ];
      const m = computeCarePlanMetrics([], objs, [], 5, NOW);
      expect(m.objective_completion_rate).toBe(33.3);
    });

    it("2/3 rounds to 66.7", () => {
      const objs = [
        makeObjective({ status: "completed" }),
        makeObjective({ status: "completed" }),
        makeObjective({ status: "in_progress" }),
      ];
      const m = computeCarePlanMetrics([], objs, [], 5, NOW);
      expect(m.objective_completion_rate).toBe(66.7);
    });

    it("1/6 rounds to 16.7", () => {
      const objs = Array.from({ length: 6 }, (_, i) =>
        makeObjective({ status: i === 0 ? "completed" : "in_progress" }),
      );
      const m = computeCarePlanMetrics([], objs, [], 5, NOW);
      expect(m.objective_completion_rate).toBe(16.7);
    });

    it("5/6 rounds to 83.3", () => {
      const objs = Array.from({ length: 6 }, (_, i) =>
        makeObjective({ status: i < 5 ? "completed" : "in_progress" }),
      );
      const m = computeCarePlanMetrics([], objs, [], 5, NOW);
      expect(m.objective_completion_rate).toBe(83.3);
    });

    it("coverage rate: 3/7 rounds to 42.9", () => {
      const plans = Array.from({ length: 3 }, (_, i) =>
        makePlan({ child_id: `child-${i}`, status: "current" }),
      );
      const m = computeCarePlanMetrics(plans, [], [], 7, NOW);
      expect(m.plan_coverage_rate).toBe(42.9);
    });

    it("participation rate: 3/7 rounds to 42.9", () => {
      const reviews = Array.from({ length: 7 }, (_, i) =>
        makeReview({ child_participated: i < 3 }),
      );
      const m = computeCarePlanMetrics([], [], reviews, 5, NOW);
      expect(m.child_participation_rate).toBe(42.9);
    });
  });

  describe("status filtering correctness", () => {
    it("all four active statuses are treated as active (current, under_review, overdue_review, draft)", () => {
      const plans = [
        makePlan({ child_id: "c1", status: "current", next_review_date: "2026-08-01" }),
        makePlan({ child_id: "c2", status: "under_review", next_review_date: "2026-08-01" }),
        makePlan({ child_id: "c3", status: "overdue_review", next_review_date: "2026-08-01" }),
        makePlan({ child_id: "c4", status: "draft", next_review_date: "2026-08-01" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 4, NOW);
      expect(m.children_with_plans).toBe(4);
      expect(m.plan_coverage_rate).toBe(100);
    });

    it("superseded and archived are the only inactive statuses", () => {
      const plans = [
        makePlan({ child_id: "c1", status: "superseded" }),
        makePlan({ child_id: "c2", status: "archived" }),
      ];
      const m = computeCarePlanMetrics(plans, [], [], 2, NOW);
      expect(m.children_with_plans).toBe(0);
      expect(m.plan_coverage_rate).toBe(0);
    });
  });
});
