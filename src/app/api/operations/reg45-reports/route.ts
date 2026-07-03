import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listReports,
  createReport,
  updateReport,
  listActions,
  createAction,
  updateAction,
  REPORT_STATUSES,
  VISIT_TYPES,
  QUALITY_RATINGS,
  ACTION_PRIORITIES,
  ACTION_STATUSES,
  EVALUATION_AREAS,
} from "@/lib/services/reg45-reports-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "report_statuses") {
    return NextResponse.json({ ok: true, data: REPORT_STATUSES });
  }
  if (type === "visit_types") {
    return NextResponse.json({ ok: true, data: VISIT_TYPES });
  }
  if (type === "quality_ratings") {
    return NextResponse.json({ ok: true, data: QUALITY_RATINGS });
  }
  if (type === "action_priorities") {
    return NextResponse.json({ ok: true, data: ACTION_PRIORITIES });
  }
  if (type === "action_statuses") {
    return NextResponse.json({ ok: true, data: ACTION_STATUSES });
  }
  if (type === "evaluation_areas") {
    return NextResponse.json({ ok: true, data: EVALUATION_AREAS });
  }

  // Actions
  if (type === "actions") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listActions(homeId, {
      reportId: searchParams.get("reportId") ?? undefined,
      status: (searchParams.get("status") ?? undefined) as never,
      priority: (searchParams.get("priority") ?? undefined) as never,
      evaluationArea: (searchParams.get("evaluationArea") ?? undefined) as never,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Reports (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listReports(homeId, {
    status: (searchParams.get("status") ?? undefined) as never,
    qualityRating: (searchParams.get("qualityRating") ?? undefined) as never,
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

    if (action === "create_report") {
      const result = await createReport({
        homeId,
        reportPeriodStart: body.reportPeriodStart,
        reportPeriodEnd: body.reportPeriodEnd,
        responsibleIndividual: body.responsibleIndividual,
        visitDates: body.visitDates,
        visitTypes: body.visitTypes,
        childrenInterviewed: body.childrenInterviewed,
        staffInterviewed: body.staffInterviewed,
        overallQualityRating: body.overallQualityRating,
        evaluations: body.evaluations,
        reg44ReportsReviewed: body.reg44ReportsReviewed,
        reg44ActionsOutstanding: body.reg44ActionsOutstanding,
        statementOfPurposeCompliant: body.statementOfPurposeCompliant,
        keyStrengths: body.keyStrengths,
        areasForImprovement: body.areasForImprovement,
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_report") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateReport(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_action") {
      const result = await createAction({
        homeId,
        reportId: body.reportId,
        actionDescription: body.actionDescription,
        evaluationArea: body.evaluationArea,
        priority: body.priority,
        assignedTo: body.assignedTo,
        dueDate: body.dueDate,
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_action") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateAction(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_report, update_report, create_action, or update_action" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
