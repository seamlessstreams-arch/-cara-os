import { describe, it, expect } from "vitest";
import {
  buildGenerationPrompt,
  CARA_STUDIO_SYSTEM_PROMPT,
  FRAMEWORK_PROMPTS,
  TONE_PROMPTS,
  ARTIFACT_TYPE_PROMPTS,
} from "../prompts";

// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — PROMPTS TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("CARA_STUDIO_SYSTEM_PROMPT", () => {
  it("exists and is non-empty", () => {
    expect(CARA_STUDIO_SYSTEM_PROMPT).toBeDefined();
    expect(CARA_STUDIO_SYSTEM_PROMPT.length).toBeGreaterThan(100);
  });

  it("includes human review requirement", () => {
    const lower = CARA_STUDIO_SYSTEM_PROMPT.toLowerCase();
    expect(lower).toContain("human");
  });
});

describe("FRAMEWORK_PROMPTS", () => {
  it("has entries for all expected frameworks", () => {
    expect(FRAMEWORK_PROMPTS).toHaveProperty("pace");
    expect(FRAMEWORK_PROMPTS).toHaveProperty("ddp");
    expect(FRAMEWORK_PROMPTS).toHaveProperty("trauma_informed");
    expect(FRAMEWORK_PROMPTS).toHaveProperty("therapeutic_parenting");
    expect(FRAMEWORK_PROMPTS).toHaveProperty("strengths_based");
  });

  it("each prompt is non-empty", () => {
    for (const [key, val] of Object.entries(FRAMEWORK_PROMPTS)) {
      expect(val.length, `Framework "${key}" should have content`).toBeGreaterThan(10);
    }
  });
});

describe("TONE_PROMPTS", () => {
  it("has entries for key tones", () => {
    expect(TONE_PROMPTS).toHaveProperty("professional");
    expect(TONE_PROMPTS).toHaveProperty("warm");
    expect(TONE_PROMPTS).toHaveProperty("child_friendly");
    expect(TONE_PROMPTS).toHaveProperty("formal");
    expect(TONE_PROMPTS).toHaveProperty("plain_english");
  });
});

describe("ARTIFACT_TYPE_PROMPTS", () => {
  it("has entries for key artifact types", () => {
    expect(ARTIFACT_TYPE_PROMPTS).toHaveProperty("keywork_session");
    expect(ARTIFACT_TYPE_PROMPTS).toHaveProperty("management_oversight");
    expect(ARTIFACT_TYPE_PROMPTS).toHaveProperty("risk_review");
    expect(ARTIFACT_TYPE_PROMPTS).toHaveProperty("safeguarding_review");
    expect(ARTIFACT_TYPE_PROMPTS).toHaveProperty("reg45_summary");
    expect(ARTIFACT_TYPE_PROMPTS).toHaveProperty("action_plan");
  });

  it("each artifact type prompt has systemFragment and outputStructure", () => {
    for (const [key, val] of Object.entries(ARTIFACT_TYPE_PROMPTS)) {
      expect(val, `Artifact "${key}" should have systemFragment`).toHaveProperty("systemFragment");
      expect(val, `Artifact "${key}" should have outputStructure`).toHaveProperty("outputStructure");
      expect(val.systemFragment.length, `Artifact "${key}" systemFragment should be non-empty`).toBeGreaterThan(10);
      expect(Array.isArray(val.outputStructure), `Artifact "${key}" outputStructure should be an array`).toBe(true);
    }
  });
});

describe("buildGenerationPrompt", () => {
  it("builds a prompt with artifact type", () => {
    const result = buildGenerationPrompt({
      artifactType: "keywork_session",
    });
    expect(result.systemPrompt).toBeDefined();
    expect(result.userPrompt).toBeDefined();
    expect(result.systemPrompt.length).toBeGreaterThan(100);
  });

  it("includes framework when specified", () => {
    const result = buildGenerationPrompt({
      artifactType: "keywork_session",
      framework: "pace",
    });
    expect(result.systemPrompt.toLowerCase()).toContain("pace");
  });

  it("includes tone when specified", () => {
    const result = buildGenerationPrompt({
      artifactType: "management_oversight",
      tone: "formal",
    });
    expect(result.systemPrompt.toLowerCase()).toContain("inspection");
  });

  it("includes source context when provided", () => {
    const result = buildGenerationPrompt({
      artifactType: "risk_review",
      sourceContext: "Daily log: young person had a difficult evening.",
    });
    expect(result.userPrompt).toContain("Daily log");
  });

  it("includes additional context when provided", () => {
    const result = buildGenerationPrompt({
      artifactType: "action_plan",
      additionalContext: "Focus on education attendance",
    });
    expect(result.userPrompt).toContain("education attendance");
  });
});
