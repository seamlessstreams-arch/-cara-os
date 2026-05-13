// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LIFE SKILLS & INDEPENDENCE SERVICE TESTS
// Pure-function unit tests for child readiness computation, home readiness
// overview aggregation, life-skills alert identification, and constant
// validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../life-skills-service";
import {
  SKILL_DOMAINS,
  COMPETENCY_LEVELS,
  PATHWAY_PLAN_STATUS,
} from "../life-skills-service";
import type { SkillAssessment, PathwayPlan } from "../life-skills-service";

const {
  computeChildReadiness,
  computeHomeReadinessOverview,
  identifyLifeSkillsAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Total skills across all domains, derived from the constant. */
const TOTAL_SKILLS = SKILL_DOMAINS.reduce((sum, d) => sum + d.skills.length, 0);

/** Build a minimal SkillAssessment with sensible defaults. */
function makeSkillAssessment(
  overrides: Partial<SkillAssessment> = {},
): SkillAssessment {
  return {
    id: "id" in overrides ? overrides.id! : "sa-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    child_id: "child_id" in overrides ? overrides.child_id! : "child-1",
    child_name: "child_name" in overrides ? overrides.child_name! : "Alice",
    domain: "domain" in overrides ? overrides.domain! : "cooking_nutrition",
    skill: "skill" in overrides ? overrides.skill! : "meal_planning",
    competency_level:
      "competency_level" in overrides
        ? overrides.competency_level!
        : "competent",
    assessed_date:
      "assessed_date" in overrides
        ? overrides.assessed_date!
        : "2026-04-01",
    assessed_by:
      "assessed_by" in overrides ? overrides.assessed_by! : "staff-1",
    notes: "notes" in overrides ? overrides.notes! : null,
    evidence: "evidence" in overrides ? overrides.evidence! : null,
    created_at:
      "created_at" in overrides
        ? overrides.created_at!
        : "2026-04-01T00:00:00Z",
  };
}

/** Build a minimal PathwayPlan with sensible defaults. */
function makePathwayPlan(
  overrides: Partial<PathwayPlan> = {},
): PathwayPlan {
  return {
    id: "id" in overrides ? overrides.id! : "pp-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    child_id: "child_id" in overrides ? overrides.child_id! : "child-1",
    child_name: "child_name" in overrides ? overrides.child_name! : "Alice",
    status: "status" in overrides ? overrides.status! : "active",
    start_date:
      "start_date" in overrides ? overrides.start_date! : "2026-01-01",
    target_move_date:
      "target_move_date" in overrides
        ? overrides.target_move_date!
        : null,
    accommodation_plan:
      "accommodation_plan" in overrides
        ? overrides.accommodation_plan!
        : null,
    education_employment_plan:
      "education_employment_plan" in overrides
        ? overrides.education_employment_plan!
        : null,
    support_network:
      "support_network" in overrides
        ? overrides.support_network!
        : null,
    personal_adviser_name:
      "personal_adviser_name" in overrides
        ? overrides.personal_adviser_name!
        : null,
    last_reviewed:
      "last_reviewed" in overrides ? overrides.last_reviewed! : null,
    created_at:
      "created_at" in overrides
        ? overrides.created_at!
        : "2026-01-01T00:00:00Z",
    updated_at:
      "updated_at" in overrides
        ? overrides.updated_at!
        : "2026-01-01T00:00:00Z",
  };
}

// ── computeChildReadiness ─────────────────────────────────────────────────

describe("computeChildReadiness", () => {
  it("returns all zeros and nulls for empty assessments", () => {
    const result = computeChildReadiness([], "child-1");
    expect(result.total_skills_assessed).toBe(0);
    expect(result.total_skills).toBe(TOTAL_SKILLS);
    expect(result.overall_readiness).toBe(0);
    expect(result.strongest_domain).toBeNull();
    expect(result.weakest_domain).toBeNull();
    expect(result.not_assessed_count).toBe(TOTAL_SKILLS);
  });

  it("returns zeros when assessments belong to a different child", () => {
    const assessments = [
      makeSkillAssessment({ child_id: "child-other", competency_level: "independent" }),
    ];
    const result = computeChildReadiness(assessments, "child-1");
    expect(result.total_skills_assessed).toBe(0);
    expect(result.overall_readiness).toBe(0);
  });

  it("does not count 'not_assessed' competency level as assessed", () => {
    const assessments = [
      makeSkillAssessment({ competency_level: "not_assessed" }),
    ];
    const result = computeChildReadiness(assessments, "child-1");
    expect(result.total_skills_assessed).toBe(0);
    expect(result.not_assessed_count).toBe(TOTAL_SKILLS);
  });

  it("counts a single competent assessment correctly", () => {
    const assessments = [
      makeSkillAssessment({
        domain: "cooking_nutrition",
        skill: "meal_planning",
        competency_level: "competent",
      }),
    ];
    const result = computeChildReadiness(assessments, "child-1");
    expect(result.total_skills_assessed).toBe(1);
    // competent counts toward readiness: 1 / TOTAL_SKILLS * 100, rounded to 1dp
    expect(result.overall_readiness).toBe(
      Math.round((1 / TOTAL_SKILLS) * 1000) / 10,
    );
    expect(result.by_domain["cooking_nutrition"].assessed).toBe(1);
    expect(result.by_domain["cooking_nutrition"].competent_count).toBe(1);
    // avg_level for competent = index 3
    expect(result.by_domain["cooking_nutrition"].avg_level).toBe(3);
  });

  it("uses the latest assessment when multiple exist for the same skill", () => {
    const assessments = [
      makeSkillAssessment({
        domain: "cooking_nutrition",
        skill: "meal_planning",
        competency_level: "needs_support",
        assessed_date: "2026-01-01",
      }),
      makeSkillAssessment({
        id: "sa-2",
        domain: "cooking_nutrition",
        skill: "meal_planning",
        competency_level: "independent",
        assessed_date: "2026-04-01",
      }),
    ];
    const result = computeChildReadiness(assessments, "child-1");
    // Should use the later assessment (independent, index 4)
    expect(result.total_skills_assessed).toBe(1);
    expect(result.by_domain["cooking_nutrition"].avg_level).toBe(4);
    expect(result.by_domain["cooking_nutrition"].competent_count).toBe(1);
  });

  it("calculates avg_level correctly across multiple skills in a domain", () => {
    const assessments = [
      makeSkillAssessment({
        domain: "cooking_nutrition",
        skill: "meal_planning",
        competency_level: "needs_support", // index 1
      }),
      makeSkillAssessment({
        id: "sa-2",
        domain: "cooking_nutrition",
        skill: "basic_cooking",
        competency_level: "developing", // index 2
      }),
      makeSkillAssessment({
        id: "sa-3",
        domain: "cooking_nutrition",
        skill: "food_hygiene",
        competency_level: "independent", // index 4
      }),
    ];
    const result = computeChildReadiness(assessments, "child-1");
    expect(result.by_domain["cooking_nutrition"].assessed).toBe(3);
    // avg = (1 + 2 + 4) / 3 = 2.333... rounded to 2.33
    expect(result.by_domain["cooking_nutrition"].avg_level).toBe(2.33);
    // Only independent counts as competent_or_independent
    expect(result.by_domain["cooking_nutrition"].competent_count).toBe(1);
  });

  it("identifies strongest and weakest domains correctly", () => {
    const assessments = [
      // Cooking: independent (index 4)
      makeSkillAssessment({
        domain: "cooking_nutrition",
        skill: "meal_planning",
        competency_level: "independent",
      }),
      // Money: needs_support (index 1)
      makeSkillAssessment({
        id: "sa-2",
        domain: "money_management",
        skill: "budgeting",
        competency_level: "needs_support",
      }),
    ];
    const result = computeChildReadiness(assessments, "child-1");
    expect(result.strongest_domain).toBe("cooking_nutrition");
    expect(result.weakest_domain).toBe("money_management");
  });

  it("sets strongest and weakest to the same domain when only one domain is assessed", () => {
    const assessments = [
      makeSkillAssessment({
        domain: "personal_care",
        skill: "personal_hygiene",
        competency_level: "developing",
      }),
    ];
    const result = computeChildReadiness(assessments, "child-1");
    expect(result.strongest_domain).toBe("personal_care");
    expect(result.weakest_domain).toBe("personal_care");
  });

  it("calculates overall_readiness as percentage of competent+independent over total skills", () => {
    // Create 5 competent/independent assessments across different skills
    const assessments = [
      makeSkillAssessment({ id: "1", domain: "cooking_nutrition", skill: "meal_planning", competency_level: "competent" }),
      makeSkillAssessment({ id: "2", domain: "cooking_nutrition", skill: "basic_cooking", competency_level: "independent" }),
      makeSkillAssessment({ id: "3", domain: "money_management", skill: "budgeting", competency_level: "competent" }),
      makeSkillAssessment({ id: "4", domain: "personal_care", skill: "personal_hygiene", competency_level: "independent" }),
      makeSkillAssessment({ id: "5", domain: "home_management", skill: "cleaning", competency_level: "competent" }),
    ];
    const result = computeChildReadiness(assessments, "child-1");
    // 5 competent/independent out of TOTAL_SKILLS
    expect(result.overall_readiness).toBe(
      Math.round((5 / TOTAL_SKILLS) * 1000) / 10,
    );
  });

  it("does not count needs_support or developing toward readiness percentage", () => {
    const assessments = [
      makeSkillAssessment({ domain: "cooking_nutrition", skill: "meal_planning", competency_level: "needs_support" }),
      makeSkillAssessment({ id: "sa-2", domain: "cooking_nutrition", skill: "basic_cooking", competency_level: "developing" }),
    ];
    const result = computeChildReadiness(assessments, "child-1");
    expect(result.total_skills_assessed).toBe(2);
    expect(result.overall_readiness).toBe(0);
  });

  it("populates by_domain for all eight domains even when no assessments exist", () => {
    const result = computeChildReadiness([], "child-1");
    expect(Object.keys(result.by_domain)).toHaveLength(8);
    for (const domainDef of SKILL_DOMAINS) {
      expect(result.by_domain[domainDef.domain]).toEqual({
        assessed: 0,
        total: domainDef.skills.length,
        avg_level: 0,
        competent_count: 0,
      });
    }
  });

  it("handles an unknown competency_level by treating its index as 0", () => {
    const assessments = [
      makeSkillAssessment({
        domain: "cooking_nutrition",
        skill: "meal_planning",
        competency_level: "bogus_level",
      }),
    ];
    const result = computeChildReadiness(assessments, "child-1");
    // bogus_level !== "not_assessed" so it's counted as assessed
    expect(result.total_skills_assessed).toBe(1);
    // indexOf returns -1 for unknown level, code uses 0 when < 0
    expect(result.by_domain["cooking_nutrition"].avg_level).toBe(0);
  });
});

// ── computeHomeReadinessOverview ──────────────────────────────────────────

describe("computeHomeReadinessOverview", () => {
  it("returns zeros for empty assessments and pathway plans", () => {
    const result = computeHomeReadinessOverview([], []);
    expect(result.total_children).toBe(0);
    expect(result.avg_readiness).toBe(0);
    expect(result.children_with_pathway_plans).toBe(0);
    expect(result.pathway_plans_active).toBe(0);
    expect(result.children_needing_attention).toEqual([]);
  });

  it("counts unique children from both assessments and pathway plans", () => {
    const assessments = [
      makeSkillAssessment({ child_id: "child-1", child_name: "Alice" }),
      makeSkillAssessment({ id: "sa-2", child_id: "child-2", child_name: "Bob" }),
    ];
    const plans = [
      makePathwayPlan({ child_id: "child-3", child_name: "Charlie" }),
    ];
    const result = computeHomeReadinessOverview(assessments, plans);
    expect(result.total_children).toBe(3);
  });

  it("does not double-count a child who appears in both assessments and plans", () => {
    const assessments = [
      makeSkillAssessment({ child_id: "child-1", child_name: "Alice" }),
    ];
    const plans = [
      makePathwayPlan({ child_id: "child-1", child_name: "Alice" }),
    ];
    const result = computeHomeReadinessOverview(assessments, plans);
    expect(result.total_children).toBe(1);
  });

  it("counts children_with_pathway_plans as unique child IDs in plans", () => {
    const plans = [
      makePathwayPlan({ id: "pp-1", child_id: "child-1" }),
      makePathwayPlan({ id: "pp-2", child_id: "child-1", status: "completed" }),
      makePathwayPlan({ id: "pp-3", child_id: "child-2" }),
    ];
    const result = computeHomeReadinessOverview([], plans);
    expect(result.children_with_pathway_plans).toBe(2);
  });

  it("counts only active pathway plans", () => {
    const plans = [
      makePathwayPlan({ id: "pp-1", child_id: "child-1", status: "active" }),
      makePathwayPlan({ id: "pp-2", child_id: "child-2", status: "in_progress" }),
      makePathwayPlan({ id: "pp-3", child_id: "child-3", status: "active" }),
      makePathwayPlan({ id: "pp-4", child_id: "child-4", status: "completed" }),
    ];
    const result = computeHomeReadinessOverview([], plans);
    expect(result.pathway_plans_active).toBe(2);
  });

  it("calculates avg_readiness across all children", () => {
    // Child-1: 1 competent out of TOTAL_SKILLS
    // Child-2: 0 competent (needs_support)
    const assessments = [
      makeSkillAssessment({ child_id: "child-1", child_name: "Alice", competency_level: "competent" }),
      makeSkillAssessment({ id: "sa-2", child_id: "child-2", child_name: "Bob", competency_level: "needs_support" }),
    ];
    const result = computeHomeReadinessOverview(assessments, []);
    const child1Readiness = Math.round((1 / TOTAL_SKILLS) * 1000) / 10;
    const child2Readiness = 0;
    const expectedAvg = Math.round(((child1Readiness + child2Readiness) / 2) * 10) / 10;
    expect(result.avg_readiness).toBe(expectedAvg);
  });

  it("includes children below 30% readiness in children_needing_attention sorted ascending", () => {
    // Both children will have very low readiness (well below 30%)
    const assessments = [
      makeSkillAssessment({
        child_id: "child-1",
        child_name: "Alice",
        domain: "cooking_nutrition",
        skill: "meal_planning",
        competency_level: "competent",
      }),
      makeSkillAssessment({
        id: "sa-2",
        child_id: "child-2",
        child_name: "Bob",
        domain: "cooking_nutrition",
        skill: "meal_planning",
        competency_level: "needs_support",
      }),
    ];
    const result = computeHomeReadinessOverview(assessments, []);
    // Both have readiness < 30% (only 1/40 or 0/40 competent)
    expect(result.children_needing_attention).toHaveLength(2);
    // Sorted ascending by readiness: Bob (0%) first, then Alice
    expect(result.children_needing_attention[0].child_name).toBe("Bob");
    expect(result.children_needing_attention[1].child_name).toBe("Alice");
  });

  it("excludes children with readiness at or above 30% from needing attention", () => {
    // Give a child enough competent/independent skills to exceed 30%
    // Need competent/independent in at least 30% of TOTAL_SKILLS = 12 skills
    const skills = SKILL_DOMAINS.flatMap((d) =>
      d.skills.map((s) => ({ domain: d.domain, skill: s })),
    );
    const assessments = skills.slice(0, 12).map((s, i) =>
      makeSkillAssessment({
        id: `sa-${i}`,
        child_id: "child-1",
        child_name: "Alice",
        domain: s.domain,
        skill: s.skill,
        competency_level: "competent",
      }),
    );
    const result = computeHomeReadinessOverview(assessments, []);
    expect(result.children_needing_attention).toHaveLength(0);
  });

  it("populates by_domain_avg for all eight domains", () => {
    const result = computeHomeReadinessOverview([], []);
    expect(Object.keys(result.by_domain_avg)).toHaveLength(8);
    for (const domainDef of SKILL_DOMAINS) {
      expect(result.by_domain_avg[domainDef.domain]).toBe(0);
    }
  });

  it("averages domain levels across children who have assessments in that domain", () => {
    const assessments = [
      // Child-1: cooking avg_level = 4 (independent)
      makeSkillAssessment({
        child_id: "child-1",
        child_name: "Alice",
        domain: "cooking_nutrition",
        skill: "meal_planning",
        competency_level: "independent", // index 4
      }),
      // Child-2: cooking avg_level = 2 (developing)
      makeSkillAssessment({
        id: "sa-2",
        child_id: "child-2",
        child_name: "Bob",
        domain: "cooking_nutrition",
        skill: "meal_planning",
        competency_level: "developing", // index 2
      }),
    ];
    const result = computeHomeReadinessOverview(assessments, []);
    // Average of domain avg_levels: (4 + 2) / 2 = 3
    expect(result.by_domain_avg["cooking_nutrition"]).toBe(3);
  });

  it("treats child from pathway plan with no assessments as 0% readiness", () => {
    const plans = [
      makePathwayPlan({ child_id: "child-1", child_name: "Alice" }),
    ];
    const result = computeHomeReadinessOverview([], plans);
    expect(result.total_children).toBe(1);
    expect(result.avg_readiness).toBe(0);
    // 0% < 30% so should appear in needing attention
    expect(result.children_needing_attention).toHaveLength(1);
    expect(result.children_needing_attention[0].child_name).toBe("Alice");
  });
});

// ── identifyLifeSkillsAlerts ──────────────────────────────────────────────

describe("identifyLifeSkillsAlerts", () => {
  it("returns no alerts for empty inputs", () => {
    const alerts = identifyLifeSkillsAlerts([], []);
    expect(alerts).toEqual([]);
  });

  it("generates no_pathway_plan alert for plans with status not_started", () => {
    const plans = [
      makePathwayPlan({ child_name: "Alice", status: "not_started" }),
    ];
    const alerts = identifyLifeSkillsAlerts([], plans);
    const notStarted = alerts.filter((a) => a.type === "no_pathway_plan");
    expect(notStarted).toHaveLength(1);
    expect(notStarted[0].severity).toBe("high");
    expect(notStarted[0].child_name).toBe("Alice");
    expect(notStarted[0].message).toContain("pathway plan has not been started");
    expect(notStarted[0].message).toContain("Reg 14");
  });

  it("does not generate no_pathway_plan alert for active or in_progress plans", () => {
    const plans = [
      makePathwayPlan({ id: "pp-1", child_id: "child-1", status: "active" }),
      makePathwayPlan({ id: "pp-2", child_id: "child-2", status: "in_progress" }),
    ];
    const alerts = identifyLifeSkillsAlerts([], plans);
    const notStarted = alerts.filter((a) => a.type === "no_pathway_plan");
    expect(notStarted).toHaveLength(0);
  });

  it("generates low_readiness alert when overall readiness is below 30%", () => {
    // One competent skill out of TOTAL_SKILLS gives readiness well below 30%
    const assessments = [
      makeSkillAssessment({
        child_id: "child-1",
        child_name: "Alice",
        competency_level: "competent",
      }),
    ];
    const alerts = identifyLifeSkillsAlerts(assessments, []);
    const lowReadiness = alerts.filter((a) => a.type === "low_readiness");
    expect(lowReadiness).toHaveLength(1);
    expect(lowReadiness[0].severity).toBe("medium");
    expect(lowReadiness[0].child_name).toBe("Alice");
    expect(lowReadiness[0].message).toContain("below 30% threshold");
  });

  it("does not generate low_readiness alert when readiness is at or above 30%", () => {
    // Give enough competent/independent skills to exceed 30%
    const skills = SKILL_DOMAINS.flatMap((d) =>
      d.skills.map((s) => ({ domain: d.domain, skill: s })),
    );
    const assessments = skills.slice(0, 12).map((s, i) =>
      makeSkillAssessment({
        id: `sa-${i}`,
        child_id: "child-1",
        child_name: "Alice",
        domain: s.domain,
        skill: s.skill,
        competency_level: "competent",
      }),
    );
    const alerts = identifyLifeSkillsAlerts(assessments, []);
    const lowReadiness = alerts.filter((a) => a.type === "low_readiness");
    expect(lowReadiness).toHaveLength(0);
  });

  it("generates domain_concern alert when a domain has assessments but none competent/independent", () => {
    const assessments = [
      makeSkillAssessment({
        domain: "cooking_nutrition",
        skill: "meal_planning",
        competency_level: "needs_support",
      }),
      makeSkillAssessment({
        id: "sa-2",
        domain: "cooking_nutrition",
        skill: "basic_cooking",
        competency_level: "developing",
      }),
    ];
    const alerts = identifyLifeSkillsAlerts(assessments, []);
    const domainConcern = alerts.filter((a) => a.type === "domain_concern");
    expect(domainConcern.length).toBeGreaterThanOrEqual(1);
    const cookingConcern = domainConcern.find((a) =>
      a.message.includes("Cooking & Nutrition"),
    );
    expect(cookingConcern).toBeDefined();
    expect(cookingConcern!.severity).toBe("medium");
  });

  it("does not generate domain_concern when domain has at least one competent skill", () => {
    const assessments = [
      makeSkillAssessment({
        domain: "cooking_nutrition",
        skill: "meal_planning",
        competency_level: "competent",
      }),
      makeSkillAssessment({
        id: "sa-2",
        domain: "cooking_nutrition",
        skill: "basic_cooking",
        competency_level: "needs_support",
      }),
    ];
    const alerts = identifyLifeSkillsAlerts(assessments, []);
    const cookingConcern = alerts.filter(
      (a) => a.type === "domain_concern" && a.message.includes("Cooking"),
    );
    expect(cookingConcern).toHaveLength(0);
  });

  it("generates stale_assessment alert when most recent assessment is over 90 days old", () => {
    // Date far in the past to ensure deterministic result
    const assessments = [
      makeSkillAssessment({
        child_id: "child-1",
        child_name: "Alice",
        assessed_date: "2025-01-01",
      }),
    ];
    const alerts = identifyLifeSkillsAlerts(assessments, []);
    const stale = alerts.filter((a) => a.type === "stale_assessment");
    expect(stale).toHaveLength(1);
    expect(stale[0].severity).toBe("low");
    expect(stale[0].child_name).toBe("Alice");
    expect(stale[0].message).toContain("over 90 days old");
  });

  it("does not generate stale_assessment alert when assessment is recent", () => {
    // Use today's date to ensure it's within 90 days
    const today = new Date().toISOString().split("T")[0];
    const assessments = [
      makeSkillAssessment({
        child_id: "child-1",
        child_name: "Alice",
        assessed_date: today,
      }),
    ];
    const alerts = identifyLifeSkillsAlerts(assessments, []);
    const stale = alerts.filter((a) => a.type === "stale_assessment");
    expect(stale).toHaveLength(0);
  });

  it("generates no_assessments alert for child in pathway plan with no assessments", () => {
    const plans = [
      makePathwayPlan({
        child_id: "child-1",
        child_name: "Alice",
        status: "active",
      }),
    ];
    const alerts = identifyLifeSkillsAlerts([], plans);
    const noAssessments = alerts.filter((a) => a.type === "no_assessments");
    expect(noAssessments).toHaveLength(1);
    expect(noAssessments[0].severity).toBe("medium");
    expect(noAssessments[0].child_name).toBe("Alice");
    expect(noAssessments[0].message).toContain("no skill assessments recorded");
  });

  it("does not generate no_assessments alert when child has assessments", () => {
    const assessments = [
      makeSkillAssessment({ child_id: "child-1", child_name: "Alice" }),
    ];
    const plans = [
      makePathwayPlan({ child_id: "child-1", child_name: "Alice" }),
    ];
    const alerts = identifyLifeSkillsAlerts(assessments, plans);
    const noAssessments = alerts.filter((a) => a.type === "no_assessments");
    expect(noAssessments).toHaveLength(0);
  });

  it("generates multiple alert types for the same child simultaneously", () => {
    // Child with: not_started plan, old stale assessment, low readiness, domain concern
    const assessments = [
      makeSkillAssessment({
        child_id: "child-1",
        child_name: "Alice",
        domain: "cooking_nutrition",
        skill: "meal_planning",
        competency_level: "needs_support",
        assessed_date: "2025-01-01", // far in the past
      }),
    ];
    const plans = [
      makePathwayPlan({
        child_id: "child-1",
        child_name: "Alice",
        status: "not_started",
      }),
    ];
    const alerts = identifyLifeSkillsAlerts(assessments, plans);
    const types = new Set(alerts.map((a) => a.type));
    expect(types.has("no_pathway_plan")).toBe(true);
    expect(types.has("low_readiness")).toBe(true);
    expect(types.has("domain_concern")).toBe(true);
    expect(types.has("stale_assessment")).toBe(true);
  });

  it("handles multiple children independently", () => {
    const assessments = [
      // Alice: recent competent assessment
      makeSkillAssessment({
        id: "sa-1",
        child_id: "child-1",
        child_name: "Alice",
        competency_level: "competent",
        assessed_date: new Date().toISOString().split("T")[0],
      }),
    ];
    const plans = [
      // Bob: has plan but no assessments
      makePathwayPlan({
        child_id: "child-2",
        child_name: "Bob",
        status: "active",
      }),
    ];
    const alerts = identifyLifeSkillsAlerts(assessments, plans);
    // Bob should have no_assessments alert
    const bobNoAssessments = alerts.filter(
      (a) => a.type === "no_assessments" && a.child_name === "Bob",
    );
    expect(bobNoAssessments).toHaveLength(1);
    // Alice should NOT have no_assessments alert
    const aliceNoAssessments = alerts.filter(
      (a) => a.type === "no_assessments" && a.child_name === "Alice",
    );
    expect(aliceNoAssessments).toHaveLength(0);
  });
});

// ── Constants ────────────────────────────────────────────────────────────

describe("SKILL_DOMAINS", () => {
  it("has exactly 8 domains", () => {
    expect(SKILL_DOMAINS).toHaveLength(8);
  });

  it("each domain has the required shape with domain, label, and skills array", () => {
    for (const entry of SKILL_DOMAINS) {
      expect(typeof entry.domain).toBe("string");
      expect(typeof entry.label).toBe("string");
      expect(Array.isArray(entry.skills)).toBe(true);
      expect(entry.skills.length).toBeGreaterThan(0);
    }
  });

  it("each domain has exactly 5 skills", () => {
    for (const entry of SKILL_DOMAINS) {
      expect(entry.skills).toHaveLength(5);
    }
  });

  it("totals 40 skills across all domains", () => {
    expect(TOTAL_SKILLS).toBe(40);
  });

  it("includes cooking_nutrition as the first domain", () => {
    expect(SKILL_DOMAINS[0].domain).toBe("cooking_nutrition");
    expect(SKILL_DOMAINS[0].label).toBe("Cooking & Nutrition");
  });

  it("includes emotional_wellbeing as the last domain", () => {
    expect(SKILL_DOMAINS[7].domain).toBe("emotional_wellbeing");
    expect(SKILL_DOMAINS[7].label).toBe("Emotional Wellbeing");
  });

  it("has no duplicate domain keys", () => {
    const domains = SKILL_DOMAINS.map((d) => d.domain);
    expect(new Set(domains).size).toBe(domains.length);
  });

  it("has no duplicate skills within any domain", () => {
    for (const entry of SKILL_DOMAINS) {
      expect(new Set(entry.skills).size).toBe(entry.skills.length);
    }
  });
});

describe("COMPETENCY_LEVELS", () => {
  it("has exactly 5 levels", () => {
    expect(COMPETENCY_LEVELS).toHaveLength(5);
  });

  it("starts with not_assessed and ends with independent", () => {
    expect(COMPETENCY_LEVELS[0]).toBe("not_assessed");
    expect(COMPETENCY_LEVELS[4]).toBe("independent");
  });

  it("contains the expected progression order", () => {
    expect(COMPETENCY_LEVELS).toEqual([
      "not_assessed",
      "needs_support",
      "developing",
      "competent",
      "independent",
    ]);
  });
});

describe("PATHWAY_PLAN_STATUS", () => {
  it("has exactly 5 statuses", () => {
    expect(PATHWAY_PLAN_STATUS).toHaveLength(5);
  });

  it("starts with not_required and ends with completed", () => {
    expect(PATHWAY_PLAN_STATUS[0]).toBe("not_required");
    expect(PATHWAY_PLAN_STATUS[4]).toBe("completed");
  });

  it("contains the expected status values", () => {
    expect(PATHWAY_PLAN_STATUS).toEqual([
      "not_required",
      "not_started",
      "in_progress",
      "active",
      "completed",
    ]);
  });
});
