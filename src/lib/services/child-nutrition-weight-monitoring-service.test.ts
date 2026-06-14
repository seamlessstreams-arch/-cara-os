import { describe, it, expect } from "vitest";
import {
  computeNutritionMetrics,
  computeNutritionAlerts,
  generateNutritionCaraInsights,
} from "./child-nutrition-weight-monitoring-service";
import type { ChildNutritionWeightMonitoringRow } from "./child-nutrition-weight-monitoring-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<ChildNutritionWeightMonitoringRow> = {}): ChildNutritionWeightMonitoringRow {
  return {
    id: "nut-1",
    home_id: "home-1",
    child_name: "Child A",
    child_id: null,
    assessment_date: "2026-05-01",
    bmi_category: "healthy_weight",
    dietary_need: "none",
    monitoring_status: "routine",
    assessment_type: "quarterly",
    weight_recorded: true,
    height_recorded: true,
    bmi_calculated: true,
    dietary_needs_met: true,
    portion_sizes_appropriate: true,
    hydration_adequate: true,
    clinical_referral_made: false,
    weight_management_plan: false,
    assessor_name: "Assessor 1",
    bmi_value: 20.5,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeNutritionMetrics --------------------------------------------------

describe("computeNutritionMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeNutritionMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.underweight_count).toBe(0);
    expect(m.overweight_count).toBe(0);
    expect(m.obese_count).toBe(0);
    expect(m.concern_count).toBe(0);
    expect(m.unique_children).toBe(0);
  });

  it("counts BMI categories correctly", () => {
    const rows = [
      makeRow({ id: "1", bmi_category: "underweight" }),
      makeRow({ id: "2", bmi_category: "overweight" }),
      makeRow({ id: "3", bmi_category: "obese" }),
      makeRow({ id: "4", bmi_category: "severely_obese" }),
      makeRow({ id: "5", bmi_category: "healthy_weight" }),
    ];
    const m = computeNutritionMetrics(rows);
    expect(m.underweight_count).toBe(1);
    expect(m.overweight_count).toBe(1);
    expect(m.obese_count).toBe(2); // obese + severely_obese
  });

  it("counts concern_identified monitoring status", () => {
    const rows = [
      makeRow({ id: "1", monitoring_status: "concern_identified" }),
      makeRow({ id: "2", monitoring_status: "concern_identified" }),
      makeRow({ id: "3", monitoring_status: "routine" }),
    ];
    const m = computeNutritionMetrics(rows);
    expect(m.concern_count).toBe(2);
  });

  it("calculates boolean rates", () => {
    const rows = [
      makeRow({ id: "1", bmi_calculated: true, hydration_adequate: true }),
      makeRow({ id: "2", bmi_calculated: false, hydration_adequate: false }),
    ];
    const m = computeNutritionMetrics(rows);
    expect(m.bmi_calculated_rate).toBe(50);
    expect(m.hydration_adequate_rate).toBe(50);
  });

  it("builds BMI and dietary breakdowns", () => {
    const rows = [
      makeRow({ id: "1", bmi_category: "underweight", dietary_need: "halal" }),
      makeRow({ id: "2", bmi_category: "underweight", dietary_need: "halal" }),
      makeRow({ id: "3", bmi_category: "healthy_weight", dietary_need: "none" }),
    ];
    const m = computeNutritionMetrics(rows);
    expect(m.bmi_breakdown["underweight"]).toBe(2);
    expect(m.bmi_breakdown["healthy_weight"]).toBe(1);
    expect(m.dietary_breakdown["halal"]).toBe(2);
    expect(m.dietary_breakdown["none"]).toBe(1);
  });
});

// -- computeNutritionAlerts ---------------------------------------------------

describe("computeNutritionAlerts", () => {
  it("returns empty for empty input", () => {
    expect(computeNutritionAlerts([])).toEqual([]);
  });

  it("fires critical alert for obese without clinical referral", () => {
    const rows = [makeRow({ bmi_category: "obese", clinical_referral_made: false })];
    const alerts = computeNutritionAlerts(rows);
    const found = alerts.find((a) => a.type === "obese_no_clinical_referral");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires critical alert for severely_obese without clinical referral", () => {
    const rows = [makeRow({ bmi_category: "severely_obese", clinical_referral_made: false })];
    const alerts = computeNutritionAlerts(rows);
    const found = alerts.find((a) => a.type === "obese_no_clinical_referral");
    expect(found).toBeDefined();
  });

  it("fires high alert for underweight without weight management plan", () => {
    const rows = [makeRow({ bmi_category: "underweight", weight_management_plan: false })];
    const alerts = computeNutritionAlerts(rows);
    const found = alerts.find((a) => a.type === "underweight_no_plan");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires high alert for dietary needs not met", () => {
    const rows = [makeRow({ dietary_needs_met: false })];
    const alerts = computeNutritionAlerts(rows);
    const found = alerts.find((a) => a.type === "dietary_needs_not_met");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires medium alert for BMI not calculated", () => {
    const rows = [makeRow({ bmi_calculated: false })];
    const alerts = computeNutritionAlerts(rows);
    const found = alerts.find((a) => a.type === "bmi_not_calculated");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("fires medium alert for hydration not adequate", () => {
    const rows = [makeRow({ hydration_adequate: false })];
    const alerts = computeNutritionAlerts(rows);
    const found = alerts.find((a) => a.type === "hydration_not_adequate");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("does NOT fire obese alert when clinical referral IS made", () => {
    const rows = [makeRow({ bmi_category: "obese", clinical_referral_made: true })];
    const alerts = computeNutritionAlerts(rows);
    const found = alerts.find((a) => a.type === "obese_no_clinical_referral");
    expect(found).toBeUndefined();
  });
});

// -- generateNutritionCaraInsights --------------------------------------------

describe("generateNutritionCaraInsights", () => {
  it("returns 3 insights for empty data", () => {
    const insights = generateNutritionCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[red]");
    expect(insights[2]).toContain("[reflect]");
  });

  it("shows critical counts when alerts present", () => {
    const rows = [makeRow({ bmi_category: "obese", clinical_referral_made: false })];
    const insights = generateNutritionCaraInsights(rows);
    expect(insights[1]).toContain("critical");
  });
});
