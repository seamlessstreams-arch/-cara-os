import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listOutcomeTargets,
  createOutcomeTarget,
  updateOutcomeTarget,
  listOutcomeReviews,
  createOutcomeReview,
  OUTCOME_DOMAINS,
  PROGRESS_RATINGS,
  REVIEW_FREQUENCY,
} from "@/lib/services/outcomes-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "outcome_domains") {
    return NextResponse.json({ ok: true, data: OUTCOME_DOMAINS });
  }
  if (type === "progress_ratings") {
    return NextResponse.json({ ok: true, data: PROGRESS_RATINGS });
  }
  if (type === "review_frequency") {
    return NextResponse.json({ ok: true, data: REVIEW_FREQUENCY });
  }

  // Outcome reviews
  if (type === "reviews") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listOutcomeReviews(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Outcome targets (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listOutcomeTargets(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    domain: searchParams.get("domain") ?? undefined,
    status: searchParams.get("status") ?? undefined,
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

    if (action === "create_target") {
      const result = await createOutcomeTarget({
        home_id: homeId,
        child_id: body.childId,
        child_name: body.childName,
        domain: body.domain,
        target_description: body.targetDescription ?? "",
        baseline_rating: body.baselineRating ?? "no_change",
        current_rating: body.currentRating ?? "no_change",
        target_rating: body.targetRating ?? "good_progress",
        set_date: body.setDate,
        review_date: body.reviewDate,
        reviewed_by: body.reviewedBy,
        status: body.status ?? "active",
        evidence: body.evidence,
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_target") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateOutcomeTarget(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_review") {
      const result = await createOutcomeReview({
        home_id: homeId,
        child_id: body.childId,
        child_name: body.childName,
        review_date: body.reviewDate,
        reviewer: body.reviewer,
        domain_ratings: body.domainRatings ?? [],
        overall_progress: body.overallProgress ?? "some_progress",
        key_achievements: body.keyAchievements ?? [],
        areas_of_concern: body.areasOfConcern ?? [],
        actions: body.actions ?? [],
        next_review_date: body.nextReviewDate,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: "action must be create_target, update_target, or create_review" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
