// ══════════════════════════════════════════════════════════════════════════════
// API: /api/sleep-hygiene-quality
//
// Sleep Hygiene Quality Intelligence
//
// GET  — Returns sleep hygiene quality metrics with demo data (Chamberlain House)
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateSleepHygieneQualityIntelligence,
  getSleepTypeLabel,
  getSleepQualityLabel,
  getRatingLabel,
} from "@/lib/sleep-hygiene-quality";
import type {
  SleepRecord,
  SleepPolicy,
  StaffSleepTraining,
} from "@/lib/sleep-hygiene-quality";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function generateDemoData(): {
  records: SleepRecord[];
  policy: SleepPolicy;
  training: StaffSleepTraining[];
} {
  const records: SleepRecord[] = [
    {
      id: "sr-001",
      childId: "child-alex",
      childName: "Alex",
      recordDate: "2026-05-05",
      sleepType: "bedtime_routine",
      sleepQuality: "excellent",
      routineFollowed: true,
      environmentSuitable: true,
      restfulSleep: true,
      documentedInPlan: true,
      staffMonitored: true,
      feedbackGiven: true,
    },
    {
      id: "sr-002",
      childId: "child-alex",
      childName: "Alex",
      recordDate: "2026-05-06",
      sleepType: "night_check",
      sleepQuality: "good",
      routineFollowed: true,
      environmentSuitable: true,
      restfulSleep: true,
      documentedInPlan: true,
      staffMonitored: true,
      feedbackGiven: true,
    },
    {
      id: "sr-003",
      childId: "child-jordan",
      childName: "Jordan",
      recordDate: "2026-05-05",
      sleepType: "morning_wakeup",
      sleepQuality: "good",
      routineFollowed: true,
      environmentSuitable: true,
      restfulSleep: true,
      documentedInPlan: true,
      staffMonitored: true,
      feedbackGiven: true,
    },
    {
      id: "sr-004",
      childId: "child-jordan",
      childName: "Jordan",
      recordDate: "2026-05-06",
      sleepType: "sleep_environment_review",
      sleepQuality: "good",
      routineFollowed: true,
      environmentSuitable: true,
      restfulSleep: true,
      documentedInPlan: true,
      staffMonitored: true,
      feedbackGiven: false,
    },
    {
      id: "sr-005",
      childId: "child-jordan",
      childName: "Jordan",
      recordDate: "2026-05-07",
      sleepType: "relaxation_activity",
      sleepQuality: "excellent",
      routineFollowed: true,
      environmentSuitable: true,
      restfulSleep: true,
      documentedInPlan: true,
      staffMonitored: true,
      feedbackGiven: true,
    },
    {
      id: "sr-006",
      childId: "child-morgan",
      childName: "Morgan",
      recordDate: "2026-05-05",
      sleepType: "screen_time_management",
      sleepQuality: "good",
      routineFollowed: true,
      environmentSuitable: true,
      restfulSleep: true,
      documentedInPlan: true,
      staffMonitored: true,
      feedbackGiven: true,
    },
    {
      id: "sr-007",
      childId: "child-morgan",
      childName: "Morgan",
      recordDate: "2026-05-06",
      sleepType: "sleep_hygiene_education",
      sleepQuality: "excellent",
      routineFollowed: true,
      environmentSuitable: true,
      restfulSleep: true,
      documentedInPlan: true,
      staffMonitored: true,
      feedbackGiven: true,
    },
    {
      id: "sr-008",
      childId: "child-morgan",
      childName: "Morgan",
      recordDate: "2026-05-07",
      sleepType: "sleep_concern_assessment",
      sleepQuality: "good",
      routineFollowed: true,
      environmentSuitable: true,
      restfulSleep: true,
      documentedInPlan: true,
      staffMonitored: true,
      feedbackGiven: true,
    },
  ];

  const policy: SleepPolicy = {
    id: "policy-001",
    bedtimeRoutineGuideline: true,
    sleepEnvironmentStandard: true,
    nightMonitoringProcedure: true,
    screenTimePolicy: true,
    sleepConcernProtocol: true,
    relaxationProgramme: true,
    regularReview: true,
  };

  const training: StaffSleepTraining[] = [
    {
      id: "sst-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      sleepHygieneKnowledge: true,
      nightSupervision: true,
      relaxationTechniques: true,
      sleepDisorderAwareness: true,
      traumaInformedSleep: true,
      environmentManagement: true,
    },
    {
      id: "sst-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      sleepHygieneKnowledge: true,
      nightSupervision: true,
      relaxationTechniques: true,
      sleepDisorderAwareness: true,
      traumaInformedSleep: true,
      environmentManagement: true,
    },
    {
      id: "sst-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      sleepHygieneKnowledge: true,
      nightSupervision: true,
      relaxationTechniques: true,
      sleepDisorderAwareness: true,
      traumaInformedSleep: true,
      environmentManagement: true,
    },
    {
      id: "sst-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      sleepHygieneKnowledge: true,
      nightSupervision: true,
      relaxationTechniques: true,
      sleepDisorderAwareness: true,
      traumaInformedSleep: true,
      environmentManagement: true,
    },
  ];

  return { records, policy, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { records, policy, training } = generateDemoData();

  const result = generateSleepHygieneQualityIntelligence(
    records,
    policy,
    training,
    "oak-house",
    "2026-04-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        sleepTypeLabels: Object.fromEntries(
          (["bedtime_routine", "night_check", "morning_wakeup", "sleep_environment_review", "sleep_concern_assessment", "relaxation_activity", "screen_time_management", "sleep_hygiene_education"] as const).map((t) => [t, getSleepTypeLabel(t)]),
        ),
        sleepQualityLabels: Object.fromEntries(
          (["excellent", "good", "fair", "poor", "very_poor"] as const).map((q) => [q, getSleepQualityLabel(q)]),
        ),
        ratingLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map((r) => [r, getRatingLabel(r)]),
        ),
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
    records,
    policy,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    records?: SleepRecord[];
    policy?: SleepPolicy | null;
    training?: StaffSleepTraining[];
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

  const result = generateSleepHygieneQualityIntelligence(
    records ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
