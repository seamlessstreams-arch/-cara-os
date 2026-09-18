// ══════════════════════════════════════════════════════════════════════════════
// CARA — REGULATION 44 ACTION TRACKER
//
// GET   ?homeId=&visitId=&status=  → { ok, actions, persisted }
// POST  { visitId, title, … }      → an action raised BY a report (Reg 44(4))
// PATCH { id, …allow-listed }      → progress, response, completion
//
// Actions hang off the persisted A–Q report (reg44_actions.visit_id →
// reg44_reports.id since the visit-tracker fold). In activated mode the home
// is the session's home: an action can only be raised against a report of
// that home, listed for that home, and updated if it belongs to that home.
// PATCH no longer spreads the body — home_id, visit_id, id and created_* are
// not writable through this route.
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import { storageFailure } from "@/lib/http/storage-error";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { reg44ReportsDb } from "@/lib/db";
import {
  reg44Actions,
  nextFallbackId,
  type IntelligenceReg44ActionRow,
} from "@/lib/intelligence/fallback-store";

import type { SB as LooseSupabase } from "@/lib/supabase/loose-client";

const PRIORITIES = new Set(["low", "medium", "high", "urgent"]);
const STATUSES = new Set(["open", "in_progress", "completed", "overdue", "cancelled"]);

function scope(identity: { userId: string; homeId: string | null }, requested: string | null | undefined, bodyActor: string | null) {
  if (isSupabaseEnabled()) return { homeId: identity.homeId ?? "", actor: identity.userId, live: true };
  return { homeId: requested ? String(requested) : "", actor: bodyActor || identity.userId || "staff_unknown", live: false };
}
const noHome = () => NextResponse.json({ error: "Your staff record has no home assigned." }, { status: 403 });

export async function GET(request: NextRequest) {
  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;
  const { searchParams } = new URL(request.url);
  const { homeId, live } = scope(identity, searchParams.get("homeId"), null);
  if (live && !homeId) return noHome();
  const visitId = searchParams.get("visitId");
  const status = searchParams.get("status");

  if (!live) {
    let rows = [...reg44Actions];
    if (homeId) rows = rows.filter((r) => r.home_id === homeId);
    if (visitId) rows = rows.filter((r) => r.visit_id === visitId);
    if (status) rows = rows.filter((r) => r.status === status);
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return NextResponse.json({ ok: true, actions: rows, persisted: true });
  }

  const supabase = createServerClient() as unknown as LooseSupabase;
  let query = supabase.from("reg44_actions").select("*").eq("home_id", homeId).order("created_at", { ascending: false });
  if (visitId) query = query.eq("visit_id", visitId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query.limit(200);
  if (error) return storageFailure("Regulation 44 actions", error);

  return NextResponse.json({ ok: true, actions: data ?? [], persisted: true });
}

export async function POST(request: NextRequest) {
  try {
    const identity = await getRequestIdentity(request);
    if (identity instanceof NextResponse) return identity;
    const __jb0 = await readJsonBody(request); if (!__jb0.ok) return __jb0.response; const body = __jb0.data as Record<string, unknown>;
    const { visitId, title, description, priority, assignedTo, dueDate } = body as Record<string, string | undefined>;
    const { homeId: scopedHome, actor, live } = scope(identity, body.homeId ? String(body.homeId) : null, body.actorUserId ? String(body.actorUserId) : null);
    if (live && !scopedHome) return noHome();

    if (!visitId || !title?.trim()) {
      return NextResponse.json({ error: "visitId and title are required" }, { status: 400 });
    }
    // The action is raised BY a report; the report decides the home.
    const report = await reg44ReportsDb.findById(String(visitId));
    if (!report || (live && report.homeId !== scopedHome)) {
      return NextResponse.json({ error: "No Regulation 44 report with that id for this home" }, { status: 404 });
    }
    const homeId = report.homeId;
    const now = new Date().toISOString();
    const clean = {
      title: title.trim(),
      description: (description ?? "").trim(),
      priority: PRIORITIES.has(String(priority)) ? String(priority) : "medium",
      assigned_to: (assignedTo ?? "").trim(),
      due_date: /^\d{4}-\d{2}-\d{2}$/.test(String(dueDate ?? "")) ? String(dueDate) : null,
    };

    if (!live) {
      const row: IntelligenceReg44ActionRow = {
        id: nextFallbackId("a"), visit_id: String(visitId), home_id: homeId,
        title: clean.title, description: clean.description, priority: clean.priority,
        assigned_to: clean.assigned_to, due_date: clean.due_date ?? now.slice(0, 10),
        status: "open", manager_response: null, completed_at: null, evidence_item_id: null,
        created_by: actor, created_at: now, updated_at: now,
      };
      reg44Actions.unshift(row);
      return NextResponse.json({ ok: true, action: row, persisted: true });
    }

    const supabase = createServerClient() as unknown as LooseSupabase;
    const { data, error } = await supabase.from("reg44_actions").insert({
      home_id: homeId, visit_id: String(visitId), ...clean, status: "open", created_by: actor,
    }).select().single();

    if (error) return storageFailure("Regulation 44 actions", error);
    return NextResponse.json({ ok: true, action: data, persisted: true });
  } catch (err) {
    console.error("[api/intelligence/reg44-actions] POST error:", err);
    return NextResponse.json({ error: "Failed to create Reg 44 action" }, { status: 500 });
  }
}

/** What the home may change about an action once it exists. */
const PATCHABLE = ["title", "description", "priority", "assigned_to", "due_date", "status", "manager_response", "completed_at", "evidence_item_id"] as const;

export async function PATCH(request: NextRequest) {
  try {
    const identity = await getRequestIdentity(request);
    if (identity instanceof NextResponse) return identity;
    const __jb1 = await readJsonBody(request); if (!__jb1.ok) return __jb1.response; const body = __jb1.data as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const { homeId, live } = scope(identity, null, null);
    if (live && !homeId) return noHome();

    const updates: Record<string, unknown> = {};
    for (const k of PATCHABLE) {
      if (!(k in body)) continue;
      const v = body[k];
      if (k === "priority" && !PRIORITIES.has(String(v))) continue;
      if (k === "status" && !STATUSES.has(String(v))) continue;
      updates[k] = typeof v === "string" ? v.trim() : v;
    }
    if (updates.status === "completed" && !("completed_at" in updates)) updates.completed_at = new Date().toISOString();
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: `Provide at least one of: ${PATCHABLE.join(", ")}` }, { status: 400 });
    }

    if (!live) {
      const idx = reg44Actions.findIndex((r) => r.id === id);
      if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });
      reg44Actions[idx] = { ...reg44Actions[idx], ...(updates as Partial<IntelligenceReg44ActionRow>), updated_at: new Date().toISOString() };
      return NextResponse.json({ ok: true, action: reg44Actions[idx], persisted: true });
    }

    const supabase = createServerClient() as unknown as LooseSupabase;
    const { data, error } = await supabase.from("reg44_actions").update({
      ...updates,
      updated_at: new Date().toISOString(),
    }).eq("id", id).eq("home_id", homeId).select().maybeSingle();
    if (error) return storageFailure("Regulation 44 actions", error);
    if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true, action: data, persisted: true });
  } catch (err) {
    console.error("[api/intelligence/reg44-actions] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update Reg 44 action" }, { status: 500 });
  }
}
