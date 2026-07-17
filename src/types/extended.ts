// ══════════════════════════════════════════════════════════════════════════════
// CARA — EXTENDED TYPES
// New entities: buildings, vehicles, H&S, missing episodes, chronology, etc.
// ══════════════════════════════════════════════════════════════════════════════

// ── Risk Assessment ─────────────────────────────────────────────────────────

export type RiskDomain = "self_harm" | "absconding" | "aggression" | "exploitation" | "substance_use" | "online_safety" | "fire_setting" | "sexual_behaviour" | "self_neglect" | "emotional_harm";
export type RiskLevel = "low" | "medium" | "high" | "very_high";
export type RiskTrend = "increasing" | "stable" | "decreasing";

export interface RiskMitigation {
  strategy: string;
  responsible: string;
  effectiveness: "effective" | "partially_effective" | "not_effective" | "not_yet_assessed";
}

export interface RiskAssessment {
  id: string;
  child_id: string;
  domain: RiskDomain;
  current_level: RiskLevel;
  previous_level: RiskLevel;
  trend: RiskTrend;
  status: "current" | "under_review" | "superseded" | "draft";
  assessed_by: string;
  assessed_date: string;
  review_date: string;
  triggers: string[];
  indicators: string[];
  mitigations: RiskMitigation[];
  contingency_plan: string;
  child_views: string;
  history_notes: string;
  linked_incidents: string[];
  home_id: string;
  created_at: string;
}

// ── Shift Swap Request ───────────────────────────────────────────────────────

export interface ShiftSwapRequest {
  id: string;
  requester_id: string;
  target_staff_id: string;
  requester_shift_id: string;
  target_shift_id: string | null;
  status: "pending" | "approved" | "declined";
  reason: string;
  manager_notes: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
}

// ── Missing from Care Episode ─────────────────────────────────────────────────

export interface MissingEpisode {
  id: string;
  reference: string;
  child_id: string;
  date_missing: string;
  time_missing: string;
  date_returned: string | null;
  time_returned: string | null;
  duration_hours: number | null;
  risk_level: "low" | "medium" | "high" | "critical";
  location_last_seen: string;
  return_location: string | null;
  reported_to_police: boolean;
  police_reference: string | null;
  reported_to_la: boolean;
  la_notified_at: string | null;
  return_interview_completed: boolean;
  return_interview_by: string | null;
  return_interview_date: string | null;
  return_interview_notes: string | null;
  contextual_safeguarding_risk: boolean;
  linked_incident_id: string | null;
  pattern_notes: string | null;
  status: "active" | "returned" | "closed";
  home_id: string;
  created_at: string;
  created_by: string;
}

// ── Chronology Entry ──────────────────────────────────────────────────────────

export type ChronologyCategory =
  | "placement" | "incident" | "missing" | "safeguarding"
  | "health" | "education" | "contact" | "legal"
  | "review" | "behaviour" | "other";

export interface ChronologyEntry {
  id: string;
  child_id: string;
  date: string;
  time: string | null;
  category: ChronologyCategory;
  title: string;
  description: string;
  significance: "routine" | "significant" | "critical";
  recorded_by: string;
  linked_incident_id: string | null;
  home_id: string;
  created_at: string;
  /** True when imported from a prior placement's chronology (vs recorded in Cara). */
  imported?: boolean;
  /** Free-text provenance for imported entries, e.g. "Imported — LA chronology". */
  source_label?: string | null;
}

// ── Building ──────────────────────────────────────────────────────────────────

export type BuildingCheckType =
  | "daily_walkround" | "weekly_walkround" | "monthly_inspection"
  | "fire_alarm_test" | "emergency_lighting" | "fire_extinguisher"
  | "fire_drill" | "smoke_detector" | "carbon_monoxide_detector"
  | "gas_safety" | "electrical_safety" | "pat_testing"
  | "legionella" | "water_temperature" | "asbestos"
  | "window_restrictors" | "bedroom_door_safety"
  | "kitchen_safety" | "food_hygiene" | "fridge_temp" | "freezer_temp"
  | "infection_control" | "first_aid_kit" | "coshh"
  | "cleaning_schedule" | "environmental" | "garden_external"
  | "boundary_security" | "external_security" | "cctv"
  | "internet_device_safety" | "accessibility"
  | "bedroom_furnishing" | "medication_room_security"
  | "maintenance_repair" | "contractor_visit"
  | "near_miss" | "accident" | "hazard";

export interface Building {
  id: string;
  home_id: string;
  name: string;
  type: "residential" | "office" | "outbuilding";
  address: string;
  areas: string[];
  gas_cert_expiry: string | null;
  electrical_cert_expiry: string | null;
  fire_risk_assessment_date: string | null;
  epc_rating: string | null;
  last_full_inspection: string | null;
  next_inspection_due: string | null;
  status: "operational" | "restricted" | "closed";
  created_at: string;
}

export interface BuildingCheck {
  id: string;
  building_id: string;
  home_id: string;
  area: string;
  check_type: BuildingCheckType;
  check_date: string;
  due_date: string;
  responsible_person: string;
  status: "due" | "completed" | "overdue" | "failed" | "waived";
  result: "pass" | "fail" | "advisory" | null;
  risk_level: "low" | "medium" | "high" | "critical" | null;
  notes: string | null;
  action_required: string | null;
  action_due: string | null;
  manager_oversight: boolean;
  linked_maintenance_id: string | null;
  evidence_urls: string[];
  created_at: string;
}

// ── Vehicle ───────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  home_id: string;
  registration: string;
  make: string;
  model: string;
  colour: string;
  year: number;
  seats: number;
  mot_expiry: string | null;
  insurance_expiry: string | null;
  tax_expiry: string | null;
  last_service: string | null;
  next_service_due: string | null;
  mileage: number;
  status: "available" | "in_use" | "restricted" | "off_road" | "disposed";
  breakdown_cover: string | null;
  breakdown_ref: string | null;
  notes: string | null;
  created_at: string;
}

export interface VehicleCheck {
  id: string;
  vehicle_id: string;
  home_id: string;
  check_type: "daily_safety" | "weekly" | "monthly" | "pre_journey" | "post_journey" | "accident" | "damage";
  check_date: string;
  driver: string;
  tyres: "pass" | "fail" | "advisory" | null;
  lights: "pass" | "fail" | "advisory" | null;
  brakes: "pass" | "fail" | "advisory" | null;
  mirrors: "pass" | "fail" | "advisory" | null;
  fluids: "pass" | "fail" | "advisory" | null;
  wipers: "pass" | "fail" | "advisory" | null;
  cleanliness: "pass" | "fail" | "advisory" | null;
  mileage_start: number | null;
  mileage_end: number | null;
  fuel_level: string | null;
  overall_result: "pass" | "fail" | "advisory";
  defects: string | null;
  notes: string | null;
  created_at: string;
}

// ── Handover ──────────────────────────────────────────────────────────────────

export interface HandoverChildUpdate {
  child_id: string;
  mood_score: number | null;
  key_notes: string;
  alerts: string[];
}

export interface HandoverSignOff {
  staff_id: string;
  acknowledged_at: string;
  notes: string | null;
}

export interface HandoverEntry {
  id: string;
  home_id: string;
  shift_date: string;
  shift_from: "day" | "sleep_in" | "waking_night" | "night";
  shift_to: "day" | "sleep_in" | "waking_night" | "morning";
  handover_time: string;
  completed_at: string | null;
  outgoing_staff: string[];
  incoming_staff: string[];
  created_by: string;
  signed_off_by: string | null;
  sign_offs: HandoverSignOff[];
  child_updates: HandoverChildUpdate[];
  general_notes: string;
  flags: string[];
  linked_incident_ids: string[];
  cara_assist_used?: boolean;
  created_at: string;
}

// ── Notification ──────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  home_id: string;
  recipient_id: string;
  title: string;
  body: string;
  type: "incident" | "safeguarding" | "medication" | "task" | "training" | "building" | "vehicle" | "system";
  priority: "low" | "normal" | "high" | "urgent";
  read: boolean;
  read_at: string | null;
  action_url: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

// ── Time Saved Entry ──────────────────────────────────────────────────────────

export interface TimeSavedEntry {
  id: string;
  home_id: string;
  staff_id: string;
  action_type: "auto_fill" | "linked_record" | "cara_draft" | "auto_task" | "auto_handover" | "one_click_summary" | "avoided_duplicate";
  minutes_saved: number;
  description: string;
  created_at: string;
}

// ── Cara Interaction ──────────────────────────────────────────────────────────

export type CaraMode =
  | "write" | "review" | "oversee" | "assist"
  // Intelligence modes
  | "experience_summary" | "pattern_analysis" | "what_changed"
  | "voice_summary" | "chronology_summary" | "home_climate"
  | "intervention_review" | "practice_bank" | "decision_support"
  | "form_review" | "oversight_draft" | "inspection_narrative"
  | "rewrite"
  // Document modes
  | "document_classify" | "document_to_form"
  // Cara Intelligence module modes
  | "situation_review" | "generate_oversight" | "keywork_session_plan"
  | "child_resource_create" | "interactive_session_summary"
  | "check_missing_evidence" | "recommendations" | "safeguarding_scan"
  | "reflective_debrief" | "convert_writing_style"
  // RI Command Centre modes
  | "ri_strategic_analysis" | "ri_reg45_generate" | "ri_ofsted_readiness"
  | "ri_challenge_question"
  // Learning Studio modes
  | "learning_workshop_plan" | "learning_flashcards" | "learning_quiz"
  | "learning_guidance_note" | "training_needs_analysis" | "curriculum_builder"
  // People / Staff modes
  | "staff_development_summary"
  // Workforce Intelligence modes
  | "workforce_competency_profile" | "workforce_development_plan"
  | "workforce_succession_analysis" | "workforce_readiness_report"
  | "workforce_appraisal_insights" | "workforce_observation_summary"
  | "workforce_induction_review" | "workforce_training_matrix";

export type CaraStyle =
  | "professional_formal" | "warm_professional" | "child_friendly"
  | "reflective_practice" | "safeguarding_focused" | "concise_manager"
  | "parent_carer" | "plain_english" | "social_worker_update"
  | "therapeutic" | "complaint_response" | "restorative"
  // Extended styles
  | "evaluative_ofsted" | "chronology_style" | "reg_45_narrative"
  | "safeguarding_analysis" | "management_oversight" | "provider_summary"
  | "inspection_ready" | "child_journey" | "relational_practice"
  | "direct_factual" | "compassionate_reflective";

export interface CaraRequest {
  mode: CaraMode;
  style: CaraStyle;
  page_context: string;
  record_type: string;
  source_content: string;
  user_role: string;
  linked_records?: string;
  audience?: string;
}

export interface CaraResponse {
  draft: string;
  suggestions: string[];
  source_references: string[];
  follow_up_tasks: string[];
  compliance_flags: string[];
  confidence: "high" | "medium" | "low";
}

// ── Health Check Score ─────────────────────────────────────────────────────────

export interface HealthCheckScore {
  overall: number;
  operational: number;
  safeguarding: number;
  medication: number;
  staffing: number;
  compliance: number;
  environment: number;
  risk_level: "low" | "medium" | "high" | "critical";
  action_plan: HealthCheckAction[];
  generated_at: string;
}

export interface HealthCheckAction {
  area: string;
  issue: string;
  owner: string | null;
  priority: "urgent" | "high" | "medium" | "low";
  due: string | null;
  escalation_level: "manager" | "ri" | "ofsted" | null;
}

// ── Time Saved Summary ────────────────────────────────────────────────────────

export interface TimeSavedSummary {
  user_today_minutes: number;
  user_week_minutes: number;
  home_week_minutes: number;
  home_month_minutes: number;
  breakdown: { category: string; minutes: number; count: number }[];
}

// ── Audit (Quality Assurance) ─────────────────────────────────────────────────

export interface Audit {
  id: string;
  title: string;
  category: string;
  date: string;
  completed_by: string | null;
  score: number;
  max_score: number;
  status: "completed" | "scheduled" | "in_progress";
  findings: number;
  actions: number;
  home_id: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

// ── Maintenance Item ──────────────────────────────────────────────────────────

export interface MaintenanceItem {
  id: string;
  title: string;
  category: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "open" | "scheduled" | "completed";
  due_date: string;
  assigned_to: string | null;
  notes: string;
  recurring: boolean;
  home_id: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

// ── Intelligence Layer ─────────────────────────────────────────────────────────

export interface ChildExperienceSnapshot {
  id: string;
  home_id: string;
  child_id: string;
  period_start: string;   // ISO date
  period_end: string;     // ISO date
  // scores 0–100
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
  overall_score: number;
  score_delta: number | null;
  narrative: string;
  trend?: "improving" | "stable" | "worsening" | "mixed";
  strengths?: string[];
  concerns?: string[];
  evidence_refs: Array<{ type: string; id: string; date: string; excerpt: string; significance: string }>;
  computed_by: string;
  reviewed_by: string | null;
  created_at: string;
}

export type PatternSeverity = "low" | "medium" | "high" | "critical";
export type PatternStatus = "active" | "acknowledged" | "resolved" | "dismissed";

export interface PatternAlert {
  id: string;
  home_id: string;
  child_id: string | null;
  alert_type: string;
  title: string;
  description: string;
  severity: PatternSeverity;
  status: PatternStatus;
  evidence_refs: Array<{ type: string; id: string; date: string; excerpt: string }>;
  reflective_prompt: string;
  detected_at: string;
  period_start: string;
  period_end: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  home_id_str?: string;
  created_at: string;
}

export type InterventionStatus = "active" | "paused" | "completed" | "stopped" | "under_review";
export type InterventionOutcome = "working" | "not_working" | "partially_working" | "too_early" | "unknown";

export interface Intervention {
  id: string;
  home_id: string;
  child_id: string;
  title: string;
  description: string;
  rationale: string;
  started_at: string;
  review_date: string | null;
  ended_at: string | null;
  agreed_by: string | null;
  status: InterventionStatus;
  intended_outcome: string;
  outcome: InterventionOutcome;
  outcome_notes: string | null;
  evidence_refs: Array<{ type: string; id: string; date: string; excerpt: string }>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type RelationalRecordType = "trust_moment" | "rupture_repair" | "de_escalation" | "regulation_strategy" | "preferred_adult" | "what_helps" | "what_to_avoid" | "attachment_indicator" | "sensory_need" | "voice_indicator";

export interface RelationalRecord {
  id: string;
  home_id: string;
  child_id: string;
  record_type: RelationalRecordType;
  title: string;
  description: string;
  staff_id: string | null;
  is_positive: boolean;
  confidence: "low" | "medium" | "high";
  source_ref_type: string | null;
  source_ref_id: string | null;
  created_by: string;
  created_at: string;
}

export interface PracticeBankEntry {
  id: string;
  home_id: string;
  child_id: string;
  category: "what_works" | "what_to_avoid" | "language" | "preparation" | "repair" | "regulation" | "engagement" | "education" | "general";
  title: string;
  description: string;
  evidence: string | null;
  contributed_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type VoiceTheme = "wishes" | "feelings" | "concerns" | "complaints" | "compliments" | "needs" | "relationships" | "plans" | "activities" | "education" | "health" | "identity" | "culture" | "future";

export interface VoiceRecord {
  id: string;
  home_id: string;
  child_id: string;
  recorded_at: string;
  theme: VoiceTheme;
  direct_quote: string | null;
  paraphrase: string | null;
  capture_method: "direct" | "observed" | "interpreted" | "written" | "advocate";
  action_taken: string | null;
  action_owner: string | null;
  action_outcome: string | null;
  voice_heeded: boolean | null;
  source_ref_type: string | null;
  source_ref_id: string | null;
  recorded_by: string;
  created_at: string;
}

export interface HomeClimateSnapshot {
  id: string;
  home_id: string;
  period_start: string;
  period_end: string;
  staffing_consistency_score: number;
  incident_frequency_score: number;
  missing_episode_score: number;
  complaints_score: number;
  safeguarding_score: number;
  peer_tension_score: number;
  training_compliance_score: number;
  maintenance_score: number;
  overall_climate_score: number;
  climate_delta: number | null;
  narrative: string;
  hotspot_times: string[];
  risk_flags: string[];
  computed_by: string;
  created_at: string;
}

export interface DocumentIntelligenceJob {
  id: string;
  home_id: string;
  original_filename: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  extracted_text: string | null;
  status: "pending" | "processing" | "classified" | "placed" | "rejected" | "error";
  classification: Record<string, unknown> | null;
  suggested_module: string | null;
  suggested_child_id: string | null;
  suggested_form_type: string | null;
  suggested_tags: string[];
  confidence_score: number | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  placed_at: string | null;
  placement_ref_type: string | null;
  placement_ref_id: string | null;
  cara_notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ActionOutcome {
  id: string;
  home_id: string;
  task_id: string | null;
  child_id: string | null;
  title: string;
  what_was_agreed: string;
  why_it_matters: string;
  owner_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  what_was_done: string | null;
  what_changed: string | null;
  effectiveness: "very_effective" | "effective" | "partially_effective" | "ineffective" | "unknown" | null;
  effectiveness_notes: string | null;
  status: "open" | "in_progress" | "completed" | "overdue" | "stalled" | "cancelled";
  linked_evidence: Array<{ type: string; id: string; description: string }>;
  should_continue: boolean | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ── Cara Intelligence Module — types ──────────────────────────────────────────

export type CaraAssessmentStatus = "draft" | "reviewed" | "approved" | "archived";
export type CaraAssessmentType = "situation_review" | "pattern_scan" | "safeguarding_scan" | "reflective_debrief";
export type CaraRiskLevel = "critical" | "high" | "medium" | "low" | "not_identified";
export type CaraConfidenceLevel = "high" | "possible" | "needs_human_review" | "insufficient_information";

export interface CaraRecommendedAction {
  title: string;
  why_this_matters: string;
  priority: "urgent" | "high" | "medium" | "low";
  deadline_days?: number;
  assigned_role?: string;
  evidence_required?: string;
}

export interface CaraAssessment {
  id: string;
  home_id: string;
  child_id: string;
  source_record_type?: string;
  source_record_id?: string;
  assessment_type: CaraAssessmentType;
  situation_summary?: string;
  risk_level: CaraRiskLevel;
  safeguarding_flags: string[];
  protective_factors: string[];
  emotional_needs: string[];
  suggested_actions: CaraRecommendedAction[];
  confidence_level: CaraConfidenceLevel;
  ai_generated_text: string;
  human_reviewed_text?: string;
  status: CaraAssessmentStatus;
  created_by: string;
  reviewed_by?: string;
  approved_by?: string;
  created_at: string;
  reviewed_at?: string;
  approved_at?: string;
}

export type CaraOversightStatus = "draft" | "submitted" | "approved" | "archived";
export type CaraOversightStyle = "professional_management" | "reflective_supervision" | "reg_45_evidence" | "ofsted_ready" | "trauma_informed" | "writing_to_child" | "social_worker_update" | "team_learning";

export interface CaraOversight {
  id: string;
  home_id: string;
  child_id?: string;
  record_type: string;
  record_id?: string;
  oversight_style: CaraOversightStyle;
  ai_draft: string;
  edited_version?: string;
  final_version?: string;
  approval_status: CaraOversightStatus;
  manager_id?: string;
  quality_rating?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
}

export type KeyWorkSessionStatus = "planned" | "in_progress" | "completed" | "reviewed" | "approved";
export type KeyWorkTheme = "staying_safe_online" | "missing_from_care" | "peer_pressure" | "exploitation" | "healthy_relationships" | "family_contact" | "emotional_regulation" | "anger" | "anxiety" | "trust" | "identity" | "self_esteem" | "education" | "sleep_routines" | "medication_understanding" | "substance_misuse" | "knife_crime" | "sexual_health" | "consent" | "boundaries" | "grief_and_loss" | "trauma" | "bullying" | "social_media" | "money_skills" | "independence" | "cultural_identity" | "understanding_care" | "complaints_and_rights" | "safety_planning" | "consequences_and_choices" | "repairing_relationships" | "voice_of_the_child" | "future_goals" | "general";

export interface KeyWorkSessionPlan {
  session_title: string;
  reason_for_session: string;
  aim: string;
  desired_outcome: string;
  why_this_matters: string;
  preparation_for_staff: string;
  emotional_safety_considerations: string;
  opening_script: string;
  warm_up_activity: string;
  main_discussion_questions: string[];
  reflective_activity: string;
  practical_activity: string;
  child_friendly_explanation: string;
  staff_prompts: string[];
  pace_informed_responses: string;
  arc_attachment: string;
  arc_regulation: string;
  arc_competency: string;
  safeguarding_link: string;
  rights_and_responsibilities: string;
  closing_reflection: string;
  follow_up_actions: string[];
  evidence_to_record: string;
  plan_updates_required: string;
  manager_oversight_prompt: string;
}

export interface KeyWorkSession {
  id: string;
  home_id: string;
  child_id: string;
  title: string;
  theme: KeyWorkTheme;
  reason: string;
  aims: string;
  desired_outcomes: string;
  session_plan: KeyWorkSessionPlan | null;
  resources: string[];
  child_voice?: string;
  staff_reflection?: string;
  cara_summary?: string;
  manager_oversight_id?: string;
  status: KeyWorkSessionStatus;
  created_by: string;
  completed_by?: string;
  reviewed_by?: string;
  cara_assist_used?: boolean;
  created_at: string;
  completed_at?: string;
  reviewed_at?: string;
}

export type ChildResourceType = "worksheet" | "reflection_card" | "feelings_card" | "safety_plan" | "visual_safety_map" | "scenario_card" | "conversation_card" | "social_story" | "step_by_step_guide" | "explainer_sheet" | "rights_sheet" | "quiz" | "matching_activity" | "scaling_question" | "mood_tracker" | "coping_menu" | "relationship_circle" | "trusted_adult_map" | "online_safety_checklist" | "return_home_reflection" | "restorative_repair" | "overwhelm_plan" | "safe_people_list" | "goals_sheet" | "independence_plan" | "education_confidence";

export type ResourceWritingStyle = "child_friendly" | "teenage_conversational" | "simple_english" | "visual_learner" | "neurodiversity_friendly" | "reflective" | "strengths_based" | "writing_to_child" | "restorative" | "rights_based";

export interface ChildResourceContent {
  title: string;
  purpose: string;
  child_friendly_explanation: string;
  activity: string;
  reflection_questions: string[];
  child_voice_space: string;
  staff_guidance: string;
  recording_prompt: string;
  follow_up_prompt: string;
}

export type ChildResourceStatus = "draft" | "reviewed" | "approved" | "archived";

export interface ChildResource {
  id: string;
  home_id: string;
  child_id: string;
  title: string;
  resource_type: ChildResourceType;
  theme: string;
  age_range: string;
  reading_level: string;
  tone: ResourceWritingStyle;
  content: ChildResourceContent | null;
  printable_html?: string;
  pdf_url?: string;
  created_by: string;
  approved_by?: string;
  status: ChildResourceStatus;
  created_at: string;
  approved_at?: string;
}

export type InteractiveSessionStatus = "active" | "paused" | "completed" | "reviewed";
export type InteractiveSessionMode = "guided" | "freeform" | "activity";

export interface InteractiveSessionResponse {
  activity_id: string;
  activity_title: string;
  response_type: "emoji" | "scale" | "text" | "declined" | "drawing";
  response_value: string | number | null;
  child_words?: string;
  staff_observation?: string;
  recorded_at: string;
}

export interface InteractiveSession {
  id: string;
  home_id: string;
  child_id: string;
  key_work_session_id?: string;
  consent_recorded: boolean;
  consent_notes?: string;
  session_mode: InteractiveSessionMode;
  responses: InteractiveSessionResponse[];
  child_voice?: string;
  staff_notes?: string;
  cara_summary?: string;
  safeguarding_flags: string[];
  follow_up_actions: string[];
  status: InteractiveSessionStatus;
  created_by: string;
  created_at: string;
  completed_at?: string;
}

export type AuditActionType = "cara_assessment_created" | "cara_assessment_reviewed" | "cara_assessment_approved" | "cara_oversight_generated" | "cara_oversight_approved" | "keywork_session_created" | "keywork_session_completed" | "keywork_session_reviewed" | "child_resource_created" | "child_resource_approved" | "interactive_session_completed" | "safeguarding_flag_raised" | "safeguarding_flag_reviewed" | "recommendation_created" | "recommendation_actioned" | "ai_prompt_sent" | "ai_response_received" | "human_edit_made" | "record_approved" | "incident_started" | "incident_ended" | "timeline_entry_added" | "manager_notified" | "ai_record_rewrite_generated" | "ai_suggestion_accepted" | "ai_suggestion_rejected" | "manager_review_completed" | "alert_resolved";

export interface CaraAuditEntry {
  id: string;
  home_id: string;
  user_id: string;
  child_id?: string;
  action_type: AuditActionType;
  source_table?: string;
  source_id?: string;
  ai_prompt?: string;
  ai_response?: string;
  human_edit?: string;
  approval_status?: string;
  created_at: string;
}

export type CaraRecommendationStatus = "pending" | "actioned" | "dismissed" | "task_created";
export type CaraRecommendationType = "key_work_session" | "risk_assessment_update" | "social_worker_notification" | "chronology_entry" | "staff_debrief" | "behaviour_plan_update" | "safety_plan" | "evidence_upload" | "management_oversight" | "education_review" | "reflective_supervision" | "family_contact_review" | "missing_follow_up" | "medication_review" | "placement_plan_update";

export interface CaraRecommendation {
  id: string;
  home_id: string;
  child_id?: string;
  source_type?: string;
  source_id?: string;
  recommendation_type: CaraRecommendationType;
  title: string;
  reason: string;
  priority: "urgent" | "high" | "medium" | "low";
  deadline?: string;
  assigned_role?: string;
  task_created: boolean;
  task_id?: string;
  status: CaraRecommendationStatus;
  created_at: string;
}

export type SafeguardingFlagSeverity = "critical" | "high" | "medium" | "low";
export type SafeguardingFlagType = "disclosure_of_harm" | "self_harm" | "exploitation" | "missing_from_care" | "grooming" | "online_exploitation" | "sexual_exploitation" | "criminal_exploitation" | "weapon_concern" | "substance_concern" | "medication_refusal" | "allegation_against_staff" | "bullying" | "family_contact_risk" | "radicalisation" | "abuse_or_neglect" | "immediate_safety_risk" | "peer_on_peer_abuse";
export type SafeguardingFlagStatus = "open" | "reviewed" | "escalated" | "closed";

export interface CaraSafeguardingFlag {
  id: string;
  home_id: string;
  child_id: string;
  source_type?: string;
  source_id?: string;
  flag_type: SafeguardingFlagType;
  severity: SafeguardingFlagSeverity;
  description: string;
  recommended_action: string;
  reviewed_by?: string;
  review_outcome?: string;
  status: SafeguardingFlagStatus;
  created_at: string;
  reviewed_at?: string;
}

export type OversightRadarSeverity = "red" | "amber" | "green" | "blue";

export interface OversightRadarItem {
  id: string;
  category: string;
  issue: string;
  why_it_matters: string;
  suggested_action: string;
  regulation?: string;
  severity: OversightRadarSeverity;
  child_id?: string;
  record_type?: string;
  record_id?: string;
  is_reviewed: boolean;
}

// ══════════════════════════════════════════════════════════════════════════════
// RI COMMAND CENTRE — types
// ══════════════════════════════════════════════════════════════════════════════

export type RiChallengeArea = "safeguarding" | "oversight" | "compliance" | "practice" | "staffing" | "outcomes" | "finance";
export type RiEscalationLevel = "standard" | "elevated" | "critical" | "formal";
export type RiChallengeStatus = "open" | "responded" | "action_pending" | "resolved" | "escalated";

export interface RiChallengeLog {
  id: string;
  home_id: string;
  title: string;
  challenge_area: RiChallengeArea;
  evidence_summary: string;
  challenge_text: string;
  escalation_level: RiEscalationLevel;
  manager_response?: string;
  manager_responded_at?: string;
  manager_responded_by?: string;
  action_required?: string;
  action_due_date?: string;
  action_completed_at?: string;
  status: RiChallengeStatus;
  linked_record_type?: string;
  linked_record_id?: string;
  cara_generated: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export type RiReportType = "strategic_summary" | "reg45_draft" | "ofsted_readiness" | "risk_analysis" | "monthly_overview";
export type RiReportStatus = "draft" | "reviewed" | "approved" | "published";

export interface RiGovernanceReport {
  id: string;
  home_id: string;
  report_type: RiReportType;
  report_period?: string;
  generated_by_cara: boolean;
  content: Record<string, unknown>;
  status: RiReportStatus;
  approved_by?: string;
  approved_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type RiReg45Status = "draft" | "in_progress" | "reviewed" | "approved" | "submitted";

export interface RiReg45Evidence {
  id: string;
  home_id: string;
  report_period: string;       // e.g. "Q1 2026"
  period_start: string;
  period_end: string;
  evidence_items: Record<string, unknown>[];
  cara_strengths?: string;
  cara_weaknesses?: string;
  cara_improvement_areas?: string;
  cara_child_impact?: string;
  cara_action_plan?: string;
  cara_ri_statement?: string;
  cara_generated_at?: string;
  status: RiReg45Status;
  submitted_to_ofsted: boolean;
  submitted_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type RiAlertType =
  | "safeguarding_risk" | "repeated_incident" | "weak_oversight"
  | "missing_compliance" | "overdue_action" | "rising_risk"
  | "training_gap" | "supervision_gap";
export type RiAlertSeverity = "critical" | "high" | "medium" | "low";

export interface RiAlert {
  id: string;
  home_id: string;
  alert_type: RiAlertType;
  severity: RiAlertSeverity;
  title: string;
  description: string;
  data_evidence?: Record<string, unknown>;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  resolution_note?: string;
  auto_generated: boolean;
  linked_challenge_id?: string;
  created_by: string;
  created_at: string;
}

// RI Score card (computed, not stored)
export interface RiScoreCard {
  home_id: string;
  computed_at: string;
  // 15 governance metrics (0-100)
  safeguarding_oversight_score: number;
  incident_management_score: number;
  missing_episodes_score: number;
  reg45_compliance_score: number;
  staff_supervision_score: number;
  training_compliance_score: number;
  medication_governance_score: number;
  care_planning_score: number;
  child_voice_score: number;
  complaint_management_score: number;
  building_safety_score: number;
  recruitment_compliance_score: number;
  oversight_quality_score: number;
  outcome_evidence_score: number;
  challenge_log_score: number;
  // Summary
  overall_governance_score: number;
  risk_level: "critical" | "high" | "medium" | "low";
  narrative: string;
  strengths: string[];
  concerns: string[];
  immediate_actions: string[];
}

// ══════════════════════════════════════════════════════════════════════════════
// CARE PLANS — types
// ══════════════════════════════════════════════════════════════════════════════

export type CarePlanDomain =
  | "health"
  | "education"
  | "emotional_behavioural"
  | "identity"
  | "family_social"
  | "independence"
  | "placement_stability"
  | "safety";

export type CarePlanGoalStatus = "not_started" | "in_progress" | "on_track" | "attention_needed" | "achieved" | "closed";

export interface CarePlanGoal {
  id: string;
  domain: CarePlanDomain;
  title: string;
  description: string;
  desired_outcome: string;
  actions: string[];
  status: CarePlanGoalStatus;
  progress_note: string | null;
  target_date: string | null;
  achieved_date: string | null;
  last_reviewed: string | null;
  reviewed_by: string | null;
  evidence: string | null;
}

export type CarePlanStatus = "draft" | "active" | "under_review" | "updated" | "archived";

export interface CarePlan {
  id: string;
  home_id: string;
  child_id: string;
  version: number;
  status: CarePlanStatus;
  placement_start: string;
  current_placement_type: string;
  legal_status: string;
  goals: CarePlanGoal[];
  // Reviews
  last_lac_review: string | null;
  next_lac_review: string | null;
  lac_review_frequency_months: number;
  // Responsibility
  keyworker_id: string | null;
  rm_id: string | null;
  // Sign-off
  rm_sign_off_date: string | null;
  rm_sign_off_by: string | null;
  // Summary
  strengths_summary: string | null;
  concerns_summary: string | null;
  cara_overview: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPLAINTS & REPRESENTATIONS — types
// ══════════════════════════════════════════════════════════════════════════════

export type ComplainantType = "young_person" | "parent_carer" | "advocate" | "professional" | "anonymous";
export type ComplaintStage  = "stage_1" | "stage_2" | "ombudsman";
export type ComplaintStatus =
  | "received"
  | "acknowledged"
  | "under_investigation"
  | "response_sent"
  | "escalated"
  | "closed";
export type ComplaintOutcome = "upheld" | "partially_upheld" | "not_upheld" | "inconclusive" | "withdrawn" | "ongoing";
export type ComplaintCategory =
  | "staff_conduct"
  | "care_practice"
  | "environment"
  | "decisions_about_me"
  | "contact_family"
  | "education_health"
  | "leaving_care"
  | "other";

export interface ComplaintTimeline {
  date: string;
  action: string;
  recorded_by: string;
  note: string | null;
}

export interface Complaint {
  id: string;
  home_id: string;
  reference: string;
  child_id: string | null;           // the young person complained about/by
  complainant_type: ComplainantType;
  complainant_name: string;
  complainant_relationship: string | null;
  date_received: string;
  category: ComplaintCategory;
  stage: ComplaintStage;
  status: ComplaintStatus;
  summary: string;
  full_detail: string | null;
  outcome: ComplaintOutcome | null;
  outcome_detail: string | null;
  // Statutory timeline
  acknowledgement_due: string;       // date_received + 3 working days
  response_due: string;              // date_received + 10 working days
  acknowledged_at: string | null;
  response_sent_at: string | null;
  // RM handling
  assigned_to: string | null;
  investigation_notes: string | null;
  lessons_learned: string | null;
  learning_shared: boolean;
  // Escalation
  escalated_to_stage2_at: string | null;
  escalated_reason: string | null;
  ombudsman_reference: string | null;
  // Timeline log
  timeline: ComplaintTimeline[];
  // Flags
  includes_safeguarding_element: boolean;
  linked_incident_id: string | null;
  cara_summary: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// PHYSICAL INTERVENTION DEBRIEF — types
// ══════════════════════════════════════════════════════════════════════════════

export type PITechnique =
  | "team_teach_holding"
  | "team_teach_wrap"
  | "price_standing"
  | "price_seated"
  | "price_supine"
  | "mapa_holding"
  | "restrictive_escort"
  | "other";

export type PIBodyPosition = "standing" | "seated" | "floor" | "prone" | "supine" | "not_applicable";
export type PIDebriefStatus = "pending" | "yp_debrief_done" | "staff_debrief_done" | "complete" | "rm_signed_off";

export interface PIInjury {
  person_type: "young_person" | "staff";
  person_id: string;
  description: string;
  body_location: string | null;
  medical_attention_required: boolean;
  medical_attention_detail: string | null;
  riddor_reportable: boolean;
}

export interface PIDebrief {
  id: string;
  home_id: string;
  incident_id: string;
  // Intervention details
  technique_used: PITechnique;
  technique_other: string | null;
  duration_minutes: number;
  body_position: PIBodyPosition;
  staff_involved: string[];
  de_escalation_attempted: boolean;
  de_escalation_description: string | null;
  // Injuries
  injuries: PIInjury[];
  medical_assessment_completed: boolean;
  medical_assessment_notes: string | null;
  // Notifications & reporting
  ofsted_notification_required: boolean;
  ofsted_notified_at: string | null;
  ofsted_reference: string | null;
  la_notification_required: boolean;
  la_notified_at: string | null;
  riddor_reportable: boolean;
  riddor_reported_at: string | null;
  riddor_reference: string | null;
  // Debrief
  yp_debrief_completed: boolean;
  yp_debrief_date: string | null;
  yp_debrief_by: string | null;
  yp_debrief_notes: string | null;
  yp_debrief_feelings: string | null;
  staff_debrief_completed: boolean;
  staff_debrief_date: string | null;
  staff_debrief_by: string | null;
  staff_debrief_notes: string | null;
  // Learning & oversight
  trigger_identified: string | null;
  preventative_measures: string | null;
  learning_shared_with_team: boolean;
  status: PIDebriefStatus;
  rm_sign_off_date: string | null;
  rm_sign_off_by: string | null;
  rm_comments: string | null;
  cara_analysis: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// FAMILY CONTACT & CONTACT LOG — types
// ══════════════════════════════════════════════════════════════════════════════

export type ContactType =
  | "face_to_face"    // supervised or unsupervised visit in person
  | "telephone"       // phone call
  | "video_call"      // FaceTime / Teams / WhatsApp video
  | "letter"          // written correspondence
  | "indirect"        // card, gift, photo exchange via social worker
  | "supervised_community" // outing with family supervised by staff
  | "overnight_stay"; // agreed overnight with family

export type ContactOutcome =
  | "positive"
  | "mixed"
  | "difficult"
  | "did_not_happen"
  | "cancelled_by_family"
  | "cancelled_by_yp"
  | "cancelled_by_placing_la"
  | "refused_by_yp";

export type ContactStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "missed";

export type ContactArrangementStatus =
  | "active"
  | "under_review"
  | "suspended"
  | "ceased";

export type ContactSupervisionLevel =
  | "unsupervised"
  | "supported"        // staff present but not intervening
  | "supervised"       // staff actively monitoring
  | "professionally_supervised"; // independent supervisor

export interface ContactPerson {
  id: string;
  name: string;
  relationship: string; // e.g. "Mother", "Father", "Sibling", "Grandparent"
  contact_details: string | null;
  la_approved: boolean;
  approval_date: string | null;
  notes: string | null;
}

/** An agreed arrangement (from care plan / court order) */
export interface ContactArrangement {
  id: string;
  home_id: string;
  child_id: string;
  contact_person_id: string;
  contact_type: ContactType;
  frequency: string;          // e.g. "Weekly", "Fortnightly", "Monthly"
  frequency_detail: string | null; // e.g. "Every Saturday 14:00–16:00"
  supervision_level: ContactSupervisionLevel;
  location: string | null;
  court_ordered: boolean;
  court_order_reference: string | null;
  la_requirement: boolean;
  status: ContactArrangementStatus;
  suspension_reason: string | null;
  suspension_date: string | null;
  review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

/** A single contact session log entry */
export interface ContactLog {
  id: string;
  home_id: string;
  child_id: string;
  arrangement_id: string | null;
  contact_person_id: string;
  contact_type: ContactType;
  date: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  location: string | null;
  supervision_level: ContactSupervisionLevel;
  supervised_by: string | null;    // staff_id
  outcome: ContactOutcome;
  status: ContactStatus;
  yp_mood_before: "positive" | "anxious" | "neutral" | "reluctant" | "distressed" | null;
  yp_mood_after:  "positive" | "settled" | "neutral" | "unsettled" | "distressed" | null;
  narrative: string;               // what happened during contact
  yp_voice: string | null;         // what the YP said about the contact
  concerns_identified: boolean;
  concerns_detail: string | null;
  safeguarding_concern: boolean;
  safeguarding_detail: string | null;
  follow_up_required: boolean;
  follow_up_detail: string | null;
  cancelled_reason: string | null;
  social_worker_notified: boolean;
  social_worker_notified_at: string | null;
  photos_shared: boolean;
  gifts_received: boolean;
  gifts_detail: string | null;
  cara_analysis: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// REG 44 INDEPENDENT VISITS — types
// ══════════════════════════════════════════════════════════════════════════════

export type Reg44VisitStatus =
  | "scheduled"
  | "completed"
  | "report_received"
  | "manager_response_submitted"
  | "ri_reviewed";

export type Reg44FindingType = "strength" | "concern" | "recommendation" | "requirement";
export type Reg44FindingSeverity = "minor" | "moderate" | "significant" | "critical";

export interface Reg44Finding {
  id: string;
  visit_id: string;
  type: Reg44FindingType;
  area: string;
  description: string;
  evidence_cited: string | null;
  severity: Reg44FindingSeverity | null;
  action_required: string | null;
  action_completed: boolean;
  action_completed_at: string | null;
  action_completed_by: string | null;
  action_evidence: string | null;
}

export interface Reg44Visit {
  id: string;
  home_id: string;
  visit_number: number;
  visit_date: string | null;
  scheduled_date: string;
  visitor_name: string;
  visitor_organisation: string | null;
  status: Reg44VisitStatus;
  report_received_date: string | null;
  report_document_id: string | null;
  findings: Reg44Finding[];
  overall_finding: "satisfactory" | "concerns_identified" | "serious_concerns" | null;
  manager_response: string | null;
  manager_response_date: string | null;
  manager_response_by: string | null;
  ri_review_date: string | null;
  ri_review_by: string | null;
  ri_comments: string | null;
  cara_summary: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// REG 44 VISITOR REPORT TRACKER — types (action plan & compliance tracker)
// ══════════════════════════════════════════════════════════════════════════════

export interface Reg44Recommendation {
  id: string;
  recommendation: string;
  priority: "low" | "medium" | "high";
  rm_response: string;
  status: "completed" | "in_progress" | "outstanding";
  evidence_notes: string | null;
  completed_at: string | null;
}

export interface Reg44VisitReport {
  id: string;
  home_id: string;
  visit_date: string;
  visitor: string;
  duration: string;
  children_spoken: string;
  staff_spoken: number;
  records_reviewed: string[];
  overall_judgement: string;
  strengths: string[];
  areas_for_development: string[];
  recommendations: Reg44Recommendation[];
  previous_actions_status: string;
  report_sent_to_ofsted: boolean;
  report_sent_date: string;
  notes: string;
  created_at: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// Cara LEARNING STUDIO — types
// ══════════════════════════════════════════════════════════════════════════════

export type LearningPathway = "child" | "staff" | "mixed";
export type LearningProjectStatus = "active" | "completed" | "archived";

export interface LearningProject {
  id: string;
  home_id: string;
  project_name: string;
  pathway: LearningPathway;
  topic: string;
  learning_objective?: string;
  target_audience?: string;
  context_notes?: string;
  risk_level: "low" | "medium" | "high" | "critical";
  reading_level: string;
  tone: string;
  session_length?: string;
  status: LearningProjectStatus;
  linked_training_need_id?: string;
  linked_ri_alert_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export type GeneratedResourceType =
  | "workshop" | "flashcard_set" | "quiz" | "guidance_note"
  | "infographic" | "curriculum" | "micro_learning"
  | "session_plan" | "worksheet" | "safety_plan";
export type GeneratedResourceStatus = "draft" | "reviewed" | "approved" | "published" | "archived";

export interface GeneratedResource {
  id: string;
  home_id: string;
  project_id?: string;
  resource_type: GeneratedResourceType;
  title: string;
  topic?: string;
  pathway?: LearningPathway;
  content: Record<string, unknown>;
  raw_text?: string;
  status: GeneratedResourceStatus;
  approved_by?: string;
  approved_at?: string;
  assigned_to?: string[];
  tags?: string[];
  cara_generated: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type TrainingNeedPriority = "urgent" | "high" | "medium" | "low";
export type TrainingNeedIdentifiedBy = "manual" | "cara" | "supervision" | "incident" | "audit" | "ri_challenge" | "reg45" | "medication_event" | "daily_log";
export type TrainingNeedStatus = "identified" | "learning_studio_sent" | "resource_generated" | "assigned" | "in_progress" | "completed" | "no_action";

export interface TrainingNeed {
  id: string;
  home_id: string;
  identified_by: TrainingNeedIdentifiedBy;
  need_type: string;
  title: string;
  description: string;
  priority: TrainingNeedPriority;
  affected_staff?: string[];
  affected_roles?: string[];
  status: TrainingNeedStatus;
  linked_ri_alert_id?: string;
  linked_ri_challenge_id?: string;
  linked_learning_project_id?: string;
  linked_incident_id?: string;
  linked_audit_id?: string;
  cara_evidence?: string;
  deadline?: string;
  completed_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type KnowledgeGapSeverity = "critical" | "significant" | "moderate" | "minor";
export type KnowledgeGapStatus = "open" | "in_progress" | "addressed" | "monitoring";

export interface KnowledgeGap {
  id: string;
  home_id: string;
  staff_id?: string;
  staff_role?: string;
  gap_area: string;
  severity: KnowledgeGapSeverity;
  identified_from: string;
  evidence_notes?: string;
  linked_training_need_id?: string;
  status: KnowledgeGapStatus;
  resolved_at?: string;
  created_by: string;
  created_at: string;
}

export interface ResourceLibraryEntry {
  id: string;
  home_id: string;
  resource_id: string;
  resource_type: string;
  title: string;
  topic?: string;
  pathway?: LearningPathway;
  tags?: string[];
  is_approved: boolean;
  is_pinned: boolean;
  usage_count: number;
  created_by: string;
  created_at: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// L.I.V.E.R.S. INTERVENTION INTELLIGENCE SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

// ── L.I.V.E.R.S. Analysis ────────────────────────────────────────────────────

export type LiversViabilityRating = "low" | "moderate" | "high";
export type LiversSustainabilityRating = "low" | "moderate" | "high";
export type LiversStatus = "draft" | "reviewed" | "approved" | "archived";
export type LiversConfidence = "high" | "possible" | "needs_human_review" | "insufficient_information";

export interface LiversAnalysis {
  id: string;
  home_id: string;
  child_id: string;
  linked_record_id?: string;
  linked_record_type?: string;
  // L — Lived Experience
  lived_experience_summary?: string;
  // I — Immediate and Cumulative Risk
  immediate_cumulative_risk?: string;
  risk_pattern?: string;
  // V — Viability of Change
  viability_of_change?: string;
  viability_rating?: LiversViabilityRating;
  // E — Environment and System Forces
  environment_system_forces?: string;
  // R — Relational and Psychological Drivers
  relational_psychological_drivers?: string;
  // S — Sustainability and Independence of Safety
  sustainability_independence_safety?: string;
  sustainability_rating?: LiversSustainabilityRating;
  // Cara output
  cara_summary?: string;
  cara_confidence?: LiversConfidence;
  recommended_intervention_type?: string;
  escalation_required?: boolean;
  escalation_actions?: string[];
  management_oversight?: string;
  quality_check_passed?: boolean;
  quality_check_notes?: string;
  // Metadata
  status: LiversStatus;
  review_date?: string;
  created_by: string;
  reviewed_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  approved_at?: string;
}

// ── Intervention Session ──────────────────────────────────────────────────────

export type InterventionSessionType =
  | "key_work_session"
  | "restorative_conversation"
  | "direct_work_activity"
  | "safety_planning_session"
  | "missing_return_conversation"
  | "education_engagement_session"
  | "family_time_preparation"
  | "emotional_regulation_session"
  | "identity_self_esteem_session"
  | "independence_life_skills"
  | "online_safety_session"
  | "exploitation_awareness"
  | "relationship_boundaries"
  | "staff_guidance_note"
  | "team_reflective_briefing"
  | "management_oversight_analysis"
  | "child_friendly_worksheet"
  | "flashcards"
  | "quiz"
  | "infographic"
  | "workshop_plan"
  | "micro_training_staff";

export type InterventionSessionStatus = "draft" | "in_progress" | "completed" | "reviewed" | "approved" | "archived";

export interface InterventionSessionStep {
  step_number: number;
  title: string;
  duration_minutes?: number;
  description: string;
  facilitator_prompt?: string;
  child_activity?: string;
}

export interface InterventionSessionQualityCheck {
  explains_child_present: boolean;
  predicts_future_risk: boolean;
  justifies_intervention: boolean;
  identifies_issue_location: boolean;
  supports_sustainable_safety: boolean;
  non_blaming_language: boolean;
  intervention_realistic: boolean;
  child_voice_included: boolean;
  follow_up_actions_clear: boolean;
  management_oversight_considered: boolean;
}

export interface InterventionSession {
  id: string;
  home_id: string;
  child_id: string;
  livers_analysis_id?: string;
  linked_keywork_session_id?: string;
  title: string;
  session_type: InterventionSessionType;
  reason_for_session?: string;
  aim?: string;
  staff_preparation?: string;
  emotional_safety_notes?: string;
  pace_opening_script?: string;
  session_steps: InterventionSessionStep[];
  child_friendly_version?: string;
  reflective_questions_child: string[];
  reflective_questions_staff: string[];
  resources_generated: string[];
  follow_up_actions: string[];
  management_oversight_note?: string;
  evidence_refs: Array<{ type: string; id: string; excerpt?: string }>;
  outcome?: string;
  outcome_summary?: string;
  child_response?: string;
  risk_change?: "improved" | "same" | "worsened" | "unknown";
  sustainability_change?: "improved" | "same" | "worsened" | "unknown";
  further_action_required?: boolean;
  // Cached style rewrites
  style_professional?: string;
  style_management_oversight?: string;
  style_child_friendly?: string;
  style_reflective_supervision?: string;
  style_social_worker_update?: string;
  style_ofsted_ready?: string;
  // QA
  quality_check_passed?: boolean;
  quality_check_notes?: Partial<InterventionSessionQualityCheck>;
  // Status and audit
  status: InterventionSessionStatus;
  review_date?: string;
  created_by: string;
  completed_by?: string;
  reviewed_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  reviewed_at?: string;
  approved_at?: string;
}

// ── Livers Outcome Record ─────────────────────────────────────────────────────

export interface LiversOutcomeRecord {
  id: string;
  home_id: string;
  intervention_session_id: string;
  child_id: string;
  child_response?: string;
  what_worked?: string;
  what_did_not_work?: string;
  emotional_presentation?: string;
  risk_change?: "improved" | "same" | "worsened" | "unknown";
  sustainability_change?: "improved" | "same" | "worsened" | "unknown";
  further_action_required?: boolean;
  further_action_notes?: string;
  management_review?: boolean;
  management_review_notes?: string;
  follow_up_sessions_needed?: string;
  created_by: string;
  created_at: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// WORKFORCE INTELLIGENCE & SUCCESSION PATHWAY
// ══════════════════════════════════════════════════════════════════════════════

// ── Career Pathway ────────────────────────────────────────────────────────────

export type PathwayStage =
  | "inductee"
  | "rsw"
  | "senior_rsw"
  | "team_leader"
  | "deputy_manager"
  | "registered_manager"
  | "ri";

export const PATHWAY_STAGE_LABELS: Record<PathwayStage, string> = {
  inductee:           "Inductee",
  rsw:                "Residential Support Worker",
  senior_rsw:         "Senior RSW",
  team_leader:        "Team Leader",
  deputy_manager:     "Deputy Manager",
  registered_manager: "Registered Manager",
  ri:                 "Responsible Individual",
};

export const PATHWAY_STAGE_ORDER: PathwayStage[] = [
  "inductee", "rsw", "senior_rsw", "team_leader",
  "deputy_manager", "registered_manager", "ri",
];

// ── Competency Domains ────────────────────────────────────────────────────────

export type CompetencyDomain =
  | "safeguarding_and_child_protection"
  | "therapeutic_relationships"
  | "trauma_informed_practice"
  | "risk_management"
  | "statutory_compliance"
  | "communication_and_recording"
  | "leadership_and_supervision"
  | "self_care_and_resilience"
  | "learning_and_professional_development"
  | "equality_diversity_inclusion";

export const COMPETENCY_DOMAIN_LABELS: Record<CompetencyDomain, string> = {
  safeguarding_and_child_protection:    "Safeguarding & Child Protection",
  therapeutic_relationships:             "Therapeutic Relationships",
  trauma_informed_practice:              "Trauma-Informed Practice",
  risk_management:                       "Risk Management",
  statutory_compliance:                  "Statutory Compliance",
  communication_and_recording:           "Communication & Recording",
  leadership_and_supervision:            "Leadership & Supervision",
  self_care_and_resilience:              "Self-Care & Resilience",
  learning_and_professional_development: "Learning & Professional Development",
  equality_diversity_inclusion:          "Equality, Diversity & Inclusion",
};

export const ALL_COMPETENCY_DOMAINS: CompetencyDomain[] = [
  "safeguarding_and_child_protection",
  "therapeutic_relationships",
  "trauma_informed_practice",
  "risk_management",
  "statutory_compliance",
  "communication_and_recording",
  "leadership_and_supervision",
  "self_care_and_resilience",
  "learning_and_professional_development",
  "equality_diversity_inclusion",
];

// 0 = not yet assessed, 1 = developing, 2 = emerging, 3 = competent, 4 = proficient, 5 = expert
export type CompetencyLevel = 0 | 1 | 2 | 3 | 4 | 5;

export const COMPETENCY_LEVEL_LABELS: Record<CompetencyLevel, string> = {
  0: "Not Assessed",
  1: "Developing",
  2: "Emerging",
  3: "Competent",
  4: "Proficient",
  5: "Expert",
};

// ── Competency Score (single domain rating for one staff member) ───────────────

export interface CompetencyScore {
  id: string;
  staff_id: string;
  home_id: string;
  domain: CompetencyDomain;
  score: CompetencyLevel;
  evidence_notes?: string;
  linked_observation_ids: string[];
  assessed_by: string;
  assessed_at: string;
  next_review_date?: string;
  created_at: string;
  updated_at: string;
}

// ── Staff Competency Profile (aggregate view) ─────────────────────────────────

export interface StaffCompetencyProfile {
  id: string;
  staff_id: string;
  home_id: string;
  current_stage: PathwayStage;
  target_stage?: PathwayStage;
  overall_readiness_score: number; // 0-100
  domain_scores: CompetencyScore[];
  strengths: string[];
  development_areas: string[];
  cara_narrative?: string;
  last_assessed_at?: string;
  next_review_date?: string;
  created_at: string;
  updated_at: string;
}

// ── Development Plan ──────────────────────────────────────────────────────────

export type DevelopmentPlanStatus = "draft" | "active" | "paused" | "completed" | "superseded";

export interface DevelopmentPlanAction {
  id: string;
  title: string;
  description: string;
  domain: CompetencyDomain;
  target_date?: string;
  completed: boolean;
  completed_at?: string;
  evidence_notes?: string;
}

export interface DevelopmentPlan {
  id: string;
  staff_id: string;
  home_id: string;
  title: string;
  from_stage: PathwayStage;
  to_stage: PathwayStage;
  status: DevelopmentPlanStatus;
  cara_generated: boolean;
  cara_rationale?: string;
  actions: DevelopmentPlanAction[];
  review_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approved_by?: string;
  approved_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ── Practice Observation ──────────────────────────────────────────────────────

export type ObservationOutcome = "meets_standard" | "developing" | "requires_support" | "outstanding";

export interface PracticeObservation {
  id: string;
  staff_id: string;
  home_id: string;
  observer_id: string;
  observation_date: string;
  context: string;
  domains_observed: CompetencyDomain[];
  narrative: string;
  strengths_noted: string[];
  areas_for_development: string[];
  outcome: ObservationOutcome;
  score_adjustments: Array<{ domain: CompetencyDomain; delta: -1 | 0 | 1 }>;
  linked_development_plan_id?: string;
  staff_response?: string;
  signed_off_by_staff: boolean;
  signed_off_at?: string;
  cara_summary?: string;
  created_at: string;
  updated_at: string;
}

// ── Career Readiness Report ───────────────────────────────────────────────────

export interface CareerReadinessReport {
  id: string;
  staff_id: string;
  home_id: string;
  target_stage: PathwayStage;
  overall_ready: boolean;
  readiness_score: number; // 0-100
  domain_summaries: Array<{
    domain: CompetencyDomain;
    current_score: CompetencyLevel;
    required_score: CompetencyLevel;
    gap: number;
    notes?: string;
  }>;
  blocking_gaps: CompetencyDomain[];
  cara_recommendation: string;
  generated_by: "cara" | "manager";
  generated_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

// ── Succession Plan ───────────────────────────────────────────────────────────

export type SuccessionUrgency = "immediate" | "six_months" | "twelve_months" | "long_term";

export interface SuccessionCandidate {
  staff_id: string;
  readiness_score: number;
  ready_now: boolean;
  estimated_ready_date?: string;
  development_plan_id?: string;
  notes?: string;
}

export interface SuccessionPlan {
  id: string;
  home_id: string;
  role_title: string;
  target_stage: PathwayStage;
  urgency: SuccessionUrgency;
  candidates: SuccessionCandidate[];
  cara_narrative?: string;
  approved_by?: string;
  approved_at?: string;
  review_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ── Appraisal Record ──────────────────────────────────────────────────────────

export type AppraisalType = "probation_review" | "annual_appraisal" | "mid_year" | "pip";
export type AppraisalStatus = "scheduled" | "in_progress" | "completed" | "overdue";
export type AppraisalRating = "outstanding" | "good" | "requires_improvement" | "inadequate";

export interface AppraisalRecord {
  id: string;
  staff_id: string;
  home_id: string;
  appraisal_type: AppraisalType;
  appraisal_date: string;
  appraiser_id: string;
  status: AppraisalStatus;
  overall_rating?: AppraisalRating;
  competency_scores: Partial<Record<CompetencyDomain, CompetencyLevel>>;
  key_achievements?: string;
  areas_for_improvement?: string;
  objectives_next_period?: string;
  linked_development_plan_id?: string;
  cara_insights?: string;
  staff_comments?: string;
  signed_by_staff: boolean;
  signed_at?: string;
  next_review_date?: string;
  created_at: string;
  updated_at: string;
}

// ── Induction Record ──────────────────────────────────────────────────────────

export type InductionCheckStatus = "not_started" | "in_progress" | "completed" | "signed_off";

export interface InductionCheckItem {
  id: string;
  title: string;
  description?: string;
  required_by_day: number;
  status: InductionCheckStatus;
  completed_at?: string;
  completed_by?: string;
  evidence_notes?: string;
}

export interface InductionRecord {
  id: string;
  staff_id: string;
  home_id: string;
  start_date: string;
  target_completion_date: string;
  buddy_id?: string;
  line_manager_id: string;
  items: InductionCheckItem[];
  overall_status: InductionCheckStatus;
  probation_passed?: boolean;
  probation_passed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ── Qualification Record ──────────────────────────────────────────────────────

export type QualificationStatus = "not_started" | "in_progress" | "completed" | "expired" | "exempt";

export interface QualificationRecord {
  id: string;
  staff_id: string;
  home_id: string;
  qualification_name: string;
  awarding_body?: string;
  level?: string;
  mandatory: boolean;
  regulatory_requirement?: string;
  status: QualificationStatus;
  started_at?: string;
  completed_at?: string;
  expiry_date?: string;
  certificate_ref?: string;
  evidence_document_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ── Welfare Check ─────────────────────────────────────────────────────────────

export type WelfareCheckStatus = "ok" | "concern" | "asleep" | "awake" | "not_in_room" | "refused";

export interface WelfareCheck {
  id: string;
  child_id: string;
  staff_id: string;
  home_id: string;
  check_date: string;
  check_time: string;
  status: WelfareCheckStatus;
  location: string;
  mood?: string;
  notes?: string;
  concern_details?: string;
  concern_escalated?: boolean;
  escalated_to?: string;
  physical_marks_noted?: boolean;
  marks_description?: string;
  door_locked?: boolean;
  window_secure?: boolean;
  room_temperature?: "comfortable" | "too_hot" | "too_cold";
  created_at: string;
}

export interface WelfareCheckRound {
  id: string;
  home_id: string;
  staff_id: string;
  round_date: string;
  round_time: string;
  shift_type: string;
  checks: WelfareCheck[];
  all_children_checked: boolean;
  building_secure: boolean;
  fire_exits_clear: boolean;
  external_doors_locked: boolean;
  alarm_set: boolean;
  additional_notes?: string;
  completed_at?: string;
  created_at: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// OUTCOMES TRACKER — Young People's Progress Against Care Plan Goals
// Ofsted ILACS primary focus area — "Are children making progress?"
// ══════════════════════════════════════════════════════════════════════════════

export type OutcomeDomain =
  | "health"
  | "education"
  | "emotional_wellbeing"
  | "identity"
  | "family_social"
  | "self_care"
  | "independence"
  | "behaviour";

export const OUTCOME_DOMAIN_LABELS: Record<OutcomeDomain, string> = {
  health:               "Health",
  education:            "Education",
  emotional_wellbeing:  "Emotional Wellbeing",
  identity:             "Identity & Self-Esteem",
  family_social:        "Family & Social Relationships",
  self_care:            "Self-Care Skills",
  independence:         "Independence & Life Skills",
  behaviour:            "Behaviour & Boundaries",
};

export type OutcomeRating = 1 | 2 | 3 | 4 | 5;
export type OutcomeDirection = "improving" | "stable" | "declining";

export const OUTCOME_RATING_LABELS: Record<OutcomeRating, string> = {
  1: "Significant concerns",
  2: "Below expected",
  3: "Progressing",
  4: "Good progress",
  5: "Excellent / age-appropriate",
};

export interface OutcomeTarget {
  id: string;
  child_id: string;
  home_id: string;
  domain: OutcomeDomain;
  target_description: string;
  success_criteria: string;
  baseline_rating: OutcomeRating;
  current_rating: OutcomeRating;
  target_rating: OutcomeRating;
  direction: OutcomeDirection;
  status: "active" | "achieved" | "on_hold" | "revised";
  review_date: string;
  set_by: string;
  set_date: string;
  yp_voice: string | null;
  notes: string | null;
  evidence_notes: string | null;
  linked_care_plan_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutcomeReview {
  id: string;
  target_id: string;
  child_id: string;
  home_id: string;
  review_date: string;
  previous_rating: OutcomeRating;
  new_rating: OutcomeRating;
  direction: OutcomeDirection;
  reviewer_id: string;
  reviewer_role: string;
  yp_participated: boolean;
  yp_voice: string | null;
  progress_notes: string;
  barriers: string | null;
  next_steps: string | null;
  created_at: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// LAC REVIEWS — Looked-After Children statutory review meetings
// ══════════════════════════════════════════════════════════════════════════════

export type LACReviewType = "initial" | "first_review" | "subsequent" | "emergency" | "disruption";
export type LACReviewOutcome = "placement_continues" | "placement_change" | "care_plan_amended" | "actions_agreed" | "return_home";
export type LACChildParticipation = "attended" | "views_submitted" | "advocate_attended" | "did_not_participate";
export type LACPlacementStability = "stable" | "some_concerns" | "at_risk";

export interface LACReviewAttendee {
  name: string;
  role: string;
}

export interface LACReviewAction {
  action: string;
  owner: string;
  due_date: string;
  completed: boolean;
}

export interface LACReview {
  id: string;
  child_id: string;
  date: string;
  review_type: LACReviewType;
  iro: string;
  venue: string;
  attendees: LACReviewAttendee[];
  child_participation: LACChildParticipation;
  child_views: string;
  key_discussions: string[];
  recommendations: string[];
  outcome: LACReviewOutcome;
  actions_agreed: LACReviewAction[];
  next_review_date: string;
  placement_stability: LACPlacementStability;
  care_plan_updated: boolean;
  notes: string;
  recorded_by: string;
  home_id: string;
  created_at: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// BEHAVIOUR SUPPORT PLANS — formal structured plans for challenging behaviour
// ══════════════════════════════════════════════════════════════════════════════

export interface BSPPrimaryBehaviour {
  behaviour: string;
  frequency: "daily" | "weekly" | "occasional" | "rare";
  severity: "low" | "medium" | "high";
  trend: "improving" | "stable" | "worsening";
}

export interface BSPKnownTrigger {
  trigger: string;
  category: "environmental" | "emotional" | "social" | "sensory" | "routine_change" | "demand" | "transition";
  likelihood: "high" | "medium" | "low";
}

export interface BSPDeEscalationStage {
  stage: "green" | "amber" | "red";
  strategies: string[];
  staff_approach: string;
}

export interface BSPPositiveStrategy {
  strategy: string;
  frequency: string;
  effectiveness: "highly_effective" | "effective" | "partially_effective" | "not_effective";
}

export interface BSPReward {
  reward: string;
  earned_by: string;
  frequency: string;
}

export interface BSPBoundary {
  boundary: string;
  consequence: string;
  rationale: string;
}

export interface BSPSafetyPlanItem {
  scenario: string;
  response: string;
  staff_required: number;
}

export interface BSPProfessionalInput {
  name: string;
  role: string;
  recommendation: string;
  date: string;
}

export interface BSPRestrictiveIntervention {
  intervention: string;
  last_resort: boolean;
  authorised_by: string;
  conditions: string;
}

export interface BSPReviewHistoryEntry {
  date: string;
  reviewed_by: string;
  changes: string;
  outcome: string;
}

export interface BehaviourSupportPlan {
  id: string;
  child_id: string;
  created_date: string;
  created_by: string;
  review_date: string;
  last_reviewed: string | null;
  status: "active" | "under_review" | "draft" | "archived" | "suspended";
  diagnosis: string[];
  primary_behaviours: BSPPrimaryBehaviour[];
  known_triggers: BSPKnownTrigger[];
  early_warnings: string[];
  de_escalation: BSPDeEscalationStage[];
  positive_strategies: BSPPositiveStrategy[];
  rewards: BSPReward[];
  boundaries: BSPBoundary[];
  safety_plan: BSPSafetyPlanItem[];
  communication_needs: string;
  sensory_considerations: string;
  child_views: string;
  parent_views: string;
  professional_input: BSPProfessionalInput[];
  staff_guidance: string[];
  restrictive_interventions: BSPRestrictiveIntervention[];
  review_history: BSPReviewHistoryEntry[];
  home_id: string;
  created_at: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// KEY WORKING SESSIONS — informal key-working interaction records
// ══════════════════════════════════════════════════════════════════════════════

export interface KeyWorkingSession {
  id: string;
  child_id: string;
  staff_id: string;
  date: string;
  type: "one_to_one" | "group" | "informal" | "review" | "wellbeing_check" | "goal_setting" | "life_skills" | "therapeutic";
  duration: number;
  location: string;
  topics: string[];
  child_voice: string;
  worker_observations: string;
  actions_agreed: string[];
  mood_before: 1 | 2 | 3 | 4 | 5;
  mood_after: 1 | 2 | 3 | 4 | 5;
  follow_up: string;
  follow_up_date: string;
  follow_up_completed: boolean;
  linked_goals: string[];
  confidential: boolean;
  home_id: string;
  created_at: string;
}

// ── Education Records ────────────────────────────────────────────────────────

// Extended for §5.18 education-disruption triggers: suspensions, managed moves,
// reduced timetables and informal send-homes are first-class events — school
// instability is a care-planning event, not an education footnote.
export type EducationRecordType =
  | "attendance" | "exclusion" | "pep_meeting" | "attainment" | "provision_change" | "achievement" | "concern"
  | "suspension" | "managed_move" | "reduced_timetable" | "informal_send_home";
export type EducationAttendanceStatus = "present" | "absent_authorised" | "absent_unauthorised" | "late" | "excluded" | "part_day";

export interface EducationRecord {
  id: string;
  child_id: string;
  record_type: EducationRecordType;
  title: string;
  date: string;
  school?: string;
  details?: string;
  outcome?: string;
  follow_up_date?: string;
  attendance_status?: EducationAttendanceStatus | null;
  linked_pep?: boolean;
  staff_id: string;
  status: "open" | "resolved" | "monitoring";
  home_id?: string;
  created_at?: string;
}

// ── Delegated Authority ─────────────────────────────────────────────────────

export type DelegatedAuthStatus = "granted" | "not_granted" | "partial" | "pending";
export type DelegatedAuthCategory = "medical" | "education" | "leisure" | "overnight_stays" | "travel" | "haircut_appearance" | "social_media" | "religion" | "pocket_money" | "contact" | "photography" | "emergency";

export interface DelegatedAuthorityItem {
  category: DelegatedAuthCategory;
  status: DelegatedAuthStatus;
  detail: string;
  conditions: string;
  granted_by: string;
  granted_date: string;
  review_date: string;
}

export interface DelegatedAuthority {
  id: string;
  child_id: string;
  last_reviewed: string;
  next_review: string;
  items: DelegatedAuthorityItem[];
  notes: string;
}

// ── House Meetings ──────────────────────────────────────────────────────────

export type HouseMeetingType = "regular" | "special" | "emergency" | "welcome" | "feedback";

export interface HouseMeetingAgendaItem {
  topic: string;
  raised_by: string;
  discussion: string;
  outcome: string;
}

export interface HouseMeeting {
  id: string;
  date: string;
  meeting_type: HouseMeetingType;
  chair_person: string;
  minutes_taker: string;
  children_present: string[];
  children_absent: string[];
  staff_present: string[];
  agenda: HouseMeetingAgendaItem[];
  child_feedback: string[];
  actions_from_previous: { action: string; owner: string; completed: boolean }[];
  new_actions: { action: string; owner: string; due_date: string }[];
  general_comments: string;
  next_meeting_date: string;
  duration: number;
  created_at: string;
}

// ── Sanctions & Rewards ─────────────────────────────────────────────────────

export type SRDirection = "reward" | "sanction";
export type SRRewardType = "verbal_praise" | "written_praise" | "activity_reward" | "token" | "achievement" | "privilege" | "other_reward";
export type SRSanctionType = "loss_of_privilege" | "verbal_reminder" | "time_out" | "earlier_bedtime" | "extra_chore" | "restorative_conversation" | "other_sanction";

export interface SanctionRewardEntry {
  id: string;
  child_id: string;
  date: string;
  time: string;
  direction: SRDirection;
  reward_type: SRRewardType | null;
  sanction_type: SRSanctionType | null;
  title: string;
  description: string;
  context: string;
  child_response: string;
  outcome: string;
  proportionate: boolean;
  recorded_by: string;
  created_at: string;
}

// ── Young Person Feedback ───────────────────────────────────────────────────

export type YPFeedbackCategory = "food" | "activities" | "staff" | "bedroom" | "rules" | "school_support" | "feeling_safe" | "being_listened_to" | "family_contact" | "general";
export type YPFeedbackMethod = "verbal" | "written" | "art" | "meeting" | "survey" | "worry_box" | "advocate";
export type YPFeedbackSentiment = "very_happy" | "happy" | "ok" | "unhappy" | "very_unhappy";

export interface YPFeedbackEntry {
  id: string;
  child_id: string;
  date: string;
  category: YPFeedbackCategory;
  method: YPFeedbackMethod;
  sentiment: YPFeedbackSentiment;
  feedback: string;
  action_taken: string;
  action_by: string;
  response_given_to_child: boolean;
  response_date: string | null;
  response_details: string;
  child_satisfied: boolean | null;
  collected_by: string;
  notes: string;
}

// ── Sleep Log ───────────────────────────────────────────────────────────────

export type SleepShiftType = "sleep_in" | "waking_night";
export type SleepDisturbanceLevel = "none" | "minor" | "moderate" | "significant";

export interface SleepDisturbance {
  time: string;
  young_person: string;
  description: string;
  action_taken: string;
  duration: number;
}

export interface SleepLogEntry {
  id: string;
  date: string;
  shift_type: SleepShiftType;
  staff_id: string;
  start_time: string;
  end_time: string;
  disturbance_level: SleepDisturbanceLevel;
  disturbances: SleepDisturbance[];
  checks_completed: string[];
  building_secure: boolean;
  alarms_set: boolean;
  handover_notes: string;
  morning_handover: string;
  hours_slept: number | null;
}

// ── Compliments ─────────────────────────────────────────────────────────────

export type ComplimentSource = "young_person" | "parent_carer" | "social_worker" | "irp" | "school" | "health_professional" | "reg44_visitor" | "neighbour" | "other_professional";
export type ComplimentCategory = "care_quality" | "staff_conduct" | "environment" | "communication" | "activities" | "education_support" | "health_support" | "family_contact" | "overall_experience" | "specific_staff";

export interface Compliment {
  id: string;
  date: string;
  source: ComplimentSource;
  source_name: string;
  category: ComplimentCategory;
  related_yp: string | null;
  related_staff: string | null;
  compliment: string;
  shared_with_team: boolean;
  shared_date: string | null;
  added_to_reg45: boolean;
  recorded_by: string;
}

/* ── Visitor Log ─────────────────────────────────────────────────────── */

export type VisitorCategory = "professional" | "family" | "tradesperson" | "inspector" | "volunteer" | "other";
export type VisitStatus = "signed_in" | "signed_out" | "expected";

export interface VisitorEntry {
  id: string;
  date: string;
  visitor_name: string;
  organisation: string | null;
  category: VisitorCategory;
  purpose: string;
  dbs_checked: boolean;
  id_verified: boolean;
  sign_in_time: string;
  sign_out_time: string | null;
  status: VisitStatus;
  host_staff_id: string;
  children_seen: string[];
  notes: string | null;
  created_at: string;
}

/* ── Fire Drills ─────────────────────────────────────────────────────── */

export type FireDrillType = "fire_drill" | "evacuation" | "lockdown" | "bomb_threat" | "flood" | "equipment_check";
export type FireDrillResult = "satisfactory" | "issues_identified" | "failed" | "not_completed";

export interface FireDrill {
  id: string;
  date: string;
  time: string;
  drill_type: FireDrillType;
  evacuation_time_seconds: number | null;
  result: FireDrillResult;
  all_present: boolean;
  children_present: string[];
  staff_present: string[];
  issues: string;
  actions_taken: string;
  next_drill_due: string;
  conducted_by: string;
  notes: string;
  created_at: string;
}

/* ── Significant Events ──────────────────────────────────────────────── */

export type SigEventCategory = "positive_achievement" | "placement_change" | "health_event" | "safeguarding" | "legal_court" | "family_event" | "education_milestone" | "behavioural" | "disclosure" | "other";
export type SigEventSeverity = "positive" | "routine" | "concerning" | "serious" | "critical";
export type SigEventNotifyStatus = "not_required" | "notified" | "pending" | "escalated";

export interface SignificantEvent {
  id: string;
  child_id: string;
  date: string;
  time: string;
  category: SigEventCategory;
  severity: SigEventSeverity;
  title: string;
  description: string;
  immediate_action: string;
  staff_present: string[];
  witnessed_by: string[];
  child_response: string;
  outcome: string;
  notifications: { party: string; status: SigEventNotifyStatus; date: string }[];
  follow_up_required: boolean;
  follow_up_actions: string;
  follow_up_date: string;
  linked_documents: string[];
  recorded_by: string;
  created_at: string;
}

/* ── Restraint Log ───────────────────────────────────────────────────── */

export type RestraintType = "standing" | "seated" | "ground" | "escort" | "other";
export type RestraintReason = "harm_to_self" | "harm_to_others" | "significant_damage" | "absconding_danger";
export type RestraintReviewStatus = "pending_rm" | "pending_ri" | "reviewed" | "referred_lado";

export interface RestraintStaffEntry {
  staff_id: string;
  role: string;
  technique: string;
  /** Whether this staff member held current Team-Teach training at the time —
   *  consumed by the restraint/restrictive-practice engines. Optional because
   *  historical records predate its capture. */
  team_teach_trained?: boolean;
}

export interface RestraintInjury {
  person: string;
  injury: string;
  treatment: string;
}

export interface RestraintRecord {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  child_id: string;
  staff_involved: RestraintStaffEntry[];
  reason: RestraintReason;
  restraint_type: RestraintType;
  antecedent: string;
  behaviour: string;
  de_escalation_attempts: string[];
  justification: string;
  description: string;
  injuries: RestraintInjury[];
  child_debriefed: boolean;
  child_debrief_notes: string;
  staff_debriefed: boolean;
  witnessed_by: string[];
  review_status: RestraintReviewStatus;
  review_notes: string;
  reviewed_by: string;
  linked_incident_id: string;
  notifications_sent: { party: string; date: string }[];
  body_map_completed: boolean;
  medical_check_completed: boolean;
  recorded_by: string;
  created_at: string;
}

/* ── Notifiable Events ───────────────────────────────────────────────── */

export type NotifiableEventType = "death" | "serious_illness" | "serious_injury" | "serious_incident" | "child_protection" | "police_involvement" | "absconding" | "allegation_against_staff" | "restraint" | "exclusion_from_school" | "fire" | "outbreak" | "significant_complaint" | "ofsted_referral";
export type NotifiableStatus = "pending" | "notified_within_24h" | "notified_late" | "not_required";

export interface NotifiableNotification {
  body: string;
  notified_date: string | null;
  method: string;
  reference: string | null;
}

export interface NotifiableEvent {
  id: string;
  date: string;
  event_type: NotifiableEventType;
  child_id: string | null;
  summary: string;
  detail: string;
  immediate_action: string;
  reported_by: string;
  ofsted_status: NotifiableStatus;
  ofsted: NotifiableNotification;
  local_authority: NotifiableNotification;
  placing: NotifiableNotification;
  follow_up: string;
  lesson_learned: string;
}

/* ── Night Log ───────────────────────────────────────────────────────── */

export type NightCheckStatus = "asleep" | "awake_settled" | "awake_unsettled" | "not_in_room" | "refused_entry";
export type NightIncidentType = "disturbance" | "self_harm_concern" | "missing" | "medication" | "property" | "visitor" | "other";

export interface NightCheck {
  time: string;
  child_id: string;
  status: NightCheckStatus;
  notes: string;
}

export interface NightIncident {
  time: string;
  child_id: string | null;
  incident_type: NightIncidentType;
  description: string;
  action_taken: string;
  escalated: boolean;
  escalated_to: string | null;
}

export interface NightMedication {
  time: string;
  child_id: string;
  medication: string;
  dose: string;
  notes: string;
}

export interface NightSecurityCheck {
  time: string;
  item: string;
  status: "secure" | "issue";
}

export interface NightLogEntry {
  id: string;
  date: string;
  waking_night_staff: string[];
  sleep_in_staff: string | null;
  shift_start: string;
  shift_end: string;
  handover_from_day: string;
  handover_to_morning: string;
  checks: NightCheck[];
  incidents: NightIncident[];
  medication_given: NightMedication[];
  security_checks: NightSecurityCheck[];
  summary: string;
  concerns: string | null;
}

/* ── Behaviour Log ──────────────────────────────────────────────────── */

export type BehaviourDirection = "positive" | "concern";
export type BehaviourIntensity = "low" | "moderate" | "high" | "critical";

export interface BehaviourEntry {
  id: string;
  child_id: string;
  date: string;
  time: string;
  direction: BehaviourDirection;
  intensity: BehaviourIntensity;
  title: string;
  antecedent: string;
  behaviour: string;
  consequence: string;
  trigger: string;
  strategy_used: string;
  outcome: string;
  recorded_by: string;
  created_at: string;
}

/* ── Accident Book ──────────────────────────────────────────────────── */

export type AccidentPersonType = "child" | "staff" | "visitor" | "contractor";
export type AccidentSeverity = "minor" | "moderate" | "major" | "riddor_reportable";
export type AccidentCategory =
  | "slip_trip_fall" | "collision" | "burn_scald" | "cut_laceration"
  | "bite" | "self_harm_injury" | "sport_play" | "assault"
  | "medication_related" | "other";
export type AccidentStatus = "open" | "first_aid_given" | "medical_treatment" | "hospital" | "investigated" | "closed";

export interface AccidentRecord {
  id: string;
  date: string;
  time: string;
  reported_by: string;
  person_type: AccidentPersonType;
  person_id: string | null;
  person_name: string;
  category: AccidentCategory;
  severity: AccidentSeverity;
  status: AccidentStatus;
  location: string;
  description: string;
  injury_details: string;
  first_aid_given: boolean;
  first_aid_by: string | null;
  first_aid_details: string;
  medical_attention: boolean;
  hospital_attendance: boolean;
  hospital_name: string | null;
  parent_carer_notified: boolean;
  parent_notified_time: string | null;
  social_worker_notified: boolean;
  riddor_reported: boolean;
  riddor_ref: string | null;
  witnesses: string[];
  root_cause: string;
  preventive_measures: string;
  follow_up_date: string | null;
  photographs_taken: boolean;
  body_map_completed: boolean;
  signed_off_by: string | null;
  created_at: string;
}

/* ── Absence Tracking ───────────────────────────────────────────────── */

export type AbsenceType = "authorised" | "unauthorised" | "medical" | "exclusion" | "part_time_timetable" | "late_arrival" | "internal_truancy";
export type AbsenceSetting = "school" | "college" | "pru" | "tuition" | "activity" | "appointment";

export interface AbsenceRecord {
  id: string;
  child_id: string;
  date: string;
  absence_type: AbsenceType;
  setting: AbsenceSetting;
  setting_name: string;
  sessions: number;
  reason: string;
  action_taken: string;
  school_notified: boolean;
  sw_notified: boolean;
  recorded_by: string;
  follow_up: string | null;
  created_at: string;
}

/* ── Positive Handling Plans ────────────────────────────────────────── */

export interface PHPDeEscalation {
  technique: string;
  effectiveness: "usually_effective" | "sometimes_effective" | "rarely_effective";
}

export interface PHPPhysicalResponse {
  scenario: string;
  approved_techniques: string[];
  contraindicated: string[];
  max_duration: string;
  medical_considerations: string;
}

export interface PositiveHandlingPlan {
  id: string;
  child_id: string;
  version: string;
  created_date: string;
  last_reviewed: string;
  next_review: string;
  reviewed_by: string;
  triggers: string[];
  early_warning: string[];
  de_escalation: PHPDeEscalation[];
  physical_responses: PHPPhysicalResponse[];
  post_incident_support: string[];
  child_preferences: string;
  medical_factors: string;
  staff_authorised: string[];
  consent_obtained: boolean;
  sw_consulted: boolean;
  parent_notified: boolean;
  notes: string;
  created_at: string;
}

/* ── Medication Errors ──────────────────────────────────────────────── */

export type MedErrorType =
  | "wrong_dose" | "wrong_medication" | "wrong_time" | "wrong_person"
  | "omission" | "wrong_route" | "expired_medication"
  | "documentation_error" | "near_miss" | "adverse_reaction";
export type MedErrorSeverity = "no_harm" | "low" | "moderate" | "severe" | "death";
export type MedErrorStatus = "reported" | "under_investigation" | "action_required" | "closed" | "escalated";
export type MedRemedialStatus = "pending" | "in_progress" | "completed";

export interface MedRemedialAction {
  action: string;
  owner: string;
  due_date: string;
  status: MedRemedialStatus;
}

export interface MedicationError {
  id: string;
  child_id: string;
  date_occurred: string;
  time_occurred: string;
  reported_by: string;
  reported_date: string;
  error_type: MedErrorType;
  severity: MedErrorSeverity;
  medication: string;
  prescribed_dose: string;
  actual_dose: string;
  what_happened: string;
  immediate_action: string;
  person_informed: string[];
  duty_of_candour: boolean;
  duty_of_candour_completed: string | null;
  root_cause: string;
  contributing_factors: string[];
  remedial_actions: MedRemedialAction[];
  lessons_learned: string;
  status: MedErrorStatus;
  review_date: string | null;
  outcome: string;
  created_at: string;
}

/* ── Body Map ───────────────────────────────────────────────────────── */

export type BodyRegion =
  | "head_front" | "head_back" | "head_left" | "head_right"
  | "face" | "neck"
  | "chest" | "abdomen" | "upper_back" | "lower_back"
  | "left_shoulder" | "right_shoulder"
  | "left_upper_arm" | "right_upper_arm"
  | "left_forearm" | "right_forearm"
  | "left_hand" | "right_hand"
  | "left_hip" | "right_hip"
  | "left_thigh" | "right_thigh"
  | "left_knee" | "right_knee"
  | "left_shin" | "right_shin"
  | "left_foot" | "right_foot";

export type MarkType = "bruise" | "scratch" | "cut" | "burn" | "swelling" | "redness" | "bite_mark" | "pressure_mark" | "old_scar" | "other";
export type MarkColour = "red" | "purple" | "blue" | "yellow" | "green" | "brown" | "black" | "mixed" | "not_applicable";
export type BodyMapStatus = "draft" | "completed" | "reviewed" | "linked_to_incident";

export interface BodyMapEntry {
  id: string;
  child_id: string;
  date: string;
  time: string;
  recorded_by: string;
  body_region: BodyRegion;
  mark_type: MarkType;
  mark_colour: MarkColour;
  size_cm: string;
  description: string;
  child_explanation: string;
  staff_observation: string;
  status: BodyMapStatus;
  linked_incident_id: string | null;
  photos_attached: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

/* ── Activities & Enrichment ────────────────────────────────────────── */

export type ActivityCategory =
  | "sport" | "creative" | "outdoor" | "educational" | "social"
  | "life_skills" | "cultural" | "therapeutic" | "community" | "digital";

export type ActivityEngagement = "enthusiastic" | "willing" | "reluctant" | "refused" | "suggested_by_yp";

export interface Activity {
  id: string;
  date: string;
  child_id: string;
  category: ActivityCategory;
  title: string;
  description: string;
  location: string;
  duration_minutes: number;
  staff_id: string;
  engagement: ActivityEngagement;
  yp_feedback: string | null;
  outcome_notes: string | null;
  is_new_experience: boolean;
  photos_taken: boolean;
  linked_outcome_domain: string | null;
  created_at: string;
}

/* ── Adoption Support Records ───────────────────────────────────────── */

export type AdoptionStatus =
  | "plan_being_explored" | "placement_order_granted" | "family_finding"
  | "matched" | "introductions" | "placed_for_adoption" | "adopted" | "plan_changed";

export interface AdoptionIntroductionPhase {
  phase: string;
  dates: string;
  activities: string;
}

export interface AdoptionRecord {
  id: string;
  child_initials: string;
  age: number;
  arrival_date: string;
  adoption_status: AdoptionStatus;
  local_authority: string;
  placement_order_date: string;
  matching_panel_date: string;
  adoption_family_info: string;
  introduction_plan: AdoptionIntroductionPhase[];
  preparation_activities: string[];
  life_story_completed: boolean;
  later_life_letter: boolean;
  goodbye_rituals_planned: string[];
  support_provided_post_placement: string[];
  contact_arrangements: string;
  home_key_worker_involvement: string;
  adoption_support_plan: string[];
  child_contribution: string;
  social_worker: string;
  adoption_social_worker: string;
  internal_lead: string;
  review_date: string;
  last_update: string;
  created_at: string;
}

/* ── Advocacy ───────────────────────────────────────────────────────── */

export type AdvocacyType = "independent" | "issue_based" | "peer" | "legal" | "complaints";
export type AdvocacyStatus = "active" | "completed" | "pending_referral" | "declined_by_yp";

export interface AdvocacyVisit {
  date: string;
  visit_type: "face_to_face" | "phone" | "virtual";
  summary: string;
  private_session: boolean;
  actions_raised: string[];
}

export interface AdvocacyRecord {
  id: string;
  child_id: string;
  advocacy_type: AdvocacyType;
  status: AdvocacyStatus;
  provider: string;
  advocate_name: string;
  referral_date: string;
  start_date: string | null;
  reason: string;
  issues_raised: string[];
  visits: AdvocacyVisit[];
  child_view: string;
  home_response: string;
  review_date: string;
  notes: string;
  created_at: string;
}

/* ── After Care ─────────────────────────────────────────────────────── */

export type AfterCareLeftReason = "age_18" | "moved_placement" | "reunification" | "semi_independent" | "adoption" | "other";
export type AfterCareAccomStatus = "stable" | "at_risk" | "homeless" | "sofa_surfing" | "supported_housing";
export type AfterCareEETStatus = "education" | "employment" | "training" | "neet" | "unknown";
export type AfterCareRAG = "green" | "amber" | "red";
export type AfterCareWellbeing = "good" | "fair" | "poor" | "concern";

export interface AfterCareContactLog {
  date: string;
  contact_type: string;
  staff_id: string;
  summary: string;
  wellbeing: AfterCareWellbeing;
}

export interface AfterCareSupportPkg {
  area: string;
  provider: string;
  frequency: string;
  status: "active" | "ended" | "pending";
}

export interface AfterCareRecord {
  id: string;
  child_id: string;
  left_date: string;
  left_reason: AfterCareLeftReason;
  current_accommodation: string;
  accommodation_status: AfterCareAccomStatus;
  education_employment: string;
  eet_status: AfterCareEETStatus;
  staying_close_eligible: boolean;
  support_package: AfterCareSupportPkg[];
  contact_log: AfterCareContactLog[];
  key_worker: string;
  personal_adviser: string;
  pathway_plan: boolean;
  pathway_plan_review_date: string | null;
  emergency_contact: string;
  current_concerns: string[];
  positives: string[];
  overall_rag: AfterCareRAG;
  next_contact_due: string;
  notes: string;
  created_at: string;
}

/* ── Agency Staff Induction ─────────────────────────────────────────── */

export type AgencyInductionType = "pre_shift_brief" | "half_day_full_induction" | "returning_staff_refresh";

export interface AgencyInductionTopic {
  topic: string;
  covered: boolean;
  notes: string;
}

export interface AgencyInduction {
  id: string;
  agency_staff_name: string;
  agency: string;
  date_inducted: string;
  inducted_by: string;
  induction_duration: number;
  induction_type: AgencyInductionType;
  children_informed_about_agency_arrival: boolean;
  agency_dbs_verified: boolean;
  agency_training_verified: boolean;
  agency_references_verified: boolean;
  induction_topics: AgencyInductionTopic[];
  child_information_shared: string;
  key_policies_shared: string[];
  photo_taken_and_verified: boolean;
  behaviour_support_plans_briefed: boolean;
  agency_staff_signed_induction_pack: boolean;
  shifts_booked: number;
  agency_staff_feedback: string;
  home_feedback_on_agency: string;
  repeat_booking_approved: boolean;
  created_at: string;
}

/* ── Agency Staff Log ───────────────────────────────────────────────── */

export type AgencyVettingStatus = "fully_vetted" | "partially_vetted" | "pending" | "expired";
export type AgencyBookingReason = "sickness_cover" | "vacancy_cover" | "annual_leave" | "training_cover" | "additional_support" | "emergency";

export interface AgencyStaffRecord {
  id: string;
  agency_name: string;
  worker_name: string;
  worker_ref: string;
  date_of_shift: string;
  shift_type: string;
  shift_hours: number;
  booking_reason: AgencyBookingReason;
  covering_for_id: string | null;
  vetting_status: AgencyVettingStatus;
  dbs_number: string;
  dbs_date: string;
  dbs_enhanced: boolean;
  induction_completed: boolean;
  induction_date: string | null;
  induction_by: string | null;
  safeguarding_briefing: boolean;
  young_people_briefing: boolean;
  medication_trained: boolean;
  price_trained_level: string | null;
  feedback_score: number | null;
  feedback_notes: string;
  concerns: string;
  authorised_by_id: string;
  cost_per_hour: number;
  notes: string;
  created_at: string;
}

/* ── Annual Development Reviews ──────────────────────────────────────────── */

export type ADRReviewStatus = "completed" | "scheduled" | "overdue" | "deferred";
export type ADRPerformanceRating = "outstanding" | "good" | "requires_improvement" | "inadequate";

export interface ADRObjective {
  objective: string;
  target: string;
  progress: string;
}

export interface AnnualDevelopmentReview {
  id: string;
  staff_id: string;
  reviewer_id: string;
  review_date: string;
  status: ADRReviewStatus;
  period: string;
  performance_rating: ADRPerformanceRating;
  strengths: string[];
  areas_for_development: string[];
  objectives_set: ADRObjective[];
  qualifications_progress: string;
  training_completed: string[];
  training_needed: string[];
  career_aspirations: string;
  wellbeing_summary: string;
  manager_comments: string;
  staff_comments: string;
  next_review_date: string;
  created_at: string;
}

/* ── Annual Health Assessment ────────────────────────────────────────────── */

export interface AHAHealthDomain {
  domain: string;
  findings: string;
  actions: string;
  follow_up: string;
}

export interface AnnualHealthAssessment {
  id: string;
  child_id: string;
  assessment_date: string;
  assessment_due_date: string;
  assessor: string;
  location: string;
  completed_within_deadline: boolean;
  height: string;
  weight: string;
  bmi_centile: string;
  growth_on_track: boolean;
  domains: AHAHealthDomain[];
  immunisations_up_to_date: boolean;
  dental_check_up_to_date: boolean;
  optical_check_up_to_date: boolean;
  child_contribution: string;
  report_shared: boolean;
  report_shared_with: string[];
  recommendations: string[];
  next_assessment_date: string;
  signed_off_by_la: boolean;
  created_at: string;
}

/* ── Annual Outcomes Report ──────────────────────────────────────────────── */

export type AnnualOutcomeDomain =
  | "health" | "education" | "emotional_wellbeing" | "relationships"
  | "independence" | "identity" | "safety";

export interface AnnualOutcome {
  id: string;
  child_id: string;
  reporting_year: string;
  domain: AnnualOutcomeDomain;
  target_set: string;
  progress_rating: number;
  evidence: string;
  barriers_faced: string[];
  support_provided: string[];
  child_view: string;
  next_year_target: string;
  reviewed_by: string;
  review_date: string;
  created_at: string;
}

/* ── Appointments ────────────────────────────────────────────────────────── */

export type AppointmentType =
  | "gp" | "dental" | "optician" | "camhs" | "hospital"
  | "lac_review" | "pep_meeting" | "social_worker" | "court"
  | "therapy" | "specialist" | "immunisation" | "other";

export type AppointmentStatus = "scheduled" | "attended" | "cancelled" | "missed" | "rescheduled";

export interface Appointment {
  id: string;
  child_id: string;
  date: string;
  time: string;
  type: AppointmentType;
  title: string;
  location: string;
  professional_name: string;
  description: string;
  status: AppointmentStatus;
  outcome: string | null;
  transport_arranged: boolean;
  escort_staff: string | null;
  follow_up_date: string | null;
  recorded_by: string;
  created_at: string;
}

/* ── Assessment of Need ──────────────────────────────────────────────────── */

export type NeedsDomain =
  | "health" | "education" | "identity" | "family_social"
  | "behavioural_emotional" | "self_care_practical" | "spiritual_cultural";

export type NeedsComplexity = "low" | "moderate" | "complex" | "highly_complex";

export interface NeedsDomainAssessment {
  domain: NeedsDomain;
  presenting_needs: string[];
  strengths: string[];
  priorities: string[];
  immediate_actions: string[];
}

export interface NeedsAssessment {
  id: string;
  child_id: string;
  assessment_date: string;
  completed_by: string;
  assessment_version: number;
  arrival_date: string;
  statutory_deadline: string;
  completed_within_deadline: boolean;
  domain_assessments: NeedsDomainAssessment[];
  overall_need_complexity: NeedsComplexity;
  child_input_method: string;
  child_input: string;
  family_input: string;
  professionals_consulted: string[];
  key_risks: string[];
  key_protective_factors: string[];
  recommended_interventions: string[];
  accommodations_recommended: string[];
  pedagogical_approach_identified: string;
  review_schedule: string;
  shared_with_la: boolean;
  shared_date: string;
  signed_off_by_rm: boolean;
  created_at: string;
}

/* ── Attachment Profiles ─────────────────────────────────────────────────── */

export type AttachmentStyle = "secure" | "anxious_ambivalent" | "anxious_avoidant" | "disorganised" | "emerging_secure";
export type AttachmentProfileStatus = "active" | "under_review" | "archived";

export interface AttachmentBehaviour {
  context: string;
  behaviour: string;
  underlying_need: string;
  recommended_response: string;
}

export interface AttachmentKeyRelationship {
  person: string;
  role: string;
  quality: "strong" | "developing" | "strained" | "absent";
  notes: string;
}

export interface AttachmentProfile {
  id: string;
  child_id: string;
  status: AttachmentProfileStatus;
  primary_style: AttachmentStyle;
  secondary_patterns: string[];
  assessed_by: string;
  assessment_date: string;
  review_date: string;
  assessment_source: string;
  early_history: string;
  placement_history: string;
  behaviours: AttachmentBehaviour[];
  key_relationships: AttachmentKeyRelationship[];
  therapeutic_approach: string[];
  staff_guidance: string[];
  protective_factors: string[];
  risk_factors: string[];
  child_views: string;
  professional_input: string;
  notes: string;
  created_at: string;
}

/* ── Behaviour Mapping ─────────────────────────────────────────────── */

export type BehaviourMappingType = "aggression" | "self_harm" | "absconding" | "property_damage" | "verbal_aggression" | "withdrawal" | "refusal" | "dysregulation";
export type BMIntensity = "low" | "moderate" | "high" | "crisis";
export type BMTimeOfDay = "morning" | "afternoon" | "evening" | "night";

export interface BehaviourMapEntry {
  id: string;
  child_id: string;
  date: string;
  time: string;
  time_of_day: BMTimeOfDay;
  behaviour_type: BehaviourMappingType;
  intensity: BMIntensity;
  location: string;
  antecedent: string;
  behaviour: string;
  consequence: string;
  duration: string;
  staff_present: string[];
  de_escalation_used: string[];
  outcome: string;
  trigger_pattern: string | null;
  notes: string;
  created_at: string;
}

/* ── Bereavement & Loss Support ────────────────────────────────────── */

export type BereavementLossType = "death_of_parent" | "death_of_grandparent" | "death_of_sibling" | "death_of_friend" | "death_of_pet" | "loss_of_foster_carer" | "loss_of_birth_family_contact" | "loss_of_country_community" | "loss_of_identity" | "other_significant_loss";
export type GriefStage = "acute" | "adjusting" | "integrated" | "complicated";

export interface BereavementRecord {
  id: string;
  child_id: string;
  record_date: string;
  loss_type: BereavementLossType;
  person_or_thing: string;
  date_of_loss?: string;
  relationship: string;
  grief_stage: GriefStage;
  child_response: string[];
  support_provided: string[];
  external_support?: string;
  memory_work: string[];
  anniversary_marked: boolean;
  anniversary_date?: string;
  child_voice: string;
  staff_observation: string;
  flags_for_review: string[];
  review_date: string;
  key_worker: string;
  created_at: string;
}

/* ── Bullying Incident Log ─────────────────────────────────────────── */

export type BullyingContext = "in_the_home" | "school" | "online" | "community" | "travel";
export type BullyingPerpetratorType = "peer_in_home" | "peer_at_school" | "older_child" | "online_stranger" | "group_of_peers" | "online_peer" | "adult";
export type BullyingType = "verbal" | "physical" | "online_cyber" | "exclusion_social" | "damage_to_property" | "sexualised" | "discriminatory";
export type BullyingStatus = "open_investigating" | "closed_resolved" | "monitoring" | "escalated";

export interface BullyingIncident {
  id: string;
  child_id: string;
  date: string;
  time: string;
  context: BullyingContext;
  perpetrator_type: BullyingPerpetratorType;
  bullying_type: BullyingType;
  description: string;
  child_impact_observed: string;
  child_words_used: string;
  reported_by: string;
  child_wanted_reporting: boolean;
  external_agencies_notified: string[];
  school_notified: boolean;
  police_notified: boolean;
  parents_informed: boolean;
  restorative_approach_attempted: string;
  support_provided: string[];
  perpetrator_outcome: string;
  wellbeing_post_incident: string;
  follow_up_date: string;
  status: BullyingStatus;
  pattern_indicator: string;
  created_at: string;
}

/* ── CAMHS Referral Tracker ────────────────────────────────────────── */

export type CamhsPathway = "standard_camhs" | "asd_neurodevelopmental" | "trauma_focused" | "crisis" | "routine";
export type CamhsUrgency = "routine" | "soon" | "urgent" | "emergency";
export type CamhsReferralStatus = "submitted" | "triaged" | "on_waiting_list" | "active_engagement" | "discharged" | "re_referred";
export type CamhsEngagementLevel = "strong" | "building" | "inconsistent" | "disengaged";

export interface CamhsReferral {
  id: string;
  child_id: string;
  referral_date: string;
  referral_reason: string;
  referrer: string;
  pathway_applied: CamhsPathway;
  urgency: CamhsUrgency;
  referral_status: CamhsReferralStatus;
  waiting_time_weeks: number;
  first_appointment_date: string | null;
  current_clinician: string;
  current_therapeutic_approach: string;
  sessions_held: number;
  sessions_scheduled: number;
  current_engagement_level: CamhsEngagementLevel;
  child_view: string;
  parental_consent: boolean;
  referral_outcome: string;
  reviewed_date: string;
  next_review_date: string;
  escalation_options: string;
  created_at: string;
}

/* ── CCTV Usage Log ────────────────────────────────────────────────── */

export type CCTVAccessReason = "incident_review" | "safeguarding" | "police_request" | "complaint_investigation" | "maintenance_check" | "routine_review" | "sar_request" | "staff_investigation" | "other";
export type CCTVCamera = "front_door" | "rear_garden" | "driveway" | "hallway_ground" | "hallway_first" | "kitchen" | "lounge" | "office_corridor";

export interface CCTVAccess {
  id: string;
  date: string;
  time_accessed: string;
  footage_date: string;
  footage_time_range: string;
  cameras: CCTVCamera[];
  reason: CCTVAccessReason;
  detail: string;
  accessed_by: string;
  authorised_by: string;
  witness_present: string | null;
  footage_copied: boolean;
  copied_to: string;
  external_reference: string;
  outcome: string;
  created_at: string;
}

/* ── ADHD Support Plan ─────────────────────────────────────────────── */

export type ADHDDiagnosisStatus = "diagnosed" | "awaiting_assessment" | "suspected_being_explored" | "self_identified" | "not_currently_considered";
export type ADHDPresentation = "predominantly_inattentive" | "predominantly_hyperactive_impulsive" | "combined" | "unspecified";

export interface ADHDMedication {
  name: string;
  dose: string;
  timing: string;
  side_effects_being_monitored: string[];
  review_date: string;
}

export interface ADHDExternalSupport {
  agency: string;
  role: string;
  frequency: string;
}

export interface ADHDPlan {
  id: string;
  child_id: string;
  plan_date: string;
  diagnosis_status: ADHDDiagnosisStatus;
  presentation?: ADHDPresentation;
  diagnosis_date?: string;
  diagnosing_clinician?: string;
  strengths: string[];
  challenges: string[];
  medication?: ADHDMedication;
  medication_holiday_plan?: string;
  executive_function_support: string[];
  time_blindness_strategies: string[];
  hyperfocus_management: string[];
  rsd_awareness: string;
  rsd_support: string[];
  school_adjustments: string[];
  home_adjustments: string[];
  body_doubling_notes?: string;
  external_support: ADHDExternalSupport[];
  staff_do_strategies: string[];
  staff_do_not_strategies: string[];
  child_voice: string;
  staff_observation: string;
  next_step: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Child Allergies & Anaphylaxis (AAI / EpiPen) Plan ─────────────────

export type AllergySeverity = "mild" | "moderate" | "severe" | "anaphylactic" | "life_threatening";
export const ALLERGY_SEVERITY_LABEL: Record<AllergySeverity, string> = {
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
  anaphylactic: "Anaphylactic",
  life_threatening: "Life Threatening",
};

export type AAIBrand = "epipen" | "jext" | "emerade" | "other";
export const AAI_BRAND_LABEL: Record<AAIBrand, string> = {
  epipen: "EpiPen",
  jext: "Jext",
  emerade: "Emerade",
  other: "Other",
};

export type AAIDose = "150mcg" | "300mcg" | "500mcg";

export interface AllergyAllergenEntry {
  allergen: string;
  severity: AllergySeverity;
  last_reaction?: string;
}

export interface AllergyAntihistamine {
  name: string;
  dose: string;
  route: string;
}

export interface AllergyAAIExpiry {
  location: string;
  expiry: string;
}

export interface AllergyHospitalAdmission {
  date: string;
  reason: string;
  outcome: string;
}

export interface AllergyEmergencyContact {
  name: string;
  role: string;
  phone: string;
}

export interface AllergyPlan {
  id: string;
  child_id: string;
  plan_date: string;
  allergens: AllergyAllergenEntry[];
  antihistamine?: AllergyAntihistamine;
  aai_prescribed: boolean;
  aai_brand?: AAIBrand;
  aai_dose?: AAIDose;
  aai_locations: string[];
  aai_expiry_dates: AllergyAAIExpiry[];
  staff_trained_names: string[];
  staff_training_expires?: string;
  emergency_protocol: string[];
  hospital_admissions: AllergyHospitalAdmission[];
  school_has_plan: boolean;
  school_has_aai: boolean;
  child_can_self_administer: boolean;
  child_wears_medical_alert: boolean;
  emergency_contacts: AllergyEmergencyContact[];
  child_voice: string;
  staff_observation: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Child Aspirations Tracker ─────────────────────────────────────────

export type AspirationDomain =
  | "career"
  | "education"
  | "where_ill_live"
  | "family_i_want"
  | "skills_i_want"
  | "travel"
  | "identity_and_belonging"
  | "relationships"
  | "wellbeing"
  | "creative";

export const ASPIRATION_DOMAIN_LABEL: Record<AspirationDomain, string> = {
  career: "Career",
  education: "Education",
  where_ill_live: "Where I'll live",
  family_i_want: "Family I want",
  skills_i_want: "Skills I want",
  travel: "Travel",
  identity_and_belonging: "Identity & Belonging",
  relationships: "Relationships",
  wellbeing: "Wellbeing",
  creative: "Creative",
};

export type AspirationRealism =
  | "very_achievable"
  | "achievable_with_support"
  | "stretch_goal"
  | "big_dream_long_term";

export const ASPIRATION_REALISM_LABEL: Record<AspirationRealism, string> = {
  very_achievable: "Very achievable",
  achievable_with_support: "Achievable with support",
  stretch_goal: "Stretch goal",
  big_dream_long_term: "Big dream — long term",
};

export interface AspirationRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  domain: AspirationDomain;
  aspiration: string;
  why_it_matters: string;
  current_realism: AspirationRealism;
  steps_taken: string[];
  steps_next: string[];
  support_needed: string[];
  blockers: string[];
  evolved_from_previous?: string;
  child_chose: boolean;
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Child Asthma Action Plan ──────────────────────────────────────────

export type AsthmaDiagnosis =
  | "mild_intermittent"
  | "mild_persistent"
  | "moderate_persistent"
  | "severe_persistent"
  | "exercise_induced_only";

export const ASTHMA_DIAGNOSIS_LABEL: Record<AsthmaDiagnosis, string> = {
  mild_intermittent: "Mild intermittent",
  mild_persistent: "Mild persistent",
  moderate_persistent: "Moderate persistent",
  severe_persistent: "Severe persistent",
  exercise_induced_only: "Exercise-induced only",
};

export interface AsthmaInhaler {
  name: string;
  dose: string;
  timing?: string;
}

export interface AsthmaHospitalAdmission {
  date: string;
  reason: string;
  outcome: string;
}

export interface AsthmaEmergencyContact {
  name: string;
  role: string;
  phone: string;
}

export interface AsthmaPlan {
  id: string;
  child_id: string;
  plan_date: string;
  diagnosis: AsthmaDiagnosis;
  known_triggers: string[];
  preventer_inhaler?: AsthmaInhaler;
  reliever_inhaler?: AsthmaInhaler;
  spacer_needed: boolean;
  peak_flow_best?: number;
  peak_flow_green_zone?: string;
  peak_flow_amber_zone?: string;
  peak_flow_red_zone?: string;
  green_zone_actions: string[];
  amber_zone_actions: string[];
  red_zone_actions: string[];
  hospital_admissions: AsthmaHospitalAdmission[];
  child_can_self_medicate: boolean;
  spare_inhaler_locations: string[];
  school_has_inhaler: boolean;
  emergency_contacts: AsthmaEmergencyContact[];
  child_voice: string;
  staff_observation: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Child Autism Support Plan ─────────────────────────────────────────

export type AutismDiagnosisStatus =
  | "diagnosed"
  | "self_identified"
  | "awaiting_assessment"
  | "suspected_gathering_evidence"
  | "not_currently_considered";

export const AUTISM_DIAGNOSIS_STATUS_LABEL: Record<AutismDiagnosisStatus, string> = {
  diagnosed: "Diagnosed",
  self_identified: "Self-identified",
  awaiting_assessment: "Awaiting assessment",
  suspected_gathering_evidence: "Suspected — gathering evidence",
  not_currently_considered: "Not currently considered",
};

export type AutismSensoryPattern = "seeking" | "avoiding" | "mixed" | "neutral";
export const AUTISM_SENSORY_PATTERN_LABEL: Record<AutismSensoryPattern, string> = {
  seeking: "Seeking",
  avoiding: "Avoiding",
  mixed: "Mixed",
  neutral: "Neutral",
};

export interface AutismSensoryDomainEntry {
  sense: string;
  seeking_or_avoiding: AutismSensoryPattern;
  specific_notes: string;
}

export interface AutismExternalSupport {
  agency: string;
  role: string;
  frequency: string;
}

export interface AutismPlan {
  id: string;
  child_id: string;
  plan_date: string;
  diagnosis_status: AutismDiagnosisStatus;
  diagnosis_date?: string;
  diagnosing_clinician?: string;
  special_interests: string[];
  communication_preferences: string[];
  processing_time: string;
  sensory_profile: AutismSensoryDomainEntry[];
  predictability_needs: string[];
  routine_anchors: string[];
  meltdown_triggers: string[];
  meltdown_support: string[];
  shutdown_indicators: string[];
  shutdown_support: string[];
  masking_awareness: string;
  unmasking_permissions: string[];
  transition_support: string[];
  social_preferences: string[];
  staff_do_strategies: string[];
  staff_do_not_strategies: string[];
  external_support: AutismExternalSupport[];
  child_voice: string;
  staff_observation: string;
  next_step: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Child Bank Account & Money Management ─────────────────────────────

export type ChildBankAccountType =
  | "junior_isa"
  | "childrens_current_account"
  | "savings_account"
  | "cash_card_account";

export const CHILD_BANK_ACCOUNT_TYPE_LABEL: Record<ChildBankAccountType, string> = {
  junior_isa: "Junior ISA",
  childrens_current_account: "Children's Current Account",
  savings_account: "Savings Account",
  cash_card_account: "Cash Card Account",
};

export type ChildBankSupportLevel = "independent" | "supervised" | "joint_signatory";
export const CHILD_BANK_SUPPORT_LEVEL_LABEL: Record<ChildBankSupportLevel, string> = {
  independent: "Independent",
  supervised: "Supervised",
  joint_signatory: "Joint signatory",
};

export type ChildBankTransactionType = "deposit" | "withdrawal" | "interest";
export const CHILD_BANK_TRANSACTION_TYPE_LABEL: Record<ChildBankTransactionType, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  interest: "Interest",
};

export interface ChildBankTransaction {
  date: string;
  type: ChildBankTransactionType;
  amount: number;
  description: string;
  supported_by: string;
}

export interface ChildBankAccount {
  id: string;
  child_id: string;
  account_type: ChildBankAccountType;
  bank_provider: string;
  account_last4: string;
  opened: string;
  child_is_account_holder: boolean;
  corporate_parent_signatory: string;
  deposit_schedule: string;
  current_balance: number;
  savings_target?: number;
  recent_transactions: ChildBankTransaction[];
  monthly_allowance: number;
  financial_literacy_skills: Record<string, string>;
  savings_goals: string[];
  parental_contributions: string;
  looked_after_child_entitlements: string[];
  support_level: ChildBankSupportLevel;
  reviewed_date: string;
  reviewed_by: string;
  child_agreed: boolean;
  next_review_date: string;
  created_at: string;
}

// ── Child Care Anniversary ────────────────────────────────────────────

export type CareAnniversaryType =
  | "entering_care"
  | "coming_to_this_home"
  | "leaving_prior_placement"
  | "reuniting_with_sibling_in_care"
  | "becoming_a_care_leaver_18"
  | "pathway_end_21_25"
  | "other_significant_date";

export const CARE_ANNIVERSARY_TYPE_LABEL: Record<CareAnniversaryType, string> = {
  entering_care: "Entering care",
  coming_to_this_home: "Coming to this home",
  leaving_prior_placement: "Leaving prior placement",
  reuniting_with_sibling_in_care: "Reuniting with sibling in care",
  becoming_a_care_leaver_18: "Becoming a care leaver (18)",
  pathway_end_21_25: "Pathway end (21 / 25)",
  other_significant_date: "Other significant date",
};

export type CareAnniversaryAttitude =
  | "wants_celebrated"
  | "wants_quietly_noted"
  | "wants_ignored"
  | "wants_reflective_space"
  | "mixed_changes_year_by_year"
  | "not_yet_old_enough_to_choose";

export const CARE_ANNIVERSARY_ATTITUDE_LABEL: Record<CareAnniversaryAttitude, string> = {
  wants_celebrated: "Wants celebrated",
  wants_quietly_noted: "Wants quietly noted",
  wants_ignored: "Wants ignored",
  wants_reflective_space: "Wants reflective space",
  mixed_changes_year_by_year: "Mixed / changes year by year",
  not_yet_old_enough_to_choose: "Not yet old enough to choose",
};

export interface CareAnniversaryRecord {
  id: string;
  child_id: string;
  anniversary_type: CareAnniversaryType;
  significant_date: string;
  years_since_event: number;
  child_attitude: CareAnniversaryAttitude;
  upcoming_plan?: string;
  past_approaches_used: string[];
  what_works: string[];
  what_doesnt_work: string[];
  triggers_around_date: string[];
  support_in_place_for_date: string[];
  child_voice: string;
  staff_observation: string;
  flags_for_review: string[];
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Batch 9 ──────────────────────────────────────────────────────────────

export type BikeabilityLevel = "not_started" | "level_1_off_road" | "level_2_on_road_basic" | "level_3_on_road_advanced" | "beyond_independent_rider";
export const BIKEABILITY_LEVEL_LABEL: Record<BikeabilityLevel, string> = {
  not_started: "Not started",
  level_1_off_road: "Level 1 (off-road)",
  level_2_on_road_basic: "Level 2 (on-road basic)",
  level_3_on_road_advanced: "Level 3 (on-road advanced)",
  beyond_independent_rider: "Beyond — independent rider",
};

export type HelmetCondition = "new" | "good" | "replace_soon" | "damaged";
export const HELMET_CONDITION_LABEL: Record<HelmetCondition, string> = {
  new: "New",
  good: "Good",
  replace_soon: "Replace soon",
  damaged: "Damaged",
};

export type BikeMaintenanceCompetence = "adult_led" | "with_prompts" | "independent_basics" | "confident";
export const BIKE_MAINTENANCE_COMPETENCE_LABEL: Record<BikeMaintenanceCompetence, string> = {
  adult_led: "Adult-led",
  with_prompts: "With prompts",
  independent_basics: "Independent basics",
  confident: "Confident",
};

export interface BikeDetails {
  make: string;
  model: string;
  size: string;
  colour: string;
  serial_number?: string;
}

export interface CyclingBikeRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  bike_owned: boolean;
  bike_details?: BikeDetails;
  helmet_owned: boolean;
  helmet_condition?: HelmetCondition;
  lights_fitted: boolean;
  reflective_gear_owned: boolean;
  lock_type?: string;
  bike_storage_location: string;
  bikeability_level: BikeabilityLevel;
  bikeability_certificate_date?: string;
  routes_ridden_independently: string[];
  route_risk_assessment_done: boolean;
  child_wears_helmet_consistently: boolean;
  maintenance_competence: BikeMaintenanceCompetence;
  theft_risk_screening: string[];
  child_voice: string;
  staff_observation: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

export type CharityGrantCategory = "education" | "recreation_hobbies" | "therapy_wellbeing" | "sports_equipment" | "music_arts" | "driving_lessons" | "it_tech" | "travel_experience" | "family_support" | "other";
export const CHARITY_GRANT_CATEGORY_LABEL: Record<CharityGrantCategory, string> = {
  education: "Education",
  recreation_hobbies: "Recreation / hobbies",
  therapy_wellbeing: "Therapy / wellbeing",
  sports_equipment: "Sports equipment",
  music_arts: "Music / arts",
  driving_lessons: "Driving lessons",
  it_tech: "IT / tech",
  travel_experience: "Travel / experience",
  family_support: "Family support",
  other: "Other",
};

export type CharityGrantStatus = "drafted" | "submitted" | "under_review" | "awarded" | "declined" | "partial_award" | "withdrawn";
export const CHARITY_GRANT_STATUS_LABEL: Record<CharityGrantStatus, string> = {
  drafted: "Drafted",
  submitted: "Submitted",
  under_review: "Under review",
  awarded: "Awarded",
  declined: "Declined",
  partial_award: "Partial award",
  withdrawn: "Withdrawn",
};

export interface CharityGrantRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  charity_name: string;
  grant_purpose: string;
  category: CharityGrantCategory;
  application_date: string;
  application_status: CharityGrantStatus;
  amount_requested: number;
  amount_awarded?: number;
  decision_date?: string;
  items_funded: string[];
  evidence_provided_to_charity: string[];
  child_involved_in_application: boolean;
  child_acknowledgement_sent: boolean;
  follow_up_report_required: boolean;
  follow_up_report_date?: string;
  child_voice: string;
  staff_observation: string;
  recorded_by: string;
  created_at: string;
}

export type ClothingShopType = "high_street" | "sports_specialist" | "department_store" | "cultural_specialist" | "sensory_friendly" | "online_child_involvement" | "charity_shop" | "independent_boutique";
export const CLOTHING_SHOP_TYPE_LABEL: Record<ClothingShopType, string> = {
  high_street: "High street",
  sports_specialist: "Sports specialist",
  department_store: "Department store",
  cultural_specialist: "Cultural/Specialist",
  sensory_friendly: "Sensory-friendly",
  online_child_involvement: "Online (with child involvement)",
  charity_shop: "Charity shop",
  independent_boutique: "Independent boutique",
};

export type ShoppingMood = "excited" | "engaged" | "selective" | "overwhelmed" | "reluctant";
export const SHOPPING_MOOD_LABEL: Record<ShoppingMood, string> = {
  excited: "Excited",
  engaged: "Engaged",
  selective: "Selective",
  overwhelmed: "Overwhelmed",
  reluctant: "Reluctant",
};

export interface ClothingShoppingItem {
  item: string;
  cost: number;
  child_chose: boolean;
  reason_for_purchase: string;
}

export interface ClothingShoppingTrip {
  id: string;
  child_id: string;
  date: string;
  shop_name: string;
  shop_type: ClothingShopType;
  staff_escort: string;
  duration_minutes: number;
  budget_available: number;
  spend: number;
  remaining_budget_after: number;
  items_bought: ClothingShoppingItem[];
  child_mood_during: ShoppingMood;
  challenges_navigated: string[];
  staff_support_provided: string;
  child_comments: string;
  child_pride: string;
  items_for_long_term_use: string[];
  items_for_specific_event: string;
  child_chose_all_items: boolean;
  receipts_kept: boolean;
  notes: string;
  created_at: string;
}

export type ContinencePresentation = "nocturnal_enuresis" | "daytime_wetting" | "encopresis" | "mixed" | "post_trauma_onset" | "developmental" | "resolving" | "resolved";
export const CONTINENCE_PRESENTATION_LABEL: Record<ContinencePresentation, string> = {
  nocturnal_enuresis: "Nocturnal enuresis",
  daytime_wetting: "Daytime wetting",
  encopresis: "Encopresis (soiling)",
  mixed: "Mixed",
  post_trauma_onset: "Post-trauma onset",
  developmental: "Developmental — being patient",
  resolving: "Resolving",
  resolved: "Resolved",
};

export interface ContinenceExternalSupport {
  service: string;
  clinician: string;
  frequency: string;
}

export interface ContinencePlan {
  id: string;
  child_id: string;
  plan_date: string;
  presentation: ContinencePresentation;
  presentation_duration: string;
  triggers_links: string[];
  products_in_use: string[];
  bed_protection_in_use: string[];
  fluid_plan: string[];
  toileting_routines: string[];
  alarm_therapy?: string;
  medication?: string;
  external_support_engaged: ContinenceExternalSupport[];
  child_language_used: string;
  privacy_measures: string[];
  laundry_routine: string[];
  staff_do_strategies: string[];
  staff_do_not_strategies: string[];
  progress_notes: string[];
  child_voice: string;
  staff_observation: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

export type CookingCategory = "knife_skills" | "hob_cooking" | "oven_baking" | "microwave" | "recipe_planning" | "shopping_list" | "budgeting" | "food_hygiene" | "allergens_awareness" | "cultural_cooking";
export const COOKING_CATEGORY_LABEL: Record<CookingCategory, string> = {
  knife_skills: "Knife skills",
  hob_cooking: "Hob/cooking",
  oven_baking: "Oven/baking",
  microwave: "Microwave",
  recipe_planning: "Recipe planning",
  shopping_list: "Shopping list",
  budgeting: "Budgeting",
  food_hygiene: "Food hygiene",
  allergens_awareness: "Allergens awareness",
  cultural_cooking: "Cultural cooking",
};

export type CookingCompetency = "not_yet_introduced" | "observed_staff" | "assisted" | "did_with_prompts" | "did_independently" | "can_teach_others";
export const COOKING_COMPETENCY_LABEL: Record<CookingCompetency, string> = {
  not_yet_introduced: "Not yet introduced",
  observed_staff: "Observed staff",
  assisted: "Assisted",
  did_with_prompts: "Did with prompts",
  did_independently: "Did independently",
  can_teach_others: "Can teach others",
};

export type CookingOutcome = "burnt" | "edible" | "good" | "excellent" | "showed_off";
export const COOKING_OUTCOME_LABEL: Record<CookingOutcome, string> = {
  burnt: "Burnt",
  edible: "Edible",
  good: "Good",
  excellent: "Excellent",
  showed_off: "Showed off to others",
};

export interface CookingRecipeAttempt {
  name: string;
  date: string;
  outcome: CookingOutcome;
}

export interface CookingBakingRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  skill: string;
  category: CookingCategory;
  competency_level: CookingCompetency;
  first_attempt_date?: string;
  achieved_independently_date?: string;
  recipes_attempted: CookingRecipeAttempt[];
  cuisines_explored: string[];
  child_voice: string;
  staff_observation: string;
  hygiene_certificate: boolean;
  led_family_meal: boolean;
  flags_risks: string[];
  next_skill_to_build: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

export type CorrespondenceSenderType = "birth_family" | "mother" | "father" | "sibling" | "grandparent" | "extended_family" | "school" | "friend" | "solicitor_legal" | "pen_pal_scheme" | "charity_anonymous" | "other_professional" | "junk_mail";
export const CORRESPONDENCE_SENDER_TYPE_LABEL: Record<CorrespondenceSenderType, string> = {
  birth_family: "Birth family",
  mother: "Mother",
  father: "Father",
  sibling: "Sibling",
  grandparent: "Grandparent",
  extended_family: "Extended family",
  school: "School",
  friend: "Friend",
  solicitor_legal: "Solicitor/legal",
  pen_pal_scheme: "Pen-pal scheme",
  charity_anonymous: "Charity/anonymous",
  other_professional: "Other professional",
  junk_mail: "Junk mail",
};

export type CorrespondenceItemType = "letter" | "card" | "package" | "birthday_card" | "christmas_card" | "school_letter" | "solicitor_letter" | "letterbox_contact";
export const CORRESPONDENCE_ITEM_TYPE_LABEL: Record<CorrespondenceItemType, string> = {
  letter: "Letter",
  card: "Card",
  package: "Package",
  birthday_card: "Birthday card",
  christmas_card: "Christmas card",
  school_letter: "School letter",
  solicitor_letter: "Solicitor letter",
  letterbox_contact: "Letterbox contact",
};

export interface IncomingCorrespondence {
  id: string;
  child_id: string;
  date_received: string;
  sender_type: CorrespondenceSenderType;
  sender_name: string;
  item_type: CorrespondenceItemType;
  reviewed_first: boolean;
  reviewed_by: string;
  reviewed_reason: string;
  child_given_item: boolean;
  date_child_received: string;
  child_response_observed: string;
  child_choose_to_reply: boolean;
  support_provided_to_respond: string;
  kept: boolean;
  kept_location: string;
  shared_with_social_worker: boolean;
  notes: string;
  created_at: string;
}

// ── Court Attendance Support ──────────────────────────────────────────────────

export type CourtAttendanceType = "family_court_care_proceedings" | "family_court_contact_private_law" | "youth_court_criminal_defendant" | "crown_court_witness" | "magistrates_witness" | "abe_interview" | "court_familiarisation_visit" | "other_tribunal";
export const COURT_ATTENDANCE_TYPE_LABEL: Record<CourtAttendanceType, string> = {
  family_court_care_proceedings: "Family Court (care proceedings)",
  family_court_contact_private_law: "Family Court (contact / private law)",
  youth_court_criminal_defendant: "Youth Court (criminal — defendant)",
  crown_court_witness: "Crown Court (witness)",
  magistrates_witness: "Magistrates (witness)",
  abe_interview: "ABE interview",
  court_familiarisation_visit: "Court familiarisation visit",
  other_tribunal: "Other tribunal",
};

export type CourtChildRole = "subject_of_proceedings" | "witness" | "defendant" | "special_party_re_w" | "observer_familiarisation";
export const COURT_CHILD_ROLE_LABEL: Record<CourtChildRole, string> = {
  subject_of_proceedings: "Subject of proceedings",
  witness: "Witness",
  defendant: "Defendant",
  special_party_re_w: "Special party (Re W)",
  observer_familiarisation: "Observer / familiarisation",
};

export interface CourtAttendanceRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  court_type: CourtAttendanceType;
  child_role: CourtChildRole;
  hearing_date?: string;
  hearing_time?: string;
  court_location?: string;
  legal_rep?: string;
  guardian_ad_litem?: string;
  social_worker_involved?: string;
  special_measures_agreed: string[];
  pre_hearing_prep: string[];
  who_attends_with_child: string[];
  travel_arrangements?: string;
  risk_assessment_done: boolean;
  risk_factors: string[];
  protective_factors: string[];
  outcomes?: string;
  post_hearing_support: string[];
  child_voice: string;
  staff_observation: string;
  flags_concerns: string[];
  follow_up_date?: string;
  key_worker: string;
  created_at: string;
}

// ── Creative Projects ─────────────────────────────────────────────────────────

export type CreativeProjectMedium = "drawing" | "painting" | "music_instrument" | "music_production" | "singing" | "writing_poetry" | "writing_prose" | "photography" | "video" | "coding" | "crafts" | "sculpture" | "dance" | "mixed_media";
export const CREATIVE_PROJECT_MEDIUM_LABEL: Record<CreativeProjectMedium, string> = {
  drawing: "Drawing",
  painting: "Painting",
  music_instrument: "Music — instrument",
  music_production: "Music — production",
  singing: "Singing",
  writing_poetry: "Writing — poetry",
  writing_prose: "Writing — prose",
  photography: "Photography",
  video: "Video",
  coding: "Coding",
  crafts: "Crafts",
  sculpture: "Sculpture",
  dance: "Dance",
  mixed_media: "Mixed media",
};

export type CreativeProjectStatus = "idea" | "active" | "paused" | "completed" | "shared_publicly";
export const CREATIVE_PROJECT_STATUS_LABEL: Record<CreativeProjectStatus, string> = {
  idea: "Idea",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  shared_publicly: "Shared publicly",
};

export type CreativeProjectFunding = "home_budget" | "pocket_money" | "family_contribution" | "grant_award" | "free";
export const CREATIVE_PROJECT_FUNDING_LABEL: Record<CreativeProjectFunding, string> = {
  home_budget: "Home budget",
  pocket_money: "Pocket money",
  family_contribution: "Family contribution",
  grant_award: "Grant/award",
  free: "Free",
};

export interface CreativeContestEntry {
  name: string;
  date: string;
  outcome?: string;
}

export interface CreativeProjectRecord {
  id: string;
  child_id: string;
  project_name: string;
  medium: CreativeProjectMedium;
  status: CreativeProjectStatus;
  started_date: string;
  last_worked_on: string;
  materials_cost: number;
  materials_funding: CreativeProjectFunding;
  skills_growing: string[];
  child_inspiration: string;
  collaborators?: string;
  external_showcase?: string;
  contests_entered: CreativeContestEntry[];
  child_voice: string;
  staff_observation: string;
  next_steps: string[];
  flags_concerns: string[];
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Cultural / Religious Mentor ───────────────────────────────────────────────

export type CulturalMentorRole = "imam" | "pandit" | "rabbi" | "pastor_minister" | "cultural_elder" | "community_leader" | "heritage_language_teacher" | "faith_aware_therapist" | "diaspora_mentor" | "other";
export const CULTURAL_MENTOR_ROLE_LABEL: Record<CulturalMentorRole, string> = {
  imam: "Imam",
  pandit: "Pandit",
  rabbi: "Rabbi",
  pastor_minister: "Pastor / minister",
  cultural_elder: "Cultural elder",
  community_leader: "Community leader",
  heritage_language_teacher: "Heritage language teacher",
  faith_aware_therapist: "Faith-aware therapist",
  diaspora_mentor: "Diaspora mentor",
  other: "Other",
};

export type MentorContactFrequency = "weekly" | "fortnightly" | "monthly" | "as_needed" | "annual_events";
export const MENTOR_CONTACT_FREQUENCY_LABEL: Record<MentorContactFrequency, string> = {
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  as_needed: "As needed",
  annual_events: "Annual events",
};

export type MentorRelationshipQuality = "building" | "settled" | "strong" | "central_figure";
export const MENTOR_RELATIONSHIP_QUALITY_LABEL: Record<MentorRelationshipQuality, string> = {
  building: "Building",
  settled: "Settled",
  strong: "Strong",
  central_figure: "Central figure",
};

export interface MentorSafeguardingCheck {
  check: string;
  date: string;
  outcome: string;
}

export interface MentorMeetingRecord {
  date: string;
  topic: string;
  outcome: string;
}

export interface CulturalReligiousMentor {
  id: string;
  child_id: string;
  mentor_name: string;
  mentor_role: CulturalMentorRole;
  faith_culture: string;
  matched_date: string;
  introduction_method: string;
  contact_frequency: MentorContactFrequency;
  contact_settings: string[];
  role_played: string[];
  safeguarding_checks_done: MentorSafeguardingCheck[];
  home_awareness: string;
  parent_sw_aware: boolean;
  meetings_record: MentorMeetingRecord[];
  child_relationship_quality: MentorRelationshipQuality;
  challenges_noted: string[];
  child_voice: string;
  staff_observation: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Deaf / Hearing Support ────────────────────────────────────────────────────

export type HearingStatus = "hearing_full" | "mild_loss" | "moderate_loss" | "severe_loss" | "profound_loss" | "single_sided_deafness" | "auditory_processing_difficulties" | "awaiting_assessment";
export const HEARING_STATUS_LABEL: Record<HearingStatus, string> = {
  hearing_full: "Hearing — full",
  mild_loss: "Mild loss",
  moderate_loss: "Moderate loss",
  severe_loss: "Severe loss",
  profound_loss: "Profound loss",
  single_sided_deafness: "Single-sided deafness",
  auditory_processing_difficulties: "Auditory processing difficulties",
  awaiting_assessment: "Awaiting assessment",
};

export type HearingPreferredLanguage = "spoken_english" | "bsl" | "sse" | "lip_reading_spoken" | "mixed" | "other";
export const HEARING_PREFERRED_LANGUAGE_LABEL: Record<HearingPreferredLanguage, string> = {
  spoken_english: "Spoken English",
  bsl: "BSL",
  sse: "SSE (Sign Supported English)",
  lip_reading_spoken: "Lip-reading + spoken",
  mixed: "Mixed",
  other: "Other",
};

export type BSLLevel = "pre_introduction" | "some_signs" | "level_1" | "level_2" | "level_3" | "fluent_native";
export const BSL_LEVEL_LABEL: Record<BSLLevel, string> = {
  pre_introduction: "Pre-introduction",
  some_signs: "Some signs",
  level_1: "Level 1",
  level_2: "Level 2",
  level_3: "Level 3",
  fluent_native: "Fluent / native",
};

export interface HearingAidDetails {
  side: string;
  type: string;
  fitted: string;
  battery?: string;
}

export interface CochlearImplantDetails {
  side: string;
  surgery_date: string;
  processor: string;
}

export interface DeafHearingSupportRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  hearing_status: HearingStatus;
  identify_as_deaf: boolean;
  preferred_language: HearingPreferredLanguage;
  hearing_aids?: HearingAidDetails;
  cochlear_implant?: CochlearImplantDetails;
  audiology_service: string;
  audiologist_name?: string;
  last_review?: string;
  next_review_due?: string;
  bsl_level?: BSLLevel;
  bsl_learning_plan: string[];
  staff_signing_trained: string[];
  school_has_plan: boolean;
  school_has_radio_aid: boolean;
  home_adaptations: string[];
  social_opportunities_deaf: string[];
  identity_work: string[];
  emergency_alarms: string[];
  child_voice: string;
  staff_observation: string;
  flags_for_review: string[];
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Diabetic Care Plan ────────────────────────────────────────────────────────

export type DiabetesType = "type_1" | "type_2" | "mody" | "other";
export const DIABETES_TYPE_LABEL: Record<DiabetesType, string> = {
  type_1: "Type 1",
  type_2: "Type 2",
  mody: "MODY",
  other: "Other",
};

export type DiabetesSelfManageLevel = "fully" | "with_prompts" | "adult_administered" | "building";
export const DIABETES_SELF_MANAGE_LEVEL_LABEL: Record<DiabetesSelfManageLevel, string> = {
  fully: "Fully",
  with_prompts: "With prompts",
  adult_administered: "Adult-administered",
  building: "Building",
};

export type InsulinRegimeType = "basal_bolus_mdi" | "pump_csii" | "mixed_twice_daily";
export const INSULIN_REGIME_TYPE_LABEL: Record<InsulinRegimeType, string> = {
  basal_bolus_mdi: "Basal-bolus MDI",
  pump_csii: "Pump CSII",
  mixed_twice_daily: "Mixed twice daily",
};

export interface InsulinRegime {
  type: InsulinRegimeType;
  details: string;
}

export interface BasalInsulinDetails {
  name: string;
  dose: string;
  timing: string;
}

export interface BolusInsulinDetails {
  name: string;
  ratio: string;
  correction: string;
}

export interface DiabetesEmergencyContact {
  name: string;
  role: string;
  phone: string;
}

export interface DiabeticCarePlan {
  id: string;
  child_id: string;
  plan_date: string;
  diabetes_type: DiabetesType;
  diagnosis_date: string;
  hba1c_latest?: string;
  hba1c_target?: string;
  hba1c_last_taken?: string;
  cgm_in_use: boolean;
  cgm_device?: string;
  insulin_pump: boolean;
  pump_device?: string;
  insulin_regime: InsulinRegime;
  basal_insulin?: BasalInsulinDetails;
  bolus_insulin?: BolusInsulinDetails;
  carb_counting_active: boolean;
  hypo_symptoms: string[];
  hypo_treatment_steps: string[];
  hyper_symptoms: string[];
  hyper_treatment_steps: string[];
  ketone_testing_trigger: string;
  sick_day_rules: string[];
  school_plan_in_place: boolean;
  child_can_self_manage: DiabetesSelfManageLevel;
  emergency_contacts: DiabetesEmergencyContact[];
  dietician_review_frequency?: string;
  consultant_review_frequency?: string;
  child_voice: string;
  staff_observation: string;
  flags_for_review: string[];
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Dyslexia / SpLD Support Plan ──────────────────────────────────────────────

export type SpldCondition = "dyslexia" | "dyscalculia" | "dysgraphia" | "dcd_dyspraxia" | "auditory_processing_difficulty" | "visual_processing_difficulty";
export const SPLD_CONDITION_LABEL: Record<SpldCondition, string> = {
  dyslexia: "Dyslexia",
  dyscalculia: "Dyscalculia",
  dysgraphia: "Dysgraphia",
  dcd_dyspraxia: "DCD / Dyspraxia",
  auditory_processing_difficulty: "Auditory processing difficulty",
  visual_processing_difficulty: "Visual processing difficulty",
};

export type SpldDiagnosisStatus = "diagnosed" | "awaiting_assessment" | "suspected" | "self_identified";
export const SPLD_DIAGNOSIS_STATUS_LABEL: Record<SpldDiagnosisStatus, string> = {
  diagnosed: "Diagnosed",
  awaiting_assessment: "Awaiting assessment",
  suspected: "Suspected",
  self_identified: "Self-identified",
};

export type SpldTechOutcome = "loves_it" | "useful" | "tried_not_useful" | "resists";
export const SPLD_TECH_OUTCOME_LABEL: Record<SpldTechOutcome, string> = {
  loves_it: "Loves it",
  useful: "Useful",
  tried_not_useful: "Tried — not useful",
  resists: "Resists",
};

export interface SpldTechnologyTried {
  name: string;
  outcome: SpldTechOutcome;
}

export interface SpldExternalSupport {
  agency: string;
  role: string;
  frequency: string;
}

export interface SpldSupportPlan {
  id: string;
  child_id: string;
  plan_date: string;
  conditions: SpldCondition[];
  diagnosis_status: SpldDiagnosisStatus;
  diagnosing_professional?: string;
  diagnosis_date?: string;
  strengths: string[];
  challenges: string[];
  technology_in_use: string[];
  technology_tried: SpldTechnologyTried[];
  school_access_arrangements: string[];
  exam_concessions_agreed: string[];
  home_study_support: string[];
  staff_strategies: string[];
  external_support: SpldExternalSupport[];
  identity_work: string[];
  child_voice: string;
  staff_observation: string;
  next_step: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Epilepsy / Seizure Plan ──────────────────────────────────────────────────

export interface SeizureTypeEntry {
  name: string;
  description: string;
  typical_duration: string;
  last_observed?: string;
}

export interface PreventerMedication {
  name: string;
  dose: string;
  timing: string;
}

export interface RescueMedication {
  name: string;
  dose: string;
  route: string;
  when_to_give: string;
  second_dose_allowed: boolean;
}

export interface SeizureEmergencyContact {
  name: string;
  role: string;
  phone: string;
}

export interface SeizureLogEntry {
  date: string;
  type: string;
  duration_minutes: number;
  rescue_given: boolean;
  outcome: string;
}

export interface EpilepsySeizurePlan {
  id: string;
  child_id: string;
  plan_date: string;
  diagnosis: string;
  seizure_types: SeizureTypeEntry[];
  warning_signs: string[];
  triggers: string[];
  during_seizure_steps: string[];
  recovery_position_steps: string[];
  call_999_criteria: string[];
  preventer_medication?: PreventerMedication;
  rescue_medication?: RescueMedication;
  staff_trained_to_admin: string[];
  staff_training_expires?: string;
  safe_sleeping_arrangements: string[];
  bathing_swimming_policy: string[];
  school_plan_in_place: boolean;
  emergency_contacts: SeizureEmergencyContact[];
  recent_seizure_log: SeizureLogEntry[];
  consultant_neurologist?: string;
  consultant_review_due?: string;
  child_voice: string;
  staff_observation: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Extracurricular Clubs ────────────────────────────────────────────────────

export type ExtracurricularCategory =
  | "sport"
  | "music"
  | "drama_theatre"
  | "faith_community"
  | "academic_debate"
  | "coding_tech"
  | "art_craft"
  | "volunteering"
  | "youth_advocacy"
  | "other";

export const EXTRACURRICULAR_CATEGORY_LABEL: Record<ExtracurricularCategory, string> = {
  sport: "Sport",
  music: "Music",
  drama_theatre: "Drama / theatre",
  faith_community: "Faith / community",
  academic_debate: "Academic / debate",
  coding_tech: "Coding / tech",
  art_craft: "Art / craft",
  volunteering: "Volunteering",
  youth_advocacy: "Youth advocacy",
  other: "Other",
};

export type ClubSocialFit =
  | "building"
  | "settled"
  | "strong_friendships"
  | "mixed"
  | "stepping_back";

export const CLUB_SOCIAL_FIT_LABEL: Record<ClubSocialFit, string> = {
  building: "Building",
  settled: "Settled",
  strong_friendships: "Strong friendships",
  mixed: "Mixed",
  stepping_back: "Stepping back",
};

export interface ExtracurricularClubRecord {
  id: string;
  child_id: string;
  club_name: string;
  category: ExtracurricularCategory;
  joined: string;
  ongoing: boolean;
  ended?: string;
  frequency: string;
  venue: string;
  transport_arrangement: string;
  weekly_cost: number;
  funding_source: string;
  child_initiated: boolean;
  social_fit: ClubSocialFit;
  skills_built: string[];
  attendance_rate: number;
  flags_concerns: string[];
  child_voice: string;
  staff_observation: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Child Feedback Loops ─────────────────────────────────────────────────────

export type FeedbackLoopChannel =
  | "childrens_meeting"
  | "key_working_session"
  | "verbal_to_staff"
  | "written_drawing"
  | "suggestion_box"
  | "pulse_survey"
  | "childrens_pledge_review"
  | "independent_advocate"
  | "reg_44_visit";

export const FEEDBACK_LOOP_CHANNEL_LABEL: Record<FeedbackLoopChannel, string> = {
  childrens_meeting: "Children's meeting",
  key_working_session: "Key working session",
  verbal_to_staff: "Verbal to staff",
  written_drawing: "Written / drawing",
  suggestion_box: "Suggestion box",
  pulse_survey: "Pulse survey",
  childrens_pledge_review: "Children's pledge review",
  independent_advocate: "Independent advocate",
  reg_44_visit: "Reg 44 visit",
};

export type FeedbackLoopType =
  | "suggestion"
  | "concern"
  | "compliment"
  | "question"
  | "challenge"
  | "idea";

export const FEEDBACK_LOOP_TYPE_LABEL: Record<FeedbackLoopType, string> = {
  suggestion: "Suggestion",
  concern: "Concern",
  compliment: "Compliment",
  question: "Question",
  challenge: "Challenge",
  idea: "Idea",
};

export type FeedbackDecision =
  | "acted_on_in_full"
  | "acted_on_in_part"
  | "discussed_and_explored"
  | "cannot_do_explained"
  | "pending_consideration";

export const FEEDBACK_DECISION_LABEL: Record<FeedbackDecision, string> = {
  acted_on_in_full: "Acted on - in full",
  acted_on_in_part: "Acted on - in part",
  discussed_and_explored: "Discussed and explored",
  cannot_do_explained: "Cannot do - explained",
  pending_consideration: "Pending consideration",
};

export interface ChildFeedbackLoop {
  id: string;
  child_id: string;
  feedback_date: string;
  feedback_channel: FeedbackLoopChannel;
  feedback_topic: string;
  child_words: string;
  feedback_type: FeedbackLoopType;
  acknowledged_by: string;
  acknowledged_date: string;
  considered_at: string;
  decision_made: FeedbackDecision;
  decision_maker: string;
  decision_rationale: string;
  actions_taken: string[];
  when_child_was_told: string;
  how_child_was_told: string;
  child_response_to_outcome: string;
  child_accepts: boolean;
  visible_change: string;
  duration_days_to_close: number;
  follow_up_date: string;
  recorded_by: string;
  created_at: string;
}

// ── Child Feedback on Staff ──────────────────────────────────────────────────

export type StaffFeedbackAttribution =
  | "named"
  | "anonymous_to_subject"
  | "anonymous_to_all_but_rm";

export const STAFF_FEEDBACK_ATTRIBUTION_LABEL: Record<StaffFeedbackAttribution, string> = {
  named: "Named",
  anonymous_to_subject: "Anonymous to subject",
  anonymous_to_all_but_rm: "Anonymous to all but RM",
};

export type StaffFeedbackChannel =
  | "childrens_meeting"
  | "key_working"
  | "suggestion_box"
  | "independent_advocate"
  | "reg_44_visit"
  | "direct_to_rm";

export const STAFF_FEEDBACK_CHANNEL_LABEL: Record<StaffFeedbackChannel, string> = {
  childrens_meeting: "Children's meeting",
  key_working: "Key working",
  suggestion_box: "Suggestion box",
  independent_advocate: "Independent advocate",
  reg_44_visit: "Reg 44 visit",
  direct_to_rm: "Direct to RM",
};

export type StaffFeedbackSentiment =
  | "positive"
  | "mixed"
  | "constructive"
  | "concern";

export const STAFF_FEEDBACK_SENTIMENT_LABEL: Record<StaffFeedbackSentiment, string> = {
  positive: "Positive",
  mixed: "Mixed",
  constructive: "Constructive",
  concern: "Concern",
};

export type StaffFeedbackTopic =
  | "relational_warmth"
  | "boundaries_fairness"
  | "communication_style"
  | "cultural_awareness"
  | "sensory_awareness"
  | "listening"
  | "reliability"
  | "consistency"
  | "specific_incident"
  | "skill"
  | "general_appreciation";

export const STAFF_FEEDBACK_TOPIC_LABEL: Record<StaffFeedbackTopic, string> = {
  relational_warmth: "Relational warmth",
  boundaries_fairness: "Boundaries fairness",
  communication_style: "Communication style",
  cultural_awareness: "Cultural awareness",
  sensory_awareness: "Sensory awareness",
  listening: "Listening",
  reliability: "Reliability",
  consistency: "Consistency",
  specific_incident: "Specific incident",
  skill: "Skill",
  general_appreciation: "General appreciation",
};

export interface ChildStaffFeedback {
  id: string;
  child_id: string;
  attribution: StaffFeedbackAttribution;
  feedback_date: string;
  channel: StaffFeedbackChannel;
  staff_subject: string;
  feedback_sentiment: StaffFeedbackSentiment;
  feedback_topic: StaffFeedbackTopic;
  child_words: string;
  context_of_feedback: string;
  staff_member_informed: boolean;
  staff_member_informed_date: string;
  staff_response: string;
  manager_actions: string[];
  feedback_shared_with: string[];
  child_wishes_for_response: string;
  follow_up_date: string;
  recorded_by: string;
  protected_from_retaliation: boolean;
  pattern_indicator: string;
  created_at: string;
}

// ── Child-Friendly Policies ──────────────────────────────────────────────────

export type PolicyArea =
  | "safety"
  | "behaviour"
  | "voice"
  | "privacy"
  | "health"
  | "education"
  | "wellbeing"
  | "rights";

export const POLICY_AREA_LABEL: Record<PolicyArea, string> = {
  safety: "Safety",
  behaviour: "Behaviour",
  voice: "Voice",
  privacy: "Privacy",
  health: "Health",
  education: "Education",
  wellbeing: "Wellbeing",
  rights: "Rights",
};

export type PolicyAudienceAge =
  | "under_11"
  | "eleven_to_fourteen"
  | "fifteen_plus"
  | "all_ages_visual";

export const POLICY_AUDIENCE_AGE_LABEL: Record<PolicyAudienceAge, string> = {
  under_11: "Under 11",
  eleven_to_fourteen: "11-14",
  fifteen_plus: "15+",
  all_ages_visual: "All ages (visual)",
};

export type PolicyFormat =
  | "visual_plus_text"
  | "easy_read"
  | "standard_text"
  | "audio_available"
  | "comic_storybook";

export const POLICY_FORMAT_LABEL: Record<PolicyFormat, string> = {
  visual_plus_text: "Visual + Text",
  easy_read: "Easy Read",
  standard_text: "Standard Text",
  audio_available: "Audio Available",
  comic_storybook: "Comic/Storybook",
};

export interface ChildFriendlyPolicy {
  id: string;
  title: string;
  area: PolicyArea;
  parent_policy_name: string;
  parent_policy_version: string;
  child_friendly_version: string;
  audience_age: PolicyAudienceAge;
  format: PolicyFormat;
  plain_english_summary: string;
  what_this_means: string[];
  what_you_can_expect: string[];
  your_rights: string[];
  your_responsibilities: string[];
  who_can_help: string[];
  child_feedback: string;
  reviewed_with_children_date: string;
  last_updated: string;
  authored_by: string;
  approved_by: string;
  child_co_production_contributors: string[];
  created_at: string;
}

// ── Heritage Language Tracker ────────────────────────────────────────────────

export type HeritageLanguageStatus =
  | "mother_tongue"
  | "fluent"
  | "conversational"
  | "developing"
  | "receptive_only"
  | "lost_being_recovered";

export const HERITAGE_LANGUAGE_STATUS_LABEL: Record<HeritageLanguageStatus, string> = {
  mother_tongue: "Mother tongue",
  fluent: "Fluent",
  conversational: "Conversational",
  developing: "Developing",
  receptive_only: "Receptive only",
  lost_being_recovered: "Lost — being recovered",
};

export type LanguageIdentityImportance =
  | "central"
  | "important"
  | "becoming_important"
  | "mixed_feelings"
  | "fading";

export const LANGUAGE_IDENTITY_IMPORTANCE_LABEL: Record<LanguageIdentityImportance, string> = {
  central: "Central",
  important: "Important",
  becoming_important: "Becoming important",
  mixed_feelings: "Mixed feelings",
  fading: "Fading",
};

export type HeritageSkillLevel = 1 | 2 | 3 | 4 | 5;

export interface HeritageLanguageEntry {
  name: string;
  status: HeritageLanguageStatus;
  speaking_level: HeritageSkillLevel;
  reading_level: HeritageSkillLevel;
  writing_level: HeritageSkillLevel;
}

export interface LanguageFamilyContact {
  person: string;
  relationship: string;
  language_used: string;
}

export interface HeritageLanguageRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  languages: HeritageLanguageEntry[];
  primary_language_at_placement: string;
  home_atmosphere_supports: boolean;
  opportunities_to_use: string[];
  community_resources: string[];
  family_contact_in_language: LanguageFamilyContact[];
  reading_materials: string[];
  films_music: string[];
  formal_learning?: string;
  identity_importance: LanguageIdentityImportance;
  child_voice: string;
  staff_observation: string;
  flags_concerns: string[];
  next_step: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Immigration / UASC Support ──────────────────────────────────────────────

export type ImmigrationStatus =
  | "british_citizen"
  | "settled_ilr"
  | "pre_settled_status"
  | "uasc_claim_pending"
  | "refugee_status"
  | "humanitarian_protection"
  | "discretionary_leave"
  | "uasc_leave_until_17_5"
  | "appeal_pending"
  | "refused_appeals_exhausted"
  | "naturalisation_in_progress"
  | "other";

export const IMMIGRATION_STATUS_LABEL: Record<ImmigrationStatus, string> = {
  british_citizen: "British Citizen",
  settled_ilr: "Settled — ILR",
  pre_settled_status: "Pre-Settled Status",
  uasc_claim_pending: "UASC — Claim Pending",
  refugee_status: "Refugee Status",
  humanitarian_protection: "Humanitarian Protection",
  discretionary_leave: "Discretionary Leave",
  uasc_leave_until_17_5: "UASC Leave (until 17.5)",
  appeal_pending: "Appeal Pending",
  refused_appeals_exhausted: "Refused — Appeals Exhausted",
  naturalisation_in_progress: "Naturalisation in Progress",
  other: "Other",
};

export type EnglishLanguageLevel =
  | "pre_a1" | "a1" | "a2" | "b1" | "b2" | "c1" | "fluent" | "native";

export const ENGLISH_LANGUAGE_LEVEL_LABEL: Record<EnglishLanguageLevel, string> = {
  pre_a1: "Pre-A1",
  a1: "A1",
  a2: "A2",
  b1: "B1",
  b2: "B2",
  c1: "C1",
  fluent: "Fluent",
  native: "Native",
};

export interface AsylumClaimDetails {
  submitted_date: string;
  first_hearing_date?: string;
  reasons_for_claim: string[];
}

export interface ImmigrationLegalRep {
  name: string;
  firm: string;
  specialism: string;
  laa_funded: boolean;
}

export interface HomeOfficeRef {
  reference: string;
  type: string;
}

export interface ImmigrationUascRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  immigration_status: ImmigrationStatus;
  country_of_origin?: string;
  arrival_uk?: string;
  age_at_arrival?: number;
  age_assessment_completed?: boolean;
  age_assessment_date?: string;
  age_assessment_outcome?: string;
  asylum_claim?: AsylumClaimDetails;
  legal_representative?: ImmigrationLegalRep;
  home_office_references: HomeOfficeRef[];
  documents_held: string[];
  documents_awaiting: string[];
  english_language_level: EnglishLanguageLevel;
  esol_engaged: boolean;
  family_tracing_active: boolean;
  family_tracing_service?: string;
  culture_community_links: string[];
  trauma_informed_support: string[];
  nrpf_considerations: string[];
  pathway_plan_linked_to_immigration: boolean;
  child_voice: string;
  staff_observation: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Child Injuries Log ──────────────────────────────────────────────────────

export type ChildInjuryType =
  | "bruise" | "graze" | "cut" | "bump" | "burn" | "sprain" | "other";

export const CHILD_INJURY_TYPE_LABEL: Record<ChildInjuryType, string> = {
  bruise: "Bruise",
  graze: "Graze",
  cut: "Cut",
  bump: "Bump",
  burn: "Burn",
  sprain: "Sprain",
  other: "Other",
};

export type InjurySeverity = "minor" | "moderate" | "required_medical";

export const INJURY_SEVERITY_LABEL: Record<InjurySeverity, string> = {
  minor: "Minor",
  moderate: "Moderate",
  required_medical: "Required medical",
};

export interface ChildInjuryRecord {
  id: string;
  child_id: string;
  date: string;
  time: string;
  body_location: string;
  injury_type: ChildInjuryType;
  severity: InjurySeverity;
  how_it_happened: string;
  child_account_consistent: boolean;
  witnessed: boolean;
  witnesses: string[];
  first_aid_given: string;
  photographed_to_body_map: boolean;
  gp_required: boolean;
  gp_attended: boolean;
  parents_informed: boolean;
  parents_informed_time: string;
  social_worker_informed: boolean;
  staff_on_duty: string[];
  recorded_by: string;
  safeguarding_flag: boolean;
  notes: string;
  created_at: string;
}

// ── Child Key Document Tracker ──────────────────────────────────────────────

export type KeyDocStatus =
  | "held" | "awaiting" | "expired" | "with_la" | "with_family" | "lost_replacing";

export const KEY_DOC_STATUS_LABEL: Record<KeyDocStatus, string> = {
  held: "Held",
  awaiting: "Awaiting",
  expired: "Expired",
  with_la: "With LA",
  with_family: "With family",
  lost_replacing: "Lost — replacing",
};

export type KeyDocOriginalOrCopy = "original" | "certified_copy" | "photocopy";

export const KEY_DOC_ORIGINAL_OR_COPY_LABEL: Record<KeyDocOriginalOrCopy, string> = {
  original: "Original",
  certified_copy: "Certified Copy",
  photocopy: "Photocopy",
};

export interface KeyDocAccessLogEntry {
  date: string;
  accessor: string;
  reason: string;
}

export interface ChildKeyDocument {
  id: string;
  child_id: string;
  document_type: string;
  document_reference: string;
  original_or_copy: KeyDocOriginalOrCopy;
  status: KeyDocStatus;
  location: string;
  key_holder: string;
  expiry_date: string;
  renewal_required: boolean;
  child_aware: boolean;
  child_can_request_sight: boolean;
  part_of_transition_pack: boolean;
  purpose_of_holding: string;
  access_log: KeyDocAccessLogEntry[];
  last_reviewed_date: string;
  reviewed_by: string;
  created_at: string;
}

// ── Keyworker 1:1 Sessions ──────────────────────────────────────────────────

export type KeyworkerSessionFormat =
  | "one_to_one_at_home"
  | "one_to_one_walk"
  | "one_to_one_cafe"
  | "one_to_one_driving"
  | "one_to_one_cooking_together"
  | "one_to_one_boxing_sport"
  | "brief_check_in"
  | "crisis_check_in";

export const KEYWORKER_SESSION_FORMAT_LABEL: Record<KeyworkerSessionFormat, string> = {
  one_to_one_at_home: "1:1 at home",
  one_to_one_walk: "1:1 walk",
  one_to_one_cafe: "1:1 café",
  one_to_one_driving: "1:1 driving",
  one_to_one_cooking_together: "1:1 cooking together",
  one_to_one_boxing_sport: "1:1 boxing/sport",
  brief_check_in: "Brief check-in",
  crisis_check_in: "Crisis check-in",
};

export interface KeyworkerSessionRecord {
  id: string;
  child_id: string;
  staff_id: string;
  session_date: string;
  duration_minutes: number;
  format: KeyworkerSessionFormat;
  child_chose_format: boolean;
  themes_covered: string[];
  child_went_in_with: string;
  child_walked_out_with: string;
  what_child_brought_up: string;
  what_staff_brought_up: string;
  agreed_actions_staff: string[];
  agreed_actions_child: string[];
  child_satisfaction: number;
  follow_up_date: string;
  flags_raised: string[];
  notes?: string;
  created_at: string;
}

// ── Laundry Self-Care ───────────────────────────────────────────────────────

export type LaundryStage =
  | "stage_1_observed"
  | "stage_2_did_with_staff"
  | "stage_3_did_with_prompts"
  | "stage_4_did_independently"
  | "stage_5_manages_own_routine";

export const LAUNDRY_STAGE_LABEL: Record<LaundryStage, string> = {
  stage_1_observed: "Stage 1 — Observed",
  stage_2_did_with_staff: "Stage 2 — Did with staff",
  stage_3_did_with_prompts: "Stage 3 — Did with prompts",
  stage_4_did_independently: "Stage 4 — Did independently",
  stage_5_manages_own_routine: "Stage 5 — Manages own laundry routine",
};

export type LaundrySkillLevel = "not_yet" | "learning" | "confident" | "independent";

export const LAUNDRY_SKILL_LEVEL_LABEL: Record<LaundrySkillLevel, string> = {
  not_yet: "Not yet",
  learning: "Learning",
  confident: "Confident",
  independent: "Independent",
};

export interface LaundrySkill {
  name: string;
  level: LaundrySkillLevel;
}

export interface LaundrySelfCareRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  overall_stage: LaundryStage;
  skills: LaundrySkill[];
  routine_frequency: string;
  owns_basket: boolean;
  knows_care_symbols: boolean;
  iron_competent: boolean;
  challenges_noted: string[];
  child_voice: string;
  staff_observation: string;
  next_skill: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Child-Led Meeting Record ────────────────────────────────────────────────

export type ChildLedMeetingType =
  | "childrens_meeting_led"
  | "house_decision_discussion"
  | "specific_topic_raised_by_child"
  | "friend_peer_chat_with_staff_support"
  | "cohort_planning_input";

export const CHILD_LED_MEETING_TYPE_LABEL: Record<ChildLedMeetingType, string> = {
  childrens_meeting_led: "Children's meeting led",
  house_decision_discussion: "House decision discussion",
  specific_topic_raised_by_child: "Specific topic raised by child",
  friend_peer_chat_with_staff_support: "Friend/peer chat with staff support",
  cohort_planning_input: "Cohort planning input",
};

export interface ChildMeetingContributor {
  contributor: string;
  contribution: string;
}

export interface ChildLedMeetingRecord {
  id: string;
  date: string;
  child_id: string;
  meeting_purpose: string;
  meeting_type: ChildLedMeetingType;
  duration_minutes: number;
  attendees: string[];
  external_attendees: string[];
  pre_meeting_preparation: string[];
  agenda_proposed_by_child: string[];
  child_role_in_chairing: string;
  decisions_reached: string[];
  staff_role: string;
  child_outcome: string;
  child_contributors: ChildMeetingContributor[];
  challenges_navigated: string[];
  proud_moments: string[];
  visible_change: string;
  child_reflection_after: string;
  follow_up: string;
  recorded_by: string;
  created_at: string;
}

/* ══════════════════════════════════════════════════════════════════════════
   BATCH 13
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Mental Health Daily Check-In ──────────────────────────────────────── */

export type MoodRating = 1 | 2 | 3 | 4 | 5;

export type CheckInSleepQuality = "poor" | "disrupted" | "ok" | "good" | "great";
export const CHECK_IN_SLEEP_QUALITY_LABEL: Record<CheckInSleepQuality, string> = {
  poor: "Poor",
  disrupted: "Disrupted",
  ok: "OK",
  good: "Good",
  great: "Great",
};

export type CheckInAppetite = "skipped_meals" | "picked" | "ate_normally" | "hungry_ate_well";
export const CHECK_IN_APPETITE_LABEL: Record<CheckInAppetite, string> = {
  skipped_meals: "Skipped meals",
  picked: "Picked",
  ate_normally: "Ate normally",
  hungry_ate_well: "Hungry/ate well",
};

export type CheckInEnergy = "exhausted" | "low" | "ok" | "good" | "buzzy";
export const CHECK_IN_ENERGY_LABEL: Record<CheckInEnergy, string> = {
  exhausted: "Exhausted",
  low: "Low",
  ok: "OK",
  good: "Good",
  buzzy: "Buzzy",
};

export type CheckInConversationLength = "brief" | "five_minutes" | "ten_plus_minutes" | "extended";
export const CHECK_IN_CONVERSATION_LENGTH_LABEL: Record<CheckInConversationLength, string> = {
  brief: "Brief",
  five_minutes: "5 minutes",
  ten_plus_minutes: "10+ minutes",
  extended: "Extended",
};

export interface MentalHealthCheckIn {
  id: string;
  child_id: string;
  date: string;
  mood_rating: MoodRating;
  mood_emoji: string;
  whats_heavy: string;
  whats_good: string;
  what_would_help: string;
  sleep_quality: CheckInSleepQuality;
  appetite: CheckInAppetite;
  energy: CheckInEnergy;
  conversation_length: CheckInConversationLength;
  staff_present: string;
  follow_up_action?: string;
  flags_concerns: string[];
  weekly_trend_note?: string;
  created_at: string;
}

/* ── Child Mobile Phone Management ─────────────────────────────────────── */

export type PhoneContractType = "payg" | "sim_only" | "contract" | "family_shared" | "no_phone";
export const PHONE_CONTRACT_TYPE_LABEL: Record<PhoneContractType, string> = {
  payg: "PAYG",
  sim_only: "SIM-only",
  contract: "Contract",
  family_shared: "Family-shared",
  no_phone: "No phone",
};

export type PhoneFundingSource = "pocket_money" | "home_pays" | "family_pays" | "mixed" | "free_with_leaving_care_grant";
export const PHONE_FUNDING_SOURCE_LABEL: Record<PhoneFundingSource, string> = {
  pocket_money: "Pocket money",
  home_pays: "Home pays",
  family_pays: "Family pays",
  mixed: "Mixed",
  free_with_leaving_care_grant: "Free with leaving care grant",
};

export type PhoneHandInProtocol = "bedtime" | "school_hours" | "both" | "never" | "other_agreed_pattern";
export const PHONE_HAND_IN_PROTOCOL_LABEL: Record<PhoneHandInProtocol, string> = {
  bedtime: "Bedtime",
  school_hours: "School hours",
  both: "Both",
  never: "Never",
  other_agreed_pattern: "Other agreed pattern",
};

export type PhoneAppCategory = "social" | "games" | "education" | "health" | "communication" | "utility" | "other";
export const PHONE_APP_CATEGORY_LABEL: Record<PhoneAppCategory, string> = {
  social: "Social",
  games: "Games",
  education: "Education",
  health: "Health",
  communication: "Communication",
  utility: "Utility",
  other: "Other",
};

export interface PhoneApp {
  name: string;
  category: PhoneAppCategory;
  age_rating?: string;
}

export interface ChildPhoneRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  phone_model: string;
  contract_type: PhoneContractType;
  contract_holder?: string;
  monthly_cost: number;
  funding_source: PhoneFundingSource;
  imei?: string;
  parental_controls_active: boolean;
  parental_controls_type?: string;
  screen_time_weekly_avg: number;
  screen_time_agreed_limit?: number;
  apps_installed: PhoneApp[];
  hand_in_protocol: PhoneHandInProtocol;
  what_if_lost_plan: string;
  passcode_with_staff: boolean;
  child_voice: string;
  staff_observation: string;
  flags_concerns: string[];
  review_date: string;
  key_worker: string;
  created_at: string;
}

/* ── Mobility & Physical Disability Plan ───────────────────────────────── */

export type MobilityStatus = "independently_mobile" | "mobile_with_aid" | "wheelchair_part_time" | "wheelchair_full_time" | "bed_rest_periods" | "variable_fluctuating";
export const MOBILITY_STATUS_LABEL: Record<MobilityStatus, string> = {
  independently_mobile: "Independently mobile",
  mobile_with_aid: "Mobile with aid",
  wheelchair_part_time: "Wheelchair part-time",
  wheelchair_full_time: "Wheelchair full-time",
  bed_rest_periods: "Bed-rest periods",
  variable_fluctuating: "Variable / fluctuating",
};

export type EnergyEnvelopeStatus = "pacing_actively_used" | "some_pacing" | "no_pacing_yet" | "not_applicable";
export const ENERGY_ENVELOPE_STATUS_LABEL: Record<EnergyEnvelopeStatus, string> = {
  pacing_actively_used: "Pacing actively used",
  some_pacing: "Some pacing",
  no_pacing_yet: "No pacing yet",
  not_applicable: "Not applicable",
};

export interface ExternalMobilitySupport {
  agency: string;
  role: string;
  frequency: string;
}

export interface MobilityDisabilityPlan {
  id: string;
  child_id: string;
  plan_date: string;
  primary_condition: string;
  diagnosis_year?: string;
  mobility_status: MobilityStatus;
  mobility_aids: string[];
  energy_envelope?: EnergyEnvelopeStatus;
  pain_management: string[];
  accessible_rooms_at_home: string[];
  home_adaptations: string[];
  transport_arrangements: string[];
  school_accessibility_plan: boolean;
  exam_access_arrangements: string[];
  external_support: ExternalMobilitySupport[];
  identity_framing_notes: string;
  badges_entitlements: string[];
  child_voice: string;
  staff_observation: string;
  flags_for_review: string[];
  review_date: string;
  key_worker: string;
  created_at: string;
}

/* ── Photo ID Application Tracker ──────────────────────────────────────── */

export type PhotoIdType = "british_passport" | "provisional_driving_licence" | "citizen_card" | "young_scot_card" | "photo_voter_id" | "pass_card" | "other";
export const PHOTO_ID_TYPE_LABEL: Record<PhotoIdType, string> = {
  british_passport: "British Passport",
  provisional_driving_licence: "Provisional Driving Licence",
  citizen_card: "Citizen Card (free for care leavers)",
  young_scot_card: "Young Scot card",
  photo_voter_id: "Photo Voter ID",
  pass_card: "PASS card",
  other: "Other",
};

export type PhotoIdStatus = "considering_planning" | "documents_being_gathered" | "application_drafted" | "application_submitted" | "awaiting_biometrics" | "issued" | "renewal_due" | "lost_replacement_applied" | "not_applicable";
export const PHOTO_ID_STATUS_LABEL: Record<PhotoIdStatus, string> = {
  considering_planning: "Considering / planning",
  documents_being_gathered: "Documents being gathered",
  application_drafted: "Application drafted",
  application_submitted: "Application submitted",
  awaiting_biometrics: "Awaiting biometrics",
  issued: "Issued",
  renewal_due: "Renewal due",
  lost_replacement_applied: "Lost / replacement applied",
  not_applicable: "Not applicable",
};

export interface PhotoIdRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  id_type: PhotoIdType;
  status: PhotoIdStatus;
  application_date?: string;
  cost_paid?: number;
  funding_source?: string;
  document_number?: string;
  issue_date?: string;
  expiry_date?: string;
  storage_location: string;
  child_has_original: boolean;
  copies_kept: string[];
  evidence_provided_to_authority: string[];
  unique_challenges_for_lac: string[];
  child_voice: string;
  staff_observation: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

/* ── Child Photography Portfolio ───────────────────────────────────────── */

export type PhotoCategory = "birthday" | "achievement" | "activity" | "family_contact" | "holiday_trip" | "everyday_moment" | "cultural_event" | "school_milestone";
export const PHOTO_CATEGORY_LABEL: Record<PhotoCategory, string> = {
  birthday: "Birthday",
  achievement: "Achievement",
  activity: "Activity",
  family_contact: "Family contact",
  holiday_trip: "Holiday/Trip",
  everyday_moment: "Everyday moment",
  cultural_event: "Cultural event",
  school_milestone: "School milestone",
};

export type PhotoConsentMethod = "verbal" | "written" | "visual_cards" | "through_advocate";
export const PHOTO_CONSENT_METHOD_LABEL: Record<PhotoConsentMethod, string> = {
  verbal: "Verbal",
  written: "Written",
  visual_cards: "Visual cards",
  through_advocate: "Through advocate",
};

export interface ChildPhotoEntry {
  id: string;
  child_id: string;
  date: string;
  occasion: string;
  photo_category: PhotoCategory;
  description: string;
  photographer: string;
  child_posed: boolean;
  child_choose_to_take: boolean;
  group_photo: boolean;
  others_in_photo: string[];
  consent_given: boolean;
  consent_method: PhotoConsentMethod;
  photo_location: string;
  copies: string[];
  child_can_request_removal: boolean;
  part_of_life_story_book: boolean;
  part_of_bedroom_display: boolean;
  part_of_gallery_wall: boolean;
  child_comment: string;
  special_significance: string;
  created_at: string;
}

/* ── Physio & OT Plan ──────────────────────────────────────────────────── */

export type PhysioOtTherapyType = "physiotherapy" | "occupational_therapy" | "both" | "hand_therapy" | "sensory_integration_ot" | "hydrotherapy" | "awaiting_referral";
export const PHYSIO_OT_THERAPY_TYPE_LABEL: Record<PhysioOtTherapyType, string> = {
  physiotherapy: "Physiotherapy",
  occupational_therapy: "Occupational Therapy",
  both: "Both",
  hand_therapy: "Hand therapy",
  sensory_integration_ot: "Sensory integration OT",
  hydrotherapy: "Hydrotherapy",
  awaiting_referral: "Awaiting referral",
};

export type PhysioOtGoalStatus = "achieved" | "on_track" | "slow_progress" | "not_started";
export const PHYSIO_OT_GOAL_STATUS_LABEL: Record<PhysioOtGoalStatus, string> = {
  achieved: "Achieved",
  on_track: "On track",
  slow_progress: "Slow progress",
  not_started: "Not started",
};

export interface PhysioOtGoal {
  goal: string;
  status: PhysioOtGoalStatus;
  target_date?: string;
}

export interface PhysioOtExercise {
  name: string;
  frequency: string;
  who_supports: string;
}

export interface PhysioOtPlan {
  id: string;
  child_id: string;
  therapy_type: PhysioOtTherapyType;
  reason_for_referral: string;
  therapist_name?: string;
  therapist_service: string;
  start_date?: string;
  review_frequency?: string;
  goals: PhysioOtGoal[];
  exercises_programs: PhysioOtExercise[];
  equipment: string[];
  school_plan_in_place: boolean;
  home_environment_adaptations: string[];
  child_motivation: string;
  staff_support_needed: string[];
  child_voice: string;
  staff_observation: string;
  next_appointment?: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Batch 14 ──

export type PoliceContactType =
  | "missing_from_care_report"
  | "voluntary_attendance_interview"
  | "arrest"
  | "victim_of_crime"
  | "witness_voluntary"
  | "stop_and_search"
  | "restorative_resolution"
  | "welfare_check_by_police"
  | "information_sharing_only"
  | "other";

export const POLICE_CONTACT_TYPE_LABEL: Record<PoliceContactType, string> = {
  missing_from_care_report: "Missing-from-care report",
  voluntary_attendance_interview: "Voluntary attendance — interview",
  arrest: "Arrest",
  victim_of_crime: "Victim of crime",
  witness_voluntary: "Witness — voluntary",
  stop_and_search: "Stop and search",
  restorative_resolution: "Restorative resolution",
  welfare_check_by_police: "Welfare check by police",
  information_sharing_only: "Information sharing only",
  other: "Other",
};

export type PoliceContactReportedBy =
  | "home"
  | "child"
  | "school"
  | "member_of_public"
  | "police_initiated"
  | "other_agency";

export const POLICE_CONTACT_REPORTED_BY_LABEL: Record<PoliceContactReportedBy, string> = {
  home: "Home",
  child: "Child",
  school: "School",
  member_of_public: "Member of public",
  police_initiated: "Police-initiated",
  other_agency: "Other agency",
};

export type PoliceContactOutcome =
  | "no_further_action"
  | "voluntary_interview_only"
  | "restorative_justice"
  | "caution"
  | "charged"
  | "bail"
  | "released_no_charge"
  | "returned_to_home"
  | "other";

export const POLICE_CONTACT_OUTCOME_LABEL: Record<PoliceContactOutcome, string> = {
  no_further_action: "No further action",
  voluntary_interview_only: "Voluntary interview only",
  restorative_justice: "Restorative justice",
  caution: "Caution",
  charged: "Charged",
  bail: "Bail",
  released_no_charge: "Released — no charge",
  returned_to_home: "Returned to home",
  other: "Other",
};

export interface PoliceContactRecord {
  id: string;
  child_id: string;
  contact_date: string;
  contact_type: PoliceContactType;
  reported_by: PoliceContactReportedBy;
  officers_involved?: string;
  police_ref_number?: string;
  reason_context: string;
  home_protocol_followed: boolean;
  concordat_principles_applied: boolean;
  appropriate_adult_present?: boolean;
  legal_rep_present?: boolean;
  outcome: PoliceContactOutcome;
  restorative_opportunity: boolean;
  restorative_outcome?: string;
  child_voice: string;
  staff_observation: string;
  follow_up_required: boolean;
  follow_up_action?: string;
  flags_concerns: string;
  review_date: string;
  recorded_by: string;
  created_at: string;
}

export type PreventScreeningOutcome =
  | "no_concerns"
  | "watchful_awareness"
  | "concerns_identified_internal_support"
  | "channel_discussion_considered"
  | "channel_referred"
  | "de_escalated_closed";

export const PREVENT_SCREENING_OUTCOME_LABEL: Record<PreventScreeningOutcome, string> = {
  no_concerns: "No concerns",
  watchful_awareness: "Watchful awareness",
  concerns_identified_internal_support: "Concerns identified — internal support",
  channel_discussion_considered: "Channel discussion considered",
  channel_referred: "Channel referred",
  de_escalated_closed: "De-escalated / closed",
};

export type PreventChannelStatus =
  | "considered_not_made"
  | "made_accepted"
  | "made_rejected"
  | "active_panel"
  | "closed";

export const PREVENT_CHANNEL_STATUS_LABEL: Record<PreventChannelStatus, string> = {
  considered_not_made: "Considered — not made",
  made_accepted: "Made — accepted",
  made_rejected: "Made — rejected",
  active_panel: "Active panel",
  closed: "Closed",
};

export interface PreventExternalConsultation {
  agency: string;
  clinician?: string;
  date: string;
  outcome: string;
}

export interface PreventScreeningRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  screening_outcome: PreventScreeningOutcome;
  vulnerability_factors_considered: string[];
  protective_factors_considered: string[];
  identity_ideology_exposure_notes?: string;
  online_activity_flags: string[];
  peer_group_notes?: string;
  child_voice_consulted: boolean;
  child_voice?: string;
  staff_observation: string;
  external_consultation: PreventExternalConsultation[];
  channel_referral_status?: PreventChannelStatus;
  proportionality_reflection: string;
  review_date: string;
  flags_for_review: string;
  recorded_by: string;
  created_at: string;
}

export type CpConferenceType =
  | "initial_cp_conference"
  | "review_cp_conference"
  | "pre_birth_conference"
  | "strategy_meeting";

export const CP_CONFERENCE_TYPE_LABEL: Record<CpConferenceType, string> = {
  initial_cp_conference: "Initial CP Conference",
  review_cp_conference: "Review CP Conference",
  pre_birth_conference: "Pre-Birth Conference",
  strategy_meeting: "Strategy Meeting",
};

export type CpConferenceOutcome =
  | "subject_to_cp_plan"
  | "plan_continued"
  | "plan_stepped_down"
  | "no_cp_plan_required"
  | "strategy_decision_made";

export const CP_CONFERENCE_OUTCOME_LABEL: Record<CpConferenceOutcome, string> = {
  subject_to_cp_plan: "Subject to CP plan",
  plan_continued: "Plan continued",
  plan_stepped_down: "Plan stepped down",
  no_cp_plan_required: "No CP plan required",
  strategy_decision_made: "Strategy decision made",
};

export type CpCategory =
  | "neglect"
  | "physical_abuse"
  | "sexual_abuse"
  | "emotional_abuse"
  | "multiple_categories"
  | "na";

export const CP_CATEGORY_LABEL: Record<CpCategory, string> = {
  neglect: "Neglect",
  physical_abuse: "Physical abuse",
  sexual_abuse: "Sexual abuse",
  emotional_abuse: "Emotional abuse",
  multiple_categories: "Multiple categories",
  na: "N/A",
};

export interface CpPlanAction {
  action: string;
  owner: string;
  deadline: string;
}

export interface CpConferenceRecord {
  id: string;
  child_id: string;
  conference_type: CpConferenceType;
  date: string;
  chairperson: string;
  outcome: CpConferenceOutcome;
  category: CpCategory;
  attended_by: string[];
  home_representation: string;
  child_attended: boolean;
  child_contribution: string;
  agencies_present: string[];
  key_concerns: string[];
  protective_factors: string[];
  decisions_agreed: string[];
  cp_plan_actions: CpPlanAction[];
  next_review_date: string;
  report_submitted_date: string;
  report_author: string;
  follow_up_complete: boolean;
  created_at: string;
}

export type RightsKnowledgeLevel =
  | "doesnt_know"
  | "has_heard_of"
  | "understands_basics"
  | "confident"
  | "can_explain_to_others";

export const RIGHTS_KNOWLEDGE_LEVEL_LABEL: Record<RightsKnowledgeLevel, string> = {
  doesnt_know: "Doesn't know",
  has_heard_of: "Has heard of",
  understands_basics: "Understands basics",
  confident: "Confident",
  can_explain_to_others: "Can explain to others",
};

export interface RightsKnowledgeItem {
  right: string;
  level: RightsKnowledgeLevel;
}

export interface RightsUsageRecord {
  what: string;
  date: string;
  outcome: string;
}

export interface RightsLiteracyRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  rights_knowledge: RightsKnowledgeItem[];
  knows_how_to_complain: boolean;
  knows_advocate_name?: string;
  knows_independent_visitor_name?: string;
  knows_how_to_contact_ofsted: boolean;
  knows_right_to_access_records: boolean;
  knows_right_to_refuse_contact: boolean;
  has_used_rights: RightsUsageRecord[];
  learning_plan_this_quarter: string;
  resources_used: string[];
  child_voice: string;
  staff_observation: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

export type SchoolEventType =
  | "parents_evening"
  | "options_evening"
  | "prize_giving_awards"
  | "sports_day"
  | "school_production_play"
  | "concert_performance"
  | "leavers_assembly"
  | "prom"
  | "open_evening"
  | "pep_attendance"
  | "subject_taster_fair";

export const SCHOOL_EVENT_TYPE_LABEL: Record<SchoolEventType, string> = {
  parents_evening: "Parents' evening",
  options_evening: "Options evening",
  prize_giving_awards: "Prize-giving / awards",
  sports_day: "Sports day",
  school_production_play: "School production / play",
  concert_performance: "Concert / performance",
  leavers_assembly: "Leavers' assembly",
  prom: "Prom",
  open_evening: "Open evening (Y6/Y11)",
  pep_attendance: "PEP attendance",
  subject_taster_fair: "Subject taster / fair",
};

export interface SchoolEngagementEvent {
  id: string;
  child_id: string;
  event_date: string;
  event_type: SchoolEventType;
  school_name: string;
  attended_by: string[];
  birth_family_attended?: boolean;
  social_worker_attended: boolean;
  child_wanted_home_attendance: boolean;
  what_happened: string;
  child_achievements_recognised: string[];
  photos_taken_with_consent: boolean;
  photos_location?: string;
  feedback_from_school: string;
  follow_up_actions: string[];
  child_voice: string;
  staff_observation: string;
  flags_concerns: string;
  recorded_by: string;
  created_at: string;
}

export type ArousalState = "hyperarousal" | "hypoarousal" | "mixed";

export const AROUSAL_STATE_LABEL: Record<ArousalState, string> = {
  hyperarousal: "Hyperarousal (fight/flight)",
  hypoarousal: "Hypoarousal (freeze/dissociation)",
  mixed: "Mixed",
};

export type WindowOfTolerance = "narrow" | "moderate" | "widening";

export const WINDOW_OF_TOLERANCE_LABEL: Record<WindowOfTolerance, string> = {
  narrow: "Narrow",
  moderate: "Moderate",
  widening: "Widening",
};

export type ToolkitEffectiveness = "highly_effective" | "effective" | "mixed" | "needs_review";

export const TOOLKIT_EFFECTIVENESS_LABEL: Record<ToolkitEffectiveness, string> = {
  highly_effective: "Highly effective",
  effective: "Effective",
  mixed: "Mixed",
  needs_review: "Needs review",
};

export interface SelfSoothingToolkit {
  id: string;
  child_id: string;
  last_updated: string;
  primary_state: ArousalState;
  window_of_tolerance: WindowOfTolerance;
  sensory_strategies: string[];
  breathing_strategies: string[];
  movement_strategies: string[];
  distraction_strategies: string[];
  co_regulation_strategies: string[];
  what_works_anxious: string[];
  what_works_angry: string[];
  what_works_overwhelmed: string[];
  do_not_use: string[];
  child_chose_all: boolean;
  effectiveness_rating: ToolkitEffectiveness;
  child_voice: string;
  staff_observation: string;
  external_support?: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Batch 15 ──

export type SkinConditionType =
  | "atopic_eczema"
  | "contact_dermatitis"
  | "acne_mild"
  | "acne_moderate"
  | "acne_severe"
  | "psoriasis"
  | "vitiligo"
  | "keratosis_pilaris"
  | "scarring_managing"
  | "hidradenitis_suppurativa"
  | "mixed_multiple"
  | "other";

export const SKIN_CONDITION_TYPE_LABEL: Record<SkinConditionType, string> = {
  atopic_eczema: "Atopic eczema",
  contact_dermatitis: "Contact dermatitis",
  acne_mild: "Acne — mild",
  acne_moderate: "Acne — moderate",
  acne_severe: "Acne — severe",
  psoriasis: "Psoriasis",
  vitiligo: "Vitiligo",
  keratosis_pilaris: "Keratosis pilaris",
  scarring_managing: "Scarring (managing)",
  hidradenitis_suppurativa: "Hidradenitis suppurativa",
  mixed_multiple: "Mixed / multiple",
  other: "Other",
};

export type SkinSeverity = "settled" | "mild" | "moderate" | "severe" | "flaring";

export const SKIN_SEVERITY_LABEL: Record<SkinSeverity, string> = {
  settled: "Settled",
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
  flaring: "Flaring",
};

export type SteroidPotency = "mild" | "moderate" | "potent" | "very_potent";

export const STEROID_POTENCY_LABEL: Record<SteroidPotency, string> = {
  mild: "Mild",
  moderate: "Moderate",
  potent: "Potent",
  very_potent: "Very potent",
};

export type DermReferralStatus = "awaiting" | "active" | "discharged";

export const DERM_REFERRAL_STATUS_LABEL: Record<DermReferralStatus, string> = {
  awaiting: "Awaiting",
  active: "Active",
  discharged: "Discharged",
};

export interface SkinTopicalSteroid {
  name: string;
  potency: SteroidPotency;
  frequency: string;
  body_area: string;
}

export interface SkinDermatologyReferral {
  service: string;
  status: DermReferralStatus;
  consultant?: string;
}

export interface SkinConditionPlan {
  id: string;
  child_id: string;
  plan_date: string;
  condition: SkinConditionType;
  body_areas_affected: string[];
  severity_now: SkinSeverity;
  triggers: string[];
  daily_routine: string;
  emollient_name?: string;
  emollient_frequency?: string;
  topical_steroid?: SkinTopicalSteroid;
  systemic_treatment?: string;
  dermatology_referral?: SkinDermatologyReferral;
  school_considerations: string;
  swimming_safe: boolean;
  body_confidence_work: string;
  sun_safety_plan: string;
  products_avoided: string[];
  child_voice: string;
  staff_observation: string;
  flags_concerns: string[];
  review_date: string;
  key_worker: string;
  created_at: string;
}

export type SmokingStatus =
  | "never_used"
  | "tried_not_regular"
  | "occasional_vape"
  | "regular_vape"
  | "occasional_cigarette"
  | "regular_cigarette"
  | "multiple_substances"
  | "stopped"
  | "in_stop_programme";

export const SMOKING_STATUS_LABEL: Record<SmokingStatus, string> = {
  never_used: "Never used",
  tried_not_regular: "Tried — not regular",
  occasional_vape: "Occasional vape",
  regular_vape: "Regular vape",
  occasional_cigarette: "Occasional cigarette",
  regular_cigarette: "Regular cigarette",
  multiple_substances: "Multiple substances",
  stopped: "Stopped",
  in_stop_programme: "In stop programme",
};

export type SmokingAttitude =
  | "openly_dismissive"
  | "mixed"
  | "curious_about_quitting"
  | "building_motivation"
  | "actively_quitting"
  | "quit_over_6_months";

export const SMOKING_ATTITUDE_LABEL: Record<SmokingAttitude, string> = {
  openly_dismissive: "Openly dismissive",
  mixed: "Mixed",
  curious_about_quitting: "Curious about quitting",
  building_motivation: "Building motivation",
  actively_quitting: "Actively quitting",
  quit_over_6_months: "Quit > 6 months",
};

export type StopSmokingReferralStatus = "referred" | "engaged" | "discharged" | "declined";

export const STOP_SMOKING_REFERRAL_STATUS_LABEL: Record<StopSmokingReferralStatus, string> = {
  referred: "Referred",
  engaged: "Engaged",
  discharged: "Discharged",
  declined: "Declined",
};

export interface StopSmokingReferral {
  service: string;
  clinician_name?: string;
  status: StopSmokingReferralStatus;
}

export interface SmokingVapingRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  status: SmokingStatus;
  substances_used: string[];
  estimated_frequency?: string;
  triggers_identified: string[];
  brief_intervention_delivered: boolean;
  brief_intervention_date?: string;
  stop_smoking_referral?: StopSmokingReferral;
  harm_reduction_strategies: string[];
  home_policy_reinforcement: string;
  external_support: string;
  child_attitude: SmokingAttitude;
  child_voice: string;
  staff_observation: string;
  flags_concerns: string[];
  review_date: string;
  key_worker: string;
  created_at: string;
}

export type TherapyModality =
  | "tf_cbt"
  | "emdr"
  | "play_therapy"
  | "art_therapy"
  | "narrative_therapy"
  | "ddp"
  | "theraplay"
  | "cbt_general"
  | "person_centred"
  | "sand_tray"
  | "mixed"
  | "other";

export const THERAPY_MODALITY_LABEL: Record<TherapyModality, string> = {
  tf_cbt: "TF-CBT",
  emdr: "EMDR",
  play_therapy: "Play therapy",
  art_therapy: "Art therapy",
  narrative_therapy: "Narrative therapy",
  ddp: "DDP",
  theraplay: "Theraplay",
  cbt_general: "CBT (general)",
  person_centred: "Person-centred",
  sand_tray: "Sand tray",
  mixed: "Mixed",
  other: "Other",
};

export type TherapySessionFormat =
  | "one_to_one"
  | "family_included"
  | "group"
  | "online"
  | "outdoor_walk_and_talk";

export const THERAPY_SESSION_FORMAT_LABEL: Record<TherapySessionFormat, string> = {
  one_to_one: "1:1",
  family_included: "Family-included",
  group: "Group",
  online: "Online",
  outdoor_walk_and_talk: "Outdoor / walk and talk",
};

export type TherapyPresentation =
  | "engaged"
  | "withdrawn"
  | "avoidant"
  | "distressed"
  | "mixed"
  | "building_trust";

export const THERAPY_PRESENTATION_LABEL: Record<TherapyPresentation, string> = {
  engaged: "Engaged",
  withdrawn: "Withdrawn",
  avoidant: "Avoidant",
  distressed: "Distressed",
  mixed: "Mixed",
  building_trust: "Building trust",
};

export interface TraumaTherapyLog {
  id: string;
  child_id: string;
  session_date: string;
  modality: TherapyModality;
  therapist_name: string;
  therapist_service: string;
  session_format: TherapySessionFormat;
  session_length_minutes: number;
  attended: boolean;
  reason_if_missed?: string;
  general_theme_broad: string;
  child_presentation: TherapyPresentation;
  pre_session_mood_rating: number;
  post_session_mood_rating: number;
  regulation_strategies_used_after: string[];
  between_session_support: string;
  escalation_flags: string[];
  child_voice_shared?: string;
  staff_observation: string;
  next_session?: string;
  recorded_by: string;
  created_at: string;
}

export type BodyConfidence = "building" | "mixed" | "stable" | "strong";

export const BODY_CONFIDENCE_LABEL: Record<BodyConfidence, string> = {
  building: "Building",
  mixed: "Mixed",
  stable: "Stable",
  strong: "Strong",
};

export interface MeaningfulItem {
  item: string;
  meaning: string;
}

export interface StyleIdentityRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  style_descriptors: string[];
  identity_elements: string[];
  meaningful_items: MeaningfulItem[];
  cultural_dress: string[];
  gender_expression_notes?: string;
  hair_style_current: string;
  hair_journey: string[];
  accessories_preferences: string[];
  shopping_preferences: string[];
  what_they_avoid: string[];
  body_confidence: BodyConfidence;
  challenges_noted: string;
  child_voice: string;
  staff_observation: string;
  flags_for_review: string[];
  review_date: string;
  key_worker: string;
  created_at: string;
}

export type TutoringFormat = "online" | "in_home" | "tutors_home" | "library" | "mixed";

export const TUTORING_FORMAT_LABEL: Record<TutoringFormat, string> = {
  online: "Online",
  in_home: "In-home",
  tutors_home: "Tutor's home",
  library: "Library",
  mixed: "Mixed",
};

export type TutoringFundingSource =
  | "pupil_premium_plus"
  | "virtual_school_grant"
  | "leaving_care_fund"
  | "home_budget"
  | "family_contribution"
  | "mixed"
  | "free_charity";

export const TUTORING_FUNDING_SOURCE_LABEL: Record<TutoringFundingSource, string> = {
  pupil_premium_plus: "Pupil Premium Plus",
  virtual_school_grant: "Virtual School grant",
  leaving_care_fund: "Leaving Care fund",
  home_budget: "Home budget",
  family_contribution: "Family contribution",
  mixed: "Mixed",
  free_charity: "Free (charity)",
};

export type TutoringMotivation = "high" | "building" | "mixed" | "low";

export const TUTORING_MOTIVATION_LABEL: Record<TutoringMotivation, string> = {
  high: "High",
  building: "Building",
  mixed: "Mixed",
  low: "Low",
};

export interface TutoringRecord {
  id: string;
  child_id: string;
  subject: string;
  exam_focus?: string;
  tutor_name: string;
  tutor_qualifications: string;
  dbs_checked_date: string;
  agency?: string;
  start_date: string;
  end_date?: string;
  ongoing: boolean;
  format: TutoringFormat;
  hours_per_week: number;
  hourly_rate: number;
  cost_to_date: number;
  funding_source: TutoringFundingSource;
  baseline_grade?: string;
  current_grade?: string;
  target_grade?: string;
  resources_provided: string[];
  child_motivation: TutoringMotivation;
  parent_sw_aware: boolean;
  child_voice: string;
  staff_observation: string;
  next_session?: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

export type VisionStatus =
  | "no_correction_needed"
  | "prescription_glasses"
  | "contact_lenses"
  | "glasses_and_contacts"
  | "awaiting_test"
  | "specialist_referral_active";

export const VISION_STATUS_LABEL: Record<VisionStatus, string> = {
  no_correction_needed: "No correction needed",
  prescription_glasses: "Prescription glasses",
  contact_lenses: "Contact lenses",
  glasses_and_contacts: "Glasses + contacts",
  awaiting_test: "Awaiting test",
  specialist_referral_active: "Specialist referral active",
};

export type GlassesWearConsistency = "always" | "mostly" | "inconsistent" | "resists";

export const GLASSES_WEAR_CONSISTENCY_LABEL: Record<GlassesWearConsistency, string> = {
  always: "Always",
  mostly: "Mostly",
  inconsistent: "Inconsistent",
  resists: "Resists",
};

export interface VisionPrescription {
  right: string;
  left: string;
}

export interface GlassesFrames {
  brand: string;
  model: string;
  purchase_date: string;
}

export interface VisionSpecialistReferral {
  service: string;
  date: string;
  reason: string;
}

export interface VisionCareRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  status: VisionStatus;
  last_sight_test_date?: string;
  next_sight_test_due?: string;
  optometrist?: string;
  prescription?: VisionPrescription;
  glasses_frames?: GlassesFrames;
  spare_glasses_available: boolean;
  contact_lens_type?: string;
  symptoms_reported: string[];
  specialist_referral?: VisionSpecialistReferral;
  school_aware: boolean;
  child_wears_consistently?: GlassesWearConsistency;
  cleaning_routine: string;
  child_voice: string;
  staff_observation: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Batch 16 ──

export type ExpertiseType =
  | "care_planning_advice"
  | "staff_training_contribution"
  | "recruitment_panel"
  | "policy_co_production"
  | "service_improvement_input"
  | "inspection_contribution"
  | "external_speaking"
  | "mentoring_younger_child"
  | "research_participation";

export const EXPERTISE_TYPE_LABEL: Record<ExpertiseType, string> = {
  care_planning_advice: "Care Planning Advice",
  staff_training_contribution: "Staff Training Contribution",
  recruitment_panel: "Recruitment Panel",
  policy_co_production: "Policy Co-production",
  service_improvement_input: "Service Improvement Input",
  inspection_contribution: "Inspection Contribution",
  external_speaking: "External Speaking",
  mentoring_younger_child: "Mentoring Younger Child",
  research_participation: "Research Participation",
};

export interface ChildExpertEntry {
  id: string;
  child_id: string;
  date: string;
  expertise: ExpertiseType;
  context: string;
  contribution: string;
  audience: string;
  preparation: string;
  accommodations: string[];
  child_motivation: string;
  child_reflection: string;
  impact_recorded: string;
  recognition_given: string;
  token_of_thanks: string;
  long_term_learning: string;
  reviewed_by: string;
  created_at: string;
}

export type CMEStatus =
  | "in_education"
  | "missing_education"
  | "part_time_timetable"
  | "exclusion"
  | "awaiting_placement"
  | "elective_home_ed";

export const CME_STATUS_LABEL: Record<CMEStatus, string> = {
  in_education: "In Education",
  missing_education: "Missing Education",
  part_time_timetable: "Part-Time Timetable",
  exclusion: "Exclusion",
  awaiting_placement: "Awaiting Placement",
  elective_home_ed: "Elective Home Education",
};

export type AttendanceLevel = "good" | "concerning" | "persistent_absence" | "severe_absence";

export const ATTENDANCE_LEVEL_LABEL: Record<AttendanceLevel, string> = {
  good: "Good",
  concerning: "Concerning",
  persistent_absence: "Persistent Absence",
  severe_absence: "Severe Absence",
};

export interface CMERecord {
  id: string;
  child_id: string;
  school: string;
  year_group: string;
  current_status: CMEStatus;
  attendance_percentage: number;
  attendance_level: AttendanceLevel;
  authorised_absences: number;
  unauthorised_absences: number;
  exclusions: { fixed_term: number; permanent: number };
  current_exclusion: boolean;
  exclusion_details: string;
  part_time_timetable: boolean;
  ptt_details: string;
  ptt_review_date: string | null;
  sen_status: string;
  ehcp_in_place: boolean;
  virtual_school_contact: string;
  last_pep_date: string;
  next_pep_date: string;
  actions_taken: string[];
  concerns: string;
  notes: string;
  created_at: string;
}

export type ChildrensMeetingType = "regular" | "ad_hoc" | "special_request" | "welcome" | "goodbye";

export const CHILDRENS_MEETING_TYPE_LABEL: Record<ChildrensMeetingType, string> = {
  regular: "Regular",
  ad_hoc: "Ad Hoc",
  special_request: "Special Request",
  welcome: "Welcome Meeting",
  goodbye: "Goodbye Meeting",
};

export type MeetingMood = "positive" | "mixed" | "difficult";

export const MEETING_MOOD_LABEL: Record<MeetingMood, string> = {
  positive: "Positive",
  mixed: "Mixed",
  difficult: "Difficult",
};

export type MeetingActionStatus = "pending" | "in_progress" | "completed" | "carried_forward" | "overdue";

export const MEETING_ACTION_STATUS_LABEL: Record<MeetingActionStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  carried_forward: "Carried Forward",
  overdue: "Overdue",
};

export interface MeetingAgendaItem {
  topic: string;
  raised_by: string;
  discussion: string;
  outcome: string;
  action_needed: boolean;
}

export interface MeetingActionItem {
  id: string;
  action: string;
  owner: string;
  due_date: string;
  status: MeetingActionStatus;
  completed_date: string | null;
  notes: string;
}

export interface ChildrensMeetingRecord {
  id: string;
  date: string;
  type: ChildrensMeetingType;
  facilitated_by: string;
  staff_present: string[];
  yp_present: string[];
  yp_absent: string[];
  absent_reasons: Record<string, string>;
  agenda: MeetingAgendaItem[];
  actions: MeetingActionItem[];
  child_chair: string | null;
  child_minute_taker: string | null;
  meal_or_snack: string;
  overall_mood: MeetingMood;
  complaints_raised: boolean;
  complaints_details: string;
  suggestions_box: string[];
  next_meeting_date: string;
  notes: string;
  created_at: string;
}

export type ClothingPurchaseCategory =
  | "school_uniform"
  | "casual"
  | "formal"
  | "outdoor"
  | "footwear"
  | "underwear_socks"
  | "nightwear"
  | "sportswear"
  | "accessories"
  | "seasonal";

export const CLOTHING_PURCHASE_CATEGORY_LABEL: Record<ClothingPurchaseCategory, string> = {
  school_uniform: "School Uniform",
  casual: "Casual Wear",
  formal: "Formal Wear",
  outdoor: "Outdoor / Coats",
  footwear: "Footwear",
  underwear_socks: "Underwear & Socks",
  nightwear: "Nightwear",
  sportswear: "Sportswear",
  accessories: "Accessories",
  seasonal: "Seasonal",
};

export interface ClothingPurchase {
  id: string;
  date: string;
  category: ClothingPurchaseCategory;
  description: string;
  amount: number;
  store: string;
  purchased_by: string;
  child_present: boolean;
  child_chose: boolean;
  receipt_ref: string;
}

export interface ClothingAllowanceRecord {
  id: string;
  child_id: string;
  financial_year: string;
  annual_budget: number;
  quarterly_allowance: number;
  current_quarter: number;
  quarter_spend: number;
  ytd_spend: number;
  purchases: ClothingPurchase[];
  preferences: string[];
  sizes: Record<string, string>;
  notes: string;
  created_at: string;
}

export type CommissioningFeedbackType =
  | "annual_review"
  | "placement_update"
  | "quality_concern"
  | "compliment"
  | "statutory_visit";

export const COMMISSIONING_FEEDBACK_TYPE_LABEL: Record<CommissioningFeedbackType, string> = {
  annual_review: "Annual Review",
  placement_update: "Placement Update",
  quality_concern: "Quality Concern",
  compliment: "Compliment",
  statutory_visit: "Statutory Visit",
};

export interface CommissioningFeedbackRecord {
  id: string;
  child_id: string;
  date_received: string;
  local_authority: string;
  commissioner: string;
  feedback_type: CommissioningFeedbackType;
  overall_rating: 1 | 2 | 3 | 4 | 5;
  strengths: string[];
  areas_for_development: string[];
  specific_comments: string;
  response_required: boolean;
  response_date: string;
  response_given_by: string;
  response_summary: string;
  next_review_date: string;
  created_at: string;
}

export type CommunicationPriority = "routine" | "important" | "urgent" | "info";

export const COMMUNICATION_PRIORITY_LABEL: Record<CommunicationPriority, string> = {
  routine: "Routine",
  important: "Important",
  urgent: "Urgent",
  info: "Info",
};

export type CommunicationCategory =
  | "general"
  | "maintenance"
  | "medication"
  | "appointments"
  | "visitors"
  | "safeguarding"
  | "handover_note"
  | "management"
  | "supplies";

export const COMMUNICATION_CATEGORY_LABEL: Record<CommunicationCategory, string> = {
  general: "General",
  maintenance: "Maintenance",
  medication: "Medication",
  appointments: "Appointments",
  visitors: "Visitors",
  safeguarding: "Safeguarding",
  handover_note: "Handover Note",
  management: "Management",
  supplies: "Supplies",
};

export interface CommunicationAcknowledgement {
  staff_id: string;
  date: string;
}

export interface CommunicationBookEntry {
  id: string;
  date: string;
  time: string;
  author: string;
  priority: CommunicationPriority;
  category: CommunicationCategory;
  subject: string;
  message: string;
  pinned: boolean;
  acknowledged_by: CommunicationAcknowledgement[];
  related_yp: string | null;
  action_required: boolean;
  action_completed_by: string | null;
  action_completed_date: string | null;
  created_at: string;
}

// ── Batch 17 ──

export type CommunityFeedbackSource =
  | "neighbour"
  | "local_business"
  | "member_of_public"
  | "local_councillor"
  | "police_community_team"
  | "place_of_worship"
  | "school"
  | "anonymous";

export const COMMUNITY_FEEDBACK_SOURCE_LABEL: Record<CommunityFeedbackSource, string> = {
  neighbour: "Neighbour",
  local_business: "Local Business",
  member_of_public: "Member of Public",
  local_councillor: "Local Councillor",
  police_community_team: "Police Community Team",
  place_of_worship: "Place of Worship",
  school: "School",
  anonymous: "Anonymous",
};

export type CommunityFeedbackType =
  | "compliment"
  | "concern"
  | "suggestion"
  | "question"
  | "complaint"
  | "recognition";

export const COMMUNITY_FEEDBACK_TYPE_LABEL: Record<CommunityFeedbackType, string> = {
  compliment: "Compliment",
  concern: "Concern",
  suggestion: "Suggestion",
  question: "Question",
  complaint: "Complaint",
  recognition: "Recognition",
};

export interface CommunityFeedbackRecord {
  id: string;
  date_received: string;
  source: CommunityFeedbackSource;
  source_contact: string;
  feedback_type: CommunityFeedbackType;
  summary: string;
  full_description: string;
  received_by: string;
  response_required: boolean;
  response_sent: boolean;
  response_date: string;
  response_summary: string;
  escalated_to: string;
  pattern_indicator: string;
  children_informed_of_positive_feedback: boolean;
  policy_or_practice_arising: string;
  reviewed_date: string;
  created_at: string;
}

export const COMPLAINT_OUTCOME_LABEL: Record<ComplaintOutcome, string> = {
  upheld: "Upheld",
  partially_upheld: "Partially Upheld",
  not_upheld: "Not Upheld",
  inconclusive: "Inconclusive",
  withdrawn: "Withdrawn",
  ongoing: "Ongoing",
};

export type ComplaintSource = "child" | "parent_carer" | "social_worker" | "professional" | "staff" | "anonymous";

export const COMPLAINT_SOURCE_LABEL: Record<ComplaintSource, string> = {
  child: "Young Person",
  parent_carer: "Parent / Carer",
  social_worker: "Social Worker",
  professional: "Professional",
  staff: "Staff Member",
  anonymous: "Anonymous",
};

export type ComplaintTheme =
  | "care_quality"
  | "staff_conduct"
  | "environment"
  | "food"
  | "activities"
  | "communication"
  | "privacy"
  | "medication"
  | "other";

export const COMPLAINT_THEME_LABEL: Record<ComplaintTheme, string> = {
  care_quality: "Care Quality",
  staff_conduct: "Staff Conduct",
  environment: "Environment",
  food: "Food",
  activities: "Activities",
  communication: "Communication",
  privacy: "Privacy",
  medication: "Medication",
  other: "Other",
};

export interface ComplaintOutcomeRecord {
  id: string;
  complaint_date: string;
  complainant: string;
  source: ComplaintSource;
  theme: ComplaintTheme;
  outcome: ComplaintOutcome;
  investigated_by: string;
  date_resolved: string | null;
  response_time_days: number;
  child_id: string | null;
  summary: string;
  findings: string;
  lessons_learned: string;
  practice_changes: string[];
  complainant_satisfied: boolean | null;
  escalated: boolean;
  escalated_to: string | null;
  ofsted_notified: boolean;
  created_at: string;
}

export type ConsentCategory =
  | "medical"
  | "education"
  | "photography"
  | "trips_activities"
  | "information_sharing"
  | "therapy"
  | "social_media"
  | "overnight_stays"
  | "contact"
  | "research";

export const CONSENT_CATEGORY_LABEL: Record<ConsentCategory, string> = {
  medical: "Medical Treatment",
  education: "Education",
  photography: "Photography",
  trips_activities: "Trips & Activities",
  information_sharing: "Information Sharing",
  therapy: "Therapeutic Support",
  social_media: "Social Media",
  overnight_stays: "Overnight Stays",
  contact: "Contact Arrangements",
  research: "Research Participation",
};

export type ConsentStatus = "granted" | "refused" | "pending" | "expired" | "withdrawn";

export const CONSENT_STATUS_LABEL: Record<ConsentStatus, string> = {
  granted: "Granted",
  refused: "Refused",
  pending: "Pending",
  expired: "Expired",
  withdrawn: "Withdrawn",
};

export type ConsentorType = "social_worker" | "parent" | "young_person" | "local_authority" | "guardian";

export const CONSENTOR_TYPE_LABEL: Record<ConsentorType, string> = {
  social_worker: "Social Worker",
  parent: "Parent/Carer",
  young_person: "Young Person",
  local_authority: "Local Authority",
  guardian: "Guardian",
};

export interface ConsentRecord {
  id: string;
  child_id: string;
  category: ConsentCategory;
  description: string;
  status: ConsentStatus;
  consentor_type: ConsentorType;
  consentor_name: string;
  date_requested: string;
  date_decided: string;
  expiry_date: string;
  conditions: string;
  recorded_by: string;
  notes: string;
  review_date: string;
  created_at: string;
}

export type ContactCategory =
  | "social_worker"
  | "iro"
  | "gp"
  | "dentist"
  | "camhs"
  | "school"
  | "police"
  | "ofsted"
  | "local_authority"
  | "advocate"
  | "therapist"
  | "emergency"
  | "other";

export const CONTACT_CATEGORY_LABEL: Record<ContactCategory, string> = {
  social_worker: "Social Worker",
  iro: "IRO",
  gp: "GP",
  dentist: "Dentist",
  camhs: "CAMHS",
  school: "School",
  police: "Police",
  ofsted: "Ofsted",
  local_authority: "Local Authority",
  advocate: "Advocate",
  therapist: "Therapist",
  emergency: "Emergency",
  other: "Other",
};

export interface ContactDirectoryEntry {
  id: string;
  name: string;
  role: string;
  organisation: string;
  category: ContactCategory;
  phone: string;
  email: string;
  address: string;
  linked_children: string[];
  is_emergency: boolean;
  notes: string;
  last_updated: string;
  created_at: string;
}

export type ContactSessionType = "face_to_face" | "video_call" | "phone_call" | "letterbox" | "supervised_community" | "supervised_centre";

export const CONTACT_SESSION_TYPE_LABEL: Record<ContactSessionType, string> = {
  face_to_face: "Face to Face",
  video_call: "Video Call",
  phone_call: "Phone Call",
  letterbox: "Letterbox",
  supervised_community: "Supervised (Community)",
  supervised_centre: "Supervised (Contact Centre)",
};

export type SupervisionLevel = "supervised" | "supported" | "monitored" | "unsupervised";

export const SUPERVISION_LEVEL_LABEL: Record<SupervisionLevel, string> = {
  supervised: "Supervised",
  supported: "Supported",
  monitored: "Monitored",
  unsupervised: "Unsupervised",
};

export type ContactSessionOutcome = "positive" | "mixed" | "concerning" | "did_not_attend" | "cancelled_by_family" | "cancelled_by_sw";

export const CONTACT_SESSION_OUTCOME_LABEL: Record<ContactSessionOutcome, string> = {
  positive: "Positive",
  mixed: "Mixed",
  concerning: "Concerning",
  did_not_attend: "Did Not Attend",
  cancelled_by_family: "Cancelled (Family)",
  cancelled_by_sw: "Cancelled (SW)",
};

export type ContactSessionPerson = "birth_mother" | "birth_father" | "sibling" | "grandparent" | "extended_family" | "other";

export const CONTACT_SESSION_PERSON_LABEL: Record<ContactSessionPerson, string> = {
  birth_mother: "Birth Mother",
  birth_father: "Birth Father",
  sibling: "Sibling",
  grandparent: "Grandparent",
  extended_family: "Extended Family",
  other: "Other",
};

export interface ContactSupervisionSession {
  id: string;
  child_id: string;
  date: string;
  start_time: string;
  end_time: string;
  contact_type: ContactSessionType;
  supervision_level: SupervisionLevel;
  contact_person: ContactSessionPerson;
  contact_person_name: string;
  venue: string;
  supervising_staff: string;
  outcome: ContactSessionOutcome;
  child_presentation_before: string;
  child_presentation_during: string;
  child_presentation_after: string;
  interaction_quality: string;
  concerns: string[];
  positives: string[];
  safeguarding_concerns: boolean;
  safeguarding_details: string;
  child_views: string;
  gifts_brought: string;
  agreement_breaches: string[];
  court_order_ref: string;
  next_contact_date: string;
  social_worker_notified: boolean;
  notes: string;
  created_at: string;
}

export type ContextualRiskLevel = "low" | "medium" | "high" | "very_high";

export const CONTEXTUAL_RISK_LEVEL_LABEL: Record<ContextualRiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  very_high: "Very High",
};

export type ContextualContextType = "location" | "peer_group" | "online_space" | "transport_route" | "school" | "community_facility";

export const CONTEXTUAL_CONTEXT_TYPE_LABEL: Record<ContextualContextType, string> = {
  location: "Physical Location",
  peer_group: "Peer Group",
  online_space: "Online Space",
  transport_route: "Transport Route",
  school: "School / Education",
  community_facility: "Community Facility",
};

export type ContextualSafeguardingStatus = "active" | "monitoring" | "resolved" | "escalated";

export const CONTEXTUAL_SAFEGUARDING_STATUS_LABEL: Record<ContextualSafeguardingStatus, string> = {
  active: "Active Risk",
  monitoring: "Monitoring",
  resolved: "Resolved",
  escalated: "Escalated",
};

export interface ContextualSafeguardingRisk {
  id: string;
  date_identified: string;
  last_reviewed: string;
  identified_by: string;
  context_type: ContextualContextType;
  risk_level: ContextualRiskLevel;
  status: ContextualSafeguardingStatus;
  location_or_context: string;
  description: string;
  children_affected: string[];
  risk_factors: string[];
  protective_actions: string[];
  multi_agency_actions: string[];
  police_intelligence: string;
  community_mapping: string;
  review_date: string;
  created_at: string;
}

// ── Batch 18 ──────────────────────────────────────────────────────────────────

// correspondence
export type CorrespondenceDirection = "incoming" | "outgoing";
export type CorrespondenceMethod = "email" | "letter" | "phone_call" | "meeting" | "formal_notice" | "other";
export type CorrespondencePriority = "urgent" | "normal" | "low";
export type CorrespondenceStatus = "pending" | "actioned" | "filed" | "awaiting_response";

export interface CorrespondenceEntry {
  id: string;
  date: string;
  time: string;
  direction: CorrespondenceDirection;
  method: CorrespondenceMethod;
  priority: CorrespondencePriority;
  status: CorrespondenceStatus;
  subject: string;
  from_name: string;
  from_role: string;
  to_name: string;
  to_role: string;
  summary: string;
  action_required: string | null;
  action_due: string | null;
  child_id: string | null;
  recorded_by: string;
  created_at: string;
}

// critical-incident-debrief
export type DebriefIncidentCategory = "restraint" | "self_harm" | "missing" | "violence" | "property_damage" | "safeguarding" | "medical_emergency" | "fire" | "near_miss" | "other";
export const DEBRIEF_INCIDENT_CATEGORY_LABEL: Record<DebriefIncidentCategory, string> = {
  restraint: "Physical Intervention", self_harm: "Self-Harm", missing: "Missing from Care",
  violence: "Violence/Aggression", property_damage: "Property Damage", safeguarding: "Safeguarding Concern",
  medical_emergency: "Medical Emergency", fire: "Fire/Evacuation", near_miss: "Near Miss", other: "Other",
};

export type IncidentDebriefStatus = "scheduled" | "completed" | "deferred" | "not_required";
export const INCIDENT_DEBRIEF_STATUS_LABEL: Record<IncidentDebriefStatus, string> = {
  scheduled: "Scheduled", completed: "Completed", deferred: "Deferred", not_required: "Not Required",
};

export type DebriefImpactLevel = "low" | "medium" | "high" | "critical";
export const DEBRIEF_IMPACT_LEVEL_LABEL: Record<DebriefImpactLevel, string> = {
  low: "Low", medium: "Medium", high: "High", critical: "Critical",
};

export interface CriticalIncidentDebriefRecord {
  id: string;
  incident_date: string;
  debrief_date: string;
  incident_category: DebriefIncidentCategory;
  incident_summary: string;
  impact_level: DebriefImpactLevel;
  young_person_ids: string[];
  staff_involved_ids: string[];
  facilitator_id: string;
  attendees: string[];
  status: IncidentDebriefStatus;
  what_happened: string;
  what_worked_well: string[];
  what_could_improve: string[];
  root_causes: string[];
  emotional_impact: string;
  actions_agreed: string[];
  actions_completed: number;
  policy_changes: string;
  training_needs: string[];
  shared_with: string[];
  follow_up_date: string | null;
  notes: string;
  created_at: string;
}

// cultural-identity
export type CulturalIdentityAreaStatus = "well_supported" | "needs_attention" | "exploring";
export const CULTURAL_IDENTITY_AREA_STATUS_LABEL: Record<CulturalIdentityAreaStatus, string> = {
  well_supported: "Well Supported", needs_attention: "Needs Attention", exploring: "Exploring",
};

export interface CulturalIdentityArea {
  area: string;
  child_view: string;
  current_support: string;
  status: CulturalIdentityAreaStatus;
}

export interface CulturalIdentityPlan {
  id: string;
  child_id: string;
  ethnicity: string;
  heritage: string;
  religion: string;
  first_language: string;
  other_languages: string[];
  dietary_needs: string;
  identity_areas: CulturalIdentityArea[];
  celebrations: string[];
  resources: string[];
  action_plan: string;
  last_reviewed: string;
  next_review: string;
  reviewed_by: string;
  child_contributed: boolean;
  notes: string;
  created_at: string;
}

// data-breach-log
export type DataBreachType = "lost_device" | "lost_paper" | "email_to_wrong_recipient" | "unauthorised_access" | "unauthorised_disclosure" | "verbal_disclosure" | "system_error" | "phishing_social_engineering" | "other";
export const DATA_BREACH_TYPE_LABEL: Record<DataBreachType, string> = {
  lost_device: "Lost Device", lost_paper: "Lost Paper", email_to_wrong_recipient: "Email to Wrong Recipient",
  unauthorised_access: "Unauthorised Access", unauthorised_disclosure: "Unauthorised Disclosure",
  verbal_disclosure: "Verbal Disclosure", system_error: "System Error",
  phishing_social_engineering: "Phishing/Social Engineering", other: "Other",
};

export type DataBreachSeverity = "low" | "medium" | "high" | "critical";
export const DATA_BREACH_SEVERITY_LABEL: Record<DataBreachSeverity, string> = {
  low: "Low", medium: "Medium", high: "High", critical: "Critical",
};

export type DataBreachRiskLevel = "low" | "medium" | "high";
export const DATA_BREACH_RISK_LEVEL_LABEL: Record<DataBreachRiskLevel, string> = {
  low: "Low", medium: "Medium", high: "High",
};

export type DataBreachStatus = "investigating" | "closed_resolved" | "reported_awaiting_ico" | "monitoring";
export const DATA_BREACH_STATUS_LABEL: Record<DataBreachStatus, string> = {
  investigating: "Investigating", closed_resolved: "Closed — Resolved",
  reported_awaiting_ico: "Reported — Awaiting ICO", monitoring: "Monitoring",
};

export interface DataBreachRecord {
  id: string;
  date_discovered: string;
  date_incident: string;
  breach_type: DataBreachType;
  severity: DataBreachSeverity;
  near_miss: boolean;
  summary_of_breach: string;
  data_subjects: string;
  data_categories_affected: string[];
  special_category_data: boolean;
  risk_to_individuals: DataBreachRiskLevel;
  reported_to_ico: boolean;
  ico_reported_date: string;
  ico_reference: string;
  data_subjects_notified: boolean;
  notification_date: string;
  immediate_actions_taken: string[];
  root_cause_analysis: string;
  lessons_learned: string[];
  preventive_actions: string[];
  training_arising: string[];
  policy_arising: string;
  status: DataBreachStatus;
  reported_to: string[];
  reviewed_by: string;
  created_at: string;
}

// data-protection
export type DataProtectionRecordType = "dsar" | "breach" | "dpia" | "consent_review" | "retention_review";
export const DATA_PROTECTION_RECORD_TYPE_LABEL: Record<DataProtectionRecordType, string> = {
  dsar: "Subject Access Request", breach: "Data Breach", dpia: "Impact Assessment",
  consent_review: "Consent Review", retention_review: "Retention Review",
};

export type DataProtectionRecordStatus = "received" | "in_progress" | "completed" | "overdue" | "closed";
export const DATA_PROTECTION_RECORD_STATUS_LABEL: Record<DataProtectionRecordStatus, string> = {
  received: "Received", in_progress: "In Progress", completed: "Completed",
  overdue: "Overdue", closed: "Closed",
};

export type DataProtectionBreachSeverity = "low" | "medium" | "high" | "critical";
export const DATA_PROTECTION_BREACH_SEVERITY_LABEL: Record<DataProtectionBreachSeverity, string> = {
  low: "Low", medium: "Medium", high: "High", critical: "Critical",
};

export interface DataProtectionRecord {
  id: string;
  type: DataProtectionRecordType;
  status: DataProtectionRecordStatus;
  subject: string;
  description: string;
  date_raised: string;
  due_date: string;
  completed_date: string | null;
  handled_by: string;
  breach_severity: DataProtectionBreachSeverity | null;
  ico_notified: boolean;
  ico_notification_date: string | null;
  individuals_notified: boolean;
  root_cause: string;
  remedial_actions: string[];
  lessons_learned: string;
  notes: string;
  created_at: string;
}

// debriefs
export type ReflectiveDebriefType = "post_incident" | "post_restraint" | "critical_event" | "near_miss" | "team_reflection" | "safeguarding";
export const REFLECTIVE_DEBRIEF_TYPE_LABEL: Record<ReflectiveDebriefType, string> = {
  post_incident: "Post-Incident", post_restraint: "Post-Restraint", critical_event: "Critical Event",
  near_miss: "Near Miss", team_reflection: "Team Reflection", safeguarding: "Safeguarding",
};

export interface DebriefFollowUpAction {
  action: string;
  owner: string;
  completed: boolean;
}

export interface DebriefRecord {
  id: string;
  date: string;
  type: ReflectiveDebriefType;
  linked_incident_id: string;
  linked_incident_summary: string;
  child_id: string;
  staff_involved: string[];
  facilitated_by: string;
  what_happened: string;
  what_worked_well: string;
  what_could_improve: string;
  staff_wellbeing: string;
  child_perspective: string;
  lessons_learned: string[];
  changes_needed: string[];
  follow_up_actions: DebriefFollowUpAction[];
  support_offered: boolean;
  support_details: string;
  created_at: string;
}

// ── Batch 19 ──────────────────────────────────────────────────────────────────

// dental-records
export type DentalRegistrationStatus = "active_nhs" | "active_private" | "awaiting_registration" | "inactive";
export const DENTAL_REGISTRATION_STATUS_LABEL: Record<DentalRegistrationStatus, string> = {
  active_nhs: "Active NHS", active_private: "Active Private",
  awaiting_registration: "Awaiting Registration", inactive: "Inactive",
};

export type DentalRecallInterval = "3_monthly" | "6_monthly" | "12_monthly";
export const DENTAL_RECALL_INTERVAL_LABEL: Record<DentalRecallInterval, string> = {
  "3_monthly": "3 Monthly", "6_monthly": "6 Monthly", "12_monthly": "12 Monthly",
};

export interface DentalOralHygienePractice {
  practice: string;
  completed: boolean;
}

export interface DentalCheckUpEntry {
  date: string;
  dentist: string;
  findings: string;
  treatment_recommended: string;
  treatment_received: string;
}

export interface DentalRecord {
  id: string;
  child_id: string;
  dental_practice: string;
  dentist_name: string;
  registered_date: string;
  registration_status: DentalRegistrationStatus;
  daily_oral_hygiene: DentalOralHygienePractice[];
  last_check_up_date: string;
  next_check_up_due: string;
  recall_interval: DentalRecallInterval;
  check_ups_history: DentalCheckUpEntry[];
  current_treatment_notes: string;
  anxiety_around_dentistry: string;
  reasonable_adjustments: string[];
  child_attitude_to_dentistry: string;
  orthodontics: string;
  fluoride_supplements: boolean;
  child_aware: boolean;
  review_date: string;
  recorded_by: string;
  created_at: string;
}

// deprivation-of-liberty
export type DoLRestrictionType = "locked_doors" | "window_restrictors" | "bedroom_door_alarm" | "cctv" | "confiscation" | "search" | "internet_monitoring" | "curfew" | "geographic_restriction" | "contact_restriction" | "other";
export const DOL_RESTRICTION_TYPE_LABEL: Record<DoLRestrictionType, string> = {
  locked_doors: "Locked Doors/Gates", window_restrictors: "Window Restrictors", bedroom_door_alarm: "Bedroom Door Alarm",
  cctv: "CCTV Monitoring", confiscation: "Confiscation of Item", search: "Room/Person Search",
  internet_monitoring: "Internet Monitoring/Filtering", curfew: "Curfew", geographic_restriction: "Geographic Restriction",
  contact_restriction: "Contact Restriction", other: "Other Restriction",
};

export type DoLLegalBasis = "care_plan" | "court_order" | "parental_consent" | "best_interests" | "risk_assessment" | "behaviour_support_plan";
export const DOL_LEGAL_BASIS_LABEL: Record<DoLLegalBasis, string> = {
  care_plan: "Care Plan", court_order: "Court Order", parental_consent: "Parental Consent",
  best_interests: "Best Interests", risk_assessment: "Risk Assessment", behaviour_support_plan: "Behaviour Support Plan",
};

export type DoLReviewStatus = "current" | "under_review" | "removed" | "expired" | "court_pending";
export const DOL_REVIEW_STATUS_LABEL: Record<DoLReviewStatus, string> = {
  current: "Current", under_review: "Under Review", removed: "Removed", expired: "Expired", court_pending: "Court Pending",
};

export interface DoLReviewHistoryEntry {
  date: string;
  outcome: string;
}

export interface DoLRecord {
  id: string;
  child_id: string;
  restriction_type: DoLRestrictionType;
  description: string;
  legal_basis: DoLLegalBasis;
  authorised_by_id: string;
  date_imposed: string;
  review_date: string;
  status: DoLReviewStatus;
  proportionate: boolean;
  necessary_justification: string;
  child_consulted: boolean;
  child_views: string;
  sw_consulted: boolean;
  sw_views: string;
  ilo_consulted: boolean;
  court_authorised: boolean;
  court_ref: string;
  alternatives_considered: string[];
  impact_on_child: string;
  review_history: DoLReviewHistoryEntry[];
  notes: string;
  created_at: string;
}

// device-policy
export type DevicePolicyDeviceType = "smartphone" | "tablet" | "laptop" | "games_console" | "smart_watch" | "other";
export const DEVICE_POLICY_DEVICE_TYPE_LABEL: Record<DevicePolicyDeviceType, string> = {
  smartphone: "Smartphone", tablet: "Tablet", laptop: "Laptop",
  games_console: "Games Console", smart_watch: "Smart Watch", other: "Other",
};

export type DevicePolicyAgreementStatus = "active" | "suspended" | "under_review" | "expired" | "not_signed";
export const DEVICE_POLICY_AGREEMENT_STATUS_LABEL: Record<DevicePolicyAgreementStatus, string> = {
  active: "Active", suspended: "Suspended", under_review: "Under Review", expired: "Expired", not_signed: "Not Signed",
};

export interface DevicePolicyScreenTimeRule { day: "weekday" | "weekend"; max_hours: number; start_time: string; end_time: string }
export interface DevicePolicyUsageLog { date: string; actual_hours: number; compliant: boolean; notes: string }
export interface DevicePolicyIncident { date: string; description: string; action_taken: string; restriction_applied: boolean }

export interface DevicePolicyRecord {
  id: string;
  child_id: string;
  device_type: DevicePolicyDeviceType;
  device_name: string;
  owned_by: "child" | "home" | "family";
  serial_number: string;
  parental_controls_enabled: boolean;
  parental_control_software: string;
  wifi_access: boolean;
  sim_card: boolean;
  agreement_signed: boolean;
  agreement_date: string | null;
  agreement_status: DevicePolicyAgreementStatus;
  screen_time_rules: DevicePolicyScreenTimeRule[];
  usage_log: DevicePolicyUsageLog[];
  incidents: DevicePolicyIncident[];
  restrictions: string[];
  social_media_permission: boolean;
  social_media_platforms: string[];
  social_worker_approval: boolean;
  nighttime_storage: string;
  review_date: string;
  notes: string;
  created_at: string;
}

// digital-literacy-skills
export type DigitalLiteracyDomain = "device_basics" | "email" | "word_processing" | "cloud_storage" | "online_banking" | "gov_uk_services" | "scam_awareness" | "password_hygiene" | "form_completion" | "job_applications" | "browsing_safely";
export const DIGITAL_LITERACY_DOMAIN_LABEL: Record<DigitalLiteracyDomain, string> = {
  device_basics: "Device Basics", email: "Email", word_processing: "Word Processing",
  cloud_storage: "Cloud Storage", online_banking: "Online Banking", gov_uk_services: "gov.uk Services",
  scam_awareness: "Scam Awareness", password_hygiene: "Password Hygiene", form_completion: "Form Completion",
  job_applications: "Job Applications", browsing_safely: "Browsing Safely",
};

export type DigitalLiteracyCompetency = "not_yet_introduced" | "aware" | "did_with_help" | "did_independently" | "confident";
export const DIGITAL_LITERACY_COMPETENCY_LABEL: Record<DigitalLiteracyCompetency, string> = {
  not_yet_introduced: "Not Yet Introduced", aware: "Aware", did_with_help: "Did with Help",
  did_independently: "Did Independently", confident: "Confident",
};

export interface DigitalLiteracySkillRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  domain: DigitalLiteracyDomain;
  competency: DigitalLiteracyCompetency;
  specific_skills: { skill: string; achieved: boolean }[];
  tools_used: string[];
  real_world_application: string[];
  child_voice: string;
  staff_observation: string;
  next_step: string;
  review_date: string;
  key_worker: string;
  notes: string;
  created_at: string;
}

// discharge
export type DischargeReason = "reunification" | "foster_care" | "other_residential" | "semi_independent" | "independent" | "adoption" | "age_18" | "placement_breakdown" | "secure_unit" | "other";
export const DISCHARGE_REASON_LABEL: Record<DischargeReason, string> = {
  reunification: "Return to Family", foster_care: "Foster Care",
  other_residential: "Other Residential", semi_independent: "Semi-Independent",
  independent: "Independent Living", adoption: "Adoption",
  age_18: "Aged Out (18+)", placement_breakdown: "Placement Breakdown",
  secure_unit: "Secure Unit", other: "Other",
};

export type DischargePlanStatus = "not_started" | "in_progress" | "on_track" | "at_risk" | "completed" | "cancelled";
export const DISCHARGE_PLAN_STATUS_LABEL: Record<DischargePlanStatus, string> = {
  not_started: "Not Started", in_progress: "In Progress", on_track: "On Track",
  at_risk: "At Risk", completed: "Completed", cancelled: "Cancelled",
};

export interface DischargeChecklistItem {
  id: string;
  task: string;
  category: string;
  completed: boolean;
  completed_date: string | null;
  completed_by: string | null;
  notes: string;
}

export interface DischargeTransitionAction {
  id: string;
  action: string;
  owner: string;
  due_date: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  notes: string;
}

export interface DischargeExitInterview {
  completed: boolean;
  date: string | null;
  conducted_by: string | null;
  child_views: string;
}

export interface DischargeRecord {
  id: string;
  child_id: string;
  reason: DischargeReason;
  status: DischargePlanStatus;
  planned_date: string;
  actual_date: string | null;
  destination: string;
  destination_address: string;
  receiving_provider: string | null;
  social_worker: string;
  social_worker_contact: string;
  key_worker: string;
  checklist: DischargeChecklistItem[];
  transition_actions: DischargeTransitionAction[];
  risk_assessment_completed: boolean;
  belongings_returned: boolean;
  belongings_witnessed: string | null;
  exit_interview: DischargeExitInterview;
  aftercare_provision: string[];
  stay_in_touch_plan: string;
  child_views: string;
  professional_views: string;
  notes: string;
  created_at: string;
}

// diversity-calendar
export type DiversityEventCategory = "religious" | "cultural" | "awareness" | "national" | "lgbtq_plus" | "disability";
export const DIVERSITY_EVENT_CATEGORY_LABEL: Record<DiversityEventCategory, string> = {
  religious: "Religious", cultural: "Cultural", awareness: "Awareness",
  national: "National", lgbtq_plus: "LGBTQ+", disability: "Disability",
};

export type DiversityEventStatus = "upcoming" | "completed" | "in_progress";
export const DIVERSITY_EVENT_STATUS_LABEL: Record<DiversityEventStatus, string> = {
  upcoming: "Upcoming", completed: "Completed", in_progress: "In Progress",
};

export interface DiversityCalendarEvent {
  id: string;
  name: string;
  date: string;
  date_range: string;
  category: DiversityEventCategory;
  description: string;
  how_we_mark_it: string;
  relevant_to_children: string;
  resources: string[];
  status: DiversityEventStatus;
  created_at: string;
}

// ── Batch 20 ──────────────────────────────────────────────────────────────────

// ── Document Expiry Tracker (home-level) ──

export type DocExpiryCategory = "staff_compliance" | "home_compliance" | "policy_review" | "vehicle" | "equipment";

export const DOC_EXPIRY_CATEGORY_LABEL: Record<DocExpiryCategory, string> = {
  staff_compliance: "Staff Compliance",
  home_compliance: "Home Compliance",
  policy_review: "Policy Review",
  vehicle: "Vehicle",
  equipment: "Equipment",
};

export type DocExpiryStatus = "current" | "expiring_soon" | "overdue" | "renewed";

export const DOC_EXPIRY_STATUS_LABEL: Record<DocExpiryStatus, string> = {
  current: "Current",
  expiring_soon: "Expiring Soon",
  overdue: "Overdue",
  renewed: "Renewed",
};

export interface TrackedDocument {
  id: string;
  title: string;
  category: DocExpiryCategory;
  related_to: string | null;
  issued_date: string | null;
  expiry_date: string;
  renewal_lead_time: number;
  status: DocExpiryStatus;
  renewal_owner: string;
  notes: string;
  last_renewed: string | null;
  created_at: string;
}

// ── Driving Lessons Tracker (child-level) ──

export type DrivingStage =
  | "awaiting_17th_birthday"
  | "provisional_applied"
  | "provisional_held"
  | "theory_studying"
  | "theory_passed"
  | "practical_lessons"
  | "practical_booked"
  | "practical_passed"
  | "full_licence";

export const DRIVING_STAGE_LABEL: Record<DrivingStage, string> = {
  awaiting_17th_birthday: "Awaiting 17th birthday",
  provisional_applied: "Provisional applied",
  provisional_held: "Provisional held",
  theory_studying: "Theory studying",
  theory_passed: "Theory passed",
  practical_lessons: "Practical lessons",
  practical_booked: "Practical booked",
  practical_passed: "Practical passed",
  full_licence: "Full licence",
};

export type DrivingFundingSource = "leaving_care_grant" | "pocket_money" | "family_contribution" | "mixed";

export const DRIVING_FUNDING_SOURCE_LABEL: Record<DrivingFundingSource, string> = {
  leaving_care_grant: "Leaving Care Grant",
  pocket_money: "Pocket money",
  family_contribution: "Family contribution",
  mixed: "Mixed",
};

export type DrivingTestResult = "pass" | "fail";

export interface DrivingTheoryAttempt {
  date: string;
  result: DrivingTestResult;
  score?: string;
}

export interface DrivingPracticalAttempt {
  date: string;
  result: DrivingTestResult;
  faults?: string;
}

export interface DrivingRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  stage: DrivingStage;
  provisional_number?: string;
  theory_attempts: DrivingTheoryAttempt[];
  practical_attempts: DrivingPracticalAttempt[];
  lessons_booked_total: number;
  lessons_completed_total: number;
  hours_logged: number;
  hourly_rate: number;
  cost_so_far: number;
  funding_source: DrivingFundingSource;
  instructor?: string;
  next_lesson?: string;
  child_voice: string;
  staff_observation: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Drug and Alcohol Screening (child-level) ──

export type ScreeningTool = "crafft" | "internal_brief_screen" | "conversation_based" | "audit_c_older";

export const SCREENING_TOOL_LABEL: Record<ScreeningTool, string> = {
  crafft: "CRAFFT",
  internal_brief_screen: "Internal Brief Screen",
  conversation_based: "Conversation-based",
  audit_c_older: "AUDIT-C (older)",
};

export type SubstanceRiskLevel =
  | "no_identified_risk"
  | "awareness_only"
  | "low_risk"
  | "medium_risk"
  | "high_risk"
  | "active_concern";

export const SUBSTANCE_RISK_LEVEL_LABEL: Record<SubstanceRiskLevel, string> = {
  no_identified_risk: "No identified risk",
  awareness_only: "Awareness only",
  low_risk: "Low risk",
  medium_risk: "Medium risk",
  high_risk: "High risk",
  active_concern: "Active concern",
};

export interface SubstanceScreening {
  id: string;
  child_id: string;
  screening_date: string;
  conducted_by: string;
  screening_tool: ScreeningTool;
  risk_level: SubstanceRiskLevel;
  substances_identified: string[];
  context_of_use: string;
  peer_influences: string;
  family_history: string;
  education_provided: string[];
  harm_reduction_approach: string[];
  professional_support_in_place: string[];
  child_insight: string;
  child_motivation: string;
  warning_signs_to_watch: string[];
  review_schedule: string;
  escalation_criteria: string[];
  next_screening_date: string;
  confidentiality_framing: string;
  shared_with_social_worker: boolean;
  shared_with_camhs: boolean;
  child_authored: boolean;
  created_at: string;
}

// ── Duty Log (home-level) ──

export type DutyLogShift = "morning" | "afternoon" | "evening" | "night" | "sleep_in";

export const DUTY_LOG_SHIFT_LABEL: Record<DutyLogShift, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
  sleep_in: "Sleep-In",
};

export type DutyLogCategory =
  | "incident"
  | "visitor"
  | "phone_call"
  | "maintenance"
  | "staff_change"
  | "welfare"
  | "medication"
  | "safeguarding"
  | "routine"
  | "handover"
  | "complaint"
  | "positive";

export const DUTY_LOG_CATEGORY_LABEL: Record<DutyLogCategory, string> = {
  incident: "Incident",
  visitor: "Visitor",
  phone_call: "Phone Call",
  maintenance: "Maintenance",
  staff_change: "Staff Change",
  welfare: "Welfare",
  medication: "Medication",
  safeguarding: "Safeguarding",
  routine: "Routine",
  handover: "Handover",
  complaint: "Complaint",
  positive: "Positive",
};

export type DutyLogPriority = "routine" | "important" | "urgent" | "critical";

export const DUTY_LOG_PRIORITY_LABEL: Record<DutyLogPriority, string> = {
  routine: "Routine",
  important: "Important",
  urgent: "Urgent",
  critical: "Critical",
};

export interface DutyLogEntry {
  id: string;
  date: string;
  time: string;
  shift: DutyLogShift;
  recorded_by: string;
  category: DutyLogCategory;
  priority: DutyLogPriority;
  young_person_ids: string[];
  description: string;
  action_taken: string;
  follow_up_required: boolean;
  follow_up_notes: string;
  manager_notified: boolean;
  linked_records: string[];
  witnessed_by: string | null;
  signed_off: boolean;
  signed_off_by: string | null;
  created_at: string;
}

// ── Eating Support Plan (child-level) ──

export type EatingPresentation =
  | "arfid"
  | "sensory_led_restriction"
  | "disordered_eating_restrictive"
  | "disordered_eating_binge_pattern"
  | "cultural_faith_dietary_needs"
  | "allergy_medical"
  | "recovery_post_diagnosis"
  | "healthy_relationship_preventive"
  | "multiple_presentations";

export const EATING_PRESENTATION_LABEL: Record<EatingPresentation, string> = {
  arfid: "ARFID",
  sensory_led_restriction: "Sensory-led restriction",
  disordered_eating_restrictive: "Disordered eating — restrictive",
  disordered_eating_binge_pattern: "Disordered eating — binge pattern",
  cultural_faith_dietary_needs: "Cultural/faith dietary needs",
  allergy_medical: "Allergy/medical",
  recovery_post_diagnosis: "Recovery — post diagnosis",
  healthy_relationship_preventive: "Healthy relationship — preventive",
  multiple_presentations: "Multiple presentations",
};

export interface EatingExternalSupport {
  agency: string;
  clinician: string;
  frequency: string;
}

export interface EatingSupportPlan {
  id: string;
  child_id: string;
  plan_date: string;
  presentation: EatingPresentation;
  external_support: EatingExternalSupport[];
  safe_foods: string[];
  challenge_foods: string[];
  textures_preferred: string[];
  textures_avoided: string[];
  brands_that_work: string[];
  triggers_to_avoid: string[];
  meal_time_approach: string[];
  eating_environment_set_up: string[];
  staff_do_strategies: string[];
  staff_do_not_strategies: string[];
  weight_monitoring_frequency?: string;
  hydration_notes?: string;
  growth_check_notes?: string;
  child_voice: string;
  staff_observation: string;
  child_chose: boolean;
  flags_for_review: string[];
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Education Attendance Tracker (child-level) ──

export type EduProvision = "school" | "college" | "pru" | "ap" | "eotas";

export const EDU_PROVISION_LABEL: Record<EduProvision, string> = {
  school: "School",
  college: "College",
  pru: "PRU",
  ap: "Alternative Provision",
  eotas: "EOTAS",
};

export type EduSession = "am" | "pm" | "full_day";

export const EDU_SESSION_LABEL: Record<EduSession, string> = {
  am: "AM",
  pm: "PM",
  full_day: "Full Day",
};

export type EduAttendanceCode = "/" | "\\" | "L" | "U" | "N" | "O" | "I" | "M" | "E";

export interface EduAttendanceRecord {
  id: string;
  date: string;
  child_id: string;
  provision: EduProvision;
  session: EduSession;
  attendance_code: EduAttendanceCode;
  code_meaning: string;
  arrival_time: string;
  departure_time: string;
  reason: string;
  authorised_absence: boolean;
  interventions_used: string[];
  recorded_by: string;
  notes: string;
  created_at: string;
}

// ── Batch 21 ──

// ── EHCP Tracker (child-level) ──

export type EhcpPlanStatus =
  | "pre_assessment"
  | "needs_assessment_in_progress"
  | "final_plan_in_place"
  | "annual_review_due"
  | "refused";

export const EHCP_PLAN_STATUS_LABEL: Record<EhcpPlanStatus, string> = {
  pre_assessment: "Pre-assessment",
  needs_assessment_in_progress: "Needs Assessment in progress",
  final_plan_in_place: "Final Plan in place",
  annual_review_due: "Annual Review due",
  refused: "Refused",
};

export interface EhcpProvision {
  section: string;
  provision: string;
  frequency: string;
  provider: string;
}

export interface EhcpRecord {
  id: string;
  child_id: string;
  plan_status: EhcpPlanStatus;
  plan_version: string;
  date_of_plan: string;
  last_annual_review_date: string;
  next_annual_review_due: string;
  primary_need: string;
  secondary_needs: string[];
  placement: string;
  section_a: string;
  section_b: string;
  section_d: string;
  section_e: string;
  provisions_listed: EhcpProvision[];
  funding: string;
  local_authority: string;
  sendo_officer: string;
  transition_planning: string;
  child_contribution: string;
  parental_involvement: string;
  reviewed_by: string;
  outstanding_actions: string[];
  created_at: string;
}

// ── Emergency Contacts (child-level — per-child contacts only) ──

export type EmergencyContactRole =
  | "social_worker"
  | "iro"
  | "parent_carer"
  | "school"
  | "gp"
  | "dentist"
  | "camhs"
  | "other";

export const EMERGENCY_CONTACT_ROLE_LABEL: Record<EmergencyContactRole, string> = {
  social_worker: "Social Worker",
  iro: "IRO",
  parent_carer: "Parent / Carer",
  school: "School",
  gp: "GP",
  dentist: "Dentist",
  camhs: "CAMHS",
  other: "Other",
};

export interface EmergencyChildContact {
  id: string;
  child_id: string;
  role: EmergencyContactRole;
  name: string;
  organisation?: string;
  phone: string;
  secondary_phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
}

// ── Emergency Evacuation Plan (home-level) ──

export type EvacuationScenarioType =
  | "fire"
  | "gas_leak"
  | "water_leak_flood"
  | "power_failure"
  | "intruder_lockdown"
  | "bomb_threat"
  | "carbon_monoxide"
  | "structural_collapse"
  | "severe_weather";

export const EVACUATION_SCENARIO_TYPE_LABEL: Record<EvacuationScenarioType, string> = {
  fire: "Fire",
  gas_leak: "Gas Leak",
  water_leak_flood: "Water Leak/Flood",
  power_failure: "Power Failure",
  intruder_lockdown: "Intruder/Lockdown",
  bomb_threat: "Bomb Threat",
  carbon_monoxide: "Carbon Monoxide",
  structural_collapse: "Structural Collapse",
  severe_weather: "Severe Weather",
};

export interface EvacuationStaffRole {
  role: string;
  staff_position: string;
  tasks: string[];
}

export interface EvacuationChildConsideration {
  young_person: string;
  special_needs: string;
}

export interface EvacuationEmergencyContact {
  contact: string;
  number: string;
  when: string;
}

export interface EvacuationPlan {
  id: string;
  scenario_name: string;
  scenario_type: EvacuationScenarioType;
  trigger_criteria: string[];
  primary_evacuation_route: string;
  secondary_evacuation_route: string;
  assembly_point: string;
  alternative_assembly_point: string;
  roles_by_staff: EvacuationStaffRole[];
  child_specific_considerations: EvacuationChildConsideration[];
  evacuation_order: string[];
  documents_to_take: string[];
  items_not_to_take_back: string[];
  emergency_contacts: EvacuationEmergencyContact[];
  roll_call_procedure: string;
  reentry_process: string;
  post_incident_care: string[];
  child_preparation: string;
  drill_frequency: string;
  last_drill_date: string;
  next_drill_due: string;
  reviewed_date: string;
  reviewed_by: string;
  approved_by_fire_officer: boolean;
  created_at: string;
}

// ── Emergency Medication Protocols (child-level) ──

export type EmergencyMedTrigger =
  | "asthma_attack"
  | "anaphylaxis"
  | "seizure"
  | "hypoglycaemia"
  | "severe_allergic_reaction"
  | "mental_health_crisis";

export const EMERGENCY_MED_TRIGGER_LABEL: Record<EmergencyMedTrigger, string> = {
  asthma_attack: "Asthma Attack",
  anaphylaxis: "Anaphylaxis",
  seizure: "Seizure",
  hypoglycaemia: "Hypoglycaemia",
  severe_allergic_reaction: "Severe Allergic Reaction",
  mental_health_crisis: "Mental Health Crisis",
};

export interface EmergencyMedicationProtocol {
  id: string;
  child_id: string;
  condition: string;
  trigger: EmergencyMedTrigger;
  emergency_medication: string;
  spare_epi_pen_locations: string[];
  recognise_symptoms: string[];
  step_by_step_procedure: string[];
  when_to_call_999: string;
  when_to_call_gp: string;
  position_of_patient: string;
  aftercare: string[];
  staff_trained_to_administer: string[];
  child_can_self_administer: boolean;
  child_recognises_symptoms: boolean;
  school_and_community_provision: string;
  medication_locations: string[];
  expiry_check_schedule: string;
  last_review_date: string;
  reviewed_by: string;
  next_review_due: string;
  signed_off_by_gp: boolean;
  child_informed: boolean;
  created_at: string;
}

// ── Emergency Placements (home-level) ──

export type EmergencyPlacementStatus = "accepted_emergency" | "declined" | "pending_capacity";

export const EMERGENCY_PLACEMENT_STATUS_LABEL: Record<EmergencyPlacementStatus, string> = {
  accepted_emergency: "Accepted (Emergency)",
  declined: "Declined",
  pending_capacity: "Pending Capacity",
};

export type EmergencyPlacementContactMethod = "phone" | "email";

export const EMERGENCY_PLACEMENT_CONTACT_METHOD_LABEL: Record<EmergencyPlacementContactMethod, string> = {
  phone: "Phone",
  email: "Email",
};

export type EmergencyPlacementUrgency = "immediate" | "same_day" | "24_hours";

export const EMERGENCY_PLACEMENT_URGENCY_LABEL: Record<EmergencyPlacementUrgency, string> = {
  immediate: "Immediate",
  same_day: "Same Day",
  "24_hours": "Within 24h",
};

export interface EmergencyReferral {
  id: string;
  child_ref: string;
  age: number;
  gender: string;
  request_time: string;
  request_date: string;
  requesting_authority: string;
  contact_person: string;
  contact_method: EmergencyPlacementContactMethod;
  reason: string;
  urgency_level: EmergencyPlacementUrgency;
  status: EmergencyPlacementStatus;
  responded_by: string;
  response_time: number;
  decline_reason: string | null;
  admission_date: string | null;
  notes: string;
  out_of_hours: boolean;
  created_at: string;
}

// ── Emergency Planning (home-level) ──

export type EmergencyPlanType =
  | "fire_evacuation"
  | "power_failure"
  | "flood_water_damage"
  | "infectious_disease"
  | "serious_incident";

export const EMERGENCY_PLAN_TYPE_LABEL: Record<EmergencyPlanType, string> = {
  fire_evacuation: "Fire Evacuation",
  power_failure: "Power Failure",
  flood_water_damage: "Flood / Water Damage",
  infectious_disease: "Infectious Disease Outbreak",
  serious_incident: "Serious Incident",
};

export type EmergencyPlanStatus = "current" | "review_due" | "draft";

export const EMERGENCY_PLAN_STATUS_LABEL: Record<EmergencyPlanStatus, string> = {
  current: "Current",
  review_due: "Review Due",
  draft: "Draft",
};

export interface EmergencyPlanContactSequence {
  who: string;
  number: string;
  when: string;
}

export interface EmergencyPlan {
  id: string;
  title: string;
  plan_type: EmergencyPlanType;
  colour: string;
  scenario: string;
  immediate_actions: string[];
  contact_sequence: EmergencyPlanContactSequence[];
  evacuation_required: boolean;
  assembly_point: string | null;
  child_considerations: string[];
  staff_roles: string[];
  equipment_needed: string[];
  recovery_actions: string[];
  last_tested: string;
  next_test: string;
  status: EmergencyPlanStatus;
  created_at: string;
}

// ── Batch 22 ──

// ── Emergency Protocol Drills (home-level) ──

export type DrillScenarioType =
  | "missing_child"
  | "medical_emergency"
  | "power_failure"
  | "intruder_alert"
  | "flooding"
  | "evacuation"
  | "medication_error_response";

export const DRILL_SCENARIO_TYPE_LABEL: Record<DrillScenarioType, string> = {
  missing_child: "Missing Child",
  medical_emergency: "Medical Emergency",
  power_failure: "Power Failure",
  intruder_alert: "Intruder Alert",
  flooding: "Flooding",
  evacuation: "Evacuation",
  medication_error_response: "Medication Error Response",
};

export type DrillOutcome = "satisfactory" | "needs_improvement" | "failed";

export const DRILL_OUTCOME_LABEL: Record<DrillOutcome, string> = {
  satisfactory: "Satisfactory",
  needs_improvement: "Needs Improvement",
  failed: "Failed",
};

export interface ProtocolDrill {
  id: string;
  date: string;
  scenario_type: DrillScenarioType;
  scenario_description: string;
  lead_by: string;
  participants: string[];
  response_time_minutes: number;
  protocol_followed: boolean;
  deviations: string;
  learning_points: string[];
  actions_required: string[];
  outcome: DrillOutcome;
  next_drill_due: string;
  linked_protocol: string;
  created_at: string;
}

// ── Emotional Vocabulary Coaching (child-level) ──

export type EmotionalFramework =
  | "zones_of_regulation"
  | "feelings_wheel_plutchik"
  | "ruler"
  | "how_are_you_feeling_today"
  | "bespoke"
  | "mixed";

export const EMOTIONAL_FRAMEWORK_LABEL: Record<EmotionalFramework, string> = {
  zones_of_regulation: "Zones of Regulation",
  feelings_wheel_plutchik: "Feelings Wheel (Plutchik)",
  ruler: "RULER",
  how_are_you_feeling_today: "How Are You Feeling Today",
  bespoke: "Bespoke",
  mixed: "Mixed",
};

export interface EmotionalBreakthrough {
  date: string;
  description: string;
}

export interface EmotionalVocabRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  starting_position: string;
  feelings_recognised: string[];
  feelings_learning_now: string[];
  confusions_common: string[];
  tools_in_use: string[];
  framework: EmotionalFramework;
  breakthroughs: EmotionalBreakthrough[];
  prefers_spoken: boolean;
  prefers_written: boolean;
  prefers_visual: boolean;
  prefers_body_mapping: boolean;
  staff_phrasing_tips: string[];
  child_voice: string;
  staff_observation: string;
  next_step: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Environmental Risk (home-level) ──

export type EnvRiskCategory =
  | "building"
  | "garden_grounds"
  | "kitchen"
  | "bathroom"
  | "bedroom"
  | "communal"
  | "external_area"
  | "vehicle"
  | "equipment"
  | "chemical_hazard";

export const ENV_RISK_CATEGORY_LABEL: Record<EnvRiskCategory, string> = {
  building: "Building",
  garden_grounds: "Garden & Grounds",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  bedroom: "Bedroom",
  communal: "Communal Area",
  external_area: "External Area",
  vehicle: "Vehicle",
  equipment: "Equipment",
  chemical_hazard: "Chemical / COSHH",
};

export type EnvRiskLevel = "low" | "medium" | "high" | "critical";

export const ENV_RISK_LEVEL_LABEL: Record<EnvRiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export type EnvAssessmentStatus = "current" | "due_review" | "overdue" | "archived";

export const ENV_ASSESSMENT_STATUS_LABEL: Record<EnvAssessmentStatus, string> = {
  current: "Current",
  due_review: "Due Review",
  overdue: "Overdue",
  archived: "Archived",
};

export interface EnvRiskControl {
  measure: string;
  implemented_by: string;
  date_implemented: string;
  effective: boolean;
}

export interface EnvironmentalRisk {
  id: string;
  category: EnvRiskCategory;
  location: string;
  hazard: string;
  who_at_risk: string[];
  risk_level: EnvRiskLevel;
  residual_risk: EnvRiskLevel;
  status: EnvAssessmentStatus;
  assessed_by: string;
  assessment_date: string;
  review_date: string;
  controls: EnvRiskControl[];
  additional_actions: string[];
  incident_history: string;
  notes: string;
  created_at: string;
}

// ── Exploitation Screening (child-level) ──

export type ExploitationType =
  | "cse"
  | "cce"
  | "county_lines"
  | "radicalisation"
  | "modern_slavery"
  | "online_exploitation"
  | "peer_on_peer";

export const EXPLOITATION_TYPE_LABEL: Record<ExploitationType, string> = {
  cse: "Child Sexual Exploitation",
  cce: "Child Criminal Exploitation",
  county_lines: "County Lines",
  radicalisation: "Radicalisation / Prevent",
  modern_slavery: "Modern Slavery / Trafficking",
  online_exploitation: "Online Exploitation",
  peer_on_peer: "Peer-on-Peer Abuse",
};

export type ExploitationRiskLevel = "low" | "medium" | "high" | "very_high";

export const EXPLOITATION_RISK_LEVEL_LABEL: Record<ExploitationRiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  very_high: "Very High",
};

export type ExploitationScreeningStatus =
  | "initial_screening"
  | "assessment_in_progress"
  | "referred"
  | "monitoring"
  | "nrm_submitted"
  | "closed"
  | "de_escalated";

export const EXPLOITATION_SCREENING_STATUS_LABEL: Record<ExploitationScreeningStatus, string> = {
  initial_screening: "Initial Screening",
  assessment_in_progress: "Assessment in Progress",
  referred: "Referred",
  monitoring: "Monitoring",
  nrm_submitted: "NRM Submitted",
  closed: "Closed",
  de_escalated: "De-escalated",
};

export interface ExploitationRiskIndicator {
  indicator: string;
  present: boolean;
  notes: string;
}

export interface ExploitationScreening {
  id: string;
  date: string;
  review_date: string;
  completed_by: string;
  child_id: string;
  exploitation_type: ExploitationType;
  risk_level: ExploitationRiskLevel;
  previous_risk_level: ExploitationRiskLevel | null;
  status: ExploitationScreeningStatus;
  risk_indicators: ExploitationRiskIndicator[];
  protective_factors: string[];
  vulnerabilities: string[];
  contextual_factors: string;
  associates_of_concern: string;
  locations_concern: string;
  online_risks: string;
  safeguarding_actions: string[];
  multi_agency_involved: string[];
  nrm_referral: boolean;
  nrm_ref: string | null;
  nrm_outcome: string | null;
  police_ref: string | null;
  social_worker_notified: boolean;
  safety_plan: string;
  direct_work: string;
  management_oversight: string;
  next_review_date: string;
  created_at: string;
}

// ── External Visitor Log (home-level) ──

export type VisitorType =
  | "professional"
  | "volunteer"
  | "contractor"
  | "inspector"
  | "family_of_staff"
  | "tradesperson"
  | "researcher"
  | "friend_of_child";

export const VISITOR_TYPE_LABEL: Record<VisitorType, string> = {
  professional: "Professional",
  volunteer: "Volunteer",
  contractor: "Contractor",
  inspector: "Inspector",
  family_of_staff: "Family of Staff",
  tradesperson: "Tradesperson",
  researcher: "Researcher",
  friend_of_child: "Friend of Child",
};

export type VisitPurposeCategory =
  | "care_therapy"
  | "maintenance"
  | "inspection"
  | "education"
  | "family"
  | "activity"
  | "delivery"
  | "health";

export const VISIT_PURPOSE_CATEGORY_LABEL: Record<VisitPurposeCategory, string> = {
  care_therapy: "Care/Therapy",
  maintenance: "Maintenance",
  inspection: "Inspection",
  education: "Education",
  family: "Family",
  activity: "Activity",
  delivery: "Delivery",
  health: "Health",
};

export interface ExternalVisitor {
  id: string;
  date: string;
  arrival_time: string;
  departure_time: string;
  visitor_name: string;
  visitor_organisation: string;
  visitor_role: string;
  visitor_type: VisitorType;
  purpose_of_visit: string;
  purpose_category: VisitPurposeCategory;
  authorised_by: string;
  host_staff: string;
  id_checked: boolean;
  dbs_checked: boolean;
  dbs_required: boolean;
  signed_nda: boolean;
  signed_safeguarding: boolean;
  children_interacted_with: string[];
  unsupervised_access: boolean;
  areas_accessed: string[];
  signed_in: boolean;
  signed_out: boolean;
  badge_issued: boolean;
  feedback: string;
  concerns_raised: string[];
  notes: string;
  created_at: string;
}

// ── Family Time Supervision (child-level) ──

export type FamilyTimeLocation =
  | "oak_house"
  | "family_home"
  | "contact_centre"
  | "public_venue";

export const FAMILY_TIME_LOCATION_LABEL: Record<FamilyTimeLocation, string> = {
  oak_house: "Chamberlain House",
  family_home: "Family Home",
  contact_centre: "Contact Centre",
  public_venue: "Public Venue",
};

export type FamilyTimeSupervisionLevel = "supervised" | "supported" | "unsupervised";

export const FAMILY_TIME_SUPERVISION_LEVEL_LABEL: Record<FamilyTimeSupervisionLevel, string> = {
  supervised: "Supervised",
  supported: "Supported",
  unsupervised: "Unsupervised",
};

export type FamilyTimePresentation = "settled" | "anxious" | "excited" | "withdrawn" | "resistant";

export const FAMILY_TIME_PRESENTATION_LABEL: Record<FamilyTimePresentation, string> = {
  settled: "Settled",
  anxious: "Anxious",
  excited: "Excited",
  withdrawn: "Withdrawn",
  resistant: "Resistant",
};

export interface FamilyTimeSession {
  id: string;
  child_id: string;
  date: string;
  time: string;
  duration_minutes: number;
  location: FamilyTimeLocation;
  family_member: string;
  family_member_name: string;
  supervised_by: string;
  supervision_level: FamilyTimeSupervisionLevel;
  child_presentation_before: FamilyTimePresentation;
  child_presentation_during: string;
  child_presentation_after: string;
  interactions_observed: string;
  warmth_affection_shown: string;
  boundary_issues: string;
  concerns_raised: string[];
  positive_observations: string[];
  child_voice_after: string;
  parent_engagement: string;
  gifts_exchanged: string;
  food_shared_who: string;
  was_it_safe: boolean;
  incidents_during: string;
  recommendations_for_next: string[];
  report_sent_to_sw: boolean;
  report_sent_date: string;
  created_at: string;
}

// ── Batch 23 ──

// ── Family Tree / Genogram (child-level) ──

export type FamilyContactStatus = "active" | "letterbox_only" | "no_contact" | "restricted" | "indirect";

export const FAMILY_CONTACT_STATUS_LABEL: Record<FamilyContactStatus, string> = {
  active: "Active",
  letterbox_only: "Letterbox Only",
  no_contact: "No Contact",
  restricted: "Restricted",
  indirect: "Indirect",
};

export type FamilyMemberStatus = "living" | "deceased" | "unknown";

export const FAMILY_MEMBER_STATUS_LABEL: Record<FamilyMemberStatus, string> = {
  living: "Living",
  deceased: "Deceased",
  unknown: "Unknown",
};

export interface GenogramImmediateFamily {
  relation: string;
  name: string;
  status: FamilyMemberStatus;
  contact_status: FamilyContactStatus;
  safeguarding_notes: string;
}

export interface GenogramExtendedFamily {
  relation: string;
  name: string;
  significance: string;
  contact_status: string;
}

export interface GenogramImportantAdult {
  name: string;
  role: string;
  significance: string;
  ongoing: boolean;
}

export interface GenogramSignificantPlace {
  place: string;
  significance: string;
}

export interface GenogramSiblingRelationship {
  sibling: string;
  relationship: string;
  current_situation: string;
}

export interface GenogramEntry {
  id: string;
  child_id: string;
  generations_represented: string[];
  immediate_family: GenogramImmediateFamily[];
  extended_family: GenogramExtendedFamily[];
  important_non_family_adults: GenogramImportantAdult[];
  significant_places: GenogramSignificantPlace[];
  past_sibling_relationships: GenogramSiblingRelationship[];
  estranged_relationships: string[];
  family_myths: string;
  child_knows_the_story: string;
  age_appropriate_summary: string;
  contact_directory_link: string;
  identity_impact: string;
  protective_relationships: string[];
  risk_relationships: string[];
  child_input_provided: boolean;
  child_age_when_created: number;
  last_updated_date: string;
  reviewed_by: string;
  sensitive_content: boolean;
  shareable_with: string[];
  created_at: string;
}

// ── Fire Risk Assessment (home-level) ──

export type FireRiskCategory = "fire_spread" | "means_of_escape" | "detection" | "suppression" | "human_factors" | "storage";

export const FIRE_RISK_CATEGORY_LABEL: Record<FireRiskCategory, string> = {
  fire_spread: "Fire Spread",
  means_of_escape: "Means of Escape",
  detection: "Detection",
  suppression: "Suppression",
  human_factors: "Human Factors",
  storage: "Storage",
};

export type FireRiskLevel = "low" | "medium" | "high";

export const FIRE_RISK_LEVEL_LABEL: Record<FireRiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export type FireRiskStatus = "implemented" | "in_progress" | "outstanding";

export const FIRE_RISK_STATUS_LABEL: Record<FireRiskStatus, string> = {
  implemented: "Implemented",
  in_progress: "In Progress",
  outstanding: "Outstanding",
};

export interface FireRiskItem {
  id: string;
  area: string;
  risk_category: FireRiskCategory;
  hazard_identified: string;
  current_controls: string[];
  residual_risk_level: FireRiskLevel;
  people_at_risk: string[];
  additional_controls_required: string[];
  responsible_owner: string;
  target_completion_date: string;
  status: FireRiskStatus;
  last_review_date: string;
  next_review_date: string;
  assessed_by: string;
  created_at: string;
}

// ── Fire Safety Equipment Checks (home-level) ──

export type FireEquipmentType = "fire_extinguisher" | "smoke_detector" | "heat_detector" | "carbon_monoxide_detector" | "fire_alarm_panel" | "emergency_lighting" | "fire_door" | "fire_blanket" | "fire_exit_signage" | "sprinkler";

export const FIRE_EQUIPMENT_TYPE_LABEL: Record<FireEquipmentType, string> = {
  fire_extinguisher: "Fire Extinguisher",
  smoke_detector: "Smoke Detector",
  heat_detector: "Heat Detector",
  carbon_monoxide_detector: "Carbon Monoxide Detector",
  fire_alarm_panel: "Fire Alarm Panel",
  emergency_lighting: "Emergency Lighting",
  fire_door: "Fire Door",
  fire_blanket: "Fire Blanket",
  fire_exit_signage: "Fire Exit Signage",
  sprinkler: "Sprinkler",
};

export type FireInspectionType = "weekly_visual" | "monthly_test" | "quarterly_service" | "annual_certified" | "five_year_hydraulic_test";

export const FIRE_INSPECTION_TYPE_LABEL: Record<FireInspectionType, string> = {
  weekly_visual: "Weekly Visual",
  monthly_test: "Monthly Test",
  quarterly_service: "Quarterly Service",
  annual_certified: "Annual Certified",
  five_year_hydraulic_test: "5-Year Hydraulic Test",
};

export type FireCheckResult = "pass" | "pass_with_notes" | "fail_repaired" | "fail_replaced";

export const FIRE_CHECK_RESULT_LABEL: Record<FireCheckResult, string> = {
  pass: "Pass",
  pass_with_notes: "Pass with Notes",
  fail_repaired: "Fail - Repaired",
  fail_replaced: "Fail - Replaced",
};

export type FireComplianceStatus = "compliant" | "due_now" | "overdue" | "booked";

export const FIRE_COMPLIANCE_STATUS_LABEL: Record<FireComplianceStatus, string> = {
  compliant: "Compliant",
  due_now: "Due Now",
  overdue: "Overdue",
  booked: "Booked",
};

export interface FireEquipmentCheck {
  id: string;
  equipment_type: FireEquipmentType;
  location: string;
  identifier_tag: string;
  last_inspected_date: string;
  inspection_type: FireInspectionType;
  inspector: string;
  external_contractor: string;
  result: FireCheckResult;
  defect_noted: string;
  action_taken: string;
  certificate_ref: string;
  next_inspection_due: string;
  compliance_status: FireComplianceStatus;
  last_battery_change_date: string;
  notes: string;
  created_at: string;
}

// ── First Aiders Roster (home-level) ──

export type FirstAidCertType = "paediatric_first_aid" | "emergency_first_aid_at_work" | "first_aid_at_work" | "aed_defib" | "anaphylaxis_bsaci" | "mental_health_first_aid" | "specific_medical";

export const FIRST_AID_CERT_TYPE_LABEL: Record<FirstAidCertType, string> = {
  paediatric_first_aid: "Paediatric First Aid (12hr)",
  emergency_first_aid_at_work: "Emergency First Aid at Work (1 day)",
  first_aid_at_work: "First Aid at Work (3 day)",
  aed_defib: "AED/Defib",
  anaphylaxis_bsaci: "Anaphylaxis (BSACI)",
  mental_health_first_aid: "Mental Health First Aid",
  specific_medical: "Specific Medical (e.g., Insulin)",
};

export type FirstAidCertStatus = "in_date" | "expiring_soon" | "expired" | "renewal_booked";

export const FIRST_AID_CERT_STATUS_LABEL: Record<FirstAidCertStatus, string> = {
  in_date: "In Date",
  expiring_soon: "Expiring Soon (60d)",
  expired: "Expired",
  renewal_booked: "Renewal Booked",
};

export interface FirstAidCertification {
  type: FirstAidCertType;
  issued_date: string;
  expiry_date: string;
  provider: string;
  status: FirstAidCertStatus;
  renewal_booked?: string;
}

export interface FirstAiderRecord {
  id: string;
  staff_id: string;
  certifications: FirstAidCertification[];
  primary_shift_pattern: string;
  is_current_lead_first_aider: boolean;
  home_roles_covered: string[];
  notes?: string;
  review_date: string;
  created_at: string;
}

// ── Food Budget Tracker (home-level) ──

export interface FoodBudgetSpendItem {
  category: string;
  amount: number;
  supplier: string;
  receipt_kept: boolean;
}

export interface FoodBudgetTreatItem {
  date: string;
  item: string;
  cost: number;
  reason: string;
}

export interface FoodBudgetWeekRecord {
  id: string;
  week_starting: string;
  weekly_budget: number;
  spend: FoodBudgetSpendItem[];
  total_spent: number;
  variance: number;
  child_involvement_in_planning: string;
  child_involvement_in_shopping: string;
  cultural_ingredients_included: boolean;
  sensory_friendly_options_included: boolean;
  takeaways_or_treats: FoodBudgetTreatItem[];
  cook_from_scratch_proportion: number;
  waste_noted: string;
  shopped_by: string;
  cooked_by: string;
  child_meal_requests_honoured: string[];
  notes: string;
  created_at: string;
}

// ── Food Hygiene (home-level) ──

export type FoodHygieneCheckType = "fridge_temp" | "freezer_temp" | "cooking_temp" | "cleaning_record" | "allergen_check" | "delivery_check" | "date_label_check" | "deep_clean" | "pest_check" | "hand_hygiene_audit";

export const FOOD_HYGIENE_CHECK_TYPE_LABEL: Record<FoodHygieneCheckType, string> = {
  fridge_temp: "Fridge Temperature",
  freezer_temp: "Freezer Temperature",
  cooking_temp: "Cooking Temperature",
  cleaning_record: "Cleaning Record",
  allergen_check: "Allergen Check",
  delivery_check: "Delivery Check",
  date_label_check: "Date Label Check",
  deep_clean: "Deep Clean",
  pest_check: "Pest Inspection",
  hand_hygiene_audit: "Hand Hygiene Audit",
};

export type FoodHygieneCompliance = "pass" | "fail" | "action_required" | "n_a";

export const FOOD_HYGIENE_COMPLIANCE_LABEL: Record<FoodHygieneCompliance, string> = {
  pass: "Pass",
  fail: "Fail",
  action_required: "Action Required",
  n_a: "N/A",
};

export interface FoodHygieneRecord {
  id: string;
  date: string;
  time: string;
  checked_by: string;
  check_type: FoodHygieneCheckType;
  compliance: FoodHygieneCompliance;
  temperature: number | null;
  target_min: number | null;
  target_max: number | null;
  area: string;
  details: string;
  action_required: string;
  action_completed: boolean;
  action_completed_date: string | null;
  next_due_date: string;
  created_at: string;
}

// ── Batch 24 ──

// ── Friendship Mapping (child-level) ──

export type FriendAgeCategory = "same_age" | "older_1_2" | "older_3_plus" | "younger" | "adult";

export const FRIEND_AGE_CATEGORY_LABEL: Record<FriendAgeCategory, string> = {
  same_age: "Same Age (Peer)",
  older_1_2: "Older (1-2 yrs)",
  older_3_plus: "Older (3+ yrs)",
  younger: "Younger",
  adult: "Adult",
};

export type FriendContext = "school" | "sport_club" | "care_system_peer" | "cultural_community" | "online" | "neighbourhood" | "family_network";

export const FRIEND_CONTEXT_LABEL: Record<FriendContext, string> = {
  school: "School",
  sport_club: "Sport Club",
  care_system_peer: "Care System Peer",
  cultural_community: "Cultural Community",
  online: "Online",
  neighbourhood: "Neighbourhood",
  family_network: "Family Network",
};

export type FriendshipQuality = "strong_positive" | "developing" | "casual" | "some_concerns" | "significant_concerns";

export const FRIENDSHIP_QUALITY_LABEL: Record<FriendshipQuality, string> = {
  strong_positive: "Strong/Positive",
  developing: "Developing",
  casual: "Casual",
  some_concerns: "Some Concerns",
  significant_concerns: "Significant Concerns",
};

export type FriendContactType = "in_person" | "online" | "both";

export const FRIEND_CONTACT_TYPE_LABEL: Record<FriendContactType, string> = {
  in_person: "In-Person",
  online: "Online",
  both: "Both",
};

export type IsolationRisk = "low" | "medium" | "high";

export const ISOLATION_RISK_LABEL: Record<IsolationRisk, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export interface FriendEntry {
  friend_initial: string;
  age_category: FriendAgeCategory;
  context: FriendContext;
  duration_of_friendship: string;
  quality_of_relationship: FriendshipQuality;
  contextual_safeguarding_notes: string;
  friends_parents_known: boolean;
  contact_type: FriendContactType;
  frequency: string;
  support_needed: string;
}

export interface FriendshipMap {
  id: string;
  child_id: string;
  map_date: string;
  friends: FriendEntry[];
  friendship_strengths: string[];
  friendship_challenges: string[];
  isolation_risk: IsolationRisk;
  loneliness_factors: string;
  support_to_build_friendships: string[];
  reviewed_date: string;
  reviewed_by: string;
  created_at: string;
}

// ── Funeral Attendance Records (child-level) ──

export type FuneralType = "burial" | "cremation" | "memorial_service" | "wake_celebration" | "religious_ceremony" | "direct_cremation" | "other";

export const FUNERAL_TYPE_LABEL: Record<FuneralType, string> = {
  burial: "Burial",
  cremation: "Cremation",
  memorial_service: "Memorial Service",
  wake_celebration: "Wake/Celebration of Life",
  religious_ceremony: "Religious Ceremony",
  direct_cremation: "Direct Cremation (No Service)",
  other: "Other",
};

export type FuneralAttendanceDecision = "attended" | "did_not_attend_chose" | "did_not_attend_not_invited" | "attended_remotely" | "pending";

export const FUNERAL_ATTENDANCE_DECISION_LABEL: Record<FuneralAttendanceDecision, string> = {
  attended: "Attended",
  did_not_attend_chose: "Did Not Attend (Chose Not To)",
  did_not_attend_not_invited: "Did Not Attend (Not Invited)",
  attended_remotely: "Attended Remotely",
  pending: "Pending",
};

export type FuneralDecisionMaker = "child_led" | "birth_family" | "social_worker" | "court_direction" | "joint_decision";

export const FUNERAL_DECISION_MAKER_LABEL: Record<FuneralDecisionMaker, string> = {
  child_led: "Child-Led",
  birth_family: "Birth Family Decided",
  social_worker: "Social Worker Decided",
  court_direction: "Court Direction",
  joint_decision: "Joint Decision",
};

export interface FuneralRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  deceased_name: string;
  relationship_to_child: string;
  child_was_informed_by: string;
  date_of_death: string;
  funeral_date: string;
  funeral_type: FuneralType;
  faith_tradition?: string;
  attendance_decision: FuneralAttendanceDecision;
  decision_maker: FuneralDecisionMaker;
  pre_funeral_preparation: string[];
  who_attended_with_child: string[];
  travel_arrangements?: string;
  social_worker_informed: boolean;
  birth_family_contact?: string;
  rituals_observed: string[];
  child_role_at_funeral?: string;
  post_funeral_support: string[];
  child_voice: string;
  staff_observation: string;
  follow_up_date: string;
  flags_concerns: string[];
  key_worker: string;
  created_at: string;
}

// ── Garden Cultivation Tracker (home-level) ──

export type GardenPlotLocation = "back_garden" | "side_bed" | "vegetable_patch" | "greenhouse" | "allotment_plot" | "pots_containers";

export const GARDEN_PLOT_LOCATION_LABEL: Record<GardenPlotLocation, string> = {
  back_garden: "Back Garden",
  side_bed: "Side Bed",
  vegetable_patch: "Vegetable Patch",
  greenhouse: "Greenhouse",
  allotment_plot: "Allotment Plot",
  pots_containers: "Pots/Containers",
};

export type CropStatus = "growing" | "ready" | "harvested" | "failed";

export const CROP_STATUS_LABEL: Record<CropStatus, string> = {
  growing: "Growing",
  ready: "Ready",
  harvested: "Harvested",
  failed: "Failed",
};

export interface GardenPlanting {
  crop: string;
  planted: string;
  expected_harvest: string;
  status: CropStatus;
}

export interface GardenPlotRecord {
  id: string;
  plot_name: string;
  location: GardenPlotLocation;
  size?: string;
  lead_child?: string;
  contributing_children: string[];
  lead_staff: string;
  current_planting: GardenPlanting[];
  seasonal_plan: string[];
  tools_accessible: string[];
  child_chosen_crops: string[];
  harvest_so_far: string[];
  hours_this_month: number;
  sensory_benefits: string[];
  skills_learned: string[];
  challenges_issues: string[];
  child_voice: string;
  staff_observation: string;
  next_step: string;
  review_date: string;
  created_at: string;
}

// ── Gas & Electrical Safety Checks (home-level) ──

export type SafetyCheckCategory = "annual_gas_safety" | "boiler_service" | "eicr" | "pat_testing" | "smoke_alarm_test" | "co_detector_test" | "emergency_lighting" | "rcd_test" | "solar_inverter_inspection" | "fixed_wire_inspection";

export const SAFETY_CHECK_CATEGORY_LABEL: Record<SafetyCheckCategory, string> = {
  annual_gas_safety: "Annual Gas Safety (CP12)",
  boiler_service: "Boiler Service",
  eicr: "EICR (5-Yearly)",
  pat_testing: "PAT Testing (Annual)",
  smoke_alarm_test: "Smoke Alarm Test",
  co_detector_test: "CO Detector Test",
  emergency_lighting: "Emergency Lighting",
  rcd_test: "RCD Test",
  solar_inverter_inspection: "Solar / Inverter Inspection",
  fixed_wire_inspection: "Fixed Wire Inspection",
};

export type SafetyCheckScope = "whole_property" | "boiler_heating" | "kitchen" | "bedrooms" | "communal" | "external" | "specific_appliance";

export const SAFETY_CHECK_SCOPE_LABEL: Record<SafetyCheckScope, string> = {
  whole_property: "Whole Property",
  boiler_heating: "Boiler/Heating",
  kitchen: "Kitchen",
  bedrooms: "Bedrooms",
  communal: "Communal",
  external: "External",
  specific_appliance: "Specific Appliance",
};

export type SafetyCheckOutcome = "pass" | "pass_with_advisories" | "remedial_works_required" | "failed_urgent";

export const SAFETY_CHECK_OUTCOME_LABEL: Record<SafetyCheckOutcome, string> = {
  pass: "Pass",
  pass_with_advisories: "Pass with Advisories",
  remedial_works_required: "Remedial Works Required",
  failed_urgent: "Failed — Urgent Action",
};

export type RemedialWorkStatus = "open" | "booked" | "completed";

export const REMEDIAL_WORK_STATUS_LABEL: Record<RemedialWorkStatus, string> = {
  open: "Open",
  booked: "Booked",
  completed: "Completed",
};

export interface RemedialWork {
  description: string;
  deadline: string;
  status: RemedialWorkStatus;
}

export interface SafetyCheckRecord {
  id: string;
  category: SafetyCheckCategory;
  scope_area: SafetyCheckScope;
  specific_item?: string;
  contractor: string;
  contractor_accreditation: string;
  certificate_number?: string;
  inspection_date: string;
  expiry_date: string;
  outcome: SafetyCheckOutcome;
  advisories: string[];
  remedial_works: RemedialWork[];
  cost_paid?: number;
  certificate_location: string;
  notified_to_regulator?: string;
  recorded_by: string;
  flags_concerns: string[];
  notes?: string;
  created_at: string;
}

// ── Gifts Register (home-level) ──

export type GiftDirection = "received" | "given";

export const GIFT_DIRECTION_LABEL: Record<GiftDirection, string> = {
  received: "Received",
  given: "Given",
};

export type GiftRecipientType = "child" | "staff" | "home";

export const GIFT_RECIPIENT_TYPE_LABEL: Record<GiftRecipientType, string> = {
  child: "Child",
  staff: "Staff",
  home: "Home",
};

export type GiftSource = "family" | "social_worker" | "advocate" | "charity" | "staff_personal" | "home_purchase" | "community" | "unknown" | "other";

export const GIFT_SOURCE_LABEL: Record<GiftSource, string> = {
  family: "Family",
  social_worker: "Social Worker",
  advocate: "Advocate",
  charity: "Charity",
  staff_personal: "Staff (Personal)",
  home_purchase: "Home Purchase",
  community: "Community",
  unknown: "Unknown",
  other: "Other",
};

export type GiftApprovalStatus = "approved" | "declined" | "pending" | "returned";

export const GIFT_APPROVAL_STATUS_LABEL: Record<GiftApprovalStatus, string> = {
  approved: "Approved",
  declined: "Declined",
  pending: "Pending",
  returned: "Returned to Sender",
};

export interface GiftRecord {
  id: string;
  date: string;
  direction: GiftDirection;
  recipient_type: GiftRecipientType;
  recipient_id: string | null;
  recipient_name: string;
  source: GiftSource;
  source_name: string;
  description: string;
  estimated_value: number;
  approval_status: GiftApprovalStatus;
  approved_by: string | null;
  reason: string;
  safeguarding_concerns: boolean;
  safeguarding_notes: string;
  recorded_by: string;
  notes: string;
  created_at: string;
}

// ── Governance Meeting Minutes (home-level) ──

export type GovernanceActionStatus = "completed" | "in_progress" | "overdue" | "pending";

export const GOVERNANCE_ACTION_STATUS_LABEL: Record<GovernanceActionStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  overdue: "Overdue",
  pending: "Pending",
};

export interface GovernanceAction {
  description: string;
  owner: string;
  deadline: string;
  status: GovernanceActionStatus;
}

export interface GovernanceMeeting {
  id: string;
  date: string;
  meeting_type: string;
  chair: string;
  attendees: string[];
  agenda_items: string[];
  key_decisions: string[];
  actions: GovernanceAction[];
  children_discussed: string[];
  regulatory_topics: string[];
  risk_items: string[];
  next_meeting_date: string;
  created_at: string;
}

// ── Batch 25 ──

// ── Grab Bag (child-level) ──

export type GrabBagStatus = "complete" | "incomplete" | "expired_items";

export const GRAB_BAG_STATUS_LABEL: Record<GrabBagStatus, string> = {
  complete: "Complete",
  incomplete: "Incomplete",
  expired_items: "Expired Items",
};

export interface GrabBagItem {
  name: string;
  required: boolean;
  present: boolean;
  expiry_date: string | null;
  notes: string;
}

export interface GrabBag {
  id: string;
  child_id: string;
  location: string;
  last_checked: string;
  checked_by: string;
  next_check_due: string;
  items: GrabBagItem[];
  overall_status: GrabBagStatus;
  notes: string;
  created_at: string;
}

// ── Grief and Loss Support (child-level) ──

export type LossType = "bereavement" | "family_separation" | "placement_move" | "pet_loss" | "friendship_loss" | "identity_loss" | "loss_of_routine" | "other";

export const LOSS_TYPE_LABEL: Record<LossType, string> = {
  bereavement: "Bereavement",
  family_separation: "Family Separation",
  placement_move: "Placement Move",
  pet_loss: "Pet Loss",
  friendship_loss: "Friendship Loss",
  identity_loss: "Identity Loss",
  loss_of_routine: "Loss of Routine",
  other: "Other",
};

export interface GriefRecord {
  id: string;
  child_id: string;
  loss_type: LossType;
  loss_description: string;
  date_of_loss: string;
  time_since_loss: string;
  child_relationship_to_loss: string;
  grief_stage_observation: string;
  external_support_in_place: string[];
  home_based_support: string[];
  key_worker_involvement: string;
  traditions_and_rituals: string[];
  anniversary_acknowledgement: string;
  creative_outlets: string[];
  commemoration_activities: string[];
  child_coping_strategies: string[];
  behaviours_to_watch_for: string[];
  review_schedule: string;
  last_review_date: string;
  reviewed_by: string;
  next_review_date: string;
  created_at: string;
}

// ── Hairdressing Records (child-level) ──

export type SalonType = "high_street_barber" | "specialist_black_hair" | "mobile_home" | "salon" | "specialist_sensory";

export const SALON_TYPE_LABEL: Record<SalonType, string> = {
  high_street_barber: "High Street Barber",
  specialist_black_hair: "Specialist Black Hair Barber",
  mobile_home: "Mobile/Home",
  salon: "Salon",
  specialist_sensory: "Specialist (e.g. Sensory-Friendly)",
};

export interface HairAppointment {
  id: string;
  child_id: string;
  date: string;
  salon_or_barber: string;
  salon_type: SalonType;
  staff_escort: string;
  style_requested: string;
  style_achieved: string;
  products_used: string[];
  duration_minutes: number;
  cost: number;
  child_satisfaction: number;
  staff_observation: string;
  anxiety_level_observed: string;
  reasonable_adjustments: string[];
  child_chose: boolean;
  cultural_relevance: string;
  next_appointment_due: string;
  notes: string;
  created_at: string;
}

// ── Handover Quality Audit (home-level) ──

export type RagRating = "red" | "amber" | "green";

export const RAG_RATING_LABEL: Record<RagRating, string> = {
  red: "Red",
  amber: "Amber",
  green: "Green",
};

export interface HandoverDomainScore {
  domain: string;
  score: 1 | 2 | 3 | 4 | 5;
  observation: string;
  evidence: string;
}

export interface HandoverAudit {
  id: string;
  audit_date: string;
  audit_period: string;
  handover_observed: string;
  auditor: string;
  staff_on_duty: string[];
  duration_minutes: number;
  scoring_domains: HandoverDomainScore[];
  overall_score: number;
  overall_rag_rating: RagRating;
  strengths_observed: string[];
  gaps_identified: string[];
  childrens_safety_info_covered: boolean;
  risk_info_covered: boolean;
  handover_documentation_quality: string;
  child_voice_reflected: boolean;
  recommendations_to_handover: string[];
  training_arising: string[];
  policy_arising: string[];
  shareable_observations: string[];
  confidential_notes: string;
  next_audit_date: string;
  created_at: string;
}

// ── Hate Incident Log (home-level) ──

export type HateTargetType = "young_person" | "staff" | "visitor";

export const HATE_TARGET_TYPE_LABEL: Record<HateTargetType, string> = {
  young_person: "Young Person",
  staff: "Staff",
  visitor: "Visitor",
};

export type HatePerpetratorType = "external_community" | "peer_at_school" | "visitor" | "other_yp" | "staff" | "online";

export const HATE_PERPETRATOR_TYPE_LABEL: Record<HatePerpetratorType, string> = {
  external_community: "External Community",
  peer_at_school: "Peer at School",
  visitor: "Visitor",
  other_yp: "Other YP",
  staff: "Staff",
  online: "Online",
};

export type HateIncidentType = "racist" | "homophobic_transphobic" | "religious" | "disability_related" | "antisemitic" | "misogynistic" | "other";

export const HATE_INCIDENT_TYPE_LABEL: Record<HateIncidentType, string> = {
  racist: "Racist",
  homophobic_transphobic: "Homophobic/Transphobic",
  religious: "Religious",
  disability_related: "Disability-Related",
  antisemitic: "Antisemitic",
  misogynistic: "Misogynistic",
  other: "Other",
};

export type HateIncidentStatus = "open" | "closed_resolved" | "closed_escalated";

export const HATE_INCIDENT_STATUS_LABEL: Record<HateIncidentStatus, string> = {
  open: "Open",
  closed_resolved: "Closed - Resolved",
  closed_escalated: "Closed - Escalated",
};

export interface HateIncident {
  id: string;
  date: string;
  time: string;
  location: string;
  target_type: HateTargetType;
  target_identity: string;
  perpetrator_type: HatePerpetratorType;
  incident_type: HateIncidentType;
  description: string;
  affected_person_response: string;
  support_provided: string[];
  reported_by: string;
  reported_to_police: boolean;
  police_reference: string;
  reported_to_ofsted: boolean;
  reported_to_la: boolean;
  school_notified: boolean;
  restorative_approach: string;
  perpetrator_addressed: string;
  prevention_measures_added: string[];
  follow_up_date: string;
  status: HateIncidentStatus;
  learnings: string;
  created_at: string;
}

// ── Health Assessments (child-level) ──

export type HealthAssessmentType = "iha" | "rha" | "dental" | "optician" | "sdq";

export const HEALTH_ASSESSMENT_TYPE_LABEL: Record<HealthAssessmentType, string> = {
  iha: "IHA",
  rha: "RHA",
  dental: "Dental",
  optician: "Optician",
  sdq: "SDQ",
};

export type HealthAssessmentStatus = "completed" | "scheduled" | "overdue" | "referred";

export const HEALTH_ASSESSMENT_STATUS_LABEL: Record<HealthAssessmentStatus, string> = {
  completed: "Completed",
  scheduled: "Scheduled",
  overdue: "Overdue",
  referred: "Referred",
};

export type SdqBand = "normal" | "borderline" | "abnormal";

export const SDQ_BAND_LABEL: Record<SdqBand, string> = {
  normal: "Normal",
  borderline: "Borderline",
  abnormal: "Abnormal",
};

export interface SdqScores {
  emotional: number;
  conduct: number;
  hyperactivity: number;
  peer: number;
  prosocial: number;
  total: number;
  band: SdqBand;
}

export type HealthFollowUpStatus = "pending" | "completed" | "overdue";

export const HEALTH_FOLLOW_UP_STATUS_LABEL: Record<HealthFollowUpStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  overdue: "Overdue",
};

export interface HealthFollowUp {
  action: string;
  owner: string;
  due_date: string;
  status: HealthFollowUpStatus;
}

export interface HealthNeed {
  need: string;
  how_met: string;
}

export interface HealthAssessment {
  id: string;
  child_id: string;
  type: HealthAssessmentType;
  status: HealthAssessmentStatus;
  date: string;
  next_due: string;
  conducted_by: string;
  location: string;
  key_findings: string[];
  recommendations: string[];
  follow_ups: HealthFollowUp[];
  sdq_scores: SdqScores | null;
  health_needs: HealthNeed[];
  consent: string;
  child_view: string;
  notes: string;
  created_at: string;
}

// ── Batch 26 ──────────────────────────────────────────────────────────────────

/* ── Health Monitoring ───────────────────────────────────────────────────────── */

export type HealthMonitoringType = "dental" | "optician" | "immunisation" | "gp_registration" | "annual_health" | "hearing" | "growth" | "sexual_health";

export const HEALTH_MONITORING_TYPE_LABEL: Record<HealthMonitoringType, string> = {
  dental: "Dental",
  optician: "Optician",
  immunisation: "Immunisation",
  gp_registration: "GP Registration",
  annual_health: "Annual Health Assessment",
  hearing: "Hearing Test",
  growth: "Growth / BMI",
  sexual_health: "Sexual Health",
};

export type HealthMonitoringStatus = "completed" | "scheduled" | "overdue" | "declined" | "cancelled" | "not_due";

export const HEALTH_MONITORING_STATUS_LABEL: Record<HealthMonitoringStatus, string> = {
  completed: "Completed",
  scheduled: "Scheduled",
  overdue: "Overdue",
  declined: "Declined",
  cancelled: "Cancelled",
  not_due: "Not Due",
};

export interface HealthMonitoringEntry {
  id: string;
  child_id: string;
  type: HealthMonitoringType;
  provider: string;
  date: string;
  next_due: string;
  status: HealthMonitoringStatus;
  attended_by: string | null;
  outcome: string;
  recommendations: string[];
  follow_up: string;
  consent_obtained: boolean;
  consent_from: string;
  child_views: string;
  notes: string;
  created_at: string;
}

/* ── Health Passports ────────────────────────────────────────────────────────── */

export interface PassportMedication {
  name: string;
  dose: string;
  frequency: string;
  prescribed_for: string;
  prescribed_by: string;
}

export interface PassportAllergy {
  allergen: string;
  reaction: string;
  severity: AllergySeverity;
}

export interface PassportCondition {
  condition: string;
  managed_by: string;
  notes: string;
}

export interface PassportHealthContact {
  role: string;
  name: string;
  phone: string;
  address: string;
}

export interface HealthPassport {
  id: string;
  child_id: string;
  last_updated: string;
  updated_by: string;
  nhs_number: string;
  blood_type: string;
  medications: PassportMedication[];
  allergies: PassportAllergy[];
  conditions: PassportCondition[];
  immunisations_up_to_date: boolean;
  immunisation_notes: string;
  dietary_needs: string;
  health_contacts: PassportHealthContact[];
  mental_health: string;
  sensory_needs: string | null;
  emergency_info: string;
  consent_status: string;
  last_health_assessment: string;
  next_health_assessment: string;
  dental_check_date: string;
  optical_check_date: string;
  created_at: string;
}

/* ── Healthcare Plans ────────────────────────────────────────────────────────── */

export type ConditionSeverity = "mild" | "moderate" | "severe";

export interface HcpCondition {
  condition: string;
  diagnosed: string;
  severity: ConditionSeverity;
  current_management: string;
}

export interface HcpAllergy {
  allergen: string;
  reaction: string;
  severity: AllergySeverity;
  treatment: string;
}

export interface HcpMedication {
  medication: string;
  dose: string;
  frequency: string;
  purpose: string;
  prescriber: string;
}

export interface HcpPractitioner {
  name: string;
  practice: string;
  phone: string;
  address: string;
}

export interface HcpSpecialist {
  specialism: string;
  name: string;
  contact: string;
}

export interface HcpEmergencyProtocol {
  scenario: string;
  action: string;
}

export interface HcpHospitalAttendance {
  date: string;
  reason: string;
  outcome: string;
}

export interface HcpScreening {
  screening: string;
  last_done: string;
  due_next: string;
}

export interface HcpImmunisation {
  vaccine: string;
  given: string;
  due_next: string | null;
}

export interface HealthcarePlan {
  id: string;
  child_id: string;
  conditions: HcpCondition[];
  allergies: HcpAllergy[];
  regular_medications: HcpMedication[];
  prn_medications: string[];
  gp_details: HcpPractitioner;
  dentist_details: HcpPractitioner;
  optician_details: HcpPractitioner;
  specialist_contacts: HcpSpecialist[];
  emergency_protocols: HcpEmergencyProtocol[];
  recent_hospital_attendances: HcpHospitalAttendance[];
  screening_schedule: HcpScreening[];
  immunisations: HcpImmunisation[];
  reviewed_by: string;
  reviewed_date: string;
  next_review_date: string;
  signed_off_by_gp: boolean;
  child_informed_of_plan: boolean;
  created_at: string;
}

/* ── Holiday / Trip Planning ─────────────────────────────────────────────────── */

export type TripType = "day_trip" | "overnight" | "residential" | "holiday" | "educational_visit" | "activity_outing";

export const TRIP_TYPE_LABEL: Record<TripType, string> = {
  day_trip: "Day Trip",
  overnight: "Overnight",
  residential: "Residential",
  holiday: "Holiday",
  educational_visit: "Educational Visit",
  activity_outing: "Activity Outing",
};

export type TripStatus = "planning" | "approved" | "ready" | "in_progress" | "completed" | "cancelled";

export const TRIP_STATUS_LABEL: Record<TripStatus, string> = {
  planning: "Planning",
  approved: "Approved",
  ready: "Ready",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export type TripRiskLevel = "low" | "medium" | "high";

export const TRIP_RISK_LEVEL_LABEL: Record<TripRiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export type TripStaffRole = "lead" | "support" | "driver";

export const TRIP_STAFF_ROLE_LABEL: Record<TripStaffRole, string> = {
  lead: "Lead",
  support: "Support",
  driver: "Driver",
};

export interface TripYoungPerson {
  child_id: string;
  consent_obtained: boolean;
  consent_from: string;
  medical_info_shared: boolean;
  behaviour_plan_shared: boolean;
}

export interface TripStaff {
  staff_id: string;
  role: TripStaffRole;
  sleep_in: boolean;
}

export interface TripHazard {
  hazard: string;
  likelihood: number;
  impact: number;
  controls: string;
}

export interface TripRiskAssessment {
  completed: boolean;
  completed_by: string | null;
  completed_date: string | null;
  overall_risk: TripRiskLevel;
  hazards: TripHazard[];
}

export interface TripItineraryItem {
  time: string;
  activity: string;
  location: string;
  notes: string;
}

export interface TripBudgetItem {
  item: string;
  estimated: number;
  actual: number | null;
}

export interface TripSwApproval {
  child_id: string;
  approved: boolean;
  approved_date: string | null;
}

export interface TripEvaluation {
  rating: number;
  highlights: string;
  concerns: string;
  would_repeat: boolean;
  child_feedback: string;
}

export interface TripPlan {
  id: string;
  title: string;
  trip_type: TripType;
  destination: string;
  start_date: string;
  end_date: string;
  departure_time: string;
  return_time: string;
  young_people: TripYoungPerson[];
  staff_assigned: TripStaff[];
  staff_ratio: string;
  risk_assessment: TripRiskAssessment;
  itinerary: TripItineraryItem[];
  budget: TripBudgetItem[];
  total_budget: number;
  transport: string;
  accommodation: string | null;
  emergency_plan: string;
  social_worker_approval: TripSwApproval[];
  manager_approval: boolean;
  manager_approved_by: string | null;
  children_views: string;
  post_trip_evaluation: TripEvaluation | null;
  status: TripStatus;
  notes: string;
  created_at: string;
}

/* ── Home Improvement Plan ───────────────────────────────────────────────────── */

export type ObjectiveSource = "reg44" | "ofsted" | "reg45" | "self" | "maintenance" | "regulatory" | "org_risk";

export const OBJECTIVE_SOURCE_LABEL: Record<ObjectiveSource, string> = {
  reg44: "Reg 44 Recommendation",
  ofsted: "Ofsted Inspection",
  reg45: "Reg 45 Recommendation",
  self: "Self-identified (RM)",
  maintenance: "Maintenance Inspection",
  regulatory: "Regulatory Requirement",
  org_risk: "Organisational risk",
};

export type ObjectivePriority = "high" | "medium" | "low";

export const OBJECTIVE_PRIORITY_LABEL: Record<ObjectivePriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export type ObjectiveStatus = "planned" | "in_progress" | "completed" | "overdue";

export const OBJECTIVE_STATUS_LABEL: Record<ObjectiveStatus, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
};

export interface ObjectiveUpdate {
  date: string;
  note: string;
  updated_by: string;
}

export interface ImprovementObjective {
  id: string;
  title: string;
  source: ObjectiveSource;
  priority: ObjectivePriority;
  status: ObjectiveStatus;
  owner: string;
  target_date: string;
  completed_date: string | null;
  progress: number;
  budget: number | null;
  notes: string;
  updates: ObjectiveUpdate[];
  created_at: string;
}

/* ── Home Pets Care Log ──────────────────────────────────────────────────────── */

export type PetSpecies = "dog" | "cat" | "rabbit" | "guinea_pig" | "fish" | "hamster" | "bird" | "other";

export const PET_SPECIES_LABEL: Record<PetSpecies, string> = {
  dog: "Dog",
  cat: "Cat",
  rabbit: "Rabbit",
  guinea_pig: "Guinea Pig",
  fish: "Fish",
  hamster: "Hamster",
  bird: "Bird",
  other: "Other",
};

export interface PetRotaEntry {
  task: string;
  days: string;
  lead: string;
}

export interface PetRecord {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string | null;
  dob: string | null;
  arrived_at: string;
  microchipped: boolean;
  insurance: boolean;
  vaccinations_up_to_date: boolean;
  last_vet_visit: string | null;
  next_vet_due: string | null;
  child_allergies_cleared: string[];
  children_involved_in_care: string[];
  walking_feeding_rota: PetRotaEntry[];
  behavioural_notes: string;
  therapeutic_value: string;
  risk_assessment_date: string;
  flags: string[];
  logged_by: string;
  created_at: string;
}

/* ── Homework Support Log ──────────────────────────────────────────────────── */

export type ChildInitiation = "self_started" | "reminded" | "resisted_then_engaged" | "refused";
export const CHILD_INITIATION_LABEL: Record<ChildInitiation, string> = {
  self_started: "Self-started",
  reminded: "Reminded",
  resisted_then_engaged: "Resisted then engaged",
  refused: "Refused (logged)",
};

export type WorkQuality = "strong_effort" | "adequate" | "hurried" | "stuck";
export const WORK_QUALITY_LABEL: Record<WorkQuality, string> = {
  strong_effort: "Strong effort",
  adequate: "Adequate",
  hurried: "Hurried",
  stuck: "Stuck — needed more help",
};

export type ChildMoodDuring = "engaged" | "frustrated_but_persisted" | "distracted" | "overwhelmed";
export const CHILD_MOOD_DURING_LABEL: Record<ChildMoodDuring, string> = {
  engaged: "Engaged",
  frustrated_but_persisted: "Frustrated but persisted",
  distracted: "Distracted",
  overwhelmed: "Overwhelmed",
};

export interface HomeworkSession {
  id: string;
  child_id: string;
  date: string;
  subject: string;
  topic: string;
  duration_minutes: number;
  supporting_staff: string;
  external_tutor: string;
  set_by_school: string;
  child_initiation: ChildInitiation;
  work_completed: boolean;
  quality_of_work: WorkQuality;
  child_mood_during: ChildMoodDuring;
  challenges_faced: string[];
  strategies_used: string[];
  child_understanding: string;
  parental_like_support: string;
  feedback_to_school: string;
  homework_submitted_to_school: boolean;
  pep_goal_progress: string;
  recorded_by: string;
  created_at: string;
}

/* ── House Rules ───────────────────────────────────────────────────────────── */

export type HouseRuleCategory = "boundaries" | "routines" | "respect" | "safety" | "community" | "technology" | "visitors";
export const HOUSE_RULE_CATEGORY_LABEL: Record<HouseRuleCategory, string> = {
  boundaries: "Boundaries",
  routines: "Routines",
  respect: "Respect",
  safety: "Safety",
  community: "Community",
  technology: "Technology",
  visitors: "Visitors",
};

export type HouseRuleStatus = "active" | "under_review" | "amended";
export const HOUSE_RULE_STATUS_LABEL: Record<HouseRuleStatus, string> = {
  active: "Active",
  under_review: "Under Review",
  amended: "Amended",
};

export interface HouseRuleAmendment {
  date: string;
  change: string;
  reason: string;
}

export interface HouseRule {
  id: string;
  category: HouseRuleCategory;
  title: string;
  description: string;
  rationale: string;
  agreed_date: string;
  review_date: string;
  status: HouseRuleStatus;
  child_friendly_version: string;
  young_people_consulted: string[];
  amendments: HouseRuleAmendment[];
  consequences: string;
  linked_to_right: string;
  created_at: string;
}

/* ── Household Tasks Rota ──────────────────────────────────────────────────── */

export type TaskCategory = "personal_room" | "shared_space" | "kitchen" | "laundry" | "garden" | "pet_care" | "shopping" | "cooking" | "cleaning";
export const TASK_CATEGORY_LABEL: Record<TaskCategory, string> = {
  personal_room: "Personal room",
  shared_space: "Shared space",
  kitchen: "Kitchen",
  laundry: "Laundry",
  garden: "Garden",
  pet_care: "Pet care",
  shopping: "Shopping",
  cooking: "Cooking",
  cleaning: "Cleaning",
};

export type TaskFrequency = "daily" | "weekly" | "fortnightly" | "ad_hoc";
export const TASK_FREQUENCY_LABEL: Record<TaskFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  ad_hoc: "Ad-hoc",
};

export type SupportLevel = "independent" | "prompted" | "supported" | "doing_alongside_staff";
export const SUPPORT_LEVEL_LABEL: Record<SupportLevel, string> = {
  independent: "Independent",
  prompted: "Prompted",
  supported: "Supported",
  doing_alongside_staff: "Doing alongside staff",
};

export interface HouseholdTask {
  id: string;
  child_id: string;
  task_name: string;
  task_category: TaskCategory;
  frequency: TaskFrequency;
  support_level: SupportLevel;
  child_chose: boolean;
  pocket_money_linked: boolean;
  pocket_money_amount?: number;
  sensory_considerations: string;
  skills_being_developed: string[];
  child_attitude: string;
  staff_observation: string;
  completion_recent: number;
  reviewed_date: string;
  notes: string;
  created_at: string;
}

/* ── Immunisation Record ───────────────────────────────────────────────────── */

export type VaccineStatus = "up_to_date" | "due_now" | "overdue" | "caught_up_after_gap" | "refused" | "medically_exempt";
export const VACCINE_STATUS_LABEL: Record<VaccineStatus, string> = {
  up_to_date: "Up to date",
  due_now: "Due now",
  overdue: "Overdue",
  caught_up_after_gap: "Caught up after gap",
  refused: "Refused",
  medically_exempt: "Medically exempt",
};

export interface VaccineEntry {
  vaccine: string;
  age_due: string;
  date_given: string;
  batch_number: string;
  location: string;
  brand: string;
  side_effects: string;
  side_effects_observed: boolean;
  status: VaccineStatus;
}

export interface UpcomingDose {
  vaccine: string;
  due_date: string;
  scheduled: boolean;
}

export interface ImmunisationRecord {
  id: string;
  child_id: string;
  gp_registration: string;
  red_book_held: boolean;
  records: VaccineEntry[];
  missed_at_age: string[];
  caught_up_during_placement: string[];
  upcoming_due_within_90_days: UpcomingDose[];
  child_attitude: string;
  child_informed_and_consent: boolean;
  gp_reviewed_schedule: boolean;
  review_date: string;
  last_update: string;
  created_at: string;
}

/* ── Impact Assessments ────────────────────────────────────────────────────── */

export type ImpactAssessmentStatus = "draft" | "in_progress" | "completed" | "approved" | "declined";
export const IMPACT_ASSESSMENT_STATUS_LABEL: Record<ImpactAssessmentStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
  approved: "Approved",
  declined: "Declined",
};

export type ImpactRecommendation = "proceed" | "proceed_with_conditions" | "decline" | "further_info";
export const IMPACT_RECOMMENDATION_LABEL: Record<ImpactRecommendation, string> = {
  proceed: "Proceed",
  proceed_with_conditions: "Proceed with Conditions",
  decline: "Decline",
  further_info: "Further Info Required",
};

export type ImpactLevel = "positive" | "neutral" | "negative" | "concern";

export interface ImpactArea {
  area: string;
  current_level: ImpactLevel;
  projected_impact: ImpactLevel;
  detail: string;
  mitigation: string;
}

export interface ImpactAssessment {
  id: string;
  referral_name: string;
  referral_age: number;
  referral_gender: string;
  referral_authority: string;
  date: string;
  status: ImpactAssessmentStatus;
  assessor: string;
  impact_on_existing: ImpactArea[];
  impact_on_referral: ImpactArea[];
  overall_recommendation: ImpactRecommendation;
  conditions: string[];
  rationale: string;
  panel_date: string | null;
  panel_outcome: string | null;
  notes: string;
  created_at: string;
}

/* ── Incident Trend Analysis ───────────────────────────────────────────────── */

export type TrendActionStatus = "completed" | "in_progress" | "not_started" | "overdue";
export const TREND_ACTION_STATUS_LABEL: Record<TrendActionStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  not_started: "Not Started",
  overdue: "Overdue",
};

export interface TrendPreventionAction {
  action: string;
  owner: string;
  deadline: string;
  status: TrendActionStatus;
}

export interface IncidentTrendRecord {
  id: string;
  period: string;
  total_incidents: number;
  incident_type_breakdown: Record<string, number>;
  children_involved: string[];
  top_triggers: string[];
  time_of_day_patterns: Record<string, number>;
  day_of_week_patterns: Record<string, number>;
  staff_on_duty_patterns: string;
  key_learning: string[];
  prevention_actions: TrendPreventionAction[];
  reduction_vs_previous: number;
  analyst: string;
  review_date: string;
  created_at: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   BATCH 28 — After-School Club Tracker, Agency Staff Feedback,
   Bedroom Personalisation, Bedtime Routines, Birthday Card Tracker,
   Board Reporting
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── After-School Club Tracker ────────────────────────────────────────────── */

export type ClubType = "sport" | "arts" | "music" | "drama" | "stem_coding" | "outdoor_adventure" | "cultural_heritage" | "volunteering" | "faith" | "skill_development";
export const CLUB_TYPE_LABEL: Record<ClubType, string> = {
  sport: "Sport", arts: "Arts", music: "Music", drama: "Drama",
  stem_coding: "STEM/Coding", outdoor_adventure: "Outdoor/Adventure",
  cultural_heritage: "Cultural/Heritage", volunteering: "Volunteering",
  faith: "Faith", skill_development: "Skill development",
};

export type ClubOngoingStatus = "active" | "trialled_declined" | "on_break" | "ended";
export const CLUB_ONGOING_STATUS_LABEL: Record<ClubOngoingStatus, string> = {
  active: "Active", trialled_declined: "Trialled — declined",
  on_break: "On break", ended: "Ended",
};

export type ClubFundingSource = "home_budget" | "scholarship" | "charitable_funding" | "free" | "la_grant" | "cornerstone_care_group";
export const CLUB_FUNDING_SOURCE_LABEL: Record<ClubFundingSource, string> = {
  home_budget: "Home budget", scholarship: "Scholarship",
  charitable_funding: "Charitable funding", free: "Free",
  la_grant: "LA grant", cornerstone_care_group: "Cara Care Group",
};

export type ClubSocialAspect = "solo_activity" | "with_staff" | "friend_group_at_club" | "group_with_peers" | "mixed";
export const CLUB_SOCIAL_ASPECT_LABEL: Record<ClubSocialAspect, string> = {
  solo_activity: "Solo activity", with_staff: "With staff",
  friend_group_at_club: "Friend group at club",
  group_with_peers: "Group with peers", mixed: "Mixed",
};

export interface ClubAttendance {
  sessions_held_last_term: number;
  sessions_attended: number;
  reason_for_absence: string;
}

export interface ClubRecord {
  id: string;
  child_id: string;
  club_name: string;
  club_type: ClubType;
  schedule: string;
  started_date: string;
  ongoing_status: ClubOngoingStatus;
  ended_date: string;
  reason_for_ending: string;
  cost: number;
  funding_source: ClubFundingSource;
  attendance: ClubAttendance;
  travel_arrangements: string;
  staff_escort: string;
  child_enjoyment_rating: number;
  social_aspect: ClubSocialAspect;
  achievements_at_club: string[];
  challenges_at_club: string[];
  staff_observations: string;
  child_comments: string;
  contributes_to_outcomes: string[];
  reviewed_date: string;
  reviewed_by: string;
  notes: string;
  created_at: string;
}

/* ── Agency Staff Feedback ────────────────────────────────────────────────── */

export type AgencyShiftType = "early" | "late" | "sleep_in" | "wake_night" | "long_day";
export const AGENCY_SHIFT_TYPE_LABEL: Record<AgencyShiftType, string> = {
  early: "Early", late: "Late", sleep_in: "Sleep-in",
  wake_night: "Wake-night", long_day: "Long day",
};

export type RecordingQuality = "excellent" | "good" | "adequate" | "needs_improvement";
export const RECORDING_QUALITY_LABEL: Record<RecordingQuality, string> = {
  excellent: "Excellent", good: "Good", adequate: "Adequate",
  needs_improvement: "Needs improvement",
};

export type AgencyVerdict = "approved_for_repeat" | "approved_with_development_plan" | "not_approved_for_repeat" | "conditional";
export const AGENCY_VERDICT_LABEL: Record<AgencyVerdict, string> = {
  approved_for_repeat: "Approved for repeat",
  approved_with_development_plan: "Approved with development plan",
  not_approved_for_repeat: "Not approved for repeat",
  conditional: "Conditional",
};

export interface AgencyFeedback {
  id: string;
  agency_staff_name: string;
  agency: string;
  shift_date: string;
  shift_type: AgencyShiftType;
  induction_recorded: boolean;
  permanent_staff_on_shift: string;
  children_interacted_with: string[];
  observations_positive: string[];
  observations_constructive: string[];
  child_feedback: string;
  follows_routines: boolean;
  follows_behaviour_support_plans: boolean;
  follows_sensory_protocols: boolean;
  recording_quality: RecordingQuality;
  professionalism_rating: number;
  relational_skills_rating: number;
  overall_verdict: AgencyVerdict;
  feedback_to_agency_date: string;
  feedback_summary: string;
  follow_up_action: string;
  reviewed_by: string;
  notes: string;
  created_at: string;
}

/* ── Bedroom Personalisation ──────────────────────────────────────────────── */

export interface BedroomFurnitureItem {
  item: string;
  child_chose: boolean;
  special_note: string;
}

export interface BedroomTechItem {
  device: string;
  agreed_use_rules: string;
  location_in_room: string;
}

export interface BedroomMeaningfulItem {
  item: string;
  significance: string;
}

export interface BedroomRecentChange {
  date: string;
  change: string;
}

export interface BedroomProfile {
  id: string;
  child_id: string;
  room_number: string;
  child_choose_colours: boolean;
  wall_colours: string[];
  furniture_chosen_by_child: boolean;
  furniture_items: BedroomFurnitureItem[];
  decor_themes: string[];
  personal_artwork_displayed: string[];
  photos_displayed: string[];
  comfort_items: string[];
  tech_setup: BedroomTechItem[];
  storage_arrangement: string;
  private_space: string[];
  sensory_accommodations: string[];
  window_dressing: string;
  flooring: string;
  lighting_preferences: string;
  bed_and_bedding: string;
  meaningful_items: BedroomMeaningfulItem[];
  total_budget_spent: number;
  budget_remaining: number;
  child_satisfaction_rating: number;
  improvement_wishes: string[];
  recent_changes: BedroomRecentChange[];
  review_date: string;
  reviewed_with: string;
  child_authored: boolean;
  created_at: string;
}

/* ── Bedtime Routines ─────────────────────────────────────────────────────── */

export type AgeBand = "under_11" | "11_13" | "14_15" | "16_plus";
export const AGE_BAND_LABEL: Record<AgeBand, string> = {
  under_11: "Under 11", "11_13": "11-13", "14_15": "14-15", "16_plus": "16+",
};

export type RoutineSupportLevel = "independent" | "prompted" | "supported";
export const ROUTINE_SUPPORT_LEVEL_LABEL: Record<RoutineSupportLevel, string> = {
  independent: "Independent", prompted: "Prompted", supported: "Supported",
};

export interface RoutineStep {
  time: string;
  activity: string;
  support_level: RoutineSupportLevel;
}

export interface SleepEnvironment {
  lighting: string;
  temperature: string;
  sound: string;
  bedding: string;
}

export interface BedtimeRoutine {
  id: string;
  child_id: string;
  age_band: AgeBand;
  agreed_bedtime: string;
  weekend_bedtime: string;
  wind_down_start_time: string;
  routine_steps: RoutineStep[];
  pre_bed_rituals: string[];
  sensory_needs: string[];
  comfort_items: string[];
  preferred_environment: SleepEnvironment;
  triggers_to_avoid: string[];
  if_struggling_to_sleep: string[];
  night_terrors: string;
  morning_wake_routine: string;
  reviewed_date: string;
  reviewed_with: string;
  child_agreed: boolean;
  effectiveness_rating: number;
  created_at: string;
}

/* ── Birthday Card Tracker ────────────────────────────────────────────────── */

export type CardOccasion = "birthday" | "christmas" | "eid" | "other_religious_festival" | "anniversary_of_arrival" | "achievement" | "just_because" | "get_well";
export const CARD_OCCASION_LABEL: Record<CardOccasion, string> = {
  birthday: "Birthday", christmas: "Christmas", eid: "Eid",
  other_religious_festival: "Other religious festival",
  anniversary_of_arrival: "Anniversary of arrival",
  achievement: "Achievement", just_because: "Just because", get_well: "Get well",
};

export type CardType = "card" | "card_with_money" | "card_with_gift" | "letter" | "postcard" | "drawing_handmade";
export const CARD_TYPE_LABEL: Record<CardType, string> = {
  card: "Card", card_with_money: "Card with money", card_with_gift: "Card with gift",
  letter: "Letter", postcard: "Postcard", drawing_handmade: "Drawing/handmade",
};

export type SenderType = "mother" | "father" | "sibling" | "grandparent" | "aunt_uncle" | "cousin" | "family_friend" | "coach_mentor" | "school_staff" | "former_carer" | "cornerstone_staff" | "anonymous_well_wisher";
export const SENDER_TYPE_LABEL: Record<SenderType, string> = {
  mother: "Mother", father: "Father", sibling: "Sibling",
  grandparent: "Grandparent", aunt_uncle: "Aunt/Uncle", cousin: "Cousin",
  family_friend: "Family friend", coach_mentor: "Coach/mentor",
  school_staff: "School staff", former_carer: "Former carer",
  cornerstone_staff: "Cara staff", anonymous_well_wisher: "Anonymous well-wisher",
};

export interface CardRecord {
  id: string;
  child_id: string;
  occasion: CardOccasion;
  occasion_date: string;
  received_date: string;
  card_type: CardType;
  sender_type: SenderType;
  sender_name: string;
  child_response_observed: string;
  child_kept_card: boolean;
  card_location: string;
  item_value: number;
  acknowledgement_sent: boolean;
  acknowledgement_method: string;
  recorded_by: string;
  significance: string;
  notes: string;
  created_at: string;
}

/* ── Board Reporting ──────────────────────────────────────────────────────── */

export type BoardReportType = "monthly_rm_report" | "quarterly_performance" | "annual_report" | "reg_45_six_monthly" | "reg_44_triangulation" | "incident_briefing" | "strategic_update";
export const BOARD_REPORT_TYPE_LABEL: Record<BoardReportType, string> = {
  monthly_rm_report: "Monthly RM Report", quarterly_performance: "Quarterly Performance",
  annual_report: "Annual Report", reg_45_six_monthly: "Reg 45 Six-Monthly",
  reg_44_triangulation: "Reg 44 Triangulation", incident_briefing: "Incident Briefing",
  strategic_update: "Strategic Update",
};

export type BoardActionStatus = "completed" | "in_progress" | "overdue" | "pending";
export const BOARD_ACTION_STATUS_LABEL: Record<BoardActionStatus, string> = {
  completed: "Completed", in_progress: "In Progress",
  overdue: "Overdue", pending: "Pending",
};

export interface BoardMetricValue {
  value: string;
  change: string;
}

export interface BoardAgreedAction {
  action: string;
  owner: string;
  deadline: string;
  status: BoardActionStatus;
}

export interface BoardReport {
  id: string;
  report_type: BoardReportType;
  report_period: string;
  submitted_date: string;
  submitted_to: string;
  authored_by: string;
  summary: string;
  key_metrics: Record<string, BoardMetricValue>;
  narrative_highlights: string[];
  areas_of_concern: string[];
  risk_rag_rating: RagRating;
  strategic_questions_raised: string[];
  board_response_received: boolean;
  board_feedback: string;
  actions_agreed: BoardAgreedAction[];
  evidence_attachments: string[];
  child_outcomes_narrative: string;
  distribution_list: string[];
  retention_period: string;
  next_report_due: string;
  created_at: string;
}

// ── Batch 29 ────────────────────────────────────────────────────────────────

// ── Building Asbestos Register (home-level) ──────────────────────────────────

export type AsbestosSurveyType =
  | "management_survey"
  | "refurbishment_demolition_survey"
  | "re_inspection"
  | "air_monitoring"
  | "removal_record";

export const ASBESTOS_SURVEY_TYPE_LABEL: Record<AsbestosSurveyType, string> = {
  management_survey: "Management Survey",
  refurbishment_demolition_survey: "Refurbishment & Demolition Survey",
  re_inspection: "Re-inspection",
  air_monitoring: "Air monitoring",
  removal_record: "Removal record",
};

export type AsbestosConditionRating =
  | "no_acm_identified"
  | "good_condition_sealed"
  | "minor_damage_encapsulated"
  | "significant_damage_action_required"
  | "removed";

export const ASBESTOS_CONDITION_RATING_LABEL: Record<AsbestosConditionRating, string> = {
  no_acm_identified: "No ACM identified",
  good_condition_sealed: "Good condition — sealed",
  minor_damage_encapsulated: "Minor damage — encapsulated",
  significant_damage_action_required: "Significant damage — action required",
  removed: "Removed",
};

export type AsbestosReinspectionFrequency =
  | "annual"
  | "bi_annual"
  | "on_disturbance_only"
  | "not_applicable";

export const ASBESTOS_REINSPECTION_FREQUENCY_LABEL: Record<AsbestosReinspectionFrequency, string> = {
  annual: "Annual",
  bi_annual: "Bi-annual",
  on_disturbance_only: "On disturbance only",
  not_applicable: "Not applicable",
};

export interface AsbestosRemovalContractor {
  name: string;
  hse_licence_number: string;
  date: string;
}

export interface AsbestosRecord {
  id: string;
  survey_date: string;
  survey_type: AsbestosSurveyType;
  surveyor: string;
  surveyor_accreditation: string;
  certificate_number: string;
  building_area: string;
  acm_identified: boolean;
  acm_type?: string;
  condition_rating: AsbestosConditionRating;
  management_action: string;
  removal_contractor?: AsbestosRemovalContractor;
  encapsulation_details?: string;
  reinspection_frequency: AsbestosReinspectionFrequency;
  next_inspection_due?: string;
  tradesperson_briefings_required: boolean;
  notes_for_contractors?: string;
  recorded_by: string;
  flags_concerns: string[];
  created_at: string;
}

// ── Building Pest Control (home-level) ───────────────────────────────────────

export type PestRecordType =
  | "routine_preventive_treatment"
  | "reactive_call_out"
  | "annual_contract_review"
  | "bait_station_refresh"
  | "survey_only"
  | "follow_up_monitoring";

export const PEST_RECORD_TYPE_LABEL: Record<PestRecordType, string> = {
  routine_preventive_treatment: "Routine preventive treatment",
  reactive_call_out: "Reactive call-out",
  annual_contract_review: "Annual contract review",
  bait_station_refresh: "Bait station refresh",
  survey_only: "Survey only",
  follow_up_monitoring: "Follow-up monitoring",
};

export type PestCategory =
  | "mice"
  | "rats"
  | "ants"
  | "wasps_hornets"
  | "silverfish"
  | "bedbugs"
  | "cockroaches"
  | "moths"
  | "pigeons"
  | "mixed_general"
  | "none_preventive_only";

export const PEST_CATEGORY_LABEL: Record<PestCategory, string> = {
  mice: "Mice",
  rats: "Rats",
  ants: "Ants",
  wasps_hornets: "Wasps / hornets",
  silverfish: "Silverfish",
  bedbugs: "Bedbugs",
  cockroaches: "Cockroaches",
  moths: "Moths",
  pigeons: "Pigeons",
  mixed_general: "Mixed / general",
  none_preventive_only: "None — preventive only",
};

export interface PestRecord {
  id: string;
  record_date: string;
  record_type: PestRecordType;
  pest_category: PestCategory;
  affected_areas: string[];
  contractor: string;
  contractor_accreditation: string;
  treatment_method: string[];
  chemicals_used: string[];
  child_safety_measures: string[];
  child_informed_and_paced: boolean;
  prevention_advice: string[];
  follow_up_required: boolean;
  follow_up_date?: string;
  cost_paid?: number;
  outcome_evidence: string;
  recorded_by: string;
  flags_concerns: string[];
  created_at: string;
}

// ── Building Window Restrictor Checks (home-level) ───────────────────────────

export type WindowType =
  | "sash"
  | "casement"
  | "tilt_and_turn"
  | "top_hung"
  | "skylight"
  | "other";

export const WINDOW_TYPE_LABEL: Record<WindowType, string> = {
  sash: "Sash",
  casement: "Casement",
  tilt_and_turn: "Tilt-and-turn",
  top_hung: "Top-hung",
  skylight: "Skylight",
  other: "Other",
};

export type WindowFloorLevel =
  | "ground"
  | "first"
  | "second"
  | "third"
  | "loft_above";

export const WINDOW_FLOOR_LEVEL_LABEL: Record<WindowFloorLevel, string> = {
  ground: "Ground",
  first: "First",
  second: "Second",
  third: "Third",
  loft_above: "Loft / above",
};

export type RestrictorType =
  | "cable_key"
  | "permanent_fixed"
  | "pin_lock"
  | "combination"
  | "standard_window_lock"
  | "none_child_accessible";

export const RESTRICTOR_TYPE_LABEL: Record<RestrictorType, string> = {
  cable_key: "Cable + key",
  permanent_fixed: "Permanent fixed",
  pin_lock: "Pin lock",
  combination: "Combination",
  standard_window_lock: "Standard window lock",
  none_child_accessible: "None — child-accessible",
};

export type WindowCheckOutcome =
  | "pass"
  | "pass_with_advisory"
  | "remedial_required"
  | "failed_restrict_immediately";

export const WINDOW_CHECK_OUTCOME_LABEL: Record<WindowCheckOutcome, string> = {
  pass: "Pass",
  pass_with_advisory: "Pass with advisory",
  remedial_required: "Remedial required",
  failed_restrict_immediately: "Failed — restrict immediately",
};

export interface WindowCheck {
  id: string;
  inspection_date: string;
  window_location: string;
  window_type: WindowType;
  floor_level: WindowFloorLevel;
  restrictor_present: boolean;
  restrictor_type: RestrictorType;
  restrictor_working: boolean;
  key_location?: string;
  opening_maximum_cm: number;
  opening_compliance_with_100mm_rule: boolean;
  signage_in_place: boolean;
  child_aware: boolean;
  damage_noted: string[];
  remedial_actions: string[];
  outcome: WindowCheckOutcome;
  inspected_by: string;
  flags_concerns: string[];
  next_due_date: string;
  created_at: string;
}

// ── Business Continuity (home-level) ─────────────────────────────────────────

export type BcpSeverity = "critical" | "high" | "medium";

export const BCP_SEVERITY_LABEL: Record<BcpSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
};

export interface BcpScenarioPlan {
  id: string;
  title: string;
  icon_key: string;
  severity: BcpSeverity;
  content: string[];
  created_at: string;
}

// ── Case File Audit (child-level) ────────────────────────────────────────────

export type CaseFileAuditType =
  | "quarterly"
  | "annual"
  | "pre_inspection"
  | "targeted"
  | "triggered_by_concern";

export const CASE_FILE_AUDIT_TYPE_LABEL: Record<CaseFileAuditType, string> = {
  quarterly: "Quarterly",
  annual: "Annual",
  pre_inspection: "Pre-Inspection",
  targeted: "Targeted",
  triggered_by_concern: "Triggered by concern",
};

export type CaseFileActionStatus =
  | "open"
  | "in_progress"
  | "complete"
  | "overdue";

export const CASE_FILE_ACTION_STATUS_LABEL: Record<CaseFileActionStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  complete: "Complete",
  overdue: "Overdue",
};

export interface CaseFileSectionAudit {
  section: string;
  score: number;
  rag_rating: RagRating;
  findings: string;
  required_actions: string[];
}

export interface CaseFilePriorityAction {
  action: string;
  owner: string;
  deadline: string;
  status: CaseFileActionStatus;
}

export interface CaseFileAudit {
  id: string;
  child_id: string;
  audit_date: string;
  auditor: string;
  audit_type: CaseFileAuditType;
  sections_audited: CaseFileSectionAudit[];
  overall_rag_rating: RagRating;
  overall_score: number;
  strengths_identified: string[];
  gaps_identified: string[];
  priority_actions: CaseFilePriorityAction[];
  child_contributed_to_audit: boolean;
  child_observation: string;
  next_audit_due: string;
  created_at: string;
}

// ── Child Money Management & Budgeting (child-level) ─────────────────────────

export type MoneySkillCategory =
  | "weekly_budget"
  | "bank_app_fluency"
  | "comparison_shopping"
  | "reading_contracts"
  | "scam_recognition"
  | "cashflow_planning"
  | "payslip_reading"
  | "debt_awareness"
  | "tax_ni_literacy"
  | "pension_awareness"
  | "bnpl_risks"
  | "uc_benefits_literacy";

export const MONEY_SKILL_CATEGORY_LABEL: Record<MoneySkillCategory, string> = {
  weekly_budget: "Weekly budget",
  bank_app_fluency: "Bank app fluency",
  comparison_shopping: "Comparison shopping",
  reading_contracts: "Reading contracts",
  scam_recognition: "Scam recognition",
  cashflow_planning: "Cashflow planning",
  payslip_reading: "Payslip reading",
  debt_awareness: "Debt awareness",
  tax_ni_literacy: "Tax & NI literacy",
  pension_awareness: "Pension awareness",
  bnpl_risks: "Buy-now-pay-later (BNPL) risks",
  uc_benefits_literacy: "Universal Credit / benefits literacy",
};

export type MoneyCompetency =
  | "not_yet_introduced"
  | "aware"
  | "did_with_help"
  | "did_independently"
  | "confident";

export const MONEY_COMPETENCY_LABEL: Record<MoneyCompetency, string> = {
  not_yet_introduced: "Not yet introduced",
  aware: "Aware",
  did_with_help: "Did with help",
  did_independently: "Did independently",
  confident: "Confident",
};

export interface MoneyRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  skill_category: MoneySkillCategory;
  competency: MoneyCompetency;
  practical_examples: string[];
  real_world_application: string[];
  tools_used: string[];
  challenges_faced: string[];
  child_money_values_notes?: string;
  child_voice: string;
  staff_observation: string;
  next_step: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

/* ─── batch 30 ─── */

/* ── Orthodontic Treatment ── */

export type OrthoStage =
  | "awaiting_referral"
  | "referred_assessment_booked"
  | "assessed_on_waiting_list"
  | "active_treatment"
  | "retention_phase"
  | "discharged"
  | "not_currently_indicated";

export const ORTHO_STAGE_LABEL: Record<OrthoStage, string> = {
  awaiting_referral: "Awaiting referral",
  referred_assessment_booked: "Referred — assessment booked",
  assessed_on_waiting_list: "Assessed — on waiting list",
  active_treatment: "Active treatment",
  retention_phase: "Retention phase",
  discharged: "Discharged",
  not_currently_indicated: "Not currently indicated",
};

export type OrthoTreatmentType =
  | "fixed_metal_braces"
  | "fixed_ceramic_braces"
  | "removable_functional_appliance"
  | "twin_block"
  | "clear_aligners"
  | "lingual"
  | "other";

export const ORTHO_TREATMENT_TYPE_LABEL: Record<OrthoTreatmentType, string> = {
  fixed_metal_braces: "Fixed metal braces",
  fixed_ceramic_braces: "Fixed ceramic braces",
  removable_functional_appliance: "Removable functional appliance",
  twin_block: "Twin block",
  clear_aligners: "Clear aligners (Invisalign)",
  lingual: "Lingual",
  other: "Other",
};

export type OrthoHygieneCompliance =
  | "excellent"
  | "good"
  | "fair"
  | "poor_needs_support"
  | "not_yet_started";

export const ORTHO_HYGIENE_COMPLIANCE_LABEL: Record<OrthoHygieneCompliance, string> = {
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  poor_needs_support: "Poor — needs support",
  not_yet_started: "Not yet started",
};

export type OrthoMotivation =
  | "high"
  | "moderate"
  | "mixed"
  | "low_wants_to_stop";

export const ORTHO_MOTIVATION_LABEL: Record<OrthoMotivation, string> = {
  high: "High",
  moderate: "Moderate",
  mixed: "Mixed",
  low_wants_to_stop: "Low / wants to stop",
};

export interface OrthoEmergencyContact {
  name: string;
  role: string;
  phone: string;
}

export interface OrthoRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  stage: OrthoStage;
  iotn_score?: string;
  nhs_eligible: boolean;
  private_option?: string;
  treatment_type?: OrthoTreatmentType;
  orthodontist?: string;
  practice_name?: string;
  start_date?: string;
  expected_end_date?: string;
  appointment_frequency?: string;
  appointments_attended: number;
  appointments_missed: number;
  oral_hygiene_compliance: OrthoHygieneCompliance;
  retainer_wear_reported_nightly?: boolean;
  retainer_type?: string;
  child_motivation: OrthoMotivation;
  emergency_contacts: OrthoEmergencyContact[];
  cost_covered?: string;
  child_voice: string;
  staff_observation: string;
  flags_concerns: string[];
  review_date: string;
  key_worker: string;
  created_at: string;
}

/* ── Participation Log ── */

export type ParticipationCategory =
  | "care_planning"
  | "house_rules"
  | "activities"
  | "environment"
  | "staffing"
  | "complaints"
  | "menu"
  | "policy";

export const PARTICIPATION_CATEGORY_LABEL: Record<ParticipationCategory, string> = {
  care_planning: "Care Planning",
  house_rules: "House Rules",
  activities: "Activities",
  environment: "Environment",
  staffing: "Staffing",
  complaints: "Complaints",
  menu: "Menu",
  policy: "Policy",
};

export type ParticipationEvidenceType =
  | "house_meeting"
  | "key_work"
  | "one_to_one"
  | "survey"
  | "reg44_interview"
  | "lac_review"
  | "informal";

export const PARTICIPATION_EVIDENCE_TYPE_LABEL: Record<ParticipationEvidenceType, string> = {
  house_meeting: "House Meeting",
  key_work: "Key Work",
  one_to_one: "1:1 Discussion",
  survey: "Survey",
  reg44_interview: "Reg 44 Interview",
  lac_review: "LAC Review",
  informal: "Informal",
};

export interface ParticipationEntry {
  id: string;
  date: string;
  context: string;
  category: ParticipationCategory;
  children_involved: string[];
  how_consulted: string;
  what_child_said: string;
  decision_made: string;
  child_influenced: boolean;
  influence_description: string;
  feedback_given: string;
  recorded_by: string;
  evidence_type: ParticipationEvidenceType;
  created_at: string;
}

/* ── Religious Rite Milestones ── */

export type RiteFaithTradition =
  | "islam"
  | "christianity"
  | "judaism"
  | "hinduism"
  | "sikhism"
  | "buddhism"
  | "rastafari"
  | "multi_faith_family_choice"
  | "other";

export const RITE_FAITH_TRADITION_LABEL: Record<RiteFaithTradition, string> = {
  islam: "Islam",
  christianity: "Christianity",
  judaism: "Judaism",
  hinduism: "Hinduism",
  sikhism: "Sikhism",
  buddhism: "Buddhism",
  rastafari: "Rastafari",
  multi_faith_family_choice: "Multi-faith / family choice",
  other: "Other",
};

export type RiteStatus =
  | "already_done_pre_care"
  | "planned_with_home_support"
  | "considering_child_led"
  | "declined_by_child"
  | "postponed"
  | "not_applicable"
  | "done_in_care";

export const RITE_STATUS_LABEL: Record<RiteStatus, string> = {
  already_done_pre_care: "Already done (pre-care)",
  planned_with_home_support: "Planned with home support",
  considering_child_led: "Considering — child-led",
  declined_by_child: "Declined by child",
  postponed: "Postponed",
  not_applicable: "Not applicable",
  done_in_care: "Done in care",
};

export type RiteChildChoice =
  | "strongly_chose"
  | "family_influenced_choice"
  | "choosing_between_options"
  | "not_yet_old_enough_to_choose";

export const RITE_CHILD_CHOICE_LABEL: Record<RiteChildChoice, string> = {
  strongly_chose: "Strongly chose",
  family_influenced_choice: "Family-influenced choice",
  choosing_between_options: "Choosing between options",
  not_yet_old_enough_to_choose: "Not yet old enough to choose",
};

export interface RiteCostFunding {
  amount: number;
  source: string;
}

export interface RiteRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  rite_name: string;
  faith_tradition: RiteFaithTradition;
  child_age_at_rite?: number;
  status: RiteStatus;
  significance: string;
  preparation: string[];
  who_officiates?: string;
  venue?: string;
  guests_involved: string[];
  home_support_provided: string[];
  cost_funding?: RiteCostFunding;
  child_choice: RiteChildChoice;
  birth_family_involvement?: string;
  record_kept: string[];
  child_voice: string;
  staff_observation: string;
  flags_for_review: string[];
  review_date: string;
  key_worker: string;
  created_at: string;
}

/* ── School Uniform & Shoes Tracker ── */

export type UniformCategory =
  | "school_uniform"
  | "pe_kit"
  | "school_shoes"
  | "trainers"
  | "coat_outerwear"
  | "casual_clothing_audit"
  | "bag_equipment";

export const UNIFORM_CATEGORY_LABEL: Record<UniformCategory, string> = {
  school_uniform: "School uniform",
  pe_kit: "PE kit",
  school_shoes: "School shoes",
  trainers: "Trainers",
  coat_outerwear: "Coat / outerwear",
  casual_clothing_audit: "Casual clothing audit",
  bag_equipment: "Bag / equipment",
};

export type UniformItemCondition =
  | "new"
  | "good"
  | "worn_fits"
  | "worn_getting_tight"
  | "outgrown"
  | "damaged";

export const UNIFORM_ITEM_CONDITION_LABEL: Record<UniformItemCondition, string> = {
  new: "New",
  good: "Good",
  worn_fits: "Worn — fits",
  worn_getting_tight: "Worn — getting tight",
  outgrown: "Outgrown",
  damaged: "Damaged",
};

export type UniformFundingSource =
  | "pupil_premium_plus"
  | "virtual_school_grant"
  | "leaving_care_fund"
  | "home_clothing_budget"
  | "school_voucher"
  | "charity"
  | "mixed";

export const UNIFORM_FUNDING_SOURCE_LABEL: Record<UniformFundingSource, string> = {
  pupil_premium_plus: "Pupil Premium Plus",
  virtual_school_grant: "Virtual School grant",
  leaving_care_fund: "Leaving Care fund",
  home_clothing_budget: "Home clothing budget",
  school_voucher: "School voucher",
  charity: "Charity (e.g., school uniform exchange)",
  mixed: "Mixed",
};

export interface UniformItemDetail {
  item: string;
  size: string;
  condition: UniformItemCondition;
  purchase_date?: string;
  cost?: number;
}

export interface UniformRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  category: UniformCategory;
  item_details: UniformItemDetail[];
  total_cost_this_record: number;
  funding_source: UniformFundingSource;
  child_chose_style: boolean;
  child_chose_shop: boolean;
  shopping_trip?: string;
  school_uniform_policy_met: boolean;
  child_comfort_notes: string;
  sensory_considerations: string[];
  growth_note_cm?: string;
  shoe_size?: string;
  next_size_anticipated: string;
  next_review_date: string;
  recorded_by: string;
  flags_concerns: string[];
  created_at: string;
}

/* ── Speech & Language Therapy ── */

export type SaltArea =
  | "articulation"
  | "phonology"
  | "receptive_language"
  | "expressive_language"
  | "pragmatic_social_communication"
  | "voice"
  | "stammer_fluency"
  | "selective_mutism"
  | "aac"
  | "literacy_linked";

export const SALT_AREA_LABEL: Record<SaltArea, string> = {
  articulation: "Articulation",
  phonology: "Phonology",
  receptive_language: "Receptive language",
  expressive_language: "Expressive language",
  pragmatic_social_communication: "Pragmatic / social communication",
  voice: "Voice",
  stammer_fluency: "Stammer / fluency",
  selective_mutism: "Selective mutism",
  aac: "AAC (alternative communication)",
  literacy_linked: "Literacy linked",
};

export type SaltStatus =
  | "awaiting_referral"
  | "assessed_no_salt_needed"
  | "active"
  | "maintenance_monitoring"
  | "discharged";

export const SALT_STATUS_LABEL: Record<SaltStatus, string> = {
  awaiting_referral: "Awaiting referral",
  assessed_no_salt_needed: "Assessed — no SaLT needed",
  active: "Active",
  maintenance_monitoring: "Maintenance / monitoring",
  discharged: "Discharged",
};

export type SaltGoalStatus =
  | "achieved"
  | "on_track"
  | "slow_progress"
  | "not_started";

export const SALT_GOAL_STATUS_LABEL: Record<SaltGoalStatus, string> = {
  achieved: "Achieved",
  on_track: "On track",
  slow_progress: "Slow progress",
  not_started: "Not started",
};

export interface SaltGoal {
  goal: string;
  baseline_date: string;
  target_date?: string;
  status: SaltGoalStatus;
}

export interface SaltRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  area: SaltArea;
  status: SaltStatus;
  salt_service: string;
  salt_clinician?: string;
  start_date?: string;
  goals: SaltGoal[];
  strategies_used: string[];
  tools_resources: string[];
  home_programme_frequency?: string;
  home_programme_who_supports: string[];
  school_involvement: string[];
  hearing_clearance: boolean;
  bilingual_considerations?: string;
  child_comfort_discussing_comm: 1 | 2 | 3 | 4 | 5;
  flags_concerns: string[];
  child_voice: string;
  staff_observation: string;
  next_appointment?: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

/* ── Swimming & Water Safety ── */

export type SwimmingLevel =
  | "pre_stage_1"
  | "stage_1"
  | "stage_2"
  | "stage_3"
  | "stage_4"
  | "stage_5"
  | "stage_6"
  | "stage_7"
  | "beyond_stages"
  | "not_currently_swimming";

export const SWIMMING_LEVEL_LABEL: Record<SwimmingLevel, string> = {
  pre_stage_1: "Pre-Stage 1 (water shy)",
  stage_1: "Stage 1",
  stage_2: "Stage 2",
  stage_3: "Stage 3",
  stage_4: "Stage 4",
  stage_5: "Stage 5",
  stage_6: "Stage 6",
  stage_7: "Stage 7",
  beyond_stages: "Beyond stages — recreational competent",
  not_currently_swimming: "Not currently swimming",
};

export interface SwimRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  swimming_level: SwimmingLevel;
  can_swim_25m: boolean;
  can_tread_water: boolean;
  can_float_back: boolean;
  comfortable_underwater: boolean;
  lessons_booked_active: boolean;
  lesson_provider?: string;
  lesson_frequency?: string;
  lessons_cost?: number;
  home_funding_source?: string;
  school_swimming_done: boolean;
  school_swimming_outcome?: string;
  beach_safety_aware: string[];
  open_water_awareness: string[];
  life_jacket_usage: string[];
  triggers_to_water_shy: string[];
  child_voice: string;
  staff_observation: string;
  next_step: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

/* ─── batch 31 ─── */

/* ── Volunteering & Charity ── */

export type VolunteerCategory =
  | "charity_fundraising"
  | "community_volunteering"
  | "mosque_temple_church"
  | "sport_coaching_refereeing"
  | "animal_welfare"
  | "environmental"
  | "befriending_mentoring"
  | "youth_advocacy"
  | "school_peer_support"
  | "other";

export const VOLUNTEER_CATEGORY_LABEL: Record<VolunteerCategory, string> = {
  charity_fundraising: "Charity fundraising",
  community_volunteering: "Community volunteering",
  mosque_temple_church: "Mosque/temple/church",
  sport_coaching_refereeing: "Sport — coaching/refereeing",
  animal_welfare: "Animal welfare",
  environmental: "Environmental",
  befriending_mentoring: "Befriending/mentoring",
  youth_advocacy: "Youth advocacy",
  school_peer_support: "School / peer support",
  other: "Other",
};

export interface VolunteerRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  activity: string;
  category: VolunteerCategory;
  organisation?: string;
  start_date: string;
  ongoing: boolean;
  end_date?: string;
  hours_this_month: number;
  hours_total: number;
  child_initiated: boolean;
  motivation_stated: string;
  skills_built: string[];
  funds_raised?: number;
  beneficiaries_reached?: string;
  recognition_received: string[];
  risk_assessment_done: boolean;
  safeguarding_checked: boolean;
  child_voice: string;
  staff_observation: string;
  cv_added_to: boolean;
  review_date: string;
  key_worker: string;
  created_at: string;
}

/* ── Work Experience ── */

export type WorkExpType =
  | "year_10_placement"
  | "post_16_placement"
  | "taster_day"
  | "career_exploration_meeting"
  | "employer_mentor_session"
  | "apprenticeship_taster"
  | "volunteering_placement"
  | "vocational_course_visit"
  | "university_taster";

export const WORK_EXP_TYPE_LABEL: Record<WorkExpType, string> = {
  year_10_placement: "Year 10 placement",
  post_16_placement: "Post-16 placement",
  taster_day: "Taster day",
  career_exploration_meeting: "Career exploration meeting",
  employer_mentor_session: "Employer mentor session",
  apprenticeship_taster: "Apprenticeship taster",
  volunteering_placement: "Volunteering placement (counts as work exp)",
  vocational_course_visit: "Vocational course visit",
  university_taster: "University taster",
};

export interface WorkExpRecord {
  id: string;
  child_id: string;
  recorded_date: string;
  type: WorkExpType;
  employer?: string;
  industry: string;
  start_date: string;
  end_date?: string;
  days_hours_total: string;
  supervisor_name?: string;
  supervisor_role?: string;
  tasks_undertaken: string[];
  skills_built: string[];
  challenges_faced: string[];
  employer_feedback?: string;
  child_reflection: string;
  links_to_aspirations: string[];
  follow_up_opportunity?: string;
  risk_assessment_done: boolean;
  safeguarding_checked: boolean;
  travel_budget_used?: number;
  child_voice: string;
  staff_observation: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

/* ── Children Pledges ── */

export type PledgeCategory =
  | "safety"
  | "respect"
  | "opportunity"
  | "belonging"
  | "voice"
  | "identity";

export const PLEDGE_CATEGORY_LABEL: Record<PledgeCategory, string> = {
  safety: "Safety",
  respect: "Respect",
  opportunity: "Opportunity",
  belonging: "Belonging",
  voice: "Voice",
  identity: "Identity",
};

export type PledgeStatus =
  | "consistently_met"
  | "mostly_met"
  | "working_on_it"
  | "not_yet_met";

export const PLEDGE_STATUS_LABEL: Record<PledgeStatus, string> = {
  consistently_met: "Consistently Met",
  mostly_met: "Mostly Met",
  working_on_it: "Working On It",
  not_yet_met: "Not Yet Met",
};

export interface ChildPledge {
  id: string;
  child_id: string;
  pledge_category: PledgeCategory;
  pledge: string;
  how_we_deliver: string;
  evidence_of_delivery: string[];
  child_feedback: string;
  status: PledgeStatus;
  last_review_date: string;
  reviewed_with: string;
  created_date: string;
  uncrc_article: string;
  created_at: string;
}

/* ── Cleaning Rota ── */

export type CleaningShift =
  | "morning"
  | "late"
  | "sleep_in"
  | "wake_night"
  | "deep_clean_scheduled";

export const CLEANING_SHIFT_LABEL: Record<CleaningShift, string> = {
  morning: "Morning",
  late: "Late",
  sleep_in: "Sleep-in",
  wake_night: "Wake-night",
  deep_clean_scheduled: "Deep clean (scheduled)",
};

export type CleaningArea =
  | "kitchen"
  | "lounge"
  | "hallway_stairs"
  | "office"
  | "communal_bathroom"
  | "laundry"
  | "garden_external"
  | "sensory_space"
  | "childrens_bathrooms"
  | "whole_home";

export const CLEANING_AREA_LABEL: Record<CleaningArea, string> = {
  kitchen: "Kitchen",
  lounge: "Lounge",
  hallway_stairs: "Hallway/Stairs",
  office: "Office",
  communal_bathroom: "Communal bathroom",
  laundry: "Laundry",
  garden_external: "Garden/External",
  sensory_space: "Sensory space",
  childrens_bathrooms: "Children's bathrooms (with consent)",
  whole_home: "Whole home (deep clean)",
};

export type CleaningType =
  | "routine"
  | "spot_clean"
  | "deep_clean"
  | "post_incident"
  | "hygiene_escalation";

export const CLEANING_TYPE_LABEL: Record<CleaningType, string> = {
  routine: "Routine",
  spot_clean: "Spot clean",
  deep_clean: "Deep clean",
  post_incident: "Post-incident",
  hygiene_escalation: "Hygiene escalation",
};

export type CleaningChildInvolvement =
  | "none"
  | "observed"
  | "helped_age_appropriate"
  | "lead_with_support";

export const CLEANING_CHILD_INVOLVEMENT_LABEL: Record<CleaningChildInvolvement, string> = {
  none: "None",
  observed: "Observed",
  helped_age_appropriate: "Helped (age-appropriate)",
  lead_with_support: "Lead with support",
};

export interface CleaningTask {
  task: string;
  completed: boolean;
  notes: string;
}

export interface CleaningEntry {
  id: string;
  date: string;
  shift: CleaningShift;
  area: CleaningArea;
  staff_member: string;
  cleaning_type: CleaningType;
  duration_minutes: number;
  tasks_completed: CleaningTask[];
  products_used: string[];
  allergy_aware: boolean;
  child_involvement: CleaningChildInvolvement;
  children_who_helped: string;
  child_learning_points: string;
  items_requiring_attention: string[];
  defects_logged: string[];
  follow_up_actions: string[];
  signed_off: boolean;
  signed_off_by: string;
  notes: string;
  created_at: string;
}

/* ── Community Engagement ── */

export type CommunityActivityType =
  | "sports_fitness"
  | "arts_culture"
  | "volunteering"
  | "education"
  | "religious_spiritual"
  | "social"
  | "civic"
  | "environmental";

export const COMMUNITY_ACTIVITY_TYPE_LABEL: Record<CommunityActivityType, string> = {
  sports_fitness: "Sports/Fitness",
  arts_culture: "Arts/Culture",
  volunteering: "Volunteering",
  education: "Education",
  religious_spiritual: "Religious/Spiritual",
  social: "Social",
  civic: "Civic",
  environmental: "Environmental",
};

export interface CommunityEngagement {
  id: string;
  date: string;
  young_people: string[];
  activity_type: CommunityActivityType;
  activity: string;
  location: string;
  organisation: string;
  duration_minutes: number;
  staff_present: string[];
  outcomes: string[];
  child_feedback: string;
  builds_connections: boolean;
  ongoing_commitment: boolean;
  recorded_by: string;
  notes: string;
  created_at: string;
}

/* ── Complaint Resolution Meetings ── */

export type ResolutionComplainantType =
  | "child"
  | "parent"
  | "social_worker"
  | "other_professional"
  | "member_of_public";

export const COMPLAINANT_TYPE_LABEL: Record<ResolutionComplainantType, string> = {
  child: "Child",
  parent: "Parent",
  social_worker: "Social Worker",
  other_professional: "Other Professional",
  member_of_public: "Member of Public",
};

export type MeetingType =
  | "stage_1_informal"
  | "stage_2_formal"
  | "stage_3_external_review"
  | "restorative"
  | "apology_meeting";

export const MEETING_TYPE_LABEL: Record<MeetingType, string> = {
  stage_1_informal: "Stage 1 - Informal",
  stage_2_formal: "Stage 2 - Formal",
  stage_3_external_review: "Stage 3 - External Review",
  restorative: "Restorative",
  apology_meeting: "Apology meeting",
};

export type MeetingFormat = "in_person" | "video_call" | "phone";

export const MEETING_FORMAT_LABEL: Record<MeetingFormat, string> = {
  in_person: "In person",
  video_call: "Video call",
  phone: "Phone",
};

export type ComplainantSatisfaction = "satisfied" | "partially_satisfied" | "not_satisfied";

export const COMPLAINANT_SATISFACTION_LABEL: Record<ComplainantSatisfaction, string> = {
  satisfied: "Satisfied",
  partially_satisfied: "Partially satisfied",
  not_satisfied: "Not satisfied",
};

export type FollowUpActionStatus = "open" | "in_progress" | "done";

export const FOLLOW_UP_ACTION_STATUS_LABEL: Record<FollowUpActionStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  done: "Done",
};

export interface ComplaintFollowUpAction {
  action: string;
  owner: string;
  deadline: string;
  status: FollowUpActionStatus;
}

export interface ResolutionMeeting {
  id: string;
  date: string;
  duration_minutes: number;
  complainant_type: ResolutionComplainantType;
  complainant_identifier: string;
  original_complaint_ref: string;
  complaint_summary: string;
  meeting_type: MeetingType;
  facilitator: string;
  attendees_home: string[];
  external_attendees: string[];
  child_present: boolean;
  child_support_person: string;
  meeting_format: MeetingFormat;
  agenda: string[];
  complainant_opening: string;
  home_response: string;
  points_of_agreement: string[];
  points_of_disagreement: string[];
  apology_offered: boolean;
  apology_accepted_by_complainant: boolean;
  practice_changes_agreed: string[];
  follow_up_actions: ComplaintFollowUpAction[];
  resolution_achieved: boolean;
  complainant_satisfaction: ComplainantSatisfaction;
  will_escalate: boolean;
  feedback_on_process: string;
  minuted_by: string;
  minutes_shared: boolean;
  minutes_shared_date: string;
  created_at: string;
}

/* ─── batch 32 ─── */

/* ── Consequence Framework ── */

export type BehaviourLevel = "low" | "medium" | "high" | "crisis";

export const BEHAVIOUR_LEVEL_LABEL: Record<BehaviourLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  crisis: "Crisis",
};

export type ConsequenceApproach =
  | "restorative_conversation"
  | "natural_consequence"
  | "logical_consequence"
  | "repair_activity"
  | "relational_repair"
  | "boundary_reset";

export const CONSEQUENCE_APPROACH_LABEL: Record<ConsequenceApproach, string> = {
  restorative_conversation: "Restorative conversation",
  natural_consequence: "Natural consequence",
  logical_consequence: "Logical consequence",
  repair_activity: "Repair activity",
  relational_repair: "Relational repair",
  boundary_reset: "Boundary reset",
};

export interface ConsequenceRecord {
  id: string;
  child_id: string;
  date: string;
  behaviour: string;
  behaviour_level: BehaviourLevel;
  approach: ConsequenceApproach;
  description: string;
  child_voice: string;
  staff_response: string;
  restorative_questions: string[];
  outcome: string;
  relationship_repaired: boolean;
  follow_up: string;
  recorded_by: string;
  linked_behaviour_plan: boolean;
  created_at: string;
}

/* ── Contact Plans ── */

export type ContactMethodType = "face_to_face" | "phone" | "video" | "letter" | "supervised";

export const CONTACT_METHOD_TYPE_LABEL: Record<ContactMethodType, string> = {
  face_to_face: "Face to face",
  phone: "Phone",
  video: "Video",
  letter: "Letter",
  supervised: "Supervised",
};

export type ContactPlanSupervisionLevel = "unsupervised" | "monitored" | "supervised" | "no_contact";

export const CONTACT_PLAN_SUPERVISION_LEVEL_LABEL: Record<ContactPlanSupervisionLevel, string> = {
  unsupervised: "Unsupervised",
  monitored: "Monitored",
  supervised: "Supervised",
  no_contact: "No contact",
};

export type ContactPlanStatus = "active" | "under_review" | "suspended";

export const CONTACT_PLAN_STATUS_LABEL: Record<ContactPlanStatus, string> = {
  active: "Active",
  under_review: "Under review",
  suspended: "Suspended",
};

export interface ContactPlanArrangement {
  contact_with: string;
  relationship: string;
  frequency: string;
  duration: string;
  type: ContactMethodType;
  supervision_level: ContactPlanSupervisionLevel;
  supervision_reason: string | null;
  venue: string;
  notes: string;
}

export interface ContactPlan {
  id: string;
  child_id: string;
  created_by: string;
  created_date: string;
  review_date: string;
  status: ContactPlanStatus;
  arrangements: ContactPlanArrangement[];
  child_wishes: string;
  court_orders: string | null;
  risk_factors: string[];
  positive_factors: string[];
  overall_assessment: string;
  last_reviewed_date: string;
  next_scheduled_contact: string;
  created_at: string;
}

/* ── Daily Routine Plans ── */

export type RoutinePlanStatus = "active" | "under_review";

export const ROUTINE_PLAN_STATUS_LABEL: Record<RoutinePlanStatus, string> = {
  active: "Active",
  under_review: "Under review",
};

export interface RoutineSlot {
  time: string;
  activity: string;
  support: string;
  flexibility: string;
}

export interface DailyRoutinePlan {
  id: string;
  child_id: string;
  created_by: string;
  created_date: string;
  review_date: string;
  status: RoutinePlanStatus;
  weekday_routine: RoutineSlot[];
  weekend_routine: RoutineSlot[];
  sensory_considerations: string[];
  transition_support: string[];
  child_input: string;
  flexibility: string;
  notes: string;
  created_at: string;
}

/* ── Dietary Requirements ── */

export type DietaryAllergySeverity = "life_threatening" | "severe" | "moderate" | "mild";

export const DIETARY_ALLERGY_SEVERITY_LABEL: Record<DietaryAllergySeverity, string> = {
  life_threatening: "Life-threatening",
  severe: "Severe",
  moderate: "Moderate",
  mild: "Mild",
};

export interface AllergyEntry {
  allergen: string;
  severity: DietaryAllergySeverity;
  reaction: string;
  treatment: string;
}

export interface GrowthMonitoring {
  last_weight: string;
  last_weight_date: string;
  last_height: string;
  last_height_date: string;
  concerns: string;
}

export interface DietaryPlan {
  id: string;
  child_id: string;
  allergies: AllergyEntry[];
  intolerances: string[];
  medical_dietary_needs: string[];
  religious_dietary_needs: string;
  ethical_choices: string;
  sensory_food_needs: string[];
  preferred_foods: string[];
  disliked_foods: string[];
  always_available: string[];
  forbidden: string[];
  texture_requirements: string;
  portion_guidance: string;
  hydration_needs: string;
  mealtime_routines: string[];
  mealtime_challenges: string[];
  support_at_meals: string;
  social_eating_preferences: string;
  cooking_involvement: string;
  shopping_involvement: string;
  growth_monitoring: GrowthMonitoring;
  reviewed_by: string;
  reviewed_date: string;
  reviewed_with_child: boolean;
  child_agreed: boolean;
  signed_off_by_dietitian: boolean;
  next_review_date: string;
  created_at: string;
}

/* ── Digital Wellbeing Plan ── */

export type ParentalControlLevel =
  | "none_age_appropriate_trust"
  | "light"
  | "standard"
  | "high";

export const PARENTAL_CONTROL_LEVEL_LABEL: Record<ParentalControlLevel, string> = {
  none_age_appropriate_trust: "None (age-appropriate trust)",
  light: "Light",
  standard: "Standard",
  high: "High",
};

export type OnlineSafetyLevel = "strong" | "developing" | "emerging" | "needs_work";

export const ONLINE_SAFETY_LEVEL_LABEL: Record<OnlineSafetyLevel, string> = {
  strong: "Strong",
  developing: "Developing",
  emerging: "Emerging",
  needs_work: "Needs work",
};

export type AppType = "social" | "gaming" | "educational" | "creative" | "communication" | "streaming";

export const APP_TYPE_LABEL: Record<AppType, string> = {
  social: "Social",
  gaming: "Gaming",
  educational: "Educational",
  creative: "Creative",
  communication: "Communication",
  streaming: "Streaming",
};

export type OversightLevel = "none" | "light" | "active_monitoring";

export const OVERSIGHT_LEVEL_LABEL: Record<OversightLevel, string> = {
  none: "None",
  light: "Light",
  active_monitoring: "Active monitoring",
};

export interface DeviceUsed {
  device: string;
  ownership: "personal" | "shared" | "loaned";
  primary_use: string;
}

export interface AgreedScreenTimeLimit {
  period: string;
  max_hours: number;
  rationale: string;
}

export interface AppUsed {
  app: string;
  type: AppType;
  age_appropriate: boolean;
  agreed_use: string;
  oversight_level: OversightLevel;
}

export interface SocialMediaProfile {
  platform: string;
  username: string;
  age_verified: boolean;
  privacy_settings: string;
  who_can_see_content: string;
  staff_approved: boolean;
}

export interface OnlineSafetyKnowledge {
  topic: string;
  level: OnlineSafetyLevel;
}

export interface DigitalPlan {
  id: string;
  child_id: string;
  age: number;
  devices_used: DeviceUsed[];
  agreed_screen_time_limits: AgreedScreenTimeLimit[];
  bedtime_routine_with_devices: string;
  apps_used: AppUsed[];
  social_media_profiles: SocialMediaProfile[];
  known_friends_online: string;
  unknown_contact_risks: string[];
  child_online_safety_knowledge: OnlineSafetyKnowledge[];
  digital_literacy_skills: string[];
  pornography_and_exposure_protections: string[];
  cyberbullying_response: string[];
  exploitation_risk_factors: string[];
  exploitation_protections: string[];
  parental_controls_level: ParentalControlLevel;
  filtering_in_place: string[];
  child_can_request_privacy: string;
  staff_oversight_approach: string;
  reviewed_date: string;
  reviewed_with: string;
  child_agreed: boolean;
  next_review_date: string;
  notes: string;
  created_at: string;
}

/* ── Disclosure Log ── */

export type DisclosureType =
  | "historical_abuse"
  | "recent_harm"
  | "concern_about_another"
  | "self_harm"
  | "online_concern"
  | "family_concern"
  | "peer_concern"
  | "other";

export const DISCLOSURE_TYPE_LABEL: Record<DisclosureType, string> = {
  historical_abuse: "Historical abuse",
  recent_harm: "Recent harm",
  concern_about_another: "Concern about another",
  self_harm: "Self-harm",
  online_concern: "Online concern",
  family_concern: "Family concern",
  peer_concern: "Peer concern",
  other: "Other",
};

export type DisclosureSeverity = "low" | "medium" | "high" | "crisis";

export const DISCLOSURE_SEVERITY_LABEL: Record<DisclosureSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  crisis: "Crisis",
};

export type QuestionsAskedType = "none_listened_only" | "open_clarifying" | "closed_leading_flagged";

export const QUESTIONS_ASKED_LABEL: Record<QuestionsAskedType, string> = {
  none_listened_only: "None — listened only",
  open_clarifying: "Open clarifying",
  closed_leading_flagged: "Closed/leading — flagged",
};

export type DisclosureStatus = "active_investigation" | "external_agency_leading" | "closed_actioned" | "monitoring";

export const DISCLOSURE_STATUS_LABEL: Record<DisclosureStatus, string> = {
  active_investigation: "Active investigation",
  external_agency_leading: "External agency leading",
  closed_actioned: "Closed - actioned",
  monitoring: "Monitoring",
};

export interface Disclosure {
  id: string;
  child_id: string;
  disclosure_date: string;
  disclosure_time: string;
  location: string;
  context_of_disclosure: string;
  heard_by: string;
  disclosure_summary: string;
  disclosure_type: DisclosureType;
  child_words_used: string;
  staff_response_at_time: string;
  reassurance_given: string;
  questions_asked: QuestionsAskedType;
  disclosure_severity: DisclosureSeverity;
  immediate_actions_taken: string[];
  reported_to_dsl: boolean;
  reported_to_dsl_date: string;
  reported_to_lado: boolean;
  reported_to_police: boolean;
  referrals_made: string[];
  child_informed_of_actions: boolean;
  child_given_agency: string;
  support_provided_to_child: string[];
  staff_debrief: boolean;
  parallel_process_noted: string;
  status: DisclosureStatus;
  created_at: string;
}

/* ── End-of-Shift Checklist ── */

export type EndOfShiftType = "early" | "late" | "sleep_in" | "wake_night";

export const END_OF_SHIFT_TYPE_LABEL: Record<EndOfShiftType, string> = {
  early: "Early",
  late: "Late",
  sleep_in: "Sleep-in",
  wake_night: "Wake-night",
};

export type ChecklistCategory =
  | "safeguarding"
  | "medication"
  | "environment_security"
  | "records"
  | "childrens_wellbeing"
  | "communication";

export const CHECKLIST_CATEGORY_LABEL: Record<ChecklistCategory, string> = {
  safeguarding: "Safeguarding",
  medication: "Medication",
  environment_security: "Environment & Security",
  records: "Records",
  childrens_wellbeing: "Children's wellbeing",
  communication: "Communication",
};

export interface ChecklistItem {
  category: ChecklistCategory;
  item: string;
  completed: boolean;
  notes: string;
}

export interface ShiftChecklist {
  id: string;
  date: string;
  shift_type: EndOfShiftType;
  shift_start: string;
  shift_end: string;
  staff_member: string;
  checks: ChecklistItem[];
  any_escalations: string[];
  key_handover_points: string[];
  child_observations: string;
  staff_wellbeing_check_in: string;
  building_security_checked: boolean;
  medication_cabinet_locked: boolean;
  pets_cared_for: boolean;
  kitchen_closed: boolean;
  next_shift_staff: string;
  handover_delivered: boolean;
  all_tasks_complete: boolean;
  created_at: string;
}

/* ── Escalation Tracker ── */

export type EscalationCategory = "safeguarding" | "behaviour" | "health" | "placement" | "staffing" | "compliance";

export const ESCALATION_CATEGORY_LABEL: Record<EscalationCategory, string> = {
  safeguarding: "Safeguarding",
  behaviour: "Behaviour",
  health: "Health",
  placement: "Placement",
  staffing: "Staffing",
  compliance: "Compliance",
};

export type EscalationPriority = "urgent" | "high" | "medium";

export const ESCALATION_PRIORITY_LABEL: Record<EscalationPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
};

export type EscalationStatus = "resolved" | "open" | "monitoring";

export const ESCALATION_STATUS_LABEL: Record<EscalationStatus, string> = {
  resolved: "Resolved",
  open: "Open",
  monitoring: "Monitoring",
};

export interface Escalation {
  id: string;
  title: string;
  date: string;
  escalated_by: string;
  escalated_to: string;
  category: EscalationCategory;
  priority: EscalationPriority;
  child_id: string | null;
  description: string;
  reason: string;
  action_taken: string;
  outcome: string;
  status: EscalationStatus;
  resolved_date: string | null;
  time_to_resolve: string | null;
  linked_documents: string[];
  notes: string;
  created_at: string;
}

/* ── Chosen Family Tracker ── */

export type ChosenFamilyRelationship =
  | "mentor"
  | "coach"
  | "teacher"
  | "faith_leader"
  | "neighbour"
  | "family_friend"
  | "ex_foster_carer"
  | "grandparent_figure"
  | "older_friend"
  | "sports_club_leader"
  | "other_significant_adult";

export const CHOSEN_FAMILY_RELATIONSHIP_LABEL: Record<ChosenFamilyRelationship, string> = {
  mentor: "Mentor",
  coach: "Coach",
  teacher: "Teacher",
  faith_leader: "Faith leader",
  neighbour: "Neighbour",
  family_friend: "Family friend",
  ex_foster_carer: "Ex foster carer",
  grandparent_figure: "Grandparent figure",
  older_friend: "Older friend",
  sports_club_leader: "Sports/club leader",
  other_significant_adult: "Other significant adult",
};

export type ChosenFamilyContactFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "annually" | "as_needed";

export const CHOSEN_FAMILY_CONTACT_FREQUENCY_LABEL: Record<ChosenFamilyContactFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annually: "Annually",
  as_needed: "As needed",
};

export type ChosenFamilyImportance = "significant" | "very_significant" | "like_family" | "central_figure";

export const CHOSEN_FAMILY_IMPORTANCE_LABEL: Record<ChosenFamilyImportance, string> = {
  significant: "Significant",
  very_significant: "Very significant",
  like_family: "Like family",
  central_figure: "Central figure",
};

export interface ChosenFamilyRecord {
  id: string;
  child_id: string;
  person_name: string;
  relationship: ChosenFamilyRelationship;
  how_met: string;
  years_known: number;
  contact_frequency: ChosenFamilyContactFrequency;
  contact_type: string[];
  importance_to_child: ChosenFamilyImportance;
  role_played: string[];
  safeguarding_checked: boolean;
  safeguarding_check_date: string | null;
  child_initiated_relationship: boolean;
  reciprocal: boolean;
  child_voice: string;
  staff_observation: string;
  risk_factors: string[];
  protective_factors: string[];
  review_date: string;
  key_worker: string;
  created_at: string;
}

/* ── Family Relationship Quality Tracker ── */

export type FamilyRelationshipType =
  | "mother"
  | "father"
  | "grandparent"
  | "sibling"
  | "aunt_uncle"
  | "cousin"
  | "step_family"
  | "adoptive_parent";

export const FAMILY_RELATIONSHIP_TYPE_LABEL: Record<FamilyRelationshipType, string> = {
  mother: "Mother",
  father: "Father",
  grandparent: "Grandparent",
  sibling: "Sibling",
  aunt_uncle: "Aunt/Uncle",
  cousin: "Cousin",
  step_family: "Step-family",
  adoptive_parent: "Adoptive parent",
};

export type FamilyRelationshipQuality = "strong" | "stable" | "complicated" | "fragile" | "severed_restricted";

export const FAMILY_RELATIONSHIP_QUALITY_LABEL: Record<FamilyRelationshipQuality, string> = {
  strong: "Strong",
  stable: "Stable",
  complicated: "Complicated",
  fragile: "Fragile",
  severed_restricted: "Severed/Restricted",
};

export type FamilyRelationshipTrajectory = "improving" | "stable" | "concerning" | "declining";

export const FAMILY_RELATIONSHIP_TRAJECTORY_LABEL: Record<FamilyRelationshipTrajectory, string> = {
  improving: "Improving",
  stable: "Stable",
  concerning: "Concerning",
  declining: "Declining",
};

export interface FamilyRelationshipRecord {
  id: string;
  child_id: string;
  assessment_date: string;
  family_member: string;
  relationship_type: FamilyRelationshipType;
  current_quality: FamilyRelationshipQuality;
  quality_1_to_10: number;
  contact_frequency: string;
  contact_quality: string;
  recent_events: string[];
  strengths_observed: string[];
  challenges_observed: string[];
  child_perspective: string;
  interventions_active: string[];
  trajectory: FamilyRelationshipTrajectory;
  risk_factors: string[];
  protective_factors: string[];
  child_wishes_and_feelings: string;
  next_review: string;
  reviewed_by: string;
  created_at: string;
}

/* ── First Relationship Support ── */

export type FirstRelationshipStatus =
  | "expressing_interest"
  | "first_crush"
  | "early_relationship"
  | "established_first_relationship"
  | "recently_ended"
  | "not_currently_interested";

export const FIRST_RELATIONSHIP_STATUS_LABEL: Record<FirstRelationshipStatus, string> = {
  expressing_interest: "Expressing interest in dating",
  first_crush: "First crush identified",
  early_relationship: "Early relationship — talking stage",
  established_first_relationship: "Established first relationship",
  recently_ended: "Recently ended first relationship",
  not_currently_interested: "Not currently interested",
};

export type ConsentEducationLevel = "not_yet_introduced" | "foundational" | "developing" | "confident";

export const CONSENT_EDUCATION_LEVEL_LABEL: Record<ConsentEducationLevel, string> = {
  not_yet_introduced: "Not yet introduced",
  foundational: "Foundational",
  developing: "Developing",
  confident: "Confident",
};

export type ExploitationRiskScreen = "no_concerns" | "watch" | "concerns_identified" | "active_concerns_escalated";

export const EXPLOITATION_RISK_SCREEN_LABEL: Record<ExploitationRiskScreen, string> = {
  no_concerns: "No concerns",
  watch: "Watch",
  concerns_identified: "Concerns identified",
  active_concerns_escalated: "Active concerns — escalated",
};

export interface FirstRelationshipRecord {
  id: string;
  child_id: string;
  record_date: string;
  relationship_status: FirstRelationshipStatus;
  partner_info: string | null;
  partner_age: string | null;
  age_gap_ok: boolean | null;
  how_they_met: string | null;
  child_led_disclosure: boolean;
  rse_topics_covered: string[];
  consent_education_level: ConsentEducationLevel;
  exploitation_risk_screen: ExploitationRiskScreen;
  risk_factors_noted: string[];
  protective_factors_noted: string[];
  support_offered: string[];
  child_voice: string;
  staff_observation: string;
  parent_carer_involved: string | null;
  social_worker_notified: boolean;
  follow_up_date: string;
  key_worker: string;
  created_at: string;
}

/* ── Daily Risk Briefing ── */

export type DailyRiskLevel = "low" | "medium" | "high";

export const DAILY_RISK_LEVEL_LABEL: Record<DailyRiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export type DailyAlertSeverity = "critical" | "warning" | "info";

export const DAILY_ALERT_SEVERITY_LABEL: Record<DailyAlertSeverity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
};

export interface ChildRiskEntry {
  child_id: string;
  risk_level: DailyRiskLevel;
  alerts: string[];
  medication: string;
  key_info: string;
  mood: string;
  check_frequency_minutes: number;
  check_frequency_reason: string;
}

export interface DailyAlert {
  severity: DailyAlertSeverity;
  message: string;
}

export interface DailyContact {
  time: string;
  what: string;
  who: string;
}

export interface DailyRiskBriefing {
  id: string;
  date: string;
  shift_type: "day" | "night";
  shift_leader: string;
  staff_on_shift: string[];
  on_call: string;
  child_risks: ChildRiskEntry[];
  home_alerts: DailyAlert[];
  key_contacts: DailyContact[];
  created_at: string;
}

/* ── Equality & Diversity ── */

export type EqualityInitiativeStatus = "planned" | "active" | "completed" | "ongoing";

export const EQUALITY_INITIATIVE_STATUS_LABEL: Record<EqualityInitiativeStatus, string> = {
  planned: "Planned",
  active: "Active",
  completed: "Completed",
  ongoing: "Ongoing",
};

export type ProtectedCharacteristic = "age" | "disability" | "gender_reassignment" | "marriage_civil_partnership" | "pregnancy_maternity" | "race" | "religion_belief" | "sex" | "sexual_orientation";

export const PROTECTED_CHARACTERISTIC_LABEL: Record<ProtectedCharacteristic, string> = {
  age: "Age",
  disability: "Disability",
  gender_reassignment: "Gender Reassignment",
  marriage_civil_partnership: "Marriage & Civil Partnership",
  pregnancy_maternity: "Pregnancy & Maternity",
  race: "Race",
  religion_belief: "Religion or Belief",
  sex: "Sex",
  sexual_orientation: "Sexual Orientation",
};

export type EqualityActionStatus = "pending" | "in_progress" | "completed";

export const EQUALITY_ACTION_STATUS_LABEL: Record<EqualityActionStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

export interface EqualityAction {
  id: string;
  action: string;
  characteristic: ProtectedCharacteristic;
  owner: string;
  due_date: string;
  status: EqualityActionStatus;
  completed_date: string | null;
  impact: string;
}

export interface EqualityTrainingRecord {
  id: string;
  title: string;
  date: string;
  provider: string;
  attendees: string[];
  mandatory: boolean;
  next_due: string;
}

export interface EqualityMonitoringData {
  staff_diversity: { characteristic: string; breakdown: Record<string, number> }[];
  yp_diversity: { characteristic: string; breakdown: Record<string, number> }[];
  last_audit_date: string;
  next_audit_due: string;
  audited_by: string;
}

export interface EqualityInitiative {
  id: string;
  title: string;
  description: string;
  status: EqualityInitiativeStatus;
  lead_by: string;
  start_date: string;
  target_date: string;
  characteristics: ProtectedCharacteristic[];
  objectives: string[];
  actions: EqualityAction[];
  outcomes: string[];
  evidence: string[];
  notes: string;
  created_at: string;
}

/* ── Independence Pathway ── */

export type IndependencePathwayStatus = "on_track" | "attention_needed" | "not_age_appropriate";

export const INDEPENDENCE_PATHWAY_STATUS_LABEL: Record<IndependencePathwayStatus, string> = {
  on_track: "On Track",
  attention_needed: "Attention Needed",
  not_age_appropriate: "Not Age-Appropriate",
};

export interface PathwayDomain {
  name: string;
  score: number;
  max_score: number;
  evidence: string;
  next_steps: string;
}

export interface IndependencePathway {
  id: string;
  child_id: string;
  assessed_by: string;
  assessment_date: string;
  review_date: string;
  overall_readiness: number;
  domains: PathwayDomain[];
  status: IndependencePathwayStatus;
  expected_transition_age: number;
  pathway_plan_linked: boolean;
  notes: string;
  created_at: string;
}

/* ── Independence Skills ── */

export type IndependenceSkillProficiency = "not_started" | "emerging" | "developing" | "competent" | "independent";

export const INDEPENDENCE_SKILL_PROFICIENCY_LABEL: Record<IndependenceSkillProficiency, string> = {
  not_started: "Not Started",
  emerging: "Emerging",
  developing: "Developing",
  competent: "Competent",
  independent: "Independent",
};

export type IndependenceSkillCategory = "cooking" | "budgeting" | "hygiene" | "laundry" | "travel" | "health" | "communication" | "safety" | "digital" | "housing";

export const INDEPENDENCE_SKILL_CATEGORY_LABEL: Record<IndependenceSkillCategory, string> = {
  cooking: "Cooking & Nutrition",
  budgeting: "Budgeting & Finance",
  hygiene: "Personal Hygiene",
  laundry: "Laundry & Clothing",
  travel: "Travel & Transport",
  health: "Health Management",
  communication: "Communication",
  safety: "Safety Awareness",
  digital: "Digital Skills",
  housing: "Housing & Tenancy",
};

export interface IndependenceSkill {
  id: string;
  name: string;
  category: IndependenceSkillCategory;
  proficiency: IndependenceSkillProficiency;
  target_date: string;
  last_assessed: string;
  assessed_by: string;
  evidence: string;
  next_step: string;
}

export interface IndependenceSkillsRecord {
  id: string;
  child_id: string;
  review_date: string;
  reviewer: string;
  overall_readiness: number;
  skills: IndependenceSkill[];
  strengths: string[];
  areas_for_development: string[];
  child_view: string;
  pathway_notes: string;
  created_at: string;
}

/* ── Independent Living Skills Assessment ── */

export type LivingSkillLevel = "not_yet_started" | "emerging" | "developing" | "established" | "mastered";

export const LIVING_SKILL_LEVEL_LABEL: Record<LivingSkillLevel, string> = {
  not_yet_started: "Not yet started",
  emerging: "Emerging",
  developing: "Developing",
  established: "Established",
  mastered: "Mastered",
};

export type LivingSkillsReadiness = "early_stage" | "building_foundations" | "developing_strongly" | "approaching_ready" | "ready_for_next_step";

export const LIVING_SKILLS_READINESS_LABEL: Record<LivingSkillsReadiness, string> = {
  early_stage: "Early-stage",
  building_foundations: "Building foundations",
  developing_strongly: "Developing strongly",
  approaching_ready: "Approaching ready",
  ready_for_next_step: "Ready for next step",
};

export interface LivingSkillAssessment {
  skill: string;
  level: LivingSkillLevel;
  evidence: string;
  child_self_assessment: LivingSkillLevel;
  staff_assessment: LivingSkillLevel;
  agreement_between_child_and_staff: boolean;
  next_steps: string;
}

export interface LivingSkillDomainAssessment {
  domain: string;
  skills: LivingSkillAssessment[];
  domain_summary: string;
}

export interface IndependenceLivingAssessment {
  id: string;
  child_id: string;
  age: number;
  years_to_transition: number;
  assessment_date: string;
  assessor: string;
  domain_assessments: LivingSkillDomainAssessment[];
  overall_readiness: LivingSkillsReadiness;
  child_aspirations: string;
  child_worries: string[];
  priority_skills_next_six_months: string[];
  pathway_links: string[];
  resources_allocated: string[];
  child_agreed: boolean;
  reviewed_date: string;
  next_assessment_due: string;
  notes: string;
  created_at: string;
}

/* ── Independent Travel Training ── */

export type TravelTrainingStage = "stage_1_accompanied" | "stage_2_staff_shadowing" | "stage_3_solo_familiar" | "stage_4_solo_new" | "independent_traveller";

export const TRAVEL_TRAINING_STAGE_LABEL: Record<TravelTrainingStage, string> = {
  stage_1_accompanied: "Stage 1 — Accompanied",
  stage_2_staff_shadowing: "Stage 2 — Staff shadowing",
  stage_3_solo_familiar: "Stage 3 — Solo familiar route",
  stage_4_solo_new: "Stage 4 — Solo new route",
  independent_traveller: "Independent traveller",
};

export type TravelConfidence = "anxious" | "cautious" | "building" | "confident" | "highly_confident";

export const TRAVEL_CONFIDENCE_LABEL: Record<TravelConfidence, string> = {
  anxious: "Anxious",
  cautious: "Cautious",
  building: "Building",
  confident: "Confident",
  highly_confident: "Highly confident",
};

export interface TravelRouteMastered {
  from: string;
  to: string;
  mode: string;
  achieved_date: string;
}

export interface TravelRouteLearning {
  from: string;
  to: string;
  mode: string;
  next_step: string;
}

export interface IndependentTravelRecord {
  id: string;
  child_id: string;
  last_updated: string;
  current_stage: TravelTrainingStage;
  routes_mastered: TravelRouteMastered[];
  routes_learning: TravelRouteLearning[];
  travel_cards_held: string[];
  monthly_travel_budget: number;
  phone_and_charger_check: boolean;
  what_if_lost_plan: string;
  check_in_protocol: string;
  risk_factors: string[];
  protective_factors: string[];
  child_confidence: TravelConfidence;
  staff_observation: string;
  child_voice: string;
  review_date: string;
  key_worker: string;
  created_at: string;
}

/* ══════════════════════════════════════════════════════════════════════════════
   BATCH 35 — Visitor Reports, Infection Control, Inspection Readiness,
   Insurance Tracker, Inventory, IRO Correspondence
   ══════════════════════════════════════════════════════════════════════════════ */

/* ── Visitor Reports (independent-visitor) ─────────────────────────────────── */

export type VisitorVisitType = "scheduled" | "unannounced" | "follow_up";
export const VISITOR_VISIT_TYPE_LABEL: Record<VisitorVisitType, string> = {
  scheduled: "Scheduled",
  unannounced: "Unannounced",
  follow_up: "Follow-Up",
};

export type VisitorRecommendationPriority = "high" | "medium" | "low";

export type VisitorRecommendationStatus = "open" | "actioned" | "noted";
export const VISITOR_RECOMMENDATION_STATUS_LABEL: Record<VisitorRecommendationStatus, string> = {
  open: "Open",
  actioned: "Actioned",
  noted: "Noted",
};

export interface VisitorRecommendation {
  recommendation: string;
  priority: VisitorRecommendationPriority;
  response: string | null;
  response_date: string | null;
  status: VisitorRecommendationStatus;
}

export interface VisitorChildView {
  child_id: string;
  spoken_to: boolean;
  private_conversation: boolean;
  summary: string;
  concerns: boolean;
}

export interface VisitorReport {
  id: string;
  date: string;
  visitor_name: string;
  visit_type: VisitorVisitType;
  arrival_time: string;
  departure_time: string;
  areas_inspected: string[];
  child_views: VisitorChildView[];
  staff_on_duty: string[];
  overall_findings: string;
  recommendations: VisitorRecommendation[];
  positive_observations: string[];
  rm_response: string | null;
  rm_response_date: string | null;
  report_received: boolean;
  report_date: string | null;
  created_at: string;
}

/* ── Infection Control (infection-control) ─────────────────────────────────── */

export type InfectionType = "gastro" | "respiratory" | "skin" | "covid" | "flu" | "headlice" | "chickenpox" | "conjunctivitis" | "hand_foot_mouth" | "other";
export const INFECTION_TYPE_LABEL: Record<InfectionType, string> = {
  gastro: "Gastroenteritis (D&V)",
  respiratory: "Respiratory Infection",
  skin: "Skin Infection",
  covid: "COVID-19",
  flu: "Influenza",
  headlice: "Head Lice",
  chickenpox: "Chickenpox",
  conjunctivitis: "Conjunctivitis",
  hand_foot_mouth: "Hand, Foot & Mouth",
  other: "Other",
};

export type InfectionSeverity = "low" | "medium" | "high" | "outbreak";
export const INFECTION_SEVERITY_LABEL: Record<InfectionSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  outbreak: "Outbreak",
};

export type InfectionStatus = "active" | "monitoring" | "resolved" | "notified";
export const INFECTION_STATUS_LABEL: Record<InfectionStatus, string> = {
  active: "Active",
  monitoring: "Monitoring",
  resolved: "Resolved",
  notified: "Notified (PHE)",
};

export interface InfectionRecord {
  id: string;
  date_reported: string;
  reported_by_id: string;
  affected_person_id: string;
  affected_person_type: "child" | "staff";
  infection_type: InfectionType;
  symptoms: string[];
  severity: InfectionSeverity;
  status: InfectionStatus;
  gp_consulted: boolean;
  gp_advice: string;
  exclusion_required: boolean;
  exclusion_details: string;
  control_measures: string[];
  other_cases_in_home: number;
  notified_bodies: string[];
  date_resolved: string | null;
  cleaning_actions: string[];
  notes: string;
  created_at: string;
}

/* ── Inspection Readiness Pack (inspection-readiness-pack) ─────────────────── */

export type SccifJudgementArea = "overall_experiences" | "helped_and_protected" | "leaders_and_managers";
export const SCCIF_JUDGEMENT_AREA_LABEL: Record<SccifJudgementArea, string> = {
  overall_experiences: "Overall Experiences and Progress",
  helped_and_protected: "How well children are helped and protected",
  leaders_and_managers: "Effectiveness of leaders and managers",
};

export type ReadinessCategory = "statutory_documentation" | "records_of_practice" | "childrens_voice_evidence" | "outcome_data" | "workforce" | "environment" | "quality_assurance";
export const READINESS_CATEGORY_LABEL: Record<ReadinessCategory, string> = {
  statutory_documentation: "Statutory documentation",
  records_of_practice: "Records of practice",
  childrens_voice_evidence: "Children's voice evidence",
  outcome_data: "Outcome data",
  workforce: "Workforce",
  environment: "Environment",
  quality_assurance: "Quality assurance",
};

export type InPackStatus = "ready" | "needs_refresh" | "missing" | "in_progress";
export const IN_PACK_STATUS_LABEL: Record<InPackStatus, string> = {
  ready: "Ready",
  needs_refresh: "Needs refresh",
  missing: "Missing",
  in_progress: "In progress",
};

export interface ReadinessItem {
  id: string;
  item_name: string;
  sccif_judgement_area: SccifJudgementArea;
  category: ReadinessCategory;
  description: string;
  current_version: string;
  last_updated: string;
  next_review_due: string;
  location_of_document: string;
  responsible_owner: string;
  in_pack_status: InPackStatus;
  evidence_quality_rating: number;
  examples_included: string[];
  child_voice_woven: boolean;
  accessible_to_inspector: boolean;
  accessible_to_children: boolean;
  commentary: string;
  created_at: string;
}

/* ── Insurance Tracker (insurance-tracker) ─────────────────────────────────── */

export type InsurancePolicyType = "public_liability" | "employers_liability" | "buildings" | "contents" | "vehicle_fleet" | "trustees_directors" | "cyber" | "professional_indemnity" | "group_personal_accident" | "specialist";
export const INSURANCE_POLICY_TYPE_LABEL: Record<InsurancePolicyType, string> = {
  public_liability: "Public Liability",
  employers_liability: "Employers' Liability",
  buildings: "Buildings",
  contents: "Contents",
  vehicle_fleet: "Vehicle Fleet",
  trustees_directors: "Trustees/Directors",
  cyber: "Cyber",
  professional_indemnity: "Professional Indemnity",
  group_personal_accident: "Group Personal Accident",
  specialist: "Specialist (e.g. abuse)",
};

export type InsurancePolicyStatus = "active" | "lapsed" | "pending_renewal" | "cancelled" | "awaiting_documents";
export const INSURANCE_POLICY_STATUS_LABEL: Record<InsurancePolicyStatus, string> = {
  active: "Active",
  lapsed: "Lapsed",
  pending_renewal: "Pending renewal",
  cancelled: "Cancelled",
  awaiting_documents: "Awaiting documents",
};

export interface InsuranceClaim {
  date: string;
  amount: number;
  outcome: string;
}

export interface InsurancePolicy {
  id: string;
  policy_name: string;
  policy_type: InsurancePolicyType;
  insurer: string;
  broker_or_direct: string;
  policy_number: string;
  coverage_summary: string;
  sum_insured: number;
  excess: number;
  premium_annual: number;
  start_date: string;
  renewal_date: string;
  days_to_renewal: number;
  auto_renewal: boolean;
  certificate_location: string;
  policy_document_location: string;
  certificate_displayed_required: boolean;
  certificate_displayed: boolean;
  responsible_owner: string;
  recent_claims: InsuranceClaim[];
  last_reviewed_date: string;
  review_notes: string;
  policy_exclusions: string[];
  status: InsurancePolicyStatus;
  created_at: string;
}

/* ── Inventory (inventory) ─────────────────────────────────────────────────── */

export type InventoryCategory = "furniture" | "electronics" | "kitchen" | "safety_equipment" | "bedding_linen" | "cleaning" | "office" | "outdoor" | "medical" | "other";
export const INVENTORY_CATEGORY_LABEL: Record<InventoryCategory, string> = {
  furniture: "Furniture",
  electronics: "Electronics",
  kitchen: "Kitchen",
  safety_equipment: "Safety Equipment",
  bedding_linen: "Bedding & Linen",
  cleaning: "Cleaning",
  office: "Office",
  outdoor: "Outdoor",
  medical: "Medical",
  other: "Other",
};

export type InventoryCondition = "new" | "good" | "fair" | "poor" | "condemned";
export const INVENTORY_CONDITION_LABEL: Record<InventoryCondition, string> = {
  new: "New",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  condemned: "Condemned",
};

export type InventoryLocation = "lounge" | "kitchen" | "office" | "bedroom_1" | "bedroom_2" | "bedroom_3" | "bathroom" | "garden" | "utility" | "hallway" | "storage";
export const INVENTORY_LOCATION_LABEL: Record<InventoryLocation, string> = {
  lounge: "Lounge",
  kitchen: "Kitchen",
  office: "Office",
  bedroom_1: "Bedroom 1",
  bedroom_2: "Bedroom 2",
  bedroom_3: "Bedroom 3",
  bathroom: "Bathroom",
  garden: "Garden",
  utility: "Utility Room",
  hallway: "Hallway",
  storage: "Storage",
};

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  location: InventoryLocation;
  condition: InventoryCondition;
  quantity: number;
  purchase_date: string;
  purchase_cost: number;
  supplier: string;
  warranty_expiry: string | null;
  pat_test_due: string | null;
  last_checked: string;
  checked_by: string;
  serial_number: string | null;
  notes: string;
  created_at: string;
}

/* ── IRO Correspondence (iro-correspondence) ───────────────────────────────── */

export type IroDirection = "from_iro" | "to_iro";
export const IRO_DIRECTION_LABEL: Record<IroDirection, string> = {
  from_iro: "From IRO",
  to_iro: "To IRO",
};

export type IroCorrespondenceType = "pre_lac_review" | "post_lac_review" | "formal_dispute" | "information_request" | "concern_raised" | "update_from_home" | "mid_review_check_in" | "statutory_action";
export const IRO_CORRESPONDENCE_TYPE_LABEL: Record<IroCorrespondenceType, string> = {
  pre_lac_review: "Pre-LAC review information",
  post_lac_review: "Post-LAC review confirmation",
  formal_dispute: "Formal dispute resolution",
  information_request: "Information request",
  concern_raised: "Concern raised by IRO",
  update_from_home: "Update from home",
  mid_review_check_in: "Mid-review check-in",
  statutory_action: "Statutory action required",
};

export type IroActionStatus = "outstanding" | "in_progress" | "complete";
export const IRO_ACTION_STATUS_LABEL: Record<IroActionStatus, string> = {
  outstanding: "Outstanding",
  in_progress: "In progress",
  complete: "Complete",
};

export interface IroRequiredAction {
  action: string;
  owner: string;
  deadline: string;
  status: IroActionStatus;
}

export interface IroCorrespondence {
  id: string;
  date: string;
  child_id: string;
  iro_name: string;
  iro_local_authority: string;
  direction: IroDirection;
  correspondence_type: IroCorrespondenceType;
  subject: string;
  summary: string;
  key_points: string[];
  actions_required: IroRequiredAction[];
  response_required: boolean;
  response_deadline: string;
  response_sent: boolean;
  response_sent_date: string;
  attachments: string[];
  formal_dispute: boolean;
  authored_by: string;
  received_by: string;
  copied_to: string[];
  filed: boolean;
  created_at: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   BATCH 36 — child-summer-holiday-record, complaints-trend-analysis,
   keyholding-register, kitchen-hygiene-monitoring, kpi-dashboard,
   lac-review-prep
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── child-summer-holiday-record (CHILD-LEVEL) ─────────────────────────── */

export type HolidayPeriod =
  | "summer"
  | "easter"
  | "christmas"
  | "october_half_term"
  | "february_half_term"
  | "may_half_term"
  | "bank_holiday"
  | "other";

export const HOLIDAY_PERIOD_LABEL: Record<HolidayPeriod, string> = {
  summer: "Summer",
  easter: "Easter",
  christmas: "Christmas",
  october_half_term: "October half-term",
  february_half_term: "February half-term",
  may_half_term: "May half-term",
  bank_holiday: "Bank holiday",
  other: "Other",
};

export interface HolidayRecord {
  id: string;
  child_id: string;
  holiday_period: HolidayPeriod;
  year: string;
  duration_days: number;
  destinations: string[];
  highlights: string[];
  with_whom: string[];
  cost_spent: number;
  funding_source: string;
  child_chose_destination: boolean;
  challenges_noted: string[];
  photos_taken: boolean;
  photos_location: string;
  child_memory_headline: string;
  child_voice: string;
  staff_observation: string;
  review_date: string;
  recorded_by: string;
  created_at: string;
}

/* ── complaints-trend-analysis (HOME-LEVEL) ────────────────────────────── */

export interface ComplaintTrend {
  id: string;
  period: string;
  total_complaints: number;
  by_category: Record<string, number>;
  by_source: Record<string, number>;
  by_outcome: Record<string, number>;
  avg_resolution_days: number;
  resolved_within_timeframe: number;
  child_complaints_count: number;
  themes: string[];
  root_causes: string[];
  improvements_implemented: string[];
  policy_changes_arising: string[];
  training_arising: string[];
  change_vs_last_period: number;
  analyst: string;
  review_date: string;
  created_at: string;
}

/* ── keyholding-register (HOME-LEVEL) ──────────────────────────────────── */

export type KeyType =
  | "master"
  | "room"
  | "office"
  | "vehicle"
  | "safe"
  | "medication_cabinet"
  | "external"
  | "fob"
  | "gate";

export const KEY_TYPE_LABEL: Record<KeyType, string> = {
  master: "Master Key",
  room: "Room Key",
  office: "Office Key",
  vehicle: "Vehicle Key",
  safe: "Safe Key",
  medication_cabinet: "Medication Cabinet",
  external: "External",
  fob: "Fob",
  gate: "Gate Key",
};

export type KeyholdingStatus =
  | "in_use"
  | "all_accounted"
  | "lost"
  | "replacement_ordered"
  | "decommissioned";

export const KEYHOLDING_STATUS_LABEL: Record<KeyholdingStatus, string> = {
  in_use: "In Use",
  all_accounted: "All Accounted",
  lost: "Lost",
  replacement_ordered: "Replacement Ordered",
  decommissioned: "Decommissioned",
};

export interface KeyPermanentHolder {
  staff_id: string;
  issued_date: string;
  return_date: string | null;
}

export interface KeySignOutEntry {
  staff_id: string;
  signed_out: string;
  signed_in: string | null;
  purpose: string;
}

export interface KeyLostIncident {
  date: string;
  reported_by: string;
  circumstances: string;
  locks_changed: boolean;
  resolved: boolean;
}

export interface KeyRecord {
  id: string;
  key_name: string;
  key_type: KeyType;
  key_number: string;
  total_copies: number;
  permanent_holders: KeyPermanentHolder[];
  sign_out_log: KeySignOutEntry[];
  restricted_access: boolean;
  authorised_staff: string[];
  location: string;
  last_audit: string;
  next_audit_due: string;
  status: KeyholdingStatus;
  lost_key_incidents: KeyLostIncident[];
  notes: string;
  created_at: string;
}

/* ── kitchen-hygiene-monitoring (HOME-LEVEL) ───────────────────────────── */

export type HygieneShiftType = "early" | "late" | "sleep_in" | "wake_night";

export const HYGIENE_SHIFT_TYPE_LABEL: Record<HygieneShiftType, string> = {
  early: "Early",
  late: "Late",
  sleep_in: "Sleep-in",
  wake_night: "Wake-night",
};

export type FridgeOrganisation = "excellent" | "good" | "adequate" | "needs_attention";

export const FRIDGE_ORGANISATION_LABEL: Record<FridgeOrganisation, string> = {
  excellent: "Excellent",
  good: "Good",
  adequate: "Adequate",
  needs_attention: "Needs attention",
};

export type BinStatus = "empty" | "half_full" | "full" | "overflow";

export const BIN_STATUS_LABEL: Record<BinStatus, string> = {
  empty: "Empty",
  half_full: "Half full",
  full: "Full",
  overflow: "Overflow",
};

export type HygieneVerdict = "pass" | "pass_with_minor_actions" | "fail";

export const HYGIENE_VERDICT_LABEL: Record<HygieneVerdict, string> = {
  pass: "Pass",
  pass_with_minor_actions: "Pass with minor actions",
  fail: "Fail",
};

export interface CookingTempRecord {
  meal: string;
  temp_reading: number;
  min_required: number;
  pass: boolean;
}

export interface ExpiredItemFound {
  item: string;
  expiry_date: string;
  disposed: boolean;
}

export interface HotHoldingTemp {
  item: string;
  temp: number;
  pass: boolean;
}

export interface KitchenHygieneCheck {
  id: string;
  date: string;
  time: string;
  staff_member: string;
  shift_type: HygieneShiftType;
  fridge_temperature: number;
  fridge_within_range: boolean;
  freezer_temperature: number;
  freezer_within_range: boolean;
  cooking_temps_recorded: CookingTempRecord[];
  fridge_organisation: FridgeOrganisation;
  fridge_rotation: boolean;
  expired_items_found: ExpiredItemFound[];
  surfaces_cleaned: boolean;
  cleaning_products_correct: boolean;
  handwashing_observed: boolean;
  aprons_and_hair_covers: boolean;
  children_preparing_food_supervision: string;
  cooking_activity_safety_briefing_done: boolean;
  pests_observed: boolean;
  pest_actions: string;
  bins: BinStatus;
  bin_emptied_time: string;
  dishwasher_cycle_notes: string;
  cutting_board_segregation: boolean;
  allergen_labelling: boolean;
  defrosting_practice: string;
  hot_holding_temps: HotHoldingTemp[];
  overall_verdict: HygieneVerdict;
  immediate_actions: string[];
  follow_up_actions: string[];
  notes: string;
  created_at: string;
}

/* ── kpi-dashboard (HOME-LEVEL) ────────────────────────────────────────── */

export type KpiRag = "green" | "amber" | "red";

export const KPI_RAG_LABEL: Record<KpiRag, string> = {
  green: "Green",
  amber: "Amber",
  red: "Red",
};

export type KpiTrend = "up" | "down" | "stable";

export const KPI_TREND_LABEL: Record<KpiTrend, string> = {
  up: "Improving",
  down: "Declining",
  stable: "Stable",
};

export type KpiCategory =
  | "experiences_progress"
  | "health_wellbeing"
  | "safety"
  | "education"
  | "leadership_management";

export const KPI_CATEGORY_LABEL: Record<KpiCategory, string> = {
  experiences_progress: "Overall Experiences & Progress",
  health_wellbeing: "Health & Wellbeing",
  safety: "Safety",
  education: "Education",
  leadership_management: "Leadership & Management",
};

export interface KpiEntry {
  id: string;
  category: KpiCategory;
  name: string;
  value: string;
  target: string;
  rag: KpiRag;
  trend: KpiTrend;
  notes: string;
  created_at: string;
}

/* ── lac-review-prep (CHILD-LEVEL) ─────────────────────────────────────── */

export type LacReviewType =
  | "initial_28_days"
  | "first_3_months"
  | "subsequent_6_monthly"
  | "disruption_review";

export const LAC_REVIEW_TYPE_LABEL: Record<LacReviewType, string> = {
  initial_28_days: "Initial review (28 days)",
  first_3_months: "First review (3 months)",
  subsequent_6_monthly: "Subsequent review (6 monthly)",
  disruption_review: "Disruption review",
};

export type LacPrepStatus =
  | "not_started"
  | "in_progress"
  | "ready_for_review"
  | "review_held"
  | "post_review_actions";

export const LAC_PREP_STATUS_LABEL: Record<LacPrepStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  ready_for_review: "Ready for review",
  review_held: "Review held",
  post_review_actions: "Post-review actions",
};

export type ChildPrepStatus =
  | "not_started"
  | "initial_conversation_done"
  | "views_captured"
  | "visual_prep_done"
  | "ready";

export const CHILD_PREP_STATUS_LABEL: Record<ChildPrepStatus, string> = {
  not_started: "Not started",
  initial_conversation_done: "Initial conversation done",
  views_captured: "Views captured",
  visual_prep_done: "Visual prep done",
  ready: "Ready",
};

export type ChildAttendanceChoice =
  | "will_attend"
  | "will_not_attend"
  | "partial_attendance"
  | "decision_pending"
  | "views_via_advocate"
  | "views_via_key_worker";

export const CHILD_ATTENDANCE_CHOICE_LABEL: Record<ChildAttendanceChoice, string> = {
  will_attend: "Will attend",
  will_not_attend: "Will not attend",
  partial_attendance: "Partial attendance",
  decision_pending: "Decision pending",
  views_via_advocate: "Views via advocate",
  views_via_key_worker: "Views via key worker",
};

export type LacPrepActionStatus = "open" | "in_progress" | "done";

export const LAC_PREP_ACTION_STATUS_LABEL: Record<LacPrepActionStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  done: "Done",
};

export interface MultiAgencyReport {
  agency: string;
  received: boolean;
  received_date: string;
}

export interface LacPrepOutstandingAction {
  action: string;
  owner: string;
  deadline: string;
  status: LacPrepActionStatus;
}

export interface LacPrepPastAction {
  action: string;
  status: string;
}

export interface LacReviewPrep {
  id: string;
  child_id: string;
  review_type: LacReviewType;
  review_scheduled_for: string;
  iro_name: string;
  iro_local_authority: string;
  prep_status: LacPrepStatus;
  prep_start_date: string;
  home_report_deadline: string;
  home_report_submitted: boolean;
  home_report_submitted_date: string;
  report_author: string;
  child_prep_status: ChildPrepStatus;
  child_prep_activities: string[];
  child_choose_to_attend: ChildAttendanceChoice;
  child_advocate_involved: boolean;
  child_advocate_name: string;
  child_wishes_and_feelings: string[];
  child_topics_to_raise: string[];
  child_topics_to_avoid: string[];
  multi_agency_reports_collected: MultiAgencyReport[];
  outstanding_actions: LacPrepOutstandingAction[];
  past_actions_to_review_progress: LacPrepPastAction[];
  risk_assessment_current: boolean;
  care_plan_current: boolean;
  pathway_plan_current: boolean;
  education_report_obtained: boolean;
  health_report_obtained: boolean;
  child_post_review_support_plan: string;
  prepared_by: string;
  notes: string;
  created_at: string;
}

/* ── Batch 37 ─────────────────────────────────────────────────────────────── */

/* LADO Referrals (home-level) */

export type LadoAllegationType = "physical_abuse" | "emotional_abuse" | "sexual_abuse" | "neglect" | "inappropriate_behaviour" | "inappropriate_relationship" | "boundary_violation" | "other";
export const LADO_ALLEGATION_TYPE_LABEL: Record<LadoAllegationType, string> = {
  physical_abuse: "Physical Abuse",
  emotional_abuse: "Emotional Abuse",
  sexual_abuse: "Sexual Abuse",
  neglect: "Neglect",
  inappropriate_behaviour: "Inappropriate Behaviour",
  inappropriate_relationship: "Inappropriate Relationship",
  boundary_violation: "Boundary Violation",
  other: "Other",
};

export type LadoOutcome = "substantiated" | "unsubstantiated" | "unfounded" | "malicious" | "pending";
export const LADO_OUTCOME_LABEL: Record<LadoOutcome, string> = {
  substantiated: "Substantiated",
  unsubstantiated: "Unsubstantiated",
  unfounded: "Unfounded",
  malicious: "Malicious",
  pending: "Pending",
};

export type LadoReferralStatus = "initial_assessment" | "lado_contacted" | "strategy_meeting" | "investigation" | "outcome_reached" | "closed" | "nfa";
export const LADO_REFERRAL_STATUS_LABEL: Record<LadoReferralStatus, string> = {
  initial_assessment: "Initial Assessment",
  lado_contacted: "LADO Contacted",
  strategy_meeting: "Strategy Meeting",
  investigation: "Investigation",
  outcome_reached: "Outcome Reached",
  closed: "Closed",
  nfa: "No Further Action",
};

export type LadoStaffAction = "suspended" | "restricted_duties" | "normal_duties" | "resigned" | "dismissed" | "cleared";
export const LADO_STAFF_ACTION_LABEL: Record<LadoStaffAction, string> = {
  suspended: "Suspended",
  restricted_duties: "Restricted Duties",
  normal_duties: "Normal Duties",
  resigned: "Resigned",
  dismissed: "Dismissed",
  cleared: "Cleared",
};

export type LadoConfidentialityLevel = "restricted" | "highly_restricted";
export const LADO_CONFIDENTIALITY_LEVEL_LABEL: Record<LadoConfidentialityLevel, string> = {
  restricted: "Restricted",
  highly_restricted: "Highly Restricted",
};

export interface LadoReferral {
  id: string;
  date_referred: string;
  date_allegation: string;
  referred_by: string;
  subject_staff_id: string;
  subject_staff_role: string;
  allegation_type: LadoAllegationType;
  status: LadoReferralStatus;
  outcome: LadoOutcome;
  staff_action: LadoStaffAction;
  child_ids: string[];
  lado_name: string;
  lado_contact: string;
  allegation_summary: string;
  evidence_summary: string;
  strategy_meeting_date: string | null;
  strategy_meeting_attendees: string[];
  investigation_findings: string;
  ofsted_notified: boolean;
  ofsted_notified_date: string | null;
  dbs_referral: boolean;
  police_involved: boolean;
  police_ref: string | null;
  support_for_staff: string;
  support_for_child: string;
  lesson_learned: string;
  confidentiality_level: LadoConfidentialityLevel;
  review_dates: string[];
  closed_date: string | null;
  closed_by: string | null;
  created_at: string;
}

/* Language & Communication Profiles (child-level) */

export type CommLevel = "age_appropriate" | "below_age" | "significant_need" | "non_verbal";
export const COMM_LEVEL_LABEL: Record<CommLevel, string> = {
  age_appropriate: "Age Appropriate",
  below_age: "Below Age",
  significant_need: "Significant Need",
  non_verbal: "Non-Verbal / Minimal Verbal",
};

export type CommSupportLevel = "no_additional" | "some_support" | "significant_support" | "specialist";
export const COMM_SUPPORT_LEVEL_LABEL: Record<CommSupportLevel, string> = {
  no_additional: "No Additional Support",
  some_support: "Some Support",
  significant_support: "Significant Support",
  specialist: "Specialist Support",
};

export type CommEffectiveness = "effective" | "partially_effective" | "not_effective" | "not_yet_evaluated";
export const COMM_EFFECTIVENESS_LABEL: Record<CommEffectiveness, string> = {
  effective: "Effective",
  partially_effective: "Partially Effective",
  not_effective: "Not Effective",
  not_yet_evaluated: "Not Yet Evaluated",
};

export type SendStatus = "none" | "sen_support" | "ehcp";
export const SEND_STATUS_LABEL: Record<SendStatus, string> = {
  none: "None",
  sen_support: "SEN Support",
  ehcp: "EHCP",
};

export interface CommunicationStrategy {
  strategy: string;
  in_use: boolean;
  effectiveness: CommEffectiveness;
  notes: string;
}

export interface CommunicationProfile {
  id: string;
  child_id: string;
  last_review_date: string;
  reviewed_by: string;
  preferred_language: string;
  additional_languages: string[];
  interpreter_required: boolean;
  interpreter_details: string | null;
  receptive_level: CommLevel;
  expressive_level: CommLevel;
  support_level: CommSupportLevel;
  send_status: SendStatus;
  salt_involved: boolean;
  salt_details: string | null;
  strengths: string[];
  challenges: string[];
  strategies: CommunicationStrategy[];
  aac_tools: string[];
  staff_guidance: string;
  child_views: string;
  created_at: string;
}

/* Leaving Care Financial Package (child-level) */

export type TransitionStage = "pre_pathway" | "building_16_17" | "active_leaving_17_18" | "post_care_18_plus";
export const TRANSITION_STAGE_LABEL: Record<TransitionStage, string> = {
  pre_pathway: "Pre-pathway",
  building_16_17: "Building (16-17)",
  active_leaving_17_18: "Active leaving (17-18)",
  post_care_18_plus: "Post-care (18+)",
};

export interface SavingsEntry {
  date: string;
  amount: number;
  source: string;
}

export interface LeavingCarePackage {
  id: string;
  child_id: string;
  child_initials: string;
  age: number;
  transition_stage: TransitionStage;
  junior_isa_balance: number;
  junior_isa_provider: string;
  junior_isa_contributions_to_date: string;
  savings_balance: number;
  savings_history: SavingsEntry[];
  setting_up_home_allowance: number;
  setting_up_home_allowance_used: number;
  setting_up_home_allowance_items: string[];
  monthly_allowance_current: number;
  financial_literacy_progression: Record<string, string>;
  bank_account_status: string;
  debt_and_credit: string;
  employment_status: string;
  benefits_applied: string[];
  housing_pathway: string;
  cost_of_living_costings: string;
  future_risk_factors: string[];
  protective_financial_factors: string[];
  reviewed_date: string;
  reviewed_by: string;
  created_at: string;
}

/* Lessons Learned Register (home-level) */

export type LessonSource = "incident" | "complaint" | "audit" | "reflective_practice" | "reg_44" | "external_feedback" | "critical_incident_review";
export const LESSON_SOURCE_LABEL: Record<LessonSource, string> = {
  incident: "Incident",
  complaint: "Complaint",
  audit: "Audit",
  reflective_practice: "Reflective Practice",
  reg_44: "Reg 44",
  external_feedback: "External Feedback",
  critical_incident_review: "Critical Incident Review",
};

export type LessonThemeArea = "safeguarding" | "practice" | "communication" | "recording" | "training" | "environment" | "wellbeing" | "multi_agency";
export const LESSON_THEME_AREA_LABEL: Record<LessonThemeArea, string> = {
  safeguarding: "Safeguarding",
  practice: "Practice",
  communication: "Communication",
  recording: "Recording",
  training: "Training",
  environment: "Environment",
  wellbeing: "Wellbeing",
  multi_agency: "Multi-agency",
};

export type LessonStatus = "identified" | "in_progress" | "embedded" | "monitoring";
export const LESSON_STATUS_LABEL: Record<LessonStatus, string> = {
  identified: "Identified",
  in_progress: "In Progress",
  embedded: "Embedded",
  monitoring: "Monitoring",
};

export interface LessonLearned {
  id: string;
  date_identified: string;
  source: LessonSource;
  source_reference: string;
  theme_area: LessonThemeArea;
  lesson: string;
  context: string;
  what_happened: string;
  root_cause_analysis: string;
  what_we_changed: string[];
  policies_updated: string[];
  training_delivered: string[];
  staff_briefed: boolean;
  briefing_date: string;
  evidence_of_embedding: string[];
  recurrence_check: string;
  status: LessonStatus;
  embedding_score: number;
  reviewed_by: string;
  next_review_date: string;
  created_at: string;
}

/* LGBTQ+ Inclusion Record (child-level) */

export type OutStatus = "yes" | "selectively" | "no" | "not_yet_decided";
export const OUT_STATUS_LABEL: Record<OutStatus, string> = {
  yes: "Yes",
  selectively: "Selectively",
  no: "No",
  not_yet_decided: "Not yet decided",
};

export interface LgbtqInclusionRecord {
  id: string;
  child_id: string;
  last_updated: string;
  identity_as_shared: string;
  pronouns: string;
  preferred_name: string;
  who_knows_at_child_pace: string[];
  out_at_school: OutStatus;
  out_to_family: OutStatus;
  identity_affirming_actions: string[];
  challenges_faced: string[];
  external_support: string[];
  staff_actions_this_month: string[];
  pronouns_used_consistently: boolean;
  preferred_name_used_consistently: boolean;
  child_voice: string;
  staff_observation: string;
  flags_concerns: string[];
  review_date: string;
  key_worker: string;
  created_at: string;
}

/* Life Story Work (child-level) */

export type LifeStoryEntryType = "memory" | "milestone" | "heritage" | "identity" | "wish" | "achievement" | "photo_story" | "creative";
export const LIFE_STORY_ENTRY_TYPE_LABEL: Record<LifeStoryEntryType, string> = {
  memory: "Memory",
  milestone: "Milestone",
  heritage: "Heritage",
  identity: "Identity",
  wish: "Wish / Dream",
  achievement: "Achievement",
  photo_story: "Photo Story",
  creative: "Creative Work",
};

export type LifeStoryEntryStatus = "in_progress" | "completed" | "planned";
export const LIFE_STORY_ENTRY_STATUS_LABEL: Record<LifeStoryEntryStatus, string> = {
  in_progress: "In Progress",
  completed: "Completed",
  planned: "Planned",
};

export interface LifeStoryEntry {
  id: string;
  child_id: string;
  date: string;
  type: LifeStoryEntryType;
  title: string;
  description: string;
  child_voice: string;
  facilitator: string;
  status: LifeStoryEntryStatus;
  linked_to_book: boolean;
  created_at: string;
}

/* ── Batch 38 ──────────────────────────────────────────────────────────── */

/* Locality Risk */
export type LocalityRiskCategory =
  | "county_lines" | "cse" | "trafficking" | "anti_social_behaviour"
  | "drug_activity" | "gang_activity" | "road_safety" | "environmental"
  | "community_tensions" | "online_risks" | "other";

export const LOCALITY_RISK_CATEGORY_LABEL: Record<LocalityRiskCategory, string> = {
  county_lines: "County Lines",
  cse: "CSE Risk",
  trafficking: "Trafficking",
  anti_social_behaviour: "Anti-Social Behaviour",
  drug_activity: "Drug Activity",
  gang_activity: "Gang Activity",
  road_safety: "Road Safety",
  environmental: "Environmental",
  community_tensions: "Community Tensions",
  online_risks: "Online Risks",
  other: "Other",
};

export type LocalityRiskLevel = "low" | "medium" | "high" | "critical";

export const LOCALITY_RISK_LEVEL_LABEL: Record<LocalityRiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export type MitigationEffectiveness = "effective" | "partial" | "ineffective";

export const MITIGATION_EFFECTIVENESS_LABEL: Record<MitigationEffectiveness, string> = {
  effective: "Effective",
  partial: "Partial",
  ineffective: "Ineffective",
};

export interface LocalityMitigation {
  measure: string;
  effectiveness: MitigationEffectiveness;
}

export interface LocalityRisk {
  id: string;
  category: LocalityRiskCategory;
  risk_level: LocalityRiskLevel;
  location: string;
  description: string;
  intelligence: string;
  mitigations: LocalityMitigation[];
  last_reviewed: string;
  reviewed_by: string;
  next_review: string;
  impact_on_yp: string;
  notes: string;
  created_at: string;
}

/* Lone Working */
export type LoneWorkingScenario =
  | "waking_night" | "sleep_in_cover" | "transport" | "community_outing"
  | "office_admin" | "home_visit" | "on_call" | "building_check";

export const LONE_WORKING_SCENARIO_LABEL: Record<LoneWorkingScenario, string> = {
  waking_night: "Waking Night Shift",
  sleep_in_cover: "Sleep-In (Cover Role)",
  transport: "Transport / Driving",
  community_outing: "Community Outing (1:1)",
  office_admin: "Office / Admin (alone in office)",
  home_visit: "Home Visit / Meeting Off-Site",
  on_call: "On-Call Manager",
  building_check: "Building / Premises Check",
};

export type LoneWorkingRiskLevel = "low" | "medium" | "high";

export const LONE_WORKING_RISK_LEVEL_LABEL: Record<LoneWorkingRiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export type LoneWorkingAssessmentStatus = "current" | "due_review" | "expired";

export const LONE_WORKING_ASSESSMENT_STATUS_LABEL: Record<LoneWorkingAssessmentStatus, string> = {
  current: "Current",
  due_review: "Due Review",
  expired: "Expired",
};

export interface LoneWorkingRecord {
  id: string;
  staff_id: string;
  scenario: LoneWorkingScenario;
  risk_level: LoneWorkingRiskLevel;
  status: LoneWorkingAssessmentStatus;
  assessment_date: string;
  review_date: string;
  assessed_by: string;
  hazards: string[];
  control_measures: string[];
  check_in_protocol: string;
  personal_alarm_issued: boolean;
  emergency_procedure: string;
  notes: string;
  created_at: string;
}

/* Lone Working Risk Assessment (per-staff full assessment) */
export type LWRAOverallRisk = "low" | "medium" | "high";

export const LWRA_OVERALL_RISK_LABEL: Record<LWRAOverallRisk, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export interface LWRAScenario {
  scenario: string;
  risk: LWRAOverallRisk;
  controls: string[];
}

export interface LWRATraining {
  course: string;
  date: string;
  valid: boolean;
}

export type LWRAApprovedShift = "early" | "late" | "sleep_in" | "wake_night" | "weekend";

export const LWRA_APPROVED_SHIFT_LABEL: Record<LWRAApprovedShift, string> = {
  early: "Early",
  late: "Late",
  sleep_in: "Sleep-in",
  wake_night: "Wake-night",
  weekend: "Weekend",
};

export interface LoneWorkingRiskAssessment {
  id: string;
  staff_member: string;
  role: string;
  scenarios: LWRAScenario[];
  competency_evidence: string[];
  training_completed: LWRATraining[];
  emergency_protocols: string[];
  check_in_arrangements: string;
  escalation_path: string[];
  approved_activities: string[];
  restricted_activities: string[];
  approved_to_work_alone: boolean;
  approved_shifts: LWRAApprovedShift[];
  vehicle_approved: boolean;
  community_visits_approved: boolean;
  overall_risk_level: LWRAOverallRisk;
  reviewed_date: string;
  reviewed_by: string;
  next_review_date: string;
  individual_considerations: string;
  staff_self_assessment: string;
  created_at: string;
}

/* Maintenance Schedule */
export type MaintenanceScheduleCategory =
  | "heating_boilers" | "electrical" | "gas_safety" | "fire_safety"
  | "water_hygiene" | "pest_control" | "roof_guttering" | "windows_doors"
  | "external_grounds" | "plumbing" | "pat_testing" | "lifts_access";

export const MAINTENANCE_SCHEDULE_CATEGORY_LABEL: Record<MaintenanceScheduleCategory, string> = {
  heating_boilers: "Heating & boilers",
  electrical: "Electrical",
  gas_safety: "Gas safety",
  fire_safety: "Fire safety",
  water_hygiene: "Water hygiene",
  pest_control: "Pest control",
  roof_guttering: "Roof & guttering",
  windows_doors: "Windows & doors",
  external_grounds: "External grounds",
  plumbing: "Plumbing",
  pat_testing: "PAT testing",
  lifts_access: "Lifts/access",
};

export type MaintenanceFrequency =
  | "annual" | "six_monthly" | "quarterly" | "monthly" | "weekly" | "as_required";

export const MAINTENANCE_FREQUENCY_LABEL: Record<MaintenanceFrequency, string> = {
  annual: "Annual",
  six_monthly: "6-monthly",
  quarterly: "Quarterly",
  monthly: "Monthly",
  weekly: "Weekly",
  as_required: "As required",
};

export type MaintenanceComplianceStatus = "in_date" | "due_now" | "overdue" | "booked";

export const MAINTENANCE_COMPLIANCE_STATUS_LABEL: Record<MaintenanceComplianceStatus, string> = {
  in_date: "In date",
  due_now: "Due now",
  overdue: "Overdue",
  booked: "Booked",
};

export interface MaintenanceDefect {
  date: string;
  defect: string;
  action: string;
}

export interface MaintenanceScheduleItem {
  id: string;
  item_name: string;
  category: MaintenanceScheduleCategory;
  regulatory_requirement: string;
  frequency: MaintenanceFrequency;
  contractor: string;
  contractor_contact: string;
  last_completed: string;
  last_certificate_ref: string;
  next_due: string;
  compliance_status: MaintenanceComplianceStatus;
  booked_date: string;
  notes: string;
  cost_annual: number;
  responsible_owner: string;
  defects_history: MaintenanceDefect[];
  escalation_contact: string;
  created_at: string;
}

/* Management Walkround */
export type WalkroundType =
  | "daily" | "weekly_themed" | "unannounced" | "pre_inspection_rehearsal" | "post_incident_review";

export const WALKROUND_TYPE_LABEL: Record<WalkroundType, string> = {
  daily: "Daily",
  weekly_themed: "Weekly themed",
  unannounced: "Unannounced",
  pre_inspection_rehearsal: "Pre-inspection rehearsal",
  post_incident_review: "Post-incident review",
};

export type EnvironmentalCheckStatus = "good" | "needs_attention" | "action_taken_in_moment";

export const ENVIRONMENTAL_CHECK_STATUS_LABEL: Record<EnvironmentalCheckStatus, string> = {
  good: "Good",
  needs_attention: "Needs attention",
  action_taken_in_moment: "Action taken in moment",
};

export interface WalkroundObservation {
  area: string;
  observation: string;
  staff_or_child_or_thing: string;
}

export interface WalkroundImprovement {
  area: string;
  observation: string;
  action_agreed: string;
}

export interface WalkroundChildInteraction {
  child_initial: string;
  observation: string;
}

export interface WalkroundStaffInteraction {
  staff_member: string;
  observation: string;
}

export interface WalkroundEnvironmentalCheck {
  area: string;
  status: EnvironmentalCheckStatus;
}

export interface WalkroundFollowUpAction {
  action: string;
  owner: string;
  deadline: string;
}

export interface ManagementWalkround {
  id: string;
  date: string;
  time: string;
  manager: string;
  walkround_type: WalkroundType;
  duration_minutes: number;
  areas_visited: string[];
  observations_positive: WalkroundObservation[];
  observations_for_improvement: WalkroundImprovement[];
  child_interactions: WalkroundChildInteraction[];
  staff_interactions: WalkroundStaffInteraction[];
  environmental_checks: WalkroundEnvironmentalCheck[];
  book_or_record_reviews: string[];
  immediate_actions_taken: string[];
  follow_up_actions_logged: WalkroundFollowUpAction[];
  themes_emerging: string[];
  positive_staff_practice_noted: string[];
  follow_up_date: string;
  created_at: string;
}

/* Mandatory Training Matrix */
export type TrainingCourseCategory = "mandatory" | "role_specific" | "best_practice";

export const TRAINING_COURSE_CATEGORY_LABEL: Record<TrainingCourseCategory, string> = {
  mandatory: "Mandatory",
  role_specific: "Role-specific",
  best_practice: "Best practice",
};

export type TrainingCourseStatus = "valid" | "expiring_soon" | "expired" | "not_completed";

export const TRAINING_COURSE_STATUS_LABEL: Record<TrainingCourseStatus, string> = {
  valid: "Valid",
  expiring_soon: "Expiring soon",
  expired: "Expired",
  not_completed: "Not completed",
};

export type TrainingOverallCompliance = "fully_compliant" | "action_required" | "non_compliant";

export const TRAINING_OVERALL_COMPLIANCE_LABEL: Record<TrainingOverallCompliance, string> = {
  fully_compliant: "Fully compliant",
  action_required: "Action required",
  non_compliant: "Non-compliant",
};

export interface TrainingStatusEntry {
  course_name: string;
  category: TrainingCourseCategory;
  completed_date: string;
  expiry_date: string;
  validity_months: number;
  status: TrainingCourseStatus;
  provider: string;
  certificate_on_file: boolean;
}

export interface TrainingMatrixRow {
  id: string;
  staff_id: string;
  role: string;
  training_statuses: TrainingStatusEntry[];
  overall_compliance: TrainingOverallCompliance;
  next_refresher_due: string;
  total_courses: number;
  valid_count: number;
  expiring_count: number;
  expired_count: number;
  created_at: string;
}

/* ── Batch 39 ────────────────────────────────────────────────────────────────── */

/* MAR Sheet */
export type MarRoute = "oral" | "topical" | "inhaler" | "injection";

export const MAR_ROUTE_LABEL: Record<MarRoute, string> = {
  oral: "Oral",
  topical: "Topical",
  inhaler: "Inhaler",
  injection: "Injection",
};

export type MarScheduleType = "prn" | "scheduled";

export const MAR_SCHEDULE_TYPE_LABEL: Record<MarScheduleType, string> = {
  prn: "PRN",
  scheduled: "Scheduled",
};

export interface MarEntry {
  id: string;
  date: string;
  time: string;
  child_id: string;
  medication_name: string;
  dose: string;
  route: MarRoute;
  schedule_type: MarScheduleType;
  administered_by: string;
  witnessed_by: string;
  signature: string;
  refused: boolean;
  refusal_reason: string;
  missed_dose: boolean;
  missed_reason: string;
  notes: string;
  batch_number: string;
  expiry_check: boolean;
  created_at: string;
}

/* Matching Referrals */
export type ReferralStatus = "received" | "shortlisted" | "assessment" | "panel" | "accepted" | "declined" | "withdrawn";

export const REFERRAL_STATUS_LABEL: Record<ReferralStatus, string> = {
  received: "Received",
  shortlisted: "Shortlisted",
  assessment: "Assessment",
  panel: "Panel",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
};

export type MatchScore = "strong" | "moderate" | "weak" | "unsuitable";

export const MATCH_SCORE_LABEL: Record<MatchScore, string> = {
  strong: "Strong",
  moderate: "Moderate",
  weak: "Weak",
  unsuitable: "Unsuitable",
};

export interface MatchDomain {
  domain: string;
  score: MatchScore;
  detail: string;
}

export type ReferralImpactRisk = "low" | "medium" | "high";

export const REFERRAL_IMPACT_RISK_LABEL: Record<ReferralImpactRisk, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export interface ImpactOnCurrent {
  young_person_id: string;
  risk: ReferralImpactRisk;
  detail: string;
  mitigations: string[];
}

export interface MatchingReferral {
  id: string;
  child_name: string;
  age: number;
  gender: string;
  local_authority: string;
  social_worker: string;
  referral_date: string;
  status: ReferralStatus;
  assigned_to: string;
  overall_match: MatchScore;
  match_domains: MatchDomain[];
  impact_on_current: ImpactOnCurrent[];
  strengths: string[];
  concerns: string[];
  conditions: string[];
  decision_date: string | null;
  decision_by: string | null;
  decision_rationale: string;
  placement_type: string;
  presenting_needs: string[];
  risk_factors: string[];
  created_at: string;
}

/* Media & Publicity Consent */
export type MediaConsentCategory =
  | "internal_life_story_book"
  | "internal_display_only"
  | "school_photo_yearbook"
  | "local_newspaper"
  | "newsletter_anonymised"
  | "social_media_sector_facing"
  | "inspection_reg44_evidence"
  | "court_legal"
  | "personal_request";

export const MEDIA_CONSENT_CATEGORY_LABEL: Record<MediaConsentCategory, string> = {
  internal_life_story_book: "Internal Life Story Book",
  internal_display_only: "Internal display only",
  school_photo_yearbook: "School photo / yearbook",
  local_newspaper: "Local newspaper",
  newsletter_anonymised: "Newsletter (anonymised)",
  social_media_sector_facing: "Social media (sector-facing)",
  inspection_reg44_evidence: "Inspection / Reg 44 evidence",
  court_legal: "Court / legal",
  personal_request: "Personal request",
};

export type ChildConsentResponse =
  | "yes_explicit"
  | "yes_assenting"
  | "declined"
  | "unsure_withdrawn"
  | "conditional"
  | "not_asked_inappropriate";

export const CHILD_CONSENT_RESPONSE_LABEL: Record<ChildConsentResponse, string> = {
  yes_explicit: "Yes - explicit",
  yes_assenting: "Yes - assenting",
  declined: "Declined",
  unsure_withdrawn: "Unsure - withdrawn",
  conditional: "Conditional",
  not_asked_inappropriate: "Not asked - inappropriate",
};

export interface MediaPublicityConsent {
  id: string;
  child_id: string;
  consent_requested_date: string;
  purpose: string;
  category: MediaConsentCategory;
  who_is_requesting: string;
  age_at_request: number;
  child_can_give_consent: boolean;
  child_gave_consent: ChildConsentResponse;
  parental_responsibility_consent: boolean;
  la_consent: boolean;
  conditions_agreed: string[];
  expiry_of_consent: string;
  child_can_withdraw_consent: boolean;
  withdrawal_process: string;
  child_identifiable: boolean;
  anonymisation_applied: string;
  storage_location: string;
  retention_period: string;
  recorded_by: string;
  notes: string;
  created_at: string;
}

/* Medication Audit */
export type MedAuditType =
  | "stock_check"
  | "controlled_drug_check"
  | "destruction"
  | "expiry_review"
  | "storage_check"
  | "reconciliation"
  | "return_to_pharmacy";

export const MED_AUDIT_TYPE_LABEL: Record<MedAuditType, string> = {
  stock_check: "Stock Count",
  controlled_drug_check: "Controlled Drug Check",
  destruction: "Medication Destruction",
  expiry_review: "Expiry Review",
  storage_check: "Storage Inspection",
  reconciliation: "MAR Reconciliation",
  return_to_pharmacy: "Return to Pharmacy",
};

export type MedAuditResult = "satisfactory" | "discrepancy_found" | "action_required" | "completed";

export const MED_AUDIT_RESULT_LABEL: Record<MedAuditResult, string> = {
  satisfactory: "Satisfactory",
  discrepancy_found: "Discrepancy Found",
  action_required: "Action Required",
  completed: "Completed",
};

export type MedAuditMedicationType = "regular" | "prn" | "controlled" | "otc" | "homely_remedy";

export const MED_AUDIT_MEDICATION_TYPE_LABEL: Record<MedAuditMedicationType, string> = {
  regular: "Regular",
  prn: "PRN (As Needed)",
  controlled: "Controlled Drug",
  otc: "Over the Counter",
  homely_remedy: "Homely Remedy",
};

export interface MedicationAuditRecord {
  id: string;
  date: string;
  time: string;
  audited_by: string;
  witnessed_by: string;
  audit_type: MedAuditType;
  result: MedAuditResult;
  child_id: string;
  medication_name: string;
  medication_type: MedAuditMedicationType;
  strength: string;
  expected_count: number | null;
  actual_count: number | null;
  discrepancy: number;
  expiry_date: string | null;
  batch_number: string;
  storage_correct: boolean;
  temperature_ok: boolean;
  labelling_correct: boolean;
  destruction_method: string;
  destruction_witness: string;
  pharmacy_name: string;
  notes: string;
  action_taken: string;
  follow_up_required: boolean;
  follow_up_date: string | null;
  signed_off_by: string;
  created_at: string;
}

/* Medication Error Investigation */
export type MedInvErrorType =
  | "wrong_dose_given"
  | "wrong_medication_given"
  | "wrong_time"
  | "missed_dose"
  | "double_dose"
  | "wrong_patient_averted"
  | "allergy_ignored"
  | "recording_error"
  | "omission";

export const MED_INV_ERROR_TYPE_LABEL: Record<MedInvErrorType, string> = {
  wrong_dose_given: "Wrong dose given",
  wrong_medication_given: "Wrong medication given",
  wrong_time: "Wrong time",
  missed_dose: "Missed dose",
  double_dose: "Double dose",
  wrong_patient_averted: "Wrong patient (averted)",
  allergy_ignored: "Allergy ignored",
  recording_error: "Recording error",
  omission: "Omission",
};

export type MedInvSeverity = "no_harm" | "minor_harm" | "moderate_harm" | "major_harm";

export const MED_INV_SEVERITY_LABEL: Record<MedInvSeverity, string> = {
  no_harm: "No harm",
  minor_harm: "Minor harm",
  moderate_harm: "Moderate harm",
  major_harm: "Major harm — referred for medical review",
};

export type MedInvStatus = "investigating" | "closed_resolved" | "reported_monitoring";

export const MED_INV_STATUS_LABEL: Record<MedInvStatus, string> = {
  investigating: "Investigating",
  closed_resolved: "Closed - resolved",
  reported_monitoring: "Reported - monitoring",
};

export interface MedicationErrorInvestigation {
  id: string;
  date_of_error: string;
  date_discovered: string;
  child_id: string;
  error_type: MedInvErrorType;
  staff_involved: string;
  error_severity: MedInvSeverity;
  child_impact_observed: string;
  immediate_actions_taken: string[];
  gp_consulted: boolean;
  gp_advice: string;
  parent_la_informed: boolean;
  child_informed_age_appropriately: boolean;
  child_response: string;
  root_cause_analysis: string;
  contributing_factors: string[];
  systemic_changes: string[];
  training_arising: string[];
  policy_arising: string;
  staff_emotional_impact: string;
  debrief_held: boolean;
  debrief_date: string;
  ofsted_notification_required: boolean;
  ofsted_notification_date: string;
  status: MedInvStatus;
  preventive_action_embedded: boolean;
  reviewed_by: string;
  notes: string;
  created_at: string;
}

/* Medication Near-Miss Log */
export type NearMissType =
  | "wrong_medication_selected"
  | "wrong_dose_calculated"
  | "wrong_time"
  | "missed_dose_almost_given_late"
  | "allergy_nearly_missed"
  | "expired_medication_caught"
  | "witness_procedure_not_followed"
  | "recording_error"
  | "storage_issue";

export const NEAR_MISS_TYPE_LABEL: Record<NearMissType, string> = {
  wrong_medication_selected: "Wrong medication selected",
  wrong_dose_calculated: "Wrong dose calculated",
  wrong_time: "Wrong time",
  missed_dose_almost_given_late: "Missed dose almost given late",
  allergy_nearly_missed: "Allergy nearly missed",
  expired_medication_caught: "Expired medication caught",
  witness_procedure_not_followed: "Witness procedure not followed",
  recording_error: "Recording error",
  storage_issue: "Storage issue",
};

export type NearMissRiskGrade = "low" | "medium" | "high" | "critical";

export const NEAR_MISS_RISK_GRADE_LABEL: Record<NearMissRiskGrade, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export interface MedicationNearMiss {
  id: string;
  date: string;
  time: string;
  child_id: string;
  reported_by: string;
  near_miss_type: NearMissType;
  what_nearly_happened: string;
  how_caught: string;
  contributing_factors: string[];
  child_informed: boolean;
  child_response: string;
  staff_emotional_impact: string;
  debrief_held: boolean;
  debrief_date: string;
  learning_points: string[];
  systemic_changes: string[];
  training_arising: string[];
  policy_arising: string;
  risk_grade: NearMissRiskGrade;
  would_escalate_if_recurred: boolean;
  pattern_check: string;
  reported_to_pharmacist: boolean;
  shareable_anonymously: boolean;
  created_at: string;
}

/* ── Batch 40 ─────────────────────────────────────────────────────────────── */

/* medication-stock-check */
export type StockCheckType = "weekly" | "monthly_audit";
export const STOCK_CHECK_TYPE_LABEL: Record<StockCheckType, string> = {
  weekly: "Weekly Stock Check",
  monthly_audit: "Monthly Audit",
};

export type StockCheckStatus = "balanced" | "discrepancy" | "action_required";
export const STOCK_CHECK_STATUS_LABEL: Record<StockCheckStatus, string> = {
  balanced: "Balanced",
  discrepancy: "Discrepancy",
  action_required: "Action Required",
};

export interface StockCheckItem {
  yp: string;
  medication: string;
  expected_count: number;
  actual_count: number;
  unit: string;
  expiry_date: string;
  discrepancy: boolean;
}

export interface MedicationStockCheck {
  id: string;
  date: string;
  check_type: StockCheckType;
  checked_by: string;
  witnessed_by: string;
  status: StockCheckStatus;
  items: StockCheckItem[];
  notes: string;
  created_at: string;
}

/* medication-storage-audit */
export type StorageAuditCabinetType = "main_lockable" | "prn_cabinet" | "controlled_drugs_safe" | "refrigerated" | "childrens_room";
export const STORAGE_AUDIT_CABINET_TYPE_LABEL: Record<StorageAuditCabinetType, string> = {
  main_lockable: "Main lockable medicine cabinet",
  prn_cabinet: "PRN cabinet",
  controlled_drugs_safe: "Controlled drugs safe",
  refrigerated: "Refrigerated storage",
  childrens_room: "Children's room (specific medication)",
};

export type StorageAuditVerdict = "pass" | "pass_with_minor_actions" | "fail_immediate_action";
export const STORAGE_AUDIT_VERDICT_LABEL: Record<StorageAuditVerdict, string> = {
  pass: "Pass",
  pass_with_minor_actions: "Pass with minor actions",
  fail_immediate_action: "Fail - immediate action required",
};

export type CleanlinessRating = "excellent" | "good" | "adequate" | "needs_attention";
export const CLEANLINESS_RATING_LABEL: Record<CleanlinessRating, string> = {
  excellent: "Excellent",
  good: "Good",
  adequate: "Adequate",
  needs_attention: "Needs attention",
};

export type FollowUpStatus = "open" | "in_progress" | "done";
export const FOLLOW_UP_STATUS_LABEL: Record<FollowUpStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  done: "Done",
};

export interface StorageAuditCheckItem {
  item: string;
  pass: boolean;
  observation: string;
  action_required: string;
}

export interface StorageAuditExpiringItem {
  medication: string;
  expiry_date: string;
}

export interface StorageAuditExpiredItem {
  medication: string;
  expiry_date: string;
  disposal_date: string;
}

export interface StorageAuditFollowUp {
  action: string;
  owner: string;
  deadline: string;
  status: FollowUpStatus;
}

export interface MedicationStorageAudit {
  id: string;
  audit_date: string;
  auditor: string;
  cabinet_location: string;
  cabinet_type: StorageAuditCabinetType;
  checks: StorageAuditCheckItem[];
  temperature_range: string;
  temperature_recorded: number;
  temperature_within_range: boolean;
  expiry_check_completed: boolean;
  expiring_soon: StorageAuditExpiringItem[];
  expired_found: StorageAuditExpiredItem[];
  controlled_drugs_balance_correct: boolean;
  controlled_drugs_discrepancies: string[];
  cleanliness_rating: CleanlinessRating;
  security_check_pass: boolean;
  keys_accounted_for: boolean;
  record_keeping_pass: boolean;
  overall_verdict: StorageAuditVerdict;
  immediate_actions_taken: string[];
  follow_up_actions: StorageAuditFollowUp[];
  next_audit_due: string;
  signed_off_by: string;
  created_at: string;
}

/* medication-training */
export type MedCompetencyType = "level_3_cert" | "administration" | "controlled_drugs" | "prn_assessment" | "epipen" | "buccal_midazolam" | "insulin" | "rectal_diazepam" | "inhaler" | "refresher";
export const MED_COMPETENCY_TYPE_LABEL: Record<MedCompetencyType, string> = {
  level_3_cert: "Level 3 Medication Certificate",
  administration: "General Administration",
  controlled_drugs: "Controlled Drugs",
  prn_assessment: "PRN Assessment",
  epipen: "EpiPen",
  buccal_midazolam: "Buccal Midazolam",
  insulin: "Insulin Administration",
  rectal_diazepam: "Rectal Diazepam",
  inhaler: "Inhaler Technique",
  refresher: "Annual Refresher",
};

export type MedCompetencyStatus = "competent" | "not_yet_competent" | "expired" | "in_training" | "supervised_only";
export const MED_COMPETENCY_STATUS_LABEL: Record<MedCompetencyStatus, string> = {
  competent: "Competent",
  not_yet_competent: "Not Yet Competent",
  expired: "Expired",
  in_training: "In Training",
  supervised_only: "Supervised Only",
};

export interface MedTrainingRecord {
  id: string;
  staff_id: string;
  competency_type: MedCompetencyType;
  status: MedCompetencyStatus;
  assessment_date: string;
  assessed_by: string;
  expiry_date: string;
  score: number | null;
  pass_threshold: number;
  practical_assessment: boolean;
  written_assessment: boolean;
  observations: number;
  notes: string;
  action_plan: string;
  next_assessment_date: string;
  created_at: string;
}

/* memorial-occasion-records */
export type MemorialOccasionType = "bereavement_death" | "annual_remembrance" | "pet_bereavement" | "loss_anniversary" | "family_anniversary" | "cultural_memorial_day";
export const MEMORIAL_OCCASION_TYPE_LABEL: Record<MemorialOccasionType, string> = {
  bereavement_death: "Bereavement (death)",
  annual_remembrance: "Annual remembrance",
  pet_bereavement: "Pet bereavement",
  loss_anniversary: "Loss anniversary",
  family_anniversary: "Family anniversary",
  cultural_memorial_day: "Cultural memorial day",
};

export interface MemorialOccasionRecord {
  id: string;
  occasion: MemorialOccasionType;
  date: string;
  who_is_remembered: string;
  affected_children: string[];
  significance: string;
  child_preferences: string;
  rituals_observed: string[];
  staff_role_on_day: string;
  external_support: string;
  child_expressions_observed: string;
  follow_up_date: string;
  notes: string;
  created_at: string;
}

/* menstrual-health-tracker */
export type MenstrualStage = "pre_puberty_awareness" | "early_signs_noted" | "started_menstruating" | "established" | "na_not_menstruating";
export const MENSTRUAL_STAGE_LABEL: Record<MenstrualStage, string> = {
  pre_puberty_awareness: "Pre-puberty awareness",
  early_signs_noted: "Early signs noted",
  started_menstruating: "Started menstruating",
  established: "Established",
  na_not_menstruating: "N/A — not menstruating",
};

export type MenstrualComfortLevel = "comfortable_discussing" | "developing_comfort" | "reluctant" | "private_staff_only";
export const MENSTRUAL_COMFORT_LEVEL_LABEL: Record<MenstrualComfortLevel, string> = {
  comfortable_discussing: "Comfortable discussing",
  developing_comfort: "Developing comfort",
  reluctant: "Reluctant",
  private_staff_only: "Private — staff only when needed",
};

export interface MenstrualHealthPlan {
  id: string;
  child_id: string;
  child_initiation_stage: MenstrualStage;
  child_informed_consent_age: string;
  supporting_staff: string;
  preferred_female_staff_only: boolean;
  products_provided: string[];
  child_chosen_products: boolean;
  pain_management: string;
  education_delivered: string[];
  accessibility_of_products: string;
  privacy_arrangements: string;
  family_conversations: string;
  school_health_support: string;
  conversations_with_child: string;
  child_comfort_level: MenstrualComfortLevel;
  plan_reviewed_date: string;
  reviewed_by: string;
  confidentiality_note: string;
  created_at: string;
}

/* menu-planning */
export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "supper";
export const MEAL_TYPE_LABEL: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  supper: "Supper",
};

export type DietaryFlag = "vegetarian" | "vegan" | "halal" | "gluten_free" | "dairy_free" | "nut_free" | "none";
export const DIETARY_FLAG_LABEL: Record<DietaryFlag, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  halal: "Halal",
  gluten_free: "Gluten Free",
  dairy_free: "Dairy Free",
  nut_free: "Nut Free",
  none: "Standard",
};

export interface MealChildPreference {
  child_id: string;
  rating: "liked" | "disliked" | "not_eaten";
}

export interface MealPlan {
  id: string;
  date: string;
  meal: MealType;
  main_dish: string;
  sides: string[];
  dessert: string;
  dietary_flags: DietaryFlag[];
  prepared_by: string;
  child_preferences: MealChildPreference[];
  special_notes: string;
  budget: number;
  leftover_action: string;
  created_at: string;
}

// ── Missing Return Interviews ─────────────────────────────────────────────────

export type ReturnInterviewStatus = "completed" | "offered_declined" | "pending" | "not_yet_due";
export const RETURN_INTERVIEW_STATUS_LABEL: Record<ReturnInterviewStatus, string> = {
  completed: "Completed",
  offered_declined: "Declined",
  pending: "Pending",
  not_yet_due: "Not Yet Due",
};

export type ReturnInterviewActionStatus = "completed" | "in_progress" | "pending";
export const RETURN_INTERVIEW_ACTION_STATUS_LABEL: Record<ReturnInterviewActionStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  pending: "Pending",
};

export interface ReturnInterviewAction {
  action: string;
  owner: string;
  deadline: string;
  status: ReturnInterviewActionStatus;
}

export interface ReturnInterview {
  id: string;
  child_id: string;
  missing_episode_date: string;
  return_date: string;
  interview_date: string | null;
  interviewed_by: string;
  independent_of_home: boolean;
  interview_status: ReturnInterviewStatus;
  declined_reason: string | null;
  duration: string | null;
  location: string;
  push_factors: string[];
  pull_factors: string[];
  where_went: string;
  who_with: string;
  risks_identified: string[];
  exploitation_concerns: boolean;
  exploitation_details: string | null;
  child_view_on_safety: string;
  what_would_help: string;
  actions_agreed: ReturnInterviewAction[];
  shared_with: string[];
  notes: string;
  created_at: string;
}

// ── Multi-Agency Meetings ─────────────────────────────────────────────────────

export type MultiAgencyMeetingType = "lac_review" | "pep" | "cin" | "cpp" | "strategy" | "professionals" | "ehcp_annual" | "transition" | "placement" | "disruption";
export const MULTI_AGENCY_MEETING_TYPE_LABEL: Record<MultiAgencyMeetingType, string> = {
  lac_review: "LAC Review",
  pep: "PEP",
  cin: "CIN Meeting",
  cpp: "Child Protection Conference",
  strategy: "Strategy Meeting",
  professionals: "Professionals Meeting",
  ehcp_annual: "EHCP Annual Review",
  transition: "Transition Planning",
  placement: "Placement Meeting",
  disruption: "Disruption Meeting",
};

export type MultiAgencyMeetingStatus = "scheduled" | "completed" | "cancelled" | "postponed";
export const MULTI_AGENCY_MEETING_STATUS_LABEL: Record<MultiAgencyMeetingStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  postponed: "Postponed",
};

export interface MeetingAttendee {
  name: string;
  role: string;
  organisation: string;
  attended: boolean;
}

export interface MultiAgencyActionItem {
  action: string;
  owner: string;
  due_date: string;
  status: MeetingActionStatus;
}

export interface MultiAgencyMeeting {
  id: string;
  child_id: string;
  meeting_type: MultiAgencyMeetingType;
  meeting_status: MultiAgencyMeetingStatus;
  date: string;
  time: string;
  venue: string;
  chaired_by: string;
  home_representative: string;
  attendees: MeetingAttendee[];
  key_discussion_points: string[];
  decisions_reached: string[];
  child_participation: string;
  action_items: MultiAgencyActionItem[];
  next_meeting_date: string | null;
  notes: string;
  created_at: string;
}

// ── Multi-Disciplinary Formulation ────────────────────────────────────────────

export type FormulationModel = "5ps" | "cognitive_behavioural" | "attachment_based" | "trauma_informed" | "systemic" | "integrated";
export const FORMULATION_MODEL_LABEL: Record<FormulationModel, string> = {
  "5ps": "5Ps",
  cognitive_behavioural: "Cognitive Behavioural",
  attachment_based: "Attachment-based",
  trauma_informed: "Trauma-informed",
  systemic: "Systemic",
  integrated: "Integrated",
};

export interface MultiDisciplinaryFormulation {
  id: string;
  child_id: string;
  version: number;
  formulation_date: string;
  model_used: FormulationModel;
  participants_attended: string[];
  presenting_difficulties: string[];
  predisposing: string[];
  precipitating: string[];
  perpetuating: string[];
  protective: string[];
  key_hypotheses: string[];
  agreed_interventions: string[];
  risk_factors: string[];
  child_contribution: string;
  next_review_date: string;
  internal_lead: string;
  shareable_summary: string;
  confidential_notes: string;
  created_at: string;
}

// ── Museum & Cultural Visits ──────────────────────────────────────────────────

export type CulturalVisitVenueType = "museum" | "art_gallery" | "theatre" | "cinema" | "heritage_site" | "library_special_exhibit" | "music_venue" | "stadium_tour" | "botanical_garden" | "aquarium_zoo" | "cultural_festival";
export const CULTURAL_VISIT_VENUE_TYPE_LABEL: Record<CulturalVisitVenueType, string> = {
  museum: "Museum",
  art_gallery: "Art Gallery",
  theatre: "Theatre",
  cinema: "Cinema",
  heritage_site: "Heritage Site",
  library_special_exhibit: "Library Special Exhibit",
  music_venue: "Music Venue",
  stadium_tour: "Stadium Tour",
  botanical_garden: "Botanical Garden",
  aquarium_zoo: "Aquarium/Zoo",
  cultural_festival: "Cultural Festival",
};

export interface CulturalVisit {
  id: string;
  date: string;
  venue_name: string;
  venue_type: CulturalVisitVenueType;
  young_people_attended: string[];
  staff_escort: string[];
  purpose_of_visit: string;
  learning_outcomes: string[];
  child_interest_area: Record<string, string>;
  duration_hours: number;
  cost_total: number;
  accessibility_adjustments: string[];
  child_comments: Record<string, string>;
  staff_observations: string;
  photographs_taken: boolean;
  photo_consent_log: string;
  repeat_visit_interest: boolean;
  linked_to_curriculum: string;
  linked_to_care_plan_goal: string;
  travel_logged: string;
  created_at: string;
}

// ── Night Checks ──────────────────────────────────────────────────────────────

export type NightCheckSleepStatus = "sleeping" | "awake_settled" | "awake_unsettled" | "distressed" | "not_in_room" | "asleep_restless";
export const NIGHT_CHECK_SLEEP_STATUS_LABEL: Record<NightCheckSleepStatus, string> = {
  sleeping: "Sleeping",
  awake_settled: "Awake (Settled)",
  awake_unsettled: "Awake (Unsettled)",
  distressed: "Distressed",
  not_in_room: "Not in Room",
  asleep_restless: "Restless Sleep",
};

export type NightCheckType = "scheduled" | "additional" | "concern_follow_up";
export const NIGHT_CHECK_TYPE_LABEL: Record<NightCheckType, string> = {
  scheduled: "Scheduled",
  additional: "Additional",
  concern_follow_up: "Concern Follow-up",
};

export type DoorPosition = "open" | "closed" | "ajar";
export const DOOR_POSITION_LABEL: Record<DoorPosition, string> = {
  open: "Open",
  closed: "Closed",
  ajar: "Ajar",
};

export interface NightCheck {
  id: string;
  date: string;
  time: string;
  child_id: string;
  staff_id: string;
  sleep_status: NightCheckSleepStatus;
  check_type: NightCheckType;
  notes: string;
  concern_raised: boolean;
  concern_detail: string | null;
  room_temp_ok: boolean;
  door_position: DoorPosition;
  created_at: string;
}

// ── Night Staff Guidance ──────────────────────────────────────────────────────

export type GuidancePriority = "essential" | "important" | "reference";
export const GUIDANCE_PRIORITY_LABEL: Record<GuidancePriority, string> = {
  essential: "Essential",
  important: "Important",
  reference: "Reference",
};

export type GuidanceSectionKey = "night_check_schedule" | "emergency_procedures" | "medication_night" | "lone_working" | "contact_numbers" | "night_shift_handover" | "night_tasks_checklist" | "fire_evacuation_night";
export const GUIDANCE_SECTION_KEY_LABEL: Record<GuidanceSectionKey, string> = {
  night_check_schedule: "Night Check Schedule",
  emergency_procedures: "Emergency Procedures",
  medication_night: "Medication — Night Procedures",
  lone_working: "Lone Working Protocol",
  contact_numbers: "Contact Numbers",
  night_shift_handover: "Night Shift Handover",
  night_tasks_checklist: "Night Tasks Checklist",
  fire_evacuation_night: "Fire Evacuation — Night Specific",
};

export interface NightStaffGuidanceSection {
  id: string;
  section_key: GuidanceSectionKey;
  title: string;
  priority: GuidancePriority;
  last_updated: string;
  content: string[];
  created_at: string;
}

// ── Night Staff Handover ──────────────────────────────────────────────────────

export interface NightStaffHandover {
  id: string;
  date: string;
  evening_staff: string;
  night_staff: string;
  handover_time: string;
  children_at_home: string[];
  children_sleeping: Record<string, string>;
  children_awake: string;
  medication_given: boolean;
  medication_due: string;
  risk_briefing: string[];
  specific_concerns: Record<string, string>;
  night_checks_required: Record<string, string>;
  expected_returns: string;
  emergency_contacts: string;
  morning_wake_time: string;
  morning_staff: string;
  night_events: string[];
  morning_handover_complete: boolean;
  created_at: string;
}

// ── Night-time Anxiety Support ────────────────────────────────────────────────

export type AnxietyLevel = "settled" | "mild" | "moderate" | "severe" | "crisis";
export const ANXIETY_LEVEL_LABEL: Record<AnxietyLevel, string> = {
  settled: "Settled",
  mild: "Mild — manageable",
  moderate: "Moderate",
  severe: "Severe — frequent waking",
  crisis: "Crisis — sleep severely impacted",
};

export type NightmareFrequency = "none" | "occasional" | "weekly" | "multiple_per_week" | "most_nights";
export const NIGHTMARE_FREQUENCY_LABEL: Record<NightmareFrequency, string> = {
  none: "None",
  occasional: "Occasional",
  weekly: "Weekly",
  multiple_per_week: "Multiple per week",
  most_nights: "Most nights",
};

export interface NightAnxietySupportRecord {
  id: string;
  child_id: string;
  record_date: string;
  anxiety_level: AnxietyLevel;
  primary_triggers: string[];
  bedtime_routine: string[];
  comfort_items: string[];
  do_strategies: string[];
  do_not_strategies: string[];
  child_preferences: string;
  external_referral_active: string | null;
  average_sleep_hours: number | null;
  nightmare_frequency: NightmareFrequency;
  hypervigilance_notes: string | null;
  child_voice: string;
  staff_observation: string;
  staff_actions_last_week: string[];
  review_date: string;
  key_worker: string;
  created_at: string;
}

// ── Notification Log ──────────────────────────────────────────────────────────

export interface NotificationLogEntry {
  id: string;
  date: string;
  notified_to: string;
  method: string;
  notification_type: string;
  regulation: string;
  event_summary: string;
  sent_by: string;
  within_timeframe: boolean;
  required_timeframe: string;
  actual_timeframe: string;
  acknowledgement_received: boolean;
  linked_event: string;
  notes: string;
  created_at: string;
}

// ── Occupational Therapy Records ──────────────────────────────────────────────

export type OtSessionType = "assessment" | "direct_intervention" | "consultation" | "review" | "sensory_diet_planning" | "equipment_recommendation" | "training_to_staff";
export const OT_SESSION_TYPE_LABEL: Record<OtSessionType, string> = {
  assessment: "Assessment",
  direct_intervention: "Direct Intervention",
  consultation: "Consultation",
  review: "Review",
  sensory_diet_planning: "Sensory Diet Planning",
  equipment_recommendation: "Equipment Recommendation",
  training_to_staff: "Training to Staff",
};

export interface OtRecommendation {
  area: string;
  recommendation: string;
  frequency: string;
  equipment: string;
  staff_support_level: string;
}

export interface OccupationalTherapyRecord {
  id: string;
  child_id: string;
  assessment_date: string;
  ot_name: string;
  ot_organisation: string;
  session_type: OtSessionType;
  duration_minutes: number;
  location: string;
  focus_areas: string[];
  assessment_tools: string[];
  findings: string;
  sensory_profile: string;
  recommendations: OtRecommendation[];
  sensory_diet: string[];
  equipment_provided: string[];
  staff_training: string;
  home_practice_advised: string[];
  child_response: string;
  family_informed_date: string;
  progress_noted_since_last: string;
  next_review_date: string;
  report_provided: boolean;
  created_at: string;
}

// ── Ofsted Action Plan ────────────────────────────────────────────────────────

export type OfstedActionType = "requirement" | "recommendation" | "observation";
export const OFSTED_ACTION_TYPE_LABEL: Record<OfstedActionType, string> = {
  requirement: "Requirement",
  recommendation: "Recommendation",
  observation: "Observation",
};

export type OfstedActionPriority = "high" | "medium" | "low";
export const OFSTED_ACTION_PRIORITY_LABEL: Record<OfstedActionPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export type OfstedActionStatus = "completed" | "in_progress" | "not_started" | "noted";
export const OFSTED_ACTION_STATUS_LABEL: Record<OfstedActionStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  not_started: "Not Started",
  noted: "Noted",
};

export interface OfstedActionUpdate {
  date: string;
  note: string;
  updated_by: string;
}

export interface OfstedActionItem {
  id: string;
  inspection_date: string;
  action_type: OfstedActionType;
  text: string;
  priority: OfstedActionPriority | null;
  status: OfstedActionStatus;
  owner: string | null;
  target_date: string | null;
  completed_date: string | null;
  progress: number;
  evidence: string;
  updates: OfstedActionUpdate[];
  created_at: string;
}

// ── Ofsted Engagement Log ─────────────────────────────────────────────────────

export type OfstedEngagementType = "statutory_notification" | "update_letter" | "phone_call_hmi" | "phone_call_rm" | "email" | "monitoring_visit" | "mock_inspection" | "reg45_submission" | "annual_return" | "inspection_full";
export const OFSTED_ENGAGEMENT_TYPE_LABEL: Record<OfstedEngagementType, string> = {
  statutory_notification: "Statutory Notification",
  update_letter: "Update Letter",
  phone_call_hmi: "Phone Call (HMI Initiated)",
  phone_call_rm: "Phone Call (RM Initiated)",
  email: "Email",
  monitoring_visit: "Monitoring Visit",
  mock_inspection: "Mock Inspection",
  reg45_submission: "Reg 45 Submission",
  annual_return: "Annual Return",
  inspection_full: "Inspection (Full)",
};

export type OfstedEngagementStatus = "closed_resolved" | "active" | "following_up";
export const OFSTED_ENGAGEMENT_STATUS_LABEL: Record<OfstedEngagementStatus, string> = {
  closed_resolved: "Closed - Resolved",
  active: "Active",
  following_up: "Following Up",
};

export interface OfstedEngagementAction {
  action: string;
  owner: string;
  deadline: string;
  status: string;
}

export interface OfstedEngagementRecord {
  id: string;
  date: string;
  engagement_type: OfstedEngagementType;
  reference: string;
  inspector_or_team: string;
  topic_or_reason: string;
  summary: string;
  our_response: string;
  documents_shared: string[];
  actions_agreed: OfstedEngagementAction[];
  inspector_feedback: string;
  our_reflection: string;
  recorded_by: string;
  next_engagement: string;
  engagement_status: OfstedEngagementStatus;
  created_at: string;
}

// ── Ofsted Self-Evaluation ────────────────────────────────────────────────────

export type SelfEvaluationGrade = "outstanding" | "good" | "requires_improvement" | "inadequate";
export const SELF_EVALUATION_GRADE_LABEL: Record<SelfEvaluationGrade, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export interface SelfEvaluationAction {
  action: string;
  owner: string;
  target_date: string;
  status: string;
}

export interface SelfEvaluationArea {
  id: string;
  area: string;
  self_grade: SelfEvaluationGrade;
  strengths: string[];
  evidence: string[];
  areas_for_development: string[];
  actions: SelfEvaluationAction[];
  created_at: string;
}

// ── On-Call Rota ──────────────────────────────────────────────────────────────

export type OnCallRole = "first_line_rm" | "second_line_deputy" | "senior_practitioner_cover";
export const ON_CALL_ROLE_LABEL: Record<OnCallRole, string> = {
  first_line_rm: "First-line On-Call (RM)",
  second_line_deputy: "Second-line On-Call (Deputy)",
  senior_practitioner_cover: "Senior Practitioner Cover",
};

export type OnCallShiftPattern = "weekday_evenings" | "weekend_full" | "bank_holiday" | "standard_rota";
export const ON_CALL_SHIFT_PATTERN_LABEL: Record<OnCallShiftPattern, string> = {
  weekday_evenings: "Weekday Evenings 17:00–08:00",
  weekend_full: "Weekend Full",
  bank_holiday: "Bank Holiday",
  standard_rota: "Standard Rota Slot",
};

export interface OnCallCall {
  datetime: string;
  from_contact: string;
  call_type: string;
  duration_mins: number;
  outcome: string;
  escalated: boolean;
}

export interface OnCallShift {
  id: string;
  date_from: string;
  date_to: string;
  role: OnCallRole;
  on_call_staff: string;
  backup_staff: string;
  contact_number: string;
  shift_pattern: OnCallShiftPattern;
  calls_received: OnCallCall[];
  critical_incidents_handled: number;
  routine_calls_handled: number;
  advisory_calls_handled: number;
  staff_wellbeing_during_on_call: string;
  feedback_on_arrangements: string;
  review_notes: string;
  created_at: string;
}

// ── Online Gaming Tracker ─────────────────────────────────────────────────────

export type PegiRating = "3" | "7" | "12" | "16" | "18";
export const PEGI_RATING_LABEL: Record<PegiRating, string> = {
  "3": "PEGI 3",
  "7": "PEGI 7",
  "12": "PEGI 12",
  "16": "PEGI 16",
  "18": "PEGI 18",
};

export interface GamingPrimaryGame {
  title: string;
  pegi_rating: PegiRating;
  age_appropriate: boolean;
}

export interface OnlineGamingRecord {
  id: string;
  child_id: string;
  review_date: string;
  console: string;
  primary_games: GamingPrimaryGame[];
  weekly_hours: number;
  voice_chat_used: boolean;
  online_friends_known_in_person: number;
  online_friends_known_only: number;
  in_game_spend_this_month: number;
  spend_cap: number;
  flags_concerns: string[];
  protective_factors: string[];
  parental_controls_active: boolean;
  screen_time_balance_note: string;
  child_voice: string;
  staff_observation: string;
  next_review: string;
  key_worker: string;
  created_at: string;
}

// ── Online Safety ─────────────────────────────────────────────────────────────

export type OnlineSafetyIncidentCategory = "cyberbullying" | "inappropriate_content" | "contact_risk" | "sharing_images" | "gaming_risk" | "social_media" | "radicalisation" | "financial_scam" | "data_privacy" | "excessive_use";
export const ONLINE_SAFETY_INCIDENT_CATEGORY_LABEL: Record<OnlineSafetyIncidentCategory, string> = {
  cyberbullying: "Cyberbullying",
  inappropriate_content: "Inappropriate Content",
  contact_risk: "Contact Risk",
  sharing_images: "Sharing Images",
  gaming_risk: "Gaming Risk",
  social_media: "Social Media",
  radicalisation: "Radicalisation",
  financial_scam: "Financial Scam",
  data_privacy: "Data Privacy",
  excessive_use: "Excessive Use",
};

export type OnlineSafetySeverity = "low" | "medium" | "high" | "critical";
export const ONLINE_SAFETY_SEVERITY_LABEL: Record<OnlineSafetySeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export type OnlineSafetyIncidentStatus = "open" | "monitoring" | "resolved" | "escalated";
export const ONLINE_SAFETY_INCIDENT_STATUS_LABEL: Record<OnlineSafetyIncidentStatus, string> = {
  open: "Open",
  monitoring: "Monitoring",
  resolved: "Resolved",
  escalated: "Escalated",
};

export interface OnlineSafetyIncident {
  id: string;
  child_id: string;
  date: string;
  category: OnlineSafetyIncidentCategory;
  severity: OnlineSafetySeverity;
  status: OnlineSafetyIncidentStatus;
  platform: string;
  summary: string;
  detail: string;
  discovered_by: string;
  actions_taken: string[];
  safeguarding_referral: boolean;
  parent_carer_notified: boolean;
  child_discussion: string;
  follow_up: string;
  created_at: string;
}

export interface OnlineSafetyAgreement {
  id: string;
  child_id: string;
  agreement_date: string;
  review_date: string;
  devices: string[];
  allowed_platforms: string[];
  restrictions: string[];
  wifi_curfew: string;
  parental_controls: string;
  child_signature: boolean;
  created_at: string;
}

// ── Operational Meetings ──────────────────────────────────────────────────────

export type OperationalMeetingType = "morning_huddle" | "shift_change_handover" | "end_of_day_debrief" | "weekly_team_meeting" | "crisis_briefing" | "rm_121_deputy";
export const OPERATIONAL_MEETING_TYPE_LABEL: Record<OperationalMeetingType, string> = {
  morning_huddle: "Morning Huddle",
  shift_change_handover: "Shift Change Handover Summary",
  end_of_day_debrief: "End-of-Day Debrief",
  weekly_team_meeting: "Weekly Team Meeting",
  crisis_briefing: "Crisis Briefing",
  rm_121_deputy: "RM 1-2-1 with Deputy",
};

export type OperationalActionStatus = "open" | "in_progress" | "complete";
export const OPERATIONAL_ACTION_STATUS_LABEL: Record<OperationalActionStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  complete: "Complete",
};

export interface OperationalMeetingAction {
  action: string;
  owner: string;
  deadline: string;
  status: OperationalActionStatus;
}

export interface OperationalMeeting {
  id: string;
  date: string;
  time: string;
  meeting_type: OperationalMeetingType;
  duration_minutes: number;
  chair: string;
  attendees: string[];
  agenda: string[];
  key_decisions: string[];
  child_updates: Record<string, string>;
  risks_identified: string[];
  staff_wellbeing_observations: string;
  actions_agreed: OperationalMeetingAction[];
  positive_moments_shared: string[];
  next_meeting: string;
  minuted_by: string;
  created_at: string;
}

// ── Opticians Records ─────────────────────────────────────────────────────────

export type OpticalStatus = "active_nhs" | "active_private" | "awaiting_registration";
export const OPTICAL_STATUS_LABEL: Record<OpticalStatus, string> = {
  active_nhs: "Active NHS",
  active_private: "Active Private",
  awaiting_registration: "Awaiting Registration",
};

export type OpticalRecallInterval = "annual" | "two_yearly" | "specialist_follow_up";
export const OPTICAL_RECALL_INTERVAL_LABEL: Record<OpticalRecallInterval, string> = {
  annual: "Annual",
  two_yearly: "2-Yearly",
  specialist_follow_up: "Specialist Follow-up",
};

export type GlassesType = "reading" | "distance" | "varifocals" | "reading_screen" | "sports" | "sunglasses_prescription";
export const GLASSES_TYPE_LABEL: Record<GlassesType, string> = {
  reading: "Reading",
  distance: "Distance",
  varifocals: "Varifocals",
  reading_screen: "Reading + Screen",
  sports: "Sports Glasses",
  sunglasses_prescription: "Sunglasses (Prescription)",
};

export interface OpticalExamRecord {
  date: string;
  outcome: string;
  prescription: string;
  recommendations: string;
}

export interface OpticalPrescription {
  right_sphere: string;
  right_cylinder: string;
  left_sphere: string;
  left_cylinder: string;
  addition: string;
}

export interface GlassesIssued {
  date: string;
  glasses_type: GlassesType;
  frames_chosen: string;
  lens_type: string;
  cost: number;
  child_chose: boolean;
}

export interface OpticiansRecord {
  id: string;
  child_id: string;
  practice: string;
  optometrist: string;
  registered_date: string;
  status: OpticalStatus;
  recall_interval: OpticalRecallInterval;
  exam_history: OpticalExamRecord[];
  current_prescription: OpticalPrescription;
  glasses_issued: GlassesIssued[];
  contact_lenses_issued: boolean;
  contact_lenses_notes: string;
  visual_impairment: string;
  school_notified_date: string;
  reasonable_adjustments: string[];
  last_exam_date: string;
  next_exam_due: string;
  child_attitude_to_optometrist: string;
  review_date: string;
  reviewed_by: string;
  notes: string;
  created_at: string;
}

// ── Batch 44 ────────────────────────────────────────────────────────────────

// Outcome Star
export type OutcomeStarDomain = "safety" | "emotional_wellbeing" | "physical_health" | "education" | "relationships" | "identity" | "independence" | "social_presentation" | "self_care" | "community";
export const OUTCOME_STAR_DOMAIN_LABEL: Record<OutcomeStarDomain, string> = {
  safety: "Safety & Stability",
  emotional_wellbeing: "Emotional Wellbeing",
  physical_health: "Physical Health",
  education: "Education & Learning",
  relationships: "Relationships",
  identity: "Identity & Self-Esteem",
  independence: "Independence",
  social_presentation: "Social Presentation",
  self_care: "Self-Care Skills",
  community: "Community & Belonging",
};
export interface OutcomeStarActionPlanItem {
  domain: OutcomeStarDomain;
  action: string;
}
export interface OutcomeStarAssessment {
  id: string;
  child_id: string;
  assessed_by_id: string;
  date: string;
  scores: Record<OutcomeStarDomain, number>;
  previous_scores: Record<OutcomeStarDomain, number> | null;
  child_views: string;
  staff_views: string;
  action_plan: OutcomeStarActionPlanItem[];
  created_at: string;
}

// Outcomes Dashboard
export type OutcomeSCCIFArea = "overall_experiences_and_progress" | "how_well_children_helped_protected" | "effectiveness_leaders_managers";
export const OUTCOME_SCCIF_AREA_LABEL: Record<OutcomeSCCIFArea, string> = {
  overall_experiences_and_progress: "Overall Experiences and Progress",
  how_well_children_helped_protected: "How well children are helped and protected",
  effectiveness_leaders_managers: "Effectiveness of leaders and managers",
};
export type OutcomeDashboardDomain = "education" | "health" | "identity" | "family_social" | "behaviour_emotional" | "self_care" | "spiritual_cultural" | "safety" | "workforce" | "practice";
export const OUTCOME_DASHBOARD_DOMAIN_LABEL: Record<OutcomeDashboardDomain, string> = {
  education: "Education",
  health: "Health",
  identity: "Identity",
  family_social: "Family & Social",
  behaviour_emotional: "Behaviour & Emotional",
  self_care: "Self-care",
  spiritual_cultural: "Spiritual & Cultural",
  safety: "Safety",
  workforce: "Workforce",
  practice: "Practice",
};
export type OutcomeTrend = "strong_improvement" | "improving" | "stable" | "declining" | "concerning";
export const OUTCOME_TREND_LABEL: Record<OutcomeTrend, string> = {
  strong_improvement: "Strong improvement",
  improving: "Improving",
  stable: "Stable",
  declining: "Declining",
  concerning: "Concerning",
};
export type OutcomeRAG = "green" | "amber" | "red";
export const OUTCOME_RAG_LABEL: Record<OutcomeRAG, string> = {
  green: "Green",
  amber: "Amber",
  red: "Red",
};
export interface OutcomeMetric {
  id: string;
  metric_name: string;
  sccif_judgement_area: OutcomeSCCIFArea;
  domain: OutcomeDashboardDomain;
  description: string;
  current_value: string;
  baseline: string;
  target: string;
  period: string;
  data_source: string;
  trend: OutcomeTrend;
  per_child_breakdown: Record<string, string>;
  narrative: string;
  contextual_factors: string[];
  risk_rating: OutcomeRAG;
  responsible_owner: string;
  review_date: string;
  next_review: string;
  created_at: string;
}

// Outdoor Activity Risk Assessments
export type OutdoorActivityType = "walking_hiking" | "cycling" | "water_based" | "climbing" | "sport_spectator" | "adventure_park" | "theme_park" | "beach" | "wildlife_zoo" | "music_festival" | "public_transport" | "city_visit";
export const OUTDOOR_ACTIVITY_TYPE_LABEL: Record<OutdoorActivityType, string> = {
  walking_hiking: "Walking/Hiking",
  cycling: "Cycling",
  water_based: "Water-based",
  climbing: "Climbing",
  sport_spectator: "Sport spectator",
  adventure_park: "Adventure park",
  theme_park: "Theme park",
  beach: "Beach",
  wildlife_zoo: "Wildlife/Zoo",
  music_festival: "Music/Festival",
  public_transport: "Public transport",
  city_visit: "City visit",
};
export type OutdoorRiskLevel = "low" | "medium" | "high";
export const OUTDOOR_RISK_LEVEL_LABEL: Record<OutdoorRiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
export interface OutdoorHazard {
  hazard: string;
  severity: OutdoorRiskLevel;
  control: string;
}
export interface OutdoorChildConsideration {
  child_id: string;
  consideration: string;
}
export interface OutdoorActivityRiskAssessment {
  id: string;
  activity_name: string;
  activity_type: OutdoorActivityType;
  young_people_attending: string[];
  staff_escort: string[];
  date: string;
  duration_hours: number;
  location: string;
  hazards: OutdoorHazard[];
  child_specific_considerations: OutdoorChildConsideration[];
  behaviour_risk_rating: OutdoorRiskLevel;
  missing_from_care_risk: OutdoorRiskLevel;
  supervision_ratio: string;
  equipment_required: string[];
  permissions_obtained: boolean;
  external_risk_assessment: string;
  emergency_procedures: string[];
  pre_activity_briefing: string;
  reviewed_by: string;
  signed_off_by_rm: boolean;
  created_at: string;
}

// Parent Partnership
export type ParentContactType = "phone_call" | "visit" | "email" | "meeting" | "letter" | "video_call";
export const PARENT_CONTACT_TYPE_LABEL: Record<ParentContactType, string> = {
  phone_call: "Phone Call",
  visit: "Visit",
  email: "Email",
  meeting: "Meeting",
  letter: "Letter",
  video_call: "Video Call",
};
export type ParentEngagementLevel = "positive" | "neutral" | "difficult" | "disengaged" | "hostile";
export const PARENT_ENGAGEMENT_LEVEL_LABEL: Record<ParentEngagementLevel, string> = {
  positive: "Positive",
  neutral: "Neutral",
  difficult: "Difficult",
  disengaged: "Disengaged",
  hostile: "Hostile",
};
export type ParentRelationshipType = "birth_parent" | "grandparent" | "sibling" | "extended_family" | "foster_carer" | "other";
export const PARENT_RELATIONSHIP_TYPE_LABEL: Record<ParentRelationshipType, string> = {
  birth_parent: "Birth Parent",
  grandparent: "Grandparent",
  sibling: "Sibling",
  extended_family: "Extended Family",
  foster_carer: "Foster Carer",
  other: "Other",
};
export type ParentContactInitiator = "home" | "family" | "social_worker";
export const PARENT_CONTACT_INITIATOR_LABEL: Record<ParentContactInitiator, string> = {
  home: "Home",
  family: "Family",
  social_worker: "Social Worker",
};
export interface ParentPartnershipRecord {
  id: string;
  date: string;
  child_id: string;
  family_member_name: string;
  relationship_type: ParentRelationshipType;
  contact_type: ParentContactType;
  engagement_level: ParentEngagementLevel;
  initiated_by: ParentContactInitiator;
  duration: number;
  staff_member_id: string;
  summary: string;
  concerns: string;
  positive_outcomes: string[];
  follow_up_actions: string[];
  sw_informed: boolean;
  notes: string;
  created_at: string;
}

// Parental Responsibility Record
export type PrPartyType = "birth_mother" | "birth_father" | "maternal_grandparent" | "paternal_grandparent" | "adoptive_parent" | "special_guardian" | "local_authority" | "court" | "step_parent";
export const PR_PARTY_TYPE_LABEL: Record<PrPartyType, string> = {
  birth_mother: "Birth Mother",
  birth_father: "Birth Father",
  maternal_grandparent: "Maternal Grandparent",
  paternal_grandparent: "Paternal Grandparent",
  adoptive_parent: "Adoptive Parent",
  special_guardian: "Special Guardian",
  local_authority: "Local Authority",
  court: "Court",
  step_parent: "Step-Parent",
};
export type PrAcquiredMethod = "by_birth_mother" | "by_marriage_to_mother" | "by_birth_certificate" | "by_pr_agreement" | "by_court_order" | "by_care_order_s31" | "by_adoption_order" | "by_special_guardianship_order" | "other";
export const PR_ACQUIRED_METHOD_LABEL: Record<PrAcquiredMethod, string> = {
  by_birth_mother: "By birth (Mother)",
  by_marriage_to_mother: "By marriage to mother",
  by_birth_certificate: "By being on birth certificate",
  by_pr_agreement: "By Parental Responsibility Agreement",
  by_court_order: "By Court Order",
  by_care_order_s31: "By Care Order (s31)",
  by_adoption_order: "By Adoption Order",
  by_special_guardianship_order: "By Special Guardianship Order",
  other: "Other",
};
export type PrDelegatedTo = "home" | "social_worker" | "parent_specific" | "joint" | "la_director";
export const PR_DELEGATED_TO_LABEL: Record<PrDelegatedTo, string> = {
  home: "Home",
  social_worker: "Social Worker",
  parent_specific: "Parent (specific)",
  joint: "Joint",
  la_director: "LA Director",
};
export type PrLegalStatus = "section_20_voluntary" | "section_31_care_order" | "section_38_interim_care_order" | "section_17_child_in_need" | "police_protection_s46" | "emergency_protection_order" | "special_guardianship";
export const PR_LEGAL_STATUS_LABEL: Record<PrLegalStatus, string> = {
  section_20_voluntary: "Section 20 Voluntary",
  section_31_care_order: "Section 31 Care Order",
  section_38_interim_care_order: "Section 38 Interim Care Order",
  section_17_child_in_need: "Section 17 Child in Need",
  police_protection_s46: "Police Protection (s46)",
  emergency_protection_order: "Emergency Protection Order",
  special_guardianship: "Special Guardianship",
};
export interface PrHolder {
  party: string;
  party_type: PrPartyType;
  acquired: PrAcquiredMethod;
  acquired_date: string;
  current: boolean;
  ended_date: string;
  ended_reason: string;
  notes: string;
}
export interface PrDelegatedAuthority {
  category: string;
  delegated_to: PrDelegatedTo;
  rationale: string;
  reviewed_date: string;
  exceptions: string[];
}
export interface PrCourtOrder {
  order: string;
  date_issued: string;
  expiry: string;
  terms: string;
}
export interface PrIdentityDocument {
  document: string;
  held: boolean;
  location: string;
}
export interface PrConsentMatrixItem {
  activity: string;
  who_consents: string;
  last_used: string;
}
export interface ParentalResponsibilityRecord {
  id: string;
  child_id: string;
  legal_status: PrLegalStatus;
  legal_status_date: string;
  pr_holders: PrHolder[];
  delegated_authorities: PrDelegatedAuthority[];
  child_awareness_of_status: string;
  routinely_consulted_parties: string[];
  parental_responsibility_complex_notes: string;
  court_orders_in_place: PrCourtOrder[];
  contact_arrangements: string;
  prohibited_steps: string[];
  identity_documents: PrIdentityDocument[];
  consent_matrix: PrConsentMatrixItem[];
  reviewed_date: string;
  reviewed_by: string;
  signed_off_by_la: boolean;
  created_at: string;
}

// Pathway Plan 16+
export type PathwayPlanStatus = "pre_pathway_15plus" | "active_16_18" | "active_18plus_formerly_looked_after" | "closed_at_25";
export const PATHWAY_PLAN_STATUS_LABEL: Record<PathwayPlanStatus, string> = {
  pre_pathway_15plus: "Pre-pathway (15+)",
  active_16_18: "Active 16-18",
  active_18plus_formerly_looked_after: "Active 18+ (formerly looked after)",
  closed_at_25: "Closed at 25",
};
export type PathwaySkillLevel = "established" | "developing" | "emerging" | "not_yet";
export const PATHWAY_SKILL_LEVEL_LABEL: Record<PathwaySkillLevel, string> = {
  established: "Established",
  developing: "Developing",
  emerging: "Emerging",
  not_yet: "Not yet",
};
export interface PathwayPlan {
  id: string;
  child_id: string;
  child_initials: string;
  age: number;
  status: PathwayPlanStatus;
  plan_version: string;
  last_review_date: string;
  personal_advisor: string;
  social_worker: string;
  accommodation: string;
  education_employment_training: string;
  health_needs: string[];
  financial_support: string[];
  support_network: string[];
  aspirations: string[];
  risks: string[];
  independent_living_skills: Record<string, PathwaySkillLevel>;
  next_review_date: string;
  contact_arrangements: string;
  statutory_16plus_review_schedule: string;
  created_at: string;
}

// ── Batch 45 ────────────────────────────────────────────────────────────────

// Peer Relationships
export type PeerRelationshipQuality = "positive" | "developing" | "strained" | "conflicted" | "neutral";
export const PEER_RELATIONSHIP_QUALITY_LABEL: Record<PeerRelationshipQuality, string> = {
  positive: "Positive", developing: "Developing", strained: "Strained", conflicted: "Conflicted", neutral: "Neutral",
};
export type PeerRiskLevel = "none" | "low" | "medium" | "high";
export const PEER_RISK_LEVEL_LABEL: Record<PeerRiskLevel, string> = {
  none: "None", low: "Low", medium: "Medium", high: "High",
};
export type PeerEntryType = "observation" | "incident" | "positive_interaction" | "mediation" | "review";
export const PEER_ENTRY_TYPE_LABEL: Record<PeerEntryType, string> = {
  observation: "Observation", incident: "Incident", positive_interaction: "Positive Interaction", mediation: "Mediation", review: "Review",
};
export type PeerGroupAtmosphere = "calm" | "mixed" | "tense" | "volatile";
export const PEER_GROUP_ATMOSPHERE_LABEL: Record<PeerGroupAtmosphere, string> = {
  calm: "Calm", mixed: "Mixed", tense: "Tense", volatile: "Volatile",
};
export interface PeerEntry {
  id: string;
  date: string;
  type: PeerEntryType;
  description: string;
  staff_witness: string;
  intervention_used: string;
  outcome: string;
}
export interface PeerDynamic {
  id: string;
  child_id_1: string;
  child_id_2: string;
  quality: PeerRelationshipQuality;
  risk_level: PeerRiskLevel;
  strengths: string[];
  concerns: string[];
  strategies: string[];
  entries: PeerEntry[];
  last_review_date: string;
  reviewed_by: string;
  next_review_due: string;
  notes: string;
  created_at: string;
}
export interface PeerGroupDynamic {
  id: string;
  assessment_date: string;
  assessed_by: string;
  overall_atmosphere: PeerGroupAtmosphere;
  group_strengths: string[];
  group_concerns: string[];
  current_dynamics: string;
  recommendations: string[];
  created_at: string;
}

// PEP Tracker
export type PepAttainmentLevel = "above" | "at" | "below" | "significantly_below";
export const PEP_ATTAINMENT_LEVEL_LABEL: Record<PepAttainmentLevel, string> = {
  above: "Above", at: "At", below: "Below", significantly_below: "Significantly Below",
};
export type PepStatus = "current" | "review_due" | "overdue" | "draft";
export const PEP_STATUS_LABEL: Record<PepStatus, string> = {
  current: "Current", review_due: "Review Due", overdue: "Overdue", draft: "Draft",
};
export type PepProgress = "on_track" | "some_progress" | "limited_progress" | "exceeded";
export const PEP_PROGRESS_LABEL: Record<PepProgress, string> = {
  on_track: "On Track", some_progress: "Some Progress", limited_progress: "Limited Progress", exceeded: "Exceeded",
};
export type PepSenStatus = "none" | "sen_support" | "ehcp";
export const PEP_SEN_STATUS_LABEL: Record<PepSenStatus, string> = {
  none: "None", sen_support: "SEN Support", ehcp: "EHCP",
};
export type PepActionStatus = "pending" | "completed";
export const PEP_ACTION_STATUS_LABEL: Record<PepActionStatus, string> = {
  pending: "Pending", completed: "Completed",
};
export interface PepTarget {
  subject: string;
  current_level: string;
  target_level: string;
  attainment: PepAttainmentLevel;
  progress: PepProgress;
  notes: string;
}
export interface PepPupilPremiumItem {
  description: string;
  amount: number;
  impact: string;
}
export interface PepPupilPremium {
  annual_allocation: number;
  spent_to_date: number;
  items: PepPupilPremiumItem[];
}
export interface PepAction {
  action: string;
  owner: string;
  deadline: string;
  status: PepActionStatus;
}
export interface PepRecord {
  id: string;
  child_id: string;
  school: string;
  year_group: number;
  key_stage: string;
  designated_teacher: string;
  virtual_school_contact: string;
  pep_date: string;
  next_review_date: string;
  status: PepStatus;
  attendance: number;
  exclusions: number;
  exclusion_days: number;
  sen_status: PepSenStatus;
  sen_details: string;
  targets: PepTarget[];
  pupil_premium: PepPupilPremium;
  child_views: string;
  carer_views: string;
  social_worker_views: string;
  strengths: string[];
  barriers: string[];
  key_worker: string;
  actions: PepAction[];
  created_at: string;
}

// Personal Belongings
export type BelongingCategory = "clothing" | "electronics" | "furniture" | "toiletries" | "sentimental" | "documents" | "sports_equipment" | "books_media" | "jewellery" | "other";
export const BELONGING_CATEGORY_LABEL: Record<BelongingCategory, string> = {
  clothing: "Clothing", electronics: "Electronics", furniture: "Furniture", toiletries: "Toiletries", sentimental: "Sentimental", documents: "Documents", sports_equipment: "Sports Equipment", books_media: "Books & Media", jewellery: "Jewellery", other: "Other",
};
export type BelongingCondition = "new" | "good" | "fair" | "poor" | "damaged";
export const BELONGING_CONDITION_LABEL: Record<BelongingCondition, string> = {
  new: "New", good: "Good", fair: "Fair", poor: "Poor", damaged: "Damaged",
};
export type BelongingItemStatus = "in_possession" | "in_storage" | "lost" | "damaged" | "returned_to_family" | "disposed";
export const BELONGING_ITEM_STATUS_LABEL: Record<BelongingItemStatus, string> = {
  in_possession: "In Possession", in_storage: "In Storage", lost: "Lost", damaged: "Damaged", returned_to_family: "Returned to Family", disposed: "Disposed",
};
export interface BelongingItem {
  id: string;
  description: string;
  category: BelongingCategory;
  condition: BelongingCondition;
  status: BelongingItemStatus;
  date_logged: string;
  logged_by: string;
  estimated_value: number | null;
  photo_on_file: boolean;
  storage_location: string;
  notes: string;
}
export interface BelongingsRecord {
  id: string;
  child_id: string;
  admission_date: string;
  admission_inventory_complete: boolean;
  admission_checked_by: string;
  admission_witnessed_by: string;
  items: BelongingItem[];
  last_audit_date: string;
  last_audit_by: string;
  next_audit_due: string;
  notes: string;
  created_at: string;
}

// Personal Passport
export interface PersonalPassport {
  id: string;
  child_id: string;
  preferred_name: string;
  pronouns: string;
  age: number;
  my_strengths: string[];
  what_makes_me_happy: string[];
  what_makes_me_upset: string[];
  what_helps_when_i_am_upset: string[];
  my_interests: string[];
  my_favourite_food: string[];
  food_i_dont_like: string[];
  my_music: string[];
  my_friends: string;
  my_family: string;
  my_dreams: string[];
  my_fears: string[];
  important_people: string[];
  my_routines: string[];
  things_im_working_on: string[];
  signs_im_not_okay: string[];
  things_to_know_about_me: string[];
  my_culture: string;
  my_faith: string;
  my_style: string;
  my_bedroom: string;
  school_life: string;
  helpful_phrases: string[];
  unhelpful_phrases: string[];
  child_authored: boolean;
  last_updated: string;
  reviewed_with: string;
  review_with_child_date: string;
  created_at: string;
}

// Petty Cash
export type PettyCashTransactionType = "withdrawal" | "top_up" | "refund";
export const PETTY_CASH_TRANSACTION_TYPE_LABEL: Record<PettyCashTransactionType, string> = {
  withdrawal: "Withdrawal", top_up: "Top Up", refund: "Refund",
};
export type PettyCashCategory = "food" | "activities" | "transport" | "clothing" | "personal_care" | "education" | "household" | "emergency" | "other";
export const PETTY_CASH_CATEGORY_LABEL: Record<PettyCashCategory, string> = {
  food: "Food", activities: "Activities", transport: "Transport", clothing: "Clothing", personal_care: "Personal Care", education: "Education", household: "Household", emergency: "Emergency", other: "Other",
};
export interface PettyCashEntry {
  id: string;
  date: string;
  type: PettyCashTransactionType;
  category: PettyCashCategory;
  amount: number;
  description: string;
  receipt_ref: string;
  receipt_attached: boolean;
  child_id: string;
  authorised_by: string;
  recorded_by: string;
  notes: string;
  balance_after: number;
  created_at: string;
}

// Photo Album Tracker
export type PhotoAlbumType = "life_story_book" | "memory_book" | "annual_album" | "theme_album" | "achievement_album" | "family_album" | "identity_album";
export const PHOTO_ALBUM_TYPE_LABEL: Record<PhotoAlbumType, string> = {
  life_story_book: "Life Story Book", memory_book: "Memory book", annual_album: "Annual album", theme_album: "Theme album", achievement_album: "Achievement album", family_album: "Family album", identity_album: "Identity album",
};
export type PhotoAlbumFormat = "physical_book" | "cloud_digital" | "both";
export const PHOTO_ALBUM_FORMAT_LABEL: Record<PhotoAlbumFormat, string> = {
  physical_book: "Physical book", cloud_digital: "Cloud digital", both: "Both",
};
export interface PhotoAlbumRecentAddition {
  date: string;
  description: string;
  added_by: string;
  child_involved: boolean;
}
export interface PhotoAlbumRecord {
  id: string;
  child_id: string;
  album_name: string;
  album_type: PhotoAlbumType;
  format: PhotoAlbumFormat;
  started_date: string;
  child_owns_album: boolean;
  child_chooses_content: boolean;
  total_photos: number;
  recent_additions: PhotoAlbumRecentAddition[];
  themes_covered: string[];
  consent_record: string;
  storage_location: string;
  child_can_access: boolean;
  child_can_edit: boolean;
  shared_with_family: boolean;
  shareable_summary: string;
  significant_moments: string[];
  reviewed_date: string;
  reviewed_with: string;
  child_reflection_on_album: string;
  protection_measures: string[];
  created_at: string;
}

// Photo Consent
export type PhotoConsentCategory = "school_photos" | "activities_outings" | "social_media" | "internal_records" | "press_media" | "medical" | "life_story" | "celebration_events" | "cctv";
export const PHOTO_CONSENT_CATEGORY_LABEL: Record<PhotoConsentCategory, string> = {
  school_photos: "School Photographs", activities_outings: "Activities & Outings",
  social_media: "Social Media", internal_records: "Internal Records / Life Story Book",
  press_media: "Press / Media", medical: "Medical Photography",
  life_story: "Life Story Work", celebration_events: "Celebration Events",
  cctv: "CCTV Recording",
};
export type PhotoConsentStatus = "granted" | "refused" | "conditional" | "expired" | "pending_sw";
export const PHOTO_CONSENT_STATUS_LABEL: Record<PhotoConsentStatus, string> = {
  granted: "Granted", refused: "Refused", conditional: "Conditional", expired: "Expired", pending_sw: "Pending SW Decision",
};
export interface PhotoConsentPermission {
  category: PhotoConsentCategory;
  status: PhotoConsentStatus;
  conditions: string;
  granted_by: string;
  granted_date: string;
  review_date: string;
}
export interface PhotoConsentRecord {
  id: string;
  child_id: string;
  last_review_date: string;
  next_review_date: string;
  reviewed_by: string;
  overall_notes: string;
  permissions: PhotoConsentPermission[];
  social_worker_consent: boolean;
  young_person_views: string;
  delegated_authority: string;
  created_at: string;
}

// Physical Activity Tracker
export type PhysicalActivityCategory = "sport" | "walking_hiking" | "cycling" | "dance_movement" | "active_play" | "swimming" | "gym" | "outdoor_adventure" | "daily_activity" | "active_travel";
export const PHYSICAL_ACTIVITY_CATEGORY_LABEL: Record<PhysicalActivityCategory, string> = {
  sport: "Sport", walking_hiking: "Walking/Hiking", cycling: "Cycling", dance_movement: "Dance/Movement",
  active_play: "Active play", swimming: "Swimming", gym: "Gym", outdoor_adventure: "Outdoor adventure",
  daily_activity: "Daily activity (e.g., school PE)", active_travel: "Active travel",
};
export type PhysicalActivityIntensity = "light" | "moderate" | "vigorous";
export const PHYSICAL_ACTIVITY_INTENSITY_LABEL: Record<PhysicalActivityIntensity, string> = {
  light: "Light", moderate: "Moderate", vigorous: "Vigorous",
};
export type PhysicalActivityInitiator = "child" | "routine" | "staff_suggested" | "group_activity";
export const PHYSICAL_ACTIVITY_INITIATOR_LABEL: Record<PhysicalActivityInitiator, string> = {
  child: "Child", routine: "Routine", staff_suggested: "Staff suggested", group_activity: "Group activity",
};
export type PhysicalActivitySocialAspect = "solo" | "with_staff" | "with_friend" | "team" | "family";
export const PHYSICAL_ACTIVITY_SOCIAL_ASPECT_LABEL: Record<PhysicalActivitySocialAspect, string> = {
  solo: "Solo", with_staff: "With staff", with_friend: "With friend", team: "Team", family: "Family",
};
export interface PhysicalActivityEntry {
  id: string;
  child_id: string;
  date: string;
  activity: string;
  category: PhysicalActivityCategory;
  intensity: PhysicalActivityIntensity;
  duration_minutes: number;
  initiated_by: PhysicalActivityInitiator;
  staff_present: string;
  location: string;
  enjoyment_rating: number;
  social_aspect: PhysicalActivitySocialAspect;
  child_comment: string;
  staff_observation: string;
  part_of_weekly_target: boolean;
  contributes_to_outcome: string;
  notes: string;
  created_at: string;
}

// Placement Anniversaries
export type AnniversarySignificanceType = "birthday" | "arrival_anniversary" | "care_order_anniversary" | "bereavement" | "family_birthday" | "court_date" | "cultural_date" | "personal_milestone" | "trauma_anniversary" | "significant_achievement";
export const ANNIVERSARY_SIGNIFICANCE_TYPE_LABEL: Record<AnniversarySignificanceType, string> = {
  birthday: "Birthday", arrival_anniversary: "Arrival anniversary", care_order_anniversary: "Care order anniversary",
  bereavement: "Bereavement", family_birthday: "Family birthday", court_date: "Court date",
  cultural_date: "Cultural date", personal_milestone: "Personal milestone",
  trauma_anniversary: "Trauma anniversary", significant_achievement: "Significant achievement",
};
export type AnniversaryEmotionalSignificance = "celebratory" | "bittersweet" | "difficult" | "practical_only" | "mixed";
export const ANNIVERSARY_EMOTIONAL_SIGNIFICANCE_LABEL: Record<AnniversaryEmotionalSignificance, string> = {
  celebratory: "Celebratory", bittersweet: "Bittersweet", difficult: "Difficult", practical_only: "Practical-only", mixed: "Mixed",
};
export type AnniversaryRecurrence = "annual" | "one_off" | "monthly" | "variable";
export const ANNIVERSARY_RECURRENCE_LABEL: Record<AnniversaryRecurrence, string> = {
  annual: "Annual", one_off: "One-off", monthly: "Monthly", variable: "Variable",
};
export interface PlacementAnniversaryEntry {
  id: string;
  child_id: string;
  significance_type: AnniversarySignificanceType;
  date: string;
  year_of_original: number;
  years_ago: number | null;
  description: string;
  emotional_significance: AnniversaryEmotionalSignificance;
  child_preference: string;
  agreed_approach: string[];
  staff_role_on_day: string[];
  resources_needed: string[];
  preferred_key_worker: string;
  emotional_support_plan: string;
  remembrance_practices: string[];
  contingency_if_hard: string[];
  recurrence: AnniversaryRecurrence;
  reviewed_with_child: boolean;
  child_agreed: boolean;
  reviewed_date: string;
  reviewed_by: string;
  created_at: string;
}

// Placement Budget Tracker
export type PlacementBudgetCategory = "clothing_footwear" | "activities_hobbies" | "school_education" | "cultural_items_heritage" | "sensory_wellbeing" | "birthdays_anniversaries" | "holidays" | "personal_phone_tech" | "travel_transport" | "hairdressing_personal_care";
export const PLACEMENT_BUDGET_CATEGORY_LABEL: Record<PlacementBudgetCategory, string> = {
  clothing_footwear: "Clothing & Footwear", activities_hobbies: "Activities & Hobbies",
  school_education: "School & Education", cultural_items_heritage: "Cultural Items & Heritage",
  sensory_wellbeing: "Sensory & Wellbeing", birthdays_anniversaries: "Birthdays & Anniversaries",
  holidays: "Holidays", personal_phone_tech: "Personal Phone & Tech",
  travel_transport: "Travel & Transport", hairdressing_personal_care: "Hairdressing & Personal Care",
};
export interface PlacementBudgetLine {
  category: PlacementBudgetCategory;
  allocated: number;
  spent: number;
  remaining: number;
  last_spend: string;
  notes: string;
}
export interface PlacementBudgetSavingsEntry {
  date: string;
  amount: number;
  source: string;
  target: string;
}
export interface PlacementBudgetExceptionalRequest {
  request: string;
  decision: string;
  date: string;
}
export interface PlacementBudgetTracker {
  id: string;
  child_id: string;
  financial_year: string;
  total_annual_budget: number;
  breakdown: PlacementBudgetLine[];
  monthly_allowance: number;
  savings_history: PlacementBudgetSavingsEntry[];
  junior_isa_contribution_this_year: number;
  setting_up_home_allowance_progress: number;
  child_input_on_spend: string;
  agreed_spending_priorities: string[];
  exceptional_requests: PlacementBudgetExceptionalRequest[];
  reviewed_date: string;
  reviewed_by: string;
  child_agreed: boolean;
  created_at: string;
}

// Placement Cohort Analysis
export type CohortPairDynamic = "strong_friendship" | "neutral" | "some_friction" | "active_conflict";
export const COHORT_PAIR_DYNAMIC_LABEL: Record<CohortPairDynamic, string> = {
  strong_friendship: "Strong friendship", neutral: "Neutral", some_friction: "Some friction", active_conflict: "Active conflict",
};
export interface CohortPeerRelationshipPair {
  pair: string;
  dynamic: CohortPairDynamic;
  notes: string;
}
export interface CohortAnalysis {
  id: string;
  analysis_date: string;
  period: string;
  authored_by: string;
  cohort_members: string[];
  demographic_profile: string;
  strengths_of_cohort: string[];
  tensions_or_dynamics: string[];
  peer_relationship_map: CohortPeerRelationshipPair[];
  individual_impacts_on_group: Record<string, string>;
  group_impacts_on_individual: Record<string, string>;
  group_activities: string[];
  individualised_support_in_group_context: Record<string, string>;
  conflict_resolution_instances: number;
  positive_dynamics_instances: number;
  staffing_challenges_arising: string;
  proposed_admission_considerations: string;
  recommended_actions: string[];
  created_at: string;
}

// Placement Disruption Prevention Plan
export type DisruptionRiskLevel = "low" | "building" | "heightened" | "acute";
export const DISRUPTION_RISK_LEVEL_LABEL: Record<DisruptionRiskLevel, string> = {
  low: "Low", building: "Building", heightened: "Heightened", acute: "Acute",
};
export interface DisruptionWarningSignAction {
  warning_sign: string;
  action: string;
  owner: string;
  timeframe: string;
}
export interface DisruptionInterventionHistory {
  date: string;
  intervention: string;
  outcome: string;
}
export interface DisruptionPreventionPlan {
  id: string;
  child_id: string;
  plan_date: string;
  risk_of_disruption_level: DisruptionRiskLevel;
  key_stability_factors: string[];
  warning_signs_to_watch_for: string[];
  recent_triggers: string[];
  proactive_actions_in_place: string[];
  support_network_in_place: string[];
  child_aware_of_plan: boolean;
  child_contribution: string;
  family_involvement: string;
  professionals_involved: string[];
  special_actions_if_warning_signs_appear: DisruptionWarningSignAction[];
  home_specific_mitigations: string[];
  staffing_adjustments: string;
  child_actions_agreed: string[];
  reviewed_date: string;
  reviewed_by: string;
  next_review_date: string;
  signed_off_by_la: boolean;
  interventions_deployed_history: DisruptionInterventionHistory[];
  created_at: string;
}

// ── Placement End Summary (HOME-level) ─────────────────────────────────────

export type PlacementEndReason =
  | "planned_move_home"
  | "planned_step_down"
  | "planned_move_on_16_plus"
  | "adoption"
  | "family_reunification"
  | "placement_disruption"
  | "age_out"
  | "long_term_foster";

export const PLACEMENT_END_REASON_LABEL: Record<PlacementEndReason, string> = {
  planned_move_home: "Planned Move Home",
  planned_step_down: "Planned Step-Down",
  planned_move_on_16_plus: "Planned Move-On (16+)",
  adoption: "Adoption",
  family_reunification: "Family Reunification",
  placement_disruption: "Placement Disruption",
  age_out: "Age Out",
  long_term_foster: "Long-term Foster",
};

export interface PlacementOutcomeDomain {
  rating: number;
  summary: string;
}

export interface PlacementEndOutcomes {
  health: PlacementOutcomeDomain;
  education: PlacementOutcomeDomain;
  relationships: PlacementOutcomeDomain;
  emotional: PlacementOutcomeDomain;
  independence: PlacementOutcomeDomain;
}

export interface PlacementEndSummary {
  id: string;
  child_name: string;
  admission_date: string;
  end_date: string;
  duration_months: number;
  end_reason: PlacementEndReason;
  moved_to: string;
  outcomes: PlacementEndOutcomes;
  significant_achievements: string[];
  ongoing_challenges: string[];
  what_worked_well: string[];
  what_could_have_been_better: string[];
  child_reflection: string;
  staff_reflection: string;
  sw_reflection: string;
  legacy_for_home: string;
  contact_arrangements: string;
  authored_by: string;
  reviewed_by: string;
  approval_date: string;
  created_at: string;
}

// ── Placement Impact Assessment (HOME-level) ───────────────────────────────

export type PlacementImpactStatus = "approved" | "declined" | "pending" | "approved_with_conditions";
export const PLACEMENT_IMPACT_STATUS_LABEL: Record<PlacementImpactStatus, string> = {
  approved: "Approved",
  declined: "Declined",
  pending: "Pending",
  approved_with_conditions: "Approved (Conditions)",
};

export type ImpactRiskLevel = "low" | "medium" | "high";
export const IMPACT_RISK_LEVEL_LABEL: Record<ImpactRiskLevel, string> = {
  low: "Low", medium: "Medium", high: "High",
};

export type CompatibilityRating = "positive" | "neutral" | "concern";
export const COMPATIBILITY_RATING_LABEL: Record<CompatibilityRating, string> = {
  positive: "Positive", neutral: "Neutral", concern: "Concern",
};

export interface ImpactOnChildAssessment {
  child_id: string;
  risk_level: ImpactRiskLevel;
  considerations: string[];
  mitigations: string[];
  child_view: string | null;
}

export interface CompatibilityFactor {
  factor: string;
  rating: CompatibilityRating;
}

export interface PlacementImpactAssessment {
  id: string;
  referral_name: string;
  referral_age: number;
  referral_gender: string;
  referral_la: string;
  assessed_by: string;
  assessment_date: string;
  status: PlacementImpactStatus;
  overall_risk: ImpactRiskLevel;
  decision: string;
  decision_rationale: string;
  impact_on_existing: ImpactOnChildAssessment[];
  compatibility_factors: CompatibilityFactor[];
  staffing_implications: string[];
  environmental_considerations: string[];
  safeguarding_considerations: string[];
  conditions: string[];
  review_date: string | null;
  notes: string;
  created_at: string;
}

// ── Placement Meeting Minutes (CHILD-level) ────────────────────────────────

export type PlacementMeetingType =
  | "weekly_review"
  | "monthly_review"
  | "crisis_meeting"
  | "pre_placement_plan"
  | "pre_lac_prep"
  | "multi_agency_update"
  | "transition_planning";

export const PLACEMENT_MEETING_TYPE_LABEL: Record<PlacementMeetingType, string> = {
  weekly_review: "Weekly Review",
  monthly_review: "Monthly Review",
  crisis_meeting: "Crisis Meeting",
  pre_placement_plan: "Pre-Placement Plan",
  pre_lac_prep: "Pre-LAC Prep",
  multi_agency_update: "Multi-Agency Update",
  transition_planning: "Transition Planning",
};

export type PlacementMeetingActionStatus = "open" | "in_progress" | "done";
export const PLACEMENT_MEETING_ACTION_STATUS_LABEL: Record<PlacementMeetingActionStatus, string> = {
  open: "Open", in_progress: "In Progress", done: "Done",
};

export interface PlacementMeetingAction {
  action: string;
  owner: string;
  deadline: string;
  status: PlacementMeetingActionStatus;
}

export interface PlacementMeeting {
  id: string;
  child_id: string;
  meeting_type: PlacementMeetingType;
  date: string;
  duration_minutes: number;
  chair: string;
  attendees: string[];
  external_attendees: string[];
  child_attended: boolean;
  child_contribution: string;
  agenda: string[];
  progress_since_last: string[];
  current_concerns: string[];
  emerging_themes: string[];
  decisions_agreed: string[];
  actions: PlacementMeetingAction[];
  risk_updates: string;
  care_plan_reviewed: boolean;
  next_meeting: string;
  minuted_by: string;
  approved_by: string;
  created_at: string;
}

// ── Placement Objectives / Plan (CHILD-level) ──────────────────────────────

export type ObjectiveArea =
  | "health"
  | "education"
  | "emotional_wellbeing"
  | "identity"
  | "family_social"
  | "social_presentation"
  | "self_care"
  | "stability";

export const OBJECTIVE_AREA_LABEL: Record<ObjectiveArea, string> = {
  health: "Health",
  education: "Education",
  emotional_wellbeing: "Emotional Wellbeing",
  identity: "Identity",
  family_social: "Family & Social",
  social_presentation: "Social Presentation",
  self_care: "Self-Care Skills",
  stability: "Placement Stability",
};

export type PlacementObjectiveStatus =
  | "on_track"
  | "some_progress"
  | "no_progress"
  | "achieved"
  | "not_started"
  | "at_risk";

export const PLACEMENT_OBJECTIVE_STATUS_LABEL: Record<PlacementObjectiveStatus, string> = {
  on_track: "On Track",
  some_progress: "Some Progress",
  no_progress: "No Progress",
  achieved: "Achieved",
  not_started: "Not Started",
  at_risk: "At Risk",
};

export interface PlacementObjective {
  id: string;
  child_id: string;
  area: ObjectiveArea;
  title: string;
  description: string;
  target: string;
  current_status: PlacementObjectiveStatus;
  responsible: string;
  start_date: string;
  review_date: string;
  progress_notes: string;
  last_updated: string;
  created_at: string;
}

// ── Placement Stability Record (CHILD-level) ───────────────────────────────

export type StabilityRiskLevel = "low" | "medium" | "high" | "critical";
export const STABILITY_RISK_LEVEL_LABEL: Record<StabilityRiskLevel, string> = {
  low: "Low", medium: "Medium", high: "High", critical: "Critical",
};

export type StabilityTrend = "improving" | "stable" | "declining";
export const STABILITY_TREND_LABEL: Record<StabilityTrend, string> = {
  improving: "Improving", stable: "Stable", declining: "Declining",
};

export type StabilityFactorStatus = "positive" | "concern" | "risk";
export const STABILITY_FACTOR_STATUS_LABEL: Record<StabilityFactorStatus, string> = {
  positive: "Positive", concern: "Concern", risk: "Risk",
};

export type PlacementEventImpact = "positive" | "neutral" | "negative";
export const PLACEMENT_EVENT_IMPACT_LABEL: Record<PlacementEventImpact, string> = {
  positive: "Positive", neutral: "Neutral", negative: "Negative",
};

export interface StabilityFactor {
  factor: string;
  status: StabilityFactorStatus;
  detail: string;
}

export interface PlacementEvent {
  date: string;
  event: string;
  impact: PlacementEventImpact;
  response: string;
}

export interface PlacementStabilityRecord {
  id: string;
  child_id: string;
  placement_start_date: string;
  days_in_placement: number;
  previous_placements: number;
  stability_risk: StabilityRiskLevel;
  trend: StabilityTrend;
  key_worker: string;
  social_worker: string;
  last_review: string;
  next_review: string;
  factors: StabilityFactor[];
  recent_events: PlacementEvent[];
  strengths: string[];
  concerns: string[];
  action_plan: string;
  notes: string;
  created_at: string;
}

// ── Placement Stability Meeting (CHILD-level) ──────────────────────────────

export type StabilityMeetingStatus = "placement_stable" | "at_risk" | "stabilised" | "ended";
export const STABILITY_MEETING_STATUS_LABEL: Record<StabilityMeetingStatus, string> = {
  placement_stable: "Stable",
  at_risk: "At Risk",
  stabilised: "Stabilised",
  ended: "Ended",
};

export type StabilityMeetingRiskLevel = "high" | "medium" | "low";
export const STABILITY_MEETING_RISK_LEVEL_LABEL: Record<StabilityMeetingRiskLevel, string> = {
  high: "High", medium: "Medium", low: "Low",
};

export interface StabilityMeetingAgreement {
  agreement: string;
  owner: string;
  deadline: string;
  status: string;
}

export interface PlacementStabilityMeeting {
  id: string;
  child_id: string;
  meeting_date: string;
  chairperson: string;
  attendees: string[];
  trigger: string;
  risk_level: StabilityMeetingRiskLevel;
  status: StabilityMeetingStatus;
  concerns: string[];
  strengths: string[];
  child_view: string;
  agreements_reached: StabilityMeetingAgreement[];
  outcome: string;
  review_date: string | null;
  notes: string;
  created_at: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// BATCH 48 — placement-success-factors, pocket-money, pocket-money-accounts,
//            policies, policy-impact-analysis, policy-review-tracker
// ══════════════════════════════════════════════════════════════════════════════

// ── Placement Success Factors (HOME-level) ──────────────────────────────────

export type SuccessFactorDomain = "relational" | "practice" | "multi_agency" | "environment" | "family" | "education" | "therapeutic" | "independence";
export const SUCCESS_FACTOR_DOMAIN_LABEL: Record<SuccessFactorDomain, string> = {
  relational: "Relational", practice: "Practice", multi_agency: "Multi-agency", environment: "Environment",
  family: "Family", education: "Education", therapeutic: "Therapeutic", independence: "Independence",
};

export type EvidenceStrength = "strong" | "moderate" | "emerging";
export const EVIDENCE_STRENGTH_LABEL: Record<EvidenceStrength, string> = {
  strong: "Strong", moderate: "Moderate", emerging: "Emerging",
};

export type ImplementationStatus = "standard_practice" | "emerging_practice" | "identified_gap";
export const IMPLEMENTATION_STATUS_LABEL: Record<ImplementationStatus, string> = {
  standard_practice: "Standard practice", emerging_practice: "Emerging practice", identified_gap: "Identified gap",
};

export interface SuccessFactor {
  id: string;
  factor: string;
  domain: SuccessFactorDomain;
  evidence_strength: EvidenceStrength;
  supporting_cases: string[];
  counter_cases: string[];
  key_mechanisms: string[];
  conditions_for_success: string[];
  recommended_actions: string[];
  evidence_sources: string[];
  child_voice_on_factor: string;
  staff_perspective: string;
  implementation_status: ImplementationStatus;
  review_date: string;
  reviewed_by: string;
}

// ── Pocket Money Transactions (CHILD-level) ─────────────────────────────────

export type PocketMoneyTransactionType = "allowance" | "spending" | "savings_deposit" | "savings_withdrawal" | "gift" | "earnings" | "refund";
export const POCKET_MONEY_TRANSACTION_TYPE_LABEL: Record<PocketMoneyTransactionType, string> = {
  allowance: "Allowance", spending: "Spending", savings_deposit: "Savings In",
  savings_withdrawal: "Savings Out", gift: "Gift", earnings: "Earnings", refund: "Refund",
};

export interface PocketMoneyTransaction {
  id: string;
  child_id: string;
  date: string;
  type: PocketMoneyTransactionType;
  amount: number;
  description: string;
  category: string;
  receipt_held: boolean;
  approved_by: string;
  notes: string | null;
  created_at: string;
}

// ── Pocket Money Accounts (CHILD-level) ─────────────────────────────────────

export type PocketMoneyAccountTxType = "credit" | "debit";
export const POCKET_MONEY_ACCOUNT_TX_TYPE_LABEL: Record<PocketMoneyAccountTxType, string> = {
  credit: "Credit", debit: "Debit",
};

export type PocketMoneyAccountCategory = "weekly_allowance" | "birthday_gift" | "savings_transfer" | "chore_bonus" | "purchase_shop" | "purchase_online" | "activity_cost" | "lost" | "adjustment";
export const POCKET_MONEY_ACCOUNT_CATEGORY_LABEL: Record<PocketMoneyAccountCategory, string> = {
  weekly_allowance: "Weekly Allowance", birthday_gift: "Birthday Gift", savings_transfer: "Savings Transfer",
  chore_bonus: "Chore Bonus", purchase_shop: "Shop Purchase", purchase_online: "Online Purchase",
  activity_cost: "Activity Cost", lost: "Lost", adjustment: "Adjustment",
};

export interface PocketMoneyAccount {
  id: string;
  date: string;
  child_id: string;
  transaction_type: PocketMoneyAccountTxType;
  category: PocketMoneyAccountCategory;
  amount: number;
  running_balance: number;
  description: string;
  receipt_ref: string;
  authorised_by: string;
  witnessed_by: string | null;
  notes: string;
}

// ── Home Policies (HOME-level) ──────────────────────────────────────────────

export type HomePolicyCategory = "safeguarding" | "care_practice" | "health_safety" | "workforce" | "behaviour" | "complaints" | "data_protection" | "admissions" | "missing_persons" | "medication" | "fire_safety" | "lone_working" | "whistleblowing";
export const HOME_POLICY_CATEGORY_LABEL: Record<HomePolicyCategory, string> = {
  safeguarding: "Safeguarding", care_practice: "Care Practice", health_safety: "Health & Safety",
  workforce: "Workforce", behaviour: "Behaviour Support", complaints: "Complaints",
  data_protection: "Data Protection", admissions: "Admissions", missing_persons: "Missing Persons",
  medication: "Medication", fire_safety: "Fire Safety", lone_working: "Lone Working",
  whistleblowing: "Whistleblowing",
};

export type HomePolicyStatus = "current" | "due_review" | "overdue" | "draft" | "archived";
export const HOME_POLICY_STATUS_LABEL: Record<HomePolicyStatus, string> = {
  current: "Current", due_review: "Due Review", overdue: "Overdue", draft: "Draft", archived: "Archived",
};

export interface HomePolicyReadAck {
  staff_id: string;
  read_at: string;
  acknowledged: boolean;
}

export interface HomePolicy {
  id: string;
  title: string;
  category: HomePolicyCategory;
  description: string;
  version: string;
  status: HomePolicyStatus;
  owner_id: string;
  approved_by: string | null;
  approved_date: string | null;
  effective_date: string;
  next_review_date: string;
  last_reviewed: string | null;
  statutory_basis: string;
  linked_standard: string;
  key_points: string[];
  read_acknowledgements: HomePolicyReadAck[];
  total_staff_required: number;
  created_at: string;
  updated_at: string;
}

// ── Policy Impact Analysis (HOME-level) ─────────────────────────────────────

export type PolicyImpactArea = "safeguarding" | "behaviour" | "voice_and_participation" | "health" | "education" | "privacy" | "cultural" | "workforce" | "recording" | "risk";
export const POLICY_IMPACT_AREA_LABEL: Record<PolicyImpactArea, string> = {
  safeguarding: "Safeguarding", behaviour: "Behaviour", voice_and_participation: "Voice & Participation",
  health: "Health", education: "Education", privacy: "Privacy", cultural: "Cultural",
  workforce: "Workforce", recording: "Recording", risk: "Risk",
};

export type PolicyChangeType = "new_policy" | "major_revision" | "minor_amendment" | "practice_clarification" | "withdrawn";
export const POLICY_CHANGE_TYPE_LABEL: Record<PolicyChangeType, string> = {
  new_policy: "New policy", major_revision: "Major revision", minor_amendment: "Minor amendment",
  practice_clarification: "Practice clarification", withdrawn: "Withdrawn",
};

export type PolicyReviewVerdict = "working_as_intended" | "mostly_working" | "needs_amendment" | "withdrawn_replaced";
export const POLICY_REVIEW_VERDICT_LABEL: Record<PolicyReviewVerdict, string> = {
  working_as_intended: "Working as intended", mostly_working: "Mostly working",
  needs_amendment: "Needs amendment", withdrawn_replaced: "Withdrawn / replaced",
};

export interface PolicyImpactAnalysis {
  id: string;
  policy_name: string;
  policy_version: string;
  change_date: string;
  change_reason: string;
  policy_area: PolicyImpactArea;
  change_type: PolicyChangeType;
  what_changed: string[];
  impacted_children: string[];
  child_involvement_in_change: string;
  child_friendly_version_updated: boolean;
  child_friendly_update_date: string;
  expected_impact_positive: string[];
  expected_impact_risks: string[];
  staff_training_delivered: boolean;
  staff_training_date: string;
  staff_training_format: string;
  children_informed_date: string;
  children_informed_format: string;
  outcomes_observed_at_30d: string;
  outcomes_observed_at_90d: string;
  outcomes_observed_at_180d: string;
  unintended_consequences: string[];
  child_feedback_post_change: string[];
  review_verdict: PolicyReviewVerdict;
  review_date: string;
  reviewed_by: string;
}

// ── Policy Review Tracker (HOME-level) ──────────────────────────────────────

export type PolicyReviewCycle = "annual" | "six_monthly" | "two_yearly";
export const POLICY_REVIEW_CYCLE_LABEL: Record<PolicyReviewCycle, string> = {
  annual: "Annual", six_monthly: "6-Monthly", two_yearly: "2-Yearly",
};

export type PolicyReviewStatus = "current" | "due_soon" | "overdue";
export const POLICY_REVIEW_STATUS_LABEL: Record<PolicyReviewStatus, string> = {
  current: "Current", due_soon: "Due Soon", overdue: "Overdue",
};

export interface PolicyReviewRecord {
  id: string;
  title: string;
  owner: string;
  last_review_date: string;
  next_review_date: string;
  version: string;
  review_cycle: PolicyReviewCycle;
  status: PolicyReviewStatus;
  staff_signed: number;
  staff_total: number;
  changes: string;
  approved_by: string;
}

/* ── Batch 49 ─────────────────────────────────────────────────────────────── */

// ── Children's Rights ────────────────────────────────────────────────────────

export type RightsComplianceLevel = "fully" | "partially" | "action_needed";

export const RIGHTS_COMPLIANCE_LEVEL_LABEL: Record<RightsComplianceLevel, string> = {
  fully: "Fully Met",
  partially: "Partially Met",
  action_needed: "Action Needed",
};

export interface ChildrensRightEntry {
  id: string;
  article: string;
  title: string;
  uncrc_summary: string;
  how_we_uphold: string[];
  evidence: string[];
  child_feedback: string;
  compliance_level: RightsComplianceLevel;
  action_needed: string | null;
}

// ── Local Offer ──────────────────────────────────────────────────────────────

export type LocalOfferCategory = "care" | "education" | "health" | "safety" | "activities" | "community" | "independence" | "therapeutic" | "environment" | "workforce";

export const LOCAL_OFFER_CATEGORY_LABEL: Record<LocalOfferCategory, string> = {
  care: "Care & Nurture",
  education: "Education",
  health: "Health & Wellbeing",
  safety: "Safety & Protection",
  activities: "Activities & Leisure",
  community: "Community",
  independence: "Independence",
  therapeutic: "Therapeutic",
  environment: "Environment",
  workforce: "Workforce",
};

export interface LocalOfferSection {
  id: string;
  category: LocalOfferCategory;
  title: string;
  summary: string;
  what_we_offer: string[];
  how_we_deliver: string[];
  evidence_of_impact: string[];
}

// ── Location Assessment ──────────────────────────────────────────────────────

export type LocationRiskLevel = "low" | "medium" | "high";

export const LOCATION_RISK_LEVEL_LABEL: Record<LocationRiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export interface LocationAssessmentFactor {
  factor: string;
  assessment: string;
  risk: LocationRiskLevel;
}

export interface LocationAssessmentArea {
  id: string;
  title: string;
  risk_level: LocationRiskLevel;
  factors: LocationAssessmentFactor[];
  mitigations: string[];
  last_updated: string;
}

// ── System Notifications ─────────────────────────────────────────────────────

export type AlertNotificationType = "overdue_task" | "expiring_document" | "review_due" | "compliance_deadline" | "health_alert" | "training_expiry" | "incident_followup" | "medication_review" | "placement_review" | "fire_drill_due" | "system";

export const ALERT_NOTIFICATION_TYPE_LABEL: Record<AlertNotificationType, string> = {
  overdue_task: "Overdue Task",
  expiring_document: "Expiring Document",
  review_due: "Review Due",
  compliance_deadline: "Compliance Deadline",
  health_alert: "Health Alert",
  training_expiry: "Training Expiry",
  incident_followup: "Incident Follow-up",
  medication_review: "Medication Review",
  placement_review: "Placement Review",
  fire_drill_due: "Fire Drill Due",
  system: "System",
};

export type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";

export const ALERT_SEVERITY_LABEL: Record<AlertSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

export type AlertStatus = "unread" | "read" | "actioned" | "dismissed";

export const ALERT_STATUS_LABEL: Record<AlertStatus, string> = {
  unread: "Unread",
  read: "Read",
  actioned: "Actioned",
  dismissed: "Dismissed",
};

export interface AlertNotification {
  id: string;
  type: AlertNotificationType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  link: string | null;
  related_child: string | null;
  related_staff: string | null;
  due_date: string | null;
  created_at: string;
}

// ── Positive Achievements ────────────────────────────────────────────────────

export type PositiveAchievementCategory = "sport" | "education" | "creative" | "communication" | "emotional" | "independence" | "social" | "milestone";

export const POSITIVE_ACHIEVEMENT_CATEGORY_LABEL: Record<PositiveAchievementCategory, string> = {
  sport: "Sport",
  education: "Education",
  creative: "Creative",
  communication: "Communication",
  emotional: "Emotional",
  independence: "Independence",
  social: "Social",
  milestone: "Milestone",
};

export interface PositiveAchievement {
  id: string;
  child_id: string;
  date: string;
  category: PositiveAchievementCategory;
  title: string;
  description: string;
  recorded_by: string;
  shared_with: string[];
  celebrated_how: string;
  child_reaction: string;
}

// ── Post-Incident Child Debrief ──────────────────────────────────────────────

export type ChildDebriefMethod = "conversation" | "drawing" | "visual_cards" | "walk_and_talk" | "written" | "through_advocate";

export const CHILD_DEBRIEF_METHOD_LABEL: Record<ChildDebriefMethod, string> = {
  conversation: "Conversation",
  drawing: "Drawing",
  visual_cards: "Visual Cards",
  walk_and_talk: "Walk-and-Talk",
  written: "Written",
  through_advocate: "Through Advocate",
};

export interface PostIncidentChildDebrief {
  id: string;
  child_id: string;
  incident_ref: string;
  incident_date: string;
  debrief_date: string;
  debrief_staff: string;
  debrief_method: ChildDebriefMethod;
  child_ready_to_debrief: boolean;
  readiness_indicators: string;
  child_account_of_what_happened: string;
  child_feelings_before_during: string;
  child_feelings_now: string;
  what_child_wishes_had_been_different: string;
  what_helped_child: string[];
  what_did_not_help: string[];
  child_requests_for_future: string[];
  apologies_offered: string;
  apologies_received: string;
  repairs_agreed: string[];
  child_accepts_outcome: boolean;
  support_needed_now: string;
  follow_up_date: string;
  recorded_by: string;
}

// ── Batch 50 ──────────────────────────────────────────────────────────────────

// pre-admission-checklist
export type PreAdmissionStatus = "not_started" | "in_progress" | "complete" | "on_hold";
export const PRE_ADMISSION_STATUS_LABEL: Record<PreAdmissionStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  complete: "Complete",
  on_hold: "On Hold",
};

export interface PreAdmissionChecklistItem {
  task: string;
  completed: boolean;
  completed_date?: string;
  completed_by?: string;
  notes?: string;
}

export interface PreAdmissionChecklist {
  id: string;
  child_id: string;
  referral_date: string;
  target_admission_date: string;
  social_worker: string;
  local_authority: string;
  status: PreAdmissionStatus;
  assigned_to: string;
  impact_assessment_done: boolean;
  matching_panel_date?: string;
  items: PreAdmissionChecklistItem[];
  risk_considerations: string[];
  special_requirements: string[];
}

// prevent-duty
export type PreventReferralType = "prevent_referral" | "channel_referral" | "community_concern" | "online_concern" | "training_record";
export const PREVENT_REFERRAL_TYPE_LABEL: Record<PreventReferralType, string> = {
  prevent_referral: "Prevent Referral",
  channel_referral: "Channel Referral",
  community_concern: "Community Concern",
  online_concern: "Online Concern",
  training_record: "Training Record",
};

export type PreventRiskLevel = "low" | "medium" | "high";
export const PREVENT_RISK_LEVEL_LABEL: Record<PreventRiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export type PreventStatus = "open" | "referred" | "channel_active" | "channel_closed" | "nfa" | "monitoring";
export const PREVENT_STATUS_LABEL: Record<PreventStatus, string> = {
  open: "Open",
  referred: "Referred",
  channel_active: "Channel Active",
  channel_closed: "Channel Closed",
  nfa: "No Further Action",
  monitoring: "Monitoring",
};

export interface PreventRecord {
  id: string;
  date: string;
  staff_id: string;
  child_id: string | null;
  referral_type: PreventReferralType;
  risk_level: PreventRiskLevel;
  status: PreventStatus;
  indicators: string[];
  description: string;
  actions_taken: string;
  multi_agency: string[];
  channel_outcome: string;
  training_completed: boolean;
  review_date: string;
}

// professional-consultations
export type ProfConsultationType = "camhs" | "social_worker" | "iro" | "lado" | "police" | "gp" | "therapist" | "education" | "legal" | "ofsted" | "other";
export const PROF_CONSULTATION_TYPE_LABEL: Record<ProfConsultationType, string> = {
  camhs: "CAMHS",
  social_worker: "Social Worker",
  iro: "IRO",
  lado: "LADO",
  police: "Police",
  gp: "GP / Medical",
  therapist: "Therapist",
  education: "Education / School",
  legal: "Legal",
  ofsted: "Ofsted",
  other: "Other",
};

export type ProfConsultationMethod = "phone" | "email" | "video" | "in_person" | "written";
export const PROF_CONSULTATION_METHOD_LABEL: Record<ProfConsultationMethod, string> = {
  phone: "Phone",
  email: "Email",
  video: "Video Call",
  in_person: "In Person",
  written: "Written",
};

export interface ProfessionalConsultation {
  id: string;
  date: string;
  time: string;
  type: ProfConsultationType;
  method: ProfConsultationMethod;
  professional_name: string;
  professional_role: string;
  organisation: string;
  child_id: string;
  reason: string;
  advice_given: string;
  actions_agreed: string[];
  follow_up_required: boolean;
  follow_up_date: string;
  follow_up_completed: boolean;
  confidential: boolean;
  recorded_by: string;
  created_at: string;
}

// professional-curiosity-log
export type CuriosityFocusArea = "child_presentation" | "family_dynamics" | "multi_agency_working" | "own_assumptions" | "risk_assessment" | "cultural_awareness" | "child_voice";
export const CURIOSITY_FOCUS_AREA_LABEL: Record<CuriosityFocusArea, string> = {
  child_presentation: "Child presentation",
  family_dynamics: "Family dynamics",
  multi_agency_working: "Multi-agency working",
  own_assumptions: "Own assumptions",
  risk_assessment: "Risk assessment",
  cultural_awareness: "Cultural awareness",
  child_voice: "Child voice",
};

export interface CuriosityLogEntry {
  id: string;
  date: string;
  raised_by: string;
  focus_area: CuriosityFocusArea;
  about_child: string;
  assumption_challenged: string;
  original_narrative: string;
  curious_question_raised: string;
  evidence_considered: string[];
  alternative_explanations: string[];
  was_initial_assumption_wrong: boolean;
  revised_understanding: string;
  actions_taken: string[];
  outcome_impact: string;
  child_outcome_impact: string;
  wider_learning: string;
  discussed_in_supervision: boolean;
  discussed_in_team_meeting: boolean;
  embedded_in_practice: string;
  reflection_pattern: string;
}

// professional-development
export type CPDType = "qualification" | "training" | "conference" | "reflective_account" | "mentoring" | "shadowing";
export const CPD_TYPE_LABEL: Record<CPDType, string> = {
  qualification: "Qualification",
  training: "Training",
  conference: "Conference",
  reflective_account: "Reflective Account",
  mentoring: "Mentoring",
  shadowing: "Shadowing",
};

export type CPDStatus = "completed" | "in_progress" | "planned";
export const CPD_STATUS_LABEL: Record<CPDStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  planned: "Planned",
};

export interface CPDRecord {
  id: string;
  staff_id: string;
  title: string;
  type: CPDType;
  provider: string;
  start_date: string;
  completed_date: string | null;
  duration: string;
  status: CPDStatus;
  cpd_hours: number;
  certificate_obtained: boolean;
  impact_on_practice: string;
  notes: string;
}

// professional-fees-log
export type PractitionerType = "therapist" | "advocate" | "coach" | "tutor" | "mentor" | "specialist_assessor" | "translator" | "cultural_mentor" | "activity_provider";
export const PRACTITIONER_TYPE_LABEL: Record<PractitionerType, string> = {
  therapist: "Therapist",
  advocate: "Advocate",
  coach: "Coach",
  tutor: "Tutor",
  mentor: "Mentor",
  specialist_assessor: "Specialist Assessor",
  translator: "Translator",
  cultural_mentor: "Cultural Mentor",
  activity_provider: "Activity Provider",
};

export type FundingSource = "home_budget" | "local_authority_funded" | "charitable_funding" | "cornerstone_care_group" | "health_funded";
export const FUNDING_SOURCE_LABEL: Record<FundingSource, string> = {
  home_budget: "Home budget",
  local_authority_funded: "Local Authority funded",
  charitable_funding: "Charitable funding",
  cornerstone_care_group: "Cara Care Group",
  health_funded: "Health-funded",
};

export type FeePaymentMethod = "bacs" | "cheque" | "card" | "cash";
export const FEE_PAYMENT_METHOD_LABEL: Record<FeePaymentMethod, string> = {
  bacs: "BACS",
  cheque: "Cheque",
  card: "Card",
  cash: "Cash",
};

export type FeeStatus = "pending_approval" | "approved" | "paid" | "disputed" | "refunded";
export const FEE_STATUS_LABEL: Record<FeeStatus, string> = {
  pending_approval: "Pending approval",
  approved: "Approved",
  paid: "Paid",
  disputed: "Disputed",
  refunded: "Refunded",
};

export interface ProfessionalFeeRecord {
  id: string;
  practitioner: string;
  organisation: string;
  practitioner_type: PractitionerType;
  fee_for: string;
  child_id: string;
  invoice_date: string;
  invoice_period: string;
  amount_gross: number;
  vat: number;
  amount_net: number;
  contract_ref: string;
  funding_source: FundingSource;
  funding_approved: boolean;
  approved_by: string;
  payment_date: string;
  payment_method: FeePaymentMethod;
  outcomes_evidenced: string[];
  hours_delivered: number;
  hourly_rate: number;
  status: FeeStatus;
  recurring_contract: boolean;
  contract_end_date: string;
  performance_review_date: string;
  reviewed_by: string;
  review_notes: string;
}

// ── Professional Meeting Attendance ─────────────────────────────────────────

export type ProfMeetingType = "lac_review" | "cp_conference" | "strategy_meeting" | "mappa" | "taf" | "pep" | "ehcp_review" | "health" | "multi_agency" | "external_consultation";

export const PROF_MEETING_TYPE_LABEL: Record<ProfMeetingType, string> = {
  lac_review: "LAC Review",
  cp_conference: "CP Conference",
  strategy_meeting: "Strategy Meeting",
  mappa: "MAPPA",
  taf: "TAF (Team Around Family)",
  pep: "PEP",
  ehcp_review: "EHCP Review",
  health: "Health",
  multi_agency: "Multi-agency Case Discussion",
  external_consultation: "External Professional Consultation",
};

export type ProfMeetingActionStatus = "pending" | "completed" | "overdue";

export const PROF_MEETING_ACTION_STATUS_LABEL: Record<ProfMeetingActionStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  overdue: "Overdue",
};

export type ProfMeetingMode = "virtual" | "in_person" | "hybrid";

export const PROF_MEETING_MODE_LABEL: Record<ProfMeetingMode, string> = {
  virtual: "Virtual",
  in_person: "In Person",
  hybrid: "Hybrid",
};

export interface ProfMeetingAction {
  action: string;
  deadline: string;
  status: ProfMeetingActionStatus;
}

export interface ProfessionalMeetingAttendance {
  id: string;
  meeting_date: string;
  meeting_type: ProfMeetingType;
  child_id: string;
  location: string;
  virtual_or_in_person: ProfMeetingMode;
  duration_minutes: number;
  organised_by: string;
  our_representative: string;
  home_contribution: string;
  child_attended: boolean;
  child_contribution: string;
  agencies_present: string[];
  key_decisions: string[];
  actions_for_home: ProfMeetingAction[];
  next_meeting: string | null;
  report_submitted: boolean;
  report_submitted_date: string | null;
  recorded_by: string;
}

// ── Professional Network Map ────────────────────────────────────────────────

export type NetworkContactFrequency = "weekly" | "fortnightly" | "monthly" | "termly" | "quarterly" | "annually";

export const NETWORK_CONTACT_FREQUENCY_LABEL: Record<NetworkContactFrequency, string> = {
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  termly: "Termly",
  quarterly: "Quarterly",
  annually: "Annually",
};

export interface ProfessionalNetworkContact {
  id: string;
  child_id: string;
  role: string;
  name: string;
  organisation: string;
  phone: string;
  email: string;
  last_contact: string;
  contact_frequency: NetworkContactFrequency;
  key_responsibilities: string[];
  notes: string;
  is_active: boolean;
}

// ── Property Damage ─────────────────────────────────────────────────────────

export type PropertyDamageType = "accidental" | "deliberate" | "wear_and_tear" | "environmental" | "unknown";

export const PROPERTY_DAMAGE_TYPE_LABEL: Record<PropertyDamageType, string> = {
  accidental: "Accidental",
  deliberate: "Deliberate",
  wear_and_tear: "Wear & Tear",
  environmental: "Environmental",
  unknown: "Unknown",
};

export type PropertyDamageSeverity = "minor" | "moderate" | "major" | "structural";

export const PROPERTY_DAMAGE_SEVERITY_LABEL: Record<PropertyDamageSeverity, string> = {
  minor: "Minor",
  moderate: "Moderate",
  major: "Major",
  structural: "Structural",
};

export type PropertyRepairStatus = "reported" | "assessed" | "repair_scheduled" | "repaired" | "write_off" | "insurance_claim";

export const PROPERTY_REPAIR_STATUS_LABEL: Record<PropertyRepairStatus, string> = {
  reported: "Reported",
  assessed: "Assessed",
  repair_scheduled: "Repair Scheduled",
  repaired: "Repaired",
  write_off: "Written Off",
  insurance_claim: "Insurance Claim",
};

export type PropertyLocation = "bedroom" | "bathroom" | "kitchen" | "living_room" | "hallway" | "garden" | "office" | "utility" | "exterior" | "vehicle" | "communal";

export const PROPERTY_LOCATION_LABEL: Record<PropertyLocation, string> = {
  bedroom: "Bedroom",
  bathroom: "Bathroom",
  kitchen: "Kitchen",
  living_room: "Living Room",
  hallway: "Hallway",
  garden: "Garden",
  office: "Office",
  utility: "Utility",
  exterior: "Exterior",
  vehicle: "Vehicle",
  communal: "Communal Area",
};

export interface PropertyDamageRecord {
  id: string;
  date: string;
  time: string;
  reported_by: string;
  location: PropertyLocation;
  specific_area: string;
  damage_type: PropertyDamageType;
  severity: PropertyDamageSeverity;
  status: PropertyRepairStatus;
  responsible_person_id: string | null;
  responsible_person_name: string;
  description: string;
  photographs_taken: boolean;
  estimated_cost: number;
  actual_cost: number | null;
  insurance_claimed: boolean;
  insurance_ref: string | null;
  repair_details: string;
  repair_completed_date: string | null;
  linked_incident_id: string | null;
  behaviour_context: string;
  risk_assessment_updated: boolean;
  notes: string;
}

// ── QA Audit ────────────────────────────────────────────────────────────────

export type QAAuditRating = "excellent" | "good" | "requires_improvement" | "inadequate";

export const QA_AUDIT_RATING_LABEL: Record<QAAuditRating, string> = {
  excellent: "Excellent",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export type QAAuditActionStatus = "completed" | "in_progress" | "pending" | "overdue";

export const QA_AUDIT_ACTION_STATUS_LABEL: Record<QAAuditActionStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  pending: "Pending",
  overdue: "Overdue",
};

export interface QAAuditAction {
  action: string;
  owner: string;
  deadline: string;
  status: QAAuditActionStatus;
}

export interface QAAuditRecord {
  id: string;
  title: string;
  date: string;
  auditor: string;
  scope: string;
  overall_rating: QAAuditRating;
  score: number;
  findings: string[];
  strengths: string[];
  areas_for_improvement: string[];
  actions: QAAuditAction[];
  notes: string;
}

// ── Quality of Care Reviews ─────────────────────────────────────────────────

export type QocReviewType = "monthly" | "quarterly" | "annual" | "ofsted_prep" | "post_incident" | "reg44_response";

export const QOC_REVIEW_TYPE_LABEL: Record<QocReviewType, string> = {
  monthly: "Monthly Review",
  quarterly: "Quarterly Review",
  annual: "Annual Review",
  ofsted_prep: "Ofsted Prep",
  post_incident: "Post-Incident",
  reg44_response: "Reg 44 Response",
};

export type QocDomain = "safety" | "wellbeing" | "education" | "health" | "relationships" | "transitions" | "voice_of_child" | "environment" | "staffing" | "management";

export const QOC_DOMAIN_LABEL: Record<QocDomain, string> = {
  safety: "Safety & Protection",
  wellbeing: "Emotional Wellbeing",
  education: "Education & Achievement",
  health: "Health & Development",
  relationships: "Positive Relationships",
  transitions: "Stability & Transitions",
  voice_of_child: "Voice of the Child",
  environment: "Living Environment",
  staffing: "Staffing & Supervision",
  management: "Leadership & Management",
};

export type QocRating = "outstanding" | "good" | "requires_improvement" | "inadequate";

export const QOC_RATING_LABEL: Record<QocRating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export type QocTrend = "improving" | "stable" | "declining";

export const QOC_TREND_LABEL: Record<QocTrend, string> = {
  improving: "Improving",
  stable: "Stable",
  declining: "Declining",
};

export type QocActionPriority = "high" | "medium" | "low";

export const QOC_ACTION_PRIORITY_LABEL: Record<QocActionPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export type QocActionStatus = "open" | "in_progress" | "completed";

export const QOC_ACTION_STATUS_LABEL: Record<QocActionStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
};

export interface QocDomainAssessment {
  domain: QocDomain;
  rating: QocRating;
  evidence: string;
  trend: QocTrend;
}

export interface QocActionItem {
  action: string;
  owner: string;
  due_date: string;
  status: QocActionStatus;
  priority: QocActionPriority;
}

export interface QualityOfCareReview {
  id: string;
  date: string;
  type: QocReviewType;
  lead_reviewer: string;
  overall_rating: QocRating;
  domains: QocDomainAssessment[];
  strengths: string[];
  areas_for_improvement: string[];
  children_feedback: string;
  staff_feedback: string;
  actions: QocActionItem[];
  next_review_date: string;
  notes: string;
}

// ── Quality Review Cycle (Reg 46) ───────────────────────────────────────────

export type Reg46ReviewStatus = "completed" | "planned";

export const REG46_REVIEW_STATUS_LABEL: Record<Reg46ReviewStatus, string> = {
  completed: "Completed",
  planned: "Planned",
};

export type Reg46AreaRating = "outstanding" | "good" | "requires_improvement" | "inadequate";

export const REG46_AREA_RATING_LABEL: Record<Reg46AreaRating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export type Reg46ActionStatus = "open" | "in_progress" | "completed";

export const REG46_ACTION_STATUS_LABEL: Record<Reg46ActionStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
};

export interface Reg46AreaReviewed {
  area: string;
  rating: Reg46AreaRating;
  summary: string;
  evidence: string;
}

export interface Reg46ActionArising {
  action: string;
  owner: string;
  deadline: string;
  status: Reg46ActionStatus;
}

export interface Reg46Review {
  id: string;
  review_period_start: string;
  review_period_end: string;
  completed_date: string | null;
  reviewer: string;
  independent_input: string;
  overall_rating: string;
  areas_reviewed: Reg46AreaReviewed[];
  consultation_sources: string[];
  actions_arising: Reg46ActionArising[];
  shared_with: string[];
  status: Reg46ReviewStatus;
}

/* ══════════════════════════════════════════════════════════════════════════════
   BATCH 52 — referral-tracker, reg22-records, reg35-notifications,
              reg40-staffing-plan, reg44-actions, registration-changes-log
   ══════════════════════════════════════════════════════════════════════════════ */

/* ── referral-tracker ─────────────────────────────────────────────────────── */

export type ReferralTrackerStatus =
  | "received"
  | "screening"
  | "under_assessment"
  | "matching_panel"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "waitlisted";

export const REFERRAL_TRACKER_STATUS_LABEL: Record<ReferralTrackerStatus, string> = {
  received: "Received",
  screening: "Screening",
  under_assessment: "Under Assessment",
  matching_panel: "Matching Panel",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
  waitlisted: "Waitlisted",
};

export interface ReferralTimelineEvent {
  date: string;
  event: string;
  by: string;
}

export interface ReferralTrackerRecord {
  id: string;
  child_ref: string;
  age: number;
  gender: string;
  referring_authority: string;
  social_worker_name: string;
  referral_date: string;
  status: ReferralTrackerStatus;
  reason_for_placement: string;
  referral_documents_received: boolean;
  impact_assessment_completed: boolean;
  matching_panel_date: string | null;
  matching_panel_outcome: string | null;
  decision_date: string | null;
  admission_date: string | null;
  decline_reason: string | null;
  notes: string;
  timeline: ReferralTimelineEvent[];
}

/* ── reg22-records ────────────────────────────────────────────────────────── */

export type Reg22ComplianceStatus = "compliant" | "partially_compliant" | "non_compliant";

export const REG22_COMPLIANCE_STATUS_LABEL: Record<Reg22ComplianceStatus, string> = {
  compliant: "Compliant",
  partially_compliant: "Partially Compliant",
  non_compliant: "Non-Compliant",
};

export interface Reg22Record {
  id: string;
  record_category: string;
  schedule_ref: string;
  description: string;
  status: Reg22ComplianceStatus;
  last_audit_date: string;
  audited_by: string;
  where_stored: string;
  retention_period: string;
  notes: string;
}

/* ── reg35-notifications ──────────────────────────────────────────────────── */

export type Reg35NotificationType =
  | "death"
  | "serious_injury"
  | "serious_illness"
  | "restraint"
  | "allegation_against_staff"
  | "child_protection"
  | "police_involvement"
  | "absconding"
  | "serious_complaint"
  | "significant_incident"
  | "infectious_disease"
  | "fire"
  | "other";

export const REG35_NOTIFICATION_TYPE_LABEL: Record<Reg35NotificationType, string> = {
  death: "Death of a Child",
  serious_injury: "Serious Injury",
  serious_illness: "Serious Illness",
  restraint: "Use of Restraint",
  allegation_against_staff: "Allegation Against Staff",
  child_protection: "Child Protection Incident",
  police_involvement: "Police Involvement",
  absconding: "Absconding / Missing",
  serious_complaint: "Serious Complaint",
  significant_incident: "Significant Incident",
  infectious_disease: "Infectious Disease Outbreak",
  fire: "Fire",
  other: "Other Notifiable Event",
};

export type Reg35NotificationMethod = "phone" | "email" | "online_form" | "letter";

export const REG35_NOTIFICATION_METHOD_LABEL: Record<Reg35NotificationMethod, string> = {
  phone: "Telephone",
  email: "Email",
  online_form: "Ofsted Online Form",
  letter: "Letter",
};

export type Reg35OfstedResponse =
  | "acknowledged"
  | "no_further_action"
  | "monitoring"
  | "inspection_brought_forward"
  | "awaiting_response";

export const REG35_OFSTED_RESPONSE_LABEL: Record<Reg35OfstedResponse, string> = {
  acknowledged: "Acknowledged",
  no_further_action: "No Further Action",
  monitoring: "Monitoring",
  inspection_brought_forward: "Inspection Brought Forward",
  awaiting_response: "Awaiting Response",
};

export interface Reg35Notification {
  id: string;
  date_of_event: string;
  date_notified: string;
  notification_type: Reg35NotificationType;
  notified_to_ofsted: boolean;
  notified_to_la: boolean;
  notified_to_police: boolean;
  notified_to_other: string[];
  method: Reg35NotificationMethod;
  ofsted_ref: string;
  child_id: string | null;
  summary: string;
  actions_taken: string[];
  notified_by_id: string;
  timeliness_compliant: boolean;
  ofsted_response: Reg35OfstedResponse;
  follow_up_required: boolean;
  follow_up_details: string;
  linked_records: string[];
  notes: string;
}

/* ── reg40-staffing-plan ──────────────────────────────────────────────────── */

export type Reg40QualStatus = "complete" | "in_progress" | "due_renewal" | "current";

export const REG40_QUAL_STATUS_LABEL: Record<Reg40QualStatus, string> = {
  complete: "Complete",
  in_progress: "In Progress",
  due_renewal: "Due Renewal",
  current: "Current",
};

export interface Reg40Qualification {
  name: string;
  status: Reg40QualStatus;
  date: string | null;
}

export interface Reg40StaffEntry {
  id: string;
  staff_id: string;
  role: string;
  contract_hours: number;
  qualifications: Reg40Qualification[];
  tc_refresher_due: string;
  first_aid_expiry: string | null;
  shift_pattern: string;
  key_child: string | null;
}

/* ── reg44-actions ────────────────────────────────────────────────────────── */

export type Reg44ActionPriority = "low" | "medium" | "high" | "critical";

export const REG44_ACTION_PRIORITY_LABEL: Record<Reg44ActionPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export type Reg44ActionStatus = "open" | "in_progress" | "completed" | "overdue" | "carried_forward";

export const REG44_ACTION_STATUS_LABEL: Record<Reg44ActionStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
  carried_forward: "Carried Forward",
};

export type Reg44ActionTheme =
  | "safeguarding"
  | "health_wellbeing"
  | "education"
  | "staffing"
  | "premises"
  | "record_keeping"
  | "medication"
  | "complaints"
  | "quality_care"
  | "policies"
  | "other";

export const REG44_ACTION_THEME_LABEL: Record<Reg44ActionTheme, string> = {
  safeguarding: "Safeguarding",
  health_wellbeing: "Health & Wellbeing",
  education: "Education",
  staffing: "Staffing",
  premises: "Premises",
  record_keeping: "Record Keeping",
  medication: "Medication",
  complaints: "Complaints",
  quality_care: "Quality of Care",
  policies: "Policies",
  other: "Other",
};

export interface Reg44ActionRecord {
  id: string;
  visit_date: string;
  visit_ref: string;
  visitor_name: string;
  theme: Reg44ActionTheme;
  priority: Reg44ActionPriority;
  status: Reg44ActionStatus;
  recommendation: string;
  action_required: string;
  assigned_to: string;
  due_date: string;
  completed_date: string | null;
  evidence_of_completion: string;
  management_response: string;
  carried_forward_count: number;
  notes: string;
}

/* ── registration-changes-log ─────────────────────────────────────────────── */

export type RegistrationChangeType =
  | "initial_registration"
  | "sop_change"
  | "manager_change"
  | "ri_change"
  | "premises_variation"
  | "max_number_variation"
  | "type_variation"
  | "conditions"
  | "cancellation_request"
  | "annual_return"
  | "reg40_notification";

export const REGISTRATION_CHANGE_TYPE_LABEL: Record<RegistrationChangeType, string> = {
  initial_registration: "Initial Registration",
  sop_change: "Change to Statement of Purpose",
  manager_change: "Manager Change (Reg 28)",
  ri_change: "Responsible Individual Change",
  premises_variation: "Premises Variation",
  max_number_variation: "Maximum Number Variation",
  type_variation: "Type of Accommodation Variation",
  conditions: "Conditions of Registration",
  cancellation_request: "Cancellation Request",
  annual_return: "Annual Return Submission",
  reg40_notification: "Notification to Ofsted (Reg 40)",
};

export type RegistrationChangeStatus =
  | "submitted"
  | "pending"
  | "approved"
  | "refused"
  | "withdrawn"
  | "active";

export const REGISTRATION_CHANGE_STATUS_LABEL: Record<RegistrationChangeStatus, string> = {
  submitted: "Submitted",
  pending: "Pending",
  approved: "Approved",
  refused: "Refused",
  withdrawn: "Withdrawn",
  active: "Active",
};

export interface RegistrationChangeRecord {
  id: string;
  change_type: RegistrationChangeType;
  date_applied: string;
  status: RegistrationChangeStatus;
  ofsted_reference: string;
  change_description: string;
  reason_for_change: string;
  prepared_by: string;
  documents_submitted: string[];
  ofsted_response_date: string;
  ofsted_response_summary: string;
  effective_date: string;
  children_affected: string;
  children_informed_how: string;
  staff_informed: boolean;
  staff_informed_how: string;
  la_informed: boolean;
  review_date: string;
  notes: string;
}

/* ── Batch 53 ────────────────────────────────────────────────────── */

/* Regulatory Correspondence Tracker */

export type RegulatoryCorrespondenceRegulator = "la_riverside" | "la_valley" | "la_hillside" | "ofsted" | "ico" | "hmrc" | "hse" | "planning_authority" | "environmental_health" | "fire_authority" | "icb_nhs" | "dfe";
export const REGULATORY_CORRESPONDENCE_REGULATOR_LABEL: Record<RegulatoryCorrespondenceRegulator, string> = {
  la_riverside: "Local Authority — Riverside",
  la_valley: "Local Authority — Valley",
  la_hillside: "Local Authority — Hillside",
  ofsted: "Ofsted (link to Ofsted log)",
  ico: "ICO",
  hmrc: "HMRC",
  hse: "HSE",
  planning_authority: "Planning Authority",
  environmental_health: "Environmental Health",
  fire_authority: "Fire Authority",
  icb_nhs: "ICB / NHS Partner",
  dfe: "DfE",
};

export type RegulatoryCorrespondenceDirection = "incoming" | "outgoing";
export const REGULATORY_CORRESPONDENCE_DIRECTION_LABEL: Record<RegulatoryCorrespondenceDirection, string> = {
  incoming: "Incoming",
  outgoing: "Outgoing",
};

export type RegulatoryCorrespondenceUrgency = "routine" | "standard" | "urgent";
export const REGULATORY_CORRESPONDENCE_URGENCY_LABEL: Record<RegulatoryCorrespondenceUrgency, string> = {
  routine: "Routine",
  standard: "Standard",
  urgent: "Urgent",
};

export type RegulatoryCorrespondenceStatus = "open" | "closed" | "pending_action" | "awaiting_reply";
export const REGULATORY_CORRESPONDENCE_STATUS_LABEL: Record<RegulatoryCorrespondenceStatus, string> = {
  open: "Open",
  closed: "Closed",
  pending_action: "Pending action",
  awaiting_reply: "Awaiting reply",
};

export type RegulatoryCorrespondenceConfidentiality = "standard_conf" | "sensitive" | "restricted";
export const REGULATORY_CORRESPONDENCE_CONFIDENTIALITY_LABEL: Record<RegulatoryCorrespondenceConfidentiality, string> = {
  standard_conf: "Standard",
  sensitive: "Sensitive",
  restricted: "Restricted",
};

export interface RegulatoryCorrespondenceLetter {
  id: string;
  date_sent: string;
  date_received: string;
  regulator: RegulatoryCorrespondenceRegulator;
  direction: RegulatoryCorrespondenceDirection;
  reference: string;
  subject: string;
  summary: string;
  our_response: string;
  documents_attached: string[];
  response_required: boolean;
  response_deadline: string;
  response_sent: boolean;
  actions_agreed: string[];
  urgency: RegulatoryCorrespondenceUrgency;
  status: RegulatoryCorrespondenceStatus;
  confidentiality_level: RegulatoryCorrespondenceConfidentiality;
  recorded_by: string;
}

/* Religious Festival Celebrations */

export type ReligiousFestivalFaith = "islam" | "christianity" | "hinduism" | "sikhism" | "judaism" | "buddhism" | "rastafari" | "secular" | "other_multi_faith";
export const RELIGIOUS_FESTIVAL_FAITH_LABEL: Record<ReligiousFestivalFaith, string> = {
  islam: "Islam",
  christianity: "Christianity",
  hinduism: "Hinduism",
  sikhism: "Sikhism",
  judaism: "Judaism",
  buddhism: "Buddhism",
  rastafari: "Rastafari",
  secular: "Secular",
  other_multi_faith: "Other / Multi-faith",
};

export interface ReligiousFestivalRecord {
  id: string;
  festival: string;
  faith: ReligiousFestivalFaith;
  date: string;
  children_involved: string[];
  led_by_child: string | null;
  preparation: string[];
  food: string[];
  decorations: string[];
  guests_invited: string[];
  rituals_observed: string[];
  child_chosen_aspects: string[];
  budget: number;
  spent: number;
  photos_taken: boolean;
  consent_for_photos: string[];
  reflections: string;
  child_voice: string;
  staff_observation: string;
  improvements_for_next_time: string[];
  recorded_by: string;
}

/* Religious Observance Log */

export interface ReligiousObservancePracticeSupported {
  practice: string;
  date_last: string;
  date_next: string;
  supported_by: string;
}

export interface ReligiousObservanceFestival {
  festival: string;
  date: string;
  plans_for_observance: string;
  attending_with: string;
}

export interface ReligiousObservanceRecord {
  id: string;
  child_id: string;
  faith_or_belief: string;
  profile_summary: string;
  regular_practices: string[];
  practices_supported: ReligiousObservancePracticeSupported[];
  dietary_needs_linked: string;
  dress_code: string;
  festivals_observed: ReligiousObservanceFestival[];
  faith_leaders: string[];
  place_of_worship_preferences: string;
  spiritual_support: string[];
  child_authored: boolean;
  reviewed_date: string;
  reviewed_with: string;
  next_review_date: string;
  notes: string;
}

/* Restrictions Log */

export type RestrictionsLogType = "liberty" | "access" | "contact" | "technology" | "movement" | "medication" | "financial" | "dietary" | "other";
export const RESTRICTIONS_LOG_TYPE_LABEL: Record<RestrictionsLogType, string> = {
  liberty: "Liberty",
  access: "Access",
  contact: "Contact",
  technology: "Technology",
  movement: "Movement",
  medication: "Medication",
  financial: "Financial",
  dietary: "Dietary",
  other: "Other",
};

export type RestrictionsLogStatus = "active" | "under_review" | "ended" | "appealed";
export const RESTRICTIONS_LOG_STATUS_LABEL: Record<RestrictionsLogStatus, string> = {
  active: "Active",
  under_review: "Under Review",
  ended: "Ended",
  appealed: "Appealed",
};

export type RestrictionsLogAuthorisedBy = "court_order" | "placing_authority" | "care_plan" | "risk_assessment" | "dols";
export const RESTRICTIONS_LOG_AUTHORISED_BY_LABEL: Record<RestrictionsLogAuthorisedBy, string> = {
  court_order: "Court Order",
  placing_authority: "Placing Authority",
  care_plan: "Care Plan",
  risk_assessment: "Risk Assessment",
  dols: "DoLS",
};

export interface RestrictionsLogReview {
  date: string;
  reviewer: string;
  outcome: string;
  continued: boolean;
}

export interface RestrictionsLogRecord {
  id: string;
  child_id: string;
  type: RestrictionsLogType;
  description: string;
  reason: string;
  status: RestrictionsLogStatus;
  authorised_by: RestrictionsLogAuthorisedBy;
  authoriser_name: string;
  start_date: string;
  end_date: string | null;
  review_frequency: string;
  reviews: RestrictionsLogReview[];
  child_view: string;
  proportionality: string;
  least_restrictive: string;
  impact_assessment: string;
  notified_parties: string[];
}

/* Risk Appetite Statement */

export type RiskAppetiteLevel = "high" | "medium_high" | "medium" | "low" | "graduated";
export const RISK_APPETITE_LEVEL_LABEL: Record<RiskAppetiteLevel, string> = {
  high: "HIGH",
  medium_high: "MEDIUM-HIGH",
  medium: "MEDIUM",
  low: "LOW",
  graduated: "GRADUATED",
};

export interface RiskAppetiteDomain {
  id: string;
  name: string;
  appetite_level: RiskAppetiteLevel;
  rationale: string;
  examples: string[];
  red_lines: string[];
  decision_authority: string;
}

/* Strategic Risk Management Board */

export type StrategicRiskCategory = "operational" | "workforce" | "regulatory" | "financial" | "reputational" | "strategic" | "safeguarding" | "environmental" | "cyber_data";
export const STRATEGIC_RISK_CATEGORY_LABEL: Record<StrategicRiskCategory, string> = {
  operational: "Operational",
  workforce: "Workforce",
  regulatory: "Regulatory",
  financial: "Financial",
  reputational: "Reputational",
  strategic: "Strategic",
  safeguarding: "Safeguarding",
  environmental: "Environmental",
  cyber_data: "Cyber/Data",
};

export type StrategicRiskVelocity = "slow" | "moderate" | "fast";
export const STRATEGIC_RISK_VELOCITY_LABEL: Record<StrategicRiskVelocity, string> = {
  slow: "Slow",
  moderate: "Moderate",
  fast: "Fast",
};

export type StrategicRiskTrendDirection = "decreasing" | "stable" | "increasing";
export const STRATEGIC_RISK_TREND_DIRECTION_LABEL: Record<StrategicRiskTrendDirection, string> = {
  decreasing: "Decreasing",
  stable: "Stable",
  increasing: "Increasing",
};

export type StrategicRiskAppetiteAlignment = "within_appetite" | "at_appetite_limit" | "above_appetite";
export const STRATEGIC_RISK_APPETITE_ALIGNMENT_LABEL: Record<StrategicRiskAppetiteAlignment, string> = {
  within_appetite: "Within appetite",
  at_appetite_limit: "At appetite limit",
  above_appetite: "Above appetite",
};

export type StrategicRiskKRIStatus = "ok" | "warning" | "trigger";
export const STRATEGIC_RISK_KRI_STATUS_LABEL: Record<StrategicRiskKRIStatus, string> = {
  ok: "OK",
  warning: "Warning",
  trigger: "Trigger",
};

export interface StrategicRiskKeyRiskIndicator {
  indicator: string;
  current_value: string;
  threshold: string;
  status: StrategicRiskKRIStatus;
}

export interface StrategicRiskRecord {
  id: string;
  risk_title: string;
  category: StrategicRiskCategory;
  description: string;
  current_likelihood: number;
  current_impact: number;
  inherent_risk_score: number;
  residual_risk_score: number;
  target_risk_score: number;
  current_controls: string[];
  additional_controls_required: string[];
  risk_owner: string;
  review_frequency: string;
  last_reviewed: string;
  next_review_date: string;
  escalation_criteria: string;
  board_level: boolean;
  key_risk_indicators: StrategicRiskKeyRiskIndicator[];
  velocity_of_change: StrategicRiskVelocity;
  trend: StrategicRiskTrendDirection;
  risk_appetite_alignment: StrategicRiskAppetiteAlignment;
  interconnected_risks: string[];
}

/* ── Batch 54 ────────────────────────────────────────────────────────── */

/* risk-management-plans */

export type RiskMgmtPlanCategory = "self_harm" | "absconding" | "aggression" | "exploitation" | "substance_misuse" | "sexualised_behaviour" | "online_risk" | "radicalisation" | "trafficking" | "other";
export const RISK_MGMT_PLAN_CATEGORY_LABEL: Record<RiskMgmtPlanCategory, string> = {
  self_harm: "Self-Harm",
  absconding: "Absconding",
  aggression: "Aggression",
  exploitation: "Exploitation",
  substance_misuse: "Substance Misuse",
  sexualised_behaviour: "Sexualised Behaviour",
  online_risk: "Online Risk",
  radicalisation: "Radicalisation",
  trafficking: "Trafficking",
  other: "Other",
};

export type RiskMgmtPlanStatus = "active" | "under_review" | "archived" | "draft";
export const RISK_MGMT_PLAN_STATUS_LABEL: Record<RiskMgmtPlanStatus, string> = {
  active: "Active",
  under_review: "Under Review",
  archived: "Archived",
  draft: "Draft",
};

export type RiskMgmtPlanStrategyEffectiveness = "effective" | "partially_effective" | "not_assessed" | "not_effective";
export const RISK_MGMT_PLAN_STRATEGY_EFFECTIVENESS_LABEL: Record<RiskMgmtPlanStrategyEffectiveness, string> = {
  effective: "Effective",
  partially_effective: "Partially Effective",
  not_assessed: "Not Assessed",
  not_effective: "Not Effective",
};

export type RiskMgmtPlanTriggerLikelihood = "high" | "medium" | "low";

export interface RiskMgmtPlanStrategy {
  strategy: string;
  owner: string;
  frequency: string;
  effectiveness: RiskMgmtPlanStrategyEffectiveness;
}

export interface RiskMgmtPlanTrigger {
  trigger: string;
  likelihood: RiskMgmtPlanTriggerLikelihood;
  context: string;
}

export interface RiskMgmtPlanMultiAgencyInput {
  professional: string;
  role: string;
  input: string;
}

export interface RiskManagementPlanRecord {
  id: string;
  child_id: string;
  risk_category: RiskMgmtPlanCategory;
  current_risk_level: RiskLevel;
  previous_risk_level: RiskLevel;
  risk_description: string;
  triggers: RiskMgmtPlanTrigger[];
  warning_signals: string[];
  management_strategies: RiskMgmtPlanStrategy[];
  emergency_plan: string;
  protective_factors: string[];
  escalation_procedure: string;
  review_date: string;
  last_reviewed: string;
  created_by: string;
  approved_by: string;
  multi_agency_input: RiskMgmtPlanMultiAgencyInput[];
  child_views: string;
  status: RiskMgmtPlanStatus;
}

/* risk-register */

export type RiskRegisterCategory = "safeguarding" | "behaviour" | "health" | "placement_stability" | "staffing" | "environmental" | "regulatory" | "emotional_wellbeing" | "exploitation" | "missing";
export const RISK_REGISTER_CATEGORY_LABEL: Record<RiskRegisterCategory, string> = {
  safeguarding: "Safeguarding",
  behaviour: "Behaviour",
  health: "Health",
  placement_stability: "Placement Stability",
  staffing: "Staffing",
  environmental: "Environmental",
  regulatory: "Regulatory",
  emotional_wellbeing: "Emotional Wellbeing",
  exploitation: "Exploitation",
  missing: "Missing",
};

export type RiskRegisterStatus = "active" | "mitigated" | "monitoring" | "closed" | "escalated";
export const RISK_REGISTER_STATUS_LABEL: Record<RiskRegisterStatus, string> = {
  active: "Active",
  mitigated: "Mitigated",
  monitoring: "Monitoring",
  closed: "Closed",
  escalated: "Escalated",
};

export type RiskRegisterLevel = "critical" | "high" | "medium" | "low";
export const RISK_REGISTER_LEVEL_LABEL: Record<RiskRegisterLevel, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export interface RiskRegisterEntry {
  id: string;
  title: string;
  description: string;
  category: RiskRegisterCategory;
  child_id: string | null;
  likelihood: number;
  impact: number;
  risk_score: number;
  risk_level: RiskRegisterLevel;
  status: RiskRegisterStatus;
  owner_id: string;
  mitigations: string[];
  review_date: string;
  last_reviewed: string | null;
  created_at: string;
  updated_at: string;
  escalated_to: string | null;
  notes: string | null;
}

/* room-allocation-rationale */

export type RoomAllocationSuitability = "strong_fit" | "acceptable" | "compromise" | "adapted";
export const ROOM_ALLOCATION_SUITABILITY_LABEL: Record<RoomAllocationSuitability, string> = {
  strong_fit: "Strong fit",
  acceptable: "Acceptable",
  compromise: "Compromise",
  adapted: "Adapted",
};

export interface RoomAllocationAlternative {
  room: string;
  why_not_chosen: string;
}

export interface RoomAllocationCharacteristic {
  feature: string;
  suitability: RoomAllocationSuitability;
}

export interface RoomAllocationProximity {
  peer: string;
  relationship: string;
  impact: string;
}

export interface RoomAllocationReview {
  review_date: string;
  outcome: string;
}

export interface RoomAllocationRecord {
  id: string;
  child_id: string;
  room_number: string;
  room_description: string;
  allocated_date: string;
  decision_maker: string;
  reasons_for_allocation: string[];
  considerations_at_panel_discussion: string[];
  child_input_on_allocation: string;
  alternative_rooms_considered: RoomAllocationAlternative[];
  room_characteristics: RoomAllocationCharacteristic[];
  proximity_to_other_children: RoomAllocationProximity[];
  proximity_to_communal_areas: string;
  proximity_to_staff_office: string;
  sensory_considerations: string[];
  safeguarding_considerations: string[];
  review_schedule: string;
  review_triggers: string[];
  has_been_reviewed: RoomAllocationReview[];
  fit_for_purpose_rating: number;
  child_satisfaction_with_room: string;
  notes: string;
}

/* room-searches */

export type RoomSearchType = "routine" | "intelligence_led" | "welfare_concern" | "missing_return" | "safeguarding" | "requested";
export const ROOM_SEARCH_TYPE_LABEL: Record<RoomSearchType, string> = {
  routine: "Routine",
  intelligence_led: "Intelligence-Led",
  welfare_concern: "Welfare Concern",
  missing_return: "Missing Return",
  safeguarding: "Safeguarding",
  requested: "Requested",
};

export type RoomSearchDistressLevel = "none" | "mild" | "moderate" | "significant";
export const ROOM_SEARCH_DISTRESS_LEVEL_LABEL: Record<RoomSearchDistressLevel, string> = {
  none: "None",
  mild: "Mild",
  moderate: "Moderate",
  significant: "Significant",
};

export type RoomSearchStatus = "completed" | "follow_up_required" | "escalated" | "closed";
export const ROOM_SEARCH_STATUS_LABEL: Record<RoomSearchStatus, string> = {
  completed: "Completed",
  follow_up_required: "Follow-Up Required",
  escalated: "Escalated",
  closed: "Closed",
};

export type RoomSearchActionStatus = "pending" | "in_progress" | "completed";
export const ROOM_SEARCH_ACTION_STATUS_LABEL: Record<RoomSearchActionStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

export interface RoomSearchFoundItem {
  item: string;
  description: string;
  action_taken: string;
  retained: boolean;
  photo_taken: boolean;
}

export interface RoomSearchFollowUpAction {
  action: string;
  owner: string;
  due_date: string;
  status: RoomSearchActionStatus;
}

export interface RoomSearchRecord {
  id: string;
  child_id: string;
  date: string;
  time: string;
  search_type: RoomSearchType;
  reason: string;
  conducted_by: string;
  witnessed_by: string;
  child_present: boolean;
  child_informed: boolean;
  areas_searched: string[];
  items_found: RoomSearchFoundItem[];
  nothing_found: boolean;
  child_response: string;
  child_distress_level: RoomSearchDistressLevel;
  follow_up_required: boolean;
  follow_up_actions: RoomSearchFollowUpAction[];
  social_worker_notified: boolean;
  parent_notified: boolean;
  manager_approval: string;
  notes: string;
  status: RoomSearchStatus;
  linked_incident: string | null;
}

/* rse-tracker */

export type RseTrackerTopic = "healthy_relationships" | "consent" | "online_safety_relationships" | "body_changes_puberty" | "boundaries" | "identity_lgbtq" | "family_relationships" | "friendship" | "coping_peer_pressure" | "recognising_harmful_relationships";
export const RSE_TRACKER_TOPIC_LABEL: Record<RseTrackerTopic, string> = {
  healthy_relationships: "Healthy relationships",
  consent: "Consent",
  online_safety_relationships: "Online safety + relationships",
  body_changes_puberty: "Body changes/puberty",
  boundaries: "Boundaries",
  identity_lgbtq: "Identity (incl. LGBTQ+)",
  family_relationships: "Family relationships",
  friendship: "Friendship",
  coping_peer_pressure: "Coping with peer pressure",
  recognising_harmful_relationships: "Recognising harmful relationships",
};

export type RseTrackerMethod = "conversation" | "books_visual_resources" | "external_programme" | "through_school" | "drawing_expressive";
export const RSE_TRACKER_METHOD_LABEL: Record<RseTrackerMethod, string> = {
  conversation: "Conversation",
  books_visual_resources: "Books/visual resources",
  external_programme: "External programme",
  through_school: "Through school",
  drawing_expressive: "Drawing/expressive",
};

export interface RseTrackerRecord {
  id: string;
  child_id: string;
  date: string;
  topic: RseTrackerTopic;
  duration_minutes: number;
  delivered_by: string;
  method: RseTrackerMethod;
  child_initiation_of_topic: boolean;
  key_concepts_covered: string[];
  child_contribution: string;
  questions_raised: string[];
  follow_up: string;
  parental_awareness: string;
  curriculum_linked_to: string;
  recorded_by: string;
  notes: string;
}

/* safe-touch-protocol */

export interface SafeTouchAcceptableTouch {
  type: string;
  context: string;
  child_agreed: boolean;
}

export interface SafeTouchProtocolRecord {
  id: string;
  child_id: string;
  trauma_informed_basis: string;
  child_age: number;
  acceptable_touches: SafeTouchAcceptableTouch[];
  unacceptable_touches: string[];
  greeting_preferences: string;
  comfort_preferences: string;
  physical_proximity: string;
  personal_space_requirements: string;
  triggers: string[];
  signs_of_distress: string[];
  response_if_triggered: string[];
  child_preferred_language: string;
  reviewed_date: string;
  reviewed_with: string;
  review_with_child: boolean;
  child_understands_consent: boolean;
  staff_briefing_date: string;
  notes: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   BATCH 55 — safeguarding-supervision, safer-recruitment-tracker,
   secure-storage, self-harm-safety-plan, sensory-equipment-inventory,
   sensory-profiles
   ───────────────────────────────────────────────────────────────────────────── */

/* ── safeguarding-supervision ─────────────────────────────────────────────── */

export interface SafeguardingSupervisionAgreedAction {
  action: string;
  owner: string;
  deadline: string;
}

export interface SafeguardingSupervisionRecord {
  id: string;
  date: string;
  supervisee: string;
  supervisor: string;
  duration_minutes: number;
  cases_discussed: string[];
  risk_themes: string[];
  emotional_impact: string;
  reflective_questions_explored: string[];
  actions_agreed: SafeguardingSupervisionAgreedAction[];
  supervisor_observations: string;
  parallel_process_noted: string;
  next_session: string;
  confidentiality_note: string;
}

/* ── safer-recruitment-tracker ────────────────────────────────────────────── */

export type SaferRecruitmentStatus =
  | "applying"
  | "interviewing"
  | "references"
  | "dbs_pending"
  | "pre_employment_checks"
  | "onboarding"
  | "employed"
  | "withdrawn";

export const SAFER_RECRUITMENT_STATUS_LABEL: Record<SaferRecruitmentStatus, string> = {
  applying: "Applying",
  interviewing: "Interviewing",
  references: "References",
  dbs_pending: "DBS Pending",
  pre_employment_checks: "Pre-Employment Checks",
  onboarding: "Onboarding",
  employed: "Employed",
  withdrawn: "Withdrawn",
};

export type SaferRecruitmentReferenceStatus =
  | "pending"
  | "received"
  | "concerns_raised";

export const SAFER_RECRUITMENT_REFERENCE_STATUS_LABEL: Record<SaferRecruitmentReferenceStatus, string> = {
  pending: "Pending",
  received: "Received",
  concerns_raised: "Concerns Raised",
};

export type SaferRecruitmentDbsResult =
  | "clear"
  | "disclosure_reviewed"
  | "pending";

export const SAFER_RECRUITMENT_DBS_RESULT_LABEL: Record<SaferRecruitmentDbsResult, string> = {
  clear: "Clear",
  disclosure_reviewed: "Disclosure - Reviewed",
  pending: "Pending",
};

export interface SaferRecruitmentChecklistItem {
  name: string;
  completed: boolean;
  date: string;
  notes: string;
}

export interface SaferRecruitmentReference {
  referee: string;
  organisation: string;
  status: SaferRecruitmentReferenceStatus;
  date_received: string;
}

export interface SaferRecruitmentRecord {
  id: string;
  candidate_name: string;
  role_applied_for: string;
  application_date: string;
  status: SaferRecruitmentStatus;
  checklist_items: SaferRecruitmentChecklistItem[];
  references: SaferRecruitmentReference[];
  dbs_application_date: string;
  dbs_result_date: string;
  dbs_result: SaferRecruitmentDbsResult;
  interviewers: string[];
  red_flags_raised: string[];
  proposed_start_date: string;
  recruited_by: string;
}

/* ── secure-storage ───────────────────────────────────────────────────────── */

export type SecureStorageCategory =
  | "medication"
  | "documentation"
  | "valuables"
  | "keys"
  | "hazardous"
  | "electronics"
  | "confidential"
  | "cash"
  | "other";

export const SECURE_STORAGE_CATEGORY_LABEL: Record<SecureStorageCategory, string> = {
  medication: "Medication",
  documentation: "Documentation",
  valuables: "Valuables",
  keys: "Keys",
  hazardous: "Hazardous",
  electronics: "Electronics",
  confidential: "Confidential",
  cash: "Cash",
  other: "Other",
};

export type SecureStorageLocation =
  | "office_safe"
  | "medication_cabinet"
  | "key_safe"
  | "filing_cabinet"
  | "secure_room"
  | "manager_office"
  | "staff_room_locker";

export const SECURE_STORAGE_LOCATION_LABEL: Record<SecureStorageLocation, string> = {
  office_safe: "Office Safe",
  medication_cabinet: "Medication Cabinet",
  key_safe: "Key Safe",
  filing_cabinet: "Filing Cabinet",
  secure_room: "Secure Room",
  manager_office: "Manager's Office",
  staff_room_locker: "Staff Room Locker",
};

export type SecureStorageAccessLevel =
  | "rm_only"
  | "seniors"
  | "all_staff"
  | "designated";

export const SECURE_STORAGE_ACCESS_LEVEL_LABEL: Record<SecureStorageAccessLevel, string> = {
  rm_only: "RM Only",
  seniors: "Seniors",
  all_staff: "All Staff",
  designated: "Designated",
};

export type SecureStorageItemStatus =
  | "stored"
  | "in_use"
  | "removed"
  | "disposed";

export const SECURE_STORAGE_ITEM_STATUS_LABEL: Record<SecureStorageItemStatus, string> = {
  stored: "Stored",
  in_use: "In Use",
  removed: "Removed",
  disposed: "Disposed",
};

export type SecureStorageAction =
  | "retrieved"
  | "returned"
  | "added"
  | "checked"
  | "removed";

export const SECURE_STORAGE_ACTION_LABEL: Record<SecureStorageAction, string> = {
  retrieved: "Retrieved",
  returned: "Returned",
  added: "Added",
  checked: "Checked",
  removed: "Removed",
};

export interface SecureStorageAccessLog {
  id: string;
  date: string;
  time: string;
  accessed_by: string;
  action: SecureStorageAction;
  reason: string;
  witnessed_by: string | null;
}

export interface SecureStorageRecord {
  id: string;
  name: string;
  category: SecureStorageCategory;
  description: string;
  location: SecureStorageLocation;
  access_level: SecureStorageAccessLevel;
  owner: string;
  added_date: string;
  added_by: string;
  last_checked: string;
  next_check_due: string;
  status: SecureStorageItemStatus;
  notes: string;
  access_log: SecureStorageAccessLog[];
}

/* ── self-harm-safety-plan ────────────────────────────────────────────────── */

export type SelfHarmSafetyPlanStatus =
  | "not_currently_needed"
  | "active_preventive"
  | "active_recent_incident"
  | "in_review";

export const SELF_HARM_SAFETY_PLAN_STATUS_LABEL: Record<SelfHarmSafetyPlanStatus, string> = {
  not_currently_needed: "Not currently needed",
  active_preventive: "Active — preventive",
  active_recent_incident: "Active — recent incident",
  in_review: "In review",
};

export type SelfHarmSafetyPlanReviewFrequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "quarterly"
  | "after_incident";

export const SELF_HARM_SAFETY_PLAN_REVIEW_FREQUENCY_LABEL: Record<SelfHarmSafetyPlanReviewFrequency, string> = {
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  after_incident: "After incident",
};

export interface SelfHarmSafetyPlanContact {
  name: string;
  relationship: string;
  how: string;
}

export interface SelfHarmSafetyPlanProfessionalContact {
  name: string;
  role: string;
  how: string;
}

export interface SelfHarmSafetyPlanRecord {
  id: string;
  child_id: string;
  plan_date: string;
  status: SelfHarmSafetyPlanStatus;
  co_produced_with: string[];
  warning_signs_external: string[];
  warning_signs_internal: string[];
  early_triggers: string[];
  internal_coping_strategies: string[];
  social_distractions: string[];
  people_to_contact: SelfHarmSafetyPlanContact[];
  professional_contacts: SelfHarmSafetyPlanProfessionalContact[];
  means_restriction_agreed: string[];
  reasons_to_live: string[];
  reasons_for_hope: string[];
  child_signed_off: boolean;
  child_signed_date: string | null;
  professionals_informed: string[];
  review_frequency: SelfHarmSafetyPlanReviewFrequency;
  next_review_date: string;
  child_voice: string;
  staff_observation: string;
  flags_for_review: string[];
  key_worker: string;
}

/* ── sensory-equipment-inventory ──────────────────────────────────────────── */

export type SensoryEquipmentCategory =
  | "weighted_proprioceptive"
  | "tactile_fidget"
  | "visual_lighting"
  | "auditory"
  | "vestibular"
  | "olfactory"
  | "oral_motor"
  | "compression"
  | "calming";

export const SENSORY_EQUIPMENT_CATEGORY_LABEL: Record<SensoryEquipmentCategory, string> = {
  weighted_proprioceptive: "Weighted/proprioceptive",
  tactile_fidget: "Tactile/fidget",
  visual_lighting: "Visual/lighting",
  auditory: "Auditory",
  vestibular: "Vestibular",
  olfactory: "Olfactory",
  oral_motor: "Oral motor",
  compression: "Compression",
  calming: "Calming",
};

export type SensoryEquipmentLocation =
  | "sensory_space"
  | "casey_bedroom"
  | "lounge_sensory_corner"
  | "office_sensory_drawer"
  | "mobile_sensory_bag"
  | "garden_sensory_area";

export const SENSORY_EQUIPMENT_LOCATION_LABEL: Record<SensoryEquipmentLocation, string> = {
  sensory_space: "Sensory space",
  casey_bedroom: "Casey's bedroom",
  lounge_sensory_corner: "Lounge sensory corner",
  office_sensory_drawer: "Office sensory drawer",
  mobile_sensory_bag: "Mobile sensory bag",
  garden_sensory_area: "Garden sensory area",
};

export type SensoryEquipmentCondition =
  | "excellent"
  | "good"
  | "worn_replace_soon"
  | "damaged_out_of_use";

export const SENSORY_EQUIPMENT_CONDITION_LABEL: Record<SensoryEquipmentCondition, string> = {
  excellent: "Excellent",
  good: "Good",
  worn_replace_soon: "Worn — replace soon",
  damaged_out_of_use: "Damaged — out of use",
};

export type SensoryEquipmentUseFrequency =
  | "daily"
  | "several_times_weekly"
  | "weekly"
  | "as_needed";

export const SENSORY_EQUIPMENT_USE_FREQUENCY_LABEL: Record<SensoryEquipmentUseFrequency, string> = {
  daily: "Daily",
  several_times_weekly: "Several times weekly",
  weekly: "Weekly",
  as_needed: "As needed",
};

export interface SensoryEquipmentRecord {
  id: string;
  item_name: string;
  category: SensoryEquipmentCategory;
  location: SensoryEquipmentLocation;
  assigned_to_child: string;
  purchase_date: string;
  condition: SensoryEquipmentCondition;
  use_frequency: SensoryEquipmentUseFrequency;
  child_preference: string;
  purchase_cost: number;
  replacement_due: string;
  sensory_profile: string;
  recommended_by: string;
  notes: string;
}

/* ── sensory-profiles ─────────────────────────────────────────────────────── */

export type SensoryDomain =
  | "visual"
  | "auditory"
  | "tactile"
  | "gustatory"
  | "olfactory"
  | "proprioceptive"
  | "vestibular"
  | "interoceptive";

export const SENSORY_DOMAIN_LABEL: Record<SensoryDomain, string> = {
  visual: "Visual",
  auditory: "Auditory",
  tactile: "Tactile",
  gustatory: "Gustatory (Taste)",
  olfactory: "Olfactory (Smell)",
  proprioceptive: "Proprioceptive",
  vestibular: "Vestibular",
  interoceptive: "Interoceptive",
};

export type SensoryResponsePattern =
  | "hyper_responsive"
  | "hypo_responsive"
  | "seeking"
  | "typical";

export const SENSORY_RESPONSE_PATTERN_LABEL: Record<SensoryResponsePattern, string> = {
  hyper_responsive: "Hyper-responsive",
  hypo_responsive: "Hypo-responsive",
  seeking: "Sensory Seeking",
  typical: "Typical",
};

export type SensoryProfileStatus =
  | "active"
  | "under_review"
  | "archived";

export const SENSORY_PROFILE_STATUS_LABEL: Record<SensoryProfileStatus, string> = {
  active: "Active",
  under_review: "Under Review",
  archived: "Archived",
};

export interface SensoryProfileEntry {
  domain: SensoryDomain;
  response_pattern: SensoryResponsePattern;
  triggers: string[];
  calming: string[];
  intensity: number;
  notes: string;
}

export interface SensoryProfileStrategy {
  id: string;
  context: string;
  strategy: string;
  effectiveness_rating: number;
  added_by: string;
  added_date: string;
}

export interface SensoryProfileRecord {
  id: string;
  child_id: string;
  status: SensoryProfileStatus;
  assessed_by: string;
  assessment_date: string;
  review_date: string;
  diagnosis: string[];
  entries: SensoryProfileEntry[];
  strategies: SensoryProfileStrategy[];
  environmental_adaptations: string[];
  communication_preferences: string[];
  child_views: string;
  parent_carer_views: string;
  professional_input: string;
  notes: string;
}

/* ── sensory-room-usage ──────────────────────────────────────────────────── */

export type SensoryRoomInitiatedBy = "self" | "staff_prompted" | "routine_scheduled" | "crisis_de_escalation";
export const SENSORY_ROOM_INITIATED_BY_LABEL: Record<SensoryRoomInitiatedBy, string> = {
  self: "Self",
  staff_prompted: "Staff prompted",
  routine_scheduled: "Routine scheduled",
  crisis_de_escalation: "Crisis de-escalation",
};

export interface SensoryRoomUsageRecord {
  id: string;
  child_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  initiated_by: SensoryRoomInitiatedBy;
  preceding_state: string;
  pre_state_rating: number;
  tools_used: string[];
  staff_present: string[];
  post_state_rating: number;
  effectiveness_rating: number;
  child_comment: string;
  staff_observation: string;
  outcomes_achieved: string[];
  follow_up_needed: string;
}

/* ── serious-incident-reviews ────────────────────────────────────────────── */

export type SeriousIncidentReviewType = "serious_incident" | "near_miss" | "safeguarding_practice" | "complaint_learning" | "external_review" | "thematic";
export const SERIOUS_INCIDENT_REVIEW_TYPE_LABEL: Record<SeriousIncidentReviewType, string> = {
  serious_incident: "Serious Incident",
  near_miss: "Near Miss",
  safeguarding_practice: "Safeguarding Practice",
  complaint_learning: "Complaint Learning",
  external_review: "External Review",
  thematic: "Thematic Review",
};

export type SeriousIncidentReviewStatus = "initiated" | "under_review" | "draft_report" | "final_report" | "actions_in_progress" | "closed" | "monitoring";
export const SERIOUS_INCIDENT_REVIEW_STATUS_LABEL: Record<SeriousIncidentReviewStatus, string> = {
  initiated: "Initiated",
  under_review: "Under Review",
  draft_report: "Draft Report",
  final_report: "Final Report",
  actions_in_progress: "Actions In Progress",
  closed: "Closed",
  monitoring: "Monitoring",
};

export type SeriousIncidentReviewConfidentiality = "standard" | "restricted" | "highly_restricted";
export const SERIOUS_INCIDENT_REVIEW_CONFIDENTIALITY_LABEL: Record<SeriousIncidentReviewConfidentiality, string> = {
  standard: "Standard",
  restricted: "Restricted",
  highly_restricted: "Highly Restricted",
};

export type SeriousIncidentReviewActionStatus = "pending" | "in_progress" | "completed" | "overdue";
export const SERIOUS_INCIDENT_REVIEW_ACTION_STATUS_LABEL: Record<SeriousIncidentReviewActionStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
};

export type SeriousIncidentReviewImpactLevel = "high" | "medium" | "low";

export interface SeriousIncidentReviewLessonLearned {
  lesson: string;
  category: string;
  impact_level: SeriousIncidentReviewImpactLevel;
}

export interface SeriousIncidentReviewAction {
  action: string;
  owner: string;
  due_date: string;
  status: SeriousIncidentReviewActionStatus;
  evidence: string;
}

export interface SeriousIncidentReviewPanelMember {
  name: string;
  role: string;
}

export interface SeriousIncidentReviewExternalNotification {
  body: string;
  date: string;
  reference: string;
}

export interface SeriousIncidentReviewRecord {
  id: string;
  title: string;
  review_type: SeriousIncidentReviewType;
  incident_date: string;
  review_commenced_date: string;
  review_completed_date: string | null;
  linked_incidents: string[];
  young_people_involved: string[];
  staff_involved: string[];
  review_lead: string;
  panel_members: SeriousIncidentReviewPanelMember[];
  background_summary: string;
  key_findings: string[];
  lessons_learned: SeriousIncidentReviewLessonLearned[];
  recommendations: string[];
  actions: SeriousIncidentReviewAction[];
  external_notifications: SeriousIncidentReviewExternalNotification[];
  practice_changes: string[];
  training_implications: string[];
  policy_changes: string[];
  status: SeriousIncidentReviewStatus;
  next_review_date: string | null;
  confidentiality: SeriousIncidentReviewConfidentiality;
}

/* ── service-improvement-board ───────────────────────────────────────────── */

export type ServiceImprovementStatus = "proposed" | "approved" | "in_progress" | "implemented" | "embedded" | "on_hold" | "closed";
export const SERVICE_IMPROVEMENT_STATUS_LABEL: Record<ServiceImprovementStatus, string> = {
  proposed: "Proposed",
  approved: "Approved",
  in_progress: "In Progress",
  implemented: "Implemented",
  embedded: "Embedded",
  on_hold: "On Hold",
  closed: "Closed",
};

export type ServiceImprovementCategory = "practice" | "environment" | "workforce" | "childrens_experience" | "multi_agency" | "compliance" | "wellbeing" | "recording";
export const SERVICE_IMPROVEMENT_CATEGORY_LABEL: Record<ServiceImprovementCategory, string> = {
  practice: "Practice",
  environment: "Environment",
  workforce: "Workforce",
  childrens_experience: "Children's experience",
  multi_agency: "Multi-agency",
  compliance: "Compliance",
  wellbeing: "Wellbeing",
  recording: "Recording",
};

export type ServiceImprovementSource = "reg_44_feedback" | "reg_45_review" | "childrens_voice" | "staff_suggestion" | "audit_finding" | "ofsted" | "sector_guidance";
export const SERVICE_IMPROVEMENT_SOURCE_LABEL: Record<ServiceImprovementSource, string> = {
  reg_44_feedback: "Reg 44 feedback",
  reg_45_review: "Reg 45 review",
  childrens_voice: "Children's voice",
  staff_suggestion: "Staff suggestion",
  audit_finding: "Audit finding",
  ofsted: "Ofsted",
  sector_guidance: "Sector guidance",
};

export type ServiceImprovementRagRating = "red" | "amber" | "green";
export const SERVICE_IMPROVEMENT_RAG_RATING_LABEL: Record<ServiceImprovementRagRating, string> = {
  red: "Red",
  amber: "Amber",
  green: "Green",
};

export interface ServiceImprovementMilestone {
  milestone: string;
  target_date: string;
  achieved: boolean;
  achieved_date: string;
}

export interface ServiceImprovementRecord {
  id: string;
  title: string;
  category: ServiceImprovementCategory;
  description: string;
  problem_statement: string;
  expected_outcome: string;
  evidence_base: string;
  source: ServiceImprovementSource;
  start_date: string;
  target_completion_date: string;
  status: ServiceImprovementStatus;
  owner_staff: string;
  contributors: string[];
  key_milestones: ServiceImprovementMilestone[];
  child_involvement: string;
  staff_involvement: string;
  resources_required: string[];
  success_measures: string[];
  early_results: string;
  challenges: string[];
  risk_rag_rating: ServiceImprovementRagRating;
  budget_allocated: number;
  last_review_date: string;
  next_review_date: string;
}

/* ── service-user-agreements ─────────────────────────────────────────────── */

export type ServiceUserAgreementType = "house_rules" | "device_use" | "bedroom_expectations" | "kitchen_use" | "visitor_expectations" | "community_behaviour" | "chores" | "bedtime" | "rewards_framework" | "individual_boundary";
export const SERVICE_USER_AGREEMENT_TYPE_LABEL: Record<ServiceUserAgreementType, string> = {
  house_rules: "House Rules Agreement",
  device_use: "Device & Phone Agreement",
  bedroom_expectations: "Bedroom Standards",
  kitchen_use: "Kitchen Use",
  visitor_expectations: "Visitors & Friends",
  community_behaviour: "Community Behaviour",
  chores: "Chores & Responsibilities",
  bedtime: "Bedtime Agreement",
  rewards_framework: "Rewards Framework",
  individual_boundary: "Individual Boundary Plan",
};

export type ServiceUserAgreementStatus = "active" | "under_review" | "expired" | "draft";
export const SERVICE_USER_AGREEMENT_STATUS_LABEL: Record<ServiceUserAgreementStatus, string> = {
  active: "Active",
  under_review: "Under Review",
  expired: "Expired",
  draft: "Draft",
};

export interface ServiceUserAgreementRule {
  rule: string;
  agreed_by_yp: boolean;
  notes: string;
}

export interface ServiceUserAgreementRecord {
  id: string;
  child_id: string;
  agreement_type: ServiceUserAgreementType;
  status: ServiceUserAgreementStatus;
  created_date: string;
  review_date: string;
  last_reviewed_date: string;
  created_by: string;
  young_person_signed_date: string | null;
  young_person_views: string;
  rules: ServiceUserAgreementRule[];
  consequences: string;
  rewards: string;
  modifications: string;
  social_worker_aware: boolean;
}

/* ── shift-notes ─────────────────────────────────────────────────────────── */

export type ShiftNoteShiftType = "morning" | "afternoon" | "evening" | "night" | "sleep_in";
export const SHIFT_NOTE_SHIFT_TYPE_LABEL: Record<ShiftNoteShiftType, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
  sleep_in: "Sleep-In",
};

export type ShiftNoteChildMood = "great" | "good" | "okay" | "low" | "distressed";
export const SHIFT_NOTE_CHILD_MOOD_LABEL: Record<ShiftNoteChildMood, string> = {
  great: "Great",
  good: "Good",
  okay: "Okay",
  low: "Low",
  distressed: "Distressed",
};

export interface ShiftNoteChildNote {
  child_id: string;
  mood: ShiftNoteChildMood;
  summary: string;
  meals: string;
  medication: boolean;
  concerns: string;
}

export interface ShiftNoteRecord {
  id: string;
  date: string;
  shift: ShiftNoteShiftType;
  start_time: string;
  end_time: string;
  staff_on_duty: string[];
  child_notes: ShiftNoteChildNote[];
  general_notes: string;
  maintenance_issues: string;
  visitors_log: string;
  handover_priorities: string[];
  incidents_ref: string[];
  completed_tasks: string[];
  outstanding_tasks: string[];
  recorded_by: string;
  created_at: string;
}

/* ── siblings-contact-protocol ───────────────────────────────────────────── */

export interface SiblingContactRecentContact {
  date: string;
  type: string;
  observations: string;
  child_mood_after: string;
}

export interface SiblingContactProtocolRecord {
  id: string;
  child_id: string;
  sibling_name: string;
  sibling_placement: string;
  sibling_location: string;
  relationship_pre_oak_house: string;
  current_relationship_quality: string;
  contact_frequency: string;
  contact_types: string[];
  agreed_contact_plan: string;
  child_preferences: string;
  sibling_preferences: string;
  risk_factors_to_contact: string[];
  protective_factors_to_contact: string[];
  supervision_required: boolean;
  supervision_level: string;
  transport_arrangements: string;
  contact_costs_budget: string;
  locations_for_contact: string[];
  favourite_sibling_activities: string[];
  birthday_celebration_plan: string;
  christmas_arrangements: string;
  court_ordered_contact: boolean;
  court_order_terms: string;
  recent_contacts: SiblingContactRecentContact[];
  ongoing_sibling_themes: string[];
  review_date: string;
  reviewed_by: string;
}

/* ── sleep-assessments ─────────────────────────────────────────────────── */

export type SleepAssessmentStatus = "active" | "needs_review" | "improving" | "concern";
export const SLEEP_ASSESSMENT_STATUS_LABEL: Record<SleepAssessmentStatus, string> = {
  active: "Active",
  needs_review: "Needs Review",
  improving: "Improving",
  concern: "Concern",
};

export type SleepAssessmentQuality = "good" | "fair" | "poor";
export const SLEEP_ASSESSMENT_QUALITY_LABEL: Record<SleepAssessmentQuality, string> = {
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

export type SleepAssessmentTrend = "improving" | "stable" | "declining";
export const SLEEP_ASSESSMENT_TREND_LABEL: Record<SleepAssessmentTrend, string> = {
  improving: "Improving",
  stable: "Stable",
  declining: "Declining",
};

export interface SleepAssessmentPattern {
  weekday: { target: string; actual: string };
  weekend: { target: string; actual: string };
}

export interface SleepAssessmentRecord {
  id: string;
  child_id: string;
  assessed_by: string;
  assessment_date: string;
  review_date: string;
  status: SleepAssessmentStatus;
  sleep_patterns: SleepAssessmentPattern;
  average_hours: number;
  sleep_quality: SleepAssessmentQuality;
  settling_time: string;
  night_wakings: number;
  bedtime_routine: string[];
  barriers: string[];
  strategies: string[];
  environmental_factors: string[];
  medications: string | null;
  referrals: string | null;
  impact_on_daytime: string;
  trend: SleepAssessmentTrend;
  notes: string;
}

/* ── sleep-in-log ──────────────────────────────────────────────────────── */

export type SleepInStatus = "completed" | "disturbed" | "abandoned" | "in_progress";
export const SLEEP_IN_STATUS_LABEL: Record<SleepInStatus, string> = {
  completed: "Completed",
  disturbed: "Disturbed",
  abandoned: "Abandoned",
  in_progress: "In Progress",
};

export type SleepInRoomCondition = "clean" | "acceptable" | "needs_attention";
export const SLEEP_IN_ROOM_CONDITION_LABEL: Record<SleepInRoomCondition, string> = {
  clean: "Clean",
  acceptable: "Acceptable",
  needs_attention: "Needs Attention",
};

export interface SleepInDisturbance {
  time: string;
  duration: number;
  reason: string;
  child_id: string | null;
  response_time: number;
  action_taken: string;
  back_to_bed: string;
}

export interface SleepInRecord {
  id: string;
  date: string;
  staff_member: string;
  start_time: string;
  end_time: string;
  room_used: string;
  disturbances: SleepInDisturbance[];
  total_disturbance_minutes: number;
  rest_achieved: boolean;
  handover_notes: string;
  handover_to: string;
  room_condition: SleepInRoomCondition;
  safety_check_completed: boolean;
  alarms_working: boolean;
  issues_reported: string[];
  compensatory_rest: boolean;
  compensatory_rest_date: string | null;
  status: SleepInStatus;
  notes: string;
}

/* ── social-worker-contact ─────────────────────────────────────────────── */

export type SocialWorkerContactType = "phone_call" | "email" | "visit" | "lac_review" | "video_call" | "text" | "unplanned" | "statutory_visit";
export const SOCIAL_WORKER_CONTACT_TYPE_LABEL: Record<SocialWorkerContactType, string> = {
  phone_call: "Phone Call",
  email: "Email",
  visit: "Visit",
  lac_review: "LAC Review",
  video_call: "Video Call",
  text: "Text",
  unplanned: "Unplanned",
  statutory_visit: "Statutory Visit",
};

export type SocialWorkerContactDirection = "incoming" | "outgoing";
export const SOCIAL_WORKER_CONTACT_DIRECTION_LABEL: Record<SocialWorkerContactDirection, string> = {
  incoming: "Incoming",
  outgoing: "Outgoing",
};

export type SocialWorkerContactUrgency = "routine" | "urgent" | "emergency";
export const SOCIAL_WORKER_CONTACT_URGENCY_LABEL: Record<SocialWorkerContactUrgency, string> = {
  routine: "Routine",
  urgent: "Urgent",
  emergency: "Emergency",
};

export type SocialWorkerContactInitiatedBy = "home" | "social_worker" | "other";
export const SOCIAL_WORKER_CONTACT_INITIATED_BY_LABEL: Record<SocialWorkerContactInitiatedBy, string> = {
  home: "Home",
  social_worker: "Social Worker",
  other: "Other",
};

export type SocialWorkerContactActionStatus = "pending" | "completed" | "overdue";
export const SOCIAL_WORKER_CONTACT_ACTION_STATUS_LABEL: Record<SocialWorkerContactActionStatus, string> = {
  pending: "Pending",
  completed: "Completed",
  overdue: "Overdue",
};

export interface SocialWorkerContactActionItem {
  action: string;
  owner: string;
  due_date: string;
  status: SocialWorkerContactActionStatus;
}

export interface SocialWorkerContactRecord {
  id: string;
  child_id: string;
  social_worker_name: string;
  social_worker_team: string;
  social_worker_email: string;
  social_worker_phone: string;
  date: string;
  time: string;
  contact_type: SocialWorkerContactType;
  direction: SocialWorkerContactDirection;
  initiated_by: SocialWorkerContactInitiatedBy;
  staff_member: string;
  purpose: string;
  summary: string;
  key_decisions: string[];
  action_items: SocialWorkerContactActionItem[];
  child_aware: boolean;
  child_views: string;
  follow_up_required: boolean;
  follow_up_date: string | null;
  documents_shared: string[];
  urgency: SocialWorkerContactUrgency;
  outcome: string;
  next_scheduled_contact: string | null;
}

/* ── staff-communication-preferences ───────────────────────────────────── */

export type StaffCommsContactMethod = "face_to_face" | "written" | "phone" | "teams_video";
export const STAFF_COMMS_CONTACT_METHOD_LABEL: Record<StaffCommsContactMethod, string> = {
  face_to_face: "Face-to-face",
  written: "Written",
  phone: "Phone",
  teams_video: "Teams/Video",
};

export type StaffCommsFeedbackStyle = "direct" | "sandwiched" | "written_follow_up";
export const STAFF_COMMS_FEEDBACK_STYLE_LABEL: Record<StaffCommsFeedbackStyle, string> = {
  direct: "Direct",
  sandwiched: "Sandwiched",
  written_follow_up: "Written follow-up",
};

export interface StaffCommunicationPreferenceRecord {
  id: string;
  staff_id: string;
  last_review_date: string;
  preferred_contact_method: StaffCommsContactMethod;
  meeting_preferences: string;
  feedback_style: StaffCommsFeedbackStyle;
  supervision_adjustments: string;
  neurodivergent_needs: string;
  language_needs: string;
  best_time_for_discussions: string;
  stress_indicators: string[];
  de_escalation_preferences: string;
  confidential_notes: string;
  reviewed_by: string;
}

/* ── staff-competency ──────────────────────────────────────────────────── */

export type StaffCompetencyLevel = "competent" | "developing" | "not_assessed" | "expired";
export const STAFF_COMPETENCY_LEVEL_LABEL: Record<StaffCompetencyLevel, string> = {
  competent: "Competent",
  developing: "Developing",
  not_assessed: "Not Assessed",
  expired: "Expired",
};

export interface StaffCompetencyEntry {
  id: string;
  area: string;
  level: StaffCompetencyLevel;
  assessed_date: string | null;
  assessed_by: string | null;
  expiry_date: string | null;
  notes: string;
}

export interface StaffCompetencyRecord {
  id: string;
  staff_id: string;
  staff_name: string;
  role: string;
  entries: StaffCompetencyEntry[];
}

/* ── staff-debrief-log ─────────────────────────────────────────────────── */

export type StaffDebriefType = "post_incident" | "post_restraint" | "post_missing" | "critical_event" | "emotional_support" | "tci_reflection";
export const STAFF_DEBRIEF_TYPE_LABEL: Record<StaffDebriefType, string> = {
  post_incident: "Post-Incident",
  post_restraint: "Post-Restraint",
  post_missing: "Post-Missing",
  critical_event: "Critical Event",
  emotional_support: "Emotional Support",
  tci_reflection: "TCI Reflection",
};

export type StaffDebriefStatus = "completed" | "scheduled" | "overdue" | "declined";
export const STAFF_DEBRIEF_STATUS_LABEL: Record<StaffDebriefStatus, string> = {
  completed: "Completed",
  scheduled: "Scheduled",
  overdue: "Overdue",
  declined: "Declined",
};

export type StaffDebriefEmotionalImpact = "low" | "moderate" | "high" | "significant";
export const STAFF_DEBRIEF_EMOTIONAL_IMPACT_LABEL: Record<StaffDebriefEmotionalImpact, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  significant: "Significant",
};

export interface StaffDebriefRecord {
  id: string;
  date: string;
  type: StaffDebriefType;
  trigger_event: string;
  trigger_date: string;
  staff_involved: string[];
  facilitated_by: string;
  status: StaffDebriefStatus;
  emotional_impact: StaffDebriefEmotionalImpact;
  key_themes: string[];
  what_went_well: string[];
  what_could_improve: string[];
  staff_feelings: string;
  support_offered: string[];
  follow_up_needed: boolean;
  follow_up_details: string | null;
  learning_points: string[];
  confidential: boolean;
  notes: string;
}

// ── staff-disciplinary ───────────────────────────────────────────────────────

export type StaffDisciplinaryCategory = "misconduct" | "gross_misconduct" | "performance" | "attendance" | "policy_breach" | "safeguarding" | "professional_boundaries" | "substance_misuse" | "other";
export const STAFF_DISCIPLINARY_CATEGORY_LABEL: Record<StaffDisciplinaryCategory, string> = {
  misconduct: "Misconduct", gross_misconduct: "Gross Misconduct", performance: "Performance",
  attendance: "Attendance", policy_breach: "Policy Breach", safeguarding: "Safeguarding",
  professional_boundaries: "Professional Boundaries", substance_misuse: "Substance Misuse", other: "Other",
};

export type StaffDisciplinaryStage = "informal_warning" | "investigation" | "first_written" | "final_written" | "dismissal_hearing" | "dismissed" | "resigned" | "no_case" | "appeal";
export const STAFF_DISCIPLINARY_STAGE_LABEL: Record<StaffDisciplinaryStage, string> = {
  informal_warning: "Informal Warning", investigation: "Investigation",
  first_written: "First Written Warning", final_written: "Final Written Warning",
  dismissal_hearing: "Dismissal Hearing", dismissed: "Dismissed",
  resigned: "Resigned", no_case: "No Case to Answer", appeal: "Appeal",
};

export type StaffDisciplinarySeverity = "minor" | "serious" | "gross";
export const STAFF_DISCIPLINARY_SEVERITY_LABEL: Record<StaffDisciplinarySeverity, string> = {
  minor: "Minor", serious: "Serious", gross: "Gross",
};

export type StaffDisciplinaryConfidentiality = "standard" | "restricted" | "highly_restricted";
export const STAFF_DISCIPLINARY_CONFIDENTIALITY_LABEL: Record<StaffDisciplinaryConfidentiality, string> = {
  standard: "Standard", restricted: "Restricted", highly_restricted: "Highly Restricted",
};

export interface StaffDisciplinaryTimelineEntry {
  date: string;
  action: string;
  by: string;
  notes: string;
}

export interface StaffDisciplinaryRecord {
  id: string;
  staff_member: string;
  date_raised: string;
  category: StaffDisciplinaryCategory;
  severity: StaffDisciplinarySeverity;
  stage: StaffDisciplinaryStage;
  allegation: string;
  investigator: string | null;
  investigation_start_date: string | null;
  investigation_end_date: string | null;
  suspended: boolean;
  suspension_date: string | null;
  suspension_review_dates: string[];
  hearing_date: string | null;
  hearing_panel: string[];
  outcome: string;
  sanction_expiry_date: string | null;
  appeal_lodged: boolean;
  appeal_date: string | null;
  appeal_outcome: string;
  timeline: StaffDisciplinaryTimelineEntry[];
  support_offered: string[];
  lado_notified: boolean;
  dbs_referral: boolean;
  ofsted_notified: boolean;
  confidentiality_level: StaffDisciplinaryConfidentiality;
  trade_union_rep: string | null;
  lessons_learned: string;
  notes: string;
}

// ── staff-exit-interviews ────────────────────────────────────────────────────

export type StaffExitInterviewReason = "dismissed" | "resigned_career" | "resigned_personal" | "resigned_workload" | "retired" | "end_of_contract";
export const STAFF_EXIT_INTERVIEW_REASON_LABEL: Record<StaffExitInterviewReason, string> = {
  dismissed: "Dismissed",
  resigned_career: "Resigned — Career Progression",
  resigned_personal: "Resigned — Personal/Relocation",
  resigned_workload: "Resigned — Workload",
  retired: "Retired",
  end_of_contract: "End of Contract",
};

export type StaffExitInterviewStatus = "completed" | "declined" | "pending" | "not_applicable";
export const STAFF_EXIT_INTERVIEW_STATUS_LABEL: Record<StaffExitInterviewStatus, string> = {
  completed: "Completed", declined: "Declined", pending: "Pending", not_applicable: "N/A",
};

export interface StaffExitInterviewRecord {
  id: string;
  staff_name: string;
  reason: StaffExitInterviewReason;
  interview_date: string;
  interviewer: string;
  status: StaffExitInterviewStatus;
  overall_rating: number | null;
  positives: string[];
  improvements: string[];
  would_recommend: boolean | null;
  themes: string[];
  notes: string;
  confidential: boolean;
}

// ── staff-grievances ─────────────────────────────────────────────────────────

export type StaffGrievanceCategory = "working_conditions" | "bullying_harassment" | "pay_benefits" | "workload" | "management" | "discrimination" | "health_safety" | "policy_procedure" | "interpersonal" | "other";
export const STAFF_GRIEVANCE_CATEGORY_LABEL: Record<StaffGrievanceCategory, string> = {
  working_conditions: "Working Conditions", bullying_harassment: "Bullying & Harassment",
  pay_benefits: "Pay & Benefits", workload: "Workload", management: "Management",
  discrimination: "Discrimination", health_safety: "Health & Safety",
  policy_procedure: "Policy & Procedure", interpersonal: "Interpersonal", other: "Other",
};

export type StaffGrievanceStatus = "informal_raised" | "formal_submitted" | "under_investigation" | "hearing_scheduled" | "resolved" | "appealed" | "withdrawn";
export const STAFF_GRIEVANCE_STATUS_LABEL: Record<StaffGrievanceStatus, string> = {
  informal_raised: "Informal Raised", formal_submitted: "Formal Submitted",
  under_investigation: "Under Investigation", hearing_scheduled: "Hearing Scheduled",
  resolved: "Resolved", appealed: "Appealed", withdrawn: "Withdrawn",
};

export type StaffGrievanceSeverity = "low" | "medium" | "high" | "critical";
export const STAFF_GRIEVANCE_SEVERITY_LABEL: Record<StaffGrievanceSeverity, string> = {
  low: "Low", medium: "Medium", high: "High", critical: "Critical",
};

export type StaffGrievanceConfidentiality = "standard" | "restricted" | "highly_restricted";
export const STAFF_GRIEVANCE_CONFIDENTIALITY_LABEL: Record<StaffGrievanceConfidentiality, string> = {
  standard: "Standard", restricted: "Restricted", highly_restricted: "Highly Restricted",
};

export interface StaffGrievanceTimelineEntry {
  date: string;
  action: string;
  by: string;
  notes: string;
}

export interface StaffGrievanceRecord {
  id: string;
  raised_by: string;
  raised_date: string;
  category: StaffGrievanceCategory;
  severity: StaffGrievanceSeverity;
  status: StaffGrievanceStatus;
  subject: string;
  description: string;
  against_whom: string | null;
  informal_resolution_attempted: boolean;
  informal_outcome: string;
  formal_submission_date: string | null;
  investigator: string | null;
  hearing_date: string | null;
  hearing_panel: string[];
  outcome: string;
  appeal_lodged: boolean;
  appeal_date: string | null;
  appeal_outcome: string;
  timeline: StaffGrievanceTimelineEntry[];
  support_offered: string[];
  confidentiality_level: StaffGrievanceConfidentiality;
  trade_union_rep: string | null;
  lessons_learned: string;
  notes: string;
}

// ── staff-handbook-acknowledgements ──────────────────────────────────────────

export type StaffHandbookDocumentCategory = "handbook" | "policy" | "procedure" | "briefing" | "training";
export const STAFF_HANDBOOK_DOCUMENT_CATEGORY_LABEL: Record<StaffHandbookDocumentCategory, string> = {
  handbook: "Handbook", policy: "Policy", procedure: "Procedure", briefing: "Briefing", training: "Training",
};

export interface StaffHandbookAcknowledgement {
  staff_id: string;
  acknowledged_date: string | null;
}

export interface StaffHandbookAcknowledgementRecord {
  id: string;
  title: string;
  version: string | null;
  issued_date: string;
  required_by: string;
  issued_by: string;
  category: StaffHandbookDocumentCategory;
  acknowledgements: StaffHandbookAcknowledgement[];
  notes: string;
}

// ── staff-induction ──────────────────────────────────────────────────────────

export type StaffInductionTaskStatus = "not_started" | "in_progress" | "completed" | "overdue";
export const STAFF_INDUCTION_TASK_STATUS_LABEL: Record<StaffInductionTaskStatus, string> = {
  not_started: "Not Started", in_progress: "In Progress", completed: "Completed", overdue: "Overdue",
};

export type StaffInductionPhase = "pre_start" | "week_1" | "month_1" | "month_3" | "month_6" | "ongoing";
export const STAFF_INDUCTION_PHASE_LABEL: Record<StaffInductionPhase, string> = {
  pre_start: "Pre-Start", week_1: "Week 1", month_1: "Month 1",
  month_3: "Month 3", month_6: "Month 6", ongoing: "Ongoing",
};

export type StaffInductionOverallStatus = "in_progress" | "completed" | "overdue";
export const STAFF_INDUCTION_OVERALL_STATUS_LABEL: Record<StaffInductionOverallStatus, string> = {
  in_progress: "In Progress", completed: "Completed", overdue: "Overdue",
};

export interface StaffInductionTask {
  id: string;
  task: string;
  phase: StaffInductionPhase;
  status: StaffInductionTaskStatus;
  completed_date: string | null;
  completed_by: string | null;
  due_date: string;
  evidence: string;
  notes: string;
}

export interface StaffInductionRecord {
  id: string;
  staff_id: string;
  staff_name: string;
  role: string;
  start_date: string;
  induction_lead: string;
  overall_status: StaffInductionOverallStatus;
  tasks: StaffInductionTask[];
}

/* ── staff-meetings ──────────────────────────────────────────────────────── */

export type StaffMeetingType = "team_meeting" | "management" | "clinical" | "safeguarding" | "training_debrief" | "ad_hoc";

export const STAFF_MEETING_TYPE_LABEL: Record<StaffMeetingType, string> = {
  team_meeting: "Team Meeting",
  management: "Management",
  clinical: "Clinical / Formulation",
  safeguarding: "Safeguarding",
  training_debrief: "Training Debrief",
  ad_hoc: "Ad Hoc",
};

export interface StaffMeetingAction {
  action: string;
  owner: string;
  due_date: string;
  completed: boolean;
}

export interface StaffMeetingAgendaItem {
  topic: string;
  discussion: string;
  outcome: string;
}

export interface StaffMeetingRecord {
  id: string;
  date: string;
  type: StaffMeetingType;
  title: string;
  chair: string;
  attendees: string[];
  apologies: string[];
  agenda_items: StaffMeetingAgendaItem[];
  actions_from_previous: StaffMeetingAction[];
  new_actions: StaffMeetingAction[];
  general_notes: string;
  next_meeting_date: string;
  duration: number;
  recorded_by: string;
  created_at: string;
}

/* ── staff-recognition-log ───────────────────────────────────────────────── */

export type StaffRecognitionType =
  | "above_and_beyond"
  | "quiet_excellence"
  | "team_contribution"
  | "child_recognised"
  | "anniversary_milestone"
  | "qualification_achieved"
  | "wellbeing_leadership"
  | "innovation"
  | "cultural_awareness";

export const STAFF_RECOGNITION_TYPE_LABEL: Record<StaffRecognitionType, string> = {
  above_and_beyond: "Above and Beyond",
  quiet_excellence: "Quiet Excellence",
  team_contribution: "Team Contribution",
  child_recognised: "Child-Recognised",
  anniversary_milestone: "Anniversary Milestone",
  qualification_achieved: "Qualification Achieved",
  wellbeing_leadership: "Wellbeing Leadership",
  innovation: "Innovation",
  cultural_awareness: "Cultural Awareness",
};

export type StaffRecognitionRecognisedBy =
  | "registered_manager"
  | "deputy"
  | "peer"
  | "child"
  | "parent"
  | "external_professional"
  | "whole_team";

export const STAFF_RECOGNITION_RECOGNISED_BY_LABEL: Record<StaffRecognitionRecognisedBy, string> = {
  registered_manager: "Registered Manager",
  deputy: "Deputy",
  peer: "Peer",
  child: "Child",
  parent: "Parent",
  external_professional: "External Professional",
  whole_team: "Whole Team",
};

export type StaffRecognitionWayMarked =
  | "verbal_recognition"
  | "card_handwritten_note"
  | "team_meeting_share"
  | "wall_of_awesome"
  | "newsletter_mention"
  | "voucher_token"
  | "time_off_in_lieu"
  | "bonus";

export const STAFF_RECOGNITION_WAY_MARKED_LABEL: Record<StaffRecognitionWayMarked, string> = {
  verbal_recognition: "Verbal Recognition",
  card_handwritten_note: "Card / Handwritten Note",
  team_meeting_share: "Team Meeting Share",
  wall_of_awesome: "Wall of Awesome",
  newsletter_mention: "Newsletter Mention",
  voucher_token: "Voucher / Token",
  time_off_in_lieu: "Time Off in Lieu",
  bonus: "Bonus",
};

export interface StaffRecognitionRecord {
  id: string;
  date: string;
  staff_member: string;
  recognition_type: StaffRecognitionType;
  recognised_by: StaffRecognitionRecognisedBy;
  recognised_by_name: string;
  what_happened: string;
  impact_description: string;
  child_impact: string;
  organisational_impact: string;
  way_marked: StaffRecognitionWayMarked[];
  monetary_value: number;
  public_celebration: boolean;
  child_contributed_nomination: boolean;
  staff_response: string;
  reflection_from_manager: string;
}

/* ── staff-reflections ───────────────────────────────────────────────────── */

export type StaffReflectionType =
  | "daily"
  | "incident"
  | "training"
  | "supervision"
  | "personal_development"
  | "critical_event"
  | "positive_practice";

export const STAFF_REFLECTION_TYPE_LABEL: Record<StaffReflectionType, string> = {
  daily: "Daily Reflection",
  incident: "Incident Reflection",
  training: "Training Reflection",
  supervision: "Post-Supervision",
  personal_development: "Personal Development",
  critical_event: "Critical Event",
  positive_practice: "Positive Practice",
};

export type StaffReflectionMood = "positive" | "neutral" | "challenging" | "difficult";

export const STAFF_REFLECTION_MOOD_LABEL: Record<StaffReflectionMood, string> = {
  positive: "Positive",
  neutral: "Neutral",
  challenging: "Challenging",
  difficult: "Difficult",
};

export interface StaffReflectionRecord {
  id: string;
  staff_id: string;
  date: string;
  type: StaffReflectionType;
  mood: StaffReflectionMood;
  title: string;
  what_happened: string;
  what_i_felt: string;
  what_i_learned: string;
  what_i_would_do_differently: string;
  linked_to_yp: string[];
  linked_incident: string | null;
  shared_with_manager: boolean;
  manager_feedback: string;
  development_goal: string;
  is_private: boolean;
}

/* ── staff-safer-caring ──────────────────────────────────────────────────── */

export type StaffSaferCaringPlanStatus = "current" | "review_due";

export const STAFF_SAFER_CARING_PLAN_STATUS_LABEL: Record<StaffSaferCaringPlanStatus, string> = {
  current: "Current",
  review_due: "Review Due",
};

export interface StaffSaferCaringAcknowledgement {
  signed_date: string;
  witnessed_by: string;
}

export interface StaffSaferCaringRecord {
  id: string;
  staff_id: string;
  role: string;
  signed_date: string;
  review_date: string;
  status: StaffSaferCaringPlanStatus;
  physical_contact_guidance: string;
  professional_boundaries: string[];
  social_media_rules: string;
  lone_working_protocol: string;
  gift_giving: string;
  transport: string;
  personal_information: string;
  child_specific_considerations: Record<string, string>;
  acknowledgements: StaffSaferCaringAcknowledgement;
}

/* ── staff-shadowing-log ─────────────────────────────────────────────────── */

export type StaffShadowingShiftType =
  | "early"
  | "late"
  | "long_day"
  | "sleep_in"
  | "wake_night"
  | "weekend";

export const STAFF_SHADOWING_SHIFT_TYPE_LABEL: Record<StaffShadowingShiftType, string> = {
  early: "Early",
  late: "Late",
  long_day: "Long Day",
  sleep_in: "Sleep-in",
  wake_night: "Wake-night",
  weekend: "Weekend",
};

export type StaffShadowingReadyStatus = "yes" | "not_yet" | "additional_shadows_needed";

export const STAFF_SHADOWING_READY_STATUS_LABEL: Record<StaffShadowingReadyStatus, string> = {
  yes: "Yes",
  not_yet: "Not Yet",
  additional_shadows_needed: "Additional Shadows Needed",
};

export interface StaffShadowingRecord {
  id: string;
  new_staff: string;
  new_staff_role: string;
  shadowed_by: string;
  date: string;
  shift_type: StaffShadowingShiftType;
  hours_shadowed: number;
  shadow_number: number;
  total_shadows_required: number;
  areas_observed: string[];
  competencies_demonstrated: string[];
  competencies_developing: string[];
  observer_feedback: string;
  new_staff_reflection: string;
  signed_off: boolean;
  ready_to_work_solo: StaffShadowingReadyStatus;
  follow_up_actions: string[];
  recorded_by: string;
}

/* ── staff-sickness ──────────────────────────────────────────────────────── */

export type StaffSicknessCategory = "short_term" | "long_term" | "intermittent" | "work_related";

export const STAFF_SICKNESS_CATEGORY_LABEL: Record<StaffSicknessCategory, string> = {
  short_term: "Short-Term (≤7 days)",
  long_term: "Long-Term (>7 days)",
  intermittent: "Intermittent",
  work_related: "Work-Related",
};

export type StaffSicknessAbsenceReason =
  | "cold_flu"
  | "gastro"
  | "covid"
  | "mental_health"
  | "musculoskeletal"
  | "surgery"
  | "family_emergency"
  | "injury"
  | "migraine"
  | "other";

export const STAFF_SICKNESS_ABSENCE_REASON_LABEL: Record<StaffSicknessAbsenceReason, string> = {
  cold_flu: "Cold / Flu",
  gastro: "Gastroenteritis",
  covid: "COVID-19",
  mental_health: "Mental Health",
  musculoskeletal: "Musculoskeletal",
  surgery: "Surgery/Procedure",
  family_emergency: "Family Emergency",
  injury: "Injury",
  migraine: "Migraine/Headache",
  other: "Other",
};

export type StaffSicknessRTWStatus = "not_required" | "scheduled" | "completed" | "overdue";

export const STAFF_SICKNESS_RTW_STATUS_LABEL: Record<StaffSicknessRTWStatus, string> = {
  not_required: "Not Required",
  scheduled: "Scheduled",
  completed: "Completed",
  overdue: "Overdue",
};

export interface StaffSicknessRecord {
  id: string;
  staff_id: string;
  date_started: string;
  date_ended: string | null;
  total_days: number;
  category: StaffSicknessCategory;
  reason: StaffSicknessAbsenceReason;
  reason_detail: string;
  self_certified: boolean;
  fit_note: boolean;
  fit_note_expiry: string | null;
  cover_arrangements: string;
  rtw_status: StaffSicknessRTWStatus;
  rtw_date: string | null;
  rtw_conducted_by_id: string | null;
  rtw_outcome: string;
  occupational_health_referral: boolean;
  trigger_points: string[];
  manager_notes: string;
}

/* ── staff-supervision-themes ────────────────────────────────────────────── */

export type StaffSupervisionThemeArea =
  | "practice"
  | "wellbeing"
  | "training"
  | "communication"
  | "workload"
  | "safeguarding"
  | "reflective";

export const STAFF_SUPERVISION_THEME_AREA_LABEL: Record<StaffSupervisionThemeArea, string> = {
  practice: "Practice",
  wellbeing: "Wellbeing",
  training: "Training",
  communication: "Communication",
  workload: "Workload",
  safeguarding: "Safeguarding",
  reflective: "Reflective",
};

export type StaffSupervisionThemeStatus = "emerging" | "active" | "addressed" | "monitoring";

export const STAFF_SUPERVISION_THEME_STATUS_LABEL: Record<StaffSupervisionThemeStatus, string> = {
  emerging: "Emerging",
  active: "Active",
  addressed: "Addressed",
  monitoring: "Monitoring",
};

export interface StaffSupervisionThemeRecord {
  id: string;
  identified_date: string;
  theme_area: StaffSupervisionThemeArea;
  theme_title: string;
  frequency_across_team: number;
  staff_affected: string[];
  description: string;
  root_cause_analysis: string;
  organisational_response: string[];
  training_implications: string[];
  policy_implications: string[];
  status: StaffSupervisionThemeStatus;
  reviewed_by: string;
  next_review_date: string;
  anonymous: boolean;
}

/* ── staff-wellbeing ─────────────────────────────────────────────────────── */

export type StaffWellbeingCheckType =
  | "monthly_checkin"
  | "post_incident"
  | "supervision_wellbeing"
  | "return_from_absence"
  | "self_referral"
  | "manager_concern";

export const STAFF_WELLBEING_CHECK_TYPE_LABEL: Record<StaffWellbeingCheckType, string> = {
  monthly_checkin: "Monthly Check-in",
  post_incident: "Post-Incident",
  supervision_wellbeing: "Supervision Wellbeing",
  return_from_absence: "Return from Absence",
  self_referral: "Self-Referral",
  manager_concern: "Manager Concern",
};

export interface StaffWellbeingRecord {
  id: string;
  staff_id: string;
  date: string;
  type: StaffWellbeingCheckType;
  overall_score: number;
  workload_score: number;
  support_score: number;
  moral_score: number;
  stressors: string[];
  positives: string[];
  support_needed: string;
  action_agreed: string;
  follow_up_date: string | null;
  conducted_by: string;
  confidential: boolean;
  notes: string;
}

/* ── stakeholder-feedback ────────────────────────────────────────────────── */

export type StakeholderFeedbackSource =
  | "young_person"
  | "parent_carer"
  | "social_worker"
  | "irp"
  | "school"
  | "health_professional"
  | "advocate"
  | "neighbour"
  | "other";

export const STAKEHOLDER_FEEDBACK_SOURCE_LABEL: Record<StakeholderFeedbackSource, string> = {
  young_person: "Young Person",
  parent_carer: "Parent / Carer",
  social_worker: "Social Worker",
  irp: "Independent Reviewing Officer",
  school: "School / College",
  health_professional: "Health Professional",
  advocate: "Advocate",
  neighbour: "Neighbour / Community",
  other: "Other",
};

export type StakeholderFeedbackSentiment = "positive" | "mixed" | "negative";

export const STAKEHOLDER_FEEDBACK_SENTIMENT_LABEL: Record<StakeholderFeedbackSentiment, string> = {
  positive: "Positive",
  mixed: "Mixed",
  negative: "Negative",
};

export type StakeholderFeedbackMethod =
  | "survey"
  | "conversation"
  | "letter"
  | "email"
  | "phone"
  | "meeting"
  | "reg44_visit";

export const STAKEHOLDER_FEEDBACK_METHOD_LABEL: Record<StakeholderFeedbackMethod, string> = {
  survey: "Survey",
  conversation: "Conversation",
  letter: "Letter",
  email: "Email",
  phone: "Phone Call",
  meeting: "Meeting",
  reg44_visit: "Reg 44 Visit",
};

export type StakeholderFeedbackTheme =
  | "safety"
  | "relationships"
  | "communication"
  | "activities"
  | "food"
  | "environment"
  | "education"
  | "health"
  | "contact"
  | "complaints"
  | "praise"
  | "suggestions";

export const STAKEHOLDER_FEEDBACK_THEME_LABEL: Record<StakeholderFeedbackTheme, string> = {
  safety: "Safety",
  relationships: "Relationships",
  communication: "Communication",
  activities: "Activities",
  food: "Food & Meals",
  environment: "Environment",
  education: "Education",
  health: "Health",
  contact: "Contact Arrangements",
  complaints: "Complaints",
  praise: "Praise",
  suggestions: "Suggestions",
};

export interface StakeholderFeedbackRecord {
  id: string;
  date: string;
  source: StakeholderFeedbackSource;
  source_name: string;
  related_yp: string | null;
  method: StakeholderFeedbackMethod;
  sentiment: StakeholderFeedbackSentiment;
  themes: StakeholderFeedbackTheme[];
  summary: string;
  direct_quote: string | null;
  action_taken: string | null;
  responded_by: string;
  response_date: string | null;
  acknowledged: boolean;
}

/* ── statutory-checks-summary ────────────────────────────────────────────── */

export type StatutoryCheckComplianceStatus = "compliant" | "due_soon" | "overdue" | "in_progress";

export const STATUTORY_CHECK_COMPLIANCE_STATUS_LABEL: Record<StatutoryCheckComplianceStatus, string> = {
  compliant: "Compliant",
  due_soon: "Due Soon",
  overdue: "Overdue",
  in_progress: "In Progress",
};

export type StatutoryCheckCategory = "per_child" | "home_wide" | "workforce" | "environmental" | "financial";

export const STATUTORY_CHECK_CATEGORY_LABEL: Record<StatutoryCheckCategory, string> = {
  per_child: "Per-child",
  home_wide: "Home-wide",
  workforce: "Workforce",
  environmental: "Environmental",
  financial: "Financial",
};

export type StatutoryCheckFrequency =
  | "monthly"
  | "quarterly"
  | "six_monthly"
  | "annual"
  | "bi_annual"
  | "per_child_per_year";

export const STATUTORY_CHECK_FREQUENCY_LABEL: Record<StatutoryCheckFrequency, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  six_monthly: "Six-monthly",
  annual: "Annual",
  bi_annual: "Bi-annual",
  per_child_per_year: "Per Child Per Year",
};

export interface StatutoryCheckRecord {
  id: string;
  check_name: string;
  regulatory_basis: string;
  category: StatutoryCheckCategory;
  frequency: StatutoryCheckFrequency;
  last_completed_date: string;
  next_due_date: string;
  compliance_status: StatutoryCheckComplianceStatus;
  responsible_owner: string;
  evidence_location: string;
  children_covered: string;
  external_reviewer: string;
  summary: string;
  recent_observation: string;
  escalation_criteria: string;
}

/* ── statutory-visit-log ─────────────────────────────────────────────────── */

export type StatutoryVisitType =
  | "first_visit"
  | "first_6_week_review"
  | "routine_6_weekly"
  | "quarterly"
  | "six_monthly"
  | "pre_lac_review"
  | "unannounced";

export const STATUTORY_VISIT_TYPE_LABEL: Record<StatutoryVisitType, string> = {
  first_visit: "First Visit (within 7 days)",
  first_6_week_review: "First 6-week Review",
  routine_6_weekly: "Routine 6-weekly",
  quarterly: "Quarterly",
  six_monthly: "Six-monthly",
  pre_lac_review: "Pre-LAC Review",
  unannounced: "Unannounced",
};

export type StatutoryVisitChildPresented = "settled" | "anxious" | "withdrawn" | "engaged" | "distressed";

export const STATUTORY_VISIT_CHILD_PRESENTED_LABEL: Record<StatutoryVisitChildPresented, string> = {
  settled: "Settled",
  anxious: "Anxious",
  withdrawn: "Withdrawn",
  engaged: "Engaged",
  distressed: "Distressed",
};

export interface StatutoryVisitActionAgreed {
  action: string;
  owner: string;
  deadline: string;
}

export interface StatutoryVisitRecord {
  id: string;
  child_id: string;
  date: string;
  visit_type: StatutoryVisitType;
  social_worker: string;
  local_authority: string;
  duration_minutes: number;
  saw_child_alone: boolean;
  alone_time: number;
  child_wishes_shared: string;
  home_staff_present: string[];
  areas_inspected: string[];
  bedrooms_seen: boolean;
  records_reviewed: string[];
  child_presented: StatutoryVisitChildPresented;
  key_discussions: string[];
  social_worker_observations: string;
  actions_agreed: StatutoryVisitActionAgreed[];
  next_visit_due: string;
  report_filed_date: string;
  within_timeframe: boolean;
}

/* ── subject-access-requests ─────────────────────────────────────────────── */

export type SubjectAccessRequestType =
  | "subject_access"
  | "right_to_erasure"
  | "data_portability"
  | "rectification"
  | "restriction"
  | "objection";

export const SUBJECT_ACCESS_REQUEST_TYPE_LABEL: Record<SubjectAccessRequestType, string> = {
  subject_access: "Subject Access Request (SAR)",
  right_to_erasure: "Right to Erasure",
  data_portability: "Data Portability",
  rectification: "Rectification",
  restriction: "Restriction of Processing",
  objection: "Right to Object",
};

export type SubjectAccessRequestStatus =
  | "received"
  | "identity_verified"
  | "in_progress"
  | "redaction"
  | "completed"
  | "refused"
  | "extended";

export const SUBJECT_ACCESS_REQUEST_STATUS_LABEL: Record<SubjectAccessRequestStatus, string> = {
  received: "Received",
  identity_verified: "Identity Verified",
  in_progress: "In Progress",
  redaction: "Redaction Review",
  completed: "Completed",
  refused: "Refused",
  extended: "Extended",
};

export type SubjectAccessRequesterType =
  | "care_leaver"
  | "parent"
  | "social_worker"
  | "young_person"
  | "staff"
  | "solicitor"
  | "other";

export const SUBJECT_ACCESS_REQUESTER_TYPE_LABEL: Record<SubjectAccessRequesterType, string> = {
  care_leaver: "Care Leaver",
  parent: "Parent",
  social_worker: "Social Worker",
  young_person: "Young Person",
  staff: "Staff",
  solicitor: "Solicitor",
  other: "Other",
};

export interface SubjectAccessRequestRecord {
  id: string;
  date_received: string;
  deadline_date: string;
  request_type: SubjectAccessRequestType;
  requester_name: string;
  requester_type: SubjectAccessRequesterType;
  requester_relation: string;
  data_subject_id: string | null;
  data_subject_type: "child" | "staff";
  status: SubjectAccessRequestStatus;
  identity_verified: boolean;
  identity_method: string;
  data_scope: string[];
  redactions_required: boolean;
  redaction_categories: string[];
  third_party_consent: boolean;
  extension_applied: boolean;
  extension_reason: string;
  date_completed: string | null;
  response_method: string;
  handled_by_id: string;
  dpo_consulted: boolean;
  notes: string;
}

// ── Supervision Matrix ──────────────────────────────────────────────────────
export type SupervisionMatrixStatus = "current" | "due_soon" | "overdue";
export const SUPERVISION_MATRIX_STATUS_LABEL: Record<SupervisionMatrixStatus, string> = { current: "Current", due_soon: "Due Soon", overdue: "Overdue" };
export interface SupervisionMatrixRecord {
  id: string;
  supervisee_id: string;
  supervisor_id: string;
  frequency: string;
  last_supervision_date: string;
  next_supervision_date: string;
  status: SupervisionMatrixStatus;
  sessions_this_year: number;
  notes: string;
}

// ── Supervision Tracker ─────────────────────────────────────────────────────
export type SupervisionTrackerComplianceStatus = "compliant" | "due_soon" | "overdue" | "significantly_overdue";
export const SUPERVISION_TRACKER_COMPLIANCE_STATUS_LABEL: Record<SupervisionTrackerComplianceStatus, string> = { compliant: "Compliant", due_soon: "Due Soon (≤7d)", overdue: "Overdue", significantly_overdue: "Significantly Overdue (>30d)" };
export interface SupervisionTrackerRecord {
  id: string;
  staff_id: string;
  last_supervision_date: string;
  next_due_date: string;
  supervisor_id: string;
  frequency: string;
  sessions_this_year: number;
  sessions_expected_this_year: number;
  cancelled_by_staff: number;
  cancelled_by_manager: number;
  themes: string[];
  actions_pending: number;
  notes: string;
}

// ── Therapeutic Input ───────────────────────────────────────────────────────
export type TherapeuticInputTherapyType = "camhs" | "play_therapy" | "counselling" | "art_therapy" | "cbt" | "emdr" | "family_therapy" | "speech_language" | "occupational" | "psychotherapy";
export const THERAPEUTIC_INPUT_THERAPY_TYPE_LABEL: Record<TherapeuticInputTherapyType, string> = { camhs: "CAMHS", play_therapy: "Play Therapy", counselling: "Counselling", art_therapy: "Art Therapy", cbt: "CBT", emdr: "EMDR", family_therapy: "Family Therapy", speech_language: "Speech & Language", occupational: "Occupational Therapy", psychotherapy: "Psychotherapy" };
export type TherapeuticInputReferralStatus = "pending" | "accepted" | "active" | "on_hold" | "completed" | "discharged" | "declined";
export const THERAPEUTIC_INPUT_REFERRAL_STATUS_LABEL: Record<TherapeuticInputReferralStatus, string> = { pending: "Pending", accepted: "Accepted", active: "Active", on_hold: "On Hold", completed: "Completed", discharged: "Discharged", declined: "Declined" };
export type TherapeuticInputEngagement = "excellent" | "good" | "variable" | "reluctant" | "disengaged";
export const THERAPEUTIC_INPUT_ENGAGEMENT_LABEL: Record<TherapeuticInputEngagement, string> = { excellent: "Excellent", good: "Good", variable: "Variable", reluctant: "Reluctant", disengaged: "Disengaged" };
export interface TherapeuticInputSession {
  date: string;
  attended: boolean;
  summary: string;
  engagement: TherapeuticInputEngagement;
  home_actions: string[];
}
export interface TherapeuticInputRecord {
  id: string;
  child_id: string;
  therapy_type: TherapeuticInputTherapyType;
  provider: string;
  therapist: string;
  referral_date: string;
  start_date: string | null;
  frequency: string;
  status: TherapeuticInputReferralStatus;
  referral_reason: string;
  goals: string[];
  recent_sessions: TherapeuticInputSession[];
  waiting_weeks: number | null;
  home_key_worker: string;
  consent: string;
  next_appointment: string | null;
  review_date: string | null;
  progress_notes: string;
}

// ── Transition Planning ─────────────────────────────────────────────────────
export type TransitionPlanningArea = "independent_living" | "education_employment" | "financial" | "health_wellbeing" | "housing" | "relationships" | "legal_rights" | "identity";
export const TRANSITION_PLANNING_AREA_LABEL: Record<TransitionPlanningArea, string> = { independent_living: "Independent Living", education_employment: "Education & Employment", financial: "Financial Capability", health_wellbeing: "Health & Wellbeing", housing: "Housing", relationships: "Relationships & Networks", legal_rights: "Legal Rights & Entitlements", identity: "Identity & Culture" };
export type TransitionPlanningGoalStatus = "not_started" | "in_progress" | "on_track" | "at_risk" | "achieved" | "paused";
export const TRANSITION_PLANNING_GOAL_STATUS_LABEL: Record<TransitionPlanningGoalStatus, string> = { not_started: "Not Started", in_progress: "In Progress", on_track: "On Track", at_risk: "At Risk", achieved: "Achieved", paused: "Paused" };
export interface TransitionPlanningRecord {
  id: string;
  child_id: string;
  area: TransitionPlanningArea;
  goal: string;
  description: string;
  status: TransitionPlanningGoalStatus;
  target_date: string;
  start_date: string;
  key_worker: string;
  actions: string[];
  progress: string;
  percent_complete: number;
  review_date: string;
  notes: string;
  created_at: string;
}

// ── Transport Log ───────────────────────────────────────────────────────────
export type TransportLogPurpose = "school_run" | "appointment" | "contact_visit" | "activity" | "emergency" | "respite_transport" | "court" | "other";
export const TRANSPORT_LOG_PURPOSE_LABEL: Record<TransportLogPurpose, string> = { school_run: "School Run", appointment: "Appointment", contact_visit: "Contact Visit", activity: "Activity", emergency: "Emergency", respite_transport: "Respite Transport", court: "Court", other: "Other" };
export type TransportLogBehaviour = "calm" | "unsettled" | "distressed" | "aggressive" | "mixed";
export const TRANSPORT_LOG_BEHAVIOUR_LABEL: Record<TransportLogBehaviour, string> = { calm: "Calm", unsettled: "Unsettled", distressed: "Distressed", aggressive: "Aggressive", mixed: "Mixed" };
export type TransportLogStatus = "completed" | "in_progress" | "cancelled" | "incident_reported";
export const TRANSPORT_LOG_STATUS_LABEL: Record<TransportLogStatus, string> = { completed: "Completed", in_progress: "In Progress", cancelled: "Cancelled", incident_reported: "Incident Reported" };
export interface TransportLogPassenger {
  young_person_id: string;
  seatbelt_worn: boolean;
  booster_seat: boolean;
}
export interface TransportLogRecord {
  id: string;
  date: string;
  driver: string;
  driver_licence_checked: boolean;
  vehicle: string;
  vehicle_checked: boolean;
  passengers: TransportLogPassenger[];
  additional_staff: string[];
  purpose: TransportLogPurpose;
  destination: string;
  departure_time: string;
  arrival_time: string;
  return_time: string | null;
  mileage_start: number;
  mileage_end: number;
  route_taken: string;
  incident_during_journey: boolean;
  incident_details: string | null;
  behaviour_during_journey: TransportLogBehaviour;
  behaviour_notes: string;
  fuel_added: boolean;
  fuel_amount: number | null;
  fuel_cost: number | null;
  notes: string;
  status: TransportLogStatus;
}

// ── Unannounced Visits ──────────────────────────────────────────────────────
export type UnannouncedVisitType = "ri_monitoring" | "management_spot_check" | "external_professional" | "ofsted";
export const UNANNOUNCED_VISIT_TYPE_LABEL: Record<UnannouncedVisitType, string> = { ri_monitoring: "RI Monitoring", management_spot_check: "Management Spot Check", external_professional: "External Professional", ofsted: "Ofsted" };
export type UnannouncedVisitOverallAssessment = "good" | "requires_attention" | "immediate_action_needed";
export const UNANNOUNCED_VISIT_OVERALL_ASSESSMENT_LABEL: Record<UnannouncedVisitOverallAssessment, string> = { good: "Good", requires_attention: "Requires Attention", immediate_action_needed: "Immediate Action Needed" };
export interface UnannouncedVisitActionRequired {
  description: string;
  owner: string;
  deadline: string;
}
export interface UnannouncedVisitRecord {
  id: string;
  date: string;
  time_of_visit: string;
  visit_type: UnannouncedVisitType;
  visitor: string;
  areas_inspected: string[];
  children_spoken_to: string[];
  staff_on_duty: string[];
  findings: string;
  positive_observations: string[];
  concerns: string[];
  actions_required: UnannouncedVisitActionRequired[];
  overall_assessment: UnannouncedVisitOverallAssessment;
  follow_up_date: string;
}

// ── Utility Monitoring ──────────────────────────────────────────────────────
export type UtilityMonitoringType = "electricity" | "gas" | "water" | "broadband";
export const UTILITY_MONITORING_TYPE_LABEL: Record<UtilityMonitoringType, string> = { electricity: "Electricity", gas: "Gas", water: "Water", broadband: "Broadband" };
export interface UtilityMonitoringRecord {
  id: string;
  utility_type: UtilityMonitoringType;
  period: string;
  meter_reading: number;
  previous_reading: number;
  usage: number;
  unit: string;
  cost: number;
  budget_allocation: number;
  variance: number;
  supplier: string;
  contract_end: string;
  notes: string;
}

// ── Visitors Feedback ───────────────────────────────────────────────────────
export type VisitorsFeedbackRole = "reg44" | "social_worker" | "family" | "professional" | "iro" | "other";
export const VISITORS_FEEDBACK_ROLE_LABEL: Record<VisitorsFeedbackRole, string> = { reg44: "Reg 44 Visitor", social_worker: "Social Worker", family: "Family Member", professional: "Professional", iro: "IRO", other: "Other Visitor" };
export interface VisitorsFeedbackRecord {
  id: string;
  visitor_name: string;
  visitor_role: VisitorsFeedbackRole;
  visit_date: string;
  rating: number;
  positives: string[];
  concerns: string[];
  suggestions: string[];
  action_taken: string | null;
  responded_by: string | null;
  child_related: string | null;
  notes: string;
}

// ── Water Hygiene ───────────────────────────────────────────────────────────
export type WaterHygieneCheckType = "hot_temp" | "cold_temp" | "tmv_check" | "flush" | "showerhead_clean" | "tank_inspection" | "legionella_sample" | "dead_leg_flush" | "calorifier_check";
export const WATER_HYGIENE_CHECK_TYPE_LABEL: Record<WaterHygieneCheckType, string> = { hot_temp: "Hot Water Temperature", cold_temp: "Cold Water Temperature", tmv_check: "TMV Check", flush: "Outlet Flush", showerhead_clean: "Showerhead Clean & Descale", tank_inspection: "Tank Inspection", legionella_sample: "Legionella Water Sample", dead_leg_flush: "Dead Leg Flush", calorifier_check: "Calorifier Check" };
export type WaterHygieneLocation = "kitchen_hot" | "kitchen_cold" | "bathroom_1_hot" | "bathroom_1_cold" | "bathroom_2_hot" | "bathroom_2_cold" | "en_suite_hot" | "en_suite_cold" | "utility_hot" | "utility_cold" | "header_tank" | "calorifier" | "bathroom_1_shower" | "bathroom_2_shower";
export const WATER_HYGIENE_LOCATION_LABEL: Record<WaterHygieneLocation, string> = { kitchen_hot: "Kitchen (Hot)", kitchen_cold: "Kitchen (Cold)", bathroom_1_hot: "Bathroom 1 (Hot)", bathroom_1_cold: "Bathroom 1 (Cold)", bathroom_2_hot: "Bathroom 2 (Hot)", bathroom_2_cold: "Bathroom 2 (Cold)", en_suite_hot: "En-Suite (Hot)", en_suite_cold: "En-Suite (Cold)", utility_hot: "Utility (Hot)", utility_cold: "Utility (Cold)", header_tank: "Header Tank", calorifier: "Calorifier", bathroom_1_shower: "Bathroom 1 (Shower)", bathroom_2_shower: "Bathroom 2 (Shower)" };
export type WaterHygieneCompliance = "compliant" | "non_compliant" | "action_required" | "remediated";
export const WATER_HYGIENE_COMPLIANCE_LABEL: Record<WaterHygieneCompliance, string> = { compliant: "Compliant", non_compliant: "Non-Compliant", action_required: "Action Required", remediated: "Remediated" };
export interface WaterHygieneRecord {
  id: string;
  date: string;
  time: string;
  checked_by: string;
  check_type: WaterHygieneCheckType;
  location: WaterHygieneLocation;
  temperature: number | null;
  target_min: number | null;
  target_max: number | null;
  compliance: WaterHygieneCompliance;
  notes: string;
  action_required: string;
  action_completed: boolean;
  action_completed_date: string | null;
  next_due_date: string;
}

// ── Wellbeing Pulse Survey ──────────────────────────────────────────────────
export type WellbeingPulseMethod = "visual_cards" | "one_to_ten_scale" | "conversation" | "drawing" | "emoji_selection" | "written";
export const WELLBEING_PULSE_METHOD_LABEL: Record<WellbeingPulseMethod, string> = { visual_cards: "Visual Cards", one_to_ten_scale: "1-10 Scale", conversation: "Conversation", drawing: "Drawing", emoji_selection: "Emoji Selection", written: "Written" };
export type WellbeingPulseTrend = "up" | "stable" | "down" | "first_survey";
export const WELLBEING_PULSE_TREND_LABEL: Record<WellbeingPulseTrend, string> = { up: "Up", stable: "Stable", down: "Down", first_survey: "First Survey" };
export type WellbeingPulseDimension = "feeling_safe" | "feeling_listened_to" | "friendships" | "school_activities" | "family_contact" | "mood_today";
export const WELLBEING_PULSE_DIMENSION_LABEL: Record<WellbeingPulseDimension, string> = { feeling_safe: "Feeling Safe", feeling_listened_to: "Feeling Listened To", friendships: "Friendships", school_activities: "School/Activities", family_contact: "Family/Contact", mood_today: "Mood Today" };
export interface WellbeingPulseSurveyRecord {
  id: string;
  child_id: string;
  date: string;
  conducted_by: string;
  method: WellbeingPulseMethod;
  duration_minutes: number;
  scores: Record<WellbeingPulseDimension, number>;
  overall_score: number;
  verbatim_quote: string;
  key_themes: string[];
  staff_observations: string;
  trend_vs_last: WellbeingPulseTrend;
  actions_arising: string[];
  follow_up_needed: boolean;
  follow_up_by: string;
}

// ── Whistleblowing ──────────────────────────────────────────────────────────
export type WhistleblowingCategory = "safeguarding" | "malpractice" | "health_safety" | "financial" | "bullying" | "data_breach" | "discrimination" | "neglect" | "policy_breach" | "other";
export const WHISTLEBLOWING_CATEGORY_LABEL: Record<WhistleblowingCategory, string> = { safeguarding: "Safeguarding", malpractice: "Malpractice", health_safety: "Health & Safety", financial: "Financial", bullying: "Bullying", data_breach: "Data Breach", discrimination: "Discrimination", neglect: "Neglect", policy_breach: "Policy Breach", other: "Other" };
export type WhistleblowingStatus = "received" | "investigating" | "escalated" | "resolved" | "closed_no_action";
export const WHISTLEBLOWING_STATUS_LABEL: Record<WhistleblowingStatus, string> = { received: "Received", investigating: "Investigating", escalated: "Escalated", resolved: "Resolved", closed_no_action: "Closed (No Action)" };
export type WhistleblowingSeverity = "low" | "medium" | "high" | "critical";
export const WHISTLEBLOWING_SEVERITY_LABEL: Record<WhistleblowingSeverity, string> = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
export interface WhistleblowingTimeline { date: string; action: string; by: string; }
export interface WhistleblowingRecord {
  id: string;
  reference: string;
  date_raised: string;
  raised_by: string;
  anonymous: boolean;
  category: WhistleblowingCategory;
  severity: WhistleblowingSeverity;
  status: WhistleblowingStatus;
  subject_of_concern: string;
  summary: string;
  detail: string;
  evidence_provided: string[];
  assigned_to: string;
  external_referral: string | null;
  outcome: string;
  lessons_learned: string;
  timeline: WhistleblowingTimeline[];
  protection_measures: string[];
}

// ── Whistleblowing Investigations ───────────────────────────────────────────
export type WBInvestigationConcernType = "practice_concerns" | "safeguarding" | "financial" | "health_safety" | "behaviour" | "discrimination" | "bullying";
export const WB_INVESTIGATION_CONCERN_TYPE_LABEL: Record<WBInvestigationConcernType, string> = { practice_concerns: "Practice Concerns", safeguarding: "Safeguarding", financial: "Financial", health_safety: "Health & Safety", behaviour: "Behaviour", discrimination: "Discrimination", bullying: "Bullying" };
export type WBInvestigationReporterCategory = "staff_member" | "anonymous" | "parent" | "professional";
export const WB_INVESTIGATION_REPORTER_CATEGORY_LABEL: Record<WBInvestigationReporterCategory, string> = { staff_member: "Staff Member", anonymous: "Anonymous", parent: "Parent", professional: "Professional" };
export type WBInvestigationOutcome = "substantiated" | "partially_substantiated" | "unsubstantiated" | "inconclusive" | "ongoing";
export const WB_INVESTIGATION_OUTCOME_LABEL: Record<WBInvestigationOutcome, string> = { substantiated: "Substantiated", partially_substantiated: "Partially Substantiated", unsubstantiated: "Unsubstantiated", inconclusive: "Inconclusive", ongoing: "Ongoing" };
export type WBInvestigationStatus = "active" | "closed";
export const WB_INVESTIGATION_STATUS_LABEL: Record<WBInvestigationStatus, string> = { active: "Active", closed: "Closed" };
export interface WBInvestigationStage { stage: string; completed: boolean; completion_date: string; notes: string; }
export interface WBInvestigationRecord {
  id: string;
  date_raised: string;
  concern_type: WBInvestigationConcernType;
  summary_of_concern: string;
  reporter_category: WBInvestigationReporterCategory;
  reporter_anonymous: boolean;
  investigation_lead: string;
  independent: boolean;
  external_investigator: string;
  stages_completed: WBInvestigationStage[];
  evidence_gathered: string[];
  people_interviewed: number;
  outcome: WBInvestigationOutcome;
  findings: string;
  actions_implemented: string[];
  policy_review_arising: string;
  referrals_made: string[];
  reporter_fed_back: boolean;
  feedback_date: string;
  learning_points: string[];
  status: WBInvestigationStatus;
  closed_date: string;
  data_protection_maintained: boolean;
}

// ── Health Records ──────────────────────────────────────────────────────────
export type HealthRecordType = "health_assessment" | "immunisation" | "allergy" | "condition" | "referral" | "dental" | "optical" | "mental_health" | "growth" | "other";
export type HealthRecordStatus = "current" | "resolved" | "monitoring" | "referred" | "overdue";

export interface HealthRecordEntry {
  id: string;
  child_id: string;
  date: string;
  record_type: HealthRecordType;
  title: string;
  details: string;
  professional: string;
  status: HealthRecordStatus;
  follow_up_date: string | null;
  outcome: string | null;
  staff_id: string;
  home_id?: string;
  created_at?: string;
}

// ── Admission Referrals ─────────────────────────────────────────────────────
export type AdmissionReferralStatus = "new" | "under_assessment" | "impact_assessment" | "panel_decision" | "accepted" | "declined" | "withdrawn" | "placed";
export type AdmissionReferralSource = "local_authority" | "agency" | "emergency" | "internal_transfer" | "court_directed";
export type AdmissionGender = "male" | "female" | "non_binary" | "prefer_not_to_say";

export const ADMISSION_REFERRAL_STATUS_LABEL: Record<AdmissionReferralStatus, string> = {
  new: "New Referral", under_assessment: "Under Assessment", impact_assessment: "Impact Assessment",
  panel_decision: "Panel Decision", accepted: "Accepted", declined: "Declined", withdrawn: "Withdrawn", placed: "Placed",
};
export const ADMISSION_REFERRAL_SOURCE_LABEL: Record<AdmissionReferralSource, string> = {
  local_authority: "Local Authority", agency: "Agency", emergency: "Emergency",
  internal_transfer: "Internal Transfer", court_directed: "Court Directed",
};

export interface AdmissionReferral {
  id: string;
  child_name: string;
  date_of_birth: string;
  age: number;
  gender: AdmissionGender;
  ethnicity: string;
  referral_date: string;
  referral_source: AdmissionReferralSource;
  referred_by: string;
  local_authority: string;
  status: AdmissionReferralStatus;
  presenting_needs: string[];
  risk_factors: string[];
  placement_history: string;
  impact_assessment_complete: boolean;
  impact_assessment_notes: string;
  matching_considerations: string;
  decision_date: string;
  decision_by: string;
  decision_reason: string;
  estimated_placement_date: string;
  notes: string;
  staff_id: string;
  home_id?: string;
  created_at?: string;
}

// ── YP Savings ──────────────────────────────────────────────────────────────
export type YPSavingsTransactionType = "deposit" | "withdrawal" | "birthday_money" | "holiday_allowance" | "savings_interest" | "leaving_care_grant" | "education_grant" | "other";
export const YP_SAVINGS_TRANSACTION_TYPE_LABEL: Record<YPSavingsTransactionType, string> = { deposit: "Deposit", withdrawal: "Withdrawal", birthday_money: "Birthday Money", holiday_allowance: "Holiday Allowance", savings_interest: "Savings Interest", leaving_care_grant: "Leaving Care Grant", education_grant: "Education Grant", other: "Other" };
export interface YPSavingsTransaction {
  id: string;
  date: string;
  type: YPSavingsTransactionType;
  description: string;
  amount: number;
  balance: number;
  recorded_by: string;
  authorised_by: string | null;
  receipt_ref: string;
}
export interface YPSavingsGoal { goal: string; target: number; current: number; }
export interface YPSavingsAccountRecord {
  id: string;
  child_id: string;
  account_type: string;
  provider: string;
  opened_date: string;
  current_balance: number;
  monthly_target: number;
  transactions: YPSavingsTransaction[];
  savings_goals: YPSavingsGoal[];
  child_manages: boolean;
  notes: string;
}

// ── Inspection History ─────────────────────────────────────────────────────────

export type OfstedGrade = "Outstanding" | "Good" | "Requires improvement" | "Inadequate";
export type InspectionType = "Full inspection" | "Short notice" | "Focused visit" | "Monitoring visit";

export interface InspectionRecord {
  id: string;
  home_id: string;
  inspection_date: string;
  inspection_type: InspectionType;
  grade: OfstedGrade;
  inspector_name: string;
  report_reference: string | null;
  report_url: string | null;
  actions_required: number;
  actions_completed: number;
  summary: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Wake-Up Routines ───────────────────────────────────────────────────────────

export type WakeUpMethod = "Gentle voice" | "Music/playlist" | "Light + voice" | "Phone alarm" | "White noise transition";
export type WakeUpStaffSupport = "None" | "Prompt" | "Hands-on";
export type EnergyPattern = "Slow starter" | "Quick starter" | "Variable";

export interface WakeUpStep {
  time: string;
  activity: string;
  staffSupport: WakeUpStaffSupport;
}

export interface WakeUpRoutine {
  id: string;
  child_id: string;
  home_id: string;
  weekdayWakeTime: string;
  weekendWakeTime: string;
  preferredWakeMethod: WakeUpMethod;
  wakeUpSteps: WakeUpStep[];
  morningTriggers: string[];
  morningProtective: string[];
  breakfastPreferences: string[];
  hygieneSequence: string[];
  schoolPrep: string[];
  arrivalTime: string;
  ifRefusingToGetUp: string[];
  energyPattern: EnergyPattern;
  medicationMorning: string;
  childAgreed: boolean;
  reviewedDate: string;
  reviewedWith: string;
  effectivenessRating: number;
  created_at: string;
}

// ── Therapeutic Outcome Measures ───────────────────────────────────────────────

export type OutcomeMeasureName = "SDQ (Goodman)" | "RCADS" | "CORE-YP" | "Outcome Star" | "BERS-2" | "ASEBA YSR" | "Trauma Symptom Checklist (TSCC)";
export type OutcomeMeasureDomain = "Emotional Wellbeing" | "Behavioural" | "Anxiety/Depression" | "Trauma Symptoms" | "Strengths" | "General";
export type TomTrendDirection = "Improving" | "Stable" | "Declining" | "Baseline";
export type ScoreInterpretation = "Within normal range" | "Borderline" | "Clinical concern";

export interface OutcomeSubscale {
  subscale: string;
  rawScore: number;
  maxScore: number;
  clinicalThreshold: number;
  interpretation: ScoreInterpretation;
}

export interface OutcomeMeasure {
  id: string;
  child_id: string;
  home_id: string;
  measureName: OutcomeMeasureName;
  measureFullName: string;
  domain: OutcomeMeasureDomain;
  administeredDate: string;
  administeredBy: string;
  childCompleted: boolean;
  scores: OutcomeSubscale[];
  totalScore: number;
  maxTotalScore: number;
  prevTotalScore: number | null;
  trendDirection: TomTrendDirection;
  childReflection: string;
  staffInterpretation: string;
  clinicalDiscussionWith: string;
  linkedInterventions: string[];
  nextAdministrationDate: string;
  created_at: string;
}

// ── Welfare Check Protocol Per Child ──────────────────────────────────────────

export type WelfareCheckType =
  | "Visual through doorway"
  | "Full welfare check"
  | "Voice check"
  | "Thermal sensor"
  | "Baby monitor observation"
  | "Knock and verbal"
  | "Sensor-only"
  | "Standard observation";

export interface WelfareProtocol {
  id: string;
  child_id: string;
  home_id: string;
  checkFrequencyByDay: string;
  checkFrequencyByNight: string;
  checkType: WelfareCheckType;
  reasonForFrequency: string;
  signsOfWellbeingToObserve: string[];
  signsOfConcernToWatchFor: string[];
  howToCheckSensitivelyAware: string;
  nightCheckTechnique: string;
  childCanRequestModifications: boolean;
  childPreferences: string;
  staffApproachWhenChildAwake: string;
  escalationCriteria: string[];
  reviewedDate: string;
  reviewedWithChild: boolean;
  reviewedBy: string;
  nextReviewDate: string;
  created_at: string;
}

// ── Young Carer Status ────────────────────────────────────────────────────────

export type YoungCarerStatus = "Identified young carer" | "Previous young carer (pre-care)" | "Risk of young carer role on family contact" | "Not a young carer";

export interface YoungCarerRecord {
  id: string;
  child_id: string;
  home_id: string;
  assessmentDate: string;
  carerStatus: YoungCarerStatus;
  caringResponsibilities: string[];
  caringRecipient: string;
  ageWhenCaringStarted: number;
  durationOfCaringRole: string;
  emotionalImpactObserved: string[];
  practicalImpactObserved: string[];
  childWishesAroundCaring: string;
  parentLAAware: boolean;
  formalYoungCarerAssessment: boolean;
  assessmentLA: string;
  assessmentDate2: string;
  supportInPlace: string[];
  educationImpactProtections: string[];
  contactSupportArrangements: string;
  childAcceptsCarerStatus: boolean;
  childRefusesIdentification: string;
  reviewSchedule: string;
  reviewedDate: string;
  reviewedBy: string;
  notes: string;
  created_at: string;
}

// ── Young Person Job Tracker ──────────────────────────────────────────────────

export type YpJobType = "Saturday job" | "Newspaper round" | "Babysitting (family)" | "Volunteering" | "Apprenticeship" | "Work experience placement" | "Internal home task (paid)" | "Sports coaching assistant";
export type YpJobStatus = "Active" | "Trial period" | "Ended" | "On hold";
export type PayRateUnit = "per hour" | "per shift" | "per week" | "per task";

export interface YpJobLegalCheck {
  check: string;
  verified: boolean;
}

export interface YpJob {
  id: string;
  child_id: string;
  home_id: string;
  jobType: YpJobType;
  employer: string;
  jobTitle: string;
  startDate: string;
  ongoingStatus: YpJobStatus;
  endDate: string;
  hoursPerWeek: number;
  payRate: number;
  payRateUnit: PayRateUnit;
  legalChecks: YpJobLegalCheck[];
  workPermitObtained: boolean;
  workPermitNumber: string;
  schoolImpactAssessment: string;
  parentLAConsent: boolean;
  childAge: number;
  childMotivation: string;
  riskAssessmentCompleted: boolean;
  riskAssessmentDate: string;
  travelArrangements: string;
  emergencyContacts: string;
  childExperience: string;
  skillsBeingDeveloped: string[];
  earningsToDate: number;
  earningsManagement: string;
  reviewedDate: string;
  reviewedBy: string;
  notes: string;
  created_at: string;
}

// ── Transport Risk Assessments ────────────────────────────────────────────────

export type JourneyType =
  | "Routine recurring"
  | "School run"
  | "Activity"
  | "Appointment"
  | "Family contact"
  | "Holiday/trip"
  | "Emergency";

export interface TransportHazard {
  hazard: string;
  likelihood: "Low" | "Medium" | "High";
  severity: "Low" | "Medium" | "High";
  control: string;
  residualRisk: "Low" | "Medium" | "High";
}

export interface TransportRA {
  id: string;
  child_id: string;
  home_id: string;
  journeyTitle: string;
  journeyType: JourneyType;
  youngPeople: string[];
  staffDriver: string;
  passengers: number;
  vehicle: string;
  routeDescription: string;
  expectedDurationMins: number;
  recurringFrequency?: string;
  hazards: TransportHazard[];
  childSpecificConsiderations: Record<string, string>;
  behaviourRiskRating: "Low" | "Medium" | "High";
  behaviourMitigations: string[];
  missingFromCareRisk: "Low" | "Medium" | "High";
  missingMitigations: string[];
  specificRisksByRoute: string[];
  emergencyProcedure: string;
  breakdownProcedure: string;
  lastReviewedDate: string;
  reviewedBy: string;
  nextReviewDate: string;
  signedOffByRM: boolean;
  inUseStatus: boolean;
  created_at: string;
}

// ── Utility Bills Tracker ─────────────────────────────────────────────────────

export type UtilityType = "Electricity" | "Gas" | "Water" | "Broadband" | "Phone" | "Council Tax" | "Insurance";
export type PaymentStatus = "Paid" | "Pending" | "Overdue" | "Disputed";
export type PaymentMethod = "Direct Debit" | "BACS" | "Card";
export type TrendDirection2 = "Up" | "Down" | "Stable";

export interface UtilityBill {
  id: string;
  home_id: string;
  utilityType: UtilityType;
  supplier: string;
  accountNumber: string;
  billPeriod: string;
  billDate: string;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  readingPrevious: number;
  readingCurrent: number;
  unitsUsed: number;
  comparedToLastYear: string;
  trend: TrendDirection2;
  efficiencyNotes: string;
  contractEndDate: string;
  switchAvailable: boolean;
  responsibleOwner: string;
  reviewedBy: string;
  created_at: string;
}

// ── Trauma-Informed Timeline ──────────────────────────────────────────────────

export type TimelineEventCategory = "Loss" | "Trauma" | "Placement" | "Positive" | "Health" | "Education" | "Family" | "Legal";
export type TimelineEventImpact = "High" | "Medium" | "Low";

export interface TimelineEvent {
  id: string;
  child_id: string;
  home_id: string;
  date: string;
  ageAtEvent: number;
  category: TimelineEventCategory;
  title: string;
  description: string;
  impact: TimelineEventImpact;
  therapeuticRelevance: string;
  linkedInterventions: string[];
  source: string;
  addedBy: string;
  addedDate: string;
  created_at: string;
}

// ── Welcome Tour Checklist ────────────────────────────────────────────────────

export interface WelcomeTourStep {
  step: string;
  shown: boolean;
  childResponse: string;
  noteForCarePlan: string;
}

export interface WelcomeTourResident {
  residentInitials: string;
  meetingType: "Brief introduction" | "Longer chat" | "Activity together" | "Parallel only — not introduced";
  observations: string;
}

export interface WelcomeTour {
  id: string;
  child_id: string;
  home_id: string;
  childInitials: string;
  ageAtArrival: number;
  arrivalDate: string;
  tourDate: string;
  tourLeader: string;
  durationMinutes: number;
  childArrivedFromWhere: string;
  toursPaceAdjusted: boolean;
  paceAdjustmentReason: string;
  preTourActivities: string[];
  toursteps: WelcomeTourStep[];
  meetingChildrenDuringTour: WelcomeTourResident[];
  emotionalState: { onArrival: string; midTour: string; postTour: string };
  childChoseFirstActivity: string;
  bedroomFirstSighting: string;
  bedroomPersonalisationStarted: boolean;
  childToldAboutPledges: boolean;
  childToldAboutAdvocate: boolean;
  childToldAboutComplaints: boolean;
  childToldAboutContact: boolean;
  childGivenPersonalisedWelcomePack: boolean;
  childGivenContactNumbers: boolean;
  childCalmAtNightOne: boolean;
  followUpActions: string[];
  notes: string;
  created_at: string;
}

// ── Trans-Affirming Care Plan ─────────────────────────────────────────────────

export type TransSocialTransitionStage =
  | "Pre-questioning"
  | "Questioning / exploring"
  | "Privately identified"
  | "Out to staff only"
  | "Selectively out"
  | "Fully socially transitioned"
  | "Detransitioned / re-exploring";

export type TransParentalAwareness =
  | "Out and supported"
  | "Out — strained"
  | "Selectively"
  | "Not yet — child's choice"
  | "Not yet — risk-assessed"
  | "Hostile family — no contact agreed";

export type TransSchoolAwareness = "Fully" | "Partially" | "Not aware — child's choice";

export interface TransAffirmingPlan {
  id: string;
  child_id: string;
  home_id: string;
  planDate: string;
  identitySharedWithStaff: string;
  pronouns: string;
  pronounsUsedConsistently: boolean;
  preferredName: string;
  legalNameMatches: boolean;
  preferredNameWhereUsed: string[];
  whereDeadnameStillAppears: string[];
  socialTransitionStage: TransSocialTransitionStage;
  childPaceConfirmed: boolean;
  affirmingActions: string[];
  clothingAccessSupported: string[];
  bindingPolicy?: string;
  packerPolicy?: string;
  voiceCoachingActive?: string;
  hairCareAffirming: string[];
  pronounEducationForVisitors: boolean;
  externalSupport: { agency: string; clinician?: string; frequency: string }[];
  giccConsidered: boolean;
  giccStatus?: string;
  childCanRequestPause: boolean;
  parentalAwareness: TransParentalAwareness;
  schoolAware: TransSchoolAwareness;
  schoolUsingPreferredNamePronouns: boolean;
  bathroomChangingArrangements: string;
  safetyRiskAssessment: string[];
  recordsLanguageUpdated: boolean;
  childVoice: string;
  staffObservation: string;
  flagsForReview: string[];
  reviewDate: string;
  keyWorker: string;
  created_at: string;
}

// ── Vehicle Pre-Use Check ─────────────────────────────────────────────────────

export type VehicleCheckFuelLevel = "Full" | "3/4" | "1/2" | "1/4" | "Refuel needed";
export type VehicleCheckOutcome =
  | "Cleared for use"
  | "Cleared with minor notes"
  | "Withdrawn from use - defect";

export interface VehiclePreUseCheckItem {
  item: string;
  pass: boolean;
  notes: string;
}

export interface VehiclePreUseCheck {
  id: string;
  home_id: string;
  vehicle: string;
  driver: string;
  dateTime: string;
  journeyPurpose: string;
  expectedReturn: string;
  checks: VehiclePreUseCheckItem[];
  fuelLevel: VehicleCheckFuelLevel;
  mileageStart: number;
  mileageEnd?: number;
  defectsFound: string[];
  defectsActionedBy: string;
  tyresChecked: boolean;
  tyresPressureNotedNotes: string;
  fluidsChecked: boolean;
  warningLightsClear: boolean;
  windscreenAndWipersOk: boolean;
  seatbeltsOk: boolean;
  childCarSeatsCorrect: boolean;
  firstAidKitPresent: boolean;
  grabBagPresent: boolean;
  insuranceConfirmed: boolean;
  motValidUntil: string;
  breakdownCoverConfirmed: boolean;
  passengersExpected: number;
  incidentsDuringJourney: string;
  checkOutcome: VehicleCheckOutcome;
  nextAction: string;
  created_at: string;
}

// ── Voter Registration / Civic Record ────────────────────────────────────────

export type VoterRegistrationStatus =
  | "Too young"
  | "Eligible — not registered"
  | "Registered (attainer)"
  | "Registered — full"
  | "Postal vote arranged"
  | "Voter ID confirmed";

export type VoterRegistrationMethod =
  | "gov.uk online"
  | "Paper form"
  | "Council assisted"
  | "Pathway plan support";

export interface CivicElection {
  name: string;
  date: string;
}

export interface CivicElectionParticipated {
  name: string;
  date: string;
  voted: boolean;
  firstTime?: boolean;
}

export interface CivicRecord {
  id: string;
  child_id: string;
  home_id: string;
  recordedDate: string;
  ageAtRecord: number;
  voterRegistrationStatus: VoterRegistrationStatus;
  registrationDate?: string;
  registrationMethod?: VoterRegistrationMethod;
  voterIdHeld?: string;
  electionsEligibleNext: CivicElection[];
  electionsParticipated: CivicElectionParticipated[];
  civicEducationCovered: string[];
  causesOfInterest: string[];
  communityActivities: string[];
  hasContactedRepresentative: boolean;
  representativesKnown: string[];
  childVoice: string;
  staffObservation: string;
  nextStep: string;
  reviewDate: string;
  keyWorker: string;
  created_at: string;
}

// ── Warm Welcome Packs ────────────────────────────────────────────────────────

export type WelcomePackStatus = "delivered" | "preparing" | "template";
export type WelcomeItemCategory =
  | "bedroom"
  | "toiletries"
  | "comfort"
  | "information"
  | "personal"
  | "food";

export interface WarmWelcomePackItem {
  item: string;
  category: WelcomeItemCategory;
  provided: boolean;
  personalised: boolean;
  notes: string;
}

export interface WarmWelcomePack {
  id: string;
  child_id: string;
  home_id: string;
  preparedBy: string;
  preparedDate: string;
  admissionDate: string;
  status: WelcomePackStatus;
  items: WarmWelcomePackItem[];
  personalTouches: string[];
  childFeedback: string | null;
  firstNightPlan: string;
  keyWorkerIntro: string;
  notes: string;
  created_at: string;
}

// ── Therapeutic Care Model ────────────────────────────────────────────────────

export type TherapeuticCompetencyLevel = "foundation" | "practitioner" | "advanced";

export interface TherapeuticTrainingCourse {
  course: string;
  date: string;
}

export interface TherapeuticStaffTraining {
  id: string;
  home_id: string;
  staffId: string;
  competencyLevel: TherapeuticCompetencyLevel;
  trainingCompleted: TherapeuticTrainingCourse[];
  lastReflectivePractice: string;
  areasOfStrength: string[];
  developmentNeeds: string[];
  notes: string;
  created_at: string;
}

export interface TherapeuticChildImpact {
  id: string;
  child_id: string;
  home_id: string;
  keyOutcomes: string[];
  evidenceOfProgress: string;
  modelApplication: string[];
  reviewDate: string;
  created_at: string;
}

// ── Home Emergency Contacts ───────────────────────────────────────────────────

export type HomeContactCategory =
  | "emergency_999"
  | "on_call"
  | "local_service"
  | "regulatory";

export interface HomeEmergencyContact {
  id: string;
  home_id: string;
  label: string;
  number: string;
  description: string;
  category: HomeContactCategory;
  available: string;
  created_at: string;
}

// ── Visitor Management & Security Intelligence ────────────────────────────────

export interface VisitorRegistrationRecord {
  id: string;
  visitor_name: string;
  visitor_type: "professional" | "family" | "contractor" | "inspector" | "volunteer" | "other";
  visit_date: string;
  pre_registered: boolean;
  registration_complete: boolean;
  purpose_recorded: boolean;
  host_staff_assigned: boolean;
  host_staff_name: string | null;
  approved_by: string | null;
  approval_date: string | null;
  visit_duration_minutes: number | null;
  child_ids_involved: string[];
  created_at: string;
}

export interface DbsCheckRecord {
  id: string;
  visitor_name: string;
  visitor_type: "professional" | "family" | "contractor" | "inspector" | "volunteer" | "other";
  dbs_required: boolean;
  dbs_verified: boolean;
  dbs_certificate_number: string | null;
  dbs_level: "basic" | "standard" | "enhanced" | "enhanced_barred" | null;
  dbs_check_date: string | null;
  dbs_expiry_date: string | null;
  dbs_expired: boolean;
  verified_by: string | null;
  verified_date: string | null;
  exemption_reason: string | null;
  created_at: string;
}

export interface IdVerificationRecord {
  id: string;
  visitor_name: string;
  visit_date: string;
  id_requested: boolean;
  id_provided: boolean;
  id_type: "photo_id" | "driving_licence" | "passport" | "professional_id" | "other" | null;
  id_verified: boolean;
  verified_by: string | null;
  photo_match_confirmed: boolean;
  refusal_action_taken: string | null;
  created_at: string;
}

export interface SafeguardingProtocolRecord {
  id: string;
  visit_date: string;
  visitor_name: string;
  visitor_type: "professional" | "family" | "contractor" | "inspector" | "volunteer" | "other";
  safeguarding_briefing_given: boolean;
  emergency_procedures_shared: boolean;
  confidentiality_agreement_signed: boolean;
  prohibited_areas_communicated: boolean;
  child_protection_policy_acknowledged: boolean;
  lone_access_permitted: boolean;
  lone_access_risk_assessed: boolean;
  escort_required: boolean;
  escort_provided: boolean;
  escort_staff_name: string | null;
  incident_during_visit: boolean;
  incident_details: string | null;
  created_at: string;
}

export interface VisitorLogRecord {
  id: string;
  visitor_name: string;
  visit_date: string;
  sign_in_time: string | null;
  sign_out_time: string | null;
  sign_in_recorded: boolean;
  sign_out_recorded: boolean;
  badge_issued: boolean;
  badge_returned: boolean;
  vehicle_registration_recorded: boolean;
  belongings_checked: boolean;
  departure_confirmed: boolean;
  log_reviewed_by: string | null;
  log_review_date: string | null;
  created_at: string;
}
