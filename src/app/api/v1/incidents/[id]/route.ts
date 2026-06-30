import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { requireOnShift } from "@/lib/permissions/require-on-shift";
import { auditFromRequest } from "@/lib/audit/audit-recorder";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = requirePermission(req, PERMISSIONS.VIEW_INCIDENTS);
  if (auth instanceof NextResponse) return auth;
  const shift = requireOnShift(req);
  if (shift) return shift;

  const incident = await dal.incidents.findById(id);
  if (!incident) return NextResponse.json({ error: "Incident not found" }, { status: 404 });

  return NextResponse.json({ data: incident });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = requirePermission(req, PERMISSIONS.MANAGE_INCIDENTS);
  if (auth instanceof NextResponse) return auth;
  const shift = requireOnShift(req); // parity with GET — off-shift general staff can't edit either
  if (shift) return shift;

  const incident = await dal.incidents.findById(id);
  if (!incident) return NextResponse.json({ error: "Incident not found" }, { status: 404 });

  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const { action, ...rest } = body;

  if (action === "oversight") {
    const updated = await dal.incidents.addOversight(
      id,
      rest.oversight_note ?? "",
      auth.userId
    );
    return NextResponse.json({ data: updated });
  }

  // General update — strip audit fields (dal merges + stamps updated_at, dual-mode)
  const { id: _id, created_at: _c, created_by: _cb, reference: _ref, ...safe } = rest;
  const updated = await dal.incidents.update(id, { ...safe, updated_by: auth.userId });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Record the change: field-level before→after, in-memory always + durable
  // cs_audit_log when Supabase is on. Fire-and-forget — audit never blocks the write.
  auditFromRequest(req, {
    entityType: "incident",
    entityId: id,
    homeId: (incident as { home_id?: string }).home_id ?? null,
    action: "update",
    before: incident as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    performedBy: auth.userId,
  });

  return NextResponse.json({ data: updated });
}
