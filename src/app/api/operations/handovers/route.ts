import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listHandovers,
  createHandover,
  updateHandover,
  completeHandover,
  HANDOVER_TYPES,
  CHILD_STATUS_OPTIONS,
  PRIORITY_FLAGS,
} from "@/lib/services/handover-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "handover_types") {
    return NextResponse.json({ ok: true, data: HANDOVER_TYPES });
  }
  if (type === "child_statuses") {
    return NextResponse.json({ ok: true, data: CHILD_STATUS_OPTIONS });
  }
  if (type === "priorities") {
    return NextResponse.json({ ok: true, data: PRIORITY_FLAGS });
  }

  // Handovers (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listHandovers(homeId, {
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    handoverType: searchParams.get("handoverType") ?? undefined,
    completed: searchParams.get("completed") === "true" ? true : searchParams.get("completed") === "false" ? false : undefined,
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

    if (action === "create") {
      const result = await createHandover({
        home_id: homeId,
        handover_type: body.handoverType ?? "shift_change",
        shift_date: body.shiftDate,
        outgoing_staff: body.outgoingStaff ?? [],
        incoming_staff: body.incomingStaff ?? [],
        child_updates: body.childUpdates ?? [],
        incidents_summary: body.incidentsSummary ?? [],
        tasks_carried_forward: body.tasksCarriedForward ?? [],
        safeguarding_flags: body.safeguardingFlags ?? [],
        general_notes: body.generalNotes,
        priority: body.priority ?? "routine",
        completed: body.completed ?? false,
        completed_at: body.completedAt,
        created_by: body.createdBy,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateHandover(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "complete") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await completeHandover(id);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create, update, or complete" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
