// ══════════════════════════════════════════════════════════════════════════════
// CARA — STREAMING PROVIDER SEAM
//
// Server-side only. The streaming counterpart to cara-provider.generateText —
// it exists so streaming AI calls can flow through the AI Gateway like every
// other call (gating, redaction, cost, metering, audit) instead of hitting the
// Anthropic SDK directly.
//
// It preserves prompt caching (optional cache_control system block) so the heavy
// /api/v1/cara route keeps its cache discount, and reports the cache token counts
// back so the SSE contract is unchanged. Metering mirrors generateText: each
// completed stream records one AI decision + its token usage.
//
// The caller (the gateway) only reaches this with a configured provider — but it
// still degrades to { llmUsed: false } on any error rather than throwing, so a
// flaky provider can't crash the request.
// ══════════════════════════════════════════════════════════════════════════════

import "server-only";

import type Anthropic from "@anthropic-ai/sdk";
import { getAnthropicClient } from "@/lib/anthropic-client";
import { getCaraProviderConfig } from "./cara-provider";

export interface CaraStreamInput {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
  /** Wrap the system block in cache_control so repeat calls read from cache. */
  cacheSystem?: boolean;
  /** HQ metering label. */
  feature?: string;
}

export interface CaraStreamHandlers {
  onTextDelta: (text: string) => void;
  onMessageDelta?: (stopReason: string | null) => void;
}

export interface CaraStreamResult {
  llmUsed: boolean;
  providerId: "anthropic" | "none";
  /** How the model call was authenticated (absent when no model ran). */
  authSource?: "api_key" | "subscription";
  modelId: string;
  tokensInput: number;
  tokensOutput: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
}

function empty(model: string, providerId: "anthropic" | "none"): CaraStreamResult {
  return {
    llmUsed: false,
    providerId,
    modelId: model,
    tokensInput: 0,
    tokensOutput: 0,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0,
  };
}

export async function streamCaraText(
  input: CaraStreamInput,
  handlers: CaraStreamHandlers,
): Promise<CaraStreamResult> {
  const config = getCaraProviderConfig();
  const model = input.model ?? config.textModel;

  // The gateway guards this, but stay defensive: no key → no stream, no throw.
  if (!config.configured || config.providerId !== "anthropic") {
    return empty(model, "none");
  }

  const systemBlock: Anthropic.TextBlockParam = {
    type: "text",
    text: input.systemPrompt,
    ...(input.cacheSystem ? { cache_control: { type: "ephemeral" } } : {}),
  };
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: [{ type: "text", text: input.userPrompt }] },
  ];

  try {
    const stream = getAnthropicClient().messages.stream({
      model,
      max_tokens: input.maxOutputTokens ?? 1500,
      system: [systemBlock],
      messages,
      ...(input.temperature != null ? { temperature: input.temperature } : {}),
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        handlers.onTextDelta(event.delta.text);
      } else if (event.type === "message_delta") {
        handlers.onMessageDelta?.(event.delta.stop_reason ?? null);
      }
    }

    const final = await stream.finalMessage();
    const tokensInput = final.usage.input_tokens ?? 0;
    const tokensOutput = final.usage.output_tokens ?? 0;
    const cacheCreationInputTokens = final.usage.cache_creation_input_tokens ?? 0;
    const cacheReadInputTokens = final.usage.cache_read_input_tokens ?? 0;

    // Meter like generateText: one AI decision + its token cost. Best-effort —
    // the dynamic import keeps the server-only meter out of this module graph.
    void import("@/lib/hq/usage-meter")
      .then((m) => {
        m.recordAiUsage({ feature: input.feature ?? "cara_stream", model, tokensInput, tokensOutput });
        m.recordDecision({ feature: input.feature ?? "cara_stream", mode: "ai" });
      })
      .catch(() => {});

    return {
      llmUsed: true,
      providerId: "anthropic",
      modelId: model,
      tokensInput,
      tokensOutput,
      cacheCreationInputTokens,
      cacheReadInputTokens,
    };
  } catch (err) {
    console.warn(
      "[cara-provider-stream] streamCaraText failed:",
      err instanceof Error ? err.message : err,
    );
    return empty(model, "anthropic");
  }
}
