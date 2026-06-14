// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF DBS RENEWAL TRACKING SERVICE TESTS
// Pure-function unit tests for DBS renewal metrics, alert identification,
// and Cara insight generation.
//
// CHR 2015 Reg 32 (fitness of premises — DBS requirements),
// CHR 2015 Sch 2 (information in respect of persons seeking to carry on,
// manage, or work at a children's home).
// Safeguarding Vulnerable Groups Act 2006.
//
// Covers: DBS check management, renewal tracking, update service registration,
// barred list checks, enhanced DBS, portability tracking, identity verification,
// right to work confirmation, overseas checks, and risk assessment completion.
//
// SCCIF: Leadership & Management — "Robust safer recruitment practices."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  type StaffDbsRenewalTrackingRow,
  DBS_TYPES,
  DBS_STATUSES,
  CHECK_OUTCOMES,
  RENEWAL_PRIORITIES,
} from "../staff-dbs-renewal-tracking-service";

const { computeDbsMetrics, computeDbsAlerts, generateDbsCaraInsights } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(overrides?: Partial<StaffDbsRenewalTrackingRow>): StaffDbsRenewalTrackingRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    staff_name: "staff_name" in (overrides ?? {}) ? overrides!.staff_name! : "Jane Smith",
    staff_id: "staff_id" in (overrides ?? {}) ? (overrides!.staff_id ?? null) : null,
    check_date: "check_date" in (overrides ?? {}) ? overrides!.check_date! : now.toISOString().split("T")[0],
    dbs_type: "dbs_type" in (overrides ?? {}) ? overrides!.dbs_type! : "enhanced",
    dbs_status: "dbs_status" in (overrides ?? {}) ? overrides!.dbs_status! : "current",
    check_outcome: "check_outcome" in (overrides ?? {}) ? overrides!.check_outcome! : "clear",
    renewal_priority: "renewal_priority" in (overrides ?? {}) ? overrides!.renewal_priority! : "routine",
    dbs_number: "dbs_number" in (overrides ?? {}) ? (overrides!.dbs_number ?? null) : "DBS-001234",
    issue_date: "issue_date" in (overrides ?? {}) ? overrides!.issue_date! : now.toISOString().split("T")[0],
    renewal_date: "renewal_date" in (overrides ?? {}) ? (overrides!.renewal_date ?? null) : null,
    enhanced_check_completed: "enhanced_check_completed" in (overrides ?? {}) ? overrides!.enhanced_check_completed! : true,
    barred_list_checked: "barred_list_checked" in (overrides ?? {}) ? overrides!.barred_list_checked! : true,
    update_service_registered: "update_service_registered" in (overrides ?? {}) ? overrides!.update_service_registered! : true,
    identity_verified: "identity_verified" in (overrides ?? {}) ? overrides!.identity_verified! : true,
    right_to_work_confirmed: "right_to_work_confirmed" in (overrides ?? {}) ? overrides!.right_to_work_confirmed! : true,
    risk_assessment_completed: "risk_assessment_completed" in (overrides ?? {}) ? overrides!.risk_assessment_completed! : true,
    overseas_check_completed: "overseas_check_completed" in (overrides ?? {}) ? overrides!.overseas_check_completed! : true,
    references_verified: "references_verified" in (overrides ?? {}) ? overrides!.references_verified! : true,
    reviewer_name: "reviewer_name" in (overrides ?? {}) ? (overrides!.reviewer_name ?? null) : null,
    disclosed_information: "disclosed_information" in (overrides ?? {}) ? (overrides!.disclosed_information ?? null) : null,
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
  it("DBS_TYPES has 5 entries", () => {
    expect(DBS_TYPES).toHaveLength(5);
  });

  it("DBS_TYPES includes all values", () => {
    expect(DBS_TYPES).toContain("enhanced");
    expect(DBS_TYPES).toContain("enhanced_barred");
    expect(DBS_TYPES).toContain("standard");
    expect(DBS_TYPES).toContain("basic");
    expect(DBS_TYPES).toContain("update_service");
  });

  it("DBS_TYPES has unique values", () => {
    expect(new Set(DBS_TYPES).size).toBe(DBS_TYPES.length);
  });

  it("DBS_STATUSES has 6 entries", () => {
    expect(DBS_STATUSES).toHaveLength(6);
  });

  it("DBS_STATUSES includes all values", () => {
    expect(DBS_STATUSES).toContain("current");
    expect(DBS_STATUSES).toContain("renewal_due");
    expect(DBS_STATUSES).toContain("expired");
    expect(DBS_STATUSES).toContain("pending");
    expect(DBS_STATUSES).toContain("not_applied");
    expect(DBS_STATUSES).toContain("portability_accepted");
  });

  it("DBS_STATUSES has unique values", () => {
    expect(new Set(DBS_STATUSES).size).toBe(DBS_STATUSES.length);
  });

  it("CHECK_OUTCOMES has 5 entries", () => {
    expect(CHECK_OUTCOMES).toHaveLength(5);
  });

  it("CHECK_OUTCOMES includes all values", () => {
    expect(CHECK_OUTCOMES).toContain("clear");
    expect(CHECK_OUTCOMES).toContain("information_disclosed");
    expect(CHECK_OUTCOMES).toContain("barred");
    expect(CHECK_OUTCOMES).toContain("pending_outcome");
    expect(CHECK_OUTCOMES).toContain("risk_assessed");
  });

  it("CHECK_OUTCOMES has unique values", () => {
    expect(new Set(CHECK_OUTCOMES).size).toBe(CHECK_OUTCOMES.length);
  });

  it("RENEWAL_PRIORITIES has 5 entries", () => {
    expect(RENEWAL_PRIORITIES).toHaveLength(5);
  });

  it("RENEWAL_PRIORITIES includes all values", () => {
    expect(RENEWAL_PRIORITIES).toContain("routine");
    expect(RENEWAL_PRIORITIES).toContain("approaching");
    expect(RENEWAL_PRIORITIES).toContain("urgent");
    expect(RENEWAL_PRIORITIES).toContain("overdue");
    expect(RENEWAL_PRIORITIES).toContain("critical");
  });

  it("RENEWAL_PRIORITIES has unique values", () => {
    expect(new Set(RENEWAL_PRIORITIES).size).toBe(RENEWAL_PRIORITIES.length);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeDbsMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeDbsMetrics", () => {
  // ── Empty / baseline ────────────────────────────────────────────────────

  it("returns zeros for empty array", () => {
    const m = computeDbsMetrics([]);
    expect(m.total_checks).toBe(0);
    expect(m.expired_count).toBe(0);
    expect(m.renewal_due_count).toBe(0);
    expect(m.pending_count).toBe(0);
    expect(m.disclosed_count).toBe(0);
    expect(m.unique_staff).toBe(0);
  });

  it("returns empty breakdowns for empty array", () => {
    const m = computeDbsMetrics([]);
    expect(m.dbs_type_breakdown).toEqual({});
    expect(m.status_breakdown).toEqual({});
  });

  it("returns 0 rates for empty array", () => {
    const m = computeDbsMetrics([]);
    expect(m.enhanced_check_rate).toBe(0);
    expect(m.barred_list_rate).toBe(0);
    expect(m.update_service_rate).toBe(0);
    expect(m.identity_verified_rate).toBe(0);
    expect(m.right_to_work_rate).toBe(0);
    expect(m.risk_assessment_rate).toBe(0);
    expect(m.overseas_check_rate).toBe(0);
    expect(m.references_verified_rate).toBe(0);
  });

  // ── total_checks ───────────────────────────────────────────────────────

  it("total_checks counts single record", () => {
    expect(computeDbsMetrics([makeRow()]).total_checks).toBe(1);
  });

  it("total_checks counts multiple records", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    expect(computeDbsMetrics(rows).total_checks).toBe(3);
  });

  // ── Status counts ───────────────────────────────────────────────────────

  it("counts expired", () => {
    expect(computeDbsMetrics([makeRow({ dbs_status: "expired" })]).expired_count).toBe(1);
  });

  it("counts renewal_due", () => {
    expect(computeDbsMetrics([makeRow({ dbs_status: "renewal_due" })]).renewal_due_count).toBe(1);
  });

  it("counts pending", () => {
    expect(computeDbsMetrics([makeRow({ dbs_status: "pending" })]).pending_count).toBe(1);
  });

  it("counts disclosed information", () => {
    expect(computeDbsMetrics([makeRow({ check_outcome: "information_disclosed" })]).disclosed_count).toBe(1);
  });

  it("does not count current as expired", () => {
    const m = computeDbsMetrics([makeRow({ dbs_status: "current" })]);
    expect(m.expired_count).toBe(0);
  });

  it("does not count not_applied as pending", () => {
    const m = computeDbsMetrics([makeRow({ dbs_status: "not_applied" })]);
    expect(m.pending_count).toBe(0);
  });

  it("does not count portability_accepted as renewal_due", () => {
    const m = computeDbsMetrics([makeRow({ dbs_status: "portability_accepted" })]);
    expect(m.renewal_due_count).toBe(0);
  });

  it("does not count clear outcome as disclosed", () => {
    const m = computeDbsMetrics([makeRow({ check_outcome: "clear" })]);
    expect(m.disclosed_count).toBe(0);
  });

  it("counts multiple expired", () => {
    const rows = [
      makeRow({ dbs_status: "expired" }),
      makeRow({ dbs_status: "expired" }),
      makeRow({ dbs_status: "current" }),
    ];
    expect(computeDbsMetrics(rows).expired_count).toBe(2);
  });

  it("counts multiple disclosed", () => {
    const rows = [
      makeRow({ check_outcome: "information_disclosed" }),
      makeRow({ check_outcome: "information_disclosed" }),
      makeRow({ check_outcome: "clear" }),
    ];
    expect(computeDbsMetrics(rows).disclosed_count).toBe(2);
  });

  // ── Boolean rates ───────────────────────────────────────────────────────

  it("returns 100% for all boolean rates when defaults are true", () => {
    const m = computeDbsMetrics([makeRow()]);
    expect(m.enhanced_check_rate).toBe(100);
    expect(m.barred_list_rate).toBe(100);
    expect(m.update_service_rate).toBe(100);
    expect(m.identity_verified_rate).toBe(100);
    expect(m.right_to_work_rate).toBe(100);
    expect(m.risk_assessment_rate).toBe(100);
    expect(m.overseas_check_rate).toBe(100);
    expect(m.references_verified_rate).toBe(100);
  });

  it("enhanced_check_rate is 0 when false", () => {
    expect(computeDbsMetrics([makeRow({ enhanced_check_completed: false })]).enhanced_check_rate).toBe(0);
  });

  it("barred_list_rate is 0 when false", () => {
    expect(computeDbsMetrics([makeRow({ barred_list_checked: false })]).barred_list_rate).toBe(0);
  });

  it("update_service_rate is 0 when false", () => {
    expect(computeDbsMetrics([makeRow({ update_service_registered: false })]).update_service_rate).toBe(0);
  });

  it("identity_verified_rate is 0 when false", () => {
    expect(computeDbsMetrics([makeRow({ identity_verified: false })]).identity_verified_rate).toBe(0);
  });

  it("right_to_work_rate is 0 when false", () => {
    expect(computeDbsMetrics([makeRow({ right_to_work_confirmed: false })]).right_to_work_rate).toBe(0);
  });

  it("risk_assessment_rate is 0 when false", () => {
    expect(computeDbsMetrics([makeRow({ risk_assessment_completed: false })]).risk_assessment_rate).toBe(0);
  });

  it("overseas_check_rate is 0 when false", () => {
    expect(computeDbsMetrics([makeRow({ overseas_check_completed: false })]).overseas_check_rate).toBe(0);
  });

  it("references_verified_rate is 0 when false", () => {
    expect(computeDbsMetrics([makeRow({ references_verified: false })]).references_verified_rate).toBe(0);
  });

  it("mixed boolean rate computes correctly (66.7%)", () => {
    const rows = [
      makeRow({ enhanced_check_completed: true }),
      makeRow({ enhanced_check_completed: true }),
      makeRow({ enhanced_check_completed: false }),
    ];
    expect(computeDbsMetrics(rows).enhanced_check_rate).toBe(66.7);
  });

  it("mixed boolean rate computes correctly (50%)", () => {
    const rows = [
      makeRow({ barred_list_checked: true }),
      makeRow({ barred_list_checked: false }),
    ];
    expect(computeDbsMetrics(rows).barred_list_rate).toBe(50);
  });

  it("mixed boolean rate computes correctly (33.3%)", () => {
    const rows = [
      makeRow({ update_service_registered: true }),
      makeRow({ update_service_registered: false }),
      makeRow({ update_service_registered: false }),
    ];
    expect(computeDbsMetrics(rows).update_service_rate).toBe(33.3);
  });

  it("mixed boolean rate computes correctly (25%)", () => {
    const rows = [
      makeRow({ identity_verified: true }),
      makeRow({ identity_verified: false }),
      makeRow({ identity_verified: false }),
      makeRow({ identity_verified: false }),
    ];
    expect(computeDbsMetrics(rows).identity_verified_rate).toBe(25);
  });

  // ── unique_staff ────────────────────────────────────────────────────────

  it("unique_staff counts 1 for single record", () => {
    expect(computeDbsMetrics([makeRow()]).unique_staff).toBe(1);
  });

  it("unique_staff counts distinct names", () => {
    const rows = [
      makeRow({ staff_name: "Alice Brown" }),
      makeRow({ staff_name: "Bob Green" }),
      makeRow({ staff_name: "Alice Brown" }),
    ];
    expect(computeDbsMetrics(rows).unique_staff).toBe(2);
  });

  it("unique_staff counts all different names", () => {
    const rows = [
      makeRow({ staff_name: "Alice" }),
      makeRow({ staff_name: "Bob" }),
      makeRow({ staff_name: "Charlie" }),
    ];
    expect(computeDbsMetrics(rows).unique_staff).toBe(3);
  });

  // ── dbs_type_breakdown ─────────────────────────────────────────────────

  it("dbs_type_breakdown counts all 5 types", () => {
    const rows = DBS_TYPES.map((t, i) => makeRow({ id: `a-${i}`, dbs_type: t }));
    const m = computeDbsMetrics(rows);
    for (const t of DBS_TYPES) expect(m.dbs_type_breakdown[t]).toBe(1);
  });

  it("dbs_type_breakdown counts multiples of same type", () => {
    const rows = [
      makeRow({ dbs_type: "enhanced" }),
      makeRow({ dbs_type: "enhanced" }),
      makeRow({ dbs_type: "basic" }),
    ];
    const m = computeDbsMetrics(rows);
    expect(m.dbs_type_breakdown["enhanced"]).toBe(2);
    expect(m.dbs_type_breakdown["basic"]).toBe(1);
  });

  it("dbs_type_breakdown does not include absent types", () => {
    const rows = [makeRow({ dbs_type: "enhanced" })];
    const m = computeDbsMetrics(rows);
    expect(m.dbs_type_breakdown["basic"]).toBeUndefined();
  });

  // ── status_breakdown ───────────────────────────────────────────────────

  it("status_breakdown counts all 6 statuses", () => {
    const rows = DBS_STATUSES.map((s, i) => makeRow({ id: `a-${i}`, dbs_status: s }));
    const m = computeDbsMetrics(rows);
    for (const s of DBS_STATUSES) expect(m.status_breakdown[s]).toBe(1);
  });

  it("status_breakdown counts multiples of same status", () => {
    const rows = [
      makeRow({ dbs_status: "current" }),
      makeRow({ dbs_status: "current" }),
      makeRow({ dbs_status: "expired" }),
    ];
    const m = computeDbsMetrics(rows);
    expect(m.status_breakdown["current"]).toBe(2);
    expect(m.status_breakdown["expired"]).toBe(1);
  });

  it("status_breakdown does not include absent statuses", () => {
    const rows = [makeRow({ dbs_status: "current" })];
    const m = computeDbsMetrics(rows);
    expect(m.status_breakdown["expired"]).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeDbsAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("computeDbsAlerts", () => {
  // ── Clean / empty ───────────────────────────────────────────────────────

  it("returns empty for empty array", () => {
    expect(computeDbsAlerts([])).toEqual([]);
  });

  it("returns empty for fully compliant record", () => {
    const alerts = computeDbsAlerts([makeRow()]);
    // Default row: current, enhanced, barred_list_checked=true, enhanced_check_completed=true,
    // update_service_registered=true, overseas_check_completed=true, renewal_priority=routine
    expect(alerts).toEqual([]);
  });

  // ── Critical: expired_dbs_still_working ────────────────────────────────

  it("fires critical for expired DBS", () => {
    const a = computeDbsAlerts([makeRow({ dbs_status: "expired" })]);
    const c = a.filter((x) => x.type === "expired_dbs_still_working" && x.severity === "critical");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("expired alert includes staff name", () => {
    const a = computeDbsAlerts([makeRow({ dbs_status: "expired", staff_name: "Alice Brown" })]);
    const c = a.filter((x) => x.type === "expired_dbs_still_working");
    expect(c[0].message).toContain("Alice Brown");
  });

  it("expired alert includes record_id", () => {
    const a = computeDbsAlerts([makeRow({ id: "rec-123", dbs_status: "expired" })]);
    const c = a.filter((x) => x.type === "expired_dbs_still_working");
    expect(c[0].record_id).toBe("rec-123");
  });

  it("expired alert references Reg 32", () => {
    const a = computeDbsAlerts([makeRow({ dbs_status: "expired" })]);
    const c = a.filter((x) => x.type === "expired_dbs_still_working");
    expect(c[0].message).toContain("Reg 32");
  });

  it("does NOT fire expired for current status", () => {
    const a = computeDbsAlerts([makeRow({ dbs_status: "current" })]);
    const c = a.filter((x) => x.type === "expired_dbs_still_working");
    expect(c.length).toBe(0);
  });

  it("does NOT fire expired for renewal_due status", () => {
    const a = computeDbsAlerts([makeRow({ dbs_status: "renewal_due" })]);
    const c = a.filter((x) => x.type === "expired_dbs_still_working");
    expect(c.length).toBe(0);
  });

  it("does NOT fire expired for pending status", () => {
    const a = computeDbsAlerts([makeRow({ dbs_status: "pending" })]);
    const c = a.filter((x) => x.type === "expired_dbs_still_working");
    expect(c.length).toBe(0);
  });

  it("fires expired per-record for multiple expired", () => {
    const rows = [
      makeRow({ id: "a-1", dbs_status: "expired" }),
      makeRow({ id: "a-2", dbs_status: "expired" }),
    ];
    const a = computeDbsAlerts(rows);
    const c = a.filter((x) => x.type === "expired_dbs_still_working");
    expect(c.length).toBe(2);
  });

  // ── Critical: barred_list_not_checked ──────────────────────────────────

  it("fires critical for enhanced DBS without barred list check", () => {
    const a = computeDbsAlerts([makeRow({ barred_list_checked: false, dbs_type: "enhanced" })]);
    const c = a.filter((x) => x.type === "barred_list_not_checked" && x.severity === "critical");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("fires critical for enhanced_barred DBS without barred list check", () => {
    const a = computeDbsAlerts([makeRow({ barred_list_checked: false, dbs_type: "enhanced_barred" })]);
    const c = a.filter((x) => x.type === "barred_list_not_checked");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("barred list alert includes staff name", () => {
    const a = computeDbsAlerts([makeRow({ barred_list_checked: false, dbs_type: "enhanced", staff_name: "Bob Green" })]);
    const c = a.filter((x) => x.type === "barred_list_not_checked");
    expect(c[0].message).toContain("Bob Green");
  });

  it("barred list alert includes record_id", () => {
    const a = computeDbsAlerts([makeRow({ id: "rec-456", barred_list_checked: false, dbs_type: "enhanced" })]);
    const c = a.filter((x) => x.type === "barred_list_not_checked");
    expect(c[0].record_id).toBe("rec-456");
  });

  it("barred list alert references Safeguarding Vulnerable Groups Act", () => {
    const a = computeDbsAlerts([makeRow({ barred_list_checked: false, dbs_type: "enhanced" })]);
    const c = a.filter((x) => x.type === "barred_list_not_checked");
    expect(c[0].message).toContain("Safeguarding Vulnerable Groups Act");
  });

  it("does NOT fire barred list for standard DBS without check", () => {
    const a = computeDbsAlerts([makeRow({ barred_list_checked: false, dbs_type: "standard" })]);
    const c = a.filter((x) => x.type === "barred_list_not_checked");
    expect(c.length).toBe(0);
  });

  it("does NOT fire barred list for basic DBS without check", () => {
    const a = computeDbsAlerts([makeRow({ barred_list_checked: false, dbs_type: "basic" })]);
    const c = a.filter((x) => x.type === "barred_list_not_checked");
    expect(c.length).toBe(0);
  });

  it("does NOT fire barred list when barred_list_checked is true", () => {
    const a = computeDbsAlerts([makeRow({ barred_list_checked: true, dbs_type: "enhanced" })]);
    const c = a.filter((x) => x.type === "barred_list_not_checked");
    expect(c.length).toBe(0);
  });

  it("fires barred list per-record for multiple unchecked", () => {
    const rows = [
      makeRow({ id: "a-1", barred_list_checked: false, dbs_type: "enhanced" }),
      makeRow({ id: "a-2", barred_list_checked: false, dbs_type: "enhanced_barred" }),
    ];
    const a = computeDbsAlerts(rows);
    const c = a.filter((x) => x.type === "barred_list_not_checked");
    expect(c.length).toBe(2);
  });

  // ── High: renewal_overdue_priority ─────────────────────────────────────

  it("fires high for overdue renewal priority", () => {
    const a = computeDbsAlerts([makeRow({ renewal_priority: "overdue" })]);
    const h = a.filter((x) => x.type === "renewal_overdue_priority" && x.severity === "high");
    expect(h.length).toBeGreaterThanOrEqual(1);
  });

  it("fires high for critical renewal priority", () => {
    const a = computeDbsAlerts([makeRow({ renewal_priority: "critical" })]);
    const h = a.filter((x) => x.type === "renewal_overdue_priority" && x.severity === "high");
    expect(h.length).toBeGreaterThanOrEqual(1);
  });

  it("renewal priority alert includes staff name", () => {
    const a = computeDbsAlerts([makeRow({ renewal_priority: "overdue", staff_name: "Charlie Davis" })]);
    const h = a.filter((x) => x.type === "renewal_overdue_priority");
    expect(h[0].message).toContain("Charlie Davis");
  });

  it("renewal priority alert includes priority level", () => {
    const a = computeDbsAlerts([makeRow({ renewal_priority: "overdue" })]);
    const h = a.filter((x) => x.type === "renewal_overdue_priority");
    expect(h[0].message).toContain("overdue");
  });

  it("renewal priority alert includes record_id", () => {
    const a = computeDbsAlerts([makeRow({ id: "rec-789", renewal_priority: "critical" })]);
    const h = a.filter((x) => x.type === "renewal_overdue_priority");
    expect(h[0].record_id).toBe("rec-789");
  });

  it("does NOT fire renewal priority for routine", () => {
    const a = computeDbsAlerts([makeRow({ renewal_priority: "routine" })]);
    const h = a.filter((x) => x.type === "renewal_overdue_priority");
    expect(h.length).toBe(0);
  });

  it("does NOT fire renewal priority for approaching", () => {
    const a = computeDbsAlerts([makeRow({ renewal_priority: "approaching" })]);
    const h = a.filter((x) => x.type === "renewal_overdue_priority");
    expect(h.length).toBe(0);
  });

  it("does NOT fire renewal priority for urgent", () => {
    const a = computeDbsAlerts([makeRow({ renewal_priority: "urgent" })]);
    const h = a.filter((x) => x.type === "renewal_overdue_priority");
    expect(h.length).toBe(0);
  });

  it("fires renewal priority per-record for multiple overdue", () => {
    const rows = [
      makeRow({ id: "a-1", renewal_priority: "overdue" }),
      makeRow({ id: "a-2", renewal_priority: "critical" }),
    ];
    const a = computeDbsAlerts(rows);
    const h = a.filter((x) => x.type === "renewal_overdue_priority");
    expect(h.length).toBe(2);
  });

  // ── High: enhanced_not_completed ───────────────────────────────────────

  it("fires high for enhanced DBS without enhanced check completed", () => {
    const a = computeDbsAlerts([makeRow({ enhanced_check_completed: false, dbs_type: "enhanced" })]);
    const h = a.filter((x) => x.type === "enhanced_not_completed" && x.severity === "high");
    expect(h.length).toBeGreaterThanOrEqual(1);
  });

  it("fires high for enhanced_barred DBS without enhanced check completed", () => {
    const a = computeDbsAlerts([makeRow({ enhanced_check_completed: false, dbs_type: "enhanced_barred" })]);
    const h = a.filter((x) => x.type === "enhanced_not_completed");
    expect(h.length).toBeGreaterThanOrEqual(1);
  });

  it("enhanced not completed alert includes staff name", () => {
    const a = computeDbsAlerts([makeRow({ enhanced_check_completed: false, dbs_type: "enhanced", staff_name: "Diana Evans" })]);
    const h = a.filter((x) => x.type === "enhanced_not_completed");
    expect(h[0].message).toContain("Diana Evans");
  });

  it("enhanced not completed alert references Reg 32", () => {
    const a = computeDbsAlerts([makeRow({ enhanced_check_completed: false, dbs_type: "enhanced" })]);
    const h = a.filter((x) => x.type === "enhanced_not_completed");
    expect(h[0].message).toContain("Reg 32");
  });

  it("enhanced not completed alert includes record_id", () => {
    const a = computeDbsAlerts([makeRow({ id: "rec-abc", enhanced_check_completed: false, dbs_type: "enhanced" })]);
    const h = a.filter((x) => x.type === "enhanced_not_completed");
    expect(h[0].record_id).toBe("rec-abc");
  });

  it("does NOT fire enhanced not completed for standard DBS", () => {
    const a = computeDbsAlerts([makeRow({ enhanced_check_completed: false, dbs_type: "standard" })]);
    const h = a.filter((x) => x.type === "enhanced_not_completed");
    expect(h.length).toBe(0);
  });

  it("does NOT fire enhanced not completed for basic DBS", () => {
    const a = computeDbsAlerts([makeRow({ enhanced_check_completed: false, dbs_type: "basic" })]);
    const h = a.filter((x) => x.type === "enhanced_not_completed");
    expect(h.length).toBe(0);
  });

  it("does NOT fire enhanced not completed when enhanced_check_completed is true", () => {
    const a = computeDbsAlerts([makeRow({ enhanced_check_completed: true, dbs_type: "enhanced" })]);
    const h = a.filter((x) => x.type === "enhanced_not_completed");
    expect(h.length).toBe(0);
  });

  it("fires enhanced not completed per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", enhanced_check_completed: false, dbs_type: "enhanced" }),
      makeRow({ id: "a-2", enhanced_check_completed: false, dbs_type: "enhanced_barred" }),
    ];
    const a = computeDbsAlerts(rows);
    const h = a.filter((x) => x.type === "enhanced_not_completed");
    expect(h.length).toBe(2);
  });

  // ── Medium: update_service_not_registered ──────────────────────────────

  it("fires medium for unregistered update service with current status", () => {
    const a = computeDbsAlerts([makeRow({ update_service_registered: false, dbs_status: "current" })]);
    const m = a.filter((x) => x.type === "update_service_not_registered" && x.severity === "medium");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("update service alert includes staff name", () => {
    const a = computeDbsAlerts([makeRow({ update_service_registered: false, dbs_status: "current", staff_name: "Eve Foster" })]);
    const m = a.filter((x) => x.type === "update_service_not_registered");
    expect(m[0].message).toContain("Eve Foster");
  });

  it("update service alert includes record_id", () => {
    const a = computeDbsAlerts([makeRow({ id: "rec-def", update_service_registered: false, dbs_status: "current" })]);
    const m = a.filter((x) => x.type === "update_service_not_registered");
    expect(m[0].record_id).toBe("rec-def");
  });

  it("does NOT fire update service for not_applied status", () => {
    const a = computeDbsAlerts([makeRow({ update_service_registered: false, dbs_status: "not_applied" })]);
    const m = a.filter((x) => x.type === "update_service_not_registered");
    expect(m.length).toBe(0);
  });

  it("does NOT fire update service for pending status", () => {
    const a = computeDbsAlerts([makeRow({ update_service_registered: false, dbs_status: "pending" })]);
    const m = a.filter((x) => x.type === "update_service_not_registered");
    expect(m.length).toBe(0);
  });

  it("does NOT fire update service when update_service_registered is true", () => {
    const a = computeDbsAlerts([makeRow({ update_service_registered: true, dbs_status: "current" })]);
    const m = a.filter((x) => x.type === "update_service_not_registered");
    expect(m.length).toBe(0);
  });

  it("fires update service for renewal_due status", () => {
    const a = computeDbsAlerts([makeRow({ update_service_registered: false, dbs_status: "renewal_due" })]);
    const m = a.filter((x) => x.type === "update_service_not_registered");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("fires update service for expired status", () => {
    const a = computeDbsAlerts([makeRow({ update_service_registered: false, dbs_status: "expired" })]);
    const m = a.filter((x) => x.type === "update_service_not_registered");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("fires update service for portability_accepted status", () => {
    const a = computeDbsAlerts([makeRow({ update_service_registered: false, dbs_status: "portability_accepted" })]);
    const m = a.filter((x) => x.type === "update_service_not_registered");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("fires update service per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", update_service_registered: false, dbs_status: "current" }),
      makeRow({ id: "a-2", update_service_registered: false, dbs_status: "renewal_due" }),
    ];
    const a = computeDbsAlerts(rows);
    const m = a.filter((x) => x.type === "update_service_not_registered");
    expect(m.length).toBe(2);
  });

  // ── Medium: overseas_check_not_completed ───────────────────────────────

  it("fires medium for overseas check not completed", () => {
    const a = computeDbsAlerts([makeRow({ overseas_check_completed: false })]);
    const m = a.filter((x) => x.type === "overseas_check_not_completed" && x.severity === "medium");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("overseas check alert includes staff name", () => {
    const a = computeDbsAlerts([makeRow({ overseas_check_completed: false, staff_name: "Frank Grant" })]);
    const m = a.filter((x) => x.type === "overseas_check_not_completed");
    expect(m[0].message).toContain("Frank Grant");
  });

  it("overseas check alert includes record_id", () => {
    const a = computeDbsAlerts([makeRow({ id: "rec-ghi", overseas_check_completed: false })]);
    const m = a.filter((x) => x.type === "overseas_check_not_completed");
    expect(m[0].record_id).toBe("rec-ghi");
  });

  it("overseas check alert references Sch 2", () => {
    const a = computeDbsAlerts([makeRow({ overseas_check_completed: false })]);
    const m = a.filter((x) => x.type === "overseas_check_not_completed");
    expect(m[0].message).toContain("Sch 2");
  });

  it("does NOT fire overseas check when overseas_check_completed is true", () => {
    const a = computeDbsAlerts([makeRow({ overseas_check_completed: true })]);
    const m = a.filter((x) => x.type === "overseas_check_not_completed");
    expect(m.length).toBe(0);
  });

  it("fires overseas check per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", overseas_check_completed: false }),
      makeRow({ id: "a-2", overseas_check_completed: false }),
    ];
    const a = computeDbsAlerts(rows);
    const m = a.filter((x) => x.type === "overseas_check_not_completed");
    expect(m.length).toBe(2);
  });

  // ── Combined alerts ─────────────────────────────────────────────────────

  it("fires all applicable alert types in worst-case scenario", () => {
    const rows = [
      makeRow({ id: "a-1", dbs_status: "expired", barred_list_checked: false, dbs_type: "enhanced", enhanced_check_completed: false, update_service_registered: false, overseas_check_completed: false, renewal_priority: "overdue" }),
    ];
    const a = computeDbsAlerts(rows);
    const types = new Set(a.map((x) => x.type));
    expect(types.has("expired_dbs_still_working")).toBe(true);
    expect(types.has("barred_list_not_checked")).toBe(true);
    expect(types.has("renewal_overdue_priority")).toBe(true);
    expect(types.has("enhanced_not_completed")).toBe(true);
    expect(types.has("update_service_not_registered")).toBe(true);
    expect(types.has("overseas_check_not_completed")).toBe(true);
  });

  it("alert severity levels are correct across mixed alerts", () => {
    const rows = [
      makeRow({ id: "a-1", dbs_status: "expired", barred_list_checked: false, dbs_type: "enhanced", enhanced_check_completed: false, update_service_registered: false, overseas_check_completed: false, renewal_priority: "overdue" }),
    ];
    const a = computeDbsAlerts(rows);
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
      dbs_status: "expired",
      barred_list_checked: false,
      dbs_type: "enhanced",
      enhanced_check_completed: false,
      overseas_check_completed: false,
      update_service_registered: false,
      renewal_priority: "critical",
    })];
    const a = computeDbsAlerts(rows);
    expect(a.length).toBeGreaterThanOrEqual(4);
  });

  it("no alerts when all checks are satisfied", () => {
    const rows = Array.from({ length: 5 }, () => makeRow());
    const a = computeDbsAlerts(rows);
    expect(a).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateDbsCaraInsights
// ══════════════════════════════════════════════════════════════════════════════

describe("generateDbsCaraInsights", () => {
  // ── Structure ───────────────────────────────────────────────────────────

  it("returns exactly 3 insights for empty array", () => {
    const insights = generateDbsCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("returns exactly 3 insights for single record", () => {
    const insights = generateDbsCaraInsights([makeRow()]);
    expect(insights).toHaveLength(3);
  });

  it("returns exactly 3 insights for multiple records", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const insights = generateDbsCaraInsights(rows);
    expect(insights).toHaveLength(3);
  });

  it("all insights are strings", () => {
    const insights = generateDbsCaraInsights([makeRow()]);
    for (const i of insights) expect(typeof i).toBe("string");
  });

  it("all insights are non-empty", () => {
    const insights = generateDbsCaraInsights([makeRow()]);
    for (const i of insights) expect(i.length).toBeGreaterThan(0);
  });

  // ── Insight 1: purple-themed summary ───────────────────────────────────

  it("first insight starts with [purple]", () => {
    const insights = generateDbsCaraInsights([makeRow()]);
    expect(insights[0]).toMatch(/^\[purple\]/);
  });

  it("first insight includes total check count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const insights = generateDbsCaraInsights(rows);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes unique staff count", () => {
    const rows = [
      makeRow({ staff_name: "Alice" }),
      makeRow({ staff_name: "Bob" }),
    ];
    const insights = generateDbsCaraInsights(rows);
    expect(insights[0]).toContain("2");
  });

  it("first insight includes expired count", () => {
    const rows = [
      makeRow({ dbs_status: "expired" }),
      makeRow({ dbs_status: "current" }),
    ];
    const insights = generateDbsCaraInsights(rows);
    expect(insights[0]).toContain("1 expired");
  });

  it("first insight includes renewal due count", () => {
    const rows = [makeRow({ dbs_status: "renewal_due" })];
    const insights = generateDbsCaraInsights(rows);
    expect(insights[0]).toContain("1 renewal due");
  });

  it("first insight includes pending count", () => {
    const rows = [makeRow({ dbs_status: "pending" })];
    const insights = generateDbsCaraInsights(rows);
    expect(insights[0]).toContain("1 pending");
  });

  it("first insight includes disclosed count", () => {
    const rows = [makeRow({ check_outcome: "information_disclosed" })];
    const insights = generateDbsCaraInsights(rows);
    expect(insights[0]).toContain("1 with disclosed information");
  });

  it("first insight uses singular check for 1 record", () => {
    const insights = generateDbsCaraInsights([makeRow()]);
    expect(insights[0]).toContain("1 DBS check");
    expect(insights[0]).not.toContain("checks tracked");
  });

  it("first insight uses plural checks for 2+ records", () => {
    const rows = [makeRow(), makeRow()];
    const insights = generateDbsCaraInsights(rows);
    expect(insights[0]).toContain("checks");
  });

  it("first insight uses singular member for 1 staff", () => {
    const insights = generateDbsCaraInsights([makeRow()]);
    expect(insights[0]).toContain("member");
    expect(insights[0]).not.toContain("members");
  });

  it("first insight uses plural members for 2+ staff", () => {
    const rows = [makeRow({ staff_name: "Alice" }), makeRow({ staff_name: "Bob" })];
    const insights = generateDbsCaraInsights(rows);
    expect(insights[0]).toContain("members");
  });

  // ── Insight 2: amber-themed priorities ──────────────────────────────────

  it("second insight starts with [amber]", () => {
    const insights = generateDbsCaraInsights([makeRow()]);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions alerts when critical alerts exist", () => {
    const rows = [makeRow({ dbs_status: "expired" })];
    const insights = generateDbsCaraInsights(rows);
    expect(insights[1]).toContain("critical");
  });

  it("second insight mentions no alerts when all compliant", () => {
    const rows = [makeRow()];
    const insights = generateDbsCaraInsights(rows);
    expect(insights[1]).toMatch(/[Nn]o critical/);
  });

  it("second insight includes barred list rate", () => {
    const rows = [makeRow({ barred_list_checked: true }), makeRow({ barred_list_checked: false })];
    const insights = generateDbsCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes enhanced check rate", () => {
    const rows = [makeRow({ enhanced_check_completed: true }), makeRow({ enhanced_check_completed: false })];
    const insights = generateDbsCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes update service rate when alerts present", () => {
    const rows = [
      makeRow({ update_service_registered: true, dbs_status: "expired" }),
      makeRow({ update_service_registered: false }),
    ];
    const insights = generateDbsCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  // ── Insight 3: reflect-themed question ──────────────────────────────────

  it("third insight starts with [reflect]", () => {
    const insights = generateDbsCaraInsights([makeRow()]);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions expired count when present", () => {
    const rows = [makeRow({ dbs_status: "expired" })];
    const insights = generateDbsCaraInsights(rows);
    expect(insights[2]).toContain("1");
    expect(insights[2]).toContain("expired");
  });

  it("third insight uses singular when 1 expired", () => {
    const rows = [makeRow({ dbs_status: "expired" })];
    const insights = generateDbsCaraInsights(rows);
    expect(insights[2]).toContain("check has");
  });

  it("third insight uses plural when 2+ expired", () => {
    const rows = [
      makeRow({ dbs_status: "expired", staff_name: "Alice" }),
      makeRow({ dbs_status: "expired", staff_name: "Bob" }),
    ];
    const insights = generateDbsCaraInsights(rows);
    expect(insights[2]).toContain("checks have");
  });

  it("third insight addresses update service when no expired but rate < 100", () => {
    const rows = [
      makeRow({ dbs_status: "current", update_service_registered: false }),
    ];
    const insights = generateDbsCaraInsights(rows);
    expect(insights[2]).toContain("Update Service");
  });

  it("third insight celebrates full compliance when all current and registered", () => {
    const rows = [
      makeRow({ dbs_status: "current", update_service_registered: true }),
    ];
    const insights = generateDbsCaraInsights(rows);
    expect(insights[2]).toContain("current");
    expect(insights[2]).toContain("Update Service");
  });

  it("third insight references CHR 2015 when fully compliant", () => {
    const rows = [makeRow()];
    const insights = generateDbsCaraInsights(rows);
    expect(insights[2]).toContain("CHR 2015");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CRUD (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD when Supabase disabled", () => {
  it("listStaffDbsRenewalTracking returns empty data", async () => {
    const { listStaffDbsRenewalTracking } = await import("../staff-dbs-renewal-tracking-service");
    const result = await listStaffDbsRenewalTracking("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("createStaffDbsRenewalTracking returns error", async () => {
    const { createStaffDbsRenewalTracking } = await import("../staff-dbs-renewal-tracking-service");
    const result = await createStaffDbsRenewalTracking({
      homeId: "home-1",
      staffName: "Jane Smith",
      checkDate: "2026-05-15",
      dbsType: "enhanced",
      dbsStatus: "current",
      checkOutcome: "clear",
      renewalPriority: "routine",
      issueDate: "2026-01-01",
      enhancedCheckCompleted: true,
      barredListChecked: true,
      updateServiceRegistered: true,
      identityVerified: true,
      rightToWorkConfirmed: true,
      riskAssessmentCompleted: true,
      overseasCheckCompleted: true,
      referencesVerified: true,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("updateStaffDbsRenewalTracking returns error", async () => {
    const { updateStaffDbsRenewalTracking } = await import("../staff-dbs-renewal-tracking-service");
    const result = await updateStaffDbsRenewalTracking("rec-1", { notes: "updated" });
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
      enhanced_check_completed: false,
      barred_list_checked: false,
      update_service_registered: false,
      identity_verified: false,
      right_to_work_confirmed: false,
      risk_assessment_completed: false,
      overseas_check_completed: false,
      references_verified: false,
    });
    const m = computeDbsMetrics([row]);
    expect(m.enhanced_check_rate).toBe(0);
    expect(m.barred_list_rate).toBe(0);
    expect(m.update_service_rate).toBe(0);
    expect(m.identity_verified_rate).toBe(0);
    expect(m.right_to_work_rate).toBe(0);
    expect(m.risk_assessment_rate).toBe(0);
    expect(m.overseas_check_rate).toBe(0);
    expect(m.references_verified_rate).toBe(0);
  });

  it("alerts for record with all flags triggering", () => {
    const row = makeRow({
      dbs_status: "expired",
      barred_list_checked: false,
      dbs_type: "enhanced",
      enhanced_check_completed: false,
      update_service_registered: false,
      overseas_check_completed: false,
      renewal_priority: "critical",
    });
    const a = computeDbsAlerts([row]);
    expect(a.length).toBeGreaterThanOrEqual(5);
  });

  it("makeRow factory with overrides preserves overrides", () => {
    const row = makeRow({
      staff_name: "Custom Name",
      dbs_type: "basic",
      dbs_status: "expired",
    });
    expect(row.staff_name).toBe("Custom Name");
    expect(row.dbs_type).toBe("basic");
    expect(row.dbs_status).toBe("expired");
  });

  it("makeRow factory nullable fields have expected defaults", () => {
    const row = makeRow();
    expect(row.staff_id).toBeNull();
    expect(row.renewal_date).toBeNull();
    expect(row.reviewer_name).toBeNull();
    expect(row.disclosed_information).toBeNull();
    expect(row.notes).toBeNull();
  });

  it("makeRow factory dbs_number defaults to non-null", () => {
    const row = makeRow();
    expect(row.dbs_number).toBe("DBS-001234");
  });

  it("makeRow factory allows setting nullable fields", () => {
    const row = makeRow({
      staff_id: "staff-123",
      renewal_date: "2027-01-01",
      reviewer_name: "Admin User",
      disclosed_information: "Minor disclosure",
      notes: "Reviewed and cleared",
      dbs_number: "DBS-999999",
    });
    expect(row.staff_id).toBe("staff-123");
    expect(row.renewal_date).toBe("2027-01-01");
    expect(row.reviewer_name).toBe("Admin User");
    expect(row.disclosed_information).toBe("Minor disclosure");
    expect(row.notes).toBe("Reviewed and cleared");
    expect(row.dbs_number).toBe("DBS-999999");
  });

  it("makeRow factory allows explicitly setting nullable fields to null", () => {
    const row = makeRow({ staff_id: null, notes: null, dbs_number: null });
    expect(row.staff_id).toBeNull();
    expect(row.notes).toBeNull();
    expect(row.dbs_number).toBeNull();
  });

  it("metrics handles large dataset", () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      makeRow({
        staff_name: `Staff ${i % 10}`,
        dbs_status: i % 5 === 0 ? "expired" : "current",
        dbs_type: DBS_TYPES[i % 5],
        enhanced_check_completed: i % 3 !== 0,
      }),
    );
    const m = computeDbsMetrics(rows);
    expect(m.total_checks).toBe(100);
    expect(m.unique_staff).toBe(10);
    expect(m.expired_count).toBe(20);
  });

  it("insights handle empty data gracefully", () => {
    const insights = generateDbsCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("0 DBS");
    expect(insights[0]).toContain("0 staff");
  });

  it("alerts handle no problematic records", () => {
    const rows = Array.from({ length: 5 }, () => makeRow());
    const a = computeDbsAlerts(rows);
    expect(a).toEqual([]);
  });

  it("metrics with mixed statuses and outcomes", () => {
    const rows = [
      makeRow({ dbs_status: "current", check_outcome: "clear" }),
      makeRow({ dbs_status: "expired", check_outcome: "information_disclosed" }),
      makeRow({ dbs_status: "renewal_due", check_outcome: "clear" }),
      makeRow({ dbs_status: "pending", check_outcome: "pending_outcome" }),
      makeRow({ dbs_status: "not_applied", check_outcome: "clear" }),
      makeRow({ dbs_status: "portability_accepted", check_outcome: "risk_assessed" }),
    ];
    const m = computeDbsMetrics(rows);
    expect(m.total_checks).toBe(6);
    expect(m.expired_count).toBe(1);
    expect(m.renewal_due_count).toBe(1);
    expect(m.pending_count).toBe(1);
    expect(m.disclosed_count).toBe(1);
    expect(Object.keys(m.status_breakdown).length).toBe(6);
  });

  it("barred list alert only for enhanced types not for update_service type", () => {
    const a = computeDbsAlerts([makeRow({ barred_list_checked: false, dbs_type: "update_service" })]);
    const c = a.filter((x) => x.type === "barred_list_not_checked");
    expect(c.length).toBe(0);
  });

  it("enhanced not completed alert only for enhanced types not for update_service type", () => {
    const a = computeDbsAlerts([makeRow({ enhanced_check_completed: false, dbs_type: "update_service" })]);
    const h = a.filter((x) => x.type === "enhanced_not_completed");
    expect(h.length).toBe(0);
  });
});
