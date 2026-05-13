// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FOOD & NUTRITION SERVICE TESTS
// Pure-function unit tests for nutrition metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 9 (promoting good health — including
// nutritional needs), Reg 6 (quality of care — providing nourishing food),
// Reg 7 (children's views on menus), Reg 10 (dignity — dietary/cultural
// preferences).
// SCCIF: Children's Experiences — "Children eat well and enjoy their meals."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  DIETARY_REQUIREMENTS,
  MEAL_TYPES,
  SATISFACTION_RATINGS,
  HYGIENE_CHECK_RESULTS,
  listProfiles,
  createProfile,
  updateProfile,
  listMeals,
  createMeal,
  listHygieneChecks,
  createHygieneCheck,
} from "../food-nutrition-service";

import type {
  DietaryProfile,
  MealRecord,
  HygieneCheck,
  DietaryRequirement,
} from "../food-nutrition-service";

const { computeNutritionMetrics, identifyNutritionAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Date string N days in the future from now. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal DietaryProfile with sensible defaults. */
function makeProfile(overrides: Partial<DietaryProfile> = {}): DietaryProfile {
  return {
    id: "profile-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alice Smith",
    dietary_requirements: ["none"] as DietaryRequirement[],
    allergies: [],
    intolerances: [],
    cultural_dietary_needs: null,
    religious_dietary_needs: null,
    food_preferences: [],
    food_dislikes: [],
    nutritional_concerns: null,
    eating_support_needed: null,
    medical_dietary_plan: false,
    medical_plan_details: null,
    last_reviewed_date: daysAgo(30),
    reviewed_by: "staff-1",
    next_review_date: daysFromNow(150),
    created_at: daysAgoISO(60),
    updated_at: daysAgoISO(30),
    ...overrides,
  };
}

/** Build a minimal MealRecord with sensible defaults. */
function makeMeal(overrides: Partial<MealRecord> = {}): MealRecord {
  return {
    id: "meal-1",
    home_id: "home-1",
    meal_date: daysAgo(1),
    meal_type: "lunch",
    menu_description: "Spaghetti bolognese with salad",
    prepared_by: "staff-1",
    children_present: ["child-1", "child-2"],
    satisfaction_ratings: [
      { child_id: "child-1", child_name: "Alice Smith", rating: "loved_it", comments: "Great!" },
      { child_id: "child-2", child_name: "Bob Jones", rating: "liked_it", comments: "" },
    ],
    alternative_meals_provided: false,
    alternative_details: null,
    food_waste_level: "low",
    notes: null,
    created_at: daysAgoISO(1),
    ...overrides,
  };
}

/** Build a minimal HygieneCheck with sensible defaults. */
function makeHygiene(overrides: Partial<HygieneCheck> = {}): HygieneCheck {
  return {
    id: "hygiene-1",
    home_id: "home-1",
    check_date: daysAgo(3),
    checked_by: "staff-1",
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
    created_at: daysAgoISO(3),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("DIETARY_REQUIREMENTS", () => {
  it("has exactly 14 entries", () => {
    expect(DIETARY_REQUIREMENTS).toHaveLength(14);
  });

  it("contains unique requirement values", () => {
    const values = DIETARY_REQUIREMENTS.map((d) => d.requirement);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = DIETARY_REQUIREMENTS.map((d) => d.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes none", () => {
    expect(DIETARY_REQUIREMENTS.find((d) => d.requirement === "none")).toBeTruthy();
  });

  it("includes vegetarian", () => {
    expect(DIETARY_REQUIREMENTS.find((d) => d.requirement === "vegetarian")).toBeTruthy();
  });

  it("includes vegan", () => {
    expect(DIETARY_REQUIREMENTS.find((d) => d.requirement === "vegan")).toBeTruthy();
  });

  it("includes halal", () => {
    expect(DIETARY_REQUIREMENTS.find((d) => d.requirement === "halal")).toBeTruthy();
  });

  it("includes kosher", () => {
    expect(DIETARY_REQUIREMENTS.find((d) => d.requirement === "kosher")).toBeTruthy();
  });

  it("includes gluten_free", () => {
    expect(DIETARY_REQUIREMENTS.find((d) => d.requirement === "gluten_free")).toBeTruthy();
  });

  it("includes dairy_free", () => {
    expect(DIETARY_REQUIREMENTS.find((d) => d.requirement === "dairy_free")).toBeTruthy();
  });

  it("includes nut_allergy", () => {
    expect(DIETARY_REQUIREMENTS.find((d) => d.requirement === "nut_allergy")).toBeTruthy();
  });

  it("includes egg_allergy", () => {
    expect(DIETARY_REQUIREMENTS.find((d) => d.requirement === "egg_allergy")).toBeTruthy();
  });

  it("includes soy_allergy", () => {
    expect(DIETARY_REQUIREMENTS.find((d) => d.requirement === "soy_allergy")).toBeTruthy();
  });

  it("includes diabetic", () => {
    expect(DIETARY_REQUIREMENTS.find((d) => d.requirement === "diabetic")).toBeTruthy();
  });

  it("includes low_sugar", () => {
    expect(DIETARY_REQUIREMENTS.find((d) => d.requirement === "low_sugar")).toBeTruthy();
  });

  it("includes high_calorie", () => {
    expect(DIETARY_REQUIREMENTS.find((d) => d.requirement === "high_calorie")).toBeTruthy();
  });

  it("includes other", () => {
    expect(DIETARY_REQUIREMENTS.find((d) => d.requirement === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const d of DIETARY_REQUIREMENTS) {
      expect(d.label.length).toBeGreaterThan(0);
    }
  });
});

describe("MEAL_TYPES", () => {
  it("has exactly 7 entries", () => {
    expect(MEAL_TYPES).toHaveLength(7);
  });

  it("contains unique type values", () => {
    const values = MEAL_TYPES.map((m) => m.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = MEAL_TYPES.map((m) => m.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes breakfast", () => {
    expect(MEAL_TYPES.find((m) => m.type === "breakfast")).toBeTruthy();
  });

  it("includes lunch", () => {
    expect(MEAL_TYPES.find((m) => m.type === "lunch")).toBeTruthy();
  });

  it("includes dinner", () => {
    expect(MEAL_TYPES.find((m) => m.type === "dinner")).toBeTruthy();
  });

  it("includes special_occasion", () => {
    expect(MEAL_TYPES.find((m) => m.type === "special_occasion")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const m of MEAL_TYPES) {
      expect(m.label.length).toBeGreaterThan(0);
    }
  });
});

describe("SATISFACTION_RATINGS", () => {
  it("has exactly 5 entries", () => {
    expect(SATISFACTION_RATINGS).toHaveLength(5);
  });

  it("contains unique rating values", () => {
    const values = SATISFACTION_RATINGS.map((s) => s.rating);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = SATISFACTION_RATINGS.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes loved_it", () => {
    expect(SATISFACTION_RATINGS.find((s) => s.rating === "loved_it")).toBeTruthy();
  });

  it("includes refused", () => {
    expect(SATISFACTION_RATINGS.find((s) => s.rating === "refused")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of SATISFACTION_RATINGS) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("HYGIENE_CHECK_RESULTS", () => {
  it("has exactly 4 entries", () => {
    expect(HYGIENE_CHECK_RESULTS).toHaveLength(4);
  });

  it("contains unique result values", () => {
    const values = HYGIENE_CHECK_RESULTS.map((h) => h.result);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = HYGIENE_CHECK_RESULTS.map((h) => h.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes pass", () => {
    expect(HYGIENE_CHECK_RESULTS.find((h) => h.result === "pass")).toBeTruthy();
  });

  it("includes fail", () => {
    expect(HYGIENE_CHECK_RESULTS.find((h) => h.result === "fail")).toBeTruthy();
  });

  it("includes minor_issue", () => {
    expect(HYGIENE_CHECK_RESULTS.find((h) => h.result === "minor_issue")).toBeTruthy();
  });

  it("includes major_issue", () => {
    expect(HYGIENE_CHECK_RESULTS.find((h) => h.result === "major_issue")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const h of HYGIENE_CHECK_RESULTS) {
      expect(h.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeNutritionMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeNutritionMetrics", () => {
  it("returns zeroed metrics for empty arrays", () => {
    const m = computeNutritionMetrics([], [], [], 0);
    expect(m.profiles_complete).toBe(0);
    expect(m.children_with_allergies).toBe(0);
    expect(m.meals_this_week).toBe(0);
    expect(m.avg_satisfaction_score).toBe(0);
    expect(m.food_waste_rate).toBe(0);
    expect(m.hygiene_pass_rate).toBe(0);
    expect(m.overdue_profile_reviews).toBe(0);
    expect(Object.keys(m.by_meal_type)).toHaveLength(0);
    expect(Object.keys(m.by_dietary_requirement)).toHaveLength(0);
    expect(m.alternative_meals_rate).toBe(0);
  });

  // ── profiles_complete ───────────────────────────────────────────────

  it("profiles_complete equals the number of profiles", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1" }),
      makeProfile({ id: "p2", child_id: "c2" }),
      makeProfile({ id: "p3", child_id: "c3" }),
    ];
    const m = computeNutritionMetrics(profiles, [], [], 5);
    expect(m.profiles_complete).toBe(3);
  });

  it("profiles_complete is 0 when no profiles provided", () => {
    const m = computeNutritionMetrics([], [], [], 4);
    expect(m.profiles_complete).toBe(0);
  });

  it("profiles_complete counts 1 for single profile", () => {
    const m = computeNutritionMetrics([makeProfile()], [], [], 1);
    expect(m.profiles_complete).toBe(1);
  });

  // ── children_with_allergies ─────────────────────────────────────────

  it("children_with_allergies counts profiles with non-empty allergies array", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", allergies: ["peanuts"] }),
      makeProfile({ id: "p2", child_id: "c2", allergies: [] }),
      makeProfile({ id: "p3", child_id: "c3", allergies: ["dairy", "eggs"] }),
    ];
    const m = computeNutritionMetrics(profiles, [], [], 3);
    expect(m.children_with_allergies).toBe(2);
  });

  it("children_with_allergies is 0 when no profiles have allergies", () => {
    const profiles = [
      makeProfile({ id: "p1", allergies: [] }),
      makeProfile({ id: "p2", child_id: "c2", allergies: [] }),
    ];
    const m = computeNutritionMetrics(profiles, [], [], 2);
    expect(m.children_with_allergies).toBe(0);
  });

  it("children_with_allergies counts all when every profile has allergies", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", allergies: ["nuts"] }),
      makeProfile({ id: "p2", child_id: "c2", allergies: ["gluten"] }),
    ];
    const m = computeNutritionMetrics(profiles, [], [], 2);
    expect(m.children_with_allergies).toBe(2);
  });

  // ── meals_this_week ─────────────────────────────────────────────────

  it("meals_this_week counts meals within last 7 days", () => {
    const meals = [
      makeMeal({ id: "m1", meal_date: daysAgo(1) }),
      makeMeal({ id: "m2", meal_date: daysAgo(5) }),
      makeMeal({ id: "m3", meal_date: daysAgo(10) }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.meals_this_week).toBe(2);
  });

  it("meals_this_week is 0 when all meals are older than 7 days", () => {
    const meals = [
      makeMeal({ id: "m1", meal_date: daysAgo(10) }),
      makeMeal({ id: "m2", meal_date: daysAgo(30) }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.meals_this_week).toBe(0);
  });

  it("meals_this_week counts all when all meals are recent", () => {
    const meals = [
      makeMeal({ id: "m1", meal_date: daysAgo(0) }),
      makeMeal({ id: "m2", meal_date: daysAgo(2) }),
      makeMeal({ id: "m3", meal_date: daysAgo(6) }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.meals_this_week).toBe(3);
  });

  // ── avg_satisfaction_score ──────────────────────────────────────────

  it("avg_satisfaction_score is 5 when all ratings are loved_it", () => {
    const meals = [
      makeMeal({
        id: "m1",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "loved_it", comments: "" },
          { child_id: "c2", child_name: "Bob", rating: "loved_it", comments: "" },
        ],
      }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.avg_satisfaction_score).toBe(5);
  });

  it("avg_satisfaction_score is 1 when all ratings are refused", () => {
    const meals = [
      makeMeal({
        id: "m1",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "refused", comments: "" },
        ],
      }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.avg_satisfaction_score).toBe(1);
  });

  it("avg_satisfaction_score averages mixed ratings correctly", () => {
    const meals = [
      makeMeal({
        id: "m1",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "loved_it", comments: "" }, // 5
          { child_id: "c2", child_name: "Bob", rating: "okay", comments: "" },       // 3
        ],
      }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    // (5+3)/2 = 4.0
    expect(m.avg_satisfaction_score).toBe(4);
  });

  it("avg_satisfaction_score is 0 when no meals exist", () => {
    const m = computeNutritionMetrics([], [], [], 0);
    expect(m.avg_satisfaction_score).toBe(0);
  });

  it("avg_satisfaction_score is 0 when meals have empty satisfaction_ratings", () => {
    const meals = [
      makeMeal({ id: "m1", satisfaction_ratings: [] }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.avg_satisfaction_score).toBe(0);
  });

  it("avg_satisfaction_score rounds to one decimal", () => {
    const meals = [
      makeMeal({
        id: "m1",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "loved_it", comments: "" },  // 5
          { child_id: "c2", child_name: "Bob", rating: "liked_it", comments: "" },    // 4
          { child_id: "c3", child_name: "Charlie", rating: "okay", comments: "" },    // 3
        ],
      }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    // (5+4+3)/3 = 4.0
    expect(m.avg_satisfaction_score).toBe(4);
  });

  it("avg_satisfaction_score across multiple meals", () => {
    const meals = [
      makeMeal({
        id: "m1",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "loved_it", comments: "" },  // 5
        ],
      }),
      makeMeal({
        id: "m2",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "refused", comments: "" },   // 1
        ],
      }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    // (5+1)/2 = 3.0
    expect(m.avg_satisfaction_score).toBe(3);
  });

  it("avg_satisfaction_score for liked_it is 4", () => {
    const meals = [
      makeMeal({
        id: "m1",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "liked_it", comments: "" },
        ],
      }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.avg_satisfaction_score).toBe(4);
  });

  it("avg_satisfaction_score for didnt_like is 2", () => {
    const meals = [
      makeMeal({
        id: "m1",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "didnt_like", comments: "" },
        ],
      }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.avg_satisfaction_score).toBe(2);
  });

  it("avg_satisfaction_score with non-round result", () => {
    const meals = [
      makeMeal({
        id: "m1",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "loved_it", comments: "" },    // 5
          { child_id: "c2", child_name: "Bob", rating: "liked_it", comments: "" },      // 4
          { child_id: "c3", child_name: "Charlie", rating: "didnt_like", comments: "" }, // 2
        ],
      }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    // (5+4+2)/3 = 3.666... => 3.7
    expect(m.avg_satisfaction_score).toBe(3.7);
  });

  // ── food_waste_rate ─────────────────────────────────────────────────

  it("food_waste_rate is 0 when no meals have waste data", () => {
    const meals = [
      makeMeal({ id: "m1", food_waste_level: null }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.food_waste_rate).toBe(0);
  });

  it("food_waste_rate is 0 when all meals have none or low waste", () => {
    const meals = [
      makeMeal({ id: "m1", food_waste_level: "none" }),
      makeMeal({ id: "m2", food_waste_level: "low" }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.food_waste_rate).toBe(0);
  });

  it("food_waste_rate is 100 when all meals have moderate or high waste", () => {
    const meals = [
      makeMeal({ id: "m1", food_waste_level: "moderate" }),
      makeMeal({ id: "m2", food_waste_level: "high" }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.food_waste_rate).toBe(100);
  });

  it("food_waste_rate calculates correctly for mixed waste levels", () => {
    const meals = [
      makeMeal({ id: "m1", food_waste_level: "none" }),
      makeMeal({ id: "m2", food_waste_level: "low" }),
      makeMeal({ id: "m3", food_waste_level: "moderate" }),
      makeMeal({ id: "m4", food_waste_level: "high" }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    // 2 out of 4 with waste data = 50%
    expect(m.food_waste_rate).toBe(50);
  });

  it("food_waste_rate ignores meals with null food_waste_level", () => {
    const meals = [
      makeMeal({ id: "m1", food_waste_level: "moderate" }),
      makeMeal({ id: "m2", food_waste_level: null }),
      makeMeal({ id: "m3", food_waste_level: "none" }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    // 1 moderate out of 2 with data = 50%
    expect(m.food_waste_rate).toBe(50);
  });

  it("food_waste_rate with only high waste", () => {
    const meals = [
      makeMeal({ id: "m1", food_waste_level: "high" }),
      makeMeal({ id: "m2", food_waste_level: "high" }),
      makeMeal({ id: "m3", food_waste_level: "high" }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.food_waste_rate).toBe(100);
  });

  it("food_waste_rate rounds to one decimal", () => {
    const meals = [
      makeMeal({ id: "m1", food_waste_level: "moderate" }),
      makeMeal({ id: "m2", food_waste_level: "none" }),
      makeMeal({ id: "m3", food_waste_level: "none" }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    // 1/3 = 33.3%
    expect(m.food_waste_rate).toBe(33.3);
  });

  // ── hygiene_pass_rate ───────────────────────────────────────────────

  it("hygiene_pass_rate is 0 when no hygiene checks exist", () => {
    const m = computeNutritionMetrics([], [], [], 0);
    expect(m.hygiene_pass_rate).toBe(0);
  });

  it("hygiene_pass_rate is 100 when all checks pass", () => {
    const checks = [
      makeHygiene({ id: "h1", overall_result: "pass" }),
      makeHygiene({ id: "h2", overall_result: "pass" }),
    ];
    const m = computeNutritionMetrics([], [], checks, 0);
    expect(m.hygiene_pass_rate).toBe(100);
  });

  it("hygiene_pass_rate is 0 when no checks pass", () => {
    const checks = [
      makeHygiene({ id: "h1", overall_result: "fail" }),
      makeHygiene({ id: "h2", overall_result: "major_issue" }),
    ];
    const m = computeNutritionMetrics([], [], checks, 0);
    expect(m.hygiene_pass_rate).toBe(0);
  });

  it("hygiene_pass_rate calculates correctly for mixed results", () => {
    const checks = [
      makeHygiene({ id: "h1", overall_result: "pass" }),
      makeHygiene({ id: "h2", overall_result: "fail" }),
      makeHygiene({ id: "h3", overall_result: "pass" }),
    ];
    const m = computeNutritionMetrics([], [], checks, 0);
    // 2/3 = 66.7%
    expect(m.hygiene_pass_rate).toBe(66.7);
  });

  it("hygiene_pass_rate does not count minor_issue as pass", () => {
    const checks = [
      makeHygiene({ id: "h1", overall_result: "minor_issue" }),
    ];
    const m = computeNutritionMetrics([], [], checks, 0);
    expect(m.hygiene_pass_rate).toBe(0);
  });

  it("hygiene_pass_rate rounds to one decimal", () => {
    const checks = [
      makeHygiene({ id: "h1", overall_result: "pass" }),
      makeHygiene({ id: "h2", overall_result: "pass" }),
      makeHygiene({ id: "h3", overall_result: "fail" }),
      makeHygiene({ id: "h4", overall_result: "minor_issue" }),
      makeHygiene({ id: "h5", overall_result: "pass" }),
      makeHygiene({ id: "h6", overall_result: "major_issue" }),
    ];
    const m = computeNutritionMetrics([], [], checks, 0);
    // 3/6 = 50%
    expect(m.hygiene_pass_rate).toBe(50);
  });

  // ── overdue_profile_reviews ─────────────────────────────────────────

  it("overdue_profile_reviews counts profiles with past next_review_date", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", next_review_date: daysAgo(10) }),
      makeProfile({ id: "p2", child_id: "c2", next_review_date: daysFromNow(30) }),
      makeProfile({ id: "p3", child_id: "c3", next_review_date: daysAgo(5) }),
    ];
    const m = computeNutritionMetrics(profiles, [], [], 3);
    expect(m.overdue_profile_reviews).toBe(2);
  });

  it("overdue_profile_reviews is 0 when no profiles have next_review_date", () => {
    const profiles = [
      makeProfile({ id: "p1", next_review_date: null }),
    ];
    const m = computeNutritionMetrics(profiles, [], [], 1);
    expect(m.overdue_profile_reviews).toBe(0);
  });

  it("overdue_profile_reviews is 0 when all review dates are in the future", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", next_review_date: daysFromNow(10) }),
      makeProfile({ id: "p2", child_id: "c2", next_review_date: daysFromNow(60) }),
    ];
    const m = computeNutritionMetrics(profiles, [], [], 2);
    expect(m.overdue_profile_reviews).toBe(0);
  });

  // ── by_meal_type ────────────────────────────────────────────────────

  it("by_meal_type tallies each meal type", () => {
    const meals = [
      makeMeal({ id: "m1", meal_type: "breakfast" }),
      makeMeal({ id: "m2", meal_type: "lunch" }),
      makeMeal({ id: "m3", meal_type: "breakfast" }),
      makeMeal({ id: "m4", meal_type: "dinner" }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.by_meal_type["breakfast"]).toBe(2);
    expect(m.by_meal_type["lunch"]).toBe(1);
    expect(m.by_meal_type["dinner"]).toBe(1);
  });

  it("by_meal_type is empty when no meals exist", () => {
    const m = computeNutritionMetrics([], [], [], 0);
    expect(Object.keys(m.by_meal_type)).toHaveLength(0);
  });

  it("by_meal_type counts all 7 types when present", () => {
    const meals = [
      makeMeal({ id: "m1", meal_type: "breakfast" }),
      makeMeal({ id: "m2", meal_type: "morning_snack" }),
      makeMeal({ id: "m3", meal_type: "lunch" }),
      makeMeal({ id: "m4", meal_type: "afternoon_snack" }),
      makeMeal({ id: "m5", meal_type: "dinner" }),
      makeMeal({ id: "m6", meal_type: "supper" }),
      makeMeal({ id: "m7", meal_type: "special_occasion" }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(Object.keys(m.by_meal_type)).toHaveLength(7);
    expect(m.by_meal_type["breakfast"]).toBe(1);
    expect(m.by_meal_type["special_occasion"]).toBe(1);
  });

  it("by_meal_type only includes types present in data", () => {
    const meals = [
      makeMeal({ id: "m1", meal_type: "lunch" }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.by_meal_type["lunch"]).toBe(1);
    expect(m.by_meal_type["breakfast"]).toBeUndefined();
  });

  // ── by_dietary_requirement ──────────────────────────────────────────

  it("by_dietary_requirement tallies requirements excluding none", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", dietary_requirements: ["vegetarian", "gluten_free"] }),
      makeProfile({ id: "p2", child_id: "c2", dietary_requirements: ["vegetarian"] }),
      makeProfile({ id: "p3", child_id: "c3", dietary_requirements: ["none"] }),
    ];
    const m = computeNutritionMetrics(profiles, [], [], 3);
    expect(m.by_dietary_requirement["vegetarian"]).toBe(2);
    expect(m.by_dietary_requirement["gluten_free"]).toBe(1);
    expect(m.by_dietary_requirement["none"]).toBeUndefined();
  });

  it("by_dietary_requirement is empty when all profiles have none", () => {
    const profiles = [
      makeProfile({ id: "p1", dietary_requirements: ["none"] }),
      makeProfile({ id: "p2", child_id: "c2", dietary_requirements: ["none"] }),
    ];
    const m = computeNutritionMetrics(profiles, [], [], 2);
    expect(Object.keys(m.by_dietary_requirement)).toHaveLength(0);
  });

  it("by_dietary_requirement is empty when no profiles exist", () => {
    const m = computeNutritionMetrics([], [], [], 0);
    expect(Object.keys(m.by_dietary_requirement)).toHaveLength(0);
  });

  it("by_dietary_requirement counts multiple requirements per profile", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", dietary_requirements: ["halal", "nut_allergy", "egg_allergy"] }),
    ];
    const m = computeNutritionMetrics(profiles, [], [], 1);
    expect(m.by_dietary_requirement["halal"]).toBe(1);
    expect(m.by_dietary_requirement["nut_allergy"]).toBe(1);
    expect(m.by_dietary_requirement["egg_allergy"]).toBe(1);
  });

  // ── alternative_meals_rate ──────────────────────────────────────────

  it("alternative_meals_rate is 0 when no meals exist", () => {
    const m = computeNutritionMetrics([], [], [], 0);
    expect(m.alternative_meals_rate).toBe(0);
  });

  it("alternative_meals_rate is 0 when no alternatives provided", () => {
    const meals = [
      makeMeal({ id: "m1", alternative_meals_provided: false }),
      makeMeal({ id: "m2", alternative_meals_provided: false }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.alternative_meals_rate).toBe(0);
  });

  it("alternative_meals_rate is 100 when all meals have alternatives", () => {
    const meals = [
      makeMeal({ id: "m1", alternative_meals_provided: true }),
      makeMeal({ id: "m2", alternative_meals_provided: true }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.alternative_meals_rate).toBe(100);
  });

  it("alternative_meals_rate calculates correctly for mixed", () => {
    const meals = [
      makeMeal({ id: "m1", alternative_meals_provided: true }),
      makeMeal({ id: "m2", alternative_meals_provided: false }),
      makeMeal({ id: "m3", alternative_meals_provided: true }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    // 2/3 = 66.7%
    expect(m.alternative_meals_rate).toBe(66.7);
  });

  it("alternative_meals_rate rounds to one decimal", () => {
    const meals = [
      makeMeal({ id: "m1", alternative_meals_provided: true }),
      makeMeal({ id: "m2", alternative_meals_provided: false }),
      makeMeal({ id: "m3", alternative_meals_provided: false }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    // 1/3 = 33.3%
    expect(m.alternative_meals_rate).toBe(33.3);
  });

  // ── combined scenarios ──────────────────────────────────────────────

  it("handles a single fully-populated scenario", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", allergies: ["nuts"], dietary_requirements: ["nut_allergy"], next_review_date: daysFromNow(30) }),
    ];
    const meals = [
      makeMeal({
        id: "m1",
        meal_date: daysAgo(2),
        meal_type: "lunch",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "loved_it", comments: "Yum" },
        ],
        alternative_meals_provided: true,
        food_waste_level: "none",
      }),
    ];
    const checks = [makeHygiene({ id: "h1", overall_result: "pass" })];
    const m = computeNutritionMetrics(profiles, meals, checks, 1);
    expect(m.profiles_complete).toBe(1);
    expect(m.children_with_allergies).toBe(1);
    expect(m.meals_this_week).toBe(1);
    expect(m.avg_satisfaction_score).toBe(5);
    expect(m.food_waste_rate).toBe(0);
    expect(m.hygiene_pass_rate).toBe(100);
    expect(m.overdue_profile_reviews).toBe(0);
    expect(m.by_meal_type["lunch"]).toBe(1);
    expect(m.by_dietary_requirement["nut_allergy"]).toBe(1);
    expect(m.alternative_meals_rate).toBe(100);
  });

  it("handles large number of meals efficiently", () => {
    const meals: MealRecord[] = [];
    for (let i = 0; i < 100; i++) {
      meals.push(
        makeMeal({
          id: `m-${i}`,
          meal_date: daysAgo(i % 14),
          meal_type: i % 2 === 0 ? "breakfast" : "lunch",
          satisfaction_ratings: [
            { child_id: "c1", child_name: "Alice", rating: "okay", comments: "" },
          ],
          food_waste_level: i % 3 === 0 ? "moderate" : "none",
          alternative_meals_provided: i % 5 === 0,
        }),
      );
    }
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.by_meal_type["breakfast"]).toBe(50);
    expect(m.by_meal_type["lunch"]).toBe(50);
    expect(m.avg_satisfaction_score).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyNutritionAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyNutritionAlerts", () => {
  const now = new Date("2025-06-15T12:00:00Z");

  it("returns no alerts for a fully compliant setup", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", next_review_date: "2025-12-01" }),
    ];
    const meals = [
      makeMeal({
        id: "m1",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "loved_it", comments: "" },
        ],
      }),
    ];
    const checks = [makeHygiene({ id: "h1", overall_result: "pass" })];
    const alerts = identifyNutritionAlerts(profiles, meals, checks, 1, now);
    expect(alerts).toHaveLength(0);
  });

  // ── missing_dietary_profile ─────────────────────────────────────────

  it("raises high alert when totalChildren > profiles count", () => {
    const profiles = [makeProfile({ id: "p1", child_id: "c1" })];
    const alerts = identifyNutritionAlerts(profiles, [], [], 3, now);
    const missing = alerts.find((a) => a.type === "missing_dietary_profile");
    expect(missing).toBeTruthy();
    expect(missing!.severity).toBe("high");
  });

  it("missing_dietary_profile message includes count of missing children", () => {
    const profiles = [makeProfile({ id: "p1", child_id: "c1" })];
    const alerts = identifyNutritionAlerts(profiles, [], [], 4, now);
    const missing = alerts.find((a) => a.type === "missing_dietary_profile");
    expect(missing!.message).toContain("3");
  });

  it("missing_dietary_profile uses first profile id as alert id", () => {
    const profiles = [makeProfile({ id: "first-profile", child_id: "c1" })];
    const alerts = identifyNutritionAlerts(profiles, [], [], 5, now);
    const missing = alerts.find((a) => a.type === "missing_dietary_profile");
    expect(missing!.id).toBe("first-profile");
  });

  it("missing_dietary_profile uses 'system' when no profiles exist", () => {
    const alerts = identifyNutritionAlerts([], [], [], 2, now);
    const missing = alerts.find((a) => a.type === "missing_dietary_profile");
    expect(missing).toBeTruthy();
    expect(missing!.id).toBe("system");
  });

  it("no missing_dietary_profile when profiles match totalChildren", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1" }),
      makeProfile({ id: "p2", child_id: "c2" }),
    ];
    const alerts = identifyNutritionAlerts(profiles, [], [], 2, now);
    const missing = alerts.find((a) => a.type === "missing_dietary_profile");
    expect(missing).toBeUndefined();
  });

  it("no missing_dietary_profile when totalChildren is 0", () => {
    const alerts = identifyNutritionAlerts([], [], [], 0, now);
    const missing = alerts.find((a) => a.type === "missing_dietary_profile");
    expect(missing).toBeUndefined();
  });

  it("missing_dietary_profile deduplicates by child_id", () => {
    // Two profiles for the same child should count as 1 unique child
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1" }),
      makeProfile({ id: "p2", child_id: "c1" }),
    ];
    const alerts = identifyNutritionAlerts(profiles, [], [], 3, now);
    const missing = alerts.find((a) => a.type === "missing_dietary_profile");
    expect(missing).toBeTruthy();
    expect(missing!.message).toContain("2"); // 3 - 1 unique = 2 missing
  });

  it("missing_dietary_profile message references Reg 9", () => {
    const alerts = identifyNutritionAlerts([], [], [], 1, now);
    const missing = alerts.find((a) => a.type === "missing_dietary_profile");
    expect(missing!.message).toContain("Reg 9");
  });

  // ── profile_review_overdue ──────────────────────────────────────────

  it("raises medium alert when profile review is overdue", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", child_name: "Alice", next_review_date: "2025-05-01" }),
    ];
    const alerts = identifyNutritionAlerts(profiles, [], [], 1, now);
    const overdue = alerts.find((a) => a.type === "profile_review_overdue");
    expect(overdue).toBeTruthy();
    expect(overdue!.severity).toBe("medium");
  });

  it("profile_review_overdue message includes child name", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", child_name: "Bob Jones", next_review_date: "2025-05-01" }),
    ];
    const alerts = identifyNutritionAlerts(profiles, [], [], 1, now);
    const overdue = alerts.find((a) => a.type === "profile_review_overdue");
    expect(overdue!.message).toContain("Bob Jones");
  });

  it("profile_review_overdue message includes days overdue", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", next_review_date: "2025-06-01" }),
    ];
    const alerts = identifyNutritionAlerts(profiles, [], [], 1, now);
    const overdue = alerts.find((a) => a.type === "profile_review_overdue");
    // 2025-06-01 to 2025-06-15T12:00:00Z = 14.5 days, Math.round => 15
    expect(overdue!.message).toContain("15");
  });

  it("no profile_review_overdue when next_review_date is in the future", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", next_review_date: "2025-12-01" }),
    ];
    const alerts = identifyNutritionAlerts(profiles, [], [], 1, now);
    const overdue = alerts.find((a) => a.type === "profile_review_overdue");
    expect(overdue).toBeUndefined();
  });

  it("no profile_review_overdue when next_review_date is null", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", next_review_date: null }),
    ];
    const alerts = identifyNutritionAlerts(profiles, [], [], 1, now);
    const overdue = alerts.find((a) => a.type === "profile_review_overdue");
    expect(overdue).toBeUndefined();
  });

  it("profile_review_overdue for multiple overdue profiles", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", child_name: "Alice", next_review_date: "2025-05-01" }),
      makeProfile({ id: "p2", child_id: "c2", child_name: "Bob", next_review_date: "2025-04-01" }),
      makeProfile({ id: "p3", child_id: "c3", child_name: "Charlie", next_review_date: "2025-12-01" }),
    ];
    const alerts = identifyNutritionAlerts(profiles, [], [], 3, now);
    const overdue = alerts.filter((a) => a.type === "profile_review_overdue");
    expect(overdue).toHaveLength(2);
  });

  it("profile_review_overdue id matches profile id", () => {
    const profiles = [
      makeProfile({ id: "prof-abc", child_id: "c1", next_review_date: "2025-05-01" }),
    ];
    const alerts = identifyNutritionAlerts(profiles, [], [], 1, now);
    const overdue = alerts.find((a) => a.type === "profile_review_overdue");
    expect(overdue!.id).toBe("prof-abc");
  });

  // ── medical_plan_no_details ─────────────────────────────────────────

  it("raises high alert for medical plan without details", () => {
    const profiles = [
      makeProfile({
        id: "p1",
        child_id: "c1",
        child_name: "Alice",
        medical_dietary_plan: true,
        medical_plan_details: null,
      }),
    ];
    const alerts = identifyNutritionAlerts(profiles, [], [], 1, now);
    const noDetails = alerts.find((a) => a.type === "medical_plan_no_details");
    expect(noDetails).toBeTruthy();
    expect(noDetails!.severity).toBe("high");
  });

  it("medical_plan_no_details message includes child name", () => {
    const profiles = [
      makeProfile({
        id: "p1",
        child_id: "c1",
        child_name: "Zara",
        medical_dietary_plan: true,
        medical_plan_details: null,
      }),
    ];
    const alerts = identifyNutritionAlerts(profiles, [], [], 1, now);
    const noDetails = alerts.find((a) => a.type === "medical_plan_no_details");
    expect(noDetails!.message).toContain("Zara");
  });

  it("no medical_plan_no_details when plan has details", () => {
    const profiles = [
      makeProfile({
        id: "p1",
        child_id: "c1",
        medical_dietary_plan: true,
        medical_plan_details: "Low GI diet prescribed by paediatrician",
      }),
    ];
    const alerts = identifyNutritionAlerts(profiles, [], [], 1, now);
    const noDetails = alerts.find((a) => a.type === "medical_plan_no_details");
    expect(noDetails).toBeUndefined();
  });

  it("no medical_plan_no_details when medical_dietary_plan is false", () => {
    const profiles = [
      makeProfile({
        id: "p1",
        child_id: "c1",
        medical_dietary_plan: false,
        medical_plan_details: null,
      }),
    ];
    const alerts = identifyNutritionAlerts(profiles, [], [], 1, now);
    const noDetails = alerts.find((a) => a.type === "medical_plan_no_details");
    expect(noDetails).toBeUndefined();
  });

  it("medical_plan_no_details for multiple profiles", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", medical_dietary_plan: true, medical_plan_details: null }),
      makeProfile({ id: "p2", child_id: "c2", medical_dietary_plan: true, medical_plan_details: null }),
    ];
    const alerts = identifyNutritionAlerts(profiles, [], [], 2, now);
    const noDetails = alerts.filter((a) => a.type === "medical_plan_no_details");
    expect(noDetails).toHaveLength(2);
  });

  // ── hygiene_fail ────────────────────────────────────────────────────

  it("raises critical alert for hygiene check failure", () => {
    const checks = [
      makeHygiene({ id: "h1", overall_result: "fail", check_date: "2025-06-10" }),
    ];
    const alerts = identifyNutritionAlerts([], [], checks, 0, now);
    const fail = alerts.find((a) => a.type === "hygiene_fail");
    expect(fail).toBeTruthy();
    expect(fail!.severity).toBe("critical");
  });

  it("hygiene_fail message includes check date", () => {
    const checks = [
      makeHygiene({ id: "h1", overall_result: "fail", check_date: "2025-06-10" }),
    ];
    const alerts = identifyNutritionAlerts([], [], checks, 0, now);
    const fail = alerts.find((a) => a.type === "hygiene_fail");
    expect(fail!.message).toContain("2025-06-10");
  });

  it("hygiene_fail id matches hygiene check id", () => {
    const checks = [
      makeHygiene({ id: "hyg-fail-1", overall_result: "fail" }),
    ];
    const alerts = identifyNutritionAlerts([], [], checks, 0, now);
    const fail = alerts.find((a) => a.type === "hygiene_fail");
    expect(fail!.id).toBe("hyg-fail-1");
  });

  it("no hygiene_fail when overall_result is pass", () => {
    const checks = [makeHygiene({ id: "h1", overall_result: "pass" })];
    const alerts = identifyNutritionAlerts([], [], checks, 0, now);
    const fail = alerts.find((a) => a.type === "hygiene_fail");
    expect(fail).toBeUndefined();
  });

  it("no hygiene_fail when overall_result is minor_issue", () => {
    const checks = [makeHygiene({ id: "h1", overall_result: "minor_issue" })];
    const alerts = identifyNutritionAlerts([], [], checks, 0, now);
    const fail = alerts.find((a) => a.type === "hygiene_fail");
    expect(fail).toBeUndefined();
  });

  // ── hygiene_major_issue ─────────────────────────────────────────────

  it("raises high alert for hygiene major issue", () => {
    const checks = [
      makeHygiene({ id: "h1", overall_result: "major_issue", check_date: "2025-06-12" }),
    ];
    const alerts = identifyNutritionAlerts([], [], checks, 0, now);
    const major = alerts.find((a) => a.type === "hygiene_major_issue");
    expect(major).toBeTruthy();
    expect(major!.severity).toBe("high");
  });

  it("hygiene_major_issue message includes check date", () => {
    const checks = [
      makeHygiene({ id: "h1", overall_result: "major_issue", check_date: "2025-06-12" }),
    ];
    const alerts = identifyNutritionAlerts([], [], checks, 0, now);
    const major = alerts.find((a) => a.type === "hygiene_major_issue");
    expect(major!.message).toContain("2025-06-12");
  });

  it("no hygiene_major_issue when overall_result is pass", () => {
    const checks = [makeHygiene({ id: "h1", overall_result: "pass" })];
    const alerts = identifyNutritionAlerts([], [], checks, 0, now);
    const major = alerts.find((a) => a.type === "hygiene_major_issue");
    expect(major).toBeUndefined();
  });

  it("no hygiene_major_issue when overall_result is minor_issue", () => {
    const checks = [makeHygiene({ id: "h1", overall_result: "minor_issue" })];
    const alerts = identifyNutritionAlerts([], [], checks, 0, now);
    const major = alerts.find((a) => a.type === "hygiene_major_issue");
    expect(major).toBeUndefined();
  });

  // ── hygiene_follow_up_overdue ───────────────────────────────────────

  it("raises high alert for overdue hygiene follow-up", () => {
    const checks = [
      makeHygiene({
        id: "h1",
        follow_up_date: "2025-06-10",
        follow_up_completed: false,
        check_date: "2025-06-05",
      }),
    ];
    const alerts = identifyNutritionAlerts([], [], checks, 0, now);
    const followUp = alerts.find((a) => a.type === "hygiene_follow_up_overdue");
    expect(followUp).toBeTruthy();
    expect(followUp!.severity).toBe("high");
  });

  it("hygiene_follow_up_overdue message includes check date", () => {
    const checks = [
      makeHygiene({
        id: "h1",
        follow_up_date: "2025-06-10",
        follow_up_completed: false,
        check_date: "2025-06-05",
      }),
    ];
    const alerts = identifyNutritionAlerts([], [], checks, 0, now);
    const followUp = alerts.find((a) => a.type === "hygiene_follow_up_overdue");
    expect(followUp!.message).toContain("2025-06-05");
  });

  it("no hygiene_follow_up_overdue when follow-up is completed", () => {
    const checks = [
      makeHygiene({
        id: "h1",
        follow_up_date: "2025-06-10",
        follow_up_completed: true,
      }),
    ];
    const alerts = identifyNutritionAlerts([], [], checks, 0, now);
    const followUp = alerts.find((a) => a.type === "hygiene_follow_up_overdue");
    expect(followUp).toBeUndefined();
  });

  it("no hygiene_follow_up_overdue when follow_up_date is null", () => {
    const checks = [
      makeHygiene({
        id: "h1",
        follow_up_date: null,
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyNutritionAlerts([], [], checks, 0, now);
    const followUp = alerts.find((a) => a.type === "hygiene_follow_up_overdue");
    expect(followUp).toBeUndefined();
  });

  it("no hygiene_follow_up_overdue when follow_up_date is in the future", () => {
    const checks = [
      makeHygiene({
        id: "h1",
        follow_up_date: "2025-12-01",
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyNutritionAlerts([], [], checks, 0, now);
    const followUp = alerts.find((a) => a.type === "hygiene_follow_up_overdue");
    expect(followUp).toBeUndefined();
  });

  // ── frequent_meal_refusal ───────────────────────────────────────────

  it("raises medium alert when child refused >= 3 meals in recent 20", () => {
    const meals: MealRecord[] = [];
    for (let i = 0; i < 5; i++) {
      meals.push(
        makeMeal({
          id: `m-${i}`,
          meal_date: `2025-06-${String(15 - i).padStart(2, "0")}`,
          satisfaction_ratings: [
            { child_id: "c1", child_name: "Alice Smith", rating: "refused", comments: "" },
          ],
        }),
      );
    }
    const alerts = identifyNutritionAlerts([], meals, [], 0, now);
    const refusal = alerts.find((a) => a.type === "frequent_meal_refusal");
    expect(refusal).toBeTruthy();
    expect(refusal!.severity).toBe("medium");
  });

  it("frequent_meal_refusal message includes child name and count", () => {
    const meals: MealRecord[] = [];
    for (let i = 0; i < 4; i++) {
      meals.push(
        makeMeal({
          id: `m-${i}`,
          meal_date: `2025-06-${String(15 - i).padStart(2, "0")}`,
          satisfaction_ratings: [
            { child_id: "c1", child_name: "Charlie Brown", rating: "refused", comments: "" },
          ],
        }),
      );
    }
    const alerts = identifyNutritionAlerts([], meals, [], 0, now);
    const refusal = alerts.find((a) => a.type === "frequent_meal_refusal");
    expect(refusal!.message).toContain("Charlie Brown");
    expect(refusal!.message).toContain("4");
  });

  it("no frequent_meal_refusal when child refused only 2 meals", () => {
    const meals = [
      makeMeal({
        id: "m1",
        meal_date: "2025-06-15",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "refused", comments: "" },
        ],
      }),
      makeMeal({
        id: "m2",
        meal_date: "2025-06-14",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "refused", comments: "" },
        ],
      }),
      makeMeal({
        id: "m3",
        meal_date: "2025-06-13",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "loved_it", comments: "" },
        ],
      }),
    ];
    const alerts = identifyNutritionAlerts([], meals, [], 0, now);
    const refusal = alerts.find((a) => a.type === "frequent_meal_refusal");
    expect(refusal).toBeUndefined();
  });

  it("frequent_meal_refusal only considers 20 most recent meals", () => {
    // Create 25 meals, only the first 3 (oldest, outside top 20) have refusals for child c1
    const meals: MealRecord[] = [];
    for (let i = 0; i < 25; i++) {
      meals.push(
        makeMeal({
          id: `m-${i}`,
          meal_date: `2025-06-${String(Math.max(1, 15 - i)).padStart(2, "0")}`,
          satisfaction_ratings: [
            {
              child_id: "c1",
              child_name: "Alice",
              rating: i >= 20 ? "refused" : "loved_it",
              comments: "",
            },
          ],
        }),
      );
    }
    const alerts = identifyNutritionAlerts([], meals, [], 0, now);
    const refusal = alerts.find((a) => a.type === "frequent_meal_refusal");
    // The oldest 5 are outside the top 20 by date sort, so refusals should not trigger
    expect(refusal).toBeUndefined();
  });

  it("frequent_meal_refusal triggers for multiple children independently", () => {
    const meals: MealRecord[] = [];
    for (let i = 0; i < 4; i++) {
      meals.push(
        makeMeal({
          id: `m-${i}`,
          meal_date: `2025-06-${String(15 - i).padStart(2, "0")}`,
          satisfaction_ratings: [
            { child_id: "c1", child_name: "Alice", rating: "refused", comments: "" },
            { child_id: "c2", child_name: "Bob", rating: "refused", comments: "" },
          ],
        }),
      );
    }
    const alerts = identifyNutritionAlerts([], meals, [], 0, now);
    const refusals = alerts.filter((a) => a.type === "frequent_meal_refusal");
    expect(refusals).toHaveLength(2);
  });

  it("frequent_meal_refusal with exactly 3 refusals triggers alert", () => {
    const meals = [
      makeMeal({
        id: "m1",
        meal_date: "2025-06-15",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "refused", comments: "" },
        ],
      }),
      makeMeal({
        id: "m2",
        meal_date: "2025-06-14",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "refused", comments: "" },
        ],
      }),
      makeMeal({
        id: "m3",
        meal_date: "2025-06-13",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "refused", comments: "" },
        ],
      }),
    ];
    const alerts = identifyNutritionAlerts([], meals, [], 0, now);
    const refusal = alerts.find((a) => a.type === "frequent_meal_refusal");
    expect(refusal).toBeTruthy();
    expect(refusal!.message).toContain("3");
  });

  it("frequent_meal_refusal uses most recent meal id", () => {
    const meals = [
      makeMeal({
        id: "most-recent",
        meal_date: "2025-06-15",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "refused", comments: "" },
        ],
      }),
      makeMeal({
        id: "middle",
        meal_date: "2025-06-14",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "refused", comments: "" },
        ],
      }),
      makeMeal({
        id: "oldest",
        meal_date: "2025-06-13",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "Alice", rating: "refused", comments: "" },
        ],
      }),
    ];
    const alerts = identifyNutritionAlerts([], meals, [], 0, now);
    const refusal = alerts.find((a) => a.type === "frequent_meal_refusal");
    expect(refusal!.id).toBe("most-recent");
  });

  // ── now parameter ───────────────────────────────────────────────────

  it("now parameter overrides current date for profile review check", () => {
    const futureNow = new Date("2026-01-01T12:00:00Z");
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", next_review_date: "2025-12-01" }),
    ];
    const alerts = identifyNutritionAlerts(profiles, [], [], 1, futureNow);
    const overdue = alerts.find((a) => a.type === "profile_review_overdue");
    expect(overdue).toBeTruthy();
  });

  it("now parameter overrides current date for hygiene follow-up check", () => {
    const earlyNow = new Date("2025-01-01T12:00:00Z");
    const checks = [
      makeHygiene({
        id: "h1",
        follow_up_date: "2025-06-10",
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyNutritionAlerts([], [], checks, 0, earlyNow);
    const followUp = alerts.find((a) => a.type === "hygiene_follow_up_overdue");
    expect(followUp).toBeUndefined();
  });

  it("now parameter defaults correctly (does not throw without it)", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", next_review_date: "2020-01-01" }),
    ];
    // Call without the now parameter
    const alerts = identifyNutritionAlerts(profiles, [], [], 1);
    const overdue = alerts.find((a) => a.type === "profile_review_overdue");
    expect(overdue).toBeTruthy();
  });

  // ── alert structure ─────────────────────────────────────────────────

  it("each alert has required fields: type, severity, message, id", () => {
    const profiles = [
      makeProfile({
        id: "p1",
        child_id: "c1",
        medical_dietary_plan: true,
        medical_plan_details: null,
        next_review_date: "2025-01-01",
      }),
    ];
    const checks = [
      makeHygiene({ id: "h1", overall_result: "fail" }),
    ];
    const alerts = identifyNutritionAlerts(profiles, [], checks, 3, now);
    for (const a of alerts) {
      expect(a).toHaveProperty("type");
      expect(a).toHaveProperty("severity");
      expect(a).toHaveProperty("message");
      expect(a).toHaveProperty("id");
      expect(typeof a.type).toBe("string");
      expect(["critical", "high", "medium"]).toContain(a.severity);
      expect(a.message.length).toBeGreaterThan(0);
    }
  });

  it("severity values are only critical, high, or medium", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", next_review_date: "2025-01-01", medical_dietary_plan: true, medical_plan_details: null }),
    ];
    const checks = [
      makeHygiene({ id: "h1", overall_result: "fail" }),
      makeHygiene({ id: "h2", overall_result: "major_issue" }),
    ];
    const alerts = identifyNutritionAlerts(profiles, [], checks, 3, now);
    for (const a of alerts) {
      expect(["critical", "high", "medium"]).toContain(a.severity);
    }
  });

  // ── combined scenarios ──────────────────────────────────────────────

  it("raises multiple alert types from a single scenario", () => {
    const profiles = [
      makeProfile({
        id: "p1",
        child_id: "c1",
        child_name: "Alice",
        medical_dietary_plan: true,
        medical_plan_details: null,
        next_review_date: "2025-01-01",
      }),
    ];
    const checks = [
      makeHygiene({ id: "h1", overall_result: "fail" }),
      makeHygiene({ id: "h2", overall_result: "major_issue", follow_up_date: "2025-06-01", follow_up_completed: false }),
    ];
    const meals: MealRecord[] = [];
    for (let i = 0; i < 4; i++) {
      meals.push(
        makeMeal({
          id: `m-${i}`,
          meal_date: `2025-06-${String(15 - i).padStart(2, "0")}`,
          satisfaction_ratings: [
            { child_id: "c1", child_name: "Alice", rating: "refused", comments: "" },
          ],
        }),
      );
    }
    const alerts = identifyNutritionAlerts(profiles, meals, checks, 3, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("missing_dietary_profile");
    expect(types).toContain("profile_review_overdue");
    expect(types).toContain("medical_plan_no_details");
    expect(types).toContain("hygiene_fail");
    expect(types).toContain("hygiene_major_issue");
    expect(types).toContain("hygiene_follow_up_overdue");
    expect(types).toContain("frequent_meal_refusal");
  });

  it("returns empty alerts array for empty inputs and 0 children", () => {
    const alerts = identifyNutritionAlerts([], [], [], 0, now);
    expect(alerts).toEqual([]);
  });

  it("hygiene_fail and hygiene_major_issue are independent", () => {
    const checks = [
      makeHygiene({ id: "h1", overall_result: "fail" }),
      makeHygiene({ id: "h2", overall_result: "major_issue" }),
      makeHygiene({ id: "h3", overall_result: "pass" }),
    ];
    const alerts = identifyNutritionAlerts([], [], checks, 0, now);
    const fails = alerts.filter((a) => a.type === "hygiene_fail");
    const majors = alerts.filter((a) => a.type === "hygiene_major_issue");
    expect(fails).toHaveLength(1);
    expect(fails[0].id).toBe("h1");
    expect(majors).toHaveLength(1);
    expect(majors[0].id).toBe("h2");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listProfiles ────────────────────────────────────────────────────

  it("listProfiles returns ok: true with empty array", async () => {
    const result = await listProfiles("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listProfiles returns ok: true with filters", async () => {
    const result = await listProfiles("home-1", { childId: "child-1", limit: 10 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createProfile ───────────────────────────────────────────────────

  it("createProfile returns ok: false with error message", async () => {
    const result = await createProfile({
      homeId: "home-1",
      childId: "child-1",
      childName: "Alice Smith",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createProfile error message is a string", async () => {
    const result = await createProfile({
      homeId: "home-1",
      childId: "child-1",
      childName: "Bob",
      dietaryRequirements: ["vegetarian", "nut_allergy"],
      allergies: ["peanuts"],
      intolerances: ["lactose"],
      culturalDietaryNeeds: undefined,
      religiousDietaryNeeds: undefined,
      foodPreferences: ["pasta"],
      foodDislikes: ["mushrooms"],
      nutritionalConcerns: undefined,
      eatingSupportNeeded: undefined,
      medicalDietaryPlan: true,
      medicalPlanDetails: "Low GI",
      nextReviewDate: daysFromNow(180),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  // ── updateProfile ───────────────────────────────────────────────────

  it("updateProfile returns ok: false with error message", async () => {
    const result = await updateProfile("profile-1", { child_name: "Updated" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  // ── listMeals ──────────────────────────────────────────────────────

  it("listMeals returns ok: true with empty array", async () => {
    const result = await listMeals("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listMeals returns ok: true with filters", async () => {
    const result = await listMeals("home-1", { mealType: "lunch", dateFrom: "2025-01-01", dateTo: "2025-12-31", limit: 50 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createMeal ─────────────────────────────────────────────────────

  it("createMeal returns ok: false with error message", async () => {
    const result = await createMeal({
      homeId: "home-1",
      mealDate: daysAgo(1),
      mealType: "lunch",
      menuDescription: "Fish and chips",
      preparedBy: "staff-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  // ── listHygieneChecks ──────────────────────────────────────────────

  it("listHygieneChecks returns ok: true with empty array", async () => {
    const result = await listHygieneChecks("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createHygieneCheck ─────────────────────────────────────────────

  it("createHygieneCheck returns ok: false with error message", async () => {
    const result = await createHygieneCheck({
      homeId: "home-1",
      checkDate: daysAgo(1),
      checkedBy: "staff-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("computeNutritionMetrics handles large profile array", () => {
    const profiles: DietaryProfile[] = [];
    for (let i = 0; i < 200; i++) {
      profiles.push(
        makeProfile({
          id: `p-${i}`,
          child_id: `c-${i}`,
          allergies: i % 3 === 0 ? ["peanuts"] : [],
          dietary_requirements: i % 2 === 0 ? ["vegetarian"] : ["none"],
        }),
      );
    }
    const m = computeNutritionMetrics(profiles, [], [], 200);
    expect(m.profiles_complete).toBe(200);
    expect(m.children_with_allergies).toBe(67); // 0,3,6,...,198 => 67 items
    expect(m.by_dietary_requirement["vegetarian"]).toBe(100);
  });

  it("computeNutritionMetrics with all satisfaction ratings as refused", () => {
    const meals = [
      makeMeal({
        id: "m1",
        satisfaction_ratings: [
          { child_id: "c1", child_name: "A", rating: "refused", comments: "" },
          { child_id: "c2", child_name: "B", rating: "refused", comments: "" },
          { child_id: "c3", child_name: "C", rating: "refused", comments: "" },
        ],
      }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.avg_satisfaction_score).toBe(1);
  });

  it("computeNutritionMetrics with empty allergies arrays on all profiles", () => {
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", allergies: [] }),
      makeProfile({ id: "p2", child_id: "c2", allergies: [] }),
      makeProfile({ id: "p3", child_id: "c3", allergies: [] }),
    ];
    const m = computeNutritionMetrics(profiles, [], [], 3);
    expect(m.children_with_allergies).toBe(0);
  });

  it("computeNutritionMetrics with no food_waste_level set on any meal", () => {
    const meals = [
      makeMeal({ id: "m1", food_waste_level: null }),
      makeMeal({ id: "m2", food_waste_level: null }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.food_waste_rate).toBe(0);
  });

  it("identifyNutritionAlerts with empty profiles, meals, and checks", () => {
    const alerts = identifyNutritionAlerts([], [], [], 0, new Date());
    expect(alerts).toEqual([]);
  });

  it("identifyNutritionAlerts handles profile with empty string medical_plan_details", () => {
    // empty string is falsy, so should trigger the alert
    const profiles = [
      makeProfile({
        id: "p1",
        child_id: "c1",
        medical_dietary_plan: true,
        medical_plan_details: "" as unknown as null,
      }),
    ];
    const alerts = identifyNutritionAlerts(profiles, [], [], 1, new Date());
    const noDetails = alerts.find((a) => a.type === "medical_plan_no_details");
    expect(noDetails).toBeTruthy();
  });

  it("computeNutritionMetrics with meals spanning many weeks", () => {
    const meals = [
      makeMeal({ id: "m1", meal_date: daysAgo(1) }),
      makeMeal({ id: "m2", meal_date: daysAgo(30) }),
      makeMeal({ id: "m3", meal_date: daysAgo(60) }),
      makeMeal({ id: "m4", meal_date: daysAgo(90) }),
    ];
    const m = computeNutritionMetrics([], meals, [], 0);
    expect(m.meals_this_week).toBe(1);
    expect(Object.values(m.by_meal_type).reduce((a, b) => a + b, 0)).toBe(4);
  });

  it("computeNutritionMetrics with profiles having multiple dietary requirements including none", () => {
    // "none" should be excluded from by_dietary_requirement even when mixed
    const profiles = [
      makeProfile({ id: "p1", child_id: "c1", dietary_requirements: ["none", "halal"] }),
    ];
    const m = computeNutritionMetrics(profiles, [], [], 1);
    expect(m.by_dietary_requirement["halal"]).toBe(1);
    expect(m.by_dietary_requirement["none"]).toBeUndefined();
  });

  it("identifyNutritionAlerts with hygiene check that both fails and has overdue follow-up", () => {
    const checks = [
      makeHygiene({
        id: "h1",
        overall_result: "fail",
        follow_up_date: "2025-01-01",
        follow_up_completed: false,
        check_date: "2024-12-20",
      }),
    ];
    const alerts = identifyNutritionAlerts([], [], checks, 0, new Date("2025-06-15"));
    const types = alerts.map((a) => a.type);
    expect(types).toContain("hygiene_fail");
    expect(types).toContain("hygiene_follow_up_overdue");
  });

  it("computeNutritionMetrics totalChildren parameter does not affect metrics", () => {
    // totalChildren is only used in alerts, not metrics
    const m1 = computeNutritionMetrics([], [], [], 0);
    const m2 = computeNutritionMetrics([], [], [], 100);
    expect(m1).toEqual(m2);
  });
});
