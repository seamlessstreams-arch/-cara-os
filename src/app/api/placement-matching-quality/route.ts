// ==============================================================================
// API: /api/placement-matching-quality
//
// Placement Matching Quality Intelligence
//
// GET  — Returns Chamberlain House demo data with full intelligence analysis
// POST — Accepts custom placement/review/stability/disruption data and returns analysis
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { generatePlacementMatchingQualityIntelligence } from "@/lib/placement-matching-quality";
import type {
  PlacementMatch,
  CompatibilityReview,
  PlacementStability,
  DisruptionRecord,
} from "@/lib/placement-matching-quality";

// -- Demo Data ----------------------------------------------------------------

function generateDemoData(): {
  placements: PlacementMatch[];
  reviews: CompatibilityReview[];
  stability: PlacementStability[];
  disruptions: DisruptionRecord[];
} {
  const placements: PlacementMatch[] = [
    {
      id: "pm-001",
      childId: "child-001",
      childName: "Alex",
      admissionDate: "2026-01-15",
      matchingOutcome: "excellent_match",
      impactAssessmentStatus: "completed_pre_admission",
      existingChildrenConsulted: "all_consulted",
      staffConsulted: true,
      referralInformationComplete: true,
      trialOvernight: true,
      criteriaAssessed: [
        "age_appropriateness",
        "gender_compatibility",
        "needs_compatibility",
        "risk_compatibility",
        "education_needs",
        "cultural_needs",
        "therapeutic_needs",
        "location_suitability",
        "sibling_placement",
        "peer_dynamics",
      ],
      criteriaMetCount: 9,
      riskAssessmentCompleted: true,
    },
    {
      id: "pm-002",
      childId: "child-002",
      childName: "Jordan",
      admissionDate: "2026-03-01",
      matchingOutcome: "good_match",
      impactAssessmentStatus: "completed_pre_admission",
      existingChildrenConsulted: "all_consulted",
      staffConsulted: true,
      referralInformationComplete: true,
      trialOvernight: false,
      criteriaAssessed: [
        "age_appropriateness",
        "gender_compatibility",
        "needs_compatibility",
        "risk_compatibility",
        "education_needs",
        "therapeutic_needs",
        "peer_dynamics",
      ],
      criteriaMetCount: 6,
      riskAssessmentCompleted: true,
    },
    {
      id: "pm-003",
      childId: "child-003",
      childName: "Morgan",
      admissionDate: "2025-09-10",
      matchingOutcome: "good_match",
      impactAssessmentStatus: "completed_pre_admission",
      existingChildrenConsulted: "all_consulted",
      staffConsulted: true,
      referralInformationComplete: true,
      trialOvernight: true,
      criteriaAssessed: [
        "age_appropriateness",
        "gender_compatibility",
        "needs_compatibility",
        "risk_compatibility",
        "education_needs",
        "cultural_needs",
        "therapeutic_needs",
        "location_suitability",
        "peer_dynamics",
      ],
      criteriaMetCount: 8,
      riskAssessmentCompleted: true,
    },
  ];

  const reviews: CompatibilityReview[] = [
    {
      id: "cr-001",
      reviewDate: "2026-03-05",
      reviewedBy: "Sarah Johnson",
      childId1: "child-001",
      childId2: "child-002",
      compatible: true,
      riskIdentified: false,
      managementPlanInPlace: false,
      positiveRelationship: true,
    },
    {
      id: "cr-002",
      reviewDate: "2026-03-05",
      reviewedBy: "Sarah Johnson",
      childId1: "child-001",
      childId2: "child-003",
      compatible: true,
      riskIdentified: false,
      managementPlanInPlace: false,
      positiveRelationship: true,
    },
    {
      id: "cr-003",
      reviewDate: "2026-03-10",
      reviewedBy: "Tom Richards",
      childId1: "child-002",
      childId2: "child-003",
      compatible: true,
      riskIdentified: true,
      managementPlanInPlace: true,
      positiveRelationship: true,
    },
  ];

  const stability: PlacementStability[] = [
    {
      id: "ps-001",
      childId: "child-001",
      childName: "Alex",
      assessmentDate: "2026-05-01",
      stabilityIndicator: "stable",
      daysInPlacement: 106,
      incidentCount: 1,
      missingCount: 0,
      schoolAttending: true,
      therapeuticEngaged: true,
      keyRelationshipEstablished: true,
    },
    {
      id: "ps-002",
      childId: "child-002",
      childName: "Jordan",
      assessmentDate: "2026-05-01",
      stabilityIndicator: "settling",
      daysInPlacement: 61,
      incidentCount: 3,
      missingCount: 0,
      schoolAttending: true,
      therapeuticEngaged: true,
      keyRelationshipEstablished: true,
    },
    {
      id: "ps-003",
      childId: "child-003",
      childName: "Morgan",
      assessmentDate: "2026-05-01",
      stabilityIndicator: "stable",
      daysInPlacement: 250,
      incidentCount: 0,
      missingCount: 0,
      schoolAttending: true,
      therapeuticEngaged: false,
      keyRelationshipEstablished: true,
    },
  ];

  const disruptions: DisruptionRecord[] = [];

  return { placements, reviews, stability, disruptions };
}

// -- Validation ---------------------------------------------------------------

function validatePostBody(body: unknown): {
  valid: boolean;
  error?: string;
  data?: {
    placements: PlacementMatch[];
    reviews: CompatibilityReview[];
    stability: PlacementStability[];
    disruptions: DisruptionRecord[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };
} {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  const b = body as Record<string, unknown>;

  if (!Array.isArray(b.placements)) {
    return { valid: false, error: "placements must be an array" };
  }

  if (!Array.isArray(b.reviews)) {
    return { valid: false, error: "reviews must be an array" };
  }

  if (!Array.isArray(b.stability)) {
    return { valid: false, error: "stability must be an array" };
  }

  if (!Array.isArray(b.disruptions)) {
    return { valid: false, error: "disruptions must be an array" };
  }

  return {
    valid: true,
    data: {
      placements: b.placements as PlacementMatch[],
      reviews: b.reviews as CompatibilityReview[],
      stability: b.stability as PlacementStability[],
      disruptions: b.disruptions as DisruptionRecord[],
      homeId: typeof b.homeId === "string" ? b.homeId : undefined,
      periodStart: typeof b.periodStart === "string" ? b.periodStart : undefined,
      periodEnd: typeof b.periodEnd === "string" ? b.periodEnd : undefined,
    },
  };
}

// -- GET ----------------------------------------------------------------------

export async function GET() {
  const { placements, reviews, stability, disruptions } = generateDemoData();

  const intelligence = generatePlacementMatchingQualityIntelligence(
    placements,
    reviews,
    stability,
    disruptions,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({ data: intelligence });
}

// -- POST ---------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validatePostBody(body);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 },
      );
    }

    const { placements, reviews, stability, disruptions, homeId, periodStart, periodEnd } =
      validation.data!;

    const now = new Date().toISOString().split("T")[0];
    const intelligence = generatePlacementMatchingQualityIntelligence(
      placements,
      reviews,
      stability,
      disruptions,
      homeId ?? "unknown",
      periodStart ?? now,
      periodEnd ?? now,
    );

    return NextResponse.json({ data: intelligence });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
