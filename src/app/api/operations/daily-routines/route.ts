import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  ROUTINE_TYPES,
  ROUTINE_SLOTS,
  COMPLIANCE_RATINGS,
  ADAPTATION_REASONS,
} from "@/lib/services/daily-routine-service";
import type {
  RoutineType,
  RoutineSlot,
  ComplianceRating,
} from "@/lib/services/daily-routine-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "routine_types") return NextResponse.json({ ok: true, data: ROUTINE_TYPES });
  if (type === "routine_slots") return NextResponse.json({ ok: true, data: ROUTINE_SLOTS });
  if (type === "compliance_ratings") return NextResponse.json({ ok: true, data: COMPLIANCE_RATINGS });
  if (type === "adaptation_reasons") return NextResponse.json({ ok: true, data: ADAPTATION_REASONS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    routineType: (searchParams.get("routineType") ?? undefined) as RoutineType | undefined,
    routineSlot: (searchParams.get("routineSlot") ?? undefined) as RoutineSlot | undefined,
    complianceRating: (searchParams.get("complianceRating") ?? undefined) as ComplianceRating | undefined,
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
