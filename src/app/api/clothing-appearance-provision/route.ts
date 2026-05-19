// ==============================================================================
// API: /api/clothing-appearance-provision
//
// Clothing & Appearance Provision Intelligence
//
// GET  — Returns assessment with Oak House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateClothingAppearanceProvisionIntelligence,
  getClothingCategoryLabel,
  getProvisionStatusLabel,
  getSeasonalReadinessLabel,
  getRatingLabel,
} from "@/lib/clothing-appearance-provision";
import type {
  ClothingProvisionRecord,
  ClothingBudgetRecord,
  ClothingPolicy,
  StaffClothingTraining,
} from "@/lib/clothing-appearance-provision";

// -- Demo Data: Oak House -------------------------------------------------------

const DEMO_PROVISIONS: ClothingProvisionRecord[] = [
  { id: "prov-1", childId: "child-alex", childName: "Alex", recordDate: "2026-04-01", clothingCategory: "everyday", provisionStatus: "fully_met", childChoice: true, ageAppropriate: true, fitCorrect: true, culturallyAppropriate: true },
  { id: "prov-2", childId: "child-alex", childName: "Alex", recordDate: "2026-04-01", clothingCategory: "school_uniform", provisionStatus: "fully_met", childChoice: true, ageAppropriate: true, fitCorrect: true, culturallyAppropriate: true },
  { id: "prov-3", childId: "child-alex", childName: "Alex", recordDate: "2026-04-01", clothingCategory: "outdoor", provisionStatus: "fully_met", childChoice: true, ageAppropriate: true, fitCorrect: true, culturallyAppropriate: true },
  { id: "prov-4", childId: "child-jordan", childName: "Jordan", recordDate: "2026-04-01", clothingCategory: "everyday", provisionStatus: "fully_met", childChoice: true, ageAppropriate: true, fitCorrect: true, culturallyAppropriate: true },
  { id: "prov-5", childId: "child-jordan", childName: "Jordan", recordDate: "2026-04-01", clothingCategory: "footwear", provisionStatus: "fully_met", childChoice: true, ageAppropriate: true, fitCorrect: true, culturallyAppropriate: true },
  { id: "prov-6", childId: "child-morgan", childName: "Morgan", recordDate: "2026-04-01", clothingCategory: "everyday", provisionStatus: "fully_met", childChoice: true, ageAppropriate: true, fitCorrect: true, culturallyAppropriate: true },
  { id: "prov-7", childId: "child-morgan", childName: "Morgan", recordDate: "2026-04-01", clothingCategory: "sports", provisionStatus: "fully_met", childChoice: true, ageAppropriate: true, fitCorrect: true, culturallyAppropriate: true },
  { id: "prov-8", childId: "child-morgan", childName: "Morgan", recordDate: "2026-04-01", clothingCategory: "sleepwear", provisionStatus: "fully_met", childChoice: true, ageAppropriate: true, fitCorrect: true, culturallyAppropriate: true },
];

const DEMO_BUDGETS: ClothingBudgetRecord[] = [
  { id: "bud-1", childId: "child-alex", childName: "Alex", periodStart: "2026-01-01", periodEnd: "2026-03-31", budgetAllocated: 250, budgetSpent: 220, childInvolved: true, receiptsRecorded: true },
  { id: "bud-2", childId: "child-jordan", childName: "Jordan", periodStart: "2026-01-01", periodEnd: "2026-03-31", budgetAllocated: 250, budgetSpent: 195, childInvolved: true, receiptsRecorded: true },
  { id: "bud-3", childId: "child-morgan", childName: "Morgan", periodStart: "2026-01-01", periodEnd: "2026-03-31", budgetAllocated: 250, budgetSpent: 230, childInvolved: true, receiptsRecorded: true },
];

const DEMO_POLICIES: ClothingPolicy[] = [
  { id: "pol-1", individualClothingList: true, seasonalReviewScheduled: true, childChoiceRespected: true, culturalNeedsMet: true, labellingProtocol: true, laundryArrangements: true, budgetTransparency: true },
];

const DEMO_TRAINING: StaffClothingTraining[] = [
  { id: "tr-1", staffId: "staff-sarah", staffName: "Sarah Johnson", clothingStandards: true, childChoice: true, culturalAwareness: true, budgetManagement: true, ageAppropriateness: true, dignityAndPrivacy: true },
  { id: "tr-2", staffId: "staff-tom", staffName: "Tom Richards", clothingStandards: true, childChoice: true, culturalAwareness: true, budgetManagement: false, ageAppropriateness: true, dignityAndPrivacy: true },
  { id: "tr-3", staffId: "staff-lisa", staffName: "Lisa Williams", clothingStandards: true, childChoice: true, culturalAwareness: true, budgetManagement: true, ageAppropriateness: true, dignityAndPrivacy: true },
  { id: "tr-4", staffId: "staff-darren", staffName: "Darren Laville", clothingStandards: true, childChoice: true, culturalAwareness: true, budgetManagement: true, ageAppropriateness: true, dignityAndPrivacy: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateClothingAppearanceProvisionIntelligence(
    DEMO_PROVISIONS,
    DEMO_BUDGETS,
    DEMO_POLICIES,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        clothingCategoryLabels: Object.fromEntries(
          (["everyday", "school_uniform", "outdoor", "sleepwear", "underwear", "footwear", "special_occasion", "sports"] as const).map((c) => [c, getClothingCategoryLabel(c)]),
        ),
        provisionStatusLabels: Object.fromEntries(
          (["fully_met", "mostly_met", "partially_met", "not_met"] as const).map((s) => [s, getProvisionStatusLabel(s)]),
        ),
        seasonalReadinessLabels: Object.fromEntries(
          (["fully_ready", "mostly_ready", "not_ready"] as const).map((r) => [r, getSeasonalReadinessLabel(r)]),
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

  const { provisions, budgets, policies, training, homeId, periodStart, periodEnd } = body as {
    provisions?: ClothingProvisionRecord[];
    budgets?: ClothingBudgetRecord[];
    policies?: ClothingPolicy[];
    training?: StaffClothingTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateClothingAppearanceProvisionIntelligence(
    provisions ?? [],
    budgets ?? [],
    policies ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
