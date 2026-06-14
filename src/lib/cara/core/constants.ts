// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence — Constants & Configuration
// ══════════════════════════════════════════════════════════════════════════════

import type {
  CaraTaskType,
  CaraRiskLevel,
  CaraDataSensitivity,
  CaraProviderName,
} from "./types";

// ── Tasks Requiring Human Approval ────────────────────────────────────────

export const TASKS_REQUIRING_APPROVAL: CaraTaskType[] = [
  "safeguarding_analysis",
  "reg45_report",
  "annex_a_report",
  "rag44_evidence_review",
  "child_weekly_report",
  "child_review_report",
  "risk_assessment_update",
  "placement_planning",
  "behaviour_pattern_analysis",
  "incident_summary",
  "management_oversight",
  "staff_supervision_reflection",
  "quality_assurance_review",
];

// ── Critical Risk Tasks (always require RM/RI approval) ──────────────────

export const CRITICAL_RISK_TASKS: CaraTaskType[] = [
  "safeguarding_analysis",
  "risk_assessment_update",
  "placement_planning",
];

// ── Provider Sensitivity Allowances ───────────────────────────────────────
// Maps providers to the maximum sensitivity they're approved for.

export const PROVIDER_MAX_SENSITIVITY: Record<CaraProviderName, CaraDataSensitivity[]> = {
  openai: ["public", "internal", "confidential", "child_sensitive", "staff_sensitive"],
  azure_openai: ["public", "internal", "confidential", "child_sensitive", "safeguarding_sensitive", "legal_sensitive", "staff_sensitive", "health_sensitive"],
  anthropic: ["public", "internal", "confidential", "child_sensitive", "staff_sensitive", "health_sensitive"],
  bedrock: ["public", "internal", "confidential", "child_sensitive", "safeguarding_sensitive", "legal_sensitive", "staff_sensitive", "health_sensitive"],
  vertex_ai: ["public", "internal", "confidential", "child_sensitive", "staff_sensitive"],
  mistral: ["public", "internal", "confidential", "staff_sensitive"],
  voyage: ["public", "internal", "confidential", "child_sensitive", "staff_sensitive"],
  cohere: ["public", "internal", "confidential"],
  perplexity: ["public"],
  black_forest_labs: ["public", "internal"],
  recraft: ["public", "internal"],
  groq: ["public", "internal", "confidential"],
  cerebras: ["public", "internal", "confidential"],
};

// ── Enterprise-Governed Providers ─────────────────────────────────────────
// These providers have enterprise governance and data processing agreements.

export const ENTERPRISE_GOVERNED_PROVIDERS: CaraProviderName[] = [
  "azure_openai",
  "bedrock",
];

// ── Provider Cost Per 1K Tokens (GBP estimates) ──────────────────────────

export const PROVIDER_COST_PER_1K: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 0.002, output: 0.008 },
  "gpt-4o-mini": { input: 0.00012, output: 0.00048 },
  "gpt-4-turbo": { input: 0.008, output: 0.024 },
  "claude-sonnet-4-20250514": { input: 0.0024, output: 0.012 },
  "claude-opus-4-20250514": { input: 0.012, output: 0.06 },
  "claude-haiku-3": { input: 0.0002, output: 0.001 },
  "mistral-large-latest": { input: 0.002, output: 0.005 },
  "mistral-small-latest": { input: 0.0008, output: 0.002 },
  "gemini-1.5-pro": { input: 0.001, output: 0.003 },
  "gemini-1.5-flash": { input: 0.00006, output: 0.00024 },
  "voyage-3": { input: 0.0001, output: 0 },
  "voyage-3-lite": { input: 0.00002, output: 0 },
  "cohere-rerank-3": { input: 0.0008, output: 0 },
  "perplexity-sonar": { input: 0.0008, output: 0.0008 },
};

// ── Default Routing Preferences ──────────────────────────────────────────

export const TASK_PROVIDER_PREFERENCE: Partial<Record<CaraTaskType, CaraProviderName[]>> = {
  // Anthropic for warm, reflective, child-centred content
  keywork_session_plan: ["anthropic", "openai", "azure_openai"],
  direct_work_session: ["anthropic", "openai", "azure_openai"],
  staff_briefing: ["anthropic", "openai", "azure_openai"],
  staff_supervision_reflection: ["anthropic", "openai", "azure_openai"],
  child_weekly_report: ["anthropic", "openai", "azure_openai"],
  child_review_report: ["anthropic", "azure_openai", "openai"],

  // Azure/Bedrock for high-risk governance
  safeguarding_analysis: ["azure_openai", "bedrock", "anthropic"],
  reg45_report: ["azure_openai", "anthropic", "bedrock"],
  annex_a_report: ["azure_openai", "anthropic", "bedrock"],
  rag44_evidence_review: ["azure_openai", "bedrock", "anthropic"],
  risk_assessment_update: ["azure_openai", "bedrock", "anthropic"],
  management_oversight: ["azure_openai", "anthropic", "openai"],
  placement_planning: ["azure_openai", "bedrock", "anthropic"],

  // OpenAI for structured reasoning and planning
  daily_task_generation: ["openai", "anthropic", "mistral"],
  form_prompt_support: ["openai", "mistral", "anthropic"],
  behaviour_pattern_analysis: ["openai", "anthropic", "azure_openai"],
  incident_summary: ["openai", "anthropic", "azure_openai"],

  // Mistral for classification and extraction
  document_extraction: ["mistral", "openai", "anthropic"],
  document_classification: ["mistral", "openai", "anthropic"],
  admin_summary: ["mistral", "openai", "anthropic"],
  email_draft: ["mistral", "openai", "anthropic"],

  // Vertex AI for multimodal and creative
  training_material_generation: ["vertex_ai", "anthropic", "openai"],
  creative_resource_generation: ["vertex_ai", "anthropic", "openai"],

  // Perplexity for public research only
  public_research: ["perplexity"],
  competitor_research: ["perplexity"],

  // Evidence search
  evidence_search: ["voyage", "cohere", "openai"],
  filing_cabinet_search: ["voyage", "cohere", "openai"],
  policy_search: ["voyage", "cohere", "openai"],

  // QA
  quality_assurance_review: ["anthropic", "openai", "azure_openai"],
};

// ── Risk Classification by Task Type ─────────────────────────────────────

export const TASK_DEFAULT_RISK: Record<CaraTaskType, CaraRiskLevel> = {
  safeguarding_analysis: "critical",
  reg45_report: "high",
  annex_a_report: "high",
  rag44_evidence_review: "high",
  child_weekly_report: "medium",
  child_review_report: "high",
  keywork_session_plan: "low",
  direct_work_session: "low",
  staff_briefing: "low",
  staff_supervision_reflection: "medium",
  placement_planning: "critical",
  risk_assessment_update: "critical",
  behaviour_pattern_analysis: "medium",
  incident_summary: "medium",
  management_oversight: "high",
  daily_task_generation: "low",
  form_prompt_support: "low",
  policy_search: "low",
  evidence_search: "medium",
  filing_cabinet_search: "low",
  public_research: "low",
  competitor_research: "low",
  training_material_generation: "low",
  creative_resource_generation: "low",
  admin_summary: "low",
  email_draft: "low",
  document_extraction: "low",
  document_classification: "low",
  quality_assurance_review: "medium",
};

// ── Sensitivity Classification Defaults ──────────────────────────────────

export const TASK_DEFAULT_SENSITIVITY: Partial<Record<CaraTaskType, CaraDataSensitivity>> = {
  safeguarding_analysis: "safeguarding_sensitive",
  risk_assessment_update: "safeguarding_sensitive",
  reg45_report: "child_sensitive",
  annex_a_report: "child_sensitive",
  rag44_evidence_review: "child_sensitive",
  child_weekly_report: "child_sensitive",
  child_review_report: "child_sensitive",
  placement_planning: "child_sensitive",
  behaviour_pattern_analysis: "child_sensitive",
  incident_summary: "child_sensitive",
  staff_supervision_reflection: "staff_sensitive",
  management_oversight: "confidential",
  public_research: "public",
  competitor_research: "public",
  training_material_generation: "internal",
  creative_resource_generation: "internal",
  admin_summary: "internal",
  email_draft: "internal",
  document_extraction: "confidential",
  document_classification: "confidential",
};

// ── Retry Configuration ───────────────────────────────────────────────────

export const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

// ── Timeout Configuration ─────────────────────────────────────────────────

export const DEFAULT_TIMEOUT_MS = 30000;
export const LONG_TASK_TIMEOUT_MS = 120000;
export const STREAM_TIMEOUT_MS = 60000;

// ── Cost Limits (GBP) ────────────────────────────────────────────────────

export const DEFAULT_COST_LIMITS = {
  perRequestMax: 0.50,
  dailyPerUser: 5.00,
  dailyPerHome: 25.00,
  dailyPerOrganisation: 100.00,
  monthlyPerOrganisation: 2000.00,
};
