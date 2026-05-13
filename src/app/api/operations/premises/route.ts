import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listPremisesChecks,
  createPremisesCheck,
  listMaintenanceRequests,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  completeMaintenanceRequest,
  CHECK_TYPES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_CATEGORIES,
} from "@/lib/services/premises-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "check_types") {
    return NextResponse.json({ ok: true, data: CHECK_TYPES });
  }
  if (type === "priorities") {
    return NextResponse.json({ ok: true, data: MAINTENANCE_PRIORITIES });
  }
  if (type === "categories") {
    return NextResponse.json({ ok: true, data: MAINTENANCE_CATEGORIES });
  }

  // Maintenance requests
  if (type === "maintenance") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listMaintenanceRequests(homeId, {
      status: searchParams.get("status") ?? undefined,
      priority: searchParams.get("priority") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // List premises checks
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listPremisesChecks(homeId, {
    checkType: searchParams.get("checkType") ?? undefined,
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

    if (action === "create_check") {
      const result = await createPremisesCheck({
        home_id: homeId,
        check_type: body.checkType,
        check_date: body.checkDate,
        completed_by: body.completedBy,
        result: body.result ?? "pass",
        notes: body.notes,
        issues_found: body.issuesFound ?? [],
        follow_up_required: body.followUpRequired ?? false,
        follow_up_date: body.followUpDate,
        certificate_reference: body.certificateReference,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "create_request") {
      const result = await createMaintenanceRequest({
        home_id: homeId,
        title: body.title,
        description: body.description ?? "",
        category: body.category,
        priority: body.priority ?? "medium",
        location: body.location ?? "",
        reported_by: body.reportedBy,
        reported_date: body.reportedDate ?? new Date().toISOString().split("T")[0],
        assigned_to: body.assignedTo,
        estimated_cost: body.estimatedCost,
        actual_cost: body.actualCost,
        completion_date: body.completionDate,
        child_safety_risk: body.childSafetyRisk ?? false,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_request") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateMaintenanceRequest(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "complete_request") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await completeMaintenanceRequest(id, body.actualCost);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_check, create_request, update_request, or complete_request" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
