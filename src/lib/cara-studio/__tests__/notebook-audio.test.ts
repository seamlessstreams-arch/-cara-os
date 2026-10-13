import { describe, it, expect } from "vitest";
import { buildNotebookAudioScript } from "../notebook/notebook-audio";
import { buildNotebookBriefing, type NotebookInput } from "../notebook/notebook-briefing";

const TODAY = "2026-10-13";
function input(over: Partial<NotebookInput> = {}): NotebookInput {
  return {
    child: { id: "yp_1", name: "Alex River", firstName: "Alex", dob: "2012-03-01" },
    todayIso: TODAY,
    incidents: [],
    missing: [],
    dailyLogs: [],
    keywork: [],
    education: [],
    lacReviews: [],
    riskAssessments: [],
    ...over,
  };
}

describe("notebook audio briefing script", () => {
  it("is a two-voice script that opens with the Host and carries the headline", () => {
    const b = buildNotebookBriefing(input({ riskAssessments: [{ id: "ra1", nextReviewDate: "2026-08-01" }] }));
    const s = buildNotebookAudioScript(b);
    expect(s.lines[0].speaker).toBe("Host");
    expect(s.lines.some((l) => l.speaker === "Analyst")).toBe(true);
    expect(s.lines.some((l) => l.text === b.headline)).toBe(true);
    expect(s.wordCount).toBeGreaterThan(0);
    expect(s.durationLabel).toMatch(/min/);
  });

  it("voices the attention items and the honest gaps", () => {
    const b = buildNotebookBriefing(input({ missing: [{ id: "m1", date: "2026-10-09", status: "active" }] }));
    const text = buildNotebookAudioScript(b).lines.map((l) => l.text).join(" ");
    expect(text).toMatch(/missing episode/i);
    expect(text).toMatch(/flags these rather than guessing/i);
  });

  it("says a settled picture when nothing is flagged", () => {
    const b = buildNotebookBriefing(input({
      keywork: [{ id: "k1", date: "2026-10-10" }],
      dailyLogs: [{ id: "d1", date: "2026-10-10", content: "x" }],
      riskAssessments: [{ id: "ra1", nextReviewDate: "2027-01-01" }],
      lacReviews: [{ id: "l1", nextReviewDate: "2027-01-01" }],
    }));
    expect(b.needsYou).toHaveLength(0);
    expect(buildNotebookAudioScript(b).lines.some((l) => /nothing's flagged/i.test(l.text))).toBe(true);
  });

  it("is deterministic", () => {
    const b = buildNotebookBriefing(input());
    expect(buildNotebookAudioScript(b)).toEqual(buildNotebookAudioScript(b));
  });
});
