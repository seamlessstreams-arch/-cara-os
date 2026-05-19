// ══════════════════════════════════════════════════════════════════════════════
// API — RI acknowledge a trajectory escalation  (Milestone 52)
//
// POST { home_id, escalation_id, note }
// Permission: aria.ri_qa (RI-only action — acks oversight escalations).
// Audited. Does NOT silence the underlying manager-facing alert.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireAriaStudioPermission } from "@/lib/aria/aria-studio-guard";
import {
  detectTrajectoryRiEscalations,
  recordTrajectoryRiEscalationAck,
} from "@/lib/care-events/inspection-trajectory";
import { appendAriaAudit } from "@/lib/aria/aria-audit-trail";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const homeId = typeof body.home_id === "string" ? body.home_id : "";
  const escalationId = typeof body.escalation_id === "string" ? body.escalation_id : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!homeId || !escalationId) {
    return NextResponse.json(
      { error: "home_id and escalation_id are required" },
      { status: 400 },
    );
  }
  if (note.length === 0) {
    return NextResponse.json({ error: "note is required" }, { status: 400 });
  }

  const guard = requireAriaStudioPermission(req, body, {
    permission: "aria.ri_qa",
    homeId,
    intent: "acknowledge trajectory RI escalation",
    isSafeguardingSensitive: true,
  });
  if (!guard.ok) return guard.response;

  const escalations = detectTrajectoryRiEscalations(homeId);
  const escalation = escalations.find((e) => e.id === escalationId);
  if (!escalation) {
    return NextResponse.json(
      { error: "escalation not found or already acknowledged" },
      { status: 404 },
    );
  }

  const ack = recordTrajectoryRiEscalationAck({
    escalation,
    acked_by_user: guard.actor.userId,
    acked_by_role: guard.actor.role,
    note,
  });

  appendAriaAudit({
    homeId,
    actorId: guard.actor.userId,
    actionType: "artifact_reviewed",
    artifactId: escalation.bundle_id ?? escalation.alert_id,
    summary: `RI acknowledged trajectory escalation ${escalation.alert_kind} — ${note.slice(0, 120)}`,
    after: ack as unknown as Record<string, unknown>,
  });

  return NextResponse.json({ data: ack });
}
