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
  getProvisionQualityLabel,
  getRatingLabel,
} from "@/lib/clothing-appearance-provision";
import type {
  ClothingAssessment,
  ClothingPolicy,
  StaffClothingTraining,
} from "@/lib/clothing-appearance-provision";

// -- Demo Data: Oak House -------------------------------------------------------

const DEMO_ASSESSMENTS: ClothingAssessment[] = [
  { id: "a-1", childId: "child-alex", childName: "Alex", assessmentDate: "2026-04-01", clothingCategory: "everyday_wear", provisionQuality: "excellent", childChoiceRespected: true, ageAppropriate: true, culturalNeedsMet: true, documentedInPlan: true, staffAssessed: true, feedbackGiven: true },
  { id: "a-2", childId: "child-alex", childName: "Alex", assessmentDate: "2026-04-01", clothingCategory: "school_uniform", provisionQuality: "excellent", childChoiceRespected: true, ageAppropriate: true, culturalNeedsMet: true, documentedInPlan: true, staffAssessed: true, feedbackGiven: true },
  { id: "a-3", childId: "child-alex", childName: "Alex", assessmentDate: "2026-04-01", clothingCategory: "seasonal_clothing", provisionQuality: "excellent", childChoiceRespected: true, ageAppropriate: true, culturalNeedsMet: true, documentedInPlan: true, staffAssessed: true, feedbackGiven: true },
  { id: "a-4", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-04-01", clothingCategory: "footwear", provisionQuality: "excellent", childChoiceRespected: true, ageAppropriate: true, culturalNeedsMet: true, documentedInPlan: true, staffAssessed: true, feedbackGiven: true },
  { id: "a-5", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-04-01", clothingCategory: "sleepwear", provisionQuality: "excellent", childChoiceRespected: true, ageAppropriate: true, culturalNeedsMet: true, documentedInPlan: true, staffAssessed: true, feedbackGiven: true },
  { id: "a-6", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-04-01", clothingCategory: "sportswear", provisionQuality: "excellent", childChoiceRespected: true, ageAppropriate: true, culturalNeedsMet: true, documentedInPlan: true, staffAssessed: true, feedbackGiven: true },
  { id: "a-7", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-04-01", clothingCategory: "formal_occasion", provisionQuality: "excellent", childChoiceRespected: true, ageAppropriate: true, culturalNeedsMet: true, documentedInPlan: true, staffAssessed: true, feedbackGiven: true },
  { id: "a-8", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-04-01", clothingCategory: "cultural_religious", provisionQuality: "excellent", childChoiceRespected: true, ageAppropriate: true, culturalNeedsMet: true, documentedInPlan: true, staffAssessed: true, feedbackGiven: true },
];

const DEMO_POLICIES: ClothingPolicy[] = [
  { id: "pol-1", clothingProvisionStrategy: true, clothingBudgetFramework: true, seasonalReviewProcedure: true, childChoiceGuidance: true, culturalAndReligiousAccommodation: true, laundryAndMaintenancePlan: true, regularReview: true },
];

const DEMO_TRAINING: StaffClothingTraining[] = [
  { id: "tr-1", staffId: "staff-sarah", staffName: "Sarah Johnson", clothingAssessment: true, childChoiceFacilitation: true, budgetManagement: true, culturalAwareness: true, ageAppropriateGuidance: true, recordKeeping: true },
  { id: "tr-2", staffId: "staff-tom", staffName: "Tom Richards", clothingAssessment: true, childChoiceFacilitation: true, budgetManagement: true, culturalAwareness: true, ageAppropriateGuidance: true, recordKeeping: true },
  { id: "tr-3", staffId: "staff-lisa", staffName: "Lisa Williams", clothingAssessment: true, childChoiceFacilitation: true, budgetManagement: true, culturalAwareness: true, ageAppropriateGuidance: true, recordKeeping: true },
  { id: "tr-4", staffId: "staff-darren", staffName: "Darren Laville", clothingAssessment: true, childChoiceFacilitation: true, budgetManagement: true, culturalAwareness: true, ageAppropriateGuidance: true, recordKeeping: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateClothingAppearanceProvisionIntelligence(
    DEMO_ASSESSMENTS,
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
          (["everyday_wear", "school_uniform", "seasonal_clothing", "footwear", "sleepwear", "sportswear", "formal_occasion", "cultural_religious"] as const).map((c) => [c, getClothingCategoryLabel(c)]),
        ),
        provisionQualityLabels: Object.fromEntries(
          (["excellent", "good", "adequate", "poor", "not_assessed"] as const).map((q) => [q, getProvisionQualityLabel(q)]),
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

  const { assessments, policies, training, homeId, periodStart, periodEnd } = body as {
    assessments?: ClothingAssessment[];
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
    assessments ?? [],
    policies ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
