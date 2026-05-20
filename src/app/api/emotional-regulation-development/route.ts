// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Emotional Regulation Development API Route
//
// GET  → returns Oak House demo emotional regulation development intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  generateEmotionalRegulationDevelopmentIntelligence,
  getRegulationStrategyLabels,
  getEmotionalStateLabels,
  getRatingLabels,
} from "@/lib/emotional-regulation-development";
import type {
  RegulationSession,
  EmotionalRegulationPolicy,
  StaffEmotionalRegulationTraining,
} from "@/lib/emotional-regulation-development";

// ── Oak House Demo Data ─────────────────────────────────────────────────────

function getDemoData() {
  const sessions: RegulationSession[] = [
    {
      id: "rs-01",
      childId: "child-alex",
      childName: "Alex",
      sessionDate: "2026-01-15",
      strategyUsed: "deep_breathing",
      emotionalStateBefore: "highly_dysregulated",
      emotionalStateAfter: "calm_regulated",
      staffGuided: true,
      childInitiated: true,
      progressNoted: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "rs-02",
      childId: "child-alex",
      childName: "Alex",
      sessionDate: "2026-02-03",
      strategyUsed: "grounding_technique",
      emotionalStateBefore: "moderately_dysregulated",
      emotionalStateAfter: "mildly_dysregulated",
      staffGuided: true,
      childInitiated: true,
      progressNoted: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "rs-03",
      childId: "child-alex",
      childName: "Alex",
      sessionDate: "2026-03-10",
      strategyUsed: "mindfulness",
      emotionalStateBefore: "mildly_dysregulated",
      emotionalStateAfter: "calm_regulated",
      staffGuided: false,
      childInitiated: true,
      progressNoted: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: false,
    },
    {
      id: "rs-04",
      childId: "child-jordan",
      childName: "Jordan",
      sessionDate: "2026-01-20",
      strategyUsed: "physical_activity",
      emotionalStateBefore: "highly_dysregulated",
      emotionalStateAfter: "moderately_dysregulated",
      staffGuided: true,
      childInitiated: false,
      progressNoted: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "rs-05",
      childId: "child-jordan",
      childName: "Jordan",
      sessionDate: "2026-02-14",
      strategyUsed: "creative_expression",
      emotionalStateBefore: "moderately_dysregulated",
      emotionalStateAfter: "mildly_dysregulated",
      staffGuided: true,
      childInitiated: false,
      progressNoted: false,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "rs-06",
      childId: "child-jordan",
      childName: "Jordan",
      sessionDate: "2026-03-01",
      strategyUsed: "talking_therapy",
      emotionalStateBefore: "mildly_dysregulated",
      emotionalStateAfter: "calm_regulated",
      staffGuided: true,
      childInitiated: true,
      progressNoted: true,
      documentedInPlan: false,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "rs-07",
      childId: "child-morgan",
      childName: "Morgan",
      sessionDate: "2026-02-10",
      strategyUsed: "sensory_tool",
      emotionalStateBefore: "crisis",
      emotionalStateAfter: "moderately_dysregulated",
      staffGuided: true,
      childInitiated: false,
      progressNoted: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "rs-08",
      childId: "child-morgan",
      childName: "Morgan",
      sessionDate: "2026-03-20",
      strategyUsed: "safe_space_use",
      emotionalStateBefore: "highly_dysregulated",
      emotionalStateAfter: "mildly_dysregulated",
      staffGuided: false,
      childInitiated: true,
      progressNoted: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
  ];

  const policy: EmotionalRegulationPolicy = {
    id: "ep-01",
    emotionalWellbeingStrategy: true,
    therapeuticApproachFramework: true,
    crisisInterventionProtocol: true,
    deEscalationProcedure: true,
    sensoryEnvironmentPolicy: true,
    staffEmotionalSupportGuidance: true,
    regularReview: true,
  };

  const training: StaffEmotionalRegulationTraining[] = [
    {
      id: "st-01",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      emotionalLiteracy: true,
      deEscalationTechniques: true,
      therapeuticApproaches: true,
      traumaInformedCare: true,
      crisisIntervention: true,
      reflectivePractice: true,
    },
    {
      id: "st-02",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      emotionalLiteracy: true,
      deEscalationTechniques: true,
      therapeuticApproaches: true,
      traumaInformedCare: true,
      crisisIntervention: true,
      reflectivePractice: true,
    },
    {
      id: "st-03",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      emotionalLiteracy: true,
      deEscalationTechniques: true,
      therapeuticApproaches: true,
      traumaInformedCare: true,
      crisisIntervention: true,
      reflectivePractice: true,
    },
    {
      id: "st-04",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      emotionalLiteracy: true,
      deEscalationTechniques: true,
      therapeuticApproaches: true,
      traumaInformedCare: true,
      crisisIntervention: true,
      reflectivePractice: true,
    },
  ];

  return { sessions, policy, training };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { sessions, policy, training } = getDemoData();
    const result = generateEmotionalRegulationDevelopmentIntelligence(
      sessions,
      policy,
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-20",
    );

    return NextResponse.json({
      data: {
        ...result,
        meta: {
          regulationStrategyLabels: getRegulationStrategyLabels(),
          emotionalStateLabels: getEmotionalStateLabels(),
          ratingLabels: getRatingLabels(),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate emotional regulation development intelligence", details: String(error) },
      { status: 500 },
    );
  }
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessions, policy, training, homeId, periodStart, periodEnd } = body;

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Missing required fields: periodStart, periodEnd" },
        { status: 400 },
      );
    }

    if (!Array.isArray(sessions) || !Array.isArray(training)) {
      return NextResponse.json(
        { error: "sessions and training must be arrays" },
        { status: 400 },
      );
    }

    const result = generateEmotionalRegulationDevelopmentIntelligence(
      sessions as RegulationSession[],
      policy as EmotionalRegulationPolicy | null,
      training as StaffEmotionalRegulationTraining[],
      homeId || "unknown",
      periodStart,
      periodEnd,
    );

    return NextResponse.json({
      data: {
        ...result,
        meta: {
          regulationStrategyLabels: getRegulationStrategyLabels(),
          emotionalStateLabels: getEmotionalStateLabels(),
          ratingLabels: getRatingLabels(),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate emotional regulation development intelligence", details: String(error) },
      { status: 500 },
    );
  }
}
