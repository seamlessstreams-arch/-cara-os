import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  DRILL_TYPES,
  DRILL_OUTCOMES,
  TIMES_OF_DAY,
  STAFF_READINESS_LEVELS,
} from "@/lib/services/emergency-drill-service";
import type {
  DrillType,
  DrillOutcome,
  TimeOfDay,
} from "@/lib/services/emergency-drill-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "drill_types") return NextResponse.json({ ok: true, data: DRILL_TYPES });
  if (type === "drill_outcomes") return NextResponse.json({ ok: true, data: DRILL_OUTCOMES });
  if (type === "times_of_day") return NextResponse.json({ ok: true, data: TIMES_OF_DAY });
  if (type === "staff_readiness_levels") return NextResponse.json({ ok: true, data: STAFF_READINESS_LEVELS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    drillType: (searchParams.get("drillType") ?? undefined) as DrillType | undefined,
    drillOutcome: (searchParams.get("drillOutcome") ?? undefined) as DrillOutcome | undefined,
    timeOfDay: (searchParams.get("timeOfDay") ?? undefined) as TimeOfDay | undefined,
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
