// ══════════════════════════════════════════════════════════════════════════════
// CARA — KPI TRACKING SERVICE TESTS
// Pure-function unit tests for KPI metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 45 (quality of care review —
// monitoring standards), Reg 35 (leadership and management —
// performance monitoring).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeKpiMetrics,
  identifyKpiAlerts,
  KPI_DOMAINS,
  KPI_STATUSES,
  KPI_FREQUENCIES,
  TREND_DIRECTIONS,
  listDefinitions,
  createDefinition,
  updateDefinition,
  listMeasurements,
  createMeasurement,
} from "../kpi-tracking-service";

import type { KpiDefinition, KpiMeasurement } from "../kpi-tracking-service";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal KpiDefinition with sensible defaults. */
function makeDefinition(
  overrides: Partial<KpiDefinition> = {},
): KpiDefinition {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    name: "Test KPI",
    description: "A test KPI definition",
    domain: "safeguarding",
    unit: "%",
    target_value: 90,
    threshold_amber: 80,
    threshold_red: 70,
    higher_is_better: true,
    frequency: "monthly",
    data_source: "manual",
    responsible_person: "Manager",
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/** Build a minimal KpiMeasurement with sensible defaults. */
function makeMeasurement(
  overrides: Partial<KpiMeasurement> = {},
): KpiMeasurement {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    kpi_id: "kpi-1",
    kpi_name: "Test KPI",
    measurement_date: "2025-06-01",
    period: "2025-06",
    value: 92,
    target: 90,
    status: "on_target",
    trend: "stable",
    commentary: null,
    actions_if_below: null,
    measured_by: "Manager",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  // ── KPI_DOMAINS ──────────────────────────────────────────────────────────

  describe("KPI_DOMAINS", () => {
    it("contains exactly 13 items", () => {
      expect(KPI_DOMAINS).toHaveLength(13);
    });

    it("has unique domain values", () => {
      const domains = KPI_DOMAINS.map((d) => d.domain);
      expect(new Set(domains).size).toBe(domains.length);
    });

    it.each([
      "safeguarding",
      "health",
      "education",
      "behaviour",
      "placement_stability",
      "staffing",
      "compliance",
      "participation",
      "outcomes",
      "finance",
      "environment",
      "records",
      "other",
    ] as const)("includes domain '%s'", (domain) => {
      expect(KPI_DOMAINS.find((d) => d.domain === domain)).toBeDefined();
    });

    it("every entry has a non-empty label", () => {
      for (const entry of KPI_DOMAINS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("every entry has a non-empty domain", () => {
      for (const entry of KPI_DOMAINS) {
        expect(entry.domain.length).toBeGreaterThan(0);
      }
    });
  });

  // ── KPI_STATUSES ─────────────────────────────────────────────────────────

  describe("KPI_STATUSES", () => {
    it("contains exactly 5 items", () => {
      expect(KPI_STATUSES).toHaveLength(5);
    });

    it("has unique status values", () => {
      const statuses = KPI_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it.each([
      "on_target",
      "above_target",
      "below_target",
      "at_risk",
      "not_measured",
    ] as const)("includes status '%s'", (status) => {
      expect(KPI_STATUSES.find((s) => s.status === status)).toBeDefined();
    });

    it("every entry has a non-empty label", () => {
      for (const entry of KPI_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("every entry has a non-empty status", () => {
      for (const entry of KPI_STATUSES) {
        expect(entry.status.length).toBeGreaterThan(0);
      }
    });
  });

  // ── KPI_FREQUENCIES ──────────────────────────────────────────────────────

  describe("KPI_FREQUENCIES", () => {
    it("contains exactly 5 items", () => {
      expect(KPI_FREQUENCIES).toHaveLength(5);
    });

    it("has unique frequency values", () => {
      const frequencies = KPI_FREQUENCIES.map((f) => f.frequency);
      expect(new Set(frequencies).size).toBe(frequencies.length);
    });

    it.each([
      "daily",
      "weekly",
      "monthly",
      "quarterly",
      "annual",
    ] as const)("includes frequency '%s'", (frequency) => {
      expect(KPI_FREQUENCIES.find((f) => f.frequency === frequency)).toBeDefined();
    });

    it("every entry has a non-empty label", () => {
      for (const entry of KPI_FREQUENCIES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("every entry has a non-empty frequency", () => {
      for (const entry of KPI_FREQUENCIES) {
        expect(entry.frequency.length).toBeGreaterThan(0);
      }
    });
  });

  // ── TREND_DIRECTIONS ─────────────────────────────────────────────────────

  describe("TREND_DIRECTIONS", () => {
    it("contains exactly 4 items", () => {
      expect(TREND_DIRECTIONS).toHaveLength(4);
    });

    it("has unique direction values", () => {
      const directions = TREND_DIRECTIONS.map((t) => t.direction);
      expect(new Set(directions).size).toBe(directions.length);
    });

    it.each([
      "improving",
      "stable",
      "declining",
      "new",
    ] as const)("includes direction '%s'", (direction) => {
      expect(TREND_DIRECTIONS.find((t) => t.direction === direction)).toBeDefined();
    });

    it("every entry has a non-empty label", () => {
      for (const entry of TREND_DIRECTIONS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("every entry has a non-empty direction", () => {
      for (const entry of TREND_DIRECTIONS) {
        expect(entry.direction.length).toBeGreaterThan(0);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeKpiMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeKpiMetrics", () => {
  // ── Empty inputs ─────────────────────────────────────────────────────────

  describe("empty inputs", () => {
    it("returns all zeroes when both arrays are empty", () => {
      const result = computeKpiMetrics([], []);
      expect(result.total_kpis).toBe(0);
      expect(result.active_kpis).toBe(0);
      expect(result.on_target).toBe(0);
      expect(result.above_target).toBe(0);
      expect(result.below_target).toBe(0);
      expect(result.at_risk).toBe(0);
      expect(result.not_measured).toBe(0);
      expect(result.on_target_rate).toBeNull();;
      expect(result.improving_count).toBe(0);
      expect(result.declining_count).toBe(0);
    });

    it("returns empty objects for by_domain, by_status, by_trend when empty", () => {
      const result = computeKpiMetrics([], []);
      expect(result.by_domain).toEqual({});
      expect(result.by_status).toEqual({});
      expect(result.by_trend).toEqual({});
    });

    it("returns definitions count when definitions exist but no measurements", () => {
      const defs = [makeDefinition(), makeDefinition()];
      const result = computeKpiMetrics(defs, []);
      expect(result.total_kpis).toBe(2);
      expect(result.active_kpis).toBe(2);
      expect(result.on_target).toBe(0);
    });

    it("returns zero on_target_rate when no measurements exist", () => {
      const result = computeKpiMetrics([makeDefinition()], []);
      expect(result.on_target_rate).toBeNull();;
    });
  });

  // ── total_kpis ───────────────────────────────────────────────────────────

  describe("total_kpis", () => {
    it("counts all definitions regardless of active status", () => {
      const defs = [
        makeDefinition({ active: true }),
        makeDefinition({ active: false }),
        makeDefinition({ active: true }),
      ];
      const result = computeKpiMetrics(defs, []);
      expect(result.total_kpis).toBe(3);
    });
  });

  // ── active_kpis ──────────────────────────────────────────────────────────

  describe("active_kpis", () => {
    it("counts only active definitions", () => {
      const defs = [
        makeDefinition({ active: true }),
        makeDefinition({ active: false }),
        makeDefinition({ active: true }),
      ];
      const result = computeKpiMetrics(defs, []);
      expect(result.active_kpis).toBe(2);
    });

    it("returns zero when all definitions are inactive", () => {
      const defs = [
        makeDefinition({ active: false }),
        makeDefinition({ active: false }),
      ];
      const result = computeKpiMetrics(defs, []);
      expect(result.active_kpis).toBe(0);
    });
  });

  // ── Status counts ────────────────────────────────────────────────────────

  describe("status counts", () => {
    it("counts on_target correctly", () => {
      const kpiId = "k1";
      const result = computeKpiMetrics(
        [makeDefinition({ id: kpiId })],
        [makeMeasurement({ kpi_id: kpiId, status: "on_target" })],
      );
      expect(result.on_target).toBe(1);
    });

    it("counts above_target correctly", () => {
      const kpiId = "k1";
      const result = computeKpiMetrics(
        [makeDefinition({ id: kpiId })],
        [makeMeasurement({ kpi_id: kpiId, status: "above_target" })],
      );
      expect(result.above_target).toBe(1);
    });

    it("counts below_target correctly", () => {
      const kpiId = "k1";
      const result = computeKpiMetrics(
        [makeDefinition({ id: kpiId })],
        [makeMeasurement({ kpi_id: kpiId, status: "below_target" })],
      );
      expect(result.below_target).toBe(1);
    });

    it("counts at_risk correctly", () => {
      const kpiId = "k1";
      const result = computeKpiMetrics(
        [makeDefinition({ id: kpiId })],
        [makeMeasurement({ kpi_id: kpiId, status: "at_risk" })],
      );
      expect(result.at_risk).toBe(1);
    });

    it("counts not_measured correctly", () => {
      const kpiId = "k1";
      const result = computeKpiMetrics(
        [makeDefinition({ id: kpiId })],
        [makeMeasurement({ kpi_id: kpiId, status: "not_measured" })],
      );
      expect(result.not_measured).toBe(1);
    });

    it("counts mixed statuses across multiple KPIs", () => {
      const defs = [
        makeDefinition({ id: "k1" }),
        makeDefinition({ id: "k2" }),
        makeDefinition({ id: "k3" }),
        makeDefinition({ id: "k4" }),
        makeDefinition({ id: "k5" }),
      ];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "on_target" }),
        makeMeasurement({ kpi_id: "k2", status: "above_target" }),
        makeMeasurement({ kpi_id: "k3", status: "below_target" }),
        makeMeasurement({ kpi_id: "k4", status: "at_risk" }),
        makeMeasurement({ kpi_id: "k5", status: "not_measured" }),
      ];
      const result = computeKpiMetrics(defs, measurements);
      expect(result.on_target).toBe(1);
      expect(result.above_target).toBe(1);
      expect(result.below_target).toBe(1);
      expect(result.at_risk).toBe(1);
      expect(result.not_measured).toBe(1);
    });
  });

  // ── Latest measurement per KPI ───────────────────────────────────────────

  describe("latest measurement per KPI (Map deduplication)", () => {
    it("uses the latest measurement when multiple exist for the same KPI", () => {
      const kpiId = "k1";
      const defs = [makeDefinition({ id: kpiId })];
      const measurements = [
        makeMeasurement({ kpi_id: kpiId, status: "below_target", measurement_date: "2025-01-01" }),
        makeMeasurement({ kpi_id: kpiId, status: "on_target", measurement_date: "2025-06-01" }),
        makeMeasurement({ kpi_id: kpiId, status: "at_risk", measurement_date: "2025-03-01" }),
      ];
      const result = computeKpiMetrics(defs, measurements);
      expect(result.on_target).toBe(1);
      expect(result.below_target).toBe(0);
      expect(result.at_risk).toBe(0);
    });

    it("ignores older measurements for trend counts", () => {
      const kpiId = "k1";
      const measurements = [
        makeMeasurement({ kpi_id: kpiId, trend: "declining", measurement_date: "2025-01-01" }),
        makeMeasurement({ kpi_id: kpiId, trend: "improving", measurement_date: "2025-06-01" }),
      ];
      const result = computeKpiMetrics([makeDefinition({ id: kpiId })], measurements);
      expect(result.improving_count).toBe(1);
      expect(result.declining_count).toBe(0);
    });

    it("selects the latest measurement even when dates are close", () => {
      const kpiId = "k1";
      const measurements = [
        makeMeasurement({ kpi_id: kpiId, status: "at_risk", measurement_date: "2025-06-14" }),
        makeMeasurement({ kpi_id: kpiId, status: "on_target", measurement_date: "2025-06-15" }),
      ];
      const result = computeKpiMetrics([makeDefinition({ id: kpiId })], measurements);
      expect(result.on_target).toBe(1);
      expect(result.at_risk).toBe(0);
    });

    it("handles multiple KPIs each with multiple measurements", () => {
      const defs = [makeDefinition({ id: "k1" }), makeDefinition({ id: "k2" })];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "below_target", measurement_date: "2025-01-01" }),
        makeMeasurement({ kpi_id: "k1", status: "on_target", measurement_date: "2025-06-01" }),
        makeMeasurement({ kpi_id: "k2", status: "on_target", measurement_date: "2025-01-01" }),
        makeMeasurement({ kpi_id: "k2", status: "at_risk", measurement_date: "2025-06-01" }),
      ];
      const result = computeKpiMetrics(defs, measurements);
      expect(result.on_target).toBe(1);
      expect(result.at_risk).toBe(1);
    });
  });

  // ── on_target_rate ───────────────────────────────────────────────────────

  describe("on_target_rate", () => {
    it("calculates 100% when all measured KPIs are on or above target", () => {
      const defs = [makeDefinition({ id: "k1" }), makeDefinition({ id: "k2" })];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "on_target" }),
        makeMeasurement({ kpi_id: "k2", status: "above_target" }),
      ];
      const result = computeKpiMetrics(defs, measurements);
      expect(result.on_target_rate).toBe(100);
    });

    it("calculates 0% when no KPIs are on or above target", () => {
      const defs = [makeDefinition({ id: "k1" }), makeDefinition({ id: "k2" })];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "below_target" }),
        makeMeasurement({ kpi_id: "k2", status: "at_risk" }),
      ];
      const result = computeKpiMetrics(defs, measurements);
      expect(result.on_target_rate).toBe(0);
    });

    it("excludes not_measured from the denominator", () => {
      const defs = [
        makeDefinition({ id: "k1" }),
        makeDefinition({ id: "k2" }),
        makeDefinition({ id: "k3" }),
      ];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "on_target" }),
        makeMeasurement({ kpi_id: "k2", status: "below_target" }),
        makeMeasurement({ kpi_id: "k3", status: "not_measured" }),
      ];
      // measured = 3 - 1 = 2, on_target+above = 1
      // rate = 1/2 * 100 = 50.0
      const result = computeKpiMetrics(defs, measurements);
      expect(result.on_target_rate).toBe(50);
    });

    it("rounds to 1 decimal place", () => {
      const defs = [
        makeDefinition({ id: "k1" }),
        makeDefinition({ id: "k2" }),
        makeDefinition({ id: "k3" }),
      ];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "on_target" }),
        makeMeasurement({ kpi_id: "k2", status: "below_target" }),
        makeMeasurement({ kpi_id: "k3", status: "at_risk" }),
      ];
      // 1/3 * 100 = 33.333... => rounded to 33.3
      const result = computeKpiMetrics(defs, measurements);
      expect(result.on_target_rate).toBe(33.3);
    });

    it("returns 0 when all measurements are not_measured", () => {
      const defs = [makeDefinition({ id: "k1" })];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "not_measured" }),
      ];
      // measured = 1 - 1 = 0 => rate = 0
      const result = computeKpiMetrics(defs, measurements);
      expect(result.on_target_rate).toBeNull();;
    });

    it("handles 2/3 on target rounding", () => {
      const defs = [
        makeDefinition({ id: "k1" }),
        makeDefinition({ id: "k2" }),
        makeDefinition({ id: "k3" }),
      ];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "on_target" }),
        makeMeasurement({ kpi_id: "k2", status: "above_target" }),
        makeMeasurement({ kpi_id: "k3", status: "below_target" }),
      ];
      // 2/3 * 100 = 66.666... => 66.7
      const result = computeKpiMetrics(defs, measurements);
      expect(result.on_target_rate).toBe(66.7);
    });

    it("includes above_target in the numerator", () => {
      const defs = [makeDefinition({ id: "k1" })];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "above_target" }),
      ];
      const result = computeKpiMetrics(defs, measurements);
      expect(result.on_target_rate).toBe(100);
    });
  });

  // ── improving_count / declining_count ────────────────────────────────────

  describe("improving_count and declining_count", () => {
    it("counts improving trends", () => {
      const defs = [makeDefinition({ id: "k1" }), makeDefinition({ id: "k2" })];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", trend: "improving" }),
        makeMeasurement({ kpi_id: "k2", trend: "improving" }),
      ];
      const result = computeKpiMetrics(defs, measurements);
      expect(result.improving_count).toBe(2);
    });

    it("counts declining trends", () => {
      const defs = [makeDefinition({ id: "k1" }), makeDefinition({ id: "k2" })];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", trend: "declining" }),
        makeMeasurement({ kpi_id: "k2", trend: "declining" }),
      ];
      const result = computeKpiMetrics(defs, measurements);
      expect(result.declining_count).toBe(2);
    });

    it("does not count stable or new trends in improving/declining", () => {
      const defs = [makeDefinition({ id: "k1" }), makeDefinition({ id: "k2" })];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", trend: "stable" }),
        makeMeasurement({ kpi_id: "k2", trend: "new" }),
      ];
      const result = computeKpiMetrics(defs, measurements);
      expect(result.improving_count).toBe(0);
      expect(result.declining_count).toBe(0);
    });

    it("counts mixed trends correctly", () => {
      const defs = [
        makeDefinition({ id: "k1" }),
        makeDefinition({ id: "k2" }),
        makeDefinition({ id: "k3" }),
        makeDefinition({ id: "k4" }),
      ];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", trend: "improving" }),
        makeMeasurement({ kpi_id: "k2", trend: "declining" }),
        makeMeasurement({ kpi_id: "k3", trend: "stable" }),
        makeMeasurement({ kpi_id: "k4", trend: "new" }),
      ];
      const result = computeKpiMetrics(defs, measurements);
      expect(result.improving_count).toBe(1);
      expect(result.declining_count).toBe(1);
    });
  });

  // ── by_domain ────────────────────────────────────────────────────────────

  describe("by_domain", () => {
    it("groups definitions by domain with total count", () => {
      const defs = [
        makeDefinition({ id: "k1", domain: "safeguarding" }),
        makeDefinition({ id: "k2", domain: "safeguarding" }),
        makeDefinition({ id: "k3", domain: "health" }),
      ];
      const result = computeKpiMetrics(defs, []);
      expect(result.by_domain.safeguarding.total).toBe(2);
      expect(result.by_domain.health.total).toBe(1);
    });

    it("counts on_target per domain from latest measurements", () => {
      const defs = [
        makeDefinition({ id: "k1", domain: "safeguarding" }),
        makeDefinition({ id: "k2", domain: "safeguarding" }),
        makeDefinition({ id: "k3", domain: "health" }),
      ];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "on_target" }),
        makeMeasurement({ kpi_id: "k2", status: "below_target" }),
        makeMeasurement({ kpi_id: "k3", status: "above_target" }),
      ];
      const result = computeKpiMetrics(defs, measurements);
      expect(result.by_domain.safeguarding.on_target).toBe(1);
      expect(result.by_domain.health.on_target).toBe(1);
    });

    it("counts above_target as on_target in by_domain", () => {
      const defs = [makeDefinition({ id: "k1", domain: "education" })];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "above_target" }),
      ];
      const result = computeKpiMetrics(defs, measurements);
      expect(result.by_domain.education.on_target).toBe(1);
    });

    it("does not count below_target as on_target in by_domain", () => {
      const defs = [makeDefinition({ id: "k1", domain: "education" })];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "below_target" }),
      ];
      const result = computeKpiMetrics(defs, measurements);
      expect(result.by_domain.education.on_target).toBe(0);
    });

    it("handles definition without any matching measurement", () => {
      const defs = [makeDefinition({ id: "k1", domain: "finance" })];
      const result = computeKpiMetrics(defs, []);
      expect(result.by_domain.finance).toEqual({ total: 1, on_target: 0 });
    });

    it("includes inactive definitions in domain totals", () => {
      const defs = [
        makeDefinition({ id: "k1", domain: "staffing", active: false }),
        makeDefinition({ id: "k2", domain: "staffing", active: true }),
      ];
      const result = computeKpiMetrics(defs, []);
      expect(result.by_domain.staffing.total).toBe(2);
    });
  });

  // ── by_status ────────────────────────────────────────────────────────────

  describe("by_status", () => {
    it("aggregates status counts from latest measurements", () => {
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "on_target" }),
        makeMeasurement({ kpi_id: "k2", status: "on_target" }),
        makeMeasurement({ kpi_id: "k3", status: "below_target" }),
      ];
      const result = computeKpiMetrics(
        [makeDefinition({ id: "k1" }), makeDefinition({ id: "k2" }), makeDefinition({ id: "k3" })],
        measurements,
      );
      expect(result.by_status.on_target).toBe(2);
      expect(result.by_status.below_target).toBe(1);
    });

    it("only includes statuses that are present", () => {
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "on_target" }),
      ];
      const result = computeKpiMetrics([makeDefinition({ id: "k1" })], measurements);
      expect(result.by_status.on_target).toBe(1);
      expect(result.by_status.at_risk).toBeUndefined();
    });
  });

  // ── by_trend ─────────────────────────────────────────────────────────────

  describe("by_trend", () => {
    it("aggregates trend counts from latest measurements", () => {
      const measurements = [
        makeMeasurement({ kpi_id: "k1", trend: "improving" }),
        makeMeasurement({ kpi_id: "k2", trend: "stable" }),
        makeMeasurement({ kpi_id: "k3", trend: "declining" }),
        makeMeasurement({ kpi_id: "k4", trend: "new" }),
      ];
      const defs = [
        makeDefinition({ id: "k1" }),
        makeDefinition({ id: "k2" }),
        makeDefinition({ id: "k3" }),
        makeDefinition({ id: "k4" }),
      ];
      const result = computeKpiMetrics(defs, measurements);
      expect(result.by_trend.improving).toBe(1);
      expect(result.by_trend.stable).toBe(1);
      expect(result.by_trend.declining).toBe(1);
      expect(result.by_trend.new).toBe(1);
    });

    it("only includes trends that are present", () => {
      const measurements = [
        makeMeasurement({ kpi_id: "k1", trend: "stable" }),
      ];
      const result = computeKpiMetrics([makeDefinition({ id: "k1" })], measurements);
      expect(result.by_trend.stable).toBe(1);
      expect(result.by_trend.improving).toBeUndefined();
    });
  });

  // ── Single item ──────────────────────────────────────────────────────────

  describe("single definition / single measurement", () => {
    it("returns correct metrics for a single on-target KPI", () => {
      const def = makeDefinition({ id: "k1" });
      const m = makeMeasurement({ kpi_id: "k1", status: "on_target", trend: "stable" });
      const result = computeKpiMetrics([def], [m]);
      expect(result.total_kpis).toBe(1);
      expect(result.active_kpis).toBe(1);
      expect(result.on_target).toBe(1);
      expect(result.on_target_rate).toBe(100);
      expect(result.improving_count).toBe(0);
      expect(result.declining_count).toBe(0);
    });
  });

  // ── Return type shape ────────────────────────────────────────────────────

  describe("return type", () => {
    it("returns all 13 expected fields", () => {
      const result = computeKpiMetrics([], []);
      const keys = Object.keys(result);
      expect(keys).toContain("total_kpis");
      expect(keys).toContain("active_kpis");
      expect(keys).toContain("on_target");
      expect(keys).toContain("above_target");
      expect(keys).toContain("below_target");
      expect(keys).toContain("at_risk");
      expect(keys).toContain("not_measured");
      expect(keys).toContain("on_target_rate");
      expect(keys).toContain("improving_count");
      expect(keys).toContain("declining_count");
      expect(keys).toContain("by_domain");
      expect(keys).toContain("by_status");
      expect(keys).toContain("by_trend");
      expect(keys).toHaveLength(13);
    });

    it("returns numeric types for count fields", () => {
      const result = computeKpiMetrics([], []);
      expect(typeof result.total_kpis).toBe("number");
      expect(typeof result.active_kpis).toBe("number");
      expect(typeof result.on_target).toBe("number");
      expect(typeof result.above_target).toBe("number");
      expect(typeof result.below_target).toBe("number");
      expect(typeof result.at_risk).toBe("number");
      expect(typeof result.not_measured).toBe("number");
      expect(["number", "object"]).toContain(typeof result.on_target_rate); // number | null
      expect(typeof result.improving_count).toBe("number");
      expect(typeof result.declining_count).toBe("number");
    });

    it("returns objects for aggregate fields", () => {
      const result = computeKpiMetrics([], []);
      expect(typeof result.by_domain).toBe("object");
      expect(typeof result.by_status).toBe("object");
      expect(typeof result.by_trend).toBe("object");
    });
  });

  // ── Comprehensive scenario ───────────────────────────────────────────────

  describe("comprehensive scenario", () => {
    it("handles a realistic multi-KPI, multi-domain setup", () => {
      const defs = [
        makeDefinition({ id: "k1", domain: "safeguarding", active: true }),
        makeDefinition({ id: "k2", domain: "safeguarding", active: true }),
        makeDefinition({ id: "k3", domain: "health", active: true }),
        makeDefinition({ id: "k4", domain: "education", active: false }),
        makeDefinition({ id: "k5", domain: "staffing", active: true }),
      ];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "on_target", trend: "improving" }),
        makeMeasurement({ kpi_id: "k2", status: "above_target", trend: "stable" }),
        makeMeasurement({ kpi_id: "k3", status: "below_target", trend: "declining" }),
        makeMeasurement({ kpi_id: "k4", status: "at_risk", trend: "declining" }),
        makeMeasurement({ kpi_id: "k5", status: "not_measured", trend: "new" }),
      ];
      const result = computeKpiMetrics(defs, measurements);
      expect(result.total_kpis).toBe(5);
      expect(result.active_kpis).toBe(4);
      expect(result.on_target).toBe(1);
      expect(result.above_target).toBe(1);
      expect(result.below_target).toBe(1);
      expect(result.at_risk).toBe(1);
      expect(result.not_measured).toBe(1);
      // measured = 5 - 1 = 4, on_target+above = 2
      // rate = 2/4 * 100 = 50.0
      expect(result.on_target_rate).toBe(50);
      expect(result.improving_count).toBe(1);
      expect(result.declining_count).toBe(2);
      expect(result.by_domain.safeguarding.total).toBe(2);
      expect(result.by_domain.safeguarding.on_target).toBe(2);
      expect(result.by_domain.health.total).toBe(1);
      expect(result.by_domain.health.on_target).toBe(0);
      expect(result.by_domain.education.total).toBe(1);
      expect(result.by_domain.education.on_target).toBe(0);
      expect(result.by_domain.staffing.total).toBe(1);
      expect(result.by_domain.staffing.on_target).toBe(0);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. identifyKpiAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyKpiAlerts", () => {
  const now = new Date("2025-06-15T12:00:00Z");

  // ── Empty inputs ─────────────────────────────────────────────────────────

  describe("empty inputs", () => {
    it("returns no alerts when both arrays are empty", () => {
      const alerts = identifyKpiAlerts([], [], now);
      expect(alerts).toEqual([]);
    });

    it("returns no alerts when definitions exist but no measurements and all inactive", () => {
      const defs = [makeDefinition({ active: false })];
      const alerts = identifyKpiAlerts(defs, [], now);
      expect(alerts).toEqual([]);
    });
  });

  // ── kpi_at_risk ──────────────────────────────────────────────────────────

  describe("kpi_at_risk alerts", () => {
    it("generates a critical alert for at_risk status", () => {
      const m = makeMeasurement({
        kpi_id: "k1",
        kpi_name: "Safeguarding Score",
        status: "at_risk",
        value: 55,
        target: 90,
      });
      const alerts = identifyKpiAlerts([], [m], now);
      const atRisk = alerts.filter((a) => a.type === "kpi_at_risk");
      expect(atRisk).toHaveLength(1);
      expect(atRisk[0].severity).toBe("critical");
    });

    it("includes KPI name, value, and target in the message", () => {
      const m = makeMeasurement({
        kpi_id: "k1",
        kpi_name: "Placement Stability",
        status: "at_risk",
        value: 40,
        target: 85,
      });
      const alerts = identifyKpiAlerts([], [m], now);
      const atRisk = alerts.find((a) => a.type === "kpi_at_risk");
      expect(atRisk!.message).toContain("Placement Stability");
      expect(atRisk!.message).toContain("40");
      expect(atRisk!.message).toContain("85");
    });

    it("sets the id to the measurement id", () => {
      const mId = crypto.randomUUID();
      const m = makeMeasurement({
        id: mId,
        kpi_id: "k1",
        status: "at_risk",
      });
      const alerts = identifyKpiAlerts([], [m], now);
      const atRisk = alerts.find((a) => a.type === "kpi_at_risk");
      expect(atRisk!.id).toBe(mId);
    });

    it("generates multiple at_risk alerts for multiple at_risk KPIs", () => {
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "at_risk" }),
        makeMeasurement({ kpi_id: "k2", status: "at_risk" }),
      ];
      const alerts = identifyKpiAlerts([], measurements, now);
      const atRisk = alerts.filter((a) => a.type === "kpi_at_risk");
      expect(atRisk).toHaveLength(2);
    });
  });

  // ── kpi_below_target ─────────────────────────────────────────────────────

  describe("kpi_below_target alerts", () => {
    it("generates a high-severity alert for below_target status", () => {
      const m = makeMeasurement({
        kpi_id: "k1",
        kpi_name: "Staff Training",
        status: "below_target",
        value: 70,
        target: 90,
      });
      const alerts = identifyKpiAlerts([], [m], now);
      const below = alerts.filter((a) => a.type === "kpi_below_target");
      expect(below).toHaveLength(1);
      expect(below[0].severity).toBe("high");
    });

    it("includes KPI name, value, and target in the message", () => {
      const m = makeMeasurement({
        kpi_id: "k1",
        kpi_name: "Education Attendance",
        status: "below_target",
        value: 75,
        target: 95,
      });
      const alerts = identifyKpiAlerts([], [m], now);
      const below = alerts.find((a) => a.type === "kpi_below_target");
      expect(below!.message).toContain("Education Attendance");
      expect(below!.message).toContain("75");
      expect(below!.message).toContain("95");
    });

    it("sets the id to the measurement id", () => {
      const mId = crypto.randomUUID();
      const m = makeMeasurement({
        id: mId,
        kpi_id: "k1",
        status: "below_target",
      });
      const alerts = identifyKpiAlerts([], [m], now);
      const below = alerts.find((a) => a.type === "kpi_below_target");
      expect(below!.id).toBe(mId);
    });

    it("generates multiple below_target alerts", () => {
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "below_target" }),
        makeMeasurement({ kpi_id: "k2", status: "below_target" }),
        makeMeasurement({ kpi_id: "k3", status: "below_target" }),
      ];
      const alerts = identifyKpiAlerts([], measurements, now);
      const below = alerts.filter((a) => a.type === "kpi_below_target");
      expect(below).toHaveLength(3);
    });
  });

  // ── kpi_declining ────────────────────────────────────────────────────────

  describe("kpi_declining alerts", () => {
    it("generates a medium-severity alert for declining trend", () => {
      const m = makeMeasurement({
        kpi_id: "k1",
        kpi_name: "Behaviour Score",
        trend: "declining",
        status: "on_target",
      });
      const alerts = identifyKpiAlerts([], [m], now);
      const declining = alerts.filter((a) => a.type === "kpi_declining");
      expect(declining).toHaveLength(1);
      expect(declining[0].severity).toBe("medium");
    });

    it("includes KPI name in the message", () => {
      const m = makeMeasurement({
        kpi_id: "k1",
        kpi_name: "Health Checks",
        trend: "declining",
        status: "on_target",
      });
      const alerts = identifyKpiAlerts([], [m], now);
      const declining = alerts.find((a) => a.type === "kpi_declining");
      expect(declining!.message).toContain("Health Checks");
    });

    it("includes action guidance in the message", () => {
      const m = makeMeasurement({
        kpi_id: "k1",
        trend: "declining",
        status: "on_target",
      });
      const alerts = identifyKpiAlerts([], [m], now);
      const declining = alerts.find((a) => a.type === "kpi_declining");
      expect(declining!.message).toContain("declining trend");
    });

    it("does not generate declining alert for stable trend", () => {
      const m = makeMeasurement({
        kpi_id: "k1",
        trend: "stable",
        status: "on_target",
      });
      const alerts = identifyKpiAlerts([], [m], now);
      const declining = alerts.filter((a) => a.type === "kpi_declining");
      expect(declining).toHaveLength(0);
    });

    it("does not generate declining alert for improving trend", () => {
      const m = makeMeasurement({
        kpi_id: "k1",
        trend: "improving",
        status: "on_target",
      });
      const alerts = identifyKpiAlerts([], [m], now);
      const declining = alerts.filter((a) => a.type === "kpi_declining");
      expect(declining).toHaveLength(0);
    });

    it("does not generate declining alert for new trend", () => {
      const m = makeMeasurement({
        kpi_id: "k1",
        trend: "new",
        status: "on_target",
      });
      const alerts = identifyKpiAlerts([], [m], now);
      const declining = alerts.filter((a) => a.type === "kpi_declining");
      expect(declining).toHaveLength(0);
    });
  });

  // ── kpi_not_measured ─────────────────────────────────────────────────────

  describe("kpi_not_measured alerts", () => {
    it("generates a medium-severity alert for active KPI with no measurements", () => {
      const def = makeDefinition({ id: "k1", name: "Missing KPI", active: true });
      const alerts = identifyKpiAlerts([def], [], now);
      const notMeasured = alerts.filter((a) => a.type === "kpi_not_measured");
      expect(notMeasured).toHaveLength(1);
      expect(notMeasured[0].severity).toBe("medium");
    });

    it("includes KPI name in the message", () => {
      const def = makeDefinition({ id: "k1", name: "Quarterly Review", active: true });
      const alerts = identifyKpiAlerts([def], [], now);
      const notMeasured = alerts.find((a) => a.type === "kpi_not_measured");
      expect(notMeasured!.message).toContain("Quarterly Review");
    });

    it("includes data collection guidance in the message", () => {
      const def = makeDefinition({ id: "k1", name: "Test", active: true });
      const alerts = identifyKpiAlerts([def], [], now);
      const notMeasured = alerts.find((a) => a.type === "kpi_not_measured");
      expect(notMeasured!.message).toContain("no measurements");
    });

    it("sets the id to the definition id", () => {
      const defId = crypto.randomUUID();
      const def = makeDefinition({ id: defId, active: true });
      const alerts = identifyKpiAlerts([def], [], now);
      const notMeasured = alerts.find((a) => a.type === "kpi_not_measured");
      expect(notMeasured!.id).toBe(defId);
    });

    it("does not generate alert for inactive KPI with no measurements", () => {
      const def = makeDefinition({ id: "k1", active: false });
      const alerts = identifyKpiAlerts([def], [], now);
      const notMeasured = alerts.filter((a) => a.type === "kpi_not_measured");
      expect(notMeasured).toHaveLength(0);
    });

    it("does not generate alert for active KPI that has measurements", () => {
      const def = makeDefinition({ id: "k1", active: true });
      const m = makeMeasurement({ kpi_id: "k1", status: "on_target" });
      const alerts = identifyKpiAlerts([def], [m], now);
      const notMeasured = alerts.filter((a) => a.type === "kpi_not_measured");
      expect(notMeasured).toHaveLength(0);
    });

    it("generates alerts for multiple unmeasured KPIs", () => {
      const defs = [
        makeDefinition({ id: "k1", active: true }),
        makeDefinition({ id: "k2", active: true }),
        makeDefinition({ id: "k3", active: true }),
      ];
      const alerts = identifyKpiAlerts(defs, [], now);
      const notMeasured = alerts.filter((a) => a.type === "kpi_not_measured");
      expect(notMeasured).toHaveLength(3);
    });
  });

  // ── Latest measurement deduplication ─────────────────────────────────────

  describe("latest measurement per KPI for alerts", () => {
    it("uses only the latest measurement for alert generation", () => {
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "at_risk", trend: "declining", measurement_date: "2025-01-01" }),
        makeMeasurement({ kpi_id: "k1", status: "on_target", trend: "improving", measurement_date: "2025-06-01" }),
      ];
      const alerts = identifyKpiAlerts([], measurements, now);
      expect(alerts.filter((a) => a.type === "kpi_at_risk")).toHaveLength(0);
      expect(alerts.filter((a) => a.type === "kpi_declining")).toHaveLength(0);
    });

    it("generates alert when latest measurement is at risk despite earlier being on target", () => {
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "on_target", measurement_date: "2025-01-01" }),
        makeMeasurement({ kpi_id: "k1", status: "at_risk", measurement_date: "2025-06-01" }),
      ];
      const alerts = identifyKpiAlerts([], measurements, now);
      const atRisk = alerts.filter((a) => a.type === "kpi_at_risk");
      expect(atRisk).toHaveLength(1);
    });
  });

  // ── Combined scenarios ───────────────────────────────────────────────────

  describe("combined alert scenarios", () => {
    it("generates both at_risk and declining alerts for the same KPI", () => {
      const m = makeMeasurement({
        kpi_id: "k1",
        status: "at_risk",
        trend: "declining",
      });
      const alerts = identifyKpiAlerts([], [m], now);
      expect(alerts.filter((a) => a.type === "kpi_at_risk")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "kpi_declining")).toHaveLength(1);
    });

    it("generates both below_target and declining alerts for the same KPI", () => {
      const m = makeMeasurement({
        kpi_id: "k1",
        status: "below_target",
        trend: "declining",
      });
      const alerts = identifyKpiAlerts([], [m], now);
      expect(alerts.filter((a) => a.type === "kpi_below_target")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "kpi_declining")).toHaveLength(1);
    });

    it("generates all four alert types in a mixed scenario", () => {
      const defs = [
        makeDefinition({ id: "k4", active: true }),
      ];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "at_risk", trend: "stable" }),
        makeMeasurement({ kpi_id: "k2", status: "below_target", trend: "stable" }),
        makeMeasurement({ kpi_id: "k3", status: "on_target", trend: "declining" }),
      ];
      const alerts = identifyKpiAlerts(defs, measurements, now);
      const types = new Set(alerts.map((a) => a.type));
      expect(types.has("kpi_at_risk")).toBe(true);
      expect(types.has("kpi_below_target")).toBe(true);
      expect(types.has("kpi_declining")).toBe(true);
      expect(types.has("kpi_not_measured")).toBe(true);
    });

    it("does not generate alerts for on_target stable KPIs", () => {
      const def = makeDefinition({ id: "k1", active: true });
      const m = makeMeasurement({
        kpi_id: "k1",
        status: "on_target",
        trend: "stable",
      });
      const alerts = identifyKpiAlerts([def], [m], now);
      expect(alerts).toHaveLength(0);
    });

    it("does not generate alerts for above_target improving KPIs", () => {
      const def = makeDefinition({ id: "k1", active: true });
      const m = makeMeasurement({
        kpi_id: "k1",
        status: "above_target",
        trend: "improving",
      });
      const alerts = identifyKpiAlerts([def], [m], now);
      expect(alerts).toHaveLength(0);
    });

    it("handles a large number of mixed alerts", () => {
      const defs: KpiDefinition[] = [];
      const measurements: KpiMeasurement[] = [];
      for (let i = 0; i < 10; i++) {
        const id = `k${i}`;
        defs.push(makeDefinition({ id, active: true }));
        if (i < 5) {
          measurements.push(
            makeMeasurement({ kpi_id: id, status: "at_risk", trend: "declining" }),
          );
        }
        // remaining 5 definitions have no measurements
      }
      const alerts = identifyKpiAlerts(defs, measurements, now);
      expect(alerts.filter((a) => a.type === "kpi_at_risk")).toHaveLength(5);
      expect(alerts.filter((a) => a.type === "kpi_declining")).toHaveLength(5);
      expect(alerts.filter((a) => a.type === "kpi_not_measured")).toHaveLength(5);
    });
  });

  // ── Alert shape ──────────────────────────────────────────────────────────

  describe("alert shape", () => {
    it("every alert has type, severity, message, and id", () => {
      const m = makeMeasurement({ kpi_id: "k1", status: "at_risk", trend: "declining" });
      const def = makeDefinition({ id: "k2", active: true });
      const alerts = identifyKpiAlerts([def], [m], now);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
        expect(typeof alert.type).toBe("string");
        expect(typeof alert.severity).toBe("string");
        expect(typeof alert.message).toBe("string");
        expect(typeof alert.id).toBe("string");
      }
    });

    it("severity values are valid enum members", () => {
      const m = makeMeasurement({ kpi_id: "k1", status: "at_risk", trend: "declining" });
      const def = makeDefinition({ id: "k2", active: true });
      const alerts = identifyKpiAlerts([def], [m], now);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listDefinitions ──────────────────────────────────────────────────────

  describe("listDefinitions", () => {
    it("returns ok: true with empty data array", async () => {
      const result = await listDefinitions("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok: true with empty data when filters are provided", async () => {
      const result = await listDefinitions("home-1", {
        domain: "safeguarding",
        active: true,
        limit: 50,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok: true regardless of home_id value", async () => {
      const result = await listDefinitions("any-home-id");
      expect(result.ok).toBe(true);
    });

    it("data property is an array", async () => {
      const result = await listDefinitions("home-1");
      expect(Array.isArray(result.ok ? result.data : null)).toBe(true);
    });
  });

  // ── createDefinition ─────────────────────────────────────────────────────

  describe("createDefinition", () => {
    it("returns ok: false with Supabase not configured error", async () => {
      const result = await createDefinition({
        homeId: "home-1",
        name: "Test KPI",
        description: "A test KPI",
        domain: "safeguarding",
        unit: "%",
        targetValue: 90,
        thresholdAmber: 80,
        thresholdRed: 70,
        frequency: "monthly",
        dataSource: "manual",
        responsiblePerson: "Manager",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Supabase not configured");
      }
    });

    it("returns error even with higherIsBetter override", async () => {
      const result = await createDefinition({
        homeId: "home-1",
        name: "Test",
        description: "Test",
        domain: "health",
        unit: "days",
        targetValue: 5,
        thresholdAmber: 7,
        thresholdRed: 10,
        higherIsBetter: false,
        frequency: "weekly",
        dataSource: "auto",
        responsiblePerson: "Nurse",
      });
      expect(result.ok).toBe(false);
    });
  });

  // ── updateDefinition ─────────────────────────────────────────────────────

  describe("updateDefinition", () => {
    it("returns ok: false with Supabase not configured error", async () => {
      const result = await updateDefinition("def-1", { name: "Updated" });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Supabase not configured");
      }
    });

    it("returns error regardless of update payload", async () => {
      const result = await updateDefinition("def-1", {
        active: false,
        target_value: 100,
      });
      expect(result.ok).toBe(false);
    });
  });

  // ── listMeasurements ─────────────────────────────────────────────────────

  describe("listMeasurements", () => {
    it("returns ok: true with empty data array", async () => {
      const result = await listMeasurements("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok: true with empty data when filters are provided", async () => {
      const result = await listMeasurements("home-1", {
        kpiId: "k1",
        status: "on_target",
        dateFrom: "2025-01-01",
        dateTo: "2025-12-31",
        limit: 10,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok: true regardless of home_id value", async () => {
      const result = await listMeasurements("different-home");
      expect(result.ok).toBe(true);
    });

    it("data property is an array", async () => {
      const result = await listMeasurements("home-1");
      expect(Array.isArray(result.ok ? result.data : null)).toBe(true);
    });
  });

  // ── createMeasurement ────────────────────────────────────────────────────

  describe("createMeasurement", () => {
    it("returns ok: false with Supabase not configured error", async () => {
      const result = await createMeasurement({
        homeId: "home-1",
        kpiId: "k1",
        kpiName: "Test KPI",
        measurementDate: "2025-06-01",
        period: "2025-06",
        value: 92,
        target: 90,
        status: "on_target",
        trend: "stable",
        measuredBy: "Manager",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Supabase not configured");
      }
    });

    it("returns error even with optional fields provided", async () => {
      const result = await createMeasurement({
        homeId: "home-1",
        kpiId: "k1",
        kpiName: "Test",
        measurementDate: "2025-06-01",
        period: "2025-06",
        value: 50,
        target: 90,
        status: "below_target",
        trend: "declining",
        commentary: "Needs improvement",
        actionsIfBelow: "Schedule review meeting",
        measuredBy: "Manager",
      });
      expect(result.ok).toBe(false);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  // ── Single item ──────────────────────────────────────────────────────────

  describe("single item arrays", () => {
    it("computeKpiMetrics handles a single definition and single measurement", () => {
      const def = makeDefinition({ id: "k1", domain: "compliance" });
      const m = makeMeasurement({ kpi_id: "k1", status: "above_target", trend: "improving" });
      const result = computeKpiMetrics([def], [m]);
      expect(result.total_kpis).toBe(1);
      expect(result.above_target).toBe(1);
      expect(result.improving_count).toBe(1);
      expect(result.on_target_rate).toBe(100);
      expect(result.by_domain.compliance).toEqual({ total: 1, on_target: 1 });
    });

    it("identifyKpiAlerts handles a single at_risk measurement", () => {
      const m = makeMeasurement({ kpi_id: "k1", status: "at_risk" });
      const alerts = identifyKpiAlerts([], [m]);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("kpi_at_risk");
    });

    it("identifyKpiAlerts handles a single unmeasured active definition", () => {
      const def = makeDefinition({ id: "k1", active: true });
      const alerts = identifyKpiAlerts([def], []);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("kpi_not_measured");
    });
  });

  // ── Large datasets ───────────────────────────────────────────────────────

  describe("large datasets", () => {
    it("computeKpiMetrics handles 100 definitions and measurements", () => {
      const defs: KpiDefinition[] = [];
      const measurements: KpiMeasurement[] = [];
      const domains: Array<KpiDefinition["domain"]> = [
        "safeguarding", "health", "education", "behaviour", "staffing",
      ];
      for (let i = 0; i < 100; i++) {
        const id = `kpi-${i}`;
        defs.push(makeDefinition({ id, domain: domains[i % domains.length] }));
        measurements.push(
          makeMeasurement({
            kpi_id: id,
            status: i % 2 === 0 ? "on_target" : "below_target",
            trend: i % 3 === 0 ? "improving" : "stable",
          }),
        );
      }
      const result = computeKpiMetrics(defs, measurements);
      expect(result.total_kpis).toBe(100);
      expect(result.active_kpis).toBe(100);
      expect(result.on_target + result.below_target).toBe(100);
      expect(result.on_target).toBe(50);
      expect(result.below_target).toBe(50);
    });

    it("identifyKpiAlerts handles 50 at_risk measurements", () => {
      const measurements: KpiMeasurement[] = [];
      for (let i = 0; i < 50; i++) {
        measurements.push(
          makeMeasurement({ kpi_id: `k${i}`, status: "at_risk" }),
        );
      }
      const alerts = identifyKpiAlerts([], measurements);
      const atRisk = alerts.filter((a) => a.type === "kpi_at_risk");
      expect(atRisk).toHaveLength(50);
    });

    it("computeKpiMetrics handles many measurements for the same KPI", () => {
      const def = makeDefinition({ id: "k1" });
      const measurements: KpiMeasurement[] = [];
      for (let i = 0; i < 50; i++) {
        const date = new Date(2025, 0, i + 1);
        measurements.push(
          makeMeasurement({
            kpi_id: "k1",
            status: i < 49 ? "below_target" : "on_target",
            measurement_date: date.toISOString().split("T")[0],
          }),
        );
      }
      // The latest (Feb 19) should be the one used — on_target
      const result = computeKpiMetrics([def], measurements);
      expect(result.on_target).toBe(1);
      expect(result.below_target).toBe(0);
    });
  });

  // ── Type checks ──────────────────────────────────────────────────────────

  describe("type checks", () => {
    it("computeKpiMetrics returns number for on_target_rate", () => {
      const result = computeKpiMetrics([], []);
      expect(["number", "object"]).toContain(typeof result.on_target_rate); // number | null
    });

    it("computeKpiMetrics by_domain values have total and on_target properties", () => {
      const defs = [makeDefinition({ domain: "health" })];
      const result = computeKpiMetrics(defs, []);
      expect(result.by_domain.health).toHaveProperty("total");
      expect(result.by_domain.health).toHaveProperty("on_target");
    });

    it("identifyKpiAlerts returns an array", () => {
      const result = identifyKpiAlerts([], []);
      expect(Array.isArray(result)).toBe(true);
    });

    it("alert severity is one of the expected values", () => {
      const m = makeMeasurement({ kpi_id: "k1", status: "at_risk" });
      const alerts = identifyKpiAlerts([], [m]);
      for (const a of alerts) {
        expect(["critical", "high", "medium"]).toContain(a.severity);
      }
    });

    it("computeKpiMetrics by_status values are numbers", () => {
      const defs = [makeDefinition({ id: "k1" })];
      const measurements = [makeMeasurement({ kpi_id: "k1", status: "on_target" })];
      const result = computeKpiMetrics(defs, measurements);
      for (const v of Object.values(result.by_status)) {
        expect(typeof v).toBe("number");
      }
    });

    it("computeKpiMetrics by_trend values are numbers", () => {
      const defs = [makeDefinition({ id: "k1" })];
      const measurements = [makeMeasurement({ kpi_id: "k1", trend: "improving" })];
      const result = computeKpiMetrics(defs, measurements);
      for (const v of Object.values(result.by_trend)) {
        expect(typeof v).toBe("number");
      }
    });
  });

  // ── Measurements without matching definitions ────────────────────────────

  describe("measurements without matching definitions", () => {
    it("computeKpiMetrics counts measurements even without matching definitions", () => {
      const measurements = [
        makeMeasurement({ kpi_id: "orphan-1", status: "on_target" }),
      ];
      const result = computeKpiMetrics([], measurements);
      expect(result.on_target).toBe(1);
      expect(result.total_kpis).toBe(0);
    });

    it("identifyKpiAlerts generates alerts for orphan measurements", () => {
      const measurements = [
        makeMeasurement({ kpi_id: "orphan-1", status: "at_risk" }),
      ];
      const alerts = identifyKpiAlerts([], measurements);
      expect(alerts.filter((a) => a.type === "kpi_at_risk")).toHaveLength(1);
    });
  });

  // ── Default now parameter ────────────────────────────────────────────────

  describe("default now parameter", () => {
    it("identifyKpiAlerts works without explicit now parameter", () => {
      const def = makeDefinition({ id: "k1", active: true });
      const alerts = identifyKpiAlerts([def], []);
      expect(alerts.filter((a) => a.type === "kpi_not_measured")).toHaveLength(1);
    });
  });

  // ── on_target_rate edge ──────────────────────────────────────────────────

  describe("on_target_rate edge cases", () => {
    it("handles exact 50% rate", () => {
      const defs = [makeDefinition({ id: "k1" }), makeDefinition({ id: "k2" })];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "on_target" }),
        makeMeasurement({ kpi_id: "k2", status: "below_target" }),
      ];
      const result = computeKpiMetrics(defs, measurements);
      expect(result.on_target_rate).toBe(50);
    });

    it("handles 1/7 rate rounding", () => {
      const defs: KpiDefinition[] = [];
      const measurements: KpiMeasurement[] = [];
      for (let i = 0; i < 7; i++) {
        const id = `k${i}`;
        defs.push(makeDefinition({ id }));
        measurements.push(
          makeMeasurement({
            kpi_id: id,
            status: i === 0 ? "on_target" : "below_target",
          }),
        );
      }
      // 1/7 * 100 = 14.2857... => 14.3
      const result = computeKpiMetrics(defs, measurements);
      expect(result.on_target_rate).toBe(14.3);
    });

    it("handles 5/6 rate rounding", () => {
      const defs: KpiDefinition[] = [];
      const measurements: KpiMeasurement[] = [];
      for (let i = 0; i < 6; i++) {
        const id = `k${i}`;
        defs.push(makeDefinition({ id }));
        measurements.push(
          makeMeasurement({
            kpi_id: id,
            status: i < 5 ? "on_target" : "below_target",
          }),
        );
      }
      // 5/6 * 100 = 83.333... => 83.3
      const result = computeKpiMetrics(defs, measurements);
      expect(result.on_target_rate).toBe(83.3);
    });
  });

  // ── Multiple domains in by_domain ────────────────────────────────────────

  describe("by_domain with all 13 domains", () => {
    it("tracks each domain separately", () => {
      const allDomains: KpiDefinition["domain"][] = [
        "safeguarding", "health", "education", "behaviour",
        "placement_stability", "staffing", "compliance", "participation",
        "outcomes", "finance", "environment", "records", "other",
      ];
      const defs = allDomains.map((domain, i) =>
        makeDefinition({ id: `k${i}`, domain }),
      );
      const result = computeKpiMetrics(defs, []);
      for (const domain of allDomains) {
        expect(result.by_domain[domain]).toEqual({ total: 1, on_target: 0 });
      }
    });
  });

  // ── Factory helpers produce valid objects ─────────────────────────────────

  describe("factory helpers", () => {
    it("makeDefinition produces unique IDs by default", () => {
      const a = makeDefinition();
      const b = makeDefinition();
      expect(a.id).not.toBe(b.id);
    });

    it("makeMeasurement produces unique IDs by default", () => {
      const a = makeMeasurement();
      const b = makeMeasurement();
      expect(a.id).not.toBe(b.id);
    });

    it("makeDefinition respects overrides", () => {
      const d = makeDefinition({ name: "Custom", domain: "finance" });
      expect(d.name).toBe("Custom");
      expect(d.domain).toBe("finance");
    });

    it("makeMeasurement respects overrides", () => {
      const m = makeMeasurement({ value: 42, status: "at_risk" });
      expect(m.value).toBe(42);
      expect(m.status).toBe("at_risk");
    });
  });

  // ── Definitions with no matching measurements in by_domain ───────────────

  describe("by_domain on_target zero for unmeasured KPIs", () => {
    it("sets on_target to 0 for domains with only at_risk measurements", () => {
      const defs = [makeDefinition({ id: "k1", domain: "outcomes" })];
      const measurements = [makeMeasurement({ kpi_id: "k1", status: "at_risk" })];
      const result = computeKpiMetrics(defs, measurements);
      expect(result.by_domain.outcomes.on_target).toBe(0);
      expect(result.by_domain.outcomes.total).toBe(1);
    });
  });

  // ── computeKpiMetrics with only inactive definitions ─────────────────────

  describe("all inactive definitions", () => {
    it("active_kpis is zero when all definitions are inactive", () => {
      const defs = [
        makeDefinition({ id: "k1", active: false }),
        makeDefinition({ id: "k2", active: false }),
        makeDefinition({ id: "k3", active: false }),
      ];
      const result = computeKpiMetrics(defs, []);
      expect(result.total_kpis).toBe(3);
      expect(result.active_kpis).toBe(0);
    });
  });

  // ── identifyKpiAlerts does not double-count ──────────────────────────────

  describe("alert deduplication", () => {
    it("does not generate kpi_not_measured if any measurement exists for the KPI", () => {
      const def = makeDefinition({ id: "k1", active: true });
      // Measurement exists but with not_measured status (still a measurement record)
      const m = makeMeasurement({ kpi_id: "k1", status: "not_measured" });
      const alerts = identifyKpiAlerts([def], [m]);
      const notMeasured = alerts.filter((a) => a.type === "kpi_not_measured");
      expect(notMeasured).toHaveLength(0);
    });
  });

  // ── computeKpiMetrics with measurements for undefined KPIs ───────────────

  describe("measurements without definitions do not affect by_domain", () => {
    it("by_domain is empty when no definitions exist even with measurements", () => {
      const measurements = [
        makeMeasurement({ kpi_id: "orphan", status: "on_target" }),
      ];
      const result = computeKpiMetrics([], measurements);
      expect(Object.keys(result.by_domain)).toHaveLength(0);
    });
  });

  // ── Multiple domains with mixed on_target counts ─────────────────────────

  describe("multi-domain on_target accuracy", () => {
    it("counts on_target accurately across three domains", () => {
      const defs = [
        makeDefinition({ id: "k1", domain: "records" }),
        makeDefinition({ id: "k2", domain: "records" }),
        makeDefinition({ id: "k3", domain: "environment" }),
        makeDefinition({ id: "k4", domain: "participation" }),
      ];
      const measurements = [
        makeMeasurement({ kpi_id: "k1", status: "on_target" }),
        makeMeasurement({ kpi_id: "k2", status: "on_target" }),
        makeMeasurement({ kpi_id: "k3", status: "below_target" }),
        makeMeasurement({ kpi_id: "k4", status: "above_target" }),
      ];
      const result = computeKpiMetrics(defs, measurements);
      expect(result.by_domain.records).toEqual({ total: 2, on_target: 2 });
      expect(result.by_domain.environment).toEqual({ total: 1, on_target: 0 });
      expect(result.by_domain.participation).toEqual({ total: 1, on_target: 1 });
    });
  });

  // ── on_target_rate with 3/11 ratio ───────────────────────────────────────

  describe("on_target_rate non-trivial rounding", () => {
    it("handles 3/11 rate rounding to 27.3", () => {
      const defs: KpiDefinition[] = [];
      const measurements: KpiMeasurement[] = [];
      for (let i = 0; i < 11; i++) {
        const id = `k${i}`;
        defs.push(makeDefinition({ id }));
        measurements.push(
          makeMeasurement({
            kpi_id: id,
            status: i < 3 ? "on_target" : "below_target",
          }),
        );
      }
      // 3/11 * 100 = 27.2727... => 27.3
      const result = computeKpiMetrics(defs, measurements);
      expect(result.on_target_rate).toBe(27.3);
    });
  });

  // ── identifyKpiAlerts total alert count ──────────────────────────────────

  describe("total alert count", () => {
    it("at_risk + declining on same KPI produces exactly 2 alerts for that KPI", () => {
      const m = makeMeasurement({ kpi_id: "k1", status: "at_risk", trend: "declining" });
      const alerts = identifyKpiAlerts([], [m]);
      expect(alerts).toHaveLength(2);
    });

    it("on_target + stable on same KPI produces zero alerts", () => {
      const def = makeDefinition({ id: "k1", active: true });
      const m = makeMeasurement({ kpi_id: "k1", status: "on_target", trend: "stable" });
      const alerts = identifyKpiAlerts([def], [m]);
      expect(alerts).toHaveLength(0);
    });
  });
});
