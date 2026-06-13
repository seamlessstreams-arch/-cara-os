import { describe, expect, it } from "vitest";
import { expandPattern, patternWorksOn, describePattern, shiftTypeToPeriod, type ShiftPattern } from "../shift-patterns";

function weekly(over: Partial<ShiftPattern> = {}): ShiftPattern {
  return { id: "p1", staff_id: "s1", name: "Manager", kind: "weekly", weekdays: [1, 2, 3, 4, 5], shift_type: "day", start_time: "09:00", end_time: "17:00", active: true, home_id: "home_oak", ...over };
}
function rotating(over: Partial<ShiftPattern> = {}): ShiftPattern {
  return { id: "p2", staff_id: "s2", name: "RSW", kind: "rotating", cycle_on: 2, cycle_off: 4, anchor_date: "2026-06-01", shift_type: "day", start_time: "08:00", end_time: "20:00", active: true, home_id: "home_oak", ...over };
}

describe("patternWorksOn — weekly", () => {
  it("works Mon–Fri, not weekends", () => {
    expect(patternWorksOn(weekly(), "2026-06-15")).toBe(true); // Monday
    expect(patternWorksOn(weekly(), "2026-06-13")).toBe(false); // Saturday
    expect(patternWorksOn(weekly(), "2026-06-14")).toBe(false); // Sunday
  });
  it("an inactive pattern never works", () => {
    expect(patternWorksOn(weekly({ active: false }), "2026-06-15")).toBe(false);
  });
});

describe("patternWorksOn — rotating 2 on / 4 off", () => {
  it("follows the cycle from the anchor", () => {
    const r = rotating();
    expect(patternWorksOn(r, "2026-06-01")).toBe(true); // day 0 — on
    expect(patternWorksOn(r, "2026-06-02")).toBe(true); // day 1 — on
    expect(patternWorksOn(r, "2026-06-03")).toBe(false); // day 2 — off
    expect(patternWorksOn(r, "2026-06-06")).toBe(false); // day 5 — off
    expect(patternWorksOn(r, "2026-06-07")).toBe(true); // day 6 — back on
    expect(patternWorksOn(r, "2026-06-08")).toBe(true); // day 7 — on
  });
  it("is off before the anchor date", () => {
    expect(patternWorksOn(rotating(), "2026-05-31")).toBe(false);
  });
});

describe("expandPattern", () => {
  it("expands a rotating cycle across a range", () => {
    const out = expandPattern(rotating(), { from: "2026-06-01", to: "2026-06-08" });
    expect(out.map((o) => o.date)).toEqual(["2026-06-01", "2026-06-02", "2026-06-07", "2026-06-08"]);
    expect(out[0]).toMatchObject({ staff_id: "s2", shift_type: "day", start_time: "08:00", pattern_id: "p2" });
  });
  it("expands a weekly pattern across a week", () => {
    const out = expandPattern(weekly(), { from: "2026-06-15", to: "2026-06-21" }); // Mon..Sun
    expect(out.map((o) => o.date)).toEqual(["2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18", "2026-06-19"]);
  });
  it("returns nothing for a reversed range", () => {
    expect(expandPattern(weekly(), { from: "2026-06-21", to: "2026-06-15" })).toEqual([]);
  });
});

describe("describePattern", () => {
  it("names common shapes", () => {
    expect(describePattern(weekly())).toBe("Mon–Fri");
    expect(describePattern(weekly({ weekdays: [0, 1, 2, 3, 4, 5, 6] }))).toBe("Every day");
    expect(describePattern(weekly({ weekdays: [6, 0] }))).toBe("Sun, Sat"); // sorted ascending (Sun=0)
    expect(describePattern(rotating())).toBe("2 on / 4 off");
  });
});

describe("shiftTypeToPeriod", () => {
  it("maps night types to night, else day", () => {
    expect(shiftTypeToPeriod("waking_night")).toBe("night");
    expect(shiftTypeToPeriod("sleep_in")).toBe("night");
    expect(shiftTypeToPeriod("day")).toBe("day");
    expect(shiftTypeToPeriod("short")).toBe("day");
  });
});
