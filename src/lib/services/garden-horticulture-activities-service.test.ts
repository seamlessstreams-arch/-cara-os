import { describe, it, expect } from "vitest";
import {
  computeGardenHorticultureMetrics,
  identifyGardenHorticultureAlerts,
  type GardenHorticultureActivitiesRecord,
} from "./garden-horticulture-activities-service";

function makeRecord(overrides: Partial<GardenHorticultureActivitiesRecord> = {}): GardenHorticultureActivitiesRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    activity_type: "vegetable_growing",
    skill_level: "developing",
    engagement_level: "engaged",
    health_benefit: "some_benefit",
    session_date: "2026-05-21",
    child_name: "Alex",
    child_id: "child-1",
    supported_by: "Staff A",
    age_appropriate: true,
    risk_assessment_done: true,
    tools_safe: true,
    supervision_adequate: true,
    child_chose_activity: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    therapeutic_value_noted: true,
    seasonal_learning: true,
    organic_methods_used: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-21T10:00:00Z",
    updated_at: "2026-05-21T10:00:00Z",
    ...overrides,
  };
}

// ── computeGardenHorticultureMetrics ────────────────────────────────────

describe("computeGardenHorticultureMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeGardenHorticultureMetrics([]);
    expect(result.total_sessions).toBe(0);
    expect(result.not_started_count).toBe(0);
    expect(result.disengaged_count).toBe(0);
    expect(result.no_benefit_count).toBe(0);
    expect(result.refused_count).toBe(0);
    expect(result.age_appropriate_rate).toBeNull();;
    expect(result.unique_children).toBe(0);
  });

  it("computes counts and rates correctly", () => {
    const records = [
      makeRecord({ id: "r1", child_name: "Alex", skill_level: "not_started", engagement_level: "disengaged", health_benefit: "no_benefit", age_appropriate: true, risk_assessment_done: false }),
      makeRecord({ id: "r2", child_name: "Ben", engagement_level: "refused", health_benefit: "no_benefit", age_appropriate: false, risk_assessment_done: true }),
      makeRecord({ id: "r3", child_name: "Alex", skill_level: "advanced", engagement_level: "highly_engaged", health_benefit: "significant_benefit", age_appropriate: true, risk_assessment_done: true }),
    ];
    const result = computeGardenHorticultureMetrics(records);

    expect(result.total_sessions).toBe(3);
    expect(result.not_started_count).toBe(1);
    // disengaged + refused = 2
    expect(result.disengaged_count).toBe(2);
    expect(result.no_benefit_count).toBe(2);
    expect(result.refused_count).toBe(1);
    // 2/3 age_appropriate
    expect(result.age_appropriate_rate).toBe(66.7);
    // 2/3 risk_assessment_done
    expect(result.risk_assessment_rate).toBe(66.7);
    expect(result.unique_children).toBe(2);
    expect(result.by_engagement_level).toEqual({
      disengaged: 1,
      refused: 1,
      highly_engaged: 1,
    });
  });
});

// ── identifyGardenHorticultureAlerts ────────────────────────────────────

describe("identifyGardenHorticultureAlerts", () => {
  it("returns empty alerts for empty data", () => {
    expect(identifyGardenHorticultureAlerts([])).toEqual([]);
  });

  it("triggers refused_no_benefit critical alert", () => {
    const records = [
      makeRecord({ engagement_level: "refused", health_benefit: "no_benefit" }),
    ];
    const alerts = identifyGardenHorticultureAlerts(records);
    const critical = alerts.find((a) => a.type === "refused_no_benefit");
    expect(critical).toBeDefined();
    expect(critical!.severity).toBe("critical");
  });

  it("triggers no_risk_assessment high alert when >= 1", () => {
    const records = [makeRecord({ risk_assessment_done: false })];
    const alerts = identifyGardenHorticultureAlerts(records);
    const noRA = alerts.find((a) => a.type === "no_risk_assessment");
    expect(noRA).toBeDefined();
    expect(noRA!.severity).toBe("high");
  });

  it("triggers tools_not_safe high alert when >= 1", () => {
    const records = [makeRecord({ tools_safe: false })];
    const alerts = identifyGardenHorticultureAlerts(records);
    const unsafe = alerts.find((a) => a.type === "tools_not_safe");
    expect(unsafe).toBeDefined();
    expect(unsafe!.severity).toBe("high");
  });

  it("triggers no_child_choice medium alert when >= 2", () => {
    const records = [
      makeRecord({ id: "r1", child_chose_activity: false }),
      makeRecord({ id: "r2", child_chose_activity: false }),
    ];
    const alerts = identifyGardenHorticultureAlerts(records);
    const noChoice = alerts.find((a) => a.type === "no_child_choice");
    expect(noChoice).toBeDefined();
    expect(noChoice!.severity).toBe("medium");
  });

  it("triggers no_therapeutic_value medium alert when >= 2", () => {
    const records = [
      makeRecord({ id: "r1", therapeutic_value_noted: false }),
      makeRecord({ id: "r2", therapeutic_value_noted: false }),
    ];
    const alerts = identifyGardenHorticultureAlerts(records);
    const noTV = alerts.find((a) => a.type === "no_therapeutic_value");
    expect(noTV).toBeDefined();
    expect(noTV!.severity).toBe("medium");
  });

  it("does NOT trigger no_child_choice when only 1 session", () => {
    const records = [makeRecord({ child_chose_activity: false })];
    const alerts = identifyGardenHorticultureAlerts(records);
    expect(alerts.find((a) => a.type === "no_child_choice")).toBeUndefined();
  });
});
