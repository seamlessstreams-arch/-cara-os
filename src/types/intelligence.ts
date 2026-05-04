// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INTELLIGENCE LAYER TYPES
// ARIA-powered analysis, pattern detection and child experience tracking.
// ══════════════════════════════════════════════════════════════════════════════

// ── Utility / Shared ──────────────────────────────────────────────────────────

/** The ten wellbeing dimensions scored in child experience snapshots. */
export type ExperienceIndicator =
  | 'safety'
  | 'belonging'
  | 'regulation'
  | 'engagement'
  | 'relationships'
  | 'participation'
  | 'health'
  | 'education'
  | 'stability'
  | 'achievement';

/** All pattern types ARIA can detect. */
export type PatternAlertType =
  | 'contact_linked_incidents'
  | 'rota_dysregulation'
  | 'medication_refusal_cluster'
  | 'missing_escalation'
  | 'education_refusal'
  | 'staffing_inconsistency'
  | 'peer_tension'
  | 'sleep_disruption'
  | 'family_contact_trigger'
  | 'repeated_safeguarding_theme'
  | 'complaint_cluster'
  | 'chronology_gap'
  | 'plan_drift'
  | 'voice_absence';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export type InterventionCategory =
  | 'behaviour_support'
  | 'therapeutic'
  | 'educational'
  | 'relational'
  | 'health'
  | 'environmental'
  | 'routine'
  | 'communication'
  | 'other';

export type InterventionStatus = 'active' | 'paused' | 'stopped' | 'completed' | 'under_review';

export type ContinueRecommendation = 'continue' | 'adapt' | 'stop' | 'replace';

export type RelationalRecordType =
  | 'trusted_adult'
  | 'rupture_repair'
  | 'deescalation'
  | 'regulation_strategy'
  | 'sensory_need'
  | 'attachment_indicator'
  | 'avoidance_signal'
  | 'what_helps'
  | 'what_harms'
  | 'voice_moment'
  | 'participation_record';

export type PracticeBankCategory =
  | 'approach'
  | 'language'
  | 'avoid'
  | 'preparation'
  | 'repair'
  | 'deescalation'
  | 'sensory_regulation'
  | 'education_engagement'
  | 'contact_preparation'
  | 'respectful_challenge'
  | 'risk_reduction'
  | 'routine'
  | 'other';

export type DocumentJobStatus =
  | 'pending'
  | 'extracting'
  | 'classifying'
  | 'classified'
  | 'placed'
  | 'failed'
  | 'dismissed';

export type ClimateSnapshotPeriod = 'daily' | 'weekly' | 'monthly';

export type ActionOutcomeStatus =
  | 'agreed'
  | 'in_progress'
  | 'completed'
  | 'overdue'
  | 'stalled'
  | 'cancelled';

export type DidItWork = 'yes' | 'partially' | 'no' | 'too_early';

export type ActionContinueRecommendation = 'continue' | 'adapt' | 'stop';

export type EvidenceRefType =
  | 'incident'
  | 'daily_log'
  | 'medication'
  | 'task'
  | 'supervision'
  | 'training'
  | 'missing_episode'
  | 'chronology'
  | 'form'
  | 'voice_record';

export type EvidenceSignificance = 'routine' | 'significant' | 'critical';

export type SuggestedConfidentiality = 'standard' | 'restricted' | 'highly_restricted';

// ── Evidence Reference ────────────────────────────────────────────────────────

/** A pointer from an intelligence record back to the source evidence. */
export interface EvidenceRef {
  type: EvidenceRefType;
  id: string;
  date: string;           // ISO date string
  excerpt: string;
  significance: EvidenceSignificance;
}

// ── Document Classification ───────────────────────────────────────────────────

/** Full ARIA classification result stored in document_intelligence_jobs.classification. */
export interface DocumentClassification {
  document_type: string;  // e.g. 'incident_report' | 'medical_note' | 'school_update' | 'meeting_minutes'
  confidence: number;     // 0–1
  suggested_module: string;
  suggested_child_id?: string;
  suggested_staff_id?: string;
  suggested_form_type?: string;
  suggested_tags: string[];
  suggested_confidentiality: SuggestedConfidentiality;
  key_facts: string[];
  key_dates: string[];
  key_people: string[];
  risks_identified: string[];
  actions_identified: string[];
  child_voice_present: boolean;
  safeguarding_indicators: string[];
  missing_information: string[];
  recommended_placement: string;
  recommended_linkages: { type: string; description: string }[];
}

// ── ARIA Intelligence Request ─────────────────────────────────────────────────

/** Payload sent to the ARIA intelligence endpoint. */
export interface AriaIntelligenceRequest {
  mode:
    | 'experience_summary'
    | 'pattern_analysis'
    | 'document_classify'
    | 'document_to_form'
    | 'form_review'
    | 'oversight_draft'
    | 'chronology_summary'
    | 'voice_summary'
    | 'what_changed'
    | 'inspection_narrative'
    | 'rewrite';
  child_id?: string;
  style?: string;
  source_content?: string;
  document_text?: string;
  form_type?: string;
  linked_records?: unknown[];
  period_days?: number;
  question?: string;
}

// ── Child Experience Result ───────────────────────────────────────────────────

/** Computed result returned by ARIA before persisting to child_experience_snapshots. */
export interface ChildExperienceResult {
  child_id: string;
  period_start: string;
  period_end: string;
  scores: Record<ExperienceIndicator, number>;
  overall_score: number;
  score_delta: number | null;
  trend: 'improving' | 'stable' | 'worsening' | 'mixed';
  narrative: string;
  evidence_refs: EvidenceRef[];
  alerts: string[];
  strengths: string[];
  concerns: string[];
  missing_evidence: string[];
}

// ── Pattern Analysis Result ───────────────────────────────────────────────────

/** Full pattern analysis response from ARIA. */
export interface PatternAnalysisResult {
  patterns: DetectedPattern[];
  analysis_period_days: number;
  records_analysed: number;
  confidence: 'low' | 'medium' | 'high';
  generated_at: string;
}

/** A single pattern detected by ARIA. */
export interface DetectedPattern {
  type: PatternAlertType;
  title: string;
  description: string;
  severity: AlertSeverity;
  evidence: EvidenceRef[];
  suggested_actions: string[];
  reflective_prompt: string;
  recurrence_count: number;
}

// ── Home Climate Result ───────────────────────────────────────────────────────

/** Climate computation returned by ARIA before persisting to home_climate_snapshots. */
export interface HomeClimateResult {
  snapshot_date: string;
  scores: {
    staffing_consistency: number;
    incident_frequency: number;
    wellbeing: number;
    compliance: number;
    environment: number;
    peer_tension: number;
    overall: number;
  };
  delta: number | null;
  climate_level: 'settled' | 'stable' | 'unsettled' | 'concerning' | 'critical';
  hotspots: string[];
  narrative: string;
  attention_areas: string[];
}

// ── Table Row Types ───────────────────────────────────────────────────────────

// child_experience_snapshots

export interface ChildExperienceSnapshot {
  id: string;
  home_id: string;
  child_id: string;

  period_start: string;   // ISO date
  period_end: string;     // ISO date

  // Indicator scores
  safety_score: number;
  belonging_score: number;
  regulation_score: number;
  engagement_score: number;
  relationships_score: number;
  participation_score: number;
  health_score: number;
  education_score: number;
  stability_score: number;
  achievement_score: number;

  // Composite
  overall_score: number;
  score_delta: number | null;

  // ARIA output
  narrative: string;
  evidence_refs: EvidenceRef[];

  // Provenance
  computed_by: string;
  reviewed_by: string | null;

  created_at: string;
}

/** Insert payload — id and created_at are server-generated. */
export type ChildExperienceSnapshotInsert = Omit<ChildExperienceSnapshot, 'id' | 'created_at'>;

/** Convenience: scores keyed by indicator name. */
export type ExperienceScoreMap = Record<ExperienceIndicator, number>;

// ── pattern_alerts ────────────────────────────────────────────────────────────

export interface PatternAlert {
  id: string;
  home_id: string;
  child_id: string | null;    // null = home-wide alert

  alert_type: PatternAlertType;
  title: string;
  description: string;
  severity: AlertSeverity;

  status: AlertStatus;

  evidence_refs: EvidenceRef[];
  period_start: string | null;
  period_end: string | null;
  recurrence_count: number;

  first_detected_at: string;
  last_detected_at: string;

  acknowledged_by: string | null;
  acknowledged_at: string | null;

  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;

  suggested_actions: string[];

  created_at: string;
}

export type PatternAlertInsert = Omit<PatternAlert, 'id' | 'created_at' | 'first_detected_at' | 'last_detected_at'>;

export type PatternAlertUpdate = Partial<
  Pick<
    PatternAlert,
    | 'status'
    | 'acknowledged_by'
    | 'acknowledged_at'
    | 'resolved_by'
    | 'resolved_at'
    | 'resolution_notes'
    | 'recurrence_count'
    | 'last_detected_at'
    | 'evidence_refs'
    | 'suggested_actions'
  >
>;

// ── interventions ─────────────────────────────────────────────────────────────

export interface Intervention {
  id: string;
  home_id: string;
  child_id: string;

  title: string;
  description: string;
  rationale: string;

  category: InterventionCategory;

  started_by: string | null;
  started_at: string;         // ISO date
  agreed_by: string | null;
  review_date: string | null;

  status: InterventionStatus;

  intended_outcome: string;
  actual_outcome: string | null;
  effectiveness_rating: number | null;  // 1–5
  effectiveness_notes: string | null;
  what_changed: string | null;
  continue_recommendation: ContinueRecommendation | null;

  evidence_refs: EvidenceRef[];
  linked_task_id: string | null;

  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type InterventionInsert = Omit<Intervention, 'id' | 'created_at' | 'updated_at'>;

export type InterventionUpdate = Partial<
  Pick<
    Intervention,
    | 'status'
    | 'actual_outcome'
    | 'effectiveness_rating'
    | 'effectiveness_notes'
    | 'what_changed'
    | 'continue_recommendation'
    | 'review_date'
    | 'evidence_refs'
    | 'linked_task_id'
    | 'description'
    | 'rationale'
  >
>;

// ── relational_records ────────────────────────────────────────────────────────

export interface RelationalRecord {
  id: string;
  home_id: string;
  child_id: string;

  record_type: RelationalRecordType;

  title: string;
  description: string;
  staff_id: string | null;
  context: string | null;
  evidence: string | null;

  reviewed: boolean;
  review_date: string | null;
  is_active: boolean;

  tags: string[];

  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type RelationalRecordInsert = Omit<RelationalRecord, 'id' | 'created_at' | 'updated_at'>;

// ── practice_bank_entries ─────────────────────────────────────────────────────

export interface PracticeBankEntry {
  id: string;
  home_id: string;
  child_id: string;

  category: PracticeBankCategory;

  title: string;
  description: string;
  context: string | null;
  examples: string | null;

  added_by: string | null;
  verified_by: string | null;
  is_active: boolean;
  last_used_at: string | null;  // ISO date
  effectiveness_notes: string | null;

  created_at: string;
  updated_at: string;
}

export type PracticeBankEntryInsert = Omit<PracticeBankEntry, 'id' | 'created_at' | 'updated_at'>;

// ── voice_records ─────────────────────────────────────────────────────────────

export type VoiceRecordMethod =
  | 'direct_conversation'
  | 'key_work'
  | 'review'
  | 'form'
  | 'observation'
  | 'peer_discussion'
  | 'written'
  | 'creative_activity';

export interface VoiceRecord {
  id: string;
  home_id: string;
  child_id: string;

  record_date: string;          // ISO date
  method: VoiceRecordMethod | string;
  context: string | null;

  wishes_and_feelings: string;
  what_child_said: string | null;
  what_child_wants_to_happen: string | null;

  adult_response: string | null;
  action_taken: string | null;
  outcome: string | null;

  was_acted_on: boolean | null;
  acted_on_rationale: string | null;

  linked_to_plan: boolean;
  linked_plan_ref: string | null;

  captured_by: string | null;
  reviewed_by: string | null;

  tags: string[];

  created_at: string;
  updated_at: string;
}

export type VoiceRecordInsert = Omit<VoiceRecord, 'id' | 'created_at' | 'updated_at'>;

// ── document_intelligence_jobs ────────────────────────────────────────────────

export interface DocumentIntelligenceJob {
  id: string;
  home_id: string;

  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;

  raw_text: string | null;

  classification: DocumentClassification | null;

  status: DocumentJobStatus;

  placement_confirmed: boolean;
  placement_module: string | null;
  placement_record_id: string | null;
  placement_confirmed_by: string | null;
  placement_confirmed_at: string | null;

  form_draft_created: boolean;
  form_draft_id: string | null;

  chronology_entries_suggested: ChronologySuggestion[];
  actions_suggested: ActionSuggestion[];

  aria_summary: string | null;
  aria_confidence: number | null;  // 0–1

  error_message: string | null;

  uploaded_by: string | null;

  created_at: string;
  updated_at: string;
}

/** A single chronology entry that ARIA suggests adding after document analysis. */
export interface ChronologySuggestion {
  date: string;
  category: string;
  title: string;
  description: string;
  significance: EvidenceSignificance;
}

/** An action that ARIA suggests creating after document analysis. */
export interface ActionSuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  suggested_owner_role?: string;
  due_date?: string;
}

export type DocumentIntelligenceJobInsert = Omit<
  DocumentIntelligenceJob,
  'id' | 'created_at' | 'updated_at'
>;

export type DocumentIntelligenceJobUpdate = Partial<
  Pick<
    DocumentIntelligenceJob,
    | 'raw_text'
    | 'classification'
    | 'status'
    | 'placement_confirmed'
    | 'placement_module'
    | 'placement_record_id'
    | 'placement_confirmed_by'
    | 'placement_confirmed_at'
    | 'form_draft_created'
    | 'form_draft_id'
    | 'chronology_entries_suggested'
    | 'actions_suggested'
    | 'aria_summary'
    | 'aria_confidence'
    | 'error_message'
  >
>;

// ── home_climate_snapshots ────────────────────────────────────────────────────

export interface HomeClimateSnapshot {
  id: string;
  home_id: string;

  snapshot_date: string;        // ISO date
  period: ClimateSnapshotPeriod;

  staffing_consistency_score: number | null;
  incident_frequency_score: number | null;
  wellbeing_score: number | null;
  compliance_score: number | null;
  environment_score: number | null;
  peer_tension_score: number | null;

  overall_climate_score: number | null;
  climate_delta: number | null;

  hotspot_flags: string[];
  narrative: string | null;
  evidence_summary: Record<string, unknown>;

  created_at: string;
}

export type HomeClimateSnapshotInsert = Omit<HomeClimateSnapshot, 'id' | 'created_at'>;

// ── action_outcomes ───────────────────────────────────────────────────────────

export interface ActionOutcome {
  id: string;
  home_id: string;

  linked_task_id: string | null;
  linked_incident_id: string | null;
  linked_supervision_id: string | null;
  child_id: string | null;

  what_was_agreed: string;
  why_it_mattered: string;

  owner_id: string | null;
  due_date: string | null;        // ISO date

  status: ActionOutcomeStatus;

  what_was_done: string | null;
  what_changed: string | null;
  did_it_work: DidItWork | null;
  continue_recommendation: ActionContinueRecommendation | null;
  effectiveness_notes: string | null;

  evidence_refs: EvidenceRef[];

  escalated: boolean;
  escalation_reason: string | null;

  review_date: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;

  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type ActionOutcomeInsert = Omit<ActionOutcome, 'id' | 'created_at' | 'updated_at'>;

export type ActionOutcomeUpdate = Partial<
  Pick<
    ActionOutcome,
    | 'status'
    | 'what_was_done'
    | 'what_changed'
    | 'did_it_work'
    | 'continue_recommendation'
    | 'effectiveness_notes'
    | 'evidence_refs'
    | 'escalated'
    | 'escalation_reason'
    | 'review_date'
    | 'reviewed_by'
    | 'reviewed_at'
    | 'due_date'
  >
>;

// ── Joined / Enriched Types ───────────────────────────────────────────────────

/** ChildExperienceSnapshot joined with the child's name for display. */
export interface ChildExperienceSnapshotWithChild extends ChildExperienceSnapshot {
  young_people: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
    photo_url: string | null;
  };
}

/** PatternAlert joined with child and staff names for display. */
export interface PatternAlertWithDetails extends PatternAlert {
  young_people: {
    id: string;
    first_name: string;
    last_name: string;
    preferred_name: string | null;
  } | null;
  acknowledging_staff: {
    id: string;
    full_name: string;
  } | null;
}

/** Intervention joined with staff names. */
export interface InterventionWithStaff extends Intervention {
  starter: { id: string; full_name: string } | null;
  agreeing_staff: { id: string; full_name: string } | null;
  creator: { id: string; full_name: string } | null;
}

/** ActionOutcome with owner and source record details. */
export interface ActionOutcomeWithDetails extends ActionOutcome {
  owner: { id: string; full_name: string } | null;
  creator: { id: string; full_name: string } | null;
  reviewer: { id: string; full_name: string } | null;
}

// ── Dashboard Summary Types ───────────────────────────────────────────────────

/** Summary of intelligence activity for a home's dashboard. */
export interface IntelligenceDashboardSummary {
  active_alerts: number;
  critical_alerts: number;
  children_with_declining_scores: number;
  children_with_improving_scores: number;
  pending_documents: number;
  overdue_actions: number;
  latest_climate_score: number | null;
  climate_trend: 'improving' | 'stable' | 'worsening' | null;
  last_computed_at: string | null;
}

/** Per-child intelligence card shown in the children index. */
export interface ChildIntelligenceCard {
  child_id: string;
  overall_score: number | null;
  score_delta: number | null;
  trend: 'improving' | 'stable' | 'worsening' | 'mixed' | null;
  active_alerts: number;
  last_voice_record: string | null;  // ISO date
  has_practice_bank: boolean;
  active_interventions: number;
}
