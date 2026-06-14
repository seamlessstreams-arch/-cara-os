// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence — Role-Based Access Control for AI Features
//
// Enforces which roles can access which AI capabilities.
// Integrated with Cara RBAC system.
// ══════════════════════════════════════════════════════════════════════════════

import type { CaraRole, CaraTaskType, CaraRiskLevel } from "../core/types";
import { CaraPermissionDeniedError } from "../core/errors";

// ── Permission Matrix ─────────────────────────────────────────────────────

type PermissionLevel = "generate" | "review" | "approve" | "none";

const ROLE_TASK_PERMISSIONS: Record<CaraRole, Partial<Record<CaraTaskType, PermissionLevel>>> = {
  support_worker: {
    keywork_session_plan: "generate",
    direct_work_session: "generate",
    daily_task_generation: "generate",
    form_prompt_support: "generate",
    admin_summary: "generate",
    email_draft: "generate",
    policy_search: "generate",
    filing_cabinet_search: "generate",
    training_material_generation: "generate",
    creative_resource_generation: "generate",
    // Cannot access
    safeguarding_analysis: "none",
    reg45_report: "none",
    annex_a_report: "none",
    risk_assessment_update: "none",
    management_oversight: "none",
    staff_supervision_reflection: "none",
    quality_assurance_review: "none",
  },

  senior_support_worker: {
    keywork_session_plan: "generate",
    direct_work_session: "generate",
    staff_briefing: "generate",
    daily_task_generation: "generate",
    form_prompt_support: "generate",
    incident_summary: "generate",
    behaviour_pattern_analysis: "generate",
    admin_summary: "generate",
    email_draft: "generate",
    policy_search: "generate",
    filing_cabinet_search: "generate",
    evidence_search: "generate",
    training_material_generation: "generate",
    creative_resource_generation: "generate",
    // Cannot access
    safeguarding_analysis: "none",
    reg45_report: "none",
    annex_a_report: "none",
    risk_assessment_update: "none",
    management_oversight: "none",
  },

  team_leader: {
    keywork_session_plan: "generate",
    direct_work_session: "generate",
    staff_briefing: "generate",
    staff_supervision_reflection: "generate",
    daily_task_generation: "generate",
    form_prompt_support: "generate",
    incident_summary: "generate",
    behaviour_pattern_analysis: "generate",
    child_weekly_report: "generate",
    quality_assurance_review: "generate",
    admin_summary: "generate",
    email_draft: "generate",
    policy_search: "generate",
    filing_cabinet_search: "generate",
    evidence_search: "generate",
    training_material_generation: "generate",
    creative_resource_generation: "generate",
    document_extraction: "generate",
    document_classification: "generate",
    // Cannot access
    safeguarding_analysis: "none",
    reg45_report: "none",
    annex_a_report: "none",
    risk_assessment_update: "none",
  },

  deputy_manager: {
    keywork_session_plan: "generate",
    direct_work_session: "generate",
    staff_briefing: "generate",
    staff_supervision_reflection: "generate",
    daily_task_generation: "generate",
    form_prompt_support: "generate",
    incident_summary: "approve",
    behaviour_pattern_analysis: "approve",
    child_weekly_report: "approve",
    child_review_report: "generate",
    management_oversight: "generate",
    quality_assurance_review: "approve",
    reg45_report: "generate",
    rag44_evidence_review: "generate",
    evidence_search: "generate",
    filing_cabinet_search: "generate",
    policy_search: "generate",
    admin_summary: "generate",
    email_draft: "generate",
    training_material_generation: "generate",
    creative_resource_generation: "generate",
    document_extraction: "generate",
    document_classification: "generate",
    public_research: "generate",
    competitor_research: "generate",
    // Cannot access
    safeguarding_analysis: "none",
    annex_a_report: "none",
  },

  registered_manager: {
    // Full access to generate and approve
    safeguarding_analysis: "approve",
    reg45_report: "approve",
    annex_a_report: "approve",
    rag44_evidence_review: "approve",
    child_weekly_report: "approve",
    child_review_report: "approve",
    keywork_session_plan: "approve",
    direct_work_session: "approve",
    staff_briefing: "approve",
    staff_supervision_reflection: "approve",
    placement_planning: "approve",
    risk_assessment_update: "approve",
    behaviour_pattern_analysis: "approve",
    incident_summary: "approve",
    management_oversight: "approve",
    daily_task_generation: "generate",
    form_prompt_support: "generate",
    quality_assurance_review: "approve",
    policy_search: "generate",
    evidence_search: "generate",
    filing_cabinet_search: "generate",
    public_research: "generate",
    competitor_research: "generate",
    training_material_generation: "generate",
    creative_resource_generation: "generate",
    admin_summary: "generate",
    email_draft: "generate",
    document_extraction: "generate",
    document_classification: "generate",
  },

  responsible_individual: {
    safeguarding_analysis: "approve",
    reg45_report: "approve",
    annex_a_report: "approve",
    rag44_evidence_review: "approve",
    child_review_report: "approve",
    placement_planning: "approve",
    risk_assessment_update: "approve",
    management_oversight: "approve",
    quality_assurance_review: "approve",
    evidence_search: "generate",
    filing_cabinet_search: "generate",
    policy_search: "generate",
    public_research: "generate",
    competitor_research: "generate",
    admin_summary: "generate",
  },

  operations_manager: {
    safeguarding_analysis: "review",
    reg45_report: "approve",
    annex_a_report: "approve",
    rag44_evidence_review: "approve",
    management_oversight: "approve",
    quality_assurance_review: "approve",
    evidence_search: "generate",
    filing_cabinet_search: "generate",
    policy_search: "generate",
    public_research: "generate",
    competitor_research: "generate",
    admin_summary: "generate",
    email_draft: "generate",
  },

  director: {
    safeguarding_analysis: "approve",
    reg45_report: "approve",
    annex_a_report: "approve",
    rag44_evidence_review: "approve",
    management_oversight: "approve",
    quality_assurance_review: "approve",
    placement_planning: "approve",
    risk_assessment_update: "approve",
    evidence_search: "generate",
    filing_cabinet_search: "generate",
    policy_search: "generate",
    public_research: "generate",
    competitor_research: "generate",
    admin_summary: "generate",
  },

  system_admin: {
    // System admins can configure but not approve care content
    policy_search: "generate",
    public_research: "generate",
    admin_summary: "generate",
    document_extraction: "generate",
    document_classification: "generate",
  },

  external_professional: {
    // Read-only access to approved outputs
    policy_search: "review",
    evidence_search: "review",
  },

  inspector_readonly: {
    // Read-only access to approved outputs
    evidence_search: "review",
    filing_cabinet_search: "review",
  },
};

// ── Permission Checks ─────────────────────────────────────────────────────

/**
 * Validate that a role has permission to perform a task type.
 * Throws CaraPermissionDeniedError if not permitted.
 */
export function validateRolePermission(role: CaraRole, taskType: CaraTaskType): void {
  const permissions = ROLE_TASK_PERMISSIONS[role];
  if (!permissions) {
    throw new CaraPermissionDeniedError(role, `access AI task '${taskType}'`);
  }

  const level = permissions[taskType];
  if (level === "none" || level === undefined) {
    throw new CaraPermissionDeniedError(role, `use AI for '${taskType}'`);
  }
}

/**
 * Check if a role can approve a specific task type.
 */
export function canApprove(role: CaraRole, taskType: CaraTaskType): boolean {
  const permissions = ROLE_TASK_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions[taskType] === "approve";
}

/**
 * Check the maximum risk level a role can approve.
 */
export function getMaxApprovalRisk(role: CaraRole): CaraRiskLevel {
  switch (role) {
    case "registered_manager":
    case "responsible_individual":
    case "director":
      return "critical";
    case "operations_manager":
    case "deputy_manager":
      return "high";
    case "team_leader":
      return "medium";
    default:
      return "low";
  }
}

/**
 * Get all task types accessible by a role.
 */
export function getAccessibleTasks(role: CaraRole): CaraTaskType[] {
  const permissions = ROLE_TASK_PERMISSIONS[role];
  if (!permissions) return [];
  return Object.entries(permissions)
    .filter(([_, level]) => level !== "none")
    .map(([task]) => task as CaraTaskType);
}

/**
 * Get the permission level for a specific role+task combination.
 */
export function getPermissionLevel(role: CaraRole, taskType: CaraTaskType): PermissionLevel {
  const permissions = ROLE_TASK_PERMISSIONS[role];
  if (!permissions) return "none";
  return permissions[taskType] ?? "none";
}
