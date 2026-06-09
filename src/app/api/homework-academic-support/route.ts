// ==============================================================================
// API: /api/homework-academic-support
//
// Homework & Academic Support Intelligence
//
// GET  -- Returns homework/academic support metrics with demo data (Chamberlain House)
// POST -- Accepts custom data and returns analysis
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  generateHomeworkAcademicSupportIntelligence,
  getSubjectLabel,
  getCompletionLabel,
  getProgressLabel,
  getRatingLabel,
} from "@/lib/homework-academic-support";
import type {
  HomeworkRecord,
  AcademicIntervention,
  EducationalResource,
  StaffEducationTraining,
} from "@/lib/homework-academic-support";

// -- Demo Data: Chamberlain House -----------------------------------------------------

function generateDemoData(): {
  records: HomeworkRecord[];
  interventions: AcademicIntervention[];
  resources: EducationalResource[];
  training: StaffEducationTraining[];
} {
  const records: HomeworkRecord[] = [
    {
      id: "hw-001",
      childId: "child-alex",
      childName: "Alex",
      date: "2026-05-05",
      subject: "english",
      completionStatus: "completed",
      supportProvided: ["staff_help", "quiet_space"],
      timeSpentMinutes: 45,
      staffSupporter: "Sarah Johnson",
      difficultyEncountered: false,
      schoolFeedbackPositive: true,
    },
    {
      id: "hw-002",
      childId: "child-alex",
      childName: "Alex",
      date: "2026-05-07",
      subject: "maths",
      completionStatus: "completed",
      supportProvided: ["staff_help"],
      timeSpentMinutes: 60,
      staffSupporter: "Tom Richards",
      difficultyEncountered: true,
      schoolFeedbackPositive: true,
    },
    {
      id: "hw-003",
      childId: "child-alex",
      childName: "Alex",
      date: "2026-05-12",
      subject: "science",
      completionStatus: "completed",
      supportProvided: ["online_resource"],
      timeSpentMinutes: 40,
      difficultyEncountered: false,
      schoolFeedbackPositive: true,
    },
    {
      id: "hw-004",
      childId: "child-jordan",
      childName: "Jordan",
      date: "2026-05-05",
      subject: "maths",
      completionStatus: "partially_completed",
      supportProvided: ["staff_help", "additional_time"],
      timeSpentMinutes: 50,
      staffSupporter: "Lisa Williams",
      difficultyEncountered: true,
      schoolFeedbackPositive: false,
    },
    {
      id: "hw-005",
      childId: "child-jordan",
      childName: "Jordan",
      date: "2026-05-08",
      subject: "english",
      completionStatus: "completed",
      supportProvided: ["staff_help"],
      timeSpentMinutes: 35,
      staffSupporter: "Sarah Johnson",
      difficultyEncountered: false,
      schoolFeedbackPositive: true,
    },
    {
      id: "hw-006",
      childId: "child-jordan",
      childName: "Jordan",
      date: "2026-05-10",
      subject: "humanities",
      completionStatus: "completed",
      supportProvided: ["peer_support"],
      timeSpentMinutes: 30,
      difficultyEncountered: false,
      schoolFeedbackPositive: true,
    },
    {
      id: "hw-007",
      childId: "child-morgan",
      childName: "Morgan",
      date: "2026-05-06",
      subject: "science",
      completionStatus: "completed",
      supportProvided: ["tutor"],
      timeSpentMinutes: 55,
      staffSupporter: "Darren Laville",
      difficultyEncountered: false,
      schoolFeedbackPositive: true,
    },
    {
      id: "hw-008",
      childId: "child-morgan",
      childName: "Morgan",
      date: "2026-05-09",
      subject: "languages",
      completionStatus: "not_completed",
      supportProvided: ["none"],
      timeSpentMinutes: 10,
      difficultyEncountered: true,
      schoolFeedbackPositive: false,
    },
    {
      id: "hw-009",
      childId: "child-morgan",
      childName: "Morgan",
      date: "2026-05-13",
      subject: "technology",
      completionStatus: "completed",
      supportProvided: ["staff_help", "online_resource"],
      timeSpentMinutes: 40,
      staffSupporter: "Tom Richards",
      difficultyEncountered: false,
      schoolFeedbackPositive: true,
    },
    {
      id: "hw-010",
      childId: "child-alex",
      childName: "Alex",
      date: "2026-05-14",
      subject: "creative_arts",
      completionStatus: "completed",
      supportProvided: ["quiet_space"],
      timeSpentMinutes: 30,
      difficultyEncountered: false,
      schoolFeedbackPositive: true,
    },
  ];

  const interventions: AcademicIntervention[] = [
    {
      id: "int-001",
      childId: "child-jordan",
      childName: "Jordan",
      interventionType: "tutoring",
      startDate: "2026-04-15",
      provider: "Bright Futures Tutoring",
      sessionsPlanned: 8,
      sessionsAttended: 7,
      progressMade: "at_expected",
      pepLinked: true,
    },
    {
      id: "int-002",
      childId: "child-morgan",
      childName: "Morgan",
      interventionType: "reading_programme",
      startDate: "2026-04-20",
      provider: "In-house reading support",
      sessionsPlanned: 10,
      sessionsAttended: 8,
      progressMade: "above_expected",
      pepLinked: true,
    },
  ];

  const resources: EducationalResource[] = [
    {
      id: "res-001",
      resourceType: "quiet_study_area",
      available: true,
      lastChecked: "2026-05-01",
      adequateForNeeds: true,
    },
    {
      id: "res-002",
      resourceType: "computer_access",
      available: true,
      lastChecked: "2026-05-01",
      adequateForNeeds: true,
    },
    {
      id: "res-003",
      resourceType: "books_library",
      available: true,
      lastChecked: "2026-05-01",
      adequateForNeeds: true,
    },
    {
      id: "res-004",
      resourceType: "stationery",
      available: true,
      lastChecked: "2026-05-01",
      adequateForNeeds: true,
    },
    {
      id: "res-005",
      resourceType: "internet_access",
      available: true,
      lastChecked: "2026-05-01",
      adequateForNeeds: true,
    },
    {
      id: "res-006",
      resourceType: "specialist_software",
      available: false,
      lastChecked: "2026-05-01",
      adequateForNeeds: false,
    },
    {
      id: "res-007",
      resourceType: "tutor_access",
      available: true,
      lastChecked: "2026-05-01",
      adequateForNeeds: true,
    },
  ];

  const training: StaffEducationTraining[] = [
    {
      id: "set-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      homeworkSupportTrained: true,
      pepAwareness: true,
      senAwareness: true,
      educationAdvocacy: true,
      examSupportTrained: true,
      attachmentAwareEducation: true,
    },
    {
      id: "set-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      homeworkSupportTrained: true,
      pepAwareness: true,
      senAwareness: true,
      educationAdvocacy: true,
      examSupportTrained: true,
      attachmentAwareEducation: true,
    },
    {
      id: "set-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      homeworkSupportTrained: true,
      pepAwareness: true,
      senAwareness: true,
      educationAdvocacy: true,
      examSupportTrained: false,
      attachmentAwareEducation: true,
    },
    {
      id: "set-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      homeworkSupportTrained: true,
      pepAwareness: true,
      senAwareness: true,
      educationAdvocacy: true,
      examSupportTrained: true,
      attachmentAwareEducation: true,
    },
  ];

  return { records, interventions, resources, training };
}

// -- GET ----------------------------------------------------------------------

export async function GET() {
  const { records, interventions, resources, training } = generateDemoData();

  const result = generateHomeworkAcademicSupportIntelligence(
    records,
    interventions,
    resources,
    training,
    "oak-house",
    "2026-04-01",
    "2026-05-19",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        homeworkSummary: records.map((r) => ({
          id: r.id,
          childName: r.childName,
          date: r.date,
          subject: getSubjectLabel(r.subject),
          status: getCompletionLabel(r.completionStatus),
        })),
        interventionSummary: interventions.map((i) => ({
          id: i.id,
          childName: i.childName,
          type: i.interventionType,
          progress: getProgressLabel(i.progressMade),
        })),
        ratingLabel: getRatingLabel(result.rating),
      },
    },
  });
}

// -- POST ---------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    records,
    interventions,
    resources,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    records?: HomeworkRecord[];
    interventions?: AcademicIntervention[];
    resources?: EducationalResource[];
    training?: StaffEducationTraining[];
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

  const result = generateHomeworkAcademicSupportIntelligence(
    records ?? [],
    interventions ?? [],
    resources ?? [],
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
