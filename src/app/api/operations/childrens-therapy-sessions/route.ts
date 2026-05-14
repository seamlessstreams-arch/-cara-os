import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords, createRecord, updateRecord,
  THERAPY_TYPES, SESSION_OUTCOMES, CHILD_ENGAGEMENTS, THERAPY_FREQUENCIES,
} from "@/lib/services/childrens-therapy-sessions-service";
import type { TherapyType, SessionOutcome, ChildEngagement, TherapyFrequency } from "@/lib/services/childrens-therapy-sessions-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  if (type === "therapy_types") return NextResponse.json({ ok: true, data: THERAPY_TYPES });
  if (type === "session_outcomes") return NextResponse.json({ ok: true, data: SESSION_OUTCOMES });
  if (type === "child_engagements") return NextResponse.json({ ok: true, data: CHILD_ENGAGEMENTS });
  if (type === "therapy_frequencies") return NextResponse.json({ ok: true, data: THERAPY_FREQUENCIES });
  if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, data: [], persisted: false });
  const result = await listRecords(homeId, {
    therapyType: (searchParams.get("therapyType") ?? undefined) as TherapyType | undefined,
    sessionOutcome: (searchParams.get("sessionOutcome") ?? undefined) as SessionOutcome | undefined,
    childEngagement: (searchParams.get("childEngagement") ?? undefined) as ChildEngagement | undefined,
    therapyFrequency: (searchParams.get("therapyFrequency") ?? undefined) as TherapyFrequency | undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
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
