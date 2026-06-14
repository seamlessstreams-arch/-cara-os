// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence — Perplexity Provider Adapter
//
// CRITICAL SAFETY RULE: Perplexity is for PUBLIC RESEARCH ONLY.
// Never send child-identifiable, staff-identifiable, or confidential
// care data to Perplexity.
// ══════════════════════════════════════════════════════════════════════════════

import type { CaraProviderCapabilities } from "../core/types";
import { CaraProviderError, CaraTimeoutError, CaraRateLimitError, CaraSafetyBlockError } from "../core/errors";
import { DEFAULT_TIMEOUT_MS, DEFAULT_RETRY_CONFIG, PROVIDER_COST_PER_1K } from "../core/constants";
import {
  BaseCaraProvider,
  type ProviderTextRequest,
  type ProviderTextResponse,
  type ProviderStreamChunk,
} from "./base-provider";

export class PerplexityProvider extends BaseCaraProvider {
  readonly name = "perplexity" as const;
  readonly displayName = "Perplexity (Public Research Only)";

  private apiKey: string | undefined;
  private baseUrl = "https://api.perplexity.ai";

  validateConfiguration(): void {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
    if (!this.apiKey) throw new Error("PERPLEXITY_API_KEY environment variable not set");
  }

  getCapabilities(): CaraProviderCapabilities {
    return {
      generateText: true,
      generateStructured: false,
      streamText: true,
      embed: false,
      rerank: false,
      transcribe: false,
      analyseDocument: false,
      analyseImage: false,
      maxContextTokens: 128000,
      maxOutputTokens: 4096,
      supportsFunctionCalling: false,
      supportsStreaming: true,
      supportsJSON: false,
      governanceLevel: "standard",
      dataResidency: ["us"],
      certifications: [],
    };
  }

  isAvailable(): boolean {
    return !!process.env.PERPLEXITY_API_KEY;
  }

  getDefaultModel(): string {
    return "sonar";
  }

  getAvailableModels(): string[] {
    return ["sonar", "sonar-pro"];
  }

  estimateCost(inputTokens: number, outputTokens: number, model?: string): number {
    const m = model ?? "perplexity-sonar";
    const costs = PROVIDER_COST_PER_1K[m] ?? PROVIDER_COST_PER_1K["perplexity-sonar"];
    return (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output;
  }

  async generateText(request: ProviderTextRequest): Promise<ProviderTextResponse> {
    this.validateConfiguration();
    this.validatePublicOnly(request.prompt, request.systemPrompt);

    const model = this.getDefaultModel();

    const messages: Array<{ role: string; content: string }> = [];
    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }
    messages.push({ role: "user", content: request.prompt });

    const response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: request.maxTokens ?? 4096,
        temperature: request.temperature ?? 0.7,
      }),
    });

    const data = await response.json();
    if (!response.ok) this.handleAPIError(data, response.status);

    return {
      text: data.choices[0]?.message?.content ?? "",
      tokenUsage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      finishReason: data.choices[0]?.finish_reason ?? "stop",
      modelVersion: data.model,
    };
  }

  async generateStructured(
    request: ProviderTextRequest & { schema: Record<string, unknown> },
  ): Promise<ProviderTextResponse> {
    return this.generateText({ ...request, prompt: `${request.prompt}\n\nRespond in JSON format.` });
  }

  async *streamText(request: ProviderTextRequest): AsyncGenerator<ProviderStreamChunk> {
    this.validateConfiguration();
    this.validatePublicOnly(request.prompt, request.systemPrompt);

    const model = this.getDefaultModel();
    const messages: Array<{ role: string; content: string }> = [];
    if (request.systemPrompt) messages.push({ role: "system", content: request.systemPrompt });
    messages.push({ role: "user", content: request.prompt });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, stream: true }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS * 2),
    });

    if (!response.ok || !response.body) {
      throw new CaraProviderError(`Perplexity stream failed: ${response.status}`, "perplexity", true);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") { yield { text: "", done: true }; return; }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content ?? "";
            if (content) yield { text: content, done: false };
          } catch { /* skip */ }
        }
      }
    } finally { reader.releaseLock(); }
    yield { text: "", done: true };
  }

  // ── Safety Check ──────────────────────────────────────────────────────────
  // Perplexity must never receive child-sensitive or care data.
  // This is a final defense — routing should have blocked this upstream.

  private validatePublicOnly(prompt: string, systemPrompt?: string): void {
    const combined = `${systemPrompt ?? ""} ${prompt}`.toLowerCase();

    // Check for obvious identifiable/sensitive patterns
    const sensitivePatterns = [
      /\bchild[-_]?\d+/i,
      /\[child_\d+\]/i,
      /\bsafeguarding\b/i,
      /\ballegation/i,
      /\bsection\s*47\b/i,
      /\bchild protection\b/i,
      /\blac\s+(entry|nurse|health)/i,
      /\bcare\s+order\b/i,
      /\bplacement\s+(plan|breakdown|stability)/i,
      /\bmissing\s+from\s+care\b/i,
      /\b(cse|cce|exploitation)\b/i,
      /\bself.?harm\b/i,
      /\brestraint\b/i,
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(combined)) {
        throw new CaraSafetyBlockError(
          "Perplexity is for PUBLIC RESEARCH ONLY. Sensitive care data detected in prompt. " +
          "This request has been blocked. Use an enterprise-governed provider for this task.",
        );
      }
    }
  }

  private async fetchWithRetry(url: string, init: RequestInit, attempt = 0): Promise<Response> {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS) });
      if (response.status === 429 && attempt < DEFAULT_RETRY_CONFIG.maxRetries) {
        const delay = DEFAULT_RETRY_CONFIG.baseDelayMs * Math.pow(DEFAULT_RETRY_CONFIG.backoffMultiplier, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, init, attempt + 1);
      }
      if (response.status >= 500 && attempt < DEFAULT_RETRY_CONFIG.maxRetries) {
        const delay = DEFAULT_RETRY_CONFIG.baseDelayMs * Math.pow(DEFAULT_RETRY_CONFIG.backoffMultiplier, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, init, attempt + 1);
      }
      return response;
    } catch (error: any) {
      if (error?.name === "TimeoutError" || error?.name === "AbortError") throw new CaraTimeoutError("perplexity", DEFAULT_TIMEOUT_MS);
      throw new CaraProviderError(`Perplexity request failed: ${error?.message}`, "perplexity", true);
    }
  }

  private handleAPIError(data: any, status: number): never {
    if (status === 429) throw new CaraRateLimitError("perplexity");
    throw new CaraProviderError(`Perplexity API error: ${data?.error?.message ?? "Unknown"}`, "perplexity", status >= 500);
  }
}
