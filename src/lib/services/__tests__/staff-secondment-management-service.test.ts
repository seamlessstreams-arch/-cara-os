// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF SECONDMENT MANAGEMENT SERVICE TESTS
// Pure-function unit tests for staff secondment management metrics, alert
// identification, and ARIA insight generation.
//
// CHR 2015 Reg 32 (fitness of workers — secondment arrangements),
// CHR 2015 Reg 33 (employment of staff — temporary staffing arrangements).
//
// Covers: secondment agreements, DBS transfers, induction completion,
// supervision arrangements, objectives, review scheduling, and extensions
// for staff on incoming, outgoing, internal, or cross-organisation secondments.
//
// SCCIF: Leadership & Management — "Effective management of secondment
// arrangements ensures children receive consistent, safe care from
// appropriately vetted and supervised staff."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  type StaffSecondmentManagementRow,
  SECONDMENT_TYPES,
  SECONDMENT_STATUSES,
} from "../staff-secondment-management-service";

const { computeMetrics, computeAlerts, computeAriaInsights } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(overrides?: Partial<StaffSecondmentManagementRow>): StaffSecondmentManagementRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    staff_name: "staff_name" in (overrides ?? {}) ? overrides!.staff_name! : "Jane Smith",
    secondment_type: "secondment_type" in (overrides ?? {}) ? overrides!.secondment_type! : "Incoming",
    sending_organisation: "sending_organisation" in (overrides ?? {}) ? overrides!.sending_organisation! : "Council A",
    receiving_organisation: "receiving_organisation" in (overrides ?? {}) ? overrides!.receiving_organisation! : "Chamberlain House",
    start_date: "start_date" in (overrides ?? {}) ? overrides!.start_date! : now.toISOString().split("T")[0],
    end_date: "end_date" in (overrides ?? {}) ? (overrides!.end_date ?? null) : null,
    status: "status" in (overrides ?? {}) ? overrides!.status! : "Active",
    agreement_signed: "agreement_signed" in (overrides ?? {}) ? overrides!.agreement_signed! : true,
    dbs_transferred: "dbs_transferred" in (overrides ?? {}) ? overrides!.dbs_transferred! : true,
    induction_completed: "induction_completed" in (overrides ?? {}) ? overrides!.induction_completed! : true,
    supervision_arranged: "supervision_arranged" in (overrides ?? {}) ? overrides!.supervision_arranged! : true,
    objectives_agreed: "objectives_agreed" in (overrides ?? {}) ? overrides!.objectives_agreed! : true,
    review_date: "review_date" in (overrides ?? {}) ? (overrides!.review_date ?? null) : "2026-06-15",
    extension_requested: "extension_requested" in (overrides ?? {}) ? overrides!.extension_requested! : false,
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
  it("SECONDMENT_TYPES has 4 entries", () => {
    expect(SECONDMENT_TYPES).toHaveLength(4);
  });

  it("SECONDMENT_TYPES includes Incoming", () => {
    expect(SECONDMENT_TYPES).toContain("Incoming");
  });

  it("SECONDMENT_TYPES includes Outgoing", () => {
    expect(SECONDMENT_TYPES).toContain("Outgoing");
  });

  it("SECONDMENT_TYPES includes Internal Transfer", () => {
    expect(SECONDMENT_TYPES).toContain("Internal Transfer");
  });

  it("SECONDMENT_TYPES includes Cross-Organisation", () => {
    expect(SECONDMENT_TYPES).toContain("Cross-Organisation");
  });

  it("SECONDMENT_TYPES has unique values", () => {
    expect(new Set(SECONDMENT_TYPES).size).toBe(SECONDMENT_TYPES.length);
  });

  it("SECONDMENT_STATUSES has 5 entries", () => {
    expect(SECONDMENT_STATUSES).toHaveLength(5);
  });

  it("SECONDMENT_STATUSES includes Active", () => {
    expect(SECONDMENT_STATUSES).toContain("Active");
  });

  it("SECONDMENT_STATUSES includes Completed", () => {
    expect(SECONDMENT_STATUSES).toContain("Completed");
  });

  it("SECONDMENT_STATUSES includes Extended", () => {
    expect(SECONDMENT_STATUSES).toContain("Extended");
  });

  it("SECONDMENT_STATUSES includes Terminated Early", () => {
    expect(SECONDMENT_STATUSES).toContain("Terminated Early");
  });

  it("SECONDMENT_STATUSES includes Pending", () => {
    expect(SECONDMENT_STATUSES).toContain("Pending");
  });

  it("SECONDMENT_STATUSES has unique values", () => {
    expect(new Set(SECONDMENT_STATUSES).size).toBe(SECONDMENT_STATUSES.length);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMetrics", () => {
  // ── Empty / baseline ────────────────────────────────────────────────────

  it("returns zeros for empty array", () => {
    const m = computeMetrics([]);
    expect(m.total_secondments).toBe(0);
    expect(m.active_count).toBe(0);
    expect(m.completed_count).toBe(0);
    expect(m.pending_count).toBe(0);
    expect(m.unique_staff).toBe(0);
  });

  it("returns 0 rates for empty array", () => {
    const m = computeMetrics([]);
    expect(m.agreement_rate).toBe(0);
    expect(m.dbs_transfer_rate).toBe(0);
    expect(m.induction_rate).toBe(0);
    expect(m.supervision_rate).toBe(0);
    expect(m.objectives_rate).toBe(0);
    expect(m.review_scheduled_rate).toBe(0);
  });

  it("returns 0 extension_count for empty array", () => {
    const m = computeMetrics([]);
    expect(m.extension_count).toBe(0);
  });

  // ── total_secondments ──────────────────────────────────────────────────

  it("total_secondments counts single record", () => {
    expect(computeMetrics([makeRow()]).total_secondments).toBe(1);
  });

  it("total_secondments counts multiple records", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    expect(computeMetrics(rows).total_secondments).toBe(3);
  });

  // ── Status counts ──────────────────────────────────────────────────────

  it("counts active", () => {
    expect(computeMetrics([makeRow({ status: "Active" })]).active_count).toBe(1);
  });

  it("counts completed", () => {
    expect(computeMetrics([makeRow({ status: "Completed" })]).completed_count).toBe(1);
  });

  it("counts pending", () => {
    expect(computeMetrics([makeRow({ status: "Pending" })]).pending_count).toBe(1);
  });

  it("does not count Extended as active", () => {
    const m = computeMetrics([makeRow({ status: "Extended" })]);
    expect(m.active_count).toBe(0);
  });

  it("does not count Terminated Early as active", () => {
    const m = computeMetrics([makeRow({ status: "Terminated Early" })]);
    expect(m.active_count).toBe(0);
  });

  it("does not count Active as completed", () => {
    const m = computeMetrics([makeRow({ status: "Active" })]);
    expect(m.completed_count).toBe(0);
  });

  it("does not count Completed as pending", () => {
    const m = computeMetrics([makeRow({ status: "Completed" })]);
    expect(m.pending_count).toBe(0);
  });

  it("does not count Pending as active", () => {
    const m = computeMetrics([makeRow({ status: "Pending" })]);
    expect(m.active_count).toBe(0);
  });

  it("counts multiple active", () => {
    const rows = [
      makeRow({ status: "Active" }),
      makeRow({ status: "Active" }),
      makeRow({ status: "Completed" }),
    ];
    expect(computeMetrics(rows).active_count).toBe(2);
  });

  it("counts multiple completed", () => {
    const rows = [
      makeRow({ status: "Completed" }),
      makeRow({ status: "Completed" }),
      makeRow({ status: "Active" }),
    ];
    expect(computeMetrics(rows).completed_count).toBe(2);
  });

  it("counts multiple pending", () => {
    const rows = [
      makeRow({ status: "Pending" }),
      makeRow({ status: "Pending" }),
      makeRow({ status: "Pending" }),
    ];
    expect(computeMetrics(rows).pending_count).toBe(3);
  });

  // ── Boolean rates ──────────────────────────────────────────────────────

  it("returns 100% for all boolean rates when defaults are true", () => {
    const m = computeMetrics([makeRow()]);
    expect(m.agreement_rate).toBe(100);
    expect(m.dbs_transfer_rate).toBe(100);
    expect(m.induction_rate).toBe(100);
    expect(m.supervision_rate).toBe(100);
    expect(m.objectives_rate).toBe(100);
  });

  it("agreement_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ agreement_signed: false })]).agreement_rate).toBe(0);
  });

  it("dbs_transfer_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ dbs_transferred: false })]).dbs_transfer_rate).toBe(0);
  });

  it("induction_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ induction_completed: false })]).induction_rate).toBe(0);
  });

  it("supervision_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ supervision_arranged: false })]).supervision_rate).toBe(0);
  });

  it("objectives_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ objectives_agreed: false })]).objectives_rate).toBe(0);
  });

  it("mixed agreement_rate computes correctly (66.7%)", () => {
    const rows = [
      makeRow({ agreement_signed: true }),
      makeRow({ agreement_signed: true }),
      makeRow({ agreement_signed: false }),
    ];
    expect(computeMetrics(rows).agreement_rate).toBe(66.7);
  });

  it("mixed dbs_transfer_rate computes correctly (50%)", () => {
    const rows = [
      makeRow({ dbs_transferred: true }),
      makeRow({ dbs_transferred: false }),
    ];
    expect(computeMetrics(rows).dbs_transfer_rate).toBe(50);
  });

  it("mixed induction_rate computes correctly (33.3%)", () => {
    const rows = [
      makeRow({ induction_completed: true }),
      makeRow({ induction_completed: false }),
      makeRow({ induction_completed: false }),
    ];
    expect(computeMetrics(rows).induction_rate).toBe(33.3);
  });

  it("mixed supervision_rate computes correctly (25%)", () => {
    const rows = [
      makeRow({ supervision_arranged: true }),
      makeRow({ supervision_arranged: false }),
      makeRow({ supervision_arranged: false }),
      makeRow({ supervision_arranged: false }),
    ];
    expect(computeMetrics(rows).supervision_rate).toBe(25);
  });

  it("mixed objectives_rate computes correctly (75%)", () => {
    const rows = [
      makeRow({ objectives_agreed: true }),
      makeRow({ objectives_agreed: true }),
      makeRow({ objectives_agreed: true }),
      makeRow({ objectives_agreed: false }),
    ];
    expect(computeMetrics(rows).objectives_rate).toBe(75);
  });

  // ── review_scheduled_rate ─────────────────────────────────────────────

  it("review_scheduled_rate is 100 when all have review_date", () => {
    const rows = [
      makeRow({ review_date: "2026-06-15" }),
      makeRow({ review_date: "2026-07-01" }),
    ];
    expect(computeMetrics(rows).review_scheduled_rate).toBe(100);
  });

  it("review_scheduled_rate is 0 when none have review_date", () => {
    const rows = [
      makeRow({ review_date: null }),
      makeRow({ review_date: null }),
    ];
    expect(computeMetrics(rows).review_scheduled_rate).toBe(0);
  });

  it("review_scheduled_rate computes correctly (50%)", () => {
    const rows = [
      makeRow({ review_date: "2026-06-15" }),
      makeRow({ review_date: null }),
    ];
    expect(computeMetrics(rows).review_scheduled_rate).toBe(50);
  });

  it("review_scheduled_rate computes correctly (66.7%)", () => {
    const rows = [
      makeRow({ review_date: "2026-06-15" }),
      makeRow({ review_date: "2026-07-01" }),
      makeRow({ review_date: null }),
    ];
    expect(computeMetrics(rows).review_scheduled_rate).toBe(66.7);
  });

  // ── extension_count ───────────────────────────────────────────────────

  it("extension_count is 0 when no extensions requested", () => {
    expect(computeMetrics([makeRow({ extension_requested: false })]).extension_count).toBe(0);
  });

  it("extension_count is 1 when one extension requested", () => {
    expect(computeMetrics([makeRow({ extension_requested: true })]).extension_count).toBe(1);
  });

  it("extension_count counts multiple extensions", () => {
    const rows = [
      makeRow({ extension_requested: true }),
      makeRow({ extension_requested: true }),
      makeRow({ extension_requested: false }),
    ];
    expect(computeMetrics(rows).extension_count).toBe(2);
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
});

// ══════════════════════════════════════════════════════════════════════════════
// computeAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("computeAlerts", () => {
  // ── Clean / empty ──────────────────────────────────────────────────────

  it("returns empty for empty array", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("returns empty for fully compliant active record", () => {
    const alerts = computeAlerts([makeRow()]);
    expect(alerts).toEqual([]);
  });

  it("returns empty for non-active records even with missing checks", () => {
    const rows = [
      makeRow({ status: "Completed", agreement_signed: false, dbs_transferred: false }),
      makeRow({ status: "Pending", agreement_signed: false, dbs_transferred: false }),
      makeRow({ status: "Extended", agreement_signed: false }),
      makeRow({ status: "Terminated Early", dbs_transferred: false }),
    ];
    expect(computeAlerts(rows)).toEqual([]);
  });

  // ── Critical: active_without_agreement ────────────────────────────────

  it("fires critical for active without agreement", () => {
    const a = computeAlerts([makeRow({ status: "Active", agreement_signed: false })]);
    const c = a.filter((x) => x.type === "active_without_agreement" && x.severity === "critical");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("agreement alert includes staff name", () => {
    const a = computeAlerts([makeRow({ status: "Active", agreement_signed: false, staff_name: "Alice Brown" })]);
    const c = a.filter((x) => x.type === "active_without_agreement");
    expect(c[0].message).toContain("Alice Brown");
  });

  it("agreement alert includes secondment type", () => {
    const a = computeAlerts([makeRow({ status: "Active", agreement_signed: false, secondment_type: "Incoming" })]);
    const c = a.filter((x) => x.type === "active_without_agreement");
    expect(c[0].message).toContain("incoming");
  });

  it("agreement alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-123", status: "Active", agreement_signed: false })]);
    const c = a.filter((x) => x.type === "active_without_agreement");
    expect(c[0].record_id).toBe("rec-123");
  });

  it("agreement alert references Reg 32", () => {
    const a = computeAlerts([makeRow({ status: "Active", agreement_signed: false })]);
    const c = a.filter((x) => x.type === "active_without_agreement");
    expect(c[0].message).toContain("Reg 32");
  });

  it("does NOT fire agreement alert when agreement_signed is true", () => {
    const a = computeAlerts([makeRow({ status: "Active", agreement_signed: true })]);
    const c = a.filter((x) => x.type === "active_without_agreement");
    expect(c.length).toBe(0);
  });

  it("does NOT fire agreement alert for Completed status", () => {
    const a = computeAlerts([makeRow({ status: "Completed", agreement_signed: false })]);
    const c = a.filter((x) => x.type === "active_without_agreement");
    expect(c.length).toBe(0);
  });

  it("does NOT fire agreement alert for Pending status", () => {
    const a = computeAlerts([makeRow({ status: "Pending", agreement_signed: false })]);
    const c = a.filter((x) => x.type === "active_without_agreement");
    expect(c.length).toBe(0);
  });

  it("fires agreement alert per-record for multiple active without agreement", () => {
    const rows = [
      makeRow({ id: "a-1", status: "Active", agreement_signed: false }),
      makeRow({ id: "a-2", status: "Active", agreement_signed: false }),
    ];
    const a = computeAlerts(rows);
    const c = a.filter((x) => x.type === "active_without_agreement");
    expect(c.length).toBe(2);
  });

  // ── Critical: active_without_dbs ──────────────────────────────────────

  it("fires critical for active without DBS", () => {
    const a = computeAlerts([makeRow({ status: "Active", dbs_transferred: false })]);
    const c = a.filter((x) => x.type === "active_without_dbs" && x.severity === "critical");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("DBS alert includes staff name", () => {
    const a = computeAlerts([makeRow({ status: "Active", dbs_transferred: false, staff_name: "Bob Green" })]);
    const c = a.filter((x) => x.type === "active_without_dbs");
    expect(c[0].message).toContain("Bob Green");
  });

  it("DBS alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-456", status: "Active", dbs_transferred: false })]);
    const c = a.filter((x) => x.type === "active_without_dbs");
    expect(c[0].record_id).toBe("rec-456");
  });

  it("DBS alert mentions safeguarding risk", () => {
    const a = computeAlerts([makeRow({ status: "Active", dbs_transferred: false })]);
    const c = a.filter((x) => x.type === "active_without_dbs");
    expect(c[0].message).toMatch(/safeguarding/i);
  });

  it("does NOT fire DBS alert when dbs_transferred is true", () => {
    const a = computeAlerts([makeRow({ status: "Active", dbs_transferred: true })]);
    const c = a.filter((x) => x.type === "active_without_dbs");
    expect(c.length).toBe(0);
  });

  it("does NOT fire DBS alert for Completed status", () => {
    const a = computeAlerts([makeRow({ status: "Completed", dbs_transferred: false })]);
    const c = a.filter((x) => x.type === "active_without_dbs");
    expect(c.length).toBe(0);
  });

  it("fires DBS alert per-record for multiple active without DBS", () => {
    const rows = [
      makeRow({ id: "a-1", status: "Active", dbs_transferred: false }),
      makeRow({ id: "a-2", status: "Active", dbs_transferred: false }),
    ];
    const a = computeAlerts(rows);
    const c = a.filter((x) => x.type === "active_without_dbs");
    expect(c.length).toBe(2);
  });

  // ── High: active_without_induction ────────────────────────────────────

  it("fires high for active without induction", () => {
    const a = computeAlerts([makeRow({ status: "Active", induction_completed: false })]);
    const h = a.filter((x) => x.type === "active_without_induction" && x.severity === "high");
    expect(h.length).toBeGreaterThanOrEqual(1);
  });

  it("induction alert includes staff name", () => {
    const a = computeAlerts([makeRow({ status: "Active", induction_completed: false, staff_name: "Charlie Davis" })]);
    const h = a.filter((x) => x.type === "active_without_induction");
    expect(h[0].message).toContain("Charlie Davis");
  });

  it("induction alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-789", status: "Active", induction_completed: false })]);
    const h = a.filter((x) => x.type === "active_without_induction");
    expect(h[0].record_id).toBe("rec-789");
  });

  it("induction alert references Reg 33", () => {
    const a = computeAlerts([makeRow({ status: "Active", induction_completed: false })]);
    const h = a.filter((x) => x.type === "active_without_induction");
    expect(h[0].message).toContain("Reg 33");
  });

  it("does NOT fire induction alert when induction_completed is true", () => {
    const a = computeAlerts([makeRow({ status: "Active", induction_completed: true })]);
    const h = a.filter((x) => x.type === "active_without_induction");
    expect(h.length).toBe(0);
  });

  it("does NOT fire induction alert for Pending status", () => {
    const a = computeAlerts([makeRow({ status: "Pending", induction_completed: false })]);
    const h = a.filter((x) => x.type === "active_without_induction");
    expect(h.length).toBe(0);
  });

  it("fires induction alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", status: "Active", induction_completed: false }),
      makeRow({ id: "a-2", status: "Active", induction_completed: false }),
    ];
    const a = computeAlerts(rows);
    const h = a.filter((x) => x.type === "active_without_induction");
    expect(h.length).toBe(2);
  });

  // ── Medium: active_without_supervision ────────────────────────────────

  it("fires medium for active without supervision", () => {
    const a = computeAlerts([makeRow({ status: "Active", supervision_arranged: false })]);
    const m = a.filter((x) => x.type === "active_without_supervision" && x.severity === "medium");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("supervision alert includes staff name", () => {
    const a = computeAlerts([makeRow({ status: "Active", supervision_arranged: false, staff_name: "Eve Foster" })]);
    const m = a.filter((x) => x.type === "active_without_supervision");
    expect(m[0].message).toContain("Eve Foster");
  });

  it("supervision alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-def", status: "Active", supervision_arranged: false })]);
    const m = a.filter((x) => x.type === "active_without_supervision");
    expect(m[0].record_id).toBe("rec-def");
  });

  it("does NOT fire supervision alert when supervision_arranged is true", () => {
    const a = computeAlerts([makeRow({ status: "Active", supervision_arranged: true })]);
    const m = a.filter((x) => x.type === "active_without_supervision");
    expect(m.length).toBe(0);
  });

  it("does NOT fire supervision alert for Extended status", () => {
    const a = computeAlerts([makeRow({ status: "Extended", supervision_arranged: false })]);
    const m = a.filter((x) => x.type === "active_without_supervision");
    expect(m.length).toBe(0);
  });

  it("fires supervision alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", status: "Active", supervision_arranged: false }),
      makeRow({ id: "a-2", status: "Active", supervision_arranged: false }),
    ];
    const a = computeAlerts(rows);
    const m = a.filter((x) => x.type === "active_without_supervision");
    expect(m.length).toBe(2);
  });

  // ── Combined alerts ────────────────────────────────────────────────────

  it("fires all applicable alert types in worst-case scenario", () => {
    const rows = [
      makeRow({
        id: "a-1",
        status: "Active",
        agreement_signed: false,
        dbs_transferred: false,
        induction_completed: false,
        supervision_arranged: false,
      }),
    ];
    const a = computeAlerts(rows);
    const types = new Set(a.map((x) => x.type));
    expect(types.has("active_without_agreement")).toBe(true);
    expect(types.has("active_without_dbs")).toBe(true);
    expect(types.has("active_without_induction")).toBe(true);
    expect(types.has("active_without_supervision")).toBe(true);
  });

  it("alert severity levels are correct across mixed alerts", () => {
    const rows = [
      makeRow({
        id: "a-1",
        status: "Active",
        agreement_signed: false,
        dbs_transferred: false,
        induction_completed: false,
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
      status: "Active",
      agreement_signed: false,
      dbs_transferred: false,
      induction_completed: false,
      supervision_arranged: false,
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
      makeRow({ id: "a-1", status: "Active", agreement_signed: false }),
      makeRow({ id: "a-2", status: "Active", induction_completed: false }),
    ];
    const a = computeAlerts(rows);
    const agreementAlerts = a.filter((x) => x.type === "active_without_agreement");
    const inductionAlerts = a.filter((x) => x.type === "active_without_induction");
    expect(agreementAlerts.length).toBe(1);
    expect(inductionAlerts.length).toBe(1);
    expect(agreementAlerts[0].record_id).toBe("a-1");
    expect(inductionAlerts[0].record_id).toBe("a-2");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeAriaInsights
// ══════════════════════════════════════════════════════════════════════════════

describe("computeAriaInsights", () => {
  // ── Structure ──────────────────────────────────────────────────────────

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

  // ── Insight 1: purple-themed summary ──────────────────────────────────

  it("first insight starts with [purple]", () => {
    const insights = computeAriaInsights([makeRow()]);
    expect(insights[0]).toMatch(/^\[purple\]/);
  });

  it("first insight includes total secondment count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const insights = computeAriaInsights(rows);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes unique staff count", () => {
    const rows = [
      makeRow({ staff_name: "Alice" }),
      makeRow({ staff_name: "Bob" }),
    ];
    const insights = computeAriaInsights(rows);
    expect(insights[0]).toContain("2");
  });

  it("first insight includes active count", () => {
    const rows = [
      makeRow({ status: "Active" }),
      makeRow({ status: "Completed" }),
    ];
    const insights = computeAriaInsights(rows);
    expect(insights[0]).toContain("1 active");
  });

  it("first insight includes completed count", () => {
    const rows = [makeRow({ status: "Completed" })];
    const insights = computeAriaInsights(rows);
    expect(insights[0]).toContain("1 completed");
  });

  it("first insight includes pending count", () => {
    const rows = [makeRow({ status: "Pending" })];
    const insights = computeAriaInsights(rows);
    expect(insights[0]).toContain("1 pending");
  });

  it("first insight uses singular arrangement for 1 record", () => {
    const insights = computeAriaInsights([makeRow()]);
    expect(insights[0]).toContain("1 secondment arrangement");
    expect(insights[0]).not.toContain("arrangements tracked");
  });

  it("first insight uses plural arrangements for 2+ records", () => {
    const rows = [makeRow(), makeRow()];
    const insights = computeAriaInsights(rows);
    expect(insights[0]).toContain("arrangements");
  });

  it("first insight uses singular staff member for 1 staff", () => {
    const insights = computeAriaInsights([makeRow()]);
    expect(insights[0]).toContain("staff member");
    expect(insights[0]).not.toContain("staff members.");
  });

  it("first insight uses plural staff members for 2+ staff", () => {
    const rows = [makeRow({ staff_name: "Alice" }), makeRow({ staff_name: "Bob" })];
    const insights = computeAriaInsights(rows);
    expect(insights[0]).toContain("staff members");
  });

  // ── Insight 2: amber-themed priorities ─────────────────────────────────

  it("second insight starts with [amber]", () => {
    const insights = computeAriaInsights([makeRow()]);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions alerts when critical alerts exist", () => {
    const rows = [makeRow({ status: "Active", agreement_signed: false })];
    const insights = computeAriaInsights(rows);
    expect(insights[1]).toContain("critical");
  });

  it("second insight mentions no alerts when all compliant", () => {
    const rows = [makeRow()];
    const insights = computeAriaInsights(rows);
    expect(insights[1]).toMatch(/[Nn]o critical/);
  });

  it("second insight includes agreement rate", () => {
    const rows = [makeRow({ status: "Active", agreement_signed: false }), makeRow({ agreement_signed: true })];
    const insights = computeAriaInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes induction rate", () => {
    const rows = [makeRow({ status: "Active", induction_completed: false }), makeRow({ induction_completed: true })];
    const insights = computeAriaInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes DBS transfer rate when alerts present", () => {
    const rows = [
      makeRow({ status: "Active", agreement_signed: false, dbs_transferred: true }),
      makeRow({ dbs_transferred: false }),
    ];
    const insights = computeAriaInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight mentions high-priority count when present", () => {
    const rows = [makeRow({ status: "Active", induction_completed: false })];
    const insights = computeAriaInsights(rows);
    expect(insights[1]).toContain("high-priority");
  });

  it("second insight mentions Reg 32 when no alerts", () => {
    const rows = [makeRow()];
    const insights = computeAriaInsights(rows);
    expect(insights[1]).toContain("Reg 32");
  });

  // ── Insight 3: reflect-themed question ─────────────────────────────────

  it("third insight starts with [reflect]", () => {
    const insights = computeAriaInsights([makeRow()]);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions critical alerts when present", () => {
    const rows = [makeRow({ status: "Active", agreement_signed: false })];
    const insights = computeAriaInsights(rows);
    expect(insights[2]).toContain("critical");
  });

  it("third insight uses singular for 1 critical alert", () => {
    const rows = [makeRow({ status: "Active", agreement_signed: false })];
    const insights = computeAriaInsights(rows);
    expect(insights[2]).toContain("alert requires");
  });

  it("third insight uses plural for 2+ critical alerts", () => {
    const rows = [
      makeRow({ status: "Active", agreement_signed: false, staff_name: "Alice" }),
      makeRow({ status: "Active", dbs_transferred: false, staff_name: "Bob" }),
    ];
    const insights = computeAriaInsights(rows);
    expect(insights[2]).toContain("alerts require");
  });

  it("third insight addresses supervision when no critical but rate < 100", () => {
    const rows = [
      makeRow({ status: "Active", supervision_arranged: false, agreement_signed: true, dbs_transferred: true, induction_completed: true }),
    ];
    const insights = computeAriaInsights(rows);
    expect(insights[2]).toContain("supervision");
  });

  it("third insight celebrates full compliance when all compliant and supervised", () => {
    const rows = [
      makeRow({ status: "Active", supervision_arranged: true }),
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

  it("third insight references Reg 32 when critical alerts present", () => {
    const rows = [makeRow({ status: "Active", agreement_signed: false })];
    const insights = computeAriaInsights(rows);
    expect(insights[2]).toContain("Reg 32");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CRUD (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD when Supabase disabled", () => {
  it("listStaffSecondmentManagement returns empty data", async () => {
    const { listStaffSecondmentManagement } = await import("../staff-secondment-management-service");
    const result = await listStaffSecondmentManagement("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("createStaffSecondmentManagement returns error", async () => {
    const { createStaffSecondmentManagement } = await import("../staff-secondment-management-service");
    const result = await createStaffSecondmentManagement({
      homeId: "home-1",
      staffName: "Jane Smith",
      secondmentType: "Incoming",
      sendingOrganisation: "Council A",
      receivingOrganisation: "Chamberlain House",
      startDate: "2026-05-15",
      status: "Active",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("updateStaffSecondmentManagement returns error", async () => {
    const { updateStaffSecondmentManagement } = await import("../staff-secondment-management-service");
    const result = await updateStaffSecondmentManagement("rec-1", { notes: "updated" });
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
      agreement_signed: false,
      dbs_transferred: false,
      induction_completed: false,
      supervision_arranged: false,
      objectives_agreed: false,
      extension_requested: false,
    });
    const m = computeMetrics([row]);
    expect(m.agreement_rate).toBe(0);
    expect(m.dbs_transfer_rate).toBe(0);
    expect(m.induction_rate).toBe(0);
    expect(m.supervision_rate).toBe(0);
    expect(m.objectives_rate).toBe(0);
    expect(m.extension_count).toBe(0);
  });

  it("alerts for active record with all flags triggering", () => {
    const row = makeRow({
      status: "Active",
      agreement_signed: false,
      dbs_transferred: false,
      induction_completed: false,
      supervision_arranged: false,
    });
    const a = computeAlerts([row]);
    expect(a.length).toBeGreaterThanOrEqual(4);
  });

  it("makeRow factory with overrides preserves overrides", () => {
    const row = makeRow({
      staff_name: "Custom Name",
      secondment_type: "Cross-Organisation",
      status: "Extended",
    });
    expect(row.staff_name).toBe("Custom Name");
    expect(row.secondment_type).toBe("Cross-Organisation");
    expect(row.status).toBe("Extended");
  });

  it("makeRow factory nullable fields have expected defaults", () => {
    const row = makeRow();
    expect(row.end_date).toBeNull();
    expect(row.notes).toBeNull();
  });

  it("makeRow factory allows setting nullable fields", () => {
    const row = makeRow({
      end_date: "2027-01-01",
      notes: "Secondment extended by 3 months",
    });
    expect(row.end_date).toBe("2027-01-01");
    expect(row.notes).toBe("Secondment extended by 3 months");
  });

  it("makeRow factory allows explicitly setting nullable fields to null", () => {
    const row = makeRow({ end_date: null, notes: null, review_date: null });
    expect(row.end_date).toBeNull();
    expect(row.notes).toBeNull();
    expect(row.review_date).toBeNull();
  });

  it("makeRow factory review_date defaults to a date string", () => {
    const row = makeRow();
    expect(row.review_date).toBe("2026-06-15");
  });

  it("makeRow factory allows overriding review_date", () => {
    const row = makeRow({ review_date: "2027-03-01" });
    expect(row.review_date).toBe("2027-03-01");
  });

  it("makeRow factory extension_requested defaults to false", () => {
    const row = makeRow();
    expect(row.extension_requested).toBe(false);
  });

  it("makeRow factory allows overriding extension_requested", () => {
    const row = makeRow({ extension_requested: true });
    expect(row.extension_requested).toBe(true);
  });

  it("metrics handles large dataset", () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      makeRow({
        staff_name: `Staff ${i % 10}`,
        status: SECONDMENT_STATUSES[i % 5],
        agreement_signed: i % 3 !== 0,
        dbs_transferred: i % 4 !== 0,
      }),
    );
    const m = computeMetrics(rows);
    expect(m.total_secondments).toBe(100);
    expect(m.unique_staff).toBe(10);
    expect(m.active_count).toBe(20);
  });

  it("insights handle empty data gracefully", () => {
    const insights = computeAriaInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("0 secondment");
    expect(insights[0]).toContain("0 staff");
  });

  it("alerts handle no problematic records", () => {
    const rows = Array.from({ length: 5 }, () => makeRow());
    const a = computeAlerts(rows);
    expect(a).toEqual([]);
  });

  it("metrics with all five statuses", () => {
    const rows = SECONDMENT_STATUSES.map((s, i) => makeRow({ id: `a-${i}`, status: s }));
    const m = computeMetrics(rows);
    expect(m.total_secondments).toBe(5);
    expect(m.active_count).toBe(1);
    expect(m.completed_count).toBe(1);
    expect(m.pending_count).toBe(1);
  });

  it("DBS alert only fires for active without DBS, not for completed status", () => {
    const a = computeAlerts([makeRow({ status: "Completed", dbs_transferred: false })]);
    const dbs = a.filter((x) => x.type === "active_without_dbs");
    expect(dbs.length).toBe(0);
  });

  it("agreement alert does not fire for active with agreement signed", () => {
    const a = computeAlerts([makeRow({ status: "Active", agreement_signed: true })]);
    const nc = a.filter((x) => x.type === "active_without_agreement");
    expect(nc.length).toBe(0);
  });

  it("metrics unique_staff with single staff across secondments", () => {
    const rows = [
      makeRow({ staff_name: "Same Person", sending_organisation: "Org A" }),
      makeRow({ staff_name: "Same Person", sending_organisation: "Org B" }),
      makeRow({ staff_name: "Same Person", sending_organisation: "Org C" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_staff).toBe(1);
  });

  it("insights with only critical alerts show correct count", () => {
    const rows = [makeRow({ status: "Active", agreement_signed: false })];
    const insights = computeAriaInsights(rows);
    expect(insights[1]).toMatch(/\d+ critical/);
  });

  it("insights with only high alerts show correct count", () => {
    const rows = [makeRow({ status: "Active", induction_completed: false, agreement_signed: true, dbs_transferred: true })];
    const insights = computeAriaInsights(rows);
    expect(insights[1]).toMatch(/\d+ high-priority/);
  });

  it("insights reflect question path for supervision < 100%", () => {
    const rows = [makeRow({ status: "Active", supervision_arranged: false, agreement_signed: true, dbs_transferred: true, induction_completed: true })];
    const insights = computeAriaInsights(rows);
    expect(insights[2]).toContain("supervision");
    expect(insights[2]).toContain("0%");
  });

  it("all alert record_ids match the source row id", () => {
    const row = makeRow({
      id: "unique-test-id",
      status: "Active",
      agreement_signed: false,
      dbs_transferred: false,
      induction_completed: false,
      supervision_arranged: false,
    });
    const a = computeAlerts([row]);
    for (const alert of a) {
      expect(alert.record_id).toBe("unique-test-id");
    }
  });

  it("metrics with all four secondment types", () => {
    const rows = SECONDMENT_TYPES.map((t, i) => makeRow({ id: `a-${i}`, secondment_type: t }));
    const m = computeMetrics(rows);
    expect(m.total_secondments).toBe(4);
  });

  it("alerts only consider active status, not extended or terminated", () => {
    const rows = [
      makeRow({ status: "Extended", agreement_signed: false }),
      makeRow({ status: "Terminated Early", dbs_transferred: false }),
    ];
    const a = computeAlerts(rows);
    expect(a).toEqual([]);
  });

  it("metrics extension_count with all extensions requested", () => {
    const rows = Array.from({ length: 5 }, () => makeRow({ extension_requested: true }));
    expect(computeMetrics(rows).extension_count).toBe(5);
  });

  it("metrics review_scheduled_rate is 100 for default makeRow", () => {
    expect(computeMetrics([makeRow()]).review_scheduled_rate).toBe(100);
  });

  it("metrics review_scheduled_rate mixed (33.3%)", () => {
    const rows = [
      makeRow({ review_date: "2026-06-15" }),
      makeRow({ review_date: null }),
      makeRow({ review_date: null }),
    ];
    expect(computeMetrics(rows).review_scheduled_rate).toBe(33.3);
  });

  it("alerts do not fire for pending records with missing checks", () => {
    const rows = [makeRow({ status: "Pending", agreement_signed: false, dbs_transferred: false, induction_completed: false, supervision_arranged: false })];
    expect(computeAlerts(rows)).toEqual([]);
  });

  it("metrics with mixed secondment types and statuses", () => {
    const rows = [
      makeRow({ secondment_type: "Incoming", status: "Active" }),
      makeRow({ secondment_type: "Outgoing", status: "Completed" }),
      makeRow({ secondment_type: "Internal Transfer", status: "Pending" }),
      makeRow({ secondment_type: "Cross-Organisation", status: "Extended" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_secondments).toBe(4);
    expect(m.active_count).toBe(1);
    expect(m.completed_count).toBe(1);
    expect(m.pending_count).toBe(1);
  });
});
