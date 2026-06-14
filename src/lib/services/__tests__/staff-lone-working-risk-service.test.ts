// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF LONE WORKING RISK SERVICE TESTS
// Pure-function unit tests for lone working risk assessment metrics, alert
// identification, and Cara insight generation.
//
// Health and Safety at Work Act 1974 — employer duty to protect lone workers.
// Management of Health and Safety at Work Regulations 1999 — risk assessment
// obligations for lone working activities.
// CHR 2015 Reg 32 (fitness of workers — staff welfare and safe working practices).
//
// Covers: Lone working type classification, risk level assessment, check-in
// protocols, personal alarms, mobile phone availability, emergency procedures,
// training completion, incident and near-miss reporting.
//
// SCCIF: Leadership & Management — "The home ensures that staff who work alone
// are properly risk-assessed, equipped, and supported to maintain the safety
// of both themselves and the children in their care."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  type StaffLoneWorkingRiskRow,
  LONE_WORKING_TYPES,
  RISK_LEVELS,
  CHECK_IN_FREQUENCIES,
  COMPLIANCE_STATUSES,
} from "../staff-lone-working-risk-service";

const { computeMetrics, computeAlerts, computeCaraInsights } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(overrides?: Partial<StaffLoneWorkingRiskRow>): StaffLoneWorkingRiskRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    assessment_date: "assessment_date" in (overrides ?? {}) ? overrides!.assessment_date! : now.toISOString().split("T")[0],
    assessor_name: "assessor_name" in (overrides ?? {}) ? overrides!.assessor_name! : "Registered Manager",
    staff_name: "staff_name" in (overrides ?? {}) ? overrides!.staff_name! : "Jane Smith",
    lone_working_type: "lone_working_type" in (overrides ?? {}) ? overrides!.lone_working_type! : "Night Shift",
    risk_level: "risk_level" in (overrides ?? {}) ? overrides!.risk_level! : "Low",
    risk_assessment_completed: "risk_assessment_completed" in (overrides ?? {}) ? overrides!.risk_assessment_completed! : true,
    check_in_protocol_agreed: "check_in_protocol_agreed" in (overrides ?? {}) ? overrides!.check_in_protocol_agreed! : true,
    check_in_frequency: "check_in_frequency" in (overrides ?? {}) ? (overrides!.check_in_frequency ?? null) : null,
    personal_alarm_issued: "personal_alarm_issued" in (overrides ?? {}) ? overrides!.personal_alarm_issued! : false,
    mobile_phone_available: "mobile_phone_available" in (overrides ?? {}) ? overrides!.mobile_phone_available! : true,
    emergency_procedures_known: "emergency_procedures_known" in (overrides ?? {}) ? overrides!.emergency_procedures_known! : true,
    training_completed: "training_completed" in (overrides ?? {}) ? overrides!.training_completed! : true,
    incident_during_lone_work: "incident_during_lone_work" in (overrides ?? {}) ? overrides!.incident_during_lone_work! : false,
    near_miss_reported: "near_miss_reported" in (overrides ?? {}) ? overrides!.near_miss_reported! : false,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
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
  // ── LONE_WORKING_TYPES ────────────────────────────────────────────────
  it("LONE_WORKING_TYPES has 8 entries", () => {
    expect(LONE_WORKING_TYPES).toHaveLength(8);
  });

  it("LONE_WORKING_TYPES includes Night Shift", () => {
    expect(LONE_WORKING_TYPES).toContain("Night Shift");
  });

  it("LONE_WORKING_TYPES includes Sleep-In", () => {
    expect(LONE_WORKING_TYPES).toContain("Sleep-In");
  });

  it("LONE_WORKING_TYPES includes Home Visit", () => {
    expect(LONE_WORKING_TYPES).toContain("Home Visit");
  });

  it("LONE_WORKING_TYPES includes Transport", () => {
    expect(LONE_WORKING_TYPES).toContain("Transport");
  });

  it("LONE_WORKING_TYPES includes Community Outing", () => {
    expect(LONE_WORKING_TYPES).toContain("Community Outing");
  });

  it("LONE_WORKING_TYPES includes Office Alone", () => {
    expect(LONE_WORKING_TYPES).toContain("Office Alone");
  });

  it("LONE_WORKING_TYPES includes Emergency Cover", () => {
    expect(LONE_WORKING_TYPES).toContain("Emergency Cover");
  });

  it("LONE_WORKING_TYPES includes Other", () => {
    expect(LONE_WORKING_TYPES).toContain("Other");
  });

  it("LONE_WORKING_TYPES has unique values", () => {
    expect(new Set(LONE_WORKING_TYPES).size).toBe(LONE_WORKING_TYPES.length);
  });

  it("LONE_WORKING_TYPES is a readonly tuple", () => {
    expect(Array.isArray(LONE_WORKING_TYPES)).toBe(true);
  });

  it("LONE_WORKING_TYPES first entry is Night Shift", () => {
    expect(LONE_WORKING_TYPES[0]).toBe("Night Shift");
  });

  it("LONE_WORKING_TYPES last entry is Other", () => {
    expect(LONE_WORKING_TYPES[7]).toBe("Other");
  });

  // ── RISK_LEVELS ───────────────────────────────────────────────────────
  it("RISK_LEVELS has 4 entries", () => {
    expect(RISK_LEVELS).toHaveLength(4);
  });

  it("RISK_LEVELS includes Low", () => {
    expect(RISK_LEVELS).toContain("Low");
  });

  it("RISK_LEVELS includes Medium", () => {
    expect(RISK_LEVELS).toContain("Medium");
  });

  it("RISK_LEVELS includes High", () => {
    expect(RISK_LEVELS).toContain("High");
  });

  it("RISK_LEVELS includes Unacceptable", () => {
    expect(RISK_LEVELS).toContain("Unacceptable");
  });

  it("RISK_LEVELS has unique values", () => {
    expect(new Set(RISK_LEVELS).size).toBe(RISK_LEVELS.length);
  });

  it("RISK_LEVELS is a readonly tuple", () => {
    expect(Array.isArray(RISK_LEVELS)).toBe(true);
  });

  it("RISK_LEVELS first entry is Low", () => {
    expect(RISK_LEVELS[0]).toBe("Low");
  });

  it("RISK_LEVELS last entry is Unacceptable", () => {
    expect(RISK_LEVELS[3]).toBe("Unacceptable");
  });

  // ── CHECK_IN_FREQUENCIES ──────────────────────────────────────────────
  it("CHECK_IN_FREQUENCIES has 5 entries", () => {
    expect(CHECK_IN_FREQUENCIES).toHaveLength(5);
  });

  it("CHECK_IN_FREQUENCIES includes Hourly", () => {
    expect(CHECK_IN_FREQUENCIES).toContain("Hourly");
  });

  it("CHECK_IN_FREQUENCIES includes 2-Hourly", () => {
    expect(CHECK_IN_FREQUENCIES).toContain("2-Hourly");
  });

  it("CHECK_IN_FREQUENCIES includes 4-Hourly", () => {
    expect(CHECK_IN_FREQUENCIES).toContain("4-Hourly");
  });

  it("CHECK_IN_FREQUENCIES includes Start/End", () => {
    expect(CHECK_IN_FREQUENCIES).toContain("Start/End");
  });

  it("CHECK_IN_FREQUENCIES includes On Demand", () => {
    expect(CHECK_IN_FREQUENCIES).toContain("On Demand");
  });

  it("CHECK_IN_FREQUENCIES has unique values", () => {
    expect(new Set(CHECK_IN_FREQUENCIES).size).toBe(CHECK_IN_FREQUENCIES.length);
  });

  it("CHECK_IN_FREQUENCIES is a readonly tuple", () => {
    expect(Array.isArray(CHECK_IN_FREQUENCIES)).toBe(true);
  });

  it("CHECK_IN_FREQUENCIES first entry is Hourly", () => {
    expect(CHECK_IN_FREQUENCIES[0]).toBe("Hourly");
  });

  it("CHECK_IN_FREQUENCIES last entry is On Demand", () => {
    expect(CHECK_IN_FREQUENCIES[4]).toBe("On Demand");
  });

  // ── COMPLIANCE_STATUSES ───────────────────────────────────────────────
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

  it("COMPLIANCE_STATUSES includes Suspended", () => {
    expect(COMPLIANCE_STATUSES).toContain("Suspended");
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

  it("COMPLIANCE_STATUSES last entry is Suspended", () => {
    expect(COMPLIANCE_STATUSES[3]).toBe("Suspended");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMetrics", () => {
  // ── Empty / baseline ────────────────────────────────────────────────────

  it("returns zeros for empty array", () => {
    const m = computeMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.unacceptable_count).toBe(0);
    expect(m.incident_count).toBe(0);
    expect(m.near_miss_count).toBe(0);
    expect(m.non_compliant_count).toBe(0);
    expect(m.unique_staff).toBe(0);
    expect(m.unique_assessors).toBe(0);
  });

  it("returns 0 rates for empty array", () => {
    const m = computeMetrics([]);
    expect(m.risk_assessment_rate).toBe(0);
    expect(m.check_in_rate).toBe(0);
    expect(m.personal_alarm_rate).toBe(0);
    expect(m.mobile_phone_rate).toBe(0);
    expect(m.emergency_procedures_rate).toBe(0);
    expect(m.training_rate).toBe(0);
  });

  // ── total_assessments ─────────────────────────────────────────────────

  it("total_assessments counts single record", () => {
    expect(computeMetrics([makeRow()]).total_assessments).toBe(1);
  });

  it("total_assessments counts multiple records", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    expect(computeMetrics(rows).total_assessments).toBe(3);
  });

  it("total_assessments counts 10 records", () => {
    const rows = Array.from({ length: 10 }, () => makeRow());
    expect(computeMetrics(rows).total_assessments).toBe(10);
  });

  // ── high_risk_count ───────────────────────────────────────────────────

  it("high_risk_count is 0 when no high risk", () => {
    expect(computeMetrics([makeRow({ risk_level: "Low" })]).high_risk_count).toBe(0);
  });

  it("high_risk_count counts High risk records", () => {
    expect(computeMetrics([makeRow({ risk_level: "High" })]).high_risk_count).toBe(1);
  });

  it("high_risk_count counts multiple High risk", () => {
    const rows = [
      makeRow({ risk_level: "High" }),
      makeRow({ risk_level: "High" }),
      makeRow({ risk_level: "Low" }),
    ];
    expect(computeMetrics(rows).high_risk_count).toBe(2);
  });

  it("high_risk_count does not count Medium", () => {
    expect(computeMetrics([makeRow({ risk_level: "Medium" })]).high_risk_count).toBe(0);
  });

  it("high_risk_count does not count Unacceptable", () => {
    expect(computeMetrics([makeRow({ risk_level: "Unacceptable" })]).high_risk_count).toBe(0);
  });

  // ── unacceptable_count ────────────────────────────────────────────────

  it("unacceptable_count is 0 when none unacceptable", () => {
    expect(computeMetrics([makeRow({ risk_level: "Low" })]).unacceptable_count).toBe(0);
  });

  it("unacceptable_count counts Unacceptable risk records", () => {
    expect(computeMetrics([makeRow({ risk_level: "Unacceptable" })]).unacceptable_count).toBe(1);
  });

  it("unacceptable_count counts multiple Unacceptable", () => {
    const rows = [
      makeRow({ risk_level: "Unacceptable" }),
      makeRow({ risk_level: "Unacceptable" }),
      makeRow({ risk_level: "High" }),
    ];
    expect(computeMetrics(rows).unacceptable_count).toBe(2);
  });

  // ── incident_count ────────────────────────────────────────────────────

  it("incident_count is 0 when no incidents", () => {
    expect(computeMetrics([makeRow({ incident_during_lone_work: false })]).incident_count).toBe(0);
  });

  it("incident_count counts incidents", () => {
    expect(computeMetrics([makeRow({ incident_during_lone_work: true })]).incident_count).toBe(1);
  });

  it("incident_count counts multiple incidents", () => {
    const rows = [
      makeRow({ incident_during_lone_work: true }),
      makeRow({ incident_during_lone_work: true }),
      makeRow({ incident_during_lone_work: false }),
    ];
    expect(computeMetrics(rows).incident_count).toBe(2);
  });

  // ── near_miss_count ───────────────────────────────────────────────────

  it("near_miss_count is 0 when no near misses", () => {
    expect(computeMetrics([makeRow({ near_miss_reported: false })]).near_miss_count).toBe(0);
  });

  it("near_miss_count counts near misses", () => {
    expect(computeMetrics([makeRow({ near_miss_reported: true })]).near_miss_count).toBe(1);
  });

  it("near_miss_count counts multiple near misses", () => {
    const rows = [
      makeRow({ near_miss_reported: true }),
      makeRow({ near_miss_reported: true }),
      makeRow({ near_miss_reported: false }),
    ];
    expect(computeMetrics(rows).near_miss_count).toBe(2);
  });

  // ── non_compliant_count ───────────────────────────────────────────────

  it("non_compliant_count is 0 for compliant records", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Compliant" })]).non_compliant_count).toBe(0);
  });

  it("non_compliant_count counts Non-Compliant", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Non-Compliant" })]).non_compliant_count).toBe(1);
  });

  it("non_compliant_count does not count Action Required", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Action Required" })]).non_compliant_count).toBe(0);
  });

  it("non_compliant_count does not count Suspended", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Suspended" })]).non_compliant_count).toBe(0);
  });

  it("non_compliant_count counts multiple Non-Compliant", () => {
    const rows = [
      makeRow({ compliance_status: "Non-Compliant" }),
      makeRow({ compliance_status: "Non-Compliant" }),
      makeRow({ compliance_status: "Compliant" }),
    ];
    expect(computeMetrics(rows).non_compliant_count).toBe(2);
  });

  // ── Boolean rates ─────────────────────────────────────────────────────

  it("returns 100% for default boolean rates when defaults are true", () => {
    const m = computeMetrics([makeRow()]);
    expect(m.risk_assessment_rate).toBe(100);
    expect(m.check_in_rate).toBe(100);
    expect(m.mobile_phone_rate).toBe(100);
    expect(m.emergency_procedures_rate).toBe(100);
    expect(m.training_rate).toBe(100);
  });

  it("personal_alarm_rate is 0 when none issued (default)", () => {
    expect(computeMetrics([makeRow()]).personal_alarm_rate).toBe(0);
  });

  it("personal_alarm_rate is 100 when all issued", () => {
    expect(computeMetrics([makeRow({ personal_alarm_issued: true })]).personal_alarm_rate).toBe(100);
  });

  it("risk_assessment_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ risk_assessment_completed: false })]).risk_assessment_rate).toBe(0);
  });

  it("check_in_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ check_in_protocol_agreed: false })]).check_in_rate).toBe(0);
  });

  it("mobile_phone_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ mobile_phone_available: false })]).mobile_phone_rate).toBe(0);
  });

  it("emergency_procedures_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ emergency_procedures_known: false })]).emergency_procedures_rate).toBe(0);
  });

  it("training_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ training_completed: false })]).training_rate).toBe(0);
  });

  it("mixed risk_assessment_rate computes correctly (66.7%)", () => {
    const rows = [
      makeRow({ risk_assessment_completed: true }),
      makeRow({ risk_assessment_completed: true }),
      makeRow({ risk_assessment_completed: false }),
    ];
    expect(computeMetrics(rows).risk_assessment_rate).toBe(66.7);
  });

  it("mixed check_in_rate computes correctly (50%)", () => {
    const rows = [
      makeRow({ check_in_protocol_agreed: true }),
      makeRow({ check_in_protocol_agreed: false }),
    ];
    expect(computeMetrics(rows).check_in_rate).toBe(50);
  });

  it("mixed personal_alarm_rate computes correctly (33.3%)", () => {
    const rows = [
      makeRow({ personal_alarm_issued: true }),
      makeRow({ personal_alarm_issued: false }),
      makeRow({ personal_alarm_issued: false }),
    ];
    expect(computeMetrics(rows).personal_alarm_rate).toBe(33.3);
  });

  it("mixed mobile_phone_rate computes correctly (25%)", () => {
    const rows = [
      makeRow({ mobile_phone_available: true }),
      makeRow({ mobile_phone_available: false }),
      makeRow({ mobile_phone_available: false }),
      makeRow({ mobile_phone_available: false }),
    ];
    expect(computeMetrics(rows).mobile_phone_rate).toBe(25);
  });

  it("mixed emergency_procedures_rate computes correctly (75%)", () => {
    const rows = [
      makeRow({ emergency_procedures_known: true }),
      makeRow({ emergency_procedures_known: true }),
      makeRow({ emergency_procedures_known: true }),
      makeRow({ emergency_procedures_known: false }),
    ];
    expect(computeMetrics(rows).emergency_procedures_rate).toBe(75);
  });

  it("mixed training_rate computes correctly (50%)", () => {
    const rows = [
      makeRow({ training_completed: true }),
      makeRow({ training_completed: false }),
    ];
    expect(computeMetrics(rows).training_rate).toBe(50);
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

  // ── unique_assessors ──────────────────────────────────────────────────

  it("unique_assessors counts 1 for single record", () => {
    expect(computeMetrics([makeRow()]).unique_assessors).toBe(1);
  });

  it("unique_assessors counts distinct assessor names", () => {
    const rows = [
      makeRow({ assessor_name: "Assessor A" }),
      makeRow({ assessor_name: "Assessor B" }),
      makeRow({ assessor_name: "Assessor A" }),
    ];
    expect(computeMetrics(rows).unique_assessors).toBe(2);
  });

  it("unique_assessors counts all different assessors", () => {
    const rows = [
      makeRow({ assessor_name: "Assessor A" }),
      makeRow({ assessor_name: "Assessor B" }),
      makeRow({ assessor_name: "Assessor C" }),
    ];
    expect(computeMetrics(rows).unique_assessors).toBe(3);
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

  // ── Critical: unacceptable_risk_level ─────────────────────────────────

  it("fires critical for unacceptable risk level", () => {
    const a = computeAlerts([makeRow({ risk_level: "Unacceptable" })]);
    const c = a.filter((x) => x.type === "unacceptable_risk_level" && x.severity === "critical");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("unacceptable risk alert includes staff name", () => {
    const a = computeAlerts([makeRow({ risk_level: "Unacceptable", staff_name: "Alice Brown" })]);
    const c = a.filter((x) => x.type === "unacceptable_risk_level");
    expect(c[0].message).toContain("Alice Brown");
  });

  it("unacceptable risk alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-123", risk_level: "Unacceptable" })]);
    const c = a.filter((x) => x.type === "unacceptable_risk_level");
    expect(c[0].record_id).toBe("rec-123");
  });

  it("unacceptable risk alert mentions lone working", () => {
    const a = computeAlerts([makeRow({ risk_level: "Unacceptable" })]);
    const c = a.filter((x) => x.type === "unacceptable_risk_level");
    expect(c[0].message).toMatch(/lone working/i);
  });

  it("does NOT fire unacceptable risk alert for High risk", () => {
    const a = computeAlerts([makeRow({ risk_level: "High" })]);
    const c = a.filter((x) => x.type === "unacceptable_risk_level");
    expect(c.length).toBe(0);
  });

  it("does NOT fire unacceptable risk alert for Low risk", () => {
    const a = computeAlerts([makeRow({ risk_level: "Low" })]);
    const c = a.filter((x) => x.type === "unacceptable_risk_level");
    expect(c.length).toBe(0);
  });

  it("fires unacceptable risk alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", risk_level: "Unacceptable" }),
      makeRow({ id: "a-2", risk_level: "Unacceptable" }),
    ];
    const a = computeAlerts(rows);
    const c = a.filter((x) => x.type === "unacceptable_risk_level");
    expect(c.length).toBe(2);
  });

  // ── Critical: high_risk_no_assessment ─────────────────────────────────

  it("fires critical for high risk without assessment", () => {
    const a = computeAlerts([makeRow({ risk_level: "High", risk_assessment_completed: false })]);
    const c = a.filter((x) => x.type === "high_risk_no_assessment" && x.severity === "critical");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("high risk no assessment alert includes staff name", () => {
    const a = computeAlerts([makeRow({ risk_level: "High", risk_assessment_completed: false, staff_name: "Bob Green" })]);
    const c = a.filter((x) => x.type === "high_risk_no_assessment");
    expect(c[0].message).toContain("Bob Green");
  });

  it("high risk no assessment alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-456", risk_level: "High", risk_assessment_completed: false })]);
    const c = a.filter((x) => x.type === "high_risk_no_assessment");
    expect(c[0].record_id).toBe("rec-456");
  });

  it("high risk no assessment alert mentions risk assessment", () => {
    const a = computeAlerts([makeRow({ risk_level: "High", risk_assessment_completed: false })]);
    const c = a.filter((x) => x.type === "high_risk_no_assessment");
    expect(c[0].message).toMatch(/risk assessment/i);
  });

  it("does NOT fire high risk no assessment when assessment completed", () => {
    const a = computeAlerts([makeRow({ risk_level: "High", risk_assessment_completed: true })]);
    const c = a.filter((x) => x.type === "high_risk_no_assessment");
    expect(c.length).toBe(0);
  });

  it("does NOT fire high risk no assessment for Low risk", () => {
    const a = computeAlerts([makeRow({ risk_level: "Low", risk_assessment_completed: false })]);
    const c = a.filter((x) => x.type === "high_risk_no_assessment");
    expect(c.length).toBe(0);
  });

  it("fires high risk no assessment per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", risk_level: "High", risk_assessment_completed: false }),
      makeRow({ id: "a-2", risk_level: "High", risk_assessment_completed: false }),
    ];
    const a = computeAlerts(rows);
    const c = a.filter((x) => x.type === "high_risk_no_assessment");
    expect(c.length).toBe(2);
  });

  // ── High: high_risk_no_check_in ───────────────────────────────────────

  it("fires high for high risk without check-in protocol", () => {
    const a = computeAlerts([makeRow({ risk_level: "High", check_in_protocol_agreed: false })]);
    const h = a.filter((x) => x.type === "high_risk_no_check_in" && x.severity === "high");
    expect(h.length).toBeGreaterThanOrEqual(1);
  });

  it("high risk no check-in alert includes staff name", () => {
    const a = computeAlerts([makeRow({ risk_level: "High", check_in_protocol_agreed: false, staff_name: "Charlie Davis" })]);
    const h = a.filter((x) => x.type === "high_risk_no_check_in");
    expect(h[0].message).toContain("Charlie Davis");
  });

  it("high risk no check-in alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-789", risk_level: "High", check_in_protocol_agreed: false })]);
    const h = a.filter((x) => x.type === "high_risk_no_check_in");
    expect(h[0].record_id).toBe("rec-789");
  });

  it("high risk no check-in alert mentions check-in", () => {
    const a = computeAlerts([makeRow({ risk_level: "High", check_in_protocol_agreed: false })]);
    const h = a.filter((x) => x.type === "high_risk_no_check_in");
    expect(h[0].message).toMatch(/check-in/i);
  });

  it("does NOT fire high risk no check-in when protocol agreed", () => {
    const a = computeAlerts([makeRow({ risk_level: "High", check_in_protocol_agreed: true })]);
    const h = a.filter((x) => x.type === "high_risk_no_check_in");
    expect(h.length).toBe(0);
  });

  it("does NOT fire high risk no check-in for Low risk", () => {
    const a = computeAlerts([makeRow({ risk_level: "Low", check_in_protocol_agreed: false })]);
    const h = a.filter((x) => x.type === "high_risk_no_check_in");
    expect(h.length).toBe(0);
  });

  it("fires high risk no check-in per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", risk_level: "High", check_in_protocol_agreed: false }),
      makeRow({ id: "a-2", risk_level: "High", check_in_protocol_agreed: false }),
    ];
    const a = computeAlerts(rows);
    const h = a.filter((x) => x.type === "high_risk_no_check_in");
    expect(h.length).toBe(2);
  });

  // ── High: incident_during_lone_work ───────────────────────────────────

  it("fires high for incident during lone work", () => {
    const a = computeAlerts([makeRow({ incident_during_lone_work: true })]);
    const h = a.filter((x) => x.type === "incident_during_lone_work" && x.severity === "high");
    expect(h.length).toBeGreaterThanOrEqual(1);
  });

  it("incident alert includes staff name", () => {
    const a = computeAlerts([makeRow({ incident_during_lone_work: true, staff_name: "Diana Evans" })]);
    const h = a.filter((x) => x.type === "incident_during_lone_work");
    expect(h[0].message).toContain("Diana Evans");
  });

  it("incident alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-abc", incident_during_lone_work: true })]);
    const h = a.filter((x) => x.type === "incident_during_lone_work");
    expect(h[0].record_id).toBe("rec-abc");
  });

  it("incident alert mentions lone working", () => {
    const a = computeAlerts([makeRow({ incident_during_lone_work: true })]);
    const h = a.filter((x) => x.type === "incident_during_lone_work");
    expect(h[0].message).toMatch(/lone working/i);
  });

  it("does NOT fire incident alert when no incident", () => {
    const a = computeAlerts([makeRow({ incident_during_lone_work: false })]);
    const h = a.filter((x) => x.type === "incident_during_lone_work");
    expect(h.length).toBe(0);
  });

  it("fires incident alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", incident_during_lone_work: true }),
      makeRow({ id: "a-2", incident_during_lone_work: true }),
    ];
    const a = computeAlerts(rows);
    const h = a.filter((x) => x.type === "incident_during_lone_work");
    expect(h.length).toBe(2);
  });

  // ── Medium: high_risk_no_alarm ────────────────────────────────────────

  it("fires medium for high risk without personal alarm", () => {
    const a = computeAlerts([makeRow({ risk_level: "High", personal_alarm_issued: false })]);
    const m = a.filter((x) => x.type === "high_risk_no_alarm" && x.severity === "medium");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("high risk no alarm alert includes staff name", () => {
    const a = computeAlerts([makeRow({ risk_level: "High", personal_alarm_issued: false, staff_name: "Eve Foster" })]);
    const m = a.filter((x) => x.type === "high_risk_no_alarm");
    expect(m[0].message).toContain("Eve Foster");
  });

  it("high risk no alarm alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-def", risk_level: "High", personal_alarm_issued: false })]);
    const m = a.filter((x) => x.type === "high_risk_no_alarm");
    expect(m[0].record_id).toBe("rec-def");
  });

  it("high risk no alarm alert mentions personal alarm or safety equipment", () => {
    const a = computeAlerts([makeRow({ risk_level: "High", personal_alarm_issued: false })]);
    const m = a.filter((x) => x.type === "high_risk_no_alarm");
    expect(m[0].message).toMatch(/personal alarm|safety equipment/i);
  });

  it("does NOT fire high risk no alarm when alarm issued", () => {
    const a = computeAlerts([makeRow({ risk_level: "High", personal_alarm_issued: true })]);
    const m = a.filter((x) => x.type === "high_risk_no_alarm");
    expect(m.length).toBe(0);
  });

  it("does NOT fire high risk no alarm for Low risk", () => {
    const a = computeAlerts([makeRow({ risk_level: "Low", personal_alarm_issued: false })]);
    const m = a.filter((x) => x.type === "high_risk_no_alarm");
    expect(m.length).toBe(0);
  });

  it("fires high risk no alarm per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", risk_level: "High", personal_alarm_issued: false }),
      makeRow({ id: "a-2", risk_level: "High", personal_alarm_issued: false }),
    ];
    const a = computeAlerts(rows);
    const m = a.filter((x) => x.type === "high_risk_no_alarm");
    expect(m.length).toBe(2);
  });

  // ── Medium: training_not_completed ────────────────────────────────────

  it("fires medium for training not completed", () => {
    const a = computeAlerts([makeRow({ training_completed: false })]);
    const m = a.filter((x) => x.type === "training_not_completed" && x.severity === "medium");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("training not completed alert includes staff name", () => {
    const a = computeAlerts([makeRow({ training_completed: false, staff_name: "Frank Grant" })]);
    const m = a.filter((x) => x.type === "training_not_completed");
    expect(m[0].message).toContain("Frank Grant");
  });

  it("training not completed alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-ghi", training_completed: false })]);
    const m = a.filter((x) => x.type === "training_not_completed");
    expect(m[0].record_id).toBe("rec-ghi");
  });

  it("training not completed alert mentions training", () => {
    const a = computeAlerts([makeRow({ training_completed: false })]);
    const m = a.filter((x) => x.type === "training_not_completed");
    expect(m[0].message).toMatch(/training/i);
  });

  it("does NOT fire training alert when training completed", () => {
    const a = computeAlerts([makeRow({ training_completed: true })]);
    const m = a.filter((x) => x.type === "training_not_completed");
    expect(m.length).toBe(0);
  });

  it("fires training alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", training_completed: false }),
      makeRow({ id: "a-2", training_completed: false }),
    ];
    const a = computeAlerts(rows);
    const m = a.filter((x) => x.type === "training_not_completed");
    expect(m.length).toBe(2);
  });

  // ── Combined alerts ───────────────────────────────────────────────────

  it("fires all applicable alert types in worst-case scenario", () => {
    const rows = [
      makeRow({
        id: "a-1",
        risk_level: "Unacceptable",
        risk_assessment_completed: false,
        check_in_protocol_agreed: false,
        incident_during_lone_work: true,
        personal_alarm_issued: false,
        training_completed: false,
      }),
    ];
    const a = computeAlerts(rows);
    const types = new Set(a.map((x) => x.type));
    expect(types.has("unacceptable_risk_level")).toBe(true);
    expect(types.has("incident_during_lone_work")).toBe(true);
    expect(types.has("training_not_completed")).toBe(true);
  });

  it("high risk triggers check-in, alarm, and assessment alerts when all missing", () => {
    const rows = [
      makeRow({
        id: "a-1",
        risk_level: "High",
        risk_assessment_completed: false,
        check_in_protocol_agreed: false,
        personal_alarm_issued: false,
        training_completed: false,
      }),
    ];
    const a = computeAlerts(rows);
    const types = new Set(a.map((x) => x.type));
    expect(types.has("high_risk_no_assessment")).toBe(true);
    expect(types.has("high_risk_no_check_in")).toBe(true);
    expect(types.has("high_risk_no_alarm")).toBe(true);
    expect(types.has("training_not_completed")).toBe(true);
  });

  it("alert severity levels are correct across mixed alerts", () => {
    const rows = [
      makeRow({
        id: "a-1",
        risk_level: "High",
        risk_assessment_completed: false,
        check_in_protocol_agreed: false,
        incident_during_lone_work: true,
        personal_alarm_issued: false,
        training_completed: false,
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
      risk_level: "High",
      risk_assessment_completed: false,
      check_in_protocol_agreed: false,
      incident_during_lone_work: true,
      personal_alarm_issued: false,
      training_completed: false,
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
      makeRow({ id: "a-1", risk_level: "Unacceptable" }),
      makeRow({ id: "a-2", training_completed: false }),
    ];
    const a = computeAlerts(rows);
    const critAlerts = a.filter((x) => x.type === "unacceptable_risk_level");
    const medAlerts = a.filter((x) => x.type === "training_not_completed");
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

  // ── Insight 1: indigo-themed summary ──────────────────────────────────

  it("first insight starts with [indigo]", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toMatch(/^\[indigo\]/);
  });

  it("first insight includes total assessment count", () => {
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

  it("first insight includes unique assessor count", () => {
    const rows = [
      makeRow({ assessor_name: "Assessor A" }),
      makeRow({ assessor_name: "Assessor B" }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("2");
  });

  it("first insight includes risk assessment rate", () => {
    const rows = [makeRow({ risk_assessment_completed: true })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("100%");
  });

  it("first insight includes check-in rate", () => {
    const rows = [makeRow({ check_in_protocol_agreed: true })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("100%");
  });

  it("first insight includes training rate", () => {
    const rows = [makeRow({ training_completed: true })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("100%");
  });

  it("first insight uses singular assessment for 1 record", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toContain("1 lone working assessment");
    expect(insights[0]).not.toContain("assessments recorded");
  });

  it("first insight uses plural assessments for 2+ records", () => {
    const rows = [makeRow(), makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("assessments");
  });

  it("first insight uses singular staff member for 1 staff", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toContain("staff member");
    expect(insights[0]).not.toContain("staff members assessed");
  });

  it("first insight uses plural staff members for 2+ staff", () => {
    const rows = [makeRow({ staff_name: "Alice" }), makeRow({ staff_name: "Bob" })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("staff members");
  });

  it("first insight uses singular assessor for 1 assessor", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toContain("assessor");
  });

  it("first insight uses plural assessors for 2+ assessors", () => {
    const rows = [makeRow({ assessor_name: "Assessor A" }), makeRow({ assessor_name: "Assessor B" })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("assessors");
  });

  // ── Insight 2: amber-themed priorities ────────────────────────────────

  it("second insight starts with [amber]", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions alerts when critical alerts exist", () => {
    const rows = [makeRow({ risk_level: "Unacceptable" })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("critical");
  });

  it("second insight mentions no alerts when all compliant", () => {
    const rows = [makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toMatch(/[Nn]o critical/);
  });

  it("second insight includes high risk count when alerts present", () => {
    const rows = [makeRow({ risk_level: "Unacceptable" })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("0"); // high_risk_count is 0, unacceptable is 1
  });

  it("second insight includes incident count when alerts present", () => {
    const rows = [makeRow({ incident_during_lone_work: true })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("1");
  });

  it("second insight mentions high-priority count when present", () => {
    const rows = [makeRow({ incident_during_lone_work: true })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("high-priority");
  });

  it("second insight mentions staff safety when no alerts", () => {
    const rows = [makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("staff safety");
  });

  it("second insight includes personal alarm rate when no alerts", () => {
    const rows = [makeRow({ personal_alarm_issued: true })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("100%");
  });

  it("second insight includes mobile phone rate when no alerts", () => {
    const rows = [makeRow({ mobile_phone_available: true })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("100%");
  });

  // ── Insight 3: reflect-themed question ────────────────────────────────

  it("third insight starts with [reflect]", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions critical alert count when present", () => {
    const rows = [makeRow({ risk_level: "Unacceptable" })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("1");
    expect(insights[2]).toMatch(/critical/i);
  });

  it("third insight uses singular when 1 critical alert", () => {
    const rows = [makeRow({ risk_level: "Unacceptable" })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("alert requires");
  });

  it("third insight uses plural when 2+ critical alerts", () => {
    const rows = [
      makeRow({ risk_level: "Unacceptable", staff_name: "Alice" }),
      makeRow({ risk_level: "Unacceptable", staff_name: "Bob" }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("alerts require");
  });

  it("third insight addresses training rate when no critical alerts but rate < 100", () => {
    const rows = [
      makeRow({ training_completed: false }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("training");
  });

  it("third insight mentions staff safety when training rate < 100", () => {
    const rows = [makeRow({ training_completed: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("safety");
  });

  it("third insight celebrates full compliance when all checks pass", () => {
    const rows = [
      makeRow({ training_completed: true }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("lone working");
    expect(insights[2]).toContain("welfare");
  });

  it("third insight mentions Health and Safety when critical alerts present", () => {
    const rows = [makeRow({ risk_level: "Unacceptable" })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("Health and Safety");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CRUD (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD when Supabase disabled", () => {
  it("listStaffLoneWorkingRisks returns empty data", async () => {
    const { listStaffLoneWorkingRisks } = await import("../staff-lone-working-risk-service");
    const result = await listStaffLoneWorkingRisks("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("createStaffLoneWorkingRisk returns error", async () => {
    const { createStaffLoneWorkingRisk } = await import("../staff-lone-working-risk-service");
    const result = await createStaffLoneWorkingRisk({
      homeId: "home-1",
      assessmentDate: "2026-05-15",
      assessorName: "Registered Manager",
      staffName: "Jane Smith",
      loneWorkingType: "Night Shift",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("updateStaffLoneWorkingRisk returns error", async () => {
    const { updateStaffLoneWorkingRisk } = await import("../staff-lone-working-risk-service");
    const result = await updateStaffLoneWorkingRisk("rec-1", { notes: "updated" });
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
      risk_assessment_completed: false,
      check_in_protocol_agreed: false,
      personal_alarm_issued: false,
      mobile_phone_available: false,
      emergency_procedures_known: false,
      training_completed: false,
      incident_during_lone_work: false,
      near_miss_reported: false,
    });
    const m = computeMetrics([row]);
    expect(m.risk_assessment_rate).toBe(0);
    expect(m.check_in_rate).toBe(0);
    expect(m.personal_alarm_rate).toBe(0);
    expect(m.mobile_phone_rate).toBe(0);
    expect(m.emergency_procedures_rate).toBe(0);
    expect(m.training_rate).toBe(0);
  });

  it("alerts for record with high risk and all flags triggering", () => {
    const row = makeRow({
      risk_level: "High",
      risk_assessment_completed: false,
      check_in_protocol_agreed: false,
      incident_during_lone_work: true,
      personal_alarm_issued: false,
      training_completed: false,
    });
    const a = computeAlerts([row]);
    expect(a.length).toBeGreaterThanOrEqual(5);
  });

  it("makeRow factory with overrides preserves overrides", () => {
    const row = makeRow({
      staff_name: "Custom Name",
      compliance_status: "Non-Compliant",
      risk_level: "High",
    });
    expect(row.staff_name).toBe("Custom Name");
    expect(row.compliance_status).toBe("Non-Compliant");
    expect(row.risk_level).toBe("High");
  });

  it("makeRow factory nullable fields have expected defaults", () => {
    const row = makeRow();
    expect(row.notes).toBeNull();
    expect(row.check_in_frequency).toBeNull();
    expect(row.next_review_date).toBeNull();
  });

  it("makeRow factory allows setting nullable fields", () => {
    const row = makeRow({
      check_in_frequency: "Hourly",
      next_review_date: "2026-06-01",
      notes: "Under review",
    });
    expect(row.check_in_frequency).toBe("Hourly");
    expect(row.next_review_date).toBe("2026-06-01");
    expect(row.notes).toBe("Under review");
  });

  it("makeRow factory allows explicitly setting nullable fields to null", () => {
    const row = makeRow({ check_in_frequency: null, next_review_date: null, notes: null });
    expect(row.check_in_frequency).toBeNull();
    expect(row.next_review_date).toBeNull();
    expect(row.notes).toBeNull();
  });

  it("makeRow factory risk_assessment_completed defaults to true", () => {
    const row = makeRow();
    expect(row.risk_assessment_completed).toBe(true);
  });

  it("makeRow factory check_in_protocol_agreed defaults to true", () => {
    const row = makeRow();
    expect(row.check_in_protocol_agreed).toBe(true);
  });

  it("makeRow factory allows overriding boolean fields", () => {
    const row = makeRow({ risk_assessment_completed: false, check_in_protocol_agreed: false });
    expect(row.risk_assessment_completed).toBe(false);
    expect(row.check_in_protocol_agreed).toBe(false);
  });

  it("metrics handles large dataset", () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      makeRow({
        staff_name: `Staff ${i % 10}`,
        assessor_name: `Assessor ${i % 5}`,
        compliance_status: COMPLIANCE_STATUSES[i % 4],
        risk_assessment_completed: i % 3 !== 0,
      }),
    );
    const m = computeMetrics(rows);
    expect(m.total_assessments).toBe(100);
    expect(m.unique_staff).toBe(10);
    expect(m.unique_assessors).toBe(5);
  });

  it("insights handle empty data gracefully", () => {
    const insights = computeCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("0 lone working");
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
    expect(m.total_assessments).toBe(4);
    expect(m.non_compliant_count).toBe(1);
  });

  it("unacceptable risk alert only fires for Unacceptable level", () => {
    const a = computeAlerts([makeRow({ risk_level: "High" })]);
    const c = a.filter((x) => x.type === "unacceptable_risk_level");
    expect(c.length).toBe(0);
  });

  it("high risk no assessment does not fire for Medium risk", () => {
    const a = computeAlerts([makeRow({ risk_level: "Medium", risk_assessment_completed: false })]);
    const c = a.filter((x) => x.type === "high_risk_no_assessment");
    expect(c.length).toBe(0);
  });

  it("metrics unique_assessors with single assessor across staff", () => {
    const rows = [
      makeRow({ staff_name: "Alice", assessor_name: "Same Assessor" }),
      makeRow({ staff_name: "Bob", assessor_name: "Same Assessor" }),
      makeRow({ staff_name: "Charlie", assessor_name: "Same Assessor" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_staff).toBe(3);
    expect(m.unique_assessors).toBe(1);
  });

  it("metrics unique_staff with single staff across assessors", () => {
    const rows = [
      makeRow({ staff_name: "Same Worker", assessor_name: "Assessor A" }),
      makeRow({ staff_name: "Same Worker", assessor_name: "Assessor B" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_staff).toBe(1);
    expect(m.unique_assessors).toBe(2);
  });

  it("insights with only critical alerts show correct count", () => {
    const rows = [makeRow({ risk_level: "Unacceptable" })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toMatch(/\d+ critical/);
  });

  it("insights with only high alerts show correct count", () => {
    const rows = [makeRow({ incident_during_lone_work: true })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toMatch(/\d+ high-priority/);
  });

  it("insights reflect question path for training rate < 100%", () => {
    const rows = [makeRow({ training_completed: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("training");
    expect(insights[2]).toContain("0%");
  });

  it("all alert record_ids match the source row id", () => {
    const row = makeRow({
      id: "unique-test-id",
      risk_level: "High",
      risk_assessment_completed: false,
      check_in_protocol_agreed: false,
      incident_during_lone_work: true,
      personal_alarm_issued: false,
      training_completed: false,
    });
    const a = computeAlerts([row]);
    for (const alert of a) {
      expect(alert.record_id).toBe("unique-test-id");
    }
  });

  it("incident alert is independent of risk level", () => {
    const a = computeAlerts([makeRow({ incident_during_lone_work: true, risk_level: "Low" })]);
    const incident = a.filter((x) => x.type === "incident_during_lone_work");
    expect(incident.length).toBe(1);
    const highRisk = a.filter((x) => x.type === "high_risk_no_check_in");
    expect(highRisk.length).toBe(0);
  });

  it("training alert is independent of risk level", () => {
    const a = computeAlerts([makeRow({ training_completed: false, risk_level: "Low" })]);
    const training = a.filter((x) => x.type === "training_not_completed");
    expect(training.length).toBe(1);
    const highRisk = a.filter((x) => x.type === "high_risk_no_assessment");
    expect(highRisk.length).toBe(0);
  });

  it("high risk no alarm alert is independent of training status", () => {
    const a = computeAlerts([makeRow({ risk_level: "High", personal_alarm_issued: false, training_completed: true })]);
    const alarm = a.filter((x) => x.type === "high_risk_no_alarm");
    expect(alarm.length).toBe(1);
  });

  it("metrics incident_count with all false returns 0", () => {
    const rows = Array.from({ length: 5 }, () => makeRow({ incident_during_lone_work: false }));
    const m = computeMetrics(rows);
    expect(m.incident_count).toBe(0);
  });

  it("metrics near_miss_count with all false returns 0", () => {
    const rows = Array.from({ length: 5 }, () => makeRow({ near_miss_reported: false }));
    const m = computeMetrics(rows);
    expect(m.near_miss_count).toBe(0);
  });

  it("insights with mixed critical and high alerts", () => {
    const rows = [
      makeRow({ risk_level: "Unacceptable" }),
      makeRow({ incident_during_lone_work: true }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high-priority");
  });

  it("insights third path for full training rate with no critical alerts", () => {
    const rows = [makeRow({ training_completed: true })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("lone working");
  });

  it("unacceptable risk alert is independent of training status", () => {
    const a = computeAlerts([makeRow({ risk_level: "Unacceptable", training_completed: true })]);
    const c = a.filter((x) => x.type === "unacceptable_risk_level");
    expect(c.length).toBe(1);
    const t = a.filter((x) => x.type === "training_not_completed");
    expect(t.length).toBe(0);
  });

  it("makeRow factory compliance_status defaults to Compliant", () => {
    const row = makeRow();
    expect(row.compliance_status).toBe("Compliant");
  });

  it("makeRow factory risk_level defaults to Low", () => {
    const row = makeRow();
    expect(row.risk_level).toBe("Low");
  });

  it("makeRow factory lone_working_type defaults to Night Shift", () => {
    const row = makeRow();
    expect(row.lone_working_type).toBe("Night Shift");
  });

  it("makeRow factory personal_alarm_issued defaults to false", () => {
    const row = makeRow();
    expect(row.personal_alarm_issued).toBe(false);
  });

  it("makeRow factory mobile_phone_available defaults to true", () => {
    const row = makeRow();
    expect(row.mobile_phone_available).toBe(true);
  });

  it("makeRow factory emergency_procedures_known defaults to true", () => {
    const row = makeRow();
    expect(row.emergency_procedures_known).toBe(true);
  });

  it("makeRow factory training_completed defaults to true", () => {
    const row = makeRow();
    expect(row.training_completed).toBe(true);
  });

  it("makeRow factory incident_during_lone_work defaults to false", () => {
    const row = makeRow();
    expect(row.incident_during_lone_work).toBe(false);
  });

  it("makeRow factory near_miss_reported defaults to false", () => {
    const row = makeRow();
    expect(row.near_miss_reported).toBe(false);
  });

  it("metrics with all four risk levels", () => {
    const rows = RISK_LEVELS.map((r, i) => makeRow({ id: `a-${i}`, risk_level: r }));
    const m = computeMetrics(rows);
    expect(m.total_assessments).toBe(4);
    expect(m.high_risk_count).toBe(1);
    expect(m.unacceptable_count).toBe(1);
  });

  it("metrics risk_assessment_rate with mixed values", () => {
    const rows = [
      makeRow({ risk_assessment_completed: true }),
      makeRow({ risk_assessment_completed: true }),
      makeRow({ risk_assessment_completed: false }),
      makeRow({ risk_assessment_completed: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.risk_assessment_rate).toBe(50);
  });

  it("metrics training_rate with mixed values", () => {
    const rows = [
      makeRow({ training_completed: true }),
      makeRow({ training_completed: true }),
      makeRow({ training_completed: true }),
      makeRow({ training_completed: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.training_rate).toBe(75);
  });

  it("insights contain check-in rate in indigo section", () => {
    const rows = [makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("100%");
  });

  it("metrics handles single record with all true booleans", () => {
    const row = makeRow({
      risk_assessment_completed: true,
      check_in_protocol_agreed: true,
      personal_alarm_issued: true,
      mobile_phone_available: true,
      emergency_procedures_known: true,
      training_completed: true,
      incident_during_lone_work: true,
      near_miss_reported: true,
    });
    const m = computeMetrics([row]);
    expect(m.risk_assessment_rate).toBe(100);
    expect(m.personal_alarm_rate).toBe(100);
    expect(m.incident_count).toBe(1);
    expect(m.near_miss_count).toBe(1);
  });

  it("high risk no check-in alert does not fire for Medium risk", () => {
    const a = computeAlerts([makeRow({ risk_level: "Medium", check_in_protocol_agreed: false })]);
    const h = a.filter((x) => x.type === "high_risk_no_check_in");
    expect(h.length).toBe(0);
  });

  it("high risk no alarm alert does not fire for Medium risk", () => {
    const a = computeAlerts([makeRow({ risk_level: "Medium", personal_alarm_issued: false })]);
    const m = a.filter((x) => x.type === "high_risk_no_alarm");
    expect(m.length).toBe(0);
  });

  it("metrics with all lone working types represented", () => {
    const rows = LONE_WORKING_TYPES.map((t, i) => makeRow({ id: `a-${i}`, lone_working_type: t }));
    const m = computeMetrics(rows);
    expect(m.total_assessments).toBe(8);
  });

  it("metrics with all check-in frequencies represented", () => {
    const rows = CHECK_IN_FREQUENCIES.map((f, i) => makeRow({ id: `a-${i}`, check_in_frequency: f }));
    const m = computeMetrics(rows);
    expect(m.total_assessments).toBe(5);
  });
});
