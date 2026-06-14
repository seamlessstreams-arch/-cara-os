// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence — Cohere Provider Adapter
//
// Used for: reranking, classification, enterprise search,
// knowledge-base retrieval.
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
  type ProviderRerankRequest,
  type ProviderRerankResponse,
} from "./base-provider";

export class CohereProvider extends BaseCaraProvider {
  readonly name = "cohere" as const;
  readonly displayName = "Cohere";

  private apiKey: string | undefined;
  private baseUrl = "https://api.cohere.com/v2";

  validateConfiguration(): void {
    this.apiKey = process.env.COHERE_API_KEY;
    if (!this.apiKey) throw new Error("COHERE_API_KEY environment variable not set");
  }

  getCapabilities(): CaraProviderCapabilities {
    return {
      generateText: true,
      generateStructured: false,
      streamText: true,
      embed: true,
      rerank: true,
      transcribe: false,
      analyseDocument: false,
      analyseImage: false,
      maxContextTokens: 128000,
      maxOutputTokens: 4096,
      supportsFunctionCalling: true,
      supportsStreaming: true,
      supportsJSON: false,
      governanceLevel: "standard",
      dataResidency: ["us", "eu"],
      certifications: ["SOC2", "ISO27001"],
    };
  }

  isAvailable(): boolean {
    return !!process.env.COHERE_API_KEY;
  }

  getDefaultModel(): string {
    return "command-r-plus";
  }

  getAvailableModels(): string[] {
    return ["command-r-plus", "command-r", "command-light"];
  }

  estimateCost(inputTokens: number, outputTokens: number, model?: string): number {
    const m = model ?? this.getDefaultModel();
    const costs = PROVIDER_COST_PER_1K[m] ?? { input: 0.002, output: 0.006 };
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

    const response = await this.fetchWithRetry(`${this.baseUrl}/chat`, {
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

    const textContent = data.message?.content?.find((c: any) => c.type === "text");

    return {
      text: textContent?.text ?? "",
      tokenUsage: {
        promptTokens: data.usage?.billed_units?.input_tokens ?? 0,
        completionTokens: data.usage?.billed_units?.output_tokens ?? 0,
        totalTokens: (data.usage?.billed_units?.input_tokens ?? 0) + (data.usage?.billed_units?.output_tokens ?? 0),
      },
      finishReason: data.finish_reason ?? "COMPLETE",
      modelVersion: model,
    };
  }

  async generateStructured(
    request: ProviderTextRequest & { schema: Record<string, unknown> },
  ): Promise<ProviderTextResponse> {
    const structuredPrompt = `${request.prompt}\n\nRespond with valid JSON matching this schema:\n${JSON.stringify(request.schema, null, 2)}`;
    return this.generateText({ ...request, prompt: structuredPrompt });
  }

  async *streamText(request: ProviderTextRequest): AsyncGenerator<ProviderStreamChunk> {
    this.validateConfiguration();
    const model = this.getDefaultModel();

    const messages: Array<{ role: string; content: string }> = [];
    if (request.systemPrompt) messages.push({ role: "system", content: request.systemPrompt });
    messages.push({ role: "user", content: request.prompt });

    const response = await fetch(`${this.baseUrl}/chat`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, max_tokens: request.maxTokens ?? 4096, stream: true }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS * 2),
    });

    if (!response.ok || !response.body) {
      throw new CaraProviderError(`Cohere stream failed: ${response.status}`, "cohere", true);
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
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === "content-delta" && parsed.delta?.message?.content?.text) {
              yield { text: parsed.delta.message.content.text, done: false };
            } else if (parsed.type === "message-end") {
              yield { text: "", done: true };
              return;
            }
          } catch { /* skip */ }
        }
      }
    } finally { reader.releaseLock(); }
    yield { text: "", done: true };
  }

  async embed(request: ProviderEmbeddingRequest): Promise<ProviderEmbeddingResponse> {
    this.validateConfiguration();
    const model = request.model ?? "embed-english-v3.0";

    const response = await this.fetchWithRetry(`${this.baseUrl}/embed`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        texts: request.texts,
        input_type: "search_document",
        embedding_types: ["float"],
      }),
    });

    const data = await response.json();
    if (!response.ok) this.handleAPIError(data, response.status);

    return {
      embeddings: data.embeddings?.float ?? [],
      tokenUsage: {
        promptTokens: data.meta?.billed_units?.input_tokens ?? 0,
        completionTokens: 0,
        totalTokens: data.meta?.billed_units?.input_tokens ?? 0,
      },
      model,
    };
  }

  async rerank(request: ProviderRerankRequest): Promise<ProviderRerankResponse> {
    this.validateConfiguration();
    const model = request.model ?? "rerank-english-v3.0";

    const response = await this.fetchWithRetry(`${this.baseUrl}/rerank`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        query: request.query,
        documents: request.documents.map(d => ({ text: d })),
        top_n: request.topK ?? 10,
      }),
    });

    const data = await response.json();
    if (!response.ok) this.handleAPIError(data, response.status);

    return {
      results: (data.results ?? []).map((r: any) => ({
        index: r.index,
        relevanceScore: r.relevance_score,
      })),
      tokenUsage: {
        promptTokens: data.meta?.billed_units?.search_units ?? 0,
        completionTokens: 0,
        totalTokens: data.meta?.billed_units?.search_units ?? 0,
      },
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
      if (error?.name === "TimeoutError" || error?.name === "AbortError") throw new CaraTimeoutError("cohere", DEFAULT_TIMEOUT_MS);
      throw new CaraProviderError(`Cohere request failed: ${error?.message}`, "cohere", true);
    }
  }

  private handleAPIError(data: any, status: number): never {
    if (status === 429) throw new CaraRateLimitError("cohere");
    throw new CaraProviderError(`Cohere API error: ${data?.message ?? "Unknown"}`, "cohere", status >= 500);
  }
}
