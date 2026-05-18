// ══════════════════════════════════════════════════════════════════════════════
// API: /api/menu-planning-nutrition
//
// Menu Planning & Nutrition Intelligence
//
// GET  — Returns menu planning assessment with Oak House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  generateMenuPlanningNutritionIntelligence,
  getMealTypeLabel,
  getNutritionalBalanceLabel,
  getCulturalAccommodationLabel,
  getMenuVarietyLabel,
  getChildParticipationLabel,
  getRatingLabel,
} from "@/lib/menu-planning-nutrition";
import type {
  WeeklyMenu,
  MealFeedback,
  ChildParticipationRecord,
  NutritionAudit,
} from "@/lib/menu-planning-nutrition";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

const CHILD_IDS = ["child-alex", "child-jordan", "child-morgan"];
const CHILD_NAMES: Record<string, string> = {
  "child-alex": "Alex",
  "child-jordan": "Jordan",
  "child-morgan": "Morgan",
};

const DEMO_MENUS: WeeklyMenu[] = [
  { id: "menu-w1", weekCommencing: "2026-03-04", mealsPlanned: 21, mealsServed: 20, nutritionalBalance: "excellent", culturalAccommodation: "fully_met", childrenConsulted: true, menuVariety: "highly_varied", specialDietaryMet: true },
  { id: "menu-w2", weekCommencing: "2026-03-11", mealsPlanned: 21, mealsServed: 21, nutritionalBalance: "good", culturalAccommodation: "fully_met", childrenConsulted: true, menuVariety: "varied", specialDietaryMet: true },
  { id: "menu-w3", weekCommencing: "2026-03-18", mealsPlanned: 21, mealsServed: 19, nutritionalBalance: "good", culturalAccommodation: "fully_met", childrenConsulted: true, menuVariety: "highly_varied", specialDietaryMet: true },
  { id: "menu-w4", weekCommencing: "2026-03-25", mealsPlanned: 21, mealsServed: 21, nutritionalBalance: "excellent", culturalAccommodation: "fully_met", childrenConsulted: true, menuVariety: "varied", specialDietaryMet: true },
];

const DEMO_FEEDBACK: MealFeedback[] = [
  { id: "fb-a1", menuId: "menu-w1", childId: "child-alex", childName: "Alex", mealType: "breakfast", enjoymentRating: 4, portionSatisfactory: true, comments: "Good cereal and toast options" },
  { id: "fb-a2", menuId: "menu-w1", childId: "child-alex", childName: "Alex", mealType: "lunch", enjoymentRating: 5, portionSatisfactory: true, comments: "Loved the pasta bake" },
  { id: "fb-a3", menuId: "menu-w2", childId: "child-alex", childName: "Alex", mealType: "dinner", enjoymentRating: 4, portionSatisfactory: true, comments: null },
  { id: "fb-a4", menuId: "menu-w2", childId: "child-alex", childName: "Alex", mealType: "snack", enjoymentRating: 3, portionSatisfactory: true, comments: "Fruit bowl was nice" },
  { id: "fb-j1", menuId: "menu-w1", childId: "child-jordan", childName: "Jordan", mealType: "breakfast", enjoymentRating: 4, portionSatisfactory: true, comments: "Nice toast with eggs" },
  { id: "fb-j2", menuId: "menu-w1", childId: "child-jordan", childName: "Jordan", mealType: "lunch", enjoymentRating: 4, portionSatisfactory: true, comments: null },
  { id: "fb-j3", menuId: "menu-w2", childId: "child-jordan", childName: "Jordan", mealType: "dinner", enjoymentRating: 5, portionSatisfactory: true, comments: "Best dinner this week" },
  { id: "fb-j4", menuId: "menu-w2", childId: "child-jordan", childName: "Jordan", mealType: "supper", enjoymentRating: 3, portionSatisfactory: true, comments: "Supper was OK" },
  { id: "fb-m1", menuId: "menu-w3", childId: "child-morgan", childName: "Morgan", mealType: "breakfast", enjoymentRating: 4, portionSatisfactory: true, comments: "Good start to the day" },
  { id: "fb-m2", menuId: "menu-w3", childId: "child-morgan", childName: "Morgan", mealType: "lunch", enjoymentRating: 5, portionSatisfactory: true, comments: "Excellent chicken curry" },
  { id: "fb-m3", menuId: "menu-w4", childId: "child-morgan", childName: "Morgan", mealType: "dinner", enjoymentRating: 4, portionSatisfactory: true, comments: null },
  { id: "fb-m4", menuId: "menu-w4", childId: "child-morgan", childName: "Morgan", mealType: "snack", enjoymentRating: 4, portionSatisfactory: true, comments: "Fresh fruit was lovely" },
];

const DEMO_PARTICIPATION: ChildParticipationRecord[] = [
  { id: "part-a1", childId: "child-alex", childName: "Alex", date: "2026-03-08", participationType: "cooking_activity", staffSupported: "Sarah Johnson", childEnjoyed: true },
  { id: "part-a2", childId: "child-alex", childName: "Alex", date: "2026-03-15", participationType: "menu_planning", staffSupported: "Darren Laville", childEnjoyed: true },
  { id: "part-j1", childId: "child-jordan", childName: "Jordan", date: "2026-03-10", participationType: "food_shopping", staffSupported: "Tom Richards", childEnjoyed: true },
  { id: "part-j2", childId: "child-jordan", childName: "Jordan", date: "2026-03-17", participationType: "cooking_activity", staffSupported: "Lisa Williams", childEnjoyed: true },
  { id: "part-m1", childId: "child-morgan", childName: "Morgan", date: "2026-03-12", participationType: "cooking_activity", staffSupported: "Sarah Johnson", childEnjoyed: true },
  { id: "part-m2", childId: "child-morgan", childName: "Morgan", date: "2026-03-20", participationType: "growing_food", staffSupported: "Darren Laville", childEnjoyed: true },
];

const DEMO_AUDITS: NutritionAudit[] = [
  { id: "audit-1", auditDate: "2026-02-15", auditor: "Darren Laville", fiveADayEvidence: true, sugarLimitsFollowed: true, freshFoodUsed: true, portionGuidanceFollowed: true, overallCompliant: true },
  { id: "audit-2", auditDate: "2026-04-15", auditor: "Sarah Johnson", fiveADayEvidence: true, sugarLimitsFollowed: true, freshFoodUsed: true, portionGuidanceFollowed: true, overallCompliant: true },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateMenuPlanningNutritionIntelligence(
    DEMO_MENUS,
    DEMO_FEEDBACK,
    DEMO_PARTICIPATION,
    DEMO_AUDITS,
    CHILD_IDS,
    CHILD_NAMES,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        mealTypeLabels: Object.fromEntries(
          (["breakfast", "lunch", "dinner", "snack", "supper"] as const).map((t) => [t, getMealTypeLabel(t)]),
        ),
        nutritionalBalanceLabels: Object.fromEntries(
          (["excellent", "good", "adequate", "poor"] as const).map((b) => [b, getNutritionalBalanceLabel(b)]),
        ),
        culturalAccommodationLabels: Object.fromEntries(
          (["fully_met", "partially_met", "not_met", "not_applicable"] as const).map((c) => [c, getCulturalAccommodationLabel(c)]),
        ),
        menuVarietyLabels: Object.fromEntries(
          (["highly_varied", "varied", "limited", "repetitive"] as const).map((v) => [v, getMenuVarietyLabel(v)]),
        ),
        childParticipationLabels: Object.fromEntries(
          (["menu_planning", "cooking_activity", "food_shopping", "growing_food", "none"] as const).map((p) => [p, getChildParticipationLabel(p)]),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map((r) => [r, getRatingLabel(r)]),
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

  const {
    menus,
    feedback,
    participationRecords,
    audits,
    childIds,
    childNames,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    menus?: WeeklyMenu[];
    feedback?: MealFeedback[];
    participationRecords?: ChildParticipationRecord[];
    audits?: NutritionAudit[];
    childIds?: string[];
    childNames?: Record<string, string>;
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

  const result = generateMenuPlanningNutritionIntelligence(
    menus ?? [],
    feedback ?? [],
    participationRecords ?? [],
    audits ?? [],
    childIds ?? [],
    childNames ?? {},
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
