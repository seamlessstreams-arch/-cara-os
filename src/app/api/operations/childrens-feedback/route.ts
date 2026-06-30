import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords,
  createRecord,
  updateRecord,
  FEEDBACK_TYPES,
  SATISFACTION_RATINGS,
  RESPONSE_STATUSES,
  FEEDBACK_CATEGORIES,
} from "@/lib/services/childrens-feedback-service";
import type {
  FeedbackType,
  SatisfactionRating,
  ResponseStatus,
} from "@/lib/services/childrens-feedback-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "feedback_types") return NextResponse.json({ ok: true, data: FEEDBACK_TYPES });
  if (type === "satisfaction_ratings") return NextResponse.json({ ok: true, data: SATISFACTION_RATINGS });
  if (type === "response_statuses") return NextResponse.json({ ok: true, data: RESPONSE_STATUSES });
  if (type === "feedback_categories") return NextResponse.json({ ok: true, data: FEEDBACK_CATEGORIES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listRecords(homeId, {
    feedbackType: (searchParams.get("feedbackType") ?? undefined) as FeedbackType | undefined,
    satisfactionRating: (searchParams.get("satisfactionRating") ?? undefined) as SatisfactionRating | undefined,
    responseStatus: (searchParams.get("responseStatus") ?? undefined) as ResponseStatus | undefined,
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
