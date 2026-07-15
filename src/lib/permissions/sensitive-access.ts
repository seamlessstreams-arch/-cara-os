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
  getUserEmploymentStatus,
} from "@/lib/auth-guard";
import type { AppRole, Permission } from "@/lib/permissions";
import { recordEntityAudit, extractRequestAuditContext } from "@/lib/audit/audit-recorder";
import type { AuditAction } from "@/types/operations";
import { evaluateSensitiveAbac } from "./abac-shadow";
import { recordAbacDivergence } from "./abac-divergence";

/** Env kill-switch (rollback) — enforcement is ON unless explicitly disabled. */
const ENFORCED = process.env.SENSITIVE_ACCESS_ENFORCED !== "false";
/** Advisory ABAC shadow (Module 5) — ON unless disabled; never blocks. */
const ABAC_SHADOW = process.env.SENSITIVE_ABAC_SHADOW !== "false";
/** Employment-status lockout (Module 6) — ON unless disabled. The ONE ABAC gate
 *  that's safe to ENFORCE (it doesn't diverge from the flat grants): a suspended
 *  or departed staff member must not reach confidential records, whatever their
 *  role. Full role-rule ABAC enforcement stays advisory until the engine's
 *  ROLE_RULES are reconciled with the flat grants (they currently diverge —
 *  e.g. the engine has no `complaint` rules and a deputy sensitivity ceiling). */
const ENFORCE_EMPLOYMENT = process.env.SENSITIVE_EMPLOYMENT_LOCKOUT !== "false";

/** Staff employment states that must be locked out of confidential records
 *  (maps to the ABAC engine's BLOCKED_STATUSES: suspended / leaver). */
const BLOCKED_EMPLOYMENT: ReadonlySet<string> = new Set(["suspended", "left", "leaver", "archived", "dismissed", "terminated"]);

/** True when this employment status must be denied confidential access. */
export function isEmploymentBlocked(status: string | null | undefined): boolean {
  return status != null && BLOCKED_EMPLOYMENT.has(status.toLowerCase().trim());
}

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
      // This is exactly the access an enforcing flip would take away, so record
      // it on the durable audit spine rather than warn into a log that scrolls
      // away. contextReal separates evidence (the actor's real shift/employment/
      // key-worker attributes) from unknown-actor noise.
      recordAbacDivergence({
        userId,
        role,
        resource: audit.entityType,
        action: audit.action ?? "view",
        homeId: audit.homeId,
        reason: r.reason,
        contextReal: r.contextReal,
      });
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

function logAccess(
  userId: string,
  audit: SensitiveAuditContext,
  permission: Permission,
  request: NextRequest,
  extra?: Record<string, unknown>,
): void {
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
    metadata: { sensitive: true, permission, ...extra },
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

  // Module 6 — employment-status lockout: the ONE ABAC gate safe to ENFORCE
  // today (it doesn't diverge from the flat grants). A suspended or departed
  // staff member who still nominally holds the role permission is nonetheless
  // denied confidential records — an insider-threat control on the highest-risk
  // data. Demo-safe: the demo default identity (staff_darren) is "active", so
  // the demo is unaffected. Logged as a blocked attempt so the access trail
  // shows the denial rather than silence.
  if (ENFORCE_EMPLOYMENT) {
    const employmentStatus = getUserEmploymentStatus(result.userId);
    if (isEmploymentBlocked(employmentStatus)) {
      logAccess(result.userId, audit, permission, request, {
        blocked: true,
        reason: "employment_lockout",
        employmentStatus,
      });
      console.warn(
        `[sensitive-access] employment lockout: ${result.userId} (${employmentStatus}) → ${audit.entityType}`,
      );
      return NextResponse.json(
        {
          error: "Forbidden",
          detail: "Access to confidential records is not available for your current employment status.",
        },
        { status: 403 },
      );
    }
  }

  logAccess(result.userId, audit, permission, request);
  runAbacShadow(result.userId, result.role, audit); // advisory — never blocks
  return result;
}
