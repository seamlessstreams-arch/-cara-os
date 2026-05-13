import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listRestraintRecords,
  createRestraintRecord,
  updateRestraintRecord,
  RESTRAINT_TYPES,
  APPROVED_TECHNIQUES,
  DE_ESCALATION_STRATEGIES,
  BODY_LOCATIONS,
} from "@/lib/services/restraint-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "restraint_types") {
    return NextResponse.json({ ok: true, data: RESTRAINT_TYPES });
  }
  if (type === "techniques") {
    return NextResponse.json({ ok: true, data: APPROVED_TECHNIQUES });
  }
  if (type === "de_escalation") {
    return NextResponse.json({ ok: true, data: DE_ESCALATION_STRATEGIES });
  }
  if (type === "body_locations") {
    return NextResponse.json({ ok: true, data: BODY_LOCATIONS });
  }

  // Restraint records (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listRestraintRecords(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    restraintType: searchParams.get("restraintType") ?? undefined,
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

    if (action === "create") {
      const result = await createRestraintRecord({
        home_id: homeId,
        child_id: body.childId,
        child_name: body.childName,
        incident_date: body.incidentDate,
        incident_time: body.incidentTime,
        restraint_type: body.restraintType,
        technique_used: body.techniqueUsed,
        duration_minutes: body.durationMinutes ?? 0,
        staff_involved: body.staffInvolved ?? [],
        antecedent: body.antecedent ?? "",
        behaviour_description: body.behaviourDescription ?? "",
        de_escalation_attempted: body.deEscalationAttempted ?? [],
        outcome: body.outcome ?? "",
        injuries_child: body.injuriesChild ?? [],
        injuries_staff: body.injuriesStaff ?? [],
        body_map_completed: body.bodyMapCompleted ?? false,
        child_views_obtained: body.childViewsObtained ?? false,
        child_views: body.childViews ?? "",
        debrief_completed: body.debriefCompleted ?? false,
        debrief_date: body.debriefDate,
        debrief_notes: body.debriefNotes,
        manager_reviewed: body.managerReviewed ?? false,
        manager_review_date: body.managerReviewDate,
        manager_review_notes: body.managerReviewNotes,
        ofsted_notified: body.ofstedNotified ?? false,
        parent_carer_notified: body.parentCarerNotified ?? false,
        social_worker_notified: body.socialWorkerNotified ?? false,
        created_by: body.createdBy,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateRestraintRecord(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create or update" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
