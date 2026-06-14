// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence — Mistral Provider Adapter
//
// Used for: lower-cost document extraction, classification, summarisation,
// tagging, non-critical admin support and European-friendly processing.
// ══════════════════════════════════════════════════════════════════════════════

import type { CaraProviderCapabilities } from "../core/types";
import { CaraProviderError, CaraTimeoutError, CaraRateLimitError } from "../core/errors";
import { DEFAULT_TIMEOUT_MS, DEFAULT_RETRY_CONFIG, PROVIDER_COST_PER_1K } from "../core/constants";
import {
  BaseCaraProvider,
  type ProviderTextRequest,
  type ProviderTextResponse,
  type ProviderStreamChunk,
  type ProviderEmbeddingRequest,
  type ProviderEmbeddingResponse,
} from "./base-provider";

export class MistralProvider extends BaseCaraProvider {
  readonly name = "mistral" as const;
  readonly displayName = "Mistral AI";

  private apiKey: string | undefined;
  private baseUrl = "https://api.mistral.ai/v1";

  validateConfiguration(): void {
    this.apiKey = process.env.MISTRAL_API_KEY;
    if (!this.apiKey) {
      throw new Error("MISTRAL_API_KEY environment variable not set");
    }
  }

  getCapabilities(): CaraProviderCapabilities {
    return {
      generateText: true,
      generateStructured: true,
      streamText: true,
      embed: true,
      rerank: false,
      transcribe: false,
      analyseDocument: false,
      analyseImage: false,
      maxContextTokens: 128000,
      maxOutputTokens: 8192,
      supportsFunctionCalling: true,
      supportsStreaming: true,
      supportsJSON: true,
      governanceLevel: "standard",
      dataResidency: ["eu"],
      certifications: ["SOC2"],
    };
  }

  isAvailable(): boolean {
    return !!process.env.MISTRAL_API_KEY;
  }

  getDefaultModel(): string {
    return "mistral-large-latest";
  }

  getAvailableModels(): string[] {
    return ["mistral-large-latest", "mistral-small-latest", "mistral-medium-latest"];
  }

  estimateCost(inputTokens: number, outputTokens: number, model?: string): number {
    const m = model ?? this.getDefaultModel();
    const costs = PROVIDER_COST_PER_1K[m] ?? PROVIDER_COST_PER_1K["mistral-large-latest"];
    return (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output;
  }

  async generateText(request: ProviderTextRequest): Promise<ProviderTextResponse> {
    this.validateConfiguration();
    const model = this.getDefaultModel();

    const messages: Array<{ role: string; content: string }> = [];
    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }
    messages.push({ role: "user", content: request.prompt });

    const body: Record<string, unknown> = {
      model,
      messages,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
    };

    if (request.responseFormat === "json") {
      body.response_format = { type: "json_object" };
    }

    const response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
    const structuredPrompt = `${request.prompt}\n\nRespond with valid JSON matching this schema:\n${JSON.stringify(request.schema, null, 2)}`;
    return this.generateText({ ...request, prompt: structuredPrompt, responseFormat: "json" });
  }

  async *streamText(request: ProviderTextRequest): AsyncGenerator<ProviderStreamChunk> {
    this.validateConfiguration();
    const model = this.getDefaultModel();

    const messages: Array<{ role: string; content: string }> = [];
    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }
    messages.push({ role: "user", content: request.prompt });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
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
        stream: true,
      }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS * 2),
    });

    if (!response.ok || !response.body) {
      throw new CaraProviderError(`Mistral stream failed: ${response.status}`, "mistral", true);
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
    } finally {
      reader.releaseLock();
    }
    yield { text: "", done: true };
  }

  async embed(request: ProviderEmbeddingRequest): Promise<ProviderEmbeddingResponse> {
    this.validateConfiguration();
    const model = request.model ?? "mistral-embed";

    const response = await this.fetchWithRetry(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, input: request.texts }),
    });

    const data = await response.json();
    if (!response.ok) this.handleAPIError(data, response.status);

    return {
      embeddings: data.data.map((d: { embedding: number[] }) => d.embedding),
      tokenUsage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      model,
    };
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
      if ((error?.name === "TimeoutError" || error?.name === "AbortError") && attempt < DEFAULT_RETRY_CONFIG.maxRetries) {
        const delay = DEFAULT_RETRY_CONFIG.baseDelayMs * Math.pow(DEFAULT_RETRY_CONFIG.backoffMultiplier, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, init, attempt + 1);
      }
      if (error?.name === "TimeoutError" || error?.name === "AbortError") {
        throw new CaraTimeoutError("mistral", DEFAULT_TIMEOUT_MS);
      }
      throw new CaraProviderError(`Mistral request failed: ${error?.message}`, "mistral", true);
    }
  }

  private handleAPIError(data: any, status: number): never {
    if (status === 429) throw new CaraRateLimitError("mistral");
    throw new CaraProviderError(`Mistral API error: ${data?.message ?? "Unknown"}`, "mistral", status >= 500);
  }
}
