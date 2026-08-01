import { describe, it, expect } from "vitest";
import {
  computeTransitionMetrics,
  identifyTransitionAlerts,
  type TransitionPlan,
  type TransitionReview,
} from "./transition-planning-service";

// ── Factories ────────────────────────────────────────────────────────────

function makePlan(overrides: Partial<TransitionPlan> = {}): TransitionPlan {
  return {
    id: "p1",
    home_id: "h1",
    child_id: "c1",
    child_name: "Alex",
    transition_type: "planned_discharge",
    planned_date: "2025-06-01",
    actual_date: null,
    destination: "Foster home",
    destination_type: "foster_care",
    reason: "Planned move",
    status: "planned",
    social_worker_name: "SW Smith",
    social_worker_notified: true,
    iro_notified: true,
    parent_notified: true,
    child_views_sought: true,
    child_views: "Happy to move",
    readiness_assessment: [
      { area: "emotional_readiness", rating: "mostly_ready", notes: "" },
    ],
    goals: [
      { goal: "Pack belongings", responsible_person: "Key worker", target_date: "2025-05-25", status: "in_progress", completion_notes: "" },
    ],
    handover_completed: false,
    handover_date: null,
    handover_to: null,
    records_transferred: false,
    follow_up_date: null,
    follow_up_completed: false,
    ofsted_notified: false,
    notes: null,
    created_at: "2025-04-01",
    updated_at: "2025-04-01",
    ...overrides,
  };
}

function makeReview(overrides: Partial<TransitionReview> = {}): TransitionReview {
  return {
    id: "rev1",
    home_id: "h1",
    plan_id: "p1",
    child_id: "c1",
    child_name: "Alex",
    review_date: "2025-05-01",
    reviewer: "Manager A",
    progress_summary: "On track",
    goals_reviewed: 3,
    goals_on_track: 2,
    child_views: null,
    concerns: null,
    next_steps: null,
    next_review_date: null,
    created_at: "2025-05-01",
    ...overrides,
  };
}

// ── computeTransitionMetrics ─────────────────────────────────────────────

describe("computeTransitionMetrics", () => {
  it("returns zeroes for empty inputs", () => {
    const m = computeTransitionMetrics([], []);
    expect(m.active_transitions).toBe(0);
    expect(m.planned_transitions).toBe(0);
    expect(m.completed_this_year).toBe(0);
    expect(m.avg_readiness_score).toBeNull();;
    expect(m.goals_on_track_rate).toBeNull();;
    expect(m.child_views_sought_rate).toBeNull();;
    expect(m.overdue_follow_ups).toBe(0);
    expect(m.reviews_this_quarter).toBe(0);
  });

  it("counts active and planned transitions", () => {
    const plans = [
      makePlan({ status: "in_progress" }),
      makePlan({ id: "p2", status: "planned" }),
      makePlan({ id: "p3", status: "completed", actual_date: "2025-03-01" }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.active_transitions).toBe(1);
    expect(m.planned_transitions).toBe(1);
  });

  it("calculates average readiness score for active/planned plans", () => {
    const plans = [
      makePlan({
        status: "planned",
        readiness_assessment: [
          { area: "emotional_readiness", rating: "ready", notes: "" }, // 4
          { area: "practical_skills", rating: "developing", notes: "" }, // 2
        ],
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    // (4+2)/2 = 3
    expect(m.avg_readiness_score).toBe(3);
  });

  it("calculates goals on track rate for active/planned plans", () => {
    const plans = [
      makePlan({
        status: "in_progress",
        goals: [
          { goal: "A", responsible_person: "X", target_date: "2025-05-01", status: "completed", completion_notes: "" },
          { goal: "B", responsible_person: "X", target_date: "2025-05-01", status: "not_started", completion_notes: "" },
        ],
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    // 1 on track (completed) / 2 total = 50%
    expect(m.goals_on_track_rate).toBe(50);
  });

  it("counts overdue follow-ups for completed transitions", () => {
    const plans = [
      makePlan({
        status: "completed",
        actual_date: "2025-03-01",
        follow_up_date: "2025-03-15",
        follow_up_completed: false,
      }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.overdue_follow_ups).toBe(1);
  });

  it("calculates child views sought rate", () => {
    const plans = [
      makePlan({ status: "planned", child_views_sought: true }),
      makePlan({ id: "p2", status: "planned", child_views_sought: false }),
    ];
    const m = computeTransitionMetrics(plans, []);
    expect(m.child_views_sought_rate).toBe(50);
  });
});

// ── identifyTransitionAlerts ─────────────────────────────────────────────

describe("identifyTransitionAlerts", () => {
  const now = new Date("2025-05-15");

  it("returns empty for no plans", () => {
    expect(identifyTransitionAlerts([], [], now)).toEqual([]);
  });

  it("triggers critical alert for emergency discharge without child views", () => {
    const plans = [
      makePlan({ transition_type: "emergency_discharge", child_views_sought: false }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.some((a) => a.type === "emergency_no_child_views" && a.severity === "critical")).toBe(true);
  });

  it("triggers high alert for planned transition within 30 days without readiness assessment", () => {
    const plans = [
      makePlan({
        status: "planned",
        planned_date: "2025-05-25",
        readiness_assessment: [],
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.some((a) => a.type === "no_readiness_assessment" && a.severity === "high")).toBe(true);
  });

  it("triggers high alert for overdue planned transition", () => {
    const plans = [
      makePlan({ status: "planned", planned_date: "2025-04-01" }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.some((a) => a.type === "transition_overdue" && a.severity === "high")).toBe(true);
  });

  it("triggers high alert for social worker not notified on in-progress transition", () => {
    const plans = [
      makePlan({ status: "in_progress", social_worker_notified: false }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.some((a) => a.type === "social_worker_not_notified" && a.severity === "high")).toBe(true);
  });

  it("triggers high alert for Ofsted not notified on completed transition", () => {
    const plans = [
      makePlan({ status: "completed", actual_date: "2025-04-01", ofsted_notified: false }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.some((a) => a.type === "ofsted_not_notified" && a.severity === "high")).toBe(true);
  });

  it("triggers high alert for completed transition without handover", () => {
    const plans = [
      makePlan({ status: "completed", actual_date: "2025-04-01", handover_completed: false }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.some((a) => a.type === "no_handover" && a.severity === "high")).toBe(true);
  });

  it("triggers medium alert for overdue follow-up", () => {
    const plans = [
      makePlan({
        status: "completed",
        actual_date: "2025-04-01",
        follow_up_date: "2025-04-15",
        follow_up_completed: false,
        handover_completed: true,
        ofsted_notified: true,
      }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.some((a) => a.type === "follow_up_overdue" && a.severity === "medium")).toBe(true);
  });

  it("triggers medium alert for child views not sought on planned transition", () => {
    const plans = [
      makePlan({ status: "planned", child_views_sought: false }),
    ];
    const alerts = identifyTransitionAlerts(plans, [], now);
    expect(alerts.some((a) => a.type === "child_views_not_sought" && a.severity === "medium")).toBe(true);
  });
});
