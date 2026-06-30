import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  VISITOR_TYPES,
  VISIT_PURPOSES,
  DBS_STATUSES,
  SUPERVISION_LEVELS,
} from "@/lib/services/visitor-management-service";
import type {
  VisitorType,
  VisitPurpose,
  DbsStatus,
} from "@/lib/services/visitor-management-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "visitor_types") return NextResponse.json({ ok: true, data: VISITOR_TYPES });
  if (type === "visit_purposes") return NextResponse.json({ ok: true, data: VISIT_PURPOSES });
  if (type === "dbs_statuses") return NextResponse.json({ ok: true, data: DBS_STATUSES });
  if (type === "supervision_levels") return NextResponse.json({ ok: true, data: SUPERVISION_LEVELS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    visitorType: (searchParams.get("visitorType") ?? undefined) as VisitorType | undefined,
    visitPurpose: (searchParams.get("visitPurpose") ?? undefined) as VisitPurpose | undefined,
    dbsStatus: (searchParams.get("dbsStatus") ?? undefined) as DbsStatus | undefined,
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
