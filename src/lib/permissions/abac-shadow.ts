// ══════════════════════════════════════════════════════════════════════════════
// CARA — ABAC ENGINE WIRING (advisory / shadow — Phase 1 · Module 5)
//
// The rich ABAC decision engine (access-decision-service.ts — home-match,
// key-worker, shift, sensitivity ceilings, need-to-know, break-glass, temporary
// grants, delegation, self-approval blocks, AUDIT-ON-VIEW) had ZERO callers: it
// was fully built but dead. This gives it its FIRST real callers, via the
// sensitive-record guard, in ADVISORY mode:
//
//   • It computes the ABAC decision for the confidential resource and activates
//     its regulatory audit-on-view (the "who viewed this confidential record"
//     trail — Ofsted ILACS / insider-threat).
//   • It is ADVISORY: the flat requirePermission check remains the enforced gate.
//     The ABAC decision is returned for logging + divergence telemetry, so a
//     future module can flip to enforcing once validated with real per-request
//     context (shift, key-worker assignment, employment status).
//
// PURE decision (no DB) → safe to call in demo. Building the full UserContext
// needs per-request signals the identity layer doesn't yet produce (shift,
// key-worker links, employment status), so we use safe defaults here; wiring
// those is the enforcing follow-up.
// ══════════════════════════════════════════════════════════════════════════════

import { checkAccess } from "./access-decision-service";
import type { Action, ResourceType, Sensitivity, UserContext } from "./types";
import { toAbacRole } from "./role-reconciliation";
import { buildUserContext } from "./build-user-context";
import type { AppRole } from "@/lib/permissions";

/** Confidential entityType (from the sensitive-record guard) → ABAC ResourceType. */
const ENTITY_TO_RESOURCE: Record<string, ResourceType> = {
  allegation: "hr_file",
  whistleblowing: "hr_file",
  whistleblowing_investigation: "hr_file",
  staff_disciplinary: "hr_file",
  staff_grievance: "hr_file",
  staff_sickness: "hr_file",
  staff_exit_interview: "hr_file",
  staff_payroll: "hr_file",
  complaint_investigation: "complaint",
};

export function entityToResourceType(entityType: string): ResourceType {
  return ENTITY_TO_RESOURCE[entityType] ?? "hr_file";
}

/** Fallback for an actor with no staff record (system/platform ids). Permissive
 *  by design: the ADVISORY check must never denounce a caller we can't describe.
 *  Real staff get the REAL context from buildUserContext — see resolveContext. */
function minimalContext(userId: string, appRole: AppRole, homeId?: string | null): UserContext {
  return {
    userId,
    role: toAbacRole(appRole),
    organisationId: "org",
    homeIds: homeId ? [homeId] : [],
    assignedChildIds: [],
    assignedStaffIds: [],
    employmentStatus: "active",
    shiftActive: true,
    isAgencyStaff: false,
    isSuspended: false,
    isLeaver: false,
    isUnderInvestigation: false,
    delegatedScopes: [],
    temporaryGrants: [],
    safeguardingNeedToKnow: [],
  };
}

/** The real context for a staff member; the permissive fallback otherwise.
 *  Never throws — the shadow is advisory and must not affect the route. */
function resolveContext(userId: string, appRole: AppRole, homeId?: string | null): {
  ctx: UserContext;
  real: boolean;
} {
  try {
    const real = buildUserContext(userId);
    if (real) return { ctx: real, real: true };
  } catch {
    // Store unavailable — fall through to the permissive fallback.
  }
  return { ctx: minimalContext(userId, appRole, homeId), real: false };
}

export interface SensitiveAbacResult {
  allowed: boolean;
  auditEventRequired: boolean;
  reason: string;
  grantSource?: string;
  /** True when the decision used the staff member's REAL attributes (shift,
   *  employment, key-worker) rather than the unknown-actor fallback. Only a
   *  real-context decision is evidence for the enforcing flip. */
  contextReal: boolean;
}

/**
 * Run the ABAC engine for a confidential resource access (ADVISORY). Pure; never
 * throws in normal use, but callers should still treat it as best-effort.
 */
export function evaluateSensitiveAbac(args: {
  userId: string;
  appRole: AppRole;
  entityType: string;
  action: Action;
  homeId?: string | null;
  sensitivity?: Sensitivity;
}): SensitiveAbacResult {
  const { ctx, real } = resolveContext(args.userId, args.appRole, args.homeId);
  const decision = checkAccess({
    user: ctx,
    resourceType: entityToResourceType(args.entityType),
    action: args.action,
    resourceHomeId: args.homeId ?? undefined,
    resourceSensitivity: args.sensitivity ?? "confidential",
  });
  return {
    allowed: decision.allowed,
    auditEventRequired: decision.auditEventRequired,
    reason: decision.reason,
    grantSource: decision.grantSource,
    contextReal: real,
  };
}
