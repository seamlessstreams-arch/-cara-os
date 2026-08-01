import { describe, it, expect } from "vitest";
import {
  computeChildReadiness,
  computeHomeReadinessOverview,
  identifyLifeSkillsAlerts,
  SKILL_DOMAINS,
  type SkillAssessment,
  type PathwayPlan,
} from "./life-skills-service";

const TOTAL_SKILLS = SKILL_DOMAINS.reduce((sum, d) => sum + d.skills.length, 0);

function makeAssessment(
  overrides: Partial<SkillAssessment> = {},
): SkillAssessment {
  return {
    id: "sa-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Child A",
    domain: "cooking_nutrition",
    skill: "meal_planning",
    competency_level: "competent",
    assessed_date: "2026-05-10",
    assessed_by: "Staff A",
    notes: null,
    evidence: null,
    created_at: "2026-05-10T10:00:00Z",
    ...overrides,
  };
}

function makePlan(
  overrides: Partial<PathwayPlan> = {},
): PathwayPlan {
  return {
    id: "pp-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Child A",
    status: "active",
    start_date: "2026-01-01",
    target_move_date: null,
    accommodation_plan: null,
    education_employment_plan: null,
    support_network: null,
    personal_adviser_name: null,
    last_reviewed: null,
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeChildReadiness", () => {
  it("returns zero readiness when no assessments exist", () => {
    const r = computeChildReadiness([], "child-1");
    expect(r.total_skills_assessed).toBe(0);
    expect(r.total_skills).toBe(TOTAL_SKILLS);
    expect(r.overall_readiness).toBe(0);
    expect(r.strongest_domain).toBeNull();
    expect(r.weakest_domain).toBeNull();
    expect(r.not_assessed_count).toBe(TOTAL_SKILLS);
  });

  it("computes readiness for assessed skills", () => {
    const assessments = [
      makeAssessment({ id: "1", domain: "cooking_nutrition", skill: "meal_planning", competency_level: "competent" }),
      makeAssessment({ id: "2", domain: "cooking_nutrition", skill: "basic_cooking", competency_level: "independent" }),
      makeAssessment({ id: "3", domain: "money_management", skill: "budgeting", competency_level: "needs_support" }),
    ];
    const r = computeChildReadiness(assessments, "child-1");
    expect(r.total_skills_assessed).toBe(3);
    // 2 competent/independent out of TOTAL_SKILLS
    expect(r.overall_readiness).toBe(Math.round((2 / TOTAL_SKILLS) * 1000) / 10);
    expect(r.strongest_domain).toBe("cooking_nutrition");
    expect(r.weakest_domain).toBe("money_management");
    expect(r.by_domain["cooking_nutrition"].competent_count).toBe(2);
    expect(r.by_domain["money_management"].competent_count).toBe(0);
  });

  it("uses latest assessment per skill", () => {
    const assessments = [
      makeAssessment({ id: "1", domain: "cooking_nutrition", skill: "meal_planning", competency_level: "needs_support", assessed_date: "2026-01-01" }),
      makeAssessment({ id: "2", domain: "cooking_nutrition", skill: "meal_planning", competency_level: "independent", assessed_date: "2026-05-01" }),
    ];
    const r = computeChildReadiness(assessments, "child-1");
    expect(r.total_skills_assessed).toBe(1);
    expect(r.by_domain["cooking_nutrition"].competent_count).toBe(1);
  });
});

describe("computeHomeReadinessOverview", () => {
  it("returns zeroes for empty data", () => {
    const r = computeHomeReadinessOverview([], []);
    expect(r.total_children).toBe(0);
    expect(r.avg_readiness).toBeNull();; expect(r.children_with_pathway_plans).toBe(0);
    expect(r.pathway_plans_active).toBe(0);
  });

  it("includes children from both assessments and pathway plans", () => {
    const assessments = [
      makeAssessment({ child_id: "c1", child_name: "Child 1" }),
    ];
    const plans = [
      makePlan({ child_id: "c2", child_name: "Child 2", status: "active" }),
    ];
    const r = computeHomeReadinessOverview(assessments, plans);
    expect(r.total_children).toBe(2);
    expect(r.children_with_pathway_plans).toBe(1);
    expect(r.pathway_plans_active).toBe(1);
  });

  it("identifies children needing attention (readiness < 30%)", () => {
    // child with only needs_support-level skills -> readiness < 30%
    const assessments = [
      makeAssessment({ child_id: "c1", child_name: "Struggling Child", competency_level: "needs_support" }),
    ];
    const r = computeHomeReadinessOverview(assessments, []);
    expect(r.children_needing_attention.length).toBe(1);
    expect(r.children_needing_attention[0].child_name).toBe("Struggling Child");
  });
});

describe("identifyLifeSkillsAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyLifeSkillsAlerts([], [])).toHaveLength(0);
  });

  it("triggers no_pathway_plan (high) when plan status is not_started", () => {
    const plans = [
      makePlan({ child_id: "c1", child_name: "Teen", status: "not_started" }),
    ];
    const alerts = identifyLifeSkillsAlerts([], plans);
    const a = alerts.find((x) => x.type === "no_pathway_plan");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers low_readiness (medium) when readiness < 30%", () => {
    const assessments = [
      makeAssessment({ child_id: "c1", child_name: "Child A", competency_level: "needs_support" }),
    ];
    const alerts = identifyLifeSkillsAlerts(assessments, []);
    const a = alerts.find((x) => x.type === "low_readiness");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });

  it("triggers domain_concern (medium) when a domain has assessed skills but 0 competent/independent", () => {
    const assessments = [
      makeAssessment({ child_id: "c1", child_name: "Child A", domain: "cooking_nutrition", skill: "meal_planning", competency_level: "needs_support" }),
    ];
    const alerts = identifyLifeSkillsAlerts(assessments, []);
    const a = alerts.find((x) => x.type === "domain_concern");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });

  it("triggers stale_assessment (low) when most recent assessment > 90 days old", () => {
    const assessments = [
      makeAssessment({ child_id: "c1", child_name: "Child A", assessed_date: "2026-01-01" }),
    ];
    const alerts = identifyLifeSkillsAlerts(assessments, []);
    const a = alerts.find((x) => x.type === "stale_assessment");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("low");
  });

  it("triggers no_assessments (medium) when child has pathway plan but no assessments", () => {
    const plans = [
      makePlan({ child_id: "c1", child_name: "Child A", status: "active" }),
    ];
    const alerts = identifyLifeSkillsAlerts([], plans);
    const a = alerts.find((x) => x.type === "no_assessments");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });
});
