// ══════════════════════════════════════════════════════════════════════════════
// CARA — OUTCOMES TRACKING SERVICE TESTS
// Pure-function unit tests for child outcome computation, home-level outcome
// aggregation, outcome alert identification, and constant validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../outcomes-service";
import {
  OUTCOME_DOMAINS,
  PROGRESS_RATINGS,
  REVIEW_FREQUENCY,
} from "../outcomes-service";
import type { OutcomeTarget, OutcomeReview } from "../outcomes-service";

const {
  computeChildOutcomes,
  computeHomeOutcomes,
  identifyOutcomeAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeOutcomeTarget(
  overrides: Partial<OutcomeTarget> = {},
): OutcomeTarget {
  return {
    id: "key" in overrides ? overrides.id! : "ot-1",
    home_id: "key" in overrides ? overrides.home_id! : "home-1",
    child_id: "child_id" in overrides ? overrides.child_id! : "child-1",
    child_name: "child_name" in overrides ? overrides.child_name! : "Alice",
    domain: "domain" in overrides ? overrides.domain! : "be_healthy",
    target_description:
      "target_description" in overrides
        ? overrides.target_description!
        : "Improve fitness",
    baseline_rating:
      "baseline_rating" in overrides
        ? overrides.baseline_rating!
        : "no_change",
    current_rating:
      "current_rating" in overrides
        ? overrides.current_rating!
        : "some_progress",
    target_rating:
      "target_rating" in overrides
        ? overrides.target_rating!
        : "good_progress",
    set_date: "set_date" in overrides ? overrides.set_date! : "2026-01-01",
    review_date:
      "review_date" in overrides ? overrides.review_date! : "2027-06-01",
    reviewed_by:
      "reviewed_by" in overrides ? overrides.reviewed_by! : null,
    status: "status" in overrides ? overrides.status! : "active",
    evidence: "evidence" in overrides ? overrides.evidence! : null,
    notes: "notes" in overrides ? overrides.notes! : null,
    created_at:
      "created_at" in overrides ? overrides.created_at! : "2026-01-01T00:00:00Z",
    updated_at:
      "updated_at" in overrides ? overrides.updated_at! : "2026-01-01T00:00:00Z",
  };
}

function makeOutcomeReview(
  overrides: Partial<OutcomeReview> = {},
): OutcomeReview {
  return {
    id: "id" in overrides ? overrides.id! : "or-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    child_id: "child_id" in overrides ? overrides.child_id! : "child-1",
    child_name:
      "child_name" in overrides ? overrides.child_name! : "Alice",
    review_date:
      "review_date" in overrides ? overrides.review_date! : "2026-03-01",
    reviewer: "reviewer" in overrides ? overrides.reviewer! : "Staff A",
    domain_ratings:
      "domain_ratings" in overrides
        ? overrides.domain_ratings!
        : [{ domain: "be_healthy", rating: "some_progress", notes: "" }],
    overall_progress:
      "overall_progress" in overrides
        ? overrides.overall_progress!
        : "some_progress",
    key_achievements:
      "key_achievements" in overrides
        ? overrides.key_achievements!
        : ["Joined gym"],
    areas_of_concern:
      "areas_of_concern" in overrides
        ? overrides.areas_of_concern!
        : [],
    actions: "actions" in overrides ? overrides.actions! : [],
    next_review_date:
      "next_review_date" in overrides
        ? overrides.next_review_date!
        : "2026-06-01",
    created_at:
      "created_at" in overrides
        ? overrides.created_at!
        : "2026-03-01T00:00:00Z",
  };
}

// ── Constants ──────────────────────────────────────────────────────────────

describe("OUTCOME_DOMAINS", () => {
  it("contains exactly 5 domains", () => {
    expect(OUTCOME_DOMAINS).toHaveLength(5);
  });

  it("each domain has domain, label, description, and regulation keys", () => {
    for (const d of OUTCOME_DOMAINS) {
      expect(d).toHaveProperty("domain");
      expect(d).toHaveProperty("label");
      expect(d).toHaveProperty("description");
      expect(d).toHaveProperty("regulation");
    }
  });

  it("includes be_healthy and economic_wellbeing domains", () => {
    const domainKeys = OUTCOME_DOMAINS.map((d) => d.domain);
    expect(domainKeys).toContain("be_healthy");
    expect(domainKeys).toContain("economic_wellbeing");
  });

  it("has non-empty strings for all fields", () => {
    for (const d of OUTCOME_DOMAINS) {
      expect(d.domain.length).toBeGreaterThan(0);
      expect(d.label.length).toBeGreaterThan(0);
      expect(d.description.length).toBeGreaterThan(0);
      expect(d.regulation.length).toBeGreaterThan(0);
    }
  });
});

describe("PROGRESS_RATINGS", () => {
  it("contains exactly 5 ratings", () => {
    expect(PROGRESS_RATINGS).toHaveLength(5);
  });

  it("starts with declining and ends with achieved", () => {
    expect(PROGRESS_RATINGS[0]).toBe("declining");
    expect(PROGRESS_RATINGS[4]).toBe("achieved");
  });

  it("includes some_progress and good_progress", () => {
    expect(PROGRESS_RATINGS).toContain("some_progress");
    expect(PROGRESS_RATINGS).toContain("good_progress");
  });
});

describe("REVIEW_FREQUENCY", () => {
  it("contains exactly 4 frequencies", () => {
    expect(REVIEW_FREQUENCY).toHaveLength(4);
  });

  it("includes monthly and annual", () => {
    expect(REVIEW_FREQUENCY).toContain("monthly");
    expect(REVIEW_FREQUENCY).toContain("annual");
  });

  it("all entries are non-empty strings", () => {
    for (const f of REVIEW_FREQUENCY) {
      expect(typeof f).toBe("string");
      expect(f.length).toBeGreaterThan(0);
    }
  });
});

// ── computeChildOutcomes ───────────────────────────────────────────────────

describe("computeChildOutcomes", () => {
  it("returns zeroed results for empty arrays", () => {
    const result = computeChildOutcomes([], [], "child-1");
    expect(result.active_targets).toBe(0);
    expect(result.achieved_targets).toBe(0);
    expect(result.overall_progress).toBeNull();; expect(result.improving_count).toBe(0);
    expect(result.declining_count).toBe(0);
    expect(result.latest_review_date).toBeNull();
  });

  it("counts active and achieved targets correctly", () => {
    const targets = [
      makeOutcomeTarget({ id: "t1", status: "active" }),
      makeOutcomeTarget({ id: "t2", status: "achieved" }),
      makeOutcomeTarget({ id: "t3", status: "active" }),
      makeOutcomeTarget({ id: "t4", status: "discontinued" }),
    ];
    const result = computeChildOutcomes(targets, [], "child-1");
    expect(result.active_targets).toBe(2);
    expect(result.achieved_targets).toBe(1);
  });

  it("filters targets by childId", () => {
    const targets = [
      makeOutcomeTarget({ id: "t1", child_id: "child-1", status: "active" }),
      makeOutcomeTarget({ id: "t2", child_id: "child-2", status: "active" }),
    ];
    const result = computeChildOutcomes(targets, [], "child-1");
    expect(result.active_targets).toBe(1);
  });

  it("computes overall_progress as percentage of active targets meeting target", () => {
    const targets = [
      // current=good_progress(3), target=good_progress(3) → met
      makeOutcomeTarget({ id: "t1", current_rating: "good_progress", target_rating: "good_progress" }),
      // current=some_progress(2), target=good_progress(3) → not met
      makeOutcomeTarget({ id: "t2", current_rating: "some_progress", target_rating: "good_progress" }),
      // current=achieved(4), target=some_progress(2) → met
      makeOutcomeTarget({ id: "t3", current_rating: "achieved", target_rating: "some_progress" }),
      // current=declining(0), target=good_progress(3) → not met
      makeOutcomeTarget({ id: "t4", current_rating: "declining", target_rating: "good_progress" }),
    ];
    // 2 out of 4 met → 50%
    const result = computeChildOutcomes(targets, [], "child-1");
    expect(result.overall_progress).toBe(50);
  });

  it("returns 0 overall_progress when no active targets exist", () => {
    const targets = [
      makeOutcomeTarget({ id: "t1", status: "achieved" }),
    ];
    const result = computeChildOutcomes(targets, [], "child-1");
    expect(result.overall_progress).toBeNull();; });

  it("counts improving when current_rating > baseline_rating", () => {
    const targets = [
      // baseline=no_change(1), current=good_progress(3) → improving
      makeOutcomeTarget({ id: "t1", baseline_rating: "no_change", current_rating: "good_progress" }),
      // baseline=some_progress(2), current=some_progress(2) → stable
      makeOutcomeTarget({ id: "t2", baseline_rating: "some_progress", current_rating: "some_progress" }),
    ];
    const result = computeChildOutcomes(targets, [], "child-1");
    expect(result.improving_count).toBe(1);
    expect(result.declining_count).toBe(0);
  });

  it("counts declining when current_rating < baseline_rating", () => {
    const targets = [
      // baseline=good_progress(3), current=declining(0) → declining
      makeOutcomeTarget({ id: "t1", baseline_rating: "good_progress", current_rating: "declining" }),
    ];
    const result = computeChildOutcomes(targets, [], "child-1");
    expect(result.declining_count).toBe(1);
    expect(result.improving_count).toBe(0);
  });

  it("computes by_domain averages for active targets in each domain", () => {
    const targets = [
      makeOutcomeTarget({ id: "t1", domain: "be_healthy", current_rating: "good_progress", status: "active" }),
      makeOutcomeTarget({ id: "t2", domain: "be_healthy", current_rating: "some_progress", status: "active" }),
      makeOutcomeTarget({ id: "t3", domain: "be_healthy", current_rating: "declining", status: "achieved" }),
    ];
    const result = computeChildOutcomes(targets, [], "child-1");
    // Active: good_progress(3) + some_progress(2) = 5 / 2 = 2.5
    expect(result.by_domain.be_healthy.targets).toBe(3);
    expect(result.by_domain.be_healthy.achieved).toBe(1);
    expect(result.by_domain.be_healthy.avg_rating_numeric).toBe(2.5);
  });

  it("returns 0 avg_rating_numeric for domains with no active targets", () => {
    const targets = [
      makeOutcomeTarget({ id: "t1", domain: "stay_safe", status: "achieved" }),
    ];
    const result = computeChildOutcomes(targets, [], "child-1");
    expect(result.by_domain.stay_safe.avg_rating_numeric).toBe(0);
  });

  it("returns the latest review date from reviews", () => {
    const reviews = [
      makeOutcomeReview({ id: "r1", review_date: "2026-02-01" }),
      makeOutcomeReview({ id: "r2", review_date: "2026-04-15" }),
      makeOutcomeReview({ id: "r3", review_date: "2026-01-10" }),
    ];
    const result = computeChildOutcomes([], reviews, "child-1");
    expect(result.latest_review_date).toBe("2026-04-15");
  });

  it("returns null latest_review_date when no reviews exist for the child", () => {
    const reviews = [
      makeOutcomeReview({ id: "r1", child_id: "child-2", review_date: "2026-04-01" }),
    ];
    const result = computeChildOutcomes([], reviews, "child-1");
    expect(result.latest_review_date).toBeNull();
  });

  it("treats unknown rating strings as index 0 (declining equivalent)", () => {
    const targets = [
      makeOutcomeTarget({
        id: "t1",
        baseline_rating: "unknown_rating",
        current_rating: "some_progress",
      }),
    ];
    const result = computeChildOutcomes(targets, [], "child-1");
    // unknown → 0, some_progress → 2, so improving
    expect(result.improving_count).toBe(1);
  });

  it("populates all five domains in by_domain even with no targets", () => {
    const result = computeChildOutcomes([], [], "child-1");
    expect(Object.keys(result.by_domain)).toHaveLength(5);
    for (const d of OUTCOME_DOMAINS) {
      expect(result.by_domain[d.domain]).toEqual({
        targets: 0,
        achieved: 0,
        avg_rating_numeric: 0,
      });
    }
  });
});

// ── computeHomeOutcomes ────────────────────────────────────────────────────

describe("computeHomeOutcomes", () => {
  it("returns zeroed results for empty arrays", () => {
    const result = computeHomeOutcomes([], []);
    expect(result.total_children).toBe(0);
    expect(result.total_active_targets).toBe(0);
    expect(result.total_achieved).toBe(0);
    expect(result.overall_achievement_rate).toBeNull();; expect(result.children_improving).toBe(0);
    expect(result.children_stable).toBe(0);
    expect(result.children_declining).toBe(0);
  });

  it("counts unique children from targets", () => {
    const targets = [
      makeOutcomeTarget({ id: "t1", child_id: "child-1" }),
      makeOutcomeTarget({ id: "t2", child_id: "child-1" }),
      makeOutcomeTarget({ id: "t3", child_id: "child-2" }),
    ];
    const result = computeHomeOutcomes(targets, []);
    expect(result.total_children).toBe(2);
  });

  it("counts active and achieved targets across all children", () => {
    const targets = [
      makeOutcomeTarget({ id: "t1", child_id: "child-1", status: "active" }),
      makeOutcomeTarget({ id: "t2", child_id: "child-1", status: "achieved" }),
      makeOutcomeTarget({ id: "t3", child_id: "child-2", status: "active" }),
      makeOutcomeTarget({ id: "t4", child_id: "child-2", status: "revised" }),
    ];
    const result = computeHomeOutcomes(targets, []);
    expect(result.total_active_targets).toBe(2);
    expect(result.total_achieved).toBe(1);
  });

  it("calculates overall_achievement_rate from achieved / (active + achieved)", () => {
    const targets = [
      makeOutcomeTarget({ id: "t1", status: "active" }),
      makeOutcomeTarget({ id: "t2", status: "achieved" }),
      makeOutcomeTarget({ id: "t3", status: "achieved" }),
      makeOutcomeTarget({ id: "t4", status: "revised" }), // excluded from denominator
    ];
    // achieved=2 / (active=1 + achieved=2) = 2/3 ≈ 67%
    const result = computeHomeOutcomes(targets, []);
    expect(result.overall_achievement_rate).toBe(67);
  });

  it("returns 0 achievement rate when no active or achieved targets", () => {
    const targets = [
      makeOutcomeTarget({ id: "t1", status: "revised" }),
      makeOutcomeTarget({ id: "t2", status: "discontinued" }),
    ];
    const result = computeHomeOutcomes(targets, []);
    expect(result.overall_achievement_rate).toBeNull();; });

  it("classifies children as improving when improving_count > declining_count", () => {
    const targets = [
      // child-1: baseline=declining(0), current=good_progress(3) → improving
      makeOutcomeTarget({
        id: "t1",
        child_id: "child-1",
        baseline_rating: "declining",
        current_rating: "good_progress",
      }),
    ];
    const result = computeHomeOutcomes(targets, []);
    expect(result.children_improving).toBe(1);
    expect(result.children_stable).toBe(0);
    expect(result.children_declining).toBe(0);
  });

  it("classifies children as declining when declining_count > improving_count", () => {
    const targets = [
      // child-1: baseline=good_progress(3), current=declining(0) → declining
      makeOutcomeTarget({
        id: "t1",
        child_id: "child-1",
        baseline_rating: "good_progress",
        current_rating: "declining",
      }),
    ];
    const result = computeHomeOutcomes(targets, []);
    expect(result.children_declining).toBe(1);
    expect(result.children_improving).toBe(0);
  });

  it("classifies children as stable when improving == declining", () => {
    const targets = [
      // baseline=no_change(1), current=some_progress(2) → improving
      makeOutcomeTarget({
        id: "t1",
        child_id: "child-1",
        baseline_rating: "no_change",
        current_rating: "some_progress",
      }),
      // baseline=good_progress(3), current=no_change(1) → declining
      makeOutcomeTarget({
        id: "t2",
        child_id: "child-1",
        baseline_rating: "good_progress",
        current_rating: "no_change",
      }),
    ];
    const result = computeHomeOutcomes(targets, []);
    expect(result.children_stable).toBe(1);
  });

  it("computes by_domain avg_progress across active targets per domain", () => {
    const targets = [
      // stay_safe domain: current=good_progress(3), target=good_progress(3) → met
      makeOutcomeTarget({
        id: "t1",
        domain: "stay_safe",
        current_rating: "good_progress",
        target_rating: "good_progress",
      }),
      // stay_safe domain: current=no_change(1), target=good_progress(3) → not met
      makeOutcomeTarget({
        id: "t2",
        domain: "stay_safe",
        current_rating: "no_change",
        target_rating: "good_progress",
      }),
    ];
    const result = computeHomeOutcomes(targets, []);
    // 1 met out of 2 → 50%
    expect(result.by_domain.stay_safe.avg_progress).toBe(50);
    expect(result.by_domain.stay_safe.total_targets).toBe(2);
  });

  it("returns 0 avg_progress for domains with no active targets", () => {
    const targets = [
      makeOutcomeTarget({ id: "t1", domain: "be_healthy", status: "achieved" }),
    ];
    const result = computeHomeOutcomes(targets, []);
    expect(result.by_domain.be_healthy.avg_progress).toBeNull();; expect(result.by_domain.be_healthy.total_targets).toBe(0);
  });

  it("populates all five domains in by_domain", () => {
    const result = computeHomeOutcomes([], []);
    expect(Object.keys(result.by_domain)).toHaveLength(5);
    for (const d of OUTCOME_DOMAINS) {
      expect(result.by_domain[d.domain]).toBeDefined();
    }
  });

  it("handles multiple children with mixed statuses", () => {
    const targets = [
      // child-1: improving
      makeOutcomeTarget({ id: "t1", child_id: "child-1", child_name: "Alice", baseline_rating: "declining", current_rating: "good_progress" }),
      // child-2: declining
      makeOutcomeTarget({ id: "t2", child_id: "child-2", child_name: "Bob", baseline_rating: "achieved", current_rating: "declining" }),
      // child-3: stable (no change)
      makeOutcomeTarget({ id: "t3", child_id: "child-3", child_name: "Charlie", baseline_rating: "some_progress", current_rating: "some_progress" }),
    ];
    const result = computeHomeOutcomes(targets, []);
    expect(result.total_children).toBe(3);
    expect(result.children_improving).toBe(1);
    expect(result.children_declining).toBe(1);
    expect(result.children_stable).toBe(1);
  });
});

// ── identifyOutcomeAlerts ──────────────────────────────────────────────────

describe("identifyOutcomeAlerts", () => {
  it("returns empty array when no targets or reviews", () => {
    const alerts = identifyOutcomeAlerts([], []);
    expect(alerts).toEqual([]);
  });

  it("generates declining_outcomes alert when current < baseline", () => {
    const targets = [
      makeOutcomeTarget({
        id: "t1",
        child_id: "child-1",
        child_name: "Alice",
        baseline_rating: "good_progress",
        current_rating: "declining",
      }),
    ];
    const alerts = identifyOutcomeAlerts(targets, []);
    const declining = alerts.filter((a) => a.type === "declining_outcomes");
    expect(declining).toHaveLength(1);
    expect(declining[0].severity).toBe("high");
    expect(declining[0].child_name).toBe("Alice");
    expect(declining[0].message).toContain("1 outcome declining");
  });

  it("uses plural 'outcomes' when multiple targets are declining for same child", () => {
    const targets = [
      makeOutcomeTarget({
        id: "t1",
        child_id: "child-1",
        child_name: "Alice",
        domain: "be_healthy",
        baseline_rating: "good_progress",
        current_rating: "no_change",
      }),
      makeOutcomeTarget({
        id: "t2",
        child_id: "child-1",
        child_name: "Alice",
        domain: "stay_safe",
        baseline_rating: "some_progress",
        current_rating: "declining",
      }),
    ];
    const alerts = identifyOutcomeAlerts(targets, []);
    const declining = alerts.filter((a) => a.type === "declining_outcomes");
    expect(declining).toHaveLength(1);
    expect(declining[0].message).toContain("2 outcomes declining");
  });

  it("does not generate declining_outcomes when current >= baseline", () => {
    const targets = [
      makeOutcomeTarget({
        id: "t1",
        baseline_rating: "no_change",
        current_rating: "good_progress",
      }),
    ];
    const alerts = identifyOutcomeAlerts(targets, []);
    const declining = alerts.filter((a) => a.type === "declining_outcomes");
    expect(declining).toHaveLength(0);
  });

  it("generates overdue_review alert when review_date is in the past", () => {
    const targets = [
      makeOutcomeTarget({
        id: "t1",
        child_name: "Alice",
        target_description: "Improve fitness",
        review_date: "2020-01-01", // far in the past
      }),
    ];
    const alerts = identifyOutcomeAlerts(targets, []);
    const overdue = alerts.filter((a) => a.type === "overdue_review");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].severity).toBe("medium");
    expect(overdue[0].message).toContain("Improve fitness");
    expect(overdue[0].message).toContain("2020-01-01");
  });

  it("does not generate overdue_review when review_date is in the future", () => {
    const targets = [
      makeOutcomeTarget({
        id: "t1",
        review_date: "2099-12-31", // far in the future
      }),
    ];
    const alerts = identifyOutcomeAlerts(targets, []);
    const overdue = alerts.filter((a) => a.type === "overdue_review");
    expect(overdue).toHaveLength(0);
  });

  it("generates no_targets alert when child has reviews but no active targets", () => {
    const targets = [
      makeOutcomeTarget({ id: "t1", child_id: "child-1", status: "achieved" }),
    ];
    const reviews = [
      makeOutcomeReview({ id: "r1", child_id: "child-2", child_name: "Bob" }),
    ];
    const alerts = identifyOutcomeAlerts(targets, reviews);
    const noTargets = alerts.filter((a) => a.type === "no_targets");
    expect(noTargets).toHaveLength(1);
    expect(noTargets[0].severity).toBe("medium");
    expect(noTargets[0].child_name).toBe("Bob");
    expect(noTargets[0].message).toContain("no active targets");
  });

  it("does not generate no_targets when child has active targets", () => {
    const targets = [
      makeOutcomeTarget({ id: "t1", child_id: "child-1", status: "active" }),
    ];
    const reviews = [
      makeOutcomeReview({ id: "r1", child_id: "child-1" }),
    ];
    const alerts = identifyOutcomeAlerts(targets, reviews);
    const noTargets = alerts.filter((a) => a.type === "no_targets");
    expect(noTargets).toHaveLength(0);
  });

  it("generates low_achievement alert when a domain has 0% achievement", () => {
    const targets = [
      // be_healthy domain: current=declining(0), target=good_progress(3) → not met
      makeOutcomeTarget({
        id: "t1",
        domain: "be_healthy",
        current_rating: "declining",
        target_rating: "good_progress",
      }),
      makeOutcomeTarget({
        id: "t2",
        domain: "be_healthy",
        current_rating: "no_change",
        target_rating: "achieved",
      }),
    ];
    const alerts = identifyOutcomeAlerts(targets, []);
    const low = alerts.filter((a) => a.type === "low_achievement");
    expect(low).toHaveLength(1);
    expect(low[0].severity).toBe("medium");
    expect(low[0].message).toContain("Be Healthy");
    expect(low[0].message).toContain("0% achievement");
  });

  it("does not generate low_achievement when domain has at least one target meeting its goal", () => {
    const targets = [
      makeOutcomeTarget({
        id: "t1",
        domain: "be_healthy",
        current_rating: "good_progress",
        target_rating: "some_progress",
      }),
    ];
    const alerts = identifyOutcomeAlerts(targets, []);
    const low = alerts.filter((a) => a.type === "low_achievement");
    expect(low).toHaveLength(0);
  });

  it("generates stale_review alert when latest review is older than 90 days", () => {
    const targets = [
      makeOutcomeTarget({ id: "t1", child_id: "child-1", child_name: "Alice" }),
    ];
    const reviews = [
      makeOutcomeReview({
        id: "r1",
        child_id: "child-1",
        child_name: "Alice",
        review_date: "2020-01-01", // far in the past, well over 90 days
      }),
    ];
    const alerts = identifyOutcomeAlerts(targets, reviews);
    const stale = alerts.filter((a) => a.type === "stale_review");
    expect(stale).toHaveLength(1);
    expect(stale[0].severity).toBe("low");
    expect(stale[0].child_name).toBe("Alice");
    expect(stale[0].message).toContain("over 90 days old");
  });

  it("does not generate stale_review when latest review is recent", () => {
    // Use a date far in the future so it will always be within 90 days of now
    const targets = [
      makeOutcomeTarget({ id: "t1", child_id: "child-1" }),
    ];
    const reviews = [
      makeOutcomeReview({
        id: "r1",
        child_id: "child-1",
        review_date: new Date().toISOString().slice(0, 10), // today
      }),
    ];
    const alerts = identifyOutcomeAlerts(targets, reviews);
    const stale = alerts.filter((a) => a.type === "stale_review");
    expect(stale).toHaveLength(0);
  });

  it("does not generate stale_review when child has no reviews", () => {
    const targets = [
      makeOutcomeTarget({ id: "t1", child_id: "child-1" }),
    ];
    const alerts = identifyOutcomeAlerts(targets, []);
    const stale = alerts.filter((a) => a.type === "stale_review");
    expect(stale).toHaveLength(0);
  });

  it("skips non-active targets for all alert types except no_targets", () => {
    const targets = [
      makeOutcomeTarget({
        id: "t1",
        status: "achieved",
        baseline_rating: "good_progress",
        current_rating: "declining",
        review_date: "2020-01-01",
        domain: "be_healthy",
      }),
    ];
    const alerts = identifyOutcomeAlerts(targets, []);
    const declining = alerts.filter((a) => a.type === "declining_outcomes");
    const overdue = alerts.filter((a) => a.type === "overdue_review");
    const lowAch = alerts.filter((a) => a.type === "low_achievement");
    expect(declining).toHaveLength(0);
    expect(overdue).toHaveLength(0);
    expect(lowAch).toHaveLength(0);
  });

  it("generates multiple alert types simultaneously", () => {
    const targets = [
      // declining outcome (current < baseline)
      makeOutcomeTarget({
        id: "t1",
        child_id: "child-1",
        child_name: "Alice",
        domain: "be_healthy",
        baseline_rating: "good_progress",
        current_rating: "declining",
        target_rating: "good_progress",
        review_date: "2020-01-01", // also overdue
      }),
    ];
    const reviews = [
      // child-2 has reviews but no active targets → no_targets
      makeOutcomeReview({ id: "r1", child_id: "child-2", child_name: "Bob" }),
      // child-1 has stale review
      makeOutcomeReview({
        id: "r2",
        child_id: "child-1",
        child_name: "Alice",
        review_date: "2020-01-01",
      }),
    ];
    const alerts = identifyOutcomeAlerts(targets, reviews);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("declining_outcomes");
    expect(types).toContain("overdue_review");
    expect(types).toContain("no_targets");
    expect(types).toContain("low_achievement");
    expect(types).toContain("stale_review");
  });
});
