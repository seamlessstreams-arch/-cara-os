import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listReferrals,
  createReferral,
  updateReferral,
  listRightsRecords,
  createRightsRecord,
  updateRightsRecord,
  REFERRAL_REASONS,
  REFERRAL_STATUSES,
  ADVOCATE_SERVICES,
  CHILDRENS_RIGHTS,
} from "@/lib/services/advocacy-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "referral_reasons") {
    return NextResponse.json({ ok: true, data: REFERRAL_REASONS });
  }
  if (type === "referral_statuses") {
    return NextResponse.json({ ok: true, data: REFERRAL_STATUSES });
  }
  if (type === "advocate_services") {
    return NextResponse.json({ ok: true, data: ADVOCATE_SERVICES });
  }
  if (type === "childrens_rights") {
    return NextResponse.json({ ok: true, data: CHILDRENS_RIGHTS });
  }

  // Rights records
  if (type === "rights_records") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listRightsRecords(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      rightType: (searchParams.get("rightType") ?? undefined) as never,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Referrals (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listReferrals(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    status: (searchParams.get("status") ?? undefined) as never,
    referralReason: (searchParams.get("reason") ?? undefined) as never,
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

    if (action === "create_referral") {
      const result = await createReferral({
        homeId,
        childId: body.childId,
        childName: body.childName,
        referralDate: body.referralDate,
        referralReason: body.referralReason,
        advocateService: body.advocateService,
        advocateName: body.advocateName,
        advocateContact: body.advocateContact,
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_referral") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateReferral(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_rights_record") {
      const result = await createRightsRecord({
        homeId,
        childId: body.childId,
        childName: body.childName,
        recordDate: body.recordDate,
        recordedBy: body.recordedBy,
        rightType: body.rightType,
        childInformed: body.childInformed ?? false,
        childUnderstands: body.childUnderstands ?? false,
        childExercised: body.childExercised ?? false,
        supportProvided: body.supportProvided,
        barriersIdentified: body.barriersIdentified,
        actionsTaken: body.actionsTaken,
        reviewDate: body.reviewDate,
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_rights_record") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateRightsRecord(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_referral, update_referral, create_rights_record, or update_rights_record" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
