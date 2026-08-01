import { describe, it, expect } from "vitest";
import {
  computePhysicalActivityMetrics,
  identifyPhysicalActivityAlerts,
} from "./physical-activity-tracking-service";
import type { PhysicalActivityTrackingRecord } from "./physical-activity-tracking-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<PhysicalActivityTrackingRecord> = {}): PhysicalActivityTrackingRecord {
  return {
    id: "pa-1",
    home_id: "home-1",
    activity_type: "team_sport",
    participation_level: "enthusiastic",
    fitness_assessment: "good",
    enjoyment_rating: "enjoyed",
    activity_date: "2026-05-01",
    child_name: "Alex",
    child_id: "child-1",
    supervised_by: "staff-1",
    child_choice_offered: true,
    age_appropriate: true,
    health_needs_considered: true,
    risk_assessed: true,
    inclusive_activity: true,
    peer_interaction_positive: true,
    equipment_suitable: true,
    safeguarding_considered: true,
    achievement_celebrated: true,
    care_plan_reflects: true,
    social_worker_informed: true,
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

// -- computePhysicalActivityMetrics -------------------------------------------

describe("computePhysicalActivityMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computePhysicalActivityMetrics([]);
    expect(m.total_activities).toBe(0);
    expect(m.refused_count).toBe(0);
    expect(m.unable_count).toBe(0);
    expect(m.disliked_count).toBe(0);
    expect(m.below_average_count).toBe(0);
    expect(m.child_choice_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts refused, unable, disliked, below_average correctly", () => {
    const records = [
      makeRecord({ id: "1", participation_level: "refused", enjoyment_rating: "disliked", fitness_assessment: "below_average" }),
      makeRecord({ id: "2", participation_level: "unable" }),
      makeRecord({ id: "3", participation_level: "willing" }),
    ];
    const m = computePhysicalActivityMetrics(records);
    expect(m.refused_count).toBe(1);
    expect(m.unable_count).toBe(1);
    expect(m.disliked_count).toBe(1);
    expect(m.below_average_count).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", child_choice_offered: true, risk_assessed: true }),
      makeRecord({ id: "2", child_choice_offered: false, risk_assessed: false }),
    ];
    const m = computePhysicalActivityMetrics(records);
    expect(m.child_choice_rate).toBe(50);
    expect(m.risk_assessed_rate).toBe(50);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Alex" }),
      makeRecord({ id: "2", child_name: "Alex" }),
      makeRecord({ id: "3", child_name: "Beth" }),
    ];
    const m = computePhysicalActivityMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("builds breakdown maps", () => {
    const records = [
      makeRecord({ id: "1", activity_type: "team_sport", participation_level: "enthusiastic", fitness_assessment: "good", enjoyment_rating: "enjoyed" }),
      makeRecord({ id: "2", activity_type: "swimming", participation_level: "willing", fitness_assessment: "excellent", enjoyment_rating: "loved_it" }),
    ];
    const m = computePhysicalActivityMetrics(records);
    expect(m.by_activity_type).toEqual({ team_sport: 1, swimming: 1 });
    expect(m.by_participation_level).toEqual({ enthusiastic: 1, willing: 1 });
    expect(m.by_fitness_assessment).toEqual({ good: 1, excellent: 1 });
    expect(m.by_enjoyment_rating).toEqual({ enjoyed: 1, loved_it: 1 });
  });
});

// -- identifyPhysicalActivityAlerts -------------------------------------------

describe("identifyPhysicalActivityAlerts", () => {
  it("returns no alerts for empty records", () => {
    expect(identifyPhysicalActivityAlerts([])).toEqual([]);
  });

  it("returns no alerts for clean records", () => {
    expect(identifyPhysicalActivityAlerts([makeRecord()])).toEqual([]);
  });

  it("fires refused_no_health_check critical per-record when refused without health check", () => {
    const records = [
      makeRecord({ participation_level: "refused", health_needs_considered: false, child_name: "Alex" }),
    ];
    const alerts = identifyPhysicalActivityAlerts(records);
    expect(alerts.some((a) => a.type === "refused_no_health_check" && a.severity === "critical")).toBe(true);
  });

  it("fires no_child_choice high alert when >= 1 has no child choice", () => {
    const records = [makeRecord({ child_choice_offered: false })];
    const alerts = identifyPhysicalActivityAlerts(records);
    expect(alerts.some((a) => a.type === "no_child_choice" && a.severity === "high")).toBe(true);
  });

  it("fires risk_not_assessed high alert when >= 1 has no risk assessment", () => {
    const records = [makeRecord({ risk_assessed: false })];
    const alerts = identifyPhysicalActivityAlerts(records);
    expect(alerts.some((a) => a.type === "risk_not_assessed" && a.severity === "high")).toBe(true);
  });

  it("fires achievement_not_celebrated medium alert only when >= 2", () => {
    const one = [makeRecord({ achievement_celebrated: false })];
    expect(identifyPhysicalActivityAlerts(one).some((a) => a.type === "achievement_not_celebrated")).toBe(false);

    const two = [
      makeRecord({ id: "1", achievement_celebrated: false }),
      makeRecord({ id: "2", achievement_celebrated: false }),
    ];
    expect(identifyPhysicalActivityAlerts(two).some((a) => a.type === "achievement_not_celebrated" && a.severity === "medium")).toBe(true);
  });

  it("fires not_inclusive medium alert only when >= 2", () => {
    const one = [makeRecord({ inclusive_activity: false })];
    expect(identifyPhysicalActivityAlerts(one).some((a) => a.type === "not_inclusive")).toBe(false);

    const two = [
      makeRecord({ id: "1", inclusive_activity: false }),
      makeRecord({ id: "2", inclusive_activity: false }),
    ];
    expect(identifyPhysicalActivityAlerts(two).some((a) => a.type === "not_inclusive" && a.severity === "medium")).toBe(true);
  });

  it("does not fire refused_no_health_check when health needs are considered", () => {
    const records = [makeRecord({ participation_level: "refused", health_needs_considered: true })];
    const alerts = identifyPhysicalActivityAlerts(records);
    expect(alerts.some((a) => a.type === "refused_no_health_check")).toBe(false);
  });
});
