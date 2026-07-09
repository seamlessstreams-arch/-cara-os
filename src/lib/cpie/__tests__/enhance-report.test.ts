import { describe, it, expect } from "vitest";
import { getWeeklyReport } from "../get-weekly-report";
import { enhanceWeeklyReport, reportToText } from "../enhance-report";

describe("CPIE weekly report — LLM enhancement (governed, graceful)", () => {
  it("NEVER a dead end: falls back to the deterministic report when the model is unavailable", async () => {
    const report = getWeeklyReport("yp_alex", undefined, 14)!;
    const r = await enhanceWeeklyReport(report);
    expect(typeof r.enhanced).toBe("boolean");
    expect(r.text.length).toBeGreaterThan(100);
    // With no AI credit/key (the test + prod reality), the gateway refuses and the
    // deterministic report is returned unchanged — the always-there floor.
    if (!r.enhanced) {
      expect(r.method).toMatch(/^(fallback|empty)/);
      expect(r.text).toContain(report.sections[0].heading);
      expect(r.text).toContain(report.childName);
    }
  });

  it("reportToText flattens the report to headings + bodies (never loses a section)", () => {
    const report = getWeeklyReport("yp_alex", undefined, 14)!;
    const text = reportToText(report);
    expect(text).toContain(report.title);
    for (const s of report.sections) expect(text).toContain(s.heading);
  });
});
