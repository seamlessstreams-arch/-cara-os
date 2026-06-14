// ═══════════════���══════════════════════════════════════════════════════════════
// API: /api/cara/education — Education Intelligence
//
// Analyses education: attendance, progress, PEP, exclusions, support.
// Pure deterministic — no AI. Returns structured assessment.
// CHR 2015 Reg 8 alignment (Education).
// ═���═════════════════��══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseEducation } from "@/lib/cara/education-intelligence";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type {
  EducationInput,
  AttendanceRecord,
  ExclusionRecord,
  PEPRecord,
  PEPQuality,
} from "@/lib/cara/education-intelligence";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const childId = url.searchParams.get("childId");

    if (!childId) {
      return NextResponse.json(
        { error: "childId query parameter is required" },
        { status: 400 },
      );
    }

    const sb = createServerClient();
    let input: EducationInput;

    if (sb && isSupabaseEnabled()) {
      input = await fetchData(sb, childId);
    } else {
      input = buildDemoData(childId);
    }

    const assessment = analyseEducation(input);

    return NextResponse.json({ success: true, data: assessment });
  } catch (err) {
    console.error("[cara/education] Error:", err);
    return NextResponse.json(
      { error: "Education intelligence failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// ── Supabase Fetch ──────────────────────────────────────────────────────────

async function fetchData(sb: any, childId: string): Promise<EducationInput> {
  const { data: child } = await (sb.from("children") as SB)
    .select("id, first_name, last_name, date_of_birth")
    .eq("id", childId)
    .single();

  const childName = child ? `${child.first_name} ${child.last_name}` : "Unknown";
  const age = child?.date_of_birth
    ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / 31557600000)
    : 15;

  // Attendance (last 12 weeks)
  const cutoff12w = new Date(Date.now() - 84 * 86400000).toISOString().slice(0, 10);
  const { data: rawAttendance } = await (sb.from("attendance_records") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("week_starting", cutoff12w)
    .order("week_starting", { ascending: true });

  const attendanceRecords: AttendanceRecord[] = (rawAttendance ?? []).map((a: any) => ({
    weekStarting: a.week_starting,
    possibleSessions: a.possible_sessions ?? 10,
    attendedSessions: a.attended_sessions ?? 10,
    authorisedAbsences: a.authorised_absences ?? 0,
    unauthorisedAbsences: a.unauthorised_absences ?? 0,
    lates: a.lates ?? 0,
  }));

  // Exclusions (last 12 months)
  const cutoff12m = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
  const { data: rawExclusions } = await (sb.from("exclusions") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("date", cutoff12m)
    .order("date", { ascending: true });

  const exclusions: ExclusionRecord[] = (rawExclusions ?? []).map((e: any) => ({
    date: e.date,
    type: e.type ?? "fixed_term",
    days: e.days ?? 1,
    reason: e.reason ?? "",
    reintegrationPlan: e.reintegration_plan ?? false,
  }));

  // PEP records (last 3)
  const { data: rawPEPs } = await (sb.from("pep_records") as SB)
    .select("*")
    .eq("child_id", childId)
    .order("date", { ascending: true })
    .limit(3);

  const pepRecords: PEPRecord[] = (rawPEPs ?? []).map((p: any) => ({
    date: p.date,
    quality: (p.quality ?? "good") as PEPQuality,
    targetsSet: p.targets_set ?? 0,
    targetsMet: p.targets_met ?? 0,
    pupilPremiumPlusAllocated: p.pp_allocated ?? 0,
    pupilPremiumPlusSpent: p.pp_spent ?? 0,
    childContributed: p.child_contributed ?? false,
    carerContributed: p.carer_contributed ?? false,
    virtualSchoolAttended: p.virtual_school_attended ?? false,
  }));

  // Education config
  const { data: config } = await (sb.from("education_config") as SB)
    .select("*")
    .eq("child_id", childId)
    .single();

  return {
    childId,
    childName,
    age,
    yearGroup: config?.year_group ?? (age - 5),
    schoolName: config?.school_name ?? "Unknown School",
    schoolType: config?.school_type ?? "mainstream",
    inEducation: config?.in_education ?? true,
    attendanceRecords,
    attendanceTrend: config?.attendance_trend ?? "stable",
    exclusions,
    pepRecords,
    pepDue: config?.pep_due ?? false,
    onTrackForTargets: config?.on_track ?? true,
    progressRating: config?.progress_rating ?? "expected",
    sendSupport: config?.send_support ?? false,
    ehcpInPlace: config?.ehcp ?? false,
    designatedTeacherEngaged: config?.dt_engaged ?? true,
    virtualSchoolInvolved: config?.vs_involved ?? true,
    tutoring: config?.tutoring ?? false,
    mentoring: config?.mentoring ?? false,
    ppPlusEffectivelyUsed: config?.pp_effective ?? true,
    childEnjoysSChool: config?.enjoys_school ?? true,
    homeworkSupported: config?.homework_supported ?? true,
    aspirationsDiscussed: config?.aspirations ?? true,
    careerGuidanceAccessed: config?.career_guidance ?? (age >= 14),
    postSixteenPlanInPlace: config?.post_16_plan ?? false,
  };
}

// ── Demo Data ───────���───────────────────────────────────────────────────────

function buildDemoData(childId: string): EducationInput {
  const isJordan = childId.includes("jordan") || childId === "child_1";

  if (!isJordan) {
    // Sam — strong education profile
    return {
      childId,
      childName: "Sam",
      age: 14,
      yearGroup: 9,
      schoolName: "Riverside Academy",
      schoolType: "mainstream",
      inEducation: true,
      attendanceRecords: Array.from({ length: 12 }, (_, i) => ({
        weekStarting: `2026-0${Math.floor(i / 4) + 2}-${((i % 4) * 7 + 1).toString().padStart(2, "0")}`,
        possibleSessions: 10,
        attendedSessions: 10,
        authorisedAbsences: 0,
        unauthorisedAbsences: 0,
        lates: 0,
      })),
      attendanceTrend: "stable",
      exclusions: [],
      pepRecords: [
        {
          date: "2026-01-20",
          quality: "good",
          targetsSet: 3,
          targetsMet: 3,
          pupilPremiumPlusAllocated: 2530,
          pupilPremiumPlusSpent: 2000,
          childContributed: true,
          carerContributed: true,
          virtualSchoolAttended: true,
        },
        {
          date: "2026-04-10",
          quality: "outstanding",
          targetsSet: 4,
          targetsMet: 4,
          pupilPremiumPlusAllocated: 2530,
          pupilPremiumPlusSpent: 2200,
          childContributed: true,
          carerContributed: true,
          virtualSchoolAttended: true,
        },
      ],
      pepDue: false,
      onTrackForTargets: true,
      progressRating: "above_expected",
      sendSupport: false,
      ehcpInPlace: false,
      designatedTeacherEngaged: true,
      virtualSchoolInvolved: true,
      tutoring: true,
      mentoring: false,
      ppPlusEffectivelyUsed: true,
      childEnjoysSChool: true,
      homeworkSupported: true,
      aspirationsDiscussed: true,
      careerGuidanceAccessed: true,
      postSixteenPlanInPlace: false,
    };
  }

  // Jordan — improving but some challenges
  return {
    childId,
    childName: "Jordan",
    age: 15,
    yearGroup: 10,
    schoolName: "Oak Academy",
    schoolType: "mainstream",
    inEducation: true,
    attendanceRecords: Array.from({ length: 12 }, (_, i) => ({
      weekStarting: `2026-0${Math.floor(i / 4) + 2}-${((i % 4) * 7 + 1).toString().padStart(2, "0")}`,
      possibleSessions: 10,
      attendedSessions: i < 4 ? 8 : i < 8 ? 9 : 10, // improving from 80% → 100%
      authorisedAbsences: i < 4 ? 1 : 0,
      unauthorisedAbsences: i < 4 ? 1 : i < 8 ? 1 : 0,
      lates: i < 6 ? 1 : 0,
    })),
    attendanceTrend: "improving",
    exclusions: [
      {
        date: "2026-01-20",
        type: "fixed_term",
        days: 2,
        reason: "persistent disruption",
        reintegrationPlan: true,
      },
    ],
    pepRecords: [
      {
        date: "2025-12-10",
        quality: "requires_improvement",
        targetsSet: 4,
        targetsMet: 1,
        pupilPremiumPlusAllocated: 2530,
        pupilPremiumPlusSpent: 800,
        childContributed: false,
        carerContributed: true,
        virtualSchoolAttended: true,
      },
      {
        date: "2026-03-20",
        quality: "good",
        targetsSet: 4,
        targetsMet: 3,
        pupilPremiumPlusAllocated: 2530,
        pupilPremiumPlusSpent: 1900,
        childContributed: true,
        carerContributed: true,
        virtualSchoolAttended: true,
      },
    ],
    pepDue: false,
    onTrackForTargets: true,
    progressRating: "expected",
    sendSupport: true,
    ehcpInPlace: false,
    designatedTeacherEngaged: true,
    virtualSchoolInvolved: true,
    tutoring: true,
    mentoring: true,
    ppPlusEffectivelyUsed: true,
    childEnjoysSChool: true,
    homeworkSupported: true,
    aspirationsDiscussed: true,
    careerGuidanceAccessed: true,
    postSixteenPlanInPlace: false,
  };
}
