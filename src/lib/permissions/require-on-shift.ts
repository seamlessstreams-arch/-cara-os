// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Permissions — requireOnShift (shift gate for existing-guarded routes)
//
// Many operational routes already enforce ROLE permissions via the auth-guard
// (`requirePermission(req, PERMISSIONS.X)`). They don't enforce SHIFT, though.
// `requireOnShift` is the surgical complement: drop it in AFTER `requirePermission`
// to add the shift dimension WITHOUT touching the route's existing role check (so it
// can never regress role-based access). It only blocks off-shift general staff.
//
//   const auth = requirePermission(req, PERMISSIONS.VIEW_INCIDENTS);
//   if (auth instanceof NextResponse) return auth;
//   const shift = requireOnShift(req);
//   if (shift) return shift;
//
// Returns a 403 only when: enforcement is on, the role is shift-gated (general care
// staff), and they are NOT currently clocked in. Managers/senior leaders and on-shift
// staff always proceed. Gated by SHIFT_BASED_ACCESS_ENFORCED (kill-switch).
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { isStaffOnShift } from "@/lib/attendance/sign-in-service";
import { toPermissionRole, keepsOffShiftAccess, isShiftEnforcementEnabled } from "./shift-enforcement";

const DEFAULT_USER_ID = "staff_darren";

/** 403 NextResponse if the acting user is off-shift general staff; otherwise null. */
export function requireOnShift(request: Request): NextResponse | null {
  if (!isShiftEnforcementEnabled()) return null;
  const userId = request.headers.get("x-user-id") ?? DEFAULT_USER_ID;
  const staff = (db.staff?.findById?.(userId) as { role?: string } | undefined) ?? undefined;
  const role = toPermissionRole(staff?.role);
  if (keepsOffShiftAccess(role)) return null; // managers / senior leaders / admin
  if (isStaffOnShift(userId)) return null;     // on shift
  return NextResponse.json(
    {
      error: "Access denied",
      reason: "Action requires active shift.",
      userExplanation: "You can only access this while on shift. Clock in to restore access.",
    },
    { status: 403 },
  );
}
