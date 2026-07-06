// ══════════════════════════════════════════════════════════════════════════════
// CARA — gateway generation via the provider layer (tests)
//
// Pins: with no local model configured, the helpers report "not local" and the
// gateway keeps its external behaviour. With a local model configured + reachable,
// generation runs on it (text from the local endpoint, modelId "local:…"), and
// streaming emits it as one delta. All via stubbed env + fetch — no real network.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, afterEach } from "vitest";
import { generateViaProvider, streamViaProvider, providerConfiguredOrLocal, localProviderActive } from "../generate-via-provider";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function stubLocal() {
  vi.stubEnv("CARA_AI_MODE", "local");
  vi.stubEnv("CARA_LOCAL_LLM_BASE_URL", "http://localhost:11434/v1");
  vi.stubEnv("CARA_LOCAL_LLM_MODEL", "llama3.1");
  const fetchMock = vi.fn(async (url: string) => {
    if (url.endsWith("/models")) return { ok: true } as Response;
    if (url.endsWith("/chat/completions")) {
      return { ok: true, json: async () => ({ choices: [{ message: { content: "Local model reply." } }] }) } as unknown as Response;
    }
    return { ok: false } as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("no local model configured (default)", () => {
  it("reports not-local", () => {
    vi.stubEnv("CARA_AI_MODE", "deterministic");
    expect(localProviderActive()).toBe(false);
  });
});

describe("local model configured + reachable", () => {
  it("providerConfiguredOrLocal and localProviderActive are true", () => {
    stubLocal();
    expect(localProviderActive()).toBe(true);
    expect(providerConfiguredOrLocal()).toBe(true);
  });

  it("generation runs on the local model", async () => {
    stubLocal();
    const r = await generateViaProvider({ systemPrompt: "You are Cara.", userPrompt: "Tidy this note." });
    expect(r.llmUsed).toBe(true);
    expect(r.text).toBe("Local model reply.");
    expect(r.modelId).toBe("local:llama3.1");
    expect(r.tokensOutput).toBeGreaterThan(0);
  });

  it("streaming emits the local answer as a single delta", async () => {
    stubLocal();
    const deltas: string[] = [];
    const r = await streamViaProvider(
      { systemPrompt: "You are Cara.", userPrompt: "Tidy this note." },
      { onTextDelta: (t) => deltas.push(t) }
    );
    expect(r.llmUsed).toBe(true);
    expect(r.modelId).toBe("local:llama3.1");
    expect(deltas.join("")).toBe("Local model reply.");
  });

  it("falls back to the external path when the local endpoint is unreachable", async () => {
    vi.stubEnv("CARA_AI_MODE", "local");
    vi.stubEnv("CARA_LOCAL_LLM_BASE_URL", "http://localhost:11434/v1");
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNREFUSED"); }));
    // No Anthropic key in test env → external path returns a deterministic (llmUsed:false) result, not a throw.
    const r = await generateViaProvider({ systemPrompt: "s", userPrompt: "u" });
    expect(r.llmUsed).toBe(false);
  });
});
