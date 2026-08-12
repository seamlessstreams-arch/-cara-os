// ══════════════════════════════════════════════════════════════════════════════
// CARA — MENU PLANNING & DIETARY SERVICE TESTS
// Pure-function tests for metrics computation, alert identification,
// breakdown validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing, type MenuPlanningDietaryRecord } from "../menu-planning-dietary-service";
import { todayStr } from "@/lib/utils";

const { computeMenuPlanningMetrics, identifyMenuPlanningAlerts } = _testing;

const now = new Date(todayStr());

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(overrides?: Partial<MenuPlanningDietaryRecord>): MenuPlanningDietaryRecord {
  return {
    id: overrides?.id ?? "a-1",
    home_id: overrides?.home_id ?? "home-1",
    meal_type: overrides?.meal_type ?? "dinner",
    dietary_category: overrides?.dietary_category ?? "standard",
    nutritional_rating: overrides?.nutritional_rating ?? "good",
    child_satisfaction: overrides?.child_satisfaction ?? "enjoyed_it",
    session_date: overrides?.session_date ?? todayStr(),
    child_name: overrides?.child_name ?? "Child A",
    recorded_by: overrides?.recorded_by ?? "Staff A",
    meal_description: overrides?.meal_description ?? "Test meal",
    ingredients_listed: overrides?.ingredients_listed ?? "Test ingredients",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    allergens_present: "allergens_present" in (overrides ?? {}) ? (overrides!.allergens_present ?? null) : null,
    allergens_avoided: "allergens_avoided" in (overrides ?? {}) ? (overrides!.allergens_avoided ?? null) : null,
    cultural_considerations: "cultural_considerations" in (overrides ?? {}) ? (overrides!.cultural_considerations ?? null) : null,
    child_involvement: "child_involvement" in (overrides ?? {}) ? (overrides!.child_involvement ?? null) : null,
    portion_size_notes: "portion_size_notes" in (overrides ?? {}) ? (overrides!.portion_size_notes ?? null) : null,
    hydration_notes: "hydration_notes" in (overrides ?? {}) ? (overrides!.hydration_notes ?? null) : null,
    child_feedback: "child_feedback" in (overrides ?? {}) ? (overrides!.child_feedback ?? null) : null,
    staff_observations: "staff_observations" in (overrides ?? {}) ? (overrides!.staff_observations ?? null) : null,
    approved_by: "approved_by" in (overrides ?? {}) ? (overrides!.approved_by ?? null) : null,
    approved_at: "approved_at" in (overrides ?? {}) ? (overrides!.approved_at ?? null) : null,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    allergens_checked: overrides?.allergens_checked ?? true,
    dietary_needs_met: overrides?.dietary_needs_met ?? true,
    cultural_needs_met: overrides?.cultural_needs_met ?? true,
    child_chose_meal: overrides?.child_chose_meal ?? true,
    child_helped_prepare: overrides?.child_helped_prepare ?? true,
    nutritionally_balanced: overrides?.nutritionally_balanced ?? true,
    portion_appropriate: overrides?.portion_appropriate ?? true,
    hydration_monitored: overrides?.hydration_monitored ?? true,
    mealtime_positive: overrides?.mealtime_positive ?? true,
    leftovers_noted: overrides?.leftovers_noted ?? true,
    medical_diet_followed: overrides?.medical_diet_followed ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [],
    actions_taken: overrides?.actions_taken ?? [],
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

// ── computeMenuPlanningMetrics ─────────────────────────────────────────────

describe("computeMenuPlanningMetrics", () => {
  it("returns zeros for empty input", () => {
    const m = computeMenuPlanningMetrics([]);
    expect(m.total_meals).toBe(0);
    expect(m.poor_nutrition_count).toBe(0);
    expect(m.refused_count).toBe(0);
    expect(m.allergen_concern_count).toBe(0);
    expect(m.cultural_not_met_count).toBe(0);
    expect(m.unique_children).toBe(0);
  });

  it("returns empty breakdowns for empty input", () => {
    const m = computeMenuPlanningMetrics([]);
    expect(m.by_meal_type).toEqual({});
    expect(m.by_dietary_category).toEqual({});
    expect(m.by_nutritional_rating).toEqual({});
    expect(m.by_child_satisfaction).toEqual({});
  });

  it("counts total meals", () => {
    expect(computeMenuPlanningMetrics([makeRecord(), makeRecord()]).total_meals).toBe(2);
  });

  it("counts poor nutritional_rating as poor_nutrition", () => {
    expect(computeMenuPlanningMetrics([makeRecord({ nutritional_rating: "poor" })]).poor_nutrition_count).toBe(1);
  });

  it("counts inadequate nutritional_rating as poor_nutrition", () => {
    expect(computeMenuPlanningMetrics([makeRecord({ nutritional_rating: "inadequate" })]).poor_nutrition_count).toBe(1);
  });

  it("does not count adequate as poor_nutrition", () => {
    expect(computeMenuPlanningMetrics([makeRecord({ nutritional_rating: "adequate" })]).poor_nutrition_count).toBe(0);
  });

  it("counts refused child_satisfaction", () => {
    expect(computeMenuPlanningMetrics([makeRecord({ child_satisfaction: "refused" })]).refused_count).toBe(1);
  });

  it("counts allergen_concern when allergens_checked is false", () => {
    expect(computeMenuPlanningMetrics([makeRecord({ allergens_checked: false })]).allergen_concern_count).toBe(1);
  });

  it("counts cultural_not_met when cultural_needs_met is false", () => {
    expect(computeMenuPlanningMetrics([makeRecord({ cultural_needs_met: false })]).cultural_not_met_count).toBe(1);
  });

  it("returns 100% rates when all booleans true", () => {
    const m = computeMenuPlanningMetrics([makeRecord()]);
    expect(m.allergens_checked_rate).toBe(100);
    expect(m.dietary_needs_met_rate).toBe(100);
    expect(m.cultural_needs_met_rate).toBe(100);
    expect(m.child_chose_rate).toBe(100);
    expect(m.child_helped_rate).toBe(100);
    expect(m.nutritionally_balanced_rate).toBe(100);
    expect(m.portion_appropriate_rate).toBe(100);
    expect(m.hydration_monitored_rate).toBe(100);
    expect(m.mealtime_positive_rate).toBe(100);
    expect(m.leftovers_noted_rate).toBe(100);
    expect(m.medical_diet_rate).toBe(100);
    expect(m.recorded_promptly_rate).toBe(100);
  });

  it("returns 0% rate when all booleans false", () => {
    const m = computeMenuPlanningMetrics([makeRecord({ allergens_checked: false, dietary_needs_met: false, cultural_needs_met: false, child_chose_meal: false, child_helped_prepare: false, nutritionally_balanced: false, portion_appropriate: false, hydration_monitored: false, mealtime_positive: false, leftovers_noted: false, medical_diet_followed: false, recorded_promptly: false })]);
    expect(m.allergens_checked_rate).toBe(0);
    expect(m.recorded_promptly_rate).toBe(0);
  });

  it("computes mixed rate as 66.7", () => {
    const recs = [makeRecord({ allergens_checked: true }), makeRecord({ allergens_checked: true }), makeRecord({ allergens_checked: false })];
    expect(computeMenuPlanningMetrics(recs).allergens_checked_rate).toBe(66.7);
  });

  it("counts unique children correctly (A, B, A → 2)", () => {
    const recs = [makeRecord({ child_name: "Child A" }), makeRecord({ child_name: "Child B" }), makeRecord({ child_name: "Child A" })];
    expect(computeMenuPlanningMetrics(recs).unique_children).toBe(2);
  });

  it("breaks down all 10 meal types", () => {
    const types = ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "supper", "special_occasion", "packed_lunch", "takeaway", "other"] as const;
    const recs = types.map((t) => makeRecord({ meal_type: t }));
    const m = computeMenuPlanningMetrics(recs);
    for (const t of types) expect(m.by_meal_type[t]).toBe(1);
    expect(Object.keys(m.by_meal_type)).toHaveLength(10);
  });

  it("breaks down all 10 dietary categories", () => {
    const cats = ["standard", "vegetarian", "vegan", "halal", "kosher", "gluten_free", "dairy_free", "nut_free", "medical_diet", "other"] as const;
    const recs = cats.map((c) => makeRecord({ dietary_category: c }));
    const m = computeMenuPlanningMetrics(recs);
    for (const c of cats) expect(m.by_dietary_category[c]).toBe(1);
    expect(Object.keys(m.by_dietary_category)).toHaveLength(10);
  });

  it("breaks down all 5 nutritional ratings", () => {
    const ratings = ["excellent", "good", "adequate", "poor", "inadequate"] as const;
    const recs = ratings.map((r) => makeRecord({ nutritional_rating: r }));
    const m = computeMenuPlanningMetrics(recs);
    for (const r of ratings) expect(m.by_nutritional_rating[r]).toBe(1);
    expect(Object.keys(m.by_nutritional_rating)).toHaveLength(5);
  });

  it("breaks down all 5 child satisfactions", () => {
    const sats = ["loved_it", "enjoyed_it", "okay", "didnt_like", "refused"] as const;
    const recs = sats.map((s) => makeRecord({ child_satisfaction: s }));
    const m = computeMenuPlanningMetrics(recs);
    for (const s of sats) expect(m.by_child_satisfaction[s]).toBe(1);
    expect(Object.keys(m.by_child_satisfaction)).toHaveLength(5);
  });
});

// ── identifyMenuPlanningAlerts ─────────────────────────────────────────────

describe("identifyMenuPlanningAlerts", () => {
  it("returns empty for clean records", () => {
    expect(identifyMenuPlanningAlerts([makeRecord()])).toEqual([]);
  });

  it("returns empty for empty input", () => {
    expect(identifyMenuPlanningAlerts([])).toEqual([]);
  });

  it("fires allergen_medical_risk critical when allergens_checked false + medical_diet", () => {
    const alerts = identifyMenuPlanningAlerts([makeRecord({ id: "x-1", allergens_checked: false, dietary_category: "medical_diet", child_name: "Child X" })]);
    expect(alerts).toContainEqual(expect.objectContaining({ type: "allergen_medical_risk", severity: "critical", record_id: "x-1" }));
  });

  it("does not fire allergen_medical_risk critical when allergens_checked false + standard", () => {
    const alerts = identifyMenuPlanningAlerts([makeRecord({ allergens_checked: false, dietary_category: "standard" })]);
    expect(alerts.find((a) => a.type === "allergen_medical_risk")).toBeUndefined();
  });

  it("fires allergen_medical_risk per-record", () => {
    const recs = [makeRecord({ id: "r-1", allergens_checked: false, dietary_category: "medical_diet" }), makeRecord({ id: "r-2", allergens_checked: false, dietary_category: "medical_diet" })];
    const critical = identifyMenuPlanningAlerts(recs).filter((a) => a.type === "allergen_medical_risk");
    expect(critical).toHaveLength(2);
    expect(critical[0].record_id).toBe("r-1");
    expect(critical[1].record_id).toBe("r-2");
  });

  it("fires allergens_not_checked high when allergens_checked false", () => {
    const alerts = identifyMenuPlanningAlerts([makeRecord({ allergens_checked: false })]);
    expect(alerts).toContainEqual(expect.objectContaining({ type: "allergens_not_checked", severity: "high" }));
  });

  it("fires dietary_needs_not_met high when dietary_needs_met false", () => {
    const alerts = identifyMenuPlanningAlerts([makeRecord({ dietary_needs_met: false })]);
    expect(alerts).toContainEqual(expect.objectContaining({ type: "dietary_needs_not_met", severity: "high" }));
  });

  it("does not fire cultural_needs_not_met for 1 record", () => {
    const alerts = identifyMenuPlanningAlerts([makeRecord({ cultural_needs_met: false })]);
    expect(alerts.find((a) => a.type === "cultural_needs_not_met")).toBeUndefined();
  });

  it("fires cultural_needs_not_met medium for 2 records", () => {
    const recs = [makeRecord({ cultural_needs_met: false }), makeRecord({ cultural_needs_met: false })];
    expect(identifyMenuPlanningAlerts(recs)).toContainEqual(expect.objectContaining({ type: "cultural_needs_not_met", severity: "medium" }));
  });

  it("does not fire poor_nutrition for 1 record", () => {
    const alerts = identifyMenuPlanningAlerts([makeRecord({ nutritional_rating: "poor" })]);
    expect(alerts.find((a) => a.type === "poor_nutrition")).toBeUndefined();
  });

  it("fires poor_nutrition medium for 2 records", () => {
    const recs = [makeRecord({ nutritional_rating: "poor" }), makeRecord({ nutritional_rating: "inadequate" })];
    expect(identifyMenuPlanningAlerts(recs)).toContainEqual(expect.objectContaining({ type: "poor_nutrition", severity: "medium" }));
  });

  it("fires all applicable alerts together", () => {
    const recs = [
      makeRecord({ id: "m-1", allergens_checked: false, dietary_category: "medical_diet", dietary_needs_met: false, cultural_needs_met: false, nutritional_rating: "poor" }),
      makeRecord({ id: "m-2", allergens_checked: false, dietary_category: "medical_diet", dietary_needs_met: false, cultural_needs_met: false, nutritional_rating: "inadequate" }),
    ];
    const alerts = identifyMenuPlanningAlerts(recs);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("allergen_medical_risk");
    expect(types).toContain("allergens_not_checked");
    expect(types).toContain("dietary_needs_not_met");
    expect(types).toContain("cultural_needs_not_met");
    expect(types).toContain("poor_nutrition");
  });

  it("alert shape matches { type, severity, message, record_id? }", () => {
    const alerts = identifyMenuPlanningAlerts([makeRecord({ allergens_checked: false, dietary_category: "medical_diet" })]);
    const critical = alerts.find((a) => a.type === "allergen_medical_risk")!;
    expect(critical).toHaveProperty("type");
    expect(critical).toHaveProperty("severity");
    expect(critical).toHaveProperty("message");
    expect(critical).toHaveProperty("record_id");
  });
});
