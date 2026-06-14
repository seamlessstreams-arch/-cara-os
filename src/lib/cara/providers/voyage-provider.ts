// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence — Voyage AI Provider Adapter
//
// Used for: embeddings, semantic search, filing cabinet search,
// evidence retrieval, Reg 45 evidence matching, child timeline search.
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

export class VoyageProvider extends BaseCaraProvider {
  readonly name = "voyage" as const;
  readonly displayName = "Voyage AI";

  private apiKey: string | undefined;
  private baseUrl = "https://api.voyageai.com/v1";

  validateConfiguration(): void {
    this.apiKey = process.env.VOYAGE_API_KEY;
    if (!this.apiKey) {
      throw new Error("VOYAGE_API_KEY environment variable not set");
    }
  }

  getCapabilities(): CaraProviderCapabilities {
    return {
      generateText: false,
      generateStructured: false,
      streamText: false,
      embed: true,
      rerank: true,
      transcribe: false,
      analyseDocument: false,
      analyseImage: false,
      maxContextTokens: 32000,
      maxOutputTokens: 0,
      supportsFunctionCalling: false,
      supportsStreaming: false,
      supportsJSON: false,
      governanceLevel: "standard",
      dataResidency: ["us"],
      certifications: ["SOC2"],
    };
  }

  isAvailable(): boolean {
    return !!process.env.VOYAGE_API_KEY;
  }

  getDefaultModel(): string {
    return "voyage-3";
  }

  getAvailableModels(): string[] {
    return ["voyage-3", "voyage-3-lite", "voyage-code-3"];
  }

  estimateCost(inputTokens: number, _outputTokens: number, model?: string): number {
    const m = model ?? this.getDefaultModel();
    const costs = PROVIDER_COST_PER_1K[m] ?? PROVIDER_COST_PER_1K["voyage-3"];
    return (inputTokens / 1000) * costs.input;
  }

  // Voyage is embedding/reranking only — text generation not supported
  async generateText(_request: ProviderTextRequest): Promise<ProviderTextResponse> {
    throw new CaraProviderError("Voyage AI does not support text generation", "voyage", false);
  }

  async generateStructured(
    _request: ProviderTextRequest & { schema: Record<string, unknown> },
  ): Promise<ProviderTextResponse> {
    throw new CaraProviderError("Voyage AI does not support structured generation", "voyage", false);
  }

  async *streamText(_request: ProviderTextRequest): AsyncGenerator<ProviderStreamChunk> {
    throw new CaraProviderError("Voyage AI does not support streaming", "voyage", false);
  }

  async embed(request: ProviderEmbeddingRequest): Promise<ProviderEmbeddingResponse> {
    this.validateConfiguration();
    const model = request.model ?? this.getDefaultModel();

    const response = await this.fetchWithRetry(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: request.texts,
        input_type: "document",
      }),
    });

    const data = await response.json();
    if (!response.ok) this.handleAPIError(data, response.status);

    return {
      embeddings: data.data.map((d: { embedding: number[] }) => d.embedding),
      tokenUsage: {
        promptTokens: data.usage?.total_tokens ?? 0,
        completionTokens: 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      model,
    };
  }

  async rerank(request: ProviderRerankRequest): Promise<ProviderRerankResponse> {
    this.validateConfiguration();
    const model = request.model ?? "rerank-2";

    const response = await this.fetchWithRetry(`${this.baseUrl}/rerank`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        query: request.query,
        documents: request.documents,
        top_k: request.topK ?? 10,
      }),
    });

    const data = await response.json();
    if (!response.ok) this.handleAPIError(data, response.status);

    return {
      results: (data.data ?? []).map((r: any) => ({
        index: r.index,
        relevanceScore: r.relevance_score,
      })),
      tokenUsage: {
        promptTokens: data.usage?.total_tokens ?? 0,
        completionTokens: 0,
        totalTokens: data.usage?.total_tokens ?? 0,
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
      if ((error?.name === "TimeoutError" || error?.name === "AbortError") && attempt < DEFAULT_RETRY_CONFIG.maxRetries) {
        const delay = DEFAULT_RETRY_CONFIG.baseDelayMs * Math.pow(DEFAULT_RETRY_CONFIG.backoffMultiplier, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, init, attempt + 1);
      }
      if (error?.name === "TimeoutError" || error?.name === "AbortError") throw new CaraTimeoutError("voyage", DEFAULT_TIMEOUT_MS);
      throw new CaraProviderError(`Voyage request failed: ${error?.message}`, "voyage", true);
    }
  }

  private handleAPIError(data: any, status: number): never {
    if (status === 429) throw new CaraRateLimitError("voyage");
    throw new CaraProviderError(`Voyage API error: ${data?.detail ?? "Unknown"}`, "voyage", status >= 500);
  }
}
