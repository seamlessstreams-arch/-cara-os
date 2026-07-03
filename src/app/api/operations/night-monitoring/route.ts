import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listNightChecks,
  createNightCheck,
  listNightLogs,
  createNightLog,
  updateNightLog,
  CHECK_TYPES,
  CHILD_STATUSES,
  RESPONSE_ACTIONS,
  NIGHT_LOG_STATUSES,
  MINIMUM_CHECK_FREQUENCY_HOURS,
} from "@/lib/services/night-monitoring-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "check_types") {
    return NextResponse.json({ ok: true, data: CHECK_TYPES });
  }
  if (type === "child_statuses") {
    return NextResponse.json({ ok: true, data: CHILD_STATUSES });
  }
  if (type === "response_actions") {
    return NextResponse.json({ ok: true, data: RESPONSE_ACTIONS });
  }
  if (type === "log_statuses") {
    return NextResponse.json({ ok: true, data: NIGHT_LOG_STATUSES });
  }
  if (type === "check_frequency") {
    return NextResponse.json({ ok: true, data: MINIMUM_CHECK_FREQUENCY_HOURS });
  }

  // Night logs
  if (type === "logs") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listNightLogs(homeId, {
      status: (searchParams.get("status") ?? undefined) as never,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Night checks (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listNightChecks(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    checkType: (searchParams.get("checkType") ?? undefined) as never,
    childStatus: (searchParams.get("childStatus") ?? undefined) as never,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
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

    if (action === "create_check") {
      const result = await createNightCheck({
        homeId,
        childId: body.childId,
        childName: body.childName,
        checkTime: body.checkTime,
        checkedBy: body.checkedBy,
        checkType: body.checkType,
        childStatus: body.childStatus,
        responseAction: body.responseAction,
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "create_log") {
      const result = await createNightLog({
        homeId,
        shiftDate: body.shiftDate,
        shiftStart: body.shiftStart,
        shiftEnd: body.shiftEnd,
        staffOnDuty: body.staffOnDuty ?? [],
        leadStaff: body.leadStaff,
        handoverReceived: body.handoverReceived ?? false,
        handoverNotes: body.handoverNotes,
        totalChecksCompleted: body.totalChecksCompleted ?? 0,
        allChildrenChecked: body.allChildrenChecked ?? false,
        incidentsCount: body.incidentsCount ?? 0,
        disturbancesCount: body.disturbancesCount ?? 0,
        premisesSecure: body.premisesSecure ?? true,
        firePanelChecked: body.firePanelChecked ?? true,
        overnightSummary: body.overnightSummary ?? "",
        handoverGiven: body.handoverGiven ?? false,
        handoverGivenNotes: body.handoverGivenNotes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_log") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateNightLog(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_check, create_log, or update_log" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
