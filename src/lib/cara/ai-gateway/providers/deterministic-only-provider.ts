// ══════════════════════════════════════════════════════════════════════════════
// CARA — DETERMINISTIC-ONLY PROVIDER (prompt 3 §6, the safe default)
//
// The null provider: never available, never generates. When CARA is in
// deterministic mode this is the active provider, so the gateway always falls
// back to its deterministic engines — no model, no external call.
// ══════════════════════════════════════════════════════════════════════════════

import type { GenerateInput, GenerateResult, LLMProvider, ProviderInfo } from "./types";

export class DeterministicOnlyProvider implements LLMProvider {
  info(): ProviderInfo {
    return { name: "deterministic", kind: "none", model: "none", sendsDataExternally: false };
  }

  async isAvailable(): Promise<boolean> {
    return false;
  }

  async generate(_input: GenerateInput): Promise<GenerateResult> {
    void _input;
    // Should never be reached — isAvailable() is false, so the gateway answers
    // deterministically instead of calling a model.
    throw new Error("DeterministicOnlyProvider does not generate — CARA is in deterministic mode.");
  }
}
