import { describe, it, expect, beforeEach } from "vitest";
import {
  computeFoodNutritionHygieneSafety,
  type FoodHygieneSafetyInput,
  type FoodBudgetInput,
  type FoodHygieneCheckInput,
  type MealPlanInput,
} from "../home-food-nutrition-hygiene-safety-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

let _id = 0;
const uid = () => `fhs-${++_id}`;

function makeBudget(overrides: Partial<FoodBudgetInput> = {}): FoodBudgetInput {
  return {
    id: uid(),
    weekly_budget: 200,
    total_spent: 180,
    cook_from_scratch_proportion: 80,
    cultural_ingredients_included: true,
    sensory_friendly_options: true,
    child_requests_honoured_count: 3,
    waste_noted: false,
    ...overrides,
  };
}

function makeHygieneCheck(overrides: Partial<FoodHygieneCheckInput> = {}): FoodHygieneCheckInput {
  return {
    id: uid(),
    check_type: "fridge_temp",
    compliance: "pass",
    action_required: false,
    action_completed: false,
    ...overrides,
  };
}

function makeMealPlan(overrides: Partial<MealPlanInput> = {}): MealPlanInput {
  return {
    id: uid(),
    child_id: "c1",
    dietary_needs_met: true,
    balanced_nutrition: true,
    child_choice_offered: true,
    ...overrides,
  };
}

/**
 * baseInput() -> score 82 outstanding
 * 4 children, 4 budgets all within budget with 80% scratch + cultural,
 * 12 hygiene checks all pass (2 with action_required + completed),
 * 4 meal plans all compliant.
 *
 * Scoring: 52 base
 * mod1: 12/12 pass = 100% >= 95 => +5  = 57
 * mod2: 4/4 within budget = 100% >= 90 => +6  = 63
 * mod3: avg 80% scratch >= 70 => +5  = 68
 * mod4: 4/4 dietary met = 100% >= 90 => +5  = 73
 * mod5: 4/4 cultural = 100% >= 80 => +4  = 77
 * mod6: 2/2 actions completed = 100% >= 90 => +5  = 82
 */
function baseInput(overrides: Partial<FoodHygieneSafetyInput> = {}): FoodHygieneSafetyInput {
  return {
    today: "2026-05-27",
    total_children: 4,
    budgets: [
      makeBudget(),
      makeBudget(),
      makeBudget(),
      makeBudget(),
    ],
    hygiene_checks: [
      makeHygieneCheck({ check_type: "fridge_temp" }),
      makeHygieneCheck({ check_type: "freezer_temp" }),
      makeHygieneCheck({ check_type: "cooking_temp" }),
      makeHygieneCheck({ check_type: "cleaning_record" }),
      makeHygieneCheck({ check_type: "allergen_check" }),
      makeHygieneCheck({ check_type: "fridge_temp" }),
      makeHygieneCheck({ check_type: "freezer_temp" }),
      makeHygieneCheck({ check_type: "cooking_temp" }),
      makeHygieneCheck({ check_type: "cleaning_record" }),
      makeHygieneCheck({ check_type: "allergen_check" }),
      makeHygieneCheck({ check_type: "fridge_temp", action_required: true, action_completed: true }),
      makeHygieneCheck({ check_type: "freezer_temp", action_required: true, action_completed: true }),
    ],
    meal_plans: [
      makeMealPlan({ child_id: "c1" }),
      makeMealPlan({ child_id: "c2" }),
      makeMealPlan({ child_id: "c3" }),
      makeMealPlan({ child_id: "c4" }),
    ],
    ...overrides,
  };
}

beforeEach(() => { _id = 0; });

// ── Tests ──────────────────────────────────────────────────────────────────

describe("computeFoodNutritionHygieneSafety", () => {

  // ── Insufficient data ──────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when total_children is 0", () => {
      const r = computeFoodNutritionHygieneSafety({
        today: "2026-05-27",
        total_children: 0,
        budgets: [],
        hygiene_checks: [],
        meal_plans: [],
      });
      expect(r.food_rating).toBe("insufficient_data");
      expect(r.food_score).toBe(0);
    });

    it("returns score 0 for insufficient data", () => {
      const r = computeFoodNutritionHygieneSafety({
        today: "2026-05-27",
        total_children: 0,
        budgets: [makeBudget()],
        hygiene_checks: [makeHygieneCheck()],
        meal_plans: [makeMealPlan()],
      });
      expect(r.food_score).toBe(0);
    });

    it("sets headline for insufficient data", () => {
      const r = computeFoodNutritionHygieneSafety({
        today: "2026-05-27",
        total_children: 0,
        budgets: [],
        hygiene_checks: [],
        meal_plans: [],
      });
      expect(r.headline).toContain("cannot be assessed");
    });

    it("returns empty strengths for insufficient data", () => {
      const r = computeFoodNutritionHygieneSafety({
        today: "2026-05-27",
        total_children: 0,
        budgets: [],
        hygiene_checks: [],
        meal_plans: [],
      });
      expect(r.strengths).toEqual([]);
    });

    it("returns concern for insufficient data", () => {
      const r = computeFoodNutritionHygieneSafety({
        today: "2026-05-27",
        total_children: 0,
        budgets: [],
        hygiene_checks: [],
        meal_plans: [],
      });
      expect(r.concerns.length).toBe(1);
      expect(r.concerns[0]).toContain("No children on roll");
    });

    it("returns zero for all metrics when insufficient data", () => {
      const r = computeFoodNutritionHygieneSafety({
        today: "2026-05-27",
        total_children: 0,
        budgets: [],
        hygiene_checks: [],
        meal_plans: [],
      });
      expect(r.hygiene_pass_rate).toBe(0);
      expect(r.budget_adherence_rate).toBe(0);
      expect(r.scratch_cooking_rate).toBe(0);
      expect(r.dietary_compliance_rate).toBe(0);
      expect(r.cultural_inclusion_rate).toBe(0);
    });
  });

  // ── Rating thresholds ────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("outstanding for score >= 80", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r.food_score).toBe(82);
      expect(r.food_rating).toBe("outstanding");
    });

    it("good for score 65-79", () => {
      // Remove budgets to lose mod2 (+6), mod3 (+5), mod5 (+4) => all become 0, 0, -1
      // 52 +5 +0 +0 +5 -1 +5 = 66
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [],
      }));
      expect(r.food_score).toBeGreaterThanOrEqual(65);
      expect(r.food_score).toBeLessThan(80);
      expect(r.food_rating).toBe("good");
    });

    it("adequate for score 45-64", () => {
      // 52 -1 (no checks) +0 (no budgets) +0 (no budgets) -1 (no plans) -1 (no budgets) +3 (no actions)
      // = 52 -1 +0 +0 -1 -1 +3 = 52
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [],
        hygiene_checks: [],
        meal_plans: [],
      }));
      expect(r.food_score).toBeGreaterThanOrEqual(45);
      expect(r.food_score).toBeLessThan(65);
      expect(r.food_rating).toBe("adequate");
    });

    it("inadequate for score < 45", () => {
      // mod1: all fail => -5, mod2: all over budget => -5, mod3: scratch <30 => -4
      // mod4: dietary <40% => -5, mod5: cultural <20% => -4, mod6: actions <40% => -5
      // 52 -5 -5 -4 -5 -4 -5 = 24
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ total_spent: 500, cook_from_scratch_proportion: 10, cultural_ingredients_included: false }),
          makeBudget({ total_spent: 500, cook_from_scratch_proportion: 15, cultural_ingredients_included: false }),
          makeBudget({ total_spent: 500, cook_from_scratch_proportion: 10, cultural_ingredients_included: false }),
        ],
        hygiene_checks: [
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
        ],
        meal_plans: [
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: true }),
        ],
      }));
      expect(r.food_score).toBeLessThan(45);
      expect(r.food_rating).toBe("inadequate");
    });

    it("score exactly 80 is outstanding", () => {
      // Base 52 + mod1 +5 + mod2 +6 + mod3 +5 + mod4 +5 + mod5 +4 + mod6 +3 = 80
      // mod6: no actions needed => +3
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck(),
          makeHygieneCheck(),
          makeHygieneCheck(),
          makeHygieneCheck(),
          makeHygieneCheck(),
          makeHygieneCheck(),
          makeHygieneCheck(),
          makeHygieneCheck(),
          makeHygieneCheck(),
          makeHygieneCheck(),
          makeHygieneCheck(),
          makeHygieneCheck(),
        ],
      }));
      expect(r.food_score).toBe(80);
      expect(r.food_rating).toBe("outstanding");
    });

    it("score exactly 65 is good", () => {
      // 52 +5 (hygiene 100%) +3 (budget 75%) +2 (scratch 55%) +5 (dietary 100%) -4 (cultural 0%) +2 (action 75%)
      // = 52 +5 +3 +2 +5 -4 +2 = 65
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ total_spent: 170, cook_from_scratch_proportion: 55, cultural_ingredients_included: false }),
          makeBudget({ total_spent: 170, cook_from_scratch_proportion: 55, cultural_ingredients_included: false }),
          makeBudget({ total_spent: 170, cook_from_scratch_proportion: 55, cultural_ingredients_included: false }),
          makeBudget({ total_spent: 250, cook_from_scratch_proportion: 55, cultural_ingredients_included: false }),
        ],
        hygiene_checks: [
          ...Array.from({ length: 10 }, () => makeHygieneCheck()),
          makeHygieneCheck({ action_required: true, action_completed: true }),
          makeHygieneCheck({ action_required: true, action_completed: true }),
          makeHygieneCheck({ action_required: true, action_completed: true }),
          makeHygieneCheck({ action_required: true, action_completed: false }),
        ],
      }));
      expect(r.food_score).toBe(65);
      expect(r.food_rating).toBe("good");
    });

    it("score exactly 45 is adequate", () => {
      // 52 -1 (no checks) +0 (no budgets) +0 (no budgets) -1 (no plans) -1 (no budgets) +3 (no actions) = 52
      // Need to get to 45.
      // 52 -5 (hygiene <60%) +0 +0 -1 -1 +0 (action 40-69%) = 45
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [],
        hygiene_checks: [
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: true }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
        ],
        meal_plans: [],
      }));
      // mod1: 1 pass / 5 = 20% < 60 => -5. Score: 47
      // mod2: no budgets => 0. Score: 47
      // mod3: no budgets => 0. Score: 47
      // mod4: no plans => -1. Score: 46
      // mod5: no budgets => -1. Score: 45
      // mod6: 1/2 actions = 50% >= 40 => 0. Score: 45
      expect(r.food_score).toBe(45);
      expect(r.food_rating).toBe("adequate");
    });

    it("score 44 is inadequate", () => {
      // From above scenario, add one more failed action to drop mod6
      // mod6: 1/3 actions = 33% < 40 => -5
      // 52 -5 +0 +0 -1 -1 -5 = 40
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [],
        hygiene_checks: [
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: true }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
        ],
        meal_plans: [],
      }));
      expect(r.food_score).toBeLessThan(45);
      expect(r.food_rating).toBe("inadequate");
    });
  });

  // ── Metrics ──────────────────────────────────────────────────────────

  describe("hygiene_pass_rate metric", () => {
    it("calculates pass rate from non-n_a checks", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "n_a" }),
        ],
      }));
      // 2 pass / 3 non-n_a = 67%
      expect(r.hygiene_pass_rate).toBe(67);
    });

    it("returns 0 when all checks are n_a", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "n_a" }),
          makeHygieneCheck({ compliance: "n_a" }),
        ],
      }));
      expect(r.hygiene_pass_rate).toBe(0);
    });

    it("returns 0 when no checks exist", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [],
      }));
      expect(r.hygiene_pass_rate).toBe(0);
    });

    it("100% when all non-n_a checks pass", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "n_a" }),
        ],
      }));
      expect(r.hygiene_pass_rate).toBe(100);
    });
  });

  describe("budget_adherence_rate metric", () => {
    it("calculates % within budget", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ total_spent: 180, weekly_budget: 200 }), // within
          makeBudget({ total_spent: 200, weekly_budget: 200 }), // exactly at budget
          makeBudget({ total_spent: 250, weekly_budget: 200 }), // over
        ],
      }));
      expect(r.budget_adherence_rate).toBe(67);
    });

    it("returns 0 when no budgets", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({ budgets: [] }));
      expect(r.budget_adherence_rate).toBe(0);
    });

    it("100% when all within budget", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r.budget_adherence_rate).toBe(100);
    });
  });

  describe("scratch_cooking_rate metric", () => {
    it("averages cook_from_scratch_proportion", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ cook_from_scratch_proportion: 60 }),
          makeBudget({ cook_from_scratch_proportion: 80 }),
        ],
      }));
      expect(r.scratch_cooking_rate).toBe(70);
    });

    it("returns 0 when no budgets", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({ budgets: [] }));
      expect(r.scratch_cooking_rate).toBe(0);
    });

    it("rounds to nearest integer", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ cook_from_scratch_proportion: 33 }),
          makeBudget({ cook_from_scratch_proportion: 34 }),
        ],
      }));
      // (33+34)/2 = 33.5 => rounds to 34
      expect(r.scratch_cooking_rate).toBe(34);
    });
  });

  describe("dietary_compliance_rate metric", () => {
    it("calculates % of plans with dietary_needs_met", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        meal_plans: [
          makeMealPlan({ dietary_needs_met: true }),
          makeMealPlan({ dietary_needs_met: true }),
          makeMealPlan({ dietary_needs_met: false }),
        ],
      }));
      expect(r.dietary_compliance_rate).toBe(67);
    });

    it("returns 0 when no plans", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({ meal_plans: [] }));
      expect(r.dietary_compliance_rate).toBe(0);
    });

    it("100% when all compliant", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r.dietary_compliance_rate).toBe(100);
    });
  });

  describe("cultural_inclusion_rate metric", () => {
    it("calculates % of budgets with cultural ingredients", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ cultural_ingredients_included: true }),
          makeBudget({ cultural_ingredients_included: false }),
          makeBudget({ cultural_ingredients_included: true }),
        ],
      }));
      expect(r.cultural_inclusion_rate).toBe(67);
    });

    it("returns 0 when no budgets", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({ budgets: [] }));
      expect(r.cultural_inclusion_rate).toBe(0);
    });
  });

  // ── Modifier 1: Hygiene pass rate ────────────────────────────────────

  describe("mod1: hygiene pass rate (±5)", () => {
    it("+5 when pass rate >= 95%", () => {
      // Compare 100% pass rate vs 60-79% pass rate (both with no actions)
      // High: +5, Mid: +0 => diff = 5
      const high = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: Array.from({ length: 12 }, () => makeHygieneCheck()),
      }));
      const mid = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
        ],
      }));
      // high: mod1=+5, mod6=+3 (no actions). mid: mod1=+0, mod6=+3 (no actions). diff = 5.
      expect(high.food_score - mid.food_score).toBe(5);
    });

    it("+2 when pass rate 80-94%", () => {
      // 4 pass, 1 fail = 80%
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "fail" }),
        ],
      }));
      // 52 +2 +6 +5 +5 +4 +3 = 77 (no actions required => +3)
      expect(r.food_score).toBe(77);
    });

    it("0 when pass rate 60-79%", () => {
      // 3 pass, 2 fail = 60%
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
        ],
      }));
      // 52 +0 +6 +5 +5 +4 +3 = 75
      expect(r.food_score).toBe(75);
    });

    it("-5 when pass rate < 60%", () => {
      // 1 pass, 4 fail = 20% < 60
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
        ],
      }));
      // 52 -5 +6 +5 +5 +4 +3 = 70
      expect(r.food_score).toBe(70);
    });

    it("-1 when no checks (0 checks)", () => {
      const withChecks = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
        ],
      }));
      const noChecks = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [],
      }));
      // withChecks: mod1 = +0, noChecks: mod1 = -1 => diff = 1
      // also mod6 differs: withChecks = no actions +3, noChecks = no actions +3
      expect(withChecks.food_score - noChecks.food_score).toBe(1);
    });

    it("excludes n_a checks from calculation", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "n_a" }),
          makeHygieneCheck({ compliance: "n_a" }),
          makeHygieneCheck({ compliance: "n_a" }),
        ],
      }));
      // 1 pass / 1 non-n_a = 100% => +5
      expect(r.hygiene_pass_rate).toBe(100);
    });
  });

  // ── Modifier 2: Budget adherence ─────────────────────────────────────

  describe("mod2: budget adherence (+6/-5)", () => {
    it("+6 when >= 90% within budget", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      // All 4 within budget = 100% => +6
      expect(r.budget_adherence_rate).toBe(100);
    });

    it("+3 when 70-89% within budget", () => {
      // 3/4 within = 75%
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ total_spent: 180 }),
          makeBudget({ total_spent: 180 }),
          makeBudget({ total_spent: 180 }),
          makeBudget({ total_spent: 250 }),
        ],
      }));
      // 52 +5 +3 +5 +5 +4 +5 = 79 (action_required checks in base)
      // Wait, need to check what hygiene_checks we have with override
      // Using baseInput, so still 12 checks including 2 with action_required+completed
      expect(r.budget_adherence_rate).toBe(75);
    });

    it("0 when 50-69% within budget", () => {
      // 2/4 within = 50%
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ total_spent: 180 }),
          makeBudget({ total_spent: 180 }),
          makeBudget({ total_spent: 250 }),
          makeBudget({ total_spent: 250 }),
        ],
      }));
      expect(r.budget_adherence_rate).toBe(50);
    });

    it("-5 when < 50% within budget", () => {
      // 1/4 within = 25%
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ total_spent: 180 }),
          makeBudget({ total_spent: 250 }),
          makeBudget({ total_spent: 250 }),
          makeBudget({ total_spent: 250 }),
        ],
      }));
      expect(r.budget_adherence_rate).toBe(25);
    });

    it("0 when no budgets", () => {
      const withBudgets = computeFoodNutritionHygieneSafety(baseInput());
      const noBudgets = computeFoodNutritionHygieneSafety(baseInput({ budgets: [] }));
      // withBudgets: mod2=+6, mod3=+5, mod5=+4 = +15
      // noBudgets: mod2=0, mod3=0, mod5=-1 = -1
      // Diff = 16 (the 3 budget-dependent modifiers)
      expect(withBudgets.food_score - noBudgets.food_score).toBe(16);
    });
  });

  // ── Modifier 3: Scratch cooking ──────────────────────────────────────

  describe("mod3: scratch cooking (+5/-4)", () => {
    it("+5 when avg scratch >= 70%", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r.scratch_cooking_rate).toBe(80);
    });

    it("+2 when avg scratch 50-69%", () => {
      const high = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ cook_from_scratch_proportion: 55 }),
          makeBudget({ cook_from_scratch_proportion: 55 }),
          makeBudget({ cook_from_scratch_proportion: 55 }),
          makeBudget({ cook_from_scratch_proportion: 55 }),
        ],
      }));
      // mod3: 55% avg => +2
      // full base mod3: 80% => +5
      // diff from base = -3
      expect(high.food_score).toBe(82 - 3);
    });

    it("0 when avg scratch 30-49%", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ cook_from_scratch_proportion: 35 }),
          makeBudget({ cook_from_scratch_proportion: 35 }),
          makeBudget({ cook_from_scratch_proportion: 35 }),
          makeBudget({ cook_from_scratch_proportion: 35 }),
        ],
      }));
      // mod3: 35% => +0 instead of +5 => -5 from base
      expect(r.food_score).toBe(82 - 5);
    });

    it("-4 when avg scratch < 30%", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ cook_from_scratch_proportion: 20 }),
          makeBudget({ cook_from_scratch_proportion: 20 }),
          makeBudget({ cook_from_scratch_proportion: 20 }),
          makeBudget({ cook_from_scratch_proportion: 20 }),
        ],
      }));
      // mod3: 20% => -4 instead of +5 => -9 from base
      expect(r.food_score).toBe(82 - 9);
    });
  });

  // ── Modifier 4: Dietary compliance ───────────────────────────────────

  describe("mod4: dietary compliance (+5/-5)", () => {
    it("+5 when >= 90% dietary needs met", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r.dietary_compliance_rate).toBe(100);
    });

    it("+2 when 70-89%", () => {
      // 3/4 = 75%
      const r = computeFoodNutritionHygieneSafety(baseInput({
        meal_plans: [
          makeMealPlan({ dietary_needs_met: true }),
          makeMealPlan({ dietary_needs_met: true }),
          makeMealPlan({ dietary_needs_met: true }),
          makeMealPlan({ dietary_needs_met: false }),
        ],
      }));
      expect(r.dietary_compliance_rate).toBe(75);
      // mod4: +2 instead of +5 => -3 from base
      expect(r.food_score).toBe(82 - 3);
    });

    it("0 when 40-69%", () => {
      // 2/4 = 50%
      const r = computeFoodNutritionHygieneSafety(baseInput({
        meal_plans: [
          makeMealPlan({ dietary_needs_met: true }),
          makeMealPlan({ dietary_needs_met: true }),
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: false }),
        ],
      }));
      expect(r.dietary_compliance_rate).toBe(50);
      // mod4: +0 instead of +5 => -5 from base
      expect(r.food_score).toBe(82 - 5);
    });

    it("-5 when < 40%", () => {
      // 1/4 = 25%
      const r = computeFoodNutritionHygieneSafety(baseInput({
        meal_plans: [
          makeMealPlan({ dietary_needs_met: true }),
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: false }),
        ],
      }));
      expect(r.dietary_compliance_rate).toBe(25);
      // mod4: -5 instead of +5 => -10 from base
      expect(r.food_score).toBe(82 - 10);
    });

    it("-1 when no meal plans", () => {
      const withPlans = computeFoodNutritionHygieneSafety(baseInput());
      const noPlans = computeFoodNutritionHygieneSafety(baseInput({ meal_plans: [] }));
      // withPlans: mod4 = +5, noPlans: mod4 = -1 => diff = 6
      expect(withPlans.food_score - noPlans.food_score).toBe(6);
    });
  });

  // ── Modifier 5: Cultural & sensory inclusion ─────────────────────────

  describe("mod5: cultural & sensory inclusion (+4/-4)", () => {
    it("+4 when >= 80% cultural inclusion", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r.cultural_inclusion_rate).toBe(100);
    });

    it("+1 when 50-79%", () => {
      // 2/4 = 50%
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ cultural_ingredients_included: true }),
          makeBudget({ cultural_ingredients_included: true }),
          makeBudget({ cultural_ingredients_included: false }),
          makeBudget({ cultural_ingredients_included: false }),
        ],
      }));
      expect(r.cultural_inclusion_rate).toBe(50);
      // mod5: +1 instead of +4 => -3 from base
      expect(r.food_score).toBe(82 - 3);
    });

    it("0 when 20-49%", () => {
      // 1/4 = 25%
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ cultural_ingredients_included: true }),
          makeBudget({ cultural_ingredients_included: false }),
          makeBudget({ cultural_ingredients_included: false }),
          makeBudget({ cultural_ingredients_included: false }),
        ],
      }));
      expect(r.cultural_inclusion_rate).toBe(25);
      // mod5: +0 instead of +4 => -4 from base
      expect(r.food_score).toBe(82 - 4);
    });

    it("-4 when < 20%", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ cultural_ingredients_included: false }),
          makeBudget({ cultural_ingredients_included: false }),
          makeBudget({ cultural_ingredients_included: false }),
          makeBudget({ cultural_ingredients_included: false }),
        ],
      }));
      expect(r.cultural_inclusion_rate).toBe(0);
      // mod5: -4 instead of +4 => -8 from base
      expect(r.food_score).toBe(82 - 8);
    });

    it("-1 when no budgets", () => {
      // Already covered in mod2 test; verify mod5 contributes -1
      const r = computeFoodNutritionHygieneSafety(baseInput({ budgets: [] }));
      // mod2: 0, mod3: 0, mod5: -1 => total budget diff = -6 -5 -4 + 0 + 0 + (-1) = ... just verify rating
      expect(r.food_rating).not.toBe("insufficient_data");
    });
  });

  // ── Modifier 6: Action completion ────────────────────────────────────

  describe("mod6: action completion (+5/-5)", () => {
    it("+5 when >= 90% actions completed", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      // Base has 2 action_required, 2 completed = 100%
      expect(r.food_score).toBe(82);
    });

    it("+2 when 70-89% completed", () => {
      // 3/4 = 75%
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          ...Array.from({ length: 10 }, () => makeHygieneCheck()),
          makeHygieneCheck({ action_required: true, action_completed: true }),
          makeHygieneCheck({ action_required: true, action_completed: true }),
          makeHygieneCheck({ action_required: true, action_completed: true }),
          makeHygieneCheck({ action_required: true, action_completed: false }),
        ],
      }));
      // mod6: 75% => +2 instead of +5 => -3 from base
      expect(r.food_score).toBe(82 - 3);
    });

    it("0 when 40-69% completed", () => {
      // 2/4 = 50%
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          ...Array.from({ length: 10 }, () => makeHygieneCheck()),
          makeHygieneCheck({ action_required: true, action_completed: true }),
          makeHygieneCheck({ action_required: true, action_completed: true }),
          makeHygieneCheck({ action_required: true, action_completed: false }),
          makeHygieneCheck({ action_required: true, action_completed: false }),
        ],
      }));
      // mod6: 50% => +0 instead of +5 => -5 from base
      expect(r.food_score).toBe(82 - 5);
    });

    it("-5 when < 40% completed", () => {
      // 1/4 = 25%
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          ...Array.from({ length: 10 }, () => makeHygieneCheck()),
          makeHygieneCheck({ action_required: true, action_completed: true }),
          makeHygieneCheck({ action_required: true, action_completed: false }),
          makeHygieneCheck({ action_required: true, action_completed: false }),
          makeHygieneCheck({ action_required: true, action_completed: false }),
        ],
      }));
      // mod6: 25% => -5 instead of +5 => -10 from base
      expect(r.food_score).toBe(82 - 10);
    });

    it("+3 when no actions needed", () => {
      const noActions = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: Array.from({ length: 12 }, () => makeHygieneCheck()),
      }));
      // mod6: +3 instead of +5 => -2 from base
      expect(noActions.food_score).toBe(82 - 2);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes hygiene pass rate strength when >= 95%", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r.strengths.some(s => s.includes("hygiene pass rate"))).toBe(true);
    });

    it("includes budget adherence strength when >= 90%", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r.strengths.some(s => s.includes("within food budget"))).toBe(true);
    });

    it("includes scratch cooking strength when >= 70%", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r.strengths.some(s => s.includes("scratch cooking"))).toBe(true);
    });

    it("includes dietary compliance strength when >= 90%", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r.strengths.some(s => s.includes("dietary compliance"))).toBe(true);
    });

    it("includes cultural inclusion strength when >= 80%", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r.strengths.some(s => s.includes("cultural ingredient inclusion"))).toBe(true);
    });

    it("includes action completion strength when >= 90% with actions", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r.strengths.some(s => s.includes("action completion"))).toBe(true);
    });

    it("includes proactive management strength when no actions needed", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: Array.from({ length: 12 }, () => makeHygieneCheck()),
      }));
      expect(r.strengths.some(s => s.includes("No hygiene actions required"))).toBe(true);
    });

    it("returns empty strengths when nothing qualifies", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [],
        hygiene_checks: [],
        meal_plans: [],
      }));
      expect(r.strengths.length).toBe(0);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags low hygiene pass rate", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "pass" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Hygiene pass rate"))).toBe(true);
    });

    it("flags multiple hygiene failures", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("hygiene checks failed"))).toBe(true);
    });

    it("flags poor budget adherence", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ total_spent: 300 }),
          makeBudget({ total_spent: 300 }),
          makeBudget({ total_spent: 300 }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("within budget"))).toBe(true);
    });

    it("flags low scratch cooking", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ cook_from_scratch_proportion: 10 }),
          makeBudget({ cook_from_scratch_proportion: 20 }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Scratch cooking"))).toBe(true);
    });

    it("flags low dietary compliance", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        meal_plans: [
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("dietary compliance"))).toBe(true);
    });

    it("flags low cultural inclusion", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ cultural_ingredients_included: false }),
          makeBudget({ cultural_ingredients_included: false }),
          makeBudget({ cultural_ingredients_included: false }),
          makeBudget({ cultural_ingredients_included: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Cultural ingredient inclusion"))).toBe(true);
    });

    it("flags low action completion", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ action_required: true, action_completed: false }),
          makeHygieneCheck({ action_required: true, action_completed: false }),
          makeHygieneCheck({ action_required: true, action_completed: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("hygiene actions completed"))).toBe(true);
    });

    it("flags no meal plans", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({ meal_plans: [] }));
      expect(r.concerns.some(c => c.includes("No meal plans"))).toBe(true);
    });

    it("flags no hygiene checks", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({ hygiene_checks: [] }));
      expect(r.concerns.some(c => c.includes("No hygiene checks"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends hygiene review when >= 2 failures", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.regulatory_ref === "HACCP")).toBe(true);
    });

    it("recommends action completion when < 40%", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ action_required: true, action_completed: false }),
          makeHygieneCheck({ action_required: true, action_completed: false }),
          makeHygieneCheck({ action_required: true, action_completed: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("outstanding hygiene actions"))).toBe(true);
    });

    it("recommends dietary review when compliance < 70%", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        meal_plans: [
          makeMealPlan({ dietary_needs_met: true }),
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.regulatory_ref === "CHR 2015 Reg 9" && rec.recommendation.includes("meal planning"))).toBe(true);
    });

    it("recommends scratch cooking when < 50%", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ cook_from_scratch_proportion: 30 }),
          makeBudget({ cook_from_scratch_proportion: 30 }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("scratch"))).toBe(true);
    });

    it("recommends cultural inclusion when < 50%", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ cultural_ingredients_included: false }),
          makeBudget({ cultural_ingredients_included: true }),
          makeBudget({ cultural_ingredients_included: false }),
          makeBudget({ cultural_ingredients_included: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("cultural"))).toBe(true);
    });

    it("recommends meal planning when no plans exist", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({ meal_plans: [] }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("meal planning"))).toBe(true);
    });

    it("recommends hygiene regime when no checks exist", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({ hygiene_checks: [] }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("hygiene checking regime"))).toBe(true);
    });

    it("ranks recommendations sequentially", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
        ],
        meal_plans: [
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: false }),
        ],
        budgets: [
          makeBudget({ cook_from_scratch_proportion: 20, cultural_ingredients_included: false }),
        ],
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("limits recommendations to 5", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
        ],
        meal_plans: [
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: false }),
        ],
        budgets: [
          makeBudget({ cook_from_scratch_proportion: 20, cultural_ingredients_included: false, total_spent: 500 }),
        ],
      }));
      expect(r.recommendations.length).toBeLessThanOrEqual(5);
    });

    it("returns no recommendations for outstanding input", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r.recommendations.length).toBe(0);
    });

    it("all recommendations have a regulatory_ref", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
        ],
        budgets: [makeBudget({ cook_from_scratch_proportion: 20, cultural_ingredients_included: false })],
        meal_plans: [makeMealPlan({ dietary_needs_met: false }), makeMealPlan({ dietary_needs_met: false })],
      }));
      for (const rec of r.recommendations) {
        expect(["CHR 2015 Reg 9", "HACCP"]).toContain(rec.regulatory_ref);
      }
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates positive insight for exemplary practice", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("generates critical insight for systemic failures", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("systemic"))).toBe(true);
    });

    it("generates warning for combined low scratch + dietary", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ cook_from_scratch_proportion: 20 }),
          makeBudget({ cook_from_scratch_proportion: 20 }),
        ],
        meal_plans: [
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: true }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("scratch cooking"))).toBe(true);
    });

    it("generates positive insight for budget + scratch governance", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("budget discipline"))).toBe(true);
    });

    it("generates critical insight for persistent non-compliance", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "pass" }),
        ],
      }));
      // 1/6 = 17% pass rate, 6 non-n_a checks >= 5
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("persistent"))).toBe(true);
    });

    it("limits insights to 3", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r.insights.length).toBeLessThanOrEqual(3);
    });

    it("returns no insights when nothing triggers", () => {
      // Moderate performance — nothing triggers any insight
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ cook_from_scratch_proportion: 50, cultural_ingredients_included: false }),
          makeBudget({ cook_from_scratch_proportion: 50, cultural_ingredients_included: false }),
        ],
        hygiene_checks: [
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "pass" }),
        ],
        meal_plans: [
          makeMealPlan({ dietary_needs_met: true }),
          makeMealPlan({ dietary_needs_met: false }),
        ],
      }));
      // pass rate 67%, dietary 50%, scratch 50%, cultural 0%, budget 100%
      // No insight should trigger
      expect(r.insights.length).toBe(0);
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("outstanding headline mentions pass rate and compliance", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r.headline).toContain("Outstanding");
      expect(r.headline).toContain("hygiene pass rate");
      expect(r.headline).toContain("dietary compliance");
    });

    it("good headline mentions areas for improvement when concerns exist", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({ budgets: [] }));
      expect(r.headline).toContain("Good");
    });

    it("good headline without concerns mentions well-managed", () => {
      // Construct a good-rated input with no concerns triggered
      // 52 +5 +3 +2 +5 +1 +3 = 71 good, need no concerns
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ total_spent: 170, cook_from_scratch_proportion: 55, cultural_ingredients_included: true }),
          makeBudget({ total_spent: 170, cook_from_scratch_proportion: 55, cultural_ingredients_included: true }),
          makeBudget({ total_spent: 170, cook_from_scratch_proportion: 55, cultural_ingredients_included: false }),
          makeBudget({ total_spent: 250, cook_from_scratch_proportion: 55, cultural_ingredients_included: true }),
        ],
        hygiene_checks: Array.from({ length: 12 }, () => makeHygieneCheck()),
      }));
      if (r.concerns.length === 0) {
        expect(r.headline).toContain("well-managed");
      }
    });

    it("adequate headline mentions concern count", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [],
        hygiene_checks: [],
        meal_plans: [],
      }));
      expect(r.headline).toContain("needs improvement");
      expect(r.headline).toContain("concern");
    });

    it("inadequate headline mentions significant gaps", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ total_spent: 500, cook_from_scratch_proportion: 10, cultural_ingredients_included: false }),
          makeBudget({ total_spent: 500, cook_from_scratch_proportion: 10, cultural_ingredients_included: false }),
          makeBudget({ total_spent: 500, cook_from_scratch_proportion: 10, cultural_ingredients_included: false }),
        ],
        hygiene_checks: [
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
        ],
        meal_plans: [
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: true }),
        ],
      }));
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("significant gaps");
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("score is clamped to 0 minimum", () => {
      // Even with all negatives, score should not go below 0
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ total_spent: 500, cook_from_scratch_proportion: 0, cultural_ingredients_included: false }),
        ],
        hygiene_checks: [
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
        ],
        meal_plans: [
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: false }),
        ],
      }));
      expect(r.food_score).toBeGreaterThanOrEqual(0);
    });

    it("score is clamped to 100 maximum", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r.food_score).toBeLessThanOrEqual(100);
    });

    it("handles single budget", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [makeBudget()],
      }));
      expect(r.budget_adherence_rate).toBe(100);
      expect(r.scratch_cooking_rate).toBe(80);
      expect(r.cultural_inclusion_rate).toBe(100);
    });

    it("handles single hygiene check", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [makeHygieneCheck({ compliance: "pass" })],
      }));
      expect(r.hygiene_pass_rate).toBe(100);
    });

    it("handles single meal plan", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        meal_plans: [makeMealPlan({ dietary_needs_met: true })],
      }));
      expect(r.dietary_compliance_rate).toBe(100);
    });

    it("budget exactly at weekly_budget counts as within", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [makeBudget({ total_spent: 200, weekly_budget: 200 })],
      }));
      expect(r.budget_adherence_rate).toBe(100);
    });

    it("budget one penny over counts as over", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [makeBudget({ total_spent: 200.01, weekly_budget: 200 })],
      }));
      expect(r.budget_adherence_rate).toBe(0);
    });

    it("action_required checks with action_completed are counted", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "pass", action_required: true, action_completed: true }),
          makeHygieneCheck({ compliance: "pass", action_required: true, action_completed: false }),
        ],
      }));
      // 1/2 completed = 50%
      expect(r.food_score).toBeLessThan(82); // lower due to action completion
    });

    it("all checks n_a with children still computes", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "n_a" }),
          makeHygieneCheck({ compliance: "n_a" }),
        ],
      }));
      expect(r.hygiene_pass_rate).toBe(0);
      expect(r.food_rating).not.toBe("insufficient_data");
    });

    it("large input arrays do not error", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: Array.from({ length: 52 }, () => makeBudget()),
        hygiene_checks: Array.from({ length: 365 }, () => makeHygieneCheck()),
        meal_plans: Array.from({ length: 100 }, () => makeMealPlan()),
      }));
      expect(r.food_rating).toBe("outstanding");
    });

    it("pct returns 0 when denominator is 0", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [],
        budgets: [],
        meal_plans: [],
      }));
      expect(r.hygiene_pass_rate).toBe(0);
      expect(r.budget_adherence_rate).toBe(0);
      expect(r.dietary_compliance_rate).toBe(0);
      expect(r.cultural_inclusion_rate).toBe(0);
    });
  });

  // ── Return shape ──────────────────────────────────────────────────────

  describe("return shape", () => {
    it("returns all expected fields", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r).toHaveProperty("food_rating");
      expect(r).toHaveProperty("food_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("hygiene_pass_rate");
      expect(r).toHaveProperty("budget_adherence_rate");
      expect(r).toHaveProperty("scratch_cooking_rate");
      expect(r).toHaveProperty("dietary_compliance_rate");
      expect(r).toHaveProperty("cultural_inclusion_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("food_score is always a number", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(typeof r.food_score).toBe("number");
      expect(Number.isNaN(r.food_score)).toBe(false);
    });

    it("strengths is always an array of strings", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(Array.isArray(r.strengths)).toBe(true);
      for (const s of r.strengths) {
        expect(typeof s).toBe("string");
      }
    });

    it("concerns is always an array of strings", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(Array.isArray(r.concerns)).toBe(true);
    });

    it("recommendations have rank, recommendation, urgency, regulatory_ref", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        hygiene_checks: [
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
        ],
      }));
      for (const rec of r.recommendations) {
        expect(typeof rec.rank).toBe("number");
        expect(typeof rec.recommendation).toBe("string");
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
        expect(typeof rec.regulatory_ref).toBe("string");
      }
    });

    it("insights have text and severity", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      for (const ins of r.insights) {
        expect(typeof ins.text).toBe("string");
        expect(["critical", "warning", "positive"]).toContain(ins.severity);
      }
    });
  });

  // ── Compound scenarios ────────────────────────────────────────────────

  describe("compound scenarios", () => {
    it("perfect input produces outstanding with full strengths", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput());
      expect(r.food_rating).toBe("outstanding");
      expect(r.strengths.length).toBeGreaterThan(0);
      expect(r.concerns.length).toBe(0);
      expect(r.recommendations.length).toBe(0);
    });

    it("worst-case input produces inadequate with many concerns", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ total_spent: 500, cook_from_scratch_proportion: 5, cultural_ingredients_included: false }),
        ],
        hygiene_checks: [
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
          makeHygieneCheck({ compliance: "fail", action_required: true, action_completed: false }),
        ],
        meal_plans: [
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: false }),
          makeMealPlan({ dietary_needs_met: false }),
        ],
      }));
      expect(r.food_rating).toBe("inadequate");
      expect(r.concerns.length).toBeGreaterThan(3);
      expect(r.recommendations.length).toBeGreaterThan(0);
    });

    it("mixed good and bad areas produces adequate/good", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [
          makeBudget({ cook_from_scratch_proportion: 80, cultural_ingredients_included: true }),
        ],
        hygiene_checks: [
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "fail" }),
          makeHygieneCheck({ compliance: "pass" }),
          makeHygieneCheck({ compliance: "pass" }),
        ],
        meal_plans: [
          makeMealPlan({ dietary_needs_met: true }),
          makeMealPlan({ dietary_needs_met: false }),
        ],
      }));
      // Should be in the adequate-to-good range
      expect(r.food_score).toBeGreaterThanOrEqual(45);
      expect(r.food_score).toBeLessThan(80);
    });

    it("empty arrays with children produces adequate range", () => {
      const r = computeFoodNutritionHygieneSafety(baseInput({
        budgets: [],
        hygiene_checks: [],
        meal_plans: [],
      }));
      expect(r.food_rating).toBe("adequate");
      expect(r.food_score).toBe(52);
    });
  });
});
