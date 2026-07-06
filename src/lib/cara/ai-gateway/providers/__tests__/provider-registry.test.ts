// ══════════════════════════════════════════════════════════════════════════════
// CARA — provider layer tests (prompt 3 §6/§25)
//
// Pins: the SAFE DEFAULT is deterministic (no model, external disabled); the
// registry resolves modes from env; the local provider never sends data
// externally; the deterministic provider is never available and never generates.
// All via injected env — no process.env mutation, no network.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { resolveAiMode, resolveProvider, externalAiEnabled, describeAiMode } from "../provider-registry";
import { DeterministicOnlyProvider } from "../deterministic-only-provider";
import { LocalLLMProvider } from "../local-llm-provider";

describe("resolveAiMode", () => {
  it("defaults to deterministic when unset or unrecognised", () => {
    expect(resolveAiMode({})).toBe("deterministic");
    expect(resolveAiMode({ CARA_AI_MODE: "nonsense" })).toBe("deterministic");
  });
  it("reads valid modes", () => {
    expect(resolveAiMode({ CARA_AI_MODE: "local" })).toBe("local");
    expect(resolveAiMode({ CARA_AI_MODE: "hybrid" })).toBe("hybrid");
    expect(resolveAiMode({ CARA_AI_MODE: "external-disabled" })).toBe("external-disabled");
  });
});

describe("resolveProvider", () => {
  it("returns the deterministic-only provider by default", () => {
    expect(resolveProvider({})).toBeInstanceOf(DeterministicOnlyProvider);
  });
  it("returns the deterministic-only provider in local mode with no URL", () => {
    expect(resolveProvider({ CARA_AI_MODE: "local" })).toBeInstanceOf(DeterministicOnlyProvider);
  });
  it("returns a local provider when local mode + base URL are set", () => {
    const p = resolveProvider({ CARA_AI_MODE: "local", CARA_LOCAL_LLM_BASE_URL: "http://localhost:11434/v1", CARA_LOCAL_LLM_MODEL: "llama3.1" });
    expect(p).toBeInstanceOf(LocalLLMProvider);
    const info = p.info();
    expect(info.kind).toBe("local");
    expect(info.sendsDataExternally).toBe(false); // stays on the home's infrastructure
    expect(info.model).toBe("llama3.1");
  });
});

describe("externalAiEnabled — off by default", () => {
  it("is false unless explicitly enabled", () => {
    expect(externalAiEnabled({})).toBe(false);
    expect(externalAiEnabled({ CARA_EXTERNAL_AI_ENABLED: "true" })).toBe(true);
  });
});

describe("DeterministicOnlyProvider", () => {
  it("is never available and never generates", async () => {
    const p = new DeterministicOnlyProvider();
    expect(await p.isAvailable()).toBe(false);
    await expect(p.generate({ userPrompt: "x" })).rejects.toThrow();
  });
});

describe("describeAiMode (deterministic default — no network)", () => {
  it("describes the safe default", async () => {
    const d = await describeAiMode({});
    expect(d.mode).toBe("deterministic");
    expect(d.providerAvailable).toBe(false);
    expect(d.externalAiEnabled).toBe(false);
    expect(d.provider.kind).toBe("none");
    expect(d.summary).toMatch(/deterministically|no model/i);
  });
});
