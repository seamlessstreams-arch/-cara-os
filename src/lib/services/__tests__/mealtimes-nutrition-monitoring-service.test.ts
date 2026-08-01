// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEALTIMES & NUTRITION MONITORING SERVICE TESTS
// Pure-function tests for meal metrics, alert identification,
// constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  MEAL_TYPES,
  DIETARY_REQUIREMENTS,
  MEAL_QUALITIES,
  HYGIENE_RATINGS,
  _testing,
} from "../mealtimes-nutrition-monitoring-service";

import type {
  MealRecord,
  MealType,
  MealQuality,
  HygieneRating,
} from "../mealtimes-nutrition-monitoring-service";

const { computeMealMetrics, identifyMealAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<MealRecord>,
): MealRecord {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    meal_date: "meal_date" in (overrides ?? {}) ? overrides!.meal_date! : "2026-05-01",
    meal_type: "meal_type" in (overrides ?? {}) ? overrides!.meal_type! : "lunch",
    menu_description: "menu_description" in (overrides ?? {}) ? overrides!.menu_description! : "Chicken and vegetables",
    dietary_requirements_met: "dietary_requirements_met" in (overrides ?? {}) ? overrides!.dietary_requirements_met! : ["none"],
    meal_quality: "meal_quality" in (overrides ?? {}) ? overrides!.meal_quality! : "good",
    hygiene_rating: "hygiene_rating" in (overrides ?? {}) ? overrides!.hygiene_rating! : "5_star",
    children_present: "children_present" in (overrides ?? {}) ? overrides!.children_present! : 4,
    children_ate: "children_ate" in (overrides ?? {}) ? overrides!.children_ate! : 4,
    children_involved_in_preparation: "children_involved_in_preparation" in (overrides ?? {}) ? overrides!.children_involved_in_preparation! : true,
    children_involved_in_choice: "children_involved_in_choice" in (overrides ?? {}) ? overrides!.children_involved_in_choice! : true,
    cultural_needs_considered: "cultural_needs_considered" in (overrides ?? {}) ? overrides!.cultural_needs_considered! : true,
    allergies_checked: "allergies_checked" in (overrides ?? {}) ? overrides!.allergies_checked! : true,
    fresh_ingredients_used: "fresh_ingredients_used" in (overrides ?? {}) ? overrides!.fresh_ingredients_used! : true,
    balanced_meal: "balanced_meal" in (overrides ?? {}) ? overrides!.balanced_meal! : true,
    mealtime_atmosphere_positive: "mealtime_atmosphere_positive" in (overrides ?? {}) ? overrides!.mealtime_atmosphere_positive! : true,
    staff_ate_with_children: "staff_ate_with_children" in (overrides ?? {}) ? overrides!.staff_ate_with_children! : true,
    food_waste_minimal: "food_waste_minimal" in (overrides ?? {}) ? overrides!.food_waste_minimal! : true,
    prepared_by: "prepared_by" in (overrides ?? {}) ? overrides!.prepared_by! : "Chef",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-05-01T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-05-01T08:00:00Z",
  };
}

// ── Constants ──────────────────────────────────────────────────────────────

describe("Constants", () => {
  describe("MEAL_TYPES", () => {
    it("has exactly 8 items", () => {
      expect(MEAL_TYPES).toHaveLength(8);
    });

    it("contains breakfast", () => {
      expect(MEAL_TYPES).toContainEqual({ type: "breakfast", label: "Breakfast" });
    });

    it("contains morning_snack", () => {
      expect(MEAL_TYPES).toContainEqual({ type: "morning_snack", label: "Morning Snack" });
    });

    it("contains lunch", () => {
      expect(MEAL_TYPES).toContainEqual({ type: "lunch", label: "Lunch" });
    });

    it("contains afternoon_snack", () => {
      expect(MEAL_TYPES).toContainEqual({ type: "afternoon_snack", label: "Afternoon Snack" });
    });

    it("contains dinner", () => {
      expect(MEAL_TYPES).toContainEqual({ type: "dinner", label: "Dinner" });
    });

    it("contains supper", () => {
      expect(MEAL_TYPES).toContainEqual({ type: "supper", label: "Supper" });
    });

    it("contains special_occasion", () => {
      expect(MEAL_TYPES).toContainEqual({ type: "special_occasion", label: "Special Occasion" });
    });

    it("contains other", () => {
      expect(MEAL_TYPES).toContainEqual({ type: "other", label: "Other" });
    });

    it("has unique type values", () => {
      const types = MEAL_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique labels", () => {
      const labels = MEAL_TYPES.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of MEAL_TYPES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("DIETARY_REQUIREMENTS", () => {
    it("has exactly 12 items", () => {
      expect(DIETARY_REQUIREMENTS).toHaveLength(12);
    });

    it("contains none", () => {
      expect(DIETARY_REQUIREMENTS).toContainEqual({ requirement: "none", label: "None" });
    });

    it("contains vegetarian", () => {
      expect(DIETARY_REQUIREMENTS).toContainEqual({ requirement: "vegetarian", label: "Vegetarian" });
    });

    it("contains vegan", () => {
      expect(DIETARY_REQUIREMENTS).toContainEqual({ requirement: "vegan", label: "Vegan" });
    });

    it("contains halal", () => {
      expect(DIETARY_REQUIREMENTS).toContainEqual({ requirement: "halal", label: "Halal" });
    });

    it("contains kosher", () => {
      expect(DIETARY_REQUIREMENTS).toContainEqual({ requirement: "kosher", label: "Kosher" });
    });

    it("contains gluten_free", () => {
      expect(DIETARY_REQUIREMENTS).toContainEqual({ requirement: "gluten_free", label: "Gluten Free" });
    });

    it("contains dairy_free", () => {
      expect(DIETARY_REQUIREMENTS).toContainEqual({ requirement: "dairy_free", label: "Dairy Free" });
    });

    it("contains nut_free", () => {
      expect(DIETARY_REQUIREMENTS).toContainEqual({ requirement: "nut_free", label: "Nut Free" });
    });

    it("contains allergy_specific", () => {
      expect(DIETARY_REQUIREMENTS).toContainEqual({ requirement: "allergy_specific", label: "Allergy Specific" });
    });

    it("contains medical_diet", () => {
      expect(DIETARY_REQUIREMENTS).toContainEqual({ requirement: "medical_diet", label: "Medical Diet" });
    });

    it("contains cultural", () => {
      expect(DIETARY_REQUIREMENTS).toContainEqual({ requirement: "cultural", label: "Cultural" });
    });

    it("contains other", () => {
      expect(DIETARY_REQUIREMENTS).toContainEqual({ requirement: "other", label: "Other" });
    });

    it("has unique requirement values", () => {
      const reqs = DIETARY_REQUIREMENTS.map((r) => r.requirement);
      expect(new Set(reqs).size).toBe(reqs.length);
    });

    it("has unique labels", () => {
      const labels = DIETARY_REQUIREMENTS.map((r) => r.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of DIETARY_REQUIREMENTS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("MEAL_QUALITIES", () => {
    it("has exactly 5 items", () => {
      expect(MEAL_QUALITIES).toHaveLength(5);
    });

    it("contains excellent", () => {
      expect(MEAL_QUALITIES).toContainEqual({ quality: "excellent", label: "Excellent" });
    });

    it("contains good", () => {
      expect(MEAL_QUALITIES).toContainEqual({ quality: "good", label: "Good" });
    });

    it("contains adequate", () => {
      expect(MEAL_QUALITIES).toContainEqual({ quality: "adequate", label: "Adequate" });
    });

    it("contains poor", () => {
      expect(MEAL_QUALITIES).toContainEqual({ quality: "poor", label: "Poor" });
    });

    it("contains not_assessed", () => {
      expect(MEAL_QUALITIES).toContainEqual({ quality: "not_assessed", label: "Not Assessed" });
    });

    it("has unique quality values", () => {
      const qualities = MEAL_QUALITIES.map((q) => q.quality);
      expect(new Set(qualities).size).toBe(qualities.length);
    });

    it("has unique labels", () => {
      const labels = MEAL_QUALITIES.map((q) => q.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of MEAL_QUALITIES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("HYGIENE_RATINGS", () => {
    it("has exactly 6 items", () => {
      expect(HYGIENE_RATINGS).toHaveLength(6);
    });

    it("contains 5_star", () => {
      expect(HYGIENE_RATINGS).toContainEqual({ rating: "5_star", label: "5 Star" });
    });

    it("contains 4_star", () => {
      expect(HYGIENE_RATINGS).toContainEqual({ rating: "4_star", label: "4 Star" });
    });

    it("contains 3_star", () => {
      expect(HYGIENE_RATINGS).toContainEqual({ rating: "3_star", label: "3 Star" });
    });

    it("contains 2_star", () => {
      expect(HYGIENE_RATINGS).toContainEqual({ rating: "2_star", label: "2 Star" });
    });

    it("contains 1_star", () => {
      expect(HYGIENE_RATINGS).toContainEqual({ rating: "1_star", label: "1 Star" });
    });

    it("contains not_rated", () => {
      expect(HYGIENE_RATINGS).toContainEqual({ rating: "not_rated", label: "Not Rated" });
    });

    it("has unique rating values", () => {
      const ratings = HYGIENE_RATINGS.map((r) => r.rating);
      expect(new Set(ratings).size).toBe(ratings.length);
    });

    it("has unique labels", () => {
      const labels = HYGIENE_RATINGS.map((r) => r.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of HYGIENE_RATINGS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── computeMealMetrics ───────────────────────────────────────────────────

describe("computeMealMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_meals", () => {
      const m = computeMealMetrics([]);
      expect(m.total_meals).toBe(0);
    });

    it("returns zero children_ate_rate", () => {
      const m = computeMealMetrics([]);
      expect(m.children_ate_rate).toBeNull();;
    });

    it("returns zero balanced_meal_rate", () => {
      const m = computeMealMetrics([]);
      expect(m.balanced_meal_rate).toBeNull();;
    });

    it("returns zero fresh_ingredients_rate", () => {
      const m = computeMealMetrics([]);
      expect(m.fresh_ingredients_rate).toBeNull();;
    });

    it("returns zero allergies_checked_rate", () => {
      const m = computeMealMetrics([]);
      expect(m.allergies_checked_rate).toBeNull();;
    });

    it("returns zero cultural_needs_rate", () => {
      const m = computeMealMetrics([]);
      expect(m.cultural_needs_rate).toBeNull();;
    });

    it("returns zero children_involved_preparation_rate", () => {
      const m = computeMealMetrics([]);
      expect(m.children_involved_preparation_rate).toBeNull();;
    });

    it("returns zero children_involved_choice_rate", () => {
      const m = computeMealMetrics([]);
      expect(m.children_involved_choice_rate).toBeNull();;
    });

    it("returns zero positive_atmosphere_rate", () => {
      const m = computeMealMetrics([]);
      expect(m.positive_atmosphere_rate).toBeNull();;
    });

    it("returns zero staff_ate_with_children_rate", () => {
      const m = computeMealMetrics([]);
      expect(m.staff_ate_with_children_rate).toBeNull();;
    });

    it("returns zero food_waste_minimal_rate", () => {
      const m = computeMealMetrics([]);
      expect(m.food_waste_minimal_rate).toBeNull();;
    });

    it("returns zero poor_meal_count", () => {
      const m = computeMealMetrics([]);
      expect(m.poor_meal_count).toBe(0);
    });

    it("returns zero excellent_meal_count", () => {
      const m = computeMealMetrics([]);
      expect(m.excellent_meal_count).toBe(0);
    });

    it("returns empty by_meal_type", () => {
      const m = computeMealMetrics([]);
      expect(m.by_meal_type).toEqual({});
    });

    it("returns empty by_meal_quality", () => {
      const m = computeMealMetrics([]);
      expect(m.by_meal_quality).toEqual({});
    });

    it("returns empty by_hygiene_rating", () => {
      const m = computeMealMetrics([]);
      expect(m.by_hygiene_rating).toEqual({});
    });
  });

  describe("single record — all true", () => {
    const record = makeRecord({
      children_present: 4,
      children_ate: 4,
      balanced_meal: true,
      fresh_ingredients_used: true,
      allergies_checked: true,
      cultural_needs_considered: true,
      children_involved_in_preparation: true,
      children_involved_in_choice: true,
      mealtime_atmosphere_positive: true,
      staff_ate_with_children: true,
      food_waste_minimal: true,
      meal_quality: "excellent",
      meal_type: "lunch",
      hygiene_rating: "5_star",
    });

    it("returns total_meals = 1", () => {
      const m = computeMealMetrics([record]);
      expect(m.total_meals).toBe(1);
    });

    it("returns children_ate_rate = 100", () => {
      const m = computeMealMetrics([record]);
      expect(m.children_ate_rate).toBe(100);
    });

    it("returns balanced_meal_rate = 100", () => {
      const m = computeMealMetrics([record]);
      expect(m.balanced_meal_rate).toBe(100);
    });

    it("returns fresh_ingredients_rate = 100", () => {
      const m = computeMealMetrics([record]);
      expect(m.fresh_ingredients_rate).toBe(100);
    });

    it("returns allergies_checked_rate = 100", () => {
      const m = computeMealMetrics([record]);
      expect(m.allergies_checked_rate).toBe(100);
    });

    it("returns cultural_needs_rate = 100", () => {
      const m = computeMealMetrics([record]);
      expect(m.cultural_needs_rate).toBe(100);
    });

    it("returns children_involved_preparation_rate = 100", () => {
      const m = computeMealMetrics([record]);
      expect(m.children_involved_preparation_rate).toBe(100);
    });

    it("returns children_involved_choice_rate = 100", () => {
      const m = computeMealMetrics([record]);
      expect(m.children_involved_choice_rate).toBe(100);
    });

    it("returns positive_atmosphere_rate = 100", () => {
      const m = computeMealMetrics([record]);
      expect(m.positive_atmosphere_rate).toBe(100);
    });

    it("returns staff_ate_with_children_rate = 100", () => {
      const m = computeMealMetrics([record]);
      expect(m.staff_ate_with_children_rate).toBe(100);
    });

    it("returns food_waste_minimal_rate = 100", () => {
      const m = computeMealMetrics([record]);
      expect(m.food_waste_minimal_rate).toBe(100);
    });

    it("returns excellent_meal_count = 1", () => {
      const m = computeMealMetrics([record]);
      expect(m.excellent_meal_count).toBe(1);
    });

    it("returns poor_meal_count = 0", () => {
      const m = computeMealMetrics([record]);
      expect(m.poor_meal_count).toBe(0);
    });

    it("returns by_meal_type with single entry", () => {
      const m = computeMealMetrics([record]);
      expect(m.by_meal_type).toEqual({ lunch: 1 });
    });

    it("returns by_meal_quality with single entry", () => {
      const m = computeMealMetrics([record]);
      expect(m.by_meal_quality).toEqual({ excellent: 1 });
    });

    it("returns by_hygiene_rating with single entry", () => {
      const m = computeMealMetrics([record]);
      expect(m.by_hygiene_rating).toEqual({ "5_star": 1 });
    });
  });

  describe("single record — all false", () => {
    const record = makeRecord({
      children_present: 4,
      children_ate: 0,
      balanced_meal: false,
      fresh_ingredients_used: false,
      allergies_checked: false,
      cultural_needs_considered: false,
      children_involved_in_preparation: false,
      children_involved_in_choice: false,
      mealtime_atmosphere_positive: false,
      staff_ate_with_children: false,
      food_waste_minimal: false,
      meal_quality: "poor",
    });

    it("returns children_ate_rate = 0", () => {
      const m = computeMealMetrics([record]);
      expect(m.children_ate_rate).toBe(0);
    });

    it("returns balanced_meal_rate = 0", () => {
      const m = computeMealMetrics([record]);
      expect(m.balanced_meal_rate).toBe(0);
    });

    it("returns fresh_ingredients_rate = 0", () => {
      const m = computeMealMetrics([record]);
      expect(m.fresh_ingredients_rate).toBe(0);
    });

    it("returns allergies_checked_rate = 0", () => {
      const m = computeMealMetrics([record]);
      expect(m.allergies_checked_rate).toBe(0);
    });

    it("returns cultural_needs_rate = 0", () => {
      const m = computeMealMetrics([record]);
      expect(m.cultural_needs_rate).toBe(0);
    });

    it("returns children_involved_preparation_rate = 0", () => {
      const m = computeMealMetrics([record]);
      expect(m.children_involved_preparation_rate).toBe(0);
    });

    it("returns children_involved_choice_rate = 0", () => {
      const m = computeMealMetrics([record]);
      expect(m.children_involved_choice_rate).toBe(0);
    });

    it("returns positive_atmosphere_rate = 0", () => {
      const m = computeMealMetrics([record]);
      expect(m.positive_atmosphere_rate).toBe(0);
    });

    it("returns staff_ate_with_children_rate = 0", () => {
      const m = computeMealMetrics([record]);
      expect(m.staff_ate_with_children_rate).toBe(0);
    });

    it("returns food_waste_minimal_rate = 0", () => {
      const m = computeMealMetrics([record]);
      expect(m.food_waste_minimal_rate).toBe(0);
    });

    it("returns poor_meal_count = 1", () => {
      const m = computeMealMetrics([record]);
      expect(m.poor_meal_count).toBe(1);
    });

    it("returns excellent_meal_count = 0", () => {
      const m = computeMealMetrics([record]);
      expect(m.excellent_meal_count).toBe(0);
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRecord({ children_present: 4, children_ate: 4, balanced_meal: true, fresh_ingredients_used: true, allergies_checked: true, cultural_needs_considered: true, children_involved_in_preparation: true, children_involved_in_choice: true, mealtime_atmosphere_positive: true, staff_ate_with_children: true, food_waste_minimal: true, meal_quality: "excellent", meal_type: "breakfast", hygiene_rating: "5_star" }),
      makeRecord({ children_present: 4, children_ate: 2, balanced_meal: false, fresh_ingredients_used: false, allergies_checked: false, cultural_needs_considered: false, children_involved_in_preparation: false, children_involved_in_choice: false, mealtime_atmosphere_positive: false, staff_ate_with_children: false, food_waste_minimal: false, meal_quality: "poor", meal_type: "lunch", hygiene_rating: "3_star" }),
      makeRecord({ children_present: 4, children_ate: 3, balanced_meal: true, fresh_ingredients_used: true, allergies_checked: true, cultural_needs_considered: false, children_involved_in_preparation: false, children_involved_in_choice: true, mealtime_atmosphere_positive: true, staff_ate_with_children: false, food_waste_minimal: true, meal_quality: "good", meal_type: "dinner", hygiene_rating: "4_star" }),
    ];

    it("returns total_meals = 3", () => {
      const m = computeMealMetrics(records);
      expect(m.total_meals).toBe(3);
    });

    it("calculates children_ate_rate correctly (9/12 = 75%)", () => {
      const m = computeMealMetrics(records);
      expect(m.children_ate_rate).toBe(75);
    });

    it("calculates balanced_meal_rate correctly (2/3 = 66.7%)", () => {
      const m = computeMealMetrics(records);
      expect(m.balanced_meal_rate).toBe(66.7);
    });

    it("calculates fresh_ingredients_rate correctly (2/3 = 66.7%)", () => {
      const m = computeMealMetrics(records);
      expect(m.fresh_ingredients_rate).toBe(66.7);
    });

    it("calculates allergies_checked_rate correctly (2/3 = 66.7%)", () => {
      const m = computeMealMetrics(records);
      expect(m.allergies_checked_rate).toBe(66.7);
    });

    it("calculates cultural_needs_rate correctly (1/3 = 33.3%)", () => {
      const m = computeMealMetrics(records);
      expect(m.cultural_needs_rate).toBe(33.3);
    });

    it("calculates children_involved_preparation_rate correctly (1/3 = 33.3%)", () => {
      const m = computeMealMetrics(records);
      expect(m.children_involved_preparation_rate).toBe(33.3);
    });

    it("calculates children_involved_choice_rate correctly (2/3 = 66.7%)", () => {
      const m = computeMealMetrics(records);
      expect(m.children_involved_choice_rate).toBe(66.7);
    });

    it("calculates positive_atmosphere_rate correctly (2/3 = 66.7%)", () => {
      const m = computeMealMetrics(records);
      expect(m.positive_atmosphere_rate).toBe(66.7);
    });

    it("calculates staff_ate_with_children_rate correctly (1/3 = 33.3%)", () => {
      const m = computeMealMetrics(records);
      expect(m.staff_ate_with_children_rate).toBe(33.3);
    });

    it("calculates food_waste_minimal_rate correctly (2/3 = 66.7%)", () => {
      const m = computeMealMetrics(records);
      expect(m.food_waste_minimal_rate).toBe(66.7);
    });

    it("returns poor_meal_count = 1", () => {
      const m = computeMealMetrics(records);
      expect(m.poor_meal_count).toBe(1);
    });

    it("returns excellent_meal_count = 1", () => {
      const m = computeMealMetrics(records);
      expect(m.excellent_meal_count).toBe(1);
    });

    it("groups by_meal_type correctly", () => {
      const m = computeMealMetrics(records);
      expect(m.by_meal_type).toEqual({ breakfast: 1, lunch: 1, dinner: 1 });
    });

    it("groups by_meal_quality correctly", () => {
      const m = computeMealMetrics(records);
      expect(m.by_meal_quality).toEqual({ excellent: 1, poor: 1, good: 1 });
    });

    it("groups by_hygiene_rating correctly", () => {
      const m = computeMealMetrics(records);
      expect(m.by_hygiene_rating).toEqual({ "5_star": 1, "3_star": 1, "4_star": 1 });
    });
  });

  describe("children_ate_rate", () => {
    it("sums children_present and children_ate across records", () => {
      const records = [
        makeRecord({ children_present: 3, children_ate: 2 }),
        makeRecord({ children_present: 5, children_ate: 4 }),
      ];
      // totalAte=6, totalPresent=8, 6/8 = 75%
      const m = computeMealMetrics(records);
      expect(m.children_ate_rate).toBe(75);
    });

    it("returns 0 when totalPresent is 0", () => {
      const records = [makeRecord({ children_present: 0, children_ate: 0 })];
      const m = computeMealMetrics(records);
      expect(m.children_ate_rate).toBeNull();;
    });

    it("handles partial eating (1/3 = 33.3%)", () => {
      const records = [makeRecord({ children_present: 3, children_ate: 1 })];
      const m = computeMealMetrics(records);
      expect(m.children_ate_rate).toBe(33.3);
    });

    it("handles 50% eating rate", () => {
      const records = [makeRecord({ children_present: 4, children_ate: 2 })];
      const m = computeMealMetrics(records);
      expect(m.children_ate_rate).toBe(50);
    });

    it("sums across multiple records with different counts", () => {
      const records = [
        makeRecord({ children_present: 2, children_ate: 1 }),
        makeRecord({ children_present: 4, children_ate: 3 }),
        makeRecord({ children_present: 6, children_ate: 6 }),
      ];
      // totalPresent=12, totalAte=10, 10/12 = 83.3%
      const m = computeMealMetrics(records);
      expect(m.children_ate_rate).toBe(83.3);
    });
  });

  describe("balanced_meal_rate", () => {
    it("returns 100 when all meals are balanced", () => {
      const records = [
        makeRecord({ balanced_meal: true }),
        makeRecord({ balanced_meal: true }),
      ];
      const m = computeMealMetrics(records);
      expect(m.balanced_meal_rate).toBe(100);
    });

    it("returns 0 when no meals are balanced", () => {
      const records = [
        makeRecord({ balanced_meal: false }),
        makeRecord({ balanced_meal: false }),
      ];
      const m = computeMealMetrics(records);
      expect(m.balanced_meal_rate).toBe(0);
    });

    it("calculates 50% rate", () => {
      const records = [
        makeRecord({ balanced_meal: true }),
        makeRecord({ balanced_meal: false }),
      ];
      const m = computeMealMetrics(records);
      expect(m.balanced_meal_rate).toBe(50);
    });
  });

  describe("fresh_ingredients_rate", () => {
    it("returns 100 when all use fresh ingredients", () => {
      const records = [
        makeRecord({ fresh_ingredients_used: true }),
        makeRecord({ fresh_ingredients_used: true }),
      ];
      const m = computeMealMetrics(records);
      expect(m.fresh_ingredients_rate).toBe(100);
    });

    it("returns 0 when none use fresh ingredients", () => {
      const records = [
        makeRecord({ fresh_ingredients_used: false }),
        makeRecord({ fresh_ingredients_used: false }),
      ];
      const m = computeMealMetrics(records);
      expect(m.fresh_ingredients_rate).toBe(0);
    });
  });

  describe("allergies_checked_rate", () => {
    it("returns 100 when all checked", () => {
      const records = [
        makeRecord({ allergies_checked: true }),
        makeRecord({ allergies_checked: true }),
      ];
      const m = computeMealMetrics(records);
      expect(m.allergies_checked_rate).toBe(100);
    });

    it("returns 0 when none checked", () => {
      const records = [
        makeRecord({ allergies_checked: false }),
        makeRecord({ allergies_checked: false }),
      ];
      const m = computeMealMetrics(records);
      expect(m.allergies_checked_rate).toBe(0);
    });
  });

  describe("cultural_needs_rate", () => {
    it("returns 100 when all considered", () => {
      const records = [
        makeRecord({ cultural_needs_considered: true }),
        makeRecord({ cultural_needs_considered: true }),
      ];
      const m = computeMealMetrics(records);
      expect(m.cultural_needs_rate).toBe(100);
    });

    it("returns 0 when none considered", () => {
      const records = [
        makeRecord({ cultural_needs_considered: false }),
        makeRecord({ cultural_needs_considered: false }),
      ];
      const m = computeMealMetrics(records);
      expect(m.cultural_needs_rate).toBe(0);
    });
  });

  describe("children_involved_preparation_rate", () => {
    it("returns 100 when all involved", () => {
      const records = [
        makeRecord({ children_involved_in_preparation: true }),
        makeRecord({ children_involved_in_preparation: true }),
      ];
      const m = computeMealMetrics(records);
      expect(m.children_involved_preparation_rate).toBe(100);
    });

    it("returns 0 when none involved", () => {
      const records = [
        makeRecord({ children_involved_in_preparation: false }),
        makeRecord({ children_involved_in_preparation: false }),
      ];
      const m = computeMealMetrics(records);
      expect(m.children_involved_preparation_rate).toBe(0);
    });
  });

  describe("children_involved_choice_rate", () => {
    it("returns 100 when all involved in choice", () => {
      const records = [
        makeRecord({ children_involved_in_choice: true }),
        makeRecord({ children_involved_in_choice: true }),
      ];
      const m = computeMealMetrics(records);
      expect(m.children_involved_choice_rate).toBe(100);
    });

    it("returns 0 when none involved in choice", () => {
      const records = [
        makeRecord({ children_involved_in_choice: false }),
        makeRecord({ children_involved_in_choice: false }),
      ];
      const m = computeMealMetrics(records);
      expect(m.children_involved_choice_rate).toBe(0);
    });
  });

  describe("positive_atmosphere_rate", () => {
    it("returns 100 when all positive", () => {
      const records = [
        makeRecord({ mealtime_atmosphere_positive: true }),
        makeRecord({ mealtime_atmosphere_positive: true }),
      ];
      const m = computeMealMetrics(records);
      expect(m.positive_atmosphere_rate).toBe(100);
    });

    it("returns 0 when none positive", () => {
      const records = [
        makeRecord({ mealtime_atmosphere_positive: false }),
        makeRecord({ mealtime_atmosphere_positive: false }),
      ];
      const m = computeMealMetrics(records);
      expect(m.positive_atmosphere_rate).toBe(0);
    });
  });

  describe("staff_ate_with_children_rate", () => {
    it("returns 100 when staff always ate with children", () => {
      const records = [
        makeRecord({ staff_ate_with_children: true }),
        makeRecord({ staff_ate_with_children: true }),
      ];
      const m = computeMealMetrics(records);
      expect(m.staff_ate_with_children_rate).toBe(100);
    });

    it("returns 0 when staff never ate with children", () => {
      const records = [
        makeRecord({ staff_ate_with_children: false }),
        makeRecord({ staff_ate_with_children: false }),
      ];
      const m = computeMealMetrics(records);
      expect(m.staff_ate_with_children_rate).toBe(0);
    });
  });

  describe("food_waste_minimal_rate", () => {
    it("returns 100 when all minimal waste", () => {
      const records = [
        makeRecord({ food_waste_minimal: true }),
        makeRecord({ food_waste_minimal: true }),
      ];
      const m = computeMealMetrics(records);
      expect(m.food_waste_minimal_rate).toBe(100);
    });

    it("returns 0 when no minimal waste", () => {
      const records = [
        makeRecord({ food_waste_minimal: false }),
        makeRecord({ food_waste_minimal: false }),
      ];
      const m = computeMealMetrics(records);
      expect(m.food_waste_minimal_rate).toBe(0);
    });
  });

  describe("poor_meal_count and excellent_meal_count", () => {
    it("counts multiple poor meals", () => {
      const records = [
        makeRecord({ meal_quality: "poor" }),
        makeRecord({ meal_quality: "poor" }),
        makeRecord({ meal_quality: "good" }),
      ];
      const m = computeMealMetrics(records);
      expect(m.poor_meal_count).toBe(2);
    });

    it("counts multiple excellent meals", () => {
      const records = [
        makeRecord({ meal_quality: "excellent" }),
        makeRecord({ meal_quality: "excellent" }),
        makeRecord({ meal_quality: "excellent" }),
      ];
      const m = computeMealMetrics(records);
      expect(m.excellent_meal_count).toBe(3);
    });

    it("does not count good as excellent or poor", () => {
      const records = [makeRecord({ meal_quality: "good" })];
      const m = computeMealMetrics(records);
      expect(m.poor_meal_count).toBe(0);
      expect(m.excellent_meal_count).toBe(0);
    });

    it("does not count adequate as excellent or poor", () => {
      const records = [makeRecord({ meal_quality: "adequate" })];
      const m = computeMealMetrics(records);
      expect(m.poor_meal_count).toBe(0);
      expect(m.excellent_meal_count).toBe(0);
    });

    it("does not count not_assessed as excellent or poor", () => {
      const records = [makeRecord({ meal_quality: "not_assessed" })];
      const m = computeMealMetrics(records);
      expect(m.poor_meal_count).toBe(0);
      expect(m.excellent_meal_count).toBe(0);
    });
  });

  describe("by_meal_type breakdown", () => {
    it("counts each meal type separately", () => {
      const records = [
        makeRecord({ meal_type: "breakfast" }),
        makeRecord({ meal_type: "breakfast" }),
        makeRecord({ meal_type: "lunch" }),
        makeRecord({ meal_type: "dinner" }),
      ];
      const m = computeMealMetrics(records);
      expect(m.by_meal_type).toEqual({ breakfast: 2, lunch: 1, dinner: 1 });
    });

    it("handles all eight meal types", () => {
      const types: MealType[] = ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "supper", "special_occasion", "other"];
      const records = types.map((t) => makeRecord({ meal_type: t }));
      const m = computeMealMetrics(records);
      for (const t of types) {
        expect(m.by_meal_type[t]).toBe(1);
      }
    });
  });

  describe("by_meal_quality breakdown", () => {
    it("counts each quality separately", () => {
      const records = [
        makeRecord({ meal_quality: "excellent" }),
        makeRecord({ meal_quality: "excellent" }),
        makeRecord({ meal_quality: "poor" }),
      ];
      const m = computeMealMetrics(records);
      expect(m.by_meal_quality).toEqual({ excellent: 2, poor: 1 });
    });

    it("handles all five meal qualities", () => {
      const qualities: MealQuality[] = ["excellent", "good", "adequate", "poor", "not_assessed"];
      const records = qualities.map((q) => makeRecord({ meal_quality: q }));
      const m = computeMealMetrics(records);
      for (const q of qualities) {
        expect(m.by_meal_quality[q]).toBe(1);
      }
    });
  });

  describe("by_hygiene_rating breakdown", () => {
    it("counts each hygiene rating separately", () => {
      const records = [
        makeRecord({ hygiene_rating: "5_star" }),
        makeRecord({ hygiene_rating: "5_star" }),
        makeRecord({ hygiene_rating: "3_star" }),
      ];
      const m = computeMealMetrics(records);
      expect(m.by_hygiene_rating).toEqual({ "5_star": 2, "3_star": 1 });
    });

    it("handles all six hygiene ratings", () => {
      const ratings: HygieneRating[] = ["5_star", "4_star", "3_star", "2_star", "1_star", "not_rated"];
      const records = ratings.map((r) => makeRecord({ hygiene_rating: r }));
      const m = computeMealMetrics(records);
      for (const r of ratings) {
        expect(m.by_hygiene_rating[r]).toBe(1);
      }
    });
  });

  describe("rate rounding", () => {
    it("rounds 1/3 to 33.3", () => {
      const records = [
        makeRecord({ balanced_meal: true }),
        makeRecord({ balanced_meal: false }),
        makeRecord({ balanced_meal: false }),
      ];
      const m = computeMealMetrics(records);
      expect(m.balanced_meal_rate).toBe(33.3);
    });

    it("rounds 2/3 to 66.7", () => {
      const records = [
        makeRecord({ balanced_meal: true }),
        makeRecord({ balanced_meal: true }),
        makeRecord({ balanced_meal: false }),
      ];
      const m = computeMealMetrics(records);
      expect(m.balanced_meal_rate).toBe(66.7);
    });

    it("rounds 1/6 to 16.7", () => {
      const records = [
        makeRecord({ fresh_ingredients_used: true }),
        makeRecord({ fresh_ingredients_used: false }),
        makeRecord({ fresh_ingredients_used: false }),
        makeRecord({ fresh_ingredients_used: false }),
        makeRecord({ fresh_ingredients_used: false }),
        makeRecord({ fresh_ingredients_used: false }),
      ];
      const m = computeMealMetrics(records);
      expect(m.fresh_ingredients_rate).toBe(16.7);
    });

    it("rounds 5/6 to 83.3", () => {
      const records = [
        makeRecord({ allergies_checked: true }),
        makeRecord({ allergies_checked: true }),
        makeRecord({ allergies_checked: true }),
        makeRecord({ allergies_checked: true }),
        makeRecord({ allergies_checked: true }),
        makeRecord({ allergies_checked: false }),
      ];
      const m = computeMealMetrics(records);
      expect(m.allergies_checked_rate).toBe(83.3);
    });

    it("returns exactly 25 for 1/4", () => {
      const records = [
        makeRecord({ cultural_needs_considered: true }),
        makeRecord({ cultural_needs_considered: false }),
        makeRecord({ cultural_needs_considered: false }),
        makeRecord({ cultural_needs_considered: false }),
      ];
      const m = computeMealMetrics(records);
      expect(m.cultural_needs_rate).toBe(25);
    });
  });

  describe("large data set", () => {
    it("handles 100 records correctly", () => {
      const records: MealRecord[] = [];
      for (let i = 0; i < 100; i++) {
        records.push(
          makeRecord({
            children_present: 4,
            children_ate: i % 2 === 0 ? 4 : 2,
            balanced_meal: i % 3 === 0,
            fresh_ingredients_used: true,
            allergies_checked: true,
            cultural_needs_considered: i % 5 === 0,
            children_involved_in_preparation: i % 4 === 0,
            children_involved_in_choice: i % 2 === 0,
            mealtime_atmosphere_positive: true,
            staff_ate_with_children: i % 2 === 0,
            food_waste_minimal: true,
            meal_quality: i % 10 === 0 ? "poor" : "good",
            meal_type: "lunch",
            hygiene_rating: "5_star",
          }),
        );
      }
      const m = computeMealMetrics(records);
      expect(m.total_meals).toBe(100);
      // totalPresent=400, totalAte=50*4 + 50*2 = 300, 300/400 = 75%
      expect(m.children_ate_rate).toBe(75);
      expect(m.fresh_ingredients_rate).toBe(100);
      expect(m.allergies_checked_rate).toBe(100);
      expect(m.positive_atmosphere_rate).toBe(100);
      expect(m.food_waste_minimal_rate).toBe(100);
      // poor: i%10===0 => 10 records (0,10,...,90)
      expect(m.poor_meal_count).toBe(10);
    });
  });
});

// ── identifyMealAlerts ──────────────────────────────────────────────────

describe("identifyMealAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no records", () => {
      const alerts = identifyMealAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all records are clean", () => {
      const records = [
        makeRecord({
          allergies_checked: true,
          meal_quality: "good",
          children_present: 4,
          children_ate: 4,
          cultural_needs_considered: true,
          children_involved_in_choice: true,
        }),
      ];
      const alerts = identifyMealAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("returns empty for two good records with everything positive", () => {
      const records = [
        makeRecord({ allergies_checked: true, meal_quality: "excellent", children_present: 4, children_ate: 4, cultural_needs_considered: true, children_involved_in_choice: true }),
        makeRecord({ allergies_checked: true, meal_quality: "good", children_present: 4, children_ate: 3, cultural_needs_considered: true, children_involved_in_choice: true }),
      ];
      const alerts = identifyMealAlerts(records);
      expect(alerts).toEqual([]);
    });
  });

  describe("allergies_not_checked alert", () => {
    it("fires for a single record with allergies_checked=false", () => {
      const records = [makeRecord({ allergies_checked: false, meal_type: "lunch", meal_date: "2026-05-01" })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "allergies_not_checked");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ allergies_checked: false, meal_type: "lunch", meal_date: "2026-05-01" })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "allergies_not_checked")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "rec-allergy-1", allergies_checked: false, meal_type: "lunch", meal_date: "2026-05-01" })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "allergies_not_checked")!;
      expect(alert.id).toBe("rec-allergy-1");
    });

    it("replaces underscores with spaces in meal_type in message", () => {
      const records = [makeRecord({ allergies_checked: false, meal_type: "morning_snack", meal_date: "2026-05-01" })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "allergies_not_checked")!;
      expect(alert.message).toContain("morning snack");
    });

    it("replaces underscores for afternoon_snack", () => {
      const records = [makeRecord({ allergies_checked: false, meal_type: "afternoon_snack", meal_date: "2026-05-01" })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "allergies_not_checked")!;
      expect(alert.message).toContain("afternoon snack");
    });

    it("replaces underscores for special_occasion", () => {
      const records = [makeRecord({ allergies_checked: false, meal_type: "special_occasion", meal_date: "2026-05-01" })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "allergies_not_checked")!;
      expect(alert.message).toContain("special occasion");
    });

    it("includes meal_date in message", () => {
      const records = [makeRecord({ allergies_checked: false, meal_type: "lunch", meal_date: "2026-04-15" })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "allergies_not_checked")!;
      expect(alert.message).toContain("2026-04-15");
    });

    it("fires per record for multiple unchecked records", () => {
      const records = [
        makeRecord({ allergies_checked: false, meal_type: "breakfast", meal_date: "2026-05-01" }),
        makeRecord({ allergies_checked: false, meal_type: "lunch", meal_date: "2026-05-02" }),
        makeRecord({ allergies_checked: false, meal_type: "dinner", meal_date: "2026-05-03" }),
      ];
      const alerts = identifyMealAlerts(records);
      const allergyAlerts = alerts.filter((a) => a.type === "allergies_not_checked");
      expect(allergyAlerts).toHaveLength(3);
    });

    it("does not fire when allergies_checked=true", () => {
      const records = [makeRecord({ allergies_checked: true })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "allergies_not_checked");
      expect(alert).toBeUndefined();
    });

    it("message contains serious safety risk wording", () => {
      const records = [makeRecord({ allergies_checked: false, meal_type: "lunch", meal_date: "2026-05-01" })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "allergies_not_checked")!;
      expect(alert.message).toContain("serious safety risk");
    });

    it("handles meal_type with no underscores (breakfast)", () => {
      const records = [makeRecord({ allergies_checked: false, meal_type: "breakfast", meal_date: "2026-05-01" })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "allergies_not_checked")!;
      expect(alert.message).toContain("breakfast");
    });
  });

  describe("poor_meal_quality alert", () => {
    it("does not fire for 0 poor meals", () => {
      const records = [makeRecord({ meal_quality: "good" })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_meal_quality");
      expect(alert).toBeUndefined();
    });

    it("does not fire for 1 poor meal (below threshold)", () => {
      const records = [makeRecord({ meal_quality: "poor" })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_meal_quality");
      expect(alert).toBeUndefined();
    });

    it("fires for exactly 2 poor meals (threshold)", () => {
      const records = [
        makeRecord({ meal_quality: "poor" }),
        makeRecord({ meal_quality: "poor" }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_meal_quality");
      expect(alert).toBeDefined();
    });

    it("fires for 3 poor meals (above threshold)", () => {
      const records = [
        makeRecord({ meal_quality: "poor" }),
        makeRecord({ meal_quality: "poor" }),
        makeRecord({ meal_quality: "poor" }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_meal_quality");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [
        makeRecord({ meal_quality: "poor" }),
        makeRecord({ meal_quality: "poor" }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_meal_quality")!;
      expect(alert.severity).toBe("high");
    });

    it("has id poor_meal_quality", () => {
      const records = [
        makeRecord({ meal_quality: "poor" }),
        makeRecord({ meal_quality: "poor" }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_meal_quality")!;
      expect(alert.id).toBe("poor_meal_quality");
    });

    it("includes count in message for 2 poor meals", () => {
      const records = [
        makeRecord({ meal_quality: "poor" }),
        makeRecord({ meal_quality: "poor" }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_meal_quality")!;
      expect(alert.message).toContain("2");
    });

    it("includes count in message for 5 poor meals", () => {
      const records = [
        makeRecord({ meal_quality: "poor" }),
        makeRecord({ meal_quality: "poor" }),
        makeRecord({ meal_quality: "poor" }),
        makeRecord({ meal_quality: "poor" }),
        makeRecord({ meal_quality: "poor" }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_meal_quality")!;
      expect(alert.message).toContain("5");
    });

    it("message contains review menu planning wording", () => {
      const records = [
        makeRecord({ meal_quality: "poor" }),
        makeRecord({ meal_quality: "poor" }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_meal_quality")!;
      expect(alert.message).toContain("review menu planning and food preparation");
    });

    it("fires only once as aggregate alert", () => {
      const records = [
        makeRecord({ meal_quality: "poor" }),
        makeRecord({ meal_quality: "poor" }),
        makeRecord({ meal_quality: "poor" }),
      ];
      const alerts = identifyMealAlerts(records);
      const poorAlerts = alerts.filter((a) => a.type === "poor_meal_quality");
      expect(poorAlerts).toHaveLength(1);
    });

    it("does not count adequate as poor", () => {
      const records = [
        makeRecord({ meal_quality: "adequate" }),
        makeRecord({ meal_quality: "adequate" }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_meal_quality");
      expect(alert).toBeUndefined();
    });

    it("does not count not_assessed as poor", () => {
      const records = [
        makeRecord({ meal_quality: "not_assessed" }),
        makeRecord({ meal_quality: "not_assessed" }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_meal_quality");
      expect(alert).toBeUndefined();
    });
  });

  describe("low_eating_rate alert", () => {
    it("fires when totalAte/totalPresent < 0.7", () => {
      const records = [makeRecord({ children_present: 10, children_ate: 6 })];
      // 6/10 = 0.6 < 0.7
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "low_eating_rate");
      expect(alert).toBeDefined();
    });

    it("does not fire when totalAte/totalPresent >= 0.7", () => {
      const records = [makeRecord({ children_present: 10, children_ate: 7 })];
      // 7/10 = 0.7 — not strictly less than 0.7
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "low_eating_rate");
      expect(alert).toBeUndefined();
    });

    it("does not fire when totalAte/totalPresent = 0.8", () => {
      const records = [makeRecord({ children_present: 10, children_ate: 8 })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "low_eating_rate");
      expect(alert).toBeUndefined();
    });

    it("does not fire when totalPresent is 0", () => {
      const records = [makeRecord({ children_present: 0, children_ate: 0 })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "low_eating_rate");
      expect(alert).toBeUndefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ children_present: 10, children_ate: 5 })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "low_eating_rate")!;
      expect(alert.severity).toBe("high");
    });

    it("has id low_eating_rate", () => {
      const records = [makeRecord({ children_present: 10, children_ate: 5 })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "low_eating_rate")!;
      expect(alert.id).toBe("low_eating_rate");
    });

    it("includes Math.round percentage in message (50%)", () => {
      const records = [makeRecord({ children_present: 10, children_ate: 5 })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "low_eating_rate")!;
      expect(alert.message).toContain("50%");
    });

    it("includes Math.round percentage in message (60%)", () => {
      const records = [makeRecord({ children_present: 10, children_ate: 6 })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "low_eating_rate")!;
      expect(alert.message).toContain("60%");
    });

    it("includes rounded percentage across multiple records", () => {
      const records = [
        makeRecord({ children_present: 3, children_ate: 1 }),
        makeRecord({ children_present: 3, children_ate: 1 }),
      ];
      // totalPresent=6, totalAte=2, 2/6 = 33.3% -> Math.round(33.3) = 33%
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "low_eating_rate")!;
      expect(alert.message).toContain("33%");
    });

    it("message contains investigate preferences wording", () => {
      const records = [makeRecord({ children_present: 10, children_ate: 5 })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "low_eating_rate")!;
      expect(alert.message).toContain("investigate preferences and barriers");
    });

    it("fires as aggregate, not per record", () => {
      const records = [
        makeRecord({ children_present: 10, children_ate: 3 }),
        makeRecord({ children_present: 10, children_ate: 3 }),
      ];
      const alerts = identifyMealAlerts(records);
      const lowAlerts = alerts.filter((a) => a.type === "low_eating_rate");
      expect(lowAlerts).toHaveLength(1);
    });

    it("sums across records for aggregate calculation", () => {
      const records = [
        makeRecord({ children_present: 5, children_ate: 5 }),
        makeRecord({ children_present: 5, children_ate: 0 }),
      ];
      // totalPresent=10, totalAte=5, 5/10 = 0.5 < 0.7
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "low_eating_rate");
      expect(alert).toBeDefined();
    });

    it("does not fire when aggregate is exactly 70%", () => {
      const records = [
        makeRecord({ children_present: 5, children_ate: 4 }),
        makeRecord({ children_present: 5, children_ate: 3 }),
      ];
      // totalPresent=10, totalAte=7, 7/10 = 0.7 — not < 0.7
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "low_eating_rate");
      expect(alert).toBeUndefined();
    });
  });

  describe("cultural_needs_missed alert", () => {
    it("does not fire for 0 missed records", () => {
      const records = [makeRecord({ cultural_needs_considered: true })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "cultural_needs_missed");
      expect(alert).toBeUndefined();
    });

    it("does not fire for 1 missed record (below threshold)", () => {
      const records = [makeRecord({ cultural_needs_considered: false })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "cultural_needs_missed");
      expect(alert).toBeUndefined();
    });

    it("does not fire for 2 missed records (below threshold)", () => {
      const records = [
        makeRecord({ cultural_needs_considered: false }),
        makeRecord({ cultural_needs_considered: false }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "cultural_needs_missed");
      expect(alert).toBeUndefined();
    });

    it("fires for exactly 3 missed records (threshold)", () => {
      const records = [
        makeRecord({ cultural_needs_considered: false }),
        makeRecord({ cultural_needs_considered: false }),
        makeRecord({ cultural_needs_considered: false }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "cultural_needs_missed");
      expect(alert).toBeDefined();
    });

    it("fires for 4 missed records (above threshold)", () => {
      const records = [
        makeRecord({ cultural_needs_considered: false }),
        makeRecord({ cultural_needs_considered: false }),
        makeRecord({ cultural_needs_considered: false }),
        makeRecord({ cultural_needs_considered: false }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "cultural_needs_missed");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [
        makeRecord({ cultural_needs_considered: false }),
        makeRecord({ cultural_needs_considered: false }),
        makeRecord({ cultural_needs_considered: false }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "cultural_needs_missed")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id cultural_needs_missed", () => {
      const records = [
        makeRecord({ cultural_needs_considered: false }),
        makeRecord({ cultural_needs_considered: false }),
        makeRecord({ cultural_needs_considered: false }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "cultural_needs_missed")!;
      expect(alert.id).toBe("cultural_needs_missed");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ cultural_needs_considered: false }),
        makeRecord({ cultural_needs_considered: false }),
        makeRecord({ cultural_needs_considered: false }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "cultural_needs_missed")!;
      expect(alert.message).toContain("3");
    });

    it("includes count 5 in message", () => {
      const records = Array.from({ length: 5 }, () => makeRecord({ cultural_needs_considered: false }));
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "cultural_needs_missed")!;
      expect(alert.message).toContain("5");
    });

    it("message contains ensure inclusivity wording", () => {
      const records = [
        makeRecord({ cultural_needs_considered: false }),
        makeRecord({ cultural_needs_considered: false }),
        makeRecord({ cultural_needs_considered: false }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "cultural_needs_missed")!;
      expect(alert.message).toContain("ensure inclusivity");
    });

    it("fires only once as aggregate alert", () => {
      const records = Array.from({ length: 5 }, () => makeRecord({ cultural_needs_considered: false }));
      const alerts = identifyMealAlerts(records);
      const culturalAlerts = alerts.filter((a) => a.type === "cultural_needs_missed");
      expect(culturalAlerts).toHaveLength(1);
    });

    it("only counts records where cultural_needs_considered is false", () => {
      const records = [
        makeRecord({ cultural_needs_considered: false }),
        makeRecord({ cultural_needs_considered: true }),
        makeRecord({ cultural_needs_considered: false }),
        makeRecord({ cultural_needs_considered: true }),
        makeRecord({ cultural_needs_considered: false }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "cultural_needs_missed");
      expect(alert).toBeDefined();
      expect(alert!.message).toContain("3");
    });
  });

  describe("no_child_choice alert", () => {
    it("does not fire for 0 missed records", () => {
      const records = [makeRecord({ children_involved_in_choice: true })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "no_child_choice");
      expect(alert).toBeUndefined();
    });

    it("does not fire for 1 missed record (below threshold)", () => {
      const records = [makeRecord({ children_involved_in_choice: false })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "no_child_choice");
      expect(alert).toBeUndefined();
    });

    it("does not fire for 2 missed records (below threshold)", () => {
      const records = [
        makeRecord({ children_involved_in_choice: false }),
        makeRecord({ children_involved_in_choice: false }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "no_child_choice");
      expect(alert).toBeUndefined();
    });

    it("fires for exactly 3 missed records (threshold)", () => {
      const records = [
        makeRecord({ children_involved_in_choice: false }),
        makeRecord({ children_involved_in_choice: false }),
        makeRecord({ children_involved_in_choice: false }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "no_child_choice");
      expect(alert).toBeDefined();
    });

    it("fires for 5 missed records (above threshold)", () => {
      const records = Array.from({ length: 5 }, () => makeRecord({ children_involved_in_choice: false }));
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "no_child_choice");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [
        makeRecord({ children_involved_in_choice: false }),
        makeRecord({ children_involved_in_choice: false }),
        makeRecord({ children_involved_in_choice: false }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "no_child_choice")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id no_child_choice", () => {
      const records = [
        makeRecord({ children_involved_in_choice: false }),
        makeRecord({ children_involved_in_choice: false }),
        makeRecord({ children_involved_in_choice: false }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "no_child_choice")!;
      expect(alert.id).toBe("no_child_choice");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ children_involved_in_choice: false }),
        makeRecord({ children_involved_in_choice: false }),
        makeRecord({ children_involved_in_choice: false }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "no_child_choice")!;
      expect(alert.message).toContain("3");
    });

    it("includes count 4 in message", () => {
      const records = Array.from({ length: 4 }, () => makeRecord({ children_involved_in_choice: false }));
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "no_child_choice")!;
      expect(alert.message).toContain("4");
    });

    it("message contains promote participation wording", () => {
      const records = [
        makeRecord({ children_involved_in_choice: false }),
        makeRecord({ children_involved_in_choice: false }),
        makeRecord({ children_involved_in_choice: false }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "no_child_choice")!;
      expect(alert.message).toContain("promote participation");
    });

    it("fires only once as aggregate alert", () => {
      const records = Array.from({ length: 5 }, () => makeRecord({ children_involved_in_choice: false }));
      const alerts = identifyMealAlerts(records);
      const choiceAlerts = alerts.filter((a) => a.type === "no_child_choice");
      expect(choiceAlerts).toHaveLength(1);
    });

    it("only counts records where children_involved_in_choice is false", () => {
      const records = [
        makeRecord({ children_involved_in_choice: false }),
        makeRecord({ children_involved_in_choice: true }),
        makeRecord({ children_involved_in_choice: false }),
        makeRecord({ children_involved_in_choice: true }),
        makeRecord({ children_involved_in_choice: false }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "no_child_choice");
      expect(alert).toBeDefined();
      expect(alert!.message).toContain("3");
    });
  });

  describe("combined alerts", () => {
    it("can fire all five alert types simultaneously", () => {
      const records = [
        makeRecord({ id: "r1", allergies_checked: false, meal_quality: "poor", children_present: 10, children_ate: 3, cultural_needs_considered: false, children_involved_in_choice: false, meal_type: "lunch", meal_date: "2026-05-01" }),
        makeRecord({ id: "r2", allergies_checked: false, meal_quality: "poor", children_present: 10, children_ate: 3, cultural_needs_considered: false, children_involved_in_choice: false, meal_type: "dinner", meal_date: "2026-05-02" }),
        makeRecord({ id: "r3", allergies_checked: true, meal_quality: "good", children_present: 10, children_ate: 3, cultural_needs_considered: false, children_involved_in_choice: false, meal_type: "breakfast", meal_date: "2026-05-03" }),
      ];
      const alerts = identifyMealAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("allergies_not_checked");
      expect(types).toContain("poor_meal_quality");
      expect(types).toContain("low_eating_rate");
      expect(types).toContain("cultural_needs_missed");
      expect(types).toContain("no_child_choice");
    });

    it("returns correct total number of alerts for combined scenario", () => {
      const records = [
        makeRecord({ allergies_checked: false, meal_quality: "poor", children_present: 10, children_ate: 3, cultural_needs_considered: false, children_involved_in_choice: false, meal_type: "lunch", meal_date: "2026-05-01" }),
        makeRecord({ allergies_checked: false, meal_quality: "poor", children_present: 10, children_ate: 3, cultural_needs_considered: false, children_involved_in_choice: false, meal_type: "dinner", meal_date: "2026-05-02" }),
        makeRecord({ allergies_checked: false, meal_quality: "good", children_present: 10, children_ate: 3, cultural_needs_considered: false, children_involved_in_choice: false, meal_type: "breakfast", meal_date: "2026-05-03" }),
      ];
      const alerts = identifyMealAlerts(records);
      // allergies_not_checked=3 (per record), poor_meal_quality=1, low_eating_rate=1, cultural_needs_missed=1, no_child_choice=1
      expect(alerts).toHaveLength(7);
    });

    it("per-record alerts multiply while threshold alerts stay singular", () => {
      const records = [
        makeRecord({ allergies_checked: false, meal_quality: "poor", children_present: 10, children_ate: 2, cultural_needs_considered: false, children_involved_in_choice: false, meal_type: "lunch", meal_date: "2026-05-01" }),
        makeRecord({ allergies_checked: false, meal_quality: "poor", children_present: 10, children_ate: 2, cultural_needs_considered: false, children_involved_in_choice: false, meal_type: "dinner", meal_date: "2026-05-02" }),
        makeRecord({ allergies_checked: false, meal_quality: "poor", children_present: 10, children_ate: 2, cultural_needs_considered: false, children_involved_in_choice: false, meal_type: "breakfast", meal_date: "2026-05-03" }),
      ];
      const alerts = identifyMealAlerts(records);
      expect(alerts.filter((a) => a.type === "allergies_not_checked")).toHaveLength(3);
      expect(alerts.filter((a) => a.type === "poor_meal_quality")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "low_eating_rate")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "cultural_needs_missed")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "no_child_choice")).toHaveLength(1);
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const records = [
        makeRecord({ allergies_checked: false, meal_type: "lunch", meal_date: "2026-05-01" }),
      ];
      const alerts = identifyMealAlerts(records);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const records = [
        makeRecord({ allergies_checked: false, meal_quality: "poor", children_present: 10, children_ate: 2, cultural_needs_considered: false, children_involved_in_choice: false, meal_type: "lunch", meal_date: "2026-05-01" }),
        makeRecord({ allergies_checked: false, meal_quality: "poor", children_present: 10, children_ate: 2, cultural_needs_considered: false, children_involved_in_choice: false, meal_type: "dinner", meal_date: "2026-05-02" }),
        makeRecord({ allergies_checked: true, meal_quality: "good", children_present: 10, children_ate: 2, cultural_needs_considered: false, children_involved_in_choice: false, meal_type: "breakfast", meal_date: "2026-05-03" }),
      ];
      const alerts = identifyMealAlerts(records);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const records = [makeRecord({ allergies_checked: false, meal_type: "lunch", meal_date: "2026-05-01" })];
      const alerts = identifyMealAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe("edge cases", () => {
    it("allergies_checked true does not trigger alert even with poor quality", () => {
      const records = [makeRecord({ allergies_checked: true, meal_quality: "poor" })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "allergies_not_checked");
      expect(alert).toBeUndefined();
    });

    it("excellent quality does not trigger poor_meal_quality alert", () => {
      const records = [
        makeRecord({ meal_quality: "excellent" }),
        makeRecord({ meal_quality: "excellent" }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "poor_meal_quality");
      expect(alert).toBeUndefined();
    });

    it("100% eating rate does not trigger low_eating_rate", () => {
      const records = [makeRecord({ children_present: 4, children_ate: 4 })];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "low_eating_rate");
      expect(alert).toBeUndefined();
    });

    it("all cultural needs considered does not trigger cultural_needs_missed", () => {
      const records = [
        makeRecord({ cultural_needs_considered: true }),
        makeRecord({ cultural_needs_considered: true }),
        makeRecord({ cultural_needs_considered: true }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "cultural_needs_missed");
      expect(alert).toBeUndefined();
    });

    it("all children involved in choice does not trigger no_child_choice", () => {
      const records = [
        makeRecord({ children_involved_in_choice: true }),
        makeRecord({ children_involved_in_choice: true }),
        makeRecord({ children_involved_in_choice: true }),
      ];
      const alerts = identifyMealAlerts(records);
      const alert = alerts.find((a) => a.type === "no_child_choice");
      expect(alert).toBeUndefined();
    });

    it("multiple meal_types have underscores replaced correctly in allergy alerts", () => {
      const types: MealType[] = ["morning_snack", "afternoon_snack", "special_occasion"];
      for (const t of types) {
        const records = [makeRecord({ allergies_checked: false, meal_type: t, meal_date: "2026-05-01" })];
        const alerts = identifyMealAlerts(records);
        const alert = alerts.find((a) => a.type === "allergies_not_checked")!;
        expect(alert.message).toContain(t.replace(/_/g, " "));
      }
    });
  });
});

// ── Factory helper validation ──────────────────────────────────────────────

describe("makeRecord factory helper", () => {
  it("creates a record with sensible defaults", () => {
    const r = makeRecord();
    expect(r.home_id).toBe("home-1");
    expect(r.meal_date).toBe("2026-05-01");
    expect(r.meal_type).toBe("lunch");
    expect(r.menu_description).toBe("Chicken and vegetables");
    expect(r.dietary_requirements_met).toEqual(["none"]);
    expect(r.meal_quality).toBe("good");
    expect(r.hygiene_rating).toBe("5_star");
    expect(r.children_present).toBe(4);
    expect(r.children_ate).toBe(4);
    expect(r.children_involved_in_preparation).toBe(true);
    expect(r.children_involved_in_choice).toBe(true);
    expect(r.cultural_needs_considered).toBe(true);
    expect(r.allergies_checked).toBe(true);
    expect(r.fresh_ingredients_used).toBe(true);
    expect(r.balanced_meal).toBe(true);
    expect(r.mealtime_atmosphere_positive).toBe(true);
    expect(r.staff_ate_with_children).toBe(true);
    expect(r.food_waste_minimal).toBe(true);
    expect(r.prepared_by).toBe("Chef");
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRecord({ meal_type: "dinner", meal_quality: "poor" });
    expect(r.meal_type).toBe("dinner");
    expect(r.meal_quality).toBe("poor");
    // defaults still apply
    expect(r.allergies_checked).toBe(true);
  });

  it("generates unique ids by default", () => {
    const r1 = makeRecord();
    const r2 = makeRecord();
    expect(r1.id).not.toBe(r2.id);
  });

  it("allows overriding id", () => {
    const r = makeRecord({ id: "custom-id" });
    expect(r.id).toBe("custom-id");
  });

  it("allows setting nullable fields to null", () => {
    const r = makeRecord({ notes: null });
    expect(r.notes).toBeNull();
  });
});
