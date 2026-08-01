import { describe, it, expect } from "vitest";
import {
  computeRelationshipEducationMetrics,
  identifyRelationshipEducationAlerts,
  type RelationshipEducationSafetyRecord,
} from "./relationship-education-safety-service";

function makeRecord(overrides: Partial<RelationshipEducationSafetyRecord> = {}): RelationshipEducationSafetyRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    topic_area: "healthy_relationships",
    understanding_level: "good_understanding",
    engagement_quality: "engaged",
    age_appropriateness: "appropriate",
    session_date: "2025-04-01",
    child_name: "Child A",
    child_id: "c1",
    delivered_by: "Staff A",
    child_consented: true,
    age_appropriate_content: true,
    safe_space_provided: true,
    trigger_warnings_given: true,
    child_led_pace: true,
    resources_provided: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    follow_up_offered: true,
    confidentiality_maintained: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2025-04-01T00:00:00Z",
    updated_at: "2025-04-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeRelationshipEducationMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeRelationshipEducationMetrics([]);
    expect(m.total_sessions).toBe(0);
    expect(m.not_understood_count).toBe(0);
    expect(m.disengaged_count).toBe(0);
    expect(m.not_appropriate_count).toBe(0);
    expect(m.harmful_count).toBe(0);
    expect(m.child_consented_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts problem indicators", () => {
    const records = [
      makeRecord({ understanding_level: "not_understood" }),
      makeRecord({ id: "r2", engagement_quality: "disengaged" }),
      makeRecord({ id: "r3", engagement_quality: "refused" }),
      makeRecord({ id: "r4", age_appropriateness: "not_appropriate" }),
      makeRecord({ id: "r5", age_appropriateness: "harmful" }),
    ];
    const m = computeRelationshipEducationMetrics(records);
    expect(m.not_understood_count).toBe(1);
    expect(m.disengaged_count).toBe(2); // disengaged + refused
    expect(m.not_appropriate_count).toBe(2); // not_appropriate + harmful
    expect(m.harmful_count).toBe(1);
  });

  it("calculates boolean rates at 100% when all true", () => {
    const records = [makeRecord(), makeRecord({ id: "r2" })];
    const m = computeRelationshipEducationMetrics(records);
    expect(m.child_consented_rate).toBe(100);
    expect(m.safe_space_rate).toBe(100);
    expect(m.trigger_warnings_rate).toBe(100);
    expect(m.confidentiality_rate).toBe(100);
  });

  it("calculates boolean rates at 50% with mixed values", () => {
    const records = [
      makeRecord({ child_consented: true }),
      makeRecord({ id: "r2", child_consented: false }),
    ];
    const m = computeRelationshipEducationMetrics(records);
    expect(m.child_consented_rate).toBe(50);
  });

  it("counts unique children by name", () => {
    const records = [
      makeRecord({ child_name: "Alice" }),
      makeRecord({ id: "r2", child_name: "Alice" }),
      makeRecord({ id: "r3", child_name: "Bob" }),
    ];
    const m = computeRelationshipEducationMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("builds breakdowns by category", () => {
    const records = [
      makeRecord({ topic_area: "online_safety" }),
      makeRecord({ id: "r2", topic_area: "online_safety" }),
      makeRecord({ id: "r3", topic_area: "consent_understanding" }),
    ];
    const m = computeRelationshipEducationMetrics(records);
    expect(m.by_topic_area).toEqual({ online_safety: 2, consent_understanding: 1 });
  });
});

describe("identifyRelationshipEducationAlerts", () => {
  it("returns empty for no data", () => {
    expect(identifyRelationshipEducationAlerts([])).toEqual([]);
  });

  it("critical alert for harmful + not_understood", () => {
    const records = [makeRecord({ age_appropriateness: "harmful", understanding_level: "not_understood" })];
    const alerts = identifyRelationshipEducationAlerts(records);
    expect(alerts.some((a) => a.type === "harmful_not_understood" && a.severity === "critical")).toBe(true);
  });

  it("high alert when >= 1 session has no safe space", () => {
    const records = [makeRecord({ safe_space_provided: false })];
    const alerts = identifyRelationshipEducationAlerts(records);
    expect(alerts.some((a) => a.type === "no_safe_space" && a.severity === "high")).toBe(true);
  });

  it("high alert when >= 1 session has no consent", () => {
    const records = [makeRecord({ child_consented: false })];
    const alerts = identifyRelationshipEducationAlerts(records);
    expect(alerts.some((a) => a.type === "no_consent" && a.severity === "high")).toBe(true);
  });

  it("medium alert when >= 2 sessions have no trigger warnings", () => {
    const records = [
      makeRecord({ trigger_warnings_given: false }),
      makeRecord({ id: "r2", trigger_warnings_given: false }),
    ];
    const alerts = identifyRelationshipEducationAlerts(records);
    expect(alerts.some((a) => a.type === "no_trigger_warnings" && a.severity === "medium")).toBe(true);
  });

  it("no trigger warning alert for exactly 1 missing", () => {
    const records = [makeRecord({ trigger_warnings_given: false })];
    const alerts = identifyRelationshipEducationAlerts(records);
    expect(alerts.some((a) => a.type === "no_trigger_warnings")).toBe(false);
  });

  it("medium alert when >= 2 sessions have no confidentiality", () => {
    const records = [
      makeRecord({ confidentiality_maintained: false }),
      makeRecord({ id: "r2", confidentiality_maintained: false }),
    ];
    const alerts = identifyRelationshipEducationAlerts(records);
    expect(alerts.some((a) => a.type === "no_confidentiality" && a.severity === "medium")).toBe(true);
  });
});
