// ══════════════════════════════════════════════════════════════════════════════
// CARA — LOCAL LLM PROVIDER (prompt 3 §6)
//
// Talks to a self-hosted, OpenAI-compatible endpoint (Ollama, vLLM, LM Studio,
// llama.cpp server, …) so CARA's optional generative fallback can run on the
// home's / provider's own infrastructure — no children's data leaves for an
// external API. Real client: POST {baseUrl}/chat/completions.
// ══════════════════════════════════════════════════════════════════════════════

import type { GenerateInput, GenerateResult, LLMProvider, ProviderInfo } from "./types";

export interface LocalLLMConfig {
  baseUrl: string; // e.g. http://localhost:11434/v1
  model: string; // e.g. llama3.1:8b
  apiKey?: string; // usually not needed for a local server
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT = 30_000;

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return { signal: c.signal, cancel: () => clearTimeout(t) };
}

export class LocalLLMProvider implements LLMProvider {
  constructor(private readonly config: LocalLLMConfig) {}

  info(): ProviderInfo {
    return { name: "local", kind: "local", model: this.config.model, sendsDataExternally: false, baseUrl: this.config.baseUrl };
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.config.apiKey) h["Authorization"] = `Bearer ${this.config.apiKey}`;
    return h;
  }

  /** Reachability check — GET {baseUrl}/models. Never throws. */
  async isAvailable(): Promise<boolean> {
    if (!this.config.baseUrl) return false;
    const { signal, cancel } = withTimeout(this.config.timeoutMs ?? 5_000);
    try {
      const res = await fetch(`${this.config.baseUrl.replace(/\/$/, "")}/models`, { method: "GET", headers: this.headers(), signal });
      return res.ok;
    } catch {
      return false;
    } finally {
      cancel();
    }
  }

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const { signal, cancel } = withTimeout(this.config.timeoutMs ?? DEFAULT_TIMEOUT);
    try {
      const messages = [
        ...(input.systemPrompt ? [{ role: "system", content: input.systemPrompt }] : []),
        { role: "user", content: input.userPrompt },
      ];
      const res = await fetch(`${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: this.headers(),
        signal,
        body: JSON.stringify({
          model: this.config.model,
          messages,
          max_tokens: input.maxOutputTokens ?? 1024,
          temperature: input.temperature ?? 0.2,
          stream: false,
        }),
      });
      if (!res.ok) throw new Error(`Local LLM returned ${res.status}`);
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const output = json.choices?.[0]?.message?.content ?? "";
      return { output, model: this.config.model, provider: "local", llmUsed: output.length > 0 };
    } finally {
      cancel();
    }
  }
}
