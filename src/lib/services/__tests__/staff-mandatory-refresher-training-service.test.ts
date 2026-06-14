// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF MANDATORY REFRESHER TRAINING SERVICE TESTS
// Pure-function unit tests for refresher training metrics computation, alert
// identification, and Cara insight generation.
//
// CHR 2015 Reg 33 (employment of staff), Reg 34 (fitness of workers),
// Reg 35 (supervision and training). Schedule 2 — fitness of workers.
//
// Covers: training renewal tracking, expiry detection, refresher scheduling,
// certificate verification, competency assessment, delivery method analysis,
// and training hours monitoring.
//
// SCCIF: Well-Led — "Staff are trained and supported. Leaders ensure training
// is current and fit for purpose."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  type StaffMandatoryRefresherTrainingRow,
  TRAINING_TYPES,
  TRAINING_STATUSES,
  DELIVERY_METHODS,
} from "../staff-mandatory-refresher-training-service";

const { computeMetrics, computeAlerts, computeCaraInsights } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(overrides?: Partial<StaffMandatoryRefresherTrainingRow>): StaffMandatoryRefresherTrainingRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    staff_name: "staff_name" in (overrides ?? {}) ? overrides!.staff_name! : "Jane Smith",
    training_type: "training_type" in (overrides ?? {}) ? overrides!.training_type! : "First Aid",
    completion_date: "completion_date" in (overrides ?? {}) ? overrides!.completion_date! : now.toISOString().split("T")[0],
    expiry_date: "expiry_date" in (overrides ?? {}) ? overrides!.expiry_date! : now.toISOString().split("T")[0],
    training_status: "training_status" in (overrides ?? {}) ? overrides!.training_status! : "Current",
    training_provider: "training_provider" in (overrides ?? {}) ? (overrides!.training_provider ?? null) : "St John Ambulance",
    certificate_held: "certificate_held" in (overrides ?? {}) ? overrides!.certificate_held! : true,
    assessed_competent: "assessed_competent" in (overrides ?? {}) ? overrides!.assessed_competent! : true,
    refresher_booked: "refresher_booked" in (overrides ?? {}) ? overrides!.refresher_booked! : true,
    refresher_date: "refresher_date" in (overrides ?? {}) ? (overrides!.refresher_date ?? null) : null,
    training_hours: "training_hours" in (overrides ?? {}) ? overrides!.training_hours! : 6,
    delivery_method: "delivery_method" in (overrides ?? {}) ? overrides!.delivery_method! : "Classroom",
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
  it("TRAINING_TYPES has 10 entries", () => {
    expect(TRAINING_TYPES).toHaveLength(10);
  });

  it("TRAINING_TYPES includes all values", () => {
    expect(TRAINING_TYPES).toContain("Safeguarding");
    expect(TRAINING_TYPES).toContain("First Aid");
    expect(TRAINING_TYPES).toContain("Fire Safety");
    expect(TRAINING_TYPES).toContain("Manual Handling");
    expect(TRAINING_TYPES).toContain("Medication");
    expect(TRAINING_TYPES).toContain("Restraint");
    expect(TRAINING_TYPES).toContain("Food Hygiene");
    expect(TRAINING_TYPES).toContain("Health & Safety");
    expect(TRAINING_TYPES).toContain("Data Protection");
    expect(TRAINING_TYPES).toContain("Equality & Diversity");
  });

  it("TRAINING_TYPES has unique values", () => {
    expect(new Set(TRAINING_TYPES).size).toBe(TRAINING_TYPES.length);
  });

  it("TRAINING_STATUSES has 5 entries", () => {
    expect(TRAINING_STATUSES).toHaveLength(5);
  });

  it("TRAINING_STATUSES includes all values", () => {
    expect(TRAINING_STATUSES).toContain("Current");
    expect(TRAINING_STATUSES).toContain("Due Soon");
    expect(TRAINING_STATUSES).toContain("Overdue");
    expect(TRAINING_STATUSES).toContain("Expired");
    expect(TRAINING_STATUSES).toContain("Booked");
  });

  it("TRAINING_STATUSES has unique values", () => {
    expect(new Set(TRAINING_STATUSES).size).toBe(TRAINING_STATUSES.length);
  });

  it("DELIVERY_METHODS has 5 entries", () => {
    expect(DELIVERY_METHODS).toHaveLength(5);
  });

  it("DELIVERY_METHODS includes all values", () => {
    expect(DELIVERY_METHODS).toContain("Classroom");
    expect(DELIVERY_METHODS).toContain("E-Learning");
    expect(DELIVERY_METHODS).toContain("Blended");
    expect(DELIVERY_METHODS).toContain("Workplace");
    expect(DELIVERY_METHODS).toContain("External");
  });

  it("DELIVERY_METHODS has unique values", () => {
    expect(new Set(DELIVERY_METHODS).size).toBe(DELIVERY_METHODS.length);
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
    expect(m.current_count).toBe(0);
    expect(m.overdue_count).toBe(0);
    expect(m.expired_count).toBe(0);
    expect(m.due_soon_count).toBe(0);
    expect(m.booked_count).toBe(0);
    expect(m.unique_staff).toBe(0);
  });

  it("returns empty breakdown for empty array", () => {
    const m = computeMetrics([]);
    expect(m.training_type_breakdown).toEqual({});
  });

  it("returns 0 rates for empty array", () => {
    const m = computeMetrics([]);
    expect(m.certificate_rate).toBe(0);
    expect(m.competency_rate).toBe(0);
    expect(m.refresher_booked_rate).toBe(0);
    expect(m.avg_training_hours).toBe(0);
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

  it("counts current", () => {
    expect(computeMetrics([makeRow({ training_status: "Current" })]).current_count).toBe(1);
  });

  it("counts overdue", () => {
    expect(computeMetrics([makeRow({ training_status: "Overdue" })]).overdue_count).toBe(1);
  });

  it("counts expired", () => {
    expect(computeMetrics([makeRow({ training_status: "Expired" })]).expired_count).toBe(1);
  });

  it("counts due_soon", () => {
    expect(computeMetrics([makeRow({ training_status: "Due Soon" })]).due_soon_count).toBe(1);
  });

  it("counts booked", () => {
    expect(computeMetrics([makeRow({ training_status: "Booked" })]).booked_count).toBe(1);
  });

  it("does not count Current as expired", () => {
    const m = computeMetrics([makeRow({ training_status: "Current" })]);
    expect(m.expired_count).toBe(0);
  });

  it("does not count Booked as overdue", () => {
    const m = computeMetrics([makeRow({ training_status: "Booked" })]);
    expect(m.overdue_count).toBe(0);
  });

  it("does not count Expired as current", () => {
    const m = computeMetrics([makeRow({ training_status: "Expired" })]);
    expect(m.current_count).toBe(0);
  });

  it("counts multiple expired", () => {
    const rows = [
      makeRow({ training_status: "Expired" }),
      makeRow({ training_status: "Expired" }),
      makeRow({ training_status: "Current" }),
    ];
    expect(computeMetrics(rows).expired_count).toBe(2);
  });

  it("counts multiple overdue", () => {
    const rows = [
      makeRow({ training_status: "Overdue" }),
      makeRow({ training_status: "Overdue" }),
      makeRow({ training_status: "Overdue" }),
    ];
    expect(computeMetrics(rows).overdue_count).toBe(3);
  });

  it("counts all 5 statuses simultaneously", () => {
    const rows = TRAINING_STATUSES.map((s, i) => makeRow({ id: `a-${i}`, training_status: s }));
    const m = computeMetrics(rows);
    expect(m.current_count).toBe(1);
    expect(m.due_soon_count).toBe(1);
    expect(m.overdue_count).toBe(1);
    expect(m.expired_count).toBe(1);
    expect(m.booked_count).toBe(1);
  });

  // ── Boolean rates ───────────────────────────────────────────────────────

  it("returns 100% for all boolean rates when defaults are true", () => {
    const m = computeMetrics([makeRow()]);
    expect(m.certificate_rate).toBe(100);
    expect(m.competency_rate).toBe(100);
    expect(m.refresher_booked_rate).toBe(100);
  });

  it("certificate_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ certificate_held: false })]).certificate_rate).toBe(0);
  });

  it("competency_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ assessed_competent: false })]).competency_rate).toBe(0);
  });

  it("refresher_booked_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ refresher_booked: false })]).refresher_booked_rate).toBe(0);
  });

  it("mixed certificate_rate computes correctly (66.7%)", () => {
    const rows = [
      makeRow({ certificate_held: true }),
      makeRow({ certificate_held: true }),
      makeRow({ certificate_held: false }),
    ];
    expect(computeMetrics(rows).certificate_rate).toBe(66.7);
  });

  it("mixed competency_rate computes correctly (50%)", () => {
    const rows = [
      makeRow({ assessed_competent: true }),
      makeRow({ assessed_competent: false }),
    ];
    expect(computeMetrics(rows).competency_rate).toBe(50);
  });

  it("mixed refresher_booked_rate computes correctly (33.3%)", () => {
    const rows = [
      makeRow({ refresher_booked: true }),
      makeRow({ refresher_booked: false }),
      makeRow({ refresher_booked: false }),
    ];
    expect(computeMetrics(rows).refresher_booked_rate).toBe(33.3);
  });

  it("mixed boolean rate computes correctly (25%)", () => {
    const rows = [
      makeRow({ certificate_held: true }),
      makeRow({ certificate_held: false }),
      makeRow({ certificate_held: false }),
      makeRow({ certificate_held: false }),
    ];
    expect(computeMetrics(rows).certificate_rate).toBe(25);
  });

  it("mixed boolean rate computes correctly (75%)", () => {
    const rows = [
      makeRow({ assessed_competent: true }),
      makeRow({ assessed_competent: true }),
      makeRow({ assessed_competent: true }),
      makeRow({ assessed_competent: false }),
    ];
    expect(computeMetrics(rows).competency_rate).toBe(75);
  });

  // ── avg_training_hours ─────────────────────────────────────────────────

  it("avg_training_hours for single record", () => {
    expect(computeMetrics([makeRow({ training_hours: 8 })]).avg_training_hours).toBe(8);
  });

  it("avg_training_hours averages correctly", () => {
    const rows = [
      makeRow({ training_hours: 4 }),
      makeRow({ training_hours: 8 }),
    ];
    expect(computeMetrics(rows).avg_training_hours).toBe(6);
  });

  it("avg_training_hours rounds correctly", () => {
    const rows = [
      makeRow({ training_hours: 1 }),
      makeRow({ training_hours: 2 }),
      makeRow({ training_hours: 3 }),
    ];
    expect(computeMetrics(rows).avg_training_hours).toBe(2);
  });

  it("avg_training_hours handles zero hours", () => {
    const rows = [
      makeRow({ training_hours: 0 }),
      makeRow({ training_hours: 0 }),
    ];
    expect(computeMetrics(rows).avg_training_hours).toBe(0);
  });

  it("avg_training_hours handles fractional result", () => {
    const rows = [
      makeRow({ training_hours: 1 }),
      makeRow({ training_hours: 1 }),
      makeRow({ training_hours: 1 }),
      makeRow({ training_hours: 2 }),
      makeRow({ training_hours: 2 }),
      makeRow({ training_hours: 2 }),
    ];
    // (1+1+1+2+2+2)/6 = 9/6 = 1.5
    expect(computeMetrics(rows).avg_training_hours).toBe(1.5);
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

  it("unique_staff is 1 when all same name", () => {
    const rows = [
      makeRow({ staff_name: "Alice" }),
      makeRow({ staff_name: "Alice" }),
      makeRow({ staff_name: "Alice" }),
    ];
    expect(computeMetrics(rows).unique_staff).toBe(1);
  });

  // ── training_type_breakdown ────────────────────────────────────────────

  it("training_type_breakdown counts all 10 types", () => {
    const rows = TRAINING_TYPES.map((t, i) => makeRow({ id: `a-${i}`, training_type: t }));
    const m = computeMetrics(rows);
    for (const t of TRAINING_TYPES) expect(m.training_type_breakdown[t]).toBe(1);
  });

  it("training_type_breakdown counts multiples of same type", () => {
    const rows = [
      makeRow({ training_type: "First Aid" }),
      makeRow({ training_type: "First Aid" }),
      makeRow({ training_type: "Fire Safety" }),
    ];
    const m = computeMetrics(rows);
    expect(m.training_type_breakdown["First Aid"]).toBe(2);
    expect(m.training_type_breakdown["Fire Safety"]).toBe(1);
  });

  it("training_type_breakdown does not include absent types", () => {
    const rows = [makeRow({ training_type: "First Aid" })];
    const m = computeMetrics(rows);
    expect(m.training_type_breakdown["Safeguarding"]).toBeUndefined();
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

  // ── Critical: expired_training ─────────────────────────────────────────

  it("fires critical for expired training", () => {
    const a = computeAlerts([makeRow({ training_status: "Expired" })]);
    const c = a.filter((x) => x.type === "expired_training" && x.severity === "critical");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("expired alert includes staff name", () => {
    const a = computeAlerts([makeRow({ training_status: "Expired", staff_name: "Alice Brown" })]);
    const c = a.filter((x) => x.type === "expired_training");
    expect(c[0].message).toContain("Alice Brown");
  });

  it("expired alert includes training type", () => {
    const a = computeAlerts([makeRow({ training_status: "Expired", training_type: "Safeguarding" })]);
    const c = a.filter((x) => x.type === "expired_training");
    expect(c[0].message).toContain("Safeguarding");
  });

  it("expired alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-123", training_status: "Expired" })]);
    const c = a.filter((x) => x.type === "expired_training");
    expect(c[0].record_id).toBe("rec-123");
  });

  it("expired alert references Reg 33/35", () => {
    const a = computeAlerts([makeRow({ training_status: "Expired" })]);
    const c = a.filter((x) => x.type === "expired_training");
    expect(c[0].message).toContain("Reg 33/35");
  });

  it("does NOT fire expired for Current status", () => {
    const a = computeAlerts([makeRow({ training_status: "Current" })]);
    const c = a.filter((x) => x.type === "expired_training");
    expect(c.length).toBe(0);
  });

  it("does NOT fire expired for Booked status", () => {
    const a = computeAlerts([makeRow({ training_status: "Booked" })]);
    const c = a.filter((x) => x.type === "expired_training");
    expect(c.length).toBe(0);
  });

  it("does NOT fire expired for Due Soon status", () => {
    const a = computeAlerts([makeRow({ training_status: "Due Soon" })]);
    const c = a.filter((x) => x.type === "expired_training");
    expect(c.length).toBe(0);
  });

  it("does NOT fire expired for Overdue status", () => {
    const a = computeAlerts([makeRow({ training_status: "Overdue" })]);
    const c = a.filter((x) => x.type === "expired_training");
    expect(c.length).toBe(0);
  });

  it("fires expired per-record for multiple expired", () => {
    const rows = [
      makeRow({ id: "a-1", training_status: "Expired" }),
      makeRow({ id: "a-2", training_status: "Expired" }),
    ];
    const a = computeAlerts(rows);
    const c = a.filter((x) => x.type === "expired_training");
    expect(c.length).toBe(2);
  });

  it("fires expired for each training type", () => {
    const rows = [
      makeRow({ id: "a-1", training_status: "Expired", training_type: "Safeguarding" }),
      makeRow({ id: "a-2", training_status: "Expired", training_type: "Restraint" }),
    ];
    const a = computeAlerts(rows);
    const c = a.filter((x) => x.type === "expired_training");
    expect(c.length).toBe(2);
    expect(c[0].message).toContain("Safeguarding");
    expect(c[1].message).toContain("Restraint");
  });

  // ── High: overdue_training ─────────────────────────────────────────────

  it("fires high for overdue training", () => {
    const a = computeAlerts([makeRow({ training_status: "Overdue" })]);
    const h = a.filter((x) => x.type === "overdue_training" && x.severity === "high");
    expect(h.length).toBeGreaterThanOrEqual(1);
  });

  it("overdue alert includes staff name", () => {
    const a = computeAlerts([makeRow({ training_status: "Overdue", staff_name: "Bob Green" })]);
    const h = a.filter((x) => x.type === "overdue_training");
    expect(h[0].message).toContain("Bob Green");
  });

  it("overdue alert includes training type", () => {
    const a = computeAlerts([makeRow({ training_status: "Overdue", training_type: "Fire Safety" })]);
    const h = a.filter((x) => x.type === "overdue_training");
    expect(h[0].message).toContain("Fire Safety");
  });

  it("overdue alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-456", training_status: "Overdue" })]);
    const h = a.filter((x) => x.type === "overdue_training");
    expect(h[0].record_id).toBe("rec-456");
  });

  it("does NOT fire overdue for Current status", () => {
    const a = computeAlerts([makeRow({ training_status: "Current" })]);
    const h = a.filter((x) => x.type === "overdue_training");
    expect(h.length).toBe(0);
  });

  it("does NOT fire overdue for Booked status", () => {
    const a = computeAlerts([makeRow({ training_status: "Booked" })]);
    const h = a.filter((x) => x.type === "overdue_training");
    expect(h.length).toBe(0);
  });

  it("does NOT fire overdue for Expired status", () => {
    const a = computeAlerts([makeRow({ training_status: "Expired" })]);
    const h = a.filter((x) => x.type === "overdue_training");
    expect(h.length).toBe(0);
  });

  it("fires overdue per-record for multiple overdue", () => {
    const rows = [
      makeRow({ id: "a-1", training_status: "Overdue" }),
      makeRow({ id: "a-2", training_status: "Overdue" }),
    ];
    const a = computeAlerts(rows);
    const h = a.filter((x) => x.type === "overdue_training");
    expect(h.length).toBe(2);
  });

  // ── Medium: due_soon_no_refresher ──────────────────────────────────────

  it("fires medium for Due Soon without refresher booked", () => {
    const a = computeAlerts([makeRow({ training_status: "Due Soon", refresher_booked: false })]);
    const m = a.filter((x) => x.type === "due_soon_no_refresher" && x.severity === "medium");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("due_soon_no_refresher includes staff name", () => {
    const a = computeAlerts([makeRow({ training_status: "Due Soon", refresher_booked: false, staff_name: "Charlie Davis" })]);
    const m = a.filter((x) => x.type === "due_soon_no_refresher");
    expect(m[0].message).toContain("Charlie Davis");
  });

  it("due_soon_no_refresher includes training type", () => {
    const a = computeAlerts([makeRow({ training_status: "Due Soon", refresher_booked: false, training_type: "Medication" })]);
    const m = a.filter((x) => x.type === "due_soon_no_refresher");
    expect(m[0].message).toContain("Medication");
  });

  it("due_soon_no_refresher includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-789", training_status: "Due Soon", refresher_booked: false })]);
    const m = a.filter((x) => x.type === "due_soon_no_refresher");
    expect(m[0].record_id).toBe("rec-789");
  });

  it("does NOT fire due_soon_no_refresher when refresher is booked", () => {
    const a = computeAlerts([makeRow({ training_status: "Due Soon", refresher_booked: true })]);
    const m = a.filter((x) => x.type === "due_soon_no_refresher");
    expect(m.length).toBe(0);
  });

  it("does NOT fire due_soon_no_refresher for Current status", () => {
    const a = computeAlerts([makeRow({ training_status: "Current", refresher_booked: false })]);
    const m = a.filter((x) => x.type === "due_soon_no_refresher");
    expect(m.length).toBe(0);
  });

  it("does NOT fire due_soon_no_refresher for Overdue status", () => {
    const a = computeAlerts([makeRow({ training_status: "Overdue", refresher_booked: false })]);
    const m = a.filter((x) => x.type === "due_soon_no_refresher");
    expect(m.length).toBe(0);
  });

  it("does NOT fire due_soon_no_refresher for Expired status", () => {
    const a = computeAlerts([makeRow({ training_status: "Expired", refresher_booked: false })]);
    const m = a.filter((x) => x.type === "due_soon_no_refresher");
    expect(m.length).toBe(0);
  });

  it("fires due_soon_no_refresher per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", training_status: "Due Soon", refresher_booked: false }),
      makeRow({ id: "a-2", training_status: "Due Soon", refresher_booked: false }),
    ];
    const a = computeAlerts(rows);
    const m = a.filter((x) => x.type === "due_soon_no_refresher");
    expect(m.length).toBe(2);
  });

  // ── Medium: not_assessed_competent ─────────────────────────────────────

  it("fires medium for not assessed competent", () => {
    const a = computeAlerts([makeRow({ assessed_competent: false })]);
    const m = a.filter((x) => x.type === "not_assessed_competent" && x.severity === "medium");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("not_assessed_competent includes staff name", () => {
    const a = computeAlerts([makeRow({ assessed_competent: false, staff_name: "Diana Evans" })]);
    const m = a.filter((x) => x.type === "not_assessed_competent");
    expect(m[0].message).toContain("Diana Evans");
  });

  it("not_assessed_competent includes training type", () => {
    const a = computeAlerts([makeRow({ assessed_competent: false, training_type: "Manual Handling" })]);
    const m = a.filter((x) => x.type === "not_assessed_competent");
    expect(m[0].message).toContain("Manual Handling");
  });

  it("not_assessed_competent includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-abc", assessed_competent: false })]);
    const m = a.filter((x) => x.type === "not_assessed_competent");
    expect(m[0].record_id).toBe("rec-abc");
  });

  it("does NOT fire not_assessed_competent when assessed_competent is true", () => {
    const a = computeAlerts([makeRow({ assessed_competent: true })]);
    const m = a.filter((x) => x.type === "not_assessed_competent");
    expect(m.length).toBe(0);
  });

  it("fires not_assessed_competent per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", assessed_competent: false }),
      makeRow({ id: "a-2", assessed_competent: false }),
    ];
    const a = computeAlerts(rows);
    const m = a.filter((x) => x.type === "not_assessed_competent");
    expect(m.length).toBe(2);
  });

  // ── Combined alerts ─────────────────────────────────────────────────────

  it("fires all applicable alert types in worst-case scenario", () => {
    const rows = [
      makeRow({ id: "a-1", training_status: "Expired", assessed_competent: false }),
      makeRow({ id: "a-2", training_status: "Overdue", assessed_competent: false }),
      makeRow({ id: "a-3", training_status: "Due Soon", refresher_booked: false, assessed_competent: false }),
    ];
    const a = computeAlerts(rows);
    const types = new Set(a.map((x) => x.type));
    expect(types.has("expired_training")).toBe(true);
    expect(types.has("overdue_training")).toBe(true);
    expect(types.has("due_soon_no_refresher")).toBe(true);
    expect(types.has("not_assessed_competent")).toBe(true);
  });

  it("alert severity levels are correct across mixed alerts", () => {
    const rows = [
      makeRow({ id: "a-1", training_status: "Expired", assessed_competent: false }),
      makeRow({ id: "a-2", training_status: "Overdue" }),
      makeRow({ id: "a-3", training_status: "Due Soon", refresher_booked: false }),
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
      training_status: "Expired",
      assessed_competent: false,
    })];
    const a = computeAlerts(rows);
    expect(a.length).toBeGreaterThanOrEqual(2);
  });

  it("no alerts when all checks are satisfied", () => {
    const rows = Array.from({ length: 5 }, () => makeRow());
    const a = computeAlerts(rows);
    expect(a).toEqual([]);
  });

  it("expired and overdue do not cross-fire", () => {
    const a = computeAlerts([makeRow({ training_status: "Expired" })]);
    expect(a.filter((x) => x.type === "overdue_training").length).toBe(0);
    const b = computeAlerts([makeRow({ training_status: "Overdue" })]);
    expect(b.filter((x) => x.type === "expired_training").length).toBe(0);
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

  it("first insight includes total record count", () => {
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

  it("first insight includes current count", () => {
    const rows = [
      makeRow({ training_status: "Current" }),
      makeRow({ training_status: "Expired" }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("1 current");
  });

  it("first insight includes expired count", () => {
    const rows = [makeRow({ training_status: "Expired" })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("1 expired");
  });

  it("first insight includes overdue count", () => {
    const rows = [makeRow({ training_status: "Overdue" })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("1 overdue");
  });

  it("first insight includes due soon count", () => {
    const rows = [makeRow({ training_status: "Due Soon" })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("1 due soon");
  });

  it("first insight uses singular record for 1 record", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toContain("1 refresher training record");
    expect(insights[0]).not.toContain("records tracked");
  });

  it("first insight uses plural records for 2+ records", () => {
    const rows = [makeRow(), makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("records");
  });

  it("first insight uses singular member for 1 staff", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toContain("member");
    expect(insights[0]).not.toContain("members");
  });

  it("first insight uses plural members for 2+ staff", () => {
    const rows = [makeRow({ staff_name: "Alice" }), makeRow({ staff_name: "Bob" })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("members");
  });

  // ── Insight 2: amber-themed priorities ──────────────────────────────────

  it("second insight starts with [amber]", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions alerts when critical alerts exist", () => {
    const rows = [makeRow({ training_status: "Expired" })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("critical");
  });

  it("second insight mentions no alerts when all compliant", () => {
    const rows = [makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toMatch(/[Nn]o critical/);
  });

  it("second insight includes certificate rate", () => {
    const rows = [makeRow({ certificate_held: true }), makeRow({ certificate_held: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes competency rate", () => {
    const rows = [makeRow({ assessed_competent: true }), makeRow({ assessed_competent: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes refresher booked rate when alerts present", () => {
    const rows = [
      makeRow({ refresher_booked: true, training_status: "Expired" }),
      makeRow({ refresher_booked: false }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight references Reg 33/35 when no alerts", () => {
    const rows = [makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("Reg 33/35");
  });

  // ── Insight 3: reflect-themed question ──────────────────────────────────

  it("third insight starts with [reflect]", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions expired count when present", () => {
    const rows = [makeRow({ training_status: "Expired" })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("1");
    expect(insights[2]).toContain("expired");
  });

  it("third insight uses singular when 1 expired", () => {
    const rows = [makeRow({ training_status: "Expired" })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("record has");
  });

  it("third insight uses plural when 2+ expired", () => {
    const rows = [
      makeRow({ training_status: "Expired", staff_name: "Alice" }),
      makeRow({ training_status: "Expired", staff_name: "Bob" }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("records have");
  });

  it("third insight references Reg 35 when expired present", () => {
    const rows = [makeRow({ training_status: "Expired" })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("Reg 35");
  });

  it("third insight addresses refresher booking when no expired but rate < 100", () => {
    const rows = [
      makeRow({ training_status: "Current", refresher_booked: false }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("refresher");
  });

  it("third insight celebrates full compliance when all current and booked", () => {
    const rows = [
      makeRow({ training_status: "Current", refresher_booked: true }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("current");
  });

  it("third insight references CHR 2015 when fully compliant", () => {
    const rows = [makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("CHR 2015");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CRUD (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD when Supabase disabled", () => {
  it("listStaffMandatoryRefresherTraining returns empty data", async () => {
    const { listStaffMandatoryRefresherTraining } = await import("../staff-mandatory-refresher-training-service");
    const result = await listStaffMandatoryRefresherTraining("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("createStaffMandatoryRefresherTraining returns error", async () => {
    const { createStaffMandatoryRefresherTraining } = await import("../staff-mandatory-refresher-training-service");
    const result = await createStaffMandatoryRefresherTraining({
      homeId: "home-1",
      staffName: "Jane Smith",
      trainingType: "First Aid",
      completionDate: "2026-01-15",
      expiryDate: "2027-01-15",
      trainingStatus: "Current",
      certificateHeld: true,
      assessedCompetent: true,
      refresherBooked: false,
      trainingHours: 6,
      deliveryMethod: "Classroom",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("updateStaffMandatoryRefresherTraining returns error", async () => {
    const { updateStaffMandatoryRefresherTraining } = await import("../staff-mandatory-refresher-training-service");
    const result = await updateStaffMandatoryRefresherTraining("rec-1", { notes: "updated" });
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
      certificate_held: false,
      assessed_competent: false,
      refresher_booked: false,
    });
    const m = computeMetrics([row]);
    expect(m.certificate_rate).toBe(0);
    expect(m.competency_rate).toBe(0);
    expect(m.refresher_booked_rate).toBe(0);
  });

  it("alerts for record with all flags triggering", () => {
    const row = makeRow({
      training_status: "Expired",
      assessed_competent: false,
    });
    const a = computeAlerts([row]);
    expect(a.length).toBeGreaterThanOrEqual(2);
  });

  it("makeRow factory with overrides preserves overrides", () => {
    const row = makeRow({
      staff_name: "Custom Name",
      training_type: "Restraint",
      training_status: "Expired",
    });
    expect(row.staff_name).toBe("Custom Name");
    expect(row.training_type).toBe("Restraint");
    expect(row.training_status).toBe("Expired");
  });

  it("makeRow factory nullable fields have expected defaults", () => {
    const row = makeRow();
    expect(row.refresher_date).toBeNull();
    expect(row.notes).toBeNull();
  });

  it("makeRow factory training_provider defaults to non-null", () => {
    const row = makeRow();
    expect(row.training_provider).toBe("St John Ambulance");
  });

  it("makeRow factory allows setting nullable fields", () => {
    const row = makeRow({
      training_provider: "Red Cross",
      refresher_date: "2027-06-01",
      notes: "Completed with distinction",
    });
    expect(row.training_provider).toBe("Red Cross");
    expect(row.refresher_date).toBe("2027-06-01");
    expect(row.notes).toBe("Completed with distinction");
  });

  it("makeRow factory allows explicitly setting nullable fields to null", () => {
    const row = makeRow({ training_provider: null, notes: null, refresher_date: null });
    expect(row.training_provider).toBeNull();
    expect(row.notes).toBeNull();
    expect(row.refresher_date).toBeNull();
  });

  it("metrics handles large dataset", () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      makeRow({
        staff_name: `Staff ${i % 10}`,
        training_status: i % 5 === 0 ? "Expired" : "Current",
        training_type: TRAINING_TYPES[i % 10],
        certificate_held: i % 3 !== 0,
      }),
    );
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(100);
    expect(m.unique_staff).toBe(10);
    expect(m.expired_count).toBe(20);
  });

  it("insights handle empty data gracefully", () => {
    const insights = computeCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("0 refresher training");
    expect(insights[0]).toContain("0 staff");
  });

  it("alerts handle no problematic records", () => {
    const rows = Array.from({ length: 5 }, () => makeRow());
    const a = computeAlerts(rows);
    expect(a).toEqual([]);
  });

  it("metrics with mixed statuses", () => {
    const rows = [
      makeRow({ training_status: "Current" }),
      makeRow({ training_status: "Expired" }),
      makeRow({ training_status: "Overdue" }),
      makeRow({ training_status: "Due Soon" }),
      makeRow({ training_status: "Booked" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(5);
    expect(m.current_count).toBe(1);
    expect(m.expired_count).toBe(1);
    expect(m.overdue_count).toBe(1);
    expect(m.due_soon_count).toBe(1);
    expect(m.booked_count).toBe(1);
  });

  it("due_soon_no_refresher does not fire for booked status without refresher", () => {
    const a = computeAlerts([makeRow({ training_status: "Booked", refresher_booked: false })]);
    const m = a.filter((x) => x.type === "due_soon_no_refresher");
    expect(m.length).toBe(0);
  });

  it("not_assessed_competent fires regardless of training status", () => {
    for (const status of TRAINING_STATUSES) {
      const a = computeAlerts([makeRow({ training_status: status, assessed_competent: false })]);
      const m = a.filter((x) => x.type === "not_assessed_competent");
      expect(m.length).toBe(1);
    }
  });

  it("metrics with all same training type", () => {
    const rows = Array.from({ length: 5 }, () => makeRow({ training_type: "Safeguarding" }));
    const m = computeMetrics(rows);
    expect(m.training_type_breakdown["Safeguarding"]).toBe(5);
    expect(Object.keys(m.training_type_breakdown).length).toBe(1);
  });

  it("avg_training_hours with varying hours", () => {
    const rows = [
      makeRow({ training_hours: 2 }),
      makeRow({ training_hours: 4 }),
      makeRow({ training_hours: 6 }),
      makeRow({ training_hours: 8 }),
      makeRow({ training_hours: 10 }),
    ];
    // (2+4+6+8+10)/5 = 30/5 = 6
    expect(computeMetrics(rows).avg_training_hours).toBe(6);
  });

  it("avg_training_hours with single large value", () => {
    const rows = [makeRow({ training_hours: 40 })];
    expect(computeMetrics(rows).avg_training_hours).toBe(40);
  });

  it("all delivery methods appear in records without error", () => {
    const rows = DELIVERY_METHODS.map((d, i) => makeRow({ id: `a-${i}`, delivery_method: d }));
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(5);
  });

  it("all training types appear in records without error", () => {
    const rows = TRAINING_TYPES.map((t, i) => makeRow({ id: `a-${i}`, training_type: t }));
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(10);
    expect(Object.keys(m.training_type_breakdown).length).toBe(10);
  });

  it("insights with only overdue records", () => {
    const rows = [
      makeRow({ training_status: "Overdue", staff_name: "Alice" }),
      makeRow({ training_status: "Overdue", staff_name: "Bob" }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("2 overdue");
  });

  it("insights with only booked records", () => {
    const rows = [makeRow({ training_status: "Booked" })];
    const insights = computeCaraInsights(rows);
    expect(insights).toHaveLength(3);
    expect(insights[1]).toMatch(/[Nn]o critical/);
  });

  it("multiple staff with same name count once for unique_staff", () => {
    const rows = [
      makeRow({ staff_name: "Jane Smith", training_type: "First Aid" }),
      makeRow({ staff_name: "Jane Smith", training_type: "Fire Safety" }),
      makeRow({ staff_name: "Jane Smith", training_type: "Safeguarding" }),
    ];
    expect(computeMetrics(rows).unique_staff).toBe(1);
  });

  it("alerts include correct count of critical vs high vs medium", () => {
    const rows = [
      makeRow({ id: "a-1", training_status: "Expired" }),
      makeRow({ id: "a-2", training_status: "Expired" }),
      makeRow({ id: "a-3", training_status: "Overdue" }),
      makeRow({ id: "a-4", training_status: "Due Soon", refresher_booked: false }),
      makeRow({ id: "a-5", assessed_competent: false }),
    ];
    const a = computeAlerts(rows);
    expect(a.filter((x) => x.severity === "critical").length).toBe(2);
    expect(a.filter((x) => x.severity === "high").length).toBe(1);
    expect(a.filter((x) => x.severity === "medium").length).toBe(2);
  });
});
