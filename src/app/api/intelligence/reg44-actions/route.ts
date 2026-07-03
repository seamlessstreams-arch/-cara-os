import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import {
  reg44Actions,
  nextFallbackId,
  type IntelligenceReg44ActionRow,
} from "@/lib/intelligence/fallback-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = any;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeId = searchParams.get("homeId");
  const visitId = searchParams.get("visitId");
  const status = searchParams.get("status");

  if (!isSupabaseEnabled()) {
    let rows = [...reg44Actions];
    if (homeId) rows = rows.filter((r) => r.home_id === homeId);
    if (visitId) rows = rows.filter((r) => r.visit_id === visitId);
    if (status) rows = rows.filter((r) => r.status === status);
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return NextResponse.json({ ok: true, actions: rows, persisted: true });
  }

  const supabase = createServerClient() as unknown as LooseSupabase;
  let query = supabase.from("reg44_actions").select("*").order("created_at", { ascending: false });
  if (homeId) query = query.eq("home_id", homeId);
  if (visitId) query = query.eq("visit_id", visitId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query.limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, actions: data ?? [], persisted: true });
}

export async function POST(request: NextRequest) {
  try {
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { homeId, visitId, title, description, priority, assignedTo, dueDate, actorUserId } = body;

    if (!homeId || !visitId || !title) {
      return NextResponse.json({ error: "homeId, visitId, and title are required" }, { status: 400 });
    }

    if (!isSupabaseEnabled()) {
      const now = new Date().toISOString();
      const row: IntelligenceReg44ActionRow = {
        id: nextFallbackId("a"),
        visit_id: visitId,
        home_id: homeId,
        title,
        description: description ?? "",
        priority: priority ?? "medium",
        assigned_to: assignedTo ?? "",
        due_date: dueDate ?? now.slice(0, 10),
        status: "open",
        manager_response: null,
        completed_at: null,
        evidence_item_id: null,
        created_by: actorUserId ?? null,
        created_at: now,
        updated_at: now,
      };
      reg44Actions.unshift(row);
      return NextResponse.json({ ok: true, action: row, persisted: true });
    }

    const supabase = createServerClient() as unknown as LooseSupabase;
    const { data, error } = await supabase.from("reg44_actions").insert({
      home_id: homeId,
      visit_id: visitId,
      title,
      description: description ?? "",
      priority: priority ?? "medium",
      assigned_to: assignedTo ?? "",
      due_date: dueDate ?? null,
      status: "open",
      created_by: actorUserId ?? null,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: data, persisted: true });
  } catch (err) {
    console.error("[api/intelligence/reg44-actions] POST error:", err);
    return NextResponse.json({ error: "Failed to create Reg 44 action" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const __jb1 = await readJsonBody(request); if (!__jb1.ok) return __jb1.response; const body = __jb1.data;
    const { id, ...updates } = body as { id: string } & Partial<IntelligenceReg44ActionRow>;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    if (!isSupabaseEnabled()) {
      const idx = reg44Actions.findIndex((r) => r.id === id);
      if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });
      reg44Actions[idx] = { ...reg44Actions[idx], ...updates, updated_at: new Date().toISOString() };
      return NextResponse.json({ ok: true, action: reg44Actions[idx], persisted: true });
    }

    const supabase = createServerClient() as unknown as LooseSupabase;
    const { data, error } = await supabase.from("reg44_actions").update({
      ...updates,
      updated_at: new Date().toISOString(),
    }).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: data, persisted: true });
  } catch (err) {
    console.error("[api/intelligence/reg44-actions] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update Reg 44 action" }, { status: 500 });
  }
}
