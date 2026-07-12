// ══════════════════════════════════════════════════════════════════════════════
// API — Cara Formulation status updates
// PATCH → in_review / approved / rejected (RBAC: cara.approve_outputs)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import type { CaraFormulation } from "@/types/cara-studio";
import { readJsonBody } from "@/lib/http/read-json";

const ALLOWED: Array<CaraFormulation["status"]> = [
  "ai_draft",
  "in_review",
  "approved",
  "rejected",
  "superseded",
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
  const note = typeof body.reviewer_note === "string" ? body.reviewer_note : null;
  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  }
  if (!ALLOWED.includes(status as CaraFormulation["status"])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = db.caraFormulations.findById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const guard = requireCaraStudioPermission(req, body, {
    permission: "cara.approve_outputs",
    homeId: existing.home_id,
    intent: `update formulation ${status}`,
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  const approved = status === "approved";
  const updated = db.caraFormulations.patch(id, {
    status: status as CaraFormulation["status"],
    approved_by: approved ? guard.actor.userId : existing.approved_by,
    approved_at: approved ? new Date().toISOString() : existing.approved_at,
    reviewer_note: note ?? existing.reviewer_note,
    is_ai_draft: status === "ai_draft",
  });
  return NextResponse.json({ data: updated });
}
