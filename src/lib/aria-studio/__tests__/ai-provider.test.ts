import { describe, it, expect } from "vitest";
import { getStudioAIProvider, generateStudioContent } from "../ai-provider.service";

// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — AI PROVIDER TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("getStudioAIProvider", () => {
  it("returns a config object with required fields", () => {
    const config = getStudioAIProvider();
    expect(config).toHaveProperty("configured");
    expect(config).toHaveProperty("provider");
    expect(config).toHaveProperty("model");
    expect(config).toHaveProperty("maxSourceTokens");
  });

  it("defaults to stub provider when no API key set", () => {
    const config = getStudioAIProvider();
    // In test environment, no API keys are set
    expect(config.provider).toBe("stub");
    expect(config.configured).toBe(false);
  });

  it("maxSourceTokens is a positive number", () => {
    const config = getStudioAIProvider();
    expect(config.maxSourceTokens).toBeGreaterThan(0);
  });
});

describe("generateStudioContent", () => {
  it("returns stub content in demo mode", async () => {
    const result = await generateStudioContent(
      "You are a children's care assistant.",
      "Generate a keywork session plan.",
    );
    expect(result).toBeDefined();
    expect(result.content).toContain("DEMO MODE");
    expect(result.provider).toBe("stub");
    expect(result.model).toBe("stub");
  });

  it("returns content containing key work elements for keywork prompts", async () => {
    const result = await generateStudioContent(
      "You are ARIA.",
      "Generate a keywork session plan for a young person.",
    );
    const lower = result.content.toLowerCase();
    expect(lower).toContain("key work");
  });

  it("returns content for management oversight prompts", async () => {
    const result = await generateStudioContent(
      "You are ARIA.",
      "Generate a management oversight comment for this week.",
    );
    const lower = result.content.toLowerCase();
    expect(lower).toContain("oversight");
  });

  it("returns default stub for unknown artifact types", async () => {
    const result = await generateStudioContent(
      "You are ARIA.",
      "Generate something unusual and unknown.",
    );
    expect(result.content).toContain("DEMO MODE");
    expect(result.content.toLowerCase()).toContain("draft");
  });
});
