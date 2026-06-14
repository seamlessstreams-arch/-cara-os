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
import type { HqAiUsageRow } from "./hq-types";
import { persistHqAiUsage } from "@/lib/supabase/hq-persist";

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
