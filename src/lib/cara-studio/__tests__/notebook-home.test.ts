import { describe, it, expect } from "vitest";
import { buildNotebookBriefing, buildNotebookHomeCard, type NotebookInput } from "../notebook/notebook-briefing";

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
const card = (over: Partial<NotebookInput> = {}) => buildNotebookHomeCard("yp_1", buildNotebookBriefing(input(over)));

describe("notebook home card", () => {
  it("summarises a settled child as good with zero attention", () => {
    const c = card({ incidents: [{ id: "i1", type: "x", severity: "low", date: "2026-08-01" }] });
    expect(c.severity).toBe("good");
    expect(c.attention).toBe(0);
    expect(c.sourceCount).toBeGreaterThan(0);
  });

  it("flags a critical attention item (overdue risk review)", () => {
    const c = card({ riskAssessments: [{ id: "ra1", nextReviewDate: "2026-08-01" }] });
    expect(c.severity).toBe("crit");
    expect(c.attention).toBeGreaterThanOrEqual(1);
  });

  it("is warn (not crit) for a warn-only item (returned missing episode)", () => {
    expect(card({ missing: [{ id: "m1", date: "2026-10-08", status: "returned" }] }).severity).toBe("warn");
  });

  it("sums the record source counts", () => {
    expect(card({ keywork: [{ id: "k1", date: "2026-10-10" }], dailyLogs: [{ id: "d1", date: "2026-10-10", content: "x" }] }).sourceCount).toBe(2);
  });
});
