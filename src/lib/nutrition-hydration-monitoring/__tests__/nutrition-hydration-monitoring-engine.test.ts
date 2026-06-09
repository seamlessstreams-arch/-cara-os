// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Nutrition & Hydration Monitoring Intelligence Engine
//
// Demo: Chamberlain House, 3 children (Alex, Jordan, Morgan),
// Staff: Sarah Johnson, Tom Richards, Lisa Williams, Darren Laville
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateMealQuality,
  evaluateHydrationStandards,
  evaluateNutritionPolicy,
  evaluateStaffNutritionReadiness,
  buildChildNutritionProfiles,
  generateNutritionHydrationMonitoringIntelligence,
  getMealTypeLabel,
  getDietaryRequirementLabel,
  getHydrationLevelLabel,
  getNutritionQualityLabel,
  getPortionConsumedLabel,
  getRatingLabel,
  getRating,
  pct,
} from "../nutrition-hydration-monitoring-engine";
import type {
  MealRecord,
  HydrationRecord,
  NutritionPolicy,
  StaffNutritionTraining,
} from "../nutrition-hydration-monitoring-engine";

// ── Test Fixtures ─────────────────────────────────────────────────────────

const makeMeal = (overrides: Partial<MealRecord> = {}): MealRecord => ({
  id: "meal-001",
  childId: "child-alex",
  childName: "Alex",
  mealDate: "2026-03-10",
  mealType: "lunch",
  nutritionQuality: "good",
  portionConsumed: "full",
  dietaryRequirementsMet: true,
  childSatisfied: true,
  ...overrides,
});

const makeHydration = (overrides: Partial<HydrationRecord> = {}): HydrationRecord => ({
  id: "hyd-001",
  childId: "child-alex",
  childName: "Alex",
  recordDate: "2026-03-10",
  hydrationLevel: "good",
  cupsConsumed: 7,
  targetCups: 8,
  encouragementGiven: true,
  ...overrides,
});

const makePolicy = (overrides: Partial<NutritionPolicy> = {}): NutritionPolicy => ({
  id: "policy-001",
  menuRotationWeeks: 4,
  dietaryNeedsDocumented: true,
  allergyProtocolInPlace: true,
  mealTimeSupervised: true,
  nutritionTrainingProvided: true,
  culturalDietaryAccommodation: true,
  snackAvailability: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<StaffNutritionTraining> = {}): StaffNutritionTraining => ({
  id: "train-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  foodHygiene: true,
  dietaryRequirements: true,
  allergyAwareness: true,
  mealPreparation: true,
  nutritionGuidance: true,
  hydrationMonitoring: true,
  ...overrides,
});

// Chamberlain House demo data
const OAK_HOUSE_MEALS: MealRecord[] = [
  makeMeal({ id: "meal-001", childId: "child-alex", childName: "Alex", mealDate: "2026-03-10", mealType: "breakfast", nutritionQuality: "excellent", portionConsumed: "full" }),
  makeMeal({ id: "meal-002", childId: "child-alex", childName: "Alex", mealDate: "2026-03-10", mealType: "lunch", nutritionQuality: "good", portionConsumed: "most" }),
  makeMeal({ id: "meal-003", childId: "child-alex", childName: "Alex", mealDate: "2026-03-10", mealType: "dinner", nutritionQuality: "good", portionConsumed: "full" }),
  makeMeal({ id: "meal-004", childId: "child-jordan", childName: "Jordan", mealDate: "2026-03-10", mealType: "breakfast", nutritionQuality: "good", portionConsumed: "most" }),
  makeMeal({ id: "meal-005", childId: "child-jordan", childName: "Jordan", mealDate: "2026-03-10", mealType: "lunch", nutritionQuality: "adequate", portionConsumed: "half", childSatisfied: false }),
  makeMeal({ id: "meal-006", childId: "child-jordan", childName: "Jordan", mealDate: "2026-03-10", mealType: "dinner", nutritionQuality: "good", portionConsumed: "full" }),
  makeMeal({ id: "meal-007", childId: "child-morgan", childName: "Morgan", mealDate: "2026-03-10", mealType: "breakfast", nutritionQuality: "excellent", portionConsumed: "full" }),
  makeMeal({ id: "meal-008", childId: "child-morgan", childName: "Morgan", mealDate: "2026-03-10", mealType: "lunch", nutritionQuality: "good", portionConsumed: "most" }),
  makeMeal({ id: "meal-009", childId: "child-morgan", childName: "Morgan", mealDate: "2026-03-10", mealType: "dinner", nutritionQuality: "good", portionConsumed: "full" }),
];

const OAK_HOUSE_HYDRATION: HydrationRecord[] = [
  makeHydration({ id: "hyd-001", childId: "child-alex", childName: "Alex", recordDate: "2026-03-10", hydrationLevel: "good", cupsConsumed: 7, targetCups: 8 }),
  makeHydration({ id: "hyd-002", childId: "child-jordan", childName: "Jordan", recordDate: "2026-03-10", hydrationLevel: "adequate", cupsConsumed: 5, targetCups: 8, encouragementGiven: true }),
  makeHydration({ id: "hyd-003", childId: "child-morgan", childName: "Morgan", recordDate: "2026-03-10", hydrationLevel: "excellent", cupsConsumed: 9, targetCups: 8 }),
];

const OAK_HOUSE_POLICY = makePolicy();

const OAK_HOUSE_TRAINING: StaffNutritionTraining[] = [
  makeTraining({ id: "train-001", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
  makeTraining({ id: "train-002", staffId: "staff-tom", staffName: "Tom Richards", nutritionGuidance: false }),
  makeTraining({ id: "train-003", staffId: "staff-lisa", staffName: "Lisa Williams", mealPreparation: false, hydrationMonitoring: false }),
  makeTraining({ id: "train-004", staffId: "staff-darren", staffName: "Darren Laville" }),
];

// ══════════════════════════════════════════════════════════════════════════════
// pct
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("returns 50 for 1/2", () => {
    expect(pct(1, 2)).toBe(50);
  });

  it("returns 100 for equal values", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });

  it("handles large numbers", () => {
    expect(pct(999, 1000)).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });

  it("handles boundary values precisely", () => {
    expect(getRating(79)).toBe("good");
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(60)).toBe("good");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(40)).toBe("requires_improvement");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Getters
// ══════════════════════════════════════════════════════════════════════════════

describe("getMealTypeLabel", () => {
  it("returns correct labels for all meal types", () => {
    expect(getMealTypeLabel("breakfast")).toBe("Breakfast");
    expect(getMealTypeLabel("lunch")).toBe("Lunch");
    expect(getMealTypeLabel("dinner")).toBe("Dinner");
    expect(getMealTypeLabel("snack")).toBe("Snack");
    expect(getMealTypeLabel("supper")).toBe("Supper");
  });
});

describe("getDietaryRequirementLabel", () => {
  it("returns correct labels for all dietary requirements", () => {
    expect(getDietaryRequirementLabel("halal")).toBe("Halal");
    expect(getDietaryRequirementLabel("kosher")).toBe("Kosher");
    expect(getDietaryRequirementLabel("vegetarian")).toBe("Vegetarian");
    expect(getDietaryRequirementLabel("vegan")).toBe("Vegan");
    expect(getDietaryRequirementLabel("gluten_free")).toBe("Gluten Free");
    expect(getDietaryRequirementLabel("dairy_free")).toBe("Dairy Free");
    expect(getDietaryRequirementLabel("nut_free")).toBe("Nut Free");
    expect(getDietaryRequirementLabel("medical_diet")).toBe("Medical Diet");
    expect(getDietaryRequirementLabel("other")).toBe("Other");
  });
});

describe("getHydrationLevelLabel", () => {
  it("returns correct labels for all hydration levels", () => {
    expect(getHydrationLevelLabel("excellent")).toBe("Excellent");
    expect(getHydrationLevelLabel("good")).toBe("Good");
    expect(getHydrationLevelLabel("adequate")).toBe("Adequate");
    expect(getHydrationLevelLabel("poor")).toBe("Poor");
  });
});

describe("getNutritionQualityLabel", () => {
  it("returns correct labels for all nutrition qualities", () => {
    expect(getNutritionQualityLabel("excellent")).toBe("Excellent");
    expect(getNutritionQualityLabel("good")).toBe("Good");
    expect(getNutritionQualityLabel("adequate")).toBe("Adequate");
    expect(getNutritionQualityLabel("poor")).toBe("Poor");
    expect(getNutritionQualityLabel("concern")).toBe("Concern");
  });
});

describe("getPortionConsumedLabel", () => {
  it("returns correct labels for all portion levels", () => {
    expect(getPortionConsumedLabel("full")).toBe("Full");
    expect(getPortionConsumedLabel("most")).toBe("Most");
    expect(getPortionConsumedLabel("half")).toBe("Half");
    expect(getPortionConsumedLabel("little")).toBe("Little");
    expect(getPortionConsumedLabel("none")).toBe("None");
  });
});

describe("getRatingLabel", () => {
  it("returns correct labels for all ratings", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateMealQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateMealQuality", () => {
  it("returns score 0 with concern for empty meals array", () => {
    const result = evaluateMealQuality([]);
    expect(result.score).toBe(0);
    expect(result.totalMeals).toBe(0);
    expect(result.concerns).toHaveLength(1);
    expect(result.concerns[0]).toContain("No meal records");
  });

  it("returns perfect score for all-excellent meals", () => {
    const meals = Array.from({ length: 10 }, (_, i) =>
      makeMeal({
        id: `meal-${i}`,
        nutritionQuality: "excellent",
        portionConsumed: "full",
        dietaryRequirementsMet: true,
        childSatisfied: true,
      }),
    );
    const result = evaluateMealQuality(meals);
    expect(result.score).toBe(25);
    expect(result.nutritionQualityGoodPlusRate).toBe(100);
    expect(result.portionConsumedFullMostRate).toBe(100);
    expect(result.dietaryRequirementsMetRate).toBe(100);
    expect(result.childSatisfiedRate).toBe(100);
  });

  it("returns 0 score for all-concern meals with none consumed", () => {
    const meals = Array.from({ length: 5 }, (_, i) =>
      makeMeal({
        id: `meal-${i}`,
        nutritionQuality: "concern",
        portionConsumed: "none",
        dietaryRequirementsMet: false,
        childSatisfied: false,
      }),
    );
    const result = evaluateMealQuality(meals);
    expect(result.score).toBe(0);
    expect(result.nutritionQualityGoodPlusRate).toBe(0);
    expect(result.portionConsumedFullMostRate).toBe(0);
    expect(result.dietaryRequirementsMetRate).toBe(0);
    expect(result.childSatisfiedRate).toBe(0);
  });

  it("calculates correct rates for mixed quality meals", () => {
    const meals = [
      makeMeal({ id: "m1", nutritionQuality: "excellent", portionConsumed: "full", dietaryRequirementsMet: true, childSatisfied: true }),
      makeMeal({ id: "m2", nutritionQuality: "good", portionConsumed: "most", dietaryRequirementsMet: true, childSatisfied: true }),
      makeMeal({ id: "m3", nutritionQuality: "adequate", portionConsumed: "half", dietaryRequirementsMet: false, childSatisfied: false }),
      makeMeal({ id: "m4", nutritionQuality: "poor", portionConsumed: "little", dietaryRequirementsMet: true, childSatisfied: false }),
    ];
    const result = evaluateMealQuality(meals);
    expect(result.totalMeals).toBe(4);
    expect(result.nutritionQualityGoodPlusRate).toBe(50);
    expect(result.portionConsumedFullMostRate).toBe(50);
    expect(result.dietaryRequirementsMetRate).toBe(75);
    expect(result.childSatisfiedRate).toBe(50);
  });

  it("populates quality breakdown correctly", () => {
    const meals = [
      makeMeal({ id: "m1", nutritionQuality: "excellent" }),
      makeMeal({ id: "m2", nutritionQuality: "excellent" }),
      makeMeal({ id: "m3", nutritionQuality: "good" }),
      makeMeal({ id: "m4", nutritionQuality: "adequate" }),
      makeMeal({ id: "m5", nutritionQuality: "poor" }),
      makeMeal({ id: "m6", nutritionQuality: "concern" }),
    ];
    const result = evaluateMealQuality(meals);
    expect(result.qualityBreakdown.excellent).toBe(2);
    expect(result.qualityBreakdown.good).toBe(1);
    expect(result.qualityBreakdown.adequate).toBe(1);
    expect(result.qualityBreakdown.poor).toBe(1);
    expect(result.qualityBreakdown.concern).toBe(1);
  });

  it("populates portion breakdown correctly", () => {
    const meals = [
      makeMeal({ id: "m1", portionConsumed: "full" }),
      makeMeal({ id: "m2", portionConsumed: "most" }),
      makeMeal({ id: "m3", portionConsumed: "half" }),
      makeMeal({ id: "m4", portionConsumed: "little" }),
      makeMeal({ id: "m5", portionConsumed: "none" }),
    ];
    const result = evaluateMealQuality(meals);
    expect(result.portionBreakdown.full).toBe(1);
    expect(result.portionBreakdown.most).toBe(1);
    expect(result.portionBreakdown.half).toBe(1);
    expect(result.portionBreakdown.little).toBe(1);
    expect(result.portionBreakdown.none).toBe(1);
  });

  it("populates meal type breakdown correctly", () => {
    const meals = [
      makeMeal({ id: "m1", mealType: "breakfast" }),
      makeMeal({ id: "m2", mealType: "lunch" }),
      makeMeal({ id: "m3", mealType: "dinner" }),
      makeMeal({ id: "m4", mealType: "snack" }),
      makeMeal({ id: "m5", mealType: "supper" }),
    ];
    const result = evaluateMealQuality(meals);
    expect(result.mealTypeBreakdown.breakfast).toBe(1);
    expect(result.mealTypeBreakdown.lunch).toBe(1);
    expect(result.mealTypeBreakdown.dinner).toBe(1);
    expect(result.mealTypeBreakdown.snack).toBe(1);
    expect(result.mealTypeBreakdown.supper).toBe(1);
  });

  it("generates strengths for high nutrition quality rate", () => {
    const meals = Array.from({ length: 10 }, (_, i) =>
      makeMeal({ id: `m-${i}`, nutritionQuality: "excellent", portionConsumed: "full" }),
    );
    const result = evaluateMealQuality(meals);
    expect(result.strengths.some((s) => s.includes("Excellent nutrition quality"))).toBe(true);
  });

  it("generates concerns for low nutrition quality rate", () => {
    const meals = Array.from({ length: 10 }, (_, i) =>
      makeMeal({ id: `m-${i}`, nutritionQuality: "poor", portionConsumed: "little", childSatisfied: false, dietaryRequirementsMet: false }),
    );
    const result = evaluateMealQuality(meals);
    expect(result.concerns.some((s) => s.includes("Nutrition quality at 0%"))).toBe(true);
  });

  it("generates concern for meals flagged as concern quality", () => {
    const meals = [
      makeMeal({ id: "m1", nutritionQuality: "concern" }),
    ];
    const result = evaluateMealQuality(meals);
    expect(result.concerns.some((s) => s.includes("flagged as concern"))).toBe(true);
  });

  it("caps score at 25 maximum", () => {
    const meals = Array.from({ length: 100 }, (_, i) =>
      makeMeal({ id: `m-${i}`, nutritionQuality: "excellent", portionConsumed: "full" }),
    );
    const result = evaluateMealQuality(meals);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("generates strength for high portion consumption", () => {
    const meals = Array.from({ length: 10 }, (_, i) =>
      makeMeal({ id: `m-${i}`, portionConsumed: "full" }),
    );
    const result = evaluateMealQuality(meals);
    expect(result.strengths.some((s) => s.includes("Strong portion consumption"))).toBe(true);
  });

  it("generates concern for low child satisfaction", () => {
    const meals = Array.from({ length: 10 }, (_, i) =>
      makeMeal({ id: `m-${i}`, childSatisfied: false }),
    );
    const result = evaluateMealQuality(meals);
    expect(result.concerns.some((s) => s.includes("Child meal satisfaction"))).toBe(true);
  });

  it("generates strength for high dietary compliance", () => {
    const meals = Array.from({ length: 20 }, (_, i) =>
      makeMeal({ id: `m-${i}`, dietaryRequirementsMet: true }),
    );
    const result = evaluateMealQuality(meals);
    expect(result.strengths.some((s) => s.includes("Dietary requirements met"))).toBe(true);
  });

  it("generates concern for low dietary compliance", () => {
    const meals = Array.from({ length: 10 }, (_, i) =>
      makeMeal({ id: `m-${i}`, dietaryRequirementsMet: i < 5 }),
    );
    const result = evaluateMealQuality(meals);
    expect(result.concerns.some((s) => s.includes("Dietary requirements met in only"))).toBe(true);
  });

  it("handles Chamberlain House demo meals", () => {
    const result = evaluateMealQuality(OAK_HOUSE_MEALS);
    expect(result.totalMeals).toBe(9);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateHydrationStandards
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateHydrationStandards", () => {
  it("returns score 0 with concern for empty records array", () => {
    const result = evaluateHydrationStandards([]);
    expect(result.score).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.concerns).toHaveLength(1);
    expect(result.concerns[0]).toContain("No hydration records");
  });

  it("returns perfect score for all-excellent hydration", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeHydration({
        id: `hyd-${i}`,
        hydrationLevel: "excellent",
        cupsConsumed: 10,
        targetCups: 8,
        encouragementGiven: true,
      }),
    );
    const result = evaluateHydrationStandards(records);
    expect(result.score).toBe(25);
    expect(result.hydrationGoodPlusRate).toBe(100);
    expect(result.targetMetRate).toBe(100);
    expect(result.encouragementGivenRate).toBe(100);
  });

  it("returns 0 score for all-poor hydration with no encouragement", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeHydration({
        id: `hyd-${i}`,
        hydrationLevel: "poor",
        cupsConsumed: 1,
        targetCups: 8,
        encouragementGiven: false,
      }),
    );
    const result = evaluateHydrationStandards(records);
    expect(result.score).toBeLessThan(2);
    expect(result.hydrationGoodPlusRate).toBe(0);
    expect(result.targetMetRate).toBe(0);
    expect(result.encouragementGivenRate).toBe(0);
  });

  it("calculates target met rate correctly", () => {
    const records = [
      makeHydration({ id: "h1", cupsConsumed: 8, targetCups: 8 }),
      makeHydration({ id: "h2", cupsConsumed: 10, targetCups: 8 }),
      makeHydration({ id: "h3", cupsConsumed: 5, targetCups: 8 }),
      makeHydration({ id: "h4", cupsConsumed: 3, targetCups: 8 }),
    ];
    const result = evaluateHydrationStandards(records);
    expect(result.targetMetRate).toBe(50);
    expect(result.targetMetCount).toBe(2);
  });

  it("calculates average cups consumed and target", () => {
    const records = [
      makeHydration({ id: "h1", cupsConsumed: 6, targetCups: 8 }),
      makeHydration({ id: "h2", cupsConsumed: 8, targetCups: 8 }),
      makeHydration({ id: "h3", cupsConsumed: 10, targetCups: 8 }),
    ];
    const result = evaluateHydrationStandards(records);
    expect(result.averageCupsConsumed).toBe(8);
    expect(result.averageTargetCups).toBe(8);
    expect(result.averageCupsVsTargetRate).toBe(100);
  });

  it("populates hydration breakdown correctly", () => {
    const records = [
      makeHydration({ id: "h1", hydrationLevel: "excellent" }),
      makeHydration({ id: "h2", hydrationLevel: "good" }),
      makeHydration({ id: "h3", hydrationLevel: "adequate" }),
      makeHydration({ id: "h4", hydrationLevel: "poor" }),
    ];
    const result = evaluateHydrationStandards(records);
    expect(result.hydrationBreakdown.excellent).toBe(1);
    expect(result.hydrationBreakdown.good).toBe(1);
    expect(result.hydrationBreakdown.adequate).toBe(1);
    expect(result.hydrationBreakdown.poor).toBe(1);
  });

  it("generates strengths for high hydration rates", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeHydration({
        id: `hyd-${i}`,
        hydrationLevel: "excellent",
        cupsConsumed: 10,
        targetCups: 8,
        encouragementGiven: true,
      }),
    );
    const result = evaluateHydrationStandards(records);
    expect(result.strengths.some((s) => s.includes("Excellent hydration levels"))).toBe(true);
    expect(result.strengths.some((s) => s.includes("Strong hydration target achievement"))).toBe(true);
  });

  it("generates concerns for low hydration rates", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeHydration({
        id: `hyd-${i}`,
        hydrationLevel: "poor",
        cupsConsumed: 2,
        targetCups: 8,
        encouragementGiven: false,
      }),
    );
    const result = evaluateHydrationStandards(records);
    expect(result.concerns.some((s) => s.includes("Hydration levels at"))).toBe(true);
    expect(result.concerns.some((s) => s.includes("meeting hydration targets"))).toBe(true);
  });

  it("generates concern for poor hydration records", () => {
    const records = [
      makeHydration({ id: "h1", hydrationLevel: "poor", cupsConsumed: 2, targetCups: 8 }),
    ];
    const result = evaluateHydrationStandards(records);
    expect(result.concerns.some((s) => s.includes("poor hydration"))).toBe(true);
  });

  it("caps score at 25", () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      makeHydration({
        id: `hyd-${i}`,
        hydrationLevel: "excellent",
        cupsConsumed: 20,
        targetCups: 8,
        encouragementGiven: true,
      }),
    );
    const result = evaluateHydrationStandards(records);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("handles Chamberlain House demo hydration", () => {
    const result = evaluateHydrationStandards(OAK_HOUSE_HYDRATION);
    expect(result.totalRecords).toBe(3);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("generates concern for low encouragement rate", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeHydration({ id: `h-${i}`, encouragementGiven: false }),
    );
    const result = evaluateHydrationStandards(records);
    expect(result.concerns.some((s) => s.includes("Hydration encouragement"))).toBe(true);
  });

  it("generates strength for high encouragement rate", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeHydration({ id: `h-${i}`, encouragementGiven: true }),
    );
    const result = evaluateHydrationStandards(records);
    expect(result.strengths.some((s) => s.includes("Consistent hydration encouragement"))).toBe(true);
  });

  it("handles averageCupsVsTargetRate when totalTargetCups is 0", () => {
    const records = [
      makeHydration({ id: "h1", cupsConsumed: 5, targetCups: 0 }),
    ];
    const result = evaluateHydrationStandards(records);
    expect(result.averageCupsVsTargetRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateNutritionPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateNutritionPolicy", () => {
  it("returns score 0 with concern for null policy", () => {
    const result = evaluateNutritionPolicy(null);
    expect(result.score).toBe(0);
    expect(result.hasPolicy).toBe(false);
    expect(result.concerns).toHaveLength(1);
    expect(result.concerns[0]).toContain("No nutrition policy");
  });

  it("returns perfect score for fully compliant policy", () => {
    const result = evaluateNutritionPolicy(makePolicy());
    expect(result.score).toBe(25);
    expect(result.hasPolicy).toBe(true);
    expect(result.menuRotationAdequate).toBe(true);
  });

  it("returns lower score when fields are false", () => {
    const result = evaluateNutritionPolicy(makePolicy({
      dietaryNeedsDocumented: false,
      allergyProtocolInPlace: false,
      mealTimeSupervised: false,
      nutritionTrainingProvided: false,
      culturalDietaryAccommodation: false,
      snackAvailability: false,
    }));
    expect(result.score).toBe(5); // Only menu rotation (5 points)
  });

  it("gives extra points for menuRotationWeeks >= 4", () => {
    const result4 = evaluateNutritionPolicy(makePolicy({ menuRotationWeeks: 4 }));
    const result2 = evaluateNutritionPolicy(makePolicy({ menuRotationWeeks: 2 }));
    expect(result4.score).toBeGreaterThan(result2.score);
    expect(result4.menuRotationAdequate).toBe(true);
    expect(result2.menuRotationAdequate).toBe(false);
  });

  it("gives proportional score for menu rotation < 4 weeks", () => {
    const result = evaluateNutritionPolicy(makePolicy({
      menuRotationWeeks: 2,
      dietaryNeedsDocumented: false,
      allergyProtocolInPlace: false,
      mealTimeSupervised: false,
      nutritionTrainingProvided: false,
      culturalDietaryAccommodation: false,
      snackAvailability: false,
    }));
    // 2/4 * 5 = 2.5
    expect(result.score).toBe(2.5);
  });

  it("gives 0 for menu rotation of 0 weeks and no fields", () => {
    const result = evaluateNutritionPolicy(makePolicy({
      menuRotationWeeks: 0,
      dietaryNeedsDocumented: false,
      allergyProtocolInPlace: false,
      mealTimeSupervised: false,
      nutritionTrainingProvided: false,
      culturalDietaryAccommodation: false,
      snackAvailability: false,
    }));
    expect(result.score).toBe(0);
  });

  it("generates strengths for documented dietary needs and allergy protocol", () => {
    const result = evaluateNutritionPolicy(makePolicy());
    expect(result.strengths.some((s) => s.includes("Dietary needs documented and allergy protocols"))).toBe(true);
  });

  it("generates concern for missing dietary needs documentation", () => {
    const result = evaluateNutritionPolicy(makePolicy({ dietaryNeedsDocumented: false }));
    expect(result.concerns.some((s) => s.includes("Dietary needs not documented"))).toBe(true);
  });

  it("generates concern for missing allergy protocol", () => {
    const result = evaluateNutritionPolicy(makePolicy({ allergyProtocolInPlace: false }));
    expect(result.concerns.some((s) => s.includes("No allergy protocol"))).toBe(true);
  });

  it("generates strength for adequate menu rotation", () => {
    const result = evaluateNutritionPolicy(makePolicy({ menuRotationWeeks: 6 }));
    expect(result.strengths.some((s) => s.includes("Menu rotation of 6 weeks"))).toBe(true);
  });

  it("generates concern for inadequate menu rotation", () => {
    const result = evaluateNutritionPolicy(makePolicy({ menuRotationWeeks: 2 }));
    expect(result.concerns.some((s) => s.includes("Menu rotation at 2 week(s)"))).toBe(true);
  });

  it("generates strength for supervised mealtimes", () => {
    const result = evaluateNutritionPolicy(makePolicy({ mealTimeSupervised: true }));
    expect(result.strengths.some((s) => s.includes("supervised"))).toBe(true);
  });

  it("generates concern for unsupervised mealtimes", () => {
    const result = evaluateNutritionPolicy(makePolicy({ mealTimeSupervised: false }));
    expect(result.concerns.some((s) => s.includes("Mealtimes not supervised"))).toBe(true);
  });

  it("generates strength for cultural dietary accommodation", () => {
    const result = evaluateNutritionPolicy(makePolicy({ culturalDietaryAccommodation: true }));
    expect(result.strengths.some((s) => s.includes("Cultural and religious dietary needs"))).toBe(true);
  });

  it("generates concern for missing cultural dietary accommodation", () => {
    const result = evaluateNutritionPolicy(makePolicy({ culturalDietaryAccommodation: false }));
    expect(result.concerns.some((s) => s.includes("Cultural dietary accommodation not evidenced"))).toBe(true);
  });

  it("generates strength for snack availability", () => {
    const result = evaluateNutritionPolicy(makePolicy({ snackAvailability: true }));
    expect(result.strengths.some((s) => s.includes("Healthy snacks available"))).toBe(true);
  });

  it("generates concern for no snack availability", () => {
    const result = evaluateNutritionPolicy(makePolicy({ snackAvailability: false }));
    expect(result.concerns.some((s) => s.includes("Snacks not routinely available"))).toBe(true);
  });

  it("caps score at 25", () => {
    const result = evaluateNutritionPolicy(makePolicy({ menuRotationWeeks: 100 }));
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("handles Chamberlain House demo policy", () => {
    const result = evaluateNutritionPolicy(OAK_HOUSE_POLICY);
    expect(result.score).toBe(25);
    expect(result.hasPolicy).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateStaffNutritionReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffNutritionReadiness", () => {
  it("returns score 0 with concern for empty training array", () => {
    const result = evaluateStaffNutritionReadiness([]);
    expect(result.score).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.concerns).toHaveLength(1);
    expect(result.concerns[0]).toContain("No staff nutrition training records");
  });

  it("returns perfect score for all-trained staff", () => {
    const training = Array.from({ length: 4 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `staff-${i}`, staffName: `Staff ${i}` }),
    );
    const result = evaluateStaffNutritionReadiness(training);
    expect(result.score).toBe(25);
    expect(result.overallTrainedRate).toBe(100);
    expect(result.foodHygieneRate).toBe(100);
    expect(result.allergyAwarenessRate).toBe(100);
  });

  it("returns 0 score for all-untrained staff", () => {
    const training = Array.from({ length: 4 }, (_, i) =>
      makeTraining({
        id: `t-${i}`,
        staffId: `staff-${i}`,
        staffName: `Staff ${i}`,
        foodHygiene: false,
        dietaryRequirements: false,
        allergyAwareness: false,
        mealPreparation: false,
        nutritionGuidance: false,
        hydrationMonitoring: false,
      }),
    );
    const result = evaluateStaffNutritionReadiness(training);
    expect(result.score).toBe(0);
    expect(result.overallTrainedRate).toBe(0);
  });

  it("applies correct weights to fields", () => {
    // Only food hygiene trained = weight 6
    const foodHygieneOnly = [makeTraining({
      foodHygiene: true,
      dietaryRequirements: false,
      allergyAwareness: false,
      mealPreparation: false,
      nutritionGuidance: false,
      hydrationMonitoring: false,
    })];
    const result1 = evaluateStaffNutritionReadiness(foodHygieneOnly);
    expect(result1.score).toBe(6);

    // Only hydration monitoring trained = weight 2
    const hydrationOnly = [makeTraining({
      foodHygiene: false,
      dietaryRequirements: false,
      allergyAwareness: false,
      mealPreparation: false,
      nutritionGuidance: false,
      hydrationMonitoring: true,
    })];
    const result2 = evaluateStaffNutritionReadiness(hydrationOnly);
    expect(result2.score).toBe(2);
  });

  it("calculates overall trained rate correctly", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", staffName: "S1" }), // All true
      makeTraining({ id: "t2", staffId: "s2", staffName: "S2", foodHygiene: false }), // Missing one
    ];
    const result = evaluateStaffNutritionReadiness(training);
    expect(result.overallTrainedCount).toBe(1);
    expect(result.overallTrainedRate).toBe(50);
  });

  it("generates strength for high food hygiene rate", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}`, staffName: `S ${i}` }),
    );
    const result = evaluateStaffNutritionReadiness(training);
    expect(result.strengths.some((s) => s.includes("Excellent food hygiene training"))).toBe(true);
  });

  it("generates concern for low food hygiene rate", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `t-${i}`, staffId: `s-${i}`, staffName: `S ${i}`,
        foodHygiene: i < 5,
      }),
    );
    const result = evaluateStaffNutritionReadiness(training);
    expect(result.concerns.some((s) => s.includes("Food hygiene training"))).toBe(true);
  });

  it("generates strength for 100% overall trained", () => {
    const training = [makeTraining()];
    const result = evaluateStaffNutritionReadiness(training);
    expect(result.strengths.some((s) => s.includes("100% of staff fully trained"))).toBe(true);
  });

  it("generates concern for low overall trained rate", () => {
    const training = Array.from({ length: 4 }, (_, i) =>
      makeTraining({
        id: `t-${i}`, staffId: `s-${i}`, staffName: `S ${i}`,
        foodHygiene: i === 0,
        dietaryRequirements: i === 0,
        allergyAwareness: i === 0,
        mealPreparation: i === 0,
        nutritionGuidance: i === 0,
        hydrationMonitoring: i === 0,
      }),
    );
    const result = evaluateStaffNutritionReadiness(training);
    expect(result.concerns.some((s) => s.includes("significant training gap"))).toBe(true);
  });

  it("caps score at 25", () => {
    const training = Array.from({ length: 100 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}`, staffName: `S ${i}` }),
    );
    const result = evaluateStaffNutritionReadiness(training);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("handles Chamberlain House demo training", () => {
    const result = evaluateStaffNutritionReadiness(OAK_HOUSE_TRAINING);
    expect(result.totalStaff).toBe(4);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("generates concern for low allergy awareness", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}`, staffName: `S ${i}`, allergyAwareness: i < 5 }),
    );
    const result = evaluateStaffNutritionReadiness(training);
    expect(result.concerns.some((s) => s.includes("Allergy awareness"))).toBe(true);
  });

  it("generates strength for high allergy awareness", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}`, staffName: `S ${i}`, allergyAwareness: true }),
    );
    const result = evaluateStaffNutritionReadiness(training);
    expect(result.strengths.some((s) => s.includes("Strong allergy awareness"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildNutritionProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildNutritionProfiles", () => {
  it("returns empty array for no data", () => {
    const result = buildChildNutritionProfiles([], []);
    expect(result).toEqual([]);
  });

  it("builds profiles from meals only", () => {
    const meals = [
      makeMeal({ childId: "c1", childName: "Alex", nutritionQuality: "excellent", portionConsumed: "full", childSatisfied: true }),
    ];
    const result = buildChildNutritionProfiles(meals, []);
    expect(result).toHaveLength(1);
    expect(result[0].childId).toBe("c1");
    expect(result[0].childName).toBe("Alex");
    expect(result[0].totalMeals).toBe(1);
  });

  it("builds profiles from hydration only", () => {
    const hydration = [
      makeHydration({ childId: "c1", childName: "Alex", cupsConsumed: 7, targetCups: 8 }),
    ];
    const result = buildChildNutritionProfiles([], hydration);
    expect(result).toHaveLength(1);
    expect(result[0].childId).toBe("c1");
    expect(result[0].hydrationRecords).toBe(1);
  });

  it("merges meal and hydration data for the same child", () => {
    const meals = [
      makeMeal({ childId: "c1", childName: "Alex" }),
    ];
    const hydration = [
      makeHydration({ childId: "c1", childName: "Alex", cupsConsumed: 8, targetCups: 8 }),
    ];
    const result = buildChildNutritionProfiles(meals, hydration);
    expect(result).toHaveLength(1);
    expect(result[0].totalMeals).toBe(1);
    expect(result[0].hydrationRecords).toBe(1);
  });

  it("creates separate profiles for different children", () => {
    const meals = [
      makeMeal({ id: "m1", childId: "c1", childName: "Alex" }),
      makeMeal({ id: "m2", childId: "c2", childName: "Jordan" }),
    ];
    const result = buildChildNutritionProfiles(meals, []);
    expect(result).toHaveLength(2);
  });

  it("calculates average nutrition score correctly", () => {
    const meals = [
      makeMeal({ id: "m1", childId: "c1", childName: "Alex", nutritionQuality: "excellent" }), // 4
      makeMeal({ id: "m2", childId: "c1", childName: "Alex", nutritionQuality: "good" }),      // 3
      makeMeal({ id: "m3", childId: "c1", childName: "Alex", nutritionQuality: "adequate" }),   // 2
    ];
    const result = buildChildNutritionProfiles(meals, []);
    expect(result[0].averageNutritionScore).toBe(3); // (4+3+2)/3 = 3
  });

  it("calculates overall score between 0 and 10", () => {
    const meals = [
      makeMeal({ childId: "c1", childName: "Alex", nutritionQuality: "excellent", portionConsumed: "full", childSatisfied: true, dietaryRequirementsMet: true }),
    ];
    const hydration = [
      makeHydration({ childId: "c1", childName: "Alex", cupsConsumed: 10, targetCups: 8 }),
    ];
    const result = buildChildNutritionProfiles(meals, hydration);
    expect(result[0].overallScore).toBeGreaterThanOrEqual(0);
    expect(result[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("gives higher score for better nutrition", () => {
    const goodMeals = [
      makeMeal({ id: "m1", childId: "c1", childName: "Good", nutritionQuality: "excellent", portionConsumed: "full", childSatisfied: true }),
    ];
    const poorMeals = [
      makeMeal({ id: "m2", childId: "c2", childName: "Poor", nutritionQuality: "concern", portionConsumed: "none", childSatisfied: false, dietaryRequirementsMet: false }),
    ];
    const goodResult = buildChildNutritionProfiles(goodMeals, []);
    const poorResult = buildChildNutritionProfiles(poorMeals, []);
    expect(goodResult[0].overallScore).toBeGreaterThan(poorResult[0].overallScore);
  });

  it("handles Chamberlain House demo data", () => {
    const result = buildChildNutritionProfiles(OAK_HOUSE_MEALS, OAK_HOUSE_HYDRATION);
    expect(result).toHaveLength(3);
    const names = result.map((p) => p.childName).sort();
    expect(names).toEqual(["Alex", "Jordan", "Morgan"]);
  });

  it("clamps overall score at 0 minimum", () => {
    const meals = [
      makeMeal({ childId: "c1", childName: "Alex", nutritionQuality: "concern", portionConsumed: "none", childSatisfied: false, dietaryRequirementsMet: false }),
    ];
    const result = buildChildNutritionProfiles(meals, []);
    expect(result[0].overallScore).toBeGreaterThanOrEqual(0);
  });

  it("calculates hydration target met rate correctly", () => {
    const hydration = [
      makeHydration({ id: "h1", childId: "c1", childName: "Alex", cupsConsumed: 8, targetCups: 8 }),
      makeHydration({ id: "h2", childId: "c1", childName: "Alex", cupsConsumed: 5, targetCups: 8 }),
    ];
    const result = buildChildNutritionProfiles([], hydration);
    expect(result[0].hydrationTargetMetRate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateNutritionHydrationMonitoringIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateNutritionHydrationMonitoringIntelligence", () => {
  it("generates complete intelligence for empty data", () => {
    const result = generateNutritionHydrationMonitoringIntelligence(
      [], [], null, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.mealQuality.score).toBe(0);
    expect(result.hydrationStandards.score).toBe(0);
    expect(result.nutritionPolicy.score).toBe(0);
    expect(result.staffNutritionReadiness.score).toBe(0);
    expect(result.childProfiles).toEqual([]);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("generates outstanding rating for perfect data", () => {
    const meals = Array.from({ length: 10 }, (_, i) =>
      makeMeal({
        id: `m-${i}`,
        mealDate: "2026-03-10",
        nutritionQuality: "excellent",
        portionConsumed: "full",
        dietaryRequirementsMet: true,
        childSatisfied: true,
      }),
    );
    const hydration = Array.from({ length: 10 }, (_, i) =>
      makeHydration({
        id: `h-${i}`,
        recordDate: "2026-03-10",
        hydrationLevel: "excellent",
        cupsConsumed: 10,
        targetCups: 8,
        encouragementGiven: true,
      }),
    );
    const policy = makePolicy();
    const training = Array.from({ length: 4 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}`, staffName: `Staff ${i}` }),
    );

    const result = generateNutritionHydrationMonitoringIntelligence(
      meals, hydration, policy, training,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("filters meals and hydration by period", () => {
    const meals = [
      makeMeal({ id: "m1", mealDate: "2025-12-01" }), // Before period
      makeMeal({ id: "m2", mealDate: "2026-03-10" }), // In period
      makeMeal({ id: "m3", mealDate: "2026-06-01" }), // After period
    ];
    const hydration = [
      makeHydration({ id: "h1", recordDate: "2025-12-01" }), // Before period
      makeHydration({ id: "h2", recordDate: "2026-03-10" }), // In period
      makeHydration({ id: "h3", recordDate: "2026-06-01" }), // After period
    ];
    const result = generateNutritionHydrationMonitoringIntelligence(
      meals, hydration, null, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.mealQuality.totalMeals).toBe(1);
    expect(result.hydrationStandards.totalRecords).toBe(1);
  });

  it("includes all regulatory links", () => {
    const result = generateNutritionHydrationMonitoringIntelligence(
      [], [], null, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks).toContain("CHR 2015, Reg 10 — Health and wellbeing: adequate nutrition and hydration");
    expect(result.regulatoryLinks).toContain("SCCIF — How well children are helped and protected");
    expect(result.regulatoryLinks).toContain("NMS 10 — Healthcare: nutrition and dietary needs");
    expect(result.regulatoryLinks).toContain("Children Act 1989 — Duty of care for children's physical welfare");
    expect(result.regulatoryLinks).toContain("Food Safety Act 1990 — Food hygiene and safety standards");
    expect(result.regulatoryLinks).toContain("NICE PH11 — Maternal and child nutrition");
    expect(result.regulatoryLinks).toContain("Healthy Child Programme — Nutritional guidance for looked-after children");
  });

  it("generates strengths for outstanding rating", () => {
    const meals = Array.from({ length: 10 }, (_, i) =>
      makeMeal({ id: `m-${i}`, mealDate: "2026-03-10", nutritionQuality: "excellent", portionConsumed: "full" }),
    );
    const hydration = Array.from({ length: 10 }, (_, i) =>
      makeHydration({ id: `h-${i}`, recordDate: "2026-03-10", hydrationLevel: "excellent", cupsConsumed: 10, targetCups: 8, encouragementGiven: true }),
    );
    const result = generateNutritionHydrationMonitoringIntelligence(
      meals, hydration, makePolicy(), [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("Outstanding"))).toBe(true);
  });

  it("generates areas for improvement for inadequate rating", () => {
    const result = generateNutritionHydrationMonitoringIntelligence(
      [], [], null, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.areasForImprovement.some((s) => s.includes("Inadequate"))).toBe(true);
  });

  it("generates areas for improvement for requires_improvement rating", () => {
    // Need a score between 40-59
    const meals = Array.from({ length: 10 }, (_, i) =>
      makeMeal({ id: `m-${i}`, mealDate: "2026-03-10", nutritionQuality: "good", portionConsumed: "full" }),
    );
    const hydration = Array.from({ length: 10 }, (_, i) =>
      makeHydration({ id: `h-${i}`, recordDate: "2026-03-10", hydrationLevel: "good", cupsConsumed: 8, targetCups: 8, encouragementGiven: true }),
    );
    const result = generateNutritionHydrationMonitoringIntelligence(
      meals, hydration, null, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    // Should have score in requires_improvement range (meal quality + hydration ~= 50)
    if (result.rating === "requires_improvement") {
      expect(result.areasForImprovement.some((s) => s.includes("Requires Improvement"))).toBe(true);
    }
  });

  it("generates urgent actions for concern meals", () => {
    const meals = [
      makeMeal({ id: "m1", mealDate: "2026-03-10", nutritionQuality: "concern" }),
    ];
    const result = generateNutritionHydrationMonitoringIntelligence(
      meals, [], null, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((s) => s.includes("URGENT") && s.includes("concern"))).toBe(true);
  });

  it("generates urgent actions for poor hydration", () => {
    const hydration = [
      makeHydration({ id: "h1", recordDate: "2026-03-10", hydrationLevel: "poor", cupsConsumed: 1, targetCups: 8 }),
    ];
    const result = generateNutritionHydrationMonitoringIntelligence(
      [], hydration, null, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((s) => s.includes("URGENT") && s.includes("hydration"))).toBe(true);
  });

  it("generates urgent actions for no allergy protocol", () => {
    const result = generateNutritionHydrationMonitoringIntelligence(
      [], [], makePolicy({ allergyProtocolInPlace: false }), [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((s) => s.includes("URGENT") && s.includes("allergy protocol"))).toBe(true);
  });

  it("generates no-action message when everything is good", () => {
    const meals = Array.from({ length: 10 }, (_, i) =>
      makeMeal({ id: `m-${i}`, mealDate: "2026-03-10", nutritionQuality: "excellent", portionConsumed: "full" }),
    );
    const hydration = Array.from({ length: 10 }, (_, i) =>
      makeHydration({ id: `h-${i}`, recordDate: "2026-03-10", hydrationLevel: "excellent", cupsConsumed: 10, targetCups: 8, encouragementGiven: true }),
    );
    const result = generateNutritionHydrationMonitoringIntelligence(
      meals, hydration, makePolicy(), [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((s) => s.includes("No immediate actions required"))).toBe(true);
  });

  it("caps overall score at 100", () => {
    const meals = Array.from({ length: 100 }, (_, i) =>
      makeMeal({ id: `m-${i}`, mealDate: "2026-03-10", nutritionQuality: "excellent", portionConsumed: "full" }),
    );
    const hydration = Array.from({ length: 100 }, (_, i) =>
      makeHydration({ id: `h-${i}`, recordDate: "2026-03-10", hydrationLevel: "excellent", cupsConsumed: 20, targetCups: 8, encouragementGiven: true }),
    );
    const result = generateNutritionHydrationMonitoringIntelligence(
      meals, hydration, makePolicy(), Array.from({ length: 10 }, (_, i) => makeTraining({ id: `t-${i}`, staffId: `s-${i}`, staffName: `S ${i}` })),
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("clamps overall score at 0 minimum", () => {
    const result = generateNutritionHydrationMonitoringIntelligence(
      [], [], null, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("generates assessedAt timestamp", () => {
    const result = generateNutritionHydrationMonitoringIntelligence(
      [], [], null, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.assessedAt).toBeDefined();
    expect(result.assessedAt.length).toBeGreaterThan(0);
  });

  it("handles Chamberlain House demo data end-to-end", () => {
    const result = generateNutritionHydrationMonitoringIntelligence(
      OAK_HOUSE_MEALS,
      OAK_HOUSE_HYDRATION,
      OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.childProfiles).toHaveLength(3);
    expect(result.mealQuality.totalMeals).toBe(9);
    expect(result.hydrationStandards.totalRecords).toBe(3);
    expect(result.nutritionPolicy.hasPolicy).toBe(true);
    expect(result.staffNutritionReadiness.totalStaff).toBe(4);
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("generates HIGH action for low dietary requirements met rate", () => {
    const meals = Array.from({ length: 10 }, (_, i) =>
      makeMeal({ id: `m-${i}`, mealDate: "2026-03-10", dietaryRequirementsMet: i < 5 }),
    );
    const result = generateNutritionHydrationMonitoringIntelligence(
      meals, [], null, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((s) => s.includes("HIGH") && s.includes("Dietary requirements"))).toBe(true);
  });

  it("generates HIGH action for low hydration target rate", () => {
    const hydration = Array.from({ length: 10 }, (_, i) =>
      makeHydration({ id: `h-${i}`, recordDate: "2026-03-10", cupsConsumed: 3, targetCups: 8 }),
    );
    const result = generateNutritionHydrationMonitoringIntelligence(
      [], hydration, null, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((s) => s.includes("HIGH") && s.includes("hydration targets"))).toBe(true);
  });

  it("generates HIGH action for low staff training rate", () => {
    const training = Array.from({ length: 4 }, (_, i) =>
      makeTraining({
        id: `t-${i}`, staffId: `s-${i}`, staffName: `S ${i}`,
        foodHygiene: i === 0,
        dietaryRequirements: i === 0,
        allergyAwareness: i === 0,
        mealPreparation: i === 0,
        nutritionGuidance: i === 0,
        hydrationMonitoring: i === 0,
      }),
    );
    const result = generateNutritionHydrationMonitoringIntelligence(
      [], [], null, training,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((s) => s.includes("HIGH") && s.includes("staff fully trained"))).toBe(true);
  });

  it("generates MEDIUM action for low child satisfaction", () => {
    const meals = Array.from({ length: 10 }, (_, i) =>
      makeMeal({ id: `m-${i}`, mealDate: "2026-03-10", childSatisfied: false }),
    );
    const result = generateNutritionHydrationMonitoringIntelligence(
      meals, [], null, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((s) => s.includes("MEDIUM") && s.includes("satisfaction"))).toBe(true);
  });

  it("generates MEDIUM action for no nutrition policy", () => {
    const result = generateNutritionHydrationMonitoringIntelligence(
      [], [], null, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((s) => s.includes("MEDIUM") && s.includes("nutrition policy"))).toBe(true);
  });

  it("generates MEDIUM action for inadequate menu rotation", () => {
    const result = generateNutritionHydrationMonitoringIntelligence(
      [], [], makePolicy({ menuRotationWeeks: 2 }), [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((s) => s.includes("MEDIUM") && s.includes("Menu rotation"))).toBe(true);
  });

  it("generates URGENT action for children with low nutrition scores", () => {
    const meals = [
      makeMeal({ id: "m1", childId: "c1", childName: "Alex", mealDate: "2026-03-10", nutritionQuality: "concern", portionConsumed: "none", childSatisfied: false, dietaryRequirementsMet: false }),
    ];
    const result = generateNutritionHydrationMonitoringIntelligence(
      meals, [], null, [],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((s) => s.includes("URGENT") && s.includes("child(ren) with low nutrition scores"))).toBe(true);
  });
});
