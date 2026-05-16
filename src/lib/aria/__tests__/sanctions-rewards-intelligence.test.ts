// ══════════════════════════════════════════════════════════════════════════════
// Tests — Sanctions & Rewards Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  analyseSanctionsRewards,
  SanctionsRewardsInput,
  SanctionRecord,
  RewardRecord,
} from "../sanctions-rewards-intelligence";

// ── Helpers ─────────────────────────────────────────────────────────────────

const FIXED_NOW = new Date("2026-05-16T12:00:00Z").getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

function makeSanction(overrides: Partial<SanctionRecord> = {}): SanctionRecord {
  return {
    id: `s_${Math.random().toString(36).slice(2)}`,
    date: "2026-05-01",
    type: "loss_of_privilege",
    reason: "Late return from school",
    proportionate: true,
    childInformed: true,
    childUnderstood: true,
    linkedToBehaviour: true,
    staffMember: "Staff A",
    followedUp: true,
    effectivenessRating: 3,
    ...overrides,
  };
}

function makeReward(overrides: Partial<RewardRecord> = {}): RewardRecord {
  return {
    id: `r_${Math.random().toString(36).slice(2)}`,
    date: "2026-05-01",
    type: "verbal_praise",
    reason: "Helped with cooking",
    staffMember: "Staff A",
    childResponse: "positive",
    ...overrides,
  };
}

function makeInput(overrides: Partial<SanctionsRewardsInput> = {}): SanctionsRewardsInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    sanctions: [],
    rewards: [],
    hasBehaviourSupportPlan: true,
    bspUpToDate: true,
    childParticipatedInBSP: true,
    sanctionPolicyExplainedToChild: true,
    appealsProcessExplained: true,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════

describe("Sanctions & Rewards Intelligence Engine", () => {

  // ── Basic functionality ─────────────────────────────────────────────────

  describe("Basic functionality", () => {
    it("returns valid assessment structure", () => {
      const result = analyseSanctionsRewards(makeInput());
      expect(result).toHaveProperty("overallScore");
      expect(result).toHaveProperty("overallRating");
      expect(result).toHaveProperty("positivityScore");
      expect(result).toHaveProperty("proportionalityScore");
      expect(result).toHaveProperty("effectivenessScore");
      expect(result).toHaveProperty("complianceScore");
      expect(result).toHaveProperty("rewardToSanctionRatio");
      expect(result).toHaveProperty("staffConsistency");
      expect(result).toHaveProperty("concerns");
      expect(result).toHaveProperty("strengths");
      expect(result).toHaveProperty("regulatoryFlags");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("summary");
    });

    it("uses childName", () => {
      const result = analyseSanctionsRewards(makeInput({ childName: "Sam" }));
      expect(result.childName).toBe("Sam");
      expect(result.summary).toContain("Sam");
    });

    it("handles no sanctions or rewards", () => {
      const result = analyseSanctionsRewards(makeInput());
      expect(result.totalSanctions).toBe(0);
      expect(result.totalRewards).toBe(0);
      expect(result.concerns).toHaveLength(0);
    });
  });

  // ── Ratio calculation ──────────────────────────────────────────────────

  describe("Reward-to-sanction ratio", () => {
    it("calculates ratio correctly", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [makeSanction(), makeSanction()],
        rewards: [makeReward(), makeReward(), makeReward(), makeReward(), makeReward(), makeReward()],
      }));
      expect(result.rewardToSanctionRatio).toBe(3);
    });

    it("high ratio when no sanctions but rewards exist", () => {
      const result = analyseSanctionsRewards(makeInput({
        rewards: Array.from({ length: 5 }, () => makeReward()),
      }));
      expect(result.rewardToSanctionRatio).toBe(10);
    });

    it("zero ratio when sanctions but no rewards", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [makeSanction(), makeSanction()],
      }));
      expect(result.rewardToSanctionRatio).toBe(0);
    });
  });

  // ── Positivity scoring ─────────────────────────────────────────────────

  describe("Positivity scoring", () => {
    it("100 for 5:1 ratio or better", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [makeSanction()],
        rewards: Array.from({ length: 5 }, () => makeReward()),
      }));
      expect(result.positivityScore).toBe(100);
    });

    it("lower score for poor ratio", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: Array.from({ length: 5 }, (_, i) =>
          makeSanction({ date: `2026-05-${String(i + 1).padStart(2, "0")}` })
        ),
        rewards: [makeReward()],
      }));
      expect(result.positivityScore).toBeLessThan(50);
    });

    it("very low when sanctions but no rewards recently", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [makeSanction({ date: "2026-05-10" })],
        rewards: [],
      }));
      expect(result.positivityScore).toBeLessThan(30);
    });
  });

  // ── Proportionality scoring ────────────────────────────────────────────

  describe("Proportionality scoring", () => {
    it("100 for all proportionate, informed, linked", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [makeSanction(), makeSanction()],
      }));
      expect(result.proportionalityScore).toBe(100);
    });

    it("penalises disproportionate sanctions", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [
          makeSanction({ proportionate: false }),
          makeSanction({ proportionate: true }),
        ],
      }));
      expect(result.proportionalityScore).toBeLessThanOrEqual(80);
    });

    it("zero score for prohibited sanction", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [
          makeSanction({ isProhibited: true, prohibitedType: "corporal_punishment" }),
        ],
      }));
      expect(result.proportionalityScore).toBe(0);
    });

    it("penalises when child not informed", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [makeSanction({ childInformed: false, childUnderstood: false })],
      }));
      expect(result.proportionalityScore).toBeLessThan(70);
    });
  });

  // ── Compliance scoring ─────────────────────────────────────────────────

  describe("Compliance scoring", () => {
    it("full score with all compliance elements", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [makeSanction()],
      }));
      expect(result.complianceScore).toBe(100);
    });

    it("reduced without BSP", () => {
      const result = analyseSanctionsRewards(makeInput({
        hasBehaviourSupportPlan: false,
        childParticipatedInBSP: false,
        sanctions: [makeSanction()],
      }));
      expect(result.complianceScore).toBeLessThan(80);
    });

    it("heavily penalised for prohibited sanctions", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [makeSanction({ isProhibited: true })],
      }));
      expect(result.complianceScore).toBeLessThan(70);
    });
  });

  // ── Trend analysis ─────────────────────────────────────────────────────

  describe("Trend analysis", () => {
    it("improving when fewer recent sanctions", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [
          makeSanction({ date: "2026-04-01" }),
          makeSanction({ date: "2026-04-05" }),
          makeSanction({ date: "2026-04-10" }),
          // nothing in last 30 days
        ],
        rewards: [makeReward({ date: "2026-05-01" })],
      }));
      expect(result.trend).toBe("improving");
    });

    it("worsening when more recent sanctions", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [
          makeSanction({ date: "2026-05-01" }),
          makeSanction({ date: "2026-05-05" }),
          makeSanction({ date: "2026-05-10" }),
          // only 0 in previous period
        ],
      }));
      expect(result.trend).toBe("worsening");
    });

    it("stable when similar across periods", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [
          makeSanction({ date: "2026-04-05" }), // 41 days ago → in 30-60 window
          makeSanction({ date: "2026-05-05" }), // 11 days ago → in last 30 window
        ],
        rewards: [
          makeReward({ date: "2026-04-05" }),
          makeReward({ date: "2026-05-05" }),
        ],
      }));
      expect(result.trend).toBe("stable");
    });
  });

  // ── Staff consistency ──────────────────────────────────────────────────

  describe("Staff consistency", () => {
    it("consistent when similar counts", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [
          makeSanction({ staffMember: "Alice" }),
          makeSanction({ staffMember: "Bob" }),
          makeSanction({ staffMember: "Alice" }),
          makeSanction({ staffMember: "Bob" }),
        ],
      }));
      expect(result.staffConsistency.sanctionVariation).toBe("consistent");
    });

    it("inconsistent when one staff dominates", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [
          makeSanction({ staffMember: "Alice" }),
          makeSanction({ staffMember: "Alice" }),
          makeSanction({ staffMember: "Alice" }),
          makeSanction({ staffMember: "Alice" }),
          makeSanction({ staffMember: "Alice" }),
          makeSanction({ staffMember: "Bob" }),
        ],
      }));
      expect(result.staffConsistency.sanctionVariation).toBe("inconsistent");
    });

    it("counts total staff correctly", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [makeSanction({ staffMember: "Alice" })],
        rewards: [makeReward({ staffMember: "Bob" }), makeReward({ staffMember: "Carol" })],
      }));
      expect(result.staffConsistency.totalStaff).toBe(3);
    });
  });

  // ── Concerns ───────────────────────────────────────────────────────────

  describe("Concerns", () => {
    it("critical concern for prohibited sanctions", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [makeSanction({ isProhibited: true, prohibitedType: "deprivation_of_food" })],
      }));
      const concern = result.concerns.find(c => c.category === "prohibited_sanctions");
      expect(concern).toBeDefined();
      expect(concern!.severity).toBe("critical");
    });

    it("concern for poor ratio", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [makeSanction(), makeSanction(), makeSanction()],
        rewards: [makeReward()],
      }));
      const concern = result.concerns.find(c => c.category === "balance");
      expect(concern).toBeDefined();
    });

    it("concern for high frequency", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: Array.from({ length: 10 }, (_, i) =>
          makeSanction({ date: `2026-05-${String(i + 1).padStart(2, "0")}` })
        ),
      }));
      const concern = result.concerns.find(c => c.category === "frequency");
      expect(concern).toBeDefined();
    });

    it("concern for no BSP with repeated sanctions", () => {
      const result = analyseSanctionsRewards(makeInput({
        hasBehaviourSupportPlan: false,
        childParticipatedInBSP: false,
        sanctions: [makeSanction(), makeSanction(), makeSanction()],
      }));
      const concern = result.concerns.find(c => c.category === "care_planning");
      expect(concern).toBeDefined();
    });

    it("concern for staff inconsistency", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [
          ...Array.from({ length: 5 }, () => makeSanction({ staffMember: "Alice" })),
          makeSanction({ staffMember: "Bob" }),
        ],
      }));
      const concern = result.concerns.find(c => c.category === "consistency");
      expect(concern).toBeDefined();
    });

    it("no concerns for good practice", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [makeSanction()],
        rewards: Array.from({ length: 5 }, () => makeReward()),
      }));
      expect(result.concerns).toHaveLength(0);
    });
  });

  // ── Strengths ──────────────────────────────────────────────────────────

  describe("Strengths", () => {
    it("identifies excellent ratio", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [makeSanction()],
        rewards: Array.from({ length: 5 }, () => makeReward()),
      }));
      const s = result.strengths.find(s => s.category === "positivity");
      expect(s).toBeDefined();
    });

    it("identifies BSP with child participation", () => {
      const result = analyseSanctionsRewards(makeInput({
        rewards: [makeReward()],
      }));
      const s = result.strengths.find(s => s.category === "care_planning");
      expect(s).toBeDefined();
    });

    it("identifies transparency (policy + appeals explained)", () => {
      const result = analyseSanctionsRewards(makeInput({
        rewards: [makeReward()],
      }));
      const s = result.strengths.find(s => s.category === "transparency");
      expect(s).toBeDefined();
    });
  });

  // ── Regulatory flags ───────────────────────────────────────────────────

  describe("Regulatory flags", () => {
    it("all met for good practice", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [makeSanction()],
        rewards: Array.from({ length: 4 }, () => makeReward()),
      }));
      const unmet = result.regulatoryFlags.filter(f => f.status !== "met");
      expect(unmet).toHaveLength(0);
    });

    it("Reg 19(3) not_met for prohibited sanctions", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [makeSanction({ isProhibited: true })],
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 19(3)");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });

    it("Reg 19(2) not_met for no positive approach", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: Array.from({ length: 5 }, () => makeSanction()),
        rewards: [],
      }));
      const flag = result.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 19(2)");
      expect(flag).toBeDefined();
      expect(flag!.status).toBe("not_met");
    });
  });

  // ── Recommendations ────────────────────────────────────────────────────

  describe("Recommendations", () => {
    it("urgent recommendation for prohibited sanctions", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [makeSanction({ isProhibited: true })],
      }));
      expect(result.recommendations.some(r => r.includes("URGENT"))).toBe(true);
    });

    it("recommends increasing positive reinforcement", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [makeSanction(), makeSanction(), makeSanction()],
        rewards: [makeReward()],
      }));
      expect(result.recommendations.some(r => r.includes("positive reinforcement"))).toBe(true);
    });

    it("recommends BSP when missing", () => {
      const result = analyseSanctionsRewards(makeInput({
        hasBehaviourSupportPlan: false,
        childParticipatedInBSP: false,
        sanctions: [makeSanction(), makeSanction(), makeSanction()],
      }));
      expect(result.recommendations.some(r => r.includes("Behaviour Support Plan"))).toBe(true);
    });

    it("recommends explaining appeals process", () => {
      const result = analyseSanctionsRewards(makeInput({
        appealsProcessExplained: false,
        sanctions: [makeSanction()],
      }));
      expect(result.recommendations.some(r => r.includes("appeal"))).toBe(true);
    });

    it("minimal recommendations for good practice", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [makeSanction()],
        rewards: Array.from({ length: 5 }, () => makeReward()),
      }));
      expect(result.recommendations.length).toBeLessThanOrEqual(1);
    });
  });

  // ── Overall scoring ────────────────────────────────────────────────────

  describe("Overall scoring", () => {
    it("excellent for good practice", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [makeSanction()],
        rewards: Array.from({ length: 5 }, () => makeReward()),
      }));
      expect(result.overallRating).toBe("excellent");
    });

    it("low rating for prohibited + poor ratio", () => {
      const result = analyseSanctionsRewards(makeInput({
        sanctions: [
          makeSanction({ isProhibited: true }),
          makeSanction({ proportionate: false }),
          makeSanction({ proportionate: false }),
        ],
        rewards: [],
        hasBehaviourSupportPlan: false,
        childParticipatedInBSP: false,
        sanctionPolicyExplainedToChild: false,
        appealsProcessExplained: false,
      }));
      expect(["inadequate", "requires_improvement"]).toContain(result.overallRating);
    });
  });
});
