// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME LAC REVIEW INTELLIGENCE ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeLACReview,
  type HomeLACReviewInput,
  type LACReviewInput,
  type LACReviewActionInput,
} from "../home-lac-review-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeAction(overrides: Partial<LACReviewActionInput> = {}): LACReviewActionInput {
  return {
    completed: false,
    due_date: "2026-06-15",
    ...overrides,
  };
}

function makeReview(overrides: Partial<LACReviewInput> = {}): LACReviewInput {
  return {
    id: "lac_1",
    child_id: "yp_alex",
    date: "2026-05-01",
    review_type: "subsequent",
    child_participation: "attended",
    has_child_views: true,
    attendee_count: 4,
    has_social_worker: true,
    has_iro: true,
    outcome: "placement_continues",
    actions_agreed: [
      makeAction({ completed: true, due_date: "2026-05-15" }),
      makeAction({ completed: false, due_date: "2026-06-15" }),
    ],
    care_plan_updated: true,
    placement_stability: "stable",
    next_review_date: "2026-10-01",
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeLACReviewInput> = {}): HomeLACReviewInput {
  return {
    today: "2026-05-26",
    total_children: 3,
    child_ids: ["yp_alex", "yp_jordan", "yp_casey"],
    lac_reviews: [
      makeReview({ id: "l1", child_id: "yp_alex", date: "2026-04-26" }),
      makeReview({ id: "l2", child_id: "yp_jordan", date: "2026-04-11", child_participation: "views_submitted" }),
      makeReview({ id: "l3", child_id: "yp_casey", date: "2026-03-27", review_type: "first_review" }),
    ],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home LAC Review Intelligence Engine", () => {

  // ── Structure ─────────────────────────────────────────────────────────────

  it("returns a well-shaped result", () => {
    const r = computeHomeLACReview(baseInput());
    expect(r).toHaveProperty("lac_review_rating");
    expect(r).toHaveProperty("lac_review_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("compliance");
    expect(r).toHaveProperty("participation");
    expect(r).toHaveProperty("actions");
    expect(r).toHaveProperty("stability");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("assigns a valid rating", () => {
    const r = computeHomeLACReview(baseInput());
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.lac_review_rating);
  });

  it("scores between 0 and 100", () => {
    const r = computeHomeLACReview(baseInput());
    expect(r.lac_review_score).toBeGreaterThanOrEqual(0);
    expect(r.lac_review_score).toBeLessThanOrEqual(100);
  });

  it("compliance profile has correct shape", () => {
    const r = computeHomeLACReview(baseInput());
    expect(r.compliance).toHaveProperty("total_reviews_180d");
    expect(r.compliance).toHaveProperty("reviews_per_child");
    expect(r.compliance).toHaveProperty("children_with_reviews");
    expect(r.compliance).toHaveProperty("children_without_reviews");
    expect(r.compliance).toHaveProperty("care_plan_update_rate");
    expect(r.compliance).toHaveProperty("overdue_reviews");
  });

  it("participation profile has correct shape", () => {
    const r = computeHomeLACReview(baseInput());
    expect(r.participation).toHaveProperty("attended_rate");
    expect(r.participation).toHaveProperty("views_rate");
    expect(r.participation).toHaveProperty("advocate_count");
    expect(r.participation).toHaveProperty("no_participation_count");
  });

  it("action profile has correct shape", () => {
    const r = computeHomeLACReview(baseInput());
    expect(r.actions).toHaveProperty("total_actions");
    expect(r.actions).toHaveProperty("completed_actions");
    expect(r.actions).toHaveProperty("completion_rate");
    expect(r.actions).toHaveProperty("overdue_actions");
  });

  // ── Insufficient Data ─────────────────────────────────────────────────────

  it("returns insufficient_data with no reviews", () => {
    const r = computeHomeLACReview(baseInput({ lac_reviews: [] }));
    expect(r.lac_review_rating).toBe("insufficient_data");
    expect(r.lac_review_score).toBe(0);
  });

  it("has concerns and recommendations when no reviews", () => {
    const r = computeHomeLACReview(baseInput({ lac_reviews: [] }));
    expect(r.concerns.length).toBeGreaterThan(0);
    expect(r.recommendations.length).toBeGreaterThan(0);
    expect(r.insights.length).toBeGreaterThan(0);
  });

  // ── Review Counting ───────────────────────────────────────────────────────

  it("correctly counts 180-day reviews", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", date: "2026-05-01" }),       // 25 days ago
        makeReview({ id: "l2", date: "2026-01-01" }),       // ~145 days ago
        makeReview({ id: "l3", date: "2025-09-01" }),       // >180d ago
      ],
    }));
    expect(r.compliance.total_reviews_180d).toBe(2);
  });

  it("calculates reviews per child", () => {
    const r = computeHomeLACReview(baseInput());
    expect(r.compliance.reviews_per_child).toBe(1); // 3 reviews / 3 children
  });

  it("counts first and subsequent reviews", () => {
    const r = computeHomeLACReview(baseInput());
    expect(r.compliance.first_reviews).toBe(1);
    expect(r.compliance.subsequent_reviews).toBe(2);
  });

  // ── Children Coverage ─────────────────────────────────────────────────────

  it("identifies children with reviews", () => {
    const r = computeHomeLACReview(baseInput());
    expect(r.compliance.children_with_reviews).toContain("yp_alex");
    expect(r.compliance.children_with_reviews).toContain("yp_jordan");
    expect(r.compliance.children_with_reviews).toContain("yp_casey");
    expect(r.compliance.children_without_reviews).toEqual([]);
  });

  it("identifies children without reviews", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", child_id: "yp_alex", date: "2026-05-01" }),
      ],
    }));
    expect(r.compliance.children_without_reviews).toContain("yp_jordan");
    expect(r.compliance.children_without_reviews).toContain("yp_casey");
  });

  // ── Overdue Reviews ───────────────────────────────────────────────────────

  it("detects overdue reviews (next_review_date < today)", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", child_id: "yp_alex", date: "2026-03-01", next_review_date: "2026-05-01" }), // overdue
        makeReview({ id: "l2", child_id: "yp_jordan", date: "2026-04-01", next_review_date: "2026-08-01" }), // not overdue
        makeReview({ id: "l3", child_id: "yp_casey", date: "2026-04-01", next_review_date: "2026-09-01" }),
      ],
    }));
    expect(r.compliance.overdue_reviews).toContain("yp_alex");
    expect(r.compliance.overdue_reviews).not.toContain("yp_jordan");
  });

  it("children without any reviews are in overdue list", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", child_id: "yp_alex", date: "2026-05-01" }),
      ],
    }));
    expect(r.compliance.overdue_reviews).toContain("yp_jordan");
    expect(r.compliance.overdue_reviews).toContain("yp_casey");
  });

  // ── Participation ─────────────────────────────────────────────────────────

  it("calculates 100% attended rate", () => {
    const r = computeHomeLACReview(baseInput());
    // all 3 reviews: attended, views_submitted, attended → all count
    expect(r.participation.attended_rate).toBe(100);
  });

  it("detects reduced participation rate", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", child_id: "yp_alex", child_participation: "attended" }),
        makeReview({ id: "l2", child_id: "yp_jordan", child_participation: "none" }),
      ],
    }));
    expect(r.participation.attended_rate).toBe(50);
    expect(r.participation.no_participation_count).toBe(1);
  });

  it("counts advocate participation", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", child_participation: "advocate" }),
        makeReview({ id: "l2", child_participation: "attended" }),
      ],
    }));
    expect(r.participation.advocate_count).toBe(1);
  });

  it("calculates views rate correctly", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", has_child_views: true }),
        makeReview({ id: "l2", has_child_views: false }),
      ],
    }));
    expect(r.participation.views_rate).toBe(50);
  });

  // ── Care Plan ─────────────────────────────────────────────────────────────

  it("calculates 100% care plan update rate", () => {
    const r = computeHomeLACReview(baseInput());
    expect(r.compliance.care_plan_update_rate).toBe(100);
  });

  it("detects reduced care plan rate", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", care_plan_updated: true }),
        makeReview({ id: "l2", care_plan_updated: false }),
      ],
    }));
    expect(r.compliance.care_plan_update_rate).toBe(50);
  });

  // ── Action Tracking ───────────────────────────────────────────────────────

  it("counts total and completed actions", () => {
    const r = computeHomeLACReview(baseInput());
    // Each review has 2 actions (1 completed, 1 not). 3 reviews = 6 total, 3 completed
    expect(r.actions.total_actions).toBe(6);
    expect(r.actions.completed_actions).toBe(3);
    expect(r.actions.completion_rate).toBe(50);
  });

  it("detects overdue actions", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({
          id: "l1",
          actions_agreed: [
            makeAction({ completed: false, due_date: "2026-05-01" }), // overdue
            makeAction({ completed: false, due_date: "2026-06-15" }), // not overdue
            makeAction({ completed: true, due_date: "2026-04-01" }),  // completed, not overdue
          ],
        }),
      ],
    }));
    expect(r.actions.overdue_actions).toBe(1);
  });

  it("100% completion when all actions done", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({
          id: "l1",
          actions_agreed: [
            makeAction({ completed: true, due_date: "2026-05-01" }),
            makeAction({ completed: true, due_date: "2026-04-15" }),
          ],
        }),
      ],
    }));
    expect(r.actions.completion_rate).toBe(100);
    expect(r.actions.overdue_actions).toBe(0);
  });

  // ── Stability ─────────────────────────────────────────────────────────────

  it("calculates stability from latest review per child", () => {
    const r = computeHomeLACReview(baseInput());
    expect(r.stability.stable_count).toBe(3); // all stable in base
    expect(r.stability.stability_rate).toBe(100);
  });

  it("detects unstable placements", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", child_id: "yp_alex", date: "2026-05-01", placement_stability: "unstable" }),
        makeReview({ id: "l2", child_id: "yp_jordan", date: "2026-04-01", placement_stability: "stable" }),
      ],
    }));
    expect(r.stability.unstable_count).toBe(1);
    expect(r.stability.stability_rate).toBe(50);
  });

  it("uses latest review for stability when multiple per child", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", child_id: "yp_alex", date: "2026-03-01", placement_stability: "unstable" }),
        makeReview({ id: "l2", child_id: "yp_alex", date: "2026-05-01", placement_stability: "stable" }),
      ],
    }));
    // Latest is stable, so stable_count = 1
    expect(r.stability.stable_count).toBe(1);
    expect(r.stability.unstable_count).toBe(0);
  });

  // ── Rating Boundaries ─────────────────────────────────────────────────────

  it("rates outstanding (score >= 80)", () => {
    // Full compliance, participation, actions mostly done, all stable
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({
          id: "l1", child_id: "yp_alex", date: "2026-05-01",
          actions_agreed: [makeAction({ completed: true }), makeAction({ completed: true })],
        }),
        makeReview({
          id: "l2", child_id: "yp_jordan", date: "2026-04-11",
          child_participation: "views_submitted",
          actions_agreed: [makeAction({ completed: true }), makeAction({ completed: true })],
        }),
        makeReview({
          id: "l3", child_id: "yp_casey", date: "2026-03-27", review_type: "first_review",
          actions_agreed: [makeAction({ completed: true }), makeAction({ completed: true })],
        }),
      ],
    }));
    expect(r.lac_review_score).toBeGreaterThanOrEqual(80);
    expect(r.lac_review_rating).toBe("outstanding");
  });

  it("rates good (65 <= score < 80)", () => {
    // Good but some gaps — action completion not perfect, one overdue action
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({
          id: "l1", child_id: "yp_alex", date: "2026-05-01",
          actions_agreed: [makeAction({ completed: true }), makeAction({ completed: false, due_date: "2026-05-10" })],
        }),
        makeReview({
          id: "l2", child_id: "yp_jordan", date: "2026-04-11",
          child_participation: "views_submitted",
          placement_stability: "some_concerns",
          actions_agreed: [makeAction({ completed: true }), makeAction({ completed: false })],
        }),
        makeReview({
          id: "l3", child_id: "yp_casey", date: "2026-03-27",
          actions_agreed: [makeAction({ completed: true })],
        }),
      ],
    }));
    expect(r.lac_review_score).toBeGreaterThanOrEqual(65);
    expect(r.lac_review_score).toBeLessThan(80);
    expect(r.lac_review_rating).toBe("good");
  });

  it("rates adequate (45 <= score < 65)", () => {
    // Casey missing reviews, both existing reviews have participation but mixed quality
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({
          id: "l1", child_id: "yp_alex", date: "2026-05-01",
          has_child_views: false,
          placement_stability: "some_concerns",
          actions_agreed: [makeAction({ completed: false, due_date: "2026-05-01" }), makeAction({ completed: true })],
        }),
        makeReview({
          id: "l2", child_id: "yp_jordan", date: "2026-04-01",
          actions_agreed: [makeAction({ completed: true })],
        }),
      ],
    }));
    expect(r.lac_review_score).toBeGreaterThanOrEqual(45);
    expect(r.lac_review_score).toBeLessThan(65);
    expect(r.lac_review_rating).toBe("adequate");
  });

  it("rates inadequate (score < 45)", () => {
    // One child only, no participation, unstable, no care plan, no actions done
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({
          id: "l1", child_id: "yp_alex", date: "2026-05-01",
          child_participation: "none", has_child_views: false,
          has_social_worker: false, has_iro: false,
          care_plan_updated: false,
          placement_stability: "unstable",
          actions_agreed: [
            makeAction({ completed: false, due_date: "2026-04-01" }),
            makeAction({ completed: false, due_date: "2026-04-15" }),
            makeAction({ completed: false, due_date: "2026-05-01" }),
          ],
        }),
      ],
    }));
    expect(r.lac_review_score).toBeLessThan(45);
    expect(r.lac_review_rating).toBe("inadequate");
  });

  // ── Scoring Modifiers ─────────────────────────────────────────────────────

  it("rewards full child participation", () => {
    const noParticipation = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", child_participation: "none", has_child_views: false }),
        makeReview({ id: "l2", child_participation: "none", has_child_views: false }),
      ],
    }));
    const fullParticipation = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", child_participation: "attended" }),
        makeReview({ id: "l2", child_participation: "attended" }),
      ],
    }));
    expect(fullParticipation.lac_review_score).toBeGreaterThan(noParticipation.lac_review_score);
  });

  it("penalises unstable placements", () => {
    const stable = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", placement_stability: "stable" }),
        makeReview({ id: "l2", placement_stability: "stable" }),
      ],
    }));
    const unstable = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", placement_stability: "unstable" }),
        makeReview({ id: "l2", placement_stability: "unstable" }),
      ],
    }));
    expect(unstable.lac_review_score).toBeLessThan(stable.lac_review_score);
  });

  it("penalises missing professional attendance", () => {
    const withPro = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", has_social_worker: true, has_iro: true }),
        makeReview({ id: "l2", has_social_worker: true, has_iro: true }),
      ],
    }));
    const withoutPro = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", has_social_worker: false, has_iro: false }),
        makeReview({ id: "l2", has_social_worker: false, has_iro: false }),
      ],
    }));
    expect(withoutPro.lac_review_score).toBeLessThan(withPro.lac_review_score);
  });

  // ── Strengths ─────────────────────────────────────────────────────────────

  it("notes strength for all children covered", () => {
    const r = computeHomeLACReview(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("all children"))).toBe(true);
  });

  it("notes strength for 100% participation", () => {
    const r = computeHomeLACReview(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("participation"))).toBe(true);
  });

  it("notes strength for 100% care plan update", () => {
    const r = computeHomeLACReview(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("care plan"))).toBe(true);
  });

  it("notes strength for stable placements", () => {
    const r = computeHomeLACReview(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("stable"))).toBe(true);
  });

  // ── Concerns ──────────────────────────────────────────────────────────────

  it("raises concern for children without reviews", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [makeReview({ id: "l1", child_id: "yp_alex" })],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("without lac reviews"))).toBe(true);
  });

  it("raises concern for no child participation", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", child_participation: "none" }),
        makeReview({ id: "l2", child_participation: "attended" }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("no child participation"))).toBe(true);
  });

  it("raises concern for overdue actions", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({
          id: "l1",
          actions_agreed: [makeAction({ completed: false, due_date: "2026-04-01" })],
        }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("overdue"))).toBe(true);
  });

  it("raises concern for unstable placements", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", placement_stability: "unstable" }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("unstable"))).toBe(true);
  });

  // ── Recommendations ───────────────────────────────────────────────────────

  it("recommends scheduling reviews for uncovered children", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [makeReview({ id: "l1", child_id: "yp_alex" })],
    }));
    expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.regulatory_ref === "Reg 36")).toBe(true);
  });

  it("recommends participation strategies", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", child_participation: "none" }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.toLowerCase().includes("participation"))).toBe(true);
  });

  it("recommends stability meetings for unstable placements", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", placement_stability: "unstable" }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.toLowerCase().includes("stability"))).toBe(true);
  });

  it("recommendations have ranked order", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({
          id: "l1", child_id: "yp_alex",
          child_participation: "none",
          placement_stability: "unstable",
          actions_agreed: [makeAction({ completed: false, due_date: "2026-04-01" }), makeAction({ completed: false, due_date: "2026-04-15" })],
        }),
      ],
    }));
    const ranks = r.recommendations.map(rec => rec.rank);
    for (let i = 0; i < ranks.length - 1; i++) {
      expect(ranks[i]).toBeLessThan(ranks[i + 1]);
    }
  });

  // ── Insights ──────────────────────────────────────────────────────────────

  it("generates critical insight for children without reviews", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [makeReview({ id: "l1", child_id: "yp_alex" })],
    }));
    expect(r.insights.some(i => i.severity === "critical")).toBe(true);
  });

  it("generates critical insight for unstable placements", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", placement_stability: "unstable" }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "critical" && i.text.toLowerCase().includes("unstable"))).toBe(true);
  });

  it("generates positive insight for excellent participation", () => {
    const r = computeHomeLACReview(baseInput());
    expect(r.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("participation"))).toBe(true);
  });

  it("generates positive insight for stable placements", () => {
    const r = computeHomeLACReview(baseInput());
    expect(r.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("stable"))).toBe(true);
  });

  // ── Headlines ─────────────────────────────────────────────────────────────

  it("outstanding headline mentions outstanding", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", child_id: "yp_alex", actions_agreed: [makeAction({ completed: true }), makeAction({ completed: true })] }),
        makeReview({ id: "l2", child_id: "yp_jordan", child_participation: "views_submitted", actions_agreed: [makeAction({ completed: true }), makeAction({ completed: true })] }),
        makeReview({ id: "l3", child_id: "yp_casey", review_type: "first_review", actions_agreed: [makeAction({ completed: true }), makeAction({ completed: true })] }),
      ],
    }));
    expect(r.headline.toLowerCase()).toContain("outstanding");
  });

  it("inadequate headline mentions inadequate", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({
          id: "l1", child_id: "yp_alex",
          child_participation: "none", has_child_views: false,
          has_social_worker: false, has_iro: false,
          care_plan_updated: false, placement_stability: "unstable",
          actions_agreed: [makeAction({ completed: false, due_date: "2026-04-01" }), makeAction({ completed: false, due_date: "2026-04-15" }), makeAction({ completed: false, due_date: "2026-05-01" })],
        }),
      ],
    }));
    expect(r.headline.toLowerCase()).toContain("inadequate");
  });

  // ── Score Clamping ────────────────────────────────────────────────────────

  it("clamps score to minimum 0", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({
          id: "l1", child_id: "yp_alex",
          child_participation: "none", has_child_views: false,
          has_social_worker: false, has_iro: false,
          care_plan_updated: false, placement_stability: "unstable",
          next_review_date: "2026-01-01",
          actions_agreed: Array.from({ length: 5 }, (_, i) => makeAction({ completed: false, due_date: `2026-04-${String(i + 1).padStart(2, "0")}` })),
        }),
      ],
    }));
    expect(r.lac_review_score).toBeGreaterThanOrEqual(0);
  });

  it("clamps score to maximum 100", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", child_id: "yp_alex", actions_agreed: [makeAction({ completed: true })] }),
        makeReview({ id: "l2", child_id: "yp_jordan", actions_agreed: [makeAction({ completed: true })] }),
        makeReview({ id: "l3", child_id: "yp_casey", actions_agreed: [makeAction({ completed: true })] }),
      ],
    }));
    expect(r.lac_review_score).toBeLessThanOrEqual(100);
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  it("handles reviews with no actions", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", actions_agreed: [] }),
        makeReview({ id: "l2", actions_agreed: [] }),
      ],
    }));
    expect(r.actions.total_actions).toBe(0);
    expect(r.actions.completion_rate).toBeNull(); // nothing was agreed, so nothing is complete
    expect(r.strengths.some(s => s.includes("action completion rate"))).toBe(false);
    expect(r.concerns.some(c => c.includes("review actions completed"))).toBe(false);
  });

  it("handles future-dated reviews gracefully", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", date: "2026-06-15" }), // future
        makeReview({ id: "l2", date: "2026-05-01" }),
      ],
    }));
    expect(r.compliance.total_reviews_180d).toBe(1);
  });

  it("handles null next_review_date", () => {
    const r = computeHomeLACReview(baseInput({
      lac_reviews: [
        makeReview({ id: "l1", child_id: "yp_alex", next_review_date: null }),
        makeReview({ id: "l2", child_id: "yp_jordan", next_review_date: null }),
        makeReview({ id: "l3", child_id: "yp_casey", next_review_date: null }),
      ],
    }));
    // null next_review_date should not be flagged as overdue — all children covered
    expect(r.compliance.overdue_reviews).toEqual([]);
  });

  it("handles zero children gracefully", () => {
    const r = computeHomeLACReview(baseInput({
      total_children: 0,
      child_ids: [],
      lac_reviews: [makeReview({ id: "l1" })],
    }));
    expect(r.compliance.reviews_per_child).toBe(0);
  });
});
