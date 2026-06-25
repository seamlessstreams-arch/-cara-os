import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
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

export async function GET(request: NextRequest) {
  const childId = request.nextUrl.searchParams.get("childId");

  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }

  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  const child = store.youngPeople.find((yp) => yp.id === childId);
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const childName = `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim() || "Unknown";

  // ── Derive school name from most recent education record ──────────────
  const childEduRecords = (store.educationRecords ?? []).filter((r: any) => r.child_id === childId);
  const sortedEdu = [...childEduRecords].sort(
    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const schoolName = (sortedEdu[0] as any)?.school ?? null;

  // ── Education Records ─────────────────────────────────────────────────
  const education_records: EducationRecordInput[] = childEduRecords.map((r: any) => ({
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
  const attendance_records: EduAttendanceInput[] = (store.eduAttendanceRecords ?? [])
    .filter((r: any) => r.child_id === childId)
    .map((r: any) => ({
      id: r.id,
      date: (r.date ?? "").slice(0, 10),
      attendance_code: r.attendance_code ?? "/",
      session: r.session ?? "full_day",
    }));

  // ── EHCP ──────────────────────────────────────────────────────────────
  const ehcpRecords = (store.ehcpRecords ?? []).filter((r: any) => r.child_id === childId);
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
  const homework_sessions: HomeworkSessionInput[] = (store.homeworkSessions ?? [])
    .filter((h: any) => h.child_id === childId)
    .map((h: any) => ({
      id: h.id,
      date: (h.date ?? "").slice(0, 10),
      subject: h.subject ?? "General",
      duration_minutes: h.duration_minutes ?? h.duration ?? 30,
      completion_level: h.completion_level ?? h.completion ?? "completed",
      support_needed: h.support_needed ?? h.support_level ?? "none",
      engagement: h.engagement ?? "willing",
    }));

  // ── Tutoring Sessions ─────────────────────────────────────────────────
  const tutoring_sessions: TutoringInput[] = (store.tutoringRecords ?? [])
    .filter((t: any) => t.child_id === childId)
    .map((t: any) => ({
      id: t.id,
      date: (t.date ?? "").slice(0, 10),
      subject: t.subject ?? "General",
      duration_minutes: t.duration_minutes ?? t.duration ?? 60,
      tutor_feedback: t.tutor_feedback ?? t.feedback ?? "",
      progress_rating: t.progress_rating ?? t.rating ?? 3,
    }));

  // ── School Engagement Events ──────────────────────────────────────────
  const school_engagement_events: SchoolEngagementInput[] = (store.schoolEngagementEvents ?? [])
    .filter((e: any) => e.child_id === childId)
    .map((e: any) => ({
      id: e.id,
      date: (e.date ?? "").slice(0, 10),
      event_type: e.event_type ?? "other",
      attended: e.attended ?? false,
      staff_attended: e.staff_attended ?? false,
      child_feedback: e.child_feedback ?? e.feedback ?? "",
    }));

  // ── PEP Records ───────────────────────────────────────────────────────
  const pep_records: PepRecordInput[] = (store.pepRecords ?? [])
    .filter((p: any) => p.child_id === childId)
    .map((p: any) => ({
      id: p.id,
      date: (p.date ?? p.meeting_date ?? "").slice(0, 10),
      attendees: p.attendees ?? [],
      targets_set: p.targets_set ?? 0,
      targets_achieved: p.targets_achieved ?? 0,
      next_review_date: p.next_review_date ? p.next_review_date.slice(0, 10) : null,
      virtual_school_involved: p.virtual_school_involved ?? p.vsh_attended ?? false,
      child_participated: p.child_participated ?? false,
      pupil_premium_discussed: p.pupil_premium_discussed ?? p.pp_discussed ?? false,
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
