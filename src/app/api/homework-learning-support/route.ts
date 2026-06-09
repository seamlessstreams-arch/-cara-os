// ══════════════════════════════════════════════════════════════════════════════
// API: /api/homework-learning-support
//
// Homework & Learning Support Intelligence
//
// GET  — Returns homework & learning support metrics with demo data (Chamberlain House)
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateHomeworkLearningSupportIntelligence,
  getSubjectAreaLabel,
  getEngagementLevelLabel,
  getRatingLabel,
} from "@/lib/homework-learning-support";
import type {
  HomeworkSession,
  LearningPolicy,
  StaffLearningTraining,
} from "@/lib/homework-learning-support";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function generateDemoData(): {
  sessions: HomeworkSession[];
  policy: LearningPolicy;
  training: StaffLearningTraining[];
} {
  const sessions: HomeworkSession[] = [
    {
      id: "hw-001",
      childId: "child-alex",
      childName: "Alex",
      sessionDate: "2026-03-10",
      subjectArea: "maths",
      engagementLevel: "enthusiastic",
      taskCompleted: true,
      staffSupported: true,
      quietSpaceProvided: true,
      resourcesAvailable: true,
      progressNoted: true,
      documentedInLog: true,
    },
    {
      id: "hw-002",
      childId: "child-alex",
      childName: "Alex",
      sessionDate: "2026-03-17",
      subjectArea: "english",
      engagementLevel: "willing",
      taskCompleted: true,
      staffSupported: true,
      quietSpaceProvided: true,
      resourcesAvailable: true,
      progressNoted: true,
      documentedInLog: true,
    },
    {
      id: "hw-003",
      childId: "child-alex",
      childName: "Alex",
      sessionDate: "2026-04-02",
      subjectArea: "science",
      engagementLevel: "enthusiastic",
      taskCompleted: true,
      staffSupported: true,
      quietSpaceProvided: true,
      resourcesAvailable: true,
      progressNoted: true,
      documentedInLog: true,
    },
    {
      id: "hw-004",
      childId: "child-jordan",
      childName: "Jordan",
      sessionDate: "2026-03-12",
      subjectArea: "humanities",
      engagementLevel: "willing",
      taskCompleted: true,
      staffSupported: true,
      quietSpaceProvided: true,
      resourcesAvailable: true,
      progressNoted: false,
      documentedInLog: true,
    },
    {
      id: "hw-005",
      childId: "child-jordan",
      childName: "Jordan",
      sessionDate: "2026-03-25",
      subjectArea: "maths",
      engagementLevel: "reluctant",
      taskCompleted: false,
      staffSupported: true,
      quietSpaceProvided: true,
      resourcesAvailable: true,
      progressNoted: false,
      documentedInLog: true,
    },
    {
      id: "hw-006",
      childId: "child-jordan",
      childName: "Jordan",
      sessionDate: "2026-04-15",
      subjectArea: "technology",
      engagementLevel: "enthusiastic",
      taskCompleted: true,
      staffSupported: true,
      quietSpaceProvided: true,
      resourcesAvailable: true,
      progressNoted: true,
      documentedInLog: true,
    },
    {
      id: "hw-007",
      childId: "child-morgan",
      childName: "Morgan",
      sessionDate: "2026-03-14",
      subjectArea: "creative_arts",
      engagementLevel: "enthusiastic",
      taskCompleted: true,
      staffSupported: true,
      quietSpaceProvided: true,
      resourcesAvailable: true,
      progressNoted: true,
      documentedInLog: true,
    },
    {
      id: "hw-008",
      childId: "child-morgan",
      childName: "Morgan",
      sessionDate: "2026-04-20",
      subjectArea: "languages",
      engagementLevel: "willing",
      taskCompleted: true,
      staffSupported: false,
      quietSpaceProvided: true,
      resourcesAvailable: false,
      progressNoted: true,
      documentedInLog: true,
    },
  ];

  const policy: LearningPolicy = {
    id: "policy-001",
    homeworkPolicy: true,
    quietStudySpaces: true,
    learningResources: true,
    educationLiaison: true,
    individualLearningPlans: true,
    tutoringProvision: true,
    regularReview: true,
  };

  const training: StaffLearningTraining[] = [
    {
      id: "slt-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      homeworkSupport: true,
      learningDifficulties: true,
      educationalMotivation: true,
      senAwareness: true,
      digitalLiteracy: true,
      communicationWithSchools: true,
    },
    {
      id: "slt-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      homeworkSupport: true,
      learningDifficulties: true,
      educationalMotivation: true,
      senAwareness: true,
      digitalLiteracy: false,
      communicationWithSchools: true,
    },
    {
      id: "slt-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      homeworkSupport: true,
      learningDifficulties: true,
      educationalMotivation: true,
      senAwareness: true,
      digitalLiteracy: true,
      communicationWithSchools: false,
    },
    {
      id: "slt-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      homeworkSupport: true,
      learningDifficulties: true,
      educationalMotivation: true,
      senAwareness: true,
      digitalLiteracy: true,
      communicationWithSchools: true,
    },
  ];

  return { sessions, policy, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { sessions, policy, training } = generateDemoData();

  const result = generateHomeworkLearningSupportIntelligence(
    sessions,
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
        sessionSummary: sessions.map((s) => ({
          id: s.id,
          childName: s.childName,
          date: s.sessionDate,
          subject: getSubjectAreaLabel(s.subjectArea),
          engagement: getEngagementLevelLabel(s.engagementLevel),
          completed: s.taskCompleted,
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
    sessions,
    policy,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    sessions?: HomeworkSession[];
    policy?: LearningPolicy | null;
    training?: StaffLearningTraining[];
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

  const result = generateHomeworkLearningSupportIntelligence(
    sessions ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
