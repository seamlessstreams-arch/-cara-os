import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listPlans,
  createPlan,
  updatePlan,
  listObjectives,
  createObjective,
  updateObjective,
  listReviews,
  createReview,
  PLAN_TYPES,
  PLAN_STATUSES,
  OBJECTIVE_STATUSES,
  REVIEW_TYPES,
  REVIEW_OUTCOMES,
} from "@/lib/services/care-planning-service";
import type {
  PlanType,
  PlanStatus,
  ObjectiveStatus,
  ReviewType,
} from "@/lib/services/care-planning-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "plan_types") {
    return NextResponse.json({ ok: true, data: PLAN_TYPES });
  }
  if (type === "plan_statuses") {
    return NextResponse.json({ ok: true, data: PLAN_STATUSES });
  }
  if (type === "objective_statuses") {
    return NextResponse.json({ ok: true, data: OBJECTIVE_STATUSES });
  }
  if (type === "review_types") {
    return NextResponse.json({ ok: true, data: REVIEW_TYPES });
  }
  if (type === "review_outcomes") {
    return NextResponse.json({ ok: true, data: REVIEW_OUTCOMES });
  }

  // Objectives
  if (type === "objectives") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listObjectives(homeId, {
      planId: searchParams.get("planId") ?? undefined,
      childId: searchParams.get("childId") ?? undefined,
      status: (searchParams.get("status") ?? undefined) as ObjectiveStatus | undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Reviews
  if (type === "reviews") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listReviews(homeId, {
      planId: searchParams.get("planId") ?? undefined,
      childId: searchParams.get("childId") ?? undefined,
      reviewType: (searchParams.get("reviewType") ?? undefined) as ReviewType | undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Plans (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }
  const result = await listPlans(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    planType: (searchParams.get("planType") ?? undefined) as PlanType | undefined,
    status: (searchParams.get("status") ?? undefined) as PlanStatus | undefined,
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

  if (action === "create_plan") {
    const result = await createPlan(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_plan") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updatePlan(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }
  if (action === "create_objective") {
    const result = await createObjective(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }
  if (action === "update_objective") {
    const { id, ...updates } = payload;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const result = await updateObjective(id, updates);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }
  if (action === "create_review") {
    const result = await createReview(payload);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
