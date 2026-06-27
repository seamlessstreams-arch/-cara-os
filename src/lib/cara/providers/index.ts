// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence — Provider Registry
// ══════════════════════════════════════════════════════════════════════════════

import type { CaraProviderName } from "../core/types";
import { BaseCaraProvider } from "./base-provider";
import { AnthropicProvider } from "./anthropic-provider";
import { MistralProvider } from "./mistral-provider";
import { VoyageProvider } from "./voyage-provider";
import { CohereProvider } from "./cohere-provider";
import { PerplexityProvider } from "./perplexity-provider";

export { BaseCaraProvider } from "./base-provider";
export { AnthropicProvider } from "./anthropic-provider";
export { MistralProvider } from "./mistral-provider";
export { VoyageProvider } from "./voyage-provider";
export { CohereProvider } from "./cohere-provider";
export { PerplexityProvider } from "./perplexity-provider";

export type { ProviderTextRequest, ProviderTextResponse, ProviderStreamChunk } from "./base-provider";

// ── Provider Registry ─────────────────────────────────────────────────────

const providerInstances: Map<CaraProviderName, BaseCaraProvider> = new Map();

function createProvider(name: CaraProviderName): BaseCaraProvider {
  switch (name) {
    case "anthropic": return new AnthropicProvider();
    case "mistral": return new MistralProvider();
    case "voyage": return new VoyageProvider();
    case "cohere": return new CohereProvider();
    case "perplexity": return new PerplexityProvider();
    case "bedrock":
    case "vertex_ai":
    case "groq":
    case "cerebras":
    case "black_forest_labs":
    case "recraft":
      // Placeholder — these providers return unavailable
      return new UnavailableProvider(name);
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}

/**
 * Get a provider instance by name. Lazily creates and caches.
 */
export function getProvider(name: CaraProviderName): BaseCaraProvider {
  if (!providerInstances.has(name)) {
    providerInstances.set(name, createProvider(name));
  }
  return providerInstances.get(name)!;
}

/**
 * Get all currently available (configured) providers.
 */
export function getAvailableProviders(): BaseCaraProvider[] {
  const allNames: CaraProviderName[] = [
    "anthropic", "bedrock", "vertex_ai",
    "mistral", "voyage", "cohere", "perplexity",
  ];
  return allNames
    .map(name => getProvider(name))
    .filter(p => p.isAvailable());
}

/**
 * Test connectivity for a provider.
 */
export async function testProviderConnection(name: CaraProviderName): Promise<{
  available: boolean;
  latencyMs: number;
  error?: string;
}> {
  const provider = getProvider(name);
  if (!provider.isAvailable()) {
    return { available: false, latencyMs: 0, error: "Provider not configured" };
  }

  const start = Date.now();
  try {
    provider.validateConfiguration();
    // Attempt a minimal request — embed or text based on capabilities
    const caps = provider.getCapabilities();
    if (caps.embed) {
      await provider.embed({ texts: ["connectivity test"] });
    } else if (caps.generateText) {
      await provider.generateText({
        prompt: "Respond with 'ok'",
        maxTokens: 5,
        temperature: 0,
      });
    }
    return { available: true, latencyMs: Date.now() - start };
  } catch (error: any) {
    return { available: false, latencyMs: Date.now() - start, error: error?.message };
  }
}

// ── Unavailable Provider Stub ─────────────────────────────────────────────

class UnavailableProvider extends BaseCaraProvider {
  readonly name: CaraProviderName;
  readonly displayName: string;

  constructor(name: CaraProviderName) {
    super();
    this.name = name;
    this.displayName = `${name} (Not Yet Configured)`;
  }

  validateConfiguration(): void {
    throw new Error(`Provider ${this.name} is not yet configured`);
  }

  getCapabilities() {
    return {
      generateText: false, generateStructured: false, streamText: false,
      embed: false, rerank: false, transcribe: false, analyseDocument: false,
      analyseImage: false, maxContextTokens: 0, maxOutputTokens: 0,
      supportsFunctionCalling: false, supportsStreaming: false, supportsJSON: false,
      governanceLevel: "standard" as const, dataResidency: [], certifications: [],
    };
  }

  isAvailable(): boolean { return false; }
  getDefaultModel(): string { return "none"; }
  getAvailableModels(): string[] { return []; }
  estimateCost(): number { return 0; }

  async generateText(): Promise<any> {
    throw new Error(`Provider ${this.name} not available`);
  }
  async generateStructured(): Promise<any> {
    throw new Error(`Provider ${this.name} not available`);
  }
  async *streamText(): AsyncGenerator<any> {
    throw new Error(`Provider ${this.name} not available`);
  }
}
