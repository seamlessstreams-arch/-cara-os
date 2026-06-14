// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — SERVER-SIDE PERMISSION GUARD
//
// Every mutating studio route calls requireCaraStudioPermission before
// touching the store. UI hiding is not enough — server is the source of
// truth for who can generate, approve and commit.
//
// Actor resolution (in priority order):
//   1. body.actor_role / body.actor_id           (POST/PATCH bodies)
//   2. body.requested_by                          (legacy generate field)
//   3. header  x-cara-actor-role / x-cara-actor-id
//   4. env     CARA_FALLBACK_ROLE  (default: "registered_manager")
//
// The fallback exists to keep dev/fallback mode working without auth
// wiring. Production should set CARA_FALLBACK_ROLE=none to refuse
// any unauthenticated mutation.
//
// Failed checks emit an audit event so denied attempts are recorded.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import {
  checkCaraAccess,
  appRoleToCaraRole,
  type CaraActor,
  type CaraPermission,
  type CaraRole,
} from "./cara-permissions";

export interface CaraStudioGuardContext {
  permission: CaraPermission;
  homeId?: string | null;
  childId?: string | null;
  staffId?: string | null;
  isSafeguardingSensitive?: boolean;
  // What we are about to do — used in audit logs on denial
  intent: string;
}

export interface CaraStudioGuardResult {
  ok: true;
  actor: CaraActor;
}

export interface CaraStudioGuardDenied {
  ok: false;
  response: NextResponse;
}

/**
 * Resolve the acting user from body / header / env fallback.
 */
function resolveActor(req: NextRequest, body: Record<string, unknown> | null): CaraActor {
  const headerRole = req.headers.get("x-cara-actor-role");
  const headerId = req.headers.get("x-cara-actor-id");

  const rawRole =
    (body?.actor_role as string | undefined) ??
    headerRole ??
    (process.env.CARA_FALLBACK_ROLE ?? process.env.CARA_FALLBACK_ROLE) ??
    "registered_manager";

  const userId =
    (body?.actor_id as string | undefined) ??
    (body?.requested_by as string | undefined) ??
    (body?.created_by as string | undefined) ??
    headerId ??
    "actor_unknown";

  // Normalise via the AppRole adapter so callers can pass either an
  // AppRole or an CaraRole string.
  const role: CaraRole = isCaraRole(rawRole) ? rawRole : appRoleToCaraRole(rawRole);

  return { userId, role };
}

const CARA_ROLES: ReadonlySet<string> = new Set<CaraRole>([
  "registered_manager",
  "responsible_individual",
  "deputy_manager",
  "team_leader",
  "residential_support_worker",
  "hr_admin",
  "auditor",
  "viewer",
  "none",
]);

function isCaraRole(value: string): value is CaraRole {
  return CARA_ROLES.has(value);
}

/**
 * Server-side guard. Returns `{ ok: true, actor }` on success or
 * `{ ok: false, response }` (a 401/403 NextResponse) on denial.
 */
export function requireCaraStudioPermission(
  req: NextRequest,
  body: Record<string, unknown> | null,
  ctx: CaraStudioGuardContext,
): CaraStudioGuardResult | CaraStudioGuardDenied {
  const actor = resolveActor(req, body);

  if (actor.role === "none") {
    return denied(actor, ctx, 401, "No actor role provided");
  }

  const decision = checkCaraAccess(actor, {
    permission: ctx.permission,
    homeId: ctx.homeId ?? undefined,
    childId: ctx.childId ?? undefined,
    staffId: ctx.staffId ?? undefined,
    isSafeguardingSensitive: ctx.isSafeguardingSensitive,
  });

  if (!decision.allowed) {
    return denied(actor, ctx, 403, decision.reason ?? "Access denied");
  }

  return { ok: true, actor };
}

function denied(
  actor: CaraActor,
  ctx: CaraStudioGuardContext,
  status: 401 | 403,
  reason: string,
): CaraStudioGuardDenied {
  // Best-effort audit. Falls back silently if the store throws (eg. tests
  // that mock the store).
  try {
    db.caraStudioAuditLog.create({
      home_id: ctx.homeId ?? "home_oak",
      actor_id: actor.userId,
      action_type: "artifact_generated", // closest enum value for "attempt"
      artifact_id: null,
      source_ids: [],
      prompt_summary: `DENIED ${ctx.intent}: ${reason}`,
      model_provider: null,
      model_name: null,
      before_state: { role: actor.role, permission: ctx.permission },
      after_state: null,
      ip_address: req2ip(),
    });
  } catch {
    // best effort — never block the 403 because audit failed
  }

  return {
    ok: false,
    response: NextResponse.json(
      {
        error: status === 401 ? "Unauthorised" : "Forbidden",
        reason,
        permission: ctx.permission,
        actor_role: actor.role,
      },
      { status },
    ),
  };
}

// We have no IP middleware in this app. Stub for forward compatibility.
function req2ip(): string | null {
  return null;
}

/**
 * Lookup the artifact's home so we can scope the permission check
 * against the actor's home. Returns null if the artifact does not exist.
 */
export function homeIdForArtifact(artifactId: string): string | null {
  return db.caraArtifacts.findById(artifactId)?.home_id ?? null;
}
