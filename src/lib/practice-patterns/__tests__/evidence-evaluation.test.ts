import { describe, it, expect } from "vitest";
import { reviewReg45Evaluation } from "../evidence-evaluation";

describe("reviewReg45Evaluation — activity vs evaluation", () => {
  it("FLAGS an activity-only Reg 45 paragraph (the brief's eval case)", () => {
    const text =
      "A LAC review was completed this month. X engaged well and has settled. No concerns were raised.";
    const r = reviewReg45Evaluation(text, "Progress and experiences");
    expect(r.flagged).toBe(true);
    expect(r.findings.length).toBeGreaterThan(0);
    expect(r.findings[0].issue).toBe("activity_over_impact");
    expect(r.findings[0].evidence.length).toBeGreaterThan(0);
    expect(r.findings[0].registeredPersonAction).toMatch(/registered person/i);
    expect(r.summary).toMatch(/activity rather than evaluation/i);
  });

  it("does NOT flag when activity is paired with evidenced child impact", () => {
    const text =
      "A LAC review was completed. For the first time, X said she feels safe here and chose to join the family meal.";
    const r = reviewReg45Evaluation(text, "Progress and experiences");
    expect(r.flagged).toBe(false);
    expect(r.findings.length).toBe(0);
    expect(r.summary).toMatch(/evidences impact/i);
  });

  it("handles empty text without flagging", () => {
    const r = reviewReg45Evaluation("   ");
    expect(r.flagged).toBe(false);
    expect(r.summary).toMatch(/no text/i);
  });

  it("carries the section name through to findings", () => {
    const r = reviewReg45Evaluation(
      "Review completed. Attended appointment. Settled.",
      "Health",
    );
    if (r.flagged) {
      expect(r.findings.every((f) => f.section === "Health")).toBe(true);
    }
    expect(r.section).toBe("Health");
  });
});
