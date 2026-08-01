import { describe, it, expect } from "vitest";
import {
  computeTransitionPlanningMetrics,
  identifyTransitionPlanningAlerts,
  type TransitionPlanningReadinessRecord,
} from "./transition-planning-readiness-service";

// ── Factory ──────────────────────────────────────────────────────────────

function makeRecord(
  overrides: Partial<TransitionPlanningReadinessRecord> = {},
): TransitionPlanningReadinessRecord {
  return {
    id: "r1",
    home_id: "h1",
    transition_type: "leaving_care",
    readiness_level: "mostly_ready",
    independence_skill: "good",
    pathway_plan_status: "in_place",
    assessment_date: "2025-04-01",
    child_name: "Alex",
    child_id: "c1",
    assessed_by: "Staff A",
    child_views_included: true,
    life_skills_assessed: true,
    budgeting_skills: true,
    cooking_skills: true,
    housing_identified: true,
    education_employment_plan: true,
    health_needs_addressed: true,
    social_network_mapped: true,
    personal_advisor_allocated: true,
    social_worker_involved: true,
    care_plan_reflects: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2025-04-01",
    updated_at: "2025-04-01",
    ...overrides,
  };
}

// ── computeTransitionPlanningMetrics ─────────────────────────────────────

describe("computeTransitionPlanningMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeTransitionPlanningMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.not_ready_count).toBe(0);
    expect(m.not_assessed_count).toBe(0);
    expect(m.overdue_pathway_count).toBe(0);
    expect(m.child_views_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts not_ready and not_assessed records", () => {
    const records = [
      makeRecord({ readiness_level: "not_ready" }),
      makeRecord({ id: "r2", readiness_level: "not_assessed" }),
      makeRecord({ id: "r3", readiness_level: "fully_ready" }),
    ];
    const m = computeTransitionPlanningMetrics(records);
    expect(m.not_ready_count).toBe(1);
    expect(m.not_assessed_count).toBe(1);
  });

  it("counts overdue and not_started pathway plans", () => {
    const records = [
      makeRecord({ pathway_plan_status: "overdue" }),
      makeRecord({ id: "r2", pathway_plan_status: "not_started" }),
    ];
    const m = computeTransitionPlanningMetrics(records);
    expect(m.overdue_pathway_count).toBe(1);
    expect(m.not_started_pathway_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const records = [
      makeRecord({ child_views_included: true, life_skills_assessed: true }),
      makeRecord({ id: "r2", child_views_included: false, life_skills_assessed: false }),
    ];
    const m = computeTransitionPlanningMetrics(records);
    expect(m.child_views_rate).toBe(50);
    expect(m.life_skills_rate).toBe(50);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ child_name: "Alex" }),
      makeRecord({ id: "r2", child_name: "Alex" }),
      makeRecord({ id: "r3", child_name: "Jordan" }),
    ];
    const m = computeTransitionPlanningMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("builds breakdown by transition_type", () => {
    const records = [
      makeRecord({ transition_type: "leaving_care" }),
      makeRecord({ id: "r2", transition_type: "leaving_care" }),
      makeRecord({ id: "r3", transition_type: "placement_move" }),
    ];
    const m = computeTransitionPlanningMetrics(records);
    expect(m.by_transition_type["leaving_care"]).toBe(2);
    expect(m.by_transition_type["placement_move"]).toBe(1);
  });
});

// ── identifyTransitionPlanningAlerts ─────────────────────────────────────

describe("identifyTransitionPlanningAlerts", () => {
  it("returns empty for no records", () => {
    expect(identifyTransitionPlanningAlerts([])).toEqual([]);
  });

  it("triggers critical alert for leaving_care + not_ready + pathway overdue", () => {
    const records = [
      makeRecord({
        transition_type: "leaving_care",
        readiness_level: "not_ready",
        pathway_plan_status: "overdue",
      }),
    ];
    const alerts = identifyTransitionPlanningAlerts(records);
    expect(alerts.some((a) => a.type === "leaving_care_not_ready" && a.severity === "critical")).toBe(true);
  });

  it("triggers high alert for any overdue pathway", () => {
    const records = [
      makeRecord({ pathway_plan_status: "overdue" }),
    ];
    const alerts = identifyTransitionPlanningAlerts(records);
    expect(alerts.some((a) => a.type === "pathway_overdue" && a.severity === "high")).toBe(true);
  });

  it("triggers high alert for housing not identified", () => {
    const records = [
      makeRecord({ housing_identified: false }),
    ];
    const alerts = identifyTransitionPlanningAlerts(records);
    expect(alerts.some((a) => a.type === "housing_not_identified" && a.severity === "high")).toBe(true);
  });

  it("triggers medium alert for 2+ records without life skills assessed", () => {
    const records = [
      makeRecord({ life_skills_assessed: false }),
      makeRecord({ id: "r2", life_skills_assessed: false }),
    ];
    const alerts = identifyTransitionPlanningAlerts(records);
    expect(alerts.some((a) => a.type === "life_skills_not_assessed" && a.severity === "medium")).toBe(true);
  });

  it("triggers medium alert for 2+ records without personal advisor", () => {
    const records = [
      makeRecord({ personal_advisor_allocated: false }),
      makeRecord({ id: "r2", personal_advisor_allocated: false }),
    ];
    const alerts = identifyTransitionPlanningAlerts(records);
    expect(alerts.some((a) => a.type === "no_personal_advisor" && a.severity === "medium")).toBe(true);
  });

  it("does NOT trigger life_skills alert for only 1 record", () => {
    const records = [
      makeRecord({ life_skills_assessed: false }),
    ];
    const alerts = identifyTransitionPlanningAlerts(records);
    expect(alerts.some((a) => a.type === "life_skills_not_assessed")).toBe(false);
  });
});
