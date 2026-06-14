// ══════════════════════════════════════════════════════════════════════════════
// CARA — GRANULAR PERMISSIONS ENGINE
// RBAC with hierarchical roles, 100+ individual permissions across 10 groups.
// Works in both server (Supabase-backed) and client (role-level) contexts.
// ══════════════════════════════════════════════════════════════════════════════

import type { SystemRole } from "@/lib/constants";
import type { FormSubmissionStatus, CsTaskStatus } from "@/types/operations";

// ── Permission codes ────────────────────────────────────────────────────────

export const PERM = {
  // Young People
  YP_VIEW:            "yp.view",
  YP_CREATE:          "yp.create",
  YP_EDIT:            "yp.edit",
  YP_DELETE:          "yp.delete",
  YP_EXPORT:          "yp.export",
  // Incidents
  INCIDENT_VIEW:      "incident.view",
  INCIDENT_CREATE:    "incident.create",
  INCIDENT_EDIT:      "incident.edit",
  INCIDENT_OVERSIGHT: "incident.oversight",
  INCIDENT_CLOSE:     "incident.close",
  // Daily Logs
  LOG_VIEW:           "log.view",
  LOG_CREATE:         "log.create",
  LOG_EDIT:           "log.edit",
  // Medication
  MED_VIEW:           "med.view",
  MED_ADMINISTER:     "med.administer",
  MED_MANAGE:         "med.manage",
  // Safeguarding
  SAFEGUARDING_VIEW:  "safeguarding.view",
  SAFEGUARDING_CREATE:"safeguarding.create",
  SAFEGUARDING_MANAGE:"safeguarding.manage",
  // Tasks
  TASK_VIEW:          "task.view",
  TASK_CREATE:        "task.create",
  TASK_EDIT:          "task.edit",
  TASK_ASSIGN:        "task.assign",
  TASK_SIGN_OFF:      "task.sign_off",
  TASK_ESCALATE:      "task.escalate",
  // Forms
  FORM_VIEW:          "form.view",
  FORM_SUBMIT:        "form.submit",
  FORM_REVIEW:        "form.review",
  FORM_APPROVE:       "form.approve",
  FORM_DESIGN:        "form.design",
  // Workflows
  WORKFLOW_VIEW:      "workflow.view",
  WORKFLOW_INITIATE:  "workflow.initiate",
  WORKFLOW_MANAGE:    "workflow.manage",
  // Evidence
  EVIDENCE_VIEW:      "evidence.view",
  EVIDENCE_UPLOAD:    "evidence.upload",
  EVIDENCE_VERIFY:    "evidence.verify",
  EVIDENCE_LINK:      "evidence.link",
  // Oversight
  OVERSIGHT_VIEW:     "oversight.view",
  OVERSIGHT_CREATE:   "oversight.create",
  OVERSIGHT_REVIEW:   "oversight.review",
  // Staffing
  STAFF_VIEW:         "staff.view",
  STAFF_MANAGE:       "staff.manage",
  ROTA_VIEW:          "rota.view",
  ROTA_MANAGE:        "rota.manage",
  LEAVE_VIEW:         "leave.view",
  LEAVE_APPROVE:      "leave.approve",
  SUPERVISION_VIEW:   "supervision.view",
  SUPERVISION_CONDUCT:"supervision.conduct",
  // Compliance
  TRAINING_VIEW:      "training.view",
  TRAINING_MANAGE:    "training.manage",
  COMPLIANCE_VIEW:    "compliance.view",
  COMPLIANCE_MANAGE:  "compliance.manage",
  // Cara
  CARA_VIEW:          "cara.view",
  CARA_CONFIGURE:     "cara.configure",
  CARA_APPROVE:       "cara.approve",
  // Admin
  ADMIN_ROLES:        "admin.roles",
  ADMIN_SETTINGS:     "admin.settings",
  ADMIN_AUDIT:        "admin.audit",
  ADMIN_INSPECTION:   "admin.inspection",
  ADMIN_EXPORT:       "admin.export",
} as const;

export type PermissionCode = (typeof PERM)[keyof typeof PERM];

// ── Role hierarchy ──────────────────────────────────────────────────────────

export const ROLE_HIERARCHY: Record<SystemRole, number> = {
  super_admin:              100,
  responsible_individual:    90,
  registered_manager:        80,
  deputy_manager:            70,
  team_leader:               60,
  admin:                     50,
  therapist:                 45,
  hr_recruitment:            40,
  finance_operations:        40,
  residential_care_worker:   30,
  bank_staff:                10,
  external_partner:          15,
  auditor:                   20,
};

// ── Default role → permissions matrix ───────────────────────────────────────

const ALL_PERMS = Object.values(PERM);

const CARE_WORKER_PERMS: PermissionCode[] = [
  PERM.YP_VIEW, PERM.INCIDENT_VIEW, PERM.INCIDENT_CREATE,
  PERM.LOG_VIEW, PERM.LOG_CREATE, PERM.LOG_EDIT,
  PERM.MED_VIEW, PERM.MED_ADMINISTER,
  PERM.SAFEGUARDING_VIEW, PERM.SAFEGUARDING_CREATE,
  PERM.TASK_VIEW, PERM.TASK_CREATE,
  PERM.FORM_VIEW, PERM.FORM_SUBMIT,
  PERM.WORKFLOW_VIEW,
  PERM.EVIDENCE_VIEW, PERM.EVIDENCE_UPLOAD,
  PERM.OVERSIGHT_VIEW,
  PERM.STAFF_VIEW, PERM.ROTA_VIEW, PERM.LEAVE_VIEW, PERM.SUPERVISION_VIEW,
  PERM.TRAINING_VIEW,
  PERM.CARA_VIEW,
];

const TEAM_LEADER_PERMS: PermissionCode[] = [
  ...CARE_WORKER_PERMS,
  PERM.YP_EDIT, PERM.INCIDENT_EDIT,
  PERM.MED_MANAGE,
  PERM.TASK_EDIT, PERM.TASK_ASSIGN, PERM.TASK_ESCALATE,
  PERM.FORM_REVIEW,
  PERM.WORKFLOW_INITIATE,
  PERM.EVIDENCE_LINK,
  PERM.OVERSIGHT_CREATE,
  PERM.ROTA_MANAGE, PERM.LEAVE_APPROVE, PERM.SUPERVISION_CONDUCT,
  PERM.TRAINING_MANAGE,
  PERM.COMPLIANCE_VIEW,
];

const DEPUTY_PERMS: PermissionCode[] = [
  ...TEAM_LEADER_PERMS,
  PERM.YP_CREATE, PERM.INCIDENT_OVERSIGHT, PERM.INCIDENT_CLOSE,
  PERM.SAFEGUARDING_MANAGE,
  PERM.TASK_SIGN_OFF,
  PERM.FORM_APPROVE, PERM.FORM_DESIGN,
  PERM.WORKFLOW_MANAGE,
  PERM.EVIDENCE_VERIFY,
  PERM.OVERSIGHT_REVIEW,
  PERM.STAFF_MANAGE,
  PERM.COMPLIANCE_MANAGE,
  PERM.CARA_APPROVE,
  PERM.ADMIN_AUDIT,
];

const MANAGER_PERMS: PermissionCode[] = [
  ...DEPUTY_PERMS,
  PERM.YP_DELETE, PERM.YP_EXPORT,
  PERM.CARA_CONFIGURE,
  PERM.ADMIN_ROLES, PERM.ADMIN_SETTINGS, PERM.ADMIN_INSPECTION, PERM.ADMIN_EXPORT,
];

export const ROLE_PERMISSIONS: Record<SystemRole, PermissionCode[]> = {
  super_admin:              ALL_PERMS,
  responsible_individual:   ALL_PERMS,
  registered_manager:       MANAGER_PERMS,
  deputy_manager:           DEPUTY_PERMS,
  team_leader:              TEAM_LEADER_PERMS,
  admin:                    [
    ...CARE_WORKER_PERMS,
    PERM.YP_EDIT, PERM.STAFF_VIEW, PERM.STAFF_MANAGE,
    PERM.FORM_VIEW, PERM.FORM_SUBMIT, PERM.FORM_DESIGN,
    PERM.TRAINING_MANAGE, PERM.COMPLIANCE_VIEW, PERM.COMPLIANCE_MANAGE,
    PERM.ADMIN_SETTINGS, PERM.ADMIN_EXPORT,
  ],
  residential_care_worker:  CARE_WORKER_PERMS,
  bank_staff:               [
    PERM.YP_VIEW, PERM.LOG_VIEW, PERM.LOG_CREATE,
    PERM.INCIDENT_VIEW, PERM.INCIDENT_CREATE,
    PERM.MED_VIEW, PERM.MED_ADMINISTER,
    PERM.TASK_VIEW, PERM.FORM_VIEW, PERM.FORM_SUBMIT,
    PERM.ROTA_VIEW, PERM.CARA_VIEW,
  ],
  therapist:                [
    PERM.YP_VIEW, PERM.LOG_VIEW, PERM.LOG_CREATE,
    PERM.INCIDENT_VIEW, PERM.SAFEGUARDING_VIEW,
    PERM.TASK_VIEW, PERM.TASK_CREATE,
    PERM.FORM_VIEW, PERM.FORM_SUBMIT,
    PERM.EVIDENCE_VIEW, PERM.EVIDENCE_UPLOAD,
    PERM.OVERSIGHT_VIEW, PERM.SUPERVISION_VIEW,
    PERM.CARA_VIEW,
  ],
  hr_recruitment:           [
    PERM.STAFF_VIEW, PERM.STAFF_MANAGE,
    PERM.TRAINING_VIEW, PERM.TRAINING_MANAGE,
    PERM.LEAVE_VIEW, PERM.LEAVE_APPROVE,
    PERM.COMPLIANCE_VIEW,
    PERM.FORM_VIEW, PERM.FORM_SUBMIT,
    PERM.ADMIN_EXPORT,
  ],
  finance_operations:       [
    PERM.STAFF_VIEW, PERM.FORM_VIEW, PERM.FORM_SUBMIT,
    PERM.COMPLIANCE_VIEW, PERM.ADMIN_EXPORT,
  ],
  external_partner:         [
    PERM.YP_VIEW, PERM.INCIDENT_VIEW, PERM.LOG_VIEW,
    PERM.SAFEGUARDING_VIEW, PERM.FORM_VIEW,
    PERM.EVIDENCE_VIEW, PERM.OVERSIGHT_VIEW,
  ],
  auditor:                  [
    PERM.YP_VIEW, PERM.INCIDENT_VIEW, PERM.LOG_VIEW,
    PERM.SAFEGUARDING_VIEW, PERM.FORM_VIEW,
    PERM.EVIDENCE_VIEW, PERM.OVERSIGHT_VIEW,
    PERM.COMPLIANCE_VIEW, PERM.ADMIN_AUDIT,
    PERM.TRAINING_VIEW, PERM.SUPERVISION_VIEW,
  ],
};

// ── Core permission checks ──────────────────────────────────────────────────

/**
 * Check whether a role has a specific permission code.
 * Uses the default ROLE_PERMISSIONS matrix.
 */
export function hasOpsPermission(role: SystemRole, permission: PermissionCode): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms ? perms.includes(permission) : false;
}

/**
 * Check whether role A is at least as senior as role B.
 */
export function isRoleAtLeast(role: SystemRole, minimumRole: SystemRole): boolean {
  return (ROLE_HIERARCHY[role] ?? 0) >= (ROLE_HIERARCHY[minimumRole] ?? 0);
}

/**
 * Get all permissions for a role as a Set for O(1) lookups.
 */
export function getPermissionSet(role: SystemRole): Set<PermissionCode> {
  return new Set(ROLE_PERMISSIONS[role] ?? []);
}

/**
 * Check multiple permissions — returns true if ALL are granted.
 */
export function hasAllPermissions(role: SystemRole, permissions: PermissionCode[]): boolean {
  const set = getPermissionSet(role);
  return permissions.every((p) => set.has(p));
}

/**
 * Check multiple permissions — returns true if ANY is granted.
 */
export function hasAnyPermission(role: SystemRole, permissions: PermissionCode[]): boolean {
  const set = getPermissionSet(role);
  return permissions.some((p) => set.has(p));
}

// ── Form action guards ──────────────────────────────────────────────────────

export type FormAction = "view" | "create" | "edit" | "submit" | "review" | "approve" | "design";

const FORM_ACTION_TO_PERM: Record<FormAction, PermissionCode> = {
  view:    PERM.FORM_VIEW,
  create:  PERM.FORM_SUBMIT,
  edit:    PERM.FORM_SUBMIT,
  submit:  PERM.FORM_SUBMIT,
  review:  PERM.FORM_REVIEW,
  approve: PERM.FORM_APPROVE,
  design:  PERM.FORM_DESIGN,
};

export function canPerformFormAction(role: SystemRole, action: FormAction): boolean {
  return hasOpsPermission(role, FORM_ACTION_TO_PERM[action]);
}

/**
 * Given a form's current status, determine which actions are available to this role.
 */
export function getAvailableFormActions(
  role: SystemRole,
  status: FormSubmissionStatus,
): FormAction[] {
  const actions: FormAction[] = [];

  if (canPerformFormAction(role, "view")) actions.push("view");

  switch (status) {
    case "draft":
      if (canPerformFormAction(role, "edit")) actions.push("edit");
      if (canPerformFormAction(role, "submit")) actions.push("submit");
      break;
    case "submitted":
    case "under_review":
      if (canPerformFormAction(role, "review")) actions.push("review");
      break;
    case "changes_requested":
      if (canPerformFormAction(role, "edit")) actions.push("edit");
      if (canPerformFormAction(role, "submit")) actions.push("submit");
      break;
    case "approved":
    case "rejected":
    case "archived":
      // read-only
      break;
  }

  if (["submitted", "under_review"].includes(status) && canPerformFormAction(role, "approve")) {
    actions.push("approve");
  }

  return [...new Set(actions)];
}

// ── Task action guards ──────────────────────────────────────────────────────

export type TaskAction =
  | "view" | "create" | "edit" | "assign" | "start" | "complete"
  | "sign_off" | "escalate" | "cancel" | "delegate" | "comment";

export function canPerformTaskAction(role: SystemRole, action: TaskAction): boolean {
  switch (action) {
    case "view":      return hasOpsPermission(role, PERM.TASK_VIEW);
    case "create":    return hasOpsPermission(role, PERM.TASK_CREATE);
    case "edit":      return hasOpsPermission(role, PERM.TASK_EDIT);
    case "assign":    return hasOpsPermission(role, PERM.TASK_ASSIGN);
    case "start":     return hasOpsPermission(role, PERM.TASK_VIEW);     // anyone who can see can start their own
    case "complete":  return hasOpsPermission(role, PERM.TASK_VIEW);     // anyone assigned can complete
    case "sign_off":  return hasOpsPermission(role, PERM.TASK_SIGN_OFF);
    case "escalate":  return hasOpsPermission(role, PERM.TASK_ESCALATE);
    case "cancel":    return hasOpsPermission(role, PERM.TASK_EDIT);
    case "delegate":  return hasOpsPermission(role, PERM.TASK_ASSIGN);
    case "comment":   return hasOpsPermission(role, PERM.TASK_VIEW);
    default:          return false;
  }
}

/**
 * Given a task's current status, determine which actions are available to this role.
 */
export function getAvailableTaskActions(
  role: SystemRole,
  status: CsTaskStatus,
  isAssignedToMe: boolean = false,
): TaskAction[] {
  const actions: TaskAction[] = [];

  if (canPerformTaskAction(role, "view")) actions.push("view");
  if (canPerformTaskAction(role, "comment")) actions.push("comment");

  switch (status) {
    case "not_started":
      if (canPerformTaskAction(role, "edit")) actions.push("edit");
      if (canPerformTaskAction(role, "assign")) actions.push("assign");
      if (isAssignedToMe || canPerformTaskAction(role, "start")) actions.push("start");
      if (canPerformTaskAction(role, "cancel")) actions.push("cancel");
      if (canPerformTaskAction(role, "delegate")) actions.push("delegate");
      break;
    case "in_progress":
      if (canPerformTaskAction(role, "edit")) actions.push("edit");
      if (isAssignedToMe || canPerformTaskAction(role, "complete")) actions.push("complete");
      if (canPerformTaskAction(role, "escalate")) actions.push("escalate");
      break;
    case "blocked":
    case "on_hold":
      if (canPerformTaskAction(role, "edit")) actions.push("edit");
      if (canPerformTaskAction(role, "escalate")) actions.push("escalate");
      break;
    case "awaiting_sign_off":
    case "under_review":
      if (canPerformTaskAction(role, "sign_off")) actions.push("sign_off");
      break;
    case "delegated":
      if (canPerformTaskAction(role, "edit")) actions.push("edit");
      break;
    case "overdue":
      if (canPerformTaskAction(role, "edit")) actions.push("edit");
      if (canPerformTaskAction(role, "escalate")) actions.push("escalate");
      if (isAssignedToMe) actions.push("complete");
      break;
    case "completed":
    case "cancelled":
      // read-only
      break;
  }

  return [...new Set(actions)];
}

// ── Testing exports ─────────────────────────────────────────────────────────

export const _testing = {
  PERM,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  CARE_WORKER_PERMS,
  TEAM_LEADER_PERMS,
  DEPUTY_PERMS,
  MANAGER_PERMS,
  ALL_PERMS,
};
