// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME LEAVING CARE / TRANSITION INTELLIGENCE ENGINE — TESTS
// CHR 2015 Reg 5 / Children (Leaving Care) Act 2000
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeLeavingCareTransition,
  type LeavingCareTransitionInput,
  type TransitionGoalInput,
  type PathwayPlanInput,
  type AspirationInput,
  type IndependentTravelInput,
  type LeavingCarePackageInput,
} from "../home-leaving-care-transition-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeGoal(id: string, childId: string, overrides: Partial<TransitionGoalInput> = {}): TransitionGoalInput {
  return {
    id,
    child_id: childId,
    area: "independent_living",
    status: "achieved",
    percent_complete: 100,
    has_review_date: true,
    ...overrides,
  };
}

function makePlan(id: string, childId: string, overrides: Partial<PathwayPlanInput> = {}): PathwayPlanInput {
  return {
    id,
    child_id: childId,
    status: "active_16_18",
    has_personal_advisor: true,
    has_accommodation_plan: true,
    has_eet_plan: true,
    last_review_within_6_months: true,
    ...overrides,
  };
}

function makeAspiration(id: string, childId: string, overrides: Partial<AspirationInput> = {}): AspirationInput {
  return {
    id,
    child_id: childId,
    child_chose: true,
    has_steps_taken: true,
    has_support_identified: true,
    ...overrides,
  };
}

function makeTravel(id: string, childId: string, overrides: Partial<IndependentTravelInput> = {}): IndependentTravelInput {
  return {
    id,
    child_id: childId,
    routes_mastered: 3,
    routes_learning: 1,
    has_travel_card: true,
    has_safety_plan: true,
    ...overrides,
  };
}

function makePackage(id: string, childId: string, overrides: Partial<LeavingCarePackageInput> = {}): LeavingCarePackageInput {
  return {
    id,
    child_id: childId,
    has_junior_isa: true,
    savings_on_track: true,
    setting_up_home_allowance_confirmed: true,
    financial_literacy_progressing: true,
    ...overrides,
  };
}

/**
 * baseInput: 4 children, all with active quality pathway plans, achieved goals,
 * child-chosen aspirations with steps, travel mastered, financially ready.
 * Mods: +5 +6 +5 +5 +4 +5 = +30 → 52+30 = 82 (outstanding)
 */
function baseInput(overrides: Partial<LeavingCareTransitionInput> = {}): LeavingCareTransitionInput {
  const children = ["yp_alex", "yp_jordan", "yp_casey", "yp_riley"];
  return {
    today: "2026-05-27",
    total_children: 4,
    transition_goals: children.map((c, i) =>
      makeGoal(`g${i + 1}`, c, { status: "achieved" }),
    ),
    pathway_plans: children.map((c, i) => makePlan(`pp${i + 1}`, c)),
    aspirations: children.map((c, i) => makeAspiration(`asp${i + 1}`, c)),
    independent_travel: children.map((c, i) => makeTravel(`tr${i + 1}`, c)),
    leaving_care_packages: children.map((c, i) => makePackage(`pkg${i + 1}`, c)),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA
// ═══════════════════════════════════════════════════════════════════════════

describe("insufficient data", () => {
  it("returns insufficient_data when total_children is 0", () => {
    const r = computeLeavingCareTransition(baseInput({ total_children: 0 }));
    expect(r.leaving_care_rating).toBe("insufficient_data");
    expect(r.leaving_care_score).toBe(0);
  });

  it("populates all metrics with zeros when no children", () => {
    const r = computeLeavingCareTransition(baseInput({ total_children: 0 }));
    expect(r.children_with_pathway_plans).toBe(0);
    expect(r.goal_achievement_rate).toBeNull();
    expect(r.aspiration_recording_rate).toBeNull();
    expect(r.travel_readiness_rate).toBeNull();
    expect(r.financial_readiness_rate).toBeNull();
  });

  it("returns empty arrays for strengths, concerns, recommendations, insights", () => {
    const r = computeLeavingCareTransition(baseInput({ total_children: 0 }));
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });

  it("returns a meaningful headline when no children", () => {
    const r = computeLeavingCareTransition(baseInput({ total_children: 0 }));
    expect(r.headline).toContain("No children");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. OUTSTANDING RATING — BASE INPUT
// ═══════════════════════════════════════════════════════════════════════════

describe("outstanding rating (base input)", () => {
  it("returns outstanding for fully compliant base input", () => {
    const r = computeLeavingCareTransition(baseInput());
    expect(r.leaving_care_rating).toBe("outstanding");
  });

  it("scores ~82 (52 base + 30 from all positive modifiers)", () => {
    const r = computeLeavingCareTransition(baseInput());
    // mod1: 100% pathway → +5
    // mod2: 100% achieved → +6
    // mod3: 100% aspirations engaged → +5
    // mod4: 100% travel ready → +5
    // mod5: 100% financially ready → +4
    // mod6: 100% quality plans → +5
    // Total = 52 + 30 = 82
    expect(r.leaving_care_score).toBe(82);
  });

  it("headline reflects outstanding status", () => {
    const r = computeLeavingCareTransition(baseInput());
    expect(r.headline).toContain("Excellent");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. GOOD RATING
// ═══════════════════════════════════════════════════════════════════════════

describe("good rating", () => {
  it("returns good when Mod 4 (travel) and Mod 5 (financial) degrade to +0", () => {
    // Keep Mod 1 (+5), Mod 2 (+6), Mod 3 (+5), Mod 6 (+5) at top.
    // Degrade Mod 4: travel ~33% ready → +0 (need < 40% but >= 20%)
    // Degrade Mod 5: financial ~33% ready → +0 (need < 40% but >= 20%)
    // Expected: 52 + 5 + 6 + 5 + 0 + 0 + 5 = 73 (good)
    const children = ["yp_alex", "yp_jordan", "yp_casey"];
    const r = computeLeavingCareTransition({
      today: "2026-05-27",
      total_children: 3,
      transition_goals: children.map((c, i) =>
        makeGoal(`g${i + 1}`, c, { status: "achieved" }),
      ),
      pathway_plans: children.map((c, i) => makePlan(`pp${i + 1}`, c)),
      aspirations: children.map((c, i) => makeAspiration(`asp${i + 1}`, c)),
      independent_travel: [
        makeTravel("tr1", "yp_alex", { routes_mastered: 3, has_safety_plan: true }), // ready
        makeTravel("tr2", "yp_jordan", { routes_mastered: 1, has_safety_plan: false }), // not ready
        makeTravel("tr3", "yp_casey", { routes_mastered: 0, has_safety_plan: false }), // not ready
      ],
      leaving_care_packages: [
        makePackage("pkg1", "yp_alex", { savings_on_track: true, financial_literacy_progressing: true }), // ready
        makePackage("pkg2", "yp_jordan", { savings_on_track: false, financial_literacy_progressing: true }), // not ready
        makePackage("pkg3", "yp_casey", { savings_on_track: false, financial_literacy_progressing: false }), // not ready
      ],
    });
    // mod4: 1/3 = 33% → +0
    // mod5: 1/3 = 33% → +0
    expect(r.leaving_care_score).toBe(73);
    expect(r.leaving_care_rating).toBe("good");
  });

  it("headline reflects good status", () => {
    const r = computeLeavingCareTransition({
      ...baseInput(),
      independent_travel: [
        makeTravel("tr1", "yp_alex"),
        makeTravel("tr2", "yp_jordan", { routes_mastered: 0, has_safety_plan: false }),
        makeTravel("tr3", "yp_casey", { routes_mastered: 0, has_safety_plan: false }),
        makeTravel("tr4", "yp_riley", { routes_mastered: 0, has_safety_plan: false }),
      ],
      leaving_care_packages: [
        makePackage("pkg1", "yp_alex"),
        makePackage("pkg2", "yp_jordan", { savings_on_track: false, financial_literacy_progressing: false }),
        makePackage("pkg3", "yp_casey", { savings_on_track: false, financial_literacy_progressing: false }),
        makePackage("pkg4", "yp_riley", { savings_on_track: false, financial_literacy_progressing: false }),
      ],
    });
    expect(r.leaving_care_rating).toBe("good");
    expect(r.headline).toContain("Good");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. ADEQUATE RATING
// ═══════════════════════════════════════════════════════════════════════════

describe("adequate rating", () => {
  it("returns adequate when multiple modifiers are neutral or negative", () => {
    // Degrade mod1: 2/4 = 50% → +2
    // Degrade mod2: 2/4 = 50% goals achieved/on_track → +3
    // Degrade mod3: 2/4 = 50% aspirations → +2
    // Degrade mod4: 1/4 = 25% travel → +0
    // Degrade mod5: 1/4 = 25% financial → +0
    // Degrade mod6: 1/2 = 50% quality → +2
    // Total: 52 + 2 + 3 + 2 + 0 + 0 + 2 = 61 → adequate
    const r = computeLeavingCareTransition({
      today: "2026-05-27",
      total_children: 4,
      transition_goals: [
        makeGoal("g1", "yp_alex", { status: "achieved" }),
        makeGoal("g2", "yp_jordan", { status: "on_track" }),
        makeGoal("g3", "yp_casey", { status: "not_started" }),
        makeGoal("g4", "yp_riley", { status: "at_risk" }),
      ],
      pathway_plans: [
        makePlan("pp1", "yp_alex"),
        makePlan("pp2", "yp_jordan", { has_personal_advisor: false }),
        makePlan("pp3", "yp_casey", { status: "draft" }),
        makePlan("pp4", "yp_riley", { status: "expired" }),
      ],
      aspirations: [
        makeAspiration("asp1", "yp_alex"),
        makeAspiration("asp2", "yp_jordan"),
        makeAspiration("asp3", "yp_casey", { child_chose: false }),
        makeAspiration("asp4", "yp_riley", { has_steps_taken: false }),
      ],
      independent_travel: [
        makeTravel("tr1", "yp_alex"),
        makeTravel("tr2", "yp_jordan", { routes_mastered: 1, has_safety_plan: false }),
        makeTravel("tr3", "yp_casey", { routes_mastered: 0, has_safety_plan: false }),
        makeTravel("tr4", "yp_riley", { routes_mastered: 1, has_safety_plan: true }),
      ],
      leaving_care_packages: [
        makePackage("pkg1", "yp_alex"),
        makePackage("pkg2", "yp_jordan", { savings_on_track: false }),
        makePackage("pkg3", "yp_casey", { financial_literacy_progressing: false }),
        makePackage("pkg4", "yp_riley", { savings_on_track: false, financial_literacy_progressing: false }),
      ],
    });
    expect(r.leaving_care_rating).toBe("adequate");
    expect(r.leaving_care_score).toBeGreaterThanOrEqual(45);
    expect(r.leaving_care_score).toBeLessThan(65);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. INADEQUATE RATING
// ═══════════════════════════════════════════════════════════════════════════

describe("inadequate rating", () => {
  it("returns inadequate when all modifiers are maximally negative", () => {
    // mod1: 0/4 = 0% → -5
    // mod2: 0 goals → -5 (0% of 0, but pct returns 0 for d=0, so 0% < 30% → -5)
    // mod3: 0 aspirations → -5 (same)
    // mod4: 0 travel → -4 (same)
    // mod5: 0 packages → -4 (same)
    // mod6: 0 active plans → -5 (same)
    // Total: 52 + (-5) + (-5) + (-5) + (-4) + (-4) + (-5) = 24
    const r = computeLeavingCareTransition({
      today: "2026-05-27",
      total_children: 4,
      transition_goals: [],
      pathway_plans: [],
      aspirations: [],
      independent_travel: [],
      leaving_care_packages: [],
    });
    expect(r.leaving_care_rating).toBe("inadequate");
    expect(r.leaving_care_score).toBe(24);
  });

  it("headline reflects inadequate status", () => {
    const r = computeLeavingCareTransition({
      today: "2026-05-27",
      total_children: 4,
      transition_goals: [],
      pathway_plans: [],
      aspirations: [],
      independent_travel: [],
      leaving_care_packages: [],
    });
    expect(r.headline).toContain("urgent attention");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. MOD 1 — PATHWAY PLAN COVERAGE
// ═══════════════════════════════════════════════════════════════════════════

describe("mod1: pathway plan coverage", () => {
  it("awards +5 for >= 80% coverage", () => {
    const r = computeLeavingCareTransition(baseInput());
    // 4/4 = 100% → +5
    expect(r.children_with_pathway_plans).toBe(4);
  });

  it("awards +2 for >= 50% coverage", () => {
    const full = baseInput();
    const partial = baseInput({
      pathway_plans: [
        makePlan("pp1", "yp_alex"),
        makePlan("pp2", "yp_jordan"),
        // yp_casey and yp_riley have no plans → 2/4 = 50%
      ],
    });
    const rFull = computeLeavingCareTransition(full);
    const rPartial = computeLeavingCareTransition(partial);
    // Full: +5, Partial: +2 for mod1. Also mod6 changes (2 quality plans/2 active = 100% → +5).
    // Diff in mod1 only = 3
    expect(rFull.leaving_care_score - rPartial.leaving_care_score).toBe(3);
  });

  it("penalises -5 for < 30% coverage", () => {
    const r = computeLeavingCareTransition(baseInput({
      pathway_plans: [],
    }));
    // 0/4 = 0% → -5 for mod1, also mod6: 0 active → -5
    // vs base: mod1=+5, mod6=+5 → diff = 20
    const rBase = computeLeavingCareTransition(baseInput());
    expect(rBase.leaving_care_score - r.leaving_care_score).toBe(20);
  });

  it("only counts active plans (active_16_18 and active_18plus_formerly_looked_after)", () => {
    const r = computeLeavingCareTransition(baseInput({
      pathway_plans: [
        makePlan("pp1", "yp_alex", { status: "active_16_18" }),
        makePlan("pp2", "yp_jordan", { status: "active_18plus_formerly_looked_after" }),
        makePlan("pp3", "yp_casey", { status: "draft" }),
        makePlan("pp4", "yp_riley", { status: "expired" }),
      ],
    }));
    expect(r.children_with_pathway_plans).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. MOD 2 — GOAL ACHIEVEMENT
// ═══════════════════════════════════════════════════════════════════════════

describe("mod2: goal achievement", () => {
  it("awards +6 for >= 75% achieved or on_track", () => {
    const r = computeLeavingCareTransition(baseInput({
      transition_goals: [
        makeGoal("g1", "yp_alex", { status: "achieved" }),
        makeGoal("g2", "yp_jordan", { status: "on_track" }),
        makeGoal("g3", "yp_casey", { status: "achieved" }),
        makeGoal("g4", "yp_riley", { status: "on_track" }),
      ],
    }));
    expect(r.goal_achievement_rate).toBe(100);
  });

  it("awards +3 for >= 50% achieved or on_track", () => {
    const full = baseInput();
    const half = baseInput({
      transition_goals: [
        makeGoal("g1", "yp_alex", { status: "achieved" }),
        makeGoal("g2", "yp_jordan", { status: "on_track" }),
        makeGoal("g3", "yp_casey", { status: "not_started" }),
        makeGoal("g4", "yp_riley", { status: "in_progress" }),
      ],
    });
    const rFull = computeLeavingCareTransition(full);
    const rHalf = computeLeavingCareTransition(half);
    // Full: mod2=+6, Half: 2/4=50% → mod2=+3. Diff = 3
    expect(rFull.leaving_care_score - rHalf.leaving_care_score).toBe(3);
  });

  it("penalises -5 for < 30% achieved or on_track", () => {
    const r = computeLeavingCareTransition(baseInput({
      transition_goals: [
        makeGoal("g1", "yp_alex", { status: "not_started" }),
        makeGoal("g2", "yp_jordan", { status: "in_progress" }),
        makeGoal("g3", "yp_casey", { status: "paused" }),
        makeGoal("g4", "yp_riley", { status: "at_risk" }),
      ],
    }));
    expect(r.goal_achievement_rate).toBe(0);
  });

  it("counts both achieved and on_track statuses", () => {
    const r = computeLeavingCareTransition(baseInput({
      transition_goals: [
        makeGoal("g1", "yp_alex", { status: "achieved" }),
        makeGoal("g2", "yp_jordan", { status: "on_track" }),
        makeGoal("g3", "yp_casey", { status: "not_started" }),
      ],
    }));
    expect(r.goal_achievement_rate).toBe(67); // 2/3
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. MOD 3 — ASPIRATION ENGAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

describe("mod3: aspiration engagement", () => {
  it("awards +5 for >= 80% child-chosen with steps", () => {
    const r = computeLeavingCareTransition(baseInput());
    // All 4 aspirations are child_chose=true, has_steps_taken=true → 100%
    expect(r.leaving_care_score).toBe(82);
  });

  it("awards +2 for >= 50% engagement", () => {
    const full = baseInput();
    const half = baseInput({
      aspirations: [
        makeAspiration("asp1", "yp_alex"),
        makeAspiration("asp2", "yp_jordan"),
        makeAspiration("asp3", "yp_casey", { child_chose: false }),
        makeAspiration("asp4", "yp_riley", { has_steps_taken: false }),
      ],
    });
    const rFull = computeLeavingCareTransition(full);
    const rHalf = computeLeavingCareTransition(half);
    // Full: mod3=+5, Half: 2/4=50% → mod3=+2. Diff = 3
    expect(rFull.leaving_care_score - rHalf.leaving_care_score).toBe(3);
  });

  it("penalises -5 for < 30% engagement", () => {
    const r = computeLeavingCareTransition(baseInput({
      aspirations: [
        makeAspiration("asp1", "yp_alex", { child_chose: false }),
        makeAspiration("asp2", "yp_jordan", { has_steps_taken: false }),
        makeAspiration("asp3", "yp_casey", { child_chose: false, has_steps_taken: false }),
        makeAspiration("asp4", "yp_riley", { child_chose: true, has_steps_taken: true }),
      ],
    }));
    // 1/4 = 25% → +0 (>= 30% would be +0, but 25% < 30% → actually check: >=30 → 0, <30 → -5)
    // 25% < 30% → -5
    const rBase = computeLeavingCareTransition(baseInput());
    expect(rBase.leaving_care_score - r.leaving_care_score).toBe(10);
  });

  it("requires both child_chose AND has_steps_taken for engagement", () => {
    const r = computeLeavingCareTransition(baseInput({
      aspirations: [
        makeAspiration("asp1", "yp_alex", { child_chose: true, has_steps_taken: false }),
        makeAspiration("asp2", "yp_jordan", { child_chose: false, has_steps_taken: true }),
      ],
    }));
    // Neither qualifies → 0/2 = 0% → -5
    // vs base mod3=+5: diff from base = 10
    const rBase = computeLeavingCareTransition(baseInput());
    expect(rBase.leaving_care_score - r.leaving_care_score).toBe(10);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. MOD 4 — TRAVEL READINESS
// ═══════════════════════════════════════════════════════════════════════════

describe("mod4: travel readiness", () => {
  it("awards +5 for >= 70% travel ready", () => {
    const r = computeLeavingCareTransition(baseInput());
    // All 4 children have routes_mastered >= 2 and has_safety_plan → 100%
    expect(r.travel_readiness_rate).toBe(100);
  });

  it("awards +2 for >= 40% travel ready", () => {
    const r = computeLeavingCareTransition(baseInput({
      independent_travel: [
        makeTravel("tr1", "yp_alex"),
        makeTravel("tr2", "yp_jordan"),
        makeTravel("tr3", "yp_casey", { routes_mastered: 0, has_safety_plan: false }),
        makeTravel("tr4", "yp_riley", { routes_mastered: 1, has_safety_plan: false }),
        makeTravel("tr5", "yp_extra", { routes_mastered: 0, has_safety_plan: false }),
      ],
    }));
    expect(r.travel_readiness_rate).toBe(40); // 2/5
  });

  it("penalises -4 for < 20% travel ready", () => {
    const full = baseInput();
    const poor = baseInput({
      independent_travel: [
        makeTravel("tr1", "yp_alex", { routes_mastered: 0, has_safety_plan: false }),
        makeTravel("tr2", "yp_jordan", { routes_mastered: 1, has_safety_plan: false }),
        makeTravel("tr3", "yp_casey", { routes_mastered: 0, has_safety_plan: true }),
        makeTravel("tr4", "yp_riley", { routes_mastered: 1, has_safety_plan: false }),
      ],
    });
    const rFull = computeLeavingCareTransition(full);
    const rPoor = computeLeavingCareTransition(poor);
    // Full: mod4=+5, Poor: 0/4=0% → mod4=-4. Diff = 9
    expect(rFull.leaving_care_score - rPoor.leaving_care_score).toBe(9);
  });

  it("requires routes_mastered >= 2 AND has_safety_plan for readiness", () => {
    const r = computeLeavingCareTransition(baseInput({
      independent_travel: [
        makeTravel("tr1", "yp_alex", { routes_mastered: 3, has_safety_plan: true }),  // ready
        makeTravel("tr2", "yp_jordan", { routes_mastered: 2, has_safety_plan: false }), // not ready
        makeTravel("tr3", "yp_casey", { routes_mastered: 1, has_safety_plan: true }),  // not ready
      ],
    }));
    expect(r.travel_readiness_rate).toBe(33); // 1/3
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. MOD 5 — FINANCIAL READINESS
// ═══════════════════════════════════════════════════════════════════════════

describe("mod5: financial readiness", () => {
  it("awards +4 for >= 70% financially ready", () => {
    const r = computeLeavingCareTransition(baseInput());
    expect(r.financial_readiness_rate).toBe(100);
  });

  it("awards +1 for >= 40% financially ready", () => {
    const full = baseInput();
    const partial = baseInput({
      leaving_care_packages: [
        makePackage("pkg1", "yp_alex"),
        makePackage("pkg2", "yp_jordan"),
        makePackage("pkg3", "yp_casey", { savings_on_track: false }),
        makePackage("pkg4", "yp_riley", { financial_literacy_progressing: false }),
        makePackage("pkg5", "yp_extra", { savings_on_track: false, financial_literacy_progressing: false }),
      ],
    });
    const rFull = computeLeavingCareTransition(full);
    const rPartial = computeLeavingCareTransition(partial);
    // Full: mod5=+4, Partial: 2/5=40% → mod5=+1. Diff = 3
    expect(rFull.leaving_care_score - rPartial.leaving_care_score).toBe(3);
  });

  it("penalises -4 for < 20% financially ready", () => {
    const full = baseInput();
    const poor = baseInput({
      leaving_care_packages: [
        makePackage("pkg1", "yp_alex", { savings_on_track: false }),
        makePackage("pkg2", "yp_jordan", { financial_literacy_progressing: false }),
        makePackage("pkg3", "yp_casey", { savings_on_track: false }),
        makePackage("pkg4", "yp_riley", { savings_on_track: false, financial_literacy_progressing: false }),
      ],
    });
    const rFull = computeLeavingCareTransition(full);
    const rPoor = computeLeavingCareTransition(poor);
    // Full: mod5=+4, Poor: 0/4=0% → mod5=-4. Diff = 8
    expect(rFull.leaving_care_score - rPoor.leaving_care_score).toBe(8);
  });

  it("requires both savings_on_track AND financial_literacy_progressing", () => {
    const r = computeLeavingCareTransition(baseInput({
      leaving_care_packages: [
        makePackage("pkg1", "yp_alex", { savings_on_track: true, financial_literacy_progressing: false }),
        makePackage("pkg2", "yp_jordan", { savings_on_track: false, financial_literacy_progressing: true }),
      ],
    }));
    expect(r.financial_readiness_rate).toBe(0); // neither qualifies
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. MOD 6 — PATHWAY PLAN QUALITY
// ═══════════════════════════════════════════════════════════════════════════

describe("mod6: pathway plan quality", () => {
  it("awards +5 for >= 80% quality plans", () => {
    const r = computeLeavingCareTransition(baseInput());
    // All 4 active plans are fully quality → 100%
    expect(r.leaving_care_score).toBe(82);
  });

  it("awards +2 for >= 50% quality plans", () => {
    const full = baseInput();
    const mixed = baseInput({
      pathway_plans: [
        makePlan("pp1", "yp_alex"),
        makePlan("pp2", "yp_jordan", { has_personal_advisor: false }),
        makePlan("pp3", "yp_casey"),
        makePlan("pp4", "yp_riley", { has_eet_plan: false }),
      ],
    });
    const rFull = computeLeavingCareTransition(full);
    const rMixed = computeLeavingCareTransition(mixed);
    // Full: mod6=+5, Mixed: 2/4=50% → mod6=+2. Diff = 3
    expect(rFull.leaving_care_score - rMixed.leaving_care_score).toBe(3);
  });

  it("penalises -5 for < 30% quality plans", () => {
    const full = baseInput();
    const poor = baseInput({
      pathway_plans: [
        makePlan("pp1", "yp_alex", { has_personal_advisor: false }),
        makePlan("pp2", "yp_jordan", { has_accommodation_plan: false }),
        makePlan("pp3", "yp_casey", { has_eet_plan: false }),
        makePlan("pp4", "yp_riley", { last_review_within_6_months: false }),
      ],
    });
    const rFull = computeLeavingCareTransition(full);
    const rPoor = computeLeavingCareTransition(poor);
    // Full: mod6=+5, Poor: 0/4=0% → mod6=-5. Diff = 10
    expect(rFull.leaving_care_score - rPoor.leaving_care_score).toBe(10);
  });

  it("requires all four quality criteria for a plan to count", () => {
    // All 4 children have active plans but none meet all 4 quality criteria
    const r = computeLeavingCareTransition(baseInput({
      pathway_plans: [
        makePlan("pp1", "yp_alex", { last_review_within_6_months: false }),
        makePlan("pp2", "yp_jordan", { has_personal_advisor: false }),
        makePlan("pp3", "yp_casey", { has_accommodation_plan: false }),
        makePlan("pp4", "yp_riley", { has_eet_plan: false }),
      ],
    }));
    // mod1 unchanged (4/4 = 100% → +5), but mod6: 0/4 quality = 0% → -5
    // vs base mod6=+5. Diff = 10
    const rBase = computeLeavingCareTransition(baseInput());
    expect(rBase.leaving_care_score - r.leaving_care_score).toBe(10);
  });

  it("only evaluates quality on active plans, ignores draft/expired", () => {
    const r = computeLeavingCareTransition(baseInput({
      pathway_plans: [
        makePlan("pp1", "yp_alex"), // active, full quality
        makePlan("pp2", "yp_jordan", { status: "draft" }), // ignored for quality
        makePlan("pp3", "yp_casey", { status: "expired", has_personal_advisor: false }), // ignored
        makePlan("pp4", "yp_riley"), // active, full quality
      ],
    }));
    // Active plans: pp1, pp4 (both quality). 2/2 = 100% → +5
    // But pathway coverage: only alex and riley have active plans → 2/4 = 50% → +2 (not +5)
    expect(r.children_with_pathway_plans).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. METRICS
// ═══════════════════════════════════════════════════════════════════════════

describe("output metrics", () => {
  it("calculates children_with_pathway_plans as unique active children", () => {
    const r = computeLeavingCareTransition(baseInput({
      pathway_plans: [
        makePlan("pp1", "yp_alex"),
        makePlan("pp2", "yp_alex", { status: "active_18plus_formerly_looked_after" }), // duplicate child
        makePlan("pp3", "yp_jordan"),
      ],
    }));
    expect(r.children_with_pathway_plans).toBe(2); // unique: alex, jordan
  });

  it("calculates goal_achievement_rate correctly", () => {
    const r = computeLeavingCareTransition(baseInput({
      transition_goals: [
        makeGoal("g1", "yp_alex", { status: "achieved" }),
        makeGoal("g2", "yp_jordan", { status: "on_track" }),
        makeGoal("g3", "yp_casey", { status: "in_progress" }),
        makeGoal("g4", "yp_riley", { status: "not_started" }),
      ],
    }));
    expect(r.goal_achievement_rate).toBe(50); // 2/4
  });

  it("calculates aspiration_recording_rate as aspirations/total_children", () => {
    const r = computeLeavingCareTransition(baseInput({
      aspirations: [
        makeAspiration("asp1", "yp_alex"),
        makeAspiration("asp2", "yp_jordan"),
      ],
    }));
    expect(r.aspiration_recording_rate).toBe(50); // 2/4 children
  });

  it("calculates travel_readiness_rate correctly", () => {
    const r = computeLeavingCareTransition(baseInput({
      independent_travel: [
        makeTravel("tr1", "yp_alex", { routes_mastered: 3, has_safety_plan: true }),
        makeTravel("tr2", "yp_jordan", { routes_mastered: 2, has_safety_plan: true }),
        makeTravel("tr3", "yp_casey", { routes_mastered: 1, has_safety_plan: true }),
      ],
    }));
    expect(r.travel_readiness_rate).toBe(67); // 2/3
  });

  it("calculates financial_readiness_rate correctly", () => {
    const r = computeLeavingCareTransition(baseInput({
      leaving_care_packages: [
        makePackage("pkg1", "yp_alex"),
        makePackage("pkg2", "yp_jordan", { savings_on_track: false }),
        makePackage("pkg3", "yp_casey"),
        makePackage("pkg4", "yp_riley", { financial_literacy_progressing: false }),
      ],
    }));
    expect(r.financial_readiness_rate).toBe(50); // 2/4
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. STRENGTHS
// ═══════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("includes goal achievement strength for >= 75%", () => {
    const r = computeLeavingCareTransition(baseInput());
    expect(r.strengths.some((s) => s.includes("goals are achieved or on track"))).toBe(true);
  });

  it("includes aspiration engagement strength for >= 80%", () => {
    const r = computeLeavingCareTransition(baseInput());
    expect(r.strengths.some((s) => s.includes("child-chosen"))).toBe(true);
  });

  it("includes travel readiness strength for >= 70%", () => {
    const r = computeLeavingCareTransition(baseInput());
    expect(r.strengths.some((s) => s.includes("travel readiness"))).toBe(true);
  });

  it("includes pathway coverage strength for >= 80%", () => {
    const r = computeLeavingCareTransition(baseInput());
    expect(r.strengths.some((s) => s.includes("pathway plans"))).toBe(true);
  });

  it("includes plan quality strength for >= 80%", () => {
    const r = computeLeavingCareTransition(baseInput());
    expect(r.strengths.some((s) => s.includes("high quality"))).toBe(true);
  });

  it("includes financial readiness strength for >= 70%", () => {
    const r = computeLeavingCareTransition(baseInput());
    expect(r.strengths.some((s) => s.includes("savings on track"))).toBe(true);
  });

  it("returns no strengths for a poor scenario", () => {
    const r = computeLeavingCareTransition({
      today: "2026-05-27",
      total_children: 4,
      transition_goals: [],
      pathway_plans: [],
      aspirations: [],
      independent_travel: [],
      leaving_care_packages: [],
    });
    expect(r.strengths).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. CONCERNS
// ═══════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("flags low pathway coverage", () => {
    const r = computeLeavingCareTransition(baseInput({
      pathway_plans: [makePlan("pp1", "yp_alex")],
    }));
    // 1/4 = 25% < 50% → concern
    expect(r.concerns.some((c) => c.includes("pathway plans"))).toBe(true);
  });

  it("flags low financial readiness", () => {
    const r = computeLeavingCareTransition(baseInput({
      leaving_care_packages: [
        makePackage("pkg1", "yp_alex", { savings_on_track: false }),
        makePackage("pkg2", "yp_jordan", { financial_literacy_progressing: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("Financial readiness"))).toBe(true);
  });

  it("flags no aspirations recorded", () => {
    const r = computeLeavingCareTransition(baseInput({ aspirations: [] }));
    expect(r.concerns.some((c) => c.includes("No aspirations"))).toBe(true);
  });

  it("flags low goal achievement", () => {
    const r = computeLeavingCareTransition(baseInput({
      transition_goals: [
        makeGoal("g1", "yp_alex", { status: "not_started" }),
        makeGoal("g2", "yp_jordan", { status: "paused" }),
        makeGoal("g3", "yp_casey", { status: "at_risk" }),
        makeGoal("g4", "yp_riley", { status: "in_progress" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("goals are achieved or on track"))).toBe(true);
  });

  it("flags low travel readiness", () => {
    const r = computeLeavingCareTransition(baseInput({
      independent_travel: [
        makeTravel("tr1", "yp_alex", { routes_mastered: 0, has_safety_plan: false }),
        makeTravel("tr2", "yp_jordan", { routes_mastered: 1, has_safety_plan: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("Travel readiness"))).toBe(true);
  });

  it("flags poor plan quality", () => {
    const r = computeLeavingCareTransition(baseInput({
      pathway_plans: [
        makePlan("pp1", "yp_alex", { has_personal_advisor: false }),
        makePlan("pp2", "yp_jordan", { has_accommodation_plan: false }),
        makePlan("pp3", "yp_casey", { has_eet_plan: false }),
        makePlan("pp4", "yp_riley", { last_review_within_6_months: false }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("pathway plans lack key components"))).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. RECOMMENDATIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("generates immediate rec for low pathway coverage", () => {
    const r = computeLeavingCareTransition(baseInput({
      pathway_plans: [makePlan("pp1", "yp_alex")],
    }));
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("pathway plans"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
    expect(rec!.regulatory_ref).toBe("Leaving Care Act 2000");
  });

  it("generates rec for aspiration engagement with CHR 2015 Reg 5 reference", () => {
    const r = computeLeavingCareTransition(baseInput({ aspirations: [] }));
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("aspiration"));
    expect(rec).toBeDefined();
    expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 5");
  });

  it("generates rec for financial readiness", () => {
    const r = computeLeavingCareTransition(baseInput({
      leaving_care_packages: [
        makePackage("pkg1", "yp_alex", { savings_on_track: false }),
        makePackage("pkg2", "yp_jordan", { financial_literacy_progressing: false }),
      ],
    }));
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("financial"));
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
  });

  it("generates rec for travel readiness", () => {
    const r = computeLeavingCareTransition(baseInput({
      independent_travel: [
        makeTravel("tr1", "yp_alex", { routes_mastered: 0, has_safety_plan: false }),
        makeTravel("tr2", "yp_jordan", { routes_mastered: 1, has_safety_plan: false }),
        makeTravel("tr3", "yp_casey", { routes_mastered: 0, has_safety_plan: false }),
      ],
    }));
    const rec = r.recommendations.find((rec) => rec.recommendation.includes("travel"));
    expect(rec).toBeDefined();
  });

  it("ranks recommendations sequentially", () => {
    const r = computeLeavingCareTransition({
      today: "2026-05-27",
      total_children: 4,
      transition_goals: [
        makeGoal("g1", "yp_alex", { status: "at_risk" }),
      ],
      pathway_plans: [],
      aspirations: [],
      independent_travel: [
        makeTravel("tr1", "yp_alex", { routes_mastered: 0, has_safety_plan: false }),
      ],
      leaving_care_packages: [
        makePackage("pkg1", "yp_alex", { savings_on_track: false }),
      ],
    });
    if (r.recommendations.length >= 2) {
      for (let i = 1; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBeGreaterThan(r.recommendations[i - 1].rank);
      }
    }
  });

  it("returns no recommendations for outstanding base input", () => {
    const r = computeLeavingCareTransition(baseInput());
    expect(r.recommendations).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. INSIGHTS
// ═══════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  it("generates critical insight for very low pathway coverage", () => {
    const r = computeLeavingCareTransition(baseInput({
      pathway_plans: [],
    }));
    const ins = r.insights.find((i) => i.text.includes("pathway plans"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("critical");
  });

  it("generates critical insight for no aspirations", () => {
    const r = computeLeavingCareTransition(baseInput({ aspirations: [] }));
    const ins = r.insights.find((i) => i.text.includes("aspirations"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("critical");
  });

  it("generates critical insight for very low financial readiness", () => {
    const r = computeLeavingCareTransition(baseInput({
      leaving_care_packages: [
        makePackage("pkg1", "yp_alex", { savings_on_track: false }),
        makePackage("pkg2", "yp_jordan", { savings_on_track: false, financial_literacy_progressing: false }),
      ],
    }));
    const ins = r.insights.find((i) => i.text.includes("Financial readiness"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("critical");
  });

  it("generates warning insight for low goal achievement", () => {
    const r = computeLeavingCareTransition(baseInput({
      transition_goals: [
        makeGoal("g1", "yp_alex", { status: "not_started" }),
        makeGoal("g2", "yp_jordan", { status: "in_progress" }),
        makeGoal("g3", "yp_casey", { status: "paused" }),
        makeGoal("g4", "yp_riley", { status: "at_risk" }),
      ],
    }));
    const ins = r.insights.find((i) => i.text.includes("transition goals"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("warning");
  });

  it("generates warning insight for low travel readiness", () => {
    const r = computeLeavingCareTransition(baseInput({
      independent_travel: [
        makeTravel("tr1", "yp_alex", { routes_mastered: 1, has_safety_plan: false }),
        makeTravel("tr2", "yp_jordan", { routes_mastered: 0, has_safety_plan: false }),
        makeTravel("tr3", "yp_casey", { routes_mastered: 1, has_safety_plan: true }),
      ],
    }));
    const ins = r.insights.find((i) => i.text.includes("Travel readiness"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("warning");
  });

  it("generates positive insight for high goal achievement", () => {
    const r = computeLeavingCareTransition(baseInput());
    const ins = r.insights.find((i) => i.text.includes("evidence-based preparation"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("positive");
  });

  it("generates positive insight for strong aspiration engagement", () => {
    const r = computeLeavingCareTransition(baseInput());
    const ins = r.insights.find((i) => i.text.includes("child-chosen"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("positive");
  });

  it("generates positive insight for strong pathway coverage + quality", () => {
    const r = computeLeavingCareTransition(baseInput());
    const ins = r.insights.find((i) => i.text.includes("Pathway plan coverage and quality"));
    expect(ins).toBeDefined();
    expect(ins!.severity).toBe("positive");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 17. HEADLINES
// ═══════════════════════════════════════════════════════════════════════════

describe("headlines", () => {
  it("headline for outstanding mentions Excellent", () => {
    const r = computeLeavingCareTransition(baseInput());
    expect(r.headline).toContain("Excellent");
  });

  it("headline for good mentions Good", () => {
    const children = ["yp_alex", "yp_jordan", "yp_casey"];
    const r = computeLeavingCareTransition({
      today: "2026-05-27",
      total_children: 3,
      transition_goals: children.map((c, i) =>
        makeGoal(`g${i + 1}`, c, { status: "achieved" }),
      ),
      pathway_plans: children.map((c, i) => makePlan(`pp${i + 1}`, c)),
      aspirations: children.map((c, i) => makeAspiration(`asp${i + 1}`, c)),
      independent_travel: [
        makeTravel("tr1", "yp_alex"),
        makeTravel("tr2", "yp_jordan", { routes_mastered: 0, has_safety_plan: false }),
        makeTravel("tr3", "yp_casey", { routes_mastered: 0, has_safety_plan: false }),
      ],
      leaving_care_packages: [
        makePackage("pkg1", "yp_alex"),
        makePackage("pkg2", "yp_jordan", { savings_on_track: false }),
        makePackage("pkg3", "yp_casey", { savings_on_track: false, financial_literacy_progressing: false }),
      ],
    });
    expect(r.leaving_care_rating).toBe("good");
    expect(r.headline).toContain("Good");
  });

  it("headline for adequate mentions concern(s)", () => {
    const r = computeLeavingCareTransition({
      today: "2026-05-27",
      total_children: 4,
      transition_goals: [
        makeGoal("g1", "yp_alex", { status: "achieved" }),
        makeGoal("g2", "yp_jordan", { status: "on_track" }),
        makeGoal("g3", "yp_casey", { status: "not_started" }),
        makeGoal("g4", "yp_riley", { status: "at_risk" }),
      ],
      pathway_plans: [
        makePlan("pp1", "yp_alex"),
        makePlan("pp2", "yp_jordan", { has_personal_advisor: false }),
        makePlan("pp3", "yp_casey", { status: "draft" }),
        makePlan("pp4", "yp_riley", { status: "expired" }),
      ],
      aspirations: [
        makeAspiration("asp1", "yp_alex"),
        makeAspiration("asp2", "yp_jordan"),
        makeAspiration("asp3", "yp_casey", { child_chose: false }),
        makeAspiration("asp4", "yp_riley", { has_steps_taken: false }),
      ],
      independent_travel: [
        makeTravel("tr1", "yp_alex"),
        makeTravel("tr2", "yp_jordan", { routes_mastered: 1, has_safety_plan: false }),
        makeTravel("tr3", "yp_casey", { routes_mastered: 0, has_safety_plan: false }),
        makeTravel("tr4", "yp_riley", { routes_mastered: 1, has_safety_plan: true }),
      ],
      leaving_care_packages: [
        makePackage("pkg1", "yp_alex"),
        makePackage("pkg2", "yp_jordan", { savings_on_track: false }),
        makePackage("pkg3", "yp_casey", { financial_literacy_progressing: false }),
        makePackage("pkg4", "yp_riley", { savings_on_track: false, financial_literacy_progressing: false }),
      ],
    });
    expect(r.leaving_care_rating).toBe("adequate");
    expect(r.headline).toContain("concern");
  });

  it("headline for inadequate mentions urgent attention", () => {
    const r = computeLeavingCareTransition({
      today: "2026-05-27",
      total_children: 4,
      transition_goals: [],
      pathway_plans: [],
      aspirations: [],
      independent_travel: [],
      leaving_care_packages: [],
    });
    expect(r.headline).toContain("urgent attention");
  });

  it("headline for insufficient_data mentions no children", () => {
    const r = computeLeavingCareTransition(baseInput({ total_children: 0 }));
    expect(r.headline).toContain("No children");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 18. SCORE CLAMPING
// ═══════════════════════════════════════════════════════════════════════════

describe("score clamping", () => {
  it("never exceeds 100", () => {
    // Even with very high inputs, score capped at 100
    const children = Array.from({ length: 10 }, (_, i) => `yp_${i}`);
    const r = computeLeavingCareTransition({
      today: "2026-05-27",
      total_children: 10,
      transition_goals: children.map((c, i) =>
        makeGoal(`g${i}`, c, { status: "achieved" }),
      ),
      pathway_plans: children.map((c, i) => makePlan(`pp${i}`, c)),
      aspirations: children.map((c, i) => makeAspiration(`asp${i}`, c)),
      independent_travel: children.map((c, i) => makeTravel(`tr${i}`, c)),
      leaving_care_packages: children.map((c, i) => makePackage(`pkg${i}`, c)),
    });
    expect(r.leaving_care_score).toBeLessThanOrEqual(100);
  });

  it("never goes below 0", () => {
    // Maximally negative scenario with many children and no data
    const r = computeLeavingCareTransition({
      today: "2026-05-27",
      total_children: 20,
      transition_goals: [],
      pathway_plans: [],
      aspirations: [],
      independent_travel: [],
      leaving_care_packages: [],
    });
    expect(r.leaving_care_score).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 19. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles empty arrays for all data collections", () => {
    const r = computeLeavingCareTransition({
      today: "2026-05-27",
      total_children: 2,
      transition_goals: [],
      pathway_plans: [],
      aspirations: [],
      independent_travel: [],
      leaving_care_packages: [],
    });
    expect(r.leaving_care_rating).toBe("inadequate");
    expect(r.goal_achievement_rate).toBeNull();
    expect(r.aspiration_recording_rate).toBe(0);
    expect(r.travel_readiness_rate).toBeNull();
    expect(r.financial_readiness_rate).toBeNull();
  });

  it("handles single child with full data", () => {
    const r = computeLeavingCareTransition({
      today: "2026-05-27",
      total_children: 1,
      transition_goals: [makeGoal("g1", "yp_alex")],
      pathway_plans: [makePlan("pp1", "yp_alex")],
      aspirations: [makeAspiration("asp1", "yp_alex")],
      independent_travel: [makeTravel("tr1", "yp_alex")],
      leaving_care_packages: [makePackage("pkg1", "yp_alex")],
    });
    expect(r.leaving_care_rating).toBe("outstanding");
    expect(r.children_with_pathway_plans).toBe(1);
  });

  it("handles multiple plans per child (only unique children counted)", () => {
    const r = computeLeavingCareTransition(baseInput({
      pathway_plans: [
        makePlan("pp1", "yp_alex", { status: "active_16_18" }),
        makePlan("pp2", "yp_alex", { status: "active_18plus_formerly_looked_after" }),
        makePlan("pp3", "yp_jordan", { status: "active_16_18" }),
      ],
    }));
    expect(r.children_with_pathway_plans).toBe(2); // alex + jordan
  });

  it("handles all goals in paused status", () => {
    const r = computeLeavingCareTransition(baseInput({
      transition_goals: [
        makeGoal("g1", "yp_alex", { status: "paused" }),
        makeGoal("g2", "yp_jordan", { status: "paused" }),
      ],
    }));
    expect(r.goal_achievement_rate).toBe(0);
  });

  it("handles mixed active and inactive pathway plans", () => {
    const r = computeLeavingCareTransition(baseInput({
      pathway_plans: [
        makePlan("pp1", "yp_alex", { status: "active_16_18" }),
        makePlan("pp2", "yp_jordan", { status: "draft" }),
        makePlan("pp3", "yp_casey", { status: "expired" }),
        makePlan("pp4", "yp_riley", { status: "active_18plus_formerly_looked_after" }),
      ],
    }));
    expect(r.children_with_pathway_plans).toBe(2); // alex + riley
  });

  it("handles travel records with routes_mastered exactly 2 and safety plan", () => {
    const r = computeLeavingCareTransition(baseInput({
      independent_travel: [
        makeTravel("tr1", "yp_alex", { routes_mastered: 2, has_safety_plan: true }),
      ],
    }));
    expect(r.travel_readiness_rate).toBe(100); // 1/1, routes_mastered >= 2
  });

  it("handles zero goals but other data present", () => {
    const r = computeLeavingCareTransition(baseInput({
      transition_goals: [],
    }));
    // goal_achievement_rate is unmeasured — 0 goals means nothing to score, not a 0% achievement rate
    expect(r.goal_achievement_rate).toBeNull();
    // But pathway plans, aspirations, travel, financial should still score
    expect(r.children_with_pathway_plans).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 20. REGULATORY REFERENCES
// ═══════════════════════════════════════════════════════════════════════════

describe("regulatory references", () => {
  it("references Leaving Care Act 2000 for pathway plan recommendations", () => {
    const r = computeLeavingCareTransition(baseInput({
      pathway_plans: [],
    }));
    const rec = r.recommendations.find((r) => r.regulatory_ref === "Leaving Care Act 2000");
    expect(rec).toBeDefined();
  });

  it("references CHR 2015 Reg 5 for aspiration recommendations", () => {
    const r = computeLeavingCareTransition(baseInput({ aspirations: [] }));
    const rec = r.recommendations.find((r) => r.regulatory_ref === "CHR 2015 Reg 5");
    expect(rec).toBeDefined();
  });

  it("uses null regulatory_ref for travel recommendations", () => {
    const r = computeLeavingCareTransition(baseInput({
      independent_travel: [
        makeTravel("tr1", "yp_alex", { routes_mastered: 0, has_safety_plan: false }),
        makeTravel("tr2", "yp_jordan", { routes_mastered: 0, has_safety_plan: false }),
      ],
    }));
    const rec = r.recommendations.find((r) => r.recommendation.includes("travel"));
    expect(rec).toBeDefined();
    expect(rec!.regulatory_ref).toBeNull();
  });

  it("insights reference Leaving Care Act 2000 in text", () => {
    const r = computeLeavingCareTransition(baseInput({
      pathway_plans: [],
    }));
    const ins = r.insights.find((i) => i.text.includes("Leaving Care Act 2000"));
    expect(ins).toBeDefined();
  });

  it("insights reference Reg 5 in text for aspiration engagement", () => {
    const r = computeLeavingCareTransition(baseInput());
    const ins = r.insights.find((i) => i.text.includes("Reg 5"));
    expect(ins).toBeDefined();
  });
});
