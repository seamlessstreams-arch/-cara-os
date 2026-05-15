// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF AGENCY WORKER COMPLIANCE SERVICE TESTS
// Pure-function unit tests for agency worker compliance metrics, alert
// identification, and ARIA insight generation.
//
// CHR 2015 Reg 32 (fitness of workers — agency staff requirements),
// CHR 2015 Sch 2 (information in respect of persons seeking to carry on,
// manage, or work at a children's home).
// CHR 2015 Reg 33 (employment of staff — agency arrangements).
//
// Covers: DBS verification, references, qualifications, induction completion,
// safeguarding training, mandatory training, ID verification, right to work,
// supervision arrangements, and shift tracking for agency workers.
//
// SCCIF: Leadership & Management — "Effective management of agency staff
// ensures children receive consistent, safe care."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  type StaffAgencyWorkerComplianceRow,
  COMPLIANCE_STATUSES,
} from "../staff-agency-worker-compliance-service";

const { computeMetrics, computeAlerts, computeAriaInsights } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(overrides?: Partial<StaffAgencyWorkerComplianceRow>): StaffAgencyWorkerComplianceRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    staff_name: "staff_name" in (overrides ?? {}) ? overrides!.staff_name! : "Jane Smith",
    agency_name: "agency_name" in (overrides ?? {}) ? overrides!.agency_name! : "CarePlus Agency",
    start_date: "start_date" in (overrides ?? {}) ? overrides!.start_date! : now.toISOString().split("T")[0],
    end_date: "end_date" in (overrides ?? {}) ? (overrides!.end_date ?? null) : null,
    compliance_status: "compliance_status" in (overrides ?? {}) ? overrides!.compliance_status! : "Compliant",
    dbs_verified: "dbs_verified" in (overrides ?? {}) ? overrides!.dbs_verified! : true,
    references_verified: "references_verified" in (overrides ?? {}) ? overrides!.references_verified! : true,
    qualifications_verified: "qualifications_verified" in (overrides ?? {}) ? overrides!.qualifications_verified! : true,
    induction_completed: "induction_completed" in (overrides ?? {}) ? overrides!.induction_completed! : true,
    safeguarding_training_confirmed: "safeguarding_training_confirmed" in (overrides ?? {}) ? overrides!.safeguarding_training_confirmed! : true,
    mandatory_training_confirmed: "mandatory_training_confirmed" in (overrides ?? {}) ? overrides!.mandatory_training_confirmed! : true,
    id_verified: "id_verified" in (overrides ?? {}) ? overrides!.id_verified! : true,
    right_to_work_verified: "right_to_work_verified" in (overrides ?? {}) ? overrides!.right_to_work_verified! : true,
    supervision_arranged: "supervision_arranged" in (overrides ?? {}) ? overrides!.supervision_arranged! : true,
    shift_count: "shift_count" in (overrides ?? {}) ? overrides!.shift_count! : 5,
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
  it("COMPLIANCE_STATUSES has 4 entries", () => {
    expect(COMPLIANCE_STATUSES).toHaveLength(4);
  });

  it("COMPLIANCE_STATUSES includes Compliant", () => {
    expect(COMPLIANCE_STATUSES).toContain("Compliant");
  });

  it("COMPLIANCE_STATUSES includes Partially Compliant", () => {
    expect(COMPLIANCE_STATUSES).toContain("Partially Compliant");
  });

  it("COMPLIANCE_STATUSES includes Non-Compliant", () => {
    expect(COMPLIANCE_STATUSES).toContain("Non-Compliant");
  });

  it("COMPLIANCE_STATUSES includes Pending Review", () => {
    expect(COMPLIANCE_STATUSES).toContain("Pending Review");
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
    expect(m.total_records).toBe(0);
    expect(m.non_compliant_count).toBe(0);
    expect(m.partially_compliant_count).toBe(0);
    expect(m.pending_count).toBe(0);
    expect(m.unique_staff).toBe(0);
    expect(m.unique_agencies).toBe(0);
  });

  it("returns 0 rates for empty array", () => {
    const m = computeMetrics([]);
    expect(m.dbs_verified_rate).toBe(0);
    expect(m.references_rate).toBe(0);
    expect(m.qualifications_rate).toBe(0);
    expect(m.induction_rate).toBe(0);
    expect(m.safeguarding_rate).toBe(0);
    expect(m.mandatory_training_rate).toBe(0);
    expect(m.supervision_rate).toBe(0);
  });

  it("returns 0 avg_shifts for empty array", () => {
    const m = computeMetrics([]);
    expect(m.avg_shifts).toBe(0);
  });

  // ── total_records ───────────────────────────────────────────────────────

  it("total_records counts single record", () => {
    expect(computeMetrics([makeRow()]).total_records).toBe(1);
  });

  it("total_records counts multiple records", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    expect(computeMetrics(rows).total_records).toBe(3);
  });

  // ── Status counts ───────────────────────────────────────────────────────

  it("counts non-compliant", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Non-Compliant" })]).non_compliant_count).toBe(1);
  });

  it("counts partially compliant", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Partially Compliant" })]).partially_compliant_count).toBe(1);
  });

  it("counts pending review", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Pending Review" })]).pending_count).toBe(1);
  });

  it("does not count Compliant as non-compliant", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Compliant" })]);
    expect(m.non_compliant_count).toBe(0);
  });

  it("does not count Compliant as partially compliant", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Compliant" })]);
    expect(m.partially_compliant_count).toBe(0);
  });

  it("does not count Compliant as pending", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Compliant" })]);
    expect(m.pending_count).toBe(0);
  });

  it("does not count Partially Compliant as non-compliant", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Partially Compliant" })]);
    expect(m.non_compliant_count).toBe(0);
  });

  it("does not count Non-Compliant as pending", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Non-Compliant" })]);
    expect(m.pending_count).toBe(0);
  });

  it("counts multiple non-compliant", () => {
    const rows = [
      makeRow({ compliance_status: "Non-Compliant" }),
      makeRow({ compliance_status: "Non-Compliant" }),
      makeRow({ compliance_status: "Compliant" }),
    ];
    expect(computeMetrics(rows).non_compliant_count).toBe(2);
  });

  it("counts multiple partially compliant", () => {
    const rows = [
      makeRow({ compliance_status: "Partially Compliant" }),
      makeRow({ compliance_status: "Partially Compliant" }),
      makeRow({ compliance_status: "Compliant" }),
    ];
    expect(computeMetrics(rows).partially_compliant_count).toBe(2);
  });

  it("counts multiple pending review", () => {
    const rows = [
      makeRow({ compliance_status: "Pending Review" }),
      makeRow({ compliance_status: "Pending Review" }),
      makeRow({ compliance_status: "Pending Review" }),
    ];
    expect(computeMetrics(rows).pending_count).toBe(3);
  });

  // ── Boolean rates ───────────────────────────────────────────────────────

  it("returns 100% for all boolean rates when defaults are true", () => {
    const m = computeMetrics([makeRow()]);
    expect(m.dbs_verified_rate).toBe(100);
    expect(m.references_rate).toBe(100);
    expect(m.qualifications_rate).toBe(100);
    expect(m.induction_rate).toBe(100);
    expect(m.safeguarding_rate).toBe(100);
    expect(m.mandatory_training_rate).toBe(100);
    expect(m.supervision_rate).toBe(100);
  });

  it("dbs_verified_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ dbs_verified: false })]).dbs_verified_rate).toBe(0);
  });

  it("references_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ references_verified: false })]).references_rate).toBe(0);
  });

  it("qualifications_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ qualifications_verified: false })]).qualifications_rate).toBe(0);
  });

  it("induction_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ induction_completed: false })]).induction_rate).toBe(0);
  });

  it("safeguarding_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ safeguarding_training_confirmed: false })]).safeguarding_rate).toBe(0);
  });

  it("mandatory_training_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ mandatory_training_confirmed: false })]).mandatory_training_rate).toBe(0);
  });

  it("supervision_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ supervision_arranged: false })]).supervision_rate).toBe(0);
  });

  it("mixed dbs_verified_rate computes correctly (66.7%)", () => {
    const rows = [
      makeRow({ dbs_verified: true }),
      makeRow({ dbs_verified: true }),
      makeRow({ dbs_verified: false }),
    ];
    expect(computeMetrics(rows).dbs_verified_rate).toBe(66.7);
  });

  it("mixed references_rate computes correctly (50%)", () => {
    const rows = [
      makeRow({ references_verified: true }),
      makeRow({ references_verified: false }),
    ];
    expect(computeMetrics(rows).references_rate).toBe(50);
  });

  it("mixed qualifications_rate computes correctly (33.3%)", () => {
    const rows = [
      makeRow({ qualifications_verified: true }),
      makeRow({ qualifications_verified: false }),
      makeRow({ qualifications_verified: false }),
    ];
    expect(computeMetrics(rows).qualifications_rate).toBe(33.3);
  });

  it("mixed induction_rate computes correctly (25%)", () => {
    const rows = [
      makeRow({ induction_completed: true }),
      makeRow({ induction_completed: false }),
      makeRow({ induction_completed: false }),
      makeRow({ induction_completed: false }),
    ];
    expect(computeMetrics(rows).induction_rate).toBe(25);
  });

  it("mixed safeguarding_rate computes correctly (75%)", () => {
    const rows = [
      makeRow({ safeguarding_training_confirmed: true }),
      makeRow({ safeguarding_training_confirmed: true }),
      makeRow({ safeguarding_training_confirmed: true }),
      makeRow({ safeguarding_training_confirmed: false }),
    ];
    expect(computeMetrics(rows).safeguarding_rate).toBe(75);
  });

  it("mixed mandatory_training_rate computes correctly (50%)", () => {
    const rows = [
      makeRow({ mandatory_training_confirmed: true }),
      makeRow({ mandatory_training_confirmed: false }),
    ];
    expect(computeMetrics(rows).mandatory_training_rate).toBe(50);
  });

  it("mixed supervision_rate computes correctly (66.7%)", () => {
    const rows = [
      makeRow({ supervision_arranged: true }),
      makeRow({ supervision_arranged: true }),
      makeRow({ supervision_arranged: false }),
    ];
    expect(computeMetrics(rows).supervision_rate).toBe(66.7);
  });

  // ── avg_shifts ─────────────────────────────────────────────────────────

  it("avg_shifts for single record", () => {
    expect(computeMetrics([makeRow({ shift_count: 10 })]).avg_shifts).toBe(10);
  });

  it("avg_shifts for multiple records", () => {
    const rows = [
      makeRow({ shift_count: 10 }),
      makeRow({ shift_count: 20 }),
    ];
    expect(computeMetrics(rows).avg_shifts).toBe(15);
  });

  it("avg_shifts with zero shifts", () => {
    const rows = [
      makeRow({ shift_count: 0 }),
      makeRow({ shift_count: 0 }),
    ];
    expect(computeMetrics(rows).avg_shifts).toBe(0);
  });

  it("avg_shifts with mixed shift counts", () => {
    const rows = [
      makeRow({ shift_count: 1 }),
      makeRow({ shift_count: 2 }),
      makeRow({ shift_count: 3 }),
    ];
    expect(computeMetrics(rows).avg_shifts).toBe(2);
  });

  it("avg_shifts rounds to one decimal place", () => {
    const rows = [
      makeRow({ shift_count: 1 }),
      makeRow({ shift_count: 2 }),
      makeRow({ shift_count: 3 }),
      makeRow({ shift_count: 4 }),
      makeRow({ shift_count: 5 }),
      makeRow({ shift_count: 6 }),
    ];
    // sum=21, avg=3.5
    expect(computeMetrics(rows).avg_shifts).toBe(3.5);
  });

  it("avg_shifts handles non-even division", () => {
    const rows = [
      makeRow({ shift_count: 10 }),
      makeRow({ shift_count: 20 }),
      makeRow({ shift_count: 30 }),
    ];
    // sum=60, avg=20
    expect(computeMetrics(rows).avg_shifts).toBe(20);
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

  // ── unique_agencies ────────────────────────────────────────────────────

  it("unique_agencies counts 1 for single record", () => {
    expect(computeMetrics([makeRow()]).unique_agencies).toBe(1);
  });

  it("unique_agencies counts distinct agency names", () => {
    const rows = [
      makeRow({ agency_name: "Agency A" }),
      makeRow({ agency_name: "Agency B" }),
      makeRow({ agency_name: "Agency A" }),
    ];
    expect(computeMetrics(rows).unique_agencies).toBe(2);
  });

  it("unique_agencies counts all different agencies", () => {
    const rows = [
      makeRow({ agency_name: "Agency A" }),
      makeRow({ agency_name: "Agency B" }),
      makeRow({ agency_name: "Agency C" }),
    ];
    expect(computeMetrics(rows).unique_agencies).toBe(3);
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

  // ── Critical: non_compliant_agency_worker ──────────────────────────────

  it("fires critical for Non-Compliant status", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Non-Compliant" })]);
    const c = a.filter((x) => x.type === "non_compliant_agency_worker" && x.severity === "critical");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("non-compliant alert includes staff name", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Non-Compliant", staff_name: "Alice Brown" })]);
    const c = a.filter((x) => x.type === "non_compliant_agency_worker");
    expect(c[0].message).toContain("Alice Brown");
  });

  it("non-compliant alert includes agency name", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Non-Compliant", agency_name: "TopStaff Ltd" })]);
    const c = a.filter((x) => x.type === "non_compliant_agency_worker");
    expect(c[0].message).toContain("TopStaff Ltd");
  });

  it("non-compliant alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-123", compliance_status: "Non-Compliant" })]);
    const c = a.filter((x) => x.type === "non_compliant_agency_worker");
    expect(c[0].record_id).toBe("rec-123");
  });

  it("non-compliant alert references Reg 32", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Non-Compliant" })]);
    const c = a.filter((x) => x.type === "non_compliant_agency_worker");
    expect(c[0].message).toContain("Reg 32");
  });

  it("does NOT fire non-compliant for Compliant status", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Compliant" })]);
    const c = a.filter((x) => x.type === "non_compliant_agency_worker");
    expect(c.length).toBe(0);
  });

  it("does NOT fire non-compliant for Partially Compliant status", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Partially Compliant" })]);
    const c = a.filter((x) => x.type === "non_compliant_agency_worker");
    expect(c.length).toBe(0);
  });

  it("does NOT fire non-compliant for Pending Review status", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Pending Review" })]);
    const c = a.filter((x) => x.type === "non_compliant_agency_worker");
    expect(c.length).toBe(0);
  });

  it("fires non-compliant per-record for multiple non-compliant", () => {
    const rows = [
      makeRow({ id: "a-1", compliance_status: "Non-Compliant" }),
      makeRow({ id: "a-2", compliance_status: "Non-Compliant" }),
    ];
    const a = computeAlerts(rows);
    const c = a.filter((x) => x.type === "non_compliant_agency_worker");
    expect(c.length).toBe(2);
  });

  // ── Critical: dbs_not_verified ─────────────────────────────────────────

  it("fires critical for DBS not verified", () => {
    const a = computeAlerts([makeRow({ dbs_verified: false })]);
    const c = a.filter((x) => x.type === "dbs_not_verified" && x.severity === "critical");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("DBS alert includes staff name", () => {
    const a = computeAlerts([makeRow({ dbs_verified: false, staff_name: "Bob Green" })]);
    const c = a.filter((x) => x.type === "dbs_not_verified");
    expect(c[0].message).toContain("Bob Green");
  });

  it("DBS alert includes agency name", () => {
    const a = computeAlerts([makeRow({ dbs_verified: false, agency_name: "CareFirst Agency" })]);
    const c = a.filter((x) => x.type === "dbs_not_verified");
    expect(c[0].message).toContain("CareFirst Agency");
  });

  it("DBS alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-456", dbs_verified: false })]);
    const c = a.filter((x) => x.type === "dbs_not_verified");
    expect(c[0].record_id).toBe("rec-456");
  });

  it("DBS alert mentions safeguarding risk", () => {
    const a = computeAlerts([makeRow({ dbs_verified: false })]);
    const c = a.filter((x) => x.type === "dbs_not_verified");
    expect(c[0].message).toMatch(/safeguarding/i);
  });

  it("does NOT fire DBS alert when dbs_verified is true", () => {
    const a = computeAlerts([makeRow({ dbs_verified: true })]);
    const c = a.filter((x) => x.type === "dbs_not_verified");
    expect(c.length).toBe(0);
  });

  it("fires DBS alert per-record for multiple unverified", () => {
    const rows = [
      makeRow({ id: "a-1", dbs_verified: false }),
      makeRow({ id: "a-2", dbs_verified: false }),
    ];
    const a = computeAlerts(rows);
    const c = a.filter((x) => x.type === "dbs_not_verified");
    expect(c.length).toBe(2);
  });

  // ── High: induction_not_completed ──────────────────────────────────────

  it("fires high for induction not completed", () => {
    const a = computeAlerts([makeRow({ induction_completed: false })]);
    const h = a.filter((x) => x.type === "induction_not_completed" && x.severity === "high");
    expect(h.length).toBeGreaterThanOrEqual(1);
  });

  it("induction alert includes staff name", () => {
    const a = computeAlerts([makeRow({ induction_completed: false, staff_name: "Charlie Davis" })]);
    const h = a.filter((x) => x.type === "induction_not_completed");
    expect(h[0].message).toContain("Charlie Davis");
  });

  it("induction alert includes agency name", () => {
    const a = computeAlerts([makeRow({ induction_completed: false, agency_name: "StaffLink" })]);
    const h = a.filter((x) => x.type === "induction_not_completed");
    expect(h[0].message).toContain("StaffLink");
  });

  it("induction alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-789", induction_completed: false })]);
    const h = a.filter((x) => x.type === "induction_not_completed");
    expect(h[0].record_id).toBe("rec-789");
  });

  it("induction alert references Reg 33", () => {
    const a = computeAlerts([makeRow({ induction_completed: false })]);
    const h = a.filter((x) => x.type === "induction_not_completed");
    expect(h[0].message).toContain("Reg 33");
  });

  it("does NOT fire induction alert when induction_completed is true", () => {
    const a = computeAlerts([makeRow({ induction_completed: true })]);
    const h = a.filter((x) => x.type === "induction_not_completed");
    expect(h.length).toBe(0);
  });

  it("fires induction alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", induction_completed: false }),
      makeRow({ id: "a-2", induction_completed: false }),
    ];
    const a = computeAlerts(rows);
    const h = a.filter((x) => x.type === "induction_not_completed");
    expect(h.length).toBe(2);
  });

  // ── High: safeguarding_training_not_confirmed ──────────────────────────

  it("fires high for safeguarding training not confirmed", () => {
    const a = computeAlerts([makeRow({ safeguarding_training_confirmed: false })]);
    const h = a.filter((x) => x.type === "safeguarding_training_not_confirmed" && x.severity === "high");
    expect(h.length).toBeGreaterThanOrEqual(1);
  });

  it("safeguarding alert includes staff name", () => {
    const a = computeAlerts([makeRow({ safeguarding_training_confirmed: false, staff_name: "Diana Evans" })]);
    const h = a.filter((x) => x.type === "safeguarding_training_not_confirmed");
    expect(h[0].message).toContain("Diana Evans");
  });

  it("safeguarding alert includes agency name", () => {
    const a = computeAlerts([makeRow({ safeguarding_training_confirmed: false, agency_name: "QuickStaff" })]);
    const h = a.filter((x) => x.type === "safeguarding_training_not_confirmed");
    expect(h[0].message).toContain("QuickStaff");
  });

  it("safeguarding alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-abc", safeguarding_training_confirmed: false })]);
    const h = a.filter((x) => x.type === "safeguarding_training_not_confirmed");
    expect(h[0].record_id).toBe("rec-abc");
  });

  it("safeguarding alert mentions mandatory requirement", () => {
    const a = computeAlerts([makeRow({ safeguarding_training_confirmed: false })]);
    const h = a.filter((x) => x.type === "safeguarding_training_not_confirmed");
    expect(h[0].message).toMatch(/mandatory/i);
  });

  it("does NOT fire safeguarding alert when safeguarding_training_confirmed is true", () => {
    const a = computeAlerts([makeRow({ safeguarding_training_confirmed: true })]);
    const h = a.filter((x) => x.type === "safeguarding_training_not_confirmed");
    expect(h.length).toBe(0);
  });

  it("fires safeguarding alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", safeguarding_training_confirmed: false }),
      makeRow({ id: "a-2", safeguarding_training_confirmed: false }),
    ];
    const a = computeAlerts(rows);
    const h = a.filter((x) => x.type === "safeguarding_training_not_confirmed");
    expect(h.length).toBe(2);
  });

  // ── Medium: supervision_not_arranged ───────────────────────────────────

  it("fires medium for supervision not arranged", () => {
    const a = computeAlerts([makeRow({ supervision_arranged: false })]);
    const m = a.filter((x) => x.type === "supervision_not_arranged" && x.severity === "medium");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("supervision alert includes staff name", () => {
    const a = computeAlerts([makeRow({ supervision_arranged: false, staff_name: "Eve Foster" })]);
    const m = a.filter((x) => x.type === "supervision_not_arranged");
    expect(m[0].message).toContain("Eve Foster");
  });

  it("supervision alert includes agency name", () => {
    const a = computeAlerts([makeRow({ supervision_arranged: false, agency_name: "TempCare" })]);
    const m = a.filter((x) => x.type === "supervision_not_arranged");
    expect(m[0].message).toContain("TempCare");
  });

  it("supervision alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-def", supervision_arranged: false })]);
    const m = a.filter((x) => x.type === "supervision_not_arranged");
    expect(m[0].record_id).toBe("rec-def");
  });

  it("does NOT fire supervision alert when supervision_arranged is true", () => {
    const a = computeAlerts([makeRow({ supervision_arranged: true })]);
    const m = a.filter((x) => x.type === "supervision_not_arranged");
    expect(m.length).toBe(0);
  });

  it("fires supervision alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", supervision_arranged: false }),
      makeRow({ id: "a-2", supervision_arranged: false }),
    ];
    const a = computeAlerts(rows);
    const m = a.filter((x) => x.type === "supervision_not_arranged");
    expect(m.length).toBe(2);
  });

  // ── Combined alerts ─────────────────────────────────────────────────────

  it("fires all applicable alert types in worst-case scenario", () => {
    const rows = [
      makeRow({
        id: "a-1",
        compliance_status: "Non-Compliant",
        dbs_verified: false,
        induction_completed: false,
        safeguarding_training_confirmed: false,
        supervision_arranged: false,
      }),
    ];
    const a = computeAlerts(rows);
    const types = new Set(a.map((x) => x.type));
    expect(types.has("non_compliant_agency_worker")).toBe(true);
    expect(types.has("dbs_not_verified")).toBe(true);
    expect(types.has("induction_not_completed")).toBe(true);
    expect(types.has("safeguarding_training_not_confirmed")).toBe(true);
    expect(types.has("supervision_not_arranged")).toBe(true);
  });

  it("alert severity levels are correct across mixed alerts", () => {
    const rows = [
      makeRow({
        id: "a-1",
        compliance_status: "Non-Compliant",
        dbs_verified: false,
        induction_completed: false,
        safeguarding_training_confirmed: false,
        supervision_arranged: false,
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
      dbs_verified: false,
      induction_completed: false,
      safeguarding_training_confirmed: false,
      supervision_arranged: false,
    })];
    const a = computeAlerts(rows);
    expect(a.length).toBeGreaterThanOrEqual(5);
  });

  it("no alerts when all checks are satisfied", () => {
    const rows = Array.from({ length: 5 }, () => makeRow());
    const a = computeAlerts(rows);
    expect(a).toEqual([]);
  });

  it("multiple records each trigger their own alerts independently", () => {
    const rows = [
      makeRow({ id: "a-1", dbs_verified: false }),
      makeRow({ id: "a-2", induction_completed: false }),
    ];
    const a = computeAlerts(rows);
    const dbsAlerts = a.filter((x) => x.type === "dbs_not_verified");
    const inductionAlerts = a.filter((x) => x.type === "induction_not_completed");
    expect(dbsAlerts.length).toBe(1);
    expect(inductionAlerts.length).toBe(1);
    expect(dbsAlerts[0].record_id).toBe("a-1");
    expect(inductionAlerts[0].record_id).toBe("a-2");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeAriaInsights
// ══════════════════════════════════════════════════════════════════════════════

describe("computeAriaInsights", () => {
  // ── Structure ───────────────────────────────────────────────────────────

  it("returns exactly 3 insights for empty array", () => {
    const insights = computeAriaInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("returns exactly 3 insights for single record", () => {
    const insights = computeAriaInsights([makeRow()]);
    expect(insights).toHaveLength(3);
  });

  it("returns exactly 3 insights for multiple records", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const insights = computeAriaInsights(rows);
    expect(insights).toHaveLength(3);
  });

  it("all insights are strings", () => {
    const insights = computeAriaInsights([makeRow()]);
    for (const i of insights) expect(typeof i).toBe("string");
  });

  it("all insights are non-empty", () => {
    const insights = computeAriaInsights([makeRow()]);
    for (const i of insights) expect(i.length).toBeGreaterThan(0);
  });

  // ── Insight 1: purple-themed summary ───────────────────────────────────

  it("first insight starts with [purple]", () => {
    const insights = computeAriaInsights([makeRow()]);
    expect(insights[0]).toMatch(/^\[purple\]/);
  });

  it("first insight includes total record count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const insights = computeAriaInsights(rows);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes unique worker count", () => {
    const rows = [
      makeRow({ staff_name: "Alice" }),
      makeRow({ staff_name: "Bob" }),
    ];
    const insights = computeAriaInsights(rows);
    expect(insights[0]).toContain("2");
  });

  it("first insight includes unique agency count", () => {
    const rows = [
      makeRow({ agency_name: "Agency A" }),
      makeRow({ agency_name: "Agency B" }),
    ];
    const insights = computeAriaInsights(rows);
    expect(insights[0]).toContain("2");
  });

  it("first insight includes non-compliant count", () => {
    const rows = [
      makeRow({ compliance_status: "Non-Compliant" }),
      makeRow({ compliance_status: "Compliant" }),
    ];
    const insights = computeAriaInsights(rows);
    expect(insights[0]).toContain("1 non-compliant");
  });

  it("first insight includes partially compliant count", () => {
    const rows = [makeRow({ compliance_status: "Partially Compliant" })];
    const insights = computeAriaInsights(rows);
    expect(insights[0]).toContain("1 partially compliant");
  });

  it("first insight includes pending count", () => {
    const rows = [makeRow({ compliance_status: "Pending Review" })];
    const insights = computeAriaInsights(rows);
    expect(insights[0]).toContain("1 pending review");
  });

  it("first insight uses singular record for 1 record", () => {
    const insights = computeAriaInsights([makeRow()]);
    expect(insights[0]).toContain("1 agency worker compliance record");
    expect(insights[0]).not.toContain("records tracked");
  });

  it("first insight uses plural records for 2+ records", () => {
    const rows = [makeRow(), makeRow()];
    const insights = computeAriaInsights(rows);
    expect(insights[0]).toContain("records");
  });

  it("first insight uses singular worker for 1 worker", () => {
    const insights = computeAriaInsights([makeRow()]);
    expect(insights[0]).toContain("worker");
    expect(insights[0]).not.toContain("workers from");
  });

  it("first insight uses plural workers for 2+ workers", () => {
    const rows = [makeRow({ staff_name: "Alice" }), makeRow({ staff_name: "Bob" })];
    const insights = computeAriaInsights(rows);
    expect(insights[0]).toContain("workers");
  });

  it("first insight uses singular agency for 1 agency", () => {
    const insights = computeAriaInsights([makeRow()]);
    expect(insights[0]).toContain("agency");
  });

  it("first insight uses plural agencies for 2+ agencies", () => {
    const rows = [makeRow({ agency_name: "Agency A" }), makeRow({ agency_name: "Agency B" })];
    const insights = computeAriaInsights(rows);
    expect(insights[0]).toContain("agencies");
  });

  // ── Insight 2: amber-themed priorities ──────────────────────────────────

  it("second insight starts with [amber]", () => {
    const insights = computeAriaInsights([makeRow()]);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions alerts when critical alerts exist", () => {
    const rows = [makeRow({ compliance_status: "Non-Compliant" })];
    const insights = computeAriaInsights(rows);
    expect(insights[1]).toContain("critical");
  });

  it("second insight mentions no alerts when all compliant", () => {
    const rows = [makeRow()];
    const insights = computeAriaInsights(rows);
    expect(insights[1]).toMatch(/[Nn]o critical/);
  });

  it("second insight includes DBS verified rate", () => {
    const rows = [makeRow({ dbs_verified: true }), makeRow({ dbs_verified: false })];
    const insights = computeAriaInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes induction rate", () => {
    const rows = [makeRow({ induction_completed: true }), makeRow({ induction_completed: false })];
    const insights = computeAriaInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes safeguarding rate when alerts present", () => {
    const rows = [
      makeRow({ safeguarding_training_confirmed: true, compliance_status: "Non-Compliant" }),
      makeRow({ safeguarding_training_confirmed: false }),
    ];
    const insights = computeAriaInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight mentions high-priority count when present", () => {
    const rows = [makeRow({ induction_completed: false })];
    const insights = computeAriaInsights(rows);
    expect(insights[1]).toContain("high-priority");
  });

  it("second insight mentions Reg 32 when no alerts", () => {
    const rows = [makeRow()];
    const insights = computeAriaInsights(rows);
    expect(insights[1]).toContain("Reg 32");
  });

  // ── Insight 3: reflect-themed question ──────────────────────────────────

  it("third insight starts with [reflect]", () => {
    const insights = computeAriaInsights([makeRow()]);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions non-compliant count when present", () => {
    const rows = [makeRow({ compliance_status: "Non-Compliant" })];
    const insights = computeAriaInsights(rows);
    expect(insights[2]).toContain("1");
    expect(insights[2]).toMatch(/non-compliant/i);
  });

  it("third insight uses singular when 1 non-compliant", () => {
    const rows = [makeRow({ compliance_status: "Non-Compliant" })];
    const insights = computeAriaInsights(rows);
    expect(insights[2]).toContain("worker is");
  });

  it("third insight uses plural when 2+ non-compliant", () => {
    const rows = [
      makeRow({ compliance_status: "Non-Compliant", staff_name: "Alice" }),
      makeRow({ compliance_status: "Non-Compliant", staff_name: "Bob" }),
    ];
    const insights = computeAriaInsights(rows);
    expect(insights[2]).toContain("workers are");
  });

  it("third insight addresses supervision when no non-compliant but rate < 100", () => {
    const rows = [
      makeRow({ compliance_status: "Compliant", supervision_arranged: false }),
    ];
    const insights = computeAriaInsights(rows);
    expect(insights[2]).toContain("supervision");
  });

  it("third insight celebrates full compliance when all compliant and supervised", () => {
    const rows = [
      makeRow({ compliance_status: "Compliant", supervision_arranged: true }),
    ];
    const insights = computeAriaInsights(rows);
    expect(insights[2]).toContain("compliant");
    expect(insights[2]).toContain("supervision");
  });

  it("third insight references CHR 2015 when fully compliant", () => {
    const rows = [makeRow()];
    const insights = computeAriaInsights(rows);
    expect(insights[2]).toContain("CHR 2015");
  });

  it("third insight references Reg 32 when non-compliant present", () => {
    const rows = [makeRow({ compliance_status: "Non-Compliant" })];
    const insights = computeAriaInsights(rows);
    expect(insights[2]).toContain("Reg 32");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CRUD (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD when Supabase disabled", () => {
  it("listStaffAgencyWorkerCompliance returns empty data", async () => {
    const { listStaffAgencyWorkerCompliance } = await import("../staff-agency-worker-compliance-service");
    const result = await listStaffAgencyWorkerCompliance("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("createStaffAgencyWorkerCompliance returns error", async () => {
    const { createStaffAgencyWorkerCompliance } = await import("../staff-agency-worker-compliance-service");
    const result = await createStaffAgencyWorkerCompliance({
      homeId: "home-1",
      staffName: "Jane Smith",
      agencyName: "CarePlus Agency",
      startDate: "2026-05-15",
      complianceStatus: "Compliant",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("updateStaffAgencyWorkerCompliance returns error", async () => {
    const { updateStaffAgencyWorkerCompliance } = await import("../staff-agency-worker-compliance-service");
    const result = await updateStaffAgencyWorkerCompliance("rec-1", { notes: "updated" });
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
      dbs_verified: false,
      references_verified: false,
      qualifications_verified: false,
      induction_completed: false,
      safeguarding_training_confirmed: false,
      mandatory_training_confirmed: false,
      id_verified: false,
      right_to_work_verified: false,
      supervision_arranged: false,
    });
    const m = computeMetrics([row]);
    expect(m.dbs_verified_rate).toBe(0);
    expect(m.references_rate).toBe(0);
    expect(m.qualifications_rate).toBe(0);
    expect(m.induction_rate).toBe(0);
    expect(m.safeguarding_rate).toBe(0);
    expect(m.mandatory_training_rate).toBe(0);
    expect(m.supervision_rate).toBe(0);
  });

  it("alerts for record with all flags triggering", () => {
    const row = makeRow({
      compliance_status: "Non-Compliant",
      dbs_verified: false,
      induction_completed: false,
      safeguarding_training_confirmed: false,
      supervision_arranged: false,
    });
    const a = computeAlerts([row]);
    expect(a.length).toBeGreaterThanOrEqual(5);
  });

  it("makeRow factory with overrides preserves overrides", () => {
    const row = makeRow({
      staff_name: "Custom Name",
      agency_name: "Custom Agency",
      compliance_status: "Non-Compliant",
    });
    expect(row.staff_name).toBe("Custom Name");
    expect(row.agency_name).toBe("Custom Agency");
    expect(row.compliance_status).toBe("Non-Compliant");
  });

  it("makeRow factory nullable fields have expected defaults", () => {
    const row = makeRow();
    expect(row.end_date).toBeNull();
    expect(row.notes).toBeNull();
  });

  it("makeRow factory allows setting nullable fields", () => {
    const row = makeRow({
      end_date: "2027-01-01",
      notes: "Agency worker contract extended",
    });
    expect(row.end_date).toBe("2027-01-01");
    expect(row.notes).toBe("Agency worker contract extended");
  });

  it("makeRow factory allows explicitly setting nullable fields to null", () => {
    const row = makeRow({ end_date: null, notes: null });
    expect(row.end_date).toBeNull();
    expect(row.notes).toBeNull();
  });

  it("makeRow factory shift_count defaults to 5", () => {
    const row = makeRow();
    expect(row.shift_count).toBe(5);
  });

  it("makeRow factory allows overriding shift_count", () => {
    const row = makeRow({ shift_count: 42 });
    expect(row.shift_count).toBe(42);
  });

  it("metrics handles large dataset", () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      makeRow({
        staff_name: `Staff ${i % 10}`,
        agency_name: `Agency ${i % 5}`,
        compliance_status: COMPLIANCE_STATUSES[i % 4],
        dbs_verified: i % 3 !== 0,
        shift_count: i,
      }),
    );
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(100);
    expect(m.unique_staff).toBe(10);
    expect(m.unique_agencies).toBe(5);
    expect(m.non_compliant_count).toBe(25);
  });

  it("insights handle empty data gracefully", () => {
    const insights = computeAriaInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("0 agency worker");
    expect(insights[0]).toContain("0 worker");
  });

  it("alerts handle no problematic records", () => {
    const rows = Array.from({ length: 5 }, () => makeRow());
    const a = computeAlerts(rows);
    expect(a).toEqual([]);
  });

  it("metrics with all four compliance statuses", () => {
    const rows = COMPLIANCE_STATUSES.map((s, i) => makeRow({ id: `a-${i}`, compliance_status: s }));
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(4);
    expect(m.non_compliant_count).toBe(1);
    expect(m.partially_compliant_count).toBe(1);
    expect(m.pending_count).toBe(1);
  });

  it("DBS alert only fires for unverified, not for non-compliant status alone", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Non-Compliant", dbs_verified: true })]);
    const dbs = a.filter((x) => x.type === "dbs_not_verified");
    expect(dbs.length).toBe(0);
  });

  it("non-compliant alert does not fire for dbs_verified false alone", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Compliant", dbs_verified: false })]);
    const nc = a.filter((x) => x.type === "non_compliant_agency_worker");
    expect(nc.length).toBe(0);
  });

  it("metrics avg_shifts with large shift counts", () => {
    const rows = [
      makeRow({ shift_count: 100 }),
      makeRow({ shift_count: 200 }),
      makeRow({ shift_count: 300 }),
    ];
    expect(computeMetrics(rows).avg_shifts).toBe(200);
  });

  it("metrics unique_agencies with single agency across workers", () => {
    const rows = [
      makeRow({ staff_name: "Alice", agency_name: "Same Agency" }),
      makeRow({ staff_name: "Bob", agency_name: "Same Agency" }),
      makeRow({ staff_name: "Charlie", agency_name: "Same Agency" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_staff).toBe(3);
    expect(m.unique_agencies).toBe(1);
  });

  it("metrics unique_staff with single worker across agencies", () => {
    const rows = [
      makeRow({ staff_name: "Same Worker", agency_name: "Agency A" }),
      makeRow({ staff_name: "Same Worker", agency_name: "Agency B" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_staff).toBe(1);
    expect(m.unique_agencies).toBe(2);
  });

  it("insights with only critical alerts show correct count", () => {
    const rows = [makeRow({ compliance_status: "Non-Compliant" })];
    const insights = computeAriaInsights(rows);
    expect(insights[1]).toMatch(/\d+ critical/);
  });

  it("insights with only high alerts show correct count", () => {
    const rows = [makeRow({ induction_completed: false })];
    const insights = computeAriaInsights(rows);
    expect(insights[1]).toMatch(/\d+ high-priority/);
  });

  it("insights reflect question path for supervision < 100%", () => {
    const rows = [makeRow({ supervision_arranged: false })];
    const insights = computeAriaInsights(rows);
    expect(insights[2]).toContain("supervision");
    expect(insights[2]).toContain("0%");
  });

  it("all alert record_ids match the source row id", () => {
    const row = makeRow({
      id: "unique-test-id",
      compliance_status: "Non-Compliant",
      dbs_verified: false,
      induction_completed: false,
      safeguarding_training_confirmed: false,
      supervision_arranged: false,
    });
    const a = computeAlerts([row]);
    for (const alert of a) {
      expect(alert.record_id).toBe("unique-test-id");
    }
  });
});
