import { describe, it, expect } from "vitest";
import { localMonthKey, londonDateStr, todayStr, daysFromNow } from "@/lib/utils";

// Calendar dates in Cara are Europe/London, always — the homes are in the UK
// and their records are legal documents, so "what day is it" must mean the day
// the staff on shift are living in, never the server's day.
//
// Every instant below is written with an EXPLICIT offset (…+01:00 / …Z) so the
// assertions describe one unambiguous moment and hold identically on a London
// dev machine and a UTC CI runner. (Constructing with `new Date(y, m, d, h)`
// would mean a different instant on each, which is how the previous version of
// this file quietly encoded the runner's zone into its expectations.)
describe("londonDateStr — the night-shift bug", () => {
  it("files a 00:30 BST record under TODAY, not yesterday", () => {
    // 00:30 on 9 Aug in London is 23:30 on 8 Aug UTC. toISOString() — what this
    // codebase used everywhere — would date the record 8 August: a night-shift
    // incident, medication round or missing-from-care episode logged under the
    // wrong day.
    const justAfterMidnightBst = new Date("2026-08-09T00:30:00+01:00");
    expect(justAfterMidnightBst.toISOString().slice(0, 10)).toBe("2026-08-08"); // the old, wrong answer
    expect(londonDateStr(justAfterMidnightBst)).toBe("2026-08-09"); // the day staff are actually working
  });

  it("agrees with UTC outside BST, when London is GMT", () => {
    const winterNight = new Date("2026-01-15T00:30:00Z");
    expect(londonDateStr(winterNight)).toBe("2026-01-15");
  });

  it("holds at both clock changes", () => {
    // Spring forward: 01:00 GMT → 02:00 BST on 29 Mar 2026.
    expect(londonDateStr(new Date("2026-03-29T00:30:00Z"))).toBe("2026-03-29");
    expect(londonDateStr(new Date("2026-03-29T01:30:00Z"))).toBe("2026-03-29");
    // Autumn back: 02:00 BST → 01:00 GMT on 25 Oct 2026.
    expect(londonDateStr(new Date("2026-10-25T00:30:00Z"))).toBe("2026-10-25");
    expect(londonDateStr(new Date("2026-10-24T23:30:00Z"))).toBe("2026-10-25"); // still BST → already the 25th
  });

  it("todayStr is the London date and always well-formed", () => {
    expect(todayStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(todayStr()).toBe(londonDateStr());
  });
});

describe("daysFromNow", () => {
  it("is calendar arithmetic anchored on today", () => {
    expect(daysFromNow(0)).toBe(todayStr());
    const [y, m, d] = todayStr().split("-").map(Number);
    expect(daysFromNow(1)).toBe(new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10));
    expect(daysFromNow(-1)).toBe(new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10));
  });

  it("crosses month and year ends correctly", () => {
    expect(daysFromNow(0)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(daysFromNow(400)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// Regression cover for the UTC-vs-London month bug: month-scoped Reg 44 alerts
// and report defaults read the wrong month for the first hour of every BST
// month, and a twelve-month timeline built from local midnights collided at the
// spring change (Mar and Apr both mapping to "YYYY-03"), duplicating a React
// key and silently dropping a month.
describe("localMonthKey", () => {
  it("returns the London month at the first-hour boundary", () => {
    // 00:30 on 1 Jul BST is 30 Jun in UTC — the alerts must follow the home.
    expect(localMonthKey(new Date("2026-07-01T00:30:00+01:00"))).toBe("2026-07");
    expect(localMonthKey(new Date("2026-07-31T23:30:00+01:00"))).toBe("2026-07");
    // …and the instant an hour later is genuinely the new month.
    expect(localMonthKey(new Date("2026-08-01T00:30:00+01:00"))).toBe("2026-08");
  });

  it("gives twelve DISTINCT keys across a year — no clock-change collision", () => {
    const keys = Array.from({ length: 12 }, (_, m) =>
      localMonthKey(new Date(`2026-${String(m + 1).padStart(2, "0")}-01T12:00:00Z`)),
    );
    expect(new Set(keys).size).toBe(12);
    expect(keys[2]).toBe("2026-03");
    expect(keys[3]).toBe("2026-04");
  });

  it("defaults to now and is always well-formed YYYY-MM", () => {
    expect(localMonthKey()).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
  });
});
