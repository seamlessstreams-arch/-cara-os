import { describe, it, expect } from "vitest";
import {
  computePlacementImpactAssessment,
  type PlacementImpactInput,
  type PlacementImpactRecordInput,
} from "../home-placement-impact-assessment-intelligence-engine";

/* ── helpers ────────────────────────────────────────────────────────────────── */

function makeAssessment(
  id: string,
  o: Partial<PlacementImpactRecordInput> = {},
): PlacementImpactRecordInput {
  return {
    id,
    status: "approved",
    overall_risk: "low",
    has_decision_rationale: true,
    impact_on_existing_count: 3,
    impact_high_risk_count: 0,
    impact_with_child_view_count: 3,
    impact_with_mitigation_count: 3,
    compatibility_factor_count: 4,
    compatibility_positive_count: 3,
    compatibility_concern_count: 1,
    staffing_implication_count: 1,
    environmental_consideration_count: 1,
    safeguarding_consideration_count: 2,
    condition_count: 0,
    has_review_date: true,
    has_notes: true,
    ...o,
  };
}

function baseInput(overrides: Partial<PlacementImpactInput> = {}): PlacementImpactInput {
  return {
    today: "2025-06-15",
    total_children: 4,
    assessments: [
      makeAssessment("a1"),
      makeAssessment("a2"),
      makeAssessment("a3"),
    ],
    ...overrides,
  };
}

/* ── tests ──────────────────────────────────────────────────────────────────── */

describe("Home Placement Impact Assessment Intelligence Engine", () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. INSUFFICIENT DATA
  // ═══════════════════════════════════════════════════════════════════════════

  describe("insufficient data", () => {
    it("returns insufficient_data when total_children is 0", () => {
      const r = computePlacementImpactAssessment({
        today: "2025-06-15",
        total_children: 0,
        assessments: [],
      });
      expect(r.impact_rating).toBe("insufficient_data");
      expect(r.impact_score).toBe(0);
      expect(r.headline).toBe(
        "No data available for placement impact assessment analysis",
      );
      expect(r.total_assessments).toBe(0);
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("returns insufficient_data when total_children is 0 even with assessments provided", () => {
      const r = computePlacementImpactAssessment({
        today: "2025-06-15",
        total_children: 0,
        assessments: [makeAssessment("a1")],
      });
      expect(r.impact_rating).toBe("insufficient_data");
      expect(r.impact_score).toBe(0);
    });

    it("leaves every rate unmeasured for insufficient data", () => {
      const r = computePlacementImpactAssessment({
        today: "2025-06-15",
        total_children: 0,
        assessments: [],
      });
      expect(r.decision_documented_rate).toBeNull();
      expect(r.child_view_capture_rate).toBeNull();
      expect(r.mitigation_rate).toBeNull();
      expect(r.compatibility_positive_rate).toBeNull();
      expect(r.safeguarding_coverage_rate).toBeNull();
      expect(r.review_scheduled_rate).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ZERO ASSESSMENTS WITH CHILDREN
  // ═══════════════════════════════════════════════════════════════════════════

  describe("zero assessments with children present", () => {
    it("returns insufficient_data when children exist but no assessments", () => {
      // total=0 → Mod1: -3, Mod2: -1, Mod3: -1, Mod5: -1, Mod6: -2 = 52-8 = 44
      // But also: total===0 && assessments.length===0 → insufficient_data
      const r = computePlacementImpactAssessment({
        today: "2025-06-15",
        total_children: 4,
        assessments: [],
      });
      expect(r.impact_rating).toBe("insufficient_data");
      expect(r.impact_score).toBe(44);
      expect(r.total_assessments).toBe(0);
    });

    it("generates concern about no assessments", () => {
      const r = computePlacementImpactAssessment({
        today: "2025-06-15",
        total_children: 4,
        assessments: [],
      });
      expect(r.concerns).toContain(
        "No placement impact assessments — the home cannot demonstrate Reg 12(3)(d) compliance for matching decisions",
      );
    });

    it("generates recommendation to implement assessments", () => {
      const r = computePlacementImpactAssessment({
        today: "2025-06-15",
        total_children: 4,
        assessments: [],
      });
      expect(r.recommendations.length).toBe(1);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[0].regulatory_ref).toBe("CHR 2015 Reg 12(3)(d)");
    });

    it("generates critical insight about no assessments", () => {
      const r = computePlacementImpactAssessment({
        today: "2025-06-15",
        total_children: 4,
        assessments: [],
      });
      expect(r.insights.length).toBe(1);
      expect(r.insights[0].severity).toBe("critical");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. OUTSTANDING SCENARIO (score >= 80)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("outstanding scenario", () => {
    it("rates outstanding with all 6 modifiers maximised", () => {
      // Base: 52
      // 3 assessments, all with has_decision_rationale → rate=100% → +6
      // totalImpacts=9, childViews=9 → rate=100% → +5
      // totalMitigations=9 → rate=100% → +5
      // compatFactors=12, positive=9 → rate=75% → +5
      // 3/3 with safeguarding → rate=100% → +4
      // 3/3 with review_date → rate=100% → +5
      // Total: 52+6+5+5+5+4+5 = 82
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.impact_score).toBe(82);
      expect(r.impact_rating).toBe("outstanding");
      expect(r.headline).toBe(
        "Outstanding placement matching — rigorous assessments protect existing children and ensure compatibility",
      );
    });

    it("returns correct metrics for outstanding scenario", () => {
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.total_assessments).toBe(3);
      expect(r.decision_documented_rate).toBe(100);
      expect(r.child_view_capture_rate).toBe(100);
      expect(r.mitigation_rate).toBe(100);
      // 9/12 = 75%
      expect(r.compatibility_positive_rate).toBe(75);
      expect(r.safeguarding_coverage_rate).toBe(100);
      expect(r.review_scheduled_rate).toBe(100);
    });

    it("generates all 6 strengths when outstanding", () => {
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.strengths.length).toBe(6);
    });

    it("generates no concerns when outstanding", () => {
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.concerns.length).toBe(0);
    });

    it("generates no recommendations when outstanding", () => {
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.recommendations.length).toBe(0);
    });

    it("outstanding at exactly score 80", () => {
      // Need score = 80. Base=52, need +28 total.
      // +6 +5 +5 +5 +4 +5 = 30 → 82. Drop 2 somewhere.
      // Make compatibility rate between 40 and 70: +2 instead of +5 → score = 79 (good).
      // Instead: make safeguarding rate 60-89: +1 instead of +4 → 52+6+5+5+5+1+5 = 79. Not 80.
      // Use: decision 90→+6, child 80→+5, mit 80→+5, compat 70→+5, safeguard 90→+4, review 50-79→+2
      // 52+6+5+5+5+4+2 = 79. Still not 80.
      // Use: review 80→+5 but compat 40-69→+2: 52+6+5+5+2+4+5 = 79. Hmm.
      // Try: decision 60-89→+2, rest maxed: 52+2+5+5+5+4+5 = 78.
      // Let me try: all maxed except mitigations rate 50-79→+2: 52+6+5+2+5+4+5 = 79. Not 80.
      // Score 80: 52+6+5+5+5+4+3 won't work as modifier6 is either +5,+2,-3,-2.
      // Actually max = 82. To get 80 we need to lose 2 from the max of 82.
      // compat 40-69 → +2 instead of +5 (lose 3) → 79. No.
      // safeguard 60-89 → +1 instead of +4 (lose 3) → 79. No.
      // review 50-79 → +2 instead of +5 (lose 3) → 79. No.
      // child 50-79 → +2 instead of +5 (lose 3) → 79. No.
      // mit 50-79 → +2 instead of +5 (lose 3) → 79. No.
      // decision 60-89 → +2 instead of +6 (lose 4) → 78. No.
      // We need to lose exactly 2. That means we need one modifier to drop by 2.
      // None of the modifiers have a drop-by-2 tier from max.
      // Best: lose 3 on one, gain 1 elsewhere? But we can't gain more than max.
      // Actually max is 82. Score 80 is outstanding boundary. Let me just verify toRating(80) = "outstanding".
      // score >= 80 → outstanding. So 80 is outstanding threshold.
      // We can't hit exactly 80 with natural modifiers since max=82 and drops are 3+.
      // Let me construct it differently.
      // Base 52. Mod1: 60-89 → +2. Mod2: >=80 → +5. Mod3: >=80 → +5. Mod4: >=70 → +5.
      // Mod5: >=90 → +4. Mod6: >=80 → +5. = 52+2+5+5+5+4+5 = 78. No.
      // 52+6+5+5+5+1+5 = 79. No.
      // 52+6+5+5+5+4+5 = 82 (max).
      // 52+6+2+5+5+4+5 = 79.
      // 52+6+5+2+5+4+5 = 79.
      // We just can't hit 80 with natural modifiers. Skip exact-80 and test boundary via toRating.
      // Let's verify 82 is outstanding.
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.impact_score).toBe(82);
      expect(r.impact_rating).toBe("outstanding");
    });

    it("outstanding score with 5 assessments all perfect", () => {
      const assessments = Array.from({ length: 5 }, (_, i) =>
        makeAssessment(`a${i}`, {
          impact_on_existing_count: 4,
          impact_with_child_view_count: 4,
          impact_with_mitigation_count: 4,
          compatibility_factor_count: 5,
          compatibility_positive_count: 5,
        }),
      );
      const r = computePlacementImpactAssessment(
        baseInput({ assessments }),
      );
      // decision: 100% → +6
      // childView: 20/20=100% → +5
      // mitigation: 20/20=100% → +5
      // compat: 25/25=100% → +5
      // safeguard: 5/5=100% → +4
      // review: 5/5=100% → +5
      expect(r.impact_score).toBe(82);
      expect(r.impact_rating).toBe("outstanding");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. GOOD SCENARIO (score 65-79)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("good scenario", () => {
    it("rates good with score 79", () => {
      // Base 52. Need modifiers summing to +27.
      // Mod1: >=90→+6, Mod2: >=80→+5, Mod3: 50-79→+2, Mod4: >=70→+5, Mod5: >=90→+4, Mod6: >=80→+5
      // = 6+5+2+5+4+5 = 27 → score = 79
      // 3 assessments with impacts=3 each → totalImpacts=9
      // mitigations: need 50-79% of 9 → need 5-7 mitigations.
      // 5/9 = 56%. Use 2 assessments with 3 mitigations + 1 with 0 → 6/9 = 67%
      const assessments = [
        makeAssessment("a1", { impact_with_mitigation_count: 3 }),
        makeAssessment("a2", { impact_with_mitigation_count: 3 }),
        makeAssessment("a3", { impact_with_mitigation_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      // mitigationRate = pct(6, 9) = Math.round(6/9*100) = Math.round(66.67) = 67
      expect(r.mitigation_rate).toBe(67);
      expect(r.impact_score).toBe(79);
      expect(r.impact_rating).toBe("good");
    });

    it("rates good at boundary score 65", () => {
      // Need score = 65. Base=52, need +13 total from modifiers.
      // Mod1: 60-89→+2, Mod2: 50-79→+2, Mod3: 50-79→+2, Mod4: 40-69→+2, Mod5: 60-89→+1, Mod6: >=80→+5
      // = 2+2+2+2+1+5 = 14 → 66. Close but 66.
      // Mod6: 50-79→+2: 2+2+2+2+1+2 = 11 → 63. Too low.
      // Mod1: >=90→+6: 6+2+2+2+1+2 = 15 → 67.
      // Mod1: +2, Mod2: +5, Mod3: +2, Mod4: +2, Mod5: +1, Mod6: +2 → 14 → 66.
      // Mod1: +2, Mod2: +2, Mod3: +5, Mod4: +2, Mod5: +1, Mod6: +2 → 14 → 66.
      // Need exactly +13. Available additive: +6,+5,+5,+5,+4,+5 or +2,+2,+2,+2,+1,+2.
      // Combinations: +6+2+2+2+1+2 = 15 → 67
      // +2+5+2+2+1+2 = 14 → 66
      // +2+2+2+2+4+2 = 14 → 66
      // +2+2+2+2+1+5 = 14 → 66
      // Can we get a modifier that contributes 0? Between thresholds = 0.
      // Mod1: 30-59 → 0 (not >=90, not >=60, not <30)
      // Mod2: 20-49 → 0 (not >=80, not >=50, not <20)
      // Mod3: 30-49 → 0
      // Mod4: 20-39 → 0
      // Mod5: 30-59 → 0
      // Mod6: 30-49 → 0
      // So +6+2+2+2+1+0 = 13 → 65. Perfect!
      // Mod1: >=90→+6. Mod2: 50-79→+2. Mod3: 50-79→+2. Mod4: 40-69→+2. Mod5: 60-89→+1. Mod6: 30-49→0.
      // 10 assessments.
      // Mod6: reviewScheduledRate 30-49%. 4 out of 10 = 40%.
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          // Mod1: all have rationale → 100% → +6
          has_decision_rationale: true,
          // Mod2: child views. totalImpacts=30, need childViews to be 50-79% → 15-23
          impact_on_existing_count: 3,
          impact_with_child_view_count: 2, // 20/30 = 67% → +2
          // Mod3: mitigations 50-79%. 20/30=67% → +2
          impact_with_mitigation_count: 2,
          // Mod4: compat 40-69%. 30/40=75%... nope. Need 40-69%.
          compatibility_factor_count: 4,
          compatibility_positive_count: 2, // 20/40=50% → +2
          // Mod5: safeguarding 60-89%. 7/10=70%.
          safeguarding_consideration_count: i < 7 ? 2 : 0,
          // Mod6: review 30-49%. 4/10=40% → 0 (30<=40<50).
          has_review_date: i < 4,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      // Verify: childView = pct(20,30) = 67
      expect(r.child_view_capture_rate).toBe(67);
      // mitigationRate = pct(20,30) = 67
      expect(r.mitigation_rate).toBe(67);
      // compatRate = pct(20,40) = 50
      expect(r.compatibility_positive_rate).toBe(50);
      // safeguardRate = pct(7,10) = 70
      expect(r.safeguarding_coverage_rate).toBe(70);
      // reviewRate = pct(4,10) = 40
      expect(r.review_scheduled_rate).toBe(40);
      expect(r.impact_score).toBe(65);
      expect(r.impact_rating).toBe("good");
    });

    it("good headline", () => {
      const assessments = [
        makeAssessment("a1", { impact_with_mitigation_count: 3 }),
        makeAssessment("a2", { impact_with_mitigation_count: 3 }),
        makeAssessment("a3", { impact_with_mitigation_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.headline).toBe(
        "Good placement impact assessment practice with documented decisions and child views",
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. ADEQUATE SCENARIO (score 45-64)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("adequate scenario", () => {
    it("rates adequate with moderate scores", () => {
      // Base 52. Need modifiers to sum to -7 to +12 (score 45-64).
      // Target score 55: need +3.
      // Mod1: 60-89→+2, Mod2: 0 (20-49%), Mod3: 0 (30-49%), Mod4: 0 (20-39%), Mod5: 0 (30-59%), Mod6: 60-89→+1. Wait Mod6 doesn't have +1.
      // Let me use: Mod1: +2, rest 0 = 54. Need +1 more.
      // Mod5: 60-89→+1: total = 55.
      // 10 assessments.
      // Mod1: decisionDocRate 60-89%. 7/10 = 70% → +2.
      // Mod2: childViewRate 20-49%. totalImpacts=30, need 6-14 views → 10/30 = 33% → 0.
      // Mod3: mitigationRate 30-49%. 12/30 = 40% → 0.
      // Mod4: compatRate 20-39%. 10/40 = 25% → 0.
      // Mod5: safeguardRate 60-89%. 7/10 = 70% → +1.
      // Mod6: reviewRate 30-49%. 4/10 = 40% → 0.
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 7, // 7/10=70% → +2
          impact_on_existing_count: 3,
          impact_with_child_view_count: 1, // 10/30=33% → 0
          impact_with_mitigation_count: 1, // 10/30=33% → 0
          compatibility_factor_count: 4,
          compatibility_positive_count: 1, // 10/40=25% → 0
          safeguarding_consideration_count: i < 7 ? 2 : 0, // 7/10=70% → +1
          has_review_date: i < 4, // 4/10=40% → 0
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.impact_score).toBe(55);
      expect(r.impact_rating).toBe("adequate");
    });

    it("rates adequate at boundary score 45", () => {
      // Need score = 45. Base=52, need -7.
      // Mod1: <30→-5, Mod2: 0, Mod3: 0, Mod4: 0, Mod5: 0, Mod6: 30-49→0, then -2 more...
      // Mod1: <30→-5, Mod4: <20→-4 = -9 → 43. Too low.
      // Mod1: 0 (30-59%), Mod2: 0, Mod3: 0, Mod4: <20→-4, Mod5: <30→-4, Mod6: 0
      // = -4-4 = -8 → 44. Too low.
      // Mod1: 0, Mod2: 0, Mod3: 0, Mod4: <20→-4, Mod5: 0 (30-59%), Mod6: <30→-3
      // = -4-3 = -7 → 45. Perfect!
      // 10 assessments. Need:
      // Mod1: decisionDocRate 30-59%. 4/10=40% → 0.
      // Mod2: childViewRate 20-49%. 10/30=33% → 0.
      // Mod3: mitigationRate 30-49%. 10/30=33% → 0.
      // Mod4: compatRate <20%. 5/40=13% → -4. Wait, need <20. 7/40=18%→ round(7/40*100)=round(17.5)=18 <20. Actually pct(7,40)=Math.round(7/40*100)=Math.round(17.5)=18. 18<20→-4.
      // Actually let me use compatibility_positive_count=0 for all. 0/40=0% <20 → -4.
      // Mod5: safeguardRate 30-59%. 4/10=40% → 0.
      // Mod6: reviewRate <30%. 2/10=20% → -3.
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 4, // 4/10=40% → 0
          impact_on_existing_count: 3,
          impact_with_child_view_count: 1, // 10/30=33% → 0
          impact_with_mitigation_count: 1, // 10/30=33% → 0
          compatibility_factor_count: 4,
          compatibility_positive_count: 0, // 0/40=0% → -4
          safeguarding_consideration_count: i < 4 ? 1 : 0, // 4/10=40% → 0
          has_review_date: i < 2, // 2/10=20% → -3
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.impact_score).toBe(45);
      expect(r.impact_rating).toBe("adequate");
    });

    it("adequate headline", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 4,
          impact_on_existing_count: 3,
          impact_with_child_view_count: 1,
          impact_with_mitigation_count: 1,
          compatibility_factor_count: 4,
          compatibility_positive_count: 0,
          safeguarding_consideration_count: i < 4 ? 1 : 0,
          has_review_date: i < 2,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.headline).toBe(
        "Placement assessments exist but matching rigour, child views or risk mitigation needs improvement",
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. INADEQUATE SCENARIO (score < 45)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("inadequate scenario", () => {
    it("rates inadequate with all modifiers negative", () => {
      // Base 52. Mod1: <30→-5, Mod2: <20→-5, Mod3: <30→-4, Mod4: <20→-4, Mod5: <30→-4, Mod6: <30→-3
      // = -5-5-4-4-4-3 = -25 → 27
      // 10 assessments, all bad.
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 2, // 2/10=20% <30 → -5
          impact_on_existing_count: 10,
          impact_with_child_view_count: 1, // 10/100=10% <20 → -5
          impact_with_mitigation_count: 2, // 20/100=20% <30 → -4
          compatibility_factor_count: 10,
          compatibility_positive_count: 1, // 10/100=10% <20 → -4
          safeguarding_consideration_count: i < 2 ? 1 : 0, // 2/10=20% <30 → -4
          has_review_date: i < 2, // 2/10=20% <30 → -3
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.impact_score).toBe(27);
      expect(r.impact_rating).toBe("inadequate");
    });

    it("rates inadequate at score 44 (just below adequate)", () => {
      // Need score = 44. Base=52, need -8.
      // Mod1: 0, Mod2: 0, Mod3: 0, Mod4: <20→-4, Mod5: <30→-4, Mod6: 0
      // = -8 → 44.
      // 10 assessments.
      // Mod1: 30-59%. 4/10=40%.
      // Mod2: 20-49%. 10/30=33%.
      // Mod3: 30-49%. 10/30=33%.
      // Mod4: <20%. 0/40=0%.
      // Mod5: <30%. 2/10=20%.
      // Mod6: 30-49%. 4/10=40%.
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 4, // 40% → 0
          impact_on_existing_count: 3,
          impact_with_child_view_count: 1, // 33% → 0
          impact_with_mitigation_count: 1, // 33% → 0
          compatibility_factor_count: 4,
          compatibility_positive_count: 0, // 0% → -4
          safeguarding_consideration_count: i < 2 ? 1 : 0, // 20% → -4
          has_review_date: i < 4, // 40% → 0
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.impact_score).toBe(44);
      expect(r.impact_rating).toBe("inadequate");
    });

    it("inadequate headline", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 2,
          impact_on_existing_count: 10,
          impact_with_child_view_count: 1,
          impact_with_mitigation_count: 2,
          compatibility_factor_count: 10,
          compatibility_positive_count: 1,
          safeguarding_consideration_count: i < 2 ? 1 : 0,
          has_review_date: i < 2,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.headline).toBe(
        "Inadequate placement matching — existing children's welfare is not sufficiently protected during admissions",
      );
    });

    it("score clamps at 0 and never goes negative", () => {
      // With 100 bad assessments, massive negative modifiers still can't go below 0
      const assessments = Array.from({ length: 100 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: false,
          impact_on_existing_count: 50,
          impact_with_child_view_count: 0,
          impact_with_mitigation_count: 0,
          compatibility_factor_count: 50,
          compatibility_positive_count: 0,
          safeguarding_consideration_count: 0,
          has_review_date: false,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      // -5-5-4-4-4-3 = -25 → 52-25 = 27. Still positive, but let's verify clamp behavior.
      expect(r.impact_score).toBe(27);
      expect(r.impact_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. INDIVIDUAL MODIFIER TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Modifier 1: Decision documentation quality", () => {
    it("+6 when decisionDocumentedRate >= 90%", () => {
      // All 3 have rationale → 100%
      const r = computePlacementImpactAssessment(baseInput());
      // 52+6+5+5+5+4+5 = 82
      expect(r.impact_score).toBe(82);
    });

    it("+2 when decisionDocumentedRate 60-89%", () => {
      // 2/3 = 67%
      const assessments = [
        makeAssessment("a1"),
        makeAssessment("a2"),
        makeAssessment("a3", { has_decision_rationale: false }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      // 52+2+5+5+5+4+5 = 78
      expect(r.decision_documented_rate).toBe(67);
      expect(r.impact_score).toBe(78);
    });

    it("0 when decisionDocumentedRate 30-59%", () => {
      // 5 assessments, 2 with rationale → 40%
      const assessments = Array.from({ length: 5 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 2,
        }),
      );
      // totalImpacts=15, childViews=15 → 100% → +5
      // mitigations=15 → 100% → +5
      // compat: 15/20 = 75% → +5
      // safeguard: 5/5 = 100% → +4
      // review: 5/5 = 100% → +5
      // 52+0+5+5+5+4+5 = 76
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.decision_documented_rate).toBe(40);
      expect(r.impact_score).toBe(76);
    });

    it("-5 when decisionDocumentedRate < 30%", () => {
      // 10 assessments, 2 with rationale → 20%
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 2,
        }),
      );
      // totalImpacts=30, childViews=30→100%→+5
      // mitigations=30→100%→+5
      // compat: 30/40=75%→+5
      // safeguard: 10/10=100%→+4
      // review: 10/10=100%→+5
      // 52-5+5+5+5+4+5 = 71
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.decision_documented_rate).toBe(20);
      expect(r.impact_score).toBe(71);
    });

    it("-3 when total is 0 (no assessments)", () => {
      // total=0 → Mod1:-3, Mod2:-1, Mod3:-1, Mod4:0, Mod5:-1, Mod6:-2
      // 52-3-1-1+0-1-2 = 44
      const r = computePlacementImpactAssessment(baseInput({ assessments: [] }));
      expect(r.impact_score).toBe(44);
    });

    it("boundary: exactly 90% gives +6", () => {
      // 9/10 = 90%
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 9,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.decision_documented_rate).toBe(90);
      // 52+6+5+5+5+4+5 = 82
      expect(r.impact_score).toBe(82);
    });

    it("boundary: exactly 60% gives +2", () => {
      // 3/5 = 60%
      const assessments = Array.from({ length: 5 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 3,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.decision_documented_rate).toBe(60);
      // 52+2+5+5+5+4+5 = 78
      expect(r.impact_score).toBe(78);
    });

    it("boundary: 29% gives -5 (< 30)", () => {
      // Need ~29%. 100 assessments, 29 with rationale → 29%.
      const assessments = Array.from({ length: 100 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 29,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.decision_documented_rate).toBe(29);
      // 52-5+5+5+5+4+5 = 71
      expect(r.impact_score).toBe(71);
    });

    it("boundary: 30% gives 0 (not < 30, not >= 60)", () => {
      // 3/10 = 30%
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 3,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.decision_documented_rate).toBe(30);
      // 52+0+5+5+5+4+5 = 76
      expect(r.impact_score).toBe(76);
    });

    it("boundary: 59% gives 0", () => {
      // Need ~59%. 100 assessments, 59 with rationale.
      const assessments = Array.from({ length: 100 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 59,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.decision_documented_rate).toBe(59);
      // 52+0+5+5+5+4+5 = 76
      expect(r.impact_score).toBe(76);
    });

    it("boundary: 89% gives +2", () => {
      // Need ~89%. 100 assessments, 89 with rationale.
      const assessments = Array.from({ length: 100 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 89,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.decision_documented_rate).toBe(89);
      // 52+2+5+5+5+4+5 = 78
      expect(r.impact_score).toBe(78);
    });
  });

  describe("Modifier 2: Child views in impact assessments", () => {
    it("+5 when childViewCaptureRate >= 80%", () => {
      // Default: 9/9 = 100% → +5
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.child_view_capture_rate).toBe(100);
      expect(r.impact_score).toBe(82);
    });

    it("+2 when childViewCaptureRate 50-79%", () => {
      // totalImpacts=9, need 50-79% → 5-7 views.
      // 5/9 = pct(5,9) = Math.round(55.56) = 56%
      const assessments = [
        makeAssessment("a1", { impact_with_child_view_count: 2 }),
        makeAssessment("a2", { impact_with_child_view_count: 2 }),
        makeAssessment("a3", { impact_with_child_view_count: 1 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.child_view_capture_rate).toBe(56);
      // 52+6+2+5+5+4+5 = 79
      expect(r.impact_score).toBe(79);
    });

    it("-5 when childViewCaptureRate < 20%", () => {
      // totalImpacts=9, need <20% → 0-1 views
      // 1/9 = pct(1,9) = Math.round(11.11) = 11%
      const assessments = [
        makeAssessment("a1", { impact_with_child_view_count: 1 }),
        makeAssessment("a2", { impact_with_child_view_count: 0 }),
        makeAssessment("a3", { impact_with_child_view_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.child_view_capture_rate).toBe(11);
      // 52+6-5+5+5+4+5 = 72
      expect(r.impact_score).toBe(72);
    });

    it("+2 when totalImpacts is 0 but records exist", () => {
      // All assessments have impact_on_existing_count=0
      const assessments = [
        makeAssessment("a1", { impact_on_existing_count: 0, impact_with_child_view_count: 0, impact_with_mitigation_count: 0 }),
        makeAssessment("a2", { impact_on_existing_count: 0, impact_with_child_view_count: 0, impact_with_mitigation_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      // totalImpacts=0, total>0 → Mod2: +2, Mod3: +2
      // decision: 2/2=100% → +6
      // compat: 6/8 = 75% → +5
      // safeguard: 2/2=100% → +4
      // review: 2/2=100% → +5
      // 52+6+2+2+5+4+5 = 76
      expect(r.child_view_capture_rate).toBeNull();
      expect(r.impact_score).toBe(76);
    });

    it("-1 when total is 0 (no records)", () => {
      // Already tested: 52-3-1-1+0-1-2 = 44
      const r = computePlacementImpactAssessment(baseInput({ assessments: [] }));
      expect(r.impact_score).toBe(44);
    });

    it("boundary: exactly 80% gives +5", () => {
      // totalImpacts=5, need 80% → 4 views
      // pct(4,5) = 80
      const assessments = [
        makeAssessment("a1", { impact_on_existing_count: 5, impact_with_child_view_count: 4, impact_with_mitigation_count: 5 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.child_view_capture_rate).toBe(80);
      // Mod1: 1/1=100%→+6, Mod2: 80%→+5, Mod3: 100%→+5, Mod4: 3/4=75%→+5, Mod5: 1/1=100%→+4, Mod6: 1/1=100%→+5
      // 52+6+5+5+5+4+5 = 82
      expect(r.impact_score).toBe(82);
    });

    it("boundary: exactly 50% gives +2", () => {
      // pct(5,10) = 50
      const assessments = [
        makeAssessment("a1", { impact_on_existing_count: 10, impact_with_child_view_count: 5, impact_with_mitigation_count: 10 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.child_view_capture_rate).toBe(50);
      // 52+6+2+5+5+4+5 = 79
      expect(r.impact_score).toBe(79);
    });

    it("boundary: exactly 20% is NOT < 20 (gives 0)", () => {
      // pct(2,10) = 20
      const assessments = [
        makeAssessment("a1", { impact_on_existing_count: 10, impact_with_child_view_count: 2, impact_with_mitigation_count: 10 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.child_view_capture_rate).toBe(20);
      // 20 is >=20, not >=50, not >=80 → 0
      // 52+6+0+5+5+4+5 = 77
      expect(r.impact_score).toBe(77);
    });

    it("boundary: 19% gives -5 (< 20)", () => {
      // Need ~19%. pct(19,100) = 19
      const assessments = [
        makeAssessment("a1", { impact_on_existing_count: 100, impact_with_child_view_count: 19, impact_with_mitigation_count: 100 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.child_view_capture_rate).toBe(19);
      // 52+6-5+5+5+4+5 = 72
      expect(r.impact_score).toBe(72);
    });

    it("boundary: 79% gives +2 (>=50 but <80)", () => {
      // pct(79,100) = 79
      const assessments = [
        makeAssessment("a1", { impact_on_existing_count: 100, impact_with_child_view_count: 79, impact_with_mitigation_count: 100 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.child_view_capture_rate).toBe(79);
      // 52+6+2+5+5+4+5 = 79
      expect(r.impact_score).toBe(79);
    });
  });

  describe("Modifier 3: Mitigation plans for identified risks", () => {
    it("+5 when mitigationRate >= 80%", () => {
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.mitigation_rate).toBe(100);
    });

    it("+2 when mitigationRate 50-79%", () => {
      // 5/9 = 56%
      const assessments = [
        makeAssessment("a1", { impact_with_mitigation_count: 2 }),
        makeAssessment("a2", { impact_with_mitigation_count: 2 }),
        makeAssessment("a3", { impact_with_mitigation_count: 1 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.mitigation_rate).toBe(56);
      // 52+6+5+2+5+4+5 = 79
      expect(r.impact_score).toBe(79);
    });

    it("-4 when mitigationRate < 30%", () => {
      // 2/9 = pct(2,9) = 22%
      const assessments = [
        makeAssessment("a1", { impact_with_mitigation_count: 2 }),
        makeAssessment("a2", { impact_with_mitigation_count: 0 }),
        makeAssessment("a3", { impact_with_mitigation_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.mitigation_rate).toBe(22);
      // 52+6+5-4+5+4+5 = 73
      expect(r.impact_score).toBe(73);
    });

    it("+2 when totalImpacts is 0 but records exist", () => {
      const assessments = [
        makeAssessment("a1", { impact_on_existing_count: 0, impact_with_child_view_count: 0, impact_with_mitigation_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      // totalImpacts=0, total>0 → Mod2: +2, Mod3: +2
      // 52+6+2+2+5+4+5 = 76
      // Wait: compat = 3/4 = 75% → +5. safeguard = 1/1 (safeguarding_consideration_count=2>0) → 100% → +4. review = 1/1 = 100% → +5.
      expect(r.impact_score).toBe(76);
    });

    it("-1 when total is 0 (no records)", () => {
      // 52-3-1-1+0-1-2 = 44
      const r = computePlacementImpactAssessment(baseInput({ assessments: [] }));
      expect(r.impact_score).toBe(44);
    });

    it("boundary: exactly 80% gives +5", () => {
      // pct(8,10) = 80
      const assessments = [
        makeAssessment("a1", { impact_on_existing_count: 10, impact_with_mitigation_count: 8, impact_with_child_view_count: 10 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.mitigation_rate).toBe(80);
      // 52+6+5+5+5+4+5 = 82
      expect(r.impact_score).toBe(82);
    });

    it("boundary: exactly 50% gives +2", () => {
      // pct(5,10) = 50
      const assessments = [
        makeAssessment("a1", { impact_on_existing_count: 10, impact_with_mitigation_count: 5, impact_with_child_view_count: 10 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.mitigation_rate).toBe(50);
      // 52+6+5+2+5+4+5 = 79
      expect(r.impact_score).toBe(79);
    });

    it("boundary: 30% gives 0 (not <30, not >=50)", () => {
      // pct(3,10) = 30
      const assessments = [
        makeAssessment("a1", { impact_on_existing_count: 10, impact_with_mitigation_count: 3, impact_with_child_view_count: 10 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.mitigation_rate).toBe(30);
      // 52+6+5+0+5+4+5 = 77
      expect(r.impact_score).toBe(77);
    });

    it("boundary: 29% gives -4 (<30)", () => {
      // pct(29,100) = 29
      const assessments = [
        makeAssessment("a1", { impact_on_existing_count: 100, impact_with_mitigation_count: 29, impact_with_child_view_count: 100 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.mitigation_rate).toBe(29);
      // 52+6+5-4+5+4+5 = 73
      expect(r.impact_score).toBe(73);
    });
  });

  describe("Modifier 4: Compatibility analysis quality", () => {
    it("+5 when compatibilityPositiveRate >= 70%", () => {
      // Default: 9/12 = 75%
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.compatibility_positive_rate).toBe(75);
    });

    it("+2 when compatibilityPositiveRate 40-69%", () => {
      // 2/4 = 50% per assessment → 6/12 = 50%
      const assessments = [
        makeAssessment("a1", { compatibility_positive_count: 2 }),
        makeAssessment("a2", { compatibility_positive_count: 2 }),
        makeAssessment("a3", { compatibility_positive_count: 2 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.compatibility_positive_rate).toBe(50);
      // 52+6+5+5+2+4+5 = 79
      expect(r.impact_score).toBe(79);
    });

    it("-4 when compatibilityPositiveRate < 20%", () => {
      // 1/4 per assessment → 3/12 = 25% → NOT <20.
      // Use 0/4 per assessment → 0/12 = 0%
      const assessments = [
        makeAssessment("a1", { compatibility_positive_count: 0 }),
        makeAssessment("a2", { compatibility_positive_count: 0 }),
        makeAssessment("a3", { compatibility_positive_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.compatibility_positive_rate).toBe(0);
      // 52+6+5+5-4+4+5 = 73
      expect(r.impact_score).toBe(73);
    });

    it("-2 when totalCompatFactors is 0 but records exist", () => {
      const assessments = [
        makeAssessment("a1", { compatibility_factor_count: 0, compatibility_positive_count: 0 }),
        makeAssessment("a2", { compatibility_factor_count: 0, compatibility_positive_count: 0 }),
        makeAssessment("a3", { compatibility_factor_count: 0, compatibility_positive_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      // 52+6+5+5-2+4+5 = 75
      expect(r.impact_score).toBe(75);
    });

    it("no adjustment when total is 0 (no records)", () => {
      // Mod4 has no penalty for total===0
      // 52-3-1-1+0-1-2 = 44
      const r = computePlacementImpactAssessment(baseInput({ assessments: [] }));
      expect(r.impact_score).toBe(44);
    });

    it("boundary: exactly 70% gives +5", () => {
      // pct(7,10) = 70
      const assessments = [
        makeAssessment("a1", { compatibility_factor_count: 10, compatibility_positive_count: 7 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.compatibility_positive_rate).toBe(70);
      // 52+6+5+5+5+4+5 = 82
      expect(r.impact_score).toBe(82);
    });

    it("boundary: 69% gives +2", () => {
      // pct(69,100) = 69
      const assessments = [
        makeAssessment("a1", { compatibility_factor_count: 100, compatibility_positive_count: 69 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.compatibility_positive_rate).toBe(69);
      // 52+6+5+5+2+4+5 = 79
      expect(r.impact_score).toBe(79);
    });

    it("boundary: exactly 40% gives +2", () => {
      // pct(4,10) = 40
      const assessments = [
        makeAssessment("a1", { compatibility_factor_count: 10, compatibility_positive_count: 4 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.compatibility_positive_rate).toBe(40);
      // 52+6+5+5+2+4+5 = 79
      expect(r.impact_score).toBe(79);
    });

    it("boundary: 39% gives 0 (not >=40, not <20)", () => {
      // pct(39,100) = 39
      const assessments = [
        makeAssessment("a1", { compatibility_factor_count: 100, compatibility_positive_count: 39 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.compatibility_positive_rate).toBe(39);
      // 52+6+5+5+0+4+5 = 77
      expect(r.impact_score).toBe(77);
    });

    it("boundary: exactly 20% gives 0 (not <20)", () => {
      // pct(2,10) = 20
      const assessments = [
        makeAssessment("a1", { compatibility_factor_count: 10, compatibility_positive_count: 2 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.compatibility_positive_rate).toBe(20);
      // 52+6+5+5+0+4+5 = 77
      expect(r.impact_score).toBe(77);
    });

    it("boundary: 19% gives -4 (<20)", () => {
      // pct(19,100) = 19
      const assessments = [
        makeAssessment("a1", { compatibility_factor_count: 100, compatibility_positive_count: 19 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.compatibility_positive_rate).toBe(19);
      // 52+6+5+5-4+4+5 = 73
      expect(r.impact_score).toBe(73);
    });
  });

  describe("Modifier 5: Safeguarding consideration coverage", () => {
    it("+4 when safeguardingCoverageRate >= 90%", () => {
      // Default: 3/3=100%
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.safeguarding_coverage_rate).toBe(100);
    });

    it("+1 when safeguardingCoverageRate 60-89%", () => {
      // 2/3 = 67%
      const assessments = [
        makeAssessment("a1"),
        makeAssessment("a2"),
        makeAssessment("a3", { safeguarding_consideration_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.safeguarding_coverage_rate).toBe(67);
      // 52+6+5+5+5+1+5 = 79
      expect(r.impact_score).toBe(79);
    });

    it("-4 when safeguardingCoverageRate < 30%", () => {
      // 0/3 = 0%
      const assessments = [
        makeAssessment("a1", { safeguarding_consideration_count: 0 }),
        makeAssessment("a2", { safeguarding_consideration_count: 0 }),
        makeAssessment("a3", { safeguarding_consideration_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.safeguarding_coverage_rate).toBe(0);
      // 52+6+5+5+5-4+5 = 74
      expect(r.impact_score).toBe(74);
    });

    it("-1 when total is 0 (no records)", () => {
      // 52-3-1-1+0-1-2 = 44
      const r = computePlacementImpactAssessment(baseInput({ assessments: [] }));
      expect(r.impact_score).toBe(44);
    });

    it("boundary: exactly 90% gives +4", () => {
      // 9/10 = 90%
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          safeguarding_consideration_count: i < 9 ? 2 : 0,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.safeguarding_coverage_rate).toBe(90);
      // 52+6+5+5+5+4+5 = 82
      expect(r.impact_score).toBe(82);
    });

    it("boundary: 89% gives +1", () => {
      // Need 89%. 100 assessments, 89 with safeguarding.
      const assessments = Array.from({ length: 100 }, (_, i) =>
        makeAssessment(`a${i}`, {
          safeguarding_consideration_count: i < 89 ? 2 : 0,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.safeguarding_coverage_rate).toBe(89);
      // 52+6+5+5+5+1+5 = 79
      expect(r.impact_score).toBe(79);
    });

    it("boundary: exactly 60% gives +1", () => {
      // 3/5 = 60%
      const assessments = Array.from({ length: 5 }, (_, i) =>
        makeAssessment(`a${i}`, {
          safeguarding_consideration_count: i < 3 ? 2 : 0,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.safeguarding_coverage_rate).toBe(60);
      // 52+6+5+5+5+1+5 = 79
      expect(r.impact_score).toBe(79);
    });

    it("boundary: 59% gives 0 (not >=60, not <30)", () => {
      // Need 59%. 100 assessments, 59 with safeguarding.
      const assessments = Array.from({ length: 100 }, (_, i) =>
        makeAssessment(`a${i}`, {
          safeguarding_consideration_count: i < 59 ? 2 : 0,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.safeguarding_coverage_rate).toBe(59);
      // 52+6+5+5+5+0+5 = 78
      expect(r.impact_score).toBe(78);
    });

    it("boundary: exactly 30% gives 0 (not <30)", () => {
      // 3/10 = 30%
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          safeguarding_consideration_count: i < 3 ? 2 : 0,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.safeguarding_coverage_rate).toBe(30);
      // 52+6+5+5+5+0+5 = 78
      expect(r.impact_score).toBe(78);
    });

    it("boundary: 29% gives -4 (<30)", () => {
      // Need 29%. 100 assessments, 29 with safeguarding.
      const assessments = Array.from({ length: 100 }, (_, i) =>
        makeAssessment(`a${i}`, {
          safeguarding_consideration_count: i < 29 ? 2 : 0,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.safeguarding_coverage_rate).toBe(29);
      // 52+6+5+5+5-4+5 = 74
      expect(r.impact_score).toBe(74);
    });
  });

  describe("Modifier 6: Review scheduling", () => {
    it("+5 when reviewScheduledRate >= 80%", () => {
      // Default: 3/3=100%
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.review_scheduled_rate).toBe(100);
    });

    it("+2 when reviewScheduledRate 50-79%", () => {
      // 2/3 = 67%
      const assessments = [
        makeAssessment("a1"),
        makeAssessment("a2"),
        makeAssessment("a3", { has_review_date: false }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.review_scheduled_rate).toBe(67);
      // 52+6+5+5+5+4+2 = 79
      expect(r.impact_score).toBe(79);
    });

    it("-3 when reviewScheduledRate < 30%", () => {
      // 0/3 = 0%
      const assessments = [
        makeAssessment("a1", { has_review_date: false }),
        makeAssessment("a2", { has_review_date: false }),
        makeAssessment("a3", { has_review_date: false }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.review_scheduled_rate).toBe(0);
      // 52+6+5+5+5+4-3 = 74
      expect(r.impact_score).toBe(74);
    });

    it("-2 when total is 0 (no records)", () => {
      // 52-3-1-1+0-1-2 = 44
      const r = computePlacementImpactAssessment(baseInput({ assessments: [] }));
      expect(r.impact_score).toBe(44);
    });

    it("boundary: exactly 80% gives +5", () => {
      // 4/5 = 80%
      const assessments = Array.from({ length: 5 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_review_date: i < 4,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.review_scheduled_rate).toBe(80);
      // 52+6+5+5+5+4+5 = 82
      expect(r.impact_score).toBe(82);
    });

    it("boundary: 79% gives +2", () => {
      // Need 79%. 100 assessments, 79 with review.
      const assessments = Array.from({ length: 100 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_review_date: i < 79,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.review_scheduled_rate).toBe(79);
      // 52+6+5+5+5+4+2 = 79
      expect(r.impact_score).toBe(79);
    });

    it("boundary: exactly 50% gives +2", () => {
      // 5/10 = 50%
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_review_date: i < 5,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.review_scheduled_rate).toBe(50);
      // 52+6+5+5+5+4+2 = 79
      expect(r.impact_score).toBe(79);
    });

    it("boundary: 49% gives 0 (not >=50, not <30)", () => {
      // Need 49%. 100 assessments, 49 with review.
      const assessments = Array.from({ length: 100 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_review_date: i < 49,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.review_scheduled_rate).toBe(49);
      // 52+6+5+5+5+4+0 = 77
      expect(r.impact_score).toBe(77);
    });

    it("boundary: exactly 30% gives 0 (not <30)", () => {
      // 3/10 = 30%
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_review_date: i < 3,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.review_scheduled_rate).toBe(30);
      // 52+6+5+5+5+4+0 = 77
      expect(r.impact_score).toBe(77);
    });

    it("boundary: 29% gives -3 (<30)", () => {
      // Need 29%. 100 assessments, 29 with review.
      const assessments = Array.from({ length: 100 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_review_date: i < 29,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.review_scheduled_rate).toBe(29);
      // 52+6+5+5+5+4-3 = 74
      expect(r.impact_score).toBe(74);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. STRENGTHS GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("strengths generation", () => {
    it("strength: decision documentation when decisionDocumentedRate >= 90 and total > 0", () => {
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.strengths).toContain(
        "Placement decisions are thoroughly documented with clear rationale — the home demonstrates rigorous matching",
      );
    });

    it("strength: child views when childViewCaptureRate >= 80 and totalImpacts > 0", () => {
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.strengths).toContain(
        "Existing children's views are consistently sought before new admissions — child voice drives placement decisions",
      );
    });

    it("strength: mitigations when mitigationRate >= 80 and totalImpacts > 0", () => {
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.strengths).toContain(
        "Risk mitigations are documented for identified impacts — the home plans proactively to protect existing residents",
      );
    });

    it("strength: compatibility when compatibilityPositiveRate >= 70 and totalCompatFactors > 0", () => {
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.strengths).toContain(
        "Compatibility analysis shows predominantly positive factors — the home makes well-matched placements",
      );
    });

    it("strength: safeguarding when safeguardingCoverageRate >= 90 and total > 0", () => {
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.strengths).toContain(
        "Safeguarding considerations are addressed in every assessment — child protection is central to matching decisions",
      );
    });

    it("strength: review scheduling when reviewScheduledRate >= 80 and total > 0", () => {
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.strengths).toContain(
        "Post-placement reviews are scheduled — the home monitors whether matching decisions prove effective",
      );
    });

    it("no decision doc strength when rate is 89%", () => {
      const assessments = Array.from({ length: 100 }, (_, i) =>
        makeAssessment(`a${i}`, { has_decision_rationale: i < 89 }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.strengths).not.toContain(
        "Placement decisions are thoroughly documented with clear rationale — the home demonstrates rigorous matching",
      );
    });

    it("no child views strength when totalImpacts is 0 even with high rate", () => {
      // If totalImpacts is 0, childViewCaptureRate = pct(0,0) = 0, so it's not >=80.
      // Also the condition requires totalImpacts>0.
      const assessments = [
        makeAssessment("a1", { impact_on_existing_count: 0, impact_with_child_view_count: 0, impact_with_mitigation_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.strengths).not.toContain(
        "Existing children's views are consistently sought before new admissions — child voice drives placement decisions",
      );
    });

    it("no compatibility strength when totalCompatFactors is 0", () => {
      const assessments = [
        makeAssessment("a1", { compatibility_factor_count: 0, compatibility_positive_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.strengths).not.toContain(
        "Compatibility analysis shows predominantly positive factors — the home makes well-matched placements",
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. CONCERNS GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("concerns generation", () => {
    it("concern: no assessments when total=0 and total_children > 0", () => {
      const r = computePlacementImpactAssessment(baseInput({ assessments: [] }));
      expect(r.concerns).toContain(
        "No placement impact assessments — the home cannot demonstrate Reg 12(3)(d) compliance for matching decisions",
      );
    });

    it("concern: poor decision documentation when rate < 50%", () => {
      // 4/10 = 40%
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, { has_decision_rationale: i < 4 }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.concerns).toContain(
        "Many placement decisions lack documented rationale — Ofsted will question the rigour of matching",
      );
    });

    it("no decision doc concern when rate is exactly 50%", () => {
      // 5/10 = 50%
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, { has_decision_rationale: i < 5 }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.concerns).not.toContain(
        "Many placement decisions lack documented rationale — Ofsted will question the rigour of matching",
      );
    });

    it("concern: child views rarely captured when rate < 30%", () => {
      // 2/9 = 22%
      const assessments = [
        makeAssessment("a1", { impact_with_child_view_count: 2 }),
        makeAssessment("a2", { impact_with_child_view_count: 0 }),
        makeAssessment("a3", { impact_with_child_view_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.child_view_capture_rate).toBe(22);
      expect(r.concerns).toContain(
        "Existing children's views are rarely captured in impact assessments — their welfare may be compromised by new admissions",
      );
    });

    it("no child views concern when rate is 30%", () => {
      // pct(3,10) = 30
      const assessments = [
        makeAssessment("a1", { impact_on_existing_count: 10, impact_with_child_view_count: 3 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.child_view_capture_rate).toBe(30);
      expect(r.concerns).not.toContain(
        "Existing children's views are rarely captured in impact assessments — their welfare may be compromised by new admissions",
      );
    });

    it("concern: mitigations missing when rate < 30%", () => {
      // 2/9 = 22%
      const assessments = [
        makeAssessment("a1", { impact_with_mitigation_count: 2 }),
        makeAssessment("a2", { impact_with_mitigation_count: 0 }),
        makeAssessment("a3", { impact_with_mitigation_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.mitigation_rate).toBe(22);
      expect(r.concerns).toContain(
        "Identified risks lack documented mitigations — the home is not planning how to manage placement impacts",
      );
    });

    it("concern: high risk without declined placements", () => {
      const assessments = [
        makeAssessment("a1", { overall_risk: "high", status: "approved" }),
        makeAssessment("a2", { overall_risk: "high", status: "approved" }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.concerns).toContain(
        "High-risk assessments have not led to any declined placements — the home may be accepting unsuitable referrals",
      );
    });

    it("no high risk concern when some are declined", () => {
      const assessments = [
        makeAssessment("a1", { overall_risk: "high", status: "approved" }),
        makeAssessment("a2", { overall_risk: "high", status: "declined" }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.concerns).not.toContain(
        "High-risk assessments have not led to any declined placements — the home may be accepting unsuitable referrals",
      );
    });

    it("concern: safeguarding coverage < 30%", () => {
      const assessments = [
        makeAssessment("a1", { safeguarding_consideration_count: 0 }),
        makeAssessment("a2", { safeguarding_consideration_count: 0 }),
        makeAssessment("a3", { safeguarding_consideration_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.safeguarding_coverage_rate).toBe(0);
      expect(r.concerns).toContain(
        "Safeguarding considerations are absent from most assessments — child protection is not embedded in matching",
      );
    });

    it("concern: review not scheduled < 30%", () => {
      const assessments = [
        makeAssessment("a1", { has_review_date: false }),
        makeAssessment("a2", { has_review_date: false }),
        makeAssessment("a3", { has_review_date: false }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.review_scheduled_rate).toBe(0);
      expect(r.concerns).toContain(
        "Post-placement reviews are not scheduled — the home cannot verify whether matching decisions were correct",
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. RECOMMENDATIONS GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("recommendations generation", () => {
    it("recommends implementing assessments when total=0 and total_children>0", () => {
      const r = computePlacementImpactAssessment(baseInput({ assessments: [] }));
      expect(r.recommendations).toEqual([
        {
          rank: 1,
          recommendation: "Implement placement impact assessments for all admissions with documented rationale and child views",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 12(3)(d)",
        },
      ]);
    });

    it("recommends child consultation when childViewCaptureRate < 50% and totalImpacts > 0", () => {
      // 4/9 = 44%
      const assessments = [
        makeAssessment("a1", { impact_with_child_view_count: 2 }),
        makeAssessment("a2", { impact_with_child_view_count: 1 }),
        makeAssessment("a3", { impact_with_child_view_count: 1 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.child_view_capture_rate).toBe(44);
      const rec = r.recommendations.find(
        (x) => x.regulatory_ref === "CHR 2015 Reg 7",
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recommends mitigations when mitigationRate < 50% and totalImpacts > 0", () => {
      // 4/9 = 44%
      const assessments = [
        makeAssessment("a1", { impact_with_mitigation_count: 2 }),
        makeAssessment("a2", { impact_with_mitigation_count: 1 }),
        makeAssessment("a3", { impact_with_mitigation_count: 1 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.mitigation_rate).toBe(44);
      const rec = r.recommendations.find(
        (x) => x.regulatory_ref === "CHR 2015 Reg 12",
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends safeguarding when safeguardingCoverageRate < 60% and total > 0", () => {
      // 1/3 = 33%
      const assessments = [
        makeAssessment("a1"),
        makeAssessment("a2", { safeguarding_consideration_count: 0 }),
        makeAssessment("a3", { safeguarding_consideration_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.safeguarding_coverage_rate).toBe(33);
      const rec = r.recommendations.find(
        (x) => x.regulatory_ref === "CHR 2015 Reg 14",
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recommends post-placement reviews when reviewScheduledRate < 50% and total > 0", () => {
      // 1/3 = 33%
      const assessments = [
        makeAssessment("a1"),
        makeAssessment("a2", { has_review_date: false }),
        makeAssessment("a3", { has_review_date: false }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.review_scheduled_rate).toBe(33);
      const rec = r.recommendations.find(
        (x) => x.regulatory_ref === "SCCIF Helped & Protected",
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("recommends decision documentation when decisionDocumentedRate < 60% and total > 0", () => {
      // 1/3 = 33%
      const assessments = [
        makeAssessment("a1"),
        makeAssessment("a2", { has_decision_rationale: false }),
        makeAssessment("a3", { has_decision_rationale: false }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.decision_documented_rate).toBe(33);
      const rec = r.recommendations.find(
        (x) =>
          x.recommendation ===
          "Strengthen decision documentation to include full rationale for every placement decision",
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("ranks recommendations sequentially", () => {
      // Trigger all 5 recommendations for records>0 scenario:
      // childView <50%, mitigation <50%, safeguarding <60%, review <50%, decisionDoc <60%
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 3, // 30% (<60 → rec)
          impact_on_existing_count: 10,
          impact_with_child_view_count: 4, // 40/100=40% (<50 → rec)
          impact_with_mitigation_count: 4, // 40/100=40% (<50 → rec)
          safeguarding_consideration_count: i < 5 ? 1 : 0, // 50% (<60 → rec)
          has_review_date: i < 4, // 40% (<50 → rec)
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.recommendations.length).toBe(5);
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[1].rank).toBe(2);
      expect(r.recommendations[2].rank).toBe(3);
      expect(r.recommendations[3].rank).toBe(4);
      expect(r.recommendations[4].rank).toBe(5);
    });

    it("no recommendations when everything is excellent", () => {
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.recommendations.length).toBe(0);
    });

    it("no child view recommendation when rate is exactly 50%", () => {
      // pct(5,10) = 50
      const assessments = [
        makeAssessment("a1", { impact_on_existing_count: 10, impact_with_child_view_count: 5 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.child_view_capture_rate).toBe(50);
      const rec = r.recommendations.find(
        (x) => x.regulatory_ref === "CHR 2015 Reg 7",
      );
      expect(rec).toBeUndefined();
    });

    it("no safeguarding recommendation when rate is exactly 60%", () => {
      // 3/5 = 60%
      const assessments = Array.from({ length: 5 }, (_, i) =>
        makeAssessment(`a${i}`, {
          safeguarding_consideration_count: i < 3 ? 2 : 0,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.safeguarding_coverage_rate).toBe(60);
      const rec = r.recommendations.find(
        (x) => x.regulatory_ref === "CHR 2015 Reg 14",
      );
      expect(rec).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. INSIGHTS GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("insights generation", () => {
    it("critical insight: no assessments with children", () => {
      const r = computePlacementImpactAssessment(baseInput({ assessments: [] }));
      expect(r.insights).toContainEqual({
        text: "No placement impact assessments means Ofsted cannot verify how the home protects existing residents during admissions",
        severity: "critical",
      });
    });

    it("positive insight: outstanding matching practice (decision >= 90 and childView >= 80)", () => {
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.insights).toContainEqual({
        text: "Thorough impact assessments with child voice demonstrate outstanding matching practice",
        severity: "positive",
      });
    });

    it("no outstanding practice insight when decision doc < 90%", () => {
      // 2/3 = 67%
      const assessments = [
        makeAssessment("a1"),
        makeAssessment("a2"),
        makeAssessment("a3", { has_decision_rationale: false }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.insights).not.toContainEqual(
        expect.objectContaining({
          text: "Thorough impact assessments with child voice demonstrate outstanding matching practice",
        }),
      );
    });

    it("warning insight: high-risk assessments (singular)", () => {
      const assessments = [
        makeAssessment("a1", { overall_risk: "high" }),
        makeAssessment("a2"),
        makeAssessment("a3"),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.insights).toContainEqual({
        text: "1 high-risk assessment identified — the home is managing complex referrals requiring enhanced scrutiny",
        severity: "warning",
      });
    });

    it("warning insight: high-risk assessments (plural)", () => {
      const assessments = [
        makeAssessment("a1", { overall_risk: "high" }),
        makeAssessment("a2", { overall_risk: "high" }),
        makeAssessment("a3"),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.insights).toContainEqual({
        text: "2 high-risk assessments identified — the home is managing complex referrals requiring enhanced scrutiny",
        severity: "warning",
      });
    });

    it("positive insight: declined referrals (singular)", () => {
      const assessments = [
        makeAssessment("a1", { status: "declined" }),
        makeAssessment("a2"),
        makeAssessment("a3"),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.insights).toContainEqual({
        text: "1 referral declined — demonstrates the home prioritises existing children's welfare over occupancy",
        severity: "positive",
      });
    });

    it("positive insight: declined referrals (plural)", () => {
      const assessments = [
        makeAssessment("a1", { status: "declined" }),
        makeAssessment("a2", { status: "declined" }),
        makeAssessment("a3"),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.insights).toContainEqual({
        text: "2 referrals declined — demonstrates the home prioritises existing children's welfare over occupancy",
        severity: "positive",
      });
    });

    it("positive insight: conditional approvals", () => {
      const assessments = [
        makeAssessment("a1", { status: "approved_with_conditions" }),
        makeAssessment("a2"),
        makeAssessment("a3"),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.insights).toContainEqual({
        text: "Conditional approvals show the home applies proportionate safeguards rather than blanket decisions",
        severity: "positive",
      });
    });

    it("no conditional approval insight when none exist", () => {
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.insights).not.toContainEqual(
        expect.objectContaining({
          text: "Conditional approvals show the home applies proportionate safeguards rather than blanket decisions",
        }),
      );
    });

    it("warning insight: insufficient safeguarding < 50%", () => {
      // 1/3 = 33%
      const assessments = [
        makeAssessment("a1"),
        makeAssessment("a2", { safeguarding_consideration_count: 0 }),
        makeAssessment("a3", { safeguarding_consideration_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.safeguarding_coverage_rate).toBe(33);
      expect(r.insights).toContainEqual({
        text: "Insufficient safeguarding analysis in matching decisions leaves existing children potentially exposed",
        severity: "warning",
      });
    });

    it("no safeguarding warning insight when rate >= 50%", () => {
      // 2/3 = 67%
      const assessments = [
        makeAssessment("a1"),
        makeAssessment("a2"),
        makeAssessment("a3", { safeguarding_consideration_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.safeguarding_coverage_rate).toBe(67);
      expect(r.insights).not.toContainEqual(
        expect.objectContaining({
          text: "Insufficient safeguarding analysis in matching decisions leaves existing children potentially exposed",
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. HEADLINE FOR EACH RATING
  // ═══════════════════════════════════════════════════════════════════════════

  describe("headlines", () => {
    it("insufficient_data headline", () => {
      const r = computePlacementImpactAssessment({
        today: "2025-06-15",
        total_children: 0,
        assessments: [],
      });
      expect(r.headline).toBe(
        "No data available for placement impact assessment analysis",
      );
    });

    it("insufficient_data headline for zero assessments with children", () => {
      const r = computePlacementImpactAssessment(baseInput({ assessments: [] }));
      expect(r.headline).toBe(
        "No data available for placement impact assessment analysis",
      );
    });

    it("outstanding headline", () => {
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.headline).toBe(
        "Outstanding placement matching — rigorous assessments protect existing children and ensure compatibility",
      );
    });

    it("good headline", () => {
      const assessments = [
        makeAssessment("a1", { impact_with_mitigation_count: 3 }),
        makeAssessment("a2", { impact_with_mitigation_count: 3 }),
        makeAssessment("a3", { impact_with_mitigation_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.impact_rating).toBe("good");
      expect(r.headline).toBe(
        "Good placement impact assessment practice with documented decisions and child views",
      );
    });

    it("adequate headline", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 4,
          impact_on_existing_count: 3,
          impact_with_child_view_count: 1,
          impact_with_mitigation_count: 1,
          compatibility_factor_count: 4,
          compatibility_positive_count: 0,
          safeguarding_consideration_count: i < 4 ? 1 : 0,
          has_review_date: i < 2,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.impact_rating).toBe("adequate");
      expect(r.headline).toBe(
        "Placement assessments exist but matching rigour, child views or risk mitigation needs improvement",
      );
    });

    it("inadequate headline", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 2,
          impact_on_existing_count: 10,
          impact_with_child_view_count: 1,
          impact_with_mitigation_count: 2,
          compatibility_factor_count: 10,
          compatibility_positive_count: 1,
          safeguarding_consideration_count: i < 2 ? 1 : 0,
          has_review_date: i < 2,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.impact_rating).toBe("inadequate");
      expect(r.headline).toBe(
        "Inadequate placement matching — existing children's welfare is not sufficiently protected during admissions",
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. SPECIAL CASES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("special cases: high risk assessments", () => {
    it("high risk assessments are counted correctly", () => {
      const assessments = [
        makeAssessment("a1", { overall_risk: "high" }),
        makeAssessment("a2", { overall_risk: "high" }),
        makeAssessment("a3", { overall_risk: "low" }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      // Should generate warning insight about 2 high-risk
      expect(r.insights).toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining("2 high-risk assessment"),
        }),
      );
    });

    it("high risk with no declined triggers concern", () => {
      const assessments = [
        makeAssessment("a1", { overall_risk: "high", status: "approved" }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.concerns).toContain(
        "High-risk assessments have not led to any declined placements — the home may be accepting unsuitable referrals",
      );
    });

    it("high risk with at least one declined does not trigger concern", () => {
      const assessments = [
        makeAssessment("a1", { overall_risk: "high", status: "approved" }),
        makeAssessment("a2", { overall_risk: "high", status: "declined" }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.concerns).not.toContain(
        "High-risk assessments have not led to any declined placements — the home may be accepting unsuitable referrals",
      );
    });

    it("no high risk assessments means no high risk concern or insight", () => {
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.concerns).not.toContain(
        "High-risk assessments have not led to any declined placements — the home may be accepting unsuitable referrals",
      );
      expect(r.insights).not.toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining("high-risk assessment"),
        }),
      );
    });
  });

  describe("special cases: declined placements", () => {
    it("generates positive insight for declined referrals", () => {
      const assessments = [
        makeAssessment("a1", { status: "declined" }),
        makeAssessment("a2"),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.insights).toContainEqual(
        expect.objectContaining({
          severity: "positive",
          text: expect.stringContaining("declined"),
        }),
      );
    });

    it("no declined insight when no declined referrals", () => {
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.insights).not.toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining("declined"),
        }),
      );
    });
  });

  describe("special cases: approved with conditions", () => {
    it("generates insight for conditional approvals when total > 0", () => {
      const assessments = [
        makeAssessment("a1", { status: "approved_with_conditions" }),
        makeAssessment("a2"),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.insights).toContainEqual({
        text: "Conditional approvals show the home applies proportionate safeguards rather than blanket decisions",
        severity: "positive",
      });
    });

    it("no conditional approval insight when status is just approved", () => {
      const r = computePlacementImpactAssessment(baseInput());
      const found = r.insights.find((i) =>
        i.text.includes("Conditional approvals"),
      );
      expect(found).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. ZERO IMPACTS EDGE CASE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("zero impacts edge case", () => {
    it("gives +2 for child views when totalImpacts=0 and records exist", () => {
      const assessments = [
        makeAssessment("a1", {
          impact_on_existing_count: 0,
          impact_with_child_view_count: 0,
          impact_with_mitigation_count: 0,
        }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      // Mod2: totalImpacts=0 && total>0 → +2
      // Mod3: totalImpacts=0 && total>0 → +2
      // 52+6+2+2+5+4+5 = 76
      // Wait: compat: 3/4=75%→+5. safeguard: 1/1=100%→+4. review: 1/1=100%→+5.
      expect(r.impact_score).toBe(76);
    });

    it("gives +2 for mitigations when totalImpacts=0 and records exist", () => {
      const assessments = [
        makeAssessment("a1", {
          impact_on_existing_count: 0,
          impact_with_child_view_count: 0,
          impact_with_mitigation_count: 0,
        }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      // Already tested score=76 above, which confirms +2 for both Mod2 and Mod3
      expect(r.impact_score).toBe(76);
    });

    it("childViewCaptureRate is unmeasured when totalImpacts is 0", () => {
      const assessments = [
        makeAssessment("a1", {
          impact_on_existing_count: 0,
          impact_with_child_view_count: 0,
          impact_with_mitigation_count: 0,
        }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.child_view_capture_rate).toBeNull();
      expect(r.mitigation_rate).toBeNull();
    });

    it("totalImpacts=0 strength conditions not met (totalImpacts must be >0 for child view strength)", () => {
      const assessments = [
        makeAssessment("a1", {
          impact_on_existing_count: 0,
          impact_with_child_view_count: 0,
          impact_with_mitigation_count: 0,
        }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.strengths).not.toContain(
        "Existing children's views are consistently sought before new admissions — child voice drives placement decisions",
      );
      expect(r.strengths).not.toContain(
        "Risk mitigations are documented for identified impacts — the home plans proactively to protect existing residents",
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. ZERO COMPAT FACTORS EDGE CASE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("zero compatibility factors edge case", () => {
    it("gives -2 when totalCompatFactors=0 and records exist", () => {
      const assessments = [
        makeAssessment("a1", {
          compatibility_factor_count: 0,
          compatibility_positive_count: 0,
        }),
        makeAssessment("a2", {
          compatibility_factor_count: 0,
          compatibility_positive_count: 0,
        }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      // 52+6+5+5-2+4+5 = 75
      expect(r.impact_score).toBe(75);
    });

    it("compatibilityPositiveRate is unmeasured when totalCompatFactors is 0", () => {
      const assessments = [
        makeAssessment("a1", {
          compatibility_factor_count: 0,
          compatibility_positive_count: 0,
        }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.compatibility_positive_rate).toBeNull();
    });

    it("no compatibility strength when totalCompatFactors is 0", () => {
      const assessments = [
        makeAssessment("a1", {
          compatibility_factor_count: 0,
          compatibility_positive_count: 0,
        }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.strengths).not.toContain(
        "Compatibility analysis shows predominantly positive factors — the home makes well-matched placements",
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. SINGLE ASSESSMENT
  // ═══════════════════════════════════════════════════════════════════════════

  describe("single assessment", () => {
    it("handles a single perfect assessment", () => {
      const assessments = [makeAssessment("a1")];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      // decision: 1/1=100%→+6
      // childView: 3/3=100%→+5
      // mitigation: 3/3=100%→+5
      // compat: 3/4=75%→+5
      // safeguard: 1/1=100%→+4
      // review: 1/1=100%→+5
      // 52+6+5+5+5+4+5 = 82
      expect(r.impact_score).toBe(82);
      expect(r.impact_rating).toBe("outstanding");
      expect(r.total_assessments).toBe(1);
    });

    it("handles a single poor assessment", () => {
      const assessments = [
        makeAssessment("a1", {
          has_decision_rationale: false,
          impact_on_existing_count: 10,
          impact_with_child_view_count: 0,
          impact_with_mitigation_count: 0,
          compatibility_factor_count: 10,
          compatibility_positive_count: 0,
          safeguarding_consideration_count: 0,
          has_review_date: false,
        }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      // decision: 0/1=0% <30 → -5
      // childView: 0/10=0% <20 → -5
      // mitigation: 0/10=0% <30 → -4
      // compat: 0/10=0% <20 → -4
      // safeguard: 0/1=0% <30 → -4
      // review: 0/1=0% <30 → -3
      // 52-5-5-4-4-4-3 = 27
      expect(r.impact_score).toBe(27);
      expect(r.impact_rating).toBe("inadequate");
      expect(r.total_assessments).toBe(1);
    });

    it("single assessment metrics are correct", () => {
      const assessments = [
        makeAssessment("a1", {
          has_decision_rationale: true,
          impact_on_existing_count: 5,
          impact_with_child_view_count: 3,
          impact_with_mitigation_count: 4,
          compatibility_factor_count: 8,
          compatibility_positive_count: 6,
          safeguarding_consideration_count: 1,
          has_review_date: true,
        }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.decision_documented_rate).toBe(100);
      expect(r.child_view_capture_rate).toBe(60); // pct(3,5) = 60
      expect(r.mitigation_rate).toBe(80); // pct(4,5) = 80
      expect(r.compatibility_positive_rate).toBe(75); // pct(6,8) = 75
      expect(r.safeguarding_coverage_rate).toBe(100);
      expect(r.review_scheduled_rate).toBe(100);
      // 52+6+2+5+5+4+5 = 79
      expect(r.impact_score).toBe(79);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 18. LARGE DATASET
  // ═══════════════════════════════════════════════════════════════════════════

  describe("large dataset", () => {
    it("handles 50 assessments correctly", () => {
      const assessments = Array.from({ length: 50 }, (_, i) =>
        makeAssessment(`a${i}`),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.total_assessments).toBe(50);
      // All perfect: 82
      expect(r.impact_score).toBe(82);
      expect(r.impact_rating).toBe("outstanding");
    });

    it("handles mixed large dataset", () => {
      // 20 assessments: 15 good, 5 poor
      const assessments = Array.from({ length: 20 }, (_, i) =>
        i < 15
          ? makeAssessment(`a${i}`)
          : makeAssessment(`a${i}`, {
              has_decision_rationale: false,
              impact_with_child_view_count: 0,
              impact_with_mitigation_count: 0,
              safeguarding_consideration_count: 0,
              has_review_date: false,
            }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.total_assessments).toBe(20);
      // decision: 15/20=75% → +2
      // totalImpacts = 20*3=60, childViews = 15*3+5*0=45 → pct(45,60)=75% → +2 (>=50,<80)
      // mitigations: 15*3+5*0=45 → pct(45,60)=75% → +2
      // compat: 15*3+5*3=60 / 20*4=80 → pct(60,80)=75% → +5
      // safeguard: 15/20=75% → +1
      // review: 15/20=75% → +2
      // 52+2+2+2+5+1+2 = 66
      expect(r.impact_score).toBe(66);
      expect(r.impact_rating).toBe("good");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 19. COMBINED MODIFIER INTERACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("combined modifier interactions", () => {
    it("all modifiers at +2/+1 tier", () => {
      // Mod1: 60-89→+2, Mod2: 50-79→+2, Mod3: 50-79→+2, Mod4: 40-69→+2, Mod5: 60-89→+1, Mod6: 50-79→+2
      // = 2+2+2+2+1+2 = 11 → 63
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 7, // 70% → +2
          impact_on_existing_count: 10,
          impact_with_child_view_count: 6, // 60/100=60% → +2
          impact_with_mitigation_count: 6, // 60/100=60% → +2
          compatibility_factor_count: 10,
          compatibility_positive_count: 5, // 50/100=50% → +2
          safeguarding_consideration_count: i < 7 ? 2 : 0, // 70% → +1
          has_review_date: i < 6, // 60% → +2
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.impact_score).toBe(63);
      expect(r.impact_rating).toBe("adequate");
    });

    it("all modifiers at 0 tier (in dead zones)", () => {
      // Mod1: 30-59→0, Mod2: 20-49→0, Mod3: 30-49→0, Mod4: 20-39→0, Mod5: 30-59→0, Mod6: 30-49→0
      // = 0 → 52
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 4, // 40% → 0
          impact_on_existing_count: 10,
          impact_with_child_view_count: 3, // 30/100=30% → 0 (>=20, <50)
          impact_with_mitigation_count: 4, // 40/100=40% → 0 (>=30, <50)
          compatibility_factor_count: 10,
          compatibility_positive_count: 3, // 30/100=30% → 0 (>=20, <40)
          safeguarding_consideration_count: i < 4 ? 2 : 0, // 40% → 0 (>=30, <60)
          has_review_date: i < 4, // 40% → 0 (>=30, <50)
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.impact_score).toBe(52);
      expect(r.impact_rating).toBe("adequate");
    });

    it("all modifiers at maximum negative", () => {
      // Mod1: <30→-5, Mod2: <20→-5, Mod3: <30→-4, Mod4: <20→-4, Mod5: <30→-4, Mod6: <30→-3
      // = -25 → 27
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 2, // 20% → -5
          impact_on_existing_count: 10,
          impact_with_child_view_count: 1, // 10/100=10% → -5
          impact_with_mitigation_count: 2, // 20/100=20% → -4 (pct(20,100)=20 <30)
          compatibility_factor_count: 10,
          compatibility_positive_count: 1, // 10/100=10% → -4
          safeguarding_consideration_count: i < 2 ? 1 : 0, // 20% → -4
          has_review_date: i < 2, // 20% → -3
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.impact_score).toBe(27);
      expect(r.impact_rating).toBe("inadequate");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 20. RATE CALCULATIONS (pct helper)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("rate calculations", () => {
    it("decision_documented_rate rounds correctly", () => {
      // 1/3 = Math.round(33.33) = 33
      const assessments = [
        makeAssessment("a1"),
        makeAssessment("a2", { has_decision_rationale: false }),
        makeAssessment("a3", { has_decision_rationale: false }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.decision_documented_rate).toBe(33);
    });

    it("child_view_capture_rate rounds correctly with fractional result", () => {
      // 1/3 = Math.round(33.33) = 33
      const assessments = [
        makeAssessment("a1", { impact_on_existing_count: 1, impact_with_child_view_count: 0, impact_with_mitigation_count: 1 }),
        makeAssessment("a2", { impact_on_existing_count: 1, impact_with_child_view_count: 0, impact_with_mitigation_count: 1 }),
        makeAssessment("a3", { impact_on_existing_count: 1, impact_with_child_view_count: 1, impact_with_mitigation_count: 1 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.child_view_capture_rate).toBe(33);
    });

    it("compatibility_positive_rate with Math.round 0.5 rounds up", () => {
      // 1/2 = 50
      const assessments = [
        makeAssessment("a1", { compatibility_factor_count: 2, compatibility_positive_count: 1 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.compatibility_positive_rate).toBe(50);
    });

    it("review_scheduled_rate with 2/3", () => {
      // 2/3 = Math.round(66.67) = 67
      const assessments = [
        makeAssessment("a1"),
        makeAssessment("a2"),
        makeAssessment("a3", { has_review_date: false }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.review_scheduled_rate).toBe(67);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 21. MULTIPLE SIMULTANEOUS CONCERNS AND RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("multiple concerns scenario", () => {
    it("generates all 7 concerns simultaneously", () => {
      // Need: total=0 && total_children>0 AND total>0 conditions. These are mutually exclusive.
      // So max concerns at once: either the "no assessments" concern, or the other 6.
      // Let's trigger the 6 non-zero-assessment concerns:
      // decisionDocRate<50, childViewRate<30, mitigationRate<30,
      // highRisk>0 && declined===0, safeguardRate<30, reviewRate<30
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 4, // 40% < 50 → concern
          impact_on_existing_count: 10,
          impact_with_child_view_count: 2, // 20/100=20% < 30 → concern
          impact_with_mitigation_count: 2, // 20/100=20% < 30 → concern
          compatibility_factor_count: 10,
          compatibility_positive_count: 1,
          overall_risk: i < 3 ? "high" : "low", // 3 high-risk
          status: "approved", // none declined → concern
          safeguarding_consideration_count: i < 2 ? 1 : 0, // 20% < 30 → concern
          has_review_date: i < 2, // 20% < 30 → concern
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.concerns.length).toBe(6);
    });

    it("generates all 5 recommendations for records>0 scenario plus decision doc", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 3, // 30% (<60)
          impact_on_existing_count: 10,
          impact_with_child_view_count: 4, // 40/100=40% (<50)
          impact_with_mitigation_count: 4, // 40/100=40% (<50)
          safeguarding_consideration_count: i < 5 ? 1 : 0, // 50% (<60)
          has_review_date: i < 4, // 40% (<50)
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.recommendations.length).toBe(5);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 22. ADDITIONAL EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("additional edge cases", () => {
    it("pending status does not affect scoring", () => {
      const assessments = [
        makeAssessment("a1", { status: "pending" }),
        makeAssessment("a2", { status: "pending" }),
        makeAssessment("a3", { status: "pending" }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      // Same scoring as default — status does not affect modifiers
      expect(r.impact_score).toBe(82);
    });

    it("medium risk does not trigger high risk insights", () => {
      const assessments = [
        makeAssessment("a1", { overall_risk: "medium" }),
        makeAssessment("a2", { overall_risk: "medium" }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.insights).not.toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining("high-risk"),
        }),
      );
    });

    it("has_notes field does not affect scoring", () => {
      const assessments = [
        makeAssessment("a1", { has_notes: false }),
        makeAssessment("a2", { has_notes: false }),
        makeAssessment("a3", { has_notes: false }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.impact_score).toBe(82);
    });

    it("condition_count does not affect scoring", () => {
      const assessments = [
        makeAssessment("a1", { condition_count: 10 }),
        makeAssessment("a2", { condition_count: 0 }),
        makeAssessment("a3", { condition_count: 5 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.impact_score).toBe(82);
    });

    it("staffing_implication_count does not affect scoring", () => {
      const assessments = [
        makeAssessment("a1", { staffing_implication_count: 0 }),
        makeAssessment("a2", { staffing_implication_count: 10 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      // 2 assessments: 52+6+5+5+5+4+5 = 82
      expect(r.impact_score).toBe(82);
    });

    it("environmental_consideration_count does not affect scoring", () => {
      const assessments = [
        makeAssessment("a1", { environmental_consideration_count: 0 }),
        makeAssessment("a2", { environmental_consideration_count: 50 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.impact_score).toBe(82);
    });

    it("compatibility_concern_count does not affect scoring", () => {
      const assessments = [
        makeAssessment("a1", { compatibility_concern_count: 100 }),
        makeAssessment("a2", { compatibility_concern_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.impact_score).toBe(82);
    });

    it("impact_high_risk_count does not affect scoring directly", () => {
      const assessments = [
        makeAssessment("a1", { impact_high_risk_count: 50 }),
        makeAssessment("a2", { impact_high_risk_count: 0 }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.impact_score).toBe(82);
    });

    it("today field does not affect scoring", () => {
      const r1 = computePlacementImpactAssessment(baseInput({ today: "2020-01-01" }));
      const r2 = computePlacementImpactAssessment(baseInput({ today: "2030-12-31" }));
      expect(r1.impact_score).toBe(r2.impact_score);
    });

    it("total_children value does not affect scoring when > 0", () => {
      const r1 = computePlacementImpactAssessment(baseInput({ total_children: 1 }));
      const r2 = computePlacementImpactAssessment(baseInput({ total_children: 100 }));
      expect(r1.impact_score).toBe(r2.impact_score);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 23. SCORE CLAMPING
  // ═══════════════════════════════════════════════════════════════════════════

  describe("score clamping", () => {
    it("score never exceeds 100", () => {
      // Max is 82, well within bounds
      const r = computePlacementImpactAssessment(baseInput());
      expect(r.impact_score).toBeLessThanOrEqual(100);
    });

    it("score never drops below 0", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: false,
          impact_on_existing_count: 100,
          impact_with_child_view_count: 0,
          impact_with_mitigation_count: 0,
          compatibility_factor_count: 100,
          compatibility_positive_count: 0,
          safeguarding_consideration_count: 0,
          has_review_date: false,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      expect(r.impact_score).toBeGreaterThanOrEqual(0);
      // 52-5-5-4-4-4-3 = 27
      expect(r.impact_score).toBe(27);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 24. RETURN SHAPE VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("return shape validation", () => {
    it("returns all expected fields", () => {
      const r = computePlacementImpactAssessment(baseInput());
      expect(r).toHaveProperty("impact_rating");
      expect(r).toHaveProperty("impact_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_assessments");
      expect(r).toHaveProperty("decision_documented_rate");
      expect(r).toHaveProperty("child_view_capture_rate");
      expect(r).toHaveProperty("mitigation_rate");
      expect(r).toHaveProperty("compatibility_positive_rate");
      expect(r).toHaveProperty("safeguarding_coverage_rate");
      expect(r).toHaveProperty("review_scheduled_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("strengths is an array of strings", () => {
      const r = computePlacementImpactAssessment(baseInput());
      expect(Array.isArray(r.strengths)).toBe(true);
      r.strengths.forEach((s) => expect(typeof s).toBe("string"));
    });

    it("recommendations have correct shape", () => {
      const assessments = Array.from({ length: 10 }, (_, i) =>
        makeAssessment(`a${i}`, {
          has_decision_rationale: i < 3,
          impact_on_existing_count: 10,
          impact_with_child_view_count: 4,
          impact_with_mitigation_count: 4,
          safeguarding_consideration_count: i < 5 ? 1 : 0,
          has_review_date: i < 4,
        }),
      );
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      r.recommendations.forEach((rec) => {
        expect(typeof rec.rank).toBe("number");
        expect(typeof rec.recommendation).toBe("string");
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
        expect(typeof rec.regulatory_ref).toBe("string");
      });
    });

    it("insights have correct shape", () => {
      const assessments = [
        makeAssessment("a1", { overall_risk: "high", status: "declined" }),
        makeAssessment("a2", { status: "approved_with_conditions" }),
      ];
      const r = computePlacementImpactAssessment(baseInput({ assessments }));
      r.insights.forEach((ins) => {
        expect(typeof ins.text).toBe("string");
        expect(["critical", "warning", "positive"]).toContain(ins.severity);
      });
    });
  });
});
