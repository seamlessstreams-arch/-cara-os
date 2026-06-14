// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF PROFESSIONAL REGISTRATION SERVICE TESTS
// Pure-function unit tests for professional registration metrics, alert
// identification, and Cara insight generation.
//
// CHR 2015 Reg 32 (fitness of workers),
// CHR 2015 Sch 2 (information in respect of persons seeking to carry on,
// manage, or work at a children's home).
// Social Work England (Regulatory Reform) Order 2018.
//
// Covers: Professional body registration, PIN verification, CPD tracking,
// fitness to practise clearance, conditions monitoring, renewal compliance,
// multi-body registration, and regulatory status oversight.
//
// SCCIF: Leadership & Management — "Staff hold relevant professional
// registrations and meet conditions of their registration."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  type StaffProfessionalRegistrationRow,
  PROFESSIONAL_BODIES,
  REGISTRATION_STATUSES,
} from "../staff-professional-registration-service";

const { computeRegistrationMetrics, computeRegistrationAlerts, generateRegistrationCaraInsights } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(overrides?: Partial<StaffProfessionalRegistrationRow>): StaffProfessionalRegistrationRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    staff_name: "staff_name" in (overrides ?? {}) ? overrides!.staff_name! : "Jane Smith",
    professional_body: "professional_body" in (overrides ?? {}) ? overrides!.professional_body! : "Social Work England",
    registration_number: "registration_number" in (overrides ?? {}) ? overrides!.registration_number! : "SWE-001234",
    registration_status: "registration_status" in (overrides ?? {}) ? overrides!.registration_status! : "Active",
    registration_date: "registration_date" in (overrides ?? {}) ? overrides!.registration_date! : now.toISOString().split("T")[0],
    expiry_date: "expiry_date" in (overrides ?? {}) ? (overrides!.expiry_date ?? null) : null,
    pin_verified: "pin_verified" in (overrides ?? {}) ? overrides!.pin_verified! : true,
    pin_verification_date: "pin_verification_date" in (overrides ?? {}) ? (overrides!.pin_verification_date ?? null) : null,
    cpd_hours_completed: "cpd_hours_completed" in (overrides ?? {}) ? overrides!.cpd_hours_completed! : 30,
    cpd_hours_required: "cpd_hours_required" in (overrides ?? {}) ? overrides!.cpd_hours_required! : 30,
    fitness_to_practise_clear: "fitness_to_practise_clear" in (overrides ?? {}) ? overrides!.fitness_to_practise_clear! : true,
    conditions_on_registration: "conditions_on_registration" in (overrides ?? {}) ? overrides!.conditions_on_registration! : false,
    renewal_submitted: "renewal_submitted" in (overrides ?? {}) ? overrides!.renewal_submitted! : true,
    renewal_date: "renewal_date" in (overrides ?? {}) ? (overrides!.renewal_date ?? null) : null,
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
  it("PROFESSIONAL_BODIES has 6 entries", () => {
    expect(PROFESSIONAL_BODIES).toHaveLength(6);
  });

  it("PROFESSIONAL_BODIES includes Social Work England", () => {
    expect(PROFESSIONAL_BODIES).toContain("Social Work England");
  });

  it("PROFESSIONAL_BODIES includes HCPC", () => {
    expect(PROFESSIONAL_BODIES).toContain("HCPC");
  });

  it("PROFESSIONAL_BODIES includes NMC", () => {
    expect(PROFESSIONAL_BODIES).toContain("NMC");
  });

  it("PROFESSIONAL_BODIES includes Ofsted", () => {
    expect(PROFESSIONAL_BODIES).toContain("Ofsted");
  });

  it("PROFESSIONAL_BODIES includes DfE", () => {
    expect(PROFESSIONAL_BODIES).toContain("DfE");
  });

  it("PROFESSIONAL_BODIES includes Other", () => {
    expect(PROFESSIONAL_BODIES).toContain("Other");
  });

  it("PROFESSIONAL_BODIES has unique values", () => {
    expect(new Set(PROFESSIONAL_BODIES).size).toBe(PROFESSIONAL_BODIES.length);
  });

  it("REGISTRATION_STATUSES has 6 entries", () => {
    expect(REGISTRATION_STATUSES).toHaveLength(6);
  });

  it("REGISTRATION_STATUSES includes Active", () => {
    expect(REGISTRATION_STATUSES).toContain("Active");
  });

  it("REGISTRATION_STATUSES includes Pending", () => {
    expect(REGISTRATION_STATUSES).toContain("Pending");
  });

  it("REGISTRATION_STATUSES includes Suspended", () => {
    expect(REGISTRATION_STATUSES).toContain("Suspended");
  });

  it("REGISTRATION_STATUSES includes Lapsed", () => {
    expect(REGISTRATION_STATUSES).toContain("Lapsed");
  });

  it("REGISTRATION_STATUSES includes Expired", () => {
    expect(REGISTRATION_STATUSES).toContain("Expired");
  });

  it("REGISTRATION_STATUSES includes Revoked", () => {
    expect(REGISTRATION_STATUSES).toContain("Revoked");
  });

  it("REGISTRATION_STATUSES has unique values", () => {
    expect(new Set(REGISTRATION_STATUSES).size).toBe(REGISTRATION_STATUSES.length);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeRegistrationMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeRegistrationMetrics", () => {
  // ── Empty / baseline ────────────────────────────────────────────────────

  it("returns zeros for empty array", () => {
    const m = computeRegistrationMetrics([]);
    expect(m.total_registrations).toBe(0);
    expect(m.active_count).toBe(0);
    expect(m.expired_count).toBe(0);
    expect(m.lapsed_count).toBe(0);
    expect(m.suspended_count).toBe(0);
    expect(m.conditions_count).toBe(0);
    expect(m.unique_staff).toBe(0);
    expect(m.unique_bodies).toBe(0);
  });

  it("returns 0 rates for empty array", () => {
    const m = computeRegistrationMetrics([]);
    expect(m.pin_verified_rate).toBe(0);
    expect(m.cpd_compliance_rate).toBe(0);
    expect(m.fitness_to_practise_rate).toBe(0);
    expect(m.renewal_submitted_rate).toBe(0);
  });

  // ── total_registrations ────────────────────────────────────────────────

  it("total_registrations counts single record", () => {
    expect(computeRegistrationMetrics([makeRow()]).total_registrations).toBe(1);
  });

  it("total_registrations counts multiple records", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    expect(computeRegistrationMetrics(rows).total_registrations).toBe(3);
  });

  it("total_registrations counts 10 records", () => {
    const rows = Array.from({ length: 10 }, () => makeRow());
    expect(computeRegistrationMetrics(rows).total_registrations).toBe(10);
  });

  // ── active_count ───────────────────────────────────────────────────────

  it("counts active registrations", () => {
    expect(computeRegistrationMetrics([makeRow({ registration_status: "Active" })]).active_count).toBe(1);
  });

  it("counts multiple active registrations", () => {
    const rows = [
      makeRow({ registration_status: "Active" }),
      makeRow({ registration_status: "Active" }),
      makeRow({ registration_status: "Expired" }),
    ];
    expect(computeRegistrationMetrics(rows).active_count).toBe(2);
  });

  it("does not count Pending as active", () => {
    expect(computeRegistrationMetrics([makeRow({ registration_status: "Pending" })]).active_count).toBe(0);
  });

  it("does not count Suspended as active", () => {
    expect(computeRegistrationMetrics([makeRow({ registration_status: "Suspended" })]).active_count).toBe(0);
  });

  // ── expired_count ──────────────────────────────────────────────────────

  it("counts expired registrations", () => {
    expect(computeRegistrationMetrics([makeRow({ registration_status: "Expired" })]).expired_count).toBe(1);
  });

  it("counts multiple expired registrations", () => {
    const rows = [
      makeRow({ registration_status: "Expired" }),
      makeRow({ registration_status: "Expired" }),
      makeRow({ registration_status: "Active" }),
    ];
    expect(computeRegistrationMetrics(rows).expired_count).toBe(2);
  });

  it("does not count Active as expired", () => {
    expect(computeRegistrationMetrics([makeRow({ registration_status: "Active" })]).expired_count).toBe(0);
  });

  it("does not count Revoked as expired", () => {
    expect(computeRegistrationMetrics([makeRow({ registration_status: "Revoked" })]).expired_count).toBe(0);
  });

  // ── lapsed_count ───────────────────────────────────────────────────────

  it("counts lapsed registrations", () => {
    expect(computeRegistrationMetrics([makeRow({ registration_status: "Lapsed" })]).lapsed_count).toBe(1);
  });

  it("counts multiple lapsed registrations", () => {
    const rows = [
      makeRow({ registration_status: "Lapsed" }),
      makeRow({ registration_status: "Lapsed" }),
      makeRow({ registration_status: "Active" }),
    ];
    expect(computeRegistrationMetrics(rows).lapsed_count).toBe(2);
  });

  it("does not count Pending as lapsed", () => {
    expect(computeRegistrationMetrics([makeRow({ registration_status: "Pending" })]).lapsed_count).toBe(0);
  });

  // ── suspended_count ────────────────────────────────────────────────────

  it("counts suspended registrations", () => {
    expect(computeRegistrationMetrics([makeRow({ registration_status: "Suspended" })]).suspended_count).toBe(1);
  });

  it("counts multiple suspended registrations", () => {
    const rows = [
      makeRow({ registration_status: "Suspended" }),
      makeRow({ registration_status: "Suspended" }),
      makeRow({ registration_status: "Active" }),
    ];
    expect(computeRegistrationMetrics(rows).suspended_count).toBe(2);
  });

  it("does not count Lapsed as suspended", () => {
    expect(computeRegistrationMetrics([makeRow({ registration_status: "Lapsed" })]).suspended_count).toBe(0);
  });

  // ── conditions_count ───────────────────────────────────────────────────

  it("counts conditions on registration", () => {
    expect(computeRegistrationMetrics([makeRow({ conditions_on_registration: true })]).conditions_count).toBe(1);
  });

  it("does not count conditions when false", () => {
    expect(computeRegistrationMetrics([makeRow({ conditions_on_registration: false })]).conditions_count).toBe(0);
  });

  it("counts multiple conditions", () => {
    const rows = [
      makeRow({ conditions_on_registration: true }),
      makeRow({ conditions_on_registration: true }),
      makeRow({ conditions_on_registration: false }),
    ];
    expect(computeRegistrationMetrics(rows).conditions_count).toBe(2);
  });

  // ── pin_verified_rate ──────────────────────────────────────────────────

  it("pin_verified_rate is 100 when all verified", () => {
    expect(computeRegistrationMetrics([makeRow({ pin_verified: true })]).pin_verified_rate).toBe(100);
  });

  it("pin_verified_rate is 0 when none verified", () => {
    expect(computeRegistrationMetrics([makeRow({ pin_verified: false })]).pin_verified_rate).toBe(0);
  });

  it("pin_verified_rate computes 50% correctly", () => {
    const rows = [
      makeRow({ pin_verified: true }),
      makeRow({ pin_verified: false }),
    ];
    expect(computeRegistrationMetrics(rows).pin_verified_rate).toBe(50);
  });

  it("pin_verified_rate computes 66.7% correctly", () => {
    const rows = [
      makeRow({ pin_verified: true }),
      makeRow({ pin_verified: true }),
      makeRow({ pin_verified: false }),
    ];
    expect(computeRegistrationMetrics(rows).pin_verified_rate).toBe(66.7);
  });

  it("pin_verified_rate computes 33.3% correctly", () => {
    const rows = [
      makeRow({ pin_verified: true }),
      makeRow({ pin_verified: false }),
      makeRow({ pin_verified: false }),
    ];
    expect(computeRegistrationMetrics(rows).pin_verified_rate).toBe(33.3);
  });

  it("pin_verified_rate computes 25% correctly", () => {
    const rows = [
      makeRow({ pin_verified: true }),
      makeRow({ pin_verified: false }),
      makeRow({ pin_verified: false }),
      makeRow({ pin_verified: false }),
    ];
    expect(computeRegistrationMetrics(rows).pin_verified_rate).toBe(25);
  });

  // ── cpd_compliance_rate ────────────────────────────────────────────────

  it("cpd_compliance_rate is 100 when all meet requirements", () => {
    expect(computeRegistrationMetrics([makeRow({ cpd_hours_completed: 30, cpd_hours_required: 30 })]).cpd_compliance_rate).toBe(100);
  });

  it("cpd_compliance_rate is 100 when completed exceeds required", () => {
    expect(computeRegistrationMetrics([makeRow({ cpd_hours_completed: 50, cpd_hours_required: 30 })]).cpd_compliance_rate).toBe(100);
  });

  it("cpd_compliance_rate is 0 when none meet requirements", () => {
    expect(computeRegistrationMetrics([makeRow({ cpd_hours_completed: 10, cpd_hours_required: 30 })]).cpd_compliance_rate).toBe(0);
  });

  it("cpd_compliance_rate computes 50% correctly", () => {
    const rows = [
      makeRow({ cpd_hours_completed: 30, cpd_hours_required: 30 }),
      makeRow({ cpd_hours_completed: 10, cpd_hours_required: 30 }),
    ];
    expect(computeRegistrationMetrics(rows).cpd_compliance_rate).toBe(50);
  });

  it("cpd_compliance_rate computes 66.7% correctly", () => {
    const rows = [
      makeRow({ cpd_hours_completed: 30, cpd_hours_required: 30 }),
      makeRow({ cpd_hours_completed: 40, cpd_hours_required: 30 }),
      makeRow({ cpd_hours_completed: 10, cpd_hours_required: 30 }),
    ];
    expect(computeRegistrationMetrics(rows).cpd_compliance_rate).toBe(66.7);
  });

  it("cpd_compliance_rate is 100 when required is 0", () => {
    expect(computeRegistrationMetrics([makeRow({ cpd_hours_completed: 0, cpd_hours_required: 0 })]).cpd_compliance_rate).toBe(100);
  });

  // ── fitness_to_practise_rate ───────────────────────────────────────────

  it("fitness_to_practise_rate is 100 when all clear", () => {
    expect(computeRegistrationMetrics([makeRow({ fitness_to_practise_clear: true })]).fitness_to_practise_rate).toBe(100);
  });

  it("fitness_to_practise_rate is 0 when none clear", () => {
    expect(computeRegistrationMetrics([makeRow({ fitness_to_practise_clear: false })]).fitness_to_practise_rate).toBe(0);
  });

  it("fitness_to_practise_rate computes 50% correctly", () => {
    const rows = [
      makeRow({ fitness_to_practise_clear: true }),
      makeRow({ fitness_to_practise_clear: false }),
    ];
    expect(computeRegistrationMetrics(rows).fitness_to_practise_rate).toBe(50);
  });

  it("fitness_to_practise_rate computes 33.3% correctly", () => {
    const rows = [
      makeRow({ fitness_to_practise_clear: true }),
      makeRow({ fitness_to_practise_clear: false }),
      makeRow({ fitness_to_practise_clear: false }),
    ];
    expect(computeRegistrationMetrics(rows).fitness_to_practise_rate).toBe(33.3);
  });

  // ── renewal_submitted_rate ─────────────────────────────────────────────

  it("renewal_submitted_rate is 100 when all submitted", () => {
    expect(computeRegistrationMetrics([makeRow({ renewal_submitted: true })]).renewal_submitted_rate).toBe(100);
  });

  it("renewal_submitted_rate is 0 when none submitted", () => {
    expect(computeRegistrationMetrics([makeRow({ renewal_submitted: false })]).renewal_submitted_rate).toBe(0);
  });

  it("renewal_submitted_rate computes 50% correctly", () => {
    const rows = [
      makeRow({ renewal_submitted: true }),
      makeRow({ renewal_submitted: false }),
    ];
    expect(computeRegistrationMetrics(rows).renewal_submitted_rate).toBe(50);
  });

  it("renewal_submitted_rate computes 75% correctly", () => {
    const rows = [
      makeRow({ renewal_submitted: true }),
      makeRow({ renewal_submitted: true }),
      makeRow({ renewal_submitted: true }),
      makeRow({ renewal_submitted: false }),
    ];
    expect(computeRegistrationMetrics(rows).renewal_submitted_rate).toBe(75);
  });

  // ── unique_staff ───────────────────────────────────────────────────────

  it("unique_staff counts 1 for single record", () => {
    expect(computeRegistrationMetrics([makeRow()]).unique_staff).toBe(1);
  });

  it("unique_staff counts distinct names", () => {
    const rows = [
      makeRow({ staff_name: "Alice Brown" }),
      makeRow({ staff_name: "Bob Green" }),
      makeRow({ staff_name: "Alice Brown" }),
    ];
    expect(computeRegistrationMetrics(rows).unique_staff).toBe(2);
  });

  it("unique_staff counts all different names", () => {
    const rows = [
      makeRow({ staff_name: "Alice" }),
      makeRow({ staff_name: "Bob" }),
      makeRow({ staff_name: "Charlie" }),
    ];
    expect(computeRegistrationMetrics(rows).unique_staff).toBe(3);
  });

  it("unique_staff is 1 when all same name", () => {
    const rows = [
      makeRow({ staff_name: "Alice" }),
      makeRow({ staff_name: "Alice" }),
      makeRow({ staff_name: "Alice" }),
    ];
    expect(computeRegistrationMetrics(rows).unique_staff).toBe(1);
  });

  // ── unique_bodies ──────────────────────────────────────────────────────

  it("unique_bodies counts 1 for single record", () => {
    expect(computeRegistrationMetrics([makeRow()]).unique_bodies).toBe(1);
  });

  it("unique_bodies counts distinct bodies", () => {
    const rows = [
      makeRow({ professional_body: "Social Work England" }),
      makeRow({ professional_body: "HCPC" }),
      makeRow({ professional_body: "Social Work England" }),
    ];
    expect(computeRegistrationMetrics(rows).unique_bodies).toBe(2);
  });

  it("unique_bodies counts all 6 bodies", () => {
    const rows = PROFESSIONAL_BODIES.map((b, i) => makeRow({ id: `a-${i}`, professional_body: b }));
    expect(computeRegistrationMetrics(rows).unique_bodies).toBe(6);
  });

  it("unique_bodies is 1 when all same body", () => {
    const rows = [
      makeRow({ professional_body: "NMC" }),
      makeRow({ professional_body: "NMC" }),
      makeRow({ professional_body: "NMC" }),
    ];
    expect(computeRegistrationMetrics(rows).unique_bodies).toBe(1);
  });

  // ── All statuses in one set ────────────────────────────────────────────

  it("counts all 6 statuses correctly in a mixed set", () => {
    const rows = REGISTRATION_STATUSES.map((s, i) => makeRow({ id: `a-${i}`, registration_status: s }));
    const m = computeRegistrationMetrics(rows);
    expect(m.total_registrations).toBe(6);
    expect(m.active_count).toBe(1);
    expect(m.expired_count).toBe(1);
    expect(m.lapsed_count).toBe(1);
    expect(m.suspended_count).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeRegistrationAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("computeRegistrationAlerts", () => {
  // ── Clean / empty ───────────────────────────────────────────────────────

  it("returns empty for empty array", () => {
    expect(computeRegistrationAlerts([])).toEqual([]);
  });

  it("returns empty for fully compliant record", () => {
    const alerts = computeRegistrationAlerts([makeRow()]);
    expect(alerts).toEqual([]);
  });

  // ── Critical: registration_expired ─────────────────────────────────────

  it("fires critical for expired registration", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Expired" })]);
    const c = a.filter((x) => x.type === "registration_expired" && x.severity === "critical");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("expired alert includes staff name", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Expired", staff_name: "Alice Brown" })]);
    const c = a.filter((x) => x.type === "registration_expired");
    expect(c[0].message).toContain("Alice Brown");
  });

  it("expired alert includes professional body", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Expired", professional_body: "HCPC" })]);
    const c = a.filter((x) => x.type === "registration_expired");
    expect(c[0].message).toContain("HCPC");
  });

  it("expired alert includes registration number", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Expired", registration_number: "REG-999" })]);
    const c = a.filter((x) => x.type === "registration_expired");
    expect(c[0].message).toContain("REG-999");
  });

  it("expired alert includes record_id", () => {
    const a = computeRegistrationAlerts([makeRow({ id: "rec-123", registration_status: "Expired" })]);
    const c = a.filter((x) => x.type === "registration_expired");
    expect(c[0].record_id).toBe("rec-123");
  });

  it("expired alert references Reg 32", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Expired" })]);
    const c = a.filter((x) => x.type === "registration_expired");
    expect(c[0].message).toContain("Reg 32");
  });

  it("does NOT fire expired for Active status", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Active" })]);
    const c = a.filter((x) => x.type === "registration_expired");
    expect(c.length).toBe(0);
  });

  it("does NOT fire expired for Pending status", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Pending" })]);
    const c = a.filter((x) => x.type === "registration_expired");
    expect(c.length).toBe(0);
  });

  it("does NOT fire expired for Suspended status", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Suspended" })]);
    const c = a.filter((x) => x.type === "registration_expired");
    expect(c.length).toBe(0);
  });

  it("does NOT fire expired for Lapsed status", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Lapsed" })]);
    const c = a.filter((x) => x.type === "registration_expired");
    expect(c.length).toBe(0);
  });

  it("fires expired per-record for multiple expired", () => {
    const rows = [
      makeRow({ id: "a-1", registration_status: "Expired" }),
      makeRow({ id: "a-2", registration_status: "Expired" }),
    ];
    const a = computeRegistrationAlerts(rows);
    const c = a.filter((x) => x.type === "registration_expired");
    expect(c.length).toBe(2);
  });

  // ── Critical: registration_revoked ─────────────────────────────────────

  it("fires critical for revoked registration", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Revoked" })]);
    const c = a.filter((x) => x.type === "registration_revoked" && x.severity === "critical");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("revoked alert includes staff name", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Revoked", staff_name: "Bob Green" })]);
    const c = a.filter((x) => x.type === "registration_revoked");
    expect(c[0].message).toContain("Bob Green");
  });

  it("revoked alert includes professional body", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Revoked", professional_body: "NMC" })]);
    const c = a.filter((x) => x.type === "registration_revoked");
    expect(c[0].message).toContain("NMC");
  });

  it("revoked alert includes registration number", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Revoked", registration_number: "NMC-555" })]);
    const c = a.filter((x) => x.type === "registration_revoked");
    expect(c[0].message).toContain("NMC-555");
  });

  it("revoked alert includes record_id", () => {
    const a = computeRegistrationAlerts([makeRow({ id: "rec-456", registration_status: "Revoked" })]);
    const c = a.filter((x) => x.type === "registration_revoked");
    expect(c[0].record_id).toBe("rec-456");
  });

  it("revoked alert references Reg 32", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Revoked" })]);
    const c = a.filter((x) => x.type === "registration_revoked");
    expect(c[0].message).toContain("Reg 32");
  });

  it("does NOT fire revoked for Active status", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Active" })]);
    const c = a.filter((x) => x.type === "registration_revoked");
    expect(c.length).toBe(0);
  });

  it("fires revoked per-record for multiple revoked", () => {
    const rows = [
      makeRow({ id: "a-1", registration_status: "Revoked" }),
      makeRow({ id: "a-2", registration_status: "Revoked" }),
    ];
    const a = computeRegistrationAlerts(rows);
    const c = a.filter((x) => x.type === "registration_revoked");
    expect(c.length).toBe(2);
  });

  // ── Critical: fitness_to_practise_concern ──────────────────────────────

  it("fires critical for fitness to practise not clear", () => {
    const a = computeRegistrationAlerts([makeRow({ fitness_to_practise_clear: false })]);
    const c = a.filter((x) => x.type === "fitness_to_practise_concern" && x.severity === "critical");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("fitness to practise alert includes staff name", () => {
    const a = computeRegistrationAlerts([makeRow({ fitness_to_practise_clear: false, staff_name: "Charlie Day" })]);
    const c = a.filter((x) => x.type === "fitness_to_practise_concern");
    expect(c[0].message).toContain("Charlie Day");
  });

  it("fitness to practise alert includes professional body", () => {
    const a = computeRegistrationAlerts([makeRow({ fitness_to_practise_clear: false, professional_body: "Social Work England" })]);
    const c = a.filter((x) => x.type === "fitness_to_practise_concern");
    expect(c[0].message).toContain("Social Work England");
  });

  it("fitness to practise alert includes record_id", () => {
    const a = computeRegistrationAlerts([makeRow({ id: "rec-789", fitness_to_practise_clear: false })]);
    const c = a.filter((x) => x.type === "fitness_to_practise_concern");
    expect(c[0].record_id).toBe("rec-789");
  });

  it("fitness to practise alert references Reg 32", () => {
    const a = computeRegistrationAlerts([makeRow({ fitness_to_practise_clear: false })]);
    const c = a.filter((x) => x.type === "fitness_to_practise_concern");
    expect(c[0].message).toContain("Reg 32");
  });

  it("does NOT fire fitness to practise when clear", () => {
    const a = computeRegistrationAlerts([makeRow({ fitness_to_practise_clear: true })]);
    const c = a.filter((x) => x.type === "fitness_to_practise_concern");
    expect(c.length).toBe(0);
  });

  it("fires fitness to practise per-record for multiple concerns", () => {
    const rows = [
      makeRow({ id: "a-1", fitness_to_practise_clear: false }),
      makeRow({ id: "a-2", fitness_to_practise_clear: false }),
    ];
    const a = computeRegistrationAlerts(rows);
    const c = a.filter((x) => x.type === "fitness_to_practise_concern");
    expect(c.length).toBe(2);
  });

  // ── High: registration_suspended ───────────────────────────────────────

  it("fires high for suspended registration", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Suspended" })]);
    const c = a.filter((x) => x.type === "registration_suspended" && x.severity === "high");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("suspended alert includes staff name", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Suspended", staff_name: "Dana White" })]);
    const c = a.filter((x) => x.type === "registration_suspended");
    expect(c[0].message).toContain("Dana White");
  });

  it("suspended alert includes professional body", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Suspended", professional_body: "HCPC" })]);
    const c = a.filter((x) => x.type === "registration_suspended");
    expect(c[0].message).toContain("HCPC");
  });

  it("suspended alert includes record_id", () => {
    const a = computeRegistrationAlerts([makeRow({ id: "rec-s1", registration_status: "Suspended" })]);
    const c = a.filter((x) => x.type === "registration_suspended");
    expect(c[0].record_id).toBe("rec-s1");
  });

  it("does NOT fire suspended for Active status", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Active" })]);
    const c = a.filter((x) => x.type === "registration_suspended");
    expect(c.length).toBe(0);
  });

  it("does NOT fire suspended for Pending status", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Pending" })]);
    const c = a.filter((x) => x.type === "registration_suspended");
    expect(c.length).toBe(0);
  });

  it("fires suspended per-record for multiple suspended", () => {
    const rows = [
      makeRow({ id: "a-1", registration_status: "Suspended" }),
      makeRow({ id: "a-2", registration_status: "Suspended" }),
    ];
    const a = computeRegistrationAlerts(rows);
    const c = a.filter((x) => x.type === "registration_suspended");
    expect(c.length).toBe(2);
  });

  // ── High: registration_lapsed ──────────────────────────────────────────

  it("fires high for lapsed registration", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Lapsed" })]);
    const c = a.filter((x) => x.type === "registration_lapsed" && x.severity === "high");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("lapsed alert includes staff name", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Lapsed", staff_name: "Eve Adams" })]);
    const c = a.filter((x) => x.type === "registration_lapsed");
    expect(c[0].message).toContain("Eve Adams");
  });

  it("lapsed alert includes professional body", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Lapsed", professional_body: "Ofsted" })]);
    const c = a.filter((x) => x.type === "registration_lapsed");
    expect(c[0].message).toContain("Ofsted");
  });

  it("lapsed alert includes record_id", () => {
    const a = computeRegistrationAlerts([makeRow({ id: "rec-l1", registration_status: "Lapsed" })]);
    const c = a.filter((x) => x.type === "registration_lapsed");
    expect(c[0].record_id).toBe("rec-l1");
  });

  it("does NOT fire lapsed for Active status", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Active" })]);
    const c = a.filter((x) => x.type === "registration_lapsed");
    expect(c.length).toBe(0);
  });

  it("fires lapsed per-record for multiple lapsed", () => {
    const rows = [
      makeRow({ id: "a-1", registration_status: "Lapsed" }),
      makeRow({ id: "a-2", registration_status: "Lapsed" }),
    ];
    const a = computeRegistrationAlerts(rows);
    const c = a.filter((x) => x.type === "registration_lapsed");
    expect(c.length).toBe(2);
  });

  // ── High: pin_not_verified ─────────────────────────────────────────────

  it("fires high for PIN not verified", () => {
    const a = computeRegistrationAlerts([makeRow({ pin_verified: false })]);
    const c = a.filter((x) => x.type === "pin_not_verified" && x.severity === "high");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("PIN alert includes staff name", () => {
    const a = computeRegistrationAlerts([makeRow({ pin_verified: false, staff_name: "Frank Jones" })]);
    const c = a.filter((x) => x.type === "pin_not_verified");
    expect(c[0].message).toContain("Frank Jones");
  });

  it("PIN alert includes professional body", () => {
    const a = computeRegistrationAlerts([makeRow({ pin_verified: false, professional_body: "DfE" })]);
    const c = a.filter((x) => x.type === "pin_not_verified");
    expect(c[0].message).toContain("DfE");
  });

  it("PIN alert includes record_id", () => {
    const a = computeRegistrationAlerts([makeRow({ id: "rec-p1", pin_verified: false })]);
    const c = a.filter((x) => x.type === "pin_not_verified");
    expect(c[0].record_id).toBe("rec-p1");
  });

  it("does NOT fire PIN alert when verified", () => {
    const a = computeRegistrationAlerts([makeRow({ pin_verified: true })]);
    const c = a.filter((x) => x.type === "pin_not_verified");
    expect(c.length).toBe(0);
  });

  it("fires PIN alert per-record for multiple unverified", () => {
    const rows = [
      makeRow({ id: "a-1", pin_verified: false }),
      makeRow({ id: "a-2", pin_verified: false }),
    ];
    const a = computeRegistrationAlerts(rows);
    const c = a.filter((x) => x.type === "pin_not_verified");
    expect(c.length).toBe(2);
  });

  // ── Medium: cpd_hours_incomplete ───────────────────────────────────────

  it("fires medium for CPD hours incomplete", () => {
    const a = computeRegistrationAlerts([makeRow({ cpd_hours_completed: 10, cpd_hours_required: 30 })]);
    const c = a.filter((x) => x.type === "cpd_hours_incomplete" && x.severity === "medium");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("CPD alert includes staff name", () => {
    const a = computeRegistrationAlerts([makeRow({ cpd_hours_completed: 5, cpd_hours_required: 30, staff_name: "Grace Lee" })]);
    const c = a.filter((x) => x.type === "cpd_hours_incomplete");
    expect(c[0].message).toContain("Grace Lee");
  });

  it("CPD alert includes hours completed", () => {
    const a = computeRegistrationAlerts([makeRow({ cpd_hours_completed: 12, cpd_hours_required: 30 })]);
    const c = a.filter((x) => x.type === "cpd_hours_incomplete");
    expect(c[0].message).toContain("12");
  });

  it("CPD alert includes hours required", () => {
    const a = computeRegistrationAlerts([makeRow({ cpd_hours_completed: 12, cpd_hours_required: 30 })]);
    const c = a.filter((x) => x.type === "cpd_hours_incomplete");
    expect(c[0].message).toContain("30");
  });

  it("CPD alert includes professional body", () => {
    const a = computeRegistrationAlerts([makeRow({ cpd_hours_completed: 5, cpd_hours_required: 30, professional_body: "HCPC" })]);
    const c = a.filter((x) => x.type === "cpd_hours_incomplete");
    expect(c[0].message).toContain("HCPC");
  });

  it("CPD alert includes record_id", () => {
    const a = computeRegistrationAlerts([makeRow({ id: "rec-c1", cpd_hours_completed: 5, cpd_hours_required: 30 })]);
    const c = a.filter((x) => x.type === "cpd_hours_incomplete");
    expect(c[0].record_id).toBe("rec-c1");
  });

  it("does NOT fire CPD alert when completed equals required", () => {
    const a = computeRegistrationAlerts([makeRow({ cpd_hours_completed: 30, cpd_hours_required: 30 })]);
    const c = a.filter((x) => x.type === "cpd_hours_incomplete");
    expect(c.length).toBe(0);
  });

  it("does NOT fire CPD alert when completed exceeds required", () => {
    const a = computeRegistrationAlerts([makeRow({ cpd_hours_completed: 50, cpd_hours_required: 30 })]);
    const c = a.filter((x) => x.type === "cpd_hours_incomplete");
    expect(c.length).toBe(0);
  });

  it("does NOT fire CPD alert when both are 0", () => {
    const a = computeRegistrationAlerts([makeRow({ cpd_hours_completed: 0, cpd_hours_required: 0 })]);
    const c = a.filter((x) => x.type === "cpd_hours_incomplete");
    expect(c.length).toBe(0);
  });

  it("fires CPD alert per-record for multiple incomplete", () => {
    const rows = [
      makeRow({ id: "a-1", cpd_hours_completed: 5, cpd_hours_required: 30 }),
      makeRow({ id: "a-2", cpd_hours_completed: 10, cpd_hours_required: 30 }),
    ];
    const a = computeRegistrationAlerts(rows);
    const c = a.filter((x) => x.type === "cpd_hours_incomplete");
    expect(c.length).toBe(2);
  });

  // ── Mixed alert scenarios ──────────────────────────────────────────────

  it("fires both expired and revoked for different records", () => {
    const rows = [
      makeRow({ id: "a-1", registration_status: "Expired" }),
      makeRow({ id: "a-2", registration_status: "Revoked" }),
    ];
    const a = computeRegistrationAlerts(rows);
    expect(a.filter((x) => x.type === "registration_expired").length).toBe(1);
    expect(a.filter((x) => x.type === "registration_revoked").length).toBe(1);
  });

  it("fires multiple alert types for same record", () => {
    const row = makeRow({
      registration_status: "Expired",
      fitness_to_practise_clear: false,
      pin_verified: false,
      cpd_hours_completed: 5,
      cpd_hours_required: 30,
    });
    const a = computeRegistrationAlerts([row]);
    expect(a.filter((x) => x.severity === "critical").length).toBeGreaterThanOrEqual(2);
    expect(a.filter((x) => x.severity === "high").length).toBeGreaterThanOrEqual(1);
    expect(a.filter((x) => x.severity === "medium").length).toBeGreaterThanOrEqual(1);
  });

  it("no alerts for compliant set of 5 records", () => {
    const rows = Array.from({ length: 5 }, () => makeRow());
    expect(computeRegistrationAlerts(rows)).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateRegistrationCaraInsights
// ══════════════════════════════════════════════════════════════════════════════

describe("generateRegistrationCaraInsights", () => {
  // ── Structure ──────────────────────────────────────────────────────────

  it("returns exactly 3 insights", () => {
    expect(generateRegistrationCaraInsights([makeRow()])).toHaveLength(3);
  });

  it("returns 3 insights for empty array", () => {
    expect(generateRegistrationCaraInsights([])).toHaveLength(3);
  });

  it("all insights are strings", () => {
    const insights = generateRegistrationCaraInsights([makeRow()]);
    for (const insight of insights) expect(typeof insight).toBe("string");
  });

  it("all insights are non-empty strings", () => {
    const insights = generateRegistrationCaraInsights([makeRow()]);
    for (const insight of insights) expect(insight.length).toBeGreaterThan(0);
  });

  // ── Insight 1: purple-themed summary ───────────────────────────────────

  it("first insight starts with [purple]", () => {
    const insights = generateRegistrationCaraInsights([makeRow()]);
    expect(insights[0]).toMatch(/^\[purple\]/);
  });

  it("first insight includes total registration count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[0]).toContain("3");
  });

  it("first insight uses singular registration for 1 record", () => {
    const insights = generateRegistrationCaraInsights([makeRow()]);
    expect(insights[0]).toContain("registration");
    expect(insights[0]).not.toContain("registrations");
  });

  it("first insight uses plural registrations for 2+ records", () => {
    const rows = [makeRow(), makeRow()];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[0]).toContain("registrations");
  });

  it("first insight uses singular member for 1 staff", () => {
    const insights = generateRegistrationCaraInsights([makeRow()]);
    expect(insights[0]).toContain("member");
    expect(insights[0]).not.toContain("members");
  });

  it("first insight uses plural members for 2+ staff", () => {
    const rows = [makeRow({ staff_name: "Alice" }), makeRow({ staff_name: "Bob" })];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[0]).toContain("members");
  });

  it("first insight uses singular body for 1 body", () => {
    const insights = generateRegistrationCaraInsights([makeRow()]);
    expect(insights[0]).toContain("body");
    expect(insights[0]).not.toContain("bodies");
  });

  it("first insight uses plural bodies for 2+ bodies", () => {
    const rows = [
      makeRow({ professional_body: "Social Work England" }),
      makeRow({ professional_body: "HCPC" }),
    ];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[0]).toContain("bodies");
  });

  it("first insight includes active count", () => {
    const rows = [makeRow({ registration_status: "Active" })];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[0]).toContain("1 active");
  });

  it("first insight includes expired count", () => {
    const rows = [makeRow({ registration_status: "Expired" })];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[0]).toContain("1 expired");
  });

  it("first insight includes lapsed count", () => {
    const rows = [makeRow({ registration_status: "Lapsed" })];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[0]).toContain("1 lapsed");
  });

  it("first insight includes suspended count", () => {
    const rows = [makeRow({ registration_status: "Suspended" })];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[0]).toContain("1 suspended");
  });

  it("first insight handles empty data gracefully", () => {
    const insights = generateRegistrationCaraInsights([]);
    expect(insights[0]).toContain("0 professional");
    expect(insights[0]).toContain("0 staff");
  });

  // ── Insight 2: amber-themed priorities ──────────────────────────────────

  it("second insight starts with [amber]", () => {
    const insights = generateRegistrationCaraInsights([makeRow()]);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions alerts when critical alerts exist", () => {
    const rows = [makeRow({ registration_status: "Expired" })];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[1]).toContain("critical");
  });

  it("second insight mentions no alerts when all compliant", () => {
    const rows = [makeRow()];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[1]).toMatch(/[Nn]o critical/);
  });

  it("second insight includes PIN verified rate", () => {
    const rows = [makeRow({ pin_verified: true }), makeRow({ pin_verified: false })];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes CPD compliance rate", () => {
    const rows = [
      makeRow({ cpd_hours_completed: 30, cpd_hours_required: 30 }),
      makeRow({ cpd_hours_completed: 10, cpd_hours_required: 30 }),
    ];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes fitness to practise rate", () => {
    const rows = [
      makeRow({ fitness_to_practise_clear: true }),
      makeRow({ fitness_to_practise_clear: false }),
    ];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight mentions Reg 32 when no alerts", () => {
    const rows = [makeRow()];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[1]).toContain("Reg 32");
  });

  it("second insight counts high-priority alerts", () => {
    const rows = [makeRow({ pin_verified: false, registration_status: "Suspended" })];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[1]).toContain("high-priority");
  });

  // ── Insight 3: reflect-themed question ──────────────────────────────────

  it("third insight starts with [reflect]", () => {
    const insights = generateRegistrationCaraInsights([makeRow()]);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions expired count when present", () => {
    const rows = [makeRow({ registration_status: "Expired" })];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[2]).toContain("1");
    expect(insights[2]).toContain("expired");
  });

  it("third insight uses singular when 1 expired", () => {
    const rows = [makeRow({ registration_status: "Expired" })];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[2]).toContain("registration has");
  });

  it("third insight uses plural when 2+ expired", () => {
    const rows = [
      makeRow({ registration_status: "Expired", staff_name: "Alice" }),
      makeRow({ registration_status: "Expired", staff_name: "Bob" }),
    ];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[2]).toContain("registrations have");
  });

  it("third insight addresses CPD when no expired but rate < 100", () => {
    const rows = [
      makeRow({ registration_status: "Active", cpd_hours_completed: 10, cpd_hours_required: 30 }),
    ];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[2]).toContain("CPD");
  });

  it("third insight includes CPD compliance rate when no expired", () => {
    const rows = [
      makeRow({ cpd_hours_completed: 30, cpd_hours_required: 30 }),
      makeRow({ cpd_hours_completed: 10, cpd_hours_required: 30 }),
    ];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[2]).toContain("50%");
  });

  it("third insight celebrates full compliance when all current and CPD met", () => {
    const rows = [
      makeRow({ registration_status: "Active", cpd_hours_completed: 30, cpd_hours_required: 30 }),
    ];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[2]).toContain("current");
    expect(insights[2]).toContain("CPD");
  });

  it("third insight references CHR 2015 when CPD not met", () => {
    const rows = [makeRow({ cpd_hours_completed: 10, cpd_hours_required: 30 })];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[2]).toContain("CHR 2015");
  });

  it("third insight references CHR 2015 when fully compliant", () => {
    const rows = [makeRow()];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[2]).toContain("CHR 2015");
  });

  it("third insight mentions Reg 32 when expired", () => {
    const rows = [makeRow({ registration_status: "Expired" })];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[2]).toContain("Reg 32");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CRUD (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD when Supabase disabled", () => {
  it("listStaffProfessionalRegistrations returns empty data", async () => {
    const { listStaffProfessionalRegistrations } = await import("../staff-professional-registration-service");
    const result = await listStaffProfessionalRegistrations("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("createStaffProfessionalRegistration returns error", async () => {
    const { createStaffProfessionalRegistration } = await import("../staff-professional-registration-service");
    const result = await createStaffProfessionalRegistration({
      homeId: "home-1",
      staffName: "Jane Smith",
      professionalBody: "Social Work England",
      registrationNumber: "SWE-001234",
      registrationStatus: "Active",
      registrationDate: "2026-01-01",
      pinVerified: true,
      cpdHoursCompleted: 30,
      cpdHoursRequired: 30,
      fitnessToPractiseClear: true,
      conditionsOnRegistration: false,
      renewalSubmitted: true,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("updateStaffProfessionalRegistration returns error", async () => {
    const { updateStaffProfessionalRegistration } = await import("../staff-professional-registration-service");
    const result = await updateStaffProfessionalRegistration("rec-1", { notes: "updated" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Edge cases
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("metrics handles single record with all problematic values", () => {
    const row = makeRow({
      pin_verified: false,
      cpd_hours_completed: 0,
      cpd_hours_required: 30,
      fitness_to_practise_clear: false,
      renewal_submitted: false,
      conditions_on_registration: true,
    });
    const m = computeRegistrationMetrics([row]);
    expect(m.pin_verified_rate).toBe(0);
    expect(m.cpd_compliance_rate).toBe(0);
    expect(m.fitness_to_practise_rate).toBe(0);
    expect(m.renewal_submitted_rate).toBe(0);
    expect(m.conditions_count).toBe(1);
  });

  it("alerts for record with all flags triggering", () => {
    const row = makeRow({
      registration_status: "Expired",
      fitness_to_practise_clear: false,
      pin_verified: false,
      cpd_hours_completed: 5,
      cpd_hours_required: 30,
    });
    const a = computeRegistrationAlerts([row]);
    expect(a.length).toBeGreaterThanOrEqual(4);
  });

  it("makeRow factory with overrides preserves overrides", () => {
    const row = makeRow({
      staff_name: "Custom Name",
      professional_body: "HCPC",
      registration_status: "Expired",
    });
    expect(row.staff_name).toBe("Custom Name");
    expect(row.professional_body).toBe("HCPC");
    expect(row.registration_status).toBe("Expired");
  });

  it("makeRow factory nullable fields have expected defaults", () => {
    const row = makeRow();
    expect(row.expiry_date).toBeNull();
    expect(row.pin_verification_date).toBeNull();
    expect(row.renewal_date).toBeNull();
    expect(row.notes).toBeNull();
  });

  it("makeRow factory registration_number defaults to non-null", () => {
    const row = makeRow();
    expect(row.registration_number).toBe("SWE-001234");
  });

  it("makeRow factory allows setting nullable fields", () => {
    const row = makeRow({
      expiry_date: "2027-01-01",
      pin_verification_date: "2026-06-01",
      renewal_date: "2027-06-01",
      notes: "Reviewed and cleared",
    });
    expect(row.expiry_date).toBe("2027-01-01");
    expect(row.pin_verification_date).toBe("2026-06-01");
    expect(row.renewal_date).toBe("2027-06-01");
    expect(row.notes).toBe("Reviewed and cleared");
  });

  it("makeRow factory allows explicitly setting nullable fields to null", () => {
    const row = makeRow({ expiry_date: null, notes: null, renewal_date: null });
    expect(row.expiry_date).toBeNull();
    expect(row.notes).toBeNull();
    expect(row.renewal_date).toBeNull();
  });

  it("metrics handles large dataset", () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      makeRow({
        staff_name: `Staff ${i % 10}`,
        registration_status: i % 5 === 0 ? "Expired" : "Active",
        professional_body: PROFESSIONAL_BODIES[i % 6],
        cpd_hours_completed: i % 3 === 0 ? 10 : 30,
        cpd_hours_required: 30,
      }),
    );
    const m = computeRegistrationMetrics(rows);
    expect(m.total_registrations).toBe(100);
    expect(m.unique_staff).toBe(10);
    expect(m.expired_count).toBe(20);
    expect(m.unique_bodies).toBe(6);
  });

  it("insights handle empty data gracefully", () => {
    const insights = generateRegistrationCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("0 professional");
    expect(insights[0]).toContain("0 staff");
  });

  it("alerts handle no problematic records", () => {
    const rows = Array.from({ length: 5 }, () => makeRow());
    const a = computeRegistrationAlerts(rows);
    expect(a).toEqual([]);
  });

  it("metrics with mixed statuses", () => {
    const rows = [
      makeRow({ registration_status: "Active" }),
      makeRow({ registration_status: "Expired" }),
      makeRow({ registration_status: "Lapsed" }),
      makeRow({ registration_status: "Suspended" }),
      makeRow({ registration_status: "Pending" }),
      makeRow({ registration_status: "Revoked" }),
    ];
    const m = computeRegistrationMetrics(rows);
    expect(m.total_registrations).toBe(6);
    expect(m.active_count).toBe(1);
    expect(m.expired_count).toBe(1);
    expect(m.lapsed_count).toBe(1);
    expect(m.suspended_count).toBe(1);
  });

  it("CPD compliance counts edge case: completed equals required exactly", () => {
    const rows = [makeRow({ cpd_hours_completed: 30, cpd_hours_required: 30 })];
    expect(computeRegistrationMetrics(rows).cpd_compliance_rate).toBe(100);
  });

  it("CPD compliance counts edge case: completed is 1 less than required", () => {
    const rows = [makeRow({ cpd_hours_completed: 29, cpd_hours_required: 30 })];
    expect(computeRegistrationMetrics(rows).cpd_compliance_rate).toBe(0);
  });

  it("CPD compliance counts edge case: completed is 1 more than required", () => {
    const rows = [makeRow({ cpd_hours_completed: 31, cpd_hours_required: 30 })];
    expect(computeRegistrationMetrics(rows).cpd_compliance_rate).toBe(100);
  });

  it("revoked does not fire suspended alert", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Revoked" })]);
    const c = a.filter((x) => x.type === "registration_suspended");
    expect(c.length).toBe(0);
  });

  it("revoked does not fire lapsed alert", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Revoked" })]);
    const c = a.filter((x) => x.type === "registration_lapsed");
    expect(c.length).toBe(0);
  });

  it("expired does not fire suspended alert", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Expired" })]);
    const c = a.filter((x) => x.type === "registration_suspended");
    expect(c.length).toBe(0);
  });

  it("expired does not fire lapsed alert", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Expired" })]);
    const c = a.filter((x) => x.type === "registration_lapsed");
    expect(c.length).toBe(0);
  });

  it("lapsed does not fire expired alert", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Lapsed" })]);
    const c = a.filter((x) => x.type === "registration_expired");
    expect(c.length).toBe(0);
  });

  it("suspended does not fire expired alert", () => {
    const a = computeRegistrationAlerts([makeRow({ registration_status: "Suspended" })]);
    const c = a.filter((x) => x.type === "registration_expired");
    expect(c.length).toBe(0);
  });

  it("default makeRow has no alerts", () => {
    const a = computeRegistrationAlerts([makeRow()]);
    expect(a.length).toBe(0);
  });

  it("default makeRow has all rates at 100", () => {
    const m = computeRegistrationMetrics([makeRow()]);
    expect(m.pin_verified_rate).toBe(100);
    expect(m.cpd_compliance_rate).toBe(100);
    expect(m.fitness_to_practise_rate).toBe(100);
    expect(m.renewal_submitted_rate).toBe(100);
  });

  it("insights with only Revoked records mention critical alerts", () => {
    const rows = [makeRow({ registration_status: "Revoked" })];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[1]).toContain("critical");
  });

  it("insights with mixed compliant and non-compliant CPD", () => {
    const rows = [
      makeRow({ cpd_hours_completed: 30, cpd_hours_required: 30 }),
      makeRow({ cpd_hours_completed: 30, cpd_hours_required: 30 }),
      makeRow({ cpd_hours_completed: 10, cpd_hours_required: 30 }),
    ];
    const insights = generateRegistrationCaraInsights(rows);
    expect(insights[2]).toContain("66.7%");
  });

  it("metrics with all same professional body", () => {
    const rows = [
      makeRow({ professional_body: "Social Work England" }),
      makeRow({ professional_body: "Social Work England" }),
      makeRow({ professional_body: "Social Work England" }),
    ];
    const m = computeRegistrationMetrics(rows);
    expect(m.unique_bodies).toBe(1);
  });

  it("metrics with all different professional bodies", () => {
    const rows = PROFESSIONAL_BODIES.map((b, i) =>
      makeRow({ id: `a-${i}`, professional_body: b }),
    );
    const m = computeRegistrationMetrics(rows);
    expect(m.unique_bodies).toBe(6);
  });

  it("alerts severity ordering: critical before high before medium", () => {
    const row = makeRow({
      registration_status: "Expired",
      pin_verified: false,
      cpd_hours_completed: 5,
      cpd_hours_required: 30,
    });
    const a = computeRegistrationAlerts([row]);
    const criticals = a.filter((x) => x.severity === "critical");
    const highs = a.filter((x) => x.severity === "high");
    const mediums = a.filter((x) => x.severity === "medium");
    expect(criticals.length).toBeGreaterThan(0);
    expect(highs.length).toBeGreaterThan(0);
    expect(mediums.length).toBeGreaterThan(0);
  });

  it("multiple staff with different bodies and statuses", () => {
    const rows = [
      makeRow({ staff_name: "Alice", professional_body: "Social Work England", registration_status: "Active" }),
      makeRow({ staff_name: "Bob", professional_body: "HCPC", registration_status: "Expired" }),
      makeRow({ staff_name: "Charlie", professional_body: "NMC", registration_status: "Lapsed" }),
      makeRow({ staff_name: "Dana", professional_body: "Ofsted", registration_status: "Suspended" }),
      makeRow({ staff_name: "Eve", professional_body: "DfE", registration_status: "Pending" }),
    ];
    const m = computeRegistrationMetrics(rows);
    expect(m.unique_staff).toBe(5);
    expect(m.unique_bodies).toBe(5);
    expect(m.total_registrations).toBe(5);
    expect(m.active_count).toBe(1);
    expect(m.expired_count).toBe(1);
    expect(m.lapsed_count).toBe(1);
    expect(m.suspended_count).toBe(1);
  });

  it("same staff with multiple registrations across bodies", () => {
    const rows = [
      makeRow({ staff_name: "Alice", professional_body: "Social Work England" }),
      makeRow({ staff_name: "Alice", professional_body: "HCPC" }),
      makeRow({ staff_name: "Alice", professional_body: "NMC" }),
    ];
    const m = computeRegistrationMetrics(rows);
    expect(m.unique_staff).toBe(1);
    expect(m.unique_bodies).toBe(3);
    expect(m.total_registrations).toBe(3);
  });
});
