// ══════════════════════════════════════════════════════════════════════════════
// API: /api/nutrition-hydration-monitoring
//
// Nutrition & Hydration Monitoring Intelligence
//
// GET  — Returns nutrition/hydration metrics with demo data (Oak House)
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateNutritionHydrationMonitoringIntelligence,
  getMealTypeLabel,
  getNutritionQualityLabel,
  getPortionConsumedLabel,
  getRatingLabel,
} from "@/lib/nutrition-hydration-monitoring";
import type {
  MealRecord,
  HydrationRecord,
  NutritionPolicy,
  StaffNutritionTraining,
} from "@/lib/nutrition-hydration-monitoring";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

function generateDemoData(): {
  meals: MealRecord[];
  hydrationRecords: HydrationRecord[];
  policy: NutritionPolicy;
  training: StaffNutritionTraining[];
} {
  const meals: MealRecord[] = [
    // Alex — 2026-03-10
    {
      id: "meal-001",
      childId: "child-alex",
      childName: "Alex",
      mealDate: "2026-03-10",
      mealType: "breakfast",
      nutritionQuality: "excellent",
      portionConsumed: "full",
      dietaryRequirementsMet: true,
      childSatisfied: true,
    },
    {
      id: "meal-002",
      childId: "child-alex",
      childName: "Alex",
      mealDate: "2026-03-10",
      mealType: "lunch",
      nutritionQuality: "good",
      portionConsumed: "most",
      dietaryRequirementsMet: true,
      childSatisfied: true,
    },
    {
      id: "meal-003",
      childId: "child-alex",
      childName: "Alex",
      mealDate: "2026-03-10",
      mealType: "dinner",
      nutritionQuality: "good",
      portionConsumed: "full",
      dietaryRequirementsMet: true,
      childSatisfied: true,
    },
    // Jordan — 2026-03-10
    {
      id: "meal-004",
      childId: "child-jordan",
      childName: "Jordan",
      mealDate: "2026-03-10",
      mealType: "breakfast",
      nutritionQuality: "good",
      portionConsumed: "most",
      dietaryRequirementsMet: true,
      childSatisfied: true,
    },
    {
      id: "meal-005",
      childId: "child-jordan",
      childName: "Jordan",
      mealDate: "2026-03-10",
      mealType: "lunch",
      nutritionQuality: "adequate",
      portionConsumed: "half",
      dietaryRequirementsMet: true,
      childSatisfied: false,
    },
    {
      id: "meal-006",
      childId: "child-jordan",
      childName: "Jordan",
      mealDate: "2026-03-10",
      mealType: "dinner",
      nutritionQuality: "good",
      portionConsumed: "full",
      dietaryRequirementsMet: true,
      childSatisfied: true,
    },
    // Morgan — 2026-03-10
    {
      id: "meal-007",
      childId: "child-morgan",
      childName: "Morgan",
      mealDate: "2026-03-10",
      mealType: "breakfast",
      nutritionQuality: "excellent",
      portionConsumed: "full",
      dietaryRequirementsMet: true,
      childSatisfied: true,
    },
    {
      id: "meal-008",
      childId: "child-morgan",
      childName: "Morgan",
      mealDate: "2026-03-10",
      mealType: "lunch",
      nutritionQuality: "good",
      portionConsumed: "most",
      dietaryRequirementsMet: true,
      childSatisfied: true,
    },
    {
      id: "meal-009",
      childId: "child-morgan",
      childName: "Morgan",
      mealDate: "2026-03-10",
      mealType: "dinner",
      nutritionQuality: "good",
      portionConsumed: "full",
      dietaryRequirementsMet: true,
      childSatisfied: true,
    },
    // Alex — 2026-04-15
    {
      id: "meal-010",
      childId: "child-alex",
      childName: "Alex",
      mealDate: "2026-04-15",
      mealType: "breakfast",
      nutritionQuality: "good",
      portionConsumed: "full",
      dietaryRequirementsMet: true,
      childSatisfied: true,
    },
    {
      id: "meal-011",
      childId: "child-alex",
      childName: "Alex",
      mealDate: "2026-04-15",
      mealType: "lunch",
      nutritionQuality: "excellent",
      portionConsumed: "full",
      dietaryRequirementsMet: true,
      childSatisfied: true,
    },
    {
      id: "meal-012",
      childId: "child-alex",
      childName: "Alex",
      mealDate: "2026-04-15",
      mealType: "snack",
      nutritionQuality: "good",
      portionConsumed: "most",
      dietaryRequirementsMet: true,
      childSatisfied: true,
    },
    // Jordan — 2026-04-15
    {
      id: "meal-013",
      childId: "child-jordan",
      childName: "Jordan",
      mealDate: "2026-04-15",
      mealType: "breakfast",
      nutritionQuality: "good",
      portionConsumed: "most",
      dietaryRequirementsMet: true,
      childSatisfied: true,
    },
    {
      id: "meal-014",
      childId: "child-jordan",
      childName: "Jordan",
      mealDate: "2026-04-15",
      mealType: "lunch",
      nutritionQuality: "good",
      portionConsumed: "full",
      dietaryRequirementsMet: true,
      childSatisfied: true,
    },
    // Morgan — 2026-04-15
    {
      id: "meal-015",
      childId: "child-morgan",
      childName: "Morgan",
      mealDate: "2026-04-15",
      mealType: "breakfast",
      nutritionQuality: "excellent",
      portionConsumed: "full",
      dietaryRequirementsMet: true,
      childSatisfied: true,
    },
    {
      id: "meal-016",
      childId: "child-morgan",
      childName: "Morgan",
      mealDate: "2026-04-15",
      mealType: "dinner",
      nutritionQuality: "good",
      portionConsumed: "full",
      dietaryRequirementsMet: true,
      childSatisfied: true,
    },
    {
      id: "meal-017",
      childId: "child-morgan",
      childName: "Morgan",
      mealDate: "2026-04-15",
      mealType: "supper",
      nutritionQuality: "adequate",
      portionConsumed: "half",
      dietaryRequirementsMet: true,
      childSatisfied: false,
    },
  ];

  const hydrationRecords: HydrationRecord[] = [
    // Alex
    {
      id: "hyd-001",
      childId: "child-alex",
      childName: "Alex",
      recordDate: "2026-03-10",
      hydrationLevel: "good",
      cupsConsumed: 7,
      targetCups: 8,
      encouragementGiven: true,
    },
    {
      id: "hyd-002",
      childId: "child-alex",
      childName: "Alex",
      recordDate: "2026-04-15",
      hydrationLevel: "excellent",
      cupsConsumed: 9,
      targetCups: 8,
      encouragementGiven: true,
    },
    // Jordan
    {
      id: "hyd-003",
      childId: "child-jordan",
      childName: "Jordan",
      recordDate: "2026-03-10",
      hydrationLevel: "adequate",
      cupsConsumed: 5,
      targetCups: 8,
      encouragementGiven: true,
    },
    {
      id: "hyd-004",
      childId: "child-jordan",
      childName: "Jordan",
      recordDate: "2026-04-15",
      hydrationLevel: "good",
      cupsConsumed: 7,
      targetCups: 8,
      encouragementGiven: true,
    },
    // Morgan
    {
      id: "hyd-005",
      childId: "child-morgan",
      childName: "Morgan",
      recordDate: "2026-03-10",
      hydrationLevel: "excellent",
      cupsConsumed: 9,
      targetCups: 8,
      encouragementGiven: true,
    },
    {
      id: "hyd-006",
      childId: "child-morgan",
      childName: "Morgan",
      recordDate: "2026-04-15",
      hydrationLevel: "good",
      cupsConsumed: 8,
      targetCups: 8,
      encouragementGiven: false,
    },
  ];

  const policy: NutritionPolicy = {
    id: "policy-001",
    menuRotationWeeks: 4,
    dietaryNeedsDocumented: true,
    allergyProtocolInPlace: true,
    mealTimeSupervised: true,
    nutritionTrainingProvided: true,
    culturalDietaryAccommodation: true,
    snackAvailability: true,
  };

  const training: StaffNutritionTraining[] = [
    {
      id: "train-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      foodHygiene: true,
      dietaryRequirements: true,
      allergyAwareness: true,
      mealPreparation: true,
      nutritionGuidance: true,
      hydrationMonitoring: true,
    },
    {
      id: "train-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      foodHygiene: true,
      dietaryRequirements: true,
      allergyAwareness: true,
      mealPreparation: true,
      nutritionGuidance: false,
      hydrationMonitoring: true,
    },
    {
      id: "train-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      foodHygiene: true,
      dietaryRequirements: true,
      allergyAwareness: true,
      mealPreparation: false,
      nutritionGuidance: true,
      hydrationMonitoring: false,
    },
    {
      id: "train-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      foodHygiene: true,
      dietaryRequirements: true,
      allergyAwareness: true,
      mealPreparation: true,
      nutritionGuidance: true,
      hydrationMonitoring: true,
    },
  ];

  return { meals, hydrationRecords, policy, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { meals, hydrationRecords, policy, training } = generateDemoData();

  const result = generateNutritionHydrationMonitoringIntelligence(
    meals,
    hydrationRecords,
    policy,
    training,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        mealSummary: meals.map((m) => ({
          id: m.id,
          date: m.mealDate,
          child: m.childName,
          type: getMealTypeLabel(m.mealType),
          quality: getNutritionQualityLabel(m.nutritionQuality),
          portion: getPortionConsumedLabel(m.portionConsumed),
        })),
        ratingLabel: getRatingLabel(result.rating),
      },
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    meals,
    hydrationRecords,
    policy,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    meals?: MealRecord[];
    hydrationRecords?: HydrationRecord[];
    policy?: NutritionPolicy | null;
    training?: StaffNutritionTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 },
    );
  }

  const result = generateNutritionHydrationMonitoringIntelligence(
    meals ?? [],
    hydrationRecords ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
