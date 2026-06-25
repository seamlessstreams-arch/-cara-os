// ══════════════════════════════════════════════════════════════════════════════
// CARA — RECORD AUDIT RECORDER
//
// One demo-safe entry point for "who changed what, from what, to what, when".
// It does two things on every write it is given:
//   1. ALWAYS captures a field-level before→after entry into an in-memory trail
//      (so the demo shows a real audit history — fixing the old in-memory array
//      that had no before→after), bounded per serverless instance.
//   2. When Supabase is configured, also writes the immutable cs_audit_log row
//      via the existing audit-service (durable, INSERT-only).
//
// Audit must NEVER block or fail the operation it records — every path here is
// best-effort and swallows its own errors. The pure diff + the trail make it
// fully unit-testable without a database.
// ══════════════════════════════════════════════════════════════════════════════

import { writeAuditLog } from "@/lib/services/audit-service";
import { generateId } from "@/lib/utils";
import type { AuditAction } from "@/types/operations";
import type { CornerstoneEventChange } from "@/types/cornerstone-event";

export interface FieldChange {
  old: unknown;
  new: unknown;
}
export type FieldChanges = Record<string, FieldChange>;

// Bookkeeping fields are never "changes" a human made — exclude them from diffs.
const IGNORED_FIELDS = new Set(["id", "created_at", "created_by", "updated_at", "updated_by"]);

/** Pure field-level diff. Deep-compares via JSON; null-safe; skips bookkeeping. */
export function computeFieldChanges(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
  ignore: ReadonlySet<string> = IGNORED_FIELDS,
): FieldChanges {
  const changes: FieldChanges = {};
  const b = before ?? {};
  const a = after ?? {};
  for (const key of new Set([...Object.keys(b), ...Object.keys(a)])) {
    if (ignore.has(key)) continue;
    if (JSON.stringify(b[key]) !== JSON.stringify(a[key])) {
      changes[key] = { old: b[key] ?? null, new: a[key] ?? null };
    }
  }
  return changes;
}

export interface AuditTrailEntry {
  id: string;
  at: string;
  entityType: string;
  entityId: string;
  homeId: string | null;
  action: AuditAction;
  changes: FieldChanges;
  changeCount: number;
  performedBy: string;
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: string | null;
  /** True when the row was also written to the durable cs_audit_log. */
  durable: boolean;
  metadata?: Record<string, unknown>;
}

// In-memory before→after trail (per serverless instance). Durable history lives
// in cs_audit_log when Supabase is on; this is the always-on demo-visible copy.
const TRAIL_CAP = 2000;
let _trail: AuditTrailEntry[] = [];

export interface AuditTrailFilter {
  entityType?: string;
  entityId?: string;
  homeId?: string;
  performedBy?: string;
  limit?: number;
}

/** Recent in-memory audit entries, newest first, optionally filtered. */
export function getRecordAuditTrail(filter: AuditTrailFilter = {}): AuditTrailEntry[] {
  let rows = [..._trail].reverse();
  if (filter.entityType) rows = rows.filter((r) => r.entityType === filter.entityType);
  if (filter.entityId) rows = rows.filter((r) => r.entityId === filter.entityId);
  if (filter.homeId) rows = rows.filter((r) => r.homeId === filter.homeId);
  if (filter.performedBy) rows = rows.filter((r) => r.performedBy === filter.performedBy);
  return rows.slice(0, filter.limit ?? 100);
}

export function __resetRecordAuditTrail(): void {
  _trail = [];
}

export interface RecordAuditInput {
  entityType: string;
  entityId: string;
  homeId?: string | null;
  action: AuditAction;
  /** Provide before+after to derive changes, or pass changes directly. */
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  changes?: FieldChanges;
  performedBy?: string;
  ip?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Record one audited change. Captures the in-memory before→after entry
 * synchronously (so a fire-and-forget caller still populates the trail), then
 * best-effort writes the durable cs_audit_log row. Never throws.
 */
export async function recordEntityAudit(input: RecordAuditInput): Promise<AuditTrailEntry> {
  const changes = input.changes ?? computeFieldChanges(input.before, input.after);
  const entry: AuditTrailEntry = {
    id: generateId("aud"),
    at: new Date().toISOString(),
    entityType: input.entityType,
    entityId: input.entityId,
    homeId: input.homeId ?? null,
    action: input.action,
    changes,
    changeCount: Object.keys(changes).length,
    performedBy: input.performedBy ?? "system",
    ipAddress: input.ip ?? null,
    userAgent: input.userAgent ?? null,
    sessionId: input.sessionId ?? null,
    durable: false,
    metadata: input.metadata,
  };

  // 1. Always-on in-memory trail (synchronous — happens before any await).
  _trail.push(entry);
  if (_trail.length > TRAIL_CAP) _trail.splice(0, _trail.length - TRAIL_CAP);

  // 2. Durable cs_audit_log when Supabase is configured (best-effort, never blocks).
  try {
    const res = await writeAuditLog({
      homeId: input.homeId ?? "unknown",
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      changes,
      metadata: input.metadata,
      performedBy: entry.performedBy,
      ipAddress: input.ip ?? undefined,
      userAgent: input.userAgent ?? undefined,
      sessionId: input.sessionId ?? undefined,
    });
    entry.durable = res.ok && Boolean((res as { data?: unknown }).data);
  } catch {
    // Audit failures must never surface to the caller.
  }

  return entry;
}

/** Pull audit context (ip / user-agent / session) from a request's headers. */
export function extractRequestAuditContext(req: {
  headers: { get(name: string): string | null };
}): { ip: string | null; userAgent: string | null; sessionId: string | null } {
  const h = req.headers;
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : h.get("x-real-ip");
  return {
    ip: ip || null,
    userAgent: h.get("user-agent"),
    sessionId: h.get("x-session-id"),
  };
}

/**
 * One-liner for routes: pull request context from headers and record the change,
 * fire-and-forget. This is the intended adoption surface — a write path adds a
 * single call after its update and the before→after is captured + persisted.
 */
export function auditFromRequest(
  req: { headers: { get(name: string): string | null } },
  input: Omit<RecordAuditInput, "ip" | "userAgent" | "sessionId">,
): void {
  const ctx = extractRequestAuditContext(req);
  void recordEntityAudit({ ...input, ip: ctx.ip, userAgent: ctx.userAgent, sessionId: ctx.sessionId });
}

/** Convert field changes to the CornerstoneEvent changeHistory entry shape. */
export function toChangeHistory(
  changes: FieldChanges,
  by: string,
  at: string,
): CornerstoneEventChange[] {
  return Object.entries(changes).map(([field, c]) => ({ at, by, field, from: c.old, to: c.new }));
}
