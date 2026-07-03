import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listBehaviourEntries,
  getBehaviourEntry,
  createBehaviourEntry,
  updateBehaviourEntry,
  listRewardsSanctions,
  createRewardSanction,
  BEHAVIOUR_CATEGORIES,
  DE_ESCALATION_TECHNIQUES,
  PI_TECHNIQUES,
  REWARD_TYPES,
  SANCTION_TYPES,
} from "@/lib/services/behaviour-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "categories") {
    return NextResponse.json({ ok: true, data: BEHAVIOUR_CATEGORIES });
  }
  if (type === "de_escalation") {
    return NextResponse.json({ ok: true, data: DE_ESCALATION_TECHNIQUES });
  }
  if (type === "pi_techniques") {
    return NextResponse.json({ ok: true, data: PI_TECHNIQUES });
  }
  if (type === "reward_types") {
    return NextResponse.json({ ok: true, data: REWARD_TYPES });
  }
  if (type === "sanction_types") {
    return NextResponse.json({ ok: true, data: SANCTION_TYPES });
  }

  // Rewards & sanctions
  if (type === "rewards_sanctions") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listRewardsSanctions(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      type: searchParams.get("rsType") as "reward" | "sanction" | undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Single entry
  const id = searchParams.get("id");
  if (id) {
    const result = await getBehaviourEntry(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // List entries
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listBehaviourEntries(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    physicalIntervention: searchParams.get("physicalIntervention") === "true" ? true : undefined,
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

    if (action === "create_entry") {
      const result = await createBehaviourEntry({
        home_id: homeId,
        child_id: body.childId,
        date: body.date,
        time: body.time,
        category: body.category,
        description: body.description,
        antecedent: body.antecedent,
        behaviour: body.behaviour,
        consequence: body.consequence,
        de_escalation_used: body.deEscalationUsed ?? [],
        de_escalation_effective: body.deEscalationEffective ?? false,
        physical_intervention: body.physicalIntervention ?? false,
        pi_technique: body.piTechnique,
        pi_duration_minutes: body.piDurationMinutes,
        pi_staff_involved: body.piStaffInvolved ?? [],
        pi_injuries_child: body.piInjuriesChild ?? false,
        pi_injuries_staff: body.piInjuriesStaff ?? false,
        pi_debrief_completed: body.piDebriefCompleted ?? false,
        pi_debrief_date: body.piDebriefDate,
        outcome: body.outcome,
        recorded_by: body.recordedBy,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_entry") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateBehaviourEntry(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_reward_sanction") {
      const result = await createRewardSanction({
        home_id: homeId,
        child_id: body.childId,
        type: body.rsType,
        subtype: body.subtype,
        reason: body.reason,
        date: body.date,
        given_by: body.givenBy,
        child_response: body.childResponse,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: "action must be create_entry, update_entry, or create_reward_sanction" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
