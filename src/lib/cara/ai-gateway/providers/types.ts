// ══════════════════════════════════════════════════════════════════════════════
// CARA — LLM PROVIDER INTERFACE (prompt 3 §6)
//
// A clean, pluggable provider boundary so CARA can run its (optional, governed)
// generative fallback on a LOCAL model — Ollama / vLLM / LM Studio / llama.cpp —
// instead of an external API, keeping children's data inside the home and cutting
// external AI credit dependency.
//
// This is the boundary only. It does NOT bypass the governed gateway: deterministic
// intelligence, redaction, sensitivity gating, permission and audit all still run
// in invokeAiGateway. A provider is reached only after those pass.
// ══════════════════════════════════════════════════════════════════════════════

export const CARA_PROVIDER_LAYER_VERSION = "1.0.0";

/** How CARA is configured to source generative support. Safe default = deterministic. */
export type AiMode =
  | "deterministic" // no model at all — deterministic engines only (default)
  | "local"         // a local, self-hosted OpenAI-compatible model
  | "hybrid"        // local first, external as an explicitly-enabled fallback
  | "external-disabled"; // external providers hard-off (deterministic + local only)

export interface GenerateInput {
  systemPrompt?: string;
  userPrompt: string;
  maxOutputTokens?: number;
  temperature?: number;
}

export interface GenerateResult {
  output: string;
  model: string;
  provider: string;
  /** True when a real model produced the text (false for the deterministic stub). */
  llmUsed: boolean;
}

export interface ProviderInfo {
  name: string;
  kind: "local" | "external" | "none";
  model: string;
  /** Whether this provider sends data off the home's own infrastructure. */
  sendsDataExternally: boolean;
  baseUrl?: string;
}

export interface LLMProvider {
  info(): ProviderInfo;
  /** Cheap reachability check — never throws; returns false if unavailable. */
  isAvailable(): Promise<boolean>;
  generate(input: GenerateInput): Promise<GenerateResult>;
}
