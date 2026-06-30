import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  ABSENCE_TYPES,
  ABSENCE_DURATIONS,
  INTERVENTION_STATUSES,
  ATTENDANCE_RISKS,
} from "@/lib/services/childrens-absence-service";
import type {
  AbsenceType,
  InterventionStatus,
  AttendanceRisk,
} from "@/lib/services/childrens-absence-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "absence_types") return NextResponse.json({ ok: true, data: ABSENCE_TYPES });
  if (type === "absence_durations") return NextResponse.json({ ok: true, data: ABSENCE_DURATIONS });
  if (type === "intervention_statuses") return NextResponse.json({ ok: true, data: INTERVENTION_STATUSES });
  if (type === "attendance_risks") return NextResponse.json({ ok: true, data: ATTENDANCE_RISKS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    absenceType: (searchParams.get("absenceType") ?? undefined) as AbsenceType | undefined,
    interventionStatus: (searchParams.get("interventionStatus") ?? undefined) as InterventionStatus | undefined,
    attendanceRisk: (searchParams.get("attendanceRisk") ?? undefined) as AttendanceRisk | undefined,
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
