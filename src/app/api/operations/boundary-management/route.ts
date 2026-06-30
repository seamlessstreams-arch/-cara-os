import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords, createRecord, updateRecord,
  BOUNDARY_TYPES, CHILD_RESPONSES, STAFF_APPROACHES, CONSISTENCY_RATINGS,
} from "@/lib/services/boundary-management-service";
import type { BoundaryType, ChildResponse, StaffApproach, ConsistencyRating } from "@/lib/services/boundary-management-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  if (type === "boundary_types") return NextResponse.json({ ok: true, data: BOUNDARY_TYPES });
  if (type === "child_responses") return NextResponse.json({ ok: true, data: CHILD_RESPONSES });
  if (type === "staff_approaches") return NextResponse.json({ ok: true, data: STAFF_APPROACHES });
  if (type === "consistency_ratings") return NextResponse.json({ ok: true, data: CONSISTENCY_RATINGS });
  if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, data: [], persisted: false });
  const result = await listRecords(homeId, {
    boundaryType: (searchParams.get("boundaryType") ?? undefined) as BoundaryType | undefined,
    childResponse: (searchParams.get("childResponse") ?? undefined) as ChildResponse | undefined,
    staffApproach: (searchParams.get("staffApproach") ?? undefined) as StaffApproach | undefined,
    consistencyRating: (searchParams.get("consistencyRating") ?? undefined) as ConsistencyRating | undefined,
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
