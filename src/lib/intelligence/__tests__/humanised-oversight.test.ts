import { describe, it, expect, vi } from "vitest";
import type { HumanisedOversightInput } from "@/types/intelligence.layer";

vi.mock("@/lib/aria/aria-provider", () => ({
  getAriaProviderConfig: () => ({ configured: false }),
  generateText: vi.fn(),
}));

vi.mock("@/lib/aria/writingStyleRules", () => ({
  applyAriaPostprocessor: (text: string) => text,
}));

describe("generateHumanisedOversight (fallback mode)", () => {
  it("returns structured template when AI not configured", async () => {
    const { generateHumanisedOversight } = await import("../humanised-oversight");

    const input: HumanisedOversightInput = {
      recordType: "incident",
      recordId: "inc-123",
      childName: "Alex",
      recordSummary: "Alex became distressed after a phone call with their parent and left the building.",
      context: {},
    };

    const result = await generateHumanisedOversight(input);

    expect(result.requiresManagerApproval).toBe(true);
    expect(result.confidence).toBe("low");
    expect(result.draftText).toContain("Fact:");
    expect(result.draftText).toContain("Analysis:");
    expect(result.draftText).toContain("Impact on the child:");
    expect(result.draftText).toContain("Management oversight:");
    expect(result.draftText).toContain("Actions required:");
    expect(result.draftText).toContain("Review date:");
  });

  it("includes child name in fallback text", async () => {
    const { generateHumanisedOversight } = await import("../humanised-oversight");

    const input: HumanisedOversightInput = {
      recordType: "missing_from_care",
      recordId: "mfc-1",
      childName: "Jordan",
      recordSummary: "Jordan left the home at 10pm and returned at 2am.",
      context: {},
    };

    const result = await generateHumanisedOversight(input);
    expect(result.draftText).toContain("Jordan");
  });

  it("provides suggested actions in fallback", async () => {
    const { generateHumanisedOversight } = await import("../humanised-oversight");

    const input: HumanisedOversightInput = {
      recordType: "complaint",
      recordId: "comp-1",
      recordSummary: "Young person complained about food quality.",
      context: {},
    };

    const result = await generateHumanisedOversight(input);
    expect(result.suggestedActions.length).toBeGreaterThan(0);
    expect(result.missingInformation.length).toBeGreaterThan(0);
  });

  it("always sets requiresManagerApproval to true", async () => {
    const { generateHumanisedOversight } = await import("../humanised-oversight");

    const input: HumanisedOversightInput = {
      recordType: "daily_log",
      recordId: "dl-1",
      recordSummary: "Routine day, child engaged well with activities.",
      context: {},
    };

    const result = await generateHumanisedOversight(input);
    expect(result.requiresManagerApproval).toBe(true);
  });

  it("truncates long record summaries in fallback", async () => {
    const { generateHumanisedOversight } = await import("../humanised-oversight");

    const longSummary = "A".repeat(500);
    const input: HumanisedOversightInput = {
      recordType: "incident",
      recordId: "inc-2",
      recordSummary: longSummary,
      context: {},
    };

    const result = await generateHumanisedOversight(input);
    expect(result.draftText).toContain("...");
    expect(result.draftText.length).toBeLessThan(longSummary.length + 500);
  });
});
