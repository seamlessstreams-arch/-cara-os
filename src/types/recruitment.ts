// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SAFER RECRUITMENT TYPES
// Full type system for the regulated safer recruitment module
// ══════════════════════════════════════════════════════════════════════════════

// ── Enums (as const arrays for runtime use) ──────────────────────────────────

export const RECRUITMENT_STAGES_V2 = [
  "enquiry", "application_received", "sift", "interview_scheduled",
  "interview_completed", "references_requested", "references_received",
  "dbs_submitted", "dbs_received", "conditional_offer", "pre_start_checks",
  "final_clearance", "onboarding", "appointed", "unsuccessful", "withdrawn"
] as const;
export type RecruitmentStageV2 = typeof RECRUITMENT_STAGES_V2[number];

export const CHECK_TYPES = [
  "enhanced_dbs", "barred_list", "right_to_work", "identity",
  "overseas_criminal_record", "professional_qualifications",
  "employment_history", "medical_fitness", "social_media",
  "references", "driving_licence", "safeguarding_training_check"
] as const;
export type CheckType = typeof CHECK_TYPES[number];

export const CHECK_STATUSES = [
  "not_started", "requested", "in_progress", "received",
  "verified", "concern_flagged", "override_approved", "not_required"
] as const;
export type CheckStatus = typeof CHECK_STATUSES[number];

export const REFERENCE_STATUSES = [
  "not_requested", "requested", "chased", "received",
  "satisfactory", "unsatisfactory", "concerns_noted", "verbal_only"
] as const;
export type ReferenceStatus = typeof REFERENCE_STATUSES[number];

export const INTERVIEW_TYPES = ["telephone_screen", "first_interview", "second_interview", "panel_interview", "informal_visit"] as const;
export type InterviewType = typeof INTERVIEW_TYPES[number];

export const INTERVIEW_RECOMMENDATIONS = ["strongly_recommend", "recommend", "borderline", "do_not_recommend"] as const;
export type InterviewRecommendation = typeof INTERVIEW_RECOMMENDATIONS[number];

export const OFFER_STATUSES = ["draft", "conditional_sent", "conditional_accepted", "conditional_declined", "final_sent", "final_accepted", "withdrawn"] as const;
export type OfferStatus = typeof OFFER_STATUSES[number];

export const GAP_STATUSES = ["detected", "explanation_requested", "explanation_received", "satisfactory", "unsatisfactory", "escalated"] as const;
export type GapStatus = typeof GAP_STATUSES[number];

export const COMPLIANCE_STATUSES_V2 = ["not_started", "in_progress", "blocked", "cleared", "exceptional_start", "failed"] as const;
export type ComplianceStatusV2 = typeof COMPLIANCE_STATUSES_V2[number];

export const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export type RiskLevel = typeof RISK_LEVELS[number];

export const CANDIDATE_SOURCES = ["indeed", "total_jobs", "reed", "staff_referral", "direct_application", "agency", "linkedin", "walk_in", "other"] as const;
export type CandidateSource = typeof CANDIDATE_SOURCES[number];

// ── Vacancy ──────────────────────────────────────────────────────────────────

export interface Vacancy {
  id: string;
  home_id: string;
  title: string;
  role_code: string; // e.g. "RCW", "TL", "RM"
  employment_type: "permanent" | "fixed_term" | "bank" | "agency";
  contract_type: "full_time" | "part_time" | "zero_hours";
  salary_min: number | null;
  salary_max: number | null;
  hours: number | null;
  shift_pattern: string | null;
  reports_to: string | null;
  safeguarding_statement: string;
  status: "draft" | "open" | "on_hold" | "filled" | "cancelled";
  approval_status: "pending" | "approved" | "rejected";
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Candidate Profile ────────────────────────────────────────────────────────

export interface CandidateProfile {
  id: string;
  home_id: string;
  vacancy_id: string | null;
  first_name: string;
  last_name: string;
  preferred_name: string | null;
  email: string;
  phone: string | null;
  dob: string | null;
  current_address: string | null;
  source: CandidateSource | null;
  current_stage: RecruitmentStageV2;
  compliance_status: ComplianceStatusV2;
  risk_level: RiskLevel;
  shortlisted: boolean;
  appointed: boolean;
  assigned_manager_id: string | null;
  cv_url: string | null;
  application_form_url: string | null;
  cover_letter_url: string | null;
  adjustments_requested: boolean;
  adjustments_notes: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// ── Employment History ────────────────────────────────────────────────────────

export interface EmploymentHistoryEntry {
  id: string;
  candidate_id: string;
  employer_name: string;
  role_title: string;
  start_date: string;
  end_date: string | null; // null = current
  reason_for_leaving: string | null;
  is_most_recent_relevant: boolean;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
}

// ── Gap Explanations ─────────────────────────────────────────────────────────

export interface GapExplanation {
  id: string;
  candidate_id: string;
  gap_start: string;
  gap_end: string;
  gap_days: number;
  explanation_text: string | null;
  status: GapStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
}

// ── Candidate Checks ─────────────────────────────────────────────────────────

export interface CandidateCheck {
  id: string;
  candidate_id: string;
  check_type: CheckType;
  status: CheckStatus;
  required: boolean;
  owner_id: string | null;
  due_date: string | null;
  requested_at: string | null;
  received_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  concern_flag: boolean;
  concern_summary: string | null;
  override_used: boolean;
  override_reason: string | null;
  overridden_by: string | null;
  overridden_at: string | null;
  certificate_number: string | null; // for DBS
  document_type: string | null; // for RTW
  document_expiry: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Candidate References ──────────────────────────────────────────────────────

export interface CandidateReference {
  id: string;
  candidate_id: string;
  referee_name: string;
  referee_role: string | null;
  organisation_name: string;
  email: string | null;
  phone: string | null;
  relationship_to_candidate: string;
  is_most_recent_employer: boolean;
  requested_at: string | null;
  chased_at: string | null;
  received_at: string | null;
  structured_response: {
    dates_of_employment_confirmed: boolean | null;
    role_confirmed: boolean | null;
    performance_rating: "excellent" | "good" | "satisfactory" | "poor" | null;
    disciplinary_concerns: boolean | null;
    safeguarding_concerns: boolean | null;
    would_re_employ: boolean | null;
    additional_comments: string | null;
  } | null;
  verbal_verification_completed: boolean;
  verbal_verified_by: string | null;
  verbal_verified_at: string | null;
  discrepancy_flag: boolean;
  discrepancy_notes: string | null;
  reliability_rating: "high" | "medium" | "low" | null;
  status: ReferenceStatus;
  created_at: string;
  updated_at: string;
}

// ── Interviews ────────────────────────────────────────────────────────────────

export interface CandidateInterview {
  id: string;
  candidate_id: string;
  vacancy_id: string | null;
  interview_type: InterviewType;
  scheduled_at: string;
  location: string | null;
  mode: "in_person" | "video" | "phone";
  panel: { staff_id: string; role_in_panel: string; safer_recruitment_trained: boolean }[];
  completed_at: string | null;
  recommendation: InterviewRecommendation | null;
  safeguarding_question_asked: boolean;
  motivation_question_asked: boolean;
  rationale: string | null;
  signed_off_by: string | null;
  signed_off_at: string | null;
  scores: InterviewScore[];
  created_at: string;
  updated_at: string;
}

export interface InterviewScore {
  id: string;
  interview_id: string;
  panel_member_id: string;
  category: "values_behaviours" | "safeguarding_awareness" | "relevant_experience" | "communication" | "motivation" | "resilience" | "teamwork";
  score: 1 | 2 | 3 | 4 | 5;
  notes: string | null;
  created_at: string;
}

// ── Conditional Offer ─────────────────────────────────────────────────────────

export interface ConditionalOffer {
  id: string;
  candidate_id: string;
  status: OfferStatus;
  conditional_offer_sent_at: string | null;
  proposed_start_date: string | null;
  salary: number | null;
  hours: number | null;
  probation_months: number;
  conditions: string[]; // list of outstanding conditions e.g. "Clear DBS", "2 satisfactory references"
  exceptional_start: boolean;
  exceptional_start_approved_by: string | null;
  exceptional_start_rationale: string | null;
  exceptional_start_risk_mitigation: string | null;
  final_clearance_completed_at: string | null;
  final_clearance_by: string | null;
  created_at: string;
  updated_at: string;
}

// ── Recruitment Audit ─────────────────────────────────────────────────────────

export interface RecruitmentAuditEntry {
  id: string;
  candidate_id: string | null;
  vacancy_id: string | null;
  actor_id: string;
  event_type: string; // e.g. "check_verified", "stage_changed", "reference_received"
  entity_type: string; // e.g. "candidate_check", "candidate_reference"
  entity_id: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
}

// ── Rules Engine ──────────────────────────────────────────────────────────────

export interface RulesResult {
  candidate_id: string;
  can_progress: boolean;
  permitted_next_stages: RecruitmentStageV2[];
  blockers: RulesBlocker[];
  warnings: RulesWarning[];
  auto_tasks: AutoTask[];
  aria_suggestions: string[];
}

export interface RulesBlocker {
  code: string;
  message: string;
  entity_type: string;
  entity_id: string | null;
  severity: "blocker" | "warning";
}

export interface RulesWarning {
  code: string;
  message: string;
  recommended_action: string;
}

export interface AutoTask {
  title: string;
  description: string;
  owner_role: string;
  due_days_from_now: number;
  priority: "low" | "medium" | "high" | "urgent";
}

// ── Enriched Candidate for UI ─────────────────────────────────────────────────

export interface CandidateEnriched extends CandidateProfile {
  vacancy: Vacancy | null;
  checks: CandidateCheck[];
  references: CandidateReference[];
  employment_history: EmploymentHistoryEntry[];
  gaps: GapExplanation[];
  interviews: CandidateInterview[];
  offer: ConditionalOffer | null;
  rules: RulesResult | null;
  compliance_score: number; // 0-100
  days_in_stage: number;
}
