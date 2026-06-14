// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF WHISTLEBLOWING MANAGEMENT SERVICE TESTS
// Pure-function unit tests for whistleblowing disclosure metrics, alert
// identification, and Cara insight generation.
//
// Public Interest Disclosure Act 1998 — whistleblower protection obligations.
// CHR 2015 Reg 34 (employment practices — encouraging and protecting disclosures).
// Safeguarding Vulnerable Groups Act 2006 — duty to report concerns.
//
// Covers: Disclosure types, investigation tracking, whistleblower protection,
// anonymity, detriment monitoring, regulator notification, compliance status.
//
// SCCIF: Leadership & Management — "Effective whistleblowing procedures ensure
// staff feel safe to raise concerns about practice, safeguarding, or misconduct."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  type StaffWhistleblowingDisclosureRow,
  DISCLOSURE_TYPES,
  DISCLOSURE_METHODS,
  INVESTIGATION_OUTCOMES,
  COMPLIANCE_STATUSES,
} from "../staff-whistleblowing-management-service";

const { computeMetrics, computeAlerts, computeCaraInsights } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(overrides?: Partial<StaffWhistleblowingDisclosureRow>): StaffWhistleblowingDisclosureRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    disclosure_date: "disclosure_date" in (overrides ?? {}) ? overrides!.disclosure_date! : now.toISOString().split("T")[0],
    handler_name: "handler_name" in (overrides ?? {}) ? overrides!.handler_name! : "Safeguarding Lead",
    discloser_name: "discloser_name" in (overrides ?? {}) ? overrides!.discloser_name! : "Jane Smith",
    disclosure_type: "disclosure_type" in (overrides ?? {}) ? overrides!.disclosure_type! : "Safeguarding Concern",
    disclosure_method: "disclosure_method" in (overrides ?? {}) ? overrides!.disclosure_method! : "Internal",
    investigation_opened: "investigation_opened" in (overrides ?? {}) ? overrides!.investigation_opened! : true,
    investigation_outcome: "investigation_outcome" in (overrides ?? {}) ? (overrides!.investigation_outcome ?? null) : "Substantiated",
    action_taken: "action_taken" in (overrides ?? {}) ? overrides!.action_taken! : true,
    whistleblower_protected: "whistleblower_protected" in (overrides ?? {}) ? overrides!.whistleblower_protected! : true,
    anonymity_maintained: "anonymity_maintained" in (overrides ?? {}) ? overrides!.anonymity_maintained! : true,
    detriment_reported: "detriment_reported" in (overrides ?? {}) ? overrides!.detriment_reported! : false,
    feedback_provided: "feedback_provided" in (overrides ?? {}) ? overrides!.feedback_provided! : true,
    regulator_notified: "regulator_notified" in (overrides ?? {}) ? overrides!.regulator_notified! : true,
    compliance_status: "compliance_status" in (overrides ?? {}) ? overrides!.compliance_status! : "Closed",
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
  // ── DISCLOSURE_TYPES ───────────────────────────────────────────────────
  it("DISCLOSURE_TYPES has 9 entries", () => {
    expect(DISCLOSURE_TYPES).toHaveLength(9);
  });

  it("DISCLOSURE_TYPES includes Safeguarding Concern", () => {
    expect(DISCLOSURE_TYPES).toContain("Safeguarding Concern");
  });

  it("DISCLOSURE_TYPES includes Criminal Offence", () => {
    expect(DISCLOSURE_TYPES).toContain("Criminal Offence");
  });

  it("DISCLOSURE_TYPES includes Health & Safety", () => {
    expect(DISCLOSURE_TYPES).toContain("Health & Safety");
  });

  it("DISCLOSURE_TYPES includes Environmental Damage", () => {
    expect(DISCLOSURE_TYPES).toContain("Environmental Damage");
  });

  it("DISCLOSURE_TYPES includes Miscarriage of Justice", () => {
    expect(DISCLOSURE_TYPES).toContain("Miscarriage of Justice");
  });

  it("DISCLOSURE_TYPES includes Regulatory Breach", () => {
    expect(DISCLOSURE_TYPES).toContain("Regulatory Breach");
  });

  it("DISCLOSURE_TYPES includes Financial Misconduct", () => {
    expect(DISCLOSURE_TYPES).toContain("Financial Misconduct");
  });

  it("DISCLOSURE_TYPES includes Cover-Up", () => {
    expect(DISCLOSURE_TYPES).toContain("Cover-Up");
  });

  it("DISCLOSURE_TYPES includes Other", () => {
    expect(DISCLOSURE_TYPES).toContain("Other");
  });

  it("DISCLOSURE_TYPES has unique values", () => {
    expect(new Set(DISCLOSURE_TYPES).size).toBe(DISCLOSURE_TYPES.length);
  });

  // ── DISCLOSURE_METHODS ─────────────────────────────────────────────────
  it("DISCLOSURE_METHODS has 7 entries", () => {
    expect(DISCLOSURE_METHODS).toHaveLength(7);
  });

  it("DISCLOSURE_METHODS includes Internal", () => {
    expect(DISCLOSURE_METHODS).toContain("Internal");
  });

  it("DISCLOSURE_METHODS includes External Regulator", () => {
    expect(DISCLOSURE_METHODS).toContain("External Regulator");
  });

  it("DISCLOSURE_METHODS includes Police", () => {
    expect(DISCLOSURE_METHODS).toContain("Police");
  });

  it("DISCLOSURE_METHODS includes CQC", () => {
    expect(DISCLOSURE_METHODS).toContain("CQC");
  });

  it("DISCLOSURE_METHODS includes Ofsted", () => {
    expect(DISCLOSURE_METHODS).toContain("Ofsted");
  });

  it("DISCLOSURE_METHODS includes Local Authority", () => {
    expect(DISCLOSURE_METHODS).toContain("Local Authority");
  });

  it("DISCLOSURE_METHODS includes Other", () => {
    expect(DISCLOSURE_METHODS).toContain("Other");
  });

  it("DISCLOSURE_METHODS has unique values", () => {
    expect(new Set(DISCLOSURE_METHODS).size).toBe(DISCLOSURE_METHODS.length);
  });

  // ── INVESTIGATION_OUTCOMES ─────────────────────────────────────────────
  it("INVESTIGATION_OUTCOMES has 5 entries", () => {
    expect(INVESTIGATION_OUTCOMES).toHaveLength(5);
  });

  it("INVESTIGATION_OUTCOMES includes Substantiated", () => {
    expect(INVESTIGATION_OUTCOMES).toContain("Substantiated");
  });

  it("INVESTIGATION_OUTCOMES includes Partially Substantiated", () => {
    expect(INVESTIGATION_OUTCOMES).toContain("Partially Substantiated");
  });

  it("INVESTIGATION_OUTCOMES includes Unsubstantiated", () => {
    expect(INVESTIGATION_OUTCOMES).toContain("Unsubstantiated");
  });

  it("INVESTIGATION_OUTCOMES includes Inconclusive", () => {
    expect(INVESTIGATION_OUTCOMES).toContain("Inconclusive");
  });

  it("INVESTIGATION_OUTCOMES includes Ongoing", () => {
    expect(INVESTIGATION_OUTCOMES).toContain("Ongoing");
  });

  it("INVESTIGATION_OUTCOMES has unique values", () => {
    expect(new Set(INVESTIGATION_OUTCOMES).size).toBe(INVESTIGATION_OUTCOMES.length);
  });

  // ── COMPLIANCE_STATUSES ────────────────────────────────────────────────
  it("COMPLIANCE_STATUSES has 4 entries", () => {
    expect(COMPLIANCE_STATUSES).toHaveLength(4);
  });

  it("COMPLIANCE_STATUSES includes Open", () => {
    expect(COMPLIANCE_STATUSES).toContain("Open");
  });

  it("COMPLIANCE_STATUSES includes Under Investigation", () => {
    expect(COMPLIANCE_STATUSES).toContain("Under Investigation");
  });

  it("COMPLIANCE_STATUSES includes Closed", () => {
    expect(COMPLIANCE_STATUSES).toContain("Closed");
  });

  it("COMPLIANCE_STATUSES includes Escalated", () => {
    expect(COMPLIANCE_STATUSES).toContain("Escalated");
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
    expect(m.total_disclosures).toBe(0);
    expect(m.open_count).toBe(0);
    expect(m.under_investigation_count).toBe(0);
    expect(m.closed_count).toBe(0);
    expect(m.escalated_count).toBe(0);
    expect(m.unique_disclosers).toBe(0);
    expect(m.unique_handlers).toBe(0);
  });

  it("returns 0 rates for empty array", () => {
    const m = computeMetrics([]);
    expect(m.investigation_opened_rate).toBe(0);
    expect(m.whistleblower_protected_rate).toBe(0);
    expect(m.anonymity_rate).toBe(0);
    expect(m.feedback_rate).toBe(0);
    expect(m.regulator_notified_rate).toBe(0);
    expect(m.action_taken_rate).toBe(0);
  });

  it("returns 0 counts for empty array", () => {
    const m = computeMetrics([]);
    expect(m.substantiated_count).toBe(0);
    expect(m.detriment_count).toBe(0);
  });

  // ── total_disclosures ──────────────────────────────────────────────────

  it("total_disclosures counts single record", () => {
    expect(computeMetrics([makeRow()]).total_disclosures).toBe(1);
  });

  it("total_disclosures counts multiple records", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    expect(computeMetrics(rows).total_disclosures).toBe(3);
  });

  it("total_disclosures counts 10 records", () => {
    const rows = Array.from({ length: 10 }, () => makeRow());
    expect(computeMetrics(rows).total_disclosures).toBe(10);
  });

  // ── Status counts ─────────────────────────────────────────────────────

  it("counts open", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Open" })]).open_count).toBe(1);
  });

  it("counts under investigation", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Under Investigation" })]).under_investigation_count).toBe(1);
  });

  it("counts closed", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Closed" })]).closed_count).toBe(1);
  });

  it("counts escalated", () => {
    expect(computeMetrics([makeRow({ compliance_status: "Escalated" })]).escalated_count).toBe(1);
  });

  it("does not count Open as closed", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Open" })]);
    expect(m.closed_count).toBe(0);
  });

  it("does not count Open as escalated", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Open" })]);
    expect(m.escalated_count).toBe(0);
  });

  it("does not count Closed as open", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Closed" })]);
    expect(m.open_count).toBe(0);
  });

  it("does not count Under Investigation as open", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Under Investigation" })]);
    expect(m.open_count).toBe(0);
  });

  it("does not count Escalated as under investigation", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Escalated" })]);
    expect(m.under_investigation_count).toBe(0);
  });

  it("does not count Closed as under investigation", () => {
    const m = computeMetrics([makeRow({ compliance_status: "Closed" })]);
    expect(m.under_investigation_count).toBe(0);
  });

  it("counts multiple open", () => {
    const rows = [
      makeRow({ compliance_status: "Open" }),
      makeRow({ compliance_status: "Open" }),
      makeRow({ compliance_status: "Closed" }),
    ];
    expect(computeMetrics(rows).open_count).toBe(2);
  });

  it("counts multiple escalated", () => {
    const rows = [
      makeRow({ compliance_status: "Escalated" }),
      makeRow({ compliance_status: "Escalated" }),
      makeRow({ compliance_status: "Escalated" }),
    ];
    expect(computeMetrics(rows).escalated_count).toBe(3);
  });

  // ── Boolean rates ─────────────────────────────────────────────────────

  it("returns 100% for default boolean rates when defaults are true", () => {
    const m = computeMetrics([makeRow()]);
    expect(m.investigation_opened_rate).toBe(100);
    expect(m.whistleblower_protected_rate).toBe(100);
    expect(m.anonymity_rate).toBe(100);
    expect(m.feedback_rate).toBe(100);
    expect(m.regulator_notified_rate).toBe(100);
    expect(m.action_taken_rate).toBe(100);
  });

  it("investigation_opened_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ investigation_opened: false })]).investigation_opened_rate).toBe(0);
  });

  it("whistleblower_protected_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ whistleblower_protected: false })]).whistleblower_protected_rate).toBe(0);
  });

  it("anonymity_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ anonymity_maintained: false })]).anonymity_rate).toBe(0);
  });

  it("feedback_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ feedback_provided: false })]).feedback_rate).toBe(0);
  });

  it("regulator_notified_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ regulator_notified: false })]).regulator_notified_rate).toBe(0);
  });

  it("action_taken_rate is 0 when false", () => {
    expect(computeMetrics([makeRow({ action_taken: false })]).action_taken_rate).toBe(0);
  });

  it("mixed investigation_opened_rate computes correctly (66.7%)", () => {
    const rows = [
      makeRow({ investigation_opened: true }),
      makeRow({ investigation_opened: true }),
      makeRow({ investigation_opened: false }),
    ];
    expect(computeMetrics(rows).investigation_opened_rate).toBe(66.7);
  });

  it("mixed whistleblower_protected_rate computes correctly (50%)", () => {
    const rows = [
      makeRow({ whistleblower_protected: true }),
      makeRow({ whistleblower_protected: false }),
    ];
    expect(computeMetrics(rows).whistleblower_protected_rate).toBe(50);
  });

  it("mixed anonymity_rate computes correctly (33.3%)", () => {
    const rows = [
      makeRow({ anonymity_maintained: true }),
      makeRow({ anonymity_maintained: false }),
      makeRow({ anonymity_maintained: false }),
    ];
    expect(computeMetrics(rows).anonymity_rate).toBe(33.3);
  });

  it("mixed feedback_rate computes correctly (25%)", () => {
    const rows = [
      makeRow({ feedback_provided: true }),
      makeRow({ feedback_provided: false }),
      makeRow({ feedback_provided: false }),
      makeRow({ feedback_provided: false }),
    ];
    expect(computeMetrics(rows).feedback_rate).toBe(25);
  });

  it("mixed regulator_notified_rate computes correctly (75%)", () => {
    const rows = [
      makeRow({ regulator_notified: true }),
      makeRow({ regulator_notified: true }),
      makeRow({ regulator_notified: true }),
      makeRow({ regulator_notified: false }),
    ];
    expect(computeMetrics(rows).regulator_notified_rate).toBe(75);
  });

  it("mixed action_taken_rate computes correctly (50%)", () => {
    const rows = [
      makeRow({ action_taken: true }),
      makeRow({ action_taken: false }),
    ];
    expect(computeMetrics(rows).action_taken_rate).toBe(50);
  });

  // ── substantiated_count ───────────────────────────────────────────────

  it("substantiated_count is 0 for empty array", () => {
    expect(computeMetrics([]).substantiated_count).toBe(0);
  });

  it("substantiated_count counts Substantiated outcomes", () => {
    const rows = [makeRow({ investigation_outcome: "Substantiated" })];
    expect(computeMetrics(rows).substantiated_count).toBe(1);
  });

  it("substantiated_count does not count other outcomes", () => {
    const rows = [
      makeRow({ investigation_outcome: "Unsubstantiated" }),
      makeRow({ investigation_outcome: "Inconclusive" }),
      makeRow({ investigation_outcome: "Ongoing" }),
    ];
    expect(computeMetrics(rows).substantiated_count).toBe(0);
  });

  it("substantiated_count does not count null outcomes", () => {
    const rows = [makeRow({ investigation_outcome: null })];
    expect(computeMetrics(rows).substantiated_count).toBe(0);
  });

  it("substantiated_count counts multiple substantiated", () => {
    const rows = [
      makeRow({ investigation_outcome: "Substantiated" }),
      makeRow({ investigation_outcome: "Substantiated" }),
      makeRow({ investigation_outcome: "Unsubstantiated" }),
    ];
    expect(computeMetrics(rows).substantiated_count).toBe(2);
  });

  it("substantiated_count does not count Partially Substantiated", () => {
    const rows = [makeRow({ investigation_outcome: "Partially Substantiated" })];
    expect(computeMetrics(rows).substantiated_count).toBe(0);
  });

  // ── detriment_count ───────────────────────────────────────────────────

  it("detriment_count is 0 for empty array", () => {
    expect(computeMetrics([]).detriment_count).toBe(0);
  });

  it("detriment_count is 0 when none reported", () => {
    const rows = [makeRow({ detriment_reported: false })];
    expect(computeMetrics(rows).detriment_count).toBe(0);
  });

  it("detriment_count counts reported detriments", () => {
    const rows = [makeRow({ detriment_reported: true })];
    expect(computeMetrics(rows).detriment_count).toBe(1);
  });

  it("detriment_count counts multiple detriments", () => {
    const rows = [
      makeRow({ detriment_reported: true }),
      makeRow({ detriment_reported: true }),
      makeRow({ detriment_reported: false }),
    ];
    expect(computeMetrics(rows).detriment_count).toBe(2);
  });

  // ── unique_disclosers ──────────────────────────────────────────────────

  it("unique_disclosers counts 1 for single record", () => {
    expect(computeMetrics([makeRow()]).unique_disclosers).toBe(1);
  });

  it("unique_disclosers counts distinct names", () => {
    const rows = [
      makeRow({ discloser_name: "Alice Brown" }),
      makeRow({ discloser_name: "Bob Green" }),
      makeRow({ discloser_name: "Alice Brown" }),
    ];
    expect(computeMetrics(rows).unique_disclosers).toBe(2);
  });

  it("unique_disclosers counts all different names", () => {
    const rows = [
      makeRow({ discloser_name: "Alice" }),
      makeRow({ discloser_name: "Bob" }),
      makeRow({ discloser_name: "Charlie" }),
    ];
    expect(computeMetrics(rows).unique_disclosers).toBe(3);
  });

  // ── unique_handlers ────────────────────────────────────────────────────

  it("unique_handlers counts 1 for single record", () => {
    expect(computeMetrics([makeRow()]).unique_handlers).toBe(1);
  });

  it("unique_handlers counts distinct handler names", () => {
    const rows = [
      makeRow({ handler_name: "Handler A" }),
      makeRow({ handler_name: "Handler B" }),
      makeRow({ handler_name: "Handler A" }),
    ];
    expect(computeMetrics(rows).unique_handlers).toBe(2);
  });

  it("unique_handlers counts all different handlers", () => {
    const rows = [
      makeRow({ handler_name: "Handler A" }),
      makeRow({ handler_name: "Handler B" }),
      makeRow({ handler_name: "Handler C" }),
    ];
    expect(computeMetrics(rows).unique_handlers).toBe(3);
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

  // ── Critical: detriment_reported ──────────────────────────────────────

  it("fires critical for detriment reported", () => {
    const a = computeAlerts([makeRow({ detriment_reported: true })]);
    const c = a.filter((x) => x.type === "detriment_reported" && x.severity === "critical");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("detriment alert includes discloser name", () => {
    const a = computeAlerts([makeRow({ detriment_reported: true, discloser_name: "Alice Brown" })]);
    const c = a.filter((x) => x.type === "detriment_reported");
    expect(c[0].message).toContain("Alice Brown");
  });

  it("detriment alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-123", detriment_reported: true })]);
    const c = a.filter((x) => x.type === "detriment_reported");
    expect(c[0].record_id).toBe("rec-123");
  });

  it("detriment alert mentions Public Interest Disclosure Act", () => {
    const a = computeAlerts([makeRow({ detriment_reported: true })]);
    const c = a.filter((x) => x.type === "detriment_reported");
    expect(c[0].message).toMatch(/Public Interest Disclosure Act/i);
  });

  it("does NOT fire detriment alert when no detriment", () => {
    const a = computeAlerts([makeRow({ detriment_reported: false })]);
    const c = a.filter((x) => x.type === "detriment_reported");
    expect(c.length).toBe(0);
  });

  it("fires detriment alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", detriment_reported: true }),
      makeRow({ id: "a-2", detriment_reported: true }),
    ];
    const a = computeAlerts(rows);
    const c = a.filter((x) => x.type === "detriment_reported");
    expect(c.length).toBe(2);
  });

  // ── Critical: safeguarding_not_investigated ───────────────────────────

  it("fires critical for safeguarding concern not investigated", () => {
    const a = computeAlerts([makeRow({ disclosure_type: "Safeguarding Concern", investigation_opened: false })]);
    const c = a.filter((x) => x.type === "safeguarding_not_investigated" && x.severity === "critical");
    expect(c.length).toBeGreaterThanOrEqual(1);
  });

  it("safeguarding not investigated alert includes discloser name", () => {
    const a = computeAlerts([makeRow({ disclosure_type: "Safeguarding Concern", investigation_opened: false, discloser_name: "Bob Green" })]);
    const c = a.filter((x) => x.type === "safeguarding_not_investigated");
    expect(c[0].message).toContain("Bob Green");
  });

  it("safeguarding not investigated alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-456", disclosure_type: "Safeguarding Concern", investigation_opened: false })]);
    const c = a.filter((x) => x.type === "safeguarding_not_investigated");
    expect(c[0].record_id).toBe("rec-456");
  });

  it("safeguarding not investigated alert mentions safeguarding", () => {
    const a = computeAlerts([makeRow({ disclosure_type: "Safeguarding Concern", investigation_opened: false })]);
    const c = a.filter((x) => x.type === "safeguarding_not_investigated");
    expect(c[0].message).toMatch(/safeguarding/i);
  });

  it("does NOT fire safeguarding alert when investigation opened", () => {
    const a = computeAlerts([makeRow({ disclosure_type: "Safeguarding Concern", investigation_opened: true })]);
    const c = a.filter((x) => x.type === "safeguarding_not_investigated");
    expect(c.length).toBe(0);
  });

  it("does NOT fire safeguarding alert for non-safeguarding type", () => {
    const a = computeAlerts([makeRow({ disclosure_type: "Criminal Offence", investigation_opened: false })]);
    const c = a.filter((x) => x.type === "safeguarding_not_investigated");
    expect(c.length).toBe(0);
  });

  it("fires safeguarding alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", disclosure_type: "Safeguarding Concern", investigation_opened: false }),
      makeRow({ id: "a-2", disclosure_type: "Safeguarding Concern", investigation_opened: false }),
    ];
    const a = computeAlerts(rows);
    const c = a.filter((x) => x.type === "safeguarding_not_investigated");
    expect(c.length).toBe(2);
  });

  // ── High: no_investigation ────────────────────────────────────────────

  it("fires high for no investigation opened (non-safeguarding)", () => {
    const a = computeAlerts([makeRow({ disclosure_type: "Criminal Offence", investigation_opened: false })]);
    const h = a.filter((x) => x.type === "no_investigation" && x.severity === "high");
    expect(h.length).toBeGreaterThanOrEqual(1);
  });

  it("no investigation alert includes discloser name", () => {
    const a = computeAlerts([makeRow({ disclosure_type: "Financial Misconduct", investigation_opened: false, discloser_name: "Charlie Davis" })]);
    const h = a.filter((x) => x.type === "no_investigation");
    expect(h[0].message).toContain("Charlie Davis");
  });

  it("no investigation alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-789", disclosure_type: "Other", investigation_opened: false })]);
    const h = a.filter((x) => x.type === "no_investigation");
    expect(h[0].record_id).toBe("rec-789");
  });

  it("no investigation alert mentions compliance", () => {
    const a = computeAlerts([makeRow({ disclosure_type: "Health & Safety", investigation_opened: false })]);
    const h = a.filter((x) => x.type === "no_investigation");
    expect(h[0].message).toMatch(/compliance/i);
  });

  it("does NOT fire no investigation alert when investigation opened", () => {
    const a = computeAlerts([makeRow({ disclosure_type: "Criminal Offence", investigation_opened: true })]);
    const h = a.filter((x) => x.type === "no_investigation");
    expect(h.length).toBe(0);
  });

  it("does NOT fire no_investigation for safeguarding concern (fires safeguarding_not_investigated instead)", () => {
    const a = computeAlerts([makeRow({ disclosure_type: "Safeguarding Concern", investigation_opened: false })]);
    const h = a.filter((x) => x.type === "no_investigation");
    expect(h.length).toBe(0);
  });

  it("fires no investigation per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", disclosure_type: "Criminal Offence", investigation_opened: false }),
      makeRow({ id: "a-2", disclosure_type: "Financial Misconduct", investigation_opened: false }),
    ];
    const a = computeAlerts(rows);
    const h = a.filter((x) => x.type === "no_investigation");
    expect(h.length).toBe(2);
  });

  // ── High: escalated_no_regulator ──────────────────────────────────────

  it("fires high for escalated without regulator", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Escalated", regulator_notified: false })]);
    const h = a.filter((x) => x.type === "escalated_no_regulator" && x.severity === "high");
    expect(h.length).toBeGreaterThanOrEqual(1);
  });

  it("escalated no regulator alert includes discloser name", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Escalated", regulator_notified: false, discloser_name: "Diana Evans" })]);
    const h = a.filter((x) => x.type === "escalated_no_regulator");
    expect(h[0].message).toContain("Diana Evans");
  });

  it("escalated no regulator alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-abc", compliance_status: "Escalated", regulator_notified: false })]);
    const h = a.filter((x) => x.type === "escalated_no_regulator");
    expect(h[0].record_id).toBe("rec-abc");
  });

  it("escalated no regulator alert mentions regulatory", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Escalated", regulator_notified: false })]);
    const h = a.filter((x) => x.type === "escalated_no_regulator");
    expect(h[0].message).toMatch(/regulatory/i);
  });

  it("does NOT fire escalated alert when regulator notified", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Escalated", regulator_notified: true })]);
    const h = a.filter((x) => x.type === "escalated_no_regulator");
    expect(h.length).toBe(0);
  });

  it("does NOT fire escalated alert for non-escalated status", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Open", regulator_notified: false })]);
    const h = a.filter((x) => x.type === "escalated_no_regulator");
    expect(h.length).toBe(0);
  });

  it("fires escalated alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", compliance_status: "Escalated", regulator_notified: false }),
      makeRow({ id: "a-2", compliance_status: "Escalated", regulator_notified: false }),
    ];
    const a = computeAlerts(rows);
    const h = a.filter((x) => x.type === "escalated_no_regulator");
    expect(h.length).toBe(2);
  });

  // ── Medium: feedback_not_provided ─────────────────────────────────────

  it("fires medium for feedback not provided", () => {
    const a = computeAlerts([makeRow({ feedback_provided: false })]);
    const m = a.filter((x) => x.type === "feedback_not_provided" && x.severity === "medium");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("feedback alert includes discloser name", () => {
    const a = computeAlerts([makeRow({ feedback_provided: false, discloser_name: "Eve Foster" })]);
    const m = a.filter((x) => x.type === "feedback_not_provided");
    expect(m[0].message).toContain("Eve Foster");
  });

  it("feedback alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-def", feedback_provided: false })]);
    const m = a.filter((x) => x.type === "feedback_not_provided");
    expect(m[0].record_id).toBe("rec-def");
  });

  it("feedback alert mentions trust", () => {
    const a = computeAlerts([makeRow({ feedback_provided: false })]);
    const m = a.filter((x) => x.type === "feedback_not_provided");
    expect(m[0].message).toMatch(/trust/i);
  });

  it("does NOT fire feedback alert when feedback provided", () => {
    const a = computeAlerts([makeRow({ feedback_provided: true })]);
    const m = a.filter((x) => x.type === "feedback_not_provided");
    expect(m.length).toBe(0);
  });

  it("fires feedback alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", feedback_provided: false }),
      makeRow({ id: "a-2", feedback_provided: false }),
    ];
    const a = computeAlerts(rows);
    const m = a.filter((x) => x.type === "feedback_not_provided");
    expect(m.length).toBe(2);
  });

  // ── Medium: anonymity_not_maintained ───────────────────────────────────

  it("fires medium for anonymity not maintained", () => {
    const a = computeAlerts([makeRow({ anonymity_maintained: false })]);
    const m = a.filter((x) => x.type === "anonymity_not_maintained" && x.severity === "medium");
    expect(m.length).toBeGreaterThanOrEqual(1);
  });

  it("anonymity alert includes discloser name", () => {
    const a = computeAlerts([makeRow({ anonymity_maintained: false, discloser_name: "Frank Green" })]);
    const m = a.filter((x) => x.type === "anonymity_not_maintained");
    expect(m[0].message).toContain("Frank Green");
  });

  it("anonymity alert includes record_id", () => {
    const a = computeAlerts([makeRow({ id: "rec-ghi", anonymity_maintained: false })]);
    const m = a.filter((x) => x.type === "anonymity_not_maintained");
    expect(m[0].record_id).toBe("rec-ghi");
  });

  it("anonymity alert mentions Public Interest Disclosure Act", () => {
    const a = computeAlerts([makeRow({ anonymity_maintained: false })]);
    const m = a.filter((x) => x.type === "anonymity_not_maintained");
    expect(m[0].message).toMatch(/Public Interest Disclosure Act/i);
  });

  it("does NOT fire anonymity alert when anonymity maintained", () => {
    const a = computeAlerts([makeRow({ anonymity_maintained: true })]);
    const m = a.filter((x) => x.type === "anonymity_not_maintained");
    expect(m.length).toBe(0);
  });

  it("fires anonymity alert per-record for multiple", () => {
    const rows = [
      makeRow({ id: "a-1", anonymity_maintained: false }),
      makeRow({ id: "a-2", anonymity_maintained: false }),
    ];
    const a = computeAlerts(rows);
    const m = a.filter((x) => x.type === "anonymity_not_maintained");
    expect(m.length).toBe(2);
  });

  // ── Combined alerts ───────────────────────────────────────────────────

  it("fires all applicable alert types in worst-case scenario", () => {
    const rows = [
      makeRow({
        id: "a-1",
        disclosure_type: "Safeguarding Concern",
        investigation_opened: false,
        detriment_reported: true,
        compliance_status: "Escalated",
        regulator_notified: false,
        feedback_provided: false,
        anonymity_maintained: false,
      }),
    ];
    const a = computeAlerts(rows);
    const types = new Set(a.map((x) => x.type));
    expect(types.has("detriment_reported")).toBe(true);
    expect(types.has("safeguarding_not_investigated")).toBe(true);
    expect(types.has("escalated_no_regulator")).toBe(true);
    expect(types.has("feedback_not_provided")).toBe(true);
    expect(types.has("anonymity_not_maintained")).toBe(true);
  });

  it("alert severity levels are correct across mixed alerts", () => {
    const rows = [
      makeRow({
        id: "a-1",
        disclosure_type: "Safeguarding Concern",
        investigation_opened: false,
        detriment_reported: true,
        compliance_status: "Escalated",
        regulator_notified: false,
        feedback_provided: false,
        anonymity_maintained: false,
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
      disclosure_type: "Safeguarding Concern",
      investigation_opened: false,
      detriment_reported: true,
      compliance_status: "Escalated",
      regulator_notified: false,
      feedback_provided: false,
      anonymity_maintained: false,
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
      makeRow({ id: "a-1", detriment_reported: true }),
      makeRow({ id: "a-2", feedback_provided: false }),
    ];
    const a = computeAlerts(rows);
    const detrimentAlerts = a.filter((x) => x.type === "detriment_reported");
    const feedbackAlerts = a.filter((x) => x.type === "feedback_not_provided");
    expect(detrimentAlerts.length).toBe(1);
    expect(feedbackAlerts.length).toBeGreaterThanOrEqual(1);
    expect(detrimentAlerts[0].record_id).toBe("a-1");
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

  // ── Insight 1: violet-themed summary ──────────────────────────────────

  it("first insight starts with [violet]", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toMatch(/^\[violet\]/);
  });

  it("first insight includes total disclosure count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes unique discloser count", () => {
    const rows = [
      makeRow({ discloser_name: "Alice" }),
      makeRow({ discloser_name: "Bob" }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("2");
  });

  it("first insight includes unique handler count", () => {
    const rows = [
      makeRow({ handler_name: "Handler A" }),
      makeRow({ handler_name: "Handler B" }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("2");
  });

  it("first insight includes open count", () => {
    const rows = [
      makeRow({ compliance_status: "Open" }),
      makeRow({ compliance_status: "Closed" }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("1 open");
  });

  it("first insight includes under investigation count", () => {
    const rows = [makeRow({ compliance_status: "Under Investigation" })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("1 under investigation");
  });

  it("first insight includes closed count", () => {
    const rows = [makeRow({ compliance_status: "Closed" })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("1 closed");
  });

  it("first insight includes escalated count", () => {
    const rows = [makeRow({ compliance_status: "Escalated" })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("1 escalated");
  });

  it("first insight uses singular disclosure for 1 record", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toContain("1 whistleblowing disclosure");
    expect(insights[0]).not.toContain("disclosures recorded");
  });

  it("first insight uses plural disclosures for 2+ records", () => {
    const rows = [makeRow(), makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("disclosures");
  });

  it("first insight uses singular discloser for 1 discloser", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toContain("discloser");
    expect(insights[0]).not.toContain("disclosers handled");
  });

  it("first insight uses plural disclosers for 2+ disclosers", () => {
    const rows = [makeRow({ discloser_name: "Alice" }), makeRow({ discloser_name: "Bob" })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("disclosers");
  });

  it("first insight uses singular handler for 1 handler", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[0]).toContain("handler");
  });

  it("first insight uses plural handlers for 2+ handlers", () => {
    const rows = [makeRow({ handler_name: "Handler A" }), makeRow({ handler_name: "Handler B" })];
    const insights = computeCaraInsights(rows);
    expect(insights[0]).toContain("handlers");
  });

  // ── Insight 2: amber-themed priorities ────────────────────────────────

  it("second insight starts with [amber]", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions alerts when critical alerts exist", () => {
    const rows = [makeRow({ detriment_reported: true })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("critical");
  });

  it("second insight mentions no alerts when all compliant", () => {
    const rows = [makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toMatch(/[Nn]o critical/);
  });

  it("second insight includes investigation opened rate", () => {
    const rows = [makeRow({ investigation_opened: true }), makeRow({ investigation_opened: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes whistleblower protected rate", () => {
    const rows = [makeRow({ whistleblower_protected: true }), makeRow({ whistleblower_protected: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes anonymity rate when alerts present", () => {
    const rows = [
      makeRow({ anonymity_maintained: true, detriment_reported: true }),
      makeRow({ anonymity_maintained: false }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("second insight mentions high-priority count when present", () => {
    const rows = [makeRow({ disclosure_type: "Criminal Offence", investigation_opened: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("high-priority");
  });

  it("second insight mentions safeguarding when no alerts", () => {
    const rows = [makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("safeguarding");
  });

  // ── Insight 3: reflect-themed question ────────────────────────────────

  it("third insight starts with [reflect]", () => {
    const insights = computeCaraInsights([makeRow()]);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions critical alert count when present", () => {
    const rows = [makeRow({ detriment_reported: true })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("1");
    expect(insights[2]).toMatch(/critical/i);
  });

  it("third insight uses singular when 1 critical alert", () => {
    const rows = [makeRow({ detriment_reported: true })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("alert requires");
  });

  it("third insight uses plural when 2+ critical alerts", () => {
    const rows = [
      makeRow({ detriment_reported: true, discloser_name: "Alice" }),
      makeRow({ detriment_reported: true, discloser_name: "Bob" }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("alerts require");
  });

  it("third insight addresses investigation rate when no critical alerts but rate < 100", () => {
    const rows = [
      makeRow({ disclosure_type: "Other", investigation_opened: false }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("disclosures");
  });

  it("third insight mentions staff concerns when investigation rate < 100", () => {
    const rows = [makeRow({ disclosure_type: "Other", investigation_opened: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("concerns");
  });

  it("third insight celebrates full compliance when all checks pass", () => {
    const rows = [
      makeRow({ investigation_opened: true }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("compliance");
    expect(insights[2]).toContain("whistleblowing");
  });

  it("third insight mentions protection when critical alerts present", () => {
    const rows = [makeRow({ detriment_reported: true })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("protected");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CRUD (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD when Supabase disabled", () => {
  it("listStaffWhistleblowingDisclosures returns empty data", async () => {
    const { listStaffWhistleblowingDisclosures } = await import("../staff-whistleblowing-management-service");
    const result = await listStaffWhistleblowingDisclosures("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("createStaffWhistleblowingDisclosure returns error", async () => {
    const { createStaffWhistleblowingDisclosure } = await import("../staff-whistleblowing-management-service");
    const result = await createStaffWhistleblowingDisclosure({
      homeId: "home-1",
      disclosureDate: "2026-05-15",
      handlerName: "Safeguarding Lead",
      discloserName: "Jane Smith",
      disclosureType: "Safeguarding Concern",
      disclosureMethod: "Internal",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("updateStaffWhistleblowingDisclosure returns error", async () => {
    const { updateStaffWhistleblowingDisclosure } = await import("../staff-whistleblowing-management-service");
    const result = await updateStaffWhistleblowingDisclosure("rec-1", { notes: "updated" });
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
      investigation_opened: false,
      action_taken: false,
      whistleblower_protected: false,
      anonymity_maintained: false,
      detriment_reported: false,
      feedback_provided: false,
      regulator_notified: false,
    });
    const m = computeMetrics([row]);
    expect(m.investigation_opened_rate).toBe(0);
    expect(m.action_taken_rate).toBe(0);
    expect(m.whistleblower_protected_rate).toBe(0);
    expect(m.anonymity_rate).toBe(0);
    expect(m.feedback_rate).toBe(0);
    expect(m.regulator_notified_rate).toBe(0);
  });

  it("alerts for record with all flags triggering", () => {
    const row = makeRow({
      disclosure_type: "Safeguarding Concern",
      investigation_opened: false,
      detriment_reported: true,
      compliance_status: "Escalated",
      regulator_notified: false,
      feedback_provided: false,
      anonymity_maintained: false,
    });
    const a = computeAlerts([row]);
    expect(a.length).toBeGreaterThanOrEqual(5);
  });

  it("makeRow factory with overrides preserves overrides", () => {
    const row = makeRow({
      discloser_name: "Custom Name",
      disclosure_type: "Criminal Offence",
      compliance_status: "Escalated",
    });
    expect(row.discloser_name).toBe("Custom Name");
    expect(row.disclosure_type).toBe("Criminal Offence");
    expect(row.compliance_status).toBe("Escalated");
  });

  it("makeRow factory nullable fields have expected defaults", () => {
    const row = makeRow();
    expect(row.notes).toBeNull();
    expect(row.investigation_outcome).toBe("Substantiated");
    expect(row.detriment_reported).toBe(false);
  });

  it("makeRow factory allows setting nullable fields", () => {
    const row = makeRow({
      investigation_outcome: "Ongoing",
      notes: "Disclosure under review",
    });
    expect(row.investigation_outcome).toBe("Ongoing");
    expect(row.notes).toBe("Disclosure under review");
  });

  it("makeRow factory allows explicitly setting nullable fields to null", () => {
    const row = makeRow({ investigation_outcome: null, notes: null });
    expect(row.investigation_outcome).toBeNull();
    expect(row.notes).toBeNull();
  });

  it("makeRow factory investigation_opened defaults to true", () => {
    const row = makeRow();
    expect(row.investigation_opened).toBe(true);
  });

  it("makeRow factory whistleblower_protected defaults to true", () => {
    const row = makeRow();
    expect(row.whistleblower_protected).toBe(true);
  });

  it("makeRow factory allows overriding boolean fields", () => {
    const row = makeRow({ investigation_opened: false, action_taken: false });
    expect(row.investigation_opened).toBe(false);
    expect(row.action_taken).toBe(false);
  });

  it("metrics handles large dataset", () => {
    const rows = Array.from({ length: 100 }, (_, i) =>
      makeRow({
        discloser_name: `Staff ${i % 10}`,
        handler_name: `Handler ${i % 5}`,
        compliance_status: COMPLIANCE_STATUSES[i % 4],
        investigation_opened: i % 3 !== 0,
      }),
    );
    const m = computeMetrics(rows);
    expect(m.total_disclosures).toBe(100);
    expect(m.unique_disclosers).toBe(10);
    expect(m.unique_handlers).toBe(5);
    expect(m.open_count).toBe(25);
  });

  it("insights handle empty data gracefully", () => {
    const insights = computeCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("0 whistleblowing");
    expect(insights[0]).toContain("0 discloser");
  });

  it("alerts handle no problematic records", () => {
    const rows = Array.from({ length: 5 }, () => makeRow());
    const a = computeAlerts(rows);
    expect(a).toEqual([]);
  });

  it("metrics with all four compliance statuses", () => {
    const rows = COMPLIANCE_STATUSES.map((s, i) => makeRow({ id: `a-${i}`, compliance_status: s }));
    const m = computeMetrics(rows);
    expect(m.total_disclosures).toBe(4);
    expect(m.open_count).toBe(1);
    expect(m.under_investigation_count).toBe(1);
    expect(m.closed_count).toBe(1);
    expect(m.escalated_count).toBe(1);
  });

  it("detriment alert only fires for reported detriment, not for escalated status alone", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Escalated", detriment_reported: false })]);
    const det = a.filter((x) => x.type === "detriment_reported");
    expect(det.length).toBe(0);
  });

  it("escalated alert does not fire for detriment_reported alone", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Closed", detriment_reported: true })]);
    const esc = a.filter((x) => x.type === "escalated_no_regulator");
    expect(esc.length).toBe(0);
  });

  it("metrics unique_handlers with single handler across disclosers", () => {
    const rows = [
      makeRow({ discloser_name: "Alice", handler_name: "Same Handler" }),
      makeRow({ discloser_name: "Bob", handler_name: "Same Handler" }),
      makeRow({ discloser_name: "Charlie", handler_name: "Same Handler" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_disclosers).toBe(3);
    expect(m.unique_handlers).toBe(1);
  });

  it("metrics unique_disclosers with single discloser across handlers", () => {
    const rows = [
      makeRow({ discloser_name: "Same Worker", handler_name: "Handler A" }),
      makeRow({ discloser_name: "Same Worker", handler_name: "Handler B" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_disclosers).toBe(1);
    expect(m.unique_handlers).toBe(2);
  });

  it("insights with only critical alerts show correct count", () => {
    const rows = [makeRow({ detriment_reported: true })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toMatch(/\d+ critical/);
  });

  it("insights with only high alerts show correct count", () => {
    const rows = [makeRow({ disclosure_type: "Criminal Offence", investigation_opened: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toMatch(/\d+ high-priority/);
  });

  it("insights reflect question path for investigation rate < 100%", () => {
    const rows = [makeRow({ disclosure_type: "Other", investigation_opened: false })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("disclosures");
    expect(insights[2]).toContain("0%");
  });

  it("all alert record_ids match the source row id", () => {
    const row = makeRow({
      id: "unique-test-id",
      disclosure_type: "Safeguarding Concern",
      investigation_opened: false,
      detriment_reported: true,
      compliance_status: "Escalated",
      regulator_notified: false,
      feedback_provided: false,
      anonymity_maintained: false,
    });
    const a = computeAlerts([row]);
    for (const alert of a) {
      expect(alert.record_id).toBe("unique-test-id");
    }
  });

  it("metrics with all nine disclosure types", () => {
    const rows = DISCLOSURE_TYPES.map((r, i) => makeRow({ id: `a-${i}`, disclosure_type: r }));
    const m = computeMetrics(rows);
    expect(m.total_disclosures).toBe(9);
  });

  it("feedback alert is independent of compliance status", () => {
    const a = computeAlerts([makeRow({ feedback_provided: false, compliance_status: "Closed" })]);
    const f = a.filter((x) => x.type === "feedback_not_provided");
    expect(f.length).toBe(1);
  });

  it("detriment alert is independent of anonymity status", () => {
    const a = computeAlerts([makeRow({ detriment_reported: true, anonymity_maintained: true })]);
    const det = a.filter((x) => x.type === "detriment_reported");
    expect(det.length).toBe(1);
    const anon = a.filter((x) => x.type === "anonymity_not_maintained");
    expect(anon.length).toBe(0);
  });

  it("metrics substantiated_count with all null outcomes returns 0", () => {
    const rows = Array.from({ length: 5 }, () => makeRow({ investigation_outcome: null }));
    const m = computeMetrics(rows);
    expect(m.substantiated_count).toBe(0);
  });

  it("metrics detriment_count with all false returns 0", () => {
    const rows = Array.from({ length: 5 }, () => makeRow({ detriment_reported: false }));
    const m = computeMetrics(rows);
    expect(m.detriment_count).toBe(0);
  });

  it("insights with mixed critical and high alerts", () => {
    const rows = [
      makeRow({ detriment_reported: true }),
      makeRow({ disclosure_type: "Criminal Offence", investigation_opened: false }),
    ];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high-priority");
  });

  it("insights third path for full investigation rate with no critical alerts", () => {
    const rows = [makeRow({ investigation_opened: true })];
    const insights = computeCaraInsights(rows);
    expect(insights[2]).toContain("compliance");
  });

  it("anonymity alert is independent of detriment reported status", () => {
    const a = computeAlerts([makeRow({ anonymity_maintained: false, detriment_reported: false })]);
    const anon = a.filter((x) => x.type === "anonymity_not_maintained");
    expect(anon.length).toBe(1);
    const det = a.filter((x) => x.type === "detriment_reported");
    expect(det.length).toBe(0);
  });

  it("escalated alert is independent of feedback provided status", () => {
    const a = computeAlerts([makeRow({ compliance_status: "Escalated", regulator_notified: false, feedback_provided: true })]);
    const esc = a.filter((x) => x.type === "escalated_no_regulator");
    expect(esc.length).toBe(1);
    const fb = a.filter((x) => x.type === "feedback_not_provided");
    expect(fb.length).toBe(0);
  });

  it("makeRow factory disclosure_type defaults to Safeguarding Concern", () => {
    const row = makeRow();
    expect(row.disclosure_type).toBe("Safeguarding Concern");
  });

  it("makeRow factory compliance_status defaults to Closed", () => {
    const row = makeRow();
    expect(row.compliance_status).toBe("Closed");
  });

  it("makeRow factory disclosure_method defaults to Internal", () => {
    const row = makeRow();
    expect(row.disclosure_method).toBe("Internal");
  });

  it("metrics with all seven disclosure methods", () => {
    const rows = DISCLOSURE_METHODS.map((m, i) => makeRow({ id: `a-${i}`, disclosure_method: m }));
    const met = computeMetrics(rows);
    expect(met.total_disclosures).toBe(7);
  });

  it("metrics with all five investigation outcomes", () => {
    const rows = INVESTIGATION_OUTCOMES.map((o, i) => makeRow({ id: `a-${i}`, investigation_outcome: o }));
    const m = computeMetrics(rows);
    expect(m.total_disclosures).toBe(5);
    expect(m.substantiated_count).toBe(1);
  });

  it("no_investigation alert fires for each non-safeguarding uninvestigated type", () => {
    const nonSafeguarding = DISCLOSURE_TYPES.filter((t) => t !== "Safeguarding Concern");
    const rows = nonSafeguarding.map((t, i) => makeRow({ id: `a-${i}`, disclosure_type: t, investigation_opened: false }));
    const a = computeAlerts(rows);
    const noInv = a.filter((x) => x.type === "no_investigation");
    expect(noInv.length).toBe(nonSafeguarding.length);
  });

  it("safeguarding alert does not fire when investigation is opened", () => {
    const a = computeAlerts([makeRow({ disclosure_type: "Safeguarding Concern", investigation_opened: true })]);
    const saf = a.filter((x) => x.type === "safeguarding_not_investigated");
    expect(saf.length).toBe(0);
  });

  it("metrics action_taken_rate computes 33.3% correctly", () => {
    const rows = [
      makeRow({ action_taken: true }),
      makeRow({ action_taken: false }),
      makeRow({ action_taken: false }),
    ];
    expect(computeMetrics(rows).action_taken_rate).toBe(33.3);
  });

  it("insights contain investigation opened rate in amber section", () => {
    const rows = [makeRow()];
    const insights = computeCaraInsights(rows);
    expect(insights[1]).toContain("100%");
  });
});
