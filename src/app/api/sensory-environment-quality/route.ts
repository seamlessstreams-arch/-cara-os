// ══════════════════════════════════════════════════════════════════════════════
// Sensory Environment Quality Intelligence API Route
//
// GET  — Returns Chamberlain House demo data intelligence
// POST — Accepts custom data with validation
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateSensoryEnvironmentQualityIntelligence,
  getSensoryAreaLabel,
  getEffectivenessLevelLabel,
  getRatingLabel,
} from "@/lib/sensory-environment-quality";
import type {
  SensoryAssessment,
  SensoryPolicy,
  StaffSensoryTraining,
} from "@/lib/sensory-environment-quality";

// ── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_ASSESSMENTS: SensoryAssessment[] = [
  {
    id: "sa-01",
    childId: "child-alex",
    childName: "Alex",
    assessmentDate: "2026-01-15",
    sensoryArea: "lighting_adaptation",
    effectivenessLevel: "highly_effective",
    childFeedbackPositive: true,
    occupationalTherapistInvolved: true,
    documentedInPlan: true,
    staffImplemented: true,
    environmentAdapted: true,
    reviewScheduled: true,
  },
  {
    id: "sa-02",
    childId: "child-alex",
    childName: "Alex",
    assessmentDate: "2026-02-10",
    sensoryArea: "noise_management",
    effectivenessLevel: "effective",
    childFeedbackPositive: true,
    occupationalTherapistInvolved: true,
    documentedInPlan: true,
    staffImplemented: true,
    environmentAdapted: true,
    reviewScheduled: true,
  },
  {
    id: "sa-03",
    childId: "child-alex",
    childName: "Alex",
    assessmentDate: "2026-03-20",
    sensoryArea: "proprioceptive_input",
    effectivenessLevel: "effective",
    childFeedbackPositive: true,
    occupationalTherapistInvolved: true,
    documentedInPlan: true,
    staffImplemented: true,
    environmentAdapted: true,
    reviewScheduled: true,
  },
  {
    id: "sa-04",
    childId: "child-jordan",
    childName: "Jordan",
    assessmentDate: "2026-01-20",
    sensoryArea: "calm_space",
    effectivenessLevel: "highly_effective",
    childFeedbackPositive: true,
    occupationalTherapistInvolved: true,
    documentedInPlan: true,
    staffImplemented: true,
    environmentAdapted: true,
    reviewScheduled: true,
  },
  {
    id: "sa-05",
    childId: "child-jordan",
    childName: "Jordan",
    assessmentDate: "2026-03-05",
    sensoryArea: "sensory_diet",
    effectivenessLevel: "effective",
    childFeedbackPositive: true,
    occupationalTherapistInvolved: false,
    documentedInPlan: true,
    staffImplemented: true,
    environmentAdapted: true,
    reviewScheduled: true,
  },
  {
    id: "sa-06",
    childId: "child-jordan",
    childName: "Jordan",
    assessmentDate: "2026-04-15",
    sensoryArea: "vestibular_activity",
    effectivenessLevel: "effective",
    childFeedbackPositive: true,
    occupationalTherapistInvolved: true,
    documentedInPlan: true,
    staffImplemented: true,
    environmentAdapted: true,
    reviewScheduled: false,
  },
  {
    id: "sa-07",
    childId: "child-morgan",
    childName: "Morgan",
    assessmentDate: "2026-02-01",
    sensoryArea: "tactile_provision",
    effectivenessLevel: "highly_effective",
    childFeedbackPositive: true,
    occupationalTherapistInvolved: true,
    documentedInPlan: true,
    staffImplemented: true,
    environmentAdapted: true,
    reviewScheduled: true,
  },
  {
    id: "sa-08",
    childId: "child-morgan",
    childName: "Morgan",
    assessmentDate: "2026-04-20",
    sensoryArea: "visual_supports",
    effectivenessLevel: "effective",
    childFeedbackPositive: true,
    occupationalTherapistInvolved: true,
    documentedInPlan: true,
    staffImplemented: true,
    environmentAdapted: true,
    reviewScheduled: true,
  },
];

const DEMO_POLICY: SensoryPolicy = {
  id: "sp-01",
  sensoryEnvironmentPolicy: true,
  sensoryAssessmentProcess: true,
  calmSpaceProvision: true,
  sensoryDietGuidance: true,
  staffTrainingRequirement: true,
  occupationalTherapyLink: true,
  regularReview: true,
};

const DEMO_TRAINING: StaffSensoryTraining[] = [
  {
    id: "st-01",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    sensoryProcessing: true,
    autismAwareness: true,
    calmSpaceManagement: true,
    sensoryDietImplementation: true,
    occupationalTherapySupport: true,
    documentationSkills: true,
  },
  {
    id: "st-02",
    staffId: "staff-tom",
    staffName: "Tom Richards",
    sensoryProcessing: true,
    autismAwareness: true,
    calmSpaceManagement: true,
    sensoryDietImplementation: true,
    occupationalTherapySupport: true,
    documentationSkills: true,
  },
  {
    id: "st-03",
    staffId: "staff-lisa",
    staffName: "Lisa Williams",
    sensoryProcessing: true,
    autismAwareness: true,
    calmSpaceManagement: true,
    sensoryDietImplementation: true,
    occupationalTherapySupport: true,
    documentationSkills: true,
  },
  {
    id: "st-04",
    staffId: "staff-darren",
    staffName: "Darren Laville",
    sensoryProcessing: true,
    autismAwareness: true,
    calmSpaceManagement: true,
    sensoryDietImplementation: true,
    occupationalTherapySupport: true,
    documentationSkills: true,
  },
];

// ── GET Handler ──────────────────────────────────────────────────────────────

export async function GET() {
  const periodStart = "2026-01-01";
  const periodEnd = "2026-05-19";

  const result = generateSensoryEnvironmentQualityIntelligence(
    DEMO_ASSESSMENTS,
    DEMO_POLICY,
    DEMO_TRAINING,
    "oak-house",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({
    ...result,
    meta: {
      sensoryAreaLabels: Object.fromEntries(
        (
          [
            "lighting_adaptation",
            "noise_management",
            "tactile_provision",
            "visual_supports",
            "calm_space",
            "sensory_diet",
            "proprioceptive_input",
            "vestibular_activity",
          ] as const
        ).map((a) => [a, getSensoryAreaLabel(a)]),
      ),
      effectivenessLevelLabels: Object.fromEntries(
        (
          [
            "highly_effective",
            "effective",
            "partially_effective",
            "ineffective",
            "not_implemented",
          ] as const
        ).map((l) => [l, getEffectivenessLevelLabel(l)]),
      ),
      ratingLabels: Object.fromEntries(
        (
          [
            "outstanding",
            "good",
            "requires_improvement",
            "inadequate",
          ] as const
        ).map((r) => [r, getRatingLabel(r)]),
      ),
    },
  });
}

// ── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      assessments,
      policy,
      training,
      homeId,
      periodStart,
      periodEnd,
    } = body;

    // Validation
    if (!Array.isArray(assessments)) {
      return NextResponse.json(
        { error: "assessments must be an array" },
        { status: 400 },
      );
    }
    if (!Array.isArray(training)) {
      return NextResponse.json(
        { error: "training must be an array" },
        { status: 400 },
      );
    }
    if (typeof homeId !== "string" || !homeId) {
      return NextResponse.json(
        { error: "homeId is required" },
        { status: 400 },
      );
    }
    if (typeof periodStart !== "string" || !periodStart) {
      return NextResponse.json(
        { error: "periodStart is required" },
        { status: 400 },
      );
    }
    if (typeof periodEnd !== "string" || !periodEnd) {
      return NextResponse.json(
        { error: "periodEnd is required" },
        { status: 400 },
      );
    }

    const result = generateSensoryEnvironmentQualityIntelligence(
      assessments as SensoryAssessment[],
      (policy as SensoryPolicy) ?? null,
      training as StaffSensoryTraining[],
      homeId,
      periodStart,
      periodEnd,
    );

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request body" },
      { status: 400 },
    );
  }
}
