import "server-only";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CLAUDE SUBSCRIPTION PROVIDER (owner's Max plan, local/self-host ONLY)
//
// Authenticates model calls with the operator's own Claude subscription via the
// Claude Agent SDK (@anthropic-ai/claude-agent-sdk) instead of ANTHROPIC_API_KEY.
// The SDK drives a logged-in Claude Code environment on this machine, so calls
// consume the owner's Max usage limits and cost £0 in API terms.
//
// ── Terms of use ──────────────────────────────────────────────────────────────
// Anthropic's terms do NOT permit routing other users' requests through one
// person's subscription. This provider exists for the owner's own local or
// self-hosted single-operator use. It must never serve a multi-user deployment:
// isAvailable() refuses serverless environments outright, and the availability
// check requires the operator to opt in explicitly with
// AI_PROVIDER=claude_subscription.
//
// ── Where this sits in the architecture ───────────────────────────────────────
// This is step-8 plumbing only. Every call still enters through invokeAiGateway
// and passes the full ladder (rules-first, cache, kill-switch, role permission,
// sensitivity classification + safeguarding block, provider risk register,
// redaction, prompt-injection guard, cost caps) before the generation seam in
// cara-provider.ts dispatches here. The data recipient is still Anthropic —
// getCaraProviderConfig() keeps providerId "anthropic" so the provider risk
// register (gateway step 5.5) stays truthful — only the auth route differs,
// recorded as authSource: "subscription" on the result, audit entry and meter.
//
// ── Behaviour notes ───────────────────────────────────────────────────────────
// • Single-shot text transformation: tools: [] and maxTurns: 1 — no file access,
//   no bash, no MCP, no agent behaviour.
// • persistSession: false — record text must never be written to the local
//   Claude session transcript on disk.
// • The child environment has ANTHROPIC_API_KEY stripped, so the CLI genuinely
//   authenticates with the subscription login (the key is ignored by design).
// • The Agent SDK does not expose a temperature parameter. Rewrite determinism
//   comes from the locked system prompt and the deterministic post-pass, not
//   from sampling settings — docs/ai-providers.md says this out loud.
// • Failures (not logged in, SDK missing, timeout via CARA_REWRITE_TIMEOUT_MS,
//   any error) reject; the caller returns its deterministic fallback exactly as
//   it does for an API-key failure. Errors are summarised without prompt or
//   response text — the SensitiveLogScrubber discipline applies here too.
// ══════════════════════════════════════════════════════════════════════════════

import { BaseCaraProvider } from "./base-provider";
import type {
  ProviderTextRequest,
  ProviderTextResponse,
  ProviderStreamChunk,
} from "./base-provider";
import type { CaraProviderCapabilities, CaraProviderName } from "../core/types";

export {
  SUBSCRIPTION_TIMEOUT_ENV,
  subscriptionTimeoutMs,
  subscriptionEnvironmentBlocked,
  subscriptionAuthSelected,
  isSubscriptionAuthAvailable,
} from "./subscription-availability";
import {
  subscriptionTimeoutMs,
  subscriptionEnvironmentBlocked,
  subscriptionAuthSelected,
  isSubscriptionAuthAvailable,
} from "./subscription-availability";

export interface SubscriptionGenerateInput {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  timeoutMs?: number;
}

export interface SubscriptionGenerateOutput {
  text: string;
  tokensInput: number;
  tokensOutput: number;
  modelVersion: string;
}

/**
 * One single-shot, tool-less generation on the subscription login. Throws on
 * any failure (environment blocked, SDK missing, not logged in, timeout,
 * model error) — callers own the deterministic fallback. Error messages never
 * include prompt or response text.
 */
export async function generateViaSubscription(
  input: SubscriptionGenerateInput,
): Promise<SubscriptionGenerateOutput> {
  const blocked = subscriptionEnvironmentBlocked();
  if (blocked) {
    throw new Error(`Subscription auth is unavailable in a ${blocked} environment.`);
  }

  // Dynamic import: the SDK never enters the client bundle, and environments
  // that never select this provider never load it.
  const { query, AbortError } = await import("@anthropic-ai/claude-agent-sdk");

  // The CLI must authenticate with the subscription login, never the API key.
  const childEnv: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k === "ANTHROPIC_API_KEY" || v === undefined) continue;
    childEnv[k] = v;
  }

  const controller = new AbortController();
  const timeoutMs = input.timeoutMs ?? subscriptionTimeoutMs();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const run = query({
      prompt: input.userPrompt,
      options: {
        systemPrompt: input.systemPrompt,
        model: input.model,
        maxTurns: 1,
        tools: [],
        persistSession: false,
        abortController: controller,
        env: childEnv,
      },
    });

    for await (const message of run) {
      if (message.type !== "result") continue;
      if (message.subtype === "success" && !message.is_error) {
        const usage = message.usage;
        return {
          text: message.result.trim(),
          tokensInput: usage.input_tokens ?? 0,
          tokensOutput: usage.output_tokens ?? 0,
          modelVersion: input.model,
        };
      }
      // Error result: surface the subtype, never the content.
      const reason = message.subtype === "success" ? "model reported an error" : message.subtype;
      throw new Error(`Subscription generation failed (${reason}).`);
    }
    throw new Error("Subscription generation ended without a result message.");
  } catch (err) {
    if (err instanceof Error && (err.name === "AbortError" || err instanceof AbortError)) {
      throw new Error(`Subscription generation timed out after ${timeoutMs}ms.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ── Registry adapter (admin surface visibility) ───────────────────────────────
// The gateway's generation seam dispatches via cara-provider.ts, not this
// class; the class exists so /api/cara/providers and the admin provider list
// can show and connection-test subscription auth like any other provider.

export class ClaudeSubscriptionProvider extends BaseCaraProvider {
  readonly name: CaraProviderName = "claude_subscription";
  readonly displayName = "Claude (Max subscription — local only)";

  validateConfiguration(): void {
    const blocked = subscriptionEnvironmentBlocked();
    if (blocked) {
      throw new Error(`Claude subscription auth cannot run in a ${blocked} environment.`);
    }
    if (!subscriptionAuthSelected()) {
      throw new Error("Set AI_PROVIDER=claude_subscription to enable subscription auth.");
    }
  }

  getCapabilities(): CaraProviderCapabilities {
    return {
      generateText: true,
      generateStructured: false,
      streamText: false,
      embed: false,
      rerank: false,
      transcribe: false,
      analyseDocument: false,
      analyseImage: false,
      maxContextTokens: 200_000,
      // The Agent SDK does not accept a max-output-tokens bound; the model's
      // own output limit applies. The rewrite prompt bounds length by
      // instruction and the deterministic post-pass verifies the result.
      maxOutputTokens: 0,
      supportsFunctionCalling: false,
      supportsStreaming: false,
      supportsJSON: false,
      governanceLevel: "standard",
      dataResidency: [],
      certifications: [],
    };
  }

  isAvailable(): boolean {
    return isSubscriptionAuthAvailable();
  }

  async generateText(request: ProviderTextRequest): Promise<ProviderTextResponse> {
    const result = await generateViaSubscription({
      systemPrompt: request.systemPrompt ?? "",
      userPrompt: request.prompt,
      model: this.getDefaultModel(),
    });
    return {
      text: result.text,
      tokenUsage: {
        promptTokens: result.tokensInput,
        completionTokens: result.tokensOutput,
        totalTokens: result.tokensInput + result.tokensOutput,
      },
      finishReason: "stop",
      modelVersion: result.modelVersion,
    };
  }

  async generateStructured(): Promise<ProviderTextResponse> {
    throw new Error("Claude subscription provider does not support structured output.");
  }

  async *streamText(): AsyncGenerator<ProviderStreamChunk> {
    throw new Error("Claude subscription provider does not support streaming.");
  }

  /**
   * £0 by definition: subscription calls consume the owner's Max usage limits,
   * not API credits. They are still metered in tokens (usage-meter records
   * tokens with authSource "subscription"), so a model call is never hidden —
   * it just never claims an API spend that did not happen.
   */
  estimateCost(): number {
    return 0;
  }

  getDefaultModel(): string {
    return process.env.CARA_MODEL ?? process.env.CARA_TEXT_MODEL ?? "claude-sonnet-5";
  }

  getAvailableModels(): string[] {
    return [this.getDefaultModel()];
  }
}
