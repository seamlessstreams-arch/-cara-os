// ══════════════════════════════════════════════════════════════════════════════
// Cara Permission System — Core Types
//
// RBAC + ABAC permission model for children's residential care.
// Roles define baseline access; attributes refine it contextually.
// ══════════════════════════════════════════════════════════════════════════════

// ── Roles ───────────────────────────────────────────────────────────────────

export type Role =
  | "super_admin"
  | "provider_owner"
  | "responsible_individual"
  | "operations_manager"
  | "registered_manager"
  | "deputy_manager"
  | "team_leader"
  | "senior_rsw"
  | "rsw"
  | "waking_night"
  | "agency_staff"
  | "hr_admin"
  | "finance_admin"
  | "reg44_visitor"
  | "external_auditor"
  | "ofsted_readonly_export";

// ── Employment Status ───────────────────────────────────────────────────────

export type EmploymentStatus =
  | "candidate"
  | "active"
  | "bank"
  | "agency"
  | "suspended"
  | "long_term_absent"
  | "under_investigation"
  | "leaver"
  | "archived";

// ── Resource Types ──────────────────────────────────────────────────────────

export type ResourceType =
  | "dashboard"
  | "control_centre"
  | "child_record"
  | "staff_record"
  | "hr_file"
  | "safer_recruitment"
  | "form_template"
  | "form_instance"
  | "task"
  | "filing_cabinet"
  | "evidence_pack"
  | "inspection_mode"
  | "medication"
  | "incident"
  | "missing_episode"
  | "physical_intervention"
  | "daily_log"
  | "safeguarding"
  | "complaint"
  | "supervision"
  | "training"
  | "audit_log"
  | "permission_settings"
  | "cara_intelligence"
  | "quality_assurance"
  | "approval_queue"
  | "rota"
  | "finance"
  | "comms_channel" // Comms Centre (Phase 1) — enforced via lib/comms/comms-access.ts
  | "comms_message";

// ── Actions ─────────────────────────────────────────────────────────────────

export type Action =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "archive"
  | "approve"
  | "check"
  | "return_for_improvement"
  | "lock"
  | "unlock"
  | "export"
  | "download"
  | "assign"
  | "delegate"
  | "escalate"
  | "file"
  | "qa_sample"
  | "generate_evidence"
  | "request_access"
  | "break_glass";

// ── Sensitivity Levels ──────────────────────────────────────────────────────

export type Sensitivity = "public" | "internal" | "restricted" | "confidential" | "safeguarding";

// ── Approval Levels ─────────────────────────────────────────────────────────

export type ApprovalLevel = 0 | 1 | 2 | 3 | 4;

// ── Dashboard Types ─────────────────────────────────────────────────────────

export type DashboardType =
  | "rsw"
  | "team_leader"
  | "deputy_manager"
  | "registered_manager"
  | "responsible_individual"
  | "operations_manager"
  | "provider_owner"
  | "hr_admin"
  | "finance_admin";

// ── User Context ────────────────────────────────────────────────────────────

export interface UserContext {
  userId: string;
  role: Role;
  organisationId: string;
  homeIds: string[];           // homes this user belongs to
  assignedChildIds: string[];  // children assigned / key-worker
  assignedStaffIds: string[];  // for managers overseeing staff
  employmentStatus: EmploymentStatus;
  shiftActive: boolean;        // currently on shift?
  isAgencyStaff: boolean;
  isSuspended: boolean;
  isLeaver: boolean;
  isUnderInvestigation: boolean;
  delegatedScopes: DelegatedScope[];
  temporaryGrants: TemporaryGrant[];
  safeguardingNeedToKnow: string[]; // child IDs with safeguarding access
}

// ── Delegated Access ────────────────────────────────────────────────────────

export interface DelegatedScope {
  resourceType: ResourceType;
  resourceId?: string;
  actions: Action[];
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
  reason: string;
}

// ── Temporary Grants ────────────────────────────────────────────────────────

export interface TemporaryGrant {
  id: string;
  resourceType: ResourceType;
  resourceId?: string;
  actions: Action[];
  grantedBy: string;
  grantedAt: string;
  expiresAt: string;
  reason: string;
  status: "active" | "expired" | "revoked";
}

// ── Access Request ──────────────────────────────────────────────────────────

export interface AccessRequest {
  id: string;
  requestedBy: string;
  requestedResource: ResourceType;
  resourceId?: string;
  reason: string;
  requestedDuration: number; // minutes
  childScope?: string[];
  homeScope?: string[];
  staffScope?: string[];
  urgency: "low" | "medium" | "high" | "emergency";
  approvingManager: string;
  status: "requested" | "approved" | "rejected" | "expired" | "revoked";
  decidedBy?: string;
  decidedAt?: string;
  decisionReason?: string;
}

// ── Access Decision ─────────────────────────────────────────────────────────

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  restrictionLevel: "none" | "partial" | "full";
  expiry?: string;
  auditEventRequired: boolean;
  userFacingExplanation: string;
  managerFacingExplanation: string;
  grantSource?: "role" | "delegation" | "temporary_grant" | "break_glass" | "safeguarding_ntk";
}

// ── Permission Rule ─────────────────────────────────────────────────────────

export interface PermissionRule {
  role: Role | Role[];
  resourceType: ResourceType;
  actions: Action[];
  conditions?: PermissionCondition[];
  sensitivityMax?: Sensitivity;
  requiresShift?: boolean;
  requiresAssignment?: boolean; // must be assigned to child/staff
  requiresHomeMatch?: boolean;  // must belong to same home
  approvalLevelMax?: ApprovalLevel;
}

export interface PermissionCondition {
  attribute: keyof UserContext | string;
  operator: "eq" | "neq" | "in" | "not_in" | "gt" | "lt" | "contains" | "is_true" | "is_false";
  value: any;
}

// ── Break Glass ─────────────────────────────────────────────────────────────

export interface BreakGlassEvent {
  id: string;
  userId: string;
  role: Role;
  resourceType: ResourceType;
  resourceId?: string;
  reason: string;
  accessedAt: string;
  expiresAt: string;
  managerNotified: boolean;
  reviewedByManager: boolean;
  reviewedAt?: string;
  reviewOutcome?: "justified" | "unjustified" | "pending";
  recordsAccessed: string[];
}
