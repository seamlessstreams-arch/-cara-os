// ══════════════════════════════════════════════════════════════════════════════
// API — ARIA Reg 45 Evidence Item status updates
// PATCH → accept / defer / reject / include_in_report
//   RBAC: aria.approve_outputs (safeguarding-sensitive)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import type { AriaReg45EvidenceItem } from "@/types/aria-studio";

const ALLOWED: Array<AriaReg45EvidenceItem["status"]> = [
  "ai_draft",
  "accepted",
  "deferred",
  "rejected",
  "included_in_report",
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
  const note = typeof body.decision_note === "string" ? body.decision_note : null;
  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  }
  if (!ALLOWED.includes(status as AriaReg45EvidenceItem["status"])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = db.ariaReg45EvidenceItems.findById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const guard = requireAriaStudioPermission(req, body, {
    permission: "aria.approve_outputs",
    homeId: existing.home_id,
    intent: `update reg45_evidence ${status}`,
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  const decided = status !== "ai_draft";
  const updated = db.ariaReg45EvidenceItems.patch(id, {
    status: status as AriaReg45EvidenceItem["status"],
    decided_by: decided ? guard.actor.userId : existing.decided_by,
    decided_at: decided ? new Date().toISOString() : existing.decided_at,
    decision_note: note ?? existing.decision_note,
    is_ai_draft: status === "ai_draft",
  });
  return NextResponse.json({ data: updated });
}
