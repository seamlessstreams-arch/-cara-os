// ══════════════════════════════════════════════════════════════════════════════
// Cara ORCHESTRATOR — COST TRACKER
//
// Tracks token usage, estimated cost, and latency per request. Provides cost
// estimation before invocation and actual cost recording after completion.
//
// All costs are estimates based on published pricing. Actual billing may vary
// slightly due to token counting differences between providers.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { CostEntry, ModelProfileId } from "./types";
import { getModelProfile } from "./model-registry";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

// ── Cost per 1K tokens by model (USD) ─────────────────────────────────────
// These are approximations. Update as pricing changes.

const INPUT_COST_PER_1K: Record<string, number> = {
  "claude-haiku-4-20250514": 0.00025,
  "claude-sonnet-4-20250514": 0.003,
  "gpt-4.1-mini": 0.0004,
  "gpt-4.1": 0.002,
};

const OUTPUT_COST_PER_1K: Record<string, number> = {
  "claude-haiku-4-20250514": 0.00125,
  "claude-sonnet-4-20250514": 0.015,
  "gpt-4.1-mini": 0.0016,
  "gpt-4.1": 0.008,
};

// ── Cost Estimation ───────────────────────────────────────────────────────

/**
 * Estimate the cost of a request before invocation based on the model
 * profile and estimated prompt size.
 */
export function estimateCost(
  profileId: ModelProfileId,
  estimatedInputTokens: number,
  estimatedOutputTokens: number,
): { estimatedCostUsd: number; modelId: string } {
  const profile = getModelProfile(profileId);
  const modelId = profile.modelId;

  const inputRate = INPUT_COST_PER_1K[modelId] ?? profile.estimatedCostPer1kTokens;
  const outputRate = OUTPUT_COST_PER_1K[modelId] ?? profile.estimatedCostPer1kTokens * 5;

  const inputCost = (estimatedInputTokens / 1000) * inputRate;
  const outputCost = (estimatedOutputTokens / 1000) * outputRate;

  return {
    estimatedCostUsd: Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000,
    modelId,
  };
}

// ── Cost Recording ────────────────────────────────────────────────────────

/**
 * Record the actual cost after a successful model invocation.
 * Returns a CostEntry that can be attached to the CaraResponse.
 */
export function recordCost(input: {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}): CostEntry {
  const { modelId, inputTokens, outputTokens, latencyMs } = input;

  const inputRate = INPUT_COST_PER_1K[modelId] ?? 0.003;
  const outputRate = OUTPUT_COST_PER_1K[modelId] ?? 0.015;

  const inputCost = (inputTokens / 1000) * inputRate;
  const outputCost = (outputTokens / 1000) * outputRate;
  const totalCost = Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;

  return {
    modelId,
    inputTokens,
    outputTokens,
    estimatedCostUsd: totalCost,
    latencyMs,
    timestamp: new Date().toISOString(),
  };
}

// ── Persist Cost to Database ──────────────────────────────────────────────

/**
 * Persist the cost entry to the database for billing tracking and
 * reporting. Silent no-op if Supabase is unavailable.
 */
export async function persistCost(input: {
  homeId: string;
  userId: string;
  auditId: string;
  cost: CostEntry;
  agentId: string;
  riskLevel: string;
}): Promise<void> {
  if (!isSupabaseEnabled()) return;

  const sb = createServerClient();
  if (!sb) return;

  try {
    await (sb.from("aria_cost_entries") as SB).insert({
      home_id: input.homeId,
      user_id: input.userId,
      audit_id: input.auditId,
      agent_id: input.agentId,
      model_id: input.cost.modelId,
      input_tokens: input.cost.inputTokens,
      output_tokens: input.cost.outputTokens,
      estimated_cost_usd: input.cost.estimatedCostUsd,
      latency_ms: input.cost.latencyMs,
      risk_level: input.riskLevel,
      created_at: input.cost.timestamp,
    });
  } catch (err) {
    // Cost tracking must never break the main flow
    console.error("[cara-orchestrator] Failed to persist cost entry:", err);
  }
}
