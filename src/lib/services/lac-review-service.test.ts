import { describe, it, expect } from "vitest";
import {
  computeReviewMetrics,
  identifyReviewAlerts,
  type LacReview,
} from "./lac-review-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeReview(overrides: Partial<LacReview> = {}): LacReview {
  return {
    id: "lr-1",
    home_id: "home-1",
    child_name: "Alice",
    child_id: "child-1",
    review_type: "subsequent",
    review_date: "2026-05-01",
    next_review_due: null,
    status: "completed",
    iro_name: "IRO Smith",
    child_participation: "attended_spoke",
    child_views_recorded: true,
    parent_attended: true,
    social_worker_attended: true,
    key_worker_attended: true,
    outcome: "plan_endorsed",
    recommendations: ["Continue placement"],
    actions_agreed: ["Update care plan"],
    placement_stability_discussed: true,
    permanence_plan_reviewed: true,
    health_reviewed: true,
    education_reviewed: true,
    within_timescale: true,
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeReviewMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeReviewMetrics([], 4, NOW);
    expect(m.total_reviews).toBe(0);
    expect(m.completed_reviews).toBe(0);
    expect(m.overdue_reviews).toBe(0);
    expect(m.within_timescale_rate).toBeNull();;
    expect(m.child_participation_rate).toBeNull();;
    expect(m.review_coverage).toBe(0);
  });

  it("computes correct metrics for populated data", () => {
    const reviews = [
      makeReview({ id: "1", child_id: "c1", status: "completed", outcome: "plan_endorsed", within_timescale: true, health_reviewed: true, education_reviewed: true, placement_stability_discussed: true }),
      makeReview({ id: "2", child_id: "c2", status: "completed", outcome: "plan_amended", within_timescale: false, child_participation: "did_not_participate", child_views_recorded: false, parent_attended: false }),
      makeReview({ id: "3", child_id: "c3", status: "overdue", review_type: "initial" }),
      makeReview({ id: "4", child_id: "c1", status: "scheduled", review_date: "2026-06-15" }),
    ];
    const m = computeReviewMetrics(reviews, 4, NOW);
    expect(m.total_reviews).toBe(4);
    expect(m.completed_reviews).toBe(2);
    expect(m.overdue_reviews).toBe(1);
    expect(m.scheduled_reviews).toBe(1);
    // within_timescale: 1 out of 2 completed = 50%
    expect(m.within_timescale_rate).toBe(50);
    // participation: 1 attended_spoke out of 2 completed = 50%
    expect(m.child_participation_rate).toBe(50);
    expect(m.plan_endorsed_count).toBe(1);
    expect(m.plan_amended_count).toBe(1);
    // 2 unique children completed (c1, c2) out of 4 total
    expect(m.children_reviewed).toBe(2);
    expect(m.review_coverage).toBe(50);
    expect(m.by_type).toHaveProperty("subsequent");
    expect(m.by_status).toHaveProperty("completed", 2);
  });
});

describe("identifyReviewAlerts", () => {
  it("returns empty alerts for empty data", () => {
    expect(identifyReviewAlerts([], 4, NOW)).toEqual([]);
  });

  it("triggers review_overdue alert (critical)", () => {
    const reviews = [
      makeReview({ id: "a1", status: "overdue", review_date: "2026-04-01", child_name: "Alice", iro_name: "IRO Jones" }),
    ];
    const alerts = identifyReviewAlerts(reviews, 4, NOW);
    const found = alerts.find((a) => a.type === "review_overdue");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("triggers review_past_date for scheduled review past date (high)", () => {
    const reviews = [
      makeReview({ id: "a2", status: "scheduled", review_date: "2026-05-01", child_name: "Bob" }),
    ];
    const alerts = identifyReviewAlerts(reviews, 4, NOW);
    const found = alerts.find((a) => a.type === "review_past_date");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("triggers review_upcoming for scheduled review within 14 days (medium)", () => {
    const reviews = [
      makeReview({ id: "a3", status: "scheduled", review_date: "2026-05-28", child_name: "Charlie" }),
    ];
    const alerts = identifyReviewAlerts(reviews, 4, NOW);
    const found = alerts.find((a) => a.type === "review_upcoming");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("triggers no_child_participation for completed review with did_not_participate (high)", () => {
    const reviews = [
      makeReview({ id: "a4", status: "completed", child_participation: "did_not_participate", child_name: "Diana" }),
    ];
    const alerts = identifyReviewAlerts(reviews, 4, NOW);
    const found = alerts.find((a) => a.type === "no_child_participation");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("triggers escalation_required alert (critical)", () => {
    const reviews = [
      makeReview({ id: "a5", status: "completed", outcome: "escalation_required", child_name: "Eve", iro_name: "IRO Brown" }),
    ];
    const alerts = identifyReviewAlerts(reviews, 4, NOW);
    const found = alerts.find((a) => a.type === "escalation_required");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("does not trigger review_upcoming for scheduled review beyond 14 days", () => {
    const reviews = [
      makeReview({ id: "a6", status: "scheduled", review_date: "2026-06-15", child_name: "Frank" }),
    ];
    const alerts = identifyReviewAlerts(reviews, 4, NOW);
    const found = alerts.find((a) => a.type === "review_upcoming");
    expect(found).toBeUndefined();
  });
});
