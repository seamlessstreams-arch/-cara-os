// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Emotional Regulation Support API Route
//
// GET  → returns Oak House demo emotional regulation support intelligence
// POST → accepts custom data for any home
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  generateEmotionalRegulationSupportIntelligence,
  getStrategyTypeLabels,
  getOutcomeLevelLabels,
  getRatingLabels,
} from "@/lib/emotional-regulation-support";
import type {
  RegulationSession,
  RegulationPolicy,
  StaffRegulationTraining,
} from "@/lib/emotional-regulation-support";

// ── Oak House Demo Data ─────────────────────────────────────────────────────

function getDemoData() {
  const sessions: RegulationSession[] = [
    {
      id: "rs-01",
      childId: "child-alex",
      childName: "Alex",
      sessionDate: "2026-01-15",
      strategyType: "breathing_exercises",
      outcomeLevel: "very_effective",
      childLed: true,
      staffCoRegulated: true,
      emotionIdentified: true,
      copingPlanUpdated: true,
      recordedInCasefile: true,
      therapeuticApproach: true,
    },
    {
      id: "rs-02",
      childId: "child-alex",
      childName: "Alex",
      sessionDate: "2026-02-03",
      strategyType: "grounding_techniques",
      outcomeLevel: "effective",
      childLed: true,
      staffCoRegulated: true,
      emotionIdentified: true,
      copingPlanUpdated: false,
      recordedInCasefile: true,
      therapeuticApproach: true,
    },
    {
      id: "rs-03",
      childId: "child-alex",
      childName: "Alex",
      sessionDate: "2026-03-10",
      strategyType: "emotion_coaching",
      outcomeLevel: "effective",
      childLed: true,
      staffCoRegulated: false,
      emotionIdentified: true,
      copingPlanUpdated: true,
      recordedInCasefile: true,
      therapeuticApproach: true,
    },
    {
      id: "rs-04",
      childId: "child-alex",
      childName: "Alex",
      sessionDate: "2026-04-05",
      strategyType: "mindfulness",
      outcomeLevel: "very_effective",
      childLed: true,
      staffCoRegulated: true,
      emotionIdentified: true,
      copingPlanUpdated: true,
      recordedInCasefile: true,
      therapeuticApproach: true,
    },
    {
      id: "rs-05",
      childId: "child-jordan",
      childName: "Jordan",
      sessionDate: "2026-01-20",
      strategyType: "sensory_tools",
      outcomeLevel: "partially_effective",
      childLed: false,
      staffCoRegulated: true,
      emotionIdentified: true,
      copingPlanUpdated: false,
      recordedInCasefile: true,
      therapeuticApproach: false,
    },
    {
      id: "rs-06",
      childId: "child-jordan",
      childName: "Jordan",
      sessionDate: "2026-02-14",
      strategyType: "co_regulation",
      outcomeLevel: "effective",
      childLed: false,
      staffCoRegulated: true,
      emotionIdentified: true,
      copingPlanUpdated: true,
      recordedInCasefile: true,
      therapeuticApproach: true,
    },
    {
      id: "rs-07",
      childId: "child-jordan",
      childName: "Jordan",
      sessionDate: "2026-03-01",
      strategyType: "safe_space",
      outcomeLevel: "effective",
      childLed: false,
      staffCoRegulated: true,
      emotionIdentified: false,
      copingPlanUpdated: false,
      recordedInCasefile: false,
      therapeuticApproach: false,
    },
    {
      id: "rs-08",
      childId: "child-jordan",
      childName: "Jordan",
      sessionDate: "2026-04-15",
      strategyType: "physical_activity",
      outcomeLevel: "not_effective",
      childLed: false,
      staffCoRegulated: false,
      emotionIdentified: false,
      copingPlanUpdated: false,
      recordedInCasefile: true,
      therapeuticApproach: false,
    },
    {
      id: "rs-09",
      childId: "child-morgan",
      childName: "Morgan",
      sessionDate: "2026-02-10",
      strategyType: "breathing_exercises",
      outcomeLevel: "effective",
      childLed: true,
      staffCoRegulated: true,
      emotionIdentified: true,
      copingPlanUpdated: true,
      recordedInCasefile: true,
      therapeuticApproach: true,
    },
    {
      id: "rs-10",
      childId: "child-morgan",
      childName: "Morgan",
      sessionDate: "2026-03-20",
      strategyType: "emotion_coaching",
      outcomeLevel: "very_effective",
      childLed: true,
      staffCoRegulated: true,
      emotionIdentified: true,
      copingPlanUpdated: true,
      recordedInCasefile: true,
      therapeuticApproach: true,
    },
    {
      id: "rs-11",
      childId: "child-morgan",
      childName: "Morgan",
      sessionDate: "2026-04-25",
      strategyType: "mindfulness",
      outcomeLevel: "effective",
      childLed: true,
      staffCoRegulated: false,
      emotionIdentified: true,
      copingPlanUpdated: false,
      recordedInCasefile: true,
      therapeuticApproach: true,
    },
  ];

  const policy: RegulationPolicy = {
    id: "rp-01",
    emotionalRegulationFramework: true,
    coRegulationGuidance: true,
    therapeuticApproach: true,
    safeSpaceAvailable: true,
    sensoryToolsProvided: true,
    crisisDeescalation: true,
    regularReview: true,
  };

  const training: StaffRegulationTraining[] = [
    {
      id: "rt-01",
      staffId: "s-01",
      staffName: "Sarah Johnson",
      emotionalRegulation: true,
      coRegulation: true,
      traumaInformed: true,
      sensoryProcessing: true,
      emotionCoaching: true,
      therapeuticApproach: true,
    },
    {
      id: "rt-02",
      staffId: "s-02",
      staffName: "Tom Richards",
      emotionalRegulation: true,
      coRegulation: true,
      traumaInformed: true,
      sensoryProcessing: false,
      emotionCoaching: true,
      therapeuticApproach: true,
    },
    {
      id: "rt-03",
      staffId: "s-03",
      staffName: "Lisa Williams",
      emotionalRegulation: true,
      coRegulation: true,
      traumaInformed: true,
      sensoryProcessing: true,
      emotionCoaching: false,
      therapeuticApproach: true,
    },
    {
      id: "rt-04",
      staffId: "s-04",
      staffName: "Darren Laville",
      emotionalRegulation: true,
      coRegulation: true,
      traumaInformed: true,
      sensoryProcessing: true,
      emotionCoaching: true,
      therapeuticApproach: false,
    },
  ];

  return { sessions, policy, training };
}

// ── GET Handler ─────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const { sessions, policy, training } = getDemoData();
    const result = generateEmotionalRegulationSupportIntelligence(
      sessions,
      policy,
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    return NextResponse.json({
      ...result,
      meta: {
        strategyTypeLabels: getStrategyTypeLabels(),
        outcomeLevelLabels: getOutcomeLevelLabels(),
        ratingLabels: getRatingLabels(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate emotional regulation support intelligence", details: String(error) },
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

    const result = generateEmotionalRegulationSupportIntelligence(
      sessions as RegulationSession[],
      policy as RegulationPolicy | null,
      training as StaffRegulationTraining[],
      homeId || "unknown",
      periodStart,
      periodEnd,
    );

    return NextResponse.json({
      ...result,
      meta: {
        strategyTypeLabels: getStrategyTypeLabels(),
        outcomeLevelLabels: getOutcomeLevelLabels(),
        ratingLabels: getRatingLabels(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate emotional regulation support intelligence", details: String(error) },
      { status: 500 },
    );
  }
}
