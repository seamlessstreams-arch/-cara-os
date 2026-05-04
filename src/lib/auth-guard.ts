// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SERVER-SIDE AUTH GUARD
// Used inside API route handlers to enforce permission checks.
// In production, replace getUserRoleFromRequest with a real session lookup
// (e.g. NextAuth getServerSession, Clerk auth(), or JWT verification).
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
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
