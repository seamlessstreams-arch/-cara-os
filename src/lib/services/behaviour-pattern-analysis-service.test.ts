import { describe, it, expect } from "vitest";
import {
  computeBehaviourPatternMetrics,
  identifyBehaviourPatternAlerts,
  type BehaviourPatternAnalysisRecord,
} from "./behaviour-pattern-analysis-service";

function makeRecord(overrides: Partial<BehaviourPatternAnalysisRecord> = {}): BehaviourPatternAnalysisRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    behaviour_category: "verbal_aggression",
    trigger_type: "peer_conflict",
    intervention_outcome: "de_escalated",
    behaviour_severity: "moderate",
    incident_date: "2026-05-01",
    child_name: "Child A",
    child_id: "child-1",
    staff_involved: "Staff A",
    trigger_identified: true,
    de_escalation_attempted: true,
    child_views_sought: true,
    debrief_completed: true,
    pattern_identified: true,
    care_plan_updated: true,
    risk_assessment_updated: true,
    positive_strategies_used: true,
    therapeutic_input_considered: true,
    social_worker_informed: true,
    parent_informed: true,
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

describe("computeBehaviourPatternMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeBehaviourPatternMetrics([]);
    expect(m.total_incidents).toBe(0);
    expect(m.severe_count).toBe(0);
    expect(m.trigger_identified_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts severity levels and restraint", () => {
    const records = [
      makeRecord({ id: "1", behaviour_severity: "severe" }),
      makeRecord({ id: "2", behaviour_severity: "critical" }),
      makeRecord({ id: "3", intervention_outcome: "required_restraint" }),
      makeRecord({ id: "4", trigger_type: "unknown" }),
    ];
    const m = computeBehaviourPatternMetrics(records);
    expect(m.total_incidents).toBe(4);
    expect(m.severe_count).toBe(1);
    expect(m.critical_count).toBe(1);
    expect(m.restraint_count).toBe(1);
    expect(m.unknown_trigger_count).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", trigger_identified: true, debrief_completed: true }),
      makeRecord({ id: "2", trigger_identified: false, debrief_completed: false }),
    ];
    const m = computeBehaviourPatternMetrics(records);
    expect(m.trigger_identified_rate).toBe(50);
    expect(m.debrief_rate).toBe(50);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Alice" }),
      makeRecord({ id: "2", child_name: "Bob" }),
      makeRecord({ id: "3", child_name: "Alice" }),
    ];
    const m = computeBehaviourPatternMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("builds breakdowns by category, trigger, outcome, severity", () => {
    const records = [
      makeRecord({ id: "1", behaviour_category: "self_harm", trigger_type: "anxiety" }),
      makeRecord({ id: "2", behaviour_category: "self_harm", trigger_type: "trauma_response" }),
    ];
    const m = computeBehaviourPatternMetrics(records);
    expect(m.by_behaviour_category).toEqual({ self_harm: 2 });
    expect(m.by_trigger_type).toEqual({ anxiety: 1, trauma_response: 1 });
  });
});

describe("identifyBehaviourPatternAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyBehaviourPatternAlerts([])).toEqual([]);
  });

  it("fires critical alert for restraint without de-escalation attempt", () => {
    const records = [
      makeRecord({ id: "r1", intervention_outcome: "required_restraint", de_escalation_attempted: false, child_name: "Alice" }),
    ];
    const alerts = identifyBehaviourPatternAlerts(records);
    const a = alerts.find((a) => a.type === "restraint_no_deescalation");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
    expect(a!.id).toBe("r1");
  });

  it("fires debrief_not_completed alert when >= 1 incident has no debrief", () => {
    const records = [makeRecord({ debrief_completed: false })];
    const alerts = identifyBehaviourPatternAlerts(records);
    expect(alerts.find((a) => a.type === "debrief_not_completed")).toBeDefined();
  });

  it("fires positive_strategies_not_used alert when >= 1 without positive strategies", () => {
    const records = [makeRecord({ positive_strategies_used: false })];
    const alerts = identifyBehaviourPatternAlerts(records);
    expect(alerts.find((a) => a.type === "positive_strategies_not_used")).toBeDefined();
  });

  it("fires pattern_not_identified alert when >= 2 without pattern identification", () => {
    const records = [
      makeRecord({ id: "1", pattern_identified: false }),
      makeRecord({ id: "2", pattern_identified: false }),
    ];
    const alerts = identifyBehaviourPatternAlerts(records);
    expect(alerts.find((a) => a.type === "pattern_not_identified")).toBeDefined();
  });

  it("does NOT fire pattern_not_identified for only 1 record", () => {
    const records = [makeRecord({ pattern_identified: false })];
    const alerts = identifyBehaviourPatternAlerts(records);
    expect(alerts.find((a) => a.type === "pattern_not_identified")).toBeUndefined();
  });

  it("fires risk_not_updated alert when >= 2 without risk assessment update", () => {
    const records = [
      makeRecord({ id: "1", risk_assessment_updated: false }),
      makeRecord({ id: "2", risk_assessment_updated: false }),
    ];
    const alerts = identifyBehaviourPatternAlerts(records);
    expect(alerts.find((a) => a.type === "risk_not_updated")).toBeDefined();
  });
});
