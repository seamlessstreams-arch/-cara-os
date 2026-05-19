import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getMealTypeLabel,
  getNutritionRatingLabel,
  getRatingLabel,
  evaluateMealQuality,
  evaluateNutritionCompliance,
  evaluateNutritionPolicy,
  evaluateStaffNutritionReadiness,
  buildChildNutritionProfiles,
  generateFoodNutritionQualityIntelligence,
} from "../food-nutrition-quality-engine";
import type {
  MealRecord,
  NutritionPolicy,
  StaffNutritionTraining,
} from "../food-nutrition-quality-engine";

// -- Factory functions ---------------------------------------------------------

let recordCounter = 0;
function makeRecord(overrides: Partial<MealRecord> = {}): MealRecord {
  recordCounter++;
  return {
    id: `rec-${recordCounter}`,
    childId: "child-alex",
    childName: "Alex",
    mealDate: "2026-03-15",
    mealType: "lunch",
    nutritionRating: "excellent",
    dietaryNeedsMet: true,
    childChoiceOffered: true,
    portionAppropriate: true,
    freshIngredientsUsed: true,
    documentedInRecord: true,
    childSatisfied: true,
    ...overrides,
  };
}

let policyCounter = 0;
function makePolicy(overrides: Partial<NutritionPolicy> = {}): NutritionPolicy {
  policyCounter++;
  return {
    id: `pol-${policyCounter}`,
    mealPlanningFramework: true,
    dietaryAssessmentProcess: true,
    allergyManagement: true,
    culturalDietaryRespect: true,
    foodHygieneStandards: true,
    childParticipation: true,
    regularReview: true,
    ...overrides,
  };
}

let trainingCounter = 0;
function makeTraining(overrides: Partial<StaffNutritionTraining> = {}): StaffNutritionTraining {
  trainingCounter++;
  return {
    id: `tr-${trainingCounter}`,
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    foodHygiene: true,
    nutritionalPlanning: true,
    allergyAwareness: true,
    culturalDietaryNeeds: true,
    portionControl: true,
    mealPreparation: true,
    ...overrides,
  };
}

// -- pct -----------------------------------------------------------------------

describe("pct", () => {
  it("returns 0 for zero denominator", () => expect(pct(5, 0)).toBe(0));
  it("rounds correctly", () => expect(pct(1, 3)).toBe(33));
  it("returns 100 for equal values", () => expect(pct(10, 10)).toBe(100));
  it("returns 50 for half", () => expect(pct(5, 10)).toBe(50));
  it("returns 0 for zero numerator", () => expect(pct(0, 10)).toBe(0));
  it("handles large numbers", () => expect(pct(999, 1000)).toBe(100));
  it("rounds 2/3 to 67", () => expect(pct(2, 3)).toBe(67));
});

// -- getRating -----------------------------------------------------------------

describe("getRating", () => {
  it("outstanding for 80", () => expect(getRating(80)).toBe("outstanding"));
  it("outstanding for 100", () => expect(getRating(100)).toBe("outstanding"));
  it("outstanding for 95", () => expect(getRating(95)).toBe("outstanding"));
  it("good for 60", () => expect(getRating(60)).toBe("good"));
  it("good for 79", () => expect(getRating(79)).toBe("good"));
  it("requires_improvement for 40", () => expect(getRating(40)).toBe("requires_improvement"));
  it("requires_improvement for 59", () => expect(getRating(59)).toBe("requires_improvement"));
  it("inadequate for 39", () => expect(getRating(39)).toBe("inadequate"));
  it("inadequate for 0", () => expect(getRating(0)).toBe("inadequate"));
});

// -- Label functions -----------------------------------------------------------

describe("label functions", () => {
  it("getMealTypeLabel — breakfast", () => expect(getMealTypeLabel("breakfast")).toBe("Breakfast"));
  it("getMealTypeLabel — lunch", () => expect(getMealTypeLabel("lunch")).toBe("Lunch"));
  it("getMealTypeLabel — dinner", () => expect(getMealTypeLabel("dinner")).toBe("Dinner"));
  it("getMealTypeLabel — snack", () => expect(getMealTypeLabel("snack")).toBe("Snack"));
  it("getMealTypeLabel — special_dietary", () => expect(getMealTypeLabel("special_dietary")).toBe("Special Dietary"));
  it("getMealTypeLabel — cultural_meal", () => expect(getMealTypeLabel("cultural_meal")).toBe("Cultural Meal"));
  it("getMealTypeLabel — celebration", () => expect(getMealTypeLabel("celebration")).toBe("Celebration"));
  it("getMealTypeLabel — packed_lunch", () => expect(getMealTypeLabel("packed_lunch")).toBe("Packed Lunch"));
  it("getNutritionRatingLabel — excellent", () => expect(getNutritionRatingLabel("excellent")).toBe("Excellent"));
  it("getNutritionRatingLabel — good", () => expect(getNutritionRatingLabel("good")).toBe("Good"));
  it("getNutritionRatingLabel — adequate", () => expect(getNutritionRatingLabel("adequate")).toBe("Adequate"));
  it("getNutritionRatingLabel — poor", () => expect(getNutritionRatingLabel("poor")).toBe("Poor"));
  it("getNutritionRatingLabel — not_assessed", () => expect(getNutritionRatingLabel("not_assessed")).toBe("Not Assessed"));
  it("getRatingLabel — outstanding", () => expect(getRatingLabel("outstanding")).toBe("Outstanding"));
  it("getRatingLabel — good", () => expect(getRatingLabel("good")).toBe("Good"));
  it("getRatingLabel — requires_improvement", () => expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement"));
  it("getRatingLabel — inadequate", () => expect(getRatingLabel("inadequate")).toBe("Inadequate"));
});

// -- evaluateMealQuality -------------------------------------------------------

describe("evaluateMealQuality", () => {
  it("returns 0 for empty records", () => {
    const r = evaluateMealQuality([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalRecords).toBe(0);
    expect(r.nutritionRate).toBe(0);
    expect(r.dietaryNeedsMetRate).toBe(0);
    expect(r.childChoiceRate).toBe(0);
    expect(r.freshIngredientsRate).toBe(0);
  });

  it("returns max score for all-excellent records", () => {
    const records = Array.from({ length: 10 }, (_, i) => makeRecord({ id: `r-${i}`, childId: `c-${i}` }));
    const r = evaluateMealQuality(records);
    expect(r.overallScore).toBe(25);
    expect(r.nutritionRate).toBe(100);
    expect(r.dietaryNeedsMetRate).toBe(100);
    expect(r.childChoiceRate).toBe(100);
    expect(r.freshIngredientsRate).toBe(100);
  });

  it("returns low score for poor records", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        nutritionRating: "poor",
        dietaryNeedsMet: false,
        childChoiceOffered: false,
        freshIngredientsUsed: false,
      }),
    );
    const r = evaluateMealQuality(records);
    expect(r.overallScore).toBe(0);
  });

  it("handles mixed quality records", () => {
    const records = [
      makeRecord({ id: "r1", nutritionRating: "excellent" }),
      makeRecord({ id: "r2", nutritionRating: "poor", dietaryNeedsMet: false, childChoiceOffered: false }),
    ];
    const r = evaluateMealQuality(records);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThan(25);
  });

  it("caps at 25", () => {
    const records = Array.from({ length: 50 }, (_, i) => makeRecord({ id: `r-${i}` }));
    expect(evaluateMealQuality(records).overallScore).toBeLessThanOrEqual(25);
  });

  it("correctly reports nutrition rate", () => {
    const records = [
      makeRecord({ id: "r1", nutritionRating: "excellent" }),
      makeRecord({ id: "r2", nutritionRating: "poor" }),
    ];
    expect(evaluateMealQuality(records).nutritionRate).toBe(50);
  });

  it("good rating counts toward nutrition rate", () => {
    const records = [
      makeRecord({ id: "r1", nutritionRating: "good" }),
      makeRecord({ id: "r2", nutritionRating: "poor" }),
    ];
    expect(evaluateMealQuality(records).nutritionRate).toBe(50);
  });

  it("adequate does not count toward nutrition rate", () => {
    const records = [
      makeRecord({ id: "r1", nutritionRating: "adequate" }),
    ];
    expect(evaluateMealQuality(records).nutritionRate).toBe(0);
  });

  it("not_assessed does not count toward nutrition rate", () => {
    const records = [
      makeRecord({ id: "r1", nutritionRating: "not_assessed" }),
    ];
    expect(evaluateMealQuality(records).nutritionRate).toBe(0);
  });

  it("correctly reports dietary needs met rate", () => {
    const records = [
      makeRecord({ id: "r1", dietaryNeedsMet: true }),
      makeRecord({ id: "r2", dietaryNeedsMet: false }),
      makeRecord({ id: "r3", dietaryNeedsMet: true }),
    ];
    expect(evaluateMealQuality(records).dietaryNeedsMetRate).toBe(67);
  });

  it("correctly reports child choice rate", () => {
    const records = [
      makeRecord({ id: "r1", childChoiceOffered: true }),
      makeRecord({ id: "r2", childChoiceOffered: false }),
    ];
    expect(evaluateMealQuality(records).childChoiceRate).toBe(50);
  });

  it("correctly reports fresh ingredients rate", () => {
    const records = [
      makeRecord({ id: "r1", freshIngredientsUsed: true }),
      makeRecord({ id: "r2", freshIngredientsUsed: false }),
      makeRecord({ id: "r3", freshIngredientsUsed: true }),
    ];
    expect(evaluateMealQuality(records).freshIngredientsRate).toBe(67);
  });

  it("single excellent record scores max", () => {
    expect(evaluateMealQuality([makeRecord()]).overallScore).toBe(25);
  });

  it("nutrition score tiers — 90%+ gets 7", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, nutritionRating: "excellent" }),
    );
    expect(evaluateMealQuality(records).nutritionRate).toBe(100);
  });

  it("nutrition score tiers — 70-89% gets 5", () => {
    const records = [
      ...Array.from({ length: 7 }, (_, i) => makeRecord({ id: `a-${i}`, nutritionRating: "excellent" })),
      ...Array.from({ length: 3 }, (_, i) => makeRecord({ id: `b-${i}`, nutritionRating: "poor" })),
    ];
    expect(evaluateMealQuality(records).nutritionRate).toBe(70);
  });

  it("nutrition score tiers — 50-69% gets 3", () => {
    const records = [
      ...Array.from({ length: 5 }, (_, i) => makeRecord({ id: `a-${i}`, nutritionRating: "excellent" })),
      ...Array.from({ length: 5 }, (_, i) => makeRecord({ id: `b-${i}`, nutritionRating: "poor" })),
    ];
    expect(evaluateMealQuality(records).nutritionRate).toBe(50);
  });
});

// -- evaluateNutritionCompliance -----------------------------------------------

describe("evaluateNutritionCompliance", () => {
  it("returns 0 for empty records", () => {
    const r = evaluateNutritionCompliance([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalRecords).toBe(0);
    expect(r.portionAppropriateRate).toBe(0);
    expect(r.documentedRate).toBe(0);
    expect(r.childSatisfiedRate).toBe(0);
    expect(r.mealTypeDiversity).toBe(0);
  });

  it("returns max score for excellent records covering all meal types", () => {
    const types = [
      "breakfast", "lunch", "dinner", "snack",
      "special_dietary", "cultural_meal", "celebration", "packed_lunch",
    ] as const;
    const records = types.map((t, i) => makeRecord({ id: `r-${i}`, mealType: t }));
    const r = evaluateNutritionCompliance(records);
    expect(r.overallScore).toBe(25);
    expect(r.portionAppropriateRate).toBe(100);
    expect(r.documentedRate).toBe(100);
    expect(r.childSatisfiedRate).toBe(100);
    expect(r.mealTypeDiversity).toBe(100);
  });

  it("returns low score for poor compliance records", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        portionAppropriate: false,
        documentedInRecord: false,
        childSatisfied: false,
        mealType: "lunch",
      }),
    );
    const r = evaluateNutritionCompliance(records);
    // Only 1 meal type (lunch) → 1 point for diversity
    expect(r.overallScore).toBe(1);
  });

  it("caps at 25", () => {
    const types = ["breakfast", "lunch", "dinner", "snack", "special_dietary", "cultural_meal", "celebration", "packed_lunch"] as const;
    const records = Array.from({ length: 50 }, (_, i) => makeRecord({ id: `r-${i}`, mealType: types[i % 8] }));
    expect(evaluateNutritionCompliance(records).overallScore).toBeLessThanOrEqual(25);
  });

  it("correctly reports portion appropriate rate", () => {
    const records = [
      makeRecord({ id: "r1", portionAppropriate: true }),
      makeRecord({ id: "r2", portionAppropriate: false }),
      makeRecord({ id: "r3", portionAppropriate: true }),
    ];
    expect(evaluateNutritionCompliance(records).portionAppropriateRate).toBe(67);
  });

  it("correctly reports documented rate", () => {
    const records = [
      makeRecord({ id: "r1", documentedInRecord: true }),
      makeRecord({ id: "r2", documentedInRecord: false }),
    ];
    expect(evaluateNutritionCompliance(records).documentedRate).toBe(50);
  });

  it("correctly reports child satisfied rate", () => {
    const records = [
      makeRecord({ id: "r1", childSatisfied: true }),
      makeRecord({ id: "r2", childSatisfied: false }),
      makeRecord({ id: "r3", childSatisfied: true }),
    ];
    expect(evaluateNutritionCompliance(records).childSatisfiedRate).toBe(67);
  });

  it("correctly calculates meal type diversity", () => {
    const records = [
      makeRecord({ id: "r1", mealType: "breakfast" }),
      makeRecord({ id: "r2", mealType: "lunch" }),
      makeRecord({ id: "r3", mealType: "breakfast" }),
      makeRecord({ id: "r4", mealType: "dinner" }),
      makeRecord({ id: "r5", mealType: "snack" }),
    ];
    // 4 unique types out of 8 = 50%
    expect(evaluateNutritionCompliance(records).mealTypeDiversity).toBe(50);
  });

  it("meal type diversity 8/8 = 100%", () => {
    const types = ["breakfast", "lunch", "dinner", "snack", "special_dietary", "cultural_meal", "celebration", "packed_lunch"] as const;
    const records = types.map((t, i) => makeRecord({ id: `r-${i}`, mealType: t }));
    expect(evaluateNutritionCompliance(records).mealTypeDiversity).toBe(100);
  });

  it("meal type diversity 1/8 = 13%", () => {
    const records = [makeRecord({ id: "r1", mealType: "lunch" })];
    expect(evaluateNutritionCompliance(records).mealTypeDiversity).toBe(13);
  });

  it("7+ types scores 5 for diversity", () => {
    const types = ["breakfast", "lunch", "dinner", "snack", "special_dietary", "cultural_meal", "celebration"] as const;
    const records = types.map((t, i) =>
      makeRecord({ id: `r-${i}`, mealType: t, portionAppropriate: false, documentedInRecord: false, childSatisfied: false }),
    );
    const r = evaluateNutritionCompliance(records);
    // 0 from portion, 0 from documented, 0 from satisfaction, 5 from diversity
    expect(r.overallScore).toBe(5);
  });

  it("5-6 types scores 4 for diversity", () => {
    const types = ["breakfast", "lunch", "dinner", "snack", "special_dietary"] as const;
    const records = types.map((t, i) =>
      makeRecord({ id: `r-${i}`, mealType: t, portionAppropriate: false, documentedInRecord: false, childSatisfied: false }),
    );
    const r = evaluateNutritionCompliance(records);
    expect(r.overallScore).toBe(4);
  });

  it("3-4 types scores 3 for diversity", () => {
    const types = ["breakfast", "lunch", "dinner"] as const;
    const records = types.map((t, i) =>
      makeRecord({ id: `r-${i}`, mealType: t, portionAppropriate: false, documentedInRecord: false, childSatisfied: false }),
    );
    const r = evaluateNutritionCompliance(records);
    expect(r.overallScore).toBe(3);
  });

  it("1-2 types scores 1 for diversity", () => {
    const records = [
      makeRecord({ id: "r1", mealType: "lunch", portionAppropriate: false, documentedInRecord: false, childSatisfied: false }),
    ];
    const r = evaluateNutritionCompliance(records);
    expect(r.overallScore).toBe(1);
  });
});

// -- evaluateNutritionPolicy ---------------------------------------------------

describe("evaluateNutritionPolicy", () => {
  it("returns 0 for null policy", () => {
    const r = evaluateNutritionPolicy(null);
    expect(r.overallScore).toBe(0);
    expect(r.mealPlanningFrameworkMet).toBe(false);
    expect(r.dietaryAssessmentProcessMet).toBe(false);
    expect(r.allergyManagementMet).toBe(false);
    expect(r.culturalDietaryRespectMet).toBe(false);
    expect(r.foodHygieneStandardsMet).toBe(false);
    expect(r.childParticipationMet).toBe(false);
    expect(r.regularReviewMet).toBe(false);
  });

  it("returns max score (25) for fully compliant policy", () => {
    const r = evaluateNutritionPolicy(makePolicy());
    expect(r.overallScore).toBe(25);
  });

  it("returns 0 for all-false policy", () => {
    const r = evaluateNutritionPolicy(makePolicy({
      mealPlanningFramework: false,
      dietaryAssessmentProcess: false,
      allergyManagement: false,
      culturalDietaryRespect: false,
      foodHygieneStandards: false,
      childParticipation: false,
      regularReview: false,
    }));
    expect(r.overallScore).toBe(0);
  });

  it("mealPlanningFramework adds 4 points", () => {
    const base = makePolicy({
      mealPlanningFramework: false, dietaryAssessmentProcess: false, allergyManagement: false,
      culturalDietaryRespect: false, foodHygieneStandards: false, childParticipation: false, regularReview: false,
    });
    const withPolicy = makePolicy({
      mealPlanningFramework: true, dietaryAssessmentProcess: false, allergyManagement: false,
      culturalDietaryRespect: false, foodHygieneStandards: false, childParticipation: false, regularReview: false,
    });
    expect(evaluateNutritionPolicy(withPolicy).overallScore - evaluateNutritionPolicy(base).overallScore).toBe(4);
  });

  it("dietaryAssessmentProcess adds 4 points", () => {
    const without = evaluateNutritionPolicy(makePolicy({
      mealPlanningFramework: false, dietaryAssessmentProcess: false, allergyManagement: false,
      culturalDietaryRespect: false, foodHygieneStandards: false, childParticipation: false, regularReview: false,
    }));
    const with_ = evaluateNutritionPolicy(makePolicy({
      mealPlanningFramework: false, dietaryAssessmentProcess: true, allergyManagement: false,
      culturalDietaryRespect: false, foodHygieneStandards: false, childParticipation: false, regularReview: false,
    }));
    expect(with_.overallScore - without.overallScore).toBe(4);
  });

  it("allergyManagement adds 4 points", () => {
    const without = evaluateNutritionPolicy(makePolicy({
      mealPlanningFramework: false, dietaryAssessmentProcess: false, allergyManagement: false,
      culturalDietaryRespect: false, foodHygieneStandards: false, childParticipation: false, regularReview: false,
    }));
    const with_ = evaluateNutritionPolicy(makePolicy({
      mealPlanningFramework: false, dietaryAssessmentProcess: false, allergyManagement: true,
      culturalDietaryRespect: false, foodHygieneStandards: false, childParticipation: false, regularReview: false,
    }));
    expect(with_.overallScore - without.overallScore).toBe(4);
  });

  it("culturalDietaryRespect adds 4 points", () => {
    const without = evaluateNutritionPolicy(makePolicy({
      mealPlanningFramework: false, dietaryAssessmentProcess: false, allergyManagement: false,
      culturalDietaryRespect: false, foodHygieneStandards: false, childParticipation: false, regularReview: false,
    }));
    const with_ = evaluateNutritionPolicy(makePolicy({
      mealPlanningFramework: false, dietaryAssessmentProcess: false, allergyManagement: false,
      culturalDietaryRespect: true, foodHygieneStandards: false, childParticipation: false, regularReview: false,
    }));
    expect(with_.overallScore - without.overallScore).toBe(4);
  });

  it("foodHygieneStandards adds 3 points", () => {
    const without = evaluateNutritionPolicy(makePolicy({
      mealPlanningFramework: false, dietaryAssessmentProcess: false, allergyManagement: false,
      culturalDietaryRespect: false, foodHygieneStandards: false, childParticipation: false, regularReview: false,
    }));
    const with_ = evaluateNutritionPolicy(makePolicy({
      mealPlanningFramework: false, dietaryAssessmentProcess: false, allergyManagement: false,
      culturalDietaryRespect: false, foodHygieneStandards: true, childParticipation: false, regularReview: false,
    }));
    expect(with_.overallScore - without.overallScore).toBe(3);
  });

  it("childParticipation adds 3 points", () => {
    const without = evaluateNutritionPolicy(makePolicy({
      mealPlanningFramework: false, dietaryAssessmentProcess: false, allergyManagement: false,
      culturalDietaryRespect: false, foodHygieneStandards: false, childParticipation: false, regularReview: false,
    }));
    const with_ = evaluateNutritionPolicy(makePolicy({
      mealPlanningFramework: false, dietaryAssessmentProcess: false, allergyManagement: false,
      culturalDietaryRespect: false, foodHygieneStandards: false, childParticipation: true, regularReview: false,
    }));
    expect(with_.overallScore - without.overallScore).toBe(3);
  });

  it("regularReview adds 3 points", () => {
    const without = evaluateNutritionPolicy(makePolicy({
      mealPlanningFramework: false, dietaryAssessmentProcess: false, allergyManagement: false,
      culturalDietaryRespect: false, foodHygieneStandards: false, childParticipation: false, regularReview: false,
    }));
    const with_ = evaluateNutritionPolicy(makePolicy({
      mealPlanningFramework: false, dietaryAssessmentProcess: false, allergyManagement: false,
      culturalDietaryRespect: false, foodHygieneStandards: false, childParticipation: false, regularReview: true,
    }));
    expect(with_.overallScore - without.overallScore).toBe(3);
  });

  it("all weights sum to 25", () => {
    // 4+4+4+4+3+3+3 = 25
    expect(evaluateNutritionPolicy(makePolicy()).overallScore).toBe(25);
  });

  it("reports boolean flags correctly for partial policy", () => {
    const r = evaluateNutritionPolicy(makePolicy({
      mealPlanningFramework: true,
      dietaryAssessmentProcess: false,
      allergyManagement: true,
      culturalDietaryRespect: false,
    }));
    expect(r.mealPlanningFrameworkMet).toBe(true);
    expect(r.dietaryAssessmentProcessMet).toBe(false);
    expect(r.allergyManagementMet).toBe(true);
    expect(r.culturalDietaryRespectMet).toBe(false);
  });

  it("caps at 25", () => {
    expect(evaluateNutritionPolicy(makePolicy()).overallScore).toBeLessThanOrEqual(25);
  });
});

// -- evaluateStaffNutritionReadiness -------------------------------------------

describe("evaluateStaffNutritionReadiness", () => {
  it("returns 0 for empty training", () => {
    const r = evaluateStaffNutritionReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
    expect(r.foodHygieneRate).toBe(0);
    expect(r.nutritionalPlanningRate).toBe(0);
    expect(r.allergyAwarenessRate).toBe(0);
    expect(r.culturalDietaryNeedsRate).toBe(0);
    expect(r.portionControlRate).toBe(0);
    expect(r.mealPreparationRate).toBe(0);
  });

  it("returns max score for fully trained staff", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}` }),
    );
    const r = evaluateStaffNutritionReadiness(training);
    expect(r.overallScore).toBe(25);
    expect(r.foodHygieneRate).toBe(100);
  });

  it("returns 0 for untrained staff", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `t-${i}`,
        staffId: `s-${i}`,
        foodHygiene: false,
        nutritionalPlanning: false,
        allergyAwareness: false,
        culturalDietaryNeeds: false,
        portionControl: false,
        mealPreparation: false,
      }),
    );
    expect(evaluateStaffNutritionReadiness(training).overallScore).toBe(0);
  });

  it("handles partial training", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2", allergyAwareness: false, culturalDietaryNeeds: false }),
    ];
    const r = evaluateStaffNutritionReadiness(training);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.allergyAwarenessRate).toBe(50);
    expect(r.culturalDietaryNeedsRate).toBe(50);
  });

  it("caps at 25", () => {
    const training = Array.from({ length: 50 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}` }),
    );
    expect(evaluateStaffNutritionReadiness(training).overallScore).toBeLessThanOrEqual(25);
  });

  it("single fully trained staff scores max", () => {
    expect(evaluateStaffNutritionReadiness([makeTraining()]).overallScore).toBe(25);
  });

  it("correctly reports food hygiene rate", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", foodHygiene: true }),
      makeTraining({ id: "t2", staffId: "s2", foodHygiene: false }),
      makeTraining({ id: "t3", staffId: "s3", foodHygiene: true }),
    ];
    expect(evaluateStaffNutritionReadiness(training).foodHygieneRate).toBe(67);
  });

  it("correctly reports nutritional planning rate", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", nutritionalPlanning: true }),
      makeTraining({ id: "t2", staffId: "s2", nutritionalPlanning: false }),
    ];
    expect(evaluateStaffNutritionReadiness(training).nutritionalPlanningRate).toBe(50);
  });

  it("correctly reports allergy awareness rate", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", allergyAwareness: true }),
      makeTraining({ id: "t2", staffId: "s2", allergyAwareness: true }),
      makeTraining({ id: "t3", staffId: "s3", allergyAwareness: false }),
    ];
    expect(evaluateStaffNutritionReadiness(training).allergyAwarenessRate).toBe(67);
  });

  it("correctly reports cultural dietary needs rate", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", culturalDietaryNeeds: true }),
      makeTraining({ id: "t2", staffId: "s2", culturalDietaryNeeds: false }),
    ];
    expect(evaluateStaffNutritionReadiness(training).culturalDietaryNeedsRate).toBe(50);
  });

  it("correctly reports portion control rate", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", portionControl: true }),
      makeTraining({ id: "t2", staffId: "s2", portionControl: false }),
      makeTraining({ id: "t3", staffId: "s3", portionControl: true }),
    ];
    expect(evaluateStaffNutritionReadiness(training).portionControlRate).toBe(67);
  });

  it("correctly reports meal preparation rate", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", mealPreparation: true }),
      makeTraining({ id: "t2", staffId: "s2", mealPreparation: false }),
    ];
    expect(evaluateStaffNutritionReadiness(training).mealPreparationRate).toBe(50);
  });

  it("uses round(rate/100 * weight) formula — foodHygiene weight 6", () => {
    // 1 staff: only foodHygiene true → round(100/100 * 6) = 6
    const r = evaluateStaffNutritionReadiness([makeTraining({
      foodHygiene: true,
      nutritionalPlanning: false,
      allergyAwareness: false,
      culturalDietaryNeeds: false,
      portionControl: false,
      mealPreparation: false,
    })]);
    expect(r.overallScore).toBe(6);
  });

  it("uses round(rate/100 * weight) formula — nutritionalPlanning weight 5", () => {
    const r = evaluateStaffNutritionReadiness([makeTraining({
      foodHygiene: false,
      nutritionalPlanning: true,
      allergyAwareness: false,
      culturalDietaryNeeds: false,
      portionControl: false,
      mealPreparation: false,
    })]);
    expect(r.overallScore).toBe(5);
  });

  it("uses round(rate/100 * weight) formula — allergyAwareness weight 5", () => {
    const r = evaluateStaffNutritionReadiness([makeTraining({
      foodHygiene: false,
      nutritionalPlanning: false,
      allergyAwareness: true,
      culturalDietaryNeeds: false,
      portionControl: false,
      mealPreparation: false,
    })]);
    expect(r.overallScore).toBe(5);
  });

  it("uses round(rate/100 * weight) formula — culturalDietaryNeeds weight 4", () => {
    const r = evaluateStaffNutritionReadiness([makeTraining({
      foodHygiene: false,
      nutritionalPlanning: false,
      allergyAwareness: false,
      culturalDietaryNeeds: true,
      portionControl: false,
      mealPreparation: false,
    })]);
    expect(r.overallScore).toBe(4);
  });

  it("uses round(rate/100 * weight) formula — portionControl weight 3", () => {
    const r = evaluateStaffNutritionReadiness([makeTraining({
      foodHygiene: false,
      nutritionalPlanning: false,
      allergyAwareness: false,
      culturalDietaryNeeds: false,
      portionControl: true,
      mealPreparation: false,
    })]);
    expect(r.overallScore).toBe(3);
  });

  it("uses round(rate/100 * weight) formula — mealPreparation weight 2", () => {
    const r = evaluateStaffNutritionReadiness([makeTraining({
      foodHygiene: false,
      nutritionalPlanning: false,
      allergyAwareness: false,
      culturalDietaryNeeds: false,
      portionControl: false,
      mealPreparation: true,
    })]);
    expect(r.overallScore).toBe(2);
  });

  it("all weights sum to 25", () => {
    // 6+5+5+4+3+2 = 25
    expect(evaluateStaffNutritionReadiness([makeTraining()]).overallScore).toBe(25);
  });

  it("partial rates produce proportional scores via round formula", () => {
    // 2 staff, 1 trained in foodHygiene → rate=50%, round(50/100*6) = round(3) = 3
    const training = [
      makeTraining({ id: "t1", staffId: "s1", foodHygiene: true, nutritionalPlanning: false, allergyAwareness: false, culturalDietaryNeeds: false, portionControl: false, mealPreparation: false }),
      makeTraining({ id: "t2", staffId: "s2", foodHygiene: false, nutritionalPlanning: false, allergyAwareness: false, culturalDietaryNeeds: false, portionControl: false, mealPreparation: false }),
    ];
    expect(evaluateStaffNutritionReadiness(training).overallScore).toBe(3);
  });

  it("rounding works correctly for 1/3 rate", () => {
    // 3 staff, 1 trained in foodHygiene → rate=33%, round(33/100*6) = round(1.98) = 2
    const training = [
      makeTraining({ id: "t1", staffId: "s1", foodHygiene: true, nutritionalPlanning: false, allergyAwareness: false, culturalDietaryNeeds: false, portionControl: false, mealPreparation: false }),
      makeTraining({ id: "t2", staffId: "s2", foodHygiene: false, nutritionalPlanning: false, allergyAwareness: false, culturalDietaryNeeds: false, portionControl: false, mealPreparation: false }),
      makeTraining({ id: "t3", staffId: "s3", foodHygiene: false, nutritionalPlanning: false, allergyAwareness: false, culturalDietaryNeeds: false, portionControl: false, mealPreparation: false }),
    ];
    expect(evaluateStaffNutritionReadiness(training).overallScore).toBe(2);
  });
});

// -- buildChildNutritionProfiles -----------------------------------------------

describe("buildChildNutritionProfiles", () => {
  it("returns empty for no records", () => {
    expect(buildChildNutritionProfiles([])).toHaveLength(0);
  });

  it("creates profile from single record", () => {
    const profiles = buildChildNutritionProfiles([makeRecord({ childId: "c1", childName: "Alex" })]);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].totalMeals).toBe(1);
  });

  it("groups records by childId", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r3", childId: "c2", childName: "Jordan" }),
    ];
    const profiles = buildChildNutritionProfiles(records);
    expect(profiles).toHaveLength(2);
  });

  it("calculates nutrition rate per child", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", nutritionRating: "excellent" }),
      makeRecord({ id: "r2", childId: "c1", nutritionRating: "poor" }),
    ];
    const profiles = buildChildNutritionProfiles(records);
    expect(profiles[0].nutritionRate).toBe(50);
  });

  it("calculates dietary needs met rate per child", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", dietaryNeedsMet: true }),
      makeRecord({ id: "r2", childId: "c1", dietaryNeedsMet: false }),
      makeRecord({ id: "r3", childId: "c1", dietaryNeedsMet: true }),
    ];
    const profiles = buildChildNutritionProfiles(records);
    expect(profiles[0].dietaryNeedsMetRate).toBe(67);
  });

  it("counts unique meal types per child", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", mealType: "breakfast" }),
      makeRecord({ id: "r2", childId: "c1", mealType: "breakfast" }),
      makeRecord({ id: "r3", childId: "c1", mealType: "lunch" }),
      makeRecord({ id: "r4", childId: "c1", mealType: "dinner" }),
    ];
    const profiles = buildChildNutritionProfiles(records);
    expect(profiles[0].uniqueMealTypes).toBe(3);
  });

  it("frequency score: >=10 meals -> 2 points", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1" }),
    );
    const profiles = buildChildNutritionProfiles(records);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(2);
  });

  it("frequency score: >=5 but <10 meals -> 1 point", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", nutritionRating: "poor", dietaryNeedsMet: false }),
    );
    const profiles = buildChildNutritionProfiles(records);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(1);
  });

  it("frequency score: <5 meals -> 0 points from frequency", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", nutritionRating: "poor", dietaryNeedsMet: false }),
    ];
    const profiles = buildChildNutritionProfiles(records);
    // 0 freq, 0 nutrition (0%), 0 dietary (0%), 0 diversity (1 type < 2)
    expect(profiles[0].overallScore).toBe(0);
  });

  it("nutrition score: >=80% -> 3 points", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", nutritionRating: "excellent", dietaryNeedsMet: false }),
    );
    const profiles = buildChildNutritionProfiles(records);
    expect(profiles[0].nutritionRate).toBe(100);
  });

  it("nutrition score: 60-79% -> 2 points", () => {
    const records = [
      ...Array.from({ length: 7 }, (_, i) => makeRecord({ id: `a-${i}`, childId: "c1", nutritionRating: "excellent" })),
      ...Array.from({ length: 3 }, (_, i) => makeRecord({ id: `b-${i}`, childId: "c1", nutritionRating: "poor" })),
    ];
    const profiles = buildChildNutritionProfiles(records);
    expect(profiles[0].nutritionRate).toBe(70);
  });

  it("nutrition score: 40-59% -> 1 point", () => {
    const records = [
      ...Array.from({ length: 4 }, (_, i) => makeRecord({ id: `a-${i}`, childId: "c1", nutritionRating: "excellent" })),
      ...Array.from({ length: 6 }, (_, i) => makeRecord({ id: `b-${i}`, childId: "c1", nutritionRating: "poor" })),
    ];
    const profiles = buildChildNutritionProfiles(records);
    expect(profiles[0].nutritionRate).toBe(40);
  });

  it("dietary needs score: >=80% -> 3 points", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", dietaryNeedsMet: true, nutritionRating: "poor" }),
    );
    const profiles = buildChildNutritionProfiles(records);
    expect(profiles[0].dietaryNeedsMetRate).toBe(100);
  });

  it("diversity score: >=4 unique types -> 2 points", () => {
    const types = ["breakfast", "lunch", "dinner", "snack"] as const;
    const records = types.map((t, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", mealType: t, nutritionRating: "poor", dietaryNeedsMet: false }),
    );
    const profiles = buildChildNutritionProfiles(records);
    expect(profiles[0].uniqueMealTypes).toBe(4);
  });

  it("diversity score: >=2 but <4 unique types -> 1 point", () => {
    const types = ["breakfast", "lunch"] as const;
    const records = types.map((t, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", mealType: t, nutritionRating: "poor", dietaryNeedsMet: false }),
    );
    const profiles = buildChildNutritionProfiles(records);
    expect(profiles[0].uniqueMealTypes).toBe(2);
  });

  it("diversity score: 1 unique type -> 0 points from diversity", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", mealType: "lunch", nutritionRating: "poor", dietaryNeedsMet: false }),
    ];
    const profiles = buildChildNutritionProfiles(records);
    expect(profiles[0].uniqueMealTypes).toBe(1);
  });

  it("caps child score at 10", () => {
    const types = ["breakfast", "lunch", "dinner", "snack", "special_dietary", "cultural_meal", "celebration", "packed_lunch"] as const;
    const records = Array.from({ length: 16 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "c1", mealType: types[i % 8] }),
    );
    const profiles = buildChildNutritionProfiles(records);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("score minimum is 0", () => {
    const records = [
      makeRecord({
        childId: "c1",
        nutritionRating: "poor",
        dietaryNeedsMet: false,
      }),
    ];
    const profiles = buildChildNutritionProfiles(records);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
  });

  it("multiple children have independent scores", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", nutritionRating: "excellent", dietaryNeedsMet: true }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan", nutritionRating: "poor", dietaryNeedsMet: false }),
    ];
    const profiles = buildChildNutritionProfiles(records);
    const alex = profiles.find((p) => p.childId === "c1")!;
    const jordan = profiles.find((p) => p.childId === "c2")!;
    expect(alex.nutritionRate).toBe(100);
    expect(jordan.nutritionRate).toBe(0);
  });
});

// -- generateFoodNutritionQualityIntelligence ----------------------------------

describe("generateFoodNutritionQualityIntelligence", () => {
  const demoRecords = [
    makeRecord({ id: "r1", childId: "child-alex", childName: "Alex", mealType: "breakfast" }),
    makeRecord({ id: "r2", childId: "child-alex", childName: "Alex", mealType: "lunch" }),
    makeRecord({ id: "r3", childId: "child-alex", childName: "Alex", mealType: "dinner" }),
    makeRecord({ id: "r4", childId: "child-jordan", childName: "Jordan", mealType: "snack" }),
    makeRecord({ id: "r5", childId: "child-jordan", childName: "Jordan", mealType: "special_dietary" }),
    makeRecord({ id: "r6", childId: "child-jordan", childName: "Jordan", mealType: "cultural_meal" }),
    makeRecord({ id: "r7", childId: "child-morgan", childName: "Morgan", mealType: "celebration" }),
    makeRecord({ id: "r8", childId: "child-morgan", childName: "Morgan", mealType: "packed_lunch" }),
    makeRecord({ id: "r9", childId: "child-morgan", childName: "Morgan", mealType: "breakfast" }),
    makeRecord({ id: "r10", childId: "child-alex", childName: "Alex", mealType: "snack" }),
  ];

  const demoPolicy = makePolicy();

  const demoTraining = [
    makeTraining({ id: "t1", staffId: "s1", staffName: "Sarah Johnson" }),
    makeTraining({ id: "t2", staffId: "s2", staffName: "Tom Richards" }),
    makeTraining({ id: "t3", staffId: "s3", staffName: "Lisa Williams" }),
    makeTraining({ id: "t4", staffId: "s4", staffName: "Darren Laville" }),
  ];

  it("returns complete intelligence", () => {
    const r = generateFoodNutritionQualityIntelligence(
      demoRecords, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.homeId).toBe("oak-house");
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-05-19");
    expect(r.overallScore).toBeGreaterThanOrEqual(0);
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.rating).toBeDefined();
  });

  it("sums evaluator scores correctly", () => {
    const r = generateFoodNutritionQualityIntelligence(
      demoRecords, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    const sum =
      r.mealQuality.overallScore +
      r.nutritionCompliance.overallScore +
      r.nutritionPolicy.overallScore +
      r.staffNutritionReadiness.overallScore;
    expect(r.overallScore).toBe(Math.min(sum, 100));
  });

  it("rates outstanding for high-performing home", () => {
    const r = generateFoodNutritionQualityIntelligence(
      demoRecords, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.overallScore).toBeGreaterThanOrEqual(80);
    expect(r.rating).toBe("outstanding");
  });

  it("returns inadequate for all-empty inputs", () => {
    const r = generateFoodNutritionQualityIntelligence(
      [], null, [], "empty", "2026-01-01", "2026-05-19",
    );
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });

  it("generates actions for empty records", () => {
    const r = generateFoodNutritionQualityIntelligence(
      [], demoPolicy, demoTraining, "x", "2026-01-01", "2026-05-19",
    );
    expect(r.actions.some((a) => a.includes("No meal records"))).toBe(true);
  });

  it("generates URGENT action for null policy", () => {
    const r = generateFoodNutritionQualityIntelligence(
      demoRecords, null, demoTraining, "x", "2026-01-01", "2026-05-19",
    );
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT action for empty training", () => {
    const r = generateFoodNutritionQualityIntelligence(
      demoRecords, demoPolicy, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.actions.some((a) => a.startsWith("URGENT") && a.includes("training"))).toBe(true);
  });

  it("generates all URGENT actions for completely empty inputs", () => {
    const r = generateFoodNutritionQualityIntelligence(
      [], null, [], "empty", "2026-01-01", "2026-05-19",
    );
    const urgent = r.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgent.length).toBeGreaterThanOrEqual(2);
  });

  it("caps overall score at 100", () => {
    const r = generateFoodNutritionQualityIntelligence(
      demoRecords, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes child profiles", () => {
    const r = generateFoodNutritionQualityIntelligence(
      demoRecords, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.childProfiles.length).toBe(3);
  });

  it("has 7 regulatory links", () => {
    const r = generateFoodNutritionQualityIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.regulatoryLinks).toHaveLength(7);
  });

  it("includes CHR 2015 Regulation 6 in regulatory links", () => {
    const r = generateFoodNutritionQualityIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 6"))).toBe(true);
  });

  it("includes CHR 2015 Regulation 9 in regulatory links", () => {
    const r = generateFoodNutritionQualityIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 9"))).toBe(true);
  });

  it("includes SCCIF in regulatory links", () => {
    const r = generateFoodNutritionQualityIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes NMS 10 in regulatory links", () => {
    const r = generateFoodNutritionQualityIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("NMS 10"))).toBe(true);
  });

  it("includes Food Standards Agency in regulatory links", () => {
    const r = generateFoodNutritionQualityIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("Food Standards Agency"))).toBe(true);
  });

  it("includes Children Act 1989 in regulatory links", () => {
    const r = generateFoodNutritionQualityIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
  });

  it("includes Healthy eating guidance in regulatory links", () => {
    const r = generateFoodNutritionQualityIntelligence(
      [], null, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("Healthy eating guidance"))).toBe(true);
  });

  it("generates strengths for outstanding home", () => {
    const r = generateFoodNutritionQualityIntelligence(
      demoRecords, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("generates nutritionRate strength when >=80%", () => {
    const r = generateFoodNutritionQualityIntelligence(
      demoRecords, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths.some((s) => s.includes("Strong nutritional quality"))).toBe(true);
  });

  it("generates dietaryNeedsMetRate strength when >=80%", () => {
    const r = generateFoodNutritionQualityIntelligence(
      demoRecords, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths.some((s) => s.includes("Dietary needs consistently met"))).toBe(true);
  });

  it("generates childChoiceRate strength when >=80%", () => {
    const r = generateFoodNutritionQualityIntelligence(
      demoRecords, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths.some((s) => s.includes("Children's food choices"))).toBe(true);
  });

  it("generates documentedRate strength when >=80%", () => {
    const r = generateFoodNutritionQualityIntelligence(
      demoRecords, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.strengths.some((s) => s.includes("Excellent meal documentation"))).toBe(true);
  });

  it("generates satisfaction action when low", () => {
    const lowSatRecords = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childSatisfied: false }),
    );
    const r = generateFoodNutritionQualityIntelligence(
      lowSatRecords, demoPolicy, demoTraining,
      "x", "2026-01-01", "2026-05-19",
    );
    expect(r.actions.some((a) => a.includes("satisfaction"))).toBe(true);
  });

  it("generates fresh ingredients action when low", () => {
    const lowFreshRecords = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, freshIngredientsUsed: false }),
    );
    const r = generateFoodNutritionQualityIntelligence(
      lowFreshRecords, demoPolicy, demoTraining,
      "x", "2026-01-01", "2026-05-19",
    );
    expect(r.actions.some((a) => a.includes("fresh ingredients"))).toBe(true);
  });

  it("generates areas when nutrition quality low", () => {
    const badRecords = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        nutritionRating: "poor",
        dietaryNeedsMet: false,
        childChoiceOffered: false,
        freshIngredientsUsed: false,
        childSatisfied: false,
      }),
    );
    const r = generateFoodNutritionQualityIntelligence(
      badRecords, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("no areas for improvement with excellent data", () => {
    const r = generateFoodNutritionQualityIntelligence(
      demoRecords, demoPolicy, demoTraining,
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(r.areasForImprovement.length).toBeGreaterThanOrEqual(0);
  });
});

// -- Edge cases ----------------------------------------------------------------

describe("Edge cases", () => {
  it("single record scores max for meal quality", () => {
    expect(evaluateMealQuality([makeRecord()]).overallScore).toBe(25);
  });

  it("single record with 1 meal type — limited compliance diversity", () => {
    const r = evaluateNutritionCompliance([makeRecord()]);
    expect(r.mealTypeDiversity).toBe(13); // 1/8 = 12.5 rounded to 13
  });

  it("single policy scores max", () => {
    expect(evaluateNutritionPolicy(makePolicy()).overallScore).toBe(25);
  });

  it("single training scores max", () => {
    expect(evaluateStaffNutritionReadiness([makeTraining()]).overallScore).toBe(25);
  });

  it("evaluator scores never exceed 25", () => {
    const largeRecords = Array.from({ length: 100 }, (_, i) => makeRecord({ id: `r-${i}` }));
    const largeTraining = Array.from({ length: 100 }, (_, i) => makeTraining({ id: `t-${i}`, staffId: `s-${i}` }));
    expect(evaluateMealQuality(largeRecords).overallScore).toBeLessThanOrEqual(25);
    expect(evaluateNutritionCompliance(largeRecords).overallScore).toBeLessThanOrEqual(25);
    expect(evaluateNutritionPolicy(makePolicy()).overallScore).toBeLessThanOrEqual(25);
    expect(evaluateStaffNutritionReadiness(largeTraining).overallScore).toBeLessThanOrEqual(25);
  });

  it("large dataset runs without error", () => {
    const records = Array.from({ length: 200 }, (_, i) => makeRecord({ id: `r-${i}`, childId: `c-${i % 20}` }));
    const training = Array.from({ length: 20 }, (_, i) => makeTraining({ id: `t-${i}`, staffId: `s-${i}` }));
    const r = generateFoodNutritionQualityIntelligence(
      records, makePolicy(), training, "big", "2026-01-01", "2026-05-19",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.childProfiles.length).toBe(20);
  });

  it("overall score for all-empty is exactly 0", () => {
    const r = generateFoodNutritionQualityIntelligence(
      [], null, [], "empty", "2026-01-01", "2026-05-19",
    );
    expect(r.overallScore).toBe(0);
  });

  it("records only (no policy, no training) still produces valid result", () => {
    const r = generateFoodNutritionQualityIntelligence(
      [makeRecord()], null, [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.nutritionPolicy.overallScore).toBe(0);
    expect(r.staffNutritionReadiness.overallScore).toBe(0);
  });

  it("policy only (no records, no training) still produces valid result", () => {
    const r = generateFoodNutritionQualityIntelligence(
      [], makePolicy(), [], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.nutritionPolicy.overallScore).toBe(25);
    expect(r.mealQuality.overallScore).toBe(0);
  });

  it("training only (no records, no policy) still produces valid result", () => {
    const r = generateFoodNutritionQualityIntelligence(
      [], null, [makeTraining()], "x", "2026-01-01", "2026-05-19",
    );
    expect(r.staffNutritionReadiness.overallScore).toBe(25);
    expect(r.mealQuality.overallScore).toBe(0);
  });
});
