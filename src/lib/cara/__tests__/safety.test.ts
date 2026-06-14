import { describe, it, expect } from "vitest";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — AI SAFETY & OUTPUT SANITISATION TESTS
// ══════════════════════════════════════════════════════════════════════════════

import {
  sanitiseOutput,
  validateOutputSafety,
  CARA_SAFETY_RULES,
  CARA_SYSTEM_PREAMBLE,
  BANNED_PHRASES,
} from "../ai/safety";

describe("CARA_SAFETY_RULES", () => {
  it("contains exactly 10 safety rules", () => {
    expect(CARA_SAFETY_RULES).toHaveLength(10);
  });

  it("includes the 'must not diagnose' rule", () => {
    const hasDiagnoseRule = CARA_SAFETY_RULES.some((r) =>
      r.toLowerCase().includes("must not diagnose"),
    );
    expect(hasDiagnoseRule).toBe(true);
  });

  it("includes the 'must not invent evidence' rule", () => {
    const hasEvidenceRule = CARA_SAFETY_RULES.some((r) =>
      r.toLowerCase().includes("must not invent evidence"),
    );
    expect(hasEvidenceRule).toBe(true);
  });

  it("includes the 'must not blame children' rule", () => {
    const hasBlameRule = CARA_SAFETY_RULES.some((r) =>
      r.toLowerCase().includes("must not blame"),
    );
    expect(hasBlameRule).toBe(true);
  });
});

describe("CARA_SYSTEM_PREAMBLE", () => {
  it("identifies Cara as an AI assistant", () => {
    expect(CARA_SYSTEM_PREAMBLE).toContain("You are Cara");
  });

  it("states Cara is not a decision-maker", () => {
    expect(CARA_SYSTEM_PREAMBLE).toContain("not a decision-maker");
  });

  it("requires UK English", () => {
    expect(CARA_SYSTEM_PREAMBLE).toContain("UK English");
    expect(CARA_SYSTEM_PREAMBLE).toContain("behaviour");
    expect(CARA_SYSTEM_PREAMBLE).toContain("organisation");
  });

  it("embeds all safety rules", () => {
    for (const rule of CARA_SAFETY_RULES) {
      expect(CARA_SYSTEM_PREAMBLE).toContain(rule);
    }
  });
});

describe("BANNED_PHRASES", () => {
  it("contains 20 banned phrases", () => {
    expect(BANNED_PHRASES).toHaveLength(20);
  });

  it("includes common AI filler phrases", () => {
    expect(BANNED_PHRASES).toContain("It is important to note");
    expect(BANNED_PHRASES).toContain("Furthermore");
    expect(BANNED_PHRASES).toContain("Moving forward");
    expect(BANNED_PHRASES).toContain("In conclusion");
  });
});

describe("sanitiseOutput", () => {
  it("returns empty string for empty input", () => {
    expect(sanitiseOutput("")).toBe("");
  });

  it("strips banned phrases from text", () => {
    const input = "It is important to note Jayden had a positive week.";
    const result = sanitiseOutput(input);
    expect(result).not.toContain("It is important to note");
    expect(result).toContain("Jayden had a positive week");
  });

  it("strips multiple banned phrases", () => {
    const input = "Furthermore, it is worth noting that the child presented well. In conclusion, progress has been made.";
    const result = sanitiseOutput(input);
    expect(result).not.toContain("Furthermore");
    expect(result).not.toContain("it is worth noting that");
    expect(result).not.toContain("In conclusion");
  });

  it("fixes Americanisms to UK English", () => {
    const input = "The child's behavior was analyzed and recognized as a defense mechanism.";
    const result = sanitiseOutput(input);
    expect(result).toContain("behaviour");
    expect(result).toContain("analysed");
    expect(result).toContain("recognised");
    expect(result).toContain("defence");
  });

  it("fixes multiple Americanisms in one pass", () => {
    const input = "The organization specialized in counseling and utilized a pediatric center for assessments.";
    const result = sanitiseOutput(input);
    expect(result).toContain("organisation");
    expect(result).toContain("specialised");
    expect(result).toContain("counselling");
    expect(result).toContain("utilised");
    expect(result).toContain("paediatric");
    expect(result).toContain("centre");
  });

  it("does not modify already-correct UK spelling", () => {
    const input = "The child's behaviour was observed during the therapeutic session.";
    const result = sanitiseOutput(input);
    expect(result).toBe(input);
  });

  it("cleans up double spaces after phrase removal", () => {
    const input = "Furthermore,  the child presented well today.";
    const result = sanitiseOutput(input);
    expect(result).not.toContain("  ");
  });

  it("capitalises first letter after full stop if left lowercase", () => {
    const input = "Jayden arrived. he was happy.";
    const result = sanitiseOutput(input);
    expect(result).toContain(". He was happy");
  });
});

describe("validateOutputSafety", () => {
  it("returns safe for appropriate content", () => {
    const content = "Jayden had a positive week. He engaged well in keywork sessions and expressed a desire to see his mum more frequently.";
    const result = validateOutputSafety(content);
    expect(result.safe).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("detects diagnostic language", () => {
    const content = "The child has been diagnosed with ADHD and presents with conduct disorder.";
    const result = validateOutputSafety(content);
    expect(result.safe).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("diagnostic language");
  });

  it("detects blame language — manipulative", () => {
    const content = "The child is manipulative and refused to engage with staff during the activity.";
    const result = validateOutputSafety(content);
    expect(result.safe).toBe(false);
    expect(result.warnings.some((w) => w.includes("Blame language"))).toBe(true);
  });

  it("detects blame language — attention-seeking", () => {
    const content = "The child is attention-seeking and non-compliant.";
    const result = validateOutputSafety(content);
    expect(result.safe).toBe(false);
    expect(result.warnings.some((w) => w.includes("Blame language"))).toBe(true);
  });

  it("detects unsupported conclusion language", () => {
    const content = "This clearly proves that the placement is failing without doubt.";
    const result = validateOutputSafety(content);
    expect(result.safe).toBe(false);
    expect(result.warnings.some((w) => w.includes("Unsupported conclusion"))).toBe(true);
  });

  it("detects possibly invented evidence with specific dates", () => {
    const content = "For example, on 15 January the child was observed to be distressed.";
    const result = validateOutputSafety(content);
    expect(result.safe).toBe(false);
    expect(result.warnings.some((w) => w.includes("invented evidence"))).toBe(true);
  });

  it("accumulates multiple warnings for multiple violations", () => {
    const content = "The child is manipulative. This clearly proves the child has ADHD.";
    const result = validateOutputSafety(content);
    expect(result.safe).toBe(false);
    expect(result.warnings.length).toBeGreaterThanOrEqual(2);
  });
});
