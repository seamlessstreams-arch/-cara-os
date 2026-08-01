import { describe, it, expect } from "vitest";
import {
  computeMaintenanceMetrics,
  identifyMaintenanceAlerts,
  type MaintenanceRecord,
} from "./maintenance-repairs-service";

function makeRecord(
  overrides: Partial<MaintenanceRecord> = {},
): MaintenanceRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    maintenance_type: "repair_request",
    reported_date: "2026-05-10",
    completed_date: "2026-05-12",
    priority: "routine",
    status: "completed",
    description: "Fix leaking tap",
    location: "Kitchen",
    contractor_used: false,
    contractor_name: null,
    contractor_status: "not_required",
    cost: 50,
    children_impact_assessed: true,
    safeguarding_check_completed: true,
    certificate_obtained: true,
    days_to_completion: 2,
    reported_by: "Staff A",
    completed_by: "Staff B",
    issues_found: [],
    actions_taken: [],
    next_due_date: null,
    notes: null,
    created_at: "2026-05-10T10:00:00Z",
    updated_at: "2026-05-12T10:00:00Z",
    ...overrides,
  };
}

describe("computeMaintenanceMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMaintenanceMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.repair_request_count).toBe(0);
    expect(m.completed_count).toBe(0);
    expect(m.open_count).toBe(0);
    expect(m.completion_rate).toBeNull();;
    expect(m.average_days_to_completion).toBeNull();;
    expect(m.total_cost).toBe(0);
  });

  it("computes correct counts and rates for populated data", () => {
    const records = [
      makeRecord({ id: "1", maintenance_type: "repair_request", status: "completed", priority: "emergency", cost: 100, days_to_completion: 1 }),
      makeRecord({ id: "2", maintenance_type: "planned_maintenance", status: "in_progress", priority: "urgent", cost: 200, days_to_completion: null, contractor_used: true }),
      makeRecord({ id: "3", maintenance_type: "pat_testing", status: "completed", priority: "routine", cost: null, days_to_completion: 3 }),
    ];
    const m = computeMaintenanceMetrics(records);
    expect(m.total_records).toBe(3);
    expect(m.repair_request_count).toBe(1);
    expect(m.planned_maintenance_count).toBe(1);
    expect(m.pat_testing_count).toBe(1);
    expect(m.completed_count).toBe(2);
    expect(m.open_count).toBe(1);
    expect(m.completion_rate).toBe(66.7);
    expect(m.emergency_count).toBe(1);
    expect(m.urgent_count).toBe(1);
    expect(m.average_days_to_completion).toBe(2); // (1+3)/2
    expect(m.total_cost).toBe(300);
    expect(m.contractor_used_rate).toBe(33.3);
  });

  it("counts overdue records correctly", () => {
    const records = [
      makeRecord({ id: "1", next_due_date: "2020-01-01" }),
      makeRecord({ id: "2", next_due_date: "2030-01-01" }),
      makeRecord({ id: "3", next_due_date: null }),
    ];
    const m = computeMaintenanceMetrics(records);
    expect(m.overdue_count).toBe(1);
  });
});

describe("identifyMaintenanceAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyMaintenanceAlerts([])).toHaveLength(0);
  });

  it("triggers emergency_outstanding (critical) when emergency not completed/cancelled", () => {
    const records = [
      makeRecord({ id: "e1", priority: "emergency", status: "in_progress" }),
    ];
    const alerts = identifyMaintenanceAlerts(records);
    const a = alerts.find((x) => x.type === "emergency_outstanding");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("triggers contractor_no_safeguarding (critical) when contractor used without check", () => {
    const records = [
      makeRecord({ id: "c1", contractor_used: true, safeguarding_check_completed: false, contractor_name: "Bob", status: "in_progress" }),
    ];
    const alerts = identifyMaintenanceAlerts(records);
    const a = alerts.find((x) => x.type === "contractor_no_safeguarding");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("triggers urgent_outstanding (high) when >= 1 urgent repair not completed", () => {
    const records = [
      makeRecord({ id: "u1", priority: "urgent", status: "reported" }),
    ];
    const alerts = identifyMaintenanceAlerts(records);
    const a = alerts.find((x) => x.type === "urgent_outstanding");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers no_impact_assessment (medium) when >= 3 jobs without children impact assessment", () => {
    const records = [
      makeRecord({ id: "1", children_impact_assessed: false, status: "completed" }),
      makeRecord({ id: "2", children_impact_assessed: false, status: "in_progress" }),
      makeRecord({ id: "3", children_impact_assessed: false, status: "reported" }),
    ];
    const alerts = identifyMaintenanceAlerts(records);
    const a = alerts.find((x) => x.type === "no_impact_assessment");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });

  it("does NOT trigger no_impact_assessment when only 2 jobs lack it", () => {
    const records = [
      makeRecord({ id: "1", children_impact_assessed: false, status: "completed" }),
      makeRecord({ id: "2", children_impact_assessed: false, status: "reported" }),
    ];
    const alerts = identifyMaintenanceAlerts(records);
    expect(alerts.find((x) => x.type === "no_impact_assessment")).toBeUndefined();
  });

  it("triggers maintenance_overdue (medium) when >= 1 item has past next_due_date", () => {
    const records = [
      makeRecord({ id: "o1", next_due_date: "2020-01-01" }),
    ];
    const alerts = identifyMaintenanceAlerts(records);
    const a = alerts.find((x) => x.type === "maintenance_overdue");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });
});
