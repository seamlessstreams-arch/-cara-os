import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { writeIntelligenceAudit } from "@/lib/intelligence/audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = any;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");
  const type = searchParams.get("type"); // goals | entries | snapshots

  if (!isSupabaseEnabled()) {
    return NextResponse.json({ ok: true, data: [], persisted: false });
  }

  const supabase = createServerClient() as unknown as LooseSupabase;

  if (type === "goals") {
    let query = supabase.from("child_progress_goals").select("*").order("created_at", { ascending: false });
    if (childId) query = query.eq("child_id", childId);
    const { data, error } = await query.limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, data: data ?? [], persisted: true });
  }

  if (type === "snapshots") {
    let query = supabase.from("child_outcome_snapshots").select("*").order("snapshot_date", { ascending: false });
    if (childId) query = query.eq("child_id", childId);
    const { data, error } = await query.limit(20);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, data: data ?? [], persisted: true });
  }

  // Default: entries
  let query = supabase.from("child_progress_entries").select("*").order("entry_date", { ascending: false });
  if (childId) query = query.eq("child_id", childId);
  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data: data ?? [], persisted: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, actorUserId, actorRole, homeId, ...payload } = body;

    if (!isSupabaseEnabled()) {
      return NextResponse.json({ ok: true, persisted: false });
    }

    const supabase = createServerClient() as unknown as LooseSupabase;

    if (type === "goal") {
      const { data, error } = await supabase.from("child_progress_goals").insert({
        child_id: payload.childId,
        home_id: homeId,
        goal_area: payload.goalArea,
        title: payload.title,
        description: payload.description ?? null,
        starting_point: payload.startingPoint ?? null,
        desired_outcome: payload.desiredOutcome ?? null,
        plan_actions: payload.planActions ?? null,
        responsible_people: payload.responsiblePeople ?? [],
        target_date: payload.targetDate ?? null,
        created_by: actorUserId ?? null,
      }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      await writeIntelligenceAudit({ homeId, entityType: "child_progress_goal", entityId: data?.id, action: "goal_created", actorUserId, actorRole });
      return NextResponse.json({ ok: true, data, persisted: true });
    }

    if (type === "entry") {
      const { data, error } = await supabase.from("child_progress_entries").insert({
        child_id: payload.childId,
        home_id: homeId,
        goal_id: payload.goalId ?? null,
        entry_date: payload.entryDate ?? new Date().toISOString().split("T")[0],
        area: payload.area,
        what_happened: payload.whatHappened,
        impact_on_child: payload.impactOnChild ?? null,
        evidence_source_type: payload.evidenceSourceType ?? null,
        evidence_source_id: payload.evidenceSourceId ?? null,
        created_by: actorUserId ?? null,
      }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      await writeIntelligenceAudit({ homeId, entityType: "child_progress_entry", entityId: data?.id, action: "progress_entry_created", actorUserId, actorRole });
      return NextResponse.json({ ok: true, data, persisted: true });
    }

    if (type === "snapshot") {
      const { data, error } = await supabase.from("child_outcome_snapshots").insert({
        child_id: payload.childId,
        home_id: homeId,
        snapshot_date: payload.snapshotDate ?? new Date().toISOString().split("T")[0],
        education_score: payload.educationScore ?? null,
        health_score: payload.healthScore ?? null,
        emotional_wellbeing_score: payload.emotionalWellbeingScore ?? null,
        safety_score: payload.safetyScore ?? null,
        relationships_score: payload.relationshipsScore ?? null,
        independence_score: payload.independenceScore ?? null,
        engagement_score: payload.engagementScore ?? null,
        summary: payload.summary ?? null,
        created_by: actorUserId ?? null,
      }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      await writeIntelligenceAudit({ homeId, entityType: "child_outcome_snapshot", entityId: data?.id, action: "outcome_snapshot_created", actorUserId, actorRole });
      return NextResponse.json({ ok: true, data, persisted: true });
    }

    return NextResponse.json({ error: "type must be goal, entry, or snapshot" }, { status: 400 });
  } catch (err) {
    console.error("[api/intelligence/progress] POST error:", err);
    return NextResponse.json({ error: "Failed to create progress record" }, { status: 500 });
  }
}
