// ══════════════════════════════════════════════════════════════════════════════
// API: /api/nutrition-healthy-living
//
// Nutrition & Healthy Living Intelligence
//
// GET  — Returns nutrition/health assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  generateNutritionHealthyLivingIntelligence,
  getMealTypeLabel,
  getDietaryRequirementLabel,
  getActivityTypeLabel,
  getHydrationStatusLabel,
} from "@/lib/nutrition-healthy-living";
import type {
  MealRecord,
  ChildDietaryProfile,
  PhysicalActivity,
  HealthPromotion,
  MenuPlan,
} from "@/lib/nutrition-healthy-living";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

const DEMO_PROFILES: ChildDietaryProfile[] = [
  { id: "prof-alex", childId: "child-alex", childName: "Alex", dietaryRequirements: ["none"], allergies: [], preferences: ["pasta", "pizza"], lastReviewedDate: "2026-04-01", reviewedBy: "Sarah Johnson", weightHealthy: true, dietaryPlanInPlace: true },
  { id: "prof-jordan", childId: "child-jordan", childName: "Jordan", dietaryRequirements: ["gluten_free"], allergies: ["gluten"], preferences: ["rice dishes"], lastReviewedDate: "2026-04-01", reviewedBy: "Tom Richards", weightHealthy: true, dietaryPlanInPlace: true },
  { id: "prof-morgan", childId: "child-morgan", childName: "Morgan", dietaryRequirements: ["halal"], allergies: [], preferences: ["chicken", "lamb"], lastReviewedDate: "2026-04-01", reviewedBy: "Lisa Williams", weightHealthy: true, dietaryPlanInPlace: true },
];

const DEMO_MEALS: MealRecord[] = [
  { id: "m-a01", childId: "child-alex", date: "2026-03-15", mealType: "breakfast", quality: "good", dietaryRequirementsMet: true, freshFruitVegIncluded: true, childInvolvedInPreparation: false, childEnjoyed: true, portionAppropriate: true },
  { id: "m-a02", childId: "child-alex", date: "2026-03-15", mealType: "lunch", quality: "excellent", dietaryRequirementsMet: true, freshFruitVegIncluded: true, childInvolvedInPreparation: true, childEnjoyed: true, portionAppropriate: true },
  { id: "m-a03", childId: "child-alex", date: "2026-03-15", mealType: "dinner", quality: "good", dietaryRequirementsMet: true, freshFruitVegIncluded: true, childInvolvedInPreparation: false, childEnjoyed: true, portionAppropriate: true },
  { id: "m-j01", childId: "child-jordan", date: "2026-03-15", mealType: "breakfast", quality: "good", dietaryRequirementsMet: true, freshFruitVegIncluded: true, childInvolvedInPreparation: false, childEnjoyed: true, portionAppropriate: true },
  { id: "m-j02", childId: "child-jordan", date: "2026-03-15", mealType: "lunch", quality: "good", dietaryRequirementsMet: true, freshFruitVegIncluded: false, childInvolvedInPreparation: false, childEnjoyed: true, portionAppropriate: true },
  { id: "m-j03", childId: "child-jordan", date: "2026-03-15", mealType: "dinner", quality: "excellent", dietaryRequirementsMet: true, freshFruitVegIncluded: true, childInvolvedInPreparation: true, childEnjoyed: true, portionAppropriate: true },
  { id: "m-m01", childId: "child-morgan", date: "2026-03-15", mealType: "breakfast", quality: "good", dietaryRequirementsMet: true, freshFruitVegIncluded: true, childInvolvedInPreparation: false, childEnjoyed: true, portionAppropriate: true },
  { id: "m-m02", childId: "child-morgan", date: "2026-03-15", mealType: "lunch", quality: "good", dietaryRequirementsMet: true, freshFruitVegIncluded: true, childInvolvedInPreparation: true, childEnjoyed: true, portionAppropriate: true },
  { id: "m-m03", childId: "child-morgan", date: "2026-03-15", mealType: "dinner", quality: "excellent", dietaryRequirementsMet: true, freshFruitVegIncluded: true, childInvolvedInPreparation: true, childEnjoyed: false, portionAppropriate: true },
];

const DEMO_ACTIVITIES: PhysicalActivity[] = [
  { id: "act-a01", childId: "child-alex", date: "2026-03-10", activityType: "sports", intensity: "vigorous", durationMinutes: 90, childEnjoyment: true, staffSupervised: true },
  { id: "act-a02", childId: "child-alex", date: "2026-03-12", activityType: "swimming", intensity: "moderate", durationMinutes: 60, childEnjoyment: true, staffSupervised: true },
  { id: "act-a03", childId: "child-alex", date: "2026-03-14", activityType: "cycling", intensity: "moderate", durationMinutes: 45, childEnjoyment: true, staffSupervised: true },
  { id: "act-j01", childId: "child-jordan", date: "2026-03-10", activityType: "walking", intensity: "light", durationMinutes: 30, childEnjoyment: true, staffSupervised: true },
  { id: "act-j02", childId: "child-jordan", date: "2026-03-13", activityType: "outdoor_play", intensity: "moderate", durationMinutes: 60, childEnjoyment: true, staffSupervised: true },
  { id: "act-j03", childId: "child-jordan", date: "2026-03-15", activityType: "dance", intensity: "moderate", durationMinutes: 45, childEnjoyment: true, staffSupervised: true },
  { id: "act-m01", childId: "child-morgan", date: "2026-03-11", activityType: "gym", intensity: "vigorous", durationMinutes: 60, childEnjoyment: true, staffSupervised: true },
  { id: "act-m02", childId: "child-morgan", date: "2026-03-13", activityType: "yoga", intensity: "light", durationMinutes: 45, childEnjoyment: true, staffSupervised: false },
  { id: "act-m03", childId: "child-morgan", date: "2026-03-14", activityType: "team_games", intensity: "moderate", durationMinutes: 60, childEnjoyment: false, staffSupervised: true },
];

const DEMO_HEALTH: HealthPromotion[] = [
  { id: "hp-alex", childId: "child-alex", hydrationStatus: "well_hydrated", sleepQualityGood: true, dentalCheckUpToDate: true, opticalCheckUpToDate: true, annualHealthAssessmentComplete: true, cookingSkillsDeveloping: true, nutritionEducationProvided: true, mentalWellbeingSupported: true, substanceMisuseEducation: true, sexualHealthEducation: true, assessedDate: "2026-04-01" },
  { id: "hp-jordan", childId: "child-jordan", hydrationStatus: "adequate", sleepQualityGood: true, dentalCheckUpToDate: true, opticalCheckUpToDate: false, annualHealthAssessmentComplete: true, cookingSkillsDeveloping: false, nutritionEducationProvided: true, mentalWellbeingSupported: true, substanceMisuseEducation: true, sexualHealthEducation: false, assessedDate: "2026-04-01" },
  { id: "hp-morgan", childId: "child-morgan", hydrationStatus: "well_hydrated", sleepQualityGood: false, dentalCheckUpToDate: true, opticalCheckUpToDate: true, annualHealthAssessmentComplete: true, cookingSkillsDeveloping: true, nutritionEducationProvided: true, mentalWellbeingSupported: true, substanceMisuseEducation: true, sexualHealthEducation: true, assessedDate: "2026-04-01" },
];

const DEMO_MENUS: MenuPlan[] = [
  { id: "menu-w1", weekStartDate: "2026-03-04", mealsPlanned: 21, balancedMeals: 19, childrenConsulted: true, culturalDiversityReflected: true, budgetAppropriate: true, seasonalIngredientsUsed: true, specialDietsCatered: true },
  { id: "menu-w2", weekStartDate: "2026-03-11", mealsPlanned: 21, balancedMeals: 20, childrenConsulted: true, culturalDiversityReflected: true, budgetAppropriate: true, seasonalIngredientsUsed: true, specialDietsCatered: true },
  { id: "menu-w3", weekStartDate: "2026-03-18", mealsPlanned: 21, balancedMeals: 18, childrenConsulted: true, culturalDiversityReflected: false, budgetAppropriate: true, seasonalIngredientsUsed: false, specialDietsCatered: true },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateNutritionHealthyLivingIntelligence(
    DEMO_MEALS,
    DEMO_PROFILES,
    DEMO_ACTIVITIES,
    DEMO_HEALTH,
    DEMO_MENUS,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        mealTypeLabels: Object.fromEntries(
          (["breakfast", "lunch", "dinner", "snack"] as const).map((t) => [t, getMealTypeLabel(t)]),
        ),
        dietaryRequirementLabels: Object.fromEntries(
          ([
            "vegetarian", "vegan", "halal", "kosher", "gluten_free", "dairy_free",
            "nut_free", "egg_free", "diabetic", "low_sugar", "high_calorie", "texture_modified", "none",
          ] as const).map((d) => [d, getDietaryRequirementLabel(d)]),
        ),
        activityTypeLabels: Object.fromEntries(
          ([
            "sports", "swimming", "walking", "cycling", "gym", "dance",
            "outdoor_play", "gardening", "yoga", "martial_arts", "team_games", "other",
          ] as const).map((a) => [a, getActivityTypeLabel(a)]),
        ),
        hydrationStatusLabels: Object.fromEntries(
          (["well_hydrated", "adequate", "needs_improvement", "concern"] as const).map(
            (s) => [s, getHydrationStatusLabel(s)],
          ),
        ),
      },
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { meals, profiles, activities, healthRecords, menuPlans, homeId, periodStart, periodEnd } = body as {
    meals?: MealRecord[];
    profiles?: ChildDietaryProfile[];
    activities?: PhysicalActivity[];
    healthRecords?: HealthPromotion[];
    menuPlans?: MenuPlan[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateNutritionHealthyLivingIntelligence(
    meals ?? [],
    profiles ?? [],
    activities ?? [],
    healthRecords ?? [],
    menuPlans ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
