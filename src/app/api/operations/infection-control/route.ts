import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  INFECTION_EVENT_TYPES,
  HYGIENE_STANDARDS,
  OUTBREAK_STATUSES,
  PPE_COMPLIANCES,
} from "@/lib/services/infection-control-service";
import type {
  InfectionEventType,
  HygieneStandard,
  OutbreakStatus,
} from "@/lib/services/infection-control-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "infection_event_types") return NextResponse.json({ ok: true, data: INFECTION_EVENT_TYPES });
  if (type === "hygiene_standards") return NextResponse.json({ ok: true, data: HYGIENE_STANDARDS });
  if (type === "outbreak_statuses") return NextResponse.json({ ok: true, data: OUTBREAK_STATUSES });
  if (type === "ppe_compliances") return NextResponse.json({ ok: true, data: PPE_COMPLIANCES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    eventType: (searchParams.get("eventType") ?? undefined) as InfectionEventType | undefined,
    hygieneStandard: (searchParams.get("hygieneStandard") ?? undefined) as HygieneStandard | undefined,
    outbreakStatus: (searchParams.get("outbreakStatus") ?? undefined) as OutbreakStatus | undefined,
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
