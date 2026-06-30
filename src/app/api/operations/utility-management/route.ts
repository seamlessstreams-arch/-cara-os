import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  UTILITY_TYPES,
  READING_TYPES,
  COST_STATUSES,
  ENERGY_RATINGS,
} from "@/lib/services/utility-management-service";
import type {
  UtilityType,
  ReadingType,
  CostStatus,
} from "@/lib/services/utility-management-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "utility_types") return NextResponse.json({ ok: true, data: UTILITY_TYPES });
  if (type === "reading_types") return NextResponse.json({ ok: true, data: READING_TYPES });
  if (type === "cost_statuses") return NextResponse.json({ ok: true, data: COST_STATUSES });
  if (type === "energy_ratings") return NextResponse.json({ ok: true, data: ENERGY_RATINGS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    utilityType: (searchParams.get("utilityType") ?? undefined) as UtilityType | undefined,
    readingType: (searchParams.get("readingType") ?? undefined) as ReadingType | undefined,
    costStatus: (searchParams.get("costStatus") ?? undefined) as CostStatus | undefined,
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
