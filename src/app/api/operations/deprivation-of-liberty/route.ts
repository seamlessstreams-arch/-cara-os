import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listDoLOrders,
  createDoLOrder,
  updateDoLOrder,
  listRestrictions,
  createRestriction,
  updateRestriction,
  DOL_ORDER_TYPES,
  AUTHORISING_BODIES,
  DOL_STATUS,
  RESTRICTION_TYPES,
  LEGAL_BASIS_OPTIONS,
  REVIEW_FREQUENCY,
  RESTRICTION_STATUS,
} from "@/lib/services/deprivation-of-liberty-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "order_types") {
    return NextResponse.json({ ok: true, data: DOL_ORDER_TYPES });
  }
  if (type === "authorising_bodies") {
    return NextResponse.json({ ok: true, data: AUTHORISING_BODIES });
  }
  if (type === "dol_statuses") {
    return NextResponse.json({ ok: true, data: DOL_STATUS });
  }
  if (type === "restriction_types") {
    return NextResponse.json({ ok: true, data: RESTRICTION_TYPES });
  }
  if (type === "legal_basis") {
    return NextResponse.json({ ok: true, data: LEGAL_BASIS_OPTIONS });
  }
  if (type === "review_frequency") {
    return NextResponse.json({ ok: true, data: REVIEW_FREQUENCY });
  }
  if (type === "restriction_statuses") {
    return NextResponse.json({ ok: true, data: RESTRICTION_STATUS });
  }

  // Restrictions
  if (type === "restrictions") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listRestrictions(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      status: (searchParams.get("status") ?? undefined) as never,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // DoL orders (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listDoLOrders(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    status: (searchParams.get("status") ?? undefined) as never,
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

    if (action === "create_order") {
      const result = await createDoLOrder({
        home_id: homeId,
        child_id: body.childId,
        child_name: body.childName,
        order_type: body.orderType,
        authorising_body: body.authorisingBody,
        order_reference: body.orderReference,
        start_date: body.startDate,
        end_date: body.endDate,
        review_date: body.reviewDate,
        conditions: body.conditions ?? [],
        justification: body.justification ?? "",
        legal_representative: body.legalRepresentative,
        irm_notified: body.irmNotified ?? false,
        ofsted_notified: body.ofstedNotified ?? false,
        status: body.status ?? "pending",
        reviewed_by: body.reviewedBy,
        review_notes: body.reviewNotes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_order") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateDoLOrder(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_restriction") {
      const result = await createRestriction({
        home_id: homeId,
        child_id: body.childId,
        child_name: body.childName,
        restriction_type: body.restrictionType,
        description: body.description ?? "",
        justification: body.justification ?? "",
        legal_basis: body.legalBasis ?? "risk_assessment",
        start_date: body.startDate,
        end_date: body.endDate,
        review_frequency: body.reviewFrequency ?? "monthly",
        last_review_date: body.lastReviewDate,
        next_review_date: body.nextReviewDate,
        reviewed_by: body.reviewedBy,
        child_consulted: body.childConsulted ?? false,
        child_views: body.childViews,
        social_worker_informed: body.socialWorkerInformed ?? false,
        social_worker_informed_date: body.socialWorkerInformedDate,
        parent_informed: body.parentInformed ?? false,
        proportionate: body.proportionate ?? true,
        status: body.status ?? "active",
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_restriction") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateRestriction(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_order, update_order, create_restriction, or update_restriction" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
