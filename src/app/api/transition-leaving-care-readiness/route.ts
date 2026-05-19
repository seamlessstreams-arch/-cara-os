import { NextResponse } from "next/server";
import {
  generateTransitionLeavingCareReadinessIntelligence,
  getReadinessAreaLabel,
  getProgressLevelLabel,
  getRatingLabel,
} from "@/lib/transition-leaving-care-readiness";
import type {
  TransitionAssessment,
  TransitionPolicy,
  StaffTransitionTraining,
} from "@/lib/transition-leaving-care-readiness";

const DEMO_ASSESSMENTS: TransitionAssessment[] = [
  { id: "ta-1", childId: "child-alex", childName: "Alex", assessmentDate: "2026-04-01", readinessArea: "independent_living_skills", progressLevel: "on_track", pathwayPlanLinked: true, personalAdvisorInvolved: true, childVoiceCaptured: true, goalsSet: true, documentedInPlan: true, reviewScheduled: true },
  { id: "ta-2", childId: "child-alex", childName: "Alex", assessmentDate: "2026-04-08", readinessArea: "financial_literacy", progressLevel: "exceeding", pathwayPlanLinked: true, personalAdvisorInvolved: true, childVoiceCaptured: true, goalsSet: true, documentedInPlan: true, reviewScheduled: true },
  { id: "ta-3", childId: "child-alex", childName: "Alex", assessmentDate: "2026-04-15", readinessArea: "education_employment", progressLevel: "on_track", pathwayPlanLinked: true, personalAdvisorInvolved: true, childVoiceCaptured: true, goalsSet: true, documentedInPlan: true, reviewScheduled: true },
  { id: "ta-4", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-04-01", readinessArea: "health_management", progressLevel: "on_track", pathwayPlanLinked: true, personalAdvisorInvolved: true, childVoiceCaptured: true, goalsSet: true, documentedInPlan: true, reviewScheduled: true },
  { id: "ta-5", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-04-08", readinessArea: "housing_planning", progressLevel: "exceeding", pathwayPlanLinked: true, personalAdvisorInvolved: true, childVoiceCaptured: true, goalsSet: true, documentedInPlan: true, reviewScheduled: true },
  { id: "ta-6", childId: "child-jordan", childName: "Jordan", assessmentDate: "2026-04-15", readinessArea: "social_networks", progressLevel: "on_track", pathwayPlanLinked: true, personalAdvisorInvolved: true, childVoiceCaptured: true, goalsSet: true, documentedInPlan: true, reviewScheduled: true },
  { id: "ta-7", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-04-01", readinessArea: "emotional_resilience", progressLevel: "on_track", pathwayPlanLinked: true, personalAdvisorInvolved: true, childVoiceCaptured: true, goalsSet: true, documentedInPlan: true, reviewScheduled: true },
  { id: "ta-8", childId: "child-morgan", childName: "Morgan", assessmentDate: "2026-04-08", readinessArea: "identity_belonging", progressLevel: "exceeding", pathwayPlanLinked: true, personalAdvisorInvolved: true, childVoiceCaptured: true, goalsSet: true, documentedInPlan: true, reviewScheduled: true },
];

const DEMO_POLICY: TransitionPolicy = {
  id: "tp-1",
  pathwayPlanningFramework: true,
  independenceProgramme: true,
  personalAdvisorAllocation: true,
  housingPathway: true,
  financialCapabilityPlan: true,
  healthPassportScheme: true,
  regularReview: true,
};

const DEMO_TRAINING: StaffTransitionTraining[] = [
  { id: "tt-1", staffId: "staff-sarah", staffName: "Sarah Johnson", leavingCareAct: true, pathwayPlanning: true, independencePractical: true, financialCapability: true, emotionalResilience: true, housingOptions: true },
  { id: "tt-2", staffId: "staff-tom", staffName: "Tom Richards", leavingCareAct: true, pathwayPlanning: true, independencePractical: true, financialCapability: true, emotionalResilience: true, housingOptions: true },
  { id: "tt-3", staffId: "staff-lisa", staffName: "Lisa Williams", leavingCareAct: true, pathwayPlanning: true, independencePractical: true, financialCapability: true, emotionalResilience: true, housingOptions: true },
  { id: "tt-4", staffId: "staff-darren", staffName: "Darren Laville", leavingCareAct: true, pathwayPlanning: true, independencePractical: true, financialCapability: true, emotionalResilience: true, housingOptions: true },
];

export async function GET() {
  const result = generateTransitionLeavingCareReadinessIntelligence(
    DEMO_ASSESSMENTS, DEMO_POLICY, DEMO_TRAINING, "oak-house", "2026-01-01", "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        readinessAreaLabels: Object.fromEntries(
          (["independent_living_skills", "financial_literacy", "education_employment", "health_management", "housing_planning", "social_networks", "emotional_resilience", "identity_belonging"] as const).map((a) => [a, getReadinessAreaLabel(a)]),
        ),
        progressLevelLabels: Object.fromEntries(
          (["exceeding", "on_track", "developing", "behind", "not_started"] as const).map((p) => [p, getProgressLevelLabel(p)]),
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

  const { assessments, policy, training, homeId, periodStart, periodEnd } = body as {
    assessments?: TransitionAssessment[]; policy?: TransitionPolicy | null; training?: StaffTransitionTraining[];
    homeId?: string; periodStart?: string; periodEnd?: string;
  };

  if (!periodStart || !periodEnd) return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });

  const result = generateTransitionLeavingCareReadinessIntelligence(
    assessments ?? [], policy ?? null, training ?? [], homeId ?? "unknown", periodStart, periodEnd,
  );

  return NextResponse.json({ data: result });
}
