import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  APPOINTMENT_TYPES,
  APPOINTMENT_STATUSES,
  APPOINTMENT_OUTCOMES,
  CONSENT_STATUSES,
} from "@/lib/services/health-appointments-service";
import type {
  AppointmentType,
  AppointmentStatus,
} from "@/lib/services/health-appointments-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "appointment_types") return NextResponse.json({ ok: true, data: APPOINTMENT_TYPES });
  if (type === "appointment_statuses") return NextResponse.json({ ok: true, data: APPOINTMENT_STATUSES });
  if (type === "appointment_outcomes") return NextResponse.json({ ok: true, data: APPOINTMENT_OUTCOMES });
  if (type === "consent_statuses") return NextResponse.json({ ok: true, data: CONSENT_STATUSES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    appointmentType: (searchParams.get("appointmentType") ?? undefined) as AppointmentType | undefined,
    appointmentStatus: (searchParams.get("appointmentStatus") ?? undefined) as AppointmentStatus | undefined,
    childName: searchParams.get("childName") ?? undefined,
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
