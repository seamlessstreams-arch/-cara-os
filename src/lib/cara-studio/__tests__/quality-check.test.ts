import { describe, it, expect } from "vitest";
import { runQualityCheck } from "../quality-check.service";

// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — QUALITY CHECK SERVICE TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe("runQualityCheck", () => {
  it("returns a quality check result with all check fields", async () => {
    const result = await runQualityCheck("test-artifact-1", "This is a test artifact content.");
    expect(result).toBeDefined();
    expect(result).toHaveProperty("evidence_cited");
    expect(result).toHaveProperty("child_voice_considered");
    expect(result).toHaveProperty("risk_considered");
    expect(result).toHaveProperty("safeguarding_considered");
    expect(result).toHaveProperty("regulation_considered");
    expect(result).toHaveProperty("actions_clear");
    expect(result).toHaveProperty("no_ai_style_filler");
    expect(result).toHaveProperty("dignity_language_passed");
    expect(result).toHaveProperty("overall_passed");
    expect(result).toHaveProperty("issues");
    expect(Array.isArray(result.issues)).toBe(true);
  });

  it("detects AI filler phrases", async () => {
    // Use exact phrases from the AI_FILLER_PHRASES list
    const content = "It is important to note that the young person has been making good progress. We need to delve into the details and leverage the opportunity.";
    const result = await runQualityCheck("test-artifact-2", content);
    expect(result.no_ai_style_filler).toBe(false);
    expect(result.issues.some((i: string) => i.toLowerCase().includes("filler") || i.toLowerCase().includes("rephrase"))).toBe(true);
  });

  it("detects dignity language violations", async () => {
    // Use exact patterns from the DIGNITY_VIOLATIONS list
    const content = "The child is very manipulative and displays attention-seeking behaviour. They had challenging behaviour all day.";
    const result = await runQualityCheck("test-artifact-3", content);
    expect(result.dignity_language_passed).toBe(false);
    expect(result.issues.some((i: string) => i.toLowerCase().includes("replacing") || i.toLowerCase().includes("consider"))).toBe(true);
  });

  it("passes when content includes evidence, child voice, and actions", async () => {
    const content = `
      Based on the daily log from 8 May, the young person said "I felt really good today".
      Risk assessment reviewed — no changes needed. Safeguarding plan remains in place.
      Regulation 14 care planning requirements are met.

      Actions:
      - Key worker to schedule next session by Friday
      - Manager to review risk assessment by 20 May
      - Review date: 1 June 2026
    `;
    const result = await runQualityCheck("test-artifact-4", content);
    expect(result.evidence_cited).toBe(true);
    expect(result.child_voice_considered).toBe(true);
    expect(result.risk_considered).toBe(true);
    expect(result.safeguarding_considered).toBe(true);
    expect(result.regulation_considered).toBe(true);
    expect(result.actions_clear).toBe(true);
  });

  it("flags missing evidence citations", async () => {
    const content = "The young person is doing well overall. Everything seems fine.";
    const result = await runQualityCheck("test-artifact-5", content);
    expect(result.evidence_cited).toBe(false);
  });

  it("flags missing child voice", async () => {
    const content = "Based on the daily log from 5 May, the team observed positive behaviour. Risk assessment is current.";
    const result = await runQualityCheck("test-artifact-6", content);
    expect(result.child_voice_considered).toBe(false);
  });
});
