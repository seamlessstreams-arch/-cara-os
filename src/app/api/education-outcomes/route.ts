// ══════════════════════════════════════════════════════════════════════════════
// API: /api/education-outcomes — Education Attendance & Achievement Intelligence
//
// GET  — Returns Chamberlain House demo intelligence data
// POST — Accepts custom data with validation
//
// CHR 2015 Reg 8 — The education standard
// CHR 2015 Reg 9 — Enjoyment & achievement
// SCCIF — Experiences & progress
// Virtual School Head guidance
// SEND Code of Practice 2015
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import {
  generateEducationOutcomesIntelligence,
} from "@/lib/education-outcomes";
import type {
  AttendanceRecord,
  AttendanceStatus,
  ExclusionRecord,
  ExclusionType,
  PEPRecord,
  PEPStatus,
  SENDSupportRecord,
  SENDCategory,
  AchievementRecord,
  AchievementType,
} from "@/lib/education-outcomes";

// ── GET ───────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest) {
  try {
    const demo = buildDemoIntelligence();
    return NextResponse.json(demo);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validationError = validatePostBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = generateEducationOutcomesIntelligence(
      body.attendance as AttendanceRecord[],
      body.exclusions as ExclusionRecord[],
      body.peps as PEPRecord[],
      body.sendSupport as SENDSupportRecord[],
      body.achievements as AchievementRecord[],
      body.childIds as string[],
      body.childNames as Record<string, string>,
      body.homeId as string,
      body.periodStart as string,
      body.periodEnd as string,
      body.referenceDate as string,
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Validation ────────────────────────────────────────────────────────────

function validatePostBody(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object.";
  }

  const b = body as Record<string, unknown>;

  if (!Array.isArray(b.attendance)) return "attendance must be an array.";
  if (!Array.isArray(b.exclusions)) return "exclusions must be an array.";
  if (!Array.isArray(b.peps)) return "peps must be an array.";
  if (!Array.isArray(b.sendSupport)) return "sendSupport must be an array.";
  if (!Array.isArray(b.achievements)) return "achievements must be an array.";
  if (!Array.isArray(b.childIds)) return "childIds must be an array.";
  if (!b.childNames || typeof b.childNames !== "object" || Array.isArray(b.childNames)) {
    return "childNames must be an object mapping childId to name.";
  }
  if (typeof b.homeId !== "string") return "homeId must be a string.";
  if (typeof b.periodStart !== "string") return "periodStart must be a string.";
  if (typeof b.periodEnd !== "string") return "periodEnd must be a string.";
  if (typeof b.referenceDate !== "string") return "referenceDate must be a string.";

  return null;
}

// ── Demo Data ─────────────────────────────────────────────────────────────

const HOME_ID = "home-oak";
const PERIOD_START = "2026-01-05";
const PERIOD_END = "2026-03-31";
const REFERENCE_DATE = "2026-04-01";

const CHILD_IDS = ["child-alex", "child-jordan", "child-morgan"];
const CHILD_NAMES: Record<string, string> = {
  "child-alex": "Alex",
  "child-jordan": "Jordan",
  "child-morgan": "Morgan",
};

let _idSeq = 0;
function did(prefix: string): string { return `${prefix}-${++_idSeq}`; }

function buildDemoIntelligence() {
  // Reset ID counter for deterministic output
  _idSeq = 0;

  return generateEducationOutcomesIntelligence(
    buildAttendance(),
    buildExclusions(),
    buildPEPs(),
    buildSENDSupport(),
    buildAchievements(),
    CHILD_IDS,
    CHILD_NAMES,
    HOME_ID,
    PERIOD_START,
    PERIOD_END,
    REFERENCE_DATE,
  );
}

// ── Attendance ────────────────────────────────────────────────────────────

function buildAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const start = new Date("2026-01-05");

  // Alex — 14, good attendance (~93%), some lateness, 1 EOTAS
  records.push(...generateChildAttendance("child-alex", "Alex", start, 60, (i) => {
    if (i === 10 || i === 11) return "excluded";
    if (i === 20 || i === 45) return "late";
    if (i === 30) return "authorised_absence";
    if (i === 40) return "unauthorised_absence";
    if (i === 50) return "EOTAS";
    return "present";
  }));

  // Jordan — 13, excellent attendance (~99%)
  records.push(...generateChildAttendance("child-jordan", "Jordan", start, 60, (i) => {
    if (i === 35) return "authorised_absence";
    return "present";
  }));

  // Morgan — 15, patchy attendance (~83%), more unauthorised
  records.push(...generateChildAttendance("child-morgan", "Morgan", start, 60, (i) => {
    if (i % 7 === 0 && i > 0) return "unauthorised_absence";
    if (i === 15 || i === 16) return "authorised_absence";
    if (i === 25 || i === 50) return "late";
    return "present";
  }));

  return records;
}

function generateChildAttendance(
  childId: string,
  childName: string,
  start: Date,
  targetDays: number,
  statusFn: (dayIndex: number) => AttendanceStatus,
): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  let dayOffset = 0;
  let schoolDay = 0;

  while (schoolDay < targetDays) {
    const d = new Date(start.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    dayOffset++;
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    records.push({
      id: did("att"),
      childId,
      childName,
      date: d.toISOString().slice(0, 10),
      status: statusFn(schoolDay),
    });
    schoolDay++;
  }

  return records;
}

// ── Exclusions ────────────────────────────────────────────────────────────

function buildExclusions(): ExclusionRecord[] {
  return [
    {
      id: did("exc"),
      childId: "child-alex",
      childName: "Alex",
      startDate: "2026-02-10",
      endDate: "2026-02-11",
      exclusionType: "fixed_term",
      reason: "Disruptive behaviour — overturned chairs in frustration",
      daysExcluded: 2,
      alternativeProvision: true,
      reintegrationMeeting: true,
      challengedByHome: true,
    },
    {
      id: did("exc"),
      childId: "child-morgan",
      childName: "Morgan",
      startDate: "2026-01-20",
      exclusionType: "informal",
      reason: "Sent home early — school did not formally record",
      daysExcluded: 1,
      alternativeProvision: false,
      reintegrationMeeting: false,
      challengedByHome: false,
    },
  ];
}

// ── PEPs ──────────────────────────────────────────────────────────────────

function buildPEPs(): PEPRecord[] {
  return [
    {
      id: did("pep"),
      childId: "child-alex",
      childName: "Alex",
      reviewDate: "2026-03-01",
      status: "current",
      virtualSchoolInvolved: true,
      childAttended: true,
      childVoiceRecorded: true,
      targetsSet: 4,
      targetsAchieved: 2,
      pupilPremiumSpend: "£1,200 — therapeutic support and maths tutor",
      nextReviewDate: "2026-06-01",
    },
    {
      id: did("pep"),
      childId: "child-jordan",
      childName: "Jordan",
      reviewDate: "2026-03-05",
      status: "current",
      virtualSchoolInvolved: true,
      childAttended: true,
      childVoiceRecorded: true,
      targetsSet: 3,
      targetsAchieved: 2,
      pupilPremiumSpend: "£800 — science tutor and art supplies",
      nextReviewDate: "2026-06-10",
    },
    {
      id: did("pep"),
      childId: "child-morgan",
      childName: "Morgan",
      reviewDate: "2025-11-01",
      status: "overdue",
      virtualSchoolInvolved: false,
      childAttended: false,
      childVoiceRecorded: false,
      targetsSet: 3,
      targetsAchieved: 0,
      nextReviewDate: "2026-02-01",
    },
  ];
}

// ── SEND Support ──────────────────────────────────────────────────────────

function buildSENDSupport(): SENDSupportRecord[] {
  return [
    {
      id: did("send"),
      childId: "child-alex",
      childName: "Alex",
      sendCategory: "SEMH",
      ehcpInPlace: false,
      supportDescription: "Weekly therapeutic support — emotional regulation",
      providerName: "CAMHS",
      hoursPerWeek: 2,
      effectivenessRating: "good",
      childView: "The sessions help me when I get stressed at school",
    },
    {
      id: did("send"),
      childId: "child-morgan",
      childName: "Morgan",
      sendCategory: "SpLD",
      ehcpInPlace: true,
      ehcpReviewDate: "2025-09-15",
      supportDescription: "Specialist dyslexia tutor — phonics and reading",
      providerName: "Learning Support Service",
      hoursPerWeek: 3,
      effectivenessRating: "adequate",
      childView: "It helps a bit but I wish we did more reading together",
    },
    {
      id: did("send"),
      childId: "child-morgan",
      childName: "Morgan",
      sendCategory: "SpLD",
      ehcpInPlace: true,
      ehcpReviewDate: "2025-09-15",
      supportDescription: "In-class TA support for literacy tasks",
      providerName: "School Teaching Assistant",
      hoursPerWeek: 10,
      effectivenessRating: "good",
    },
  ];
}

// ── Achievements ──────────────────────────────────────────────────────────

function buildAchievements(): AchievementRecord[] {
  return [
    // Alex — 3 achievements
    {
      id: did("ach"), childId: "child-alex", childName: "Alex",
      date: "2026-02-15", achievementType: "academic",
      description: "Improved maths mock grade from D to C",
      recognisedBy: "Sarah Johnson", celebrated: true, evidenceRecorded: true,
    },
    {
      id: did("ach"), childId: "child-alex", childName: "Alex",
      date: "2026-03-01", achievementType: "personal",
      description: "Managed anger in a difficult peer situation without escalation",
      recognisedBy: "Tom Richards", celebrated: true, evidenceRecorded: true,
    },
    {
      id: did("ach"), childId: "child-alex", childName: "Alex",
      date: "2026-03-20", achievementType: "physical",
      description: "Completed Couch to 5K programme",
      recognisedBy: "Darren Laville", celebrated: true, evidenceRecorded: true,
    },

    // Jordan — 4 achievements
    {
      id: did("ach"), childId: "child-jordan", childName: "Jordan",
      date: "2026-01-20", achievementType: "academic",
      description: "Top marks in year-group science assessment",
      recognisedBy: "Lisa Williams", celebrated: true, evidenceRecorded: true,
    },
    {
      id: did("ach"), childId: "child-jordan", childName: "Jordan",
      date: "2026-02-14", achievementType: "social",
      description: "Volunteered at local food bank two weekends running",
      recognisedBy: "Sarah Johnson", celebrated: true, evidenceRecorded: true,
    },
    {
      id: did("ach"), childId: "child-jordan", childName: "Jordan",
      date: "2026-03-05", achievementType: "creative",
      description: "Art piece selected for school exhibition",
      recognisedBy: "Tom Richards", celebrated: true, evidenceRecorded: false,
    },
    {
      id: did("ach"), childId: "child-jordan", childName: "Jordan",
      date: "2026-03-15", achievementType: "life_skills",
      description: "Cooked a full Sunday roast independently for the house",
      recognisedBy: "Darren Laville", celebrated: true, evidenceRecorded: true,
    },

    // Morgan — 3 achievements
    {
      id: did("ach"), childId: "child-morgan", childName: "Morgan",
      date: "2026-01-30", achievementType: "vocational",
      description: "Successfully completed work experience placement at local garage",
      recognisedBy: "Sarah Johnson", celebrated: false, evidenceRecorded: true,
    },
    {
      id: did("ach"), childId: "child-morgan", childName: "Morgan",
      date: "2026-02-20", achievementType: "personal",
      description: "Attended all counselling sessions for the month",
      recognisedBy: "Lisa Williams", celebrated: false, evidenceRecorded: false,
    },
    {
      id: did("ach"), childId: "child-morgan", childName: "Morgan",
      date: "2026-03-10", achievementType: "physical",
      description: "Joined the school rugby team and attended first training",
      recognisedBy: "Tom Richards", celebrated: true, evidenceRecorded: true,
    },
  ];
}
