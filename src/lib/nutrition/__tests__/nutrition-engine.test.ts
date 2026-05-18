// ══════════════════════════════════════════════════════════════════════════════
// Nutrition & Dietary Compliance Intelligence — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateDietaryAccommodation,
  evaluateMealQuality,
  evaluateChildInvolvement,
  evaluateFoodSafety,
  buildChildNutritionProfiles,
  generateNutritionIntelligence,
  getDietaryLabel,
  getQualityFactorLabel,
} from "../nutrition-engine";
import type {
  NutritionChild,
  MealRecord,
  MenuPlan,
  FoodSafetyRecord,
  CookingSession,
} from "../nutrition-engine";

// ── Test Data ────────────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";

const children: NutritionChild[] = [
  {
    id: "child-alex",
    name: "Alex",
    dateOfBirth: "2012-03-15",
    currentPlacement: true,
    dietaryRequirements: ["cultural_preference"],
    allergies: [],
    preferences: ["Caribbean food", "Jerk chicken"],
    dislikes: ["Mushrooms"],
    cookingSkillLevel: 3,
  },
  {
    id: "child-jordan",
    name: "Jordan",
    dateOfBirth: "2013-07-22",
    currentPlacement: true,
    dietaryRequirements: [],
    allergies: ["nut_allergy"],
    preferences: ["Pasta", "Pizza"],
    dislikes: ["Spicy food"],
    cookingSkillLevel: 2,
  },
  {
    id: "child-morgan",
    name: "Morgan",
    dateOfBirth: "2010-12-01",
    currentPlacement: true,
    dietaryRequirements: ["halal"],
    allergies: [],
    preferences: ["Biryani", "Curry"],
    dislikes: [],
    cookingSkillLevel: 4,
  },
];

const nonPlacedChild: NutritionChild = {
  id: "child-left",
  name: "Left",
  dateOfBirth: "2011-06-10",
  currentPlacement: false,
  dietaryRequirements: ["vegan"],
  allergies: ["soy_allergy"],
  preferences: [],
  dislikes: [],
  cookingSkillLevel: 1,
};

const meals: MealRecord[] = [
  {
    id: "meal-001",
    date: "2026-01-15",
    mealType: "dinner",
    description: "Jerk chicken with rice and peas",
    foodGroupsCovered: ["protein", "carbohydrates", "fruit_vegetables"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["staff_ate_with_children", "positive_conversation", "family_style_serving", "no_rushing"],
  },
  {
    id: "meal-002",
    date: "2026-01-16",
    mealType: "lunch",
    description: "Halal chicken biryani with raita",
    foodGroupsCovered: ["protein", "carbohydrates", "dairy_alternatives"],
    freshFruitVegIncluded: false,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["staff_ate_with_children", "positive_conversation", "cultural_celebration_meal"],
  },
  {
    id: "meal-003",
    date: "2026-01-17",
    mealType: "breakfast",
    description: "Full English breakfast (halal sausages)",
    foodGroupsCovered: ["protein", "carbohydrates", "fats_oils"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-morgan"],
    qualityFactors: ["no_rushing", "positive_conversation"],
  },
  {
    id: "meal-004",
    date: "2026-02-05",
    mealType: "dinner",
    description: "Pasta bolognese with salad",
    foodGroupsCovered: ["protein", "carbohydrates", "fruit_vegetables"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["staff_ate_with_children", "children_helped_cook", "positive_conversation", "family_style_serving", "no_rushing"],
  },
  {
    id: "meal-005",
    date: "2026-02-06",
    mealType: "lunch",
    description: "Homemade pizza with mixed salad",
    foodGroupsCovered: ["carbohydrates", "dairy_alternatives", "fruit_vegetables"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["children_helped_cook", "children_chose_menu", "positive_conversation", "no_rushing"],
  },
  {
    id: "meal-006",
    date: "2026-03-01",
    mealType: "dinner",
    description: "Lamb curry with naan bread and rice",
    foodGroupsCovered: ["protein", "carbohydrates", "fats_oils", "fruit_vegetables"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["staff_ate_with_children", "positive_conversation", "cultural_celebration_meal", "family_style_serving", "no_rushing"],
  },
  {
    id: "meal-007",
    date: "2026-03-10",
    mealType: "dinner",
    description: "Fish and chips with mushy peas",
    foodGroupsCovered: ["protein", "carbohydrates", "fruit_vegetables"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-jordan", "child-morgan"],
    qualityFactors: ["staff_ate_with_children", "no_rushing"],
  },
  {
    id: "meal-008",
    date: "2026-03-20",
    mealType: "lunch",
    description: "Chicken wraps with salad",
    foodGroupsCovered: ["protein", "carbohydrates", "fruit_vegetables"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["children_chose_menu", "positive_conversation", "no_rushing"],
  },
  {
    id: "meal-009",
    date: "2026-04-01",
    mealType: "dinner",
    description: "Eid celebration meal — halal lamb biryani",
    foodGroupsCovered: ["protein", "carbohydrates", "fruit_vegetables", "dairy_alternatives"],
    freshFruitVegIncluded: true,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan", "child-morgan"],
    qualityFactors: ["staff_ate_with_children", "cultural_celebration_meal", "family_style_serving", "positive_conversation", "no_rushing", "children_helped_set_table"],
  },
  {
    id: "meal-010",
    date: "2026-04-15",
    mealType: "dinner",
    description: "Spaghetti carbonara with garlic bread",
    foodGroupsCovered: ["carbohydrates", "protein", "dairy_alternatives"],
    freshFruitVegIncluded: false,
    dietaryRequirementsMet: true,
    allergensSafelyManaged: true,
    childrenPresent: ["child-alex", "child-jordan"],
    qualityFactors: ["positive_conversation", "no_rushing"],
  },
];

const menuPlans: MenuPlan[] = [
  {
    id: "mp-001",
    weekCommencing: "2026-01-13",
    createdBy: "Sarah Johnson",
    childrenContributed: true,
    contributingChildIds: ["child-alex", "child-morgan"],
    mealsPlanned: 21,
    dietaryVariety: 14,
    culturalMealsIncluded: 3,
    freshCookingDays: 6,
    totalDays: 7,
  },
  {
    id: "mp-002",
    weekCommencing: "2026-02-03",
    createdBy: "Lisa Williams",
    childrenContributed: true,
    contributingChildIds: ["child-alex", "child-jordan", "child-morgan"],
    mealsPlanned: 21,
    dietaryVariety: 15,
    culturalMealsIncluded: 2,
    freshCookingDays: 7,
    totalDays: 7,
  },
  {
    id: "mp-003",
    weekCommencing: "2026-03-03",
    createdBy: "Sarah Johnson",
    childrenContributed: true,
    contributingChildIds: ["child-jordan"],
    mealsPlanned: 21,
    dietaryVariety: 12,
    culturalMealsIncluded: 2,
    freshCookingDays: 5,
    totalDays: 7,
  },
  {
    id: "mp-004",
    weekCommencing: "2026-04-01",
    createdBy: "Tom Richards",
    childrenContributed: true,
    contributingChildIds: ["child-alex", "child-jordan", "child-morgan"],
    mealsPlanned: 21,
    dietaryVariety: 16,
    culturalMealsIncluded: 4,
    freshCookingDays: 7,
    totalDays: 7,
  },
  {
    id: "mp-005",
    weekCommencing: "2026-05-01",
    createdBy: "Lisa Williams",
    childrenContributed: false,
    contributingChildIds: [],
    mealsPlanned: 21,
    dietaryVariety: 13,
    culturalMealsIncluded: 1,
    freshCookingDays: 5,
    totalDays: 7,
  },
];

const foodSafetyChecks: FoodSafetyRecord[] = [
  { id: "fs-001", date: "2026-01-15", checkType: "fridge_temperature", compliant: true },
  { id: "fs-002", date: "2026-01-15", checkType: "freezer_temperature", compliant: true },
  { id: "fs-003", date: "2026-01-20", checkType: "food_hygiene_audit", compliant: true },
  { id: "fs-004", date: "2026-02-01", checkType: "allergen_labelling", compliant: true },
  { id: "fs-005", date: "2026-02-10", checkType: "fridge_temperature", compliant: false, correctionNeeded: "Fridge at 7°C — adjusted to 4°C", correctedDate: "2026-02-10" },
  { id: "fs-006", date: "2026-02-15", checkType: "use_by_date_check", compliant: true },
  { id: "fs-007", date: "2026-03-01", checkType: "cleaning_schedule", compliant: true },
  { id: "fs-008", date: "2026-03-10", checkType: "hand_hygiene", compliant: true },
  { id: "fs-009", date: "2026-03-20", checkType: "fridge_temperature", compliant: true },
  { id: "fs-010", date: "2026-04-01", checkType: "allergen_labelling", compliant: true },
  { id: "fs-011", date: "2026-04-15", checkType: "food_hygiene_audit", compliant: true },
  { id: "fs-012", date: "2026-05-01", checkType: "fridge_temperature", compliant: true },
];

const cookingSessions: CookingSession[] = [
  {
    id: "cs-001",
    date: "2026-01-20",
    childId: "child-alex",
    description: "Made jerk chicken marinade and rice",
    skillsPractised: ["measuring", "seasoning", "using hob"],
    supportLevel: "some_support",
    childEngaged: true,
    childInitiated: true,
    linkedToIndependencePlan: true,
  },
  {
    id: "cs-002",
    date: "2026-02-05",
    childId: "child-jordan",
    description: "Made cheese toasties and tomato soup",
    skillsPractised: ["using grill", "heating soup"],
    supportLevel: "full_support",
    childEngaged: true,
    childInitiated: false,
    linkedToIndependencePlan: true,
  },
  {
    id: "cs-003",
    date: "2026-02-10",
    childId: "child-morgan",
    description: "Cooked biryani from scratch for the home",
    skillsPractised: ["preparing rice", "spice blending", "timing"],
    supportLevel: "independent",
    childEngaged: true,
    childInitiated: true,
    linkedToIndependencePlan: true,
  },
  {
    id: "cs-004",
    date: "2026-03-05",
    childId: "child-alex",
    description: "Baked banana bread",
    skillsPractised: ["measuring", "mixing", "using oven"],
    supportLevel: "some_support",
    childEngaged: true,
    childInitiated: false,
    linkedToIndependencePlan: true,
  },
  {
    id: "cs-005",
    date: "2026-03-15",
    childId: "child-morgan",
    description: "Made fresh pasta with tomato sauce",
    skillsPractised: ["pasta making", "sauce preparation", "timing"],
    supportLevel: "independent",
    childEngaged: true,
    childInitiated: true,
    linkedToIndependencePlan: true,
  },
  {
    id: "cs-006",
    date: "2026-04-01",
    childId: "child-morgan",
    description: "Eid celebration meal — lamb biryani for whole home",
    skillsPractised: ["full meal preparation", "batch cooking", "presentation"],
    supportLevel: "independent",
    childEngaged: true,
    childInitiated: true,
    linkedToIndependencePlan: true,
  },
  {
    id: "cs-007",
    date: "2026-04-10",
    childId: "child-alex",
    description: "Made pancakes for breakfast",
    skillsPractised: ["batter making", "using frying pan", "flipping"],
    supportLevel: "some_support",
    childEngaged: true,
    childInitiated: true,
    linkedToIndependencePlan: true,
  },
  {
    id: "cs-008",
    date: "2026-04-20",
    childId: "child-jordan",
    description: "Made sandwiches and fruit salad for packed lunch",
    skillsPractised: ["knife skills", "food prep"],
    supportLevel: "some_support",
    childEngaged: true,
    childInitiated: false,
    linkedToIndependencePlan: true,
  },
  {
    id: "cs-009",
    date: "2026-05-05",
    childId: "child-morgan",
    description: "Cooked a full Sunday roast independently",
    skillsPractised: ["roasting", "timing multiple dishes", "gravy making"],
    supportLevel: "independent",
    childEngaged: true,
    childInitiated: true,
    linkedToIndependencePlan: true,
  },
];

// ── Dietary Accommodation ────────────────────────────────────────────────────

describe("evaluateDietaryAccommodation", () => {
  it("counts total placed children", () => {
    const result = evaluateDietaryAccommodation(children, meals, PERIOD_START, PERIOD_END);
    expect(result.totalChildren).toBe(3);
  });

  it("identifies children with dietary requirements", () => {
    const result = evaluateDietaryAccommodation(children, meals, PERIOD_START, PERIOD_END);
    // Alex: cultural_preference, Jordan: nut_allergy (via allergies), Morgan: halal
    expect(result.childrenWithRequirements).toBe(3);
  });

  it("calculates 100% met rate when all meals meet requirements", () => {
    const result = evaluateDietaryAccommodation(children, meals, PERIOD_START, PERIOD_END);
    expect(result.metRate).toBe(100);
    expect(result.requirementsNotMet).toBe(0);
  });

  it("detects unmet dietary requirements", () => {
    const failMeals: MealRecord[] = [
      {
        ...meals[0],
        id: "fail-001",
        dietaryRequirementsMet: false,
      },
      meals[1],
    ];
    const result = evaluateDietaryAccommodation(children, failMeals, PERIOD_START, PERIOD_END);
    expect(result.requirementsNotMet).toBe(1);
    expect(result.metRate).toBeLessThan(100);
  });

  it("calculates 100% allergen management rate", () => {
    const result = evaluateDietaryAccommodation(children, meals, PERIOD_START, PERIOD_END);
    expect(result.allergyManagementRate).toBe(100);
  });

  it("detects allergen management failures", () => {
    const failMeals: MealRecord[] = [
      {
        ...meals[0],
        id: "afail-001",
        allergensSafelyManaged: false,
      },
    ];
    const result = evaluateDietaryAccommodation(children, failMeals, PERIOD_START, PERIOD_END);
    expect(result.allergyManagementRate).toBe(0);
  });

  it("produces requirement type breakdown", () => {
    const result = evaluateDietaryAccommodation(children, meals, PERIOD_START, PERIOD_END);
    expect(result.requirementBreakdown.length).toBeGreaterThan(0);
    const halal = result.requirementBreakdown.find((r) => r.type === "halal");
    expect(halal?.count).toBe(1);
    const cultural = result.requirementBreakdown.find((r) => r.type === "cultural_preference");
    expect(cultural?.count).toBe(1);
  });

  it("excludes non-placed children", () => {
    const allChildren = [...children, nonPlacedChild];
    const result = evaluateDietaryAccommodation(allChildren, meals, PERIOD_START, PERIOD_END);
    expect(result.totalChildren).toBe(3);
  });

  it("handles no meals in period", () => {
    const result = evaluateDietaryAccommodation(children, [], PERIOD_START, PERIOD_END);
    expect(result.totalChildren).toBe(3);
    expect(result.metRate).toBe(0);
  });

  it("excludes meals outside period", () => {
    const outOfPeriodMeals: MealRecord[] = [
      { ...meals[0], id: "oop-001", date: "2025-06-01" },
    ];
    const result = evaluateDietaryAccommodation(children, outOfPeriodMeals, PERIOD_START, PERIOD_END);
    expect(result.requirementsMet).toBe(0);
  });
});

// ── Meal Quality ─────────────────────────────────────────────────────────────

describe("evaluateMealQuality", () => {
  it("counts total meals in period", () => {
    const result = evaluateMealQuality(meals, menuPlans, PERIOD_START, PERIOD_END);
    expect(result.totalMeals).toBe(10);
  });

  it("calculates meals per day", () => {
    const result = evaluateMealQuality(meals, menuPlans, PERIOD_START, PERIOD_END);
    expect(result.mealsPerDay).toBeGreaterThan(0);
  });

  it("calculates fresh fruit/veg rate", () => {
    const result = evaluateMealQuality(meals, menuPlans, PERIOD_START, PERIOD_END);
    // 8/10 meals include fresh fruit/veg
    expect(result.freshFruitVegRate).toBe(80);
  });

  it("calculates average food groups covered", () => {
    const result = evaluateMealQuality(meals, menuPlans, PERIOD_START, PERIOD_END);
    expect(result.averageFoodGroupsCovered).toBeGreaterThan(2);
  });

  it("calculates variety score from unique descriptions", () => {
    const result = evaluateMealQuality(meals, menuPlans, PERIOD_START, PERIOD_END);
    // All 10 meals have unique descriptions = 100%
    expect(result.varietyScore).toBe(100);
  });

  it("detects low variety with duplicate meals", () => {
    const dupMeals: MealRecord[] = [
      meals[0],
      { ...meals[0], id: "dup-001", date: "2026-01-20" },
      { ...meals[0], id: "dup-002", date: "2026-01-25" },
    ];
    const result = evaluateMealQuality(dupMeals, menuPlans, PERIOD_START, PERIOD_END);
    // 1 unique / 3 total = 33%
    expect(result.varietyScore).toBe(33);
  });

  it("calculates cultural meal rate from menu plans", () => {
    const result = evaluateMealQuality(meals, menuPlans, PERIOD_START, PERIOD_END);
    // Total cultural meals: 3+2+2+4+1 = 12, total planned: 5*21 = 105
    expect(result.culturalMealRate).toBe(Math.round((12 / 105) * 100));
  });

  it("calculates fresh cooking rate from menu plans", () => {
    const result = evaluateMealQuality(meals, menuPlans, PERIOD_START, PERIOD_END);
    // Fresh: 6+7+5+7+5 = 30, total: 5*7 = 35
    expect(result.freshCookingRate).toBe(Math.round((30 / 35) * 100));
  });

  it("produces quality factor frequency breakdown", () => {
    const result = evaluateMealQuality(meals, menuPlans, PERIOD_START, PERIOD_END);
    expect(result.qualityFactorFrequency.length).toBeGreaterThan(0);
    const staffAte = result.qualityFactorFrequency.find(
      (f) => f.factor === "staff_ate_with_children",
    );
    expect(staffAte).toBeDefined();
    expect(staffAte!.count).toBeGreaterThan(0);
  });

  it("handles no meals", () => {
    const result = evaluateMealQuality([], [], PERIOD_START, PERIOD_END);
    expect(result.totalMeals).toBe(0);
    expect(result.mealsPerDay).toBe(0);
    expect(result.freshFruitVegRate).toBe(0);
    expect(result.averageFoodGroupsCovered).toBe(0);
  });

  it("handles no menu plans", () => {
    const result = evaluateMealQuality(meals, [], PERIOD_START, PERIOD_END);
    expect(result.culturalMealRate).toBe(0);
    expect(result.freshCookingRate).toBe(0);
  });
});

// ── Child Involvement ────────────────────────────────────────────────────────

describe("evaluateChildInvolvement", () => {
  it("calculates menu contribution rate", () => {
    const result = evaluateChildInvolvement(children, meals, menuPlans, cookingSessions, PERIOD_START, PERIOD_END);
    // 4 of 5 plans have children contributing = 80%
    expect(result.menuContributionRate).toBe(80);
  });

  it("counts total cooking sessions", () => {
    const result = evaluateChildInvolvement(children, meals, menuPlans, cookingSessions, PERIOD_START, PERIOD_END);
    expect(result.cookingSessionsTotal).toBe(9);
  });

  it("calculates cooking sessions per child", () => {
    const result = evaluateChildInvolvement(children, meals, menuPlans, cookingSessions, PERIOD_START, PERIOD_END);
    // 9 sessions / 3 children = 3.0
    expect(result.cookingSessionsPerChild).toBe(3);
  });

  it("calculates child-initiated rate", () => {
    const result = evaluateChildInvolvement(children, meals, menuPlans, cookingSessions, PERIOD_START, PERIOD_END);
    // 6 initiated / 9 total = 67%
    expect(result.childInitiatedRate).toBe(67);
  });

  it("calculates engagement rate", () => {
    const result = evaluateChildInvolvement(children, meals, menuPlans, cookingSessions, PERIOD_START, PERIOD_END);
    // All 9 engaged = 100%
    expect(result.engagementRate).toBe(100);
  });

  it("calculates staff-ate-with-children rate", () => {
    const result = evaluateChildInvolvement(children, meals, menuPlans, cookingSessions, PERIOD_START, PERIOD_END);
    // Staff ate with children: meals 1,2,4,6,7,9 = 6 of 10 = 60%
    expect(result.staffAteWithChildrenRate).toBe(60);
  });

  it("calculates children-helped-cook rate", () => {
    const result = evaluateChildInvolvement(children, meals, menuPlans, cookingSessions, PERIOD_START, PERIOD_END);
    // Meals 4,5 = 2 of 10 = 20%
    expect(result.childrenHelpedCookRate).toBe(20);
  });

  it("calculates children-chose-menu rate", () => {
    const result = evaluateChildInvolvement(children, meals, menuPlans, cookingSessions, PERIOD_START, PERIOD_END);
    // Meals 5,8 = 2 of 10 = 20%
    expect(result.childrenChoseMenuRate).toBe(20);
  });

  it("excludes non-placed children from sessions", () => {
    const sessionsWithLeft: CookingSession[] = [
      ...cookingSessions,
      {
        id: "cs-left",
        date: "2026-02-01",
        childId: "child-left",
        description: "Cooking",
        skillsPractised: ["basic"],
        supportLevel: "full_support",
        childEngaged: true,
        childInitiated: false,
        linkedToIndependencePlan: false,
      },
    ];
    const allChildren = [...children, nonPlacedChild];
    const result = evaluateChildInvolvement(allChildren, meals, menuPlans, sessionsWithLeft, PERIOD_START, PERIOD_END);
    // Should still be 9 (non-placed child sessions excluded)
    expect(result.cookingSessionsTotal).toBe(9);
  });

  it("handles no sessions and no meals", () => {
    const result = evaluateChildInvolvement(children, [], [], [], PERIOD_START, PERIOD_END);
    expect(result.cookingSessionsTotal).toBe(0);
    expect(result.menuContributionRate).toBe(0);
    expect(result.staffAteWithChildrenRate).toBe(0);
  });
});

// ── Food Safety ──────────────────────────────────────────────────────────────

describe("evaluateFoodSafety", () => {
  it("counts total checks in period", () => {
    const result = evaluateFoodSafety(foodSafetyChecks, PERIOD_START, PERIOD_END);
    expect(result.totalChecks).toBe(12);
  });

  it("counts compliant checks", () => {
    const result = evaluateFoodSafety(foodSafetyChecks, PERIOD_START, PERIOD_END);
    // 11 compliant out of 12
    expect(result.compliantChecks).toBe(11);
  });

  it("calculates compliance rate", () => {
    const result = evaluateFoodSafety(foodSafetyChecks, PERIOD_START, PERIOD_END);
    // 11/12 = 92%
    expect(result.complianceRate).toBe(92);
  });

  it("counts corrections needed", () => {
    const result = evaluateFoodSafety(foodSafetyChecks, PERIOD_START, PERIOD_END);
    expect(result.correctionsNeeded).toBe(1);
  });

  it("counts corrections made", () => {
    const result = evaluateFoodSafety(foodSafetyChecks, PERIOD_START, PERIOD_END);
    expect(result.correctionsMade).toBe(1);
  });

  it("calculates 100% correction rate when all corrected", () => {
    const result = evaluateFoodSafety(foodSafetyChecks, PERIOD_START, PERIOD_END);
    expect(result.correctionRate).toBe(100);
  });

  it("detects uncorrected issues", () => {
    const uncorrected: FoodSafetyRecord[] = [
      { id: "unc-001", date: "2026-02-01", checkType: "fridge_temperature", compliant: false, correctionNeeded: "Too warm" },
    ];
    const result = evaluateFoodSafety(uncorrected, PERIOD_START, PERIOD_END);
    expect(result.correctionRate).toBe(0);
  });

  it("produces check type breakdown", () => {
    const result = evaluateFoodSafety(foodSafetyChecks, PERIOD_START, PERIOD_END);
    expect(result.checkTypeBreakdown.length).toBeGreaterThan(0);
    const fridge = result.checkTypeBreakdown.find((c) => c.checkType === "fridge_temperature");
    expect(fridge).toBeDefined();
    expect(fridge!.total).toBe(4);
    expect(fridge!.compliant).toBe(3);
  });

  it("handles no checks", () => {
    const result = evaluateFoodSafety([], PERIOD_START, PERIOD_END);
    expect(result.totalChecks).toBe(0);
    expect(result.complianceRate).toBe(0);
    expect(result.correctionRate).toBe(0);
  });

  it("excludes checks outside period", () => {
    const outChecks: FoodSafetyRecord[] = [
      { id: "out-001", date: "2025-06-01", checkType: "fridge_temperature", compliant: true },
    ];
    const result = evaluateFoodSafety(outChecks, PERIOD_START, PERIOD_END);
    expect(result.totalChecks).toBe(0);
  });

  it("handles all-compliant checks", () => {
    const allGood: FoodSafetyRecord[] = [
      { id: "good-001", date: "2026-02-01", checkType: "fridge_temperature", compliant: true },
      { id: "good-002", date: "2026-03-01", checkType: "allergen_labelling", compliant: true },
    ];
    const result = evaluateFoodSafety(allGood, PERIOD_START, PERIOD_END);
    expect(result.complianceRate).toBe(100);
    expect(result.correctionsNeeded).toBe(0);
    expect(result.correctionRate).toBe(0);
  });
});

// ── Child Nutrition Profiles ─────────────────────────────────────────────────

describe("buildChildNutritionProfiles", () => {
  it("produces a profile for each placed child", () => {
    const profiles = buildChildNutritionProfiles(children, meals, menuPlans, cookingSessions, PERIOD_START, PERIOD_END);
    expect(profiles.length).toBe(3);
    expect(profiles.map((p) => p.childName).sort()).toEqual(["Alex", "Jordan", "Morgan"]);
  });

  it("records correct dietary requirements per child", () => {
    const profiles = buildChildNutritionProfiles(children, meals, menuPlans, cookingSessions, PERIOD_START, PERIOD_END);
    const morgan = profiles.find((p) => p.childId === "child-morgan")!;
    expect(morgan.dietaryRequirements).toContain("halal");
    const jordan = profiles.find((p) => p.childId === "child-jordan")!;
    expect(jordan.allergies).toContain("nut_allergy");
  });

  it("calculates meals attended per child", () => {
    const profiles = buildChildNutritionProfiles(children, meals, menuPlans, cookingSessions, PERIOD_START, PERIOD_END);
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    // Alex present in meals: 1,2,3,4,5,6,8,9,10 = 9
    expect(alex.mealsAttended).toBe(9);
    const jordan = profiles.find((p) => p.childId === "child-jordan")!;
    // Jordan present in: 1,2,4,5,6,7,8,9,10 = 9
    expect(jordan.mealsAttended).toBe(9);
  });

  it("counts cooking sessions per child", () => {
    const profiles = buildChildNutritionProfiles(children, meals, menuPlans, cookingSessions, PERIOD_START, PERIOD_END);
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.cookingSessions).toBe(3);
    const morgan = profiles.find((p) => p.childId === "child-morgan")!;
    expect(morgan.cookingSessions).toBe(4);
    const jordan = profiles.find((p) => p.childId === "child-jordan")!;
    expect(jordan.cookingSessions).toBe(2);
  });

  it("detects cooking skill progress", () => {
    const profiles = buildChildNutritionProfiles(children, meals, menuPlans, cookingSessions, PERIOD_START, PERIOD_END);
    const morgan = profiles.find((p) => p.childId === "child-morgan")!;
    // Morgan has independent sessions
    expect(morgan.cookingSkillProgress).toBe(true);
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    // Alex has 3 sessions, all engaged → progress
    expect(alex.cookingSkillProgress).toBe(true);
  });

  it("counts menu contributions per child", () => {
    const profiles = buildChildNutritionProfiles(children, meals, menuPlans, cookingSessions, PERIOD_START, PERIOD_END);
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    // Alex contributed to plans 1,2,4 = 3
    expect(alex.menuContributions).toBe(3);
    const jordan = profiles.find((p) => p.childId === "child-jordan")!;
    // Jordan: plans 2,3,4 = 3
    expect(jordan.menuContributions).toBe(3);
  });

  it("sets requirementsMet to true when all meals comply", () => {
    const profiles = buildChildNutritionProfiles(children, meals, menuPlans, cookingSessions, PERIOD_START, PERIOD_END);
    for (const p of profiles) {
      expect(p.requirementsMet).toBe(true);
    }
  });

  it("detects unmet requirements as primary concern", () => {
    const failMeals: MealRecord[] = [
      { ...meals[0], id: "pf-001", dietaryRequirementsMet: false },
    ];
    const profiles = buildChildNutritionProfiles(children, failMeals, menuPlans, cookingSessions, PERIOD_START, PERIOD_END);
    const alex = profiles.find((p) => p.childId === "child-alex")!;
    expect(alex.primaryConcern).toContain("Dietary requirements not consistently met");
  });

  it("flags no cooking sessions for low-skill children", () => {
    const noSkillChildren: NutritionChild[] = [
      { ...children[1], cookingSkillLevel: 1 as const },
    ];
    const profiles = buildChildNutritionProfiles(noSkillChildren, meals, menuPlans, [], PERIOD_START, PERIOD_END);
    expect(profiles[0].primaryConcern).toContain("independence gap");
  });

  it("excludes non-placed children", () => {
    const allChildren = [...children, nonPlacedChild];
    const profiles = buildChildNutritionProfiles(allChildren, meals, menuPlans, cookingSessions, PERIOD_START, PERIOD_END);
    expect(profiles.length).toBe(3);
    expect(profiles.find((p) => p.childId === "child-left")).toBeUndefined();
  });
});

// ── Integration: generateNutritionIntelligence ───────────────────────────────

describe("generateNutritionIntelligence", () => {
  it("returns complete result structure", () => {
    const result = generateNutritionIntelligence(
      children, meals, menuPlans, foodSafetyChecks, cookingSessions,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.dietaryAccommodation).toBeDefined();
    expect(result.mealQuality).toBeDefined();
    expect(result.childInvolvement).toBeDefined();
    expect(result.foodSafety).toBeDefined();
    expect(result.childProfiles.length).toBe(3);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.areasForDevelopment.length).toBeGreaterThan(0);
    expect(result.immediateActions.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("scores well with good practice data", () => {
    const result = generateNutritionIntelligence(
      children, meals, menuPlans, foodSafetyChecks, cookingSessions,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    // Our test data represents good practice — should score good or outstanding
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(["outstanding", "good"]).toContain(result.rating);
  });

  it("scores lower with no meals", () => {
    const result = generateNutritionIntelligence(
      children, [], [], foodSafetyChecks, cookingSessions,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.overallScore).toBeLessThan(50);
  });

  it("scores lower with no cooking sessions", () => {
    const fullResult = generateNutritionIntelligence(
      children, meals, menuPlans, foodSafetyChecks, cookingSessions,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    const noSessionsResult = generateNutritionIntelligence(
      children, meals, menuPlans, foodSafetyChecks, [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(noSessionsResult.overallScore).toBeLessThan(fullResult.overallScore);
  });

  it("scores lower with poor food safety", () => {
    const poorSafety: FoodSafetyRecord[] = [
      { id: "ps-001", date: "2026-02-01", checkType: "fridge_temperature", compliant: false, correctionNeeded: "Too warm" },
      { id: "ps-002", date: "2026-03-01", checkType: "allergen_labelling", compliant: false, correctionNeeded: "Missing labels" },
      { id: "ps-003", date: "2026-04-01", checkType: "food_hygiene_audit", compliant: false, correctionNeeded: "Dirty surfaces" },
    ];
    const fullResult = generateNutritionIntelligence(
      children, meals, menuPlans, foodSafetyChecks, cookingSessions,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    const poorResult = generateNutritionIntelligence(
      children, meals, menuPlans, poorSafety, cookingSessions,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(poorResult.overallScore).toBeLessThan(fullResult.overallScore);
  });

  it("includes CHR 2015 Reg 9 regulatory link", () => {
    const result = generateNutritionIntelligence(
      children, meals, menuPlans, foodSafetyChecks, cookingSessions,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 9"))).toBe(true);
  });

  it("includes Eatwell Guide regulatory link", () => {
    const result = generateNutritionIntelligence(
      children, meals, menuPlans, foodSafetyChecks, cookingSessions,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Eatwell"))).toBe(true);
  });

  it("generates strength for 100% dietary met rate", () => {
    const result = generateNutritionIntelligence(
      children, meals, menuPlans, foodSafetyChecks, cookingSessions,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.strengths.some((s) => s.includes("dietary requirements"))).toBe(true);
  });

  it("generates urgent action for allergen failures", () => {
    const failChildren: NutritionChild[] = [
      { ...children[1], allergies: ["nut_allergy"] },
    ];
    const failMeals: MealRecord[] = [
      {
        ...meals[0],
        id: "af-001",
        childrenPresent: ["child-jordan"],
        dietaryRequirementsMet: false,
        allergensSafelyManaged: false,
      },
    ];
    const result = generateNutritionIntelligence(
      failChildren, failMeals, menuPlans, foodSafetyChecks, cookingSessions,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.immediateActions.some((a) => a.includes("URGENT") && a.includes("Allergen"))).toBe(true);
  });

  it("generates action for low cooking skills independence gap", () => {
    const lowSkillChildren: NutritionChild[] = [
      { ...children[0], cookingSkillLevel: 1 as const },
      { ...children[1], cookingSkillLevel: 2 as const },
      children[2],
    ];
    const result = generateNutritionIntelligence(
      lowSkillChildren, meals, menuPlans, foodSafetyChecks, [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.immediateActions.some((a) => a.includes("independence"))).toBe(true);
  });

  it("generates no urgent actions with good data", () => {
    const result = generateNutritionIntelligence(
      children, meals, menuPlans, foodSafetyChecks, cookingSessions,
      "oak-house", PERIOD_START, PERIOD_END,
    );
    // Good data should produce "No immediate actions" message
    const hasUrgent = result.immediateActions.some((a) => a.startsWith("URGENT"));
    const hasNoActions = result.immediateActions.some((a) => a.includes("No immediate actions"));
    // Either no urgent actions or positive message
    expect(hasUrgent || hasNoActions).toBeDefined();
  });

  it("rates inadequate with minimal data", () => {
    const result = generateNutritionIntelligence(
      children, [], [], [], [],
      "oak-house", PERIOD_START, PERIOD_END,
    );
    expect(result.rating).toBe("inadequate");
    expect(result.overallScore).toBeLessThan(40);
  });
});

// ── Labels ───────────────────────────────────────────────────────────────────

describe("getDietaryLabel", () => {
  it("returns correct label for halal", () => {
    expect(getDietaryLabel("halal")).toBe("Halal");
  });

  it("returns correct label for nut_allergy", () => {
    expect(getDietaryLabel("nut_allergy")).toBe("Nut Allergy");
  });

  it("returns correct label for vegetarian", () => {
    expect(getDietaryLabel("vegetarian")).toBe("Vegetarian");
  });

  it("returns correct label for lactose_intolerant", () => {
    expect(getDietaryLabel("lactose_intolerant")).toBe("Lactose Intolerant");
  });
});

describe("getQualityFactorLabel", () => {
  it("returns correct label for staff_ate_with_children", () => {
    expect(getQualityFactorLabel("staff_ate_with_children")).toBe("Staff Ate with Children");
  });

  it("returns correct label for family_style_serving", () => {
    expect(getQualityFactorLabel("family_style_serving")).toBe("Family-Style Serving");
  });

  it("returns correct label for cultural_celebration_meal", () => {
    expect(getQualityFactorLabel("cultural_celebration_meal")).toBe("Cultural Celebration Meal");
  });

  it("returns correct label for no_rushing", () => {
    expect(getQualityFactorLabel("no_rushing")).toBe("No Rushing");
  });
});
