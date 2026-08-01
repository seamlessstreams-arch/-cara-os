import { describe, it, expect } from "vitest";
import {
  computeStaffShiftPatternMetrics,
  identifyStaffShiftPatternAlerts,
} from "./staff-shift-pattern-monitoring-service";
import type { StaffShiftPatternMonitoringRecord } from "./staff-shift-pattern-monitoring-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffShiftPatternMonitoringRecord> = {}): StaffShiftPatternMonitoringRecord {
  return {
    id: "sp-1",
    home_id: "home-1",
    shift_type: "morning",
    fatigue_risk: "low",
    staffing_level: "fully_staffed",
    shift_compliance: "fully_compliant",
    shift_date: "2026-05-01",
    staff_name: "Tom Green",
    shift_supervisor: "Supervisor A",
    rest_period_compliant: true,
    working_time_directive_met: true,
    lone_working_risk_assessed: true,
    handover_completed: true,
    break_taken: true,
    training_current: true,
    dbs_current: true,
    first_aid_current: true,
    medication_trained: true,
    supervision_up_to_date: true,
    wellbeing_checked: true,
    recorded_promptly: true,
    shift_duration_hours: 8,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeStaffShiftPatternMetrics ------------------------------------------

describe("computeStaffShiftPatternMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeStaffShiftPatternMetrics([]);
    expect(m.total_shifts).toBe(0);
    expect(m.high_fatigue_count).toBe(0);
    expect(m.critical_fatigue_count).toBe(0);
    expect(m.understaffed_count).toBe(0);
    expect(m.critically_understaffed_count).toBe(0);
    expect(m.rest_period_rate).toBeNull();;
    expect(m.average_shift_duration).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts fatigue risk levels", () => {
    const records = [
      makeRecord({ id: "1", fatigue_risk: "high" }),
      makeRecord({ id: "2", fatigue_risk: "critical" }),
      makeRecord({ id: "3", fatigue_risk: "low" }),
    ];
    const m = computeStaffShiftPatternMetrics(records);
    expect(m.high_fatigue_count).toBe(1);
    expect(m.critical_fatigue_count).toBe(1);
  });

  it("counts staffing levels", () => {
    const records = [
      makeRecord({ id: "1", staffing_level: "understaffed" }),
      makeRecord({ id: "2", staffing_level: "critically_understaffed" }),
      makeRecord({ id: "3", staffing_level: "fully_staffed" }),
    ];
    const m = computeStaffShiftPatternMetrics(records);
    expect(m.understaffed_count).toBe(1);
    expect(m.critically_understaffed_count).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", rest_period_compliant: true, working_time_directive_met: false }),
      makeRecord({ id: "2", rest_period_compliant: false, working_time_directive_met: false }),
    ];
    const m = computeStaffShiftPatternMetrics(records);
    expect(m.rest_period_rate).toBe(50);
    expect(m.working_time_rate).toBe(0);
  });

  it("computes average shift duration", () => {
    const records = [
      makeRecord({ id: "1", shift_duration_hours: 8 }),
      makeRecord({ id: "2", shift_duration_hours: 12 }),
    ];
    const m = computeStaffShiftPatternMetrics(records);
    expect(m.average_shift_duration).toBe(10);
  });

  it("builds breakdown records", () => {
    const records = [
      makeRecord({ id: "1", shift_type: "morning", fatigue_risk: "low", staffing_level: "fully_staffed", shift_compliance: "fully_compliant" }),
      makeRecord({ id: "2", shift_type: "night", fatigue_risk: "high", staffing_level: "understaffed", shift_compliance: "non_compliant" }),
    ];
    const m = computeStaffShiftPatternMetrics(records);
    expect(m.by_shift_type).toEqual({ morning: 1, night: 1 });
    expect(m.by_fatigue_risk).toEqual({ low: 1, high: 1 });
    expect(m.by_staffing_level).toEqual({ fully_staffed: 1, understaffed: 1 });
    expect(m.by_shift_compliance).toEqual({ fully_compliant: 1, non_compliant: 1 });
  });
});

// -- identifyStaffShiftPatternAlerts ------------------------------------------

describe("identifyStaffShiftPatternAlerts", () => {
  it("returns empty array for empty records", () => {
    expect(identifyStaffShiftPatternAlerts([])).toEqual([]);
  });

  it("fires critical alert for critical fatigue without rest period compliance", () => {
    const records = [makeRecord({ fatigue_risk: "critical", rest_period_compliant: false })];
    const alerts = identifyStaffShiftPatternAlerts(records);
    const critical = alerts.filter((a) => a.type === "critical_fatigue_no_rest");
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("does NOT fire critical fatigue alert when rest period is compliant", () => {
    const records = [makeRecord({ fatigue_risk: "critical", rest_period_compliant: true })];
    const alerts = identifyStaffShiftPatternAlerts(records);
    expect(alerts.filter((a) => a.type === "critical_fatigue_no_rest")).toHaveLength(0);
  });

  it("fires high alert for critically understaffed (>= 1)", () => {
    const records = [makeRecord({ staffing_level: "critically_understaffed" })];
    const alerts = identifyStaffShiftPatternAlerts(records);
    expect(alerts.some((a) => a.type === "critically_understaffed" && a.severity === "high")).toBe(true);
  });

  it("fires high alert for working time directive breached (>= 1)", () => {
    const records = [makeRecord({ working_time_directive_met: false })];
    const alerts = identifyStaffShiftPatternAlerts(records);
    expect(alerts.some((a) => a.type === "working_time_breached" && a.severity === "high")).toBe(true);
  });

  it("fires medium alert for lone working not assessed (>= 2)", () => {
    const records = [
      makeRecord({ id: "1", lone_working_risk_assessed: false }),
      makeRecord({ id: "2", lone_working_risk_assessed: false }),
    ];
    const alerts = identifyStaffShiftPatternAlerts(records);
    expect(alerts.some((a) => a.type === "lone_working_not_assessed" && a.severity === "medium")).toBe(true);
  });

  it("does NOT fire lone working alert at 1 record", () => {
    const records = [makeRecord({ lone_working_risk_assessed: false })];
    const alerts = identifyStaffShiftPatternAlerts(records);
    expect(alerts.some((a) => a.type === "lone_working_not_assessed")).toBe(false);
  });

  it("fires medium alert for handover not completed (>= 2)", () => {
    const records = [
      makeRecord({ id: "1", handover_completed: false }),
      makeRecord({ id: "2", handover_completed: false }),
    ];
    const alerts = identifyStaffShiftPatternAlerts(records);
    expect(alerts.some((a) => a.type === "handover_not_completed" && a.severity === "medium")).toBe(true);
  });
});
