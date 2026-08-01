import { describe, it, expect } from "vitest";
import {
  computeFinancialLiteracyMetrics,
  identifyFinancialLiteracyAlerts,
  type FinancialLiteracySavingsRecord,
} from "./financial-literacy-savings-service";

function makeRecord(overrides: Partial<FinancialLiteracySavingsRecord> = {}): FinancialLiteracySavingsRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    topic_area: "budgeting_basics",
    understanding_level: "good_understanding",
    engagement_quality: "engaged",
    saving_progress: "on_target",
    session_date: "2026-05-21",
    child_name: "Alex",
    child_id: "child-1",
    supported_by: "Staff A",
    age_appropriate: true,
    practical_exercise: true,
    real_money_used: true,
    savings_account_active: true,
    budget_created: true,
    targets_set: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    pathway_plan_updated: true,
    resources_provided: true,
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

// ── computeFinancialLiteracyMetrics ─────────────────────────────────────

describe("computeFinancialLiteracyMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeFinancialLiteracyMetrics([]);
    expect(result.total_sessions).toBe(0);
    expect(result.not_understood_count).toBe(0);
    expect(result.disengaged_count).toBe(0);
    expect(result.no_savings_count).toBe(0);
    expect(result.in_debt_count).toBe(0);
    expect(result.age_appropriate_rate).toBeNull();;
    expect(result.unique_children).toBe(0);
  });

  it("computes counts and rates correctly for populated data", () => {
    const records = [
      makeRecord({ id: "r1", child_name: "Alex", understanding_level: "not_understood", engagement_quality: "disengaged", saving_progress: "no_savings", age_appropriate: true, practical_exercise: false }),
      makeRecord({ id: "r2", child_name: "Ben", understanding_level: "confident", engagement_quality: "refused", saving_progress: "in_debt", age_appropriate: false, practical_exercise: true }),
      makeRecord({ id: "r3", child_name: "Alex", understanding_level: "developing", engagement_quality: "engaged", saving_progress: "on_target", age_appropriate: true, practical_exercise: true }),
    ];
    const result = computeFinancialLiteracyMetrics(records);

    expect(result.total_sessions).toBe(3);
    expect(result.not_understood_count).toBe(1);
    // disengaged + refused = 2
    expect(result.disengaged_count).toBe(2);
    expect(result.no_savings_count).toBe(1);
    expect(result.in_debt_count).toBe(1);
    // 2/3 age_appropriate = 66.7%
    expect(result.age_appropriate_rate).toBe(66.7);
    // 2/3 practical_exercise = 66.7%
    expect(result.practical_exercise_rate).toBe(66.7);
    expect(result.unique_children).toBe(2);
    expect(result.by_topic_area).toEqual({ budgeting_basics: 3 });
    expect(result.by_understanding_level).toEqual({
      not_understood: 1,
      confident: 1,
      developing: 1,
    });
  });
});

// ── identifyFinancialLiteracyAlerts ─────────────────────────────────────

describe("identifyFinancialLiteracyAlerts", () => {
  it("returns empty alerts for empty data", () => {
    expect(identifyFinancialLiteracyAlerts([])).toEqual([]);
  });

  it("triggers in_debt_not_understood critical alert", () => {
    const records = [
      makeRecord({ saving_progress: "in_debt", understanding_level: "not_understood" }),
    ];
    const alerts = identifyFinancialLiteracyAlerts(records);
    const debt = alerts.find((a) => a.type === "in_debt_not_understood");
    expect(debt).toBeDefined();
    expect(debt!.severity).toBe("critical");
  });

  it("triggers no_savings_account high alert when >= 1 has no active savings", () => {
    const records = [
      makeRecord({ savings_account_active: false }),
    ];
    const alerts = identifyFinancialLiteracyAlerts(records);
    const noAcc = alerts.find((a) => a.type === "no_savings_account");
    expect(noAcc).toBeDefined();
    expect(noAcc!.severity).toBe("high");
  });

  it("triggers no_pathway_plan high alert when >= 1 has pathway plan not updated", () => {
    const records = [
      makeRecord({ pathway_plan_updated: false }),
    ];
    const alerts = identifyFinancialLiteracyAlerts(records);
    const noPlan = alerts.find((a) => a.type === "no_pathway_plan");
    expect(noPlan).toBeDefined();
    expect(noPlan!.severity).toBe("high");
  });

  it("triggers no_practical_exercise medium alert when >= 2 have no practical exercise", () => {
    const records = [
      makeRecord({ id: "r1", practical_exercise: false }),
      makeRecord({ id: "r2", practical_exercise: false }),
    ];
    const alerts = identifyFinancialLiteracyAlerts(records);
    const noPrac = alerts.find((a) => a.type === "no_practical_exercise");
    expect(noPrac).toBeDefined();
    expect(noPrac!.severity).toBe("medium");
  });

  it("triggers no_budget_created medium alert when >= 2 have no budget", () => {
    const records = [
      makeRecord({ id: "r1", budget_created: false }),
      makeRecord({ id: "r2", budget_created: false }),
    ];
    const alerts = identifyFinancialLiteracyAlerts(records);
    const noBudget = alerts.find((a) => a.type === "no_budget_created");
    expect(noBudget).toBeDefined();
    expect(noBudget!.severity).toBe("medium");
  });

  it("does NOT trigger no_practical_exercise when only 1 session lacks it", () => {
    const records = [
      makeRecord({ id: "r1", practical_exercise: false }),
    ];
    const alerts = identifyFinancialLiteracyAlerts(records);
    const noPrac = alerts.find((a) => a.type === "no_practical_exercise");
    expect(noPrac).toBeUndefined();
  });
});
