import { describe, it, expect } from "vitest";
import {
  computeMenuPlanningMetrics,
  identifyMenuPlanningAlerts,
  type MenuPlanningDietaryRecord,
} from "./menu-planning-dietary-service";

function makeRecord(overrides: Partial<MenuPlanningDietaryRecord> = {}): MenuPlanningDietaryRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    child_name: "Child A",
    child_id: "child-1",
    meal_type: "lunch",
    dietary_category: "standard",
    nutritional_rating: "good",
    child_satisfaction: "enjoyed_it",
    session_date: "2026-05-01",
    recorded_by: "Staff A",
    meal_description: "Chicken pasta",
    ingredients_listed: "chicken, pasta, tomato",
    allergens_present: null,
    allergens_avoided: null,
    cultural_considerations: null,
    child_involvement: null,
    portion_size_notes: null,
    hydration_notes: null,
    child_feedback: null,
    staff_observations: null,
    approved_by: null,
    approved_at: null,
    allergens_checked: true,
    dietary_needs_met: true,
    cultural_needs_met: true,
    child_chose_meal: true,
    child_helped_prepare: false,
    nutritionally_balanced: true,
    portion_appropriate: true,
    hydration_monitored: true,
    mealtime_positive: true,
    leftovers_noted: false,
    medical_diet_followed: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeMenuPlanningMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMenuPlanningMetrics([]);
    expect(m.total_meals).toBe(0);
    expect(m.poor_nutrition_count).toBe(0);
    expect(m.refused_count).toBe(0);
    expect(m.allergen_concern_count).toBe(0);
    expect(m.cultural_not_met_count).toBe(0);
    expect(m.allergens_checked_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("computes correct counts and rates for populated data", () => {
    const records = [
      makeRecord({ id: "r1", nutritional_rating: "poor", child_satisfaction: "refused", allergens_checked: false, cultural_needs_met: false, child_name: "A" }),
      makeRecord({ id: "r2", nutritional_rating: "inadequate", allergens_checked: false, child_name: "B" }),
      makeRecord({ id: "r3", nutritional_rating: "good", child_name: "A" }),
    ];
    const m = computeMenuPlanningMetrics(records);
    expect(m.total_meals).toBe(3);
    expect(m.poor_nutrition_count).toBe(2); // poor + inadequate
    expect(m.refused_count).toBe(1);
    expect(m.allergen_concern_count).toBe(2);
    expect(m.cultural_not_met_count).toBe(1);
    expect(m.unique_children).toBe(2);
    // allergens_checked: 1 out of 3 = 33.3
    expect(m.allergens_checked_rate).toBe(33.3);
  });

  it("builds breakdowns by meal_type and dietary_category", () => {
    const records = [
      makeRecord({ meal_type: "breakfast", dietary_category: "halal" }),
      makeRecord({ id: "r2", meal_type: "breakfast", dietary_category: "halal" }),
      makeRecord({ id: "r3", meal_type: "dinner", dietary_category: "vegan" }),
    ];
    const m = computeMenuPlanningMetrics(records);
    expect(m.by_meal_type).toEqual({ breakfast: 2, dinner: 1 });
    expect(m.by_dietary_category).toEqual({ halal: 2, vegan: 1 });
  });
});

describe("identifyMenuPlanningAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(identifyMenuPlanningAlerts([])).toEqual([]);
  });

  it("returns empty array when no alert conditions are met", () => {
    const records = [makeRecord()];
    expect(identifyMenuPlanningAlerts(records)).toEqual([]);
  });

  it("fires critical alert for allergen_medical_risk (medical diet + allergens not checked)", () => {
    const records = [makeRecord({ dietary_category: "medical_diet", allergens_checked: false })];
    const alerts = identifyMenuPlanningAlerts(records);
    const match = alerts.find((a) => a.type === "allergen_medical_risk");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for allergens_not_checked when >= 1", () => {
    const records = [makeRecord({ allergens_checked: false })];
    const alerts = identifyMenuPlanningAlerts(records);
    const match = alerts.find((a) => a.type === "allergens_not_checked");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for dietary_needs_not_met when >= 1", () => {
    const records = [makeRecord({ dietary_needs_met: false })];
    const alerts = identifyMenuPlanningAlerts(records);
    const match = alerts.find((a) => a.type === "dietary_needs_not_met");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for cultural_needs_not_met when >= 2", () => {
    // Only 1 — should NOT trigger
    expect(
      identifyMenuPlanningAlerts([makeRecord({ cultural_needs_met: false })])
        .find((a) => a.type === "cultural_needs_not_met"),
    ).toBeUndefined();
    // 2 — should trigger
    const records = [
      makeRecord({ id: "r1", cultural_needs_met: false }),
      makeRecord({ id: "r2", cultural_needs_met: false }),
    ];
    const alerts = identifyMenuPlanningAlerts(records);
    const match = alerts.find((a) => a.type === "cultural_needs_not_met");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("fires medium alert for poor_nutrition when >= 2", () => {
    const records = [
      makeRecord({ id: "r1", nutritional_rating: "poor" }),
      makeRecord({ id: "r2", nutritional_rating: "inadequate" }),
    ];
    const alerts = identifyMenuPlanningAlerts(records);
    const match = alerts.find((a) => a.type === "poor_nutrition");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});
