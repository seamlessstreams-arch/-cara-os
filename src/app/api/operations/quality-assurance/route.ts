import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listAudits,
  createAudit,
  updateAudit,
  listImprovementPlans,
  createImprovementPlan,
  updateImprovementPlan,
  AUDIT_TYPES,
  AUDIT_RATINGS,
  IMPROVEMENT_SOURCES,
} from "@/lib/services/quality-assurance-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "audit_types") {
    return NextResponse.json({ ok: true, data: AUDIT_TYPES });
  }
  if (type === "audit_ratings") {
    return NextResponse.json({ ok: true, data: AUDIT_RATINGS });
  }
  if (type === "improvement_sources") {
    return NextResponse.json({ ok: true, data: IMPROVEMENT_SOURCES });
  }

  // Improvement plans
  if (type === "improvement_plans") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listImprovementPlans(homeId, {
      status: searchParams.get("status") ?? undefined,
      source: searchParams.get("source") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Quality audits (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listAudits(homeId, {
    auditType: searchParams.get("auditType") ?? undefined,
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
    const body = await request.json();
    const { action, homeId } = body;

    if (!homeId) {
      return NextResponse.json({ error: "homeId required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    if (action === "create_audit") {
      const result = await createAudit({
        home_id: homeId,
        audit_type: body.auditType,
        audit_date: body.auditDate,
        auditor: body.auditor,
        areas_audited: body.areasAudited ?? [],
        overall_rating: body.overallRating ?? "good",
        strengths: body.strengths ?? [],
        areas_for_improvement: body.areasForImprovement ?? [],
        recommendations: body.recommendations ?? [],
        previous_actions_reviewed: body.previousActionsReviewed ?? false,
        previous_actions_status: body.previousActionsStatus ?? "",
        next_audit_date: body.nextAuditDate,
        status: body.status ?? "planned",
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_audit") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateAudit(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_plan") {
      const result = await createImprovementPlan({
        home_id: homeId,
        title: body.title,
        source: body.source,
        created_date: body.createdDate,
        target_completion: body.targetCompletion,
        actions: body.actions ?? [],
        status: body.status ?? "active",
        progress_percentage: body.progressPercentage ?? 0,
        review_date: body.reviewDate,
        reviewed_by: body.reviewedBy,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_plan") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateImprovementPlan(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_audit, update_audit, create_plan, or update_plan" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
