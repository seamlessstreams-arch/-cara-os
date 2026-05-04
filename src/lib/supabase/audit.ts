/**
 * Supabase audit log writer
 *
 * Writes to the audit_log table for sensitive actions.
 * Safe to call even when Supabase is not enabled (no-ops).
 */

import { createServerClient } from "./server";

interface AuditEntry {
  home_id: string;
  entity_type: string;
  entity_id: string;
  action: "create" | "update" | "delete" | "sign_off" | "escalate" | "complete" | "view" | "oversight";
  changes?: Record<string, unknown>;
  performed_by?: string | null;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  const supabase = createServerClient();
  if (!supabase) return; // no-op in in-memory mode

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("audit_log") as any).insert({
      home_id: entry.home_id,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      action: entry.action,
      changes: entry.changes ?? null,
      performed_by: entry.performed_by ?? null,
    });
  } catch {
    // Audit log failures must never break primary operations
    console.error("[audit] Failed to write audit log entry:", entry);
  }
}
