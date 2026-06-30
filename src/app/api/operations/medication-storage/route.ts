import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  STORAGE_TYPES,
  CHECK_TYPES,
  STORAGE_CONDITIONS,
  TEMPERATURE_STATUSES,
} from "@/lib/services/medication-storage-service";
import type {
  StorageType,
  CheckType,
  StorageCondition,
  TemperatureStatus,
} from "@/lib/services/medication-storage-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "storage_types") return NextResponse.json({ ok: true, data: STORAGE_TYPES });
  if (type === "check_types") return NextResponse.json({ ok: true, data: CHECK_TYPES });
  if (type === "storage_conditions") return NextResponse.json({ ok: true, data: STORAGE_CONDITIONS });
  if (type === "temperature_statuses") return NextResponse.json({ ok: true, data: TEMPERATURE_STATUSES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    storageType: (searchParams.get("storageType") ?? undefined) as StorageType | undefined,
    checkType: (searchParams.get("checkType") ?? undefined) as CheckType | undefined,
    storageCondition: (searchParams.get("storageCondition") ?? undefined) as StorageCondition | undefined,
    temperatureStatus: (searchParams.get("temperatureStatus") ?? undefined) as TemperatureStatus | undefined,
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
