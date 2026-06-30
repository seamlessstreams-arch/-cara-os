import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  MAINTENANCE_TYPES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
  CONTRACTOR_STATUSES,
} from "@/lib/services/maintenance-repairs-service";
import type {
  MaintenanceType,
  MaintenancePriority,
  MaintenanceStatus,
} from "@/lib/services/maintenance-repairs-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "maintenance_types") return NextResponse.json({ ok: true, data: MAINTENANCE_TYPES });
  if (type === "maintenance_priorities") return NextResponse.json({ ok: true, data: MAINTENANCE_PRIORITIES });
  if (type === "maintenance_statuses") return NextResponse.json({ ok: true, data: MAINTENANCE_STATUSES });
  if (type === "contractor_statuses") return NextResponse.json({ ok: true, data: CONTRACTOR_STATUSES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    maintenanceType: (searchParams.get("maintenanceType") ?? undefined) as MaintenanceType | undefined,
    priority: (searchParams.get("priority") ?? undefined) as MaintenancePriority | undefined,
    status: (searchParams.get("status") ?? undefined) as MaintenanceStatus | undefined,
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
