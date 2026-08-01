import { describe, it, expect } from "vitest";
import {
  computeHomeEnvironmentMetrics,
  identifyHomeEnvironmentAlerts,
  type HomeEnvironmentInspectionRecord,
} from "./home-environment-inspection-service";

function makeRecord(
  overrides: Partial<HomeEnvironmentInspectionRecord> = {},
): HomeEnvironmentInspectionRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    inspection_area: "kitchen",
    condition_rating: "good",
    hazard_level: "none",
    compliance_status: "fully_compliant",
    inspection_date: "2026-05-01",
    inspected_by: "Staff A",
    cleanliness_acceptable: true,
    fire_safety_checked: true,
    electrical_safety_checked: true,
    water_safety_checked: true,
    ventilation_adequate: true,
    lighting_adequate: true,
    maintenance_up_to_date: true,
    child_friendly: true,
    accessibility_adequate: true,
    security_adequate: true,
    pest_free: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeHomeEnvironmentMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeHomeEnvironmentMetrics([]);
    expect(m.total_inspections).toBe(0);
    expect(m.poor_condition_count).toBe(0);
    expect(m.cleanliness_rate).toBeNull();;
    expect(m.by_inspection_area).toEqual({});
  });

  it("counts populated data correctly", () => {
    const records = [
      makeRecord({ id: "r1", condition_rating: "poor", hazard_level: "high" }),
      makeRecord({ id: "r2", condition_rating: "unacceptable", hazard_level: "immediate" }),
      makeRecord({ id: "r3", condition_rating: "good", hazard_level: "none" }),
    ];
    const m = computeHomeEnvironmentMetrics(records);
    expect(m.total_inspections).toBe(3);
    expect(m.poor_condition_count).toBe(1);
    expect(m.unacceptable_condition_count).toBe(1);
    expect(m.high_hazard_count).toBe(1);
    expect(m.immediate_hazard_count).toBe(1);
    expect(m.by_condition_rating).toEqual({ poor: 1, unacceptable: 1, good: 1 });
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ cleanliness_acceptable: true, fire_safety_checked: false }),
      makeRecord({ id: "r2", cleanliness_acceptable: false, fire_safety_checked: false }),
    ];
    const m = computeHomeEnvironmentMetrics(records);
    expect(m.cleanliness_rate).toBe(50);
    expect(m.fire_safety_rate).toBe(0);
  });
});

describe("identifyHomeEnvironmentAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(identifyHomeEnvironmentAlerts([])).toEqual([]);
  });

  it("returns empty for all-good records", () => {
    expect(identifyHomeEnvironmentAlerts([makeRecord()])).toEqual([]);
  });

  it("critical: immediate_hazard when hazard_level is immediate", () => {
    const records = [makeRecord({ hazard_level: "immediate" })];
    const alerts = identifyHomeEnvironmentAlerts(records);
    expect(alerts.some((a) => a.type === "immediate_hazard" && a.severity === "critical")).toBe(true);
  });

  it("high: fire_safety_not_checked when >= 1 record has fire_safety_checked false", () => {
    const records = [makeRecord({ fire_safety_checked: false })];
    const alerts = identifyHomeEnvironmentAlerts(records);
    expect(alerts.some((a) => a.type === "fire_safety_not_checked" && a.severity === "high")).toBe(true);
  });

  it("high: maintenance_overdue when >= 1 record has maintenance_up_to_date false", () => {
    const records = [makeRecord({ maintenance_up_to_date: false })];
    const alerts = identifyHomeEnvironmentAlerts(records);
    expect(alerts.some((a) => a.type === "maintenance_overdue" && a.severity === "high")).toBe(true);
  });

  it("medium: cleanliness_issues fires at threshold >= 2", () => {
    const one = [makeRecord({ cleanliness_acceptable: false })];
    expect(identifyHomeEnvironmentAlerts(one).some((a) => a.type === "cleanliness_issues")).toBe(false);

    const two = [
      makeRecord({ id: "r1", cleanliness_acceptable: false }),
      makeRecord({ id: "r2", cleanliness_acceptable: false }),
    ];
    expect(identifyHomeEnvironmentAlerts(two).some((a) => a.type === "cleanliness_issues" && a.severity === "medium")).toBe(true);
  });

  it("medium: security_inadequate fires at threshold >= 2", () => {
    const one = [makeRecord({ security_adequate: false })];
    expect(identifyHomeEnvironmentAlerts(one).some((a) => a.type === "security_inadequate")).toBe(false);

    const two = [
      makeRecord({ id: "r1", security_adequate: false }),
      makeRecord({ id: "r2", security_adequate: false }),
    ];
    expect(identifyHomeEnvironmentAlerts(two).some((a) => a.type === "security_inadequate" && a.severity === "medium")).toBe(true);
  });
});
