import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  TRANSPORT_EVENT_TYPES,
  VEHICLE_STATUSES,
  JOURNEY_PURPOSES,
  DRIVER_COMPLIANCE_STATUSES,
} from "@/lib/services/transport-safety-service";
import type {
  TransportEventType,
  VehicleStatus,
  DriverCompliance,
} from "@/lib/services/transport-safety-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "transport_event_types") return NextResponse.json({ ok: true, data: TRANSPORT_EVENT_TYPES });
  if (type === "vehicle_statuses") return NextResponse.json({ ok: true, data: VEHICLE_STATUSES });
  if (type === "journey_purposes") return NextResponse.json({ ok: true, data: JOURNEY_PURPOSES });
  if (type === "driver_compliance_statuses") return NextResponse.json({ ok: true, data: DRIVER_COMPLIANCE_STATUSES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    eventType: (searchParams.get("eventType") ?? undefined) as TransportEventType | undefined,
    vehicleStatus: (searchParams.get("vehicleStatus") ?? undefined) as VehicleStatus | undefined,
    driverCompliance: (searchParams.get("driverCompliance") ?? undefined) as DriverCompliance | undefined,
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
