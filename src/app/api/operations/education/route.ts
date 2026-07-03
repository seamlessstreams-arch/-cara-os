import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listEducationRecords,
  getEducationRecord,
  createEducationRecord,
  updateEducationRecord,
  recordAttendance,
  listAttendance,
  recordActivity,
  listActivities,
  EDUCATION_STATUSES,
  ATTENDANCE_MARKS,
  ACTIVITY_CATEGORIES,
  EXCLUSION_TYPES,
  PEP_TARGETS_STATUS,
} from "@/lib/services/education-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "statuses") {
    return NextResponse.json({ ok: true, data: EDUCATION_STATUSES });
  }
  if (type === "attendance_marks") {
    return NextResponse.json({ ok: true, data: ATTENDANCE_MARKS });
  }
  if (type === "activity_categories") {
    return NextResponse.json({ ok: true, data: ACTIVITY_CATEGORIES });
  }
  if (type === "exclusion_types") {
    return NextResponse.json({ ok: true, data: EXCLUSION_TYPES });
  }
  if (type === "pep_targets_status") {
    return NextResponse.json({ ok: true, data: PEP_TARGETS_STATUS });
  }

  // Attendance entries
  if (type === "attendance") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listAttendance(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      educationRecordId: searchParams.get("educationRecordId") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Activities
  if (type === "activities") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listActivities(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Single education record
  const id = searchParams.get("id");
  if (id) {
    const result = await getEducationRecord(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // List education records
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listEducationRecords(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    currentOnly: searchParams.get("currentOnly") !== "false",
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { action, homeId } = body;

    if (!homeId) {
      return NextResponse.json({ error: "homeId required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    if (action === "create_record") {
      const result = await createEducationRecord({
        home_id: homeId,
        child_id: body.childId,
        education_status: body.educationStatus,
        school_name: body.schoolName ?? "",
        year_group: body.yearGroup,
        sen_status: body.senStatus,
        pupil_premium_plus: body.pupilPremiumPlus ?? false,
        virtual_school_contact: body.virtualSchoolContact,
        designated_teacher: body.designatedTeacher,
        pep_date: body.pepDate,
        next_pep_date: body.nextPepDate,
        attendance_percentage: body.attendancePercentage,
        achievements: body.achievements ?? [],
        concerns: body.concerns ?? [],
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_record") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateEducationRecord(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "record_attendance") {
      const result = await recordAttendance({
        home_id: homeId,
        child_id: body.childId,
        education_record_id: body.educationRecordId,
        date: body.date,
        mark: body.mark,
        session: body.session,
        notes: body.notes,
        recorded_by: body.recordedBy,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "record_activity") {
      const result = await recordActivity({
        home_id: homeId,
        child_id: body.childId,
        activity_name: body.activityName,
        category: body.category,
        date: body.date,
        duration_minutes: body.durationMinutes,
        location: body.location,
        description: body.description,
        child_feedback: body.childFeedback,
        child_enjoyed: body.childEnjoyed ?? true,
        skills_developed: body.skillsDeveloped ?? [],
        staff_member: body.staffMember,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: "action must be create_record, update_record, record_attendance, or record_activity" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
