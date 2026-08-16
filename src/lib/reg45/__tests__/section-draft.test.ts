import { describe, it, expect } from "vitest";
import {
  buildReg45SectionDraft,
  reg45SectionHasEvidence,
  type Reg45DraftInput,
} from "@/lib/reg45/section-draft";

// The four "Request Cara Draft" buttons on /quality/reg-45 were the last of the
// #934 baseline, held back on exhausted AI credits. They never needed AI: Reg 45
// asks the registered person to review quality of care against the home's own
// records, which is assembly, not authorship.
//
// The line these tests hold is where the assembly STOPS. Reg 45(4) wants the
// registered person's opinion on quality of care and on whether children are
// safeguarded. An opinion Cara wrote is not their opinion — so the draft must
// never contain one, however tempting the counts make it.

const input: Reg45DraftInput = {
  homeName: "Oak House",
  periodStart: "2026-05-01",
  periodEnd: "2026-07-31",
  evidence: [
    { category: "Daily Logs", count: 547, examples: ["Positive interactions", "Bedtime routines"] },
    { category: "Key-Work Sessions", count: 36, examples: ["Child voice recorded"] },
    { category: "Incident Records", count: 8, examples: ["Debrief completed"] },
    { category: "Voice of the Child", count: 18, examples: [] },
    { category: "Supervision Records", count: 0, examples: [] },
  ],
};

describe("buildReg45SectionDraft — it assembles evidence", () => {
  it("names the home and the period", () => {
    const { text } = buildReg45SectionDraft("qualityOfCareSummary", input);
    expect(text).toContain("Oak House");
    expect(text).toContain("2026-05-01 to 2026-07-31");
  });

  it("counts only the categories that bear on the section", () => {
    const { text } = buildReg45SectionDraft("safeguardingSummary", input);
    expect(text).toContain("8 Incident Records");
    // Daily logs are not safeguarding evidence and must not be counted as it.
    expect(text).not.toContain("547");
  });

  it("quotes the recorded examples rather than inventing any", () => {
    const { text } = buildReg45SectionDraft("qualityOfCareSummary", input);
    expect(text).toContain("Positive interactions; Bedtime routines");
  });

  it("names the gaps alongside the evidence when there is some of each", () => {
    // safeguardingSummary looks for Incident Records (8, present), Reg 44
    // Reports and Complaints & Compliments (both absent) — the partial branch.
    const { text, missing } = buildReg45SectionDraft("safeguardingSummary", input);
    expect(missing).toEqual(["Reg 44 Reports", "Complaints & Compliments"]);
    expect(text).toContain("Nothing recorded under");
    expect(text).toContain("That gap belongs in the review");
  });

  it("counts a category recorded as zero as a gap, not a source", () => {
    // Supervision Records is PRESENT in the evidence list with count 0.
    const { missing, hasEvidence } = buildReg45SectionDraft("leadershipSummary", input);
    expect(missing).toContain("Supervision Records");
    expect(hasEvidence).toBe(false);
  });

  it("treats a zero count as absent, not as evidence", () => {
    expect(reg45SectionHasEvidence("staffViews", input.evidence)).toBe(false);
    expect(reg45SectionHasEvidence("safeguardingSummary", input.evidence)).toBe(true);
  });
});

describe("buildReg45SectionDraft — it refuses to write the judgement", () => {
  // Ofsted judgement language, matched with WORD BOUNDARIES. A bare substring
  // list is the trap: "good" is inside the prompt "What is not good enough
  // yet?" (a question, not a verdict) and "adequate" is inside "inadequate".
  // Matching on fragments would have failed a correct engine and, worse, would
  // have passed a wrong one that said "inadequate" while the list looked for
  // "adequate" somewhere else entirely.
  const verdicts = [
    /\boutstanding\b/,
    /\binadequate\b/,
    /\brequires improvement\b/,
    /\bchildren are (safe|safeguarded|well cared for)\b/,
    /\bcare is (good|effective|high quality)\b/,
    /\bleadership is\b/,
    /\bthe home is\b/,
  ];

  it("states no verdict in any section", () => {
    const sections = [
      "qualityOfCareSummary", "childrenExperiencesSummary", "outcomesSummary",
      "safeguardingSummary", "leadershipSummary", "strengths", "weaknesses",
      "improvementActions", "childrenViews", "parentsViews",
      "placingAuthorityViews", "staffViews",
    ] as const;
    for (const s of sections) {
      const text = buildReg45SectionDraft(s, input).text.toLowerCase();
      for (const v of verdicts) expect(v.test(text), `${s} matched ${v}`).toBe(false);
    }
  });

  it("says whose opinion the review is", () => {
    const { text } = buildReg45SectionDraft("safeguardingSummary", input);
    expect(text).toContain("registered person");
    expect(text).toContain("an opinion Cara wrote would not be it");
  });

  it("asks the safeguarding question rather than answering it", () => {
    const { text } = buildReg45SectionDraft("safeguardingSummary", input);
    expect(text).toContain("Were children protected from harm this period");
  });
});

describe("buildReg45SectionDraft — an empty record", () => {
  const empty: Reg45DraftInput = { ...input, evidence: [] };

  it("does not pretend there is an evidence base", () => {
    const { text, hasEvidence } = buildReg45SectionDraft("outcomesSummary", empty);
    expect(hasEvidence).toBe(false);
    expect(text).toContain("No records were found for this section");
  });

  it("says what it looked for, so the gap is actionable", () => {
    const { text } = buildReg45SectionDraft("outcomesSummary", empty);
    expect(text).toContain("Education Records");
    expect(text).toContain("Health Assessments");
  });

  it("names the distinction that matters", () => {
    const { text } = buildReg45SectionDraft("outcomesSummary", empty);
    expect(text).toContain("it does not mean nothing happened, it means nothing was recorded");
  });
});

describe("buildReg45SectionDraft — determinism", () => {
  it("produces identical text for identical input", () => {
    expect(buildReg45SectionDraft("strengths", input).text)
      .toEqual(buildReg45SectionDraft("strengths", input).text);
  });

  it("changes when the records change", () => {
    const more = { ...input, evidence: [...input.evidence, { category: "Complaints & Compliments", count: 5, examples: ["4 compliments"] }] };
    expect(buildReg45SectionDraft("strengths", more).text)
      .not.toEqual(buildReg45SectionDraft("strengths", input).text);
  });

  it("matches categories exactly, not by substring", () => {
    const decoy: Reg45DraftInput = {
      ...input,
      evidence: [{ category: "Archived Incident Records (historic)", count: 99, examples: [] }],
    };
    expect(buildReg45SectionDraft("safeguardingSummary", decoy).hasEvidence).toBe(false);
  });
});
