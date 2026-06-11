// CARA STUDIO — PATCH /api/cara/review/[id]
// Manager decision: approve / request changes / archive. Approvers only,
// and never the author of the output (no self-approval).
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db/store";
import { actorFromHeaders, canApprove } from "@/lib/cara-studio/cara-studio-service";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const actor = actorFromHeaders(req.headers);
  const body = (await req.json().catch(() => ({}))) as { decision?: string; note?: string };

  const output = db.caraStudioOutputs.findById(id);
  if (!output) return NextResponse.json({ error: "Output not found" }, { status: 404 });
  if (!canApprove(actor)) {
    return NextResponse.json({ error: `Role ${actor.role} cannot review Cara outputs — manager or deputy required` }, { status: 403 });
  }
  if (output.created_by === actor.userId) {
    return NextResponse.json({ error: "You cannot review your own output — ask another approver" }, { status: 403 });
  }
  if (!["approve", "request_changes", "archive"].includes(body.decision ?? "")) {
    return NextResponse.json({ error: "decision must be approve | request_changes | archive" }, { status: 422 });
  }

  const now = new Date().toISOString();
  const updated = db.caraStudioOutputs.update(id, {
    status: body.decision === "approve" ? "approved" : body.decision === "archive" ? "archived" : "changes_requested",
    manager_review_status: body.decision === "approve" ? "approved" : body.decision === "archive" ? "approved" : "changes_requested",
    reviewed_by: actor.userId,
    reviewed_at: now,
    review_note: body.note ?? null,
  });
  return NextResponse.json({ data: updated });
}
