import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  WISHES_CATEGORIES,
  FEELING_RATINGS,
  CAPTURE_METHODS,
  RESPONSE_OUTCOMES,
} from "@/lib/services/childrens-wishes-feelings-service";
import type {
  WishesCategory,
  FeelingRating,
  ResponseOutcome,
} from "@/lib/services/childrens-wishes-feelings-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "wishes_categories") return NextResponse.json({ ok: true, data: WISHES_CATEGORIES });
  if (type === "feeling_ratings") return NextResponse.json({ ok: true, data: FEELING_RATINGS });
  if (type === "capture_methods") return NextResponse.json({ ok: true, data: CAPTURE_METHODS });
  if (type === "response_outcomes") return NextResponse.json({ ok: true, data: RESPONSE_OUTCOMES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    wishesCategory: (searchParams.get("wishesCategory") ?? undefined) as WishesCategory | undefined,
    feelingRating: (searchParams.get("feelingRating") ?? undefined) as FeelingRating | undefined,
    responseOutcome: (searchParams.get("responseOutcome") ?? undefined) as ResponseOutcome | undefined,
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
