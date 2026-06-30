import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listReferrals,
  createReferral,
  updateReferral,
  REFERRAL_STATUSES,
  DECLINE_REASONS,
  MATCHING_CRITERIA,
  IMPACT_LEVELS,
} from "@/lib/services/matching-referral-service";
import type {
  ReferralStatus,
} from "@/lib/services/matching-referral-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "referral_statuses") return NextResponse.json({ ok: true, data: REFERRAL_STATUSES });
  if (type === "decline_reasons") return NextResponse.json({ ok: true, data: DECLINE_REASONS });
  if (type === "matching_criteria") return NextResponse.json({ ok: true, data: MATCHING_CRITERIA });
  if (type === "impact_levels") return NextResponse.json({ ok: true, data: IMPACT_LEVELS });

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listReferrals(homeId, {
    status: (searchParams.get("status") ?? undefined) as ReferralStatus | undefined,
    placingAuthority: searchParams.get("placingAuthority") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
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

  if (action === "create_referral") {
    const result = await createReferral(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_referral") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateReferral(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
