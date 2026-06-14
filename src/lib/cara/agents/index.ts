// ══════════════════════════════════════════════════════════════════════════════
// Cara — SPECIALIST AGENT INDEX
//
// Central export for all specialist agent implementations. Provides individual
// agent exports and a unified `getSpecialistAgent()` lookup function that
// returns the execute interface for any registered agent.
// ══════════════════════════════════════════════════════════════════════════════

import type { RiskLevel, ModelProfileId } from "../orchestrator/types";

// ── Re-export Agent Modules ──────────────────────────────────────────────────

export * as AdminAgent from "./admin-agent";
export * as ReasoningAgent from "./reasoning-agent";
export * as SafeguardingAgent from "./safeguarding-agent";
export * as RegulatoryAgent from "./regulatory-agent";
export * as TherapeuticPracticeAgent from "./therapeutic-practice-agent";
export * as DocumentIntelligenceAgent from "./document-intelligence-agent";
export * as VoiceReflectionAgent from "./voice-reflection-agent";
export * as ReportWriterAgent from "./report-writer-agent";
export * as TaskActionAgent from "./task-action-agent";
export * as SearchRagAgent from "./search-rag-agent";

// ── Import Configs ───────────────────────────────────────────────────────────

import { AGENT_CONFIG as ADMIN_CONFIG, executeAgent as executeAdmin, buildAgentPrompt as buildAdminPrompt, extractActions as extractAdminActions } from "./admin-agent";
import { AGENT_CONFIG as REASONING_CONFIG, executeAgent as executeReasoning, buildAgentPrompt as buildReasoningPrompt, extractActions as extractReasoningActions } from "./reasoning-agent";
import { AGENT_CONFIG as SAFEGUARDING_CONFIG, executeAgent as executeSafeguarding, buildAgentPrompt as buildSafeguardingPrompt, extractActions as extractSafeguardingActions } from "./safeguarding-agent";
import { AGENT_CONFIG as REGULATORY_CONFIG, executeAgent as executeRegulatory, buildAgentPrompt as buildRegulatoryPrompt, extractActions as extractRegulatoryActions } from "./regulatory-agent";
import { AGENT_CONFIG as THERAPEUTIC_CONFIG, executeAgent as executeTherapeutic, buildAgentPrompt as buildTherapeuticPrompt, extractActions as extractTherapeuticActions } from "./therapeutic-practice-agent";
import { AGENT_CONFIG as DOCUMENT_CONFIG, executeAgent as executeDocument, buildAgentPrompt as buildDocumentPrompt, extractActions as extractDocumentActions } from "./document-intelligence-agent";
import { AGENT_CONFIG as VOICE_CONFIG, executeAgent as executeVoice, buildAgentPrompt as buildVoicePrompt, extractActions as extractVoiceActions } from "./voice-reflection-agent";
import { AGENT_CONFIG as REPORT_CONFIG, executeAgent as executeReport, buildAgentPrompt as buildReportPrompt, extractActions as extractReportActions } from "./report-writer-agent";
import { AGENT_CONFIG as TASK_CONFIG, executeAgent as executeTask, buildAgentPrompt as buildTaskPrompt, extractActions as extractTaskActions } from "./task-action-agent";
import { AGENT_CONFIG as SEARCH_CONFIG, executeAgent as executeSearch, buildAgentPrompt as buildSearchPrompt, extractActions as extractSearchActions } from "./search-rag-agent";

// ── Agent Context & Result Types (re-exported for convenience) ───────────────

export interface AgentContext {
  request: import("../orchestrator/types").CaraRequest;
  evidence: import("../orchestrator/types").EvidenceItem[];
  systemPrompt: string;
  modelProfile: string;
}

export interface AgentResult {
  content: string;
  suggestedActions: { title: string; description: string; priority: "low" | "medium" | "high" | "urgent"; owner?: string }[];
  confidence: number;
  additionalSafetyFlags: string[];
}

// ── Agent Config Type ────────────────────────────────────────────────────────

export interface SpecialistAgentConfig {
  id: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  modelProfile: ModelProfileId;
}

// ── Specialist Agent Interface ───────────────────────────────────────────────

export interface SpecialistAgent {
  config: SpecialistAgentConfig;
  execute: (context: AgentContext) => Promise<AgentResult>;
  buildPrompt: (context: AgentContext) => string;
  extractActions: (content: string) => import("../orchestrator/types").SuggestedAction[];
}

// ── Agent Registry ───────────────────────────────────────────────────────────

const SPECIALIST_AGENTS: Record<string, SpecialistAgent> = {
  admin_agent: {
    config: ADMIN_CONFIG,
    execute: executeAdmin,
    buildPrompt: buildAdminPrompt,
    extractActions: extractAdminActions,
  },
  reasoning_agent: {
    config: REASONING_CONFIG,
    execute: executeReasoning,
    buildPrompt: buildReasoningPrompt,
    extractActions: extractReasoningActions,
  },
  safeguarding_agent: {
    config: SAFEGUARDING_CONFIG,
    execute: executeSafeguarding,
    buildPrompt: buildSafeguardingPrompt,
    extractActions: extractSafeguardingActions,
  },
  regulatory_agent: {
    config: REGULATORY_CONFIG,
    execute: executeRegulatory,
    buildPrompt: buildRegulatoryPrompt,
    extractActions: extractRegulatoryActions,
  },
  therapeutic_practice_agent: {
    config: THERAPEUTIC_CONFIG,
    execute: executeTherapeutic,
    buildPrompt: buildTherapeuticPrompt,
    extractActions: extractTherapeuticActions,
  },
  document_intelligence_agent: {
    config: DOCUMENT_CONFIG,
    execute: executeDocument,
    buildPrompt: buildDocumentPrompt,
    extractActions: extractDocumentActions,
  },
  voice_reflection_agent: {
    config: VOICE_CONFIG,
    execute: executeVoice,
    buildPrompt: buildVoicePrompt,
    extractActions: extractVoiceActions,
  },
  report_writer_agent: {
    config: REPORT_CONFIG,
    execute: executeReport,
    buildPrompt: buildReportPrompt,
    extractActions: extractReportActions,
  },
  task_action_agent: {
    config: TASK_CONFIG,
    execute: executeTask,
    buildPrompt: buildTaskPrompt,
    extractActions: extractTaskActions,
  },
  search_rag_agent: {
    config: SEARCH_CONFIG,
    execute: executeSearch,
    buildPrompt: buildSearchPrompt,
    extractActions: extractSearchActions,
  },
};

// ── Lookup Functions ─────────────────────────────────────────────────────────

/**
 * Get a specialist agent by its ID. Returns the full agent interface including
 * config, execute function, prompt builder, and action extractor.
 *
 * @throws Error if the agent ID is not found.
 */
export function getAgent(agentId: string): SpecialistAgent {
  const agent = SPECIALIST_AGENTS[agentId];
  if (!agent) {
    throw new Error(
      `Unknown specialist agent: "${agentId}". Available agents: ${Object.keys(SPECIALIST_AGENTS).join(", ")}`
    );
  }
  return agent;
}

/**
 * Check whether a specialist agent exists for the given ID.
 */
export function hasAgent(agentId: string): boolean {
  return agentId in SPECIALIST_AGENTS;
}

/**
 * Get all registered specialist agents.
 */
export function getAllAgents(): SpecialistAgent[] {
  return Object.values(SPECIALIST_AGENTS);
}

/**
 * Get all agent IDs.
 */
export function getAgentIds(): string[] {
  return Object.keys(SPECIALIST_AGENTS);
}

/**
 * Get all agents that match a given risk level.
 */
export function getAgentsByRiskLevel(riskLevel: RiskLevel): SpecialistAgent[] {
  return Object.values(SPECIALIST_AGENTS).filter(
    (agent) => agent.config.riskLevel === riskLevel
  );
}

/**
 * Get all agents that use a given model profile.
 */
export function getAgentsByModelProfile(modelProfile: ModelProfileId): SpecialistAgent[] {
  return Object.values(SPECIALIST_AGENTS).filter(
    (agent) => agent.config.modelProfile === modelProfile
  );
}

/**
 * Execute a specialist agent by ID with the given context.
 * Convenience function that combines lookup and execution.
 *
 * @throws Error if the agent ID is not found.
 */
export async function executeSpecialistAgent(
  agentId: string,
  context: AgentContext,
): Promise<AgentResult> {
  const agent = getAgent(agentId);
  return agent.execute(context);
}
