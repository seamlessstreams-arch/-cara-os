import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords, createRecord, updateRecord,
  PLAN_TYPES, REVIEW_OUTCOMES, TRIGGER_CATEGORIES, INTERVENTION_LEVELS,
} from "@/lib/services/positive-handling-service";
import type { PlanType, ReviewOutcome, TriggerCategory, InterventionLevel } from "@/lib/services/positive-handling-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  if (type === "plan_types") return NextResponse.json({ ok: true, data: PLAN_TYPES });
  if (type === "review_outcomes") return NextResponse.json({ ok: true, data: REVIEW_OUTCOMES });
  if (type === "trigger_categories") return NextResponse.json({ ok: true, data: TRIGGER_CATEGORIES });
  if (type === "intervention_levels") return NextResponse.json({ ok: true, data: INTERVENTION_LEVELS });
  if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, data: [], persisted: false });
  const result = await listRecords(homeId, {
    planType: (searchParams.get("planType") ?? undefined) as PlanType | undefined,
    reviewOutcome: (searchParams.get("reviewOutcome") ?? undefined) as ReviewOutcome | undefined,
    triggerCategory: (searchParams.get("triggerCategory") ?? undefined) as TriggerCategory | undefined,
    interventionLevel: (searchParams.get("interventionLevel") ?? undefined) as InterventionLevel | undefined,
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
