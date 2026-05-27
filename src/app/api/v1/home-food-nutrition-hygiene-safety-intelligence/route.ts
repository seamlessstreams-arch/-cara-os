import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeFoodNutritionHygieneSafety,
  type FoodBudgetInput,
  type FoodHygieneCheckInput,
  type MealPlanInput,
} from "@/lib/engines/home-food-nutrition-hygiene-safety-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const children = store.children ?? [];
  const today = new Date().toISOString().slice(0, 10);

  // Food budget week records → FoodBudgetInput[]
  const rawBudgets = (store.foodBudgetWeekRecords as any[] ?? []);
  const budgets: FoodBudgetInput[] = rawBudgets.map((b: any) => ({
    id: b.id ?? "",
    weekly_budget: b.weekly_budget ?? 0,
    total_spent: b.total_spent ?? 0,
    cook_from_scratch_proportion: b.cook_from_scratch_proportion ?? 0,
    cultural_ingredients_included: !!(b.cultural_ingredients_included),
    sensory_friendly_options: !!(b.sensory_friendly_options_included),
    child_requests_honoured_count: (b.child_meal_requests_honoured ?? []).length,
    waste_noted: !!(b.waste_noted && b.waste_noted.trim().length > 0),
  }));

  // Food hygiene records → FoodHygieneCheckInput[]
  const rawHygiene = (store.foodHygieneRecords as any[] ?? []);
  const hygieneChecks: FoodHygieneCheckInput[] = rawHygiene.map((h: any) => ({
    id: h.id ?? "",
    check_type: h.check_type ?? "",
    compliance: h.compliance ?? "pass",
    action_required: !!(h.action_required && h.action_required.trim?.().length > 0),
    action_completed: !!(h.action_completed),
  }));

  // Meal plans → MealPlanInput[]
  const rawMealPlans = (store.mealPlans as any[] ?? []);
  const mealPlans: MealPlanInput[] = rawMealPlans.map((m: any) => {
    const prefs = (m.child_preferences ?? []) as any[];
    const childId = prefs.length > 0 ? prefs[0].child_id ?? "" : "";
    const dietaryFlags = (m.dietary_flags ?? []) as string[];
    const hasDietaryNeeds = dietaryFlags.length > 0 && !dietaryFlags.every((f: string) => f === "none");
    return {
      id: m.id ?? "",
      child_id: childId,
      dietary_needs_met: hasDietaryNeeds || dietaryFlags.includes("none"),
      balanced_nutrition: !!(m.sides && (m.sides as any[]).length > 0),
      child_choice_offered: prefs.length > 0,
    };
  });

  const result = computeFoodNutritionHygieneSafety({
    today,
    total_children: (children as any[]).length,
    budgets,
    hygiene_checks: hygieneChecks,
    meal_plans: mealPlans,
  });

  return NextResponse.json({ data: result });
}
