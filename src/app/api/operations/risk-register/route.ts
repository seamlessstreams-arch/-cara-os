import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listEntries,
  createEntry,
  updateEntry,
  RISK_CATEGORIES,
  RISK_STATUSES,
  REVIEW_FREQUENCIES,
} from "@/lib/services/risk-register-service";
import type {
  RiskCategory,
  RiskStatus,
} from "@/lib/services/risk-register-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "risk_categories") return NextResponse.json({ ok: true, data: RISK_CATEGORIES });
  if (type === "risk_statuses") return NextResponse.json({ ok: true, data: RISK_STATUSES });
  if (type === "review_frequencies") return NextResponse.json({ ok: true, data: REVIEW_FREQUENCIES });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listEntries(homeId, {
    riskCategory: (searchParams.get("riskCategory") ?? undefined) as RiskCategory | undefined,
    riskStatus: (searchParams.get("riskStatus") ?? undefined) as RiskStatus | undefined,
    childId: searchParams.get("childId") ?? undefined,
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

  if (action === "create_entry") {
    const result = await createEntry(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_entry") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateEntry(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
