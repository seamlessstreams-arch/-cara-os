// ══════════════════════════════════════════════════════════════════════════════
// CARA — AI GATEWAY AUDIT SUMMARY (pure)
//
// Aggregates the gateway's audit ring (getAiGatewayAuditLog) into the headline
// "AI calls avoided" story for Cara HQ. The decision meter only knows two modes
// (deterministic vs ai); the gateway ledger is richer — it knows WHY a call was
// avoided (rule hit, cache hit, kill-switch, no key, cost cap, sensitivity block,
// permission), how much PII was redacted before any send, and whether any
// identifiable data actually reached a model. This surfaces that honestly.
//
// Pure + injected `now` → deterministic tests. The AiGatewayAuditEntry import is
// type-only (erased at build), so this stays free of the gateway's server-only
// edge and its types can be re-used in the client hook.
// ══════════════════════════════════════════════════════════════════════════════

import type { AiGatewayAuditEntry } from "./ai-gateway";

export type { AiGatewayAuditEntry };

export type GatewayRefusalReason =
  | "kill_switch"
  | "no_provider"
  | "cost_limit"
  | "permission"
  | "sensitivity_block"
  | "provider_unavailable"
  | "other";

export interface GatewayRefusalStat {
  reason: GatewayRefusalReason;
  count: number;
}

export interface GatewayFeatureStat {
  feature: string;
  total: number;
  ai: number;
  avoided: number;
}

export interface GatewayAuditSummary {
  /** Total gateway invocations inside the window. */
  total: number;
  by_method: { deterministic: number; cache: number; ai: number; refused: number };
  /** Calls that actually reached a model. */
  ai_calls: number;
  /** Calls answered with NO model call (deterministic + cache + refused). */
  avoided_calls: number;
  /** Share of AI-eligible requests answered without a model (0 when no data). */
  avoided_pct: number;
  /** Genuine engine/cache wins (deterministic + cache) — "avoided by design". */
  deterministic_calls: number;
  /** Invocations where at least one PII item was stripped before send. */
  redaction_events: number;
  /** Total PII items redacted across all invocations. */
  redacted_items: number;
  /** Calls where identifiable data actually reached a model. Target: 0. */
  identifiable_sent: number;
  /** Calls refused because the data was too sensitive to send. */
  sensitivity_blocks: number;
  refused_by_reason: GatewayRefusalStat[];
  by_feature: GatewayFeatureStat[];
}

/** Map a refusedReason string to a stable bucket (matched on durable fragments). */
export function classifyRefusal(reason: string | undefined): GatewayRefusalReason {
  const r = (reason ?? "").toLowerCase();
  if (!r) return "other";
  if (r.includes("cara_ai_enabled=false") || r.includes("ai is disabled")) return "kill_switch";
  if (r.includes("no ai provider is configured")) return "no_provider";
  if (r.includes("per-request limit") || r.includes("daily ai budget")) return "cost_limit";
  if (r.includes("not permitted")) return "permission";
  if (r.includes("must not be sent to an external model")) return "sensitivity_block";
  if (r.includes("provider unavailable")) return "provider_unavailable";
  return "other";
}

const REFUSAL_ORDER: GatewayRefusalReason[] = [
  "no_provider",
  "kill_switch",
  "sensitivity_block",
  "cost_limit",
  "permission",
  "provider_unavailable",
  "other",
];

const WINDOW_MS_PER_DAY = 24 * 60 * 60 * 1000;

export function summariseGatewayAudit(
  entries: AiGatewayAuditEntry[],
  now: string,
  windowDays = 30,
): GatewayAuditSummary {
  const cutoff = new Date(now).getTime() - windowDays * WINDOW_MS_PER_DAY;
  const inWindow = entries.filter((e) => {
    const t = new Date(e.at).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });

  const by_method = { deterministic: 0, cache: 0, ai: 0, refused: 0 };
  const refusalCounts = new Map<GatewayRefusalReason, number>();
  const featureMap = new Map<string, GatewayFeatureStat>();

  let redaction_events = 0;
  let redacted_items = 0;
  let identifiable_sent = 0;

  for (const e of inWindow) {
    by_method[e.method] += 1;

    if (e.method === "refused") {
      const bucket = classifyRefusal(e.refusedReason);
      refusalCounts.set(bucket, (refusalCounts.get(bucket) ?? 0) + 1);
    }

    if ((e.redactionCount ?? 0) > 0) {
      redaction_events += 1;
      redacted_items += e.redactionCount ?? 0;
    }
    if (e.identifiableDataSent) identifiable_sent += 1;

    const f = featureMap.get(e.feature) ?? { feature: e.feature, total: 0, ai: 0, avoided: 0 };
    f.total += 1;
    if (e.method === "ai") f.ai += 1;
    else f.avoided += 1;
    featureMap.set(e.feature, f);
  }

  const total = inWindow.length;
  const ai_calls = by_method.ai;
  const avoided_calls = total - ai_calls;
  const deterministic_calls = by_method.deterministic + by_method.cache;

  const refused_by_reason = REFUSAL_ORDER
    .map((reason) => ({ reason, count: refusalCounts.get(reason) ?? 0 }))
    .filter((r) => r.count > 0);

  const by_feature = [...featureMap.values()].sort((a, b) => b.total - a.total);

  return {
    total,
    by_method,
    ai_calls,
    avoided_calls,
    // No data → 0, not 100: never show a falsely-reassuring "everything avoided".
    avoided_pct: total === 0 ? 0 : Math.round((avoided_calls / total) * 100),
    deterministic_calls,
    redaction_events,
    redacted_items,
    identifiable_sent,
    sensitivity_blocks: refusalCounts.get("sensitivity_block") ?? 0,
    refused_by_reason,
    by_feature,
  };
}
