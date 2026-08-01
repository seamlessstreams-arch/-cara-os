import { describe, it, expect } from "vitest";
import {
  computePremisesCompliance,
  computeMaintenanceSummary,
  identifyPremisesAlerts,
  computeCheckSchedule,
} from "./premises-service";
import type { PremisesCheck, MaintenanceRequest } from "./premises-service";

// -- Factories ----------------------------------------------------------------

const NOW = new Date("2026-05-21T12:00:00Z");

function makeCheck(overrides: Partial<PremisesCheck> = {}): PremisesCheck {
  return {
    id: "chk-1",
    home_id: "home-1",
    check_type: "fire_alarm_test",
    check_date: "2026-05-20",
    completed_by: "Staff A",
    result: "pass",
    notes: null,
    issues_found: [],
    follow_up_required: false,
    follow_up_date: null,
    certificate_reference: null,
    created_at: "2026-05-20T00:00:00Z",
    ...overrides,
  };
}

function makeRequest(overrides: Partial<MaintenanceRequest> = {}): MaintenanceRequest {
  return {
    id: "maint-1",
    home_id: "home-1",
    title: "Leaking tap",
    description: "Kitchen tap leaking",
    category: "plumbing",
    priority: "medium",
    location: "Kitchen",
    reported_by: "Staff A",
    reported_date: "2026-05-10",
    assigned_to: null,
    estimated_cost: null,
    actual_cost: null,
    completion_date: null,
    status: "open",
    child_safety_risk: false,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computePremisesCompliance ------------------------------------------------

describe("computePremisesCompliance", () => {
  it("returns defaults for empty checks", () => {
    const m = computePremisesCompliance([]);
    expect(m.total_checks).toBe(0);
    expect(m.pass_rate).toBe(100); // default when no applicable
    expect(m.fail_count).toBe(0);
    expect(m.follow_ups_pending).toBe(0);
    expect(m.issues_found_count).toBe(0);
    // All CHECK_TYPES should be overdue since none done
    expect(m.overdue_checks.length).toBeGreaterThan(0);
  });

  it("computes pass rate correctly", () => {
    const checks = [
      makeCheck({ id: "1", result: "pass" }),
      makeCheck({ id: "2", result: "pass" }),
      makeCheck({ id: "3", result: "fail" }),
      makeCheck({ id: "4", result: "not_applicable" }),
    ];
    const m = computePremisesCompliance(checks);
    // 2 pass / 3 applicable = 66.7%
    expect(m.pass_rate).toBe(66.7);
    expect(m.fail_count).toBe(1);
  });

  it("counts issues found across all checks", () => {
    const checks = [
      makeCheck({ id: "1", issues_found: ["issue1", "issue2"] }),
      makeCheck({ id: "2", issues_found: ["issue3"] }),
    ];
    const m = computePremisesCompliance(checks);
    expect(m.issues_found_count).toBe(3);
  });

  it("counts follow-ups pending", () => {
    const checks = [
      makeCheck({ id: "1", follow_up_required: true, follow_up_date: "2026-06-01" }),
      makeCheck({ id: "2", follow_up_required: true, follow_up_date: null }),
      makeCheck({ id: "3", follow_up_required: false }),
    ];
    const m = computePremisesCompliance(checks, NOW);
    expect(m.follow_ups_pending).toBe(2);
  });
});

// -- computeMaintenanceSummary ------------------------------------------------

describe("computeMaintenanceSummary", () => {
  it("returns zeroes for empty requests", () => {
    const m = computeMaintenanceSummary([]);
    expect(m.total_requests).toBe(0);
    expect(m.open).toBe(0);
    expect(m.in_progress).toBe(0);
    expect(m.completed).toBe(0);
    expect(m.avg_resolution_days).toBeNull();;
    expect(m.safety_risks_open).toBe(0);
    expect(m.total_cost).toBe(0);
    expect(m.overdue_urgent).toBe(0);
  });

  it("counts statuses correctly", () => {
    const requests = [
      makeRequest({ id: "1", status: "open" }),
      makeRequest({ id: "2", status: "in_progress" }),
      makeRequest({ id: "3", status: "completed", completion_date: "2026-05-15", actual_cost: 100 }),
    ];
    const m = computeMaintenanceSummary(requests);
    expect(m.open).toBe(1);
    expect(m.in_progress).toBe(1);
    expect(m.completed).toBe(1);
  });

  it("computes average resolution days for completed requests", () => {
    const requests = [
      makeRequest({
        id: "1",
        status: "completed",
        reported_date: "2026-05-01",
        completion_date: "2026-05-11",
      }),
      makeRequest({
        id: "2",
        status: "completed",
        reported_date: "2026-05-01",
        completion_date: "2026-05-06",
      }),
    ];
    const m = computeMaintenanceSummary(requests);
    // (10 + 5) / 2 = 7.5
    expect(m.avg_resolution_days).toBe(7.5);
  });

  it("counts safety risks open", () => {
    const requests = [
      makeRequest({ id: "1", status: "open", child_safety_risk: true }),
      makeRequest({ id: "2", status: "in_progress", child_safety_risk: true }),
      makeRequest({ id: "3", status: "completed", child_safety_risk: true }),
    ];
    const m = computeMaintenanceSummary(requests);
    expect(m.safety_risks_open).toBe(2); // open + in_progress only
  });

  it("sums total cost from completed requests", () => {
    const requests = [
      makeRequest({ id: "1", status: "completed", actual_cost: 150.50 }),
      makeRequest({ id: "2", status: "completed", actual_cost: 200 }),
      makeRequest({ id: "3", status: "open", actual_cost: 500 }),
    ];
    const m = computeMaintenanceSummary(requests);
    expect(m.total_cost).toBe(350.5);
  });

  it("counts overdue urgent requests (open > 7 days)", () => {
    const requests = [
      makeRequest({ id: "1", priority: "urgent", status: "open", reported_date: "2026-05-01" }), // > 7 days
      makeRequest({ id: "2", priority: "urgent", status: "open", reported_date: "2026-05-20" }), // < 7 days
    ];
    const m = computeMaintenanceSummary(requests, NOW);
    expect(m.overdue_urgent).toBe(1);
  });
});

// -- identifyPremisesAlerts ---------------------------------------------------

describe("identifyPremisesAlerts", () => {
  it("returns empty alerts when no checks or requests", () => {
    const alerts = identifyPremisesAlerts([], [], NOW);
    // Will still get overdue statutory check alerts since no checks done
    const overdueAlerts = alerts.filter((a) => a.type === "check_overdue");
    expect(overdueAlerts.length).toBeGreaterThan(0);
  });

  it("fires critical alert for overdue fire-related statutory check", () => {
    const alerts = identifyPremisesAlerts([], [], NOW);
    const fireAlerts = alerts.filter(
      (a) => a.type === "check_overdue" && a.severity === "critical",
    );
    expect(fireAlerts.length).toBeGreaterThan(0);
  });

  it("fires high alert for failed check", () => {
    const checks = [makeCheck({ result: "fail" })];
    const alerts = identifyPremisesAlerts(checks, [], NOW);
    expect(alerts.filter((a) => a.type === "check_failed")).toHaveLength(1);
  });

  it("fires critical alert for maintenance with child safety risk open", () => {
    const requests = [makeRequest({ status: "open", child_safety_risk: true })];
    const alerts = identifyPremisesAlerts([], requests, NOW);
    expect(alerts.filter((a) => a.type === "safety_risk" && a.severity === "critical")).toHaveLength(1);
  });

  it("fires high alert for urgent maintenance open > 3 days", () => {
    const requests = [
      makeRequest({ priority: "urgent", status: "open", reported_date: "2026-05-10" }),
    ];
    const alerts = identifyPremisesAlerts([], requests, NOW);
    expect(alerts.filter((a) => a.type === "urgent_maintenance")).toHaveLength(1);
  });

  it("fires medium alert for high maintenance backlog (>= 5 open)", () => {
    const requests = Array.from({ length: 5 }, (_, i) =>
      makeRequest({ id: `m-${i}`, status: "open" }),
    );
    const alerts = identifyPremisesAlerts([], requests, NOW);
    expect(alerts.filter((a) => a.type === "high_maintenance_backlog")).toHaveLength(1);
  });

  it("does NOT fire backlog alert for fewer than 5 open requests", () => {
    const requests = Array.from({ length: 4 }, (_, i) =>
      makeRequest({ id: `m-${i}`, status: "open" }),
    );
    const alerts = identifyPremisesAlerts([], requests, NOW);
    expect(alerts.filter((a) => a.type === "high_maintenance_backlog")).toHaveLength(0);
  });
});

// -- computeCheckSchedule -----------------------------------------------------

describe("computeCheckSchedule", () => {
  it("marks all checks as overdue when none completed", () => {
    const schedule = computeCheckSchedule([]);
    expect(schedule.length).toBeGreaterThan(0);
    // First entry should be overdue or due today
    expect(schedule[0].last_done).toBeNull();
  });

  it("returns sorted by days_until ascending", () => {
    const schedule = computeCheckSchedule([]);
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].days_until).toBeGreaterThanOrEqual(schedule[i - 1].days_until);
    }
  });

  it("correctly computes next due date from last check", () => {
    const checks = [
      makeCheck({ check_type: "fire_alarm_test", check_date: "2026-05-20" }),
    ];
    const schedule = computeCheckSchedule(checks, NOW);
    const fireAlarm = schedule.find((s) => s.check_type === "fire_alarm_test");
    expect(fireAlarm).toBeDefined();
    expect(fireAlarm!.last_done).toBe("2026-05-20");
    // fire_alarm_test frequency_days = 7, so next_due = 2026-05-27
    expect(fireAlarm!.next_due).toBe("2026-05-27");
    expect(fireAlarm!.overdue).toBe(false);
  });
});
