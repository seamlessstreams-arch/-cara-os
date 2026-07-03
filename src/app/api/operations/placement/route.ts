import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  approvePlan,
  listLACReviews,
  createLACReview,
  completeLACReview,
  PLAN_TYPES,
  PLAN_SECTIONS,
  LAC_REVIEW_TYPES,
  PLAN_STATUSES,
} from "@/lib/services/placement-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "plan_types") {
    return NextResponse.json({ ok: true, data: PLAN_TYPES });
  }
  if (type === "plan_sections") {
    return NextResponse.json({ ok: true, data: PLAN_SECTIONS });
  }
  if (type === "review_types") {
    return NextResponse.json({ ok: true, data: LAC_REVIEW_TYPES });
  }
  if (type === "plan_statuses") {
    return NextResponse.json({ ok: true, data: PLAN_STATUSES });
  }

  // LAC reviews
  if (type === "lac_reviews") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listLACReviews(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Single plan
  const id = searchParams.get("id");
  if (id) {
    const result = await getPlan(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // List plans
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listPlans(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    planType: searchParams.get("planType") ?? undefined,
    status: searchParams.get("status") ?? undefined,
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

    if (action === "create_plan") {
      const result = await createPlan({
        home_id: homeId,
        child_id: body.childId,
        plan_type: body.planType,
        title: body.title,
        sections: body.sections ?? [],
        objectives: body.objectives ?? [],
        placing_authority: body.placingAuthority ?? "",
        social_worker_name: body.socialWorkerName,
        iro_name: body.iroName,
        created_by: body.createdBy,
        approved_by: body.approvedBy,
        approved_date: body.approvedDate,
        review_date: body.reviewDate,
        next_review_date: body.nextReviewDate,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_plan") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updatePlan(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "approve_plan") {
      const { id, approvedBy } = body;
      if (!id || !approvedBy) return NextResponse.json({ error: "id and approvedBy required" }, { status: 400 });
      const result = await approvePlan(id, approvedBy);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_lac_review") {
      const result = await createLACReview({
        home_id: homeId,
        child_id: body.childId,
        review_type: body.reviewType,
        review_date: body.reviewDate,
        chaired_by: body.chairedBy,
        attendees: body.attendees ?? [],
        outcomes: body.outcomes ?? [],
        actions: body.actions ?? [],
        child_participated: body.childParticipated ?? false,
        child_views_recorded: body.childViewsRecorded ?? false,
        plan_changes: body.planChanges ?? [],
        next_review_date: body.nextReviewDate,
        minutes_recorded: body.minutesRecorded ?? false,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "complete_lac_review") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await completeLACReview(id, {
        outcomes: body.outcomes ?? [],
        actions: body.actions ?? [],
        child_participated: body.childParticipated ?? false,
        child_views_recorded: body.childViewsRecorded ?? false,
        plan_changes: body.planChanges ?? [],
        next_review_date: body.nextReviewDate,
        minutes_recorded: body.minutesRecorded ?? false,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_plan, update_plan, approve_plan, create_lac_review, or complete_lac_review" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
