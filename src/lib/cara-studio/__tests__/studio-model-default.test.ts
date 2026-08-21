// ══════════════════════════════════════════════════════════════════════════════
// Cara Studio ran an older model than the rest of the platform.
//
// getStudioAIProvider computes the model once —
//
//   const model = process.env.AI_DEFAULT_MODEL ?? CARA_DEFAULT_MODEL;
//
// — and then the configured-anthropic branch threw that away and re-derived it
// against a hardcoded "claude-sonnet-4-20250514". With AI_DEFAULT_MODEL unset
// (the normal case), every other caller used CARA_DEFAULT_MODEL while Studio
// silently used the older pinned id. Pinning the platform default in one place
// only works if every branch reads it.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getStudioAIProvider } from "../ai-provider.service";
import { CARA_DEFAULT_MODEL } from "@/lib/cara/cara-provider";

const saved = { ...process.env };

describe("studio model default", () => {
  beforeEach(() => {
    delete process.env.AI_DEFAULT_MODEL;
    delete process.env.AI_PROVIDER;
    process.env.ANTHROPIC_API_KEY = "sk-test-not-a-real-key";
  });
  afterEach(() => {
    process.env = { ...saved };
  });

  it("uses the platform default when AI_DEFAULT_MODEL is unset", () => {
    const cfg = getStudioAIProvider();

    expect(cfg.configured).toBe(true);
    expect(cfg.provider).toBe("anthropic");
    expect(cfg.model).toBe(CARA_DEFAULT_MODEL);
  });

  it("does not fall back to a hardcoded model id", () => {
    expect(getStudioAIProvider().model).not.toBe("claude-sonnet-4-20250514");
  });

  it("still honours an explicit AI_DEFAULT_MODEL", () => {
    process.env.AI_DEFAULT_MODEL = "claude-opus-5";
    expect(getStudioAIProvider().model).toBe("claude-opus-5");
  });

  it("reports the platform default when the key is a placeholder", () => {
    // Anthropic asked for explicitly, but the key is not usable: the config is
    // unconfigured and names the model it WOULD have used.
    process.env.AI_PROVIDER = "anthropic";
    process.env.ANTHROPIC_API_KEY = "sk-placeholder";
    const cfg = getStudioAIProvider();

    expect(cfg.configured).toBe(false);
    expect(cfg.model).toBe(CARA_DEFAULT_MODEL);
  });

  it("uses the stub sentinel when no provider is configured at all", () => {
    // Not a model id — "stub" means there is no model, which is honest.
    delete process.env.ANTHROPIC_API_KEY;
    const cfg = getStudioAIProvider();

    expect(cfg.configured).toBe(false);
    expect(cfg.provider).toBe("stub");
    expect(cfg.model).toBe("stub");
  });
});
