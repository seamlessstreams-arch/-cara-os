// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA STUDIO TYPES
// Complete TypeScript types for the ARIA Studio generative intelligence
// workspace. Every AI-generated output is a draft until a human approves it.
// ══════════════════════════════════════════════════════════════════════════════

// ── Enumerations ──────────────────────────────────────────────────────────────

export type AriaArtifactType =
  | "keywork_session"
  | "direct_work_session"
  | "child_friendly_worksheet"
  | "child_friendly_explanation"
  | "staff_training"
  | "quiz"
  | "flashcards"
  | "reflective_practice_prompt"
  | "management_oversight"
  | "incident_learning_review"
  | "risk_review"
  | "safeguarding_review"
  | "child_plan"
  | "placement_plan_update"
  | "care_plan_update"
  | "reg45_summary"
  | "annex_a_update"
  | "ofsted_readiness_summary"
  | "ri_briefing"
  | "social_worker_update"
  | "parent_professional_letter"
  | "team_meeting_discussion"
  | "supervision_prompt"
  | "audio_briefing_script"
  | "video_briefing_script"
  | "slide_deck_outline"
  | "mind_map"
  | "timeline"
  | "visual_formulation"
  | "action_plan"
  | "reflective_workbook"
  | "scenario_simulation";

export const ARIA_ARTIFACT_TYPE_LABELS: Record<AriaArtifactType, string> = {
  keywork_session: "Keywork Session",
  direct_work_session: "Direct Work Session",
  child_friendly_worksheet: "Child-Friendly Worksheet",
  child_friendly_explanation: "Child-Friendly Explanation",
  staff_training: "Staff Training",
  quiz: "Quiz",
  flashcards: "Flashcards",
  reflective_practice_prompt: "Reflective Practice Prompt",
  management_oversight: "Management Oversight",
  incident_learning_review: "Incident Learning Review",
  risk_review: "Risk Review",
  safeguarding_review: "Safeguarding Review",
  child_plan: "Child Plan",
  placement_plan_update: "Placement Plan Update",
  care_plan_update: "Care Plan Update",
  reg45_summary: "Regulation 45 Evidence Summary",
  annex_a_update: "Annex A Update",
  ofsted_readiness_summary: "Ofsted Readiness Summary",
  ri_briefing: "RI Briefing Pack",
  social_worker_update: "Social Worker Update",
  parent_professional_letter: "Parent / Professional Letter",
  team_meeting_discussion: "Team Meeting Discussion",
  supervision_prompt: "Supervision Prompt",
  audio_briefing_script: "Audio Briefing Script",
  video_briefing_script: "Video Briefing Script",
  slide_deck_outline: "Slide Deck Outline",
  mind_map: "Mind Map",
  timeline: "Timeline",
  visual_formulation: "Visual Formulation",
  action_plan: "Action Plan",
  reflective_workbook: "Reflective Workbook",
  scenario_simulation: "Scenario Simulation",
};

export type AriaArtifactStatus =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "committed"
  | "archived"
  | "deleted_recoverable";

export const ARIA_STATUS_LABELS: Record<AriaArtifactStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  changes_requested: "Changes Requested",
  approved: "Approved",
  rejected: "Rejected",
  committed: "Committed to Record",
  archived: "Archived",
  deleted_recoverable: "Deleted (Recoverable)",
};

export type AriaSourceType =
  | "daily_log"
  | "incident"
  | "keywork"
  | "direct_work"
  | "risk_assessment"
  | "placement_plan"
  | "care_plan"
  | "missing_from_care"
  | "education"
  | "health"
  | "medication"
  | "complaint"
  | "supervision"
  | "team_meeting"
  | "staff_training"
  | "reg45"
  | "annex_a"
  | "ofsted_evidence"
  | "policy"
  | "uploaded_document"
  | "task"
  | "rota"
  | "handover"
  | "safeguarding"
  | "management_oversight";

export const ARIA_SOURCE_TYPE_LABELS: Record<AriaSourceType, string> = {
  daily_log: "Daily Log",
  incident: "Incident Record",
  keywork: "Keywork Session",
  direct_work: "Direct Work",
  risk_assessment: "Risk Assessment",
  placement_plan: "Placement Plan",
  care_plan: "Care Plan",
  missing_from_care: "Missing from Care",
  education: "Education Record",
  health: "Health Record",
  medication: "Medication Record",
  complaint: "Complaint",
  supervision: "Supervision",
  team_meeting: "Team Meeting",
  staff_training: "Staff Training",
  reg45: "Regulation 45",
  annex_a: "Annex A",
  ofsted_evidence: "Ofsted Evidence",
  policy: "Policy",
  uploaded_document: "Uploaded Document",
  task: "Task",
  rota: "Rota",
  handover: "Handover",
  safeguarding: "Safeguarding",
  management_oversight: "Management Oversight",
};

export type AriaFramework =
  | "pace"
  | "ddp"
  | "arc"
  | "trauma_informed"
  | "therapeutic_parenting"
  | "restorative_practice"
  | "youth_work"
  | "psychologically_informed"
  | "relationship_based"
  | "safeguarding_led"
  | "strengths_based"
  | "attachment_informed"
  | "signs_of_safety"
  | "none";

export const ARIA_FRAMEWORK_LABELS: Record<AriaFramework, string> = {
  pace: "PACE (Playfulness, Acceptance, Curiosity, Empathy)",
  ddp: "DDP (Dyadic Developmental Psychotherapy)",
  arc: "ARC (Attachment, Regulation, Competency)",
  trauma_informed: "Trauma-Informed Practice",
  therapeutic_parenting: "Therapeutic Parenting",
  restorative_practice: "Restorative Practice",
  youth_work: "Youth Work Approach",
  psychologically_informed: "Psychologically Informed Practice",
  relationship_based: "Relationship-Based Practice",
  safeguarding_led: "Safeguarding-Led Practice",
  strengths_based: "Strengths-Based Practice",
  attachment_informed: "Attachment-Informed Practice",
  signs_of_safety: "Signs of Safety",
  none: "No specific framework",
};

export type AriaTone =
  | "professional"
  | "warm"
  | "child_friendly"
  | "formal"
  | "therapeutic"
  | "plain_english"
  | "legal_careful";

export const ARIA_TONE_LABELS: Record<AriaTone, string> = {
  professional: "Professional",
  warm: "Warm and supportive",
  child_friendly: "Child-friendly",
  formal: "Formal",
  therapeutic: "Therapeutic",
  plain_english: "Plain English",
  legal_careful: "Legal / careful",
};

export type AriaCreativeMode =
  | "conservative"
  | "balanced"
  | "creative"
  | "therapeutic"
  | "child_friendly"
  | "training_focused"
  | "inspection_ready"
  | "reflective"
  | "plain_english"
  | "professional_legal";

export const ARIA_CREATIVE_MODE_LABELS: Record<AriaCreativeMode, string> = {
  conservative: "Conservative",
  balanced: "Balanced",
  creative: "Creative",
  therapeutic: "Therapeutic",
  child_friendly: "Child-Friendly",
  training_focused: "Training-Focused",
  inspection_ready: "Inspection-Ready",
  reflective: "Reflective",
  plain_english: "Plain English",
  professional_legal: "Professional / Legal",
};

export type AriaEvidenceLevel = "high" | "medium" | "low" | "unverified" | "contradicted" | "missing";

export const ARIA_EVIDENCE_LEVEL_LABELS: Record<AriaEvidenceLevel, string> = {
  high: "High Confidence",
  medium: "Medium Confidence",
  low: "Low Confidence",
  unverified: "Unverified",
  contradicted: "Contradiction Found",
  missing: "Missing Evidence",
};

export type AriaGapType =
  | "missing_child_voice"
  | "outdated_risk_assessment"
  | "missing_management_oversight"
  | "missing_return_home_conversation"
  | "missing_debrief"
  | "missing_plan_update"
  | "overdue_action"
  | "weak_reg45_evidence"
  | "weak_annex_a_evidence"
  | "missing_supervision_follow_up"
  | "missing_training_response"
  | "missing_safeguarding_follow_up"
  | "missing_review_date"
  | "incomplete_recording";

export const ARIA_GAP_TYPE_LABELS: Record<AriaGapType, string> = {
  missing_child_voice: "Missing Child Voice",
  outdated_risk_assessment: "Outdated Risk Assessment",
  missing_management_oversight: "Missing Management Oversight",
  missing_return_home_conversation: "Missing Return-Home Conversation",
  missing_debrief: "Missing Debrief",
  missing_plan_update: "Missing Plan Update",
  overdue_action: "Overdue Action",
  weak_reg45_evidence: "Weak Regulation 45 Evidence",
  weak_annex_a_evidence: "Weak Annex A Evidence",
  missing_supervision_follow_up: "Missing Supervision Follow-Up",
  missing_training_response: "Missing Training Response",
  missing_safeguarding_follow_up: "Missing Safeguarding Follow-Up",
  missing_review_date: "Missing Review Date",
  incomplete_recording: "Incomplete Recording",
};

export type AriaAuditAction =
  | "source_indexed"
  | "artifact_generated"
  | "artifact_edited"
  | "artifact_submitted"
  | "artifact_reviewed"
  | "changes_requested"
  | "artifact_approved"
  | "artifact_rejected"
  | "artifact_committed"
  | "artifact_archived"
  | "artifact_deleted"
  | "artifact_recovered"
  | "task_created"
  | "quality_check_completed"
  | "safeguarding_alert_created"
  | "evidence_gap_detected"
  | "contradiction_detected";

// ── Core interfaces ───────────────────────────────────────────────────────────

export interface AriaStructuredSection {
  id: string;
  title: string;
  content: string;
  evidence_notes?: string;
  confidence?: AriaEvidenceLevel;
  requires_human_review?: boolean;
  is_ai_generated: boolean;
}

export interface AriaStructuredContent {
  sections: AriaStructuredSection[];
  known_evidence: string;
  analysis: string;
  professional_hypothesis: string;
  suggested_actions: string[];
  human_review_required: string[];
  framework_used: AriaFramework;
  framework_rationale: string;
  child_voice_notes: string | null;
  safeguarding_considerations: string | null;
  regulation_mapping: Record<string, string>;
  confidence_overall: AriaEvidenceLevel;
  confidence_rationale: string;
  generated_at: string;
  model_used: string;
  is_stub: boolean;
}

export interface AriaArtifact {
  id: string;
  artifact_type: AriaArtifactType;
  title: string;
  status: AriaArtifactStatus;
  child_id: string | null;
  home_id: string;
  staff_id: string | null;
  incident_id: string | null;
  linked_record_id: string | null;
  linked_record_type: string | null;
  framework: AriaFramework;
  tone: AriaTone;
  creative_mode: AriaCreativeMode;
  generated_content: string;
  structured_content: AriaStructuredContent | null;
  plain_text_content: string | null;
  quality_score: number | null;
  evidence_confidence_score: number | null;
  safeguarding_level: "none" | "low" | "medium" | "high";
  regulation_relevance: string[];
  source_ids: string[];
  created_by: string;
  reviewed_by: string | null;
  approved_by: string | null;
  committed_by: string | null;
  rejected_by: string | null;
  created_at: string;
  submitted_for_review_at: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  committed_at: string | null;
  rejected_at: string | null;
  archived_at: string | null;
  version_number: number;
  filing_cabinet_path: string | null;
  official_record_id: string | null;
  child_voice_present: boolean;
  quality_checks_passed: boolean;
  amendment_reason: string | null;
}

export interface AriaSource {
  id: string;
  home_id: string;
  child_id: string | null;
  staff_id: string | null;
  linked_record_id: string | null;
  linked_record_type: string | null;
  source_type: AriaSourceType;
  title: string;
  summary: string | null;
  content: string;
  extracted_text: string | null;
  source_date: string;
  category: string | null;
  tags: string[];
  confidentiality_level: "standard" | "sensitive" | "restricted";
  approval_status: "approved" | "pending" | "unverified";
  is_sensitive: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface AriaArtifactVersion {
  id: string;
  artifact_id: string;
  version_number: number;
  title: string;
  content: string;
  structured_content: AriaStructuredContent | null;
  change_summary: string;
  changed_by: string;
  changed_at: string;
  previous_version_id: string | null;
}

export interface AriaArtifactReview {
  id: string;
  artifact_id: string;
  reviewer_id: string;
  review_status: "approved" | "rejected" | "changes_requested";
  review_comment: string | null;
  requested_changes: string | null;
  created_at: string;
}

export interface AriaArtifactAction {
  id: string;
  artifact_id: string;
  task_id: string | null;
  action_title: string;
  action_description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "overdue";
  escalation_level: number;
  created_by: string;
  created_at: string;
  completed_at: string | null;
  reviewed_at: string | null;
}

export interface AriaQualityCheck {
  id: string;
  artifact_id: string;
  evidence_cited: boolean;
  child_voice_considered: boolean;
  risk_considered: boolean;
  safeguarding_considered: boolean;
  regulation_considered: boolean;
  actions_clear: boolean;
  owner_assigned: boolean;
  review_date_set: boolean;
  human_approval_complete: boolean;
  sensitive_language_reviewed: boolean;
  no_unsupported_claims: boolean;
  no_ai_style_filler: boolean;
  dignity_language_passed: boolean;
  overall_passed: boolean;
  issues: string[];
  created_at: string;
}

export interface AriaGap {
  id: string;
  home_id: string;
  child_id: string | null;
  staff_id: string | null;
  gap_type: AriaGapType;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  recommended_action: string;
  linked_record_id: string | null;
  linked_record_type: string | null;
  status: "open" | "in_progress" | "resolved" | "acknowledged";
  assigned_to: string | null;
  due_date: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface AriaStudioAuditLog {
  id: string;
  home_id: string;
  actor_id: string;
  action_type: AriaAuditAction;
  artifact_id: string | null;
  source_ids: string[];
  prompt_summary: string | null;
  model_provider: string | null;
  model_name: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// ── Home Dynamics ─────────────────────────────────────────────────────────────

export type AriaIndicatorStatus = "green" | "amber" | "red";

export interface AriaHomeDynamicsIndicator {
  key: string;
  label: string;
  value: number | string;
  status: AriaIndicatorStatus;
  detail: string;
}

export interface AriaHomeDynamicsSnapshot {
  id: string;
  home_id: string;
  snapshot_date: string;
  window_days: number;
  window_start: string;
  window_end: string;

  incidents_total: number;
  incidents_high_severity: number;
  incidents_open: number;
  incidents_oversight_outstanding: number;

  restraints_total: number;
  missing_episodes_total: number;
  missing_episodes_active: number;

  shifts_scheduled: number;
  shifts_completed: number;
  shifts_no_show: number;
  shifts_cancelled: number;
  staffing_stability_pct: number;

  tasks_overdue: number;

  overall_status: AriaIndicatorStatus;
  indicators: AriaHomeDynamicsIndicator[];
  narrative_summary: string;

  generated_by: string;
  generated_at: string;
  is_ai_draft: boolean;
}

// ── Request / response types ──────────────────────────────────────────────────

export interface AriaGenerationRequest {
  artifact_type: AriaArtifactType;
  title: string;
  child_id: string | null;
  home_id: string;
  staff_id: string | null;
  incident_id: string | null;
  linked_record_id: string | null;
  linked_record_type: string | null;
  framework: AriaFramework;
  tone: AriaTone;
  creative_mode: AriaCreativeMode;
  source_ids: string[];
  additional_context: string;
  requested_by: string;
  date_range_from: string | null;
  date_range_to: string | null;
}

export interface AriaGenerationResult {
  artifact: AriaArtifact;
  sources_used: AriaSource[];
  gaps_detected: AriaGap[];
  model_used: string;
  is_stub: boolean;
}

export interface AriaQuickActionContext {
  record_type: AriaSourceType;
  record_id: string;
  child_id?: string;
  home_id?: string;
  title?: string;
  summary?: string;
}

// ── API response wrappers ─────────────────────────────────────────────────────

export interface AriaArtifactListResponse {
  data: AriaArtifact[];
  meta: {
    total: number;
    draft: number;
    in_review: number;
    approved: number;
    committed: number;
  };
}

export interface AriaSourceListResponse {
  data: AriaSource[];
  meta: { total: number };
}

export interface AriaGapListResponse {
  data: AriaGap[];
  meta: {
    total: number;
    critical: number;
    high: number;
    open: number;
  };
}
