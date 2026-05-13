// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FOOD & NUTRITION SERVICE
// Manages meal planning, dietary requirements, nutritional assessments,
// food safety, and children's involvement in menu choices.
// CHR 2015 Reg 9 (promoting good health — including nutritional needs),
// Reg 6 (quality of care — providing nourishing food), Reg 7 (children's
// views on menus), Reg 10 (dignity — dietary/cultural preferences).
//
// Tracks menu cycles, individual dietary profiles, meal satisfaction,
// food hygiene compliance, and ensures children receive nutritious meals
// appropriate to their health, cultural, and religious needs.
//
// SCCIF: Children's Experiences — "Children eat well and enjoy their meals."
// "Children's dietary needs and preferences are met." "Children are involved
// in menu planning and food choices."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type DietaryRequirement =
  | "none"
  | "vegetarian"
  | "vegan"
  | "halal"
  | "kosher"
  | "gluten_free"
  | "dairy_free"
  | "nut_allergy"
  | "egg_allergy"
  | "soy_allergy"
  | "diabetic"
  | "low_sugar"
  | "high_calorie"
  | "other";

export type MealType =
  | "breakfast"
  | "morning_snack"
  | "lunch"
  | "afternoon_snack"
  | "dinner"
  | "supper"
  | "special_occasion";

export type SatisfactionRating =
  | "loved_it"
  | "liked_it"
  | "okay"
  | "didnt_like"
  | "refused";

export type MenuCycleStatus =
  | "draft"
  | "active"
  | "archived";

export type HygieneCheckResult =
  | "pass"
  | "minor_issue"
  | "major_issue"
  | "fail";

export interface DietaryProfile {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  dietary_requirements: DietaryRequirement[];
  allergies: string[];
  intolerances: string[];
  cultural_dietary_needs: string | null;
  religious_dietary_needs: string | null;
  food_preferences: string[];
  food_dislikes: string[];
  nutritional_concerns: string | null;
  eating_support_needed: string | null;
  medical_dietary_plan: boolean;
  medical_plan_details: string | null;
  last_reviewed_date: string | null;
  reviewed_by: string | null;
  next_review_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface MealRecord {
  id: string;
  home_id: string;
  meal_date: string;
  meal_type: MealType;
  menu_description: string;
  prepared_by: string;
  children_present: string[];
  satisfaction_ratings: {
    child_id: string;
    child_name: string;
    rating: SatisfactionRating;
    comments: string;
  }[];
  alternative_meals_provided: boolean;
  alternative_details: string | null;
  food_waste_level: "none" | "low" | "moderate" | "high" | null;
  notes: string | null;
  created_at: string;
}

export interface HygieneCheck {
  id: string;
  home_id: string;
  check_date: string;
  checked_by: string;
  fridge_temp_ok: boolean;
  freezer_temp_ok: boolean;
  food_storage_ok: boolean;
  kitchen_cleanliness: HygieneCheckResult;
  food_prep_areas: HygieneCheckResult;
  hand_washing_facilities: HygieneCheckResult;
  overall_result: HygieneCheckResult;
  issues_found: string | null;
  corrective_action: string | null;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  notes: string | null;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const DIETARY_REQUIREMENTS: { requirement: DietaryRequirement; label: string }[] = [
  { requirement: "none", label: "None" },
  { requirement: "vegetarian", label: "Vegetarian" },
  { requirement: "vegan", label: "Vegan" },
  { requirement: "halal", label: "Halal" },
  { requirement: "kosher", label: "Kosher" },
  { requirement: "gluten_free", label: "Gluten Free" },
  { requirement: "dairy_free", label: "Dairy Free" },
  { requirement: "nut_allergy", label: "Nut Allergy" },
  { requirement: "egg_allergy", label: "Egg Allergy" },
  { requirement: "soy_allergy", label: "Soy Allergy" },
  { requirement: "diabetic", label: "Diabetic" },
  { requirement: "low_sugar", label: "Low Sugar" },
  { requirement: "high_calorie", label: "High Calorie" },
  { requirement: "other", label: "Other" },
];

export const MEAL_TYPES: { type: MealType; label: string }[] = [
  { type: "breakfast", label: "Breakfast" },
  { type: "morning_snack", label: "Morning Snack" },
  { type: "lunch", label: "Lunch" },
  { type: "afternoon_snack", label: "Afternoon Snack" },
  { type: "dinner", label: "Dinner" },
  { type: "supper", label: "Supper" },
  { type: "special_occasion", label: "Special Occasion" },
];

export const SATISFACTION_RATINGS: { rating: SatisfactionRating; label: string }[] = [
  { rating: "loved_it", label: "Loved It" },
  { rating: "liked_it", label: "Liked It" },
  { rating: "okay", label: "Okay" },
  { rating: "didnt_like", label: "Didn't Like" },
  { rating: "refused", label: "Refused" },
];

export const HYGIENE_CHECK_RESULTS: { result: HygieneCheckResult; label: string }[] = [
  { result: "pass", label: "Pass" },
  { result: "minor_issue", label: "Minor Issue" },
  { result: "major_issue", label: "Major Issue" },
  { result: "fail", label: "Fail" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute food and nutrition metrics.
 */
export function computeNutritionMetrics(
  profiles: DietaryProfile[],
  meals: MealRecord[],
  hygieneChecks: HygieneCheck[],
  totalChildren: number,
): {
  profiles_complete: number;
  children_with_allergies: number;
  meals_this_week: number;
  avg_satisfaction_score: number;
  food_waste_rate: number;
  hygiene_pass_rate: number;
  overdue_profile_reviews: number;
  by_meal_type: Record<string, number>;
  by_dietary_requirement: Record<string, number>;
  alternative_meals_rate: number;
} {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  // Profiles complete
  const profilesComplete = profiles.length;

  // Children with allergies
  const childrenWithAllergies = profiles.filter(
    (p) => p.allergies.length > 0,
  ).length;

  // Meals this week
  const mealsThisWeek = meals.filter(
    (m) => new Date(m.meal_date) >= weekAgo,
  ).length;

  // Average satisfaction score (loved_it=5, liked_it=4, okay=3, didnt_like=2, refused=1)
  const ratingValues: Record<string, number> = {
    loved_it: 5,
    liked_it: 4,
    okay: 3,
    didnt_like: 2,
    refused: 1,
  };
  let totalScore = 0;
  let ratingCount = 0;
  for (const m of meals) {
    for (const s of m.satisfaction_ratings) {
      if (ratingValues[s.rating] != null) {
        totalScore += ratingValues[s.rating];
        ratingCount++;
      }
    }
  }
  const avgSatisfactionScore =
    ratingCount > 0 ? Math.round((totalScore / ratingCount) * 10) / 10 : 0;

  // Food waste rate (meals with moderate or high waste)
  let wasteCount = 0;
  let mealsWithWaste = 0;
  for (const m of meals) {
    if (m.food_waste_level) {
      mealsWithWaste++;
      if (m.food_waste_level === "moderate" || m.food_waste_level === "high") {
        wasteCount++;
      }
    }
  }
  const foodWasteRate =
    mealsWithWaste > 0
      ? Math.round((wasteCount / mealsWithWaste) * 1000) / 10
      : 0;

  // Hygiene pass rate
  let hygienePass = 0;
  for (const h of hygieneChecks) {
    if (h.overall_result === "pass") hygienePass++;
  }
  const hygienePassRate =
    hygieneChecks.length > 0
      ? Math.round((hygienePass / hygieneChecks.length) * 1000) / 10
      : 0;

  // Overdue profile reviews
  let overdueProfileReviews = 0;
  for (const p of profiles) {
    if (p.next_review_date && new Date(p.next_review_date) < now) {
      overdueProfileReviews++;
    }
  }

  // By meal type
  const byMealType: Record<string, number> = {};
  for (const m of meals) {
    byMealType[m.meal_type] = (byMealType[m.meal_type] ?? 0) + 1;
  }

  // By dietary requirement
  const byDietaryRequirement: Record<string, number> = {};
  for (const p of profiles) {
    for (const r of p.dietary_requirements) {
      if (r !== "none") {
        byDietaryRequirement[r] = (byDietaryRequirement[r] ?? 0) + 1;
      }
    }
  }

  // Alternative meals rate
  let alternativeCount = 0;
  for (const m of meals) {
    if (m.alternative_meals_provided) alternativeCount++;
  }
  const alternativeMealsRate =
    meals.length > 0
      ? Math.round((alternativeCount / meals.length) * 1000) / 10
      : 0;

  return {
    profiles_complete: profilesComplete,
    children_with_allergies: childrenWithAllergies,
    meals_this_week: mealsThisWeek,
    avg_satisfaction_score: avgSatisfactionScore,
    food_waste_rate: foodWasteRate,
    hygiene_pass_rate: hygienePassRate,
    overdue_profile_reviews: overdueProfileReviews,
    by_meal_type: byMealType,
    by_dietary_requirement: byDietaryRequirement,
    alternative_meals_rate: alternativeMealsRate,
  };
}

/**
 * Identify food and nutrition alerts.
 */
export function identifyNutritionAlerts(
  profiles: DietaryProfile[],
  meals: MealRecord[],
  hygieneChecks: HygieneCheck[],
  totalChildren: number,
  now: Date = new Date(),
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

  // ── Profile alerts ───────────────────────────────────────────────────

  // Children without dietary profiles
  const profiledChildren = new Set(profiles.map((p) => p.child_id));
  if (totalChildren > 0 && profiledChildren.size < totalChildren) {
    const missing = totalChildren - profiledChildren.size;
    alerts.push({
      type: "missing_dietary_profile",
      severity: "high",
      message: `${missing} child(ren) without a dietary profile — Reg 9 requires health needs including nutrition to be assessed`,
      id: profiles.length > 0 ? profiles[0].id : "system",
    });
  }

  for (const p of profiles) {
    // Overdue profile review
    if (p.next_review_date && new Date(p.next_review_date) < now) {
      const daysOverdue = Math.round(
        (now.getTime() - new Date(p.next_review_date).getTime()) / 86400000,
      );
      alerts.push({
        type: "profile_review_overdue",
        severity: "medium",
        message: `Dietary profile review for ${p.child_name} is ${daysOverdue} days overdue`,
        id: p.id,
      });
    }

    // Medical dietary plan without details
    if (p.medical_dietary_plan && !p.medical_plan_details) {
      alerts.push({
        type: "medical_plan_no_details",
        severity: "high",
        message: `${p.child_name} has a medical dietary plan flagged but no details recorded — ensure plan is documented for kitchen staff`,
        id: p.id,
      });
    }
  }

  // ── Hygiene alerts ───────────────────────────────────────────────────

  for (const h of hygieneChecks) {
    if (h.overall_result === "fail") {
      alerts.push({
        type: "hygiene_fail",
        severity: "critical",
        message: `Food hygiene check on ${h.check_date} failed — immediate corrective action required`,
        id: h.id,
      });
    } else if (h.overall_result === "major_issue") {
      alerts.push({
        type: "hygiene_major_issue",
        severity: "high",
        message: `Food hygiene check on ${h.check_date} found major issues — corrective action required`,
        id: h.id,
      });
    }

    // Follow-up overdue
    if (h.follow_up_date && !h.follow_up_completed && new Date(h.follow_up_date) < now) {
      alerts.push({
        type: "hygiene_follow_up_overdue",
        severity: "high",
        message: `Follow-up for hygiene check on ${h.check_date} is overdue — action required`,
        id: h.id,
      });
    }
  }

  // ── Meal satisfaction alerts ─────────────────────────────────────────

  // Pattern of refused meals
  const recentMeals = meals
    .sort((a, b) => new Date(b.meal_date).getTime() - new Date(a.meal_date).getTime())
    .slice(0, 20);
  const childRefusals = new Map<string, number>();
  for (const m of recentMeals) {
    for (const s of m.satisfaction_ratings) {
      if (s.rating === "refused") {
        childRefusals.set(s.child_name, (childRefusals.get(s.child_name) ?? 0) + 1);
      }
    }
  }
  for (const [childName, count] of childRefusals) {
    if (count >= 3) {
      alerts.push({
        type: "frequent_meal_refusal",
        severity: "medium",
        message: `${childName} has refused ${count} meals recently — review dietary preferences and potential underlying concerns`,
        id: recentMeals[0]?.id ?? "system",
      });
    }
  }

  return alerts;
}

// ── CRUD — Dietary Profiles ──────────────────────────────────────────────

export async function listProfiles(
  homeId: string,
  filters?: {
    childId?: string;
    limit?: number;
  },
): Promise<ServiceResult<DietaryProfile[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_dietary_profiles") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  q = q.order("child_name", { ascending: true }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createProfile(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    dietaryRequirements?: DietaryRequirement[];
    allergies?: string[];
    intolerances?: string[];
    culturalDietaryNeeds?: string;
    religiousDietaryNeeds?: string;
    foodPreferences?: string[];
    foodDislikes?: string[];
    nutritionalConcerns?: string;
    eatingSupportNeeded?: string;
    medicalDietaryPlan?: boolean;
    medicalPlanDetails?: string;
    nextReviewDate?: string;
  },
): Promise<ServiceResult<DietaryProfile>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_dietary_profiles") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      dietary_requirements: input.dietaryRequirements ?? ["none"],
      allergies: input.allergies ?? [],
      intolerances: input.intolerances ?? [],
      cultural_dietary_needs: input.culturalDietaryNeeds ?? null,
      religious_dietary_needs: input.religiousDietaryNeeds ?? null,
      food_preferences: input.foodPreferences ?? [],
      food_dislikes: input.foodDislikes ?? [],
      nutritional_concerns: input.nutritionalConcerns ?? null,
      eating_support_needed: input.eatingSupportNeeded ?? null,
      medical_dietary_plan: input.medicalDietaryPlan ?? false,
      medical_plan_details: input.medicalPlanDetails ?? null,
      last_reviewed_date: null,
      reviewed_by: null,
      next_review_date: input.nextReviewDate ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateProfile(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<DietaryProfile>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_dietary_profiles") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Meal Records ──────────────────────────────────────────────────

export async function listMeals(
  homeId: string,
  filters?: {
    mealType?: MealType;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<MealRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_meal_records") as SB).select("*").eq("home_id", homeId);
  if (filters?.mealType) q = q.eq("meal_type", filters.mealType);
  if (filters?.dateFrom) q = q.gte("meal_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("meal_date", filters.dateTo);
  q = q.order("meal_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createMeal(
  input: {
    homeId: string;
    mealDate: string;
    mealType: MealType;
    menuDescription: string;
    preparedBy: string;
    childrenPresent?: string[];
    satisfactionRatings?: { child_id: string; child_name: string; rating: SatisfactionRating; comments: string }[];
    alternativeMealsProvided?: boolean;
    alternativeDetails?: string;
    foodWasteLevel?: "none" | "low" | "moderate" | "high";
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
      prepared_by: input.preparedBy,
      children_present: input.childrenPresent ?? [],
      satisfaction_ratings: input.satisfactionRatings ?? [],
      alternative_meals_provided: input.alternativeMealsProvided ?? false,
      alternative_details: input.alternativeDetails ?? null,
      food_waste_level: input.foodWasteLevel ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Hygiene Checks ────────────────────────────────────────────────

export async function listHygieneChecks(
  homeId: string,
  filters?: {
    dateFrom?: string;
    dateTo?: string;
    result?: HygieneCheckResult;
    limit?: number;
  },
): Promise<ServiceResult<HygieneCheck[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_hygiene_checks") as SB).select("*").eq("home_id", homeId);
  if (filters?.dateFrom) q = q.gte("check_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("check_date", filters.dateTo);
  if (filters?.result) q = q.eq("overall_result", filters.result);
  q = q.order("check_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createHygieneCheck(
  input: {
    homeId: string;
    checkDate: string;
    checkedBy: string;
    fridgeTempOk?: boolean;
    freezerTempOk?: boolean;
    foodStorageOk?: boolean;
    kitchenCleanliness?: HygieneCheckResult;
    foodPrepAreas?: HygieneCheckResult;
    handWashingFacilities?: HygieneCheckResult;
    overallResult?: HygieneCheckResult;
    issuesFound?: string;
    correctiveAction?: string;
    followUpDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<HygieneCheck>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_hygiene_checks") as SB)
    .insert({
      home_id: input.homeId,
      check_date: input.checkDate,
      checked_by: input.checkedBy,
      fridge_temp_ok: input.fridgeTempOk ?? true,
      freezer_temp_ok: input.freezerTempOk ?? true,
      food_storage_ok: input.foodStorageOk ?? true,
      kitchen_cleanliness: input.kitchenCleanliness ?? "pass",
      food_prep_areas: input.foodPrepAreas ?? "pass",
      hand_washing_facilities: input.handWashingFacilities ?? "pass",
      overall_result: input.overallResult ?? "pass",
      issues_found: input.issuesFound ?? null,
      corrective_action: input.correctiveAction ?? null,
      follow_up_date: input.followUpDate ?? null,
      follow_up_completed: false,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeNutritionMetrics,
  identifyNutritionAlerts,
};
