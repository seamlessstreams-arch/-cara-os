// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Permission System — Role-Based Rules Matrix
//
// Defines the baseline permission rules per role. These are the starting
// point; ABAC attributes (assignment, shift, home, delegation) refine
// the final access decision.
// ══════════════════════════════════════════════════════════════════════════════

import type { PermissionRule, Role, ApprovalLevel } from "./types";

// ── Role Hierarchy (for "at least" checks) ─────────────────────────────────

export const ROLE_HIERARCHY: Record<Role, number> = {
  super_admin: 100,
  provider_owner: 95,
  responsible_individual: 90,
  operations_manager: 85,
  registered_manager: 80,
  deputy_manager: 70,
  team_leader: 60,
  senior_rsw: 50,
  rsw: 40,
  waking_night: 35,
  agency_staff: 30,
  hr_admin: 55,
  finance_admin: 55,
  reg44_visitor: 20,
  external_auditor: 20,
  ofsted_readonly_export: 15,
};

/**
 * Returns true if roleA is at or above roleB in the hierarchy.
 */
export function isAtLeast(roleA: Role, roleB: Role): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}

// ── Maximum Approval Level by Role ─────────────────────────────────────────

export const MAX_APPROVAL_LEVEL: Record<Role, ApprovalLevel> = {
  super_admin: 4,
  provider_owner: 4,
  responsible_individual: 4,
  operations_manager: 4,
  registered_manager: 3,
  deputy_manager: 2,
  team_leader: 1,
  senior_rsw: 0,
  rsw: 0,
  waking_night: 0,
  agency_staff: 0,
  hr_admin: 2,
  finance_admin: 0,
  reg44_visitor: 0,
  external_auditor: 0,
  ofsted_readonly_export: 0,
};

// ── Control Centre Access ──────────────────────────────────────────────────

export const CONTROL_CENTRE_ROLES: Role[] = [
  "super_admin",
  "provider_owner",
  "responsible_individual",
  "operations_manager",
  "registered_manager",
];

// ── Dashboard Assignments ──────────────────────────────────────────────────

export const DASHBOARD_BY_ROLE: Record<Role, string> = {
  super_admin: "provider_owner",
  provider_owner: "provider_owner",
  responsible_individual: "responsible_individual",
  operations_manager: "operations_manager",
  registered_manager: "registered_manager",
  deputy_manager: "deputy_manager",
  team_leader: "team_leader",
  senior_rsw: "rsw",
  rsw: "rsw",
  waking_night: "rsw",
  agency_staff: "rsw",
  hr_admin: "hr_admin",
  finance_admin: "finance_admin",
  reg44_visitor: "rsw", // restricted read-only
  external_auditor: "rsw",
  ofsted_readonly_export: "rsw",
};

// ── Core Permission Rules ──────────────────────────────────────────────────

export const PERMISSION_RULES: PermissionRule[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  {
    role: ["rsw", "senior_rsw", "waking_night", "agency_staff"],
    resourceType: "dashboard",
    actions: ["view"],
    conditions: [
      { attribute: "employmentStatus", operator: "in", value: ["active", "bank", "agency"] },
    ],
  },
  {
    role: ["team_leader"],
    resourceType: "dashboard",
    actions: ["view"],
  },
  {
    role: ["deputy_manager", "registered_manager", "operations_manager", "responsible_individual", "provider_owner", "super_admin"],
    resourceType: "dashboard",
    actions: ["view"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CONTROL CENTRE
  // ─────────────────────────────────────────────────────────────────────────
  {
    role: ["super_admin", "provider_owner", "responsible_individual", "operations_manager", "registered_manager"],
    resourceType: "control_centre",
    actions: ["view", "edit", "create", "delete", "assign"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // CHILD RECORDS
  // ─────────────────────────────────────────────────────────────────────────
  {
    role: ["rsw", "senior_rsw", "waking_night"],
    resourceType: "child_record",
    actions: ["view", "create", "edit"],
    requiresAssignment: true,
    requiresHomeMatch: true,
    sensitivityMax: "internal",
  },
  {
    role: ["agency_staff"],
    resourceType: "child_record",
    actions: ["view", "create"],
    requiresShift: true,
    requiresHomeMatch: true,
    sensitivityMax: "internal",
  },
  {
    role: ["team_leader", "senior_rsw"],
    resourceType: "child_record",
    actions: ["view", "create", "edit", "check"],
    requiresHomeMatch: true,
    sensitivityMax: "restricted",
  },
  {
    role: ["deputy_manager"],
    resourceType: "child_record",
    actions: ["view", "create", "edit", "check", "approve", "return_for_improvement"],
    requiresHomeMatch: true,
    sensitivityMax: "confidential",
  },
  {
    role: ["registered_manager"],
    resourceType: "child_record",
    actions: ["view", "create", "edit", "check", "approve", "return_for_improvement", "lock", "export"],
    requiresHomeMatch: true,
  },
  {
    role: ["responsible_individual", "operations_manager", "provider_owner", "super_admin"],
    resourceType: "child_record",
    actions: ["view", "approve", "export"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // HR FILES — Highly restricted
  // ─────────────────────────────────────────────────────────────────────────
  {
    role: ["rsw", "senior_rsw", "waking_night", "agency_staff", "team_leader"],
    resourceType: "hr_file",
    actions: [], // NO ACCESS
  },
  {
    role: ["deputy_manager"],
    resourceType: "hr_file",
    actions: ["view"],
    sensitivityMax: "internal",
    // Only if explicitly delegated
  },
  {
    role: ["registered_manager"],
    resourceType: "hr_file",
    actions: ["view", "create", "edit", "approve"],
  },
  {
    role: ["hr_admin"],
    resourceType: "hr_file",
    actions: ["view", "create", "edit", "approve", "archive"],
  },
  {
    role: ["responsible_individual", "operations_manager", "provider_owner", "super_admin"],
    resourceType: "hr_file",
    actions: ["view", "approve", "export"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SAFER RECRUITMENT — Restricted
  // ─────────────────────────────────────────────────────────────────────────
  {
    role: ["rsw", "senior_rsw", "waking_night", "agency_staff", "team_leader"],
    resourceType: "safer_recruitment",
    actions: [], // NO ACCESS
  },
  {
    role: ["deputy_manager"],
    resourceType: "safer_recruitment",
    actions: ["view"],
    sensitivityMax: "restricted",
  },
  {
    role: ["registered_manager"],
    resourceType: "safer_recruitment",
    actions: ["view", "create", "edit", "approve", "check"],
  },
  {
    role: ["hr_admin"],
    resourceType: "safer_recruitment",
    actions: ["view", "create", "edit", "check"],
  },
  {
    role: ["responsible_individual", "operations_manager", "provider_owner", "super_admin"],
    resourceType: "safer_recruitment",
    actions: ["view", "approve", "export", "qa_sample"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SAFEGUARDING — Need-to-know
  // ─────────────────────────────────────────────────────────────────────────
  {
    role: ["rsw", "senior_rsw", "waking_night"],
    resourceType: "safeguarding",
    actions: ["create", "view"],
    requiresHomeMatch: true,
    // view only records they created or are assigned to
  },
  {
    role: ["team_leader"],
    resourceType: "safeguarding",
    actions: ["view", "create", "check"],
    requiresHomeMatch: true,
  },
  {
    role: ["deputy_manager"],
    resourceType: "safeguarding",
    actions: ["view", "create", "edit", "check", "approve"],
    requiresHomeMatch: true,
  },
  {
    role: ["registered_manager"],
    resourceType: "safeguarding",
    actions: ["view", "create", "edit", "check", "approve", "lock", "escalate", "export"],
    requiresHomeMatch: true,
  },
  {
    role: ["responsible_individual", "operations_manager", "provider_owner", "super_admin"],
    resourceType: "safeguarding",
    actions: ["view", "approve", "escalate", "export"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // INSPECTION MODE — Very restricted
  // ─────────────────────────────────────────────────────────────────────────
  {
    role: ["rsw", "senior_rsw", "waking_night", "agency_staff", "team_leader", "deputy_manager"],
    resourceType: "inspection_mode",
    actions: [], // NO ACCESS
  },
  {
    role: ["registered_manager"],
    resourceType: "inspection_mode",
    actions: ["view", "generate_evidence", "export"],
  },
  {
    role: ["responsible_individual", "operations_manager", "provider_owner", "super_admin"],
    resourceType: "inspection_mode",
    actions: ["view", "generate_evidence", "export"],
  },
  {
    role: ["external_auditor", "ofsted_readonly_export"],
    resourceType: "inspection_mode",
    actions: ["view"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // APPROVAL QUEUES
  // ─────────────────────────────────────────────────────────────────────────
  {
    role: ["team_leader"],
    resourceType: "approval_queue",
    actions: ["view", "check", "return_for_improvement"],
    approvalLevelMax: 1,
    requiresHomeMatch: true,
  },
  {
    role: ["deputy_manager"],
    resourceType: "approval_queue",
    actions: ["view", "check", "approve", "return_for_improvement"],
    approvalLevelMax: 2,
    requiresHomeMatch: true,
  },
  {
    role: ["registered_manager"],
    resourceType: "approval_queue",
    actions: ["view", "check", "approve", "return_for_improvement", "lock"],
    approvalLevelMax: 3,
    requiresHomeMatch: true,
  },
  {
    role: ["responsible_individual", "operations_manager", "provider_owner", "super_admin"],
    resourceType: "approval_queue",
    actions: ["view", "check", "approve", "return_for_improvement", "lock"],
    approvalLevelMax: 4,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // AUDIT LOGS — Read-only for governance
  // ─────────────────────────────────────────────────────────────────────────
  {
    role: ["rsw", "senior_rsw", "waking_night", "agency_staff", "team_leader", "deputy_manager"],
    resourceType: "audit_log",
    actions: [], // NO ACCESS
  },
  {
    role: ["registered_manager"],
    resourceType: "audit_log",
    actions: ["view"],
    requiresHomeMatch: true,
  },
  {
    role: ["responsible_individual", "operations_manager", "provider_owner", "super_admin"],
    resourceType: "audit_log",
    actions: ["view", "export"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PERMISSION SETTINGS — Very restricted
  // ─────────────────────────────────────────────────────────────────────────
  {
    role: ["registered_manager"],
    resourceType: "permission_settings",
    actions: ["view", "edit", "assign"],
    requiresHomeMatch: true,
  },
  {
    role: ["responsible_individual", "operations_manager", "provider_owner", "super_admin"],
    resourceType: "permission_settings",
    actions: ["view", "edit", "assign", "delete"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ARIA INTELLIGENCE — Permission-aware
  // ─────────────────────────────────────────────────────────────────────────
  {
    role: ["rsw", "senior_rsw", "waking_night"],
    resourceType: "aria_intelligence",
    actions: ["view"],
    sensitivityMax: "internal",
    requiresHomeMatch: true,
    // Only practice-level Aria — no manager intelligence
  },
  {
    role: ["team_leader"],
    resourceType: "aria_intelligence",
    actions: ["view"],
    sensitivityMax: "restricted",
    requiresHomeMatch: true,
  },
  {
    role: ["deputy_manager"],
    resourceType: "aria_intelligence",
    actions: ["view"],
    sensitivityMax: "confidential",
    requiresHomeMatch: true,
  },
  {
    role: ["registered_manager"],
    resourceType: "aria_intelligence",
    actions: ["view", "export"],
    requiresHomeMatch: true,
  },
  {
    role: ["responsible_individual", "operations_manager", "provider_owner", "super_admin"],
    resourceType: "aria_intelligence",
    actions: ["view", "export"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // QUALITY ASSURANCE
  // ─────────────────────────────────────────────────────────────────────────
  {
    role: ["team_leader"],
    resourceType: "quality_assurance",
    actions: ["view", "check"],
    requiresHomeMatch: true,
  },
  {
    role: ["deputy_manager"],
    resourceType: "quality_assurance",
    actions: ["view", "check", "qa_sample", "approve"],
    requiresHomeMatch: true,
  },
  {
    role: ["registered_manager"],
    resourceType: "quality_assurance",
    actions: ["view", "check", "qa_sample", "approve", "export"],
    requiresHomeMatch: true,
  },
  {
    role: ["responsible_individual", "operations_manager", "provider_owner", "super_admin"],
    resourceType: "quality_assurance",
    actions: ["view", "qa_sample", "approve", "export"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FORMS & TASKS
  // ─────────────────────────────────────────────────────────────────────────
  {
    role: ["rsw", "senior_rsw", "waking_night", "agency_staff"],
    resourceType: "form_instance",
    actions: ["view", "create", "edit"],
    requiresHomeMatch: true,
    // Only forms assigned to them or their children
  },
  {
    role: ["rsw", "senior_rsw", "waking_night", "agency_staff"],
    resourceType: "task",
    actions: ["view", "create", "edit"],
    requiresHomeMatch: true,
  },
  {
    role: ["team_leader"],
    resourceType: "form_instance",
    actions: ["view", "create", "edit", "check", "return_for_improvement"],
    requiresHomeMatch: true,
  },
  {
    role: ["team_leader"],
    resourceType: "task",
    actions: ["view", "create", "edit", "check", "return_for_improvement", "assign"],
    requiresHomeMatch: true,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FILING CABINET
  // ─────────────────────────────────────────────────────────────────────────
  {
    role: ["rsw", "senior_rsw", "waking_night"],
    resourceType: "filing_cabinet",
    actions: ["view"],
    requiresHomeMatch: true,
    sensitivityMax: "internal",
    // Only their own filed items and child records they're assigned to
  },
  {
    role: ["team_leader"],
    resourceType: "filing_cabinet",
    actions: ["view"],
    requiresHomeMatch: true,
    sensitivityMax: "restricted",
  },
  {
    role: ["deputy_manager"],
    resourceType: "filing_cabinet",
    actions: ["view", "file"],
    requiresHomeMatch: true,
    sensitivityMax: "confidential",
  },
  {
    role: ["registered_manager"],
    resourceType: "filing_cabinet",
    actions: ["view", "file", "export", "archive"],
    requiresHomeMatch: true,
  },
  {
    role: ["responsible_individual", "operations_manager", "provider_owner", "super_admin"],
    resourceType: "filing_cabinet",
    actions: ["view", "file", "export", "archive"],
  },
];

// ── Employment Status Restrictions ─────────────────────────────────────────

export const BLOCKED_STATUSES: EmploymentStatus[] = [
  "suspended",
  "leaver",
  "archived",
];

export const RESTRICTED_STATUSES: EmploymentStatus[] = [
  "under_investigation",
  "long_term_absent",
  "candidate",
];

// ── Roles that CANNOT self-approve high-risk records ───────────────────────

export const SELF_APPROVAL_BLOCKED_ROLES: Role[] = [
  "rsw",
  "senior_rsw",
  "waking_night",
  "agency_staff",
  "team_leader",
  "deputy_manager",
  // Even managers cannot self-approve Level 3+ unless super_admin
];
