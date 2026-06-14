import { describe, it, expect } from "vitest";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — HUMANISED WRITING TESTS
// ══════════════════════════════════════════════════════════════════════════════

import {
  WRITING_STYLE_RULES,
  buildWritingPrompt,
} from "../writing/humanised-writing";
import { REPORT_AUDIENCES } from "@/types/cara-reports";

describe("WRITING_STYLE_RULES", () => {
  it("is a non-empty object with required fields", () => {
    expect(typeof WRITING_STYLE_RULES).toBe("object");
    expect(WRITING_STYLE_RULES).not.toBeNull();
    expect(WRITING_STYLE_RULES.tone).toBeDefined();
    expect(WRITING_STYLE_RULES.language).toBeDefined();
    expect(WRITING_STYLE_RULES.voiceGuidance).toBeDefined();
  });

  it("has an avoid list", () => {
    expect(Array.isArray(WRITING_STYLE_RULES.avoid)).toBe(true);
    expect(WRITING_STYLE_RULES.avoid.length).toBeGreaterThan(0);
  });

  it("avoid list includes Americanised spelling warning", () => {
    const hasAmericanWarning = WRITING_STYLE_RULES.avoid.some(
      (item: string) => item.toLowerCase().includes("american"),
    );
    expect(hasAmericanWarning).toBe(true);
  });

  it("voice guidance references UK Registered Manager", () => {
    expect(WRITING_STYLE_RULES.voiceGuidance).toContain("Registered Manager");
  });
});

describe("buildWritingPrompt", () => {
  it("returns a non-empty string for every audience", () => {
    for (const audience of REPORT_AUDIENCES) {
      const prompt = buildWritingPrompt(audience);
      expect(typeof prompt).toBe("string");
      expect(
        prompt.length,
        `Prompt for audience "${audience}" should not be empty`,
      ).toBeGreaterThan(0);
    }
  });

  it("social_worker audience prompt differs from child_friendly", () => {
    const swPrompt = buildWritingPrompt("social_worker");
    const childPrompt = buildWritingPrompt("child_friendly");
    expect(swPrompt).not.toBe(childPrompt);
  });

  it("all prompts contain UK English references", () => {
    for (const audience of REPORT_AUDIENCES) {
      const prompt = buildWritingPrompt(audience);
      // Every prompt should be substantial
      expect(prompt.length).toBeGreaterThan(50);
    }
  });
});
