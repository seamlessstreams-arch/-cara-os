// ══════════════════════════════════════════════════════════════════════════════
// API — Cara Reg 45 Evidence Item status updates
// PATCH → accept / defer / reject / include_in_report
//   RBAC: cara.approve_outputs (safeguarding-sensitive)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import type { CaraReg45EvidenceItem } from "@/types/cara-studio";
import { readJsonBody } from "@/lib/http/read-json";

const ALLOWED: Array<CaraReg45EvidenceItem["status"]> = [
  "ai_draft",
  "accepted",
  "deferred",
  "rejected",
  "included_in_report",
];

export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : null;
  const status = typeof body.status === "string" ? body.status : null;
  const note = typeof body.decision_note === "string" ? body.decision_note : null;
  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  }
  if (!ALLOWED.includes(status as CaraReg45EvidenceItem["status"])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = db.caraReg45EvidenceItems.findById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const guard = requireCaraStudioPermission(req, body, {
    permission: "cara.approve_outputs",
    homeId: existing.home_id,
    intent: `update reg45_evidence ${status}`,
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  const decided = status !== "ai_draft";
  const updated = db.caraReg45EvidenceItems.patch(id, {
    status: status as CaraReg45EvidenceItem["status"],
    decided_by: decided ? guard.actor.userId : existing.decided_by,
    decided_at: decided ? new Date().toISOString() : existing.decided_at,
    decision_note: note ?? existing.decision_note,
    is_ai_draft: status === "ai_draft",
  });
  return NextResponse.json({ data: updated });
}
