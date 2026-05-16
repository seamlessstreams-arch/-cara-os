// ══════════════════════════════════════════════════════════════════════════════
// API: /api/aria/education-engagement — Education Engagement Intelligence
//
// Analyses attendance, exclusion risk, PEP compliance, and engagement quality.
// Pure deterministic — no AI. Returns structured assessment.
// Reg 8 alignment (Education).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseEducationEngagement } from "@/lib/aria/education-engagement-intelligence";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { EducationInput, EducationWeek } from "@/lib/aria/education-engagement-intelligence";

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

    // ── Fetch or demo ───────────────────────────────────────────────────────
    const sb = createServerClient();
    let input: EducationInput;

    if (sb && isSupabaseEnabled()) {
      input = await fetchEducationData(sb, childId);
    } else {
      input = buildDemoData(childId);
    }

    // ── Run intelligence engine ─────────────────────────────────────────────
    const assessment = analyseEducationEngagement(input);

    return NextResponse.json({
      success: true,
      data: assessment,
    });
  } catch (err) {
    console.error("[aria/education-engagement] Error:", err);
    return NextResponse.json(
      { error: "Education engagement intelligence failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// ── Supabase Fetch ──────────────────────────────────────────────────────────

async function fetchEducationData(sb: any, childId: string): Promise<EducationInput> {
  const { data: child } = await (sb.from("children") as SB)
    .select("id, first_name, last_name, date_of_birth")
    .eq("id", childId)
    .single();

  const childName = child ? `${child.first_name} ${child.last_name}` : "Unknown";
  const age = child?.date_of_birth
    ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / 31557600000)
    : 15;

  // Fetch education record
  const { data: eduRecord } = await (sb.from("education_records") as SB)
    .select("*")
    .eq("child_id", childId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch attendance weeks
  const cutoff = new Date(Date.now() - 84 * 86400000).toISOString().slice(0, 10);
  const { data: rawWeeks } = await (sb.from("education_attendance_weeks") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("week_start", cutoff)
    .order("week_start", { ascending: true });

  const weeks: EducationWeek[] = (rawWeeks ?? []).map((w: any) => ({
    weekStart: w.week_start,
    sessionsExpected: w.sessions_expected ?? 10,
    sessionsAttended: w.sessions_attended ?? 0,
    sessionsAuthorisedAbsence: w.authorised_absence ?? 0,
    sessionsUnauthorisedAbsence: w.unauthorised_absence ?? 0,
    lateArrivals: w.late_arrivals ?? 0,
    exclusionDays: w.exclusion_days ?? 0,
    exclusionType: w.exclusion_type ?? undefined,
    engagementRating: w.engagement_rating ?? undefined,
    positiveNotes: w.positive_notes ?? 0,
    negativeNotes: w.negative_notes ?? 0,
  }));

  return {
    childId,
    childName,
    age,
    currentProvision: eduRecord?.provision_type ?? "mainstream_school",
    provisionName: eduRecord?.school_name ?? "Unknown",
    senStatus: eduRecord?.sen_status ?? "none",
    hasEHCP: eduRecord?.has_ehcp ?? false,
    pepUpToDate: eduRecord?.pep_up_to_date ?? false,
    pepLastReviewDate: eduRecord?.pep_last_review ?? undefined,
    pepNextDueDate: eduRecord?.pep_next_due ?? undefined,
    schoolMoves: eduRecord?.school_moves_12m ?? 0,
    weeks: weeks.length > 0 ? weeks : buildDemoWeeks(childId),
    currentExclusions: eduRecord?.exclusion_days_current_year ?? 0,
    previousExclusions: eduRecord?.exclusion_days_previous_year ?? 0,
    atRiskOfPermanentExclusion: eduRecord?.perm_exclusion_risk ?? false,
    virtualSchoolInvolved: eduRecord?.virtual_school_involved ?? false,
    designatedTeacherEngaged: eduRecord?.designated_teacher_engaged ?? false,
    pupilPremiumPlusAllocated: eduRecord?.pp_plus_allocated ?? false,
  };
}

// ── Demo Data ───────────────────────────────────────────────────────────────

function buildDemoData(childId: string): EducationInput {
  const isJordan = childId.includes("jordan") || childId === "child_1";

  return {
    childId,
    childName: isJordan ? "Jordan" : "Sam",
    age: isJordan ? 15 : 14,
    currentProvision: "mainstream_school",
    provisionName: isJordan ? "Oakfield Academy" : "Riverside Secondary",
    senStatus: isJordan ? "sen_support" : "none",
    hasEHCP: false,
    pepUpToDate: isJordan ? false : true,
    pepLastReviewDate: isJordan ? "2026-01-15" : "2026-04-10",
    pepNextDueDate: isJordan ? "2026-04-15" : "2026-07-10",
    schoolMoves: isJordan ? 1 : 0,
    weeks: buildDemoWeeks(childId),
    currentExclusions: isJordan ? 3 : 0,
    previousExclusions: isJordan ? 2 : 0,
    atRiskOfPermanentExclusion: false,
    virtualSchoolInvolved: true,
    designatedTeacherEngaged: isJordan ? true : true,
    pupilPremiumPlusAllocated: true,
  };
}

function buildDemoWeeks(childId: string): EducationWeek[] {
  const isJordan = childId.includes("jordan") || childId === "child_1";
  const weeks: EducationWeek[] = [];

  for (let i = 0; i < 12; i++) {
    const weekStart = new Date(2026, 2, 3 + i * 7).toISOString().slice(0, 10);

    if (isJordan) {
      // Jordan: inconsistent attendance, improving trend
      const baseAttendance = i < 6 ? 7 : 8; // improving from 70% to 80%
      const attended = Math.min(10, baseAttendance + (Math.random() > 0.7 ? 1 : 0));
      weeks.push({
        weekStart,
        sessionsExpected: 10,
        sessionsAttended: attended,
        sessionsAuthorisedAbsence: i === 3 ? 2 : 0,
        sessionsUnauthorisedAbsence: 10 - attended - (i === 3 ? 2 : 0),
        lateArrivals: i < 6 ? 2 : 1,
        exclusionDays: i === 2 ? 2 : i === 8 ? 1 : 0,
        exclusionType: (i === 2 || i === 8) ? "fixed_term" : undefined,
        engagementRating: i < 6 ? 2 : 3,
        positiveNotes: i >= 8 ? 1 : 0,
        negativeNotes: i < 4 ? 1 : 0,
      });
    } else {
      // Sam: good attendance, stable
      weeks.push({
        weekStart,
        sessionsExpected: 10,
        sessionsAttended: i === 5 ? 8 : 10,
        sessionsAuthorisedAbsence: i === 5 ? 2 : 0,
        sessionsUnauthorisedAbsence: 0,
        lateArrivals: 0,
        exclusionDays: 0,
        engagementRating: 4,
        positiveNotes: 1,
        negativeNotes: 0,
      });
    }
  }

  return weeks;
}
