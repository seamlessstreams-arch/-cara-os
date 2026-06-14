// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME RADON TESTING SERVICE TESTS
// Pure-function tests for radon testing metrics, alert identification,
// Cara insight generation, constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  MITIGATION_TYPES,
  COMPLIANCE_STATUSES,
  _testing,
} from "../home-radon-testing-service";

import type {
  HomeRadonTestingRow,
  MitigationType,
  ComplianceStatus,
} from "../home-radon-testing-service";

const {
  computeMetrics,
  computeAlerts,
  computeCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<HomeRadonTestingRow>,
): HomeRadonTestingRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : crypto.randomUUID(),
    test_date: "test_date" in (overrides ?? {}) ? overrides!.test_date! : now.toISOString().split("T")[0],
    tester_name: "tester_name" in (overrides ?? {}) ? overrides!.tester_name! : "D. Laville",
    test_location: "test_location" in (overrides ?? {}) ? overrides!.test_location! : "Living Room",
    test_duration_days: "test_duration_days" in (overrides ?? {}) ? overrides!.test_duration_days! : 90,
    radon_level_bq_m3: "radon_level_bq_m3" in (overrides ?? {}) ? overrides!.radon_level_bq_m3! : 50,
    above_action_level: "above_action_level" in (overrides ?? {}) ? overrides!.above_action_level! : false,
    above_target_level: "above_target_level" in (overrides ?? {}) ? overrides!.above_target_level! : false,
    mitigation_required: "mitigation_required" in (overrides ?? {}) ? overrides!.mitigation_required! : false,
    mitigation_type: "mitigation_type" in (overrides ?? {}) ? (overrides!.mitigation_type ?? null) : "None Required",
    mitigation_installed: "mitigation_installed" in (overrides ?? {}) ? overrides!.mitigation_installed! : false,
    post_mitigation_level: "post_mitigation_level" in (overrides ?? {}) ? (overrides!.post_mitigation_level ?? null) : null,
    retest_date: "retest_date" in (overrides ?? {}) ? (overrides!.retest_date ?? null) : null,
    compliance_status: "compliance_status" in (overrides ?? {}) ? overrides!.compliance_status! : "Compliant",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : now.toISOString(),
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : now.toISOString(),
  };
}

// ── Enum completeness ───────────────────────────────────────────────────

describe("enum arrays", () => {
  it("MITIGATION_TYPES has 5 entries", () => {
    expect(MITIGATION_TYPES).toHaveLength(5);
  });

  it("MITIGATION_TYPES contains expected values", () => {
    expect(MITIGATION_TYPES).toContain("Sump System");
    expect(MITIGATION_TYPES).toContain("Positive Ventilation");
    expect(MITIGATION_TYPES).toContain("Sealing");
    expect(MITIGATION_TYPES).toContain("Sub-Floor Ventilation");
    expect(MITIGATION_TYPES).toContain("None Required");
  });

  it("COMPLIANCE_STATUSES has 4 entries", () => {
    expect(COMPLIANCE_STATUSES).toHaveLength(4);
  });

  it("COMPLIANCE_STATUSES contains expected values", () => {
    expect(COMPLIANCE_STATUSES).toContain("Compliant");
    expect(COMPLIANCE_STATUSES).toContain("Action Required");
    expect(COMPLIANCE_STATUSES).toContain("Monitoring");
    expect(COMPLIANCE_STATUSES).toContain("Non-Compliant");
  });
});

// ── computeMetrics ──────────────────────────────────────────────────────

describe("computeMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_tests", () => {
      const m = computeMetrics([]);
      expect(m.total_tests).toBe(0);
    });

    it("returns zero above_action_count", () => {
      const m = computeMetrics([]);
      expect(m.above_action_count).toBe(0);
    });

    it("returns zero above_target_count", () => {
      const m = computeMetrics([]);
      expect(m.above_target_count).toBe(0);
    });

    it("returns zero mitigation_required_count", () => {
      const m = computeMetrics([]);
      expect(m.mitigation_required_count).toBe(0);
    });

    it("returns zero mitigation_installed_rate", () => {
      const m = computeMetrics([]);
      expect(m.mitigation_installed_rate).toBe(0);
    });

    it("returns zero avg_radon_level", () => {
      const m = computeMetrics([]);
      expect(m.avg_radon_level).toBe(0);
    });

    it("returns zero max_radon_level", () => {
      const m = computeMetrics([]);
      expect(m.max_radon_level).toBe(0);
    });

    it("returns zero retest_scheduled_rate", () => {
      const m = computeMetrics([]);
      expect(m.retest_scheduled_rate).toBe(0);
    });

    it("returns zero compliant_count", () => {
      const m = computeMetrics([]);
      expect(m.compliant_count).toBe(0);
    });

    it("returns zero non_compliant_count", () => {
      const m = computeMetrics([]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns zero unique_testers", () => {
      const m = computeMetrics([]);
      expect(m.unique_testers).toBe(0);
    });
  });

  describe("single compliant row", () => {
    const row = makeRow({
      radon_level_bq_m3: 50,
      above_action_level: false,
      above_target_level: false,
      mitigation_required: false,
      mitigation_installed: false,
      compliance_status: "Compliant",
      retest_date: "2027-06-01",
      tester_name: "D. Laville",
    });

    it("returns total_tests = 1", () => {
      const m = computeMetrics([row]);
      expect(m.total_tests).toBe(1);
    });

    it("returns above_action_count = 0", () => {
      const m = computeMetrics([row]);
      expect(m.above_action_count).toBe(0);
    });

    it("returns above_target_count = 0", () => {
      const m = computeMetrics([row]);
      expect(m.above_target_count).toBe(0);
    });

    it("returns mitigation_required_count = 0", () => {
      const m = computeMetrics([row]);
      expect(m.mitigation_required_count).toBe(0);
    });

    it("returns mitigation_installed_rate = 0 when none require mitigation", () => {
      const m = computeMetrics([row]);
      expect(m.mitigation_installed_rate).toBe(0);
    });

    it("returns avg_radon_level = 50", () => {
      const m = computeMetrics([row]);
      expect(m.avg_radon_level).toBe(50);
    });

    it("returns max_radon_level = 50", () => {
      const m = computeMetrics([row]);
      expect(m.max_radon_level).toBe(50);
    });

    it("returns retest_scheduled_rate = 100", () => {
      const m = computeMetrics([row]);
      expect(m.retest_scheduled_rate).toBe(100);
    });

    it("returns compliant_count = 1", () => {
      const m = computeMetrics([row]);
      expect(m.compliant_count).toBe(1);
    });

    it("returns non_compliant_count = 0", () => {
      const m = computeMetrics([row]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns unique_testers = 1", () => {
      const m = computeMetrics([row]);
      expect(m.unique_testers).toBe(1);
    });
  });

  describe("multiple rows", () => {
    const rows = [
      makeRow({ radon_level_bq_m3: 50, above_action_level: false, above_target_level: false, mitigation_required: false, compliance_status: "Compliant", tester_name: "Staff A", retest_date: "2027-06-01" }),
      makeRow({ radon_level_bq_m3: 250, above_action_level: true, above_target_level: true, mitigation_required: true, mitigation_installed: true, compliance_status: "Action Required", tester_name: "Staff B", retest_date: null }),
      makeRow({ radon_level_bq_m3: 300, above_action_level: true, above_target_level: true, mitigation_required: true, mitigation_installed: false, compliance_status: "Non-Compliant", tester_name: "Staff C", retest_date: "2027-08-01" }),
    ];

    it("returns total_tests = 3", () => {
      const m = computeMetrics(rows);
      expect(m.total_tests).toBe(3);
    });

    it("returns above_action_count = 2", () => {
      const m = computeMetrics(rows);
      expect(m.above_action_count).toBe(2);
    });

    it("returns above_target_count = 2", () => {
      const m = computeMetrics(rows);
      expect(m.above_target_count).toBe(2);
    });

    it("returns mitigation_required_count = 2", () => {
      const m = computeMetrics(rows);
      expect(m.mitigation_required_count).toBe(2);
    });

    it("calculates mitigation_installed_rate correctly (1/2 = 50%)", () => {
      const m = computeMetrics(rows);
      expect(m.mitigation_installed_rate).toBe(50);
    });

    it("calculates avg_radon_level correctly ((50+250+300)/3 = 200)", () => {
      const m = computeMetrics(rows);
      expect(m.avg_radon_level).toBe(200);
    });

    it("returns max_radon_level = 300", () => {
      const m = computeMetrics(rows);
      expect(m.max_radon_level).toBe(300);
    });

    it("calculates retest_scheduled_rate correctly (2/3 = 66.7%)", () => {
      const m = computeMetrics(rows);
      expect(m.retest_scheduled_rate).toBe(66.7);
    });

    it("returns compliant_count = 1", () => {
      const m = computeMetrics(rows);
      expect(m.compliant_count).toBe(1);
    });

    it("returns non_compliant_count = 1", () => {
      const m = computeMetrics(rows);
      expect(m.non_compliant_count).toBe(1);
    });

    it("returns unique_testers = 3", () => {
      const m = computeMetrics(rows);
      expect(m.unique_testers).toBe(3);
    });
  });

  describe("above_action_count", () => {
    it("counts only above_action_level true", () => {
      const rows = [
        makeRow({ above_action_level: true }),
        makeRow({ above_action_level: true }),
        makeRow({ above_action_level: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.above_action_count).toBe(2);
    });

    it("returns 0 when all false", () => {
      const rows = [
        makeRow({ above_action_level: false }),
        makeRow({ above_action_level: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.above_action_count).toBe(0);
    });

    it("returns total when all true", () => {
      const rows = [
        makeRow({ above_action_level: true }),
        makeRow({ above_action_level: true }),
      ];
      const m = computeMetrics(rows);
      expect(m.above_action_count).toBe(2);
    });
  });

  describe("above_target_count", () => {
    it("counts only above_target_level true", () => {
      const rows = [
        makeRow({ above_target_level: true }),
        makeRow({ above_target_level: false }),
        makeRow({ above_target_level: true }),
      ];
      const m = computeMetrics(rows);
      expect(m.above_target_count).toBe(2);
    });

    it("returns 0 when all false", () => {
      const rows = [
        makeRow({ above_target_level: false }),
        makeRow({ above_target_level: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.above_target_count).toBe(0);
    });

    it("returns total when all true", () => {
      const rows = [
        makeRow({ above_target_level: true }),
        makeRow({ above_target_level: true }),
      ];
      const m = computeMetrics(rows);
      expect(m.above_target_count).toBe(2);
    });
  });

  describe("mitigation_required_count", () => {
    it("counts only mitigation_required true", () => {
      const rows = [
        makeRow({ mitigation_required: true }),
        makeRow({ mitigation_required: false }),
        makeRow({ mitigation_required: true }),
      ];
      const m = computeMetrics(rows);
      expect(m.mitigation_required_count).toBe(2);
    });

    it("returns 0 when all false", () => {
      const rows = [
        makeRow({ mitigation_required: false }),
        makeRow({ mitigation_required: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.mitigation_required_count).toBe(0);
    });
  });

  describe("mitigation_installed_rate", () => {
    it("returns 100 when all requiring mitigation have it installed", () => {
      const rows = [
        makeRow({ mitigation_required: true, mitigation_installed: true }),
        makeRow({ mitigation_required: true, mitigation_installed: true }),
      ];
      const m = computeMetrics(rows);
      expect(m.mitigation_installed_rate).toBe(100);
    });

    it("returns 0 when none requiring mitigation have it installed", () => {
      const rows = [
        makeRow({ mitigation_required: true, mitigation_installed: false }),
        makeRow({ mitigation_required: true, mitigation_installed: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.mitigation_installed_rate).toBe(0);
    });

    it("returns 0 when no rows require mitigation", () => {
      const rows = [
        makeRow({ mitigation_required: false, mitigation_installed: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.mitigation_installed_rate).toBe(0);
    });

    it("calculates 50% for half installed", () => {
      const rows = [
        makeRow({ mitigation_required: true, mitigation_installed: true }),
        makeRow({ mitigation_required: true, mitigation_installed: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.mitigation_installed_rate).toBe(50);
    });

    it("calculates 33.3% for 1/3 installed", () => {
      const rows = [
        makeRow({ mitigation_required: true, mitigation_installed: true }),
        makeRow({ mitigation_required: true, mitigation_installed: false }),
        makeRow({ mitigation_required: true, mitigation_installed: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.mitigation_installed_rate).toBe(33.3);
    });

    it("calculates 66.7% for 2/3 installed", () => {
      const rows = [
        makeRow({ mitigation_required: true, mitigation_installed: true }),
        makeRow({ mitigation_required: true, mitigation_installed: true }),
        makeRow({ mitigation_required: true, mitigation_installed: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.mitigation_installed_rate).toBe(66.7);
    });

    it("ignores rows not requiring mitigation for rate calculation", () => {
      const rows = [
        makeRow({ mitigation_required: true, mitigation_installed: true }),
        makeRow({ mitigation_required: false, mitigation_installed: false }),
        makeRow({ mitigation_required: false, mitigation_installed: true }),
      ];
      const m = computeMetrics(rows);
      expect(m.mitigation_installed_rate).toBe(100);
    });
  });

  describe("avg_radon_level", () => {
    it("returns single row radon level as average", () => {
      const m = computeMetrics([makeRow({ radon_level_bq_m3: 120 })]);
      expect(m.avg_radon_level).toBe(120);
    });

    it("calculates average for multiple rows", () => {
      const rows = [
        makeRow({ radon_level_bq_m3: 100 }),
        makeRow({ radon_level_bq_m3: 200 }),
      ];
      const m = computeMetrics(rows);
      expect(m.avg_radon_level).toBe(150);
    });

    it("returns 0 for empty array", () => {
      const m = computeMetrics([]);
      expect(m.avg_radon_level).toBe(0);
    });

    it("handles zero radon levels", () => {
      const rows = [
        makeRow({ radon_level_bq_m3: 0 }),
        makeRow({ radon_level_bq_m3: 0 }),
      ];
      const m = computeMetrics(rows);
      expect(m.avg_radon_level).toBe(0);
    });

    it("handles non-integer average with rounding", () => {
      const rows = [
        makeRow({ radon_level_bq_m3: 10 }),
        makeRow({ radon_level_bq_m3: 20 }),
        makeRow({ radon_level_bq_m3: 30 }),
      ];
      const m = computeMetrics(rows);
      expect(m.avg_radon_level).toBe(20);
    });

    it("handles high radon levels", () => {
      const rows = [
        makeRow({ radon_level_bq_m3: 800 }),
        makeRow({ radon_level_bq_m3: 1000 }),
      ];
      const m = computeMetrics(rows);
      expect(m.avg_radon_level).toBe(900);
    });

    it("rounds to one decimal place", () => {
      const rows = [
        makeRow({ radon_level_bq_m3: 100 }),
        makeRow({ radon_level_bq_m3: 200 }),
        makeRow({ radon_level_bq_m3: 300 }),
      ];
      const m = computeMetrics(rows);
      expect(m.avg_radon_level).toBe(200);
    });
  });

  describe("max_radon_level", () => {
    it("returns single row radon level as max", () => {
      const m = computeMetrics([makeRow({ radon_level_bq_m3: 75 })]);
      expect(m.max_radon_level).toBe(75);
    });

    it("returns the maximum across rows", () => {
      const rows = [
        makeRow({ radon_level_bq_m3: 50 }),
        makeRow({ radon_level_bq_m3: 300 }),
        makeRow({ radon_level_bq_m3: 150 }),
      ];
      const m = computeMetrics(rows);
      expect(m.max_radon_level).toBe(300);
    });

    it("returns 0 for empty array", () => {
      const m = computeMetrics([]);
      expect(m.max_radon_level).toBe(0);
    });

    it("handles all zero levels", () => {
      const rows = [
        makeRow({ radon_level_bq_m3: 0 }),
        makeRow({ radon_level_bq_m3: 0 }),
      ];
      const m = computeMetrics(rows);
      expect(m.max_radon_level).toBe(0);
    });

    it("handles identical levels", () => {
      const rows = [
        makeRow({ radon_level_bq_m3: 100 }),
        makeRow({ radon_level_bq_m3: 100 }),
      ];
      const m = computeMetrics(rows);
      expect(m.max_radon_level).toBe(100);
    });
  });

  describe("retest_scheduled_rate", () => {
    it("returns 100 when all rows have retest_date", () => {
      const rows = [
        makeRow({ retest_date: "2027-01-15" }),
        makeRow({ retest_date: "2027-06-01" }),
      ];
      const m = computeMetrics(rows);
      expect(m.retest_scheduled_rate).toBe(100);
    });

    it("returns 0 when no rows have retest_date", () => {
      const rows = [
        makeRow({ retest_date: null }),
        makeRow({ retest_date: null }),
      ];
      const m = computeMetrics(rows);
      expect(m.retest_scheduled_rate).toBe(0);
    });

    it("calculates 50% for mixed retest dates", () => {
      const rows = [
        makeRow({ retest_date: "2027-01-15" }),
        makeRow({ retest_date: null }),
      ];
      const m = computeMetrics(rows);
      expect(m.retest_scheduled_rate).toBe(50);
    });

    it("calculates 33.3% for 1/3 with retest", () => {
      const rows = [
        makeRow({ retest_date: "2027-01-15" }),
        makeRow({ retest_date: null }),
        makeRow({ retest_date: null }),
      ];
      const m = computeMetrics(rows);
      expect(m.retest_scheduled_rate).toBe(33.3);
    });

    it("calculates 66.7% for 2/3 with retest", () => {
      const rows = [
        makeRow({ retest_date: "2027-01-15" }),
        makeRow({ retest_date: "2027-06-01" }),
        makeRow({ retest_date: null }),
      ];
      const m = computeMetrics(rows);
      expect(m.retest_scheduled_rate).toBe(66.7);
    });
  });

  describe("compliant_count", () => {
    it("counts only Compliant status", () => {
      const rows = [
        makeRow({ compliance_status: "Compliant" }),
        makeRow({ compliance_status: "Action Required" }),
        makeRow({ compliance_status: "Compliant" }),
      ];
      const m = computeMetrics(rows);
      expect(m.compliant_count).toBe(2);
    });

    it("returns 0 when none compliant", () => {
      const rows = [
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Action Required" }),
      ];
      const m = computeMetrics(rows);
      expect(m.compliant_count).toBe(0);
    });

    it("counts all when all compliant", () => {
      const rows = [
        makeRow({ compliance_status: "Compliant" }),
        makeRow({ compliance_status: "Compliant" }),
      ];
      const m = computeMetrics(rows);
      expect(m.compliant_count).toBe(2);
    });
  });

  describe("non_compliant_count", () => {
    it("counts only Non-Compliant status", () => {
      const rows = [
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Compliant" }),
      ];
      const m = computeMetrics(rows);
      expect(m.non_compliant_count).toBe(2);
    });

    it("returns 0 when none non-compliant", () => {
      const rows = [
        makeRow({ compliance_status: "Compliant" }),
        makeRow({ compliance_status: "Action Required" }),
      ];
      const m = computeMetrics(rows);
      expect(m.non_compliant_count).toBe(0);
    });

    it("does not count Action Required as non-compliant", () => {
      const m = computeMetrics([makeRow({ compliance_status: "Action Required" })]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("does not count Monitoring as non-compliant", () => {
      const m = computeMetrics([makeRow({ compliance_status: "Monitoring" })]);
      expect(m.non_compliant_count).toBe(0);
    });
  });

  describe("unique_testers", () => {
    it("counts distinct testers", () => {
      const rows = [
        makeRow({ tester_name: "Staff A" }),
        makeRow({ tester_name: "Staff A" }),
        makeRow({ tester_name: "Staff B" }),
      ];
      const m = computeMetrics(rows);
      expect(m.unique_testers).toBe(2);
    });

    it("returns 1 when all rows have the same tester", () => {
      const rows = [
        makeRow({ tester_name: "Staff A" }),
        makeRow({ tester_name: "Staff A" }),
        makeRow({ tester_name: "Staff A" }),
      ];
      const m = computeMetrics(rows);
      expect(m.unique_testers).toBe(1);
    });

    it("counts each unique tester name", () => {
      const rows = [
        makeRow({ tester_name: "Alice" }),
        makeRow({ tester_name: "Bob" }),
        makeRow({ tester_name: "Charlie" }),
        makeRow({ tester_name: "Alice" }),
      ];
      const m = computeMetrics(rows);
      expect(m.unique_testers).toBe(3);
    });
  });

  describe("percentage calculations with known values", () => {
    it("25% rate (1/4) for retest scheduling", () => {
      const rows = [
        makeRow({ retest_date: "2027-01-15" }),
        makeRow({ retest_date: null }),
        makeRow({ retest_date: null }),
        makeRow({ retest_date: null }),
      ];
      const m = computeMetrics(rows);
      expect(m.retest_scheduled_rate).toBe(25);
    });

    it("75% rate (3/4) for retest scheduling", () => {
      const rows = [
        makeRow({ retest_date: "2027-01-15" }),
        makeRow({ retest_date: "2027-02-01" }),
        makeRow({ retest_date: "2027-03-01" }),
        makeRow({ retest_date: null }),
      ];
      const m = computeMetrics(rows);
      expect(m.retest_scheduled_rate).toBe(75);
    });

    it("25% mitigation installed rate (1/4)", () => {
      const rows = [
        makeRow({ mitigation_required: true, mitigation_installed: true }),
        makeRow({ mitigation_required: true, mitigation_installed: false }),
        makeRow({ mitigation_required: true, mitigation_installed: false }),
        makeRow({ mitigation_required: true, mitigation_installed: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.mitigation_installed_rate).toBe(25);
    });

    it("75% mitigation installed rate (3/4)", () => {
      const rows = [
        makeRow({ mitigation_required: true, mitigation_installed: true }),
        makeRow({ mitigation_required: true, mitigation_installed: true }),
        makeRow({ mitigation_required: true, mitigation_installed: true }),
        makeRow({ mitigation_required: true, mitigation_installed: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.mitigation_installed_rate).toBe(75);
    });
  });
});

// ── computeAlerts ──────────────────────────────────────────────────────

describe("computeAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no rows", () => {
      const alerts = computeAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all rows are clean", () => {
      const rows = [
        makeRow({
          above_action_level: false,
          above_target_level: false,
          mitigation_required: false,
          mitigation_installed: false,
          compliance_status: "Compliant",
          mitigation_type: "None Required",
          retest_date: null,
        }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts).toEqual([]);
    });

    it("returns empty when above action level but mitigation installed", () => {
      const rows = [
        makeRow({
          above_action_level: true,
          mitigation_installed: true,
          compliance_status: "Compliant",
          above_target_level: false,
          mitigation_required: true,
          mitigation_type: "Sump System",
        }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts).toEqual([]);
    });

    it("returns empty when above target level with retest date", () => {
      const rows = [
        makeRow({
          above_target_level: true,
          retest_date: "2027-06-01",
          above_action_level: false,
          compliance_status: "Monitoring",
          mitigation_required: false,
          mitigation_type: "None Required",
        }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  describe("above_action_no_mitigation alert", () => {
    it("fires when above action level without mitigation installed", () => {
      const rows = [makeRow({ above_action_level: true, mitigation_installed: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "above_action_no_mitigation");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ above_action_level: true, mitigation_installed: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "above_action_no_mitigation")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "rt-1", above_action_level: true, mitigation_installed: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "above_action_no_mitigation")!;
      expect(alert.record_id).toBe("rt-1");
    });

    it("includes radon level in message", () => {
      const rows = [makeRow({ above_action_level: true, mitigation_installed: false, radon_level_bq_m3: 350 })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "above_action_no_mitigation")!;
      expect(alert.message).toContain("350");
    });

    it("includes test_location in message", () => {
      const rows = [makeRow({ above_action_level: true, mitigation_installed: false, test_location: "Basement" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "above_action_no_mitigation")!;
      expect(alert.message).toContain("Basement");
    });

    it("includes test_date in message", () => {
      const rows = [makeRow({ above_action_level: true, mitigation_installed: false, test_date: "2026-05-01" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "above_action_no_mitigation")!;
      expect(alert.message).toContain("2026-05-01");
    });

    it("message contains UKHSA", () => {
      const rows = [makeRow({ above_action_level: true, mitigation_installed: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "above_action_no_mitigation")!;
      expect(alert.message).toContain("UKHSA");
    });

    it("does not fire when not above action level", () => {
      const rows = [makeRow({ above_action_level: false, mitigation_installed: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "above_action_no_mitigation");
      expect(alert).toBeUndefined();
    });

    it("does not fire when above action level with mitigation installed", () => {
      const rows = [makeRow({ above_action_level: true, mitigation_installed: true })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "above_action_no_mitigation");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple above action without mitigation", () => {
      const rows = [
        makeRow({ above_action_level: true, mitigation_installed: false }),
        makeRow({ above_action_level: true, mitigation_installed: false }),
        makeRow({ above_action_level: true, mitigation_installed: true }),
      ];
      const alerts = computeAlerts(rows);
      const critAlerts = alerts.filter((a) => a.type === "above_action_no_mitigation");
      expect(critAlerts).toHaveLength(2);
    });
  });

  describe("non_compliant_status alert", () => {
    it("fires for Non-Compliant status", () => {
      const rows = [makeRow({ compliance_status: "Non-Compliant" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_status");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ compliance_status: "Non-Compliant" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_status")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "nc-1", compliance_status: "Non-Compliant" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_status")!;
      expect(alert.record_id).toBe("nc-1");
    });

    it("includes test_location in message", () => {
      const rows = [makeRow({ compliance_status: "Non-Compliant", test_location: "Ground Floor" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_status")!;
      expect(alert.message).toContain("Ground Floor");
    });

    it("includes test_date in message", () => {
      const rows = [makeRow({ compliance_status: "Non-Compliant", test_date: "2026-04-20" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_status")!;
      expect(alert.message).toContain("2026-04-20");
    });

    it("message contains UKHSA", () => {
      const rows = [makeRow({ compliance_status: "Non-Compliant" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_status")!;
      expect(alert.message).toContain("UKHSA");
    });

    it("does not fire for Compliant", () => {
      const rows = [makeRow({ compliance_status: "Compliant" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_status");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Action Required", () => {
      const rows = [makeRow({ compliance_status: "Action Required" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_status");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Monitoring", () => {
      const rows = [makeRow({ compliance_status: "Monitoring" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_status");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple Non-Compliant", () => {
      const rows = [
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Compliant" }),
      ];
      const alerts = computeAlerts(rows);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant_status");
      expect(ncAlerts).toHaveLength(2);
    });
  });

  describe("above_target_no_retest alert", () => {
    it("fires when above target level without retest date", () => {
      const rows = [makeRow({ above_target_level: true, retest_date: null })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "above_target_no_retest");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ above_target_level: true, retest_date: null })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "above_target_no_retest")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "atnr-1", above_target_level: true, retest_date: null })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "above_target_no_retest")!;
      expect(alert.record_id).toBe("atnr-1");
    });

    it("includes radon level in message", () => {
      const rows = [makeRow({ above_target_level: true, retest_date: null, radon_level_bq_m3: 150 })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "above_target_no_retest")!;
      expect(alert.message).toContain("150");
    });

    it("includes test_location in message", () => {
      const rows = [makeRow({ above_target_level: true, retest_date: null, test_location: "Bedroom 2" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "above_target_no_retest")!;
      expect(alert.message).toContain("Bedroom 2");
    });

    it("includes test_date in message", () => {
      const rows = [makeRow({ above_target_level: true, retest_date: null, test_date: "2026-03-15" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "above_target_no_retest")!;
      expect(alert.message).toContain("2026-03-15");
    });

    it("message contains UKHSA", () => {
      const rows = [makeRow({ above_target_level: true, retest_date: null })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "above_target_no_retest")!;
      expect(alert.message).toContain("UKHSA");
    });

    it("does not fire when not above target level", () => {
      const rows = [makeRow({ above_target_level: false, retest_date: null })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "above_target_no_retest");
      expect(alert).toBeUndefined();
    });

    it("does not fire when above target level with retest date", () => {
      const rows = [makeRow({ above_target_level: true, retest_date: "2027-06-01" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "above_target_no_retest");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple above target without retest", () => {
      const rows = [
        makeRow({ above_target_level: true, retest_date: null }),
        makeRow({ above_target_level: true, retest_date: null }),
        makeRow({ above_target_level: true, retest_date: "2027-06-01" }),
      ];
      const alerts = computeAlerts(rows);
      const atAlerts = alerts.filter((a) => a.type === "above_target_no_retest");
      expect(atAlerts).toHaveLength(2);
    });
  });

  describe("mitigation_required_no_type alert", () => {
    it("fires when mitigation required without mitigation type", () => {
      const rows = [makeRow({ mitigation_required: true, mitigation_type: null })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "mitigation_required_no_type");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ mitigation_required: true, mitigation_type: null })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "mitigation_required_no_type")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "mrnt-1", mitigation_required: true, mitigation_type: null })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "mitigation_required_no_type")!;
      expect(alert.record_id).toBe("mrnt-1");
    });

    it("includes test_location in message", () => {
      const rows = [makeRow({ mitigation_required: true, mitigation_type: null, test_location: "Kitchen" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "mitigation_required_no_type")!;
      expect(alert.message).toContain("Kitchen");
    });

    it("includes test_date in message", () => {
      const rows = [makeRow({ mitigation_required: true, mitigation_type: null, test_date: "2026-02-10" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "mitigation_required_no_type")!;
      expect(alert.message).toContain("2026-02-10");
    });

    it("does not fire when mitigation not required", () => {
      const rows = [makeRow({ mitigation_required: false, mitigation_type: null })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "mitigation_required_no_type");
      expect(alert).toBeUndefined();
    });

    it("does not fire when mitigation required with type set", () => {
      const rows = [makeRow({ mitigation_required: true, mitigation_type: "Sump System" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "mitigation_required_no_type");
      expect(alert).toBeUndefined();
    });

    it("does not fire for each mitigation type when set", () => {
      for (const mt of MITIGATION_TYPES) {
        const rows = [makeRow({ mitigation_required: true, mitigation_type: mt })];
        const alerts = computeAlerts(rows);
        const alert = alerts.find((a) => a.type === "mitigation_required_no_type");
        expect(alert).toBeUndefined();
      }
    });

    it("fires per record for multiple without type", () => {
      const rows = [
        makeRow({ mitigation_required: true, mitigation_type: null }),
        makeRow({ mitigation_required: true, mitigation_type: null }),
        makeRow({ mitigation_required: true, mitigation_type: "Sealing" }),
      ];
      const alerts = computeAlerts(rows);
      const mrntAlerts = alerts.filter((a) => a.type === "mitigation_required_no_type");
      expect(mrntAlerts).toHaveLength(2);
    });
  });

  describe("combined alerts", () => {
    it("can fire all four alert types simultaneously", () => {
      const rows = [
        makeRow({
          above_action_level: true,
          mitigation_installed: false,
          compliance_status: "Non-Compliant",
          above_target_level: true,
          retest_date: null,
          mitigation_required: true,
          mitigation_type: null,
        }),
      ];
      const alerts = computeAlerts(rows);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("above_action_no_mitigation");
      expect(types).toContain("non_compliant_status");
      expect(types).toContain("above_target_no_retest");
      expect(types).toContain("mitigation_required_no_type");
    });

    it("critical and high can fire on same row", () => {
      const rows = [
        makeRow({
          above_action_level: true,
          mitigation_installed: false,
          compliance_status: "Non-Compliant",
        }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "above_action_no_mitigation")).toBeDefined();
      expect(alerts.find((a) => a.type === "non_compliant_status")).toBeDefined();
    });

    it("both medium alerts can fire on same row", () => {
      const rows = [
        makeRow({
          above_target_level: true,
          retest_date: null,
          mitigation_required: true,
          mitigation_type: null,
        }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "above_target_no_retest")).toBeDefined();
      expect(alerts.find((a) => a.type === "mitigation_required_no_type")).toBeDefined();
    });

    it("per-record alerts multiply across rows", () => {
      const rows = [
        makeRow({ above_action_level: true, mitigation_installed: false, compliance_status: "Non-Compliant" }),
        makeRow({ above_action_level: true, mitigation_installed: false, compliance_status: "Non-Compliant" }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts.filter((a) => a.type === "above_action_no_mitigation")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "non_compliant_status")).toHaveLength(2);
    });

    it("above action with mitigation installed does not fire critical alert", () => {
      const rows = [
        makeRow({ above_action_level: true, mitigation_installed: true }),
      ];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "above_action_no_mitigation");
      expect(alert).toBeUndefined();
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const rows = [
        makeRow({ above_action_level: true, mitigation_installed: false, compliance_status: "Non-Compliant" }),
      ];
      const alerts = computeAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const rows = [
        makeRow({
          above_action_level: true,
          mitigation_installed: false,
          compliance_status: "Non-Compliant",
          above_target_level: true,
          retest_date: null,
          mitigation_required: true,
          mitigation_type: null,
        }),
      ];
      const alerts = computeAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const rows = [makeRow({ above_action_level: true, mitigation_installed: false })];
      const alerts = computeAlerts(rows);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe("edge cases", () => {
    it("above action with mitigation installed generates no critical alert", () => {
      const rows = [makeRow({ above_action_level: true, mitigation_installed: true })];
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "above_action_no_mitigation")).toBeUndefined();
    });

    it("above target with retest date generates no medium alert", () => {
      const rows = [makeRow({ above_target_level: true, retest_date: "2027-01-15" })];
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "above_target_no_retest")).toBeUndefined();
    });

    it("mitigation required with type set generates no medium alert", () => {
      const rows = [makeRow({ mitigation_required: true, mitigation_type: "Positive Ventilation" })];
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "mitigation_required_no_type")).toBeUndefined();
    });

    it("various locations appear in alert messages", () => {
      const locations = ["Living Room", "Basement", "Bedroom 1", "Kitchen", "Office"];
      for (const loc of locations) {
        const rows = [makeRow({ above_action_level: true, mitigation_installed: false, test_location: loc })];
        const alerts = computeAlerts(rows);
        const alert = alerts.find((a) => a.type === "above_action_no_mitigation")!;
        expect(alert.message).toContain(loc);
      }
    });

    it("various radon levels appear in critical alert messages", () => {
      const levels = [201, 300, 500, 800, 1000];
      for (const level of levels) {
        const rows = [makeRow({ above_action_level: true, mitigation_installed: false, radon_level_bq_m3: level })];
        const alerts = computeAlerts(rows);
        const alert = alerts.find((a) => a.type === "above_action_no_mitigation")!;
        expect(alert.message).toContain(String(level));
      }
    });
  });
});

// ── computeCaraInsights ────────────────────────────────────────────────

describe("computeCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const m = computeMetrics([]);
    const insights = computeCaraInsights(m);
    expect(insights).toHaveLength(3);
  });

  it("all insights are non-empty strings", () => {
    const m = computeMetrics([makeRow()]);
    const insights = computeCaraInsights(m);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  it("first insight includes total_tests count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes avg_radon_level", () => {
    const rows = [makeRow({ radon_level_bq_m3: 100 }), makeRow({ radon_level_bq_m3: 200 })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("150");
  });

  it("first insight includes max_radon_level", () => {
    const rows = [makeRow({ radon_level_bq_m3: 50 }), makeRow({ radon_level_bq_m3: 300 })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("300");
  });

  it("first insight includes above_action_count", () => {
    const rows = [makeRow({ above_action_level: true }), makeRow({ above_action_level: false })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("1 test above the UKHSA action level");
  });

  it("first insight includes above_target_count", () => {
    const rows = [makeRow({ above_target_level: true }), makeRow({ above_target_level: true })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("2 above the target level");
  });

  it("second insight mentions action level and non-compliant when present", () => {
    const rows = [
      makeRow({ above_action_level: true, compliance_status: "Non-Compliant", mitigation_required: true, mitigation_installed: false }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("above the action level");
    expect(insights[1]).toContain("non-compliant");
  });

  it("second insight mentions no action level issues when none present", () => {
    const rows = [makeRow({
      above_action_level: false,
      compliance_status: "Compliant",
    })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("No tests above the UKHSA action level");
  });

  it("second insight includes mitigation_installed_rate when issues present", () => {
    const rows = [
      makeRow({ above_action_level: true, mitigation_required: true, mitigation_installed: true }),
      makeRow({ above_action_level: true, mitigation_required: true, mitigation_installed: false }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("50%");
  });

  it("second insight includes retest_scheduled_rate when issues present", () => {
    const rows = [
      makeRow({ above_action_level: true, retest_date: "2027-01-01" }),
      makeRow({ above_action_level: true, retest_date: null }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("50%");
  });

  it("second insight mentions UKHSA when no issues", () => {
    const rows = [makeRow({ above_action_level: false, compliance_status: "Compliant" })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("UKHSA");
  });

  it("third insight asks about mitigation when above action level", () => {
    const rows = [makeRow({ above_action_level: true })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("UKHSA");
    expect(insights[2]).toContain("action level");
  });

  it("third insight asks about target level when above target but not action", () => {
    const rows = [makeRow({ above_action_level: false, above_target_level: true })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("target level");
    expect(insights[2]).toContain("UKHSA");
  });

  it("third insight celebrates when all below target", () => {
    const rows = [
      makeRow({ above_action_level: false, above_target_level: false }),
      makeRow({ above_action_level: false, above_target_level: false }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("All tests show radon levels below");
  });

  it("uses singular tester wording when unique_testers is 1", () => {
    const rows = [makeRow({ tester_name: "D. Laville" })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("1 tester");
  });

  it("uses plural testers wording when unique_testers > 1", () => {
    const rows = [
      makeRow({ tester_name: "Staff A" }),
      makeRow({ tester_name: "Staff B" }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("2 testers");
  });

  it("uses singular test wording when 1 test", () => {
    const rows = [makeRow()];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("1 radon test");
  });

  it("uses plural tests wording when multiple tests", () => {
    const rows = [makeRow(), makeRow()];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("2 radon tests");
  });

  it("uses singular test has wording for 1 above action", () => {
    const rows = [makeRow({ above_action_level: true })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("test has");
  });

  it("uses plural tests have wording for multiple above action", () => {
    const rows = [
      makeRow({ above_action_level: true }),
      makeRow({ above_action_level: true }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("tests have");
  });

  it("third insight mentions UKHSA guidance when all below target", () => {
    const rows = [makeRow({ above_action_level: false, above_target_level: false })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("UKHSA guidance");
  });

  it("third insight asks about retests when above target only", () => {
    const rows = [makeRow({ above_action_level: false, above_target_level: true })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("retests");
  });

  it("second insight mentions compliant count when no issues", () => {
    const rows = [
      makeRow({ above_action_level: false, compliance_status: "Compliant" }),
      makeRow({ above_action_level: false, compliance_status: "Compliant" }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("2 tests compliant");
  });

  it("second insight uses singular test wording for 1 compliant", () => {
    const rows = [makeRow({ above_action_level: false, compliance_status: "Compliant" })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("1 test compliant");
  });

  it("uses singular test wording in second insight for 1 above action", () => {
    const rows = [makeRow({ above_action_level: true })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("1 test above the action level");
  });

  it("uses plural tests wording in second insight for multiple above action", () => {
    const rows = [
      makeRow({ above_action_level: true }),
      makeRow({ above_action_level: true }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("2 tests above the action level");
  });

  it("uses singular test wording in second insight for 1 mitigation required", () => {
    const rows = [makeRow({ above_action_level: true, mitigation_required: true })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("1 test requiring mitigation");
  });

  it("uses plural tests wording in second insight for multiple mitigation required", () => {
    const rows = [
      makeRow({ above_action_level: true, mitigation_required: true }),
      makeRow({ above_action_level: true, mitigation_required: true }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("2 tests requiring mitigation");
  });
});

// ── Factory helper validation ──────────────────────────────────────────

describe("makeRow factory helper", () => {
  it("creates a row with sensible defaults", () => {
    const r = makeRow();
    expect(r.tester_name).toBe("D. Laville");
    expect(r.test_location).toBe("Living Room");
    expect(r.test_duration_days).toBe(90);
    expect(r.radon_level_bq_m3).toBe(50);
    expect(r.above_action_level).toBe(false);
    expect(r.above_target_level).toBe(false);
    expect(r.mitigation_required).toBe(false);
    expect(r.mitigation_type).toBe("None Required");
    expect(r.mitigation_installed).toBe(false);
    expect(r.post_mitigation_level).toBeNull();
    expect(r.retest_date).toBeNull();
    expect(r.compliance_status).toBe("Compliant");
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRow({ radon_level_bq_m3: 250, compliance_status: "Non-Compliant" });
    expect(r.radon_level_bq_m3).toBe(250);
    expect(r.compliance_status).toBe("Non-Compliant");
    // defaults still apply
    expect(r.tester_name).toBe("D. Laville");
  });

  it("generates unique ids by default", () => {
    const r1 = makeRow();
    const r2 = makeRow();
    expect(r1.id).not.toBe(r2.id);
  });

  it("allows overriding id", () => {
    const r = makeRow({ id: "custom-id" });
    expect(r.id).toBe("custom-id");
  });

  it("allows setting nullable fields to null", () => {
    const r = makeRow({ mitigation_type: null, post_mitigation_level: null, retest_date: null, notes: null });
    expect(r.mitigation_type).toBeNull();
    expect(r.post_mitigation_level).toBeNull();
    expect(r.retest_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows setting nullable fields to values", () => {
    const r = makeRow({ post_mitigation_level: 45, retest_date: "2027-06-01", notes: "Follow-up needed" });
    expect(r.post_mitigation_level).toBe(45);
    expect(r.retest_date).toBe("2027-06-01");
    expect(r.notes).toBe("Follow-up needed");
  });

  it("allows setting mitigation_type to each value", () => {
    for (const t of MITIGATION_TYPES) {
      const r = makeRow({ mitigation_type: t });
      expect(r.mitigation_type).toBe(t);
    }
  });

  it("allows setting compliance_status to each value", () => {
    for (const s of COMPLIANCE_STATUSES) {
      const r = makeRow({ compliance_status: s });
      expect(r.compliance_status).toBe(s);
    }
  });
});
