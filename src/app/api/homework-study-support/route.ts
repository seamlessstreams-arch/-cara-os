// ══════════════════════════════════════════════════════════════════════════════
// API: /api/homework-study-support
//
// Homework & Study Support Intelligence
//
// GET  — Returns homework & study support metrics with demo data (Chamberlain House)
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateHomeworkStudySupportIntelligence,
  getStudyActivityTypeLabel,
  getEngagementLevelLabel,
  getRatingLabel,
} from "@/lib/homework-study-support";
import type {
  StudySession,
  StudySupportPolicy,
  StaffStudySupportTraining,
} from "@/lib/homework-study-support";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

function generateDemoData(): {
  sessions: StudySession[];
  policy: StudySupportPolicy;
  training: StaffStudySupportTraining[];
} {
  const sessions: StudySession[] = [
    {
      id: "ss-001",
      childId: "child-alex",
      childName: "Alex",
      sessionDate: "2026-05-05",
      activityType: "homework_help",
      engagementLevel: "highly_engaged",
      progressNoted: true,
      confidenceGrown: true,
      resourcesProvided: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "ss-002",
      childId: "child-alex",
      childName: "Alex",
      sessionDate: "2026-05-07",
      activityType: "revision_session",
      engagementLevel: "engaged",
      progressNoted: true,
      confidenceGrown: true,
      resourcesProvided: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "ss-003",
      childId: "child-alex",
      childName: "Alex",
      sessionDate: "2026-05-10",
      activityType: "reading_time",
      engagementLevel: "highly_engaged",
      progressNoted: true,
      confidenceGrown: true,
      resourcesProvided: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "ss-004",
      childId: "child-jordan",
      childName: "Jordan",
      sessionDate: "2026-05-06",
      activityType: "project_work",
      engagementLevel: "engaged",
      progressNoted: true,
      confidenceGrown: true,
      resourcesProvided: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "ss-005",
      childId: "child-jordan",
      childName: "Jordan",
      sessionDate: "2026-05-08",
      activityType: "exam_preparation",
      engagementLevel: "highly_engaged",
      progressNoted: true,
      confidenceGrown: true,
      resourcesProvided: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "ss-006",
      childId: "child-jordan",
      childName: "Jordan",
      sessionDate: "2026-05-12",
      activityType: "tutoring",
      engagementLevel: "engaged",
      progressNoted: true,
      confidenceGrown: true,
      resourcesProvided: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "ss-007",
      childId: "child-morgan",
      childName: "Morgan",
      sessionDate: "2026-05-09",
      activityType: "study_skills_coaching",
      engagementLevel: "highly_engaged",
      progressNoted: true,
      confidenceGrown: true,
      resourcesProvided: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
    {
      id: "ss-008",
      childId: "child-morgan",
      childName: "Morgan",
      sessionDate: "2026-05-14",
      activityType: "educational_visit",
      engagementLevel: "engaged",
      progressNoted: true,
      confidenceGrown: true,
      resourcesProvided: true,
      documentedInPlan: true,
      staffSupported: true,
      feedbackGiven: true,
    },
  ];

  const policy: StudySupportPolicy = {
    id: "policy-001",
    homeworkSupportStrategy: true,
    quietStudySpaceProvision: true,
    educationalResourcePlan: true,
    tutoringArrangementFramework: true,
    schoolLiaisonProtocol: true,
    examSupportGuidance: true,
    regularReview: true,
  };

  const training: StaffStudySupportTraining[] = [
    {
      id: "sst-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      educationalSupport: true,
      studySkillsCoaching: true,
      motivationalTechniques: true,
      senAwareness: true,
      schoolLiaison: true,
      resourceManagement: true,
    },
    {
      id: "sst-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      educationalSupport: true,
      studySkillsCoaching: true,
      motivationalTechniques: true,
      senAwareness: true,
      schoolLiaison: true,
      resourceManagement: true,
    },
    {
      id: "sst-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      educationalSupport: true,
      studySkillsCoaching: true,
      motivationalTechniques: true,
      senAwareness: true,
      schoolLiaison: true,
      resourceManagement: true,
    },
    {
      id: "sst-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      educationalSupport: true,
      studySkillsCoaching: true,
      motivationalTechniques: true,
      senAwareness: true,
      schoolLiaison: true,
      resourceManagement: true,
    },
  ];

  return { sessions, policy, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { sessions, policy, training } = generateDemoData();

  const result = generateHomeworkStudySupportIntelligence(
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
          activityType: getStudyActivityTypeLabel(s.activityType),
          engagement: getEngagementLevelLabel(s.engagementLevel),
          progressNoted: s.progressNoted,
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
    sessions?: StudySession[];
    policy?: StudySupportPolicy | null;
    training?: StaffStudySupportTraining[];
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

  const result = generateHomeworkStudySupportIntelligence(
    sessions ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
