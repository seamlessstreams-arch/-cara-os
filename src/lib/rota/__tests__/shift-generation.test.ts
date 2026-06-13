import { describe, expect, it } from "vitest";
import { planShiftGeneration } from "../shift-generation";
import type { ShiftPattern } from "../shift-patterns";

const day: Pick<ShiftPattern, "shift_type" | "start_time" | "end_time" | "active" | "home_id"> = {
  shift_type: "day", start_time: "08:00", end_time: "20:00", active: true, home_id: "home_oak",
};
const night: Pick<ShiftPattern, "shift_type" | "start_time" | "end_time" | "active" | "home_id"> = {
  shift_type: "waking_night", start_time: "20:00", end_time: "08:00", active: true, home_id: "home_oak",
};

// A Mon–Fri manager and a waking-night worker across one week.
const PATTERNS: ShiftPattern[] = [
  { id: "p_mgr", staff_id: "s_mgr", name: "RM Mon–Fri", kind: "weekly", weekdays: [1, 2, 3, 4, 5], ...day },
  { id: "p_night", staff_id: "s_night", name: "Waking night every day", kind: "weekly", weekdays: [0, 1, 2, 3, 4, 5, 6], ...night },
];

// Mon 2026-06-15 … Sun 2026-06-21
const RANGE = { from: "2026-06-15", to: "2026-06-21" };

describe("planShiftGeneration", () => {
  it("expands active patterns into dated candidates with the right period", () => {
    const r = planShiftGeneration({ patterns: PATTERNS, range: RANGE, existingKeys: new Set(), unavailable: new Set() });
    // Manager: 5 weekdays. Night worker: 7 days. Total 12.
    expect(r.total).toBe(12);
    expect(r.candidates.filter((c) => c.staff_id === "s_mgr")).toHaveLength(5);
    expect(r.candidates.filter((c) => c.period === "night")).toHaveLength(7);
    expect(r.by_staff.find((s) => s.staff_id === "s_mgr")?.count).toBe(5);
  });

  it("skips dates that already have a published shift", () => {
    const existing = new Set(["s_mgr|2026-06-15", "s_mgr|2026-06-16"]);
    const r = planShiftGeneration({ patterns: PATTERNS, range: RANGE, existingKeys: existing, unavailable: new Set() });
    expect(r.skipped_existing).toBe(2);
    expect(r.total).toBe(10);
    expect(r.candidates.some((c) => c.staff_id === "s_mgr" && c.date === "2026-06-15")).toBe(false);
  });

  it("skips staff who are unavailable (leave / sickness) on a date", () => {
    const unavailable = new Set(["s_night|2026-06-15", "s_night|2026-06-16"]);
    const r = planShiftGeneration({ patterns: PATTERNS, range: RANGE, existingKeys: new Set(), unavailable });
    expect(r.skipped_unavailable).toBe(2);
    expect(r.total).toBe(10);
  });

  it("produces a per-date day/night breakdown and stays chronological", () => {
    const r = planShiftGeneration({ patterns: PATTERNS, range: RANGE, existingKeys: new Set(), unavailable: new Set() });
    const mon = r.by_date.find((d) => d.date === "2026-06-15");
    expect(mon).toEqual({ date: "2026-06-15", day: 1, night: 1 }); // manager + night worker
    const sun = r.by_date.find((d) => d.date === "2026-06-21");
    expect(sun).toEqual({ date: "2026-06-21", day: 0, night: 1 }); // only night worker on Sunday
    const dates = r.candidates.map((c) => c.date);
    expect([...dates]).toEqual([...dates].sort());
  });

  it("an inactive pattern generates nothing", () => {
    const r = planShiftGeneration({ patterns: [{ ...PATTERNS[0], active: false }], range: RANGE, existingKeys: new Set(), unavailable: new Set() });
    expect(r.total).toBe(0);
  });
});
