import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords, createRecord, updateRecord,
  PERSONALISATION_TYPES, SATISFACTION_LEVELS, PERSONALISATION_SCOPES, BUDGET_STATUSES,
} from "@/lib/services/home-decoration-personalisation-service";
import type { PersonalisationType, SatisfactionLevel, PersonalisationScope, BudgetStatus } from "@/lib/services/home-decoration-personalisation-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  if (type === "personalisation_types") return NextResponse.json({ ok: true, data: PERSONALISATION_TYPES });
  if (type === "satisfaction_levels") return NextResponse.json({ ok: true, data: SATISFACTION_LEVELS });
  if (type === "personalisation_scopes") return NextResponse.json({ ok: true, data: PERSONALISATION_SCOPES });
  if (type === "budget_statuses") return NextResponse.json({ ok: true, data: BUDGET_STATUSES });
  if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, data: [], persisted: false });
  const result = await listRecords(homeId, {
    personalisationType: (searchParams.get("personalisationType") ?? undefined) as PersonalisationType | undefined,
    satisfactionLevel: (searchParams.get("satisfactionLevel") ?? undefined) as SatisfactionLevel | undefined,
    personalisationScope: (searchParams.get("personalisationScope") ?? undefined) as PersonalisationScope | undefined,
    budgetStatus: (searchParams.get("budgetStatus") ?? undefined) as BudgetStatus | undefined,
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
