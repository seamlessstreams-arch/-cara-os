import { describe, it, expect } from "vitest";
import {
  computeNutritionMetrics,
  identifyNutritionAlerts,
  type DietaryProfile,
  type MealRecord,
  type HygieneCheck,
} from "./food-nutrition-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeProfile(overrides: Partial<DietaryProfile> = {}): DietaryProfile {
  return {
    id: "prof-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex",
    dietary_requirements: ["none"],
    allergies: [],
    intolerances: [],
    cultural_dietary_needs: null,
    religious_dietary_needs: null,
    food_preferences: ["pasta"],
    food_dislikes: ["sprouts"],
    nutritional_concerns: null,
    eating_support_needed: null,
    medical_dietary_plan: false,
    medical_plan_details: null,
    last_reviewed_date: null,
    reviewed_by: null,
    next_review_date: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

function makeMeal(overrides: Partial<MealRecord> = {}): MealRecord {
  return {
    id: "meal-1",
    home_id: "home-1",
    meal_date: "2026-05-20",
    meal_type: "lunch",
    menu_description: "Pasta bolognese",
    prepared_by: "Cook A",
    children_present: ["child-1"],
    satisfaction_ratings: [
      { child_id: "child-1", child_name: "Alex", rating: "loved_it", comments: "" },
    ],
    alternative_meals_provided: false,
    alternative_details: null,
    food_waste_level: "low",
    notes: null,
    created_at: "2026-05-20T12:00:00Z",
    ...overrides,
  };
}

function makeHygiene(overrides: Partial<HygieneCheck> = {}): HygieneCheck {
  return {
    id: "hyg-1",
    home_id: "home-1",
    check_date: "2026-05-20",
    checked_by: "Staff A",
    fridge_temp_ok: true,
    freezer_temp_ok: true,
    food_storage_ok: true,
    kitchen_cleanliness: "pass",
    food_prep_areas: "pass",
    hand_washing_facilities: "pass",
    overall_result: "pass",
    issues_found: null,
    corrective_action: null,
    follow_up_date: null,
    follow_up_completed: false,
    notes: null,
    created_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

// ── computeNutritionMetrics ─────────────────────────────────────────────

describe("computeNutritionMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeNutritionMetrics([], [], [], 4);
    expect(result.profiles_complete).toBe(0);
    expect(result.children_with_allergies).toBe(0);
    expect(result.meals_this_week).toBe(0);
    expect(result.avg_satisfaction_score).toBeNull(); // fab-0.
    expect(result.food_waste_rate).toBeNull(); // fab-0.
    expect(result.hygiene_pass_rate).toBeNull(); // fab-0.
    expect(result.alternative_meals_rate).toBeNull(); // fab-0.
  });

  it("computes satisfaction scores and waste rates", () => {
    const meals = [
      makeMeal({
        id: "m1",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alex", rating: "loved_it", comments: "" },   // 5
          { child_id: "c2", child_name: "Ben", rating: "refused", comments: "" },     // 1
        ],
        food_waste_level: "high",
        alternative_meals_provided: true,
      }),
      makeMeal({
        id: "m2",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alex", rating: "okay", comments: "" },       // 3
        ],
        food_waste_level: "low",
        alternative_meals_provided: false,
      }),
    ];
    const result = computeNutritionMetrics([], meals, [], 4);
    // (5 + 1 + 3) / 3 = 3.0
    expect(result.avg_satisfaction_score).toBe(3);
    // 1 high/moderate out of 2 with waste = 50%
    expect(result.food_waste_rate).toBe(50);
    // 1 alternative out of 2 meals = 50%
    expect(result.alternative_meals_rate).toBe(50);
  });

  it("counts profiles with allergies and dietary requirements", () => {
    const profiles = [
      makeProfile({ id: "p1", allergies: ["nuts"], dietary_requirements: ["halal", "nut_allergy"] }),
      makeProfile({ id: "p2", child_id: "child-2", allergies: [], dietary_requirements: ["none"] }),
    ];
    const result = computeNutritionMetrics(profiles, [], [], 4);
    expect(result.profiles_complete).toBe(2);
    expect(result.children_with_allergies).toBe(1);
    expect(result.by_dietary_requirement).toEqual({ halal: 1, nut_allergy: 1 });
  });

  it("calculates hygiene pass rate", () => {
    const checks = [
      makeHygiene({ id: "h1", overall_result: "pass" }),
      makeHygiene({ id: "h2", overall_result: "fail" }),
    ];
    const result = computeNutritionMetrics([], [], checks, 4);
    expect(result.hygiene_pass_rate).toBe(50);
  });
});

// ── identifyNutritionAlerts ─────────────────────────────────────────────

describe("identifyNutritionAlerts", () => {
  it("returns empty alerts for empty data with 0 totalChildren", () => {
    const alerts = identifyNutritionAlerts([], [], [], 0, NOW);
    expect(alerts).toEqual([]);
  });

  it("triggers missing_dietary_profile when totalChildren > profiles", () => {
    const profiles = [makeProfile({ child_id: "child-1" })];
    const alerts = identifyNutritionAlerts(profiles, [], [], 4, NOW);
    const missing = alerts.find((a) => a.type === "missing_dietary_profile");
    expect(missing).toBeDefined();
    expect(missing!.severity).toBe("high");
    expect(missing!.message).toContain("3");
  });

  it("triggers profile_review_overdue medium alert", () => {
    const profiles = [makeProfile({ next_review_date: "2026-04-01" })];
    const alerts = identifyNutritionAlerts(profiles, [], [], 4, NOW);
    const overdue = alerts.find((a) => a.type === "profile_review_overdue");
    expect(overdue).toBeDefined();
    expect(overdue!.severity).toBe("medium");
  });

  it("triggers medical_plan_no_details high alert", () => {
    const profiles = [makeProfile({ medical_dietary_plan: true, medical_plan_details: null })];
    const alerts = identifyNutritionAlerts(profiles, [], [], 4, NOW);
    const noPlan = alerts.find((a) => a.type === "medical_plan_no_details");
    expect(noPlan).toBeDefined();
    expect(noPlan!.severity).toBe("high");
  });

  it("triggers hygiene_fail critical alert", () => {
    const checks = [makeHygiene({ overall_result: "fail" })];
    const alerts = identifyNutritionAlerts([], [], checks, 0, NOW);
    const fail = alerts.find((a) => a.type === "hygiene_fail");
    expect(fail).toBeDefined();
    expect(fail!.severity).toBe("critical");
  });

  it("triggers hygiene_major_issue high alert", () => {
    const checks = [makeHygiene({ overall_result: "major_issue" })];
    const alerts = identifyNutritionAlerts([], [], checks, 0, NOW);
    const major = alerts.find((a) => a.type === "hygiene_major_issue");
    expect(major).toBeDefined();
    expect(major!.severity).toBe("high");
  });

  it("triggers hygiene_follow_up_overdue high alert", () => {
    const checks = [makeHygiene({ follow_up_date: "2026-04-01", follow_up_completed: false })];
    const alerts = identifyNutritionAlerts([], [], checks, 0, NOW);
    const followUp = alerts.find((a) => a.type === "hygiene_follow_up_overdue");
    expect(followUp).toBeDefined();
    expect(followUp!.severity).toBe("high");
  });

  it("triggers frequent_meal_refusal medium alert when >= 3 refusals", () => {
    const meals: MealRecord[] = Array.from({ length: 4 }, (_, i) =>
      makeMeal({
        id: `meal-${i}`,
        meal_date: `2026-05-${20 - i}`,
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alex", rating: "refused", comments: "" },
        ],
      }),
    );
    const alerts = identifyNutritionAlerts([], meals, [], 0, NOW);
    const refusal = alerts.find((a) => a.type === "frequent_meal_refusal");
    expect(refusal).toBeDefined();
    expect(refusal!.severity).toBe("medium");
  });
});
