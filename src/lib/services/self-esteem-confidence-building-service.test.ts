import { describe, it, expect } from "vitest";
import {
  computeSelfEsteemMetrics,
  identifySelfEsteemAlerts,
} from "./self-esteem-confidence-building-service";
import type { SelfEsteemConfidenceBuildingRecord } from "./self-esteem-confidence-building-service";

// -- Factory Function ---------------------------------------------------------

function makeRecord(overrides: Partial<SelfEsteemConfidenceBuildingRecord> = {}): SelfEsteemConfidenceBuildingRecord {
  return {
    id: "se-1",
    home_id: "home-1",
    intervention_type: "one_to_one_session",
    confidence_level: "confident",
    progress_assessment: "some_improvement",
    self_image_rating: "positive",
    session_date: "2026-05-01",
    child_name: "Alex",
    child_id: "child-1",
    supported_by: "staff-1",
    child_led_activity: true,
    strengths_identified: true,
    goals_set: true,
    achievements_celebrated: true,
    safe_space_provided: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    peers_supportive: true,
    culturally_affirming: true,
    progress_shared: true,
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

// -- computeSelfEsteemMetrics -------------------------------------------------

describe("computeSelfEsteemMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeSelfEsteemMetrics([]);
    expect(m.total_sessions).toBe(0);
    expect(m.very_low_count).toBe(0);
    expect(m.decline_count).toBe(0);
    expect(m.negative_image_count).toBe(0);
    expect(m.significant_decline_count).toBe(0);
    expect(m.child_led_rate).toBeNull();;
    expect(m.strengths_identified_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts very low confidence and decline records", () => {
    const records = [
      makeRecord({ id: "r1", confidence_level: "very_low", progress_assessment: "significant_decline" }),
      makeRecord({ id: "r2", confidence_level: "low_confidence", progress_assessment: "slight_decline" }),
      makeRecord({ id: "r3", confidence_level: "confident", progress_assessment: "some_improvement" }),
    ];
    const m = computeSelfEsteemMetrics(records);
    expect(m.very_low_count).toBe(1);
    expect(m.decline_count).toBe(2); // significant + slight
    expect(m.significant_decline_count).toBe(1);
  });

  it("counts negative self-image ratings", () => {
    const records = [
      makeRecord({ id: "r1", self_image_rating: "negative" }),
      makeRecord({ id: "r2", self_image_rating: "very_negative" }),
      makeRecord({ id: "r3", self_image_rating: "positive" }),
    ];
    const m = computeSelfEsteemMetrics(records);
    expect(m.negative_image_count).toBe(2);
  });

  it("computes boolean rates for quality indicators", () => {
    const records = [
      makeRecord({ id: "r1", child_led_activity: true, strengths_identified: true }),
      makeRecord({ id: "r2", child_led_activity: false, strengths_identified: false }),
    ];
    const m = computeSelfEsteemMetrics(records);
    expect(m.child_led_rate).toBe(50);
    expect(m.strengths_identified_rate).toBe(50);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "r1", child_name: "Alex" }),
      makeRecord({ id: "r2", child_name: "Alex" }),
      makeRecord({ id: "r3", child_name: "Ben" }),
    ];
    const m = computeSelfEsteemMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("breaks down by intervention type", () => {
    const records = [
      makeRecord({ id: "r1", intervention_type: "group_activity" }),
      makeRecord({ id: "r2", intervention_type: "group_activity" }),
      makeRecord({ id: "r3", intervention_type: "creative_expression" }),
    ];
    const m = computeSelfEsteemMetrics(records);
    expect(m.by_intervention_type["group_activity"]).toBe(2);
    expect(m.by_intervention_type["creative_expression"]).toBe(1);
  });

  it("computes all boolean rates at 100% when all true", () => {
    const records = [makeRecord()];
    const m = computeSelfEsteemMetrics(records);
    expect(m.child_led_rate).toBe(100);
    expect(m.strengths_identified_rate).toBe(100);
    expect(m.goals_set_rate).toBe(100);
    expect(m.achievements_celebrated_rate).toBe(100);
    expect(m.safe_space_rate).toBe(100);
    expect(m.culturally_affirming_rate).toBe(100);
    expect(m.recorded_promptly_rate).toBe(100);
  });
});

// -- identifySelfEsteemAlerts -------------------------------------------------

describe("identifySelfEsteemAlerts", () => {
  it("returns empty array for empty records", () => {
    expect(identifySelfEsteemAlerts([])).toEqual([]);
  });

  it("flags very low confidence with significant decline as critical", () => {
    const records = [
      makeRecord({ confidence_level: "very_low", progress_assessment: "significant_decline" }),
    ];
    const alerts = identifySelfEsteemAlerts(records);
    const veryLow = alerts.filter((a) => a.type === "very_low_declining");
    expect(veryLow).toHaveLength(1);
    expect(veryLow[0].severity).toBe("critical");
  });

  it("does not flag very_low without significant_decline as critical", () => {
    const records = [
      makeRecord({ confidence_level: "very_low", progress_assessment: "maintained" }),
    ];
    const alerts = identifySelfEsteemAlerts(records);
    const veryLow = alerts.filter((a) => a.type === "very_low_declining");
    expect(veryLow).toHaveLength(0);
  });

  it("flags sessions without strengths identified as high (threshold >= 1)", () => {
    const records = [makeRecord({ strengths_identified: false })];
    const alerts = identifySelfEsteemAlerts(records);
    const noStr = alerts.filter((a) => a.type === "no_strengths_identified");
    expect(noStr).toHaveLength(1);
    expect(noStr[0].severity).toBe("high");
  });

  it("flags not child-led sessions as high (threshold >= 1)", () => {
    const records = [makeRecord({ child_led_activity: false })];
    const alerts = identifySelfEsteemAlerts(records);
    const notLed = alerts.filter((a) => a.type === "not_child_led");
    expect(notLed).toHaveLength(1);
    expect(notLed[0].severity).toBe("high");
  });

  it("flags no safe space at threshold >= 2 as medium", () => {
    const records = [
      makeRecord({ id: "r1", safe_space_provided: false }),
      makeRecord({ id: "r2", safe_space_provided: false }),
    ];
    const alerts = identifySelfEsteemAlerts(records);
    const noSafe = alerts.filter((a) => a.type === "no_safe_space");
    expect(noSafe).toHaveLength(1);
    expect(noSafe[0].severity).toBe("medium");
  });

  it("does not flag no safe space with only 1 record", () => {
    const records = [makeRecord({ safe_space_provided: false })];
    const alerts = identifySelfEsteemAlerts(records);
    const noSafe = alerts.filter((a) => a.type === "no_safe_space");
    expect(noSafe).toHaveLength(0);
  });

  it("flags not culturally affirming at threshold >= 2 as medium", () => {
    const records = [
      makeRecord({ id: "r1", culturally_affirming: false }),
      makeRecord({ id: "r2", culturally_affirming: false }),
    ];
    const alerts = identifySelfEsteemAlerts(records);
    const notCult = alerts.filter((a) => a.type === "not_culturally_affirming");
    expect(notCult).toHaveLength(1);
    expect(notCult[0].severity).toBe("medium");
  });
});
