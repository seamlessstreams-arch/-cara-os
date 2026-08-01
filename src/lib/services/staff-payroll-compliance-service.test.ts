import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
} from "./staff-payroll-compliance-service";
import type { StaffPayrollComplianceRow } from "./staff-payroll-compliance-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<StaffPayrollComplianceRow> = {}): StaffPayrollComplianceRow {
  return {
    id: "row-1",
    home_id: "home-1",
    staff_name: "Alice Smith",
    check_date: "2026-04-01",
    check_type: "Right to Work",
    compliance_status: "Compliant",
    right_to_work_verified: true,
    pension_enrolled: true,
    pension_opt_out: false,
    tax_code_verified: true,
    ni_number_verified: true,
    contract_on_file: true,
    pay_rate_confirmed: true,
    next_review_date: "2026-10-01",
    reviewer_name: "Manager A",
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics (payroll)", () => {
  it("returns zeroes for empty array", () => {
    const m = computeMetrics([]);
    expect(m.total_checks).toBe(0);
    expect(m.non_compliant_count).toBe(0);
    expect(m.action_required_count).toBe(0);
    expect(m.right_to_work_rate).toBeNull();;
    expect(m.pension_enrolled_rate).toBeNull();;
    expect(m.tax_code_rate).toBeNull();;
    expect(m.ni_verified_rate).toBeNull();;
    expect(m.contract_rate).toBeNull();;
    expect(m.pay_rate_confirmed_rate).toBeNull();;
    expect(m.review_scheduled_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
    expect(m.unique_reviewers).toBe(0);
  });

  it("counts compliance statuses correctly", () => {
    const rows = [
      makeRow({ id: "1", compliance_status: "Non-Compliant" }),
      makeRow({ id: "2", compliance_status: "Action Required" }),
      makeRow({ id: "3", compliance_status: "Compliant" }),
      makeRow({ id: "4", compliance_status: "Pending Verification" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_checks).toBe(4);
    expect(m.non_compliant_count).toBe(1);
    expect(m.action_required_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", right_to_work_verified: true, pension_enrolled: true }),
      makeRow({ id: "2", right_to_work_verified: false, pension_enrolled: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.right_to_work_rate).toBe(50);
    expect(m.pension_enrolled_rate).toBe(50);
  });

  it("calculates review scheduled rate from non-null next_review_date", () => {
    const rows = [
      makeRow({ id: "1", next_review_date: "2026-10-01" }),
      makeRow({ id: "2", next_review_date: null }),
    ];
    const m = computeMetrics(rows);
    expect(m.review_scheduled_rate).toBe(50);
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

  it("returns 100% rates when all booleans true", () => {
    const rows = [makeRow({ id: "1" }), makeRow({ id: "2" })];
    const m = computeMetrics(rows);
    expect(m.right_to_work_rate).toBe(100);
    expect(m.tax_code_rate).toBe(100);
    expect(m.ni_verified_rate).toBe(100);
    expect(m.contract_rate).toBe(100);
    expect(m.pay_rate_confirmed_rate).toBe(100);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts (payroll)", () => {
  it("returns no alerts for empty array", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("returns no alerts for fully compliant records", () => {
    const alerts = computeAlerts([makeRow()]);
    expect(alerts).toEqual([]);
  });

  it("fires critical for right to work not verified", () => {
    const rows = [makeRow({ id: "r1", right_to_work_verified: false, staff_name: "Alice" })];
    const alerts = computeAlerts(rows);
    const critical = alerts.filter((a) => a.severity === "critical");
    expect(critical.length).toBe(1);
    expect(critical[0].type).toBe("right_to_work_not_verified");
  });

  it("fires high for Non-Compliant status", () => {
    const rows = [makeRow({ id: "r1", compliance_status: "Non-Compliant" })];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "non_compliant_check");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("high");
  });

  it("fires medium for pension not enrolled and not opted out", () => {
    const rows = [makeRow({ id: "r1", pension_enrolled: false, pension_opt_out: false })];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "pension_auto_enrolment_due");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("medium");
  });

  it("does NOT fire pension alert when opted out", () => {
    const rows = [makeRow({ id: "r1", pension_enrolled: false, pension_opt_out: true })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((a) => a.type === "pension_auto_enrolment_due").length).toBe(0);
  });

  it("fires medium for contract not on file", () => {
    const rows = [makeRow({ id: "r1", contract_on_file: false })];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "contract_not_on_file");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("medium");
  });

  it("accumulates multiple alerts for the same record", () => {
    const rows = [
      makeRow({
        id: "r1",
        right_to_work_verified: false,
        compliance_status: "Non-Compliant",
        pension_enrolled: false,
        pension_opt_out: false,
        contract_on_file: false,
      }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.length).toBe(4);
  });
});
