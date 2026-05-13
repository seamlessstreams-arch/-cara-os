// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — TRANSITION PLANNING SERVICE TESTS
// Pure-function unit tests for transition metrics computation, alert
// identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 12 (preparing children for adulthood
// and transitions), Reg 36 (notification on admission/leaving), Reg 14
// (care planning), Reg 7 (children's wishes), SCCIF Helped & Protected.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  TRANSITION_TYPES,
  TRANSITION_STATUSES,
  READINESS_AREAS,
  READINESS_RATINGS,
  GOAL_STATUSES,
  listPlans,
  createPlan,
  updatePlan,
  listReviews,
  createReview,
} from "../transition-planning-service";

import type {
  TransitionPlan,
  TransitionReview,
} from "../transition-planning-service";

const { computeTransitionMetrics, identifyTransitionAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Date string N days in the future from now. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal TransitionPlan with sensible defaults. */
function makePlan(overrides: Partial<TransitionPlan> = {}): TransitionPlan {
  return {
    id: "plan-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex",
    transition_type: "planned_discharge",
    planned_date: daysFromNow(30),
    actual_date: null,
    destination: null,
    destination_type: null,
    reason: "Moving to foster care",
    status: "planned",
    social_worker_name: "SW Smith",
    social_worker_notified: true,
    iro_notified: true,
    parent_notified: true,
    child_views_sought: true,
    child_views: "Alex is happy about the move",
    readiness_assessment: [],
    goals: [],
    handover_completed: false,
    handover_date: null,
    handover_to: null,
    records_transferred: false,
    follow_up_date: null,
    follow_up_completed: false,
    ofsted_notified: false,
    notes: null,
    created_at: daysAgoISO(10),
    updated_at: daysAgoISO(10),
    ...overrides,
  };
}

/** Build a minimal TransitionReview with sensible defaults. */
function makeReview(
  overrides: Partial<TransitionReview> = {},
): TransitionReview {
  return {
    id: "review-1",
    home_id: "home-1",
    plan_id: "plan-1",
    child_id: "child-1",
    child_name: "Alex",
    review_date: daysAgo(3),
    reviewer: "Manager Jones",
    progress_summary: "Good progress overall",
    goals_reviewed: 3,
    goals_on_track: 2,
    child_views: "Feeling positive",
    concerns: null,
    next_steps: "Continue current plan",
    next_review_date: daysFromNow(14),
    created_at: daysAgoISO(3),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  describe("TRANSITION_TYPES", () => {
    it("contains 10 transition types", () => {
      expect(TRANSITION_TYPES).toHaveLength(10);
    });

    it("every entry has a non-empty type and label", () => {
      for (const t of TRANSITION_TYPES) {
        expect(t.type).toBeTruthy();
        expect(t.label).toBeTruthy();
      }
    });

    it("has no duplicate type values", () => {
      const types = TRANSITION_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("includes key regulatory types", () => {
      const types = TRANSITION_TYPES.map((t) => t.type);
      expect(types).toContain("admission");
      expect(types).toContain("planned_discharge");
      expect(types).toContain("emergency_discharge");
      expect(types).toContain("reunification");
      expect(types).toContain("adult_services");
    });
  });

  describe("TRANSITION_STATUSES", () => {
    it("contains 5 statuses", () => {
      expect(TRANSITION_STATUSES).toHaveLength(5);
    });

    it("every entry has a non-empty status and label", () => {
      for (const s of TRANSITION_STATUSES) {
        expect(s.status).toBeTruthy();
        expect(s.label).toBeTruthy();
      }
    });

    it("has no duplicate status values", () => {
      const statuses = TRANSITION_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("includes the full lifecycle", () => {
      const statuses = TRANSITION_STATUSES.map((s) => s.status);
      expect(statuses).toContain("planned");
      expect(statuses).toContain("in_progress");
      expect(statuses).toContain("completed");
      expect(statuses).toContain("cancelled");
      expect(statuses).toContain("on_hold");
    });
  });

  describe("READINESS_AREAS", () => {
    it("contains 10 areas", () => {
      expect(READINESS_AREAS).toHaveLength(10);
    });

    it("every entry has a non-empty area and label", () => {
      for (const a of READINESS_AREAS) {
        expect(a.area).toBeTruthy();
        expect(a.label).toBeTruthy();
      }
    });

    it("has no duplicate area values", () => {
      const areas = READINESS_AREAS.map((a) => a.area);
      expect(new Set(areas).size).toBe(areas.length);
    });

    it("includes all Reg 12 preparation areas", () => {
      const areas = READINESS_AREAS.map((a) => a.area);
      expect(areas).toContain("emotional_readiness");
      expect(areas).toContain("practical_skills");
      expect(areas).toContain("education_training");
      expect(areas).toContain("health_needs");
      expect(areas).toContain("independent_living");
      expect(areas).toContain("financial_capability");
    });
  });

  describe("READINESS_RATINGS", () => {
    it("contains 4 ratings", () => {
      expect(READINESS_RATINGS).toHaveLength(4);
    });

    it("every entry has a non-empty rating and label", () => {
      for (const r of READINESS_RATINGS) {
        expect(r.rating).toBeTruthy();
        expect(r.label).toBeTruthy();
      }
    });

    it("has no duplicate rating values", () => {
      const ratings = READINESS_RATINGS.map((r) => r.rating);
      expect(new Set(ratings).size).toBe(ratings.length);
    });

    it("progresses from not_ready to ready", () => {
      const ratings = READINESS_RATINGS.map((r) => r.rating);
      expect(ratings[0]).toBe("not_ready");
      expect(ratings[ratings.length - 1]).toBe("ready");
    });
  });

  describe("GOAL_STATUSES", () => {
    it("contains 5 statuses", () => {
      expect(GOAL_STATUSES).toHaveLength(5);
    });

    it("every entry has a non-empty status and label", () => {
      for (const g of GOAL_STATUSES) {
        expect(g.status).toBeTruthy();
        expect(g.label).toBeTruthy();
      }
    });

    it("has no duplicate status values", () => {
      const statuses = GOAL_STATUSES.map((g) => g.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("includes full goal lifecycle", () => {
      const statuses = GOAL_STATUSES.map((g) => g.status);
      expect(statuses).toContain("not_started");
      expect(statuses).toContain("in_progress");
      expect(statuses).toContain("completed");
      expect(statuses).toContain("deferred");
      expect(statuses).toContain("no_longer_applicable");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// computeTransitionMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeTransitionMetrics", () => {
  // ── Empty inputs ─────────────────────────────────────────────────────

  it("returns all zeroes for empty arrays", () => {
    const m = computeTransitionMetrics([], []);
    expect(m.active_transitions).toBe(0);
    expect(m.planned_transitions).toBe(0);
    expect(m.completed_this_year).toBe(0);
    expect(m.avg_readiness_score).toBe(0);
    expect(m.goals_on_track_rate).toBe(0);
    expect(m.child_views_sought_rate).toBe(0);
    expect(m.overdue_follow_ups).toBe(0);
    expect(m.reviews_this_quarter).toBe(0);
    expect(Object.keys(m.by_transition_type)).toHaveLength(0);
  });

  // ── active_transitions ───────────────────────────────────────────────

  it("counts in_progress plans as active transitions", () => {
    const plans = [
      makePlan({ id: "p1", status: "in_progress" }),
      makePlan({ id: "p2", status: "in_progress" }),
      makePlan({ id: "p3", status: "planned" }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.active_transitions).toBe(2);
  });

  it("does not count completed or cancelled plans as active", () => {
    const plans = [
      makePlan({ id: "p1", status: "completed", actual_date: daysAgo(5) }),
      makePlan({ id: "p2", status: "cancelled" }),
      makePlan({ id: "p3", status: "on_hold" }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.active_transitions).toBe(0);
  });

  // ── planned_transitions ──────────────────────────────────────────────

  it("counts planned status as planned transitions", () => {
    const plans = [
      makePlan({ id: "p1", status: "planned" }),
      makePlan({ id: "p2", status: "planned" }),
      makePlan({ id: "p3", status: "in_progress" }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.planned_transitions).toBe(2);
  });

  it("returns 0 planned when no plans have planned status", () => {
    const plans = [makePlan({ status: "completed", actual_date: daysAgo(5) })];
    const m = computeTransitionMetrics(plans, []);
    expect(m.planned_transitions).toBe(0);
  });

  // ── completed_this_year ──────────────────────────────────────────────

  it("counts completed plans with actual_date in current year", () => {
    const thisYear = new Date().getFullYear();
    const plans = [
      makePlan({
        id: "p1",
        status: "completed",
        actual_date: `${thisYear}-03-15`,
      }),
      makePlan({
        id: "p2",
        status: "completed",
        actual_date: `${thisYear}-06-01`,
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.completed_this_year).toBe(2);
  });

  it("excludes completed plans from previous years", () => {
    const lastYear = new Date().getFullYear() - 1;
    const plans = [
      makePlan({
        id: "p1",
        status: "completed",
        actual_date: `${lastYear}-12-31`,
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.completed_this_year).toBe(0);
  });

  it("excludes completed plans without an actual_date", () => {
    const plans = [
      makePlan({ status: "completed", actual_date: null }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.completed_this_year).toBe(0);
  });

  // ── by_transition_type ───────────────────────────────────────────────

  it("groups plans by transition type", () => {
    const plans = [
      makePlan({ id: "p1", transition_type: "admission" }),
      makePlan({ id: "p2", transition_type: "admission" }),
      makePlan({ id: "p3", transition_type: "planned_discharge" }),
      makePlan({ id: "p4", transition_type: "step_down" }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.by_transition_type).toEqual({
      admission: 2,
      planned_discharge: 1,
      step_down: 1,
    });
  });

  it("includes all statuses in type breakdown", () => {
    const plans = [
      makePlan({ id: "p1", transition_type: "admission", status: "planned" }),
      makePlan({ id: "p2", transition_type: "admission", status: "completed", actual_date: daysAgo(5) }),
      makePlan({ id: "p3", transition_type: "admission", status: "cancelled" }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.by_transition_type.admission).toBe(3);
  });

  it("returns empty object when no plans", () => {
    const m = computeTransitionMetrics([], []);
    expect(m.by_transition_type).toEqual({});
  });

  // ── avg_readiness_score ──────────────────────────────────────────────

  it("calculates average readiness across planned/in_progress plans", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "in_progress",
        readiness_assessment: [
          { area: "emotional_readiness", rating: "ready", notes: "" },
          { area: "practical_skills", rating: "ready", notes: "" },
        ],
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.avg_readiness_score).toBe(4.0);
  });

  it("maps rating values correctly: not_ready=1, developing=2, mostly_ready=3, ready=4", () => {
    const plans = [
      makePlan({
        status: "planned",
        readiness_assessment: [
          { area: "emotional_readiness", rating: "not_ready", notes: "" },
          { area: "practical_skills", rating: "developing", notes: "" },
          { area: "education_training", rating: "mostly_ready", notes: "" },
          { area: "health_needs", rating: "ready", notes: "" },
        ],
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    // (1+2+3+4)/4 = 2.5
    expect(m.avg_readiness_score).toBe(2.5);
  });

  it("excludes completed/cancelled/on_hold plans from readiness average", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "completed",
        actual_date: daysAgo(5),
        readiness_assessment: [
          { area: "emotional_readiness", rating: "not_ready", notes: "" },
        ],
      }),
      makePlan({
        id: "p2",
        status: "planned",
        readiness_assessment: [
          { area: "emotional_readiness", rating: "ready", notes: "" },
        ],
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.avg_readiness_score).toBe(4.0);
  });

  it("returns 0 when no readiness assessments exist", () => {
    const plans = [makePlan({ status: "planned", readiness_assessment: [] })];
    const m = computeTransitionMetrics(plans, []);
    expect(m.avg_readiness_score).toBe(0);
  });

  it("averages across multiple plans", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "planned",
        readiness_assessment: [
          { area: "emotional_readiness", rating: "ready", notes: "" },
        ],
      }),
      makePlan({
        id: "p2",
        status: "in_progress",
        readiness_assessment: [
          { area: "emotional_readiness", rating: "not_ready", notes: "" },
        ],
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    // (4 + 1) / 2 = 2.5
    expect(m.avg_readiness_score).toBe(2.5);
  });

  it("rounds readiness score to 1 decimal place", () => {
    const plans = [
      makePlan({
        status: "planned",
        readiness_assessment: [
          { area: "emotional_readiness", rating: "not_ready", notes: "" },
          { area: "practical_skills", rating: "developing", notes: "" },
          { area: "education_training", rating: "ready", notes: "" },
        ],
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    // (1+2+4)/3 = 2.333... → 2.3
    expect(m.avg_readiness_score).toBe(2.3);
  });

  // ── goals_on_track_rate ──────────────────────────────────────────────

  it("calculates percentage of goals that are in_progress or completed", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        goals: [
          { goal: "G1", responsible_person: "A", target_date: daysFromNow(10), status: "completed", completion_notes: "" },
          { goal: "G2", responsible_person: "B", target_date: daysFromNow(10), status: "in_progress", completion_notes: "" },
          { goal: "G3", responsible_person: "C", target_date: daysFromNow(10), status: "not_started", completion_notes: "" },
          { goal: "G4", responsible_person: "D", target_date: daysFromNow(10), status: "deferred", completion_notes: "" },
        ],
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    // 2 on track / 4 total = 50%
    expect(m.goals_on_track_rate).toBe(50);
  });

  it("returns 0 when no goals exist", () => {
    const plans = [makePlan({ status: "planned", goals: [] })];
    const m = computeTransitionMetrics(plans, []);
    expect(m.goals_on_track_rate).toBe(0);
  });

  it("returns 100 when all goals are on track", () => {
    const plans = [
      makePlan({
        status: "planned",
        goals: [
          { goal: "G1", responsible_person: "A", target_date: daysFromNow(10), status: "completed", completion_notes: "" },
          { goal: "G2", responsible_person: "B", target_date: daysFromNow(10), status: "in_progress", completion_notes: "" },
        ],
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.goals_on_track_rate).toBe(100);
  });

  it("excludes goals from completed/cancelled/on_hold plans", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "completed",
        actual_date: daysAgo(5),
        goals: [
          { goal: "G1", responsible_person: "A", target_date: daysFromNow(10), status: "not_started", completion_notes: "" },
        ],
      }),
      makePlan({
        id: "p2",
        status: "planned",
        goals: [
          { goal: "G2", responsible_person: "B", target_date: daysFromNow(10), status: "completed", completion_notes: "" },
        ],
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.goals_on_track_rate).toBe(100);
  });

  it("counts deferred goals as not on track", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        goals: [
          { goal: "G1", responsible_person: "A", target_date: daysFromNow(10), status: "deferred", completion_notes: "" },
        ],
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.goals_on_track_rate).toBe(0);
  });

  it("counts no_longer_applicable goals as not on track", () => {
    const plans = [
      makePlan({
        status: "planned",
        goals: [
          { goal: "G1", responsible_person: "A", target_date: daysFromNow(10), status: "no_longer_applicable", completion_notes: "" },
        ],
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.goals_on_track_rate).toBe(0);
  });

  it("rounds goals_on_track_rate to 1 decimal place", () => {
    const plans = [
      makePlan({
        status: "planned",
        goals: [
          { goal: "G1", responsible_person: "A", target_date: daysFromNow(10), status: "completed", completion_notes: "" },
          { goal: "G2", responsible_person: "B", target_date: daysFromNow(10), status: "not_started", completion_notes: "" },
          { goal: "G3", responsible_person: "C", target_date: daysFromNow(10), status: "not_started", completion_notes: "" },
        ],
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    // 1/3 = 33.333...% → 33.3
    expect(m.goals_on_track_rate).toBe(33.3);
  });

  // ── child_views_sought_rate ──────────────────────────────────────────

  it("calculates rate across planned, in_progress, and completed plans", () => {
    const plans = [
      makePlan({ id: "p1", status: "planned", child_views_sought: true }),
      makePlan({ id: "p2", status: "in_progress", child_views_sought: true }),
      makePlan({ id: "p3", status: "completed", actual_date: daysAgo(5), child_views_sought: false }),
    ];
    const m = computeTransitionMetrics(plans, []);
    // 2/3 = 66.7%
    expect(m.child_views_sought_rate).toBe(66.7);
  });

  it("excludes cancelled and on_hold plans from views rate", () => {
    const plans = [
      makePlan({ id: "p1", status: "planned", child_views_sought: true }),
      makePlan({ id: "p2", status: "cancelled", child_views_sought: false }),
      makePlan({ id: "p3", status: "on_hold", child_views_sought: false }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.child_views_sought_rate).toBe(100);
  });

  it("returns 0 when no applicable plans exist", () => {
    const plans = [
      makePlan({ status: "cancelled", child_views_sought: false }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.child_views_sought_rate).toBe(0);
  });

  it("returns 100 when all applicable plans have views sought", () => {
    const plans = [
      makePlan({ id: "p1", status: "planned", child_views_sought: true }),
      makePlan({ id: "p2", status: "completed", actual_date: daysAgo(5), child_views_sought: true }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.child_views_sought_rate).toBe(100);
  });

  // ── overdue_follow_ups ───────────────────────────────────────────────

  it("counts completed plans with past follow_up_date and not completed", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "completed",
        actual_date: daysAgo(30),
        follow_up_date: daysAgo(5),
        follow_up_completed: false,
      }),
      makePlan({
        id: "p2",
        status: "completed",
        actual_date: daysAgo(30),
        follow_up_date: daysAgo(3),
        follow_up_completed: false,
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.overdue_follow_ups).toBe(2);
  });

  it("excludes follow-ups that are already completed", () => {
    const plans = [
      makePlan({
        status: "completed",
        actual_date: daysAgo(30),
        follow_up_date: daysAgo(5),
        follow_up_completed: true,
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.overdue_follow_ups).toBe(0);
  });

  it("excludes future follow-up dates", () => {
    const plans = [
      makePlan({
        status: "completed",
        actual_date: daysAgo(30),
        follow_up_date: daysFromNow(5),
        follow_up_completed: false,
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.overdue_follow_ups).toBe(0);
  });

  it("excludes non-completed plans from follow-up check", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        follow_up_date: daysAgo(5),
        follow_up_completed: false,
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.overdue_follow_ups).toBe(0);
  });

  it("excludes plans with null follow_up_date", () => {
    const plans = [
      makePlan({
        status: "completed",
        actual_date: daysAgo(30),
        follow_up_date: null,
        follow_up_completed: false,
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.overdue_follow_ups).toBe(0);
  });

  // ── reviews_this_quarter ─────────────────────────────────────────────

  it("counts reviews with review_date in current quarter", () => {
    const reviews = [
      makeReview({ id: "r1", review_date: daysAgo(5) }),
      makeReview({ id: "r2", review_date: daysAgo(10) }),
    ];
    const m = computeTransitionMetrics([], reviews);
    expect(m.reviews_this_quarter).toBe(2);
  });

  it("excludes reviews from a previous quarter", () => {
    const now = new Date();
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const beforeQuarter = new Date(quarterStart);
    beforeQuarter.setDate(beforeQuarter.getDate() - 1);

    const reviews = [
      makeReview({ id: "r1", review_date: beforeQuarter.toISOString().split("T")[0] }),
    ];
    const m = computeTransitionMetrics([], reviews);
    expect(m.reviews_this_quarter).toBe(0);
  });

  it("returns 0 reviews when no reviews provided", () => {
    const m = computeTransitionMetrics([], []);
    expect(m.reviews_this_quarter).toBe(0);
  });

  // ── Combined scenario ────────────────────────────────────────────────

  it("computes all metrics correctly for a mixed dataset", () => {
    const thisYear = new Date().getFullYear();
    const plans = [
      makePlan({
        id: "p1",
        status: "in_progress",
        transition_type: "planned_discharge",
        child_views_sought: true,
        readiness_assessment: [
          { area: "emotional_readiness", rating: "ready", notes: "" },
          { area: "practical_skills", rating: "mostly_ready", notes: "" },
        ],
        goals: [
          { goal: "G1", responsible_person: "A", target_date: daysFromNow(10), status: "in_progress", completion_notes: "" },
          { goal: "G2", responsible_person: "B", target_date: daysFromNow(10), status: "not_started", completion_notes: "" },
        ],
      }),
      makePlan({
        id: "p2",
        status: "planned",
        transition_type: "admission",
        child_views_sought: false,
      }),
      makePlan({
        id: "p3",
        status: "completed",
        transition_type: "planned_discharge",
        actual_date: `${thisYear}-02-01`,
        child_views_sought: true,
        ofsted_notified: true,
        handover_completed: true,
        follow_up_date: daysAgo(10),
        follow_up_completed: false,
      }),
    ];
    const reviews = [
      makeReview({ id: "r1", review_date: daysAgo(5) }),
    ];
    const m = computeTransitionMetrics(plans, reviews);

    expect(m.active_transitions).toBe(1);
    expect(m.planned_transitions).toBe(1);
    expect(m.completed_this_year).toBe(1);
    expect(m.by_transition_type).toEqual({
      planned_discharge: 2,
      admission: 1,
    });
    // readiness: (4+3)/2 = 3.5
    expect(m.avg_readiness_score).toBe(3.5);
    // goals: 1 on track / 2 total = 50%
    expect(m.goals_on_track_rate).toBe(50);
    // views: 2/3 = 66.7%
    expect(m.child_views_sought_rate).toBe(66.7);
    expect(m.overdue_follow_ups).toBe(1);
    expect(m.reviews_this_quarter).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// identifyTransitionAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyTransitionAlerts", () => {
  const now = new Date(new Date().toISOString().split("T")[0]);

  // ── No alerts ────────────────────────────────────────────────────────

  it("returns empty array when no plans or reviews", () => {
    const alerts = identifyTransitionAlerts([], [], now);
    expect(alerts).toEqual([]);
  });

  it("returns no alerts for a well-managed planned transition", () => {
    const plans = [
      makePlan({
        status: "planned",
        planned_date: daysFromNow(60),
        child_views_sought: true,
        social_worker_notified: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts).toEqual([]);
  });

  // ── emergency_no_child_views (critical) ──────────────────────────────

  it("fires critical alert for emergency discharge without child views", () => {
    const plans = [
      makePlan({
        transition_type: "emergency_discharge",
        child_views_sought: false,
        status: "in_progress",
        social_worker_notified: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const alert = alerts.find((a) => a.type === "emergency_no_child_views");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("critical");
    expect(alert!.message).toContain("Alex");
    expect(alert!.message).toContain("Reg 7");
    expect(alert!.id).toBe("plan-1");
  });

  it("does not fire emergency alert when child views are sought", () => {
    const plans = [
      makePlan({
        transition_type: "emergency_discharge",
        child_views_sought: true,
        status: "in_progress",
        social_worker_notified: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "emergency_no_child_views")).toBeUndefined();
  });

  it("does not fire emergency alert for non-emergency types without views", () => {
    const plans = [
      makePlan({
        transition_type: "planned_discharge",
        child_views_sought: false,
        status: "planned",
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "emergency_no_child_views")).toBeUndefined();
  });

  // ── no_readiness_assessment (high) ───────────────────────────────────

  it("fires high alert when planned transition within 30 days has no readiness assessment", () => {
    const plans = [
      makePlan({
        status: "planned",
        planned_date: daysFromNow(15),
        readiness_assessment: [],
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const alert = alerts.find((a) => a.type === "no_readiness_assessment");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
    expect(alert!.message).toContain("Alex");
    expect(alert!.message).toContain("Reg 12");
  });

  it("does not fire readiness alert when planned date is more than 30 days away", () => {
    const plans = [
      makePlan({
        status: "planned",
        planned_date: daysFromNow(45),
        readiness_assessment: [],
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "no_readiness_assessment")).toBeUndefined();
  });

  it("does not fire readiness alert when assessment exists", () => {
    const plans = [
      makePlan({
        status: "planned",
        planned_date: daysFromNow(15),
        readiness_assessment: [
          { area: "emotional_readiness", rating: "developing", notes: "" },
        ],
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "no_readiness_assessment")).toBeUndefined();
  });

  it("does not fire readiness alert for non-planned status", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        planned_date: daysFromNow(15),
        readiness_assessment: [],
        child_views_sought: true,
        social_worker_notified: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "no_readiness_assessment")).toBeUndefined();
  });

  it("does not fire readiness alert when planned date is past (overdue catches that)", () => {
    const plans = [
      makePlan({
        status: "planned",
        planned_date: daysAgo(5),
        readiness_assessment: [],
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "no_readiness_assessment")).toBeUndefined();
  });

  it("fires readiness alert at boundary: exactly 1 day away", () => {
    const plans = [
      makePlan({
        status: "planned",
        planned_date: daysFromNow(1),
        readiness_assessment: [],
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "no_readiness_assessment")).toBeDefined();
  });

  // ── transition_overdue (high) ────────────────────────────────────────

  it("fires high alert when planned date has passed and still planned", () => {
    const plans = [
      makePlan({
        status: "planned",
        planned_date: daysAgo(10),
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const alert = alerts.find((a) => a.type === "transition_overdue");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
    expect(alert!.message).toContain("10 days overdue");
  });

  it("does not fire overdue alert for future planned dates", () => {
    const plans = [
      makePlan({
        status: "planned",
        planned_date: daysFromNow(10),
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "transition_overdue")).toBeUndefined();
  });

  it("does not fire overdue alert for in_progress plans", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        planned_date: daysAgo(10),
        child_views_sought: true,
        social_worker_notified: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "transition_overdue")).toBeUndefined();
  });

  it("does not fire overdue alert for completed plans", () => {
    const plans = [
      makePlan({
        status: "completed",
        planned_date: daysAgo(10),
        actual_date: daysAgo(8),
        ofsted_notified: true,
        handover_completed: true,
        social_worker_notified: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "transition_overdue")).toBeUndefined();
  });

  // ── social_worker_not_notified (high) ────────────────────────────────

  it("fires high alert for in_progress plan without social worker notification", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        social_worker_notified: false,
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const alert = alerts.find((a) => a.type === "social_worker_not_notified");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
    expect(alert!.message).toContain("Reg 36");
  });

  it("fires high alert for completed plan without social worker notification", () => {
    const plans = [
      makePlan({
        status: "completed",
        actual_date: daysAgo(5),
        social_worker_notified: false,
        ofsted_notified: true,
        handover_completed: true,
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "social_worker_not_notified")).toBeDefined();
  });

  it("does not fire social worker alert for planned status", () => {
    const plans = [
      makePlan({
        status: "planned",
        social_worker_notified: false,
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "social_worker_not_notified")).toBeUndefined();
  });

  it("does not fire social worker alert when notified", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        social_worker_notified: true,
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "social_worker_not_notified")).toBeUndefined();
  });

  it("includes transition type in social worker alert message", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        transition_type: "step_down",
        social_worker_notified: false,
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const alert = alerts.find((a) => a.type === "social_worker_not_notified");
    expect(alert!.message).toContain("step down");
  });

  // ── ofsted_not_notified (high) ───────────────────────────────────────

  it("fires high alert for completed transition without Ofsted notification", () => {
    const plans = [
      makePlan({
        status: "completed",
        actual_date: daysAgo(5),
        ofsted_notified: false,
        social_worker_notified: true,
        handover_completed: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const alert = alerts.find((a) => a.type === "ofsted_not_notified");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
    expect(alert!.message).toContain("Reg 36");
  });

  it("does not fire Ofsted alert when notified", () => {
    const plans = [
      makePlan({
        status: "completed",
        actual_date: daysAgo(5),
        ofsted_notified: true,
        social_worker_notified: true,
        handover_completed: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "ofsted_not_notified")).toBeUndefined();
  });

  it("does not fire Ofsted alert for non-completed plans", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        ofsted_notified: false,
        social_worker_notified: true,
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "ofsted_not_notified")).toBeUndefined();
  });

  // ── no_handover (high) ───────────────────────────────────────────────

  it("fires high alert for completed non-internal_move without handover", () => {
    const plans = [
      makePlan({
        status: "completed",
        actual_date: daysAgo(5),
        transition_type: "planned_discharge",
        handover_completed: false,
        ofsted_notified: true,
        social_worker_notified: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const alert = alerts.find((a) => a.type === "no_handover");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
    expect(alert!.message).toContain("handover");
  });

  it("does not fire handover alert for internal_move", () => {
    const plans = [
      makePlan({
        status: "completed",
        actual_date: daysAgo(5),
        transition_type: "internal_move",
        handover_completed: false,
        ofsted_notified: true,
        social_worker_notified: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "no_handover")).toBeUndefined();
  });

  it("does not fire handover alert when handover is completed", () => {
    const plans = [
      makePlan({
        status: "completed",
        actual_date: daysAgo(5),
        transition_type: "planned_discharge",
        handover_completed: true,
        ofsted_notified: true,
        social_worker_notified: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "no_handover")).toBeUndefined();
  });

  it("does not fire handover alert for non-completed plans", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        transition_type: "planned_discharge",
        handover_completed: false,
        social_worker_notified: true,
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "no_handover")).toBeUndefined();
  });

  it("fires handover alert for all non-internal completed types", () => {
    const nonInternalTypes = [
      "admission", "planned_discharge", "emergency_discharge",
      "step_down", "step_up", "reunification", "foster_care",
      "semi_independent", "adult_services",
    ] as const;
    for (const tt of nonInternalTypes) {
      const plans = [
        makePlan({
          id: `plan-${tt}`,
          status: "completed",
          actual_date: daysAgo(5),
          transition_type: tt,
          handover_completed: false,
          ofsted_notified: true,
          social_worker_notified: true,
        }),
      ];
      const alerts = identifyTransitionAlerts(plans, [], now);
      expect(alerts.find((a) => a.type === "no_handover")).toBeDefined();
    }
  });

  // ── follow_up_overdue (medium) ───────────────────────────────────────

  it("fires medium alert for completed plan with overdue follow-up", () => {
    const plans = [
      makePlan({
        status: "completed",
        actual_date: daysAgo(30),
        follow_up_date: daysAgo(5),
        follow_up_completed: false,
        ofsted_notified: true,
        social_worker_notified: true,
        handover_completed: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const alert = alerts.find((a) => a.type === "follow_up_overdue");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
    expect(alert!.message).toContain("overdue");
  });

  it("does not fire follow-up alert when follow-up is completed", () => {
    const plans = [
      makePlan({
        status: "completed",
        actual_date: daysAgo(30),
        follow_up_date: daysAgo(5),
        follow_up_completed: true,
        ofsted_notified: true,
        social_worker_notified: true,
        handover_completed: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "follow_up_overdue")).toBeUndefined();
  });

  it("does not fire follow-up alert for future follow-up dates", () => {
    const plans = [
      makePlan({
        status: "completed",
        actual_date: daysAgo(30),
        follow_up_date: daysFromNow(5),
        follow_up_completed: false,
        ofsted_notified: true,
        social_worker_notified: true,
        handover_completed: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "follow_up_overdue")).toBeUndefined();
  });

  it("does not fire follow-up alert for non-completed plans", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        follow_up_date: daysAgo(5),
        follow_up_completed: false,
        social_worker_notified: true,
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "follow_up_overdue")).toBeUndefined();
  });

  // ── child_views_not_sought (medium) ──────────────────────────────────

  it("fires medium alert for planned plan without child views", () => {
    const plans = [
      makePlan({
        status: "planned",
        child_views_sought: false,
        planned_date: daysFromNow(60),
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const alert = alerts.find((a) => a.type === "child_views_not_sought");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
    expect(alert!.message).toContain("Reg 7");
  });

  it("fires medium alert for in_progress plan without child views", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        child_views_sought: false,
        social_worker_notified: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "child_views_not_sought")).toBeDefined();
  });

  it("does not fire child views alert when views are sought", () => {
    const plans = [
      makePlan({
        status: "planned",
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "child_views_not_sought")).toBeUndefined();
  });

  it("does not fire child views alert for completed plans", () => {
    const plans = [
      makePlan({
        status: "completed",
        actual_date: daysAgo(5),
        child_views_sought: false,
        ofsted_notified: true,
        social_worker_notified: true,
        handover_completed: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "child_views_not_sought")).toBeUndefined();
  });

  it("does not fire child views alert for cancelled plans", () => {
    const plans = [
      makePlan({
        status: "cancelled",
        child_views_sought: false,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "child_views_not_sought")).toBeUndefined();
  });

  // ── low_readiness (medium) ───────────────────────────────────────────

  it("fires medium alert when 3+ areas rated not_ready in an in_progress plan", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        child_views_sought: true,
        social_worker_notified: true,
        readiness_assessment: [
          { area: "emotional_readiness", rating: "not_ready", notes: "" },
          { area: "practical_skills", rating: "not_ready", notes: "" },
          { area: "education_training", rating: "not_ready", notes: "" },
          { area: "health_needs", rating: "developing", notes: "" },
        ],
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const alert = alerts.find((a) => a.type === "low_readiness");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
    expect(alert!.message).toContain("3 areas");
  });

  it("does not fire low readiness alert with only 2 not_ready areas", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        child_views_sought: true,
        social_worker_notified: true,
        readiness_assessment: [
          { area: "emotional_readiness", rating: "not_ready", notes: "" },
          { area: "practical_skills", rating: "not_ready", notes: "" },
          { area: "education_training", rating: "developing", notes: "" },
        ],
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "low_readiness")).toBeUndefined();
  });

  it("does not fire low readiness alert for planned plans", () => {
    const plans = [
      makePlan({
        status: "planned",
        child_views_sought: true,
        readiness_assessment: [
          { area: "emotional_readiness", rating: "not_ready", notes: "" },
          { area: "practical_skills", rating: "not_ready", notes: "" },
          { area: "education_training", rating: "not_ready", notes: "" },
        ],
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "low_readiness")).toBeUndefined();
  });

  it("does not fire low readiness alert with empty readiness assessment", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        child_views_sought: true,
        social_worker_notified: true,
        readiness_assessment: [],
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "low_readiness")).toBeUndefined();
  });

  it("fires low readiness alert when all areas are not_ready", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        child_views_sought: true,
        social_worker_notified: true,
        readiness_assessment: [
          { area: "emotional_readiness", rating: "not_ready", notes: "" },
          { area: "practical_skills", rating: "not_ready", notes: "" },
          { area: "education_training", rating: "not_ready", notes: "" },
          { area: "health_needs", rating: "not_ready", notes: "" },
          { area: "social_networks", rating: "not_ready", notes: "" },
        ],
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const alert = alerts.find((a) => a.type === "low_readiness");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("5 areas");
  });

  // ── no_review (medium) ───────────────────────────────────────────────

  it("fires medium alert for in_progress plan with no reviews after 30+ days", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        child_views_sought: true,
        social_worker_notified: true,
        created_at: daysAgoISO(45),
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const alert = alerts.find((a) => a.type === "no_review");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("medium");
    expect(alert!.message).toContain("No transition review");
  });

  it("does not fire no_review alert when review exists for plan", () => {
    const plans = [
      makePlan({
        id: "plan-1",
        status: "in_progress",
        child_views_sought: true,
        social_worker_notified: true,
        created_at: daysAgoISO(45),
      }),
    ];
    const reviews = [
      makeReview({ plan_id: "plan-1", review_date: daysAgo(10) }),
    ];
    const alerts = identifyTransitionAlerts(plans, reviews, now);
    expect(alerts.find((a) => a.type === "no_review")).toBeUndefined();
  });

  it("does not fire no_review alert when plan created less than 30 days ago", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        child_views_sought: true,
        social_worker_notified: true,
        created_at: daysAgoISO(15),
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "no_review")).toBeUndefined();
  });

  it("does not fire no_review alert for planned status", () => {
    const plans = [
      makePlan({
        status: "planned",
        child_views_sought: true,
        created_at: daysAgoISO(45),
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "no_review")).toBeUndefined();
  });

  it("does not fire no_review alert for completed status", () => {
    const plans = [
      makePlan({
        status: "completed",
        actual_date: daysAgo(5),
        ofsted_notified: true,
        social_worker_notified: true,
        handover_completed: true,
        created_at: daysAgoISO(60),
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "no_review")).toBeUndefined();
  });

  it("matches reviews to correct plan_id only", () => {
    const plans = [
      makePlan({
        id: "plan-A",
        status: "in_progress",
        child_views_sought: true,
        social_worker_notified: true,
        created_at: daysAgoISO(45),
      }),
    ];
    const reviews = [
      makeReview({ plan_id: "plan-B", review_date: daysAgo(10) }),
    ];
    const alerts = identifyTransitionAlerts(plans, reviews, now);
    expect(alerts.find((a) => a.type === "no_review")).toBeDefined();
  });

  // ── Multiple alerts on one plan ──────────────────────────────────────

  it("can produce multiple alerts for the same plan", () => {
    const plans = [
      makePlan({
        status: "completed",
        actual_date: daysAgo(5),
        transition_type: "planned_discharge",
        social_worker_notified: false,
        ofsted_notified: false,
        handover_completed: false,
        follow_up_date: daysAgo(2),
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("social_worker_not_notified");
    expect(types).toContain("ofsted_not_notified");
    expect(types).toContain("no_handover");
    expect(types).toContain("follow_up_overdue");
  });

  it("all alerts reference the correct plan id", () => {
    const plans = [
      makePlan({
        id: "plan-X",
        status: "completed",
        actual_date: daysAgo(5),
        social_worker_notified: false,
        ofsted_notified: false,
        handover_completed: false,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    for (const alert of alerts) {
      expect(alert.id).toBe("plan-X");
    }
  });

  // ── Multiple plans ───────────────────────────────────────────────────

  it("produces alerts for multiple plans independently", () => {
    const plans = [
      makePlan({
        id: "plan-A",
        child_name: "Alice",
        status: "planned",
        planned_date: daysAgo(5),
        child_views_sought: false,
      }),
      makePlan({
        id: "plan-B",
        child_name: "Bob",
        transition_type: "emergency_discharge",
        status: "in_progress",
        child_views_sought: false,
        social_worker_notified: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const planAAlerts = alerts.filter((a) => a.id === "plan-A");
    const planBAlerts = alerts.filter((a) => a.id === "plan-B");
    expect(planAAlerts.length).toBeGreaterThan(0);
    expect(planBAlerts.length).toBeGreaterThan(0);
    expect(planBAlerts.find((a) => a.type === "emergency_no_child_views")).toBeDefined();
  });

  // ── now parameter ────────────────────────────────────────────────────

  it("uses the provided now parameter for date comparisons", () => {
    const customNow = new Date("2025-06-15T00:00:00.000Z");
    const plans = [
      makePlan({
        status: "planned",
        planned_date: "2025-06-01",
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], customNow);
    const alert = alerts.find((a) => a.type === "transition_overdue");
    expect(alert).toBeDefined();
    expect(alert!.message).toMatch(/\d+ days overdue/);
    expect(alert!.message).toContain("Alex");
  });

  it("defaults now to current date when not provided", () => {
    const plans = [
      makePlan({
        status: "planned",
        planned_date: daysAgo(5),
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, []);
    expect(alerts.find((a) => a.type === "transition_overdue")).toBeDefined();
  });

  // ── Severity ordering ────────────────────────────────────────────────

  it("assigns correct severity levels to each alert type", () => {
    const plans = [
      // Critical
      makePlan({
        id: "plan-crit",
        transition_type: "emergency_discharge",
        child_views_sought: false,
        status: "in_progress",
        social_worker_notified: true,
      }),
      // High — overdue
      makePlan({
        id: "plan-high",
        status: "planned",
        planned_date: daysAgo(5),
        child_views_sought: true,
      }),
      // Medium — child views
      makePlan({
        id: "plan-med",
        status: "planned",
        planned_date: daysFromNow(60),
        child_views_sought: false,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.id === "plan-crit")!.severity).toBe("critical");
    expect(alerts.find((a) => a.id === "plan-high" && a.type === "transition_overdue")!.severity).toBe("high");
    expect(alerts.find((a) => a.id === "plan-med" && a.type === "child_views_not_sought")!.severity).toBe("medium");
  });

  // ── Edge cases ───────────────────────────────────────────────────────

  it("handles plan with all flags set correctly (no alerts except expected)", () => {
    const plans = [
      makePlan({
        status: "completed",
        actual_date: daysAgo(10),
        transition_type: "planned_discharge",
        social_worker_notified: true,
        ofsted_notified: true,
        handover_completed: true,
        follow_up_date: daysFromNow(5),
        follow_up_completed: false,
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts).toHaveLength(0);
  });

  it("handles plan with on_hold status — produces no relevant alerts", () => {
    const plans = [
      makePlan({
        status: "on_hold",
        child_views_sought: false,
        social_worker_notified: false,
        ofsted_notified: false,
        handover_completed: false,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts).toHaveLength(0);
  });

  it("handles plan with cancelled status — produces no relevant alerts", () => {
    const plans = [
      makePlan({
        status: "cancelled",
        child_views_sought: false,
        social_worker_notified: false,
        ofsted_notified: false,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// computeTransitionMetrics — additional edge cases
// ═══════════════════════════════════════════════════════════════════════════

describe("computeTransitionMetrics — edge cases", () => {
  it("handles single plan with all metrics populated", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        transition_type: "semi_independent",
        child_views_sought: true,
        readiness_assessment: [
          { area: "emotional_readiness", rating: "mostly_ready", notes: "" },
        ],
        goals: [
          { goal: "G1", responsible_person: "A", target_date: daysFromNow(10), status: "completed", completion_notes: "" },
        ],
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.active_transitions).toBe(1);
    expect(m.planned_transitions).toBe(0);
    expect(m.by_transition_type.semi_independent).toBe(1);
    expect(m.avg_readiness_score).toBe(3);
    expect(m.goals_on_track_rate).toBe(100);
  });

  it("handles large number of plans", () => {
    const plans = Array.from({ length: 50 }, (_, i) =>
      makePlan({
        id: `p-${i}`,
        status: i % 3 === 0 ? "planned" : i % 3 === 1 ? "in_progress" : "completed",
        actual_date: i % 3 === 2 ? daysAgo(i) : null,
        transition_type: "admission",
        child_views_sought: i % 2 === 0,
      }),
    );
    const m = computeTransitionMetrics(plans, []);
    expect(m.active_transitions + m.planned_transitions).toBeLessThanOrEqual(50);
    expect(m.by_transition_type.admission).toBe(50);
  });

  it("readiness score is 1.0 when all not_ready", () => {
    const plans = [
      makePlan({
        status: "planned",
        readiness_assessment: [
          { area: "emotional_readiness", rating: "not_ready", notes: "" },
          { area: "practical_skills", rating: "not_ready", notes: "" },
        ],
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.avg_readiness_score).toBe(1);
  });

  it("readiness score is 4.0 when all ready", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        readiness_assessment: [
          { area: "emotional_readiness", rating: "ready", notes: "" },
          { area: "practical_skills", rating: "ready", notes: "" },
          { area: "education_training", rating: "ready", notes: "" },
        ],
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.avg_readiness_score).toBe(4);
  });

  it("goals from multiple planned/in_progress plans are aggregated", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "planned",
        goals: [
          { goal: "G1", responsible_person: "A", target_date: daysFromNow(10), status: "completed", completion_notes: "" },
        ],
      }),
      makePlan({
        id: "p2",
        status: "in_progress",
        goals: [
          { goal: "G2", responsible_person: "B", target_date: daysFromNow(10), status: "not_started", completion_notes: "" },
          { goal: "G3", responsible_person: "C", target_date: daysFromNow(10), status: "in_progress", completion_notes: "" },
        ],
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    // 2 on track (completed + in_progress) / 3 total = 66.7%
    expect(m.goals_on_track_rate).toBe(66.7);
  });

  it("child_views_sought_rate rounds to 1 decimal", () => {
    const plans = [
      makePlan({ id: "p1", status: "planned", child_views_sought: true }),
      makePlan({ id: "p2", status: "planned", child_views_sought: true }),
      makePlan({ id: "p3", status: "planned", child_views_sought: false }),
    ];
    const m = computeTransitionMetrics(plans, []);
    // 2/3 = 66.666...% → 66.7
    expect(m.child_views_sought_rate).toBe(66.7);
  });

  it("handles multiple overdue follow-ups simultaneously", () => {
    const plans = [
      makePlan({
        id: "p1",
        status: "completed",
        actual_date: daysAgo(60),
        follow_up_date: daysAgo(30),
        follow_up_completed: false,
      }),
      makePlan({
        id: "p2",
        status: "completed",
        actual_date: daysAgo(40),
        follow_up_date: daysAgo(10),
        follow_up_completed: false,
      }),
      makePlan({
        id: "p3",
        status: "completed",
        actual_date: daysAgo(20),
        follow_up_date: daysAgo(1),
        follow_up_completed: false,
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.overdue_follow_ups).toBe(3);
  });

  it("counts multiple reviews in current quarter", () => {
    const reviews = [
      makeReview({ id: "r1", review_date: daysAgo(1) }),
      makeReview({ id: "r2", review_date: daysAgo(5) }),
      makeReview({ id: "r3", review_date: daysAgo(10) }),
      makeReview({ id: "r4", review_date: daysAgo(15) }),
    ];
    const m = computeTransitionMetrics([], reviews);
    expect(m.reviews_this_quarter).toBe(4);
  });

  it("by_transition_type counts each type separately", () => {
    const plans = [
      makePlan({ id: "p1", transition_type: "step_up" }),
      makePlan({ id: "p2", transition_type: "step_down" }),
      makePlan({ id: "p3", transition_type: "step_up" }),
      makePlan({ id: "p4", transition_type: "foster_care" }),
      makePlan({ id: "p5", transition_type: "foster_care" }),
      makePlan({ id: "p6", transition_type: "foster_care" }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.by_transition_type.step_up).toBe(2);
    expect(m.by_transition_type.step_down).toBe(1);
    expect(m.by_transition_type.foster_care).toBe(3);
  });

  it("completed_this_year counts only current year actual_dates", () => {
    const thisYear = new Date().getFullYear();
    const lastYear = thisYear - 1;
    const plans = [
      makePlan({ id: "p1", status: "completed", actual_date: `${thisYear}-01-01` }),
      makePlan({ id: "p2", status: "completed", actual_date: `${thisYear}-06-15` }),
      makePlan({ id: "p3", status: "completed", actual_date: `${lastYear}-12-31` }),
      makePlan({ id: "p4", status: "completed", actual_date: `${lastYear}-06-15` }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.completed_this_year).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// identifyTransitionAlerts — additional edge cases
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyTransitionAlerts — edge cases", () => {
  const now = new Date();

  it("no_readiness_assessment at boundary: exactly 30 days away", () => {
    const plans = [
      makePlan({
        status: "planned",
        planned_date: daysFromNow(30),
        readiness_assessment: [],
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    // 30 days is <= 30 and > 0 so it should fire
    expect(alerts.find((a) => a.type === "no_readiness_assessment")).toBeDefined();
  });

  it("emergency_no_child_views fires regardless of plan status", () => {
    for (const status of ["planned", "in_progress", "completed", "cancelled", "on_hold"] as const) {
      const plans = [
        makePlan({
          id: `plan-${status}`,
          transition_type: "emergency_discharge",
          child_views_sought: false,
          status,
          actual_date: status === "completed" ? daysAgo(5) : null,
        }),
      ];
      const alerts = identifyTransitionAlerts(plans, [], now);
      expect(alerts.find((a) => a.type === "emergency_no_child_views")).toBeDefined();
    }
  });

  it("transition_overdue shows correct day count", () => {
    const customNow = new Date("2025-07-20T00:00:00.000Z");
    const plans = [
      makePlan({
        status: "planned",
        planned_date: "2025-07-10",
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], customNow);
    const alert = alerts.find((a) => a.type === "transition_overdue");
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("10 days overdue");
  });

  it("social_worker alert message includes formatted transition type", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        transition_type: "semi_independent",
        social_worker_notified: false,
        child_views_sought: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const alert = alerts.find((a) => a.type === "social_worker_not_notified");
    expect(alert!.message).toContain("semi independent");
  });

  it("ofsted alert message includes formatted transition type", () => {
    const plans = [
      makePlan({
        status: "completed",
        actual_date: daysAgo(5),
        transition_type: "adult_services",
        ofsted_notified: false,
        social_worker_notified: true,
        handover_completed: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const alert = alerts.find((a) => a.type === "ofsted_not_notified");
    expect(alert!.message).toContain("adult services");
  });

  it("no_handover alert message references child name", () => {
    const plans = [
      makePlan({
        child_name: "Jordan",
        status: "completed",
        actual_date: daysAgo(5),
        transition_type: "foster_care",
        handover_completed: false,
        ofsted_notified: true,
        social_worker_notified: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const alert = alerts.find((a) => a.type === "no_handover");
    expect(alert!.message).toContain("Jordan");
  });

  it("follow_up_overdue alert references child name", () => {
    const plans = [
      makePlan({
        child_name: "Sam",
        status: "completed",
        actual_date: daysAgo(30),
        follow_up_date: daysAgo(5),
        follow_up_completed: false,
        ofsted_notified: true,
        social_worker_notified: true,
        handover_completed: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const alert = alerts.find((a) => a.type === "follow_up_overdue");
    expect(alert!.message).toContain("Sam");
  });

  it("child_views_not_sought alert references child name and Reg 7", () => {
    const plans = [
      makePlan({
        child_name: "Taylor",
        status: "in_progress",
        child_views_sought: false,
        social_worker_notified: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const alert = alerts.find((a) => a.type === "child_views_not_sought");
    expect(alert!.message).toContain("Taylor");
    expect(alert!.message).toContain("Reg 7");
  });

  it("low_readiness alert exactly at threshold of 3 not_ready areas", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        child_views_sought: true,
        social_worker_notified: true,
        readiness_assessment: [
          { area: "emotional_readiness", rating: "not_ready", notes: "" },
          { area: "practical_skills", rating: "not_ready", notes: "" },
          { area: "education_training", rating: "not_ready", notes: "" },
        ],
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "low_readiness")).toBeDefined();
  });

  it("no_review alert checks created_at against 30-day threshold", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        child_views_sought: true,
        social_worker_notified: true,
        created_at: daysAgoISO(31),
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.find((a) => a.type === "no_review")).toBeDefined();
  });

  it("no_review alert does not fire at exactly 30 days boundary", () => {
    // 30 days in ms: 30 * 86400000 = 2592000000
    // now.getTime() - createdDate should be > 30 days, not equal
    const justAt30Days = new Date(now.getTime() - 30 * 86400000);
    const plans = [
      makePlan({
        status: "in_progress",
        child_views_sought: true,
        social_worker_notified: true,
        created_at: justAt30Days.toISOString(),
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    // Exactly at boundary: now - created = 30 days exactly, not > 30 days
    expect(alerts.find((a) => a.type === "no_review")).toBeUndefined();
  });

  it("reviews for different plans do not prevent no_review alert", () => {
    const plans = [
      makePlan({
        id: "plan-X",
        status: "in_progress",
        child_views_sought: true,
        social_worker_notified: true,
        created_at: daysAgoISO(60),
      }),
    ];
    const reviews = [
      makeReview({ plan_id: "plan-Y", review_date: daysAgo(5) }),
      makeReview({ id: "r2", plan_id: "plan-Z", review_date: daysAgo(10) }),
    ];
    const alerts = identifyTransitionAlerts(plans, reviews, now);
    expect(alerts.find((a) => a.type === "no_review")).toBeDefined();
  });

  it("handles plan with maximum alert count (all applicable alerts)", () => {
    const plans = [
      makePlan({
        id: "plan-worst",
        child_name: "Worst Case",
        transition_type: "emergency_discharge",
        status: "completed",
        actual_date: daysAgo(5),
        child_views_sought: false,
        social_worker_notified: false,
        ofsted_notified: false,
        handover_completed: false,
        follow_up_date: daysAgo(1),
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const types = new Set(alerts.map((a) => a.type));
    expect(types.has("emergency_no_child_views")).toBe(true);
    expect(types.has("social_worker_not_notified")).toBe(true);
    expect(types.has("ofsted_not_notified")).toBe(true);
    expect(types.has("no_handover")).toBe(true);
    expect(types.has("follow_up_overdue")).toBe(true);
    expect(alerts.length).toBeGreaterThanOrEqual(5);
  });

  it("no alerts for a fully compliant in_progress plan with review", () => {
    const plans = [
      makePlan({
        id: "plan-good",
        status: "in_progress",
        child_views_sought: true,
        social_worker_notified: true,
        readiness_assessment: [
          { area: "emotional_readiness", rating: "mostly_ready", notes: "" },
          { area: "practical_skills", rating: "ready", notes: "" },
        ],
        created_at: daysAgoISO(45),
      }),
    ];
    const reviews = [
      makeReview({ plan_id: "plan-good", review_date: daysAgo(10) }),
    ];
    const alerts = identifyTransitionAlerts(plans, reviews, now);
    expect(alerts).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD fallback (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  describe("listPlans", () => {
    it("returns ok:true with empty array", async () => {
      const result = await listPlans("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("accepts optional filters without error", async () => {
      const result = await listPlans("home-1", {
        childId: "child-1",
        transitionType: "admission",
        status: "planned",
        limit: 10,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });
  });

  describe("createPlan", () => {
    it("returns ok:false with Supabase not configured", async () => {
      const result = await createPlan({
        homeId: "home-1",
        childId: "child-1",
        childName: "Alex",
        transitionType: "admission",
        plannedDate: daysFromNow(30),
        reason: "New placement",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Supabase");
      }
    });
  });

  describe("updatePlan", () => {
    it("returns ok:false with Supabase not configured", async () => {
      const result = await updatePlan("plan-1", { status: "in_progress" });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Supabase");
      }
    });
  });

  describe("listReviews", () => {
    it("returns ok:true with empty array", async () => {
      const result = await listReviews("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("accepts optional filters without error", async () => {
      const result = await listReviews("home-1", {
        planId: "plan-1",
        childId: "child-1",
        limit: 10,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });
  });

  describe("createReview", () => {
    it("returns ok:false with Supabase not configured", async () => {
      const result = await createReview({
        homeId: "home-1",
        planId: "plan-1",
        childId: "child-1",
        childName: "Alex",
        reviewer: "Manager",
        progressSummary: "Good progress",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Supabase");
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Builder helpers validation
// ═══════════════════════════════════════════════════════════════════════════

describe("Builder helpers", () => {
  describe("makePlan", () => {
    it("creates a valid TransitionPlan with defaults", () => {
      const plan = makePlan();
      expect(plan.id).toBe("plan-1");
      expect(plan.home_id).toBe("home-1");
      expect(plan.child_id).toBe("child-1");
      expect(plan.child_name).toBe("Alex");
      expect(plan.transition_type).toBe("planned_discharge");
      expect(plan.status).toBe("planned");
      expect(plan.readiness_assessment).toEqual([]);
      expect(plan.goals).toEqual([]);
      expect(plan.handover_completed).toBe(false);
      expect(plan.follow_up_completed).toBe(false);
    });

    it("allows overriding any field", () => {
      const plan = makePlan({
        id: "custom-id",
        child_name: "Jordan",
        status: "in_progress",
        transition_type: "step_up",
      });
      expect(plan.id).toBe("custom-id");
      expect(plan.child_name).toBe("Jordan");
      expect(plan.status).toBe("in_progress");
      expect(plan.transition_type).toBe("step_up");
    });
  });

  describe("makeReview", () => {
    it("creates a valid TransitionReview with defaults", () => {
      const review = makeReview();
      expect(review.id).toBe("review-1");
      expect(review.plan_id).toBe("plan-1");
      expect(review.child_name).toBe("Alex");
      expect(review.goals_reviewed).toBe(3);
      expect(review.goals_on_track).toBe(2);
    });

    it("allows overriding any field", () => {
      const review = makeReview({
        id: "rev-custom",
        plan_id: "plan-99",
        reviewer: "Inspector X",
      });
      expect(review.id).toBe("rev-custom");
      expect(review.plan_id).toBe("plan-99");
      expect(review.reviewer).toBe("Inspector X");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Type export validation
// ═══════════════════════════════════════════════════════════════════════════

describe("Type export validation", () => {
  it("_testing exports computeTransitionMetrics function", () => {
    expect(typeof computeTransitionMetrics).toBe("function");
  });

  it("_testing exports identifyTransitionAlerts function", () => {
    expect(typeof identifyTransitionAlerts).toBe("function");
  });

  it("TRANSITION_TYPES is a frozen-shape array", () => {
    expect(Array.isArray(TRANSITION_TYPES)).toBe(true);
  });

  it("TRANSITION_STATUSES is a frozen-shape array", () => {
    expect(Array.isArray(TRANSITION_STATUSES)).toBe(true);
  });

  it("READINESS_AREAS is a frozen-shape array", () => {
    expect(Array.isArray(READINESS_AREAS)).toBe(true);
  });

  it("READINESS_RATINGS is a frozen-shape array", () => {
    expect(Array.isArray(READINESS_RATINGS)).toBe(true);
  });

  it("GOAL_STATUSES is a frozen-shape array", () => {
    expect(Array.isArray(GOAL_STATUSES)).toBe(true);
  });

  it("listPlans is an async function", () => {
    expect(typeof listPlans).toBe("function");
  });

  it("createPlan is an async function", () => {
    expect(typeof createPlan).toBe("function");
  });

  it("updatePlan is an async function", () => {
    expect(typeof updatePlan).toBe("function");
  });

  it("listReviews is an async function", () => {
    expect(typeof listReviews).toBe("function");
  });

  it("createReview is an async function", () => {
    expect(typeof createReview).toBe("function");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Alert structure validation
// ═══════════════════════════════════════════════════════════════════════════

describe("Alert structure validation", () => {
  const now = new Date();

  it("every alert has type, severity, message, and id fields", () => {
    const plans = [
      makePlan({
        id: "plan-struct",
        transition_type: "emergency_discharge",
        child_views_sought: false,
        status: "in_progress",
        social_worker_notified: false,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.length).toBeGreaterThan(0);
    for (const alert of alerts) {
      expect(alert).toHaveProperty("type");
      expect(alert).toHaveProperty("severity");
      expect(alert).toHaveProperty("message");
      expect(alert).toHaveProperty("id");
      expect(typeof alert.type).toBe("string");
      expect(typeof alert.severity).toBe("string");
      expect(typeof alert.message).toBe("string");
      expect(typeof alert.id).toBe("string");
    }
  });

  it("severity is always one of critical, high, or medium", () => {
    const plans = [
      makePlan({
        id: "plan-sev",
        transition_type: "emergency_discharge",
        child_views_sought: false,
        status: "completed",
        actual_date: daysAgo(3),
        social_worker_notified: false,
        ofsted_notified: false,
        handover_completed: false,
        follow_up_date: daysAgo(1),
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    const validSeverities = ["critical", "high", "medium"];
    for (const alert of alerts) {
      expect(validSeverities).toContain(alert.severity);
    }
  });

  it("alert messages are non-empty strings", () => {
    const plans = [
      makePlan({
        status: "planned",
        planned_date: daysAgo(5),
        child_views_sought: false,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    for (const alert of alerts) {
      expect(alert.message.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Metrics return shape
// ═══════════════════════════════════════════════════════════════════════════

describe("Metrics return shape", () => {
  it("returns all expected keys", () => {
    const m = computeTransitionMetrics([], []);
    const keys = Object.keys(m);
    expect(keys).toContain("active_transitions");
    expect(keys).toContain("planned_transitions");
    expect(keys).toContain("completed_this_year");
    expect(keys).toContain("by_transition_type");
    expect(keys).toContain("avg_readiness_score");
    expect(keys).toContain("goals_on_track_rate");
    expect(keys).toContain("child_views_sought_rate");
    expect(keys).toContain("overdue_follow_ups");
    expect(keys).toContain("reviews_this_quarter");
  });

  it("numeric fields are numbers, not strings", () => {
    const m = computeTransitionMetrics([], []);
    expect(typeof m.active_transitions).toBe("number");
    expect(typeof m.planned_transitions).toBe("number");
    expect(typeof m.completed_this_year).toBe("number");
    expect(typeof m.avg_readiness_score).toBe("number");
    expect(typeof m.goals_on_track_rate).toBe("number");
    expect(typeof m.child_views_sought_rate).toBe("number");
    expect(typeof m.overdue_follow_ups).toBe("number");
    expect(typeof m.reviews_this_quarter).toBe("number");
  });

  it("by_transition_type is a plain object", () => {
    const m = computeTransitionMetrics([], []);
    expect(typeof m.by_transition_type).toBe("object");
    expect(m.by_transition_type).not.toBeNull();
    expect(Array.isArray(m.by_transition_type)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Integration-style scenarios
// ═══════════════════════════════════════════════════════════════════════════

describe("Integration scenarios", () => {
  it("new admission flow — planned with no issues", () => {
    const plans = [
      makePlan({
        transition_type: "admission",
        status: "planned",
        planned_date: daysFromNow(14),
        child_views_sought: true,
        readiness_assessment: [
          { area: "emotional_readiness", rating: "developing", notes: "" },
        ],
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], new Date());
    expect(alerts).toHaveLength(0);
    const metrics = computeTransitionMetrics(plans, []);
    expect(metrics.planned_transitions).toBe(1);
    expect(metrics.child_views_sought_rate).toBe(100);
  });

  it("step-down in progress with reviews and goals", () => {
    const plans = [
      makePlan({
        id: "plan-sd",
        transition_type: "step_down",
        status: "in_progress",
        child_views_sought: true,
        social_worker_notified: true,
        readiness_assessment: [
          { area: "emotional_readiness", rating: "mostly_ready", notes: "" },
          { area: "practical_skills", rating: "ready", notes: "" },
        ],
        goals: [
          { goal: "Build skills", responsible_person: "Key Worker", target_date: daysFromNow(14), status: "in_progress", completion_notes: "" },
          { goal: "Family work", responsible_person: "Therapist", target_date: daysFromNow(30), status: "completed", completion_notes: "Done" },
        ],
        created_at: daysAgoISO(20),
      }),
    ];
    const reviews = [
      makeReview({ plan_id: "plan-sd", review_date: daysAgo(7) }),
    ];
    const metrics = computeTransitionMetrics(plans, reviews);
    expect(metrics.active_transitions).toBe(1);
    expect(metrics.goals_on_track_rate).toBe(100);
    expect(metrics.avg_readiness_score).toBe(3.5);
    expect(metrics.reviews_this_quarter).toBe(1);

    const alerts = identifyTransitionAlerts(plans, reviews, new Date());
    expect(alerts).toHaveLength(0);
  });

  it("problematic discharge — multiple alerts and poor metrics", () => {
    const plans = [
      makePlan({
        id: "plan-bad",
        child_name: "Riley",
        transition_type: "emergency_discharge",
        status: "completed",
        actual_date: daysAgo(3),
        child_views_sought: false,
        social_worker_notified: false,
        ofsted_notified: false,
        handover_completed: false,
        follow_up_date: daysAgo(1),
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], new Date());
    const types = alerts.map((a) => a.type);
    expect(types).toContain("emergency_no_child_views");
    expect(types).toContain("social_worker_not_notified");
    expect(types).toContain("ofsted_not_notified");
    expect(types).toContain("no_handover");
    expect(types).toContain("follow_up_overdue");
    expect(alerts.find((a) => a.type === "emergency_no_child_views")!.severity).toBe("critical");

    const metrics = computeTransitionMetrics(plans, []);
    expect(metrics.child_views_sought_rate).toBe(0);
    expect(metrics.overdue_follow_ups).toBe(1);
  });

  it("adult services transition — full lifecycle", () => {
    const thisYear = new Date().getFullYear();
    const plans = [
      makePlan({
        id: "plan-adult",
        transition_type: "adult_services",
        status: "completed",
        actual_date: `${thisYear}-04-01`,
        planned_date: `${thisYear}-03-15`,
        social_worker_notified: true,
        ofsted_notified: true,
        handover_completed: true,
        child_views_sought: true,
        follow_up_date: daysFromNow(7),
        follow_up_completed: false,
      }),
    ];
    const reviews = [
      makeReview({ plan_id: "plan-adult", review_date: `${thisYear}-03-01` }),
      makeReview({ id: "r2", plan_id: "plan-adult", review_date: `${thisYear}-03-20` }),
    ];
    const metrics = computeTransitionMetrics(plans, reviews);
    expect(metrics.completed_this_year).toBe(1);
    expect(metrics.by_transition_type.adult_services).toBe(1);

    const alerts = identifyTransitionAlerts(plans, reviews, new Date());
    expect(alerts).toHaveLength(0);
  });

  it("mixed caseload — diverse plans and reviews", () => {
    const thisYear = new Date().getFullYear();
    const plans = [
      makePlan({
        id: "p1",
        child_name: "A",
        transition_type: "admission",
        status: "planned",
        child_views_sought: true,
        planned_date: daysFromNow(60),
      }),
      makePlan({
        id: "p2",
        child_name: "B",
        transition_type: "step_down",
        status: "in_progress",
        child_views_sought: true,
        social_worker_notified: true,
        readiness_assessment: [
          { area: "emotional_readiness", rating: "ready", notes: "" },
        ],
        goals: [
          { goal: "G1", responsible_person: "X", target_date: daysFromNow(10), status: "in_progress", completion_notes: "" },
        ],
        created_at: daysAgoISO(10),
      }),
      makePlan({
        id: "p3",
        child_name: "C",
        transition_type: "reunification",
        status: "completed",
        actual_date: `${thisYear}-01-15`,
        social_worker_notified: true,
        ofsted_notified: true,
        handover_completed: true,
        child_views_sought: true,
      }),
      makePlan({
        id: "p4",
        child_name: "D",
        transition_type: "foster_care",
        status: "cancelled",
        child_views_sought: false,
      }),
    ];
    const reviews = [
      makeReview({ plan_id: "p2", review_date: daysAgo(3) }),
    ];
    const metrics = computeTransitionMetrics(plans, reviews);
    expect(metrics.active_transitions).toBe(1);
    expect(metrics.planned_transitions).toBe(1);
    expect(metrics.completed_this_year).toBe(1);
    expect(metrics.by_transition_type).toEqual({
      admission: 1,
      step_down: 1,
      reunification: 1,
      foster_care: 1,
    });
    expect(metrics.avg_readiness_score).toBe(4.0);
    expect(metrics.goals_on_track_rate).toBe(100);
    // views: p1 (true), p2 (true), p3 (true) — p4 excluded (cancelled)
    expect(metrics.child_views_sought_rate).toBe(100);

    const alerts = identifyTransitionAlerts(plans, reviews, new Date());
    // No critical or high alerts for this well-managed set
    expect(alerts.filter((a) => a.severity === "critical")).toHaveLength(0);
  });
});
