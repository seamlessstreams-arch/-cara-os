// ══════════════════════════════════════════════════════════════════════════════
// CARA — CARE EVENT TYPES
// ══════════════════════════════════════════════════════════════════════════════

// ── Status & Category enums ───────────────────────────────────────────────────

export type CareEventStatus =
  | "draft"
  | "submitted"
  | "routing"
  | "routed"
  | "manager_review_required"
  | "returned"
  | "verified"
  | "locked"
  | "routing_failed";

export type CareEventCategory =
  | "general"
  | "behaviour"
  | "health"
  | "medication"
  | "education"
  | "family_contact"
  | "professional_contact"
  | "safeguarding"
  | "missing_episode"
  | "physical_intervention"
  | "restraint"
  | "complaint"
  | "activity"
  | "wellbeing"
  | "sleep"
  | "food"
  | "finance"
  | "other";

export type RouteType =
  | "daily_log"
  | "child_daily_summary"
  | "incident"
  | "missing_episode"
  | "physical_intervention"
  | "health_record"
  | "medication_record"
  | "education_record"
  | "family_contact_record"
  | "professional_contact_record"
  | "complaint_record"
  | "safeguarding_record"
  | "risk_assessment_task"
  | "behaviour_plan_task"
  | "followup_task"
  | "management_oversight"
  | "reg40_triage"
  | "reg44_evidence"
  | "reg45_evidence"
  | "annex_a_evidence"
  | "filing_cabinet"
  | "saved_time";

export type RouteStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "skipped"
  | "retry_required";

export type JobType =
  | "reg45_summary_update"
  | "annex_a_snapshot_update"
  | "inspection_readiness_update"
  | "pattern_analysis"
  | "pdf_generation"
  | "evidence_pack_export"
  | "filing_cabinet_index_rebuild"
  | "saved_time_metrics";

export type JobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "retry_required";

export type ManagerDecision = "pending" | "approved" | "accepted" | "rejected" | "deferred";

// ── Evidence prompt ───────────────────────────────────────────────────────────

export interface EvidencePrompt {
  id: string;
  question: string;
  required: boolean;
  answer?: string;
  completed: boolean;
}

// ── Routing summary ───────────────────────────────────────────────────────────

export interface RoutingSummary {
  records_updated: number;
  tasks_created: number;
  reg45_count: number;
  annex_a_count: number;
  areas_updated: string[];
}

// ── Care Event ────────────────────────────────────────────────────────────────

export interface CareEvent {
  id: string;
  home_id: string;
  child_id: string | null;
  shift_id: string | null;
  staff_id: string;
  verified_by: string | null;
  returned_by: string | null;
  locked_by: string | null;

  // Classification
  category: CareEventCategory;
  title: string;
  content: string;
  mood_score: number | null;
  is_significant: boolean;

  // Status
  status: CareEventStatus;
  event_date: string;
  event_time: string | null;

  // Flags
  requires_manager_review: boolean;
  requires_reg40_triage: boolean;
  contributes_to_reg45: boolean;
  contributes_to_annex_a: boolean;
  is_safeguarding: boolean;

  // Evidence prompts
  evidence_prompts: EvidencePrompt[];
  evidence_prompts_completed: boolean;

  // Signature
  staff_signature: boolean;
  staff_signed_at: string | null;

  // Manager actions
  manager_id: string | null;
  manager_review_note: string | null;
  manager_review_at: string | null;
  manager_review_completed: boolean;
  manager_signature: boolean;
  manager_notes: string | null;
  return_reason: string | null;
  returned_at: string | null;

  // Submission
  submitted_at: string | null;
  submitted_by: string | null;

  // Verification / lock
  verified_at: string | null;
  locked_at: string | null;

  // Versioning
  version: number;
  previous_version_id: string | null;
  amendment_reason: string | null;
  amended_by: string | null;
  amended_at: string | null;
  is_current_version: boolean;

  // Cara suggestions (not final record — require human approval)
  cara_suggested_summary: string | null;
  cara_suggested_category: CareEventCategory | null;
  cara_suggested_routing: RouteType[] | null;
  cara_suggested_reg45: string | null;
  cara_suggested_annex_a: string | null;
  cara_suggestions_reviewed: boolean;

  // Routing result
  routing_summary: RoutingSummary | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// ── Care Event Route ──────────────────────────────────────────────────────────

export interface CareEventRoute {
  id: string;
  care_event_id: string;
  home_id: string;
  route_type: RouteType;
  status: RouteStatus;
  linked_record_id: string | null;
  linked_record_table: string | null;
  processing_notes: string | null;
  error_message: string | null;
  retry_count: number;
  last_retried_at: string | null;
  time_saved_minutes: number;
  created_at: string;
  updated_at: string;
}

// ── Care Event Job ────────────────────────────────────────────────────────────

export interface CareEventJob {
  id: string;
  care_event_id: string;
  home_id: string;
  job_type: JobType;
  status: JobStatus;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  last_retried_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Audit Log ─────────────────────────────────────────────────────────────────

export type AuditAction =
  | "care_event_created"
  | "care_event_submitted"
  | "care_event_routed"
  | "care_event_route_failed"
  | "care_event_route_retried"
  | "care_event_verified"
  | "care_event_returned"
  | "care_event_amended"
  | "care_event_locked"
  | "evidence_prompt_completed"
  | "manager_review_completed"
  | "reg45_evidence_suggested"
  | "reg45_evidence_accepted"
  | "reg45_evidence_rejected"
  | "annex_a_evidence_suggested"
  | "annex_a_snapshot_generated"
  | "export_generated"
  | "permission_denied"
  | "validation_failed";

export interface CareEventAuditLog {
  id: string;
  care_event_id: string;
  home_id: string;
  action: AuditAction;
  actor_staff_id: string | null;
  actor_role: string | null;
  detail: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

// ── Reg 45 Evidence Queue ─────────────────────────────────────────────────────

export interface Reg45EvidenceItem {
  id: string;
  care_event_id: string;
  home_id: string;
  suggested_text: string;
  suggested_theme: string | null;
  suggested_section: string | null;
  manager_decision: ManagerDecision;
  manager_approved_text: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Annex A Evidence Queue ────────────────────────────────────────────────────

export interface AnnexAEvidenceItem {
  id: string;
  care_event_id: string;
  home_id: string;
  annex_section: string;
  suggested_text: string;
  manager_decision: ManagerDecision;
  manager_approved_text: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Child Daily Summary ───────────────────────────────────────────────────────

export interface ChildDailySummary {
  id: string;
  home_id: string;
  child_id: string;
  summary_date: string;
  event_count: number;
  significant_count: number;
  avg_mood_score: number | null;
  categories: CareEventCategory[];
  summary_text: string | null;
  requires_followup: boolean;
  generated_at: string;
  updated_at: string;
}

// ── API payload types ─────────────────────────────────────────────────────────

export interface CreateCareEventPayload {
  child_id?: string;
  shift_id?: string;
  category: CareEventCategory;
  title: string;
  content: string;
  mood_score?: number | null;
  is_significant?: boolean;
  event_date?: string;
  event_time?: string;
}

export interface SubmitCareEventPayload {
  staff_signature: true;
  evidence_answers?: Record<string, string>;
}

export interface VerifyCareEventPayload {
  manager_signature: true;
  manager_notes?: string;
}

export interface ReturnCareEventPayload {
  return_reason: string;
  manager_notes?: string;
}

export interface AmendCareEventPayload {
  amendment_reason: string;
  title?: string;
  content?: string;
  category?: CareEventCategory;
  mood_score?: number | null;
  is_significant?: boolean;
}

// ── Display labels ────────────────────────────────────────────────────────────

export const CARE_EVENT_STATUS_LABEL: Record<CareEventStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  routing: "Routing",
  routed: "Routed",
  manager_review_required: "Manager Review Required",
  returned: "Returned",
  verified: "Verified",
  locked: "Locked",
  routing_failed: "Routing Failed",
};

export const CARE_EVENT_CATEGORY_LABEL: Record<CareEventCategory, string> = {
  general: "General",
  behaviour: "Behaviour",
  health: "Health",
  medication: "Medication",
  education: "Education",
  family_contact: "Family Contact",
  professional_contact: "Professional Contact",
  safeguarding: "Safeguarding",
  missing_episode: "Missing Episode",
  physical_intervention: "Physical Intervention",
  restraint: "Restraint",
  complaint: "Complaint",
  activity: "Activity",
  wellbeing: "Wellbeing",
  sleep: "Sleep",
  food: "Food",
  finance: "Finance",
  other: "Other",
};

// ── Filing Cabinet ────────────────────────────────────────────────────────────

export type FilingCategory =
  | "daily_care"
  | "incident"
  | "health"
  | "medication"
  | "education"
  | "safeguarding"
  | "missing_episode"
  | "physical_intervention"
  | "family_contact"
  | "professional_contact"
  | "complaint"
  | "regulation_45"
  | "annex_a"
  | "regulation_40"
  | "management_oversight"
  | "other";

export interface FilingCabinetItem {
  id: string;
  care_event_id: string;
  home_id: string;
  child_id: string | null;
  category: FilingCategory;
  sub_category: string | null;
  title: string;
  description: string | null;
  source_type: string;
  linked_record_id: string | null;
  linked_record_table: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  tags: string[];
  filed_at: string;
  created_at: string;
  updated_at: string;
}

// ── Saved Time Metric ─────────────────────────────────────────────────────────

export interface SavedTimeMetric {
  id: string;
  care_event_id: string;
  home_id: string;
  route_type: RouteType;
  minutes_saved: number;
  activity_description: string;
  staff_id: string;
  recorded_at: string;
  created_at: string;
}

export const FILING_CATEGORY_LABEL: Record<FilingCategory, string> = {
  daily_care: "Daily Care",
  incident: "Incident",
  health: "Health",
  medication: "Medication",
  education: "Education",
  safeguarding: "Safeguarding",
  missing_episode: "Missing Episode",
  physical_intervention: "Physical Intervention",
  family_contact: "Family Contact",
  professional_contact: "Professional Contact",
  complaint: "Complaint",
  regulation_45: "Regulation 45",
  annex_a: "Annex A",
  regulation_40: "Regulation 40",
  management_oversight: "Management Oversight",
  other: "Other",
};

export const ROUTE_TYPE_LABEL: Record<RouteType, string> = {
  daily_log: "Daily Log",
  child_daily_summary: "Child Daily Summary",
  incident: "Incident Record",
  missing_episode: "Missing Episode",
  physical_intervention: "Physical Intervention Record",
  health_record: "Health Record",
  medication_record: "Medication Record",
  education_record: "Education Record",
  family_contact_record: "Family Contact Record",
  professional_contact_record: "Professional Contact Record",
  complaint_record: "Complaint Record",
  safeguarding_record: "Safeguarding Record",
  risk_assessment_task: "Risk Assessment Review Task",
  behaviour_plan_task: "Behaviour Plan Review Task",
  followup_task: "Follow-up Task",
  management_oversight: "Management Oversight Queue",
  reg40_triage: "Regulation 40 Triage",
  reg44_evidence: "Regulation 44 Evidence",
  reg45_evidence: "Regulation 45 Evidence Bank",
  annex_a_evidence: "Annex A Evidence Bank",
  filing_cabinet: "Filing Cabinet",
  saved_time: "Saved Time Tracker",
};
