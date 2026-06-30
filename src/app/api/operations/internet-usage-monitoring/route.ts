import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords, createRecord, updateRecord,
  DEVICE_TYPES, USAGE_PURPOSES, CONCERN_LEVELS, MONITORING_LEVELS,
} from "@/lib/services/internet-usage-monitoring-service";
import type { DeviceType, UsagePurpose, ConcernLevel, MonitoringLevel } from "@/lib/services/internet-usage-monitoring-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  if (type === "device_types") return NextResponse.json({ ok: true, data: DEVICE_TYPES });
  if (type === "usage_purposes") return NextResponse.json({ ok: true, data: USAGE_PURPOSES });
  if (type === "concern_levels") return NextResponse.json({ ok: true, data: CONCERN_LEVELS });
  if (type === "monitoring_levels") return NextResponse.json({ ok: true, data: MONITORING_LEVELS });
  if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, data: [], persisted: false });
  const result = await listRecords(homeId, {
    deviceType: (searchParams.get("deviceType") ?? undefined) as DeviceType | undefined,
    usagePurpose: (searchParams.get("usagePurpose") ?? undefined) as UsagePurpose | undefined,
    concernLevel: (searchParams.get("concernLevel") ?? undefined) as ConcernLevel | undefined,
    monitoringLevel: (searchParams.get("monitoringLevel") ?? undefined) as MonitoringLevel | undefined,
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
