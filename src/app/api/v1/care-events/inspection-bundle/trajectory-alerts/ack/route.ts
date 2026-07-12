// ══════════════════════════════════════════════════════════════════════════════
// API — Acknowledge a trajectory alert  (Milestone 48)
//
// POST { home_id, alert_id, note }
// Permission: cara.manager_review (manager-only action — acks are operational).
// Audited.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import {
  detectTrajectoryAlerts,
  recordTrajectoryAlertAck,
} from "@/lib/care-events/inspection-trajectory";
import { appendCaraAudit } from "@/lib/cara/cara-audit-trail";
import { readJsonBody } from "@/lib/http/read-json";

export async function POST(req: NextRequest) {
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data as Record<string, unknown>;
  const homeId = typeof body.home_id === "string" ? body.home_id : "";
  const alertId = typeof body.alert_id === "string" ? body.alert_id : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!homeId || !alertId) {
    return NextResponse.json({ error: "home_id and alert_id are required" }, { status: 400 });
  }
  if (note.length === 0) {
    return NextResponse.json({ error: "note is required" }, { status: 400 });
  }

  const guard = requireCaraStudioPermission(req, body, {
    permission: "cara.approve_outputs",
    homeId,
    intent: "acknowledge trajectory alert",
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  // Re-derive current alerts for this home to validate the alert id exists
  // and belongs to this home, before persisting an ack against it.
  const alerts = detectTrajectoryAlerts(homeId);
  const alert = alerts.find((a) => a.id === alertId);
  if (!alert) {
    return NextResponse.json({ error: "alert not found or already acknowledged" }, { status: 404 });
  }

  const ack = recordTrajectoryAlertAck({
    alert,
    acked_by_user: guard.actor.userId,
    acked_by_role: guard.actor.role,
    note,
  });

  appendCaraAudit({
    homeId,
    actorId: guard.actor.userId,
    actionType: "artifact_reviewed",
    artifactId: alert.bundle_id ?? alert.id,
    summary: `Acknowledged trajectory alert ${alert.kind} (${alert.severity}) — ${note.slice(0, 120)}`,
    after: ack as unknown as Record<string, unknown>,
  });

  return NextResponse.json({ data: ack });
}
