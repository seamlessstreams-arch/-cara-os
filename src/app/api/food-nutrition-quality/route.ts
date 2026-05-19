// ==============================================================================
// API: /api/food-nutrition-quality
//
// Food Nutrition Quality Intelligence
//
// GET  — Returns assessment with Oak House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateFoodNutritionQualityIntelligence,
  getMealTypeLabel,
  getNutritionRatingLabel,
  getRatingLabel,
} from "@/lib/food-nutrition-quality";
import type {
  MealRecord,
  NutritionPolicy,
  StaffNutritionTraining,
} from "@/lib/food-nutrition-quality";

// -- Demo Data: Oak House -------------------------------------------------------

const DEMO_RECORDS: MealRecord[] = [
  { id: "rec-1", childId: "child-alex", childName: "Alex", mealDate: "2026-02-10", mealType: "breakfast", nutritionRating: "excellent", dietaryNeedsMet: true, childChoiceOffered: true, portionAppropriate: true, freshIngredientsUsed: true, documentedInRecord: true, childSatisfied: true },
  { id: "rec-2", childId: "child-alex", childName: "Alex", mealDate: "2026-02-10", mealType: "lunch", nutritionRating: "good", dietaryNeedsMet: true, childChoiceOffered: true, portionAppropriate: true, freshIngredientsUsed: true, documentedInRecord: true, childSatisfied: true },
  { id: "rec-3", childId: "child-alex", childName: "Alex", mealDate: "2026-03-05", mealType: "dinner", nutritionRating: "excellent", dietaryNeedsMet: true, childChoiceOffered: true, portionAppropriate: true, freshIngredientsUsed: true, documentedInRecord: true, childSatisfied: true },
  { id: "rec-4", childId: "child-jordan", childName: "Jordan", mealDate: "2026-02-18", mealType: "snack", nutritionRating: "good", dietaryNeedsMet: true, childChoiceOffered: true, portionAppropriate: true, freshIngredientsUsed: true, documentedInRecord: true, childSatisfied: true },
  { id: "rec-5", childId: "child-jordan", childName: "Jordan", mealDate: "2026-03-22", mealType: "special_dietary", nutritionRating: "excellent", dietaryNeedsMet: true, childChoiceOffered: true, portionAppropriate: true, freshIngredientsUsed: true, documentedInRecord: true, childSatisfied: true },
  { id: "rec-6", childId: "child-jordan", childName: "Jordan", mealDate: "2026-04-30", mealType: "cultural_meal", nutritionRating: "excellent", dietaryNeedsMet: true, childChoiceOffered: true, portionAppropriate: true, freshIngredientsUsed: true, documentedInRecord: true, childSatisfied: true },
  { id: "rec-7", childId: "child-morgan", childName: "Morgan", mealDate: "2026-01-20", mealType: "celebration", nutritionRating: "good", dietaryNeedsMet: true, childChoiceOffered: true, portionAppropriate: true, freshIngredientsUsed: true, documentedInRecord: true, childSatisfied: true },
  { id: "rec-8", childId: "child-morgan", childName: "Morgan", mealDate: "2026-03-15", mealType: "packed_lunch", nutritionRating: "excellent", dietaryNeedsMet: true, childChoiceOffered: true, portionAppropriate: true, freshIngredientsUsed: true, documentedInRecord: true, childSatisfied: true },
  { id: "rec-9", childId: "child-morgan", childName: "Morgan", mealDate: "2026-04-12", mealType: "breakfast", nutritionRating: "excellent", dietaryNeedsMet: true, childChoiceOffered: true, portionAppropriate: true, freshIngredientsUsed: true, documentedInRecord: true, childSatisfied: true },
  { id: "rec-10", childId: "child-alex", childName: "Alex", mealDate: "2026-05-01", mealType: "snack", nutritionRating: "good", dietaryNeedsMet: true, childChoiceOffered: true, portionAppropriate: true, freshIngredientsUsed: true, documentedInRecord: true, childSatisfied: true },
];

const DEMO_POLICY: NutritionPolicy = {
  id: "pol-1",
  mealPlanningFramework: true,
  dietaryAssessmentProcess: true,
  allergyManagement: true,
  culturalDietaryRespect: true,
  foodHygieneStandards: true,
  childParticipation: true,
  regularReview: true,
};

const DEMO_TRAINING: StaffNutritionTraining[] = [
  { id: "tr-1", staffId: "staff-sarah", staffName: "Sarah Johnson", foodHygiene: true, nutritionalPlanning: true, allergyAwareness: true, culturalDietaryNeeds: true, portionControl: true, mealPreparation: true },
  { id: "tr-2", staffId: "staff-tom", staffName: "Tom Richards", foodHygiene: true, nutritionalPlanning: true, allergyAwareness: true, culturalDietaryNeeds: false, portionControl: true, mealPreparation: true },
  { id: "tr-3", staffId: "staff-lisa", staffName: "Lisa Williams", foodHygiene: true, nutritionalPlanning: true, allergyAwareness: true, culturalDietaryNeeds: true, portionControl: true, mealPreparation: true },
  { id: "tr-4", staffId: "staff-darren", staffName: "Darren Laville", foodHygiene: true, nutritionalPlanning: true, allergyAwareness: true, culturalDietaryNeeds: true, portionControl: true, mealPreparation: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateFoodNutritionQualityIntelligence(
    DEMO_RECORDS,
    DEMO_POLICY,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        mealTypeLabels: Object.fromEntries(
          (["breakfast", "lunch", "dinner", "snack", "special_dietary", "cultural_meal", "celebration", "packed_lunch"] as const).map((t) => [t, getMealTypeLabel(t)]),
        ),
        nutritionRatingLabels: Object.fromEntries(
          (["excellent", "good", "adequate", "poor", "not_assessed"] as const).map((r) => [r, getNutritionRatingLabel(r)]),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map((r) => [r, getRatingLabel(r)]),
        ),
      },
    },
  });
}

// -- POST -----------------------------------------------------------------------

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { records, policy, training, homeId, periodStart, periodEnd } = body as {
    records?: MealRecord[];
    policy?: NutritionPolicy | null;
    training?: StaffNutritionTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateFoodNutritionQualityIntelligence(
    records ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
