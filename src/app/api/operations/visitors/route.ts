import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listVisitorEntries,
  createVisitorEntry,
  updateVisitorEntry,
  signOutVisitor,
  VISITOR_TYPES,
  VISIT_PURPOSES,
} from "@/lib/services/visitors-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "visitor_types") {
    return NextResponse.json({ ok: true, data: VISITOR_TYPES });
  }
  if (type === "visit_purposes") {
    return NextResponse.json({ ok: true, data: VISIT_PURPOSES });
  }

  // Visitor entries (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listVisitorEntries(homeId, {
    date: searchParams.get("date") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    visitorType: searchParams.get("visitorType") ?? undefined,
    childId: searchParams.get("childId") ?? undefined,
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

    if (action === "sign_in") {
      const result = await createVisitorEntry({
        home_id: homeId,
        visitor_name: body.visitorName,
        visitor_type: body.visitorType,
        organisation: body.organisation,
        purpose: body.purpose,
        child_visited: body.childVisited,
        child_name: body.childName,
        arrival_time: body.arrivalTime ?? new Date().toISOString(),
        departure_time: body.departureTime,
        duration_minutes: body.durationMinutes,
        dbs_checked: body.dbsChecked ?? false,
        id_verified: body.idVerified ?? false,
        notes: body.notes,
        recorded_by: body.recordedBy,
        date: body.date ?? new Date().toISOString().split("T")[0],
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "sign_out") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await signOutVisitor(id);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "update") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateVisitorEntry(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be sign_in, sign_out, or update" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
