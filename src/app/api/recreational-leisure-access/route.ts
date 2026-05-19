// ══════════════════════════════════════════════════════════════════════════════
// API: /api/recreational-leisure-access
//
// Recreational & Leisure Access Intelligence
//
// GET  — Returns recreational leisure access metrics with demo data (Oak House)
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateRecreationalLeisureAccessIntelligence,
  getActivityTypeLabel,
  getParticipationLevelLabel,
  getRatingLabel,
} from "@/lib/recreational-leisure-access";
import type {
  LeisureActivity,
  LeisurePolicy,
  StaffLeisureTraining,
} from "@/lib/recreational-leisure-access";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

function generateDemoData(): {
  activities: LeisureActivity[];
  policy: LeisurePolicy;
  training: StaffLeisureTraining[];
} {
  const activities: LeisureActivity[] = [
    {
      id: "la-001",
      childId: "child-alex",
      childName: "Alex",
      activityDate: "2026-01-15",
      activityType: "sports",
      participationLevel: "enthusiastic",
      childEnjoyed: true,
      newSkillDeveloped: true,
      socialInteraction: true,
      staffSupported: true,
      accessBarrierFree: true,
      recordedInPlan: true,
    },
    {
      id: "la-002",
      childId: "child-alex",
      childName: "Alex",
      activityDate: "2026-02-10",
      activityType: "swimming",
      participationLevel: "willing",
      childEnjoyed: true,
      newSkillDeveloped: true,
      socialInteraction: true,
      staffSupported: true,
      accessBarrierFree: true,
      recordedInPlan: true,
    },
    {
      id: "la-003",
      childId: "child-alex",
      childName: "Alex",
      activityDate: "2026-03-20",
      activityType: "outdoor_adventure",
      participationLevel: "enthusiastic",
      childEnjoyed: true,
      newSkillDeveloped: true,
      socialInteraction: true,
      staffSupported: true,
      accessBarrierFree: true,
      recordedInPlan: true,
    },
    {
      id: "la-004",
      childId: "child-jordan",
      childName: "Jordan",
      activityDate: "2026-01-22",
      activityType: "music",
      participationLevel: "enthusiastic",
      childEnjoyed: true,
      newSkillDeveloped: true,
      socialInteraction: false,
      staffSupported: true,
      accessBarrierFree: true,
      recordedInPlan: true,
    },
    {
      id: "la-005",
      childId: "child-jordan",
      childName: "Jordan",
      activityDate: "2026-02-18",
      activityType: "arts_crafts",
      participationLevel: "willing",
      childEnjoyed: true,
      newSkillDeveloped: false,
      socialInteraction: true,
      staffSupported: true,
      accessBarrierFree: true,
      recordedInPlan: true,
    },
    {
      id: "la-006",
      childId: "child-jordan",
      childName: "Jordan",
      activityDate: "2026-04-05",
      activityType: "drama",
      participationLevel: "reluctant",
      childEnjoyed: false,
      newSkillDeveloped: false,
      socialInteraction: true,
      staffSupported: true,
      accessBarrierFree: true,
      recordedInPlan: false,
    },
    {
      id: "la-007",
      childId: "child-morgan",
      childName: "Morgan",
      activityDate: "2026-03-01",
      activityType: "clubs_groups",
      participationLevel: "enthusiastic",
      childEnjoyed: true,
      newSkillDeveloped: true,
      socialInteraction: true,
      staffSupported: true,
      accessBarrierFree: true,
      recordedInPlan: true,
    },
    {
      id: "la-008",
      childId: "child-morgan",
      childName: "Morgan",
      activityDate: "2026-04-15",
      activityType: "cultural_visits",
      participationLevel: "willing",
      childEnjoyed: true,
      newSkillDeveloped: true,
      socialInteraction: true,
      staffSupported: true,
      accessBarrierFree: false,
      recordedInPlan: true,
    },
  ];

  const policy: LeisurePolicy = {
    id: "lp-001",
    activityProgramme: true,
    individualInterestPlans: true,
    inclusiveAccess: true,
    budgetAllocated: true,
    communityPartnerships: true,
    riskAssessmentProcess: true,
    regularReview: true,
  };

  const training: StaffLeisureTraining[] = [
    {
      id: "slt-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      activityPlanning: true,
      safeguardingInActivities: true,
      inclusionAwareness: true,
      firstAidOutdoors: true,
      youthEngagement: true,
      communityResources: true,
    },
    {
      id: "slt-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      activityPlanning: true,
      safeguardingInActivities: true,
      inclusionAwareness: true,
      firstAidOutdoors: false,
      youthEngagement: true,
      communityResources: false,
    },
    {
      id: "slt-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      activityPlanning: true,
      safeguardingInActivities: true,
      inclusionAwareness: true,
      firstAidOutdoors: true,
      youthEngagement: true,
      communityResources: true,
    },
    {
      id: "slt-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      activityPlanning: true,
      safeguardingInActivities: true,
      inclusionAwareness: true,
      firstAidOutdoors: true,
      youthEngagement: true,
      communityResources: true,
    },
  ];

  return { activities, policy, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { activities, policy, training } = generateDemoData();

  const result = generateRecreationalLeisureAccessIntelligence(
    activities,
    policy,
    training,
    "oak-house",
    "2026-01-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        activitySummary: activities.map((a) => ({
          id: a.id,
          childName: a.childName,
          date: a.activityDate,
          type: getActivityTypeLabel(a.activityType),
          participation: getParticipationLevelLabel(a.participationLevel),
          enjoyed: a.childEnjoyed,
        })),
        ratingLabel: getRatingLabel(result.rating),
      },
    },
  });
}

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    activities,
    policy,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    activities?: LeisureActivity[];
    policy?: LeisurePolicy | null;
    training?: StaffLeisureTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: "periodStart and periodEnd are required" },
      { status: 400 },
    );
  }

  const result = generateRecreationalLeisureAccessIntelligence(
    activities ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
