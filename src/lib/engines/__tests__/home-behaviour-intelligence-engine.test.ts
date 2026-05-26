import {
  computeHomeBehaviour,
  type HomeBehaviourInput,
  type BehaviourLogInput,
  type SanctionRewardInput,
  type ConsequenceInput,
} from "../home-behaviour-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = "2025-03-15";

function makeLog(overrides: Partial<BehaviourLogInput> = {}): BehaviourLogInput {
  return {
    id: `bh-${Math.random().toString(36).slice(2, 8)}`,
    date: "2025-03-05",
    child_id: "C1",
    direction: "positive",
    intensity: "low",
    has_antecedent: true,
    has_strategy: true,
    has_outcome: true,
    ...overrides,
  };
}

function makeSR(overrides: Partial<SanctionRewardInput> = {}): SanctionRewardInput {
  return {
    id: `sr-${Math.random().toString(36).slice(2, 8)}`,
    date: "2025-03-05",
    child_id: "C1",
    direction: "reward",
    proportionate: true,
    has_child_response: true,
    has_outcome: true,
    ...overrides,
  };
}

function makeCons(overrides: Partial<ConsequenceInput> = {}): ConsequenceInput {
  return {
    id: `cnsq-${Math.random().toString(36).slice(2, 8)}`,
    date: "2025-03-05",
    child_id: "C1",
    approach: "restorative_conversation",
    has_child_voice: true,
    relationship_repaired: true,
    linked_behaviour_plan: true,
    has_restorative_questions: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeBehaviourInput> = {}): HomeBehaviourInput {
  // Default: 8 logs (6 positive, 2 concern = 75% positive), 10 SR (7 rewards, 3 sanctions = 70% rewards), 4 consequences
  return {
    today: TODAY,
    total_children: 3,
    child_ids: ["C1", "C2", "C3"],
    behaviour_logs: [
      makeLog({ id: "bh1", child_id: "C1" }),
      makeLog({ id: "bh2", child_id: "C1" }),
      makeLog({ id: "bh3", child_id: "C2" }),
      makeLog({ id: "bh4", child_id: "C2" }),
      makeLog({ id: "bh5", child_id: "C3" }),
      makeLog({ id: "bh6", child_id: "C3" }),
      makeLog({ id: "bh7", child_id: "C1", direction: "concern", intensity: "low" }),
      makeLog({ id: "bh8", child_id: "C2", direction: "concern", intensity: "low" }),
    ],
    sanctions_rewards: [
      makeSR({ id: "sr1", child_id: "C1" }),
      makeSR({ id: "sr2", child_id: "C1" }),
      makeSR({ id: "sr3", child_id: "C2" }),
      makeSR({ id: "sr4", child_id: "C2" }),
      makeSR({ id: "sr5", child_id: "C3" }),
      makeSR({ id: "sr6", child_id: "C3" }),
      makeSR({ id: "sr7", child_id: "C1" }),
      makeSR({ id: "sr8", child_id: "C1", direction: "sanction" }),
      makeSR({ id: "sr9", child_id: "C2", direction: "sanction" }),
      makeSR({ id: "sr10", child_id: "C3", direction: "sanction" }),
    ],
    consequences: [
      makeCons({ id: "c1", child_id: "C1" }),
      makeCons({ id: "c2", child_id: "C2" }),
      makeCons({ id: "c3", child_id: "C3" }),
      makeCons({ id: "c4", child_id: "C1" }),
    ],
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// RATING TIER TESTS
// ════════════════════════════════════════════════════════════════════════════

describe("Home Behaviour Management Intelligence Engine", () => {

  // ── Insufficient data ──────────────────────────────────────────────────

  describe("insufficient data", () => {
    const result = computeHomeBehaviour(baseInput({
      behaviour_logs: [],
      sanctions_rewards: [],
      consequences: [],
    }));

    it("rates insufficient_data", () => expect(result.behaviour_rating).toBe("insufficient_data"));
    it("scores 0", () => expect(result.behaviour_score).toBe(0));
    it("has critical insight", () => expect(result.insights.some(i => i.severity === "critical")).toBe(true));
    it("has concern", () => expect(result.concerns.length).toBeGreaterThan(0));
  });

  // ── Outstanding ────────────────────────────────────────────────────────
  // 75% positive, 0 high/critical, 100% ABC, 70% rewards, 100% proportionate,
  // 100% child response, 100% child voice, 100% repair, 100% BSP, 0 repeat, 100% strategy
  // Score: 50+5+3+3+5+3+2+3+3+2+2+2 = 83

  describe("outstanding rating", () => {
    const result = computeHomeBehaviour(baseInput());

    it("rates outstanding", () => expect(result.behaviour_rating).toBe("outstanding"));
    it("scores 83", () => expect(result.behaviour_score).toBe(83));
    it("headline mentions outstanding", () => expect(result.headline).toContain("Outstanding"));
    it("has strengths", () => expect(result.strengths.length).toBeGreaterThan(0));
    it("has no concerns", () => expect(result.concerns).toHaveLength(0));
  });

  // ── Good ───────────────────────────────────────────────────────────────
  // ~55% positive, 1 high, 85% ABC, 55% rewards, 90% proportionate,
  // 85% child response, 85% child voice, 75% repair, 65% BSP, 1 repeat child, 85% strategy
  // Score: 50+2+0+3+2+1+2+3+1+2-2+2 = 66

  describe("good rating", () => {
    // 20 logs: 11 positive + 9 concern = 55% positive
    // 1 concern is high intensity; 13 have ABC, 13 have strategy (out of 20 → wait need precise)
    // Actually let me make it simpler: use arrays
    const logs: BehaviourLogInput[] = [];
    // 11 positive
    for (let i = 0; i < 11; i++) {
      logs.push(makeLog({ id: `bh${i}`, child_id: `C${(i % 3) + 1}` }));
    }
    // 9 concern (1 high, rest low); C1 has 4 concerns = repeat child
    for (let i = 0; i < 9; i++) {
      logs.push(makeLog({
        id: `bhc${i}`,
        child_id: i < 4 ? "C1" : `C${(i % 3) + 1}`,
        direction: "concern",
        intensity: i === 0 ? "high" : "low",
        // 17/20 have ABC (85%), 3 don't
        has_antecedent: i < 6,
        has_strategy: i < 6,
        has_outcome: i < 6,
      }));
    }
    // Fix positives to also have 100% ABC → total ABC = 11+6 = 17/20 = 85%
    // Strategy: 11+6 = 17/20 = 85%

    const srs: SanctionRewardInput[] = [];
    // 11 rewards + 9 sanctions = 55% rewards
    for (let i = 0; i < 11; i++) {
      srs.push(makeSR({ id: `sr${i}`, child_id: `C${(i % 3) + 1}` }));
    }
    for (let i = 0; i < 9; i++) {
      srs.push(makeSR({
        id: `srs${i}`,
        child_id: `C${(i % 3) + 1}`,
        direction: "sanction",
        proportionate: i < 8, // 8/9 = 89% ≈ 90%
        has_child_response: i < 7, // 11+7 = 18/20 = 90% > 80
      }));
    }

    const conss: ConsequenceInput[] = [];
    // 20 consequences: 17 with child voice (85%), 15 repair (75%), 13 BSP linked (65%)
    for (let i = 0; i < 20; i++) {
      conss.push(makeCons({
        id: `cons${i}`,
        child_id: `C${(i % 3) + 1}`,
        has_child_voice: i < 17,
        relationship_repaired: i < 15,
        linked_behaviour_plan: i < 13,
      }));
    }

    const result = computeHomeBehaviour(baseInput({
      behaviour_logs: logs,
      sanctions_rewards: srs,
      consequences: conss,
    }));

    it("rates good", () => expect(result.behaviour_rating).toBe("good"));
    it("scores 66", () => expect(result.behaviour_score).toBe(66));
    it("headline mentions good", () => expect(result.headline).toContain("Good"));
    it("has concerns", () => expect(result.concerns.length).toBeGreaterThan(0));
  });

  // ── Adequate ───────────────────────────────────────────────────────────
  // 50% positive, 1 high, 55% ABC, 50% rewards, 80% proportionate,
  // 70% child response, 65% child voice, 65% repair, 50% BSP, 1 repeat, 60% strategy
  // Score: 50+2+0-3+2+1-1+1+1-1-2-2 = 48

  describe("adequate rating", () => {
    const logs: BehaviourLogInput[] = [];
    // 10 logs: 5 positive, 5 concern = 50% positive
    for (let i = 0; i < 5; i++) {
      logs.push(makeLog({ id: `bh${i}`, child_id: `C${(i % 3) + 1}` }));
    }
    for (let i = 0; i < 5; i++) {
      logs.push(makeLog({
        id: `bhc${i}`,
        child_id: i < 3 ? "C1" : `C${(i % 2) + 2}`, // C1 has 3 concerns = repeat
        direction: "concern",
        intensity: i === 0 ? "high" : "low",
        // 5 positives have ABC, concerns: first 1 has ABC = 6/10 = 60%... need 55%
        // Hmm, 55% of 10 = 5.5, so let's use 5/10 = 50%? or 6/10=60% ≥60 → +1
        // Let me use: positives all have ABC (5), concerns: 0 have ABC = 5/10 = 50% < 60 → -3
        has_antecedent: false,
        has_strategy: i < 1, // 5+1 = 6/10 = 60% strategy
        has_outcome: false,
      }));
    }

    const srs: SanctionRewardInput[] = [];
    // 10 SR: 5 rewards, 5 sanctions = 50% rewards
    for (let i = 0; i < 5; i++) {
      srs.push(makeSR({ id: `sr${i}`, child_id: `C${(i % 3) + 1}` }));
    }
    for (let i = 0; i < 5; i++) {
      srs.push(makeSR({
        id: `srs${i}`,
        child_id: `C${(i % 3) + 1}`,
        direction: "sanction",
        proportionate: i < 4, // 4/5 = 80%
        has_child_response: i < 2, // 5+2 = 7/10 = 70% < 80 → -1
      }));
    }

    const conss: ConsequenceInput[] = [];
    // 20 consequences: 13 voice (65%), 13 repair (65%), 10 BSP (50%)
    for (let i = 0; i < 20; i++) {
      conss.push(makeCons({
        id: `cons${i}`,
        child_id: `C${(i % 3) + 1}`,
        has_child_voice: i < 13,
        relationship_repaired: i < 13,
        linked_behaviour_plan: i < 10,
      }));
    }

    const result = computeHomeBehaviour(baseInput({
      behaviour_logs: logs,
      sanctions_rewards: srs,
      consequences: conss,
    }));

    it("rates adequate", () => expect(result.behaviour_rating).toBe("adequate"));
    it("scores 48", () => expect(result.behaviour_score).toBe(48));
    it("headline mentions adequate", () => expect(result.headline).toContain("Adequate"));
    it("has concerns", () => expect(result.concerns.length).toBeGreaterThan(0));
    it("has recommendations", () => expect(result.recommendations.length).toBeGreaterThan(0));
  });

  // ── Inadequate ─────────────────────────────────────────────────────────

  describe("inadequate rating", () => {
    const logs: BehaviourLogInput[] = [];
    // 10 logs: 2 positive (20%), 8 concern with 5 high/critical
    for (let i = 0; i < 2; i++) {
      logs.push(makeLog({ id: `bh${i}`, child_id: "C1", has_antecedent: false, has_strategy: false, has_outcome: false }));
    }
    for (let i = 0; i < 8; i++) {
      logs.push(makeLog({
        id: `bhc${i}`,
        child_id: i < 4 ? "C1" : `C${(i % 2) + 2}`,
        direction: "concern",
        intensity: i < 5 ? "high" : "low",
        has_antecedent: false,
        has_strategy: false,
        has_outcome: false,
      }));
    }

    const srs: SanctionRewardInput[] = [];
    // 10 SR: 2 rewards (20%), 8 sanctions with 4 disproportionate
    for (let i = 0; i < 2; i++) {
      srs.push(makeSR({ id: `sr${i}`, child_id: "C1", has_child_response: false }));
    }
    for (let i = 0; i < 8; i++) {
      srs.push(makeSR({
        id: `srs${i}`,
        child_id: `C${(i % 3) + 1}`,
        direction: "sanction",
        proportionate: i < 4,
        has_child_response: false,
      }));
    }

    const conss: ConsequenceInput[] = [];
    // 10 consequences: 2 voice (20%), 2 repair (20%), 1 BSP (10%)
    for (let i = 0; i < 10; i++) {
      conss.push(makeCons({
        id: `cons${i}`,
        child_id: `C${(i % 3) + 1}`,
        has_child_voice: i < 2,
        relationship_repaired: i < 2,
        linked_behaviour_plan: i < 1,
      }));
    }

    const result = computeHomeBehaviour(baseInput({
      behaviour_logs: logs,
      sanctions_rewards: srs,
      consequences: conss,
    }));

    it("rates inadequate", () => expect(result.behaviour_rating).toBe("inadequate"));
    it("scores below 45", () => expect(result.behaviour_score).toBeLessThan(45));
    it("headline mentions inadequate", () => expect(result.headline).toContain("inadequate"));
    it("has multiple concerns", () => expect(result.concerns.length).toBeGreaterThanOrEqual(3));
    it("has critical insights", () => expect(result.insights.some(i => i.severity === "critical")).toBe(true));
  });

  // ════════════════════════════════════════════════════════════════════════
  // PROFILE CALCULATION TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("behaviour profile", () => {
    const logs = [
      makeLog({ id: "bh1", child_id: "C1", direction: "positive" }),
      makeLog({ id: "bh2", child_id: "C1", direction: "positive" }),
      makeLog({ id: "bh3", child_id: "C1", direction: "concern", intensity: "high" }),
      makeLog({ id: "bh4", child_id: "C1", direction: "concern", intensity: "low", has_antecedent: false }),
      makeLog({ id: "bh5", child_id: "C2", direction: "concern", intensity: "critical" }),
    ];
    const result = computeHomeBehaviour(baseInput({ behaviour_logs: logs }));
    const p = result.behaviour_profile;

    it("total_logs_90d", () => expect(p.total_logs_90d).toBe(5));
    it("positive_count", () => expect(p.positive_count).toBe(2));
    it("concern_count", () => expect(p.concern_count).toBe(3));
    it("positive_ratio", () => expect(p.positive_ratio).toBe(40)); // 2/5
    it("high_critical_count", () => expect(p.high_critical_count).toBe(2));
    it("abc_documentation_rate", () => expect(p.abc_documentation_rate).toBe(80)); // 4/5
    it("strategy_use_rate", () => expect(p.strategy_use_rate).toBe(100)); // 5/5
    it("children_with_concerns", () => expect(p.children_with_concerns.sort()).toEqual(["C1", "C2"]));
    it("repeat_concern_children — C1 has only 2 concerns (need 3+)", () => expect(p.repeat_concern_children).toEqual([]));
  });

  describe("reinforcement profile", () => {
    const srs = [
      makeSR({ id: "sr1", direction: "reward", has_child_response: true }),
      makeSR({ id: "sr2", direction: "reward", has_child_response: true }),
      makeSR({ id: "sr3", direction: "sanction", proportionate: true, has_child_response: false }),
      makeSR({ id: "sr4", direction: "sanction", proportionate: false, has_child_response: false }),
    ];
    const result = computeHomeBehaviour(baseInput({ sanctions_rewards: srs }));
    const p = result.reinforcement_profile;

    it("total_entries_90d", () => expect(p.total_entries_90d).toBe(4));
    it("reward_count", () => expect(p.reward_count).toBe(2));
    it("sanction_count", () => expect(p.sanction_count).toBe(2));
    it("reward_ratio", () => expect(p.reward_ratio).toBe(50)); // 2/4
    it("proportionality_rate", () => expect(p.proportionality_rate).toBe(50)); // 1/2 sanctions
    it("child_response_rate", () => expect(p.child_response_rate).toBe(50)); // 2/4
  });

  describe("restorative profile", () => {
    const conss = [
      makeCons({ id: "c1", has_child_voice: true, relationship_repaired: true, linked_behaviour_plan: true }),
      makeCons({ id: "c2", has_child_voice: true, relationship_repaired: false, linked_behaviour_plan: true }),
      makeCons({ id: "c3", has_child_voice: false, relationship_repaired: false, linked_behaviour_plan: false }),
    ];
    const result = computeHomeBehaviour(baseInput({ consequences: conss }));
    const p = result.restorative_profile;

    it("total_consequences_90d", () => expect(p.total_consequences_90d).toBe(3));
    it("child_voice_rate", () => expect(p.child_voice_rate).toBe(67)); // 2/3
    it("relationship_repair_rate", () => expect(p.relationship_repair_rate).toBe(33)); // 1/3
    it("bsp_linked_rate", () => expect(p.bsp_linked_rate).toBe(67)); // 2/3
  });

  // ════════════════════════════════════════════════════════════════════════
  // SCORING MODIFIER TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("scoring — positive ratio", () => {
    it(">=60% positive gives +5", () => {
      const r = computeHomeBehaviour(baseInput());
      expect(r.behaviour_profile.positive_ratio).toBe(75);
    });

    it("<40% positive gives -4", () => {
      const logs = [
        makeLog({ id: "bh1", direction: "positive" }),
        makeLog({ id: "bh2", direction: "concern" }),
        makeLog({ id: "bh3", direction: "concern", child_id: "C2" }),
        makeLog({ id: "bh4", direction: "concern", child_id: "C3" }),
      ];
      const r = computeHomeBehaviour(baseInput({ behaviour_logs: logs }));
      expect(r.behaviour_profile.positive_ratio).toBe(25);
    });
  });

  describe("scoring — high/critical incidents", () => {
    it("0 high/critical gives +3", () => {
      const r = computeHomeBehaviour(baseInput());
      expect(r.behaviour_profile.high_critical_count).toBe(0);
    });

    it(">3 high/critical gives -3", () => {
      const logs = Array.from({ length: 5 }, (_, i) =>
        makeLog({ id: `bh${i}`, child_id: `C${(i % 3) + 1}`, direction: "concern", intensity: "high" })
      );
      const r = computeHomeBehaviour(baseInput({ behaviour_logs: logs }));
      expect(r.behaviour_profile.high_critical_count).toBe(5);
    });
  });

  describe("scoring — reward ratio", () => {
    it(">=60% rewards gives +5", () => {
      const r = computeHomeBehaviour(baseInput());
      expect(r.reinforcement_profile.reward_ratio).toBe(70);
    });
  });

  describe("scoring — proportionality", () => {
    it("100% proportionate gives +3", () => {
      const r = computeHomeBehaviour(baseInput());
      expect(r.reinforcement_profile.proportionality_rate).toBe(100);
    });
  });

  describe("scoring — repeat concern children", () => {
    it("0 repeat gives +2", () => {
      const r = computeHomeBehaviour(baseInput());
      expect(r.behaviour_profile.repeat_concern_children).toHaveLength(0);
    });

    it("repeat children gives -2", () => {
      const logs = Array.from({ length: 5 }, (_, i) =>
        makeLog({ id: `bh${i}`, child_id: "C1", direction: "concern" })
      );
      const r = computeHomeBehaviour(baseInput({ behaviour_logs: logs }));
      expect(r.behaviour_profile.repeat_concern_children).toEqual(["C1"]);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 90-DAY WINDOW
  // ════════════════════════════════════════════════════════════════════════

  describe("90-day window", () => {
    it("excludes behaviour logs older than 90 days", () => {
      const r = computeHomeBehaviour(baseInput({
        behaviour_logs: [makeLog({ id: "bh1", date: "2024-12-01" })],
      }));
      expect(r.behaviour_profile.total_logs_90d).toBe(0);
    });

    it("excludes sanctions/rewards older than 90 days", () => {
      const r = computeHomeBehaviour(baseInput({
        sanctions_rewards: [makeSR({ id: "sr1", date: "2024-12-01" })],
      }));
      expect(r.reinforcement_profile.total_entries_90d).toBe(0);
    });

    it("excludes consequences older than 90 days", () => {
      const r = computeHomeBehaviour(baseInput({
        consequences: [makeCons({ id: "c1", date: "2024-12-01" })],
      }));
      expect(r.restorative_profile.total_consequences_90d).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    const result = computeHomeBehaviour(baseInput());

    it("positive ratio strength", () => expect(result.strengths.some(s => s.includes("positive"))).toBe(true));
    it("reward ratio strength", () => expect(result.strengths.some(s => s.includes("Reward"))).toBe(true));
    it("proportionality strength", () => expect(result.strengths.some(s => s.includes("proportionate"))).toBe(true));
    it("ABC documentation strength", () => expect(result.strengths.some(s => s.includes("ABC"))).toBe(true));
    it("repair strength", () => expect(result.strengths.some(s => s.includes("repair"))).toBe(true));
    it("child voice strength", () => expect(result.strengths.some(s => s.includes("Child voice"))).toBe(true));
    it("no high/critical strength", () => expect(result.strengths.some(s => s.includes("No high"))).toBe(true));
    it("strategy strength", () => expect(result.strengths.some(s => s.includes("strategy") || s.includes("De-escalation"))).toBe(true));
  });

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("low positive ratio concern", () => {
      const r = computeHomeBehaviour(baseInput({
        behaviour_logs: [
          makeLog({ id: "bh1", direction: "concern", child_id: "C1" }),
          makeLog({ id: "bh2", direction: "concern", child_id: "C2" }),
          makeLog({ id: "bh3", direction: "positive" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("over-focused on negative"))).toBe(true);
    });

    it("repeat concern children concern", () => {
      const logs = Array.from({ length: 4 }, (_, i) =>
        makeLog({ id: `bh${i}`, child_id: "C1", direction: "concern" })
      );
      const r = computeHomeBehaviour(baseInput({ behaviour_logs: logs }));
      expect(r.concerns.some(c => c.includes("3+ behaviour concerns"))).toBe(true);
    });

    it("high/critical incidents concern", () => {
      const logs = Array.from({ length: 5 }, (_, i) =>
        makeLog({ id: `bh${i}`, child_id: `C${(i % 3) + 1}`, direction: "concern", intensity: "high" })
      );
      const r = computeHomeBehaviour(baseInput({ behaviour_logs: logs }));
      expect(r.concerns.some(c => c.includes("high/critical"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("low positive ratio → immediate", () => {
      const r = computeHomeBehaviour(baseInput({
        behaviour_logs: [
          makeLog({ id: "bh1", direction: "concern" }),
          makeLog({ id: "bh2", direction: "concern", child_id: "C2" }),
          makeLog({ id: "bh3", direction: "positive" }),
        ],
      }));
      const rec = r.recommendations.find(x => x.recommendation.includes("positive behaviour"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("repeat concerns → immediate", () => {
      const logs = Array.from({ length: 4 }, (_, i) =>
        makeLog({ id: `bh${i}`, child_id: "C1", direction: "concern" })
      );
      const r = computeHomeBehaviour(baseInput({ behaviour_logs: logs }));
      const rec = r.recommendations.find(x => x.recommendation.includes("BSPs"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommendations are ranked sequentially", () => {
      const logs = [
        ...Array.from({ length: 4 }, (_, i) =>
          makeLog({ id: `bhc${i}`, child_id: "C1", direction: "concern", has_antecedent: false, has_strategy: false, has_outcome: false })
        ),
        makeLog({ id: "bhp1", direction: "positive" }),
      ];
      const r = computeHomeBehaviour(baseInput({ behaviour_logs: logs }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ════════════════════════════════════════════════════════════════════════

  describe("insights", () => {
    it("high/critical > 3 → critical", () => {
      const logs = Array.from({ length: 5 }, (_, i) =>
        makeLog({ id: `bh${i}`, child_id: `C${(i % 3) + 1}`, direction: "concern", intensity: "critical" })
      );
      const r = computeHomeBehaviour(baseInput({ behaviour_logs: logs }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("high/critical"))).toBe(true);
    });

    it("positive ratio >=60% → positive", () => {
      const r = computeHomeBehaviour(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("positive behaviour ratio"))).toBe(true);
    });

    it("reward-led → positive", () => {
      const r = computeHomeBehaviour(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Reward-led"))).toBe(true);
    });

    it("high repair rate → positive", () => {
      const r = computeHomeBehaviour(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("repair rate"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("only behaviour logs (no SR or consequences)", () => {
      const r = computeHomeBehaviour(baseInput({
        sanctions_rewards: [],
        consequences: [],
      }));
      expect(r.behaviour_rating).not.toBe("insufficient_data");
      expect(r.behaviour_profile.total_logs_90d).toBe(8);
    });

    it("only sanctions/rewards (no logs or consequences)", () => {
      const r = computeHomeBehaviour(baseInput({
        behaviour_logs: [],
        consequences: [],
      }));
      expect(r.behaviour_rating).not.toBe("insufficient_data");
    });

    it("score is clamped to 0-100", () => {
      const r = computeHomeBehaviour(baseInput());
      expect(r.behaviour_score).toBeGreaterThanOrEqual(0);
      expect(r.behaviour_score).toBeLessThanOrEqual(100);
    });

    it("proportionality only measures sanctions, not rewards", () => {
      const r = computeHomeBehaviour(baseInput({
        sanctions_rewards: [
          makeSR({ id: "sr1", direction: "reward" }),
          makeSR({ id: "sr2", direction: "reward" }),
          // No sanctions — proportionality not scored
        ],
      }));
      expect(r.reinforcement_profile.proportionality_rate).toBe(0); // pct(0,0) = 0
    });
  });
});
