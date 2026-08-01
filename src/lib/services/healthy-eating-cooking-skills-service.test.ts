import { describe, it, expect } from "vitest";
import {
  computeHealthyEatingMetrics,
  identifyHealthyEatingAlerts,
  type HealthyEatingCookingSkillsRecord,
} from "./healthy-eating-cooking-skills-service";

// ── Factory ──────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<HealthyEatingCookingSkillsRecord> = {}): HealthyEatingCookingSkillsRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    session_type: "meal_preparation",
    skill_level: "developing",
    engagement_level: "engaged",
    health_outcome: "maintained",
    session_date: "2026-05-01",
    child_name: "Alice",
    child_id: "child-1",
    supported_by: "Staff A",
    age_appropriate: true,
    food_hygiene_followed: true,
    child_chose_recipe: true,
    dietary_needs_met: true,
    allergy_awareness: true,
    kitchen_safety_followed: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    healthy_options_promoted: true,
    skills_transferable: true,
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

// ── computeHealthyEatingMetrics ──────────────────────────────────────────

describe("computeHealthyEatingMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeHealthyEatingMetrics([]);
    expect(result.total_sessions).toBe(0);
    expect(result.not_started_count).toBe(0);
    expect(result.disengaged_count).toBe(0);
    expect(result.declined_count).toBe(0);
    expect(result.refused_count).toBe(0);
    expect(result.age_appropriate_rate).toBeNull();;
    expect(result.unique_children).toBe(0);
  });

  it("computes correct counts and rates with populated data", () => {
    const records = [
      makeRecord({ child_name: "Alice", skill_level: "not_started", engagement_level: "refused", health_outcome: "declined" }),
      makeRecord({ id: "rec-2", child_name: "Bob", engagement_level: "disengaged", health_outcome: "slight_decline", food_hygiene_followed: false }),
      makeRecord({ id: "rec-3", child_name: "Alice", skill_level: "developing", engagement_level: "engaged", health_outcome: "some_improvement" }),
    ];
    const result = computeHealthyEatingMetrics(records);
    expect(result.total_sessions).toBe(3);
    expect(result.not_started_count).toBe(1);
    // disengaged_count includes both disengaged AND refused
    expect(result.disengaged_count).toBe(2);
    // declined_count includes slight_decline AND declined
    expect(result.declined_count).toBe(2);
    expect(result.refused_count).toBe(1);
    expect(result.unique_children).toBe(2);
    // food_hygiene_followed: 2/3 = 66.7%
    expect(result.food_hygiene_rate).toBe(66.7);
  });

  it("computes boolean rates at 100% when all true", () => {
    const records = [makeRecord(), makeRecord({ id: "rec-2", child_name: "Bob" })];
    const result = computeHealthyEatingMetrics(records);
    expect(result.age_appropriate_rate).toBe(100);
    expect(result.food_hygiene_rate).toBe(100);
    expect(result.kitchen_safety_rate).toBe(100);
    expect(result.child_chose_recipe_rate).toBe(100);
  });

  it("builds by_session_type breakdown", () => {
    const records = [
      makeRecord({ session_type: "baking" }),
      makeRecord({ id: "rec-2", session_type: "baking" }),
      makeRecord({ id: "rec-3", session_type: "food_hygiene" }),
    ];
    const result = computeHealthyEatingMetrics(records);
    expect(result.by_session_type.baking).toBe(2);
    expect(result.by_session_type.food_hygiene).toBe(1);
  });
});

// ── identifyHealthyEatingAlerts ──────────────────────────────────────────

describe("identifyHealthyEatingAlerts", () => {
  it("returns no alerts for empty data", () => {
    const alerts = identifyHealthyEatingAlerts([]);
    expect(alerts).toHaveLength(0);
  });

  it("raises critical alert for refused + declining health", () => {
    const records = [
      makeRecord({ engagement_level: "refused", health_outcome: "declined" }),
    ];
    const alerts = identifyHealthyEatingAlerts(records);
    const critical = alerts.filter((a) => a.type === "refused_declining");
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("raises high alert for food hygiene not followed (threshold >= 1)", () => {
    const records = [makeRecord({ food_hygiene_followed: false })];
    const alerts = identifyHealthyEatingAlerts(records);
    const hygieneAlerts = alerts.filter((a) => a.type === "no_food_hygiene");
    expect(hygieneAlerts).toHaveLength(1);
    expect(hygieneAlerts[0].severity).toBe("high");
  });

  it("raises high alert for kitchen safety not followed (threshold >= 1)", () => {
    const records = [makeRecord({ kitchen_safety_followed: false })];
    const alerts = identifyHealthyEatingAlerts(records);
    const safetyAlerts = alerts.filter((a) => a.type === "no_kitchen_safety");
    expect(safetyAlerts).toHaveLength(1);
    expect(safetyAlerts[0].severity).toBe("high");
  });

  it("raises medium alert for no child choice when >= 2 sessions", () => {
    const records = [
      makeRecord({ child_chose_recipe: false }),
      makeRecord({ id: "rec-2", child_chose_recipe: false }),
    ];
    const alerts = identifyHealthyEatingAlerts(records);
    const choiceAlerts = alerts.filter((a) => a.type === "no_child_choice");
    expect(choiceAlerts).toHaveLength(1);
    expect(choiceAlerts[0].severity).toBe("medium");
  });

  it("does NOT raise child choice alert with only 1 session", () => {
    const records = [makeRecord({ child_chose_recipe: false })];
    const alerts = identifyHealthyEatingAlerts(records);
    expect(alerts.filter((a) => a.type === "no_child_choice")).toHaveLength(0);
  });

  it("raises medium alert for no allergy awareness when >= 2 sessions", () => {
    const records = [
      makeRecord({ allergy_awareness: false }),
      makeRecord({ id: "rec-2", allergy_awareness: false }),
    ];
    const alerts = identifyHealthyEatingAlerts(records);
    const allergyAlerts = alerts.filter((a) => a.type === "no_allergy_awareness");
    expect(allergyAlerts).toHaveLength(1);
    expect(allergyAlerts[0].severity).toBe("medium");
  });
});
