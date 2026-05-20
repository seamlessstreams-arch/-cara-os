import { NextResponse } from "next/server";
import {
  generatePeerRelationshipQualityIntelligence,
  getInteractionTypeLabel,
  getRelationshipQualityLabel,
  getRatingLabel,
} from "@/lib/peer-relationship-quality";
import type {
  PeerInteraction,
  PeerRelationshipPolicy,
  StaffPeerSupportTraining,
} from "@/lib/peer-relationship-quality";

const DEMO_INTERACTIONS: PeerInteraction[] = [
  { id: "pi-1", childId: "child-alex", childName: "Alex", interactionDate: "2026-03-01", interactionType: "shared_activity", relationshipQuality: "thriving", positiveEngagement: true, conflictResolvedConstructively: true, socialSkillsDemonstrated: true, documentedInPlan: true, staffFacilitated: true, feedbackGiven: true },
  { id: "pi-2", childId: "child-alex", childName: "Alex", interactionDate: "2026-03-10", interactionType: "team_sport", relationshipQuality: "positive", positiveEngagement: true, conflictResolvedConstructively: true, socialSkillsDemonstrated: true, documentedInPlan: true, staffFacilitated: true, feedbackGiven: true },
  { id: "pi-3", childId: "child-alex", childName: "Alex", interactionDate: "2026-04-05", interactionType: "creative_collaboration", relationshipQuality: "thriving", positiveEngagement: true, conflictResolvedConstructively: true, socialSkillsDemonstrated: true, documentedInPlan: true, staffFacilitated: true, feedbackGiven: true },
  { id: "pi-4", childId: "child-jordan", childName: "Jordan", interactionDate: "2026-03-05", interactionType: "conflict_resolution", relationshipQuality: "positive", positiveEngagement: true, conflictResolvedConstructively: true, socialSkillsDemonstrated: true, documentedInPlan: true, staffFacilitated: true, feedbackGiven: true },
  { id: "pi-5", childId: "child-jordan", childName: "Jordan", interactionDate: "2026-03-20", interactionType: "cooperative_play", relationshipQuality: "thriving", positiveEngagement: true, conflictResolvedConstructively: true, socialSkillsDemonstrated: true, documentedInPlan: true, staffFacilitated: true, feedbackGiven: true },
  { id: "pi-6", childId: "child-jordan", childName: "Jordan", interactionDate: "2026-04-15", interactionType: "peer_mentoring", relationshipQuality: "positive", positiveEngagement: true, conflictResolvedConstructively: true, socialSkillsDemonstrated: true, documentedInPlan: true, staffFacilitated: true, feedbackGiven: true },
  { id: "pi-7", childId: "child-morgan", childName: "Morgan", interactionDate: "2026-03-12", interactionType: "group_project", relationshipQuality: "thriving", positiveEngagement: true, conflictResolvedConstructively: true, socialSkillsDemonstrated: true, documentedInPlan: true, staffFacilitated: true, feedbackGiven: true },
  { id: "pi-8", childId: "child-morgan", childName: "Morgan", interactionDate: "2026-04-20", interactionType: "social_event", relationshipQuality: "positive", positiveEngagement: true, conflictResolvedConstructively: true, socialSkillsDemonstrated: true, documentedInPlan: true, staffFacilitated: true, feedbackGiven: true },
];

const DEMO_POLICY: PeerRelationshipPolicy = {
  id: "prp-1",
  positiveRelationshipsStrategy: true,
  antibullyingPolicy: true,
  conflictResolutionFramework: true,
  socialSkillsProgramme: true,
  peerMentoringScheme: true,
  inclusionStrategy: true,
  regularReview: true,
};

const DEMO_TRAINING: StaffPeerSupportTraining[] = [
  { id: "pst-1", staffId: "staff-sarah", staffName: "Sarah Johnson", relationshipBuilding: true, conflictMediation: true, antibullyingAwareness: true, socialSkillsFacilitation: true, therapeuticGroupWork: true, restorativePractice: true },
  { id: "pst-2", staffId: "staff-tom", staffName: "Tom Richards", relationshipBuilding: true, conflictMediation: true, antibullyingAwareness: true, socialSkillsFacilitation: true, therapeuticGroupWork: true, restorativePractice: true },
  { id: "pst-3", staffId: "staff-lisa", staffName: "Lisa Williams", relationshipBuilding: true, conflictMediation: true, antibullyingAwareness: true, socialSkillsFacilitation: true, therapeuticGroupWork: true, restorativePractice: true },
  { id: "pst-4", staffId: "staff-darren", staffName: "Darren Laville", relationshipBuilding: true, conflictMediation: true, antibullyingAwareness: true, socialSkillsFacilitation: true, therapeuticGroupWork: true, restorativePractice: true },
];

export async function GET() {
  const result = generatePeerRelationshipQualityIntelligence(
    DEMO_INTERACTIONS, DEMO_POLICY, DEMO_TRAINING, "oak-house", "2026-01-01", "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        interactionTypeLabels: Object.fromEntries(
          (["shared_activity", "conflict_resolution", "cooperative_play", "peer_mentoring", "group_project", "social_event", "team_sport", "creative_collaboration"] as const).map((t) => [t, getInteractionTypeLabel(t)]),
        ),
        relationshipQualityLabels: Object.fromEntries(
          (["thriving", "positive", "developing", "strained", "isolated"] as const).map((q) => [q, getRelationshipQualityLabel(q)]),
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

  const { interactions, policy, training, homeId, periodStart, periodEnd } = body as {
    interactions?: PeerInteraction[]; policy?: PeerRelationshipPolicy | null; training?: StaffPeerSupportTraining[];
    homeId?: string; periodStart?: string; periodEnd?: string;
  };

  if (!periodStart || !periodEnd) return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });

  const result = generatePeerRelationshipQualityIntelligence(
    interactions ?? [], policy ?? null, training ?? [], homeId ?? "unknown", periodStart, periodEnd,
  );

  return NextResponse.json({ data: result });
}
