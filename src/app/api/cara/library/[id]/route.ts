// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — PATCH /api/cara/library/[id]
// Manager approval of a library resource. Approvers only, never the resource's
// own author (mirrors the output-review rules; the DB constraint agrees).
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db/store";
import { actorFromHeaders, canApprove } from "@/lib/cara-studio/cara-studio-service";
import { persistLibraryApproval } from "@/lib/supabase/cara-persist";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const actor = actorFromHeaders(req.headers);
  const body = (await req.json().catch(() => ({}))) as { approved?: boolean };

  const resource = db.caraLibraryResources.findById(id);
  if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  if (!canApprove(actor)) {
    return NextResponse.json({ error: `Role ${actor.role} cannot approve library resources — manager or deputy required` }, { status: 403 });
  }
  if (resource.created_by === actor.userId) {
    return NextResponse.json({ error: "You cannot approve your own resource — ask another approver" }, { status: 403 });
  }
  if (typeof body.approved !== "boolean") {
    return NextResponse.json({ error: "Body must include approved: true | false" }, { status: 422 });
  }

  const updated = db.caraLibraryResources.update(id, {
    approved: body.approved,
    approved_by: body.approved ? actor.userId : null,
  });
  if (updated) {
    void persistLibraryApproval({ id: updated.id, approved: updated.approved, approved_by: updated.approved_by, updated_at: updated.updated_at });
  }
  return NextResponse.json({ data: updated });
}
