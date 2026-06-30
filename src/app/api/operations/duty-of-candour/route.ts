import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  CANDOUR_TRIGGERS,
  CANDOUR_STATUSES,
  INVESTIGATION_OUTCOMES,
} from "@/lib/services/duty-of-candour-service";
import type {
  CandourTrigger,
  CandourStatus,
} from "@/lib/services/duty-of-candour-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "candour_triggers") {
    return NextResponse.json({ ok: true, data: CANDOUR_TRIGGERS });
  }
  if (type === "candour_statuses") {
    return NextResponse.json({ ok: true, data: CANDOUR_STATUSES });
  }
  if (type === "investigation_outcomes") {
    return NextResponse.json({ ok: true, data: INVESTIGATION_OUTCOMES });
  }

  // Records (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    trigger: (searchParams.get("trigger") ?? undefined) as CandourTrigger | undefined,
    status: (searchParams.get("status") ?? undefined) as CandourStatus | undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const __parsed = await readJsonBody(request);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const { action, ...payload } = body;

  if (action === "create_record") {
    const result = await createRecord(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_record") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateRecord(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
