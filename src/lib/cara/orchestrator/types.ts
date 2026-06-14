// ══════════════════════════════════════════════════════════════════════════════
// Cara ORCHESTRATOR — TYPE DEFINITIONS
//
// All types for the orchestration system: request/response shapes, routing
// decisions, risk classification, evidence items, suggested actions, safety
// review results, cost entries, and model profiles.
//
// These types are specific to the orchestrator layer. They extend but do not
// duplicate types from the core Cara type system in ../types.ts.
// ══════════════════════════════════════════════════════════════════════════════

import type { AgentId } from "@/types/cara-reports";

// ── Risk Levels ───────────────────────────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high" | "critical";

// ── Model Profiles ────────────────────────────────────────────────────────

export type ModelProfileId =
  | "fast-cheap"
  | "balanced"
  | "best-reasoning"
  | "highest-safety";

export interface ModelProfile {
  id: ModelProfileId;
  modelId: string;
  maxTokens: number;
  temperature: number;
  estimatedCostPer1kTokens: number;
  maxLatencyMs: number;
  description: string;
}

// ── Task Types ────────────────────────────────────────────────────────────

export type TaskType =
  | "admin"
  | "reasoning"
  | "safeguarding"
  | "regulatory"
  | "therapeutic"
  | "document"
  | "voice"
  | "report"
  | "task"
  | "search"
  | "risk_assessment"
  | "oversight"
  | "workforce";

// ── Evidence Item (orchestrator-specific) ─────────────────────────────────

export interface EvidenceItem {
  sourceTable: string;
  sourceId: string;
  sourceDate?: string;
  sourceTitle?: string;
  sourceExcerpt: string;
  sourceAuthorId?: string | null;
  relevanceScore: number;
  evidenceType: string;
  regulationRefs: string[];
  qualityStandardRefs: string[];
}

// ── Suggested Actions ─────────────────────────────────────────────────────

export interface SuggestedAction {
  title: string;
  description: string;
  ownerRole: string;
  priority: "immediate" | "today" | "this_week" | "this_month" | "monitor";
  actionType: "escalate" | "review" | "create" | "update" | "notify" | "task";
  targetTable?: string;
  targetId?: string;
  rationale: string;
}

// ── CaraRequest ───────────────────────────────────────────────────────────

export interface CaraRequest {
  userId: string;
  role: string;
  homeId: string;
  organisationId?: string;
  childId?: string;
  query: string;
  sourceContext?: string;
  requestedAction?: string;
  currentPage?: string;
  attachedDocuments?: string[];
  voiceTranscript?: string;
  saveIntent?: boolean;
}

// ── CaraResponse ──────────────────────────────────────────────────────────

export interface CaraResponse {
  answer: string;
  agentUsed: string;
  modelProfile: ModelProfileId;
  riskLevel: RiskLevel;
  confidence: number;
  evidenceUsed: EvidenceItem[];
  suggestedActions: SuggestedAction[];
  requiresApproval: boolean;
  canSave: boolean;
  escalationRecommended: boolean;
  safetyNotes: string[];
  auditId: string;
  blocked?: boolean;
  blockReason?: string;
  cost?: CostEntry;
}

// ── CaraSession ───────────────────────────────────────────────────────────

export interface CaraSession {
  sessionId: string;
  userId: string;
  role: string;
  homeId: string;
  childId?: string;
  startedAt: string;
  requests: Array<{
    requestId: string;
    query: string;
    response: CaraResponse;
    timestamp: string;
  }>;
}

// ── Route Decision ────────────────────────────────────────────────────────

export interface RouteDecision {
  taskType: TaskType;
  riskLevel: RiskLevel;
  requiredAgent: AgentId;
  requiredModelProfile: ModelProfileId;
  requiresRAG: boolean;
  requiresHumanApproval: boolean;
  requiresSafeguardingEscalation: boolean;
  canAutoDraft: boolean;
  canAutoSave: boolean;
  routingReason: string;
  riskFactors: string[];
}

// ── Risk Classification ───────────────────────────────────────────────────

export interface RiskClassification {
  level: RiskLevel;
  factors: string[];
  escalationRequired: boolean;
  safeguardingConcern: boolean;
  regulatoryConcern: boolean;
  managerReviewRequired: boolean;
}

// ── Safety Review ─────────────────────────────────────────────────────────

export interface SafetyReview {
  passed: boolean;
  blocked: boolean;
  blockReason?: string;
  warnings: string[];
  safetyNotes: string[];
  sanitisedOutput?: string;
  escalationRequired: boolean;
  managerApprovalRequired: boolean;
  reg40ConsiderationRequired: boolean;
  ladoConsiderationRequired: boolean;
}

// ── Cost Entry ────────────────────────────────────────────────────────────

export interface CostEntry {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  timestamp: string;
}
