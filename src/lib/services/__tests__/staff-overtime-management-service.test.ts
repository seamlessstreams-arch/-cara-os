// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF OVERTIME MANAGEMENT SERVICE TESTS
// Pure-function unit tests for overtime management metrics, alert
// identification, and Cara insight generation.
//
// Working Time Regulations 1998 — 48-hour weekly limit, rest breaks,
// night worker protections, opt-out provisions.
// CHR 2015 Reg 32 (fitness of workers — staff welfare and safe working hours).
//
// Covers: Contracted vs actual hours, overtime authorisation, TOIL accrual,
// 48-hour limit compliance, opt-out tracking, rest break compliance,
// night worker hours monitoring.
//
// SCCIF: Leadership & Management — "Staff work patterns and overtime are
// managed effectively to ensure safe staffing levels and regulatory compliance."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  type StaffOvertimeManagementRow,
  COMPLIANCE_STATUSES,
} from "../staff-overtime-management-service";

const { computeMetrics, computeAlerts, computeCaraInsights } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(overrides?: Partial<StaffOvertimeManagementRow>): StaffOvertimeManagementRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    review_date: "review_date" in (overrides ?? {}) ? overrides!.review_date! : now.toISOString().split("T")[0],
    reviewer_name: "reviewer_name" in (overrides ?? {}) ? overrides!.reviewer_name! : "Registered Manager",
    staff_name: "staff_name" in (overrides ?? {}) ? overrides!.staff_name! : "Jane Smith",
    review_period_start: "review_period_start" in (overrides ?? {}) ? overrides!.review_period_start! : "2026-04-01",
    review_period_end: "review_period_end" in (overrides ?? {}) ? overrides!.review_period_end! : "2026-04-30",
    contracted_hours: "contracted_hours" in (overrides ?? {}) ? overrides!.contracted_hours! : 37.5,
    actual_hours: "actual_hours" in (overrides ?? {}) ? overrides!.actual_hours! : 40,
    overtime_hours: "overtime_hours" in (overrides ?? {}) ? overrides!.overtime_hours! : 2.5,
    weekly_average_hours: "weekly_average_hours" in (overrides ?? {}) ? overrides!.weekly_average_hours! : 40,
    exceeds_48_hours: "exceeds_48_hours" in (overrides ?? {}) ? overrides!.exceeds_48_hours! : false,
    opt_out_signed: "opt_out_signed" in (overrides ?? {}) ? overrides!.opt_out_signed! : false,
    opt_out_date: "opt_out_date" in (overrides ?? {}) ? (overrides!.opt_out_date ?? null) : null,
    rest_break_compliant: "rest_break_compliant" in (overrides ?? {}) ? overrides!.rest_break_compliant! : true,
    night_worker: "night_worker" in (overrides ?? {}) ? overrides!.night_worker! : false,
    night_hours_compliant: "night_hours_compliant" in (overrides ?? {}) ? (overrides!.night_hours_compliant ?? null) : null,
    overtime_authorised: "overtime_authorised" in (overrides ?? {}) ? overrides!.overtime_authorised! : true,
    overtime_paid: "overtime_paid" in (overrides ?? {}) ? overrides!.overtime_paid! : true,
    toil_accrued: "toil_accrued" in (overrides ?? {}) ? overrides!.toil_accrued! : false,
    compliance_status: "compliance_status" in (overrides ?? {}) ? overrides!.compliance_status! : "Compliant",
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
  // ── COMPLIANCE_STATUSES ────────────────────────────────────────────────
  it("COMPLIANCE_STATUSES has 4 entries", () => {
    expect(COMPLIANCE_STATUSES).toHaveLength(4);
  });

  it("COMPLIANCE_STATUSES includes Compliant", () => {
    expect(COMPLIANCE_STATUSES).toContain("Compliant");
  });

  it("COMPLIANCE_STATUSES includes Non-Compliant", () => {
    expect(COMPLIANCE_STATUSES).toContain("Non-Compliant");
  });

  it("COMPLIANCE_STATUSES includes Opt-Out Valid", () => {
    expect(COMPLIANCE_STATUSES).toContain("Opt-Out Valid");
  });

  it("COMPLIANCE_STATUSES includes Review Required", () => {
    expect(COMPLIANCE_STATUSES).toContain("Review Required");
  });

  it("COMPLIANCE_STATUSES has unique values", () => {
    expect(new Set(COMPLIANCE_STATUSES).size).toBe(COMPLIANCE_STATUSES.length);
  });

  it("COMPLIANCE_STATUSES is a readonly tuple", () => {
    expect(Array.isArray(COMPLIANCE_STATUSES)).toBe(true);
  });

  it("COMPLIANCE_STATUSES first entry is Compliant", () => {
    expect(COMPLIANCE_STATUSES[0]).toBe("Compliant");
  });

  it("COMPLIANCE_STATUSES last entry is Review Required", () => {
    expect(COMPLIANCE_STATUSES[3]).toBe("Review Required");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMetrics", () => {
  // ── Empty / baseline ────────────────────────────────────────────────────

  it("returns zeros for empty array", () => {
    const m = computeMetrics([]);
    expect(m.total_reviews).toBe(0);
    expect(m.exceeds_48_count).toBe(0);
    expect(m.non_compliant_count).toBe(0);
    expect(m.opt_out_count).toBe(0);
    expect(m.toil_accrued_count).toBe(0);
    expect(m.night_worker_count).toBe(0);
    expect(m.unique_staff).toBe(0);
    expect(m.unique_reviewers).toBe(0);
  });

  it("returns 0 rates for empty array", () => {
    const m = computeMetrics([]);
    expect(m.opt_out_rate).toBe(0);
    expect(m.rest_break_compliant_rate).toBe(0);
    expect(m.overtime_authorised_rate).toBe(0);
    expect(m.overtime_paid_rate).toBe(0);
  });

  it("returns 0 averages for empty array", () => {
    const m = computeMetrics([]);
    expect(m.avg_weekly_hours).toBe(0);
    expect(m.avg_overtime_hours).toBe(0);
    expect(m.avg_contracted_hours).toBe(0);
  });

  // ── total_reviews ──────────────────────────────────────────────────────

  it("total_reviews counts single record", () => {
    expect(computeMetrics([makeRow()]).total_reviews).toBe(1);
  });

  it("total_reviews counts multiple records", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    expect(computeMetrics(rows).total_reviews).toBe(3);
  });

  it("total_reviews counts 10 records", () => {
    const rows = Array.from({ length: 10 }, () => makeRow());
    expect(computeMetrics(rows).total_reviews).toBe(10);
  });

  // ── exceeds_48_count ──────────────────────────────────────────────────

  it("exceeds_48_count is 0 when none exceed", () => {
    expect(computeMetrics([makeRow({ exceeds_48_hours: false })]).exceeds_48_count).toBe(0);
  });

  it("exceeds_48_count counts exceeding records", () => {
    expect(computeMetrics([makeRow({ exceeds_48_hours: true })]).exceeds_48_count).toBe(1);
  });

  it("exceeds_48_count counts multiple exceeding", () => {
    const rows = [
      makeRow({ exceeds_48_hours: true }),
      makeRow({ exceeds_48_hours: true }),
      makeRow({ exceeds_48_hours: false }),
    ];
    expect(computeMetrics(rows).exceeds_48_count).toBe(2);
  });

  // ── non_compliant_count ───────────────────────────────────────────────

  it("non_compliant_count is 0 for compliant records", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Compliant" })]).non_compliant_count).toBe(0);
  });

  it("non_compliant_count counts Non-Compliant", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Non-Compliant" })]).non_compliant_count).toBe(1);
  });

  it("non_compliant_count does not count Opt-Out Valid", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Opt-Out Valid" })]).non_compliant_count).toBe(0);
  });

  it("non_compliant_count does not count Review Required", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Review Required" })]).non_compliant_count).toBe(0);
  });

  it("non_compliant_count counts multiple Non-Compliant", () => {
    const rows = [
      makeRow({ compliance_status: "Non-Compliant" }),
      makeRow({ compliance_status: "Non-Compliant" }),
      makeRow({ compliance_status: "Compliant" }),
    ];
    expect(computeMetrics(rows).non_compliant_count).toBe(2);
  });

  // ── opt_out_count ─────────────────────────────────────────────────────

  it("opt_out_count is 0 when none signed", () => {
    expect(computeMetrics([makeRow({ opt_out_signed: false })]).opt_out_count).toBe(0);
  });

  it("opt_out_count counts signed opt-outs", () => {
    expect(computeMetrics([makeRow({ opt_out_signed: true })]).opt_out_count).toBe(1);
  });

  it("opt_out_count counts multiple opt-outs", () => {
    const rows = [
      makeRow({ opt_out_signed: true }),
      makeRow({ opt_out_signed: true }),
      makeRow({ opt_out_signed: false }),
    ];
    expect(computeMetrics(rows).opt_out_count).toBe(2);
  });

  // ── toil_accrued_count ────────────────────────────────────────────────

  it("toil_accrued_count is 0 when none accrued", () => {
    expect(computeMetrics([makeRow({ toil_accrued: false })]).toil_accrued_count).toBe(0);
  });

  it("toil_accrued_count counts accrued TOIL", () => {
    expect(computeMetrics([makeRow({ toil_accrued: true })]).toil_accrued_count).toBe(1);
  });

  it("toil_accrued_count counts multiple TOIL records", () => {
    const rows = [
      makeRow({ toil_accrued: true }),
      makeRow({ toil_accrued: true }),
      makeRow({ toil_accrued: false }),
    ];
    expect(computeMetrics(rows).toil_accrued_count).toBe(2);
  });

  // ── night_worker_count ────────────────────────────────────────────────

  it("night_worker_count is 0 when none are night workers", () => {
    expect(computeMetrics([makeRow({ night_worker: false })]).night_worker_count).toBe(0);
  });

  it("night_worker_count counts night workers", () => {
    expect(computeMetrics([makeRow({ night_worker: true })]).night_worker_count).toBe(1);
  });

  it("night_worker_count counts multiple night workers", () => {
    const rows = [
      makeRow({ night_worker: true }),
      makeRow({ night_worker: true }),
      makeRow({ night_worker: false }),
    ];
    expect(computeMetrics(rows).night_worker_count).toBe(2);
  });

  // ── Boolean rates ─────────────────────────────────────────────────────

  it("returns 100% for default boolean rates when defaults are true", () => {
    const m = computeMetrics([makeRow()]);
    expect(m.rest_break_compliant_rate).toBe(100);
    expect(m.overtime_authorised_rate).toBe(100);
    expect(m.overtime_paid_rate).toBe(100);
  });

  it("opt_out_rate is 0 when none signed", () => {
    expect(computeMetrics([makeRow({ opt_out_signed: false })]).opt_out_rate).toBe(0);
  });

  it("opt_out_rate is 100 when all signed", () => {
    expect(computeMetrics([makeRow({ opt_out_signed: true })]).opt_out_rate).toBe(100);
  });

  it("rest_break_compliant_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ rest_break_compliant: false })]).rest_break_compliant_rate).toBe(0);
  });

  it("overtime_authorised_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ overtime_authorised: false })]).overtime_authorised_rate).toBe(0);
  });

  it("overtime_paid_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ overtime_paid: false })]).overtime_paid_rate).toBe(0);
  });

  it("mixed opt_out_rate computes correctly (66.7%)", () => {
    const rows = [
      makeRow({ opt_out_signed: true }),
      makeRow({ opt_out_signed: true }),
      makeRow({ opt_out_signed: false }),
    ];
    expect(computeMetrics(rows).opt_out_rate).toBe(66.7);
  });

  it("mixed rest_break_compliant_rate computes correctly (50%)", () => {
    const rows = [
      makeRow({ rest_break_compliant: true }),
      makeRow({ rest_break_compliant: false }),
    ];
    expect(computeMetrics(rows).rest_break_compliant_rate).toBe(50);
  });

  it("mixed overtime_authorised_rate computes correctly (33.3%)", () => {
    const rows = [
      makeRow({ overtime_authorised: true }),
      makeRow({ overtime_authorised: false }),
      makeRow({ overtime_authorised: false }),
    ];
    expect(computeMetrics(rows).overtime_authorised_rate).toBe(33.3);
  });

  it("mixed overtime_paid_rate computes correctly (25%)", () => {
    const rows = [
      makeRow({ overtime_paid: true }),
      makeRow({ overtime_paid: false }),
      makeRow({ overtime_paid: false }),
      makeRow({ overtime_paid: false }),
    ];
    expect(computeMetrics(rows).overtime_paid_rate).toBe(25);
  });

  it("mixed overtime_paid_rate computes correctly (75%)", () => {
    const rows = [
      makeRow({ overtime_paid: true }),
      makeRow({ overtime_paid: true }),
      makeRow({ overtime_paid: true }),
      makeRow({ overtime_paid: false }),
    ];
    expect(computeMetrics(rows).overtime_paid_rate).toBe(75);
  });

  // ── Numeric averages ──────────────────────────────────────────────────

  it("avg_weekly_hours for single record", () => {
    const m = computeMetrics([makeRow({ weekly_average_hours: 40 })]);
    expect(m.avg_weekly_hours).toBe(40);
  });

  it("avg_weekly_hours computes correctly for multiple records", () => {
    const rows = [
      makeRow({ weekly_average_hours: 35 }),
      makeRow({ weekly_average_hours: 45 }),
    ];
    expect(computeMetrics(rows).avg_weekly_hours).toBe(40);
  });

  it("avg_weekly_hours rounds to 1 decimal place", () => {
    const rows = [
      makeRow({ weekly_average_hours: 40 }),
      makeRow({ weekly_average_hours: 41 }),
      makeRow({ weekly_average_hours: 42 }),
    ];
    expect(computeMetrics(rows).avg_weekly_hours).toBe(41);
  });

  it("avg_weekly_hours rounds correctly (38.3)", () => {
    const rows = [
      makeRow({ weekly_average_hours: 35 }),
      makeRow({ weekly_average_hours: 40 }),
      makeRow({ weekly_average_hours: 40 }),
    ];
    expect(computeMetrics(rows).avg_weekly_hours).toBe(38.3);
  });

  it("avg_overtime_hours for single record", () => {
    const m = computeMetrics([makeRow({ overtime_hours: 5 })]);
    expect(m.avg_overtime_hours).toBe(5);
  });

  it("avg_overtime_hours computes correctly for multiple records", () => {
    const rows = [
      makeRow({ overtime_hours: 2 }),
      makeRow({ overtime_hours: 8 }),
    ];
    expect(computeMetrics(rows).avg_overtime_hours).toBe(5);
  });

  it("avg_overtime_hours rounds to 1 decimal place", () => {
    const rows = [
      makeRow({ overtime_hours: 1 }),
      makeRow({ overtime_hours: 2 }),
      makeRow({ overtime_hours: 3 }),
    ];
    expect(computeMetrics(rows).avg_overtime_hours).toBe(2);
  });

  it("avg_overtime_hours rounds correctly (3.3)", () => {
    const rows = [
      makeRow({ overtime_hours: 2 }),
      makeRow({ overtime_hours: 3 }),
      makeRow({ overtime_hours: 5 }),
    ];
    expect(computeMetrics(rows).avg_overtime_hours).toBe(3.3);
  });

  it("avg_contracted_hours for single record", () => {
    const m = computeMetrics([makeRow({ contracted_hours: 37.5 })]);
    expect(m.avg_contracted_hours).toBe(37.5);
  });

  it("avg_contracted_hours computes correctly for multiple records", () => {
    const rows = [
      makeRow({ contracted_hours: 30 }),
      makeRow({ contracted_hours: 40 }),
    ];
    expect(computeMetrics(rows).avg_contracted_hours).toBe(35);
  });

  it("avg_contracted_hours rounds to 1 decimal place", () => {
    const rows = [
      makeRow({ contracted_hours: 35 }),
      makeRow({ contracted_hours: 37 }),
      makeRow({ contracted_hours: 40 }),
    ];
    expect(computeMetrics(rows).avg_contracted_hours).toBe(37.3);
  });

  it("avg_contracted_hours with zero hours", () => {
    const rows = [
      makeRow({ contracted_hours: 0 }),
      makeRow({ contracted_hours: 40 }),
    ];
    expect(computeMetrics(rows).avg_contracted_hours).toBe(20);
  });

  it("avg_weekly_hours with zero hours", () => {
    const rows = [
      makeRow({ weekly_average_hours: 0 }),
      makeRow({ weekly_average_hours: 48 }),
    ];
    expect(computeMetrics(rows).avg_weekly_hours).toBe(24);
  });

  it("avg_overtime_hours with all zero", () => {
    const rows = [
      makeRow({ overtime_hours: 0 }),
      makeRow({ overtime_hours: 0 }),
    ];
    expect(computeMetrics(rows).avg_overtime_hours).toBe(0);
  });

  // ── unique_staff ──────────────────────────────────────────────────────

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
  // ── Clean / empty ─────────────────────────────────────────────────────

  it("returns empty for empty array", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("returns empty for fully compliant record", () => {
    const alerts = computeAlerts([makeRow()]);
    expect(alerts).toEqual([]);
  });

  // ── Critical: exceeds_48_no_opt_out ──────────────────────────────────

  it("fires critical for exceeds 48h without opt-out", () => {
    const a = computeAlerts([makeRow({ exceeds_48_hours: true, opt_out_signed: false })]);
    const c = a.filter((x) => x.type === "exceeds_48_no_opt_out" && x.severity === "critical");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("exceeds 48h alert includes staff name", () => {
    const a = computeAlerts([makeRow({ exceeds_48_hours: true, opt_out_signed: false, staff_name: "Alice Brown" })]);
    const c = a.filter((x) => x.type === "exceeds_48_no_opt_out");
    expect(c[0].message).toContain("Alice Brown");
  });

  it("exceeds 48h alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-123", exceeds_48_hours: true, opt_out_signed: false })]);
    const c = a.filter((x) => x.type === "exceeds_48_no_opt_out");
    expect(c[0].record_id).toBe("rec-123");
  });

  it("exceeds 48h alert mentions Working Time Regulations", () => {
    const a = computeAlerts([makeRow({ exceeds_48_hours: true, opt_out_signed: false })]);
    const c = a.filter((x) => x.type === "exceeds_48_no_opt_out");
    expect(c[0].message).toMatch(/Working Time Regulations/i);
  });

  it("does NOT fire exceeds 48h alert when opt-out signed", () => {
    const a = computeAlerts([makeRow({ exceeds_48_hours: true, opt_out_signed: true })]);
    const c = a.filter((x) => x.type === "exceeds_48_no_opt_out");
    expect(c.length).toBe(0);
  });

  it("does NOT fire exceeds 48h alert when not exceeding", () => {
    const a = computeAlerts([makeRow({ exceeds_48_hours: false, opt_out_signed: false })]);
    const c = a.filter((x) => x.type === "exceeds_48_no_opt_out");
    expect(c.length).toBe(0);
  });

  it("fires exceeds 48h alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", exceeds_48_hours: true, opt_out_signed: false }),
      makeRow({ id: "a-2", exceeds_48_hours: true, opt_out_signed: false }),
    ];
    const a = computeAlerts(rows);
    const c = a.filter((x) => x.type === "exceeds_48_no_opt_out");
    expect(c.length).toBe(2);
  });

  // ── High: rest_break_non_compliant ───────────────────────────────────

  it("fires high for rest break non-compliant", () => {
    const a = computeAlerts([makeRow({ rest_break_compliant: false })]);
    const h = a.filter((x) => x.type === "rest_break_non_compliant" && x.severity === "high");
    expect(h.length).toBeGreaterThanOrEqual(1);
  });

  it("rest break alert includes staff name", () => {
    const a = computeAlerts([makeRow({ rest_break_compliant: false, staff_name: "Bob Green" })]);
    const h = a.filter((x) => x.type === "rest_break_non_compliant");
    expect(h[0].message).toContain("Bob Green");
  });

  it("rest break alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-456", rest_break_compliant: false })]);
    const h = a.filter((x) => x.type === "rest_break_non_compliant");
    expect(h[0].record_id).toBe("rec-456");
  });

  it("rest break alert mentions Working Time Regulations", () => {
    const a = computeAlerts([makeRow({ rest_break_compliant: false })]);
    const h = a.filter((x) => x.type === "rest_break_non_compliant");
    expect(h[0].message).toMatch(/Working Time Regulations/i);
  });

  it("does NOT fire rest break alert when compliant", () => {
    const a = computeAlerts([makeRow({ rest_break_compliant: true })]);
    const h = a.filter((x) => x.type === "rest_break_non_compliant");
    expect(h.length).toBe(0);
  });

  it("fires rest break alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", rest_break_compliant: false }),
      makeRow({ id: "a-2", rest_break_compliant: false }),
    ];
    const a = computeAlerts(rows);
    const h = a.filter((x) => x.type === "rest_break_non_compliant");
    expect(h.length).toBe(2);
  });

  // ── High: night_hours_non_compliant ──────────────────────────────────

  it("fires high for night worker with non-compliant hours", () => {
    const a = computeAlerts([makeRow({ night_worker: true, night_hours_compliant: false })]);
    const h = a.filter((x) => x.type === "night_hours_non_compliant" && x.severity === "high");
    expect(h.length).toBeGreaterThanOrEqual(1);
  });

  it("night hours alert includes staff name", () => {
    const a = computeAlerts([makeRow({ night_worker: true, night_hours_compliant: false, staff_name: "Charlie Davis" })]);
    const h = a.filter((x) => x.type === "night_hours_non_compliant");
    expect(h[0].message).toContain("Charlie Davis");
  });

  it("night hours alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-789", night_worker: true, night_hours_compliant: false })]);
    const h = a.filter((x) => x.type === "night_hours_non_compliant");
    expect(h[0].record_id).toBe("rec-789");
  });

  it("night hours alert mentions night worker", () => {
    const a = computeAlerts([makeRow({ night_worker: true, night_hours_compliant: false })]);
    const h = a.filter((x) => x.type === "night_hours_non_compliant");
    expect(h[0].message).toMatch(/night worker/i);
  });

  it("does NOT fire night hours alert when night hours compliant", () => {
    const a = computeAlerts([makeRow({ night_worker: true, night_hours_compliant: true })]);
    const h = a.filter((x) => x.type === "night_hours_non_compliant");
    expect(h.length).toBe(0);
  });

  it("does NOT fire night hours alert when night_hours_compliant is null", () => {
    const a = computeAlerts([makeRow({ night_worker: true, night_hours_compliant: null })]);
    const h = a.filter((x) => x.type === "night_hours_non_compliant");
    expect(h.length).toBe(0);
  });

  it("does NOT fire night hours alert for non-night worker", () => {
    const a = computeAlerts([makeRow({ night_worker: false, night_hours_compliant: false })]);
    const h = a.filter((x) => x.type === "night_hours_non_compliant");
    expect(h.length).toBe(0);
  });

  it("fires night hours alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", night_worker: true, night_hours_compliant: false }),
      makeRow({ id: "a-2", night_worker: true, night_hours_compliant: false }),
    ];
    const a = computeAlerts(rows);
    const h = a.filter((x) => x.type === "night_hours_non_compliant");
    expect(h.length).toBe(2);
  });

  // ── Medium: overtime_not_authorised ──────────────────────────────────

  it("fires medium for overtime not authorised", () => {
    const a = computeAlerts([makeRow({ overtime_authorised: false })]);
    const m = a.filter((x) => x.type === "overtime_not_authorised" && x.severity === "medium");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("overtime not authorised alert includes staff name", () => {
    const a = computeAlerts([makeRow({ overtime_authorised: false, staff_name: "Diana Evans" })]);
    const m = a.filter((x) => x.type === "overtime_not_authorised");
    expect(m[0].message).toContain("Diana Evans");
  });

  it("overtime not authorised alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-abc", overtime_authorised: false })]);
    const m = a.filter((x) => x.type === "overtime_not_authorised");
    expect(m[0].record_id).toBe("rec-abc");
  });

  it("overtime not authorised alert mentions staffing or payroll", () => {
    const a = computeAlerts([makeRow({ overtime_authorised: false })]);
    const m = a.filter((x) => x.type === "overtime_not_authorised");
    expect(m[0].message).toMatch(/staffing|payroll/i);
  });

  it("does NOT fire overtime not authorised alert when authorised", () => {
    const a = computeAlerts([makeRow({ overtime_authorised: true })]);
    const m = a.filter((x) => x.type === "overtime_not_authorised");
    expect(m.length).toBe(0);
  });

  it("fires overtime not authorised per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", overtime_authorised: false }),
      makeRow({ id: "a-2", overtime_authorised: false }),
    ];
    const a = computeAlerts(rows);
    const m = a.filter((x) => x.type === "overtime_not_authorised");
    expect(m.length).toBe(2);
  });

  // ── Medium: exceeds_48_review_required ───────────────────────────────

  it("fires medium for exceeds 48h with opt-out but review required", () => {
    const a = computeAlerts([makeRow({ exceeds_48_hours: true, opt_out_signed: true, compliance_status: "Review Required" })]);
    const m = a.filter((x) => x.type === "exceeds_48_review_required" && x.severity === "medium");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("exceeds 48h review required alert includes staff name", () => {
    const a = computeAlerts([makeRow({ exceeds_48_hours: true, opt_out_signed: true, compliance_status: "Review Required", staff_name: "Eve Foster" })]);
    const m = a.filter((x) => x.type === "exceeds_48_review_required");
    expect(m[0].message).toContain("Eve Foster");
  });

  it("exceeds 48h review required alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-def", exceeds_48_hours: true, opt_out_signed: true, compliance_status: "Review Required" })]);
    const m = a.filter((x) => x.type === "exceeds_48_review_required");
    expect(m[0].record_id).toBe("rec-def");
  });

  it("exceeds 48h review required alert mentions opt-out", () => {
    const a = computeAlerts([makeRow({ exceeds_48_hours: true, opt_out_signed: true, compliance_status: "Review Required" })]);
    const m = a.filter((x) => x.type === "exceeds_48_review_required");
    expect(m[0].message).toMatch(/opt-out/i);
  });

  it("does NOT fire review required alert when status is Compliant", () => {
    const a = computeAlerts([makeRow({ exceeds_48_hours: true, opt_out_signed: true, compliance_status: "Compliant" })]);
    const m = a.filter((x) => x.type === "exceeds_48_review_required");
    expect(m.length).toBe(0);
  });

  it("does NOT fire review required alert when not exceeding 48h", () => {
    const a = computeAlerts([makeRow({ exceeds_48_hours: false, opt_out_signed: true, compliance_status: "Review Required" })]);
    const m = a.filter((x) => x.type === "exceeds_48_review_required");
    expect(m.length).toBe(0);
  });

  it("does NOT fire review required alert when no opt-out (fires critical instead)", () => {
    const a = computeAlerts([makeRow({ exceeds_48_hours: true, opt_out_signed: false, compliance_status: "Review Required" })]);
    const m = a.filter((x) => x.type === "exceeds_48_review_required");
    expect(m.length).toBe(0);
  });

  it("fires review required per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", exceeds_48_hours: true, opt_out_signed: true, compliance_status: "Review Required" }),
      makeRow({ id: "a-2", exceeds_48_hours: true, opt_out_signed: true, compliance_status: "Review Required" }),
    ];
    const a = computeAlerts(rows);
    const m = a.filter((x) => x.type === "exceeds_48_review_required");
    expect(m.length).toBe(2);
  });

  // ── Combined alerts ───────────────────────────────────────────────────

  it("fires all applicable alert types in worst-case scenario", () => {
    const rows = [
      makeRow({
        id: "a-1",
        exceeds_48_hours: true,
        opt_out_signed: false,
        rest_break_compliant: false,
        night_worker: true,
        night_hours_compliant: false,
        overtime_authorised: false,
      }),
    ];
    const a = computeAlerts(rows);
    const types = new Set(a.map((x) => x.type));
    expect(types.has("exceeds_48_no_opt_out")).toBe(true);
    expect(types.has("rest_break_non_compliant")).toBe(true);
    expect(types.has("night_hours_non_compliant")).toBe(true);
    expect(types.has("overtime_not_authorised")).toBe(true);
  });

  it("alert severity levels are correct across mixed alerts", () => {
    const rows = [
      makeRow({
        id: "a-1",
        exceeds_48_hours: true,
        opt_out_signed: false,
        rest_break_compliant: false,
        night_worker: true,
        night_hours_compliant: false,
        overtime_authorised: false,
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
      exceeds_48_hours: true,
      opt_out_signed: false,
      rest_break_compliant: false,
      night_worker: true,
      night_hours_compliant: false,
      overtime_authorised: false,
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
      makeRow({ id: "a-1", exceeds_48_hours: true, opt_out_signed: false }),
      makeRow({ id: "a-2", overtime_authorised: false }),
    ];
    const a = computeAlerts(rows);
    const critAlerts = a.filter((x) => x.type === "exceeds_48_no_opt_out");
    const medAlerts = a.filter((x) => x.type === "overtime_not_authorised");
    expect(critAlerts.length).toBe(1);
    expect(medAlerts.length).toBeGreaterThanOrEqual(1);
    expect(critAlerts[0].record_id).toBe("a-1");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeCaraInsights
// ══════════════════════════════════════════════════════════════════════════════

describe("computeCaraInsights", () => {
  // ── Structure ─────────────────────────────────────────────────────────

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

  // ── Insight 1: amber-themed summary ──────────────────────────────────

  it("first insight starts with [amber]", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toMatch(/^\[amber\]/);
  });

  it("first insight includes total review count", () => {
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

  it("first insight includes average weekly hours", () => {
    const rows = [makeRow({ weekly_average_hours: 42.5 })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("42.5");
  });

  it("first insight includes average overtime hours", () => {
    const rows = [makeRow({ overtime_hours: 5.5 })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("5.5");
  });

  it("first insight includes average contracted hours", () => {
    const rows = [makeRow({ contracted_hours: 37.5 })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("37.5");
  });

  it("first insight uses singular review for 1 record", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toContain("1 overtime review");
    expect(insights[0]).not.toContain("reviews recorded");
  });

  it("first insight uses plural reviews for 2+ records", () => {
    const rows = [makeRow(), makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("reviews");
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

  // ── Insight 2: orange-themed priorities ───────────────────────────────

  it("second insight starts with [orange]", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[1]).toMatch(/^\[orange\]/);
  });

  it("second insight mentions alerts when critical alerts exist", () => {
    const rows = [makeRow({ exceeds_48_hours: true, opt_out_signed: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("critical");
  });

  it("second insight mentions no alerts when all compliant", () => {
    const rows = [makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toMatch(/[Nn]o critical/);
  });

  it("second insight includes rest break compliant rate", () => {
    const rows = [makeRow({ rest_break_compliant: true }), makeRow({ rest_break_compliant: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes overtime authorised rate", () => {
    const rows = [makeRow({ overtime_authorised: true }), makeRow({ overtime_authorised: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes exceeds 48 count when alerts present", () => {
    const rows = [
      makeRow({ exceeds_48_hours: true, opt_out_signed: false }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("1");
  });

  it("second insight mentions high-priority count when present", () => {
    const rows = [makeRow({ rest_break_compliant: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("high-priority");
  });

  it("second insight mentions staff welfare when no alerts", () => {
    const rows = [makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("staff welfare");
  });

  // ── Insight 3: reflect-themed question ────────────────────────────────

  it("third insight starts with [reflect]", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions critical alert count when present", () => {
    const rows = [makeRow({ exceeds_48_hours: true, opt_out_signed: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("1");
    expect(insights[2]).toMatch(/critical/i);
  });

  it("third insight uses singular when 1 critical alert", () => {
    const rows = [makeRow({ exceeds_48_hours: true, opt_out_signed: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("alert requires");
  });

  it("third insight uses plural when 2+ critical alerts", () => {
    const rows = [
      makeRow({ exceeds_48_hours: true, opt_out_signed: false, staff_name: "Alice" }),
      makeRow({ exceeds_48_hours: true, opt_out_signed: false, staff_name: "Bob" }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("alerts require");
  });

  it("third insight addresses overtime authorisation rate when no critical alerts but rate < 100", () => {
    const rows = [
      makeRow({ overtime_authorised: false }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("overtime");
  });

  it("third insight mentions staff wellbeing when authorised rate < 100", () => {
    const rows = [makeRow({ overtime_authorised: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("wellbeing");
  });

  it("third insight celebrates full compliance when all checks pass", () => {
    const rows = [
      makeRow({ overtime_authorised: true }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("compliance");
    expect(insights[2]).toContain("Working Time Regulations");
  });

  it("third insight mentions opt-out when critical alerts present", () => {
    const rows = [makeRow({ exceeds_48_hours: true, opt_out_signed: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("opt-out");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CRUD (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD when Supabase disabled", () => {
  it("listStaffOvertimeManagement returns empty data", async () => {
    const { listStaffOvertimeManagement } = await import("../staff-overtime-management-service");
    const result = await listStaffOvertimeManagement("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("createStaffOvertimeManagement returns error", async () => {
    const { createStaffOvertimeManagement } = await import("../staff-overtime-management-service");
    const result = await createStaffOvertimeManagement({
      homeId: "home-1",
      reviewDate: "2026-05-15",
      reviewerName: "Registered Manager",
      staffName: "Jane Smith",
      reviewPeriodStart: "2026-04-01",
      reviewPeriodEnd: "2026-04-30",
      contractedHours: 37.5,
      actualHours: 40,
      weeklyAverageHours: 40,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("updateStaffOvertimeManagement returns error", async () => {
    const { updateStaffOvertimeManagement } = await import("../staff-overtime-management-service");
    const result = await updateStaffOvertimeManagement("rec-1", { notes: "updated" });
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
      exceeds_48_hours: false,
      opt_out_signed: false,
      rest_break_compliant: false,
      night_worker: false,
      overtime_authorised: false,
      overtime_paid: false,
      toil_accrued: false,
    });
    const m = computeMetrics([row]);
    expect(m.rest_break_compliant_rate).toBe(0);
    expect(m.overtime_authorised_rate).toBe(0);
    expect(m.overtime_paid_rate).toBe(0);
    expect(m.opt_out_rate).toBe(0);
  });

  it("alerts for record with all flags triggering", () => {
    const row = makeRow({
      exceeds_48_hours: true,
      opt_out_signed: false,
      rest_break_compliant: false,
      night_worker: true,
      night_hours_compliant: false,
      overtime_authorised: false,
    });
    const a = computeAlerts([row]);
    expect(a.length).toBeGreaterThanOrEqual(4);
  });

  it("makeRow factory with overrides preserves overrides", () => {
    const row = makeRow({
      staff_name: "Custom Name",
      compliance_status: "Non-Compliant",
      contracted_hours: 45,
    });
    expect(row.staff_name).toBe("Custom Name");
    expect(row.compliance_status).toBe("Non-Compliant");
    expect(row.contracted_hours).toBe(45);
  });

  it("makeRow factory nullable fields have expected defaults", () => {
    const row = makeRow();
    expect(row.notes).toBeNull();
    expect(row.opt_out_date).toBeNull();
    expect(row.night_hours_compliant).toBeNull();
  });

  it("makeRow factory allows setting nullable fields", () => {
    const row = makeRow({
      opt_out_date: "2026-03-01",
      night_hours_compliant: true,
      notes: "Under review",
    });
    expect(row.opt_out_date).toBe("2026-03-01");
    expect(row.night_hours_compliant).toBe(true);
    expect(row.notes).toBe("Under review");
  });

  it("makeRow factory allows explicitly setting nullable fields to null", () => {
    const row = makeRow({ opt_out_date: null, night_hours_compliant: null, notes: null });
    expect(row.opt_out_date).toBeNull();
    expect(row.night_hours_compliant).toBeNull();
    expect(row.notes).toBeNull();
  });

  it("makeRow factory rest_break_compliant defaults to true", () => {
    const row = makeRow();
    expect(row.rest_break_compliant).toBe(true);
  });

  it("makeRow factory overtime_authorised defaults to true", () => {
    const row = makeRow();
    expect(row.overtime_authorised).toBe(true);
  });

  it("makeRow factory allows overriding boolean fields", () => {
    const row = makeRow({ rest_break_compliant: false, overtime_authorised: false });
    expect(row.rest_break_compliant).toBe(false);
    expect(row.overtime_authorised).toBe(false);
  });

  it("metrics handles large dataset", () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      makeRow({
        staff_name: `Staff ${i % 10}`,
        reviewer_name: `Reviewer ${i % 5}`,
        compliance_status: COMPLIANCE_STATUSES[i % 4],
        rest_break_compliant: i % 3 !== 0,
      }),
    );
    const m = computeMetrics(rows);
    expect(m.total_reviews).toBe(100);
    expect(m.unique_staff).toBe(10);
    expect(m.unique_reviewers).toBe(5);
  });

  it("insights handle empty data gracefully", () => {
    const insights = computeCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("0 overtime");
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
    expect(m.total_reviews).toBe(4);
    expect(m.non_compliant_count).toBe(1);
  });

  it("exceeds 48h alert only fires when not opted out", () => {
    const a = computeAlerts([makeRow({ exceeds_48_hours: true, opt_out_signed: true })]);
    const c = a.filter((x) => x.type === "exceeds_48_no_opt_out");
    expect(c.length).toBe(0);
  });

  it("review required alert does not fire for non-exceeding records", () => {
    const a = computeAlerts([makeRow({ exceeds_48_hours: false, opt_out_signed: true, compliance_status: "Review Required" })]);
    const m = a.filter((x) => x.type === "exceeds_48_review_required");
    expect(m.length).toBe(0);
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
    const rows = [makeRow({ exceeds_48_hours: true, opt_out_signed: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toMatch(/\d+ critical/);
  });

  it("insights with only high alerts show correct count", () => {
    const rows = [makeRow({ rest_break_compliant: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toMatch(/\d+ high-priority/);
  });

  it("insights reflect question path for overtime authorised rate < 100%", () => {
    const rows = [makeRow({ overtime_authorised: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("overtime");
    expect(insights[2]).toContain("0%");
  });

  it("all alert record_ids match the source row id", () => {
    const row = makeRow({
      id: "unique-test-id",
      exceeds_48_hours: true,
      opt_out_signed: false,
      rest_break_compliant: false,
      night_worker: true,
      night_hours_compliant: false,
      overtime_authorised: false,
    });
    const a = computeAlerts([row]);
    for (const alert of a) {
      expect(alert.record_id).toBe("unique-test-id");
    }
  });

  it("night hours alert is independent of rest break compliance", () => {
    const a = computeAlerts([makeRow({ night_worker: true, night_hours_compliant: false, rest_break_compliant: true })]);
    const night = a.filter((x) => x.type === "night_hours_non_compliant");
    expect(night.length).toBe(1);
    const rest = a.filter((x) => x.type === "rest_break_non_compliant");
    expect(rest.length).toBe(0);
  });

  it("rest break alert is independent of night worker status", () => {
    const a = computeAlerts([makeRow({ rest_break_compliant: false, night_worker: false })]);
    const rest = a.filter((x) => x.type === "rest_break_non_compliant");
    expect(rest.length).toBe(1);
    const night = a.filter((x) => x.type === "night_hours_non_compliant");
    expect(night.length).toBe(0);
  });

  it("overtime not authorised alert is independent of compliance status", () => {
    const a = computeAlerts([makeRow({ overtime_authorised: false, compliance_status: "Compliant" })]);
    const ot = a.filter((x) => x.type === "overtime_not_authorised");
    expect(ot.length).toBe(1);
  });

  it("metrics opt_out_count with all false returns 0", () => {
    const rows = Array.from({ length: 5 }, () => makeRow({ opt_out_signed: false }));
    const m = computeMetrics(rows);
    expect(m.opt_out_count).toBe(0);
  });

  it("metrics toil_accrued_count with all false returns 0", () => {
    const rows = Array.from({ length: 5 }, () => makeRow({ toil_accrued: false }));
    const m = computeMetrics(rows);
    expect(m.toil_accrued_count).toBe(0);
  });

  it("insights with mixed critical and high alerts", () => {
    const rows = [
      makeRow({ exceeds_48_hours: true, opt_out_signed: false }),
      makeRow({ rest_break_compliant: false }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high-priority");
  });

  it("insights third path for full overtime authorised rate with no critical alerts", () => {
    const rows = [makeRow({ overtime_authorised: true })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("compliance");
  });

  it("exceeds 48h alert is independent of overtime authorised status", () => {
    const a = computeAlerts([makeRow({ exceeds_48_hours: true, opt_out_signed: false, overtime_authorised: true })]);
    const c = a.filter((x) => x.type === "exceeds_48_no_opt_out");
    expect(c.length).toBe(1);
    const ot = a.filter((x) => x.type === "overtime_not_authorised");
    expect(ot.length).toBe(0);
  });

  it("makeRow factory compliance_status defaults to Compliant", () => {
    const row = makeRow();
    expect(row.compliance_status).toBe("Compliant");
  });

  it("makeRow factory exceeds_48_hours defaults to false", () => {
    const row = makeRow();
    expect(row.exceeds_48_hours).toBe(false);
  });

  it("makeRow factory night_worker defaults to false", () => {
    const row = makeRow();
    expect(row.night_worker).toBe(false);
  });

  it("makeRow factory overtime_paid defaults to true", () => {
    const row = makeRow();
    expect(row.overtime_paid).toBe(true);
  });

  it("makeRow factory toil_accrued defaults to false", () => {
    const row = makeRow();
    expect(row.toil_accrued).toBe(false);
  });

  it("makeRow factory contracted_hours defaults to 37.5", () => {
    const row = makeRow();
    expect(row.contracted_hours).toBe(37.5);
  });

  it("makeRow factory actual_hours defaults to 40", () => {
    const row = makeRow();
    expect(row.actual_hours).toBe(40);
  });

  it("makeRow factory overtime_hours defaults to 2.5", () => {
    const row = makeRow();
    expect(row.overtime_hours).toBe(2.5);
  });

  it("makeRow factory weekly_average_hours defaults to 40", () => {
    const row = makeRow();
    expect(row.weekly_average_hours).toBe(40);
  });

  it("metrics avg_weekly_hours with decimal precision", () => {
    const rows = [
      makeRow({ weekly_average_hours: 37.5 }),
      makeRow({ weekly_average_hours: 42.3 }),
    ];
    const m = computeMetrics(rows);
    expect(m.avg_weekly_hours).toBe(39.9);
  });

  it("metrics avg_overtime_hours with decimal precision", () => {
    const rows = [
      makeRow({ overtime_hours: 1.5 }),
      makeRow({ overtime_hours: 3.7 }),
    ];
    const m = computeMetrics(rows);
    expect(m.avg_overtime_hours).toBe(2.6);
  });

  it("metrics avg_contracted_hours with decimal precision", () => {
    const rows = [
      makeRow({ contracted_hours: 37.5 }),
      makeRow({ contracted_hours: 40.5 }),
    ];
    const m = computeMetrics(rows);
    expect(m.avg_contracted_hours).toBe(39);
  });

  it("insights contain rest break compliant rate in orange section", () => {
    const rows = [makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("100%");
  });

  it("metrics handles single record with high numeric values", () => {
    const row = makeRow({
      contracted_hours: 80,
      actual_hours: 100,
      overtime_hours: 20,
      weekly_average_hours: 55,
    });
    const m = computeMetrics([row]);
    expect(m.avg_weekly_hours).toBe(55);
    expect(m.avg_overtime_hours).toBe(20);
    expect(m.avg_contracted_hours).toBe(80);
  });

  it("metrics handles records with zero numeric values", () => {
    const row = makeRow({
      contracted_hours: 0,
      actual_hours: 0,
      overtime_hours: 0,
      weekly_average_hours: 0,
    });
    const m = computeMetrics([row]);
    expect(m.avg_weekly_hours).toBe(0);
    expect(m.avg_overtime_hours).toBe(0);
    expect(m.avg_contracted_hours).toBe(0);
  });

  it("night hours alert does not fire when night_hours_compliant is true", () => {
    const a = computeAlerts([makeRow({ night_worker: true, night_hours_compliant: true })]);
    const h = a.filter((x) => x.type === "night_hours_non_compliant");
    expect(h.length).toBe(0);
  });

  it("review required alert fires only when all three conditions met", () => {
    // Only exceeds + opt-out, but compliant status
    const a1 = computeAlerts([makeRow({ exceeds_48_hours: true, opt_out_signed: true, compliance_status: "Opt-Out Valid" })]);
    expect(a1.filter((x) => x.type === "exceeds_48_review_required").length).toBe(0);

    // Only exceeds + review required, but no opt-out
    const a2 = computeAlerts([makeRow({ exceeds_48_hours: true, opt_out_signed: false, compliance_status: "Review Required" })]);
    expect(a2.filter((x) => x.type === "exceeds_48_review_required").length).toBe(0);

    // All three conditions met
    const a3 = computeAlerts([makeRow({ exceeds_48_hours: true, opt_out_signed: true, compliance_status: "Review Required" })]);
    expect(a3.filter((x) => x.type === "exceeds_48_review_required").length).toBe(1);
  });
});
