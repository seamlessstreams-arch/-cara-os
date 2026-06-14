import { describe, it, expect } from "vitest";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — CHILD VOICE DETECTION UNIT TESTS
//
// Tests for detectChildVoice which scans free-text for direct child quotes
// and warns when the child's voice is missing.
// ══════════════════════════════════════════════════════════════════════════════

import { detectChildVoice } from "../child-voice";

describe("detectChildVoice", () => {
  // --- Standard double-quoted text ---

  it("detects a single double-quoted string", () => {
    const result = detectChildVoice('The child said "I want to go home" to staff.');
    expect(result.hasDirectQuote).toBe(true);
    expect(result.possibleQuotes).toHaveLength(1);
    expect(result.possibleQuotes[0]).toBe("I want to go home");
  });

  it("detects multiple double-quoted strings", () => {
    const result = detectChildVoice(
      'She said "I feel scared" and later "I want my mum".',
    );
    expect(result.hasDirectQuote).toBe(true);
    expect(result.possibleQuotes).toHaveLength(2);
    expect(result.possibleQuotes).toContain("I feel scared");
    expect(result.possibleQuotes).toContain("I want my mum");
  });

  it("extracts the correct text from quotes", () => {
    const result = detectChildVoice('He told staff "Nobody listens to me".');
    expect(result.possibleQuotes[0]).toBe("Nobody listens to me");
  });

  // --- Quotes only match standard double-quote character ---

  it("does not detect curly/smart quotes (regex only matches straight double quotes)", () => {
    const curlyText = "The child said “I miss my family” to the key worker.";
    const result = detectChildVoice(curlyText);
    expect(result.hasDirectQuote).toBe(false);
    expect(result.possibleQuotes).toHaveLength(0);
    expect(result.warning).toBeDefined();
  });

  it("detects straight-quoted text alongside unmatched curly quotes", () => {
    const mixed = "She whispered “I’m okay” and then said \"But I'm tired\" to staff.";
    const result = detectChildVoice(mixed);
    expect(result.hasDirectQuote).toBe(true);
    expect(result.possibleQuotes).toHaveLength(1);
    expect(result.possibleQuotes[0]).toBe("But I'm tired");
  });

  it("matches only standard double quotes, not unicode left/right quotes", () => {
    const result = detectChildVoice("“Please don’t send me back”");
    expect(result.hasDirectQuote).toBe(false);
  });

  // --- Warning when no quotes found ---

  it("returns a warning when no quotes are found", () => {
    const result = detectChildVoice("The child appeared settled during the evening.");
    expect(result.hasDirectQuote).toBe(false);
    expect(result.possibleQuotes).toHaveLength(0);
    expect(result.warning).toBeDefined();
    expect(result.warning).toContain("No direct child voice detected");
  });

  it("warning includes guidance about wishes and feelings", () => {
    const result = detectChildVoice("Staff completed the bedtime routine.");
    expect(result.warning).toContain("wishes and feelings");
  });

  it("returns warning for text with no quotation marks at all", () => {
    const result = detectChildVoice("Child was calm and engaged in activities throughout the day.");
    expect(result.warning).toBeDefined();
    expect(result.hasDirectQuote).toBe(false);
  });

  // --- No warning when quotes are present ---

  it("returns no warning when a direct quote is found", () => {
    const result = detectChildVoice('Child said "I had a good day".');
    expect(result.warning).toBeUndefined();
  });

  it("returns warning when only curly quotes are used (not matched by regex)", () => {
    const result = detectChildVoice("Child said “I had a good day”.");
    expect(result.warning).toBeDefined();
    expect(result.hasDirectQuote).toBe(false);
  });

  // --- Very short quotes (< 3 chars) should be ignored ---

  it("ignores quotes with fewer than 3 characters", () => {
    const result = detectChildVoice('She said "no" quietly.');
    expect(result.hasDirectQuote).toBe(false);
    expect(result.possibleQuotes).toHaveLength(0);
  });

  it("ignores single-character quoted text", () => {
    const result = detectChildVoice('The answer was "x" apparently.');
    expect(result.hasDirectQuote).toBe(false);
    expect(result.possibleQuotes).toHaveLength(0);
  });

  it("detects a quote of exactly 3 characters", () => {
    const result = detectChildVoice('She said "yes" to the plan.');
    expect(result.hasDirectQuote).toBe(true);
    expect(result.possibleQuotes).toHaveLength(1);
    expect(result.possibleQuotes[0]).toBe("yes");
  });

  // --- Empty and edge-case inputs ---

  it("returns no quotes and a warning for empty string", () => {
    const result = detectChildVoice("");
    expect(result.hasDirectQuote).toBe(false);
    expect(result.possibleQuotes).toHaveLength(0);
    expect(result.warning).toBeDefined();
  });

  it("handles text that is only whitespace", () => {
    const result = detectChildVoice("   \n\t  ");
    expect(result.hasDirectQuote).toBe(false);
    expect(result.warning).toBeDefined();
  });

  it("handles text with unmatched opening quote", () => {
    const result = detectChildVoice('The child said "I want to go home but did not finish.');
    expect(result.hasDirectQuote).toBe(false);
    expect(result.warning).toBeDefined();
  });

  // --- Long text with embedded quotes ---

  it("extracts quotes from a long passage", () => {
    const text = `
      During the evening, the child was observed in the communal area.
      Staff approached and asked how they were feeling. The child responded
      "I don't want to be here anymore" and became tearful. Staff offered
      reassurance and the child later said "I just miss home" before settling
      for the night.
    `;
    const result = detectChildVoice(text);
    expect(result.hasDirectQuote).toBe(true);
    expect(result.possibleQuotes).toHaveLength(2);
    expect(result.possibleQuotes).toContain("I don't want to be here anymore");
    expect(result.possibleQuotes).toContain("I just miss home");
  });

  it("handles a passage with many quotes", () => {
    const text =
      '"First thing" and "second thing" and "third thing" and "fourth quote here".';
    const result = detectChildVoice(text);
    expect(result.possibleQuotes).toHaveLength(4);
  });

  // --- Quote length boundary (240 chars max) ---

  it("detects a quote at exactly 240 characters", () => {
    const longQuote = "a".repeat(240);
    const result = detectChildVoice(`"${longQuote}"`);
    expect(result.hasDirectQuote).toBe(true);
    expect(result.possibleQuotes).toHaveLength(1);
  });

  it("ignores a quote exceeding 240 characters", () => {
    const tooLong = "a".repeat(241);
    const result = detectChildVoice(`"${tooLong}"`);
    expect(result.hasDirectQuote).toBe(false);
    expect(result.possibleQuotes).toHaveLength(0);
  });

  // --- Returned structure ---

  it("returns the correct shape with hasDirectQuote, possibleQuotes, and optional warning", () => {
    const result = detectChildVoice("Some text.");
    expect(result).toHaveProperty("hasDirectQuote");
    expect(result).toHaveProperty("possibleQuotes");
    expect(Array.isArray(result.possibleQuotes)).toBe(true);
  });

  it("trims whitespace from extracted quotes", () => {
    const result = detectChildVoice('"  I feel safe now  "');
    expect(result.possibleQuotes[0]).toBe("I feel safe now");
  });

  // --- Additional coverage ---

  it("detects a quote at the very start of text", () => {
    const result = detectChildVoice('"I am happy" the child said.');
    expect(result.hasDirectQuote).toBe(true);
    expect(result.possibleQuotes[0]).toBe("I am happy");
  });

  it("detects a quote at the very end of text", () => {
    const result = detectChildVoice('The child said "I want pizza"');
    expect(result.hasDirectQuote).toBe(true);
    expect(result.possibleQuotes[0]).toBe("I want pizza");
  });

  it("handles consecutive quotes separated by no space", () => {
    const result = detectChildVoice('"First quote""Second quote"');
    expect(result.possibleQuotes.length).toBeGreaterThanOrEqual(1);
  });

  it("returns possibleQuotes as an array even with a single quote", () => {
    const result = detectChildVoice('"only one quote here"');
    expect(Array.isArray(result.possibleQuotes)).toBe(true);
    expect(result.possibleQuotes).toHaveLength(1);
  });
});
