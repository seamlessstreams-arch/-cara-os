import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRotaEntries,
  getRotaEntry,
  createRotaEntry,
  updateRotaEntry,
  listAbsences,
  createAbsence,
  approveAbsence,
  SHIFT_TYPES,
  ABSENCE_TYPES,
  STAFF_ROLES,
} from "@/lib/services/rota-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "shift_types") {
    return NextResponse.json({ ok: true, data: SHIFT_TYPES });
  }
  if (type === "absence_types") {
    return NextResponse.json({ ok: true, data: ABSENCE_TYPES });
  }
  if (type === "staff_roles") {
    return NextResponse.json({ ok: true, data: STAFF_ROLES });
  }

  // Absences
  if (type === "absences") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listAbsences(homeId, {
      staffId: searchParams.get("staffId") ?? undefined,
      absenceType: searchParams.get("absenceType") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Single rota entry
  const id = searchParams.get("id");
  if (id) {
    const result = await getRotaEntry(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // List rota entries
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listRotaEntries(homeId, {
    staffId: searchParams.get("staffId") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
    shiftType: searchParams.get("shiftType") ?? undefined,
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

    if (action === "create_entry") {
      const result = await createRotaEntry({
        home_id: homeId,
        staff_id: body.staffId,
        staff_name: body.staffName,
        role: body.role,
        date: body.date,
        shift_type: body.shiftType,
        start_time: body.startTime,
        end_time: body.endTime,
        hours: body.hours,
        is_agency: body.isAgency ?? false,
        is_overtime: body.isOvertime ?? false,
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_entry") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateRotaEntry(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_absence") {
      const result = await createAbsence({
        home_id: homeId,
        staff_id: body.staffId,
        staff_name: body.staffName,
        absence_type: body.absenceType,
        start_date: body.startDate,
        end_date: body.endDate,
        days: body.days,
        reason: body.reason,
        approved_by: body.approvedBy,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "approve_absence") {
      const { id, approvedBy } = body;
      if (!id || !approvedBy) return NextResponse.json({ error: "id and approvedBy required" }, { status: 400 });
      const result = await approveAbsence(id, approvedBy);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_entry, update_entry, create_absence, or approve_absence" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
