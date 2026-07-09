import { describe, it, expect } from "vitest";
import { getWeeklyIntelligenceObject, getMonthlyIntelligenceObject } from "@/lib/cpie/get-weekly-intelligence-object";
import { answerQuestion } from "@/lib/ask-cara/ask-cara-engine";
import { buildAskSnapshot } from "@/lib/ask-cara/build-snapshot";
import { getStore } from "@/lib/db/store";
import { daysFromNow } from "@/lib/utils";

const d = (n: number) => daysFromNow(n).slice(0, 10);
const ask = (q: string, role = "registered_manager") =>
  answerQuestion({ question: q, asOf: new Date().toISOString().slice(0, 10), snapshot: buildAskSnapshot(getStore()), role });

describe("CPIE — Monthly Intelligence Object (30-day window)", () => {
  it("windows 30 days, not 7 — the monthly object is labelled and wider", () => {
    const m = getMonthlyIntelligenceObject("yp_alex", d(0))!;
    expect(m.periodLabel).toBe("month");
    expect(m.windowDays).toBe(30);
    // 30-day span end-inclusive → start is 29 days before end.
    const span = (Date.parse(m.weekEnding) - Date.parse(m.weekStart)) / 86_400_000;
    expect(span).toBe(29);
  });

  it("captures records the 7-day window misses (Alex's -12d winning goal)", () => {
    // Weekly (today) does NOT include the -12d achievement…
    const week = getWeeklyIntelligenceObject("yp_alex", d(0))!;
    expect(week.week.achievements.some((a) => /winning goal/i.test(a.title))).toBe(false);
    // …but the 30-day monthly object does.
    const month = getMonthlyIntelligenceObject("yp_alex", d(0))!;
    expect(month.week.achievements.some((a) => /winning goal/i.test(a.title))).toBe(true);
    expect(month.week.picture.toLowerCase()).toContain("a month of");
  });

  it("the weekly object still windows 7 days (no regression)", () => {
    const w = getWeeklyIntelligenceObject("yp_alex", d(0))!;
    expect(w.periodLabel).toBe("week");
    expect(w.windowDays).toBe(7);
    const span = (Date.parse(w.weekEnding) - Date.parse(w.weekStart)) / 86_400_000;
    expect(span).toBe(6);
  });
});

describe("Ask CARA — monthly summary reads a month, not a week (the fix)", () => {
  it('routes "monthly summary" to the 30-day digest', () => {
    const a = ask("What should be in Alex's monthly summary?");
    expect(a.intent).toBe("weekly_summary");
    expect(a.answered).toBe(true);
    expect(a.text.toLowerCase()).toContain("monthly summary");
    expect(a.text.toLowerCase()).toContain("this month");
    expect(a.disclaimer?.toLowerCase()).toContain("monthly intelligence object");
  });

  it("the monthly answer covers a 30-day span (wider than the weekly one)", () => {
    const a = ask("Summarise the month for Alex");
    // The winning goal (-12d) belongs to the month but not this week.
    expect(a.text.toLowerCase()).toContain("winning goal");
  });

  it("weekly summary still reads the week", () => {
    const a = ask("What should be in Alex's weekly summary?");
    expect(a.text.toLowerCase()).toContain("this week");
    expect(a.disclaimer?.toLowerCase()).toContain("weekly intelligence object");
  });

  it("snapshot carries both weekly and monthly digests", () => {
    const snap = buildAskSnapshot(getStore());
    expect((snap.weekly?.length ?? 0)).toBeGreaterThanOrEqual(3);
    expect((snap.monthly?.length ?? 0)).toBeGreaterThanOrEqual(3);
  });
});
