// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEALTIMES & NUTRITION MONITORING SERVICE
// Tracks meal planning, dietary requirements, food preparation,
// mealtime experiences, and nutritional compliance.
// CHR 2015 Reg 9 (children's plans — dietary needs),
// Reg 6 (quality of care — nutrition),
// Reg 36 (premises — kitchen safety).
//
// Covers: meal records, dietary preferences, allergies,
// food hygiene, mealtime atmosphere, and cultural dietary needs.
//
// SCCIF: Overall Experiences — "Children enjoy nutritious meals."
// "Dietary needs and preferences are respected."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type MealType =
  | "breakfast"
  | "morning_snack"
  | "lunch"
  | "afternoon_snack"
  | "dinner"
  | "supper"
  | "special_occasion"
  | "other";

export type DietaryRequirement =
  | "none"
  | "vegetarian"
  | "vegan"
  | "halal"
  | "kosher"
  | "gluten_free"
  | "dairy_free"
  | "nut_free"
  | "allergy_specific"
  | "medical_diet"
  | "cultural"
  | "other";

export type MealQuality =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "not_assessed";

export type HygieneRating =
  | "5_star"
  | "4_star"
  | "3_star"
  | "2_star"
  | "1_star"
  | "not_rated";

export interface MealRecord {
  id: string;
  home_id: string;
  meal_date: string;
  meal_type: MealType;
  menu_description: string;
  dietary_requirements_met: DietaryRequirement[];
  meal_quality: MealQuality;
  hygiene_rating: HygieneRating;
  children_present: number;
  children_ate: number;
  children_involved_in_preparation: boolean;
  children_involved_in_choice: boolean;
  cultural_needs_considered: boolean;
  allergies_checked: boolean;
  fresh_ingredients_used: boolean;
  balanced_meal: boolean;
  mealtime_atmosphere_positive: boolean;
  staff_ate_with_children: boolean;
  food_waste_minimal: boolean;
  prepared_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const MEAL_TYPES: { type: MealType; label: string }[] = [
  { type: "breakfast", label: "Breakfast" },
  { type: "morning_snack", label: "Morning Snack" },
  { type: "lunch", label: "Lunch" },
  { type: "afternoon_snack", label: "Afternoon Snack" },
  { type: "dinner", label: "Dinner" },
  { type: "supper", label: "Supper" },
  { type: "special_occasion", label: "Special Occasion" },
  { type: "other", label: "Other" },
];

export const DIETARY_REQUIREMENTS: { requirement: DietaryRequirement; label: string }[] = [
  { requirement: "none", label: "None" },
  { requirement: "vegetarian", label: "Vegetarian" },
  { requirement: "vegan", label: "Vegan" },
  { requirement: "halal", label: "Halal" },
  { requirement: "kosher", label: "Kosher" },
  { requirement: "gluten_free", label: "Gluten Free" },
  { requirement: "dairy_free", label: "Dairy Free" },
  { requirement: "nut_free", label: "Nut Free" },
  { requirement: "allergy_specific", label: "Allergy Specific" },
  { requirement: "medical_diet", label: "Medical Diet" },
  { requirement: "cultural", label: "Cultural" },
  { requirement: "other", label: "Other" },
];

export const MEAL_QUALITIES: { quality: MealQuality; label: string }[] = [
  { quality: "excellent", label: "Excellent" },
  { quality: "good", label: "Good" },
  { quality: "adequate", label: "Adequate" },
  { quality: "poor", label: "Poor" },
  { quality: "not_assessed", label: "Not Assessed" },
];

export const HYGIENE_RATINGS: { rating: HygieneRating; label: string }[] = [
  { rating: "5_star", label: "5 Star" },
  { rating: "4_star", label: "4 Star" },
  { rating: "3_star", label: "3 Star" },
  { rating: "2_star", label: "2 Star" },
  { rating: "1_star", label: "1 Star" },
  { rating: "not_rated", label: "Not Rated" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeMealMetrics(
  records: MealRecord[],
): {
  total_meals: number;
  children_ate_rate: number | null;
  balanced_meal_rate: number | null;
  fresh_ingredients_rate: number | null;
  allergies_checked_rate: number | null;
  cultural_needs_rate: number | null;
  children_involved_preparation_rate: number | null;
  children_involved_choice_rate: number | null;
  positive_atmosphere_rate: number | null;
  staff_ate_with_children_rate: number | null;
  food_waste_minimal_rate: number | null;
  poor_meal_count: number;
  excellent_meal_count: number;
  by_meal_type: Record<string, number>;
  by_meal_quality: Record<string, number>;
  by_hygiene_rating: Record<string, number>;
} {
  const totalPresent = records.reduce((sum, r) => sum + r.children_present, 0);
  const totalAte = records.reduce((sum, r) => sum + r.children_ate, 0);
  const ateRate =
    totalPresent > 0
      ? Math.round((totalAte / totalPresent) * 1000) / 10
      : null;

  const balanced = records.filter((r) => r.balanced_meal).length;
  const balancedRate =
    records.length > 0
      ? Math.round((balanced / records.length) * 1000) / 10
      : null;

  const fresh = records.filter((r) => r.fresh_ingredients_used).length;
  const freshRate =
    records.length > 0
      ? Math.round((fresh / records.length) * 1000) / 10
      : null;

  const allergies = records.filter((r) => r.allergies_checked).length;
  const allergiesRate =
    records.length > 0
      ? Math.round((allergies / records.length) * 1000) / 10
      : null;

  const cultural = records.filter((r) => r.cultural_needs_considered).length;
  const culturalRate =
    records.length > 0
      ? Math.round((cultural / records.length) * 1000) / 10
      : null;

  const involvedPrep = records.filter((r) => r.children_involved_in_preparation).length;
  const prepRate =
    records.length > 0
      ? Math.round((involvedPrep / records.length) * 1000) / 10
      : null;

  const involvedChoice = records.filter((r) => r.children_involved_in_choice).length;
  const choiceRate =
    records.length > 0
      ? Math.round((involvedChoice / records.length) * 1000) / 10
      : null;

  const positiveAtmosphere = records.filter((r) => r.mealtime_atmosphere_positive).length;
  const atmosphereRate =
    records.length > 0
      ? Math.round((positiveAtmosphere / records.length) * 1000) / 10
      : null;

  const staffAte = records.filter((r) => r.staff_ate_with_children).length;
  const staffAteRate =
    records.length > 0
      ? Math.round((staffAte / records.length) * 1000) / 10
      : null;

  const wasteMinimal = records.filter((r) => r.food_waste_minimal).length;
  const wasteRate =
    records.length > 0
      ? Math.round((wasteMinimal / records.length) * 1000) / 10
      : null;

  const poorMeal = records.filter((r) => r.meal_quality === "poor").length;
  const excellentMeal = records.filter((r) => r.meal_quality === "excellent").length;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.meal_type] = (byType[r.meal_type] ?? 0) + 1;

  const byQuality: Record<string, number> = {};
  for (const r of records) byQuality[r.meal_quality] = (byQuality[r.meal_quality] ?? 0) + 1;

  const byHygiene: Record<string, number> = {};
  for (const r of records) byHygiene[r.hygiene_rating] = (byHygiene[r.hygiene_rating] ?? 0) + 1;

  return {
    total_meals: records.length,
    children_ate_rate: ateRate,
    balanced_meal_rate: balancedRate,
    fresh_ingredients_rate: freshRate,
    allergies_checked_rate: allergiesRate,
    cultural_needs_rate: culturalRate,
    children_involved_preparation_rate: prepRate,
    children_involved_choice_rate: choiceRate,
    positive_atmosphere_rate: atmosphereRate,
    staff_ate_with_children_rate: staffAteRate,
    food_waste_minimal_rate: wasteRate,
    poor_meal_count: poorMeal,
    excellent_meal_count: excellentMeal,
    by_meal_type: byType,
    by_meal_quality: byQuality,
    by_hygiene_rating: byHygiene,
  };
}

export function identifyMealAlerts(
  records: MealRecord[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    id: string;
  }[] = [];

  // Allergies not checked
  for (const r of records) {
    if (!r.allergies_checked) {
      alerts.push({
        type: "allergies_not_checked",
        severity: "critical",
        message: `Allergies not checked for ${r.meal_type.replace(/_/g, " ")} on ${r.meal_date} — serious safety risk`,
        id: r.id,
      });
    }
  }

  // Poor meal quality
  const poorCount = records.filter((r) => r.meal_quality === "poor").length;
  if (poorCount >= 2) {
    alerts.push({
      type: "poor_meal_quality",
      severity: "high",
      message: `${poorCount} meals rated as poor quality — review menu planning and food preparation`,
      id: "poor_meal_quality",
    });
  }

  // Low eating rate
  const totalPresent = records.reduce((sum, r) => sum + r.children_present, 0);
  const totalAte = records.reduce((sum, r) => sum + r.children_ate, 0);
  if (totalPresent > 0 && totalAte / totalPresent < 0.7) {
    alerts.push({
      type: "low_eating_rate",
      severity: "high",
      message: `Only ${Math.round((totalAte / totalPresent) * 100)}% of children are eating meals — investigate preferences and barriers`,
      id: "low_eating_rate",
    });
  }

  // Cultural needs not considered
  const noCultural = records.filter((r) => !r.cultural_needs_considered).length;
  if (noCultural >= 3) {
    alerts.push({
      type: "cultural_needs_missed",
      severity: "medium",
      message: `${noCultural} meals without cultural dietary needs considered — ensure inclusivity`,
      id: "cultural_needs_missed",
    });
  }

  // Children not involved in choice
  const noChoice = records.filter((r) => !r.children_involved_in_choice).length;
  if (noChoice >= 3) {
    alerts.push({
      type: "no_child_choice",
      severity: "medium",
      message: `${noChoice} meals without children involved in menu choice — promote participation`,
      id: "no_child_choice",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    mealType?: MealType;
    mealQuality?: MealQuality;
    limit?: number;
  },
): Promise<ServiceResult<MealRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_meal_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.mealType) q = q.eq("meal_type", filters.mealType);
  if (filters?.mealQuality) q = q.eq("meal_quality", filters.mealQuality);
  q = q.order("meal_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  input: {
    homeId: string;
    mealDate: string;
    mealType: MealType;
    menuDescription: string;
    dietaryRequirementsMet: DietaryRequirement[];
    mealQuality: MealQuality;
    hygieneRating: HygieneRating;
    childrenPresent: number;
    childrenAte: number;
    childrenInvolvedInPreparation: boolean;
    childrenInvolvedInChoice: boolean;
    culturalNeedsConsidered: boolean;
    allergiesChecked: boolean;
    freshIngredientsUsed: boolean;
    balancedMeal: boolean;
    mealtimeAtmospherePositive: boolean;
    staffAteWithChildren: boolean;
    foodWasteMinimal: boolean;
    preparedBy: string;
    notes?: string;
  },
): Promise<ServiceResult<MealRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_meal_records") as SB)
    .insert({
      home_id: input.homeId,
      meal_date: input.mealDate,
      meal_type: input.mealType,
      menu_description: input.menuDescription,
      dietary_requirements_met: input.dietaryRequirementsMet,
      meal_quality: input.mealQuality,
      hygiene_rating: input.hygieneRating,
      children_present: input.childrenPresent,
      children_ate: input.childrenAte,
      children_involved_in_preparation: input.childrenInvolvedInPreparation,
      children_involved_in_choice: input.childrenInvolvedInChoice,
      cultural_needs_considered: input.culturalNeedsConsidered,
      allergies_checked: input.allergiesChecked,
      fresh_ingredients_used: input.freshIngredientsUsed,
      balanced_meal: input.balancedMeal,
      mealtime_atmosphere_positive: input.mealtimeAtmospherePositive,
      staff_ate_with_children: input.staffAteWithChildren,
      food_waste_minimal: input.foodWasteMinimal,
      prepared_by: input.preparedBy,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<MealRecord>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_meal_records") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeMealMetrics,
  identifyMealAlerts,
};
