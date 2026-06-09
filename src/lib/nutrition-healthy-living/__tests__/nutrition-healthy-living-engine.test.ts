// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Nutrition & Healthy Living Intelligence — Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateMealQuality,
  evaluatePhysicalActivity,
  evaluateHealthPromotion,
  evaluateMenuPlanning,
  buildChildNutritionProfiles,
  generateNutritionHealthyLivingIntelligence,
  getRating,
  getMealTypeLabel,
  getDietaryRequirementLabel,
  getMealQualityLabel,
  getActivityTypeLabel,
  getActivityIntensityLabel,
  getHealthOutcomeLabel,
  getHydrationStatusLabel,
} from "../nutrition-healthy-living-engine";
import type {
  MealRecord,
  ChildDietaryProfile,
  PhysicalActivity,
  HealthPromotion,
  MenuPlan,
  MealType,
  DietaryRequirement,
  MealQuality,
  ActivityType,
  ActivityIntensity,
  HealthOutcome,
  HydrationStatus,
} from "../nutrition-healthy-living-engine";

// ── Constants ────────────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-18";

// ── Factories ────────────────────────────────────────────────────────────────

function makeMeal(overrides: Partial<MealRecord> = {}): MealRecord {
  return {
    id: "meal-001",
    childId: "child-alex",
    date: "2026-03-15",
    mealType: "dinner",
    quality: "good",
    dietaryRequirementsMet: true,
    freshFruitVegIncluded: true,
    childInvolvedInPreparation: false,
    childEnjoyed: true,
    portionAppropriate: true,
    ...overrides,
  };
}

function makeProfile(overrides: Partial<ChildDietaryProfile> = {}): ChildDietaryProfile {
  return {
    id: "prof-alex",
    childId: "child-alex",
    childName: "Alex",
    dietaryRequirements: ["none"],
    allergies: [],
    preferences: ["pasta", "pizza"],
    lastReviewedDate: "2026-04-01",
    reviewedBy: "Sarah Johnson",
    weightHealthy: true,
    dietaryPlanInPlace: true,
    ...overrides,
  };
}

function makeActivity(overrides: Partial<PhysicalActivity> = {}): PhysicalActivity {
  return {
    id: "act-001",
    childId: "child-alex",
    date: "2026-03-15",
    activityType: "sports",
    intensity: "moderate",
    durationMinutes: 60,
    childEnjoyment: true,
    staffSupervised: true,
    ...overrides,
  };
}

function makeHealth(overrides: Partial<HealthPromotion> = {}): HealthPromotion {
  return {
    id: "hp-alex",
    childId: "child-alex",
    hydrationStatus: "well_hydrated",
    sleepQualityGood: true,
    dentalCheckUpToDate: true,
    opticalCheckUpToDate: true,
    annualHealthAssessmentComplete: true,
    cookingSkillsDeveloping: true,
    nutritionEducationProvided: true,
    mentalWellbeingSupported: true,
    substanceMisuseEducation: true,
    sexualHealthEducation: true,
    assessedDate: "2026-04-01",
    ...overrides,
  };
}

function makeMenu(overrides: Partial<MenuPlan> = {}): MenuPlan {
  return {
    id: "menu-001",
    weekStartDate: "2026-03-11",
    mealsPlanned: 21,
    balancedMeals: 19,
    childrenConsulted: true,
    culturalDiversityReflected: true,
    budgetAppropriate: true,
    seasonalIngredientsUsed: true,
    specialDietsCatered: true,
    ...overrides,
  };
}

// ── Chamberlain House Demo Data ──────────────────────────────────────────────────────

const DEMO_PROFILES: ChildDietaryProfile[] = [
  makeProfile({ id: "prof-alex", childId: "child-alex", childName: "Alex", dietaryRequirements: ["none"], allergies: [], preferences: ["pasta", "pizza"] }),
  makeProfile({ id: "prof-jordan", childId: "child-jordan", childName: "Jordan", dietaryRequirements: ["gluten_free"], allergies: ["gluten"], preferences: ["rice dishes"], dietaryPlanInPlace: true }),
  makeProfile({ id: "prof-morgan", childId: "child-morgan", childName: "Morgan", dietaryRequirements: ["halal"], allergies: [], preferences: ["chicken", "lamb"], dietaryPlanInPlace: true }),
];

const DEMO_MEALS: MealRecord[] = [
  // Alex — varied, good quality
  makeMeal({ id: "m-a01", childId: "child-alex", date: "2026-03-15", mealType: "breakfast", quality: "good", freshFruitVegIncluded: true, childEnjoyed: true }),
  makeMeal({ id: "m-a02", childId: "child-alex", date: "2026-03-15", mealType: "lunch", quality: "excellent", freshFruitVegIncluded: true, childInvolvedInPreparation: true, childEnjoyed: true }),
  makeMeal({ id: "m-a03", childId: "child-alex", date: "2026-03-15", mealType: "dinner", quality: "good", freshFruitVegIncluded: true, childEnjoyed: true }),
  // Jordan — gluten free compliance
  makeMeal({ id: "m-j01", childId: "child-jordan", date: "2026-03-15", mealType: "breakfast", quality: "good", dietaryRequirementsMet: true, freshFruitVegIncluded: true, childEnjoyed: true }),
  makeMeal({ id: "m-j02", childId: "child-jordan", date: "2026-03-15", mealType: "lunch", quality: "good", dietaryRequirementsMet: true, freshFruitVegIncluded: false, childEnjoyed: true }),
  makeMeal({ id: "m-j03", childId: "child-jordan", date: "2026-03-15", mealType: "dinner", quality: "excellent", dietaryRequirementsMet: true, freshFruitVegIncluded: true, childInvolvedInPreparation: true, childEnjoyed: true }),
  // Morgan — halal, involved in cooking
  makeMeal({ id: "m-m01", childId: "child-morgan", date: "2026-03-15", mealType: "breakfast", quality: "good", dietaryRequirementsMet: true, freshFruitVegIncluded: true, childEnjoyed: true }),
  makeMeal({ id: "m-m02", childId: "child-morgan", date: "2026-03-15", mealType: "lunch", quality: "good", dietaryRequirementsMet: true, freshFruitVegIncluded: true, childInvolvedInPreparation: true, childEnjoyed: true }),
  makeMeal({ id: "m-m03", childId: "child-morgan", date: "2026-03-15", mealType: "dinner", quality: "excellent", dietaryRequirementsMet: true, freshFruitVegIncluded: true, childInvolvedInPreparation: true, childEnjoyed: false }),
];

const DEMO_ACTIVITIES: PhysicalActivity[] = [
  // Alex — football, swimming
  makeActivity({ id: "act-a01", childId: "child-alex", date: "2026-03-10", activityType: "sports", intensity: "vigorous", durationMinutes: 90, childEnjoyment: true }),
  makeActivity({ id: "act-a02", childId: "child-alex", date: "2026-03-12", activityType: "swimming", intensity: "moderate", durationMinutes: 60, childEnjoyment: true }),
  makeActivity({ id: "act-a03", childId: "child-alex", date: "2026-03-14", activityType: "cycling", intensity: "moderate", durationMinutes: 45, childEnjoyment: true }),
  // Jordan — walking, outdoor play
  makeActivity({ id: "act-j01", childId: "child-jordan", date: "2026-03-10", activityType: "walking", intensity: "light", durationMinutes: 30, childEnjoyment: true }),
  makeActivity({ id: "act-j02", childId: "child-jordan", date: "2026-03-13", activityType: "outdoor_play", intensity: "moderate", durationMinutes: 60, childEnjoyment: true }),
  makeActivity({ id: "act-j03", childId: "child-jordan", date: "2026-03-15", activityType: "dance", intensity: "moderate", durationMinutes: 45, childEnjoyment: true }),
  // Morgan — gym, yoga, team games
  makeActivity({ id: "act-m01", childId: "child-morgan", date: "2026-03-11", activityType: "gym", intensity: "vigorous", durationMinutes: 60, childEnjoyment: true }),
  makeActivity({ id: "act-m02", childId: "child-morgan", date: "2026-03-13", activityType: "yoga", intensity: "light", durationMinutes: 45, childEnjoyment: true }),
  makeActivity({ id: "act-m03", childId: "child-morgan", date: "2026-03-14", activityType: "team_games", intensity: "moderate", durationMinutes: 60, childEnjoyment: false }),
];

const DEMO_HEALTH: HealthPromotion[] = [
  makeHealth({ id: "hp-alex", childId: "child-alex", hydrationStatus: "well_hydrated", sleepQualityGood: true, dentalCheckUpToDate: true, opticalCheckUpToDate: true, annualHealthAssessmentComplete: true, cookingSkillsDeveloping: true, nutritionEducationProvided: true, mentalWellbeingSupported: true }),
  makeHealth({ id: "hp-jordan", childId: "child-jordan", hydrationStatus: "adequate", sleepQualityGood: true, dentalCheckUpToDate: true, opticalCheckUpToDate: false, annualHealthAssessmentComplete: true, cookingSkillsDeveloping: false, nutritionEducationProvided: true, mentalWellbeingSupported: true }),
  makeHealth({ id: "hp-morgan", childId: "child-morgan", hydrationStatus: "well_hydrated", sleepQualityGood: false, dentalCheckUpToDate: true, opticalCheckUpToDate: true, annualHealthAssessmentComplete: true, cookingSkillsDeveloping: true, nutritionEducationProvided: true, mentalWellbeingSupported: true }),
];

const DEMO_MENUS: MenuPlan[] = [
  makeMenu({ id: "menu-w1", weekStartDate: "2026-03-04", mealsPlanned: 21, balancedMeals: 19, childrenConsulted: true, culturalDiversityReflected: true, specialDietsCatered: true, seasonalIngredientsUsed: true }),
  makeMenu({ id: "menu-w2", weekStartDate: "2026-03-11", mealsPlanned: 21, balancedMeals: 20, childrenConsulted: true, culturalDiversityReflected: true, specialDietsCatered: true, seasonalIngredientsUsed: true }),
  makeMenu({ id: "menu-w3", weekStartDate: "2026-03-18", mealsPlanned: 21, balancedMeals: 18, childrenConsulted: true, culturalDiversityReflected: false, specialDietsCatered: true, seasonalIngredientsUsed: false }),
];

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Nutrition & Healthy Living Intelligence Engine", () => {
  // ── Label Functions ──────────────────────────────────────────────────────

  describe("getMealTypeLabel", () => {
    it("returns correct labels for all meal types", () => {
      const types: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
      expect(getMealTypeLabel("breakfast")).toBe("Breakfast");
      expect(getMealTypeLabel("dinner")).toBe("Dinner");
      for (const t of types) {
        expect(getMealTypeLabel(t)).toBeTruthy();
      }
    });
  });

  describe("getDietaryRequirementLabel", () => {
    it("returns correct labels", () => {
      expect(getDietaryRequirementLabel("halal")).toBe("Halal");
      expect(getDietaryRequirementLabel("gluten_free")).toBe("Gluten Free");
      expect(getDietaryRequirementLabel("none")).toBe("None");
      const reqs: DietaryRequirement[] = [
        "vegetarian", "vegan", "halal", "kosher", "gluten_free", "dairy_free",
        "nut_free", "egg_free", "diabetic", "low_sugar", "high_calorie",
        "texture_modified", "none",
      ];
      for (const r of reqs) {
        expect(getDietaryRequirementLabel(r)).toBeTruthy();
      }
    });
  });

  describe("getMealQualityLabel", () => {
    it("returns correct labels", () => {
      const qualities: MealQuality[] = ["excellent", "good", "adequate", "poor"];
      for (const q of qualities) {
        expect(getMealQualityLabel(q)).toBeTruthy();
      }
    });
  });

  describe("getActivityTypeLabel", () => {
    it("returns correct labels for all types", () => {
      const types: ActivityType[] = [
        "sports", "swimming", "walking", "cycling", "gym", "dance",
        "outdoor_play", "gardening", "yoga", "martial_arts", "team_games", "other",
      ];
      expect(getActivityTypeLabel("swimming")).toBe("Swimming");
      for (const t of types) {
        expect(getActivityTypeLabel(t)).toBeTruthy();
      }
    });
  });

  describe("getActivityIntensityLabel", () => {
    it("returns correct labels", () => {
      const intensities: ActivityIntensity[] = ["vigorous", "moderate", "light"];
      for (const i of intensities) {
        expect(getActivityIntensityLabel(i)).toBeTruthy();
      }
    });
  });

  describe("getHealthOutcomeLabel", () => {
    it("returns correct labels", () => {
      const outcomes: HealthOutcome[] = ["improved", "maintained", "declined", "not_assessed"];
      for (const o of outcomes) {
        expect(getHealthOutcomeLabel(o)).toBeTruthy();
      }
    });
  });

  describe("getHydrationStatusLabel", () => {
    it("returns correct labels", () => {
      const statuses: HydrationStatus[] = ["well_hydrated", "adequate", "needs_improvement", "concern"];
      expect(getHydrationStatusLabel("well_hydrated")).toBe("Well Hydrated");
      for (const s of statuses) {
        expect(getHydrationStatusLabel(s)).toBeTruthy();
      }
    });
  });

  describe("getRating", () => {
    it("returns outstanding ≥ 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
    it("returns good 60-79", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
    it("returns requires_improvement 40-59", () => { expect(getRating(40)).toBe("requires_improvement"); });
    it("returns inadequate < 40", () => { expect(getRating(0)).toBe("inadequate"); expect(getRating(39)).toBe("inadequate"); });
  });

  // ── evaluateMealQuality ────────────────────────────────────────────────

  describe("evaluateMealQuality", () => {
    it("returns 0 for no meals", () => {
      const result = evaluateMealQuality([], []);
      expect(result.overallScore).toBe(0);
      expect(result.totalMeals).toBe(0);
    });

    it("scores well for demo data", () => {
      const result = evaluateMealQuality(DEMO_MEALS, DEMO_PROFILES);
      expect(result.overallScore).toBeGreaterThanOrEqual(15);
      expect(result.totalMeals).toBe(9);
      expect(result.excellentGoodRate).toBe(100);
      expect(result.dietaryComplianceRate).toBe(100);
    });

    it("calculates fresh fruit/veg rate", () => {
      const result = evaluateMealQuality(DEMO_MEALS, DEMO_PROFILES);
      expect(result.freshFruitVegRate).toBeGreaterThan(70);
    });

    it("calculates child involvement rate", () => {
      const result = evaluateMealQuality(DEMO_MEALS, DEMO_PROFILES);
      // 4 of 9 meals had child involvement
      expect(result.childInvolvementRate).toBe(44);
    });

    it("calculates child enjoyment rate", () => {
      const result = evaluateMealQuality(DEMO_MEALS, DEMO_PROFILES);
      // 8 of 9 enjoyed
      expect(result.childEnjoymentRate).toBe(89);
    });

    it("penalises poor meal quality", () => {
      const meals = [
        makeMeal({ quality: "poor", dietaryRequirementsMet: false, freshFruitVegIncluded: false, childEnjoyed: false, portionAppropriate: false }),
      ];
      const result = evaluateMealQuality(meals, []);
      expect(result.excellentGoodRate).toBe(0);
      expect(result.overallScore).toBeLessThan(5);
    });

    it("builds meal type breakdown", () => {
      const result = evaluateMealQuality(DEMO_MEALS, DEMO_PROFILES);
      expect(result.mealTypeBreakdown.breakfast).toBe(3);
      expect(result.mealTypeBreakdown.lunch).toBe(3);
      expect(result.mealTypeBreakdown.dinner).toBe(3);
    });

    it("scores high for all excellent meals", () => {
      const meals = Array.from({ length: 10 }, (_, i) =>
        makeMeal({
          id: `m-${i}`,
          quality: "excellent",
          freshFruitVegIncluded: true,
          childInvolvedInPreparation: i < 4,
          childEnjoyed: true,
          portionAppropriate: true,
        }),
      );
      const result = evaluateMealQuality(meals, []);
      expect(result.overallScore).toBeGreaterThanOrEqual(20);
    });
  });

  // ── evaluatePhysicalActivity ───────────────────────────────────────────

  describe("evaluatePhysicalActivity", () => {
    it("returns 0 for no activities", () => {
      const result = evaluatePhysicalActivity([], ["child-alex"], PERIOD_START, PERIOD_END);
      expect(result.overallScore).toBe(0);
      expect(result.totalActivities).toBe(0);
      expect(result.meetsNHSGuidelines).toBe(false);
    });

    it("scores demo data", () => {
      const childIds = ["child-alex", "child-jordan", "child-morgan"];
      const result = evaluatePhysicalActivity(DEMO_ACTIVITIES, childIds, PERIOD_START, PERIOD_END);
      expect(result.overallScore).toBeGreaterThanOrEqual(5);
      expect(result.totalActivities).toBe(9);
      expect(result.activeChildrenRate).toBe(100);
    });

    it("calculates activity variety", () => {
      const childIds = ["child-alex", "child-jordan", "child-morgan"];
      const result = evaluatePhysicalActivity(DEMO_ACTIVITIES, childIds, PERIOD_START, PERIOD_END);
      expect(result.activityVariety).toBeGreaterThanOrEqual(7);
    });

    it("calculates vigorous/moderate rate", () => {
      const childIds = ["child-alex"];
      const result = evaluatePhysicalActivity(DEMO_ACTIVITIES, childIds, PERIOD_START, PERIOD_END);
      // Most are moderate or vigorous
      expect(result.vigorousModerateRate).toBeGreaterThan(50);
    });

    it("calculates child enjoyment rate", () => {
      const childIds = ["child-alex", "child-jordan", "child-morgan"];
      const result = evaluatePhysicalActivity(DEMO_ACTIVITIES, childIds, PERIOD_START, PERIOD_END);
      // 8 of 9 enjoyed
      expect(result.childEnjoymentRate).toBe(89);
    });

    it("detects NHS guideline compliance", () => {
      // 420 min/week over 1 week for 1 child
      const activities = Array.from({ length: 7 }, (_, i) =>
        makeActivity({ id: `a-${i}`, durationMinutes: 60, date: `2026-03-${10 + i}` }),
      );
      const result = evaluatePhysicalActivity(activities, ["child-alex"], "2026-03-10", "2026-03-17");
      expect(result.averageMinutesPerChildPerWeek).toBe(420);
      expect(result.meetsNHSGuidelines).toBe(true);
    });

    it("handles single activity type", () => {
      const activities = [makeActivity()];
      const result = evaluatePhysicalActivity(activities, ["child-alex"], PERIOD_START, PERIOD_END);
      expect(result.activityVariety).toBe(1);
    });

    it("scores high for diverse, frequent activities", () => {
      const types: ActivityType[] = ["sports", "swimming", "cycling", "dance", "yoga", "team_games"];
      const activities = types.map((t, i) =>
        makeActivity({ id: `a-${i}`, activityType: t, intensity: i < 3 ? "vigorous" : "moderate", durationMinutes: 90, date: `2026-03-${10 + i}` }),
      );
      const result = evaluatePhysicalActivity(activities, ["child-alex"], "2026-03-10", "2026-03-17");
      expect(result.overallScore).toBeGreaterThanOrEqual(18);
      expect(result.activityVariety).toBe(6);
    });
  });

  // ── evaluateHealthPromotion ────────────────────────────────────────────

  describe("evaluateHealthPromotion", () => {
    it("returns 0 for no health records", () => {
      const result = evaluateHealthPromotion([]);
      expect(result.overallScore).toBe(0);
    });

    it("scores well for demo data", () => {
      const result = evaluateHealthPromotion(DEMO_HEALTH);
      expect(result.overallScore).toBeGreaterThanOrEqual(15);
      expect(result.annualHealthAssessmentRate).toBe(100);
      expect(result.mentalWellbeingRate).toBe(100);
    });

    it("calculates hydration rate", () => {
      const result = evaluateHealthPromotion(DEMO_HEALTH);
      expect(result.hydrationGoodRate).toBe(100);
    });

    it("calculates sleep quality rate", () => {
      const result = evaluateHealthPromotion(DEMO_HEALTH);
      // 2 of 3 have good sleep
      expect(result.sleepQualityRate).toBe(67);
    });

    it("calculates dental rate", () => {
      const result = evaluateHealthPromotion(DEMO_HEALTH);
      expect(result.dentalUpToDateRate).toBe(100);
    });

    it("calculates optical rate", () => {
      const result = evaluateHealthPromotion(DEMO_HEALTH);
      // 2 of 3 up to date
      expect(result.opticalUpToDateRate).toBe(67);
    });

    it("calculates cooking skills rate", () => {
      const result = evaluateHealthPromotion(DEMO_HEALTH);
      // 2 of 3
      expect(result.cookingSkillsRate).toBe(67);
    });

    it("calculates nutrition education rate", () => {
      const result = evaluateHealthPromotion(DEMO_HEALTH);
      expect(result.nutritionEducationRate).toBe(100);
    });

    it("scores high for perfect health records", () => {
      const records = [makeHealth(), makeHealth({ id: "hp-2", childId: "child-jordan" })];
      const result = evaluateHealthPromotion(records);
      expect(result.overallScore).toBeGreaterThanOrEqual(22);
    });

    it("scores low for poor health records", () => {
      const records = [
        makeHealth({
          hydrationStatus: "concern",
          sleepQualityGood: false,
          dentalCheckUpToDate: false,
          opticalCheckUpToDate: false,
          annualHealthAssessmentComplete: false,
          cookingSkillsDeveloping: false,
          nutritionEducationProvided: false,
          mentalWellbeingSupported: false,
        }),
      ];
      const result = evaluateHealthPromotion(records);
      expect(result.overallScore).toBeLessThan(5);
    });
  });

  // ── evaluateMenuPlanning ───────────────────────────────────────────────

  describe("evaluateMenuPlanning", () => {
    it("returns 0 for no menu plans", () => {
      const result = evaluateMenuPlanning([]);
      expect(result.overallScore).toBe(0);
      expect(result.totalMenuPlans).toBe(0);
    });

    it("scores well for demo data", () => {
      const result = evaluateMenuPlanning(DEMO_MENUS);
      expect(result.overallScore).toBeGreaterThanOrEqual(15);
      expect(result.totalMenuPlans).toBe(3);
    });

    it("calculates balanced meal rate", () => {
      const result = evaluateMenuPlanning(DEMO_MENUS);
      // (19+20+18) / (21+21+21) = 57/63 = 90%
      expect(result.balancedMealRate).toBe(90);
    });

    it("calculates child consultation rate", () => {
      const result = evaluateMenuPlanning(DEMO_MENUS);
      expect(result.childConsultationRate).toBe(100);
    });

    it("calculates cultural diversity rate", () => {
      const result = evaluateMenuPlanning(DEMO_MENUS);
      // 2 of 3
      expect(result.culturalDiversityRate).toBe(67);
    });

    it("calculates special diets catered rate", () => {
      const result = evaluateMenuPlanning(DEMO_MENUS);
      expect(result.specialDietsCateredRate).toBe(100);
    });

    it("calculates seasonal ingredient rate", () => {
      const result = evaluateMenuPlanning(DEMO_MENUS);
      // 2 of 3
      expect(result.seasonalIngredientRate).toBe(67);
    });

    it("scores high for perfect menus", () => {
      const menus = [
        makeMenu({ mealsPlanned: 21, balancedMeals: 21 }),
        makeMenu({ id: "m2", mealsPlanned: 21, balancedMeals: 21 }),
      ];
      const result = evaluateMenuPlanning(menus);
      expect(result.overallScore).toBeGreaterThanOrEqual(22);
    });

    it("penalises poor menu planning", () => {
      const menus = [
        makeMenu({
          mealsPlanned: 21,
          balancedMeals: 5,
          childrenConsulted: false,
          culturalDiversityReflected: false,
          specialDietsCatered: false,
          seasonalIngredientsUsed: false,
        }),
      ];
      const result = evaluateMenuPlanning(menus);
      expect(result.overallScore).toBeLessThan(5);
    });
  });

  // ── buildChildNutritionProfiles ────────────────────────────────────────

  describe("buildChildNutritionProfiles", () => {
    it("builds profiles for all children", () => {
      const profiles = buildChildNutritionProfiles(
        DEMO_PROFILES, DEMO_MEALS, DEMO_ACTIVITIES, DEMO_HEALTH, PERIOD_START, PERIOD_END,
      );
      expect(profiles.length).toBe(3);
    });

    it("includes correct child names", () => {
      const profiles = buildChildNutritionProfiles(
        DEMO_PROFILES, DEMO_MEALS, DEMO_ACTIVITIES, DEMO_HEALTH, PERIOD_START, PERIOD_END,
      );
      const names = profiles.map((p) => p.childName).sort();
      expect(names).toEqual(["Alex", "Jordan", "Morgan"]);
    });

    it("calculates dietary compliance per child", () => {
      const profiles = buildChildNutritionProfiles(
        DEMO_PROFILES, DEMO_MEALS, DEMO_ACTIVITIES, DEMO_HEALTH, PERIOD_START, PERIOD_END,
      );
      const alex = profiles.find((p) => p.childId === "child-alex")!;
      expect(alex.dietaryComplianceRate).toBe(100);
    });

    it("includes dietary requirements", () => {
      const profiles = buildChildNutritionProfiles(
        DEMO_PROFILES, DEMO_MEALS, DEMO_ACTIVITIES, DEMO_HEALTH, PERIOD_START, PERIOD_END,
      );
      const morgan = profiles.find((p) => p.childId === "child-morgan")!;
      expect(morgan.dietaryRequirements).toContain("halal");
    });

    it("scores profiles 0-10", () => {
      const profiles = buildChildNutritionProfiles(
        DEMO_PROFILES, DEMO_MEALS, DEMO_ACTIVITIES, DEMO_HEALTH, PERIOD_START, PERIOD_END,
      );
      for (const p of profiles) {
        expect(p.overallScore).toBeGreaterThanOrEqual(0);
        expect(p.overallScore).toBeLessThanOrEqual(10);
      }
    });

    it("returns empty for no profiles", () => {
      const profiles = buildChildNutritionProfiles([], [], [], [], PERIOD_START, PERIOD_END);
      expect(profiles.length).toBe(0);
    });
  });

  // ── Full Integration ───────────────────────────────────────────────────

  describe("generateNutritionHealthyLivingIntelligence", () => {
    it("produces valid output for Chamberlain House demo", () => {
      const result = generateNutritionHealthyLivingIntelligence(
        DEMO_MEALS, DEMO_PROFILES, DEMO_ACTIVITIES, DEMO_HEALTH, DEMO_MENUS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.homeId).toBe("oak-house");
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    });

    it("overall score is sum of 4 components", () => {
      const result = generateNutritionHealthyLivingIntelligence(
        DEMO_MEALS, DEMO_PROFILES, DEMO_ACTIVITIES, DEMO_HEALTH, DEMO_MENUS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      const expected = result.mealQuality.overallScore + result.physicalActivity.overallScore +
        result.healthPromotion.overallScore + result.menuPlanning.overallScore;
      expect(result.overallScore).toBe(Math.min(expected, 100));
    });

    it("returns child profiles", () => {
      const result = generateNutritionHealthyLivingIntelligence(
        DEMO_MEALS, DEMO_PROFILES, DEMO_ACTIVITIES, DEMO_HEALTH, DEMO_MENUS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.childProfiles.length).toBe(3);
    });

    it("generates strengths", () => {
      const result = generateNutritionHealthyLivingIntelligence(
        DEMO_MEALS, DEMO_PROFILES, DEMO_ACTIVITIES, DEMO_HEALTH, DEMO_MENUS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.strengths.length).toBeGreaterThan(0);
    });

    it("generates regulatory links", () => {
      const result = generateNutritionHealthyLivingIntelligence(
        DEMO_MEALS, DEMO_PROFILES, DEMO_ACTIVITIES, DEMO_HEALTH, DEMO_MENUS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.regulatoryLinks.length).toBeGreaterThanOrEqual(8);
      expect(result.regulatoryLinks.some((l) => l.includes("Reg 7"))).toBe(true);
      expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 24"))).toBe(true);
    });

    // Edge cases

    it("handles all empty data", () => {
      const result = generateNutritionHealthyLivingIntelligence(
        [], [], [], [], [], "empty", PERIOD_START, PERIOD_END,
      );
      expect(result.overallScore).toBe(0);
      expect(result.rating).toBe("inadequate");
      expect(result.childProfiles.length).toBe(0);
    });

    it("generates actions for empty data", () => {
      const result = generateNutritionHealthyLivingIntelligence(
        [], [], [], [], [], "empty", PERIOD_START, PERIOD_END,
      );
      expect(result.actions.length).toBeGreaterThan(0);
      expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
    });

    it("clamped to 100", () => {
      const result = generateNutritionHealthyLivingIntelligence(
        DEMO_MEALS, DEMO_PROFILES, DEMO_ACTIVITIES, DEMO_HEALTH, DEMO_MENUS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it("demo data produces reasonable rating", () => {
      const result = generateNutritionHealthyLivingIntelligence(
        DEMO_MEALS, DEMO_PROFILES, DEMO_ACTIVITIES, DEMO_HEALTH, DEMO_MENUS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      // Demo data is decent quality
      expect(["outstanding", "good", "requires_improvement"]).toContain(result.rating);
    });

    it("strength for meal quality when excellent/good ≥ 90%", () => {
      const result = generateNutritionHealthyLivingIntelligence(
        DEMO_MEALS, DEMO_PROFILES, DEMO_ACTIVITIES, DEMO_HEALTH, DEMO_MENUS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.strengths).toEqual(
        expect.arrayContaining([expect.stringContaining("meal quality")]),
      );
    });

    it("strength for child involvement in preparation", () => {
      const result = generateNutritionHealthyLivingIntelligence(
        DEMO_MEALS, DEMO_PROFILES, DEMO_ACTIVITIES, DEMO_HEALTH, DEMO_MENUS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.strengths).toEqual(
        expect.arrayContaining([expect.stringContaining("meal preparation")]),
      );
    });

    it("area for improvement when optical checks low", () => {
      const health = [makeHealth({ opticalCheckUpToDate: false, dentalCheckUpToDate: false })];
      const result = generateNutritionHealthyLivingIntelligence(
        DEMO_MEALS, DEMO_PROFILES, DEMO_ACTIVITIES, health, DEMO_MENUS,
        "oak-house", PERIOD_START, PERIOD_END,
      );
      expect(result.areasForImprovement).toEqual(
        expect.arrayContaining([expect.stringContaining("Dental")]),
      );
    });
  });
});
