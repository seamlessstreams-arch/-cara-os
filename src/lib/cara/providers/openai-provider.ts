// ═══════���══════════════════════════════════════════════════════════════════════
// Cara Intelligence — OpenAI Provider Adapter
//
// Handles GPT-4o, GPT-4-turbo, GPT-4o-mini via OpenAI direct API.
// Used for: structured reasoning, workflow planning, form intelligence,
// task planning, action planning, operational decision support.
// ══════════���════════════════════════════��══════════════════════════════════════

import type { CaraProviderCapabilities, CaraTokenUsage } from "../core/types";
import { CaraProviderError, CaraTimeoutError, CaraRateLimitError } from "../core/errors";
import { DEFAULT_TIMEOUT_MS, DEFAULT_RETRY_CONFIG, PROVIDER_COST_PER_1K } from "../core/constants";
import {
  BaseCaraProvider,
  type ProviderTextRequest,
  type ProviderTextResponse,
  type ProviderStreamChunk,
  type ProviderEmbeddingRequest,
  type ProviderEmbeddingResponse,
  type ProviderImageRequest,
} from "./base-provider";

export class OpenAIProvider extends BaseCaraProvider {
  readonly name = "openai" as const;
  readonly displayName = "OpenAI";

  private apiKey: string | undefined;
  private baseUrl = "https://api.openai.com/v1";

  validateConfiguration(): void {
    this.apiKey = process.env.OPENAI_API_KEY;
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY environment variable not set");
    }
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
      governanceLevel: "standard",
      dataResidency: ["us"],
      certifications: ["SOC2", "ISO27001"],
    };
  }

  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  getDefaultModel(): string {
    return "gpt-4o";
  }

  getAvailableModels(): string[] {
    return ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"];
  }

  estimateCost(inputTokens: number, outputTokens: number, model?: string): number {
    const m = model ?? this.getDefaultModel();
    const costs = PROVIDER_COST_PER_1K[m] ?? PROVIDER_COST_PER_1K["gpt-4o"];
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

    if (request.stopSequences?.length) {
      body.stop = request.stopSequences;
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
      throw new CaraProviderError(
        `OpenAI stream failed: ${response.status}`,
        "openai",
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
            // Skip malformed chunks
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

    const response = await this.fetchWithRetry(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
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

  async analyseImage(request: ProviderImageRequest): Promise<ProviderTextResponse> {
    this.validateConfiguration();

    const imageContent = typeof request.image === "string"
      ? { type: "image_url" as const, image_url: { url: request.image } }
      : { type: "image_url" as const, image_url: { url: `data:${request.mimeType};base64,${request.image.toString("base64")}` } };

    const response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: request.prompt },
              imageContent,
            ],
          },
        ],
        max_tokens: request.maxTokens ?? 4096,
      }),
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
        throw new CaraTimeoutError("openai", DEFAULT_TIMEOUT_MS);
      }
      throw new CaraProviderError(`OpenAI request failed: ${error?.message}`, "openai", true);
    }
  }

  private handleAPIError(data: any, status: number): never {
    if (status === 429) {
      throw new CaraRateLimitError("openai");
    }
    throw new CaraProviderError(
      `OpenAI API error: ${data?.error?.message ?? "Unknown error"}`,
      "openai",
      status >= 500,
    );
  }
}
