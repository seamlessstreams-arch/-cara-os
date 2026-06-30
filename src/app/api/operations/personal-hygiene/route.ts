import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  HYGIENE_AREAS,
  SUPPORT_LEVELS,
  PROGRESS_RATINGS,
  SENSITIVITY_LEVELS,
} from "@/lib/services/personal-hygiene-service";
import type {
  HygieneArea,
  SupportLevel,
  ProgressRating,
} from "@/lib/services/personal-hygiene-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "hygiene_areas") return NextResponse.json({ ok: true, data: HYGIENE_AREAS });
  if (type === "support_levels") return NextResponse.json({ ok: true, data: SUPPORT_LEVELS });
  if (type === "progress_ratings") return NextResponse.json({ ok: true, data: PROGRESS_RATINGS });
  if (type === "sensitivity_levels") return NextResponse.json({ ok: true, data: SENSITIVITY_LEVELS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    hygieneArea: (searchParams.get("hygieneArea") ?? undefined) as HygieneArea | undefined,
    supportLevel: (searchParams.get("supportLevel") ?? undefined) as SupportLevel | undefined,
    progressRating: (searchParams.get("progressRating") ?? undefined) as ProgressRating | undefined,
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
