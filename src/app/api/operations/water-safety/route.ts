import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  WATER_CHECK_TYPES,
  WATER_LOCATIONS,
  TEMPERATURE_COMPLIANCES,
  RISK_LEVELS,
} from "@/lib/services/water-safety-service";
import type {
  WaterCheckType,
  WaterLocation,
  TemperatureCompliance,
} from "@/lib/services/water-safety-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "water_check_types") return NextResponse.json({ ok: true, data: WATER_CHECK_TYPES });
  if (type === "water_locations") return NextResponse.json({ ok: true, data: WATER_LOCATIONS });
  if (type === "temperature_compliances") return NextResponse.json({ ok: true, data: TEMPERATURE_COMPLIANCES });
  if (type === "risk_levels") return NextResponse.json({ ok: true, data: RISK_LEVELS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    checkType: (searchParams.get("checkType") ?? undefined) as WaterCheckType | undefined,
    location: (searchParams.get("location") ?? undefined) as WaterLocation | undefined,
    temperatureCompliance: (searchParams.get("temperatureCompliance") ?? undefined) as TemperatureCompliance | undefined,
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
