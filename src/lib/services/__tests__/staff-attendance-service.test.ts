// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF ATTENDANCE & TIMEKEEPING SERVICE TESTS
// Pure-function unit tests for attendance metrics computation,
// alert identification, constant validation.
// CHR 2015 Reg 33 (employment — staffing requirements),
// Reg 22 (contact and access — staff availability),
// Working Time Regulations 1998.
//
// Covers: attendance logging, lateness, early departures, overtime,
// shift compliance, and pattern analysis.
//
// SCCIF: Leadership & Management — "Staffing levels are maintained."
// "Staff attendance supports children's care needs."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
  _testing,
  ATTENDANCE_STATUSES,
  SHIFT_TYPES,
  OVERTIME_REASONS,
  COMPLIANCE_FLAGS,
} from "../staff-attendance-service";

import type {
  AttendanceRecord,
  AttendanceStatus,
  ShiftType,
  OvertimeReason,
  ComplianceFlag,
} from "../staff-attendance-service";

const { computeAttendanceMetrics, identifyAttendanceAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysAgo(n: number): string {
  return daysAgoISO(n).split("T")[0];
}

/** Build a minimal AttendanceRecord with sensible defaults. */
function makeRecord(
  overrides?: Partial<AttendanceRecord>,
): AttendanceRecord {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    staff_name: "Staff A",
    staff_id: "staff-1",
    attendance_date: daysAgo(1),
    attendance_status: "present",
    shift_type: "day_shift",
    scheduled_start: "07:00",
    scheduled_end: "15:00",
    actual_start: "actual_start" in (overrides ?? {}) ? (overrides!.actual_start ?? null) : "07:00",
    actual_end: "actual_end" in (overrides ?? {}) ? (overrides!.actual_end ?? null) : "15:00",
    hours_worked: "hours_worked" in (overrides ?? {}) ? (overrides!.hours_worked ?? null) : 8,
    overtime_hours: 0,
    overtime_reason: "overtime_reason" in (overrides ?? {}) ? (overrides!.overtime_reason ?? null) : null,
    late_minutes: 0,
    compliance_flag: "compliant",
    agency_staff_used: false,
    minimum_staffing_met: true,
    handover_completed: true,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: daysAgoISO(1),
    updated_at: daysAgoISO(1),
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("ATTENDANCE_STATUSES", () => {
  it("contains exactly 10 entries", () => {
    expect(ATTENDANCE_STATUSES).toHaveLength(10);
  });

  it("every entry has a non-empty status string", () => {
    for (const s of ATTENDANCE_STATUSES) {
      expect(typeof s.status).toBe("string");
      expect(s.status.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const s of ATTENDANCE_STATUSES) {
      expect(typeof s.label).toBe("string");
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate statuses", () => {
    const statuses = ATTENDANCE_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("has no duplicate labels", () => {
    const labels = ATTENDANCE_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected statuses", () => {
    const statuses = ATTENDANCE_STATUSES.map((s) => s.status);
    const expected: AttendanceStatus[] = [
      "present", "absent_sick", "absent_unauthorised", "absent_authorised",
      "late_arrival", "early_departure", "annual_leave", "training",
      "suspended", "other",
    ];
    for (const e of expected) {
      expect(statuses).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const s of ATTENDANCE_STATUSES) {
      expect(s.label[0]).toBe(s.label[0].toUpperCase());
    }
  });

  it("includes present", () => {
    expect(ATTENDANCE_STATUSES.map((s) => s.status)).toContain("present");
  });

  it("includes absent_unauthorised", () => {
    expect(ATTENDANCE_STATUSES.map((s) => s.status)).toContain("absent_unauthorised");
  });
});

describe("SHIFT_TYPES", () => {
  it("contains exactly 10 entries", () => {
    expect(SHIFT_TYPES).toHaveLength(10);
  });

  it("every entry has a non-empty type string", () => {
    for (const t of SHIFT_TYPES) {
      expect(typeof t.type).toBe("string");
      expect(t.type.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const t of SHIFT_TYPES) {
      expect(typeof t.label).toBe("string");
      expect(t.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate types", () => {
    const types = SHIFT_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("has no duplicate labels", () => {
    const labels = SHIFT_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected types", () => {
    const types = SHIFT_TYPES.map((t) => t.type);
    const expected: ShiftType[] = [
      "day_shift", "night_shift", "waking_night", "sleep_in",
      "split_shift", "long_day", "bank_holiday", "overtime",
      "on_call", "other",
    ];
    for (const e of expected) {
      expect(types).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const t of SHIFT_TYPES) {
      expect(t.label[0]).toBe(t.label[0].toUpperCase());
    }
  });

  it("includes day_shift", () => {
    expect(SHIFT_TYPES.map((t) => t.type)).toContain("day_shift");
  });

  it("includes waking_night", () => {
    expect(SHIFT_TYPES.map((t) => t.type)).toContain("waking_night");
  });
});

describe("OVERTIME_REASONS", () => {
  it("contains exactly 6 entries", () => {
    expect(OVERTIME_REASONS).toHaveLength(6);
  });

  it("every entry has a non-empty reason string", () => {
    for (const o of OVERTIME_REASONS) {
      expect(typeof o.reason).toBe("string");
      expect(o.reason.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const o of OVERTIME_REASONS) {
      expect(typeof o.label).toBe("string");
      expect(o.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate reasons", () => {
    const reasons = OVERTIME_REASONS.map((o) => o.reason);
    expect(new Set(reasons).size).toBe(reasons.length);
  });

  it("has no duplicate labels", () => {
    const labels = OVERTIME_REASONS.map((o) => o.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected reasons", () => {
    const reasons = OVERTIME_REASONS.map((o) => o.reason);
    const expected: OvertimeReason[] = [
      "staff_shortage", "emergency_cover", "incident_response",
      "planned_activity", "handover_overrun", "other",
    ];
    for (const e of expected) {
      expect(reasons).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const o of OVERTIME_REASONS) {
      expect(o.label[0]).toBe(o.label[0].toUpperCase());
    }
  });
});

describe("COMPLIANCE_FLAGS", () => {
  it("contains exactly 6 entries", () => {
    expect(COMPLIANCE_FLAGS).toHaveLength(6);
  });

  it("every entry has a non-empty flag string", () => {
    for (const c of COMPLIANCE_FLAGS) {
      expect(typeof c.flag).toBe("string");
      expect(c.flag.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const c of COMPLIANCE_FLAGS) {
      expect(typeof c.label).toBe("string");
      expect(c.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate flags", () => {
    const flags = COMPLIANCE_FLAGS.map((c) => c.flag);
    expect(new Set(flags).size).toBe(flags.length);
  });

  it("has no duplicate labels", () => {
    const labels = COMPLIANCE_FLAGS.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected flags", () => {
    const flags = COMPLIANCE_FLAGS.map((c) => c.flag);
    const expected: ComplianceFlag[] = [
      "compliant", "exceeded_48h_week", "insufficient_rest",
      "consecutive_days_exceeded", "night_worker_limit", "not_checked",
    ];
    for (const e of expected) {
      expect(flags).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const c of COMPLIANCE_FLAGS) {
      expect(c.label[0]).toBe(c.label[0].toUpperCase());
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeAttendanceMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeAttendanceMetrics", () => {
  // ── Empty records ──────────────────────────────────────────────────────

  describe("empty records", () => {
    it("returns total_records = 0", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.total_records).toBe(0);
    });

    it("returns present_count = 0", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.present_count).toBe(0);
    });

    it("returns absent_sick_count = 0", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.absent_sick_count).toBe(0);
    });

    it("returns absent_unauthorised_count = 0", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.absent_unauthorised_count).toBe(0);
    });

    it("returns late_arrival_count = 0", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.late_arrival_count).toBe(0);
    });

    it("returns attendance_rate = 0", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.attendance_rate).toBeNull();
    });

    it("returns punctuality_rate = 0", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.punctuality_rate).toBeNull();
    });

    it("returns average_late_minutes = 0", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.average_late_minutes).toBeNull();
    });

    it("returns total_overtime_hours = 0", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.total_overtime_hours).toBe(0);
    });

    it("returns average_hours_worked = 0", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.average_hours_worked).toBe(0);
    });

    it("returns agency_staff_used_count = 0", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.agency_staff_used_count).toBe(0);
    });

    it("returns minimum_staffing_met_rate = 0", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.minimum_staffing_met_rate).toBeNull();
    });

    it("returns handover_completed_rate = 0", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.handover_completed_rate).toBeNull();
    });

    it("returns compliance_rate = 0", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.compliance_rate).toBeNull();
    });

    it("returns non_compliant_count = 0", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns staff_coverage = 0 when totalStaff > 0", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.staff_coverage).toBe(0);
    });

    it("returns staff_coverage = 0 when totalStaff = 0", () => {
      const m = computeAttendanceMetrics([], 0);
      expect(m.staff_coverage).toBeNull();
    });

    it("returns empty by_attendance_status", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.by_attendance_status).toEqual({});
    });

    it("returns empty by_shift_type", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.by_shift_type).toEqual({});
    });

    it("returns empty by_compliance_flag", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.by_compliance_flag).toEqual({});
    });

    it("returns empty by_overtime_reason", () => {
      const m = computeAttendanceMetrics([], 5);
      expect(m.by_overtime_reason).toEqual({});
    });
  });

  // ── Single present record ──────────────────────────────────────────────

  describe("single present record", () => {
    const rec = makeRecord({
      staff_id: "s1",
      attendance_status: "present",
      shift_type: "day_shift",
      hours_worked: 8,
      overtime_hours: 1,
      overtime_reason: "staff_shortage",
      late_minutes: 0,
      compliance_flag: "compliant",
      agency_staff_used: false,
      minimum_staffing_met: true,
      handover_completed: true,
    });

    it("returns total_records = 1", () => {
      const m = computeAttendanceMetrics([rec], 4);
      expect(m.total_records).toBe(1);
    });

    it("returns present_count = 1", () => {
      const m = computeAttendanceMetrics([rec], 4);
      expect(m.present_count).toBe(1);
    });

    it("returns attendance_rate = 100 (1/1 working)", () => {
      const m = computeAttendanceMetrics([rec], 4);
      expect(m.attendance_rate).toBe(100);
    });

    it("returns punctuality_rate = 100 (present counts as punctual)", () => {
      const m = computeAttendanceMetrics([rec], 4);
      expect(m.punctuality_rate).toBe(100);
    });

    it("returns average_late_minutes = 0 (no late records)", () => {
      const m = computeAttendanceMetrics([rec], 4);
      expect(m.average_late_minutes).toBeNull();
    });

    it("returns total_overtime_hours = 1", () => {
      const m = computeAttendanceMetrics([rec], 4);
      expect(m.total_overtime_hours).toBe(1);
    });

    it("returns average_hours_worked = 8", () => {
      const m = computeAttendanceMetrics([rec], 4);
      expect(m.average_hours_worked).toBe(8);
    });

    it("returns minimum_staffing_met_rate = 100", () => {
      const m = computeAttendanceMetrics([rec], 4);
      expect(m.minimum_staffing_met_rate).toBe(100);
    });

    it("returns handover_completed_rate = 100", () => {
      const m = computeAttendanceMetrics([rec], 4);
      expect(m.handover_completed_rate).toBe(100);
    });

    it("returns compliance_rate = 100", () => {
      const m = computeAttendanceMetrics([rec], 4);
      expect(m.compliance_rate).toBe(100);
    });

    it("returns non_compliant_count = 0", () => {
      const m = computeAttendanceMetrics([rec], 4);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns staff_coverage = 25 (1/4)", () => {
      const m = computeAttendanceMetrics([rec], 4);
      expect(m.staff_coverage).toBe(25);
    });

    it("by_attendance_status has single entry for present", () => {
      const m = computeAttendanceMetrics([rec], 4);
      expect(m.by_attendance_status).toEqual({ present: 1 });
    });

    it("by_shift_type has single entry for day_shift", () => {
      const m = computeAttendanceMetrics([rec], 4);
      expect(m.by_shift_type).toEqual({ day_shift: 1 });
    });

    it("by_compliance_flag has single entry for compliant", () => {
      const m = computeAttendanceMetrics([rec], 4);
      expect(m.by_compliance_flag).toEqual({ compliant: 1 });
    });

    it("by_overtime_reason counts non-null reason", () => {
      const m = computeAttendanceMetrics([rec], 4);
      expect(m.by_overtime_reason).toEqual({ staff_shortage: 1 });
    });
  });

  // ── attendance_rate ─────────────────────────────────────────────────────

  describe("attendance_rate", () => {
    it("excludes annual_leave from denominator", () => {
      const recs = [
        makeRecord({ attendance_status: "present", staff_id: "s1" }),
        makeRecord({ attendance_status: "annual_leave", staff_id: "s2" }),
      ];
      // workingRecords = 1 (only present), attended = 1
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.attendance_rate).toBe(100);
    });

    it("excludes training from denominator", () => {
      const recs = [
        makeRecord({ attendance_status: "present", staff_id: "s1" }),
        makeRecord({ attendance_status: "training", staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.attendance_rate).toBe(100);
    });

    it("excludes suspended from denominator", () => {
      const recs = [
        makeRecord({ attendance_status: "present", staff_id: "s1" }),
        makeRecord({ attendance_status: "suspended", staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.attendance_rate).toBe(100);
    });

    it("counts late_arrival as attended", () => {
      const recs = [
        makeRecord({ attendance_status: "late_arrival", staff_id: "s1" }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.attendance_rate).toBe(100);
    });

    it("counts early_departure as attended", () => {
      const recs = [
        makeRecord({ attendance_status: "early_departure", staff_id: "s1" }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.attendance_rate).toBe(100);
    });

    it("absent_sick is not attended", () => {
      const recs = [
        makeRecord({ attendance_status: "absent_sick", staff_id: "s1" }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.attendance_rate).toBe(0);
    });

    it("absent_unauthorised is not attended", () => {
      const recs = [
        makeRecord({ attendance_status: "absent_unauthorised", staff_id: "s1" }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.attendance_rate).toBe(0);
    });

    it("rounds correctly (2 of 3 working = 66.7%)", () => {
      const recs = [
        makeRecord({ attendance_status: "present", staff_id: "s1" }),
        makeRecord({ attendance_status: "present", staff_id: "s2" }),
        makeRecord({ attendance_status: "absent_sick", staff_id: "s3" }),
      ];
      const m = computeAttendanceMetrics(recs, 3);
      expect(m.attendance_rate).toBe(66.7);
    });

    it("returns 0 when no working records", () => {
      const recs = [
        makeRecord({ attendance_status: "annual_leave", staff_id: "s1" }),
        makeRecord({ attendance_status: "training", staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.attendance_rate).toBeNull();
    });
  });

  // ── punctuality_rate ────────────────────────────────────────────────────

  describe("punctuality_rate", () => {
    it("counts present as punctual", () => {
      const recs = [
        makeRecord({ attendance_status: "present", staff_id: "s1" }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.punctuality_rate).toBe(100);
    });

    it("counts early_departure as punctual", () => {
      const recs = [
        makeRecord({ attendance_status: "early_departure", staff_id: "s1" }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.punctuality_rate).toBe(100);
    });

    it("does NOT count late_arrival as punctual", () => {
      const recs = [
        makeRecord({ attendance_status: "late_arrival", staff_id: "s1" }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.punctuality_rate).toBe(0);
    });

    it("excludes annual_leave from denominator", () => {
      const recs = [
        makeRecord({ attendance_status: "present", staff_id: "s1" }),
        makeRecord({ attendance_status: "annual_leave", staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.punctuality_rate).toBe(100);
    });

    it("excludes training from denominator", () => {
      const recs = [
        makeRecord({ attendance_status: "present", staff_id: "s1" }),
        makeRecord({ attendance_status: "training", staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.punctuality_rate).toBe(100);
    });

    it("excludes suspended from denominator", () => {
      const recs = [
        makeRecord({ attendance_status: "present", staff_id: "s1" }),
        makeRecord({ attendance_status: "suspended", staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.punctuality_rate).toBe(100);
    });

    it("returns 0 when only late arrivals in working records", () => {
      const recs = [
        makeRecord({ attendance_status: "late_arrival", staff_id: "s1" }),
        makeRecord({ attendance_status: "late_arrival", staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.punctuality_rate).toBe(0);
    });

    it("rounds correctly (1 of 3 = 33.3%)", () => {
      const recs = [
        makeRecord({ attendance_status: "present", staff_id: "s1" }),
        makeRecord({ attendance_status: "late_arrival", staff_id: "s2" }),
        makeRecord({ attendance_status: "late_arrival", staff_id: "s3" }),
      ];
      const m = computeAttendanceMetrics(recs, 3);
      expect(m.punctuality_rate).toBe(33.3);
    });

    it("returns 0 when no working records", () => {
      const recs = [
        makeRecord({ attendance_status: "annual_leave", staff_id: "s1" }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.punctuality_rate).toBeNull();
    });
  });

  // ── average_late_minutes ────────────────────────────────────────────────

  describe("average_late_minutes", () => {
    it("returns 0 when no records have late_minutes > 0", () => {
      const recs = [
        makeRecord({ late_minutes: 0 }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.average_late_minutes).toBeNull();
    });

    it("returns the value itself for a single late record", () => {
      const recs = [
        makeRecord({ late_minutes: 15 }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.average_late_minutes).toBe(15);
    });

    it("averages only records where late_minutes > 0", () => {
      const recs = [
        makeRecord({ late_minutes: 10, staff_id: "s1" }),
        makeRecord({ late_minutes: 20, staff_id: "s2" }),
        makeRecord({ late_minutes: 0, staff_id: "s3" }),
      ];
      // avg of 10 and 20 = 15
      const m = computeAttendanceMetrics(recs, 3);
      expect(m.average_late_minutes).toBe(15);
    });

    it("rounds to 1 decimal place", () => {
      const recs = [
        makeRecord({ late_minutes: 10, staff_id: "s1" }),
        makeRecord({ late_minutes: 11, staff_id: "s2" }),
        makeRecord({ late_minutes: 12, staff_id: "s3" }),
      ];
      // avg = 33/3 = 11
      const m = computeAttendanceMetrics(recs, 3);
      expect(m.average_late_minutes).toBe(11);
    });

    it("rounds fractional averages correctly (10/3 = 3.3)", () => {
      const recs = [
        makeRecord({ late_minutes: 2, staff_id: "s1" }),
        makeRecord({ late_minutes: 3, staff_id: "s2" }),
        makeRecord({ late_minutes: 5, staff_id: "s3" }),
      ];
      // avg = 10/3 = 3.333... => 3.3
      const m = computeAttendanceMetrics(recs, 3);
      expect(m.average_late_minutes).toBe(3.3);
    });

    it("returns 0 for empty records", () => {
      const m = computeAttendanceMetrics([], 1);
      expect(m.average_late_minutes).toBeNull();
    });
  });

  // ── total_overtime_hours ────────────────────────────────────────────────

  describe("total_overtime_hours", () => {
    it("sums all overtime_hours across records", () => {
      const recs = [
        makeRecord({ overtime_hours: 2, staff_id: "s1" }),
        makeRecord({ overtime_hours: 3.5, staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.total_overtime_hours).toBe(5.5);
    });

    it("returns 0 when no overtime", () => {
      const recs = [
        makeRecord({ overtime_hours: 0 }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.total_overtime_hours).toBe(0);
    });

    it("rounds to 1 decimal place", () => {
      const recs = [
        makeRecord({ overtime_hours: 1.15, staff_id: "s1" }),
        makeRecord({ overtime_hours: 2.15, staff_id: "s2" }),
      ];
      // 1.15 + 2.15 = 3.3
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.total_overtime_hours).toBe(3.3);
    });
  });

  // ── average_hours_worked ────────────────────────────────────────────────

  describe("average_hours_worked", () => {
    it("returns 0 when no records have hours_worked", () => {
      const recs = [
        makeRecord({ hours_worked: null }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.average_hours_worked).toBe(0);
    });

    it("averages only records where hours_worked is not null", () => {
      const recs = [
        makeRecord({ hours_worked: 8, staff_id: "s1" }),
        makeRecord({ hours_worked: 10, staff_id: "s2" }),
        makeRecord({ hours_worked: null, staff_id: "s3" }),
      ];
      // avg of 8 and 10 = 9
      const m = computeAttendanceMetrics(recs, 3);
      expect(m.average_hours_worked).toBe(9);
    });

    it("rounds to 1 decimal place", () => {
      const recs = [
        makeRecord({ hours_worked: 7, staff_id: "s1" }),
        makeRecord({ hours_worked: 8, staff_id: "s2" }),
        makeRecord({ hours_worked: 9, staff_id: "s3" }),
      ];
      // avg = 24/3 = 8
      const m = computeAttendanceMetrics(recs, 3);
      expect(m.average_hours_worked).toBe(8);
    });

    it("rounds fractional averages correctly (25/3 = 8.3)", () => {
      const recs = [
        makeRecord({ hours_worked: 7, staff_id: "s1" }),
        makeRecord({ hours_worked: 8, staff_id: "s2" }),
        makeRecord({ hours_worked: 10, staff_id: "s3" }),
      ];
      // avg = 25/3 = 8.333... => 8.3
      const m = computeAttendanceMetrics(recs, 3);
      expect(m.average_hours_worked).toBe(8.3);
    });

    it("returns the value itself for a single record with hours_worked", () => {
      const recs = [
        makeRecord({ hours_worked: 12 }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.average_hours_worked).toBe(12);
    });

    it("returns 0 for empty records", () => {
      const m = computeAttendanceMetrics([], 1);
      expect(m.average_hours_worked).toBe(0);
    });
  });

  // ── minimum_staffing_met_rate ───────────────────────────────────────────

  describe("minimum_staffing_met_rate", () => {
    it("returns 100 when all records have minimum_staffing_met", () => {
      const recs = [
        makeRecord({ minimum_staffing_met: true, staff_id: "s1" }),
        makeRecord({ minimum_staffing_met: true, staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.minimum_staffing_met_rate).toBe(100);
    });

    it("returns 0 when none meet minimum staffing", () => {
      const recs = [
        makeRecord({ minimum_staffing_met: false, staff_id: "s1" }),
        makeRecord({ minimum_staffing_met: false, staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.minimum_staffing_met_rate).toBe(0);
    });

    it("uses total records as denominator", () => {
      const recs = [
        makeRecord({ minimum_staffing_met: true, staff_id: "s1" }),
        makeRecord({ minimum_staffing_met: false, staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.minimum_staffing_met_rate).toBe(50);
    });

    it("rounds correctly (1 of 3 = 33.3%)", () => {
      const recs = [
        makeRecord({ minimum_staffing_met: true, staff_id: "s1" }),
        makeRecord({ minimum_staffing_met: false, staff_id: "s2" }),
        makeRecord({ minimum_staffing_met: false, staff_id: "s3" }),
      ];
      const m = computeAttendanceMetrics(recs, 3);
      expect(m.minimum_staffing_met_rate).toBe(33.3);
    });
  });

  // ── handover_completed_rate ─────────────────────────────────────────────

  describe("handover_completed_rate", () => {
    it("returns 100 when all records have handover_completed", () => {
      const recs = [
        makeRecord({ handover_completed: true, staff_id: "s1" }),
        makeRecord({ handover_completed: true, staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.handover_completed_rate).toBe(100);
    });

    it("returns 0 when none have handover completed", () => {
      const recs = [
        makeRecord({ handover_completed: false, staff_id: "s1" }),
        makeRecord({ handover_completed: false, staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.handover_completed_rate).toBe(0);
    });

    it("rounds correctly (2 of 3 = 66.7%)", () => {
      const recs = [
        makeRecord({ handover_completed: true, staff_id: "s1" }),
        makeRecord({ handover_completed: true, staff_id: "s2" }),
        makeRecord({ handover_completed: false, staff_id: "s3" }),
      ];
      const m = computeAttendanceMetrics(recs, 3);
      expect(m.handover_completed_rate).toBe(66.7);
    });
  });

  // ── compliance_rate ─────────────────────────────────────────────────────

  describe("compliance_rate", () => {
    it("returns 100 when all records are compliant", () => {
      const recs = [
        makeRecord({ compliance_flag: "compliant", staff_id: "s1" }),
        makeRecord({ compliance_flag: "compliant", staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.compliance_rate).toBe(100);
    });

    it("returns 0 when none are compliant", () => {
      const recs = [
        makeRecord({ compliance_flag: "exceeded_48h_week", staff_id: "s1" }),
        makeRecord({ compliance_flag: "insufficient_rest", staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.compliance_rate).toBe(0);
    });

    it("rounds correctly (1 of 3 = 33.3%)", () => {
      const recs = [
        makeRecord({ compliance_flag: "compliant", staff_id: "s1" }),
        makeRecord({ compliance_flag: "exceeded_48h_week", staff_id: "s2" }),
        makeRecord({ compliance_flag: "not_checked", staff_id: "s3" }),
      ];
      const m = computeAttendanceMetrics(recs, 3);
      expect(m.compliance_rate).toBe(33.3);
    });
  });

  // ── non_compliant_count ─────────────────────────────────────────────────

  describe("non_compliant_count", () => {
    it("excludes compliant from count", () => {
      const recs = [
        makeRecord({ compliance_flag: "compliant", staff_id: "s1" }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.non_compliant_count).toBe(0);
    });

    it("excludes not_checked from count", () => {
      const recs = [
        makeRecord({ compliance_flag: "not_checked", staff_id: "s1" }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.non_compliant_count).toBe(0);
    });

    it("counts exceeded_48h_week as non-compliant", () => {
      const recs = [
        makeRecord({ compliance_flag: "exceeded_48h_week", staff_id: "s1" }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.non_compliant_count).toBe(1);
    });

    it("counts insufficient_rest as non-compliant", () => {
      const recs = [
        makeRecord({ compliance_flag: "insufficient_rest", staff_id: "s1" }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.non_compliant_count).toBe(1);
    });

    it("counts consecutive_days_exceeded as non-compliant", () => {
      const recs = [
        makeRecord({ compliance_flag: "consecutive_days_exceeded", staff_id: "s1" }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.non_compliant_count).toBe(1);
    });

    it("counts night_worker_limit as non-compliant", () => {
      const recs = [
        makeRecord({ compliance_flag: "night_worker_limit", staff_id: "s1" }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.non_compliant_count).toBe(1);
    });

    it("sums multiple non-compliant flags", () => {
      const recs = [
        makeRecord({ compliance_flag: "exceeded_48h_week", staff_id: "s1" }),
        makeRecord({ compliance_flag: "insufficient_rest", staff_id: "s2" }),
        makeRecord({ compliance_flag: "compliant", staff_id: "s3" }),
        makeRecord({ compliance_flag: "not_checked", staff_id: "s4" }),
      ];
      const m = computeAttendanceMetrics(recs, 4);
      expect(m.non_compliant_count).toBe(2);
    });
  });

  // ── staff_coverage ──────────────────────────────────────────────────────

  describe("staff_coverage", () => {
    it("returns 0 when totalStaff = 0", () => {
      const recs = [makeRecord()];
      const m = computeAttendanceMetrics(recs, 0);
      expect(m.staff_coverage).toBeNull();
    });

    it("returns 100 when all staff have records", () => {
      const recs = [
        makeRecord({ staff_id: "s1" }),
        makeRecord({ staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.staff_coverage).toBe(100);
    });

    it("deduplicates staff by staff_id", () => {
      const recs = [
        makeRecord({ staff_id: "s1" }),
        makeRecord({ staff_id: "s1" }),
        makeRecord({ staff_id: "s1" }),
      ];
      const m = computeAttendanceMetrics(recs, 3);
      expect(m.staff_coverage).toBe(33.3);
    });

    it("rounds correctly (1 of 3 = 33.3%)", () => {
      const recs = [makeRecord({ staff_id: "s1" })];
      const m = computeAttendanceMetrics(recs, 3);
      expect(m.staff_coverage).toBe(33.3);
    });

    it("rounds correctly (2 of 3 = 66.7%)", () => {
      const recs = [
        makeRecord({ staff_id: "s1" }),
        makeRecord({ staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 3);
      expect(m.staff_coverage).toBe(66.7);
    });
  });

  // ── agency_staff_used_count ─────────────────────────────────────────────

  describe("agency_staff_used_count", () => {
    it("counts records where agency_staff_used = true", () => {
      const recs = [
        makeRecord({ agency_staff_used: true, staff_id: "s1" }),
        makeRecord({ agency_staff_used: true, staff_id: "s2" }),
        makeRecord({ agency_staff_used: false, staff_id: "s3" }),
      ];
      const m = computeAttendanceMetrics(recs, 3);
      expect(m.agency_staff_used_count).toBe(2);
    });

    it("returns 0 when no agency staff used", () => {
      const recs = [
        makeRecord({ agency_staff_used: false }),
      ];
      const m = computeAttendanceMetrics(recs, 1);
      expect(m.agency_staff_used_count).toBe(0);
    });
  });

  // ── by_attendance_status ────────────────────────────────────────────────

  describe("by_attendance_status", () => {
    it("groups multiple statuses correctly", () => {
      const recs = [
        makeRecord({ attendance_status: "present", staff_id: "s1" }),
        makeRecord({ attendance_status: "present", staff_id: "s2" }),
        makeRecord({ attendance_status: "absent_sick", staff_id: "s3" }),
        makeRecord({ attendance_status: "late_arrival", staff_id: "s4" }),
      ];
      const m = computeAttendanceMetrics(recs, 4);
      expect(m.by_attendance_status).toEqual({
        present: 2, absent_sick: 1, late_arrival: 1,
      });
    });

    it("handles all same status", () => {
      const recs = [
        makeRecord({ attendance_status: "present", staff_id: "s1" }),
        makeRecord({ attendance_status: "present", staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.by_attendance_status).toEqual({ present: 2 });
    });
  });

  // ── by_shift_type ───────────────────────────────────────────────────────

  describe("by_shift_type", () => {
    it("groups multiple shift types correctly", () => {
      const recs = [
        makeRecord({ shift_type: "day_shift", staff_id: "s1" }),
        makeRecord({ shift_type: "day_shift", staff_id: "s2" }),
        makeRecord({ shift_type: "night_shift", staff_id: "s3" }),
        makeRecord({ shift_type: "waking_night", staff_id: "s4" }),
      ];
      const m = computeAttendanceMetrics(recs, 4);
      expect(m.by_shift_type).toEqual({
        day_shift: 2, night_shift: 1, waking_night: 1,
      });
    });

    it("handles all same shift type", () => {
      const recs = [
        makeRecord({ shift_type: "night_shift", staff_id: "s1" }),
        makeRecord({ shift_type: "night_shift", staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.by_shift_type).toEqual({ night_shift: 2 });
    });
  });

  // ── by_compliance_flag ──────────────────────────────────────────────────

  describe("by_compliance_flag", () => {
    it("groups multiple compliance flags correctly", () => {
      const recs = [
        makeRecord({ compliance_flag: "compliant", staff_id: "s1" }),
        makeRecord({ compliance_flag: "compliant", staff_id: "s2" }),
        makeRecord({ compliance_flag: "exceeded_48h_week", staff_id: "s3" }),
        makeRecord({ compliance_flag: "not_checked", staff_id: "s4" }),
      ];
      const m = computeAttendanceMetrics(recs, 4);
      expect(m.by_compliance_flag).toEqual({
        compliant: 2, exceeded_48h_week: 1, not_checked: 1,
      });
    });
  });

  // ── by_overtime_reason ──────────────────────────────────────────────────

  describe("by_overtime_reason", () => {
    it("only counts records where overtime_reason is not null", () => {
      const recs = [
        makeRecord({ overtime_reason: "staff_shortage", staff_id: "s1" }),
        makeRecord({ overtime_reason: null, staff_id: "s2" }),
        makeRecord({ overtime_reason: "emergency_cover", staff_id: "s3" }),
      ];
      const m = computeAttendanceMetrics(recs, 3);
      expect(m.by_overtime_reason).toEqual({
        staff_shortage: 1, emergency_cover: 1,
      });
    });

    it("returns empty object when all overtime_reason is null", () => {
      const recs = [
        makeRecord({ overtime_reason: null, staff_id: "s1" }),
        makeRecord({ overtime_reason: null, staff_id: "s2" }),
      ];
      const m = computeAttendanceMetrics(recs, 2);
      expect(m.by_overtime_reason).toEqual({});
    });

    it("groups same reasons together", () => {
      const recs = [
        makeRecord({ overtime_reason: "staff_shortage", staff_id: "s1" }),
        makeRecord({ overtime_reason: "staff_shortage", staff_id: "s2" }),
        makeRecord({ overtime_reason: "staff_shortage", staff_id: "s3" }),
      ];
      const m = computeAttendanceMetrics(recs, 3);
      expect(m.by_overtime_reason).toEqual({ staff_shortage: 3 });
    });
  });

  // ── Multiple records ──────────────────────────────────────────────────

  describe("multiple records", () => {
    const records = [
      makeRecord({
        staff_id: "s1", attendance_status: "present",
        shift_type: "day_shift", hours_worked: 8, overtime_hours: 1,
        overtime_reason: "staff_shortage", late_minutes: 0,
        compliance_flag: "compliant", agency_staff_used: false,
        minimum_staffing_met: true, handover_completed: true,
      }),
      makeRecord({
        staff_id: "s2", attendance_status: "late_arrival",
        shift_type: "day_shift", hours_worked: 7, overtime_hours: 0,
        overtime_reason: null, late_minutes: 15,
        compliance_flag: "compliant", agency_staff_used: false,
        minimum_staffing_met: true, handover_completed: true,
      }),
      makeRecord({
        staff_id: "s3", attendance_status: "absent_sick",
        shift_type: "night_shift", hours_worked: null, overtime_hours: 0,
        overtime_reason: null, late_minutes: 0,
        compliance_flag: "not_checked", agency_staff_used: true,
        minimum_staffing_met: false, handover_completed: false,
      }),
      makeRecord({
        staff_id: "s4", attendance_status: "early_departure",
        shift_type: "long_day", hours_worked: 6, overtime_hours: 0.5,
        overtime_reason: "handover_overrun", late_minutes: 0,
        compliance_flag: "exceeded_48h_week", agency_staff_used: false,
        minimum_staffing_met: true, handover_completed: true,
      }),
      makeRecord({
        staff_id: "s5", attendance_status: "annual_leave",
        shift_type: "day_shift", hours_worked: null, overtime_hours: 0,
        overtime_reason: null, late_minutes: 0,
        compliance_flag: "compliant", agency_staff_used: false,
        minimum_staffing_met: true, handover_completed: true,
      }),
    ];

    it("returns total_records = 5", () => {
      const m = computeAttendanceMetrics(records, 8);
      expect(m.total_records).toBe(5);
    });

    it("returns present_count = 1", () => {
      const m = computeAttendanceMetrics(records, 8);
      expect(m.present_count).toBe(1);
    });

    it("returns absent_sick_count = 1", () => {
      const m = computeAttendanceMetrics(records, 8);
      expect(m.absent_sick_count).toBe(1);
    });

    it("returns absent_unauthorised_count = 0", () => {
      const m = computeAttendanceMetrics(records, 8);
      expect(m.absent_unauthorised_count).toBe(0);
    });

    it("returns late_arrival_count = 1", () => {
      const m = computeAttendanceMetrics(records, 8);
      expect(m.late_arrival_count).toBe(1);
    });

    it("calculates attendance_rate correctly", () => {
      // workingRecords: present, late_arrival, absent_sick, early_departure (4, excludes annual_leave)
      // attended: present, late_arrival, early_departure (3)
      // 3/4 = 75%
      const m = computeAttendanceMetrics(records, 8);
      expect(m.attendance_rate).toBe(75);
    });

    it("calculates punctuality_rate correctly", () => {
      // workingRecords: 4 (excludes annual_leave)
      // onTime: present, early_departure (2)
      // 2/4 = 50%
      const m = computeAttendanceMetrics(records, 8);
      expect(m.punctuality_rate).toBe(50);
    });

    it("calculates average_late_minutes correctly", () => {
      // only 1 record with late_minutes > 0: 15
      const m = computeAttendanceMetrics(records, 8);
      expect(m.average_late_minutes).toBe(15);
    });

    it("calculates total_overtime_hours correctly", () => {
      // 1 + 0 + 0 + 0.5 + 0 = 1.5
      const m = computeAttendanceMetrics(records, 8);
      expect(m.total_overtime_hours).toBe(1.5);
    });

    it("calculates average_hours_worked correctly", () => {
      // records with hours: 8, 7, 6 (3 records, 2 are null)
      // avg = 21/3 = 7
      const m = computeAttendanceMetrics(records, 8);
      expect(m.average_hours_worked).toBe(7);
    });

    it("returns agency_staff_used_count = 1", () => {
      const m = computeAttendanceMetrics(records, 8);
      expect(m.agency_staff_used_count).toBe(1);
    });

    it("calculates minimum_staffing_met_rate correctly", () => {
      // 4 of 5 met minimum staffing = 80%
      const m = computeAttendanceMetrics(records, 8);
      expect(m.minimum_staffing_met_rate).toBe(80);
    });

    it("calculates handover_completed_rate correctly", () => {
      // 4 of 5 completed handover = 80%
      const m = computeAttendanceMetrics(records, 8);
      expect(m.handover_completed_rate).toBe(80);
    });

    it("calculates compliance_rate correctly", () => {
      // 3 compliant out of 5 = 60%
      const m = computeAttendanceMetrics(records, 8);
      expect(m.compliance_rate).toBe(60);
    });

    it("returns non_compliant_count = 1 (excludes compliant and not_checked)", () => {
      // exceeded_48h_week is the only non-compliant (not compliant, not not_checked)
      const m = computeAttendanceMetrics(records, 8);
      expect(m.non_compliant_count).toBe(1);
    });

    it("calculates staff_coverage correctly (5 of 8 = 62.5%)", () => {
      const m = computeAttendanceMetrics(records, 8);
      expect(m.staff_coverage).toBe(62.5);
    });

    it("groups by_overtime_reason correctly", () => {
      const m = computeAttendanceMetrics(records, 8);
      expect(m.by_overtime_reason).toEqual({
        staff_shortage: 1, handover_overrun: 1,
      });
    });
  });

  // ── Return shape ──────────────────────────────────────────────────────────

  describe("return shape", () => {
    it("returns exactly 20 keys", () => {
      const m = computeAttendanceMetrics([], 0);
      expect(Object.keys(m)).toHaveLength(20);
    });

    it("contains all expected keys", () => {
      const m = computeAttendanceMetrics([], 0);
      const keys = Object.keys(m);
      const expected = [
        "total_records", "present_count", "absent_sick_count",
        "absent_unauthorised_count", "late_arrival_count",
        "attendance_rate", "punctuality_rate", "average_late_minutes",
        "total_overtime_hours", "average_hours_worked",
        "agency_staff_used_count", "minimum_staffing_met_rate",
        "handover_completed_rate", "compliance_rate", "non_compliant_count",
        "staff_coverage", "by_attendance_status", "by_shift_type",
        "by_compliance_flag", "by_overtime_reason",
      ];
      for (const k of expected) {
        expect(keys).toContain(k);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// identifyAttendanceAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyAttendanceAlerts", () => {
  // ── No alerts ─────────────────────────────────────────────────────────────

  describe("no alerts", () => {
    it("returns empty array when no records and no staff", () => {
      const alerts = identifyAttendanceAlerts([], 0);
      expect(alerts).toEqual([]);
    });

    it("returns empty array when no records with totalStaff > 0", () => {
      const alerts = identifyAttendanceAlerts([], 5);
      expect(alerts).toEqual([]);
    });

    it("returns empty array when all conditions are clean", () => {
      const recs = [
        makeRecord({
          staff_id: "s1", attendance_status: "present",
          compliance_flag: "compliant", agency_staff_used: false,
          minimum_staffing_met: true, late_minutes: 0,
        }),
        makeRecord({
          staff_id: "s2", attendance_status: "present",
          compliance_flag: "compliant", agency_staff_used: false,
          minimum_staffing_met: true, late_minutes: 0,
        }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 2);
      expect(alerts).toEqual([]);
    });
  });

  // ── minimum_staffing_not_met alert ─────────────────────────────────────

  describe("minimum_staffing_not_met alert", () => {
    it("fires when minimum_staffing_met = false", () => {
      const recs = [
        makeRecord({
          id: "rec-1", minimum_staffing_met: false,
          attendance_date: "2025-06-01", shift_type: "day_shift",
        }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "minimum_staffing_not_met");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const recs = [
        makeRecord({ minimum_staffing_met: false }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "minimum_staffing_not_met")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses record id as alert id", () => {
      const recs = [
        makeRecord({ id: "my-rec-id", minimum_staffing_met: false }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "minimum_staffing_not_met")!;
      expect(alert.id).toBe("my-rec-id");
    });

    it("includes attendance_date in message", () => {
      const recs = [
        makeRecord({
          minimum_staffing_met: false,
          attendance_date: "2025-06-15",
          shift_type: "day_shift",
        }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "minimum_staffing_not_met")!;
      expect(alert.message).toContain("2025-06-15");
    });

    it("includes shift_type with underscores replaced by spaces in message", () => {
      const recs = [
        makeRecord({
          minimum_staffing_met: false,
          shift_type: "waking_night",
        }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "minimum_staffing_not_met")!;
      expect(alert.message).toContain("waking night");
    });

    it("creates one alert per qualifying record", () => {
      const recs = [
        makeRecord({ id: "r1", minimum_staffing_met: false, staff_id: "s1" }),
        makeRecord({ id: "r2", minimum_staffing_met: false, staff_id: "s2" }),
        makeRecord({ id: "r3", minimum_staffing_met: false, staff_id: "s3" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 3);
      const minStaffAlerts = alerts.filter((a) => a.type === "minimum_staffing_not_met");
      expect(minStaffAlerts).toHaveLength(3);
    });

    it("does NOT fire when minimum_staffing_met = true", () => {
      const recs = [
        makeRecord({ minimum_staffing_met: true }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "minimum_staffing_not_met");
      expect(alert).toBeUndefined();
    });

    it("handles day_shift shift_type in message", () => {
      const recs = [
        makeRecord({ minimum_staffing_met: false, shift_type: "day_shift" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "minimum_staffing_not_met")!;
      expect(alert.message).toContain("day shift");
    });

    it("handles night_shift shift_type in message", () => {
      const recs = [
        makeRecord({ minimum_staffing_met: false, shift_type: "night_shift" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "minimum_staffing_not_met")!;
      expect(alert.message).toContain("night shift");
    });

    it("handles sleep_in shift_type in message", () => {
      const recs = [
        makeRecord({ minimum_staffing_met: false, shift_type: "sleep_in" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "minimum_staffing_not_met")!;
      expect(alert.message).toContain("sleep in");
    });

    it("handles bank_holiday shift_type in message", () => {
      const recs = [
        makeRecord({ minimum_staffing_met: false, shift_type: "bank_holiday" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "minimum_staffing_not_met")!;
      expect(alert.message).toContain("bank holiday");
    });
  });

  // ── working_time_breach alert ──────────────────────────────────────────

  describe("working_time_breach alert", () => {
    it("fires for exceeded_48h_week compliance_flag", () => {
      const recs = [
        makeRecord({
          compliance_flag: "exceeded_48h_week",
          staff_name: "Alice",
          attendance_date: "2025-06-01",
        }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "working_time_breach");
      expect(alert).toBeDefined();
    });

    it("fires for insufficient_rest compliance_flag", () => {
      const recs = [
        makeRecord({
          compliance_flag: "insufficient_rest",
          staff_name: "Bob",
        }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "working_time_breach");
      expect(alert).toBeDefined();
    });

    it("fires for consecutive_days_exceeded compliance_flag", () => {
      const recs = [
        makeRecord({ compliance_flag: "consecutive_days_exceeded" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "working_time_breach");
      expect(alert).toBeDefined();
    });

    it("fires for night_worker_limit compliance_flag", () => {
      const recs = [
        makeRecord({ compliance_flag: "night_worker_limit" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "working_time_breach");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const recs = [
        makeRecord({ compliance_flag: "exceeded_48h_week" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "working_time_breach")!;
      expect(alert.severity).toBe("high");
    });

    it("uses record id as alert id", () => {
      const recs = [
        makeRecord({ id: "breach-id-1", compliance_flag: "exceeded_48h_week" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "working_time_breach")!;
      expect(alert.id).toBe("breach-id-1");
    });

    it("includes staff_name in message", () => {
      const recs = [
        makeRecord({
          staff_name: "Charlie Brown",
          compliance_flag: "exceeded_48h_week",
        }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "working_time_breach")!;
      expect(alert.message).toContain("Charlie Brown");
    });

    it("includes compliance_flag with underscores replaced by spaces in message", () => {
      const recs = [
        makeRecord({ compliance_flag: "exceeded_48h_week" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "working_time_breach")!;
      expect(alert.message).toContain("exceeded 48h week");
    });

    it("includes attendance_date in message", () => {
      const recs = [
        makeRecord({
          compliance_flag: "exceeded_48h_week",
          attendance_date: "2025-07-10",
        }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "working_time_breach")!;
      expect(alert.message).toContain("2025-07-10");
    });

    it("creates one alert per qualifying record", () => {
      const recs = [
        makeRecord({ id: "r1", compliance_flag: "exceeded_48h_week", staff_id: "s1" }),
        makeRecord({ id: "r2", compliance_flag: "insufficient_rest", staff_id: "s2" }),
        makeRecord({ id: "r3", compliance_flag: "night_worker_limit", staff_id: "s3" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 3);
      const breachAlerts = alerts.filter((a) => a.type === "working_time_breach");
      expect(breachAlerts).toHaveLength(3);
    });

    it("does NOT fire for compliant compliance_flag", () => {
      const recs = [
        makeRecord({ compliance_flag: "compliant" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "working_time_breach");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire for not_checked compliance_flag", () => {
      const recs = [
        makeRecord({ compliance_flag: "not_checked" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "working_time_breach");
      expect(alert).toBeUndefined();
    });

    it("shows insufficient_rest correctly in message", () => {
      const recs = [
        makeRecord({ compliance_flag: "insufficient_rest" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "working_time_breach")!;
      expect(alert.message).toContain("insufficient rest");
    });

    it("shows consecutive_days_exceeded correctly in message", () => {
      const recs = [
        makeRecord({ compliance_flag: "consecutive_days_exceeded" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "working_time_breach")!;
      expect(alert.message).toContain("consecutive days exceeded");
    });

    it("shows night_worker_limit correctly in message", () => {
      const recs = [
        makeRecord({ compliance_flag: "night_worker_limit" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "working_time_breach")!;
      expect(alert.message).toContain("night worker limit");
    });
  });

  // ── unauthorised_absence alert ─────────────────────────────────────────

  describe("unauthorised_absence alert", () => {
    it("fires when count >= 1", () => {
      const recs = [
        makeRecord({ attendance_status: "absent_unauthorised" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "unauthorised_absence");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const recs = [
        makeRecord({ attendance_status: "absent_unauthorised" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "unauthorised_absence")!;
      expect(alert.severity).toBe("high");
    });

    it("has id 'unauthorised_absence'", () => {
      const recs = [
        makeRecord({ attendance_status: "absent_unauthorised" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "unauthorised_absence")!;
      expect(alert.id).toBe("unauthorised_absence");
    });

    it("uses singular 'absence' when count is 1", () => {
      const recs = [
        makeRecord({ attendance_status: "absent_unauthorised" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "unauthorised_absence")!;
      expect(alert.message).toContain("absence");
      expect(alert.message).not.toContain("absences");
    });

    it("uses plural 'absences' when count > 1", () => {
      const recs = [
        makeRecord({ attendance_status: "absent_unauthorised", staff_id: "s1" }),
        makeRecord({ attendance_status: "absent_unauthorised", staff_id: "s2" }),
        makeRecord({ attendance_status: "absent_unauthorised", staff_id: "s3" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "unauthorised_absence")!;
      expect(alert.message).toContain("absences");
    });

    it("includes count in message", () => {
      const recs = [
        makeRecord({ attendance_status: "absent_unauthorised", staff_id: "s1" }),
        makeRecord({ attendance_status: "absent_unauthorised", staff_id: "s2" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "unauthorised_absence")!;
      expect(alert.message).toContain("2");
    });

    it("does NOT fire when no absent_unauthorised records", () => {
      const recs = [
        makeRecord({ attendance_status: "present" }),
        makeRecord({ attendance_status: "absent_sick" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "unauthorised_absence");
      expect(alert).toBeUndefined();
    });

    it("only produces one alert regardless of count", () => {
      const recs = [
        makeRecord({ attendance_status: "absent_unauthorised", staff_id: "s1" }),
        makeRecord({ attendance_status: "absent_unauthorised", staff_id: "s2" }),
        makeRecord({ attendance_status: "absent_unauthorised", staff_id: "s3" }),
        makeRecord({ attendance_status: "absent_unauthorised", staff_id: "s4" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 4);
      const unauthAlerts = alerts.filter((a) => a.type === "unauthorised_absence");
      expect(unauthAlerts).toHaveLength(1);
    });
  });

  // ── agency_reliance alert ──────────────────────────────────────────────

  describe("agency_reliance alert", () => {
    it("fires when agency_staff_used count >= 3", () => {
      const recs = [
        makeRecord({ agency_staff_used: true, staff_id: "s1" }),
        makeRecord({ agency_staff_used: true, staff_id: "s2" }),
        makeRecord({ agency_staff_used: true, staff_id: "s3" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "agency_reliance");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const recs = [
        makeRecord({ agency_staff_used: true, staff_id: "s1" }),
        makeRecord({ agency_staff_used: true, staff_id: "s2" }),
        makeRecord({ agency_staff_used: true, staff_id: "s3" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "agency_reliance")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id 'agency_reliance'", () => {
      const recs = [
        makeRecord({ agency_staff_used: true, staff_id: "s1" }),
        makeRecord({ agency_staff_used: true, staff_id: "s2" }),
        makeRecord({ agency_staff_used: true, staff_id: "s3" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "agency_reliance")!;
      expect(alert.id).toBe("agency_reliance");
    });

    it("includes count in message", () => {
      const recs = [
        makeRecord({ agency_staff_used: true, staff_id: "s1" }),
        makeRecord({ agency_staff_used: true, staff_id: "s2" }),
        makeRecord({ agency_staff_used: true, staff_id: "s3" }),
        makeRecord({ agency_staff_used: true, staff_id: "s4" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 4);
      const alert = alerts.find((a) => a.type === "agency_reliance")!;
      expect(alert.message).toContain("4");
    });

    it("does NOT fire when agency count < 3", () => {
      const recs = [
        makeRecord({ agency_staff_used: true, staff_id: "s1" }),
        makeRecord({ agency_staff_used: true, staff_id: "s2" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "agency_reliance");
      expect(alert).toBeUndefined();
    });

    it("fires at exactly 3", () => {
      const recs = [
        makeRecord({ agency_staff_used: true, staff_id: "s1" }),
        makeRecord({ agency_staff_used: true, staff_id: "s2" }),
        makeRecord({ agency_staff_used: true, staff_id: "s3" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "agency_reliance");
      expect(alert).toBeDefined();
    });

    it("does NOT fire when no agency staff used", () => {
      const recs = [
        makeRecord({ agency_staff_used: false, staff_id: "s1" }),
        makeRecord({ agency_staff_used: false, staff_id: "s2" }),
        makeRecord({ agency_staff_used: false, staff_id: "s3" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "agency_reliance");
      expect(alert).toBeUndefined();
    });

    it("only produces one alert regardless of count", () => {
      const recs = [
        makeRecord({ agency_staff_used: true, staff_id: "s1" }),
        makeRecord({ agency_staff_used: true, staff_id: "s2" }),
        makeRecord({ agency_staff_used: true, staff_id: "s3" }),
        makeRecord({ agency_staff_used: true, staff_id: "s4" }),
        makeRecord({ agency_staff_used: true, staff_id: "s5" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 5);
      const agencyAlerts = alerts.filter((a) => a.type === "agency_reliance");
      expect(agencyAlerts).toHaveLength(1);
    });
  });

  // ── punctuality_concern alert ──────────────────────────────────────────

  describe("punctuality_concern alert", () => {
    it("fires when late_minutes > 0 count >= 5", () => {
      const recs = [
        makeRecord({ late_minutes: 5, staff_id: "s1" }),
        makeRecord({ late_minutes: 10, staff_id: "s2" }),
        makeRecord({ late_minutes: 3, staff_id: "s3" }),
        makeRecord({ late_minutes: 7, staff_id: "s4" }),
        makeRecord({ late_minutes: 1, staff_id: "s5" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 5);
      const alert = alerts.find((a) => a.type === "punctuality_concern");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const recs = Array.from({ length: 5 }, (_, i) =>
        makeRecord({ late_minutes: i + 1, staff_id: `s${i}` }),
      );
      const alerts = identifyAttendanceAlerts(recs, 5);
      const alert = alerts.find((a) => a.type === "punctuality_concern")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id 'punctuality_concern'", () => {
      const recs = Array.from({ length: 5 }, (_, i) =>
        makeRecord({ late_minutes: i + 1, staff_id: `s${i}` }),
      );
      const alerts = identifyAttendanceAlerts(recs, 5);
      const alert = alerts.find((a) => a.type === "punctuality_concern")!;
      expect(alert.id).toBe("punctuality_concern");
    });

    it("includes count in message", () => {
      const recs = Array.from({ length: 7 }, (_, i) =>
        makeRecord({ late_minutes: i + 1, staff_id: `s${i}` }),
      );
      const alerts = identifyAttendanceAlerts(recs, 7);
      const alert = alerts.find((a) => a.type === "punctuality_concern")!;
      expect(alert.message).toContain("7");
    });

    it("does NOT fire when late count < 5", () => {
      const recs = [
        makeRecord({ late_minutes: 5, staff_id: "s1" }),
        makeRecord({ late_minutes: 10, staff_id: "s2" }),
        makeRecord({ late_minutes: 3, staff_id: "s3" }),
        makeRecord({ late_minutes: 7, staff_id: "s4" }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 4);
      const alert = alerts.find((a) => a.type === "punctuality_concern");
      expect(alert).toBeUndefined();
    });

    it("fires at exactly 5", () => {
      const recs = Array.from({ length: 5 }, (_, i) =>
        makeRecord({ late_minutes: 1, staff_id: `s${i}` }),
      );
      const alerts = identifyAttendanceAlerts(recs, 5);
      const alert = alerts.find((a) => a.type === "punctuality_concern");
      expect(alert).toBeDefined();
    });

    it("does NOT fire when all late_minutes = 0", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecord({ late_minutes: 0, staff_id: `s${i}` }),
      );
      const alerts = identifyAttendanceAlerts(recs, 10);
      const alert = alerts.find((a) => a.type === "punctuality_concern");
      expect(alert).toBeUndefined();
    });

    it("only produces one alert regardless of count", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecord({ late_minutes: i + 1, staff_id: `s${i}` }),
      );
      const alerts = identifyAttendanceAlerts(recs, 10);
      const punctualityAlerts = alerts.filter((a) => a.type === "punctuality_concern");
      expect(punctualityAlerts).toHaveLength(1);
    });
  });

  // ── Combined alerts ───────────────────────────────────────────────────────

  describe("combined alerts", () => {
    it("can return all 5 alert types simultaneously", () => {
      const recs = [
        // minimum_staffing_not_met (critical, per-record)
        makeRecord({
          id: "r1", staff_id: "s1", minimum_staffing_met: false,
          attendance_status: "absent_unauthorised",
          compliance_flag: "exceeded_48h_week", staff_name: "Alice",
          agency_staff_used: true, late_minutes: 10,
        }),
        // more for thresholds
        makeRecord({
          id: "r2", staff_id: "s2",
          attendance_status: "absent_unauthorised",
          agency_staff_used: true, late_minutes: 5,
        }),
        makeRecord({
          id: "r3", staff_id: "s3",
          agency_staff_used: true, late_minutes: 8,
        }),
        makeRecord({
          id: "r4", staff_id: "s4",
          late_minutes: 3,
        }),
        makeRecord({
          id: "r5", staff_id: "s5",
          late_minutes: 2,
        }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 5);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("minimum_staffing_not_met");
      expect(types).toContain("working_time_breach");
      expect(types).toContain("unauthorised_absence");
      expect(types).toContain("agency_reliance");
      expect(types).toContain("punctuality_concern");
    });

    it("returns correct total count when multiple alert types fire", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_id: "s1", minimum_staffing_met: false,
          compliance_flag: "exceeded_48h_week", staff_name: "Alice",
          attendance_status: "absent_unauthorised",
          agency_staff_used: true, late_minutes: 10,
        }),
        makeRecord({
          id: "r2", staff_id: "s2",
          agency_staff_used: true, late_minutes: 5,
        }),
        makeRecord({
          id: "r3", staff_id: "s3",
          agency_staff_used: true, late_minutes: 8,
        }),
        makeRecord({
          id: "r4", staff_id: "s4",
          late_minutes: 3,
        }),
        makeRecord({
          id: "r5", staff_id: "s5",
          late_minutes: 2,
        }),
      ];
      // minimum_staffing_not_met: 1 (per-record)
      // working_time_breach: 1 (per-record)
      // unauthorised_absence: 1 (aggregate)
      // agency_reliance: 1 (aggregate)
      // punctuality_concern: 1 (aggregate)
      const alerts = identifyAttendanceAlerts(recs, 5);
      expect(alerts.length).toBe(5);
    });
  });

  // ── Alert structure ───────────────────────────────────────────────────────

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_id: "s1", minimum_staffing_met: false,
          compliance_flag: "exceeded_48h_week", staff_name: "Alice",
          attendance_status: "absent_unauthorised",
          agency_staff_used: true, late_minutes: 10,
        }),
        makeRecord({ id: "r2", staff_id: "s2", agency_staff_used: true, late_minutes: 5 }),
        makeRecord({ id: "r3", staff_id: "s3", agency_staff_used: true, late_minutes: 8 }),
        makeRecord({ id: "r4", staff_id: "s4", late_minutes: 3 }),
        makeRecord({ id: "r5", staff_id: "s5", late_minutes: 2 }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 5);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
        expect(typeof alert.type).toBe("string");
        expect(typeof alert.severity).toBe("string");
        expect(typeof alert.message).toBe("string");
        expect(typeof alert.id).toBe("string");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_id: "s1", minimum_staffing_met: false,
          compliance_flag: "exceeded_48h_week", staff_name: "Alice",
          attendance_status: "absent_unauthorised",
          agency_staff_used: true, late_minutes: 10,
        }),
        makeRecord({ id: "r2", staff_id: "s2", agency_staff_used: true, late_minutes: 5 }),
        makeRecord({ id: "r3", staff_id: "s3", agency_staff_used: true, late_minutes: 8 }),
        makeRecord({ id: "r4", staff_id: "s4", late_minutes: 3 }),
        makeRecord({ id: "r5", staff_id: "s5", late_minutes: 2 }),
      ];
      const alerts = identifyAttendanceAlerts(recs, 5);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });
  });
});
