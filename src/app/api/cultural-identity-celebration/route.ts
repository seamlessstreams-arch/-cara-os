// ==============================================================================
// API: /api/cultural-identity-celebration
//
// Cultural Identity Celebration Intelligence
//
// GET  — Returns assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateCulturalIdentityCelebrationIntelligence,
  getCulturalAreaLabel,
  getEngagementLevelLabel,
  getRatingLabel,
} from "@/lib/cultural-identity-celebration";
import type {
  CulturalActivity,
  CulturalPolicy,
  StaffCulturalTraining,
} from "@/lib/cultural-identity-celebration";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_ACTIVITIES: CulturalActivity[] = [
  { id: "act-1", childId: "child-alex", childName: "Alex", activityDate: "2026-02-10", culturalArea: "heritage_exploration", engagementLevel: "enthusiastic", childLedChoice: true, identityAffirmed: true, documentedInPlan: true, staffFacilitated: true, communityInvolved: true, reflectionCompleted: true },
  { id: "act-2", childId: "child-alex", childName: "Alex", activityDate: "2026-03-05", culturalArea: "food_traditions", engagementLevel: "enthusiastic", childLedChoice: true, identityAffirmed: true, documentedInPlan: true, staffFacilitated: true, communityInvolved: false, reflectionCompleted: true },
  { id: "act-3", childId: "child-alex", childName: "Alex", activityDate: "2026-04-12", culturalArea: "arts_expression", engagementLevel: "willing", childLedChoice: true, identityAffirmed: true, documentedInPlan: true, staffFacilitated: true, communityInvolved: true, reflectionCompleted: true },
  { id: "act-4", childId: "child-jordan", childName: "Jordan", activityDate: "2026-02-18", culturalArea: "language_support", engagementLevel: "enthusiastic", childLedChoice: true, identityAffirmed: true, documentedInPlan: true, staffFacilitated: true, communityInvolved: true, reflectionCompleted: true },
  { id: "act-5", childId: "child-jordan", childName: "Jordan", activityDate: "2026-03-22", culturalArea: "religious_observance", engagementLevel: "willing", childLedChoice: true, identityAffirmed: true, documentedInPlan: true, staffFacilitated: true, communityInvolved: true, reflectionCompleted: false },
  { id: "act-6", childId: "child-jordan", childName: "Jordan", activityDate: "2026-04-30", culturalArea: "cultural_events", engagementLevel: "enthusiastic", childLedChoice: true, identityAffirmed: true, documentedInPlan: true, staffFacilitated: true, communityInvolved: true, reflectionCompleted: true },
  { id: "act-7", childId: "child-morgan", childName: "Morgan", activityDate: "2026-01-20", culturalArea: "identity_work", engagementLevel: "enthusiastic", childLedChoice: true, identityAffirmed: true, documentedInPlan: true, staffFacilitated: true, communityInvolved: false, reflectionCompleted: true },
  { id: "act-8", childId: "child-morgan", childName: "Morgan", activityDate: "2026-03-15", culturalArea: "community_connections", engagementLevel: "willing", childLedChoice: true, identityAffirmed: true, documentedInPlan: true, staffFacilitated: true, communityInvolved: true, reflectionCompleted: true },
];

const DEMO_POLICY: CulturalPolicy = {
  id: "pol-1",
  culturalIdentityPolicy: true,
  diversityCelebration: true,
  religiousObservanceSupport: true,
  languageSupportProvision: true,
  foodTraditionsRespected: true,
  communityPartnership: true,
  regularReview: true,
};

const DEMO_TRAINING: StaffCulturalTraining[] = [
  { id: "tr-1", staffId: "staff-sarah", staffName: "Sarah Johnson", culturalCompetence: true, diversityAwareness: true, religiousLiteracy: true, antiRacismPractice: true, identitySupport: true, communityEngagement: true },
  { id: "tr-2", staffId: "staff-tom", staffName: "Tom Richards", culturalCompetence: true, diversityAwareness: true, religiousLiteracy: true, antiRacismPractice: false, identitySupport: true, communityEngagement: true },
  { id: "tr-3", staffId: "staff-lisa", staffName: "Lisa Williams", culturalCompetence: true, diversityAwareness: true, religiousLiteracy: true, antiRacismPractice: true, identitySupport: true, communityEngagement: true },
  { id: "tr-4", staffId: "staff-darren", staffName: "Darren Laville", culturalCompetence: true, diversityAwareness: true, religiousLiteracy: true, antiRacismPractice: true, identitySupport: true, communityEngagement: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateCulturalIdentityCelebrationIntelligence(
    DEMO_ACTIVITIES,
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
        culturalAreaLabels: Object.fromEntries(
          (["heritage_exploration", "language_support", "food_traditions", "religious_observance", "cultural_events", "identity_work", "community_connections", "arts_expression"] as const).map((a) => [a, getCulturalAreaLabel(a)]),
        ),
        engagementLevelLabels: Object.fromEntries(
          (["enthusiastic", "willing", "neutral", "reluctant", "refused"] as const).map((e) => [e, getEngagementLevelLabel(e)]),
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

  const { activities, policy, training, homeId, periodStart, periodEnd } = body as {
    activities?: CulturalActivity[];
    policy?: CulturalPolicy | null;
    training?: StaffCulturalTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateCulturalIdentityCelebrationIntelligence(
    activities ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
