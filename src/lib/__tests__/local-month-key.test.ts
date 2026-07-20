import { describe, it, expect } from "vitest";
import { localMonthKey } from "@/lib/utils";

// Regression cover for the UTC-vs-local month bug. "Current month" used to be
// derived with `new Date().toISOString().slice(0, 7)`, which is the UTC month —
// wrong for a UK home for part of every BST month, and outright collision-prone
// when building a month timeline.
//
// These assertions are written to be TIMEZONE-INDEPENDENT: they assert the
// invariant (a month start always yields that month's key, and twelve
// consecutive month starts yield twelve distinct keys) rather than reproducing
// a Europe/London artifact, so they hold on any CI runner. The concrete BST
// failures they protect against, verified in Europe/London:
//   · 1 Jul 00:30 BST → toISOString() gives "2026-06" (the PREVIOUS month), so
//     month-scoped Reg 44 alerts and report defaults read the wrong month for
//     the first hour of every BST month.
//   · Local midnight on 1 Mar and on 1 Apr BOTH give "2026-03" via
//     toISOString() (1 Apr 00:00 BST == 31 Mar 23:00 UTC) — so the 12-month
//     Reg 44 timeline emitted a duplicate React key and silently lost April.
describe("localMonthKey", () => {
  it("returns the LOCAL month of a month-start date, for all twelve months", () => {
    for (let m = 0; m < 12; m++) {
      const monthStart = new Date(2026, m, 1);
      expect(localMonthKey(monthStart)).toBe(`2026-${String(m + 1).padStart(2, "0")}`);
    }
  });

  it("gives twelve DISTINCT keys across a year — no clock-change collision", () => {
    // This is the timeline bug: buildMonthTimeline() walks back twelve local
    // month starts. Two of them collapsing into one key duplicates a React key
    // and drops a month from the Reg 44 timeline.
    const keys = Array.from({ length: 12 }, (_, m) => localMonthKey(new Date(2026, m, 1)));
    expect(new Set(keys).size).toBe(12);
  });

  it("reads local clock parts, not the UTC instant", () => {
    // Just after local midnight on the 1st is where UTC and local diverge under
    // BST; the key must follow the local calendar the home actually works to.
    expect(localMonthKey(new Date(2026, 6, 1, 0, 30))).toBe("2026-07");
    expect(localMonthKey(new Date(2026, 6, 31, 23, 30))).toBe("2026-07");
  });

  it("defaults to now and is always well-formed YYYY-MM", () => {
    expect(localMonthKey()).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
  });
});
