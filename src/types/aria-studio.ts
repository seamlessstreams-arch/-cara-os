// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ARIA STUDIO TYPE SYSTEM
// Complete type definitions for the therapeutic care intelligence studio.
// ══════════════════════════════════════════════════════════════════════════════

// ── Source types ─────────────────────────────────────────────────────────────

export const ARIA_STUDIO_SOURCE_TYPES = [
  "daily_log", "incident", "keywork", "direct_work", "risk_assessment",
  "placement_plan", "care_plan", "missing_from_care", "education", "health",
  "medication", "complaint", "supervision", "team_meeting", "staff_training",
  "reg45", "annex_a", "ofsted_evidence", "policy", "uploaded_document",
  "task", "rota", "handover", "safeguarding", "management_oversight",
] as const;
export type AriaStudioSourceType = (typeof ARIA_STUDIO_SOURCE_TYPES)[number];

export const SOURCE_TYPE_LABELS: Record<AriaStudioSourceType, string> = {
  daily_log: "Daily Log", incident: "Incident", keywork: "Key Work",
  direct_work: "Direct Work", risk_assessment: "Risk Assessment",
  placement_plan: "Placement Plan", care_plan: "Care Plan",
  missing_from_care: "Missing from Care", education: "Education",
  health: "Health", medication: "Medication", complaint: "Complaint",
  supervision: "Supervision", team_meeting: "Team Meeting",
  staff_training: "Staff Training", reg45: "Reg 45", annex_a: "Annex A",
  ofsted_evidence: "Ofsted Evidence", policy: "Policy",
  uploaded_document: "Uploaded Document", task: "Task", rota: "Rota",
  handover: "Handover", safeguarding: "Safeguarding",
  management_oversight: "Management Oversight",
};

// ── Artifact types ───────────────────────────────────────────────────────────

export const ARIA_STUDIO_ARTIFACT_TYPES = [
  "keywork_session", "direct_work_session", "child_friendly_worksheet",
  "child_friendly_explanation", "staff_training", "quiz", "flashcards",
  "management_oversight", "incident_learning_review", "risk_review",
  "safeguarding_review", "child_plan", "placement_plan_update",
  "care_plan_update", "reg45_summary", "annex_a_update",
  "ofsted_readiness_summary", "ri_briefing", "social_worker_update",
  "parent_professional_letter", "team_meeting_discussion",
  "supervision_prompt", "audio_briefing_script", "video_briefing_script",
  "slide_deck_outline", "mind_map", "timeline", "visual_formulation",
  "action_plan", "reflective_workbook", "scenario_simulation",
] as const;
export type AriaStudioArtifactType = (typeof ARIA_STUDIO_ARTIFACT_TYPES)[number];

export const ARTIFACT_TYPE_LABELS: Record<AriaStudioArtifactType, string> = {
  keywork_session: "Key Work Session",
  direct_work_session: "Direct Work Session",
  child_friendly_worksheet: "Child-Friendly Worksheet",
  child_friendly_explanation: "Child-Friendly Explanation",
  staff_training: "Staff Training",
  quiz: "Quiz",
  flashcards: "Flashcards",
  management_oversight: "Management Oversight",
  incident_learning_review: "Incident Learning Review",
  risk_review: "Risk Review",
  safeguarding_review: "Safeguarding Review",
  child_plan: "Child Plan",
  placement_plan_update: "Placement Plan Update",
  care_plan_update: "Care Plan Update",
  reg45_summary: "Reg 45 Evidence Summary",
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

// ── Artifact status ──────────────────────────────────────────────────────────

export const ARIA_STUDIO_STATUSES = [
  "draft", "in_review", "changes_requested", "approved",
  "rejected", "committed", "archived", "deleted_recoverable",
] as const;
export type AriaStudioArtifactStatus = (typeof ARIA_STUDIO_STATUSES)[number];

export const STATUS_LABELS: Record<AriaStudioArtifactStatus, string> = {
  draft: "Draft", in_review: "In Review", changes_requested: "Changes Requested",
  approved: "Approved", rejected: "Rejected", committed: "Committed",
  archived: "Archived", deleted_recoverable: "Deleted",
};

// ── Therapeutic frameworks ───────────────────────────────────────────────────

export const ARIA_STUDIO_FRAMEWORKS = [
  "pace", "ddp", "arc", "trauma_informed", "therapeutic_parenting",
  "restorative", "youth_work", "psychologically_informed",
  "relationship_based", "safeguarding_led", "strengths_based",
  "signs_of_safety", "attachment_informed",
] as const;
export type AriaStudioFramework = (typeof ARIA_STUDIO_FRAMEWORKS)[number];

export const FRAMEWORK_LABELS: Record<AriaStudioFramework, string> = {
  pace: "PACE", ddp: "DDP (Dyadic Developmental Psychotherapy)",
  arc: "ARC Framework", trauma_informed: "Trauma-Informed Practice",
  therapeutic_parenting: "Therapeutic Parenting",
  restorative: "Restorative Practice", youth_work: "Youth Work Approach",
  psychologically_informed: "Psychologically Informed Practice",
  relationship_based: "Relationship-Based Practice",
  safeguarding_led: "Safeguarding-Led Practice",
  strengths_based: "Strengths-Based Practice",
  signs_of_safety: "Signs of Safety", attachment_informed: "Attachment-Informed Practice",
};

// ── Tone / Creative mode ─────────────────────────────────────────────────────

export const ARIA_STUDIO_TONES = [
  "conservative", "balanced", "creative", "therapeutic", "child_friendly",
  "training_focused", "inspection_ready", "reflective", "plain_english",
  "professional_legal",
] as const;
export type AriaStudioTone = (typeof ARIA_STUDIO_TONES)[number];

export const TONE_LABELS: Record<AriaStudioTone, string> = {
  conservative: "Conservative", balanced: "Balanced", creative: "Creative",
  therapeutic: "Therapeutic", child_friendly: "Child-Friendly",
  training_focused: "Training-Focused", inspection_ready: "Inspection-Ready",
  reflective: "Reflective", plain_english: "Plain English",
  professional_legal: "Professional / Legal",
};

// ── Confidence ───────────────────────────────────────────────────────────────

export const CONFIDENCE_LEVELS = [
  "high", "medium", "low", "unverified", "contradicted", "missing",
] as const;
export type AriaStudioConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

// ── Gap types ────────────────────────────────────────────────────────────────

export const GAP_TYPES = [
  "missing_child_voice", "outdated_risk_assessment",
  "missing_management_oversight", "missing_return_home_conversation",
  "missing_debrief", "missing_plan_update", "overdue_action",
  "weak_reg45_evidence", "weak_annex_a_evidence",
  "missing_supervision_follow_up", "missing_training_response",
  "missing_safeguarding_follow_up", "missing_review_date",
  "incomplete_recording", "repeated_incidents_without_review",
] as const;
export type AriaStudioGapType = (typeof GAP_TYPES)[number];

// ── Safeguarding pattern types ───────────────────────────────────────────────

export const SAFEGUARDING_PATTERN_TYPES = [
  "missing_episode_escalation", "exploitation_indicator",
  "online_safety_risk", "peer_on_peer_concern", "self_harm_escalation",
  "substance_misuse_pattern", "concerning_contact", "isolation_increase",
  "emotional_deterioration", "allegation_pattern", "staff_practice_drift",
  "education_refusal_escalation",
] as const;
export type AriaStudioSafeguardingPatternType = (typeof SAFEGUARDING_PATTERN_TYPES)[number];

// ── Warning types ────────────────────────────────────────────────────────────

export const WARNING_TYPES = [
  "child_risk", "home_risk", "staffing_risk", "compliance_risk",
  "safeguarding_risk", "placement_stability_risk", "education_risk",
  "recording_quality_risk",
] as const;
export type AriaStudioWarningType = (typeof WARNING_TYPES)[number];

// ── Audit action types ───────────────────────────────────────────────────────

export const AUDIT_ACTION_TYPES = [
  "source_indexed", "artifact_generated", "artifact_edited",
  "artifact_submitted", "artifact_reviewed", "changes_requested",
  "artifact_approved", "artifact_rejected", "artifact_committed",
  "artifact_archived", "artifact_deleted", "artifact_recovered",
  "task_created", "quality_check_completed", "safeguarding_alert_created",
  "evidence_gap_detected", "contradiction_detected",
] as const;
export type AriaStudioAuditActionType = (typeof AUDIT_ACTION_TYPES)[number];

// ── Graph types ──────────────────────────────────────────────────────────────

export const NODE_TYPES = [
  "child", "home", "staff", "incident", "risk", "trigger",
  "protective_factor", "plan", "goal", "intervention", "action",
  "outcome", "regulation", "quality_standard", "evidence",
  "management_decision", "review", "safeguarding_concern", "training_need",
] as const;
export type AriaStudioNodeType = (typeof NODE_TYPES)[number];

export const RELATIONSHIP_TYPES = [
  "relates_to", "caused_by", "may_be_linked_to", "increases_risk_of",
  "reduces_risk_of", "addressed_by", "evidenced_by", "contradicts",
  "supports", "requires_action", "reviewed_by", "owned_by",
  "applies_to", "improves", "worsens",
] as const;
export type AriaStudioRelationshipType = (typeof RELATIONSHIP_TYPES)[number];

// ── Review status ────────────────────────────────────────────────────────────

export type AriaStudioReviewStatus = "approved" | "rejected" | "changes_requested";

// ── Evidence level ───────────────────────────────────────────────────────────

export type AriaStudioEvidenceLevel = "high" | "medium" | "low" | "unverified" | "contradicted" | "missing";

// ══════════════════════════════════════════════════════════════════════════════
// DATA INTERFACES
// ══════════════════════════════════════════════════════════════════════════════

export interface AriaStudioSource {
  id: string;
  home_id: string;
  child_id: string | null;
  staff_id: string | null;
  linked_record_id: string | null;
  linked_record_type: string | null;
  source_type: AriaStudioSourceType;
  title: string | null;
  summary: string | null;
  content: string | null;
  extracted_text: string | null;
  source_date: string | null;
  category: string | null;
  tags: string[];
  confidentiality_level: string;
  approval_status: string;
  is_sensitive: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface AriaStudioArtifact {
  id: string;
  home_id: string;
  artifact_type: AriaStudioArtifactType;
  title: string;
  status: AriaStudioArtifactStatus;
  child_id: string | null;
  staff_id: string | null;
  incident_id: string | null;
  linked_record_id: string | null;
  linked_record_type: string | null;
  framework: AriaStudioFramework | null;
  tone: AriaStudioTone;
  creative_mode: string;
  generated_content: string | null;
  structured_content: Record<string, unknown> | null;
  plain_text_content: string | null;
  quality_score: number | null;
  evidence_confidence_score: number | null;
  safeguarding_level: string;
  regulation_relevance: unknown[];
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
}

export interface AriaStudioArtifactSource {
  id: string;
  artifact_id: string;
  source_id: string;
  relevance_reason: string | null;
  confidence_level: AriaStudioConfidenceLevel;
  confidence_score: number | null;
  source_strength: string | null;
  is_primary_evidence: boolean;
  is_child_voice: boolean;
  is_contradicted: boolean;
  created_at: string;
}

export interface AriaStudioArtifactVersion {
  id: string;
  artifact_id: string;
  version_number: number;
  title: string | null;
  content: string | null;
  structured_content: Record<string, unknown> | null;
  change_summary: string | null;
  changed_by: string;
  changed_at: string;
  previous_version_id: string | null;
}

export interface AriaStudioArtifactReview {
  id: string;
  artifact_id: string;
  reviewer_id: string;
  review_status: AriaStudioReviewStatus;
  review_comment: string | null;
  requested_changes: string | null;
  created_at: string;
}

export interface AriaStudioArtifactAction {
  id: string;
  artifact_id: string;
  task_id: string | null;
  action_title: string;
  action_description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  escalation_level: string;
  created_by: string;
  created_at: string;
  completed_at: string | null;
  reviewed_at: string | null;
}

export interface AriaStudioAuditLog {
  id: string;
  home_id: string;
  actor_id: string;
  action_type: AriaStudioAuditActionType;
  artifact_id: string | null;
  source_ids: string[];
  prompt_summary: string | null;
  model_provider: string | null;
  model_name: string | null;
  request_metadata: Record<string, unknown> | null;
  response_metadata: Record<string, unknown> | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AriaStudioCareGraphNode {
  id: string;
  home_id: string;
  node_type: AriaStudioNodeType;
  linked_record_id: string | null;
  linked_record_type: string | null;
  label: string;
  summary: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AriaStudioCareGraphEdge {
  id: string;
  from_node_id: string;
  to_node_id: string;
  relationship_type: AriaStudioRelationshipType;
  strength: number | null;
  evidence_source_id: string | null;
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface AriaStudioEvidenceAssessment {
  id: string;
  source_id: string;
  relevance_score: number | null;
  recency_score: number | null;
  reliability_score: number | null;
  approval_score: number | null;
  corroboration_score: number | null;
  child_voice_score: number | null;
  contradiction_score: number | null;
  overall_confidence_score: number | null;
  evidence_level: AriaStudioEvidenceLevel;
  assessment_notes: string | null;
  created_at: string;
}

export interface AriaStudioGap {
  id: string;
  home_id: string;
  child_id: string | null;
  staff_id: string | null;
  gap_type: AriaStudioGapType;
  severity: string;
  title: string;
  description: string | null;
  recommended_action: string | null;
  linked_record_id: string | null;
  linked_record_type: string | null;
  status: string;
  assigned_to: string | null;
  due_date: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface AriaStudioContradiction {
  id: string;
  home_id: string;
  child_id: string | null;
  source_a_id: string | null;
  source_b_id: string | null;
  contradiction_type: string;
  description: string | null;
  severity: string;
  recommended_review_action: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface AriaStudioSafeguardingPattern {
  id: string;
  home_id: string;
  child_id: string | null;
  pattern_type: AriaStudioSafeguardingPatternType;
  risk_level: string;
  title: string;
  description: string | null;
  indicators: unknown[];
  evidence_source_ids: string[];
  recommended_actions: unknown[];
  status: string;
  created_at: string;
  reviewed_at: string | null;
  resolved_at: string | null;
}

export interface AriaStudioHomeDynamics {
  id: string;
  home_id: string;
  snapshot_date: string;
  summary: string | null;
  emotional_climate: string | null;
  incident_count: number;
  missing_episode_count: number;
  restraint_count: number;
  complaint_count: number;
  staff_absence_count: number;
  agency_staff_count: number;
  education_concerns_count: number;
  safeguarding_alerts_count: number;
  overdue_actions_count: number;
  risk_level: string;
  recommended_manager_focus: string | null;
  data: Record<string, unknown>;
  created_at: string;
}

export interface AriaStudioEarlyWarning {
  id: string;
  home_id: string;
  child_id: string | null;
  staff_id: string | null;
  warning_type: AriaStudioWarningType;
  risk_level: string;
  title: string;
  description: string | null;
  indicators: unknown[];
  confidence_score: number | null;
  recommended_action: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  resolved_at: string | null;
}

export interface AriaStudioFormulation {
  id: string;
  home_id: string;
  child_id: string;
  title: string;
  presenting_behaviour: string | null;
  possible_unmet_need: string | null;
  trauma_link: string | null;
  attachment_considerations: string | null;
  triggers: unknown[];
  protective_factors: unknown[];
  relational_strengths: unknown[];
  staff_response_patterns: unknown[];
  what_helps: string | null;
  what_escalates: string | null;
  therapeutic_hypothesis: string | null;
  recommended_intervention: string | null;
  review_date: string | null;
  evidence_source_ids: string[];
  created_by: string;
  approved_by: string | null;
  created_at: string;
  approved_at: string | null;
}

export interface AriaStudioDecisionSupport {
  id: string;
  home_id: string;
  decision_context: string;
  child_id: string | null;
  staff_id: string | null;
  known_facts: unknown[];
  unknowns: unknown[];
  risks: unknown[];
  options: unknown[];
  pros_cons: unknown[];
  child_impact: string | null;
  staff_impact: string | null;
  compliance_impact: string | null;
  recommended_next_steps: unknown[];
  evidence_needed: unknown[];
  decision_made_by: string | null;
  decision_recorded_at: string | null;
  created_at: string;
}

export interface AriaStudioQualityCheck {
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

// ══════════════════════════════════════════════════════════════════════════════
// REQUEST / RESPONSE TYPES
// ══════════════════════════════════════════════════════════════════════════════

export interface AriaStudioGenerateRequest {
  artifact_type: AriaStudioArtifactType;
  child_id?: string;
  home_id?: string;
  staff_id?: string;
  incident_id?: string;
  framework?: AriaStudioFramework;
  tone?: AriaStudioTone;
  creative_mode?: AriaStudioTone;
  source_ids?: string[];
  date_range?: { from: string; to: string };
  additional_context?: string;
}

export interface AriaStudioGenerateResponse {
  artifact: AriaStudioArtifact;
  sources_used: AriaStudioArtifactSource[];
  quality_check: AriaStudioQualityCheck | null;
  gaps_found: AriaStudioGap[];
  contradictions_found: AriaStudioContradiction[];
  safeguarding_alerts: AriaStudioSafeguardingPattern[];
}
