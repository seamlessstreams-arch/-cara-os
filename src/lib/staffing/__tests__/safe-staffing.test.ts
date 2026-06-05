import { describe, it, expect } from "vitest";
import {
  assessStaffing, currentPeriod, getStaffingConfig, DEFAULT_STAFFING_CONFIG,
  type StaffOnShiftLite,
} from "../safe-staffing";

const cfg = DEFAULT_STAFFING_CONFIG; // day 2, night 1, waking_night_required
const staff = (n: number, type = "day"): StaffOnShiftLite[] =>
  Array.from({ length: n }, (_, i) => ({ staff_id: `s${i}`, name: `S${i}`, shift_type: type }));

describe("currentPeriod", () => {
  it("classifies night 22:00–06:59, day otherwise", () => {
    expect(currentPeriod("2026-09-20T23:00:00Z")).toBe("night");
    expect(currentPeriod("2026-09-20T03:00:00Z")).toBe("night");
    expect(currentPeriod("2026-09-20T06:59:00Z")).toBe("night");
    expect(currentPeriod("2026-09-20T07:00:00Z")).toBe("day");
    expect(currentPeriod("2026-09-20T14:00:00Z")).toBe("day");
    expect(currentPeriod("2026-09-20T21:59:00Z")).toBe("day");
  });
});

describe("assessStaffing — day", () => {
  it("2 staff meets the day minimum → ok", () => {
    const a = assessStaffing(staff(2), "day", cfg);
    expect(a.severity).toBe("ok");
    expect(a.is_understaffed).toBe(false);
    expect(a.is_lone_working).toBe(false);
    expect(a.alerts).toHaveLength(0);
  });

  it("1 staff is understaffed AND lone working → critical", () => {
    const a = assessStaffing(staff(1), "day", cfg);
    expect(a.is_understaffed).toBe(true);
    expect(a.is_lone_working).toBe(true);
    expect(a.shortfall).toBe(1);
    expect(a.severity).toBe("critical");
    expect(a.alerts.map((x) => x.type)).toEqual(expect.arrayContaining(["understaffed", "lone_working"]));
  });

  it("0 staff → no_cover critical", () => {
    const a = assessStaffing(staff(0), "day", cfg);
    expect(a.alerts[0].type).toBe("no_cover");
    expect(a.severity).toBe("critical");
  });
});

describe("assessStaffing — night", () => {
  it("1 waking-night staff meets the night minimum with cover → ok", () => {
    const a = assessStaffing(staff(1, "waking_night"), "night", cfg);
    expect(a.minimum_required).toBe(1);
    expect(a.has_waking_night).toBe(true);
    expect(a.no_night_cover).toBe(false);
    // still lone working (count 1) → a 'high' alert, not 'ok'
    expect(a.is_lone_working).toBe(true);
    expect(a.severity).toBe("high");
  });

  it("a sleep-in alone (no waking night) → no night cover (critical)", () => {
    const a = assessStaffing(staff(1, "sleep_in"), "night", cfg);
    expect(a.has_waking_night).toBe(false);
    expect(a.no_night_cover).toBe(true);
    expect(a.severity).toBe("critical");
    expect(a.alerts.map((x) => x.type)).toContain("no_night_cover");
  });

  it("2 staff incl waking night → covered, not lone, ok", () => {
    const a = assessStaffing(
      [{ staff_id: "a", name: "A", shift_type: "waking_night" }, { staff_id: "b", name: "B", shift_type: "sleep_in" }],
      "night",
      cfg,
    );
    expect(a.has_waking_night).toBe(true);
    expect(a.is_lone_working).toBe(false);
    expect(a.severity).toBe("ok");
  });
});

describe("config", () => {
  it("returns the default config for any home", () => {
    expect(getStaffingConfig("home_oak")).toEqual(DEFAULT_STAFFING_CONFIG);
  });
});
