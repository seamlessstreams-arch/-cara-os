import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { todayStr } from "@/lib/utils";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { auditFromRequest } from "@/lib/audit/audit-recorder";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = requirePermission(req, PERMISSIONS.VIEW_SUPERVISION);
  if (auth instanceof NextResponse) return auth;

  const supervision = await dal.supervisions.findById(id);
  if (!supervision) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ data: supervision });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = requirePermission(req, PERMISSIONS.MANAGE_SUPERVISION);
  if (auth instanceof NextResponse) return auth;

  const supervision = await dal.supervisions.findById(id);
  if (!supervision) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const { action, ...rest } = body;

  if (action === "complete") {
    // dal has no bespoke complete(); it is update() with the completion fields
    // the store's complete() set (status + actual_date). Writes live via dal.
    const updated = await dal.supervisions.update(id, {
      ...rest,
      updated_by: auth.userId,
      status: "completed",
      actual_date: typeof rest.actual_date === "string" && rest.actual_date ? rest.actual_date : todayStr(),
    });
    auditFromRequest(req, {
      entityType: "supervision",
      entityId: id,
      homeId: (supervision as { home_id?: string }).home_id ?? null,
      action: "sign_off",
      before: supervision as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
      performedBy: auth.userId,
    });
    return NextResponse.json({ data: updated });
  }

  // General update — strip protected audit fields
  const { id: _id, created_at: _c, created_by: _cb, ...safe } = rest;
  const updated = await dal.supervisions.update(id, { ...safe, updated_by: auth.userId });
  auditFromRequest(req, {
    entityType: "supervision",
    entityId: id,
    homeId: (supervision as { home_id?: string }).home_id ?? null,
    action: "update",
    before: supervision as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    performedBy: auth.userId,
  });
  return NextResponse.json({ data: updated });
}
