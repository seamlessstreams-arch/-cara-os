// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Spiritual Wellbeing Development API Route
//
// GET  → returns Chamberlain House demo spiritual wellbeing intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  generateSpiritualWellbeingDevelopmentIntelligence,
  getSpiritualActivityTypeLabels,
  getEngagementLevelLabels,
  getRatingLabels,
} from "@/lib/spiritual-wellbeing-development";
import type {
  SpiritualActivity,
  SpiritualWellbeingPolicy,
  StaffSpiritualWellbeingTraining,
} from "@/lib/spiritual-wellbeing-development";

// ── Chamberlain House Demo Data ─────────────────────────────────────────────────────

function getDemoData() {
  const activities: SpiritualActivity[] = [
    {
      id: "sa-01",
      childId: "child-alex",
      childName: "Alex",
      activityDate: "2026-02-14",
      activityType: "faith_practice",
      engagementLevel: "deeply_engaged",
      childChoiceMade: true,
      culturalNeedsConsidered: true,
      wellbeingBenefitNoted: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "sa-02",
      childId: "child-alex",
      childName: "Alex",
      activityDate: "2026-03-05",
      activityType: "meditation_mindfulness",
      engagementLevel: "engaged",
      childChoiceMade: true,
      culturalNeedsConsidered: true,
      wellbeingBenefitNoted: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "sa-03",
      childId: "child-jordan",
      childName: "Jordan",
      activityDate: "2026-02-20",
      activityType: "philosophical_discussion",
      engagementLevel: "deeply_engaged",
      childChoiceMade: true,
      culturalNeedsConsidered: true,
      wellbeingBenefitNoted: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "sa-04",
      childId: "child-jordan",
      childName: "Jordan",
      activityDate: "2026-03-15",
      activityType: "cultural_celebration",
      engagementLevel: "engaged",
      childChoiceMade: true,
      culturalNeedsConsidered: true,
      wellbeingBenefitNoted: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "sa-05",
      childId: "child-jordan",
      childName: "Jordan",
      activityDate: "2026-04-01",
      activityType: "community_worship",
      engagementLevel: "deeply_engaged",
      childChoiceMade: true,
      culturalNeedsConsidered: true,
      wellbeingBenefitNoted: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "sa-06",
      childId: "child-morgan",
      childName: "Morgan",
      activityDate: "2026-02-28",
      activityType: "values_exploration",
      engagementLevel: "engaged",
      childChoiceMade: true,
      culturalNeedsConsidered: true,
      wellbeingBenefitNoted: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "sa-07",
      childId: "child-morgan",
      childName: "Morgan",
      activityDate: "2026-03-20",
      activityType: "nature_reflection",
      engagementLevel: "deeply_engaged",
      childChoiceMade: true,
      culturalNeedsConsidered: true,
      wellbeingBenefitNoted: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "sa-08",
      childId: "child-morgan",
      childName: "Morgan",
      activityDate: "2026-04-10",
      activityType: "creative_spiritual_expression",
      engagementLevel: "engaged",
      childChoiceMade: true,
      culturalNeedsConsidered: true,
      wellbeingBenefitNoted: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
  ];

  const policy: SpiritualWellbeingPolicy = {
    id: "sp-01",
    spiritualDevelopmentStrategy: true,
    faithAndBeliefRespectPolicy: true,
    culturalCelebrationFramework: true,
    accessToWorshipPlaces: true,
    dietaryAndRitualAccommodation: true,
    staffGuidanceOnSpirituality: true,
    regularReview: true,
  };

  const training: StaffSpiritualWellbeingTraining[] = [
    {
      id: "st-01",
      staffId: "s-01",
      staffName: "Sarah Johnson",
      spiritualAwareness: true,
      culturalCompetency: true,
      faithDiversityKnowledge: true,
      childCentredSpiritualSupport: true,
      ethicalBoundaries: true,
      reflectivePractice: true,
    },
    {
      id: "st-02",
      staffId: "s-02",
      staffName: "Tom Richards",
      spiritualAwareness: true,
      culturalCompetency: true,
      faithDiversityKnowledge: true,
      childCentredSpiritualSupport: true,
      ethicalBoundaries: true,
      reflectivePractice: true,
    },
    {
      id: "st-03",
      staffId: "s-03",
      staffName: "Lisa Williams",
      spiritualAwareness: true,
      culturalCompetency: true,
      faithDiversityKnowledge: true,
      childCentredSpiritualSupport: true,
      ethicalBoundaries: true,
      reflectivePractice: true,
    },
    {
      id: "st-04",
      staffId: "s-04",
      staffName: "Darren Laville",
      spiritualAwareness: true,
      culturalCompetency: true,
      faithDiversityKnowledge: true,
      childCentredSpiritualSupport: true,
      ethicalBoundaries: true,
      reflectivePractice: true,
    },
  ];

  return { activities, policy, training };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { activities, policy, training } = getDemoData();
    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      activities,
      policy,
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-20",
    );

    return NextResponse.json({
      data: {
        ...result,
        meta: {
          spiritualActivityTypeLabels: getSpiritualActivityTypeLabels(),
          engagementLevelLabels: getEngagementLevelLabels(),
          ratingLabels: getRatingLabels(),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate spiritual wellbeing development intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { activities, policy, training, homeId, periodStart, periodEnd } = body;

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Missing required fields: periodStart, periodEnd" },
        { status: 400 },
      );
    }

    if (!Array.isArray(activities)) {
      return NextResponse.json(
        { error: "activities must be an array" },
        { status: 400 },
      );
    }

    if (!Array.isArray(training)) {
      return NextResponse.json(
        { error: "training must be an array" },
        { status: 400 },
      );
    }

    const result = generateSpiritualWellbeingDevelopmentIntelligence(
      activities as SpiritualActivity[],
      (policy as SpiritualWellbeingPolicy) || null,
      training as StaffSpiritualWellbeingTraining[],
      homeId || "unknown",
      periodStart,
      periodEnd,
    );

    return NextResponse.json({
      data: {
        ...result,
        meta: {
          spiritualActivityTypeLabels: getSpiritualActivityTypeLabels(),
          engagementLevelLabels: getEngagementLevelLabels(),
          ratingLabels: getRatingLabels(),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate spiritual wellbeing development intelligence", details: String(error) },
      { status: 500 },
    );
  }
}
