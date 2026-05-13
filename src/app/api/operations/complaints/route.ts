import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listComplaints,
  getComplaint,
  createComplaint,
  updateComplaint,
  closeComplaint,
  listNotifications,
  createNotification,
  sendNotification,
  COMPLAINT_CATEGORIES,
  COMPLAINT_SOURCES,
  REG40_NOTIFICATION_TYPES,
  COMPLAINT_STAGES,
} from "@/lib/services/complaints-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "categories") {
    return NextResponse.json({ ok: true, data: COMPLAINT_CATEGORIES });
  }
  if (type === "sources") {
    return NextResponse.json({ ok: true, data: COMPLAINT_SOURCES });
  }
  if (type === "notification_types") {
    return NextResponse.json({ ok: true, data: REG40_NOTIFICATION_TYPES });
  }
  if (type === "stages") {
    return NextResponse.json({ ok: true, data: COMPLAINT_STAGES });
  }

  // Reg 40 notifications
  if (type === "notifications") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listNotifications(homeId, {
      status: searchParams.get("status") ?? undefined,
      notificationType: searchParams.get("notificationType") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Single complaint
  const id = searchParams.get("id");
  if (id) {
    const result = await getComplaint(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // List complaints
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listComplaints(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, homeId } = body;

    if (!homeId) {
      return NextResponse.json({ error: "homeId required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    if (action === "create_complaint") {
      const result = await createComplaint({
        home_id: homeId,
        complaint_category: body.complaintCategory,
        source: body.source,
        complainant_name: body.complainantName,
        child_id: body.childId,
        staff_id: body.staffId,
        date_received: body.dateReceived ?? new Date().toISOString().slice(0, 10),
        date_acknowledged: body.dateAcknowledged,
        date_responded: body.dateResponded,
        stage: body.stage ?? "informal",
        description: body.description,
        desired_outcome: body.desiredOutcome,
        investigation_notes: body.investigationNotes,
        outcome: body.outcome,
        actions_taken: body.actionsTaken ?? [],
        lessons_learned: body.lessonsLearned,
        complainant_satisfied: body.complainantSatisfied,
        advocacy_offered: body.advocacyOffered ?? false,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_complaint") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateComplaint(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "close_complaint") {
      const { id, outcome, lessonsLearned } = body;
      if (!id || !outcome) return NextResponse.json({ error: "id and outcome required" }, { status: 400 });
      const result = await closeComplaint(id, outcome, lessonsLearned);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_notification") {
      const result = await createNotification({
        home_id: homeId,
        notification_type: body.notificationType,
        child_id: body.childId,
        staff_id: body.staffId,
        linked_incident_id: body.linkedIncidentId,
        linked_complaint_id: body.linkedComplaintId,
        event_date: body.eventDate,
        notification_date: body.notificationDate,
        sent_by: body.sentBy,
        ofsted_reference: body.ofstedReference,
        description: body.description,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "send_notification") {
      const { id, sentBy, ofstedReference } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await sendNotification(id, sentBy, ofstedReference);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_complaint, update_complaint, close_complaint, create_notification, or send_notification" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
