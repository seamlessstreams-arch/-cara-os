import { describe, it, expect } from "vitest";
import { runCaraGuardrails, computeManagerReview } from "../cara-guardrails";

describe("runCaraGuardrails", () => {
  it("passes clean, relational content", () => {
    const r = runCaraGuardrails({
      openingScript: "I'm not here to have a go at you. I'm trying to understand what was happening for you.",
      staffGuidance: "Connection before correction. Offer choices and breaks.",
    });
    expect(r.passed).toBe(true);
    expect(r.action).toBe("allow");
    expect(r.severity).toBeNull();
  });

  it("flags shaming and blaming language", () => {
    const r = runCaraGuardrails("You should be ashamed of yourself — this is all your fault.");
    expect(r.passed).toBe(false);
    const types = r.flags.map((f) => f.risk_type);
    expect(types).toContain("shaming");
    expect(types).toContain("blaming");
    expect(r.action).toBe("block_pending_review"); // high severity
  });

  it("CRITICAL: secrecy promises are blocked pending review", () => {
    const r = runCaraGuardrails("Let's keep this our little secret, don't tell your manager.");
    expect(r.severity).toBe("critical");
    expect(r.action).toBe("block_pending_review");
    expect(r.flags.some((f) => f.risk_type === "secrecy")).toBe(true);
  });

  it("CRITICAL: restraint suggestions are blocked", () => {
    const r = runCaraGuardrails({ staffNotes: "If he refuses, restrain him until he complies." });
    expect(r.severity).toBe("critical");
    expect(r.flags[0].risk_type).toBe("restraint_without_oversight");
  });

  it("CRITICAL: safeguarding minimisation is blocked", () => {
    const r = runCaraGuardrails("It's probably nothing, no need to report it to the LADO.");
    expect(r.severity).toBe("critical");
    expect(r.flags.some((f) => f.risk_type === "safeguarding_minimisation")).toBe(true);
  });

  it("flags diagnosis claims and punitive framing as high", () => {
    const diag = runCaraGuardrails("The child has ADHD so this won't work.");
    expect(diag.flags.some((f) => f.risk_type === "diagnosis_claim")).toBe(true);
    const punitive = runCaraGuardrails("As punishment, you will lose privileges this week.");
    expect(punitive.flags.some((f) => f.risk_type === "punitive")).toBe(true);
    expect(punitive.action).toBe("block_pending_review");
  });

  it("medium-only flags go to flag_for_review (still visible)", () => {
    const r = runCaraGuardrails("Staff should sanction the behaviour consistently.");
    expect(r.severity).toBe("medium");
    expect(r.action).toBe("flag_for_review");
  });

  it("scans nested structured output, not just strings", () => {
    const r = runCaraGuardrails({ blocks: [{ heading: "x", body: "You only have yourself to blame." }] });
    expect(r.passed).toBe(false);
  });
});

describe("computeManagerReview (§23 policy)", () => {
  const base = {
    topicOrTheme: "Daily routines",
    guardrailSeverity: null,
    outputText: "Gentle routine-building session.",
  } as const;

  it("low-risk, calm content needs no review", () => {
    const d = computeManagerReview({ ...base, emotionalIntensity: "low", staffConfidence: "high" });
    expect(d.required).toBe(false);
    expect(d.reasons).toHaveLength(0);
  });

  it("high emotional intensity requires review", () => {
    const d = computeManagerReview({ ...base, emotionalIntensity: "high" });
    expect(d.required).toBe(true);
    expect(d.reasons.join(" ")).toMatch(/intensity/i);
  });

  it("high-risk themes always require review", () => {
    for (const theme of ["Understanding exploitation and pressure", "self-harm patterns", "Going missing and staying safe", "abuse disclosure follow-up"]) {
      const d = computeManagerReview({ ...base, topicOrTheme: theme });
      expect(d.required, theme).toBe(true);
    }
  });

  it("low staff confidence on a non-trivial topic requires review", () => {
    const d = computeManagerReview({ ...base, staffConfidence: "low", emotionalIntensity: "medium" });
    expect(d.required).toBe(true);
    expect(d.reasons.join(" ")).toMatch(/confidence/i);
  });

  it("serious-incident conversions, trigger overlap and guardrail severity >= medium require review", () => {
    expect(computeManagerReview({ ...base, fromSeriousIncident: true }).required).toBe(true);
    expect(computeManagerReview({ ...base, childTriggerMatch: true }).required).toBe(true);
    expect(computeManagerReview({ ...base, guardrailSeverity: "medium" }).required).toBe(true);
    expect(computeManagerReview({ ...base, guardrailSeverity: "low" }).required).toBe(false);
  });

  it("safeguarding-sensitive generated text triggers review even with a benign theme", () => {
    const d = computeManagerReview({ ...base, outputText: "If the child mentions exploitation, follow the safeguarding flowchart." });
    expect(d.required).toBe(true);
  });
});
