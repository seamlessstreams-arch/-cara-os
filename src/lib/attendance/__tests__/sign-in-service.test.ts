import { describe, it, expect } from "vitest";
import {
  computeLatenessMinutes, computeOvertimeMinutes, minutesBetween, inferShiftType,
  scheduledInstant, pickTodayShift, buildSignInStatus, clockIn, clockOut,
} from "../sign-in-service";
import { db } from "@/lib/db/store";

// Unique ids/date per concern so tests don't collide with seed data or each other.
const DATE = "2026-09-15";
const at = (hhmm: string) => `${DATE}T${hhmm}:00.000Z`;

describe("pure time helpers", () => {
  it("lateness is 0 when on time or early, positive when late", () => {
    expect(computeLatenessMinutes(DATE, "08:00", at("08:00"))).toBe(0);
    expect(computeLatenessMinutes(DATE, "08:00", at("07:45"))).toBe(0);
    expect(computeLatenessMinutes(DATE, "08:00", at("08:15"))).toBe(15);
  });

  it("overtime is 0 before the end, positive after (with overnight rollover)", () => {
    expect(computeOvertimeMinutes(DATE, "16:00", at("15:30"))).toBe(0);
    expect(computeOvertimeMinutes(DATE, "16:00", at("16:20"))).toBe(20);
    // night shift 22:00 → 07:00; clocking out 07:30 is 30m overtime, not "negative"
    expect(computeOvertimeMinutes(DATE, "07:00", at("07:30"))).toBe(30);
  });

  it("minutesBetween is non-negative whole minutes", () => {
    expect(minutesBetween(at("08:00"), at("12:30"))).toBe(270);
    expect(minutesBetween(at("12:30"), at("08:00"))).toBe(0);
  });

  it("infers night vs day shift type by hour", () => {
    expect(inferShiftType(at("23:00"))).toBe("waking_night");
    expect(inferShiftType(at("03:00"))).toBe("waking_night");
    expect(inferShiftType(at("09:00"))).toBe("day");
    expect(inferShiftType(at("18:00"))).toBe("day");
  });

  it("scheduledInstant validates format", () => {
    expect(scheduledInstant("2026-09-15", "08:00")).not.toBeNull();
    expect(scheduledInstant("bad", "08:00")).toBeNull();
    expect(scheduledInstant("2026-09-15", "8am")).toBeNull();
  });
});

describe("clock in / out against a scheduled shift", () => {
  const staff = "staff_test_scheduled";
  it("clocks into a scheduled shift, computing lateness", () => {
    db.shifts.create({
      staff_id: staff, date: DATE, shift_type: "day", start_time: "08:00", end_time: "16:00",
      break_minutes: 30, actual_start: null, actual_end: null, clock_in_at: null, clock_out_at: null,
      overtime_minutes: 0, notes: null, status: "scheduled", is_open_shift: false, home_id: "home_oak",
      created_by: staff, updated_by: staff,
    });
    const r = clockIn(staff, at("08:15"));
    expect(r.ok).toBe(true);
    expect(r.created_adhoc).toBe(false);
    expect(r.late_minutes).toBe(15);
    expect(r.shift.status).toBe("in_progress");
    expect(r.shift.clock_in_at).toBe(at("08:15"));
  });

  it("reports on-shift status with the shift selected", () => {
    const s = buildSignInStatus(staff, at("10:00"));
    expect(s.on_shift).toBe(true);
    expect(s.shift?.staff_id).toBe(staff);
    expect(s.on_shift_minutes).toBe(105); // 08:15 → 10:00
    expect(s.late_minutes).toBe(15);
  });

  it("a second clock-in while on shift is idempotent", () => {
    const r = clockIn(staff, at("11:00"));
    expect(r.already_on_shift).toBe(true);
    expect(r.shift.clock_in_at).toBe(at("08:15")); // unchanged
  });

  it("clocks out, completing the shift with overtime", () => {
    const r = clockOut(staff, at("16:30"));
    expect(r.ok).toBe(true);
    expect(r.was_on_shift).toBe(true);
    expect(r.shift?.status).toBe("completed");
    expect(r.overtime_minutes).toBe(30); // 30m past 16:00
    expect(r.duration_minutes).toBe(495); // 08:15 → 16:30
  });

  it("after clock-out, no longer on shift", () => {
    expect(buildSignInStatus(staff, at("17:00")).on_shift).toBe(false);
  });
});

describe("ad-hoc sign-in (no scheduled shift)", () => {
  const staff = "staff_test_adhoc";
  it("creates an ad-hoc shift when none is scheduled", () => {
    expect(pickTodayShift(staff, at("14:00"))).toBeNull();
    const r = clockIn(staff, at("14:00"));
    expect(r.created_adhoc).toBe(true);
    expect(r.shift.status).toBe("in_progress");
    expect(r.shift.shift_type).toBe("day");
    expect(r.late_minutes).toBe(0); // start_time set to now
  });
});

describe("clock-out guard", () => {
  it("returns was_on_shift=false when not clocked in", () => {
    const r = clockOut("staff_test_never_in", at("09:00"));
    expect(r.ok).toBe(false);
    expect(r.was_on_shift).toBe(false);
    expect(r.shift).toBeNull();
  });
});
