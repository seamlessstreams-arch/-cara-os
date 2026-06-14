// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRACTICE INTELLIGENCE TYPE SYSTEM
// Types for the Therapeutic Curriculum Hub: profiles, sessions, learning
// resources, oversight intelligence, regulation mapping, and workflow triggers.
// ══════════════════════════════════════════════════════════════════════════════

// ── Extended Therapeutic Frameworks ─────────────────────────────────────────
// Adds frameworks not in the base Cara Studio type system

export const PRACTICE_INTELLIGENCE_FRAMEWORKS = [
  "pace", "ddp", "arc", "trauma_informed", "therapeutic_parenting",
  "restorative", "youth_work", "psychologically_informed",
  "relationship_based", "safeguarding_led", "strengths_based",
  "signs_of_safety", "attachment_informed",
  // New frameworks
  "social_pedagogy", "mentalisation", "neurodiversity_informed",
  "anti_oppressive", "developmental_trauma",
] as const;
export type PracticeIntelligenceFramework = (typeof PRACTICE_INTELLIGENCE_FRAMEWORKS)[number];

export const EXTENDED_FRAMEWORK_LABELS: Record<string, string> = {
  social_pedagogy: "Social Pedagogy",
  mentalisation: "Mentalisation-Based Practice",
  neurodiversity_informed: "Neurodiversity-Informed Practice",
  anti_oppressive: "Anti-Oppressive Practice",
  developmental_trauma: "Developmental Trauma Framework",
};

// ── Session Types ───────────────────────────────────────────────────────────

export const SESSION_TYPES = [
  // Existing
  "keywork_session", "direct_work_session",
  // Therapeutic work
  "life_story_work", "identity_work", "feelings_exploration",
  "anger_management", "anxiety_support", "bereavement_grief",
  "self_esteem_building", "social_skills", "healthy_relationships",
  "emotional_regulation", "mindfulness_grounding", "resilience_building",
  // Transitions and independence
  "transition_preparation", "independence_skills", "leaving_care_prep",
  // Contact and family
  "contact_preparation", "contact_debrief", "family_work",
  // Safety and wellbeing
  "safety_planning", "return_from_missing", "exploitation_awareness",
  "online_safety", "substance_awareness", "consent_boundaries",
  // Education and aspiration
  "education_motivation", "aspiration_building", "career_exploration",
  // Identity
  "cultural_identity", "gender_identity_support", "faith_spirituality",
  // Staff-facing
  "reflective_practice", "team_formulation", "debrief_session",
] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  keywork_session: "Key Work Session",
  direct_work_session: "Direct Work Session",
  life_story_work: "Life Story Work",
  identity_work: "Identity Work",
  feelings_exploration: "Feelings Exploration",
  anger_management: "Anger Management",
  anxiety_support: "Anxiety Support",
  bereavement_grief: "Bereavement & Grief",
  self_esteem_building: "Self-Esteem Building",
  social_skills: "Social Skills",
  healthy_relationships: "Healthy Relationships",
  emotional_regulation: "Emotional Regulation",
  mindfulness_grounding: "Mindfulness & Grounding",
  resilience_building: "Resilience Building",
  transition_preparation: "Transition Preparation",
  independence_skills: "Independence Skills",
  leaving_care_prep: "Leaving Care Preparation",
  contact_preparation: "Contact Preparation",
  contact_debrief: "Contact Debrief",
  family_work: "Family Work",
  safety_planning: "Safety Planning",
  return_from_missing: "Return from Missing",
  exploitation_awareness: "Exploitation Awareness",
  online_safety: "Online Safety",
  substance_awareness: "Substance Awareness",
  consent_boundaries: "Consent & Boundaries",
  education_motivation: "Education Motivation",
  aspiration_building: "Aspiration Building",
  career_exploration: "Career Exploration",
  cultural_identity: "Cultural Identity",
  gender_identity_support: "Gender Identity Support",
  faith_spirituality: "Faith & Spirituality",
  reflective_practice: "Reflective Practice",
  team_formulation: "Team Formulation",
  debrief_session: "Debrief Session",
};

// ── Learning Resource Types ─────────────────────────────────────────────────

export const LEARNING_RESOURCE_TYPES = [
  // Existing base
  "staff_training", "quiz", "flashcards",
  // New formats
  "questionnaire", "infographic", "competency_checklist",
  "role_play_scenario", "case_study_exercise", "pace_language_alternatives",
  "arc_formulation_cards", "reflective_workbook", "micro_learning",
  "video_briefing_script", "audio_briefing_script", "slide_deck",
  "poster", "quick_reference_card", "policy_summary",
  "supervision_prompt_pack", "team_meeting_pack", "induction_guide",
] as const;
export type LearningResourceType = (typeof LEARNING_RESOURCE_TYPES)[number];

export const LEARNING_RESOURCE_TYPE_LABELS: Record<LearningResourceType, string> = {
  staff_training: "Staff Training Session",
  quiz: "Knowledge Quiz",
  flashcards: "Flashcard Set",
  questionnaire: "Questionnaire",
  infographic: "Infographic",
  competency_checklist: "Competency Checklist",
  role_play_scenario: "Role-Play Scenario",
  case_study_exercise: "Case Study Exercise",
  pace_language_alternatives: "PACE Language Alternatives",
  arc_formulation_cards: "ARC Formulation Cards",
  reflective_workbook: "Reflective Workbook",
  micro_learning: "Micro-Learning Module",
  video_briefing_script: "Video Briefing Script",
  audio_briefing_script: "Audio Briefing Script",
  slide_deck: "Slide Deck",
  poster: "Poster / Wall Display",
  quick_reference_card: "Quick Reference Card",
  policy_summary: "Policy Summary",
  supervision_prompt_pack: "Supervision Prompt Pack",
  team_meeting_pack: "Team Meeting Pack",
  induction_guide: "Induction Guide",
};

// ── Management Oversight Types ──────────────────────────────────────────────

export const OVERSIGHT_TYPES = [
  "daily_log_oversight", "incident_oversight", "missing_from_care_oversight",
  "medication_oversight", "restraint_oversight", "complaint_oversight",
  "safeguarding_oversight", "education_oversight", "health_oversight",
  "contact_oversight", "risk_assessment_oversight", "placement_plan_oversight",
  "care_plan_oversight", "key_work_oversight", "direct_work_oversight",
  "staff_supervision_oversight", "training_oversight", "rota_oversight",
  "admission_discharge_oversight",
] as const;
export type OversightType = (typeof OVERSIGHT_TYPES)[number];

export const OVERSIGHT_TYPE_LABELS: Record<OversightType, string> = {
  daily_log_oversight: "Daily Log Oversight",
  incident_oversight: "Incident Oversight",
  missing_from_care_oversight: "Missing from Care Oversight",
  medication_oversight: "Medication Oversight",
  restraint_oversight: "Restraint Oversight",
  complaint_oversight: "Complaint Oversight",
  safeguarding_oversight: "Safeguarding Oversight",
  education_oversight: "Education Oversight",
  health_oversight: "Health Oversight",
  contact_oversight: "Contact Oversight",
  risk_assessment_oversight: "Risk Assessment Oversight",
  placement_plan_oversight: "Placement Plan Oversight",
  care_plan_oversight: "Care Plan Oversight",
  key_work_oversight: "Key Work Oversight",
  direct_work_oversight: "Direct Work Oversight",
  staff_supervision_oversight: "Supervision Oversight",
  training_oversight: "Training Oversight",
  rota_oversight: "Rota & Staffing Oversight",
  admission_discharge_oversight: "Admission / Discharge Oversight",
};

// ── Regulation / Quality Standards ──────────────────────────────────────────

export const REGULATION_FRAMEWORKS = [
  "childrens_homes_regs_2015", "quality_standards_2015", "sccif",
  "working_together_2023", "keeping_children_safe_2023",
  "care_standards_act_2000", "health_and_safety_at_work_1974",
  "equality_act_2010", "data_protection_act_2018", "mental_capacity_act_2005",
] as const;
export type RegulationFramework = (typeof REGULATION_FRAMEWORKS)[number];

export const REGULATION_LABELS: Record<RegulationFramework, string> = {
  childrens_homes_regs_2015: "Children's Homes (England) Regulations 2015",
  quality_standards_2015: "Quality Standards 2015",
  sccif: "Social Care Common Inspection Framework",
  working_together_2023: "Working Together to Safeguard Children 2023",
  keeping_children_safe_2023: "Keeping Children Safe in Education 2023",
  care_standards_act_2000: "Care Standards Act 2000",
  health_and_safety_at_work_1974: "Health & Safety at Work Act 1974",
  equality_act_2010: "Equality Act 2010",
  data_protection_act_2018: "Data Protection Act 2018",
  mental_capacity_act_2005: "Mental Capacity Act 2005",
};

export const SCCIF_THEMES = [
  "overall_experiences_progress",
  "how_well_children_helped_protected",
  "effectiveness_leaders_managers",
] as const;
export type SCCIFTheme = (typeof SCCIF_THEMES)[number];

export const SCCIF_THEME_LABELS: Record<SCCIFTheme, string> = {
  overall_experiences_progress: "Overall Experiences & Progress of Children",
  how_well_children_helped_protected: "How Well Children Are Helped & Protected",
  effectiveness_leaders_managers: "Effectiveness of Leaders & Managers",
};

// ── Workflow Trigger Types ──────────────────────────────────────────────────

export const WORKFLOW_TRIGGER_EVENTS = [
  "incident_created", "incident_updated", "missing_episode_created",
  "restraint_recorded", "safeguarding_concern_raised", "complaint_created",
  "risk_assessment_updated", "placement_plan_reviewed", "care_plan_reviewed",
  "keywork_completed", "direct_work_completed", "supervision_completed",
  "training_completed", "medication_error", "education_concern",
  "health_appointment", "contact_session", "admission", "discharge",
  "daily_log_created", "handover_completed", "staff_absence",
] as const;
export type WorkflowTriggerEvent = (typeof WORKFLOW_TRIGGER_EVENTS)[number];

// ══════════════════════════════════════════════════════════════════════════════
// DATA INTERFACES
// ══════════════════════════════════════════════════════════════════════════════

// ── Therapeutic Profile ─────────────────────────────────────────────────────

export interface TherapeuticProfile {
  id: string;
  home_id: string;
  child_id: string;
  status: "draft" | "active" | "archived";
  version: number;

  // Core formulation
  pre_placement_history: string | null;
  known_trauma_themes: string[];
  attachment_presentation: string | null;
  emotional_regulation_needs: string[];
  known_triggers: string[];
  known_soothing_strategies: string[];
  relational_strengths: string[];
  staff_relationships: StaffRelationship[];
  family_contact_themes: string[];
  education_themes: string[];
  identity_culture_belonging: string[];
  communication_style: string | null;
  neurodiversity_considerations: string[];
  risk_themes: string[];
  protective_factors: string[];
  current_presentation: string | null;
  progress_over_time: ProgressEntry[];
  child_voice_entries: ChildVoiceEntry[];
  what_staff_need_to_remember: string[];
  what_helps: string[];
  what_does_not_help: string[];
  current_therapeutic_priorities: TherapeuticPriority[];

  // Approval
  approved_by: string | null;
  approved_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface StaffRelationship {
  staffId: string;
  staffName: string;
  quality: "strong" | "developing" | "strained" | "new";
  notes: string;
}

export interface ProgressEntry {
  date: string;
  area: string;
  direction: "improving" | "stable" | "declining";
  note: string;
}

export interface ChildVoiceEntry {
  date: string;
  context: string;
  quote: string;
  theme: string;
  sentiment: "positive" | "negative" | "neutral" | "mixed";
}

export interface TherapeuticPriority {
  title: string;
  description: string;
  framework: PracticeIntelligenceFramework;
  targetDate: string | null;
  status: "active" | "achieved" | "paused";
}

// ── Practice Intelligence Scan ──────────────────────────────────────────────

export interface PracticeIntelligenceScan {
  id: string;
  home_id: string;
  scan_type: "daily" | "weekly" | "on_demand" | "triggered";
  scan_date: string;
  status: string;

  home_dynamics_summary: HomeDynamicsSummary;
  child_summaries: ChildScanSummary[];
  risk_patterns: RiskPattern[];
  practice_drift_alerts: PracticeDriftAlert[];
  training_need_alerts: TrainingNeedAlert[];
  oversight_prompts: OversightPrompt[];
  suggested_plan_updates: PlanUpdateSuggestion[];
  suggested_keywork: SuggestedSession[];
  suggested_reflective: SuggestedSession[];
  relationship_mapping: Record<string, unknown>;
  rota_impact_analysis: Record<string, unknown>;
  staff_consistency: Record<string, unknown>;
  repeated_triggers: RepeatedTrigger[];
  therapeutic_patterns: TherapeuticPattern[];

  created_by: string | null;
  created_at: string;
}

export interface HomeDynamicsSummary {
  emotional_climate: string;
  risk_level: string;
  risk_score: number;
  incident_count: number;
  missing_count: number;
  restraint_count: number;
  complaint_count: number;
  safeguarding_alerts: number;
  overdue_actions: number;
  key_themes: string[];
}

export interface ChildScanSummary {
  child_id: string;
  child_name: string;
  overall_presentation: string;
  risk_level: string;
  recent_incidents: number;
  recent_positives: string[];
  concerns: string[];
  suggested_actions: string[];
}

export interface RiskPattern {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  evidence: string[];
  suggested_response: string;
}

export interface PracticeDriftAlert {
  area: string;
  description: string;
  severity: "low" | "medium" | "high";
  evidence: string[];
  recommended_action: string;
}

export interface TrainingNeedAlert {
  topic: string;
  reason: string;
  priority: "low" | "medium" | "high" | "critical";
  suggested_resource_type: LearningResourceType;
  staff_ids: string[];
}

export interface OversightPrompt {
  oversight_type: OversightType;
  record_id: string | null;
  child_id: string | null;
  reason: string;
  priority: "low" | "medium" | "high" | "urgent";
}

export interface PlanUpdateSuggestion {
  child_id: string | null;
  plan_type: string;
  suggestion: string;
  rationale: string;
  evidence: string[];
  priority: "low" | "medium" | "high" | "urgent";
}

export interface SuggestedSession {
  child_id: string | null;
  session_type: SessionType;
  title: string;
  rationale: string;
  framework: PracticeIntelligenceFramework;
  priority: "low" | "medium" | "high";
}

export interface RepeatedTrigger {
  child_id: string;
  trigger: string;
  frequency: number;
  period: string;
  last_occurrence: string;
  suggested_response: string;
}

export interface TherapeuticPattern {
  child_id: string | null;
  pattern_type: string;
  description: string;
  evidence: string[];
  clinical_hypothesis: string;
  suggested_approach: string;
}

// ── Generated Session ───────────────────────────────────────────────────────

export interface GeneratedSession {
  id: string;
  home_id: string;
  child_id: string | null;
  session_type: SessionType;
  title: string;
  framework: PracticeIntelligenceFramework | null;
  tone: string | null;
  status: "draft" | "approved" | "delivered" | "recorded";

  content: SessionContent;
  evidence_links: EvidenceLink[];
  quality_score: number | null;

  scheduled_date: string | null;
  delivered_at: string | null;
  delivered_by: string | null;
  recording_notes: string | null;
  follow_up_actions: SessionAction[];
  plan_update_suggestions: PlanUpdateSuggestion[];

  approved_by: string | null;
  approved_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SessionContent {
  purpose: string;
  therapeutic_rationale: string;
  staff_preparation: string;
  emotional_safety: string;
  opening: string;
  main_activity: string;
  reflective_questions: string[];
  creative_option: string | null;
  scaling_question: string | null;
  risk_considerations: string;
  what_to_avoid: string;
  recording_template: string;
  materials_needed: string[];
  estimated_duration: string;
  age_appropriateness: string;
  adaptations: string[];
}

export interface EvidenceLink {
  source_table: string;
  source_id: string;
  relevance: number;
  citation_text: string;
}

export interface SessionAction {
  action: string;
  owner: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high";
  status: "pending" | "completed" | "overdue";
}

// ── Learning Resource ───────────────────────────────────────────────────────

export interface LearningResource {
  id: string;
  home_id: string;
  resource_type: LearningResourceType;
  title: string;
  description: string | null;
  target_audience: "staff" | "child" | "group" | "mixed";
  format: string;
  content: Record<string, unknown>;
  preferences: Record<string, unknown>;
  tags: string[];
  framework: PracticeIntelligenceFramework | null;
  reading_level: string | null;
  communication_needs: string[];
  neurodiversity_adaptations: string[];
  status: "draft" | "published" | "archived";
  use_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ── Management Oversight Draft ──────────────────────────────────────────────

export interface ManagementOversightDraft {
  id: string;
  home_id: string;
  oversight_type: OversightType;
  record_id: string | null;
  record_type: string | null;
  child_id: string | null;
  status: "draft" | "reviewed" | "approved" | "committed";

  content: OversightContent;
  evidence_links: EvidenceLink[];
  regulatory_refs: RegulatoryReference[];
  quality_score: number | null;

  approved_by: string | null;
  approved_at: string | null;
  committed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OversightContent {
  summary: string;
  evidence_reviewed: string;
  child_impact: string;
  staff_practice_analysis: string;
  risk_analysis: string;
  safeguarding_considerations: string;
  regulatory_relevance: string;
  actions_required: OversightAction[];
  management_decision_support: string;
  review_date: string | null;
  human_review_note: string;
}

export interface OversightAction {
  action: string;
  owner: string | null;
  due_date: string | null;
  priority: "low" | "medium" | "high" | "urgent";
}

export interface RegulatoryReference {
  framework: RegulationFramework;
  regulation: string;
  quality_standard: string | null;
  sccif_theme: SCCIFTheme | null;
  evidence_text: string;
}

// ── Workflow Trigger ────────────────────────────────────────────────────────

export interface WorkflowTrigger {
  id: string;
  home_id: string;
  trigger_event: WorkflowTriggerEvent;
  source_table: string;
  source_id: string;
  child_id: string | null;
  suggestions: WorkflowSuggestion[];
  status: "pending" | "actioned" | "dismissed";
  actioned_by: string | null;
  actioned_at: string | null;
  created_at: string;
}

export interface WorkflowSuggestion {
  type: "plan_update" | "session" | "training" | "oversight" | "risk_review" | "debrief" | "referral";
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  target_type: string;
  target_id: string | null;
}

// ── Staff Competency Record ─────────────────────────────────────────────────

export interface StaffCompetencyRecord {
  id: string;
  home_id: string;
  staff_id: string;
  competency_area: string;
  current_level: "not_assessed" | "developing" | "competent" | "proficient" | "expert";
  evidence: string[];
  assessed_date: string | null;
  assessed_by: string | null;
  next_review: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Child Learning Preferences ──────────────────────────────────────────────

export interface ChildLearningPreferences {
  id: string;
  home_id: string;
  child_id: string;
  reading_level: string | null;
  learning_style: string | null;
  communication_needs: string[];
  neurodiversity_notes: string[];
  preferred_format: string | null;
  preferred_tone: string | null;
  accessibility_notes: string | null;
  updated_at: string;
  updated_by: string | null;
}

// ── Regulation Mapping ──────────────────────────────────────────────────────

export interface FrameworkMapping {
  id: string;
  home_id: string;
  artifact_id: string | null;
  artifact_type: string | null;
  framework: RegulationFramework;
  regulation: string | null;
  quality_standard: string | null;
  sccif_theme: SCCIFTheme | null;
  evidence_text: string | null;
  created_at: string;
}

// ── Home Dynamics Report ────────────────────────────────────────────────────

export interface HomeDynamicsReport {
  id: string;
  home_id: string;
  report_type: "daily" | "weekly" | "monthly";
  report_date: string;
  period_start: string;
  period_end: string;
  summary: string | null;
  emotional_climate: string | null;
  risk_level: "low" | "medium" | "high" | "critical" | null;
  risk_score: number | null;
  metrics: Record<string, unknown>;
  child_highlights: ChildHighlight[];
  staff_practice_notes: string[];
  pattern_analysis: PatternAnalysisEntry[];
  recommended_actions: OversightAction[];
  manager_focus: string[];
  created_by: string | null;
  created_at: string;
}

export interface ChildHighlight {
  child_id: string;
  child_name: string;
  highlight: string;
  sentiment: "positive" | "concern" | "neutral";
}

export interface PatternAnalysisEntry {
  pattern: string;
  frequency: number;
  trend: "increasing" | "stable" | "decreasing";
  significance: string;
}

// ── Cara Safeguards ─────────────────────────────────────────────────────────

export const CARA_SAFEGUARD_RULES = [
  "never_state_speculation_as_fact",
  "always_mark_human_review_required",
  "never_label_children",
  "never_use_blame_language",
  "separate_evidence_from_hypothesis",
  "include_child_voice_where_available",
  "flag_safeguarding_indicators",
  "respect_confidentiality_levels",
  "audit_all_generations",
  "require_human_approval_before_commit",
] as const;
export type CaraSafeguardRule = (typeof CARA_SAFEGUARD_RULES)[number];

export interface CaraSafeguardCheck {
  rule: CaraSafeguardRule;
  passed: boolean;
  detail: string | null;
}
