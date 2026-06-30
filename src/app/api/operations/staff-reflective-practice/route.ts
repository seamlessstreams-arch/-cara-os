import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords, createRecord, updateRecord,
  REFLECTION_TYPES, REFLECTION_MODELS, REFLECTION_OUTCOMES, REFLECTION_DEPTHS,
} from "@/lib/services/staff-reflective-practice-service";
import type { ReflectionType, ReflectionModel, ReflectionOutcome, ReflectionDepth } from "@/lib/services/staff-reflective-practice-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  if (type === "reflection_types") return NextResponse.json({ ok: true, data: REFLECTION_TYPES });
  if (type === "reflection_models") return NextResponse.json({ ok: true, data: REFLECTION_MODELS });
  if (type === "reflection_outcomes") return NextResponse.json({ ok: true, data: REFLECTION_OUTCOMES });
  if (type === "reflection_depths") return NextResponse.json({ ok: true, data: REFLECTION_DEPTHS });
  if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, data: [], persisted: false });
  const result = await listRecords(homeId, {
    reflectionType: (searchParams.get("reflectionType") ?? undefined) as ReflectionType | undefined,
    reflectionModel: (searchParams.get("reflectionModel") ?? undefined) as ReflectionModel | undefined,
    reflectionOutcome: (searchParams.get("reflectionOutcome") ?? undefined) as ReflectionOutcome | undefined,
    reflectionDepth: (searchParams.get("reflectionDepth") ?? undefined) as ReflectionDepth | undefined,
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
