import { describe, it, expect } from "vitest";
import {
  computeLatenessMinutes, computeOvertimeMinutes, minutesBetween, inferShiftType,
  scheduledInstant, pickTodayShift, buildSignInStatus, clockIn, clockOut, isStaffOnShift,
} from "../sign-in-service";
import { db } from "@/lib/db/store";
import { currentKioskCode } from "../presence-verification";

// Unique ids/date per concern so tests don't collide with seed data or each other.
const DATE = "2026-09-15";
const NEXT = "2026-09-16"; // the morning after an overnight shift dated DATE
const at = (hhmm: string) => `${DATE}T${hhmm}:00.000Z`;
const atNext = (hhmm: string) => `${NEXT}T${hhmm}:00.000Z`;

describe("pure time helpers", () => {
  it("lateness is 0 when on time or early, positive when late", () => {
    expect(computeLatenessMinutes(DATE, "08:00", at("08:00"))).toBe(0);
    expect(computeLatenessMinutes(DATE, "08:00", at("07:45"))).toBe(0);
    expect(computeLatenessMinutes(DATE, "08:00", at("08:15"))).toBe(15);
  });

  it("overtime is 0 before the end, positive after (day shift)", () => {
    expect(computeOvertimeMinutes(DATE, "08:00", "16:00", at("15:30"))).toBe(0);
    expect(computeOvertimeMinutes(DATE, "08:00", "16:00", at("16:20"))).toBe(20);
  });

  it("overnight overtime rolls the scheduled end to the following day", () => {
    // waking-night 22:00 → 07:00 dated DATE; clocking out 07:05 the NEXT morning is 5m over
    expect(computeOvertimeMinutes(DATE, "22:00", "07:00", atNext("07:05"))).toBe(5);
    // on time to the minute the next morning → 0 (not ~24h of phantom overtime)
    expect(computeOvertimeMinutes(DATE, "22:00", "07:00", atNext("07:00"))).toBe(0);
    // clocking out early the same evening (23:30) is not "negative" overtime
    expect(computeOvertimeMinutes(DATE, "22:00", "07:00", at("23:30"))).toBe(0);
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

describe("overnight (waking-night) shift spanning midnight", () => {
  const staff = "staff_test_overnight";
  it("clocks into a 22:00 → 07:00 shift the night before", () => {
    db.shifts.create({
      staff_id: staff, date: DATE, shift_type: "waking_night", start_time: "22:00", end_time: "07:00",
      break_minutes: 0, actual_start: null, actual_end: null, clock_in_at: null, clock_out_at: null,
      overtime_minutes: 0, notes: null, status: "scheduled", is_open_shift: false, home_id: "home_oak",
      created_by: staff, updated_by: staff,
    });
    const r = clockIn(staff, at("22:05"));
    expect(r.ok).toBe(true);
    expect(r.created_adhoc).toBe(false);
    expect(r.shift.status).toBe("in_progress");
  });

  it("is STILL on shift after midnight (the shift is stored under the start day)", () => {
    // Regression: a today-only lookup would drop the worker off shift at 00:00.
    expect(isStaffOnShift(staff, atNext("02:00"))).toBe(true);
    const s = buildSignInStatus(staff, atNext("02:00"));
    expect(s.on_shift).toBe(true);
    expect(s.shift?.staff_id).toBe(staff);
  });

  it("a clock-in after midnight is still idempotent (same open overnight shift)", () => {
    const r = clockIn(staff, atNext("02:30"));
    expect(r.already_on_shift).toBe(true);
    expect(r.shift.clock_in_at).toBe(at("22:05")); // unchanged
    expect(r.created_adhoc).toBe(false); // did NOT create a phantom new shift
  });

  it("clocks out the next morning with correct overtime (not ~24h)", () => {
    const r = clockOut(staff, atNext("07:05"));
    expect(r.ok).toBe(true);
    expect(r.was_on_shift).toBe(true);
    expect(r.shift?.status).toBe("completed");
    expect(r.overtime_minutes).toBe(5); // 5m past the 07:00 end, NOT 1445
    expect(r.duration_minutes).toBe(540); // 22:05 → 07:05 = 9h
  });

  it("after clocking out, no longer on shift", () => {
    expect(isStaffOnShift(staff, atNext("08:00"))).toBe(false);
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

describe("presence-verified clock-in (Phase 5)", () => {
  it("records a verified kiosk sign-in (home defaults to home_oak)", () => {
    const staff = "staff_test_kiosk";
    const code = currentKioskCode("home_oak", at("14:00"));
    const r = clockIn(staff, at("14:00"), { verification: { method: "kiosk", code } });
    expect(r.presence?.method).toBe("kiosk");
    expect(r.presence?.verified).toBe(true);
    const recs = db.signInVerifications.findByStaff(staff);
    expect(recs).toHaveLength(1);
    expect(recs[0].verified).toBe(true);
    // PRIVACY: the stored record carries no coordinates
    expect(JSON.stringify(recs[0])).not.toMatch(/lat|lng|coord/);
  });

  it("records a manual sign-in as unverified", () => {
    const staff = "staff_test_manual";
    const r = clockIn(staff, at("14:00"), { verification: { method: "manual" } });
    expect(r.presence?.verified).toBe(false);
    expect(db.signInVerifications.findByStaff(staff)[0].method).toBe("manual");
  });

  it("a geofence clock-in stores band but never coordinates", () => {
    const staff = "staff_test_geo";
    const r = clockIn(staff, at("14:00"), { verification: { method: "geofence", coords: { lat: 53.4808, lng: -2.2426 } } });
    expect(r.presence?.method).toBe("geofence");
    expect(r.presence?.verified).toBe(true);
    const rec = db.signInVerifications.findByStaff(staff)[0];
    expect(rec.band).toBe("on_site");
    expect(JSON.stringify(rec)).not.toMatch(/53\.48|-2\.24|lat|lng|coord/);
  });

  it("surfaces the verification in the sign-in status", () => {
    const staff = "staff_test_status_presence";
    const code = currentKioskCode("home_oak", at("14:00"));
    clockIn(staff, at("14:00"), { verification: { method: "kiosk", code } });
    const s = buildSignInStatus(staff, at("14:30"));
    expect(s.presence?.verified).toBe(true);
    expect(s.presence?.method).toBe("kiosk");
  });

  it("clock-in without verification leaves presence null and stores no record", () => {
    const staff = "staff_test_noverify";
    const r = clockIn(staff, at("14:00"));
    expect(r.presence).toBeNull();
    expect(db.signInVerifications.findByStaff(staff)).toHaveLength(0);
  });
});

// ── London vs UTC at the date boundary ───────────────────────────────────────
// shift.date is written with todayStr(), which is londonDateStr(). "Today" was
// derived by slicing the first ten characters off an ISO instant, which is the
// UTC date. During BST those disagree between 00:00 and 01:00 London time, and
// a staff member genuinely on shift was told "You can only access this while on
// shift. Clock in to restore access."
//
// 2026-06-15T23:30:00Z is 00:30 on 2026-06-16 in London — inside that window.
describe("on-shift lookup at the London/UTC date boundary", () => {
  const NOW = "2026-06-15T23:30:00.000Z"; // 00:30 BST on 2026-06-16
  const LONDON_TODAY = "2026-06-16";      // what todayStr() would return
  const UTC_TODAY = "2026-06-15";         // what slicing the ISO string gives
  const staff = "staff_boundary_bst";

  it("the two dates really do differ at this instant (else the test proves nothing)", () => {
    expect(new Date(NOW).toISOString().slice(0, 10)).toBe(UTC_TODAY);
    expect(LONDON_TODAY).not.toBe(UTC_TODAY);
  });

  it("counts a staff member on a shift filed under London's today", () => {
    db.shifts.create({
      staff_id: staff, date: LONDON_TODAY, shift_type: "waking_night", start_time: "22:00", end_time: "07:00",
      break_minutes: 0, actual_start: null, actual_end: null, clock_in_at: `${LONDON_TODAY}T00:05:00.000Z`,
      clock_out_at: null, overtime_minutes: 0, notes: null, status: "in_progress", is_open_shift: false,
      home_id: "home_oak", created_by: staff, updated_by: staff,
    });
    // Before the fix this was false: the shift was filed under 2026-06-16 and
    // looked up under 2026-06-15, so it was invisible.
    expect(isStaffOnShift(staff, NOW)).toBe(true);
  });

  it("still finds an overnight shift that began on London's yesterday", () => {
    const other = "staff_boundary_overnight";
    db.shifts.create({
      staff_id: other, date: "2026-06-15", shift_type: "waking_night", start_time: "22:00", end_time: "07:00",
      break_minutes: 0, actual_start: null, actual_end: null, clock_in_at: "2026-06-15T21:00:00.000Z",
      clock_out_at: null, overtime_minutes: 0, notes: null, status: "in_progress", is_open_shift: false,
      home_id: "home_oak", created_by: other, updated_by: other,
    });
    expect(isStaffOnShift(other, NOW)).toBe(true);
  });
});
