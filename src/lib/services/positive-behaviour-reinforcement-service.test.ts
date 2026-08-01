import { describe, it, expect } from "vitest";
import {
  computePositiveBehaviourMetrics,
  identifyPositiveBehaviourAlerts,
} from "./positive-behaviour-reinforcement-service";
import type { PositiveBehaviourReinforcementRecord } from "./positive-behaviour-reinforcement-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<PositiveBehaviourReinforcementRecord> = {}): PositiveBehaviourReinforcementRecord {
  return {
    id: "pbr-1",
    home_id: "home-1",
    reinforcement_type: "verbal_praise",
    praise_quality: "specific_genuine",
    child_response: "very_positive",
    consistency_level: "highly_consistent",
    session_date: "2026-05-01",
    child_name: "Alex",
    child_id: "child-1",
    supported_by: "staff-1",
    behaviour_specific: true,
    age_appropriate: true,
    culturally_sensitive: true,
    timely_delivery: true,
    proportionate_response: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    peers_included: true,
    child_input_sought: true,
    progress_tracked: true,
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

// -- computePositiveBehaviourMetrics ------------------------------------------

describe("computePositiveBehaviourMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computePositiveBehaviourMetrics([]);
    expect(m.total_sessions).toBe(0);
    expect(m.absent_praise_count).toBe(0);
    expect(m.negative_response_count).toBe(0);
    expect(m.inconsistent_count).toBe(0);
    expect(m.indifferent_count).toBe(0);
    expect(m.behaviour_specific_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts absent praise, negative response, inconsistent, and indifferent correctly", () => {
    const records = [
      makeRecord({ id: "1", praise_quality: "absent", child_response: "negative", consistency_level: "inconsistent" }),
      makeRecord({ id: "2", praise_quality: "generic", child_response: "indifferent", consistency_level: "absent" }),
      makeRecord({ id: "3", praise_quality: "specific_genuine", child_response: "positive", consistency_level: "consistent" }),
    ];
    const m = computePositiveBehaviourMetrics(records);
    expect(m.absent_praise_count).toBe(1);
    expect(m.negative_response_count).toBe(1);
    expect(m.inconsistent_count).toBe(2); // "inconsistent" + "absent"
    expect(m.indifferent_count).toBe(2); // "indifferent" + "negative"
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", behaviour_specific: true, timely_delivery: true, culturally_sensitive: true }),
      makeRecord({ id: "2", behaviour_specific: false, timely_delivery: false, culturally_sensitive: false }),
    ];
    const m = computePositiveBehaviourMetrics(records);
    expect(m.behaviour_specific_rate).toBe(50);
    expect(m.timely_delivery_rate).toBe(50);
    expect(m.culturally_sensitive_rate).toBe(50);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Alex" }),
      makeRecord({ id: "2", child_name: "Alex" }),
      makeRecord({ id: "3", child_name: "Beth" }),
    ];
    const m = computePositiveBehaviourMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("builds breakdown maps", () => {
    const records = [
      makeRecord({ id: "1", reinforcement_type: "verbal_praise", praise_quality: "specific_genuine", child_response: "very_positive", consistency_level: "highly_consistent" }),
      makeRecord({ id: "2", reinforcement_type: "reward_chart", praise_quality: "appropriate", child_response: "positive", consistency_level: "consistent" }),
    ];
    const m = computePositiveBehaviourMetrics(records);
    expect(m.by_reinforcement_type).toEqual({ verbal_praise: 1, reward_chart: 1 });
    expect(m.by_praise_quality).toEqual({ specific_genuine: 1, appropriate: 1 });
    expect(m.by_child_response).toEqual({ very_positive: 1, positive: 1 });
    expect(m.by_consistency_level).toEqual({ highly_consistent: 1, consistent: 1 });
  });
});

// -- identifyPositiveBehaviourAlerts ------------------------------------------

describe("identifyPositiveBehaviourAlerts", () => {
  it("returns no alerts for empty records", () => {
    expect(identifyPositiveBehaviourAlerts([])).toEqual([]);
  });

  it("returns no alerts for clean records", () => {
    expect(identifyPositiveBehaviourAlerts([makeRecord()])).toEqual([]);
  });

  it("fires absent_negative critical per-record", () => {
    const records = [makeRecord({ praise_quality: "absent", child_response: "negative" })];
    const alerts = identifyPositiveBehaviourAlerts(records);
    expect(alerts.some((a) => a.type === "absent_negative" && a.severity === "critical")).toBe(true);
  });

  it("fires not_behaviour_specific high when >= 1", () => {
    const records = [makeRecord({ behaviour_specific: false })];
    const alerts = identifyPositiveBehaviourAlerts(records);
    expect(alerts.some((a) => a.type === "not_behaviour_specific" && a.severity === "high")).toBe(true);
  });

  it("fires not_timely high when >= 1", () => {
    const records = [makeRecord({ timely_delivery: false })];
    const alerts = identifyPositiveBehaviourAlerts(records);
    expect(alerts.some((a) => a.type === "not_timely" && a.severity === "high")).toBe(true);
  });

  it("fires no_child_input medium only when >= 2", () => {
    const one = [makeRecord({ child_input_sought: false })];
    expect(identifyPositiveBehaviourAlerts(one).some((a) => a.type === "no_child_input")).toBe(false);

    const two = [
      makeRecord({ id: "1", child_input_sought: false }),
      makeRecord({ id: "2", child_input_sought: false }),
    ];
    expect(identifyPositiveBehaviourAlerts(two).some((a) => a.type === "no_child_input" && a.severity === "medium")).toBe(true);
  });

  it("fires not_culturally_sensitive medium only when >= 2", () => {
    const one = [makeRecord({ culturally_sensitive: false })];
    expect(identifyPositiveBehaviourAlerts(one).some((a) => a.type === "not_culturally_sensitive")).toBe(false);

    const two = [
      makeRecord({ id: "1", culturally_sensitive: false }),
      makeRecord({ id: "2", culturally_sensitive: false }),
    ];
    expect(identifyPositiveBehaviourAlerts(two).some((a) => a.type === "not_culturally_sensitive" && a.severity === "medium")).toBe(true);
  });

  it("does not fire absent_negative when praise is present even if response is negative", () => {
    const records = [makeRecord({ praise_quality: "generic", child_response: "negative" })];
    const alerts = identifyPositiveBehaviourAlerts(records);
    expect(alerts.some((a) => a.type === "absent_negative")).toBe(false);
  });
});
