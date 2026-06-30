import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRecords, createRecord, updateRecord,
  RISK_DOMAINS, REVIEW_OUTCOMES, RISK_LEVELS, REVIEW_FREQUENCIES,
} from "@/lib/services/child-risk-assessment-review-service";
import type { RiskDomain, ReviewOutcome, RiskLevel, ReviewFrequency } from "@/lib/services/child-risk-assessment-review-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");
  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });
  if (type === "risk_domains") return NextResponse.json({ ok: true, data: RISK_DOMAINS });
  if (type === "review_outcomes") return NextResponse.json({ ok: true, data: REVIEW_OUTCOMES });
  if (type === "risk_levels") return NextResponse.json({ ok: true, data: RISK_LEVELS });
  if (type === "review_frequencies") return NextResponse.json({ ok: true, data: REVIEW_FREQUENCIES });
  if (!isSupabaseEnabled()) return NextResponse.json({ ok: true, data: [], persisted: false });
  const result = await listRecords(homeId, {
    riskDomain: (searchParams.get("riskDomain") ?? undefined) as RiskDomain | undefined,
    reviewOutcome: (searchParams.get("reviewOutcome") ?? undefined) as ReviewOutcome | undefined,
    currentRiskLevel: (searchParams.get("currentRiskLevel") ?? undefined) as RiskLevel | undefined,
    reviewFrequency: (searchParams.get("reviewFrequency") ?? undefined) as ReviewFrequency | undefined,
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
