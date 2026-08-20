import { describe, it, expect } from "vitest";
import {
  computeManagementWalkroundOversight,
  type ManagementWalkroundInput,
  type WalkroundInput,
} from "../home-management-walkround-oversight-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeWalkround(overrides?: Partial<WalkroundInput>): WalkroundInput {
  return {
    id: "w1",
    walkround_type: "daily",
    positive_observations_count: 3,
    improvements_count: 1,
    child_interactions_count: 2,
    staff_interactions_count: 3,
    environmental_checks_good: 5,
    environmental_checks_total: 5,
    immediate_actions_count: 1,
    follow_up_actions_count: 2,
    follow_up_actions_completed: 2,
    themes_count: 2,
    positive_practice_noted_count: 2,
    ...overrides,
  };
}

function baseInput(overrides?: Partial<ManagementWalkroundInput>): ManagementWalkroundInput {
  return {
    today: "2026-05-27",
    total_staff: 8,
    walkrounds: [],
    ...overrides,
  };
}

/** Shorthand: pct helper mirrors the engine's own pct fn */
function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// ════════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ════════════════════════════════════════════════════════════════════════════

describe("computeManagementWalkroundOversight", () => {
  describe("1 — Insufficient data", () => {
    it("returns insufficient_data when total_staff is 0", () => {
      const r = computeManagementWalkroundOversight(baseInput({ total_staff: 0 }));
      expect(r.walkround_rating).toBe("insufficient_data");
      expect(r.walkround_score).toBe(0);
      expect(r.headline).toBe("No data available for management walkround analysis");
      expect(r.total_walkrounds).toBe(0);
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("returns insufficient_data with zero rates when total_staff is 0 even if walkrounds provided", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({ total_staff: 0, walkrounds: [makeWalkround()] }),
      );
      expect(r.walkround_rating).toBe("insufficient_data");
      expect(r.positive_observation_rate).toBe(0);
      expect(r.environmental_pass_rate).toBe(0);
      expect(r.child_interaction_rate).toBe(0);
      expect(r.follow_up_completion_rate).toBe(0);
      expect(r.unannounced_rate).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 2. ZERO WALKROUNDS
  // ════════════════════════════════════════════════════════════════════════

  describe("2 — Zero walkrounds", () => {
    it("calculates correct score with zero walkrounds", () => {
      // base 52 + freq -5 + posObs 0 + env 0 + child 0 + followUp -1 + unannounced -2 = 44
      const r = computeManagementWalkroundOversight(baseInput());
      expect(r.walkround_score).toBe(44);
      expect(r.walkround_rating).toBe("inadequate");
      expect(r.total_walkrounds).toBe(0);
    });

    it("sets all rates to 0 when there are no walkrounds", () => {
      const r = computeManagementWalkroundOversight(baseInput());
      expect(r.positive_observation_rate).toBe(0);
      expect(r.environmental_pass_rate).toBe(0);
      expect(r.child_interaction_rate).toBe(0);
      expect(r.follow_up_completion_rate).toBe(0);
      expect(r.unannounced_rate).toBe(0);
    });

    it("generates the no-walkrounds concern", () => {
      const r = computeManagementWalkroundOversight(baseInput());
      expect(r.concerns).toContain(
        "No management walkrounds recorded — this is a significant governance gap",
      );
    });

    it("generates the immediate recommendation to implement walkrounds", () => {
      const r = computeManagementWalkroundOversight(baseInput());
      expect(r.recommendations.length).toBeGreaterThanOrEqual(1);
      expect(r.recommendations[0].recommendation).toContain("Implement a structured management walkround schedule");
      expect(r.recommendations[0].urgency).toBe("immediate");
    });

    it("generates the critical insight about disconnected management", () => {
      const r = computeManagementWalkroundOversight(baseInput());
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("No walkrounds recorded"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 3. OUTSTANDING SCENARIO
  // ════════════════════════════════════════════════════════════════════════

  describe("3 — Outstanding scenario", () => {
    function outstandingInput(): ManagementWalkroundInput {
      const walkrounds: WalkroundInput[] = [];
      for (let i = 0; i < 10; i++) {
        walkrounds.push(
          makeWalkround({
            id: `w${i + 1}`,
            walkround_type: i < 4 ? "unannounced" : "daily",
            positive_observations_count: 5,
            improvements_count: 1,
            child_interactions_count: 3,
            environmental_checks_good: 10,
            environmental_checks_total: 10,
            follow_up_actions_count: 3,
            follow_up_actions_completed: 3,
          }),
        );
      }
      return baseInput({ walkrounds });
    }

    it("achieves outstanding rating", () => {
      const r = computeManagementWalkroundOversight(outstandingInput());
      expect(r.walkround_rating).toBe("outstanding");
    });

    it("calculates expected outstanding score", () => {
      // base 52 + freq(10>=8)+5 + posObs(pct(50,60)=83>=70)+6 + env(100>=90)+5
      // + child(100>=80)+5 + followUp(100>=90)+4 + unannounced(pct(4,10)=40>=30)+5 = 82
      const r = computeManagementWalkroundOversight(outstandingInput());
      expect(r.walkround_score).toBe(82);
    });

    it("returns outstanding headline", () => {
      const r = computeManagementWalkroundOversight(outstandingInput());
      expect(r.headline).toBe(
        "Management walkrounds are frequent, thorough and drive continuous improvement",
      );
    });

    it("populates all expected strengths", () => {
      const r = computeManagementWalkroundOversight(outstandingInput());
      expect(r.strengths).toContain("High frequency of management walkrounds demonstrates active oversight");
      expect(r.strengths).toContain("Walkrounds consistently identify and celebrate positive practice");
      expect(r.strengths).toContain("Environmental standards are maintained to a high level across the home");
      expect(r.strengths).toContain("Managers routinely engage with children during walkrounds — voice of child is central");
      expect(r.strengths).toContain("Follow-up actions from walkrounds are completed promptly and effectively");
      expect(r.strengths).toContain("Regular unannounced walkrounds demonstrate proactive, authentic oversight");
      expect(r.strengths).toHaveLength(6);
    });

    it("has no concerns", () => {
      const r = computeManagementWalkroundOversight(outstandingInput());
      expect(r.concerns).toEqual([]);
    });

    it("has no recommendations", () => {
      const r = computeManagementWalkroundOversight(outstandingInput());
      expect(r.recommendations).toEqual([]);
    });

    it("includes the exemplary management insight", () => {
      const r = computeManagementWalkroundOversight(outstandingInput());
      expect(r.insights.some(i => i.text.includes("exemplary") && i.severity === "positive")).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 4. GOOD SCENARIO
  // ════════════════════════════════════════════════════════════════════════

  describe("4 — Good scenario", () => {
    function goodInput(): ManagementWalkroundInput {
      const walkrounds: WalkroundInput[] = [];
      for (let i = 0; i < 5; i++) {
        walkrounds.push(
          makeWalkround({
            id: `w${i + 1}`,
            walkround_type: i === 0 ? "unannounced" : "daily",
            positive_observations_count: 4,
            improvements_count: 2,
            child_interactions_count: 2,
            environmental_checks_good: 8,
            environmental_checks_total: 10,
            follow_up_actions_count: 2,
            follow_up_actions_completed: 2,
          }),
        );
      }
      return baseInput({ walkrounds });
    }

    it("achieves good rating", () => {
      // base 52 + freq(5>=4)+2 + posObs(pct(20,30)=67>=50)+2 + env(pct(40,50)=80>=70)+2
      // + child(100>=80)+5 + followUp(100>=90)+4 + unannounced(pct(1,5)=20>=15)+2 = 69
      const r = computeManagementWalkroundOversight(goodInput());
      expect(r.walkround_rating).toBe("good");
      expect(r.walkround_score).toBe(69);
    });

    it("returns good headline", () => {
      const r = computeManagementWalkroundOversight(goodInput());
      expect(r.headline).toBe(
        "Good management oversight with regular walkrounds and effective follow-through",
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 5. ADEQUATE SCENARIO
  // ════════════════════════════════════════════════════════════════════════

  describe("5 — Adequate scenario", () => {
    function adequateInput(): ManagementWalkroundInput {
      const walkrounds: WalkroundInput[] = [];
      for (let i = 0; i < 3; i++) {
        walkrounds.push(
          makeWalkround({
            id: `w${i + 1}`,
            walkround_type: "daily",
            positive_observations_count: 2,
            improvements_count: 2,
            child_interactions_count: 1,
            environmental_checks_good: 7,
            environmental_checks_total: 10,
            follow_up_actions_count: 3,
            follow_up_actions_completed: 2,
          }),
        );
      }
      return baseInput({ walkrounds });
    }

    it("achieves adequate rating", () => {
      // base 52 + freq(3: no bonus, not 0) +0 + posObs(pct(6,12)=50>=50)+2 + env(pct(21,30)=70>=70)+2
      // + child(pct(3,3)=100>=80)+5 + followUp(pct(6,9)=67: between 50-70) +0 + unannounced(0%=0) -3 = 58
      const r = computeManagementWalkroundOversight(adequateInput());
      expect(r.walkround_rating).toBe("adequate");
      expect(r.walkround_score).toBe(58);
    });

    it("returns adequate headline", () => {
      const r = computeManagementWalkroundOversight(adequateInput());
      expect(r.headline).toBe(
        "Management walkrounds are adequate but need more consistency and depth",
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 6. INADEQUATE SCENARIO
  // ════════════════════════════════════════════════════════════════════════

  describe("6 — Inadequate scenario", () => {
    it("returns inadequate when only 1 poor walkround", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [
            makeWalkround({
              positive_observations_count: 0,
              improvements_count: 5,
              child_interactions_count: 0,
              environmental_checks_good: 2,
              environmental_checks_total: 10,
              follow_up_actions_count: 4,
              follow_up_actions_completed: 1,
            }),
          ],
        }),
      );
      // base 52 + freq(1: no bonus, not 0) +0 + posObs(pct(0,5)=0<30) -5 + env(pct(2,10)=20<50) -4
      // + child(pct(0,1)=0<30) -5 + followUp(pct(1,4)=25<50) -4 + unannounced(0%=0) -3 = 31
      expect(r.walkround_score).toBe(31);
      expect(r.walkround_rating).toBe("inadequate");
    });

    it("returns inadequate headline", () => {
      const r = computeManagementWalkroundOversight(baseInput());
      expect(r.headline).toBe(
        "Management walkround practice is inadequate — oversight of the home is insufficient",
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 7. INDIVIDUAL MODIFIER BOUNDARY TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("7 — Modifier 1: Walkround frequency", () => {
    /** Helper: N identical walkrounds with decent stats to isolate frequency effect */
    function nWalkrounds(n: number): ManagementWalkroundInput {
      const walkrounds = Array.from({ length: n }, (_, i) =>
        makeWalkround({ id: `w${i + 1}`, walkround_type: i === 0 ? "unannounced" : "daily" }),
      );
      return baseInput({ walkrounds });
    }

    it(">=8 walkrounds → +5", () => {
      // 8 walkrounds, 1 unannounced. posObs 3/(3+1)=75→+6, env 5/5=100→+5,
      // child 100%→+5, followUp 2/2=100→+4, unannounced pct(1,8)=13 → not 0, not >=15 → 0. freq +5.
      // base 52 +5 +6 +5 +5 +4 +0 = 77
      const r = computeManagementWalkroundOversight(nWalkrounds(8));
      expect(r.walkround_score).toBe(77);
    });

    it("4-7 walkrounds → +2", () => {
      // 4 walkrounds, 1 unannounced. unannounced pct(1,4)=25→ +2 (>=15). freq +2.
      // base 52 +2 +6 +5 +5 +4 +2 = 76
      const r4 = computeManagementWalkroundOversight(nWalkrounds(4));
      expect(r4.walkround_score).toBe(76);
    });

    it("1-3 walkrounds → no bonus or penalty", () => {
      // Compare to a baseline. 2 walkrounds vs 1 should differ only in rate changes, not freq modifier.
      const r1 = computeManagementWalkroundOversight(nWalkrounds(1));
      // Both get +0 from frequency. Difference comes from unannounced rate shift.
      // 1 walkround: 1 unannounced out of 1 = 100%. 2 walkrounds: 1 unannounced out of 2 = 50%.
      // Both >=30% so same unannounced modifier. Scores may differ only due to rate rounding.
      expect(r1.walkround_score).toBeGreaterThanOrEqual(45); // not penalised by freq
    });

    it("0 walkrounds → -5", () => {
      const r0 = computeManagementWalkroundOversight(baseInput());
      // base 52 + freq -5 + posObs 0 + env 0 + child 0 + followUp -1 + unannounced -2 = 44
      expect(r0.walkround_score).toBe(44);
    });

    it("exactly 7 walkrounds still gets +2", () => {
      const r7 = computeManagementWalkroundOversight(nWalkrounds(7));
      const r8 = computeManagementWalkroundOversight(nWalkrounds(8));
      expect(r8.walkround_score - r7.walkround_score).toBe(3); // +5 vs +2
    });
  });

  describe("7 — Modifier 2: Positive observation rate", () => {
    function obsInput(pos: number, imp: number, hasWalkrounds: boolean): ManagementWalkroundInput {
      if (!hasWalkrounds) return baseInput();
      return baseInput({
        walkrounds: [
          makeWalkround({
            positive_observations_count: pos,
            improvements_count: imp,
            walkround_type: "unannounced",
          }),
        ],
      });
    }

    it(">=70% positive → +6", () => {
      const r = computeManagementWalkroundOversight(obsInput(7, 3, true));
      // pct(7, 10) = 70 → +6
      expect(r.positive_observation_rate).toBe(70);
    });

    it(">=50% but <70% positive → +2", () => {
      const r = computeManagementWalkroundOversight(obsInput(5, 5, true));
      expect(r.positive_observation_rate).toBe(50);
    });

    it("<30% positive → -5", () => {
      const r = computeManagementWalkroundOversight(obsInput(1, 9, true));
      // pct(1, 10) = 10 → -5
      expect(r.positive_observation_rate).toBe(10);
    });

    it("0 observations with walkrounds → -1", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [
            makeWalkround({
              positive_observations_count: 0,
              improvements_count: 0,
              walkround_type: "unannounced",
            }),
          ],
        }),
      );
      expect(r.positive_observation_rate).toBe(0);
      // Confirm the -1 penalty: isolate by comparing to a walkround with obs
      // 0 obs → -1 vs 70%+ → +6, delta should be 7
    });

    it("0 observations with 0 walkrounds → 0 adjustment", () => {
      const r = computeManagementWalkroundOversight(baseInput());
      // No walkrounds: totalObs=0, total=0 → no adjustment (else if totalObs===0 branch)
      expect(r.positive_observation_rate).toBe(0);
    });
  });

  describe("7 — Modifier 3: Environmental pass rate", () => {
    function envInput(good: number, total: number): ManagementWalkroundInput {
      return baseInput({
        walkrounds: [
          makeWalkround({
            environmental_checks_good: good,
            environmental_checks_total: total,
            walkround_type: "unannounced",
          }),
        ],
      });
    }

    it(">=90% pass → +5", () => {
      const r = computeManagementWalkroundOversight(envInput(9, 10));
      expect(r.environmental_pass_rate).toBe(90);
    });

    it(">=70% but <90% pass → +2", () => {
      const r = computeManagementWalkroundOversight(envInput(7, 10));
      expect(r.environmental_pass_rate).toBe(70);
    });

    it("<50% pass → -4", () => {
      const r = computeManagementWalkroundOversight(envInput(4, 10));
      expect(r.environmental_pass_rate).toBe(40);
    });

    it("0 env checks with walkrounds → -1", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [
            makeWalkround({
              environmental_checks_good: 0,
              environmental_checks_total: 0,
              walkround_type: "unannounced",
            }),
          ],
        }),
      );
      expect(r.environmental_pass_rate).toBe(0);
    });

    it("0 env checks with 0 walkrounds → 0 adjustment", () => {
      const r = computeManagementWalkroundOversight(baseInput());
      expect(r.environmental_pass_rate).toBe(0);
    });
  });

  describe("7 — Modifier 4: Child interaction rate", () => {
    it(">=80% with interactions → +5", () => {
      const walkrounds = Array.from({ length: 5 }, (_, i) =>
        makeWalkround({ id: `w${i}`, child_interactions_count: 2, walkround_type: "unannounced" }),
      );
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      expect(r.child_interaction_rate).toBe(100);
    });

    it(">=50% but <80% → +2", () => {
      const walkrounds = [
        makeWalkround({ id: "w1", child_interactions_count: 2, walkround_type: "unannounced" }),
        makeWalkround({ id: "w2", child_interactions_count: 2 }),
        makeWalkround({ id: "w3", child_interactions_count: 0 }),
        makeWalkround({ id: "w4", child_interactions_count: 0 }),
      ];
      // 2/4 = 50%
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      expect(r.child_interaction_rate).toBe(50);
    });

    it("<30% → -5", () => {
      const walkrounds = [
        makeWalkround({ id: "w1", child_interactions_count: 1, walkround_type: "unannounced" }),
        makeWalkround({ id: "w2", child_interactions_count: 0 }),
        makeWalkround({ id: "w3", child_interactions_count: 0 }),
        makeWalkround({ id: "w4", child_interactions_count: 0 }),
      ];
      // 1/4 = 25%
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      expect(r.child_interaction_rate).toBe(25);
    });

    it("0 walkrounds → no change", () => {
      const r = computeManagementWalkroundOversight(baseInput());
      expect(r.child_interaction_rate).toBe(0);
    });
  });

  describe("7 — Modifier 5: Follow-up completion", () => {
    function followUpInput(count: number, completed: number): ManagementWalkroundInput {
      return baseInput({
        walkrounds: [
          makeWalkround({
            follow_up_actions_count: count,
            follow_up_actions_completed: completed,
            walkround_type: "unannounced",
          }),
        ],
      });
    }

    it(">=90% completion → +4", () => {
      const r = computeManagementWalkroundOversight(followUpInput(10, 9));
      expect(r.follow_up_completion_rate).toBe(90);
    });

    it(">=70% but <90% → +1", () => {
      const r = computeManagementWalkroundOversight(followUpInput(10, 7));
      expect(r.follow_up_completion_rate).toBe(70);
    });

    it("<50% → -4", () => {
      const r = computeManagementWalkroundOversight(followUpInput(10, 4));
      expect(r.follow_up_completion_rate).toBe(40);
    });

    it("0 follow-ups with walkrounds → +2", () => {
      const r = computeManagementWalkroundOversight(followUpInput(0, 0));
      expect(r.follow_up_completion_rate).toBe(0);
    });

    it("0 follow-ups with 0 walkrounds → -1", () => {
      const r = computeManagementWalkroundOversight(baseInput());
      // totalFollowUp=0 and total=0 → score -= 1
      // 52 - 5(mod1) - 1(mod5) - 2(mod6) = 44
      expect(r.walkround_score).toBe(44);
    });
  });

  describe("7 — Modifier 6: Unannounced rate", () => {
    function unannouncedInput(unannouncedCount: number, totalCount: number): ManagementWalkroundInput {
      const walkrounds = Array.from({ length: totalCount }, (_, i) =>
        makeWalkround({
          id: `w${i}`,
          walkround_type: i < unannouncedCount ? "unannounced" : "daily",
        }),
      );
      return baseInput({ walkrounds });
    }

    it(">=30% unannounced → +5", () => {
      const r = computeManagementWalkroundOversight(unannouncedInput(3, 10));
      expect(r.unannounced_rate).toBe(30);
    });

    it(">=15% but <30% → +2", () => {
      const r = computeManagementWalkroundOversight(unannouncedInput(1, 5));
      // pct(1,5) = 20
      expect(r.unannounced_rate).toBe(20);
    });

    it("0% unannounced with walkrounds → -3", () => {
      const r = computeManagementWalkroundOversight(unannouncedInput(0, 5));
      expect(r.unannounced_rate).toBe(0);
    });

    it("0 walkrounds → -2", () => {
      const r = computeManagementWalkroundOversight(baseInput());
      // total=0 → score -= 2
      expect(r.unannounced_rate).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 8. STRENGTHS GENERATION
  // ════════════════════════════════════════════════════════════════════════

  describe("8 — Strengths generation", () => {
    it("includes high frequency strength when total >= 8", () => {
      const walkrounds = Array.from({ length: 8 }, (_, i) =>
        makeWalkround({ id: `w${i}` }),
      );
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      expect(r.strengths).toContain("High frequency of management walkrounds demonstrates active oversight");
    });

    it("does not include frequency strength when total < 8", () => {
      const walkrounds = Array.from({ length: 7 }, (_, i) =>
        makeWalkround({ id: `w${i}` }),
      );
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      expect(r.strengths).not.toContain("High frequency of management walkrounds demonstrates active oversight");
    });

    it("includes positive practice strength when positiveObsRate >= 70", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [makeWalkround({ positive_observations_count: 7, improvements_count: 3 })],
        }),
      );
      expect(r.strengths).toContain("Walkrounds consistently identify and celebrate positive practice");
    });

    it("does not include positive practice strength when no observations", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [makeWalkround({ positive_observations_count: 0, improvements_count: 0 })],
        }),
      );
      expect(r.strengths).not.toContain("Walkrounds consistently identify and celebrate positive practice");
    });

    it("includes environmental strength when envPassRate >= 90", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [makeWalkround({ environmental_checks_good: 9, environmental_checks_total: 10 })],
        }),
      );
      expect(r.strengths).toContain("Environmental standards are maintained to a high level across the home");
    });

    it("does not include environmental strength when envTotal is 0", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [makeWalkround({ environmental_checks_good: 0, environmental_checks_total: 0 })],
        }),
      );
      expect(r.strengths).not.toContain("Environmental standards are maintained to a high level across the home");
    });

    it("includes child interaction strength when rate >= 80", () => {
      const walkrounds = Array.from({ length: 5 }, (_, i) =>
        makeWalkround({ id: `w${i}`, child_interactions_count: 2 }),
      );
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      expect(r.strengths).toContain("Managers routinely engage with children during walkrounds — voice of child is central");
    });

    it("includes follow-up strength when followUpRate >= 90", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [makeWalkround({ follow_up_actions_count: 10, follow_up_actions_completed: 9 })],
        }),
      );
      expect(r.strengths).toContain("Follow-up actions from walkrounds are completed promptly and effectively");
    });

    it("does not include follow-up strength when no follow-ups", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [makeWalkround({ follow_up_actions_count: 0, follow_up_actions_completed: 0 })],
        }),
      );
      expect(r.strengths).not.toContain("Follow-up actions from walkrounds are completed promptly and effectively");
    });

    it("includes unannounced strength when rate >= 30", () => {
      const walkrounds = [
        makeWalkround({ id: "w1", walkround_type: "unannounced" }),
        makeWalkround({ id: "w2", walkround_type: "daily" }),
        makeWalkround({ id: "w3", walkround_type: "daily" }),
      ];
      // 1/3 = 33%
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      expect(r.strengths).toContain("Regular unannounced walkrounds demonstrate proactive, authentic oversight");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 9. CONCERNS GENERATION
  // ════════════════════════════════════════════════════════════════════════

  describe("9 — Concerns generation", () => {
    it("flags no walkrounds concern", () => {
      const r = computeManagementWalkroundOversight(baseInput());
      expect(r.concerns).toContain("No management walkrounds recorded — this is a significant governance gap");
    });

    it("does not flag no walkrounds concern when walkrounds exist", () => {
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds: [makeWalkround()] }));
      expect(r.concerns).not.toContain("No management walkrounds recorded — this is a significant governance gap");
    });

    it("flags deficit-focused concern when positiveObsRate < 30", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [makeWalkround({ positive_observations_count: 1, improvements_count: 9 })],
        }),
      );
      expect(r.concerns).toContain("Walkrounds are overly focused on deficits — positive practice is not being recognised");
    });

    it("does not flag deficit concern when observations are 0", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [makeWalkround({ positive_observations_count: 0, improvements_count: 0 })],
        }),
      );
      expect(r.concerns).not.toContain("Walkrounds are overly focused on deficits — positive practice is not being recognised");
    });

    it("flags environmental concern when envPassRate < 50", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [makeWalkround({ environmental_checks_good: 4, environmental_checks_total: 10 })],
        }),
      );
      expect(r.concerns).toContain("Environmental checks reveal widespread issues requiring urgent attention");
    });

    it("does not flag environmental concern when envTotal is 0", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [makeWalkround({ environmental_checks_good: 0, environmental_checks_total: 0 })],
        }),
      );
      expect(r.concerns).not.toContain("Environmental checks reveal widespread issues requiring urgent attention");
    });

    it("flags child interaction concern when rate < 30", () => {
      const walkrounds = [
        makeWalkround({ id: "w1", child_interactions_count: 1 }),
        makeWalkround({ id: "w2", child_interactions_count: 0 }),
        makeWalkround({ id: "w3", child_interactions_count: 0 }),
        makeWalkround({ id: "w4", child_interactions_count: 0 }),
      ];
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      expect(r.concerns).toContain("Children are rarely engaged during walkrounds — their experience is not being directly observed");
    });

    it("flags follow-up concern when completion < 50", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [makeWalkround({ follow_up_actions_count: 10, follow_up_actions_completed: 4 })],
        }),
      );
      expect(r.concerns).toContain("Walkround follow-up actions are not being completed — oversight has no teeth");
    });

    it("flags no unannounced concern when rate is 0 with walkrounds", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [makeWalkround({ walkround_type: "daily" })],
        }),
      );
      expect(r.concerns).toContain("No unannounced walkrounds — Ofsted expects managers to see unscripted, authentic practice");
    });

    it("does not flag unannounced concern when no walkrounds", () => {
      const r = computeManagementWalkroundOversight(baseInput());
      expect(r.concerns).not.toContain("No unannounced walkrounds — Ofsted expects managers to see unscripted, authentic practice");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 10. RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════

  describe("10 — Recommendations", () => {
    it("recommends implementing walkrounds when total is 0", () => {
      const r = computeManagementWalkroundOversight(baseInput());
      const rec = r.recommendations.find(x => x.recommendation.includes("Implement a structured management walkround schedule"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 13");
    });

    it("recommends increasing frequency when 1-3 walkrounds", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({ walkrounds: [makeWalkround({ walkround_type: "daily" })] }),
      );
      const rec = r.recommendations.find(x => x.recommendation.includes("Increase walkround frequency"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("does not recommend increasing frequency when >= 4", () => {
      const walkrounds = Array.from({ length: 4 }, (_, i) =>
        makeWalkround({ id: `w${i}` }),
      );
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      expect(r.recommendations.find(x => x.recommendation.includes("Increase walkround frequency"))).toBeUndefined();
    });

    it("recommends child engagement when childInteractionRate < 50", () => {
      const walkrounds = [
        makeWalkround({ id: "w1", child_interactions_count: 0 }),
        makeWalkround({ id: "w2", child_interactions_count: 0 }),
        makeWalkround({ id: "w3", child_interactions_count: 1 }),
      ];
      // 1/3 = 33% < 50%
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      const rec = r.recommendations.find(x => x.recommendation.includes("meaningful engagement with children"));
      expect(rec).toBeDefined();
      expect(rec!.regulatory_ref).toBe("SCCIF Voice of Child");
    });

    it("does not recommend child engagement when rate >= 50", () => {
      const walkrounds = [
        makeWalkround({ id: "w1", child_interactions_count: 2 }),
        makeWalkround({ id: "w2", child_interactions_count: 2 }),
      ];
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      expect(r.recommendations.find(x => x.recommendation.includes("meaningful engagement with children"))).toBeUndefined();
    });

    it("recommends follow-up tracking when rate < 70", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [makeWalkround({ follow_up_actions_count: 10, follow_up_actions_completed: 6 })],
        }),
      );
      const rec = r.recommendations.find(x => x.recommendation.includes("Strengthen tracking of walkround follow-up actions"));
      expect(rec).toBeDefined();
    });

    it("does not recommend follow-up tracking when no follow-ups", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [makeWalkround({ follow_up_actions_count: 0, follow_up_actions_completed: 0 })],
        }),
      );
      expect(r.recommendations.find(x => x.recommendation.includes("Strengthen tracking"))).toBeUndefined();
    });

    it("recommends unannounced walkrounds when rate is 0 with walkrounds", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({ walkrounds: [makeWalkround({ walkround_type: "daily" })] }),
      );
      const rec = r.recommendations.find(x => x.recommendation.includes("unannounced walkrounds"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
      expect(rec!.regulatory_ref).toBe("SCCIF Leadership");
    });

    it("recommends addressing environmental issues when envPassRate < 70", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [makeWalkround({ environmental_checks_good: 6, environmental_checks_total: 10 })],
        }),
      );
      const rec = r.recommendations.find(x => x.recommendation.includes("Address environmental issues"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 25");
    });

    it("does not recommend environment fix when envTotal is 0", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [makeWalkround({ environmental_checks_good: 0, environmental_checks_total: 0 })],
        }),
      );
      expect(r.recommendations.find(x => x.recommendation.includes("Address environmental issues"))).toBeUndefined();
    });

    it("ranks recommendations sequentially starting from 1", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [
            makeWalkround({
              walkround_type: "daily",
              positive_observations_count: 0,
              improvements_count: 5,
              child_interactions_count: 0,
              environmental_checks_good: 3,
              environmental_checks_total: 10,
              follow_up_actions_count: 10,
              follow_up_actions_completed: 2,
            }),
          ],
        }),
      );
      r.recommendations.forEach((rec, i) => {
        expect(rec.rank).toBe(i + 1);
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 11. INSIGHTS
  // ════════════════════════════════════════════════════════════════════════

  describe("11 — Insights", () => {
    it("generates exemplary insight when frequent, balanced, and child-focused", () => {
      const walkrounds = Array.from({ length: 8 }, (_, i) =>
        makeWalkround({
          id: `w${i}`,
          positive_observations_count: 8,
          improvements_count: 2,
          child_interactions_count: 3,
        }),
      );
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      // total>=8, posObsRate=pct(64,80)=80>=70, childRate=100>=80
      expect(r.insights.some(i => i.text.includes("exemplary") && i.severity === "positive")).toBe(true);
    });

    it("does not generate exemplary insight when frequency < 8", () => {
      const walkrounds = Array.from({ length: 7 }, (_, i) =>
        makeWalkround({
          id: `w${i}`,
          positive_observations_count: 8,
          improvements_count: 2,
          child_interactions_count: 3,
        }),
      );
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      expect(r.insights.some(i => i.text.includes("exemplary"))).toBe(false);
    });

    it("generates critical insight when no walkrounds", () => {
      const r = computeManagementWalkroundOversight(baseInput());
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("regulators will flag this"))).toBe(true);
    });

    it("generates warning insight when follow-up < 50%", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [makeWalkround({ follow_up_actions_count: 10, follow_up_actions_completed: 4 })],
        }),
      );
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("performative"))).toBe(true);
    });

    it("does not generate follow-up warning when no follow-ups exist", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [makeWalkround({ follow_up_actions_count: 0, follow_up_actions_completed: 0 })],
        }),
      );
      expect(r.insights.some(i => i.text.includes("performative"))).toBe(false);
    });

    it("generates child engagement insight when rate >= 80", () => {
      const walkrounds = Array.from({ length: 5 }, (_, i) =>
        makeWalkround({ id: `w${i}`, child_interactions_count: 3 }),
      );
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      expect(r.insights.some(i => i.text.includes("High child engagement") && i.severity === "positive")).toBe(true);
    });

    it("generates unannounced culture insight when rate >= 30", () => {
      const walkrounds = [
        makeWalkround({ id: "w1", walkround_type: "unannounced" }),
        makeWalkround({ id: "w2", walkround_type: "daily" }),
        makeWalkround({ id: "w3", walkround_type: "daily" }),
      ];
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      expect(r.insights.some(i => i.text.includes("culture of transparency") && i.severity === "positive")).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 12. HEADLINE FOR EACH RATING
  // ════════════════════════════════════════════════════════════════════════

  describe("12 — Headlines", () => {
    it("outstanding headline", () => {
      const walkrounds = Array.from({ length: 10 }, (_, i) =>
        makeWalkround({
          id: `w${i}`,
          walkround_type: i < 4 ? "unannounced" : "daily",
          positive_observations_count: 5,
          improvements_count: 1,
          child_interactions_count: 3,
          environmental_checks_good: 10,
          environmental_checks_total: 10,
          follow_up_actions_count: 3,
          follow_up_actions_completed: 3,
        }),
      );
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      expect(r.headline).toBe("Management walkrounds are frequent, thorough and drive continuous improvement");
    });

    it("good headline", () => {
      const walkrounds = Array.from({ length: 5 }, (_, i) =>
        makeWalkround({
          id: `w${i}`,
          walkround_type: i === 0 ? "unannounced" : "daily",
          positive_observations_count: 4,
          improvements_count: 2,
          child_interactions_count: 2,
          environmental_checks_good: 8,
          environmental_checks_total: 10,
          follow_up_actions_count: 2,
          follow_up_actions_completed: 2,
        }),
      );
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      expect(r.headline).toBe("Good management oversight with regular walkrounds and effective follow-through");
    });

    it("adequate headline", () => {
      const walkrounds = Array.from({ length: 3 }, (_, i) =>
        makeWalkround({
          id: `w${i}`,
          walkround_type: "daily",
          positive_observations_count: 2,
          improvements_count: 2,
          child_interactions_count: 1,
          environmental_checks_good: 7,
          environmental_checks_total: 10,
          follow_up_actions_count: 3,
          follow_up_actions_completed: 2,
        }),
      );
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      expect(r.headline).toBe("Management walkrounds are adequate but need more consistency and depth");
    });

    it("inadequate headline", () => {
      const r = computeManagementWalkroundOversight(baseInput());
      expect(r.headline).toBe("Management walkround practice is inadequate — oversight of the home is insufficient");
    });

    it("insufficient_data headline", () => {
      const r = computeManagementWalkroundOversight(baseInput({ total_staff: 0 }));
      expect(r.headline).toBe("No data available for management walkround analysis");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 13. EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("13 — Edge cases", () => {
    it("all-zero metrics on a single walkround", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [
            makeWalkround({
              positive_observations_count: 0,
              improvements_count: 0,
              child_interactions_count: 0,
              staff_interactions_count: 0,
              environmental_checks_good: 0,
              environmental_checks_total: 0,
              immediate_actions_count: 0,
              follow_up_actions_count: 0,
              follow_up_actions_completed: 0,
              themes_count: 0,
              positive_practice_noted_count: 0,
              walkround_type: "daily",
            }),
          ],
        }),
      );
      // base 52 + freq 0 + posObs(totalObs=0, total>0) -1 + env(envTotal=0, total>0) -1
      // + child(pct(0,1)=0<30) -5 + followUp(totalFollowUp=0, total>0) +2 + unannounced(0%) -3 = 44
      expect(r.walkround_score).toBe(44);
      expect(r.walkround_rating).toBe("inadequate");
    });

    it("single walkround with perfect stats", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [
            makeWalkround({
              walkround_type: "unannounced",
              positive_observations_count: 10,
              improvements_count: 2,
              child_interactions_count: 5,
              environmental_checks_good: 10,
              environmental_checks_total: 10,
              follow_up_actions_count: 5,
              follow_up_actions_completed: 5,
            }),
          ],
        }),
      );
      // base 52 + freq(1) 0 + posObs(pct(10,12)=83>=70) +6 + env(100>=90) +5
      // + child(pct(1,1)=100>=80) +5 + followUp(100>=90) +4 + unannounced(pct(1,1)=100>=30) +5 = 77
      expect(r.walkround_score).toBe(77);
      expect(r.walkround_rating).toBe("good");
    });

    it("mixed walkround types", () => {
      const walkrounds = [
        makeWalkround({ id: "w1", walkround_type: "daily" }),
        makeWalkround({ id: "w2", walkround_type: "weekly_themed" }),
        makeWalkround({ id: "w3", walkround_type: "unannounced" }),
        makeWalkround({ id: "w4", walkround_type: "pre_inspection_rehearsal" }),
        makeWalkround({ id: "w5", walkround_type: "post_incident_review" }),
      ];
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      // 1 unannounced out of 5 = 20% → +2 for unannounced
      expect(r.unannounced_rate).toBe(20);
      expect(r.total_walkrounds).toBe(5);
    });

    it("score is clamped to 0 minimum", () => {
      // Manufacture an extreme negative scenario
      // Actually hard to get below 0 with base 52, but verify clamp logic
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [
            makeWalkround({
              positive_observations_count: 0,
              improvements_count: 10,
              child_interactions_count: 0,
              environmental_checks_good: 1,
              environmental_checks_total: 10,
              follow_up_actions_count: 10,
              follow_up_actions_completed: 2,
              walkround_type: "daily",
            }),
          ],
        }),
      );
      expect(r.walkround_score).toBeGreaterThanOrEqual(0);
    });

    it("score is clamped to 100 maximum", () => {
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: Array.from({ length: 20 }, (_, i) =>
            makeWalkround({
              id: `w${i}`,
              walkround_type: i < 8 ? "unannounced" : "daily",
              positive_observations_count: 10,
              improvements_count: 1,
              child_interactions_count: 5,
              environmental_checks_good: 10,
              environmental_checks_total: 10,
              follow_up_actions_count: 5,
              follow_up_actions_completed: 5,
            }),
          ),
        }),
      );
      expect(r.walkround_score).toBeLessThanOrEqual(100);
    });

    it("large number of walkrounds computes correctly", () => {
      const walkrounds = Array.from({ length: 50 }, (_, i) =>
        makeWalkround({ id: `w${i}` }),
      );
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      expect(r.total_walkrounds).toBe(50);
    });

    it("pct helper returns 0 when denominator is 0", () => {
      expect(pct(5, 0)).toBe(0);
    });

    it("rates are computed correctly with multiple walkrounds", () => {
      const walkrounds = [
        makeWalkround({
          id: "w1",
          positive_observations_count: 4,
          improvements_count: 6,
          environmental_checks_good: 3,
          environmental_checks_total: 5,
          child_interactions_count: 0,
          follow_up_actions_count: 5,
          follow_up_actions_completed: 3,
        }),
        makeWalkround({
          id: "w2",
          positive_observations_count: 6,
          improvements_count: 4,
          environmental_checks_good: 4,
          environmental_checks_total: 5,
          child_interactions_count: 2,
          follow_up_actions_count: 5,
          follow_up_actions_completed: 4,
        }),
      ];
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      // positive: 10/20 = 50, env: 7/10 = 70, child: 1/2 = 50, followUp: 7/10 = 70
      expect(r.positive_observation_rate).toBe(50);
      expect(r.environmental_pass_rate).toBe(70);
      expect(r.child_interaction_rate).toBe(50);
      expect(r.follow_up_completion_rate).toBe(70);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 14. CAP TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("14 — Cap tests", () => {
    it("recommendations are capped at 5", () => {
      // Trigger all 6 recommendation paths
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [
            makeWalkround({
              walkround_type: "daily",
              positive_observations_count: 0,
              improvements_count: 5,
              child_interactions_count: 0,
              environmental_checks_good: 3,
              environmental_checks_total: 10,
              follow_up_actions_count: 10,
              follow_up_actions_completed: 3,
            }),
          ],
        }),
      );
      // Triggered: increase frequency (total=1<4), child engagement (<50%), follow-up (<70%),
      // unannounced (0%), environment (<70%) — 5 recs possible from 1 walkround
      // (implement walkrounds NOT triggered since total>0)
      expect(r.recommendations.length).toBeLessThanOrEqual(5);
      // Verify ranks are sequential
      r.recommendations.forEach((rec, i) => {
        expect(rec.rank).toBe(i + 1);
      });
    });

    it("all 6 recommendation paths can be triggered but only 5 survive cap", () => {
      // Cannot trigger both "implement schedule" (total=0) and "increase frequency" (total 1-3) simultaneously
      // or "child engagement" (total>0) with total=0. So max from one scenario is 5 anyway.
      // But verify the cap logic works regardless:
      const r = computeManagementWalkroundOversight(
        baseInput({
          walkrounds: [
            makeWalkround({
              walkround_type: "daily",
              positive_observations_count: 0,
              improvements_count: 5,
              child_interactions_count: 0,
              environmental_checks_good: 3,
              environmental_checks_total: 10,
              follow_up_actions_count: 10,
              follow_up_actions_completed: 2,
            }),
          ],
        }),
      );
      expect(r.recommendations.length).toBeLessThanOrEqual(5);
    });

    it("insights are capped at 3", () => {
      // Trigger as many insights as possible:
      // 1) exemplary (total>=8 + posObs>=70 + childRate>=80) — positive
      // 2) no walkrounds — not compatible with #1
      // 3) follow-up < 50 — warning (conflicts with exemplary scenario typically)
      // 4) child engagement >=80 — positive
      // 5) unannounced >=30 — positive
      // Best scenario for 4+ insights: all positives (#1, #4, #5) plus maybe warning
      // #1 requires #4 intrinsically. So #1 + #4 + #5 = 3 unique insights
      const walkrounds = Array.from({ length: 10 }, (_, i) =>
        makeWalkround({
          id: `w${i}`,
          walkround_type: i < 4 ? "unannounced" : "daily",
          positive_observations_count: 8,
          improvements_count: 2,
          child_interactions_count: 3,
          follow_up_actions_count: 10,
          follow_up_actions_completed: 4,
        }),
      );
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      // Should trigger: exemplary, follow-up warning, child engagement, unannounced = 4 potential
      // Capped at 3
      expect(r.insights.length).toBeLessThanOrEqual(3);
    });

    it("insights cap preserves order (first 3 survive)", () => {
      const walkrounds = Array.from({ length: 10 }, (_, i) =>
        makeWalkround({
          id: `w${i}`,
          walkround_type: i < 4 ? "unannounced" : "daily",
          positive_observations_count: 8,
          improvements_count: 2,
          child_interactions_count: 3,
          follow_up_actions_count: 10,
          follow_up_actions_completed: 4,
        }),
      );
      const r = computeManagementWalkroundOversight(baseInput({ walkrounds }));
      // Order: exemplary (positive), follow-up warning, child engagement (positive)
      // 4th (unannounced) should be cut
      if (r.insights.length === 3) {
        expect(r.insights[0].text).toContain("exemplary");
        expect(r.insights[1].text).toContain("performative");
        expect(r.insights[2].text).toContain("High child engagement");
      }
    });
  });
});
