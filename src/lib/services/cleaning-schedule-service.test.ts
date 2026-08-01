import { describe, it, expect } from "vitest";
import {
  computeCleaningMetrics,
  identifyCleaningAlerts,
} from "./cleaning-schedule-service";
import type { CleaningScheduleRecord } from "./cleaning-schedule-service";

// -- Factory Function ---------------------------------------------------------

function makeRecord(overrides: Partial<CleaningScheduleRecord> = {}): CleaningScheduleRecord {
  return {
    id: "cs-1",
    home_id: "home-1",
    cleaning_type: "daily_routine",
    cleaning_standard: "good",
    area_cleaned: "kitchen",
    hygiene_risk: "none",
    cleaning_date: "2026-05-15",
    area_name: "Main Kitchen",
    cleaning_products_safe: true,
    products_stored_safely: true,
    coshh_compliant: true,
    children_involved: false,
    gloves_worn: true,
    ventilation_adequate: true,
    surfaces_sanitised: true,
    waste_disposed_correctly: true,
    sharps_disposed_safely: true,
    hand_washing_available: true,
    issues_found: [],
    actions_taken: [],
    cleaned_by: "staff-1",
    inspected_by: "staff-2",
    next_clean_date: "2026-05-16",
    notes: null,
    created_at: "2026-05-15T00:00:00Z",
    updated_at: "2026-05-15T00:00:00Z",
    ...overrides,
  };
}

// -- computeCleaningMetrics ---------------------------------------------------

describe("computeCleaningMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeCleaningMetrics([]);
    expect(m.total_cleans).toBe(0);
    expect(m.excellent_count).toBe(0);
    expect(m.below_standard_count).toBe(0);
    expect(m.acceptable_rate).toBeNull();;
    expect(m.coshh_compliant_rate).toBeNull();;
    expect(m.high_risk_count).toBe(0);
  });

  it("computes populated metrics correctly", () => {
    const records = [
      makeRecord({ cleaning_standard: "excellent", cleaning_type: "daily_routine" }),
      makeRecord({ id: "cs-2", cleaning_standard: "good", cleaning_type: "weekly_deep_clean" }),
      makeRecord({
        id: "cs-3",
        cleaning_standard: "below_standard",
        cleaning_type: "monthly_deep_clean",
        coshh_compliant: false,
        surfaces_sanitised: false,
        hygiene_risk: "high",
        children_involved: true,
      }),
      makeRecord({
        id: "cs-4",
        cleaning_standard: "unacceptable",
        cleaning_type: "kitchen_clean",
        hygiene_risk: "critical",
        products_stored_safely: false,
      }),
    ];
    const m = computeCleaningMetrics(records);

    expect(m.total_cleans).toBe(4);
    expect(m.excellent_count).toBe(1);
    expect(m.good_count).toBe(1);
    expect(m.below_standard_count).toBe(1);
    expect(m.unacceptable_count).toBe(1);
    // excellent + good = 2/4 acceptable = 50%
    expect(m.acceptable_rate).toBe(50);
    expect(m.daily_routine_count).toBe(1);
    // weekly + monthly deep clean = 2
    expect(m.deep_clean_count).toBe(2);
    // 3/4 COSHH compliant
    expect(m.coshh_compliant_rate).toBe(75);
    // 3/4 surfaces sanitised
    expect(m.surfaces_sanitised_rate).toBe(75);
    // high + critical = 2
    expect(m.high_risk_count).toBe(2);
    expect(m.children_involved_count).toBe(1);
    expect(m.by_hygiene_risk).toEqual({ none: 2, high: 1, critical: 1 });
  });
});

// -- identifyCleaningAlerts ---------------------------------------------------

describe("identifyCleaningAlerts", () => {
  it("returns no alerts for empty data", () => {
    const alerts = identifyCleaningAlerts([]);
    expect(alerts).toHaveLength(0);
  });

  it("fires critical_hygiene for critical hygiene risk", () => {
    const records = [makeRecord({ hygiene_risk: "critical", area_name: "Bathroom 1" })];
    const alerts = identifyCleaningAlerts(records);
    expect(alerts.some((a) => a.type === "critical_hygiene" && a.severity === "critical")).toBe(true);
  });

  it("fires unacceptable_standard when >= 1 area is unacceptable", () => {
    const records = [makeRecord({ cleaning_standard: "unacceptable" })];
    const alerts = identifyCleaningAlerts(records);
    expect(alerts.some((a) => a.type === "unacceptable_standard" && a.severity === "high")).toBe(true);
  });

  it("fires coshh_non_compliant when >= 2 records not COSHH compliant", () => {
    const records = [
      makeRecord({ id: "cs-1", coshh_compliant: false }),
      makeRecord({ id: "cs-2", coshh_compliant: false }),
    ];
    const alerts = identifyCleaningAlerts(records);
    expect(alerts.some((a) => a.type === "coshh_non_compliant" && a.severity === "high")).toBe(true);
  });

  it("does NOT fire coshh_non_compliant when only 1 record is not compliant", () => {
    const records = [makeRecord({ coshh_compliant: false })];
    const alerts = identifyCleaningAlerts(records);
    expect(alerts.some((a) => a.type === "coshh_non_compliant")).toBe(false);
  });

  it("fires unsafe_storage when >= 2 records with products not stored safely", () => {
    const records = [
      makeRecord({ id: "cs-1", products_stored_safely: false }),
      makeRecord({ id: "cs-2", products_stored_safely: false }),
    ];
    const alerts = identifyCleaningAlerts(records);
    expect(alerts.some((a) => a.type === "unsafe_storage" && a.severity === "medium")).toBe(true);
  });

  it("fires surfaces_not_sanitised when >= 3 records without sanitisation", () => {
    const records = [
      makeRecord({ id: "cs-1", surfaces_sanitised: false }),
      makeRecord({ id: "cs-2", surfaces_sanitised: false }),
      makeRecord({ id: "cs-3", surfaces_sanitised: false }),
    ];
    const alerts = identifyCleaningAlerts(records);
    expect(alerts.some((a) => a.type === "surfaces_not_sanitised" && a.severity === "medium")).toBe(true);
  });

  it("does NOT fire surfaces_not_sanitised when only 2 records without sanitisation", () => {
    const records = [
      makeRecord({ id: "cs-1", surfaces_sanitised: false }),
      makeRecord({ id: "cs-2", surfaces_sanitised: false }),
    ];
    const alerts = identifyCleaningAlerts(records);
    expect(alerts.some((a) => a.type === "surfaces_not_sanitised")).toBe(false);
  });
});
