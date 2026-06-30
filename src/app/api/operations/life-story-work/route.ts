import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords, createRecord, updateRecord,
  SESSION_TYPES, CHILD_ENGAGEMENTS, EMOTIONAL_RESPONSES, SESSION_FREQUENCIES,
} from "@/lib/services/life-story-work-service";
import type { SessionType, ChildEngagement, EmotionalResponse, SessionFrequency } from "@/lib/services/life-story-work-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  if (type === "session_types") return NextResponse.json({ ok: true, data: SESSION_TYPES });
  if (type === "child_engagements") return NextResponse.json({ ok: true, data: CHILD_ENGAGEMENTS });
  if (type === "emotional_responses") return NextResponse.json({ ok: true, data: EMOTIONAL_RESPONSES });
  if (type === "session_frequencies") return NextResponse.json({ ok: true, data: SESSION_FREQUENCIES });
  if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, data: [], persisted: false });
  const result = await listRecords(homeId, {
    sessionType: (searchParams.get("sessionType") ?? undefined) as SessionType | undefined,
    childEngagement: (searchParams.get("childEngagement") ?? undefined) as ChildEngagement | undefined,
    emotionalResponse: (searchParams.get("emotionalResponse") ?? undefined) as EmotionalResponse | undefined,
    sessionFrequency: (searchParams.get("sessionFrequency") ?? undefined) as SessionFrequency | undefined,
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
