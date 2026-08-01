import { describe, it, expect } from "vitest";
import {
  computeSelfHarmRiskMetrics,
  identifySelfHarmRiskAlerts,
} from "./self-harm-risk-monitoring-service";
import type { SelfHarmRiskMonitoringRecord } from "./self-harm-risk-monitoring-service";

// -- Factory Function ---------------------------------------------------------

function makeRecord(overrides: Partial<SelfHarmRiskMonitoringRecord> = {}): SelfHarmRiskMonitoringRecord {
  return {
    id: "shrm-1",
    home_id: "home-1",
    risk_level: "medium",
    intervention_type: "therapeutic_conversation",
    safety_plan_status: "active_reviewed",
    trigger_type: "family_contact",
    monitoring_date: "2026-05-01",
    child_name: "Alex",
    child_id: "child-1",
    monitored_by: "staff-1",
    child_engaged: true,
    safety_plan_shared: true,
    camhs_involved: true,
    gp_informed: true,
    social_worker_informed: true,
    parent_informed: true,
    environment_checked: true,
    means_restriction_applied: true,
    observation_level_set: true,
    staff_trained: true,
    care_plan_updated: true,
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

// -- computeSelfHarmRiskMetrics -----------------------------------------------

describe("computeSelfHarmRiskMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeSelfHarmRiskMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.critical_count).toBe(0);
    expect(m.high_count).toBe(0);
    expect(m.no_safety_plan_count).toBe(0);
    expect(m.needs_review_count).toBe(0);
    expect(m.child_engaged_rate).toBeNull();;
    expect(m.camhs_involved_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts risk levels correctly", () => {
    const records = [
      makeRecord({ id: "r1", risk_level: "critical" }),
      makeRecord({ id: "r2", risk_level: "high" }),
      makeRecord({ id: "r3", risk_level: "high" }),
      makeRecord({ id: "r4", risk_level: "medium" }),
    ];
    const m = computeSelfHarmRiskMetrics(records);
    expect(m.critical_count).toBe(1);
    expect(m.high_count).toBe(2);
  });

  it("counts safety plan statuses", () => {
    const records = [
      makeRecord({ id: "r1", safety_plan_status: "not_in_place" }),
      makeRecord({ id: "r2", safety_plan_status: "active_needs_review" }),
      makeRecord({ id: "r3", safety_plan_status: "active_reviewed" }),
    ];
    const m = computeSelfHarmRiskMetrics(records);
    expect(m.no_safety_plan_count).toBe(1);
    expect(m.needs_review_count).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "r1", child_engaged: true, camhs_involved: true, staff_trained: true }),
      makeRecord({ id: "r2", child_engaged: false, camhs_involved: false, staff_trained: false }),
    ];
    const m = computeSelfHarmRiskMetrics(records);
    expect(m.child_engaged_rate).toBe(50);
    expect(m.camhs_involved_rate).toBe(50);
    expect(m.staff_trained_rate).toBe(50);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "r1", child_name: "Alex" }),
      makeRecord({ id: "r2", child_name: "Alex" }),
      makeRecord({ id: "r3", child_name: "Ben" }),
    ];
    const m = computeSelfHarmRiskMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("builds breakdown records by type, status, trigger", () => {
    const records = [
      makeRecord({ id: "r1", trigger_type: "family_contact", intervention_type: "camhs_referral" }),
      makeRecord({ id: "r2", trigger_type: "peer_conflict", intervention_type: "camhs_referral" }),
    ];
    const m = computeSelfHarmRiskMetrics(records);
    expect(m.by_trigger_type["family_contact"]).toBe(1);
    expect(m.by_trigger_type["peer_conflict"]).toBe(1);
    expect(m.by_intervention_type["camhs_referral"]).toBe(2);
  });

  it("computes all boolean rates at 100% when all true", () => {
    const records = [makeRecord()];
    const m = computeSelfHarmRiskMetrics(records);
    expect(m.child_engaged_rate).toBe(100);
    expect(m.safety_plan_shared_rate).toBe(100);
    expect(m.gp_informed_rate).toBe(100);
    expect(m.environment_checked_rate).toBe(100);
    expect(m.means_restriction_rate).toBe(100);
    expect(m.observation_level_rate).toBe(100);
    expect(m.care_plan_updated_rate).toBe(100);
    expect(m.recorded_promptly_rate).toBe(100);
  });
});

// -- identifySelfHarmRiskAlerts -----------------------------------------------

describe("identifySelfHarmRiskAlerts", () => {
  it("returns empty array for empty records", () => {
    expect(identifySelfHarmRiskAlerts([])).toEqual([]);
  });

  it("flags critical risk without safety plan as critical", () => {
    const records = [makeRecord({ risk_level: "critical", safety_plan_status: "not_in_place" })];
    const alerts = identifySelfHarmRiskAlerts(records);
    const noplan = alerts.filter((a) => a.type === "critical_no_safety_plan");
    expect(noplan).toHaveLength(1);
    expect(noplan[0].severity).toBe("critical");
  });

  it("flags high/critical without CAMHS as high (threshold >= 1)", () => {
    const records = [makeRecord({ risk_level: "high", camhs_involved: false })];
    const alerts = identifySelfHarmRiskAlerts(records);
    const noCamhs = alerts.filter((a) => a.type === "camhs_not_involved");
    expect(noCamhs).toHaveLength(1);
    expect(noCamhs[0].severity).toBe("high");
  });

  it("flags staff not trained as high (threshold >= 1)", () => {
    const records = [makeRecord({ staff_trained: false })];
    const alerts = identifySelfHarmRiskAlerts(records);
    const noTrained = alerts.filter((a) => a.type === "staff_not_trained");
    expect(noTrained).toHaveLength(1);
    expect(noTrained[0].severity).toBe("high");
  });

  it("flags environment not checked at threshold >= 2 as medium", () => {
    const records = [
      makeRecord({ id: "r1", environment_checked: false }),
      makeRecord({ id: "r2", environment_checked: false }),
    ];
    const alerts = identifySelfHarmRiskAlerts(records);
    const noEnv = alerts.filter((a) => a.type === "environment_not_checked");
    expect(noEnv).toHaveLength(1);
    expect(noEnv[0].severity).toBe("medium");
  });

  it("does not flag environment check with only 1 failure", () => {
    const records = [makeRecord({ environment_checked: false })];
    const alerts = identifySelfHarmRiskAlerts(records);
    const noEnv = alerts.filter((a) => a.type === "environment_not_checked");
    expect(noEnv).toHaveLength(0);
  });

  it("flags means restriction not applied at threshold >= 2 as medium", () => {
    const records = [
      makeRecord({ id: "r1", means_restriction_applied: false }),
      makeRecord({ id: "r2", means_restriction_applied: false }),
    ];
    const alerts = identifySelfHarmRiskAlerts(records);
    const noMeans = alerts.filter((a) => a.type === "no_means_restriction");
    expect(noMeans).toHaveLength(1);
    expect(noMeans[0].severity).toBe("medium");
  });

  it("no alerts when all fields are compliant", () => {
    const records = [makeRecord()];
    const alerts = identifySelfHarmRiskAlerts(records);
    expect(alerts).toEqual([]);
  });
});
