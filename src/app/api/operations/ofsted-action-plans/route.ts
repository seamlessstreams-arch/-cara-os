import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords, createRecord, updateRecord,
  FINDING_TYPES, ACTION_STATUSES, FINDING_PRIORITIES, INSPECTION_TYPES,
} from "@/lib/services/ofsted-action-plan-service";
import type { FindingType, ActionStatus, FindingPriority, InspectionType } from "@/lib/services/ofsted-action-plan-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  if (type === "finding_types") return NextResponse.json({ ok: true, data: FINDING_TYPES });
  if (type === "action_statuses") return NextResponse.json({ ok: true, data: ACTION_STATUSES });
  if (type === "finding_priorities") return NextResponse.json({ ok: true, data: FINDING_PRIORITIES });
  if (type === "inspection_types") return NextResponse.json({ ok: true, data: INSPECTION_TYPES });
  if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, data: [], persisted: false });
  const result = await listRecords(homeId, {
    findingType: (searchParams.get("findingType") ?? undefined) as FindingType | undefined,
    actionStatus: (searchParams.get("actionStatus") ?? undefined) as ActionStatus | undefined,
    findingPriority: (searchParams.get("findingPriority") ?? undefined) as FindingPriority | undefined,
    inspectionType: (searchParams.get("inspectionType") ?? undefined) as InspectionType | undefined,
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
