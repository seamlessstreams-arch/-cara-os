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
  MEETING_STATUSES,
  TOPIC_CATEGORIES,
  ACTION_OUTCOMES,
} from "@/lib/services/childrens-participation-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "meeting_types") {
    return NextResponse.json({ ok: true, data: MEETING_TYPES });
  }
  if (type === "meeting_statuses") {
    return NextResponse.json({ ok: true, data: MEETING_STATUSES });
  }
  if (type === "topic_categories") {
    return NextResponse.json({ ok: true, data: TOPIC_CATEGORIES });
  }
  if (type === "action_outcomes") {
    return NextResponse.json({ ok: true, data: ACTION_OUTCOMES });
  }

  // Consultations
  if (type === "consultations") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listConsultations(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      topic: (searchParams.get("topic") ?? undefined) as never,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Meetings (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listMeetings(homeId, {
    meetingType: (searchParams.get("meetingType") ?? undefined) as never,
    status: (searchParams.get("status") ?? undefined) as never,
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
        homeId,
        meetingType: body.meetingType,
        meetingDate: body.meetingDate,
        scheduledTime: body.scheduledTime,
        durationMinutes: body.durationMinutes,
        facilitator: body.facilitator,
        childrenInvited: body.childrenInvited,
        childrenAttended: body.childrenAttended,
        staffPresent: body.staffPresent,
        topics: body.topics,
        decisionsMade: body.decisionsMade,
        actions: body.actions,
        childSatisfactionCollected: body.childSatisfactionCollected,
        overallEngagement: body.overallEngagement,
        status: body.status,
        notes: body.notes,
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
        homeId,
        childId: body.childId,
        childName: body.childName,
        consultationDate: body.consultationDate,
        consultedBy: body.consultedBy,
        topic: body.topic,
        context: body.context,
        childViews: body.childViews,
        childPreferences: body.childPreferences,
        outcome: body.outcome,
        actionTaken: body.actionTaken,
        childInformedOfOutcome: body.childInformedOfOutcome,
        childSatisfiedWithResponse: body.childSatisfiedWithResponse,
        notes: body.notes,
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
