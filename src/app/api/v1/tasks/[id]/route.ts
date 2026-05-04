import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";

type RouteParams = { params: Promise<{ id: string }> };

// ── GET /api/v1/tasks/:id ─────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_TASKS);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const task = db.tasks.findById(id);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json({ data: task });
}

// ── PATCH /api/v1/tasks/:id ───────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await req.json();

  // ── Action: complete ──────────────────────────────────────────────────────
  if (body.action === "complete") {
    const auth = requirePermission(req, PERMISSIONS.COMPLETE_TASKS);
    if (auth instanceof NextResponse) return auth;

    const updated = db.tasks.complete(id, body.completed_by ?? auth.userId, body.evidence_note);
    if (!updated) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  }

  // ── Action: sign_off ──────────────────────────────────────────────────────
  if (body.action === "sign_off") {
    const auth = requirePermission(req, PERMISSIONS.SIGN_OFF_TASKS);
    if (auth instanceof NextResponse) return auth;

    const task = db.tasks.findById(id);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const tasks = db.tasks.findAll();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      tasks[idx] = {
        ...tasks[idx],
        signed_off_by: body.signed_off_by ?? auth.userId,
        signed_off_at: body.signed_off_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: auth.userId,
      };
    }
    return NextResponse.json({ data: db.tasks.findById(id) });
  }

  // ── Action: escalate ──────────────────────────────────────────────────────
  if (body.action === "escalate") {
    const auth = requirePermission(req, PERMISSIONS.ESCALATE_TASKS);
    if (auth instanceof NextResponse) return auth;

    const task = db.tasks.findById(id);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const tasks = db.tasks.findAll();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      tasks[idx] = {
        ...tasks[idx],
        escalated: true,
        escalated_to: body.escalated_to ?? null,
        escalated_at: body.escalated_at ?? new Date().toISOString(),
        escalation_reason: body.escalation_reason ?? null,
        updated_at: new Date().toISOString(),
        updated_by: auth.userId,
      };
    }
    return NextResponse.json({ data: db.tasks.findById(id) });
  }

  // ── General field update ──────────────────────────────────────────────────
  const auth = requirePermission(req, PERMISSIONS.EDIT_OWN_TASKS);
  if (auth instanceof NextResponse) return auth;

  const task = db.tasks.findById(id);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const tasks = db.tasks.findAll();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx !== -1) {
    // Strip action field and protected audit fields before merging
    const { action: _action, id: _id, created_at: _ca, created_by: _cb, ...safeBody } = body;
    tasks[idx] = {
      ...tasks[idx],
      ...safeBody,
      updated_at: new Date().toISOString(),
      updated_by: auth.userId,
    };
  }
  return NextResponse.json({ data: db.tasks.findById(id) });
}
