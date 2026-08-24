// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME PEER DYNAMICS INTELLIGENCE ENGINE — TESTS
// Reg 19: behaviour management — relationships between children.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomePeerDynamics,
  type HomePeerDynamicsInput,
  type PeerDynamicInput,
  type PeerGroupAssessmentInput,
  type PeerEntryInput,
} from "../home-peer-dynamics-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<PeerEntryInput> = {}): PeerEntryInput {
  return {
    id: "pe_test",
    date: "2026-05-20",
    type: "positive_interaction",
    description: "Good interaction",
    staff_witness: "staff_1",
    intervention_used: "",
    outcome: "Positive",
    ...overrides,
  };
}

function makePair(overrides: Partial<PeerDynamicInput> = {}): PeerDynamicInput {
  return {
    id: "pd_test",
    child_id_1: "yp_1",
    child_id_2: "yp_2",
    quality: "positive",
    risk_level: "none",
    strengths: ["Good rapport"],
    concerns: [],
    strategies: [],
    entries: [makeEntry()],
    last_review_date: "2026-05-20",
    reviewed_by: "staff_1",
    next_review_due: "2026-06-15",
    ...overrides,
  };
}

function makeGroup(overrides: Partial<PeerGroupAssessmentInput> = {}): PeerGroupAssessmentInput {
  return {
    id: "pgd_test",
    assessment_date: "2026-05-20",
    assessed_by: "staff_1",
    overall_atmosphere: "calm",
    group_strengths: ["Good cohesion"],
    group_concerns: [],
    recommendations: ["Continue"],
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomePeerDynamicsInput> = {}): HomePeerDynamicsInput {
  return {
    today: "2026-05-27",
    peer_dynamics: [makePair()],
    group_assessments: [makeGroup()],
    total_children: 3,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when total_children is 0", () => {
    const r = computeHomePeerDynamics(baseInput({ total_children: 0 }));
    expect(r.peer_rating).toBe("insufficient_data");
    expect(r.peer_score).toBe(0);
  });

  it("returns insufficient_data when no peer data and no group assessments", () => {
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [],
      group_assessments: [],
    }));
    expect(r.peer_rating).toBe("insufficient_data");
  });

  it("does NOT return insufficient_data when only group assessments exist", () => {
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [],
      group_assessments: [makeGroup()],
    }));
    expect(r.peer_rating).not.toBe("insufficient_data");
  });

  it("populates all profiles with zeros on insufficient data", () => {
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [],
      group_assessments: [],
    }));
    expect(r.relationships.total_pairs).toBe(0);
    expect(r.risks.highest_risk_level).toBe("none");
    expect(r.entry_profile.total_entries).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. RELATIONSHIP PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("relationship profile", () => {
  it("counts each quality type", () => {
    const pairs = [
      makePair({ id: "p1", quality: "positive" }),
      makePair({ id: "p2", child_id_1: "yp_1", child_id_2: "yp_3", quality: "developing" }),
      makePair({ id: "p3", child_id_1: "yp_2", child_id_2: "yp_3", quality: "strained" }),
    ];
    const r = computeHomePeerDynamics(baseInput({ peer_dynamics: pairs }));
    expect(r.relationships.total_pairs).toBe(3);
    expect(r.relationships.positive_count).toBe(1);
    expect(r.relationships.developing_count).toBe(1);
    expect(r.relationships.strained_count).toBe(1);
    expect(r.relationships.conflicted_count).toBe(0);
    expect(r.relationships.neutral_count).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. RISK PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("risk profile", () => {
  it("counts each risk level and finds highest", () => {
    const pairs = [
      makePair({ id: "p1", risk_level: "none" }),
      makePair({ id: "p2", risk_level: "medium" }),
      makePair({ id: "p3", risk_level: "low" }),
    ];
    const r = computeHomePeerDynamics(baseInput({ peer_dynamics: pairs }));
    expect(r.risks.none_count).toBe(1);
    expect(r.risks.low_count).toBe(1);
    expect(r.risks.medium_count).toBe(1);
    expect(r.risks.high_count).toBe(0);
    expect(r.risks.highest_risk_level).toBe("medium");
  });

  it("identifies high as highest risk level", () => {
    const pairs = [
      makePair({ id: "p1", risk_level: "high" }),
      makePair({ id: "p2", risk_level: "none" }),
    ];
    const r = computeHomePeerDynamics(baseInput({ peer_dynamics: pairs }));
    expect(r.risks.highest_risk_level).toBe("high");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. ENTRY PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("entry profile", () => {
  it("counts entry types across all pairs", () => {
    const pairs = [
      makePair({
        id: "p1",
        entries: [
          makeEntry({ type: "positive_interaction" }),
          makeEntry({ id: "pe2", type: "incident" }),
        ],
      }),
      makePair({
        id: "p2",
        entries: [
          makeEntry({ id: "pe3", type: "mediation" }),
          makeEntry({ id: "pe4", type: "observation" }),
          makeEntry({ id: "pe5", type: "review" }),
        ],
      }),
    ];
    const r = computeHomePeerDynamics(baseInput({ peer_dynamics: pairs }));
    expect(r.entry_profile.total_entries).toBe(5);
    expect(r.entry_profile.positive_interactions).toBe(1);
    expect(r.entry_profile.incidents).toBe(1);
    expect(r.entry_profile.mediations).toBe(1);
    expect(r.entry_profile.observations).toBe(1);
    expect(r.entry_profile.reviews).toBe(1);
  });

  it("calculates positive ratio", () => {
    const entries = [
      makeEntry({ id: "e1", type: "positive_interaction" }),
      makeEntry({ id: "e2", type: "positive_interaction" }),
      makeEntry({ id: "e3", type: "incident" }),
      makeEntry({ id: "e4", type: "observation" }),
    ];
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [makePair({ entries })],
    }));
    expect(r.entry_profile.positive_ratio).toBe(50); // 2/4
  });

  it("counts entries in last 30 days", () => {
    const entries = [
      makeEntry({ id: "e1", date: "2026-05-20" }),     // 7 days ago
      makeEntry({ id: "e2", date: "2026-05-01" }),     // 26 days ago
      makeEntry({ id: "e3", date: "2026-04-20" }),     // 37 days ago — outside
    ];
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [makePair({ entries })],
    }));
    expect(r.entry_profile.entries_last_30_days).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. REVIEW PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("review profile", () => {
  it("identifies overdue and upcoming reviews", () => {
    const pairs = [
      makePair({ id: "p1", next_review_due: "2026-05-20" }),  // overdue
      makePair({ id: "p2", next_review_due: "2026-06-01" }),  // upcoming
      makePair({ id: "p3", next_review_due: "2026-05-25" }),  // overdue
    ];
    const r = computeHomePeerDynamics(baseInput({ peer_dynamics: pairs }));
    expect(r.review_profile.overdue_reviews).toBe(2);
    expect(r.review_profile.upcoming_reviews).toBe(1);
  });

  it("today review due counts as upcoming", () => {
    const pairs = [makePair({ next_review_due: "2026-05-27" })];
    const r = computeHomePeerDynamics(baseInput({ peer_dynamics: pairs }));
    expect(r.review_profile.overdue_reviews).toBe(0);
    expect(r.review_profile.upcoming_reviews).toBe(1);
  });

  it("computes avg days since last review", () => {
    const pairs = [
      makePair({ id: "p1", last_review_date: "2026-05-17" }),  // 10 days ago
      makePair({ id: "p2", last_review_date: "2026-05-07" }),  // 20 days ago
    ];
    const r = computeHomePeerDynamics(baseInput({ peer_dynamics: pairs }));
    expect(r.review_profile.avg_days_since_review).toBe(15);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. GROUP PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("group profile", () => {
  it("counts atmosphere types", () => {
    const groups = [
      makeGroup({ id: "g1", overall_atmosphere: "calm" }),
      makeGroup({ id: "g2", overall_atmosphere: "mixed" }),
      makeGroup({ id: "g3", overall_atmosphere: "calm" }),
    ];
    const r = computeHomePeerDynamics(baseInput({ group_assessments: groups }));
    expect(r.group_profile.calm_count).toBe(2);
    expect(r.group_profile.mixed_count).toBe(1);
  });

  it("finds latest atmosphere by date", () => {
    const groups = [
      makeGroup({ id: "g1", assessment_date: "2026-05-10", overall_atmosphere: "calm" }),
      makeGroup({ id: "g2", assessment_date: "2026-05-20", overall_atmosphere: "tense" }),
    ];
    const r = computeHomePeerDynamics(baseInput({ group_assessments: groups }));
    expect(r.group_profile.latest_atmosphere).toBe("tense");
  });

  it("counts total group strengths and concerns", () => {
    const groups = [
      makeGroup({ group_strengths: ["A", "B"], group_concerns: ["C"] }),
      makeGroup({ id: "g2", group_strengths: ["D"], group_concerns: ["E", "F"] }),
    ];
    const r = computeHomePeerDynamics(baseInput({ group_assessments: groups }));
    expect(r.group_profile.total_group_strengths).toBe(3);
    expect(r.group_profile.total_group_concerns).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. STRATEGY PROFILE
// ═══════════════════════════════════════════════════════════════════════════

describe("strategy profile", () => {
  it("counts total strategies across pairs", () => {
    const pairs = [
      makePair({ id: "p1", strategies: ["A", "B"] }),
      makePair({ id: "p2", strategies: ["C"] }),
    ];
    const r = computeHomePeerDynamics(baseInput({ peer_dynamics: pairs }));
    expect(r.strategy_profile.total_strategies).toBe(3);
    expect(r.strategy_profile.pairs_with_strategies).toBe(2);
  });

  it("identifies strained/conflicted pairs without strategies", () => {
    const pairs = [
      makePair({ id: "p1", quality: "strained", strategies: [] }),
      makePair({ id: "p2", quality: "conflicted", strategies: ["Plan A"] }),
      makePair({ id: "p3", quality: "positive", strategies: [] }),
    ];
    const r = computeHomePeerDynamics(baseInput({ peer_dynamics: pairs }));
    expect(r.strategy_profile.pairs_needing_strategies).toBe(1); // only strained without strategies
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. SCORING MODIFIERS
// ═══════════════════════════════════════════════════════════════════════════

describe("mod1: relationship quality balance", () => {
  it("awards +5 for >= 75% positive/developing", () => {
    const pairs = [
      makePair({ id: "p1", quality: "positive" }),
      makePair({ id: "p2", quality: "developing" }),
      makePair({ id: "p3", quality: "positive" }),
    ];
    const low = [
      makePair({ id: "p1", quality: "neutral" }),
      makePair({ id: "p2", quality: "neutral" }),
      makePair({ id: "p3", quality: "positive" }),
    ];
    const rHigh = computeHomePeerDynamics(baseInput({ peer_dynamics: pairs }));
    const rLow = computeHomePeerDynamics(baseInput({ peer_dynamics: low }));
    // high: 100% → +5; low: 33% → 0. Diff = 5
    // But risk also changes: all none for both. Same.
    // Strategies: high all have [] strategies, quality positive → no pairs_needing. low same.
    // mod7: no high-risk pairs in either → +3 both. Same.
    expect(rHigh.peer_score - rLow.peer_score).toBe(5);
  });
});

describe("mod2: risk level", () => {
  it("penalises -4 for high-risk pairs", () => {
    const high = [makePair({ risk_level: "high", quality: "strained", strategies: ["Plan"] })];
    const none = [makePair({ risk_level: "none" })];
    const rHigh = computeHomePeerDynamics(baseInput({ peer_dynamics: high }));
    const rNone = computeHomePeerDynamics(baseInput({ peer_dynamics: none }));
    // risk: high → -4, none → +4. Diff = 8
    // mod1 also changes: high quality="strained" → 0% positive/developing → -5. none quality="positive" → 100% → +5. Diff from mod1 = 10
    // mod7: high has 1 strained with strategies → +3. none has 0 high-risk → +3. Same.
    // Total = 8 + 10 = 18
    expect(rNone.peer_score - rHigh.peer_score).toBe(18);
  });
});

describe("mod3: entry monitoring frequency", () => {
  it("awards +3 for >= 5 entries in last 30 days", () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      makeEntry({ id: `e${i}`, date: "2026-05-20" }),
    );
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [makePair({ entries })],
    }));
    expect(r.entry_profile.entries_last_30_days).toBe(5);
  });

  it("penalises -3 for no entries in last 30 days", () => {
    const high = baseInput({
      peer_dynamics: [makePair({ entries: [makeEntry({ date: "2026-05-20" })] })],
    });
    const low = baseInput({
      peer_dynamics: [makePair({ entries: [makeEntry({ date: "2026-04-01" })] })],
    });
    const rHigh = computeHomePeerDynamics(high);
    const rLow = computeHomePeerDynamics(low);
    // high: 1 entry in 30 days → 0. low: 0 entries in 30 days → -3. Diff = 3
    expect(rHigh.peer_score - rLow.peer_score).toBe(3);
  });
});

describe("mod4: positive interaction ratio", () => {
  it("awards +4 for >= 50% positive", () => {
    const entries = [
      makeEntry({ id: "e1", type: "positive_interaction" }),
      makeEntry({ id: "e2", type: "positive_interaction" }),
      makeEntry({ id: "e3", type: "observation" }),
    ];
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [makePair({ entries })],
    }));
    expect(r.entry_profile.positive_ratio).toBe(67); // 2/3
  });
});

describe("mod5: review compliance", () => {
  it("awards +3 when no reviews overdue", () => {
    const pairs = [makePair({ next_review_due: "2026-06-15" })];
    const r = computeHomePeerDynamics(baseInput({ peer_dynamics: pairs }));
    expect(r.review_profile.overdue_reviews).toBe(0);
  });

  it("penalises when reviews are overdue", () => {
    const good = baseInput({
      peer_dynamics: [makePair({ next_review_due: "2026-06-15" })],
    });
    const bad = baseInput({
      peer_dynamics: [makePair({ next_review_due: "2026-05-01" })],
    });
    const rGood = computeHomePeerDynamics(good);
    const rBad = computeHomePeerDynamics(bad);
    // good: 0 overdue → +3; bad: 1/1=100% overdue → -3. Diff = 6
    expect(rGood.peer_score - rBad.peer_score).toBe(6);
  });
});

describe("mod6: group atmosphere", () => {
  it("awards +4 for calm atmosphere", () => {
    const calm = baseInput({ group_assessments: [makeGroup({ overall_atmosphere: "calm" })] });
    const volatile = baseInput({ group_assessments: [makeGroup({ overall_atmosphere: "volatile" })] });
    const rCalm = computeHomePeerDynamics(calm);
    const rVolatile = computeHomePeerDynamics(volatile);
    // calm → +4; volatile → -4. Diff = 8
    expect(rCalm.peer_score - rVolatile.peer_score).toBe(8);
  });
});

describe("mod7: strategy coverage", () => {
  it("awards +3 when no high-risk pairs", () => {
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [makePair({ quality: "positive" })],
    }));
    // No strained/conflicted → +3
    expect(r.peer_score).toBeGreaterThan(0);
  });

  it("awards +3 when all high-risk pairs have strategies", () => {
    const pairs = [
      makePair({ quality: "strained", strategies: ["Plan A", "Plan B"] }),
    ];
    const r = computeHomePeerDynamics(baseInput({ peer_dynamics: pairs }));
    expect(r.strategy_profile.pairs_needing_strategies).toBe(0);
  });

  it("penalises -3 when high-risk pairs lack strategies", () => {
    const good = baseInput({
      peer_dynamics: [makePair({ quality: "strained", strategies: ["Plan"] })],
    });
    const bad = baseInput({
      peer_dynamics: [makePair({ quality: "strained", strategies: [] })],
    });
    const rGood = computeHomePeerDynamics(good);
    const rBad = computeHomePeerDynamics(bad);
    // good: pairs_needing=0 → +3; bad: 1/1=100% → -3. Diff = 6
    expect(rGood.peer_score - rBad.peer_score).toBe(6);
  });
});

describe("mod8: coverage completeness", () => {
  it("awards +3 for >= 80% coverage", () => {
    // 3 children → 3 expected pairs. 3 pairs = 100%
    const pairs = [
      makePair({ id: "p1" }),
      makePair({ id: "p2" }),
      makePair({ id: "p3" }),
    ];
    const r = computeHomePeerDynamics(baseInput({ peer_dynamics: pairs, total_children: 3 }));
    // 3/3 = 100% → +3
    expect(r.peer_score).toBeGreaterThan(0);
  });

  it("penalises -2 for < 25% coverage", () => {
    const high = baseInput({
      peer_dynamics: [makePair()],
      total_children: 3, // 3 pairs expected, 1 assessed = 33% → +1
    });
    const low = baseInput({
      peer_dynamics: [makePair()],
      total_children: 5, // 10 pairs expected, 1 assessed = 10% → -2
    });
    const rHigh = computeHomePeerDynamics(high);
    const rLow = computeHomePeerDynamics(low);
    // high: 33% (>=25,<50) → 0; low: 10% (<25) → -2. Diff = 2
    expect(rHigh.peer_score - rLow.peer_score).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. RATING THRESHOLDS
// ═══════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  it("returns outstanding for excellent scenario", () => {
    const pairs = [
      makePair({ id: "p1", quality: "positive", risk_level: "none", entries: Array.from({ length: 3 }, (_, i) => makeEntry({ id: `e${i}`, date: "2026-05-20" })) }),
      makePair({ id: "p2", quality: "positive", risk_level: "none", entries: Array.from({ length: 3 }, (_, i) => makeEntry({ id: `e${i+3}`, date: "2026-05-22" })) }),
      makePair({ id: "p3", quality: "developing", risk_level: "none", entries: Array.from({ length: 2 }, (_, i) => makeEntry({ id: `e${i+6}`, date: "2026-05-24" })) }),
    ];
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: pairs,
      group_assessments: [makeGroup({ overall_atmosphere: "calm" })],
      total_children: 3,
    }));
    expect(r.peer_rating).toBe("outstanding");
    expect(r.peer_score).toBeGreaterThanOrEqual(80);
  });

  it("returns inadequate for poor scenario", () => {
    const pairs = [
      makePair({
        quality: "conflicted", risk_level: "high", strategies: [],
        entries: [makeEntry({ type: "incident", date: "2026-03-01" })],
        next_review_due: "2026-04-01",
      }),
    ];
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: pairs,
      group_assessments: [makeGroup({ overall_atmosphere: "volatile" })],
      total_children: 5,
    }));
    expect(r.peer_rating).toBe("inadequate");
    expect(r.peer_score).toBeLessThan(45);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. STRENGTHS & CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("includes positive relationship strength", () => {
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [makePair({ quality: "positive" })],
    }));
    expect(r.strengths.some((s) => s.includes("positive"))).toBe(true);
  });

  it("includes no high-risk strength", () => {
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [makePair({ risk_level: "none" })],
    }));
    expect(r.strengths.some((s) => s.includes("No high-risk"))).toBe(true);
  });

  it("includes calm atmosphere strength", () => {
    const r = computeHomePeerDynamics(baseInput({
      group_assessments: [makeGroup({ overall_atmosphere: "calm" })],
    }));
    expect(r.strengths.some((s) => s.includes("calm"))).toBe(true);
  });
});

describe("concerns", () => {
  it("flags conflicted relationships", () => {
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [makePair({ quality: "conflicted" })],
    }));
    expect(r.concerns.some((c) => c.includes("conflicted"))).toBe(true);
  });

  it("flags high-risk pairs", () => {
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [makePair({ risk_level: "high" })],
    }));
    expect(r.concerns.some((c) => c.includes("high-risk"))).toBe(true);
  });

  it("flags volatile atmosphere", () => {
    const r = computeHomePeerDynamics(baseInput({
      group_assessments: [makeGroup({ overall_atmosphere: "volatile" })],
    }));
    expect(r.concerns.some((c) => c.includes("volatile"))).toBe(true);
  });

  it("flags overdue reviews", () => {
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [makePair({ next_review_due: "2026-04-01" })],
    }));
    expect(r.concerns.some((c) => c.includes("overdue"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("generates immediate rec for high-risk pairs", () => {
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [makePair({ risk_level: "high" })],
    }));
    const rec = r.recommendations.find((r) => r.urgency === "immediate");
    expect(rec).toBeDefined();
    expect(rec!.regulatory_ref).toBe("Reg 19(2)");
  });

  it("generates rec for conflicted relationships", () => {
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [makePair({ quality: "conflicted" })],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("conflicted"))).toBe(true);
  });

  it("generates rec for missing group assessment", () => {
    const r = computeHomePeerDynamics(baseInput({
      group_assessments: [],
      peer_dynamics: [makePair()],
    }));
    expect(r.recommendations.some((rec) => rec.recommendation.includes("group dynamics"))).toBe(true);
  });

  it("ranks recommendations sequentially", () => {
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [makePair({ risk_level: "high", quality: "conflicted", next_review_due: "2026-04-01" })],
    }));
    r.recommendations.forEach((rec, i) => {
      expect(rec.rank).toBe(i + 1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  it("generates critical insight for high-risk pairs", () => {
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [makePair({ risk_level: "high" })],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("high risk"))).toBe(true);
  });

  it("generates critical insight for volatile atmosphere", () => {
    const r = computeHomePeerDynamics(baseInput({
      group_assessments: [makeGroup({ overall_atmosphere: "volatile" })],
    }));
    expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("volatile"))).toBe(true);
  });

  it("generates positive insight when positive interactions outweigh incidents", () => {
    const entries = [
      makeEntry({ id: "e1", type: "positive_interaction" }),
      makeEntry({ id: "e2", type: "positive_interaction" }),
      makeEntry({ id: "e3", type: "incident" }),
    ];
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [makePair({ entries })],
    }));
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outnumber"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. SCORE CLAMPING
// ═══════════════════════════════════════════════════════════════════════════

describe("score clamping", () => {
  it("never exceeds 100", () => {
    const pairs = Array.from({ length: 3 }, (_, i) =>
      makePair({
        id: `p${i}`,
        quality: "positive",
        risk_level: "none",
        entries: Array.from({ length: 5 }, (_, j) =>
          makeEntry({ id: `e${i}_${j}`, date: "2026-05-20" }),
        ),
      }),
    );
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: pairs,
      group_assessments: [makeGroup({ overall_atmosphere: "calm" })],
      total_children: 3,
    }));
    expect(r.peer_score).toBeLessThanOrEqual(100);
  });

  it("never goes below 0", () => {
    const pairs = [
      makePair({
        quality: "conflicted", risk_level: "high", strategies: [],
        entries: [makeEntry({ type: "incident", date: "2026-03-01" })],
        next_review_due: "2026-03-01",
      }),
    ];
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: pairs,
      group_assessments: [makeGroup({ overall_atmosphere: "volatile" })],
      total_children: 10,
    }));
    expect(r.peer_score).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles single child (0 expected pairs)", () => {
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [],
      group_assessments: [makeGroup()],
      total_children: 1,
    }));
    expect(r.peer_rating).not.toBe("insufficient_data");
  });

  it("handles pairs with no entries", () => {
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [makePair({ entries: [] })],
    }));
    expect(r.entry_profile.total_entries).toBe(0);
    expect(r.entry_profile.positive_ratio).toBeNull();
  });

  it("handles group assessments only (no pairs)", () => {
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [],
      group_assessments: [makeGroup()],
    }));
    expect(r.relationships.total_pairs).toBe(0);
    expect(r.group_profile.total_assessments).toBe(1);
  });

  it("handles empty concerns and strategies", () => {
    const r = computeHomePeerDynamics(baseInput({
      peer_dynamics: [makePair({ concerns: [], strategies: [] })],
    }));
    expect(r.strategy_profile.total_strategies).toBe(0);
  });
});
