// ==============================================================================
// API: /api/environmental-sustainability
//
// Environmental Sustainability Intelligence
//
// GET  — Returns environmental sustainability assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateEnvironmentalSustainabilityIntelligence,
  getActivityTypeLabel,
  getEngagementLevelLabel,
  getRatingLabel,
} from "@/lib/environmental-sustainability";
import type {
  SustainabilityActivity,
  SustainabilityPolicy,
  StaffSustainabilityTraining,
} from "@/lib/environmental-sustainability";

// -- Demo Data: Chamberlain House -------------------------------------------------------

// Alex (14) — environmentally enthusiastic, high participation, child-initiated
// Jordan (13) — more reluctant, limited engagement, needs encouragement
// Morgan (15) — engaged in gardening and nature, good sustained participation

const DEMO_ACTIVITIES: SustainabilityActivity[] = [
  // Alex — high participation, enthusiastic
  { id: "act-a1", childId: "child-alex", childName: "Alex", activityDate: "2026-01-15", activityType: "recycling", engagementLevel: "highly_engaged", childInitiated: true, learningOutcomeRecorded: true, staffSupported: true },
  { id: "act-a2", childId: "child-alex", childName: "Alex", activityDate: "2026-02-03", activityType: "energy_saving", engagementLevel: "highly_engaged", childInitiated: true, learningOutcomeRecorded: true, staffSupported: true },
  { id: "act-a3", childId: "child-alex", childName: "Alex", activityDate: "2026-02-18", activityType: "composting", engagementLevel: "engaged", childInitiated: false, learningOutcomeRecorded: true, staffSupported: true },
  { id: "act-a4", childId: "child-alex", childName: "Alex", activityDate: "2026-03-08", activityType: "sustainable_shopping", engagementLevel: "highly_engaged", childInitiated: true, learningOutcomeRecorded: true, staffSupported: false },
  { id: "act-a5", childId: "child-alex", childName: "Alex", activityDate: "2026-03-25", activityType: "environmental_project", engagementLevel: "highly_engaged", childInitiated: true, learningOutcomeRecorded: true, staffSupported: true },
  { id: "act-a6", childId: "child-alex", childName: "Alex", activityDate: "2026-04-10", activityType: "water_conservation", engagementLevel: "engaged", childInitiated: false, learningOutcomeRecorded: true, staffSupported: true },
  { id: "act-a7", childId: "child-alex", childName: "Alex", activityDate: "2026-04-28", activityType: "nature_walk", engagementLevel: "highly_engaged", childInitiated: true, learningOutcomeRecorded: true, staffSupported: true },

  // Jordan — reluctant, lower engagement
  { id: "act-j1", childId: "child-jordan", childName: "Jordan", activityDate: "2026-01-22", activityType: "recycling", engagementLevel: "partially_engaged", childInitiated: false, learningOutcomeRecorded: false, staffSupported: true },
  { id: "act-j2", childId: "child-jordan", childName: "Jordan", activityDate: "2026-02-14", activityType: "nature_walk", engagementLevel: "reluctant", childInitiated: false, learningOutcomeRecorded: false, staffSupported: true },
  { id: "act-j3", childId: "child-jordan", childName: "Jordan", activityDate: "2026-03-05", activityType: "gardening", engagementLevel: "engaged", childInitiated: false, learningOutcomeRecorded: true, staffSupported: true },
  { id: "act-j4", childId: "child-jordan", childName: "Jordan", activityDate: "2026-03-30", activityType: "energy_saving", engagementLevel: "partially_engaged", childInitiated: false, learningOutcomeRecorded: false, staffSupported: true },
  { id: "act-j5", childId: "child-jordan", childName: "Jordan", activityDate: "2026-04-20", activityType: "recycling", engagementLevel: "refused", childInitiated: false, learningOutcomeRecorded: false, staffSupported: false },

  // Morgan — creative engagement, gardening focus
  { id: "act-m1", childId: "child-morgan", childName: "Morgan", activityDate: "2026-01-18", activityType: "gardening", engagementLevel: "highly_engaged", childInitiated: true, learningOutcomeRecorded: true, staffSupported: true },
  { id: "act-m2", childId: "child-morgan", childName: "Morgan", activityDate: "2026-02-05", activityType: "composting", engagementLevel: "engaged", childInitiated: true, learningOutcomeRecorded: true, staffSupported: true },
  { id: "act-m3", childId: "child-morgan", childName: "Morgan", activityDate: "2026-02-22", activityType: "nature_walk", engagementLevel: "highly_engaged", childInitiated: true, learningOutcomeRecorded: true, staffSupported: false },
  { id: "act-m4", childId: "child-morgan", childName: "Morgan", activityDate: "2026-03-12", activityType: "water_conservation", engagementLevel: "engaged", childInitiated: false, learningOutcomeRecorded: true, staffSupported: true },
  { id: "act-m5", childId: "child-morgan", childName: "Morgan", activityDate: "2026-04-02", activityType: "gardening", engagementLevel: "highly_engaged", childInitiated: true, learningOutcomeRecorded: true, staffSupported: true },
  { id: "act-m6", childId: "child-morgan", childName: "Morgan", activityDate: "2026-04-25", activityType: "environmental_project", engagementLevel: "engaged", childInitiated: false, learningOutcomeRecorded: true, staffSupported: true },
];

const DEMO_POLICY: SustainabilityPolicy = {
  id: "pol-oak",
  recyclingScheme: true,
  energyReductionPlan: true,
  sustainableProcurement: true,
  environmentalEducation: true,
  gardenAccess: true,
  waterConservation: true,
  regularAudit: false,
};

const DEMO_TRAINING: StaffSustainabilityTraining[] = [
  { id: "tr-1", staffId: "s-sarah", staffName: "Sarah Johnson", environmentalAwareness: true, recyclingProcedures: true, energyConservation: true, sustainableLiving: true, childEngagement: true, outdoorLearning: true },
  { id: "tr-2", staffId: "s-tom", staffName: "Tom Richards", environmentalAwareness: true, recyclingProcedures: true, energyConservation: true, sustainableLiving: false, childEngagement: true, outdoorLearning: false },
  { id: "tr-3", staffId: "s-lisa", staffName: "Lisa Williams", environmentalAwareness: true, recyclingProcedures: false, energyConservation: false, sustainableLiving: false, childEngagement: false, outdoorLearning: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateEnvironmentalSustainabilityIntelligence(
    DEMO_ACTIVITIES,
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
        activityTypeLabels: Object.fromEntries(
          (["recycling", "energy_saving", "gardening", "composting", "water_conservation", "sustainable_shopping", "nature_walk", "environmental_project"] as const).map(
            (t) => [t, getActivityTypeLabel(t)],
          ),
        ),
        engagementLevelLabels: Object.fromEntries(
          (["highly_engaged", "engaged", "partially_engaged", "reluctant", "refused"] as const).map(
            (e) => [e, getEngagementLevelLabel(e)],
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

  const { activities, policy, training, homeId, periodStart, periodEnd } = body as {
    activities?: SustainabilityActivity[];
    policy?: SustainabilityPolicy | null;
    training?: StaffSustainabilityTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateEnvironmentalSustainabilityIntelligence(
    activities ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
