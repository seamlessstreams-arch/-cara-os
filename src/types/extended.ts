// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EXTENDED TYPES
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
  action_type: "auto_fill" | "linked_record" | "aria_draft" | "auto_task" | "auto_handover" | "one_click_summary" | "avoided_duplicate";
  minutes_saved: number;
  description: string;
  created_at: string;
}

// ── Aria Interaction ──────────────────────────────────────────────────────────

export type AriaMode =
  | "write" | "review" | "oversee" | "assist"
  // Intelligence modes
  | "experience_summary" | "pattern_analysis" | "what_changed"
  | "voice_summary" | "chronology_summary" | "home_climate"
  | "intervention_review" | "practice_bank" | "decision_support"
  | "form_review" | "oversight_draft" | "inspection_narrative"
  | "rewrite"
  // Document modes
  | "document_classify" | "document_to_form"
  // ARIA Intelligence module modes
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

export type AriaStyle =
  | "professional_formal" | "warm_professional" | "child_friendly"
  | "reflective_practice" | "safeguarding_focused" | "concise_manager"
  | "parent_carer" | "plain_english" | "social_worker_update"
  | "therapeutic" | "complaint_response" | "restorative"
  // Extended styles
  | "evaluative_ofsted" | "chronology_style" | "reg_45_narrative"
  | "safeguarding_analysis" | "management_oversight" | "provider_summary"
  | "inspection_ready" | "child_journey" | "relational_practice"
  | "direct_factual" | "compassionate_reflective";

export interface AriaRequest {
  mode: AriaMode;
  style: AriaStyle;
  page_context: string;
  record_type: string;
  source_content: string;
  user_role: string;
  linked_records?: string;
  audience?: string;
}

export interface AriaResponse {
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
  aria_notes: string | null;
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

// ── ARIA Intelligence Module — types ──────────────────────────────────────────

export type AriaAssessmentStatus = "draft" | "reviewed" | "approved" | "archived";
export type AriaAssessmentType = "situation_review" | "pattern_scan" | "safeguarding_scan" | "reflective_debrief";
export type AriaRiskLevel = "critical" | "high" | "medium" | "low" | "not_identified";
export type AriaConfidenceLevel = "high" | "possible" | "needs_human_review" | "insufficient_information";

export interface AriaRecommendedAction {
  title: string;
  why_this_matters: string;
  priority: "urgent" | "high" | "medium" | "low";
  deadline_days?: number;
  assigned_role?: string;
  evidence_required?: string;
}

export interface AriaAssessment {
  id: string;
  home_id: string;
  child_id: string;
  source_record_type?: string;
  source_record_id?: string;
  assessment_type: AriaAssessmentType;
  situation_summary?: string;
  risk_level: AriaRiskLevel;
  safeguarding_flags: string[];
  protective_factors: string[];
  emotional_needs: string[];
  suggested_actions: AriaRecommendedAction[];
  confidence_level: AriaConfidenceLevel;
  ai_generated_text: string;
  human_reviewed_text?: string;
  status: AriaAssessmentStatus;
  created_by: string;
  reviewed_by?: string;
  approved_by?: string;
  created_at: string;
  reviewed_at?: string;
  approved_at?: string;
}

export type AriaOversightStatus = "draft" | "submitted" | "approved" | "archived";
export type AriaOversightStyle = "professional_management" | "reflective_supervision" | "reg_45_evidence" | "ofsted_ready" | "trauma_informed" | "writing_to_child" | "social_worker_update" | "team_learning";

export interface AriaOversight {
  id: string;
  home_id: string;
  child_id?: string;
  record_type: string;
  record_id?: string;
  oversight_style: AriaOversightStyle;
  ai_draft: string;
  edited_version?: string;
  final_version?: string;
  approval_status: AriaOversightStatus;
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
  aria_summary?: string;
  manager_oversight_id?: string;
  status: KeyWorkSessionStatus;
  created_by: string;
  completed_by?: string;
  reviewed_by?: string;
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
  aria_summary?: string;
  safeguarding_flags: string[];
  follow_up_actions: string[];
  status: InteractiveSessionStatus;
  created_by: string;
  created_at: string;
  completed_at?: string;
}

export type AuditActionType = "aria_assessment_created" | "aria_assessment_reviewed" | "aria_assessment_approved" | "aria_oversight_generated" | "aria_oversight_approved" | "keywork_session_created" | "keywork_session_completed" | "keywork_session_reviewed" | "child_resource_created" | "child_resource_approved" | "interactive_session_completed" | "safeguarding_flag_raised" | "safeguarding_flag_reviewed" | "recommendation_created" | "recommendation_actioned" | "ai_prompt_sent" | "ai_response_received" | "human_edit_made" | "record_approved";

export interface AriaAuditEntry {
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

export type AriaRecommendationStatus = "pending" | "actioned" | "dismissed" | "task_created";
export type AriaRecommendationType = "key_work_session" | "risk_assessment_update" | "social_worker_notification" | "chronology_entry" | "staff_debrief" | "behaviour_plan_update" | "safety_plan" | "evidence_upload" | "management_oversight" | "education_review" | "reflective_supervision" | "family_contact_review" | "missing_follow_up" | "medication_review" | "placement_plan_update";

export interface AriaRecommendation {
  id: string;
  home_id: string;
  child_id?: string;
  source_type?: string;
  source_id?: string;
  recommendation_type: AriaRecommendationType;
  title: string;
  reason: string;
  priority: "urgent" | "high" | "medium" | "low";
  deadline?: string;
  assigned_role?: string;
  task_created: boolean;
  task_id?: string;
  status: AriaRecommendationStatus;
  created_at: string;
}

export type SafeguardingFlagSeverity = "critical" | "high" | "medium" | "low";
export type SafeguardingFlagType = "disclosure_of_harm" | "self_harm" | "exploitation" | "missing_from_care" | "grooming" | "online_exploitation" | "sexual_exploitation" | "criminal_exploitation" | "weapon_concern" | "substance_concern" | "medication_refusal" | "allegation_against_staff" | "bullying" | "family_contact_risk" | "radicalisation" | "abuse_or_neglect" | "immediate_safety_risk" | "peer_on_peer_abuse";
export type SafeguardingFlagStatus = "open" | "reviewed" | "escalated" | "closed";

export interface AriaSafeguardingFlag {
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
  aria_generated: boolean;
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
  generated_by_aria: boolean;
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
  aria_strengths?: string;
  aria_weaknesses?: string;
  aria_improvement_areas?: string;
  aria_child_impact?: string;
  aria_action_plan?: string;
  aria_ri_statement?: string;
  aria_generated_at?: string;
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
  aria_overview: string | null;
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
export type ComplaintOutcome = "upheld" | "partially_upheld" | "not_upheld" | "inconclusive" | "withdrawn";
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
  aria_summary: string | null;
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
  aria_analysis: string | null;
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
  aria_analysis: string | null;
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
  aria_summary: string | null;
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
// ARIA LEARNING STUDIO — types
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
  aria_generated: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type TrainingNeedPriority = "urgent" | "high" | "medium" | "low";
export type TrainingNeedIdentifiedBy = "manual" | "aria" | "supervision" | "incident" | "audit" | "ri_challenge" | "reg45" | "medication_event" | "daily_log";
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
  aria_evidence?: string;
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
  // ARIA output
  aria_summary?: string;
  aria_confidence?: LiversConfidence;
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
  aria_narrative?: string;
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
  aria_generated: boolean;
  aria_rationale?: string;
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
  aria_summary?: string;
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
  aria_recommendation: string;
  generated_by: "aria" | "manager";
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
  aria_narrative?: string;
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
  aria_insights?: string;
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

export interface EducationRecord {
  id: string;
  child_id: string;
  record_type: "attendance" | "exclusion" | "pep_meeting" | "achievement" | "concern" | "placement_change";
  title: string;
  date: string;
  school?: string;
  details?: string;
  outcome?: string;
  follow_up_date?: string;
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
