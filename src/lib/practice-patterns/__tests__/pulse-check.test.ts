import { describe, it, expect } from "vitest";
import { runPulseCheck, type AuditCriterion, type AuditedFile } from "../pulse-check";

const CRITERIA: AuditCriterion[] = [
  { id: "consent", label: "Consent recorded" },
  { id: "risk", label: "Risk assessed" },
  { id: "plan", label: "Plan in place" },
];

function file(id: string, results: Record<string, "met" | "missing" | "concern">): AuditedFile {
  return { id, label: id, results };
}

describe("runPulseCheck — RAG rules", () => {
  it("rates a fully-evidenced file green", () => {
    const r = runPulseCheck({
      topic: "safeguarding",
      criteria: CRITERIA,
      sample: [file("f1", { consent: "met", risk: "met", plan: "met" })],
    });
    expect(r.files[0].rag).toBe("green");
    expect(r.overall).toBe("green");
  });

  it("defaults MISSING evidence to amber (including an absent criterion)", () => {
    const r = runPulseCheck({
      topic: "safeguarding",
      criteria: CRITERIA,
      sample: [file("f1", { consent: "met", risk: "met" })], // plan absent => missing
    });
    expect(r.files[0].rag).toBe("amber");
    expect(r.files[0].missing).toContain("plan");
    expect(r.overall).toBe("amber");
  });

  it("rates a concern red", () => {
    const r = runPulseCheck({
      topic: "safeguarding",
      criteria: CRITERIA,
      sample: [file("f1", { consent: "concern", risk: "met", plan: "met" })],
    });
    expect(r.files[0].rag).toBe("red");
  });

  it("ANY RED CAPS THE TOTAL — not averaged away by greens", () => {
    const r = runPulseCheck({
      topic: "safeguarding",
      criteria: CRITERIA,
      sample: [
        file("f1", { consent: "met", risk: "met", plan: "met" }),
        file("f2", { consent: "met", risk: "met", plan: "met" }),
        file("f3", { consent: "concern", risk: "met", plan: "met" }), // one red
      ],
    });
    expect(r.overall).toBe("red"); // averaging would have said green/amber
  });
});

describe("runPulseCheck — admissions declined-referral rule", () => {
  it("floors an all-green admissions audit at AMBER when declined referrals were not reviewed (eval case)", () => {
    const r = runPulseCheck({
      topic: "admissions",
      criteria: CRITERIA,
      sample: [file("accepted1", { consent: "met", risk: "met", plan: "met" })],
      declinedReferralsReviewed: false,
    });
    expect(r.overall).toBe("amber");
    expect(r.findings.some((f) => /declined referrals/i.test(f.message))).toBe(true);
  });

  it("stays green when declined referrals WERE reviewed and all files pass", () => {
    const r = runPulseCheck({
      topic: "admissions",
      criteria: CRITERIA,
      sample: [file("accepted1", { consent: "met", risk: "met", plan: "met" })],
      declinedReferralsReviewed: true,
    });
    expect(r.overall).toBe("green");
  });

  it("a red still dominates the declined-referral amber floor", () => {
    const r = runPulseCheck({
      topic: "admissions",
      criteria: CRITERIA,
      sample: [file("f1", { consent: "concern", risk: "met", plan: "met" })],
      declinedReferralsReviewed: false,
    });
    expect(r.overall).toBe("red");
  });
});
