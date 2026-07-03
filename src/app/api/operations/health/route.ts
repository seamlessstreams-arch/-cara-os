import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listHealthProfiles,
  getHealthProfile,
  createHealthProfile,
  updateHealthProfile,
  recordAppointment,
  listAppointments,
  recordWellbeingAssessment,
  listWellbeingAssessments,
  APPOINTMENT_TYPES,
  WELLBEING_DIMENSIONS,
  SDQ_BANDS,
  IMMUNISATION_STATUS,
} from "@/lib/services/health-wellbeing-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "appointment_types") {
    return NextResponse.json({ ok: true, data: APPOINTMENT_TYPES });
  }
  if (type === "wellbeing_dimensions") {
    return NextResponse.json({ ok: true, data: WELLBEING_DIMENSIONS });
  }
  if (type === "sdq_bands") {
    return NextResponse.json({ ok: true, data: SDQ_BANDS });
  }
  if (type === "immunisation_status") {
    return NextResponse.json({ ok: true, data: IMMUNISATION_STATUS });
  }

  // Appointments
  if (type === "appointments") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listAppointments(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      appointmentType: searchParams.get("appointmentType") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Wellbeing assessments
  if (type === "wellbeing") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listWellbeingAssessments(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      assessmentType: searchParams.get("assessmentType") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Single health profile
  const id = searchParams.get("id");
  if (id) {
    const result = await getHealthProfile(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // List health profiles
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listHealthProfiles(homeId, {
    childId: searchParams.get("childId") ?? undefined,
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

    if (action === "create_profile") {
      const result = await createHealthProfile({
        home_id: homeId,
        child_id: body.childId,
        immunisation_status: body.immunisationStatus ?? "unknown",
        allergies: body.allergies ?? [],
        dietary_requirements: body.dietaryRequirements ?? [],
        registered_gp: body.registeredGp ?? "",
        registered_dentist: body.registeredDentist ?? "",
        registered_optician: body.registeredOptician ?? "",
        camhs_status: body.camhsStatus ?? "none",
        last_health_assessment: body.lastHealthAssessment,
        next_health_assessment: body.nextHealthAssessment,
        health_conditions: body.healthConditions ?? [],
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_profile") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateHealthProfile(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "record_appointment") {
      const result = await recordAppointment({
        home_id: homeId,
        child_id: body.childId,
        appointment_type: body.appointmentType,
        provider_name: body.providerName ?? "",
        appointment_date: body.appointmentDate,
        outcome: body.outcome ?? "attended",
        notes: body.notes,
        follow_up_required: body.followUpRequired ?? false,
        follow_up_date: body.followUpDate,
        consent_obtained: body.consentObtained ?? true,
        accompanied_by: body.accompaniedBy,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "record_wellbeing") {
      const result = await recordWellbeingAssessment({
        home_id: homeId,
        child_id: body.childId,
        assessment_date: body.assessmentDate,
        assessment_type: body.assessmentType ?? "informal",
        sdq_scores: body.sdqScores,
        overall_wellbeing: body.overallWellbeing,
        sleep_quality: body.sleepQuality,
        appetite: body.appetite,
        self_care: body.selfCare,
        notes: body.notes,
        assessed_by: body.assessedBy,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: "action must be create_profile, update_profile, record_appointment, or record_wellbeing" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
