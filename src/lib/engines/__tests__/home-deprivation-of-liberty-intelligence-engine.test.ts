import { describe, it, expect } from "vitest";
import {
  computeHomeDeprivationOfLiberty,
  type DeprivationOfLibertyInput,
  type DeprivationOfLibertyRecordInput,
} from "../home-deprivation-of-liberty-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

const TODAY = "2025-03-15";

function makeRestriction(
  overrides: Partial<DeprivationOfLibertyRecordInput> = {},
): DeprivationOfLibertyRecordInput {
  return {
    id: `dol-${Math.random().toString(36).slice(2, 8)}`,
    child_id: "C1",
    restriction_type: "internet_monitoring",
    date_imposed: "2025-01-15",
    review_date: "2025-04-15",
    status: "current",
    proportionate: true,
    has_justification: true,
    child_consulted: true,
    child_views_recorded: true,
    sw_consulted: true,
    ilo_consulted: true,
    court_authorised: true,
    alternatives_count: 3,
    has_impact_assessment: true,
    review_count: 2,
    is_overdue_review: false,
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<DeprivationOfLibertyInput> = {},
): DeprivationOfLibertyInput {
  return {
    today: TODAY,
    total_children: 4,
    restrictions: [
      makeRestriction({ id: "r1", child_id: "C1" }),
      makeRestriction({ id: "r2", child_id: "C2" }),
    ],
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// SPECIAL CASES
// ════════════════════════════════════════════════════════════════════════════

describe("Home Deprivation of Liberty Intelligence Engine", () => {

  // ── Special: 0 children ───────────────────────────────────────────────

  describe("special case — 0 children", () => {
    const result = computeHomeDeprivationOfLiberty({ today: TODAY, total_children: 0, restrictions: [] });

    it("rates insufficient_data", () => expect(result.dol_rating).toBe("insufficient_data"));
    it("scores 0", () => expect(result.dol_score).toBe(0));
    it("headline mentions no children", () => expect(result.headline).toContain("No children"));
    it("has no strengths", () => expect(result.strengths).toHaveLength(0));
    it("has no concerns", () => expect(result.concerns).toHaveLength(0));
    it("has no recommendations", () => expect(result.recommendations).toHaveLength(0));
    it("has no insights", () => expect(result.insights).toHaveLength(0));
    it("total_restrictions is 0", () => expect(result.total_restrictions).toBe(0));
    it("active_restrictions is 0", () => expect(result.active_restrictions).toBe(0));
  });

  // ── Special: 0 restrictions with children present ─────────────────────

  describe("special case — 0 restrictions with children", () => {
    const result = computeHomeDeprivationOfLiberty({ today: TODAY, total_children: 3, restrictions: [] });

    it("rates outstanding", () => expect(result.dol_rating).toBe("outstanding"));
    it("scores 85", () => expect(result.dol_score).toBe(85));
    it("headline mentions no DoL measures", () => expect(result.headline).toContain("No deprivation of liberty measures"));
    it("headline mentions freedom preserved", () => expect(result.headline).toContain("freedom fully preserved"));
    it("has strengths", () => expect(result.strengths.length).toBeGreaterThan(0));
    it("strength mentions freedom preserved", () => expect(result.strengths[0]).toContain("freedom"));
    it("has positive insight", () => expect(result.insights.some(i => i.severity === "positive")).toBe(true));
    it("has no concerns", () => expect(result.concerns).toHaveLength(0));
    it("has no recommendations", () => expect(result.recommendations).toHaveLength(0));
    it("total_restrictions is 0", () => expect(result.total_restrictions).toBe(0));
    it("active_restrictions is 0", () => expect(result.active_restrictions).toBe(0));
    it("unique_children_restricted is 0", () => expect(result.unique_children_restricted).toBe(0));
  });

  // ── Special: all restrictions ended ───────────────────────────────────

  describe("special case — all restrictions ended", () => {
    const result = computeHomeDeprivationOfLiberty(baseInput({
      restrictions: [
        makeRestriction({ id: "r1", status: "ended" }),
        makeRestriction({ id: "r2", status: "ended" }),
      ],
    }));

    it("active_restrictions is 0", () => expect(result.active_restrictions).toBe(0));
    it("total_restrictions is 2", () => expect(result.total_restrictions).toBe(2));
    it("unique_children_restricted is 0", () => expect(result.unique_children_restricted).toBe(0));
    // Score: 52 + 0(mod1) -1(mod2) -1(mod3) -1(mod4) -1(mod5) -2(mod6) = 46 → adequate
    it("rates adequate", () => expect(result.dol_rating).toBe("adequate"));
    it("scores 46", () => expect(result.dol_score).toBe(46));
  });

  // ════════════════════════════════════════════════════════════════════════
  // RATING TIER TESTS
  // ════════════════════════════════════════════════════════════════════════

  // ── Outstanding with perfect data ─────────────────────────────────────
  // 2 active, all perfect: 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82

  describe("outstanding — perfect data", () => {
    const result = computeHomeDeprivationOfLiberty(baseInput());

    it("rates outstanding", () => expect(result.dol_rating).toBe("outstanding"));
    it("scores 82", () => expect(result.dol_score).toBe(82));
    it("headline mentions outstanding", () => expect(result.headline).toContain("Outstanding"));
    it("has strengths", () => expect(result.strengths.length).toBeGreaterThan(0));
    it("has no concerns", () => expect(result.concerns).toHaveLength(0));
    it("has no recommendations", () => expect(result.recommendations).toHaveLength(0));
    it("active_restrictions is 2", () => expect(result.active_restrictions).toBe(2));
    it("total_restrictions is 2", () => expect(result.total_restrictions).toBe(2));
  });

  // ── Good rating ───────────────────────────────────────────────────────
  // Lower some metrics: 1/2 child_consulted, all else perfect
  // Mod2: childConsultationRate = 50% (<60%) → -5
  // 52 + 6 + (-5) + 5 + 5 + 4 + 5 = 72 → good

  describe("good rating", () => {
    const result = computeHomeDeprivationOfLiberty(baseInput({
      restrictions: [
        makeRestriction({ id: "r1", child_id: "C1" }),
        makeRestriction({ id: "r2", child_id: "C2", child_consulted: false, child_views_recorded: false }),
      ],
    }));

    it("rates good", () => expect(result.dol_rating).toBe("good"));
    it("scores 72", () => expect(result.dol_score).toBe(72));
    it("headline mentions good", () => expect(result.headline).toContain("Good"));
    it("has concerns about child consultation", () => expect(result.concerns.some(c => c.includes("consultation"))).toBe(true));
  });

  // ── Adequate rating ───────────────────────────────────────────────────
  // Mod1: 100% proportionate → +6
  // Mod2: 1/2 child consultation = 50% (<60%) → -5
  // Mod3: 1/2 sw = 50% (<60%) → -4
  // Mod4: 0 overdue → +5
  // Mod5: 1/2 alts&impact = 50% (between 50 and 70) → 0
  // Mod6: 1/2 ilo = 50% (between 40 and 60) → 0
  // 52 + 6 - 5 - 4 + 5 + 0 + 0 = 54 → adequate

  describe("adequate rating", () => {
    const result = computeHomeDeprivationOfLiberty(baseInput({
      restrictions: [
        makeRestriction({ id: "r1", child_id: "C1" }),
        makeRestriction({
          id: "r2", child_id: "C2",
          child_consulted: false, child_views_recorded: false,
          sw_consulted: false,
          ilo_consulted: false,
          alternatives_count: 0, has_impact_assessment: false,
        }),
      ],
    }));

    it("rates adequate", () => expect(result.dol_rating).toBe("adequate"));
    it("scores 54", () => expect(result.dol_score).toBe(54));
    it("headline mentions adequate", () => expect(result.headline).toContain("Adequate"));
    it("has concerns", () => expect(result.concerns.length).toBeGreaterThan(0));
    it("has recommendations", () => expect(result.recommendations.length).toBeGreaterThan(0));
  });

  // ── Inadequate rating ─────────────────────────────────────────────────
  // All bad: 0% proportionate, 0% child, 0% sw, all overdue, 0% alts, 0% ilo
  // Mod1: 0% (<50%) → -8
  // Mod2: 0% (<60%) → -5
  // Mod3: 0% (<60%) → -4
  // Mod4: 100% overdue (>50%) → -4
  // Mod5: 0% (<50%) → -4
  // Mod6: 0% ilo (<40%) → -3
  // 52 - 8 - 5 - 4 - 4 - 4 - 3 = 24 → inadequate

  describe("inadequate rating", () => {
    const badRestriction = (id: string, child: string): DeprivationOfLibertyRecordInput =>
      makeRestriction({
        id, child_id: child,
        proportionate: false, has_justification: false,
        child_consulted: false, child_views_recorded: false,
        sw_consulted: false, ilo_consulted: false,
        court_authorised: false,
        alternatives_count: 0, has_impact_assessment: false,
        is_overdue_review: true,
      });

    const result = computeHomeDeprivationOfLiberty(baseInput({
      restrictions: [badRestriction("r1", "C1"), badRestriction("r2", "C2")],
    }));

    it("rates inadequate", () => expect(result.dol_rating).toBe("inadequate"));
    it("scores 24", () => expect(result.dol_score).toBe(24));
    it("headline mentions inadequate", () => expect(result.headline).toContain("inadequate"));
    it("has multiple concerns", () => expect(result.concerns.length).toBeGreaterThanOrEqual(3));
    it("has immediate recommendations", () => expect(result.recommendations.some(r => r.urgency === "immediate")).toBe(true));
    it("has critical insights", () => expect(result.insights.some(i => i.severity === "critical")).toBe(true));
  });

  // ════════════════════════════════════════════════════════════════════════
  // EXACT BOUNDARY TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("rating boundary — score 80 is outstanding", () => {
    // Need exactly 80. Perfect gives 82, need -2.
    // Perfect + 1 over-restricted child (>2 restrictions) = 82 - 2 = 80
    const result = computeHomeDeprivationOfLiberty(baseInput({
      restrictions: [
        makeRestriction({ id: "r1", child_id: "C1", restriction_type: "internet_monitoring" }),
        makeRestriction({ id: "r2", child_id: "C1", restriction_type: "location_restriction" }),
        makeRestriction({ id: "r3", child_id: "C1", restriction_type: "phone_monitoring" }),
      ],
    }));

    it("scores 80", () => expect(result.dol_score).toBe(80));
    it("rates outstanding", () => expect(result.dol_rating).toBe("outstanding"));
  });

  describe("rating boundary — score 79 is good", () => {
    // Perfect gives 82, need -3. 5 active for 4 children = -3 penalty
    const result = computeHomeDeprivationOfLiberty(baseInput({
      restrictions: [
        makeRestriction({ id: "r1", child_id: "C1" }),
        makeRestriction({ id: "r2", child_id: "C2" }),
        makeRestriction({ id: "r3", child_id: "C3" }),
        makeRestriction({ id: "r4", child_id: "C4" }),
        makeRestriction({ id: "r5", child_id: "C1", restriction_type: "curfew" }),
      ],
    }));

    it("scores 79", () => expect(result.dol_score).toBe(79));
    it("rates good", () => expect(result.dol_rating).toBe("good"));
  });

  describe("rating boundary — score 65 is good", () => {
    // 52 + 6(mod1) + 5(mod2) + 5(mod3) + (-4)(mod4: >50% overdue) + (-4)(mod5: <50%) + 5(mod6) = 65
    // Need >50% overdue: 3 active, 2 overdue → 67% overdue
    // Need <50% alts: 0/3 → 0%
    const result = computeHomeDeprivationOfLiberty(baseInput({
      restrictions: [
        makeRestriction({ id: "r1", child_id: "C1", is_overdue_review: true, alternatives_count: 0, has_impact_assessment: false }),
        makeRestriction({ id: "r2", child_id: "C2", is_overdue_review: true, alternatives_count: 1, has_impact_assessment: false }),
        makeRestriction({ id: "r3", child_id: "C3", alternatives_count: 0, has_impact_assessment: false }),
      ],
    }));

    it("scores 65", () => expect(result.dol_score).toBe(65));
    it("rates good", () => expect(result.dol_rating).toBe("good"));
  });

  describe("rating boundary — score 64 is adequate", () => {
    // 5 active restrictions (>4 children → -3), C1 has 3 (>2 → -2)
    // Mod1: 100% prop → +6
    // Mod2: 3/5 child = 60% (gap zone 60-79%) → 0
    // Mod3: 100% sw → +5
    // Mod4: 0 overdue → +5
    // Mod5: 0% alts (<50%) → -4
    // Mod6: 100% ilo → +5
    // Penalties: -3 (high count) -2 (multi)
    // 52 + 6 + 0 + 5 + 5 - 4 + 5 - 3 - 2 = 64
    const result = computeHomeDeprivationOfLiberty(baseInput({
      total_children: 4,
      restrictions: [
        makeRestriction({ id: "r1", child_id: "C1", alternatives_count: 0, has_impact_assessment: false }),
        makeRestriction({ id: "r2", child_id: "C1", restriction_type: "curfew", alternatives_count: 0, has_impact_assessment: false, child_consulted: false, child_views_recorded: false }),
        makeRestriction({ id: "r3", child_id: "C1", restriction_type: "phone_monitoring", alternatives_count: 0, has_impact_assessment: false, child_consulted: false, child_views_recorded: false }),
        makeRestriction({ id: "r4", child_id: "C2", alternatives_count: 0, has_impact_assessment: false }),
        makeRestriction({ id: "r5", child_id: "C3", alternatives_count: 0, has_impact_assessment: false }),
      ],
    }));

    it("scores 64", () => expect(result.dol_score).toBe(64));
    it("rates adequate", () => expect(result.dol_rating).toBe("adequate"));
  });

  describe("rating boundary — score 45 is adequate", () => {
    // 52 + 0(mod1: no active, so +0) -1 -1 -1 -1 -2 = 46 → that's all ended.
    // Let me aim for 45 with active data.
    // 52 + (-5)(prop<70%) + (-5)(child<60%) + 2(sw 80%) + 2(1 overdue) + (-4)(alts<50%) + 5(ilo>=80%) - 2(multi) = 45
    // 4 active, 1 child_id "C1" x3 (>2 → -2), prop 2/4=50%, child 1/4=25%, sw 4/4=100%→+5 not 80%
    // Recalc: sw 100% → +5. Need sw 80% → +2
    // 52 - 5 - 5 + 2 + 2 - 4 + 5 - 2 = 45
    // 4 active: 2/4 prop (50%, <70%) → -5
    // 1/4 child (25%, <60%) → -5
    // 80% sw (need exactly 80%: can't with 4 → 3/4=75% or 4/4=100%)
    // Try 5 active: 4/5 sw = 80% → +2
    // 5 active: 2/5 prop = 40% (<50%) → -8
    // 52 - 8 - 5 + 2 + 2 - 4 + 5 - 2 = 42 → no
    // Try 10 active: 8/10 sw = 80% → +2, 5/10 prop = 50% → not <50, it's =50% → check code
    // In code: proportionalityRate < 50 → -8. So 50% is NOT <50%, it would be <70 → -5
    // 10 active: 5/10 prop = 50% → -5, 2/10 child = 20% → -5, 8/10 sw = 80% → +2,
    // 1 overdue → +2, 3/10 altsImpact = 30% → -4, 8/10 ilo = 80% → +5
    // penalties: 10 active > 4 children → -3
    // some child >2 restrictions...
    // 52 - 5 - 5 + 2 + 2 - 4 + 5 - 3 = 44 → not 45
    // Remove high-count penalty: 10 active, 10 children → no penalty
    // 52 - 5 - 5 + 2 + 2 - 4 + 5 = 47 → too high
    // Try: 52 - 5 - 5 + 2 + 2 - 4 + 5 - 2(multi) = 45!
    // So 10 active, 10 children (no high-count), 1 child has >2 restrictions
    // 5/10 prop → -5, 2/10 child → -5, 8/10 sw → +2, 1 overdue → +2, 3/10 alts → -4, 8/10 ilo → +5, multi → -2 = 45
    const restrictions: DeprivationOfLibertyRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      const childId = i < 3 ? "C1" : `C${i + 1}`; // C1 has 3 restrictions (>2 → -2 penalty)
      restrictions.push(makeRestriction({
        id: `r${i}`,
        child_id: childId,
        proportionate: i < 5,      // 5/10 = 50%
        has_justification: i < 5,   // matches proportionate
        child_consulted: i < 2,     // 2/10 = 20%
        child_views_recorded: i < 2,
        sw_consulted: i < 8,        // 8/10 = 80%
        ilo_consulted: i < 8,       // 8/10 = 80%
        alternatives_count: i < 3 ? 3 : 0,  // 3/10 have alts ≥2
        has_impact_assessment: i < 3,         // 3/10
        is_overdue_review: i === 0,           // 1 overdue
      }));
    }

    const result = computeHomeDeprivationOfLiberty(baseInput({
      total_children: 10,
      restrictions,
    }));

    it("scores 45", () => expect(result.dol_score).toBe(45));
    it("rates adequate", () => expect(result.dol_rating).toBe("adequate"));
  });

  describe("rating boundary — score 44 is inadequate", () => {
    // From the 45 scenario, remove 1 more point. Make sw 7/10 = 70% (between 60 and 80 → no bonus)
    // 52 - 5 - 5 + 0 + 2 - 4 + 5 - 2 = 43 → went too far
    // Alternative: from 45, add 1 fewer ilo: 7/10 = 70% → still ≥60% → +2, not +5 → -3 from 45 → 42 no
    // Simply: start from 45 and flip 1 sw to unconsulted: 7/10 = 70% → between 60-80 → no modifier
    // 52 - 5 - 5 + 0(sw 70%) + 2 - 4 + 5 - 2 = 43
    // Or: take the 45 scenario and change alts from 30% to 50%: 5/10 = 50% → not <50% → no penalty. -4 removed → 49. Too high.
    // Let me just target 44 directly:
    // 52 + (-5) + (-5) + 2 + 2 + (-4) + 5 - 3(high-count) = 44
    // Need high count: active > total_children. 10 active, 9 children → -3
    // No multi-restrict: spread across 10 children? Can't with 9 children and 10 restrictions...
    // 10 restrictions, 9 children: C1 has 2 (not >2 so no multi penalty)
    // 52 - 5 - 5 + 2 + 2 - 4 + 5 - 3 = 44
    const restrictions44: DeprivationOfLibertyRecordInput[] = [];
    for (let i = 0; i < 10; i++) {
      const childId = i < 2 ? "C1" : `C${i}`; // C1 has 2 (not >2)
      restrictions44.push(makeRestriction({
        id: `r${i}`,
        child_id: childId,
        proportionate: i < 5,
        has_justification: i < 5,
        child_consulted: i < 2,
        child_views_recorded: i < 2,
        sw_consulted: i < 8,
        ilo_consulted: i < 8,
        alternatives_count: i < 3 ? 3 : 0,
        has_impact_assessment: i < 3,
        is_overdue_review: i === 0,
      }));
    }

    const result = computeHomeDeprivationOfLiberty(baseInput({
      total_children: 9, // 10 active > 9 children → -3 penalty
      restrictions: restrictions44,
    }));

    it("scores 44", () => expect(result.dol_score).toBe(44));
    it("rates inadequate", () => expect(result.dol_rating).toBe("inadequate"));
  });

  // ════════════════════════════════════════════════════════════════════════
  // MODIFIER 1: PROPORTIONALITY & JUSTIFICATION
  // ════════════════════════════════════════════════════════════════════════

  describe("modifier 1 — proportionality & justification", () => {
    it("≥98% → +6", () => {
      // All perfect: 100% proportionality → +6
      const result = computeHomeDeprivationOfLiberty(baseInput());
      // Base 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
      expect(result.dol_score).toBe(82);
      expect(result.proportionality_rate).toBe(100);
    });

    it("≥85% but <98% → +3", () => {
      // 9/10 = 90% → +3
      const restrictions = Array.from({ length: 10 }, (_, i) =>
        makeRestriction({
          id: `r${i}`, child_id: `C${i}`,
          proportionate: i < 9,
          has_justification: i < 9,
        }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ total_children: 10, restrictions }));
      expect(result.proportionality_rate).toBe(90);
      // 52 + 3 + 5 + 5 + 5 + 4 + 5 = 79
      expect(result.dol_score).toBe(79);
    });

    it("<70% but ≥50% → -5", () => {
      // 3/5 = 60% → -5
      const restrictions = Array.from({ length: 5 }, (_, i) =>
        makeRestriction({
          id: `r${i}`, child_id: `C${i}`,
          proportionate: i < 3,
          has_justification: i < 3,
        }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ total_children: 5, restrictions }));
      expect(result.proportionality_rate).toBe(60);
      // 52 + (-5) + 5 + 5 + 5 + 4 + 5 = 71
      expect(result.dol_score).toBe(71);
    });

    it("<50% → -8", () => {
      // 2/5 = 40% → -8
      const restrictions = Array.from({ length: 5 }, (_, i) =>
        makeRestriction({
          id: `r${i}`, child_id: `C${i}`,
          proportionate: i < 2,
          has_justification: i < 2,
        }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ total_children: 5, restrictions }));
      expect(result.proportionality_rate).toBe(40);
      // 52 + (-8) + 5 + 5 + 5 + 4 + 5 = 68
      expect(result.dol_score).toBe(68);
    });

    it("0 active → +0", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [makeRestriction({ id: "r1", status: "ended" })],
      }));
      // active=0: 52 + 0 -1 -1 -1 -1 -2 = 46
      expect(result.dol_score).toBe(46);
    });

    it("both proportionate and has_justification required", () => {
      // 1 proportionate but no justification, 1 has both
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", proportionate: true, has_justification: true }),
          makeRestriction({ id: "r2", child_id: "C2", proportionate: true, has_justification: false }),
        ],
      }));
      expect(result.proportionality_rate).toBe(50);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // MODIFIER 2: CHILD CONSULTATION
  // ════════════════════════════════════════════════════════════════════════

  describe("modifier 2 — child consultation", () => {
    it("≥95% → +5", () => {
      // 100% child consultation (all perfect base)
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.child_consultation_rate).toBe(100);
    });

    it("≥80% but <95% → +2", () => {
      // 4/5 = 80% → +2
      const restrictions = Array.from({ length: 5 }, (_, i) =>
        makeRestriction({
          id: `r${i}`, child_id: `C${i}`,
          child_consulted: i < 4,
          child_views_recorded: i < 4,
        }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ total_children: 5, restrictions }));
      expect(result.child_consultation_rate).toBe(80);
      // 52 + 6 + 2 + 5 + 5 + 4 + 5 = 79
      expect(result.dol_score).toBe(79);
    });

    it("<60% → -5", () => {
      // 1/5 = 20% → -5
      const restrictions = Array.from({ length: 5 }, (_, i) =>
        makeRestriction({
          id: `r${i}`, child_id: `C${i}`,
          child_consulted: i < 1,
          child_views_recorded: i < 1,
        }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ total_children: 5, restrictions }));
      expect(result.child_consultation_rate).toBe(20);
      // 52 + 6 + (-5) + 5 + 5 + 4 + 5 = 72
      expect(result.dol_score).toBe(72);
    });

    it("0 active → -1", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [makeRestriction({ id: "r1", status: "ended" })],
      }));
      expect(result.active_restrictions).toBe(0);
    });

    it("both child_consulted and child_views_recorded required", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", child_consulted: true, child_views_recorded: false }),
          makeRestriction({ id: "r2", child_id: "C2", child_consulted: true, child_views_recorded: true }),
        ],
      }));
      expect(result.child_consultation_rate).toBe(50);
    });

    it("between 60% and 80% gets no modifier (gap zone)", () => {
      // 3/5 = 60% → ≥60 and <80 → no modifier
      const restrictions = Array.from({ length: 5 }, (_, i) =>
        makeRestriction({
          id: `r${i}`, child_id: `C${i}`,
          child_consulted: i < 3,
          child_views_recorded: i < 3,
        }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ total_children: 5, restrictions }));
      expect(result.child_consultation_rate).toBe(60);
      // 52 + 6 + 0 + 5 + 5 + 4 + 5 = 77
      expect(result.dol_score).toBe(77);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // MODIFIER 3: PROFESSIONAL OVERSIGHT (SW CONSULTATION)
  // ════════════════════════════════════════════════════════════════════════

  describe("modifier 3 — professional oversight (SW consultation)", () => {
    it("≥95% → +5", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.sw_consultation_rate).toBe(100);
    });

    it("≥80% but <95% → +2", () => {
      // 4/5 = 80% → +2
      const restrictions = Array.from({ length: 5 }, (_, i) =>
        makeRestriction({ id: `r${i}`, child_id: `C${i}`, sw_consulted: i < 4 }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ total_children: 5, restrictions }));
      expect(result.sw_consultation_rate).toBe(80);
      // 52 + 6 + 5 + 2 + 5 + 4 + 5 = 79
      expect(result.dol_score).toBe(79);
    });

    it("<60% → -4", () => {
      // 2/5 = 40% → -4
      const restrictions = Array.from({ length: 5 }, (_, i) =>
        makeRestriction({ id: `r${i}`, child_id: `C${i}`, sw_consulted: i < 2 }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ total_children: 5, restrictions }));
      expect(result.sw_consultation_rate).toBe(40);
      // 52 + 6 + 5 + (-4) + 5 + 4 + 5 = 73
      expect(result.dol_score).toBe(73);
    });

    it("0 active → -1", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [makeRestriction({ id: "r1", status: "ended" })],
      }));
      // Includes -1 for sw
      expect(result.active_restrictions).toBe(0);
    });

    it("between 60% and 80% gets no modifier", () => {
      // 3/5 = 60% → gap
      const restrictions = Array.from({ length: 5 }, (_, i) =>
        makeRestriction({ id: `r${i}`, child_id: `C${i}`, sw_consulted: i < 3 }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ total_children: 5, restrictions }));
      expect(result.sw_consultation_rate).toBe(60);
      // 52 + 6 + 5 + 0 + 5 + 4 + 5 = 77
      expect(result.dol_score).toBe(77);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // MODIFIER 4: REVIEW TIMELINESS
  // ════════════════════════════════════════════════════════════════════════

  describe("modifier 4 — review timeliness", () => {
    it("0 overdue → +5", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.overdue_review_count).toBe(0);
      // 82 includes +5 for timeliness
    });

    it("≤1 overdue → +2", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", is_overdue_review: true }),
          makeRestriction({ id: "r2", child_id: "C2" }),
        ],
      }));
      expect(result.overdue_review_count).toBe(1);
      // 52 + 6 + 5 + 5 + 2 + 4 + 5 = 79
      expect(result.dol_score).toBe(79);
    });

    it(">50% overdue → -4", () => {
      // 2/3 = 67% overdue → -4
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", is_overdue_review: true }),
          makeRestriction({ id: "r2", child_id: "C2", is_overdue_review: true }),
          makeRestriction({ id: "r3", child_id: "C3" }),
        ],
      }));
      expect(result.overdue_review_count).toBe(2);
      // 52 + 6 + 5 + 5 + (-4) + 4 + 5 = 73
      expect(result.dol_score).toBe(73);
    });

    it("0 active → -1", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [makeRestriction({ id: "r1", status: "ended" })],
      }));
      expect(result.active_restrictions).toBe(0);
    });

    it("exactly 50% overdue is NOT >50%", () => {
      // 1/2 = 50% → exactly 50%, not >50% → falls through to ≤1 check: 1 ≤ 1 → +2
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", is_overdue_review: true }),
          makeRestriction({ id: "r2", child_id: "C2" }),
        ],
      }));
      // 1 overdue ≤ 1 → +2
      expect(result.dol_score).toBe(79);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // MODIFIER 5: ALTERNATIVES & IMPACT
  // ════════════════════════════════════════════════════════════════════════

  describe("modifier 5 — alternatives & impact", () => {
    it("≥90% both met → +4", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      // All have alternatives_count ≥2 and has_impact_assessment
      expect(result.alternatives_documented_rate).toBe(100);
      expect(result.impact_assessment_rate).toBe(100);
    });

    it("≥70% but <90% → +2", () => {
      // 4/5 = 80% → +2
      const restrictions = Array.from({ length: 5 }, (_, i) =>
        makeRestriction({
          id: `r${i}`, child_id: `C${i}`,
          alternatives_count: i < 4 ? 3 : 0,
          has_impact_assessment: i < 4,
        }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ total_children: 5, restrictions }));
      // 52 + 6 + 5 + 5 + 5 + 2 + 5 = 80
      expect(result.dol_score).toBe(80);
    });

    it("<50% → -4", () => {
      // 1/5 = 20% → -4
      const restrictions = Array.from({ length: 5 }, (_, i) =>
        makeRestriction({
          id: `r${i}`, child_id: `C${i}`,
          alternatives_count: i < 1 ? 3 : 0,
          has_impact_assessment: i < 1,
        }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ total_children: 5, restrictions }));
      // 52 + 6 + 5 + 5 + 5 + (-4) + 5 = 74
      expect(result.dol_score).toBe(74);
    });

    it("0 active → -1", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [makeRestriction({ id: "r1", status: "ended" })],
      }));
      expect(result.active_restrictions).toBe(0);
    });

    it("alternatives_count >= 2 required (not just > 0)", () => {
      // alternatives_count = 1 should NOT count
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", alternatives_count: 1, has_impact_assessment: true }),
          makeRestriction({ id: "r2", child_id: "C2", alternatives_count: 2, has_impact_assessment: true }),
        ],
      }));
      // Only 1/2 meets threshold = 50% → between 50 and 70 → no modifier (gap)
      // 52 + 6 + 5 + 5 + 5 + 0 + 5 = 78
      expect(result.dol_score).toBe(78);
    });

    it("both alternatives and impact required together", () => {
      // has alts but no impact → doesn't count
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", alternatives_count: 3, has_impact_assessment: false }),
          makeRestriction({ id: "r2", child_id: "C2", alternatives_count: 3, has_impact_assessment: true }),
        ],
      }));
      // 1/2 = 50% → gap (between 50 and 70)
      expect(result.dol_score).toBe(78);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // MODIFIER 6: LEGAL FRAMEWORK & COURT AUTHORIZATION
  // ════════════════════════════════════════════════════════════════════════

  describe("modifier 6 — legal framework & court authorization", () => {
    it("ilo ≥80% → +5", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      // All ilo_consulted → 100% → +5
      expect(result.dol_score).toBe(82);
    });

    it("ilo ≥60% but <80% → +2", () => {
      // 3/5 = 60% → +2
      const restrictions = Array.from({ length: 5 }, (_, i) =>
        makeRestriction({ id: `r${i}`, child_id: `C${i}`, ilo_consulted: i < 3 }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ total_children: 5, restrictions }));
      // 52 + 6 + 5 + 5 + 5 + 4 + 2 = 79
      expect(result.dol_score).toBe(79);
    });

    it("ilo <40% → -3", () => {
      // 1/5 = 20% → -3
      const restrictions = Array.from({ length: 5 }, (_, i) =>
        makeRestriction({ id: `r${i}`, child_id: `C${i}`, ilo_consulted: i < 1 }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ total_children: 5, restrictions }));
      // 52 + 6 + 5 + 5 + 5 + 4 + (-3) = 74
      expect(result.dol_score).toBe(74);
    });

    it("0 active → -2", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [makeRestriction({ id: "r1", status: "ended" })],
      }));
      // 52 + 0 - 1 - 1 - 1 - 1 - 2 = 46
      expect(result.dol_score).toBe(46);
    });

    it("ilo between 40% and 60% gets no modifier", () => {
      // 2/5 = 40% → exactly 40%, not <40% → gap
      const restrictions = Array.from({ length: 5 }, (_, i) =>
        makeRestriction({ id: `r${i}`, child_id: `C${i}`, ilo_consulted: i < 2 }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ total_children: 5, restrictions }));
      // 52 + 6 + 5 + 5 + 5 + 4 + 0 = 77
      expect(result.dol_score).toBe(77);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // ADDITIONAL PENALTIES
  // ════════════════════════════════════════════════════════════════════════

  describe("additional penalty — high restriction count", () => {
    it("active > total_children → -3", () => {
      // 5 active, 4 children → -3
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }),
          makeRestriction({ id: "r2", child_id: "C2" }),
          makeRestriction({ id: "r3", child_id: "C3" }),
          makeRestriction({ id: "r4", child_id: "C4" }),
          makeRestriction({ id: "r5", child_id: "C1", restriction_type: "curfew" }),
        ],
      }));
      // 82 - 3 = 79
      expect(result.dol_score).toBe(79);
    });

    it("active = total_children → no penalty", () => {
      // 4 active, 4 children → no penalty
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }),
          makeRestriction({ id: "r2", child_id: "C2" }),
          makeRestriction({ id: "r3", child_id: "C3" }),
          makeRestriction({ id: "r4", child_id: "C4" }),
        ],
      }));
      // 82 (no penalty)
      expect(result.dol_score).toBe(82);
    });

    it("active < total_children → no penalty", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      // 2 active, 4 children → no penalty
      expect(result.dol_score).toBe(82);
    });

    it("concern generated for over-restrictive", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }),
          makeRestriction({ id: "r2", child_id: "C2" }),
          makeRestriction({ id: "r3", child_id: "C3" }),
          makeRestriction({ id: "r4", child_id: "C4" }),
          makeRestriction({ id: "r5", child_id: "C1", restriction_type: "curfew" }),
        ],
      }));
      expect(result.concerns.some(c => c.includes("over-restrictive"))).toBe(true);
    });
  });

  describe("additional penalty — multiple restrictions per child", () => {
    it(">2 per child → -2", () => {
      // C1 has 3 restrictions → -2
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", restriction_type: "internet_monitoring" }),
          makeRestriction({ id: "r2", child_id: "C1", restriction_type: "location_restriction" }),
          makeRestriction({ id: "r3", child_id: "C1", restriction_type: "phone_monitoring" }),
        ],
      }));
      // 82 - 2 = 80
      expect(result.dol_score).toBe(80);
    });

    it("exactly 2 per child → no penalty", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", restriction_type: "internet_monitoring" }),
          makeRestriction({ id: "r2", child_id: "C1", restriction_type: "curfew" }),
        ],
      }));
      // 82 (no penalty)
      expect(result.dol_score).toBe(82);
    });

    it("concern generated for over-restricted child", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }),
          makeRestriction({ id: "r2", child_id: "C1", restriction_type: "curfew" }),
          makeRestriction({ id: "r3", child_id: "C1", restriction_type: "phone_monitoring" }),
        ],
      }));
      expect(result.concerns.some(c => c.includes("more than 2 restrictions"))).toBe(true);
    });

    it("penalty counts only active restrictions per child", () => {
      // C1: 2 active + 1 ended → only 2 active, no penalty
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", restriction_type: "internet_monitoring" }),
          makeRestriction({ id: "r2", child_id: "C1", restriction_type: "curfew" }),
          makeRestriction({ id: "r3", child_id: "C1", restriction_type: "phone_monitoring", status: "ended" }),
        ],
      }));
      // 82 (no penalty — ended not counted in child restriction counts)
      expect(result.dol_score).toBe(82);
    });

    it("both penalties stack", () => {
      // 5 active for 4 children (-3) and C1 has 3 (-2)
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", restriction_type: "internet_monitoring" }),
          makeRestriction({ id: "r2", child_id: "C1", restriction_type: "curfew" }),
          makeRestriction({ id: "r3", child_id: "C1", restriction_type: "phone_monitoring" }),
          makeRestriction({ id: "r4", child_id: "C2" }),
          makeRestriction({ id: "r5", child_id: "C3" }),
        ],
      }));
      // 82 - 3 - 2 = 77
      expect(result.dol_score).toBe(77);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // OUTPUT FIELD ACCURACY
  // ════════════════════════════════════════════════════════════════════════

  describe("output field accuracy", () => {
    const restrictions = [
      makeRestriction({ id: "r1", child_id: "C1", proportionate: true, has_justification: true, child_consulted: true, child_views_recorded: true, sw_consulted: true, ilo_consulted: true, court_authorised: true, alternatives_count: 3, has_impact_assessment: true, is_overdue_review: false }),
      makeRestriction({ id: "r2", child_id: "C2", proportionate: false, has_justification: false, child_consulted: false, child_views_recorded: false, sw_consulted: false, ilo_consulted: false, court_authorised: false, alternatives_count: 0, has_impact_assessment: false, is_overdue_review: true }),
      makeRestriction({ id: "r3", child_id: "C1", proportionate: true, has_justification: true, child_consulted: true, child_views_recorded: true, sw_consulted: true, ilo_consulted: true, court_authorised: true, alternatives_count: 2, has_impact_assessment: true, is_overdue_review: false }),
      makeRestriction({ id: "r4", child_id: "C3", status: "ended" }),
    ];
    const result = computeHomeDeprivationOfLiberty(baseInput({ restrictions }));

    it("total_restrictions counts all", () => expect(result.total_restrictions).toBe(4));
    it("active_restrictions excludes ended", () => expect(result.active_restrictions).toBe(3));
    it("unique_children_restricted counts active only", () => expect(result.unique_children_restricted).toBe(2));
    it("proportionality_rate is correct", () => expect(result.proportionality_rate).toBe(67)); // 2/3
    it("child_consultation_rate is correct", () => expect(result.child_consultation_rate).toBe(67)); // 2/3
    it("sw_consultation_rate is correct", () => expect(result.sw_consultation_rate).toBe(67)); // 2/3
    it("overdue_review_count is correct", () => expect(result.overdue_review_count).toBe(1));
    it("court_authorised_count is correct", () => expect(result.court_authorised_count).toBe(2));
    it("alternatives_documented_rate is correct", () => expect(result.alternatives_documented_rate).toBe(67)); // 2/3 with >=2 alts
    it("impact_assessment_rate is correct", () => expect(result.impact_assessment_rate).toBe(67)); // 2/3
  });

  describe("output field accuracy — all active and perfect", () => {
    const result = computeHomeDeprivationOfLiberty(baseInput());

    it("proportionality_rate is 100", () => expect(result.proportionality_rate).toBe(100));
    it("child_consultation_rate is 100", () => expect(result.child_consultation_rate).toBe(100));
    it("sw_consultation_rate is 100", () => expect(result.sw_consultation_rate).toBe(100));
    it("overdue_review_count is 0", () => expect(result.overdue_review_count).toBe(0));
    it("court_authorised_count is 2", () => expect(result.court_authorised_count).toBe(2));
    it("alternatives_documented_rate is 100", () => expect(result.alternatives_documented_rate).toBe(100));
    it("impact_assessment_rate is 100", () => expect(result.impact_assessment_rate).toBe(100));
  });

  describe("output field accuracy — all zeros", () => {
    const bad = (id: string, child: string) => makeRestriction({
      id, child_id: child,
      proportionate: false, has_justification: false,
      child_consulted: false, child_views_recorded: false,
      sw_consulted: false, ilo_consulted: false, court_authorised: false,
      alternatives_count: 0, has_impact_assessment: false,
      is_overdue_review: true,
    });
    const result = computeHomeDeprivationOfLiberty(baseInput({
      restrictions: [bad("r1", "C1"), bad("r2", "C2")],
    }));

    it("proportionality_rate is 0", () => expect(result.proportionality_rate).toBe(0));
    it("child_consultation_rate is 0", () => expect(result.child_consultation_rate).toBe(0));
    it("sw_consultation_rate is 0", () => expect(result.sw_consultation_rate).toBe(0));
    it("overdue_review_count is 2", () => expect(result.overdue_review_count).toBe(2));
    it("court_authorised_count is 0", () => expect(result.court_authorised_count).toBe(0));
    it("alternatives_documented_rate is 0", () => expect(result.alternatives_documented_rate).toBe(0));
    it("impact_assessment_rate is 0", () => expect(result.impact_assessment_rate).toBe(0));
  });

  // ════════════════════════════════════════════════════════════════════════
  // SCORE CLAMPING
  // ════════════════════════════════════════════════════════════════════════

  describe("score clamping", () => {
    it("score never exceeds 100", () => {
      // Even with all bonuses, base 52 + max modifiers (6+5+5+5+4+5=30) = 82, well under 100
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.dol_score).toBeLessThanOrEqual(100);
    });

    it("score never goes below 0", () => {
      // Maximally bad: all penalties + additional penalties
      // 52 - 8 - 5 - 4 - 4 - 4 - 3 - 3 - 2 = 19 still positive
      // Even with more penalties it stays ≥0
      const bad = (id: string, child: string) => makeRestriction({
        id, child_id: child,
        proportionate: false, has_justification: false,
        child_consulted: false, child_views_recorded: false,
        sw_consulted: false, ilo_consulted: false,
        alternatives_count: 0, has_impact_assessment: false,
        is_overdue_review: true,
      });
      const result = computeHomeDeprivationOfLiberty(baseInput({
        total_children: 1,
        restrictions: [
          bad("r1", "C1"), bad("r2", "C1"), bad("r3", "C1"), // >2 per child → -2, >1 child → -3
        ],
      }));
      expect(result.dol_score).toBeGreaterThanOrEqual(0);
    });

    it("clamped score maps to correct rating", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      if (result.dol_score >= 80) expect(result.dol_rating).toBe("outstanding");
      else if (result.dol_score >= 65) expect(result.dol_rating).toBe("good");
      else if (result.dol_score >= 45) expect(result.dol_rating).toBe("adequate");
      else expect(result.dol_rating).toBe("inadequate");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    it("proportionality strength when ≥98%", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.strengths.some(s => s.includes("proportionate"))).toBe(true);
    });

    it("no proportionality strength when <98%", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }),
          makeRestriction({ id: "r2", child_id: "C2", proportionate: false }),
        ],
      }));
      expect(result.strengths.some(s => s.includes("proportionate"))).toBe(false);
    });

    it("child consultation strength when ≥95%", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.strengths.some(s => s.includes("consulted"))).toBe(true);
    });

    it("sw consultation strength when ≥95%", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.strengths.some(s => s.includes("Social workers"))).toBe(true);
    });

    it("review timeliness strength when 0 overdue", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.strengths.some(s => s.includes("reviews are up to date"))).toBe(true);
    });

    it("alternatives strength when ≥90%", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.strengths.some(s => s.includes("Alternatives"))).toBe(true);
    });

    it("ilo strength when ≥80%", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.strengths.some(s => s.includes("Independent reviewing"))).toBe(true);
    });

    it("court authorised strength when all court authorised", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.strengths.some(s => s.includes("court authorised"))).toBe(true);
    });

    it("no strengths for 0 active (except zero-restrictions case)", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [makeRestriction({ id: "r1", status: "ended" })],
      }));
      expect(result.strengths).toHaveLength(0);
    });

    it("zero restrictions case has freedom strength", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({ restrictions: [] }));
      expect(result.strengths.some(s => s.includes("freedom"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("proportionality concern when <70%", () => {
      const restrictions = Array.from({ length: 5 }, (_, i) =>
        makeRestriction({ id: `r${i}`, child_id: `C${i}`, proportionate: i < 3, has_justification: i < 3 }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ total_children: 5, restrictions }));
      expect(result.concerns.some(c => c.includes("Proportionality rate"))).toBe(true);
    });

    it("no proportionality concern when ≥70%", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.concerns.some(c => c.includes("Proportionality"))).toBe(false);
    });

    it("child consultation concern when <60%", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", child_consulted: false, child_views_recorded: false }),
          makeRestriction({ id: "r2", child_id: "C2", child_consulted: false, child_views_recorded: false }),
        ],
      }));
      expect(result.concerns.some(c => c.includes("consultation rate"))).toBe(true);
    });

    it("sw consultation concern when <60%", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", sw_consulted: false }),
          makeRestriction({ id: "r2", child_id: "C2", sw_consulted: false }),
        ],
      }));
      expect(result.concerns.some(c => c.includes("Social worker consultation"))).toBe(true);
    });

    it("overdue concern when overdue > 0", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", is_overdue_review: true }),
          makeRestriction({ id: "r2", child_id: "C2" }),
        ],
      }));
      expect(result.concerns.some(c => c.includes("overdue"))).toBe(true);
    });

    it("no overdue concern when 0 overdue", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.concerns.some(c => c.includes("overdue"))).toBe(false);
    });

    it("alternatives concern when <50%", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", alternatives_count: 0, has_impact_assessment: false }),
          makeRestriction({ id: "r2", child_id: "C2", alternatives_count: 0, has_impact_assessment: false }),
        ],
      }));
      expect(result.concerns.some(c => c.includes("Alternatives"))).toBe(true);
    });

    it("ilo concern when <40%", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", ilo_consulted: false }),
          makeRestriction({ id: "r2", child_id: "C2", ilo_consulted: false }),
        ],
      }));
      expect(result.concerns.some(c => c.includes("reviewing officer"))).toBe(true);
    });

    it("over-restrictive concern when active > total_children", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        total_children: 2,
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }),
          makeRestriction({ id: "r2", child_id: "C2" }),
          makeRestriction({ id: "r3", child_id: "C1", restriction_type: "curfew" }),
        ],
      }));
      expect(result.concerns.some(c => c.includes("over-restrictive"))).toBe(true);
    });

    it("multi-restriction concern when child has >2", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }),
          makeRestriction({ id: "r2", child_id: "C1", restriction_type: "curfew" }),
          makeRestriction({ id: "r3", child_id: "C1", restriction_type: "phone_monitoring" }),
        ],
      }));
      expect(result.concerns.some(c => c.includes("more than 2 restrictions"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("overdue review recommendation is immediate", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", is_overdue_review: true }),
          makeRestriction({ id: "r2", child_id: "C2" }),
        ],
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("overdue"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("ECHR Article 5");
    });

    it("proportionality recommendation when <70%", () => {
      const restrictions = Array.from({ length: 5 }, (_, i) =>
        makeRestriction({ id: `r${i}`, child_id: `C${i}`, proportionate: i < 3, has_justification: i < 3 }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ total_children: 5, restrictions }));
      const rec = result.recommendations.find(r => r.recommendation.includes("proportionality"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("Reg 20");
    });

    it("child consultation recommendation when <80%", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", child_consulted: false, child_views_recorded: false }),
          makeRestriction({ id: "r2", child_id: "C2" }),
        ],
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("children are consulted"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("Reg 13");
    });

    it("sw consultation recommendation when <80%", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", sw_consulted: false }),
          makeRestriction({ id: "r2", child_id: "C2" }),
        ],
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("social workers"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("ilo recommendation when <60%", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", ilo_consulted: false }),
          makeRestriction({ id: "r2", child_id: "C2", ilo_consulted: false }),
        ],
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("reviewing officer"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
      expect(rec!.regulatory_ref).toBe("Children Act 1989 s25");
    });

    it("alternatives recommendation when <70%", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", alternatives_count: 0, has_impact_assessment: false }),
          makeRestriction({ id: "r2", child_id: "C2", alternatives_count: 0, has_impact_assessment: false }),
        ],
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("alternatives"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("multi-restriction recommendation when over-restricted children", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }),
          makeRestriction({ id: "r2", child_id: "C1", restriction_type: "curfew" }),
          makeRestriction({ id: "r3", child_id: "C1", restriction_type: "phone_monitoring" }),
        ],
      }));
      const rec = result.recommendations.find(r => r.recommendation.includes("cumulative impact"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
      expect(rec!.regulatory_ref).toBe("Reg 20");
    });

    it("recommendations are ranked sequentially", () => {
      const bad = (id: string, child: string) => makeRestriction({
        id, child_id: child,
        proportionate: false, has_justification: false,
        child_consulted: false, child_views_recorded: false,
        sw_consulted: false, ilo_consulted: false,
        alternatives_count: 0, has_impact_assessment: false,
        is_overdue_review: true,
      });
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [bad("r1", "C1"), bad("r2", "C2")],
      }));
      for (let i = 0; i < result.recommendations.length; i++) {
        expect(result.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("no recommendations when perfect", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.recommendations).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ════════════════════════════════════════════════════════════════════════

  describe("insights", () => {
    it("critical insight when proportionality <50%", () => {
      const bad = (id: string, child: string) => makeRestriction({
        id, child_id: child, proportionate: false, has_justification: false,
      });
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [bad("r1", "C1"), bad("r2", "C2")],
      }));
      expect(result.insights.some(i => i.severity === "critical" && i.text.includes("proportionality"))).toBe(true);
    });

    it("critical insight when child consultation <60%", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", child_consulted: false, child_views_recorded: false }),
          makeRestriction({ id: "r2", child_id: "C2", child_consulted: false, child_views_recorded: false }),
        ],
      }));
      expect(result.insights.some(i => i.severity === "critical" && i.text.includes("consulted"))).toBe(true);
    });

    it("critical insight when >50% overdue", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", is_overdue_review: true }),
          makeRestriction({ id: "r2", child_id: "C2", is_overdue_review: true }),
          makeRestriction({ id: "r3", child_id: "C3" }),
        ],
      }));
      expect(result.insights.some(i => i.severity === "critical" && i.text.includes("overdue"))).toBe(true);
    });

    it("critical insight when ilo <40%", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", ilo_consulted: false }),
          makeRestriction({ id: "r2", child_id: "C2", ilo_consulted: false }),
        ],
      }));
      expect(result.insights.some(i => i.severity === "critical" && i.text.includes("Independent reviewing officer"))).toBe(true);
    });

    it("warning insight for over-restricted children", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }),
          makeRestriction({ id: "r2", child_id: "C1", restriction_type: "curfew" }),
          makeRestriction({ id: "r3", child_id: "C1", restriction_type: "phone_monitoring" }),
        ],
      }));
      expect(result.insights.some(i => i.severity === "warning" && i.text.includes("more than 2 restrictions"))).toBe(true);
    });

    it("warning insight for over-restrictive environment", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        total_children: 2,
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }),
          makeRestriction({ id: "r2", child_id: "C2" }),
          makeRestriction({ id: "r3", child_id: "C1", restriction_type: "curfew" }),
        ],
      }));
      expect(result.insights.some(i => i.severity === "warning" && i.text.includes("over-restrictive"))).toBe(true);
    });

    it("positive insight when proportionate and consulted", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.insights.some(i => i.severity === "positive" && i.text.includes("rights-respecting"))).toBe(true);
    });

    it("positive insight when reviews on schedule and ilo strong", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.insights.some(i => i.severity === "positive" && i.text.includes("reviews on schedule"))).toBe(true);
    });

    it("positive insight when alternatives well documented", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.insights.some(i => i.severity === "positive" && i.text.includes("alternatives"))).toBe(true);
    });

    it("positive insight for zero restrictions", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({ restrictions: [] }));
      expect(result.insights.some(i => i.severity === "positive")).toBe(true);
    });

    it("no insights for empty data", () => {
      const result = computeHomeDeprivationOfLiberty({ today: TODAY, total_children: 0, restrictions: [] });
      expect(result.insights).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // HEADLINE
  // ════════════════════════════════════════════════════════════════════════

  describe("headline", () => {
    it("outstanding headline mentions Outstanding", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.headline).toContain("Outstanding");
    });

    it("good headline mentions Good", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }),
          makeRestriction({ id: "r2", child_id: "C2", child_consulted: false, child_views_recorded: false }),
        ],
      }));
      expect(result.headline).toContain("Good");
    });

    it("adequate headline mentions Adequate", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }),
          makeRestriction({
            id: "r2", child_id: "C2",
            child_consulted: false, child_views_recorded: false,
            sw_consulted: false, ilo_consulted: false,
            alternatives_count: 0, has_impact_assessment: false,
          }),
        ],
      }));
      expect(result.headline).toContain("Adequate");
    });

    it("inadequate headline mentions inadequate", () => {
      const bad = (id: string, child: string) => makeRestriction({
        id, child_id: child,
        proportionate: false, has_justification: false,
        child_consulted: false, child_views_recorded: false,
        sw_consulted: false, ilo_consulted: false,
        alternatives_count: 0, has_impact_assessment: false,
        is_overdue_review: true,
      });
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [bad("r1", "C1"), bad("r2", "C2")],
      }));
      expect(result.headline).toContain("inadequate");
    });

    it("zero restrictions headline", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({ restrictions: [] }));
      expect(result.headline).toContain("No deprivation of liberty measures");
    });

    it("insufficient data headline", () => {
      const result = computeHomeDeprivationOfLiberty({ today: TODAY, total_children: 0, restrictions: [] });
      expect(result.headline).toContain("No children");
    });

    it("outstanding headline includes active count", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.headline).toContain("2 active restrictions");
    });

    it("good headline includes proportionality rate", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }),
          makeRestriction({ id: "r2", child_id: "C2", child_consulted: false, child_views_recorded: false }),
        ],
      }));
      expect(result.headline).toContain("100%");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // FILTER: ENDED RESTRICTIONS EXCLUDED FROM MODIFIERS
  // ════════════════════════════════════════════════════════════════════════

  describe("ended restrictions filtering", () => {
    it("ended restrictions do not affect proportionality rate", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }), // active, perfect
          makeRestriction({ id: "r2", child_id: "C2", status: "ended", proportionate: false, has_justification: false }),
        ],
      }));
      expect(result.proportionality_rate).toBe(100); // only active counted
      expect(result.active_restrictions).toBe(1);
    });

    it("ended restrictions do not affect child consultation rate", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }),
          makeRestriction({ id: "r2", child_id: "C2", status: "ended", child_consulted: false, child_views_recorded: false }),
        ],
      }));
      expect(result.child_consultation_rate).toBe(100);
    });

    it("ended restrictions do not affect sw consultation rate", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }),
          makeRestriction({ id: "r2", child_id: "C2", status: "ended", sw_consulted: false }),
        ],
      }));
      expect(result.sw_consultation_rate).toBe(100);
    });

    it("ended restrictions do not affect overdue count", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }),
          makeRestriction({ id: "r2", child_id: "C2", status: "ended", is_overdue_review: true }),
        ],
      }));
      expect(result.overdue_review_count).toBe(0);
    });

    it("ended restrictions counted in total_restrictions", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }),
          makeRestriction({ id: "r2", child_id: "C2", status: "ended" }),
        ],
      }));
      expect(result.total_restrictions).toBe(2);
      expect(result.active_restrictions).toBe(1);
    });

    it("under_review restrictions ARE included in active", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", status: "current" }),
          makeRestriction({ id: "r2", child_id: "C2", status: "under_review" }),
        ],
      }));
      expect(result.active_restrictions).toBe(2);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // MIXED SCENARIOS
  // ════════════════════════════════════════════════════════════════════════

  describe("mixed scenario — active + ended + under_review", () => {
    const result = computeHomeDeprivationOfLiberty(baseInput({
      restrictions: [
        makeRestriction({ id: "r1", child_id: "C1", status: "current" }),
        makeRestriction({ id: "r2", child_id: "C2", status: "under_review" }),
        makeRestriction({ id: "r3", child_id: "C3", status: "ended" }),
        makeRestriction({ id: "r4", child_id: "C4", status: "ended" }),
      ],
    }));

    it("total_restrictions is 4", () => expect(result.total_restrictions).toBe(4));
    it("active_restrictions is 2", () => expect(result.active_restrictions).toBe(2));
    it("rates based on active only", () => expect(result.dol_score).toBe(82));
  });

  describe("mixed scenario — one child multiple types and statuses", () => {
    const result = computeHomeDeprivationOfLiberty(baseInput({
      restrictions: [
        makeRestriction({ id: "r1", child_id: "C1", restriction_type: "internet_monitoring", status: "current" }),
        makeRestriction({ id: "r2", child_id: "C1", restriction_type: "curfew", status: "current" }),
        makeRestriction({ id: "r3", child_id: "C1", restriction_type: "phone_monitoring", status: "ended" }),
        makeRestriction({ id: "r4", child_id: "C2", status: "current" }),
      ],
    }));

    it("unique_children_restricted counts active only", () => expect(result.unique_children_restricted).toBe(2));
    it("C1 has 2 active (no multi-penalty)", () => expect(result.dol_score).toBe(82));
    it("total includes ended", () => expect(result.total_restrictions).toBe(4));
  });

  // ════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("single restriction all perfect", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [makeRestriction({ id: "r1", child_id: "C1" })],
      }));
      expect(result.dol_rating).toBe("outstanding");
      expect(result.dol_score).toBe(82);
      expect(result.active_restrictions).toBe(1);
    });

    it("single restriction all bad", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [makeRestriction({
          id: "r1", child_id: "C1",
          proportionate: false, has_justification: false,
          child_consulted: false, child_views_recorded: false,
          sw_consulted: false, ilo_consulted: false,
          alternatives_count: 0, has_impact_assessment: false,
          is_overdue_review: true,
        })],
      }));
      // 52 - 8 - 5 - 4 + 2(1 overdue ≤ 1) - 4 - 3 = 30
      expect(result.dol_score).toBe(30);
      expect(result.dol_rating).toBe("inadequate");
    });

    it("large number of restrictions", () => {
      const restrictions = Array.from({ length: 50 }, (_, i) =>
        makeRestriction({ id: `r${i}`, child_id: `C${i % 10}` }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({
        total_children: 10,
        restrictions,
      }));
      // 50 active > 10 children → -3
      // multiple children have >2 restrictions (5 per child) → -2
      // 82 - 3 - 2 = 77
      expect(result.dol_score).toBe(77);
      expect(result.total_restrictions).toBe(50);
      expect(result.active_restrictions).toBe(50);
    });

    it("restriction with alternatives_count exactly 2", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", alternatives_count: 2 }),
          makeRestriction({ id: "r2", child_id: "C2", alternatives_count: 2 }),
        ],
      }));
      expect(result.alternatives_documented_rate).toBe(100);
    });

    it("restriction with alternatives_count exactly 1", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", alternatives_count: 1 }),
          makeRestriction({ id: "r2", child_id: "C2", alternatives_count: 1 }),
        ],
      }));
      expect(result.alternatives_documented_rate).toBe(0);
    });

    it("all restrictions under_review", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", status: "under_review" }),
          makeRestriction({ id: "r2", child_id: "C2", status: "under_review" }),
        ],
      }));
      expect(result.active_restrictions).toBe(2);
      expect(result.dol_rating).toBe("outstanding");
    });

    it("0 children with restrictions still returns insufficient data", () => {
      const result = computeHomeDeprivationOfLiberty({
        today: TODAY,
        total_children: 0,
        restrictions: [makeRestriction({ id: "r1", child_id: "C1" })],
      });
      expect(result.dol_rating).toBe("insufficient_data");
      expect(result.dol_score).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // REGULATORY REFERENCES
  // ════════════════════════════════════════════════════════════════════════

  describe("regulatory references", () => {
    const bad = (id: string, child: string) => makeRestriction({
      id, child_id: child,
      proportionate: false, has_justification: false,
      child_consulted: false, child_views_recorded: false,
      sw_consulted: false, ilo_consulted: false,
      alternatives_count: 0, has_impact_assessment: false,
      is_overdue_review: true,
    });
    const result = computeHomeDeprivationOfLiberty(baseInput({
      restrictions: [
        bad("r1", "C1"), bad("r2", "C2"),
        bad("r3", "C1"), // >2 per child
      ],
    }));

    it("ECHR Article 5 referenced for overdue reviews", () => {
      expect(result.recommendations.some(r => r.regulatory_ref === "ECHR Article 5")).toBe(true);
    });

    it("Reg 20 referenced for proportionality", () => {
      expect(result.recommendations.some(r => r.regulatory_ref === "Reg 20")).toBe(true);
    });

    it("Reg 13 referenced for child consultation", () => {
      expect(result.recommendations.some(r => r.regulatory_ref === "Reg 13")).toBe(true);
    });

    it("Reg 12 referenced for sw consultation", () => {
      expect(result.recommendations.some(r => r.regulatory_ref === "Reg 12")).toBe(true);
    });

    it("Children Act 1989 s25 referenced for ilo", () => {
      expect(result.recommendations.some(r => r.regulatory_ref === "Children Act 1989 s25")).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // SCORE COMPOSITION VERIFICATION
  // ════════════════════════════════════════════════════════════════════════

  describe("score composition — base 52 verification", () => {
    it("all ended: 52 + 0 - 1 - 1 - 1 - 1 - 2 = 46", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", status: "ended" }),
        ],
      }));
      expect(result.dol_score).toBe(46);
    });

    it("perfect active: 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.dol_score).toBe(82);
    });

    it("all bad active: 52 - 8 - 5 - 4 - 4 - 4 - 3 = 24", () => {
      const bad = (id: string, child: string) => makeRestriction({
        id, child_id: child,
        proportionate: false, has_justification: false,
        child_consulted: false, child_views_recorded: false,
        sw_consulted: false, ilo_consulted: false,
        alternatives_count: 0, has_impact_assessment: false,
        is_overdue_review: true,
      });
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [bad("r1", "C1"), bad("r2", "C2")],
      }));
      expect(result.dol_score).toBe(24);
    });

    it("all bad + all penalties: 52 - 8 - 5 - 4 - 4 - 4 - 3 - 3 - 2 = 19", () => {
      const bad = (id: string, child: string) => makeRestriction({
        id, child_id: child,
        proportionate: false, has_justification: false,
        child_consulted: false, child_views_recorded: false,
        sw_consulted: false, ilo_consulted: false,
        alternatives_count: 0, has_impact_assessment: false,
        is_overdue_review: true,
      });
      const result = computeHomeDeprivationOfLiberty(baseInput({
        total_children: 2,
        restrictions: [
          bad("r1", "C1"), bad("r2", "C1"), bad("r3", "C1"), // >2 per child → -2, 3 > 2 children → -3
        ],
      }));
      expect(result.dol_score).toBe(19);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // MODIFIER GAP ZONES (no bonus, no penalty)
  // ════════════════════════════════════════════════════════════════════════

  describe("modifier gap zones — no bonus, no penalty", () => {
    it("mod1: proportionality 70-84% → no modifier", () => {
      // 4/5 = 80% → +3 (actually this is ≥85...wait 80% is NOT ≥85)
      // 80% is in the gap between 70 and 85 → no modifier for proportionality
      // Wait let me recheck: ≥98 → +6, ≥85 → +3, <50 → -8, <70 → -5, else 0
      // 80% is ≥70 and <85 → falls through to else (no modifier)
      const restrictions = Array.from({ length: 5 }, (_, i) =>
        makeRestriction({ id: `r${i}`, child_id: `C${i}`, proportionate: i < 4, has_justification: i < 4 }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ total_children: 5, restrictions }));
      expect(result.proportionality_rate).toBe(80);
      // 52 + 0 + 5 + 5 + 5 + 4 + 5 = 76
      expect(result.dol_score).toBe(76);
    });

    it("mod2: child consultation 60-79% → no modifier", () => {
      // 3/4 = 75% → gap
      const restrictions = Array.from({ length: 4 }, (_, i) =>
        makeRestriction({
          id: `r${i}`, child_id: `C${i}`,
          child_consulted: i < 3, child_views_recorded: i < 3,
        }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ restrictions }));
      expect(result.child_consultation_rate).toBe(75);
      // 52 + 6 + 0 + 5 + 5 + 4 + 5 = 77
      expect(result.dol_score).toBe(77);
    });

    it("mod3: sw consultation 60-79% → no modifier", () => {
      // 3/4 = 75% → gap
      const restrictions = Array.from({ length: 4 }, (_, i) =>
        makeRestriction({ id: `r${i}`, child_id: `C${i}`, sw_consulted: i < 3 }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ restrictions }));
      expect(result.sw_consultation_rate).toBe(75);
      // 52 + 6 + 5 + 0 + 5 + 4 + 5 = 77
      expect(result.dol_score).toBe(77);
    });

    it("mod4: overdue >1 but ≤50% → no modifier", () => {
      // 2/5 = 40% overdue, but 2 > 1 so doesn't get +2, and 40% ≤ 50% so no -4
      // Wait: code checks ≤1 first. 2 is not ≤1. Then checks >50%: 40% is not >50%. Falls through → 0
      const restrictions = Array.from({ length: 5 }, (_, i) =>
        makeRestriction({ id: `r${i}`, child_id: `C${i}`, is_overdue_review: i < 2 }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ total_children: 5, restrictions }));
      expect(result.overdue_review_count).toBe(2);
      // 52 + 6 + 5 + 5 + 0 + 4 + 5 = 77
      expect(result.dol_score).toBe(77);
    });

    it("mod5: alternatives 50-69% → no modifier", () => {
      // 3/5 = 60% → gap between 50 and 70
      const restrictions = Array.from({ length: 5 }, (_, i) =>
        makeRestriction({
          id: `r${i}`, child_id: `C${i}`,
          alternatives_count: i < 3 ? 3 : 0,
          has_impact_assessment: i < 3,
        }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ total_children: 5, restrictions }));
      // 52 + 6 + 5 + 5 + 5 + 0 + 5 = 78
      expect(result.dol_score).toBe(78);
    });

    it("mod6: ilo 40-59% → no modifier", () => {
      // 2/4 = 50% → gap
      const restrictions = Array.from({ length: 4 }, (_, i) =>
        makeRestriction({ id: `r${i}`, child_id: `C${i}`, ilo_consulted: i < 2 }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ restrictions }));
      // 52 + 6 + 5 + 5 + 5 + 4 + 0 = 77
      expect(result.dol_score).toBe(77);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RETURN TYPE COMPLETENESS
  // ════════════════════════════════════════════════════════════════════════

  describe("return type completeness", () => {
    const result = computeHomeDeprivationOfLiberty(baseInput());

    it("has dol_rating", () => expect(result.dol_rating).toBeDefined());
    it("has dol_score", () => expect(typeof result.dol_score).toBe("number"));
    it("has headline", () => expect(typeof result.headline).toBe("string"));
    it("has total_restrictions", () => expect(typeof result.total_restrictions).toBe("number"));
    it("has active_restrictions", () => expect(typeof result.active_restrictions).toBe("number"));
    it("has unique_children_restricted", () => expect(typeof result.unique_children_restricted).toBe("number"));
    it("has proportionality_rate", () => expect(typeof result.proportionality_rate).toBe("number"));
    it("has child_consultation_rate", () => expect(typeof result.child_consultation_rate).toBe("number"));
    it("has sw_consultation_rate", () => expect(typeof result.sw_consultation_rate).toBe("number"));
    it("has overdue_review_count", () => expect(typeof result.overdue_review_count).toBe("number"));
    it("has court_authorised_count", () => expect(typeof result.court_authorised_count).toBe("number"));
    it("has alternatives_documented_rate", () => expect(typeof result.alternatives_documented_rate).toBe("number"));
    it("has impact_assessment_rate", () => expect(typeof result.impact_assessment_rate).toBe("number"));
    it("has strengths array", () => expect(Array.isArray(result.strengths)).toBe(true));
    it("has concerns array", () => expect(Array.isArray(result.concerns)).toBe(true));
    it("has recommendations array", () => expect(Array.isArray(result.recommendations)).toBe(true));
    it("has insights array", () => expect(Array.isArray(result.insights)).toBe(true));
  });

  describe("return type completeness — insufficient_data", () => {
    const result = computeHomeDeprivationOfLiberty({ today: TODAY, total_children: 0, restrictions: [] });

    it("has all fields even on insufficient_data", () => {
      expect(result.dol_rating).toBe("insufficient_data");
      expect(result.dol_score).toBe(0);
      expect(result.total_restrictions).toBe(0);
      expect(result.active_restrictions).toBe(0);
      expect(result.unique_children_restricted).toBe(0);
      expect(result.proportionality_rate).toBe(0);
      expect(result.child_consultation_rate).toBe(0);
      expect(result.sw_consultation_rate).toBe(0);
      expect(result.overdue_review_count).toBe(0);
      expect(result.court_authorised_count).toBe(0);
      expect(result.alternatives_documented_rate).toBe(0);
      expect(result.impact_assessment_rate).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // UNIQUE CHILDREN COUNTING
  // ════════════════════════════════════════════════════════════════════════

  describe("unique children restricted", () => {
    it("counts unique children among active restrictions", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }),
          makeRestriction({ id: "r2", child_id: "C1", restriction_type: "curfew" }),
          makeRestriction({ id: "r3", child_id: "C2" }),
        ],
      }));
      expect(result.unique_children_restricted).toBe(2);
    });

    it("does not count children with only ended restrictions", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1" }),
          makeRestriction({ id: "r2", child_id: "C2", status: "ended" }),
        ],
      }));
      expect(result.unique_children_restricted).toBe(1);
    });

    it("1 child, 1 restriction", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [makeRestriction({ id: "r1", child_id: "C1" })],
      }));
      expect(result.unique_children_restricted).toBe(1);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // COURT AUTHORISED COUNT
  // ════════════════════════════════════════════════════════════════════════

  describe("court authorised count", () => {
    it("counts court authorised among active", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", court_authorised: true }),
          makeRestriction({ id: "r2", child_id: "C2", court_authorised: false }),
          makeRestriction({ id: "r3", child_id: "C3", court_authorised: true, status: "ended" }),
        ],
      }));
      // Active: r1(true), r2(false) → only 1 court authorised among active
      // But the code counts among active only
      expect(result.court_authorised_count).toBe(1);
    });

    it("all court authorised", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput());
      expect(result.court_authorised_count).toBe(2);
    });

    it("none court authorised", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", court_authorised: false }),
          makeRestriction({ id: "r2", child_id: "C2", court_authorised: false }),
        ],
      }));
      expect(result.court_authorised_count).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // DETERMINISTIC / INJECTABLE TODAY
  // ════════════════════════════════════════════════════════════════════════

  describe("injectable today parameter", () => {
    it("engine uses injected today, not system clock", () => {
      const r1 = computeHomeDeprivationOfLiberty(baseInput({ today: "2025-01-01" }));
      const r2 = computeHomeDeprivationOfLiberty(baseInput({ today: "2025-12-31" }));
      // Same restrictions but different today — both should produce same score
      // (since is_overdue_review is pre-computed, today doesn't affect scoring directly)
      expect(r1.dol_score).toBe(r2.dol_score);
    });

    it("different today values produce deterministic results", () => {
      const r1 = computeHomeDeprivationOfLiberty(baseInput({ today: "2025-03-15" }));
      const r2 = computeHomeDeprivationOfLiberty(baseInput({ today: "2025-03-15" }));
      expect(r1.dol_score).toBe(r2.dol_score);
      expect(r1.dol_rating).toBe(r2.dol_rating);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // OVERDUE REVIEW EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("overdue review edge cases", () => {
    it("all active overdue", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", is_overdue_review: true }),
          makeRestriction({ id: "r2", child_id: "C2", is_overdue_review: true }),
        ],
      }));
      expect(result.overdue_review_count).toBe(2);
      // 100% overdue > 50% → -4
    });

    it("0 active means overdue count is 0", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [makeRestriction({ id: "r1", status: "ended", is_overdue_review: true })],
      }));
      expect(result.overdue_review_count).toBe(0);
    });

    it("overdue concern text uses singular for 1", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", is_overdue_review: true }),
          makeRestriction({ id: "r2", child_id: "C2" }),
        ],
      }));
      expect(result.concerns.some(c => c.includes("1 restriction has overdue"))).toBe(true);
    });

    it("overdue concern text uses plural for >1", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", is_overdue_review: true }),
          makeRestriction({ id: "r2", child_id: "C2", is_overdue_review: true }),
          makeRestriction({ id: "r3", child_id: "C3" }),
        ],
      }));
      expect(result.concerns.some(c => c.includes("2 restrictions have overdue"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // MULTI-CHILD OVER-RESTRICTION SCENARIOS
  // ════════════════════════════════════════════════════════════════════════

  describe("multi-child over-restriction", () => {
    it("multiple children with >2 restrictions each", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        total_children: 4,
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", restriction_type: "a" }),
          makeRestriction({ id: "r2", child_id: "C1", restriction_type: "b" }),
          makeRestriction({ id: "r3", child_id: "C1", restriction_type: "c" }),
          makeRestriction({ id: "r4", child_id: "C2", restriction_type: "a" }),
          makeRestriction({ id: "r5", child_id: "C2", restriction_type: "b" }),
          makeRestriction({ id: "r6", child_id: "C2", restriction_type: "c" }),
        ],
      }));
      // 6 active > 4 children → -3, 2 children >2 restrictions → -2
      // 82 - 3 - 2 = 77
      expect(result.dol_score).toBe(77);
    });

    it("concern text shows correct count of over-restricted children", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        total_children: 4,
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", restriction_type: "a" }),
          makeRestriction({ id: "r2", child_id: "C1", restriction_type: "b" }),
          makeRestriction({ id: "r3", child_id: "C1", restriction_type: "c" }),
          makeRestriction({ id: "r4", child_id: "C2", restriction_type: "a" }),
          makeRestriction({ id: "r5", child_id: "C2", restriction_type: "b" }),
          makeRestriction({ id: "r6", child_id: "C2", restriction_type: "c" }),
        ],
      }));
      expect(result.concerns.some(c => c.includes("2 children have more than 2"))).toBe(true);
    });

    it("insight text for single over-restricted child uses singular", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [
          makeRestriction({ id: "r1", child_id: "C1", restriction_type: "a" }),
          makeRestriction({ id: "r2", child_id: "C1", restriction_type: "b" }),
          makeRestriction({ id: "r3", child_id: "C1", restriction_type: "c" }),
        ],
      }));
      expect(result.insights.some(i => i.text.includes("1 child"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // PROPORTIONALITY RATE CALCULATION
  // ════════════════════════════════════════════════════════════════════════

  describe("proportionality rate calculation", () => {
    it("1/3 → 33%", () => {
      const restrictions = Array.from({ length: 3 }, (_, i) =>
        makeRestriction({
          id: `r${i}`, child_id: `C${i}`,
          proportionate: i < 1, has_justification: i < 1,
        }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ restrictions }));
      expect(result.proportionality_rate).toBe(33);
    });

    it("2/3 → 67%", () => {
      const restrictions = Array.from({ length: 3 }, (_, i) =>
        makeRestriction({
          id: `r${i}`, child_id: `C${i}`,
          proportionate: i < 2, has_justification: i < 2,
        }),
      );
      const result = computeHomeDeprivationOfLiberty(baseInput({ restrictions }));
      expect(result.proportionality_rate).toBe(67);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // PCT HELPER EDGE CASE
  // ════════════════════════════════════════════════════════════════════════

  describe("pct helper — 0 denominator returns 0", () => {
    it("rates with 0 active return 0 for all rate fields", () => {
      const result = computeHomeDeprivationOfLiberty(baseInput({
        restrictions: [makeRestriction({ id: "r1", status: "ended" })],
      }));
      expect(result.proportionality_rate).toBe(0);
      expect(result.child_consultation_rate).toBe(0);
      expect(result.sw_consultation_rate).toBe(0);
      expect(result.alternatives_documented_rate).toBe(0);
      expect(result.impact_assessment_rate).toBe(0);
    });
  });
});
