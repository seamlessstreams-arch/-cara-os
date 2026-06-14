// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence — Core Types
//
// Central type definitions for the Cara AI governance system.
// Used across all modules: routing, safety, audit, evidence, studio, QA.
// ══════════════════════════════════════════════════════════════════════════════

// ── Task Types ────────────────────────────────────────────────────────────

export type CaraTaskType =
  | "safeguarding_analysis"
  | "reg45_report"
  | "annex_a_report"
  | "rag44_evidence_review"
  | "child_weekly_report"
  | "child_review_report"
  | "keywork_session_plan"
  | "direct_work_session"
  | "staff_briefing"
  | "staff_supervision_reflection"
  | "placement_planning"
  | "risk_assessment_update"
  | "behaviour_pattern_analysis"
  | "incident_summary"
  | "management_oversight"
  | "daily_task_generation"
  | "form_prompt_support"
  | "policy_search"
  | "evidence_search"
  | "filing_cabinet_search"
  | "public_research"
  | "competitor_research"
  | "training_material_generation"
  | "creative_resource_generation"
  | "admin_summary"
  | "email_draft"
  | "document_extraction"
  | "document_classification"
  | "quality_assurance_review";

// ── Risk Levels ───────────────────────────────────────────────────────────

export type CaraRiskLevel = "low" | "medium" | "high" | "critical";

// ── Data Sensitivity ──────────────────────────────────────────────────────

export type CaraDataSensitivity =
  | "public"
  | "internal"
  | "confidential"
  | "child_sensitive"
  | "safeguarding_sensitive"
  | "legal_sensitive"
  | "staff_sensitive"
  | "health_sensitive";

// ── Providers ─────────────────────────────────────────────────────────────

export type CaraProviderName =
  | "openai"
  | "azure_openai"
  | "anthropic"
  | "bedrock"
  | "vertex_ai"
  | "mistral"
  | "voyage"
  | "cohere"
  | "perplexity"
  | "black_forest_labs"
  | "recraft"
  | "groq"
  | "cerebras";

// ── Model Identifiers ─────────────────────────────────────────────────────

export type CaraModelId = string; // e.g. "gpt-4o", "claude-sonnet-4-20250514", "mistral-large-latest"

// ── Approval Statuses ─────────────────────────────────────────────────────

export type CaraApprovalStatus =
  | "draft_ai_generated"
  | "pending_review"
  | "approved"
  | "rejected"
  | "amended_by_human"
  | "archived";

// ── Roles ─────────────────────────────────────────────────────────────────

export type CaraRole =
  | "support_worker"
  | "senior_support_worker"
  | "team_leader"
  | "deputy_manager"
  | "registered_manager"
  | "responsible_individual"
  | "operations_manager"
  | "director"
  | "system_admin"
  | "external_professional"
  | "inspector_readonly";

// ── Provider Capabilities ─────────────────────────────────────────────────

export interface CaraProviderCapabilities {
  generateText: boolean;
  generateStructured: boolean;
  streamText: boolean;
  embed: boolean;
  rerank: boolean;
  transcribe: boolean;
  analyseDocument: boolean;
  analyseImage: boolean;
  maxContextTokens: number;
  maxOutputTokens: number;
  supportsFunctionCalling: boolean;
  supportsStreaming: boolean;
  supportsJSON: boolean;
  governanceLevel: "standard" | "enterprise" | "sovereign";
  dataResidency: string[];          // e.g. ["eu", "uk", "us"]
  certifications: string[];         // e.g. ["SOC2", "ISO27001"]
}

// ── Task Request ──────────────────────────────────────────────────────────

export interface CaraTaskRequest {
  id?: string;
  taskType: CaraTaskType;
  userId: string;
  userRole: CaraRole;
  organisationId: string;
  homeId?: string;
  childId?: string;
  staffId?: string;
  prompt: string;
  systemPrompt?: string;
  context?: CaraTaskContext;
  options?: CaraTaskOptions;
  metadata?: Record<string, unknown>;
}

export interface CaraTaskContext {
  childAge?: number;
  childName?: string;
  childCommunicationStyle?: string;
  childLearningNeeds?: string[];
  childStrengths?: string[];
  childInterests?: string[];
  childRiskProfile?: string;
  carePlanGoals?: string[];
  educationPlan?: string;
  culturalIdentity?: string;
  recentIncidents?: string[];
  safeguardingConcerns?: string[];
  previousSessions?: string[];
  knownTriggers?: string[];
  trustedAdults?: string[];
  additionalContext?: Record<string, unknown>;
}

export interface CaraTaskOptions {
  preferredProvider?: CaraProviderName;
  preferredModel?: CaraModelId;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  returnStructured?: boolean;
  structuredSchema?: Record<string, unknown>;
  requireApproval?: boolean;
  skipRedaction?: boolean;           // only system_admin can set this
  costLimit?: number;
  timeoutMs?: number;
}

// ── Route Decision ────────────────────────────────────────────────────────

export interface CaraRouteDecision {
  provider: CaraProviderName;
  model: CaraModelId;
  riskLevel: CaraRiskLevel;
  sensitivityLevel: CaraDataSensitivity;
  requiresApproval: boolean;
  requiresRedaction: boolean;
  redactionApplied: boolean;
  humanApprovalReason?: string;
  routingReason: string;
  estimatedCost: number;
  estimatedLatencyMs: number;
  fallbackProviders: CaraProviderName[];
  blocked: boolean;
  blockReason?: string;
}

// ── Task Result ───────────────────────────────────────────────────────────

export interface CaraTaskResult {
  id: string;
  taskType: CaraTaskType;
  provider: CaraProviderName;
  model: CaraModelId;
  riskLevel: CaraRiskLevel;
  sensitivityLevel: CaraDataSensitivity;
  output: string;
  structuredOutput?: Record<string, unknown>;
  approvalStatus: CaraApprovalStatus;
  requiresApproval: boolean;
  redactionApplied: boolean;
  redactionMap?: CaraRedactionEntry[];
  tokenUsage: CaraTokenUsage;
  estimatedCost: number;
  latencyMs: number;
  promptHash: string;
  outputHash: string;
  generatedAt: string;
  metadata: CaraOutputMetadata;
}

export interface CaraTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CaraOutputMetadata {
  modelVersion?: string;
  finishReason?: string;
  safetyFlags?: string[];
  evidenceSourcesUsed?: string[];
  limitations?: string[];
  confidence?: "high" | "medium" | "low";
}

// ── Redaction ─────────────────────────────────────────────────────────────

export interface CaraRedactionEntry {
  placeholder: string;           // e.g. "[CHILD_1]"
  category: CaraRedactionCategory;
  originalLength: number;        // length of original, never store actual
  position: { start: number; end: number };
}

export type CaraRedactionCategory =
  | "child_name"
  | "staff_name"
  | "dob"
  | "address"
  | "home_name"
  | "school_name"
  | "local_authority"
  | "nhs_info"
  | "child_identifier"
  | "phone_number"
  | "email"
  | "placement_name";

// ── Approval Record ───────────────────────────────────────────────────────

export interface CaraApprovalRecord {
  id: string;
  taskResultId: string;
  taskType: CaraTaskType;
  generatedByModel: CaraModelId;
  provider: CaraProviderName;
  riskLevel: CaraRiskLevel;
  sensitivityLevel: CaraDataSensitivity;
  promptHash: string;
  redactionApplied: boolean;
  status: CaraApprovalStatus;
  generatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvalNotes?: string;
  finalisedBy?: string;
  finalisedAt?: string;
  organisationId: string;
  homeId?: string;
  childId?: string;
}

// ── Audit Log ─────────────────────────────────────────────────────────────

export interface CaraAuditLogEntry {
  id: string;
  userId: string;
  organisationId: string;
  homeId?: string;
  childId?: string;
  staffId?: string;
  taskType: CaraTaskType;
  provider: CaraProviderName;
  model: CaraModelId;
  riskLevel: CaraRiskLevel;
  sensitivityLevel: CaraDataSensitivity;
  redactionApplied: boolean;
  approvalRequired: boolean;
  promptHash: string;
  outputHash: string;
  tokenUsage: CaraTokenUsage;
  estimatedCost: number;
  latencyMs: number;
  status: "success" | "failed" | "blocked" | "timeout" | "rate_limited";
  errorCode?: string;
  createdAt: string;
}

// ── Evidence ──────────────────────────────────────────────────────────────

export interface CaraEvidenceQuery {
  query: string;
  organisationId: string;
  homeId?: string;
  childId?: string;
  staffId?: string;
  sourceTypes?: string[];
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  userId: string;
  userRole: CaraRole;
}

export interface CaraEvidenceResult {
  id: string;
  documentTitle: string;
  sourceType: string;
  date: string;
  childId?: string;
  homeId?: string;
  staffId?: string;
  relevanceScore: number;
  summary: string;
  excerpt: string;
  permissionCheck: boolean;
  canUseInReporting: boolean;
  metadata: Record<string, unknown>;
}

// ── Studio ────────────────────────────────────────────────────────────────

export interface CaraStudioRequest {
  type: CaraStudioSessionType;
  childId: string;
  childContext: CaraTaskContext;
  focusArea?: string;
  duration?: number;                  // minutes
  staffId: string;
  userId: string;
  userRole: CaraRole;
  organisationId: string;
  homeId: string;
  additionalInstructions?: string;
}

export type CaraStudioSessionType =
  | "keywork_session"
  | "direct_work"
  | "social_story"
  | "flashcards"
  | "therapeutic_activity"
  | "emotional_regulation"
  | "independence_skills"
  | "missing_return_discussion"
  | "exploitation_awareness"
  | "relationship_work"
  | "behaviour_support"
  | "restorative_conversation"
  | "child_friendly_summary"
  | "visual_worksheet"
  | "training_pack"
  | "reflective_supervision"
  | "shift_handover_briefing"
  | "staff_briefing";

export interface CaraStudioOutput {
  id: string;
  type: CaraStudioSessionType;
  sessionTitle: string;
  purpose: string;
  intendedOutcome: string;
  materialsNeeded: string[];
  preparationNotes: string;
  openingScript: string;
  mainActivity: string;
  reflectiveQuestions: string[];
  closingActivity: string;
  riskConsiderations: string[];
  staffGuidance: string;
  adaptations: string[];
  recordingPrompts: string[];
  followUpActions: string[];
  carePlanLinks: string[];
  qualityStandardsMapping: string[];
  generatedAt: string;
  model: CaraModelId;
  provider: CaraProviderName;
  approvalStatus: CaraApprovalStatus;
}

// ── QA ────────────────────────────────────────────────────────────────────

export interface CaraQAReviewRequest {
  recordId: string;
  recordType: string;
  recordContent: string;
  childId?: string;
  homeId: string;
  organisationId: string;
  userId: string;
  userRole: CaraRole;
}

export interface CaraQAReviewResult {
  id: string;
  recordId: string;
  qaScore: number;                    // 0-100
  strengths: string[];
  concerns: string[];
  requiredActions: string[];
  suggestedOversightNote: string;
  suggestedStaffFeedback: string;
  relatedEvidence: string[];
  escalationLevel: CaraRiskLevel;
  escalationRecommendation?: string;
  dueDate?: string;
  responsiblePerson?: string;
  generatedAt: string;
  model: CaraModelId;
  approvalStatus: CaraApprovalStatus;
}

// ── Cost ──────────────────────────────────────────────────────────────────

export interface CaraCostEstimate {
  provider: CaraProviderName;
  model: CaraModelId;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostGBP: number;
  withinBudget: boolean;
  dailySpendRemaining: number;
  monthlySpendRemaining: number;
}

export interface CaraCostUsage {
  organisationId: string;
  homeId?: string;
  userId?: string;
  provider: CaraProviderName;
  model: CaraModelId;
  inputTokens: number;
  outputTokens: number;
  costGBP: number;
  date: string;
}

// ── Safety Events ─────────────────────────────────────────────────────────

export interface CaraSafetyEvent {
  id: string;
  type: CaraSafetyEventType;
  severity: CaraRiskLevel;
  description: string;
  userId: string;
  organisationId: string;
  homeId?: string;
  childId?: string;
  taskType: CaraTaskType;
  provider?: CaraProviderName;
  blocked: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export type CaraSafetyEventType =
  | "sensitive_data_detected"
  | "unsafe_routing_blocked"
  | "provider_blocked"
  | "redaction_failure"
  | "approval_bypassed_attempt"
  | "role_permission_denied"
  | "cost_limit_exceeded"
  | "critical_escalation"
  | "provider_error"
  | "data_residency_violation";
