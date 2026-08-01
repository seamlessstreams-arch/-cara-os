import { describe, it, expect } from "vitest";
import {
  computeOutdoorSpacesMetrics,
  identifyOutdoorSpacesAlerts,
} from "./outdoor-spaces-play-areas-service";
import type { OutdoorSpacesPlayAreasRecord } from "./outdoor-spaces-play-areas-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<OutdoorSpacesPlayAreasRecord> = {}): OutdoorSpacesPlayAreasRecord {
  return {
    id: "osp-1",
    home_id: "home-1",
    space_type: "garden",
    condition_rating: "good",
    safety_assessment: "fully_safe",
    accessibility_level: "fully_accessible",
    inspection_date: "2026-05-10",
    child_name: "Alex",
    child_id: "child-1",
    inspected_by: "Staff A",
    equipment_checked: true,
    surface_safe: true,
    fencing_secure: true,
    lighting_adequate: true,
    clean_tidy: true,
    age_appropriate: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    maintenance_requested: true,
    risk_assessed: true,
    children_consulted: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeOutdoorSpacesMetrics ----------------------------------------------

describe("computeOutdoorSpacesMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeOutdoorSpacesMetrics([]);
    expect(m.total_inspections).toBe(0);
    expect(m.unsafe_count).toBe(0);
    expect(m.hazard_count).toBe(0);
    expect(m.poor_condition_count).toBe(0);
    expect(m.not_accessible_count).toBe(0);
    expect(m.equipment_checked_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts unsafe, hazard, poor condition, and not accessible", () => {
    const records = [
      makeRecord({ id: "1", condition_rating: "unsafe", safety_assessment: "significant_hazards" }),
      makeRecord({ id: "2", condition_rating: "poor", safety_assessment: "closed" }),
      makeRecord({ id: "3", accessibility_level: "not_accessible" }),
      makeRecord({ id: "4", condition_rating: "good" }),
    ];
    const m = computeOutdoorSpacesMetrics(records);
    expect(m.unsafe_count).toBe(1);
    expect(m.hazard_count).toBe(2); // significant_hazards + closed
    expect(m.poor_condition_count).toBe(2); // poor + unsafe
    expect(m.not_accessible_count).toBe(1);
  });

  it("calculates boolean rates at 100% when all true", () => {
    const records = [makeRecord({ id: "1" }), makeRecord({ id: "2" })];
    const m = computeOutdoorSpacesMetrics(records);
    expect(m.equipment_checked_rate).toBe(100);
    expect(m.surface_safe_rate).toBe(100);
    expect(m.fencing_secure_rate).toBe(100);
    expect(m.risk_assessed_rate).toBe(100);
    expect(m.children_consulted_rate).toBe(100);
  });

  it("calculates rates at 50% when half true", () => {
    const records = [
      makeRecord({ id: "1", equipment_checked: true }),
      makeRecord({ id: "2", equipment_checked: false }),
    ];
    const m = computeOutdoorSpacesMetrics(records);
    expect(m.equipment_checked_rate).toBe(50);
  });

  it("populates by_space_type breakdown", () => {
    const records = [
      makeRecord({ id: "1", space_type: "garden" }),
      makeRecord({ id: "2", space_type: "garden" }),
      makeRecord({ id: "3", space_type: "play_area" }),
    ];
    const m = computeOutdoorSpacesMetrics(records);
    expect(m.by_space_type.garden).toBe(2);
    expect(m.by_space_type.play_area).toBe(1);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Alex" }),
      makeRecord({ id: "2", child_name: "Alex" }),
      makeRecord({ id: "3", child_name: "Beth" }),
    ];
    const m = computeOutdoorSpacesMetrics(records);
    expect(m.unique_children).toBe(2);
  });
});

// -- identifyOutdoorSpacesAlerts ----------------------------------------------

describe("identifyOutdoorSpacesAlerts", () => {
  it("returns empty array when no issues", () => {
    const alerts = identifyOutdoorSpacesAlerts([makeRecord()]);
    expect(alerts).toEqual([]);
  });

  it("flags critical unsafe_hazard when condition unsafe AND significant_hazards or closed", () => {
    const records = [
      makeRecord({ id: "r1", condition_rating: "unsafe", safety_assessment: "significant_hazards" }),
    ];
    const alerts = identifyOutdoorSpacesAlerts(records);
    const uh = alerts.filter((a) => a.type === "unsafe_hazard");
    expect(uh.length).toBe(1);
    expect(uh[0].severity).toBe("critical");
  });

  it("does not flag unsafe_hazard when unsafe but minor_issues", () => {
    const records = [
      makeRecord({ id: "r1", condition_rating: "unsafe", safety_assessment: "minor_issues" }),
    ];
    const alerts = identifyOutdoorSpacesAlerts(records);
    const uh = alerts.filter((a) => a.type === "unsafe_hazard");
    expect(uh.length).toBe(0);
  });

  it("flags high fencing_not_secure when >= 1", () => {
    const records = [makeRecord({ id: "r1", fencing_secure: false })];
    const alerts = identifyOutdoorSpacesAlerts(records);
    const f = alerts.filter((a) => a.type === "fencing_not_secure");
    expect(f.length).toBe(1);
    expect(f[0].severity).toBe("high");
  });

  it("flags high no_risk_assessment when >= 1", () => {
    const records = [makeRecord({ id: "r1", risk_assessed: false })];
    const alerts = identifyOutdoorSpacesAlerts(records);
    const nr = alerts.filter((a) => a.type === "no_risk_assessment");
    expect(nr.length).toBe(1);
    expect(nr[0].severity).toBe("high");
  });

  it("flags medium equipment_not_checked when >= 2", () => {
    const records = [
      makeRecord({ id: "1", equipment_checked: false }),
      makeRecord({ id: "2", equipment_checked: false }),
    ];
    const alerts = identifyOutdoorSpacesAlerts(records);
    const eq = alerts.filter((a) => a.type === "equipment_not_checked");
    expect(eq.length).toBe(1);
    expect(eq[0].severity).toBe("medium");
  });

  it("does not flag equipment_not_checked when only 1", () => {
    const records = [makeRecord({ id: "1", equipment_checked: false })];
    const alerts = identifyOutdoorSpacesAlerts(records);
    const eq = alerts.filter((a) => a.type === "equipment_not_checked");
    expect(eq.length).toBe(0);
  });

  it("flags medium children_not_consulted when >= 2", () => {
    const records = [
      makeRecord({ id: "1", children_consulted: false }),
      makeRecord({ id: "2", children_consulted: false }),
    ];
    const alerts = identifyOutdoorSpacesAlerts(records);
    const cc = alerts.filter((a) => a.type === "children_not_consulted");
    expect(cc.length).toBe(1);
    expect(cc[0].severity).toBe("medium");
  });
});
