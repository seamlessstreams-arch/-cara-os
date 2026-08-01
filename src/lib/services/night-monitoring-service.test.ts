import { describe, it, expect } from "vitest";
import {
  computeNightMonitoringMetrics,
  identifyNightMonitoringAlerts,
  type NightCheck,
  type NightLog,
} from "./night-monitoring-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeCheck(overrides: Partial<NightCheck> = {}): NightCheck {
  return {
    id: "chk-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex Taylor",
    check_time: "2026-05-21T02:00:00Z",
    checked_by: "Night Staff A",
    check_type: "routine_sleep",
    child_status: "sleeping",
    response_action: null,
    notes: null,
    created_at: "2026-05-21T02:00:00Z",
    ...overrides,
  };
}

function makeLog(overrides: Partial<NightLog> = {}): NightLog {
  return {
    id: "log-1",
    home_id: "home-1",
    shift_date: "2026-05-20",
    shift_start: "2026-05-20T21:00:00Z",
    shift_end: "2026-05-21T07:00:00Z",
    staff_on_duty: [{ name: "Night Staff A", role: "waking_night" }],
    lead_staff: "Night Staff A",
    handover_received: true,
    handover_notes: "All well",
    total_checks_completed: 8,
    all_children_checked: true,
    incidents_count: 0,
    disturbances_count: 1,
    premises_secure: true,
    fire_panel_checked: true,
    overnight_summary: "Quiet night",
    handover_given: true,
    handover_given_notes: "All well",
    status: "reviewed",
    reviewed_by: "Manager",
    reviewed_date: "2026-05-21T09:00:00Z",
    created_at: "2026-05-20T21:00:00Z",
    updated_at: "2026-05-21T07:00:00Z",
    ...overrides,
  };
}

// ── computeNightMonitoringMetrics ──────────────────────────────────────

describe("computeNightMonitoringMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeNightMonitoringMetrics([], []);
    expect(m.total_checks_last_7d).toBe(0);
    expect(m.avg_checks_per_night).toBeNull();;
    expect(m.all_children_checked_rate).toBeNull();;
    expect(m.disturbance_count).toBe(0);
    expect(m.premises_secure_rate).toBeNull();;
    expect(m.unreviewed_logs_count).toBe(0);
  });

  it("computes metrics from populated data", () => {
    const checks = [
      makeCheck({ id: "chk-1", check_time: "2026-05-21T02:00:00Z", child_status: "sleeping" }),
      makeCheck({ id: "chk-2", check_time: "2026-05-21T04:00:00Z", child_status: "awake_settled" }),
    ];
    const logs = [
      makeLog({
        id: "log-1",
        total_checks_completed: 8,
        all_children_checked: true,
        disturbances_count: 2,
        incidents_count: 1,
        premises_secure: true,
        handover_received: true,
        handover_given: true,
        fire_panel_checked: true,
        status: "reviewed",
      }),
      makeLog({
        id: "log-2",
        total_checks_completed: 6,
        all_children_checked: false,
        disturbances_count: 0,
        incidents_count: 0,
        premises_secure: false,
        handover_received: false,
        handover_given: false,
        status: "completed",
      }),
    ];
    const m = computeNightMonitoringMetrics(checks, logs, NOW);
    expect(m.total_checks_last_7d).toBe(2);
    expect(m.avg_checks_per_night).toBe(7); // (8+6)/2
    expect(m.all_children_checked_rate).toBe(50);
    expect(m.disturbance_count).toBe(2);
    expect(m.incidents_count).toBe(1);
    expect(m.premises_secure_rate).toBe(50);
    expect(m.handover_completion_rate).toBe(50);
    expect(m.unreviewed_logs_count).toBe(1); // log-2 is "completed" not "reviewed"
    expect(m.by_child_status["sleeping"]).toBe(1);
    expect(m.by_child_status["awake_settled"]).toBe(1);
  });
});

// ── identifyNightMonitoringAlerts ──────────────────────────────────────

describe("identifyNightMonitoringAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyNightMonitoringAlerts([], [], 4)).toHaveLength(0);
  });

  it("flags child_not_checked (critical) when last check > 2 hours ago", () => {
    // Last check 3 hours ago
    const threeHoursAgo = new Date(NOW.getTime() - 3 * 60 * 60 * 1000).toISOString();
    const checks = [makeCheck({ child_id: "child-1", check_time: threeHoursAgo })];
    const alerts = identifyNightMonitoringAlerts(checks, [], 4);
    const found = alerts.filter((a) => a.type === "child_not_checked");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("critical");
  });

  it("flags child_distressed (high)", () => {
    const checks = [makeCheck({ child_status: "distressed", check_time: NOW.toISOString() })];
    const alerts = identifyNightMonitoringAlerts(checks, [], 4);
    const found = alerts.filter((a) => a.type === "child_distressed");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags shift_no_checks (critical) for completed shift with 0 checks", () => {
    const logs = [makeLog({ total_checks_completed: 0, status: "completed" })];
    const alerts = identifyNightMonitoringAlerts([], logs, 4);
    const found = alerts.filter((a) => a.type === "shift_no_checks");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("critical");
  });

  it("flags premises_not_secured (critical)", () => {
    const logs = [makeLog({ premises_secure: false })];
    const alerts = identifyNightMonitoringAlerts([], logs, 4);
    const found = alerts.filter((a) => a.type === "premises_not_secured");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("critical");
  });

  it("flags fire_panel_not_checked (high)", () => {
    const logs = [makeLog({ fire_panel_checked: false })];
    const alerts = identifyNightMonitoringAlerts([], logs, 4);
    const found = alerts.filter((a) => a.type === "fire_panel_not_checked");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags handover_not_received (high)", () => {
    const logs = [makeLog({ handover_received: false })];
    const alerts = identifyNightMonitoringAlerts([], logs, 4);
    const found = alerts.filter((a) => a.type === "handover_not_received");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags log_not_completed (high) when in_progress but shift_end set", () => {
    const logs = [makeLog({ status: "in_progress", shift_end: "2026-05-21T07:00:00Z" })];
    const alerts = identifyNightMonitoringAlerts([], logs, 4);
    const found = alerts.filter((a) => a.type === "log_not_completed");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags high_disturbance_count (medium) when > 3", () => {
    const logs = [makeLog({ disturbances_count: 5 })];
    const alerts = identifyNightMonitoringAlerts([], logs, 4);
    const found = alerts.filter((a) => a.type === "high_disturbance_count");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("medium");
  });
});
