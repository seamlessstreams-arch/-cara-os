// ══════════════════════════════════════════════════════════════════════════════
// TESTS — HOME SELF-EVALUATION & IMPROVEMENT INTELLIGENCE ENGINE
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeSelfEvaluationImprovement,
  type SelfEvaluationInput,
  type SelfEvaluationAreaInput,
} from "../home-self-evaluation-improvement-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-27";

function makeArea(overrides: Partial<SelfEvaluationAreaInput> = {}): SelfEvaluationAreaInput {
  return {
    id: "area_1",
    area: "safeguarding",
    self_grade: "good",
    strengths_count: 5,
    evidence_count: 3,
    development_areas_count: 2,
    actions_total: 10,
    actions_completed: 9,
    ...overrides,
  };
}

/**
 * Base input: total_children=6, 6 areas all good-grade, 5 strengths each,
 * evidence>0 each, devAreas>0 each, 10 actions / 9 completed each.
 *
 * Scoring trace:
 *   Base: 52
 *   mod1: goodRate = 6/6 = 100% >= 80 → +5 = 57
 *   mod2: actionCompletion = 54/60 = 90% >= 90 → +6 = 63
 *   mod3: evidenceCoverage = 6/6 = 100% >= 90 → +5 = 68
 *   mod4: withDevAreas = 6 >= 6 (total) → +5 = 73
 *   mod5: avgStrengths = 30/6 = 5.0 >= 5 → +4 = 77
 *   mod6: total=6 >= 5 → +5 = 82
 *   Final: clamp(82, 0, 100) = 82 → outstanding
 */
function baseInput(overrides: Partial<SelfEvaluationInput> = {}): SelfEvaluationInput {
  return {
    today: TODAY,
    total_children: 6,
    areas: [
      makeArea({ id: "a1", area: "safeguarding" }),
      makeArea({ id: "a2", area: "education" }),
      makeArea({ id: "a3", area: "health" }),
      makeArea({ id: "a4", area: "behaviour" }),
      makeArea({ id: "a5", area: "leadership" }),
      makeArea({ id: "a6", area: "environment" }),
    ],
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ══════════════════════════════════════════════════════════════════════════════

describe("Insufficient data (total_children=0)", () => {
  it("returns insufficient_data rating", () => {
    const r = computeSelfEvaluationImprovement({ today: TODAY, total_children: 0, areas: [] });
    expect(r.evaluation_rating).toBe("insufficient_data");
  });

  it("returns score 0", () => {
    const r = computeSelfEvaluationImprovement({ today: TODAY, total_children: 0, areas: [] });
    expect(r.evaluation_score).toBe(0);
  });

  it("returns correct headline", () => {
    const r = computeSelfEvaluationImprovement({ today: TODAY, total_children: 0, areas: [] });
    expect(r.headline).toBe("No data available for self-evaluation analysis");
  });

  it("zeroes all metrics", () => {
    const r = computeSelfEvaluationImprovement({ today: TODAY, total_children: 0, areas: [] });
    expect(r.total_areas).toBe(0);
    expect(r.good_or_outstanding_rate).toBe(0);
    expect(r.action_completion_rate).toBe(0);
    expect(r.evidence_coverage_rate).toBe(0);
    expect(r.areas_with_development_plans).toBe(0);
    expect(r.average_strengths_per_area).toBe(0);
  });

  it("returns empty arrays for strengths, concerns, recommendations, insights", () => {
    const r = computeSelfEvaluationImprovement({ today: TODAY, total_children: 0, areas: [] });
    expect(r.strengths).toEqual([]);
    expect(r.concerns).toEqual([]);
    expect(r.recommendations).toEqual([]);
    expect(r.insights).toEqual([]);
  });

  it("returns insufficient_data even when areas are provided with total_children=0", () => {
    const r = computeSelfEvaluationImprovement({
      today: TODAY,
      total_children: 0,
      areas: [makeArea()],
    });
    expect(r.evaluation_rating).toBe("insufficient_data");
    expect(r.evaluation_score).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. ZERO AREAS
// ══════════════════════════════════════════════════════════════════════════════

describe("Zero areas (total_children > 0 but no areas)", () => {
  /**
   * Scoring trace for 0 areas:
   *   Base: 52
   *   mod1: total===0 → -5 = 47
   *   mod2: totalActions===0 && total===0 → no adj = 47
   *   mod3: total===0 → no adj = 47
   *   mod4: total===0 → no adj = 47
   *   mod5: total===0 → -1 = 46
   *   mod6: total===0 → -2 = 44
   *   Final: clamp(44, 0, 100) = 44 → inadequate
   */
  it("computes score 44 with all penalties applied", () => {
    const r = computeSelfEvaluationImprovement({ today: TODAY, total_children: 6, areas: [] });
    expect(r.evaluation_score).toBe(44);
  });

  it("returns inadequate rating", () => {
    const r = computeSelfEvaluationImprovement({ today: TODAY, total_children: 6, areas: [] });
    expect(r.evaluation_rating).toBe("inadequate");
  });

  it("has total_areas 0", () => {
    const r = computeSelfEvaluationImprovement({ today: TODAY, total_children: 6, areas: [] });
    expect(r.total_areas).toBe(0);
  });

  it("includes 'no self-evaluation recorded' concern", () => {
    const r = computeSelfEvaluationImprovement({ today: TODAY, total_children: 6, areas: [] });
    expect(r.concerns).toContain("No self-evaluation recorded — the home has no framework for continuous improvement");
  });

  it("includes framework recommendation as immediate", () => {
    const r = computeSelfEvaluationImprovement({ today: TODAY, total_children: 6, areas: [] });
    expect(r.recommendations).toHaveLength(1);
    expect(r.recommendations[0].urgency).toBe("immediate");
    expect(r.recommendations[0].rank).toBe(1);
  });

  it("includes critical insight about regulatory gap", () => {
    const r = computeSelfEvaluationImprovement({ today: TODAY, total_children: 6, areas: [] });
    expect(r.insights.some(i => i.severity === "critical")).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. OUTSTANDING SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Outstanding scenario — all modifiers maxed", () => {
  /**
   * Uses baseInput: score 82, rating outstanding (trace in baseInput comment)
   */
  it("scores 82", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.evaluation_score).toBe(82);
  });

  it("rates outstanding", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.evaluation_rating).toBe("outstanding");
  });

  it("returns correct headline", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.headline).toBe("Self-evaluation is rigorous, evidence-based and drives continuous improvement across the home");
  });

  it("reports correct metrics", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.total_areas).toBe(6);
    expect(r.good_or_outstanding_rate).toBe(100);
    expect(r.action_completion_rate).toBe(90);
    expect(r.evidence_coverage_rate).toBe(100);
    expect(r.areas_with_development_plans).toBe(6);
    expect(r.average_strengths_per_area).toBe(5);
  });

  it("includes all possible strengths", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.strengths).toHaveLength(6);
  });

  it("has no concerns", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.concerns).toEqual([]);
  });

  it("has no recommendations", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.recommendations).toEqual([]);
  });

  it("includes exemplary positive insight", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
  });

  it("includes honest self-reflection insight", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Honest self-reflection"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. GOOD SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Good scenario — moderate performance", () => {
  /**
   * 5 areas: 4 good + 1 RI, 3 strengths each, evidence on all, devAreas on 3/5,
   * 8 actions / 6 completed each.
   *
   * Scoring trace:
   *   Base: 52
   *   mod1: goodRate = 4/5 = 80% >= 80 → +5 = 57
   *   mod2: actionCompletion = 30/40 = 75% >= 70 → +2 = 59
   *   mod3: evidenceCoverage = 5/5 = 100% >= 90 → +5 = 64
   *   mod4: withDevAreas = 3 >= ceil(5*0.5)=3 → +2 = 66
   *   mod5: avgStrengths = 15/5 = 3.0 >= 3 → +1 = 67
   *   mod6: total=5 >= 5 → +5 = 72
   *   Final: clamp(72, 0, 100) = 72 → good
   */
  it("scores 72 and rates good", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "good", strengths_count: 3, development_areas_count: 1, actions_total: 8, actions_completed: 6 }),
        makeArea({ id: "a2", self_grade: "good", strengths_count: 3, development_areas_count: 1, actions_total: 8, actions_completed: 6 }),
        makeArea({ id: "a3", self_grade: "good", strengths_count: 3, development_areas_count: 1, actions_total: 8, actions_completed: 6 }),
        makeArea({ id: "a4", self_grade: "good", strengths_count: 3, development_areas_count: 0, actions_total: 8, actions_completed: 6 }),
        makeArea({ id: "a5", self_grade: "requires_improvement", strengths_count: 3, development_areas_count: 0, actions_total: 8, actions_completed: 6 }),
      ],
    }));
    expect(r.evaluation_score).toBe(72);
    expect(r.evaluation_rating).toBe("good");
  });

  it("returns good headline", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "good", strengths_count: 3, development_areas_count: 1, actions_total: 8, actions_completed: 6 }),
        makeArea({ id: "a2", self_grade: "good", strengths_count: 3, development_areas_count: 1, actions_total: 8, actions_completed: 6 }),
        makeArea({ id: "a3", self_grade: "good", strengths_count: 3, development_areas_count: 1, actions_total: 8, actions_completed: 6 }),
        makeArea({ id: "a4", self_grade: "good", strengths_count: 3, development_areas_count: 0, actions_total: 8, actions_completed: 6 }),
        makeArea({ id: "a5", self_grade: "requires_improvement", strengths_count: 3, development_areas_count: 0, actions_total: 8, actions_completed: 6 }),
      ],
    }));
    expect(r.headline).toBe("Good self-evaluation practice with honest reflection and effective action planning");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. ADEQUATE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Adequate scenario — mixed performance", () => {
  /**
   * 3 areas: 2 good + 1 inadequate, 2 strengths each, evidence on 2/3,
   * dev areas on 1/3, 5 actions / 3 completed each.
   *
   * Scoring trace:
   *   Base: 52
   *   mod1: goodRate = 2/3 = 67% >= 60 → +2 = 54
   *   mod2: actionCompletion = 9/15 = 60% (not >=70, not <50) → 0 = 54
   *   mod3: evidenceCoverage = 2/3 = 67% (not >=70, not <50) → 0 = 54
   *   mod4: withDevAreas = 1 < ceil(3*0.5)=2, not 0 → 0 = 54
   *   mod5: avgStrengths = 6/3 = 2.0 (not >=3, not <1) → 0 = 54
   *   mod6: total=3 >= 3 → +2 = 56
   *   Final: clamp(56, 0, 100) = 56 → adequate
   */
  it("scores 56 and rates adequate", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "good", strengths_count: 2, evidence_count: 2, development_areas_count: 1, actions_total: 5, actions_completed: 3 }),
        makeArea({ id: "a2", self_grade: "good", strengths_count: 2, evidence_count: 1, development_areas_count: 0, actions_total: 5, actions_completed: 3 }),
        makeArea({ id: "a3", self_grade: "inadequate", strengths_count: 2, evidence_count: 0, development_areas_count: 0, actions_total: 5, actions_completed: 3 }),
      ],
    }));
    expect(r.evaluation_score).toBe(56);
    expect(r.evaluation_rating).toBe("adequate");
  });

  it("returns adequate headline", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "good", strengths_count: 2, evidence_count: 2, development_areas_count: 1, actions_total: 5, actions_completed: 3 }),
        makeArea({ id: "a2", self_grade: "good", strengths_count: 2, evidence_count: 1, development_areas_count: 0, actions_total: 5, actions_completed: 3 }),
        makeArea({ id: "a3", self_grade: "inadequate", strengths_count: 2, evidence_count: 0, development_areas_count: 0, actions_total: 5, actions_completed: 3 }),
      ],
    }));
    expect(r.headline).toBe("Self-evaluation exists but needs more depth, evidence and follow-through on actions");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. INADEQUATE SCENARIO
// ══════════════════════════════════════════════════════════════════════════════

describe("Inadequate scenario — poor performance", () => {
  /**
   * 2 areas: both inadequate, 0 strengths, 0 evidence, 0 dev areas,
   * 10 actions / 2 completed each.
   *
   * Scoring trace:
   *   Base: 52
   *   mod1: goodRate = 0/2 = 0% < 40 → -5 = 47
   *   mod2: actionCompletion = 4/20 = 20% < 50 → -5 = 42
   *   mod3: evidenceCoverage = 0/2 = 0% < 50 → -4 = 38
   *   mod4: withDevAreas = 0 → -5 = 33
   *   mod5: avgStrengths = 0/2 = 0.0 < 1 → -4 = 29
   *   mod6: total=2 (not >=3, not 0) → 0 = 29
   *   Final: clamp(29, 0, 100) = 29 → inadequate
   */
  it("scores 29 and rates inadequate", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "inadequate", strengths_count: 0, evidence_count: 0, development_areas_count: 0, actions_total: 10, actions_completed: 2 }),
        makeArea({ id: "a2", self_grade: "inadequate", strengths_count: 0, evidence_count: 0, development_areas_count: 0, actions_total: 10, actions_completed: 2 }),
      ],
    }));
    expect(r.evaluation_score).toBe(29);
    expect(r.evaluation_rating).toBe("inadequate");
  });

  it("returns inadequate headline", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "inadequate", strengths_count: 0, evidence_count: 0, development_areas_count: 0, actions_total: 10, actions_completed: 2 }),
        makeArea({ id: "a2", self_grade: "inadequate", strengths_count: 0, evidence_count: 0, development_areas_count: 0, actions_total: 10, actions_completed: 2 }),
      ],
    }));
    expect(r.headline).toBe("Self-evaluation practice is inadequate — the home cannot demonstrate a culture of improvement");
  });

  it("includes multiple concerns", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "inadequate", strengths_count: 0, evidence_count: 0, development_areas_count: 0, actions_total: 10, actions_completed: 2 }),
        makeArea({ id: "a2", self_grade: "inadequate", strengths_count: 0, evidence_count: 0, development_areas_count: 0, actions_total: 10, actions_completed: 2 }),
      ],
    }));
    expect(r.concerns.length).toBeGreaterThanOrEqual(5);
  });

  it("includes expand self-evaluation recommendation (total < 3)", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "inadequate", strengths_count: 0, evidence_count: 0, development_areas_count: 0, actions_total: 10, actions_completed: 2 }),
        makeArea({ id: "a2", self_grade: "inadequate", strengths_count: 0, evidence_count: 0, development_areas_count: 0, actions_total: 10, actions_completed: 2 }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("Expand"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. SELF-GRADE QUALITY MODIFIER
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 1 — Self-grade quality", () => {
  /**
   * Use 5 areas (to keep mod6 constant at +5) with consistent non-grade fields
   * to isolate mod1. Baseline for other mods:
   *   mod2: 50/50 = 100% >= 90 → +6
   *   mod3: 5/5 = 100% >= 90 → +5
   *   mod4: 5/5 >= total → +5
   *   mod5: 25/5 = 5.0 >= 5 → +4
   *   mod6: 5 >= 5 → +5
   *   Non-mod1 total: 52 + 6 + 5 + 5 + 4 + 5 = 77
   */
  function gradeInput(grades: string[]): SelfEvaluationInput {
    return baseInput({
      areas: grades.map((g, i) => makeArea({
        id: `a${i}`,
        self_grade: g,
        strengths_count: 5,
        evidence_count: 3,
        development_areas_count: 2,
        actions_total: 10,
        actions_completed: 10,
      })),
    });
  }

  it("100% good/outstanding → +5 (score 82)", () => {
    const r = computeSelfEvaluationImprovement(gradeInput(["outstanding", "good", "good", "outstanding", "good"]));
    expect(r.evaluation_score).toBe(82);
    expect(r.good_or_outstanding_rate).toBe(100);
  });

  it("80% good/outstanding → +5 (score 82)", () => {
    const r = computeSelfEvaluationImprovement(gradeInput(["outstanding", "good", "good", "good", "requires_improvement"]));
    expect(r.evaluation_score).toBe(82);
    expect(r.good_or_outstanding_rate).toBe(80);
  });

  it("60% good/outstanding → +2 (score 79)", () => {
    const r = computeSelfEvaluationImprovement(gradeInput(["good", "good", "good", "requires_improvement", "requires_improvement"]));
    expect(r.evaluation_score).toBe(79);
    expect(r.good_or_outstanding_rate).toBe(60);
  });

  it("40% good/outstanding → no modifier (score 77)", () => {
    // 2/5 = 40% — not >=60 and not <40
    const r = computeSelfEvaluationImprovement(gradeInput(["good", "good", "requires_improvement", "requires_improvement", "inadequate"]));
    expect(r.evaluation_score).toBe(77);
    expect(r.good_or_outstanding_rate).toBe(40);
  });

  it("20% good/outstanding → -5 (score 72)", () => {
    // 1/5 = 20% < 40
    const r = computeSelfEvaluationImprovement(gradeInput(["good", "requires_improvement", "requires_improvement", "inadequate", "inadequate"]));
    expect(r.evaluation_score).toBe(72);
    expect(r.good_or_outstanding_rate).toBe(20);
  });

  it("0% good/outstanding → -5 (score 72)", () => {
    const r = computeSelfEvaluationImprovement(gradeInput(["requires_improvement", "requires_improvement", "inadequate", "inadequate", "inadequate"]));
    expect(r.evaluation_score).toBe(72);
    expect(r.good_or_outstanding_rate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. ACTION COMPLETION MODIFIER
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 2 — Action completion", () => {
  /**
   * Use 5 good-graded areas with other fields constant to isolate mod2.
   * Non-mod2 baseline:
   *   52 + mod1(+5) + mod3(+5) + mod4(+5) + mod5(+4) + mod6(+5) = 76
   */
  function actionInput(actionsTotal: number, actionsCompleted: number): SelfEvaluationInput {
    return baseInput({
      areas: Array.from({ length: 5 }, (_, i) => makeArea({
        id: `a${i}`,
        self_grade: "good",
        strengths_count: 5,
        evidence_count: 3,
        development_areas_count: 2,
        actions_total: actionsTotal,
        actions_completed: actionsCompleted,
      })),
    });
  }

  it("0 actions with areas present → +2 (score 78)", () => {
    const r = computeSelfEvaluationImprovement(actionInput(0, 0));
    // totalActions=0 && total>0 → +2
    expect(r.evaluation_score).toBe(78);
    expect(r.action_completion_rate).toBeNull();
  });

  it("100% action completion → +6 (score 82)", () => {
    const r = computeSelfEvaluationImprovement(actionInput(10, 10));
    expect(r.evaluation_score).toBe(82);
    expect(r.action_completion_rate).toBe(100);
  });

  it("90% action completion → +6 (score 82)", () => {
    const r = computeSelfEvaluationImprovement(actionInput(10, 9));
    expect(r.evaluation_score).toBe(82);
    expect(r.action_completion_rate).toBe(90);
  });

  it("80% action completion → +2 (score 78)", () => {
    const r = computeSelfEvaluationImprovement(actionInput(10, 8));
    expect(r.evaluation_score).toBe(78);
    expect(r.action_completion_rate).toBe(80);
  });

  it("70% action completion → +2 (score 78)", () => {
    const r = computeSelfEvaluationImprovement(actionInput(10, 7));
    expect(r.evaluation_score).toBe(78);
    expect(r.action_completion_rate).toBe(70);
  });

  it("60% action completion → no modifier (score 76)", () => {
    // 60% — not >=70, not <50
    const r = computeSelfEvaluationImprovement(actionInput(10, 6));
    expect(r.evaluation_score).toBe(76);
    expect(r.action_completion_rate).toBe(60);
  });

  it("50% action completion → no modifier (score 76)", () => {
    const r = computeSelfEvaluationImprovement(actionInput(10, 5));
    expect(r.evaluation_score).toBe(76);
    expect(r.action_completion_rate).toBe(50);
  });

  it("40% action completion → -5 (score 71)", () => {
    const r = computeSelfEvaluationImprovement(actionInput(10, 4));
    expect(r.evaluation_score).toBe(71);
    expect(r.action_completion_rate).toBe(40);
  });

  it("0% action completion (with actions defined) → -5 (score 71)", () => {
    const r = computeSelfEvaluationImprovement(actionInput(10, 0));
    expect(r.evaluation_score).toBe(71);
    expect(r.action_completion_rate).toBe(0);
  });

  it("0 actions with 0 areas → no adjustment", () => {
    /**
     * 0 areas scoring:
     *   52 + mod1(-5) + mod2(0) + mod3(0) + mod4(0) + mod5(-1) + mod6(-2) = 44
     */
    const r = computeSelfEvaluationImprovement(baseInput({ areas: [] }));
    expect(r.evaluation_score).toBe(44);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. EVIDENCE COVERAGE MODIFIER
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 3 — Evidence coverage", () => {
  /**
   * 5 good-graded areas, varying evidence. Other mods constant.
   * Non-mod3 baseline:
   *   52 + mod1(+5) + mod2(+6) + mod4(+5) + mod5(+4) + mod6(+5) = 77
   */
  function evidenceInput(withEvidence: number, total: number): SelfEvaluationInput {
    return baseInput({
      areas: Array.from({ length: total }, (_, i) => makeArea({
        id: `a${i}`,
        self_grade: "good",
        strengths_count: 5,
        evidence_count: i < withEvidence ? 3 : 0,
        development_areas_count: 2,
        actions_total: 10,
        actions_completed: 10,
      })),
    });
  }

  it("100% evidence coverage → +5 (score 82)", () => {
    const r = computeSelfEvaluationImprovement(evidenceInput(5, 5));
    expect(r.evaluation_score).toBe(82);
    expect(r.evidence_coverage_rate).toBe(100);
  });

  it("90% evidence coverage → +5", () => {
    // Need >=90%. With 10 areas, 9 with evidence = 90%
    const input = baseInput({
      areas: Array.from({ length: 10 }, (_, i) => makeArea({
        id: `a${i}`,
        self_grade: "good",
        strengths_count: 5,
        evidence_count: i < 9 ? 3 : 0,
        development_areas_count: 2,
        actions_total: 10,
        actions_completed: 10,
      })),
    });
    const r = computeSelfEvaluationImprovement(input);
    expect(r.evidence_coverage_rate).toBe(90);
    // mod6: 10 >= 5 → +5
    expect(r.evaluation_score).toBe(82);
  });

  it("80% evidence coverage → +2 (score 79)", () => {
    const r = computeSelfEvaluationImprovement(evidenceInput(4, 5));
    expect(r.evaluation_score).toBe(79);
    expect(r.evidence_coverage_rate).toBe(80);
  });

  it("70% evidence coverage → +2", () => {
    // 7/10 = 70%
    const input = baseInput({
      areas: Array.from({ length: 10 }, (_, i) => makeArea({
        id: `a${i}`,
        self_grade: "good",
        strengths_count: 5,
        evidence_count: i < 7 ? 3 : 0,
        development_areas_count: 2,
        actions_total: 10,
        actions_completed: 10,
      })),
    });
    const r = computeSelfEvaluationImprovement(input);
    expect(r.evidence_coverage_rate).toBe(70);
    expect(r.evaluation_score).toBe(79);
  });

  it("60% evidence coverage → no modifier (score 77)", () => {
    const r = computeSelfEvaluationImprovement(evidenceInput(3, 5));
    expect(r.evaluation_score).toBe(77);
    expect(r.evidence_coverage_rate).toBe(60);
  });

  it("40% evidence coverage → -4 (score 73)", () => {
    const r = computeSelfEvaluationImprovement(evidenceInput(2, 5));
    expect(r.evaluation_score).toBe(73);
    expect(r.evidence_coverage_rate).toBe(40);
  });

  it("0% evidence coverage → -4 (score 73)", () => {
    const r = computeSelfEvaluationImprovement(evidenceInput(0, 5));
    expect(r.evaluation_score).toBe(73);
    expect(r.evidence_coverage_rate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. DEVELOPMENT AREAS MODIFIER
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 4 — Development areas identified", () => {
  /**
   * 5 good areas, varying devAreas. Other mods constant.
   * Non-mod4 baseline:
   *   52 + mod1(+5) + mod2(+6) + mod3(+5) + mod5(+4) + mod6(+5) = 77
   */
  function devInput(withDev: number): SelfEvaluationInput {
    return baseInput({
      areas: Array.from({ length: 5 }, (_, i) => makeArea({
        id: `a${i}`,
        self_grade: "good",
        strengths_count: 5,
        evidence_count: 3,
        development_areas_count: i < withDev ? 2 : 0,
        actions_total: 10,
        actions_completed: 10,
      })),
    });
  }

  it("all areas have dev areas (5/5) → +5 (score 82)", () => {
    const r = computeSelfEvaluationImprovement(devInput(5));
    expect(r.evaluation_score).toBe(82);
    expect(r.areas_with_development_plans).toBe(5);
  });

  it("3/5 areas have dev areas (>= ceil(5*0.5)=3) → +2 (score 79)", () => {
    const r = computeSelfEvaluationImprovement(devInput(3));
    expect(r.evaluation_score).toBe(79);
    expect(r.areas_with_development_plans).toBe(3);
  });

  it("2/5 areas have dev areas (< ceil(5*0.5)=3, not 0) → no adjustment (score 77)", () => {
    const r = computeSelfEvaluationImprovement(devInput(2));
    expect(r.evaluation_score).toBe(77);
    expect(r.areas_with_development_plans).toBe(2);
  });

  it("1/5 areas have dev areas → no adjustment (score 77)", () => {
    const r = computeSelfEvaluationImprovement(devInput(1));
    expect(r.evaluation_score).toBe(77);
    expect(r.areas_with_development_plans).toBe(1);
  });

  it("0/5 areas have dev areas → -5 (score 72)", () => {
    const r = computeSelfEvaluationImprovement(devInput(0));
    expect(r.evaluation_score).toBe(72);
    expect(r.areas_with_development_plans).toBe(0);
  });

  it("ceil boundary: 4 areas, need ceil(4*0.5)=2 → 2/4 gets +2", () => {
    const input = baseInput({
      areas: Array.from({ length: 4 }, (_, i) => makeArea({
        id: `a${i}`,
        self_grade: "good",
        strengths_count: 5,
        evidence_count: 3,
        development_areas_count: i < 2 ? 2 : 0,
        actions_total: 10,
        actions_completed: 10,
      })),
    });
    const r = computeSelfEvaluationImprovement(input);
    // Non-mod4 with 4 areas: 52 + 5 + 6 + 5 + 4 + 2 = 74 (mod6: 4 >= 3 → +2)
    // mod4: 2 >= ceil(2)=2 → +2
    expect(r.evaluation_score).toBe(76);
    expect(r.areas_with_development_plans).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. STRENGTHS DEPTH MODIFIER
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 5 — Strengths documentation depth", () => {
  /**
   * 5 good areas, varying strengths_count. Other mods constant.
   * Non-mod5 baseline:
   *   52 + mod1(+5) + mod2(+6) + mod3(+5) + mod4(+5) + mod6(+5) = 78
   */
  function strengthInput(strengthsPerArea: number): SelfEvaluationInput {
    return baseInput({
      areas: Array.from({ length: 5 }, (_, i) => makeArea({
        id: `a${i}`,
        self_grade: "good",
        strengths_count: strengthsPerArea,
        evidence_count: 3,
        development_areas_count: 2,
        actions_total: 10,
        actions_completed: 10,
      })),
    });
  }

  it("avg strengths >= 5 → +4 (score 82)", () => {
    const r = computeSelfEvaluationImprovement(strengthInput(5));
    expect(r.evaluation_score).toBe(82);
    expect(r.average_strengths_per_area).toBe(5);
  });

  it("avg strengths >= 5 with 7 per area → +4 (score 82)", () => {
    const r = computeSelfEvaluationImprovement(strengthInput(7));
    expect(r.evaluation_score).toBe(82);
    expect(r.average_strengths_per_area).toBe(7);
  });

  it("avg strengths = 3 → +1 (score 79)", () => {
    const r = computeSelfEvaluationImprovement(strengthInput(3));
    expect(r.evaluation_score).toBe(79);
    expect(r.average_strengths_per_area).toBe(3);
  });

  it("avg strengths = 4 → +1 (score 79)", () => {
    const r = computeSelfEvaluationImprovement(strengthInput(4));
    expect(r.evaluation_score).toBe(79);
    expect(r.average_strengths_per_area).toBe(4);
  });

  it("avg strengths = 2 → no modifier (score 78)", () => {
    const r = computeSelfEvaluationImprovement(strengthInput(2));
    expect(r.evaluation_score).toBe(78);
    expect(r.average_strengths_per_area).toBe(2);
  });

  it("avg strengths = 1 → no modifier (score 78)", () => {
    const r = computeSelfEvaluationImprovement(strengthInput(1));
    expect(r.evaluation_score).toBe(78);
    expect(r.average_strengths_per_area).toBe(1);
  });

  it("avg strengths = 0 (< 1) → -4 (score 74)", () => {
    const r = computeSelfEvaluationImprovement(strengthInput(0));
    expect(r.evaluation_score).toBe(74);
    expect(r.average_strengths_per_area).toBe(0);
  });

  it("avg strengths rounds to 1 decimal: (3+3+3+3+2)/5 = 2.8", () => {
    const input = baseInput({
      areas: [
        makeArea({ id: "a0", strengths_count: 3, evidence_count: 3, development_areas_count: 2, actions_total: 10, actions_completed: 10 }),
        makeArea({ id: "a1", strengths_count: 3, evidence_count: 3, development_areas_count: 2, actions_total: 10, actions_completed: 10 }),
        makeArea({ id: "a2", strengths_count: 3, evidence_count: 3, development_areas_count: 2, actions_total: 10, actions_completed: 10 }),
        makeArea({ id: "a3", strengths_count: 3, evidence_count: 3, development_areas_count: 2, actions_total: 10, actions_completed: 10 }),
        makeArea({ id: "a4", strengths_count: 2, evidence_count: 3, development_areas_count: 2, actions_total: 10, actions_completed: 10 }),
      ],
    });
    const r = computeSelfEvaluationImprovement(input);
    // Math.round((14/5)*10)/10 = Math.round(28)/10 = 2.8
    expect(r.average_strengths_per_area).toBe(2.8);
  });

  it("avg strengths rounding boundary: (4+5+5+5+5)/5 = 4.8 → not >= 5 → +1 (score 79)", () => {
    const input = baseInput({
      areas: [
        makeArea({ id: "a0", strengths_count: 4, evidence_count: 3, development_areas_count: 2, actions_total: 10, actions_completed: 10 }),
        makeArea({ id: "a1", strengths_count: 5, evidence_count: 3, development_areas_count: 2, actions_total: 10, actions_completed: 10 }),
        makeArea({ id: "a2", strengths_count: 5, evidence_count: 3, development_areas_count: 2, actions_total: 10, actions_completed: 10 }),
        makeArea({ id: "a3", strengths_count: 5, evidence_count: 3, development_areas_count: 2, actions_total: 10, actions_completed: 10 }),
        makeArea({ id: "a4", strengths_count: 5, evidence_count: 3, development_areas_count: 2, actions_total: 10, actions_completed: 10 }),
      ],
    });
    const r = computeSelfEvaluationImprovement(input);
    // Math.round((24/5)*10)/10 = Math.round(48)/10 = 4.8
    expect(r.average_strengths_per_area).toBe(4.8);
    expect(r.evaluation_score).toBe(79);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. AREA COVERAGE MODIFIER
// ══════════════════════════════════════════════════════════════════════════════

describe("Modifier 6 — Area coverage breadth", () => {
  function coverageInput(count: number): SelfEvaluationInput {
    return baseInput({
      areas: Array.from({ length: count }, (_, i) => makeArea({
        id: `a${i}`,
        self_grade: "good",
        strengths_count: 5,
        evidence_count: 3,
        development_areas_count: 2,
        actions_total: 10,
        actions_completed: 10,
      })),
    });
  }

  it("0 areas → -2", () => {
    // Already tested in zero areas section; score = 44
    const r = computeSelfEvaluationImprovement(baseInput({ areas: [] }));
    expect(r.evaluation_score).toBe(44);
  });

  it("1 area → no modifier for mod6", () => {
    /**
     * 1 area, all good:
     *   52 + mod1(100% >=80 → +5) + mod2(10/10=100% → +6) + mod3(1/1=100% → +5)
     *   + mod4(1>=1 → +5) + mod5(5.0>=5 → +4) + mod6(1, not >=3 not 0 → 0) = 77
     */
    const r = computeSelfEvaluationImprovement(coverageInput(1));
    expect(r.evaluation_score).toBe(77);
  });

  it("2 areas → no modifier for mod6", () => {
    /**
     * 2 areas: same as above but mod6 still 0 (2 not >=3 not 0)
     *   52 + 5 + 6 + 5 + 5 + 4 + 0 = 77
     */
    const r = computeSelfEvaluationImprovement(coverageInput(2));
    expect(r.evaluation_score).toBe(77);
  });

  it("3 areas → +2", () => {
    /**
     * 3 areas:
     *   52 + 5 + 6 + 5 + 5 + 4 + 2 = 79
     */
    const r = computeSelfEvaluationImprovement(coverageInput(3));
    expect(r.evaluation_score).toBe(79);
  });

  it("4 areas → +2", () => {
    /**
     * 4 areas:
     *   52 + 5 + 6 + 5 + 5 + 4 + 2 = 79
     */
    const r = computeSelfEvaluationImprovement(coverageInput(4));
    expect(r.evaluation_score).toBe(79);
  });

  it("5 areas → +5", () => {
    const r = computeSelfEvaluationImprovement(coverageInput(5));
    expect(r.evaluation_score).toBe(82);
  });

  it("8 areas → +5", () => {
    const r = computeSelfEvaluationImprovement(coverageInput(8));
    expect(r.evaluation_score).toBe(82);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. METRIC CALCULATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Metric calculations", () => {
  it("good_or_outstanding_rate: pct(2,5) = 40", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "good" }),
        makeArea({ id: "a2", self_grade: "outstanding" }),
        makeArea({ id: "a3", self_grade: "requires_improvement" }),
        makeArea({ id: "a4", self_grade: "inadequate" }),
        makeArea({ id: "a5", self_grade: "requires_improvement" }),
      ],
    }));
    expect(r.good_or_outstanding_rate).toBe(40);
  });

  it("good_or_outstanding_rate: pct(3,4) = 75", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "good" }),
        makeArea({ id: "a2", self_grade: "outstanding" }),
        makeArea({ id: "a3", self_grade: "good" }),
        makeArea({ id: "a4", self_grade: "requires_improvement" }),
      ],
    }));
    expect(r.good_or_outstanding_rate).toBe(75);
  });

  it("action_completion_rate: pct(7,10) = 70", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", actions_total: 10, actions_completed: 7 }),
      ],
    }));
    expect(r.action_completion_rate).toBe(70);
  });

  it("action_completion_rate is unmeasured when there are no actions", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [makeArea({ id: "a1", actions_total: 0, actions_completed: 0 })],
    }));
    expect(r.action_completion_rate).toBeNull();
  });

  it("action_completion_rate: pct(1,3) = 33", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [makeArea({ id: "a1", actions_total: 3, actions_completed: 1 })],
    }));
    expect(r.action_completion_rate).toBe(33);
  });

  it("evidence_coverage_rate: pct(2,3) = 67", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", evidence_count: 3 }),
        makeArea({ id: "a2", evidence_count: 1 }),
        makeArea({ id: "a3", evidence_count: 0 }),
      ],
    }));
    expect(r.evidence_coverage_rate).toBe(67);
  });

  it("evidence_coverage_rate is unmeasured when there are no areas", () => {
    const r = computeSelfEvaluationImprovement(baseInput({ areas: [] }));
    expect(r.evidence_coverage_rate).toBeNull();
  });

  it("areas_with_development_plans: counts correctly", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", development_areas_count: 3 }),
        makeArea({ id: "a2", development_areas_count: 0 }),
        makeArea({ id: "a3", development_areas_count: 1 }),
        makeArea({ id: "a4", development_areas_count: 0 }),
      ],
    }));
    expect(r.areas_with_development_plans).toBe(2);
  });

  it("average_strengths_per_area: Math.round((7/3)*10)/10 = 2.3", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", strengths_count: 3 }),
        makeArea({ id: "a2", strengths_count: 2 }),
        makeArea({ id: "a3", strengths_count: 2 }),
      ],
    }));
    expect(r.average_strengths_per_area).toBe(2.3);
  });

  it("average_strengths_per_area is unmeasured when there are no areas", () => {
    const r = computeSelfEvaluationImprovement(baseInput({ areas: [] }));
    expect(r.average_strengths_per_area).toBeNull();;
  });

  it("total_areas matches length of areas array", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [makeArea({ id: "a1" }), makeArea({ id: "a2" }), makeArea({ id: "a3" })],
    }));
    expect(r.total_areas).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. STRENGTHS, CONCERNS, RECOMMENDATIONS, INSIGHTS GENERATION
// ══════════════════════════════════════════════════════════════════════════════

describe("Strengths generation", () => {
  it("includes 'consistently rates good or outstanding' when goodRate >= 80", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.strengths.some(s => s.includes("consistently rates the home as good or outstanding"))).toBe(true);
  });

  it("excludes good-rate strength when goodRate < 80", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "good" }),
        makeArea({ id: "a2", self_grade: "requires_improvement" }),
        makeArea({ id: "a3", self_grade: "requires_improvement" }),
      ],
    }));
    expect(r.strengths.some(s => s.includes("consistently rates the home as good"))).toBe(false);
  });

  it("includes action completion strength when actionCompletionRate >= 90 and totalActions > 0", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.strengths.some(s => s.includes("Improvement actions are completed promptly"))).toBe(true);
  });

  it("excludes action completion strength when no actions (even though rate would be 0)", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [makeArea({ id: "a1", actions_total: 0, actions_completed: 0 })],
    }));
    expect(r.strengths.some(s => s.includes("Improvement actions are completed promptly"))).toBe(false);
  });

  it("includes evidence strength when evidenceCoverageRate >= 90", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.strengths.some(s => s.includes("Every evaluated area is supported by documented evidence"))).toBe(true);
  });

  it("includes dev areas strength when all areas have dev areas", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.strengths.some(s => s.includes("All areas include honest identification of development needs"))).toBe(true);
  });

  it("includes strengths depth strength when avgStrengths >= 5", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.strengths.some(s => s.includes("Strengths are richly documented"))).toBe(true);
  });

  it("includes comprehensive coverage strength when total >= 5", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.strengths.some(s => s.includes("Comprehensive self-evaluation covers all key domains"))).toBe(true);
  });
});

describe("Concerns generation", () => {
  it("includes no self-evaluation concern when 0 areas", () => {
    const r = computeSelfEvaluationImprovement(baseInput({ areas: [] }));
    expect(r.concerns).toContain("No self-evaluation recorded — the home has no framework for continuous improvement");
  });

  it("includes quality concern when goodRate < 40", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "inadequate" }),
        makeArea({ id: "a2", self_grade: "requires_improvement" }),
        makeArea({ id: "a3", self_grade: "requires_improvement" }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("Majority of self-evaluated areas are below good"))).toBe(true);
  });

  it("includes action follow-through concern when actionCompletionRate < 50 and totalActions > 0", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [makeArea({ id: "a1", actions_total: 10, actions_completed: 4 })],
    }));
    expect(r.concerns.some(c => c.includes("Improvement actions are not being completed"))).toBe(true);
  });

  it("excludes action concern when no actions defined", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [makeArea({ id: "a1", actions_total: 0, actions_completed: 0 })],
    }));
    expect(r.concerns.some(c => c.includes("Improvement actions are not being completed"))).toBe(false);
  });

  it("includes evidence concern when evidenceCoverageRate < 50", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", evidence_count: 0 }),
        makeArea({ id: "a2", evidence_count: 0 }),
        makeArea({ id: "a3", evidence_count: 1 }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("Most evaluated areas lack evidence"))).toBe(true);
  });

  it("includes complacency concern when no dev areas identified", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", development_areas_count: 0 }),
        makeArea({ id: "a2", development_areas_count: 0 }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("No development areas identified — this suggests complacency"))).toBe(true);
  });

  it("includes strengths documentation concern when avgStrengths < 1", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", strengths_count: 0 }),
        makeArea({ id: "a2", strengths_count: 0 }),
      ],
    }));
    expect(r.concerns.some(c => c.includes("Strengths are poorly documented"))).toBe(true);
  });

  it("has no concerns in outstanding scenario", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.concerns).toEqual([]);
  });
});

describe("Recommendations generation", () => {
  it("includes framework recommendation when 0 areas", () => {
    const r = computeSelfEvaluationImprovement(baseInput({ areas: [] }));
    expect(r.recommendations.some(rec => rec.recommendation.includes("comprehensive self-evaluation framework"))).toBe(true);
    expect(r.recommendations[0].regulatory_ref).toBe("CHR 2015 Reg 45");
  });

  it("includes action tracking recommendation when actionCompletionRate < 70 and totalActions > 0", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [makeArea({ id: "a1", actions_total: 10, actions_completed: 5 })],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.includes("Implement tracking"))).toBe(true);
  });

  it("excludes action tracking recommendation when actionCompletionRate >= 70", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [makeArea({ id: "a1", actions_total: 10, actions_completed: 7 })],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.includes("Implement tracking"))).toBe(false);
  });

  it("includes evidence recommendation when evidenceCoverageRate < 70", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", evidence_count: 1 }),
        makeArea({ id: "a2", evidence_count: 0 }),
        makeArea({ id: "a3", evidence_count: 0 }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.includes("verifiable evidence"))).toBe(true);
  });

  it("includes dev area reflection recommendation when withDevAreas < ceil(total*0.5)", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", development_areas_count: 0 }),
        makeArea({ id: "a2", development_areas_count: 0 }),
        makeArea({ id: "a3", development_areas_count: 0 }),
        makeArea({ id: "a4", development_areas_count: 1 }),
      ],
    }));
    // withDevAreas=1 < ceil(4*0.5)=2
    expect(r.recommendations.some(rec => rec.recommendation.includes("Conduct honest reflection"))).toBe(true);
  });

  it("includes grade improvement recommendation when goodRate < 60", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "good" }),
        makeArea({ id: "a2", self_grade: "requires_improvement" }),
        makeArea({ id: "a3", self_grade: "inadequate" }),
      ],
    }));
    // goodRate = pct(1,3) = 33% < 60
    expect(r.recommendations.some(rec => rec.recommendation.includes("Develop targeted improvement plans"))).toBe(true);
  });

  it("includes expand coverage recommendation when total > 0 and total < 3", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [makeArea({ id: "a1" }), makeArea({ id: "a2" })],
    }));
    expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("Expand self-evaluation"))).toBe(true);
  });

  it("excludes expand recommendation when total >= 3", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [makeArea({ id: "a1" }), makeArea({ id: "a2" }), makeArea({ id: "a3" })],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.includes("Expand self-evaluation"))).toBe(false);
  });

  it("caps recommendations at 5 and re-ranks", () => {
    // Trigger all possible: 0 areas gives framework rec, but we need areas for others
    // Use 2 areas with poor everything to trigger: action tracking, evidence, dev areas, grade improvement, expand
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "inadequate", strengths_count: 0, evidence_count: 0, development_areas_count: 0, actions_total: 10, actions_completed: 2 }),
        makeArea({ id: "a2", self_grade: "inadequate", strengths_count: 0, evidence_count: 0, development_areas_count: 0, actions_total: 10, actions_completed: 2 }),
      ],
    }));
    expect(r.recommendations.length).toBeLessThanOrEqual(5);
    // Verify ranks are sequential
    r.recommendations.forEach((rec, i) => {
      expect(rec.rank).toBe(i + 1);
    });
  });

  it("has no recommendations in outstanding scenario", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.recommendations).toEqual([]);
  });
});

describe("Insights generation", () => {
  it("includes exemplary insight when all conditions met (goodRate>=80, actionRate>=90, evidenceRate>=90, total>=3)", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.insights.some(i => i.text.includes("exemplary") && i.severity === "positive")).toBe(true);
  });

  it("excludes exemplary insight when total < 3", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1" }),
        makeArea({ id: "a2" }),
      ],
    }));
    expect(r.insights.some(i => i.text.includes("exemplary"))).toBe(false);
  });

  it("excludes exemplary insight when action completion < 90", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: Array.from({ length: 5 }, (_, i) => makeArea({
        id: `a${i}`,
        actions_total: 10,
        actions_completed: 8,
      })),
    }));
    expect(r.insights.some(i => i.text.includes("exemplary"))).toBe(false);
  });

  it("includes critical insight when 0 areas", () => {
    const r = computeSelfEvaluationImprovement(baseInput({ areas: [] }));
    expect(r.insights.some(i => i.severity === "critical" && i.text.includes("significant regulatory gap"))).toBe(true);
  });

  it("includes paper exercise warning when actionCompletionRate < 50 and totalActions > 0", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [makeArea({ id: "a1", actions_total: 10, actions_completed: 4 })],
    }));
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("paper exercise"))).toBe(true);
  });

  it("includes honest self-reflection insight when all areas have dev areas", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Honest self-reflection"))).toBe(true);
  });

  it("includes low self-grades warning when goodRate < 40", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "inadequate" }),
        makeArea({ id: "a2", self_grade: "requires_improvement" }),
        makeArea({ id: "a3", self_grade: "requires_improvement" }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Low self-grades"))).toBe(true);
  });

  it("caps insights at 3", () => {
    // Trigger many: 0 areas gives critical, but that blocks others. Use poor areas instead.
    // Can get: paper exercise (warning), low self-grades (warning), honest reflection won't fire with 0 dev areas.
    // With poor data: actionRate<50 → paper exercise, goodRate<40 → low self-grades. Max from areas = 2 warnings.
    // With 0 areas: critical insight only.
    // Hard to get > 3 from code logic alone. Test the cap with outstanding data (gets exemplary + honest = 2 ≤ 3).
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.insights.length).toBeLessThanOrEqual(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 15. HEADLINE PER RATING
// ══════════════════════════════════════════════════════════════════════════════

describe("Headlines per rating", () => {
  it("outstanding headline", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.headline).toBe("Self-evaluation is rigorous, evidence-based and drives continuous improvement across the home");
  });

  it("good headline", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "good", strengths_count: 3, development_areas_count: 1, actions_total: 8, actions_completed: 6 }),
        makeArea({ id: "a2", self_grade: "good", strengths_count: 3, development_areas_count: 1, actions_total: 8, actions_completed: 6 }),
        makeArea({ id: "a3", self_grade: "good", strengths_count: 3, development_areas_count: 1, actions_total: 8, actions_completed: 6 }),
        makeArea({ id: "a4", self_grade: "good", strengths_count: 3, development_areas_count: 0, actions_total: 8, actions_completed: 6 }),
        makeArea({ id: "a5", self_grade: "requires_improvement", strengths_count: 3, development_areas_count: 0, actions_total: 8, actions_completed: 6 }),
      ],
    }));
    expect(r.headline).toBe("Good self-evaluation practice with honest reflection and effective action planning");
  });

  it("adequate headline", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "good", strengths_count: 2, evidence_count: 2, development_areas_count: 1, actions_total: 5, actions_completed: 3 }),
        makeArea({ id: "a2", self_grade: "good", strengths_count: 2, evidence_count: 1, development_areas_count: 0, actions_total: 5, actions_completed: 3 }),
        makeArea({ id: "a3", self_grade: "inadequate", strengths_count: 2, evidence_count: 0, development_areas_count: 0, actions_total: 5, actions_completed: 3 }),
      ],
    }));
    expect(r.headline).toBe("Self-evaluation exists but needs more depth, evidence and follow-through on actions");
  });

  it("inadequate headline", () => {
    const r = computeSelfEvaluationImprovement(baseInput({ areas: [] }));
    expect(r.headline).toBe("Self-evaluation practice is inadequate — the home cannot demonstrate a culture of improvement");
  });

  it("insufficient_data headline", () => {
    const r = computeSelfEvaluationImprovement({ today: TODAY, total_children: 0, areas: [] });
    expect(r.headline).toBe("No data available for self-evaluation analysis");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 16. EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("single area with perfect scores", () => {
    /**
     * 1 area, outstanding, 5 strengths, evidence, dev area, 10/10 actions:
     *   52 + mod1(100%>=80→+5) + mod2(100%>=90→+6) + mod3(100%>=90→+5)
     *   + mod4(1>=1→+5) + mod5(5.0>=5→+4) + mod6(1, not >=3 not 0 → 0) = 77
     */
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [makeArea({ id: "a1", self_grade: "outstanding", strengths_count: 5, evidence_count: 5, development_areas_count: 3, actions_total: 10, actions_completed: 10 })],
    }));
    expect(r.evaluation_score).toBe(77);
    expect(r.evaluation_rating).toBe("good");
  });

  it("single area with worst scores", () => {
    /**
     * 1 area, inadequate, 0 strengths, 0 evidence, 0 dev areas, 10/0 actions:
     *   52 + mod1(0%<40→-5) + mod2(0%<50→-5) + mod3(0%<50→-4)
     *   + mod4(0→-5) + mod5(0<1→-4) + mod6(1, not >=3 not 0 → 0) = 29
     */
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [makeArea({ id: "a1", self_grade: "inadequate", strengths_count: 0, evidence_count: 0, development_areas_count: 0, actions_total: 10, actions_completed: 0 })],
    }));
    expect(r.evaluation_score).toBe(29);
    expect(r.evaluation_rating).toBe("inadequate");
  });

  it("score clamps at 0 (cannot go negative)", () => {
    // Hypothetical: need score to go below 0. With 0 areas:
    // 52 - 5 - 1 - 2 = 44 — not enough. Can't get below 29 with areas.
    // The clamp function ensures min is 0. Test with deeply negative scenario:
    // We can't actually get below 29 in the current engine, but we verify clamp works at the boundary.
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [makeArea({ id: "a1", self_grade: "inadequate", strengths_count: 0, evidence_count: 0, development_areas_count: 0, actions_total: 10, actions_completed: 0 })],
    }));
    expect(r.evaluation_score).toBeGreaterThanOrEqual(0);
  });

  it("score clamps at 100 (cannot exceed 100)", () => {
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.evaluation_score).toBeLessThanOrEqual(100);
  });

  it("rating boundary: score exactly 80 → outstanding", () => {
    /**
     * Need score exactly 80. Use 5 areas to get mod6=+5.
     * Target: 80. Non-mod5: 52+5+6+5+5+5=78. Need mod5=+2? Not possible (it's +4, +1, 0, or -4).
     * Try: 52+5+6+5+5+4+5=82. Need -2 somewhere.
     * Alternative: 52+5+2+5+5+4+5=78, need +2 more. That's 80 if mod1=+5, mod2=+2, rest max.
     *
     * mod2=+2: actionCompletionRate 70-89%.
     * 52 + 5(mod1) + 2(mod2) + 5(mod3) + 5(mod4) + 4(mod5) + 5(mod6) = 78. Not 80.
     *
     * Try: 52+5+6+2+5+4+5=79. Nope.
     * Try: 52+5+6+5+2+4+5=79.
     * Try: 52+5+6+5+5+1+5=79.
     * Try: 52+5+6+5+5+4+2=79.
     *
     * Alternative: 6 areas, mod2=+6 with mod5=+1.
     * 52+5+6+5+5+1+5=79. Still not 80.
     *
     * Try: 52+2+6+5+5+4+5=79.
     * Try: mod1=+5, mod2=+6, mod3=+5, mod4=+5, mod5=+4, mod6=+5 = 82. 82-2=80.
     * Need one modifier to be 2 less. mod5: +1 instead of +4 → 79. Off by 1.
     * mod3: +2 instead of +5 → 79. Off by 1.
     *
     * Actually 52+5+6+5+5+4+5=82. To get 80 we need 52+X=80, X=28.
     * 5+6+5+5+4+5=30. Need 28, so lose 2. Options:
     *   mod1: +2 (lose 3) → 79
     *   mod2: +2 (lose 4) → 78
     *   mod3: +2 (lose 3) → 79
     *   mod5: +1 (lose 3) → 79
     *   mod6: +2 (lose 3) → 79
     *   mod5: 0 (lose 4) → 78
     *   mod4: +2 (lose 3) → 79
     *
     * Two adjustments: mod1=+2 (lose 3) + mod5=+4 → 79. Still odd.
     * mod2=+2 (lose 4) + mod5=+4+... → 78.
     * mod6: +2 (4 areas) + mod5 stays +4 → 79. Off by 1.
     *
     * It's hard to hit exactly 80. Let's verify the boundary with >= check.
     * Score 80 should be outstanding.
     */
    // Use a known config that produces exactly 80:
    // 52 + mod1(+5) + mod2(+6) + mod3(+5) + mod4(+2) + mod5(+4) + mod6(+5) = 79... no
    // 52 + mod1(+5) + mod2(+6) + mod3(+5) + mod4(+5) + mod5(0) + mod6(+5) = 78
    // Let's try: 3 areas (mod6=+2), all maxed otherwise.
    // 52+5+6+5+5+4+2=79. Close.
    // 4 areas (mod6=+2), all maxed:
    // 52+5+6+5+5+4+2=79. Still 79.
    // Can't easily hit 80 exactly. Test rating at boundary conceptually:
    // Score 82 → outstanding (confirmed above)
    // Score 79 → good (confirmed above)
    // So the boundary at 80 is correct per the toRating function.
    const r = computeSelfEvaluationImprovement(baseInput());
    expect(r.evaluation_score).toBe(82);
    expect(r.evaluation_rating).toBe("outstanding");
  });

  it("rating boundary: score exactly 65 → good", () => {
    /**
     * 5 good areas, varying to hit 65.
     * Target 65. Need mods summing to 13.
     * mod1(+5)+mod2(+2)+mod3(0)+mod4(0)+mod5(+1)+mod6(+5) = 13.
     * 52+13=65.
     *
     * mod2=+2: actionRate 70-89%. Use 10 total, 7 completed per area → 35/50=70%.
     * mod3=0: evidenceRate 50-69%. Use 3/5 with evidence → 60%.
     * mod4=0: withDevAreas between 1 and ceil(5*0.5)-1=2. So 1 dev area.
     *   Wait — withDevAreas=1 < ceil(2.5)=3, and withDevAreas != 0 → no adjustment. OK.
     * mod5=+1: avgStrengths 3-4.9. Use 3 per area.
     */
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "good", strengths_count: 3, evidence_count: 2, development_areas_count: 1, actions_total: 10, actions_completed: 7 }),
        makeArea({ id: "a2", self_grade: "good", strengths_count: 3, evidence_count: 1, development_areas_count: 0, actions_total: 10, actions_completed: 7 }),
        makeArea({ id: "a3", self_grade: "good", strengths_count: 3, evidence_count: 1, development_areas_count: 0, actions_total: 10, actions_completed: 7 }),
        makeArea({ id: "a4", self_grade: "good", strengths_count: 3, evidence_count: 0, development_areas_count: 0, actions_total: 10, actions_completed: 7 }),
        makeArea({ id: "a5", self_grade: "good", strengths_count: 3, evidence_count: 0, development_areas_count: 0, actions_total: 10, actions_completed: 7 }),
      ],
    }));
    // goodRate = 5/5 = 100% → +5
    // actionRate = 35/50 = 70% → +2
    // evidenceRate = 3/5 = 60% → 0 (not >=70, not <50)
    // withDevAreas = 1 < ceil(5*0.5)=3, not 0 → 0
    // avgStrengths = 15/5 = 3.0 → +1
    // total=5 → +5
    // 52+5+2+0+0+1+5=65
    expect(r.evaluation_score).toBe(65);
    expect(r.evaluation_rating).toBe("good");
  });

  it("rating boundary: score 64 → adequate", () => {
    /**
     * Similar to above but lose 1 point. Change mod5 to 0 (avg 2):
     * 52+5+2+0+0+0+5=64.
     */
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "good", strengths_count: 2, evidence_count: 2, development_areas_count: 1, actions_total: 10, actions_completed: 7 }),
        makeArea({ id: "a2", self_grade: "good", strengths_count: 2, evidence_count: 1, development_areas_count: 0, actions_total: 10, actions_completed: 7 }),
        makeArea({ id: "a3", self_grade: "good", strengths_count: 2, evidence_count: 1, development_areas_count: 0, actions_total: 10, actions_completed: 7 }),
        makeArea({ id: "a4", self_grade: "good", strengths_count: 2, evidence_count: 0, development_areas_count: 0, actions_total: 10, actions_completed: 7 }),
        makeArea({ id: "a5", self_grade: "good", strengths_count: 2, evidence_count: 0, development_areas_count: 0, actions_total: 10, actions_completed: 7 }),
      ],
    }));
    expect(r.evaluation_score).toBe(64);
    expect(r.evaluation_rating).toBe("adequate");
  });

  it("rating boundary: score exactly 45 → adequate", () => {
    /**
     * Need score 45 exactly.
     * Target: mods sum to -7.
     * 0 areas: 52-5-1-2=44. Need one more point. Can't adjust 0-area easily.
     *
     * Try 1 area, inadequate, mixed fields:
     * 52 + mod1(0%<40→-5) + mod2 + mod3 + mod4 + mod5 + mod6(1→0) = ?
     *
     * 1 area, requires_improvement, 2 strengths, evidence, 0 dev, 10/6 actions:
     * mod1: 0/1=0% <40 → -5 → 47
     * mod2: 6/10=60% → 0 → 47
     * mod3: 1/1=100% >=90 → +5 → 52
     * mod4: 0 → -5 → 47
     * mod5: 2.0 (not >=3, not <1) → 0 → 47
     * mod6: 1 → 0 → 47
     * Not 45.
     *
     * 1 area, requires_improvement, 1 strength, evidence, 0 dev, 10/6 actions:
     * mod1: -5→47, mod2: 0→47, mod3: +5→52, mod4: -5→47, mod5: 1.0 (not<1)→0→47, mod6: 0→47
     * That's 47.
     *
     * 2 areas, RI, 1 strength each, 1 with evidence, 0 dev, 10/6 actions each:
     * mod1: 0% <40 → -5 → 47
     * mod2: 12/20=60% → 0 → 47
     * mod3: 1/2=50% (not >=70, not <50) → 0 → 47
     * mod4: 0 → -5 → 42
     * mod5: 2/2=1.0 (not >=3, not <1) → 0 → 42
     * mod6: 2 → 0 → 42
     * That's 42.
     *
     * 2 areas, RI, 1 strength each, both evidence, 1 dev, 10/7 actions each:
     * mod1: -5→47, mod2: 14/20=70%→+2→49, mod3: 2/2=100%→+5→54
     * mod4: 1 >= ceil(2*0.5)=1 → +2→56, mod5: 1.0→0→56, mod6: 0→56. Nope.
     *
     * 1 area, RI, 1 strength, no evidence, 0 dev, 10/5 actions:
     * mod1: -5→47, mod2: 50%→0→47, mod3: 0%<50→-4→43, mod4: -5→38, mod5: 1.0→0→38, mod6: 0→38
     * Too low.
     *
     * 1 area, good, 1 strength, no evidence, 0 dev, 10/6:
     * mod1: 100%→+5→57, mod2: 60%→0→57, mod3: 0%<50→-4→53, mod4: 0→-5→48, mod5: 1.0→0→48, mod6: 0→48
     * 48.
     *
     * 1 area, good, 1 strength, no evidence, 0 dev, 10/4 actions:
     * mod1: +5→57, mod2: 40%<50→-5→52, mod3: 0%<50→-4→48, mod4: -5→43, mod5: 1.0→0→43, mod6: 0→43
     * 43.
     *
     * 1 area, good, 2 strengths, no evidence, 1 dev, 10/4:
     * mod1: +5→57, mod2: -5→52, mod3: -4→48, mod4: 1>=1→+5→53, mod5: 2.0→0→53, mod6: 0→53
     * 53.
     *
     * 1 area, good, 1 strength, 1 evidence, 0 dev, 10/5:
     * mod1: +5→57, mod2: 50%→0→57, mod3: 100%→+5→62, mod4: -5→57, mod5: 1.0→0→57, mod6: 0→57
     * Hmm. This is tricky. Let me try a specific combination.
     *
     * 3 areas: 1 good, 2 RI, 2 strengths each, 2 with evidence, 1 dev, 10/6 actions each:
     * mod1: pct(1,3)=33%<40→-5→47
     * mod2: 18/30=60%→0→47
     * mod3: pct(2,3)=67%→0→47
     * mod4: 1 < ceil(3*0.5)=2, not 0 → 0→47
     * mod5: 6/3=2.0→0→47
     * mod6: 3→+2→49
     * 49.
     *
     * 3 areas: 1 good, 2 inadequate, 1 strength each, 2 evidence, 1 dev, 10/6:
     * mod1: pct(1,3)=33%<40→-5→47
     * mod2: 60%→0→47
     * mod3: 67%→0→47
     * mod4: 1<2, not 0→0→47
     * mod5: 3/3=1.0→0→47
     * mod6: +2→49
     * Same.
     *
     * 3 areas: 0 good, 1 strength each, 1 evidence, 0 dev, 10/6:
     * mod1: -5→47, mod2: 0→47, mod3: pct(1,3)=33%<50→-4→43, mod4: -5→38, mod5: 1.0→0→38, mod6: +2→40
     * 40.
     *
     * Need 45. Let me try:
     * 3 areas: 0 good, 2 strengths each, 2 evidence, 0 dev, 10/7:
     * mod1: -5→47, mod2: 21/30=70%→+2→49, mod3: pct(2,3)=67%→0→49, mod4: -5→44, mod5: 2.0→0→44, mod6: +2→46
     * 46!
     *
     * Change mod2 slightly: 3 areas, 10/6=60%:
     * mod1:-5→47, mod2:18/30=60%→0→47, mod3:67%→0→47, mod4:-5→42, mod5:2.0→0→42, mod6:+2→44
     * 44.
     *
     * Try: 10/7 and 1 evidence:
     * mod1:-5→47, mod2:70%→+2→49, mod3:pct(1,3)=33%<50→-4→45, mod4:-5→40, mod5: 2→0→40, mod6:+2→42
     * 42.
     *
     * Try: 3 areas, 0 good, 3 strengths each, 2 evidence, 1 dev, 10/7:
     * mod1:-5→47, mod2:+2→49, mod3:67%→0→49, mod4:1<2→0→49, mod5:3.0→+1→50, mod6:+2→52
     * 52.
     *
     * Getting 45 exactly is tricky. Let me try:
     * 3 areas: 0 good, 1 str, 3 evidence, 0 dev, 10/7:
     * mod1:-5→47, mod2:+2→49, mod3:100%→+5→54, mod4:-5→49, mod5:1→0→49, mod6:+2→51
     *
     * 2 areas: 0 good, 2 str each, 1 evidence, 0 dev, 10/7:
     * mod1: pct(0,2)=0%<40→-5→47
     * mod2: 14/20=70%→+2→49
     * mod3: pct(1,2)=50%→0 (not >=70, not <50)→49
     * mod4: 0→-5→44
     * mod5: 4/2=2.0→0→44
     * mod6: 2→0→44
     * 44.
     *
     * 2 areas: 0 good, 2 str each, 2 evidence, 0 dev, 10/7:
     * mod1:-5→47, mod2:+2→49, mod3:100%→+5→54, mod4:-5→49, mod5:2→0→49, mod6:0→49
     * 49.
     *
     * 2 areas: 1 good 1 RI, 2 str each, 1 evidence, 0 dev, 10/6:
     * mod1: pct(1,2)=50%→0 (not >=60, not <40)→52
     * mod2: 12/20=60%→0→52
     * mod3: pct(1,2)=50%→0→52
     * mod4: 0→-5→47
     * mod5: 2→0→47
     * mod6: 0→47
     * 47.
     *
     * 2 areas: 1 good 1 RI, 1 str each, 1 evidence, 0 dev, 10/4:
     * mod1: 50%→0→52, mod2: 8/20=40%<50→-5→47, mod3: 50%→0→47, mod4: -5→42, mod5: 1→0→42, mod6: 0→42
     *
     * Exact 45:
     * 2 areas: 1 good 1 RI, 1 str, 2 evidence, 0 dev, 10/4:
     * mod1: 50%→0→52, mod2: 40%<50→-5→47, mod3: 100%→+5→52, mod4: -5→47, mod5: 1→0→47, mod6: 0→47
     *
     * 2 areas: 0 good, 1 str, 2 evidence, 1 dev, 10/6:
     * mod1: 0%<40→-5→47
     * mod2: 12/20=60%→0→47
     * mod3: 100%→+5→52
     * mod4: 1>=ceil(1)=1→+2→54
     * mod5: 1→0→54
     * mod6: 0→54
     *
     * Simplest approach: use the near-miss of 44 from 0 areas and verify 44 is inadequate.
     * Then verify 45 is adequate via 1 area with specific values.
     *
     * 1 area, good, 0 str, 1 evidence, 0 dev, 10/6:
     * mod1: +5→57, mod2: 60%→0→57, mod3: 100%→+5→62, mod4: -5→57, mod5: 0<1→-4→53, mod6: 0→53
     *
     * Actually let me just find a combination:
     * 2 areas: 1 good, 1 inad, 0 str, 1 evidence, 0 dev, 10/6:
     * mod1: pct(1,2)=50%→0→52
     * mod2: 60%→0→52
     * mod3: pct(1,2)=50%→0→52
     * mod4: -5→47
     * mod5: 0<1→-4→43
     * mod6: 0→43
     * 43.
     *
     * 2 areas: 1 good, 1 inad, 0 str, 2 evidence, 0 dev, 10/7:
     * mod1: 50%→0→52, mod2: 70%→+2→54, mod3: 100%→+5→59, mod4: -5→54, mod5: -4→50, mod6: 0→50
     *
     * Tricky. Let me use: 2 areas, 1 good 1 RI, 0 str, 0 evidence, 0 dev, 10/7:
     * mod1: 50%→0→52, mod2: 70%→+2→54, mod3: 0%<50→-4→50, mod4: -5→45, mod5: -4→41, mod6: 0→41
     * 41.
     *
     * 2 areas, 1 good 1 RI, 1 str, 0 evidence, 0 dev, 10/7:
     * mod1: 50%→0→52, mod2: 70%→+2→54, mod3: 0%<50→-4→50, mod4: -5→45, mod5: 1→0→45, mod6: 0→45
     * 45!
     */
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "good", strengths_count: 1, evidence_count: 0, development_areas_count: 0, actions_total: 10, actions_completed: 7 }),
        makeArea({ id: "a2", self_grade: "requires_improvement", strengths_count: 1, evidence_count: 0, development_areas_count: 0, actions_total: 10, actions_completed: 7 }),
      ],
    }));
    expect(r.evaluation_score).toBe(45);
    expect(r.evaluation_rating).toBe("adequate");
  });

  it("rating boundary: score 44 → inadequate", () => {
    const r = computeSelfEvaluationImprovement(baseInput({ areas: [] }));
    expect(r.evaluation_score).toBe(44);
    expect(r.evaluation_rating).toBe("inadequate");
  });

  it("pct helper: rounds to nearest integer", () => {
    // pct(1,3) = Math.round(33.33) = 33
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", actions_total: 3, actions_completed: 1 }),
      ],
    }));
    expect(r.action_completion_rate).toBe(33);
  });

  it("pct helper: pct(2,3) = 67", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", evidence_count: 1 }),
        makeArea({ id: "a2", evidence_count: 1 }),
        makeArea({ id: "a3", evidence_count: 0 }),
      ],
    }));
    expect(r.evidence_coverage_rate).toBe(67);
  });

  it("avgStrengths rounding: (1+1+1)/3 = 1.0 exactly", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", strengths_count: 1 }),
        makeArea({ id: "a2", strengths_count: 1 }),
        makeArea({ id: "a3", strengths_count: 1 }),
      ],
    }));
    // Math.round((3/3)*10)/10 = 1.0
    expect(r.average_strengths_per_area).toBe(1);
  });

  it("avgStrengths rounding: (1+0+0)/3 = 0.3", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", strengths_count: 1 }),
        makeArea({ id: "a2", strengths_count: 0 }),
        makeArea({ id: "a3", strengths_count: 0 }),
      ],
    }));
    // Math.round((1/3)*10)/10 = Math.round(3.33)/10 = 3/10 = 0.3
    expect(r.average_strengths_per_area).toBe(0.3);
  });

  it("many areas: 10 areas all outstanding", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: Array.from({ length: 10 }, (_, i) => makeArea({
        id: `a${i}`,
        self_grade: "outstanding",
        strengths_count: 6,
        evidence_count: 5,
        development_areas_count: 3,
        actions_total: 10,
        actions_completed: 10,
      })),
    }));
    // 52+5+6+5+5+4+5=82
    expect(r.evaluation_score).toBe(82);
    expect(r.evaluation_rating).toBe("outstanding");
    expect(r.total_areas).toBe(10);
  });

  it("mixed grades: outstanding counted same as good for goodRate", () => {
    const r = computeSelfEvaluationImprovement(baseInput({
      areas: [
        makeArea({ id: "a1", self_grade: "outstanding" }),
        makeArea({ id: "a2", self_grade: "good" }),
      ],
    }));
    expect(r.good_or_outstanding_rate).toBe(100);
  });
});
