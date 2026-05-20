// ==============================================================================
// API: /api/hygiene-personal-care
//
// Hygiene & Personal Care Intelligence
//
// GET  — Returns hygiene assessment with Oak House demo data
// POST — Accepts custom data and returns tailored assessment
// ==============================================================================

import { NextResponse } from "next/server";
import {
  generateHygienePersonalCareIntelligence,
  getHygieneAreaLabel,
  getCompetencyLevelLabel,
  getRatingLabel,
} from "@/lib/hygiene-personal-care";
import type {
  HygieneSession,
  HygienePolicy,
  StaffHygieneTraining,
} from "@/lib/hygiene-personal-care";

// -- Demo Data: Oak House -------------------------------------------------------

const DEMO_SESSIONS: HygieneSession[] = [
  { id: "hs-1", childId: "child-alex", childName: "Alex", sessionDate: "2026-04-10", hygieneArea: "oral_care", competencyLevel: "independent", childParticipated: true, dignityMaintained: true, progressNoted: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "hs-2", childId: "child-alex", childName: "Alex", sessionDate: "2026-04-17", hygieneArea: "bathing_showering", competencyLevel: "independent", childParticipated: true, dignityMaintained: true, progressNoted: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "hs-3", childId: "child-alex", childName: "Alex", sessionDate: "2026-04-24", hygieneArea: "hand_washing", competencyLevel: "mostly_independent", childParticipated: true, dignityMaintained: true, progressNoted: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "hs-4", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-04-12", hygieneArea: "hair_care", competencyLevel: "independent", childParticipated: true, dignityMaintained: true, progressNoted: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "hs-5", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-04-19", hygieneArea: "skincare", competencyLevel: "mostly_independent", childParticipated: true, dignityMaintained: true, progressNoted: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "hs-6", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-04-14", hygieneArea: "nail_care", competencyLevel: "independent", childParticipated: true, dignityMaintained: true, progressNoted: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "hs-7", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-04-21", hygieneArea: "clothing_laundry", competencyLevel: "independent", childParticipated: true, dignityMaintained: true, progressNoted: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
  { id: "hs-8", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-04-28", hygieneArea: "menstrual_hygiene", competencyLevel: "mostly_independent", childParticipated: true, dignityMaintained: true, progressNoted: true, documentedInPlan: true, staffSupported: true, feedbackGiven: true },
];

const DEMO_POLICY: HygienePolicy = {
  id: "hp-1",
  personalCareStrategy: true,
  dignityAndPrivacyProtocol: true,
  ageAppropriateGuidance: true,
  infectionControlProcedure: true,
  culturalSensitivityPolicy: true,
  staffTrainingRequirement: true,
  regularReview: true,
};

const DEMO_STAFF_TRAINING: StaffHygieneTraining[] = [
  { id: "sht-1", staffId: "staff-sarah", staffName: "Sarah Johnson", personalCareSkills: true, dignityAndPrivacy: true, infectionControl: true, ageAppropriateSupport: true, culturalAwareness: true, safeguardingInPersonalCare: true },
  { id: "sht-2", staffId: "staff-tom", staffName: "Tom Richards", personalCareSkills: true, dignityAndPrivacy: true, infectionControl: true, ageAppropriateSupport: true, culturalAwareness: true, safeguardingInPersonalCare: true },
  { id: "sht-3", staffId: "staff-lisa", staffName: "Lisa Williams", personalCareSkills: true, dignityAndPrivacy: true, infectionControl: true, ageAppropriateSupport: true, culturalAwareness: true, safeguardingInPersonalCare: true },
  { id: "sht-4", staffId: "staff-darren", staffName: "Darren Laville", personalCareSkills: true, dignityAndPrivacy: true, infectionControl: true, ageAppropriateSupport: true, culturalAwareness: true, safeguardingInPersonalCare: true },
];

// -- GET ------------------------------------------------------------------------

export async function GET() {
  const result = generateHygienePersonalCareIntelligence(
    DEMO_SESSIONS,
    DEMO_POLICY,
    DEMO_STAFF_TRAINING,
    "oak-house",
    "2026-01-01",
    "2026-05-20",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        hygieneAreaLabels: Object.fromEntries(
          (["oral_care", "bathing_showering", "hand_washing", "hair_care", "skincare", "nail_care", "clothing_laundry", "menstrual_hygiene"] as const).map(
            (a) => [a, getHygieneAreaLabel(a)],
          ),
        ),
        competencyLevelLabels: Object.fromEntries(
          (["independent", "mostly_independent", "developing", "requires_support", "not_started"] as const).map(
            (c) => [c, getCompetencyLevelLabel(c)],
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

  const { sessions, policy, staffTraining, homeId, periodStart, periodEnd } = body as {
    sessions?: HygieneSession[];
    policy?: HygienePolicy | null;
    staffTraining?: StaffHygieneTraining[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateHygienePersonalCareIntelligence(
    sessions ?? [],
    policy ?? null,
    staffTraining ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
