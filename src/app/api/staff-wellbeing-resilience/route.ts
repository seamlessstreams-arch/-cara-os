// ══════════════════════════════════════════════════════════════════════════════
// API: /api/staff-wellbeing-resilience
//
// Staff Wellbeing & Resilience Intelligence
//
// GET  — Returns staff wellbeing metrics with demo data (Chamberlain House)
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateStaffWellbeingResilienceIntelligence,
  getWellbeingTypeLabel,
  getWellbeingScoreLabel,
  getRatingLabel,
} from "@/lib/staff-wellbeing-resilience";
import type {
  WellbeingAssessment,
  WellbeingPolicy,
  StaffResilienceTraining,
  WellbeingType,
  WellbeingScore,
} from "@/lib/staff-wellbeing-resilience";

// ── Label Maps for meta ──────────────────────────────────────────────────

const ALL_WELLBEING_TYPES: WellbeingType[] = [
  "supervision_session",
  "wellbeing_check",
  "stress_assessment",
  "resilience_review",
  "team_debrief",
  "reflective_practice",
  "employee_assistance",
  "peer_support",
];

const ALL_WELLBEING_SCORES: WellbeingScore[] = [
  "excellent",
  "good",
  "moderate",
  "poor",
  "critical",
];

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function generateDemoData(): {
  assessments: WellbeingAssessment[];
  policy: WellbeingPolicy;
  training: StaffResilienceTraining[];
} {
  const assessments: WellbeingAssessment[] = [
    {
      id: "wa-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      assessmentDate: "2026-01-15",
      wellbeingType: "supervision_session",
      wellbeingScore: "good",
      stressManaged: true,
      supportProvided: true,
      workloadReviewed: true,
      actionPlanCreated: true,
      followUpScheduled: true,
      feedbackGiven: true,
    },
    {
      id: "wa-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      assessmentDate: "2026-01-22",
      wellbeingType: "wellbeing_check",
      wellbeingScore: "excellent",
      stressManaged: true,
      supportProvided: true,
      workloadReviewed: true,
      actionPlanCreated: true,
      followUpScheduled: true,
      feedbackGiven: true,
    },
    {
      id: "wa-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      assessmentDate: "2026-02-03",
      wellbeingType: "stress_assessment",
      wellbeingScore: "good",
      stressManaged: true,
      supportProvided: true,
      workloadReviewed: true,
      actionPlanCreated: true,
      followUpScheduled: true,
      feedbackGiven: true,
    },
    {
      id: "wa-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      assessmentDate: "2026-02-14",
      wellbeingType: "resilience_review",
      wellbeingScore: "excellent",
      stressManaged: true,
      supportProvided: true,
      workloadReviewed: true,
      actionPlanCreated: true,
      followUpScheduled: true,
      feedbackGiven: true,
    },
    {
      id: "wa-005",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      assessmentDate: "2026-03-01",
      wellbeingType: "team_debrief",
      wellbeingScore: "good",
      stressManaged: true,
      supportProvided: true,
      workloadReviewed: true,
      actionPlanCreated: true,
      followUpScheduled: true,
      feedbackGiven: true,
    },
    {
      id: "wa-006",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      assessmentDate: "2026-03-10",
      wellbeingType: "reflective_practice",
      wellbeingScore: "good",
      stressManaged: true,
      supportProvided: true,
      workloadReviewed: true,
      actionPlanCreated: true,
      followUpScheduled: true,
      feedbackGiven: true,
    },
    {
      id: "wa-007",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      assessmentDate: "2026-04-05",
      wellbeingType: "employee_assistance",
      wellbeingScore: "excellent",
      stressManaged: true,
      supportProvided: true,
      workloadReviewed: true,
      actionPlanCreated: true,
      followUpScheduled: true,
      feedbackGiven: true,
    },
    {
      id: "wa-008",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      assessmentDate: "2026-04-20",
      wellbeingType: "peer_support",
      wellbeingScore: "good",
      stressManaged: true,
      supportProvided: true,
      workloadReviewed: true,
      actionPlanCreated: true,
      followUpScheduled: true,
      feedbackGiven: true,
    },
  ];

  const policy: WellbeingPolicy = {
    id: "wp-001",
    staffWellbeingStrategy: true,
    burnoutPreventionPlan: true,
    supervisionFramework: true,
    workloadManagementPolicy: true,
    employeeAssistanceProgramme: true,
    peerSupportNetwork: true,
    regularReview: true,
  };

  const training: StaffResilienceTraining[] = [
    {
      id: "srt-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      stressManagement: true,
      emotionalResilience: true,
      boundaryMaintenance: true,
      selfCare: true,
      teamSupport: true,
      debriefingSkills: true,
    },
    {
      id: "srt-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      stressManagement: true,
      emotionalResilience: true,
      boundaryMaintenance: true,
      selfCare: true,
      teamSupport: true,
      debriefingSkills: true,
    },
    {
      id: "srt-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      stressManagement: true,
      emotionalResilience: true,
      boundaryMaintenance: true,
      selfCare: true,
      teamSupport: true,
      debriefingSkills: true,
    },
    {
      id: "srt-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      stressManagement: true,
      emotionalResilience: true,
      boundaryMaintenance: true,
      selfCare: true,
      teamSupport: true,
      debriefingSkills: true,
    },
  ];

  return { assessments, policy, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { assessments, policy, training } = generateDemoData();

  const result = generateStaffWellbeingResilienceIntelligence(
    assessments,
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
        assessmentSummary: assessments.map((a) => ({
          id: a.id,
          staffName: a.staffName,
          date: a.assessmentDate,
          type: getWellbeingTypeLabel(a.wellbeingType),
          score: getWellbeingScoreLabel(a.wellbeingScore),
        })),
        ratingLabel: getRatingLabel(result.rating),
        labelMaps: {
          wellbeingTypes: Object.fromEntries(
            ALL_WELLBEING_TYPES.map((t) => [t, getWellbeingTypeLabel(t)]),
          ),
          wellbeingScores: Object.fromEntries(
            ALL_WELLBEING_SCORES.map((s) => [s, getWellbeingScoreLabel(s)]),
          ),
        },
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
    assessments,
    policy,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    assessments?: WellbeingAssessment[];
    policy?: WellbeingPolicy | null;
    training?: StaffResilienceTraining[];
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

  const result = generateStaffWellbeingResilienceIntelligence(
    assessments ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
