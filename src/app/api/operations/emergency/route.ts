import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listFireDrills,
  createFireDrill,
  listEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  listContingencyPlans,
  createContingencyPlan,
  updateContingencyPlan,
  DRILL_TYPES,
  EMERGENCY_CONTACT_TYPES,
  CONTINGENCY_PLAN_TYPES,
} from "@/lib/services/emergency-planning-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "drill_types") {
    return NextResponse.json({ ok: true, data: DRILL_TYPES });
  }
  if (type === "contact_types") {
    return NextResponse.json({ ok: true, data: EMERGENCY_CONTACT_TYPES });
  }
  if (type === "plan_types") {
    return NextResponse.json({ ok: true, data: CONTINGENCY_PLAN_TYPES });
  }

  // Emergency contacts
  if (type === "contacts") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listEmergencyContacts(homeId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Contingency plans
  if (type === "plans") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listContingencyPlans(homeId, {
      status: searchParams.get("status") ?? undefined,
      planType: searchParams.get("planType") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Fire drills (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listFireDrills(homeId, {
    drillType: searchParams.get("drillType") ?? undefined,
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

    if (action === "create_drill") {
      const result = await createFireDrill({
        home_id: homeId,
        drill_date: body.drillDate,
        drill_time: body.drillTime,
        drill_type: body.drillType ?? "fire_evacuation",
        staff_present: body.staffPresent ?? [],
        children_present: body.childrenPresent ?? [],
        children_absent: body.childrenAbsent ?? [],
        evacuation_time_seconds: body.evacuationTimeSeconds ?? 0,
        assembly_point_used: body.assemblyPointUsed ?? "",
        alarm_activated: body.alarmActivated ?? true,
        all_accounted_for: body.allAccountedFor ?? true,
        issues_identified: body.issuesIdentified ?? [],
        improvements_needed: body.improvementsNeeded ?? [],
        conducted_by: body.conductedBy,
        next_drill_date: body.nextDrillDate,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "create_contact") {
      const result = await createEmergencyContact({
        home_id: homeId,
        contact_type: body.contactType,
        name: body.name,
        role: body.role,
        phone_primary: body.phonePrimary,
        phone_secondary: body.phoneSecondary,
        email: body.email,
        availability: body.availability ?? "24/7",
        priority_order: body.priorityOrder ?? 1,
        last_verified_date: body.lastVerifiedDate,
        status: body.status ?? "active",
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_contact") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateEmergencyContact(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_plan") {
      const result = await createContingencyPlan({
        home_id: homeId,
        plan_type: body.planType,
        title: body.title,
        description: body.description ?? "",
        trigger_conditions: body.triggerConditions ?? [],
        immediate_actions: body.immediateActions ?? [],
        responsible_persons: body.responsiblePersons ?? [],
        escalation_contacts: body.escalationContacts ?? [],
        review_date: body.reviewDate,
        reviewed_by: body.reviewedBy,
        status: body.status ?? "current",
        version: body.version ?? 1,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_plan") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateContingencyPlan(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    return NextResponse.json(
      { error: "action must be create_drill, create_contact, update_contact, create_plan, or update_plan" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
