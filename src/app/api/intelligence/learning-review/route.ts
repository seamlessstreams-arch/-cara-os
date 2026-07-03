import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { writeIntelligenceAudit } from "@/lib/intelligence/audit";
import { incidentLearningReviews, nextFallbackId } from "@/lib/intelligence/fallback-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = any;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const incidentId = searchParams.get("incidentId");
  const status = searchParams.get("status");

  if (!isSupabaseEnabled()) {
    let rows = [...incidentLearningReviews];
    if (homeId) rows = rows.filter((r) => r.home_id === homeId);
    if (incidentId) rows = rows.filter((r) => r.incident_id === incidentId);
    if (status) rows = rows.filter((r) => r.review_status === status);
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return NextResponse.json({ ok: true, reviews: rows, persisted: true });
  }

  const supabase = createServerClient() as unknown as LooseSupabase;
  let query = supabase.from("incident_learning_reviews").select("*").order("created_at", { ascending: false });

  if (homeId) query = query.eq("home_id", homeId);
  if (incidentId) query = query.eq("incident_id", incidentId);
  if (status) query = query.eq("review_status", status);

  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, reviews: data ?? [], persisted: true });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { incidentId, homeId, childId, actorUserId, actorRole } = body;

    if (!incidentId || !homeId) {
      return NextResponse.json({ error: "incidentId and homeId are required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      const now = new Date().toISOString();
      const row = {
        id: nextFallbackId("inc"),
        home_id: homeId as string,
        child_id: (childId as string) ?? "",
        incident_id: incidentId as string,
        incident_date: now.slice(0, 10),
        incident_title: "",
        incident_category: "",
        severity: "medium",
        summary: "",
        staff_involved: [],
        review_status: "required",
        manager_notes: "",
        learning_summary: "",
        trigger_analysis: null,
        created_at: now,
        updated_at: now,
      };
      incidentLearningReviews.unshift(row);
      return NextResponse.json({ ok: true, review: row, persisted: true });
    }

    const supabase = createServerClient() as unknown as LooseSupabase;
    const { data, error } = await supabase.from("incident_learning_reviews").insert({
      incident_id: incidentId,
      home_id: homeId,
      child_id: childId ?? null,
      review_status: "required",
      created_by: actorUserId ?? null,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeIntelligenceAudit({
      homeId,
      entityType: "incident_learning_review",
      entityId: data?.id,
      action: "record_created",
      actorUserId,
      actorRole,
    });

    return NextResponse.json({ ok: true, review: data, persisted: true });
  } catch (err) {
    console.error("[api/intelligence/learning-review] POST error:", err);
    return NextResponse.json({ error: "Failed to create learning review" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const __jb1 = await readJsonBody(request); if (!__jb1.ok) return __jb1.response; const body = __jb1.data;
    const { id, homeId, actorUserId, actorRole, ...updates } = body;

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    if (!isSupabaseEnabled()) {
      const idx = incidentLearningReviews.findIndex((r) => r.id === id);
      if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });
      const row = incidentLearningReviews[idx];
      const patched = { ...row, updated_at: new Date().toISOString() };
      if (updates.reviewStatus) patched.review_status = updates.reviewStatus;
      if (updates.managerNotes !== undefined) patched.manager_notes = updates.managerNotes;
      if (updates.learningSummary !== undefined) patched.learning_summary = updates.learningSummary;
      if (updates.triggerAnalysis !== undefined) patched.trigger_analysis = updates.triggerAnalysis;
      incidentLearningReviews[idx] = patched;
      return NextResponse.json({ ok: true, review: patched, persisted: true });
    }

    const supabase = createServerClient() as unknown as LooseSupabase;
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.reviewStatus) dbUpdates.review_status = updates.reviewStatus;
    if (updates.managerOversight) dbUpdates.manager_oversight = updates.managerOversight;
    if (updates.triggerAnalysis) dbUpdates.trigger_analysis = updates.triggerAnalysis;
    if (updates.whatWorked) dbUpdates.what_worked = updates.whatWorked;
    if (updates.whatDidNotWork) dbUpdates.what_did_not_work = updates.whatDidNotWork;
    if (updates.impactOnChild) dbUpdates.impact_on_child = updates.impactOnChild;
    if (updates.learningSummary) dbUpdates.learning_summary = updates.learningSummary;
    if (updates.staffDebriefRequired !== undefined) dbUpdates.staff_debrief_required = updates.staffDebriefRequired;
    if (updates.childKeyworkRequired !== undefined) dbUpdates.child_keywork_required = updates.childKeyworkRequired;
    if (updates.riskAssessmentReviewRequired !== undefined) dbUpdates.risk_assessment_review_required = updates.riskAssessmentReviewRequired;
    if (updates.placementPlanReviewRequired !== undefined) dbUpdates.placement_plan_review_required = updates.placementPlanReviewRequired;
    if (updates.notificationReviewRequired !== undefined) dbUpdates.notification_review_required = updates.notificationReviewRequired;
    if (updates.actionsCreated !== undefined) dbUpdates.actions_created = updates.actionsCreated;
    if (updates.approvedBy) {
      dbUpdates.approved_by = updates.approvedBy;
      dbUpdates.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabase.from("incident_learning_reviews").update(dbUpdates).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const action = updates.reviewStatus === "completed" ? "learning_review_completed" : "record_updated";
    await writeIntelligenceAudit({
      homeId,
      entityType: "incident_learning_review",
      entityId: id,
      action: action as "learning_review_completed" | "record_updated",
      actorUserId,
      actorRole,
    });

    return NextResponse.json({ ok: true, review: data, persisted: true });
  } catch (err) {
    console.error("[api/intelligence/learning-review] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update learning review" }, { status: 500 });
  }
}
