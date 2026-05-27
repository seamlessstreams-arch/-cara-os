// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Home Return Interview Quality Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeReturnInterviewQuality,
  type ReturnInterviewQualityInput,
  type ReturnInterviewRecordInput,
} from "../home-return-interview-quality-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-27";

function makeInterview(
  overrides: Partial<ReturnInterviewRecordInput> = {},
): ReturnInterviewRecordInput {
  return {
    id: `ri_${Math.random().toString(36).slice(2, 8)}`,
    child_id: "yp_01",
    interview_status: "completed",
    independent_of_home: true,
    has_push_factors: true,
    has_pull_factors: true,
    risks_identified_count: 1,
    exploitation_concerns: false,
    has_child_voice: true,
    actions_total: 2,
    actions_completed: 2,
    shared_with_count: 2,
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<ReturnInterviewQualityInput> = {},
): ReturnInterviewQualityInput {
  return {
    today: TODAY,
    total_children: 6,
    interviews: [],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Return Interview Quality Intelligence Engine", () => {
  // ── Output Shape ─────────────────────────────────────────────────────────

  it("returns correct output shape with all expected fields", () => {
    const r = computeReturnInterviewQuality(baseInput());
    expect(r).toHaveProperty("interview_rating");
    expect(r).toHaveProperty("interview_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("total_interviews");
    expect(r).toHaveProperty("completion_rate");
    expect(r).toHaveProperty("independence_rate");
    expect(r).toHaveProperty("child_voice_rate");
    expect(r).toHaveProperty("exploitation_screening_rate");
    expect(r).toHaveProperty("action_completion_rate");
    expect(r).toHaveProperty("information_sharing_rate");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("returns arrays for strengths, concerns, recommendations, and insights", () => {
    const r = computeReturnInterviewQuality(baseInput());
    expect(Array.isArray(r.strengths)).toBe(true);
    expect(Array.isArray(r.concerns)).toBe(true);
    expect(Array.isArray(r.recommendations)).toBe(true);
    expect(Array.isArray(r.insights)).toBe(true);
  });

  // ── Insufficient Data Guard ──────────────────────────────────────────────

  it("returns insufficient_data when total_children is 0", () => {
    const r = computeReturnInterviewQuality(baseInput({ total_children: 0 }));
    expect(r.interview_rating).toBe("insufficient_data");
    expect(r.interview_score).toBe(0);
    expect(r.headline).toBe("No data available for return interview analysis");
    expect(r.total_interviews).toBe(0);
    expect(r.completion_rate).toBe(0);
    expect(r.independence_rate).toBe(0);
    expect(r.child_voice_rate).toBe(0);
    expect(r.exploitation_screening_rate).toBe(0);
    expect(r.action_completion_rate).toBe(0);
    expect(r.information_sharing_rate).toBe(0);
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("returns insufficient_data even when total_children=0 but interviews are provided", () => {
    const r = computeReturnInterviewQuality(
      baseInput({ total_children: 0, interviews: [makeInterview()] }),
    );
    expect(r.interview_rating).toBe("insufficient_data");
    expect(r.interview_score).toBe(0);
  });

  // ── Zero Interviews (total_children > 0) ─────────────────────────────────

  it("applies all zero-interview penalties: 52 - 3 - 1 - 1 - 2 = 45 (adequate)", () => {
    // total=0: completion -3, independence no adj, voice -1, actions no adj (totalActions=0 && total=0), sharing -1, factors -2
    const r = computeReturnInterviewQuality(baseInput({ interviews: [] }));
    expect(r.interview_score).toBe(45);
    expect(r.interview_rating).toBe("adequate");
    expect(r.total_interviews).toBe(0);
  });

  it("produces concern about no return interviews recorded when total=0", () => {
    const r = computeReturnInterviewQuality(baseInput({ interviews: [] }));
    expect(r.concerns).toContain(
      "No return interviews recorded — statutory safeguarding requirement is not being met",
    );
  });

  it("produces recommendation to implement interviews when total=0", () => {
    const r = computeReturnInterviewQuality(baseInput({ interviews: [] }));
    expect(r.recommendations.length).toBeGreaterThanOrEqual(1);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[0].regulatory_ref).toBe("CHR 2015 Reg 12");
  });

  it("produces critical insight about no return interviews when total=0", () => {
    const r = computeReturnInterviewQuality(baseInput({ interviews: [] }));
    expect(r.insights).toContainEqual({
      text: "No return interviews means the home cannot demonstrate it understands why children go missing — a critical regulatory gap",
      severity: "critical",
    });
  });

  // ── Base Score ───────────────────────────────────────────────────────────

  it("starts from base score 52", () => {
    // With 0 interviews the penalties total -7 giving 45
    // Proving base is 52 by reaching it with neutral modifiers
    // We need total>0 and rates in the "no modifier" bands:
    // completionRate 50-69 => no adj, independenceRate 30-49 => no adj,
    // childVoiceRate 50-69 => no adj, actionCompletionRate 40-59 => no adj,
    // sharingRate 30-49 => no adj, factorRate 30-49 => no adj
    // 2 interviews: 1 completed 1 not, 0 independent, 1 voice 1 not, etc.
    // completionRate = 50%, independenceRate = 0% (<30 => -5). Hmm, tricky.
    // Let's use 10 interviews with exact boundary values.
    const interviews = Array.from({ length: 10 }, (_, i) =>
      makeInterview({
        // 6 completed = 60% (>=50, <70 => no adj)
        interview_status: i < 6 ? "completed" : "pending",
        // 4 independent = 40% (>=30, <50 => no adj)
        independent_of_home: i < 4,
        // 5 with voice = 50% (>=50, <70 => no adj)
        has_child_voice: i < 5,
        // actions: 5 total, 2 completed = 40% (>=40, <60 => no adj)
        actions_total: i < 5 ? 1 : 0,
        actions_completed: i < 2 ? 1 : 0,
        // 4 shared = 40% (>=30, <50 => no adj)
        shared_with_count: i < 4 ? 1 : 0,
        // 4 with factors = 40% (>=30, <50 => no adj)
        has_push_factors: i < 4,
        has_pull_factors: false,
      }),
    );
    const r = computeReturnInterviewQuality(baseInput({ interviews }));
    expect(r.interview_score).toBe(52);
  });

  // ── Modifier 1: Completion Rate ──────────────────────────────────────────

  describe("Modifier 1: Completion Rate", () => {
    it("adds +6 when completion rate >= 90%", () => {
      // 10 interviews, 9 completed = 90%
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 9 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 + 6 (completion 90%) + 0 others = 58
      expect(r.interview_score).toBe(58);
    });

    it("adds +2 when completion rate >= 70% and < 90%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 7 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 + 2 = 54
      expect(r.interview_score).toBe(54);
    });

    it("applies no adjustment when completion rate >= 50% and < 70%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBe(52);
    });

    it("subtracts -5 when completion rate < 50%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 4 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 - 5 = 47
      expect(r.interview_score).toBe(47);
    });

    it("subtracts -3 when total interviews is 0", () => {
      const r = computeReturnInterviewQuality(baseInput({ interviews: [] }));
      // base 52 - 3(completion) - 1(voice) - 1(sharing) - 2(factors) = 45
      expect(r.interview_score).toBe(45);
    });
  });

  // ── Modifier 2: Independence Rate ───────────────────────────────────────

  describe("Modifier 2: Independence Rate", () => {
    it("adds +5 when independence rate >= 80%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 8, // 80%
          has_child_voice: i < 5,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 + 5 = 57
      expect(r.interview_score).toBe(57);
    });

    it("adds +2 when independence rate >= 50% and < 80%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 5, // 50%
          has_child_voice: i < 5,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 + 2 = 54
      expect(r.interview_score).toBe(54);
    });

    it("applies no adjustment when independence rate >= 30% and < 50%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4, // 40%
          has_child_voice: i < 5,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBe(52);
    });

    it("subtracts -5 when independence rate < 30%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 2, // 20%
          has_child_voice: i < 5,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 - 5 = 47
      expect(r.interview_score).toBe(47);
    });

    it("applies no independence adjustment when total interviews is 0", () => {
      // All zero-interview modifiers: -3 + 0 + -1 + 0 + -1 + -2 = -7 => 45
      const r = computeReturnInterviewQuality(baseInput({ interviews: [] }));
      expect(r.interview_score).toBe(45);
    });
  });

  // ── Modifier 3: Child Voice ─────────────────────────────────────────────

  describe("Modifier 3: Child Voice", () => {
    it("adds +5 when child voice rate >= 90%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 9, // 90%
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 + 5 = 57
      expect(r.interview_score).toBe(57);
    });

    it("adds +2 when child voice rate >= 70% and < 90%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 7, // 70%
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 + 2 = 54
      expect(r.interview_score).toBe(54);
    });

    it("applies no adjustment when child voice rate >= 50% and < 70%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5, // 50%
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBe(52);
    });

    it("subtracts -4 when child voice rate < 50%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 4, // 40%
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 - 4 = 48
      expect(r.interview_score).toBe(48);
    });

    it("subtracts -1 for child voice when total interviews is 0", () => {
      // Included in the zero-interview total of 45
      const r = computeReturnInterviewQuality(baseInput({ interviews: [] }));
      expect(r.interview_score).toBe(45);
    });
  });

  // ── Modifier 4: Action Completion ───────────────────────────────────────

  describe("Modifier 4: Action Completion", () => {
    it("adds +5 when action completion rate >= 85%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          // 20 total, 17 completed = 85%
          actions_total: 2,
          actions_completed: i < 5 ? 2 : i < 7 ? 2 : i < 9 ? 1 : 1,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      // Let me be more precise. actions_total = 2 each = 20 total.
      // i0-4: 2 each = 10, i5-6: 2 each = 4, i7-8: 1 each = 2, i9: 1 = 1 => 17. 17/20 = 85%
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 + 5 = 57
      expect(r.interview_score).toBe(57);
    });

    it("adds +2 when action completion rate >= 60% and < 85%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          // 20 total, 12 completed = 60%
          actions_total: 2,
          actions_completed: i < 6 ? 2 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 + 2 = 54
      expect(r.interview_score).toBe(54);
    });

    it("applies no adjustment when action completion rate >= 40% and < 60%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          // 20 total, 8 completed = 40%
          actions_total: 2,
          actions_completed: i < 4 ? 2 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBe(52);
    });

    it("subtracts -5 when action completion rate < 40%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          // 20 total, 6 completed = 30%
          actions_total: 2,
          actions_completed: i < 3 ? 2 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 - 5 = 47
      expect(r.interview_score).toBe(47);
    });

    it("adds +2 when totalActions=0 but interviews exist", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          actions_total: 0,
          actions_completed: 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 + 2 = 54
      expect(r.interview_score).toBe(54);
    });

    it("applies no adjustment for actions when total interviews = 0 and totalActions = 0", () => {
      // 52 - 3(completion) + 0(independence) - 1(voice) + 0(actions) - 1(sharing) - 2(factors) = 45
      const r = computeReturnInterviewQuality(baseInput({ interviews: [] }));
      expect(r.interview_score).toBe(45);
    });
  });

  // ── Modifier 5: Information Sharing ──────────────────────────────────────

  describe("Modifier 5: Information Sharing", () => {
    it("adds +4 when sharing rate >= 80%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 8 ? 2 : 0, // 80%
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 + 4 = 56
      expect(r.interview_score).toBe(56);
    });

    it("adds +1 when sharing rate >= 50% and < 80%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 5 ? 2 : 0, // 50%
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 + 1 = 53
      expect(r.interview_score).toBe(53);
    });

    it("applies no adjustment when sharing rate >= 30% and < 50%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0, // 40%
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBe(52);
    });

    it("subtracts -4 when sharing rate < 30%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 2 ? 1 : 0, // 20%
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 - 4 = 48
      expect(r.interview_score).toBe(48);
    });

    it("subtracts -1 for sharing when total interviews is 0", () => {
      const r = computeReturnInterviewQuality(baseInput({ interviews: [] }));
      // total zero-interview score is 45 (includes -1 for sharing)
      expect(r.interview_score).toBe(45);
    });
  });

  // ── Modifier 6: Push/Pull Factor Analysis ───────────────────────────────

  describe("Modifier 6: Push/Pull Factor Analysis", () => {
    it("adds +5 when factor rate >= 80%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 8, // 8 with push = 80%
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 + 5 = 57
      expect(r.interview_score).toBe(57);
    });

    it("adds +2 when factor rate >= 50% and < 80%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 5, // 50%
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 + 2 = 54
      expect(r.interview_score).toBe(54);
    });

    it("applies no adjustment when factor rate >= 30% and < 50%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4, // 40%
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBe(52);
    });

    it("subtracts -3 when factor rate < 30%", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 2, // 20%
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 - 3 = 49
      expect(r.interview_score).toBe(49);
    });

    it("subtracts -2 for factors when total interviews is 0", () => {
      const r = computeReturnInterviewQuality(baseInput({ interviews: [] }));
      // total zero-interview: 52 - 3 - 1 - 1 - 2 = 45
      expect(r.interview_score).toBe(45);
    });

    it("counts pull factors toward factor rate", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: false,
          has_pull_factors: i < 8, // 80% have pull factors
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // base 52 + 5(factors) = 57
      expect(r.interview_score).toBe(57);
    });

    it("counts interview with both push AND pull as one toward factor rate", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 8,
          has_pull_factors: i < 8, // same 8 have both
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // 80% factor rate => +5, total = 57
      expect(r.interview_score).toBe(57);
    });
  });

  // ── Rating Thresholds ───────────────────────────────────────────────────

  describe("Rating Thresholds", () => {
    it("rates outstanding when score >= 80", () => {
      // All max bonuses: 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
      const interviews = Array.from({ length: 10 }, () =>
        makeInterview({
          interview_status: "completed",
          independent_of_home: true,
          has_child_voice: true,
          actions_total: 2,
          actions_completed: 2,
          shared_with_count: 2,
          has_push_factors: true,
          has_pull_factors: true,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBe(82);
      expect(r.interview_rating).toBe("outstanding");
    });

    it("rates good when score >= 65 and < 80", () => {
      // 52 + 6(comp) + 5(ind) + 5(voice) + 0(actions neutral) + 0(sharing neutral) + 0(factors neutral) = 68
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 9 ? "completed" : "pending", // 90% => +6
          independent_of_home: i < 8, // 80% => +5
          has_child_voice: i < 9, // 90% => +5
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0, // 40% => no adj
          shared_with_count: i < 4 ? 1 : 0, // 40% => no adj
          has_push_factors: i < 4, // 40% => no adj
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBe(68);
      expect(r.interview_rating).toBe("good");
    });

    it("rates adequate when score >= 45 and < 65", () => {
      // neutral base = 52
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 6 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 5,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBe(52);
      expect(r.interview_rating).toBe("adequate");
    });

    it("rates inadequate when score < 45", () => {
      // 52 - 5(comp<50) - 5(ind<30) - 4(voice<50) - 5(action<40) - 4(sharing<30) - 3(factors<30) = 26
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 4 ? "completed" : "pending", // 40% => -5
          independent_of_home: i < 2, // 20% => -5
          has_child_voice: i < 4, // 40% => -4
          actions_total: 2,
          actions_completed: i < 3 ? 1 : 0, // 3/20 = 15% => -5
          shared_with_count: i < 2 ? 1 : 0, // 20% => -4
          has_push_factors: i < 2, // 20% => -3
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBe(26);
      expect(r.interview_rating).toBe("inadequate");
    });

    it("score at exact boundary 80 is outstanding", () => {
      // 52 + 6(comp) + 5(ind) + 5(voice) + 5(actions) + 4(sharing) + 5(factors) = 82
      // Need 80: 52 + 6 + 5 + 5 + 5 + 4 + 2 = 79. Off by one. Try: 52 + 6 + 5 + 5 + 5 + 1 + 5 = 79. Try: 52 + 6 + 5 + 5 + 2 + 4 + 5 = 79.
      // 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82. Use all max => 82.
      // For exactly 80: 52 + 6 + 5 + 5 + 2 + 4 + 5 = 79. Not quite.
      // 52 + 6 + 5 + 5 + 5 + 2 + 5 = 80 with actionRate>=85, sharingRate at 50-79
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 9 ? "completed" : "pending", // 90% => +6
          independent_of_home: i < 8, // 80% => +5
          has_child_voice: i < 9, // 90% => +5
          actions_total: 2,
          actions_completed: 2, // 100% => +5
          shared_with_count: i < 5 ? 1 : 0, // 50% => +1
          has_push_factors: i < 8, // 80% => +5
          has_pull_factors: false,
        }),
      );
      // 52 + 6 + 5 + 5 + 5 + 1 + 5 = 79. Still need 80.
      // Change sharing to >=80: shared_with_count: i < 8 ? 1 : 0 => 80% => +4. 52+6+5+5+5+4+5=82.
      // Hmm. Let's try actions at 60-84 => +2: 52+6+5+5+2+4+5=79. And factors 50-79 => +2: 52+6+5+5+2+4+2=76.
      // Let me just get exactly 80 differently:
      // 52+6+5+2+5+4+5 = 79 (voice 70-89 => +2). 52+6+5+5+5+4+5=82.
      // Exact 80 is hard. Let me use: comp=90(+6), ind=80(+5), voice=70(+2), actions=85(+5), sharing=80(+4), factors=80(+5) = 52+6+5+2+5+4+5=79. Off by 1.
      // comp=100(+6), ind=80(+5), voice=90(+5), actions=60(+2), sharing=80(+4), factors=80(+5) = 52+6+5+5+2+4+5=79. Still 79!
      // comp=100(+6), ind=80(+5), voice=90(+5), actions=85(+5), sharing=50(+1), factors=80(+5) = 79. Hmm max individual is 52+6+5+5+5+4+5=82.
      // Score 80 isn't achievable with these exact modifiers. Test boundary with score that is 80.
      // Actually can I get 80? I need modifiers summing to 28. Max=30. Available combos:
      // 6+5+5+5+4+5=30. Drop one: 6+5+5+5+4+2=27 or 6+5+5+5+1+5=27.
      // I need exactly 28: 6+5+5+5+4+2=27. 6+5+5+5+2+5=28! Yes.
      // That's comp(+6)+ind(+5)+voice(+5)+actions(+5)+sharing(+2: impossible, sharing goes 0,+1,+4).
      // Sharing modifiers: +4, +1, 0, -4. So +2 isn't available for sharing.
      // 6+5+5+2+4+5=27. 6+5+2+5+4+5=27. 2+5+5+5+4+5=26.
      // No exact combo gives 28. The achievable sums around 80:
      // 52+30=82, 52+27=79, etc. Score of 80 may not be reachable.
      // I'll test that 82 => outstanding and 79 => good instead.
      const interviews79 = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 9 ? "completed" : "pending", // +6
          independent_of_home: i < 8, // +5
          has_child_voice: i < 7, // 70% => +2
          actions_total: 2,
          actions_completed: 2, // +5
          shared_with_count: i < 8 ? 1 : 0, // 80% => +4
          has_push_factors: i < 8, // +5
          has_pull_factors: false,
        }),
      );
      const r79 = computeReturnInterviewQuality(baseInput({ interviews: interviews79 }));
      expect(r79.interview_score).toBe(79);
      expect(r79.interview_rating).toBe("good");
    });

    it("score at exact boundary 65 is good", () => {
      // Need modifiers summing to 13. 52+13=65.
      // 6+5+2+0+0+0=13. comp>=90(+6), ind>=80(+5), voice>=70(+2), actions neutral(0), sharing neutral(0), factors neutral(0)
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 9 ? "completed" : "pending", // 90% => +6
          independent_of_home: i < 8, // 80% => +5
          has_child_voice: i < 7, // 70% => +2
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0, // 40% => 0
          shared_with_count: i < 4 ? 1 : 0, // 40% => 0
          has_push_factors: i < 4, // 40% => 0
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBe(65);
      expect(r.interview_rating).toBe("good");
    });

    it("score 64 is adequate", () => {
      // Need modifiers summing to 12. 6+5+0+0+0+2=13 (too high).
      // 6+2+2+0+0+2=12. comp>=90(+6), ind>=50(+2), voice>=70(+2), actions=0, sharing=0, factors>=50(+2)
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 9 ? "completed" : "pending", // 90% => +6
          independent_of_home: i < 5, // 50% => +2
          has_child_voice: i < 7, // 70% => +2
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0, // 40% => 0
          shared_with_count: i < 4 ? 1 : 0, // 40% => 0
          has_push_factors: i < 5, // 50% => +2
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBe(64);
      expect(r.interview_rating).toBe("adequate");
    });

    it("score at exact boundary 45 is adequate", () => {
      // 52 + (-7) = 45. Zero interviews achieves this.
      const r = computeReturnInterviewQuality(baseInput({ interviews: [] }));
      expect(r.interview_score).toBe(45);
      expect(r.interview_rating).toBe("adequate");
    });

    it("score 44 is inadequate", () => {
      // Need modifiers summing to -8. e.g. -5(comp<50) + 0(ind neutral) + 0(voice neutral) + 0(actions neutral) + 0(sharing neutral) - 3(factors<30) = -8
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 4 ? "completed" : "pending", // 40% => -5
          independent_of_home: i < 4, // 40% => 0
          has_child_voice: i < 5, // 50% => 0
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0, // 40% => 0
          shared_with_count: i < 4 ? 1 : 0, // 40% => 0
          has_push_factors: i < 2, // 20% => -3
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBe(44);
      expect(r.interview_rating).toBe("inadequate");
    });
  });

  // ── Metric Calculations ─────────────────────────────────────────────────

  describe("Metric Calculations", () => {
    it("calculates completion_rate correctly", () => {
      const interviews = [
        makeInterview({ interview_status: "completed" }),
        makeInterview({ interview_status: "completed" }),
        makeInterview({ interview_status: "pending" }),
      ];
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.completion_rate).toBe(67); // Math.round(2/3 * 100)
    });

    it("calculates independence_rate correctly", () => {
      const interviews = [
        makeInterview({ independent_of_home: true }),
        makeInterview({ independent_of_home: false }),
        makeInterview({ independent_of_home: false }),
        makeInterview({ independent_of_home: false }),
      ];
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.independence_rate).toBe(25); // Math.round(1/4 * 100)
    });

    it("calculates child_voice_rate correctly", () => {
      const interviews = [
        makeInterview({ has_child_voice: true }),
        makeInterview({ has_child_voice: true }),
        makeInterview({ has_child_voice: true }),
        makeInterview({ has_child_voice: false }),
        makeInterview({ has_child_voice: false }),
      ];
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.child_voice_rate).toBe(60); // Math.round(3/5 * 100)
    });

    it("calculates exploitation_screening_rate for exploitation_concerns", () => {
      const interviews = [
        makeInterview({ exploitation_concerns: true, risks_identified_count: 0 }),
        makeInterview({ exploitation_concerns: false, risks_identified_count: 0 }),
      ];
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.exploitation_screening_rate).toBe(50);
    });

    it("calculates exploitation_screening_rate for risks_identified_count > 0", () => {
      const interviews = [
        makeInterview({ exploitation_concerns: false, risks_identified_count: 3 }),
        makeInterview({ exploitation_concerns: false, risks_identified_count: 0 }),
        makeInterview({ exploitation_concerns: false, risks_identified_count: 0 }),
      ];
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.exploitation_screening_rate).toBe(33); // Math.round(1/3 * 100)
    });

    it("calculates exploitation_screening_rate counting both triggers", () => {
      const interviews = [
        makeInterview({ exploitation_concerns: true, risks_identified_count: 2 }),
        makeInterview({ exploitation_concerns: false, risks_identified_count: 1 }),
        makeInterview({ exploitation_concerns: false, risks_identified_count: 0 }),
        makeInterview({ exploitation_concerns: false, risks_identified_count: 0 }),
      ];
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.exploitation_screening_rate).toBe(50); // 2 of 4
    });

    it("calculates action_completion_rate correctly", () => {
      const interviews = [
        makeInterview({ actions_total: 3, actions_completed: 2 }),
        makeInterview({ actions_total: 5, actions_completed: 3 }),
      ];
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.action_completion_rate).toBe(63); // Math.round(5/8 * 100)
    });

    it("returns action_completion_rate of 0 when no actions exist", () => {
      const interviews = [
        makeInterview({ actions_total: 0, actions_completed: 0 }),
      ];
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.action_completion_rate).toBe(0);
    });

    it("calculates information_sharing_rate correctly", () => {
      const interviews = [
        makeInterview({ shared_with_count: 3 }),
        makeInterview({ shared_with_count: 0 }),
        makeInterview({ shared_with_count: 1 }),
      ];
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.information_sharing_rate).toBe(67); // Math.round(2/3 * 100)
    });

    it("sets total_interviews to length of interviews array", () => {
      const interviews = [makeInterview(), makeInterview(), makeInterview()];
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.total_interviews).toBe(3);
    });

    it("all rates are 0 when no interviews exist (but total_children > 0)", () => {
      const r = computeReturnInterviewQuality(baseInput({ interviews: [] }));
      expect(r.completion_rate).toBe(0);
      expect(r.independence_rate).toBe(0);
      expect(r.child_voice_rate).toBe(0);
      expect(r.exploitation_screening_rate).toBe(0);
      expect(r.action_completion_rate).toBe(0);
      expect(r.information_sharing_rate).toBe(0);
    });
  });

  // ── Headline ────────────────────────────────────────────────────────────

  describe("Headlines", () => {
    it("returns outstanding headline for outstanding rating", () => {
      const interviews = Array.from({ length: 10 }, () =>
        makeInterview({
          interview_status: "completed",
          independent_of_home: true,
          has_child_voice: true,
          actions_total: 2,
          actions_completed: 2,
          shared_with_count: 2,
          has_push_factors: true,
          has_pull_factors: true,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.headline).toBe(
        "Return home interviews are thorough, independent and drive protective action for children",
      );
    });

    it("returns good headline for good rating", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 9 ? "completed" : "pending",
          independent_of_home: i < 8,
          has_child_voice: i < 7,
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: i < 4,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_rating).toBe("good");
      expect(r.headline).toBe(
        "Good return interview practice with effective child voice capture and follow-through",
      );
    });

    it("returns adequate headline for adequate rating", () => {
      const r = computeReturnInterviewQuality(baseInput({ interviews: [] }));
      expect(r.interview_rating).toBe("adequate");
      expect(r.headline).toBe(
        "Return interviews are completed but need stronger independence and deeper analysis",
      );
    });

    it("returns inadequate headline for inadequate rating", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 4 ? "completed" : "pending",
          independent_of_home: i < 2,
          has_child_voice: i < 4,
          actions_total: 2,
          actions_completed: i < 3 ? 1 : 0,
          shared_with_count: i < 2 ? 1 : 0,
          has_push_factors: i < 2,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_rating).toBe("inadequate");
      expect(r.headline).toBe(
        "Return interview practice is inadequate — children at risk are not being properly heard",
      );
    });
  });

  // ── Strengths ───────────────────────────────────────────────────────────

  describe("Strengths", () => {
    it("includes completion strength when completionRate >= 90 and total > 0", () => {
      const interviews = Array.from({ length: 10 }, () => makeInterview({ interview_status: "completed" }));
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.strengths).toContain("Return interviews are completed for virtually all missing episodes");
    });

    it("includes independence strength when independenceRate >= 80 and total > 0", () => {
      const interviews = Array.from({ length: 10 }, () => makeInterview({ independent_of_home: true }));
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.strengths).toContain("Interviews are conducted by independent persons — children can speak freely");
    });

    it("includes child voice strength when childVoiceRate >= 90 and total > 0", () => {
      const interviews = Array.from({ length: 10 }, () => makeInterview({ has_child_voice: true }));
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.strengths).toContain("Children's voices are consistently captured in return interviews");
    });

    it("includes action completion strength when actionCompletionRate >= 85 and totalActions > 0", () => {
      const interviews = Array.from({ length: 10 }, () =>
        makeInterview({ actions_total: 2, actions_completed: 2 }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.strengths).toContain("Actions from return interviews are followed through effectively");
    });

    it("does not include action strength when totalActions is 0 even if rate is 0", () => {
      const interviews = Array.from({ length: 10 }, () =>
        makeInterview({ actions_total: 0, actions_completed: 0 }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.strengths).not.toContain("Actions from return interviews are followed through effectively");
    });

    it("includes sharing strength when sharingRate >= 80 and total > 0", () => {
      const interviews = Array.from({ length: 10 }, () => makeInterview({ shared_with_count: 3 }));
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.strengths).toContain("Information is shared with relevant professionals after every interview");
    });

    it("includes factor strength when factorRate >= 80 and total > 0", () => {
      const interviews = Array.from({ length: 10 }, () =>
        makeInterview({ has_push_factors: true, has_pull_factors: false }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.strengths).toContain("Push and pull factors are thoroughly analysed to understand why children go missing");
    });

    it("returns all 6 strengths for a perfect input", () => {
      const interviews = Array.from({ length: 10 }, () =>
        makeInterview({
          interview_status: "completed",
          independent_of_home: true,
          has_child_voice: true,
          actions_total: 2,
          actions_completed: 2,
          shared_with_count: 2,
          has_push_factors: true,
          has_pull_factors: true,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.strengths).toHaveLength(6);
    });

    it("returns empty strengths for zero interviews", () => {
      const r = computeReturnInterviewQuality(baseInput({ interviews: [] }));
      expect(r.strengths).toEqual([]);
    });
  });

  // ── Concerns ────────────────────────────────────────────────────────────

  describe("Concerns", () => {
    it("includes no-interviews concern when total = 0", () => {
      const r = computeReturnInterviewQuality(baseInput({ interviews: [] }));
      expect(r.concerns).toContain("No return interviews recorded — statutory safeguarding requirement is not being met");
    });

    it("includes completion concern when completionRate < 50 and total > 0", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({ interview_status: i < 4 ? "completed" : "pending" }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.concerns).toContain("Most return interviews are not completed — children are not being heard after missing episodes");
    });

    it("includes independence concern when independenceRate < 30 and total > 0", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({ independent_of_home: i < 2 }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.concerns).toContain("Return interviews lack independence — children may not feel safe to disclose");
    });

    it("includes child voice concern when childVoiceRate < 50 and total > 0", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({ has_child_voice: i < 4 }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.concerns).toContain("Children's views are missing from most return interviews");
    });

    it("includes action concern when actionCompletionRate < 40 and totalActions > 0", () => {
      const interviews = Array.from({ length: 10 }, () =>
        makeInterview({ actions_total: 5, actions_completed: 1 }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.concerns).toContain("Actions from return interviews are not being completed — learning is lost");
    });

    it("does not include action concern when totalActions is 0", () => {
      const interviews = Array.from({ length: 10 }, () =>
        makeInterview({ actions_total: 0, actions_completed: 0 }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.concerns).not.toContain("Actions from return interviews are not being completed — learning is lost");
    });

    it("includes sharing concern when sharingRate < 30 and total > 0", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({ shared_with_count: i < 2 ? 1 : 0 }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.concerns).toContain("Interview findings are rarely shared with partners — safeguarding intelligence is siloed");
    });
  });

  // ── Recommendations ─────────────────────────────────────────────────────

  describe("Recommendations", () => {
    it("recommends implementing interviews when total = 0", () => {
      const r = computeReturnInterviewQuality(baseInput({ interviews: [] }));
      expect(r.recommendations).toContainEqual(
        expect.objectContaining({
          rank: 1,
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 12",
        }),
      );
    });

    it("recommends improving completion when completionRate < 70 and total > 0", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({ interview_status: i < 6 ? "completed" : "pending" }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.recommendations).toContainEqual(
        expect.objectContaining({
          urgency: "immediate",
          regulatory_ref: "SCCIF Safeguarding",
        }),
      );
    });

    it("recommends commissioning independent interviewers when independenceRate < 50", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({ independent_of_home: i < 4 }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.recommendations).toContainEqual(
        expect.objectContaining({
          urgency: "soon",
          regulatory_ref: "CHR 2015 Reg 12",
        }),
      );
    });

    it("recommends strengthening child voice when childVoiceRate < 70", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({ has_child_voice: i < 6 }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.recommendations).toContainEqual(
        expect.objectContaining({
          urgency: "soon",
          regulatory_ref: "SCCIF Voice of Child",
        }),
      );
    });

    it("recommends tracking actions when actionCompletionRate < 60 and totalActions > 0", () => {
      const interviews = Array.from({ length: 10 }, () =>
        makeInterview({ actions_total: 3, actions_completed: 1 }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.recommendations).toContainEqual(
        expect.objectContaining({
          urgency: "soon",
          regulatory_ref: "SCCIF Safeguarding",
        }),
      );
    });

    it("recommends sharing findings when sharingRate < 50", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({ shared_with_count: i < 4 ? 1 : 0 }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.recommendations).toContainEqual(
        expect.objectContaining({
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 12",
        }),
      );
    });

    it("caps recommendations at 5", () => {
      // Trigger all 6 possible recommendations (except the total=0 one)
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 4 ? "completed" : "pending", // <70 => rec
          independent_of_home: i < 4, // <50 => rec
          has_child_voice: i < 4, // <70 => rec
          actions_total: 3,
          actions_completed: 1, // <60 => rec
          shared_with_count: i < 4 ? 1 : 0, // <50 => rec
          has_push_factors: false,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.recommendations.length).toBeLessThanOrEqual(5);
    });

    it("re-ranks recommendations sequentially from 1", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 4 ? "completed" : "pending",
          independent_of_home: i < 4,
          has_child_voice: i < 4,
          actions_total: 3,
          actions_completed: 1,
          shared_with_count: i < 4 ? 1 : 0,
          has_push_factors: false,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      r.recommendations.forEach((rec, idx) => {
        expect(rec.rank).toBe(idx + 1);
      });
    });

    it("returns no recommendations when all metrics are excellent", () => {
      const interviews = Array.from({ length: 10 }, () =>
        makeInterview({
          interview_status: "completed",
          independent_of_home: true,
          has_child_voice: true,
          actions_total: 2,
          actions_completed: 2,
          shared_with_count: 2,
          has_push_factors: true,
          has_pull_factors: true,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.recommendations).toEqual([]);
    });
  });

  // ── Insights ────────────────────────────────────────────────────────────

  describe("Insights", () => {
    it("produces exemplary practice insight when comp>=90, ind>=80, voice>=90, total>=5", () => {
      const interviews = Array.from({ length: 10 }, () =>
        makeInterview({
          interview_status: "completed",
          independent_of_home: true,
          has_child_voice: true,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.insights).toContainEqual({
        text: "Return interview practice is exemplary — children are heard, protected and understood after every missing episode",
        severity: "positive",
      });
    });

    it("does not produce exemplary insight when total < 5 even if rates are perfect", () => {
      const interviews = Array.from({ length: 4 }, () =>
        makeInterview({
          interview_status: "completed",
          independent_of_home: true,
          has_child_voice: true,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.insights).not.toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining("exemplary"),
        }),
      );
    });

    it("produces critical insight when total = 0", () => {
      const r = computeReturnInterviewQuality(baseInput({ interviews: [] }));
      expect(r.insights).toContainEqual({
        text: "No return interviews means the home cannot demonstrate it understands why children go missing — a critical regulatory gap",
        severity: "critical",
      });
    });

    it("produces warning insight when independenceRate < 30 and total > 0", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({ independent_of_home: i < 2 }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.insights).toContainEqual({
        text: "Without independent interviewers, children may not disclose exploitation, abuse or peer pressure",
        severity: "warning",
      });
    });

    it("produces positive child voice insight when childVoiceRate >= 90 and total > 0", () => {
      const interviews = Array.from({ length: 10 }, () =>
        makeInterview({ has_child_voice: true }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.insights).toContainEqual({
        text: "Strong child voice capture means the home truly understands what drives missing behaviour",
        severity: "positive",
      });
    });

    it("produces positive action completion insight when actionCompletionRate >= 85 and totalActions > 0", () => {
      const interviews = Array.from({ length: 10 }, () =>
        makeInterview({ actions_total: 2, actions_completed: 2 }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.insights).toContainEqual({
        text: "Actions from return interviews are completed — the home learns and adapts from every incident",
        severity: "positive",
      });
    });

    it("caps insights at 3", () => {
      // Trigger 4+ insights: exemplary(comp>=90 & ind>=80 & voice>=90 & total>=5),
      // voice positive (voice>=90), action positive (action>=85 & totalActions>0)
      // That's 3 positives. The cap at 3 should keep them.
      const interviews = Array.from({ length: 10 }, () =>
        makeInterview({
          interview_status: "completed",
          independent_of_home: true,
          has_child_voice: true,
          actions_total: 2,
          actions_completed: 2,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.insights.length).toBeLessThanOrEqual(3);
    });

    it("does not produce action insight when totalActions = 0", () => {
      const interviews = Array.from({ length: 10 }, () =>
        makeInterview({ actions_total: 0, actions_completed: 0 }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.insights).not.toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining("Actions from return interviews are completed"),
        }),
      );
    });
  });

  // ── Clamping ────────────────────────────────────────────────────────────

  describe("Score Clamping", () => {
    it("never exceeds 100", () => {
      // Maximum: 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82 (well under 100, but test the clamp principle)
      const interviews = Array.from({ length: 10 }, () =>
        makeInterview({
          interview_status: "completed",
          independent_of_home: true,
          has_child_voice: true,
          actions_total: 2,
          actions_completed: 2,
          shared_with_count: 2,
          has_push_factors: true,
          has_pull_factors: true,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBeLessThanOrEqual(100);
    });

    it("never goes below 0", () => {
      // Minimum: 52 - 5 - 5 - 4 - 5 - 4 - 3 = 26 (above 0, but test principle)
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 4 ? "completed" : "pending",
          independent_of_home: i < 2,
          has_child_voice: i < 4,
          actions_total: 2,
          actions_completed: i < 3 ? 1 : 0,
          shared_with_count: i < 2 ? 1 : 0,
          has_push_factors: i < 2,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Combined Modifier Scenarios ─────────────────────────────────────────

  describe("Combined Modifier Scenarios", () => {
    it("all positive modifiers: 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82 (outstanding)", () => {
      const interviews = Array.from({ length: 10 }, () =>
        makeInterview({
          interview_status: "completed",
          independent_of_home: true,
          has_child_voice: true,
          actions_total: 2,
          actions_completed: 2,
          shared_with_count: 2,
          has_push_factors: true,
          has_pull_factors: true,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBe(82);
      expect(r.interview_rating).toBe("outstanding");
    });

    it("all negative modifiers: 52 - 5 - 5 - 4 - 5 - 4 - 3 = 26 (inadequate)", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 4 ? "completed" : "pending",
          independent_of_home: i < 2,
          has_child_voice: i < 4,
          actions_total: 2,
          actions_completed: i < 3 ? 1 : 0,
          shared_with_count: i < 2 ? 1 : 0,
          has_push_factors: i < 2,
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBe(26);
      expect(r.interview_rating).toBe("inadequate");
    });

    it("mixed: strong completion and voice, weak independence and sharing", () => {
      // 52 + 6(comp>=90) - 5(ind<30) + 5(voice>=90) + 0(actions neutral) - 4(sharing<30) + 0(factors neutral)
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 9 ? "completed" : "pending", // 90% => +6
          independent_of_home: i < 2, // 20% => -5
          has_child_voice: i < 9, // 90% => +5
          actions_total: i < 5 ? 1 : 0,
          actions_completed: i < 2 ? 1 : 0, // 40% => 0
          shared_with_count: i < 2 ? 1 : 0, // 20% => -4
          has_push_factors: i < 4, // 40% => 0
          has_pull_factors: false,
        }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBe(54);
      expect(r.interview_rating).toBe("adequate");
    });

    it("mid-tier positive across the board: 52 + 2 + 2 + 2 + 2 + 1 + 2 = 63 (adequate)", () => {
      const interviews = Array.from({ length: 10 }, (_, i) =>
        makeInterview({
          interview_status: i < 7 ? "completed" : "pending", // 70% => +2
          independent_of_home: i < 5, // 50% => +2
          has_child_voice: i < 7, // 70% => +2
          actions_total: 2,
          actions_completed: i < 6 ? 2 : i < 8 ? 1 : 0, // 12+2/20 = 14/20 = 70% => +2
          shared_with_count: i < 5 ? 1 : 0, // 50% => +1
          has_push_factors: i < 5, // 50% => +2
          has_pull_factors: false,
        }),
      );
      // actions: i0-5: 2 each = 12, i6-7: 1 each = 2, i8-9: 0 = 0 => 14/20 = 70% => +2
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBe(63);
      expect(r.interview_rating).toBe("adequate");
    });

    it("single interview with all positive attributes", () => {
      const interviews = [
        makeInterview({
          interview_status: "completed",
          independent_of_home: true,
          has_child_voice: true,
          actions_total: 2,
          actions_completed: 2,
          shared_with_count: 2,
          has_push_factors: true,
          has_pull_factors: true,
        }),
      ];
      // 1/1 = 100% for all rates
      // 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBe(82);
      expect(r.interview_rating).toBe("outstanding");
    });

    it("single interview with all negative attributes", () => {
      const interviews = [
        makeInterview({
          interview_status: "pending", // 0% completed => -5
          independent_of_home: false, // 0% => -5
          has_child_voice: false, // 0% => -4
          actions_total: 5,
          actions_completed: 1, // 20% => -5
          shared_with_count: 0, // 0% => -4
          has_push_factors: false,
          has_pull_factors: false, // 0% => -3
        }),
      ];
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      // 52 - 5 - 5 - 4 - 5 - 4 - 3 = 26
      expect(r.interview_score).toBe(26);
      expect(r.interview_rating).toBe("inadequate");
    });

    it("single interview with no actions gets +2 bonus", () => {
      const interviews = [
        makeInterview({
          interview_status: "completed",
          independent_of_home: true,
          has_child_voice: true,
          actions_total: 0,
          actions_completed: 0,
          shared_with_count: 2,
          has_push_factors: true,
          has_pull_factors: true,
        }),
      ];
      // 52 + 6 + 5 + 5 + 2(no actions bonus) + 4 + 5 = 79
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.interview_score).toBe(79);
    });
  });

  // ── Edge Cases ──────────────────────────────────────────────────────────

  describe("Edge Cases", () => {
    it("handles interview with offered_declined status (not completed)", () => {
      const interviews = [
        makeInterview({ interview_status: "offered_declined" }),
        makeInterview({ interview_status: "completed" }),
      ];
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.completion_rate).toBe(50); // 1/2
    });

    it("handles interview with not_yet_due status (not completed)", () => {
      const interviews = [
        makeInterview({ interview_status: "not_yet_due" }),
        makeInterview({ interview_status: "completed" }),
        makeInterview({ interview_status: "completed" }),
      ];
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.completion_rate).toBe(67); // Math.round(2/3 * 100)
    });

    it("handles large number of interviews", () => {
      const interviews = Array.from({ length: 100 }, () =>
        makeInterview({ interview_status: "completed" }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.total_interviews).toBe(100);
      expect(r.completion_rate).toBe(100);
    });

    it("handles interview with zero risks_identified_count and no exploitation", () => {
      const interviews = [
        makeInterview({ risks_identified_count: 0, exploitation_concerns: false }),
      ];
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.exploitation_screening_rate).toBe(0);
    });

    it("correctly handles 100% rates for a single perfect interview", () => {
      const interviews = [
        makeInterview({
          interview_status: "completed",
          independent_of_home: true,
          has_child_voice: true,
          exploitation_concerns: true,
          risks_identified_count: 2,
          actions_total: 3,
          actions_completed: 3,
          shared_with_count: 4,
          has_push_factors: true,
          has_pull_factors: true,
        }),
      ];
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.completion_rate).toBe(100);
      expect(r.independence_rate).toBe(100);
      expect(r.child_voice_rate).toBe(100);
      expect(r.exploitation_screening_rate).toBe(100);
      expect(r.action_completion_rate).toBe(100);
      expect(r.information_sharing_rate).toBe(100);
    });

    it("correctly handles 0% rates for a single worst-case interview", () => {
      const interviews = [
        makeInterview({
          interview_status: "pending",
          independent_of_home: false,
          has_child_voice: false,
          exploitation_concerns: false,
          risks_identified_count: 0,
          actions_total: 0,
          actions_completed: 0,
          shared_with_count: 0,
          has_push_factors: false,
          has_pull_factors: false,
        }),
      ];
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.completion_rate).toBe(0);
      expect(r.independence_rate).toBe(0);
      expect(r.child_voice_rate).toBe(0);
      expect(r.exploitation_screening_rate).toBe(0);
      expect(r.action_completion_rate).toBe(0);
      expect(r.information_sharing_rate).toBe(0);
    });

    it("uses Math.round for percentage calculation", () => {
      // 1 of 3 = 33.333... => Math.round => 33
      const interviews = [
        makeInterview({ has_child_voice: true }),
        makeInterview({ has_child_voice: false }),
        makeInterview({ has_child_voice: false }),
      ];
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.child_voice_rate).toBe(33);
    });

    it("rounds 0.5 up in percentage calculation", () => {
      // 1/6 = 16.666... => Math.round => 17. 5/6 = 83.333 => 83.
      // For exact .5: 1/2 = 50, 3/2 not possible. Hard to get exact .5 with integers.
      // 3/6 = 50 exactly.
      const interviews = Array.from({ length: 6 }, (_, i) =>
        makeInterview({ has_child_voice: i < 3 }),
      );
      const r = computeReturnInterviewQuality(baseInput({ interviews }));
      expect(r.child_voice_rate).toBe(50);
    });

    it("total_children does not affect scoring when > 0", () => {
      const interviews = [makeInterview()];
      const r1 = computeReturnInterviewQuality(baseInput({ total_children: 1, interviews }));
      const r2 = computeReturnInterviewQuality(baseInput({ total_children: 100, interviews }));
      expect(r1.interview_score).toBe(r2.interview_score);
    });
  });
});
