// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF NVQ/QCF QUALIFICATION TRACKING SERVICE TESTS
// Pure-function unit tests for NVQ qualification metrics, alert identification,
// and Cara insight generation.
//
// CHR 2015 Reg 32 (fitness of premises — qualification requirements),
// Reg 33 (employment — training requirements).
// Level 3 Diploma within 2 years of starting in role.
//
// Covers: qualification tracking, Reg 32 compliance, registration status,
// progress monitoring, assessor allocation, portfolio tracking, employer
// funding, study time, mentor assignment, and two-year deadline management.
//
// SCCIF: Leadership & Management — "Staff are suitably qualified."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  type StaffNvqQualificationTrackingRow,
  QUALIFICATION_LEVELS,
  QUALIFICATION_STATUSES,
  QUALIFICATION_TYPES,
  REGISTRATION_STATUSES,
} from "../staff-nvq-qualification-tracking-service";

const { computeNvqMetrics, computeNvqAlerts, generateNvqCaraInsights } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(overrides?: Partial<StaffNvqQualificationTrackingRow>): StaffNvqQualificationTrackingRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    staff_name: "staff_name" in (overrides ?? {}) ? overrides!.staff_name! : "Jane Smith",
    staff_id: "staff_id" in (overrides ?? {}) ? (overrides!.staff_id ?? null) : null,
    review_date: "review_date" in (overrides ?? {}) ? overrides!.review_date! : now.toISOString().split("T")[0],
    qualification_level: "qualification_level" in (overrides ?? {}) ? overrides!.qualification_level! : "level_3",
    qualification_status: "qualification_status" in (overrides ?? {}) ? overrides!.qualification_status! : "in_progress",
    qualification_type: "qualification_type" in (overrides ?? {}) ? overrides!.qualification_type! : "diploma_residential_childcare",
    registration_status: "registration_status" in (overrides ?? {}) ? overrides!.registration_status! : "registered",
    start_date: "start_date" in (overrides ?? {}) ? overrides!.start_date! : now.toISOString().split("T")[0],
    expected_completion_date: "expected_completion_date" in (overrides ?? {}) ? (overrides!.expected_completion_date ?? null) : null,
    actual_completion_date: "actual_completion_date" in (overrides ?? {}) ? (overrides!.actual_completion_date ?? null) : null,
    reg32_compliant: "reg32_compliant" in (overrides ?? {}) ? overrides!.reg32_compliant! : true,
    within_two_year_deadline: "within_two_year_deadline" in (overrides ?? {}) ? overrides!.within_two_year_deadline! : true,
    assessor_assigned: "assessor_assigned" in (overrides ?? {}) ? overrides!.assessor_assigned! : true,
    portfolio_progressing: "portfolio_progressing" in (overrides ?? {}) ? overrides!.portfolio_progressing! : true,
    employer_funded: "employer_funded" in (overrides ?? {}) ? overrides!.employer_funded! : true,
    study_time_allocated: "study_time_allocated" in (overrides ?? {}) ? overrides!.study_time_allocated! : true,
    mentor_assigned: "mentor_assigned" in (overrides ?? {}) ? overrides!.mentor_assigned! : true,
    registration_current: "registration_current" in (overrides ?? {}) ? overrides!.registration_current! : true,
    training_provider: "training_provider" in (overrides ?? {}) ? (overrides!.training_provider ?? null) : null,
    assessor_name: "assessor_name" in (overrides ?? {}) ? (overrides!.assessor_name ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// computeNvqMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeNvqMetrics", () => {
  // ── Empty / baseline ────────────────────────────────────────────────────

  it("returns zeros for empty array", () => {
    const m = computeNvqMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.completed_count).toBe(0);
    expect(m.in_progress_count).toBe(0);
    expect(m.not_started_count).toBe(0);
    expect(m.expired_count).toBe(0);
    expect(m.unique_staff).toBe(0);
  });

  it("returns empty breakdowns for empty array", () => {
    const m = computeNvqMetrics([]);
    expect(m.level_breakdown).toEqual({});
    expect(m.status_breakdown).toEqual({});
  });

  it("returns 0 rates for empty array", () => {
    const m = computeNvqMetrics([]);
    expect(m.reg32_compliant_rate).toBe(0);
    expect(m.within_deadline_rate).toBe(0);
    expect(m.assessor_assigned_rate).toBe(0);
    expect(m.portfolio_rate).toBe(0);
    expect(m.employer_funded_rate).toBe(0);
    expect(m.study_time_rate).toBe(0);
    expect(m.mentor_rate).toBe(0);
    expect(m.registration_current_rate).toBe(0);
  });

  // ── total_records ───────────────────────────────────────────────────────

  it("total_records counts single record", () => {
    expect(computeNvqMetrics([makeRow()]).total_records).toBe(1);
  });

  it("total_records counts multiple records", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    expect(computeNvqMetrics(rows).total_records).toBe(3);
  });

  // ── Status counts ───────────────────────────────────────────────────────

  it("counts completed", () => {
    expect(computeNvqMetrics([makeRow({ qualification_status: "completed" })]).completed_count).toBe(1);
  });

  it("counts in_progress", () => {
    expect(computeNvqMetrics([makeRow({ qualification_status: "in_progress" })]).in_progress_count).toBe(1);
  });

  it("counts not_started", () => {
    expect(computeNvqMetrics([makeRow({ qualification_status: "not_started" })]).not_started_count).toBe(1);
  });

  it("counts expired", () => {
    expect(computeNvqMetrics([makeRow({ qualification_status: "expired" })]).expired_count).toBe(1);
  });

  it("does not count enrolled as in_progress", () => {
    const m = computeNvqMetrics([makeRow({ qualification_status: "enrolled" })]);
    expect(m.in_progress_count).toBe(0);
    expect(m.completed_count).toBe(0);
  });

  it("does not count assessment_pending as completed", () => {
    const m = computeNvqMetrics([makeRow({ qualification_status: "assessment_pending" })]);
    expect(m.completed_count).toBe(0);
  });

  it("does not count exemption_granted as completed", () => {
    const m = computeNvqMetrics([makeRow({ qualification_status: "exemption_granted" })]);
    expect(m.completed_count).toBe(0);
  });

  it("counts multiple completed", () => {
    const rows = [
      makeRow({ qualification_status: "completed" }),
      makeRow({ qualification_status: "completed" }),
      makeRow({ qualification_status: "in_progress" }),
    ];
    expect(computeNvqMetrics(rows).completed_count).toBe(2);
  });

  // ── Boolean rates ───────────────────────────────────────────────────────

  it("returns 100% for all boolean rates when defaults are true", () => {
    const m = computeNvqMetrics([makeRow()]);
    expect(m.reg32_compliant_rate).toBe(100);
    expect(m.within_deadline_rate).toBe(100);
    expect(m.assessor_assigned_rate).toBe(100);
    expect(m.portfolio_rate).toBe(100);
    expect(m.employer_funded_rate).toBe(100);
    expect(m.study_time_rate).toBe(100);
    expect(m.mentor_rate).toBe(100);
    expect(m.registration_current_rate).toBe(100);
  });

  it("reg32_compliant_rate is 0 when false", () => {
    expect(computeNvqMetrics([makeRow({ reg32_compliant: false })]).reg32_compliant_rate).toBe(0);
  });

  it("within_deadline_rate is 0 when false", () => {
    expect(computeNvqMetrics([makeRow({ within_two_year_deadline: false })]).within_deadline_rate).toBe(0);
  });

  it("assessor_assigned_rate is 0 when false", () => {
    expect(computeNvqMetrics([makeRow({ assessor_assigned: false })]).assessor_assigned_rate).toBe(0);
  });

  it("portfolio_rate is 0 when false", () => {
    expect(computeNvqMetrics([makeRow({ portfolio_progressing: false })]).portfolio_rate).toBe(0);
  });

  it("employer_funded_rate is 0 when false", () => {
    expect(computeNvqMetrics([makeRow({ employer_funded: false })]).employer_funded_rate).toBe(0);
  });

  it("study_time_rate is 0 when false", () => {
    expect(computeNvqMetrics([makeRow({ study_time_allocated: false })]).study_time_rate).toBe(0);
  });

  it("mentor_rate is 0 when false", () => {
    expect(computeNvqMetrics([makeRow({ mentor_assigned: false })]).mentor_rate).toBe(0);
  });

  it("registration_current_rate is 0 when false", () => {
    expect(computeNvqMetrics([makeRow({ registration_current: false })]).registration_current_rate).toBe(0);
  });

  it("mixed boolean rate computes correctly (66.7%)", () => {
    const rows = [
      makeRow({ reg32_compliant: true }),
      makeRow({ reg32_compliant: true }),
      makeRow({ reg32_compliant: false }),
    ];
    expect(computeNvqMetrics(rows).reg32_compliant_rate).toBe(66.7);
  });

  it("mixed boolean rate computes correctly (50%)", () => {
    const rows = [
      makeRow({ assessor_assigned: true }),
      makeRow({ assessor_assigned: false }),
    ];
    expect(computeNvqMetrics(rows).assessor_assigned_rate).toBe(50);
  });

  it("mixed boolean rate computes correctly (33.3%)", () => {
    const rows = [
      makeRow({ employer_funded: true }),
      makeRow({ employer_funded: false }),
      makeRow({ employer_funded: false }),
    ];
    expect(computeNvqMetrics(rows).employer_funded_rate).toBe(33.3);
  });

  it("mixed boolean rate computes correctly (25%)", () => {
    const rows = [
      makeRow({ mentor_assigned: true }),
      makeRow({ mentor_assigned: false }),
      makeRow({ mentor_assigned: false }),
      makeRow({ mentor_assigned: false }),
    ];
    expect(computeNvqMetrics(rows).mentor_rate).toBe(25);
  });

  // ── unique_staff ────────────────────────────────────────────────────────

  it("unique_staff counts 1 for single record", () => {
    expect(computeNvqMetrics([makeRow()]).unique_staff).toBe(1);
  });

  it("unique_staff counts distinct names", () => {
    const rows = [
      makeRow({ staff_name: "Alice Brown" }),
      makeRow({ staff_name: "Bob Green" }),
      makeRow({ staff_name: "Alice Brown" }),
    ];
    expect(computeNvqMetrics(rows).unique_staff).toBe(2);
  });

  it("unique_staff counts all different names", () => {
    const rows = [
      makeRow({ staff_name: "Alice" }),
      makeRow({ staff_name: "Bob" }),
      makeRow({ staff_name: "Charlie" }),
    ];
    expect(computeNvqMetrics(rows).unique_staff).toBe(3);
  });

  // ── level_breakdown ─────────────────────────────────────────────────────

  it("level_breakdown counts all 6 levels", () => {
    const rows = QUALIFICATION_LEVELS.map((l, i) => makeRow({ id: `a-${i}`, qualification_level: l }));
    const m = computeNvqMetrics(rows);
    for (const l of QUALIFICATION_LEVELS) expect(m.level_breakdown[l]).toBe(1);
  });

  it("level_breakdown counts multiples of same level", () => {
    const rows = [
      makeRow({ qualification_level: "level_3" }),
      makeRow({ qualification_level: "level_3" }),
      makeRow({ qualification_level: "level_5" }),
    ];
    const m = computeNvqMetrics(rows);
    expect(m.level_breakdown["level_3"]).toBe(2);
    expect(m.level_breakdown["level_5"]).toBe(1);
  });

  it("level_breakdown does not include absent levels", () => {
    const rows = [makeRow({ qualification_level: "level_3" })];
    const m = computeNvqMetrics(rows);
    expect(m.level_breakdown["level_7"]).toBeUndefined();
  });

  // ── status_breakdown ────────────────────────────────────────────────────

  it("status_breakdown counts all 7 statuses", () => {
    const rows = QUALIFICATION_STATUSES.map((s, i) => makeRow({ id: `a-${i}`, qualification_status: s }));
    const m = computeNvqMetrics(rows);
    for (const s of QUALIFICATION_STATUSES) expect(m.status_breakdown[s]).toBe(1);
  });

  it("status_breakdown counts multiples of same status", () => {
    const rows = [
      makeRow({ qualification_status: "in_progress" }),
      makeRow({ qualification_status: "in_progress" }),
      makeRow({ qualification_status: "completed" }),
    ];
    const m = computeNvqMetrics(rows);
    expect(m.status_breakdown["in_progress"]).toBe(2);
    expect(m.status_breakdown["completed"]).toBe(1);
  });

  it("status_breakdown does not include absent statuses", () => {
    const rows = [makeRow({ qualification_status: "completed" })];
    const m = computeNvqMetrics(rows);
    expect(m.status_breakdown["expired"]).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeNvqAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("computeNvqAlerts", () => {
  // ── Clean / empty ───────────────────────────────────────────────────────

  it("returns empty for empty array", () => {
    expect(computeNvqAlerts([])).toEqual([]);
  });

  it("returns empty for fully compliant record", () => {
    expect(computeNvqAlerts([makeRow()])).toEqual([]);
  });

  it("returns empty for compliant completed record with current registration", () => {
    expect(computeNvqAlerts([makeRow({ qualification_status: "completed", reg32_compliant: true, registration_current: true })])).toEqual([]);
  });

  // ── Critical: reg32_non_compliant_not_progressing ───────────────────────

  it("fires critical for not reg32 compliant and not_started", () => {
    const a = computeNvqAlerts([makeRow({ reg32_compliant: false, qualification_status: "not_started" })]);
    const c = a.filter((x) => x.type === "reg32_non_compliant_not_progressing" && x.severity === "critical");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("critical alert includes staff name", () => {
    const a = computeNvqAlerts([makeRow({ reg32_compliant: false, qualification_status: "not_started", staff_name: "Alice Brown" })]);
    const c = a.filter((x) => x.type === "reg32_non_compliant_not_progressing");
    expect(c[0].message).toContain("Alice Brown");
  });

  it("critical alert includes record_id", () => {
    const a = computeNvqAlerts([makeRow({ id: "rec-123", reg32_compliant: false, qualification_status: "not_started" })]);
    const c = a.filter((x) => x.type === "reg32_non_compliant_not_progressing");
    expect(c[0].record_id).toBe("rec-123");
  });

  it("fires critical for not reg32 compliant and completed (edge case)", () => {
    const a = computeNvqAlerts([makeRow({ reg32_compliant: false, qualification_status: "completed" })]);
    const c = a.filter((x) => x.type === "reg32_non_compliant_not_progressing");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("fires critical for not reg32 compliant and expired", () => {
    const a = computeNvqAlerts([makeRow({ reg32_compliant: false, qualification_status: "expired" })]);
    const c = a.filter((x) => x.type === "reg32_non_compliant_not_progressing");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("fires critical for not reg32 compliant and assessment_pending", () => {
    const a = computeNvqAlerts([makeRow({ reg32_compliant: false, qualification_status: "assessment_pending" })]);
    const c = a.filter((x) => x.type === "reg32_non_compliant_not_progressing");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("fires critical for not reg32 compliant and exemption_granted", () => {
    const a = computeNvqAlerts([makeRow({ reg32_compliant: false, qualification_status: "exemption_granted" })]);
    const c = a.filter((x) => x.type === "reg32_non_compliant_not_progressing");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("does NOT fire critical when not reg32 compliant but in_progress", () => {
    const a = computeNvqAlerts([makeRow({ reg32_compliant: false, qualification_status: "in_progress" })]);
    const c = a.filter((x) => x.type === "reg32_non_compliant_not_progressing");
    expect(c.length).toBe(0);
  });

  it("does NOT fire critical when not reg32 compliant but enrolled", () => {
    const a = computeNvqAlerts([makeRow({ reg32_compliant: false, qualification_status: "enrolled" })]);
    const c = a.filter((x) => x.type === "reg32_non_compliant_not_progressing");
    expect(c.length).toBe(0);
  });

  it("does NOT fire critical when reg32 compliant", () => {
    const a = computeNvqAlerts([makeRow({ reg32_compliant: true, qualification_status: "not_started" })]);
    const c = a.filter((x) => x.type === "reg32_non_compliant_not_progressing");
    expect(c.length).toBe(0);
  });

  it("fires critical per-record for multiple non-compliant", () => {
    const rows = [
      makeRow({ id: "a-1", reg32_compliant: false, qualification_status: "not_started" }),
      makeRow({ id: "a-2", reg32_compliant: false, qualification_status: "expired" }),
    ];
    const a = computeNvqAlerts(rows);
    const c = a.filter((x) => x.type === "reg32_non_compliant_not_progressing");
    expect(c.length).toBe(2);
  });

  // ── High: overdue_completion ────────────────────────────────────────────

  it("fires high for past expected completion without actual completion", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 30);
    const a = computeNvqAlerts([makeRow({
      expected_completion_date: pastDate.toISOString().split("T")[0],
      actual_completion_date: null,
      qualification_status: "in_progress",
    })]);
    const h = a.filter((x) => x.type === "overdue_completion" && x.severity === "high");
    expect(h.length).toBeGreaterThanOrEqual(1);
  });

  it("overdue alert includes staff name", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 10);
    const a = computeNvqAlerts([makeRow({
      staff_name: "Bob Green",
      expected_completion_date: pastDate.toISOString().split("T")[0],
      actual_completion_date: null,
      qualification_status: "in_progress",
    })]);
    const h = a.filter((x) => x.type === "overdue_completion");
    expect(h[0].message).toContain("Bob Green");
  });

  it("overdue alert includes expected date", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 10);
    const dateStr = pastDate.toISOString().split("T")[0];
    const a = computeNvqAlerts([makeRow({
      expected_completion_date: dateStr,
      actual_completion_date: null,
      qualification_status: "in_progress",
    })]);
    const h = a.filter((x) => x.type === "overdue_completion");
    expect(h[0].message).toContain(dateStr);
  });

  it("overdue alert includes record_id", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 10);
    const a = computeNvqAlerts([makeRow({
      id: "rec-456",
      expected_completion_date: pastDate.toISOString().split("T")[0],
      actual_completion_date: null,
      qualification_status: "in_progress",
    })]);
    const h = a.filter((x) => x.type === "overdue_completion");
    expect(h[0].record_id).toBe("rec-456");
  });

  it("does NOT fire overdue when actual_completion_date is set", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 30);
    const a = computeNvqAlerts([makeRow({
      expected_completion_date: pastDate.toISOString().split("T")[0],
      actual_completion_date: pastDate.toISOString().split("T")[0],
      qualification_status: "in_progress",
    })]);
    const h = a.filter((x) => x.type === "overdue_completion");
    expect(h.length).toBe(0);
  });

  it("does NOT fire overdue when qualification_status is completed", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 30);
    const a = computeNvqAlerts([makeRow({
      expected_completion_date: pastDate.toISOString().split("T")[0],
      actual_completion_date: null,
      qualification_status: "completed",
    })]);
    const h = a.filter((x) => x.type === "overdue_completion");
    expect(h.length).toBe(0);
  });

  it("does NOT fire overdue when expected_completion_date is in future", () => {
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + 90);
    const a = computeNvqAlerts([makeRow({
      expected_completion_date: futureDate.toISOString().split("T")[0],
      actual_completion_date: null,
      qualification_status: "in_progress",
    })]);
    const h = a.filter((x) => x.type === "overdue_completion");
    expect(h.length).toBe(0);
  });

  it("does NOT fire overdue when no expected_completion_date", () => {
    const a = computeNvqAlerts([makeRow({
      expected_completion_date: null,
      actual_completion_date: null,
      qualification_status: "in_progress",
    })]);
    const h = a.filter((x) => x.type === "overdue_completion");
    expect(h.length).toBe(0);
  });

  // ── High: not_started_deadline_risk ─────────────────────────────────────

  it("fires high for not_started and not within deadline", () => {
    const a = computeNvqAlerts([makeRow({ qualification_status: "not_started", within_two_year_deadline: false })]);
    const h = a.filter((x) => x.type === "not_started_deadline_risk" && x.severity === "high");
    expect(h.length).toBeGreaterThanOrEqual(1);
  });

  it("deadline risk includes staff name", () => {
    const a = computeNvqAlerts([makeRow({ qualification_status: "not_started", within_two_year_deadline: false, staff_name: "Charlie Davis" })]);
    const h = a.filter((x) => x.type === "not_started_deadline_risk");
    expect(h[0].message).toContain("Charlie Davis");
  });

  it("does NOT fire deadline risk when within deadline", () => {
    const a = computeNvqAlerts([makeRow({ qualification_status: "not_started", within_two_year_deadline: true })]);
    const h = a.filter((x) => x.type === "not_started_deadline_risk");
    expect(h.length).toBe(0);
  });

  it("does NOT fire deadline risk when in_progress", () => {
    const a = computeNvqAlerts([makeRow({ qualification_status: "in_progress", within_two_year_deadline: false })]);
    const h = a.filter((x) => x.type === "not_started_deadline_risk");
    expect(h.length).toBe(0);
  });

  it("does NOT fire deadline risk when enrolled", () => {
    const a = computeNvqAlerts([makeRow({ qualification_status: "enrolled", within_two_year_deadline: false })]);
    const h = a.filter((x) => x.type === "not_started_deadline_risk");
    expect(h.length).toBe(0);
  });

  it("fires deadline risk per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", qualification_status: "not_started", within_two_year_deadline: false }),
      makeRow({ id: "a-2", qualification_status: "not_started", within_two_year_deadline: false }),
    ];
    const a = computeNvqAlerts(rows);
    const h = a.filter((x) => x.type === "not_started_deadline_risk");
    expect(h.length).toBe(2);
  });

  // ── Medium: no_assessor_in_progress ─────────────────────────────────────

  it("fires medium for in_progress without assessor", () => {
    const a = computeNvqAlerts([makeRow({ qualification_status: "in_progress", assessor_assigned: false })]);
    const m = a.filter((x) => x.type === "no_assessor_in_progress" && x.severity === "medium");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("no assessor alert includes staff name", () => {
    const a = computeNvqAlerts([makeRow({ qualification_status: "in_progress", assessor_assigned: false, staff_name: "Diana Evans" })]);
    const m = a.filter((x) => x.type === "no_assessor_in_progress");
    expect(m[0].message).toContain("Diana Evans");
  });

  it("no assessor alert includes record_id", () => {
    const a = computeNvqAlerts([makeRow({ id: "rec-789", qualification_status: "in_progress", assessor_assigned: false })]);
    const m = a.filter((x) => x.type === "no_assessor_in_progress");
    expect(m[0].record_id).toBe("rec-789");
  });

  it("does NOT fire no assessor when assessor_assigned is true", () => {
    const a = computeNvqAlerts([makeRow({ qualification_status: "in_progress", assessor_assigned: true })]);
    const m = a.filter((x) => x.type === "no_assessor_in_progress");
    expect(m.length).toBe(0);
  });

  it("does NOT fire no assessor when not in_progress", () => {
    const a = computeNvqAlerts([makeRow({ qualification_status: "enrolled", assessor_assigned: false })]);
    const m = a.filter((x) => x.type === "no_assessor_in_progress");
    expect(m.length).toBe(0);
  });

  it("does NOT fire no assessor for completed without assessor", () => {
    const a = computeNvqAlerts([makeRow({ qualification_status: "completed", assessor_assigned: false })]);
    const m = a.filter((x) => x.type === "no_assessor_in_progress");
    expect(m.length).toBe(0);
  });

  it("fires no assessor per-record for multiple in_progress", () => {
    const rows = [
      makeRow({ id: "a-1", qualification_status: "in_progress", assessor_assigned: false }),
      makeRow({ id: "a-2", qualification_status: "in_progress", assessor_assigned: false }),
    ];
    const a = computeNvqAlerts(rows);
    const m = a.filter((x) => x.type === "no_assessor_in_progress");
    expect(m.length).toBe(2);
  });

  // ── Medium: registration_lapsed_completed ───────────────────────────────

  it("fires medium for completed without current registration", () => {
    const a = computeNvqAlerts([makeRow({ qualification_status: "completed", registration_current: false })]);
    const m = a.filter((x) => x.type === "registration_lapsed_completed" && x.severity === "medium");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("registration lapsed alert includes staff name", () => {
    const a = computeNvqAlerts([makeRow({ qualification_status: "completed", registration_current: false, staff_name: "Eve Foster" })]);
    const m = a.filter((x) => x.type === "registration_lapsed_completed");
    expect(m[0].message).toContain("Eve Foster");
  });

  it("registration lapsed alert includes record_id", () => {
    const a = computeNvqAlerts([makeRow({ id: "rec-abc", qualification_status: "completed", registration_current: false })]);
    const m = a.filter((x) => x.type === "registration_lapsed_completed");
    expect(m[0].record_id).toBe("rec-abc");
  });

  it("does NOT fire registration lapsed when registration_current is true", () => {
    const a = computeNvqAlerts([makeRow({ qualification_status: "completed", registration_current: true })]);
    const m = a.filter((x) => x.type === "registration_lapsed_completed");
    expect(m.length).toBe(0);
  });

  it("does NOT fire registration lapsed when not completed", () => {
    const a = computeNvqAlerts([makeRow({ qualification_status: "in_progress", registration_current: false })]);
    const m = a.filter((x) => x.type === "registration_lapsed_completed");
    expect(m.length).toBe(0);
  });

  it("does NOT fire registration lapsed for not_started", () => {
    const a = computeNvqAlerts([makeRow({ qualification_status: "not_started", registration_current: false })]);
    const m = a.filter((x) => x.type === "registration_lapsed_completed");
    expect(m.length).toBe(0);
  });

  it("fires registration lapsed per-record for multiple completed", () => {
    const rows = [
      makeRow({ id: "a-1", qualification_status: "completed", registration_current: false }),
      makeRow({ id: "a-2", qualification_status: "completed", registration_current: false }),
    ];
    const a = computeNvqAlerts(rows);
    const m = a.filter((x) => x.type === "registration_lapsed_completed");
    expect(m.length).toBe(2);
  });

  // ── Combined alerts ─────────────────────────────────────────────────────

  it("fires all applicable alert types in worst-case scenario", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 30);
    const rows = [
      makeRow({ id: "a-1", reg32_compliant: false, qualification_status: "not_started", within_two_year_deadline: false }),
      makeRow({ id: "a-2", qualification_status: "in_progress", assessor_assigned: false, expected_completion_date: pastDate.toISOString().split("T")[0], actual_completion_date: null }),
      makeRow({ id: "a-3", qualification_status: "completed", registration_current: false }),
    ];
    const a = computeNvqAlerts(rows);
    const types = new Set(a.map((x) => x.type));
    expect(types.has("reg32_non_compliant_not_progressing")).toBe(true);
    expect(types.has("overdue_completion")).toBe(true);
    expect(types.has("not_started_deadline_risk")).toBe(true);
    expect(types.has("no_assessor_in_progress")).toBe(true);
    expect(types.has("registration_lapsed_completed")).toBe(true);
  });

  it("alert severity levels are correct", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 30);
    const rows = [
      makeRow({ id: "a-1", reg32_compliant: false, qualification_status: "not_started", within_two_year_deadline: false }),
      makeRow({ id: "a-2", qualification_status: "in_progress", assessor_assigned: false, expected_completion_date: pastDate.toISOString().split("T")[0], actual_completion_date: null }),
      makeRow({ id: "a-3", qualification_status: "completed", registration_current: false }),
    ];
    const a = computeNvqAlerts(rows);
    const criticals = a.filter((x) => x.severity === "critical");
    const highs = a.filter((x) => x.severity === "high");
    const mediums = a.filter((x) => x.severity === "medium");
    expect(criticals.length).toBeGreaterThan(0);
    expect(highs.length).toBeGreaterThan(0);
    expect(mediums.length).toBeGreaterThan(0);
  });

  it("single record can trigger multiple alerts", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 30);
    const rows = [makeRow({
      id: "a-1",
      reg32_compliant: false,
      qualification_status: "not_started",
      within_two_year_deadline: false,
      expected_completion_date: pastDate.toISOString().split("T")[0],
      actual_completion_date: null,
    })];
    const a = computeNvqAlerts(rows);
    expect(a.length).toBeGreaterThanOrEqual(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateNvqCaraInsights
// ══════════════════════════════════════════════════════════════════════════════

describe("generateNvqCaraInsights", () => {
  // ── Structure ───────────────────────────────────────────────────────────

  it("returns exactly 3 insights for empty array", () => {
    const insights = generateNvqCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("returns exactly 3 insights for single record", () => {
    const insights = generateNvqCaraInsights([makeRow()]);
    expect(insights).toHaveLength(3);
  });

  it("returns exactly 3 insights for multiple records", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const insights = generateNvqCaraInsights(rows);
    expect(insights).toHaveLength(3);
  });

  it("all insights are strings", () => {
    const insights = generateNvqCaraInsights([makeRow()]);
    for (const i of insights) expect(typeof i).toBe("string");
  });

  it("all insights are non-empty", () => {
    const insights = generateNvqCaraInsights([makeRow()]);
    for (const i of insights) expect(i.length).toBeGreaterThan(0);
  });

  // ── Insight 1: sky-themed summary ───────────────────────────────────────

  it("first insight starts with [sky]", () => {
    const insights = generateNvqCaraInsights([makeRow()]);
    expect(insights[0]).toMatch(/^\[sky\]/);
  });

  it("first insight includes total record count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const insights = generateNvqCaraInsights(rows);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes unique staff count", () => {
    const rows = [
      makeRow({ staff_name: "Alice" }),
      makeRow({ staff_name: "Bob" }),
    ];
    const insights = generateNvqCaraInsights(rows);
    expect(insights[0]).toContain("2");
  });

  it("first insight includes reg32 compliant rate", () => {
    const rows = [makeRow({ reg32_compliant: true }), makeRow({ reg32_compliant: false })];
    const insights = generateNvqCaraInsights(rows);
    expect(insights[0]).toContain("50%");
  });

  it("first insight includes completed count", () => {
    const rows = [
      makeRow({ qualification_status: "completed" }),
      makeRow({ qualification_status: "completed" }),
      makeRow({ qualification_status: "in_progress" }),
    ];
    const insights = generateNvqCaraInsights(rows);
    expect(insights[0]).toContain("2 completed");
  });

  it("first insight includes in_progress count", () => {
    const rows = [makeRow({ qualification_status: "in_progress" })];
    const insights = generateNvqCaraInsights(rows);
    expect(insights[0]).toContain("1 in progress");
  });

  it("first insight includes not_started count", () => {
    const rows = [makeRow({ qualification_status: "not_started" })];
    const insights = generateNvqCaraInsights(rows);
    expect(insights[0]).toContain("1 not yet started");
  });

  it("first insight uses singular member for 1 staff", () => {
    const insights = generateNvqCaraInsights([makeRow()]);
    expect(insights[0]).toContain("member");
    expect(insights[0]).not.toContain("members");
  });

  it("first insight uses plural members for 2+ staff", () => {
    const rows = [makeRow({ staff_name: "Alice" }), makeRow({ staff_name: "Bob" })];
    const insights = generateNvqCaraInsights(rows);
    expect(insights[0]).toContain("members");
  });

  // ── Insight 2: amber-themed priorities ──────────────────────────────────

  it("second insight starts with [amber]", () => {
    const insights = generateNvqCaraInsights([makeRow()]);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions alerts when critical alerts exist", () => {
    const rows = [makeRow({ reg32_compliant: false, qualification_status: "not_started" })];
    const insights = generateNvqCaraInsights(rows);
    expect(insights[1]).toContain("critical");
  });

  it("second insight mentions no alerts when all compliant", () => {
    const rows = [makeRow()];
    const insights = generateNvqCaraInsights(rows);
    expect(insights[1]).toMatch(/[Nn]o critical/);
  });

  it("second insight includes within deadline rate", () => {
    const rows = [makeRow({ within_two_year_deadline: true }), makeRow({ within_two_year_deadline: false })];
    const insights = generateNvqCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes assessor assigned rate", () => {
    const rows = [makeRow({ assessor_assigned: true }), makeRow({ assessor_assigned: false })];
    const insights = generateNvqCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes portfolio rate when alerts present", () => {
    const rows = [
      makeRow({ portfolio_progressing: true, reg32_compliant: false, qualification_status: "not_started" }),
      makeRow({ portfolio_progressing: false }),
    ];
    const insights = generateNvqCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  // ── Insight 3: reflect-themed question ──────────────────────────────────

  it("third insight starts with [reflect]", () => {
    const insights = generateNvqCaraInsights([makeRow()]);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions not started count when present", () => {
    const rows = [makeRow({ qualification_status: "not_started" })];
    const insights = generateNvqCaraInsights(rows);
    expect(insights[2]).toContain("1");
    expect(insights[2]).toContain("not yet started");
  });

  it("third insight uses singular when 1 not started", () => {
    const rows = [makeRow({ qualification_status: "not_started" })];
    const insights = generateNvqCaraInsights(rows);
    expect(insights[2]).toContain("member has");
  });

  it("third insight uses plural when 2+ not started", () => {
    const rows = [
      makeRow({ qualification_status: "not_started", staff_name: "Alice" }),
      makeRow({ qualification_status: "not_started", staff_name: "Bob" }),
    ];
    const insights = generateNvqCaraInsights(rows);
    expect(insights[2]).toContain("members have");
  });

  it("third insight addresses reg32 compliance when no not_started but rate < 100", () => {
    const rows = [
      makeRow({ qualification_status: "in_progress", reg32_compliant: false }),
    ];
    const insights = generateNvqCaraInsights(rows);
    expect(insights[2]).toContain("Reg 32");
  });

  it("third insight celebrates full compliance when all compliant and none not_started", () => {
    const rows = [
      makeRow({ qualification_status: "completed", reg32_compliant: true }),
    ];
    const insights = generateNvqCaraInsights(rows);
    expect(insights[2]).toContain("compliant");
  });

  it("third insight mentions Level 4/5 when all compliant", () => {
    const rows = [
      makeRow({ qualification_status: "completed", reg32_compliant: true }),
    ];
    const insights = generateNvqCaraInsights(rows);
    expect(insights[2]).toContain("Level 4/5");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Enum exports
// ══════════════════════════════════════════════════════════════════════════════

describe("enum exports", () => {
  it("QUALIFICATION_LEVELS has 6 entries", () => {
    expect(QUALIFICATION_LEVELS).toHaveLength(6);
  });

  it("QUALIFICATION_LEVELS includes level_2 through level_7", () => {
    expect(QUALIFICATION_LEVELS).toContain("level_2");
    expect(QUALIFICATION_LEVELS).toContain("level_3");
    expect(QUALIFICATION_LEVELS).toContain("level_4");
    expect(QUALIFICATION_LEVELS).toContain("level_5");
    expect(QUALIFICATION_LEVELS).toContain("level_6");
    expect(QUALIFICATION_LEVELS).toContain("level_7");
  });

  it("QUALIFICATION_STATUSES has 7 entries", () => {
    expect(QUALIFICATION_STATUSES).toHaveLength(7);
  });

  it("QUALIFICATION_STATUSES includes all values", () => {
    expect(QUALIFICATION_STATUSES).toContain("not_started");
    expect(QUALIFICATION_STATUSES).toContain("enrolled");
    expect(QUALIFICATION_STATUSES).toContain("in_progress");
    expect(QUALIFICATION_STATUSES).toContain("assessment_pending");
    expect(QUALIFICATION_STATUSES).toContain("completed");
    expect(QUALIFICATION_STATUSES).toContain("expired");
    expect(QUALIFICATION_STATUSES).toContain("exemption_granted");
  });

  it("QUALIFICATION_TYPES has 6 entries", () => {
    expect(QUALIFICATION_TYPES).toHaveLength(6);
  });

  it("QUALIFICATION_TYPES includes all values", () => {
    expect(QUALIFICATION_TYPES).toContain("diploma_residential_childcare");
    expect(QUALIFICATION_TYPES).toContain("diploma_leadership_management");
    expect(QUALIFICATION_TYPES).toContain("certificate_childcare");
    expect(QUALIFICATION_TYPES).toContain("nvq_health_social_care");
    expect(QUALIFICATION_TYPES).toContain("degree_social_work");
    expect(QUALIFICATION_TYPES).toContain("other");
  });

  it("REGISTRATION_STATUSES has 5 entries", () => {
    expect(REGISTRATION_STATUSES).toHaveLength(5);
  });

  it("REGISTRATION_STATUSES includes all values", () => {
    expect(REGISTRATION_STATUSES).toContain("registered");
    expect(REGISTRATION_STATUSES).toContain("pending_registration");
    expect(REGISTRATION_STATUSES).toContain("not_registered");
    expect(REGISTRATION_STATUSES).toContain("lapsed");
    expect(REGISTRATION_STATUSES).toContain("suspended");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CRUD (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD when Supabase disabled", () => {
  it("listStaffNvqQualificationTracking returns empty data", async () => {
    const { listStaffNvqQualificationTracking } = await import("../staff-nvq-qualification-tracking-service");
    const result = await listStaffNvqQualificationTracking("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("createStaffNvqQualificationTracking returns error", async () => {
    const { createStaffNvqQualificationTracking } = await import("../staff-nvq-qualification-tracking-service");
    const result = await createStaffNvqQualificationTracking({
      homeId: "home-1",
      staffName: "Jane Smith",
      reviewDate: "2026-05-15",
      qualificationLevel: "level_3",
      qualificationStatus: "in_progress",
      qualificationType: "diploma_residential_childcare",
      registrationStatus: "registered",
      startDate: "2025-01-01",
      reg32Compliant: true,
      withinTwoYearDeadline: true,
      assessorAssigned: true,
      portfolioProgressing: true,
      employerFunded: true,
      studyTimeAllocated: true,
      mentorAssigned: true,
      registrationCurrent: true,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("updateStaffNvqQualificationTracking returns error", async () => {
    const { updateStaffNvqQualificationTracking } = await import("../staff-nvq-qualification-tracking-service");
    const result = await updateStaffNvqQualificationTracking("rec-1", { notes: "updated" });
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
      reg32_compliant: false,
      within_two_year_deadline: false,
      assessor_assigned: false,
      portfolio_progressing: false,
      employer_funded: false,
      study_time_allocated: false,
      mentor_assigned: false,
      registration_current: false,
    });
    const m = computeNvqMetrics([row]);
    expect(m.reg32_compliant_rate).toBe(0);
    expect(m.within_deadline_rate).toBe(0);
    expect(m.assessor_assigned_rate).toBe(0);
    expect(m.portfolio_rate).toBe(0);
    expect(m.employer_funded_rate).toBe(0);
    expect(m.study_time_rate).toBe(0);
    expect(m.mentor_rate).toBe(0);
    expect(m.registration_current_rate).toBe(0);
  });

  it("alerts for record with all flags triggering", () => {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - 30);
    const row = makeRow({
      reg32_compliant: false,
      qualification_status: "not_started",
      within_two_year_deadline: false,
      expected_completion_date: pastDate.toISOString().split("T")[0],
      actual_completion_date: null,
    });
    const a = computeNvqAlerts([row]);
    expect(a.length).toBeGreaterThanOrEqual(2);
  });

  it("makeRow factory with overrides preserves overrides", () => {
    const row = makeRow({
      staff_name: "Custom Name",
      qualification_level: "level_5",
      qualification_status: "completed",
    });
    expect(row.staff_name).toBe("Custom Name");
    expect(row.qualification_level).toBe("level_5");
    expect(row.qualification_status).toBe("completed");
  });

  it("makeRow factory nullable fields are null by default", () => {
    const row = makeRow();
    expect(row.staff_id).toBeNull();
    expect(row.expected_completion_date).toBeNull();
    expect(row.actual_completion_date).toBeNull();
    expect(row.training_provider).toBeNull();
    expect(row.assessor_name).toBeNull();
    expect(row.notes).toBeNull();
  });

  it("makeRow factory allows setting nullable fields", () => {
    const row = makeRow({
      staff_id: "staff-123",
      expected_completion_date: "2027-01-01",
      actual_completion_date: "2026-12-01",
      training_provider: "City College",
      assessor_name: "John Assessor",
      notes: "On track",
    });
    expect(row.staff_id).toBe("staff-123");
    expect(row.expected_completion_date).toBe("2027-01-01");
    expect(row.actual_completion_date).toBe("2026-12-01");
    expect(row.training_provider).toBe("City College");
    expect(row.assessor_name).toBe("John Assessor");
    expect(row.notes).toBe("On track");
  });

  it("makeRow factory allows explicitly setting nullable fields to null", () => {
    const row = makeRow({ staff_id: null, notes: null });
    expect(row.staff_id).toBeNull();
    expect(row.notes).toBeNull();
  });

  it("metrics handles large dataset", () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      makeRow({
        staff_name: `Staff ${i % 10}`,
        qualification_status: i % 5 === 0 ? "completed" : "in_progress",
        qualification_level: QUALIFICATION_LEVELS[i % 6],
        reg32_compliant: i % 3 !== 0,
      }),
    );
    const m = computeNvqMetrics(rows);
    expect(m.total_records).toBe(100);
    expect(m.unique_staff).toBe(10);
    expect(m.completed_count).toBe(20);
    expect(m.in_progress_count).toBe(80);
  });

  it("insights handle empty data gracefully", () => {
    const insights = generateNvqCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("0 NVQ/QCF");
    expect(insights[0]).toContain("0 staff");
  });

  it("alerts handle no problematic records", () => {
    const rows = Array.from({ length: 5 }, () => makeRow());
    const a = computeNvqAlerts(rows);
    expect(a).toEqual([]);
  });
});
