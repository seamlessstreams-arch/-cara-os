// ══════════════════════════════════════════════════════════════════════════════
// API: /api/education — Education & PEP Tracking
//
// Returns education compliance, attendance data, PEP status, attainment
// tracking, and Pupil Premium Plus utilisation. Powers the education
// dashboard and Virtual School liaison.
//
// CHR 2015 Reg 8 — The education standard.
// Virtual School Head statutory role.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import {
  evaluateEducationCompliance,
  calculateHomeEducationMetrics,
} from "@/lib/education";
import type { ChildEducationRecord } from "@/lib/education";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const homeId = url.searchParams.get("homeId") ?? "home-oak";
    const childId = url.searchParams.get("childId");
    const view = url.searchParams.get("view") ?? "overview";

    const sb = createServerClient();

    if (sb && isSupabaseEnabled()) {
      return await handleLiveData(sb, homeId, childId, view);
    }

    return NextResponse.json(getDemoData(homeId, childId, view));
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// ── Live Data ──────────────────────────────────────────────────────────────

async function handleLiveData(sb: any, homeId: string, childId: string | null, view: string) {
  let query = (sb.from("education_records") as SB)
    .select("*, pep_targets(*), subject_attainment(*), exclusion_records(*)")
    .eq("home_id", homeId);

  if (childId) {
    query = query.eq("child_id", childId);
  }

  const { data: rows, error } = await query;
  if (error) throw error;

  const records: ChildEducationRecord[] = (rows ?? []).map(mapToRecord);

  switch (view) {
    case "overview":
      return NextResponse.json(calculateHomeEducationMetrics(records, homeId));
    case "compliance":
      return NextResponse.json({ results: records.map(r => evaluateEducationCompliance(r)) });
    case "child":
      if (!childId || records.length === 0) {
        return NextResponse.json({ error: "Child record not found" }, { status: 404 });
      }
      return NextResponse.json({
        record: records[0],
        compliance: evaluateEducationCompliance(records[0]),
      });
    default:
      return NextResponse.json({ error: `Unknown view: ${view}` }, { status: 400 });
  }
}

function mapToRecord(row: any): ChildEducationRecord {
  return {
    childId: row.child_id,
    childName: row.child_name,
    homeId: row.home_id,
    dateOfBirth: row.date_of_birth,
    keyStage: row.key_stage,
    educationStatus: row.education_status,
    schoolName: row.school_name ?? "",
    schoolType: row.school_type ?? "mainstream",
    designatedTeacher: row.designated_teacher ?? "",
    designatedTeacherEmail: row.designated_teacher_email,
    yearGroup: row.year_group ?? 0,
    pepStatus: row.pep_status ?? "not_started",
    lastPEPDate: row.last_pep_date,
    nextPEPDue: row.next_pep_due,
    pepTargets: (row.pep_targets ?? []).map((t: any) => ({
      id: t.id,
      subject: t.subject ?? "",
      target: t.target ?? "",
      progress: t.progress ?? "not_started",
      ppFunded: t.pp_funded ?? false,
      evidence: t.evidence,
    })),
    pupilPremiumAllocation: row.pupil_premium_allocation ?? 0,
    pupilPremiumSpent: row.pupil_premium_spent ?? 0,
    attendancePercentage: row.attendance_percentage ?? 100,
    sessionsAttended: row.sessions_attended ?? 0,
    sessionsPossible: row.sessions_possible ?? 0,
    authorisedAbsences: row.authorised_absences ?? 0,
    unauthorisedAbsences: row.unauthorised_absences ?? 0,
    attainmentLevels: (row.subject_attainment ?? []).map((a: any) => ({
      subject: a.subject ?? "",
      currentLevel: a.current_level ?? "age_expected",
      targetLevel: a.target_level ?? "above",
      progress: a.progress ?? "on_track",
      lastAssessed: a.last_assessed ?? "",
    })),
    senStatus: row.sen_status ?? "none",
    ehcpInPlace: row.ehcp_in_place ?? false,
    exclusions: (row.exclusion_records ?? []).map((e: any) => ({
      date: e.date,
      type: e.type ?? "fixed_term",
      days: e.days ?? 1,
      reason: e.reason ?? "",
      alternativeProvision: e.alternative_provision ?? false,
      returnMeetingHeld: e.return_meeting_held ?? false,
    })),
    homeworkCompletion: row.homework_completion ?? 0,
    extracurricularActivities: row.extracurricular_activities ?? [],
    aspirations: row.aspirations ?? "",
  };
}

// ── Demo Data ─────────────────────────────────────────────────────────────

function getDemoData(homeId: string, childId: string | null, view: string) {
  const allRecords = getDemoRecords(homeId);
  const records = childId ? allRecords.filter(r => r.childId === childId) : allRecords;

  switch (view) {
    case "overview":
      return calculateHomeEducationMetrics(allRecords, homeId);
    case "compliance":
      return { results: records.map(r => evaluateEducationCompliance(r)) };
    case "child":
      if (records.length === 0) return { error: "Child record not found" };
      return { record: records[0], compliance: evaluateEducationCompliance(records[0]) };
    default:
      return { error: `Unknown view: ${view}` };
  }
}

function getDemoRecords(homeId: string): ChildEducationRecord[] {
  return [
    // ── Jordan — Strong academic, good attendance ──
    {
      childId: "child-jordan",
      childName: "Jordan Williams",
      homeId,
      dateOfBirth: "2010-06-15T00:00:00Z",
      keyStage: "ks4",
      educationStatus: "enrolled_mainstream",
      schoolName: "Oakfield Academy",
      schoolType: "mainstream",
      designatedTeacher: "Mrs Collins",
      designatedTeacherEmail: "collins@oakfield.edu",
      yearGroup: 11,
      pepStatus: "current",
      lastPEPDate: "2026-04-15T00:00:00Z",
      nextPEPDue: "2026-07-10T00:00:00Z",
      pepTargets: [
        { id: "t1", subject: "English", target: "Achieve Grade 5 in GCSEs", progress: "in_progress", ppFunded: true },
        { id: "t2", subject: "Maths", target: "Achieve Grade 5 in GCSEs", progress: "achieved", ppFunded: true },
        { id: "t3", subject: "PE", target: "Complete GCSE PE coursework", progress: "in_progress", ppFunded: false },
      ],
      pupilPremiumAllocation: 2530,
      pupilPremiumSpent: 2200,
      attendancePercentage: 96,
      sessionsAttended: 288,
      sessionsPossible: 300,
      authorisedAbsences: 8,
      unauthorisedAbsences: 4,
      attainmentLevels: [
        { subject: "English", currentLevel: "age_expected", targetLevel: "above", progress: "on_track", lastAssessed: "2026-04-01" },
        { subject: "Maths", currentLevel: "above", targetLevel: "above", progress: "above_target", lastAssessed: "2026-04-01" },
        { subject: "Science", currentLevel: "age_expected", targetLevel: "age_expected", progress: "on_track", lastAssessed: "2026-04-01" },
      ],
      senStatus: "none",
      ehcpInPlace: false,
      exclusions: [],
      homeworkCompletion: 85,
      extracurricularActivities: ["Football team", "Art club"],
      aspirations: "Sports science at college",
    },

    // ── Alex — Attendance concern, alternative provision ──
    {
      childId: "child-alex",
      childName: "Alex Reeves",
      homeId,
      dateOfBirth: "2009-11-20T00:00:00Z",
      keyStage: "ks4",
      educationStatus: "alternative_provision",
      schoolName: "Pathways Alternative Education",
      schoolType: "ap",
      designatedTeacher: "Mr Harrison",
      yearGroup: 11,
      pepStatus: "current",
      lastPEPDate: "2026-04-20T00:00:00Z",
      nextPEPDue: "2026-07-15T00:00:00Z",
      pepTargets: [
        { id: "t4", subject: "English", target: "Complete functional skills L2", progress: "in_progress", ppFunded: true },
        { id: "t5", subject: "Maths", target: "Complete functional skills L1", progress: "not_started", ppFunded: true },
        { id: "t6", subject: "Vocational", target: "Attend construction taster 3 days/week", progress: "in_progress", ppFunded: true },
      ],
      pupilPremiumAllocation: 2530,
      pupilPremiumSpent: 1800,
      attendancePercentage: 72,
      sessionsAttended: 144,
      sessionsPossible: 200,
      authorisedAbsences: 20,
      unauthorisedAbsences: 36,
      attainmentLevels: [
        { subject: "English", currentLevel: "below", targetLevel: "age_expected", progress: "below_target", lastAssessed: "2026-03-01" },
        { subject: "Maths", currentLevel: "significantly_below", targetLevel: "below", progress: "below_target", lastAssessed: "2026-03-01" },
      ],
      senStatus: "sen_support",
      ehcpInPlace: false,
      exclusions: [
        { date: "2026-03-10T00:00:00Z", type: "fixed_term", days: 3, reason: "Physical altercation with peer", alternativeProvision: true, returnMeetingHeld: true },
      ],
      homeworkCompletion: 40,
      extracurricularActivities: ["Gym (weekly)"],
      aspirations: "Construction or mechanics",
    },

    // ── Mia — New placement, good engagement ──
    {
      childId: "child-mia",
      childName: "Mia Chen",
      homeId,
      dateOfBirth: "2012-02-28T00:00:00Z",
      keyStage: "ks3",
      educationStatus: "enrolled_mainstream",
      schoolName: "Riverside High School",
      schoolType: "mainstream",
      designatedTeacher: "Ms Patel",
      designatedTeacherEmail: "patel@riverside.edu",
      yearGroup: 9,
      pepStatus: "current",
      lastPEPDate: "2026-05-05T00:00:00Z",
      nextPEPDue: "2026-09-15T00:00:00Z",
      pepTargets: [
        { id: "t7", subject: "English", target: "Join creative writing club", progress: "achieved", ppFunded: false },
        { id: "t8", subject: "Science", target: "Catch up on missed Y8 content", progress: "in_progress", ppFunded: true },
        { id: "t9", subject: "Art", target: "Submit portfolio for GCSE option", progress: "in_progress", ppFunded: false },
      ],
      pupilPremiumAllocation: 2530,
      pupilPremiumSpent: 2100,
      attendancePercentage: 98,
      sessionsAttended: 58,
      sessionsPossible: 60,
      authorisedAbsences: 2,
      unauthorisedAbsences: 0,
      attainmentLevels: [
        { subject: "English", currentLevel: "above", targetLevel: "well_above", progress: "on_track", lastAssessed: "2026-05-01" },
        { subject: "Maths", currentLevel: "age_expected", targetLevel: "above", progress: "on_track", lastAssessed: "2026-05-01" },
        { subject: "Science", currentLevel: "below", targetLevel: "age_expected", progress: "on_track", lastAssessed: "2026-05-01" },
        { subject: "Art", currentLevel: "well_above", targetLevel: "well_above", progress: "above_target", lastAssessed: "2026-05-01" },
      ],
      senStatus: "none",
      ehcpInPlace: false,
      exclusions: [],
      homeworkCompletion: 95,
      extracurricularActivities: ["Creative writing club", "Art workshop", "School choir"],
      aspirations: "Wants to be a graphic designer or author",
    },
  ];
}
