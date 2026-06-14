import "server-only";

// ══════════════════════════════════════════════════════════════════════════════
// CARA HQ — AI usage meter
//
// Called from the provider seam (cara-provider generateText) on every
// successful model call, so AI cost fills in organically — no per-feature
// wiring needed. Cost is a ROUGH GBP ESTIMATE for margin watching, never
// billing (the `estimated` flag travels with every row).
// ══════════════════════════════════════════════════════════════════════════════

import { getStore } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import type { HqAiUsageRow, HqApiCallRow, HqDecisionRow } from "./hq-types";
import { persistHqAiUsage } from "@/lib/supabase/hq-persist";

// Keep the in-memory call/decision logs bounded — these are high-frequency and
// the store is long-lived per serverless instance. Durable history (when
// Supabase is active) is unaffected; this only trims the in-process ring.
const RING_CAP = 5000;
function pushCapped<T>(arr: T[], row: T): T[] {
  arr.push(row);
  if (arr.length > RING_CAP) arr.splice(0, arr.length - RING_CAP);
  return arr;
}

// £ per million tokens by model family — adjust as pricing moves.
const RATES_GBP_PER_MTOK: { match: string; input: number; output: number }[] = [
  { match: "opus", input: 12, output: 60 },
  { match: "sonnet", input: 2.4, output: 12 },
  { match: "haiku", input: 0.66, output: 3.3 },
];
const DEFAULT_RATE = { input: 2.4, output: 12 };

function rateFor(model: string | null): { input: number; output: number } {
  const m = (model ?? "").toLowerCase();
  return RATES_GBP_PER_MTOK.find((r) => m.includes(r.match)) ?? DEFAULT_RATE;
}

export interface AiUsageInput {
  feature: string;
  model: string | null;
  tokensInput: number;
  tokensOutput: number;
}

export function estimateCostGbp(input: AiUsageInput): number {
  const rate = rateFor(input.model);
  const cost =
    (input.tokensInput / 1_000_000) * rate.input +
    (input.tokensOutput / 1_000_000) * rate.output;
  return Math.round(cost * 10000) / 10000;
}

/** Append one metered AI call — store always, Supabase best-effort. */
export function recordAiUsage(input: AiUsageInput): HqAiUsageRow {
  const store = getStore();
  const row: HqAiUsageRow = {
    id: generateId("aiu"),
    at: new Date().toISOString(),
    org_id: store.hqOrganisations[0]?.id ?? null,
    feature: input.feature,
    model: input.model,
    tokens_input: Math.max(0, Math.round(input.tokensInput)),
    tokens_output: Math.max(0, Math.round(input.tokensOutput)),
    cost_gbp: estimateCostGbp(input),
    estimated: true,
  };
  store.hqAiUsage.push(row);
  void persistHqAiUsage(row);
  return row;
}

// ── API-call volume meter ─────────────────────────────────────────────────────
// Called from the main API surface (the /api/v1 catch-all) so request volume
// fills in organically. `intelligence` marks decision/intelligence endpoints.
export interface ApiCallInput {
  feature: string;
  method: string;
  intelligence?: boolean;
}

export function recordApiCall(input: ApiCallInput): HqApiCallRow {
  const store = getStore();
  const row: HqApiCallRow = {
    id: generateId("api"),
    at: new Date().toISOString(),
    org_id: store.hqOrganisations[0]?.id ?? null,
    feature: input.feature,
    method: input.method,
    intelligence: input.intelligence ?? false,
  };
  pushCapped(store.hqApiCalls, row);
  return row;
}

// ── Decision meter (deterministic vs AI) ──────────────────────────────────────
// Called from the provider seam on every intelligence generation: mode is
// "ai" when a model produced the output and "deterministic" when the pure
// engine / no-key fallback did. This is the headline "how much runs with no
// AI" signal for the platform owner.
export interface DecisionInput {
  feature: string;
  mode: "deterministic" | "ai";
}

export function recordDecision(input: DecisionInput): HqDecisionRow {
  const store = getStore();
  const row: HqDecisionRow = {
    id: generateId("dec"),
    at: new Date().toISOString(),
    org_id: store.hqOrganisations[0]?.id ?? null,
    feature: input.feature,
    mode: input.mode,
  };
  pushCapped(store.hqDecisions, row);
  return row;
}
