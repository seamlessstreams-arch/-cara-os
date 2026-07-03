import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listTrainingRecords,
  createTrainingRecord,
  listDBSRecords,
  createDBSRecord,
  updateDBSRecord,
  listQualifications,
  createQualification,
  updateQualification,
  MANDATORY_TRAINING,
  DBS_STATUS,
  QUALIFICATION_TYPES,
} from "@/lib/services/training-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "mandatory_training") {
    return NextResponse.json({ ok: true, data: MANDATORY_TRAINING });
  }
  if (type === "dbs_status") {
    return NextResponse.json({ ok: true, data: DBS_STATUS });
  }
  if (type === "qualification_types") {
    return NextResponse.json({ ok: true, data: QUALIFICATION_TYPES });
  }

  // DBS records
  if (type === "dbs") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listDBSRecords(homeId, {
      staffId: searchParams.get("staffId") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Qualifications
  if (type === "qualifications") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listQualifications(homeId, {
      staffId: searchParams.get("staffId") ?? undefined,
      qualificationType: searchParams.get("qualificationType") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Training records
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listTrainingRecords(homeId, {
    staffId: searchParams.get("staffId") ?? undefined,
    trainingType: searchParams.get("trainingType") ?? undefined,
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

    if (action === "create_training") {
      const result = await createTrainingRecord({
        homeId,
        staffId: body.staffId,
        staffName: body.staffName,
        trainingType: body.trainingType,
        completedDate: body.completedDate,
        expiryDate: body.expiryDate,
        provider: body.provider ?? "",
        certificateReference: body.certificateReference,
        status: body.status ?? "current",
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "create_dbs") {
      const result = await createDBSRecord({
        homeId,
        staffId: body.staffId,
        staffName: body.staffName,
        dbsNumber: body.dbsNumber,
        issueDate: body.issueDate,
        dbsType: body.dbsType ?? "enhanced_barred",
        status: body.status ?? "pending",
        renewalDue: body.renewalDue,
        updateServiceRegistered: body.updateServiceRegistered ?? false,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_dbs") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateDBSRecord(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_qualification") {
      const result = await createQualification({
        homeId,
        staffId: body.staffId,
        staffName: body.staffName,
        qualificationType: body.qualificationType,
        title: body.title,
        awardingBody: body.awardingBody ?? "",
        dateAchieved: body.dateAchieved,
        expectedCompletion: body.expectedCompletion,
        status: body.status ?? "not_started",
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_qualification") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateQualification(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_training, create_dbs, update_dbs, create_qualification, or update_qualification" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
