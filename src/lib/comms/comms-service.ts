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
import type { CommsUser } from "./comms-access";

const DEFAULT_USER_ID = "staff_darren";

/** Is this staff member currently on an active shift (clocked in, not out)? */
export function isOnShift(staffId: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const shifts = (db.shifts?.findAll?.() ?? []) as Array<{
    staff_id: string; date: string; status?: string; clock_in_at?: string | null; clock_out_at?: string | null;
  }>;
  return shifts.some(
    (s) =>
      s.staff_id === staffId &&
      s.date === today &&
      (s.status === "in_progress" || (!!s.clock_in_at && !s.clock_out_at)),
  );
}

/** Resolve the acting comms user from the request (header → staff record). */
export function resolveCommsUser(req: NextRequest): CommsUser {
  const userId = req.headers.get("x-user-id") || DEFAULT_USER_ID;
  const staff = (db.staff?.findAll?.() ?? []).find((s: { id: string }) => s.id === userId) as
    | { id: string; role: string; home_id: string; key_worker_for?: string[] }
    | undefined;

  const role = staff?.role ?? "residential_care_worker";
  const home_id = staff?.home_id ?? "home_oak";

  // Children this user key-works (assigned). Derived from young people, best-effort.
  const assigned = (db.youngPeople?.findAll?.() ?? [])
    .filter((yp: { key_worker_id?: string | null }) => yp.key_worker_id === userId)
    .map((yp: { id: string }) => yp.id);

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
