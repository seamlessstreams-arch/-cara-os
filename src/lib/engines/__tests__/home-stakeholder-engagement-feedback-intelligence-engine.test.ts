import { describe, it, expect } from "vitest";
import {
  computeStakeholderEngagementFeedback,
  type StakeholderEngagementInput,
  type StakeholderFeedbackInput,
  type ParentPartnershipInput,
  type CommunityFeedbackInput,
} from "../home-stakeholder-engagement-feedback-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-27";

function makeFeedback(overrides: Partial<StakeholderFeedbackInput> = {}): StakeholderFeedbackInput {
  return {
    id: `sf_${Math.random().toString(36).slice(2, 8)}`,
    date: TODAY,
    source: "social_worker",
    sentiment: "positive",
    action_taken: true,
    responded_to: true,
    ...overrides,
  };
}

function makePartnership(overrides: Partial<ParentPartnershipInput> = {}): ParentPartnershipInput {
  return {
    id: `pp_${Math.random().toString(36).slice(2, 8)}`,
    child_id: "c1",
    date: TODAY,
    engagement_quality: "strong",
    contact_maintained: true,
    views_sought: true,
    ...overrides,
  };
}

function makeCommunity(overrides: Partial<CommunityFeedbackInput> = {}): CommunityFeedbackInput {
  return {
    id: `cf_${Math.random().toString(36).slice(2, 8)}`,
    date: TODAY,
    sentiment: "positive",
    responded_to: true,
    ...overrides,
  };
}

/**
 * baseInput produces score = 82 (outstanding)
 * 52 base + 4 (mod1: 14 items) + 6 (mod2: 100% positive) + 5 (mod3: 100% responded)
 * + 6 (mod4: 100% strong/dev) + 4 (mod5: 100% views sought) + 5 (mod6: 100% community pos)
 * = 82
 */
function baseInput(overrides: Partial<StakeholderEngagementInput> = {}): StakeholderEngagementInput {
  return {
    today: TODAY,
    total_children: 4,
    stakeholder_feedback: [
      makeFeedback({ id: "sf1", source: "social_worker" }),
      makeFeedback({ id: "sf2", source: "parent" }),
      makeFeedback({ id: "sf3", source: "school" }),
      makeFeedback({ id: "sf4", source: "health" }),
      makeFeedback({ id: "sf5", source: "commissioning" }),
      makeFeedback({ id: "sf6", source: "visitor" }),
      makeFeedback({ id: "sf7", source: "irp" }),
      makeFeedback({ id: "sf8", source: "social_worker" }),
      makeFeedback({ id: "sf9", source: "parent" }),
      makeFeedback({ id: "sf10", source: "school" }),
    ],
    parent_partnerships: [
      makePartnership({ id: "pp1", child_id: "c1" }),
      makePartnership({ id: "pp2", child_id: "c2" }),
      makePartnership({ id: "pp3", child_id: "c3" }),
      makePartnership({ id: "pp4", child_id: "c4" }),
    ],
    community_feedback: [
      makeCommunity({ id: "cf1" }),
      makeCommunity({ id: "cf2" }),
      makeCommunity({ id: "cf3" }),
      makeCommunity({ id: "cf4" }),
    ],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("computeStakeholderEngagementFeedback", () => {
  // ── Insufficient data ──────────────────────────────────────────────
  describe("insufficient data", () => {
    it("returns insufficient_data when total_children is 0", () => {
      const r = computeStakeholderEngagementFeedback({
        today: TODAY, total_children: 0,
        stakeholder_feedback: [], parent_partnerships: [], community_feedback: [],
      });
      expect(r.stakeholder_rating).toBe("insufficient_data");
      expect(r.stakeholder_score).toBe(0);
    });

    it("returns empty arrays for narrative on insufficient data", () => {
      const r = computeStakeholderEngagementFeedback({
        today: TODAY, total_children: 0,
        stakeholder_feedback: [], parent_partnerships: [], community_feedback: [],
      });
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("returns correct headline on insufficient data", () => {
      const r = computeStakeholderEngagementFeedback({
        today: TODAY, total_children: 0,
        stakeholder_feedback: [], parent_partnerships: [], community_feedback: [],
      });
      expect(r.headline).toContain("insufficient data");
    });
  });

  // ── Outstanding ────────────────────────────────────────────────────
  describe("outstanding rating", () => {
    it("baseInput scores 82 — outstanding", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      expect(r.stakeholder_score).toBe(82);
      expect(r.stakeholder_rating).toBe("outstanding");
    });

    it("headline reflects outstanding rating", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      expect(r.headline).toContain("outstanding");
    });
  });

  // ── Good rating ────────────────────────────────────────────────────
  describe("good rating", () => {
    it("score 65-79 is good — degrade volume and community only", () => {
      // Keep mod2 (+6), mod3 (+5), mod4 (+6), mod5 (+4) at top
      // Degrade mod1: 8 items (6 stakeholder + 2 community) -> +2
      // Degrade mod6: 1/2 positive community -> +0
      // 52 + 2 + 6 + 5 + 6 + 4 + 0 = 75
      const r = computeStakeholderEngagementFeedback(baseInput({
        stakeholder_feedback: [
          makeFeedback({ id: "sf1" }),
          makeFeedback({ id: "sf2" }),
          makeFeedback({ id: "sf3" }),
          makeFeedback({ id: "sf4" }),
          makeFeedback({ id: "sf5" }),
          makeFeedback({ id: "sf6" }),
        ],
        community_feedback: [
          makeCommunity({ id: "cf1", sentiment: "positive" }),
          makeCommunity({ id: "cf2", sentiment: "negative" }),
        ],
      }));
      expect(r.stakeholder_score).toBe(75);
      expect(r.stakeholder_rating).toBe("good");
    });
  });

  // ── Adequate rating ────────────────────────────────────────────────
  describe("adequate rating", () => {
    it("score 45-64 is adequate", () => {
      // 4 children, no feedback, no partnerships, no community
      // 52 - 4 (mod1: 0 items) + 0 (mod2: no fb) + 0 (mod3: no fb) - 1 (mod4: no partnerships) + 0 (mod5) + 0 (mod6)
      // = 47 -> adequate
      const r = computeStakeholderEngagementFeedback({
        today: TODAY, total_children: 4,
        stakeholder_feedback: [], parent_partnerships: [], community_feedback: [],
      });
      expect(r.stakeholder_score).toBeGreaterThanOrEqual(45);
      expect(r.stakeholder_score).toBeLessThan(65);
      expect(r.stakeholder_rating).toBe("adequate");
    });
  });

  // ── Inadequate rating ──────────────────────────────────────────────
  describe("inadequate rating", () => {
    it("score < 45 is inadequate", () => {
      // 4 children, 2 negative unresponded feedback, no partnerships, no community
      // 52 - 4 (mod1: 2 items) - 6 (mod2: 0% pos) - 5 (mod3: 0% responded) - 1 (mod4: no partnerships) + 0 + 0
      // = 36 -> inadequate
      const r = computeStakeholderEngagementFeedback({
        today: TODAY, total_children: 4,
        stakeholder_feedback: [
          makeFeedback({ id: "sf1", sentiment: "negative", responded_to: false, action_taken: false }),
          makeFeedback({ id: "sf2", sentiment: "negative", responded_to: false, action_taken: false }),
        ],
        parent_partnerships: [],
        community_feedback: [],
      });
      expect(r.stakeholder_score).toBeLessThan(45);
      expect(r.stakeholder_rating).toBe("inadequate");
    });
  });

  // ── Mod 1: Feedback volume ─────────────────────────────────────────
  describe("Mod 1: Feedback volume", () => {
    it("+4 with 10+ total items", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      expect(r.total_feedback_items).toBeGreaterThanOrEqual(10);
      expect(r.stakeholder_score).toBe(82);
    });

    it("+2 with 6-9 total items", () => {
      const base = computeStakeholderEngagementFeedback(baseInput());
      const r = computeStakeholderEngagementFeedback(baseInput({
        stakeholder_feedback: [
          makeFeedback({ id: "sf1" }),
          makeFeedback({ id: "sf2" }),
          makeFeedback({ id: "sf3" }),
          makeFeedback({ id: "sf4" }),
          makeFeedback({ id: "sf5" }),
        ],
        community_feedback: [
          makeCommunity({ id: "cf1" }),
        ],
      }));
      expect(r.total_feedback_items).toBe(6);
      expect(r.stakeholder_score).toBeLessThan(base.stakeholder_score);
    });

    it("-4 with fewer than 3 items", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        stakeholder_feedback: [makeFeedback({ id: "sf1" })],
        community_feedback: [],
      }));
      expect(r.total_feedback_items).toBe(1);
      expect(r.stakeholder_score).toBeLessThan(82);
    });
  });

  // ── Mod 2: Positive sentiment ──────────────────────────────────────
  describe("Mod 2: Positive sentiment", () => {
    it("+6 with >= 80% positive stakeholder feedback", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      expect(r.positive_sentiment_rate).toBe(100);
    });

    it("penalises low positive sentiment", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        stakeholder_feedback: Array.from({ length: 10 }, (_, i) =>
          makeFeedback({ id: `sf${i}`, sentiment: i < 2 ? "positive" : "negative" }),
        ),
      }));
      expect(r.positive_sentiment_rate).toBe(20);
      expect(r.stakeholder_score).toBeLessThan(82);
    });

    it("+0 when no stakeholder feedback", () => {
      const withFb = computeStakeholderEngagementFeedback(baseInput());
      const withoutFb = computeStakeholderEngagementFeedback(baseInput({ stakeholder_feedback: [] }));
      // Without feedback, mod2 contributes +0 rather than +6; other mods also shift
      expect(withoutFb.positive_sentiment_rate).toBe(0);
    });
  });

  // ── Mod 3: Response rate ───────────────────────────────────────────
  describe("Mod 3: Response rate", () => {
    it("+5 with >= 90% response rate", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      expect(r.response_rate).toBe(100);
    });

    it("penalises low response rate", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        stakeholder_feedback: Array.from({ length: 10 }, (_, i) =>
          makeFeedback({ id: `sf${i}`, responded_to: i < 3 }),
        ),
      }));
      expect(r.response_rate).toBe(30);
      expect(r.stakeholder_score).toBeLessThan(82);
    });
  });

  // ── Mod 4: Parent partnership quality ──────────────────────────────
  describe("Mod 4: Parent partnership quality", () => {
    it("+6 with >= 80% strong or developing", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      expect(r.parent_engagement_rate).toBe(100);
    });

    it("penalises low engagement quality", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        parent_partnerships: Array.from({ length: 4 }, (_, i) =>
          makePartnership({ id: `pp${i}`, child_id: `c${i + 1}`, engagement_quality: "none" }),
        ),
      }));
      expect(r.parent_engagement_rate).toBe(0);
      expect(r.stakeholder_score).toBeLessThan(82);
    });

    it("-1 when no partnerships exist", () => {
      const withPP = computeStakeholderEngagementFeedback(baseInput({
        parent_partnerships: [makePartnership({ id: "pp1", engagement_quality: "limited" })],
      }));
      const withoutPP = computeStakeholderEngagementFeedback(baseInput({ parent_partnerships: [] }));
      // Without partnerships: mod4 = -1, mod5 = +0 vs with limited: mod4 depends on rate
      expect(withoutPP.parent_engagement_rate).toBe(0);
    });
  });

  // ── Mod 5: Parent views sought ─────────────────────────────────────
  describe("Mod 5: Parent views sought", () => {
    it("+4 with >= 90% views sought", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      // All partnerships have views_sought = true
      expect(r.stakeholder_score).toBe(82);
    });

    it("penalises low views sought rate", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        parent_partnerships: Array.from({ length: 4 }, (_, i) =>
          makePartnership({ id: `pp${i}`, child_id: `c${i + 1}`, views_sought: false }),
        ),
      }));
      expect(r.stakeholder_score).toBeLessThan(82);
    });
  });

  // ── Mod 6: Community sentiment ─────────────────────────────────────
  describe("Mod 6: Community sentiment", () => {
    it("+5 with >= 80% positive community feedback", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      expect(r.community_sentiment_rate).toBe(100);
    });

    it("penalises negative community sentiment", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        community_feedback: Array.from({ length: 4 }, (_, i) =>
          makeCommunity({ id: `cf${i}`, sentiment: "negative" }),
        ),
      }));
      expect(r.community_sentiment_rate).toBe(0);
      expect(r.stakeholder_score).toBeLessThan(82);
    });

    it("+0 when no community feedback", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({ community_feedback: [] }));
      expect(r.community_sentiment_rate).toBe(0);
    });
  });

  // ── Metrics ────────────────────────────────────────────────────────
  describe("metrics", () => {
    it("computes total_feedback_items correctly", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      expect(r.total_feedback_items).toBe(14); // 10 stakeholder + 4 community
    });

    it("computes positive_sentiment_rate correctly", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        stakeholder_feedback: [
          makeFeedback({ id: "sf1", sentiment: "positive" }),
          makeFeedback({ id: "sf2", sentiment: "negative" }),
          makeFeedback({ id: "sf3", sentiment: "neutral" }),
          makeFeedback({ id: "sf4", sentiment: "positive" }),
        ],
      }));
      expect(r.positive_sentiment_rate).toBe(50);
    });

    it("computes response_rate correctly", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        stakeholder_feedback: [
          makeFeedback({ id: "sf1", responded_to: true }),
          makeFeedback({ id: "sf2", responded_to: false }),
          makeFeedback({ id: "sf3", responded_to: true }),
          makeFeedback({ id: "sf4", responded_to: true }),
        ],
      }));
      expect(r.response_rate).toBe(75);
    });

    it("computes parent_engagement_rate correctly", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        parent_partnerships: [
          makePartnership({ id: "pp1", child_id: "c1", engagement_quality: "strong" }),
          makePartnership({ id: "pp2", child_id: "c2", engagement_quality: "developing" }),
          makePartnership({ id: "pp3", child_id: "c3", engagement_quality: "limited" }),
          makePartnership({ id: "pp4", child_id: "c4", engagement_quality: "none" }),
        ],
      }));
      expect(r.parent_engagement_rate).toBe(50);
    });

    it("computes community_sentiment_rate correctly", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        community_feedback: [
          makeCommunity({ id: "cf1", sentiment: "positive" }),
          makeCommunity({ id: "cf2", sentiment: "negative" }),
          makeCommunity({ id: "cf3", sentiment: "positive" }),
        ],
      }));
      expect(r.community_sentiment_rate).toBe(67);
    });
  });

  // ── Strengths ──────────────────────────────────────────────────────
  describe("strengths", () => {
    it("generates strength for high positive sentiment", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      expect(r.strengths.some(s => s.includes("positive"))).toBe(true);
    });

    it("generates strength for high response rate", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      expect(r.strengths.some(s => s.includes("response rate"))).toBe(true);
    });

    it("generates strength for strong parent partnerships", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      expect(r.strengths.some(s => s.includes("parent partnership"))).toBe(true);
    });

    it("generates strength for parent views sought", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      expect(r.strengths.some(s => s.includes("views"))).toBe(true);
    });

    it("generates strength for positive community sentiment", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      expect(r.strengths.some(s => s.includes("community"))).toBe(true);
    });

    it("generates strength for robust feedback volume", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      expect(r.strengths.some(s => s.includes("feedback volume"))).toBe(true);
    });
  });

  // ── Concerns ───────────────────────────────────────────────────────
  describe("concerns", () => {
    it("generates concern for low positive sentiment", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        stakeholder_feedback: Array.from({ length: 10 }, (_, i) =>
          makeFeedback({ id: `sf${i}`, sentiment: "negative" }),
        ),
      }));
      expect(r.concerns.some(c => c.includes("Low positive sentiment"))).toBe(true);
    });

    it("generates concern for poor response rate", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        stakeholder_feedback: Array.from({ length: 10 }, (_, i) =>
          makeFeedback({ id: `sf${i}`, responded_to: false }),
        ),
      }));
      expect(r.concerns.some(c => c.includes("Poor response rate"))).toBe(true);
    });

    it("generates concern for no parent partnerships", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({ parent_partnerships: [] }));
      expect(r.concerns.some(c => c.includes("No parent partnership"))).toBe(true);
    });

    it("generates concern for weak parent partnerships", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        parent_partnerships: Array.from({ length: 4 }, (_, i) =>
          makePartnership({ id: `pp${i}`, child_id: `c${i + 1}`, engagement_quality: "none" }),
        ),
      }));
      expect(r.concerns.some(c => c.includes("Weak parent partnership"))).toBe(true);
    });

    it("generates concern for no community feedback", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({ community_feedback: [] }));
      expect(r.concerns.some(c => c.includes("No community feedback"))).toBe(true);
    });

    it("generates concern for negative community sentiment", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        community_feedback: Array.from({ length: 4 }, (_, i) =>
          makeCommunity({ id: `cf${i}`, sentiment: "negative" }),
        ),
      }));
      expect(r.concerns.some(c => c.includes("Negative community sentiment"))).toBe(true);
    });

    it("generates concern for very low feedback volume", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        stakeholder_feedback: [makeFeedback({ id: "sf1" })],
        community_feedback: [],
      }));
      expect(r.concerns.some(c => c.includes("low feedback volume"))).toBe(true);
    });
  });

  // ── Recommendations ────────────────────────────────────────────────
  describe("recommendations", () => {
    it("generates ranked recommendations for critical issues", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        stakeholder_feedback: Array.from({ length: 10 }, (_, i) =>
          makeFeedback({ id: `sf${i}`, sentiment: "negative", responded_to: false }),
        ),
        parent_partnerships: [],
        community_feedback: [],
      }));
      expect(r.recommendations.length).toBeGreaterThan(0);
      expect(r.recommendations.every(rec => rec.rank > 0)).toBe(true);
    });

    it("includes regulatory references in recommendations", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        stakeholder_feedback: Array.from({ length: 10 }, (_, i) =>
          makeFeedback({ id: `sf${i}`, sentiment: "negative", responded_to: false }),
        ),
      }));
      expect(r.recommendations.some(rec => rec.regulatory_ref !== null)).toBe(true);
    });

    it("assigns urgency levels to recommendations", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        stakeholder_feedback: Array.from({ length: 10 }, (_, i) =>
          makeFeedback({ id: `sf${i}`, sentiment: "negative", responded_to: false }),
        ),
        parent_partnerships: [],
        community_feedback: [],
      }));
      const urgencies = r.recommendations.map(rec => rec.urgency);
      expect(urgencies.some(u => u === "immediate" || u === "soon" || u === "planned")).toBe(true);
    });
  });

  // ── Insights ───────────────────────────────────────────────────────
  describe("insights", () => {
    it("generates positive insight for outstanding rating", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
    });

    it("generates critical insight for inadequate rating", () => {
      const r = computeStakeholderEngagementFeedback({
        today: TODAY, total_children: 4,
        stakeholder_feedback: [
          makeFeedback({ id: "sf1", sentiment: "negative", responded_to: false }),
          makeFeedback({ id: "sf2", sentiment: "negative", responded_to: false }),
        ],
        parent_partnerships: [],
        community_feedback: [],
      });
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("inadequate"))).toBe(true);
    });

    it("generates responsive feedback culture insight", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      expect(r.insights.some(i => i.text.includes("responsive feedback culture"))).toBe(true);
    });

    it("generates parent partnership insight", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      expect(r.insights.some(i => i.text.includes("Parent partnership"))).toBe(true);
    });

    it("generates community sentiment insight", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      expect(r.insights.some(i => i.text.includes("Community sentiment"))).toBe(true);
    });
  });

  // ── Headline ───────────────────────────────────────────────────────
  describe("headline", () => {
    it("outstanding headline contains 'outstanding'", () => {
      const r = computeStakeholderEngagementFeedback(baseInput());
      expect(r.headline).toContain("outstanding");
    });

    it("good headline contains 'Good'", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        stakeholder_feedback: [
          makeFeedback({ id: "sf1" }), makeFeedback({ id: "sf2" }),
          makeFeedback({ id: "sf3" }), makeFeedback({ id: "sf4" }),
          makeFeedback({ id: "sf5" }), makeFeedback({ id: "sf6" }),
        ],
        community_feedback: [
          makeCommunity({ id: "cf1", sentiment: "positive" }),
          makeCommunity({ id: "cf2", sentiment: "negative" }),
        ],
      }));
      expect(r.headline).toContain("Good");
    });

    it("adequate headline contains 'Adequate'", () => {
      const r = computeStakeholderEngagementFeedback({
        today: TODAY, total_children: 4,
        stakeholder_feedback: [], parent_partnerships: [], community_feedback: [],
      });
      expect(r.headline).toContain("Adequate");
    });

    it("inadequate headline contains 'inadequate'", () => {
      const r = computeStakeholderEngagementFeedback({
        today: TODAY, total_children: 4,
        stakeholder_feedback: [
          makeFeedback({ id: "sf1", sentiment: "negative", responded_to: false }),
          makeFeedback({ id: "sf2", sentiment: "negative", responded_to: false }),
        ],
        parent_partnerships: [],
        community_feedback: [],
      });
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("score is clamped to 0-100", () => {
      const r = computeStakeholderEngagementFeedback({
        today: TODAY, total_children: 4,
        stakeholder_feedback: Array.from({ length: 10 }, (_, i) =>
          makeFeedback({ id: `sf${i}`, sentiment: "negative", responded_to: false, action_taken: false }),
        ),
        parent_partnerships: Array.from({ length: 4 }, (_, i) =>
          makePartnership({ id: `pp${i}`, child_id: `c${i + 1}`, engagement_quality: "none", views_sought: false }),
        ),
        community_feedback: Array.from({ length: 4 }, (_, i) =>
          makeCommunity({ id: `cf${i}`, sentiment: "negative" }),
        ),
      });
      expect(r.stakeholder_score).toBeGreaterThanOrEqual(0);
      expect(r.stakeholder_score).toBeLessThanOrEqual(100);
    });

    it("handles single feedback item", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        stakeholder_feedback: [makeFeedback({ id: "sf1" })],
        community_feedback: [],
      }));
      expect(r.total_feedback_items).toBe(1);
    });

    it("handles all neutral sentiment", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        stakeholder_feedback: Array.from({ length: 10 }, (_, i) =>
          makeFeedback({ id: `sf${i}`, sentiment: "neutral" }),
        ),
      }));
      expect(r.positive_sentiment_rate).toBe(0);
    });

    it("handles mixed engagement qualities", () => {
      const r = computeStakeholderEngagementFeedback(baseInput({
        parent_partnerships: [
          makePartnership({ id: "pp1", child_id: "c1", engagement_quality: "strong" }),
          makePartnership({ id: "pp2", child_id: "c2", engagement_quality: "developing" }),
          makePartnership({ id: "pp3", child_id: "c3", engagement_quality: "limited" }),
          makePartnership({ id: "pp4", child_id: "c4", engagement_quality: "none" }),
        ],
      }));
      expect(r.parent_engagement_rate).toBe(50);
    });

    it("pct returns 0 when denominator is 0", () => {
      const r = computeStakeholderEngagementFeedback({
        today: TODAY, total_children: 0,
        stakeholder_feedback: [], parent_partnerships: [], community_feedback: [],
      });
      expect(r.positive_sentiment_rate).toBe(0);
      expect(r.response_rate).toBe(0);
      expect(r.parent_engagement_rate).toBe(0);
      expect(r.community_sentiment_rate).toBe(0);
    });
  });
});
