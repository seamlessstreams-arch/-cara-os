import { describe, it, expect } from "vitest";
import {
  buildProgressSummary,
  progressSummaryText,
  type ProgressSummaryInput,
} from "@/lib/progress/progress-summary";

// What this replaced: three hardcoded paragraphs on /children/progress, shown
// behind "Request Cara Progress Summary" and labelled a Cara draft. Same words
// for every child, every time — "predicted grades rising from 4 to 5",
// "outcome scores improving in 5 of 7 domains" — regardless of what was
// recorded. The two buttons beneath it were dead, which is the only reason
// that text had never reached a real report.
//
// These tests hold the line the replacement has to keep: every claim traceable
// to a record, and silence where there are no records.

const base: ProgressSummaryInput = { childName: "Child A", goals: [], entries: [], outcomes: [] };

describe("buildProgressSummary — nothing recorded", () => {
  it("refuses to summarise an empty record", () => {
    const out = buildProgressSummary(base);
    expect(out.hasContent).toBe(false);
    expect(out.paragraphs.join(" ")).toContain("nothing recorded");
  });

  it("says an empty record is not the same as no progress", () => {
    expect(buildProgressSummary(base).paragraphs.join(" ")).toContain("not the same as no progress");
  });

  it("invents none of the old hardcoded claims", () => {
    const text = progressSummaryText(base).toLowerCase();
    for (const invented of ["predicted grades", "breathing techniques", "grandmother", "football", "trajectory"]) {
      expect(text).not.toContain(invented);
    }
  });
});

describe("buildProgressSummary — goals", () => {
  const withGoals: ProgressSummaryInput = {
    ...base,
    goals: [
      { title: "Attend school daily", status: "achieved", progress: 100, area: "education" },
      { title: "Reduce restraints", status: "at_risk", progress: 20, area: "safety" },
      { title: "Cook two meals", status: "not_started", progress: 0, area: "independence" },
    ],
  };

  it("counts each status and names the goals at risk", () => {
    const text = progressSummaryText(withGoals);
    expect(text).toContain("3 goals recorded");
    expect(text).toContain("achieved (Attend school daily)");
    expect(text).toContain("at risk — Reduce restraints");
    expect(text).toContain("1 has not been started");
  });

  it("says so plainly when there are no goals", () => {
    expect(progressSummaryText({ ...base, outcomes: [{ domain: "Education", score: 5, previousScore: 4, trend: "up" }] }))
      .toContain("No goals are recorded");
  });
});

describe("buildProgressSummary — outcome scores", () => {
  const withOutcomes: ProgressSummaryInput = {
    ...base,
    outcomes: [
      { domain: "Education", score: 5, previousScore: 4, trend: "up" },
      { domain: "Emotional wellbeing", score: 2, previousScore: 4, trend: "down" },
      { domain: "Health", score: 3, previousScore: 3, trend: "stable" },
    ],
  };

  it("reports movement in both directions with the actual numbers", () => {
    const text = progressSummaryText(withOutcomes);
    expect(text).toContain("Education 4→5");
    expect(text).toContain("Emotional wellbeing 4→2");
    expect(text).toContain("1 is unchanged");
  });

  it("does NOT pronounce an overall verdict — that is the manager's judgement", () => {
    const text = progressSummaryText(withOutcomes).toLowerCase();
    for (const verdict of ["positive", "good progress", "improving overall", "on the whole"]) {
      expect(text).not.toContain(verdict);
    }
  });

  it("a domain that fell is never described as progress", () => {
    const falling: ProgressSummaryInput = {
      ...base,
      outcomes: [{ domain: "Safety", score: 1, previousScore: 5, trend: "down" }],
    };
    const text = progressSummaryText(falling);
    expect(text).toContain("1 fell (Safety 5→1)");
    expect(text).not.toContain("improved");
  });
});

describe("buildProgressSummary — entries", () => {
  it("quotes the most recent entry and names the areas covered", () => {
    const text = progressSummaryText({
      ...base,
      entries: [
        { date: "2026-08-01", area: "education", description: "Attended all sessions", impactNote: "Settled" },
        { date: "2026-08-10", area: "relationships", description: "Called nan twice", impactNote: "" },
      ],
    });
    expect(text).toContain("2026-08-10");
    // Punctuated so the next sentence does not run into it.
    expect(text).toContain("Called nan twice.");
    // Areas are sorted, so the same records always produce the same sentence.
    expect(text).toContain("education and relationships");
  });

  it("is stable — the same records produce the same words whatever order they arrive in", () => {
    const e1 = { date: "2026-08-01", area: "education", description: "A", impactNote: "x" };
    const e2 = { date: "2026-08-10", area: "relationships", description: "B", impactNote: "" };
    expect(progressSummaryText({ ...base, entries: [e1, e2] }))
      .toEqual(progressSummaryText({ ...base, entries: [e2, e1] }));
  });

  it("names the gap when no entry records its impact", () => {
    const text = progressSummaryText({
      ...base,
      entries: [{ date: "2026-08-10", area: "health", description: "Dentist", impactNote: "   " }],
    });
    expect(text).toContain("None of the entries record what difference it made");
  });

  it("says there is no day-to-day evidence when entries are absent", () => {
    const text = progressSummaryText({
      ...base,
      outcomes: [{ domain: "Health", score: 4, previousScore: 3, trend: "up" }],
    });
    expect(text).toContain("no day-to-day evidence");
  });
});

describe("buildProgressSummary — it is about the child in front of you", () => {
  it("uses the child's own name, not a fixed one", () => {
    expect(progressSummaryText({ ...base, childName: "Child C" })).toContain("Child C");
    expect(progressSummaryText({ ...base, childName: "Child C" })).not.toContain("Child A");
  });

  it("changes when the records change", () => {
    const a = progressSummaryText({ ...base, goals: [{ title: "G1", status: "achieved", progress: 100, area: "education" }] });
    const b = progressSummaryText({ ...base, goals: [{ title: "G1", status: "at_risk", progress: 10, area: "education" }] });
    expect(a).not.toEqual(b);
  });
});
