import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listReferrals,
  createReferral,
  updateReferral,
  listSessions,
  createSession,
  THERAPY_TYPES,
  SESSION_STATUSES,
  ENGAGEMENT_LEVELS,
  PROGRESS_RATINGS,
  REFERRAL_STATUSES,
} from "@/lib/services/therapeutic-interventions-service";
import type {
  TherapyType,
  SessionStatus,
  ReferralStatus,
} from "@/lib/services/therapeutic-interventions-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "therapy_types") {
    return NextResponse.json({ ok: true, data: THERAPY_TYPES });
  }
  if (type === "session_statuses") {
    return NextResponse.json({ ok: true, data: SESSION_STATUSES });
  }
  if (type === "engagement_levels") {
    return NextResponse.json({ ok: true, data: ENGAGEMENT_LEVELS });
  }
  if (type === "progress_ratings") {
    return NextResponse.json({ ok: true, data: PROGRESS_RATINGS });
  }
  if (type === "referral_statuses") {
    return NextResponse.json({ ok: true, data: REFERRAL_STATUSES });
  }

  // Sessions
  if (type === "sessions") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listSessions(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      referralId: searchParams.get("referralId") ?? undefined,
      status: (searchParams.get("status") ?? undefined) as SessionStatus | undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Referrals (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listReferrals(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    status: (searchParams.get("status") ?? undefined) as ReferralStatus | undefined,
    therapyType: (searchParams.get("therapyType") ?? undefined) as TherapyType | undefined,
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
  if (action === "create_session") {
    const result = await createSession(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
