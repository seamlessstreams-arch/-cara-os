import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { auditFromRequest } from "@/lib/audit/audit-recorder";

type RouteParams = { params: Promise<{ id: string }> };

// ── GET /api/v1/forms/:id ─────────────────────────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_FORMS);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const form = await dal.careForms.findById(id);
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });
  return NextResponse.json({ data: form });
}

// ── PATCH /api/v1/forms/:id ───────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;

  // ── Action: submit ────────────────────────────────────────────────────────
  if (body.action === "submit") {
    const auth = requirePermission(req, PERMISSIONS.SUBMIT_FORMS);
    if (auth instanceof NextResponse) return auth;

    const updated = await dal.careForms.submit(id, body.submitted_by ?? auth.userId);
    if (!updated) return NextResponse.json({ error: "Form not found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  }

  // ── Action: approve ───────────────────────────────────────────────────────
  if (body.action === "approve") {
    const auth = requirePermission(req, PERMISSIONS.APPROVE_FORMS);
    if (auth instanceof NextResponse) return auth;

    const updated = await dal.careForms.approve(id, body.approved_by ?? auth.userId, body.review_notes);
    if (!updated) return NextResponse.json({ error: "Form not found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  }

  // ── General field update ──────────────────────────────────────────────────
  const auth = requirePermission(req, PERMISSIONS.EDIT_FORMS);
  if (auth instanceof NextResponse) return auth;

  const form = await dal.careForms.findById(id);
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  const { action: _action, id: _id, created_at: _ca, created_by: _cb, ...safeBody } = body;
  const updated = await dal.careForms.update(id, {
    ...safeBody,
    updated_by: auth.userId,
  });
  auditFromRequest(req, {
    entityType: "form_submission",
    entityId: id,
    homeId: (form as { home_id?: string }).home_id ?? null,
    action: "update",
    before: form as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    performedBy: auth.userId,
  });
  return NextResponse.json({ data: updated });
}
