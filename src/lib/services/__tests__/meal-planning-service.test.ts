import { describe, expect, it } from "vitest";
import {
  computeAlerts,
  computeMetrics,
  type MealPlanningRow,
} from "../meal-planning-service";

function makeRecord(
  overrides: Partial<MealPlanningRow> = {},
): MealPlanningRow {
  return {
    id: "r-1",
    home_id: "home_oak",
    child_name: "Jamie",
    record_date: "2026-05-04",
    recorded_by: "Alex Morgan",
    record_type: "Meal Feedback",
    dietary_requirement: null,
    child_choice_offered: true,
    child_participated_cooking: true,
    age_appropriate_involvement: true,
    nutritional_balance: "Excellent",
    cultural_needs_met: true,
    allergy_information_current: true,
    portion_appropriate: true,
    mealtimes_social: true,
    snacks_available: true,
    hydration_monitored: true,
    eating_concern_identified: false,
    concern_details: null,
    notes: null,
    created_at: "2026-05-04T10:00:00Z",
    updated_at: "2026-05-04T10:00:00Z",
    ...overrides,
  };
}

describe("tri-state judgements", () => {
  it("splits the allergy life-safety critical between recorded not-current and unrecorded", () => {
    const nullAlert = computeAlerts([
      makeRecord({ allergy_information_current: null }),
    ]).find((a) => a.type === "allergy_not_current");
    const falseAlert = computeAlerts([
      makeRecord({ allergy_information_current: false }),
    ]).find((a) => a.type === "allergy_not_current");
    expect(nullAlert).toBeTruthy();
    expect(falseAlert).toBeTruthy();
    expect(nullAlert!.message).not.toBe(falseAlert!.message);
  });

  it("raises no allergy critical when the information is recorded as current", () => {
    const alerts = computeAlerts([makeRecord({ allergy_information_current: true })]);
    expect(alerts.some((a) => a.type === "allergy_not_current")).toBe(false);
  });

  it("does not dilute the allergy-current rate with unrecorded rows", () => {
    const rows = [true, null, null, null].map((v, i) =>
      makeRecord({ id: `r-${i}`, allergy_information_current: v }),
    );
    expect(computeMetrics(rows).allergy_information_current_rate).toBe(100);
  });
});
