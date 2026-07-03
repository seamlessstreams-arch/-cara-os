import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listAppraisals,
  createAppraisal,
  updateAppraisal,
  listPerformanceGoals,
  createPerformanceGoal,
  updatePerformanceGoal,
  APPRAISAL_TYPES,
  RATING_SCALE,
  GOAL_CATEGORIES,
} from "@/lib/services/appraisal-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "appraisal_types") {
    return NextResponse.json({ ok: true, data: APPRAISAL_TYPES });
  }
  if (type === "rating_scale") {
    return NextResponse.json({ ok: true, data: RATING_SCALE });
  }
  if (type === "goal_categories") {
    return NextResponse.json({ ok: true, data: GOAL_CATEGORIES });
  }

  // Performance goals
  if (type === "goals") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listPerformanceGoals(homeId, {
      staffId: searchParams.get("staffId") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Appraisals (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listAppraisals(homeId, {
    staffId: searchParams.get("staffId") ?? undefined,
    appraisalType: searchParams.get("appraisalType") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
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

    if (action === "create_appraisal") {
      const result = await createAppraisal({
        home_id: homeId,
        staff_id: body.staffId,
        staff_name: body.staffName,
        appraisal_type: body.appraisalType ?? "annual",
        appraisal_date: body.appraisalDate,
        appraiser: body.appraiser,
        period_from: body.periodFrom,
        period_to: body.periodTo,
        overall_rating: body.overallRating ?? "good",
        strengths: body.strengths ?? [],
        areas_for_development: body.areasForDevelopment ?? [],
        objectives: body.objectives ?? [],
        training_needs: body.trainingNeeds ?? [],
        supervision_frequency: body.supervisionFrequency ?? "monthly",
        fitness_confirmed: body.fitnessConfirmed ?? false,
        next_appraisal_date: body.nextAppraisalDate,
        notes: body.notes,
        status: body.status ?? "scheduled",
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_appraisal") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateAppraisal(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_goal") {
      const result = await createPerformanceGoal({
        home_id: homeId,
        staff_id: body.staffId,
        staff_name: body.staffName,
        goal_description: body.goalDescription,
        category: body.category,
        target_date: body.targetDate,
        status: body.status ?? "active",
        progress_notes: body.progressNotes ?? [],
        linked_appraisal_id: body.linkedAppraisalId,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_goal") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updatePerformanceGoal(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_appraisal, update_appraisal, create_goal, or update_goal" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
