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

export type AllergySeverity = "mild" | "moderate" | "severe" | "anaphylactic";
export const ALLERGY_SEVERITY_LABEL: Record<AllergySeverity, string> = {
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
  anaphylactic: "Anaphylactic",
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
