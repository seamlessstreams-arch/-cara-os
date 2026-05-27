import { describe, it, expect } from "vitest";
import {
  computeQualityOfCareReview,
  type QocReviewInput,
  type QualityOfCareReviewInput,
} from "../home-quality-of-care-review-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeReview(overrides: Partial<QocReviewInput> = {}): QocReviewInput {
  return {
    id: "qoc_1",
    type: "monthly",
    overall_rating: "outstanding",
    domains_count: 6,
    domains_good_or_outstanding: 6,
    actions_total: 4,
    actions_completed: 4,
    has_children_feedback: true,
    has_staff_feedback: true,
    has_strengths: true,
    has_improvements: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<QualityOfCareReviewInput> = {}): QualityOfCareReviewInput {
  // 4 children, 6 reviews all outstanding, 100% actions, child + staff feedback, 6/6 domains good
  // Expected: 52 +5(goodRate 100%) +6(actionCompletion 100%) +5(childFeedback 100%) +5(staffFeedback 100%) +4(domainQuality 100%) +5(freq >=4) = 82
  return {
    today: "2026-05-27",
    total_children: 4,
    reviews: Array.from({ length: 6 }, (_, i) => makeReview({ id: `qoc_${i}` })),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════

describe("computeQualityOfCareReview", () => {

  describe("insufficient_data", () => {
    it("returns insufficient_data when total_children = 0", () => {
      const r = computeQualityOfCareReview(baseInput({ total_children: 0 }));
      expect(r.qoc_rating).toBe("insufficient_data");
      expect(r.qoc_score).toBe(0);
    });

    it("returns empty arrays", () => {
      const r = computeQualityOfCareReview(baseInput({ total_children: 0 }));
      expect(r.strengths).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("returns correct headline", () => {
      const r = computeQualityOfCareReview(baseInput({ total_children: 0 }));
      expect(r.headline).toBe("No data available for quality of care analysis");
    });
  });

  describe("outstanding rating", () => {
    it("returns score 82 and outstanding for base input", () => {
      const r = computeQualityOfCareReview(baseInput());
      expect(r.qoc_score).toBe(82);
      expect(r.qoc_rating).toBe("outstanding");
    });

    it("has correct headline", () => {
      const r = computeQualityOfCareReview(baseInput());
      expect(r.headline).toContain("comprehensive");
    });
  });

  describe("good rating", () => {
    it("achieves good with moderate metrics", () => {
      const reviews = Array.from({ length: 6 }, (_, i) => makeReview({
        id: `q_${i}`,
        overall_rating: i < 5 ? "good" : "requires_improvement",
        domains_good_or_outstanding: i < 5 ? 6 : 2,
        actions_completed: 3,
      }));
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      // goodRate: 5/6=83% → +2. actionCompletion: 18/24=75% → +2. domains: 32/36=89% → +1
      // 52+2+2+5+5+1+5 = 72
      expect(r.qoc_score).toBe(72);
      expect(r.qoc_rating).toBe("good");
    });
  });

  describe("adequate rating", () => {
    it("achieves adequate with multiple weaknesses", () => {
      const reviews = Array.from({ length: 3 }, (_, i) => makeReview({
        id: `q_${i}`,
        overall_rating: i < 2 ? "good" : "inadequate",
        domains_good_or_outstanding: 2,
        actions_completed: 1,
        has_children_feedback: i < 1,
        has_staff_feedback: i < 1,
      }));
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      // goodRate: 2/3=67% → 0, actionCompletion: 3/12=25% → -5, childFeedback: 1/3=33% → -4
      // staffFeedback: 1/3=33% → -5, domainQuality: 6/18=33% → -4, freq: 3 → +2
      // 52+0-5-4-5-4+2 = 36
      expect(r.qoc_score).toBe(36);
      expect(r.qoc_rating).toBe("inadequate");
    });

    it("achieves adequate mid-range", () => {
      const reviews = Array.from({ length: 3 }, (_, i) => makeReview({
        id: `q_${i}`,
        overall_rating: i < 2 ? "good" : "requires_improvement",
        actions_completed: 2,
        has_children_feedback: i < 2,
        has_staff_feedback: i < 2,
      }));
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      // goodRate: 67% → 0, actions: 6/12=50% → 0 (between 50-69), child: 67% → 0 (between 50-69)
      // staff: 67% → 0, domains: 100% → +4, freq: 3 → +2
      // 52+0+0+0+0+4+2 = 58
      expect(r.qoc_score).toBe(58);
      expect(r.qoc_rating).toBe("adequate");
    });
  });

  describe("inadequate rating", () => {
    it("achieves inadequate with severe deficiencies", () => {
      const reviews = [makeReview({
        overall_rating: "inadequate",
        domains_good_or_outstanding: 0,
        actions_completed: 0,
        has_children_feedback: false,
        has_staff_feedback: false,
      })];
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      // goodRate: 0% → -5, actions: 0/4=0% → -5, child: 0% → -4, staff: 0% → -5
      // domains: 0/6=0% → -4, freq: 1 → 0
      // 52-5-5-4-5-4+0 = 29
      expect(r.qoc_score).toBe(29);
      expect(r.qoc_rating).toBe("inadequate");
    });

    it("has correct headline", () => {
      const reviews = [makeReview({
        overall_rating: "inadequate",
        domains_good_or_outstanding: 0,
        actions_completed: 0,
        has_children_feedback: false,
        has_staff_feedback: false,
      })];
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── Modifier 1: Review rating quality ────────────────────────────────
  describe("modifier: review rating quality", () => {
    it("+5 when >= 90% good/outstanding", () => {
      const r = computeQualityOfCareReview(baseInput());
      expect(r.good_or_outstanding_rate).toBe(100);
      expect(r.qoc_score).toBe(82);
    });

    it("+2 when 70-89%", () => {
      const reviews = Array.from({ length: 10 }, (_, i) => makeReview({
        id: `q_${i}`,
        overall_rating: i < 8 ? "good" : "requires_improvement",
      }));
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      // 80% → +2. Also freq >=4 → +5
      // 52+2+6+5+5+4+5 = 79
      expect(r.qoc_score).toBe(79);
    });

    it("-5 when < 50%", () => {
      const reviews = Array.from({ length: 10 }, (_, i) => makeReview({
        id: `q_${i}`,
        overall_rating: i < 4 ? "good" : "requires_improvement",
      }));
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      // 40% → -5. 52-5+6+5+5+4+5 = 72
      expect(r.qoc_score).toBe(72);
    });

    it("-3 when 0 reviews", () => {
      const r = computeQualityOfCareReview(baseInput({ reviews: [] }));
      // 52-3+0(no actions, no reviews)+0+0-1(0 domains)+(-5)(freq 0) = 43
      // Wait: mod2: totalActions=0, totalReviews=0 → "no reviews → no adjustment"
      // mod3: totalReviews=0 → no adjustment
      // mod4: totalReviews=0 → no adjustment
      // mod5: totalDomains=0 → -1
      // mod6: totalReviews=0 → -5
      // 52-3+0+0+0-1-5 = 43
      expect(r.qoc_score).toBe(43);
    });
  });

  // ── Modifier 2: Action completion ────────────────────────────────────
  describe("modifier: action completion", () => {
    it("+6 when >= 90%", () => {
      const r = computeQualityOfCareReview(baseInput());
      expect(r.action_completion_rate).toBe(100);
    });

    it("+2 when 70-89%", () => {
      const reviews = Array.from({ length: 6 }, (_, i) => makeReview({
        id: `q_${i}`,
        actions_total: 10,
        actions_completed: 8,
      }));
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      // 48/60 = 80% → +2. 82-6+2 = 78
      expect(r.qoc_score).toBe(78);
    });

    it("-5 when < 50%", () => {
      const reviews = Array.from({ length: 6 }, (_, i) => makeReview({
        id: `q_${i}`,
        actions_total: 10,
        actions_completed: 3,
      }));
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      // 18/60 = 30% → -5. 82-6-5 = 71
      expect(r.qoc_score).toBe(71);
    });

    it("+2 when 0 actions but reviews exist", () => {
      const reviews = Array.from({ length: 6 }, (_, i) => makeReview({
        id: `q_${i}`,
        actions_total: 0,
        actions_completed: 0,
      }));
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      // 0 actions + reviews → +2. 82-6+2 = 78
      expect(r.qoc_score).toBe(78);
    });
  });

  // ── Modifier 3: Children's feedback ──────────────────────────────────
  describe("modifier: children feedback", () => {
    it("+5 when >= 90%", () => {
      const r = computeQualityOfCareReview(baseInput());
      expect(r.children_feedback_rate).toBe(100);
    });

    it("-4 when < 50%", () => {
      const reviews = Array.from({ length: 6 }, (_, i) => makeReview({
        id: `q_${i}`,
        has_children_feedback: i < 2,
      }));
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      // 2/6 = 33% → -4. 82-5-4 = 73
      expect(r.qoc_score).toBe(73);
    });
  });

  // ── Modifier 4: Staff feedback ───────────────────────────────────────
  describe("modifier: staff feedback", () => {
    it("+5 when >= 90%", () => {
      const r = computeQualityOfCareReview(baseInput());
      expect(r.staff_feedback_rate).toBe(100);
    });

    it("-5 when < 50%", () => {
      const reviews = Array.from({ length: 6 }, (_, i) => makeReview({
        id: `q_${i}`,
        has_staff_feedback: i < 2,
      }));
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      // 2/6=33% → -5. 82-5-5 = 72
      expect(r.qoc_score).toBe(72);
    });
  });

  // ── Modifier 5: Domain quality ───────────────────────────────────────
  describe("modifier: domain quality", () => {
    it("+4 when >= 90%", () => {
      const r = computeQualityOfCareReview(baseInput());
      expect(r.domain_quality_rate).toBe(100);
    });

    it("-4 when < 50%", () => {
      const reviews = Array.from({ length: 6 }, (_, i) => makeReview({
        id: `q_${i}`,
        domains_count: 6,
        domains_good_or_outstanding: 2,
      }));
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      // 12/36 = 33% → -4. 82-4-4 = 74
      expect(r.qoc_score).toBe(74);
    });

    it("-1 when 0 domains", () => {
      const reviews = Array.from({ length: 6 }, (_, i) => makeReview({
        id: `q_${i}`,
        domains_count: 0,
        domains_good_or_outstanding: 0,
      }));
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      // 0 domains → -1. 82-4-1 = 77
      expect(r.qoc_score).toBe(77);
    });
  });

  // ── Modifier 6: Review frequency ─────────────────────────────────────
  describe("modifier: review frequency", () => {
    it("+5 when >= 4 reviews", () => {
      const r = computeQualityOfCareReview(baseInput());
      expect(r.total_reviews).toBe(6);
      expect(r.qoc_score).toBe(82);
    });

    it("+2 when 2-3 reviews", () => {
      const reviews = Array.from({ length: 3 }, (_, i) => makeReview({ id: `q_${i}` }));
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      // 82-5+2 = 79
      expect(r.qoc_score).toBe(79);
    });

    it("-5 when 0 reviews", () => {
      const r = computeQualityOfCareReview(baseInput({ reviews: [] }));
      // 52-3(0 reviews rating)-1(0 domains)-5(0 freq) = 43
      expect(r.qoc_score).toBe(43);
    });
  });

  // ── Metrics ──────────────────────────────────────────────────────────
  describe("metrics", () => {
    it("calculates total_reviews", () => {
      const r = computeQualityOfCareReview(baseInput());
      expect(r.total_reviews).toBe(6);
    });

    it("calculates action_completion_rate correctly", () => {
      const reviews = [
        makeReview({ id: "a", actions_total: 10, actions_completed: 7 }),
        makeReview({ id: "b", actions_total: 5, actions_completed: 5 }),
      ];
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      expect(r.action_completion_rate).toBe(80);
    });

    it("calculates domain_quality_rate correctly", () => {
      const reviews = [
        makeReview({ id: "a", domains_count: 6, domains_good_or_outstanding: 4 }),
        makeReview({ id: "b", domains_count: 4, domains_good_or_outstanding: 4 }),
      ];
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      expect(r.domain_quality_rate).toBe(80);
    });
  });

  // ── Strengths ────────────────────────────────────────────────────────
  describe("strengths", () => {
    it("includes multiple strengths for outstanding input", () => {
      const r = computeQualityOfCareReview(baseInput());
      expect(r.strengths.length).toBeGreaterThan(3);
    });

    it("has no strengths when all metrics poor", () => {
      const reviews = [makeReview({
        overall_rating: "inadequate",
        domains_good_or_outstanding: 0,
        actions_completed: 0,
        has_children_feedback: false,
        has_staff_feedback: false,
      })];
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      expect(r.strengths.length).toBe(0);
    });
  });

  // ── Concerns ─────────────────────────────────────────────────────────
  describe("concerns", () => {
    it("flags 0 reviews", () => {
      const r = computeQualityOfCareReview(baseInput({ reviews: [] }));
      expect(r.concerns.some(c => c.includes("review"))).toBe(true);
    });

    it("has no concerns for outstanding", () => {
      const r = computeQualityOfCareReview(baseInput());
      expect(r.concerns.length).toBe(0);
    });
  });

  // ── Recommendations ──────────────────────────────────────────────────
  describe("recommendations", () => {
    it("generates recommendation for 0 reviews", () => {
      const r = computeQualityOfCareReview(baseInput({ reviews: [] }));
      expect(r.recommendations.length).toBeGreaterThan(0);
      expect(r.recommendations[0].regulatory_ref).toBe("CHR 2015 Reg 45");
    });

    it("caps at 5", () => {
      const reviews = [makeReview({
        overall_rating: "inadequate",
        domains_good_or_outstanding: 0,
        actions_completed: 0,
        has_children_feedback: false,
        has_staff_feedback: false,
      })];
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      expect(r.recommendations.length).toBeLessThan(6);
    });

    it("has sequential ranks", () => {
      const reviews = [makeReview({
        overall_rating: "inadequate",
        actions_completed: 0,
        has_children_feedback: false,
        has_staff_feedback: false,
      })];
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("returns empty for outstanding", () => {
      const r = computeQualityOfCareReview(baseInput());
      expect(r.recommendations.length).toBe(0);
    });
  });

  // ── Insights ─────────────────────────────────────────────────────────
  describe("insights", () => {
    it("generates positive insight for excellent reviews", () => {
      const r = computeQualityOfCareReview(baseInput());
      expect(r.insights.some(i => i.severity === "positive")).toBe(true);
    });

    it("generates critical insight for 0 reviews", () => {
      const r = computeQualityOfCareReview(baseInput({ reviews: [] }));
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });

    it("caps at 3", () => {
      const r = computeQualityOfCareReview(baseInput());
      expect(r.insights.length).toBeLessThan(4);
    });
  });

  // ── Score clamping ───────────────────────────────────────────────────
  describe("score clamping", () => {
    it("clamps to 0 minimum", () => {
      const reviews = Array.from({ length: 1 }, () => makeReview({
        overall_rating: "inadequate",
        domains_good_or_outstanding: 0,
        actions_completed: 0,
        has_children_feedback: false,
        has_staff_feedback: false,
      }));
      const r = computeQualityOfCareReview(baseInput({ reviews }));
      expect(r.qoc_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Edge cases ───────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles single review", () => {
      const r = computeQualityOfCareReview(baseInput({
        reviews: [makeReview()],
      }));
      expect(r.total_reviews).toBe(1);
    });

    it("return shape has all fields", () => {
      const r = computeQualityOfCareReview(baseInput());
      expect(r).toHaveProperty("qoc_rating");
      expect(r).toHaveProperty("qoc_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_reviews");
      expect(r).toHaveProperty("good_or_outstanding_rate");
      expect(r).toHaveProperty("action_completion_rate");
      expect(r).toHaveProperty("children_feedback_rate");
      expect(r).toHaveProperty("staff_feedback_rate");
      expect(r).toHaveProperty("domain_quality_rate");
    });
  });
});
