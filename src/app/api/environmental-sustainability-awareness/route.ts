import { NextResponse } from "next/server";
import {
  generateEnvironmentalSustainabilityAwarenessIntelligence,
  getActivityTypeLabel,
  getEngagementLevelLabel,
  getRatingLabel,
} from "@/lib/environmental-sustainability-awareness";
import type {
  EcoActivity,
  EnvironmentalPolicy,
  StaffEnvironmentalTraining,
} from "@/lib/environmental-sustainability-awareness";

const DEMO_ACTIVITIES: EcoActivity[] = [
  { id: "ea-1", childId: "child-alex", childName: "Alex", activityDate: "2026-03-01", activityType: "recycling_project", engagementLevel: "highly_engaged", knowledgeDemonstrated: true, initiativeTaken: true, habitsFormed: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "ea-2", childId: "child-alex", childName: "Alex", activityDate: "2026-03-15", activityType: "garden_maintenance", engagementLevel: "engaged", knowledgeDemonstrated: true, initiativeTaken: true, habitsFormed: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "ea-3", childId: "child-alex", childName: "Alex", activityDate: "2026-04-10", activityType: "energy_conservation", engagementLevel: "highly_engaged", knowledgeDemonstrated: true, initiativeTaken: true, habitsFormed: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "ea-4", childId: "child-jordan", childName: "Jordan", activityDate: "2026-03-05", activityType: "nature_walk", engagementLevel: "highly_engaged", knowledgeDemonstrated: true, initiativeTaken: true, habitsFormed: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "ea-5", childId: "child-jordan", childName: "Jordan", activityDate: "2026-03-20", activityType: "wildlife_care", engagementLevel: "engaged", knowledgeDemonstrated: true, initiativeTaken: true, habitsFormed: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "ea-6", childId: "child-jordan", childName: "Jordan", activityDate: "2026-04-15", activityType: "eco_workshop", engagementLevel: "highly_engaged", knowledgeDemonstrated: true, initiativeTaken: true, habitsFormed: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "ea-7", childId: "child-morgan", childName: "Morgan", activityDate: "2026-03-12", activityType: "sustainability_discussion", engagementLevel: "engaged", knowledgeDemonstrated: true, initiativeTaken: true, habitsFormed: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "ea-8", childId: "child-morgan", childName: "Morgan", activityDate: "2026-04-20", activityType: "community_cleanup", engagementLevel: "highly_engaged", knowledgeDemonstrated: true, initiativeTaken: true, habitsFormed: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
];

const DEMO_POLICY: EnvironmentalPolicy = {
  id: "ep-1", sustainabilityStrategy: true, recyclingProcedure: true, energyManagementPlan: true, gardenAndNaturePolicy: true, ecoEducationFramework: true, communityPartnership: true, regularReview: true,
};

const DEMO_TRAINING: StaffEnvironmentalTraining[] = [
  { id: "et-1", staffId: "staff-sarah", staffName: "Sarah Johnson", sustainabilityAwareness: true, ecoEducation: true, gardenManagement: true, energyConservation: true, wildlifeKnowledge: true, communityEngagement: true },
  { id: "et-2", staffId: "staff-tom", staffName: "Tom Richards", sustainabilityAwareness: true, ecoEducation: true, gardenManagement: true, energyConservation: true, wildlifeKnowledge: true, communityEngagement: true },
  { id: "et-3", staffId: "staff-lisa", staffName: "Lisa Williams", sustainabilityAwareness: true, ecoEducation: true, gardenManagement: true, energyConservation: true, wildlifeKnowledge: true, communityEngagement: true },
  { id: "et-4", staffId: "staff-darren", staffName: "Darren Laville", sustainabilityAwareness: true, ecoEducation: true, gardenManagement: true, energyConservation: true, wildlifeKnowledge: true, communityEngagement: true },
];

export async function GET() {
  const result = generateEnvironmentalSustainabilityAwarenessIntelligence(
    DEMO_ACTIVITIES, DEMO_POLICY, DEMO_TRAINING, "oak-house", "2026-01-01", "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        activityTypeLabels: Object.fromEntries(
          (["recycling_project", "garden_maintenance", "energy_conservation", "nature_walk", "wildlife_care", "eco_workshop", "sustainability_discussion", "community_cleanup"] as const).map((t) => [t, getActivityTypeLabel(t)]),
        ),
        engagementLevelLabels: Object.fromEntries(
          (["highly_engaged", "engaged", "moderate", "minimal", "disengaged"] as const).map((e) => [e, getEngagementLevelLabel(e)]),
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
    activities?: EcoActivity[]; policy?: EnvironmentalPolicy | null; training?: StaffEnvironmentalTraining[];
    homeId?: string; periodStart?: string; periodEnd?: string;
  };

  if (!periodStart || !periodEnd) return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });

  const result = generateEnvironmentalSustainabilityAwarenessIntelligence(
    activities ?? [], policy ?? null, training ?? [], homeId ?? "unknown", periodStart, periodEnd,
  );

  return NextResponse.json({ data: result });
}
