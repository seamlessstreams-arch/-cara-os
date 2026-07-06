// ══════════════════════════════════════════════════════════════════════════════
// CARA — PROVIDER REGISTRY (prompt 3 §6/§21/§25)
//
// Resolves how CARA is configured to source generative support from environment
// config, with the SAFEST default: deterministic (no model, external disabled).
// External AI is off unless explicitly enabled; a local model is used only when a
// base URL is configured. This is the single place that reads the CARA_AI_* env.
// ══════════════════════════════════════════════════════════════════════════════

import { LocalLLMProvider } from "./local-llm-provider";
import { DeterministicOnlyProvider } from "./deterministic-only-provider";
import type { AiMode, LLMProvider, ProviderInfo } from "./types";

type Env = Record<string, string | undefined>;

const getEnv = (env?: Env): Env => env ?? (typeof process !== "undefined" ? process.env : {});

/** CARA_AI_MODE → mode. Anything unrecognised falls back to the safe default. */
export function resolveAiMode(env?: Env): AiMode {
  const m = (getEnv(env).CARA_AI_MODE ?? "").toLowerCase();
  if (m === "local" || m === "hybrid" || m === "external-disabled") return m;
  return "deterministic";
}

/** The active provider. Local only when a base URL is configured; else the null
 *  (deterministic-only) provider so the gateway falls back to its own engines. */
export function resolveProvider(env?: Env): LLMProvider {
  const e = getEnv(env);
  const mode = resolveAiMode(e);
  if ((mode === "local" || mode === "hybrid") && e.CARA_LOCAL_LLM_BASE_URL) {
    return new LocalLLMProvider({
      baseUrl: e.CARA_LOCAL_LLM_BASE_URL,
      model: e.CARA_LOCAL_LLM_MODEL ?? "local-model",
      apiKey: e.CARA_LOCAL_LLM_API_KEY,
    });
  }
  return new DeterministicOnlyProvider();
}

export function externalAiEnabled(env?: Env): boolean {
  return (getEnv(env).CARA_EXTERNAL_AI_ENABLED ?? "false").toLowerCase() === "true";
}

export interface AiModeDescription {
  mode: AiMode;
  provider: ProviderInfo;
  externalAiEnabled: boolean;
  localConfigured: boolean;
  providerAvailable: boolean;
  summary: string;
}

function summarise(mode: AiMode, external: boolean, localConfigured: boolean): string {
  if (mode === "deterministic") return "CARA is running deterministically — no model is called and no data leaves CARA for AI.";
  if (mode === "external-disabled") return "External AI is hard-disabled. CARA uses deterministic engines and, if configured, a local model only.";
  if (localConfigured) return `CARA is configured to use a local, self-hosted model for its governed generative fallback — no children's data leaves the home's infrastructure.${external ? " External AI is also enabled as a fallback." : ""}`;
  return "Local mode is selected but no local model URL is configured — CARA is falling back to deterministic engines.";
}

/** Full description for the governance/observability surface. Pings the provider. */
export async function describeAiMode(env?: Env): Promise<AiModeDescription> {
  const e = getEnv(env);
  const mode = resolveAiMode(e);
  const provider = resolveProvider(e);
  const external = externalAiEnabled(e);
  const localConfigured = !!e.CARA_LOCAL_LLM_BASE_URL && (mode === "local" || mode === "hybrid");
  return {
    mode,
    provider: provider.info(),
    externalAiEnabled: external,
    localConfigured,
    providerAvailable: await provider.isAvailable(),
    summary: summarise(mode, external, localConfigured),
  };
}
