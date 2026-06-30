import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords, createRecord, updateRecord,
  HANDOVER_TYPES, QUALITY_RATINGS, COMPLETION_STATUSES, HANDOVER_FORMATS,
} from "@/lib/services/shift-handover-quality-service";
import type { HandoverType, QualityRating, CompletionStatus, HandoverFormat } from "@/lib/services/shift-handover-quality-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  if (type === "handover_types") return NextResponse.json({ ok: true, data: HANDOVER_TYPES });
  if (type === "quality_ratings") return NextResponse.json({ ok: true, data: QUALITY_RATINGS });
  if (type === "completion_statuses") return NextResponse.json({ ok: true, data: COMPLETION_STATUSES });
  if (type === "handover_formats") return NextResponse.json({ ok: true, data: HANDOVER_FORMATS });
  if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, data: [], persisted: false });
  const result = await listRecords(homeId, {
    handoverType: (searchParams.get("handoverType") ?? undefined) as HandoverType | undefined,
    qualityRating: (searchParams.get("qualityRating") ?? undefined) as QualityRating | undefined,
    completionStatus: (searchParams.get("completionStatus") ?? undefined) as CompletionStatus | undefined,
    handoverFormat: (searchParams.get("handoverFormat") ?? undefined) as HandoverFormat | undefined,
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
