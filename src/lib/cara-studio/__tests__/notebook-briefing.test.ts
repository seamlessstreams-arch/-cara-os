import { describe, it, expect } from "vitest";
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

describe("notebook briefing", () => {
  it("flags an overdue risk assessment review as critical, with provenance", () => {
    const b = buildNotebookBriefing(input({ riskAssessments: [{ id: "ra1", nextReviewDate: "2026-08-01" }] }));
    const crit = b.needsYou.find((s) => s.severity === "crit" && /risk assessment review is overdue/i.test(s.text));
    expect(crit).toBeDefined();
    expect(crit!.provenance[0].recordType).toBe("Risk assessment");
  });

  it("surfaces a recent missing episode with a return-interview gap", () => {
    const b = buildNotebookBriefing(input({ missing: [{ id: "m1", date: "2026-10-08", status: "returned", hasReturnInterview: false }] }));
    expect(b.needsYou.some((s) => /missing episode on 8 Oct.*return interview not yet recorded/i.test(s.text))).toBe(true);
  });

  it("does NOT flag a missing episode outside the 14-day window", () => {
    const b = buildNotebookBriefing(input({ missing: [{ id: "m1", date: "2026-09-01", status: "returned", hasReturnInterview: true }] }));
    expect(b.needsYou.some((s) => /missing episode/i.test(s.text))).toBe(false);
  });

  it("credits recent key-work as what's working", () => {
    const b = buildNotebookBriefing(input({ keywork: [{ id: "k1", date: "2026-10-08" }, { id: "k2", date: "2026-10-10" }] }));
    const w = b.working.find((s) => /2 key-work sessions/i.test(s.text));
    expect(w).toBeDefined();
    expect(w!.provenance.length).toBeGreaterThan(0);
  });

  it("names honest gaps when records are absent, and never invents a signal", () => {
    const b = buildNotebookBriefing(input());
    expect(b.gaps).toContain("No risk assessment on file.");
    expect(b.gaps).toContain("No key-work session recorded in the last 14 days.");
    expect(b.needsYou).toHaveLength(0);
    expect(b.headline).toMatch(/settled picture/i);
  });

  it("headline counts the attention items", () => {
    const b = buildNotebookBriefing(input({
      riskAssessments: [{ id: "ra1", nextReviewDate: "2026-08-01" }],
      missing: [{ id: "m1", date: "2026-10-09", status: "active" }],
    }));
    expect(b.headline).toMatch(/2 things need your attention/i);
  });

  it("guards against an implausible date of birth (no age shown)", () => {
    const b = buildNotebookBriefing(input({ child: { id: "x", name: "Test Child", firstName: "Test", dob: "0014-10-10" } }));
    expect(b.windowLabel).not.toMatch(/age/);
  });

  it("is deterministic", () => {
    const i = input({ incidents: [{ id: "i1", type: "missing_from_care", severity: "high", date: "2026-10-09" }] });
    expect(buildNotebookBriefing(i)).toEqual(buildNotebookBriefing(i));
  });
});
