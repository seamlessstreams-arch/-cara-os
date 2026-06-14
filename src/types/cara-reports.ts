// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara REPORTS & REVIEW INTELLIGENCE TYPE SYSTEM
// Comprehensive types for report generation, evidence retrieval, agent
// orchestration, governance controls, and the Cara challenge layer.
// ══════════════════════════════════════════════════════════════════════════════

// ── Report Types ────────────────────────────────────────────────────────────

export const REPORT_TYPES = [
  "weekly_child_report",
  "child_review_report",
  "social_worker_update",
  "monthly_progress_summary",
  "risk_review_report",
  "keywork_progress_report",
  "placement_stability_report",
  "education_health_summary",
  "end_of_placement_transition_report",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  weekly_child_report: "Weekly Child Report",
  child_review_report: "Child Review Report",
  social_worker_update: "Social Worker Update",
  monthly_progress_summary: "Monthly Progress Summary",
  risk_review_report: "Risk Review Report",
  keywork_progress_report: "Keywork Progress Report",
  placement_stability_report: "Placement Stability Report",
  education_health_summary: "Education & Health Summary",
  end_of_placement_transition_report: "End of Placement / Transition Report",
};

// ── Report Audiences ────────────────────────────────────────────────────────

export const REPORT_AUDIENCES = [
  "internal_manager",
  "social_worker",
  "parent_family",
  "regulation45",
  "ofsted_inspection",
  "staff_team",
  "child_friendly",
] as const;

export type ReportAudience = (typeof REPORT_AUDIENCES)[number];

export const REPORT_AUDIENCE_LABELS: Record<ReportAudience, string> = {
  internal_manager: "Internal (Manager)",
  social_worker: "Social Worker",
  parent_family: "Parent / Family",
  regulation45: "Regulation 45 (Monthly)",
  ofsted_inspection: "Ofsted Inspection",
  staff_team: "Staff Team",
  child_friendly: "Child-Friendly",
};

// ── Report Status Flow ──────────────────────────────────────────────────────

export const REPORT_STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "locked",
  "archived",
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  locked: "Locked",
  archived: "Archived",
};

// ── Risk Tiers ──────────────────────────────────────────────────────────────

export const RISK_TIERS = ["low", "medium", "high"] as const;

export type RiskTier = (typeof RISK_TIERS)[number];

export const RISK_TIER_LABELS: Record<RiskTier, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

// ── Evidence Status ─────────────────────────────────────────────────────────

export const EVIDENCE_STATUSES = [
  "evidence_supported",
  "partial_evidence",
  "manager_input_required",
  "not_enough_evidence",
] as const;

export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  evidence_supported: "Evidence Supported",
  partial_evidence: "Partial Evidence",
  manager_input_required: "Manager Input Required",
  not_enough_evidence: "Not Enough Evidence",
};

// ── Agent Identifiers ───────────────────────────────────────────────────────

export const AGENT_IDS = [
  "oversight_agent",
  "safeguarding_agent",
  "report_generator_agent",
  "therapeutic_practice_agent",
  "risk_assessment_agent",
  "regulation45_evidence_agent",
  "workforce_agent",
  "filing_agent",
] as const;

export type AgentId = (typeof AGENT_IDS)[number];

export const AGENT_ID_LABELS: Record<AgentId, string> = {
  oversight_agent: "Oversight Agent",
  safeguarding_agent: "Safeguarding Agent",
  report_generator_agent: "Report Generator Agent",
  therapeutic_practice_agent: "Therapeutic Practice Agent",
  risk_assessment_agent: "Risk Assessment Agent",
  regulation45_evidence_agent: "Regulation 45 Evidence Agent",
  workforce_agent: "Workforce Agent",
  filing_agent: "Filing Agent",
};

// ══════════════════════════════════════════════════════════════════════════════
// DATA INTERFACES — DATABASE ROWS
// ══════════════════════════════════════════════════════════════════════════════

// ── aria_agent_runs ─────────────────────────────────────────────────────────

export interface AgentRun {
  id: string;
  organisation_id: string;
  home_id: string;
  agent_id: AgentId;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  triggered_by: string;
  trigger_type: "manual" | "scheduled" | "event" | "chained";
  input_params: Record<string, unknown>;
  output_summary: string | null;
  output_data: Record<string, unknown> | null;
  error_message: string | null;
  tokens_used: number | null;
  duration_ms: number | null;
  parent_run_id: string | null;
  child_id: string | null;
  report_id: string | null;
  risk_tier: RiskTier;
  requires_approval: boolean;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  completed_at: string | null;
}

export type AgentRunInsert = Omit<AgentRun, "id" | "created_at" | "completed_at">;

// ── aria_evidence_links ─────────────────────────────────────────────────────

export interface CaraEvidenceLink {
  id: string;
  agent_run_id: string;
  source_table: string;
  source_record_id: string;
  relevance_score: number | null;
  excerpt: string | null;
  reasoning: string | null;
  is_primary: boolean;
  is_child_voice: boolean;
  created_at: string;
}

export type CaraEvidenceLinkInsert = Omit<CaraEvidenceLink, "id" | "created_at">;

// ── aria_drafts ─────────────────────────────────────────────────────────────

export interface CaraDraft {
  id: string;
  organisation_id: string;
  home_id: string;
  agent_run_id: string;
  draft_type: string;
  title: string;
  content: string;
  structured_content: Record<string, unknown> | null;
  status: "generated" | "editing" | "submitted" | "approved" | "rejected" | "committed";
  confidence_score: number | null;
  child_id: string | null;
  staff_id: string | null;
  target_module: string | null;
  target_record_id: string | null;
  committed_by: string | null;
  committed_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type CaraDraftInsert = Omit<CaraDraft, "id" | "created_at" | "updated_at">;

// ── child_reports ───────────────────────────────────────────────────────────

export interface ChildReport {
  id: string;
  organisation_id: string;
  home_id: string;
  child_id: string;
  report_type: ReportType;
  audience: ReportAudience;
  title: string;
  status: ReportStatus;
  version: number;
  parent_report_id: string | null;
  date_range_start: string;
  date_range_end: string;
  overall_summary: string | null;
  overall_confidence_score: number | null;
  risk_tier: RiskTier;
  child_voice_included: boolean;
  evidence_gap_count: number;
  agent_run_id: string | null;
  requested_by: string;
  generated_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  locked_by: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ChildReportInsert = Omit<ChildReport, "id" | "created_at" | "updated_at">;

// ── child_report_sections ───────────────────────────────────────────────────

export interface ChildReportSection {
  id: string;
  report_id: string;
  section_key: string;
  title: string;
  order: number;
  content: string | null;
  structured_content: Record<string, unknown> | null;
  evidence_status: EvidenceStatus;
  confidence_score: number | null;
  evidence_count: number;
  child_voice_present: boolean;
  manager_note: string | null;
  manager_edited: boolean;
  last_edited_by: string | null;
  last_edited_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ChildReportSectionInsert = Omit<ChildReportSection, "id" | "created_at" | "updated_at">;

// ── child_report_evidence ───────────────────────────────────────────────────

export interface ChildReportEvidence {
  id: string;
  section_id: string;
  report_id: string;
  source_table: string;
  source_record_id: string;
  source_date: string;
  excerpt: string | null;
  reasoning: string | null;
  relevance_score: number | null;
  is_child_voice: boolean;
  is_primary: boolean;
  created_at: string;
}

export type ChildReportEvidenceInsert = Omit<ChildReportEvidence, "id" | "created_at">;

// ── child_report_actions ────────────────────────────────────────────────────

export interface ChildReportAction {
  id: string;
  report_id: string;
  section_key: string | null;
  action_title: string;
  action_description: string | null;
  assigned_to: string | null;
  assigned_role: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "suggested" | "accepted" | "in_progress" | "completed" | "dismissed";
  linked_task_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ChildReportActionInsert = Omit<ChildReportAction, "id" | "created_at" | "updated_at">;

// ── aria_governance_settings ────────────────────────────────────────────────

export interface CaraGovernanceSettings {
  id: string;
  organisation_id: string;
  home_id: string | null;
  require_manager_approval_for_reports: boolean;
  require_evidence_for_all_sections: boolean;
  minimum_confidence_score: number;
  allow_auto_generation: boolean;
  allow_scheduled_generation: boolean;
  max_report_age_days: number;
  challenge_mode_enabled: boolean;
  challenge_severity_threshold: RiskTier;
  audit_all_agent_runs: boolean;
  enforce_child_voice: boolean;
  enforce_evidence_links: boolean;
  blocked_agents: AgentId[];
  custom_prompt_overrides: Record<string, string>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type CaraGovernanceSettingsInsert = Omit<CaraGovernanceSettings, "id" | "created_at" | "updated_at">;

// ── aria_prompt_templates ───────────────────────────────────────────────────

export interface CaraPromptTemplate {
  id: string;
  organisation_id: string;
  home_id: string | null;
  template_key: string;
  label: string;
  description: string | null;
  system_prompt: string;
  user_prompt_template: string;
  report_type: ReportType | null;
  audience: ReportAudience | null;
  agent_id: AgentId | null;
  version: number;
  is_active: boolean;
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type CaraPromptTemplateInsert = Omit<CaraPromptTemplate, "id" | "created_at" | "updated_at">;

// ── regulation45_evidence_items ─────────────────────────────────────────────

export interface Regulation45EvidenceItem {
  id: string;
  organisation_id: string;
  home_id: string;
  child_id: string | null;
  month: string;
  year: number;
  category: string;
  title: string;
  description: string | null;
  source_table: string;
  source_record_id: string;
  source_date: string;
  quality_score: number | null;
  is_child_voice: boolean;
  is_safeguarding: boolean;
  is_risk_related: boolean;
  agent_run_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  status: "suggested" | "accepted" | "rejected" | "included_in_report";
  created_at: string;
}

export type Regulation45EvidenceItemInsert = Omit<Regulation45EvidenceItem, "id" | "created_at">;

// ── aria_audit_events ───────────────────────────────────────────────────────

export interface CaraAuditEvent {
  id: string;
  organisation_id: string;
  home_id: string;
  event_type: string;
  agent_id: AgentId | null;
  agent_run_id: string | null;
  report_id: string | null;
  actor_id: string;
  actor_role: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  risk_tier: RiskTier | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export type CaraAuditEventInsert = Omit<CaraAuditEvent, "id" | "created_at">;

// ══════════════════════════════════════════════════════════════════════════════
// DATA INTERFACES — RUNTIME / COMPUTED
// ══════════════════════════════════════════════════════════════════════════════

// ── Normalised Evidence (retrieval layer) ───────────────────────────────────

export interface NormalisedEvidence {
  id: string;
  sourceTable: string;
  sourceRecordId: string;
  title: string;
  date: string;
  type: string;
  summary: string;
  childId: string | null;
  staffId: string | null;
  riskLevel: RiskTier | null;
  tags: string[];
}

// ── Report Generation Request ───────────────────────────────────────────────

export interface ReportGenerationRequest {
  organisationId: string;
  homeId: string;
  childId: string;
  reportType: ReportType;
  audience: ReportAudience;
  dateRangeStart: string;
  dateRangeEnd: string;
  requestedBy: string;
  includeSections?: string[];
}

// ── Report Generation Result ────────────────────────────────────────────────

export interface ReportGenerationResult {
  report: ChildReport;
  sections: ChildReportSection[];
  evidence: ChildReportEvidence[];
  suggestedActions: ChildReportAction[];
  challenges: ChallengeItem[];
}

// ── Challenge Mode ──────────────────────────────────────────────────────────

export type ChallengeType =
  | "missing_evidence"
  | "weak_confidence"
  | "missing_child_voice"
  | "contradictory_evidence"
  | "outdated_evidence"
  | "unsupported_claim"
  | "risk_not_addressed"
  | "plan_drift"
  | "missing_section"
  | "safeguarding_gap";

export type ChallengeSeverity = "info" | "warning" | "critical";

export interface ChallengeItem {
  type: ChallengeType;
  severity: ChallengeSeverity;
  message: string;
  sectionKey?: string;
  suggestion?: string;
}

// ── Agent Definition (registry) ─────────────────────────────────────────────

export interface AgentDefinition {
  id: AgentId;
  name: string;
  description: string;
  allowedActions: string[];
  prohibitedActions: string[];
  riskLevel: RiskTier;
  requiredRoles: string[];
  requiresHumanApproval: boolean;
  outputTypes: string[];
}

// ── Dashboard Summary ───────────────────────────────────────────────────────

export interface DashboardSummary {
  reportsThisWeek: number;
  reportsPendingReview: number;
  highRiskFlags: number;
  childrenNeedingOversight: number;
  reg45ItemsThisMonth: number;
  outstandingActions: number;
  evidenceGaps: number;
  weakRecords: number;
}
