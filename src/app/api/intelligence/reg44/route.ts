import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { writeIntelligenceAudit } from "@/lib/intelligence/audit";
import { reg44Visits, nextFallbackId } from "@/lib/intelligence/fallback-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = any;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const status = searchParams.get("status");

  if (!isSupabaseEnabled()) {
    let rows = [...reg44Visits];
    if (homeId) rows = rows.filter((r) => r.home_id === homeId);
    if (status) rows = rows.filter((r) => r.status === status);
    rows.sort((a, b) => b.visit_date.localeCompare(a.visit_date));
    return NextResponse.json({ ok: true, visits: rows, persisted: true });
  }

  const supabase = createServerClient() as unknown as LooseSupabase;
  let query = supabase.from("reg44_visits").select("*").order("visit_date", { ascending: false });

  if (homeId) query = query.eq("home_id", homeId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, visits: data ?? [], persisted: true });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { homeId, visitDate, visitorName, visitType, findings, recommendations, actorUserId, actorRole } = body;

    if (!homeId || !visitDate || !visitorName) {
      return NextResponse.json({ error: "homeId, visitDate, and visitorName are required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      const now = new Date().toISOString();
      const row = {
        id: nextFallbackId("v"),
        home_id: homeId as string,
        visit_date: visitDate as string,
        visitor_name: visitorName as string,
        status: "scheduled",
        summary: (findings as string) ?? null,
        strengths: null,
        concerns: null,
        children_views_summary: null,
        staff_views_summary: null,
        manager_response: null,
        ri_response: null,
        created_by: (actorUserId as string) ?? null,
        created_at: now,
        updated_at: now,
      };
      reg44Visits.unshift(row);
      return NextResponse.json({ ok: true, visit: row, persisted: true });
    }

    const supabase = createServerClient() as unknown as LooseSupabase;
    const { data, error } = await supabase.from("reg44_visits").insert({
      home_id: homeId,
      visit_date: visitDate,
      visitor_name: visitorName,
      visit_type: visitType ?? "scheduled",
      findings: findings ?? null,
      recommendations: recommendations ?? null,
      status: "draft",
      created_by: actorUserId ?? null,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await writeIntelligenceAudit({
      homeId,
      entityType: "reg44_visit",
      entityId: data?.id,
      action: "record_created",
      actorUserId,
      actorRole,
    });

    return NextResponse.json({ ok: true, visit: data, persisted: true });
  } catch (err) {
    console.error("[api/intelligence/reg44] POST error:", err);
    return NextResponse.json({ error: "Failed to create Reg 44 visit" }, { status: 500 });
  }
}
