import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listPlans,
  createPlan,
  updatePlan,
  listReviews,
  createReview,
  TRANSITION_TYPES,
  TRANSITION_STATUSES,
  READINESS_AREAS,
  READINESS_RATINGS,
  GOAL_STATUSES,
} from "@/lib/services/transition-planning-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "transition_types") {
    return NextResponse.json({ ok: true, data: TRANSITION_TYPES });
  }
  if (type === "transition_statuses") {
    return NextResponse.json({ ok: true, data: TRANSITION_STATUSES });
  }
  if (type === "readiness_areas") {
    return NextResponse.json({ ok: true, data: READINESS_AREAS });
  }
  if (type === "readiness_ratings") {
    return NextResponse.json({ ok: true, data: READINESS_RATINGS });
  }
  if (type === "goal_statuses") {
    return NextResponse.json({ ok: true, data: GOAL_STATUSES });
  }

  // Reviews
  if (type === "reviews") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listReviews(homeId, {
      planId: searchParams.get("planId") ?? undefined,
      childId: searchParams.get("childId") ?? undefined,
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
    transitionType: (searchParams.get("transitionType") ?? undefined) as never,
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

    if (action === "create_plan") {
      const result = await createPlan({
        homeId,
        childId: body.childId,
        childName: body.childName,
        transitionType: body.transitionType,
        plannedDate: body.plannedDate,
        destination: body.destination,
        destinationType: body.destinationType,
        reason: body.reason,
        socialWorkerName: body.socialWorkerName,
        socialWorkerNotified: body.socialWorkerNotified,
        iroNotified: body.iroNotified,
        parentNotified: body.parentNotified,
        childViewsSought: body.childViewsSought,
        childViews: body.childViews,
        readinessAssessment: body.readinessAssessment,
        goals: body.goals,
        followUpDate: body.followUpDate,
        notes: body.notes,
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

    if (action === "create_review") {
      const result = await createReview({
        homeId,
        planId: body.planId,
        childId: body.childId,
        childName: body.childName,
        reviewDate: body.reviewDate,
        reviewer: body.reviewer,
        progressSummary: body.progressSummary,
        goalsReviewed: body.goalsReviewed,
        goalsOnTrack: body.goalsOnTrack,
        childViews: body.childViews,
        concerns: body.concerns,
        nextSteps: body.nextSteps,
        nextReviewDate: body.nextReviewDate,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: "action must be create_plan, update_plan, or create_review" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
