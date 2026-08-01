import { describe, it, expect } from "vitest";
import {
  computeChildOutcomes,
  computeHomeOutcomes,
  identifyOutcomeAlerts,
} from "./outcomes-service";
import type { OutcomeTarget, OutcomeReview } from "./outcomes-service";

// -- Factory Functions --------------------------------------------------------

function makeTarget(overrides: Partial<OutcomeTarget> = {}): OutcomeTarget {
  return {
    id: "t-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex",
    domain: "be_healthy",
    target_description: "Improve physical activity",
    baseline_rating: "no_change",
    current_rating: "some_progress",
    target_rating: "good_progress",
    set_date: "2026-01-01",
    review_date: "2026-06-01",
    reviewed_by: null,
    status: "active",
    evidence: null,
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeReview(overrides: Partial<OutcomeReview> = {}): OutcomeReview {
  return {
    id: "r-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex",
    review_date: "2026-04-01",
    reviewer: "Staff A",
    domain_ratings: [{ domain: "be_healthy", rating: "some_progress", notes: "Good" }],
    overall_progress: "some_progress",
    key_achievements: ["Joined gym"],
    areas_of_concern: [],
    actions: ["Continue"],
    next_review_date: "2026-07-01",
    created_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeChildOutcomes -----------------------------------------------------

describe("computeChildOutcomes", () => {
  it("returns zeroes for empty arrays", () => {
    const result = computeChildOutcomes([], [], "child-1");
    expect(result.active_targets).toBe(0);
    expect(result.achieved_targets).toBe(0);
    expect(result.overall_progress).toBeNull();; expect(result.improving_count).toBe(0);
    expect(result.declining_count).toBe(0);
    expect(result.latest_review_date).toBeNull();
  });

  it("counts active and achieved targets for specific child", () => {
    const targets = [
      makeTarget({ id: "t1", child_id: "child-1", status: "active" }),
      makeTarget({ id: "t2", child_id: "child-1", status: "achieved" }),
      makeTarget({ id: "t3", child_id: "child-1", status: "active" }),
      makeTarget({ id: "t4", child_id: "child-2", status: "active" }),
    ];
    const result = computeChildOutcomes(targets, [], "child-1");
    expect(result.active_targets).toBe(2);
    expect(result.achieved_targets).toBe(1);
  });

  it("calculates overall progress percentage", () => {
    // current_rating >= target_rating counts as "met"
    // "good_progress" (idx 3) >= "some_progress" (idx 2) => met
    // "no_change" (idx 1) >= "good_progress" (idx 3) => not met
    const targets = [
      makeTarget({ id: "t1", current_rating: "good_progress", target_rating: "some_progress", status: "active" }),
      makeTarget({ id: "t2", current_rating: "no_change", target_rating: "good_progress", status: "active" }),
    ];
    const result = computeChildOutcomes(targets, [], "child-1");
    expect(result.overall_progress).toBe(50); // 1 of 2 met
  });

  it("counts improving (current > baseline) and declining (current < baseline)", () => {
    const targets = [
      makeTarget({ id: "t1", baseline_rating: "no_change", current_rating: "good_progress", status: "active" }),
      makeTarget({ id: "t2", baseline_rating: "some_progress", current_rating: "no_change", status: "active" }),
      makeTarget({ id: "t3", baseline_rating: "some_progress", current_rating: "some_progress", status: "active" }),
    ];
    const result = computeChildOutcomes(targets, [], "child-1");
    expect(result.improving_count).toBe(1);
    expect(result.declining_count).toBe(1);
  });

  it("returns latest review date sorted correctly", () => {
    const reviews = [
      makeReview({ id: "r1", child_id: "child-1", review_date: "2026-02-01" }),
      makeReview({ id: "r2", child_id: "child-1", review_date: "2026-05-15" }),
      makeReview({ id: "r3", child_id: "child-1", review_date: "2026-03-10" }),
    ];
    const result = computeChildOutcomes([], reviews, "child-1");
    expect(result.latest_review_date).toBe("2026-05-15");
  });

  it("computes by_domain breakdown with avg_rating_numeric", () => {
    // "some_progress" = idx 2, "good_progress" = idx 3 => avg = 2.5
    const targets = [
      makeTarget({ id: "t1", domain: "be_healthy", current_rating: "some_progress", status: "active" }),
      makeTarget({ id: "t2", domain: "be_healthy", current_rating: "good_progress", status: "active" }),
      makeTarget({ id: "t3", domain: "be_healthy", status: "achieved" }),
    ];
    const result = computeChildOutcomes(targets, [], "child-1");
    expect(result.by_domain.be_healthy.targets).toBe(3);
    expect(result.by_domain.be_healthy.achieved).toBe(1);
    expect(result.by_domain.be_healthy.avg_rating_numeric).toBe(2.5);
  });
});

// -- computeHomeOutcomes ------------------------------------------------------

describe("computeHomeOutcomes", () => {
  it("returns zeroes for empty arrays", () => {
    const result = computeHomeOutcomes([], []);
    expect(result.total_children).toBe(0);
    expect(result.total_active_targets).toBe(0);
    expect(result.total_achieved).toBe(0);
    expect(result.overall_achievement_rate).toBeNull();; expect(result.children_improving).toBe(0);
    expect(result.children_stable).toBe(0);
    expect(result.children_declining).toBe(0);
  });

  it("counts total children, active, and achieved targets", () => {
    const targets = [
      makeTarget({ id: "t1", child_id: "child-1", status: "active" }),
      makeTarget({ id: "t2", child_id: "child-1", status: "achieved" }),
      makeTarget({ id: "t3", child_id: "child-2", status: "active" }),
    ];
    const result = computeHomeOutcomes(targets, []);
    expect(result.total_children).toBe(2);
    expect(result.total_active_targets).toBe(2);
    expect(result.total_achieved).toBe(1);
  });

  it("classifies children as improving, stable, or declining", () => {
    const targets = [
      // child-1: improving (current > baseline)
      makeTarget({ id: "t1", child_id: "child-1", child_name: "Alex", baseline_rating: "no_change", current_rating: "good_progress", status: "active" }),
      // child-2: declining (current < baseline)
      makeTarget({ id: "t2", child_id: "child-2", child_name: "Beth", baseline_rating: "good_progress", current_rating: "no_change", status: "active" }),
      // child-3: stable (current == baseline)
      makeTarget({ id: "t3", child_id: "child-3", child_name: "Charlie", baseline_rating: "some_progress", current_rating: "some_progress", status: "active" }),
    ];
    const result = computeHomeOutcomes(targets, []);
    expect(result.children_improving).toBe(1);
    expect(result.children_declining).toBe(1);
    expect(result.children_stable).toBe(1);
  });

  it("calculates overall achievement rate", () => {
    const targets = [
      makeTarget({ id: "t1", status: "achieved" }),
      makeTarget({ id: "t2", status: "achieved" }),
      makeTarget({ id: "t3", status: "active" }),
    ];
    // achieved / (active + achieved) = 2 / 3 = 67%
    const result = computeHomeOutcomes(targets, []);
    expect(result.overall_achievement_rate).toBe(67);
  });
});

// -- identifyOutcomeAlerts ----------------------------------------------------

describe("identifyOutcomeAlerts", () => {
  it("returns empty array when no data", () => {
    const alerts = identifyOutcomeAlerts([], []);
    expect(alerts).toEqual([]);
  });

  it("flags declining_outcomes when current < baseline for active target", () => {
    const targets = [
      makeTarget({ id: "t1", child_id: "child-1", child_name: "Alex", baseline_rating: "good_progress", current_rating: "no_change", status: "active" }),
    ];
    const alerts = identifyOutcomeAlerts(targets, []);
    const declining = alerts.filter((a) => a.type === "declining_outcomes");
    expect(declining.length).toBe(1);
    expect(declining[0].severity).toBe("high");
    expect(declining[0].child_name).toBe("Alex");
  });

  it("flags overdue_review when review_date in the past", () => {
    const targets = [
      makeTarget({ id: "t1", review_date: "2020-01-01", status: "active" }),
    ];
    const alerts = identifyOutcomeAlerts(targets, []);
    const overdue = alerts.filter((a) => a.type === "overdue_review");
    expect(overdue.length).toBe(1);
    expect(overdue[0].severity).toBe("medium");
  });

  it("flags no_targets when child has reviews but no active targets", () => {
    const reviews = [
      makeReview({ id: "r1", child_id: "orphan-child", child_name: "Orphan" }),
    ];
    const alerts = identifyOutcomeAlerts([], reviews);
    const noTargets = alerts.filter((a) => a.type === "no_targets");
    expect(noTargets.length).toBe(1);
    expect(noTargets[0].child_name).toBe("Orphan");
  });

  it("flags low_achievement when a domain has 0% achievement", () => {
    // All active targets in "be_healthy", none meeting target
    const targets = [
      makeTarget({ id: "t1", domain: "be_healthy", current_rating: "no_change", target_rating: "achieved", status: "active" }),
      makeTarget({ id: "t2", domain: "be_healthy", current_rating: "declining", target_rating: "good_progress", status: "active" }),
    ];
    const alerts = identifyOutcomeAlerts(targets, []);
    const low = alerts.filter((a) => a.type === "low_achievement");
    expect(low.length).toBe(1);
    expect(low[0].severity).toBe("medium");
  });

  it("flags stale_review when latest review is over 90 days old", () => {
    const targets = [
      makeTarget({ id: "t1", child_id: "child-1", status: "active" }),
    ];
    const reviews = [
      makeReview({ id: "r1", child_id: "child-1", review_date: "2020-01-01" }),
    ];
    const alerts = identifyOutcomeAlerts(targets, reviews);
    const stale = alerts.filter((a) => a.type === "stale_review");
    expect(stale.length).toBe(1);
    expect(stale[0].severity).toBe("low");
  });
});
