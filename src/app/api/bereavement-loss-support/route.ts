// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Bereavement, Loss & Support API Route
//
// GET  → returns Oak House demo bereavement/loss/support intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  generateBereavementLossSupportIntelligence,
  getLossTypeLabels,
  getSupportTypeLabels,
  getGriefStageLabels,
  getSupportOutcomeLabels,
  getRatingLabels,
} from "@/lib/bereavement-loss-support";
import type {
  LossEvent,
  SupportIntervention,
  BereavementPolicy,
  StaffBereavementTraining,
} from "@/lib/bereavement-loss-support";

// ── Oak House Demo Data ─────────────────────────────────────────────────────

function getDemoData() {
  const events: LossEvent[] = [
    {
      id: "le-01",
      childId: "child-alex",
      childName: "Alex",
      eventDate: "2026-02-10",
      lossType: "bereavement",
      description: "Grandparent passed away — Alex was close to maternal grandmother who had been a consistent figure throughout childhood",
      impactAssessed: true,
      supportPlanCreated: true,
      supportPlanReviewed: true,
    },
    {
      id: "le-02",
      childId: "child-jordan",
      childName: "Jordan",
      eventDate: "2026-01-15",
      lossType: "family_separation",
      description: "Contact with birth mother reduced after mother relocated — Jordan struggling with feelings of rejection",
      impactAssessed: true,
      supportPlanCreated: true,
      supportPlanReviewed: false,
    },
    {
      id: "le-03",
      childId: "child-morgan",
      childName: "Morgan",
      eventDate: "2026-03-01",
      lossType: "placement_move",
      description: "Moved from previous children's home — Morgan grieving loss of friendships and familiar staff from previous placement",
      impactAssessed: true,
      supportPlanCreated: true,
      supportPlanReviewed: true,
    },
  ];

  const interventions: SupportIntervention[] = [
    {
      id: "si-01",
      childId: "child-alex",
      childName: "Alex",
      lossEventId: "le-01",
      interventionDate: "2026-02-12",
      supportType: "keyworker",
      deliveredBy: "Sarah Johnson",
      childEngaged: true,
      outcome: "positive",
      followUpScheduled: true,
      followUpCompleted: true,
    },
    {
      id: "si-02",
      childId: "child-alex",
      childName: "Alex",
      lossEventId: "le-01",
      interventionDate: "2026-02-20",
      supportType: "therapeutic",
      deliveredBy: "Sarah Johnson",
      childEngaged: true,
      outcome: "positive",
      followUpScheduled: true,
      followUpCompleted: true,
    },
    {
      id: "si-03",
      childId: "child-alex",
      childName: "Alex",
      lossEventId: "le-01",
      interventionDate: "2026-03-05",
      supportType: "memory_work",
      deliveredBy: "Sarah Johnson",
      childEngaged: true,
      outcome: "positive",
      followUpScheduled: true,
      followUpCompleted: true,
    },
    {
      id: "si-04",
      childId: "child-alex",
      childName: "Alex",
      lossEventId: "le-01",
      interventionDate: "2026-03-20",
      supportType: "specialist_referral",
      deliveredBy: "Dr Karen Thompson",
      childEngaged: true,
      outcome: "partially_positive",
      followUpScheduled: true,
      followUpCompleted: false,
    },
    {
      id: "si-05",
      childId: "child-jordan",
      childName: "Jordan",
      lossEventId: "le-02",
      interventionDate: "2026-01-20",
      supportType: "keyworker",
      deliveredBy: "Tom Richards",
      childEngaged: true,
      outcome: "partially_positive",
      followUpScheduled: true,
      followUpCompleted: true,
    },
    {
      id: "si-06",
      childId: "child-jordan",
      childName: "Jordan",
      lossEventId: "le-02",
      interventionDate: "2026-02-05",
      supportType: "therapeutic",
      deliveredBy: "Tom Richards",
      childEngaged: false,
      outcome: "neutral",
      followUpScheduled: true,
      followUpCompleted: true,
    },
    {
      id: "si-07",
      childId: "child-jordan",
      childName: "Jordan",
      lossEventId: "le-02",
      interventionDate: "2026-03-10",
      supportType: "peer_support",
      deliveredBy: "Lisa Williams",
      childEngaged: true,
      outcome: "positive",
      followUpScheduled: true,
      followUpCompleted: true,
    },
    {
      id: "si-08",
      childId: "child-morgan",
      childName: "Morgan",
      lossEventId: "le-03",
      interventionDate: "2026-03-05",
      supportType: "keyworker",
      deliveredBy: "Lisa Williams",
      childEngaged: true,
      outcome: "partially_positive",
      followUpScheduled: true,
      followUpCompleted: true,
    },
    {
      id: "si-09",
      childId: "child-morgan",
      childName: "Morgan",
      lossEventId: "le-03",
      interventionDate: "2026-03-15",
      supportType: "memory_work",
      deliveredBy: "Darren Laville",
      childEngaged: true,
      outcome: "positive",
      followUpScheduled: true,
      followUpCompleted: true,
    },
    {
      id: "si-10",
      childId: "child-morgan",
      childName: "Morgan",
      lossEventId: "le-03",
      interventionDate: "2026-04-01",
      supportType: "external_counselling",
      deliveredBy: "Jess Harper (external)",
      childEngaged: true,
      outcome: "positive",
      followUpScheduled: true,
      followUpCompleted: false,
    },
    {
      id: "si-11",
      childId: "child-morgan",
      childName: "Morgan",
      lossEventId: "le-03",
      interventionDate: "2026-04-20",
      supportType: "group_work",
      deliveredBy: "Darren Laville",
      childEngaged: false,
      outcome: "neutral",
      followUpScheduled: false,
      followUpCompleted: false,
    },
  ];

  const policies: BereavementPolicy[] = [
    {
      id: "bp-01",
      policyReviewDate: "2026-01-10",
      policyCurrent: true,
      griefAwarenessIncluded: true,
      memoryWorkGuidance: true,
      specialistReferralPathway: true,
      culturalConsiderations: true,
      peerSupportFramework: true,
      staffSupportIncluded: true,
    },
  ];

  const training: StaffBereavementTraining[] = [
    {
      id: "bt-01",
      staffId: "s-01",
      staffName: "Sarah Johnson",
      griefAwareness: true,
      therapeuticResponse: true,
      memoryWorkSkills: true,
      culturalSensitivity: true,
      childDevelopmentGrief: true,
      referralPathways: true,
    },
    {
      id: "bt-02",
      staffId: "s-02",
      staffName: "Tom Richards",
      griefAwareness: true,
      therapeuticResponse: true,
      memoryWorkSkills: false,
      culturalSensitivity: true,
      childDevelopmentGrief: true,
      referralPathways: true,
    },
    {
      id: "bt-03",
      staffId: "s-03",
      staffName: "Lisa Williams",
      griefAwareness: true,
      therapeuticResponse: true,
      memoryWorkSkills: true,
      culturalSensitivity: false,
      childDevelopmentGrief: true,
      referralPathways: true,
    },
    {
      id: "bt-04",
      staffId: "s-04",
      staffName: "Darren Laville",
      griefAwareness: true,
      therapeuticResponse: true,
      memoryWorkSkills: true,
      culturalSensitivity: true,
      childDevelopmentGrief: false,
      referralPathways: true,
    },
  ];

  return { events, interventions, policies, training };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { events, interventions, policies, training } = getDemoData();
    const result = generateBereavementLossSupportIntelligence(
      events,
      interventions,
      policies,
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    return NextResponse.json({
      ...result,
      meta: {
        lossTypeLabels: getLossTypeLabels(),
        supportTypeLabels: getSupportTypeLabels(),
        griefStageLabels: getGriefStageLabels(),
        supportOutcomeLabels: getSupportOutcomeLabels(),
        ratingLabels: getRatingLabels(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate bereavement & loss support intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { events, interventions, policies, training, homeId, periodStart, periodEnd } = body;

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Missing required fields: periodStart, periodEnd" },
        { status: 400 },
      );
    }

    if (!Array.isArray(events) || !Array.isArray(interventions) || !Array.isArray(policies) || !Array.isArray(training)) {
      return NextResponse.json(
        { error: "events, interventions, policies, and training must be arrays" },
        { status: 400 },
      );
    }

    const result = generateBereavementLossSupportIntelligence(
      events as LossEvent[],
      interventions as SupportIntervention[],
      policies as BereavementPolicy[],
      training as StaffBereavementTraining[],
      homeId || "unknown",
      periodStart,
      periodEnd,
    );

    return NextResponse.json({
      ...result,
      meta: {
        lossTypeLabels: getLossTypeLabels(),
        supportTypeLabels: getSupportTypeLabels(),
        griefStageLabels: getGriefStageLabels(),
        supportOutcomeLabels: getSupportOutcomeLabels(),
        ratingLabels: getRatingLabels(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate bereavement & loss support intelligence", details: String(error) },
      { status: 500 },
    );
  }
}
