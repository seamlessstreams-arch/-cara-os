import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import type { ChildInitiation } from "@/types/extended";
import { dal } from "@/lib/db";
import { todayStr } from "@/lib/utils";
import {
  computeChildEducationIntelligence,
  type ChildEducationIntelligenceInput,
  type EducationRecordInput,
  type EduAttendanceInput,
  type EhcpInput,
  type HomeworkSessionInput,
  type TutoringInput,
  type SchoolEngagementInput,
  type PepRecordInput,
} from "@/lib/engines/child-education-intelligence-engine";

export const dynamic = "force-dynamic";

// ChildInitiation and the engine's homework engagement scale are the same
// four-point ordinal in different words.
const HOMEWORK_ENGAGEMENT: Record<ChildInitiation, string> = {
  self_started: "enthusiastic",
  reminded: "willing",
  resisted_then_engaged: "reluctant",
  refused: "refused",
};

export async function GET(request: NextRequest) {
  const childId = request.nextUrl.searchParams.get("childId");

  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }

  const [eduAttendanceRecordsList, educationRecordsList, ehcpRecordsList, homeworkSessionsList, pepRecordsList, schoolEngagementEventsList, tutoringRecordsList, youngPeopleList] = await Promise.all([dal.eduAttendanceRecords.findAll(), dal.educationRecords.findAll(), dal.ehcpRecords.findAll(), dal.homeworkSessions.findAll(), dal.pepRecords.findAll(), dal.schoolEngagementEvents.findAll(), dal.tutoringRecords.findAll(), dal.youngPeople.findAll()]);
  const today = todayStr();

  const child = youngPeopleList.find((yp) => yp.id === childId);
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const childName = `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim() || "Unknown";

  // ── Derive school name from most recent education record ──────────────
  const childEduRecords = (educationRecordsList ?? []).filter((r) => r.child_id === childId);
  const sortedEdu = [...childEduRecords].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const schoolName = (sortedEdu[0] as any)?.school ?? null;

  // ── Education Records ─────────────────────────────────────────────────
  const education_records: EducationRecordInput[] = childEduRecords.map((r) => ({
    id: r.id,
    date: (r.date ?? "").slice(0, 10),
    record_type: r.record_type ?? "attendance",
    school: r.school ?? null,
    attendance_status: r.attendance_status ?? null,
    linked_pep: r.linked_pep ?? false,
    status: r.status ?? "open",
    details: r.details ?? r.title ?? "",
  }));

  // ── Formal Attendance Records ─────────────────────────────────────────
  const attendance_records: EduAttendanceInput[] = (eduAttendanceRecordsList ?? [])
    .filter((r) => r.child_id === childId)
    .map((r) => ({
      id: r.id,
      date: (r.date ?? "").slice(0, 10),
      attendance_code: r.attendance_code ?? "/",
      session: r.session ?? "full_day",
    }));

  // ── EHCP ──────────────────────────────────────────────────────────────
  const ehcpRecords = (ehcpRecordsList ?? []).filter((r) => r.child_id === childId);
  let ehcp: EhcpInput | null = null;
  if (ehcpRecords.length > 0) {
    const e = ehcpRecords[0] as any;
    ehcp = {
      id: e.id,
      status: e.status ?? "active",
      plan_type: e.plan_type ?? "ehcp",
      review_date: e.review_date ? e.review_date.slice(0, 10) : null,
      annual_review_due: e.annual_review_due ? e.annual_review_due.slice(0, 10) : null,
      needs_areas: e.needs_areas ?? [],
      provision_in_place: e.provision_in_place ?? false,
    };
  }

  // ── Homework Sessions ─────────────────────────────────────────────────
  const homework_sessions: HomeworkSessionInput[] = (homeworkSessionsList ?? [])
    .filter((h) => h.child_id === childId)
    .map((h) => ({
      id: h.id,
      date: (h.date ?? "").slice(0, 10),
      subject: h.subject ?? "General",
      duration_minutes: h.duration_minutes,
      // HomeworkSession records `work_completed` as a boolean, so "partial" and
      // "refused" cannot be told apart here — the two states it can evidence
      // are the two it reports.
      completion_level: h.work_completed ? "completed" : "not_started",
      // Likewise it records WHO supported, not how much support was needed.
      // Read as a two-point answer rather than inventing the middle of a
      // four-point scale.
      support_needed: h.supporting_staff.trim().length > 0 ? "moderate" : "none",
      // ChildInitiation and the engine's engagement scale are the same
      // four-point ordinal in different words.
      engagement: HOMEWORK_ENGAGEMENT[h.child_initiation],
    }));

  // ── Tutoring Sessions ─────────────────────────────────────────────────
  const tutoring_sessions: TutoringInput[] = (tutoringRecordsList ?? [])
    .filter((t) => t.child_id === childId)
    .map((t) => ({
      id: t.id,
      // A TutoringRecord is an arrangement, not a session: it has start_date,
      // hours_per_week and a staff observation, and none of date, duration or
      // a progress rating.
      date: t.start_date.slice(0, 10),
      subject: t.subject,
      duration_minutes: Math.round(t.hours_per_week * 60),
      tutor_feedback: t.staff_observation,
      // Nothing grades tutoring progress numerically. baseline_grade and
      // current_grade are free-text grades, and child_motivation measures
      // motivation, not progress. A hard-coded 3 was a middling score reported
      // about every arrangement.
      progress_rating: null,
    }));

  // ── School Engagement Events ──────────────────────────────────────────
  const school_engagement_events: SchoolEngagementInput[] = (schoolEngagementEventsList ?? [])
    .filter((e) => e.child_id === childId)
    .map((e) => ({
      id: e.id,
      date: e.event_date.slice(0, 10),
      event_type: e.event_type,
      // The record says who came FROM THE HOME (`attended_by`); it does not
      // record whether the child themselves attended. `false` said they did
      // not, about every event.
      attended: null,
      staff_attended: e.attended_by.length > 0,
      child_feedback: e.child_voice,
    }));

  // ── PEP Records ───────────────────────────────────────────────────────
  const pep_records: PepRecordInput[] = (pepRecordsList ?? [])
    .filter((p) => p.child_id === childId)
    .map((p) => ({
      id: p.id,
      // None of date, attendees, targets_set/achieved, virtual_school_involved,
      // child_participated or pupil_premium_discussed is on PepRecord, so the
      // engine was told every PEP had no date, no targets, no virtual school,
      // no child participation and no pupil premium — four rates reading 0%.
      date: p.pep_date.slice(0, 10),
      // PepRecord names the people involved by role rather than keeping an
      // attendee list; these are the ones it records.
      attendees: [p.designated_teacher, p.virtual_school_contact, p.key_worker].filter(
        (name) => name.trim().length > 0,
      ),
      targets_set: p.targets.length,
      // A PEP target records PROGRESS, not achievement: on_track / some_progress
      // / limited_progress / exceeded. Only "exceeded" unambiguously means the
      // target was met, so that is what counts here — deliberately conservative
      // rather than reading "on track" as done.
      targets_achieved: p.targets.filter((t) => t.progress === "exceeded").length,
      next_review_date: p.next_review_date ? p.next_review_date.slice(0, 10) : null,
      virtual_school_involved: p.virtual_school_contact.trim().length > 0,
      child_participated: p.child_views.trim().length > 0,
      pupil_premium_discussed:
        p.pupil_premium.annual_allocation > 0 || p.pupil_premium.items.length > 0,
    }));

  const engineInput: ChildEducationIntelligenceInput = {
    today,
    child_id: childId,
    child_name: childName,
    school_name: schoolName,
    education_records,
    attendance_records,
    ehcp,
    homework_sessions,
    tutoring_sessions,
    school_engagement_events,
    pep_records,
  };

  const result = computeChildEducationIntelligence(engineInput);
  return NextResponse.json({ data: result });
}
