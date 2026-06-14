// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF PAYROLL COMPLIANCE SERVICE TESTS
// Pure-function unit tests for payroll compliance metrics, alert
// identification, and Cara insight generation.
//
// CHR 2015 Reg 32 (fitness of workers — employment verification),
// CHR 2015 Reg 33 (employment of staff — payroll & contract requirements).
// The Pensions Act 2008 — automatic enrolment duties.
// Immigration, Asylum and Nationality Act 2006 — right to work obligations.
//
// Covers: Right to Work, Tax Code, Pension Enrolment, NI Verification,
// Holiday Entitlement, Pay Rate Review, HMRC Compliance checks.
//
// SCCIF: Leadership & Management — "Robust payroll compliance ensures
// staff are lawfully employed and fairly remunerated."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  type StaffPayrollComplianceRow,
  CHECK_TYPES,
  COMPLIANCE_STATUSES,
} from "../staff-payroll-compliance-service";

const { computeMetrics, computeAlerts, computeCaraInsights } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(overrides?: Partial<StaffPayrollComplianceRow>): StaffPayrollComplianceRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    staff_name: "staff_name" in (overrides ?? {}) ? overrides!.staff_name! : "Jane Smith",
    check_date: "check_date" in (overrides ?? {}) ? overrides!.check_date! : now.toISOString().split("T")[0],
    check_type: "check_type" in (overrides ?? {}) ? overrides!.check_type! : "Right to Work",
    compliance_status: "compliance_status" in (overrides ?? {}) ? overrides!.compliance_status! : "Compliant",
    right_to_work_verified: "right_to_work_verified" in (overrides ?? {}) ? overrides!.right_to_work_verified! : true,
    pension_enrolled: "pension_enrolled" in (overrides ?? {}) ? overrides!.pension_enrolled! : true,
    pension_opt_out: "pension_opt_out" in (overrides ?? {}) ? overrides!.pension_opt_out! : false,
    tax_code_verified: "tax_code_verified" in (overrides ?? {}) ? overrides!.tax_code_verified! : true,
    ni_number_verified: "ni_number_verified" in (overrides ?? {}) ? overrides!.ni_number_verified! : true,
    contract_on_file: "contract_on_file" in (overrides ?? {}) ? overrides!.contract_on_file! : true,
    pay_rate_confirmed: "pay_rate_confirmed" in (overrides ?? {}) ? overrides!.pay_rate_confirmed! : true,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : "2027-01-01",
    reviewer_name: "reviewer_name" in (overrides ?? {}) ? overrides!.reviewer_name! : "HR Manager",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Enum exports
// ══════════════════════════════════════════════════════════════════════════════

describe("enum exports", () => {
  it("CHECK_TYPES has 7 entries", () => {
    expect(CHECK_TYPES).toHaveLength(7);
  });

  it("CHECK_TYPES includes Right to Work", () => {
    expect(CHECK_TYPES).toContain("Right to Work");
  });

  it("CHECK_TYPES includes Tax Code", () => {
    expect(CHECK_TYPES).toContain("Tax Code");
  });

  it("CHECK_TYPES includes Pension Enrolment", () => {
    expect(CHECK_TYPES).toContain("Pension Enrolment");
  });

  it("CHECK_TYPES includes NI Verification", () => {
    expect(CHECK_TYPES).toContain("NI Verification");
  });

  it("CHECK_TYPES includes Holiday Entitlement", () => {
    expect(CHECK_TYPES).toContain("Holiday Entitlement");
  });

  it("CHECK_TYPES includes Pay Rate Review", () => {
    expect(CHECK_TYPES).toContain("Pay Rate Review");
  });

  it("CHECK_TYPES includes HMRC Compliance", () => {
    expect(CHECK_TYPES).toContain("HMRC Compliance");
  });

  it("CHECK_TYPES has unique values", () => {
    expect(new Set(CHECK_TYPES).size).toBe(CHECK_TYPES.length);
  });

  it("COMPLIANCE_STATUSES has 4 entries", () => {
    expect(COMPLIANCE_STATUSES).toHaveLength(4);
  });

  it("COMPLIANCE_STATUSES includes Compliant", () => {
    expect(COMPLIANCE_STATUSES).toContain("Compliant");
  });

  it("COMPLIANCE_STATUSES includes Non-Compliant", () => {
    expect(COMPLIANCE_STATUSES).toContain("Non-Compliant");
  });

  it("COMPLIANCE_STATUSES includes Action Required", () => {
    expect(COMPLIANCE_STATUSES).toContain("Action Required");
  });

  it("COMPLIANCE_STATUSES includes Pending Verification", () => {
    expect(COMPLIANCE_STATUSES).toContain("Pending Verification");
  });

  it("COMPLIANCE_STATUSES has unique values", () => {
    expect(new Set(COMPLIANCE_STATUSES).size).toBe(COMPLIANCE_STATUSES.length);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMetrics", () => {
  // ── Empty / baseline ────────────────────────────────────────────────────

  it("returns zeros for empty array", () => {
    const m = computeMetrics([]);
    expect(m.total_checks).toBe(0);
    expect(m.non_compliant_count).toBe(0);
    expect(m.action_required_count).toBe(0);
    expect(m.unique_staff).toBe(0);
    expect(m.unique_reviewers).toBe(0);
  });

  it("returns 0 rates for empty array", () => {
    const m = computeMetrics([]);
    expect(m.right_to_work_rate).toBe(0);
    expect(m.pension_enrolled_rate).toBe(0);
    expect(m.tax_code_rate).toBe(0);
    expect(m.ni_verified_rate).toBe(0);
    expect(m.contract_rate).toBe(0);
    expect(m.pay_rate_confirmed_rate).toBe(0);
    expect(m.review_scheduled_rate).toBe(0);
  });

  // ── total_checks ───────────────────────────────────────────────────────

  it("total_checks counts single record", () => {
    expect(computeMetrics([makeRow()]).total_checks).toBe(1);
  });

  it("total_checks counts multiple records", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    expect(computeMetrics(rows).total_checks).toBe(3);
  });

  it("total_checks counts 10 records", () => {
    const rows = Array.from({ length: 10 }, () => makeRow());
    expect(computeMetrics(rows).total_checks).toBe(10);
  });

  // ── Status counts ───────────────────────────────────────────────────────

  it("counts non-compliant", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Non-Compliant" })]).non_compliant_count).toBe(1);
  });

  it("counts action required", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Action Required" })]).action_required_count).toBe(1);
  });

  it("does not count Compliant as non-compliant", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Compliant" })]);
    expect(m.non_compliant_count).toBe(0);
  });

  it("does not count Compliant as action required", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Compliant" })]);
    expect(m.action_required_count).toBe(0);
  });

  it("does not count Pending Verification as non-compliant", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Pending Verification" })]);
    expect(m.non_compliant_count).toBe(0);
  });

  it("does not count Pending Verification as action required", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Pending Verification" })]);
    expect(m.action_required_count).toBe(0);
  });

  it("does not count Action Required as non-compliant", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Action Required" })]);
    expect(m.non_compliant_count).toBe(0);
  });

  it("does not count Non-Compliant as action required", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Non-Compliant" })]);
    expect(m.action_required_count).toBe(0);
  });

  it("counts multiple non-compliant", () => {
    const rows = [
      makeRow({ compliance_status: "Non-Compliant" }),
      makeRow({ compliance_status: "Non-Compliant" }),
      makeRow({ compliance_status: "Compliant" }),
    ];
    expect(computeMetrics(rows).non_compliant_count).toBe(2);
  });

  it("counts multiple action required", () => {
    const rows = [
      makeRow({ compliance_status: "Action Required" }),
      makeRow({ compliance_status: "Action Required" }),
      makeRow({ compliance_status: "Action Required" }),
    ];
    expect(computeMetrics(rows).action_required_count).toBe(3);
  });

  // ── Boolean rates ───────────────────────────────────────────────────────

  it("returns 100% for all boolean rates when defaults are true", () => {
    const m = computeMetrics([makeRow()]);
    expect(m.right_to_work_rate).toBe(100);
    expect(m.tax_code_rate).toBe(100);
    expect(m.ni_verified_rate).toBe(100);
    expect(m.contract_rate).toBe(100);
    expect(m.pay_rate_confirmed_rate).toBe(100);
  });

  it("pension_enrolled_rate is 100 when true", () => {
    expect(computeMetrics([makeRow({ pension_enrolled: true })]).pension_enrolled_rate).toBe(100);
  });

  it("right_to_work_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ right_to_work_verified: false })]).right_to_work_rate).toBe(0);
  });

  it("pension_enrolled_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ pension_enrolled: false })]).pension_enrolled_rate).toBe(0);
  });

  it("tax_code_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ tax_code_verified: false })]).tax_code_rate).toBe(0);
  });

  it("ni_verified_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ ni_number_verified: false })]).ni_verified_rate).toBe(0);
  });

  it("contract_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ contract_on_file: false })]).contract_rate).toBe(0);
  });

  it("pay_rate_confirmed_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ pay_rate_confirmed: false })]).pay_rate_confirmed_rate).toBe(0);
  });

  it("mixed right_to_work_rate computes correctly (66.7%)", () => {
    const rows = [
      makeRow({ right_to_work_verified: true }),
      makeRow({ right_to_work_verified: true }),
      makeRow({ right_to_work_verified: false }),
    ];
    expect(computeMetrics(rows).right_to_work_rate).toBe(66.7);
  });

  it("mixed pension_enrolled_rate computes correctly (50%)", () => {
    const rows = [
      makeRow({ pension_enrolled: true }),
      makeRow({ pension_enrolled: false }),
    ];
    expect(computeMetrics(rows).pension_enrolled_rate).toBe(50);
  });

  it("mixed tax_code_rate computes correctly (33.3%)", () => {
    const rows = [
      makeRow({ tax_code_verified: true }),
      makeRow({ tax_code_verified: false }),
      makeRow({ tax_code_verified: false }),
    ];
    expect(computeMetrics(rows).tax_code_rate).toBe(33.3);
  });

  it("mixed ni_verified_rate computes correctly (25%)", () => {
    const rows = [
      makeRow({ ni_number_verified: true }),
      makeRow({ ni_number_verified: false }),
      makeRow({ ni_number_verified: false }),
      makeRow({ ni_number_verified: false }),
    ];
    expect(computeMetrics(rows).ni_verified_rate).toBe(25);
  });

  it("mixed contract_rate computes correctly (75%)", () => {
    const rows = [
      makeRow({ contract_on_file: true }),
      makeRow({ contract_on_file: true }),
      makeRow({ contract_on_file: true }),
      makeRow({ contract_on_file: false }),
    ];
    expect(computeMetrics(rows).contract_rate).toBe(75);
  });

  it("mixed pay_rate_confirmed_rate computes correctly (50%)", () => {
    const rows = [
      makeRow({ pay_rate_confirmed: true }),
      makeRow({ pay_rate_confirmed: false }),
    ];
    expect(computeMetrics(rows).pay_rate_confirmed_rate).toBe(50);
  });

  // ── review_scheduled_rate ──────────────────────────────────────────────

  it("review_scheduled_rate is 100 when all have next_review_date", () => {
    const rows = [makeRow({ next_review_date: "2027-01-01" }), makeRow({ next_review_date: "2027-06-01" })];
    expect(computeMetrics(rows).review_scheduled_rate).toBe(100);
  });

  it("review_scheduled_rate is 0 when all have null next_review_date", () => {
    const rows = [makeRow({ next_review_date: null }), makeRow({ next_review_date: null })];
    expect(computeMetrics(rows).review_scheduled_rate).toBe(0);
  });

  it("review_scheduled_rate is 50 when mixed", () => {
    const rows = [makeRow({ next_review_date: "2027-01-01" }), makeRow({ next_review_date: null })];
    expect(computeMetrics(rows).review_scheduled_rate).toBe(50);
  });

  it("review_scheduled_rate computes correctly (66.7%)", () => {
    const rows = [
      makeRow({ next_review_date: "2027-01-01" }),
      makeRow({ next_review_date: "2027-06-01" }),
      makeRow({ next_review_date: null }),
    ];
    expect(computeMetrics(rows).review_scheduled_rate).toBe(66.7);
  });

  // ── unique_staff ────────────────────────────────────────────────────────

  it("unique_staff counts 1 for single record", () => {
    expect(computeMetrics([makeRow()]).unique_staff).toBe(1);
  });

  it("unique_staff counts distinct names", () => {
    const rows = [
      makeRow({ staff_name: "Alice Brown" }),
      makeRow({ staff_name: "Bob Green" }),
      makeRow({ staff_name: "Alice Brown" }),
    ];
    expect(computeMetrics(rows).unique_staff).toBe(2);
  });

  it("unique_staff counts all different names", () => {
    const rows = [
      makeRow({ staff_name: "Alice" }),
      makeRow({ staff_name: "Bob" }),
      makeRow({ staff_name: "Charlie" }),
    ];
    expect(computeMetrics(rows).unique_staff).toBe(3);
  });

  // ── unique_reviewers ──────────────────────────────────────────────────

  it("unique_reviewers counts 1 for single record", () => {
    expect(computeMetrics([makeRow()]).unique_reviewers).toBe(1);
  });

  it("unique_reviewers counts distinct reviewer names", () => {
    const rows = [
      makeRow({ reviewer_name: "Reviewer A" }),
      makeRow({ reviewer_name: "Reviewer B" }),
      makeRow({ reviewer_name: "Reviewer A" }),
    ];
    expect(computeMetrics(rows).unique_reviewers).toBe(2);
  });

  it("unique_reviewers counts all different reviewers", () => {
    const rows = [
      makeRow({ reviewer_name: "Reviewer A" }),
      makeRow({ reviewer_name: "Reviewer B" }),
      makeRow({ reviewer_name: "Reviewer C" }),
    ];
    expect(computeMetrics(rows).unique_reviewers).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("computeAlerts", () => {
  // ── Clean / empty ───────────────────────────────────────────────────────

  it("returns empty for empty array", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("returns empty for fully compliant record", () => {
    const alerts = computeAlerts([makeRow()]);
    expect(alerts).toEqual([]);
  });

  // ── Critical: right_to_work_not_verified ──────────────────────────────

  it("fires critical for right to work not verified", () => {
    const a = computeAlerts([makeRow({ right_to_work_verified: false })]);
    const c = a.filter((x) => x.type === "right_to_work_not_verified" && x.severity === "critical");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("right to work alert includes staff name", () => {
    const a = computeAlerts([makeRow({ right_to_work_verified: false, staff_name: "Alice Brown" })]);
    const c = a.filter((x) => x.type === "right_to_work_not_verified");
    expect(c[0].message).toContain("Alice Brown");
  });

  it("right to work alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-123", right_to_work_verified: false })]);
    const c = a.filter((x) => x.type === "right_to_work_not_verified");
    expect(c[0].record_id).toBe("rec-123");
  });

  it("right to work alert mentions illegal", () => {
    const a = computeAlerts([makeRow({ right_to_work_verified: false })]);
    const c = a.filter((x) => x.type === "right_to_work_not_verified");
    expect(c[0].message).toMatch(/illegal/i);
  });

  it("right to work alert references Immigration Act", () => {
    const a = computeAlerts([makeRow({ right_to_work_verified: false })]);
    const c = a.filter((x) => x.type === "right_to_work_not_verified");
    expect(c[0].message).toContain("Immigration");
  });

  it("does NOT fire right to work alert when verified", () => {
    const a = computeAlerts([makeRow({ right_to_work_verified: true })]);
    const c = a.filter((x) => x.type === "right_to_work_not_verified");
    expect(c.length).toBe(0);
  });

  it("fires right to work alert per-record for multiple unverified", () => {
    const rows = [
      makeRow({ id: "a-1", right_to_work_verified: false }),
      makeRow({ id: "a-2", right_to_work_verified: false }),
    ];
    const a = computeAlerts(rows);
    const c = a.filter((x) => x.type === "right_to_work_not_verified");
    expect(c.length).toBe(2);
  });

  // ── High: non_compliant_check ─────────────────────────────────────────

  it("fires high for Non-Compliant status", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Non-Compliant" })]);
    const h = a.filter((x) => x.type === "non_compliant_check" && x.severity === "high");
    expect(h.length).toBeGreaterThanOrEqual(1);
  });

  it("non-compliant alert includes staff name", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Non-Compliant", staff_name: "Bob Green" })]);
    const h = a.filter((x) => x.type === "non_compliant_check");
    expect(h[0].message).toContain("Bob Green");
  });

  it("non-compliant alert includes check type", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Non-Compliant", check_type: "Tax Code" })]);
    const h = a.filter((x) => x.type === "non_compliant_check");
    expect(h[0].message).toContain("Tax Code");
  });

  it("non-compliant alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-456", compliance_status: "Non-Compliant" })]);
    const h = a.filter((x) => x.type === "non_compliant_check");
    expect(h[0].record_id).toBe("rec-456");
  });

  it("non-compliant alert mentions HMRC", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Non-Compliant" })]);
    const h = a.filter((x) => x.type === "non_compliant_check");
    expect(h[0].message).toContain("HMRC");
  });

  it("does NOT fire non-compliant for Compliant status", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Compliant" })]);
    const h = a.filter((x) => x.type === "non_compliant_check");
    expect(h.length).toBe(0);
  });

  it("does NOT fire non-compliant for Action Required status", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Action Required" })]);
    const h = a.filter((x) => x.type === "non_compliant_check");
    expect(h.length).toBe(0);
  });

  it("does NOT fire non-compliant for Pending Verification status", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Pending Verification" })]);
    const h = a.filter((x) => x.type === "non_compliant_check");
    expect(h.length).toBe(0);
  });

  it("fires non-compliant per-record for multiple non-compliant", () => {
    const rows = [
      makeRow({ id: "a-1", compliance_status: "Non-Compliant" }),
      makeRow({ id: "a-2", compliance_status: "Non-Compliant" }),
    ];
    const a = computeAlerts(rows);
    const h = a.filter((x) => x.type === "non_compliant_check");
    expect(h.length).toBe(2);
  });

  // ── Medium: pension_auto_enrolment_due ────────────────────────────────

  it("fires medium for pension not enrolled and not opted out", () => {
    const a = computeAlerts([makeRow({ pension_enrolled: false, pension_opt_out: false })]);
    const m = a.filter((x) => x.type === "pension_auto_enrolment_due" && x.severity === "medium");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("pension alert includes staff name", () => {
    const a = computeAlerts([makeRow({ pension_enrolled: false, pension_opt_out: false, staff_name: "Charlie Davis" })]);
    const m = a.filter((x) => x.type === "pension_auto_enrolment_due");
    expect(m[0].message).toContain("Charlie Davis");
  });

  it("pension alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-789", pension_enrolled: false, pension_opt_out: false })]);
    const m = a.filter((x) => x.type === "pension_auto_enrolment_due");
    expect(m[0].record_id).toBe("rec-789");
  });

  it("pension alert references Pensions Act 2008", () => {
    const a = computeAlerts([makeRow({ pension_enrolled: false, pension_opt_out: false })]);
    const m = a.filter((x) => x.type === "pension_auto_enrolment_due");
    expect(m[0].message).toContain("Pensions Act 2008");
  });

  it("does NOT fire pension alert when enrolled", () => {
    const a = computeAlerts([makeRow({ pension_enrolled: true, pension_opt_out: false })]);
    const m = a.filter((x) => x.type === "pension_auto_enrolment_due");
    expect(m.length).toBe(0);
  });

  it("does NOT fire pension alert when opted out", () => {
    const a = computeAlerts([makeRow({ pension_enrolled: false, pension_opt_out: true })]);
    const m = a.filter((x) => x.type === "pension_auto_enrolment_due");
    expect(m.length).toBe(0);
  });

  it("does NOT fire pension alert when both enrolled and opted out", () => {
    const a = computeAlerts([makeRow({ pension_enrolled: true, pension_opt_out: true })]);
    const m = a.filter((x) => x.type === "pension_auto_enrolment_due");
    expect(m.length).toBe(0);
  });

  it("fires pension alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", pension_enrolled: false, pension_opt_out: false }),
      makeRow({ id: "a-2", pension_enrolled: false, pension_opt_out: false }),
    ];
    const a = computeAlerts(rows);
    const m = a.filter((x) => x.type === "pension_auto_enrolment_due");
    expect(m.length).toBe(2);
  });

  // ── Medium: contract_not_on_file ──────────────────────────────────────

  it("fires medium for contract not on file", () => {
    const a = computeAlerts([makeRow({ contract_on_file: false })]);
    const m = a.filter((x) => x.type === "contract_not_on_file" && x.severity === "medium");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("contract alert includes staff name", () => {
    const a = computeAlerts([makeRow({ contract_on_file: false, staff_name: "Diana Evans" })]);
    const m = a.filter((x) => x.type === "contract_not_on_file");
    expect(m[0].message).toContain("Diana Evans");
  });

  it("contract alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-abc", contract_on_file: false })]);
    const m = a.filter((x) => x.type === "contract_not_on_file");
    expect(m[0].record_id).toBe("rec-abc");
  });

  it("contract alert mentions written statement", () => {
    const a = computeAlerts([makeRow({ contract_on_file: false })]);
    const m = a.filter((x) => x.type === "contract_not_on_file");
    expect(m[0].message).toMatch(/written statement/i);
  });

  it("does NOT fire contract alert when contract_on_file is true", () => {
    const a = computeAlerts([makeRow({ contract_on_file: true })]);
    const m = a.filter((x) => x.type === "contract_not_on_file");
    expect(m.length).toBe(0);
  });

  it("fires contract alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", contract_on_file: false }),
      makeRow({ id: "a-2", contract_on_file: false }),
    ];
    const a = computeAlerts(rows);
    const m = a.filter((x) => x.type === "contract_not_on_file");
    expect(m.length).toBe(2);
  });

  // ── Combined alerts ─────────────────────────────────────────────────────

  it("fires all applicable alert types in worst-case scenario", () => {
    const rows = [
      makeRow({
        id: "a-1",
        compliance_status: "Non-Compliant",
        right_to_work_verified: false,
        pension_enrolled: false,
        pension_opt_out: false,
        contract_on_file: false,
      }),
    ];
    const a = computeAlerts(rows);
    const types = new Set(a.map((x) => x.type));
    expect(types.has("right_to_work_not_verified")).toBe(true);
    expect(types.has("non_compliant_check")).toBe(true);
    expect(types.has("pension_auto_enrolment_due")).toBe(true);
    expect(types.has("contract_not_on_file")).toBe(true);
  });

  it("alert severity levels are correct across mixed alerts", () => {
    const rows = [
      makeRow({
        id: "a-1",
        compliance_status: "Non-Compliant",
        right_to_work_verified: false,
        pension_enrolled: false,
        pension_opt_out: false,
        contract_on_file: false,
      }),
    ];
    const a = computeAlerts(rows);
    const criticals = a.filter((x) => x.severity === "critical");
    const highs = a.filter((x) => x.severity === "high");
    const mediums = a.filter((x) => x.severity === "medium");
    expect(criticals.length).toBeGreaterThan(0);
    expect(highs.length).toBeGreaterThan(0);
    expect(mediums.length).toBeGreaterThan(0);
  });

  it("single record can trigger multiple alerts", () => {
    const rows = [makeRow({
      id: "a-1",
      compliance_status: "Non-Compliant",
      right_to_work_verified: false,
      pension_enrolled: false,
      pension_opt_out: false,
      contract_on_file: false,
    })];
    const a = computeAlerts(rows);
    expect(a.length).toBeGreaterThanOrEqual(4);
  });

  it("no alerts when all checks are satisfied", () => {
    const rows = Array.from({ length: 5 }, () => makeRow());
    const a = computeAlerts(rows);
    expect(a).toEqual([]);
  });

  it("multiple records each trigger their own alerts independently", () => {
    const rows = [
      makeRow({ id: "a-1", right_to_work_verified: false }),
      makeRow({ id: "a-2", contract_on_file: false }),
    ];
    const a = computeAlerts(rows);
    const rtwAlerts = a.filter((x) => x.type === "right_to_work_not_verified");
    const contractAlerts = a.filter((x) => x.type === "contract_not_on_file");
    expect(rtwAlerts.length).toBe(1);
    expect(contractAlerts.length).toBe(1);
    expect(rtwAlerts[0].record_id).toBe("a-1");
    expect(contractAlerts[0].record_id).toBe("a-2");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeCaraInsights
// ══════════════════════════════════════════════════════════════════════════════

describe("computeCaraInsights", () => {
  // ── Structure ───────────────────────────────────────────────────────────

  it("returns exactly 3 insights for empty array", () => {
    const insights = computeCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("returns exactly 3 insights for single record", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights).toHaveLength(3);
  });

  it("returns exactly 3 insights for multiple records", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights).toHaveLength(3);
  });

  it("all insights are strings", () => {
    const insights = computeCaraInsights([makeRow()]);
    for (const i of insights) expect(typeof i).toBe("string");
  });

  it("all insights are non-empty", () => {
    const insights = computeCaraInsights([makeRow()]);
    for (const i of insights) expect(i.length).toBeGreaterThan(0);
  });

  // ── Insight 1: purple-themed summary ───────────────────────────────────

  it("first insight starts with [purple]", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toMatch(/^\[purple\]/);
  });

  it("first insight includes total check count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes unique staff count", () => {
    const rows = [
      makeRow({ staff_name: "Alice" }),
      makeRow({ staff_name: "Bob" }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("2");
  });

  it("first insight includes unique reviewer count", () => {
    const rows = [
      makeRow({ reviewer_name: "Reviewer A" }),
      makeRow({ reviewer_name: "Reviewer B" }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("2");
  });

  it("first insight includes non-compliant count", () => {
    const rows = [
      makeRow({ compliance_status: "Non-Compliant" }),
      makeRow({ compliance_status: "Compliant" }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("1 non-compliant");
  });

  it("first insight includes action required count", () => {
    const rows = [makeRow({ compliance_status: "Action Required" })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("1 action required");
  });

  it("first insight uses singular check for 1 record", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toContain("1 payroll compliance check");
    expect(insights[0]).not.toContain("checks recorded");
  });

  it("first insight uses plural checks for 2+ records", () => {
    const rows = [makeRow(), makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("checks");
  });

  it("first insight uses singular staff member for 1 staff", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toContain("staff member");
    expect(insights[0]).not.toContain("staff members reviewed");
  });

  it("first insight uses plural staff members for 2+ staff", () => {
    const rows = [makeRow({ staff_name: "Alice" }), makeRow({ staff_name: "Bob" })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("staff members");
  });

  it("first insight uses singular reviewer for 1 reviewer", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toContain("reviewer");
  });

  it("first insight uses plural reviewers for 2+ reviewers", () => {
    const rows = [makeRow({ reviewer_name: "Reviewer A" }), makeRow({ reviewer_name: "Reviewer B" })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("reviewers");
  });

  // ── Insight 2: amber-themed priorities ──────────────────────────────────

  it("second insight starts with [amber]", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions alerts when critical alerts exist", () => {
    const rows = [makeRow({ right_to_work_verified: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("critical");
  });

  it("second insight mentions no alerts when all compliant", () => {
    const rows = [makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toMatch(/[Nn]o critical/);
  });

  it("second insight includes right to work rate", () => {
    const rows = [makeRow({ right_to_work_verified: true }), makeRow({ right_to_work_verified: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes tax code rate", () => {
    const rows = [makeRow({ tax_code_verified: true }), makeRow({ tax_code_verified: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes pension enrolled rate when alerts present", () => {
    const rows = [
      makeRow({ pension_enrolled: true, right_to_work_verified: false }),
      makeRow({ pension_enrolled: false }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight mentions high-priority count when present", () => {
    const rows = [makeRow({ compliance_status: "Non-Compliant" })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("high-priority");
  });

  it("second insight mentions HMRC when no alerts", () => {
    const rows = [makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("HMRC");
  });

  // ── Insight 3: reflect-themed question ──────────────────────────────────

  it("third insight starts with [reflect]", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions critical alert count when present", () => {
    const rows = [makeRow({ right_to_work_verified: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("1");
    expect(insights[2]).toMatch(/critical/i);
  });

  it("third insight uses singular when 1 critical alert", () => {
    const rows = [makeRow({ right_to_work_verified: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("alert requires");
  });

  it("third insight uses plural when 2+ critical alerts", () => {
    const rows = [
      makeRow({ right_to_work_verified: false, staff_name: "Alice" }),
      makeRow({ right_to_work_verified: false, staff_name: "Bob" }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("alerts require");
  });

  it("third insight addresses pension when no critical alerts but rate < 100", () => {
    const rows = [
      makeRow({ pension_enrolled: false }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("pension");
  });

  it("third insight references Pensions Act 2008 when pension rate < 100", () => {
    const rows = [makeRow({ pension_enrolled: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("Pensions Act 2008");
  });

  it("third insight celebrates full compliance when all checks pass", () => {
    const rows = [
      makeRow({ pension_enrolled: true }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("compliance");
    expect(insights[2]).toContain("HMRC");
  });

  it("third insight mentions right to work when critical alerts present", () => {
    const rows = [makeRow({ right_to_work_verified: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("right to work");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CRUD (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD when Supabase disabled", () => {
  it("listStaffPayrollCompliance returns empty data", async () => {
    const { listStaffPayrollCompliance } = await import("../staff-payroll-compliance-service");
    const result = await listStaffPayrollCompliance("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("createStaffPayrollCompliance returns error", async () => {
    const { createStaffPayrollCompliance } = await import("../staff-payroll-compliance-service");
    const result = await createStaffPayrollCompliance({
      homeId: "home-1",
      staffName: "Jane Smith",
      checkDate: "2026-05-15",
      checkType: "Right to Work",
      complianceStatus: "Compliant",
      reviewerName: "HR Manager",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("updateStaffPayrollCompliance returns error", async () => {
    const { updateStaffPayrollCompliance } = await import("../staff-payroll-compliance-service");
    const result = await updateStaffPayrollCompliance("rec-1", { notes: "updated" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Edge cases
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("metrics handles single record with all false booleans", () => {
    const row = makeRow({
      right_to_work_verified: false,
      pension_enrolled: false,
      pension_opt_out: false,
      tax_code_verified: false,
      ni_number_verified: false,
      contract_on_file: false,
      pay_rate_confirmed: false,
    });
    const m = computeMetrics([row]);
    expect(m.right_to_work_rate).toBe(0);
    expect(m.pension_enrolled_rate).toBe(0);
    expect(m.tax_code_rate).toBe(0);
    expect(m.ni_verified_rate).toBe(0);
    expect(m.contract_rate).toBe(0);
    expect(m.pay_rate_confirmed_rate).toBe(0);
  });

  it("alerts for record with all flags triggering", () => {
    const row = makeRow({
      compliance_status: "Non-Compliant",
      right_to_work_verified: false,
      pension_enrolled: false,
      pension_opt_out: false,
      contract_on_file: false,
    });
    const a = computeAlerts([row]);
    expect(a.length).toBeGreaterThanOrEqual(4);
  });

  it("makeRow factory with overrides preserves overrides", () => {
    const row = makeRow({
      staff_name: "Custom Name",
      check_type: "Tax Code",
      compliance_status: "Non-Compliant",
    });
    expect(row.staff_name).toBe("Custom Name");
    expect(row.check_type).toBe("Tax Code");
    expect(row.compliance_status).toBe("Non-Compliant");
  });

  it("makeRow factory nullable fields have expected defaults", () => {
    const row = makeRow();
    expect(row.notes).toBeNull();
    expect(row.next_review_date).toBe("2027-01-01");
  });

  it("makeRow factory allows setting nullable fields", () => {
    const row = makeRow({
      next_review_date: "2028-01-01",
      notes: "Payroll check completed",
    });
    expect(row.next_review_date).toBe("2028-01-01");
    expect(row.notes).toBe("Payroll check completed");
  });

  it("makeRow factory allows explicitly setting nullable fields to null", () => {
    const row = makeRow({ next_review_date: null, notes: null });
    expect(row.next_review_date).toBeNull();
    expect(row.notes).toBeNull();
  });

  it("makeRow factory pension_enrolled defaults to true", () => {
    const row = makeRow();
    expect(row.pension_enrolled).toBe(true);
  });

  it("makeRow factory pension_opt_out defaults to false", () => {
    const row = makeRow();
    expect(row.pension_opt_out).toBe(false);
  });

  it("makeRow factory allows overriding pension fields", () => {
    const row = makeRow({ pension_enrolled: false, pension_opt_out: true });
    expect(row.pension_enrolled).toBe(false);
    expect(row.pension_opt_out).toBe(true);
  });

  it("metrics handles large dataset", () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      makeRow({
        staff_name: `Staff ${i % 10}`,
        reviewer_name: `Reviewer ${i % 5}`,
        compliance_status: COMPLIANCE_STATUSES[i % 4],
        right_to_work_verified: i % 3 !== 0,
      }),
    );
    const m = computeMetrics(rows);
    expect(m.total_checks).toBe(100);
    expect(m.unique_staff).toBe(10);
    expect(m.unique_reviewers).toBe(5);
    expect(m.non_compliant_count).toBe(25);
  });

  it("insights handle empty data gracefully", () => {
    const insights = computeCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("0 payroll compliance");
    expect(insights[0]).toContain("0 staff");
  });

  it("alerts handle no problematic records", () => {
    const rows = Array.from({ length: 5 }, () => makeRow());
    const a = computeAlerts(rows);
    expect(a).toEqual([]);
  });

  it("metrics with all four compliance statuses", () => {
    const rows = COMPLIANCE_STATUSES.map((s, i) => makeRow({ id: `a-${i}`, compliance_status: s }));
    const m = computeMetrics(rows);
    expect(m.total_checks).toBe(4);
    expect(m.non_compliant_count).toBe(1);
    expect(m.action_required_count).toBe(1);
  });

  it("right to work alert only fires for unverified, not for non-compliant status alone", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Non-Compliant", right_to_work_verified: true })]);
    const rtw = a.filter((x) => x.type === "right_to_work_not_verified");
    expect(rtw.length).toBe(0);
  });

  it("non-compliant alert does not fire for right_to_work_verified false alone", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Compliant", right_to_work_verified: false })]);
    const nc = a.filter((x) => x.type === "non_compliant_check");
    expect(nc.length).toBe(0);
  });

  it("metrics unique_reviewers with single reviewer across staff", () => {
    const rows = [
      makeRow({ staff_name: "Alice", reviewer_name: "Same Reviewer" }),
      makeRow({ staff_name: "Bob", reviewer_name: "Same Reviewer" }),
      makeRow({ staff_name: "Charlie", reviewer_name: "Same Reviewer" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_staff).toBe(3);
    expect(m.unique_reviewers).toBe(1);
  });

  it("metrics unique_staff with single staff across reviewers", () => {
    const rows = [
      makeRow({ staff_name: "Same Worker", reviewer_name: "Reviewer A" }),
      makeRow({ staff_name: "Same Worker", reviewer_name: "Reviewer B" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_staff).toBe(1);
    expect(m.unique_reviewers).toBe(2);
  });

  it("insights with only critical alerts show correct count", () => {
    const rows = [makeRow({ right_to_work_verified: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toMatch(/\d+ critical/);
  });

  it("insights with only high alerts show correct count", () => {
    const rows = [makeRow({ compliance_status: "Non-Compliant" })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toMatch(/\d+ high-priority/);
  });

  it("insights reflect question path for pension < 100%", () => {
    const rows = [makeRow({ pension_enrolled: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("pension");
    expect(insights[2]).toContain("0%");
  });

  it("all alert record_ids match the source row id", () => {
    const row = makeRow({
      id: "unique-test-id",
      compliance_status: "Non-Compliant",
      right_to_work_verified: false,
      pension_enrolled: false,
      pension_opt_out: false,
      contract_on_file: false,
    });
    const a = computeAlerts([row]);
    for (const alert of a) {
      expect(alert.record_id).toBe("unique-test-id");
    }
  });

  it("metrics with all seven check types", () => {
    const rows = CHECK_TYPES.map((t, i) => makeRow({ id: `a-${i}`, check_type: t }));
    const m = computeMetrics(rows);
    expect(m.total_checks).toBe(7);
  });

  it("pension alert does not fire when enrolled even with opt_out false", () => {
    const a = computeAlerts([makeRow({ pension_enrolled: true, pension_opt_out: false })]);
    const p = a.filter((x) => x.type === "pension_auto_enrolment_due");
    expect(p.length).toBe(0);
  });

  it("contract alert is independent of compliance status", () => {
    const a = computeAlerts([makeRow({ contract_on_file: false, compliance_status: "Compliant" })]);
    const c = a.filter((x) => x.type === "contract_not_on_file");
    expect(c.length).toBe(1);
  });

  it("right to work alert is independent of contract status", () => {
    const a = computeAlerts([makeRow({ right_to_work_verified: false, contract_on_file: true })]);
    const rtw = a.filter((x) => x.type === "right_to_work_not_verified");
    expect(rtw.length).toBe(1);
    const c = a.filter((x) => x.type === "contract_not_on_file");
    expect(c.length).toBe(0);
  });

  it("metrics review_scheduled_rate with 0 for empty", () => {
    const m = computeMetrics([]);
    expect(m.review_scheduled_rate).toBe(0);
  });

  it("insights with mixed critical and high alerts", () => {
    const rows = [
      makeRow({ right_to_work_verified: false }),
      makeRow({ compliance_status: "Non-Compliant" }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high-priority");
  });

  it("insights third path for full pension enrolment with no critical alerts", () => {
    const rows = [makeRow({ pension_enrolled: true })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("compliance");
  });
});
