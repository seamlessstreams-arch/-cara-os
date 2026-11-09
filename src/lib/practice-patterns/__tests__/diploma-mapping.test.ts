import { describe, it, expect } from "vitest";
import { suggestDiplomaEvidence } from "../diploma-mapping";

describe("suggestDiplomaEvidence — suggestion-only", () => {
  it("ALWAYS returns a disclaimer, even with no matches (never a guarantee)", () => {
    const r = suggestDiplomaEvidence("");
    expect(r.suggestions).toHaveLength(0);
    expect(r.disclaimer).toMatch(/suggestion only/i);
    expect(r.disclaimer).toMatch(/not .*achiev|not a guarantee|assessor/i);
  });

  it("suggests relevant areas for a de-escalation + relationships reflection", () => {
    const r = suggestDiplomaEvidence(
      "I reflected in supervision on how I used PACE and co-regulation to de-escalate and then repair the relationship.",
    );
    const ids = r.suggestions.map((s) => s.areaId);
    expect(ids).toContain("relationships");
    expect(ids).toContain("professional_practice");
    expect(r.disclaimer).toMatch(/assessor/i);
  });

  it("suggests safeguarding for a disclosure-handling entry", () => {
    const r = suggestDiplomaEvidence("The child made a disclosure; I followed the safeguarding procedure and informed the LADO.");
    expect(r.suggestions.some((s) => s.areaId === "safeguarding")).toBe(true);
  });

  it("filters L5-only areas out of an L3 request", () => {
    const text = "Leadership of the service and staff development and quality of care.";
    const l5 = suggestDiplomaEvidence(text, "L5").suggestions.map((s) => s.areaId);
    const l3 = suggestDiplomaEvidence(text, "L3").suggestions.map((s) => s.areaId);
    expect(l5).toContain("leadership");
    expect(l3).not.toContain("leadership");
  });
});
