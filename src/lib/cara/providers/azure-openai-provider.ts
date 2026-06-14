// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence — Azure OpenAI Provider Adapter
//
// Enterprise-governed deployment. Used for high-risk, safeguarding-sensitive,
// legal, and management oversight tasks where data governance is essential.
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

export class AzureOpenAIProvider extends BaseCaraProvider {
  readonly name = "azure_openai" as const;
  readonly displayName = "Azure OpenAI (Enterprise)";

  private apiKey: string | undefined;
  private endpoint: string | undefined;
  private deployment: string | undefined;
  private apiVersion = "2024-08-01-preview";

  validateConfiguration(): void {
    this.apiKey = process.env.AZURE_OPENAI_API_KEY;
    this.endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    this.deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

    if (!this.apiKey) throw new Error("AZURE_OPENAI_API_KEY not set");
    if (!this.endpoint) throw new Error("AZURE_OPENAI_ENDPOINT not set");
    if (!this.deployment) throw new Error("AZURE_OPENAI_DEPLOYMENT not set");
  }

  getCapabilities(): CaraProviderCapabilities {
    return {
      generateText: true,
      generateStructured: true,
      streamText: true,
      embed: true,
      rerank: false,
      transcribe: true,
      analyseDocument: true,
      analyseImage: true,
      maxContextTokens: 128000,
      maxOutputTokens: 16384,
      supportsFunctionCalling: true,
      supportsStreaming: true,
      supportsJSON: true,
      governanceLevel: "enterprise",
      dataResidency: ["uk", "eu", "us"],
      certifications: ["SOC2", "ISO27001", "ISO27701", "C5", "HIPAA", "FedRAMP"],
    };
  }

  isAvailable(): boolean {
    return !!(process.env.AZURE_OPENAI_API_KEY &&
      process.env.AZURE_OPENAI_ENDPOINT &&
      process.env.AZURE_OPENAI_DEPLOYMENT);
  }

  getDefaultModel(): string {
    return "gpt-4o";
  }

  getAvailableModels(): string[] {
    return ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"];
  }

  estimateCost(inputTokens: number, outputTokens: number, model?: string): number {
    // Azure pricing is typically 1.0-1.2x OpenAI pricing
    const m = model ?? this.getDefaultModel();
    const costs = PROVIDER_COST_PER_1K[m] ?? PROVIDER_COST_PER_1K["gpt-4o"];
    return ((inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output) * 1.1;
  }

  private getBaseUrl(): string {
    return `${this.endpoint}/openai/deployments/${this.deployment}`;
  }

  async generateText(request: ProviderTextRequest): Promise<ProviderTextResponse> {
    this.validateConfiguration();

    const messages: Array<{ role: string; content: string }> = [];
    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }
    messages.push({ role: "user", content: request.prompt });

    const body: Record<string, unknown> = {
      messages,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.7,
    };

    if (request.responseFormat === "json") {
      body.response_format = { type: "json_object" };
    }

    if (request.stopSequences?.length) {
      body.stop = request.stopSequences;
    }

    const url = `${this.getBaseUrl()}/chat/completions?api-version=${this.apiVersion}`;

    const response = await this.fetchWithRetry(url, {
      method: "POST",
      headers: {
        "api-key": this.apiKey!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      this.handleAPIError(data, response.status);
    }

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
    return this.generateText({
      ...request,
      prompt: structuredPrompt,
      responseFormat: "json",
    });
  }

  async *streamText(request: ProviderTextRequest): AsyncGenerator<ProviderStreamChunk> {
    this.validateConfiguration();

    const messages: Array<{ role: string; content: string }> = [];
    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }
    messages.push({ role: "user", content: request.prompt });

    const url = `${this.getBaseUrl()}/chat/completions?api-version=${this.apiVersion}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "api-key": this.apiKey!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        max_tokens: request.maxTokens ?? 4096,
        temperature: request.temperature ?? 0.7,
        stream: true,
      }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS * 2),
    });

    if (!response.ok || !response.body) {
      throw new CaraProviderError(`Azure stream failed: ${response.status}`, "azure_openai", true);
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
          if (data === "[DONE]") {
            yield { text: "", done: true };
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content ?? "";
            if (content) {
              yield { text: content, done: false };
            }
          } catch {
            // Skip
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { text: "", done: true };
  }

  async embed(request: ProviderEmbeddingRequest): Promise<ProviderEmbeddingResponse> {
    this.validateConfiguration();
    const model = request.model ?? "text-embedding-3-small";

    // Azure embeddings use a separate deployment
    const embeddingEndpoint = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT
      ? `${this.endpoint}/openai/deployments/${process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT}/embeddings?api-version=${this.apiVersion}`
      : `${this.getBaseUrl()}/embeddings?api-version=${this.apiVersion}`;

    const response = await this.fetchWithRetry(embeddingEndpoint, {
      method: "POST",
      headers: {
        "api-key": this.apiKey!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: request.texts,
        dimensions: request.dimensions,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      this.handleAPIError(data, response.status);
    }

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

  // ── Private Helpers ───────────────────────────────────────────────────────

  private async fetchWithRetry(url: string, init: RequestInit, attempt = 0): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });

      if (response.status === 429 && attempt < DEFAULT_RETRY_CONFIG.maxRetries) {
        const retryAfter = parseInt(response.headers.get("retry-after") ?? "2", 10) * 1000;
        const delay = Math.min(retryAfter, DEFAULT_RETRY_CONFIG.maxDelayMs);
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
        throw new CaraTimeoutError("azure_openai", DEFAULT_TIMEOUT_MS);
      }
      throw new CaraProviderError(`Azure OpenAI request failed: ${error?.message}`, "azure_openai", true);
    }
  }

  private handleAPIError(data: any, status: number): never {
    if (status === 429) {
      throw new CaraRateLimitError("azure_openai");
    }
    throw new CaraProviderError(
      `Azure OpenAI error: ${data?.error?.message ?? "Unknown error"}`,
      "azure_openai",
      status >= 500,
    );
  }
}
