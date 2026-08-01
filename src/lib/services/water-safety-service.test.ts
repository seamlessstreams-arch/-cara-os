import { describe, it, expect } from "vitest";
import {
  computeWaterSafetyMetrics,
  identifyWaterSafetyAlerts,
  type WaterSafetyRecord,
} from "./water-safety-service";

// ── Factory ────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<WaterSafetyRecord> = {}): WaterSafetyRecord {
  return {
    id: overrides.id ?? "rec-1",
    home_id: overrides.home_id ?? "home-1",
    check_type: overrides.check_type ?? "temperature_check",
    check_date: overrides.check_date ?? "2025-01-15",
    location: overrides.location ?? "bathroom_1",
    hot_water_temp: "hot_water_temp" in overrides ? (overrides.hot_water_temp as number | null) : 42,
    cold_water_temp: "cold_water_temp" in overrides ? (overrides.cold_water_temp as number | null) : 12,
    temperature_compliance: overrides.temperature_compliance ?? "compliant",
    risk_level: overrides.risk_level ?? "low",
    tmv_fitted: overrides.tmv_fitted ?? true,
    tmv_operational: overrides.tmv_operational ?? true,
    flushing_completed: overrides.flushing_completed ?? true,
    legionella_assessment_current: overrides.legionella_assessment_current ?? true,
    scalding_risk_mitigated: overrides.scalding_risk_mitigated ?? true,
    issues_found: overrides.issues_found ?? [],
    actions_taken: overrides.actions_taken ?? [],
    checked_by: overrides.checked_by ?? "Staff A",
    next_check_date: "next_check_date" in overrides ? (overrides.next_check_date as string | null) : null,
    notes: "notes" in overrides ? (overrides.notes as string | null) : null,
    created_at: overrides.created_at ?? "2025-01-15T00:00:00Z",
    updated_at: overrides.updated_at ?? "2025-01-15T00:00:00Z",
  };
}

// ── computeWaterSafetyMetrics ──────────────────────────────────────────

describe("computeWaterSafetyMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeWaterSafetyMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.temperature_check_count).toBe(0);
    expect(m.compliant_rate).toBeNull();;
    expect(m.too_hot_count).toBe(0);
    expect(m.too_cold_count).toBe(0);
    expect(m.tmv_fault_count).toBe(0);
    expect(m.average_hot_temp).toBeNull();;
    expect(m.average_cold_temp).toBeNull();;
    expect(m.check_overdue_count).toBe(0);
  });

  it("counts check types correctly", () => {
    const records = [
      makeRecord({ check_type: "temperature_check" }),
      makeRecord({ check_type: "temperature_check" }),
      makeRecord({ check_type: "legionella_risk_assessment" }),
      makeRecord({ check_type: "flushing_record" }),
      makeRecord({ check_type: "tmv_check" }),
    ];
    const m = computeWaterSafetyMetrics(records);
    expect(m.temperature_check_count).toBe(2);
    expect(m.legionella_assessment_count).toBe(1);
    expect(m.flushing_count).toBe(1);
    expect(m.tmv_check_count).toBe(1);
  });

  it("computes compliance rates and temperature problem counts", () => {
    const records = [
      makeRecord({ temperature_compliance: "compliant" }),
      makeRecord({ temperature_compliance: "too_hot" }),
      makeRecord({ temperature_compliance: "too_cold" }),
      makeRecord({ temperature_compliance: "tmv_fault" }),
    ];
    const m = computeWaterSafetyMetrics(records);
    expect(m.compliant_rate).toBe(25);
    expect(m.too_hot_count).toBe(1);
    expect(m.too_cold_count).toBe(1);
    expect(m.tmv_fault_count).toBe(1);
  });

  it("computes average temperatures from non-null values", () => {
    const records = [
      makeRecord({ hot_water_temp: 40, cold_water_temp: 10 }),
      makeRecord({ hot_water_temp: 50, cold_water_temp: 14 }),
      makeRecord({ hot_water_temp: null, cold_water_temp: null }),
    ];
    const m = computeWaterSafetyMetrics(records);
    expect(m.average_hot_temp).toBe(45);
    expect(m.average_cold_temp).toBe(12);
  });

  it("counts risk levels", () => {
    const records = [
      makeRecord({ risk_level: "high" }),
      makeRecord({ risk_level: "very_high" }),
      makeRecord({ risk_level: "very_high" }),
    ];
    const m = computeWaterSafetyMetrics(records);
    expect(m.high_risk_count).toBe(1);
    expect(m.very_high_risk_count).toBe(2);
  });

  it("computes boolean rates for TMV, flushing, legionella, scalding", () => {
    const records = [
      makeRecord({ tmv_fitted: true, tmv_operational: true, flushing_completed: true, legionella_assessment_current: true, scalding_risk_mitigated: true }),
      makeRecord({ tmv_fitted: false, tmv_operational: false, flushing_completed: false, legionella_assessment_current: false, scalding_risk_mitigated: false }),
    ];
    const m = computeWaterSafetyMetrics(records);
    expect(m.tmv_fitted_rate).toBe(50);
    expect(m.tmv_operational_rate).toBe(50);
    expect(m.flushing_completed_rate).toBe(50);
    expect(m.legionella_assessment_current_rate).toBe(50);
    expect(m.scalding_risk_mitigated_rate).toBe(50);
  });

  it("counts overdue checks", () => {
    const records = [
      makeRecord({ next_check_date: "2020-01-01" }),
      makeRecord({ next_check_date: "2099-12-31" }),
      makeRecord({ next_check_date: null }),
    ];
    const m = computeWaterSafetyMetrics(records);
    expect(m.check_overdue_count).toBe(1);
  });
});

// ── identifyWaterSafetyAlerts ──────────────────────────────────────────

describe("identifyWaterSafetyAlerts", () => {
  it("returns empty array for empty input", () => {
    expect(identifyWaterSafetyAlerts([])).toEqual([]);
  });

  it("fires critical alert for too hot water (scalding risk)", () => {
    const records = [makeRecord({ temperature_compliance: "too_hot" })];
    const alerts = identifyWaterSafetyAlerts(records);
    const match = alerts.find((a) => a.type === "scalding_risk");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires critical alert for very high risk", () => {
    const records = [makeRecord({ risk_level: "very_high" })];
    const alerts = identifyWaterSafetyAlerts(records);
    const match = alerts.find((a) => a.type === "very_high_risk");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for TMV faults (>= 1)", () => {
    const records = [makeRecord({ temperature_compliance: "tmv_fault" })];
    const alerts = identifyWaterSafetyAlerts(records);
    const match = alerts.find((a) => a.type === "tmv_fault");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for legionella assessment not current (>= 2)", () => {
    const records = [
      makeRecord({ legionella_assessment_current: false }),
      makeRecord({ legionella_assessment_current: false }),
    ];
    const alerts = identifyWaterSafetyAlerts(records);
    const match = alerts.find((a) => a.type === "legionella_lapsed");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("does NOT fire legionella_lapsed for only 1 record", () => {
    const records = [makeRecord({ legionella_assessment_current: false })];
    const alerts = identifyWaterSafetyAlerts(records);
    expect(alerts.find((a) => a.type === "legionella_lapsed")).toBeUndefined();
  });

  it("fires medium alert for overdue checks (>= 1)", () => {
    const records = [makeRecord({ next_check_date: "2020-01-01" })];
    const alerts = identifyWaterSafetyAlerts(records);
    const match = alerts.find((a) => a.type === "check_overdue");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});
