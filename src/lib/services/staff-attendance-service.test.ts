import { describe, it, expect } from "vitest";
import {
  computeAttendanceMetrics,
  identifyAttendanceAlerts,
} from "./staff-attendance-service";
import type { AttendanceRecord } from "./staff-attendance-service";

// -- Factory -------------------------------------------------------------------

function makeRecord(overrides: Partial<AttendanceRecord> = {}): AttendanceRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    staff_name: "Tom Jones",
    staff_id: "staff-1",
    attendance_date: "2026-05-20",
    attendance_status: "present",
    shift_type: "day_shift",
    scheduled_start: "07:00",
    scheduled_end: "15:00",
    actual_start: "07:00",
    actual_end: "15:00",
    hours_worked: 8,
    overtime_hours: 0,
    overtime_reason: null,
    late_minutes: 0,
    compliance_flag: "compliant",
    agency_staff_used: false,
    minimum_staffing_met: true,
    handover_completed: true,
    notes: null,
    created_at: "2026-05-20T00:00:00Z",
    updated_at: "2026-05-20T00:00:00Z",
    ...overrides,
  };
}

// -- computeAttendanceMetrics --------------------------------------------------

describe("computeAttendanceMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeAttendanceMetrics([], 10);
    expect(m.total_records).toBe(0);
    expect(m.present_count).toBe(0);
    expect(m.absent_sick_count).toBe(0);
    expect(m.absent_unauthorised_count).toBe(0);
    expect(m.late_arrival_count).toBe(0);
    expect(m.attendance_rate).toBeNull();
    expect(m.punctuality_rate).toBeNull();
    expect(m.average_late_minutes).toBeNull();; expect(m.total_overtime_hours).toBe(0);
    expect(m.average_hours_worked).toBe(0);
    expect(m.agency_staff_used_count).toBe(0);
    expect(m.minimum_staffing_met_rate).toBeNull();; expect(m.handover_completed_rate).toBeNull();; expect(m.compliance_rate).toBeNull();; expect(m.non_compliant_count).toBe(0);
    expect(m.staff_coverage).toBe(0);
  });

  it("counts attendance statuses correctly", () => {
    const records = [
      makeRecord({ id: "1", attendance_status: "present" }),
      makeRecord({ id: "2", attendance_status: "absent_sick" }),
      makeRecord({ id: "3", attendance_status: "absent_unauthorised" }),
      makeRecord({ id: "4", attendance_status: "late_arrival" }),
    ];
    const m = computeAttendanceMetrics(records, 5);
    expect(m.present_count).toBe(1);
    expect(m.absent_sick_count).toBe(1);
    expect(m.absent_unauthorised_count).toBe(1);
    expect(m.late_arrival_count).toBe(1);
  });

  it("calculates attendance_rate excluding leave/training/suspended", () => {
    const records = [
      makeRecord({ id: "1", attendance_status: "present" }),
      makeRecord({ id: "2", attendance_status: "absent_sick" }),
      makeRecord({ id: "3", attendance_status: "annual_leave" }),
    ];
    const m = computeAttendanceMetrics(records, 5);
    // workingRecords = present + absent_sick (2), attended = present (1)
    expect(m.attendance_rate).toBe(50);
  });

  it("calculates punctuality_rate correctly", () => {
    const records = [
      makeRecord({ id: "1", attendance_status: "present" }),
      makeRecord({ id: "2", attendance_status: "late_arrival" }),
    ];
    const m = computeAttendanceMetrics(records, 5);
    // workingRecords = 2, on-time = present (1)
    expect(m.punctuality_rate).toBe(50);
  });

  it("calculates average_late_minutes only for late records", () => {
    const records = [
      makeRecord({ id: "1", late_minutes: 0 }),
      makeRecord({ id: "2", late_minutes: 10 }),
      makeRecord({ id: "3", late_minutes: 20 }),
    ];
    const m = computeAttendanceMetrics(records, 5);
    // Only records with late_minutes > 0 => avg of 10 and 20 = 15
    expect(m.average_late_minutes).toBe(15);
  });

  it("calculates staff_coverage correctly", () => {
    const records = [
      makeRecord({ id: "1", staff_id: "s1" }),
      makeRecord({ id: "2", staff_id: "s1" }),
      makeRecord({ id: "3", staff_id: "s2" }),
    ];
    const m = computeAttendanceMetrics(records, 4);
    // unique staff = 2, total = 4 => 50%
    expect(m.staff_coverage).toBe(50);
  });

  it("counts non_compliant excluding compliant and not_checked", () => {
    const records = [
      makeRecord({ id: "1", compliance_flag: "compliant" }),
      makeRecord({ id: "2", compliance_flag: "not_checked" }),
      makeRecord({ id: "3", compliance_flag: "exceeded_48h_week" }),
      makeRecord({ id: "4", compliance_flag: "insufficient_rest" }),
    ];
    const m = computeAttendanceMetrics(records, 5);
    expect(m.non_compliant_count).toBe(2);
  });
});

// -- identifyAttendanceAlerts --------------------------------------------------

describe("identifyAttendanceAlerts", () => {
  it("returns empty array for empty records", () => {
    expect(identifyAttendanceAlerts([], 10)).toEqual([]);
  });

  it("returns empty array for safe records", () => {
    expect(identifyAttendanceAlerts([makeRecord()], 10)).toEqual([]);
  });

  it("fires critical alert when minimum_staffing_met is false", () => {
    const records = [makeRecord({ minimum_staffing_met: false })];
    const alerts = identifyAttendanceAlerts(records, 10);
    const match = alerts.find((a) => a.type === "minimum_staffing_not_met");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for working time breaches", () => {
    const records = [makeRecord({ compliance_flag: "exceeded_48h_week" })];
    const alerts = identifyAttendanceAlerts(records, 10);
    const match = alerts.find((a) => a.type === "working_time_breach");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for unauthorised absences (threshold >= 1)", () => {
    const records = [makeRecord({ attendance_status: "absent_unauthorised" })];
    const alerts = identifyAttendanceAlerts(records, 10);
    const match = alerts.find((a) => a.type === "unauthorised_absence");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for agency reliance (threshold >= 3)", () => {
    const records = [
      makeRecord({ id: "1", agency_staff_used: true }),
      makeRecord({ id: "2", agency_staff_used: true }),
      makeRecord({ id: "3", agency_staff_used: true }),
    ];
    const alerts = identifyAttendanceAlerts(records, 10);
    const match = alerts.find((a) => a.type === "agency_reliance");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("does NOT fire agency reliance alert below threshold (2 records)", () => {
    const records = [
      makeRecord({ id: "1", agency_staff_used: true }),
      makeRecord({ id: "2", agency_staff_used: true }),
    ];
    const alerts = identifyAttendanceAlerts(records, 10);
    const match = alerts.find((a) => a.type === "agency_reliance");
    expect(match).toBeUndefined();
  });

  it("fires medium alert for punctuality concern (threshold >= 5)", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r${i}`, late_minutes: 10 }),
    );
    const alerts = identifyAttendanceAlerts(records, 10);
    const match = alerts.find((a) => a.type === "punctuality_concern");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});
