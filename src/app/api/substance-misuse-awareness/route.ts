// ==============================================================================
// API: /api/substance-misuse-awareness
//
// Substance Misuse Awareness Intelligence
//
// GET  — Returns substance misuse assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateSubstanceMisuseAwarenessIntelligence,
  getSubstanceTypeLabel,
  getRiskLevelLabel,
  getScreeningOutcomeLabel,
  getSessionTypeLabel,
  getInterventionOutcomeLabel,
  getRatingLabel,
} from "@/lib/substance-misuse-awareness";
import type {
  ChildSubstanceProfile,
  AwarenessSession,
  SubstanceIntervention,
  StaffSubstanceTraining,
} from "@/lib/substance-misuse-awareness";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_PROFILES: ChildSubstanceProfile[] = [
  {
    id: "sp-1",
    childId: "child-alex",
    childName: "Alex",
    riskLevel: "no_concerns",
    screeningDate: "2026-04-01",
    screenedBy: "Darren Laville",
    screeningOutcome: "no_concerns",
    substancesOfConcern: ["none"],
    reviewDate: "2026-05-01",
    reviewCurrent: true,
    harmReductionPlanInPlace: false,
    professionalReferralMade: false,
  },
  {
    id: "sp-2",
    childId: "child-jordan",
    childName: "Jordan",
    riskLevel: "low",
    screeningDate: "2026-03-15",
    screenedBy: "Darren Laville",
    screeningOutcome: "monitoring",
    substancesOfConcern: ["vaping"],
    reviewDate: "2026-04-15",
    reviewCurrent: true,
    harmReductionPlanInPlace: true,
    professionalReferralMade: false,
  },
  {
    id: "sp-3",
    childId: "child-morgan",
    childName: "Morgan",
    riskLevel: "no_concerns",
    screeningDate: "2026-04-10",
    screenedBy: "Darren Laville",
    screeningOutcome: "no_concerns",
    substancesOfConcern: ["none"],
    reviewDate: "2026-05-10",
    reviewCurrent: true,
    harmReductionPlanInPlace: false,
    professionalReferralMade: false,
  },
];

const DEMO_SESSIONS: AwarenessSession[] = [
  {
    id: "as-1",
    date: "2026-03-10",
    sessionType: "group_education",
    facilitatedBy: "Sarah Johnson",
    childrenAttended: ["child-alex", "child-jordan", "child-morgan"],
    topicsCovered: ["alcohol awareness", "peer pressure", "saying no"],
    childEngagement: "high",
    resourcesProvided: true,
  },
  {
    id: "as-2",
    date: "2026-03-25",
    sessionType: "individual_awareness",
    facilitatedBy: "Tom Richards",
    childrenAttended: ["child-jordan"],
    topicsCovered: ["vaping risks", "nicotine addiction", "healthier coping"],
    childEngagement: "high",
    resourcesProvided: true,
  },
  {
    id: "as-3",
    date: "2026-04-08",
    sessionType: "external_speaker",
    facilitatedBy: "Lisa Williams",
    childrenAttended: ["child-alex", "child-jordan", "child-morgan"],
    topicsCovered: ["county lines", "exploitation", "staying safe"],
    childEngagement: "high",
    resourcesProvided: true,
  },
  {
    id: "as-4",
    date: "2026-04-22",
    sessionType: "harm_reduction",
    facilitatedBy: "Darren Laville",
    childrenAttended: ["child-jordan"],
    topicsCovered: ["vaping harm reduction", "support options", "goal setting"],
    childEngagement: "medium",
    resourcesProvided: true,
  },
];

const DEMO_INTERVENTIONS: SubstanceIntervention[] = [];

const DEMO_TRAINING: StaffSubstanceTraining[] = [
  {
    id: "st-1",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    substanceAwareness: true,
    riskScreeningTrained: true,
    harmReductionTrained: true,
    motivationalInterviewing: true,
    referralPathwayKnowledge: true,
    emergencyResponseTrained: true,
  },
  {
    id: "st-2",
    staffId: "staff-tom",
    staffName: "Tom Richards",
    substanceAwareness: true,
    riskScreeningTrained: true,
    harmReductionTrained: true,
    motivationalInterviewing: false,
    referralPathwayKnowledge: true,
    emergencyResponseTrained: true,
  },
  {
    id: "st-3",
    staffId: "staff-lisa",
    staffName: "Lisa Williams",
    substanceAwareness: true,
    riskScreeningTrained: true,
    harmReductionTrained: true,
    motivationalInterviewing: true,
    referralPathwayKnowledge: true,
    emergencyResponseTrained: true,
  },
  {
    id: "st-4",
    staffId: "staff-darren",
    staffName: "Darren Laville",
    substanceAwareness: true,
    riskScreeningTrained: true,
    harmReductionTrained: true,
    motivationalInterviewing: true,
    referralPathwayKnowledge: true,
    emergencyResponseTrained: true,
  },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateSubstanceMisuseAwarenessIntelligence(
    DEMO_PROFILES,
    DEMO_SESSIONS,
    DEMO_INTERVENTIONS,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        substanceTypeLabels: Object.fromEntries(
          (["alcohol", "cannabis", "tobacco", "vaping", "solvents", "prescription_misuse", "nps", "class_a", "unknown", "none"] as const).map(
            (t) => [t, getSubstanceTypeLabel(t)],
          ),
        ),
        riskLevelLabels: Object.fromEntries(
          (["no_concerns", "low", "medium", "high", "active_use"] as const).map(
            (l) => [l, getRiskLevelLabel(l)],
          ),
        ),
        screeningOutcomeLabels: Object.fromEntries(
          (["no_concerns", "monitoring", "referral_made", "intervention_active", "recovery"] as const).map(
            (o) => [o, getScreeningOutcomeLabel(o)],
          ),
        ),
        sessionTypeLabels: Object.fromEntries(
          (["group_education", "individual_awareness", "peer_education", "external_speaker", "resource_sharing", "harm_reduction"] as const).map(
            (t) => [t, getSessionTypeLabel(t)],
          ),
        ),
        interventionOutcomeLabels: Object.fromEntries(
          (["engaged", "partially_engaged", "declined", "completed", "ongoing"] as const).map(
            (o) => [o, getInterventionOutcomeLabel(o)],
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

  const { profiles, sessions, interventions, training, homeId, periodStart, periodEnd } = body as {
    profiles?: ChildSubstanceProfile[];
    sessions?: AwarenessSession[];
    interventions?: SubstanceIntervention[];
    training?: StaffSubstanceTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateSubstanceMisuseAwarenessIntelligence(
    profiles ?? [],
    sessions ?? [],
    interventions ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
