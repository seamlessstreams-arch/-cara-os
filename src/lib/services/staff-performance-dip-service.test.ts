import { describe, it, expect } from "vitest";
import {
  computePerformanceDipMetrics,
  identifyPerformanceDipAlerts,
} from "./staff-performance-dip-service";
import type { StaffPerformanceDipRecord } from "./staff-performance-dip-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<StaffPerformanceDipRecord> = {}): StaffPerformanceDipRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    staff_name: "Alice Smith",
    staff_id: null,
    dip_category: "recording_quality",
    dip_severity: "possible_dip",
    dip_status: "resolved",
    frequency_pattern: "one_off",
    session_date: "2026-04-01",
    identified_by: "Manager A",
    description: "Slight dip in recording detail",
    evidence_summary: "Daily logs show less detail this week",
    possible_triggers: null,
    support_offered_detail: null,
    manager_response: null,
    staff_response: null,
    evidence_documented: true,
    manager_aware: true,
    staff_informed: true,
    support_offered: true,
    triggers_explored: true,
    supervision_discussed: true,
    training_considered: true,
    wellbeing_assessed: true,
    action_plan_created: true,
    staff_responded: true,
    follow_up_scheduled: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computePerformanceDipMetrics ---------------------------------------------

describe("computePerformanceDipMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computePerformanceDipMetrics([]);
    expect(m.total_dips).toBe(0);
    expect(m.manager_review_count).toBe(0);
    expect(m.support_recommended_count).toBe(0);
    expect(m.unresolved_count).toBe(0);
    expect(m.escalated_count).toBe(0);
    expect(m.evidence_documented_rate).toBeNull();;
    expect(m.unique_staff).toBe(0);
  });

  it("counts severity and status categories correctly", () => {
    const records = [
      makeRecord({ id: "1", dip_severity: "manager_review_required", dip_status: "identified" }),
      makeRecord({ id: "2", dip_severity: "support_recommended", dip_status: "exploring" }),
      makeRecord({ id: "3", dip_severity: "possible_dip", dip_status: "supporting" }),
      makeRecord({ id: "4", dip_severity: "pattern_emerging", dip_status: "escalated" }),
      makeRecord({ id: "5", dip_severity: "needs_exploration", dip_status: "resolved" }),
    ];
    const m = computePerformanceDipMetrics(records);
    expect(m.total_dips).toBe(5);
    expect(m.manager_review_count).toBe(1);
    expect(m.support_recommended_count).toBe(1);
    expect(m.unresolved_count).toBe(3); // identified + exploring + supporting
    expect(m.escalated_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", evidence_documented: true, staff_informed: true }),
      makeRecord({ id: "2", evidence_documented: false, staff_informed: false }),
    ];
    const m = computePerformanceDipMetrics(records);
    expect(m.evidence_documented_rate).toBe(50);
    expect(m.staff_informed_rate).toBe(50);
  });

  it("counts unique staff", () => {
    const records = [
      makeRecord({ id: "1", staff_name: "Alice" }),
      makeRecord({ id: "2", staff_name: "Bob" }),
      makeRecord({ id: "3", staff_name: "Alice" }),
    ];
    const m = computePerformanceDipMetrics(records);
    expect(m.unique_staff).toBe(2);
  });

  it("builds breakdown maps", () => {
    const records = [
      makeRecord({ id: "1", dip_category: "recording_quality", frequency_pattern: "recurring" }),
      makeRecord({ id: "2", dip_category: "recording_quality", frequency_pattern: "one_off" }),
      makeRecord({ id: "3", dip_category: "timeliness", frequency_pattern: "recurring" }),
    ];
    const m = computePerformanceDipMetrics(records);
    expect(m.by_dip_category).toEqual({ recording_quality: 2, timeliness: 1 });
    expect(m.by_frequency_pattern).toEqual({ recurring: 2, one_off: 1 });
  });

  it("returns 100% rates when all booleans true", () => {
    const records = [makeRecord(), makeRecord({ id: "2" })];
    const m = computePerformanceDipMetrics(records);
    expect(m.manager_aware_rate).toBe(100);
    expect(m.support_offered_rate).toBe(100);
    expect(m.triggers_explored_rate).toBe(100);
    expect(m.supervision_discussed_rate).toBe(100);
    expect(m.training_considered_rate).toBe(100);
    expect(m.wellbeing_assessed_rate).toBe(100);
    expect(m.action_plan_rate).toBe(100);
    expect(m.staff_responded_rate).toBe(100);
    expect(m.follow_up_scheduled_rate).toBe(100);
    expect(m.recorded_promptly_rate).toBe(100);
  });
});

// -- identifyPerformanceDipAlerts ---------------------------------------------

describe("identifyPerformanceDipAlerts", () => {
  it("returns no alerts for empty array", () => {
    expect(identifyPerformanceDipAlerts([])).toEqual([]);
  });

  it("returns no alerts for resolved, fully-supported records", () => {
    const alerts = identifyPerformanceDipAlerts([makeRecord()]);
    expect(alerts).toEqual([]);
  });

  it("fires critical for unreviewed support_recommended dip (status=identified)", () => {
    const records = [
      makeRecord({ id: "r1", dip_severity: "support_recommended", dip_status: "identified", staff_name: "Alice" }),
    ];
    const alerts = identifyPerformanceDipAlerts(records);
    const critical = alerts.filter((a) => a.severity === "critical");
    expect(critical.length).toBe(1);
    expect(critical[0].type).toBe("unreviewed_serious");
  });

  it("fires critical for unreviewed manager_review_required dip (status=exploring)", () => {
    const records = [
      makeRecord({ id: "r1", dip_severity: "manager_review_required", dip_status: "exploring" }),
    ];
    const alerts = identifyPerformanceDipAlerts(records);
    const critical = alerts.filter((a) => a.type === "unreviewed_serious");
    expect(critical.length).toBe(1);
  });

  it("does NOT fire critical for serious dip in supporting/resolved/escalated status", () => {
    const records = [
      makeRecord({ id: "r1", dip_severity: "manager_review_required", dip_status: "supporting" }),
      makeRecord({ id: "r2", dip_severity: "support_recommended", dip_status: "resolved" }),
      makeRecord({ id: "r3", dip_severity: "manager_review_required", dip_status: "escalated" }),
    ];
    const alerts = identifyPerformanceDipAlerts(records);
    expect(alerts.filter((a) => a.type === "unreviewed_serious").length).toBe(0);
  });

  it("fires high for staff not informed (>= 1)", () => {
    const records = [makeRecord({ id: "r1", staff_informed: false })];
    const alerts = identifyPerformanceDipAlerts(records);
    const match = alerts.filter((a) => a.type === "staff_not_informed");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("high");
  });

  it("fires high for no support offered (>= 1)", () => {
    const records = [makeRecord({ id: "r1", support_offered: false })];
    const alerts = identifyPerformanceDipAlerts(records);
    const match = alerts.filter((a) => a.type === "no_support_offered");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("high");
  });

  it("fires medium for triggers not explored only when >= 2", () => {
    const one = [makeRecord({ id: "r1", triggers_explored: false })];
    expect(identifyPerformanceDipAlerts(one).filter((a) => a.type === "triggers_not_explored").length).toBe(0);

    const two = [
      makeRecord({ id: "r1", triggers_explored: false }),
      makeRecord({ id: "r2", triggers_explored: false }),
    ];
    const alerts = identifyPerformanceDipAlerts(two);
    const match = alerts.filter((a) => a.type === "triggers_not_explored");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("medium");
  });

  it("fires medium for no wellbeing check only when >= 2", () => {
    const one = [makeRecord({ id: "r1", wellbeing_assessed: false })];
    expect(identifyPerformanceDipAlerts(one).filter((a) => a.type === "no_wellbeing_check").length).toBe(0);

    const two = [
      makeRecord({ id: "r1", wellbeing_assessed: false }),
      makeRecord({ id: "r2", wellbeing_assessed: false }),
    ];
    const alerts = identifyPerformanceDipAlerts(two);
    const match = alerts.filter((a) => a.type === "no_wellbeing_check");
    expect(match.length).toBe(1);
    expect(match[0].severity).toBe("medium");
  });
});
