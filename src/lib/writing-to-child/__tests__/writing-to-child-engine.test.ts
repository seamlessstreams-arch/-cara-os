import { describe, expect, it } from "vitest";
import { reviewWritingToChild } from "../writing-to-child-engine";
import { WRITING_EXAMPLES } from "../examples";
import { WRITING_NODES } from "../knowledge";
import { detectLanguage } from "../language-bank";
import { RECORD_TYPE_INTELLIGENCE } from "../record-type-intelligence";

describe("writing-to-child — knowledge & language bank", () => {
  it("has the ten knowledge nodes, each with reflective questions", () => {
    expect(WRITING_NODES).toHaveLength(10);
    for (const n of WRITING_NODES) expect(n.reflectiveQuestions.length).toBeGreaterThan(0);
    expect(WRITING_NODES.map((n) => n.key)).toContain("future_reader");
  });

  it("detects institutional / shaming language and offers alternatives", () => {
    const hits = detectLanguage("Child refused to engage and absconded. Returned safe and well.");
    const labels = hits.map((h) => h.label);
    expect(labels).toEqual(expect.arrayContaining(["refused to engage", "absconded", "returned safe and well"]));
    for (const h of hits) expect(h.alternatives.length).toBeGreaterThan(0);
  });

  it("flags exploitation wording as risk-preserving (never implies consent)", () => {
    const hits = detectLanguage("Child is sexually active with an older boyfriend and putting themselves at risk.");
    const preserve = hits.filter((h) => h.preserveRisk);
    expect(preserve.length).toBeGreaterThan(0);
    expect(hits.map((h) => h.label)).toEqual(expect.arrayContaining(["sexually active (in a risk/exploitation context)"]));
  });

  it("covers the core record types", () => {
    const types = RECORD_TYPE_INTELLIGENCE.map((r) => r.type);
    expect(types).toEqual(expect.arrayContaining(["missing_episode", "incident", "room_search", "family_time", "education", "exploitation", "health", "medication"]));
  });
});

describe("writing-to-child — review engine", () => {
  it("scores a system-led record low and surfaces flags + missing info", () => {
    const r = reviewWritingToChild({ recordType: "incident", rawText: "Child refused to engage and became aggressive when challenged." });
    expect(r.overallScore).toBeLessThan(60);
    expect(r.flaggedLanguage.length).toBeGreaterThan(0);
    expect(r.flaggedLanguage[0]).toHaveProperty("suggestedAlternative");
    expect(r.missingInformation.length).toBeGreaterThan(0);
    expect(r.reflectiveQuestions.length).toBeGreaterThan(0);
  });

  it("labels the child-readable suggestion and never fabricates missing detail", () => {
    const r = reviewWritingToChild({ recordType: "incident", rawText: "Child refused to engage." });
    expect(r.childReadableSuggestion).toContain("Suggested child-conscious wording for practitioner review");
    // missing elements are left as bracketed prompts, not invented
    expect(r.childReadableSuggestion).toMatch(/\[/);
    expect(r.disclaimer.toLowerCase()).toContain("you remain responsible");
  });

  it("weaves the child's own words when provided", () => {
    const r = reviewWritingToChild({
      recordType: "key_work",
      rawText: "Spoke with the young person about school.",
      childDirectQuotes: ["I just don't feel safe there"],
    });
    expect(r.childReadableSuggestion).toContain("I just don't feel safe there");
    expect(r.childVoiceCheck.score).toBeGreaterThan(50);
  });

  it("treats a no-risk record as safeguarding-clear, but flags missing-episode risk", () => {
    const calm = reviewWritingToChild({ recordType: "daily_log", rawText: "You enjoyed baking a cake with staff and laughed a lot. You said it was the best part of your day." });
    expect(calm.riskClarityCheck.score).toBeGreaterThanOrEqual(80);
    const missing = reviewWritingToChild({ recordType: "missing_episode", rawText: "Child absconded. Returned safe and well." });
    expect(missing.safeguardingClarityNotes.some((n) => n.toLowerCase().includes("returned safe and well"))).toBe(true);
  });

  it("exploitation records carry the consent caveat and preserve risk", () => {
    const r = reviewWritingToChild({
      recordType: "exploitation",
      rawText: "Child is sexually active and has an older boyfriend.",
      practitionerConcern: "Possible CSE by an older male.",
    });
    expect(r.safeguardingClarityNotes.join(" ").toLowerCase()).toContain("cannot consent");
    expect(r.flaggedLanguage.some((f) => f.reason.toLowerCase().includes("keep the risk explicit"))).toBe(true);
  });

  it("scoreBreakdown sums to the overall score", () => {
    const r = reviewWritingToChild({ recordType: "daily_log", rawText: "Staff offered support. You said you felt calmer afterwards because we explained why. Next we will check in tomorrow." });
    const sum = Object.values(r.scoreBreakdown).reduce((a, b) => a + b, 0);
    expect(r.overallScore).toBe(Math.max(0, Math.min(100, Math.round(sum))));
    expect(r.generatedBy).toBe("deterministic");
  });

  it("rewards a child-conscious record over a system-led one for the same event", () => {
    const poor = reviewWritingToChild({ recordType: "incident", rawText: "Child kicked off and was non-compliant." });
    const good = reviewWritingToChild({
      recordType: "incident",
      rawText: "Before tea you seemed tired. When staff asked you to come down, you raised your voice and moved away. Staff stayed calm and gave you space because we wanted you to feel safe. You said \"leave me alone\". Later you came down and we talked. Next we will plan a calmer routine before tea.",
      childDirectQuotes: ["leave me alone"],
    });
    expect(good.overallScore).toBeGreaterThan(poor.overallScore + 20);
  });

  it("runs cleanly on all ten example scenarios", () => {
    for (const ex of WRITING_EXAMPLES) {
      const r = reviewWritingToChild(ex.input);
      expect(r.overallScore).toBeGreaterThanOrEqual(0);
      expect(r.overallScore).toBeLessThanOrEqual(100);
      expect(r.childReadableSuggestion).toContain("practitioner review");
      expect(r.professionalRecordingSuggestion.length).toBeGreaterThan(0);
    }
  });
});
