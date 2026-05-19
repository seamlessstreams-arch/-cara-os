// ══════════════════════════════════════════════════════════════════════════════
// API: /api/education-attainment-progress
//
// Education Attainment & Progress Intelligence
//
// GET  — Returns education attainment metrics with demo data (Oak House)
// POST — Accepts custom data and returns analysis
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateEducationAttainmentProgressIntelligence,
  getEducationAreaLabel,
  getProgressLevelLabel,
  getRatingLabel,
} from "@/lib/education-attainment-progress";
import type {
  EducationRecord,
  EducationPolicy,
  StaffEducationTraining,
} from "@/lib/education-attainment-progress";

// ── Demo Data: Oak House ──────────────────────────────────────────────────

function generateDemoData(): {
  records: EducationRecord[];
  policy: EducationPolicy;
  training: StaffEducationTraining[];
} {
  const records: EducationRecord[] = [
    {
      id: "edu-001",
      childId: "child-alex", childName: "Alex",
      recordDate: "2026-02-01",
      educationArea: "attendance", progressLevel: "expected",
      pepUpdated: true, schoolAttendanceGood: true, staffAdvocacyProvided: true,
      documentedInPlan: true, virtualSchoolLinked: true, childViewsCaptured: true,
    },
    {
      id: "edu-002",
      childId: "child-alex", childName: "Alex",
      recordDate: "2026-03-01",
      educationArea: "academic_progress", progressLevel: "exceeding",
      pepUpdated: true, schoolAttendanceGood: true, staffAdvocacyProvided: true,
      documentedInPlan: true, virtualSchoolLinked: true, childViewsCaptured: true,
    },
    {
      id: "edu-003",
      childId: "child-alex", childName: "Alex",
      recordDate: "2026-04-01",
      educationArea: "pep_review", progressLevel: "expected",
      pepUpdated: true, schoolAttendanceGood: true, staffAdvocacyProvided: true,
      documentedInPlan: true, virtualSchoolLinked: true, childViewsCaptured: true,
    },
    {
      id: "edu-004",
      childId: "child-jordan", childName: "Jordan",
      recordDate: "2026-02-15",
      educationArea: "homework_support", progressLevel: "developing",
      pepUpdated: true, schoolAttendanceGood: true, staffAdvocacyProvided: true,
      documentedInPlan: true, virtualSchoolLinked: false, childViewsCaptured: true,
    },
    {
      id: "edu-005",
      childId: "child-jordan", childName: "Jordan",
      recordDate: "2026-03-15",
      educationArea: "extra_curricular", progressLevel: "expected",
      pepUpdated: true, schoolAttendanceGood: false, staffAdvocacyProvided: true,
      documentedInPlan: true, virtualSchoolLinked: true, childViewsCaptured: false,
    },
    {
      id: "edu-006",
      childId: "child-jordan", childName: "Jordan",
      recordDate: "2026-04-15",
      educationArea: "sen_support", progressLevel: "developing",
      pepUpdated: false, schoolAttendanceGood: true, staffAdvocacyProvided: false,
      documentedInPlan: false, virtualSchoolLinked: false, childViewsCaptured: true,
    },
    {
      id: "edu-007",
      childId: "child-morgan", childName: "Morgan",
      recordDate: "2026-01-20",
      educationArea: "careers_guidance", progressLevel: "expected",
      pepUpdated: true, schoolAttendanceGood: true, staffAdvocacyProvided: true,
      documentedInPlan: true, virtualSchoolLinked: true, childViewsCaptured: true,
    },
    {
      id: "edu-008",
      childId: "child-morgan", childName: "Morgan",
      recordDate: "2026-02-20",
      educationArea: "school_liaison", progressLevel: "exceeding",
      pepUpdated: true, schoolAttendanceGood: true, staffAdvocacyProvided: true,
      documentedInPlan: true, virtualSchoolLinked: true, childViewsCaptured: true,
    },
    {
      id: "edu-009",
      childId: "child-morgan", childName: "Morgan",
      recordDate: "2026-03-20",
      educationArea: "attendance", progressLevel: "expected",
      pepUpdated: true, schoolAttendanceGood: true, staffAdvocacyProvided: true,
      documentedInPlan: true, virtualSchoolLinked: true, childViewsCaptured: true,
    },
    {
      id: "edu-010",
      childId: "child-morgan", childName: "Morgan",
      recordDate: "2026-04-20",
      educationArea: "academic_progress", progressLevel: "below",
      pepUpdated: false, schoolAttendanceGood: false, staffAdvocacyProvided: false,
      documentedInPlan: false, virtualSchoolLinked: false, childViewsCaptured: false,
    },
  ];

  const policy: EducationPolicy = {
    id: "pol-001",
    educationChampionRole: true,
    pepReviewSchedule: true,
    attendanceMonitoring: true,
    homeworkSupportPlan: true,
    senCoordination: true,
    virtualSchoolPartnership: true,
    regularReview: true,
  };

  const training: StaffEducationTraining[] = [
    {
      id: "train-001",
      staffId: "staff-sarah", staffName: "Sarah Johnson",
      educationSupport: true, pepProcess: true, attendanceImportance: true,
      senAwareness: true, homeworkStrategies: true, virtualSchoolProtocol: true,
    },
    {
      id: "train-002",
      staffId: "staff-tom", staffName: "Tom Richards",
      educationSupport: true, pepProcess: true, attendanceImportance: true,
      senAwareness: true, homeworkStrategies: false, virtualSchoolProtocol: false,
    },
    {
      id: "train-003",
      staffId: "staff-lisa", staffName: "Lisa Williams",
      educationSupport: true, pepProcess: true, attendanceImportance: true,
      senAwareness: false, homeworkStrategies: true, virtualSchoolProtocol: true,
    },
    {
      id: "train-004",
      staffId: "staff-darren", staffName: "Darren Laville",
      educationSupport: true, pepProcess: true, attendanceImportance: true,
      senAwareness: true, homeworkStrategies: true, virtualSchoolProtocol: true,
    },
  ];

  return { records, policy, training };
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const { records, policy, training } = generateDemoData();

  const result = generateEducationAttainmentProgressIntelligence(
    records,
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
        recordSummary: records.map((r) => ({
          id: r.id,
          childName: r.childName,
          date: r.recordDate,
          area: getEducationAreaLabel(r.educationArea),
          progress: getProgressLevelLabel(r.progressLevel),
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
    records,
    policy,
    training,
    homeId,
    periodStart,
    periodEnd,
  } = body as {
    records?: EducationRecord[];
    policy?: EducationPolicy | null;
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

  const result = generateEducationAttainmentProgressIntelligence(
    records ?? [],
    policy ?? null,
    training ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
