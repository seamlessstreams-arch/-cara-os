// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — SWAPPABLE AI PROVIDER
//
// generateStructured<T> abstraction so Cara Studio is never locked to one
// model. The default implementation rides the platform's existing server-only
// Anthropic path (generateText: CARA_*/CARA_* env, graceful when unconfigured)
// and validates the model's JSON against the caller's Zod schema. The mock
// provider returns null, which tells generators to use their deterministic
// scaffold — so the whole UI works with no API key and in tests.
//
// IMPORTANT: Cara Studio outputs are deterministic-first. The LLM only
// ENRICHES a scaffold that is already safe and complete; if enrichment fails
// validation or guardrails, the scaffold stands.
// ══════════════════════════════════════════════════════════════════════════════

import "server-only";
import type { z } from "zod";
import { generateText } from "@/lib/cara/cara-provider";
import { CARA_STUDIO_SYSTEM_PROMPT } from "./cara-prompt-library";

export interface StructuredGenParams<T> {
  schema: z.ZodType<T>;
  schemaName: string;
  prompt: string;
  system?: string;
  temperature?: number;
}

export interface StructuredGenResult<T> {
  value: T | null;
  llmUsed: boolean;
  modelId: string;
}

export interface CaraAIProvider {
  generateStructured<T>(params: StructuredGenParams<T>): Promise<StructuredGenResult<T>>;
}

function extractJson(text: string): unknown | null {
  // Models sometimes wrap JSON in fences or prose — take the outermost object.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** Default provider: the platform's Anthropic path with Zod validation. */
export class PlatformAIProvider implements CaraAIProvider {
  async generateStructured<T>(params: StructuredGenParams<T>): Promise<StructuredGenResult<T>> {
    const res = await generateText({
      systemPrompt: `${params.system ?? CARA_STUDIO_SYSTEM_PROMPT}\n\nRespond with ONLY a single JSON object matching the ${params.schemaName} shape you are given. No markdown fences, no commentary.`,
      userPrompt: params.prompt,
      temperature: params.temperature ?? 0.4,
      maxOutputTokens: 3000,
    });
    if (!res.llmUsed || !res.text) {
      return { value: null, llmUsed: false, modelId: res.modelId ?? "unconfigured" };
    }
    const raw = extractJson(res.text);
    if (raw === null) return { value: null, llmUsed: true, modelId: res.modelId ?? "unknown" };
    const parsed = params.schema.safeParse(raw);
    if (!parsed.success) {
      // Invalid enrichment is discarded — the deterministic scaffold stands.
      return { value: null, llmUsed: true, modelId: res.modelId ?? "unknown" };
    }
    return { value: parsed.data, llmUsed: true, modelId: res.modelId ?? "unknown" };
  }
}

/** Mock provider for development and tests: always falls back to scaffolds. */
export class MockAIProvider implements CaraAIProvider {
  async generateStructured<T>(): Promise<StructuredGenResult<T>> {
    return { value: null, llmUsed: false, modelId: "mock" };
  }
}

let provider: CaraAIProvider | null = null;
export function getCaraAIProvider(): CaraAIProvider {
  if (!provider) {
    provider = process.env.CARA_STUDIO_MOCK_AI === "true" ? new MockAIProvider() : new PlatformAIProvider();
  }
  return provider;
}
