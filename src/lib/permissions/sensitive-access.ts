// ══════════════════════════════════════════════════════════════════════════════
// CARA — SENSITIVE-RECORD SERVER-SIDE GUARD (Phase 1 · §10)
//
// The confidential surfaces (allegations against staff, whistleblowing
// disclosures, staff disciplinary records) were reachable with no server-side
// authorisation. This guard closes that: it enforces the required permission AND
// records the access in the audit trail (who touched a sensitive record, when).
//
// Reuses the EXISTING primitives — nothing new is invented:
//   • requirePermissionAsync — demo-safe (resolves the header/default identity
//     when Supabase is off) AND fail-closed (401) when Supabase auth is on.
//   • recordEntityAudit       — the existing before→after / access recorder.
//
// Reversible: set SENSITIVE_ACCESS_ENFORCED=false to roll the enforcement back
// (access is still logged), matching the SHIFT_BASED_ACCESS_ENFORCED convention.
// Demo behaviour is unchanged: the demo default identity is a Registered Manager,
// who holds every sensitive permission, so demo reads/writes behave exactly as
// before; only a lower role is newly denied.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import {
  requirePermissionAsync,
  getUserRoleFromRequest,
  getUserIdFromRequest,
} from "@/lib/auth-guard";
import type { AppRole, Permission } from "@/lib/permissions";
import { recordEntityAudit, extractRequestAuditContext } from "@/lib/audit/audit-recorder";
import type { AuditAction } from "@/types/operations";
import { evaluateSensitiveAbac } from "./abac-shadow";

/** Env kill-switch (rollback) — enforcement is ON unless explicitly disabled. */
const ENFORCED = process.env.SENSITIVE_ACCESS_ENFORCED !== "false";
/** Advisory ABAC shadow (Module 5) — ON unless disabled; never blocks. */
const ABAC_SHADOW = process.env.SENSITIVE_ABAC_SHADOW !== "false";

/** Run the ABAC engine in ADVISORY mode: exercise it + its audit-on-view, and
 *  log any divergence from the (enforced) flat decision. Never blocks/throws. */
function runAbacShadow(userId: string, role: AppRole, audit: SensitiveAuditContext): void {
  if (!ABAC_SHADOW) return;
  try {
    const r = evaluateSensitiveAbac({
      userId,
      appRole: role,
      entityType: audit.entityType,
      action: audit.action === "update" ? "edit" : "view",
      homeId: audit.homeId,
    });
    // Flat check already allowed (we only reach here on grant). If ABAC would
    // have denied, surface the divergence for the future enforcing flip.
    if (!r.allowed) {
      console.warn(`[sensitive-access] ABAC advisory would DENY ${role} → ${audit.entityType}: ${r.reason}`);
    }
  } catch {
    // Advisory only — must never affect the route.
  }
}

export interface SensitiveAuditContext {
  /** e.g. "allegation" | "whistleblowing" | "staff_disciplinary". */
  entityType: string;
  /** Defaults to "view" (a read). Use "update"/"create" for writes. */
  action?: AuditAction;
  entityId?: string | null;
  homeId?: string | null;
}

function logAccess(userId: string, audit: SensitiveAuditContext, permission: Permission, request: NextRequest): void {
  const ctx = extractRequestAuditContext(request);
  // Fire-and-forget: the in-memory trail push is synchronous; the durable write
  // is best-effort and never throws, so a logging hiccup can't break the route.
  void recordEntityAudit({
    entityType: audit.entityType,
    entityId: audit.entityId ?? "collection",
    homeId: audit.homeId ?? null,
    action: audit.action ?? "view",
    performedBy: userId,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
    sessionId: ctx.sessionId,
    metadata: { sensitive: true, permission },
  });
}

/**
 * Guard a sensitive-record route: enforce `permission`, then log the access.
 * Returns { role, userId } on success, or a 401/403 NextResponse to return
 * immediately from the handler.
 */
export async function requireSensitiveAccess(
  request: NextRequest,
  permission: Permission,
  audit: SensitiveAuditContext,
): Promise<{ role: AppRole; userId: string } | NextResponse> {
  if (!ENFORCED) {
    // Rollback path: resolve identity for the access log but never block.
    const userId = getUserIdFromRequest(request);
    const role = getUserRoleFromRequest(request);
    logAccess(userId, audit, permission, request);
    runAbacShadow(userId, role, audit);
    return { role, userId };
  }
  const result = await requirePermissionAsync(request, permission);
  if (result instanceof NextResponse) return result; // 401 / 403 — denied
  logAccess(result.userId, audit, permission, request);
  runAbacShadow(result.userId, result.role, audit); // advisory — never blocks
  return result;
}
