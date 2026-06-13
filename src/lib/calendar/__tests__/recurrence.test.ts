import { describe, expect, it } from "vitest";
import {
  describeRecurrence,
  expandOccurrences,
  nextOccurrenceStart,
  type CalendarRecurrence,
} from "../recurrence";

function rec(over: Partial<CalendarRecurrence> = {}): CalendarRecurrence {
  return { freq: "weekly", interval: 1, until: null, count: null, ...over };
}

const wideWindow = { from: "2026-01-01", to: "2027-12-31" };

describe("expandOccurrences", () => {
  it("returns the single start for a non-recurring event in window", () => {
    expect(expandOccurrences("2026-06-20T14:00:00", null, { from: "2026-06-01", to: "2026-06-30" })).toEqual([
      "2026-06-20T14:00:00",
    ]);
  });

  it("excludes a non-recurring event outside the window", () => {
    expect(expandOccurrences("2026-06-20T14:00:00", null, { from: "2026-07-01", to: "2026-07-31" })).toEqual([]);
  });

  it("steps daily, preserving time of day", () => {
    const out = expandOccurrences("2026-06-20T09:30:00", rec({ freq: "daily" }), { from: "2026-06-20", to: "2026-06-23" });
    expect(out).toEqual([
      "2026-06-20T09:30:00",
      "2026-06-21T09:30:00",
      "2026-06-22T09:30:00",
      "2026-06-23T09:30:00",
    ]);
  });

  it("steps weekly", () => {
    const out = expandOccurrences("2026-06-01T10:00:00", rec({ freq: "weekly" }), { from: "2026-06-01", to: "2026-06-30" });
    expect(out.map((s) => s.slice(0, 10))).toEqual(["2026-06-01", "2026-06-08", "2026-06-15", "2026-06-22", "2026-06-29"]);
  });

  it("steps fortnightly", () => {
    const out = expandOccurrences("2026-06-01T10:00:00", rec({ freq: "fortnightly" }), { from: "2026-06-01", to: "2026-07-15" });
    expect(out.map((s) => s.slice(0, 10))).toEqual(["2026-06-01", "2026-06-15", "2026-06-29", "2026-07-13"]);
  });

  it("honours interval (every 2 weeks)", () => {
    const out = expandOccurrences("2026-06-01T10:00:00", rec({ freq: "weekly", interval: 2 }), { from: "2026-06-01", to: "2026-06-30" });
    expect(out.map((s) => s.slice(0, 10))).toEqual(["2026-06-01", "2026-06-15", "2026-06-29"]);
  });

  it("steps monthly and clamps the day (Jan 31 → Feb 28)", () => {
    const out = expandOccurrences("2026-01-31T08:00:00", rec({ freq: "monthly" }), { from: "2026-01-01", to: "2026-04-30" });
    expect(out.map((s) => s.slice(0, 10))).toEqual(["2026-01-31", "2026-02-28", "2026-03-31", "2026-04-30"]);
  });

  it("stops at count (counting from the first occurrence)", () => {
    const out = expandOccurrences("2026-06-01T10:00:00", rec({ freq: "weekly", count: 3 }), wideWindow);
    expect(out.map((s) => s.slice(0, 10))).toEqual(["2026-06-01", "2026-06-08", "2026-06-15"]);
  });

  it("stops at until (inclusive)", () => {
    const out = expandOccurrences("2026-06-01T10:00:00", rec({ freq: "weekly", until: "2026-06-15" }), wideWindow);
    expect(out.map((s) => s.slice(0, 10))).toEqual(["2026-06-01", "2026-06-08", "2026-06-15"]);
  });

  it("counts earlier occurrences toward count but only returns those in window", () => {
    // count 5 from 1 Jun weekly = Jun 1,8,15,22,29; window only shows the last two.
    const out = expandOccurrences("2026-06-01T10:00:00", rec({ freq: "weekly", count: 5 }), { from: "2026-06-20", to: "2026-07-31" });
    expect(out.map((s) => s.slice(0, 10))).toEqual(["2026-06-22", "2026-06-29"]);
  });
});

describe("nextOccurrenceStart", () => {
  it("non-recurring: returns start if future, null if past", () => {
    expect(nextOccurrenceStart("2026-06-20T14:00:00", null, "2026-06-19T00:00:00")).toBe("2026-06-20T14:00:00");
    expect(nextOccurrenceStart("2026-06-20T14:00:00", null, "2026-06-21T00:00:00")).toBeNull();
  });

  it("recurring: finds the next occurrence at or after now", () => {
    const r = rec({ freq: "weekly" });
    expect(nextOccurrenceStart("2026-06-01T10:00:00", r, "2026-06-10T00:00:00")).toBe("2026-06-15T10:00:00");
  });

  it("recurring: returns null once the series has ended (until)", () => {
    const r = rec({ freq: "weekly", until: "2026-06-15" });
    expect(nextOccurrenceStart("2026-06-01T10:00:00", r, "2026-06-20T00:00:00")).toBeNull();
  });

  it("recurring: returns null once count is exhausted", () => {
    const r = rec({ freq: "weekly", count: 2 });
    // occurrences: Jun 1, Jun 8 — nothing at/after Jun 10
    expect(nextOccurrenceStart("2026-06-01T10:00:00", r, "2026-06-10T00:00:00")).toBeNull();
  });
});

describe("describeRecurrence", () => {
  it("describes non-recurring", () => {
    expect(describeRecurrence(null)).toBe("Does not repeat");
  });
  it("describes simple frequencies", () => {
    expect(describeRecurrence(rec({ freq: "weekly" }))).toBe("Repeats weekly");
    expect(describeRecurrence(rec({ freq: "monthly" }))).toBe("Repeats monthly");
  });
  it("describes intervals, until and count", () => {
    expect(describeRecurrence(rec({ freq: "weekly", interval: 2 }))).toBe("Repeats every 2 weeks");
    expect(describeRecurrence(rec({ freq: "daily", until: "2026-07-01" }))).toBe("Repeats daily until 2026-07-01");
    expect(describeRecurrence(rec({ freq: "weekly", count: 6 }))).toBe("Repeats weekly for 6 occurrences");
  });
});
