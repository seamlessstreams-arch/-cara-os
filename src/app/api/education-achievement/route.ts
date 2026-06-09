// ══════════════════════════════════════════════════════════════════════════════
// API: /api/education-achievement
//
// Education Achievement Intelligence
//
// GET  — Returns education assessment with Chamberlain House demo data
// POST — Accepts custom data and returns tailored assessment
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import {
  generateEducationAchievementIntelligence,
  getSchoolTypeLabel,
  getAttendanceStatusLabel,
  getPEPStatusLabel,
  getPEPQualityLabel,
  getAcademicProgressLabel,
  getExclusionTypeLabel,
  getRatingLabel,
} from "@/lib/education-achievement";
import type {
  AttendanceRecord,
  PEPRecord,
  AcademicOutcome,
  SchoolStability,
  ExclusionRecord,
} from "@/lib/education-achievement";

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

// Alex: mainstream school, 95% attendance, good PEP, expected progress
const ALEX_ATTENDANCE: AttendanceRecord[] = [
  ...Array.from({ length: 19 }, (_, i): AttendanceRecord => ({
    id: `att-alex-${i}`,
    childId: "child-alex",
    childName: "Alex",
    date: `2026-03-${String(i + 1).padStart(2, "0")}`,
    status: "present",
    schoolName: "Oakwood Academy",
  })),
  { id: "att-alex-20", childId: "child-alex", childName: "Alex", date: "2026-03-20", status: "authorised_absence", schoolName: "Oakwood Academy" },
];

// Jordan: PRU, 85% attendance, overdue PEP, below expected, 1 fixed-term exclusion
const JORDAN_ATTENDANCE: AttendanceRecord[] = [
  ...Array.from({ length: 17 }, (_, i): AttendanceRecord => ({
    id: `att-jordan-${i}`,
    childId: "child-jordan",
    childName: "Jordan",
    date: `2026-03-${String(i + 1).padStart(2, "0")}`,
    status: "present",
    schoolName: "Bridge PRU",
  })),
  { id: "att-jordan-18", childId: "child-jordan", childName: "Jordan", date: "2026-03-18", status: "unauthorised_absence", schoolName: "Bridge PRU" },
  { id: "att-jordan-19", childId: "child-jordan", childName: "Jordan", date: "2026-03-19", status: "unauthorised_absence", schoolName: "Bridge PRU" },
  { id: "att-jordan-20", childId: "child-jordan", childName: "Jordan", date: "2026-03-20", status: "excluded", schoolName: "Bridge PRU" },
];

// Morgan: mainstream, 92% attendance, outstanding PEP, exceeding in English/Maths
const MORGAN_ATTENDANCE: AttendanceRecord[] = [
  ...Array.from({ length: 23 }, (_, i): AttendanceRecord => ({
    id: `att-morgan-${i}`,
    childId: "child-morgan",
    childName: "Morgan",
    date: `2026-03-${String(i + 1).padStart(2, "0")}`,
    status: "present",
    schoolName: "Riverside High",
  })),
  { id: "att-morgan-24", childId: "child-morgan", childName: "Morgan", date: "2026-03-24", status: "authorised_absence", schoolName: "Riverside High" },
  { id: "att-morgan-25", childId: "child-morgan", childName: "Morgan", date: "2026-03-25", status: "authorised_absence", schoolName: "Riverside High" },
];

const DEMO_ATTENDANCE: AttendanceRecord[] = [
  ...ALEX_ATTENDANCE,
  ...JORDAN_ATTENDANCE,
  ...MORGAN_ATTENDANCE,
];

const DEMO_PEPS: PEPRecord[] = [
  { id: "pep-alex", childId: "child-alex", childName: "Alex", pepDate: "2026-02-15", status: "current", quality: "good", childViewsIncluded: true, targetsSMART: true, virtualSchoolInvolved: true, ppFundingUsed: true, reviewDate: "2026-05-15" },
  { id: "pep-jordan", childId: "child-jordan", childName: "Jordan", pepDate: "2025-11-01", status: "overdue", quality: "requires_improvement", childViewsIncluded: false, targetsSMART: false, virtualSchoolInvolved: false, ppFundingUsed: false, reviewDate: "2026-02-01" },
  { id: "pep-morgan", childId: "child-morgan", childName: "Morgan", pepDate: "2026-03-01", status: "current", quality: "outstanding", childViewsIncluded: true, targetsSMART: true, virtualSchoolInvolved: true, ppFundingUsed: true, reviewDate: "2026-06-01" },
];

const DEMO_OUTCOMES: AcademicOutcome[] = [
  { id: "out-alex-eng", childId: "child-alex", childName: "Alex", subject: "English", progress: "expected", assessmentDate: "2026-03-01" },
  { id: "out-alex-maths", childId: "child-alex", childName: "Alex", subject: "Maths", progress: "expected", assessmentDate: "2026-03-01" },
  { id: "out-alex-sci", childId: "child-alex", childName: "Alex", subject: "Science", progress: "expected", assessmentDate: "2026-03-01" },
  { id: "out-jordan-eng", childId: "child-jordan", childName: "Jordan", subject: "English", progress: "below_expected", assessmentDate: "2026-03-01" },
  { id: "out-jordan-maths", childId: "child-jordan", childName: "Jordan", subject: "Maths", progress: "below_expected", assessmentDate: "2026-03-01" },
  { id: "out-morgan-eng", childId: "child-morgan", childName: "Morgan", subject: "English", progress: "exceeding", assessmentDate: "2026-03-01" },
  { id: "out-morgan-maths", childId: "child-morgan", childName: "Morgan", subject: "Maths", progress: "exceeding", assessmentDate: "2026-03-01" },
  { id: "out-morgan-sci", childId: "child-morgan", childName: "Morgan", subject: "Science", progress: "expected", assessmentDate: "2026-03-01" },
  { id: "out-morgan-hist", childId: "child-morgan", childName: "Morgan", subject: "History", progress: "expected", assessmentDate: "2026-03-01" },
];

const DEMO_STABILITY: SchoolStability[] = [
  { id: "stab-alex", childId: "child-alex", childName: "Alex", schoolType: "mainstream", currentSchoolName: "Oakwood Academy", schoolChangesInYear: 0, daysOutOfEducation: 0 },
  { id: "stab-jordan", childId: "child-jordan", childName: "Jordan", schoolType: "pupil_referral_unit", currentSchoolName: "Bridge PRU", schoolChangesInYear: 1, reasonForChange: "Moved from mainstream following exclusion", daysOutOfEducation: 5 },
  { id: "stab-morgan", childId: "child-morgan", childName: "Morgan", schoolType: "mainstream", currentSchoolName: "Riverside High", schoolChangesInYear: 0, daysOutOfEducation: 0 },
];

const DEMO_EXCLUSIONS: ExclusionRecord[] = [
  { id: "excl-jordan-1", childId: "child-jordan", childName: "Jordan", exclusionType: "fixed_term", durationDays: 3, reason: "Persistent disruptive behaviour", alternativeProvisionArranged: true, reintegrationPlanInPlace: true },
];

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const result = generateEducationAchievementIntelligence(
    DEMO_ATTENDANCE,
    DEMO_PEPS,
    DEMO_OUTCOMES,
    DEMO_STABILITY,
    DEMO_EXCLUSIONS,
    "oak-house",
    "2026-01-01",
    "2026-05-18",
  );

  return NextResponse.json({
    data: {
      ...result,
      meta: {
        schoolTypeLabels: Object.fromEntries(
          (["mainstream", "special", "pupil_referral_unit", "alternative_provision", "home_educated", "not_in_education"] as const).map(
            (t) => [t, getSchoolTypeLabel(t)],
          ),
        ),
        attendanceStatusLabels: Object.fromEntries(
          (["present", "authorised_absence", "unauthorised_absence", "excluded", "late"] as const).map(
            (s) => [s, getAttendanceStatusLabel(s)],
          ),
        ),
        pepStatusLabels: Object.fromEntries(
          (["current", "overdue", "not_started", "completed"] as const).map(
            (s) => [s, getPEPStatusLabel(s)],
          ),
        ),
        pepQualityLabels: Object.fromEntries(
          (["outstanding", "good", "requires_improvement", "inadequate"] as const).map(
            (q) => [q, getPEPQualityLabel(q)],
          ),
        ),
        academicProgressLabels: Object.fromEntries(
          (["exceeding", "expected", "below_expected", "significantly_below", "not_assessed"] as const).map(
            (p) => [p, getAcademicProgressLabel(p)],
          ),
        ),
        exclusionTypeLabels: Object.fromEntries(
          (["fixed_term", "permanent", "internal"] as const).map(
            (t) => [t, getExclusionTypeLabel(t)],
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

// ── POST ───────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { attendance, peps, outcomes, stability, exclusions, homeId, periodStart, periodEnd } = body as {
    attendance?: AttendanceRecord[];
    peps?: PEPRecord[];
    outcomes?: AcademicOutcome[];
    stability?: SchoolStability[];
    exclusions?: ExclusionRecord[];
    homeId?: string;
    periodStart?: string;
    periodEnd?: string;
  };

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart and periodEnd are required" }, { status: 400 });
  }

  const result = generateEducationAchievementIntelligence(
    attendance ?? [],
    peps ?? [],
    outcomes ?? [],
    stability ?? [],
    exclusions ?? [],
    homeId ?? "unknown",
    periodStart,
    periodEnd,
  );

  return NextResponse.json({ data: result });
}
