// ══════════════════════════════════════════════════════════════════════════════
// CARA — AI GATEWAY (the single chokepoint for every AI/LLM call)
//
// Deterministic-first. NOTHING in Cara should call a model directly — every AI
// call goes through invokeAiGateway, which runs this ladder in order:
//
//   1. Rules-first   — try the deterministic rule handler; if it answers, no AI.
//   2. Cache         — reuse a learned answer; if hit, no AI.
//   3. Availability  — global kill-switch + provider configured? If not → refuse.
//   4. Permission    — is the caller allowed to use AI?
//   5. Sensitivity   — classify; block data too sensitive to leave the building.
//   6. Redaction     — strip PII before send; record whether identifiable data went.
//   7. Cost limits   — refuse if the per-request / daily-per-org budget is spent.
//   8. Provider call — the metered generateText seam (records tokens + cost).
//   9. Cache store   — remember the answer for next time.
//  10. Audit         — log purpose, user, child/workflow, identifiable-flag, cost.
//
// Steps 1/2 are why this is "deterministic-first": most calls never reach a model.
// Demo / prod (no AI key): availability fails at step 3, so the gateway returns a
// graceful deterministic fallback — it never throws and never depends on a key.
//
// The effects (rules, cache, redactor, provider, meter, audit, clock) are injected
// so the "must NOT call AI" branches are unit-testable without a real key. The
// default deps wire the real, already-existing modules — this CONSOLIDATES the
// four pre-existing seams rather than adding a fifth.
// ══════════════════════════════════════════════════════════════════════════════

import "server-only";

import { tryRulesFirst, hasRuleHandler, type RuleContext, type RuleResult } from "../rules-engine";
import { isCacheableCommand, lookupLearnedAnswer, learnAnswer } from "../resolution/learned-cache";
import { classifyInputSensitivity, redactSensitiveData, detectChildIdentifiers, detectNames, detectStaffIdentifiers } from "../safety/data-protection";
import { getCaraProviderConfig, generateText, type CaraTextGenerationResult } from "../cara-provider";
import { DEFAULT_COST_LIMITS } from "../core/constants";
import { estimateCostGbp, recordDecision } from "@/lib/hq/usage-meter";
import { isAiKillSwitchOn, canRoleUseAi } from "../ai-availability";
import type { CaraDataSensitivity, CaraTaskType } from "../core/types";

// ── Public contract ───────────────────────────────────────────────────────────

export type AiGatewayMethod = "deterministic" | "cache" | "ai" | "refused";

export interface AiGatewayIdentity {
  userId?: string;
  role?: string;
  homeId?: string;
  childId?: string;
  workflowId?: string;
}

export interface AiGatewayRequest {
  /** Why this AI call is being made (for the audit trail). */
  purpose: string;
  /** HQ metering label — which product feature. */
  feature: string;
  systemPrompt: string;
  /** The raw prompt; may contain PII — the gateway redacts before send. */
  userPrompt: string;
  /** When set, enables rules-first + learned-cache before any model call. */
  commandId?: string;
  /** Context for the rule handler (the same text the rules see). */
  rulesText?: string;
  rulesContext?: RuleContext;
  identity?: AiGatewayIdentity;
  /** Explicit sensitivity; if omitted it is classified from the prompt. */
  sensitivity?: CaraDataSensitivity;
  taskType?: CaraTaskType;
  temperature?: number;
  maxOutputTokens?: number;
  expectJson?: boolean;
  /** Default true. Set false to skip redaction (e.g. already-clean prompt). */
  redact?: boolean;
}

export interface AiGatewayResult {
  output: string;
  method: AiGatewayMethod;
  llmUsed: boolean;
  /** True only if identifiable data actually left the building to a model. */
  identifiableDataSent: boolean;
  sensitivity: CaraDataSensitivity;
  model?: string;
  costGbp?: number;
  tokensInput?: number;
  tokensOutput?: number;
  redactionCount?: number;
  refusedReason?: string;
}

export interface AiGatewayAuditEntry {
  at: string;
  purpose: string;
  feature: string;
  method: AiGatewayMethod;
  userId?: string;
  childId?: string;
  workflowId?: string;
  sensitivity: CaraDataSensitivity;
  identifiableDataSent: boolean;
  model?: string;
  costGbp?: number;
  redactionCount: number;
  refusedReason?: string;
}

// ── Injectable effects (defaults wire the real modules) ───────────────────────

export interface AiGatewayDeps {
  rulesFirst: (commandId: string, text: string, ctx?: RuleContext) => RuleResult | null;
  hasRule: (commandId: string) => boolean;
  isCacheable: (commandId: string, riskLevel?: string) => boolean;
  cacheLookup: (commandId: string, text: string) => { output: string } | null;
  cacheStore: (commandId: string, text: string, output: string) => void;
  classify: (text: string, taskType: CaraTaskType, ctx?: { childId?: string; staffId?: string }) => CaraDataSensitivity;
  redact: (text: string) => { redactedText: string; sensitiveItemsDetected: number };
  providerConfigured: () => boolean;
  /** Global kill-switch: true means AI is hard-disabled regardless of key. */
  aiKillSwitchOn: () => boolean;
  permitAi: (identity: AiGatewayIdentity | undefined) => boolean;
  generate: (input: {
    systemPrompt: string; userPrompt: string; temperature?: number;
    maxOutputTokens?: number; expectJson?: boolean; feature?: string;
  }) => Promise<CaraTextGenerationResult>;
  /** GBP already spent today across the org (for the daily cap). */
  spentTodayGbp: () => number;
  estimateRequestGbp: (model: string, promptChars: number, maxOutputTokens: number) => number;
  recordDecision: (mode: "deterministic" | "ai", feature: string) => void;
  recordAudit: (entry: AiGatewayAuditEntry) => void;
  now: () => string;
  costLimits: typeof DEFAULT_COST_LIMITS;
}

// Sensitivity at or above this threshold is never sent to an external model —
// even redacted — and the gateway answers deterministically instead.
const BLOCK_SENSITIVITY: CaraDataSensitivity = "safeguarding_sensitive";
const SENSITIVITY_RANK: Record<CaraDataSensitivity, number> = {
  public: 0, internal: 1, confidential: 2, staff_sensitive: 3,
  child_sensitive: 4, health_sensitive: 5, legal_sensitive: 6, safeguarding_sensitive: 7,
};

function notConfiguredText(expectJson: boolean): string {
  const msg =
    "Cara answered without AI. The deterministic engine produced this, or AI is unavailable in this environment. Add ANTHROPIC_API_KEY (and CARA_AI_ENABLED) to enable optional AI enhancement.";
  return expectJson ? JSON.stringify({ caraDeterministic: true, message: msg }) : msg;
}

function residualIdentifiable(text: string): boolean {
  return detectChildIdentifiers(text) || detectStaffIdentifiers(text) || detectNames(text);
}

// ── The gateway ───────────────────────────────────────────────────────────────

export async function invokeAiGateway(
  req: AiGatewayRequest,
  overrides: Partial<AiGatewayDeps> = {},
): Promise<AiGatewayResult> {
  const deps = { ...defaultDeps(), ...overrides };
  const sens = req.sensitivity ?? deps.classify(req.userPrompt, req.taskType ?? "form_prompt_support", { childId: req.identity?.childId });

  const finish = (r: Omit<AiGatewayResult, "sensitivity"> & { sensitivity?: CaraDataSensitivity }): AiGatewayResult => {
    const result: AiGatewayResult = { sensitivity: sens, ...r } as AiGatewayResult;
    deps.recordAudit({
      at: deps.now(),
      purpose: req.purpose,
      feature: req.feature,
      method: result.method,
      userId: req.identity?.userId,
      childId: req.identity?.childId,
      workflowId: req.identity?.workflowId,
      sensitivity: result.sensitivity,
      identifiableDataSent: result.identifiableDataSent,
      model: result.model,
      costGbp: result.costGbp,
      redactionCount: result.redactionCount ?? 0,
      refusedReason: result.refusedReason,
    });
    return result;
  };

  // 1. Rules-first — the deterministic handler. No AI when it answers.
  if (req.commandId && deps.hasRule(req.commandId)) {
    const ruled = deps.rulesFirst(req.commandId, req.rulesText ?? req.userPrompt, req.rulesContext);
    if (ruled) {
      deps.recordDecision("deterministic", req.feature);
      return finish({ output: ruled.output, method: "deterministic", llmUsed: false, identifiableDataSent: false });
    }
  }

  // 2. Cache — reuse a learned answer.
  if (req.commandId && deps.isCacheable(req.commandId)) {
    const cached = deps.cacheLookup(req.commandId, req.userPrompt);
    if (cached) {
      deps.recordDecision("deterministic", req.feature);
      return finish({ output: cached.output, method: "cache", llmUsed: false, identifiableDataSent: false });
    }
  }

  // From here we genuinely need a model. Every branch below that does NOT reach a
  // model records a "deterministic" decision (so the "AI avoided" metric counts it).
  const refuse = (reason: string): AiGatewayResult => {
    deps.recordDecision("deterministic", req.feature);
    return finish({
      output: notConfiguredText(req.expectJson === true),
      method: "refused", llmUsed: false, identifiableDataSent: false, refusedReason: reason,
    });
  };

  // 3. Availability — kill-switch + provider configured.
  if (deps.aiKillSwitchOn()) return refuse("AI is disabled (CARA_AI_ENABLED=false).");
  if (!deps.providerConfigured()) return refuse("No AI provider is configured (no API key).");

  // 4. Permission.
  if (!deps.permitAi(req.identity)) return refuse("Caller is not permitted to use AI.");

  // 5. Sensitivity gate — too sensitive to send even redacted.
  if (SENSITIVITY_RANK[sens] >= SENSITIVITY_RANK[BLOCK_SENSITIVITY]) {
    return refuse(`Data classified '${sens}' must not be sent to an external model; answered deterministically.`);
  }

  // 6. Redaction — strip PII before the prompt leaves the building.
  const doRedact = req.redact !== false;
  const sentPrompt = doRedact ? deps.redact(req.userPrompt).redactedText : req.userPrompt;
  const redactionCount = doRedact ? deps.redact(req.userPrompt).sensitiveItemsDetected : 0;
  const identifiableDataSent = residualIdentifiable(sentPrompt);

  // 7. Cost limits.
  const model = getCaraProviderConfig().textModel;
  const estGbp = deps.estimateRequestGbp(model, req.systemPrompt.length + sentPrompt.length, req.maxOutputTokens ?? 1500);
  if (estGbp > deps.costLimits.perRequestMax) {
    return refuse(`Estimated cost £${estGbp.toFixed(4)} exceeds the per-request limit £${deps.costLimits.perRequestMax}.`);
  }
  if (deps.spentTodayGbp() + estGbp > deps.costLimits.dailyPerOrganisation) {
    return refuse(`Daily AI budget (£${deps.costLimits.dailyPerOrganisation}) reached for the organisation.`);
  }

  // 8. Provider call (the metered seam — records tokens + cost + the "ai" decision).
  const gen = await deps.generate({
    systemPrompt: req.systemPrompt,
    userPrompt: sentPrompt,
    temperature: req.temperature,
    maxOutputTokens: req.maxOutputTokens,
    expectJson: req.expectJson,
    feature: req.feature,
  });

  // 9. Cache store (only a real model answer is worth remembering).
  if (gen.llmUsed && req.commandId && deps.isCacheable(req.commandId)) {
    try { deps.cacheStore(req.commandId, req.userPrompt, gen.text); } catch { /* best-effort */ }
  }

  // 10. Audit + return. If the provider degraded to its fallback (llmUsed=false),
  // no identifiable data actually reached a model.
  return finish({
    output: gen.text,
    method: gen.llmUsed ? "ai" : "refused",
    llmUsed: gen.llmUsed,
    identifiableDataSent: gen.llmUsed ? identifiableDataSent : false,
    model: gen.modelId,
    costGbp: gen.llmUsed ? estGbp : 0,
    tokensInput: gen.tokensInput,
    tokensOutput: gen.tokensOutput,
    redactionCount,
    refusedReason: gen.llmUsed ? undefined : "AI provider unavailable; deterministic fallback returned.",
  });
}

// ── Real default deps (wire the existing modules) ─────────────────────────────

let _auditRing: AiGatewayAuditEntry[] = [];
const AUDIT_RING_CAP = 2000;

/** In-memory gateway audit ring (per serverless instance). Durable audit = Phase 2. */
export function getAiGatewayAuditLog(): AiGatewayAuditEntry[] {
  return [..._auditRing];
}
export function __resetAiGatewayAuditLog(): void { _auditRing = []; }

function defaultDeps(): AiGatewayDeps {
  return {
    rulesFirst: tryRulesFirst,
    hasRule: hasRuleHandler,
    isCacheable: isCacheableCommand,
    cacheLookup: (commandId, text) => {
      const hit = lookupLearnedAnswer({ commandId, inputText: text });
      return hit && hit.output ? { output: hit.output } : null;
    },
    cacheStore: (commandId, text, output) => { learnAnswer({ commandId, inputText: text, output }); },
    classify: classifyInputSensitivity,
    redact: (text) => { const r = redactSensitiveData(text); return { redactedText: r.redactedText, sensitiveItemsDetected: r.sensitiveItemsDetected }; },
    providerConfigured: () => getCaraProviderConfig().configured,
    aiKillSwitchOn: isAiKillSwitchOn,
    permitAi: (identity) => canRoleUseAi(identity?.role),
    generate: generateText,
    spentTodayGbp: () => {
      try {
        // Sum today's metered AI cost from the in-memory ring (best-effort).
        const { getStore } = require("@/lib/db/store");
        const today = new Date().toISOString().slice(0, 10);
        const rows = (getStore().hqAiUsage ?? []) as { at: string; cost_gbp: number }[];
        return rows.filter((r) => r.at?.slice(0, 10) === today).reduce((s, r) => s + (r.cost_gbp ?? 0), 0);
      } catch { return 0; }
    },
    estimateRequestGbp: (model, promptChars, maxOutputTokens) =>
      estimateCostGbp({ feature: "gateway_estimate", model, tokensInput: Math.ceil(promptChars / 4), tokensOutput: maxOutputTokens }),
    recordDecision: (mode, feature) => { try { recordDecision({ feature, mode }); } catch { /* best-effort */ } },
    recordAudit: (entry) => { _auditRing.push(entry); if (_auditRing.length > AUDIT_RING_CAP) _auditRing.splice(0, _auditRing.length - AUDIT_RING_CAP); },
    now: () => new Date().toISOString(),
    costLimits: DEFAULT_COST_LIMITS,
  };
}
