import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listAssessments,
  createAssessment,
  updateAssessment,
  listIncidents,
  createIncident,
  SUBSTANCE_TYPES,
  RISK_LEVELS,
  FREQUENCY_LEVELS,
  USE_CONTEXTS,
  ASSESSMENT_STATUSES,
  INCIDENT_TYPES,
} from "@/lib/services/substance-misuse-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "substance_types") {
    return NextResponse.json({ ok: true, data: SUBSTANCE_TYPES });
  }
  if (type === "risk_levels") {
    return NextResponse.json({ ok: true, data: RISK_LEVELS });
  }
  if (type === "frequency_levels") {
    return NextResponse.json({ ok: true, data: FREQUENCY_LEVELS });
  }
  if (type === "use_contexts") {
    return NextResponse.json({ ok: true, data: USE_CONTEXTS });
  }
  if (type === "assessment_statuses") {
    return NextResponse.json({ ok: true, data: ASSESSMENT_STATUSES });
  }
  if (type === "incident_types") {
    return NextResponse.json({ ok: true, data: INCIDENT_TYPES });
  }

  // Incidents
  if (type === "incidents") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listIncidents(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      incidentType: (searchParams.get("incidentType") ?? undefined) as never,
      substanceType: (searchParams.get("substanceType") ?? undefined) as never,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Assessments (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listAssessments(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    riskLevel: (searchParams.get("riskLevel") ?? undefined) as never,
    substanceType: (searchParams.get("substanceType") ?? undefined) as never,
    status: (searchParams.get("status") ?? undefined) as never,
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

    if (action === "create_assessment") {
      const result = await createAssessment({
        homeId,
        childId: body.childId,
        childName: body.childName,
        assessmentDate: body.assessmentDate,
        assessedBy: body.assessedBy,
        substanceType: body.substanceType,
        riskLevel: body.riskLevel ?? "low",
        frequency: body.frequency ?? "unknown",
        context: body.context,
        impactOnHealth: body.impactOnHealth,
        impactOnBehaviour: body.impactOnBehaviour,
        impactOnEducation: body.impactOnEducation,
        referralMade: body.referralMade ?? false,
        referralTo: body.referralTo,
        referralDate: body.referralDate,
        interventionPlan: body.interventionPlan,
        nextAssessmentDate: body.nextAssessmentDate,
        status: body.status ?? "active",
        notes: body.notes,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_assessment") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateAssessment(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_incident") {
      const result = await createIncident({
        homeId,
        childId: body.childId,
        childName: body.childName,
        incidentDate: body.incidentDate,
        reportedBy: body.reportedBy,
        substanceType: body.substanceType,
        incidentType: body.incidentType,
        description: body.description ?? "",
        location: body.location,
        immediateAction: body.immediateAction ?? "",
        medicalAttention: body.medicalAttention ?? false,
        policeInvolved: body.policeInvolved ?? false,
        socialWorkerNotified: body.socialWorkerNotified ?? false,
        parentNotified: body.parentNotified ?? false,
        ofstedNotified: body.ofstedNotified ?? false,
        followUpActions: body.followUpActions ?? [],
        followUpDate: body.followUpDate,
        followUpCompleted: body.followUpCompleted ?? false,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: "action must be create_assessment, update_assessment, or create_incident" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
