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
//   5.5 Provider risk register — is the ACTIVE provider approved to receive data
//       at this sensitivity level? (PROVIDER_MAX_SENSITIVITY.) A provider with no
//       risk profile, or not approved for this sensitivity, is refused.
//   6. Redaction     — strip PII before send; record whether identifiable data went.
//   6.5 Prompt-injection guard — wrap outbound text so instructions embedded in
//       record/user text can never override Cara's system rules; flag (audit-only)
//       any obvious hijack attempt.
//   7. Cost limits   — refuse if the per-request / daily-per-org budget is spent.
//   8. Provider call — the metered generateText/streamGenerate seam. The streaming
//      path re-scans the accumulating response on every delta and stops forwarding
//      further text the instant a hijack-compliance artifact appears — text already
//      sent cannot be recalled, but an escaping response is cut short rather than
//      reaching the client in full.
//   9. Response safety scan — never surface a response that shows signs of having
//      complied with an injected instruction. Identifier leakage in the response
//      is only treated as unsafe when the outbound prompt WAS redacted (some modes
//      intentionally keep the child's own words, in which case identifiers are
//      expected, not a leak).
//   9.5 Cache store  — remember the answer for next time (non-streaming only).
//  10. Audit         — log purpose, user, child/workflow, identifiable-flag, cost,
//      redaction-skipped, prompt-injection-flagged, response-blocked.
//
// Steps 1/2 are why this is "deterministic-first": most calls never reach a model.
// Demo / prod (no AI key): availability fails at step 3, so the gateway returns a
// graceful deterministic fallback — it never throws and never depends on a key.
//
// Fail-closed: if classification, redaction, the provider-risk check, the
// injection guard, or the response scanner cannot complete (throws), the request
// is refused rather than silently passed through or allowed to crash upward.
//
// The effects (rules, cache, redactor, provider, meter, audit, clock) are injected
// so the "must NOT call AI" branches are unit-testable without a real key. The
// default deps wire the real, already-existing modules — this CONSOLIDATES the
// pre-existing seams rather than adding parallel ones.
// ══════════════════════════════════════════════════════════════════════════════

import "server-only";

import { tryRulesFirst, hasRuleHandler, type RuleContext, type RuleResult } from "../rules-engine";
import { isCacheableCommand, lookupLearnedAnswer, learnAnswer } from "../resolution/learned-cache";
import { classifyInputSensitivity, redactSensitiveData, detectChildIdentifiers, detectNames, detectStaffIdentifiers, validateProviderAllowedForSensitivity } from "../safety/data-protection";
import { guardUntrustedText, type PromptGuardResult } from "../safety/prompt-injection-guard";
import { scanAiResponse, type ResponseSafetyResult } from "../safety/response-safety-scanner";
import { getCaraProviderConfig, type CaraTextGenerationResult } from "../cara-provider";
import { type CaraStreamInput, type CaraStreamHandlers, type CaraStreamResult } from "../cara-provider-stream";
import { generateViaProvider, streamViaProvider, providerConfiguredOrLocal, localBypassesExternalRiskRegister } from "./generate-via-provider";
import { DEFAULT_COST_LIMITS } from "../core/constants";
import { estimateCostGbp, recordDecision } from "@/lib/hq/usage-meter";
import { isAiKillSwitchOn, canRoleUseAi } from "../ai-availability";
import type { CaraDataSensitivity, CaraTaskType, CaraProviderName } from "../core/types";

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
  /** Streaming only: wrap the system block in cache_control for the cache discount. */
  cacheSystem?: boolean;
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
  /** True when the caller explicitly skipped redaction (req.redact === false). */
  redactionSkipped?: boolean;
  /** True when the outbound prompt matched a known prompt-injection pattern. */
  promptInjectionFlagged?: boolean;
  /** True when the response safety scan withheld or cut short the response. */
  responseBlocked?: boolean;
  /** The scanner's flags, when a scan ran (compliance + identifier signals). */
  responseSafetyFlags?: string[];
}

export interface AiGatewayStreamHandlers {
  onTextDelta: (text: string) => void;
  onMessageDelta?: (stopReason: string | null) => void;
}

export interface AiGatewayStreamResult extends AiGatewayResult {
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
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
  redactionSkipped: boolean;
  promptInjectionFlagged: boolean;
  responseBlocked: boolean;
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
  /** Is the CURRENT provider approved (via the provider risk register) for this sensitivity? */
  isProviderAllowedForSensitivity?: (sensitivity: CaraDataSensitivity) => boolean;
  /** Wrap outbound text so embedded instructions can't override system rules; flags obvious hijack attempts. */
  guardPrompt?: (text: string) => PromptGuardResult;
  /** Scan a model response for hijack-compliance artifacts / unexpected identifier leakage. */
  scanResponse?: (text: string, opts: { redactionWasApplied: boolean }) => ResponseSafetyResult;
  generate: (input: {
    systemPrompt: string; userPrompt: string; temperature?: number;
    maxOutputTokens?: number; expectJson?: boolean; feature?: string;
  }) => Promise<CaraTextGenerationResult>;
  /** Streaming generate seam — yields deltas via handlers, returns final usage. */
  streamGenerate: (input: CaraStreamInput, handlers: CaraStreamHandlers) => Promise<CaraStreamResult>;
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

  // Classification failure fails closed: treat an unclassifiable prompt as
  // maximally sensitive rather than let it fall through with no sensitivity.
  let sens: CaraDataSensitivity;
  let classifyFailed = false;
  try {
    sens = req.sensitivity ?? deps.classify(req.userPrompt, req.taskType ?? "form_prompt_support", { childId: req.identity?.childId });
  } catch {
    sens = BLOCK_SENSITIVITY;
    classifyFailed = true;
  }

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
      redactionSkipped: result.redactionSkipped ?? false,
      promptInjectionFlagged: result.promptInjectionFlagged ?? false,
      responseBlocked: result.responseBlocked ?? false,
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

  if (classifyFailed) return refuse("Sensitivity classification failed; blocked by default (fail-closed).");

  // 3. Availability — kill-switch + provider configured.
  if (deps.aiKillSwitchOn()) return refuse("AI is disabled (CARA_AI_ENABLED=false).");
  if (!deps.providerConfigured()) return refuse("No AI provider is configured (no API key).");

  // 4. Permission.
  if (!deps.permitAi(req.identity)) return refuse("Caller is not permitted to use AI.");

  // 5. Sensitivity gate — too sensitive to send even redacted.
  if (SENSITIVITY_RANK[sens] >= SENSITIVITY_RANK[BLOCK_SENSITIVITY]) {
    return refuse(`Data classified '${sens}' must not be sent to an external model; answered deterministically.`);
  }

  // 5.5 Provider risk register — is the active provider approved for this sensitivity?
  let providerAllowed: boolean;
  try {
    providerAllowed = deps.isProviderAllowedForSensitivity ? deps.isProviderAllowedForSensitivity(sens) : true;
  } catch {
    providerAllowed = false;
  }
  if (!providerAllowed) {
    return refuse(`The configured AI provider is not approved to receive '${sens}' data; answered deterministically.`);
  }

  // 6. Redaction — strip PII before the prompt leaves the building.
  const doRedact = req.redact !== false;
  let sentPrompt: string;
  let redactionCount: number;
  try {
    const r = doRedact ? deps.redact(req.userPrompt) : { redactedText: req.userPrompt, sensitiveItemsDetected: 0 };
    sentPrompt = r.redactedText;
    redactionCount = r.sensitiveItemsDetected;
  } catch {
    return refuse("Redaction step failed; blocked by default (fail-closed).");
  }
  const identifiableDataSent = residualIdentifiable(sentPrompt);

  // 6.5 Prompt-injection guard — wrap the outbound text; flag (never block) hijack attempts.
  let guarded: PromptGuardResult;
  try {
    guarded = deps.guardPrompt ? deps.guardPrompt(sentPrompt) : { guardedText: sentPrompt, flagged: false, matchedPatterns: [] };
  } catch {
    return refuse("Prompt-injection guard failed; blocked by default (fail-closed).");
  }

  // 7. Cost limits — estimate on the text actually sent (post-guard).
  const model = getCaraProviderConfig().textModel;
  const estGbp = deps.estimateRequestGbp(model, req.systemPrompt.length + guarded.guardedText.length, req.maxOutputTokens ?? 1500);
  if (estGbp > deps.costLimits.perRequestMax) {
    return refuse(`Estimated cost £${estGbp.toFixed(4)} exceeds the per-request limit £${deps.costLimits.perRequestMax}.`);
  }
  if (deps.spentTodayGbp() + estGbp > deps.costLimits.dailyPerOrganisation) {
    return refuse(`Daily AI budget (£${deps.costLimits.dailyPerOrganisation}) reached for the organisation.`);
  }

  // 8. Provider call (the metered seam — records tokens + cost + the "ai" decision).
  const gen = await deps.generate({
    systemPrompt: req.systemPrompt,
    userPrompt: guarded.guardedText,
    temperature: req.temperature,
    maxOutputTokens: req.maxOutputTokens,
    expectJson: req.expectJson,
    feature: req.feature,
  });

  // 9. Response safety scan — never surface a hijack-compliance response. Identifier
  // leakage is only unsafe when the outbound prompt WAS redacted.
  let scan: ResponseSafetyResult | null = null;
  if (gen.llmUsed) {
    try {
      scan = deps.scanResponse ? deps.scanResponse(gen.text, { redactionWasApplied: doRedact }) : { safe: true, complianceFlags: [], identifierFlags: [] };
    } catch {
      scan = { safe: false, complianceFlags: ["scanner_failed"], identifierFlags: [] };
    }
  }
  const responseBlocked = scan !== null && !scan.safe;
  const finalOutput = responseBlocked
    ? "Cara withheld this response — it did not pass a safety check and has been blocked from display. This has been logged for review."
    : gen.text;

  // 9.5 Cache store (only a real, unblocked model answer is worth remembering).
  if (gen.llmUsed && !responseBlocked && req.commandId && deps.isCacheable(req.commandId)) {
    try { deps.cacheStore(req.commandId, req.userPrompt, gen.text); } catch { /* best-effort */ }
  }

  // 10. Audit + return. If the provider degraded to its fallback (llmUsed=false),
  // no identifiable data actually reached a model.
  return finish({
    output: finalOutput,
    method: gen.llmUsed ? "ai" : "refused",
    llmUsed: gen.llmUsed,
    identifiableDataSent: gen.llmUsed ? identifiableDataSent : false,
    model: gen.modelId,
    costGbp: gen.llmUsed ? estGbp : 0,
    tokensInput: gen.tokensInput,
    tokensOutput: gen.tokensOutput,
    redactionCount,
    redactionSkipped: !doRedact,
    promptInjectionFlagged: guarded.flagged,
    responseBlocked,
    responseSafetyFlags: scan ? [...scan.complianceFlags, ...scan.identifierFlags] : undefined,
    refusedReason: gen.llmUsed
      ? (responseBlocked ? `Response blocked: ${scan!.complianceFlags.concat(scan!.identifierFlags).join(", ")}` : undefined)
      : "AI provider unavailable; deterministic fallback returned.",
  });
}

// ── The streaming gateway ─────────────────────────────────────────────────────
//
// Same ladder as invokeAiGateway, but the model step streams. Every "no model"
// branch (rules / cache / refuse) still works — it emits the deterministic answer
// as a single delta so the caller's stream consumer sees one coherent output
// either way. Demo / no-key: refuses at availability and the caller emits its own
// fallback. Used by /api/v1/cara so streaming stops bypassing the chokepoint.
export async function invokeAiGatewayStream(
  req: AiGatewayRequest,
  handlers: AiGatewayStreamHandlers,
  overrides: Partial<AiGatewayDeps> = {},
): Promise<AiGatewayStreamResult> {
  const deps = { ...defaultDeps(), ...overrides };

  let sens: CaraDataSensitivity;
  let classifyFailed = false;
  try {
    sens = req.sensitivity ?? deps.classify(req.userPrompt, req.taskType ?? "form_prompt_support", { childId: req.identity?.childId });
  } catch {
    sens = BLOCK_SENSITIVITY;
    classifyFailed = true;
  }

  const finish = (
    r: Omit<AiGatewayStreamResult, "sensitivity"> & { sensitivity?: CaraDataSensitivity },
  ): AiGatewayStreamResult => {
    const result = { sensitivity: sens, ...r } as AiGatewayStreamResult;
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
      redactionSkipped: result.redactionSkipped ?? false,
      promptInjectionFlagged: result.promptInjectionFlagged ?? false,
      responseBlocked: result.responseBlocked ?? false,
    });
    return result;
  };

  // 1. Rules-first — emit the deterministic answer as one delta, no model.
  if (req.commandId && deps.hasRule(req.commandId)) {
    const ruled = deps.rulesFirst(req.commandId, req.rulesText ?? req.userPrompt, req.rulesContext);
    if (ruled) {
      deps.recordDecision("deterministic", req.feature);
      handlers.onTextDelta(ruled.output);
      return finish({ output: ruled.output, method: "deterministic", llmUsed: false, identifiableDataSent: false });
    }
  }

  // 2. Cache.
  if (req.commandId && deps.isCacheable(req.commandId)) {
    const cached = deps.cacheLookup(req.commandId, req.userPrompt);
    if (cached) {
      deps.recordDecision("deterministic", req.feature);
      handlers.onTextDelta(cached.output);
      return finish({ output: cached.output, method: "cache", llmUsed: false, identifiableDataSent: false });
    }
  }

  const refuse = (reason: string): AiGatewayStreamResult => {
    deps.recordDecision("deterministic", req.feature);
    return finish({
      output: notConfiguredText(req.expectJson === true),
      method: "refused", llmUsed: false, identifiableDataSent: false, refusedReason: reason,
    });
  };

  if (classifyFailed) return refuse("Sensitivity classification failed; blocked by default (fail-closed).");

  // 3-5. Availability + permission + sensitivity — never reach the model.
  if (deps.aiKillSwitchOn()) return refuse("AI is disabled (CARA_AI_ENABLED=false).");
  if (!deps.providerConfigured()) return refuse("No AI provider is configured (no API key).");
  if (!deps.permitAi(req.identity)) return refuse("Caller is not permitted to use AI.");
  if (SENSITIVITY_RANK[sens] >= SENSITIVITY_RANK[BLOCK_SENSITIVITY]) {
    return refuse(`Data classified '${sens}' must not be sent to an external model; answered deterministically.`);
  }

  // 5.5 Provider risk register.
  let providerAllowed: boolean;
  try {
    providerAllowed = deps.isProviderAllowedForSensitivity ? deps.isProviderAllowedForSensitivity(sens) : true;
  } catch {
    providerAllowed = false;
  }
  if (!providerAllowed) {
    return refuse(`The configured AI provider is not approved to receive '${sens}' data; answered deterministically.`);
  }

  // 6. Redaction.
  const doRedact = req.redact !== false;
  let sentPrompt: string;
  let redactionCount: number;
  try {
    const r = doRedact ? deps.redact(req.userPrompt) : { redactedText: req.userPrompt, sensitiveItemsDetected: 0 };
    sentPrompt = r.redactedText;
    redactionCount = r.sensitiveItemsDetected;
  } catch {
    return refuse("Redaction step failed; blocked by default (fail-closed).");
  }
  const identifiableDataSent = residualIdentifiable(sentPrompt);

  // 6.5 Prompt-injection guard.
  let guarded: PromptGuardResult;
  try {
    guarded = deps.guardPrompt ? deps.guardPrompt(sentPrompt) : { guardedText: sentPrompt, flagged: false, matchedPatterns: [] };
  } catch {
    return refuse("Prompt-injection guard failed; blocked by default (fail-closed).");
  }

  // 7. Cost limits.
  const model = getCaraProviderConfig().textModel;
  const estGbp = deps.estimateRequestGbp(model, req.systemPrompt.length + guarded.guardedText.length, req.maxOutputTokens ?? 1500);
  if (estGbp > deps.costLimits.perRequestMax) {
    return refuse(`Estimated cost £${estGbp.toFixed(4)} exceeds the per-request limit £${deps.costLimits.perRequestMax}.`);
  }
  if (deps.spentTodayGbp() + estGbp > deps.costLimits.dailyPerOrganisation) {
    return refuse(`Daily AI budget (£${deps.costLimits.dailyPerOrganisation}) reached for the organisation.`);
  }

  // 8. Stream from the provider (the metered streaming seam). A live circuit
  // breaker re-scans the accumulating response on every delta for hijack-
  // compliance artifacts and stops forwarding further text the instant one
  // appears — already-forwarded text cannot be recalled, but the rest of an
  // escaping response is cut short. Identifier leakage is scanned post-hoc
  // (audit only): it cannot usefully gate a partial stream, and is expected in
  // modes that intentionally skip redaction.
  let buffered = "";
  let forwarded = "";
  let circuitBroken = false;
  let breakReason: string | undefined;
  const guardedHandlers: AiGatewayStreamHandlers = {
    onTextDelta: (text) => {
      if (circuitBroken) return;
      buffered += text;
      let midScan: ResponseSafetyResult;
      try {
        midScan = deps.scanResponse ? deps.scanResponse(buffered, { redactionWasApplied: doRedact }) : { safe: true, complianceFlags: [], identifierFlags: [] };
      } catch {
        circuitBroken = true;
        breakReason = "scanner_failed";
        return;
      }
      if (midScan.complianceFlags.length > 0) {
        circuitBroken = true;
        breakReason = midScan.complianceFlags.join(", ");
        return;
      }
      forwarded += text;
      handlers.onTextDelta(text);
    },
    onMessageDelta: handlers.onMessageDelta,
  };

  const gen = await deps.streamGenerate(
    {
      systemPrompt: req.systemPrompt,
      userPrompt: guarded.guardedText,
      model,
      maxOutputTokens: req.maxOutputTokens,
      temperature: req.temperature,
      cacheSystem: req.cacheSystem,
      feature: req.feature,
    },
    guardedHandlers,
  );

  // 9. Post-hoc identifier check on the full buffer (audit-only for streaming —
  // by this point everything the model said has already been forwarded or cut).
  let finalScan: ResponseSafetyResult | null = null;
  if (gen.llmUsed) {
    try {
      finalScan = deps.scanResponse ? deps.scanResponse(buffered, { redactionWasApplied: doRedact }) : { safe: true, complianceFlags: [], identifierFlags: [] };
    } catch {
      finalScan = { safe: false, complianceFlags: ["scanner_failed"], identifierFlags: [] };
    }
  }
  const responseBlocked = circuitBroken || (finalScan !== null && !finalScan.safe);

  // 10. Audit + return.
  return finish({
    output: forwarded,
    method: gen.llmUsed ? "ai" : "refused",
    llmUsed: gen.llmUsed,
    identifiableDataSent: gen.llmUsed ? identifiableDataSent : false,
    model: gen.modelId,
    costGbp: gen.llmUsed ? estGbp : 0,
    tokensInput: gen.tokensInput,
    tokensOutput: gen.tokensOutput,
    redactionCount,
    redactionSkipped: !doRedact,
    promptInjectionFlagged: guarded.flagged,
    responseBlocked,
    responseSafetyFlags: finalScan ? [...finalScan.complianceFlags, ...finalScan.identifierFlags] : undefined,
    refusedReason: gen.llmUsed
      ? (circuitBroken
          ? `Response cut off mid-stream: ${breakReason}`
          : responseBlocked ? `Response flagged: ${finalScan!.complianceFlags.concat(finalScan!.identifierFlags).join(", ")}` : undefined)
      : "AI provider unavailable; deterministic fallback returned.",
    cacheCreationInputTokens: gen.cacheCreationInputTokens,
    cacheReadInputTokens: gen.cacheReadInputTokens,
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
      const hit = lookupLearnedAnswer({ commandId, childId: null, input: text });
      return hit && hit.output ? { output: hit.output } : null;
    },
    cacheStore: (commandId, text, output) => { learnAnswer({ commandId, childId: null, input: text, output, confidence: "low" }); },
    classify: classifyInputSensitivity,
    redact: (text) => { const r = redactSensitiveData(text); return { redactedText: r.redactedText, sensitiveItemsDetected: r.sensitiveItemsDetected }; },
    // A local model counts as "configured" too — so the gateway proceeds to
    // generation on-premises even without an external API key.
    providerConfigured: providerConfiguredOrLocal,
    aiKillSwitchOn: isAiKillSwitchOn,
    permitAi: (identity) => canRoleUseAi(identity?.role),
    isProviderAllowedForSensitivity: (sensitivity) => {
      // A local, on-premises provider isn't subject to the external-provider risk
      // register — but ONLY when there's no external provider to fall back to (an
      // unreachable local model must never let un-vetted data reach an external
      // provider). The safeguarding BLOCK gate (step 5) still applies to local.
      if (localBypassesExternalRiskRegister()) return true;
      const { providerId } = getCaraProviderConfig();
      if (providerId === "none") return false; // defensive — step 3 already refuses before this runs
      return validateProviderAllowedForSensitivity(providerId as CaraProviderName, sensitivity);
    },
    guardPrompt: guardUntrustedText,
    scanResponse: scanAiResponse,
    // Generation runs through the provider layer: local model if configured &
    // reachable, else the external path — both inherit redaction + guard + scan.
    generate: generateViaProvider,
    streamGenerate: streamViaProvider,
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
