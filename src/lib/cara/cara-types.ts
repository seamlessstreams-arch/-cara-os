// ══════════════════════════════════════════════════════════════════════════════
// Cara — UNIVERSAL TYPES
// Shared shapes for the universal Cara layer. Domain engines (oversight,
// voice-of-child, HR Process Guardian) keep their own narrow types and write
// their results back into cara_outputs.structured_output.
// ══════════════════════════════════════════════════════════════════════════════

import type { CaraPermission, CaraRole } from "./cara-permissions";

export type CaraConfidence = "low" | "medium" | "high";

export type CaraCommandId =
  // General writing
  | "improve_writing"
  | "professionalise_record"
  | "simplify_language"
  | "write_to_child"
  | "summarise_text"
  | "extract_actions"
  | "extract_key_points"
  | "check_missing_information"
  | "check_tone"
  | "check_factuality"
  | "convert_to_email"
  | "convert_to_letter"
  | "create_task_list"
  | "create_meeting_minutes"
  | "create_agenda"
  // Children's home recording
  | "draft_daily_log"
  | "draft_shift_summary"
  | "draft_handover"
  | "draft_keywork_session"
  | "draft_child_voice_summary"
  | "draft_placement_plan_update"
  | "draft_risk_assessment_update"
  | "draft_behaviour_support_update"
  | "draft_contact_summary"
  | "draft_education_summary"
  | "draft_health_summary"
  | "draft_independence_summary"
  // Incidents
  | "draft_incident_record"
  | "check_incident_chronology"
  | "incident_risk_analysis"
  | "identify_missing_incident_information"
  | "suggest_incident_follow_up_tasks"
  | "draft_social_worker_update"
  | "draft_parent_carer_update"
  | "draft_strategy_discussion_notes"
  | "draft_safeguarding_referral_support"
  // Management oversight
  | "draft_management_oversight"
  | "improve_management_oversight"
  | "review_management_oversight_quality"
  | "identify_management_actions"
  | "check_oversight_reflection"
  | "check_oversight_challenge"
  | "check_oversight_child_focus"
  | "create_management_action_plan"
  // RI / QA
  | "responsible_individual_qa_summary"
  | "regulation_44_summary"
  | "regulation_45_summary"
  | "monthly_quality_summary"
  | "identify_home_wide_themes"
  | "identify_repeated_shortfalls"
  | "create_service_improvement_plan"
  | "prepare_ofsted_readiness_summary"
  | "audit_evidence_summary"
  // HR
  | "draft_supervision_notes"
  | "draft_team_meeting_minutes"
  | "draft_return_to_work_note"
  | "draft_investigation_questions"
  | "draft_investigation_plan"
  | "draft_outcome_letter"
  | "draft_performance_support_plan"
  | "check_hr_fairness_and_tone"
  | "check_union_sensitive_wording"
  | "draft_training_need_summary"
  // Safer recruitment
  | "safer_recruitment_checklist_review"
  | "check_employment_gaps"
  | "draft_reference_request"
  | "draft_reference_chaser"
  | "draft_interview_questions"
  | "draft_conditional_offer"
  | "draft_recruitment_decision_record"
  | "create_onboarding_tasks"
  | "check_missing_recruitment_evidence"
  // Audits
  | "analyse_audit_findings"
  | "create_audit_action_plan"
  | "prioritise_audit_risks"
  | "draft_manager_audit_response"
  | "check_overdue_audit_actions"
  | "create_delegated_audit_tasks"
  // Documents
  | "summarise_uploaded_document"
  | "extract_document_actions"
  | "identify_document_links"
  | "identify_document_risks"
  | "suggest_where_document_should_link"
  | "create_document_summary_for_record"
  // Tasks
  | "create_task_from_text"
  | "create_task_from_incident"
  | "create_task_from_audit"
  | "create_task_from_oversight"
  | "suggest_task_owner"
  | "suggest_due_date"
  | "escalate_overdue_task"
  // Calendar
  | "prepare_meeting_agenda"
  | "draft_meeting_minutes"
  | "create_calendar_follow_up_tasks"
  | "identify_upcoming_compliance_dates"
  | "equality_diversity_calendar_prompt"
  | "trigger_related_document_update"
  // Care plans
  | "draft_care_plan_update"
  | "identify_care_plan_gaps"
  | "check_care_plan_progress"
  // Missing episodes
  | "draft_missing_episode_report"
  | "missing_episode_risk_analysis"
  | "missing_episode_return_interview_notes";

export interface CaraCommandSpec {
  id: CaraCommandId;
  label: string;
  description: string;
  // Module ids the command may appear in. Empty array = available everywhere.
  modules: string[];
  requiredPermission: CaraPermission;
  // Output requires manager approval before commit. Almost always true for
  // Cara; the few read-only commands set this to false.
  approvalRequired: boolean;
  // Whether the command can create tasks server-side once approved.
  canCreateTasks: boolean;
  // Whether the command can commit to a record (e.g. write back to a daily
  // log) once approved.
  canCommit: boolean;
  // Risk level used to gate confidence claims and to drive UI emphasis.
  riskLevel: "low" | "medium" | "high";
  // System-prompt fragment specific to the command, layered on top of the
  // shared writing-style rules.
  systemPromptFragment: string;
}

export interface CaraInvocationInput {
  commandId: CaraCommandId;
  organisationId?: string;
  homeId?: string;
  childId?: string;
  staffId?: string;
  sourceModule?: string;
  sourceRecordType?: string;
  sourceRecordId?: string;
  inputText?: string;
  inputMetadata?: Record<string, unknown>;
}

export interface CaraActorPayload {
  userId: string;
  role: CaraRole;
  organisationId?: string;
  homeId?: string;
  staffSelfId?: string;
}

export interface CaraGenerationResult {
  requestId: string;
  outputId?: string;
  generatedText: string;
  structuredOutput: Record<string, unknown>;
  confidence: CaraConfidence;
  redactedContextSummary: string;
  contextRecordIds: string[];
  caraLabel: "Cara suggested draft";
  llmUsed: boolean;
  providerId?: string;
  modelId?: string;
  approvalRequired: boolean;
  persisted: boolean;
}

export interface CaraTranscriptionInput {
  // Owner of the request (audit + RBAC). The provider call is server-side.
  userId: string;
  role: CaraRole;
  organisationId?: string;
  homeId?: string;
  sourceModule?: string;
  sourceField?: string;
  // The audio file handed to the provider. Discarded after transcription.
  fileName: string;
  mimeType: string;
  bytes: number;
  durationMs?: number;
  // Server reads the actual bytes from the multipart upload.
  audio: Buffer | Uint8Array;
}

export interface CaraTranscriptionResult {
  transcriptionId?: string;
  transcript: string;
  providerId?: string;
  modelId?: string;
  llmUsed: boolean;
  persisted: boolean;
}
