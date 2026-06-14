import { describe, it, expect } from "vitest";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — GUARDRAILS UNIT TESTS
//
// Tests for detectUnsafeOutput (banned-phrase scanning) and hashPrompt
// (deterministic prompt hashing).
// ══════════════════════════════════════════════════════════════════════════════

import { detectUnsafeOutput, hashPrompt } from "../guardrails";

// ─── detectUnsafeOutput ─────────────────────────────────────────────────────

describe("detectUnsafeOutput", () => {
  // --- Individual banned phrases ---

  it("flags 'definitely abused'", () => {
    const flags = detectUnsafeOutput("The child was definitely abused by a carer.");
    expect(flags).toHaveLength(1);
    expect(flags[0]).toContain("definitely abused");
  });

  it("flags 'clearly lying'", () => {
    const flags = detectUnsafeOutput("The young person is clearly lying about the incident.");
    expect(flags).toHaveLength(1);
    expect(flags[0]).toContain("clearly lying");
  });

  it("flags 'attention seeking'", () => {
    const flags = detectUnsafeOutput("This behaviour is attention seeking.");
    expect(flags).toHaveLength(1);
    expect(flags[0]).toContain("attention seeking");
  });

  it("flags 'manipulative'", () => {
    const flags = detectUnsafeOutput("The child is being manipulative with staff.");
    expect(flags).toHaveLength(1);
    expect(flags[0]).toContain("manipulative");
  });

  it("flags 'naughty'", () => {
    const flags = detectUnsafeOutput("He has been very naughty today.");
    expect(flags).toHaveLength(1);
    expect(flags[0]).toContain("naughty");
  });

  it("flags 'bad behaviour'", () => {
    const flags = detectUnsafeOutput("We need to address this bad behaviour.");
    expect(flags).toHaveLength(1);
    expect(flags[0]).toContain("bad behaviour");
  });

  it("flags 'guaranteed'", () => {
    const flags = detectUnsafeOutput("This approach is guaranteed to work.");
    expect(flags).toHaveLength(1);
    expect(flags[0]).toContain("guaranteed");
  });

  it("flags 'diagnose'", () => {
    const flags = detectUnsafeOutput("We can diagnose the child with ADHD.");
    expect(flags).toHaveLength(1);
    expect(flags[0]).toContain("diagnose");
  });

  // --- Case insensitivity ---

  it("is case-insensitive for 'DEFINITELY ABUSED'", () => {
    const flags = detectUnsafeOutput("The child was DEFINITELY ABUSED.");
    expect(flags.length).toBeGreaterThanOrEqual(1);
    expect(flags[0]).toContain("definitely abused");
  });

  it("is case-insensitive for 'Attention Seeking'", () => {
    const flags = detectUnsafeOutput("This is Attention Seeking behaviour.");
    expect(flags.length).toBeGreaterThanOrEqual(1);
    expect(flags[0]).toContain("attention seeking");
  });

  it("is case-insensitive for 'MANIPULATIVE'", () => {
    const flags = detectUnsafeOutput("Child is MANIPULATIVE.");
    expect(flags.length).toBeGreaterThanOrEqual(1);
    expect(flags[0]).toContain("manipulative");
  });

  it("is case-insensitive for 'Guaranteed'", () => {
    const flags = detectUnsafeOutput("Guaranteed outcome.");
    expect(flags.length).toBeGreaterThanOrEqual(1);
    expect(flags[0]).toContain("guaranteed");
  });

  it("is case-insensitive for mixed case 'bAd BeHaViOuR'", () => {
    const flags = detectUnsafeOutput("There was bAd BeHaViOuR today.");
    expect(flags.length).toBeGreaterThanOrEqual(1);
    expect(flags[0]).toContain("bad behaviour");
  });

  // --- Clean text ---

  it("returns no flags for clean professional text", () => {
    const flags = detectUnsafeOutput(
      "The child appeared settled this evening. Staff observed positive interactions during tea time.",
    );
    expect(flags).toHaveLength(0);
  });

  it("returns no flags for an empty string", () => {
    const flags = detectUnsafeOutput("");
    expect(flags).toHaveLength(0);
  });

  it("returns no flags for text with similar but non-banned wording", () => {
    const flags = detectUnsafeOutput(
      "The child may be seeking attention through their behaviour. This could indicate unmet needs.",
    );
    expect(flags).toHaveLength(0);
  });

  // --- Multiple flags ---

  it("returns multiple flags when several banned phrases appear", () => {
    const flags = detectUnsafeOutput(
      "The child is manipulative and clearly lying about the incident.",
    );
    expect(flags).toHaveLength(2);
    expect(flags.some((f) => f.includes("manipulative"))).toBe(true);
    expect(flags.some((f) => f.includes("clearly lying"))).toBe(true);
  });

  it("returns three flags for text with three banned phrases", () => {
    const flags = detectUnsafeOutput(
      "He is naughty, attention seeking and his bad behaviour is getting worse.",
    );
    expect(flags).toHaveLength(3);
    expect(flags.some((f) => f.includes("naughty"))).toBe(true);
    expect(flags.some((f) => f.includes("attention seeking"))).toBe(true);
    expect(flags.some((f) => f.includes("bad behaviour"))).toBe(true);
  });

  it("returns flags for every banned phrase present in text", () => {
    const text =
      "definitely abused, clearly lying, attention seeking, manipulative, naughty, bad behaviour, guaranteed, diagnose";
    const flags = detectUnsafeOutput(text);
    expect(flags).toHaveLength(8);
  });

  // --- Safeguarding reassurance ---

  it("flags 'no safeguarding concern' when evidence clause is absent", () => {
    const flags = detectUnsafeOutput("There is no safeguarding concern at this time.");
    expect(flags).toHaveLength(1);
    expect(flags[0]).toContain("Safeguarding reassurance may be unsupported");
  });

  it("does not flag 'no safeguarding concern' when 'based on the evidence' is present", () => {
    const flags = detectUnsafeOutput(
      "Based on the evidence, there is no safeguarding concern at this time.",
    );
    expect(flags).toHaveLength(0);
  });

  it("flags safeguarding reassurance case-insensitively", () => {
    const flags = detectUnsafeOutput("There is No Safeguarding Concern here.");
    expect(flags).toHaveLength(1);
    expect(flags[0]).toContain("Safeguarding reassurance may be unsupported");
  });

  it("does not flag when evidence clause is present in different case", () => {
    const flags = detectUnsafeOutput(
      "Based On The Evidence, there is no safeguarding concern.",
    );
    expect(flags).toHaveLength(0);
  });

  it("flags safeguarding reassurance alongside banned phrases", () => {
    const flags = detectUnsafeOutput(
      "No safeguarding concern. The child is manipulative.",
    );
    expect(flags).toHaveLength(2);
    expect(flags.some((f) => f.includes("manipulative"))).toBe(true);
    expect(flags.some((f) => f.includes("Safeguarding reassurance"))).toBe(true);
  });

  // --- Flag message format ---

  it("includes the phrase in the flag message", () => {
    const flags = detectUnsafeOutput("This is guaranteed.");
    expect(flags[0]).toBe("Potentially unsafe or poor-practice wording: guaranteed");
  });

  it("uses the correct prefix for banned-phrase flags", () => {
    const flags = detectUnsafeOutput("Child is naughty.");
    expect(flags[0]).toMatch(/^Potentially unsafe or poor-practice wording:/);
  });
});

// ─── hashPrompt ─────────────────────────────────────────────────────────────

describe("hashPrompt", () => {
  it("returns a string starting with 'prompt_'", () => {
    const hash = hashPrompt("test input");
    expect(hash.startsWith("prompt_")).toBe(true);
  });

  it("returns consistent results for the same input", () => {
    const a = hashPrompt("Hello world");
    const b = hashPrompt("Hello world");
    expect(a).toBe(b);
  });

  it("returns different hashes for different inputs", () => {
    const a = hashPrompt("Input A");
    const b = hashPrompt("Input B");
    expect(a).not.toBe(b);
  });

  it("always starts with 'prompt_' regardless of input", () => {
    expect(hashPrompt("")).toMatch(/^prompt_/);
    expect(hashPrompt("short")).toMatch(/^prompt_/);
    expect(hashPrompt("a".repeat(1000))).toMatch(/^prompt_/);
  });

  it("handles empty string input", () => {
    const hash = hashPrompt("");
    expect(hash).toBe("prompt_0");
  });

  it("returns different hashes for inputs that differ by one character", () => {
    const a = hashPrompt("abc");
    const b = hashPrompt("abd");
    expect(a).not.toBe(b);
  });

  it("produces a hash with only digits after the prefix", () => {
    const hash = hashPrompt("some prompt text");
    const numericPart = hash.replace("prompt_", "");
    expect(numericPart).toMatch(/^\d+$/);
  });

  it("is deterministic across multiple calls", () => {
    const input = "Summarise the last 7 days of logs for Child X.";
    const results = Array.from({ length: 5 }, () => hashPrompt(input));
    expect(new Set(results).size).toBe(1);
  });
});
