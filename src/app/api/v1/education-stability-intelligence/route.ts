// ══════════════════════════════════════════════════════════════════════════════
// CARA — EDUCATION STABILITY INTELLIGENCE
// GET /api/v1/education-stability-intelligence
//
// Tracks each LAC child's education stability across attendance, exclusions,
// PEP compliance, school provision stability, and achievement markers.
// Uses real store.educationRecords — not a phantom engine.
//
// LAC children are 4× more likely to be excluded and 3× less likely to
// achieve 5 GCSEs A*–C than their peers. Education is a primary life-
// chance outcome. The home's role is to champion it, stabilise it, and
// ensure the child is supported to attend and engage.
//
// Per-child signal: thriving / engaged / vulnerable / crisis
// Ofsted question: "How do you champion each child's educational needs?"
//
// All deterministic. No LLM calls.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";

// ── Types ─────────────────────────────────────────────────────────────────────

type EducationSignal = "thriving" | "engaged" | "vulnerable" | "crisis";

interface ChildEducationProfile {
  childId: string;
  childName: string;
  currentSchool: string | null;
  schoolChanges: number;
  attendanceRecords: number;
  presentCount: number;
  absentCount: number;
  excludedCount: number;
  attendanceRate: number;
  exclusionCount: number;
  hasPEPInLast6Months: boolean;
  lastPEPDate: string | null;
  achievementCount: number;
  openConcernCount: number;
  monitoringCount: number;
  staffAttendedMeetings: boolean;
  signal: EducationSignal;
  supervisionPrompt: string;
}

interface EducationStabilitySummary {
  totalChildren: number;
  thriving: number;
  engaged: number;
  vulnerable: number;
  crisis: number;
  homeAttendanceRate: number;
  childrenWithCurrentPEP: number;
  childrenWithExclusions: number;
  totalAchievements: number;
  ofstedNote: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function educationSignal(
  attendanceRate: number,
  exclusionCount: number,
  hasPEP: boolean,
  achievementCount: number,
  openConcerns: number,
  schoolChanges: number,
  attendanceRecords: number,
): EducationSignal {
  if (attendanceRecords === 0) return "vulnerable";

  // Crisis: multiple exclusions or very low attendance or no school
  if (exclusionCount >= 2 || attendanceRate < 50 || schoolChanges >= 3) return "crisis";

  // Thriving: good attendance + recent PEP + achievements and no open concerns
  if (attendanceRate >= 90 && hasPEP && achievementCount >= 1 && openConcerns === 0) return "thriving";

  // Engaged: reasonable attendance + PEP present
  if (attendanceRate >= 75 && hasPEP && exclusionCount === 0) return "engaged";

  // Anything worse
  return "vulnerable";
}

function buildPrompt(
  childName: string,
  signal: EducationSignal,
  attendanceRate: number,
  exclusionCount: number,
  hasPEP: boolean,
  lastPEPDate: string | null,
  schoolChanges: number,
  achievementCount: number,
  openConcerns: number,
): string {
  if (signal === "crisis") {
    if (exclusionCount >= 2) {
      return `${childName} has been excluded ${exclusionCount} time${exclusionCount > 1 ? "s" : ""}. This is a serious concern — exclusion for LAC children often signals unmet educational need and increases risk of disengagement. Explore in supervision: has the school provided an Education Support Plan? Is the home involved in reintegration?`;
    }
    if (attendanceRate < 50) {
      return `${childName}'s school attendance is critically low (${attendanceRate}%). Explore urgently in supervision: what is preventing attendance? Is there anxiety, unmet SEND need, bullying, or school placement unsuitability? This requires a multi-agency response.`;
    }
    return `${childName} has had ${schoolChanges} school changes. Educational instability is one of the strongest predictors of poor life outcomes for LAC children. Explore in supervision: is there a placement and school that can offer sustained stability?`;
  }

  if (!hasPEP) {
    return `${childName} does not have a current PEP (last: ${lastPEPDate ?? "never recorded"}). LAC children must have regular PEP reviews — explore in supervision who is responsible for convening the next one and when it will happen.`;
  }
  if (attendanceRate < 85) {
    return `${childName}'s attendance is ${attendanceRate}% — below the expected threshold for LAC children. Explore in supervision: what are the barriers? Is the home supporting punctual attendance and providing the right conditions the night before school?`;
  }
  if (openConcerns > 0) {
    return `${childName} has ${openConcerns} open education concern${openConcerns > 1 ? "s" : ""}. Explore in supervision: what is the current status and is there a follow-up plan?`;
  }
  if (signal === "thriving") {
    return `${childName} is thriving educationally — ${attendanceRate}% attendance, a current PEP, and ${achievementCount} achievement${achievementCount > 1 ? "s" : ""} on record. Celebrate this and explore: what is the home doing that's making the difference?`;
  }
  return `${childName}'s education picture is generally positive. In supervision, ensure PEP is current and explore whether any support with learning at home would further boost progress.`;
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const store = getStore();
  const now = new Date();
  const cutoff6m = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const youngPeople = (store.youngPeople ?? []) as Array<{
    id: string; first_name: string; last_name: string; status: string;
  }>;

  const eduRecords = (store.educationRecords ?? []) as Array<{
    id: string;
    child_id: string;
    record_type: string;
    date: string;
    school?: string;
    attendance_status?: string | null;
    linked_pep?: boolean;
    status: string;
    staff_id: string;
  }>;

  const currentChildren = youngPeople.filter((yp) => yp.status === "current");

  // Index by child
  const recordsByChild = new Map<string, typeof eduRecords>();
  for (const r of eduRecords) {
    const arr = recordsByChild.get(r.child_id) ?? [];
    arr.push(r);
    recordsByChild.set(r.child_id, arr);
  }

  // ── Per-child profiles ────────────────────────────────────────────────────
  const childProfiles: ChildEducationProfile[] = currentChildren.map((yp) => {
    const records = recordsByChild.get(yp.id) ?? [];
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Current school from most recent attendance/exclusion/provision record
    const schoolRecord = records.find((r) => r.school && r.school.trim().length > 0);
    const currentSchool = schoolRecord?.school ?? null;

    // School changes = unique schools after first appearance
    const uniqueSchools = [...new Set(records.filter((r) => r.school).map((r) => r.school as string))];
    const schoolChanges = Math.max(0, uniqueSchools.length - 1);

    // Attendance records
    const attendanceRecs = records.filter((r) => r.record_type === "attendance");
    const presentCount = attendanceRecs.filter((r) => r.attendance_status === "present").length;
    const absentCount = attendanceRecs.filter((r) =>
      r.attendance_status === "absent_unauthorised" || r.attendance_status === "absent_authorised"
    ).length;
    const excludedCount = attendanceRecs.filter((r) => r.attendance_status === "excluded").length;
    const attendanceRate = attendanceRecs.length > 0
      ? Math.round((presentCount / attendanceRecs.length) * 100) : null;

    // Exclusions (separate records)
    const exclusionRecords = records.filter((r) => r.record_type === "exclusion");
    const exclusionCount = exclusionRecords.length + excludedCount;

    // PEP in last 6 months
    const pepRecords = records.filter((r) => r.record_type === "pep_meeting" || r.linked_pep);
    const recentPEP = pepRecords.find((r) => new Date(r.date) >= cutoff6m);
    const hasPEPInLast6Months = !!recentPEP;
    const lastPEPDate = pepRecords[0]?.date ?? null;

    // Achievements
    const achievementCount = records.filter((r) => r.record_type === "achievement").length;

    // Open concerns / monitoring
    const openConcernCount = records.filter((r) => r.record_type === "concern" && r.status === "open").length;
    const monitoringCount = records.filter((r) => r.status === "monitoring").length;

    // Staff attended meetings (pep or attainment or concern where staff_id is recorded)
    const meetingTypes = new Set(["pep_meeting", "attainment", "concern", "provision_change"]);
    const staffAttendedMeetings = records.some((r) => meetingTypes.has(r.record_type) && r.staff_id);

    const signal = educationSignal(
      attendanceRate, exclusionCount, hasPEPInLast6Months,
      achievementCount, openConcernCount, schoolChanges, attendanceRecs.length,
    );

    return {
      childId: yp.id,
      childName: `${yp.first_name} ${yp.last_name}`,
      currentSchool,
      schoolChanges,
      attendanceRecords: attendanceRecs.length,
      presentCount,
      absentCount,
      excludedCount,
      attendanceRate,
      exclusionCount,
      hasPEPInLast6Months,
      lastPEPDate,
      achievementCount,
      openConcernCount,
      monitoringCount,
      staffAttendedMeetings,
      signal,
      supervisionPrompt: buildPrompt(
        `${yp.first_name} ${yp.last_name}`, signal, attendanceRate, exclusionCount,
        hasPEPInLast6Months, lastPEPDate, schoolChanges, achievementCount, openConcernCount,
      ),
    };
  });

  // Sort: crisis → vulnerable → engaged → thriving
  const ORDER: Record<EducationSignal, number> = {
    crisis: 0, vulnerable: 1, engaged: 2, thriving: 3,
  };
  childProfiles.sort((a, b) => ORDER[a.signal] - ORDER[b.signal]);

  // ── Home summary ──────────────────────────────────────────────────────────
  const signalCounts = childProfiles.reduce(
    (acc, p) => { acc[p.signal]++; return acc; },
    { thriving: 0, engaged: 0, vulnerable: 0, crisis: 0 } as Record<EducationSignal, number>,
  );

  const allAttendanceRecs = childProfiles.reduce((s, p) => s + p.attendanceRecords, 0);
  const allPresent = childProfiles.reduce((s, p) => s + p.presentCount, 0);
  const homeAttendanceRate = allAttendanceRecs > 0 ? Math.round((allPresent / allAttendanceRecs) * 100) : null;

  const withCurrentPEP = childProfiles.filter((p) => p.hasPEPInLast6Months).length;
  const withExclusions = childProfiles.filter((p) => p.exclusionCount > 0).length;
  const totalAchievements = childProfiles.reduce((s, p) => s + p.achievementCount, 0);

  const ofstedNote =
    signalCounts.crisis > 0
      ? `${signalCounts.crisis} child${signalCounts.crisis > 1 ? "ren" : ""} in crisis educational position. An inspector will ask what the home is doing to address exclusions and disengagement for these children.`
      : withCurrentPEP < currentChildren.length
      ? `${currentChildren.length - withCurrentPEP} child${currentChildren.length - withCurrentPEP > 1 ? "ren" : ""} without a current PEP recorded. LAC children are entitled to regular PEP reviews — ensure the Virtual School is convening them.`
      : (homeAttendanceRate ?? 0) < 85
      ? `Home attendance rate is ${homeAttendanceRate}%. Below 90% for LAC children attracts Ofsted scrutiny. Explore what is preventing consistent school attendance.`
      : `Home attendance rate is ${homeAttendanceRate}%. ${withCurrentPEP} of ${currentChildren.length} children have a current PEP. ${totalAchievements} educational achievement${totalAchievements !== 1 ? "s" : ""} recorded.`;

  const summary: EducationStabilitySummary = {
    totalChildren: currentChildren.length,
    ...signalCounts,
    homeAttendanceRate,
    childrenWithCurrentPEP: withCurrentPEP,
    childrenWithExclusions: withExclusions,
    totalAchievements,
    ofstedNote,
  };

  return NextResponse.json({ data: { childProfiles, summary } });
}
