import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listSafeguardingReferrals,
  getSafeguardingReferral,
  createSafeguardingReferral,
  updateSafeguardingReferral,
  acknowledgeReferral,
  closeReferral,
  REFERRAL_TYPES,
  NOTIFICATION_TIMEFRAMES,
} from "@/lib/services/safeguarding-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "referral_types") {
    return NextResponse.json({ ok: true, data: REFERRAL_TYPES });
  }
  if (type === "timeframes") {
    return NextResponse.json({ ok: true, data: NOTIFICATION_TIMEFRAMES });
  }

  const id = searchParams.get("id");
  if (id) {
    const result = await getSafeguardingReferral(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listSafeguardingReferrals(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    referralType: searchParams.get("referralType") as "mash" | "lado" ?? undefined,
    status: searchParams.get("status") as "pending" | "closed" ?? undefined,
    urgency: searchParams.get("urgency") as "immediate" | "routine" ?? undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { action, homeId } = body;

    if (!homeId) {
      return NextResponse.json({ error: "homeId required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    if (action === "create") {
      const result = await createSafeguardingReferral({
        homeId,
        childId: body.childId,
        referralType: body.referralType,
        urgency: body.urgency,
        title: body.title,
        description: body.description,
        referredTo: body.referredTo,
        referredBy: body.referredBy,
        linkedIncidentId: body.linkedIncidentId,
        linkedRiskAssessmentId: body.linkedRiskAssessmentId,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateSafeguardingReferral(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "acknowledge") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await acknowledgeReferral(id);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "close") {
      const { id, outcome } = body;
      if (!id || !outcome) return NextResponse.json({ error: "id and outcome required" }, { status: 400 });
      const result = await closeReferral(id, outcome);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json({ error: "action must be create, update, acknowledge, or close" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
