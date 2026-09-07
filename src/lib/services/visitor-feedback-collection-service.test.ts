import { describe, it, expect } from "vitest";
import {
  computeVisitorFeedbackMetrics,
  identifyVisitorFeedbackAlerts,
  type VisitorFeedbackCollectionRecord,
} from "./visitor-feedback-collection-service";

// ── Factory ────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<VisitorFeedbackCollectionRecord> = {}): VisitorFeedbackCollectionRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    visitor_type: "parent",
    feedback_rating: "good",
    visit_purpose: "family_contact",
    satisfaction_level: "satisfied",
    visit_date: "2025-01-15",
    visitor_name: "Visitor A",
    collected_by: "Staff A",
    feedback_sought_proactively: true,
    child_views_included: true,
    environment_commented: true,
    staff_interaction_positive: true,
    concerns_raised: false,
    complaints_linked: false,
    action_plan_created: true,
    feedback_shared_with_team: true,
    improvement_identified: true,
    follow_up_arranged: true,
    anonymity_offered: true,
    manager_reviewed: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: overrides.next_review_date ?? null,
    notes: overrides.notes ?? null,
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-01-15T00:00:00Z",
      ...overrides,
  };
}

// ── computeVisitorFeedbackMetrics ──────────────────────────────────────

describe("computeVisitorFeedbackMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeVisitorFeedbackMetrics([]);
    expect(m.total_feedback).toBe(0);
    expect(m.poor_rating_count).toBe(0);
    expect(m.very_poor_rating_count).toBe(0);
    expect(m.dissatisfied_count).toBe(0);
    expect(m.concerns_raised_count).toBe(0);
    expect(m.feedback_sought_rate).toBeNull();;
    expect(m.child_views_rate).toBeNull();;
    expect(m.action_plan_rate).toBeNull();;
  });

  it("counts poor and very poor ratings", () => {
    const records = [
      makeRecord({ feedback_rating: "poor" }),
      makeRecord({ feedback_rating: "very_poor" }),
      makeRecord({ feedback_rating: "very_poor" }),
      makeRecord({ feedback_rating: "good" }),
    ];
    const m = computeVisitorFeedbackMetrics(records);
    expect(m.poor_rating_count).toBe(1);
    expect(m.very_poor_rating_count).toBe(2);
  });

  it("counts dissatisfied from both levels", () => {
    const records = [
      makeRecord({ satisfaction_level: "dissatisfied" }),
      makeRecord({ satisfaction_level: "very_dissatisfied" }),
      makeRecord({ satisfaction_level: "satisfied" }),
    ];
    const m = computeVisitorFeedbackMetrics(records);
    expect(m.dissatisfied_count).toBe(2);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ feedback_sought_proactively: true, child_views_included: true, manager_reviewed: true }),
      makeRecord({ feedback_sought_proactively: false, child_views_included: false, manager_reviewed: false }),
    ];
    const m = computeVisitorFeedbackMetrics(records);
    expect(m.feedback_sought_rate).toBe(50);
    expect(m.child_views_rate).toBe(50);
    expect(m.manager_reviewed_rate).toBe(50);
  });

  it("computes breakdown maps", () => {
    const records = [
      makeRecord({ visitor_type: "social_worker", feedback_rating: "excellent", visit_purpose: "inspection", satisfaction_level: "very_satisfied" }),
      makeRecord({ visitor_type: "social_worker" }),
    ];
    const m = computeVisitorFeedbackMetrics(records);
    expect(m.by_visitor_type["social_worker"]).toBe(2);
    expect(m.by_feedback_rating["excellent"]).toBe(1);
    expect(m.by_visit_purpose["inspection"]).toBe(1);
    expect(m.by_satisfaction_level["very_satisfied"]).toBe(1);
  });
});

// ── identifyVisitorFeedbackAlerts ──────────────────────────────────────

describe("identifyVisitorFeedbackAlerts", () => {
  it("returns empty array for empty input", () => {
    expect(identifyVisitorFeedbackAlerts([])).toEqual([]);
  });

  it("fires critical alert for very poor feedback with concerns raised", () => {
    const records = [
      makeRecord({ feedback_rating: "very_poor", concerns_raised: true, visitor_name: "Inspector X" }),
    ];
    const alerts = identifyVisitorFeedbackAlerts(records);
    const match = alerts.find((a) => a.type === "very_poor_with_concerns");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert when improvement not identified (>= 1)", () => {
    const records = [makeRecord({ improvement_identified: false })];
    const alerts = identifyVisitorFeedbackAlerts(records);
    const match = alerts.find((a) => a.type === "no_improvement_identified");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert when feedback not shared with team (>= 1)", () => {
    const records = [makeRecord({ feedback_shared_with_team: false })];
    const alerts = identifyVisitorFeedbackAlerts(records);
    const match = alerts.find((a) => a.type === "feedback_not_shared");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert when follow-up not arranged (>= 2)", () => {
    const records = [
      makeRecord({ follow_up_arranged: false }),
      makeRecord({ follow_up_arranged: false }),
    ];
    const alerts = identifyVisitorFeedbackAlerts(records);
    const match = alerts.find((a) => a.type === "no_follow_up");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("does NOT fire no_follow_up for only 1 record without follow-up", () => {
    const records = [makeRecord({ follow_up_arranged: false })];
    const alerts = identifyVisitorFeedbackAlerts(records);
    expect(alerts.find((a) => a.type === "no_follow_up")).toBeUndefined();
  });

  it("fires medium alert when manager not reviewed (>= 2)", () => {
    const records = [
      makeRecord({ manager_reviewed: false }),
      makeRecord({ manager_reviewed: false }),
    ];
    const alerts = identifyVisitorFeedbackAlerts(records);
    const match = alerts.find((a) => a.type === "manager_not_reviewed");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});
