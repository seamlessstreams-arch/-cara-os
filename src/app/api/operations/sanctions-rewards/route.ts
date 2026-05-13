import { NextRequest, NextResponse } from "next/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";
import {
  listSanctions,
  createSanction,
  updateSanction,
  listRewards,
  createReward,
  SANCTION_TYPES,
  REWARD_TYPES,
  SANCTION_STATUS,
  PROHIBITED_SANCTIONS,
} from "@/lib/services/sanctions-rewards-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const type = searchParams.get("type");

  if (!homeId) return NextResponse.json({ error: "homeId required" }, { status: 400 });

  if (type === "sanction_types") {
    return NextResponse.json({ ok: true, data: SANCTION_TYPES });
  }
  if (type === "reward_types") {
    return NextResponse.json({ ok: true, data: REWARD_TYPES });
  }
  if (type === "sanction_statuses") {
    return NextResponse.json({ ok: true, data: SANCTION_STATUS });
  }
  if (type === "prohibited") {
    return NextResponse.json({ ok: true, data: PROHIBITED_SANCTIONS });
  }

  // Rewards
  if (type === "rewards") {
    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, data: [], persisted: false });
    }
    const result = await listRewards(homeId, {
      childId: searchParams.get("childId") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ ok: true, data: result.data });
  }

  // Sanctions (default)
  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const result = await listSanctions(homeId, {
    childId: searchParams.get("childId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
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

    if (action === "create_sanction") {
      const result = await createSanction({
        home_id: homeId,
        child_id: body.childId,
        child_name: body.childName,
        sanction_type: body.sanctionType,
        reason: body.reason ?? "",
        description: body.description ?? "",
        incident_date: body.incidentDate,
        incident_time: body.incidentTime,
        duration_minutes: body.durationMinutes ?? 0,
        privilege_removed: body.privilegeRemoved,
        proportionate: body.proportionate ?? true,
        age_appropriate: body.ageAppropriate ?? true,
        consistent_with_plan: body.consistentWithPlan ?? true,
        child_informed: body.childInformed ?? true,
        child_response: body.childResponse,
        imposed_by: body.imposedBy,
        witnessed_by: body.witnessedBy,
        manager_reviewed: body.managerReviewed ?? false,
        manager_reviewed_by: body.managerReviewedBy,
        manager_review_date: body.managerReviewDate,
        status: body.status ?? "active",
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    if (action === "update_sanction") {
      const { id, ...updates } = body;
      if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
      const result = await updateSanction(id, updates);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data });
    }

    if (action === "create_reward") {
      const result = await createReward({
        home_id: homeId,
        child_id: body.childId,
        child_name: body.childName,
        reward_type: body.rewardType,
        reason: body.reason ?? "",
        description: body.description ?? "",
        award_date: body.awardDate,
        awarded_by: body.awardedBy,
        linked_to_target: body.linkedToTarget ?? false,
        target_description: body.targetDescription,
        child_response: body.childResponse,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
      return NextResponse.json({ ok: true, data: result.data }, { status: 201 });
    }

    return NextResponse.json(
      { error: "action must be create_sanction, update_sanction, or create_reward" },
      { status: 400 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
