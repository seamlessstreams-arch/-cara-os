import { describe, it, expect } from "vitest";

import {
  BMI_CATEGORIES,
  DIETARY_NEEDS,
  MONITORING_STATUSES,
  ASSESSMENT_TYPES,
  _testing,
} from "../child-nutrition-weight-monitoring-service";

import type {
  ChildNutritionWeightMonitoringRow,
} from "../child-nutrition-weight-monitoring-service";

const {
  computeNutritionMetrics,
  computeNutritionAlerts,
  generateNutritionCaraInsights,
} = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<ChildNutritionWeightMonitoringRow>,
): ChildNutritionWeightMonitoringRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: overrides?.home_id ?? "home-1",
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    assessment_date: overrides?.assessment_date ?? now.toISOString().split("T")[0],
    bmi_category: overrides?.bmi_category ?? "healthy_weight",
    dietary_need: overrides?.dietary_need ?? "none",
    monitoring_status: overrides?.monitoring_status ?? "routine",
    assessment_type: overrides?.assessment_type ?? "initial",
    weight_recorded: overrides?.weight_recorded ?? true,
    height_recorded: overrides?.height_recorded ?? true,
    bmi_calculated: overrides?.bmi_calculated ?? true,
    dietary_needs_met: overrides?.dietary_needs_met ?? true,
    portion_sizes_appropriate: overrides?.portion_sizes_appropriate ?? true,
    hydration_adequate: overrides?.hydration_adequate ?? true,
    clinical_referral_made: overrides?.clinical_referral_made ?? true,
    weight_management_plan: overrides?.weight_management_plan ?? true,
    assessor_name: "assessor_name" in (overrides ?? {}) ? (overrides!.assessor_name ?? null) : null,
    bmi_value: "bmi_value" in (overrides ?? {}) ? (overrides!.bmi_value ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("child-nutrition-weight-monitoring-service", () => {
  // ── Enum validation ──────────────────────────────────────────────────
  describe("Enum validation", () => {
    it("BMI_CATEGORIES has 6 values", () => { expect(BMI_CATEGORIES).toHaveLength(6); });
    it("BMI_CATEGORIES contains underweight", () => { expect(BMI_CATEGORIES).toContain("underweight"); });
    it("BMI_CATEGORIES contains healthy_weight", () => { expect(BMI_CATEGORIES).toContain("healthy_weight"); });
    it("BMI_CATEGORIES contains overweight", () => { expect(BMI_CATEGORIES).toContain("overweight"); });
    it("BMI_CATEGORIES contains obese", () => { expect(BMI_CATEGORIES).toContain("obese"); });
    it("BMI_CATEGORIES contains severely_obese", () => { expect(BMI_CATEGORIES).toContain("severely_obese"); });
    it("BMI_CATEGORIES contains not_assessed", () => { expect(BMI_CATEGORIES).toContain("not_assessed"); });

    it("DIETARY_NEEDS has 10 values", () => { expect(DIETARY_NEEDS).toHaveLength(10); });
    it("DIETARY_NEEDS contains none", () => { expect(DIETARY_NEEDS).toContain("none"); });
    it("DIETARY_NEEDS contains vegetarian", () => { expect(DIETARY_NEEDS).toContain("vegetarian"); });
    it("DIETARY_NEEDS contains vegan", () => { expect(DIETARY_NEEDS).toContain("vegan"); });
    it("DIETARY_NEEDS contains halal", () => { expect(DIETARY_NEEDS).toContain("halal"); });
    it("DIETARY_NEEDS contains kosher", () => { expect(DIETARY_NEEDS).toContain("kosher"); });
    it("DIETARY_NEEDS contains gluten_free", () => { expect(DIETARY_NEEDS).toContain("gluten_free"); });
    it("DIETARY_NEEDS contains dairy_free", () => { expect(DIETARY_NEEDS).toContain("dairy_free"); });
    it("DIETARY_NEEDS contains allergy_specific", () => { expect(DIETARY_NEEDS).toContain("allergy_specific"); });
    it("DIETARY_NEEDS contains medical_diet", () => { expect(DIETARY_NEEDS).toContain("medical_diet"); });
    it("DIETARY_NEEDS contains cultural", () => { expect(DIETARY_NEEDS).toContain("cultural"); });

    it("MONITORING_STATUSES has 6 values", () => { expect(MONITORING_STATUSES).toHaveLength(6); });
    it("MONITORING_STATUSES contains routine", () => { expect(MONITORING_STATUSES).toContain("routine"); });
    it("MONITORING_STATUSES contains concern_identified", () => { expect(MONITORING_STATUSES).toContain("concern_identified"); });
    it("MONITORING_STATUSES contains plan_in_place", () => { expect(MONITORING_STATUSES).toContain("plan_in_place"); });
    it("MONITORING_STATUSES contains referral_made", () => { expect(MONITORING_STATUSES).toContain("referral_made"); });
    it("MONITORING_STATUSES contains under_clinical_care", () => { expect(MONITORING_STATUSES).toContain("under_clinical_care"); });
    it("MONITORING_STATUSES contains resolved", () => { expect(MONITORING_STATUSES).toContain("resolved"); });

    it("ASSESSMENT_TYPES has 6 values", () => { expect(ASSESSMENT_TYPES).toHaveLength(6); });
    it("ASSESSMENT_TYPES contains initial", () => { expect(ASSESSMENT_TYPES).toContain("initial"); });
    it("ASSESSMENT_TYPES contains quarterly", () => { expect(ASSESSMENT_TYPES).toContain("quarterly"); });
    it("ASSESSMENT_TYPES contains annual", () => { expect(ASSESSMENT_TYPES).toContain("annual"); });
    it("ASSESSMENT_TYPES contains concern_triggered", () => { expect(ASSESSMENT_TYPES).toContain("concern_triggered"); });
    it("ASSESSMENT_TYPES contains clinical_review", () => { expect(ASSESSMENT_TYPES).toContain("clinical_review"); });
    it("ASSESSMENT_TYPES contains follow_up", () => { expect(ASSESSMENT_TYPES).toContain("follow_up"); });
  });

  // ── makeRow factory ─────────────────────────────────────────────────
  describe("makeRow factory", () => {
    it("produces a valid default row", () => {
      const r = makeRow();
      expect(r.id).toBeDefined();
      expect(r.home_id).toBe("home-1");
      expect(r.child_name).toBe("Child A");
    });
    it("overrides child_name", () => { expect(makeRow({ child_name: "Zara" }).child_name).toBe("Zara"); });
    it("overrides bmi_category", () => { expect(makeRow({ bmi_category: "obese" }).bmi_category).toBe("obese"); });
    it("overrides id when provided", () => { expect(makeRow({ id: "my-id" }).id).toBe("my-id"); });
    it("overrides child_id to a value", () => { expect(makeRow({ child_id: "c-1" }).child_id).toBe("c-1"); });
    it("overrides child_id to null explicitly", () => { expect(makeRow({ child_id: null }).child_id).toBeNull(); });
    it("default child_id is null", () => { expect(makeRow().child_id).toBeNull(); });
    it("overrides assessor_name", () => { expect(makeRow({ assessor_name: "Jane" }).assessor_name).toBe("Jane"); });
    it("overrides bmi_value", () => { expect(makeRow({ bmi_value: 22.5 }).bmi_value).toBe(22.5); });
    it("overrides notes", () => { expect(makeRow({ notes: "some notes" }).notes).toBe("some notes"); });
    it("default notes is null", () => { expect(makeRow().notes).toBeNull(); });
    it("default assessor_name is null", () => { expect(makeRow().assessor_name).toBeNull(); });
    it("default bmi_value is null", () => { expect(makeRow().bmi_value).toBeNull(); });
    it("overrides booleans", () => {
      const r = makeRow({ weight_recorded: false, height_recorded: false });
      expect(r.weight_recorded).toBe(false);
      expect(r.height_recorded).toBe(false);
    });
    it("overrides dietary_need", () => { expect(makeRow({ dietary_need: "halal" }).dietary_need).toBe("halal"); });
    it("overrides monitoring_status", () => { expect(makeRow({ monitoring_status: "concern_identified" }).monitoring_status).toBe("concern_identified"); });
    it("overrides assessment_type", () => { expect(makeRow({ assessment_type: "quarterly" }).assessment_type).toBe("quarterly"); });
  });

  // ── computeNutritionMetrics ──────────────────────────────────────────
  describe("computeNutritionMetrics", () => {
    it("returns zeros for empty array", () => {
      const m = computeNutritionMetrics([]);
      expect(m.total_assessments).toBe(0);
      expect(m.underweight_count).toBe(0);
      expect(m.overweight_count).toBe(0);
      expect(m.obese_count).toBe(0);
      expect(m.concern_count).toBe(0);
      expect(m.weight_recorded_rate).toBe(0);
      expect(m.height_recorded_rate).toBe(0);
      expect(m.bmi_calculated_rate).toBe(0);
      expect(m.dietary_needs_met_rate).toBe(0);
      expect(m.portion_sizes_appropriate_rate).toBe(0);
      expect(m.hydration_adequate_rate).toBe(0);
      expect(m.clinical_referral_made_rate).toBe(0);
      expect(m.weight_management_plan_rate).toBe(0);
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns for empty array", () => {
      const m = computeNutritionMetrics([]);
      expect(m.bmi_breakdown).toEqual({});
      expect(m.dietary_breakdown).toEqual({});
    });
    it("total_assessments counts rows", () => { expect(computeNutritionMetrics([makeRow(), makeRow(), makeRow()]).total_assessments).toBe(3); });
    it("counts underweight_count", () => { expect(computeNutritionMetrics([makeRow({ bmi_category: "underweight" })]).underweight_count).toBe(1); });
    it("does not count healthy_weight as underweight", () => { expect(computeNutritionMetrics([makeRow({ bmi_category: "healthy_weight" })]).underweight_count).toBe(0); });
    it("does not count overweight as underweight", () => { expect(computeNutritionMetrics([makeRow({ bmi_category: "overweight" })]).underweight_count).toBe(0); });
    it("counts overweight_count", () => { expect(computeNutritionMetrics([makeRow({ bmi_category: "overweight" })]).overweight_count).toBe(1); });
    it("does not count obese as overweight", () => { expect(computeNutritionMetrics([makeRow({ bmi_category: "obese" })]).overweight_count).toBe(0); });
    it("does not count healthy_weight as overweight", () => { expect(computeNutritionMetrics([makeRow({ bmi_category: "healthy_weight" })]).overweight_count).toBe(0); });
    it("counts obese in obese_count", () => { expect(computeNutritionMetrics([makeRow({ bmi_category: "obese" })]).obese_count).toBe(1); });
    it("counts severely_obese in obese_count", () => { expect(computeNutritionMetrics([makeRow({ bmi_category: "severely_obese" })]).obese_count).toBe(1); });
    it("does not count overweight in obese_count", () => { expect(computeNutritionMetrics([makeRow({ bmi_category: "overweight" })]).obese_count).toBe(0); });
    it("does not count healthy_weight in obese_count", () => { expect(computeNutritionMetrics([makeRow({ bmi_category: "healthy_weight" })]).obese_count).toBe(0); });
    it("obese_count combines obese and severely_obese", () => {
      const m = computeNutritionMetrics([makeRow({ bmi_category: "obese" }), makeRow({ bmi_category: "severely_obese" })]);
      expect(m.obese_count).toBe(2);
    });
    it("counts concern_count for concern_identified", () => { expect(computeNutritionMetrics([makeRow({ monitoring_status: "concern_identified" })]).concern_count).toBe(1); });
    it("does not count routine as concern_count", () => { expect(computeNutritionMetrics([makeRow({ monitoring_status: "routine" })]).concern_count).toBe(0); });
    it("does not count plan_in_place as concern_count", () => { expect(computeNutritionMetrics([makeRow({ monitoring_status: "plan_in_place" })]).concern_count).toBe(0); });

    // Boolean rates — true
    it("weight_recorded_rate 100 when all true", () => { expect(computeNutritionMetrics([makeRow({ weight_recorded: true })]).weight_recorded_rate).toBe(100); });
    it("height_recorded_rate 100 when all true", () => { expect(computeNutritionMetrics([makeRow({ height_recorded: true })]).height_recorded_rate).toBe(100); });
    it("bmi_calculated_rate 100 when all true", () => { expect(computeNutritionMetrics([makeRow({ bmi_calculated: true })]).bmi_calculated_rate).toBe(100); });
    it("dietary_needs_met_rate 100 when all true", () => { expect(computeNutritionMetrics([makeRow({ dietary_needs_met: true })]).dietary_needs_met_rate).toBe(100); });
    it("portion_sizes_appropriate_rate 100 when all true", () => { expect(computeNutritionMetrics([makeRow({ portion_sizes_appropriate: true })]).portion_sizes_appropriate_rate).toBe(100); });
    it("hydration_adequate_rate 100 when all true", () => { expect(computeNutritionMetrics([makeRow({ hydration_adequate: true })]).hydration_adequate_rate).toBe(100); });
    it("clinical_referral_made_rate 100 when all true", () => { expect(computeNutritionMetrics([makeRow({ clinical_referral_made: true })]).clinical_referral_made_rate).toBe(100); });
    it("weight_management_plan_rate 100 when all true", () => { expect(computeNutritionMetrics([makeRow({ weight_management_plan: true })]).weight_management_plan_rate).toBe(100); });

    // Boolean rates — false
    it("weight_recorded_rate 0 when all false", () => { expect(computeNutritionMetrics([makeRow({ weight_recorded: false })]).weight_recorded_rate).toBe(0); });
    it("height_recorded_rate 0 when all false", () => { expect(computeNutritionMetrics([makeRow({ height_recorded: false })]).height_recorded_rate).toBe(0); });
    it("bmi_calculated_rate 0 when all false", () => { expect(computeNutritionMetrics([makeRow({ bmi_calculated: false })]).bmi_calculated_rate).toBe(0); });
    it("dietary_needs_met_rate 0 when all false", () => { expect(computeNutritionMetrics([makeRow({ dietary_needs_met: false })]).dietary_needs_met_rate).toBe(0); });
    it("portion_sizes_appropriate_rate 0 when all false", () => { expect(computeNutritionMetrics([makeRow({ portion_sizes_appropriate: false })]).portion_sizes_appropriate_rate).toBe(0); });
    it("hydration_adequate_rate 0 when all false", () => { expect(computeNutritionMetrics([makeRow({ hydration_adequate: false })]).hydration_adequate_rate).toBe(0); });
    it("clinical_referral_made_rate 0 when all false", () => { expect(computeNutritionMetrics([makeRow({ clinical_referral_made: false })]).clinical_referral_made_rate).toBe(0); });
    it("weight_management_plan_rate 0 when all false", () => { expect(computeNutritionMetrics([makeRow({ weight_management_plan: false })]).weight_management_plan_rate).toBe(0); });

    // Mixed rates
    it("mixed boolean rate calculates correctly (2 of 3)", () => {
      const m = computeNutritionMetrics([
        makeRow({ bmi_calculated: true }),
        makeRow({ bmi_calculated: false }),
        makeRow({ bmi_calculated: true }),
      ]);
      expect(m.bmi_calculated_rate).toBe(66.7);
    });
    it("mixed boolean rate calculates correctly (1 of 3)", () => {
      const m = computeNutritionMetrics([
        makeRow({ hydration_adequate: true }),
        makeRow({ hydration_adequate: false }),
        makeRow({ hydration_adequate: false }),
      ]);
      expect(m.hydration_adequate_rate).toBe(33.3);
    });
    it("mixed boolean rate 50 for 1 of 2", () => {
      const m = computeNutritionMetrics([
        makeRow({ dietary_needs_met: true }),
        makeRow({ dietary_needs_met: false }),
      ]);
      expect(m.dietary_needs_met_rate).toBe(50);
    });

    // Unique children
    it("unique_children counts distinct child_name values", () => {
      const m = computeNutritionMetrics([
        makeRow({ child_name: "Alice" }),
        makeRow({ child_name: "Bob" }),
        makeRow({ child_name: "Alice" }),
      ]);
      expect(m.unique_children).toBe(2);
    });
    it("unique_children single child", () => { expect(computeNutritionMetrics([makeRow()]).unique_children).toBe(1); });
    it("unique_children 0 for empty", () => { expect(computeNutritionMetrics([]).unique_children).toBe(0); });

    // BMI breakdown
    it("bmi_breakdown counts all 6 categories", () => {
      const categories = ["underweight", "healthy_weight", "overweight", "obese", "severely_obese", "not_assessed"] as const;
      const rows = categories.map((c) => makeRow({ bmi_category: c }));
      const m = computeNutritionMetrics(rows);
      for (const c of categories) expect(m.bmi_breakdown[c]).toBe(1);
    });
    it("bmi_breakdown accumulates duplicates", () => {
      const m = computeNutritionMetrics([makeRow({ bmi_category: "obese" }), makeRow({ bmi_category: "obese" })]);
      expect(m.bmi_breakdown["obese"]).toBe(2);
    });

    // Dietary breakdown
    it("dietary_breakdown counts all 10 needs", () => {
      const needs = ["none", "vegetarian", "vegan", "halal", "kosher", "gluten_free", "dairy_free", "allergy_specific", "medical_diet", "cultural"] as const;
      const rows = needs.map((n) => makeRow({ dietary_need: n }));
      const m = computeNutritionMetrics(rows);
      for (const n of needs) expect(m.dietary_breakdown[n]).toBe(1);
    });
    it("dietary_breakdown accumulates duplicates", () => {
      const m = computeNutritionMetrics([makeRow({ dietary_need: "halal" }), makeRow({ dietary_need: "halal" })]);
      expect(m.dietary_breakdown["halal"]).toBe(2);
    });

    // Multiple rows aggregate
    it("multiple rows aggregate correctly", () => {
      const m = computeNutritionMetrics([
        makeRow({ bmi_category: "underweight", bmi_calculated: true, child_name: "A", monitoring_status: "concern_identified" }),
        makeRow({ bmi_category: "obese", bmi_calculated: false, child_name: "B", monitoring_status: "routine" }),
        makeRow({ bmi_category: "healthy_weight", bmi_calculated: true, child_name: "A", monitoring_status: "routine" }),
        makeRow({ bmi_category: "overweight", bmi_calculated: false, child_name: "C", monitoring_status: "concern_identified" }),
      ]);
      expect(m.total_assessments).toBe(4);
      expect(m.underweight_count).toBe(1);
      expect(m.overweight_count).toBe(1);
      expect(m.obese_count).toBe(1);
      expect(m.concern_count).toBe(2);
      expect(m.bmi_calculated_rate).toBe(50);
      expect(m.unique_children).toBe(3);
    });
  });

  // ── computeNutritionAlerts ──────────────────────────────────────────
  describe("computeNutritionAlerts", () => {
    it("returns empty for empty", () => { expect(computeNutritionAlerts([])).toEqual([]); });
    it("returns empty for clean rows", () => { expect(computeNutritionAlerts([makeRow()])).toEqual([]); });

    // Critical: obese_no_clinical_referral
    it("fires obese_no_clinical_referral for obese without clinical referral", () => {
      const a = computeNutritionAlerts([makeRow({ bmi_category: "obese", clinical_referral_made: false, child_name: "Jo" })]);
      const f = a.find((x) => x.type === "obese_no_clinical_referral");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
      expect(f!.message).toContain("Jo");
      expect(f!.message).toContain("obese");
      expect(f!.record_id).toBeDefined();
    });
    it("fires obese_no_clinical_referral for severely_obese without clinical referral", () => {
      const a = computeNutritionAlerts([makeRow({ bmi_category: "severely_obese", clinical_referral_made: false, child_name: "Sam" })]);
      const f = a.find((x) => x.type === "obese_no_clinical_referral");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
      expect(f!.message).toContain("Sam");
      expect(f!.message).toContain("severely obese");
    });
    it("does not fire obese_no_clinical_referral for overweight", () => {
      const a = computeNutritionAlerts([makeRow({ bmi_category: "overweight", clinical_referral_made: false })]);
      expect(a.find((x) => x.type === "obese_no_clinical_referral")).toBeUndefined();
    });
    it("does not fire obese_no_clinical_referral for healthy_weight", () => {
      const a = computeNutritionAlerts([makeRow({ bmi_category: "healthy_weight", clinical_referral_made: false })]);
      expect(a.find((x) => x.type === "obese_no_clinical_referral")).toBeUndefined();
    });
    it("does not fire obese_no_clinical_referral when clinical referral made", () => {
      const a = computeNutritionAlerts([makeRow({ bmi_category: "obese", clinical_referral_made: true })]);
      expect(a.find((x) => x.type === "obese_no_clinical_referral")).toBeUndefined();
    });
    it("obese_no_clinical_referral fires per-record", () => {
      const a = computeNutritionAlerts([
        makeRow({ id: "a-1", bmi_category: "obese", clinical_referral_made: false }),
        makeRow({ id: "a-2", bmi_category: "severely_obese", clinical_referral_made: false }),
      ]);
      expect(a.filter((x) => x.type === "obese_no_clinical_referral")).toHaveLength(2);
    });
    it("obese_no_clinical_referral includes record_id", () => {
      const a = computeNutritionAlerts([makeRow({ id: "rec-1", bmi_category: "obese", clinical_referral_made: false })]);
      expect(a.find((x) => x.type === "obese_no_clinical_referral")!.record_id).toBe("rec-1");
    });

    // High: underweight_no_plan
    it("fires underweight_no_plan for underweight without weight management plan", () => {
      const a = computeNutritionAlerts([makeRow({ bmi_category: "underweight", weight_management_plan: false, child_name: "Amy" })]);
      const f = a.find((x) => x.type === "underweight_no_plan");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("Amy");
      expect(f!.message).toContain("underweight");
    });
    it("does not fire underweight_no_plan for healthy_weight", () => {
      const a = computeNutritionAlerts([makeRow({ bmi_category: "healthy_weight", weight_management_plan: false })]);
      expect(a.find((x) => x.type === "underweight_no_plan")).toBeUndefined();
    });
    it("does not fire underweight_no_plan for overweight", () => {
      const a = computeNutritionAlerts([makeRow({ bmi_category: "overweight", weight_management_plan: false })]);
      expect(a.find((x) => x.type === "underweight_no_plan")).toBeUndefined();
    });
    it("does not fire underweight_no_plan when plan in place", () => {
      const a = computeNutritionAlerts([makeRow({ bmi_category: "underweight", weight_management_plan: true })]);
      expect(a.find((x) => x.type === "underweight_no_plan")).toBeUndefined();
    });
    it("underweight_no_plan fires per-record", () => {
      const a = computeNutritionAlerts([
        makeRow({ id: "b-1", bmi_category: "underweight", weight_management_plan: false }),
        makeRow({ id: "b-2", bmi_category: "underweight", weight_management_plan: false }),
      ]);
      expect(a.filter((x) => x.type === "underweight_no_plan")).toHaveLength(2);
    });
    it("underweight_no_plan includes record_id", () => {
      const a = computeNutritionAlerts([makeRow({ id: "rec-2", bmi_category: "underweight", weight_management_plan: false })]);
      expect(a.find((x) => x.type === "underweight_no_plan")!.record_id).toBe("rec-2");
    });

    // High: dietary_needs_not_met
    it("fires dietary_needs_not_met when dietary needs not met", () => {
      const a = computeNutritionAlerts([makeRow({ dietary_needs_met: false, child_name: "Lee" })]);
      const f = a.find((x) => x.type === "dietary_needs_not_met");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("Lee");
    });
    it("does not fire dietary_needs_not_met when needs met", () => {
      const a = computeNutritionAlerts([makeRow({ dietary_needs_met: true })]);
      expect(a.find((x) => x.type === "dietary_needs_not_met")).toBeUndefined();
    });
    it("dietary_needs_not_met fires per-record", () => {
      const a = computeNutritionAlerts([
        makeRow({ id: "c-1", dietary_needs_met: false }),
        makeRow({ id: "c-2", dietary_needs_met: false }),
      ]);
      expect(a.filter((x) => x.type === "dietary_needs_not_met")).toHaveLength(2);
    });
    it("dietary_needs_not_met includes record_id", () => {
      const a = computeNutritionAlerts([makeRow({ id: "rec-3", dietary_needs_met: false })]);
      expect(a.find((x) => x.type === "dietary_needs_not_met")!.record_id).toBe("rec-3");
    });

    // Medium: bmi_not_calculated
    it("fires bmi_not_calculated when BMI not calculated", () => {
      const a = computeNutritionAlerts([makeRow({ bmi_calculated: false, child_name: "Kai" })]);
      const f = a.find((x) => x.type === "bmi_not_calculated");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("medium");
      expect(f!.message).toContain("Kai");
    });
    it("does not fire bmi_not_calculated when BMI calculated", () => {
      const a = computeNutritionAlerts([makeRow({ bmi_calculated: true })]);
      expect(a.find((x) => x.type === "bmi_not_calculated")).toBeUndefined();
    });
    it("bmi_not_calculated fires per-record", () => {
      const a = computeNutritionAlerts([
        makeRow({ id: "d-1", bmi_calculated: false }),
        makeRow({ id: "d-2", bmi_calculated: false }),
      ]);
      expect(a.filter((x) => x.type === "bmi_not_calculated")).toHaveLength(2);
    });
    it("bmi_not_calculated includes record_id", () => {
      const a = computeNutritionAlerts([makeRow({ id: "rec-4", bmi_calculated: false })]);
      expect(a.find((x) => x.type === "bmi_not_calculated")!.record_id).toBe("rec-4");
    });

    // Medium: hydration_not_adequate
    it("fires hydration_not_adequate when hydration not adequate", () => {
      const a = computeNutritionAlerts([makeRow({ hydration_adequate: false, child_name: "Mia" })]);
      const f = a.find((x) => x.type === "hydration_not_adequate");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("medium");
      expect(f!.message).toContain("Mia");
    });
    it("does not fire hydration_not_adequate when hydration adequate", () => {
      const a = computeNutritionAlerts([makeRow({ hydration_adequate: true })]);
      expect(a.find((x) => x.type === "hydration_not_adequate")).toBeUndefined();
    });
    it("hydration_not_adequate fires per-record", () => {
      const a = computeNutritionAlerts([
        makeRow({ id: "e-1", hydration_adequate: false }),
        makeRow({ id: "e-2", hydration_adequate: false }),
      ]);
      expect(a.filter((x) => x.type === "hydration_not_adequate")).toHaveLength(2);
    });
    it("hydration_not_adequate includes record_id", () => {
      const a = computeNutritionAlerts([makeRow({ id: "rec-5", hydration_adequate: false })]);
      expect(a.find((x) => x.type === "hydration_not_adequate")!.record_id).toBe("rec-5");
    });

    // Multiple alerts simultaneously
    it("fires multiple alert types simultaneously", () => {
      const a = computeNutritionAlerts([
        makeRow({
          bmi_category: "obese",
          clinical_referral_made: false,
          dietary_needs_met: false,
          bmi_calculated: false,
          hydration_adequate: false,
        }),
      ]);
      const types = a.map((x) => x.type);
      expect(types).toContain("obese_no_clinical_referral");
      expect(types).toContain("dietary_needs_not_met");
      expect(types).toContain("bmi_not_calculated");
      expect(types).toContain("hydration_not_adequate");
    });
    it("does not fire underweight_no_plan for obese category", () => {
      const a = computeNutritionAlerts([makeRow({ bmi_category: "obese", weight_management_plan: false })]);
      expect(a.find((x) => x.type === "underweight_no_plan")).toBeUndefined();
    });
    it("does not fire alerts for well-managed healthy row", () => {
      const a = computeNutritionAlerts([makeRow({
        bmi_category: "healthy_weight",
        clinical_referral_made: true,
        weight_management_plan: true,
        dietary_needs_met: true,
        bmi_calculated: true,
        hydration_adequate: true,
      })]);
      expect(a).toEqual([]);
    });
    it("critical alerts have severity critical", () => {
      const a = computeNutritionAlerts([makeRow({ bmi_category: "obese", clinical_referral_made: false })]);
      const critical = a.filter((x) => x.severity === "critical");
      expect(critical.length).toBeGreaterThan(0);
    });
    it("high alerts have severity high", () => {
      const a = computeNutritionAlerts([makeRow({ bmi_category: "underweight", weight_management_plan: false })]);
      const high = a.filter((x) => x.severity === "high");
      expect(high.length).toBeGreaterThan(0);
    });
    it("medium alerts have severity medium", () => {
      const a = computeNutritionAlerts([makeRow({ bmi_calculated: false })]);
      const medium = a.filter((x) => x.severity === "medium");
      expect(medium.length).toBeGreaterThan(0);
    });

    // Edge: not_assessed category with missing referral does not trigger critical
    it("not_assessed BMI category does not trigger obese_no_clinical_referral", () => {
      const a = computeNutritionAlerts([makeRow({ bmi_category: "not_assessed", clinical_referral_made: false })]);
      expect(a.find((x) => x.type === "obese_no_clinical_referral")).toBeUndefined();
    });
    // Edge: underweight with plan does not fire
    it("underweight with plan does not fire underweight_no_plan", () => {
      const a = computeNutritionAlerts([makeRow({ bmi_category: "underweight", weight_management_plan: true })]);
      expect(a.find((x) => x.type === "underweight_no_plan")).toBeUndefined();
    });
  });

  // ── generateNutritionCaraInsights ────────────────────────────────────
  describe("generateNutritionCaraInsights", () => {
    it("returns 3 insights for empty data", () => {
      const insights = generateNutritionCaraInsights([]);
      expect(insights).toHaveLength(3);
    });
    it("returns 3 insights for populated data", () => {
      const insights = generateNutritionCaraInsights([makeRow(), makeRow()]);
      expect(insights).toHaveLength(3);
    });
    it("insight 1 starts with [red]", () => {
      expect(generateNutritionCaraInsights([])[0]).toMatch(/^\[red\]/);
    });
    it("insight 2 starts with [amber]", () => {
      expect(generateNutritionCaraInsights([])[1]).toMatch(/^\[amber\]/);
    });
    it("insight 3 starts with [reflect]", () => {
      expect(generateNutritionCaraInsights([])[2]).toMatch(/^\[reflect\]/);
    });
    it("insight 1 contains total assessments count", () => {
      const insights = generateNutritionCaraInsights([makeRow(), makeRow()]);
      expect(insights[0]).toContain("2 nutrition and weight monitoring assessments");
    });
    it("insight 1 contains unique children count", () => {
      const insights = generateNutritionCaraInsights([makeRow({ child_name: "A" }), makeRow({ child_name: "B" })]);
      expect(insights[0]).toContain("2 children");
    });
    it("insight 1 uses singular child for 1", () => {
      const insights = generateNutritionCaraInsights([makeRow()]);
      expect(insights[0]).toContain("1 child");
    });
    it("insight 1 contains weight concern breakdown", () => {
      const insights = generateNutritionCaraInsights([
        makeRow({ bmi_category: "underweight" }),
        makeRow({ bmi_category: "overweight" }),
        makeRow({ bmi_category: "obese" }),
      ]);
      expect(insights[0]).toContain("1 underweight");
      expect(insights[0]).toContain("1 overweight");
    });
    it("insight 1 contains BMI calculated rate", () => {
      const insights = generateNutritionCaraInsights([makeRow({ bmi_calculated: true })]);
      expect(insights[0]).toContain("BMI calculated rate");
      expect(insights[0]).toContain("100%");
    });
    it("insight 1 contains dietary needs met rate", () => {
      const insights = generateNutritionCaraInsights([makeRow({ dietary_needs_met: true })]);
      expect(insights[0]).toContain("Dietary needs met rate");
    });
    it("insight 2 mentions critical and high alert counts when present", () => {
      const rows = [
        makeRow({ bmi_category: "obese", clinical_referral_made: false }),
      ];
      const insights = generateNutritionCaraInsights(rows);
      expect(insights[1]).toContain("critical");
      expect(insights[1]).toContain("high-priority");
    });
    it("insight 2 shows no concerns when none", () => {
      const insights = generateNutritionCaraInsights([makeRow()]);
      expect(insights[1]).toContain("No critical or high-priority concerns");
    });
    it("insight 2 contains clinical referral rate", () => {
      const insights = generateNutritionCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Clinical referral rate");
    });
    it("insight 2 contains weight management plan rate", () => {
      const insights = generateNutritionCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Weight management plan rate");
    });
    it("insight 2 contains hydration adequate rate", () => {
      const insights = generateNutritionCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Hydration adequate rate");
    });
    it("insight 3 contains reflective question about nutritional assessments", () => {
      const insights = generateNutritionCaraInsights([]);
      expect(insights[2]).toContain("nutritional assessments");
    });
    it("insight 3 mentions cultural preferences", () => {
      const insights = generateNutritionCaraInsights([]);
      expect(insights[2]).toContain("cultural preferences");
    });
    it("insight 3 mentions health professionals", () => {
      const insights = generateNutritionCaraInsights([]);
      expect(insights[2]).toContain("health professionals");
    });
    it("all insights are strings", () => {
      const insights = generateNutritionCaraInsights([makeRow()]);
      for (const i of insights) expect(typeof i).toBe("string");
    });
    it("empty array still produces meaningful content", () => {
      const insights = generateNutritionCaraInsights([]);
      expect(insights[0]).toContain("0 nutrition and weight monitoring assessments");
      expect(insights[0]).toContain("0 children");
    });
    it("insight 1 for zero assessments shows 0 underweight and 0 overweight", () => {
      const insights = generateNutritionCaraInsights([]);
      expect(insights[0]).toContain("0 underweight");
      expect(insights[0]).toContain("0 overweight");
    });
    it("insight 2 with only medium alerts shows no critical or high", () => {
      const rows = [makeRow({ bmi_calculated: false, hydration_adequate: false })];
      const insights = generateNutritionCaraInsights(rows);
      expect(insights[1]).toContain("No critical or high-priority concerns");
    });
    it("insight 3 mentions dietary plan", () => {
      const insights = generateNutritionCaraInsights([]);
      expect(insights[2]).toContain("dietary plan");
    });
  });
});
