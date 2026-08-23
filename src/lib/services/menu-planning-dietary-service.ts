// ══════════════════════════════════════════════════════════════════════════════
// CARA — MENU PLANNING & DIETARY REQUIREMENTS SERVICE
// Manages meal planning, allergen tracking, dietary preferences, cultural
// dietary needs, and nutritional monitoring for every child in the home.
//
// CHR 2015 Reg 6 (health and wellbeing), Reg 5 (quality and purpose of care).
// Children's food should be nutritious, varied, culturally appropriate,
// and reflect their individual preferences and medical needs.
//
// SCCIF: "Children are well nourished. Mealtimes are positive experiences."
// "Children's dietary needs, cultural requirements and preferences are met."
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
  | "packed_lunch"
  | "takeaway"
  | "other";

export type DietaryCategory =
  | "standard"
  | "vegetarian"
  | "vegan"
  | "halal"
  | "kosher"
  | "gluten_free"
  | "dairy_free"
  | "nut_free"
  | "medical_diet"
  | "other";

export type NutritionalRating =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "inadequate";

export type ChildSatisfaction =
  | "loved_it"
  | "enjoyed_it"
  | "okay"
  | "didnt_like"
  | "refused";

export interface MenuPlanningDietaryRecord {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string | null;
  meal_type: MealType;
  dietary_category: DietaryCategory;
  nutritional_rating: NutritionalRating;
  child_satisfaction: ChildSatisfaction;
  session_date: string;
  recorded_by: string;
  meal_description: string;
  ingredients_listed: string;
  allergens_present: string | null;
  allergens_avoided: string | null;
  cultural_considerations: string | null;
  child_involvement: string | null;
  portion_size_notes: string | null;
  hydration_notes: string | null;
  child_feedback: string | null;
  staff_observations: string | null;
  approved_by: string | null;
  approved_at: string | null;
  allergens_checked: boolean;
  dietary_needs_met: boolean;
  cultural_needs_met: boolean;
  child_chose_meal: boolean;
  child_helped_prepare: boolean;
  nutritionally_balanced: boolean;
  portion_appropriate: boolean;
  hydration_monitored: boolean;
  mealtime_positive: boolean;
  leftovers_noted: boolean;
  medical_diet_followed: boolean;
  recorded_promptly: boolean;
  issues_found: string[];
  actions_taken: string[];
  next_review_date: string | null;
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
  { type: "packed_lunch", label: "Packed Lunch" },
  { type: "takeaway", label: "Takeaway" },
  { type: "other", label: "Other" },
];

export const DIETARY_CATEGORIES: { category: DietaryCategory; label: string }[] = [
  { category: "standard", label: "Standard" },
  { category: "vegetarian", label: "Vegetarian" },
  { category: "vegan", label: "Vegan" },
  { category: "halal", label: "Halal" },
  { category: "kosher", label: "Kosher" },
  { category: "gluten_free", label: "Gluten Free" },
  { category: "dairy_free", label: "Dairy Free" },
  { category: "nut_free", label: "Nut Free" },
  { category: "medical_diet", label: "Medical Diet" },
  { category: "other", label: "Other" },
];

export const NUTRITIONAL_RATINGS: { rating: NutritionalRating; label: string }[] = [
  { rating: "excellent", label: "Excellent" },
  { rating: "good", label: "Good" },
  { rating: "adequate", label: "Adequate" },
  { rating: "poor", label: "Poor" },
  { rating: "inadequate", label: "Inadequate" },
];

export const CHILD_SATISFACTIONS: { satisfaction: ChildSatisfaction; label: string }[] = [
  { satisfaction: "loved_it", label: "Loved It" },
  { satisfaction: "enjoyed_it", label: "Enjoyed It" },
  { satisfaction: "okay", label: "Okay" },
  { satisfaction: "didnt_like", label: "Didn't Like" },
  { satisfaction: "refused", label: "Refused" },
];

// ── Metrics ─────────────────────────────────────────────────────────────

export function computeMenuPlanningMetrics(records: MenuPlanningDietaryRecord[]): {
  total_meals: number;
  poor_nutrition_count: number;
  refused_count: number;
  allergen_concern_count: number;
  cultural_not_met_count: number;
  allergens_checked_rate: number | null;
  dietary_needs_met_rate: number | null;
  cultural_needs_met_rate: number | null;
  child_chose_rate: number | null;
  child_helped_rate: number | null;
  nutritionally_balanced_rate: number | null;
  portion_appropriate_rate: number | null;
  hydration_monitored_rate: number | null;
  mealtime_positive_rate: number | null;
  leftovers_noted_rate: number | null;
  medical_diet_rate: number | null;
  recorded_promptly_rate: number | null;
  unique_children: number;
  by_meal_type: Record<string, number>;
  by_dietary_category: Record<string, number>;
  by_nutritional_rating: Record<string, number>;
  by_child_satisfaction: Record<string, number>;
} {
  const poorNutrition = records.filter((r) => r.nutritional_rating === "poor" || r.nutritional_rating === "inadequate").length;
  const refused = records.filter((r) => r.child_satisfaction === "refused").length;
  const allergenConcern = records.filter((r) => r.allergens_checked === false).length;
  const culturalNotMet = records.filter((r) => r.cultural_needs_met === false).length;

  const boolRate = (field: keyof MenuPlanningDietaryRecord) => {
    const count = records.filter((r) => r[field] === true).length;
    return records.length > 0 ? Math.round((count / records.length) * 1000) / 10 : null;
  };

  const byMealType: Record<string, number> = {};
  for (const r of records) byMealType[r.meal_type] = (byMealType[r.meal_type] ?? 0) + 1;
  const byDietaryCategory: Record<string, number> = {};
  for (const r of records) byDietaryCategory[r.dietary_category] = (byDietaryCategory[r.dietary_category] ?? 0) + 1;
  const byNutritionalRating: Record<string, number> = {};
  for (const r of records) byNutritionalRating[r.nutritional_rating] = (byNutritionalRating[r.nutritional_rating] ?? 0) + 1;
  const bySatisfaction: Record<string, number> = {};
  for (const r of records) bySatisfaction[r.child_satisfaction] = (bySatisfaction[r.child_satisfaction] ?? 0) + 1;

  return {
    total_meals: records.length,
    poor_nutrition_count: poorNutrition,
    refused_count: refused,
    allergen_concern_count: allergenConcern,
    cultural_not_met_count: culturalNotMet,
    allergens_checked_rate: boolRate("allergens_checked"),
    dietary_needs_met_rate: boolRate("dietary_needs_met"),
    cultural_needs_met_rate: boolRate("cultural_needs_met"),
    child_chose_rate: boolRate("child_chose_meal"),
    child_helped_rate: boolRate("child_helped_prepare"),
    nutritionally_balanced_rate: boolRate("nutritionally_balanced"),
    portion_appropriate_rate: boolRate("portion_appropriate"),
    hydration_monitored_rate: boolRate("hydration_monitored"),
    mealtime_positive_rate: boolRate("mealtime_positive"),
    leftovers_noted_rate: boolRate("leftovers_noted"),
    medical_diet_rate: boolRate("medical_diet_followed"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    unique_children: new Set(records.map((r) => r.child_name)).size,
    by_meal_type: byMealType,
    by_dietary_category: byDietaryCategory,
    by_nutritional_rating: byNutritionalRating,
    by_child_satisfaction: bySatisfaction,
  };
}

// ── Alerts ──────────────────────────────────────────────────────────────

export function identifyMenuPlanningAlerts(
  records: MenuPlanningDietaryRecord[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical per-record: allergens not checked + medical diet
  for (const r of records) {
    if (r.allergens_checked === false && r.dietary_category === "medical_diet") {
      alerts.push({
        type: "allergen_medical_risk",
        severity: "critical",
        message: `${r.child_name} has a medical diet with allergens not checked — immediate review required.`,
        record_id: r.id,
      });
    }
  }

  // High: allergens not checked >= 1
  const noAllergenCheck = records.filter((r) => r.allergens_checked === false).length;
  if (noAllergenCheck > 0) {
    alerts.push({
      type: "allergens_not_checked",
      severity: "high",
      message: `${noAllergenCheck} meal${noAllergenCheck === 1 ? " has" : "s have"} allergens not checked.`,
    });
  }

  // High: dietary needs not met >= 1
  const dietaryNotMet = records.filter((r) => r.dietary_needs_met === false).length;
  if (dietaryNotMet > 0) {
    alerts.push({
      type: "dietary_needs_not_met",
      severity: "high",
      message: `${dietaryNotMet} meal${dietaryNotMet === 1 ? " has" : "s have"} dietary needs not met.`,
    });
  }

  // Medium: cultural needs not met >= 2
  const culturalNotMet = records.filter((r) => r.cultural_needs_met === false).length;
  if (culturalNotMet >= 2) {
    alerts.push({
      type: "cultural_needs_not_met",
      severity: "medium",
      message: `${culturalNotMet} meals have cultural dietary needs not met.`,
    });
  }

  // Medium: poor nutrition >= 2
  const poorNutrition = records.filter((r) => r.nutritional_rating === "poor" || r.nutritional_rating === "inadequate").length;
  if (poorNutrition >= 2) {
    alerts.push({
      type: "poor_nutrition",
      severity: "medium",
      message: `${poorNutrition} meals have poor or inadequate nutritional rating.`,
    });
  }

  return alerts;
}

// ── CRUD ────────────────────────────────────────────────────────────────

export async function listMenuPlanning(
  homeId: string,
): Promise<ServiceResult<MenuPlanningDietaryRecord[]>> {
  const client = sb();
  if (!client) return { ok: true, data: [] };
  const { data, error } = await (client.from("cs_menu_planning_dietary") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("session_date", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as MenuPlanningDietaryRecord[] };
}

export async function createMenuPlanning(input: {
  homeId: string;
  childName: string;
  childId?: string | null;
  mealType: MealType;
  dietaryCategory: DietaryCategory;
  nutritionalRating: NutritionalRating;
  childSatisfaction: ChildSatisfaction;
  sessionDate: string;
  recordedBy: string;
  mealDescription: string;
  ingredientsListed: string;
  allergensPresent?: string | null;
  allergensAvoided?: string | null;
  culturalConsiderations?: string | null;
  childInvolvement?: string | null;
  portionSizeNotes?: string | null;
  hydrationNotes?: string | null;
  childFeedback?: string | null;
  staffObservations?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  allergensChecked: boolean;
  dietaryNeedsMet: boolean;
  culturalNeedsMet: boolean;
  childChoseMeal: boolean;
  childHelpedPrepare: boolean;
  nutritionallyBalanced: boolean;
  portionAppropriate: boolean;
  hydrationMonitored: boolean;
  mealtimePositive: boolean;
  leftoversNoted: boolean;
  medicalDietFollowed: boolean;
  recordedPromptly: boolean;
  issuesFound?: string[];
  actionsTaken?: string[];
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<MenuPlanningDietaryRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_menu_planning_dietary") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId ?? null,
      meal_type: input.mealType,
      dietary_category: input.dietaryCategory,
      nutritional_rating: input.nutritionalRating,
      child_satisfaction: input.childSatisfaction,
      session_date: input.sessionDate,
      recorded_by: input.recordedBy,
      meal_description: input.mealDescription,
      ingredients_listed: input.ingredientsListed,
      allergens_present: input.allergensPresent ?? null,
      allergens_avoided: input.allergensAvoided ?? null,
      cultural_considerations: input.culturalConsiderations ?? null,
      child_involvement: input.childInvolvement ?? null,
      portion_size_notes: input.portionSizeNotes ?? null,
      hydration_notes: input.hydrationNotes ?? null,
      child_feedback: input.childFeedback ?? null,
      staff_observations: input.staffObservations ?? null,
      approved_by: input.approvedBy ?? null,
      approved_at: input.approvedAt ?? null,
      allergens_checked: input.allergensChecked,
      dietary_needs_met: input.dietaryNeedsMet,
      cultural_needs_met: input.culturalNeedsMet,
      child_chose_meal: input.childChoseMeal,
      child_helped_prepare: input.childHelpedPrepare,
      nutritionally_balanced: input.nutritionallyBalanced,
      portion_appropriate: input.portionAppropriate,
      hydration_monitored: input.hydrationMonitored,
      mealtime_positive: input.mealtimePositive,
      leftovers_noted: input.leftoversNoted,
      medical_diet_followed: input.medicalDietFollowed,
      recorded_promptly: input.recordedPromptly,
      issues_found: input.issuesFound ?? [],
      actions_taken: input.actionsTaken ?? [],
      next_review_date: input.nextReviewDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as MenuPlanningDietaryRecord };
}

export async function updateMenuPlanning(
  id: string,
  updates: Partial<Omit<MenuPlanningDietaryRecord, "id" | "home_id" | "created_at">>,
): Promise<ServiceResult<MenuPlanningDietaryRecord>> {
  const client = sb();
  if (!client) return { ok: false, error: "Supabase not configured" };
  const { data, error } = await (client.from("cs_menu_planning_dietary") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as MenuPlanningDietaryRecord };
}

// ── Testing export ─────────────────────────────────────────────────────

export const _testing = { computeMenuPlanningMetrics, identifyMenuPlanningAlerts };
