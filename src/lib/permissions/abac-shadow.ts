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

/** A minimal, safe UserContext for an authenticated caller. Per-request signals
 *  the identity layer doesn't yet produce default to the permissive-but-safe
 *  value (active employment, on shift, no restrictions) so the ADVISORY check
 *  never denies a legitimately-permitted caller. */
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

export interface SensitiveAbacResult {
  allowed: boolean;
  auditEventRequired: boolean;
  reason: string;
  grantSource?: string;
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
  const decision = checkAccess({
    user: minimalContext(args.userId, args.appRole, args.homeId),
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
  };
}
