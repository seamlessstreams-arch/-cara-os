import { NextResponse } from "next/server";
import {
  generateCommunityEngagementParticipationIntelligence,
  getActivityTypeLabel,
  getParticipationLevelLabel,
  getRatingLabel,
} from "@/lib/community-engagement-participation";
import type {
  CommunityActivity,
  CommunityPolicy,
  StaffCommunityTraining,
} from "@/lib/community-engagement-participation";

const DEMO_ACTIVITIES: CommunityActivity[] = [
  { id: "ca-1", childId: "child-alex", childName: "Alex", activityDate: "2026-04-01", activityType: "sports_club", participationLevel: "highly_engaged", childInitiated: true, socialSkillsDeveloped: true, communityLinksStrengthened: true, documentedInPlan: true, staffSupported: true, feedbackObtained: true },
  { id: "ca-2", childId: "child-alex", childName: "Alex", activityDate: "2026-04-08", activityType: "youth_group", participationLevel: "regular_participant", childInitiated: true, socialSkillsDeveloped: true, communityLinksStrengthened: true, documentedInPlan: true, staffSupported: true, feedbackObtained: true },
  { id: "ca-3", childId: "child-alex", childName: "Alex", activityDate: "2026-04-15", activityType: "volunteering", participationLevel: "highly_engaged", childInitiated: true, socialSkillsDeveloped: true, communityLinksStrengthened: true, documentedInPlan: true, staffSupported: true, feedbackObtained: true },
  { id: "ca-4", childId: "child-jordan", childName: "Jordan", activityDate: "2026-04-01", activityType: "cultural_event", participationLevel: "highly_engaged", childInitiated: true, socialSkillsDeveloped: true, communityLinksStrengthened: true, documentedInPlan: true, staffSupported: true, feedbackObtained: true },
  { id: "ca-5", childId: "child-jordan", childName: "Jordan", activityDate: "2026-04-08", activityType: "religious_group", participationLevel: "regular_participant", childInitiated: true, socialSkillsDeveloped: true, communityLinksStrengthened: true, documentedInPlan: true, staffSupported: true, feedbackObtained: true },
  { id: "ca-6", childId: "child-jordan", childName: "Jordan", activityDate: "2026-04-15", activityType: "hobby_class", participationLevel: "highly_engaged", childInitiated: true, socialSkillsDeveloped: true, communityLinksStrengthened: true, documentedInPlan: true, staffSupported: true, feedbackObtained: true },
  { id: "ca-7", childId: "child-morgan", childName: "Morgan", activityDate: "2026-04-01", activityType: "community_project", participationLevel: "highly_engaged", childInitiated: true, socialSkillsDeveloped: true, communityLinksStrengthened: true, documentedInPlan: true, staffSupported: true, feedbackObtained: true },
  { id: "ca-8", childId: "child-morgan", childName: "Morgan", activityDate: "2026-04-08", activityType: "social_outing", participationLevel: "regular_participant", childInitiated: true, socialSkillsDeveloped: true, communityLinksStrengthened: true, documentedInPlan: true, staffSupported: true, feedbackObtained: true },
];

const DEMO_POLICY: CommunityPolicy = {
  id: "cp-1",
  communityEngagementStrategy: true,
  socialInclusionFramework: true,
  activityAccessPolicy: true,
  safeguardingInCommunity: true,
  transportArrangements: true,
  partnershipAgreements: true,
  regularReview: true,
};

const DEMO_TRAINING: StaffCommunityTraining[] = [
  { id: "ct-1", staffId: "staff-sarah", staffName: "Sarah Johnson", communityEngagement: true, socialInclusion: true, safeguardingInCommunity: true, activityPlanning: true, partnershipWorking: true, documentationSkills: true },
  { id: "ct-2", staffId: "staff-tom", staffName: "Tom Richards", communityEngagement: true, socialInclusion: true, safeguardingInCommunity: true, activityPlanning: true, partnershipWorking: true, documentationSkills: true },
  { id: "ct-3", staffId: "staff-lisa", staffName: "Lisa Williams", communityEngagement: true, socialInclusion: true, safeguardingInCommunity: true, activityPlanning: true, partnershipWorking: true, documentationSkills: true },
  { id: "ct-4", staffId: "staff-darren", staffName: "Darren Laville", communityEngagement: true, socialInclusion: true, safeguardingInCommunity: true, activityPlanning: true, partnershipWorking: true, documentationSkills: true },
];

export async function GET() {
  const result = generateCommunityEngagementParticipationIntelligence(
    DEMO_ACTIVITIES, DEMO_POLICY, DEMO_TRAINING, "oak-house", "2026-01-01", "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        activityTypeLabels: Object.fromEntries(
          (["sports_club", "youth_group", "volunteering", "cultural_event", "religious_group", "hobby_class", "community_project", "social_outing"] as const).map((t) => [t, getActivityTypeLabel(t)]),
        ),
        participationLevelLabels: Object.fromEntries(
          (["highly_engaged", "regular_participant", "occasional", "reluctant", "non_participant"] as const).map((p) => [p, getParticipationLevelLabel(p)]),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map((r) => [r, getRatingLabel(r)]),
        ),
      },
    },
  });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { activities, policy, training, homeId, periodStart, periodEnd } = body as {
    activities?: CommunityActivity[]; policy?: CommunityPolicy | null; training?: StaffCommunityTraining[];
    homeId?: string; periodStart?: string; periodEnd?: string;
  };

  if (!periodStart || !periodEnd) return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });

  const result = generateCommunityEngagementParticipationIntelligence(
    activities ?? [], policy ?? null, training ?? [], homeId ?? "unknown", periodStart, periodEnd,
  );

  return NextResponse.json({ data: result });
}
