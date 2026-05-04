// ══════════════════════════════════════════════════════════════════════════════
// ARIA — UNIVERSAL PERMISSION MODEL
//
// One source of truth for who can do what across every Aria-driven feature.
// Maps onto the spec's Phase 12 role list (RM, RI, deputy, team leader, RSW,
// HR/admin, auditor) with the Aria permission ids the spec calls out.
//
// Server routes must enforce these; UI hiding is not enough.
// ══════════════════════════════════════════════════════════════════════════════

export type AriaRole =
  | "registered_manager"
  | "responsible_individual"
  | "deputy_manager"
  | "team_leader"
  | "residential_support_worker"
  | "hr_admin"
  | "auditor"
  | "viewer"
  | "none";

export type AriaPermission =
  | "aria.use"
  | "aria.dictate"
  | "aria.transcribe"
  | "aria.generate_drafts"
  | "aria.rewrite"
  | "aria.summarise"
  | "aria.analyse_risk"
  | "aria.view_sensitive_context"
  | "aria.create_tasks"
  | "aria.commit_to_records"
  | "aria.approve_outputs"
  | "aria.reject_outputs"
  | "aria.view_audit_logs"
  | "aria.admin_config"
  | "aria.hr"
  | "aria.recruitment"
  | "aria.ri_qa"
  | "aria.ofsted_readiness";

const ALL: AriaPermission[] = [
  "aria.use", "aria.dictate", "aria.transcribe", "aria.generate_drafts",
  "aria.rewrite", "aria.summarise", "aria.analyse_risk",
  "aria.view_sensitive_context", "aria.create_tasks", "aria.commit_to_records",
  "aria.approve_outputs", "aria.reject_outputs", "aria.view_audit_logs",
  "aria.admin_config", "aria.hr", "aria.recruitment", "aria.ri_qa",
  "aria.ofsted_readiness",
];

const ROLE_GRANTS: Record<AriaRole, ReadonlySet<AriaPermission>> = {
  registered_manager: new Set(ALL.filter((p) => p !== "aria.admin_config")),
  responsible_individual: new Set([
    "aria.use",
    "aria.dictate",
    "aria.transcribe",
    "aria.generate_drafts",
    "aria.rewrite",
    "aria.summarise",
    "aria.analyse_risk",
    "aria.view_sensitive_context",
    "aria.approve_outputs",
    "aria.reject_outputs",
    "aria.view_audit_logs",
    "aria.ri_qa",
    "aria.ofsted_readiness",
    "aria.hr",
    "aria.recruitment",
  ]),
  deputy_manager: new Set([
    "aria.use",
    "aria.dictate",
    "aria.transcribe",
    "aria.generate_drafts",
    "aria.rewrite",
    "aria.summarise",
    "aria.analyse_risk",
    "aria.view_sensitive_context",
    "aria.create_tasks",
    "aria.commit_to_records",
    "aria.approve_outputs",
  ]),
  team_leader: new Set([
    "aria.use",
    "aria.dictate",
    "aria.transcribe",
    "aria.generate_drafts",
    "aria.rewrite",
    "aria.summarise",
    "aria.create_tasks",
  ]),
  residential_support_worker: new Set([
    "aria.use",
    "aria.dictate",
    "aria.transcribe",
    "aria.generate_drafts",
    "aria.rewrite",
    "aria.summarise",
  ]),
  hr_admin: new Set([
    "aria.use",
    "aria.dictate",
    "aria.transcribe",
    "aria.generate_drafts",
    "aria.rewrite",
    "aria.summarise",
    "aria.create_tasks",
    "aria.hr",
    "aria.recruitment",
    "aria.view_audit_logs",
  ]),
  auditor: new Set([
    "aria.use",
    "aria.summarise",
    "aria.view_audit_logs",
    "aria.ri_qa",
    "aria.ofsted_readiness",
  ]),
  viewer: new Set(["aria.use"]),
  none: new Set(),
};

export function ariaCan(role: AriaRole, permission: AriaPermission): boolean {
  return ROLE_GRANTS[role]?.has(permission) ?? false;
}

export interface AriaActor {
  userId: string;
  role: AriaRole;
  organisationId?: string;
  homeId?: string;
  staffSelfId?: string;
}

export interface AriaAccessRequest {
  permission: AriaPermission;
  organisationId?: string;
  homeId?: string;
  childId?: string;
  staffId?: string;
  isSafeguardingSensitive?: boolean;
}

export interface AriaAccessDecision {
  allowed: boolean;
  reason?: string;
}

/**
 * Application-layer Aria access check. Combines the role grant matrix with
 * per-record scoping (organisation, home, staff-self). Always returns a
 * reason on denial so the audit stream captures it.
 */
export function checkAriaAccess(
  actor: AriaActor,
  request: AriaAccessRequest,
): AriaAccessDecision {
  if (!ariaCan(actor.role, request.permission)) {
    return {
      allowed: false,
      reason: `Role ${actor.role} does not grant ${request.permission}`,
    };
  }

  if (
    actor.organisationId &&
    request.organisationId &&
    actor.organisationId !== request.organisationId &&
    actor.role !== "responsible_individual"
  ) {
    return {
      allowed: false,
      reason: "Actor organisation does not match record organisation",
    };
  }

  if (
    actor.homeId &&
    request.homeId &&
    actor.homeId !== request.homeId &&
    actor.role !== "responsible_individual" &&
    actor.role !== "hr_admin"
  ) {
    return {
      allowed: false,
      reason: "Actor home does not match record home",
    };
  }

  if (
    request.isSafeguardingSensitive &&
    !ariaCan(actor.role, "aria.view_sensitive_context")
  ) {
    return {
      allowed: false,
      reason: "Safeguarding-sensitive context requires aria.view_sensitive_context",
    };
  }

  if (actor.role === "residential_support_worker") {
    if (
      request.staffId &&
      actor.staffSelfId &&
      request.staffId !== actor.staffSelfId
    ) {
      return {
        allowed: false,
        reason: "Residential support workers may only view their own HR-flavoured records",
      };
    }
  }

  return { allowed: true };
}

export const ARIA_ALL_PERMISSIONS: ReadonlyArray<AriaPermission> = ALL;

// ─── Adapter from AppRole to AriaRole ────────────────────────────────────────
// The wider Cornerstone codebase uses an AppRole enum (defined in
// src/lib/permissions.ts) that does not 1:1 match AriaRole. Live forms can
// pass their currentRole straight through this adapter.

export function appRoleToAriaRole(appRole: string | null | undefined): AriaRole {
  switch (appRole) {
    case "registered_manager":
    case "admin": // legacy alias treated as registered_manager
      return "registered_manager";
    case "responsible_individual":
      return "responsible_individual";
    case "deputy_manager":
      return "deputy_manager";
    case "team_leader":
      return "team_leader";
    case "residential_care_worker":
    case "bank_staff":
      return "residential_support_worker";
    case "hr_recruitment":
      return "hr_admin";
    case "auditor":
      return "auditor";
    case "super_admin":
      // Super admin is not granted Aria automatically. Map to registered_manager
      // so they can see Aria features when impersonating; production should
      // prefer mapping super_admin to a more specific role.
      return "registered_manager";
    case "therapist":
    case "finance_operations":
    case "external_partner":
      return "viewer";
    default:
      return "none";
  }
}

