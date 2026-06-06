import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";

type RouteParams = { params: Promise<{ id: string }> };

// ── GET /api/v1/tasks/:id ─────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_TASKS);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const task = await dal.tasks.findById(id);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json({ data: task });
}

// ── PATCH /api/v1/tasks/:id ───────────────────────────────────────────────────
// Dual-mode: real Supabase `tasks` table when enabled, in-memory store otherwise.
// Every action routes through dal.tasks.update (which uses the store's complete()
// for status→completed and a generic merge otherwise when Supabase is off).

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await req.json();

  // ── Action: complete ──────────────────────────────────────────────────────
  if (body.action === "complete") {
    const auth = requirePermission(req, PERMISSIONS.COMPLETE_TASKS);
    if (auth instanceof NextResponse) return auth;

    const updated = await dal.tasks.update(id, {
      status: "completed",
      completed_at: new Date().toISOString(),
      completed_by: body.completed_by ?? auth.userId,
      evidence_note: body.evidence_note,
    });
    if (!updated) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  }

  // ── Action: sign_off ──────────────────────────────────────────────────────
  if (body.action === "sign_off") {
    const auth = requirePermission(req, PERMISSIONS.SIGN_OFF_TASKS);
    if (auth instanceof NextResponse) return auth;

    const updated = await dal.tasks.update(id, {
      signed_off_by: body.signed_off_by ?? auth.userId,
      signed_off_at: body.signed_off_at ?? new Date().toISOString(),
      updated_by: auth.userId,
    });
    if (!updated) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  }

  // ── Action: escalate ──────────────────────────────────────────────────────
  if (body.action === "escalate") {
    const auth = requirePermission(req, PERMISSIONS.ESCALATE_TASKS);
    if (auth instanceof NextResponse) return auth;

    const updated = await dal.tasks.update(id, {
      escalated: true,
      escalated_to: body.escalated_to ?? null,
      escalated_at: body.escalated_at ?? new Date().toISOString(),
      escalation_reason: body.escalation_reason ?? null,
      updated_by: auth.userId,
    });
    if (!updated) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  }

  // ── General field update ──────────────────────────────────────────────────
  const auth = requirePermission(req, PERMISSIONS.EDIT_OWN_TASKS);
  if (auth instanceof NextResponse) return auth;

  // Strip the action field and protected audit fields before merging.
  const { action: _action, id: _id, created_at: _ca, created_by: _cb, ...safeBody } = body;
  const updated = await dal.tasks.update(id, { ...safeBody, updated_by: auth.userId });
  if (!updated) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}
