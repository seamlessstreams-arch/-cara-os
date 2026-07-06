// ══════════════════════════════════════════════════════════════════════════════
// CARA — GATEWAY GENERATION VIA THE PROVIDER LAYER
//
// Routes the gateway's metered generation seam (step 8) through resolveProvider():
// when a local, self-hosted model is configured AND reachable, generation runs on
// it; otherwise it falls back to the existing external (Anthropic) path exactly as
// before. Redaction + prompt-injection guard have already run on the text passed
// in, and the response scanner runs on the output — so the LOCAL path inherits the
// same governance as the external one. The safeguarding-sensitivity BLOCK gate
// upstream still applies to both.
//
// On prod (CARA_AI_MODE unset) resolveProvider() is the deterministic-only
// provider, so activeLocalProvider() is null and these are zero-latency
// pass-throughs — behaviour is unchanged unless local is explicitly configured.
// ══════════════════════════════════════════════════════════════════════════════

import { getCaraProviderConfig, generateText, type CaraTextGenerationInput, type CaraTextGenerationResult } from "../cara-provider";
import { streamCaraText, type CaraStreamInput, type CaraStreamHandlers, type CaraStreamResult } from "../cara-provider-stream";
import { resolveProvider } from "./providers/provider-registry";
import { LocalLLMProvider } from "./providers/local-llm-provider";

function activeLocalProvider(): LocalLLMProvider | null {
  const p = resolveProvider();
  return p instanceof LocalLLMProvider ? p : null;
}

/** True when a local model is configured — used to allow the gateway to proceed
 *  past the "provider configured" gate even without an external API key. */
export function providerConfiguredOrLocal(): boolean {
  return getCaraProviderConfig().configured || activeLocalProvider() !== null;
}

/** A local (on-premises) provider keeps data inside the home, so it is not subject
 *  to the external-provider risk register. The upstream safeguarding-sensitivity
 *  BLOCK gate still applies to it. */
export function localProviderActive(): boolean {
  return activeLocalProvider() !== null;
}

const estTokens = (chars: number): number => Math.max(1, Math.ceil(chars / 4));

/** Non-streaming generation: local first (if reachable), else the external path. */
export async function generateViaProvider(input: CaraTextGenerationInput): Promise<CaraTextGenerationResult> {
  const local = activeLocalProvider();
  if (local) {
    try {
      if (await local.isAvailable()) {
        const r = await local.generate({ systemPrompt: input.systemPrompt, userPrompt: input.userPrompt, maxOutputTokens: input.maxOutputTokens, temperature: input.temperature });
        if (r.llmUsed) {
          return {
            text: r.output,
            llmUsed: true,
            providerId: getCaraProviderConfig().providerId,
            modelId: `local:${r.model}`,
            tokensInput: estTokens(input.systemPrompt.length + input.userPrompt.length),
            tokensOutput: estTokens(r.output.length),
          };
        }
      }
    } catch {
      /* local failed → fall back to the external / deterministic path below */
    }
  }
  return generateText(input);
}

/** Streaming generation: local emits its answer as one delta (the gateway's live
 *  safety circuit-breaker still scans it), else the external streaming path. */
export async function streamViaProvider(input: CaraStreamInput, handlers: CaraStreamHandlers): Promise<CaraStreamResult> {
  const local = activeLocalProvider();
  if (local) {
    try {
      if (await local.isAvailable()) {
        const r = await local.generate({ systemPrompt: input.systemPrompt, userPrompt: input.userPrompt, maxOutputTokens: input.maxOutputTokens, temperature: input.temperature });
        if (r.llmUsed) {
          handlers.onTextDelta(r.output);
          return {
            llmUsed: true,
            providerId: "none",
            modelId: `local:${r.model}`,
            tokensInput: estTokens(input.systemPrompt.length + input.userPrompt.length),
            tokensOutput: estTokens(r.output.length),
            cacheCreationInputTokens: 0,
            cacheReadInputTokens: 0,
          };
        }
      }
    } catch {
      /* fall back to the external streaming path below */
    }
  }
  return streamCaraText(input, handlers);
}
