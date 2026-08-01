import { describe, it, expect } from "vitest";
import {
  computeHomeImprovementMetrics,
  identifyHomeImprovementAlerts,
  type HomeImprovementRecord,
} from "./home-improvement-service";

function makeRecord(
  overrides: Partial<HomeImprovementRecord> = {},
): HomeImprovementRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    project_type: "refurbishment",
    project_status: "completed",
    priority_level: "medium",
    funding_source: "home_budget",
    project_name: "Kitchen refurb",
    description: "Full kitchen refit",
    location_in_home: "Kitchen",
    start_date: "2026-01-01",
    target_completion_date: "2026-03-01",
    actual_completion_date: "2026-02-28",
    estimated_cost: 5000,
    actual_cost: 4800,
    contractor_name: "Builder Co",
    children_consulted: true,
    children_involved: true,
    child_room_personalisation: false,
    accessibility_improvement: false,
    energy_efficiency_improvement: false,
    safety_improvement: true,
    planning_permission_required: false,
    planning_permission_obtained: false,
    building_regs_compliant: true,
    fire_safety_maintained: true,
    disruption_minimised: true,
    issues_found: [],
    actions_taken: [],
    managed_by: "Manager A",
    notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeHomeImprovementMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeHomeImprovementMetrics([]);
    expect(m.total_projects).toBe(0);
    expect(m.completed_count).toBe(0);
    expect(m.completion_rate).toBeNull();;
    expect(m.total_estimated_cost).toBe(0);
    expect(m.total_actual_cost).toBe(0);
    expect(m.by_project_type).toEqual({});
  });

  it("counts populated data correctly", () => {
    const records = [
      makeRecord({ id: "r1", project_status: "completed", priority_level: "urgent", estimated_cost: 1000, actual_cost: 900 }),
      makeRecord({ id: "r2", project_status: "in_progress", priority_level: "high", estimated_cost: 2000, actual_cost: null }),
      makeRecord({ id: "r3", project_status: "proposed", priority_level: "urgent", estimated_cost: null, actual_cost: null }),
      makeRecord({ id: "r4", project_status: "on_hold" }),
    ];
    const m = computeHomeImprovementMetrics(records);
    expect(m.total_projects).toBe(4);
    expect(m.completed_count).toBe(1);
    expect(m.in_progress_count).toBe(1);
    expect(m.proposed_count).toBe(1);
    expect(m.on_hold_count).toBe(1);
    expect(m.completion_rate).toBe(25);
    expect(m.urgent_count).toBe(2);
    expect(m.total_estimated_cost).toBe(8000); // 1000 + 2000 + 5000(default r4)
    expect(m.total_actual_cost).toBe(5700); // 900 + 4800(default r4)
  });

  it("detects overdue projects based on target_completion_date", () => {
    const records = [
      makeRecord({ project_status: "in_progress", target_completion_date: "2020-01-01" }),
    ];
    const m = computeHomeImprovementMetrics(records);
    expect(m.overdue_count).toBe(1);
  });

  it("does not count completed projects as overdue", () => {
    const records = [
      makeRecord({ project_status: "completed", target_completion_date: "2020-01-01" }),
    ];
    const m = computeHomeImprovementMetrics(records);
    expect(m.overdue_count).toBe(0);
  });

  it("computes boolean rates and counts correctly", () => {
    const records = [
      makeRecord({ child_room_personalisation: true, accessibility_improvement: true, children_consulted: true }),
      makeRecord({ id: "r2", child_room_personalisation: false, accessibility_improvement: true, children_consulted: false }),
    ];
    const m = computeHomeImprovementMetrics(records);
    expect(m.personalisation_count).toBe(1);
    expect(m.accessibility_count).toBe(2);
    expect(m.children_consulted_rate).toBe(50);
  });
});

describe("identifyHomeImprovementAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(identifyHomeImprovementAlerts([])).toEqual([]);
  });

  it("returns empty for all-good records", () => {
    expect(identifyHomeImprovementAlerts([makeRecord()])).toEqual([]);
  });

  it("critical: fire_safety_risk when fire_safety_maintained false and in_progress", () => {
    const records = [makeRecord({ fire_safety_maintained: false, project_status: "in_progress" })];
    const alerts = identifyHomeImprovementAlerts(records);
    expect(alerts.some((a) => a.type === "fire_safety_risk" && a.severity === "critical")).toBe(true);
  });

  it("does NOT fire fire_safety_risk if project is not in_progress", () => {
    const records = [makeRecord({ fire_safety_maintained: false, project_status: "completed" })];
    const alerts = identifyHomeImprovementAlerts(records);
    expect(alerts.some((a) => a.type === "fire_safety_risk")).toBe(false);
  });

  it("high: overdue_project when >= 1 project overdue", () => {
    const records = [
      makeRecord({ project_status: "in_progress", target_completion_date: "2020-01-01" }),
    ];
    const alerts = identifyHomeImprovementAlerts(records);
    expect(alerts.some((a) => a.type === "overdue_project" && a.severity === "high")).toBe(true);
  });

  it("high: urgent_not_started when urgent project is proposed", () => {
    const records = [makeRecord({ priority_level: "urgent", project_status: "proposed" })];
    const alerts = identifyHomeImprovementAlerts(records);
    expect(alerts.some((a) => a.type === "urgent_not_started" && a.severity === "high")).toBe(true);
  });

  it("medium: children_not_consulted fires at threshold >= 3", () => {
    const two = [
      makeRecord({ id: "r1", children_consulted: false }),
      makeRecord({ id: "r2", children_consulted: false }),
    ];
    expect(identifyHomeImprovementAlerts(two).some((a) => a.type === "children_not_consulted")).toBe(false);

    const three = [
      makeRecord({ id: "r1", children_consulted: false }),
      makeRecord({ id: "r2", children_consulted: false }),
      makeRecord({ id: "r3", children_consulted: false }),
    ];
    expect(identifyHomeImprovementAlerts(three).some((a) => a.type === "children_not_consulted" && a.severity === "medium")).toBe(true);
  });

  it("medium: building_regs_non_compliant when in_progress and not compliant", () => {
    const records = [makeRecord({ building_regs_compliant: false, project_status: "in_progress" })];
    const alerts = identifyHomeImprovementAlerts(records);
    expect(alerts.some((a) => a.type === "building_regs_non_compliant" && a.severity === "medium")).toBe(true);
  });
});
