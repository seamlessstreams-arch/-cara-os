import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listNotifiableEvents,
  createNotifiableEvent,
  updateNotifiableEvent,
  listEventNotifications,
  createEventNotification,
  updateEventNotification,
  acknowledgeNotification,
  NOTIFIABLE_EVENT_TYPES,
  NOTIFICATION_STATUS,
} from "@/lib/services/notifiable-events-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "event_types") {
    return NextResponse.json({ ok: true, data: NOTIFIABLE_EVENT_TYPES });
  }
  if (type === "notification_statuses") {
    return NextResponse.json({ ok: true, data: NOTIFICATION_STATUS });
  }

  // Event notifications
  if (type === "notifications") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listEventNotifications(homeId, {
      eventId: searchParams.get("eventId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      recipientType: searchParams.get("recipientType") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Notifiable events (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listNotifiableEvents(homeId, {
    eventType: searchParams.get("eventType") ?? undefined,
    childId: searchParams.get("childId") ?? undefined,
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

    if (action === "create_event") {
      const result = await createNotifiableEvent({
        home_id: homeId,
        event_type: body.eventType,
        event_date: body.eventDate,
        event_time: body.eventTime,
        child_id: body.childId,
        child_name: body.childName,
        staff_involved: body.staffInvolved ?? [],
        description: body.description ?? "",
        immediate_actions_taken: body.immediateActionsTaken ?? "",
        outcome: body.outcome,
        reported_by: body.reportedBy,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_event") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateNotifiableEvent(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_notification") {
      const result = await createEventNotification({
        home_id: homeId,
        event_id: body.eventId,
        recipient_type: body.recipientType,
        recipient_name: body.recipientName,
        sent_date: body.sentDate,
        sent_by: body.sentBy,
        method: body.method ?? "email",
        reference_number: body.referenceNumber,
        status: body.status ?? "draft",
        deadline: body.deadline,
        acknowledged_date: body.acknowledgedDate,
        acknowledged_by: body.acknowledgedBy,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_notification") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateEventNotification(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "acknowledge") {
      const { id, acknowledgedBy } = body;
      if (!id || !acknowledgedBy) return NextResponse.json({ error: "id and acknowledgedBy required" }, { status: 400 });
      const result = await acknowledgeNotification(id, acknowledgedBy);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_event, update_event, create_notification, update_notification, or acknowledge" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
