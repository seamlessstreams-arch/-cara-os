// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME NUTRITION & CATERING INTELLIGENCE API ROUTE
// GET /api/v1/home-nutrition-catering-intelligence
// Meal plans, dietary plans, food hygiene, kitchen checks, eating support, budgets.
// CHR 2015 Reg 9/10.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeNutritionCatering,
  type MealPlanInput,
  type DietaryPlanInput,
  type FoodHygieneRecordInput,
  type KitchenHygieneCheckInput,
  type EatingSupportPlanInput,
  type FoodBudgetWeekInput,
} from "@/lib/engines/home-nutrition-catering-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Children ────────────────────────────────────────────────────────
  const childIds = new Set<string>();
  for (const c of ((store.youngPeople ?? []) as any[]).filter((c: any) => c.status === "current")) {
    if (c.id) childIds.add(c.id.toString());
  }
  const total_children = childIds.size;

  // ── Meal Plans ──────────────────────────────────────────────────────
  const meal_plans: MealPlanInput[] = (
    (store.mealPlans ?? []) as any[]
  ).map((m: any) => ({
    id: (m.id ?? "").toString(),
    date: (m.date ?? "").toString().slice(0, 10),
    meal: (m.meal ?? "").toString(),
    dietary_flags_count: Array.isArray(m.dietary_flags) ? m.dietary_flags.length : 0,
    child_preferences_count: Array.isArray(m.child_preferences) ? m.child_preferences.length : 0,
    budget: typeof m.budget === "number" ? m.budget : 0,
  }));

  // ── Dietary Plans ───────────────────────────────────────────────────
  const dietary_plans: DietaryPlanInput[] = (
    (store.dietaryPlans ?? []) as any[]
  ).map((d: any) => ({
    id: (d.id ?? "").toString(),
    child_id: (d.child_id ?? "").toString(),
    allergies_count: Array.isArray(d.allergies) ? d.allergies.length : 0,
    medical_dietary_needs_count: Array.isArray(d.medical_dietary_needs) ? d.medical_dietary_needs.length : 0,
    sensory_food_needs_count: Array.isArray(d.sensory_food_needs) ? d.sensory_food_needs.length : 0,
    reviewed_date: (d.reviewed_date ?? "").toString().slice(0, 10),
    next_review_date: (d.next_review_date ?? "").toString().slice(0, 10),
    reviewed_with_child: !!(d.reviewed_with_child),
    child_agreed: !!(d.child_agreed),
    signed_off_by_dietitian: !!(d.signed_off_by_dietitian),
  }));

  // ── Food Hygiene Records ────────────────────────────────────────────
  const food_hygiene_records: FoodHygieneRecordInput[] = (
    (store.foodHygieneRecords ?? []) as any[]
  ).map((r: any) => ({
    id: (r.id ?? "").toString(),
    date: (r.date ?? "").toString().slice(0, 10),
    check_type: (r.check_type ?? "").toString(),
    compliance: (r.compliance ?? "pass").toString(),
    action_required: !!(r.action_required && r.action_required !== ""),
    action_completed: !!(r.action_completed),
  }));

  // ── Kitchen Hygiene Checks ──────────────────────────────────────────
  const kitchen_hygiene_checks: KitchenHygieneCheckInput[] = (
    (store.kitchenHygieneChecks ?? []) as any[]
  ).map((k: any) => ({
    id: (k.id ?? "").toString(),
    date: (k.date ?? "").toString().slice(0, 10),
    fridge_within_range: !!(k.fridge_within_range),
    freezer_within_range: !!(k.freezer_within_range),
    surfaces_cleaned: !!(k.surfaces_cleaned),
    handwashing_observed: !!(k.handwashing_observed),
    cutting_board_segregation: !!(k.cutting_board_segregation),
    allergen_labelling: !!(k.allergen_labelling),
    overall_verdict: (k.overall_verdict ?? "pass").toString(),
    immediate_actions_count: Array.isArray(k.immediate_actions) ? k.immediate_actions.length : 0,
    follow_up_actions_count: Array.isArray(k.follow_up_actions) ? k.follow_up_actions.length : 0,
    expired_items_found_count: Array.isArray(k.expired_items_found) ? k.expired_items_found.length : 0,
  }));

  // ── Eating Support Plans ────────────────────────────────────────────
  const eating_support_plans: EatingSupportPlanInput[] = (
    (store.eatingSupportPlans ?? []) as any[]
  ).map((e: any) => ({
    id: (e.id ?? "").toString(),
    child_id: (e.child_id ?? "").toString(),
    plan_date: (e.plan_date ?? "").toString().slice(0, 10),
    review_date: (e.review_date ?? "").toString().slice(0, 10),
    child_chose: !!(e.child_chose),
    flags_for_review_count: Array.isArray(e.flags_for_review) ? e.flags_for_review.length : 0,
    safe_foods_count: Array.isArray(e.safe_foods) ? e.safe_foods.length : 0,
    staff_strategies_count: (Array.isArray(e.staff_do_strategies) ? e.staff_do_strategies.length : 0) +
      (Array.isArray(e.staff_do_not_strategies) ? e.staff_do_not_strategies.length : 0),
  }));

  // ── Food Budget Weeks ───────────────────────────────────────────────
  const food_budgets: FoodBudgetWeekInput[] = (
    (store.foodBudgetWeekRecords ?? []) as any[]
  ).map((b: any) => ({
    id: (b.id ?? "").toString(),
    week_starting: (b.week_starting ?? "").toString().slice(0, 10),
    weekly_budget: typeof b.weekly_budget === "number" ? b.weekly_budget : 0,
    total_spent: typeof b.total_spent === "number" ? b.total_spent : 0,
    variance: typeof b.variance === "number" ? b.variance : 0,
    cultural_ingredients_included: !!(b.cultural_ingredients_included),
    sensory_friendly_options_included: !!(b.sensory_friendly_options_included),
    cook_from_scratch_proportion: typeof b.cook_from_scratch_proportion === "number" ? b.cook_from_scratch_proportion : 0,
    child_meal_requests_honoured_count: Array.isArray(b.child_meal_requests_honoured) ? b.child_meal_requests_honoured.length : 0,
  }));

  const result = computeHomeNutritionCatering({
    today,
    meal_plans,
    dietary_plans,
    food_hygiene_records,
    kitchen_hygiene_checks,
    eating_support_plans,
    food_budgets,
    total_children,
  });

  return NextResponse.json({ data: result });
}
