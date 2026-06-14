// ══════════════════════════════════════════════════════════════════════════════
// Cara — UNIVERSAL PERMISSION MODEL
//
// One source of truth for who can do what across every Cara-driven feature.
// Maps onto the spec's Phase 12 role list (RM, RI, deputy, team leader, RSW,
// HR/admin, auditor) with the Cara permission ids the spec calls out.
//
// Server routes must enforce these; UI hiding is not enough.
// ══════════════════════════════════════════════════════════════════════════════

export type CaraRole =
  | "registered_manager"
  | "responsible_individual"
  | "deputy_manager"
  | "team_leader"
  | "residential_support_worker"
  | "hr_admin"
  | "auditor"
  | "viewer"
  | "none";

export type CaraPermission =
  | "cara.use"
  | "cara.dictate"
  | "cara.transcribe"
  | "cara.generate_drafts"
  | "cara.rewrite"
  | "cara.summarise"
  | "cara.analyse_risk"
  | "cara.view_sensitive_context"
  | "cara.create_tasks"
  | "cara.commit_to_records"
  | "cara.approve_outputs"
  | "cara.reject_outputs"
  | "cara.view_audit_logs"
  | "cara.admin_config"
  | "cara.hr"
  | "cara.recruitment"
  | "cara.ri_qa"
  | "cara.ofsted_readiness"
  | "cara.export";

const ALL: CaraPermission[] = [
  "cara.use", "cara.dictate", "cara.transcribe", "cara.generate_drafts",
  "cara.rewrite", "cara.summarise", "cara.analyse_risk",
  "cara.view_sensitive_context", "cara.create_tasks", "cara.commit_to_records",
  "cara.approve_outputs", "cara.reject_outputs", "cara.view_audit_logs",
  "cara.admin_config", "cara.hr", "cara.recruitment", "cara.ri_qa",
  "cara.ofsted_readiness", "cara.export",
];

const ROLE_GRANTS: Record<CaraRole, ReadonlySet<CaraPermission>> = {
  registered_manager: new Set(ALL.filter((p) => p !== "cara.admin_config")),
  responsible_individual: new Set([
    "cara.use",
    "cara.dictate",
    "cara.transcribe",
    "cara.generate_drafts",
    "cara.rewrite",
    "cara.summarise",
    "cara.analyse_risk",
    "cara.view_sensitive_context",
    "cara.approve_outputs",
    "cara.reject_outputs",
    "cara.view_audit_logs",
    "cara.ri_qa",
    "cara.ofsted_readiness",
    "cara.hr",
    "cara.recruitment",
    "cara.export",
  ]),
  deputy_manager: new Set([
    "cara.use",
    "cara.dictate",
    "cara.transcribe",
    "cara.generate_drafts",
    "cara.rewrite",
    "cara.summarise",
    "cara.analyse_risk",
    "cara.view_sensitive_context",
    "cara.create_tasks",
    "cara.commit_to_records",
    "cara.approve_outputs",
    "cara.export",
  ]),
  team_leader: new Set([
    "cara.use",
    "cara.dictate",
    "cara.transcribe",
    "cara.generate_drafts",
    "cara.rewrite",
    "cara.summarise",
    "cara.create_tasks",
  ]),
  residential_support_worker: new Set([
    "cara.use",
    "cara.dictate",
    "cara.transcribe",
    "cara.generate_drafts",
    "cara.rewrite",
    "cara.summarise",
  ]),
  hr_admin: new Set([
    "cara.use",
    "cara.dictate",
    "cara.transcribe",
    "cara.generate_drafts",
    "cara.rewrite",
    "cara.summarise",
    "cara.create_tasks",
    "cara.hr",
    "cara.recruitment",
    "cara.view_audit_logs",
  ]),
  auditor: new Set([
    "cara.use",
    "cara.summarise",
    "cara.view_audit_logs",
    "cara.ri_qa",
    "cara.ofsted_readiness",
    "cara.export",
  ]),
  viewer: new Set(["cara.use"]),
  none: new Set(),
};

export function caraCan(role: CaraRole, permission: CaraPermission): boolean {
  return ROLE_GRANTS[role]?.has(permission) ?? false;
}

export interface CaraActor {
  userId: string;
  role: CaraRole;
  organisationId?: string;
  homeId?: string;
  staffSelfId?: string;
}

export interface CaraAccessRequest {
  permission: CaraPermission;
  organisationId?: string;
  homeId?: string;
  childId?: string;
  staffId?: string;
  isSafeguardingSensitive?: boolean;
}

export interface CaraAccessDecision {
  allowed: boolean;
  reason?: string;
}

/**
 * Application-layer Cara access check. Combines the role grant matrix with
 * per-record scoping (organisation, home, staff-self). Always returns a
 * reason on denial so the audit stream captures it.
 */
export function checkCaraAccess(
  actor: CaraActor,
  request: CaraAccessRequest,
): CaraAccessDecision {
  if (!caraCan(actor.role, request.permission)) {
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
    !caraCan(actor.role, "cara.view_sensitive_context")
  ) {
    return {
      allowed: false,
      reason: "Safeguarding-sensitive context requires cara.view_sensitive_context",
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

export const CARA_ALL_PERMISSIONS: ReadonlyArray<CaraPermission> = ALL;

// ─── Adapter from AppRole to CaraRole ────────────────────────────────────────
// The wider Cara codebase uses an AppRole enum (defined in
// src/lib/permissions.ts) that does not 1:1 match CaraRole. Live forms can
// pass their currentRole straight through this adapter.

export function appRoleToCaraRole(appRole: string | null | undefined): CaraRole {
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
      // Super admin is not granted Cara automatically. Map to registered_manager
      // so they can see Cara features when impersonating; production should
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

