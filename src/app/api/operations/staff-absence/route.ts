import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listAbsences,
  createAbsence,
  updateAbsence,
  ABSENCE_TYPES,
  SICKNESS_REASONS,
  ABSENCE_STATUSES,
  RETURN_TO_WORK_STATUSES,
} from "@/lib/services/staff-absence-service";
import type {
  AbsenceType,
  AbsenceStatus,
} from "@/lib/services/staff-absence-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "absence_types") {
    return NextResponse.json({ ok: true, data: ABSENCE_TYPES });
  }
  if (type === "sickness_reasons") {
    return NextResponse.json({ ok: true, data: SICKNESS_REASONS });
  }
  if (type === "absence_statuses") {
    return NextResponse.json({ ok: true, data: ABSENCE_STATUSES });
  }
  if (type === "rtw_statuses") {
    return NextResponse.json({ ok: true, data: RETURN_TO_WORK_STATUSES });
  }

  // Absences (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listAbsences(homeId, {
    absenceType: (searchParams.get("absenceType") ?? undefined) as AbsenceType | undefined,
    status: (searchParams.get("status") ?? undefined) as AbsenceStatus | undefined,
    staffName: searchParams.get("staffName") ?? undefined,
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

  if (action === "create_absence") {
    const result = await createAbsence(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_absence") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateAbsence(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
