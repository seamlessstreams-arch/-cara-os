// ══════════════════════════════════════════════════════════════════════════════
// Cara PRACTICE INTELLIGENCE — DOMAIN TYPES
//
// Cara is a practice-intelligence layer that DRAFTS, ADVISES and RECOGNISES.
// Central principle: Cara does not simply ask whether work was completed —
// it asks whether life became safer, more stable, more relational, more hopeful
// and more developmentally sufficient for the child.
//
// Central Cara questions:
//   "Are we closing the developmental gap?"
//   "What has become different for the child?"
//
// These are the PURE engine types (camelCase). Persisted store entities are
// snake_case (see the "Persistent entities" section) to match the wider store
// and the database column contract.
// ══════════════════════════════════════════════════════════════════════════════

// ── Engine vocabulary ─────────────────────────────────────────────────────────

export type CaraMode = "drafts" | "advises" | "recognises";

export type CaraSeverity = "low" | "medium" | "high" | "critical";

export type PracticeSourceType =
  | "daily_record"
  | "incident"
  | "risk_assessment"
  | "care_plan"
  | "placement_plan"
  | "key_work"
  | "supervision"
  | "audit"
  | "staff_development"
  | "safeguarding_concern"
  | "lado_concern"
  | "strategy_discussion"
  | "child_voice"
  | "education"
  | "health"
  | "family_contact"
  | "missing_episode"
  | "restraint"
  | "sanction"
  | "complaint";

export type CaraAssessmentType =
  | "practice_quality"
  | "developmental_gap"
  | "protective_factor"
  | "relationship_depth"
  | "threshold"
  | "lado"
  | "wellbeing"
  | "livers_analysis"
  | "general";

export type CaraFlagType =
  | "vague_recording"
  | "activity_over_impact"
  | "weak_child_voice"
  | "developmental_gap"
  | "overstated_protective_factor"
  | "safeguarding_threshold"
  | "extra_familial_harm"
  | "nrm_consideration"
  | "immediate_safety"
  | "lado_consideration"
  | "staff_wellbeing"
  | "relationship_depth"
  | "risk_drift"
  | "culture_drift"
  | "adult_centred_drift";

/**
 * Flag types that represent a safeguarding / escalation concern — they earn the
 * shield treatment in the panel and belong on the manager-oversight threshold
 * watchlist. Single source of truth so the list cannot drift across surfaces.
 */
export const SAFEGUARDING_FLAG_TYPES: CaraFlagType[] = [
  "safeguarding_threshold",
  "immediate_safety",
  "lado_consideration",
  "extra_familial_harm",
  "nrm_consideration",
];

/**
 * Child-safety risk signals for the "risk may be normalising" culture radar.
 * Excludes LADO (that concerns adult conduct, not the normalisation of risk to
 * a child) but includes extra-familial harm and NRM/modern-slavery concerns.
 */
export const CHILD_SAFEGUARDING_RISK_FLAG_TYPES: CaraFlagType[] = [
  "safeguarding_threshold",
  "immediate_safety",
  "extra_familial_harm",
  "nrm_consideration",
];

// The fourteen developmental domains a childhood reasonably requires.
export const DEVELOPMENTAL_DOMAINS = [
  "safety",
  "love",
  "belonging",
  "stability",
  "emotional security",
  "learning",
  "play",
  "opportunity",
  "identity",
  "hope",
  "trusted adult",
  "routine",
  "protection",
  "relational connection",
] as const;
export type DevelopmentalDomain = (typeof DEVELOPMENTAL_DOMAINS)[number];

// ── Engine input ──────────────────────────────────────────────────────────────

export interface CaraPracticeInput {
  /** The professional text to analyse (record, assessment, supervision note, etc.). */
  text: string;
  sourceType: PracticeSourceType;
  /** When supplied, the assessment + flags may be persisted and linked back. */
  sourceId?: string | null;
  assessmentType?: CaraAssessmentType;
  childId?: string | null;
  staffId?: string | null;
  homeId?: string | null;
  tenantId?: string | null;
  context?: Record<string, unknown>;
  /** Injectable for deterministic tests; defaults to today. */
  today?: string;
}

// ── Engine output building blocks ─────────────────────────────────────────────

export interface CaraQuestion {
  /** "so_what" | "livers" | "threshold" | "protective_factor" | "relationship" | "reflective" */
  domain: string;
  question: string;
}

export interface CaraFlag {
  flagType: CaraFlagType;
  severity: CaraSeverity;
  title: string;
  description: string;
  evidence: string[];
  recommendedAction: string;
  requiresManagerReview: boolean;
  requiresRiReview: boolean;
}

export interface CaraRecommendation {
  title: string;
  detail: string;
  urgency: "immediate" | "soon" | "planned";
}

export interface DevelopmentalGapResult {
  domain: string;
  expectedChildhoodCondition: string;
  currentLivedReality: string;
  gapDescription: string;
  severity: CaraSeverity;
  impactOnChild: string;
  requiredChange: string;
}

export interface ProtectiveFactorResult {
  factorDescription: string;
  isReal: boolean;
  challenge: string;
  questions: string[];
  riskOfOverstatement: CaraSeverity;
}

export interface RelationshipDepthResult {
  stage: 1 | 2 | 3 | 4 | 5;
  stageLabel: string;
  evidence: string;
  mainRisk: string;
  nextRelationalStep: string;
}

export interface ThresholdConsultationResult {
  concernSummary: string;
  childLivedExperience: string;
  evidenceAndHarm: string;
  immediateSafetyQuestion: string;
  strategyDiscussionRecommended: boolean;
  ladoConsultationRecommended: boolean;
  emergencyActionRecommended: boolean;
  /** Structured manager formulation (the "I believe the threshold is/is not met because…" block). */
  managerSummary: string;
}

/**
 * Every score is read off the record's own words. Null means the record gave
 * Cara nothing to read on that domain — never "clean", never "failing".
 */
export interface CaraPracticeScores {
  developmentalGap: number | null;
  livedExperience: number | null;
  protectiveFactors: number | null;
  relationshipDepth: number | null;
  safeguardingThreshold: number | null;
  staffWellbeing: number | null;
  overall: number | null;
}

export interface CaraPracticeOutput {
  /** Which Cara modes engaged for this input. */
  mode: CaraMode[];
  summary: string;
  scores: CaraPracticeScores;
  flags: CaraFlag[];
  questions: CaraQuestion[];
  recommendations: CaraRecommendation[];
  nextBestActions: string[];
  developmentalGaps: DevelopmentalGapResult[];
  protectiveFactors: ProtectiveFactorResult[];
  relationshipDepth: RelationshipDepthResult | null;
  threshold: ThresholdConsultationResult | null;
  requiresManagerReview: boolean;
  requiresRiReview: boolean;
  highestSeverity: CaraSeverity;
}

// ══════════════════════════════════════════════════════════════════════════════
// PERSISTENT ENTITIES (snake_case — match store + DB column contract)
// ══════════════════════════════════════════════════════════════════════════════

export interface CaraPracticeAssessment {
  id: string;
  tenant_id: string | null;
  child_id: string | null;
  staff_id: string | null;
  home_id: string | null;
  source_type: PracticeSourceType | string;
  source_id: string | null;
  assessment_type: CaraAssessmentType | string;
  status: "open" | "reviewed" | "closed";
  created_by: string;
  created_at: string;
  updated_at: string;
  developmental_gap_score: number | null;
  child_lived_experience_score: number | null;
  protective_factor_score: number | null;
  relationship_depth_score: number | null;
  safeguarding_threshold_score: number | null;
  supervision_quality_score: number | null;
  workforce_wellbeing_score: number | null;
  overall_practice_quality_score: number | null;
  summary: string;
  cara_advice: CaraRecommendation[];
  cara_flags: CaraFlag[];
  cara_recommendations: CaraRecommendation[];
  cara_questions: CaraQuestion[];
  cara_draft_output: Record<string, unknown> | null;
  reviewer_id: string | null;
  reviewed_at: string | null;
  manager_decision: string | null;
  manager_rationale: string | null;
}

export interface CaraDevelopmentalGapRecord {
  id: string;
  tenant_id: string | null;
  child_id: string;
  source_type: string | null;
  source_id: string | null;
  domain: string;
  expected_childhood_condition: string;
  current_lived_reality: string;
  gap_description: string;
  severity: CaraSeverity;
  evidence: string;
  impact_on_child: string;
  required_change: string;
  linked_plan_id: string | null;
  status: "open" | "in_progress" | "closed";
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CaraProtectiveFactorReview {
  id: string;
  tenant_id: string | null;
  child_id: string;
  source_type: string | null;
  source_id: string | null;
  factor_description: string;
  is_real: boolean;
  is_reliable: boolean;
  is_accessible: boolean;
  is_effective: boolean;
  is_lasting: boolean;
  proximity_score: number;
  strength_score: number;
  durability_score: number;
  relational_quality_score: number;
  what_it_protects_from: string;
  evidence_it_reduces_harm: string;
  what_happens_if_removed: string;
  cara_challenge: string;
  risk_of_overstatement: CaraSeverity;
  created_by: string;
  created_at: string;
}

export interface CaraRelationshipDepthReview {
  id: string;
  tenant_id: string | null;
  child_id: string;
  staff_id: string | null;
  relationship_subject_type: string;
  current_stage: 1 | 2 | 3 | 4 | 5;
  stage_label: string;
  evidence: string;
  main_risk: string;
  next_relational_step: string;
  child_voice: string;
  reviewed_by: string;
  created_at: string;
}

export interface CaraThresholdConsultation {
  id: string;
  tenant_id: string | null;
  child_id: string;
  concern_type: string;
  source_type: string | null;
  source_id: string | null;
  child_lived_experience: string;
  evidence_and_harm_analysis: string;
  family_functioning_parental_capacity: string;
  threshold_and_escalation_analysis: string;
  decision_rationale: string;
  recommended_next_step: string;
  reasonable_cause_to_suspect_significant_harm: boolean | null;
  strategy_discussion_recommended: boolean;
  lado_consultation_recommended: boolean;
  emergency_action_recommended: boolean;
  cara_summary: string;
  manager_decision: string | null;
  manager_rationale: string | null;
  created_by: string;
  created_at: string;
}

export interface CaraStaffWellbeingSignal {
  id: string;
  tenant_id: string | null;
  staff_id: string;
  home_id: string | null;
  signal_type: string;
  signal_source: string;
  severity: CaraSeverity;
  evidence: string;
  support_recommendation: string;
  manager_action: string | null;
  resolved: boolean;
  created_at: string;
}

export interface CaraPracticeFlag {
  id: string;
  tenant_id: string | null;
  child_id: string | null;
  staff_id: string | null;
  home_id: string | null;
  source_type: string | null;
  source_id: string | null;
  flag_type: CaraFlagType | string;
  severity: CaraSeverity;
  title: string;
  description: string;
  evidence: string;
  recommended_action: string;
  requires_manager_review: boolean;
  requires_ri_review: boolean;
  resolved: boolean;
  created_at: string;
  resolved_at: string | null;
  resolved_by?: string | null;
  resolution_rationale?: string | null;
}

export interface CaraGuidanceRule {
  id: string;
  rule_key: string;
  title: string;
  domain: string;
  trigger_conditions: { anyOf?: string[]; allOf?: string[]; note?: string };
  advice: string;
  challenge_questions: string[];
  recommended_actions: string[];
  severity: CaraSeverity;
  active: boolean;
  created_at: string;
}
