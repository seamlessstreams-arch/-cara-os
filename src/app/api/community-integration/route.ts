// ==============================================================================
// API: /api/community-integration
//
// Community Integration Intelligence
//
// GET  — Returns community integration assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateCommunityIntegrationIntelligence,
  getActivityCategoryLabel,
  getParticipationLevelLabel,
  getFriendshipQualityLabel,
  getCommunityBarrierLabel,
  getSocialMediaSafetyLabel,
} from "@/lib/community-integration";
import type {
  CommunityActivity,
  SocialNetwork,
  CommunityBarrierRecord,
  InclusionAssessment,
} from "@/lib/community-integration";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_ACTIVITIES: CommunityActivity[] = [
  { id: "ca-a1", childId: "child-alex", childName: "Alex", activityCategory: "sport", activityName: "Oakwood Football Club", participationLevel: "regular", frequency: "weekly", startDate: "2025-09-01", childEnjoys: true, staffSupported: false, independentAttendance: true, communityBased: true },
  { id: "ca-a2", childId: "child-alex", childName: "Alex", activityCategory: "youth_group", activityName: "Friday Youth Club", participationLevel: "regular", frequency: "weekly", startDate: "2025-11-01", childEnjoys: true, staffSupported: true, independentAttendance: false, communityBased: true },
  { id: "ca-a3", childId: "child-alex", childName: "Alex", activityCategory: "arts_culture", activityName: "Art Workshop", participationLevel: "occasional", frequency: "monthly", startDate: "2026-01-15", childEnjoys: true, staffSupported: true, independentAttendance: false, communityBased: true },
  { id: "ca-j1", childId: "child-jordan", childName: "Jordan", activityCategory: "social_club", activityName: "Gaming Club", participationLevel: "regular", frequency: "weekly", startDate: "2026-02-01", childEnjoys: true, staffSupported: true, independentAttendance: false, communityBased: false },
  { id: "ca-j2", childId: "child-jordan", childName: "Jordan", activityCategory: "sport", activityName: "Swimming", participationLevel: "tried_once", frequency: "ad_hoc", startDate: "2026-03-10", childEnjoys: false, staffSupported: true, independentAttendance: false, communityBased: true },
  { id: "ca-m1", childId: "child-morgan", childName: "Morgan", activityCategory: "arts_culture", activityName: "Drama Club", participationLevel: "regular", frequency: "weekly", startDate: "2025-10-01", childEnjoys: true, staffSupported: false, independentAttendance: true, communityBased: true },
  { id: "ca-m2", childId: "child-morgan", childName: "Morgan", activityCategory: "volunteering", activityName: "Charity Shop", participationLevel: "regular", frequency: "weekly", startDate: "2026-03-01", childEnjoys: true, staffSupported: true, independentAttendance: true, communityBased: true },
  { id: "ca-m3", childId: "child-morgan", childName: "Morgan", activityCategory: "music", activityName: "Guitar Lessons", participationLevel: "regular", frequency: "weekly", startDate: "2026-01-10", childEnjoys: true, staffSupported: false, independentAttendance: true, communityBased: true },
];

const DEMO_NETWORKS: SocialNetwork[] = [
  { id: "sn-a", childId: "child-alex", childName: "Alex", friendshipQuality: "developing", numberOfFriends: 4, friendsOutsideCare: true, socialMediaSafety: "safe_and_supported", communityMentor: false, regularSocialActivities: 2 },
  { id: "sn-j", childId: "child-jordan", childName: "Jordan", friendshipQuality: "limited", numberOfFriends: 1, friendsOutsideCare: false, socialMediaSafety: "some_concerns", communityMentor: false, regularSocialActivities: 1 },
  { id: "sn-m", childId: "child-morgan", childName: "Morgan", friendshipQuality: "strong", numberOfFriends: 6, friendsOutsideCare: true, socialMediaSafety: "safe_and_supported", communityMentor: true, regularSocialActivities: 3 },
];

const DEMO_BARRIERS: CommunityBarrierRecord[] = [
  { id: "br-j1", childId: "child-jordan", childName: "Jordan", barrier: "transport", barrierDescription: "Limited public transport to community activities", actionTaken: true, resolved: false },
  { id: "br-j2", childId: "child-jordan", childName: "Jordan", barrier: "behaviour", barrierDescription: "Anxiety about new social situations", actionTaken: true, resolved: false },
];

const DEMO_ASSESSMENTS: InclusionAssessment[] = [
  { id: "ia-a", childId: "child-alex", childName: "Alex", feelsPartOfCommunity: true, accessToLocalAmenities: true, positiveLocalRelationships: true, stigmaExperienced: false, independentTravelSkills: true, assessedDate: "2026-04-15", assessedBy: "Sarah Johnson" },
  { id: "ia-j", childId: "child-jordan", childName: "Jordan", feelsPartOfCommunity: false, accessToLocalAmenities: true, positiveLocalRelationships: false, stigmaExperienced: true, independentTravelSkills: false, assessedDate: "2026-04-15", assessedBy: "Tom Richards" },
  { id: "ia-m", childId: "child-morgan", childName: "Morgan", feelsPartOfCommunity: true, accessToLocalAmenities: true, positiveLocalRelationships: true, stigmaExperienced: false, independentTravelSkills: true, assessedDate: "2026-04-15", assessedBy: "Lisa Williams" },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateCommunityIntegrationIntelligence(
    DEMO_ACTIVITIES,
    DEMO_NETWORKS,
    DEMO_BARRIERS,
    DEMO_ASSESSMENTS,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        activityCategoryLabels: Object.fromEntries(
          (["sport", "arts_culture", "music", "faith", "volunteering", "youth_group", "social_club", "employment", "training", "community_event"] as const).map(
            (c) => [c, getActivityCategoryLabel(c)],
          ),
        ),
        participationLevelLabels: Object.fromEntries(
          (["regular", "occasional", "tried_once", "refused", "not_offered"] as const).map(
            (p) => [p, getParticipationLevelLabel(p)],
          ),
        ),
        friendshipQualityLabels: Object.fromEntries(
          (["strong", "developing", "limited", "isolated", "not_assessed"] as const).map(
            (q) => [q, getFriendshipQualityLabel(q)],
          ),
        ),
        communityBarrierLabels: Object.fromEntries(
          (["transport", "cost", "stigma", "behaviour", "risk_assessment", "staffing", "location", "none"] as const).map(
            (b) => [b, getCommunityBarrierLabel(b)],
          ),
        ),
        socialMediaSafetyLabels: Object.fromEntries(
          (["safe_and_supported", "some_concerns", "significant_risk", "not_applicable"] as const).map(
            (s) => [s, getSocialMediaSafetyLabel(s)],
          ),
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

  const { activities, networks, barriers, assessments, homeId, periodStart, periodEnd } = body as {
    activities?: CommunityActivity[];
    networks?: SocialNetwork[];
    barriers?: CommunityBarrierRecord[];
    assessments?: InclusionAssessment[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateCommunityIntegrationIntelligence(
    activities ?? [],
    networks ?? [],
    barriers ?? [],
    assessments ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
