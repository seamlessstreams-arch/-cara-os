import { describe, it, expect } from "vitest";
import {
  computeStaffAnnualLeaveMetrics,
  computeStaffAnnualLeaveAlerts,
  generateStaffAnnualLeaveCaraInsights,
} from "./staff-annual-leave-service";
import type { StaffAnnualLeaveRow } from "./staff-annual-leave-service";

// -- Factory -------------------------------------------------------------------

function makeRow(overrides: Partial<StaffAnnualLeaveRow> = {}): StaffAnnualLeaveRow {
  return {
    id: "row-1",
    home_id: "home-1",
    staff_name: "Alice Smith",
    staff_id: "staff-1",
    start_date: "2026-06-01",
    end_date: "2026-06-05",
    leave_type: "annual_leave",
    approval_status: "approved",
    cover_arrangement: "internal_swap",
    staffing_impact: "no_impact",
    days_requested: 5,
    approved_by: "Manager",
    cover_confirmed: true,
    handover_completed: true,
    children_informed: true,
    minimum_staffing_maintained: true,
    entitlement_remaining: 20,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeStaffAnnualLeaveMetrics -------------------------------------------

describe("computeStaffAnnualLeaveMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeStaffAnnualLeaveMetrics([]);
    expect(m.total_requests).toBe(0);
    expect(m.declined_count).toBe(0);
    expect(m.pending_count).toBe(0);
    expect(m.critical_understaffing_count).toBe(0);
    expect(m.no_cover_count).toBe(0);
    expect(m.cover_confirmed_rate).toBe(0);
    expect(m.handover_completed_rate).toBe(0);
    expect(m.children_informed_rate).toBe(0);
    expect(m.minimum_staffing_rate).toBe(0);
    expect(m.approved_rate).toBe(0);
    expect(m.unique_staff).toBe(0);
  });

  it("counts declined, pending, and critical_understaffing correctly", () => {
    const rows = [
      makeRow({ id: "1", approval_status: "declined" }),
      makeRow({ id: "2", approval_status: "requested" }),
      makeRow({ id: "3", approval_status: "pending_cover" }),
      makeRow({ id: "4", staffing_impact: "critical_understaffing" }),
    ];
    const m = computeStaffAnnualLeaveMetrics(rows);
    expect(m.declined_count).toBe(1);
    expect(m.pending_count).toBe(2);
    expect(m.critical_understaffing_count).toBe(1);
  });

  it("calculates no_cover_count correctly", () => {
    const rows = [
      makeRow({ id: "1", cover_confirmed: false }),
      makeRow({ id: "2", cover_confirmed: false }),
      makeRow({ id: "3", cover_confirmed: true }),
    ];
    const m = computeStaffAnnualLeaveMetrics(rows);
    expect(m.no_cover_count).toBe(2);
  });

  it("calculates approved_rate excluding cancelled", () => {
    const rows = [
      makeRow({ id: "1", approval_status: "approved" }),
      makeRow({ id: "2", approval_status: "declined" }),
      makeRow({ id: "3", approval_status: "cancelled" }),
    ];
    const m = computeStaffAnnualLeaveMetrics(rows);
    // Non-cancelled = 2, approved = 1 => 50%
    expect(m.approved_rate).toBe(50);
  });

  it("builds leave_type_breakdown", () => {
    const rows = [
      makeRow({ id: "1", leave_type: "annual_leave" }),
      makeRow({ id: "2", leave_type: "annual_leave" }),
      makeRow({ id: "3", leave_type: "sick_leave" }),
    ];
    const m = computeStaffAnnualLeaveMetrics(rows);
    expect(m.leave_type_breakdown).toEqual({ annual_leave: 2, sick_leave: 1 });
  });
});

// -- computeStaffAnnualLeaveAlerts --------------------------------------------

describe("computeStaffAnnualLeaveAlerts", () => {
  it("returns empty array for empty rows", () => {
    expect(computeStaffAnnualLeaveAlerts([])).toEqual([]);
  });

  it("returns empty array for safe rows", () => {
    expect(computeStaffAnnualLeaveAlerts([makeRow()])).toEqual([]);
  });

  it("fires critical alert for approved + critical_understaffing + min staffing not maintained", () => {
    const rows = [
      makeRow({
        approval_status: "approved",
        staffing_impact: "critical_understaffing",
        minimum_staffing_maintained: false,
      }),
    ];
    const alerts = computeStaffAnnualLeaveAlerts(rows);
    const match = alerts.find((a) => a.type === "critical_understaffing_approved");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for approved + no cover confirmed", () => {
    const rows = [makeRow({ approval_status: "approved", cover_confirmed: false })];
    const alerts = computeStaffAnnualLeaveAlerts(rows);
    const match = alerts.find((a) => a.type === "approved_no_cover");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for overlapping approved leave", () => {
    const rows = [
      makeRow({ id: "1", staff_name: "Alice", approval_status: "approved", start_date: "2026-06-01", end_date: "2026-06-05" }),
      makeRow({ id: "2", staff_name: "Bob", approval_status: "approved", start_date: "2026-06-03", end_date: "2026-06-07" }),
    ];
    const alerts = computeStaffAnnualLeaveAlerts(rows);
    const match = alerts.find((a) => a.type === "overlapping_leave");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("does NOT fire overlapping alert for non-overlapping dates", () => {
    const rows = [
      makeRow({ id: "1", approval_status: "approved", start_date: "2026-06-01", end_date: "2026-06-02" }),
      makeRow({ id: "2", approval_status: "approved", start_date: "2026-06-10", end_date: "2026-06-12" }),
    ];
    const alerts = computeStaffAnnualLeaveAlerts(rows);
    const match = alerts.find((a) => a.type === "overlapping_leave");
    expect(match).toBeUndefined();
  });

  it("fires medium alert for approved + handover not completed", () => {
    const rows = [makeRow({ approval_status: "approved", handover_completed: false })];
    const alerts = computeStaffAnnualLeaveAlerts(rows);
    const match = alerts.find((a) => a.type === "handover_not_completed");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});

// -- generateStaffAnnualLeaveCaraInsights -------------------------------------

describe("generateStaffAnnualLeaveCaraInsights", () => {
  it("returns 3 insights for empty data", () => {
    const m = computeStaffAnnualLeaveMetrics([]);
    const a = computeStaffAnnualLeaveAlerts([]);
    const insights = generateStaffAnnualLeaveCaraInsights(m, a);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[pink]");
    expect(insights[2]).toContain("[reflect]");
  });
});
