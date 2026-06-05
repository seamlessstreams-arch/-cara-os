// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Emergency service (Phase 7)
//
// Raises an emergency alert and broadcasts a PRIVACY-SAFE message to on-shift staff
// + managers via the Phase 1 Comms `emergency_broadcast` channel. The broadcast says
// only that assistance is needed (operational type + optional location) — never
// child / safeguarding / medical detail. Acknowledge + resolve tracked.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { writeAuditLog } from "@/lib/supabase/audit";
import { persistCommsMessage } from "@/lib/supabase/comms";
import { persistEmergencyAlert } from "@/lib/supabase/workforce";
import { EMERGENCY_TYPE_LABEL, type EmergencyAlert, type EmergencyType } from "./emergency-types";

export interface TriggerEmergencyInput {
  homeId: string;
  raisedBy: string;
  raisedByName: string;
  type: EmergencyType;
  location?: string | null;
  note?: string | null;
}

function audit(event: string, homeId: string, by: string, entityId: string, detail: Record<string, unknown>) {
  void writeAuditLog({
    home_id: homeId,
    entity_type: `emergency.${event}`,
    entity_id: entityId,
    action: event === "raised" ? "create" : "update",
    changes: detail,
    performed_by: by,
  });
}

/** Post the privacy-safe broadcast into the home's emergency_broadcast channel. */
function broadcast(input: TriggerEmergencyInput): string | null {
  const channels = db.commsChannels?.findForHome?.(input.homeId) ?? [];
  const channel = channels.find((c: { type: string }) => c.type === "emergency_broadcast");
  if (!channel) return null;

  // Generic, non-identifying wording — operational category + optional location only.
  const where = input.location ? ` at ${input.location}` : "";
  const body =
    `🚨 EMERGENCY — ${EMERGENCY_TYPE_LABEL[input.type]} assistance needed${where}. ` +
    `Raised by ${input.raisedByName}. All available staff please respond.`;

  const msg = db.commsMessages.create({
    channel_id: channel.id,
    home_id: input.homeId,
    author_id: input.raisedBy,
    body,
    priority: "emergency",
    requires_acknowledgement: true,
  });
  void persistCommsMessage(msg);
  return msg.id;
}

export interface TriggerEmergencyResult {
  alert: EmergencyAlert;
  broadcast_message_id: string | null;
}

export function triggerEmergency(input: TriggerEmergencyInput, nowIso: string): TriggerEmergencyResult {
  const broadcastId = broadcast(input);
  const alert = db.emergencyAlerts.create({
    home_id: input.homeId,
    type: input.type,
    raised_by: input.raisedBy,
    raised_by_name: input.raisedByName,
    location: input.location ?? null,
    note: input.note ?? null,
    status: "active",
    responders: [],
    broadcast_message_id: broadcastId,
    resolved_at: null,
    resolved_by: null,
  });
  audit("raised", input.homeId, input.raisedBy, alert.id, { type: input.type, broadcast: !!broadcastId });
  void persistEmergencyAlert(alert); // durable persistence (no-op when Supabase off)
  return { alert, broadcast_message_id: broadcastId };
}

export function acknowledgeEmergency(
  alertId: string,
  staffId: string,
  name: string,
  nowIso: string,
): EmergencyAlert | null {
  const alert = db.emergencyAlerts.findById(alertId);
  if (!alert || alert.status !== "active") return null;
  if (alert.responders.some((r) => r.staff_id === staffId)) return alert; // idempotent
  const updated = db.emergencyAlerts.patch(alertId, {
    responders: [...alert.responders, { staff_id: staffId, name, at: nowIso }],
  });
  audit("acknowledged", alert.home_id, staffId, alertId, {});
  if (updated) void persistEmergencyAlert(updated);
  return updated;
}

export function resolveEmergency(alertId: string, staffId: string, nowIso: string): EmergencyAlert | null {
  const alert = db.emergencyAlerts.findById(alertId);
  if (!alert) return null;
  const updated = db.emergencyAlerts.patch(alertId, {
    status: "resolved",
    resolved_at: nowIso,
    resolved_by: staffId,
  });
  audit("resolved", alert.home_id, staffId, alertId, {});
  if (updated) void persistEmergencyAlert(updated);
  return updated;
}
