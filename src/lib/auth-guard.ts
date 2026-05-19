// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SERVER-SIDE AUTH GUARD
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
 * When Supabase is configured:
 *   - Validates the JWT from the session cookie via getClaims()
 *   - Resolves the matching staff_members row for role and userId
 *   - Falls back to demo-mode (X-User-Id header) if no valid session found
 *
 * When Supabase is not configured:
 *   - Behaves identically to requirePermission (demo mode)
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
  // Try Supabase session resolution first
  try {
    const { isSupabaseEnabled } = await import("@/lib/supabase/server");
    if (isSupabaseEnabled()) {
      const { resolveStaffSession } = await import("@/lib/supabase/auth");
      const session = await resolveStaffSession(request);
      if (session) {
        const role = toAppRole(session.role);
        if (!hasPermission(role, permission)) {
          return NextResponse.json(
            {
              error: "Forbidden",
              detail: `Role '${role}' does not have permission '${permission}'`,
            },
            { status: 403 }
          );
        }
        return { role, userId: session.userId };
      }
    }
  } catch {
    // If session resolution fails (e.g. missing env vars), fall through to demo
  }

  // Demo / fallback: use X-User-Id header
  return requirePermission(request, permission);
}
