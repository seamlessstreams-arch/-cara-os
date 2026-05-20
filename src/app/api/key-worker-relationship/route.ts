import { NextResponse } from "next/server";
import {
  generateKeyWorkerRelationshipIntelligence,
  getSessionTypeLabel,
  getRelationshipStrengthLabel,
  getRatingLabel,
} from "@/lib/key-worker-relationship";
import type {
  KeyWorkerSession,
  KeyWorkerPolicy,
  StaffKeyWorkerTraining,
} from "@/lib/key-worker-relationship";

const DEMO_SESSIONS: KeyWorkerSession[] = [
  { id: "kws-1", childId: "child-alex", childName: "Alex", keyWorkerId: "staff-sarah", keyWorkerName: "Sarah Johnson", sessionDate: "2026-04-01", sessionType: "one_to_one", relationshipStrength: "very_strong", childEngaged: true, goalsDiscussed: true, progressRecorded: true, documentedInPlan: true, supervisorReviewed: true, feedbackGiven: true },
  { id: "kws-2", childId: "child-alex", childName: "Alex", keyWorkerId: "staff-sarah", keyWorkerName: "Sarah Johnson", sessionDate: "2026-04-08", sessionType: "goal_review", relationshipStrength: "very_strong", childEngaged: true, goalsDiscussed: true, progressRecorded: true, documentedInPlan: true, supervisorReviewed: true, feedbackGiven: true },
  { id: "kws-3", childId: "child-alex", childName: "Alex", keyWorkerId: "staff-sarah", keyWorkerName: "Sarah Johnson", sessionDate: "2026-04-15", sessionType: "life_story_work", relationshipStrength: "strong", childEngaged: true, goalsDiscussed: true, progressRecorded: true, documentedInPlan: true, supervisorReviewed: true, feedbackGiven: true },
  { id: "kws-4", childId: "child-jordan", childName: "Jordan", keyWorkerId: "staff-tom", keyWorkerName: "Tom Richards", sessionDate: "2026-04-01", sessionType: "activity_based", relationshipStrength: "very_strong", childEngaged: true, goalsDiscussed: true, progressRecorded: true, documentedInPlan: true, supervisorReviewed: true, feedbackGiven: true },
  { id: "kws-5", childId: "child-jordan", childName: "Jordan", keyWorkerId: "staff-tom", keyWorkerName: "Tom Richards", sessionDate: "2026-04-08", sessionType: "advocacy", relationshipStrength: "strong", childEngaged: true, goalsDiscussed: true, progressRecorded: true, documentedInPlan: true, supervisorReviewed: true, feedbackGiven: true },
  { id: "kws-6", childId: "child-jordan", childName: "Jordan", keyWorkerId: "staff-tom", keyWorkerName: "Tom Richards", sessionDate: "2026-04-15", sessionType: "crisis_support", relationshipStrength: "very_strong", childEngaged: true, goalsDiscussed: true, progressRecorded: true, documentedInPlan: true, supervisorReviewed: true, feedbackGiven: true },
  { id: "kws-7", childId: "child-morgan", childName: "Morgan", keyWorkerId: "staff-lisa", keyWorkerName: "Lisa Williams", sessionDate: "2026-04-01", sessionType: "transition_planning", relationshipStrength: "strong", childEngaged: true, goalsDiscussed: true, progressRecorded: true, documentedInPlan: true, supervisorReviewed: true, feedbackGiven: true },
  { id: "kws-8", childId: "child-morgan", childName: "Morgan", keyWorkerId: "staff-lisa", keyWorkerName: "Lisa Williams", sessionDate: "2026-04-08", sessionType: "wellbeing_check", relationshipStrength: "very_strong", childEngaged: true, goalsDiscussed: true, progressRecorded: true, documentedInPlan: true, supervisorReviewed: true, feedbackGiven: true },
];

const DEMO_POLICY: KeyWorkerPolicy = {
  id: "kwp-1",
  keyWorkerAllocationStrategy: true,
  sessionFrequencyStandard: true,
  relationshipBuildingFramework: true,
  advocacyProtocol: true,
  handoverProcedure: true,
  supervisionRequirement: true,
  regularReview: true,
};

const DEMO_TRAINING: StaffKeyWorkerTraining[] = [
  { id: "kwt-1", staffId: "staff-sarah", staffName: "Sarah Johnson", relationshipBuilding: true, childAdvocacy: true, goalSettingSkills: true, lifeStoryWork: true, transitionSupport: true, reflectivePractice: true },
  { id: "kwt-2", staffId: "staff-tom", staffName: "Tom Richards", relationshipBuilding: true, childAdvocacy: true, goalSettingSkills: true, lifeStoryWork: true, transitionSupport: true, reflectivePractice: true },
  { id: "kwt-3", staffId: "staff-lisa", staffName: "Lisa Williams", relationshipBuilding: true, childAdvocacy: true, goalSettingSkills: true, lifeStoryWork: true, transitionSupport: true, reflectivePractice: true },
  { id: "kwt-4", staffId: "staff-darren", staffName: "Darren Laville", relationshipBuilding: true, childAdvocacy: true, goalSettingSkills: true, lifeStoryWork: true, transitionSupport: true, reflectivePractice: true },
];

export async function GET() {
  const result = generateKeyWorkerRelationshipIntelligence(
    DEMO_SESSIONS, DEMO_POLICY, DEMO_TRAINING, "oak-house", "2026-01-01", "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        sessionTypeLabels: Object.fromEntries(
          (["one_to_one", "activity_based", "goal_review", "crisis_support", "advocacy", "life_story_work", "transition_planning", "wellbeing_check"] as const).map((t) => [t, getSessionTypeLabel(t)]),
        ),
        relationshipStrengthLabels: Object.fromEntries(
          (["very_strong", "strong", "developing", "fragile", "disengaged"] as const).map((s) => [s, getRelationshipStrengthLabel(s)]),
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

  const { sessions, policy, training, homeId, periodStart, periodEnd } = body as {
    sessions?: KeyWorkerSession[]; policy?: KeyWorkerPolicy | null; training?: StaffKeyWorkerTraining[];
    homeId?: string; periodStart?: string; periodEnd?: string;
  };

  if (!periodStart || !periodEnd) return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });

  const result = generateKeyWorkerRelationshipIntelligence(
    sessions ?? [], policy ?? null, training ?? [], homeId ?? "unknown", periodStart, periodEnd,
  );

  return NextResponse.json({ data: result });
}
