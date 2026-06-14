// ══════════════════════════════════════════════════════════════════════════════
// Tests — Cara Safeguarding Guardrails
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  scanForSafeguardingFlags,
  _testing,
} from "../cara-safeguarding-guardrails";

const { SAFEGUARDING_THEMES, CONCLUSION_PATTERNS, RISK_LANGUAGE, extractSnippet } = _testing;

// ─── Pattern coverage ───────────────────────────────────────────────────────

describe("pattern definitions", () => {
  it("has safeguarding theme patterns", () => {
    expect(SAFEGUARDING_THEMES.length).toBeGreaterThanOrEqual(10);
  });

  it("has conclusion patterns", () => {
    expect(CONCLUSION_PATTERNS.length).toBeGreaterThanOrEqual(4);
  });

  it("has risk language patterns", () => {
    expect(RISK_LANGUAGE.length).toBeGreaterThanOrEqual(3);
  });

  it("every pattern has required fields", () => {
    const all = [...SAFEGUARDING_THEMES, ...CONCLUSION_PATTERNS, ...RISK_LANGUAGE];
    for (const p of all) {
      expect(p.id).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect(p.pattern).toBeInstanceOf(RegExp);
      expect(["critical", "warning", "info"]).toContain(p.severity);
      expect(p.message.length).toBeGreaterThan(10);
    }
  });
});

// ─── Safeguarding detection ─────────────────────────────────────────────────

describe("scanForSafeguardingFlags — safeguarding themes", () => {
  it("detects physical abuse indicators", () => {
    const result = scanForSafeguardingFlags(
      "The child presented with unexplained bruising on the upper arm.",
    );
    expect(result.flagged).toBe(true);
    expect(result.flags.some((f) => f.id === "sg_physical_abuse")).toBe(true);
    expect(result.mandatoryReview).toBe(true);
  });

  it("detects sexual exploitation references", () => {
    const result = scanForSafeguardingFlags(
      "There are concerns about possible CSE indicators in the child's recent behaviour.",
    );
    expect(result.flagged).toBe(true);
    expect(result.flags.some((f) => f.id === "sg_sexual")).toBe(true);
    expect(result.mandatoryReview).toBe(true);
  });

  it("detects self-harm indicators", () => {
    const result = scanForSafeguardingFlags(
      "The child has been self-harming and staff provided immediate support.",
    );
    expect(result.flagged).toBe(true);
    expect(result.flags.some((f) => f.id === "sg_self_harm")).toBe(true);
    expect(result.mandatoryReview).toBe(true);
  });

  it("detects missing from care", () => {
    const result = scanForSafeguardingFlags(
      "The child went missing from care at 10pm. Police were notified.",
    );
    expect(result.flagged).toBe(true);
    expect(result.flags.some((f) => f.id === "sg_missing")).toBe(true);
  });

  it("detects allegations against staff", () => {
    const result = scanForSafeguardingFlags(
      "An allegation against staff member was made and LADO referral submitted.",
    );
    expect(result.flagged).toBe(true);
    expect(result.flags.some((f) => f.id === "sg_allegation")).toBe(true);
    expect(result.mandatoryReview).toBe(true);
  });

  it("detects contextual safeguarding", () => {
    const result = scanForSafeguardingFlags(
      "There are ongoing concerns about county lines involvement.",
    );
    expect(result.flagged).toBe(true);
    expect(result.flags.some((f) => f.id === "sg_contextual")).toBe(true);
  });

  it("detects restraint references", () => {
    const result = scanForSafeguardingFlags(
      "Physical intervention was required to prevent harm.",
    );
    expect(result.flagged).toBe(true);
    expect(result.flags.some((f) => f.id === "sg_restraint")).toBe(true);
  });

  it("detects bullying", () => {
    const result = scanForSafeguardingFlags(
      "Staff observed peer-on-peer aggression between two children.",
    );
    expect(result.flagged).toBe(true);
    expect(result.flags.some((f) => f.id === "sg_bullying")).toBe(true);
  });
});

// ─── Conclusion detection ───────────────────────────────────────────────────

describe("scanForSafeguardingFlags — conclusion patterns", () => {
  it("detects safety declarations", () => {
    const result = scanForSafeguardingFlags(
      "Based on the evidence, the child is safe in this placement.",
    );
    expect(result.flagged).toBe(true);
    expect(result.flags.some((f) => f.id === "conc_suitability")).toBe(true);
    expect(result.mandatoryReview).toBe(true);
  });

  it("detects referral instructions", () => {
    const result = scanForSafeguardingFlags(
      "This should be referred to police immediately.",
    );
    expect(result.flagged).toBe(true);
    expect(result.flags.some((f) => f.id === "conc_referral_decision")).toBe(true);
  });

  it("detects staff fitness conclusions", () => {
    const result = scanForSafeguardingFlags(
      "The staff member should be suspended pending investigation.",
    );
    expect(result.flagged).toBe(true);
    expect(result.flags.some((f) => f.id === "conc_fitness")).toBe(true);
  });

  it("detects diagnostic conclusions", () => {
    const result = scanForSafeguardingFlags(
      "The child has PTSD as a result of their early life experiences.",
    );
    expect(result.flagged).toBe(true);
    expect(result.flags.some((f) => f.id === "conc_diagnosis")).toBe(true);
  });
});

// ─── Risk language ──────────────────────────────────────────────────────────

describe("scanForSafeguardingFlags — risk language", () => {
  it("detects escalating risk language", () => {
    const result = scanForSafeguardingFlags(
      "There is an escalating pattern of disruptive behaviour.",
    );
    expect(result.flagged).toBe(true);
    expect(result.flags.some((f) => f.category === "risk")).toBe(true);
  });

  it("detects imminent risk language", () => {
    const result = scanForSafeguardingFlags(
      "The child is at risk of significant harm.",
    );
    expect(result.flagged).toBe(true);
    expect(result.flags.some((f) => f.id === "risk_imminent")).toBe(true);
    expect(result.mandatoryReview).toBe(true);
  });

  it("detects pattern language", () => {
    const result = scanForSafeguardingFlags(
      "There is a recurring pattern of incidents after contact visits.",
    );
    expect(result.flagged).toBe(true);
    expect(result.flags.some((f) => f.id === "risk_pattern")).toBe(true);
  });
});

// ─── Clean text ─────────────────────────────────────────────────────────────

describe("scanForSafeguardingFlags — clean text", () => {
  it("returns no flags for clean, routine text", () => {
    const result = scanForSafeguardingFlags(
      "The child had a settled day. They attended school and completed homework with support. Mood was positive throughout.",
    );
    expect(result.flagged).toBe(false);
    expect(result.mandatoryReview).toBe(false);
    expect(result.flags).toEqual([]);
    expect(result.summary).toBe("");
  });

  it("returns no flags for empty text", () => {
    const result = scanForSafeguardingFlags("");
    expect(result.flagged).toBe(false);
  });
});

// ─── Severity and ordering ──────────────────────────────────────────────────

describe("scanForSafeguardingFlags — severity", () => {
  it("sorts flags: critical first, then warning, then info", () => {
    const result = scanForSafeguardingFlags(
      "The child was self-harming and there is a recurring pattern of escalating concern. The child went missing from care.",
    );
    expect(result.flags.length).toBeGreaterThanOrEqual(2);
    const severities = result.flags.map((f) => f.severity);
    const criticalIdx = severities.indexOf("critical");
    const lastCritical = severities.lastIndexOf("critical");
    const firstWarning = severities.indexOf("warning");
    if (criticalIdx !== -1 && firstWarning !== -1) {
      expect(lastCritical).toBeLessThan(firstWarning);
    }
  });

  it("sets mandatory review when command is high-risk and any flag exists", () => {
    const result = scanForSafeguardingFlags(
      "There is a recurring pattern of incidents.",
      "high",
    );
    expect(result.mandatoryReview).toBe(true);
  });

  it("does not force mandatory review for info-level flags on low-risk commands", () => {
    const result = scanForSafeguardingFlags(
      "There is a recurring pattern noted.",
      "low",
    );
    // Info-level flags alone don't force mandatory review on low-risk commands
    const hasCritical = result.flags.some((f) => f.severity === "critical");
    if (!hasCritical) {
      expect(result.mandatoryReview).toBe(false);
    }
  });
});

// ─── Summary ────────────────────────────────────────────────────────────────

describe("scanForSafeguardingFlags — summary", () => {
  it("builds a summary with counts", () => {
    const result = scanForSafeguardingFlags(
      "The child was self-harming. Physical intervention was required.",
    );
    expect(result.summary).toContain("flag");
    expect(result.summary).toContain("detected");
  });

  it("mentions mandatory review when critical flags exist", () => {
    const result = scanForSafeguardingFlags(
      "Unexplained bruising was observed on the child.",
    );
    expect(result.summary).toContain("Mandatory human review");
  });
});

// ─── extractSnippet ─────────────────────────────────────────────────────────

describe("extractSnippet", () => {
  it("extracts context around the match", () => {
    const text = "The child has been self-harming and needs support.";
    const snippet = extractSnippet(text, 19, 12);
    expect(snippet).toContain("self-harming");
  });

  it("adds ellipsis when truncated", () => {
    const longText = "A".repeat(100) + "self-harm" + "B".repeat(100);
    const snippet = extractSnippet(longText, 100, 9);
    expect(snippet.startsWith("…")).toBe(true);
    expect(snippet.endsWith("…")).toBe(true);
  });

  it("does not add ellipsis at start for early matches", () => {
    const snippet = extractSnippet("self-harm found here", 0, 9);
    expect(snippet.startsWith("…")).toBe(false);
  });
});

// ─── Deduplication ──────────────────────────────────────────────────────────

describe("scanForSafeguardingFlags — deduplication", () => {
  it("deduplicates flags by id", () => {
    // This text might match the same pattern twice — scanner should dedup
    const result = scanForSafeguardingFlags(
      "The child was self-harming in the morning. Later that evening, self-harm occurred again.",
    );
    const selfHarmFlags = result.flags.filter((f) => f.id === "sg_self_harm");
    expect(selfHarmFlags.length).toBe(1);
  });
});
