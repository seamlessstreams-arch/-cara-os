// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MEDICATION ADMINISTRATION SERVICE TESTS
// Pure-function unit tests for administration metrics computation, alert
// identification, and constant validation.
// CHR 2015 Reg 23 (health — medication management),
// Reg 6 (quality and purpose of care — health needs).
//
// Covers: scheduled rounds, PRN, controlled drugs, refusals,
// stock checks, and administration error prevention.
//
// SCCIF: Helped & Protected — "Children's medication is managed
// safely and effectively." "Staff are trained in medication
// administration."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  MEDICATION_TYPES,
  ADMINISTRATION_ROUTES,
  ADMINISTRATION_OUTCOMES,
  WITNESS_STATUSES,
} from "../medication-administration-service";

import type { MedicationAdministration } from "../medication-administration-service";

const { computeAdministrationMetrics, identifyAdministrationAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal MedicationAdministration with sensible defaults. */
function makeRecord(
  overrides: Partial<MedicationAdministration> = {},
): MedicationAdministration {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    child_name: "Alice Smith",
    child_id: "child-1",
    medication_name: "Paracetamol",
    medication_type: "prescribed_regular",
    dosage: "500mg",
    administration_route: "oral",
    administration_outcome: "administered",
    scheduled_time: "2024-06-01T08:00:00.000Z",
    actual_time:
      "actual_time" in (overrides ?? {})
        ? (overrides!.actual_time ?? null)
        : "2024-06-01T08:05:00.000Z",
    administered_by: "Staff Member",
    witness_status: "not_required",
    witness_name:
      "witness_name" in (overrides ?? {})
        ? (overrides!.witness_name ?? null)
        : null,
    reason_for_prn:
      "reason_for_prn" in (overrides ?? {})
        ? (overrides!.reason_for_prn ?? null)
        : null,
    reason_for_refusal:
      "reason_for_refusal" in (overrides ?? {})
        ? (overrides!.reason_for_refusal ?? null)
        : null,
    stock_balance:
      "stock_balance" in (overrides ?? {})
        ? (overrides!.stock_balance ?? null)
        : null,
    controlled_drug: false,
    mar_chart_updated: true,
    side_effects_observed: false,
    side_effects_details:
      "side_effects_details" in (overrides ?? {})
        ? (overrides!.side_effects_details ?? null)
        : null,
    notes:
      "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "2024-06-01T10:00:00.000Z",
    updated_at: "2024-06-01T10:00:00.000Z",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("MEDICATION_TYPES", () => {
  it("has exactly 9 entries", () => {
    expect(MEDICATION_TYPES).toHaveLength(9);
  });

  it("contains unique type values", () => {
    const values = MEDICATION_TYPES.map((t) => t.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = MEDICATION_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const t of MEDICATION_TYPES) {
      expect(t.label.length).toBeGreaterThan(0);
    }
  });

  it("includes prescribed_regular", () => {
    expect(MEDICATION_TYPES.find((t) => t.type === "prescribed_regular")).toBeTruthy();
  });

  it("includes prescribed_prn", () => {
    expect(MEDICATION_TYPES.find((t) => t.type === "prescribed_prn")).toBeTruthy();
  });

  it("includes controlled_drug", () => {
    expect(MEDICATION_TYPES.find((t) => t.type === "controlled_drug")).toBeTruthy();
  });

  it("includes over_the_counter", () => {
    expect(MEDICATION_TYPES.find((t) => t.type === "over_the_counter")).toBeTruthy();
  });

  it("includes homely_remedy", () => {
    expect(MEDICATION_TYPES.find((t) => t.type === "homely_remedy")).toBeTruthy();
  });

  it("includes topical", () => {
    expect(MEDICATION_TYPES.find((t) => t.type === "topical")).toBeTruthy();
  });

  it("includes inhaler", () => {
    expect(MEDICATION_TYPES.find((t) => t.type === "inhaler")).toBeTruthy();
  });

  it("includes epipen", () => {
    expect(MEDICATION_TYPES.find((t) => t.type === "epipen")).toBeTruthy();
  });

  it("includes other", () => {
    expect(MEDICATION_TYPES.find((t) => t.type === "other")).toBeTruthy();
  });
});

describe("ADMINISTRATION_ROUTES", () => {
  it("has exactly 10 entries", () => {
    expect(ADMINISTRATION_ROUTES).toHaveLength(10);
  });

  it("contains unique route values", () => {
    const values = ADMINISTRATION_ROUTES.map((r) => r.route);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = ADMINISTRATION_ROUTES.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const r of ADMINISTRATION_ROUTES) {
      expect(r.label.length).toBeGreaterThan(0);
    }
  });

  it("includes oral", () => {
    expect(ADMINISTRATION_ROUTES.find((r) => r.route === "oral")).toBeTruthy();
  });

  it("includes topical", () => {
    expect(ADMINISTRATION_ROUTES.find((r) => r.route === "topical")).toBeTruthy();
  });

  it("includes inhaled", () => {
    expect(ADMINISTRATION_ROUTES.find((r) => r.route === "inhaled")).toBeTruthy();
  });

  it("includes injection", () => {
    expect(ADMINISTRATION_ROUTES.find((r) => r.route === "injection")).toBeTruthy();
  });

  it("includes sublingual", () => {
    expect(ADMINISTRATION_ROUTES.find((r) => r.route === "sublingual")).toBeTruthy();
  });

  it("includes rectal", () => {
    expect(ADMINISTRATION_ROUTES.find((r) => r.route === "rectal")).toBeTruthy();
  });

  it("includes eye_drops", () => {
    expect(ADMINISTRATION_ROUTES.find((r) => r.route === "eye_drops")).toBeTruthy();
  });

  it("includes ear_drops", () => {
    expect(ADMINISTRATION_ROUTES.find((r) => r.route === "ear_drops")).toBeTruthy();
  });

  it("includes nasal", () => {
    expect(ADMINISTRATION_ROUTES.find((r) => r.route === "nasal")).toBeTruthy();
  });

  it("includes other", () => {
    expect(ADMINISTRATION_ROUTES.find((r) => r.route === "other")).toBeTruthy();
  });
});

describe("ADMINISTRATION_OUTCOMES", () => {
  it("has exactly 8 entries", () => {
    expect(ADMINISTRATION_OUTCOMES).toHaveLength(8);
  });

  it("contains unique outcome values", () => {
    const values = ADMINISTRATION_OUTCOMES.map((o) => o.outcome);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = ADMINISTRATION_OUTCOMES.map((o) => o.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const o of ADMINISTRATION_OUTCOMES) {
      expect(o.label.length).toBeGreaterThan(0);
    }
  });

  it("includes administered", () => {
    expect(ADMINISTRATION_OUTCOMES.find((o) => o.outcome === "administered")).toBeTruthy();
  });

  it("includes refused", () => {
    expect(ADMINISTRATION_OUTCOMES.find((o) => o.outcome === "refused")).toBeTruthy();
  });

  it("includes not_available", () => {
    expect(ADMINISTRATION_OUTCOMES.find((o) => o.outcome === "not_available")).toBeTruthy();
  });

  it("includes withheld", () => {
    expect(ADMINISTRATION_OUTCOMES.find((o) => o.outcome === "withheld")).toBeTruthy();
  });

  it("includes self_administered", () => {
    expect(ADMINISTRATION_OUTCOMES.find((o) => o.outcome === "self_administered")).toBeTruthy();
  });

  it("includes not_required", () => {
    expect(ADMINISTRATION_OUTCOMES.find((o) => o.outcome === "not_required")).toBeTruthy();
  });

  it("includes delayed", () => {
    expect(ADMINISTRATION_OUTCOMES.find((o) => o.outcome === "delayed")).toBeTruthy();
  });

  it("includes other", () => {
    expect(ADMINISTRATION_OUTCOMES.find((o) => o.outcome === "other")).toBeTruthy();
  });
});

describe("WITNESS_STATUSES", () => {
  it("has exactly 3 entries", () => {
    expect(WITNESS_STATUSES).toHaveLength(3);
  });

  it("contains unique status values", () => {
    const values = WITNESS_STATUSES.map((w) => w.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = WITNESS_STATUSES.map((w) => w.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const w of WITNESS_STATUSES) {
      expect(w.label.length).toBeGreaterThan(0);
    }
  });

  it("includes yes_witnessed", () => {
    expect(WITNESS_STATUSES.find((w) => w.status === "yes_witnessed")).toBeTruthy();
  });

  it("includes yes_not_witnessed", () => {
    expect(WITNESS_STATUSES.find((w) => w.status === "yes_not_witnessed")).toBeTruthy();
  });

  it("includes not_required", () => {
    expect(WITNESS_STATUSES.find((w) => w.status === "not_required")).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeAdministrationMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeAdministrationMetrics", () => {
  // ── Empty array ──────────────────────────────────────────────────────
  describe("empty records", () => {
    it("returns zero total_administrations", () => {
      expect(computeAdministrationMetrics([], 0).total_administrations).toBe(0);
    });

    it("returns zero children_with_medication", () => {
      expect(computeAdministrationMetrics([], 0).children_with_medication).toBe(0);
    });

    it("returns zero medication_coverage when totalChildren is 0", () => {
      expect(computeAdministrationMetrics([], 0).medication_coverage).toBe(0);
    });

    it("returns zero medication_coverage when totalChildren > 0 but no records", () => {
      expect(computeAdministrationMetrics([], 5).medication_coverage).toBe(0);
    });

    it("returns zero administered_count", () => {
      expect(computeAdministrationMetrics([], 0).administered_count).toBe(0);
    });

    it("returns zero refused_count", () => {
      expect(computeAdministrationMetrics([], 0).refused_count).toBe(0);
    });

    it("returns zero withheld_count", () => {
      expect(computeAdministrationMetrics([], 0).withheld_count).toBe(0);
    });

    it("returns zero delayed_count", () => {
      expect(computeAdministrationMetrics([], 0).delayed_count).toBe(0);
    });

    it("returns zero self_administered_count", () => {
      expect(computeAdministrationMetrics([], 0).self_administered_count).toBe(0);
    });

    it("returns zero administration_rate", () => {
      expect(computeAdministrationMetrics([], 0).administration_rate).toBe(0);
    });

    it("returns zero refusal_rate", () => {
      expect(computeAdministrationMetrics([], 0).refusal_rate).toBe(0);
    });

    it("returns zero controlled_drug_count", () => {
      expect(computeAdministrationMetrics([], 0).controlled_drug_count).toBe(0);
    });

    it("returns zero controlled_drug_witnessed_rate", () => {
      expect(computeAdministrationMetrics([], 0).controlled_drug_witnessed_rate).toBe(0);
    });

    it("returns zero mar_chart_updated_rate", () => {
      expect(computeAdministrationMetrics([], 0).mar_chart_updated_rate).toBe(0);
    });

    it("returns zero side_effects_count", () => {
      expect(computeAdministrationMetrics([], 0).side_effects_count).toBe(0);
    });

    it("returns zero side_effects_rate", () => {
      expect(computeAdministrationMetrics([], 0).side_effects_rate).toBe(0);
    });

    it("returns zero prn_count", () => {
      expect(computeAdministrationMetrics([], 0).prn_count).toBe(0);
    });

    it("returns empty by_medication_type", () => {
      expect(computeAdministrationMetrics([], 0).by_medication_type).toEqual({});
    });

    it("returns empty by_administration_route", () => {
      expect(computeAdministrationMetrics([], 0).by_administration_route).toEqual({});
    });

    it("returns empty by_administration_outcome", () => {
      expect(computeAdministrationMetrics([], 0).by_administration_outcome).toEqual({});
    });

    it("returns empty by_child", () => {
      expect(computeAdministrationMetrics([], 0).by_child).toEqual({});
    });
  });

  // ── Single record ──────────────────────────────────────────────────
  describe("single record", () => {
    const single = [makeRecord()];

    it("total_administrations is 1", () => {
      expect(computeAdministrationMetrics(single, 1).total_administrations).toBe(1);
    });

    it("children_with_medication is 1", () => {
      expect(computeAdministrationMetrics(single, 1).children_with_medication).toBe(1);
    });

    it("medication_coverage is 100 when totalChildren matches", () => {
      expect(computeAdministrationMetrics(single, 1).medication_coverage).toBe(100);
    });

    it("medication_coverage is 50 when totalChildren is 2", () => {
      expect(computeAdministrationMetrics(single, 2).medication_coverage).toBe(50);
    });

    it("administered_count is 1 for administered record", () => {
      expect(computeAdministrationMetrics(single, 1).administered_count).toBe(1);
    });

    it("refused_count is 0 for administered record", () => {
      expect(computeAdministrationMetrics(single, 1).refused_count).toBe(0);
    });

    it("withheld_count is 0 for administered record", () => {
      expect(computeAdministrationMetrics(single, 1).withheld_count).toBe(0);
    });

    it("delayed_count is 0 for administered record", () => {
      expect(computeAdministrationMetrics(single, 1).delayed_count).toBe(0);
    });

    it("self_administered_count is 0 for administered record", () => {
      expect(computeAdministrationMetrics(single, 1).self_administered_count).toBe(0);
    });

    it("administration_rate is 100 for single administered record", () => {
      expect(computeAdministrationMetrics(single, 1).administration_rate).toBe(100);
    });

    it("refusal_rate is 0 for administered record", () => {
      expect(computeAdministrationMetrics(single, 1).refusal_rate).toBe(0);
    });

    it("controlled_drug_count is 0 when controlled_drug is false", () => {
      expect(computeAdministrationMetrics(single, 1).controlled_drug_count).toBe(0);
    });

    it("controlled_drug_witnessed_rate is 0 when no controlled drugs", () => {
      expect(computeAdministrationMetrics(single, 1).controlled_drug_witnessed_rate).toBe(0);
    });

    it("mar_chart_updated_rate is 100 when mar_chart_updated is true", () => {
      expect(computeAdministrationMetrics(single, 1).mar_chart_updated_rate).toBe(100);
    });

    it("side_effects_count is 0 when side_effects_observed is false", () => {
      expect(computeAdministrationMetrics(single, 1).side_effects_count).toBe(0);
    });

    it("side_effects_rate is 0 when side_effects_observed is false", () => {
      expect(computeAdministrationMetrics(single, 1).side_effects_rate).toBe(0);
    });

    it("prn_count is 0 for prescribed_regular record", () => {
      expect(computeAdministrationMetrics(single, 1).prn_count).toBe(0);
    });

    it("by_medication_type groups single record correctly", () => {
      expect(computeAdministrationMetrics(single, 1).by_medication_type).toEqual({ prescribed_regular: 1 });
    });

    it("by_administration_route groups single record correctly", () => {
      expect(computeAdministrationMetrics(single, 1).by_administration_route).toEqual({ oral: 1 });
    });

    it("by_administration_outcome groups single record correctly", () => {
      expect(computeAdministrationMetrics(single, 1).by_administration_outcome).toEqual({ administered: 1 });
    });

    it("by_child groups single record using child_name", () => {
      expect(computeAdministrationMetrics(single, 1).by_child).toEqual({ "Alice Smith": 1 });
    });
  });

  // ── Multiple records ─────────────────────────────────────────────────
  describe("multiple records", () => {
    const records = [
      makeRecord({
        id: "r-1",
        child_id: "child-1",
        child_name: "Alice Smith",
        medication_type: "prescribed_regular",
        administration_route: "oral",
        administration_outcome: "administered",
        controlled_drug: false,
        mar_chart_updated: true,
        side_effects_observed: false,
      }),
      makeRecord({
        id: "r-2",
        child_id: "child-2",
        child_name: "Bob Jones",
        medication_type: "prescribed_prn",
        administration_route: "inhaled",
        administration_outcome: "refused",
        controlled_drug: false,
        mar_chart_updated: false,
        side_effects_observed: false,
      }),
      makeRecord({
        id: "r-3",
        child_id: "child-3",
        child_name: "Charlie Brown",
        medication_type: "controlled_drug",
        administration_route: "oral",
        administration_outcome: "administered",
        controlled_drug: true,
        witness_status: "yes_witnessed",
        mar_chart_updated: true,
        side_effects_observed: true,
        side_effects_details: "Mild nausea",
      }),
      makeRecord({
        id: "r-4",
        child_id: "child-4",
        child_name: "Diana Prince",
        medication_type: "over_the_counter",
        administration_route: "topical",
        administration_outcome: "withheld",
        controlled_drug: false,
        mar_chart_updated: true,
        side_effects_observed: false,
      }),
      makeRecord({
        id: "r-5",
        child_id: "child-5",
        child_name: "Eve Green",
        medication_type: "inhaler",
        administration_route: "inhaled",
        administration_outcome: "self_administered",
        controlled_drug: false,
        mar_chart_updated: false,
        side_effects_observed: false,
      }),
      makeRecord({
        id: "r-6",
        child_id: "child-1",
        child_name: "Alice Smith",
        medication_type: "prescribed_regular",
        administration_route: "oral",
        administration_outcome: "delayed",
        controlled_drug: false,
        mar_chart_updated: true,
        side_effects_observed: false,
      }),
    ];

    it("total_administrations is 6", () => {
      expect(computeAdministrationMetrics(records, 6).total_administrations).toBe(6);
    });

    it("children_with_medication counts unique child_ids (5)", () => {
      expect(computeAdministrationMetrics(records, 6).children_with_medication).toBe(5);
    });

    it("medication_coverage is 83.3 for 5 of 6 children", () => {
      expect(computeAdministrationMetrics(records, 6).medication_coverage).toBe(83.3);
    });

    it("administered_count is 2", () => {
      expect(computeAdministrationMetrics(records, 6).administered_count).toBe(2);
    });

    it("refused_count is 1", () => {
      expect(computeAdministrationMetrics(records, 6).refused_count).toBe(1);
    });

    it("withheld_count is 1", () => {
      expect(computeAdministrationMetrics(records, 6).withheld_count).toBe(1);
    });

    it("delayed_count is 1", () => {
      expect(computeAdministrationMetrics(records, 6).delayed_count).toBe(1);
    });

    it("self_administered_count is 1", () => {
      expect(computeAdministrationMetrics(records, 6).self_administered_count).toBe(1);
    });

    it("administration_rate is 33.3 (2 of 6)", () => {
      expect(computeAdministrationMetrics(records, 6).administration_rate).toBe(33.3);
    });

    it("refusal_rate is 16.7 (1 of 6)", () => {
      expect(computeAdministrationMetrics(records, 6).refusal_rate).toBe(16.7);
    });

    it("controlled_drug_count is 1", () => {
      expect(computeAdministrationMetrics(records, 6).controlled_drug_count).toBe(1);
    });

    it("controlled_drug_witnessed_rate is 100 (1 witnessed of 1 controlled)", () => {
      expect(computeAdministrationMetrics(records, 6).controlled_drug_witnessed_rate).toBe(100);
    });

    it("mar_chart_updated_rate is 66.7 (4 of 6)", () => {
      expect(computeAdministrationMetrics(records, 6).mar_chart_updated_rate).toBe(66.7);
    });

    it("side_effects_count is 1", () => {
      expect(computeAdministrationMetrics(records, 6).side_effects_count).toBe(1);
    });

    it("side_effects_rate is 16.7 (1 of 6)", () => {
      expect(computeAdministrationMetrics(records, 6).side_effects_rate).toBe(16.7);
    });

    it("prn_count is 1", () => {
      expect(computeAdministrationMetrics(records, 6).prn_count).toBe(1);
    });

    it("by_medication_type groups correctly", () => {
      expect(computeAdministrationMetrics(records, 6).by_medication_type).toEqual({
        prescribed_regular: 2,
        prescribed_prn: 1,
        controlled_drug: 1,
        over_the_counter: 1,
        inhaler: 1,
      });
    });

    it("by_administration_route groups correctly", () => {
      expect(computeAdministrationMetrics(records, 6).by_administration_route).toEqual({
        oral: 3,
        inhaled: 2,
        topical: 1,
      });
    });

    it("by_administration_outcome groups correctly", () => {
      expect(computeAdministrationMetrics(records, 6).by_administration_outcome).toEqual({
        administered: 2,
        refused: 1,
        withheld: 1,
        self_administered: 1,
        delayed: 1,
      });
    });

    it("by_child groups using child_name correctly", () => {
      expect(computeAdministrationMetrics(records, 6).by_child).toEqual({
        "Alice Smith": 2,
        "Bob Jones": 1,
        "Charlie Brown": 1,
        "Diana Prince": 1,
        "Eve Green": 1,
      });
    });
  });

  // ── medication_coverage edge cases ─────────────────────────────────
  describe("medication_coverage edge cases", () => {
    it("returns 0 when totalChildren is 0 and there are records", () => {
      const m = computeAdministrationMetrics([makeRecord()], 0);
      expect(m.medication_coverage).toBe(0);
    });

    it("returns 100 when all children covered", () => {
      const records = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c2" }),
      ];
      expect(computeAdministrationMetrics(records, 2).medication_coverage).toBe(100);
    });

    it("deduplicates children for coverage", () => {
      const records = [
        makeRecord({ id: "r-1", child_id: "c1" }),
        makeRecord({ id: "r-2", child_id: "c1" }),
        makeRecord({ id: "r-3", child_id: "c1" }),
      ];
      expect(computeAdministrationMetrics(records, 3).children_with_medication).toBe(1);
      expect(computeAdministrationMetrics(records, 3).medication_coverage).toBe(33.3);
    });

    it("rounds coverage to one decimal place (1/3 = 33.3)", () => {
      const records = [makeRecord({ child_id: "c1" })];
      expect(computeAdministrationMetrics(records, 3).medication_coverage).toBe(33.3);
    });

    it("handles 2/3 coverage rounding (66.7)", () => {
      const records = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c2" }),
      ];
      expect(computeAdministrationMetrics(records, 3).medication_coverage).toBe(66.7);
    });
  });

  // ── Outcome counts ─────────────────────────────────────────────────
  describe("outcome counts", () => {
    it("counts only administered outcomes", () => {
      const records = [
        makeRecord({ id: "1", administration_outcome: "administered" }),
        makeRecord({ id: "2", administration_outcome: "refused" }),
        makeRecord({ id: "3", administration_outcome: "administered" }),
      ];
      expect(computeAdministrationMetrics(records, 3).administered_count).toBe(2);
    });

    it("counts only refused outcomes", () => {
      const records = [
        makeRecord({ id: "1", administration_outcome: "refused" }),
        makeRecord({ id: "2", administration_outcome: "refused" }),
        makeRecord({ id: "3", administration_outcome: "administered" }),
      ];
      expect(computeAdministrationMetrics(records, 3).refused_count).toBe(2);
    });

    it("counts only withheld outcomes", () => {
      const records = [
        makeRecord({ id: "1", administration_outcome: "withheld" }),
        makeRecord({ id: "2", administration_outcome: "administered" }),
        makeRecord({ id: "3", administration_outcome: "withheld" }),
        makeRecord({ id: "4", administration_outcome: "withheld" }),
      ];
      expect(computeAdministrationMetrics(records, 4).withheld_count).toBe(3);
    });

    it("counts only delayed outcomes", () => {
      const records = [
        makeRecord({ id: "1", administration_outcome: "delayed" }),
        makeRecord({ id: "2", administration_outcome: "delayed" }),
        makeRecord({ id: "3", administration_outcome: "administered" }),
      ];
      expect(computeAdministrationMetrics(records, 3).delayed_count).toBe(2);
    });

    it("counts only self_administered outcomes", () => {
      const records = [
        makeRecord({ id: "1", administration_outcome: "self_administered" }),
        makeRecord({ id: "2", administration_outcome: "administered" }),
        makeRecord({ id: "3", administration_outcome: "self_administered" }),
      ];
      expect(computeAdministrationMetrics(records, 3).self_administered_count).toBe(2);
    });

    it("returns zero for absent outcome types", () => {
      const records = [
        makeRecord({ id: "1", administration_outcome: "administered" }),
        makeRecord({ id: "2", administration_outcome: "administered" }),
      ];
      const m = computeAdministrationMetrics(records, 2);
      expect(m.refused_count).toBe(0);
      expect(m.withheld_count).toBe(0);
      expect(m.delayed_count).toBe(0);
      expect(m.self_administered_count).toBe(0);
    });
  });

  // ── administration_rate ────────────────────────────────────────────
  describe("administration_rate", () => {
    it("is 100 when all are administered", () => {
      const records = [
        makeRecord({ id: "1", administration_outcome: "administered" }),
        makeRecord({ id: "2", administration_outcome: "administered" }),
      ];
      expect(computeAdministrationMetrics(records, 2).administration_rate).toBe(100);
    });

    it("is 0 when none are administered", () => {
      const records = [
        makeRecord({ id: "1", administration_outcome: "refused" }),
        makeRecord({ id: "2", administration_outcome: "withheld" }),
      ];
      expect(computeAdministrationMetrics(records, 2).administration_rate).toBe(0);
    });

    it("is 50 for 1 of 2", () => {
      const records = [
        makeRecord({ id: "1", administration_outcome: "administered" }),
        makeRecord({ id: "2", administration_outcome: "refused" }),
      ];
      expect(computeAdministrationMetrics(records, 2).administration_rate).toBe(50);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const records = [
        makeRecord({ id: "1", administration_outcome: "administered" }),
        makeRecord({ id: "2", administration_outcome: "refused" }),
        makeRecord({ id: "3", administration_outcome: "withheld" }),
      ];
      expect(computeAdministrationMetrics(records, 3).administration_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const records = [
        makeRecord({ id: "1", administration_outcome: "administered" }),
        makeRecord({ id: "2", administration_outcome: "administered" }),
        makeRecord({ id: "3", administration_outcome: "refused" }),
      ];
      expect(computeAdministrationMetrics(records, 3).administration_rate).toBe(66.7);
    });
  });

  // ── refusal_rate ───────────────────────────────────────────────────
  describe("refusal_rate", () => {
    it("is 100 when all are refused", () => {
      const records = [
        makeRecord({ id: "1", administration_outcome: "refused" }),
        makeRecord({ id: "2", administration_outcome: "refused" }),
      ];
      expect(computeAdministrationMetrics(records, 2).refusal_rate).toBe(100);
    });

    it("is 0 when none are refused", () => {
      const records = [
        makeRecord({ id: "1", administration_outcome: "administered" }),
        makeRecord({ id: "2", administration_outcome: "administered" }),
      ];
      expect(computeAdministrationMetrics(records, 2).refusal_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const records = [
        makeRecord({ id: "1", administration_outcome: "refused" }),
        makeRecord({ id: "2", administration_outcome: "administered" }),
        makeRecord({ id: "3", administration_outcome: "administered" }),
      ];
      expect(computeAdministrationMetrics(records, 3).refusal_rate).toBe(33.3);
    });
  });

  // ── controlled_drug_witnessed_rate ─────────────────────────────────
  describe("controlled_drug_witnessed_rate", () => {
    it("is 0 when no controlled drugs exist", () => {
      const records = [
        makeRecord({ id: "1", controlled_drug: false }),
      ];
      expect(computeAdministrationMetrics(records, 1).controlled_drug_witnessed_rate).toBe(0);
    });

    it("is 100 when all controlled drugs are witnessed", () => {
      const records = [
        makeRecord({ id: "1", controlled_drug: true, witness_status: "yes_witnessed" }),
        makeRecord({ id: "2", controlled_drug: true, witness_status: "yes_witnessed" }),
      ];
      expect(computeAdministrationMetrics(records, 2).controlled_drug_witnessed_rate).toBe(100);
    });

    it("is 0 when no controlled drugs are witnessed", () => {
      const records = [
        makeRecord({ id: "1", controlled_drug: true, witness_status: "yes_not_witnessed" }),
        makeRecord({ id: "2", controlled_drug: true, witness_status: "not_required" }),
      ];
      expect(computeAdministrationMetrics(records, 2).controlled_drug_witnessed_rate).toBe(0);
    });

    it("is 50 for 1 witnessed of 2 controlled drugs", () => {
      const records = [
        makeRecord({ id: "1", controlled_drug: true, witness_status: "yes_witnessed" }),
        makeRecord({ id: "2", controlled_drug: true, witness_status: "yes_not_witnessed" }),
      ];
      expect(computeAdministrationMetrics(records, 2).controlled_drug_witnessed_rate).toBe(50);
    });

    it("denominator is controlled drugs only, not all records", () => {
      const records = [
        makeRecord({ id: "1", controlled_drug: true, witness_status: "yes_witnessed" }),
        makeRecord({ id: "2", controlled_drug: false, witness_status: "not_required" }),
        makeRecord({ id: "3", controlled_drug: false, witness_status: "not_required" }),
      ];
      // 1 witnessed / 1 controlled drug = 100
      expect(computeAdministrationMetrics(records, 3).controlled_drug_witnessed_rate).toBe(100);
    });

    it("rounds correctly for 1 of 3 controlled drugs (33.3)", () => {
      const records = [
        makeRecord({ id: "1", controlled_drug: true, witness_status: "yes_witnessed" }),
        makeRecord({ id: "2", controlled_drug: true, witness_status: "yes_not_witnessed" }),
        makeRecord({ id: "3", controlled_drug: true, witness_status: "not_required" }),
      ];
      expect(computeAdministrationMetrics(records, 3).controlled_drug_witnessed_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 controlled drugs (66.7)", () => {
      const records = [
        makeRecord({ id: "1", controlled_drug: true, witness_status: "yes_witnessed" }),
        makeRecord({ id: "2", controlled_drug: true, witness_status: "yes_witnessed" }),
        makeRecord({ id: "3", controlled_drug: true, witness_status: "yes_not_witnessed" }),
      ];
      expect(computeAdministrationMetrics(records, 3).controlled_drug_witnessed_rate).toBe(66.7);
    });

    it("controlled_drug_count counts all controlled drugs", () => {
      const records = [
        makeRecord({ id: "1", controlled_drug: true }),
        makeRecord({ id: "2", controlled_drug: true }),
        makeRecord({ id: "3", controlled_drug: false }),
      ];
      expect(computeAdministrationMetrics(records, 3).controlled_drug_count).toBe(2);
    });
  });

  // ── mar_chart_updated_rate ─────────────────────────────────────────
  describe("mar_chart_updated_rate", () => {
    it("is 100 when all MAR charts updated", () => {
      const records = [
        makeRecord({ id: "1", mar_chart_updated: true }),
        makeRecord({ id: "2", mar_chart_updated: true }),
      ];
      expect(computeAdministrationMetrics(records, 2).mar_chart_updated_rate).toBe(100);
    });

    it("is 0 when no MAR charts updated", () => {
      const records = [
        makeRecord({ id: "1", mar_chart_updated: false }),
        makeRecord({ id: "2", mar_chart_updated: false }),
      ];
      expect(computeAdministrationMetrics(records, 2).mar_chart_updated_rate).toBe(0);
    });

    it("is 50 for 1 of 2", () => {
      const records = [
        makeRecord({ id: "1", mar_chart_updated: true }),
        makeRecord({ id: "2", mar_chart_updated: false }),
      ];
      expect(computeAdministrationMetrics(records, 2).mar_chart_updated_rate).toBe(50);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const records = [
        makeRecord({ id: "1", mar_chart_updated: true }),
        makeRecord({ id: "2", mar_chart_updated: false }),
        makeRecord({ id: "3", mar_chart_updated: false }),
      ];
      expect(computeAdministrationMetrics(records, 3).mar_chart_updated_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const records = [
        makeRecord({ id: "1", mar_chart_updated: true }),
        makeRecord({ id: "2", mar_chart_updated: true }),
        makeRecord({ id: "3", mar_chart_updated: false }),
      ];
      expect(computeAdministrationMetrics(records, 3).mar_chart_updated_rate).toBe(66.7);
    });
  });

  // ── side_effects_rate ──────────────────────────────────────────────
  describe("side_effects_rate", () => {
    it("is 100 when all have side effects", () => {
      const records = [
        makeRecord({ id: "1", side_effects_observed: true }),
        makeRecord({ id: "2", side_effects_observed: true }),
      ];
      expect(computeAdministrationMetrics(records, 2).side_effects_rate).toBe(100);
    });

    it("is 0 when none have side effects", () => {
      const records = [
        makeRecord({ id: "1", side_effects_observed: false }),
        makeRecord({ id: "2", side_effects_observed: false }),
      ];
      expect(computeAdministrationMetrics(records, 2).side_effects_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const records = [
        makeRecord({ id: "1", side_effects_observed: true }),
        makeRecord({ id: "2", side_effects_observed: false }),
        makeRecord({ id: "3", side_effects_observed: false }),
      ];
      expect(computeAdministrationMetrics(records, 3).side_effects_rate).toBe(33.3);
    });

    it("side_effects_count counts correctly", () => {
      const records = [
        makeRecord({ id: "1", side_effects_observed: true }),
        makeRecord({ id: "2", side_effects_observed: true }),
        makeRecord({ id: "3", side_effects_observed: false }),
      ];
      expect(computeAdministrationMetrics(records, 3).side_effects_count).toBe(2);
    });
  });

  // ── prn_count ──────────────────────────────────────────────────────
  describe("prn_count", () => {
    it("counts only prescribed_prn medication type", () => {
      const records = [
        makeRecord({ id: "1", medication_type: "prescribed_prn" }),
        makeRecord({ id: "2", medication_type: "prescribed_prn" }),
        makeRecord({ id: "3", medication_type: "prescribed_regular" }),
      ];
      expect(computeAdministrationMetrics(records, 3).prn_count).toBe(2);
    });

    it("returns 0 when no PRN records", () => {
      const records = [
        makeRecord({ id: "1", medication_type: "prescribed_regular" }),
        makeRecord({ id: "2", medication_type: "controlled_drug" }),
      ];
      expect(computeAdministrationMetrics(records, 2).prn_count).toBe(0);
    });

    it("does not count controlled_drug as PRN", () => {
      const records = [
        makeRecord({ id: "1", medication_type: "controlled_drug" }),
      ];
      expect(computeAdministrationMetrics(records, 1).prn_count).toBe(0);
    });
  });

  // ── by_ breakdown maps ────────────────────────────────────────────
  describe("by_ breakdown maps", () => {
    it("by_medication_type handles multiple types", () => {
      const records = [
        makeRecord({ id: "1", medication_type: "prescribed_regular" }),
        makeRecord({ id: "2", medication_type: "prescribed_regular" }),
        makeRecord({ id: "3", medication_type: "inhaler" }),
        makeRecord({ id: "4", medication_type: "epipen" }),
      ];
      expect(computeAdministrationMetrics(records, 4).by_medication_type).toEqual({
        prescribed_regular: 2,
        inhaler: 1,
        epipen: 1,
      });
    });

    it("by_administration_route handles multiple routes", () => {
      const records = [
        makeRecord({ id: "1", administration_route: "oral" }),
        makeRecord({ id: "2", administration_route: "oral" }),
        makeRecord({ id: "3", administration_route: "injection" }),
        makeRecord({ id: "4", administration_route: "sublingual" }),
      ];
      expect(computeAdministrationMetrics(records, 4).by_administration_route).toEqual({
        oral: 2,
        injection: 1,
        sublingual: 1,
      });
    });

    it("by_administration_outcome handles all outcomes present", () => {
      const records = [
        makeRecord({ id: "1", administration_outcome: "administered" }),
        makeRecord({ id: "2", administration_outcome: "refused" }),
        makeRecord({ id: "3", administration_outcome: "not_available" }),
        makeRecord({ id: "4", administration_outcome: "withheld" }),
        makeRecord({ id: "5", administration_outcome: "self_administered" }),
        makeRecord({ id: "6", administration_outcome: "not_required" }),
        makeRecord({ id: "7", administration_outcome: "delayed" }),
        makeRecord({ id: "8", administration_outcome: "other" }),
      ];
      expect(computeAdministrationMetrics(records, 8).by_administration_outcome).toEqual({
        administered: 1,
        refused: 1,
        not_available: 1,
        withheld: 1,
        self_administered: 1,
        not_required: 1,
        delayed: 1,
        other: 1,
      });
    });

    it("by_child uses child_name (not child_id)", () => {
      const records = [
        makeRecord({ id: "1", child_id: "c1", child_name: "Alice" }),
        makeRecord({ id: "2", child_id: "c1", child_name: "Alice" }),
        makeRecord({ id: "3", child_id: "c2", child_name: "Bob" }),
      ];
      const result = computeAdministrationMetrics(records, 2).by_child;
      expect(result).toEqual({ Alice: 2, Bob: 1 });
      expect(result["c1"]).toBeUndefined();
      expect(result["c2"]).toBeUndefined();
    });

    it("by_child handles multiple children with different counts", () => {
      const records = [
        makeRecord({ id: "1", child_id: "c1", child_name: "Alice" }),
        makeRecord({ id: "2", child_id: "c1", child_name: "Alice" }),
        makeRecord({ id: "3", child_id: "c1", child_name: "Alice" }),
        makeRecord({ id: "4", child_id: "c2", child_name: "Bob" }),
        makeRecord({ id: "5", child_id: "c3", child_name: "Charlie" }),
        makeRecord({ id: "6", child_id: "c3", child_name: "Charlie" }),
      ];
      expect(computeAdministrationMetrics(records, 3).by_child).toEqual({
        Alice: 3,
        Bob: 1,
        Charlie: 2,
      });
    });
  });

  // ── Rate rounding consistency ──────────────────────────────────────
  describe("rate rounding consistency", () => {
    it("all rates use Math.round(value * 1000) / 10 formula", () => {
      // 3 administered, 1 refused, 1 withheld, 1 delayed = 6 total
      // 2 controlled drugs (1 witnessed), 4 MAR updated, 2 side effects
      const records = [
        makeRecord({ id: "1", administration_outcome: "administered", controlled_drug: true, witness_status: "yes_witnessed", mar_chart_updated: true, side_effects_observed: true }),
        makeRecord({ id: "2", administration_outcome: "administered", controlled_drug: true, witness_status: "yes_not_witnessed", mar_chart_updated: true, side_effects_observed: true }),
        makeRecord({ id: "3", administration_outcome: "administered", controlled_drug: false, mar_chart_updated: true, side_effects_observed: false }),
        makeRecord({ id: "4", administration_outcome: "refused", controlled_drug: false, mar_chart_updated: true, side_effects_observed: false }),
        makeRecord({ id: "5", administration_outcome: "withheld", controlled_drug: false, mar_chart_updated: false, side_effects_observed: false }),
        makeRecord({ id: "6", administration_outcome: "delayed", controlled_drug: false, mar_chart_updated: false, side_effects_observed: false }),
      ];
      const m = computeAdministrationMetrics(records, 6);
      // 3/6 = 50
      expect(m.administration_rate).toBe(50);
      // 1/6 = 16.7
      expect(m.refusal_rate).toBe(16.7);
      // 1/2 = 50 (controlled drugs only)
      expect(m.controlled_drug_witnessed_rate).toBe(50);
      // 4/6 = 66.7
      expect(m.mar_chart_updated_rate).toBe(66.7);
      // 2/6 = 33.3
      expect(m.side_effects_rate).toBe(33.3);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyAdministrationAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyAdministrationAlerts", () => {
  // ── No alerts ──────────────────────────────────────────────────────
  describe("no alerts scenario", () => {
    it("returns empty array for empty records", () => {
      expect(identifyAdministrationAlerts([])).toEqual([]);
    });

    it("returns empty array when everything is well-managed", () => {
      const records = [
        makeRecord({
          id: "r-1",
          administration_outcome: "administered",
          controlled_drug: false,
          mar_chart_updated: true,
          side_effects_observed: false,
        }),
      ];
      expect(identifyAdministrationAlerts(records)).toEqual([]);
    });

    it("returns empty for controlled drug that is witnessed", () => {
      const records = [
        makeRecord({
          id: "r-1",
          controlled_drug: true,
          witness_status: "yes_witnessed",
          administration_outcome: "administered",
          mar_chart_updated: true,
        }),
      ];
      expect(identifyAdministrationAlerts(records)).toEqual([]);
    });

    it("returns empty when all MAR charts are updated", () => {
      const records = [
        makeRecord({ id: "r-1", mar_chart_updated: true }),
        makeRecord({ id: "r-2", mar_chart_updated: true }),
      ];
      expect(identifyAdministrationAlerts(records)).toEqual([]);
    });
  });

  // ── cd_not_witnessed alert (critical) ──────────────────────────────
  describe("cd_not_witnessed alert", () => {
    it("fires when controlled_drug is true, witness_status is yes_not_witnessed, and outcome is administered", () => {
      const records = [
        makeRecord({
          id: "r-1",
          controlled_drug: true,
          witness_status: "yes_not_witnessed",
          administration_outcome: "administered",
          medication_name: "Methylphenidate",
          child_name: "Alice Smith",
          mar_chart_updated: true,
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const cd = alerts.find((a) => a.type === "cd_not_witnessed");
      expect(cd).toBeTruthy();
    });

    it("has critical severity", () => {
      const records = [
        makeRecord({
          id: "r-1",
          controlled_drug: true,
          witness_status: "yes_not_witnessed",
          administration_outcome: "administered",
          mar_chart_updated: true,
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const cd = alerts.find((a) => a.type === "cd_not_witnessed")!;
      expect(cd.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const records = [
        makeRecord({
          id: "r-42",
          controlled_drug: true,
          witness_status: "yes_not_witnessed",
          administration_outcome: "administered",
          mar_chart_updated: true,
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const cd = alerts.find((a) => a.type === "cd_not_witnessed")!;
      expect(cd.id).toBe("r-42");
    });

    it("message contains medication_name", () => {
      const records = [
        makeRecord({
          id: "r-1",
          controlled_drug: true,
          witness_status: "yes_not_witnessed",
          administration_outcome: "administered",
          medication_name: "Ritalin",
          mar_chart_updated: true,
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const cd = alerts.find((a) => a.type === "cd_not_witnessed")!;
      expect(cd.message).toContain("Ritalin");
    });

    it("message contains child_name", () => {
      const records = [
        makeRecord({
          id: "r-1",
          controlled_drug: true,
          witness_status: "yes_not_witnessed",
          administration_outcome: "administered",
          child_name: "Bobby Brown",
          mar_chart_updated: true,
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const cd = alerts.find((a) => a.type === "cd_not_witnessed")!;
      expect(cd.message).toContain("Bobby Brown");
    });

    it("does NOT fire when controlled_drug is false", () => {
      const records = [
        makeRecord({
          id: "r-1",
          controlled_drug: false,
          witness_status: "yes_not_witnessed",
          administration_outcome: "administered",
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      expect(alerts.find((a) => a.type === "cd_not_witnessed")).toBeUndefined();
    });

    it("does NOT fire when witness_status is yes_witnessed", () => {
      const records = [
        makeRecord({
          id: "r-1",
          controlled_drug: true,
          witness_status: "yes_witnessed",
          administration_outcome: "administered",
          mar_chart_updated: true,
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      expect(alerts.find((a) => a.type === "cd_not_witnessed")).toBeUndefined();
    });

    it("does NOT fire when witness_status is not_required", () => {
      const records = [
        makeRecord({
          id: "r-1",
          controlled_drug: true,
          witness_status: "not_required",
          administration_outcome: "administered",
          mar_chart_updated: true,
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      expect(alerts.find((a) => a.type === "cd_not_witnessed")).toBeUndefined();
    });

    it("does NOT fire when outcome is refused (not administered)", () => {
      const records = [
        makeRecord({
          id: "r-1",
          controlled_drug: true,
          witness_status: "yes_not_witnessed",
          administration_outcome: "refused",
          mar_chart_updated: true,
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      expect(alerts.find((a) => a.type === "cd_not_witnessed")).toBeUndefined();
    });

    it("does NOT fire when outcome is not_available", () => {
      const records = [
        makeRecord({
          id: "r-1",
          controlled_drug: true,
          witness_status: "yes_not_witnessed",
          administration_outcome: "not_available",
          mar_chart_updated: true,
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      expect(alerts.find((a) => a.type === "cd_not_witnessed")).toBeUndefined();
    });

    it("fires per record for multiple unwitnessed controlled drugs", () => {
      const records = [
        makeRecord({
          id: "r-1",
          controlled_drug: true,
          witness_status: "yes_not_witnessed",
          administration_outcome: "administered",
          mar_chart_updated: true,
        }),
        makeRecord({
          id: "r-2",
          controlled_drug: true,
          witness_status: "yes_not_witnessed",
          administration_outcome: "administered",
          mar_chart_updated: true,
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const cd = alerts.filter((a) => a.type === "cd_not_witnessed");
      expect(cd).toHaveLength(2);
    });

    it("fires only for qualifying records among mixed set", () => {
      const records = [
        makeRecord({
          id: "r-1",
          controlled_drug: true,
          witness_status: "yes_not_witnessed",
          administration_outcome: "administered",
          mar_chart_updated: true,
        }),
        makeRecord({
          id: "r-2",
          controlled_drug: true,
          witness_status: "yes_witnessed",
          administration_outcome: "administered",
          mar_chart_updated: true,
        }),
        makeRecord({
          id: "r-3",
          controlled_drug: false,
          witness_status: "not_required",
          administration_outcome: "administered",
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const cd = alerts.filter((a) => a.type === "cd_not_witnessed");
      expect(cd).toHaveLength(1);
      expect(cd[0].id).toBe("r-1");
    });
  });

  // ── side_effects alert (high) ─────────────────────────────────────
  describe("side_effects alert", () => {
    it("fires when side_effects_observed is true", () => {
      const records = [
        makeRecord({
          id: "r-1",
          side_effects_observed: true,
          side_effects_details: "Nausea and headache",
          child_name: "Alice Smith",
          medication_name: "Ibuprofen",
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const se = alerts.find((a) => a.type === "side_effects");
      expect(se).toBeTruthy();
    });

    it("has high severity", () => {
      const records = [
        makeRecord({
          id: "r-1",
          side_effects_observed: true,
          side_effects_details: "Rash",
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const se = alerts.find((a) => a.type === "side_effects")!;
      expect(se.severity).toBe("high");
    });

    it("uses the record id as alert id", () => {
      const records = [
        makeRecord({
          id: "r-99",
          side_effects_observed: true,
          side_effects_details: "Drowsiness",
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const se = alerts.find((a) => a.type === "side_effects")!;
      expect(se.id).toBe("r-99");
    });

    it("message contains child_name", () => {
      const records = [
        makeRecord({
          id: "r-1",
          side_effects_observed: true,
          side_effects_details: "Dizziness",
          child_name: "Emma White",
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const se = alerts.find((a) => a.type === "side_effects")!;
      expect(se.message).toContain("Emma White");
    });

    it("message contains medication_name", () => {
      const records = [
        makeRecord({
          id: "r-1",
          side_effects_observed: true,
          side_effects_details: "Stomach pain",
          medication_name: "Aspirin",
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const se = alerts.find((a) => a.type === "side_effects")!;
      expect(se.message).toContain("Aspirin");
    });

    it("message includes side_effects_details when provided", () => {
      const records = [
        makeRecord({
          id: "r-1",
          side_effects_observed: true,
          side_effects_details: "Severe vomiting and tremors",
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const se = alerts.find((a) => a.type === "side_effects")!;
      expect(se.message).toContain("Severe vomiting and tremors");
    });

    it("message shows 'details not recorded' when side_effects_details is null", () => {
      const records = [
        makeRecord({
          id: "r-1",
          side_effects_observed: true,
          side_effects_details: null,
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const se = alerts.find((a) => a.type === "side_effects")!;
      expect(se.message).toContain("details not recorded");
    });

    it("does NOT fire when side_effects_observed is false", () => {
      const records = [
        makeRecord({
          id: "r-1",
          side_effects_observed: false,
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      expect(alerts.find((a) => a.type === "side_effects")).toBeUndefined();
    });

    it("fires per record for multiple side effects", () => {
      const records = [
        makeRecord({ id: "r-1", side_effects_observed: true, side_effects_details: "Rash" }),
        makeRecord({ id: "r-2", side_effects_observed: true, side_effects_details: "Nausea" }),
        makeRecord({ id: "r-3", side_effects_observed: false }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const se = alerts.filter((a) => a.type === "side_effects");
      expect(se).toHaveLength(2);
    });
  });

  // ── high_refusal alert (high) ─────────────────────────────────────
  describe("high_refusal alert", () => {
    it("fires when child has >= 3 records and > 50% refusals", () => {
      const records = [
        makeRecord({ id: "r-1", child_id: "c1", child_name: "Tom", administration_outcome: "refused" }),
        makeRecord({ id: "r-2", child_id: "c1", child_name: "Tom", administration_outcome: "refused" }),
        makeRecord({ id: "r-3", child_id: "c1", child_name: "Tom", administration_outcome: "administered" }),
      ];
      // 2/3 > 0.5 and total >= 3
      const alerts = identifyAdministrationAlerts(records);
      const refusal = alerts.find((a) => a.type === "high_refusal");
      expect(refusal).toBeTruthy();
    });

    it("has high severity", () => {
      const records = [
        makeRecord({ id: "r-1", child_id: "c1", child_name: "Tom", administration_outcome: "refused" }),
        makeRecord({ id: "r-2", child_id: "c1", child_name: "Tom", administration_outcome: "refused" }),
        makeRecord({ id: "r-3", child_id: "c1", child_name: "Tom", administration_outcome: "administered" }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const refusal = alerts.find((a) => a.type === "high_refusal")!;
      expect(refusal.severity).toBe("high");
    });

    it("id format is refusal_{childId}", () => {
      const records = [
        makeRecord({ id: "r-1", child_id: "child-abc", child_name: "Tom", administration_outcome: "refused" }),
        makeRecord({ id: "r-2", child_id: "child-abc", child_name: "Tom", administration_outcome: "refused" }),
        makeRecord({ id: "r-3", child_id: "child-abc", child_name: "Tom", administration_outcome: "administered" }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const refusal = alerts.find((a) => a.type === "high_refusal")!;
      expect(refusal.id).toBe("refusal_child-abc");
    });

    it("message contains child_name", () => {
      const records = [
        makeRecord({ id: "r-1", child_id: "c1", child_name: "Sarah Jones", administration_outcome: "refused" }),
        makeRecord({ id: "r-2", child_id: "c1", child_name: "Sarah Jones", administration_outcome: "refused" }),
        makeRecord({ id: "r-3", child_id: "c1", child_name: "Sarah Jones", administration_outcome: "administered" }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const refusal = alerts.find((a) => a.type === "high_refusal")!;
      expect(refusal.message).toContain("Sarah Jones");
    });

    it("message contains refusal count and total", () => {
      const records = [
        makeRecord({ id: "r-1", child_id: "c1", child_name: "Tom", administration_outcome: "refused" }),
        makeRecord({ id: "r-2", child_id: "c1", child_name: "Tom", administration_outcome: "refused" }),
        makeRecord({ id: "r-3", child_id: "c1", child_name: "Tom", administration_outcome: "administered" }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const refusal = alerts.find((a) => a.type === "high_refusal")!;
      expect(refusal.message).toContain("2/3");
    });

    it("does NOT fire when total records < 3", () => {
      const records = [
        makeRecord({ id: "r-1", child_id: "c1", child_name: "Tom", administration_outcome: "refused" }),
        makeRecord({ id: "r-2", child_id: "c1", child_name: "Tom", administration_outcome: "refused" }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      expect(alerts.find((a) => a.type === "high_refusal")).toBeUndefined();
    });

    it("does NOT fire when refusals are exactly 50% (not > 50%)", () => {
      const records = [
        makeRecord({ id: "r-1", child_id: "c1", child_name: "Tom", administration_outcome: "refused" }),
        makeRecord({ id: "r-2", child_id: "c1", child_name: "Tom", administration_outcome: "refused" }),
        makeRecord({ id: "r-3", child_id: "c1", child_name: "Tom", administration_outcome: "administered" }),
        makeRecord({ id: "r-4", child_id: "c1", child_name: "Tom", administration_outcome: "administered" }),
      ];
      // 2/4 = 0.5 exactly, not > 0.5
      const alerts = identifyAdministrationAlerts(records);
      expect(alerts.find((a) => a.type === "high_refusal")).toBeUndefined();
    });

    it("does NOT fire when refusals are less than 50%", () => {
      const records = [
        makeRecord({ id: "r-1", child_id: "c1", child_name: "Tom", administration_outcome: "refused" }),
        makeRecord({ id: "r-2", child_id: "c1", child_name: "Tom", administration_outcome: "administered" }),
        makeRecord({ id: "r-3", child_id: "c1", child_name: "Tom", administration_outcome: "administered" }),
        makeRecord({ id: "r-4", child_id: "c1", child_name: "Tom", administration_outcome: "administered" }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      expect(alerts.find((a) => a.type === "high_refusal")).toBeUndefined();
    });

    it("fires per child independently", () => {
      const records = [
        // Child 1: 3/4 refused => fires
        makeRecord({ id: "r-1", child_id: "c1", child_name: "Tom", administration_outcome: "refused" }),
        makeRecord({ id: "r-2", child_id: "c1", child_name: "Tom", administration_outcome: "refused" }),
        makeRecord({ id: "r-3", child_id: "c1", child_name: "Tom", administration_outcome: "refused" }),
        makeRecord({ id: "r-4", child_id: "c1", child_name: "Tom", administration_outcome: "administered" }),
        // Child 2: 2/3 refused => fires
        makeRecord({ id: "r-5", child_id: "c2", child_name: "Jane", administration_outcome: "refused" }),
        makeRecord({ id: "r-6", child_id: "c2", child_name: "Jane", administration_outcome: "refused" }),
        makeRecord({ id: "r-7", child_id: "c2", child_name: "Jane", administration_outcome: "administered" }),
        // Child 3: 0/3 refused => does not fire
        makeRecord({ id: "r-8", child_id: "c3", child_name: "Eve", administration_outcome: "administered" }),
        makeRecord({ id: "r-9", child_id: "c3", child_name: "Eve", administration_outcome: "administered" }),
        makeRecord({ id: "r-10", child_id: "c3", child_name: "Eve", administration_outcome: "administered" }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const refusal = alerts.filter((a) => a.type === "high_refusal");
      expect(refusal).toHaveLength(2);
    });

    it("fires when all records are refused (3/3)", () => {
      const records = [
        makeRecord({ id: "r-1", child_id: "c1", child_name: "Tom", administration_outcome: "refused" }),
        makeRecord({ id: "r-2", child_id: "c1", child_name: "Tom", administration_outcome: "refused" }),
        makeRecord({ id: "r-3", child_id: "c1", child_name: "Tom", administration_outcome: "refused" }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const refusal = alerts.find((a) => a.type === "high_refusal")!;
      expect(refusal).toBeTruthy();
      expect(refusal.message).toContain("3/3");
    });

    it("fires at threshold boundary (2 refused of 3 total)", () => {
      const records = [
        makeRecord({ id: "r-1", child_id: "c1", child_name: "Tom", administration_outcome: "refused" }),
        makeRecord({ id: "r-2", child_id: "c1", child_name: "Tom", administration_outcome: "refused" }),
        makeRecord({ id: "r-3", child_id: "c1", child_name: "Tom", administration_outcome: "withheld" }),
      ];
      // 2/3 = 0.666... > 0.5
      const alerts = identifyAdministrationAlerts(records);
      const refusal = alerts.find((a) => a.type === "high_refusal");
      expect(refusal).toBeTruthy();
    });
  });

  // ── mar_not_updated alert (medium) ─────────────────────────────────
  describe("mar_not_updated alert", () => {
    it("fires when >= 2 administrations have MAR not updated (excluding not_required)", () => {
      const records = [
        makeRecord({ id: "r-1", mar_chart_updated: false, administration_outcome: "administered" }),
        makeRecord({ id: "r-2", mar_chart_updated: false, administration_outcome: "administered" }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const mar = alerts.find((a) => a.type === "mar_not_updated");
      expect(mar).toBeTruthy();
    });

    it("has medium severity", () => {
      const records = [
        makeRecord({ id: "r-1", mar_chart_updated: false, administration_outcome: "administered" }),
        makeRecord({ id: "r-2", mar_chart_updated: false, administration_outcome: "administered" }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const mar = alerts.find((a) => a.type === "mar_not_updated")!;
      expect(mar.severity).toBe("medium");
    });

    it("has id mar_not_updated", () => {
      const records = [
        makeRecord({ id: "r-1", mar_chart_updated: false, administration_outcome: "administered" }),
        makeRecord({ id: "r-2", mar_chart_updated: false, administration_outcome: "refused" }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const mar = alerts.find((a) => a.type === "mar_not_updated")!;
      expect(mar.id).toBe("mar_not_updated");
    });

    it("message contains count of not-updated administrations", () => {
      const records = [
        makeRecord({ id: "r-1", mar_chart_updated: false, administration_outcome: "administered" }),
        makeRecord({ id: "r-2", mar_chart_updated: false, administration_outcome: "refused" }),
        makeRecord({ id: "r-3", mar_chart_updated: false, administration_outcome: "withheld" }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const mar = alerts.find((a) => a.type === "mar_not_updated")!;
      expect(mar.message).toContain("3");
    });

    it("excludes not_required outcome from count", () => {
      const records = [
        makeRecord({ id: "r-1", mar_chart_updated: false, administration_outcome: "not_required" }),
        makeRecord({ id: "r-2", mar_chart_updated: false, administration_outcome: "not_required" }),
        makeRecord({ id: "r-3", mar_chart_updated: false, administration_outcome: "administered" }),
      ];
      // Only 1 qualifies (not_required excluded), so < 2 threshold
      const alerts = identifyAdministrationAlerts(records);
      expect(alerts.find((a) => a.type === "mar_not_updated")).toBeUndefined();
    });

    it("does NOT fire when only 1 MAR not updated", () => {
      const records = [
        makeRecord({ id: "r-1", mar_chart_updated: false, administration_outcome: "administered" }),
        makeRecord({ id: "r-2", mar_chart_updated: true, administration_outcome: "administered" }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      expect(alerts.find((a) => a.type === "mar_not_updated")).toBeUndefined();
    });

    it("does NOT fire when all MAR charts are updated", () => {
      const records = [
        makeRecord({ id: "r-1", mar_chart_updated: true }),
        makeRecord({ id: "r-2", mar_chart_updated: true }),
        makeRecord({ id: "r-3", mar_chart_updated: true }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      expect(alerts.find((a) => a.type === "mar_not_updated")).toBeUndefined();
    });

    it("fires with exactly 2 not-updated (threshold)", () => {
      const records = [
        makeRecord({ id: "r-1", mar_chart_updated: false, administration_outcome: "administered" }),
        makeRecord({ id: "r-2", mar_chart_updated: false, administration_outcome: "refused" }),
        makeRecord({ id: "r-3", mar_chart_updated: true }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const mar = alerts.find((a) => a.type === "mar_not_updated");
      expect(mar).toBeTruthy();
    });

    it("counts not_required outcome as excluded even when MAR is false", () => {
      const records = [
        makeRecord({ id: "r-1", mar_chart_updated: false, administration_outcome: "not_required" }),
        makeRecord({ id: "r-2", mar_chart_updated: false, administration_outcome: "administered" }),
        makeRecord({ id: "r-3", mar_chart_updated: false, administration_outcome: "not_required" }),
        makeRecord({ id: "r-4", mar_chart_updated: false, administration_outcome: "administered" }),
      ];
      // 2 qualify (administered), 2 excluded (not_required) => fires
      const alerts = identifyAdministrationAlerts(records);
      const mar = alerts.find((a) => a.type === "mar_not_updated")!;
      expect(mar.message).toContain("2");
    });
  });

  // ── not_available alert (medium) ───────────────────────────────────
  describe("not_available alert", () => {
    it("fires when >= 1 medication is not_available", () => {
      const records = [
        makeRecord({ id: "r-1", administration_outcome: "not_available", mar_chart_updated: true }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const na = alerts.find((a) => a.type === "not_available");
      expect(na).toBeTruthy();
    });

    it("has medium severity", () => {
      const records = [
        makeRecord({ id: "r-1", administration_outcome: "not_available", mar_chart_updated: true }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const na = alerts.find((a) => a.type === "not_available")!;
      expect(na.severity).toBe("medium");
    });

    it("has id not_available", () => {
      const records = [
        makeRecord({ id: "r-1", administration_outcome: "not_available", mar_chart_updated: true }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const na = alerts.find((a) => a.type === "not_available")!;
      expect(na.id).toBe("not_available");
    });

    it("message uses singular when 1 medication not available", () => {
      const records = [
        makeRecord({ id: "r-1", administration_outcome: "not_available", mar_chart_updated: true }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const na = alerts.find((a) => a.type === "not_available")!;
      expect(na.message).toContain("medication was");
    });

    it("message uses plural when multiple medications not available", () => {
      const records = [
        makeRecord({ id: "r-1", administration_outcome: "not_available", mar_chart_updated: true }),
        makeRecord({ id: "r-2", administration_outcome: "not_available", mar_chart_updated: true }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const na = alerts.find((a) => a.type === "not_available")!;
      expect(na.message).toContain("medications were");
    });

    it("message contains count of not-available medications", () => {
      const records = [
        makeRecord({ id: "r-1", administration_outcome: "not_available", mar_chart_updated: true }),
        makeRecord({ id: "r-2", administration_outcome: "not_available", mar_chart_updated: true }),
        makeRecord({ id: "r-3", administration_outcome: "not_available", mar_chart_updated: true }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const na = alerts.find((a) => a.type === "not_available")!;
      expect(na.message).toContain("3");
    });

    it("does NOT fire when no not_available outcomes", () => {
      const records = [
        makeRecord({ id: "r-1", administration_outcome: "administered" }),
        makeRecord({ id: "r-2", administration_outcome: "refused" }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      expect(alerts.find((a) => a.type === "not_available")).toBeUndefined();
    });

    it("message uses singular for exactly 1", () => {
      const records = [
        makeRecord({ id: "r-1", administration_outcome: "not_available", mar_chart_updated: true }),
        makeRecord({ id: "r-2", administration_outcome: "administered" }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const na = alerts.find((a) => a.type === "not_available")!;
      expect(na.message).toContain("1 medication was");
      expect(na.message).not.toContain("medications were");
    });

    it("message uses plural for 2", () => {
      const records = [
        makeRecord({ id: "r-1", administration_outcome: "not_available", mar_chart_updated: true }),
        makeRecord({ id: "r-2", administration_outcome: "not_available", mar_chart_updated: true }),
        makeRecord({ id: "r-3", administration_outcome: "administered" }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const na = alerts.find((a) => a.type === "not_available")!;
      expect(na.message).toContain("2 medications were");
      expect(na.message).not.toContain("medication was");
    });
  });

  // ── Combined alert scenarios ───────────────────────────────────────
  describe("combined alert scenarios", () => {
    it("can fire all five alert types simultaneously", () => {
      const records = [
        // cd_not_witnessed
        makeRecord({
          id: "r-1",
          child_id: "c1",
          child_name: "Tom",
          controlled_drug: true,
          witness_status: "yes_not_witnessed",
          administration_outcome: "administered",
          mar_chart_updated: false,
          side_effects_observed: true,
          side_effects_details: "Rash",
        }),
        // side_effects (already covered by r-1)
        // mar_not_updated (r-1 and r-2)
        makeRecord({
          id: "r-2",
          child_id: "c1",
          child_name: "Tom",
          administration_outcome: "refused",
          mar_chart_updated: false,
        }),
        // high_refusal for c1: need 3+ total with > 50% refused
        makeRecord({
          id: "r-3",
          child_id: "c1",
          child_name: "Tom",
          administration_outcome: "refused",
          mar_chart_updated: true,
        }),
        // not_available
        makeRecord({
          id: "r-4",
          child_id: "c2",
          child_name: "Jane",
          administration_outcome: "not_available",
          mar_chart_updated: true,
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("cd_not_witnessed");
      expect(types).toContain("side_effects");
      expect(types).toContain("high_refusal");
      expect(types).toContain("mar_not_updated");
      expect(types).toContain("not_available");
    });

    it("returns no alerts for a clean set of records", () => {
      const records = [
        makeRecord({
          id: "r-1",
          child_id: "c1",
          administration_outcome: "administered",
          controlled_drug: false,
          mar_chart_updated: true,
          side_effects_observed: false,
        }),
        makeRecord({
          id: "r-2",
          child_id: "c2",
          administration_outcome: "administered",
          controlled_drug: true,
          witness_status: "yes_witnessed",
          mar_chart_updated: true,
          side_effects_observed: false,
        }),
        makeRecord({
          id: "r-3",
          child_id: "c3",
          administration_outcome: "self_administered",
          controlled_drug: false,
          mar_chart_updated: true,
          side_effects_observed: false,
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("generates multiple alerts of same type for different records", () => {
      const records = [
        makeRecord({
          id: "r-1",
          child_id: "c1",
          child_name: "Alice",
          controlled_drug: true,
          witness_status: "yes_not_witnessed",
          administration_outcome: "administered",
          mar_chart_updated: true,
        }),
        makeRecord({
          id: "r-2",
          child_id: "c2",
          child_name: "Bob",
          controlled_drug: true,
          witness_status: "yes_not_witnessed",
          administration_outcome: "administered",
          mar_chart_updated: true,
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const cd = alerts.filter((a) => a.type === "cd_not_witnessed");
      expect(cd).toHaveLength(2);
      expect(cd[0].message).toContain("Alice");
      expect(cd[1].message).toContain("Bob");
    });

    it("alert order: cd_not_witnessed before side_effects before high_refusal before mar_not_updated before not_available", () => {
      const records = [
        makeRecord({
          id: "r-1",
          child_id: "c1",
          child_name: "Tom",
          controlled_drug: true,
          witness_status: "yes_not_witnessed",
          administration_outcome: "administered",
          mar_chart_updated: false,
          side_effects_observed: true,
          side_effects_details: "Rash",
        }),
        makeRecord({
          id: "r-2",
          child_id: "c1",
          child_name: "Tom",
          administration_outcome: "refused",
          mar_chart_updated: false,
        }),
        makeRecord({
          id: "r-3",
          child_id: "c1",
          child_name: "Tom",
          administration_outcome: "refused",
          mar_chart_updated: true,
        }),
        makeRecord({
          id: "r-4",
          child_id: "c2",
          child_name: "Jane",
          administration_outcome: "not_available",
          mar_chart_updated: true,
        }),
      ];
      const alerts = identifyAdministrationAlerts(records);
      const types = alerts.map((a) => a.type);

      const cdIdx = types.indexOf("cd_not_witnessed");
      const seIdx = types.indexOf("side_effects");
      const refIdx = types.indexOf("high_refusal");
      const marIdx = types.indexOf("mar_not_updated");
      const naIdx = types.indexOf("not_available");

      expect(cdIdx).toBeLessThan(seIdx);
      expect(seIdx).toBeLessThan(refIdx);
      expect(refIdx).toBeLessThan(marIdx);
      expect(marIdx).toBeLessThan(naIdx);
    });
  });
});
