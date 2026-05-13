// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LEGAL STATUS SERVICE TESTS
// Pure-function tests for legal status metrics computation, alert identification,
// and constant validation for CHR 2015 Reg 8/36, Children Act 1989 compliance.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";
import {
  _testing,
  LEGAL_STATUSES,
  ORDER_TYPES,
  COURT_TYPES,
  HEARING_OUTCOMES,
} from "../legal-status-service";
import type {
  LegalRecord,
  LegalStatus,
  OrderType,
  CourtType,
  HearingOutcome,
} from "../legal-status-service";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  listRecords,
  createRecord,
  updateRecord,
} from "../legal-status-service";

const { computeLegalMetrics, identifyLegalAlerts } = _testing;

// ── Date normalisation ────────────────────────────────────────────────────
const now = new Date(new Date().toISOString().split("T")[0]);

// ── Helpers ───────────────────────────────────────────────────────────────

const recordDefaults: LegalRecord = {
  id: "lr-1",
  home_id: "home-1",
  child_name: "Alex Taylor",
  child_id: "child-1",
  legal_status: "section_20",
  order_type: "care_order",
  order_date: "2026-01-01",
  order_expiry: "2026-12-31",
  court_type: "family_court",
  court_name: "Manchester Family Court",
  conditions: ["Supervised contact"],
  solicitor_name: "Smith & Partners",
  solicitor_contact: "0161 123 4567",
  guardian_name: "Jane Guardian",
  parental_responsibility: ["Mother"],
  contact_conditions: "Supervised only",
  next_hearing_date: "2026-07-01",
  last_hearing_outcome: "order_granted",
  staff_briefed: true,
  notes: "Standard review completed",
  created_at: "2026-01-01T10:00:00Z",
  updated_at: "2026-01-01T10:00:00Z",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeRecord(overrides: Record<string, unknown> = {}): any {
  return { ...recordDefaults, ...overrides };
}

function daysFromNow(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

// ── LEGAL_STATUSES ────────────────────────────────────────────────────────

describe("LEGAL_STATUSES", () => {
  it("has exactly 12 entries", () => {
    expect(LEGAL_STATUSES).toHaveLength(12);
  });

  it("each entry has status and label properties", () => {
    for (const entry of LEGAL_STATUSES) {
      expect(typeof entry.status).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("has unique status values", () => {
    const statuses = LEGAL_STATUSES.map((e) => e.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("contains section_20", () => {
    expect(LEGAL_STATUSES.map((e) => e.status)).toContain("section_20");
  });

  it("contains section_31_full", () => {
    expect(LEGAL_STATUSES.map((e) => e.status)).toContain("section_31_full");
  });

  it("contains section_31_interim", () => {
    expect(LEGAL_STATUSES.map((e) => e.status)).toContain("section_31_interim");
  });

  it("contains section_38", () => {
    expect(LEGAL_STATUSES.map((e) => e.status)).toContain("section_38");
  });

  it("contains section_44", () => {
    expect(LEGAL_STATUSES.map((e) => e.status)).toContain("section_44");
  });

  it("contains section_46", () => {
    expect(LEGAL_STATUSES.map((e) => e.status)).toContain("section_46");
  });

  it("contains placement_order", () => {
    expect(LEGAL_STATUSES.map((e) => e.status)).toContain("placement_order");
  });

  it("contains special_guardianship", () => {
    expect(LEGAL_STATUSES.map((e) => e.status)).toContain("special_guardianship");
  });

  it("contains child_arrangement", () => {
    expect(LEGAL_STATUSES.map((e) => e.status)).toContain("child_arrangement");
  });

  it("contains secure_order", () => {
    expect(LEGAL_STATUSES.map((e) => e.status)).toContain("secure_order");
  });

  it("contains remand", () => {
    expect(LEGAL_STATUSES.map((e) => e.status)).toContain("remand");
  });

  it("contains other", () => {
    expect(LEGAL_STATUSES.map((e) => e.status)).toContain("other");
  });

  it("has correct label for section_20", () => {
    const found = LEGAL_STATUSES.find((e) => e.status === "section_20");
    expect(found?.label).toBe("Section 20 (Voluntary)");
  });

  it("has correct label for section_31_full", () => {
    const found = LEGAL_STATUSES.find((e) => e.status === "section_31_full");
    expect(found?.label).toBe("Section 31 (Full Care Order)");
  });

  it("has correct label for placement_order", () => {
    const found = LEGAL_STATUSES.find((e) => e.status === "placement_order");
    expect(found?.label).toBe("Placement Order");
  });

  it("has correct label for special_guardianship", () => {
    const found = LEGAL_STATUSES.find((e) => e.status === "special_guardianship");
    expect(found?.label).toBe("Special Guardianship");
  });
});

// ── ORDER_TYPES ───────────────────────────────────────────────────────────

describe("ORDER_TYPES", () => {
  it("has exactly 11 entries", () => {
    expect(ORDER_TYPES).toHaveLength(11);
  });

  it("each entry has type and label properties", () => {
    for (const entry of ORDER_TYPES) {
      expect(typeof entry.type).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("has unique type values", () => {
    const types = ORDER_TYPES.map((e) => e.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("contains care_order", () => {
    expect(ORDER_TYPES.map((e) => e.type)).toContain("care_order");
  });

  it("contains interim_care_order", () => {
    expect(ORDER_TYPES.map((e) => e.type)).toContain("interim_care_order");
  });

  it("contains emergency_protection", () => {
    expect(ORDER_TYPES.map((e) => e.type)).toContain("emergency_protection");
  });

  it("contains deprivation_of_liberty", () => {
    expect(ORDER_TYPES.map((e) => e.type)).toContain("deprivation_of_liberty");
  });

  it("has correct label for care_order", () => {
    const found = ORDER_TYPES.find((e) => e.type === "care_order");
    expect(found?.label).toBe("Care Order");
  });

  it("has correct label for emergency_protection", () => {
    const found = ORDER_TYPES.find((e) => e.type === "emergency_protection");
    expect(found?.label).toBe("Emergency Protection Order");
  });

  it("has correct label for deprivation_of_liberty", () => {
    const found = ORDER_TYPES.find((e) => e.type === "deprivation_of_liberty");
    expect(found?.label).toBe("Deprivation of Liberty");
  });
});

// ── COURT_TYPES ───────────────────────────────────────────────────────────

describe("COURT_TYPES", () => {
  it("has exactly 6 entries", () => {
    expect(COURT_TYPES).toHaveLength(6);
  });

  it("each entry has type and label properties", () => {
    for (const entry of COURT_TYPES) {
      expect(typeof entry.type).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("has unique type values", () => {
    const types = COURT_TYPES.map((e) => e.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("contains family_court", () => {
    expect(COURT_TYPES.map((e) => e.type)).toContain("family_court");
  });

  it("contains high_court", () => {
    expect(COURT_TYPES.map((e) => e.type)).toContain("high_court");
  });

  it("contains crown_court", () => {
    expect(COURT_TYPES.map((e) => e.type)).toContain("crown_court");
  });

  it("contains magistrates", () => {
    expect(COURT_TYPES.map((e) => e.type)).toContain("magistrates");
  });

  it("contains youth_court", () => {
    expect(COURT_TYPES.map((e) => e.type)).toContain("youth_court");
  });

  it("has correct label for family_court", () => {
    const found = COURT_TYPES.find((e) => e.type === "family_court");
    expect(found?.label).toBe("Family Court");
  });

  it("has correct label for magistrates", () => {
    const found = COURT_TYPES.find((e) => e.type === "magistrates");
    expect(found?.label).toBe("Magistrates Court");
  });

  it("has correct label for youth_court", () => {
    const found = COURT_TYPES.find((e) => e.type === "youth_court");
    expect(found?.label).toBe("Youth Court");
  });
});

// ── HEARING_OUTCOMES ──────────────────────────────────────────────────────

describe("HEARING_OUTCOMES", () => {
  it("has exactly 8 entries", () => {
    expect(HEARING_OUTCOMES).toHaveLength(8);
  });

  it("each entry has outcome and label properties", () => {
    for (const entry of HEARING_OUTCOMES) {
      expect(typeof entry.outcome).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("has unique outcome values", () => {
    const outcomes = HEARING_OUTCOMES.map((e) => e.outcome);
    expect(new Set(outcomes).size).toBe(outcomes.length);
  });

  it("contains order_granted", () => {
    expect(HEARING_OUTCOMES.map((e) => e.outcome)).toContain("order_granted");
  });

  it("contains order_refused", () => {
    expect(HEARING_OUTCOMES.map((e) => e.outcome)).toContain("order_refused");
  });

  it("contains order_varied", () => {
    expect(HEARING_OUTCOMES.map((e) => e.outcome)).toContain("order_varied");
  });

  it("contains adjourned", () => {
    expect(HEARING_OUTCOMES.map((e) => e.outcome)).toContain("adjourned");
  });

  it("contains consent_order", () => {
    expect(HEARING_OUTCOMES.map((e) => e.outcome)).toContain("consent_order");
  });

  it("contains pending", () => {
    expect(HEARING_OUTCOMES.map((e) => e.outcome)).toContain("pending");
  });

  it("has correct label for order_granted", () => {
    const found = HEARING_OUTCOMES.find((e) => e.outcome === "order_granted");
    expect(found?.label).toBe("Order Granted");
  });

  it("has correct label for adjourned", () => {
    const found = HEARING_OUTCOMES.find((e) => e.outcome === "adjourned");
    expect(found?.label).toBe("Adjourned");
  });

  it("has correct label for consent_order", () => {
    const found = HEARING_OUTCOMES.find((e) => e.outcome === "consent_order");
    expect(found?.label).toBe("Consent Order");
  });

  it("has correct label for pending", () => {
    const found = HEARING_OUTCOMES.find((e) => e.outcome === "pending");
    expect(found?.label).toBe("Pending");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeLegalMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeLegalMetrics", () => {
  // ── Empty / basic ──

  it("returns zeroed metrics for empty records array", () => {
    const result = computeLegalMetrics([], 0, now);
    expect(result.total_records).toBe(0);
    expect(result.children_with_records).toBe(0);
    expect(result.legal_coverage).toBe(0);
    expect(result.section_20_count).toBe(0);
    expect(result.full_care_order_count).toBe(0);
    expect(result.interim_care_order_count).toBe(0);
    expect(result.placement_order_count).toBe(0);
    expect(result.staff_briefed_rate).toBe(0);
    expect(result.upcoming_hearings).toBe(0);
    expect(result.orders_expiring_soon).toBe(0);
    expect(result.with_conditions).toBe(0);
    expect(result.with_solicitor).toBe(0);
    expect(result.by_legal_status).toEqual({});
    expect(result.by_order_type).toEqual({});
    expect(result.by_hearing_outcome).toEqual({});
  });

  it("returns zero coverage when totalChildren is 0", () => {
    const result = computeLegalMetrics([makeRecord()], 0, now);
    expect(result.legal_coverage).toBe(0);
  });

  it("counts a single record correctly", () => {
    const result = computeLegalMetrics([makeRecord()], 1, now);
    expect(result.total_records).toBe(1);
    expect(result.children_with_records).toBe(1);
  });

  it("reports total_records matching input length", () => {
    const records = [
      makeRecord({ id: "lr-1", child_id: "c1" }),
      makeRecord({ id: "lr-2", child_id: "c2" }),
      makeRecord({ id: "lr-3", child_id: "c3" }),
    ];
    const result = computeLegalMetrics(records, 5, now);
    expect(result.total_records).toBe(3);
  });

  // ── Coverage calculation ──

  it("computes 100% coverage when all children have records", () => {
    const records = [
      makeRecord({ id: "lr-1", child_id: "c1" }),
      makeRecord({ id: "lr-2", child_id: "c2" }),
    ];
    const result = computeLegalMetrics(records, 2, now);
    expect(result.legal_coverage).toBe(100);
  });

  it("computes 50% coverage when half the children have records", () => {
    const result = computeLegalMetrics(
      [makeRecord({ child_id: "c1" })],
      2,
      now,
    );
    expect(result.legal_coverage).toBe(50);
  });

  it("counts unique children correctly when one child has multiple records", () => {
    const records = [
      makeRecord({ id: "lr-1", child_id: "c1" }),
      makeRecord({ id: "lr-2", child_id: "c1" }),
    ];
    const result = computeLegalMetrics(records, 2, now);
    expect(result.children_with_records).toBe(1);
    expect(result.legal_coverage).toBe(50);
  });

  it("rounds coverage to one decimal place", () => {
    const records = [makeRecord({ child_id: "c1" })];
    const result = computeLegalMetrics(records, 3, now);
    // 1/3 = 33.333...% -> 33.3
    expect(result.legal_coverage).toBe(33.3);
  });

  // ── Legal status counts ──

  it("counts section_20 records", () => {
    const records = [
      makeRecord({ id: "lr-1", legal_status: "section_20" }),
      makeRecord({ id: "lr-2", legal_status: "section_20" }),
      makeRecord({ id: "lr-3", legal_status: "section_31_full" }),
    ];
    const result = computeLegalMetrics(records, 3, now);
    expect(result.section_20_count).toBe(2);
  });

  it("counts section_31_full records as full_care_order_count", () => {
    const records = [
      makeRecord({ id: "lr-1", legal_status: "section_31_full" }),
      makeRecord({ id: "lr-2", legal_status: "section_31_full" }),
    ];
    const result = computeLegalMetrics(records, 2, now);
    expect(result.full_care_order_count).toBe(2);
  });

  it("counts section_31_interim as interim_care_order_count", () => {
    const result = computeLegalMetrics(
      [makeRecord({ legal_status: "section_31_interim" })],
      1,
      now,
    );
    expect(result.interim_care_order_count).toBe(1);
  });

  it("counts section_38 as interim_care_order_count", () => {
    const result = computeLegalMetrics(
      [makeRecord({ legal_status: "section_38" })],
      1,
      now,
    );
    expect(result.interim_care_order_count).toBe(1);
  });

  it("combines section_31_interim and section_38 into interim_care_order_count", () => {
    const records = [
      makeRecord({ id: "lr-1", legal_status: "section_31_interim" }),
      makeRecord({ id: "lr-2", legal_status: "section_38" }),
    ];
    const result = computeLegalMetrics(records, 2, now);
    expect(result.interim_care_order_count).toBe(2);
  });

  it("counts placement_order records", () => {
    const result = computeLegalMetrics(
      [makeRecord({ legal_status: "placement_order" })],
      1,
      now,
    );
    expect(result.placement_order_count).toBe(1);
  });

  it("returns zero for section_44 in named counts", () => {
    const result = computeLegalMetrics(
      [makeRecord({ legal_status: "section_44" })],
      1,
      now,
    );
    expect(result.section_20_count).toBe(0);
    expect(result.full_care_order_count).toBe(0);
    expect(result.interim_care_order_count).toBe(0);
    expect(result.placement_order_count).toBe(0);
  });

  it("returns zero for section_46 in named counts", () => {
    const result = computeLegalMetrics(
      [makeRecord({ legal_status: "section_46" })],
      1,
      now,
    );
    expect(result.section_20_count).toBe(0);
    expect(result.full_care_order_count).toBe(0);
  });

  it("returns zero for special_guardianship in named counts", () => {
    const result = computeLegalMetrics(
      [makeRecord({ legal_status: "special_guardianship" })],
      1,
      now,
    );
    expect(result.section_20_count).toBe(0);
    expect(result.placement_order_count).toBe(0);
  });

  it("returns zero for child_arrangement in named counts", () => {
    const result = computeLegalMetrics(
      [makeRecord({ legal_status: "child_arrangement" })],
      1,
      now,
    );
    expect(result.section_20_count).toBe(0);
  });

  it("returns zero for secure_order in named counts", () => {
    const result = computeLegalMetrics(
      [makeRecord({ legal_status: "secure_order" })],
      1,
      now,
    );
    expect(result.full_care_order_count).toBe(0);
  });

  it("returns zero for remand in named counts", () => {
    const result = computeLegalMetrics(
      [makeRecord({ legal_status: "remand" })],
      1,
      now,
    );
    expect(result.section_20_count).toBe(0);
  });

  it("returns zero for other in named counts", () => {
    const result = computeLegalMetrics(
      [makeRecord({ legal_status: "other" })],
      1,
      now,
    );
    expect(result.section_20_count).toBe(0);
  });

  // ── Staff briefed rate ──

  it("computes 100% staff_briefed_rate when all briefed", () => {
    const records = [
      makeRecord({ id: "lr-1", staff_briefed: true }),
      makeRecord({ id: "lr-2", staff_briefed: true }),
    ];
    const result = computeLegalMetrics(records, 2, now);
    expect(result.staff_briefed_rate).toBe(100);
  });

  it("computes 0% staff_briefed_rate when none briefed", () => {
    const records = [
      makeRecord({ id: "lr-1", staff_briefed: false }),
      makeRecord({ id: "lr-2", staff_briefed: false }),
    ];
    const result = computeLegalMetrics(records, 2, now);
    expect(result.staff_briefed_rate).toBe(0);
  });

  it("computes 50% staff_briefed_rate for mixed briefing", () => {
    const records = [
      makeRecord({ id: "lr-1", staff_briefed: true }),
      makeRecord({ id: "lr-2", staff_briefed: false }),
    ];
    const result = computeLegalMetrics(records, 2, now);
    expect(result.staff_briefed_rate).toBe(50);
  });

  it("returns 0 staff_briefed_rate for empty records", () => {
    const result = computeLegalMetrics([], 0, now);
    expect(result.staff_briefed_rate).toBe(0);
  });

  it("rounds staff_briefed_rate to one decimal place", () => {
    const records = [
      makeRecord({ id: "lr-1", staff_briefed: true }),
      makeRecord({ id: "lr-2", staff_briefed: false }),
      makeRecord({ id: "lr-3", staff_briefed: true }),
    ];
    const result = computeLegalMetrics(records, 3, now);
    // 2/3 = 66.666...% -> 66.7
    expect(result.staff_briefed_rate).toBe(66.7);
  });

  // ── Upcoming hearings (within 30 days) ──

  it("counts hearing within 30 days as upcoming", () => {
    const result = computeLegalMetrics(
      [makeRecord({ next_hearing_date: daysFromNow(10) })],
      1,
      now,
    );
    expect(result.upcoming_hearings).toBe(1);
  });

  it("counts hearing exactly today as upcoming", () => {
    const result = computeLegalMetrics(
      [makeRecord({ next_hearing_date: daysFromNow(0) })],
      1,
      now,
    );
    expect(result.upcoming_hearings).toBe(1);
  });

  it("counts hearing exactly 30 days away as upcoming", () => {
    const result = computeLegalMetrics(
      [makeRecord({ next_hearing_date: daysFromNow(30) })],
      1,
      now,
    );
    expect(result.upcoming_hearings).toBe(1);
  });

  it("does not count hearing 31 days away as upcoming", () => {
    const result = computeLegalMetrics(
      [makeRecord({ next_hearing_date: daysFromNow(31) })],
      1,
      now,
    );
    expect(result.upcoming_hearings).toBe(0);
  });

  it("does not count past hearing as upcoming", () => {
    const result = computeLegalMetrics(
      [makeRecord({ next_hearing_date: daysFromNow(-1) })],
      1,
      now,
    );
    expect(result.upcoming_hearings).toBe(0);
  });

  it("does not count null hearing date as upcoming", () => {
    const result = computeLegalMetrics(
      [makeRecord({ next_hearing_date: null })],
      1,
      now,
    );
    expect(result.upcoming_hearings).toBe(0);
  });

  it("counts multiple upcoming hearings", () => {
    const records = [
      makeRecord({ id: "lr-1", next_hearing_date: daysFromNow(5) }),
      makeRecord({ id: "lr-2", next_hearing_date: daysFromNow(15) }),
      makeRecord({ id: "lr-3", next_hearing_date: daysFromNow(45) }),
    ];
    const result = computeLegalMetrics(records, 3, now);
    expect(result.upcoming_hearings).toBe(2);
  });

  // ── Orders expiring soon (within 30 days) ──

  it("counts order expiring within 30 days", () => {
    const result = computeLegalMetrics(
      [makeRecord({ order_expiry: daysFromNow(15) })],
      1,
      now,
    );
    expect(result.orders_expiring_soon).toBe(1);
  });

  it("counts order expiring today", () => {
    const result = computeLegalMetrics(
      [makeRecord({ order_expiry: daysFromNow(0) })],
      1,
      now,
    );
    expect(result.orders_expiring_soon).toBe(1);
  });

  it("counts order expiring in exactly 30 days", () => {
    const result = computeLegalMetrics(
      [makeRecord({ order_expiry: daysFromNow(30) })],
      1,
      now,
    );
    expect(result.orders_expiring_soon).toBe(1);
  });

  it("does not count order expiring in 31 days", () => {
    const result = computeLegalMetrics(
      [makeRecord({ order_expiry: daysFromNow(31) })],
      1,
      now,
    );
    expect(result.orders_expiring_soon).toBe(0);
  });

  it("does not count already-expired order", () => {
    const result = computeLegalMetrics(
      [makeRecord({ order_expiry: daysFromNow(-1) })],
      1,
      now,
    );
    expect(result.orders_expiring_soon).toBe(0);
  });

  it("does not count null order_expiry", () => {
    const result = computeLegalMetrics(
      [makeRecord({ order_expiry: null })],
      1,
      now,
    );
    expect(result.orders_expiring_soon).toBe(0);
  });

  // ── with_conditions ──

  it("counts records with non-empty conditions array", () => {
    const records = [
      makeRecord({ id: "lr-1", conditions: ["Contact supervised"] }),
      makeRecord({ id: "lr-2", conditions: [] }),
      makeRecord({ id: "lr-3", conditions: ["Curfew", "Reporting"] }),
    ];
    const result = computeLegalMetrics(records, 3, now);
    expect(result.with_conditions).toBe(2);
  });

  it("returns zero with_conditions when all have empty arrays", () => {
    const records = [
      makeRecord({ id: "lr-1", conditions: [] }),
      makeRecord({ id: "lr-2", conditions: [] }),
    ];
    const result = computeLegalMetrics(records, 2, now);
    expect(result.with_conditions).toBe(0);
  });

  // ── with_solicitor ──

  it("counts records with non-null solicitor_name", () => {
    const records = [
      makeRecord({ id: "lr-1", solicitor_name: "Jones & Co" }),
      makeRecord({ id: "lr-2", solicitor_name: null }),
      makeRecord({ id: "lr-3", solicitor_name: "Smith Law" }),
    ];
    const result = computeLegalMetrics(records, 3, now);
    expect(result.with_solicitor).toBe(2);
  });

  it("returns zero with_solicitor when all null", () => {
    const records = [
      makeRecord({ id: "lr-1", solicitor_name: null }),
      makeRecord({ id: "lr-2", solicitor_name: null }),
    ];
    const result = computeLegalMetrics(records, 2, now);
    expect(result.with_solicitor).toBe(0);
  });

  // ── by_legal_status breakdown ──

  it("groups records by legal_status", () => {
    const records = [
      makeRecord({ id: "lr-1", legal_status: "section_20" }),
      makeRecord({ id: "lr-2", legal_status: "section_20" }),
      makeRecord({ id: "lr-3", legal_status: "section_31_full" }),
      makeRecord({ id: "lr-4", legal_status: "placement_order" }),
    ];
    const result = computeLegalMetrics(records, 4, now);
    expect(result.by_legal_status).toEqual({
      section_20: 2,
      section_31_full: 1,
      placement_order: 1,
    });
  });

  it("returns empty by_legal_status for no records", () => {
    const result = computeLegalMetrics([], 0, now);
    expect(result.by_legal_status).toEqual({});
  });

  it("includes all 12 statuses when present", () => {
    const statuses: LegalStatus[] = [
      "section_20", "section_31_full", "section_31_interim", "section_38",
      "section_44", "section_46", "placement_order", "special_guardianship",
      "child_arrangement", "secure_order", "remand", "other",
    ];
    const records = statuses.map((s, i) =>
      makeRecord({ id: `lr-${i}`, child_id: `c-${i}`, legal_status: s }),
    );
    const result = computeLegalMetrics(records, 12, now);
    expect(Object.keys(result.by_legal_status)).toHaveLength(12);
    for (const s of statuses) {
      expect(result.by_legal_status[s]).toBe(1);
    }
  });

  // ── by_order_type breakdown ──

  it("groups records by order_type", () => {
    const records = [
      makeRecord({ id: "lr-1", order_type: "care_order" }),
      makeRecord({ id: "lr-2", order_type: "care_order" }),
      makeRecord({ id: "lr-3", order_type: "supervision_order" }),
    ];
    const result = computeLegalMetrics(records, 3, now);
    expect(result.by_order_type).toEqual({
      care_order: 2,
      supervision_order: 1,
    });
  });

  it("excludes records with null order_type from breakdown", () => {
    const records = [
      makeRecord({ id: "lr-1", order_type: "care_order" }),
      makeRecord({ id: "lr-2", order_type: null }),
    ];
    const result = computeLegalMetrics(records, 2, now);
    expect(result.by_order_type).toEqual({ care_order: 1 });
  });

  it("returns empty by_order_type when all null", () => {
    const records = [
      makeRecord({ id: "lr-1", order_type: null }),
      makeRecord({ id: "lr-2", order_type: null }),
    ];
    const result = computeLegalMetrics(records, 2, now);
    expect(result.by_order_type).toEqual({});
  });

  // ── by_hearing_outcome breakdown ──

  it("groups records by last_hearing_outcome", () => {
    const records = [
      makeRecord({ id: "lr-1", last_hearing_outcome: "order_granted" }),
      makeRecord({ id: "lr-2", last_hearing_outcome: "order_granted" }),
      makeRecord({ id: "lr-3", last_hearing_outcome: "adjourned" }),
    ];
    const result = computeLegalMetrics(records, 3, now);
    expect(result.by_hearing_outcome).toEqual({
      order_granted: 2,
      adjourned: 1,
    });
  });

  it("excludes records with null last_hearing_outcome from breakdown", () => {
    const records = [
      makeRecord({ id: "lr-1", last_hearing_outcome: "pending" }),
      makeRecord({ id: "lr-2", last_hearing_outcome: null }),
    ];
    const result = computeLegalMetrics(records, 2, now);
    expect(result.by_hearing_outcome).toEqual({ pending: 1 });
  });

  it("returns empty by_hearing_outcome when all null", () => {
    const records = [
      makeRecord({ id: "lr-1", last_hearing_outcome: null }),
    ];
    const result = computeLegalMetrics(records, 1, now);
    expect(result.by_hearing_outcome).toEqual({});
  });

  // ── Multiple records combined ──

  it("handles a diverse set of records correctly", () => {
    const records = [
      makeRecord({
        id: "lr-1", child_id: "c1", legal_status: "section_20",
        order_type: "care_order", staff_briefed: true,
        conditions: ["Supervised"], solicitor_name: "Smith",
        next_hearing_date: daysFromNow(5), order_expiry: daysFromNow(10),
        last_hearing_outcome: "order_granted",
      }),
      makeRecord({
        id: "lr-2", child_id: "c2", legal_status: "section_31_full",
        order_type: "interim_care_order", staff_briefed: false,
        conditions: [], solicitor_name: null,
        next_hearing_date: daysFromNow(60), order_expiry: daysFromNow(60),
        last_hearing_outcome: "pending",
      }),
      makeRecord({
        id: "lr-3", child_id: "c3", legal_status: "section_38",
        order_type: null, staff_briefed: true,
        conditions: ["Curfew"], solicitor_name: "Jones",
        next_hearing_date: null, order_expiry: null,
        last_hearing_outcome: null,
      }),
    ];
    const result = computeLegalMetrics(records, 5, now);
    expect(result.total_records).toBe(3);
    expect(result.children_with_records).toBe(3);
    expect(result.legal_coverage).toBe(60);
    expect(result.section_20_count).toBe(1);
    expect(result.full_care_order_count).toBe(1);
    expect(result.interim_care_order_count).toBe(1);
    expect(result.staff_briefed_rate).toBe(66.7);
    expect(result.upcoming_hearings).toBe(1);
    expect(result.orders_expiring_soon).toBe(1);
    expect(result.with_conditions).toBe(2);
    expect(result.with_solicitor).toBe(2);
    expect(result.by_legal_status).toEqual({
      section_20: 1,
      section_31_full: 1,
      section_38: 1,
    });
    expect(result.by_order_type).toEqual({
      care_order: 1,
      interim_care_order: 1,
    });
    expect(result.by_hearing_outcome).toEqual({
      order_granted: 1,
      pending: 1,
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// identifyLegalAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyLegalAlerts", () => {
  // ── No alerts ──

  it("returns empty array when no records and totalChildren is 0", () => {
    const result = identifyLegalAlerts([], 0, now);
    expect(result).toEqual([]);
  });

  it("returns no alerts for a fully compliant record set", () => {
    const result = identifyLegalAlerts(
      [
        makeRecord({
          id: "lr-1",
          child_id: "c1",
          legal_status: "section_31_full",
          staff_briefed: true,
          next_hearing_date: daysFromNow(60),
          order_expiry: daysFromNow(60),
          parental_responsibility: ["Mother"],
        }),
      ],
      1,
      now,
    );
    expect(result).toEqual([]);
  });

  it("returns alerts with correct structure", () => {
    const result = identifyLegalAlerts(
      [makeRecord({ staff_briefed: false })],
      1,
      now,
    );
    expect(result.length).toBeGreaterThan(0);
    for (const alert of result) {
      expect(alert).toHaveProperty("type");
      expect(alert).toHaveProperty("severity");
      expect(alert).toHaveProperty("message");
      expect(alert).toHaveProperty("id");
      expect(["critical", "high", "medium"]).toContain(alert.severity);
    }
  });

  // ── no_legal_record (critical) ──

  it("generates critical alert when children lack legal records", () => {
    const result = identifyLegalAlerts([], 3, now);
    const alerts = result.filter((a) => a.type === "no_legal_record");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].id).toBe("legal_gap");
    expect(alerts[0].message).toContain("3");
  });

  it("generates no_legal_record alert for partial coverage", () => {
    const result = identifyLegalAlerts(
      [makeRecord({ child_id: "c1" })],
      3,
      now,
    );
    const alerts = result.filter((a) => a.type === "no_legal_record");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain("2");
  });

  it("uses singular form for 1 child without record", () => {
    const result = identifyLegalAlerts(
      [makeRecord({ child_id: "c1" })],
      2,
      now,
    );
    const alerts = result.filter((a) => a.type === "no_legal_record");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain("child does");
  });

  it("uses plural form for multiple children without records", () => {
    const result = identifyLegalAlerts([], 3, now);
    const alerts = result.filter((a) => a.type === "no_legal_record");
    expect(alerts[0].message).toContain("children do");
  });

  it("does not generate no_legal_record when all children covered", () => {
    const records = [
      makeRecord({ id: "lr-1", child_id: "c1", staff_briefed: true, legal_status: "section_31_full" }),
      makeRecord({ id: "lr-2", child_id: "c2", staff_briefed: true, legal_status: "section_31_full" }),
    ];
    const result = identifyLegalAlerts(records, 2, now);
    const alerts = result.filter((a) => a.type === "no_legal_record");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate no_legal_record when totalChildren is 0", () => {
    const result = identifyLegalAlerts([], 0, now);
    const alerts = result.filter((a) => a.type === "no_legal_record");
    expect(alerts).toHaveLength(0);
  });

  // ── staff_not_briefed (high) ──

  it("generates high alert when staff not briefed", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        id: "lr-1",
        child_name: "Beth Cooper",
        legal_status: "section_20",
        staff_briefed: false,
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "staff_not_briefed");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("high");
    expect(alerts[0].id).toBe("lr-1");
    expect(alerts[0].message).toContain("Beth Cooper");
    expect(alerts[0].message).toContain("section 20");
  });

  it("does not generate staff_not_briefed when staff is briefed", () => {
    const result = identifyLegalAlerts(
      [makeRecord({ staff_briefed: true })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "staff_not_briefed");
    expect(alerts).toHaveLength(0);
  });

  it("generates staff_not_briefed for each unbriefed record", () => {
    const records = [
      makeRecord({ id: "lr-1", child_name: "A", staff_briefed: false }),
      makeRecord({ id: "lr-2", child_name: "B", staff_briefed: false }),
      makeRecord({ id: "lr-3", child_name: "C", staff_briefed: true }),
    ];
    const result = identifyLegalAlerts(records, 3, now);
    const alerts = result.filter((a) => a.type === "staff_not_briefed");
    expect(alerts).toHaveLength(2);
  });

  it("replaces underscores with spaces in legal_status within staff_not_briefed message", () => {
    const result = identifyLegalAlerts(
      [makeRecord({ legal_status: "section_31_full", staff_briefed: false })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "staff_not_briefed");
    expect(alerts[0].message).toContain("section 31 full");
    expect(alerts[0].message).not.toContain("section_31_full");
  });

  // ── hearing_imminent (high, within 7 days) ──

  it("generates high alert for hearing within 7 days", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        id: "lr-1",
        child_name: "Chris Davis",
        next_hearing_date: daysFromNow(3),
        court_name: "Manchester Family Court",
        staff_briefed: true,
        legal_status: "section_31_full",
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "hearing_imminent");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("high");
    expect(alerts[0].id).toBe("lr-1");
    expect(alerts[0].message).toContain("Chris Davis");
    expect(alerts[0].message).toContain("Manchester Family Court");
  });

  it("generates hearing_imminent for hearing today", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        next_hearing_date: daysFromNow(0),
        staff_briefed: true,
        legal_status: "section_31_full",
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "hearing_imminent");
    expect(alerts).toHaveLength(1);
  });

  it("generates hearing_imminent for hearing in exactly 7 days", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        next_hearing_date: daysFromNow(7),
        staff_briefed: true,
        legal_status: "section_31_full",
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "hearing_imminent");
    expect(alerts).toHaveLength(1);
  });

  it("does not generate hearing_imminent for hearing 8 days away", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        next_hearing_date: daysFromNow(8),
        staff_briefed: true,
        legal_status: "section_31_full",
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "hearing_imminent");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate hearing_imminent for past hearing date", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        next_hearing_date: daysFromNow(-1),
        staff_briefed: true,
        legal_status: "section_31_full",
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "hearing_imminent");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate hearing_imminent for null hearing date", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        next_hearing_date: null,
        staff_briefed: true,
        legal_status: "section_31_full",
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "hearing_imminent");
    expect(alerts).toHaveLength(0);
  });

  it("uses court fallback text when court_name is null", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        next_hearing_date: daysFromNow(2),
        court_name: null,
        staff_briefed: true,
        legal_status: "section_31_full",
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "hearing_imminent");
    expect(alerts[0].message).toContain("court");
  });

  // ── order_expiring (critical, within 14 days) ──

  it("generates critical alert for order expiring within 14 days", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        id: "lr-1",
        child_name: "Dana Ellis",
        order_expiry: daysFromNow(7),
        order_type: "care_order",
        staff_briefed: true,
        legal_status: "section_31_full",
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "order_expiring");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].id).toBe("lr-1");
    expect(alerts[0].message).toContain("Dana Ellis");
    expect(alerts[0].message).toContain("care order");
  });

  it("generates order_expiring for order expiring today", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        order_expiry: daysFromNow(0),
        staff_briefed: true,
        legal_status: "section_31_full",
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "order_expiring");
    expect(alerts).toHaveLength(1);
  });

  it("generates order_expiring for order expiring in exactly 14 days", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        order_expiry: daysFromNow(14),
        staff_briefed: true,
        legal_status: "section_31_full",
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "order_expiring");
    expect(alerts).toHaveLength(1);
  });

  it("does not generate order_expiring for order expiring in 15 days", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        order_expiry: daysFromNow(15),
        staff_briefed: true,
        legal_status: "section_31_full",
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "order_expiring");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate order_expiring for already-expired order", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        order_expiry: daysFromNow(-1),
        staff_briefed: true,
        legal_status: "section_31_full",
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "order_expiring");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate order_expiring for null order_expiry", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        order_expiry: null,
        staff_briefed: true,
        legal_status: "section_31_full",
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "order_expiring");
    expect(alerts).toHaveLength(0);
  });

  it("uses fallback Order when order_type is null in order_expiring message", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        order_expiry: daysFromNow(5),
        order_type: null,
        staff_briefed: true,
        legal_status: "section_31_full",
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "order_expiring");
    expect(alerts[0].message).toContain("Order");
  });

  it("replaces underscores in order_type within order_expiring message", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        order_expiry: daysFromNow(5),
        order_type: "interim_care_order",
        staff_briefed: true,
        legal_status: "section_31_full",
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "order_expiring");
    expect(alerts[0].message).toContain("interim care order");
  });

  // ── pr_not_documented (high, section_20 without parental_responsibility) ──

  it("generates high alert for section_20 without parental_responsibility", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        id: "lr-1",
        child_name: "Eve Fox",
        legal_status: "section_20",
        parental_responsibility: [],
        staff_briefed: true,
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "pr_not_documented");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("high");
    expect(alerts[0].id).toBe("lr-1");
    expect(alerts[0].message).toContain("Eve Fox");
    expect(alerts[0].message).toContain("s.20");
  });

  it("does not generate pr_not_documented when parental_responsibility is documented", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        legal_status: "section_20",
        parental_responsibility: ["Mother"],
        staff_briefed: true,
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "pr_not_documented");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate pr_not_documented for section_31_full even with empty PR", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        legal_status: "section_31_full",
        parental_responsibility: [],
        staff_briefed: true,
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "pr_not_documented");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate pr_not_documented for section_31_interim even with empty PR", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        legal_status: "section_31_interim",
        parental_responsibility: [],
        staff_briefed: true,
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "pr_not_documented");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate pr_not_documented for section_38 even with empty PR", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        legal_status: "section_38",
        parental_responsibility: [],
        staff_briefed: true,
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "pr_not_documented");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate pr_not_documented for placement_order even with empty PR", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        legal_status: "placement_order",
        parental_responsibility: [],
        staff_briefed: true,
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "pr_not_documented");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate pr_not_documented for special_guardianship even with empty PR", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        legal_status: "special_guardianship",
        parental_responsibility: [],
        staff_briefed: true,
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "pr_not_documented");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate pr_not_documented for other status even with empty PR", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        legal_status: "other",
        parental_responsibility: [],
        staff_briefed: true,
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "pr_not_documented");
    expect(alerts).toHaveLength(0);
  });

  // ── Multiple alert types from a single record ──

  it("generates multiple alerts for a single problematic record", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        id: "lr-1",
        legal_status: "section_20",
        staff_briefed: false,
        next_hearing_date: daysFromNow(3),
        order_expiry: daysFromNow(7),
        parental_responsibility: [],
      })],
      1,
      now,
    );
    const types = result.map((a) => a.type);
    expect(types).toContain("staff_not_briefed");
    expect(types).toContain("hearing_imminent");
    expect(types).toContain("order_expiring");
    expect(types).toContain("pr_not_documented");
  });

  // ── Multiple records generating independent alerts ──

  it("generates alerts for multiple records independently", () => {
    const records = [
      makeRecord({
        id: "lr-1", child_id: "c1", child_name: "A",
        staff_briefed: false, legal_status: "section_31_full",
      }),
      makeRecord({
        id: "lr-2", child_id: "c2", child_name: "B",
        staff_briefed: false, legal_status: "section_31_full",
      }),
    ];
    const result = identifyLegalAlerts(records, 2, now);
    const staffAlerts = result.filter((a) => a.type === "staff_not_briefed");
    expect(staffAlerts).toHaveLength(2);
    expect(staffAlerts.map((a) => a.id)).toContain("lr-1");
    expect(staffAlerts.map((a) => a.id)).toContain("lr-2");
  });

  // ── Combined gap and record alerts ──

  it("generates both no_legal_record and record-level alerts together", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        id: "lr-1", child_id: "c1",
        staff_briefed: false,
        legal_status: "section_31_full",
      })],
      3,
      now,
    );
    const types = result.map((a) => a.type);
    expect(types).toContain("no_legal_record");
    expect(types).toContain("staff_not_briefed");
  });

  // ── Clean record generates no alerts ──

  it("generates zero alerts for a section_31_full record with all fields valid", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        legal_status: "section_31_full",
        staff_briefed: true,
        next_hearing_date: daysFromNow(60),
        order_expiry: daysFromNow(60),
        parental_responsibility: ["LA"],
      })],
      1,
      now,
    );
    expect(result).toHaveLength(0);
  });

  it("generates zero alerts for section_20 record with PR documented and all fields valid", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        legal_status: "section_20",
        staff_briefed: true,
        next_hearing_date: daysFromNow(60),
        order_expiry: daysFromNow(60),
        parental_responsibility: ["Mother", "Father"],
      })],
      1,
      now,
    );
    expect(result).toEqual([]);
  });

  it("generates hearing_imminent for multiple records with imminent hearings", () => {
    const records = [
      makeRecord({
        id: "lr-1", child_id: "c1", child_name: "F",
        next_hearing_date: daysFromNow(2), staff_briefed: true,
        legal_status: "section_31_full",
      }),
      makeRecord({
        id: "lr-2", child_id: "c2", child_name: "G",
        next_hearing_date: daysFromNow(5), staff_briefed: true,
        legal_status: "section_31_full",
      }),
    ];
    const result = identifyLegalAlerts(records, 2, now);
    const alerts = result.filter((a) => a.type === "hearing_imminent");
    expect(alerts).toHaveLength(2);
  });

  it("generates order_expiring for multiple records with expiring orders", () => {
    const records = [
      makeRecord({
        id: "lr-1", child_id: "c1",
        order_expiry: daysFromNow(3), staff_briefed: true,
        legal_status: "section_31_full",
      }),
      makeRecord({
        id: "lr-2", child_id: "c2",
        order_expiry: daysFromNow(10), staff_briefed: true,
        legal_status: "section_31_full",
      }),
    ];
    const result = identifyLegalAlerts(records, 2, now);
    const alerts = result.filter((a) => a.type === "order_expiring");
    expect(alerts).toHaveLength(2);
  });

  it("generates pr_not_documented for multiple section_20 records missing PR", () => {
    const records = [
      makeRecord({
        id: "lr-1", child_id: "c1", child_name: "H",
        legal_status: "section_20", parental_responsibility: [],
        staff_briefed: true,
      }),
      makeRecord({
        id: "lr-2", child_id: "c2", child_name: "I",
        legal_status: "section_20", parental_responsibility: [],
        staff_briefed: true,
      }),
    ];
    const result = identifyLegalAlerts(records, 2, now);
    const alerts = result.filter((a) => a.type === "pr_not_documented");
    expect(alerts).toHaveLength(2);
  });

  it("does not generate pr_not_documented for section_44 with empty PR", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        legal_status: "section_44",
        parental_responsibility: [],
        staff_briefed: true,
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "pr_not_documented");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate pr_not_documented for remand with empty PR", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        legal_status: "remand",
        parental_responsibility: [],
        staff_briefed: true,
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "pr_not_documented");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate pr_not_documented for secure_order with empty PR", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        legal_status: "secure_order",
        parental_responsibility: [],
        staff_briefed: true,
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "pr_not_documented");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate pr_not_documented for child_arrangement with empty PR", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        legal_status: "child_arrangement",
        parental_responsibility: [],
        staff_briefed: true,
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "pr_not_documented");
    expect(alerts).toHaveLength(0);
  });

  it("does not generate pr_not_documented for section_46 with empty PR", () => {
    const result = identifyLegalAlerts(
      [makeRecord({
        legal_status: "section_46",
        parental_responsibility: [],
        staff_briefed: true,
      })],
      1,
      now,
    );
    const alerts = result.filter((a) => a.type === "pr_not_documented");
    expect(alerts).toHaveLength(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CRUD fallbacks (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

// ── listRecords ───────────────────────────────────────────────────────────

describe("listRecords", () => {
  it("returns ok with empty array when Supabase is disabled", async () => {
    const result = await listRecords("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("returns ok with empty array when called with filters and Supabase is disabled", async () => {
    const result = await listRecords("home-1", {
      childId: "child-1",
      legalStatus: "section_20",
      limit: 50,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });
});

// ── createRecord ──────────────────────────────────────────────────────────

describe("createRecord", () => {
  it("returns error when Supabase is not configured", async () => {
    const result = await createRecord({
      homeId: "home-1",
      childName: "Test Child",
      childId: "child-1",
      legalStatus: "section_20",
      conditions: [],
      parentalResponsibility: ["Mother"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });
});

// ── updateRecord ──────────────────────────────────────────────────────────

describe("updateRecord", () => {
  it("returns error when Supabase is not configured", async () => {
    const result = await updateRecord("lr-1", { staff_briefed: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });
});
