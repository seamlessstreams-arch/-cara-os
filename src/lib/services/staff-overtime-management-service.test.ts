import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
} from "./staff-overtime-management-service";
import type { StaffOvertimeManagementRow } from "./staff-overtime-management-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<StaffOvertimeManagementRow> = {}): StaffOvertimeManagementRow {
  return {
    id: "row-1",
    home_id: "home-1",
    review_date: "2026-04-01",
    reviewer_name: "Manager A",
    staff_name: "Alice Smith",
    review_period_start: "2026-03-01",
    review_period_end: "2026-03-31",
    contracted_hours: 37.5,
    actual_hours: 40,
    overtime_hours: 2.5,
    weekly_average_hours: 40,
    exceeds_48_hours: false,
    opt_out_signed: false,
    opt_out_date: null,
    rest_break_compliant: true,
    night_worker: false,
    night_hours_compliant: null,
    overtime_authorised: true,
    overtime_paid: true,
    toil_accrued: false,
    compliance_status: "Compliant",
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics (overtime)", () => {
  it("returns zeroes for empty array", () => {
    const m = computeMetrics([]);
    expect(m.total_reviews).toBe(0);
    expect(m.exceeds_48_count).toBe(0);
    expect(m.non_compliant_count).toBe(0);
    expect(m.opt_out_count).toBe(0);
    expect(m.opt_out_rate).toBeNull();;
    expect(m.rest_break_compliant_rate).toBeNull();;
    expect(m.avg_weekly_hours).toBe(0);
    expect(m.avg_overtime_hours).toBe(0);
    expect(m.avg_contracted_hours).toBe(0);
    expect(m.unique_staff).toBe(0);
    expect(m.unique_reviewers).toBe(0);
  });

  it("counts status flags correctly", () => {
    const rows = [
      makeRow({ id: "1", exceeds_48_hours: true, compliance_status: "Non-Compliant", opt_out_signed: true, toil_accrued: true, night_worker: true }),
      makeRow({ id: "2", exceeds_48_hours: false, compliance_status: "Compliant", opt_out_signed: false, toil_accrued: false, night_worker: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_reviews).toBe(2);
    expect(m.exceeds_48_count).toBe(1);
    expect(m.non_compliant_count).toBe(1);
    expect(m.opt_out_count).toBe(1);
    expect(m.toil_accrued_count).toBe(1);
    expect(m.night_worker_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", rest_break_compliant: true, overtime_authorised: true, overtime_paid: true }),
      makeRow({ id: "2", rest_break_compliant: false, overtime_authorised: false, overtime_paid: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.rest_break_compliant_rate).toBe(50);
    expect(m.overtime_authorised_rate).toBe(50);
    expect(m.overtime_paid_rate).toBe(50);
  });

  it("calculates averages correctly", () => {
    const rows = [
      makeRow({ id: "1", weekly_average_hours: 40, overtime_hours: 5, contracted_hours: 35 }),
      makeRow({ id: "2", weekly_average_hours: 50, overtime_hours: 15, contracted_hours: 35 }),
    ];
    const m = computeMetrics(rows);
    expect(m.avg_weekly_hours).toBe(45);
    expect(m.avg_overtime_hours).toBe(10);
    expect(m.avg_contracted_hours).toBe(35);
  });

  it("counts unique staff and reviewers", () => {
    const rows = [
      makeRow({ id: "1", staff_name: "Alice", reviewer_name: "Manager A" }),
      makeRow({ id: "2", staff_name: "Bob", reviewer_name: "Manager A" }),
      makeRow({ id: "3", staff_name: "Alice", reviewer_name: "Manager B" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_staff).toBe(2);
    expect(m.unique_reviewers).toBe(2);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts (overtime)", () => {
  it("returns no alerts for empty array", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("returns no alerts for compliant records", () => {
    const alerts = computeAlerts([makeRow()]);
    expect(alerts).toEqual([]);
  });

  it("fires critical when exceeds 48 hours without opt-out", () => {
    const rows = [
      makeRow({ id: "r1", exceeds_48_hours: true, opt_out_signed: false, staff_name: "Alice" }),
    ];
    const alerts = computeAlerts(rows);
    const critical = alerts.filter((a) => a.severity === "critical");
    expect(critical.length).toBe(1);
    expect(critical[0].type).toBe("exceeds_48_no_opt_out");
  });

  it("does NOT fire critical when exceeds 48 hours with opt-out", () => {
    const rows = [
      makeRow({ id: "r1", exceeds_48_hours: true, opt_out_signed: true }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((a) => a.type === "exceeds_48_no_opt_out").length).toBe(0);
  });

  it("fires high for rest break non-compliance", () => {
    const rows = [makeRow({ id: "r1", rest_break_compliant: false })];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "rest_break_non_compliant");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("high");
  });

  it("fires high for night worker with non-compliant hours", () => {
    const rows = [makeRow({ id: "r1", night_worker: true, night_hours_compliant: false })];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "night_hours_non_compliant");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("high");
  });

  it("does NOT fire night alert when night_hours_compliant is null", () => {
    const rows = [makeRow({ id: "r1", night_worker: true, night_hours_compliant: null })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((a) => a.type === "night_hours_non_compliant").length).toBe(0);
  });

  it("fires medium for overtime not authorised", () => {
    const rows = [makeRow({ id: "r1", overtime_authorised: false })];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "overtime_not_authorised");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("medium");
  });

  it("fires medium for exceeds 48 with opt-out but review required", () => {
    const rows = [
      makeRow({ id: "r1", exceeds_48_hours: true, opt_out_signed: true, compliance_status: "Review Required" }),
    ];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "exceeds_48_review_required");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("medium");
  });
});
