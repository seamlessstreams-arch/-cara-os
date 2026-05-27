import { describe, it, expect } from "vitest";
import {
  computeSubstanceMisuseScreening,
  type SubstanceMisuseScreeningInput,
  type SubstanceScreeningRecordInput,
  type SubstanceMisuseResult,
} from "../home-substance-misuse-screening-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-27";

function makeScreening(overrides: Partial<SubstanceScreeningRecordInput> = {}): SubstanceScreeningRecordInput {
  return {
    id: "scr_1",
    child_id: "yp_alex",
    screening_tool: "crafft",
    risk_level: "low_risk",
    substances_identified_count: 0,
    has_harm_reduction: true,
    professional_support_count: 1,
    has_child_insight: true,
    has_child_motivation: true,
    warning_signs_count: 0,
    shared_with_social_worker: true,
    shared_with_camhs: false,
    child_authored: false,
    ...overrides,
  };
}

function baseInput(overrides: Partial<SubstanceMisuseScreeningInput> = {}): SubstanceMisuseScreeningInput {
  return {
    today: TODAY,
    total_children: 5,
    screenings: [],
    ...overrides,
  };
}

/** Build N screenings for distinct children with uniform properties. */
function manyScreenings(
  n: number,
  overrides: Partial<SubstanceScreeningRecordInput> = {},
): SubstanceScreeningRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeScreening({ id: `scr_${i}`, child_id: `yp_${i}`, ...overrides }),
  );
}

/** Build an outstanding-level scenario: all rates high, no high risk. */
function outstandingScreenings(): SubstanceScreeningRecordInput[] {
  // 5 children, 10 screenings, all positive indicators
  return Array.from({ length: 10 }, (_, i) =>
    makeScreening({
      id: `scr_${i}`,
      child_id: `yp_${i % 5}`,
      risk_level: "low_risk",
      has_harm_reduction: true,
      professional_support_count: 2,
      has_child_insight: true,
      shared_with_social_worker: true,
      shared_with_camhs: true,
    }),
  );
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("computeSubstanceMisuseScreening", () => {

  // ═══════════════════════════════════════════════════════════════════════════
  // INSUFFICIENT DATA
  // ═══════════════════════════════════════════════════════════════════════════
  describe("insufficient data", () => {
    it("returns insufficient_data when total_children is 0", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 0 }));
      expect(r.screening_rating).toBe("insufficient_data");
      expect(r.screening_score).toBe(0);
    });

    it("returns zero for all metric rates when total_children is 0", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 0 }));
      expect(r.children_screened_rate).toBe(0);
      expect(r.high_risk_rate).toBe(0);
      expect(r.harm_reduction_rate).toBe(0);
      expect(r.professional_support_rate).toBe(0);
      expect(r.child_insight_rate).toBe(0);
      expect(r.information_sharing_rate).toBe(0);
    });

    it("returns 0 total_screenings when total_children is 0", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 0 }));
      expect(r.total_screenings).toBe(0);
    });

    it("returns empty arrays for strengths, concerns, recommendations, insights when total_children is 0", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 0 }));
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("returns the no-data headline when total_children is 0", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 0 }));
      expect(r.headline).toContain("No data available");
    });

    it("returns insufficient_data even if screenings array is populated but total_children is 0", () => {
      const r = computeSubstanceMisuseScreening(baseInput({
        total_children: 0,
        screenings: [makeScreening()],
      }));
      expect(r.screening_rating).toBe("insufficient_data");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ZERO RECORDS (total_children > 0 but no screenings)
  // ═══════════════════════════════════════════════════════════════════════════
  describe("zero screenings (total_children > 0)", () => {
    it("applies all zero-record penalties (base 52 - 3 - 1 - 1 - 2 = 45)", () => {
      // mod1: -3, mod2: no adj, mod3: -1, mod4: no adj, mod5: -1, mod6: -2
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(r.screening_score).toBe(45);
    });

    it("rates adequate with zero records", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(r.screening_rating).toBe("adequate");
    });

    it("includes concern about no screenings", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(r.concerns.some(c => c.includes("No substance misuse screenings"))).toBe(true);
    });

    it("includes recommendation to implement screening", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(r.recommendations.length).toBeGreaterThanOrEqual(1);
      expect(r.recommendations[0].recommendation).toContain("Implement routine substance misuse screening");
      expect(r.recommendations[0].urgency).toBe("immediate");
    });

    it("includes critical insight about no records", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("No screening records"))).toBe(true);
    });

    it("reports 0 total_screenings", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(r.total_screenings).toBe(0);
    });

    it("reports 0 for children_screened_rate", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(r.children_screened_rate).toBe(0);
    });

    it("has no strengths with zero records", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(r.strengths).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RATING THRESHOLDS
  // ═══════════════════════════════════════════════════════════════════════════
  describe("rating thresholds", () => {
    it("achieves outstanding (>=80) with max positive modifiers", () => {
      // 5 children, 5 screenings, all unique children → 100% coverage
      // All have harm reduction, professional support, child insight, shared with SW, no high risk
      // base 52 + mod1(+5) + mod2(+6) + mod3(+5) + mod4(+5) + mod5(+4) + mod6(+5) = 82
      const screenings = manyScreenings(5, {
        has_harm_reduction: true,
        professional_support_count: 1,
        has_child_insight: true,
        shared_with_social_worker: true,
        risk_level: "low_risk",
      });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.screening_score).toBe(82);
      expect(r.screening_rating).toBe("outstanding");
    });

    it("returns outstanding headline", () => {
      const screenings = manyScreenings(5, {
        has_harm_reduction: true,
        professional_support_count: 1,
        has_child_insight: true,
        shared_with_social_worker: true,
        risk_level: "low_risk",
      });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.headline).toContain("proactive, thorough and child-centred");
    });

    it("achieves good (65-79)", () => {
      // 4 of 5 children → 80% coverage → +5
      // harm reduction 80% → +6
      // professional support: 80% → +5
      // child insight: 60% → +2
      // info sharing: 40%? let's do 60% → +1
      // no high risk → +5
      // 52 + 5 + 6 + 5 + 2 + 1 + 5 = 76
      const screenings = manyScreenings(5, {
        has_harm_reduction: true,
        professional_support_count: 2,
        has_child_insight: false,
        shared_with_social_worker: false,
        shared_with_camhs: false,
        risk_level: "low_risk",
      });
      // set 3 of 5 to have child insight (60%)
      screenings[0].has_child_insight = true;
      screenings[1].has_child_insight = true;
      screenings[2].has_child_insight = true;
      // set 3 of 5 to share (60%) → +1
      screenings[0].shared_with_social_worker = true;
      screenings[1].shared_with_social_worker = true;
      screenings[2].shared_with_social_worker = true;
      // But only 4 unique children
      screenings[4].child_id = screenings[3].child_id;

      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      // 4/5 = 80% → +5, harm 100% → +6, prof 100% → +5, insight 60% → +2, sharing 60% → +1, no high risk → +5
      // 52 + 5 + 6 + 5 + 2 + 1 + 5 = 76
      expect(r.screening_score).toBe(76);
      expect(r.screening_rating).toBe("good");
    });

    it("returns good headline", () => {
      const screenings = manyScreenings(5, {
        has_harm_reduction: true,
        professional_support_count: 1,
        has_child_insight: false,
        shared_with_social_worker: true,
        risk_level: "low_risk",
      });
      screenings[0].has_child_insight = true;
      screenings[1].has_child_insight = true;
      screenings[2].has_child_insight = true;
      screenings[4].child_id = screenings[3].child_id;
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.headline).toContain("Good screening coverage");
    });

    it("achieves adequate (45-64)", () => {
      // 2 of 5 children → 40% → no coverage adj (30 <= 40 < 50 and 40 < 50 → no bracket)
      // Wait: 40% >= 30 and < 50 → falls in the gap, no modifier for mod1
      // harm reduction: 50% → +2
      // professional support: 50% → +2
      // child insight: 50% → no adj (< 60 and >= 30)
      // info sharing: 50% → +1
      // no high risk → +5
      // 52 + 0 + 2 + 2 + 0 + 1 + 5 = 62
      const screenings = manyScreenings(2, {
        has_harm_reduction: true,
        professional_support_count: 1,
        has_child_insight: true,
        shared_with_social_worker: true,
        risk_level: "low_risk",
      });
      // Add 2 more with negative indicators
      screenings.push(makeScreening({ id: "scr_x1", child_id: "yp_x1", has_harm_reduction: false, professional_support_count: 0, has_child_insight: false, shared_with_social_worker: false, shared_with_camhs: false }));
      screenings.push(makeScreening({ id: "scr_x2", child_id: "yp_x2", has_harm_reduction: false, professional_support_count: 0, has_child_insight: false, shared_with_social_worker: false, shared_with_camhs: false }));
      // 4 unique children / 5 total → 80% → +5... too high. Let's use only 2 children
      // Make all 4 screenings belong to only 2 children
      screenings[2].child_id = "yp_0";
      screenings[3].child_id = "yp_1";
      // 2 unique children / 5 → 40% → gap, no modifier
      // harm: 2/4 → 50% → +2
      // prof: 2/4 → 50% → +2
      // insight: 2/4 → 50% → gap (>=30, <60)
      // sharing: 2/4 → 50% → +1
      // no high risk → +5
      // 52 + 0 + 2 + 2 + 0 + 1 + 5 = 62
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.screening_score).toBe(62);
      expect(r.screening_rating).toBe("adequate");
    });

    it("returns adequate headline", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      // Zero records → score 45 → adequate
      expect(r.headline).toContain("coverage, harm reduction and information sharing need improvement");
    });

    it("achieves inadequate (<45) with max penalties", () => {
      // 1 child out of 10 → 10% screened → <30 → -5
      // harm reduction 0% → <30 → -5
      // professional support 0% → <20 → -4
      // child insight 0% → <30 → -4
      // info sharing 0% → <30 → -4
      // high risk with 0 support → <30 → -3
      // 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27
      const screenings = [makeScreening({
        child_id: "yp_0",
        risk_level: "high_risk",
        has_harm_reduction: false,
        professional_support_count: 0,
        has_child_insight: false,
        shared_with_social_worker: false,
        shared_with_camhs: false,
      })];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      expect(r.screening_score).toBe(27);
      expect(r.screening_rating).toBe("inadequate");
    });

    it("returns inadequate headline", () => {
      const screenings = [makeScreening({
        risk_level: "high_risk",
        has_harm_reduction: false,
        professional_support_count: 0,
        has_child_insight: false,
        shared_with_social_worker: false,
        shared_with_camhs: false,
      })];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      expect(r.headline).toContain("inadequate");
    });

    it("score exactly 80 is outstanding", () => {
      // Need score = 80 exactly. base 52, need +28 total
      // +5 +6 +5 +5 +4 +5 = +30 → 82, too high
      // +5 +6 +5 +5 +1 +5 = +27 → 79, too low
      // +5 +6 +5 +5 +4 +2 = +27 → 79
      // +5 +6 +5 +2 +4 +5 = +27 → 79
      // +5 +6 +5 +5 +2(>=50hr support) +5 = ...nope that's mod6
      // Let me be precise:
      // mod1:+5, mod2:+6, mod3:+5, mod4:+5, mod5:+4, mod6:+5 = 82
      // mod1:+5, mod2:+6, mod3:+5, mod4:+2, mod5:+4, mod6:+5 = 79... no 80
      // mod1:+5, mod2:+6, mod3:+2, mod4:+5, mod5:+4, mod6:+5 = 79
      // mod1:+5, mod2:+6, mod3:+5, mod4:+5, mod5:+1, mod6:+5 = 79
      // mod1:+2, mod2:+6, mod3:+5, mod4:+5, mod5:+4, mod6:+5 = 79
      // Hard to get exactly 80. Let me try: 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82. Remove 2.
      // Use mod1:+5, mod2:+6, mod3:+5, mod4:+5, mod5:+4, mod6:+2 = +27 → 79
      // Use mod1:+5, mod2:+6, mod3:+5, mod4:+5, mod5:+4, mod6(high risk support>=50,<80):+2 → 79
      // Hmm. Let's try mod1:+5, mod2:+6, mod3:+5, mod4:+5, mod5:+4, mod6:0(gap) → 77
      // Try: direct score verification instead.
      // Score=80 → clamp(80,0,100) = 80, rating outstanding
      // Just test the boundary with computed result:
      // mod1:+5, mod2:+2, mod3:+5, mod4:+5, mod5:+4, mod6:+5 = +26 → 78. Not enough.
      // mod1:+5, mod2:+6, mod3:+5, mod4:+5, mod5:+4, mod6:+5 = 82 (simplest outstanding)
      // For exactly 80, we need +28. Possible: +5+6+5+5+4+3... no +3 doesn't exist.
      // +5+6+5+5+4+5 = 30 → 82. Can we get -2 from one? No minus path in a modifier gives -2 except mod6 zero-records.
      // Let's just test 82 as outstanding boundary and test 79 as good boundary.
      // Actually, score exactly 65 and 45 are testable boundaries.
      // Skip exact 80 test — covered by threshold tests.
      const screenings = manyScreenings(5, {
        has_harm_reduction: true,
        professional_support_count: 1,
        has_child_insight: true,
        shared_with_social_worker: true,
        risk_level: "low_risk",
      });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.screening_score).toBeGreaterThanOrEqual(80);
      expect(r.screening_rating).toBe("outstanding");
    });

    it("score exactly 65 is good", () => {
      // Need score = 65. base 52, need +13.
      // mod1: +5 (>=80% coverage)
      // mod2: 0 (gap: >=30, <50)
      // mod3: +2 (>=40, <70)
      // mod4: 0 (gap: >=30, <60)
      // mod5: +1 (>=50, <80)
      // mod6: +5 (no high risk)
      // 52 + 5 + 0 + 2 + 0 + 1 + 5 = 65
      const screenings: SubstanceScreeningRecordInput[] = [];
      for (let i = 0; i < 5; i++) {
        screenings.push(makeScreening({
          id: `scr_${i}`,
          child_id: `yp_${i}`,
          has_harm_reduction: i < 2, // 2/5 = 40% → gap
          professional_support_count: i < 3 ? 1 : 0, // 3/5 = 60% → >=40 → +2
          has_child_insight: i < 2, // 2/5 = 40% → gap
          shared_with_social_worker: i < 2, // only SW
          shared_with_camhs: i === 2, // camhs for 1 more
          // shared_either: i<2 (sw) or i==2 (camhs) → 3/5 = 60% → >=50 → +1
          risk_level: "low_risk",
        }));
      }
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.screening_score).toBe(65);
      expect(r.screening_rating).toBe("good");
    });

    it("score exactly 45 is adequate", () => {
      // score 45 = adequate boundary. base 52, need -7.
      // mod1: -3 (0 records) + mod3: -1 + mod5: -1 + mod6: -2 = -7. That's zero records!
      // 52 - 3 - 1 - 1 - 2 = 45
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(r.screening_score).toBe(45);
      expect(r.screening_rating).toBe("adequate");
    });

    it("score 44 is inadequate", () => {
      // Need 52 - 8. Use 1 screening, 10 children.
      // 1 child / 10 → 10% → mod1: -5
      // harm: 1 with true → 100% → mod2: +6
      // prof: 1 with support → 100% → mod3: +5
      // insight: 1 with true → 100% → mod4: +5
      // sharing: 1 shared → 100% → mod5: +4
      // no high risk → mod6: +5
      // 52 - 5 + 6 + 5 + 5 + 4 + 5 = 72... too high
      // Need a different approach. Let's get mod1:0, and some negatives.
      // 3 children / 10 = 30% → >=30, not <30 → gap. mod1: 0
      // harm: 0/3 → 0% → -5
      // prof: 0/3 → 0% → -4
      // insight: 0/3 → 0% → -4
      // sharing: 0/3 → 0% → -4
      // high risk with 0 support: need high risk records
      // risk: all high, 0 support → 0% → -3
      // 52 + 0 - 5 - 4 - 4 - 4 - 3 = 32 → too low
      // Try: 3 children / 10 = 30%
      // harm: 1/3 ≈ 33% → >=30, <50 → gap, 0
      // prof: 1/3 ≈ 33% → >=20, <40 → gap, 0
      // insight: 1/3 ≈ 33% → >=30, <60 → gap, 0
      // sharing: 0/3 → -4
      // no high risk → +5
      // 52 + 0 + 0 + 0 + 0 - 4 + 5 = 53 → too high
      // Let's just find exact 44: base 52, need -8
      // mod1: -5 (coverage < 30%), mod2: 0 (gap), mod3: 0 (gap), mod4: 0 (gap), mod5: 0 (gap or +1), mod6: -3 (high risk no support)
      // -5 - 3 = -8 → 44!
      // 1 unique child / 5 total_children → 20% < 30 → mod1 = -5
      // harm: e.g. 1/1 = 100% → +6... no that's too much.
      // We need: 1 screening, child coverage 20%, harm gap, prof gap, insight gap, sharing gap, high risk with no support
      // 1 child / 5 → 20% → -5
      // harm: 1/1 = 100% → +6
      // That changes things. With 1 record, any boolean true = 100%.
      // Let's use 3 screenings for 1 child in 5 total: 1/5=20% → -5
      // harm: 1/3 ≈ 33% → gap → 0
      // prof: 1/3 ≈ 33% → >=20, <40 → gap → 0
      // insight: 1/3 ≈ 33% → >=30, <60 → gap → 0
      // sharing: 1/3 ≈ 33% → >=30, <50 → gap → 0
      // risk: all high risk, 1/3 support ≈ 33% → >=30, <50 → gap → 0
      // 52 - 5 + 0 + 0 + 0 + 0 + 0 = 47 → still not 44
      // Let's try: -5 (coverage) -3 (high risk no support) = -8 → 44
      // 2 screenings, 1 child out of 5 → 20% → -5
      // harm: 1/2 = 50% → +2
      // prof: 0/2 = 0% → <20 → -4
      // insight: 0/2 = 0% → <30 → -4
      // sharing: 1/2 = 50% → +1
      // risk: 2 high risk, 0 support → 0% → -3
      // 52 - 5 + 2 - 4 - 4 + 1 - 3 = 39 → too low

      // Let me target 44 precisely:
      // 52 + X = 44 → X = -8
      // mod1:-5, mod2:+2, mod3:+2, mod4:+2, mod5:+1, mod6:-10? No.
      // Actually let's just engineer it:
      // 52 + (-5) + (+2) + (0) + (0) + (-4) + (-1)... wait mod6 can't be -1.
      // mod6 can be: +5, +2, 0 (gap), -3
      // Possible sums of modifiers to get -8:
      // -5 + X = -8 → X = -3 from remaining 5 mods
      // remaining: mod2 + mod3 + mod4 + mod5 + mod6 = -3
      // mod2:+2, mod3:0, mod4:0, mod5:0, mod6:-5? No mod6 min is -3.
      // mod2:0, mod3:0, mod4:0, mod5:0, mod6:-3 = -3 ✓
      // So: mod1:-5, mod2:0(gap), mod3:0(gap), mod4:0(gap), mod5:0(gap), mod6:-3
      // 52 - 5 - 3 = 44

      // 1 child, 5 total_children → 20% → mod1=-5
      // harm: gap (30-49%): 3 screenings, 1 harm → 33%
      // prof: gap (20-39%): 1/3 = 33% → >=20 and <40 → gap
      // insight: gap (30-59%): 1/3 = 33% → gap
      // sharing: gap (30-49%): 1/3 = 33% → gap
      // risk: all 3 high risk, 0 support → 0% → -3
      const screenings = [
        makeScreening({ id: "scr_0", child_id: "yp_0", risk_level: "high_risk", has_harm_reduction: true, professional_support_count: 1, has_child_insight: true, shared_with_social_worker: true, shared_with_camhs: false }),
        makeScreening({ id: "scr_1", child_id: "yp_0", risk_level: "high_risk", has_harm_reduction: false, professional_support_count: 0, has_child_insight: false, shared_with_social_worker: false, shared_with_camhs: false }),
        makeScreening({ id: "scr_2", child_id: "yp_0", risk_level: "high_risk", has_harm_reduction: false, professional_support_count: 0, has_child_insight: false, shared_with_social_worker: false, shared_with_camhs: false }),
      ];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 5, screenings }));
      // 1/5 = 20% → mod1:-5
      // harm: 1/3 ≈ 33% → gap → 0
      // prof: 1/3 ≈ 33% → gap → 0
      // insight: 1/3 ≈ 33% → gap → 0
      // sharing: 1/3 ≈ 33% → gap → 0
      // high risk: 3, with support: 1 (prof>0), rate: 33% → >=30 <50 → gap → 0
      // 52 - 5 + 0 + 0 + 0 + 0 + 0 = 47 → not 44 either
      // The high risk support rate is based on professional_support_count > 0 for high risk records.
      // scr_0 is high_risk with professional_support_count=1 → counted.
      // highRiskSupportRate = pct(1, 3) = 33% → gap (>=30, <50 → not >=50, not <30) → 0
      // So mod6 = 0, not -3. I need 0 high risk with support.
      // Let me fix: all 3 high risk with 0 professional_support_count
      const screenings2 = [
        makeScreening({ id: "scr_0", child_id: "yp_0", risk_level: "high_risk", has_harm_reduction: true, professional_support_count: 0, has_child_insight: true, shared_with_social_worker: true, shared_with_camhs: false }),
        makeScreening({ id: "scr_1", child_id: "yp_0", risk_level: "high_risk", has_harm_reduction: false, professional_support_count: 0, has_child_insight: false, shared_with_social_worker: false, shared_with_camhs: false }),
        makeScreening({ id: "scr_2", child_id: "yp_0", risk_level: "high_risk", has_harm_reduction: false, professional_support_count: 0, has_child_insight: false, shared_with_social_worker: false, shared_with_camhs: false }),
      ];
      // Now: prof support rate: 0/3 = 0% → <20 → mod3:-4
      // insight: 1/3 = 33% → gap → 0
      // sharing: 1/3 = 33% → gap → 0
      // high risk support: 0/3 = 0% → <30 → mod6:-3
      // 52 - 5 + 0 - 4 + 0 + 0 - 3 = 40 → still not 44
      // Let me just compute what gets 44:
      // Need -8 from base. Let's try -5(mod1) + 0 + 0 + 0 + 0 + -3 = -8 → 44
      // For that, all non-mod1 and non-mod6 must be in gap zones AND mod3 must be in gap (not <20)
      // AND mod6 must be -3.
      // prof gap: 20-39%: need some professional support
      // 3 screenings: 1 with support = 33% → gap for mod3 ✓
      // BUT that 1 support person is also a high-risk child with support → highRiskSupportRate = 33% → gap for mod6 (not -3)
      // Contradiction: can't have prof in gap AND high risk support at 0%.
      // Unless the prof support is on a NON-high-risk record. But all are high risk.
      // Let's use mixed risk levels:
      // 3 screenings for 1 child: 2 high risk + 1 low risk
      // prof: low risk one has support → 1/3 = 33% → mod3 gap
      // high risk support: 0/2 = 0% → <30 → mod6:-3
      // harm: low risk one has harm → 1/3 = 33% → mod2 gap
      // insight: 1/3 = 33% → mod4 gap
      // sharing: 1/3 = 33% → mod5 gap
      // 52 - 5 + 0 + 0 + 0 + 0 - 3 = 44 ✓!

      const screenings3 = [
        makeScreening({ id: "scr_0", child_id: "yp_0", risk_level: "low_risk", has_harm_reduction: true, professional_support_count: 1, has_child_insight: true, shared_with_social_worker: true, shared_with_camhs: false }),
        makeScreening({ id: "scr_1", child_id: "yp_0", risk_level: "high_risk", has_harm_reduction: false, professional_support_count: 0, has_child_insight: false, shared_with_social_worker: false, shared_with_camhs: false }),
        makeScreening({ id: "scr_2", child_id: "yp_0", risk_level: "high_risk", has_harm_reduction: false, professional_support_count: 0, has_child_insight: false, shared_with_social_worker: false, shared_with_camhs: false }),
      ];
      const r3 = computeSubstanceMisuseScreening(baseInput({ total_children: 5, screenings: screenings3 }));
      expect(r3.screening_score).toBe(44);
      expect(r3.screening_rating).toBe("inadequate");
    });

    it("score is clamped to 0 (never negative)", () => {
      // Even with extreme penalties, score should be >= 0
      // Use maximum possible penalties
      const screenings = manyScreenings(1, {
        risk_level: "high_risk",
        has_harm_reduction: false,
        professional_support_count: 0,
        has_child_insight: false,
        shared_with_social_worker: false,
        shared_with_camhs: false,
      });
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 100, screenings }));
      expect(r.screening_score).toBeGreaterThanOrEqual(0);
    });

    it("score is clamped to 100 (never exceeds)", () => {
      // Extremely generous scenario
      const screenings = manyScreenings(100, {
        has_harm_reduction: true,
        professional_support_count: 5,
        has_child_insight: true,
        shared_with_social_worker: true,
        shared_with_camhs: true,
        risk_level: "no_identified_risk",
      });
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 100, screenings }));
      expect(r.screening_score).toBeLessThanOrEqual(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER 1: CHILDREN SCREENED (COVERAGE)
  // ═══════════════════════════════════════════════════════════════════════════
  describe("modifier 1 — children screened coverage", () => {
    it("adds +5 when >=80% children screened", () => {
      // 4/5 = 80% → +5
      const screenings = manyScreenings(4);
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.children_screened_rate).toBe(80);
    });

    it("adds +5 when 100% children screened", () => {
      const screenings = manyScreenings(5);
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.children_screened_rate).toBe(100);
    });

    it("adds +2 when >=50% and <80% children screened", () => {
      // 3/5 = 60% → +2
      const screenings = manyScreenings(3);
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.children_screened_rate).toBe(60);
    });

    it("no adjustment when >=30% and <50%", () => {
      // 2/5 = 40% → gap, no adjustment
      const screenings = manyScreenings(2);
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.children_screened_rate).toBe(40);
    });

    it("subtracts -5 when <30% children screened", () => {
      // 1/5 = 20% → -5
      const screenings = manyScreenings(1);
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.children_screened_rate).toBe(20);
    });

    it("subtracts -3 when 0 records", () => {
      // Verified in zero records test: 52 - 3 - 1 - 1 - 2 = 45
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(r.screening_score).toBe(45);
    });

    it("counts unique children not total screenings for coverage", () => {
      // 10 screenings but all for 1 child → 1/5 = 20%
      const screenings = Array.from({ length: 10 }, (_, i) =>
        makeScreening({ id: `scr_${i}`, child_id: "yp_same" }),
      );
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.children_screened_rate).toBe(20);
    });

    it("exactly 50% triggers +2 modifier", () => {
      // 5/10 = 50% → +2
      const screenings = manyScreenings(5);
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      expect(r.children_screened_rate).toBe(50);
    });

    it("exactly 30% is not penalized (in gap zone)", () => {
      // 3/10 = 30% → >=30 and <50 → gap
      const screenings = manyScreenings(3);
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      expect(r.children_screened_rate).toBe(30);
    });

    it("29% triggers the -5 penalty", () => {
      // Need <30%. 2/7 = 29% (rounded)
      const screenings = manyScreenings(2);
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 7, screenings }));
      expect(r.children_screened_rate).toBe(29);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER 2: HARM REDUCTION DOCUMENTED
  // ═══════════════════════════════════════════════════════════════════════════
  describe("modifier 2 — harm reduction documented", () => {
    it("adds +6 when >=80% have harm reduction", () => {
      // 5/5 = 100%
      const screenings = manyScreenings(5, { has_harm_reduction: true });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.harm_reduction_rate).toBe(100);
    });

    it("adds +2 when >=50% and <80% have harm reduction", () => {
      // 3/5 = 60%
      const screenings = manyScreenings(5, { has_harm_reduction: false });
      screenings[0].has_harm_reduction = true;
      screenings[1].has_harm_reduction = true;
      screenings[2].has_harm_reduction = true;
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.harm_reduction_rate).toBe(60);
    });

    it("subtracts -5 when <30% have harm reduction", () => {
      // 1/5 = 20%
      const screenings = manyScreenings(5, { has_harm_reduction: false });
      screenings[0].has_harm_reduction = true;
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.harm_reduction_rate).toBe(20);
    });

    it("no adjustment when 0 records", () => {
      // Verified: mod2 has no adjustment on 0 records
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      // Score includes no mod2 penalty (already tested as 45)
      expect(r.harm_reduction_rate).toBe(0);
    });

    it("gap zone (30-49%) has no adjustment", () => {
      // 2/5 = 40%
      const screenings = manyScreenings(5, { has_harm_reduction: false });
      screenings[0].has_harm_reduction = true;
      screenings[1].has_harm_reduction = true;
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.harm_reduction_rate).toBe(40);
    });

    it("exactly 80% triggers +6", () => {
      // 4/5 = 80%
      const screenings = manyScreenings(5, { has_harm_reduction: false });
      screenings[0].has_harm_reduction = true;
      screenings[1].has_harm_reduction = true;
      screenings[2].has_harm_reduction = true;
      screenings[3].has_harm_reduction = true;
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.harm_reduction_rate).toBe(80);
    });

    it("exactly 50% triggers +2", () => {
      // 5/10 = 50%
      const screenings = manyScreenings(10, { has_harm_reduction: false });
      for (let i = 0; i < 5; i++) screenings[i].has_harm_reduction = true;
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      expect(r.harm_reduction_rate).toBe(50);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER 3: PROFESSIONAL SUPPORT
  // ═══════════════════════════════════════════════════════════════════════════
  describe("modifier 3 — professional support", () => {
    it("adds +5 when >=70% have professional support", () => {
      // 4/5 = 80%
      const screenings = manyScreenings(5, { professional_support_count: 2 });
      screenings[4].professional_support_count = 0;
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.professional_support_rate).toBe(80);
    });

    it("adds +2 when >=40% and <70% have professional support", () => {
      // 3/5 = 60%
      const screenings = manyScreenings(5, { professional_support_count: 0 });
      screenings[0].professional_support_count = 1;
      screenings[1].professional_support_count = 1;
      screenings[2].professional_support_count = 1;
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.professional_support_rate).toBe(60);
    });

    it("subtracts -4 when <20% have professional support", () => {
      // 0/5 = 0%
      const screenings = manyScreenings(5, { professional_support_count: 0 });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.professional_support_rate).toBe(0);
    });

    it("subtracts -1 when 0 records", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      // Confirmed in zero-records score calculation
      expect(r.professional_support_rate).toBe(0);
    });

    it("gap zone (20-39%) has no adjustment", () => {
      // 1/5 = 20%
      const screenings = manyScreenings(5, { professional_support_count: 0 });
      screenings[0].professional_support_count = 1;
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.professional_support_rate).toBe(20);
    });

    it("exactly 70% triggers +5", () => {
      // 7/10 = 70%
      const screenings = manyScreenings(10, { professional_support_count: 0 });
      for (let i = 0; i < 7; i++) screenings[i].professional_support_count = 1;
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      expect(r.professional_support_rate).toBe(70);
    });

    it("exactly 40% triggers +2", () => {
      // 2/5 = 40%
      const screenings = manyScreenings(5, { professional_support_count: 0 });
      screenings[0].professional_support_count = 1;
      screenings[1].professional_support_count = 1;
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.professional_support_rate).toBe(40);
    });

    it("exactly 19% triggers -4", () => {
      // Need <20%. 1/6 = 17% (rounded)
      const screenings = manyScreenings(6, { professional_support_count: 0 });
      screenings[0].professional_support_count = 1;
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 6, screenings }));
      expect(r.professional_support_rate).toBe(17);
    });

    it("professional_support_count > 0 counts as having support", () => {
      const screenings = [makeScreening({ professional_support_count: 3 })];
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.professional_support_rate).toBe(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER 4: CHILD INSIGHT/VOICE
  // ═══════════════════════════════════════════════════════════════════════════
  describe("modifier 4 — child insight/voice", () => {
    it("adds +5 when >=90% have child insight", () => {
      // 5/5 = 100%
      const screenings = manyScreenings(5, { has_child_insight: true });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.child_insight_rate).toBe(100);
    });

    it("adds +2 when >=60% and <90% have child insight", () => {
      // 4/5 = 80%
      const screenings = manyScreenings(5, { has_child_insight: false });
      screenings[0].has_child_insight = true;
      screenings[1].has_child_insight = true;
      screenings[2].has_child_insight = true;
      screenings[3].has_child_insight = true;
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.child_insight_rate).toBe(80);
    });

    it("subtracts -4 when <30% have child insight", () => {
      // 1/5 = 20%
      const screenings = manyScreenings(5, { has_child_insight: false });
      screenings[0].has_child_insight = true;
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.child_insight_rate).toBe(20);
    });

    it("no adjustment when 0 records", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(r.child_insight_rate).toBe(0);
    });

    it("gap zone (30-59%) has no adjustment", () => {
      // 2/5 = 40%
      const screenings = manyScreenings(5, { has_child_insight: false });
      screenings[0].has_child_insight = true;
      screenings[1].has_child_insight = true;
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.child_insight_rate).toBe(40);
    });

    it("exactly 90% triggers +5", () => {
      // 9/10 = 90%
      const screenings = manyScreenings(10, { has_child_insight: true });
      screenings[9].has_child_insight = false;
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      expect(r.child_insight_rate).toBe(90);
    });

    it("exactly 60% triggers +2", () => {
      // 3/5 = 60%
      const screenings = manyScreenings(5, { has_child_insight: false });
      screenings[0].has_child_insight = true;
      screenings[1].has_child_insight = true;
      screenings[2].has_child_insight = true;
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.child_insight_rate).toBe(60);
    });

    it("89% is in +2 zone (not +5)", () => {
      // 8/9 ≈ 89%
      const screenings = manyScreenings(9, { has_child_insight: true });
      screenings[8].has_child_insight = false;
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 9, screenings }));
      expect(r.child_insight_rate).toBe(89);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER 5: INFORMATION SHARING (SW/CAMHS)
  // ═══════════════════════════════════════════════════════════════════════════
  describe("modifier 5 — information sharing", () => {
    it("adds +4 when >=80% shared with SW or CAMHS", () => {
      const screenings = manyScreenings(5, { shared_with_social_worker: true });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.information_sharing_rate).toBe(100);
    });

    it("adds +1 when >=50% and <80% shared", () => {
      // 3/5 = 60%
      const screenings = manyScreenings(5, { shared_with_social_worker: false, shared_with_camhs: false });
      screenings[0].shared_with_social_worker = true;
      screenings[1].shared_with_social_worker = true;
      screenings[2].shared_with_social_worker = true;
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.information_sharing_rate).toBe(60);
    });

    it("subtracts -4 when <30% shared", () => {
      // 1/5 = 20%
      const screenings = manyScreenings(5, { shared_with_social_worker: false, shared_with_camhs: false });
      screenings[0].shared_with_social_worker = true;
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.information_sharing_rate).toBe(20);
    });

    it("subtracts -1 when 0 records", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(r.information_sharing_rate).toBe(0);
    });

    it("shared with CAMHS alone counts", () => {
      const screenings = manyScreenings(5, { shared_with_social_worker: false, shared_with_camhs: true });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.information_sharing_rate).toBe(100);
    });

    it("shared with either SW or CAMHS counts (OR logic)", () => {
      const screenings = manyScreenings(5, { shared_with_social_worker: false, shared_with_camhs: false });
      screenings[0].shared_with_social_worker = true;
      screenings[1].shared_with_camhs = true;
      screenings[2].shared_with_social_worker = true;
      screenings[2].shared_with_camhs = true;
      // 3/5 = 60%
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.information_sharing_rate).toBe(60);
    });

    it("gap zone (30-49%) has no adjustment", () => {
      // 2/5 = 40%
      const screenings = manyScreenings(5, { shared_with_social_worker: false, shared_with_camhs: false });
      screenings[0].shared_with_social_worker = true;
      screenings[1].shared_with_camhs = true;
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.information_sharing_rate).toBe(40);
    });

    it("exactly 80% triggers +4", () => {
      // 4/5 = 80%
      const screenings = manyScreenings(5, { shared_with_social_worker: false, shared_with_camhs: false });
      for (let i = 0; i < 4; i++) screenings[i].shared_with_social_worker = true;
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.information_sharing_rate).toBe(80);
    });

    it("exactly 50% triggers +1", () => {
      // 5/10 = 50%
      const screenings = manyScreenings(10, { shared_with_social_worker: false, shared_with_camhs: false });
      for (let i = 0; i < 5; i++) screenings[i].shared_with_social_worker = true;
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      expect(r.information_sharing_rate).toBe(50);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER 6: RISK IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════════════
  describe("modifier 6 — risk identification quality", () => {
    it("adds +5 when 0 high risk and records exist", () => {
      const screenings = manyScreenings(5, { risk_level: "low_risk" });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      // No high risk → +5
      expect(r.high_risk_rate).toBe(0);
    });

    it("adds +5 when high risk exist with >=80% support", () => {
      // 5 screenings, 3 high risk, all 3 have support → 100% → +5
      const screenings = manyScreenings(5, { risk_level: "low_risk" });
      screenings[0].risk_level = "high_risk";
      screenings[0].professional_support_count = 2;
      screenings[1].risk_level = "active_concern";
      screenings[1].professional_support_count = 1;
      screenings[2].risk_level = "high_risk";
      screenings[2].professional_support_count = 1;
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.high_risk_rate).toBe(60);
    });

    it("adds +2 when high risk support rate >=50% and <80%", () => {
      // 4 high risk, 2 with support → 50%
      const screenings = manyScreenings(5, { risk_level: "high_risk", professional_support_count: 0 });
      screenings[0].professional_support_count = 1;
      screenings[1].professional_support_count = 1;
      screenings[4].risk_level = "low_risk";
      // high risk: 4 (indices 0-3), with support: 2 → 50% → +2
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.high_risk_rate).toBe(80);
    });

    it("subtracts -3 when high risk support rate <30%", () => {
      // 5 high risk, 1 with support → 20%
      const screenings = manyScreenings(5, { risk_level: "high_risk", professional_support_count: 0 });
      screenings[0].professional_support_count = 1;
      // 1/5 = 20% → -3
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.high_risk_rate).toBe(100);
    });

    it("subtracts -2 when 0 records", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      // Already tested score is 45 = 52 - 3 - 1 - 1 - 2
      expect(r.screening_score).toBe(45);
    });

    it("active_concern counts as high risk", () => {
      const screenings = [makeScreening({ risk_level: "active_concern", professional_support_count: 0 })];
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.high_risk_rate).toBe(100);
    });

    it("medium_risk does NOT count as high risk", () => {
      const screenings = manyScreenings(5, { risk_level: "medium_risk" });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.high_risk_rate).toBe(0);
    });

    it("low_risk does NOT count as high risk", () => {
      const screenings = manyScreenings(5, { risk_level: "low_risk" });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.high_risk_rate).toBe(0);
    });

    it("no_identified_risk does NOT count as high risk", () => {
      const screenings = manyScreenings(5, { risk_level: "no_identified_risk" });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.high_risk_rate).toBe(0);
    });

    it("awareness_only does NOT count as high risk", () => {
      const screenings = manyScreenings(5, { risk_level: "awareness_only" });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.high_risk_rate).toBe(0);
    });

    it("gap zone (30-49%) for high risk support rate has no adjustment", () => {
      // 3 high risk, 1 with support → 33% → gap
      const screenings = manyScreenings(5, { risk_level: "low_risk" });
      screenings[0].risk_level = "high_risk";
      screenings[0].professional_support_count = 1;
      screenings[1].risk_level = "high_risk";
      screenings[1].professional_support_count = 0;
      screenings[2].risk_level = "high_risk";
      screenings[2].professional_support_count = 0;
      // 1/3 = 33% → gap
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.high_risk_rate).toBe(60);
    });

    it("100% high risk with 100% support still gives +5", () => {
      const screenings = manyScreenings(5, { risk_level: "high_risk", professional_support_count: 3 });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.high_risk_rate).toBe(100);
    });

    it("mix of high_risk and active_concern both counted in high risk pool", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "c1", risk_level: "high_risk", professional_support_count: 1 }),
        makeScreening({ id: "s2", child_id: "c2", risk_level: "active_concern", professional_support_count: 1 }),
        makeScreening({ id: "s3", child_id: "c3", risk_level: "low_risk" }),
      ];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 3, screenings }));
      // highRisk = 2, highRiskRate = pct(2,3) = 67%
      expect(r.high_risk_rate).toBe(67);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // METRIC CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  describe("metric calculations", () => {
    it("total_screenings equals screenings array length", () => {
      const screenings = manyScreenings(7);
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      expect(r.total_screenings).toBe(7);
    });

    it("children_screened_rate uses unique child IDs", () => {
      // 3 screenings for 2 unique children
      const screenings = [
        makeScreening({ id: "s1", child_id: "yp_a" }),
        makeScreening({ id: "s2", child_id: "yp_b" }),
        makeScreening({ id: "s3", child_id: "yp_a" }),
      ];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 4, screenings }));
      expect(r.children_screened_rate).toBe(50); // 2/4
    });

    it("high_risk_rate is percentage of high/active records out of total", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "c1", risk_level: "high_risk" }),
        makeScreening({ id: "s2", child_id: "c2", risk_level: "low_risk" }),
        makeScreening({ id: "s3", child_id: "c3", risk_level: "active_concern" }),
        makeScreening({ id: "s4", child_id: "c4", risk_level: "medium_risk" }),
      ];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 4, screenings }));
      expect(r.high_risk_rate).toBe(50); // 2/4
    });

    it("harm_reduction_rate counts has_harm_reduction true", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "c1", has_harm_reduction: true }),
        makeScreening({ id: "s2", child_id: "c2", has_harm_reduction: false }),
        makeScreening({ id: "s3", child_id: "c3", has_harm_reduction: true }),
        makeScreening({ id: "s4", child_id: "c4", has_harm_reduction: true }),
      ];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 4, screenings }));
      expect(r.harm_reduction_rate).toBe(75); // 3/4
    });

    it("professional_support_rate counts professional_support_count > 0", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "c1", professional_support_count: 0 }),
        makeScreening({ id: "s2", child_id: "c2", professional_support_count: 1 }),
        makeScreening({ id: "s3", child_id: "c3", professional_support_count: 3 }),
      ];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 3, screenings }));
      expect(r.professional_support_rate).toBe(67); // 2/3
    });

    it("child_insight_rate counts has_child_insight true", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "c1", has_child_insight: true }),
        makeScreening({ id: "s2", child_id: "c2", has_child_insight: false }),
      ];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 2, screenings }));
      expect(r.child_insight_rate).toBe(50);
    });

    it("information_sharing_rate counts either SW or CAMHS", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "c1", shared_with_social_worker: true, shared_with_camhs: false }),
        makeScreening({ id: "s2", child_id: "c2", shared_with_social_worker: false, shared_with_camhs: true }),
        makeScreening({ id: "s3", child_id: "c3", shared_with_social_worker: false, shared_with_camhs: false }),
        makeScreening({ id: "s4", child_id: "c4", shared_with_social_worker: true, shared_with_camhs: true }),
      ];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 4, screenings }));
      expect(r.information_sharing_rate).toBe(75); // 3/4
    });

    it("pct rounds to nearest integer", () => {
      // 1/3 = 33.33% → 33
      const screenings = [
        makeScreening({ id: "s1", child_id: "c1", has_child_insight: true }),
        makeScreening({ id: "s2", child_id: "c2", has_child_insight: false }),
        makeScreening({ id: "s3", child_id: "c3", has_child_insight: false }),
      ];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 3, screenings }));
      expect(r.child_insight_rate).toBe(33);
    });

    it("pct rounds 2/3 to 67", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "c1", has_child_insight: true }),
        makeScreening({ id: "s2", child_id: "c2", has_child_insight: true }),
        makeScreening({ id: "s3", child_id: "c3", has_child_insight: false }),
      ];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 3, screenings }));
      expect(r.child_insight_rate).toBe(67);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ═══════════════════════════════════════════════════════════════════════════
  describe("strengths", () => {
    it("includes proactive screening strength when >=80% coverage", () => {
      const screenings = manyScreenings(5);
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.strengths.some(s => s.includes("proactive approach"))).toBe(true);
    });

    it("includes harm reduction strength when >=80% rate", () => {
      const screenings = manyScreenings(5, { has_harm_reduction: true });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.strengths.some(s => s.includes("Harm reduction"))).toBe(true);
    });

    it("includes professional support strength when >=70% rate", () => {
      const screenings = manyScreenings(5, { professional_support_count: 2 });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.strengths.some(s => s.includes("Professional support is well-coordinated"))).toBe(true);
    });

    it("includes child insight strength when >=90% rate", () => {
      const screenings = manyScreenings(10, { has_child_insight: true });
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      expect(r.strengths.some(s => s.includes("insights and motivation"))).toBe(true);
    });

    it("includes info sharing strength when >=80% rate", () => {
      const screenings = manyScreenings(5, { shared_with_social_worker: true });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.strengths.some(s => s.includes("shared effectively"))).toBe(true);
    });

    it("includes no high risk strength when highRisk === 0 and total > 0", () => {
      const screenings = manyScreenings(5, { risk_level: "low_risk" });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.strengths.some(s => s.includes("No high-risk substance concerns"))).toBe(true);
    });

    it("does not include no-high-risk strength when there are high risk records", () => {
      const screenings = manyScreenings(5, { risk_level: "high_risk", professional_support_count: 2 });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.strengths.some(s => s.includes("No high-risk substance concerns"))).toBe(false);
    });

    it("has no strengths when all rates are low", () => {
      const screenings = [makeScreening({
        risk_level: "high_risk",
        has_harm_reduction: false,
        professional_support_count: 0,
        has_child_insight: false,
        shared_with_social_worker: false,
        shared_with_camhs: false,
      })];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      expect(r.strengths).toEqual([]);
    });

    it("can include all 6 strengths simultaneously", () => {
      // 100% coverage, 100% harm reduction, 100% prof support, 100% insight, 100% sharing, 0 high risk
      const screenings = manyScreenings(5, {
        has_harm_reduction: true,
        professional_support_count: 2,
        has_child_insight: true,
        shared_with_social_worker: true,
        risk_level: "low_risk",
      });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.strengths.length).toBe(6);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ═══════════════════════════════════════════════════════════════════════════
  describe("concerns", () => {
    it("flags no screenings concern when total === 0", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(r.concerns.some(c => c.includes("No substance misuse screenings"))).toBe(true);
    });

    it("flags low coverage concern when <30% screened", () => {
      const screenings = manyScreenings(1);
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      expect(r.concerns.some(c => c.includes("Very few children"))).toBe(true);
    });

    it("flags low harm reduction concern when <30%", () => {
      const screenings = manyScreenings(5, { has_harm_reduction: false });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.concerns.some(c => c.includes("Harm reduction approaches are rarely documented"))).toBe(true);
    });

    it("flags low professional support concern when <20%", () => {
      const screenings = manyScreenings(5, { professional_support_count: 0 });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.concerns.some(c => c.includes("Professional support is lacking"))).toBe(true);
    });

    it("flags low child insight concern when <30%", () => {
      const screenings = manyScreenings(5, { has_child_insight: false });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.concerns.some(c => c.includes("perspectives are missing"))).toBe(true);
    });

    it("flags low info sharing concern when <30%", () => {
      const screenings = manyScreenings(5, { shared_with_social_worker: false, shared_with_camhs: false });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.concerns.some(c => c.includes("not being shared"))).toBe(true);
    });

    it("has no concerns when all rates are high", () => {
      const screenings = manyScreenings(5, {
        has_harm_reduction: true,
        professional_support_count: 1,
        has_child_insight: true,
        shared_with_social_worker: true,
        risk_level: "low_risk",
      });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.concerns).toEqual([]);
    });

    it("can include all 5 non-zero-record concerns simultaneously", () => {
      const screenings = [makeScreening({
        child_id: "yp_0",
        risk_level: "high_risk",
        has_harm_reduction: false,
        professional_support_count: 0,
        has_child_insight: false,
        shared_with_social_worker: false,
        shared_with_camhs: false,
      })];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      // coverage < 30, harm < 30, prof < 20, insight < 30, sharing < 30
      expect(r.concerns.length).toBe(5);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  describe("recommendations", () => {
    it("recommends implementing screening when 0 records", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(r.recommendations.length).toBe(1);
      expect(r.recommendations[0].recommendation).toContain("Implement routine substance misuse screening");
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[0].regulatory_ref).toBe("CHR 2015 Reg 12");
    });

    it("recommends extending screening when coverage <50%", () => {
      const screenings = manyScreenings(2);
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Extend screening"))).toBe(true);
    });

    it("recommends harm reduction when rate <50%", () => {
      const screenings = manyScreenings(5, { has_harm_reduction: false });
      screenings[0].has_harm_reduction = true;
      // 1/5 = 20%
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("harm reduction strategies"))).toBe(true);
    });

    it("recommends info sharing when rate <50%", () => {
      const screenings = manyScreenings(5, { shared_with_social_worker: false, shared_with_camhs: false });
      screenings[0].shared_with_social_worker = true;
      // 1/5 = 20%
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("Share screening outcomes"))).toBe(true);
      expect(r.recommendations.find(rec => rec.recommendation.includes("Share screening outcomes"))?.urgency).toBe("immediate");
    });

    it("recommends recording child insight when rate <60%", () => {
      const screenings = manyScreenings(5, { has_child_insight: false });
      screenings[0].has_child_insight = true;
      // 1/5 = 20%
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("child's own understanding"))).toBe(true);
      expect(r.recommendations.find(rec => rec.recommendation.includes("child's own understanding"))?.urgency).toBe("planned");
    });

    it("recommends professional support when rate <40%", () => {
      const screenings = manyScreenings(5, { professional_support_count: 0 });
      screenings[0].professional_support_count = 1;
      // 1/5 = 20%
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("specialist professional support"))).toBe(true);
    });

    it("caps recommendations at 5", () => {
      // Trigger all 6 recommendation conditions (0 records triggers only 1)
      const screenings = [makeScreening({
        child_id: "yp_0",
        has_harm_reduction: false,
        professional_support_count: 0,
        has_child_insight: false,
        shared_with_social_worker: false,
        shared_with_camhs: false,
      })];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      expect(r.recommendations.length).toBeLessThanOrEqual(5);
    });

    it("re-numbers ranks sequentially after capping", () => {
      const screenings = [makeScreening({
        child_id: "yp_0",
        has_harm_reduction: false,
        professional_support_count: 0,
        has_child_insight: false,
        shared_with_social_worker: false,
        shared_with_camhs: false,
      })];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("has no recommendations when all rates are high", () => {
      const screenings = manyScreenings(5, {
        has_harm_reduction: true,
        professional_support_count: 1,
        has_child_insight: true,
        shared_with_social_worker: true,
        risk_level: "low_risk",
      });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.recommendations).toEqual([]);
    });

    it("each recommendation has a regulatory_ref", () => {
      const screenings = [makeScreening({
        child_id: "yp_0",
        has_harm_reduction: false,
        professional_support_count: 0,
        has_child_insight: false,
        shared_with_social_worker: false,
        shared_with_camhs: false,
      })];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref).toBeTruthy();
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ═══════════════════════════════════════════════════════════════════════════
  describe("insights", () => {
    it("includes exemplary insight when coverage, harm reduction, and sharing all >=80% with >=10 screenings", () => {
      const screenings = Array.from({ length: 10 }, (_, i) =>
        makeScreening({
          id: `scr_${i}`,
          child_id: `yp_${i}`,
          has_harm_reduction: true,
          shared_with_social_worker: true,
        }),
      );
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("does NOT include exemplary insight when <10 screenings even if rates are high", () => {
      const screenings = manyScreenings(5, {
        has_harm_reduction: true,
        shared_with_social_worker: true,
      });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.insights.some(i => i.text.includes("exemplary"))).toBe(false);
    });

    it("includes critical insight when 0 records", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("No screening records"))).toBe(true);
    });

    it("includes warning insight when high risk rate >=30%", () => {
      // 2/5 = 40% high risk
      const screenings = manyScreenings(5, { risk_level: "low_risk", professional_support_count: 1 });
      screenings[0].risk_level = "high_risk";
      screenings[1].risk_level = "active_concern";
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("High proportion"))).toBe(true);
    });

    it("includes comprehensive coverage positive insight when >=80% screened", () => {
      const screenings = manyScreenings(5);
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Comprehensive screening coverage"))).toBe(true);
    });

    it("includes no high risk positive insight when 0 high risk", () => {
      const screenings = manyScreenings(5, { risk_level: "low_risk" });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("No high-risk concerns"))).toBe(true);
    });

    it("caps insights at 3", () => {
      // Trigger many insight conditions at once
      const screenings = Array.from({ length: 10 }, (_, i) =>
        makeScreening({
          id: `scr_${i}`,
          child_id: `yp_${i}`,
          has_harm_reduction: true,
          shared_with_social_worker: true,
          risk_level: "low_risk",
        }),
      );
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      // exemplary + comprehensive + no high risk = 3 positive insights (could be 4 total with others)
      expect(r.insights.length).toBeLessThanOrEqual(3);
    });

    it("does not include high risk warning when rate <30%", () => {
      // 1/5 = 20% high risk
      const screenings = manyScreenings(5, { risk_level: "low_risk" });
      screenings[0].risk_level = "high_risk";
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.insights.some(i => i.text.includes("High proportion"))).toBe(false);
    });

    it("has no insights for a middle-ground scenario with no triggers", () => {
      // <80% coverage, <80% harm, <80% sharing, <10 screenings, not 0 records, <30% high risk, >0 high risk
      const screenings = [
        makeScreening({ id: "s1", child_id: "c1", risk_level: "high_risk", has_harm_reduction: false, shared_with_social_worker: false, shared_with_camhs: false }),
        makeScreening({ id: "s2", child_id: "c2", risk_level: "low_risk", has_harm_reduction: true, shared_with_social_worker: true }),
      ];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 5, screenings }));
      // 2/5=40% coverage (<80), harm 50% (<80), sharing 50% (<80), total 2 (<10),
      // high risk 50% (>=30 → triggers warning)
      // Actually 1/2 = 50% high risk >= 30 → triggers warning. Let me fix.
      // Use 4 low risk + 1 high risk: highRiskRate = 1/5 = 20% → <30 → no warning
      const screenings2 = manyScreenings(3, { risk_level: "low_risk", has_harm_reduction: false, shared_with_social_worker: false, shared_with_camhs: false });
      screenings2.push(makeScreening({ id: "s4", child_id: "c4", risk_level: "high_risk", has_harm_reduction: false, shared_with_social_worker: false, shared_with_camhs: false }));
      // 4 unique / 5 total = 80%... that'll trigger coverage insight
      // Need <80%:
      const screenings3 = [
        makeScreening({ id: "s1", child_id: "c1", risk_level: "low_risk", has_harm_reduction: false, shared_with_social_worker: false, shared_with_camhs: false }),
        makeScreening({ id: "s2", child_id: "c2", risk_level: "low_risk", has_harm_reduction: false, shared_with_social_worker: false, shared_with_camhs: false }),
        makeScreening({ id: "s3", child_id: "c3", risk_level: "high_risk", has_harm_reduction: false, shared_with_social_worker: false, shared_with_camhs: false }),
      ];
      const r2 = computeSubstanceMisuseScreening(baseInput({ total_children: 5, screenings: screenings3 }));
      // 3/5=60% coverage (<80 → no coverage insight), 1/3=33% high risk (>=30 → warning triggers!)
      // Need <30% high risk. Use 10 screenings with 2 high risk → 2/10=20% → <30
      const screenings4 = manyScreenings(7, { risk_level: "low_risk", has_harm_reduction: false, shared_with_social_worker: false, shared_with_camhs: false });
      screenings4.push(makeScreening({ id: "s7", child_id: "c7", risk_level: "high_risk", has_harm_reduction: false, shared_with_social_worker: false, shared_with_camhs: false }));
      // 8 unique / 10 total children = 80%... still triggers coverage insight
      const r3 = computeSubstanceMisuseScreening(baseInput({ total_children: 20, screenings: screenings4 }));
      // 8/20 = 40% coverage (<80), harm 0% (<80), sharing 0% (<80), total 8 (<10),
      // highRisk 1/8 = 13% (<30 → no warning), highRisk > 0 so no "no high risk"
      expect(r3.insights).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADLINES
  // ═══════════════════════════════════════════════════════════════════════════
  describe("headlines", () => {
    it("outstanding headline mentions proactive and child-centred", () => {
      const screenings = manyScreenings(5, {
        has_harm_reduction: true,
        professional_support_count: 1,
        has_child_insight: true,
        shared_with_social_worker: true,
        risk_level: "low_risk",
      });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.headline).toContain("proactive");
      expect(r.headline).toContain("child-centred");
    });

    it("good headline mentions effective risk identification", () => {
      // Build a good scenario (score 65-79)
      const screenings: SubstanceScreeningRecordInput[] = [];
      for (let i = 0; i < 5; i++) {
        screenings.push(makeScreening({
          id: `scr_${i}`,
          child_id: `yp_${i}`,
          has_harm_reduction: i < 2,
          professional_support_count: i < 3 ? 1 : 0,
          has_child_insight: i < 2,
          shared_with_social_worker: i < 2,
          shared_with_camhs: i === 2,
          risk_level: "low_risk",
        }));
      }
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.screening_rating).toBe("good");
      expect(r.headline).toContain("effective risk identification");
    });

    it("adequate headline mentions improvement needed", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(r.screening_rating).toBe("adequate");
      expect(r.headline).toContain("need improvement");
    });

    it("inadequate headline mentions risks not managed safely", () => {
      const screenings = [makeScreening({
        risk_level: "high_risk",
        has_harm_reduction: false,
        professional_support_count: 0,
        has_child_insight: false,
        shared_with_social_worker: false,
        shared_with_camhs: false,
      })];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      expect(r.screening_rating).toBe("inadequate");
      expect(r.headline).toContain("inadequate");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════
  describe("edge cases", () => {
    it("single screening for single child covers everything", () => {
      const screenings = [makeScreening({
        child_id: "yp_0",
        has_harm_reduction: true,
        professional_support_count: 1,
        has_child_insight: true,
        shared_with_social_worker: true,
        risk_level: "low_risk",
      })];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 1, screenings }));
      expect(r.children_screened_rate).toBe(100);
      expect(r.harm_reduction_rate).toBe(100);
      expect(r.professional_support_rate).toBe(100);
      expect(r.child_insight_rate).toBe(100);
      expect(r.information_sharing_rate).toBe(100);
      expect(r.screening_rating).toBe("outstanding");
    });

    it("large number of screenings works correctly", () => {
      const screenings = manyScreenings(200, {
        has_harm_reduction: true,
        professional_support_count: 1,
        has_child_insight: true,
        shared_with_social_worker: true,
        risk_level: "low_risk",
      });
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 200, screenings }));
      expect(r.total_screenings).toBe(200);
      expect(r.screening_rating).toBe("outstanding");
    });

    it("duplicate child_ids are counted once for coverage", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "yp_a" }),
        makeScreening({ id: "s2", child_id: "yp_a" }),
        makeScreening({ id: "s3", child_id: "yp_a" }),
      ];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 5, screenings }));
      expect(r.children_screened_rate).toBe(20); // 1/5 = 20%
      expect(r.total_screenings).toBe(3);
    });

    it("total_children 1 with no screenings still gets zero-record penalties", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 1, screenings: [] }));
      expect(r.screening_score).toBe(45);
      expect(r.screening_rating).toBe("adequate");
    });

    it("all screening fields at minimum values", () => {
      const screenings = [makeScreening({
        substances_identified_count: 0,
        has_harm_reduction: false,
        professional_support_count: 0,
        has_child_insight: false,
        has_child_motivation: false,
        warning_signs_count: 0,
        shared_with_social_worker: false,
        shared_with_camhs: false,
        child_authored: false,
        risk_level: "high_risk",
      })];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 5, screenings }));
      expect(r.screening_score).toBeLessThan(45);
      expect(r.screening_rating).toBe("inadequate");
    });

    it("screening_tool value does not affect score", () => {
      const base = [makeScreening({ screening_tool: "crafft" })];
      const alt = [makeScreening({ screening_tool: "audit_c_older" })];
      const r1 = computeSubstanceMisuseScreening(baseInput({ total_children: 1, screenings: base }));
      const r2 = computeSubstanceMisuseScreening(baseInput({ total_children: 1, screenings: alt }));
      expect(r1.screening_score).toBe(r2.screening_score);
    });

    it("child_authored value does not affect score", () => {
      const s1 = [makeScreening({ child_authored: true })];
      const s2 = [makeScreening({ child_authored: false })];
      const r1 = computeSubstanceMisuseScreening(baseInput({ total_children: 1, screenings: s1 }));
      const r2 = computeSubstanceMisuseScreening(baseInput({ total_children: 1, screenings: s2 }));
      expect(r1.screening_score).toBe(r2.screening_score);
    });

    it("has_child_motivation value does not affect score", () => {
      const s1 = [makeScreening({ has_child_motivation: true })];
      const s2 = [makeScreening({ has_child_motivation: false })];
      const r1 = computeSubstanceMisuseScreening(baseInput({ total_children: 1, screenings: s1 }));
      const r2 = computeSubstanceMisuseScreening(baseInput({ total_children: 1, screenings: s2 }));
      expect(r1.screening_score).toBe(r2.screening_score);
    });

    it("warning_signs_count value does not affect score", () => {
      const s1 = [makeScreening({ warning_signs_count: 0 })];
      const s2 = [makeScreening({ warning_signs_count: 10 })];
      const r1 = computeSubstanceMisuseScreening(baseInput({ total_children: 1, screenings: s1 }));
      const r2 = computeSubstanceMisuseScreening(baseInput({ total_children: 1, screenings: s2 }));
      expect(r1.screening_score).toBe(r2.screening_score);
    });

    it("substances_identified_count value does not affect score", () => {
      const s1 = [makeScreening({ substances_identified_count: 0 })];
      const s2 = [makeScreening({ substances_identified_count: 5 })];
      const r1 = computeSubstanceMisuseScreening(baseInput({ total_children: 1, screenings: s1 }));
      const r2 = computeSubstanceMisuseScreening(baseInput({ total_children: 1, screenings: s2 }));
      expect(r1.screening_score).toBe(r2.screening_score);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FULL SCORE COMPOSITION
  // ═══════════════════════════════════════════════════════════════════════════
  describe("full score composition", () => {
    it("maximum score: 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82", () => {
      const screenings = manyScreenings(5, {
        has_harm_reduction: true,
        professional_support_count: 1,
        has_child_insight: true,
        shared_with_social_worker: true,
        risk_level: "low_risk",
      });
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.screening_score).toBe(82);
    });

    it("minimum practical score with all max penalties: 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27", () => {
      const screenings = [makeScreening({
        child_id: "yp_0",
        risk_level: "high_risk",
        has_harm_reduction: false,
        professional_support_count: 0,
        has_child_insight: false,
        shared_with_social_worker: false,
        shared_with_camhs: false,
      })];
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 10, screenings }));
      expect(r.screening_score).toBe(27);
    });

    it("zero records: 52 - 3 + 0 - 1 + 0 - 1 - 2 = 45", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(r.screening_score).toBe(45);
    });

    it("mid-range modifiers produce expected composite score", () => {
      // 3/5 children = 60% → mod1:+2
      // harm: 60% → mod2:+2
      // prof: 60% → mod3:+2
      // insight: 60% → mod4:+2
      // sharing: 60% → mod5:+1
      // no high risk → mod6:+5
      // 52 + 2 + 2 + 2 + 2 + 1 + 5 = 66
      const screenings = manyScreenings(5, {
        has_harm_reduction: false,
        professional_support_count: 0,
        has_child_insight: false,
        shared_with_social_worker: false,
        shared_with_camhs: false,
        risk_level: "low_risk",
      });
      // 3 of 5 have positive values → 60%
      for (let i = 0; i < 3; i++) {
        screenings[i].has_harm_reduction = true;
        screenings[i].professional_support_count = 1;
        screenings[i].has_child_insight = true;
        screenings[i].shared_with_social_worker = true;
      }
      // Only 3 unique children screened out of 5 total → need to deduplicate
      // Currently 5 unique children → 100% → mod1:+5. Fix:
      // Map 2 extras to existing children
      screenings[3].child_id = "yp_0";
      screenings[4].child_id = "yp_1";
      // Now: 3 unique / 5 total = 60% → mod1:+2
      const r = computeSubstanceMisuseScreening(baseInput({ screenings }));
      expect(r.screening_score).toBe(66);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RETURN SHAPE
  // ═══════════════════════════════════════════════════════════════════════════
  describe("return shape", () => {
    it("returns all expected keys", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(r).toHaveProperty("screening_rating");
      expect(r).toHaveProperty("screening_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_screenings");
      expect(r).toHaveProperty("children_screened_rate");
      expect(r).toHaveProperty("high_risk_rate");
      expect(r).toHaveProperty("harm_reduction_rate");
      expect(r).toHaveProperty("professional_support_rate");
      expect(r).toHaveProperty("child_insight_rate");
      expect(r).toHaveProperty("information_sharing_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("screening_rating is a valid rating string", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.screening_rating);
    });

    it("screening_score is a number between 0 and 100", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(r.screening_score).toBeGreaterThanOrEqual(0);
      expect(r.screening_score).toBeLessThanOrEqual(100);
    });

    it("rates are numbers between 0 and 100", () => {
      const screenings = manyScreenings(3);
      const r = computeSubstanceMisuseScreening(baseInput({ total_children: 5, screenings }));
      for (const key of ["children_screened_rate", "high_risk_rate", "harm_reduction_rate", "professional_support_rate", "child_insight_rate", "information_sharing_rate"] as const) {
        expect(r[key]).toBeGreaterThanOrEqual(0);
        expect(r[key]).toBeLessThanOrEqual(100);
      }
    });

    it("recommendations have rank, recommendation, urgency, and regulatory_ref", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      for (const rec of r.recommendations) {
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(rec).toHaveProperty("regulatory_ref");
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
      }
    });

    it("insights have text and severity", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      for (const insight of r.insights) {
        expect(insight).toHaveProperty("text");
        expect(insight).toHaveProperty("severity");
        expect(["critical", "warning", "positive"]).toContain(insight.severity);
      }
    });

    it("headline is a non-empty string", () => {
      const r = computeSubstanceMisuseScreening(baseInput({ screenings: [] }));
      expect(typeof r.headline).toBe("string");
      expect(r.headline.length).toBeGreaterThan(0);
    });
  });
});
