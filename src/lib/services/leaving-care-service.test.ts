import { describe, it, expect } from "vitest";
import {
  computeLeavingCareMetrics,
  identifyLeavingCareAlerts,
  type PathwayPlan,
  type IndependenceAssessment,
  type LeavingCareEntitlement,
} from "./leaving-care-service";

function makePlan(overrides: Partial<PathwayPlan> = {}): PathwayPlan {
  return {
    id: "pp-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alice",
    plan_type: "initial",
    status: "active",
    start_date: "2026-01-01",
    target_leaving_date: null,
    accommodation_plan: "Semi-independent",
    accommodation_type: "semi_independent",
    education_training_plan: "College",
    education_status: "full_time_education",
    employment_plan: null,
    financial_plan: null,
    benefit_entitlements: [],
    health_plan: "Registered with GP",
    registered_gp: true,
    registered_dentist: true,
    emotional_support_plan: null,
    social_network: [],
    life_skills_assessment: [],
    personal_advisor_name: "PA Smith",
    personal_advisor_contact: "01onal contact",
    reviewed_by: null,
    review_date: null,
    next_review_date: "2026-07-01",
    version: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeAssessment(overrides: Partial<IndependenceAssessment> = {}): IndependenceAssessment {
  return {
    id: "ia-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alice",
    assessment_date: "2026-04-01",
    assessed_by: "Staff A",
    skills: [],
    overall_readiness_score: 65,
    areas_of_strength: ["Cooking"],
    areas_needing_development: ["Budgeting"],
    recommended_actions: ["Budget workshop"],
    next_assessment_date: null,
    created_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

function makeEntitlement(overrides: Partial<LeavingCareEntitlement> = {}): LeavingCareEntitlement {
  return {
    id: "ent-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alice",
    entitlement_type: "setting_up_home_allowance",
    description: "Setting up home allowance",
    amount: 2000,
    frequency: "one_off",
    start_date: "2026-01-01",
    end_date: null,
    status: "active",
    claimed_date: null,
    claimed_amount: null,
    recorded_by: "Staff A",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeLeavingCareMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeLeavingCareMetrics([], [], [], 4);
    expect(m.total_pathway_plans).toBe(0);
    expect(m.active_plans).toBe(0);
    expect(m.plan_coverage_pct).toBe(0);
    expect(m.avg_readiness_score).toBeNull(); // fab-0.
    expect(m.total_entitlements).toBe(0);
    expect(m.total_claimed_amount).toBe(0);
  });

  it("computes correct metrics for populated data", () => {
    const plans = [
      makePlan({ id: "p1", child_id: "c1", status: "active", registered_gp: true, registered_dentist: true, personal_advisor_name: "PA A" }),
      makePlan({ id: "p2", child_id: "c2", status: "draft", registered_gp: false, registered_dentist: false, personal_advisor_name: null }),
      makePlan({ id: "p3", child_id: "c3", status: "completed" }),
    ];
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1", overall_readiness_score: 80 }),
      makeAssessment({ id: "a2", child_id: "c2", overall_readiness_score: 30 }),
    ];
    const entitlements = [
      makeEntitlement({ id: "e1", child_id: "c1", status: "claimed", claimed_amount: 1500 }),
      makeEntitlement({ id: "e2", child_id: "c2", status: "active" }),
    ];
    const m = computeLeavingCareMetrics(plans, assessments, entitlements, 4);
    expect(m.total_pathway_plans).toBe(3);
    expect(m.active_plans).toBe(1);
    expect(m.draft_plans).toBe(1);
    expect(m.completed_plans).toBe(1);
    // coverage: c1 (active) + c3 (completed) = 2 unique out of 4
    expect(m.plan_coverage_pct).toBe(50);
    // avg_readiness: (80 + 30) / 2 = 55
    expect(m.avg_readiness_score).toBe(55);
    expect(m.readiness_above_70_count).toBe(1);
    expect(m.readiness_below_40_count).toBe(1);
    expect(m.total_entitlements).toBe(2);
    expect(m.claimed_entitlements).toBe(1);
    expect(m.total_claimed_amount).toBe(1500);
    // entitlement take-up: 1/2 = 50%
    expect(m.entitlement_take_up_pct).toBe(50);
    expect(m.yp_with_gp).toBe(1);
    expect(m.plans_with_personal_advisor).toBe(1);
  });
});

describe("identifyLeavingCareAlerts", () => {
  it("returns empty alerts for empty data", () => {
    expect(identifyLeavingCareAlerts([], [], [])).toEqual([]);
  });

  it("triggers no_personal_advisor alert (high)", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", personal_advisor_name: null, child_name: "Alice" }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const found = alerts.find((a) => a.type === "no_personal_advisor");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("triggers overdue_pathway_review alert for overdue review", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", next_review_date: "2026-04-01", child_name: "Bob" }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const found = alerts.find((a) => a.type === "overdue_pathway_review");
    expect(found).toBeDefined();
  });

  it("triggers no_gp_registration alert for child without GP (medium)", () => {
    const plans = [
      makePlan({ id: "p1", status: "active", registered_gp: false, child_name: "Charlie" }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const found = alerts.find((a) => a.type === "no_gp_registration");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("triggers low_readiness_score alert for score below 40", () => {
    const assessments = [
      makeAssessment({ id: "a1", child_id: "c1", child_name: "Diana", overall_readiness_score: 25 }),
    ];
    const alerts = identifyLeavingCareAlerts([], assessments, []);
    const found = alerts.find((a) => a.type === "low_readiness_score");
    expect(found).toBeDefined();
  });

  it("triggers unclaimed_entitlements when child has >= 2 unclaimed (medium)", () => {
    const entitlements = [
      makeEntitlement({ id: "e1", child_id: "c1", child_name: "Eve", status: "active", claimed_date: null, entitlement_type: "setting_up_home_allowance" }),
      makeEntitlement({ id: "e2", child_id: "c1", child_name: "Eve", status: "active", claimed_date: null, entitlement_type: "clothing_allowance" }),
    ];
    const alerts = identifyLeavingCareAlerts([], [], entitlements);
    const found = alerts.find((a) => a.type === "unclaimed_entitlements");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("triggers expired_unclaimed_entitlement for expired unclaimed (low)", () => {
    const entitlements = [
      makeEntitlement({ id: "e1", status: "expired", claimed_date: null, child_name: "Frank", entitlement_type: "education_bursary" }),
    ];
    const alerts = identifyLeavingCareAlerts([], [], entitlements);
    const found = alerts.find((a) => a.type === "expired_unclaimed_entitlement");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("low");
  });

  it("triggers stale_draft_plan for draft sitting > 30 days (medium)", () => {
    const plans = [
      makePlan({ id: "p1", status: "draft", child_name: "Grace", created_at: "2026-01-01T00:00:00Z" }),
    ];
    const alerts = identifyLeavingCareAlerts(plans, [], []);
    const found = alerts.find((a) => a.type === "stale_draft_plan");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });
});
