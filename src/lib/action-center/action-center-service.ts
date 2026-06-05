// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Action Centre service
//
// Gathers the live signals from the store + safe-staffing, then delegates to the
// pure aggregator. Read-only.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { buildSafeStaffingStatus } from "@/lib/staffing/safe-staffing-service";
import { aggregateActionItems, type ActionCenter } from "./action-center";

/** Count comms messages in the home awaiting THIS user's acknowledgement. */
function unacknowledgedComms(staffId: string, homeId: string): number {
  const msgs = db.commsMessages
    .findAll()
    .filter((m) => m.home_id === homeId && m.requires_acknowledgement && !m.is_deleted && m.author_id !== staffId);
  let count = 0;
  for (const m of msgs) {
    const acked = db.commsMessageReceipts.findByMessage(m.id).some((r) => r.user_id === staffId && !!r.acknowledged_at);
    if (!acked) count++;
  }
  return count;
}

/** Count tasks awaiting sign-off (the platform's approval signal). */
function tasksAwaitingSignOff(homeId: string): number {
  return db.tasks
    .findAll()
    .filter(
      (t) =>
        t.requires_sign_off &&
        !t.signed_off_by &&
        t.status !== "completed" &&
        t.status !== "cancelled" &&
        (!t.home_id || t.home_id === homeId),
    ).length;
}

export function buildActionCenterForStaff(staffId: string, homeId: string, nowIso: string): ActionCenter {
  const staffing = buildSafeStaffingStatus(homeId, nowIso).assessment;
  return aggregateActionItems({
    emergencies: db.emergencyAlerts.findActive(homeId),
    staffing,
    unacknowledgedComms: unacknowledgedComms(staffId, homeId),
    tasksAwaitingSignOff: tasksAwaitingSignOff(homeId),
  });
}
