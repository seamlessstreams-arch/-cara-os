import { describe, it, expect } from "vitest";
import {
  computeBurnoutMetrics,
  identifyBurnoutAlerts,
} from "./staff-burnout-indicator-service";
import type { StaffBurnoutIndicatorRecord } from "./staff-burnout-indicator-service";

// -- Factory -------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffBurnoutIndicatorRecord> = {}): StaffBurnoutIndicatorRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    staff_name: "Sarah Green",
    staff_id: "staff-1",
    indicator_type: "emotional_exhaustion",
    burnout_severity: "early_sign",
    support_status: "monitoring",
    impact_level: "minimal",
    session_date: "2026-05-15",
    observed_by: "Manager",
    description: "Showing early signs of fatigue",
    evidence_summary: "Observation during shift",
    possible_causes: null,
    support_offered_detail: null,
    staff_response: null,
    staff_aware: true,
    manager_aware: true,
    support_offered: true,
    wellbeing_check_done: true,
    supervision_adjusted: true,
    workload_reviewed: true,
    leave_offered: false,
    occupational_health_referred: false,
    peer_support_arranged: true,
    care_plan_reflects: true,
    team_informed: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-15T00:00:00Z",
    updated_at: "2026-05-15T00:00:00Z",
    ...overrides,
  };
}

// -- computeBurnoutMetrics -----------------------------------------------------

describe("computeBurnoutMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeBurnoutMetrics([]);
    expect(m.total_indicators).toBe(0);
    expect(m.critical_count).toBe(0);
    expect(m.concerning_count).toBe(0);
    expect(m.unresolved_count).toBe(0);
    expect(m.escalated_count).toBe(0);
    expect(m.staff_aware_rate).toBeNull();;
    expect(m.manager_aware_rate).toBeNull();;
    expect(m.support_offered_rate).toBeNull();;
    expect(m.wellbeing_check_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts critical and concerning correctly", () => {
    const records = [
      makeRecord({ id: "1", burnout_severity: "critical" }),
      makeRecord({ id: "2", burnout_severity: "concerning" }),
      makeRecord({ id: "3", burnout_severity: "developing" }),
    ];
    const m = computeBurnoutMetrics(records);
    expect(m.critical_count).toBe(1);
    // concerning_count includes both concerning AND critical
    expect(m.concerning_count).toBe(2);
  });

  it("counts unresolved (monitoring + supporting + escalated)", () => {
    const records = [
      makeRecord({ id: "1", support_status: "monitoring" }),
      makeRecord({ id: "2", support_status: "supporting" }),
      makeRecord({ id: "3", support_status: "escalated" }),
      makeRecord({ id: "4", support_status: "resolved" }),
      makeRecord({ id: "5", support_status: "improving" }),
    ];
    const m = computeBurnoutMetrics(records);
    expect(m.unresolved_count).toBe(3);
    expect(m.escalated_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", staff_aware: true, wellbeing_check_done: true }),
      makeRecord({ id: "2", staff_aware: false, wellbeing_check_done: false }),
    ];
    const m = computeBurnoutMetrics(records);
    expect(m.staff_aware_rate).toBe(50);
    expect(m.wellbeing_check_rate).toBe(50);
  });

  it("builds breakdown records", () => {
    const records = [
      makeRecord({ id: "1", indicator_type: "emotional_exhaustion", impact_level: "high" }),
      makeRecord({ id: "2", indicator_type: "emotional_exhaustion", impact_level: "low" }),
      makeRecord({ id: "3", indicator_type: "cynicism", impact_level: "high" }),
    ];
    const m = computeBurnoutMetrics(records);
    expect(m.by_indicator_type).toEqual({ emotional_exhaustion: 2, cynicism: 1 });
    expect(m.by_impact_level).toEqual({ high: 2, low: 1 });
  });
});

// -- identifyBurnoutAlerts -----------------------------------------------------

describe("identifyBurnoutAlerts", () => {
  it("returns empty array for empty records", () => {
    expect(identifyBurnoutAlerts([])).toEqual([]);
  });

  it("fires critical alert for critical severity with only monitoring", () => {
    const records = [makeRecord({ burnout_severity: "critical", support_status: "monitoring" })];
    const alerts = identifyBurnoutAlerts(records);
    const match = alerts.find((a) => a.type === "critical_unsupported");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("does NOT fire critical_unsupported when support_status is supporting", () => {
    const records = [makeRecord({ burnout_severity: "critical", support_status: "supporting" })];
    const alerts = identifyBurnoutAlerts(records);
    const match = alerts.find((a) => a.type === "critical_unsupported");
    expect(match).toBeUndefined();
  });

  it("fires high alert for staff_not_aware (threshold >= 1)", () => {
    const records = [makeRecord({ staff_aware: false })];
    const alerts = identifyBurnoutAlerts(records);
    const match = alerts.find((a) => a.type === "staff_not_aware");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for no_wellbeing_check (threshold >= 1)", () => {
    const records = [makeRecord({ wellbeing_check_done: false })];
    const alerts = identifyBurnoutAlerts(records);
    const match = alerts.find((a) => a.type === "no_wellbeing_check");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for no_workload_review (threshold >= 2)", () => {
    const records = [
      makeRecord({ id: "1", workload_reviewed: false }),
      makeRecord({ id: "2", workload_reviewed: false }),
    ];
    const alerts = identifyBurnoutAlerts(records);
    const match = alerts.find((a) => a.type === "no_workload_review");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("does NOT fire no_workload_review with only 1 record", () => {
    const records = [makeRecord({ workload_reviewed: false })];
    const alerts = identifyBurnoutAlerts(records);
    const match = alerts.find((a) => a.type === "no_workload_review");
    expect(match).toBeUndefined();
  });

  it("fires medium alert for no_peer_support (threshold >= 2)", () => {
    const records = [
      makeRecord({ id: "1", peer_support_arranged: false }),
      makeRecord({ id: "2", peer_support_arranged: false }),
    ];
    const alerts = identifyBurnoutAlerts(records);
    const match = alerts.find((a) => a.type === "no_peer_support");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});
