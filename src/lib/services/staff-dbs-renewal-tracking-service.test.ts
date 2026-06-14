import { describe, it, expect } from "vitest";
import {
  computeDbsMetrics,
  computeDbsAlerts,
  generateDbsCaraInsights,
} from "./staff-dbs-renewal-tracking-service";
import type { StaffDbsRenewalTrackingRow } from "./staff-dbs-renewal-tracking-service";

// -- Factory -------------------------------------------------------------------

function makeRow(overrides: Partial<StaffDbsRenewalTrackingRow> = {}): StaffDbsRenewalTrackingRow {
  return {
    id: "row-1",
    home_id: "home-1",
    staff_name: "Karen White",
    staff_id: "staff-1",
    check_date: "2026-01-15",
    dbs_type: "enhanced_barred",
    dbs_status: "current",
    check_outcome: "clear",
    renewal_priority: "routine",
    dbs_number: "DBS123456",
    issue_date: "2026-01-15",
    renewal_date: "2029-01-15",
    enhanced_check_completed: true,
    barred_list_checked: true,
    update_service_registered: true,
    identity_verified: true,
    right_to_work_confirmed: true,
    risk_assessment_completed: true,
    overseas_check_completed: true,
    references_verified: true,
    reviewer_name: "HR Manager",
    disclosed_information: null,
    notes: null,
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

// -- computeDbsMetrics ---------------------------------------------------------

describe("computeDbsMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeDbsMetrics([]);
    expect(m.total_checks).toBe(0);
    expect(m.expired_count).toBe(0);
    expect(m.renewal_due_count).toBe(0);
    expect(m.pending_count).toBe(0);
    expect(m.disclosed_count).toBe(0);
    expect(m.enhanced_check_rate).toBe(0);
    expect(m.barred_list_rate).toBe(0);
    expect(m.update_service_rate).toBe(0);
    expect(m.identity_verified_rate).toBe(0);
    expect(m.unique_staff).toBe(0);
  });

  it("counts status categories correctly", () => {
    const rows = [
      makeRow({ id: "1", dbs_status: "expired" }),
      makeRow({ id: "2", dbs_status: "renewal_due" }),
      makeRow({ id: "3", dbs_status: "pending" }),
      makeRow({ id: "4", check_outcome: "information_disclosed" }),
    ];
    const m = computeDbsMetrics(rows);
    expect(m.expired_count).toBe(1);
    expect(m.renewal_due_count).toBe(1);
    expect(m.pending_count).toBe(1);
    expect(m.disclosed_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", enhanced_check_completed: true, barred_list_checked: true }),
      makeRow({ id: "2", enhanced_check_completed: false, barred_list_checked: false }),
    ];
    const m = computeDbsMetrics(rows);
    expect(m.enhanced_check_rate).toBe(50);
    expect(m.barred_list_rate).toBe(50);
  });

  it("builds dbs_type_breakdown", () => {
    const rows = [
      makeRow({ id: "1", dbs_type: "enhanced" }),
      makeRow({ id: "2", dbs_type: "enhanced" }),
      makeRow({ id: "3", dbs_type: "basic" }),
    ];
    const m = computeDbsMetrics(rows);
    expect(m.dbs_type_breakdown).toEqual({ enhanced: 2, basic: 1 });
  });

  it("counts unique staff", () => {
    const rows = [
      makeRow({ id: "1", staff_name: "Alice" }),
      makeRow({ id: "2", staff_name: "Alice" }),
      makeRow({ id: "3", staff_name: "Bob" }),
    ];
    const m = computeDbsMetrics(rows);
    expect(m.unique_staff).toBe(2);
  });
});

// -- computeDbsAlerts ----------------------------------------------------------

describe("computeDbsAlerts", () => {
  it("returns empty array for empty rows", () => {
    expect(computeDbsAlerts([])).toEqual([]);
  });

  it("fires critical alert for expired DBS", () => {
    const rows = [makeRow({ dbs_status: "expired" })];
    const alerts = computeDbsAlerts(rows);
    const match = alerts.find((a) => a.type === "expired_dbs_still_working");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires critical alert for barred list not checked on enhanced type", () => {
    const rows = [makeRow({ barred_list_checked: false, dbs_type: "enhanced" })];
    const alerts = computeDbsAlerts(rows);
    const match = alerts.find((a) => a.type === "barred_list_not_checked");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires critical alert for barred list not checked on enhanced_barred type", () => {
    const rows = [makeRow({ barred_list_checked: false, dbs_type: "enhanced_barred" })];
    const alerts = computeDbsAlerts(rows);
    const match = alerts.find((a) => a.type === "barred_list_not_checked");
    expect(match).toBeDefined();
  });

  it("does NOT fire barred_list_not_checked for basic type", () => {
    const rows = [makeRow({ barred_list_checked: false, dbs_type: "basic" })];
    const alerts = computeDbsAlerts(rows);
    const match = alerts.find((a) => a.type === "barred_list_not_checked");
    expect(match).toBeUndefined();
  });

  it("fires high alert for overdue renewal priority", () => {
    const rows = [makeRow({ renewal_priority: "overdue" })];
    const alerts = computeDbsAlerts(rows);
    const match = alerts.find((a) => a.type === "renewal_overdue_priority");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for critical renewal priority", () => {
    const rows = [makeRow({ renewal_priority: "critical" })];
    const alerts = computeDbsAlerts(rows);
    const match = alerts.find((a) => a.type === "renewal_overdue_priority");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for enhanced check not completed on enhanced type", () => {
    const rows = [makeRow({ enhanced_check_completed: false, dbs_type: "enhanced" })];
    const alerts = computeDbsAlerts(rows);
    const match = alerts.find((a) => a.type === "enhanced_not_completed");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for update service not registered (non pending/not_applied)", () => {
    const rows = [makeRow({ update_service_registered: false, dbs_status: "current" })];
    const alerts = computeDbsAlerts(rows);
    const match = alerts.find((a) => a.type === "update_service_not_registered");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("does NOT fire update_service_not_registered for pending status", () => {
    const rows = [makeRow({ update_service_registered: false, dbs_status: "pending" })];
    const alerts = computeDbsAlerts(rows);
    const match = alerts.find((a) => a.type === "update_service_not_registered");
    expect(match).toBeUndefined();
  });

  it("fires medium alert for overseas check not completed", () => {
    const rows = [makeRow({ overseas_check_completed: false })];
    const alerts = computeDbsAlerts(rows);
    const match = alerts.find((a) => a.type === "overseas_check_not_completed");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});

// -- generateDbsCaraInsights ---------------------------------------------------

describe("generateDbsCaraInsights", () => {
  it("returns 3 insights for empty rows", () => {
    const insights = generateDbsCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[purple]");
    expect(insights[2]).toContain("[reflect]");
  });
});
