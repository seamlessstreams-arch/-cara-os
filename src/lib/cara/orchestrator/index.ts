// ══════════════════════════════════════════════════════════════════════════════
// Cara INTELLIGENCE — ORCHESTRATION ENGINE
//
// The main orchestration entry point. Receives an CaraRequest, coordinates the
// full intelligence pipeline, and returns a structured CaraResponse.
//
// Pipeline steps:
//   1. Authentication / permission check
//   2. Risk classification
//   3. Agent routing
//   4. Evidence retrieval (if needed)
//   5. Prompt building
//   6. Model invocation
//   7. Safety governor check
//   8. Response formatting
//   9. Audit logging + cost tracking
//  10. Return response
//
// All output is "Cara suggested draft" until a human approves and commits.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { hasIntelligencePermission } from "../intelligence-permissions";
import { retrieveCaraEvidence } from "../evidence";
import { generateCaraJson } from "../provider";
import { routeRequest } from "./router";
import { reviewSafety, buildBlockedResponse } from "./safety-governor";
import { buildSystemPrompt, buildUserPrompt } from "./prompt-builder";
import { getModelProfile } from "./model-registry";
import { recordCost, persistCost } from "./cost-tracker";
import { formatResponse, formatBlockedResponse } from "./response-formatter";
import type { CaraRequest, CaraResponse, EvidenceItem } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

// ── Main Orchestration Entry Point ────────────────────────────────────────

export async function orchestrate(request: CaraRequest): Promise<CaraResponse> {
  const startTime = Date.now();

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 1: Authentication & Permission Check
  // ──────────────────────────────────────────────────────────────────────────

  if (!request.userId || !request.homeId || !request.role) {
    return buildPermissionDeniedResponse(
      "Missing required fields: userId, homeId, and role are required.",
      request,
    );
  }

  if (!hasIntelligencePermission(request.role, "askCara")) {
    return buildPermissionDeniedResponse(
      `Role "${request.role}" does not have permission to use Cara Intelligence.`,
      request,
    );
  }

  if (!request.query || request.query.trim().length < 3) {
    return buildPermissionDeniedResponse(
      "Query is too short. Please provide a meaningful question or request.",
      request,
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 2 & 3: Risk Classification & Agent Routing
  // ──────────────────────────────────────────────────────────────────────────

  const routeDecision = routeRequest(request);

  // Check if user has permission for the determined action
  if (routeDecision.riskLevel === "critical" || routeDecision.riskLevel === "high") {
    if (!hasIntelligencePermission(request.role, "viewEvidence")) {
      return buildPermissionDeniedResponse(
        "This query involves high-risk themes. Your role does not have permission to access this level of intelligence. Please speak to your manager.",
        request,
      );
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 4: Evidence Retrieval (if needed)
  // ──────────────────────────────────────────────────────────��───────────────

  let evidence: EvidenceItem[] = [];

  if (routeDecision.requiresRAG) {
    try {
      const rawEvidence = await retrieveCaraEvidence({
        homeId: request.homeId,
        childId: request.childId,
        searchText: request.query,
        maxItems: routeDecision.riskLevel === "critical" ? 20 : 12,
      });

      evidence = rawEvidence.map((item) => ({
        sourceTable: item.sourceTable,
        sourceId: item.sourceId,
        sourceDate: item.sourceDate,
        sourceTitle: item.sourceTitle,
        sourceExcerpt: item.sourceExcerpt,
        sourceAuthorId: item.sourceAuthorId,
        relevanceScore: item.relevanceScore,
        evidenceType: item.evidenceType ?? "record",
        regulationRefs: item.regulationRefs ?? [],
        qualityStandardRefs: item.qualityStandardRefs ?? [],
      }));
    } catch (err) {
      console.error("[cara-orchestrator] Evidence retrieval failed:", err);
      // Continue without evidence — the safety governor will flag low confidence
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 5: Prompt Building
  // ──────────────────────────────────────────────────────────────────────────

  const systemPrompt = buildSystemPrompt({
    request,
    routeDecision,
    evidence,
  });

  const userPrompt = buildUserPrompt(request);

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 6: Model Invocation
  // ──────────────────────────────────────────────────────────────────────────

  const modelProfile = getModelProfile(routeDecision.requiredModelProfile);
  let rawOutput: string;
  let inputTokens = 0;
  let outputTokens = 0;
  let costEntry: ReturnType<typeof recordCost> | undefined;

  try {
    const invocationStart = Date.now();

    const result = await generateCaraJson({
      model: modelProfile.modelId,
      temperature: modelProfile.temperature,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const invocationEnd = Date.now();

    // Extract the text response — generateCaraJson returns parsed JSON or raw text
    if (typeof result === "string") {
      rawOutput = result;
    } else if (result && typeof result === "object" && "answer" in (result as Record<string, unknown>)) {
      rawOutput = (result as Record<string, unknown>).answer as string;
    } else if (result && typeof result === "object") {
      // The provider returned JSON — extract meaningful content
      rawOutput = extractTextFromResponse(result);
    } else {
      rawOutput = String(result ?? "");
    }

    // Estimate tokens (rough: 1 token ~ 4 chars for English text)
    inputTokens = Math.ceil((systemPrompt.length + userPrompt.length) / 4);
    outputTokens = Math.ceil(rawOutput.length / 4);

    // Record latency
    const latencyMs = invocationEnd - invocationStart;
    costEntry = recordCost({
      modelId: modelProfile.modelId,
      inputTokens,
      outputTokens,
      latencyMs,
    });
  } catch (err) {
    console.error("[cara-orchestrator] Model invocation failed:", err);

    // Return a graceful error response
    const auditId = await writeAuditEntry({
      request,
      routeDecision,
      status: "error",
      errorMessage: err instanceof Error ? err.message : "Unknown model invocation error",
    });

    return {
      answer: "Cara was unable to process your request at this time. The AI provider returned an error. Please try again shortly, or contact your system administrator if the problem persists.",
      agentUsed: routeDecision.requiredAgent,
      modelProfile: routeDecision.requiredModelProfile,
      riskLevel: routeDecision.riskLevel,
      confidence: 0,
      evidenceUsed: evidence,
      suggestedActions: [],
      requiresApproval: false,
      canSave: false,
      escalationRecommended: false,
      safetyNotes: ["Model invocation failed — no AI output was produced."],
      auditId,
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 7: Safety Governor Check
  // ──────────────────────────────────────────────────────────────────────────

  const safetyReview = reviewSafety({
    rawOutput,
    riskLevel: routeDecision.riskLevel,
    evidenceRetrieved: evidence,
    query: request.query,
  });

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 8: Response Formatting
  // ──────────────────────────────────────────────────────────────────────────

  let response: CaraResponse;

  if (safetyReview.blocked) {
    const blockedAnswer = buildBlockedResponse(safetyReview, routeDecision.riskLevel);
    response = formatBlockedResponse({
      blockReason: safetyReview.blockReason ?? "Safety check failed.",
      blockedAnswer,
      request,
      routeDecision,
      safetyReview,
      evidence,
      auditId: "", // Will be set after audit write
      cost: costEntry,
    });
  } else {
    response = formatResponse({
      rawOutput: safetyReview.sanitisedOutput ?? rawOutput,
      request,
      routeDecision,
      safetyReview,
      evidence,
      auditId: "", // Will be set after audit write
      cost: costEntry,
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 9: Audit Logging & Cost Tracking
  // ──────────────────────────────────────────────────────────────────────────

  const auditId = await writeAuditEntry({
    request,
    routeDecision,
    status: safetyReview.blocked ? "blocked" : "completed",
    safetyReview,
    confidence: response.confidence,
    evidenceCount: evidence.length,
  });

  // Persist cost asynchronously (fire and forget)
  if (costEntry) {
    persistCost({
      homeId: request.homeId,
      userId: request.userId,
      auditId,
      cost: costEntry,
      agentId: routeDecision.requiredAgent,
      riskLevel: routeDecision.riskLevel,
    }).catch((err) => {
      console.error("[cara-orchestrator] Cost persistence failed:", err);
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 10: Return Response
  // ────────────────────────────────────────────────────────────────���─────────

  return {
    ...response,
    auditId,
  };
}

// ── Helper: Extract text from structured response ─────────────────────────

function extractTextFromResponse(result: unknown): string {
  if (!result || typeof result !== "object") return "";

  const obj = result as Record<string, unknown>;

  // Try common response shapes
  if (typeof obj.answer === "string") return obj.answer;
  if (typeof obj.content === "string") return obj.content;
  if (typeof obj.text === "string") return obj.text;
  if (typeof obj.response === "string") return obj.response;

  // If the object has an executiveSummary + answer pattern (existing Cara shape)
  if (typeof obj.executiveSummary === "string" && typeof obj.answer === "string") {
    return obj.answer;
  }

  // Last resort — stringify for inspection
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return "";
  }
}

// ── Helper: Build permission denied response ──────────────────────────────

function buildPermissionDeniedResponse(
  reason: string,
  request: CaraRequest,
): CaraResponse {
  return {
    answer: reason,
    agentUsed: "none",
    modelProfile: "balanced",
    riskLevel: "low",
    confidence: 0,
    evidenceUsed: [],
    suggestedActions: [],
    requiresApproval: false,
    canSave: false,
    escalationRecommended: false,
    safetyNotes: [`Access denied: ${reason}`],
    auditId: "permission-denied",
    blocked: true,
    blockReason: reason,
  };
}

// ── Helper: Write Audit Entry ─────────────────────────────────────────────

async function writeAuditEntry(input: {
  request: CaraRequest;
  routeDecision: {
    requiredAgent: string;
    riskLevel: string;
    taskType: string;
    requiredModelProfile: string;
  };
  status: "completed" | "blocked" | "error";
  safetyReview?: {
    blocked: boolean;
    warnings: string[];
    safetyNotes: string[];
  };
  confidence?: number;
  evidenceCount?: number;
  errorMessage?: string;
}): Promise<string> {
  const demoId = `cara-orch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (!isSupabaseEnabled()) return demoId;

  const sb = createServerClient();
  if (!sb) return demoId;

  try {
    const { data, error } = await (sb.from("aria_orchestrator_audit") as SB)
      .insert({
        home_id: input.request.homeId,
        user_id: input.request.userId,
        child_id: input.request.childId ?? null,
        organisation_id: input.request.organisationId ?? null,
        agent_id: input.routeDecision.requiredAgent,
        risk_level: input.routeDecision.riskLevel,
        task_type: input.routeDecision.taskType,
        model_profile: input.routeDecision.requiredModelProfile,
        status: input.status,
        query_summary: input.request.query.slice(0, 500),
        confidence: input.confidence ?? null,
        evidence_count: input.evidenceCount ?? 0,
        safety_blocked: input.safetyReview?.blocked ?? false,
        safety_warnings: input.safetyReview?.warnings ?? [],
        safety_notes: input.safetyReview?.safetyNotes ?? [],
        error_message: input.errorMessage ?? null,
        source_page: input.request.currentPage ?? null,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[cara-orchestrator] Audit write failed:", error?.message);
      return demoId;
    }

    return data.id;
  } catch (err) {
    console.error("[cara-orchestrator] Audit write exception:", err);
    return demoId;
  }
}

// ── Re-export types for convenience ───────────────────────────────────────

export type { CaraRequest, CaraResponse } from "./types";
