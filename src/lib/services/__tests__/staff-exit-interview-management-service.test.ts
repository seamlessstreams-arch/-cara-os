// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF EXIT INTERVIEW MANAGEMENT SERVICE TESTS
// Pure-function unit tests for exit interview metrics, alert
// identification, and Cara insight generation.
//
// CHR 2015 Reg 33 (employment of staff — proper offboarding procedures),
// CHR 2015 Reg 34 (staff leaving — knowledge transfer and continuity of care).
// Safeguarding Vulnerable Groups Act 2006 — access revocation obligations.
//
// Covers: Departure reasons, knowledge transfer, equipment return, access
// revocation, final pay confirmation, reference agreements, compliance tracking.
//
// SCCIF: Leadership & Management — "Effective offboarding ensures continuity
// of care and safeguarding obligations are maintained during staff transitions."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  type StaffExitInterviewRow,
  DEPARTURE_REASONS,
  COMPLIANCE_STATUSES,
} from "../staff-exit-interview-management-service";

const { computeMetrics, computeAlerts, computeCaraInsights } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(overrides?: Partial<StaffExitInterviewRow>): StaffExitInterviewRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    interview_date: "interview_date" in (overrides ?? {}) ? overrides!.interview_date! : now.toISOString().split("T")[0],
    interviewer_name: "interviewer_name" in (overrides ?? {}) ? overrides!.interviewer_name! : "HR Manager",
    staff_name: "staff_name" in (overrides ?? {}) ? overrides!.staff_name! : "Jane Smith",
    departure_reason: "departure_reason" in (overrides ?? {}) ? overrides!.departure_reason! : "Resignation",
    departure_date: "departure_date" in (overrides ?? {}) ? overrides!.departure_date! : now.toISOString().split("T")[0],
    notice_period_met: "notice_period_met" in (overrides ?? {}) ? overrides!.notice_period_met! : true,
    knowledge_transfer_completed: "knowledge_transfer_completed" in (overrides ?? {}) ? overrides!.knowledge_transfer_completed! : true,
    handover_document_provided: "handover_document_provided" in (overrides ?? {}) ? overrides!.handover_document_provided! : true,
    equipment_returned: "equipment_returned" in (overrides ?? {}) ? overrides!.equipment_returned! : true,
    access_revoked: "access_revoked" in (overrides ?? {}) ? overrides!.access_revoked! : true,
    final_pay_confirmed: "final_pay_confirmed" in (overrides ?? {}) ? overrides!.final_pay_confirmed! : true,
    reference_agreed: "reference_agreed" in (overrides ?? {}) ? overrides!.reference_agreed! : true,
    satisfaction_rating: "satisfaction_rating" in (overrides ?? {}) ? (overrides!.satisfaction_rating ?? null) : 7,
    would_recommend: "would_recommend" in (overrides ?? {}) ? (overrides!.would_recommend ?? null) : true,
    compliance_status: "compliance_status" in (overrides ?? {}) ? overrides!.compliance_status! : "Complete",
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
  it("DEPARTURE_REASONS has 9 entries", () => {
    expect(DEPARTURE_REASONS).toHaveLength(9);
  });

  it("DEPARTURE_REASONS includes Resignation", () => {
    expect(DEPARTURE_REASONS).toContain("Resignation");
  });

  it("DEPARTURE_REASONS includes Retirement", () => {
    expect(DEPARTURE_REASONS).toContain("Retirement");
  });

  it("DEPARTURE_REASONS includes Redundancy", () => {
    expect(DEPARTURE_REASONS).toContain("Redundancy");
  });

  it("DEPARTURE_REASONS includes End of Contract", () => {
    expect(DEPARTURE_REASONS).toContain("End of Contract");
  });

  it("DEPARTURE_REASONS includes Dismissal", () => {
    expect(DEPARTURE_REASONS).toContain("Dismissal");
  });

  it("DEPARTURE_REASONS includes Transfer", () => {
    expect(DEPARTURE_REASONS).toContain("Transfer");
  });

  it("DEPARTURE_REASONS includes Career Change", () => {
    expect(DEPARTURE_REASONS).toContain("Career Change");
  });

  it("DEPARTURE_REASONS includes Personal Reasons", () => {
    expect(DEPARTURE_REASONS).toContain("Personal Reasons");
  });

  it("DEPARTURE_REASONS includes Other", () => {
    expect(DEPARTURE_REASONS).toContain("Other");
  });

  it("DEPARTURE_REASONS has unique values", () => {
    expect(new Set(DEPARTURE_REASONS).size).toBe(DEPARTURE_REASONS.length);
  });

  it("COMPLIANCE_STATUSES has 4 entries", () => {
    expect(COMPLIANCE_STATUSES).toHaveLength(4);
  });

  it("COMPLIANCE_STATUSES includes Complete", () => {
    expect(COMPLIANCE_STATUSES).toContain("Complete");
  });

  it("COMPLIANCE_STATUSES includes Incomplete", () => {
    expect(COMPLIANCE_STATUSES).toContain("Incomplete");
  });

  it("COMPLIANCE_STATUSES includes Pending", () => {
    expect(COMPLIANCE_STATUSES).toContain("Pending");
  });

  it("COMPLIANCE_STATUSES includes Overdue", () => {
    expect(COMPLIANCE_STATUSES).toContain("Overdue");
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
    expect(m.total_interviews).toBe(0);
    expect(m.complete_count).toBe(0);
    expect(m.incomplete_count).toBe(0);
    expect(m.overdue_count).toBe(0);
    expect(m.unique_staff).toBe(0);
    expect(m.unique_interviewers).toBe(0);
  });

  it("returns 0 rates for empty array", () => {
    const m = computeMetrics([]);
    expect(m.knowledge_transfer_rate).toBe(0);
    expect(m.handover_rate).toBe(0);
    expect(m.equipment_return_rate).toBe(0);
    expect(m.access_revoked_rate).toBe(0);
    expect(m.final_pay_rate).toBe(0);
    expect(m.reference_rate).toBe(0);
    expect(m.notice_period_met_rate).toBe(0);
    expect(m.avg_satisfaction).toBe(0);
    expect(m.would_recommend_rate).toBe(0);
  });

  // ── total_interviews ───────────────────────────────────────────────────

  it("total_interviews counts single record", () => {
    expect(computeMetrics([makeRow()]).total_interviews).toBe(1);
  });

  it("total_interviews counts multiple records", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    expect(computeMetrics(rows).total_interviews).toBe(3);
  });

  it("total_interviews counts 10 records", () => {
    const rows = Array.from({ length: 10 }, () => makeRow());
    expect(computeMetrics(rows).total_interviews).toBe(10);
  });

  // ── Status counts ───────────────────────────────────────────────────────

  it("counts complete", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Complete" })]).complete_count).toBe(1);
  });

  it("counts incomplete", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Incomplete" })]).incomplete_count).toBe(1);
  });

  it("counts overdue", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Overdue" })]).overdue_count).toBe(1);
  });

  it("does not count Complete as incomplete", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Complete" })]);
    expect(m.incomplete_count).toBe(0);
  });

  it("does not count Complete as overdue", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Complete" })]);
    expect(m.overdue_count).toBe(0);
  });

  it("does not count Pending as complete", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Pending" })]);
    expect(m.complete_count).toBe(0);
  });

  it("does not count Pending as incomplete", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Pending" })]);
    expect(m.incomplete_count).toBe(0);
  });

  it("does not count Incomplete as overdue", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Incomplete" })]);
    expect(m.overdue_count).toBe(0);
  });

  it("does not count Overdue as incomplete", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Overdue" })]);
    expect(m.incomplete_count).toBe(0);
  });

  it("counts multiple complete", () => {
    const rows = [
      makeRow({ compliance_status: "Complete" }),
      makeRow({ compliance_status: "Complete" }),
      makeRow({ compliance_status: "Incomplete" }),
    ];
    expect(computeMetrics(rows).complete_count).toBe(2);
  });

  it("counts multiple overdue", () => {
    const rows = [
      makeRow({ compliance_status: "Overdue" }),
      makeRow({ compliance_status: "Overdue" }),
      makeRow({ compliance_status: "Overdue" }),
    ];
    expect(computeMetrics(rows).overdue_count).toBe(3);
  });

  // ── Boolean rates ───────────────────────────────────────────────────────

  it("returns 100% for all boolean rates when defaults are true", () => {
    const m = computeMetrics([makeRow()]);
    expect(m.knowledge_transfer_rate).toBe(100);
    expect(m.handover_rate).toBe(100);
    expect(m.equipment_return_rate).toBe(100);
    expect(m.access_revoked_rate).toBe(100);
    expect(m.final_pay_rate).toBe(100);
    expect(m.reference_rate).toBe(100);
    expect(m.notice_period_met_rate).toBe(100);
  });

  it("knowledge_transfer_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ knowledge_transfer_completed: false })]).knowledge_transfer_rate).toBe(0);
  });

  it("handover_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ handover_document_provided: false })]).handover_rate).toBe(0);
  });

  it("equipment_return_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ equipment_returned: false })]).equipment_return_rate).toBe(0);
  });

  it("access_revoked_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ access_revoked: false })]).access_revoked_rate).toBe(0);
  });

  it("final_pay_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ final_pay_confirmed: false })]).final_pay_rate).toBe(0);
  });

  it("reference_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ reference_agreed: false })]).reference_rate).toBe(0);
  });

  it("notice_period_met_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ notice_period_met: false })]).notice_period_met_rate).toBe(0);
  });

  it("mixed knowledge_transfer_rate computes correctly (66.7%)", () => {
    const rows = [
      makeRow({ knowledge_transfer_completed: true }),
      makeRow({ knowledge_transfer_completed: true }),
      makeRow({ knowledge_transfer_completed: false }),
    ];
    expect(computeMetrics(rows).knowledge_transfer_rate).toBe(66.7);
  });

  it("mixed handover_rate computes correctly (50%)", () => {
    const rows = [
      makeRow({ handover_document_provided: true }),
      makeRow({ handover_document_provided: false }),
    ];
    expect(computeMetrics(rows).handover_rate).toBe(50);
  });

  it("mixed equipment_return_rate computes correctly (33.3%)", () => {
    const rows = [
      makeRow({ equipment_returned: true }),
      makeRow({ equipment_returned: false }),
      makeRow({ equipment_returned: false }),
    ];
    expect(computeMetrics(rows).equipment_return_rate).toBe(33.3);
  });

  it("mixed access_revoked_rate computes correctly (25%)", () => {
    const rows = [
      makeRow({ access_revoked: true }),
      makeRow({ access_revoked: false }),
      makeRow({ access_revoked: false }),
      makeRow({ access_revoked: false }),
    ];
    expect(computeMetrics(rows).access_revoked_rate).toBe(25);
  });

  it("mixed final_pay_rate computes correctly (75%)", () => {
    const rows = [
      makeRow({ final_pay_confirmed: true }),
      makeRow({ final_pay_confirmed: true }),
      makeRow({ final_pay_confirmed: true }),
      makeRow({ final_pay_confirmed: false }),
    ];
    expect(computeMetrics(rows).final_pay_rate).toBe(75);
  });

  it("mixed reference_rate computes correctly (50%)", () => {
    const rows = [
      makeRow({ reference_agreed: true }),
      makeRow({ reference_agreed: false }),
    ];
    expect(computeMetrics(rows).reference_rate).toBe(50);
  });

  it("mixed notice_period_met_rate computes correctly (66.7%)", () => {
    const rows = [
      makeRow({ notice_period_met: true }),
      makeRow({ notice_period_met: true }),
      makeRow({ notice_period_met: false }),
    ];
    expect(computeMetrics(rows).notice_period_met_rate).toBe(66.7);
  });

  // ── avg_satisfaction ──────────────────────────────────────────────────

  it("avg_satisfaction is 0 for empty array", () => {
    expect(computeMetrics([]).avg_satisfaction).toBe(0);
  });

  it("avg_satisfaction is 0 when all ratings are null", () => {
    const rows = [makeRow({ satisfaction_rating: null }), makeRow({ satisfaction_rating: null })];
    expect(computeMetrics(rows).avg_satisfaction).toBe(0);
  });

  it("avg_satisfaction returns exact value for single rating", () => {
    const rows = [makeRow({ satisfaction_rating: 8 })];
    expect(computeMetrics(rows).avg_satisfaction).toBe(8);
  });

  it("avg_satisfaction averages multiple ratings", () => {
    const rows = [
      makeRow({ satisfaction_rating: 6 }),
      makeRow({ satisfaction_rating: 8 }),
    ];
    expect(computeMetrics(rows).avg_satisfaction).toBe(7);
  });

  it("avg_satisfaction ignores null ratings", () => {
    const rows = [
      makeRow({ satisfaction_rating: 6 }),
      makeRow({ satisfaction_rating: null }),
      makeRow({ satisfaction_rating: 8 }),
    ];
    expect(computeMetrics(rows).avg_satisfaction).toBe(7);
  });

  it("avg_satisfaction rounds to 1 decimal place", () => {
    const rows = [
      makeRow({ satisfaction_rating: 7 }),
      makeRow({ satisfaction_rating: 8 }),
      makeRow({ satisfaction_rating: 9 }),
    ];
    expect(computeMetrics(rows).avg_satisfaction).toBe(8);
  });

  it("avg_satisfaction handles rating of 1", () => {
    const rows = [makeRow({ satisfaction_rating: 1 })];
    expect(computeMetrics(rows).avg_satisfaction).toBe(1);
  });

  it("avg_satisfaction handles rating of 10", () => {
    const rows = [makeRow({ satisfaction_rating: 10 })];
    expect(computeMetrics(rows).avg_satisfaction).toBe(10);
  });

  it("avg_satisfaction computes 1 decimal correctly (e.g. 7.3)", () => {
    const rows = [
      makeRow({ satisfaction_rating: 7 }),
      makeRow({ satisfaction_rating: 7 }),
      makeRow({ satisfaction_rating: 8 }),
    ];
    // (7+7+8)/3 = 22/3 = 7.333... -> 7.3
    expect(computeMetrics(rows).avg_satisfaction).toBe(7.3);
  });

  // ── would_recommend_rate ──────────────────────────────────────────────

  it("would_recommend_rate is 0 for empty array", () => {
    expect(computeMetrics([]).would_recommend_rate).toBe(0);
  });

  it("would_recommend_rate is 0 when all null", () => {
    const rows = [makeRow({ would_recommend: null }), makeRow({ would_recommend: null })];
    expect(computeMetrics(rows).would_recommend_rate).toBe(0);
  });

  it("would_recommend_rate is 100 when all true", () => {
    const rows = [makeRow({ would_recommend: true }), makeRow({ would_recommend: true })];
    expect(computeMetrics(rows).would_recommend_rate).toBe(100);
  });

  it("would_recommend_rate is 0 when all false", () => {
    const rows = [makeRow({ would_recommend: false }), makeRow({ would_recommend: false })];
    expect(computeMetrics(rows).would_recommend_rate).toBe(0);
  });

  it("would_recommend_rate is 50 when mixed", () => {
    const rows = [makeRow({ would_recommend: true }), makeRow({ would_recommend: false })];
    expect(computeMetrics(rows).would_recommend_rate).toBe(50);
  });

  it("would_recommend_rate ignores null values", () => {
    const rows = [
      makeRow({ would_recommend: true }),
      makeRow({ would_recommend: null }),
      makeRow({ would_recommend: false }),
    ];
    expect(computeMetrics(rows).would_recommend_rate).toBe(50);
  });

  it("would_recommend_rate computes correctly (66.7%)", () => {
    const rows = [
      makeRow({ would_recommend: true }),
      makeRow({ would_recommend: true }),
      makeRow({ would_recommend: false }),
    ];
    expect(computeMetrics(rows).would_recommend_rate).toBe(66.7);
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

  // ── unique_interviewers ──────────────────────────────────────────────

  it("unique_interviewers counts 1 for single record", () => {
    expect(computeMetrics([makeRow()]).unique_interviewers).toBe(1);
  });

  it("unique_interviewers counts distinct interviewer names", () => {
    const rows = [
      makeRow({ interviewer_name: "Interviewer A" }),
      makeRow({ interviewer_name: "Interviewer B" }),
      makeRow({ interviewer_name: "Interviewer A" }),
    ];
    expect(computeMetrics(rows).unique_interviewers).toBe(2);
  });

  it("unique_interviewers counts all different interviewers", () => {
    const rows = [
      makeRow({ interviewer_name: "Interviewer A" }),
      makeRow({ interviewer_name: "Interviewer B" }),
      makeRow({ interviewer_name: "Interviewer C" }),
    ];
    expect(computeMetrics(rows).unique_interviewers).toBe(3);
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

  // ── Critical: access_not_revoked ──────────────────────────────────────

  it("fires critical for access not revoked", () => {
    const a = computeAlerts([makeRow({ access_revoked: false })]);
    const c = a.filter((x) => x.type === "access_not_revoked" && x.severity === "critical");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("access not revoked alert includes staff name", () => {
    const a = computeAlerts([makeRow({ access_revoked: false, staff_name: "Alice Brown" })]);
    const c = a.filter((x) => x.type === "access_not_revoked");
    expect(c[0].message).toContain("Alice Brown");
  });

  it("access not revoked alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-123", access_revoked: false })]);
    const c = a.filter((x) => x.type === "access_not_revoked");
    expect(c[0].record_id).toBe("rec-123");
  });

  it("access not revoked alert mentions safeguarding", () => {
    const a = computeAlerts([makeRow({ access_revoked: false })]);
    const c = a.filter((x) => x.type === "access_not_revoked");
    expect(c[0].message).toMatch(/safeguarding/i);
  });

  it("does NOT fire access alert when access revoked", () => {
    const a = computeAlerts([makeRow({ access_revoked: true })]);
    const c = a.filter((x) => x.type === "access_not_revoked");
    expect(c.length).toBe(0);
  });

  it("fires access alert per-record for multiple unrevoked", () => {
    const rows = [
      makeRow({ id: "a-1", access_revoked: false }),
      makeRow({ id: "a-2", access_revoked: false }),
    ];
    const a = computeAlerts(rows);
    const c = a.filter((x) => x.type === "access_not_revoked");
    expect(c.length).toBe(2);
  });

  // ── High: overdue_interview ─────────────────────────────────────────

  it("fires high for Overdue status", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Overdue" })]);
    const h = a.filter((x) => x.type === "overdue_interview" && x.severity === "high");
    expect(h.length).toBeGreaterThanOrEqual(1);
  });

  it("overdue alert includes staff name", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Overdue", staff_name: "Bob Green" })]);
    const h = a.filter((x) => x.type === "overdue_interview");
    expect(h[0].message).toContain("Bob Green");
  });

  it("overdue alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-456", compliance_status: "Overdue" })]);
    const h = a.filter((x) => x.type === "overdue_interview");
    expect(h[0].record_id).toBe("rec-456");
  });

  it("overdue alert mentions compliance", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Overdue" })]);
    const h = a.filter((x) => x.type === "overdue_interview");
    expect(h[0].message).toMatch(/compliance/i);
  });

  it("does NOT fire overdue for Complete status", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Complete" })]);
    const h = a.filter((x) => x.type === "overdue_interview");
    expect(h.length).toBe(0);
  });

  it("does NOT fire overdue for Incomplete status", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Incomplete" })]);
    const h = a.filter((x) => x.type === "overdue_interview");
    expect(h.length).toBe(0);
  });

  it("does NOT fire overdue for Pending status", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Pending" })]);
    const h = a.filter((x) => x.type === "overdue_interview");
    expect(h.length).toBe(0);
  });

  it("fires overdue per-record for multiple overdue", () => {
    const rows = [
      makeRow({ id: "a-1", compliance_status: "Overdue" }),
      makeRow({ id: "a-2", compliance_status: "Overdue" }),
    ];
    const a = computeAlerts(rows);
    const h = a.filter((x) => x.type === "overdue_interview");
    expect(h.length).toBe(2);
  });

  // ── High: equipment_not_returned ────────────────────────────────────

  it("fires high for equipment not returned", () => {
    const a = computeAlerts([makeRow({ equipment_returned: false })]);
    const h = a.filter((x) => x.type === "equipment_not_returned" && x.severity === "high");
    expect(h.length).toBeGreaterThanOrEqual(1);
  });

  it("equipment alert includes staff name", () => {
    const a = computeAlerts([makeRow({ equipment_returned: false, staff_name: "Charlie Davis" })]);
    const h = a.filter((x) => x.type === "equipment_not_returned");
    expect(h[0].message).toContain("Charlie Davis");
  });

  it("equipment alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-789", equipment_returned: false })]);
    const h = a.filter((x) => x.type === "equipment_not_returned");
    expect(h[0].record_id).toBe("rec-789");
  });

  it("equipment alert mentions data security", () => {
    const a = computeAlerts([makeRow({ equipment_returned: false })]);
    const h = a.filter((x) => x.type === "equipment_not_returned");
    expect(h[0].message).toMatch(/data security/i);
  });

  it("does NOT fire equipment alert when equipment returned", () => {
    const a = computeAlerts([makeRow({ equipment_returned: true })]);
    const h = a.filter((x) => x.type === "equipment_not_returned");
    expect(h.length).toBe(0);
  });

  it("fires equipment alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", equipment_returned: false }),
      makeRow({ id: "a-2", equipment_returned: false }),
    ];
    const a = computeAlerts(rows);
    const h = a.filter((x) => x.type === "equipment_not_returned");
    expect(h.length).toBe(2);
  });

  // ── Medium: knowledge_transfer_incomplete ────────────────────────────

  it("fires medium for knowledge transfer not completed", () => {
    const a = computeAlerts([makeRow({ knowledge_transfer_completed: false })]);
    const m = a.filter((x) => x.type === "knowledge_transfer_incomplete" && x.severity === "medium");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("knowledge transfer alert includes staff name", () => {
    const a = computeAlerts([makeRow({ knowledge_transfer_completed: false, staff_name: "Diana Evans" })]);
    const m = a.filter((x) => x.type === "knowledge_transfer_incomplete");
    expect(m[0].message).toContain("Diana Evans");
  });

  it("knowledge transfer alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-abc", knowledge_transfer_completed: false })]);
    const m = a.filter((x) => x.type === "knowledge_transfer_incomplete");
    expect(m[0].record_id).toBe("rec-abc");
  });

  it("knowledge transfer alert mentions continuity of care", () => {
    const a = computeAlerts([makeRow({ knowledge_transfer_completed: false })]);
    const m = a.filter((x) => x.type === "knowledge_transfer_incomplete");
    expect(m[0].message).toMatch(/continuity of care/i);
  });

  it("does NOT fire knowledge transfer alert when completed", () => {
    const a = computeAlerts([makeRow({ knowledge_transfer_completed: true })]);
    const m = a.filter((x) => x.type === "knowledge_transfer_incomplete");
    expect(m.length).toBe(0);
  });

  it("fires knowledge transfer alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", knowledge_transfer_completed: false }),
      makeRow({ id: "a-2", knowledge_transfer_completed: false }),
    ];
    const a = computeAlerts(rows);
    const m = a.filter((x) => x.type === "knowledge_transfer_incomplete");
    expect(m.length).toBe(2);
  });

  // ── Combined alerts ─────────────────────────────────────────────────────

  it("fires all applicable alert types in worst-case scenario", () => {
    const rows = [
      makeRow({
        id: "a-1",
        compliance_status: "Overdue",
        access_revoked: false,
        equipment_returned: false,
        knowledge_transfer_completed: false,
      }),
    ];
    const a = computeAlerts(rows);
    const types = new Set(a.map((x) => x.type));
    expect(types.has("access_not_revoked")).toBe(true);
    expect(types.has("overdue_interview")).toBe(true);
    expect(types.has("equipment_not_returned")).toBe(true);
    expect(types.has("knowledge_transfer_incomplete")).toBe(true);
  });

  it("alert severity levels are correct across mixed alerts", () => {
    const rows = [
      makeRow({
        id: "a-1",
        compliance_status: "Overdue",
        access_revoked: false,
        equipment_returned: false,
        knowledge_transfer_completed: false,
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
      compliance_status: "Overdue",
      access_revoked: false,
      equipment_returned: false,
      knowledge_transfer_completed: false,
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
      makeRow({ id: "a-1", access_revoked: false }),
      makeRow({ id: "a-2", knowledge_transfer_completed: false }),
    ];
    const a = computeAlerts(rows);
    const accessAlerts = a.filter((x) => x.type === "access_not_revoked");
    const ktAlerts = a.filter((x) => x.type === "knowledge_transfer_incomplete");
    expect(accessAlerts.length).toBe(1);
    expect(ktAlerts.length).toBe(1);
    expect(accessAlerts[0].record_id).toBe("a-1");
    expect(ktAlerts[0].record_id).toBe("a-2");
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

  // ── Insight 1: orange-themed summary ───────────────────────────────────

  it("first insight starts with [orange]", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toMatch(/^\[orange\]/);
  });

  it("first insight includes total interview count", () => {
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

  it("first insight includes unique interviewer count", () => {
    const rows = [
      makeRow({ interviewer_name: "Interviewer A" }),
      makeRow({ interviewer_name: "Interviewer B" }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("2");
  });

  it("first insight includes complete count", () => {
    const rows = [
      makeRow({ compliance_status: "Complete" }),
      makeRow({ compliance_status: "Incomplete" }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("1 complete");
  });

  it("first insight includes incomplete count", () => {
    const rows = [makeRow({ compliance_status: "Incomplete" })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("1 incomplete");
  });

  it("first insight includes overdue count", () => {
    const rows = [makeRow({ compliance_status: "Overdue" })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("1 overdue");
  });

  it("first insight uses singular interview for 1 record", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toContain("1 exit interview");
    expect(insights[0]).not.toContain("interviews recorded");
  });

  it("first insight uses plural interviews for 2+ records", () => {
    const rows = [makeRow(), makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("interviews");
  });

  it("first insight uses singular staff member for 1 staff", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toContain("staff member");
    expect(insights[0]).not.toContain("staff members conducted");
  });

  it("first insight uses plural staff members for 2+ staff", () => {
    const rows = [makeRow({ staff_name: "Alice" }), makeRow({ staff_name: "Bob" })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("staff members");
  });

  it("first insight uses singular interviewer for 1 interviewer", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toContain("interviewer");
  });

  it("first insight uses plural interviewers for 2+ interviewers", () => {
    const rows = [makeRow({ interviewer_name: "Interviewer A" }), makeRow({ interviewer_name: "Interviewer B" })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("interviewers");
  });

  // ── Insight 2: amber-themed priorities ──────────────────────────────────

  it("second insight starts with [amber]", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions alerts when critical alerts exist", () => {
    const rows = [makeRow({ access_revoked: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("critical");
  });

  it("second insight mentions no alerts when all compliant", () => {
    const rows = [makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toMatch(/[Nn]o critical/);
  });

  it("second insight includes access revoked rate", () => {
    const rows = [makeRow({ access_revoked: true }), makeRow({ access_revoked: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes equipment return rate", () => {
    const rows = [makeRow({ equipment_returned: true }), makeRow({ equipment_returned: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes knowledge transfer rate when alerts present", () => {
    const rows = [
      makeRow({ knowledge_transfer_completed: true, access_revoked: false }),
      makeRow({ knowledge_transfer_completed: false }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight mentions high-priority count when present", () => {
    const rows = [makeRow({ compliance_status: "Overdue" })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("high-priority");
  });

  it("second insight mentions safeguarding when no alerts", () => {
    const rows = [makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("safeguarding");
  });

  // ── Insight 3: reflect-themed question ──────────────────────────────────

  it("third insight starts with [reflect]", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions critical alert count when present", () => {
    const rows = [makeRow({ access_revoked: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("1");
    expect(insights[2]).toMatch(/critical/i);
  });

  it("third insight uses singular when 1 critical alert", () => {
    const rows = [makeRow({ access_revoked: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("alert requires");
  });

  it("third insight uses plural when 2+ critical alerts", () => {
    const rows = [
      makeRow({ access_revoked: false, staff_name: "Alice" }),
      makeRow({ access_revoked: false, staff_name: "Bob" }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("alerts require");
  });

  it("third insight addresses knowledge transfer when no critical alerts but rate < 100", () => {
    const rows = [
      makeRow({ knowledge_transfer_completed: false }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("knowledge transfer");
  });

  it("third insight mentions continuity of care when knowledge transfer rate < 100", () => {
    const rows = [makeRow({ knowledge_transfer_completed: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("continuity of care");
  });

  it("third insight celebrates full compliance when all checks pass", () => {
    const rows = [
      makeRow({ knowledge_transfer_completed: true }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("compliance");
    expect(insights[2]).toContain("offboarding");
  });

  it("third insight mentions access when critical alerts present", () => {
    const rows = [makeRow({ access_revoked: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("access");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CRUD (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD when Supabase disabled", () => {
  it("listStaffExitInterviews returns empty data", async () => {
    const { listStaffExitInterviews } = await import("../staff-exit-interview-management-service");
    const result = await listStaffExitInterviews("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("createStaffExitInterview returns error", async () => {
    const { createStaffExitInterview } = await import("../staff-exit-interview-management-service");
    const result = await createStaffExitInterview({
      homeId: "home-1",
      interviewDate: "2026-05-15",
      interviewerName: "HR Manager",
      staffName: "Jane Smith",
      departureReason: "Resignation",
      departureDate: "2026-06-01",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("updateStaffExitInterview returns error", async () => {
    const { updateStaffExitInterview } = await import("../staff-exit-interview-management-service");
    const result = await updateStaffExitInterview("rec-1", { notes: "updated" });
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
      notice_period_met: false,
      knowledge_transfer_completed: false,
      handover_document_provided: false,
      equipment_returned: false,
      access_revoked: false,
      final_pay_confirmed: false,
      reference_agreed: false,
    });
    const m = computeMetrics([row]);
    expect(m.knowledge_transfer_rate).toBe(0);
    expect(m.handover_rate).toBe(0);
    expect(m.equipment_return_rate).toBe(0);
    expect(m.access_revoked_rate).toBe(0);
    expect(m.final_pay_rate).toBe(0);
    expect(m.reference_rate).toBe(0);
    expect(m.notice_period_met_rate).toBe(0);
  });

  it("alerts for record with all flags triggering", () => {
    const row = makeRow({
      compliance_status: "Overdue",
      access_revoked: false,
      equipment_returned: false,
      knowledge_transfer_completed: false,
    });
    const a = computeAlerts([row]);
    expect(a.length).toBeGreaterThanOrEqual(4);
  });

  it("makeRow factory with overrides preserves overrides", () => {
    const row = makeRow({
      staff_name: "Custom Name",
      departure_reason: "Dismissal",
      compliance_status: "Overdue",
    });
    expect(row.staff_name).toBe("Custom Name");
    expect(row.departure_reason).toBe("Dismissal");
    expect(row.compliance_status).toBe("Overdue");
  });

  it("makeRow factory nullable fields have expected defaults", () => {
    const row = makeRow();
    expect(row.notes).toBeNull();
    expect(row.satisfaction_rating).toBe(7);
    expect(row.would_recommend).toBe(true);
  });

  it("makeRow factory allows setting nullable fields", () => {
    const row = makeRow({
      satisfaction_rating: 9,
      notes: "Exit interview completed",
      would_recommend: false,
    });
    expect(row.satisfaction_rating).toBe(9);
    expect(row.notes).toBe("Exit interview completed");
    expect(row.would_recommend).toBe(false);
  });

  it("makeRow factory allows explicitly setting nullable fields to null", () => {
    const row = makeRow({ satisfaction_rating: null, notes: null, would_recommend: null });
    expect(row.satisfaction_rating).toBeNull();
    expect(row.notes).toBeNull();
    expect(row.would_recommend).toBeNull();
  });

  it("makeRow factory notice_period_met defaults to true", () => {
    const row = makeRow();
    expect(row.notice_period_met).toBe(true);
  });

  it("makeRow factory knowledge_transfer_completed defaults to true", () => {
    const row = makeRow();
    expect(row.knowledge_transfer_completed).toBe(true);
  });

  it("makeRow factory allows overriding boolean fields", () => {
    const row = makeRow({ notice_period_met: false, equipment_returned: false });
    expect(row.notice_period_met).toBe(false);
    expect(row.equipment_returned).toBe(false);
  });

  it("metrics handles large dataset", () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      makeRow({
        staff_name: `Staff ${i % 10}`,
        interviewer_name: `Interviewer ${i % 5}`,
        compliance_status: COMPLIANCE_STATUSES[i % 4],
        access_revoked: i % 3 !== 0,
      }),
    );
    const m = computeMetrics(rows);
    expect(m.total_interviews).toBe(100);
    expect(m.unique_staff).toBe(10);
    expect(m.unique_interviewers).toBe(5);
    expect(m.complete_count).toBe(25);
  });

  it("insights handle empty data gracefully", () => {
    const insights = computeCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("0 exit");
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
    expect(m.total_interviews).toBe(4);
    expect(m.complete_count).toBe(1);
    expect(m.incomplete_count).toBe(1);
    expect(m.overdue_count).toBe(1);
  });

  it("access alert only fires for unrevoked, not for overdue status alone", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Overdue", access_revoked: true })]);
    const acc = a.filter((x) => x.type === "access_not_revoked");
    expect(acc.length).toBe(0);
  });

  it("overdue alert does not fire for access_revoked false alone", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Complete", access_revoked: false })]);
    const ov = a.filter((x) => x.type === "overdue_interview");
    expect(ov.length).toBe(0);
  });

  it("metrics unique_interviewers with single interviewer across staff", () => {
    const rows = [
      makeRow({ staff_name: "Alice", interviewer_name: "Same Interviewer" }),
      makeRow({ staff_name: "Bob", interviewer_name: "Same Interviewer" }),
      makeRow({ staff_name: "Charlie", interviewer_name: "Same Interviewer" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_staff).toBe(3);
    expect(m.unique_interviewers).toBe(1);
  });

  it("metrics unique_staff with single staff across interviewers", () => {
    const rows = [
      makeRow({ staff_name: "Same Worker", interviewer_name: "Interviewer A" }),
      makeRow({ staff_name: "Same Worker", interviewer_name: "Interviewer B" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_staff).toBe(1);
    expect(m.unique_interviewers).toBe(2);
  });

  it("insights with only critical alerts show correct count", () => {
    const rows = [makeRow({ access_revoked: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toMatch(/\d+ critical/);
  });

  it("insights with only high alerts show correct count", () => {
    const rows = [makeRow({ compliance_status: "Overdue" })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toMatch(/\d+ high-priority/);
  });

  it("insights reflect question path for knowledge transfer < 100%", () => {
    const rows = [makeRow({ knowledge_transfer_completed: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("knowledge transfer");
    expect(insights[2]).toContain("0%");
  });

  it("all alert record_ids match the source row id", () => {
    const row = makeRow({
      id: "unique-test-id",
      compliance_status: "Overdue",
      access_revoked: false,
      equipment_returned: false,
      knowledge_transfer_completed: false,
    });
    const a = computeAlerts([row]);
    for (const alert of a) {
      expect(alert.record_id).toBe("unique-test-id");
    }
  });

  it("metrics with all nine departure reasons", () => {
    const rows = DEPARTURE_REASONS.map((r, i) => makeRow({ id: `a-${i}`, departure_reason: r }));
    const m = computeMetrics(rows);
    expect(m.total_interviews).toBe(9);
  });

  it("equipment alert is independent of compliance status", () => {
    const a = computeAlerts([makeRow({ equipment_returned: false, compliance_status: "Complete" })]);
    const e = a.filter((x) => x.type === "equipment_not_returned");
    expect(e.length).toBe(1);
  });

  it("access alert is independent of equipment status", () => {
    const a = computeAlerts([makeRow({ access_revoked: false, equipment_returned: true })]);
    const acc = a.filter((x) => x.type === "access_not_revoked");
    expect(acc.length).toBe(1);
    const eq = a.filter((x) => x.type === "equipment_not_returned");
    expect(eq.length).toBe(0);
  });

  it("metrics avg_satisfaction with all null ratings returns 0", () => {
    const rows = Array.from({ length: 5 }, () => makeRow({ satisfaction_rating: null }));
    const m = computeMetrics(rows);
    expect(m.avg_satisfaction).toBe(0);
  });

  it("metrics would_recommend_rate with all null returns 0", () => {
    const rows = Array.from({ length: 5 }, () => makeRow({ would_recommend: null }));
    const m = computeMetrics(rows);
    expect(m.would_recommend_rate).toBe(0);
  });

  it("insights with mixed critical and high alerts", () => {
    const rows = [
      makeRow({ access_revoked: false }),
      makeRow({ compliance_status: "Overdue" }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high-priority");
  });

  it("insights third path for full knowledge transfer with no critical alerts", () => {
    const rows = [makeRow({ knowledge_transfer_completed: true })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("compliance");
  });

  it("knowledge transfer alert is independent of access revoked status", () => {
    const a = computeAlerts([makeRow({ knowledge_transfer_completed: false, access_revoked: true })]);
    const kt = a.filter((x) => x.type === "knowledge_transfer_incomplete");
    expect(kt.length).toBe(1);
    const acc = a.filter((x) => x.type === "access_not_revoked");
    expect(acc.length).toBe(0);
  });

  it("overdue alert is independent of equipment returned status", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Overdue", equipment_returned: true })]);
    const ov = a.filter((x) => x.type === "overdue_interview");
    expect(ov.length).toBe(1);
    const eq = a.filter((x) => x.type === "equipment_not_returned");
    expect(eq.length).toBe(0);
  });

  it("avg_satisfaction with fractional average (5.7)", () => {
    const rows = [
      makeRow({ satisfaction_rating: 5 }),
      makeRow({ satisfaction_rating: 6 }),
      makeRow({ satisfaction_rating: 6 }),
    ];
    // (5+6+6)/3 = 17/3 = 5.666... -> 5.7
    expect(computeMetrics(rows).avg_satisfaction).toBe(5.7);
  });

  it("would_recommend_rate computes correctly with 33.3%", () => {
    const rows = [
      makeRow({ would_recommend: true }),
      makeRow({ would_recommend: false }),
      makeRow({ would_recommend: false }),
    ];
    expect(computeMetrics(rows).would_recommend_rate).toBe(33.3);
  });

  it("makeRow factory departure_reason defaults to Resignation", () => {
    const row = makeRow();
    expect(row.departure_reason).toBe("Resignation");
  });

  it("makeRow factory compliance_status defaults to Complete", () => {
    const row = makeRow();
    expect(row.compliance_status).toBe("Complete");
  });
});
