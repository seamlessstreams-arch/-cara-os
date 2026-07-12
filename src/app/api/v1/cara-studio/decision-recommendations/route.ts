// ══════════════════════════════════════════════════════════════════════════════
// API — Cara Decision Recommendation status updates
// PATCH → accept / modify / defer / reject / complete (RBAC: cara.approve_outputs)
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import type { CaraDecisionRecommendation } from "@/types/cara-studio";
import { readJsonBody } from "@/lib/http/read-json";

const ALLOWED: Array<CaraDecisionRecommendation["status"]> = [
  "ai_draft",
  "accepted",
  "modified",
  "deferred",
  "rejected",
  "completed",
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
  if (!ALLOWED.includes(status as CaraDecisionRecommendation["status"])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = db.caraDecisionRecommendations.findById(id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const guard = requireCaraStudioPermission(req, body, {
    permission: "cara.approve_outputs",
    homeId: existing.home_id,
    intent: `update decision_recommendation ${status}`,
  });
  if (!guard.ok) return guard.response;

  const decided =
    status === "accepted" ||
    status === "modified" ||
    status === "rejected" ||
    status === "completed" ||
    status === "deferred";

  const updated = db.caraDecisionRecommendations.patch(id, {
    status: status as CaraDecisionRecommendation["status"],
    decided_by: decided ? guard.actor.userId : existing.decided_by,
    decided_at: decided ? new Date().toISOString() : existing.decided_at,
    decision_note: note ?? existing.decision_note,
    is_ai_draft: status === "ai_draft",
  });
  return NextResponse.json({ data: updated });
}
