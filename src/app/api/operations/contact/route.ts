import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listContactPlans,
  getContactPlan,
  createContactPlan,
  updateContactPlan,
  recordContact,
  listContactRecords,
  getContactRecord,
  CONTACT_TYPES,
  CONTACT_PERSONS,
  SUPERVISION_LEVELS,
  CONTACT_OUTCOMES,
} from "@/lib/services/contact-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "contact_types") {
    return NextResponse.json({ ok: true, data: CONTACT_TYPES });
  }
  if (type === "contact_persons") {
    return NextResponse.json({ ok: true, data: CONTACT_PERSONS });
  }
  if (type === "supervision_levels") {
    return NextResponse.json({ ok: true, data: SUPERVISION_LEVELS });
  }
  if (type === "outcomes") {
    return NextResponse.json({ ok: true, data: CONTACT_OUTCOMES });
  }

  // Contact records
  if (type === "records") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }

    const recordId = searchParams.get("id");
    if (recordId) {
      const result = await getContactRecord(recordId);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    const result = await listContactRecords(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      contactPersonRole: searchParams.get("contactPersonRole") ?? undefined,
      contactType: searchParams.get("contactType") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Single plan
  const id = searchParams.get("id");
  if (id) {
    const result = await getContactPlan(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // List plans
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listContactPlans(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    activeOnly: searchParams.get("activeOnly") !== "false",
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

    if (action === "create_plan") {
      const result = await createContactPlan({
        home_id: homeId,
        child_id: body.childId,
        contact_person_name: body.contactPersonName,
        contact_person_role: body.contactPersonRole,
        relationship_detail: body.relationshipDetail ?? "",
        approved_contact_types: body.approvedContactTypes ?? [],
        supervision_level: body.supervisionLevel ?? "unsupervised",
        planned_frequency: body.plannedFrequency ?? "as_agreed",
        court_ordered: body.courtOrdered ?? false,
        risk_notes: body.riskNotes,
        approved_by: body.approvedBy,
        approved_date: body.approvedDate,
        review_date: body.reviewDate,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_plan") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateContactPlan(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "record_contact") {
      const result = await recordContact({
        home_id: homeId,
        child_id: body.childId,
        contact_plan_id: body.contactPlanId,
        contact_person_name: body.contactPersonName,
        contact_person_role: body.contactPersonRole,
        contact_type: body.contactType,
        supervision_level: body.supervisionLevel ?? "unsupervised",
        scheduled_date: body.scheduledDate,
        actual_date: body.actualDate,
        duration_minutes: body.durationMinutes,
        location: body.location,
        outcome: body.outcome ?? "completed",
        child_mood_before: body.childMoodBefore,
        child_mood_after: body.childMoodAfter,
        child_voice: body.childVoice,
        staff_observations: body.staffObservations,
        safeguarding_concerns: body.safeguardingConcerns,
        supervised_by: body.supervisedBy,
        recorded_by: body.recordedBy,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: "action must be create_plan, update_plan, or record_contact" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
