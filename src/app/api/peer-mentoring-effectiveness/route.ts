// ==============================================================================
// API: /api/peer-mentoring-effectiveness
//
// Peer Mentoring Effectiveness Intelligence
//
// GET  — Returns peer mentoring assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generatePeerMentoringEffectivenessIntelligence,
  getMentoringRoleLabel,
  getSessionOutcomeLabel,
  getPairingStatusLabel,
  getSafeguardingConcernLabel,
  getRatingLabel,
} from "@/lib/peer-mentoring-effectiveness";
import type {
  PeerPairing,
  MentoringSession,
  RelationshipReview,
  StaffMentoringTraining,
} from "@/lib/peer-mentoring-effectiveness";

// -- Demo Data: Chamberlain House -------------------------------------------------------

const DEMO_PAIRINGS: PeerPairing[] = [
  // Morgan (15, mentor) paired with Jordan (13, mentee) — active, consented, risk assessed
  {
    id: "pp-1",
    mentorId: "child-morgan",
    mentorName: "Morgan",
    menteeId: "child-jordan",
    menteeName: "Jordan",
    startDate: "2026-02-01",
    status: "active",
    consentObtained: true,
    riskAssessed: true,
    matchCriteria: ["age_appropriate", "shared_interests", "personality_compatibility"],
    staffSupervisor: "Sarah Johnson",
  },
  // Alex (14, welcome buddy) for new admission scenario — completed
  {
    id: "pp-2",
    mentorId: "child-alex",
    mentorName: "Alex",
    menteeId: "child-riley",
    menteeName: "Riley",
    startDate: "2026-03-15",
    status: "completed",
    consentObtained: true,
    riskAssessed: true,
    matchCriteria: ["welcome_buddy", "similar_age"],
    staffSupervisor: "Tom Richards",
  },
];

const DEMO_SESSIONS: MentoringSession[] = [
  {
    id: "ms-1",
    pairingId: "pp-1",
    date: "2026-02-15",
    duration: 45,
    facilitatedBy: "Sarah Johnson",
    outcome: "positive",
    mentorFeedback: "Good session, Jordan was engaged",
    menteeFeedback: "Enjoyed talking with Morgan",
    goalsDiscussed: true,
    progressMade: true,
    staffObservation: "Positive interaction, appropriate boundaries maintained",
  },
  {
    id: "ms-2",
    pairingId: "pp-1",
    date: "2026-03-01",
    duration: 40,
    facilitatedBy: "Sarah Johnson",
    outcome: "positive",
    mentorFeedback: "Jordan is more confident now",
    menteeFeedback: "Morgan helped me with settling in",
    goalsDiscussed: true,
    progressMade: true,
    staffObservation: "Clear progress in mentee confidence",
  },
  {
    id: "ms-3",
    pairingId: "pp-1",
    date: "2026-04-10",
    duration: 30,
    facilitatedBy: "Lisa Williams",
    outcome: "mixed",
    mentorFeedback: "Jordan was quiet today",
    menteeFeedback: "Was not in the mood",
    goalsDiscussed: true,
    progressMade: false,
    staffObservation: "Mentee appeared low in mood, follow up needed",
  },
  {
    id: "ms-4",
    pairingId: "pp-2",
    date: "2026-03-20",
    duration: 60,
    facilitatedBy: "Tom Richards",
    outcome: "positive",
    mentorFeedback: "Showed Riley around, introduced to everyone",
    menteeFeedback: "Alex made me feel welcome",
    goalsDiscussed: false,
    progressMade: true,
    staffObservation: "Excellent welcome buddy session, Riley settled well",
  },
];

const DEMO_REVIEWS: RelationshipReview[] = [
  {
    id: "rr-1",
    pairingId: "pp-1",
    reviewDate: "2026-03-15",
    reviewedBy: "Darren Laville",
    relationshipHealthy: true,
    boundariesRespected: true,
    safeguardingConcern: "none",
    actionTaken: "",
    mentorBenefiting: true,
    menteeBenefiting: true,
  },
  {
    id: "rr-2",
    pairingId: "pp-2",
    reviewDate: "2026-04-01",
    reviewedBy: "Darren Laville",
    relationshipHealthy: true,
    boundariesRespected: true,
    safeguardingConcern: "none",
    actionTaken: "",
    mentorBenefiting: true,
    menteeBenefiting: true,
  },
];

const DEMO_TRAINING: StaffMentoringTraining[] = [
  { id: "smt-1", staffId: "staff-sarah", staffName: "Sarah Johnson", peerMentoringTrained: true, safeguardingInPeerRelationships: true, conflictResolution: true, boundarySetting: true, supportingYoungMentors: true },
  { id: "smt-2", staffId: "staff-tom", staffName: "Tom Richards", peerMentoringTrained: true, safeguardingInPeerRelationships: true, conflictResolution: true, boundarySetting: true, supportingYoungMentors: false },
  { id: "smt-3", staffId: "staff-lisa", staffName: "Lisa Williams", peerMentoringTrained: true, safeguardingInPeerRelationships: true, conflictResolution: false, boundarySetting: true, supportingYoungMentors: true },
  { id: "smt-4", staffId: "staff-darren", staffName: "Darren Laville", peerMentoringTrained: true, safeguardingInPeerRelationships: true, conflictResolution: true, boundarySetting: true, supportingYoungMentors: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generatePeerMentoringEffectivenessIntelligence(
    DEMO_PAIRINGS,
    DEMO_SESSIONS,
    DEMO_REVIEWS,
    DEMO_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        mentoringRoleLabels: Object.fromEntries(
          (["mentor", "mentee", "peer_buddy", "welcome_buddy"] as const).map(
            (r) => [r, getMentoringRoleLabel(r)],
          ),
        ),
        sessionOutcomeLabels: Object.fromEntries(
          (["positive", "mixed", "negative", "cancelled"] as const).map(
            (o) => [o, getSessionOutcomeLabel(o)],
          ),
        ),
        pairingStatusLabels: Object.fromEntries(
          (["active", "completed", "paused", "ended_early"] as const).map(
            (s) => [s, getPairingStatusLabel(s)],
          ),
        ),
        safeguardingConcernLabels: Object.fromEntries(
          (["none", "power_imbalance", "bullying_risk", "emotional_dependency", "boundary_issue", "exploitation_risk"] as const).map(
            (c) => [c, getSafeguardingConcernLabel(c)],
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

  const { pairings, sessions, reviews, training, homeId, periodStart, periodEnd } = body as {
    pairings?: PeerPairing[];
    sessions?: MentoringSession[];
    reviews?: RelationshipReview[];
    training?: StaffMentoringTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generatePeerMentoringEffectivenessIntelligence(
    pairings ?? [],
    sessions ?? [],
    reviews ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
