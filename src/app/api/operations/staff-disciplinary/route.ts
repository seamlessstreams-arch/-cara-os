import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import { PERMISSIONS } from "@/lib/permissions";
import { requireSensitiveAccess } from "@/lib/permissions/sensitive-access";
import {
  listDisciplinaryRecords,
  createDisciplinaryRecord,
  updateDisciplinaryRecord,
  listGrievances,
  createGrievance,
  updateGrievance,
  DISCIPLINARY_CATEGORIES,
  OUTCOME_TYPES,
  DISCIPLINARY_STATUS,
  GRIEVANCE_TYPES,
  GRIEVANCE_STATUS,
} from "@/lib/services/staff-disciplinary-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  const guard = await requireSensitiveAccess(request, PERMISSIONS.VIEW_DISCIPLINARY, { entityType: "staff_disciplinary", homeId });
  if (guard instanceof NextResponse) return guard;

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "categories") {
    return NextResponse.json({ ok: true, data: DISCIPLINARY_CATEGORIES });
  }
  if (type === "outcome_types") {
    return NextResponse.json({ ok: true, data: OUTCOME_TYPES });
  }
  if (type === "disciplinary_statuses") {
    return NextResponse.json({ ok: true, data: DISCIPLINARY_STATUS });
  }
  if (type === "grievance_types") {
    return NextResponse.json({ ok: true, data: GRIEVANCE_TYPES });
  }
  if (type === "grievance_statuses") {
    return NextResponse.json({ ok: true, data: GRIEVANCE_STATUS });
  }

  // Grievances
  if (type === "grievances") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listGrievances(homeId, {
      staffId: searchParams.get("staffId") ?? undefined,
      status: (searchParams.get("status") ?? undefined) as never,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Disciplinary records (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listDisciplinaryRecords(homeId, {
    staffId: searchParams.get("staffId") ?? undefined,
    category: (searchParams.get("category") ?? undefined) as never,
    status: (searchParams.get("status") ?? undefined) as never,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, data: result.data });
}

export async function POST(request: NextRequest) {
  const guard = await requireSensitiveAccess(request, PERMISSIONS.MANAGE_DISCIPLINARY, { entityType: "staff_disciplinary", action: "update" });
  if (guard instanceof NextResponse) return guard;
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { action, homeId } = body;

    if (!homeId) {
      return NextResponse.json({ error: "homeId required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    if (action === "create_disciplinary") {
      const result = await createDisciplinaryRecord({
        homeId,
        staffId: body.staffId,
        staffName: body.staffName,
        category: body.category ?? "conduct",
        description: body.description ?? "",
        dateOfIncident: body.dateOfIncident,
        reportedBy: body.reportedBy,
        reportedDate: body.reportedDate,
        investigationRequired: body.investigationRequired ?? false,
        investigatingOfficer: body.investigatingOfficer,
        ladoReferralRequired: body.ladoReferralRequired ?? false,
        dbsReferralRequired: body.dbsReferralRequired ?? false,
        ofstedNotificationRequired: body.ofstedNotificationRequired ?? false,
        notes: body.notes,
        supportingDocuments: body.supportingDocuments ?? [],
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_disciplinary") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateDisciplinaryRecord(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_grievance") {
      const result = await createGrievance({
        homeId,
        staffId: body.staffId,
        staffName: body.staffName,
        grievanceType: body.grievanceType ?? "working_conditions",
        description: body.description ?? "",
        dateRaised: body.dateRaised,
        informalResolutionAttempted: body.informalResolutionAttempted ?? false,
        informalResolutionDate: body.informalResolutionDate,
        informalOutcome: body.informalOutcome,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_grievance") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateGrievance(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_disciplinary, update_disciplinary, create_grievance, or update_grievance" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
