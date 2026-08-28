// ══════════════════════════════════════════════════════════════════════════════
// CARA — INTELLIGENCE LAYER TYPES
// Cara-powered analysis, pattern detection and child experience tracking.
// ══════════════════════════════════════════════════════════════════════════════

// ── Utility / Shared ──────────────────────────────────────────────────────────

/** The ten wellbeing dimensions scored in child experience snapshots. */
// ─────────────────────────────────────────────────────────────────────────────
// These eleven were declared here AND in ./extended with different shapes and,
// for the relational vocabulary, different spellings. Nothing imported this
// file's copies — but two modals imported the wrong same-named `Intervention`
// and `PracticeBankEntry` and silently dropped what the user typed (#1047).
// One source of truth, re-exported so anything reaching for them here gets the
// definitions the store actually holds.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  ActionOutcome,
  AlertSeverity,
  AlertStatus,
  ChildExperienceSnapshot,
  DocumentIntelligenceJob,
  HomeClimateSnapshot,
  Intervention,
  InterventionStatus,
  PatternAlert,
  PracticeBankEntry,
  RelationalRecord,
  RelationalRecordType,
  VoiceRecord,
} from "./extended";

export type {
  ActionOutcome,
  AlertSeverity,
  AlertStatus,
  ChildExperienceSnapshot,
  DocumentIntelligenceJob,
  HomeClimateSnapshot,
  Intervention,
  InterventionStatus,
  PatternAlert,
  PracticeBankEntry,
  RelationalRecord,
  RelationalRecordType,
  VoiceRecord,
};

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

/** All pattern types Cara can detect. */
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


export type ContinueRecommendation = 'continue' | 'adapt' | 'stop' | 'replace';

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

/** Full Cara classification result stored in document_intelligence_jobs.classification. */
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

// ── Cara Intelligence Request ─────────────────────────────────────────────────

/** Payload sent to the Cara intelligence endpoint. */
export interface CaraIntelligenceRequest {
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

/** Computed result returned by Cara before persisting to child_experience_snapshots. */
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

/** Full pattern analysis response from Cara. */
export interface PatternAnalysisResult {
  patterns: DetectedPattern[];
  analysis_period_days: number;
  records_analysed: number;
  confidence: 'low' | 'medium' | 'high';
  generated_at: string;
}

/** A single pattern detected by Cara. */
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

/** Climate computation returned by Cara before persisting to home_climate_snapshots. */
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


/** Insert payload — id and created_at are server-generated. */
export type ChildExperienceSnapshotInsert = Omit<ChildExperienceSnapshot, 'id' | 'created_at'>;

/** Convenience: scores keyed by indicator name. */
export type ExperienceScoreMap = Record<ExperienceIndicator, number>;

// ── pattern_alerts ────────────────────────────────────────────────────────────


export type PatternAlertInsert = Omit<PatternAlert, 'id' | 'created_at' | 'first_detected_at' | 'last_detected_at'>;

// ── interventions ─────────────────────────────────────────────────────────────


export type InterventionInsert = Omit<Intervention, 'id' | 'created_at' | 'updated_at'>;

// ── relational_records ────────────────────────────────────────────────────────


// ── practice_bank_entries ─────────────────────────────────────────────────────


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


export type VoiceRecordInsert = Omit<VoiceRecord, 'id' | 'created_at' | 'updated_at'>;

// ── document_intelligence_jobs ────────────────────────────────────────────────


/** A single chronology entry that Cara suggests adding after document analysis. */
export interface ChronologySuggestion {
  date: string;
  category: string;
  title: string;
  description: string;
  significance: EvidenceSignificance;
}

/** An action that Cara suggests creating after document analysis. */
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

// ── home_climate_snapshots ────────────────────────────────────────────────────


export type HomeClimateSnapshotInsert = Omit<HomeClimateSnapshot, 'id' | 'created_at'>;

// ── action_outcomes ───────────────────────────────────────────────────────────


export type ActionOutcomeInsert = Omit<ActionOutcome, 'id' | 'created_at' | 'updated_at'>;

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
