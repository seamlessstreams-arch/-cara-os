import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { writeIntelligenceAudit } from "@/lib/intelligence/audit";
import { reg45Reviews, nextFallbackId } from "@/lib/intelligence/fallback-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = any;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const status = searchParams.get("status");

  if (!isSupabaseEnabled()) {
    let rows = [...reg45Reviews];
    if (homeId) rows = rows.filter((r) => r.home_id === homeId);
    if (status) rows = rows.filter((r) => r.status === status);
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return NextResponse.json({ ok: true, reviews: rows, persisted: true });
  }

  const supabase = createServerClient() as unknown as LooseSupabase;
  let query = supabase.from("reg45_reviews").select("*").order("created_at", { ascending: false });

  if (homeId) query = query.eq("home_id", homeId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query.limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, reviews: data ?? [], persisted: true });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { homeId, periodStart, periodEnd, title, actorUserId, actorRole } = body;

    if (!homeId || !periodStart || !periodEnd) {
      return NextResponse.json({ error: "homeId, periodStart, and periodEnd are required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      const now = new Date().toISOString();
      const row = {
        id: nextFallbackId("r"),
        home_id: homeId as string,
        period_start: periodStart as string,
        period_end: periodEnd as string,
        status: "draft",
        quality_of_care_summary: null,
        children_experiences_summary: null,
        outcomes_summary: null,
        safeguarding_summary: null,
        leadership_summary: null,
        strengths: null,
        weaknesses: null,
        improvement_actions: null,
        children_views: null,
        parents_views: null,
        placing_authority_views: null,
        staff_views: null,
        generated_by: (actorUserId as string) ?? null,
        approved_by: null,
        approved_at: null,
        created_at: now,
        updated_at: now,
      };
      reg45Reviews.unshift(row);
      return NextResponse.json({ ok: true, review: row, persisted: true });
    }

    const supabase = createServerClient() as unknown as LooseSupabase;
    const { data, error } = await supabase.from("reg45_reviews").insert({
      home_id: homeId,
      period_start: periodStart,
      period_end: periodEnd,
      title: title ?? `Quality of Care Review: ${periodStart} to ${periodEnd}`,
      status: "draft",
      created_by: actorUserId ?? null,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeIntelligenceAudit({
      homeId,
      entityType: "reg45_review",
      entityId: data?.id,
      action: "record_created",
      actorUserId,
      actorRole,
    });

    return NextResponse.json({ ok: true, review: data, persisted: true });
  } catch (err) {
    console.error("[api/intelligence/reg45] POST error:", err);
    return NextResponse.json({ error: "Failed to create Reg 45 review" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const __jb1 = await readJsonBody(request); if (!__jb1.ok) return __jb1.response; const body = __jb1.data;
    const { id, homeId, actorUserId, actorRole, ...updates } = body;

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    if (!isSupabaseEnabled()) {
      const idx = reg45Reviews.findIndex((r) => r.id === id);
      if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });
      const row = reg45Reviews[idx];
      const patched = { ...row, updated_at: new Date().toISOString() };
      if (updates.status) patched.status = updates.status;
      if (updates.title) patched.quality_of_care_summary = updates.title;
      if (updates.content) patched.quality_of_care_summary = updates.content;
      if (updates.findings) patched.strengths = updates.findings;
      if (updates.recommendations) patched.improvement_actions = updates.recommendations;
      if (updates.approvedBy) {
        patched.approved_by = updates.approvedBy;
        patched.approved_at = new Date().toISOString();
      }
      reg45Reviews[idx] = patched;
      return NextResponse.json({ ok: true, review: patched, persisted: true });
    }

    const supabase = createServerClient() as unknown as LooseSupabase;
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (updates.status) dbUpdates.status = updates.status;
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.content) dbUpdates.content = updates.content;
    if (updates.findings) dbUpdates.findings = updates.findings;
    if (updates.recommendations) dbUpdates.recommendations = updates.recommendations;
    if (updates.approvedBy) {
      dbUpdates.approved_by = updates.approvedBy;
      dbUpdates.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabase.from("reg45_reviews").update(dbUpdates).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeIntelligenceAudit({
      homeId,
      entityType: "reg45_review",
      entityId: id,
      action: "record_updated",
      actorUserId,
      actorRole,
    });

    return NextResponse.json({ ok: true, review: data, persisted: true });
  } catch (err) {
    console.error("[api/intelligence/reg45] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update Reg 45 review" }, { status: 500 });
  }
}
