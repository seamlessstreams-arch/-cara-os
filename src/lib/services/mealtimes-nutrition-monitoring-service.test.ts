import { describe, it, expect } from "vitest";
import {
  computeMealMetrics,
  identifyMealAlerts,
  type MealRecord,
} from "./mealtimes-nutrition-monitoring-service";

function makeRecord(
  overrides: Partial<MealRecord> = {},
): MealRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    meal_date: "2026-05-20",
    meal_type: "dinner",
    menu_description: "Roast chicken with vegetables",
    dietary_requirements_met: ["none"],
    meal_quality: "good",
    hygiene_rating: "5_star",
    children_present: 4,
    children_ate: 4,
    children_involved_in_preparation: true,
    children_involved_in_choice: true,
    cultural_needs_considered: true,
    allergies_checked: true,
    fresh_ingredients_used: true,
    balanced_meal: true,
    mealtime_atmosphere_positive: true,
    staff_ate_with_children: true,
    food_waste_minimal: true,
    prepared_by: "Staff A",
    notes: null,
    created_at: "2026-05-20T10:00:00Z",
    updated_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

describe("computeMealMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMealMetrics([]);
    expect(m.total_meals).toBe(0);
    expect(m.children_ate_rate).toBeNull();;
    expect(m.balanced_meal_rate).toBeNull();;
    expect(m.poor_meal_count).toBe(0);
  });

  it("computes correct counts and rates for populated data", () => {
    const records = [
      makeRecord({ id: "1", meal_quality: "excellent", children_present: 4, children_ate: 4, balanced_meal: true }),
      makeRecord({ id: "2", meal_quality: "poor", children_present: 4, children_ate: 2, balanced_meal: false, allergies_checked: false }),
      makeRecord({ id: "3", meal_type: "breakfast", children_present: 3, children_ate: 3 }),
    ];
    const m = computeMealMetrics(records);
    expect(m.total_meals).toBe(3);
    expect(m.poor_meal_count).toBe(1);
    expect(m.excellent_meal_count).toBe(1);
    // children_ate_rate: (4+2+3)/(4+4+3) = 9/11 = 81.8%
    expect(m.children_ate_rate).toBe(81.8);
    // balanced: 2 out of 3
    expect(m.balanced_meal_rate).toBe(66.7);
    // allergies: 2 out of 3
    expect(m.allergies_checked_rate).toBe(66.7);
    expect(m.by_meal_type["dinner"]).toBe(2);
    expect(m.by_meal_type["breakfast"]).toBe(1);
    expect(m.by_meal_quality["poor"]).toBe(1);
    expect(m.by_meal_quality["excellent"]).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", fresh_ingredients_used: true, cultural_needs_considered: false }),
      makeRecord({ id: "2", fresh_ingredients_used: false, cultural_needs_considered: false }),
    ];
    const m = computeMealMetrics(records);
    expect(m.fresh_ingredients_rate).toBe(50);
    expect(m.cultural_needs_rate).toBe(0);
  });
});

describe("identifyMealAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyMealAlerts([])).toHaveLength(0);
  });

  it("triggers allergies_not_checked (critical) for each record where allergies not checked", () => {
    const records = [
      makeRecord({ id: "a1", allergies_checked: false }),
    ];
    const alerts = identifyMealAlerts(records);
    const a = alerts.find((x) => x.type === "allergies_not_checked");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
    expect(a!.id).toBe("a1");
  });

  it("triggers poor_meal_quality (high) when >= 2 meals rated poor", () => {
    const records = [
      makeRecord({ id: "1", meal_quality: "poor" }),
      makeRecord({ id: "2", meal_quality: "poor" }),
    ];
    const alerts = identifyMealAlerts(records);
    const a = alerts.find((x) => x.type === "poor_meal_quality");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("does NOT trigger poor_meal_quality when only 1 meal is poor", () => {
    const records = [
      makeRecord({ id: "1", meal_quality: "poor" }),
    ];
    const alerts = identifyMealAlerts(records);
    expect(alerts.find((x) => x.type === "poor_meal_quality")).toBeUndefined();
  });

  it("triggers low_eating_rate (high) when totalAte / totalPresent < 0.7", () => {
    const records = [
      makeRecord({ id: "1", children_present: 10, children_ate: 3 }),
      makeRecord({ id: "2", children_present: 10, children_ate: 3 }),
    ];
    const alerts = identifyMealAlerts(records);
    const a = alerts.find((x) => x.type === "low_eating_rate");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("does NOT trigger low_eating_rate when eating ratio >= 0.7", () => {
    const records = [
      makeRecord({ id: "1", children_present: 10, children_ate: 7 }),
    ];
    const alerts = identifyMealAlerts(records);
    expect(alerts.find((x) => x.type === "low_eating_rate")).toBeUndefined();
  });

  it("triggers cultural_needs_missed (medium) when >= 3 meals without cultural consideration", () => {
    const records = [
      makeRecord({ id: "1", cultural_needs_considered: false }),
      makeRecord({ id: "2", cultural_needs_considered: false }),
      makeRecord({ id: "3", cultural_needs_considered: false }),
    ];
    const alerts = identifyMealAlerts(records);
    const a = alerts.find((x) => x.type === "cultural_needs_missed");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });

  it("triggers no_child_choice (medium) when >= 3 meals without children_involved_in_choice", () => {
    const records = [
      makeRecord({ id: "1", children_involved_in_choice: false }),
      makeRecord({ id: "2", children_involved_in_choice: false }),
      makeRecord({ id: "3", children_involved_in_choice: false }),
    ];
    const alerts = identifyMealAlerts(records);
    const a = alerts.find((x) => x.type === "no_child_choice");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });
});
