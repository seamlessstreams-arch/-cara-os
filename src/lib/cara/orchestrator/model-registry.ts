// ══════════════════════════════════════════════════════════════════════════════
// Cara ORCHESTRATOR — MODEL REGISTRY
//
// Defines model profiles and maps task types / agents to the appropriate model.
// Each profile balances cost, latency, quality, and safety for its intended
// use case. The orchestrator uses this to select the right model for each
// request based on the router's classification.
//
// Model IDs reference environment-configurable values with sensible defaults.
// ══════════════════════════════════════════════════════════════════════════════

import type { AgentId } from "@/types/cara-reports";
import type { ModelProfile, ModelProfileId, TaskType } from "./types";

// ── Model Profiles ────────────────────────────────────────────────────────

export const MODEL_PROFILES: Record<ModelProfileId, ModelProfile> = {
  "fast-cheap": {
    id: "fast-cheap",
    modelId: (process.env.CARA_MODEL_FAST ?? process.env.CARA_MODEL_FAST) ?? "claude-haiku-4-20250514",
    maxTokens: 2048,
    temperature: 0.2,
    estimatedCostPer1kTokens: 0.00025,
    maxLatencyMs: 3000,
    description: "Fast, low-cost model for admin tasks, simple rewrites, and filing",
  },
  balanced: {
    id: "balanced",
    modelId: (process.env.CARA_MODEL ?? process.env.CARA_MODEL) ?? "claude-sonnet-4-20250514",
    maxTokens: 4096,
    temperature: 0.15,
    estimatedCostPer1kTokens: 0.003,
    maxLatencyMs: 8000,
    description: "Standard workhorse for most intelligence tasks",
  },
  "best-reasoning": {
    id: "best-reasoning",
    modelId: (process.env.CARA_MODEL_REASONING ?? process.env.CARA_MODEL_REASONING) ?? "claude-sonnet-4-20250514",
    maxTokens: 8192,
    temperature: 0.1,
    estimatedCostPer1kTokens: 0.003,
    maxLatencyMs: 15000,
    description: "Extended thinking for oversight, pattern detection, and complex analysis",
  },
  "highest-safety": {
    id: "highest-safety",
    modelId: (process.env.CARA_MODEL_SAFETY ?? process.env.CARA_MODEL_SAFETY) ?? "claude-sonnet-4-20250514",
    maxTokens: 4096,
    temperature: 0.05,
    estimatedCostPer1kTokens: 0.003,
    maxLatencyMs: 10000,
    description: "Strict safety constraints for safeguarding and regulatory outputs",
  },
};

// ── Agent → Model Profile Mapping ─────────────────────────────────────────
// Each agent has a default model profile that provides the right balance of
// capability and safety for its domain.

const AGENT_MODEL_MAP: Record<AgentId, ModelProfileId> = {
  oversight_agent: "best-reasoning",
  safeguarding_agent: "highest-safety",
  report_generator_agent: "balanced",
  therapeutic_practice_agent: "balanced",
  risk_assessment_agent: "highest-safety",
  regulation45_evidence_agent: "balanced",
  workforce_agent: "balanced",
  filing_agent: "fast-cheap",
};

// ── Task Type → Model Profile Mapping ─────────────────────────────────────
// Fallback mapping when agent selection is ambiguous or for ad-hoc queries.

const TASK_MODEL_MAP: Record<TaskType, ModelProfileId> = {
  admin: "fast-cheap",
  reasoning: "best-reasoning",
  safeguarding: "highest-safety",
  regulatory: "highest-safety",
  therapeutic: "balanced",
  document: "fast-cheap",
  voice: "balanced",
  report: "balanced",
  task: "fast-cheap",
  search: "fast-cheap",
  risk_assessment: "highest-safety",
  oversight: "best-reasoning",
  workforce: "balanced",
};

// ── Lookup Functions ──────────────────────────────────────────────────────

/**
 * Get the full model profile for a given profile ID.
 */
export function getModelProfile(profileId: ModelProfileId): ModelProfile {
  return MODEL_PROFILES[profileId];
}

/**
 * Get the default model profile for a given agent.
 */
export function getModelProfileForAgent(agentId: AgentId): ModelProfile {
  const profileId = AGENT_MODEL_MAP[agentId];
  return MODEL_PROFILES[profileId];
}

/**
 * Get the model profile for a task type (used as fallback).
 */
export function getModelProfileForTask(taskType: TaskType): ModelProfile {
  const profileId = TASK_MODEL_MAP[taskType];
  return MODEL_PROFILES[profileId];
}

/**
 * Get the model profile ID for a given agent.
 */
export function getModelProfileIdForAgent(agentId: AgentId): ModelProfileId {
  return AGENT_MODEL_MAP[agentId];
}

/**
 * Get the model profile ID for a task type.
 */
export function getModelProfileIdForTask(taskType: TaskType): ModelProfileId {
  return TASK_MODEL_MAP[taskType];
}

/**
 * Override model selection for critical risk — always use highest-safety.
 * Returns the appropriate profile given risk level and initial selection.
 */
export function applyRiskOverride(
  initialProfile: ModelProfileId,
  riskLevel: "low" | "medium" | "high" | "critical",
): ModelProfileId {
  if (riskLevel === "critical") {
    return "highest-safety";
  }
  if (riskLevel === "high" && initialProfile === "fast-cheap") {
    return "balanced";
  }
  return initialProfile;
}
