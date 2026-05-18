// ==============================================================================
// API: /api/transition-readiness
//
// Transition Readiness Intelligence
//
// GET  — Returns transition readiness assessment with Oak House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateTransitionReadinessIntelligence,
  getTransitionTypeLabel,
  getTransitionStatusLabel,
  getReadinessLevelLabel,
  getHandoverQualityLabel,
  getSupportPlanStatusLabel,
  getChildFeelingLabel,
} from "@/lib/transition-readiness";
import type {
  TransitionPlan,
  HandoverRecord,
  ReadinessAssessment,
  PostTransitionSupport,
} from "@/lib/transition-readiness";

// -- Demo Data: Oak House -------------------------------------------------------

const DEMO_PLANS: TransitionPlan[] = [
  {
    id: "tp-morgan",
    childId: "child-morgan",
    childName: "Morgan",
    transitionType: "semi_independent",
    status: "completed",
    plannedDate: "2026-04-01",
    actualDate: "2026-04-03",
    receivingPlacementIdentified: true,
    visitToNewPlacementCompleted: true,
    introductoryVisitsCount: 3,
    childInvolvedInPlanning: true,
    childViewsRecorded: true,
    childFeelingAboutMove: "positive",
    parentCarerInvolved: true,
    socialWorkerInvolved: true,
    riskAssessmentUpdated: true,
    healthInfoTransferred: true,
    educationInfoTransferred: true,
    personalBelongingsArranged: true,
    lifeStoryWorkUpToDate: true,
    memoryBoxPrepared: true,
    goodbyesCelebrated: true,
  },
  {
    id: "tp-alex",
    childId: "child-alex",
    childName: "Alex",
    transitionType: "foster_care",
    status: "planned",
    plannedDate: "2026-06-01",
    receivingPlacementIdentified: true,
    visitToNewPlacementCompleted: true,
    introductoryVisitsCount: 2,
    childInvolvedInPlanning: true,
    childViewsRecorded: true,
    childFeelingAboutMove: "mixed",
    parentCarerInvolved: true,
    socialWorkerInvolved: true,
    riskAssessmentUpdated: true,
    healthInfoTransferred: true,
    educationInfoTransferred: true,
    personalBelongingsArranged: true,
    lifeStoryWorkUpToDate: true,
    memoryBoxPrepared: false,
    goodbyesCelebrated: false,
  },
];

const DEMO_HANDOVERS: HandoverRecord[] = [
  {
    id: "ho-morgan",
    childId: "child-morgan",
    transitionId: "tp-morgan",
    handoverDate: "2026-04-03",
    sendingKeyWorker: "Sarah Johnson",
    receivingKeyWorker: "Jane Mitchell",
    quality: "comprehensive",
    allDocumentsTransferred: true,
    carePlanShared: true,
    riskAssessmentShared: true,
    healthPassportShared: true,
    educationRecordsShared: true,
    personalHistoryShared: true,
    allergiesHighlighted: true,
    medicationInfoTransferred: true,
    keyRelationshipsDocumented: true,
    childPreferencesShared: true,
    triggersAndStrategiesShared: true,
  },
  {
    id: "ho-alex",
    childId: "child-alex",
    transitionId: "tp-alex",
    handoverDate: "2026-06-01",
    sendingKeyWorker: "Tom Richards",
    receivingKeyWorker: "Mike Dawson",
    quality: "adequate",
    allDocumentsTransferred: true,
    carePlanShared: true,
    riskAssessmentShared: true,
    healthPassportShared: true,
    educationRecordsShared: true,
    personalHistoryShared: true,
    allergiesHighlighted: true,
    medicationInfoTransferred: true,
    keyRelationshipsDocumented: true,
    childPreferencesShared: true,
    triggersAndStrategiesShared: true,
  },
];

const DEMO_ASSESSMENTS: ReadinessAssessment[] = [
  {
    id: "ra-morgan",
    childId: "child-morgan",
    transitionId: "tp-morgan",
    assessedDate: "2026-03-28",
    assessedBy: "Sarah Johnson",
    overallReadiness: "fully_ready",
    emotionalReadiness: "fully_ready",
    practicalReadiness: "fully_ready",
    socialReadiness: "mostly_ready",
    educationalReadiness: "fully_ready",
    supportPlanStatus: "in_place",
    contingencyPlanInPlace: true,
    professionalNetworkBriefed: true,
    familyNetworkBriefed: true,
  },
  {
    id: "ra-alex",
    childId: "child-alex",
    transitionId: "tp-alex",
    assessedDate: "2026-05-10",
    assessedBy: "Tom Richards",
    overallReadiness: "mostly_ready",
    emotionalReadiness: "mostly_ready",
    practicalReadiness: "mostly_ready",
    socialReadiness: "fully_ready",
    educationalReadiness: "fully_ready",
    supportPlanStatus: "in_place",
    contingencyPlanInPlace: true,
    professionalNetworkBriefed: true,
    familyNetworkBriefed: true,
  },
];

const DEMO_SUPPORTS: PostTransitionSupport[] = [
  {
    id: "pts-morgan",
    childId: "child-morgan",
    transitionId: "tp-morgan",
    followUpVisitCompleted: true,
    followUpVisitDate: "2026-04-07",
    followUpWithin7Days: true,
    settlingInReviewCompleted: true,
    previousKeyWorkerContactMaintained: true,
    feedbackFromChild: true,
    feedbackFromNewPlacement: true,
    issuesIdentified: 1,
    issuesResolved: 1,
  },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateTransitionReadinessIntelligence(
    DEMO_PLANS,
    DEMO_HANDOVERS,
    DEMO_ASSESSMENTS,
    DEMO_SUPPORTS,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        transitionTypeLabels: Object.fromEntries(
          (["placement_move", "step_down", "step_up", "return_home", "foster_care", "semi_independent", "independent_living", "adult_services", "education_transition", "emergency_move"] as const).map(
            (t) => [t, getTransitionTypeLabel(t)],
          ),
        ),
        transitionStatusLabels: Object.fromEntries(
          (["planned", "in_progress", "completed", "cancelled", "emergency"] as const).map(
            (s) => [s, getTransitionStatusLabel(s)],
          ),
        ),
        readinessLevelLabels: Object.fromEntries(
          (["fully_ready", "mostly_ready", "partially_ready", "not_ready", "not_assessed"] as const).map(
            (l) => [l, getReadinessLevelLabel(l)],
          ),
        ),
        handoverQualityLabels: Object.fromEntries(
          (["comprehensive", "adequate", "basic", "incomplete", "not_completed"] as const).map(
            (q) => [q, getHandoverQualityLabel(q)],
          ),
        ),
        supportPlanStatusLabels: Object.fromEntries(
          (["in_place", "in_development", "not_started", "not_required"] as const).map(
            (s) => [s, getSupportPlanStatusLabel(s)],
          ),
        ),
        childFeelingLabels: Object.fromEntries(
          (["positive", "mixed", "anxious", "resistant", "not_recorded"] as const).map(
            (f) => [f, getChildFeelingLabel(f)],
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

  const { plans, handovers, assessments, supports, homeId, periodStart, periodEnd } = body as {
    plans?: TransitionPlan[];
    handovers?: HandoverRecord[];
    assessments?: ReadinessAssessment[];
    supports?: PostTransitionSupport[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateTransitionReadinessIntelligence(
    plans ?? [],
    handovers ?? [],
    assessments ?? [],
    supports ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
