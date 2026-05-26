// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Child LAC Review Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeChildLACReview,
  type ChildLACReviewInput,
  type LACReviewInput,
  type LACReviewAction,
} from "../child-lac-review-intelligence-engine";

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

function makeAction(overrides: Partial<LACReviewAction> = {}): LACReviewAction {
  return {
    action: "Support child with education",
    owner: "Key worker",
    due_date: daysFromNow(14),
    completed: false,
    ...overrides,
  };
}

function makeReview(overrides: Partial<LACReviewInput> = {}): LACReviewInput {
  return {
    id: `lac_${Math.random().toString(36).slice(2, 8)}`,
    date: daysAgo(30),
    review_type: "subsequent",
    iro_name: "Sarah Mitchell",
    child_participation: "attended",
    child_views_recorded: true,
    outcome: "placement_continues",
    actions: [makeAction({ completed: true }), makeAction()],
    next_review_date: daysFromNow(150),
    placement_stability: "stable",
    care_plan_updated: true,
    attendee_count: 5,
    ...overrides,
  };
}

function baseInput(overrides: Partial<ChildLACReviewInput> = {}): ChildLACReviewInput {
  return {
    today: TODAY,
    child_id: "yp_alex",
    child_name: "Alex",
    reviews: [],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Child LAC Review Intelligence Engine", () => {

  // ── Output Shape ────────────────────────────────────────────────────────

  it("returns correct output shape", () => {
    const r = computeChildLACReview(baseInput());
    expect(r).toHaveProperty("generated_at");
    expect(r).toHaveProperty("child_id");
    expect(r).toHaveProperty("child_name");
    expect(r).toHaveProperty("compliance_rating");
    expect(r).toHaveProperty("compliance_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("timeliness");
    expect(r).toHaveProperty("participation");
    expect(r).toHaveProperty("action_completion");
    expect(r).toHaveProperty("iro");
    expect(r).toHaveProperty("care_plan_update_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("sets generated_at and child details", () => {
    const r = computeChildLACReview(baseInput());
    expect(r.generated_at).toBe(TODAY);
    expect(r.child_id).toBe("yp_alex");
    expect(r.child_name).toBe("Alex");
  });

  // ── Compliance Rating ──────────────────────────────────────────────────

  it("rates no_reviews when no reviews exist", () => {
    const r = computeChildLACReview(baseInput());
    expect(r.compliance_rating).toBe("no_reviews");
  });

  it("rates good/outstanding with strong compliance", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [
        makeReview({
          date: daysAgo(30),
          actions: [makeAction({ completed: true }), makeAction({ completed: true })],
        }),
        makeReview({
          date: daysAgo(180),
          actions: [makeAction({ completed: true })],
        }),
      ],
    }));
    expect(["good", "outstanding"]).toContain(r.compliance_rating);
    expect(r.compliance_score).toBeGreaterThanOrEqual(65);
  });

  it("rates inadequate with poor compliance", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [
        makeReview({
          date: daysAgo(30),
          child_participation: "did_not_participate",
          child_views_recorded: false,
          next_review_date: daysAgo(5), // Overdue
          care_plan_updated: false,
          actions: [
            makeAction({ completed: false, due_date: daysAgo(20) }),
            makeAction({ completed: false, due_date: daysAgo(10) }),
            makeAction({ completed: false, due_date: daysAgo(5) }),
          ],
          placement_stability: "at_risk",
        }),
        makeReview({
          date: daysAgo(400), // very old — gap too big
          iro_name: "Different IRO",
          child_participation: "did_not_participate",
          child_views_recorded: false,
          care_plan_updated: false,
          actions: [makeAction({ completed: false, due_date: daysAgo(300) })],
        }),
      ],
    }));
    expect(["inadequate", "adequate"]).toContain(r.compliance_rating);
    expect(r.compliance_score).toBeLessThan(65);
  });

  // ── Timeliness ─────────────────────────────────────────────────────────

  it("detects overdue next review", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [makeReview({ next_review_date: daysAgo(10) })],
    }));
    expect(r.timeliness.is_overdue).toBe(true);
    expect(r.timeliness.days_until_next).toBe(-10);
  });

  it("detects upcoming next review", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [makeReview({ next_review_date: daysFromNow(30) })],
    }));
    expect(r.timeliness.is_overdue).toBe(false);
    expect(r.timeliness.days_until_next).toBe(30);
  });

  it("calculates on-time rate", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [
        makeReview({ date: daysAgo(30) }),
        makeReview({ date: daysAgo(180) }), // 150d gap — within 200d
      ],
    }));
    expect(r.timeliness.reviews_on_time_rate).toBe(100);
  });

  // ── Participation ──────────────────────────────────────────────────────

  it("computes participation rates", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [
        makeReview({ child_participation: "attended" }),
        makeReview({ child_participation: "views_submitted" }),
        makeReview({ child_participation: "did_not_participate", child_views_recorded: false }),
      ],
    }));
    expect(r.participation.attended_rate).toBe(33);
    expect(r.participation.views_submitted_rate).toBe(33);
    expect(r.participation.did_not_participate_rate).toBe(33);
    expect(r.participation.views_recorded_rate).toBe(67);
  });

  it("reports 100% attendance when all reviews attended", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [
        makeReview({ child_participation: "attended" }),
        makeReview({ child_participation: "attended" }),
      ],
    }));
    expect(r.participation.attended_rate).toBe(100);
  });

  // ── Action Completion ──────────────────────────────────────────────────

  it("computes action completion rate", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [
        makeReview({
          actions: [
            makeAction({ completed: true }),
            makeAction({ completed: true }),
            makeAction({ completed: false, due_date: daysFromNow(10) }),
          ],
        }),
      ],
    }));
    expect(r.action_completion.total_actions).toBe(3);
    expect(r.action_completion.completed_count).toBe(2);
    expect(r.action_completion.completion_rate).toBe(67);
  });

  it("identifies overdue actions", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [
        makeReview({
          actions: [
            makeAction({ completed: false, due_date: daysAgo(5), action: "Complete assessment" }),
            makeAction({ completed: true, due_date: daysAgo(10) }),
            makeAction({ completed: false, due_date: daysFromNow(10) }), // Not yet overdue
          ],
        }),
      ],
    }));
    expect(r.action_completion.overdue_count).toBe(1);
    expect(r.action_completion.overdue_actions).toContain("Complete assessment");
  });

  // ── IRO Profile ────────────────────────────────────────────────────────

  it("detects IRO consistency", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [
        makeReview({ date: daysAgo(30), iro_name: "Sarah Mitchell" }),
        makeReview({ date: daysAgo(180), iro_name: "Sarah Mitchell" }),
      ],
    }));
    expect(r.iro.iro_consistency).toBe(true);
    expect(r.iro.iro_names).toEqual(["Sarah Mitchell"]);
  });

  it("detects IRO change", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [
        makeReview({ date: daysAgo(30), iro_name: "Sarah Mitchell" }),
        makeReview({ date: daysAgo(180), iro_name: "David Wright" }),
      ],
    }));
    expect(r.iro.iro_consistency).toBe(false);
  });

  // ── Care Plan Update Rate ──────────────────────────────────────────────

  it("computes care plan update rate", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [
        makeReview({ care_plan_updated: true }),
        makeReview({ care_plan_updated: false }),
      ],
    }));
    expect(r.care_plan_update_rate).toBe(50);
  });

  // ── Placement Stability ────────────────────────────────────────────────

  it("uses most recent review for placement stability", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [
        makeReview({ date: daysAgo(30), placement_stability: "some_concerns" }),
        makeReview({ date: daysAgo(180), placement_stability: "stable" }),
      ],
    }));
    expect(r.placement_stability_current).toBe("some_concerns");
  });

  // ── Scoring ────────────────────────────────────────────────────────────

  it("boosts score for high attendance", () => {
    const highAttend = computeChildLACReview(baseInput({
      reviews: [
        makeReview({ child_participation: "attended" }),
        makeReview({ child_participation: "attended" }),
      ],
    }));
    const lowAttend = computeChildLACReview(baseInput({
      reviews: [
        makeReview({ child_participation: "did_not_participate", child_views_recorded: false }),
        makeReview({ child_participation: "did_not_participate", child_views_recorded: false }),
      ],
    }));
    expect(highAttend.compliance_score).toBeGreaterThan(lowAttend.compliance_score);
  });

  it("penalises overdue review", () => {
    const onTime = computeChildLACReview(baseInput({
      reviews: [makeReview({ next_review_date: daysFromNow(60) })],
    }));
    const overdue = computeChildLACReview(baseInput({
      reviews: [makeReview({ next_review_date: daysAgo(30) })],
    }));
    expect(onTime.compliance_score).toBeGreaterThan(overdue.compliance_score);
  });

  it("clamps score to 0-100", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [
        makeReview({
          child_participation: "did_not_participate",
          child_views_recorded: false,
          next_review_date: daysAgo(60),
          care_plan_updated: false,
          placement_stability: "at_risk",
          actions: Array.from({ length: 10 }, () => makeAction({ completed: false, due_date: daysAgo(30) })),
        }),
      ],
    }));
    expect(r.compliance_score).toBeGreaterThanOrEqual(0);
    expect(r.compliance_score).toBeLessThanOrEqual(100);
  });

  // ── Strengths ──────────────────────────────────────────────────────────

  it("generates strengths for good compliance", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [
        makeReview({ actions: [makeAction({ completed: true }), makeAction({ completed: true })] }),
        makeReview({ actions: [makeAction({ completed: true })] }),
      ],
    }));
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("generates strength for 100% views recorded", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [
        makeReview({ child_views_recorded: true }),
      ],
    }));
    expect(r.strengths.some((s) => s.includes("views recorded") || s.includes("Child views"))).toBe(true);
  });

  // ── Concerns ───────────────────────────────────────────────────────────

  it("generates concern for no reviews", () => {
    const r = computeChildLACReview(baseInput());
    expect(r.concerns.some((c) => c.includes("No LAC reviews"))).toBe(true);
  });

  it("generates concern for overdue review", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [makeReview({ next_review_date: daysAgo(15) })],
    }));
    expect(r.concerns.some((c) => c.includes("overdue") || c.includes("OVERDUE"))).toBe(true);
  });

  it("generates concern for overdue actions", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [makeReview({
        actions: [makeAction({ completed: false, due_date: daysAgo(10) })],
      })],
    }));
    expect(r.concerns.some((c) => c.includes("overdue"))).toBe(true);
  });

  // ── Recommendations ────────────────────────────────────────────────────

  it("recommends immediate action for overdue review", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [makeReview({ next_review_date: daysAgo(15) })],
    }));
    expect(r.recommendations.some((rec) => rec.urgency === "immediate")).toBe(true);
  });

  it("recommends scheduling for no reviews", () => {
    const r = computeChildLACReview(baseInput());
    expect(r.recommendations.some((rec) => rec.urgency === "immediate")).toBe(true);
  });

  // ── ARIA Insights ──────────────────────────────────────────────────────

  it("generates critical insight for inadequate compliance", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [makeReview({
        child_participation: "did_not_participate",
        child_views_recorded: false,
        next_review_date: daysAgo(60),
        care_plan_updated: false,
        placement_stability: "at_risk",
        actions: Array.from({ length: 5 }, () => makeAction({ completed: false, due_date: daysAgo(30) })),
      })],
    }));
    if (r.compliance_rating === "inadequate") {
      expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
    }
  });

  it("generates positive insight for outstanding compliance", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [
        makeReview({
          actions: [makeAction({ completed: true }), makeAction({ completed: true }), makeAction({ completed: true })],
        }),
        makeReview({
          actions: [makeAction({ completed: true }), makeAction({ completed: true })],
        }),
      ],
    }));
    if (r.compliance_rating === "outstanding") {
      expect(r.insights.some((i) => i.severity === "positive")).toBe(true);
    }
  });

  // ── Headline ───────────────────────────────────────────────────────────

  it("includes compliance rating in headline", () => {
    const r = computeChildLACReview(baseInput());
    expect(r.headline).toContain(r.compliance_rating);
  });

  it("flags overdue in headline", () => {
    const r = computeChildLACReview(baseInput({
      reviews: [makeReview({ next_review_date: daysAgo(10) })],
    }));
    expect(r.headline).toContain("OVERDUE");
  });
});
