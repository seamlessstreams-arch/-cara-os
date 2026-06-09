// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ROTA INTELLIGENCE ENGINE TESTS
// Comprehensive test suite: unit + integration
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeRotaIntelligence,
  computeShiftHours,
  shiftLabel,
  weekStart,
  weekEnd,
  type ShiftInput,
  type AbsenceInput,
  type StaffRef,
} from "../rota-intelligence-engine";

// ── Factories ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-25"; // Monday

const STAFF: StaffRef[] = [
  { id: "staff_darren", name: "Darren" },
  { id: "staff_ryan", name: "Ryan" },
  { id: "staff_edward", name: "Edward" },
  { id: "staff_anna", name: "Anna" },
  { id: "staff_lackson", name: "Lackson" },
  { id: "staff_chervelle", name: "Chervelle" },
  { id: "staff_diane", name: "Diane" },
];

let shiftCounter = 0;
function makeShift(overrides: Partial<ShiftInput> = {}): ShiftInput {
  shiftCounter++;
  return {
    id: `shift_test_${shiftCounter}`,
    staff_id: "staff_darren",
    date: TODAY,
    shift_type: "day",
    start_time: "08:00",
    end_time: "17:00",
    break_minutes: 60,
    overtime_minutes: 0,
    status: "completed",
    is_open_shift: false,
    notes: null,
    ...overrides,
  };
}

function makeAbsence(overrides: Partial<AbsenceInput> = {}): AbsenceInput {
  return {
    id: "abs_1",
    staff_id: "staff_darren",
    start_date: TODAY,
    end_date: TODAY,
    type: "sick",
    return_to_work_completed: false,
    ...overrides,
  };
}

// ── Helper Tests ────────────────────────────────────────────────────────────

describe("shiftLabel", () => {
  it("maps known shift types", () => {
    expect(shiftLabel("day")).toBe("Day Shift");
    expect(shiftLabel("sleep_in")).toBe("Sleep-In");
    expect(shiftLabel("waking_night")).toBe("Waking Night");
    expect(shiftLabel("long_day")).toBe("Long Day");
  });

  it("capitalizes unknown shift types", () => {
    expect(shiftLabel("twilight")).toBe("Twilight");
    expect(shiftLabel("early_morning")).toBe("Early morning");
  });
});

describe("computeShiftHours", () => {
  it("calculates standard day shift (08:00-17:00, 60min break)", () => {
    expect(computeShiftHours("08:00", "17:00", 60)).toBe(8);
  });

  it("calculates long day (07:00-22:00, 60min break)", () => {
    expect(computeShiftHours("07:00", "22:00", 60)).toBe(14);
  });

  it("calculates overnight shift (22:00-07:00, 0 break)", () => {
    expect(computeShiftHours("22:00", "07:00", 0)).toBe(9);
  });

  it("handles shift with 30min break", () => {
    expect(computeShiftHours("10:00", "20:00", 30)).toBe(9.5);
  });

  it("returns 0 if break exceeds shift duration", () => {
    expect(computeShiftHours("08:00", "09:00", 120)).toBe(0);
  });

  it("handles midnight crossing (23:00-06:00)", () => {
    expect(computeShiftHours("23:00", "06:00", 0)).toBe(7);
  });
});

describe("weekStart / weekEnd", () => {
  it("Monday returns same day as start", () => {
    expect(weekStart("2026-05-25")).toBe("2026-05-25");
  });

  it("Monday returns Sunday as end", () => {
    expect(weekEnd("2026-05-25")).toBe("2026-05-31");
  });

  it("Thursday mid-week returns correct Monday", () => {
    expect(weekStart("2026-05-28")).toBe("2026-05-25");
  });

  it("Sunday returns previous Monday", () => {
    expect(weekStart("2026-05-31")).toBe("2026-05-25");
  });

  it("Sunday returns itself as end", () => {
    expect(weekEnd("2026-05-31")).toBe("2026-05-31");
  });
});

// ── Integration: Overview ───────────────────────────────────────────────────

describe("computeRotaIntelligence — overview", () => {
  it("counts unique staff today (excluding open/cancelled)", () => {
    const shifts = [
      makeShift({ staff_id: "staff_darren", status: "in_progress" }),
      makeShift({ staff_id: "staff_ryan", status: "in_progress" }),
      makeShift({ staff_id: "staff_darren", status: "scheduled" }),
      makeShift({ is_open_shift: true, staff_id: "" }),
      makeShift({ status: "cancelled", staff_id: "staff_anna" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    expect(result.overview.total_staff_today).toBe(2);
  });

  it("counts all non-cancelled shifts today (including open)", () => {
    const shifts = [
      makeShift({ status: "in_progress" }),
      makeShift({ is_open_shift: true, staff_id: "" }),
      makeShift({ status: "cancelled" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    expect(result.overview.shifts_today).toBe(2);
  });

  it("counts open shifts in next 7 days", () => {
    const shifts = [
      makeShift({ is_open_shift: true, date: "2026-05-26" }),
      makeShift({ is_open_shift: true, date: "2026-05-30" }),
      makeShift({ is_open_shift: true, date: "2026-06-02" }), // 8 days ahead — excluded
      makeShift({ is_open_shift: true, date: "2026-05-25" }), // today counts
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    expect(result.overview.open_shifts_7_days).toBe(3);
  });

  it("sums total hours for the week (Mon-Sun)", () => {
    const shifts = [
      makeShift({ date: "2026-05-25", start_time: "08:00", end_time: "17:00", break_minutes: 60 }), // 8h
      makeShift({ date: "2026-05-27", start_time: "07:00", end_time: "22:00", break_minutes: 60, staff_id: "staff_edward" }), // 14h
      makeShift({ date: "2026-05-24", start_time: "08:00", end_time: "17:00", break_minutes: 60 }), // prev week — excluded
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    expect(result.overview.total_hours_week).toBe(22);
  });

  it("sums overtime hours for the week", () => {
    const shifts = [
      makeShift({ date: "2026-05-25", overtime_minutes: 30 }),
      makeShift({ date: "2026-05-26", overtime_minutes: 45, staff_id: "staff_ryan" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    expect(result.overview.overtime_hours_week).toBe(1.3); // (30+45)/60 rounded to 1 decimal
  });

  it("counts no-shows in last 30 days", () => {
    const shifts = [
      makeShift({ status: "no_show", date: "2026-05-20" }),
      makeShift({ status: "no_show", date: "2026-04-25" }), // exactly 30 days ago — excluded (> check)
      makeShift({ status: "no_show", date: "2026-04-27" }), // 28 days ago — included
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    expect(result.overview.no_show_count_30_days).toBe(2);
  });

  it("calculates completion rate", () => {
    const shifts = [
      makeShift({ status: "completed", date: "2026-05-20" }),
      makeShift({ status: "completed", date: "2026-05-19" }),
      makeShift({ status: "completed", date: "2026-05-18" }),
      makeShift({ status: "no_show", date: "2026-05-17" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    expect(result.overview.completion_rate).toBe(75); // 3/(3+1)*100
  });

  it("returns 100% completion rate with no data", () => {
    const result = computeRotaIntelligence({ shifts: [], absences: [], staff: STAFF, today: TODAY });
    expect(result.overview.completion_rate).toBe(100);
  });

  it("counts agency shifts via notes field", () => {
    const shifts = [
      makeShift({ notes: "Covered by agency staff" }),
      makeShift({ notes: "AGENCY worker - Bianca" }),
      makeShift({ notes: "Normal shift" }),
      makeShift({ notes: null }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    expect(result.overview.agency_shifts).toBe(2);
  });
});

// ── Integration: Shift Coverage ─────────────────────────────────────────────

describe("computeRotaIntelligence — shift coverage", () => {
  it("groups today's shifts by type with unique staff count", () => {
    const shifts = [
      makeShift({ shift_type: "day", staff_id: "staff_darren" }),
      makeShift({ shift_type: "day", staff_id: "staff_ryan" }),
      makeShift({ shift_type: "sleep_in", staff_id: "staff_anna" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    expect(result.shift_coverage).toHaveLength(2);
    const day = result.shift_coverage.find((c) => c.shift_type === "day");
    expect(day?.staff_count).toBe(2);
    expect(day?.is_covered).toBe(true);
    expect(day?.shift_label).toBe("Day Shift");
  });

  it("marks open-only shift type as not covered", () => {
    const shifts = [
      makeShift({ shift_type: "waking_night", is_open_shift: true, staff_id: "" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const wn = result.shift_coverage.find((c) => c.shift_type === "waking_night");
    expect(wn?.staff_count).toBe(0);
    expect(wn?.is_covered).toBe(false);
  });

  it("does not count same staff member twice per shift type", () => {
    const shifts = [
      makeShift({ shift_type: "day", staff_id: "staff_darren" }),
      makeShift({ shift_type: "day", staff_id: "staff_darren" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const day = result.shift_coverage.find((c) => c.shift_type === "day");
    expect(day?.staff_count).toBe(1);
  });
});

// ── Integration: Staff Hours ────────────────────────────────────────────────

describe("computeRotaIntelligence — staff hours", () => {
  it("calculates hours per staff member for the week", () => {
    const shifts = [
      makeShift({ staff_id: "staff_darren", start_time: "08:00", end_time: "17:00", break_minutes: 60 }), // 8h Mon
      makeShift({ staff_id: "staff_darren", date: "2026-05-26", start_time: "08:00", end_time: "17:00", break_minutes: 60 }), // 8h Tue
      makeShift({ staff_id: "staff_darren", date: "2026-05-27", start_time: "08:00", end_time: "17:00", break_minutes: 60 }), // 8h Wed
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const darren = result.staff_hours.find((s) => s.staff_id === "staff_darren");
    expect(darren?.hours_this_week).toBe(24);
    expect(darren?.shifts_this_week).toBe(3);
  });

  it("flags staff exceeding 48h", () => {
    const shifts = [
      makeShift({ staff_id: "staff_edward", date: "2026-05-25", start_time: "07:00", end_time: "22:00", break_minutes: 60 }), // 14h
      makeShift({ staff_id: "staff_edward", date: "2026-05-26", start_time: "07:00", end_time: "22:00", break_minutes: 60 }), // 14h
      makeShift({ staff_id: "staff_edward", date: "2026-05-27", start_time: "07:00", end_time: "22:00", break_minutes: 60 }), // 14h
      makeShift({ staff_id: "staff_edward", date: "2026-05-28", start_time: "07:00", end_time: "22:00", break_minutes: 60 }), // 14h = 56h
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const edward = result.staff_hours.find((s) => s.staff_id === "staff_edward");
    expect(edward?.exceeds_48h).toBe(true);
    expect(edward?.hours_this_week).toBe(56);
  });

  it("does not flag staff under 48h", () => {
    const shifts = [
      makeShift({ staff_id: "staff_ryan", date: "2026-05-25", start_time: "08:00", end_time: "17:00", break_minutes: 60 }),
      makeShift({ staff_id: "staff_ryan", date: "2026-05-26", start_time: "08:00", end_time: "17:00", break_minutes: 60 }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const ryan = result.staff_hours.find((s) => s.staff_id === "staff_ryan");
    expect(ryan?.exceeds_48h).toBe(false);
    expect(ryan?.hours_this_week).toBe(16);
  });

  it("sorts by highest hours first", () => {
    const shifts = [
      makeShift({ staff_id: "staff_ryan", start_time: "08:00", end_time: "12:00", break_minutes: 0 }), // 4h
      makeShift({ staff_id: "staff_darren", start_time: "08:00", end_time: "17:00", break_minutes: 60 }), // 8h
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    expect(result.staff_hours[0].staff_id).toBe("staff_darren");
    expect(result.staff_hours[1].staff_id).toBe("staff_ryan");
  });

  it("resolves staff name from StaffRef", () => {
    const shifts = [makeShift({ staff_id: "staff_anna" })];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const anna = result.staff_hours.find((s) => s.staff_id === "staff_anna");
    expect(anna?.staff_name).toBe("Anna");
  });

  it("falls back to staff_id when name not found", () => {
    const shifts = [makeShift({ staff_id: "staff_unknown" })];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const unknown = result.staff_hours.find((s) => s.staff_id === "staff_unknown");
    expect(unknown?.staff_name).toBe("staff_unknown");
  });
});

// ── Integration: Upcoming Gaps ──────────────────────────────────────────────

describe("computeRotaIntelligence — upcoming gaps", () => {
  it("lists open shifts in next 7 days sorted by date", () => {
    const shifts = [
      makeShift({ is_open_shift: true, date: "2026-05-28", shift_type: "day", notes: "Sick leave cover needed" }),
      makeShift({ is_open_shift: true, date: "2026-05-26", shift_type: "sleep_in", notes: null }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    expect(result.upcoming_gaps).toHaveLength(2);
    expect(result.upcoming_gaps[0].date).toBe("2026-05-26");
    expect(result.upcoming_gaps[0].shift_label).toBe("Sleep-In");
    expect(result.upcoming_gaps[0].reason).toBe("No staff assigned");
    expect(result.upcoming_gaps[1].date).toBe("2026-05-28");
    expect(result.upcoming_gaps[1].reason).toBe("Sick leave cover needed");
  });

  it("excludes cancelled open shifts", () => {
    const shifts = [
      makeShift({ is_open_shift: true, date: "2026-05-26", status: "cancelled" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    expect(result.upcoming_gaps).toHaveLength(0);
  });

  it("excludes open shifts beyond 7 days", () => {
    const shifts = [
      makeShift({ is_open_shift: true, date: "2026-06-05" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    expect(result.upcoming_gaps).toHaveLength(0);
  });
});

// ── Integration: Alerts ─────────────────────────────────────────────────────

describe("computeRotaIntelligence — alerts", () => {
  it("generates critical alert for open shift today", () => {
    const shifts = [
      makeShift({ is_open_shift: true, date: TODAY, shift_type: "day" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const critical = result.alerts.filter((a) => a.severity === "critical");
    expect(critical).toHaveLength(1);
    expect(critical[0].message).toContain("Unfilled Day Shift shift today");
  });

  it("generates high alert for open shift tomorrow", () => {
    const shifts = [
      makeShift({ is_open_shift: true, date: "2026-05-26", shift_type: "sleep_in" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const high = result.alerts.filter((a) => a.severity === "high" && a.message.includes("tomorrow"));
    expect(high).toHaveLength(1);
    expect(high[0].message).toContain("Unfilled Sleep-In shift tomorrow");
  });

  it("generates high alert for staff exceeding 48h", () => {
    const shifts = [
      makeShift({ staff_id: "staff_edward", date: "2026-05-25", start_time: "06:00", end_time: "22:00", break_minutes: 0 }), // 16h
      makeShift({ staff_id: "staff_edward", date: "2026-05-26", start_time: "06:00", end_time: "22:00", break_minutes: 0 }), // 16h
      makeShift({ staff_id: "staff_edward", date: "2026-05-27", start_time: "06:00", end_time: "22:00", break_minutes: 0 }), // 16h = 48h
      makeShift({ staff_id: "staff_edward", date: "2026-05-28", start_time: "06:00", end_time: "08:00", break_minutes: 0 }), // 2h = 50h
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const high = result.alerts.filter((a) => a.severity === "high" && a.message.includes("48h"));
    expect(high).toHaveLength(1);
    expect(high[0].message).toContain("Edward");
    expect(high[0].message).toContain("50h");
  });

  it("generates medium alert for no-shows in last 7 days", () => {
    const shifts = [
      makeShift({ status: "no_show", date: "2026-05-20" }),
      makeShift({ status: "no_show", date: "2026-05-22" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const medium = result.alerts.filter((a) => a.message.includes("no-show"));
    expect(medium).toHaveLength(1);
    expect(medium[0].message).toContain("2 no-show(s)");
  });

  it("generates medium alert for open shifts in next 7 days", () => {
    const shifts = [
      makeShift({ is_open_shift: true, date: "2026-05-27" }),
      makeShift({ is_open_shift: true, date: "2026-05-29" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const medium = result.alerts.filter((a) => a.message.includes("open shift(s)"));
    expect(medium).toHaveLength(1);
    expect(medium[0].message).toContain("2 open shift(s)");
  });

  it("generates low alert for high overtime (>10h)", () => {
    const shifts = [
      makeShift({ date: "2026-05-25", overtime_minutes: 360, staff_id: "staff_darren" }),
      makeShift({ date: "2026-05-26", overtime_minutes: 360, staff_id: "staff_ryan" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const low = result.alerts.filter((a) => a.severity === "low");
    expect(low).toHaveLength(1);
    expect(low[0].message).toContain("High overtime");
  });

  it("no low overtime alert when under 10h", () => {
    const shifts = [
      makeShift({ date: "2026-05-25", overtime_minutes: 120 }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const low = result.alerts.filter((a) => a.severity === "low");
    expect(low).toHaveLength(0);
  });
});

// ── Integration: Insights ───────────────────────────────────────────────────

describe("computeRotaIntelligence — insights", () => {
  it("generates critical insight for unfilled shifts today", () => {
    const shifts = [
      makeShift({ is_open_shift: true, date: TODAY }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const critical = result.insights.filter((i) => i.severity === "critical");
    expect(critical).toHaveLength(1);
    expect(critical[0].text).toContain("Reg 34");
  });

  it("generates warning insight for Working Time breach", () => {
    const shifts = [
      makeShift({ staff_id: "staff_darren", date: "2026-05-25", start_time: "00:00", end_time: "00:00", break_minutes: 0 }), // 24h
      makeShift({ staff_id: "staff_darren", date: "2026-05-26", start_time: "00:00", end_time: "00:00", break_minutes: 0 }), // 24h — but 0 to 0 = 0... use 06:00-06:00 next day approach
    ];
    // Actually let's use concrete times for >48h
    const shifts2 = [
      makeShift({ staff_id: "staff_darren", date: "2026-05-25", start_time: "06:00", end_time: "22:00", break_minutes: 0 }), // 16h
      makeShift({ staff_id: "staff_darren", date: "2026-05-26", start_time: "06:00", end_time: "22:00", break_minutes: 0 }), // 16h
      makeShift({ staff_id: "staff_darren", date: "2026-05-27", start_time: "06:00", end_time: "22:00", break_minutes: 0 }), // 16h = 48h
      makeShift({ staff_id: "staff_darren", date: "2026-05-28", start_time: "06:00", end_time: "07:00", break_minutes: 0 }), // 1h = 49h
    ];
    const result = computeRotaIntelligence({ shifts: shifts2, absences: [], staff: STAFF, today: TODAY });
    const warning = result.insights.filter((i) => i.severity === "warning" && i.text.includes("48h"));
    expect(warning).toHaveLength(1);
  });

  it("generates warning insight for many open shifts", () => {
    const shifts = [
      makeShift({ is_open_shift: true, date: "2026-05-26" }),
      makeShift({ is_open_shift: true, date: "2026-05-27" }),
      makeShift({ is_open_shift: true, date: "2026-05-28" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const warning = result.insights.filter((i) => i.severity === "warning" && i.text.includes("open shifts"));
    expect(warning).toHaveLength(1);
    expect(warning[0].text).toContain("Reg 34");
  });

  it("generates positive insight when all shifts covered today", () => {
    const shifts = [
      makeShift({ staff_id: "staff_darren", shift_type: "day", status: "in_progress" }),
      makeShift({ staff_id: "staff_anna", shift_type: "sleep_in", status: "scheduled" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("All shifts covered"));
    expect(positive).toHaveLength(1);
  });

  it("generates positive insight for no open shifts in 7 days", () => {
    const shifts = [
      makeShift({ staff_id: "staff_darren", status: "scheduled" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("No open shifts"));
    expect(positive).toHaveLength(1);
  });

  it("generates positive insight for high completion rate", () => {
    const shifts = Array.from({ length: 20 }, (_, i) => {
      const dayOffset = -(i + 1);
      const d = new Date("2026-05-25T00:00:00Z");
      d.setUTCDate(d.getUTCDate() + dayOffset);
      return makeShift({ status: "completed", date: d.toISOString().slice(0, 10) });
    });
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("completion rate"));
    expect(positive).toHaveLength(1);
    expect(positive[0].text).toContain("100%");
  });

  it("generates positive insight for no staff over 48h", () => {
    const shifts = [
      makeShift({ staff_id: "staff_darren", start_time: "08:00", end_time: "17:00", break_minutes: 60 }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("No staff exceeding"));
    expect(positive).toHaveLength(1);
  });
});

// ── Edge Cases ──────────────────────────────────────────────────────────────

describe("computeRotaIntelligence — edge cases", () => {
  it("handles empty input gracefully", () => {
    const result = computeRotaIntelligence({ shifts: [], absences: [], staff: [], today: TODAY });
    expect(result.overview.total_staff_today).toBe(0);
    expect(result.overview.shifts_today).toBe(0);
    expect(result.overview.open_shifts_7_days).toBe(0);
    expect(result.overview.total_hours_week).toBe(0);
    expect(result.overview.completion_rate).toBe(100);
    expect(result.shift_coverage).toHaveLength(0);
    expect(result.staff_hours).toHaveLength(0);
    expect(result.upcoming_gaps).toHaveLength(0);
    expect(result.alerts).toHaveLength(0);
    expect(result.insights).toHaveLength(0);
  });

  it("handles all shifts cancelled", () => {
    const shifts = [
      makeShift({ status: "cancelled" }),
      makeShift({ status: "cancelled", date: "2026-05-26" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    expect(result.overview.shifts_today).toBe(0);
    expect(result.overview.total_hours_week).toBe(0);
  });

  it("handles all no-shows (0% completion rate)", () => {
    const shifts = [
      makeShift({ status: "no_show", date: "2026-05-20" }),
      makeShift({ status: "no_show", date: "2026-05-21" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    expect(result.overview.completion_rate).toBe(0);
  });

  it("overnight shift crossing midnight calculates correctly in week context", () => {
    const shifts = [
      makeShift({ staff_id: "staff_anna", date: "2026-05-25", shift_type: "waking_night", start_time: "22:00", end_time: "07:00", break_minutes: 0 }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const anna = result.staff_hours.find((s) => s.staff_id === "staff_anna");
    expect(anna?.hours_this_week).toBe(9);
  });

  it("does not double-count open shifts in both coverage and gaps", () => {
    const shifts = [
      makeShift({ is_open_shift: true, date: TODAY, shift_type: "day", staff_id: "" }),
    ];
    const result = computeRotaIntelligence({ shifts, absences: [], staff: STAFF, today: TODAY });
    const dayCoverage = result.shift_coverage.find((c) => c.shift_type === "day");
    expect(dayCoverage?.staff_count).toBe(0);
    expect(dayCoverage?.is_covered).toBe(false);
    expect(result.upcoming_gaps).toHaveLength(1);
  });
});

// ── Full Scenario: Chamberlain House typical day ────────────────────────────────────

describe("computeRotaIntelligence — Chamberlain House scenario", () => {
  const oakShifts: ShiftInput[] = [
    makeShift({ staff_id: "staff_darren", date: TODAY, shift_type: "day", start_time: "08:00", end_time: "17:00", break_minutes: 60, status: "in_progress" }),
    makeShift({ staff_id: "staff_ryan", date: TODAY, shift_type: "day", start_time: "08:00", end_time: "17:00", break_minutes: 60, status: "in_progress" }),
    makeShift({ staff_id: "staff_edward", date: TODAY, shift_type: "long_day", start_time: "07:00", end_time: "22:00", break_minutes: 60, status: "in_progress" }),
    makeShift({ staff_id: "staff_anna", date: TODAY, shift_type: "sleep_in", start_time: "22:00", end_time: "07:00", break_minutes: 0, status: "scheduled" }),
    makeShift({ staff_id: "staff_lackson", date: TODAY, shift_type: "day", start_time: "10:00", end_time: "20:00", break_minutes: 30, status: "in_progress" }),
    makeShift({ staff_id: "staff_chervelle", date: TODAY, shift_type: "sleep_in", start_time: "22:00", end_time: "07:00", break_minutes: 0, status: "scheduled" }),
    // Tomorrow open shift
    makeShift({ staff_id: "", date: "2026-05-26", shift_type: "day", start_time: "07:00", end_time: "15:00", break_minutes: 30, is_open_shift: true, notes: "Diane called in sick" }),
    // Yesterday completed
    makeShift({ staff_id: "staff_diane", date: "2026-05-24", shift_type: "day", start_time: "08:00", end_time: "20:00", break_minutes: 60, status: "completed", overtime_minutes: 15 }),
    makeShift({ staff_id: "staff_anna", date: "2026-05-24", shift_type: "day", start_time: "07:00", end_time: "22:00", break_minutes: 60, status: "completed" }),
  ];

  it("overview reflects Chamberlain House staffing", () => {
    const result = computeRotaIntelligence({ shifts: oakShifts, absences: [], staff: STAFF, today: TODAY });
    expect(result.overview.total_staff_today).toBe(6);
    expect(result.overview.shifts_today).toBe(6);
    expect(result.overview.open_shifts_7_days).toBe(1);
  });

  it("coverage shows day, long_day, and sleep_in types", () => {
    const result = computeRotaIntelligence({ shifts: oakShifts, absences: [], staff: STAFF, today: TODAY });
    expect(result.shift_coverage.length).toBeGreaterThanOrEqual(3);
    const daySlot = result.shift_coverage.find((c) => c.shift_type === "day");
    expect(daySlot?.staff_count).toBe(3); // Darren, Ryan, Lackson
    const sleepSlot = result.shift_coverage.find((c) => c.shift_type === "sleep_in");
    expect(sleepSlot?.staff_count).toBe(2); // Anna, Chervelle
    expect(result.shift_coverage.every((c) => c.is_covered)).toBe(true);
  });

  it("generates high alert for tomorrow's open shift", () => {
    const result = computeRotaIntelligence({ shifts: oakShifts, absences: [], staff: STAFF, today: TODAY });
    const tomorrowAlerts = result.alerts.filter((a) => a.message.includes("tomorrow"));
    expect(tomorrowAlerts).toHaveLength(1);
    expect(tomorrowAlerts[0].severity).toBe("high");
  });

  it("upcoming gaps show tomorrow's open shift with reason", () => {
    const result = computeRotaIntelligence({ shifts: oakShifts, absences: [], staff: STAFF, today: TODAY });
    expect(result.upcoming_gaps).toHaveLength(1);
    expect(result.upcoming_gaps[0].date).toBe("2026-05-26");
    expect(result.upcoming_gaps[0].reason).toBe("Diane called in sick");
  });

  it("generates positive insight for all shifts covered today", () => {
    const result = computeRotaIntelligence({ shifts: oakShifts, absences: [], staff: STAFF, today: TODAY });
    const positive = result.insights.filter((i) => i.text.includes("All shifts covered"));
    expect(positive).toHaveLength(1);
  });
});
