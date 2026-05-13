import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listDBSChecks,
  createDBSCheck,
  updateDBSCheck,
  listReferences,
  createReference,
  updateReference,
  listPreEmploymentChecks,
  createPreEmploymentCheck,
  updatePreEmploymentCheck,
  DBS_TYPES,
  REFERENCE_TYPES,
  PREEMPLOYMENT_CHECK_TYPES,
  RECRUITMENT_STAGES,
} from "@/lib/services/safer-recruitment-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "dbs_types") {
    return NextResponse.json({ ok: true, data: DBS_TYPES });
  }
  if (type === "reference_types") {
    return NextResponse.json({ ok: true, data: REFERENCE_TYPES });
  }
  if (type === "check_types") {
    return NextResponse.json({ ok: true, data: PREEMPLOYMENT_CHECK_TYPES });
  }
  if (type === "recruitment_stages") {
    return NextResponse.json({ ok: true, data: RECRUITMENT_STAGES });
  }

  // References
  if (type === "references") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listReferences(homeId, {
      staffId: searchParams.get("staffId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Pre-employment checks
  if (type === "checks") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listPreEmploymentChecks(homeId, {
      staffId: searchParams.get("staffId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // DBS checks (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listDBSChecks(homeId, {
    staffId: searchParams.get("staffId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
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

    if (action === "create_dbs") {
      const result = await createDBSCheck({
        homeId,
        staffId: body.staffId,
        staffName: body.staffName,
        dbsType: body.dbsType ?? "enhanced_barred",
        certificateNumber: body.certificateNumber,
        issueDate: body.issueDate,
        expiryDate: body.expiryDate,
        updateServiceRegistered: body.updateServiceRegistered ?? false,
        updateServiceId: body.updateServiceId,
        status: body.status ?? "valid",
        checkedBy: body.checkedBy,
        checkedDate: body.checkedDate,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_dbs") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateDBSCheck(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_reference") {
      const result = await createReference({
        homeId,
        staffId: body.staffId,
        staffName: body.staffName,
        referenceType: body.referenceType ?? "employer",
        refereeName: body.refereeName,
        refereeRole: body.refereeRole,
        refereeOrganisation: body.refereeOrganisation ?? "",
        refereeEmail: body.refereeEmail,
        refereePhone: body.refereePhone,
        dateRequested: body.dateRequested,
        dateReceived: body.dateReceived,
        satisfactory: body.satisfactory,
        concernsNoted: body.concernsNoted,
        verifiedBy: body.verifiedBy,
        verifiedDate: body.verifiedDate,
        status: body.status ?? "requested",
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_reference") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateReference(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_check") {
      const result = await createPreEmploymentCheck({
        homeId,
        staffId: body.staffId,
        staffName: body.staffName,
        checkType: body.checkType,
        completed: body.completed ?? false,
        completedDate: body.completedDate,
        completedBy: body.completedBy,
        notes: body.notes,
        documentReference: body.documentReference,
        status: body.status ?? "pending",
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_check") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updatePreEmploymentCheck(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_dbs, update_dbs, create_reference, update_reference, create_check, or update_check" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
