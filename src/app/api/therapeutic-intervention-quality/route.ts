// ==============================================================================
// API: /api/therapeutic-intervention-quality
//
// Therapeutic Intervention Quality Intelligence
//
// GET  — Returns therapeutic intervention assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateTherapeuticInterventionQualityIntelligence,
  getTherapyTypeLabel,
  getProgressLevelLabel,
  getRatingLabel,
} from "@/lib/therapeutic-intervention-quality";
import type {
  TherapySession,
  TherapeuticPolicy,
  StaffTherapeuticTraining,
} from "@/lib/therapeutic-intervention-quality";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_SESSIONS: TherapySession[] = [
  // Alex — 3 sessions
  {
    id: "ses-alex-1",
    childId: "child-alex",
    childName: "Alex",
    sessionDate: "2026-03-10",
    therapyType: "cbt",
    progressLevel: "good_progress",
    childEngaged: true,
    goalsReviewed: true,
    therapeuticRelationshipStrong: true,
    documentedInPlan: true,
    staffSupported: true,
    feedbackGiven: true,
  },
  {
    id: "ses-alex-2",
    childId: "child-alex",
    childName: "Alex",
    sessionDate: "2026-03-24",
    therapyType: "cbt",
    progressLevel: "significant_progress",
    childEngaged: true,
    goalsReviewed: true,
    therapeuticRelationshipStrong: true,
    documentedInPlan: true,
    staffSupported: true,
    feedbackGiven: true,
  },
  {
    id: "ses-alex-3",
    childId: "child-alex",
    childName: "Alex",
    sessionDate: "2026-04-14",
    therapyType: "art_therapy",
    progressLevel: "good_progress",
    childEngaged: true,
    goalsReviewed: true,
    therapeuticRelationshipStrong: true,
    documentedInPlan: true,
    staffSupported: true,
    feedbackGiven: true,
  },
  // Jordan — 3 sessions
  {
    id: "ses-jordan-1",
    childId: "child-jordan",
    childName: "Jordan",
    sessionDate: "2026-03-15",
    therapyType: "play_therapy",
    progressLevel: "good_progress",
    childEngaged: true,
    goalsReviewed: true,
    therapeuticRelationshipStrong: true,
    documentedInPlan: true,
    staffSupported: true,
    feedbackGiven: true,
  },
  {
    id: "ses-jordan-2",
    childId: "child-jordan",
    childName: "Jordan",
    sessionDate: "2026-04-05",
    therapyType: "emdr",
    progressLevel: "significant_progress",
    childEngaged: true,
    goalsReviewed: true,
    therapeuticRelationshipStrong: true,
    documentedInPlan: true,
    staffSupported: true,
    feedbackGiven: true,
  },
  {
    id: "ses-jordan-3",
    childId: "child-jordan",
    childName: "Jordan",
    sessionDate: "2026-04-28",
    therapyType: "family_therapy",
    progressLevel: "good_progress",
    childEngaged: true,
    goalsReviewed: true,
    therapeuticRelationshipStrong: true,
    documentedInPlan: true,
    staffSupported: true,
    feedbackGiven: true,
  },
  // Morgan — 2 sessions
  {
    id: "ses-morgan-1",
    childId: "child-morgan",
    childName: "Morgan",
    sessionDate: "2026-03-20",
    therapyType: "dialectical_behaviour",
    progressLevel: "significant_progress",
    childEngaged: true,
    goalsReviewed: true,
    therapeuticRelationshipStrong: true,
    documentedInPlan: true,
    staffSupported: true,
    feedbackGiven: true,
  },
  {
    id: "ses-morgan-2",
    childId: "child-morgan",
    childName: "Morgan",
    sessionDate: "2026-04-18",
    therapyType: "psychodynamic",
    progressLevel: "good_progress",
    childEngaged: true,
    goalsReviewed: true,
    therapeuticRelationshipStrong: true,
    documentedInPlan: true,
    staffSupported: true,
    feedbackGiven: true,
  },
];

const DEMO_POLICY: TherapeuticPolicy = {
  id: "policy-oak-house",
  therapeuticFramework: true,
  referralPathway: true,
  consentAndConfidentialityProtocol: true,
  multiDisciplinaryApproach: true,
  outcomeMeasurementPlan: true,
  crisisTherapyProvision: true,
  regularReview: true,
};

const DEMO_TRAINING: StaffTherapeuticTraining[] = [
  { id: "tr-1", staffId: "staff-sarah", staffName: "Sarah Johnson", therapeuticAwareness: true, traumaInformedPractice: true, attachmentTheory: true, therapeuticCommunication: true, boundaryManagement: true, reflectivePractice: true },
  { id: "tr-2", staffId: "staff-tom", staffName: "Tom Richards", therapeuticAwareness: true, traumaInformedPractice: true, attachmentTheory: true, therapeuticCommunication: true, boundaryManagement: true, reflectivePractice: true },
  { id: "tr-3", staffId: "staff-lisa", staffName: "Lisa Williams", therapeuticAwareness: true, traumaInformedPractice: true, attachmentTheory: true, therapeuticCommunication: true, boundaryManagement: true, reflectivePractice: true },
  { id: "tr-4", staffId: "staff-darren", staffName: "Darren Laville", therapeuticAwareness: true, traumaInformedPractice: true, attachmentTheory: true, therapeuticCommunication: true, boundaryManagement: true, reflectivePractice: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateTherapeuticInterventionQualityIntelligence(
    DEMO_SESSIONS,
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
        therapyTypeLabels: Object.fromEntries(
          (["cbt", "play_therapy", "art_therapy", "emdr", "family_therapy", "dialectical_behaviour", "psychodynamic", "occupational_therapy"] as const).map(
            (v) => [v, getTherapyTypeLabel(v)],
          ),
        ),
        progressLevelLabels: Object.fromEntries(
          (["significant_progress", "good_progress", "some_progress", "minimal_progress", "no_progress"] as const).map(
            (v) => [v, getProgressLevelLabel(v)],
          ),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map(
            (r) => [r, getRatingLabel(r)],
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

  const { sessions, policy, training, homeId, periodStart, periodEnd } = body as {
    sessions?: TherapySession[];
    policy?: TherapeuticPolicy | null;
    training?: StaffTherapeuticTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateTherapeuticInterventionQualityIntelligence(
    sessions ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
