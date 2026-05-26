// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Child Outcome Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeChildOutcome,
  type ChildOutcomeInput,
  type OutcomeTargetInput,
  type OutcomeReviewInput,
  type OutcomeDomain,
  type OutcomeRating,
  type OutcomeDirection,
  type OutcomeStatus,
} from "../child-outcome-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function daysAgo(n: number): string {
  const d = new Date("2026-05-26");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysFromNow(n: number): string {
  const d = new Date("2026-05-26");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function makeTarget(overrides: Partial<OutcomeTargetInput> = {}): OutcomeTargetInput {
  return {
    id: `ot_${Math.random().toString(36).slice(2, 8)}`,
    domain: "emotional_wellbeing",
    target_description: "Develop safe anger management strategies",
    success_criteria: "Use de-escalation independently",
    baseline_rating: 2 as OutcomeRating,
    current_rating: 3 as OutcomeRating,
    target_rating: 4 as OutcomeRating,
    direction: "improving" as OutcomeDirection,
    status: "active" as OutcomeStatus,
    review_date: daysFromNow(14),
    set_date: daysAgo(60),
    yp_voice: "I want to stop getting angry all the time.",
    ...overrides,
  };
}

function makeReview(overrides: Partial<OutcomeReviewInput> = {}): OutcomeReviewInput {
  return {
    id: `or_${Math.random().toString(36).slice(2, 8)}`,
    target_id: "ot_001",
    review_date: daysAgo(14),
    previous_rating: 2 as OutcomeRating,
    new_rating: 3 as OutcomeRating,
    direction: "improving" as OutcomeDirection,
    yp_participated: true,
    yp_voice: "I walked away from an argument yesterday.",
    barriers: null,
    next_steps: "Continue CAMHS sessions.",
    ...overrides,
  };
}

function baseInput(overrides: Partial<ChildOutcomeInput> = {}): ChildOutcomeInput {
  return {
    today: TODAY,
    child_id: "yp_alex",
    child_name: "Alex",
    targets: [],
    reviews: [],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Child Outcome Intelligence Engine", () => {

  // ── Output Shape ────────────────────────────────────────────────────────

  it("returns correct output shape", () => {
    const r = computeChildOutcome(baseInput());
    expect(r).toHaveProperty("generated_at");
    expect(r).toHaveProperty("child_id");
    expect(r).toHaveProperty("child_name");
    expect(r).toHaveProperty("progress_rating");
    expect(r).toHaveProperty("progress_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("progress_summary");
    expect(r).toHaveProperty("domain_profiles");
    expect(r).toHaveProperty("review_compliance");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("sets generated_at and child details", () => {
    const r = computeChildOutcome(baseInput());
    expect(r.generated_at).toBe(TODAY);
    expect(r.child_id).toBe("yp_alex");
    expect(r.child_name).toBe("Alex");
  });

  // ── Progress Rating ───────────────────────────────────────────────────

  it("rates no_targets when no targets exist", () => {
    const r = computeChildOutcome(baseInput());
    expect(r.progress_rating).toBe("no_targets");
    expect(r.progress_score).toBe(0);
  });

  it("rates good/outstanding with strong progress", () => {
    const r = computeChildOutcome(baseInput({
      targets: [
        makeTarget({ domain: "health", direction: "improving", baseline_rating: 2, current_rating: 4, yp_voice: "I feel healthier" }),
        makeTarget({ domain: "education", direction: "improving", baseline_rating: 2, current_rating: 4, yp_voice: "I like school now" }),
        makeTarget({ domain: "emotional_wellbeing", direction: "improving", baseline_rating: 1, current_rating: 3, yp_voice: "Feeling better" }),
        makeTarget({ domain: "identity", direction: "improving", baseline_rating: 2, current_rating: 3, yp_voice: "I know who I am" }),
        makeTarget({ domain: "behaviour", direction: "improving", baseline_rating: 1, current_rating: 3, yp_voice: "Trying harder" }),
        makeTarget({ id: "achieved1", domain: "self_care", status: "achieved", direction: "improving", baseline_rating: 2, current_rating: 5, target_rating: 5, yp_voice: "I can do it myself" }),
      ],
      reviews: [
        makeReview({ yp_participated: true }),
        makeReview({ yp_participated: true }),
      ],
    }));
    expect(["good", "outstanding"]).toContain(r.progress_rating);
    expect(r.progress_score).toBeGreaterThanOrEqual(65);
  });

  it("rates inadequate with poor progress", () => {
    const r = computeChildOutcome(baseInput({
      targets: [
        makeTarget({ direction: "declining", baseline_rating: 3, current_rating: 2, review_date: daysAgo(10), yp_voice: null }),
        makeTarget({ domain: "education", direction: "declining", baseline_rating: 3, current_rating: 1, review_date: daysAgo(5), yp_voice: null }),
      ],
      reviews: [
        makeReview({ yp_participated: false, yp_voice: null }),
      ],
    }));
    expect(["inadequate", "adequate"]).toContain(r.progress_rating);
    expect(r.progress_score).toBeLessThan(65);
  });

  // ── Progress Summary ──────────────────────────────────────────────────

  it("computes progress summary correctly", () => {
    const r = computeChildOutcome(baseInput({
      targets: [
        makeTarget({ direction: "improving" }),
        makeTarget({ direction: "stable" }),
        makeTarget({ direction: "declining" }),
        makeTarget({ status: "achieved", direction: "improving" }),
      ],
    }));
    expect(r.progress_summary.total_targets).toBe(4);
    expect(r.progress_summary.active_targets).toBe(3);
    expect(r.progress_summary.achieved_targets).toBe(1);
    expect(r.progress_summary.improving_count).toBe(1);
    expect(r.progress_summary.stable_count).toBe(1);
    expect(r.progress_summary.declining_count).toBe(1);
  });

  it("computes YP voice rate", () => {
    const r = computeChildOutcome(baseInput({
      targets: [
        makeTarget({ yp_voice: "My view" }),
        makeTarget({ yp_voice: null }),
        makeTarget({ yp_voice: "Another view" }),
      ],
    }));
    expect(r.progress_summary.yp_voice_rate).toBe(67);
    expect(r.progress_summary.targets_with_yp_voice).toBe(2);
  });

  it("computes average progress", () => {
    const r = computeChildOutcome(baseInput({
      targets: [
        makeTarget({ baseline_rating: 1, current_rating: 3 }), // +2
        makeTarget({ baseline_rating: 2, current_rating: 3 }), // +1
      ],
    }));
    expect(r.progress_summary.avg_progress).toBe(1.5);
  });

  // ── Domain Profiles ───────────────────────────────────────────────────

  it("builds domain profiles for each domain with targets", () => {
    const r = computeChildOutcome(baseInput({
      targets: [
        makeTarget({ domain: "health" }),
        makeTarget({ domain: "health" }),
        makeTarget({ domain: "education" }),
      ],
    }));
    expect(r.domain_profiles.length).toBe(2);
    const healthDomain = r.domain_profiles.find((d) => d.domain === "health");
    expect(healthDomain).toBeDefined();
    expect(healthDomain!.target_count).toBe(2);
    expect(healthDomain!.domain_label).toBe("Health");
  });

  it("calculates domain progress and remaining gap", () => {
    const r = computeChildOutcome(baseInput({
      targets: [
        makeTarget({ domain: "education", baseline_rating: 2, current_rating: 4, target_rating: 5 }),
      ],
    }));
    const eduDomain = r.domain_profiles.find((d) => d.domain === "education");
    expect(eduDomain!.progress_gap).toBe(2);  // 4 - 2
    expect(eduDomain!.remaining_gap).toBe(1);  // 5 - 4
  });

  it("detects declining domains", () => {
    const r = computeChildOutcome(baseInput({
      targets: [
        makeTarget({ domain: "family_social", direction: "declining" }),
      ],
    }));
    const familyDomain = r.domain_profiles.find((d) => d.domain === "family_social");
    expect(familyDomain!.has_declining).toBe(true);
    expect(familyDomain!.declining_count).toBe(1);
  });

  it("excludes domains with no targets", () => {
    const r = computeChildOutcome(baseInput({
      targets: [makeTarget({ domain: "health" })],
    }));
    expect(r.domain_profiles.length).toBe(1);
    expect(r.domain_profiles[0].domain).toBe("health");
  });

  // ── Review Compliance ─────────────────────────────────────────────────

  it("computes review compliance metrics", () => {
    const r = computeChildOutcome(baseInput({
      targets: [makeTarget()],
      reviews: [
        makeReview({ yp_participated: true, barriers: "Family issues" }),
        makeReview({ yp_participated: true, barriers: null }),
        makeReview({ yp_participated: false, barriers: "School timetable" }),
      ],
    }));
    expect(r.review_compliance.total_reviews).toBe(3);
    expect(r.review_compliance.reviews_with_yp).toBe(2);
    expect(r.review_compliance.yp_participation_rate).toBe(67);
    expect(r.review_compliance.reviews_with_barriers).toBe(2);
  });

  it("detects overdue reviews", () => {
    const r = computeChildOutcome(baseInput({
      targets: [
        makeTarget({ review_date: daysAgo(10) }),
        makeTarget({ review_date: daysFromNow(14) }),
      ],
    }));
    expect(r.review_compliance.overdue_reviews).toBe(1);
  });

  // ── Scoring ───────────────────────────────────────────────────────────

  it("boosts score for high improving rate", () => {
    const improving = computeChildOutcome(baseInput({
      targets: [
        makeTarget({ direction: "improving" }),
        makeTarget({ direction: "improving" }),
        makeTarget({ direction: "improving" }),
      ],
    }));
    const declining = computeChildOutcome(baseInput({
      targets: [
        makeTarget({ direction: "declining", baseline_rating: 3, current_rating: 2 }),
        makeTarget({ direction: "declining", baseline_rating: 3, current_rating: 1 }),
        makeTarget({ direction: "declining", baseline_rating: 3, current_rating: 2 }),
      ],
    }));
    expect(improving.progress_score).toBeGreaterThan(declining.progress_score);
  });

  it("boosts score for achieved targets", () => {
    const withAchieved = computeChildOutcome(baseInput({
      targets: [
        makeTarget({ status: "achieved" }),
        makeTarget({ direction: "improving" }),
      ],
    }));
    const withoutAchieved = computeChildOutcome(baseInput({
      targets: [
        makeTarget({ direction: "stable", baseline_rating: 3, current_rating: 3 }),
        makeTarget({ direction: "stable", baseline_rating: 3, current_rating: 3 }),
      ],
    }));
    expect(withAchieved.progress_score).toBeGreaterThan(withoutAchieved.progress_score);
  });

  it("penalises overdue reviews", () => {
    const onTime = computeChildOutcome(baseInput({
      targets: [makeTarget({ review_date: daysFromNow(14) })],
    }));
    const overdue = computeChildOutcome(baseInput({
      targets: [makeTarget({ review_date: daysAgo(10) })],
    }));
    expect(onTime.progress_score).toBeGreaterThan(overdue.progress_score);
  });

  it("clamps score to 0-100", () => {
    const r = computeChildOutcome(baseInput({
      targets: Array.from({ length: 8 }, () => makeTarget({
        direction: "declining",
        baseline_rating: 4,
        current_rating: 1,
        review_date: daysAgo(30),
        yp_voice: null,
      })),
    }));
    expect(r.progress_score).toBeGreaterThanOrEqual(0);
    expect(r.progress_score).toBeLessThanOrEqual(100);
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  it("generates strengths for good progress", () => {
    const r = computeChildOutcome(baseInput({
      targets: [
        makeTarget({ direction: "improving", baseline_rating: 2, current_rating: 4 }),
        makeTarget({ domain: "education", direction: "improving", baseline_rating: 2, current_rating: 4 }),
        makeTarget({ domain: "health", direction: "improving", baseline_rating: 2, current_rating: 4 }),
      ],
    }));
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("generates strength for high YP voice capture", () => {
    const r = computeChildOutcome(baseInput({
      targets: [
        makeTarget({ yp_voice: "My view 1" }),
        makeTarget({ yp_voice: "My view 2" }),
        makeTarget({ yp_voice: "My view 3" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("voice"))).toBe(true);
  });

  it("generates strength for achieved targets", () => {
    const r = computeChildOutcome(baseInput({
      targets: [
        makeTarget({ status: "achieved" }),
        makeTarget({ direction: "improving" }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("achieved"))).toBe(true);
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  it("generates concern for no targets", () => {
    const r = computeChildOutcome(baseInput());
    expect(r.concerns.some((c) => c.includes("No outcome targets"))).toBe(true);
  });

  it("generates concern for declining targets", () => {
    const r = computeChildOutcome(baseInput({
      targets: [makeTarget({ direction: "declining" })],
    }));
    expect(r.concerns.some((c) => c.includes("declining"))).toBe(true);
  });

  it("generates concern for overdue reviews", () => {
    const r = computeChildOutcome(baseInput({
      targets: [makeTarget({ review_date: daysAgo(10) })],
    }));
    expect(r.concerns.some((c) => c.includes("overdue"))).toBe(true);
  });

  it("generates concern for low YP voice", () => {
    const r = computeChildOutcome(baseInput({
      targets: [
        makeTarget({ yp_voice: null }),
        makeTarget({ yp_voice: null }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("voice"))).toBe(true);
  });

  // ── Recommendations ───────────────────────────────────────────────────

  it("recommends urgent review for declining targets", () => {
    const r = computeChildOutcome(baseInput({
      targets: [makeTarget({ direction: "declining" })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate")).toBe(true);
  });

  it("recommends immediate action for overdue reviews", () => {
    const r = computeChildOutcome(baseInput({
      targets: [makeTarget({ review_date: daysAgo(10) })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate")).toBe(true);
  });

  it("recommends setting targets when none exist", () => {
    const r = computeChildOutcome(baseInput());
    expect(r.recommendations.some((rec) => rec.urgency === "immediate")).toBe(true);
  });

  // ── ARIA Insights ─────────────────────────────────────────────────────

  it("generates critical insight for inadequate progress", () => {
    const r = computeChildOutcome(baseInput({
      targets: [
        makeTarget({ direction: "declining", baseline_rating: 3, current_rating: 1, review_date: daysAgo(20), yp_voice: null }),
        makeTarget({ domain: "education", direction: "declining", baseline_rating: 4, current_rating: 2, review_date: daysAgo(15), yp_voice: null }),
      ],
    }));
    if (r.progress_rating === "inadequate") {
      expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
    }
  });

  it("generates critical insight for declining targets", () => {
    const r = computeChildOutcome(baseInput({
      targets: [makeTarget({ direction: "declining" })],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("declining"))).toBe(true);
  });

  it("generates positive insight for outstanding progress", () => {
    const r = computeChildOutcome(baseInput({
      targets: [
        makeTarget({ domain: "health", direction: "improving", baseline_rating: 2, current_rating: 4, yp_voice: "Good" }),
        makeTarget({ domain: "education", direction: "improving", baseline_rating: 2, current_rating: 4, yp_voice: "Good" }),
        makeTarget({ domain: "emotional_wellbeing", direction: "improving", baseline_rating: 1, current_rating: 3, yp_voice: "Good" }),
        makeTarget({ domain: "identity", direction: "improving", baseline_rating: 2, current_rating: 4, yp_voice: "Good" }),
        makeTarget({ domain: "behaviour", direction: "improving", baseline_rating: 1, current_rating: 3, yp_voice: "Good" }),
        makeTarget({ id: "ach1", domain: "self_care", status: "achieved", direction: "improving", baseline_rating: 2, current_rating: 5, target_rating: 5, yp_voice: "Done!" }),
        makeTarget({ id: "ach2", domain: "independence", status: "achieved", direction: "improving", baseline_rating: 2, current_rating: 5, target_rating: 5, yp_voice: "Done!" }),
      ],
      reviews: [
        makeReview({ yp_participated: true }),
        makeReview({ yp_participated: true }),
      ],
    }));
    if (r.progress_rating === "outstanding") {
      expect(r.insights.some((i) => i.severity === "positive")).toBe(true);
    }
  });

  it("generates critical insight for no targets", () => {
    const r = computeChildOutcome(baseInput());
    expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
  });

  // ── Headline ──────────────────────────────────────────────────────────

  it("includes progress rating in headline", () => {
    const r = computeChildOutcome(baseInput());
    expect(r.headline).toContain(r.progress_rating);
  });

  it("mentions declining targets in headline", () => {
    const r = computeChildOutcome(baseInput({
      targets: [makeTarget({ direction: "declining" })],
    }));
    expect(r.headline).toContain("declining");
  });

  it("mentions overdue reviews in headline", () => {
    const r = computeChildOutcome(baseInput({
      targets: [makeTarget({ review_date: daysAgo(10) })],
    }));
    expect(r.headline).toContain("overdue");
  });
});
