// ══════════════════════════════════════════════════════════════════════════════
// CARA — IMMUTABLE AUDIT TRAIL SERVICE
// INSERT-only audit log. No UPDATE, no DELETE — ever.
// Every significant action in the system is recorded with full context.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { CsAuditLogEntry, AuditAction, ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Entity type constants ───────────────────────────────────────────────────

export const AUDIT_ENTITY_TYPES = {
  YOUNG_PERSON:        "young_person",
  INCIDENT:            "incident",
  DAILY_LOG:           "daily_log",
  MEDICATION:          "medication",
  MEDICATION_ADMIN:    "medication_administration",
  SAFEGUARDING:        "safeguarding_concern",
  MISSING_EPISODE:     "missing_episode",
  COMPLAINT:           "complaint",
  TASK:                "task",
  FORM_TEMPLATE:       "form_template",
  FORM_VERSION:        "form_template_version",
  FORM_SUBMISSION:     "form_submission",
  WORKFLOW:            "workflow",
  WORKFLOW_STEP:       "workflow_step",
  EVIDENCE:            "evidence_item",
  EVIDENCE_LINK:       "evidence_link",
  OVERSIGHT_NOTE:      "oversight_note",
  SUPERVISION:         "supervision",
  TRAINING:            "training_record",
  SHIFT:               "shift",
  LEAVE_REQUEST:       "leave_request",
  DOCUMENT:            "document",
  STAFF:               "staff_member",
  ROLE_ASSIGNMENT:     "role_assignment",
  PERMISSION:          "permission_change",
  SYSTEM_SETTING:      "system_setting",
  CARA_RECOMMENDATION: "cara_recommendation",
  INSPECTION_SCAN:     "inspection_scan",
  EXPORT:              "data_export",
  SESSION:             "user_session",
} as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[keyof typeof AUDIT_ENTITY_TYPES];

// ── Core audit functions ────────────────────────────────────────────────────

/**
 * Write an immutable audit log entry.
 * This is the only write operation — no updates, no deletes.
 */
export async function writeAuditLog(input: {
  homeId: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;
  performedBy: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}): Promise<ServiceResult<CsAuditLogEntry>> {
  const s = sb();
  if (!s) return { ok: true }; // silently succeed if Supabase not configured — audit should never block

  const { data, error } = await (s.from("cs_audit_log") as SB)
    .insert({
      home_id: input.homeId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      action: input.action,
      changes: input.changes ?? null,
      metadata: input.metadata ?? null,
      performed_by: input.performedBy,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      session_id: input.sessionId ?? null,
    })
    .select()
    .single();

  if (error) {
    // Audit failures should be logged but never block the main operation
    console.error("[AUDIT] Failed to write audit log:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true, data };
}

/**
 * Write an audit log entry for an update operation.
 * Automatically computes field-level changes.
 */
export async function writeUpdateAudit(input: {
  homeId: string;
  entityType: string;
  entityId: string;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  performedBy: string;
  ipAddress?: string;
}): Promise<ServiceResult<CsAuditLogEntry>> {
  const changes = computeChanges(input.oldValues, input.newValues);
  if (Object.keys(changes).length === 0) return { ok: true }; // No actual changes

  return writeAuditLog({
    homeId: input.homeId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: "update",
    changes,
    performedBy: input.performedBy,
    ipAddress: input.ipAddress,
  });
}

// ── Query functions ─────────────────────────────────────────────────────────

/**
 * Get audit trail for a specific entity.
 */
export async function getEntityAuditTrail(
  entityType: string,
  entityId: string,
  opts?: { limit?: number },
): Promise<ServiceResult<CsAuditLogEntry[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  const { data, error } = await (s.from("cs_audit_log") as SB)
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("performed_at", { ascending: false })
    .limit(opts?.limit ?? 100);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

/**
 * Get audit trail for a home — all entities.
 */
export async function getHomeAuditTrail(
  homeId: string,
  opts?: {
    entityType?: string;
    action?: AuditAction;
    performedBy?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  },
): Promise<ServiceResult<CsAuditLogEntry[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_audit_log") as SB).select("*").eq("home_id", homeId);

  if (opts?.entityType) q = q.eq("entity_type", opts.entityType);
  if (opts?.action) q = q.eq("action", opts.action);
  if (opts?.performedBy) q = q.eq("performed_by", opts.performedBy);
  if (opts?.from) q = q.gte("performed_at", opts.from);
  if (opts?.to) q = q.lte("performed_at", opts.to);

  q = q.order("performed_at", { ascending: false });

  const limit = opts?.limit ?? 100;
  const offset = opts?.offset ?? 0;
  q = q.range(offset, offset + limit - 1);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

/**
 * Get audit trail for a user — everything they did.
 */
export async function getUserAuditTrail(
  userId: string,
  opts?: {
    from?: string;
    to?: string;
    limit?: number;
  },
): Promise<ServiceResult<CsAuditLogEntry[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_audit_log") as SB)
    .select("*")
    .eq("performed_by", userId);

  if (opts?.from) q = q.gte("performed_at", opts.from);
  if (opts?.to) q = q.lte("performed_at", opts.to);
  q = q.order("performed_at", { ascending: false }).limit(opts?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

/**
 * Search audit log by content.
 */
export async function searchAuditLog(
  homeId: string,
  searchTerm: string,
  opts?: { limit?: number },
): Promise<ServiceResult<CsAuditLogEntry[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  // Search in changes and metadata JSONB fields
  const { data, error } = await (s.from("cs_audit_log") as SB)
    .select("*")
    .eq("home_id", homeId)
    .or(`changes::text.ilike.%${searchTerm}%,metadata::text.ilike.%${searchTerm}%`)
    .order("performed_at", { ascending: false })
    .limit(opts?.limit ?? 50);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

/**
 * Get audit statistics for a time period.
 */
export async function getAuditStats(
  homeId: string,
  from?: string,
  to?: string,
): Promise<ServiceResult<{
  total_entries: number;
  by_action: Record<string, number>;
  by_entity_type: Record<string, number>;
  by_user: Record<string, number>;
  most_active_hour: number | null;
}>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  let q = (s.from("cs_audit_log") as SB)
    .select("action, entity_type, performed_by, performed_at")
    .eq("home_id", homeId);

  if (from) q = q.gte("performed_at", from);
  if (to) q = q.lte("performed_at", to);
  q = q.limit(10000);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };

  const entries = data ?? [];
  const byAction: Record<string, number> = {};
  const byEntityType: Record<string, number> = {};
  const byUser: Record<string, number> = {};
  const hourCounts: Record<number, number> = {};

  for (const e of entries) {
    byAction[e.action] = (byAction[e.action] ?? 0) + 1;
    byEntityType[e.entity_type] = (byEntityType[e.entity_type] ?? 0) + 1;
    if (e.performed_by) byUser[e.performed_by] = (byUser[e.performed_by] ?? 0) + 1;
    if (e.performed_at) {
      const hour = new Date(e.performed_at).getHours();
      hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    }
  }

  let mostActiveHour: number | null = null;
  let maxCount = 0;
  for (const [hour, count] of Object.entries(hourCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostActiveHour = parseInt(hour);
    }
  }

  return {
    ok: true,
    data: {
      total_entries: entries.length,
      by_action: byAction,
      by_entity_type: byEntityType,
      by_user: byUser,
      most_active_hour: mostActiveHour,
    },
  };
}

// ── Pure helpers ────────────────────────────────────────────────────────────

function computeChanges(
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>,
): Record<string, { old: unknown; new: unknown }> {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

  for (const key of allKeys) {
    // Skip internal fields
    if (["updated_at", "updated_by"].includes(key)) continue;

    const oldVal = oldValues[key];
    const newVal = newValues[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[key] = { old: oldVal ?? null, new: newVal ?? null };
    }
  }
  return changes;
}

// ── Testing exports ─────────────────────────────────────────────────────────

export const _testing = {
  AUDIT_ENTITY_TYPES,
  computeChanges,
};
