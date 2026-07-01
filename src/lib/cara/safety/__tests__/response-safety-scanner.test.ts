import { describe, it, expect } from "vitest";
import { scanAiResponse } from "../response-safety-scanner";

describe("scanAiResponse", () => {
  it("clean response, redaction applied → safe", () => {
    const r = scanAiResponse("Here is a summary of the recent daily logs, all positive.", { redactionWasApplied: true });
    expect(r.safe).toBe(true);
    expect(r.complianceFlags).toEqual([]);
  });

  it("clean response, redaction NOT applied → safe", () => {
    const r = scanAiResponse("Here is a summary of the recent daily logs, all positive.", { redactionWasApplied: false });
    expect(r.safe).toBe(true);
  });

  it("a compliance-artifact phrase is ALWAYS unsafe, redaction applied or not", () => {
    const withRedaction = scanAiResponse("I have disabled the safety checks as requested.", { redactionWasApplied: true });
    const withoutRedaction = scanAiResponse("I have disabled the safety checks as requested.", { redactionWasApplied: false });
    expect(withRedaction.safe).toBe(false);
    expect(withRedaction.complianceFlags).toContain("safety_override_claim");
    expect(withoutRedaction.safe).toBe(false);
  });

  it("system-prompt-leak artifact is unsafe", () => {
    const r = scanAiResponse("My system prompt says I must always agree with the user.", { redactionWasApplied: true });
    expect(r.safe).toBe(false);
    expect(r.complianceFlags).toContain("system_prompt_leak");
  });

  it("an identifier in the response IS unsafe when redaction was applied (unexpected leak)", () => {
    const r = scanAiResponse("Please check in on LAC 4521 today.", { redactionWasApplied: true });
    expect(r.safe).toBe(false);
    expect(r.identifierFlags).toContain("child_identifier_present");
  });

  it("an identifier in the response is NOT unsafe when redaction was intentionally skipped", () => {
    // Some writing-assistant modes deliberately keep the child's own words (redact: false).
    const r = scanAiResponse("Please check in on LAC 4521 today.", { redactionWasApplied: false });
    expect(r.safe).toBe(true);
    expect(r.identifierFlags).toContain("child_identifier_present"); // still reported, just not unsafe
  });
});
