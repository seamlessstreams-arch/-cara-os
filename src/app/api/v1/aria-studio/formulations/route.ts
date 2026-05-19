// ══════════════════════════════════════════════════════════════════════════════
// API — ARIA Formulation status updates
// PATCH → in_review / approved / rejected (RBAC: aria.approve_outputs)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import type { AriaFormulation } from "@/types/aria-studio";

const ALLOWED: Array<AriaFormulation["status"]> = [
  "ai_draft",
  "in_review",
  "approved",
  "rejected",
  "superseded",
];

export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : null;
  const status = typeof body.status === "string" ? body.status : null;
  const note = typeof body.reviewer_note === "string" ? body.reviewer_note : null;
  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  }
  if (!ALLOWED.includes(status as AriaFormulation["status"])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = db.ariaFormulations.findById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const guard = requireAriaStudioPermission(req, body, {
    permission: "aria.approve_outputs",
    homeId: existing.home_id,
    intent: `update formulation ${status}`,
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  const approved = status === "approved";
  const updated = db.ariaFormulations.patch(id, {
    status: status as AriaFormulation["status"],
    approved_by: approved ? guard.actor.userId : existing.approved_by,
    approved_at: approved ? new Date().toISOString() : existing.approved_at,
    reviewer_note: note ?? existing.reviewer_note,
    is_ai_draft: status === "ai_draft",
  });
  return NextResponse.json({ data: updated });
}
