import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listSupervisions,
  getSupervision,
  createSupervision,
  updateSupervision,
  completeSupervision,
  SUPERVISION_FREQUENCIES,
  SUPERVISION_AGENDA_TEMPLATE,
} from "@/lib/services/supervision-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  // Static data (no DB needed)
  if (type === "frequencies") {
    return NextResponse.json({ ok: true, data: SUPERVISION_FREQUENCIES });
  }
  if (type === "agenda_template") {
    return NextResponse.json({ ok: true, data: SUPERVISION_AGENDA_TEMPLATE });
  }

  // Single record
  const id = searchParams.get("id");
  if (id) {
    const result = await getSupervision(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  // List supervisions
  const result = await listSupervisions(homeId, {
    staffId: searchParams.get("staffId") ?? undefined,
    supervisorId: searchParams.get("supervisorId") ?? undefined,
    status: (searchParams.get("status") as "scheduled" | "completed") ?? undefined,
    type: (searchParams.get("supervisionType") as "formal" | "informal") ?? undefined,
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
      const result = await createSupervision({
        homeId,
        staffId: body.staffId,
        supervisorId: body.supervisorId,
        type: body.type ?? "formal",
        scheduledDate: body.scheduledDate,
        location: body.location,
        agendaItems: body.agendaItems ?? SUPERVISION_AGENDA_TEMPLATE,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateSupervision(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "complete") {
      const { id, ...completionData } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await completeSupervision(id, completionData);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json({ error: "action must be create, update, or complete" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
