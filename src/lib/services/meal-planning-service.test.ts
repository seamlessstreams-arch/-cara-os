import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateMealPlanning,
  type MealPlanningRow,
} from "./meal-planning-service";

function makeRow(
  overrides: Partial<MealPlanningRow> = {},
): MealPlanningRow {
  return {
    id: "row-1",
    home_id: "home-1",
    child_name: "Child A",
    record_date: "2026-05-20",
    recorded_by: "Staff A",
    record_type: "Meal Feedback",
    dietary_requirement: null,
    child_choice_offered: true,
    child_participated_cooking: true,
    age_appropriate_involvement: true,
    nutritional_balance: "Good",
    cultural_needs_met: true,
    allergy_information_current: true,
    portion_appropriate: true,
    mealtimes_social: true,
    snacks_available: true,
    hydration_monitored: true,
    eating_concern_identified: false,
    concern_details: null,
    notes: null,
    created_at: "2026-05-20T10:00:00Z",
    updated_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.child_choice_offered_rate).toBeNull();; expect(m.eating_concern_rate).toBeNull();; });

  it("computes correct counts and rates for populated data", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Child A", record_type: "Cooking Session", nutritional_balance: "Excellent", child_choice_offered: true }),
      makeRow({ id: "2", child_name: "Child B", record_type: "Menu Planning Input", nutritional_balance: "Poor", child_choice_offered: false, allergy_information_current: false }),
      makeRow({ id: "3", child_name: "Child A", record_type: "Cultural/Religious Diet", nutritional_balance: "Good", dietary_requirement: "halal" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(3);
    expect(m.unique_children).toBe(2);
    expect(m.skill_type_count).toBe(1); // Cooking Session
    expect(m.choice_type_count).toBe(1); // Menu Planning Input
    expect(m.cultural_type_count).toBe(1); // Cultural/Religious Diet
    expect(m.planning_type_count).toBe(1); // Menu Planning Input
    expect(m.child_choice_offered_rate).toBe(66.7);
    expect(m.excellent_nutrition_rate).toBe(33.3);
    expect(m.poor_nutrition_rate).toBe(33.3);
    expect(m.children_with_dietary_requirements).toBe(1);
    expect(m.average_records_per_child).toBe(1.5);
  });

  it("computes hydration rate only from non-null rows", () => {
    const rows = [
      makeRow({ id: "1", hydration_monitored: true }),
      makeRow({ id: "2", hydration_monitored: false }),
      makeRow({ id: "3", hydration_monitored: null }),
    ];
    const m = computeMetrics(rows);
    expect(m.hydration_monitored_rate).toBe(50); // 1/2 non-null
  });
});

describe("computeAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(computeAlerts([])).toHaveLength(0);
  });

  it("triggers allergy_not_current (critical) for every row where allergy info is not current", () => {
    const rows = [
      makeRow({ id: "a1", allergy_information_current: false }),
    ];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "allergy_not_current");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("triggers eating_concern (critical) for every row with eating concern", () => {
    const rows = [
      makeRow({ id: "a2", eating_concern_identified: true, concern_details: "food hoarding" }),
    ];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "eating_concern");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("triggers poor_nutrition (critical) for every row with Poor nutritional_balance", () => {
    const rows = [
      makeRow({ id: "a3", nutritional_balance: "Poor" }),
    ];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "poor_nutrition");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("triggers snacks_unavailable (high) for every row with snacks_available=false", () => {
    const rows = [
      makeRow({ id: "a4", snacks_available: false }),
    ];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "snacks_unavailable");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers low_child_choice (high) when child has >= 3 records and < 40% choice offered", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Child X", child_choice_offered: false }),
      makeRow({ id: "2", child_name: "Child X", child_choice_offered: false }),
      makeRow({ id: "3", child_name: "Child X", child_choice_offered: true }),
    ];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "low_child_choice");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers cultural_needs_unmet (high) for Cultural/Religious Diet with cultural_needs_met=false", () => {
    const rows = [
      makeRow({ id: "a6", record_type: "Cultural/Religious Diet", cultural_needs_met: false }),
    ];
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "cultural_needs_unmet");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers mealtimes_not_social (high) when >= 5 rows and > 40% not social", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      makeRow({ id: `r${i}`, mealtimes_social: i < 3 ? false : true }),
    );
    const alerts = computeAlerts(rows);
    const a = alerts.find((x) => x.type === "mealtimes_not_social");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });
});

describe("validateMealPlanning", () => {
  it("returns valid for correct input", () => {
    const result = validateMealPlanning({
      childName: "Child A",
      recordDate: "2026-05-20",
      recordedBy: "Staff A",
      recordType: "Meal Feedback",
      childChoiceOffered: true,
      allergyInformationCurrent: true,
      snacksAvailable: true,
      mealtimesSocial: true,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns errors for missing required fields", () => {
    const result = validateMealPlanning({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("returns error when child choice not offered", () => {
    const result = validateMealPlanning({
      childName: "Child A",
      recordDate: "2026-05-20",
      recordedBy: "Staff A",
      recordType: "Meal Feedback",
      childChoiceOffered: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Child choice not offered"))).toBe(true);
  });
});
