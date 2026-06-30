import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  AREA_TYPES,
  CLEANLINESS_RATINGS,
  HOMELINESS_RATINGS,
  SAFETY_CHECKS,
} from "@/lib/services/communal-area-audit-service";
import type {
  AreaType,
  CleanlinessRating,
  SafetyCheck,
} from "@/lib/services/communal-area-audit-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "area_types") return NextResponse.json({ ok: true, data: AREA_TYPES });
  if (type === "cleanliness_ratings") return NextResponse.json({ ok: true, data: CLEANLINESS_RATINGS });
  if (type === "homeliness_ratings") return NextResponse.json({ ok: true, data: HOMELINESS_RATINGS });
  if (type === "safety_checks") return NextResponse.json({ ok: true, data: SAFETY_CHECKS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    areaType: (searchParams.get("areaType") ?? undefined) as AreaType | undefined,
    cleanlinessRating: (searchParams.get("cleanlinessRating") ?? undefined) as CleanlinessRating | undefined,
    safetyCheck: (searchParams.get("safetyCheck") ?? undefined) as SafetyCheck | undefined,
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
