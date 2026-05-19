// ==============================================================================
// Cornerstone — Cultural Identity Support Intelligence API Route
//
// GET  -> returns Oak House demo intelligence (Alex, Jordan, Morgan)
// POST -> accepts custom data for any home
// ==============================================================================

import { NextResponse } from "next/server";
import { generateCulturalIdentitySupportIntelligence } from "@/lib/cultural-identity-support/cultural-identity-support-engine";
import type {
  CulturalNeedsAssessment,
  CulturalActivity,
  IdentityPlan,
  StaffCulturalTraining,
} from "@/lib/cultural-identity-support/cultural-identity-support-engine";

// -- Oak House Demo Data ------------------------------------------------------

function getDemoData(): {
  assessments: CulturalNeedsAssessment[];
  activities: CulturalActivity[];
  plans: IdentityPlan[];
  training: StaffCulturalTraining[];
  totalChildren: number;
} {
  const assessments: CulturalNeedsAssessment[] = [
    // Alex — White British, Church of England
    {
      id: "cna-alex-01", childId: "child-alex", childName: "Alex",
      needType: "religion", description: "CofE — wishes to attend Sunday services",
      supportStatus: "fully_met", assessmentDate: "2026-02-01", reviewDate: "2026-05-01",
      reviewCurrent: true, childConsulted: true, familyConsulted: true,
    },
    {
      id: "cna-alex-02", childId: "child-alex", childName: "Alex",
      needType: "heritage", description: "Local heritage exploration and family history",
      supportStatus: "fully_met", assessmentDate: "2026-02-01", reviewDate: "2026-05-01",
      reviewCurrent: true, childConsulted: true, familyConsulted: true,
    },
    {
      id: "cna-alex-03", childId: "child-alex", childName: "Alex",
      needType: "festivals", description: "Christmas, Easter, Harvest celebrations",
      supportStatus: "fully_met", assessmentDate: "2026-02-01", reviewDate: "2026-05-01",
      reviewCurrent: true, childConsulted: true, familyConsulted: false,
    },

    // Jordan — Black Caribbean, Rastafarian
    {
      id: "cna-jordan-01", childId: "child-jordan", childName: "Jordan",
      needType: "religion", description: "Rastafarian faith — livity, meditation, spiritual practice",
      supportStatus: "partially_met", assessmentDate: "2026-02-15", reviewDate: "2026-05-01",
      reviewCurrent: true, childConsulted: true, familyConsulted: true,
    },
    {
      id: "cna-jordan-02", childId: "child-jordan", childName: "Jordan",
      needType: "diet", description: "Ital food — natural, unprocessed, plant-based Rastafarian diet",
      supportStatus: "partially_met", assessmentDate: "2026-02-15", reviewDate: "2026-05-01",
      reviewCurrent: true, childConsulted: true, familyConsulted: true,
    },
    {
      id: "cna-jordan-03", childId: "child-jordan", childName: "Jordan",
      needType: "hair_care", description: "Afro-Caribbean hair care products and styling",
      supportStatus: "fully_met", assessmentDate: "2026-02-15", reviewDate: "2026-05-01",
      reviewCurrent: true, childConsulted: true, familyConsulted: false,
    },
    {
      id: "cna-jordan-04", childId: "child-jordan", childName: "Jordan",
      needType: "language", description: "Jamaican Patois — maintain connection to heritage language",
      supportStatus: "partially_met", assessmentDate: "2026-02-15", reviewDate: "2026-04-01",
      reviewCurrent: false, childConsulted: true, familyConsulted: true,
    },
    {
      id: "cna-jordan-05", childId: "child-jordan", childName: "Jordan",
      needType: "music", description: "Reggae and roots music — cultural connection and expression",
      supportStatus: "fully_met", assessmentDate: "2026-02-15", reviewDate: "2026-05-01",
      reviewCurrent: true, childConsulted: true, familyConsulted: false,
    },
    {
      id: "cna-jordan-06", childId: "child-jordan", childName: "Jordan",
      needType: "community_links", description: "Connection to Black Caribbean community centre and role models",
      supportStatus: "fully_met", assessmentDate: "2026-02-15", reviewDate: "2026-05-01",
      reviewCurrent: true, childConsulted: true, familyConsulted: true,
    },

    // Morgan — Mixed heritage White/Asian, Buddhist
    {
      id: "cna-morgan-01", childId: "child-morgan", childName: "Morgan",
      needType: "religion", description: "Buddhist practice — meditation and mindfulness",
      supportStatus: "fully_met", assessmentDate: "2026-03-01", reviewDate: "2026-05-01",
      reviewCurrent: true, childConsulted: true, familyConsulted: true,
    },
    {
      id: "cna-morgan-02", childId: "child-morgan", childName: "Morgan",
      needType: "diet", description: "Vegetarian — Buddhist practice",
      supportStatus: "fully_met", assessmentDate: "2026-03-01", reviewDate: "2026-05-01",
      reviewCurrent: true, childConsulted: true, familyConsulted: true,
    },
    {
      id: "cna-morgan-03", childId: "child-morgan", childName: "Morgan",
      needType: "heritage", description: "Dual heritage — White and Asian cultural exploration",
      supportStatus: "fully_met", assessmentDate: "2026-03-01", reviewDate: "2026-05-01",
      reviewCurrent: true, childConsulted: true, familyConsulted: true,
    },
    {
      id: "cna-morgan-04", childId: "child-morgan", childName: "Morgan",
      needType: "festivals", description: "Lunar New Year, Vesak, Diwali celebrations",
      supportStatus: "fully_met", assessmentDate: "2026-03-01", reviewDate: "2026-05-01",
      reviewCurrent: true, childConsulted: true, familyConsulted: true,
    },
  ];

  const activities: CulturalActivity[] = [
    // Alex
    {
      id: "ca-alex-01", date: "2026-02-10",
      activityType: "religious_observance",
      description: "Sunday church service at local CofE parish",
      facilitatedBy: "Sarah Thompson",
      childrenParticipated: ["child-alex"],
      engagement: "high", resourcesProvided: true, childFeedbackPositive: true,
    },
    {
      id: "ca-alex-02", date: "2026-03-05",
      activityType: "heritage_activity",
      description: "Local history museum visit — family tree project",
      facilitatedBy: "Sarah Thompson",
      childrenParticipated: ["child-alex", "child-morgan"],
      engagement: "high", resourcesProvided: true, childFeedbackPositive: true,
    },

    // Jordan
    {
      id: "ca-jordan-01", date: "2026-02-20",
      activityType: "cultural_celebration",
      description: "Caribbean carnival preparation and community event",
      facilitatedBy: "Lisa Chen",
      childrenParticipated: ["child-jordan", "child-alex", "child-morgan"],
      engagement: "high", resourcesProvided: true, childFeedbackPositive: true,
    },
    {
      id: "ca-jordan-02", date: "2026-03-01",
      activityType: "community_visit",
      description: "Visit to local Black Caribbean community centre",
      facilitatedBy: "Lisa Chen",
      childrenParticipated: ["child-jordan"],
      engagement: "high", resourcesProvided: true, childFeedbackPositive: true,
    },
    {
      id: "ca-jordan-03", date: "2026-03-20",
      activityType: "language_support",
      description: "Patois language session with community elder",
      facilitatedBy: "Lisa Chen",
      childrenParticipated: ["child-jordan"],
      engagement: "medium", resourcesProvided: true, childFeedbackPositive: true,
    },
    {
      id: "ca-jordan-04", date: "2026-04-05",
      activityType: "mentoring",
      description: "Mentoring session with Black Caribbean role model",
      facilitatedBy: "Community Volunteer",
      childrenParticipated: ["child-jordan"],
      engagement: "high", resourcesProvided: false, childFeedbackPositive: true,
    },

    // Morgan
    {
      id: "ca-morgan-01", date: "2026-02-15",
      activityType: "religious_observance",
      description: "Buddhist temple meditation session",
      facilitatedBy: "Lisa Chen",
      childrenParticipated: ["child-morgan"],
      engagement: "high", resourcesProvided: true, childFeedbackPositive: true,
    },
    {
      id: "ca-morgan-02", date: "2026-02-28",
      activityType: "cultural_celebration",
      description: "Lunar New Year celebration with Asian community group",
      facilitatedBy: "Lisa Chen",
      childrenParticipated: ["child-morgan", "child-alex"],
      engagement: "high", resourcesProvided: true, childFeedbackPositive: true,
    },
    {
      id: "ca-morgan-03", date: "2026-03-25",
      activityType: "identity_workshop",
      description: "Dual heritage identity work session with key worker",
      facilitatedBy: "Sarah Thompson",
      childrenParticipated: ["child-morgan"],
      engagement: "medium", resourcesProvided: true, childFeedbackPositive: true,
    },
  ];

  const plans: IdentityPlan[] = [
    {
      id: "ip-alex-01", childId: "child-alex", childName: "Alex",
      planInPlace: true, lastReviewDate: "2026-04-01",
      identityNeedsDocumented: true, lifeStoryWorkActive: true,
      culturalMentorAssigned: false, communityLinksEstablished: true,
    },
    {
      id: "ip-jordan-01", childId: "child-jordan", childName: "Jordan",
      planInPlace: true, lastReviewDate: "2026-04-15",
      identityNeedsDocumented: true, lifeStoryWorkActive: true,
      culturalMentorAssigned: true, communityLinksEstablished: true,
    },
    {
      id: "ip-morgan-01", childId: "child-morgan", childName: "Morgan",
      planInPlace: true, lastReviewDate: "2026-04-10",
      identityNeedsDocumented: true, lifeStoryWorkActive: true,
      culturalMentorAssigned: true, communityLinksEstablished: true,
    },
  ];

  const training: StaffCulturalTraining[] = [
    {
      id: "sct-sarah-01", staffId: "staff-sarah", staffName: "Sarah Thompson",
      culturalAwareness: true, antiRacism: true, religiousLiteracy: true,
      identitySupport: true, lgbtqAwareness: true, communicationDiversity: false,
    },
    {
      id: "sct-tom-01", staffId: "staff-tom", staffName: "Tom Williams",
      culturalAwareness: true, antiRacism: true, religiousLiteracy: false,
      identitySupport: false, lgbtqAwareness: false, communicationDiversity: false,
    },
    {
      id: "sct-lisa-01", staffId: "staff-lisa", staffName: "Lisa Chen",
      culturalAwareness: true, antiRacism: true, religiousLiteracy: true,
      identitySupport: true, lgbtqAwareness: true, communicationDiversity: true,
    },
  ];

  return { assessments, activities, plans, training, totalChildren: 3 };
}

// -- GET Handler --------------------------------------------------------------

export async function GET() {
  try {
    const { assessments, activities, plans, training, totalChildren } = getDemoData();
    const result = generateCulturalIdentitySupportIntelligence(
      assessments,
      activities,
      plans,
      training,
      totalChildren,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate cultural identity support intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// -- POST Handler -------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      assessments, activities, plans, training,
      totalChildren, homeId, periodStart, periodEnd,
    } = body;

    if (
      !assessments || !activities || !plans || !training ||
      totalChildren === undefined || !homeId || !periodStart || !periodEnd
    ) {
      return NextResponse.json(
        { error: "Missing required fields: assessments, activities, plans, training, totalChildren, homeId, periodStart, periodEnd" },
        { status: 400 },
      );
    }

    if (
      !Array.isArray(assessments) || !Array.isArray(activities) ||
      !Array.isArray(plans) || !Array.isArray(training)
    ) {
      return NextResponse.json(
        { error: "assessments, activities, plans, and training must be arrays" },
        { status: 400 },
      );
    }

    if (typeof totalChildren !== "number" || totalChildren < 0) {
      return NextResponse.json(
        { error: "totalChildren must be a non-negative number" },
        { status: 400 },
      );
    }

    const result = generateCulturalIdentitySupportIntelligence(
      assessments, activities, plans, training,
      totalChildren, homeId, periodStart, periodEnd,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process cultural identity support data", details: String(error) },
      { status: 500 },
    );
  }
}
