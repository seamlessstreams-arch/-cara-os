// ══════════════════════════════════════════════════════════════════════════════
// CARA — SERVER-SIDE AUTH GUARD
// Used inside API route handlers to enforce permission checks.
//
// Two modes:
//   • Demo mode (Supabase not configured): reads X-User-Id header, falls back
//     to staff_darren. Used in local development and testing.
//   • Supabase mode: validates the JWT from the session cookie, then resolves
//     the matching staff_members row for role/home info.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db/store";
import {
  toAppRole,
  hasPermission,
  type AppRole,
  type Permission,
} from "@/lib/permissions";

const DEFAULT_USER_ID = "staff_darren";

/**
 * Resolve the current user's AppRole from the request.
 * In demo mode: reads X-User-Id header, falls back to staff_darren.
 */
export function getUserRoleFromRequest(request: Request): AppRole {
  const userId =
    request.headers.get("x-user-id") ?? DEFAULT_USER_ID;
  const staff = db.staff.findById(userId);
  if (!staff) return "residential_care_worker";
  return toAppRole(staff.role);
}

/**
 * Resolve the current user's ID from the request.
 */
export function getUserIdFromRequest(request: Request): string {
  return request.headers.get("x-user-id") ?? DEFAULT_USER_ID;
}

/**
 * Assert that the requesting user has a required permission.
 * Returns { role, userId } on success.
 * Returns a 403 NextResponse on failure — return it immediately from the route.
 *
 * Usage:
 *   const auth = requirePermission(req, PERMISSIONS.CREATE_TASKS);
 *   if (auth instanceof NextResponse) return auth;
 *   const { role, userId } = auth;
 */
export function requirePermission(
  request: Request,
  permission: Permission
): { role: AppRole; userId: string } | NextResponse {
  const role = getUserRoleFromRequest(request);
  const userId = getUserIdFromRequest(request);
  if (!hasPermission(role, permission)) {
    return NextResponse.json(
      {
        error: "Forbidden",
        detail: `Role '${role}' does not have permission '${permission}'`,
      },
      { status: 403 }
    );
  }
  return { role, userId };
}

/**
 * Async variant of requirePermission that supports real Supabase auth sessions.
 *
 * When Supabase IS configured (activated mode):
 *   - Requires a valid Supabase session (JWT validated, staff_members row resolved).
 *   - If there is NO valid session — or session resolution errors — it DENIES (401).
 *     It must never fall back to the client-controlled X-User-Id header here: that
 *     would let an unauthenticated request be treated as the default demo manager
 *     (an auth bypass). Fail closed, not open.
 *
 * When Supabase is NOT configured (demo mode):
 *   - Behaves identically to requirePermission (X-User-Id header convention).
 *
 * Usage:
 *   const auth = await requirePermissionAsync(req, PERMISSIONS.CREATE_TASKS);
 *   if (auth instanceof NextResponse) return auth;
 *   const { role, userId } = auth;
 */
export async function requirePermissionAsync(
  request: NextRequest,
  permission: Permission
): Promise<{ role: AppRole; userId: string } | NextResponse> {
  const { isSupabaseEnabled } = await import("@/lib/supabase/server");

  if (isSupabaseEnabled()) {
    // Activated mode: a valid Supabase session is REQUIRED — no header fallback.
    const { resolveStaffSession } = await import("@/lib/supabase/auth");
    let session: Awaited<ReturnType<typeof resolveStaffSession>> | null = null;
    try {
      session = await resolveStaffSession(request);
    } catch {
      // Session resolution failed (transient error / misconfig) — deny, never fall open.
      session = null;
    }
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized", detail: "A valid authenticated session is required." },
        { status: 401 }
      );
    }
    const role = toAppRole(session.role);
    if (!hasPermission(role, permission)) {
      return NextResponse.json(
        { error: "Forbidden", detail: `Role '${role}' does not have permission '${permission}'` },
        { status: 403 }
      );
    }
    return { role, userId: session.userId };
  }

  // Demo mode only (Supabase not configured): X-User-Id header convention.
  return requirePermission(request, permission);
}

// ── Identity + multi-tenant isolation ─────────────────────────────────────────

/** Roles that legitimately see across homes (org/RI/platform oversight). */
const CROSS_HOME_ROLES: ReadonlySet<AppRole> = new Set([
  "super_admin",
  "organisation_director",
  "responsible_individual",
]);

export interface RequestIdentity {
  userId: string;
  role: AppRole;
  /** Session-derived home in activated mode; null in demo mode (no tenancy). */
  homeId: string | null;
}

/**
 * Resolve the caller's identity for routes that need home/role context.
 *
 * Activated mode (Supabase configured): identity comes from the validated
 * session — `homeId` is the server-derived staff_members.home_id, NEVER a client
 * param. Returns a 401 NextResponse if there is no valid session (fail closed).
 *
 * Demo mode: identity comes from the X-User-Id header convention; `homeId` is
 * null so `assertHomeAccess` is a no-op and the demo's cross-home views work.
 */
export async function getRequestIdentity(
  request: NextRequest
): Promise<RequestIdentity | NextResponse> {
  const { isSupabaseEnabled } = await import("@/lib/supabase/server");

  if (isSupabaseEnabled()) {
    const { resolveStaffSession } = await import("@/lib/supabase/auth");
    let session: Awaited<ReturnType<typeof resolveStaffSession>> | null = null;
    try {
      session = await resolveStaffSession(request);
    } catch {
      session = null;
    }
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized", detail: "A valid authenticated session is required." },
        { status: 401 }
      );
    }
    return { userId: session.userId, role: toAppRole(session.role), homeId: session.homeId };
  }

  // Demo mode: header identity, no tenant scoping.
  return {
    userId: getUserIdFromRequest(request),
    role: getUserRoleFromRequest(request),
    homeId: null,
  };
}

/**
 * Enforce multi-tenant isolation: the caller may only act on a resource that
 * belongs to their own home. Cross-home roles (org director, RI, super admin)
 * are exempt. Returns a 403 NextResponse on violation, or null to proceed.
 *
 * No-op in demo mode (identity.homeId is null) so the in-memory demo is
 * unaffected — tenancy is enforced only once Supabase auth is activated.
 */
export function assertHomeAccess(
  identity: RequestIdentity,
  resourceHomeId: string | null | undefined
): NextResponse | null {
  if (identity.homeId == null) return null; // demo mode — no tenancy
  if (CROSS_HOME_ROLES.has(identity.role)) return null;
  if (resourceHomeId && resourceHomeId !== identity.homeId) {
    return NextResponse.json(
      { error: "Forbidden", detail: "This resource belongs to a different home." },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Tenant-isolation check keyed on a child: the caller may only act on a child who
 * belongs to their own home. Resolves the child's home from the store. No-op in
 * demo mode (identity.homeId null) or when childId is absent (whole-home views).
 *
 * Per-route usage (after resolving identity + childId):
 *   const denied = assertChildHomeAccess(identity, childId);
 *   if (denied) return denied;
 */
export function assertChildHomeAccess(
  identity: RequestIdentity,
  childId: string | null | undefined
): NextResponse | null {
  if (identity.homeId == null || !childId) return null;
  const child = db.youngPeople?.findById?.(childId) as { home_id?: string } | undefined;
  return assertHomeAccess(identity, child?.home_id);
}
