import { describe, it, expect } from "vitest";
import {
  computeHomeNutritionCatering,
  type HomeNutritionCateringInput,
  type MealPlanInput,
  type DietaryPlanInput,
  type FoodHygieneRecordInput,
  type KitchenHygieneCheckInput,
  type EatingSupportPlanInput,
  type FoodBudgetWeekInput,
} from "../home-nutrition-catering-intelligence-engine";

// ── Helpers ────────────────────────────────────────────────────────────────

let _id = 0;
const uid = () => `nc-${++_id}`;

function makeMealPlan(overrides: Partial<MealPlanInput> = {}): MealPlanInput {
  return {
    id: uid(),
    date: "2026-05-15",
    meal: "lunch",
    dietary_flags_count: 3,
    child_preferences_count: 4,
    budget: 45,
    ...overrides,
  };
}

function makeDietaryPlan(overrides: Partial<DietaryPlanInput> = {}): DietaryPlanInput {
  return {
    id: uid(),
    child_id: "c1",
    allergies_count: 2,
    medical_dietary_needs_count: 1,
    sensory_food_needs_count: 1,
    reviewed_date: "2026-04-01",
    next_review_date: "2026-07-01",
    reviewed_with_child: true,
    child_agreed: true,
    signed_off_by_dietitian: true,
    ...overrides,
  };
}

function makeFoodHygiene(overrides: Partial<FoodHygieneRecordInput> = {}): FoodHygieneRecordInput {
  return {
    id: uid(),
    date: "2026-05-20",
    check_type: "fridge_temp",
    compliance: "pass",
    action_required: false,
    action_completed: false,
    ...overrides,
  };
}

function makeKitchenCheck(overrides: Partial<KitchenHygieneCheckInput> = {}): KitchenHygieneCheckInput {
  return {
    id: uid(),
    date: "2026-05-20",
    fridge_within_range: true,
    freezer_within_range: true,
    surfaces_cleaned: true,
    handwashing_observed: true,
    cutting_board_segregation: true,
    allergen_labelling: true,
    overall_verdict: "pass",
    immediate_actions_count: 0,
    follow_up_actions_count: 0,
    expired_items_found_count: 0,
    ...overrides,
  };
}

function makeEatingSupportPlan(overrides: Partial<EatingSupportPlanInput> = {}): EatingSupportPlanInput {
  return {
    id: uid(),
    child_id: "c1",
    plan_date: "2026-04-01",
    review_date: "2026-07-01",
    child_chose: true,
    flags_for_review_count: 0,
    safe_foods_count: 8,
    staff_strategies_count: 5,
    ...overrides,
  };
}

function makeFoodBudget(overrides: Partial<FoodBudgetWeekInput> = {}): FoodBudgetWeekInput {
  return {
    id: uid(),
    week_starting: "2026-05-12",
    weekly_budget: 200,
    total_spent: 185,
    variance: 15,
    cultural_ingredients_included: true,
    sensory_friendly_options_included: true,
    cook_from_scratch_proportion: 70,
    child_meal_requests_honoured_count: 4,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeNutritionCateringInput> = {}): HomeNutritionCateringInput {
  return {
    today: "2026-05-27",
    meal_plans: Array.from({ length: 20 }, (_, i) =>
      makeMealPlan({ date: `2026-05-${String(Math.max(1, 27 - i)).padStart(2, "0")}` }),
    ),
    dietary_plans: [
      makeDietaryPlan({ child_id: "c1" }),
      makeDietaryPlan({ child_id: "c2" }),
      makeDietaryPlan({ child_id: "c3" }),
    ],
    food_hygiene_records: [
      makeFoodHygiene({ check_type: "fridge_temp" }),
      makeFoodHygiene({ check_type: "allergen_check" }),
      makeFoodHygiene({ check_type: "cleaning_record" }),
      makeFoodHygiene({ check_type: "date_label_check" }),
    ],
    kitchen_hygiene_checks: [
      makeKitchenCheck(),
      makeKitchenCheck(),
    ],
    eating_support_plans: [makeEatingSupportPlan()],
    food_budgets: [
      makeFoodBudget({ week_starting: "2026-05-12" }),
      makeFoodBudget({ week_starting: "2026-05-05" }),
      makeFoodBudget({ week_starting: "2026-04-28" }),
      makeFoodBudget({ week_starting: "2026-04-21" }),
    ],
    total_children: 3,
    ...overrides,
  };
}

beforeEach(() => { _id = 0; });

// ── Tests ──────────────────────────────────────────────────────────────────

describe("computeHomeNutritionCatering", () => {

  // ── Insufficient data ──────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when total_children 0 and no records", () => {
      const r = computeHomeNutritionCatering({
        today: "2026-05-27",
        meal_plans: [], dietary_plans: [], food_hygiene_records: [],
        kitchen_hygiene_checks: [], eating_support_plans: [], food_budgets: [],
        total_children: 0,
      });
      expect(r.nutrition_rating).toBe("insufficient_data");
      expect(r.nutrition_score).toBe(0);
    });

    it("NOT insufficient_data when total_children > 0", () => {
      const r = computeHomeNutritionCatering({
        today: "2026-05-27",
        meal_plans: [], dietary_plans: [], food_hygiene_records: [],
        kitchen_hygiene_checks: [], eating_support_plans: [], food_budgets: [],
        total_children: 3,
      });
      expect(r.nutrition_rating).not.toBe("insufficient_data");
    });

    it("NOT insufficient_data when meal_plans exist but total_children 0", () => {
      const r = computeHomeNutritionCatering({
        today: "2026-05-27",
        meal_plans: [makeMealPlan()], dietary_plans: [], food_hygiene_records: [],
        kitchen_hygiene_checks: [], eating_support_plans: [], food_budgets: [],
        total_children: 0,
      });
      expect(r.nutrition_rating).not.toBe("insufficient_data");
    });

    it("NOT insufficient_data when food_hygiene_records exist", () => {
      const r = computeHomeNutritionCatering({
        today: "2026-05-27",
        meal_plans: [], dietary_plans: [], food_hygiene_records: [makeFoodHygiene()],
        kitchen_hygiene_checks: [], eating_support_plans: [], food_budgets: [],
        total_children: 0,
      });
      expect(r.nutrition_rating).not.toBe("insufficient_data");
    });
  });

  // ── Rating thresholds ────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("outstanding for excellent nutrition practice (score >= 80)", () => {
      const r = computeHomeNutritionCatering(baseInput());
      expect(r.nutrition_score).toBeGreaterThanOrEqual(80);
      expect(r.nutrition_rating).toBe("outstanding");
    });

    it("good for score 65-79", () => {
      // Reduce: lower meal plan count, remove some budgets, lower dietary coverage
      const r = computeHomeNutritionCatering(baseInput({
        meal_plans: Array.from({ length: 8 }, (_, i) =>
          makeMealPlan({ date: `2026-05-${String(Math.max(1, 27 - i)).padStart(2, "0")}` }),
        ),
        dietary_plans: [makeDietaryPlan({ child_id: "c1" }), makeDietaryPlan({ child_id: "c2" })],
        food_budgets: [makeFoodBudget({ cultural_ingredients_included: false, sensory_friendly_options_included: false })],
      }));
      expect(r.nutrition_score).toBeGreaterThanOrEqual(65);
      expect(r.nutrition_score).toBeLessThan(80);
      expect(r.nutrition_rating).toBe("good");
    });

    it("adequate for score 45-64", () => {
      // Moderate issues across several areas but not catastrophic
      // mod1: 1 pass + 1 fail + 1 pass kitchen = 2/3=67% → +0
      // mod2: 1 plan for 3 children = 33% → -4
      // mod3: 1 kitchen check, fridge ok, freezer bad → 0% both in range → -4
      // mod4: 1 plan reviewed+agreed → 100% → +3
      // mod5: allergen labelling false → 0% → -3
      // mod6: 5 meal plans → +0
      // mod7: no budgets → +0
      // mod8: no budgets → +0
      // 52 + 0-4-4+3-3+0+0+0 = 44 → too low. Let me adjust.
      // Make fridge within range: mod3 → 100% → +4. Remove allergen issue.
      // 52 + 0 -4 +4 +3 +3 +0 +0 +0 = 58 → adequate
      const r = computeHomeNutritionCatering(baseInput({
        meal_plans: Array.from({ length: 5 }, () => makeMealPlan()),
        dietary_plans: [makeDietaryPlan({ child_id: "c1" })],
        food_hygiene_records: [
          makeFoodHygiene({ compliance: "pass" }),
          makeFoodHygiene({ compliance: "action_required" }),
        ],
        kitchen_hygiene_checks: [makeKitchenCheck()],
        food_budgets: [],
      }));
      expect(r.nutrition_score).toBeGreaterThanOrEqual(45);
      expect(r.nutrition_score).toBeLessThan(65);
      expect(r.nutrition_rating).toBe("adequate");
    });

    it("inadequate for score < 45", () => {
      const r = computeHomeNutritionCatering(baseInput({
        meal_plans: [],
        dietary_plans: [],
        food_hygiene_records: [
          makeFoodHygiene({ compliance: "fail" }),
          makeFoodHygiene({ compliance: "fail" }),
          makeFoodHygiene({ compliance: "fail" }),
        ],
        kitchen_hygiene_checks: [
          makeKitchenCheck({ overall_verdict: "fail", fridge_within_range: false, freezer_within_range: false, allergen_labelling: false, expired_items_found_count: 5 }),
        ],
        eating_support_plans: [],
        food_budgets: [makeFoodBudget({ variance: -50, cultural_ingredients_included: false, sensory_friendly_options_included: false, cook_from_scratch_proportion: 10 })],
      }));
      expect(r.nutrition_score).toBeLessThan(45);
      expect(r.nutrition_rating).toBe("inadequate");
    });
  });

  // ── Meal Plan Profile ────────────────────────────────────────────────

  describe("meal plan profile", () => {
    it("filters to 30d window", () => {
      const r = computeHomeNutritionCatering(baseInput({
        meal_plans: [
          makeMealPlan({ date: "2026-05-20" }),     // in 30d
          makeMealPlan({ date: "2026-04-01" }),     // outside 30d
        ],
      }));
      expect(r.meal_plans.total_plans_30d).toBe(1);
    });

    it("tracks unique meal types", () => {
      const r = computeHomeNutritionCatering(baseInput({
        meal_plans: [
          makeMealPlan({ meal: "breakfast" }),
          makeMealPlan({ meal: "lunch" }),
          makeMealPlan({ meal: "dinner" }),
          makeMealPlan({ meal: "lunch" }),
        ],
      }));
      expect(r.meal_plans.unique_meals_covered).toBe(3);
    });

    it("calculates average dietary flags", () => {
      const r = computeHomeNutritionCatering(baseInput({
        meal_plans: [
          makeMealPlan({ dietary_flags_count: 2 }),
          makeMealPlan({ dietary_flags_count: 4 }),
        ],
      }));
      expect(r.meal_plans.avg_dietary_flags).toBe(3);
    });
  });

  // ── Dietary Plan Profile ─────────────────────────────────────────────

  describe("dietary plan profile", () => {
    it("calculates child coverage", () => {
      const r = computeHomeNutritionCatering(baseInput({
        dietary_plans: [makeDietaryPlan({ child_id: "c1" }), makeDietaryPlan({ child_id: "c2" })],
        total_children: 4,
      }));
      expect(r.dietary_plans.child_coverage).toBe(50);
    });

    it("calculates reviewed_with_child_rate", () => {
      const r = computeHomeNutritionCatering(baseInput({
        dietary_plans: [
          makeDietaryPlan({ reviewed_with_child: true }),
          makeDietaryPlan({ reviewed_with_child: false }),
        ],
      }));
      expect(r.dietary_plans.reviewed_with_child_rate).toBe(50);
    });

    it("counts overdue reviews", () => {
      const r = computeHomeNutritionCatering(baseInput({
        dietary_plans: [
          makeDietaryPlan({ next_review_date: "2026-05-01" }),  // overdue
          makeDietaryPlan({ next_review_date: "2026-07-01" }),  // not overdue
        ],
      }));
      expect(r.dietary_plans.overdue_reviews).toBe(1);
    });

    it("calculates dietitian sign-off rate", () => {
      const r = computeHomeNutritionCatering(baseInput({
        dietary_plans: [
          makeDietaryPlan({ signed_off_by_dietitian: true }),
          makeDietaryPlan({ signed_off_by_dietitian: false }),
          makeDietaryPlan({ signed_off_by_dietitian: true }),
        ],
      }));
      expect(r.dietary_plans.dietitian_sign_off_rate).toBe(67);
    });
  });

  // ── Food Hygiene Profile ──────────────────────────────────────────────

  describe("food hygiene profile", () => {
    it("filters to 30d window", () => {
      const r = computeHomeNutritionCatering(baseInput({
        food_hygiene_records: [
          makeFoodHygiene({ date: "2026-05-20" }),
          makeFoodHygiene({ date: "2026-03-01" }),  // outside
        ],
      }));
      expect(r.food_hygiene.total_checks_30d).toBe(1);
    });

    it("calculates pass rate excluding n_a", () => {
      const r = computeHomeNutritionCatering(baseInput({
        food_hygiene_records: [
          makeFoodHygiene({ compliance: "pass" }),
          makeFoodHygiene({ compliance: "pass" }),
          makeFoodHygiene({ compliance: "fail" }),
          makeFoodHygiene({ compliance: "n_a" }),
        ],
      }));
      // 2 pass out of 3 non-n_a = 67%
      expect(r.food_hygiene.pass_rate).toBe(67);
    });

    it("counts fails", () => {
      const r = computeHomeNutritionCatering(baseInput({
        food_hygiene_records: [
          makeFoodHygiene({ compliance: "fail" }),
          makeFoodHygiene({ compliance: "fail" }),
          makeFoodHygiene({ compliance: "pass" }),
        ],
      }));
      expect(r.food_hygiene.fail_count).toBe(2);
    });

    it("calculates action completion rate", () => {
      const r = computeHomeNutritionCatering(baseInput({
        food_hygiene_records: [
          makeFoodHygiene({ action_required: true, action_completed: true }),
          makeFoodHygiene({ action_required: true, action_completed: false }),
          makeFoodHygiene({ action_required: false }),
        ],
      }));
      expect(r.food_hygiene.action_completion_rate).toBe(50);
    });

    it("tracks check type diversity", () => {
      const r = computeHomeNutritionCatering(baseInput({
        food_hygiene_records: [
          makeFoodHygiene({ check_type: "fridge_temp" }),
          makeFoodHygiene({ check_type: "allergen_check" }),
          makeFoodHygiene({ check_type: "fridge_temp" }),
        ],
      }));
      expect(r.food_hygiene.check_type_diversity).toBe(2);
    });
  });

  // ── Kitchen Profile ──────────────────────────────────────────────────

  describe("kitchen profile", () => {
    it("filters to 30d window", () => {
      const r = computeHomeNutritionCatering(baseInput({
        kitchen_hygiene_checks: [
          makeKitchenCheck({ date: "2026-05-20" }),
          makeKitchenCheck({ date: "2026-03-01" }),
        ],
      }));
      expect(r.kitchen.total_checks_30d).toBe(1);
    });

    it("calculates temperature compliance", () => {
      const r = computeHomeNutritionCatering(baseInput({
        kitchen_hygiene_checks: [
          makeKitchenCheck({ fridge_within_range: true, freezer_within_range: true }),
          makeKitchenCheck({ fridge_within_range: true, freezer_within_range: false }),
          makeKitchenCheck({ fridge_within_range: false, freezer_within_range: true }),
        ],
      }));
      // 1 out of 3 both within range → 33%
      expect(r.kitchen.temperature_compliance_rate).toBe(33);
    });

    it("calculates allergen labelling rate", () => {
      const r = computeHomeNutritionCatering(baseInput({
        kitchen_hygiene_checks: [
          makeKitchenCheck({ allergen_labelling: true }),
          makeKitchenCheck({ allergen_labelling: false }),
        ],
      }));
      expect(r.kitchen.allergen_labelling_rate).toBe(50);
    });

    it("totals expired items found", () => {
      const r = computeHomeNutritionCatering(baseInput({
        kitchen_hygiene_checks: [
          makeKitchenCheck({ expired_items_found_count: 2 }),
          makeKitchenCheck({ expired_items_found_count: 3 }),
        ],
      }));
      expect(r.kitchen.expired_items_total).toBe(5);
    });
  });

  // ── Eating Support Profile ────────────────────────────────────────────

  describe("eating support profile", () => {
    it("calculates child choice rate", () => {
      const r = computeHomeNutritionCatering(baseInput({
        eating_support_plans: [
          makeEatingSupportPlan({ child_chose: true }),
          makeEatingSupportPlan({ child_chose: false }),
        ],
      }));
      expect(r.eating_support.child_choice_rate).toBe(50);
    });

    it("counts overdue reviews", () => {
      const r = computeHomeNutritionCatering(baseInput({
        eating_support_plans: [
          makeEatingSupportPlan({ review_date: "2026-04-01" }),  // overdue
          makeEatingSupportPlan({ review_date: "2026-08-01" }),  // not overdue
        ],
      }));
      expect(r.eating_support.overdue_reviews).toBe(1);
    });

    it("totals flags for review", () => {
      const r = computeHomeNutritionCatering(baseInput({
        eating_support_plans: [
          makeEatingSupportPlan({ flags_for_review_count: 3 }),
          makeEatingSupportPlan({ flags_for_review_count: 2 }),
        ],
      }));
      expect(r.eating_support.flags_for_review_total).toBe(5);
    });
  });

  // ── Budget Profile ────────────────────────────────────────────────────

  describe("budget profile", () => {
    it("filters to 90d window", () => {
      const r = computeHomeNutritionCatering(baseInput({
        food_budgets: [
          makeFoodBudget({ week_starting: "2026-05-12" }),
          makeFoodBudget({ week_starting: "2026-01-01" }),  // outside
        ],
      }));
      expect(r.budget.weeks_tracked_90d).toBe(1);
    });

    it("calculates within-budget rate", () => {
      const r = computeHomeNutritionCatering(baseInput({
        food_budgets: [
          makeFoodBudget({ variance: 15 }),     // within (positive)
          makeFoodBudget({ variance: 0 }),      // within (exact)
          makeFoodBudget({ variance: -20 }),    // over budget
        ],
      }));
      expect(r.budget.within_budget_rate).toBe(67);
    });

    it("calculates cultural inclusion rate", () => {
      const r = computeHomeNutritionCatering(baseInput({
        food_budgets: [
          makeFoodBudget({ cultural_ingredients_included: true }),
          makeFoodBudget({ cultural_ingredients_included: false }),
        ],
      }));
      expect(r.budget.cultural_inclusion_rate).toBe(50);
    });

    it("calculates average scratch proportion", () => {
      const r = computeHomeNutritionCatering(baseInput({
        food_budgets: [
          makeFoodBudget({ cook_from_scratch_proportion: 80 }),
          makeFoodBudget({ cook_from_scratch_proportion: 60 }),
        ],
      }));
      expect(r.budget.avg_scratch_proportion).toBe(70);
    });
  });

  // ── Scoring Modifiers ─────────────────────────────────────────────────

  describe("mod1: food hygiene pass rate (±5)", () => {
    it("+5 when combined pass rate >= 95%", () => {
      const high = computeHomeNutritionCatering(baseInput());
      const low = computeHomeNutritionCatering(baseInput({
        food_hygiene_records: [
          makeFoodHygiene({ compliance: "fail" }),
          makeFoodHygiene({ compliance: "fail" }),
          makeFoodHygiene({ compliance: "fail" }),
        ],
        kitchen_hygiene_checks: [makeKitchenCheck({ overall_verdict: "fail" })],
      }));
      // high: +5, low: -5 → diff = 10
      expect(high.nutrition_score - low.nutrition_score).toBe(10);
    });
  });

  describe("mod2: dietary plan coverage (±4)", () => {
    it("+4 when coverage >= 90%", () => {
      const high = computeHomeNutritionCatering(baseInput());
      // 3 plans for 3 children = 100%
      expect(high.dietary_plans.child_coverage).toBe(100);
    });

    it("-4 when no dietary plans but children exist", () => {
      const none = computeHomeNutritionCatering(baseInput({ dietary_plans: [] }));
      const full = computeHomeNutritionCatering(baseInput());
      // none: mod2=-4, mod4=+0 (no plans). full: mod2=+4, mod4=+3. diff = 8+3 = 11
      expect(full.nutrition_score - none.nutrition_score).toBe(11);
    });
  });

  describe("mod3: temperature compliance (±4)", () => {
    it("+4 when 100% temperature compliance", () => {
      const high = computeHomeNutritionCatering(baseInput());
      const low = computeHomeNutritionCatering(baseInput({
        kitchen_hygiene_checks: [
          makeKitchenCheck({ fridge_within_range: false, freezer_within_range: false }),
        ],
      }));
      // high: +4, low: -4 → diff = 8
      expect(high.nutrition_score - low.nutrition_score).toBe(8);
    });
  });

  describe("mod4: child voice in dietary plans (±3)", () => {
    it("+3 when >= 90% reviewed with child AND agreed", () => {
      const high = computeHomeNutritionCatering(baseInput());
      // Ensure low case still has 3 plans covering 3 children (same mod2) but without child voice
      const low = computeHomeNutritionCatering(baseInput({
        dietary_plans: [
          makeDietaryPlan({ child_id: "c1", reviewed_with_child: false, child_agreed: false }),
          makeDietaryPlan({ child_id: "c2", reviewed_with_child: false, child_agreed: false }),
          makeDietaryPlan({ child_id: "c3", reviewed_with_child: false, child_agreed: false }),
        ],
      }));
      // high: +3, low: -3 → diff = 6 (mod2 is same: both 100% coverage → +4)
      expect(high.nutrition_score - low.nutrition_score).toBe(6);
    });
  });

  describe("mod5: allergen labelling (±3)", () => {
    it("+3 when 100% labelling", () => {
      const high = computeHomeNutritionCatering(baseInput());
      const low = computeHomeNutritionCatering(baseInput({
        kitchen_hygiene_checks: [
          makeKitchenCheck({ allergen_labelling: false }),
          makeKitchenCheck({ allergen_labelling: false }),
        ],
      }));
      // high: +3, low: -3 → diff = 6
      expect(high.nutrition_score - low.nutrition_score).toBe(6);
    });
  });

  describe("mod6: meal planning regularity (±3)", () => {
    it("+3 when >= 20 meal plans in 30d", () => {
      const high = computeHomeNutritionCatering(baseInput());
      // baseInput has 20 meal plans → +3
      expect(high.meal_plans.total_plans_30d).toBe(20);
    });

    it("-3 when no meal plans and children exist", () => {
      const none = computeHomeNutritionCatering(baseInput({ meal_plans: [] }));
      const some = computeHomeNutritionCatering(baseInput({
        meal_plans: Array.from({ length: 20 }, (_, i) =>
          makeMealPlan({ date: `2026-05-${String(Math.max(1, 27 - i)).padStart(2, "0")}` }),
        ),
      }));
      // none: -3, some: +3 → diff = 6
      expect(some.nutrition_score - none.nutrition_score).toBe(6);
    });
  });

  describe("mod7: budget management (±3)", () => {
    it("+3 when within budget >= 90% and scratch >= 50%", () => {
      const high = computeHomeNutritionCatering(baseInput());
      const low = computeHomeNutritionCatering(baseInput({
        food_budgets: [
          makeFoodBudget({ variance: -50, cook_from_scratch_proportion: 10 }),
          makeFoodBudget({ variance: -30, cook_from_scratch_proportion: 20 }),
        ],
      }));
      // high: +3, low: -3 → diff = 6
      expect(high.nutrition_score - low.nutrition_score).toBe(6);
    });
  });

  describe("mod8: cultural and sensory inclusion (±3)", () => {
    it("+3 when both >= 80%", () => {
      const high = computeHomeNutritionCatering(baseInput());
      const low = computeHomeNutritionCatering(baseInput({
        food_budgets: [
          makeFoodBudget({ cultural_ingredients_included: false, sensory_friendly_options_included: false }),
          makeFoodBudget({ cultural_ingredients_included: false, sensory_friendly_options_included: false }),
        ],
      }));
      // high: +3, low: -3 → diff = 6
      expect(high.nutrition_score - low.nutrition_score).toBe(6);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes hygiene pass rate strength", () => {
      const r = computeHomeNutritionCatering(baseInput());
      expect(r.strengths.some(s => s.includes("food hygiene pass rate"))).toBe(true);
    });

    it("includes temperature compliance strength when 100%", () => {
      const r = computeHomeNutritionCatering(baseInput());
      expect(r.strengths.some(s => s.includes("temperature compliance"))).toBe(true);
    });

    it("includes dietary coverage strength", () => {
      const r = computeHomeNutritionCatering(baseInput());
      expect(r.strengths.some(s => s.includes("dietary plan coverage"))).toBe(true);
    });

    it("includes allergen labelling strength", () => {
      const r = computeHomeNutritionCatering(baseInput());
      expect(r.strengths.some(s => s.includes("allergen labelling"))).toBe(true);
    });

    it("includes cultural ingredients strength", () => {
      const r = computeHomeNutritionCatering(baseInput());
      expect(r.strengths.some(s => s.includes("cultural ingredients"))).toBe(true);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags hygiene failures >= 3", () => {
      const r = computeHomeNutritionCatering(baseInput({
        food_hygiene_records: [
          makeFoodHygiene({ compliance: "fail" }),
          makeFoodHygiene({ compliance: "fail" }),
          makeFoodHygiene({ compliance: "fail" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("food hygiene failures"))).toBe(true);
    });

    it("flags expired items >= 3", () => {
      const r = computeHomeNutritionCatering(baseInput({
        kitchen_hygiene_checks: [makeKitchenCheck({ expired_items_found_count: 4 })],
      }));
      expect(r.concerns.some(c => c.includes("expired items"))).toBe(true);
    });

    it("flags low temperature compliance", () => {
      const r = computeHomeNutritionCatering(baseInput({
        kitchen_hygiene_checks: [
          makeKitchenCheck({ fridge_within_range: false, freezer_within_range: false }),
          makeKitchenCheck({ fridge_within_range: false, freezer_within_range: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Temperature compliance"))).toBe(true);
    });

    it("flags no dietary plans", () => {
      const r = computeHomeNutritionCatering(baseInput({ dietary_plans: [] }));
      expect(r.concerns.some(c => c.includes("No dietary plans"))).toBe(true);
    });

    it("flags low allergen labelling", () => {
      const r = computeHomeNutritionCatering(baseInput({
        kitchen_hygiene_checks: [
          makeKitchenCheck({ allergen_labelling: false }),
          makeKitchenCheck({ allergen_labelling: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Allergen labelling"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends hygiene review when failures >= 2", () => {
      const r = computeHomeNutritionCatering(baseInput({
        food_hygiene_records: [
          makeFoodHygiene({ compliance: "fail" }),
          makeFoodHygiene({ compliance: "fail" }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("food hygiene"))).toBe(true);
    });

    it("recommends allergen labelling when < 80%", () => {
      const r = computeHomeNutritionCatering(baseInput({
        kitchen_hygiene_checks: [
          makeKitchenCheck({ allergen_labelling: false }),
          makeKitchenCheck({ allergen_labelling: false }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("allergen labelling"))).toBe(true);
    });

    it("recommends dietary plans when coverage < 70%", () => {
      const r = computeHomeNutritionCatering(baseInput({
        dietary_plans: [makeDietaryPlan({ child_id: "c1" })],
        total_children: 4,
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("dietary plan"))).toBe(true);
    });

    it("ranks recommendations sequentially", () => {
      const r = computeHomeNutritionCatering(baseInput({
        food_hygiene_records: [makeFoodHygiene({ compliance: "fail" }), makeFoodHygiene({ compliance: "fail" })],
        kitchen_hygiene_checks: [makeKitchenCheck({ allergen_labelling: false })],
        dietary_plans: [],
        meal_plans: [makeMealPlan()],
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ── ARIA Insights ─────────────────────────────────────────────────────

  describe("ARIA insights", () => {
    it("generates positive insight for exemplary nutrition", () => {
      const r = computeHomeNutritionCatering(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("generates critical insight for systemic food safety issues", () => {
      const r = computeHomeNutritionCatering(baseInput({
        food_hygiene_records: [
          makeFoodHygiene({ compliance: "fail" }),
          makeFoodHygiene({ compliance: "fail" }),
          makeFoodHygiene({ compliance: "fail" }),
        ],
        kitchen_hygiene_checks: [makeKitchenCheck({ expired_items_found_count: 4 })],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("systemic food safety"))).toBe(true);
    });

    it("generates positive insight for child-centred cultural dietary care", () => {
      const r = computeHomeNutritionCatering(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("child-centred"))).toBe(true);
    });

    it("generates warning for low scratch cooking", () => {
      const r = computeHomeNutritionCatering(baseInput({
        food_budgets: [
          makeFoodBudget({ cook_from_scratch_proportion: 20 }),
          makeFoodBudget({ cook_from_scratch_proportion: 25 }),
          makeFoodBudget({ cook_from_scratch_proportion: 30 }),
          makeFoodBudget({ cook_from_scratch_proportion: 15 }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("scratch"))).toBe(true);
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("outstanding headline mentions pass rate and coverage", () => {
      const r = computeHomeNutritionCatering(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("inadequate headline mentions significant gaps", () => {
      const r = computeHomeNutritionCatering(baseInput({
        meal_plans: [],
        dietary_plans: [],
        food_hygiene_records: [
          makeFoodHygiene({ compliance: "fail" }),
          makeFoodHygiene({ compliance: "fail" }),
          makeFoodHygiene({ compliance: "fail" }),
        ],
        kitchen_hygiene_checks: [
          makeKitchenCheck({ overall_verdict: "fail", fridge_within_range: false, freezer_within_range: false, allergen_labelling: false }),
        ],
        food_budgets: [makeFoodBudget({ variance: -50, cultural_ingredients_included: false, sensory_friendly_options_included: false, cook_from_scratch_proportion: 10 })],
      }));
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("score is clamped 0-100", () => {
      const r = computeHomeNutritionCatering(baseInput());
      expect(r.nutrition_score).toBeGreaterThanOrEqual(0);
      expect(r.nutrition_score).toBeLessThanOrEqual(100);
    });

    it("handles all empty arrays with children", () => {
      const r = computeHomeNutritionCatering({
        today: "2026-05-27",
        meal_plans: [], dietary_plans: [], food_hygiene_records: [],
        kitchen_hygiene_checks: [], eating_support_plans: [], food_budgets: [],
        total_children: 3,
      });
      expect(r.nutrition_rating).not.toBe("insufficient_data");
      expect(typeof r.nutrition_score).toBe("number");
    });

    it("records outside time windows are excluded", () => {
      const r = computeHomeNutritionCatering(baseInput({
        meal_plans: [makeMealPlan({ date: "2025-01-01" })],
        food_hygiene_records: [makeFoodHygiene({ date: "2025-01-01" })],
        kitchen_hygiene_checks: [makeKitchenCheck({ date: "2025-01-01" })],
        food_budgets: [makeFoodBudget({ week_starting: "2025-01-01" })],
      }));
      expect(r.meal_plans.total_plans_30d).toBe(0);
      expect(r.food_hygiene.total_checks_30d).toBe(0);
      expect(r.kitchen.total_checks_30d).toBe(0);
      expect(r.budget.weeks_tracked_90d).toBe(0);
    });
  });
});
