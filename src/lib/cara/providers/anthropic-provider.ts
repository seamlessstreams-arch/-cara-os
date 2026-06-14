// ═══════════════════════════════════════════���══════════════════════════════════
// Cara Intelligence — Anthropic Provider Adapter
//
// Handles Claude Sonnet, Opus, Haiku via Anthropic Messages API.
// Used for: Cara Studio, reflective writing, child-centred language,
// supervision, long reports, therapeutic narratives, complex care reflection.
// ══════════════════════════════════════════════════════════════════════════════

import type { CaraProviderCapabilities } from "../core/types";
import { CaraProviderError, CaraTimeoutError, CaraRateLimitError } from "../core/errors";
import { DEFAULT_TIMEOUT_MS, DEFAULT_RETRY_CONFIG, PROVIDER_COST_PER_1K } from "../core/constants";
import {
  BaseCaraProvider,
  type ProviderTextRequest,
  type ProviderTextResponse,
  type ProviderStreamChunk,
  type ProviderImageRequest,
} from "./base-provider";

export class AnthropicProvider extends BaseCaraProvider {
  readonly name = "anthropic" as const;
  readonly displayName = "Anthropic Claude";

  private apiKey: string | undefined;
  private baseUrl = "https://api.anthropic.com/v1";
  private apiVersion = "2023-06-01";

  validateConfiguration(): void {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    if (!this.apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable not set");
    }
  }

  getCapabilities(): CaraProviderCapabilities {
    return {
      generateText: true,
      generateStructured: true,
      streamText: true,
      embed: false,
      rerank: false,
      transcribe: false,
      analyseDocument: true,
      analyseImage: true,
      maxContextTokens: 200000,
      maxOutputTokens: 8192,
      supportsFunctionCalling: true,
      supportsStreaming: true,
      supportsJSON: true,
      governanceLevel: "standard",
      dataResidency: ["us"],
      certifications: ["SOC2", "ISO27001"],
    };
  }

  isAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  getDefaultModel(): string {
    return "claude-sonnet-4-20250514";
  }

  getAvailableModels(): string[] {
    return ["claude-sonnet-4-20250514", "claude-opus-4-20250514", "claude-haiku-3"];
  }

  estimateCost(inputTokens: number, outputTokens: number, model?: string): number {
    const m = model ?? this.getDefaultModel();
    const costs = PROVIDER_COST_PER_1K[m] ?? PROVIDER_COST_PER_1K["claude-sonnet-4-20250514"];
    return (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output;
  }

  async generateText(request: ProviderTextRequest): Promise<ProviderTextResponse> {
    this.validateConfiguration();
    const model = this.getDefaultModel();

    const body: Record<string, unknown> = {
      model,
      max_tokens: request.maxTokens ?? 4096,
      messages: [{ role: "user", content: request.prompt }],
    };

    if (request.systemPrompt) {
      body.system = request.systemPrompt;
    }

    if (request.temperature !== undefined) {
      body.temperature = request.temperature;
    }

    if (request.stopSequences?.length) {
      body.stop_sequences = request.stopSequences;
    }

    const response = await this.fetchWithRetry(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey!,
        "anthropic-version": this.apiVersion,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      this.handleAPIError(data, response.status);
    }

    const textContent = data.content?.find((c: any) => c.type === "text");

    return {
      text: textContent?.text ?? "",
      tokenUsage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
        totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
      finishReason: data.stop_reason ?? "end_turn",
      modelVersion: data.model,
    };
  }

  async generateStructured(
    request: ProviderTextRequest & { schema: Record<string, unknown> },
  ): Promise<ProviderTextResponse> {
    const structuredPrompt = `${request.prompt}\n\nRespond with valid JSON matching this schema. Output ONLY the JSON, no markdown code fences:\n${JSON.stringify(request.schema, null, 2)}`;
    return this.generateText({
      ...request,
      prompt: structuredPrompt,
    });
  }

  async *streamText(request: ProviderTextRequest): AsyncGenerator<ProviderStreamChunk> {
    this.validateConfiguration();
    const model = this.getDefaultModel();

    const body: Record<string, unknown> = {
      model,
      max_tokens: request.maxTokens ?? 4096,
      messages: [{ role: "user", content: request.prompt }],
      stream: true,
    };

    if (request.systemPrompt) {
      body.system = request.systemPrompt;
    }

    if (request.temperature !== undefined) {
      body.temperature = request.temperature;
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey!,
        "anthropic-version": this.apiVersion,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS * 2),
    });

    if (!response.ok || !response.body) {
      throw new CaraProviderError(
        `Anthropic stream failed: ${response.status}`,
        "anthropic",
        true,
      );
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
          if (!data) continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
              yield { text: parsed.delta.text, done: false };
            } else if (parsed.type === "message_stop") {
              yield { text: "", done: true };
              return;
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { text: "", done: true };
  }

  async analyseImage(request: ProviderImageRequest): Promise<ProviderTextResponse> {
    this.validateConfiguration();

    const imageSource = typeof request.image === "string"
      ? { type: "url" as const, url: request.image }
      : { type: "base64" as const, media_type: request.mimeType, data: request.image.toString("base64") };

    const body = {
      model: this.getDefaultModel(),
      max_tokens: request.maxTokens ?? 4096,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: imageSource },
            { type: "text", text: request.prompt },
          ],
        },
      ],
    };

    const response = await this.fetchWithRetry(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey!,
        "anthropic-version": this.apiVersion,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      this.handleAPIError(data, response.status);
    }

    const textContent = data.content?.find((c: any) => c.type === "text");
    return {
      text: textContent?.text ?? "",
      tokenUsage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
        totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
      finishReason: data.stop_reason ?? "end_turn",
      modelVersion: data.model,
    };
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private async fetchWithRetry(url: string, init: RequestInit, attempt = 0): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });

      if (response.status === 429 && attempt < DEFAULT_RETRY_CONFIG.maxRetries) {
        const retryAfter = parseInt(response.headers.get("retry-after") ?? "1", 10) * 1000;
        const delay = Math.min(
          retryAfter || DEFAULT_RETRY_CONFIG.baseDelayMs * Math.pow(DEFAULT_RETRY_CONFIG.backoffMultiplier, attempt),
          DEFAULT_RETRY_CONFIG.maxDelayMs,
        );
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
      if (error?.name === "TimeoutError" || error?.name === "AbortError") {
        if (attempt < DEFAULT_RETRY_CONFIG.maxRetries) {
          const delay = DEFAULT_RETRY_CONFIG.baseDelayMs * Math.pow(DEFAULT_RETRY_CONFIG.backoffMultiplier, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.fetchWithRetry(url, init, attempt + 1);
        }
        throw new CaraTimeoutError("anthropic", DEFAULT_TIMEOUT_MS);
      }
      throw new CaraProviderError(`Anthropic request failed: ${error?.message}`, "anthropic", true);
    }
  }

  private handleAPIError(data: any, status: number): never {
    if (status === 429) {
      throw new CaraRateLimitError("anthropic");
    }
    throw new CaraProviderError(
      `Anthropic API error: ${data?.error?.message ?? "Unknown error"}`,
      "anthropic",
      status >= 500,
    );
  }
}
