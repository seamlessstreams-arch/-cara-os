import { describe, it, expect } from "vitest";
import { intelligenceDb } from "@/lib/intelligence/store";
import { todayStr, londonWeekday, londonDayDiff } from "@/lib/utils";

// Regression net for seed decay: these seeds were once fixed strings from
// April 2026 and had silently aged four months — every trend window over
// this store was reading "stale". seedDay() re-anchors them to the current
// London week at module load; these assertions fail if anyone reintroduces
// fixed dates that drift out of range.
describe("intelligence seeds float with the calendar", () => {
  it("CPIE weekly periods are Monday-aligned and the latest completed week is recent", () => {
    const weeklies = intelligenceDb.childExperience.findByChild("yp_casey");
    const starts = weeklies.map((w: { period_start: string }) => w.period_start);
    for (const s of starts) expect(londonWeekday(s)).toBe(1);
    const newest = starts.sort().at(-1)!;
    const age = -londonDayDiff(newest);
    expect(age).toBeGreaterThanOrEqual(0);
    expect(age).toBeLessThanOrEqual(21);
  });

  it("no 'recent activity' seed is older than ~5 months or in the far future", () => {
    const all = JSON.stringify(intelligenceDb.childExperience.findByChild("yp_casey")) + JSON.stringify(intelligenceDb.piDebriefs.findAll("home_oak"));
    const dates = [...all.matchAll(/"(20[0-9]{2}-[0-9]{2}-[0-9]{2})/g)].map((m) => m[1]);
    expect(dates.length).toBeGreaterThan(10);
    const today = todayStr();
    const past = dates.filter((d) => d <= today).sort();
    const future = dates.filter((d) => d > today).sort();
    // deepest history ≈ authored 7.5 months; farthest future ≈ authored 12 weeks
    expect(-londonDayDiff(past[0])).toBeLessThanOrEqual(260);
    if (future.length) expect(londonDayDiff(future.at(-1)!)).toBeLessThanOrEqual(200);
  });
});
