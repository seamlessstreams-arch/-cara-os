// ══════════════════════════════════════════════════════════════════════════════
// COMMS CENTRE — server service (Phase 1)
//
// Resolves the acting user for comms API routes (consistent with the platform's
// current identity model), computes on-shift status from the rota, and writes
// audit entries. Real Supabase-session enforcement is the Phase-4 hardening; for
// now identity comes from the request (x-user-id) → staff record, exactly like
// the rest of the demo/dual-backend platform.
// ══════════════════════════════════════════════════════════════════════════════

import type { NextRequest } from "next/server";
import { db } from "@/lib/db/store";
import { writeAuditLog } from "@/lib/supabase/audit";
import { isStaffOnShift } from "@/lib/attendance/sign-in-service";
import type { CommsUser } from "./comms-access";

const DEFAULT_USER_ID = "staff_darren";

/** Is this staff member currently on an active shift (clocked in, not out)? */
export function isOnShift(staffId: string): boolean {
  return isStaffOnShift(staffId);
}

/**
 * Resolve the acting comms user from the request.
 *
 * Activated mode (Supabase configured): identity comes from the validated session
 * — the X-User-Id header is ignored. With no valid session we return a POWERLESS
 * identity (no id, base role, no home, off-shift, no assignments) so comms-access
 * denies sensitive/safeguarding channels rather than escalating via a forged header.
 *
 * Demo mode: X-User-Id header → staff record convention, unchanged.
 */
export async function resolveCommsUser(req: NextRequest): Promise<CommsUser> {
  const { isSupabaseEnabled } = await import("@/lib/supabase/server");

  let userId: string;
  let role: string;
  let home_id: string;

  if (isSupabaseEnabled()) {
    const { resolveStaffSession } = await import("@/lib/supabase/auth");
    let session: Awaited<ReturnType<typeof resolveStaffSession>> | null = null;
    try {
      session = await resolveStaffSession(req);
    } catch {
      session = null;
    }
    if (!session) {
      // No authenticated session — powerless identity (comms-access denies sensitive access).
      return {
        id: "",
        role: "none",
        home_id: "",
        shift_active: false,
        assigned_child_ids: [],
        safeguarding_lead: false,
      };
    }
    userId = session.userId;
    role = session.role;
    home_id = session.homeId;
  } else {
    // Demo mode: X-User-Id header → staff record.
    userId = req.headers.get("x-user-id") || DEFAULT_USER_ID;
    const staff = (db.staff?.findAll?.() ?? []).find((s: { id: string }) => s.id === userId) as
      | { id: string; role: string; home_id: string; key_worker_for?: string[] }
      | undefined;
    role = staff?.role ?? "residential_care_worker";
    home_id = staff?.home_id ?? "home_oak";
  }

  // Children this user key-works (assigned). Derived from young people, best-effort.
  const assigned = (db.youngPeople?.findAll?.() ?? [])
    .filter((yp: { key_worker_id?: string | null }) => yp.key_worker_id === userId)
    .map((yp: { id: string }) => yp.id);

  // Seed the home's channels at the chokepoint every comms route passes through.
  // Seeding only inside the channels-list read leaves any other serverless
  // instance (messages/receipt/hold/convert) with an empty store — a channel id
  // from the list then 404s on open/send. Deterministic ids fixed half of that
  // class; this fixes the other half.
  if (home_id) db.commsChannels.seedDefaults(home_id);

  return {
    id: userId,
    role,
    home_id,
    shift_active: isOnShift(userId),
    assigned_child_ids: assigned,
    safeguarding_lead: false,
  };
}

const AUDIT_ACTION: Record<string, "create" | "update" | "delete" | "view"> = {
  channel_created: "create",
  channel_updated: "update",
  message_sent: "create",
  message_read: "view",
  message_acknowledged: "update",
  message_edited: "update",
  message_deleted: "delete",
  message_action_created: "update",
  message_converted: "create",
  message_held: "update",
  message_hold_released: "update",
  trust_notice_acknowledged: "update",
  access_denied: "view",
};

/** Write a comms audit entry (Supabase audit_log; safe no-op when Supabase off). */
export function auditComms(
  event: keyof typeof AUDIT_ACTION,
  user: CommsUser,
  entityId: string,
  detail?: Record<string, unknown>,
): void {
  void writeAuditLog({
    home_id: user.home_id,
    entity_type: `comms.${event}`,
    entity_id: entityId,
    action: AUDIT_ACTION[event] ?? "view",
    changes: detail,
    performed_by: user.id,
  });
}
