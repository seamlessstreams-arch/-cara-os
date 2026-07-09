import { describe, it, expect } from "vitest";
import { getWeeklyReport, getWeeklyNarrative } from "../get-weekly-report";

// Alex's seeded week includes a CRITICAL safeguarding disclosure (inc_004) — the
// perfect case to prove the child-facing report never reflects it back.
const report = getWeeklyReport("yp_alex", undefined, 14);

describe("CPIE weekly report", () => {
  it("produces the full Oak House template structure, in order, ending with the Manager Summary", () => {
    expect(report).toBeTruthy();
    const r = report!;
    expect(r.sections.length).toBe(12);
    const groups = [...new Set(r.sections.map((s) => s.group))];
    expect(groups).toContain("What has my week been like?");
    expect(groups).toContain("Health and wellbeing");
    expect(groups).toContain("Family Time");
    expect(groups).toContain("Education");
    expect(groups).toContain("Activities");
    expect(groups).toContain("Independence");
    expect(groups[groups.length - 1]).toBe("Manager Summary");
  });

  it("SAFEGUARDING: never reflects a critical safeguarding disclosure back at the child", () => {
    const struggle = report!.sections.find((s) => s.heading.toLowerCase().includes("struggled"))!;
    expect(struggle.body.toLowerCase()).not.toMatch(/disclos|abuse|older peer|exploit|grooming/);
  });

  it("writes the child-facing sections in the SECOND person", () => {
    const wellDone = report!.sections.find((s) => s.heading.includes("done really well"))!;
    expect(wellDone.body.toLowerCase()).toContain("you");
    expect(wellDone.body).not.toMatch(/\bAlex (was|had|went|felt)\b/); // not third person
  });

  it("the Manager Summary is the third-person professional synthesis", () => {
    const ms = report!.sections.find((s) => s.group === "Manager Summary")!;
    expect(ms.body).toContain("Alex");
    expect(ms.body.toLowerCase()).toContain("overall");
  });

  it("marks a genuinely empty section honestly rather than fabricating (appointments)", () => {
    const appts = report!.sections.find((s) => s.heading.includes("appointments"))!;
    // seed has no appointments in-window → honest empty
    expect(appts.empty).toBe(true);
    expect(appts.body.length).toBeGreaterThan(10);
  });

  it("getWeeklyNarrative returns the third-person manager-summary prose", () => {
    const n = getWeeklyNarrative("yp_alex", undefined, 14);
    expect(n?.overall.toLowerCase()).toContain("overall");
    expect(n?.body).toContain("Alex");
  });

  it("returns null for an unknown child (never invents a report)", () => {
    expect(getWeeklyReport("yp_nobody")).toBeNull();
  });
});
