import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords, createRecord, updateRecord,
  DEBRIEF_TYPES, RESTRAINT_TYPES, DEBRIEF_OUTCOMES, EMOTIONAL_STATES,
} from "@/lib/services/restraint-debrief-service";
import type { DebriefType, RestraintType, DebriefOutcome, EmotionalState } from "@/lib/services/restraint-debrief-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  if (type === "debrief_types") return NextResponse.json({ ok: true, data: DEBRIEF_TYPES });
  if (type === "restraint_types") return NextResponse.json({ ok: true, data: RESTRAINT_TYPES });
  if (type === "debrief_outcomes") return NextResponse.json({ ok: true, data: DEBRIEF_OUTCOMES });
  if (type === "emotional_states") return NextResponse.json({ ok: true, data: EMOTIONAL_STATES });
  if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, data: [], persisted: false });
  const result = await listRecords(homeId, {
    debriefType: (searchParams.get("debriefType") ?? undefined) as DebriefType | undefined,
    restraintType: (searchParams.get("restraintType") ?? undefined) as RestraintType | undefined,
    debriefOutcome: (searchParams.get("debriefOutcome") ?? undefined) as DebriefOutcome | undefined,
    childEmotionalState: (searchParams.get("childEmotionalState") ?? undefined) as EmotionalState | undefined,
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
