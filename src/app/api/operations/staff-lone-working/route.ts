import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords, createRecord, updateRecord,
  LONE_WORKING_SCENARIOS, RISK_LEVELS, CHECK_IN_FREQUENCIES, AUTHORISATION_LEVELS,
} from "@/lib/services/staff-lone-working-service";
import type { LoneWorkingScenario, RiskLevel, CheckInFrequency, AuthorisationLevel } from "@/lib/services/staff-lone-working-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  if (type === "scenarios") return NextResponse.json({ ok: true, data: LONE_WORKING_SCENARIOS });
  if (type === "risk_levels") return NextResponse.json({ ok: true, data: RISK_LEVELS });
  if (type === "check_in_frequencies") return NextResponse.json({ ok: true, data: CHECK_IN_FREQUENCIES });
  if (type === "authorisation_levels") return NextResponse.json({ ok: true, data: AUTHORISATION_LEVELS });
  if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, data: [], persisted: false });
  const result = await listRecords(homeId, {
    loneWorkingScenario: (searchParams.get("loneWorkingScenario") ?? undefined) as LoneWorkingScenario | undefined,
    riskLevel: (searchParams.get("riskLevel") ?? undefined) as RiskLevel | undefined,
    checkInFrequency: (searchParams.get("checkInFrequency") ?? undefined) as CheckInFrequency | undefined,
    authorisationLevel: (searchParams.get("authorisationLevel") ?? undefined) as AuthorisationLevel | undefined,
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
