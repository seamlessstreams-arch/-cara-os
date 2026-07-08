import { describe, it, expect } from "vitest";
import { analyseRecord } from "@/lib/cara/managementOversightEngine";

// enableLlm:false → fully deterministic path (no gateway call).

describe("Older oversight engine — full practice-intelligence lens", () => {
  it("scans the record text for contextual-safeguarding signals", async () => {
    const review = await analyseRecord({
      recordId: "r1",
      recordType: "missing_from_care",
      recordText:
        "Alex left the home at 21:40 and returned at 23:55. He had been in the town centre with older friends staff did not recognise, and had new trainers and money he could not account for.",
      childPseudonym: "Alex",
      enableLlm: false,
    });
    expect(review.practiceLensFindings.length).toBeGreaterThan(0);
    const all = review.practiceLensFindings.join(" ").toLowerCase();
    expect(all).toContain("guardianship");
    // Missing episode → Contextual Safeguarding framework grounding.
    expect(all).toContain("contextual safeguarding");
    // And the lens lands in the draft the manager reads.
    expect(review.oversightDraft).toContain("Practice intelligence considered.");
  });

  it("uses the child's twin distillation and training when supplied", async () => {
    const review = await analyseRecord({
      recordId: "r2",
      recordType: "incident_report",
      recordText: "Staff told Alex to calm down after his family contact was cancelled.",
      childPseudonym: "Alex",
      enableLlm: false,
      practiceLensContext: {
        childPhrasesThatEscalate: ["Calm down."],
        childWhatHelps: ["A walk in the garden"],
        childTriggers: ["Family contact being cancelled"],
        childStrengths: ["Good at football"],
        staffTraining: [{ staffName: "Sam Field", course: "De-escalation refresher", status: "expired", mandatory: true }],
      },
    });
    const all = review.practiceLensFindings.join(" ");
    expect(all.toLowerCase()).toContain("escalating");
    expect(all).toContain("Sam Field");
    expect(all.toLowerCase()).toContain("strengths");
  });

  it("stays quiet on a settled record (no false alarms, draft untouched)", async () => {
    const review = await analyseRecord({
      recordId: "r3",
      recordType: "daily_log",
      recordText:
        "Jordan had a settled evening. She cooked dinner with staff support, we spoke about her plans for the weekend, and she said she was looking forward to the cinema trip. In line with her care plan, she completed her homework before tea.",
      childPseudonym: "Jordan",
      enableLlm: false,
    });
    const worrying = review.practiceLensFindings.filter(
      (f) => f.toLowerCase().includes("guardianship") || f.toLowerCase().includes("training is"),
    );
    expect(worrying.length).toBe(0);
  });
});
