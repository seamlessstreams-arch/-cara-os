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
