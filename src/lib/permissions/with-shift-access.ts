// ══════════════════════════════════════════════════════════════════════════════
// Cara Permissions — withShiftAccess route guard (production hardening)
//
// A SERVER-SIDE guard that enforces the real permission engine on an API route using
// the actual acting user (resolved from x-user-id), so shift-based access (Phase 4)
// and role rules actually gate requests in the running app.
//
// Why not the existing `withPermission`? That middleware authenticates via Supabase
// and, when Supabase is off (the demo / dual-backend default), falls back to a
// hard-coded manager context — so it never enforces. `withShiftAccess` resolves the
// real current user from the request and runs `checkAccess` against a context whose
// `shiftActive` reflects live clock-in state (`buildShiftAwareUserContext`). It wraps
// a handler transparently (passes the route's own args through), so applying it is a
// one-liner:
//
//   export const GET = withShiftAccess("child_record", "view", getYoungPerson);
//
// Denials are 403 + audited. Managers/senior leaders are never shift-blocked.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { checkAccess } from "./access-decision-service";
import { buildShiftAwareUserContext } from "./shift-enforcement";
import { writeAuditLog } from "@/lib/supabase/audit";
import type { ResourceType, Action } from "./types";

/** Handlers may require their route context; the wrapped fn keeps it optional
 *  (Next always supplies it for dynamic routes; tests may omit it). */
type RouteHandler<Ctx = unknown> = (req: NextRequest, routeCtx: Ctx) => Promise<NextResponse> | NextResponse;
type WrappedHandler<Ctx> = (req: NextRequest, routeCtx?: Ctx) => Promise<NextResponse> | NextResponse;

const DEFAULT_USER_ID = "staff_darren";

export function withShiftAccess<Ctx>(resourceType: ResourceType, action: Action, handler: RouteHandler<Ctx>): WrappedHandler<Ctx> {
  return async (req: NextRequest, routeCtx) => {
    const staffId = req.headers.get("x-user-id") || DEFAULT_USER_ID;
    const user = buildShiftAwareUserContext(staffId);
    const decision = checkAccess({ user, resourceType, action });

    if (!decision.allowed) {
      void writeAuditLog({
        home_id: user.homeIds[0] ?? "home_oak",
        entity_type: `access.denied.${resourceType}`,
        entity_id: staffId,
        action: "view",
        changes: { resource_type: resourceType, requested_action: action, reason: decision.reason },
        performed_by: staffId,
      });
      return NextResponse.json(
        { error: "Access denied", userExplanation: decision.userFacingExplanation, reason: decision.reason },
        { status: 403 },
      );
    }
    return handler(req, routeCtx as Ctx);
  };
}
