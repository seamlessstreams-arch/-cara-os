// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — NIGHT MONITORING SERVICE TESTS
// Pure-function unit tests for night monitoring metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 12 (protection of children),
// Reg 25 (premises and environment — night safety), Reg 32/33
// (fitness of workers — night staffing).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  CHECK_TYPES,
  CHILD_STATUSES,
  RESPONSE_ACTIONS,
  NIGHT_LOG_STATUSES,
  MINIMUM_CHECK_FREQUENCY_HOURS,
  listNightChecks,
  createNightCheck,
  listNightLogs,
  createNightLog,
  updateNightLog,
} from "../night-monitoring-service";

import type {
  NightCheck,
  NightLog,
} from "../night-monitoring-service";

const {
  computeNightMonitoringMetrics,
  identifyNightMonitoringAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** ISO datetime string N hours ago. */
function hoursAgoISO(n: number): string {
  const d = new Date();
  d.setTime(d.getTime() - n * 60 * 60 * 1000);
  return d.toISOString();
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Date string N days ago (YYYY-MM-DD). */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Build a minimal NightCheck with sensible defaults. */
function makeCheck(
  overrides: Partial<NightCheck> = {},
): NightCheck {
  return {
    id: "chk-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex Smith",
    check_time: hoursAgoISO(1),
    checked_by: "staff-1",
    check_type: "routine_sleep",
    child_status: "sleeping",
    response_action: null,
    notes: null,
    created_at: daysAgoISO(0),
    ...overrides,
  };
}

/** Build a minimal NightLog with sensible defaults. */
function makeLog(
  overrides: Partial<NightLog> = {},
): NightLog {
  return {
    id: "log-1",
    home_id: "home-1",
    shift_date: daysAgo(1),
    shift_start: daysAgoISO(1),
    shift_end: hoursAgoISO(1),
    staff_on_duty: [{ name: "Jane Doe", role: "Night Worker" }],
    lead_staff: "Jane Doe",
    handover_received: true,
    handover_notes: "All settled",
    total_checks_completed: 6,
    all_children_checked: true,
    incidents_count: 0,
    disturbances_count: 0,
    premises_secure: true,
    fire_panel_checked: true,
    overnight_summary: "Quiet night, all children slept well.",
    handover_given: true,
    handover_given_notes: "No concerns to pass on.",
    status: "reviewed",
    reviewed_by: "manager-1",
    reviewed_date: daysAgoISO(0),
    created_at: daysAgoISO(1),
    updated_at: daysAgoISO(0),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("CHECK_TYPES", () => {
  it("has exactly 5 check types", () => {
    expect(CHECK_TYPES).toHaveLength(5);
  });

  it("contains unique type values", () => {
    const types = CHECK_TYPES.map((c) => c.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("contains unique label values", () => {
    const labels = CHECK_TYPES.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes routine_sleep", () => {
    expect(CHECK_TYPES.find((c) => c.type === "routine_sleep")).toBeDefined();
  });

  it("includes welfare_check", () => {
    expect(CHECK_TYPES.find((c) => c.type === "welfare_check")).toBeDefined();
  });

  it("includes requested_check", () => {
    expect(CHECK_TYPES.find((c) => c.type === "requested_check")).toBeDefined();
  });

  it("includes disturbance_response", () => {
    expect(CHECK_TYPES.find((c) => c.type === "disturbance_response")).toBeDefined();
  });

  it("includes medical_check", () => {
    expect(CHECK_TYPES.find((c) => c.type === "medical_check")).toBeDefined();
  });

  it("every entry has both type and label", () => {
    for (const entry of CHECK_TYPES) {
      expect(entry.type).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("CHILD_STATUSES", () => {
  it("has exactly 6 child statuses", () => {
    expect(CHILD_STATUSES).toHaveLength(6);
  });

  it("contains unique status values", () => {
    const statuses = CHILD_STATUSES.map((c) => c.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("contains unique label values", () => {
    const labels = CHILD_STATUSES.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes sleeping", () => {
    expect(CHILD_STATUSES.find((c) => c.status === "sleeping")).toBeDefined();
  });

  it("includes awake_settled", () => {
    expect(CHILD_STATUSES.find((c) => c.status === "awake_settled")).toBeDefined();
  });

  it("includes awake_unsettled", () => {
    expect(CHILD_STATUSES.find((c) => c.status === "awake_unsettled")).toBeDefined();
  });

  it("includes not_in_room", () => {
    expect(CHILD_STATUSES.find((c) => c.status === "not_in_room")).toBeDefined();
  });

  it("includes distressed", () => {
    expect(CHILD_STATUSES.find((c) => c.status === "distressed")).toBeDefined();
  });

  it("includes medical_attention", () => {
    expect(CHILD_STATUSES.find((c) => c.status === "medical_attention")).toBeDefined();
  });

  it("every entry has both status and label", () => {
    for (const entry of CHILD_STATUSES) {
      expect(entry.status).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("RESPONSE_ACTIONS", () => {
  it("has exactly 6 response actions", () => {
    expect(RESPONSE_ACTIONS).toHaveLength(6);
  });

  it("contains unique action values", () => {
    const actions = RESPONSE_ACTIONS.map((r) => r.action);
    expect(new Set(actions).size).toBe(actions.length);
  });

  it("contains unique label values", () => {
    const labels = RESPONSE_ACTIONS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes reassured", () => {
    expect(RESPONSE_ACTIONS.find((r) => r.action === "reassured")).toBeDefined();
  });

  it("includes spoken_to", () => {
    expect(RESPONSE_ACTIONS.find((r) => r.action === "spoken_to")).toBeDefined();
  });

  it("includes medication_given", () => {
    expect(RESPONSE_ACTIONS.find((r) => r.action === "medication_given")).toBeDefined();
  });

  it("includes incident_reported", () => {
    expect(RESPONSE_ACTIONS.find((r) => r.action === "incident_reported")).toBeDefined();
  });

  it("includes manager_called", () => {
    expect(RESPONSE_ACTIONS.find((r) => r.action === "manager_called")).toBeDefined();
  });

  it("includes no_action_needed", () => {
    expect(RESPONSE_ACTIONS.find((r) => r.action === "no_action_needed")).toBeDefined();
  });

  it("every entry has both action and label", () => {
    for (const entry of RESPONSE_ACTIONS) {
      expect(entry.action).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("NIGHT_LOG_STATUSES", () => {
  it("has exactly 3 log statuses", () => {
    expect(NIGHT_LOG_STATUSES).toHaveLength(3);
  });

  it("contains unique status values", () => {
    const statuses = NIGHT_LOG_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("contains unique label values", () => {
    const labels = NIGHT_LOG_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes in_progress", () => {
    expect(NIGHT_LOG_STATUSES.find((s) => s.status === "in_progress")).toBeDefined();
  });

  it("includes completed", () => {
    expect(NIGHT_LOG_STATUSES.find((s) => s.status === "completed")).toBeDefined();
  });

  it("includes reviewed", () => {
    expect(NIGHT_LOG_STATUSES.find((s) => s.status === "reviewed")).toBeDefined();
  });

  it("every entry has both status and label", () => {
    for (const entry of NIGHT_LOG_STATUSES) {
      expect(entry.status).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("MINIMUM_CHECK_FREQUENCY_HOURS", () => {
  it("is set to 2 hours", () => {
    expect(MINIMUM_CHECK_FREQUENCY_HOURS).toBe(2);
  });

  it("is a positive number", () => {
    expect(MINIMUM_CHECK_FREQUENCY_HOURS).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// computeNightMonitoringMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeNightMonitoringMetrics", () => {
  it("returns zeroed metrics for empty inputs", () => {
    const result = computeNightMonitoringMetrics([], []);
    expect(result.total_checks_last_7d).toBe(0);
    expect(result.avg_checks_per_night).toBe(0);
    expect(result.all_children_checked_rate).toBe(0);
    expect(result.disturbance_count).toBe(0);
    expect(result.incidents_count).toBe(0);
    expect(result.by_child_status).toEqual({});
    expect(result.by_check_type).toEqual({});
    expect(result.premises_secure_rate).toBe(0);
    expect(result.handover_completion_rate).toBe(0);
    expect(result.unreviewed_logs_count).toBe(0);
  });

  // ── total_checks_last_7d ──────────────────────────────────────────────

  it("counts checks within last 7 days", () => {
    const checks = [
      makeCheck({ id: "c1", check_time: hoursAgoISO(1) }),
      makeCheck({ id: "c2", check_time: hoursAgoISO(24) }),
      makeCheck({ id: "c3", check_time: daysAgoISO(5) }),
    ];
    const result = computeNightMonitoringMetrics(checks, []);
    expect(result.total_checks_last_7d).toBe(3);
  });

  it("excludes checks older than 7 days", () => {
    const checks = [
      makeCheck({ id: "c1", check_time: hoursAgoISO(1) }),
      makeCheck({ id: "c2", check_time: daysAgoISO(10) }),
      makeCheck({ id: "c3", check_time: daysAgoISO(30) }),
    ];
    const result = computeNightMonitoringMetrics(checks, []);
    expect(result.total_checks_last_7d).toBe(1);
  });

  it("returns 0 checks when all are older than 7 days", () => {
    const checks = [
      makeCheck({ id: "c1", check_time: daysAgoISO(10) }),
      makeCheck({ id: "c2", check_time: daysAgoISO(20) }),
    ];
    const result = computeNightMonitoringMetrics(checks, []);
    expect(result.total_checks_last_7d).toBe(0);
  });

  it("counts a single recent check", () => {
    const checks = [makeCheck({ id: "c1", check_time: hoursAgoISO(2) })];
    const result = computeNightMonitoringMetrics(checks, []);
    expect(result.total_checks_last_7d).toBe(1);
  });

  // ── avg_checks_per_night ──────────────────────────────────────────────

  it("computes average checks per night from logs", () => {
    const logs = [
      makeLog({ id: "l1", total_checks_completed: 6 }),
      makeLog({ id: "l2", total_checks_completed: 8 }),
    ];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.avg_checks_per_night).toBe(7);
  });

  it("computes avg_checks_per_night for single log", () => {
    const logs = [makeLog({ id: "l1", total_checks_completed: 5 })];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.avg_checks_per_night).toBe(5);
  });

  it("returns 0 avg_checks_per_night for no logs", () => {
    const result = computeNightMonitoringMetrics([], []);
    expect(result.avg_checks_per_night).toBe(0);
  });

  it("rounds avg_checks_per_night to one decimal place", () => {
    const logs = [
      makeLog({ id: "l1", total_checks_completed: 5 }),
      makeLog({ id: "l2", total_checks_completed: 6 }),
      makeLog({ id: "l3", total_checks_completed: 7 }),
    ];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.avg_checks_per_night).toBe(6);
  });

  it("handles fractional avg_checks_per_night", () => {
    const logs = [
      makeLog({ id: "l1", total_checks_completed: 3 }),
      makeLog({ id: "l2", total_checks_completed: 4 }),
    ];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.avg_checks_per_night).toBe(3.5);
  });

  it("includes logs with 0 total_checks_completed in average", () => {
    const logs = [
      makeLog({ id: "l1", total_checks_completed: 0 }),
      makeLog({ id: "l2", total_checks_completed: 10 }),
    ];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.avg_checks_per_night).toBe(5);
  });

  // ── all_children_checked_rate ─────────────────────────────────────────

  it("computes 100% all_children_checked_rate when all logs have it true", () => {
    const logs = [
      makeLog({ id: "l1", all_children_checked: true }),
      makeLog({ id: "l2", all_children_checked: true }),
    ];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.all_children_checked_rate).toBe(100);
  });

  it("computes 0% all_children_checked_rate when all logs have it false", () => {
    const logs = [
      makeLog({ id: "l1", all_children_checked: false }),
      makeLog({ id: "l2", all_children_checked: false }),
    ];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.all_children_checked_rate).toBe(0);
  });

  it("computes 50% all_children_checked_rate for mixed logs", () => {
    const logs = [
      makeLog({ id: "l1", all_children_checked: true }),
      makeLog({ id: "l2", all_children_checked: false }),
    ];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.all_children_checked_rate).toBe(50);
  });

  it("returns 0 all_children_checked_rate for no logs", () => {
    const result = computeNightMonitoringMetrics([], []);
    expect(result.all_children_checked_rate).toBe(0);
  });

  // ── disturbance_count ─────────────────────────────────────────────────

  it("sums disturbance counts across logs", () => {
    const logs = [
      makeLog({ id: "l1", disturbances_count: 2 }),
      makeLog({ id: "l2", disturbances_count: 3 }),
    ];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.disturbance_count).toBe(5);
  });

  it("returns 0 disturbance count when no disturbances", () => {
    const logs = [
      makeLog({ id: "l1", disturbances_count: 0 }),
    ];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.disturbance_count).toBe(0);
  });

  it("returns 0 disturbance count for empty logs", () => {
    const result = computeNightMonitoringMetrics([], []);
    expect(result.disturbance_count).toBe(0);
  });

  // ── incidents_count ───────────────────────────────────────────────────

  it("sums incident counts across logs", () => {
    const logs = [
      makeLog({ id: "l1", incidents_count: 1 }),
      makeLog({ id: "l2", incidents_count: 2 }),
    ];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.incidents_count).toBe(3);
  });

  it("returns 0 incidents count when no incidents", () => {
    const logs = [
      makeLog({ id: "l1", incidents_count: 0 }),
    ];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.incidents_count).toBe(0);
  });

  it("returns 0 incidents count for empty logs", () => {
    const result = computeNightMonitoringMetrics([], []);
    expect(result.incidents_count).toBe(0);
  });

  // ── by_child_status ───────────────────────────────────────────────────

  it("groups checks by child status", () => {
    const checks = [
      makeCheck({ id: "c1", child_status: "sleeping" }),
      makeCheck({ id: "c2", child_status: "sleeping" }),
      makeCheck({ id: "c3", child_status: "awake_settled" }),
      makeCheck({ id: "c4", child_status: "distressed" }),
    ];
    const result = computeNightMonitoringMetrics(checks, []);
    expect(result.by_child_status).toEqual({
      sleeping: 2,
      awake_settled: 1,
      distressed: 1,
    });
  });

  it("returns empty by_child_status for no checks", () => {
    const result = computeNightMonitoringMetrics([], []);
    expect(result.by_child_status).toEqual({});
  });

  it("handles single status across all checks", () => {
    const checks = [
      makeCheck({ id: "c1", child_status: "sleeping" }),
      makeCheck({ id: "c2", child_status: "sleeping" }),
    ];
    const result = computeNightMonitoringMetrics(checks, []);
    expect(result.by_child_status).toEqual({ sleeping: 2 });
  });

  it("counts all six child statuses correctly", () => {
    const checks = [
      makeCheck({ id: "c1", child_status: "sleeping" }),
      makeCheck({ id: "c2", child_status: "awake_settled" }),
      makeCheck({ id: "c3", child_status: "awake_unsettled" }),
      makeCheck({ id: "c4", child_status: "not_in_room" }),
      makeCheck({ id: "c5", child_status: "distressed" }),
      makeCheck({ id: "c6", child_status: "medical_attention" }),
    ];
    const result = computeNightMonitoringMetrics(checks, []);
    expect(result.by_child_status).toEqual({
      sleeping: 1,
      awake_settled: 1,
      awake_unsettled: 1,
      not_in_room: 1,
      distressed: 1,
      medical_attention: 1,
    });
  });

  // ── by_check_type ─────────────────────────────────────────────────────

  it("groups checks by check type", () => {
    const checks = [
      makeCheck({ id: "c1", check_type: "routine_sleep" }),
      makeCheck({ id: "c2", check_type: "routine_sleep" }),
      makeCheck({ id: "c3", check_type: "welfare_check" }),
      makeCheck({ id: "c4", check_type: "disturbance_response" }),
    ];
    const result = computeNightMonitoringMetrics(checks, []);
    expect(result.by_check_type).toEqual({
      routine_sleep: 2,
      welfare_check: 1,
      disturbance_response: 1,
    });
  });

  it("returns empty by_check_type for no checks", () => {
    const result = computeNightMonitoringMetrics([], []);
    expect(result.by_check_type).toEqual({});
  });

  it("handles single check type across all checks", () => {
    const checks = [
      makeCheck({ id: "c1", check_type: "welfare_check" }),
      makeCheck({ id: "c2", check_type: "welfare_check" }),
    ];
    const result = computeNightMonitoringMetrics(checks, []);
    expect(result.by_check_type).toEqual({ welfare_check: 2 });
  });

  it("counts all five check types correctly", () => {
    const checks = [
      makeCheck({ id: "c1", check_type: "routine_sleep" }),
      makeCheck({ id: "c2", check_type: "welfare_check" }),
      makeCheck({ id: "c3", check_type: "requested_check" }),
      makeCheck({ id: "c4", check_type: "disturbance_response" }),
      makeCheck({ id: "c5", check_type: "medical_check" }),
    ];
    const result = computeNightMonitoringMetrics(checks, []);
    expect(result.by_check_type).toEqual({
      routine_sleep: 1,
      welfare_check: 1,
      requested_check: 1,
      disturbance_response: 1,
      medical_check: 1,
    });
  });

  // ── premises_secure_rate ──────────────────────────────────────────────

  it("computes 100% premises_secure_rate when all logs have premises_secure", () => {
    const logs = [
      makeLog({ id: "l1", premises_secure: true }),
      makeLog({ id: "l2", premises_secure: true }),
    ];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.premises_secure_rate).toBe(100);
  });

  it("computes 0% premises_secure_rate when no logs have premises_secure", () => {
    const logs = [
      makeLog({ id: "l1", premises_secure: false }),
      makeLog({ id: "l2", premises_secure: false }),
    ];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.premises_secure_rate).toBe(0);
  });

  it("computes 50% premises_secure_rate for mixed logs", () => {
    const logs = [
      makeLog({ id: "l1", premises_secure: true }),
      makeLog({ id: "l2", premises_secure: false }),
    ];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.premises_secure_rate).toBe(50);
  });

  it("returns 0 premises_secure_rate for no logs", () => {
    const result = computeNightMonitoringMetrics([], []);
    expect(result.premises_secure_rate).toBe(0);
  });

  // ── handover_completion_rate ──────────────────────────────────────────

  it("computes 100% handover_completion_rate when all logs have both handovers", () => {
    const logs = [
      makeLog({ id: "l1", handover_received: true, handover_given: true }),
      makeLog({ id: "l2", handover_received: true, handover_given: true }),
    ];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.handover_completion_rate).toBe(100);
  });

  it("computes 0% when no logs have both handovers", () => {
    const logs = [
      makeLog({ id: "l1", handover_received: false, handover_given: true }),
      makeLog({ id: "l2", handover_received: true, handover_given: false }),
    ];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.handover_completion_rate).toBe(0);
  });

  it("requires both received and given for handover completion", () => {
    const logs = [
      makeLog({ id: "l1", handover_received: true, handover_given: false }),
    ];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.handover_completion_rate).toBe(0);
  });

  it("computes 50% handover_completion_rate for mixed logs", () => {
    const logs = [
      makeLog({ id: "l1", handover_received: true, handover_given: true }),
      makeLog({ id: "l2", handover_received: false, handover_given: false }),
    ];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.handover_completion_rate).toBe(50);
  });

  it("returns 0 handover_completion_rate for no logs", () => {
    const result = computeNightMonitoringMetrics([], []);
    expect(result.handover_completion_rate).toBe(0);
  });

  // ── unreviewed_logs_count ─────────────────────────────────────────────

  it("counts logs that are not reviewed", () => {
    const logs = [
      makeLog({ id: "l1", status: "in_progress" }),
      makeLog({ id: "l2", status: "completed" }),
      makeLog({ id: "l3", status: "reviewed" }),
    ];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.unreviewed_logs_count).toBe(2);
  });

  it("counts in_progress status as unreviewed", () => {
    const logs = [makeLog({ id: "l1", status: "in_progress" })];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.unreviewed_logs_count).toBe(1);
  });

  it("counts completed status as unreviewed", () => {
    const logs = [makeLog({ id: "l1", status: "completed" })];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.unreviewed_logs_count).toBe(1);
  });

  it("does not count reviewed status as unreviewed", () => {
    const logs = [makeLog({ id: "l1", status: "reviewed" })];
    const result = computeNightMonitoringMetrics([], logs);
    expect(result.unreviewed_logs_count).toBe(0);
  });

  it("returns 0 unreviewed_logs_count for empty logs", () => {
    const result = computeNightMonitoringMetrics([], []);
    expect(result.unreviewed_logs_count).toBe(0);
  });

  // ── Combined scenarios ────────────────────────────────────────────────

  it("handles mixed checks and logs together", () => {
    const checks = [
      makeCheck({ id: "c1", check_time: hoursAgoISO(1), check_type: "routine_sleep", child_status: "sleeping" }),
      makeCheck({ id: "c2", check_time: hoursAgoISO(3), check_type: "welfare_check", child_status: "awake_settled" }),
      makeCheck({ id: "c3", check_time: daysAgoISO(10), check_type: "routine_sleep", child_status: "sleeping" }),
    ];
    const logs = [
      makeLog({ id: "l1", total_checks_completed: 6, all_children_checked: true, disturbances_count: 1, incidents_count: 0, premises_secure: true, handover_received: true, handover_given: true, fire_panel_checked: true, status: "reviewed" }),
      makeLog({ id: "l2", total_checks_completed: 4, all_children_checked: false, disturbances_count: 2, incidents_count: 1, premises_secure: false, handover_received: false, handover_given: true, fire_panel_checked: false, status: "completed" }),
    ];
    const result = computeNightMonitoringMetrics(checks, logs);
    expect(result.total_checks_last_7d).toBe(2);
    expect(result.avg_checks_per_night).toBe(5);
    expect(result.all_children_checked_rate).toBe(50);
    expect(result.disturbance_count).toBe(3);
    expect(result.incidents_count).toBe(1);
    expect(result.by_child_status).toEqual({ sleeping: 2, awake_settled: 1 });
    expect(result.by_check_type).toEqual({ routine_sleep: 2, welfare_check: 1 });
    expect(result.premises_secure_rate).toBe(50);
    expect(result.handover_completion_rate).toBe(50);
    expect(result.unreviewed_logs_count).toBe(1);
  });

  it("by_child_status includes all checks regardless of age", () => {
    const checks = [
      makeCheck({ id: "c1", check_time: daysAgoISO(30), child_status: "distressed" }),
      makeCheck({ id: "c2", check_time: hoursAgoISO(1), child_status: "sleeping" }),
    ];
    const result = computeNightMonitoringMetrics(checks, []);
    expect(result.by_child_status).toEqual({ distressed: 1, sleeping: 1 });
  });

  it("by_check_type includes all checks regardless of age", () => {
    const checks = [
      makeCheck({ id: "c1", check_time: daysAgoISO(30), check_type: "medical_check" }),
      makeCheck({ id: "c2", check_time: hoursAgoISO(1), check_type: "routine_sleep" }),
    ];
    const result = computeNightMonitoringMetrics(checks, []);
    expect(result.by_check_type).toEqual({ medical_check: 1, routine_sleep: 1 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// identifyNightMonitoringAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyNightMonitoringAlerts", () => {
  it("returns empty array for empty inputs", () => {
    const alerts = identifyNightMonitoringAlerts([], [], 3);
    expect(alerts).toHaveLength(0);
  });

  // ── child_not_checked alerts ──────────────────────────────────────────

  describe("child not checked alerts", () => {
    it("generates critical alert when child not checked for 2+ hours", () => {
      const checks = [
        makeCheck({ id: "c1", child_id: "child-1", check_time: hoursAgoISO(3) }),
      ];
      const alerts = identifyNightMonitoringAlerts(checks, [], 3);
      const notChecked = alerts.filter((a) => a.type === "child_not_checked");
      expect(notChecked).toHaveLength(1);
      expect(notChecked[0].severity).toBe("critical");
      expect(notChecked[0].id).toBe("child-1");
    });

    it("does not flag child checked within 2 hours", () => {
      const checks = [
        makeCheck({ id: "c1", child_id: "child-1", check_time: hoursAgoISO(1) }),
      ];
      const alerts = identifyNightMonitoringAlerts(checks, [], 3);
      const notChecked = alerts.filter((a) => a.type === "child_not_checked");
      expect(notChecked).toHaveLength(0);
    });

    it("uses the most recent check per child", () => {
      const checks = [
        makeCheck({ id: "c1", child_id: "child-1", check_time: hoursAgoISO(5) }),
        makeCheck({ id: "c2", child_id: "child-1", check_time: hoursAgoISO(1) }),
      ];
      const alerts = identifyNightMonitoringAlerts(checks, [], 3);
      const notChecked = alerts.filter((a) => a.type === "child_not_checked");
      expect(notChecked).toHaveLength(0);
    });

    it("flags multiple children individually", () => {
      const checks = [
        makeCheck({ id: "c1", child_id: "child-1", check_time: hoursAgoISO(4) }),
        makeCheck({ id: "c2", child_id: "child-2", check_time: hoursAgoISO(5) }),
      ];
      const alerts = identifyNightMonitoringAlerts(checks, [], 3);
      const notChecked = alerts.filter((a) => a.type === "child_not_checked");
      expect(notChecked).toHaveLength(2);
      const ids = notChecked.map((a) => a.id);
      expect(ids).toContain("child-1");
      expect(ids).toContain("child-2");
    });

    it("only flags children whose latest check is overdue", () => {
      const checks = [
        makeCheck({ id: "c1", child_id: "child-1", check_time: hoursAgoISO(4) }),
        makeCheck({ id: "c2", child_id: "child-2", check_time: hoursAgoISO(1) }),
      ];
      const alerts = identifyNightMonitoringAlerts(checks, [], 3);
      const notChecked = alerts.filter((a) => a.type === "child_not_checked");
      expect(notChecked).toHaveLength(1);
      expect(notChecked[0].id).toBe("child-1");
    });

    it("includes hours elapsed in message", () => {
      const checks = [
        makeCheck({ id: "c1", child_id: "child-1", check_time: hoursAgoISO(5) }),
      ];
      const alerts = identifyNightMonitoringAlerts(checks, [], 3);
      const notChecked = alerts.find((a) => a.type === "child_not_checked");
      expect(notChecked?.message).toContain("hours");
    });

    it("mentions Reg 12 in message", () => {
      const checks = [
        makeCheck({ id: "c1", child_id: "child-1", check_time: hoursAgoISO(5) }),
      ];
      const alerts = identifyNightMonitoringAlerts(checks, [], 3);
      const notChecked = alerts.find((a) => a.type === "child_not_checked");
      expect(notChecked?.message).toContain("Reg 12");
    });
  });

  // ── child_distressed alerts ───────────────────────────────────────────

  describe("child distressed alerts", () => {
    it("generates high alert when child is distressed", () => {
      const checks = [
        makeCheck({ id: "c1", child_status: "distressed", child_name: "Alex Smith", check_type: "welfare_check", check_time: hoursAgoISO(1) }),
      ];
      const alerts = identifyNightMonitoringAlerts(checks, [], 3);
      const distressed = alerts.filter((a) => a.type === "child_distressed");
      expect(distressed).toHaveLength(1);
      expect(distressed[0].severity).toBe("high");
      expect(distressed[0].id).toBe("c1");
    });

    it("does not flag non-distressed statuses", () => {
      const checks = [
        makeCheck({ id: "c1", child_status: "sleeping" }),
        makeCheck({ id: "c2", child_status: "awake_settled" }),
        makeCheck({ id: "c3", child_status: "awake_unsettled" }),
        makeCheck({ id: "c4", child_status: "not_in_room" }),
        makeCheck({ id: "c5", child_status: "medical_attention" }),
      ];
      const alerts = identifyNightMonitoringAlerts(checks, [], 3);
      const distressed = alerts.filter((a) => a.type === "child_distressed");
      expect(distressed).toHaveLength(0);
    });

    it("flags multiple distressed checks", () => {
      const checks = [
        makeCheck({ id: "c1", child_status: "distressed", child_name: "Alex Smith" }),
        makeCheck({ id: "c2", child_status: "distressed", child_name: "Beth Jones" }),
      ];
      const alerts = identifyNightMonitoringAlerts(checks, [], 3);
      const distressed = alerts.filter((a) => a.type === "child_distressed");
      expect(distressed).toHaveLength(2);
    });

    it("includes child name in distressed alert message", () => {
      const checks = [
        makeCheck({ id: "c1", child_status: "distressed", child_name: "Alex Smith" }),
      ];
      const alerts = identifyNightMonitoringAlerts(checks, [], 3);
      const distressed = alerts.find((a) => a.type === "child_distressed");
      expect(distressed?.message).toContain("Alex Smith");
    });

    it("includes check type in distressed alert message", () => {
      const checks = [
        makeCheck({ id: "c1", child_status: "distressed", check_type: "welfare_check" }),
      ];
      const alerts = identifyNightMonitoringAlerts(checks, [], 3);
      const distressed = alerts.find((a) => a.type === "child_distressed");
      expect(distressed?.message).toContain("welfare check");
    });
  });

  // ── shift_no_checks alerts ────────────────────────────────────────────

  describe("shift no checks alerts", () => {
    it("generates critical alert for completed shift with no checks", () => {
      const logs = [
        makeLog({ id: "l1", total_checks_completed: 0, status: "completed" }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const noChecks = alerts.filter((a) => a.type === "shift_no_checks");
      expect(noChecks).toHaveLength(1);
      expect(noChecks[0].severity).toBe("critical");
      expect(noChecks[0].id).toBe("l1");
    });

    it("generates critical alert for reviewed shift with no checks", () => {
      const logs = [
        makeLog({ id: "l1", total_checks_completed: 0, status: "reviewed" }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const noChecks = alerts.filter((a) => a.type === "shift_no_checks");
      expect(noChecks).toHaveLength(1);
      expect(noChecks[0].severity).toBe("critical");
    });

    it("does not flag completed shift with checks", () => {
      const logs = [
        makeLog({ id: "l1", total_checks_completed: 5, status: "completed" }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const noChecks = alerts.filter((a) => a.type === "shift_no_checks");
      expect(noChecks).toHaveLength(0);
    });

    it("generates critical alert for in-progress shift with no checks after 2+ hours", () => {
      const logs = [
        makeLog({ id: "l1", total_checks_completed: 0, status: "in_progress", shift_start: hoursAgoISO(3) }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const noChecks = alerts.filter((a) => a.type === "shift_no_checks");
      expect(noChecks).toHaveLength(1);
      expect(noChecks[0].severity).toBe("critical");
    });

    it("does not flag in-progress shift with no checks within first 2 hours", () => {
      const logs = [
        makeLog({ id: "l1", total_checks_completed: 0, status: "in_progress", shift_start: hoursAgoISO(1) }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const noChecks = alerts.filter((a) => a.type === "shift_no_checks");
      expect(noChecks).toHaveLength(0);
    });

    it("mentions Reg 12 in shift no checks message for completed shifts", () => {
      const logs = [
        makeLog({ id: "l1", total_checks_completed: 0, status: "completed", shift_date: "2026-05-10" }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const noChecks = alerts.find((a) => a.type === "shift_no_checks");
      expect(noChecks?.message).toContain("Reg 12");
    });

    it("mentions Reg 12 in shift no checks message for in-progress shifts", () => {
      const logs = [
        makeLog({ id: "l1", total_checks_completed: 0, status: "in_progress", shift_start: hoursAgoISO(4) }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const noChecks = alerts.find((a) => a.type === "shift_no_checks");
      expect(noChecks?.message).toContain("Reg 12");
    });
  });

  // ── premises_not_secured alerts ───────────────────────────────────────

  describe("premises not secured alerts", () => {
    it("generates critical alert when premises not secured", () => {
      const logs = [
        makeLog({ id: "l1", premises_secure: false }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const notSecured = alerts.filter((a) => a.type === "premises_not_secured");
      expect(notSecured).toHaveLength(1);
      expect(notSecured[0].severity).toBe("critical");
      expect(notSecured[0].id).toBe("l1");
    });

    it("does not flag when premises are secured", () => {
      const logs = [
        makeLog({ id: "l1", premises_secure: true }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const notSecured = alerts.filter((a) => a.type === "premises_not_secured");
      expect(notSecured).toHaveLength(0);
    });

    it("flags multiple logs with unsecured premises", () => {
      const logs = [
        makeLog({ id: "l1", premises_secure: false }),
        makeLog({ id: "l2", premises_secure: false }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const notSecured = alerts.filter((a) => a.type === "premises_not_secured");
      expect(notSecured).toHaveLength(2);
    });

    it("mentions Reg 25 in premises not secured message", () => {
      const logs = [
        makeLog({ id: "l1", premises_secure: false }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const notSecured = alerts.find((a) => a.type === "premises_not_secured");
      expect(notSecured?.message).toContain("Reg 25");
    });
  });

  // ── fire_panel_not_checked alerts ─────────────────────────────────────

  describe("fire panel not checked alerts", () => {
    it("generates high alert when fire panel not checked", () => {
      const logs = [
        makeLog({ id: "l1", fire_panel_checked: false }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const firePanel = alerts.filter((a) => a.type === "fire_panel_not_checked");
      expect(firePanel).toHaveLength(1);
      expect(firePanel[0].severity).toBe("high");
      expect(firePanel[0].id).toBe("l1");
    });

    it("does not flag when fire panel is checked", () => {
      const logs = [
        makeLog({ id: "l1", fire_panel_checked: true }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const firePanel = alerts.filter((a) => a.type === "fire_panel_not_checked");
      expect(firePanel).toHaveLength(0);
    });

    it("flags multiple logs with unchecked fire panel", () => {
      const logs = [
        makeLog({ id: "l1", fire_panel_checked: false }),
        makeLog({ id: "l2", fire_panel_checked: false }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const firePanel = alerts.filter((a) => a.type === "fire_panel_not_checked");
      expect(firePanel).toHaveLength(2);
    });

    it("includes fire safety in message", () => {
      const logs = [
        makeLog({ id: "l1", fire_panel_checked: false }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const firePanel = alerts.find((a) => a.type === "fire_panel_not_checked");
      expect(firePanel?.message).toContain("fire");
    });
  });

  // ── handover_not_received alerts ──────────────────────────────────────

  describe("handover not received alerts", () => {
    it("generates high alert when handover not received", () => {
      const logs = [
        makeLog({ id: "l1", handover_received: false }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const noHandover = alerts.filter((a) => a.type === "handover_not_received");
      expect(noHandover).toHaveLength(1);
      expect(noHandover[0].severity).toBe("high");
      expect(noHandover[0].id).toBe("l1");
    });

    it("does not flag when handover is received", () => {
      const logs = [
        makeLog({ id: "l1", handover_received: true }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const noHandover = alerts.filter((a) => a.type === "handover_not_received");
      expect(noHandover).toHaveLength(0);
    });

    it("flags multiple logs without handover received", () => {
      const logs = [
        makeLog({ id: "l1", handover_received: false }),
        makeLog({ id: "l2", handover_received: false }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const noHandover = alerts.filter((a) => a.type === "handover_not_received");
      expect(noHandover).toHaveLength(2);
    });

    it("includes continuity of care in message", () => {
      const logs = [
        makeLog({ id: "l1", handover_received: false }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const noHandover = alerts.find((a) => a.type === "handover_not_received");
      expect(noHandover?.message).toContain("continuity of care");
    });
  });

  // ── log_not_completed alerts ──────────────────────────────────────────

  describe("log not completed alerts", () => {
    it("generates high alert for in-progress log with shift_end set", () => {
      const logs = [
        makeLog({ id: "l1", status: "in_progress", shift_end: hoursAgoISO(2) }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const notCompleted = alerts.filter((a) => a.type === "log_not_completed");
      expect(notCompleted).toHaveLength(1);
      expect(notCompleted[0].severity).toBe("high");
      expect(notCompleted[0].id).toBe("l1");
    });

    it("does not flag in-progress log without shift_end", () => {
      const logs = [
        makeLog({ id: "l1", status: "in_progress", shift_end: null }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const notCompleted = alerts.filter((a) => a.type === "log_not_completed");
      expect(notCompleted).toHaveLength(0);
    });

    it("does not flag completed log with shift_end", () => {
      const logs = [
        makeLog({ id: "l1", status: "completed", shift_end: hoursAgoISO(2) }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const notCompleted = alerts.filter((a) => a.type === "log_not_completed");
      expect(notCompleted).toHaveLength(0);
    });

    it("does not flag reviewed log with shift_end", () => {
      const logs = [
        makeLog({ id: "l1", status: "reviewed", shift_end: hoursAgoISO(2) }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const notCompleted = alerts.filter((a) => a.type === "log_not_completed");
      expect(notCompleted).toHaveLength(0);
    });

    it("includes overnight summary required in message", () => {
      const logs = [
        makeLog({ id: "l1", status: "in_progress", shift_end: hoursAgoISO(2) }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const notCompleted = alerts.find((a) => a.type === "log_not_completed");
      expect(notCompleted?.message).toContain("overnight summary required");
    });
  });

  // ── unreviewed_log alerts ─────────────────────────────────────────────

  describe("unreviewed log alerts", () => {
    it("generates medium alert for completed log not reviewed in 48+ hours", () => {
      const logs = [
        makeLog({ id: "l1", status: "completed", updated_at: daysAgoISO(3) }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const unreviewed = alerts.filter((a) => a.type === "unreviewed_log");
      expect(unreviewed).toHaveLength(1);
      expect(unreviewed[0].severity).toBe("medium");
      expect(unreviewed[0].id).toBe("l1");
    });

    it("does not flag completed log within 48 hours", () => {
      const logs = [
        makeLog({ id: "l1", status: "completed", updated_at: hoursAgoISO(24) }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const unreviewed = alerts.filter((a) => a.type === "unreviewed_log");
      expect(unreviewed).toHaveLength(0);
    });

    it("does not flag reviewed log even if old", () => {
      const logs = [
        makeLog({ id: "l1", status: "reviewed", updated_at: daysAgoISO(10) }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const unreviewed = alerts.filter((a) => a.type === "unreviewed_log");
      expect(unreviewed).toHaveLength(0);
    });

    it("does not flag in-progress log even if old", () => {
      const logs = [
        makeLog({ id: "l1", status: "in_progress", updated_at: daysAgoISO(5) }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const unreviewed = alerts.filter((a) => a.type === "unreviewed_log");
      expect(unreviewed).toHaveLength(0);
    });

    it("includes hours elapsed in message", () => {
      const logs = [
        makeLog({ id: "l1", status: "completed", updated_at: daysAgoISO(4) }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const unreviewed = alerts.find((a) => a.type === "unreviewed_log");
      expect(unreviewed?.message).toContain("hours");
    });

    it("mentions management review in message", () => {
      const logs = [
        makeLog({ id: "l1", status: "completed", updated_at: daysAgoISO(3) }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const unreviewed = alerts.find((a) => a.type === "unreviewed_log");
      expect(unreviewed?.message).toContain("management review");
    });
  });

  // ── high_disturbance_count alerts ─────────────────────────────────────

  describe("high disturbance count alerts", () => {
    it("generates medium alert when disturbances > 3", () => {
      const logs = [
        makeLog({ id: "l1", disturbances_count: 4 }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const highDist = alerts.filter((a) => a.type === "high_disturbance_count");
      expect(highDist).toHaveLength(1);
      expect(highDist[0].severity).toBe("medium");
      expect(highDist[0].id).toBe("l1");
    });

    it("does not flag when disturbances is exactly 3", () => {
      const logs = [
        makeLog({ id: "l1", disturbances_count: 3 }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const highDist = alerts.filter((a) => a.type === "high_disturbance_count");
      expect(highDist).toHaveLength(0);
    });

    it("does not flag when disturbances is 0", () => {
      const logs = [
        makeLog({ id: "l1", disturbances_count: 0 }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const highDist = alerts.filter((a) => a.type === "high_disturbance_count");
      expect(highDist).toHaveLength(0);
    });

    it("flags multiple logs with high disturbances", () => {
      const logs = [
        makeLog({ id: "l1", disturbances_count: 5 }),
        makeLog({ id: "l2", disturbances_count: 7 }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const highDist = alerts.filter((a) => a.type === "high_disturbance_count");
      expect(highDist).toHaveLength(2);
    });

    it("includes disturbance count in message", () => {
      const logs = [
        makeLog({ id: "l1", disturbances_count: 6 }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const highDist = alerts.find((a) => a.type === "high_disturbance_count");
      expect(highDist?.message).toContain("6");
    });

    it("mentions pattern review in message", () => {
      const logs = [
        makeLog({ id: "l1", disturbances_count: 5 }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const highDist = alerts.find((a) => a.type === "high_disturbance_count");
      expect(highDist?.message).toContain("pattern review");
    });
  });

  // ── Combined / complex scenarios ──────────────────────────────────────

  describe("combined alert scenarios", () => {
    it("generates multiple alert types from a single problematic log", () => {
      const logs = [
        makeLog({
          id: "l1",
          total_checks_completed: 0,
          status: "completed",
          premises_secure: false,
          fire_panel_checked: false,
          handover_received: false,
          disturbances_count: 5,
          updated_at: daysAgoISO(3),
        }),
      ];
      const alerts = identifyNightMonitoringAlerts([], logs, 3);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("shift_no_checks");
      expect(types).toContain("premises_not_secured");
      expect(types).toContain("fire_panel_not_checked");
      expect(types).toContain("handover_not_received");
      expect(types).toContain("high_disturbance_count");
      expect(types).toContain("unreviewed_log");
    });

    it("generates both check-level and log-level alerts simultaneously", () => {
      const checks = [
        makeCheck({ id: "c1", child_id: "child-1", child_status: "distressed", check_time: hoursAgoISO(4) }),
      ];
      const logs = [
        makeLog({ id: "l1", premises_secure: false, fire_panel_checked: false }),
      ];
      const alerts = identifyNightMonitoringAlerts(checks, logs, 3);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("child_not_checked");
      expect(types).toContain("child_distressed");
      expect(types).toContain("premises_not_secured");
      expect(types).toContain("fire_panel_not_checked");
    });

    it("returns no alerts for fully compliant state", () => {
      const checks = [
        makeCheck({ id: "c1", child_id: "child-1", check_time: hoursAgoISO(1), child_status: "sleeping" }),
        makeCheck({ id: "c2", child_id: "child-2", check_time: hoursAgoISO(1), child_status: "sleeping" }),
      ];
      const logs = [
        makeLog({
          id: "l1",
          total_checks_completed: 6,
          status: "reviewed",
          premises_secure: true,
          fire_panel_checked: true,
          handover_received: true,
          handover_given: true,
          all_children_checked: true,
          disturbances_count: 1,
          shift_end: hoursAgoISO(1),
        }),
      ];
      const alerts = identifyNightMonitoringAlerts(checks, logs, 2);
      expect(alerts).toHaveLength(0);
    });

    it("handles large mixed dataset correctly", () => {
      const checks = [
        makeCheck({ id: "c1", child_id: "child-1", child_status: "distressed", check_time: hoursAgoISO(4) }),
        makeCheck({ id: "c2", child_id: "child-2", child_status: "sleeping", check_time: hoursAgoISO(1) }),
        makeCheck({ id: "c3", child_id: "child-3", child_status: "sleeping", check_time: hoursAgoISO(3) }),
      ];
      const logs = [
        makeLog({ id: "l1", total_checks_completed: 0, status: "completed", premises_secure: false, fire_panel_checked: false, handover_received: false, disturbances_count: 5, updated_at: daysAgoISO(3) }),
        makeLog({ id: "l2", total_checks_completed: 6, status: "in_progress", premises_secure: true, fire_panel_checked: true, handover_received: true, shift_end: hoursAgoISO(1), disturbances_count: 0 }),
      ];
      const alerts = identifyNightMonitoringAlerts(checks, logs, 3);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("child_not_checked"); // child-1 and child-3
      expect(types).toContain("child_distressed"); // c1
      expect(types).toContain("shift_no_checks"); // l1
      expect(types).toContain("premises_not_secured"); // l1
      expect(types).toContain("fire_panel_not_checked"); // l1
      expect(types).toContain("handover_not_received"); // l1
      expect(types).toContain("high_disturbance_count"); // l1
      expect(types).toContain("unreviewed_log"); // l1
      expect(types).toContain("log_not_completed"); // l2
    });

    it("all alerts have required fields: type, severity, message, id", () => {
      const checks = [
        makeCheck({ id: "c1", child_id: "child-1", child_status: "distressed", check_time: hoursAgoISO(4) }),
      ];
      const logs = [
        makeLog({ id: "l1", total_checks_completed: 0, status: "completed", premises_secure: false, fire_panel_checked: false, handover_received: false, disturbances_count: 5, updated_at: daysAgoISO(3) }),
      ];
      const alerts = identifyNightMonitoringAlerts(checks, logs, 3);
      for (const alert of alerts) {
        expect(alert.type).toBeTruthy();
        expect(alert.severity).toBeTruthy();
        expect(alert.message).toBeTruthy();
        expect(alert.id).toBeTruthy();
      }
    });

    it("all alert severities are valid values", () => {
      const checks = [
        makeCheck({ id: "c1", child_id: "child-1", child_status: "distressed", check_time: hoursAgoISO(4) }),
      ];
      const logs = [
        makeLog({ id: "l1", total_checks_completed: 0, status: "completed", premises_secure: false, fire_panel_checked: false, handover_received: false, disturbances_count: 5, updated_at: daysAgoISO(3) }),
      ];
      const alerts = identifyNightMonitoringAlerts(checks, logs, 3);
      const validSeverities = ["critical", "high", "medium"];
      for (const alert of alerts) {
        expect(validSeverities).toContain(alert.severity);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Night Checks (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listNightChecks", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listNightChecks("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of childId filter", async () => {
    const result = await listNightChecks("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of checkType filter", async () => {
    const result = await listNightChecks("home-1", { checkType: "routine_sleep" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of childStatus filter", async () => {
    const result = await listNightChecks("home-1", { childStatus: "sleeping" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of date filters", async () => {
    const result = await listNightChecks("home-1", {
      dateFrom: "2026-05-01",
      dateTo: "2026-05-10",
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of limit", async () => {
    const result = await listNightChecks("home-1", { limit: 50 });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array with all filters combined", async () => {
    const result = await listNightChecks("home-1", {
      childId: "child-1",
      checkType: "welfare_check",
      childStatus: "distressed",
      dateFrom: "2026-05-01",
      dateTo: "2026-05-10",
      limit: 25,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createNightCheck", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createNightCheck({
      homeId: "home-1",
      childId: "child-1",
      childName: "Alex Smith",
      checkTime: new Date().toISOString(),
      checkedBy: "staff-1",
      checkType: "routine_sleep",
      childStatus: "sleeping",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false even with optional responseAction provided", async () => {
    const result = await createNightCheck({
      homeId: "home-1",
      childId: "child-1",
      childName: "Alex Smith",
      checkTime: new Date().toISOString(),
      checkedBy: "staff-1",
      checkType: "disturbance_response",
      childStatus: "awake_unsettled",
      responseAction: "reassured",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false even with optional notes provided", async () => {
    const result = await createNightCheck({
      homeId: "home-1",
      childId: "child-1",
      childName: "Alex Smith",
      checkTime: new Date().toISOString(),
      checkedBy: "staff-1",
      checkType: "medical_check",
      childStatus: "medical_attention",
      notes: "Administered prescribed medication",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Night Logs (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("listNightLogs", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listNightLogs("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of status filter", async () => {
    const result = await listNightLogs("home-1", { status: "completed" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of date filters", async () => {
    const result = await listNightLogs("home-1", {
      dateFrom: "2026-05-01",
      dateTo: "2026-05-10",
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of limit", async () => {
    const result = await listNightLogs("home-1", { limit: 25 });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array with all filters combined", async () => {
    const result = await listNightLogs("home-1", {
      status: "in_progress",
      dateFrom: "2026-05-01",
      dateTo: "2026-05-10",
      limit: 10,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createNightLog", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createNightLog({
      homeId: "home-1",
      shiftDate: "2026-05-10",
      shiftStart: "2026-05-10T21:00:00Z",
      staffOnDuty: [{ name: "Jane Doe", role: "Night Worker" }],
      leadStaff: "Jane Doe",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false even with all optional fields provided", async () => {
    const result = await createNightLog({
      homeId: "home-1",
      shiftDate: "2026-05-10",
      shiftStart: "2026-05-10T21:00:00Z",
      shiftEnd: "2026-05-11T07:00:00Z",
      staffOnDuty: [
        { name: "Jane Doe", role: "Night Worker" },
        { name: "John Smith", role: "Support Worker" },
      ],
      leadStaff: "Jane Doe",
      handoverReceived: true,
      handoverNotes: "All children settled",
      totalChecksCompleted: 8,
      allChildrenChecked: true,
      incidentsCount: 0,
      disturbancesCount: 1,
      premisesSecure: true,
      firePanelChecked: true,
      overnightSummary: "Quiet night overall",
      handoverGiven: true,
      handoverGivenNotes: "No concerns",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with minimal required fields only", async () => {
    const result = await createNightLog({
      homeId: "home-1",
      shiftDate: "2026-05-10",
      shiftStart: "2026-05-10T21:00:00Z",
      staffOnDuty: [],
      leadStaff: "Jane Doe",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

describe("updateNightLog", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await updateNightLog("log-1", { status: "completed" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false when updating multiple fields", async () => {
    const result = await updateNightLog("log-1", {
      status: "reviewed",
      reviewed_by: "manager-1",
      reviewed_date: new Date().toISOString(),
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false when updating shift_end", async () => {
    const result = await updateNightLog("log-1", {
      shift_end: "2026-05-11T07:00:00Z",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false when updating overnight summary", async () => {
    const result = await updateNightLog("log-1", {
      overnight_summary: "Quiet night, one disturbance at 2am.",
      handover_given: true,
      handover_given_notes: "One disturbance noted",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});
