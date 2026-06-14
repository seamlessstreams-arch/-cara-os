// ══════════════════════════════════════════════════════════════════════════════
// CARA — OPERATIONS LAYER TYPES
// Granular permissions, form governance, task explorer, workflows, evidence,
// management oversight, Cara intelligence, regulatory mapping, audit trail.
// ══════════════════════════════════════════════════════════════════════════════

// ── Permissions ─────────────────────────────────────────────────────────────

export interface CsRole {
  id: string;
  home_id: string;
  code: string;
  label: string;
  description: string | null;
  level: number;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface CsPermission {
  id: string;
  code: string;
  group_name: string;
  label: string;
  description: string | null;
  created_at: string;
}

export interface CsRolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted_at: string;
  granted_by: string | null;
}

export interface CsUserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  home_id: string;
  assigned_at: string;
  assigned_by: string | null;
  expires_at: string | null;
  is_active: boolean;
}

// ── Form Governance ─────────────────────────────────────────────────────────

export type FormCategory =
  | "daily_recording" | "incident" | "safeguarding" | "health"
  | "education" | "placement" | "hr" | "compliance" | "review"
  | "contact" | "risk_assessment" | "custom";

export type FormVersionStatus = "draft" | "pending_approval" | "approved" | "archived" | "rejected";

export type FormSubmissionStatus =
  | "draft" | "submitted" | "under_review" | "changes_requested"
  | "approved" | "rejected" | "archived";

export type FormFieldType =
  | "text" | "textarea" | "rich_text" | "number" | "date" | "time"
  | "datetime" | "select" | "multi_select" | "checkbox" | "radio"
  | "toggle" | "file_upload" | "signature" | "rating" | "scale"
  | "staff_picker" | "child_picker" | "section_header" | "info_block"
  | "conditional_group" | "repeater";

export interface FormFieldDefinition {
  id: string;
  type: FormFieldType;
  label: string;
  name: string;
  required: boolean;
  placeholder?: string;
  help_text?: string;
  default_value?: unknown;
  options?: { label: string; value: string }[];
  validation?: {
    min?: number;
    max?: number;
    min_length?: number;
    max_length?: number;
    pattern?: string;
    message?: string;
  };
  conditional_on?: {
    field: string;
    operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
    value: unknown;
  };
  repeater_fields?: FormFieldDefinition[];
}

export interface FormApprovalStep {
  role: string;
  action: "review" | "approve" | "sign_off";
  required: boolean;
}

export interface FormTemplate {
  id: string;
  home_id: string;
  slug: string;
  title: string;
  description: string | null;
  category: FormCategory;
  is_active: boolean;
  is_mandatory: boolean;
  regulation_refs: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FormTemplateVersion {
  id: string;
  template_id: string;
  version: number;
  schema: FormFieldDefinition[];
  layout: Record<string, unknown> | null;
  approval_chain: FormApprovalStep[] | null;
  validation_rules: Record<string, unknown> | null;
  status: FormVersionStatus;
  published_at: string | null;
  published_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  changelog: string | null;
  created_by: string | null;
  created_at: string;
}

export interface FormSubmission {
  id: string;
  home_id: string;
  template_id: string;
  version_id: string;
  data: Record<string, unknown>;
  status: FormSubmissionStatus;
  linked_child_id: string | null;
  linked_staff_id: string | null;
  linked_incident_id: string | null;
  submitted_at: string | null;
  submitted_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FormAuditLog {
  id: string;
  submission_id: string;
  action: string;
  field_changes: Record<string, { old: unknown; new: unknown }> | null;
  performed_by: string | null;
  performed_at: string;
  ip_address: string | null;
  notes: string | null;
}

// ── Task Explorer ───────────────────────────────────────────────────────────

export type CsTaskCategory =
  | "compliance" | "safeguarding" | "medication" | "maintenance"
  | "staffing" | "training" | "supervision" | "young_person_plans"
  | "professional_communication" | "finance" | "inspection"
  | "health_and_safety" | "admin" | "cara_generated";

export type CsTaskPriority = "low" | "medium" | "high" | "urgent" | "critical";

export type CsTaskStatus =
  | "not_started" | "in_progress" | "blocked" | "on_hold"
  | "under_review" | "awaiting_sign_off" | "delegated"
  | "completed" | "cancelled" | "overdue";

export interface CsTask {
  id: string;
  home_id: string;
  reference: string;
  title: string;
  description: string | null;
  category: CsTaskCategory;
  priority: CsTaskPriority;
  status: CsTaskStatus;
  assigned_to: string | null;
  assigned_role: string | null;
  delegated_to: string | null;
  delegated_at: string | null;
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  completed_by: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  recurring: boolean;
  recurring_schedule: "daily" | "weekly" | "fortnightly" | "monthly" | "quarterly" | "annually" | null;
  recurrence_end: string | null;
  requires_sign_off: boolean;
  signed_off_by: string | null;
  signed_off_at: string | null;
  evidence_note: string | null;
  evidence_files: string[];
  escalated: boolean;
  escalated_to: string | null;
  escalated_at: string | null;
  escalation_reason: string | null;
  escalation_level: number;
  cara_risk_score: number | null;
  cara_risk_factors: Record<string, unknown> | null;
  cara_generated: boolean;
  cara_source: string | null;
  linked_child_id: string | null;
  linked_incident_id: string | null;
  linked_document_id: string | null;
  linked_form_id: string | null;
  linked_workflow_id: string | null;
  parent_task_id: string | null;
  tags: string[];
  regulation_refs: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CsTaskDependency {
  id: string;
  task_id: string;
  depends_on_id: string;
  dependency_type: "blocks" | "required_before" | "related";
  created_at: string;
}

export interface CsTaskComment {
  id: string;
  task_id: string;
  author_id: string | null;
  content: string;
  is_system: boolean;
  created_at: string;
}

export interface CsTaskEscalationRule {
  id: string;
  home_id: string;
  name: string;
  category: string;
  condition_type: "overdue_hours" | "priority_level" | "unassigned_hours" | "no_progress_hours";
  condition_value: number;
  escalate_to_role: string;
  notify_chain: { role: string; method: string }[] | null;
  is_active: boolean;
  created_at: string;
}

// ── Workflow Engine ──────────────────────────────────────────────────────────

export type WorkflowStatus = "not_started" | "in_progress" | "blocked" | "completed" | "cancelled";
export type WorkflowStepStatus = "pending" | "in_progress" | "completed" | "skipped" | "blocked";

export type WorkflowTemplateCode =
  | "new_placement" | "incident_response" | "missing_episode"
  | "reg44_report" | "reg45_review" | "staff_onboarding"
  | "placement_ending" | "complaint_handling" | "restraint_debrief"
  | "safeguarding_referral" | "medication_change";

export interface CsWorkflow {
  id: string;
  home_id: string;
  template_code: string;
  title: string;
  description: string | null;
  status: WorkflowStatus;
  current_step: number;
  total_steps: number;
  linked_child_id: string | null;
  linked_incident_id: string | null;
  initiated_by: string | null;
  completed_at: string | null;
  completed_by: string | null;
  due_date: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CsWorkflowStep {
  id: string;
  workflow_id: string;
  step_number: number;
  title: string;
  description: string | null;
  status: WorkflowStepStatus;
  assigned_to: string | null;
  assigned_role: string | null;
  evidence_required: boolean;
  evidence_ids: string[];
  evidence_notes: string | null;
  completed_at: string | null;
  completed_by: string | null;
  completion_notes: string | null;
  due_date: string | null;
  auto_create_task: boolean;
  auto_task_template: Record<string, unknown> | null;
  created_at: string;
}

// Workflow template definition (used by builder, not stored in DB row directly)
export interface WorkflowTemplateDefinition {
  code: WorkflowTemplateCode;
  title: string;
  description: string;
  category: string;
  regulation_refs: string[];
  steps: {
    title: string;
    description: string;
    assigned_role: string;
    evidence_required: boolean;
    auto_create_task: boolean;
    estimated_hours?: number;
  }[];
}

// ── Evidence Management ─────────────────────────────────────────────────────

export type EvidenceType =
  | "document" | "photograph" | "form_submission" | "daily_log"
  | "incident_report" | "meeting_minutes" | "correspondence"
  | "training_certificate" | "policy" | "risk_assessment"
  | "care_plan" | "review_report" | "external_report";

export type EvidenceLinkType = "supports" | "contradicts" | "supplements" | "supersedes";

export interface CsEvidenceItem {
  id: string;
  home_id: string;
  title: string;
  description: string | null;
  evidence_type: EvidenceType;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  quality_score: number | null;
  quality_notes: string | null;
  linked_child_id: string | null;
  linked_staff_id: string | null;
  regulation_refs: string[];
  sccif_refs: string[];
  date_of_evidence: string | null;
  uploaded_by: string | null;
  verified_by: string | null;
  verified_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CsEvidenceLink {
  id: string;
  evidence_id: string;
  entity_type: string;
  entity_id: string;
  link_type: EvidenceLinkType;
  created_by: string | null;
  created_at: string;
}

// ── Regulation Mapping ──────────────────────────────────────────────────────

export type RegulatoryFramework = "CHR2015" | "SCCIF" | "Reg44" | "Reg45" | "AnnexA" | "KCSIE";

export interface CsRegulationMapping {
  id: string;
  framework: RegulatoryFramework;
  reference: string;
  title: string;
  description: string | null;
  module_links: string[];
  evidence_types: string[];
  parent_ref: string | null;
  sort_order: number;
  created_at: string;
}

// ── Management Oversight ────────────────────────────────────────────────────

export type OversightRecordType =
  | "incident" | "safeguarding" | "missing_episode" | "complaint"
  | "daily_log" | "medication_error" | "restraint" | "disclosure"
  | "risk_assessment" | "care_plan_review" | "supervision"
  | "key_work_session" | "contact_session";

export interface CsManagementOversightNote {
  id: string;
  home_id: string;
  record_type: OversightRecordType;
  record_id: string;
  record_reference: string | null;
  oversight_text: string;
  quality_score: number | null;
  quality_dimensions: {
    reflectiveAnalysis: number;
    childFocus: number;
    professionalChallenge: number;
    decisionClarity: number;
    actionSpecificity: number;
  } | null;
  cara_prompted: boolean;
  cara_prompt_used: string | null;
  cara_suggestions: Record<string, unknown> | null;
  actions_identified: string[];
  tasks_created: string[];
  oversight_by: string | null;
  oversight_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  regulation_refs: string[];
  created_at: string;
}

// ── Cara Intelligence ───────────────────────────────────────────────────────

export type CaraRecommendationType =
  | "overdue_form" | "missing_oversight" | "weak_recording"
  | "staffing_concern" | "pattern_detected" | "compliance_gap"
  | "training_due" | "supervision_due" | "risk_escalation"
  | "positive_recognition" | "inspection_prep" | "reg45_evidence"
  | "handover_quality" | "documentation_gap" | "wellbeing_concern"
  | "medication_pattern" | "incident_trend" | "placement_risk"
  | "safeguarding_pattern" | "contact_disruption";

export type CaraRecommendationSeverity = "info" | "low" | "medium" | "high" | "critical";
export type CaraRecommendationStatus = "active" | "acknowledged" | "actioned" | "dismissed" | "expired";

export interface CsCaraRecommendation {
  id: string;
  home_id: string;
  recommendation_type: CaraRecommendationType;
  title: string;
  description: string;
  severity: CaraRecommendationSeverity;
  linked_child_id: string | null;
  linked_staff_id: string | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  suggested_action: string | null;
  action_taken: string | null;
  action_by: string | null;
  action_at: string | null;
  status: CaraRecommendationStatus;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  dismissed_reason: string | null;
  expires_at: string | null;
  data_points: number;
  confidence: number | null;
  supporting_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CsCaraRiskSignal {
  id: string;
  home_id: string;
  signal_type: string;
  entity_type: string;
  entity_id: string;
  risk_score: number;
  risk_factors: Record<string, unknown> | null;
  detected_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

// ── Inspection Readiness ────────────────────────────────────────────────────

export type InspectionScanType = "full" | "quick" | "module" | "regulation";

export interface CsInspectionReadinessScan {
  id: string;
  home_id: string;
  scan_type: InspectionScanType;
  overall_score: number | null;
  module_scores: Record<string, {
    score: number;
    gaps: string[];
    strengths: string[];
  }> | null;
  regulation_scores: Record<string, Record<string, {
    score: number;
    evidence_count: number;
    gaps: string[];
  }>> | null;
  gaps_identified: Record<string, unknown> | null;
  strengths_identified: Record<string, unknown> | null;
  recommendations: Record<string, unknown> | null;
  initiated_by: string | null;
  completed_at: string | null;
  expires_at: string | null;
  created_at: string;
}

// ── System Settings ─────────────────────────────────────────────────────────

export interface CsSystemSetting {
  id: string;
  home_id: string;
  setting_key: string;
  setting_value: unknown;
  updated_by: string | null;
  updated_at: string;
}

// ── Immutable Audit Log ─────────────────────────────────────────────────────

export type AuditAction =
  | "create" | "update" | "delete" | "sign_off" | "approve" | "reject"
  | "escalate" | "view" | "export" | "login" | "logout";

export interface CsAuditLogEntry {
  id: string;
  home_id: string;
  entity_type: string;
  entity_id: string;
  action: AuditAction;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  metadata: Record<string, unknown> | null;
  performed_by: string | null;
  performed_at: string;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
}

// ── Service result pattern ──────────────────────────────────────────────────

export interface ServiceResult<T = void> {
  ok: boolean;
  data?: T;
  error?: string;
}
