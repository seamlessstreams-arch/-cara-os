import { describe, it, expect } from "vitest";
import {
  computeMissingPersonRiskMetrics,
  identifyMissingPersonRiskAlerts,
  type MissingPersonRiskRecord,
} from "./missing-person-risk-service";

function makeRecord(overrides: Partial<MissingPersonRiskRecord> = {}): MissingPersonRiskRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    risk_level: "medium",
    assessment_type: "periodic_review",
    trigger_plan_status: "active",
    protective_factor: "positive_relationships",
    assessment_date: "2026-05-01",
    child_name: "Child A",
    child_id: "child-1",
    previous_missing_episodes: 2,
    trigger_plan_in_place: true,
    return_interview_completed: true,
    police_informed: true,
    social_worker_informed: true,
    parents_informed: true,
    push_factors_identified: true,
    pull_factors_identified: true,
    peer_mapping_completed: true,
    safe_places_identified: true,
    escalation_protocol_followed: true,
    multi_agency_involved: true,
    exploitation_risk_identified: false,
    issues_found: [],
    actions_taken: [],
    assessed_by: "Staff A",
    next_review_date: "2026-06-01",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeMissingPersonRiskMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMissingPersonRiskMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.very_high_risk_count).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.medium_risk_count).toBe(0);
    expect(m.low_risk_count).toBe(0);
    expect(m.minimal_risk_count).toBe(0);
    expect(m.trigger_plan_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
    expect(m.total_previous_episodes).toBe(0);
    expect(m.average_previous_episodes).toBeNull();;
  });

  it("computes correct counts and rates for populated data", () => {
    const records = [
      makeRecord({ id: "r1", risk_level: "very_high", child_name: "A", previous_missing_episodes: 5, trigger_plan_in_place: true, peer_mapping_completed: false }),
      makeRecord({ id: "r2", risk_level: "high", child_name: "B", previous_missing_episodes: 3, trigger_plan_in_place: false }),
      makeRecord({ id: "r3", risk_level: "medium", child_name: "A", previous_missing_episodes: 2, exploitation_risk_identified: true }),
      makeRecord({ id: "r4", risk_level: "low", child_name: "C", previous_missing_episodes: 0 }),
    ];
    const m = computeMissingPersonRiskMetrics(records);
    expect(m.total_assessments).toBe(4);
    expect(m.very_high_risk_count).toBe(1);
    expect(m.high_risk_count).toBe(1);
    expect(m.medium_risk_count).toBe(1);
    expect(m.low_risk_count).toBe(1);
    expect(m.unique_children).toBe(3);
    expect(m.total_previous_episodes).toBe(10);
    expect(m.average_previous_episodes).toBe(2.5);
    expect(m.exploitation_risk_count).toBe(1);
    // trigger_plan_in_place: 3 out of 4 = 75%
    expect(m.trigger_plan_rate).toBe(75);
  });

  it("builds breakdowns by_risk_level and by_assessment_type", () => {
    const records = [
      makeRecord({ risk_level: "high", assessment_type: "initial_assessment" }),
      makeRecord({ id: "r2", risk_level: "high", assessment_type: "initial_assessment" }),
      makeRecord({ id: "r3", risk_level: "low", assessment_type: "post_incident_review" }),
    ];
    const m = computeMissingPersonRiskMetrics(records);
    expect(m.by_risk_level).toEqual({ high: 2, low: 1 });
    expect(m.by_assessment_type).toEqual({ initial_assessment: 2, post_incident_review: 1 });
  });
});

describe("identifyMissingPersonRiskAlerts", () => {
  it("returns empty array for empty data", () => {
    expect(identifyMissingPersonRiskAlerts([])).toEqual([]);
  });

  it("returns empty array when no alert conditions are met", () => {
    const records = [makeRecord()];
    expect(identifyMissingPersonRiskAlerts(records)).toEqual([]);
  });

  it("fires critical alert for exploitation_risk", () => {
    const records = [makeRecord({ exploitation_risk_identified: true })];
    const alerts = identifyMissingPersonRiskAlerts(records);
    const match = alerts.find((a) => a.type === "exploitation_risk");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires critical alert for very_high_no_trigger_plan when >= 1", () => {
    const records = [makeRecord({ risk_level: "very_high", trigger_plan_in_place: false })];
    const alerts = identifyMissingPersonRiskAlerts(records);
    const match = alerts.find((a) => a.type === "very_high_no_trigger_plan");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for return_interview_missing on post_incident_review", () => {
    const records = [makeRecord({ assessment_type: "post_incident_review", return_interview_completed: false })];
    const alerts = identifyMissingPersonRiskAlerts(records);
    const match = alerts.find((a) => a.type === "return_interview_missing");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for police_not_informed on high/very_high risk", () => {
    const records = [makeRecord({ risk_level: "high", police_informed: false })];
    const alerts = identifyMissingPersonRiskAlerts(records);
    const match = alerts.find((a) => a.type === "police_not_informed");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for peer_mapping_incomplete when >= 3", () => {
    // Only 2 — should NOT trigger
    expect(
      identifyMissingPersonRiskAlerts([
        makeRecord({ id: "r1", peer_mapping_completed: false }),
        makeRecord({ id: "r2", peer_mapping_completed: false }),
      ]).find((a) => a.type === "peer_mapping_incomplete"),
    ).toBeUndefined();
    // 3 — should trigger
    const records = [
      makeRecord({ id: "r1", peer_mapping_completed: false }),
      makeRecord({ id: "r2", peer_mapping_completed: false }),
      makeRecord({ id: "r3", peer_mapping_completed: false }),
    ];
    const alerts = identifyMissingPersonRiskAlerts(records);
    const match = alerts.find((a) => a.type === "peer_mapping_incomplete");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});
