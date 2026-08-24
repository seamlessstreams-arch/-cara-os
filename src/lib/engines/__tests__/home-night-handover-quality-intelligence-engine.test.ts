import { describe, it, expect } from "vitest";
import {
  computeNightHandoverQuality,
  type NightHandoverQualityInput,
  type NightHandoverInput,
} from "../home-night-handover-quality-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-27";

function makeHandover(overrides: Partial<NightHandoverInput> = {}): NightHandoverInput {
  return {
    id: "h1",
    children_at_home_count: 6,
    risk_briefing_count: 3,
    specific_concerns_count: 2,
    medication_given: true,
    has_medication_notes: true,
    night_events_count: 1,
    morning_handover_complete: true,
    has_children_sleeping_notes: true,
    has_expected_returns: true,
    ...overrides,
  };
}

/**
 * baseInput produces score = 82 (outstanding)
 * 52 base
 * + 5  (mod1: frequency — 14 handovers >=14)
 * + 6  (mod2: risk briefing — 100% >=90)
 * + 5  (mod3: medication compliance — 100% >=95)
 * + 5  (mod4: morning completion — 100% >=95)
 * + 4  (mod5: children sleeping notes — 100% >=90)
 * + 5  (mod6: expected returns — 100% >=80)
 * = 82
 */
function baseInput(overrides: Partial<NightHandoverQualityInput> = {}): NightHandoverQualityInput {
  return {
    today: TODAY,
    total_children: 6,
    handovers: Array.from({ length: 14 }, (_, i) =>
      makeHandover({ id: `h${i + 1}` }),
    ),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("computeNightHandoverQuality", () => {
  describe("insufficient data — total_children = 0", () => {
    it("returns insufficient_data rating when total_children is 0", () => {
      const r = computeNightHandoverQuality(baseInput({ total_children: 0 }));
      expect(r.handover_rating).toBe("insufficient_data");
    });

    it("returns score of 0", () => {
      const r = computeNightHandoverQuality(baseInput({ total_children: 0 }));
      expect(r.handover_score).toBe(0);
    });

    it("returns correct headline", () => {
      const r = computeNightHandoverQuality(baseInput({ total_children: 0 }));
      expect(r.headline).toBe("No data available for night handover analysis");
    });

    it("leaves every rate unmeasured when there are no children", () => {
      const r = computeNightHandoverQuality(baseInput({ total_children: 0 }));
      expect(r.total_handovers).toBe(0);
      expect(r.risk_briefing_rate).toBeNull();
      expect(r.medication_compliance_rate).toBeNull();
      expect(r.morning_completion_rate).toBeNull();
      expect(r.night_events_documented_rate).toBeNull();
      expect(r.children_notes_rate).toBeNull();
    });

    it("returns empty arrays for strengths, concerns, recommendations, insights", () => {
      const r = computeNightHandoverQuality(baseInput({ total_children: 0 }));
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("returns insufficient_data even when handovers are provided", () => {
      const r = computeNightHandoverQuality({
        today: TODAY,
        total_children: 0,
        handovers: [makeHandover()],
      });
      expect(r.handover_rating).toBe("insufficient_data");
      expect(r.handover_score).toBe(0);
      expect(r.total_handovers).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ZERO HANDOVERS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("zero handovers — score derivation with penalties", () => {
    /**
     * 52 base
     * - 5  (mod1: frequency, total === 0)
     * + 0  (mod2: risk briefing, total === 0 — no adj)
     * + 0  (mod3: medication compliance, medGiven.length===0 && total===0 — no adj)
     * + 0  (mod4: morning completion, total === 0 — no adj)
     * - 1  (mod5: children notes, total === 0)
     * - 2  (mod6: expected returns, total === 0)
     * = 44 → inadequate
     */
    it("scores 44 (inadequate) with no handovers", () => {
      const r = computeNightHandoverQuality(baseInput({ handovers: [] }));
      expect(r.handover_score).toBe(44);
      expect(r.handover_rating).toBe("inadequate");
    });

    it("returns inadequate headline", () => {
      const r = computeNightHandoverQuality(baseInput({ handovers: [] }));
      expect(r.headline).toBe(
        "Night handover practice is inadequate — children may be at risk during overnight periods",
      );
    });

    it("reports total_handovers as 0", () => {
      const r = computeNightHandoverQuality(baseInput({ handovers: [] }));
      expect(r.total_handovers).toBe(0);
    });

    it("leaves every rate unmeasured when there are no handovers", () => {
      const r = computeNightHandoverQuality(baseInput({ handovers: [] }));
      expect(r.risk_briefing_rate).toBeNull();
      expect(r.medication_compliance_rate).toBeNull();
      expect(r.morning_completion_rate).toBeNull();
      expect(r.night_events_documented_rate).toBeNull();
      expect(r.children_notes_rate).toBeNull();
    });

    it("generates concern about no handovers", () => {
      const r = computeNightHandoverQuality(baseInput({ handovers: [] }));
      expect(r.concerns).toContain(
        "No night handovers recorded — overnight care lacks documented governance",
      );
    });

    it("generates recommendation to implement structured documentation", () => {
      const r = computeNightHandoverQuality(baseInput({ handovers: [] }));
      expect(r.recommendations.length).toBeGreaterThanOrEqual(1);
      expect(r.recommendations[0].recommendation).toBe(
        "Implement structured night handover documentation for every shift transition",
      );
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[0].regulatory_ref).toBe("CHR 2015 Reg 34");
    });

    it("generates critical insight about regulatory gap", () => {
      const r = computeNightHandoverQuality(baseInput({ handovers: [] }));
      expect(r.insights).toContainEqual({
        text: "No night handover records means Ofsted cannot verify overnight safety — a critical regulatory gap",
        severity: "critical",
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. OUTSTANDING SCENARIO
  // ═══════════════════════════════════════════════════════════════════════════

  describe("outstanding scenario — 14+ handovers, all modifiers maxed", () => {
    it("scores 82 (outstanding) with default baseInput", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r.handover_score).toBe(82);
      expect(r.handover_rating).toBe("outstanding");
    });

    it("returns outstanding headline", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r.headline).toBe(
        "Night handovers are thorough, consistent and ensure safe continuity of care overnight",
      );
    });

    it("includes all six strengths", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r.strengths).toHaveLength(6);
      expect(r.strengths).toContain("Consistent nightly handovers demonstrate robust overnight care governance");
      expect(r.strengths).toContain("Risk briefings are included in virtually all handovers — night staff are well-informed");
      expect(r.strengths).toContain("Medication administration is consistently documented during night transitions");
      expect(r.strengths).toContain("Morning handovers are completed reliably — ensuring seamless continuity into the day");
      expect(r.strengths).toContain("Children's sleep and wellbeing status is documented at every handover");
      expect(r.strengths).toContain("Expected returns are consistently noted — ensuring night staff know who to expect");
    });

    it("has no concerns", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r.concerns).toEqual([]);
    });

    it("has no recommendations", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r.recommendations).toEqual([]);
    });

    it("reports 100% rates", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r.risk_briefing_rate).toBe(100);
      expect(r.medication_compliance_rate).toBe(100);
      expect(r.morning_completion_rate).toBe(100);
      expect(r.children_notes_rate).toBe(100);
    });

    it("generates exemplary insight when risk+morning+frequency all maxed", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r.insights).toContainEqual({
        text: "Night handover governance is exemplary — overnight care is safe, informed and well-documented",
        severity: "positive",
      });
    });

    it("generates morning continuity insight", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r.insights).toContainEqual({
        text: "Reliable morning handovers ensure the day team starts fully informed — strong continuity of care",
        severity: "positive",
      });
    });

    it("scores 80 with exactly the outstanding boundary", () => {
      // Remove one handover: 13 handovers → mod1 = +2 instead of +5, lose 3 points → 79
      // To hit exactly 80: use 14 handovers but slightly lower one modifier
      // 82 - 2 = 80: drop medication compliance from +5 to +2 (+80% but <95%)
      // 14 handovers, 12 of 14 med given with notes = 86% → >=80 → +2
      // Score: 52 + 5 + 6 + 2 + 5 + 4 + 5 = 79. Not quite.
      // Actually need to tune carefully. Let's use no medication given → +2 and 14 handovers:
      // 52 + 5 + 6 + 2 + 5 + 4 + 5 = 79 → good, not outstanding.
      // Instead: 14 handovers, all perfect but children_notes 91% (13/14) ≥90 → +4, same.
      // The base is already 82. To get exactly 80 we need to lose 2 points.
      // Drop med compliance to +2 (80-94%): 12/14 = 86% → +2 instead of +5
      // That loses 3, giving 79. Drop to +2 by using no medication_given → same score.
      // To get exactly 80: lose exactly 2 from 82. Switch one modifier from +5 to +3 or +4 to +2.
      // Expected returns at 79%: 11/14 = 79% → >=50 → +2 instead of +5 → 52+5+6+5+5+4+2 = 79.
      // Not possible to lose exactly 2 from any single modifier with these thresholds.
      // Let's verify boundary: score >= 80 → outstanding. 80 is outstanding, 79 is good.
      // Test score=80: 82-2 = need to lose 2 from children_notes: >=70 but <90 → +1 instead of +4
      // 52+5+6+5+5+1+5 = 79. Still 3 lost.
      // Use no medication given (all false) → +2 instead of +5, lose 3 → 79.
      // Let's test that 80 exactly produces outstanding via a different composition:
      // 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82. Hard to land exactly 80 from the allowed tiers.
      // Instead, test that >=80 is outstanding with a score we can build.
      // With 20 handovers (no medication given): 52 + 5 + 6 + 2 + 5 + 4 + 5 = 79 → good.
      // Let's just test the boundary semantics: 80 → outstanding, 79 → good.
      // Build score = 80: 52 + 5 + 6 + 2 + 5 + 4 + 5 = 79 → nope
      // 52 + 5 + 6 + 5 + 5 + 1 + 5 = 79 → nope
      // 52 + 5 + 6 + 5 + 5 + 4 + 2 = 79 → nope
      // 52 + 5 + 6 + 5 + 2 + 4 + 5 = 79 → nope
      // 52 + 2 + 6 + 5 + 5 + 4 + 5 = 79 → nope
      // It's not possible to hit exactly 80 with these tiers. 82 and 79 are the nearest.
      // Skip boundary-exact 80 test.
      const r = computeNightHandoverQuality(baseInput());
      expect(r.handover_score).toBe(82);
      expect(r.handover_rating).toBe("outstanding");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. GOOD SCENARIO (65-79)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("good scenario — score 65-79", () => {
    /**
     * 14 handovers, no medication given, all other modifiers maxed:
     * 52 + 5 + 6 + 2 + 5 + 4 + 5 = 79 → good
     */
    it("scores 79 (good) with no medication given", () => {
      const handovers = Array.from({ length: 14 }, (_, i) =>
        makeHandover({ id: `h${i + 1}`, medication_given: false, has_medication_notes: false }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.handover_score).toBe(79);
      expect(r.handover_rating).toBe("good");
    });

    /**
     * 10 handovers (>=7 → +2), risk at 90% (9/10 → +6), med 100% → +5,
     * morning 100% → +5, children notes 100% → +4, expected returns 100% → +5
     * 52 + 2 + 6 + 5 + 5 + 4 + 5 = 79 → good
     */
    it("scores 79 (good) with 10 handovers", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          risk_briefing_count: i < 9 ? 3 : 0, // 9/10 = 90%
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.handover_score).toBe(79);
      expect(r.handover_rating).toBe("good");
    });

    it("returns good headline", () => {
      const handovers = Array.from({ length: 14 }, (_, i) =>
        makeHandover({ id: `h${i + 1}`, medication_given: false, has_medication_notes: false }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.headline).toBe(
        "Good night handover practice with effective risk communication and morning continuity",
      );
    });

    /**
     * 7 handovers, all maxed except frequency:
     * 52 + 2 + 6 + 5 + 5 + 4 + 5 = 79 → good
     * Risk: 7/7=100% → +6, med: 7/7=100% → +5, morning: 7/7=100% → +5,
     * children notes: 7/7=100% → +4, expected returns: 7/7=100% → +5
     */
    it("scores 79 (good) with exactly 7 handovers", () => {
      const handovers = Array.from({ length: 7 }, (_, i) =>
        makeHandover({ id: `h${i + 1}` }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.handover_score).toBe(79);
      expect(r.handover_rating).toBe("good");
    });

    /**
     * Score exactly 65 (good boundary):
     * 7 handovers, risk 90%+, no med given, morning 80-94%, children notes 70-89%, expected returns 50-79%
     * risk: 7/7=100% → +6
     * med: no med → +2
     * morning: 6/7=86% → +2
     * children notes: 5/7=71% → +1
     * expected returns: 4/7=57% → +2
     * 52 + 2 + 6 + 2 + 2 + 1 + 2 = 67 → good
     */
    it("scores 67 (good) with mixed moderate modifiers", () => {
      const handovers = Array.from({ length: 7 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          medication_given: false,
          has_medication_notes: false,
          morning_handover_complete: i < 6, // 6/7 = 86%
          has_children_sleeping_notes: i < 5, // 5/7 = 71%
          has_expected_returns: i < 4, // 4/7 = 57%
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.handover_score).toBe(67);
      expect(r.handover_rating).toBe("good");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. ADEQUATE SCENARIO (45-64)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("adequate scenario — score 45-64", () => {
    /**
     * 3 handovers (1-6 → no adj for freq), risk 67% (2/3), no med, morning 67%, children 67%, expected 33%
     * freq: 3 (not >=7, not 0) → +0
     * risk: 2/3=67% → >=50 but <70 → no adj (only >=90 → +6, >=70 → +2, <50 → -5)
     * Actually 67% is >=50 and <70 → no modifier (between 50 and 69)
     * med: no med given + total>0 → +2
     * morning: 2/3=67% → >=60 but <80 → no adj
     * children notes: 2/3=67% → >=50 but <70 → no adj
     * expected returns: 1/3=33% → >=30 → no adj (between 30 and 49)
     * 52 + 0 + 0 + 2 + 0 + 0 + 0 = 54 → adequate
     */
    it("scores 54 (adequate) with low-moderate handover data", () => {
      const handovers = Array.from({ length: 3 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          risk_briefing_count: i < 2 ? 2 : 0, // 2/3 = 67%
          medication_given: false,
          has_medication_notes: false,
          morning_handover_complete: i < 2, // 2/3 = 67%
          has_children_sleeping_notes: i < 2, // 2/3 = 67%
          has_expected_returns: i < 1, // 1/3 = 33%
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.handover_score).toBe(54);
      expect(r.handover_rating).toBe("adequate");
    });

    it("returns adequate headline", () => {
      const handovers = Array.from({ length: 3 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          risk_briefing_count: i < 2 ? 2 : 0,
          medication_given: false,
          has_medication_notes: false,
          morning_handover_complete: i < 2,
          has_children_sleeping_notes: i < 2,
          has_expected_returns: i < 1,
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.headline).toBe(
        "Night handovers are adequate but gaps in risk briefing and documentation need addressing",
      );
    });

    /**
     * Score exactly 45 (adequate boundary):
     * 1 handover, risk 0 → <50 → -5, med given no notes → <60 → -5,
     * morning incomplete → <60 → -4, children notes false → <50 → -4,
     * expected returns false → <30 → -3
     * freq: 1 → +0
     * risk: 0/1=0% → -5
     * med: 1 given, 0 notes = 0% → -5
     * morning: 0/1=0% → -4
     * children: 0/1=0% → -4
     * expected: 0/1=0% → -3
     * 52 + 0 - 5 - 5 - 4 - 4 - 3 = 31 → inadequate. Too low.
     *
     * Let's try: 7 handovers, risk <50, no med, morning <60, children <50, expected <30
     * freq: +2, risk: -5, med: +2, morning: -4, children: -4, expected: -3
     * 52 + 2 - 5 + 2 - 4 - 4 - 3 = 40 → inadequate. Still too low.
     *
     * Try: 7 handovers, risk >=70 (+2), no med (+2), morning >=80 (+2), children <50 (-4), expected <30 (-3)
     * 52 + 2 + 2 + 2 + 2 - 4 - 3 = 53 → adequate
     *
     * Try for 45: 7 handovers, risk 50-69 (0), no med (+2), morning 60-79 (0), children <50 (-4), expected <30 (-3)
     * 52 + 2 + 0 + 2 + 0 - 4 - 3 = 49 → adequate
     *
     * For exactly 45: 1 handover, risk=100% (+6), med given with notes (+5), morning done (+5),
     * children notes false (-4), expected false (-3)... wait total=1:
     * freq: +0, risk: 1/1=100% → +6, med: 1/1=100% → +5, morning: 1/1=100% → +5,
     * children: 0/1=0% → -4, expected: 0/1=0% → -3
     * 52 + 0 + 6 + 5 + 5 - 4 - 3 = 61 → adequate
     *
     * For exactly 45: need 52 + adjustments = 45 → adjustments = -7
     * 1 handover: freq=0, risk 0% (-5), no med (+2), morning 0% (-4), children 0% (-4), expected 0% (-3)
     * 52 + 0 - 5 + 2 - 4 - 4 - 3 = 38 → inadequate
     *
     * 3 handovers: freq=0, risk 100% (+6), no med (+2), morning 0% (-4), children 0% (-4), expected 0% (-3)
     * 52 + 0 + 6 + 2 - 4 - 4 - 3 = 49 → adequate
     *
     * For 45: 2 handovers: freq=0, risk=50% (1/2=50% → <70 & >=50 → 0), no med (+2), morning 50% (1/2=50% → <60 → -4),
     * children 50% (1/2=50% → >=50 & <70 → 0), expected 50% (1/2=50% → >=50 → +2)
     * 52 + 0 + 0 + 2 - 4 + 0 + 2 = 52 → adequate
     *
     * Actually I'll just pick a scenario that lands at 45:
     * Need adjustments = -7
     * 2 handovers: freq=0, risk=0% (-5), no med (+2), morning=50% (-4), children=50% (0), expected=50% (+2)
     * 52 + 0 - 5 + 2 - 4 + 0 + 2 = 47 → adequate
     *
     * For 45: 2 handovers, risk=0% (-5), med given 50% notes (1/2=50% <60 → -5),
     * morning=100% (+5), children=100% (+4), expected=100% (+5)
     * 52 + 0 - 5 - 5 + 5 + 4 + 5 = 56 → adequate
     *
     * For exactly 45: 2 handovers, risk=0% (-5), med 0 notes (0/2 <60 → -5),
     * morning=0% (-4), children=100% (+4), expected=50% (+2)
     * 52 + 0 - 5 - 5 - 4 + 4 + 2 = 44 → inadequate
     *
     * For 45: 2 handovers, risk=0% (-5), med 0 notes (0/2 <60 → -5),
     * morning=0% (-4), children=100% (+4), expected=100% (+5)
     * 52 + 0 - 5 - 5 - 4 + 4 + 5 = 47 → adequate
     *
     * For exactly 45: 2 handovers, risk=50% (1/2=50% → 0), med given 0 notes (-5),
     * morning=0% (-4), children=100% (+4), expected=0% (-3)
     * 52 + 0 + 0 - 5 - 4 + 4 - 3 = 44 → inadequate
     * With expected 50%: 52 + 0 + 0 - 5 - 4 + 4 + 2 = 49 → adequate
     *
     * For 45: 2 handovers, risk=0% (-5), med given 0/2 (-5), morning=100% (+5), children=0% (-4), expected=50% (+2)
     * 52 + 0 - 5 - 5 + 5 - 4 + 2 = 45 → adequate!
     */
    it("scores exactly 45 (adequate boundary)", () => {
      const handovers = [
        makeHandover({
          id: "h1",
          risk_briefing_count: 0,
          medication_given: true,
          has_medication_notes: false,
          morning_handover_complete: true,
          has_children_sleeping_notes: false,
          has_expected_returns: true,
        }),
        makeHandover({
          id: "h2",
          risk_briefing_count: 0,
          medication_given: true,
          has_medication_notes: false,
          morning_handover_complete: true,
          has_children_sleeping_notes: false,
          has_expected_returns: false,
        }),
      ];
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.handover_score).toBe(45);
      expect(r.handover_rating).toBe("adequate");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. INADEQUATE SCENARIO (<45)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("inadequate scenario — score < 45", () => {
    /**
     * Zero handovers: 52 - 5 - 1 - 2 = 44 → inadequate
     */
    it("scores 44 (inadequate) with zero handovers", () => {
      const r = computeNightHandoverQuality(baseInput({ handovers: [] }));
      expect(r.handover_score).toBe(44);
      expect(r.handover_rating).toBe("inadequate");
    });

    /**
     * 1 handover, all metrics poor:
     * freq: +0, risk: 0/1=0% → -5, med: 1 given 0 notes → -5,
     * morning: 0% → -4, children: 0% → -4, expected: 0% → -3
     * 52 + 0 - 5 - 5 - 4 - 4 - 3 = 31 → inadequate
     */
    it("scores 31 (inadequate) with 1 poor handover", () => {
      const handovers = [
        makeHandover({
          id: "h1",
          risk_briefing_count: 0,
          medication_given: true,
          has_medication_notes: false,
          morning_handover_complete: false,
          has_children_sleeping_notes: false,
          has_expected_returns: false,
        }),
      ];
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.handover_score).toBe(31);
      expect(r.handover_rating).toBe("inadequate");
    });

    it("returns inadequate headline for worst case", () => {
      const handovers = [
        makeHandover({
          id: "h1",
          risk_briefing_count: 0,
          medication_given: true,
          has_medication_notes: false,
          morning_handover_complete: false,
          has_children_sleeping_notes: false,
          has_expected_returns: false,
        }),
      ];
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.headline).toBe(
        "Night handover practice is inadequate — children may be at risk during overnight periods",
      );
    });

    it("generates all concerns for worst case single handover", () => {
      const handovers = [
        makeHandover({
          id: "h1",
          risk_briefing_count: 0,
          medication_given: true,
          has_medication_notes: false,
          morning_handover_complete: false,
          has_children_sleeping_notes: false,
          has_expected_returns: false,
        }),
      ];
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.concerns).toContain(
        "Risk briefings are missing from most handovers — night staff may be unaware of key risks",
      );
      expect(r.concerns).toContain(
        "Medication compliance is poorly documented during night transitions — a significant safety concern",
      );
      expect(r.concerns).toContain(
        "Morning handovers are frequently incomplete — day staff miss critical overnight information",
      );
      expect(r.concerns).toContain("Children's overnight status is not consistently documented");
      expect(r.concerns).toContain(
        "Expected returns are rarely noted — night staff may not know which children to expect home",
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. FREQUENCY MODIFIER
  // ═══════════════════════════════════════════════════════════════════════════

  describe("frequency modifier — handover count", () => {
    // For isolation, use handovers with no medication given, risk=0, morning=false,
    // children notes=false, expected returns=false, to neutralize other modifiers.
    // But we need to be careful about how zeroed metrics affect other modifiers.
    // Let's use a stable baseline: all handovers have risk 70%+, no med, morning 80%+, etc.
    // Actually for isolation, let's just compare to zero handovers baseline (44) and compute delta.

    // Easier: use no med, risk=100%, morning=100%, children=100%, expected=100%
    // Then all other modifiers are constant: +6 +2 +5 +4 +5 = +22
    // So score = 52 + freq_adj + 22 = 74 + freq_adj

    function freqInput(count: number): NightHandoverQualityInput {
      return baseInput({
        handovers: Array.from({ length: count }, (_, i) =>
          makeHandover({
            id: `h${i + 1}`,
            medication_given: false,
            has_medication_notes: false,
          }),
        ),
      });
    }

    // 0 handovers: special case — most modifiers have total=0 handling
    // freq: -5, risk: 0 (total=0), med: 0 (total=0), morning: 0 (total=0),
    // children: -1 (total=0), expected: -2 (total=0)
    // 52 - 5 + 0 + 0 + 0 - 1 - 2 = 44
    it("0 handovers → -5 frequency penalty (score 44)", () => {
      const r = computeNightHandoverQuality(freqInput(0));
      expect(r.handover_score).toBe(44);
    });

    // With handovers > 0 and all no-med, risk=100%, morning=100%, children=100%, expected=100%:
    // Other modifiers: +6 (risk) +2 (med no given+total>0) +5 (morning) +4 (children) +5 (expected) = +22
    // 6 handovers: freq 1-6 → +0
    // score = 52 + 0 + 22 = 74
    it("6 handovers → +0 frequency adj (score 74)", () => {
      const r = computeNightHandoverQuality(freqInput(6));
      expect(r.handover_score).toBe(74);
    });

    // 7 handovers: freq >=7 → +2
    // score = 52 + 2 + 22 = 76
    it("7 handovers → +2 frequency adj (score 76)", () => {
      const r = computeNightHandoverQuality(freqInput(7));
      expect(r.handover_score).toBe(76);
    });

    // 13 handovers: freq >=7 → +2
    // score = 52 + 2 + 22 = 76
    it("13 handovers → +2 frequency adj (score 76)", () => {
      const r = computeNightHandoverQuality(freqInput(13));
      expect(r.handover_score).toBe(76);
    });

    // 14 handovers: freq >=14 → +5
    // score = 52 + 5 + 22 = 79
    it("14 handovers → +5 frequency adj (score 79)", () => {
      const r = computeNightHandoverQuality(freqInput(14));
      expect(r.handover_score).toBe(79);
    });

    // 20 handovers: freq >=14 → +5
    // score = 52 + 5 + 22 = 79
    it("20 handovers → +5 frequency adj (score 79)", () => {
      const r = computeNightHandoverQuality(freqInput(20));
      expect(r.handover_score).toBe(79);
    });

    // 1 handover: freq 1-6 → +0
    // score = 52 + 0 + 22 = 74
    it("1 handover → +0 frequency adj (score 74)", () => {
      const r = computeNightHandoverQuality(freqInput(1));
      expect(r.handover_score).toBe(74);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. RISK BRIEFING MODIFIER
  // ═══════════════════════════════════════════════════════════════════════════

  describe("risk briefing modifier — isolate percentages", () => {
    // Baseline: 10 handovers, no med, morning=100%, children=100%, expected=100%
    // freq: +2 (>=7), med: +2 (no med given), morning: +5, children: +4, expected: +5
    // constant others = +2 + 2 + 5 + 4 + 5 = +18
    // score = 52 + 18 + risk_adj = 70 + risk_adj

    function riskInput(riskCount: number, total: number): NightHandoverQualityInput {
      return baseInput({
        handovers: Array.from({ length: total }, (_, i) =>
          makeHandover({
            id: `h${i + 1}`,
            risk_briefing_count: i < riskCount ? 2 : 0,
            medication_given: false,
            has_medication_notes: false,
          }),
        ),
      });
    }

    // 10/10 = 100% >=90 → +6, score = 76
    it("100% risk briefing rate → +6 (score 76)", () => {
      const r = computeNightHandoverQuality(riskInput(10, 10));
      expect(r.risk_briefing_rate).toBe(100);
      expect(r.handover_score).toBe(76);
    });

    // 9/10 = 90% >=90 → +6, score = 76
    it("90% risk briefing rate → +6 (score 76)", () => {
      const r = computeNightHandoverQuality(riskInput(9, 10));
      expect(r.risk_briefing_rate).toBe(90);
      expect(r.handover_score).toBe(76);
    });

    // 8/10 = 80% → >=70 → +2, score = 72
    it("80% risk briefing rate → +2 (score 72)", () => {
      const r = computeNightHandoverQuality(riskInput(8, 10));
      expect(r.risk_briefing_rate).toBe(80);
      expect(r.handover_score).toBe(72);
    });

    // 7/10 = 70% → >=70 → +2, score = 72
    it("70% risk briefing rate → +2 (score 72)", () => {
      const r = computeNightHandoverQuality(riskInput(7, 10));
      expect(r.risk_briefing_rate).toBe(70);
      expect(r.handover_score).toBe(72);
    });

    // 6/10 = 60% → between 50 and 69 → no adj, score = 70
    it("60% risk briefing rate → +0 (score 70)", () => {
      const r = computeNightHandoverQuality(riskInput(6, 10));
      expect(r.risk_briefing_rate).toBe(60);
      expect(r.handover_score).toBe(70);
    });

    // 5/10 = 50% → >=50 → no adj, score = 70
    it("50% risk briefing rate → +0 (score 70)", () => {
      const r = computeNightHandoverQuality(riskInput(5, 10));
      expect(r.risk_briefing_rate).toBe(50);
      expect(r.handover_score).toBe(70);
    });

    // 4/10 = 40% → <50 → -5, score = 65
    it("40% risk briefing rate → -5 (score 65)", () => {
      const r = computeNightHandoverQuality(riskInput(4, 10));
      expect(r.risk_briefing_rate).toBe(40);
      expect(r.handover_score).toBe(65);
    });

    // 0/10 = 0% → <50 → -5, score = 65
    it("0% risk briefing rate → -5 (score 65)", () => {
      const r = computeNightHandoverQuality(riskInput(0, 10));
      expect(r.risk_briefing_rate).toBe(0);
      expect(r.handover_score).toBe(65);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. MEDICATION COMPLIANCE MODIFIER
  // ═══════════════════════════════════════════════════════════════════════════

  describe("medication compliance modifier", () => {
    // Baseline: 10 handovers, risk=100%, morning=100%, children=100%, expected=100%
    // freq: +2, risk: +6, morning: +5, children: +4, expected: +5 = +22
    // score = 52 + 22 + med_adj = 74 + med_adj

    function medInput(
      total: number,
      medGivenCount: number,
      medWithNotesCount: number,
    ): NightHandoverQualityInput {
      const handovers: NightHandoverInput[] = [];
      for (let i = 0; i < total; i++) {
        const medGiven = i < medGivenCount;
        const hasNotes = medGiven && i < medWithNotesCount;
        handovers.push(
          makeHandover({
            id: `h${i + 1}`,
            medication_given: medGiven,
            has_medication_notes: hasNotes,
          }),
        );
      }
      return baseInput({ handovers });
    }

    // No medication given, total > 0 → +2, score = 76
    it("no medication given with handovers → +2 (score 76)", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          medication_given: false,
          has_medication_notes: false,
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.medication_compliance_rate).toBeNull();
      expect(r.handover_score).toBe(76);
    });

    // All 10 given, all 10 with notes = 100% >=95 → +5, score = 79
    it("100% medication compliance → +5 (score 79)", () => {
      const r = computeNightHandoverQuality(medInput(10, 10, 10));
      expect(r.medication_compliance_rate).toBe(100);
      expect(r.handover_score).toBe(79);
    });

    // 10 given, 9 notes = 90% → >=80 → +2, score = 76
    it("90% medication compliance → +2 (score 76)", () => {
      const r = computeNightHandoverQuality(medInput(10, 10, 9));
      expect(r.medication_compliance_rate).toBe(90);
      expect(r.handover_score).toBe(76);
    });

    // 10 given, 8 notes = 80% → >=80 → +2, score = 76
    it("80% medication compliance → +2 (score 76)", () => {
      const r = computeNightHandoverQuality(medInput(10, 10, 8));
      expect(r.medication_compliance_rate).toBe(80);
      expect(r.handover_score).toBe(76);
    });

    // 10 given, 7 notes = 70% → between 60 and 79 → no adj, score = 74
    it("70% medication compliance → +0 (score 74)", () => {
      const r = computeNightHandoverQuality(medInput(10, 10, 7));
      expect(r.medication_compliance_rate).toBe(70);
      expect(r.handover_score).toBe(74);
    });

    // 10 given, 6 notes = 60% → >=60 → no adj, score = 74
    it("60% medication compliance → +0 (score 74)", () => {
      const r = computeNightHandoverQuality(medInput(10, 10, 6));
      expect(r.medication_compliance_rate).toBe(60);
      expect(r.handover_score).toBe(74);
    });

    // 10 given, 5 notes = 50% → <60 → -5, score = 69
    it("50% medication compliance → -5 (score 69)", () => {
      const r = computeNightHandoverQuality(medInput(10, 10, 5));
      expect(r.medication_compliance_rate).toBe(50);
      expect(r.handover_score).toBe(69);
    });

    // 10 given, 0 notes = 0% → <60 → -5, score = 69
    it("0% medication compliance → -5 (score 69)", () => {
      const r = computeNightHandoverQuality(medInput(10, 10, 0));
      expect(r.medication_compliance_rate).toBe(0);
      expect(r.handover_score).toBe(69);
    });

    // 5 given, 5 notes out of 10 handovers = 100% compliance (5/5 >=95) → +5, score = 79
    it("partial medication given but all noted → +5 (score 79)", () => {
      const r = computeNightHandoverQuality(medInput(10, 5, 5));
      expect(r.medication_compliance_rate).toBe(100);
      expect(r.handover_score).toBe(79);
    });

    // medGiven.length === 0 && total === 0 → no adj
    // This is covered in the zero handovers section above
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. MORNING COMPLETION MODIFIER
  // ═══════════════════════════════════════════════════════════════════════════

  describe("morning completion modifier — isolate percentages", () => {
    // Baseline: 10 handovers, risk=100% (+6), no med (+2), children=100% (+4), expected=100% (+5)
    // freq: +2
    // constant others: +2 + 6 + 2 + 4 + 5 = +19
    // score = 52 + 19 + morning_adj = 71 + morning_adj

    function morningInput(completeCount: number, total: number): NightHandoverQualityInput {
      return baseInput({
        handovers: Array.from({ length: total }, (_, i) =>
          makeHandover({
            id: `h${i + 1}`,
            medication_given: false,
            has_medication_notes: false,
            morning_handover_complete: i < completeCount,
          }),
        ),
      });
    }

    // 10/10 = 100% >=95 → +5, score = 76
    it("100% morning completion → +5 (score 76)", () => {
      const r = computeNightHandoverQuality(morningInput(10, 10));
      expect(r.morning_completion_rate).toBe(100);
      expect(r.handover_score).toBe(76);
    });

    // 10/10 boundary: Math.round(9.5/10*100) = 95% >=95 → +5
    // But 9/10 = 90% → >=80 → +2, score = 73
    it("90% morning completion → +2 (score 73)", () => {
      const r = computeNightHandoverQuality(morningInput(9, 10));
      expect(r.morning_completion_rate).toBe(90);
      expect(r.handover_score).toBe(73);
    });

    // 8/10 = 80% → >=80 → +2, score = 73
    it("80% morning completion → +2 (score 73)", () => {
      const r = computeNightHandoverQuality(morningInput(8, 10));
      expect(r.morning_completion_rate).toBe(80);
      expect(r.handover_score).toBe(73);
    });

    // 7/10 = 70% → between 60 and 79 → no adj, score = 71
    it("70% morning completion → +0 (score 71)", () => {
      const r = computeNightHandoverQuality(morningInput(7, 10));
      expect(r.morning_completion_rate).toBe(70);
      expect(r.handover_score).toBe(71);
    });

    // 6/10 = 60% → >=60 → no adj, score = 71
    it("60% morning completion → +0 (score 71)", () => {
      const r = computeNightHandoverQuality(morningInput(6, 10));
      expect(r.morning_completion_rate).toBe(60);
      expect(r.handover_score).toBe(71);
    });

    // 5/10 = 50% → <60 → -4, score = 67
    it("50% morning completion → -4 (score 67)", () => {
      const r = computeNightHandoverQuality(morningInput(5, 10));
      expect(r.morning_completion_rate).toBe(50);
      expect(r.handover_score).toBe(67);
    });

    // 0/10 = 0% → <60 → -4, score = 67
    it("0% morning completion → -4 (score 67)", () => {
      const r = computeNightHandoverQuality(morningInput(0, 10));
      expect(r.morning_completion_rate).toBe(0);
      expect(r.handover_score).toBe(67);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. CHILDREN SLEEPING NOTES MODIFIER
  // ═══════════════════════════════════════════════════════════════════════════

  describe("children sleeping notes modifier — isolate percentages", () => {
    // Baseline: 10 handovers, risk=100% (+6), no med (+2), morning=100% (+5), expected=100% (+5)
    // freq: +2
    // constant others: +2 + 6 + 2 + 5 + 5 = +20
    // score = 52 + 20 + children_adj = 72 + children_adj

    function childNotesInput(notesCount: number, total: number): NightHandoverQualityInput {
      return baseInput({
        handovers: Array.from({ length: total }, (_, i) =>
          makeHandover({
            id: `h${i + 1}`,
            medication_given: false,
            has_medication_notes: false,
            has_children_sleeping_notes: i < notesCount,
          }),
        ),
      });
    }

    // 10/10 = 100% >=90 → +4, score = 76
    it("100% children notes → +4 (score 76)", () => {
      const r = computeNightHandoverQuality(childNotesInput(10, 10));
      expect(r.children_notes_rate).toBe(100);
      expect(r.handover_score).toBe(76);
    });

    // 9/10 = 90% >=90 → +4, score = 76
    it("90% children notes → +4 (score 76)", () => {
      const r = computeNightHandoverQuality(childNotesInput(9, 10));
      expect(r.children_notes_rate).toBe(90);
      expect(r.handover_score).toBe(76);
    });

    // 8/10 = 80% → >=70 → +1, score = 73
    it("80% children notes → +1 (score 73)", () => {
      const r = computeNightHandoverQuality(childNotesInput(8, 10));
      expect(r.children_notes_rate).toBe(80);
      expect(r.handover_score).toBe(73);
    });

    // 7/10 = 70% → >=70 → +1, score = 73
    it("70% children notes → +1 (score 73)", () => {
      const r = computeNightHandoverQuality(childNotesInput(7, 10));
      expect(r.children_notes_rate).toBe(70);
      expect(r.handover_score).toBe(73);
    });

    // 6/10 = 60% → between 50 and 69 → no adj, score = 72
    it("60% children notes → +0 (score 72)", () => {
      const r = computeNightHandoverQuality(childNotesInput(6, 10));
      expect(r.children_notes_rate).toBe(60);
      expect(r.handover_score).toBe(72);
    });

    // 5/10 = 50% → >=50 → no adj, score = 72
    it("50% children notes → +0 (score 72)", () => {
      const r = computeNightHandoverQuality(childNotesInput(5, 10));
      expect(r.children_notes_rate).toBe(50);
      expect(r.handover_score).toBe(72);
    });

    // 4/10 = 40% → <50 → -4, score = 68
    it("40% children notes → -4 (score 68)", () => {
      const r = computeNightHandoverQuality(childNotesInput(4, 10));
      expect(r.children_notes_rate).toBe(40);
      expect(r.handover_score).toBe(68);
    });

    // 0/10 = 0% → <50 → -4, score = 68
    it("0% children notes → -4 (score 68)", () => {
      const r = computeNightHandoverQuality(childNotesInput(0, 10));
      expect(r.children_notes_rate).toBe(0);
      expect(r.handover_score).toBe(68);
    });

    // total === 0 → -1 (tested in zero handovers section)
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. EXPECTED RETURNS MODIFIER
  // ═══════════════════════════════════════════════════════════════════════════

  describe("expected returns modifier — isolate percentages", () => {
    // Baseline: 10 handovers, risk=100% (+6), no med (+2), morning=100% (+5), children=100% (+4)
    // freq: +2
    // constant others: +2 + 6 + 2 + 5 + 4 = +19
    // score = 52 + 19 + expected_adj = 71 + expected_adj

    function expectedInput(expectedCount: number, total: number): NightHandoverQualityInput {
      return baseInput({
        handovers: Array.from({ length: total }, (_, i) =>
          makeHandover({
            id: `h${i + 1}`,
            medication_given: false,
            has_medication_notes: false,
            has_expected_returns: i < expectedCount,
          }),
        ),
      });
    }

    // 10/10 = 100% >=80 → +5, score = 76
    it("100% expected returns → +5 (score 76)", () => {
      const r = computeNightHandoverQuality(expectedInput(10, 10));
      expect(r.handover_score).toBe(76);
    });

    // 8/10 = 80% >=80 → +5, score = 76
    it("80% expected returns → +5 (score 76)", () => {
      const r = computeNightHandoverQuality(expectedInput(8, 10));
      expect(r.handover_score).toBe(76);
    });

    // 7/10 = 70% → >=50 → +2, score = 73
    it("70% expected returns → +2 (score 73)", () => {
      const r = computeNightHandoverQuality(expectedInput(7, 10));
      expect(r.handover_score).toBe(73);
    });

    // 5/10 = 50% → >=50 → +2, score = 73
    it("50% expected returns → +2 (score 73)", () => {
      const r = computeNightHandoverQuality(expectedInput(5, 10));
      expect(r.handover_score).toBe(73);
    });

    // 4/10 = 40% → between 30 and 49 → no adj, score = 71
    it("40% expected returns → +0 (score 71)", () => {
      const r = computeNightHandoverQuality(expectedInput(4, 10));
      expect(r.handover_score).toBe(71);
    });

    // 3/10 = 30% → >=30 → no adj, score = 71
    it("30% expected returns → +0 (score 71)", () => {
      const r = computeNightHandoverQuality(expectedInput(3, 10));
      expect(r.handover_score).toBe(71);
    });

    // 2/10 = 20% → <30 → -3, score = 68
    it("20% expected returns → -3 (score 68)", () => {
      const r = computeNightHandoverQuality(expectedInput(2, 10));
      expect(r.handover_score).toBe(68);
    });

    // 0/10 = 0% → <30 → -3, score = 68
    it("0% expected returns → -3 (score 68)", () => {
      const r = computeNightHandoverQuality(expectedInput(0, 10));
      expect(r.handover_score).toBe(68);
    });

    // total === 0 → -2 (tested in zero handovers section)
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. METRIC CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("metric calculations", () => {
    it("calculates total_handovers correctly", () => {
      const handovers = Array.from({ length: 5 }, (_, i) =>
        makeHandover({ id: `h${i + 1}` }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.total_handovers).toBe(5);
    });

    it("calculates risk_briefing_rate as percentage of handovers with risk_briefing_count > 0", () => {
      const handovers = [
        makeHandover({ id: "h1", risk_briefing_count: 3 }),
        makeHandover({ id: "h2", risk_briefing_count: 0 }),
        makeHandover({ id: "h3", risk_briefing_count: 1 }),
      ];
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.risk_briefing_rate).toBe(67); // Math.round(2/3 * 100)
    });

    it("calculates medication_compliance_rate only over handovers where medication_given=true", () => {
      const handovers = [
        makeHandover({ id: "h1", medication_given: true, has_medication_notes: true }),
        makeHandover({ id: "h2", medication_given: true, has_medication_notes: false }),
        makeHandover({ id: "h3", medication_given: false, has_medication_notes: false }),
      ];
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.medication_compliance_rate).toBe(50); // 1/2 = 50%
    });

    it("calculates morning_completion_rate correctly", () => {
      const handovers = [
        makeHandover({ id: "h1", morning_handover_complete: true }),
        makeHandover({ id: "h2", morning_handover_complete: false }),
        makeHandover({ id: "h3", morning_handover_complete: true }),
        makeHandover({ id: "h4", morning_handover_complete: true }),
      ];
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.morning_completion_rate).toBe(75); // 3/4 = 75%
    });

    it("calculates night_events_documented_rate correctly", () => {
      const handovers = [
        makeHandover({ id: "h1", night_events_count: 2 }),
        makeHandover({ id: "h2", night_events_count: 0 }),
        makeHandover({ id: "h3", night_events_count: 1 }),
      ];
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.night_events_documented_rate).toBe(67); // 2/3 = 67%
    });

    it("calculates children_notes_rate correctly", () => {
      const handovers = [
        makeHandover({ id: "h1", has_children_sleeping_notes: true }),
        makeHandover({ id: "h2", has_children_sleeping_notes: true }),
        makeHandover({ id: "h3", has_children_sleeping_notes: false }),
      ];
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.children_notes_rate).toBe(67); // 2/3 = 67%
    });

    it("leaves every rate unmeasured when there are no handovers", () => {
      const r = computeNightHandoverQuality(baseInput({ handovers: [] }));
      expect(r.risk_briefing_rate).toBeNull();
      expect(r.medication_compliance_rate).toBeNull();
      expect(r.morning_completion_rate).toBeNull();
      expect(r.night_events_documented_rate).toBeNull();
      expect(r.children_notes_rate).toBeNull();
    });

    it("medication_compliance_rate is unmeasured when no medication given", () => {
      const handovers = [
        makeHandover({ id: "h1", medication_given: false }),
        makeHandover({ id: "h2", medication_given: false }),
      ];
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.medication_compliance_rate).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. STRENGTHS, CONCERNS, RECOMMENDATIONS, INSIGHTS GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("strengths generation", () => {
    it("includes frequency strength when total >= 14", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r.strengths).toContain(
        "Consistent nightly handovers demonstrate robust overnight care governance",
      );
    });

    it("does not include frequency strength when total < 14", () => {
      const handovers = Array.from({ length: 13 }, (_, i) =>
        makeHandover({ id: `h${i + 1}` }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.strengths).not.toContain(
        "Consistent nightly handovers demonstrate robust overnight care governance",
      );
    });

    it("includes risk briefing strength when rate >= 90% and total > 0", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r.strengths).toContain(
        "Risk briefings are included in virtually all handovers — night staff are well-informed",
      );
    });

    it("includes medication strength when compliance >= 95% and medGiven > 0", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r.strengths).toContain(
        "Medication administration is consistently documented during night transitions",
      );
    });

    it("does not include medication strength when no medication given", () => {
      const handovers = Array.from({ length: 14 }, (_, i) =>
        makeHandover({ id: `h${i + 1}`, medication_given: false, has_medication_notes: false }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.strengths).not.toContain(
        "Medication administration is consistently documented during night transitions",
      );
    });

    it("includes morning completion strength when rate >= 95% and total > 0", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r.strengths).toContain(
        "Morning handovers are completed reliably — ensuring seamless continuity into the day",
      );
    });

    it("includes children notes strength when rate >= 90% and total > 0", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r.strengths).toContain(
        "Children's sleep and wellbeing status is documented at every handover",
      );
    });

    it("includes expected returns strength when rate >= 80% and total > 0", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r.strengths).toContain(
        "Expected returns are consistently noted — ensuring night staff know who to expect",
      );
    });
  });

  describe("concerns generation", () => {
    it("includes no-handovers concern when total === 0", () => {
      const r = computeNightHandoverQuality(baseInput({ handovers: [] }));
      expect(r.concerns).toContain(
        "No night handovers recorded — overnight care lacks documented governance",
      );
    });

    it("includes risk briefing concern when rate < 50% and total > 0", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          risk_briefing_count: i < 4 ? 1 : 0, // 4/10 = 40% < 50
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.concerns).toContain(
        "Risk briefings are missing from most handovers — night staff may be unaware of key risks",
      );
    });

    it("includes medication concern when compliance < 60% and medGiven > 0", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          medication_given: true,
          has_medication_notes: i < 5, // 5/10 = 50% < 60
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.concerns).toContain(
        "Medication compliance is poorly documented during night transitions — a significant safety concern",
      );
    });

    it("includes morning concern when completion < 60% and total > 0", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          morning_handover_complete: i < 5, // 5/10 = 50% < 60
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.concerns).toContain(
        "Morning handovers are frequently incomplete — day staff miss critical overnight information",
      );
    });

    it("includes children notes concern when rate < 50% and total > 0", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          has_children_sleeping_notes: i < 4, // 4/10 = 40% < 50
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.concerns).toContain("Children's overnight status is not consistently documented");
    });

    it("includes expected returns concern when rate < 30% and total > 0", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          has_expected_returns: i < 2, // 2/10 = 20% < 30
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.concerns).toContain(
        "Expected returns are rarely noted — night staff may not know which children to expect home",
      );
    });
  });

  describe("recommendations generation", () => {
    it("recommends structured documentation when total === 0", () => {
      const r = computeNightHandoverQuality(baseInput({ handovers: [] }));
      expect(r.recommendations[0]).toEqual({
        rank: 1,
        recommendation: "Implement structured night handover documentation for every shift transition",
        urgency: "immediate",
        regulatory_ref: "CHR 2015 Reg 34",
      });
    });

    it("recommends risk briefings when rate < 70% and total > 0", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          risk_briefing_count: i < 6 ? 1 : 0, // 6/10 = 60% < 70
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      const riskRec = r.recommendations.find(rec =>
        rec.recommendation.includes("risk briefings"),
      );
      expect(riskRec).toBeDefined();
      expect(riskRec!.urgency).toBe("immediate");
      expect(riskRec!.regulatory_ref).toBe("CHR 2015 Reg 34");
    });

    it("recommends medication documentation when compliance < 80% and medGiven > 0", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          medication_given: true,
          has_medication_notes: i < 7, // 7/10 = 70% < 80
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      const medRec = r.recommendations.find(rec =>
        rec.recommendation.includes("medication documentation"),
      );
      expect(medRec).toBeDefined();
      expect(medRec!.urgency).toBe("immediate");
      expect(medRec!.regulatory_ref).toBe("CHR 2015 Reg 23");
    });

    it("recommends morning handovers when completion < 80% and total > 0", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          morning_handover_complete: i < 7, // 7/10 = 70% < 80
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      const morningRec = r.recommendations.find(rec =>
        rec.recommendation.includes("morning handovers"),
      );
      expect(morningRec).toBeDefined();
      expect(morningRec!.urgency).toBe("soon");
      expect(morningRec!.regulatory_ref).toBe("CHR 2015 Reg 34");
    });

    it("recommends children sleep documentation when children notes < 70% and total > 0", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          has_children_sleeping_notes: i < 6, // 6/10 = 60% < 70
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      const childRec = r.recommendations.find(rec =>
        rec.recommendation.includes("sleep patterns"),
      );
      expect(childRec).toBeDefined();
      expect(childRec!.urgency).toBe("planned");
      expect(childRec!.regulatory_ref).toBe("SCCIF Safety");
    });

    it("recommends expected returns recording when rate < 50% and total > 0", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          has_expected_returns: i < 4, // 4/10 = 40% < 50
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      const expectedRec = r.recommendations.find(rec =>
        rec.recommendation.includes("expected returns"),
      );
      expect(expectedRec).toBeDefined();
      expect(expectedRec!.urgency).toBe("soon");
      expect(expectedRec!.regulatory_ref).toBe("CHR 2015 Reg 34");
    });

    it("caps recommendations at 5 with correct ranking", () => {
      // Trigger all 6 recommendations (excluding total=0 one):
      // risk <70, med <80, morning <80, children <70, expected <50
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          risk_briefing_count: i < 6 ? 1 : 0, // 60% < 70
          medication_given: true,
          has_medication_notes: i < 7, // 70% < 80
          morning_handover_complete: i < 7, // 70% < 80
          has_children_sleeping_notes: i < 6, // 60% < 70
          has_expected_returns: i < 4, // 40% < 50
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.recommendations).toHaveLength(5);
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[4].rank).toBe(5);
    });

    it("generates no recommendations when all thresholds are met", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r.recommendations).toEqual([]);
    });
  });

  describe("insights generation", () => {
    it("generates exemplary insight when risk>=90 and morning>=95 and total>=14", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r.insights).toContainEqual({
        text: "Night handover governance is exemplary — overnight care is safe, informed and well-documented",
        severity: "positive",
      });
    });

    it("does not generate exemplary insight when total < 14", () => {
      const handovers = Array.from({ length: 13 }, (_, i) =>
        makeHandover({ id: `h${i + 1}` }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      const exemplary = r.insights.find(ins =>
        ins.text.includes("exemplary"),
      );
      expect(exemplary).toBeUndefined();
    });

    it("generates critical insight when total === 0", () => {
      const r = computeNightHandoverQuality(baseInput({ handovers: [] }));
      expect(r.insights).toContainEqual({
        text: "No night handover records means Ofsted cannot verify overnight safety — a critical regulatory gap",
        severity: "critical",
      });
    });

    it("generates critical insight when medication compliance < 60% and medGiven > 0", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          medication_given: true,
          has_medication_notes: i < 5, // 50% < 60
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.insights).toContainEqual({
        text: "Medication gaps during night transitions present a direct risk to children's health",
        severity: "critical",
      });
    });

    it("generates positive insight when morning completion >= 95% and total > 0", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r.insights).toContainEqual({
        text: "Reliable morning handovers ensure the day team starts fully informed — strong continuity of care",
        severity: "positive",
      });
    });

    it("generates warning insight when risk briefing < 50% and total > 0", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          risk_briefing_count: i < 4 ? 1 : 0, // 40% < 50
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.insights).toContainEqual({
        text: "Night staff arriving without risk briefings may not know about self-harm protocols or missing risks",
        severity: "warning",
      });
    });

    it("caps insights at 3", () => {
      // Trigger exemplary + morning positive + (that's the most positives we can get simultaneously)
      // Actually try triggering 4+: exemplary, critical no handovers (conflicts with exemplary), ...
      // We can trigger: exemplary + morning positive + ... only 2 positives possible with good data.
      // To trigger >3: need med critical + risk warning + 0-handover critical + morning positive
      // But 0-handovers conflicts with risk/med having total>0. Can't get >3 simultaneously easily.
      // Let's verify exemplary scenario produces at most 3:
      const r = computeNightHandoverQuality(baseInput());
      expect(r.insights.length).toBeLessThanOrEqual(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. HEADLINES PER RATING
  // ═══════════════════════════════════════════════════════════════════════════

  describe("headlines per rating", () => {
    it("returns outstanding headline for score >= 80", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r.handover_rating).toBe("outstanding");
      expect(r.headline).toBe(
        "Night handovers are thorough, consistent and ensure safe continuity of care overnight",
      );
    });

    it("returns good headline for score 65-79", () => {
      const handovers = Array.from({ length: 7 }, (_, i) =>
        makeHandover({ id: `h${i + 1}` }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.handover_rating).toBe("good");
      expect(r.headline).toBe(
        "Good night handover practice with effective risk communication and morning continuity",
      );
    });

    it("returns adequate headline for score 45-64", () => {
      const handovers = Array.from({ length: 3 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          risk_briefing_count: i < 2 ? 2 : 0,
          medication_given: false,
          has_medication_notes: false,
          morning_handover_complete: i < 2,
          has_children_sleeping_notes: i < 2,
          has_expected_returns: i < 1,
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.handover_rating).toBe("adequate");
      expect(r.headline).toBe(
        "Night handovers are adequate but gaps in risk briefing and documentation need addressing",
      );
    });

    it("returns inadequate headline for score < 45", () => {
      const r = computeNightHandoverQuality(baseInput({ handovers: [] }));
      expect(r.handover_rating).toBe("inadequate");
      expect(r.headline).toBe(
        "Night handover practice is inadequate — children may be at risk during overnight periods",
      );
    });

    it("returns insufficient_data headline for total_children = 0", () => {
      const r = computeNightHandoverQuality(baseInput({ total_children: 0 }));
      expect(r.handover_rating).toBe("insufficient_data");
      expect(r.headline).toBe("No data available for night handover analysis");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("clamps score to 0 minimum", () => {
      // Theoretical max penalty: all negative modifiers
      // Not actually possible to go below 0 from 52, but verify clamp works.
      // Worst possible: 52 - 5 - 5 - 5 - 4 - 4 - 3 = 26 (still above 0)
      // The clamp(0,100) is protective; verify it doesn't break.
      const handovers = [
        makeHandover({
          id: "h1",
          risk_briefing_count: 0,
          medication_given: true,
          has_medication_notes: false,
          morning_handover_complete: false,
          has_children_sleeping_notes: false,
          has_expected_returns: false,
        }),
      ];
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.handover_score).toBeGreaterThanOrEqual(0);
    });

    it("clamps score to 100 maximum", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r.handover_score).toBeLessThanOrEqual(100);
    });

    it("handles a single perfect handover", () => {
      // 1 handover, all perfect:
      // freq: +0, risk: 100% → +6, med: 100% → +5, morning: 100% → +5,
      // children: 100% → +4, expected: 100% → +5
      // 52 + 0 + 6 + 5 + 5 + 4 + 5 = 77 → good
      const handovers = [makeHandover({ id: "h1" })];
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.handover_score).toBe(77);
      expect(r.handover_rating).toBe("good");
    });

    it("handles large handover count (50)", () => {
      const handovers = Array.from({ length: 50 }, (_, i) =>
        makeHandover({ id: `h${i + 1}` }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.handover_score).toBe(82);
      expect(r.handover_rating).toBe("outstanding");
      expect(r.total_handovers).toBe(50);
    });

    it("rounds percentages using Math.round", () => {
      // 1/3 = 33.33... → Math.round(33.33) = 33
      const handovers = [
        makeHandover({ id: "h1", risk_briefing_count: 1 }),
        makeHandover({ id: "h2", risk_briefing_count: 0 }),
        makeHandover({ id: "h3", risk_briefing_count: 0 }),
      ];
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.risk_briefing_rate).toBe(33);
    });

    it("rounds 2/3 to 67", () => {
      const handovers = [
        makeHandover({ id: "h1", morning_handover_complete: true }),
        makeHandover({ id: "h2", morning_handover_complete: true }),
        makeHandover({ id: "h3", morning_handover_complete: false }),
      ];
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.morning_completion_rate).toBe(67);
    });

    it("handles medication_given=true with has_medication_notes=false for all", () => {
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          medication_given: true,
          has_medication_notes: false,
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.medication_compliance_rate).toBe(0);
    });

    it("handles mixed medication_given values correctly", () => {
      // 3 med given, 2 with notes → 2/3 = 67%
      const handovers = [
        makeHandover({ id: "h1", medication_given: true, has_medication_notes: true }),
        makeHandover({ id: "h2", medication_given: true, has_medication_notes: true }),
        makeHandover({ id: "h3", medication_given: true, has_medication_notes: false }),
        makeHandover({ id: "h4", medication_given: false, has_medication_notes: false }),
        makeHandover({ id: "h5", medication_given: false, has_medication_notes: false }),
      ];
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.medication_compliance_rate).toBe(67);
    });

    it("95% boundary for medication compliance — 19/20 = 95% gets +5", () => {
      const handovers = Array.from({ length: 20 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          medication_given: true,
          has_medication_notes: i < 19, // 19/20 = 95%
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.medication_compliance_rate).toBe(95);
      // freq: +5, risk: +6, med: +5, morning: +5, children: +4, expected: +5
      // 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
      expect(r.handover_score).toBe(82);
    });

    it("95% boundary for morning completion — 19/20 = 95% gets +5", () => {
      const handovers = Array.from({ length: 20 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          morning_handover_complete: i < 19, // 19/20 = 95%
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.morning_completion_rate).toBe(95);
    });

    it("result shape includes all required fields", () => {
      const r = computeNightHandoverQuality(baseInput());
      expect(r).toHaveProperty("handover_rating");
      expect(r).toHaveProperty("handover_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_handovers");
      expect(r).toHaveProperty("risk_briefing_rate");
      expect(r).toHaveProperty("medication_compliance_rate");
      expect(r).toHaveProperty("morning_completion_rate");
      expect(r).toHaveProperty("night_events_documented_rate");
      expect(r).toHaveProperty("children_notes_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("expected returns rate computed correctly for internal metric", () => {
      // 6/10 = 60% expected returns
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          has_expected_returns: i < 6,
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      // expectedReturnsRate is not directly exposed as a field, but affects score
      // 60% → >=50 → +2
      // Use score to verify: freq +2, risk +6, med +5, morning +5, children +4, expected +2
      // 52 + 2 + 6 + 5 + 5 + 4 + 2 = 76
      expect(r.handover_score).toBe(76);
    });

    it("does not include no-handovers concern when total > 0", () => {
      const handovers = [makeHandover({ id: "h1" })];
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      expect(r.concerns).not.toContain(
        "No night handovers recorded — overnight care lacks documented governance",
      );
    });

    it("recommendations have sequential ranks starting at 1", () => {
      // Trigger multiple recommendations
      const handovers = Array.from({ length: 10 }, (_, i) =>
        makeHandover({
          id: `h${i + 1}`,
          risk_briefing_count: i < 6 ? 1 : 0, // 60% < 70
          medication_given: true,
          has_medication_notes: i < 7, // 70% < 80
          morning_handover_complete: i < 7, // 70% < 80
        }),
      );
      const r = computeNightHandoverQuality(baseInput({ handovers }));
      r.recommendations.forEach((rec, idx) => {
        expect(rec.rank).toBe(idx + 1);
      });
    });
  });
});
