import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listMeetings,
  createMeeting,
  updateMeeting,
  listConsultations,
  createConsultation,
  MEETING_TYPES,
  CONSULTATION_TYPES,
  IMPACT_RATINGS,
} from "@/lib/services/meetings-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "meeting_types") {
    return NextResponse.json({ ok: true, data: MEETING_TYPES });
  }
  if (type === "consultation_types") {
    return NextResponse.json({ ok: true, data: CONSULTATION_TYPES });
  }
  if (type === "impact_ratings") {
    return NextResponse.json({ ok: true, data: IMPACT_RATINGS });
  }

  // Consultation records
  if (type === "consultations") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listConsultations(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      consultationType: searchParams.get("consultationType") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // House meetings (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listMeetings(homeId, {
    meetingType: searchParams.get("meetingType") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
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

    if (action === "create_meeting") {
      const result = await createMeeting({
        home_id: homeId,
        meeting_date: body.meetingDate,
        meeting_type: body.meetingType ?? "house_meeting",
        facilitated_by: body.facilitatedBy,
        children_present: body.childrenPresent ?? [],
        children_absent: body.childrenAbsent ?? [],
        agenda_items: body.agendaItems ?? [],
        actions: body.actions ?? [],
        child_feedback_summary: body.childFeedbackSummary ?? "",
        staff_response: body.staffResponse ?? "",
        next_meeting_date: body.nextMeetingDate,
        minutes_approved: body.minutesApproved ?? false,
        approved_by: body.approvedBy,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_meeting") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateMeeting(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_consultation") {
      const result = await createConsultation({
        home_id: homeId,
        child_id: body.childId,
        child_name: body.childName,
        consultation_date: body.consultationDate,
        consultation_type: body.consultationType,
        topic: body.topic,
        child_views: body.childViews ?? "",
        outcome: body.outcome ?? "",
        action_taken: body.actionTaken,
        consulted_by: body.consultedBy,
        impact_rating: body.impactRating ?? "no_impact",
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: "action must be create_meeting, update_meeting, or create_consultation" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
