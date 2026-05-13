// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INDEPENDENCE PREPARATION SERVICE TESTS
// Pure-function unit tests for independence metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 5 (engaging with the wider community),
// Reg 6 (quality of care — preparing for independence),
// Reg 7 (children's views — independence goals).
// SCCIF: Overall Experiences — "Young people are supported to develop
// skills for independence." "Preparation begins early."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  SKILL_AREAS,
  COMPETENCY_LEVELS,
  ASSESSMENT_FREQUENCIES,
  listSkills,
  createSkill,
  updateSkill,
} from "../independence-preparation-service";

import type {
  IndependenceSkill,
  SkillArea,
  CompetencyLevel,
} from "../independence-preparation-service";

const { computeIndependenceMetrics, identifyIndependenceAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Date string N days in the future from now. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal IndependenceSkill with sensible defaults. */
function makeSkill(overrides: Partial<IndependenceSkill> = {}): IndependenceSkill {
  return {
    id: "skill-1",
    home_id: "home-1",
    child_name: "Alice Smith",
    child_id: "child-1",
    skill_area: "cooking_nutrition",
    competency_level: "developing",
    assessed_date: daysAgo(7),
    assessed_by: "staff-1",
    target_level: "competent",
    target_date: daysFromNow(90),
    activities_completed: ["boiled eggs", "made toast"],
    young_person_views: "I want to learn to cook pasta",
    next_steps: ["learn to cook a simple meal"],
    support_needed: null,
    mentor_assigned: null,
    notes: null,
    created_at: daysAgoISO(30),
    updated_at: daysAgoISO(7),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("SKILL_AREAS", () => {
  it("has exactly 15 entries", () => {
    expect(SKILL_AREAS).toHaveLength(15);
  });

  it("contains unique area values", () => {
    const values = SKILL_AREAS.map((s) => s.area);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = SKILL_AREAS.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes cooking_nutrition", () => {
    expect(SKILL_AREAS.find((s) => s.area === "cooking_nutrition")).toBeTruthy();
  });

  it("includes budgeting_finance", () => {
    expect(SKILL_AREAS.find((s) => s.area === "budgeting_finance")).toBeTruthy();
  });

  it("includes household_tasks", () => {
    expect(SKILL_AREAS.find((s) => s.area === "household_tasks")).toBeTruthy();
  });

  it("includes personal_hygiene", () => {
    expect(SKILL_AREAS.find((s) => s.area === "personal_hygiene")).toBeTruthy();
  });

  it("includes healthcare_management", () => {
    expect(SKILL_AREAS.find((s) => s.area === "healthcare_management")).toBeTruthy();
  });

  it("includes travel_transport", () => {
    expect(SKILL_AREAS.find((s) => s.area === "travel_transport")).toBeTruthy();
  });

  it("includes employment_readiness", () => {
    expect(SKILL_AREAS.find((s) => s.area === "employment_readiness")).toBeTruthy();
  });

  it("includes education_training", () => {
    expect(SKILL_AREAS.find((s) => s.area === "education_training")).toBeTruthy();
  });

  it("includes housing_knowledge", () => {
    expect(SKILL_AREAS.find((s) => s.area === "housing_knowledge")).toBeTruthy();
  });

  it("includes social_relationships", () => {
    expect(SKILL_AREAS.find((s) => s.area === "social_relationships")).toBeTruthy();
  });

  it("includes digital_literacy", () => {
    expect(SKILL_AREAS.find((s) => s.area === "digital_literacy")).toBeTruthy();
  });

  it("includes emotional_resilience", () => {
    expect(SKILL_AREAS.find((s) => s.area === "emotional_resilience")).toBeTruthy();
  });

  it("includes safety_awareness", () => {
    expect(SKILL_AREAS.find((s) => s.area === "safety_awareness")).toBeTruthy();
  });

  it("includes rights_entitlements", () => {
    expect(SKILL_AREAS.find((s) => s.area === "rights_entitlements")).toBeTruthy();
  });

  it("includes community_engagement", () => {
    expect(SKILL_AREAS.find((s) => s.area === "community_engagement")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of SKILL_AREAS) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("COMPETENCY_LEVELS", () => {
  it("has exactly 5 entries", () => {
    expect(COMPETENCY_LEVELS).toHaveLength(5);
  });

  it("contains unique level values", () => {
    const values = COMPETENCY_LEVELS.map((c) => c.level);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = COMPETENCY_LEVELS.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes not_started", () => {
    expect(COMPETENCY_LEVELS.find((c) => c.level === "not_started")).toBeTruthy();
  });

  it("includes emerging", () => {
    expect(COMPETENCY_LEVELS.find((c) => c.level === "emerging")).toBeTruthy();
  });

  it("includes developing", () => {
    expect(COMPETENCY_LEVELS.find((c) => c.level === "developing")).toBeTruthy();
  });

  it("includes competent", () => {
    expect(COMPETENCY_LEVELS.find((c) => c.level === "competent")).toBeTruthy();
  });

  it("includes independent", () => {
    expect(COMPETENCY_LEVELS.find((c) => c.level === "independent")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const c of COMPETENCY_LEVELS) {
      expect(c.label.length).toBeGreaterThan(0);
    }
  });
});

describe("ASSESSMENT_FREQUENCIES", () => {
  it("has exactly 3 entries", () => {
    expect(ASSESSMENT_FREQUENCIES).toHaveLength(3);
  });

  it("contains unique frequency values", () => {
    const values = ASSESSMENT_FREQUENCIES.map((f) => f.frequency);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = ASSESSMENT_FREQUENCIES.map((f) => f.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes monthly", () => {
    expect(ASSESSMENT_FREQUENCIES.find((f) => f.frequency === "monthly")).toBeTruthy();
  });

  it("includes quarterly", () => {
    expect(ASSESSMENT_FREQUENCIES.find((f) => f.frequency === "quarterly")).toBeTruthy();
  });

  it("includes six_monthly", () => {
    expect(ASSESSMENT_FREQUENCIES.find((f) => f.frequency === "six_monthly")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const f of ASSESSMENT_FREQUENCIES) {
      expect(f.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeIndependenceMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeIndependenceMetrics", () => {
  it("returns zeroed metrics for empty skills array", () => {
    const m = computeIndependenceMetrics([], 0);
    expect(m.total_assessments).toBe(0);
    expect(m.children_assessed).toBe(0);
    expect(m.assessment_coverage).toBe(0);
    expect(m.not_started_count).toBe(0);
    expect(m.emerging_count).toBe(0);
    expect(m.developing_count).toBe(0);
    expect(m.competent_count).toBe(0);
    expect(m.independent_count).toBe(0);
    expect(m.on_target_count).toBe(0);
    expect(m.mentor_assigned_rate).toBe(0);
    expect(m.young_person_views_rate).toBe(0);
    expect(m.average_activities_per_skill).toBe(0);
    expect(m.skills_at_target).toBe(0);
    expect(Object.keys(m.by_skill_area)).toHaveLength(0);
    expect(Object.keys(m.by_competency_level)).toHaveLength(0);
    expect(Object.keys(m.by_child)).toHaveLength(0);
  });

  // ── total_assessments ────────────────────────────────────────────────

  it("total_assessments equals the number of skills", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1" }),
      makeSkill({ id: "s2", child_id: "c2" }),
      makeSkill({ id: "s3", child_id: "c3" }),
    ];
    const m = computeIndependenceMetrics(skills, 5);
    expect(m.total_assessments).toBe(3);
  });

  it("total_assessments is 1 for single skill", () => {
    const m = computeIndependenceMetrics([makeSkill()], 1);
    expect(m.total_assessments).toBe(1);
  });

  // ── children_assessed ────────────────────────────────────────────────

  it("children_assessed counts unique child IDs", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", skill_area: "cooking_nutrition" }),
      makeSkill({ id: "s2", child_id: "c1", skill_area: "budgeting_finance" }),
      makeSkill({ id: "s3", child_id: "c2", skill_area: "cooking_nutrition" }),
    ];
    const m = computeIndependenceMetrics(skills, 3);
    expect(m.children_assessed).toBe(2);
  });

  it("children_assessed is 1 when all skills belong to same child", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", skill_area: "cooking_nutrition" }),
      makeSkill({ id: "s2", child_id: "c1", skill_area: "travel_transport" }),
      makeSkill({ id: "s3", child_id: "c1", skill_area: "digital_literacy" }),
    ];
    const m = computeIndependenceMetrics(skills, 5);
    expect(m.children_assessed).toBe(1);
  });

  it("children_assessed equals total when each skill is a different child", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1" }),
      makeSkill({ id: "s2", child_id: "c2" }),
      makeSkill({ id: "s3", child_id: "c3" }),
      makeSkill({ id: "s4", child_id: "c4" }),
    ];
    const m = computeIndependenceMetrics(skills, 4);
    expect(m.children_assessed).toBe(4);
  });

  // ── assessment_coverage ──────────────────────────────────────────────

  it("assessment_coverage is 100 when all children assessed", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1" }),
      makeSkill({ id: "s2", child_id: "c2" }),
    ];
    const m = computeIndependenceMetrics(skills, 2);
    expect(m.assessment_coverage).toBe(100);
  });

  it("assessment_coverage is 50 when half the children assessed", () => {
    const skills = [makeSkill({ id: "s1", child_id: "c1" })];
    const m = computeIndependenceMetrics(skills, 2);
    expect(m.assessment_coverage).toBe(50);
  });

  it("assessment_coverage is 0 when totalChildren is 0", () => {
    const m = computeIndependenceMetrics([], 0);
    expect(m.assessment_coverage).toBe(0);
  });

  it("assessment_coverage rounds to one decimal place", () => {
    const skills = [makeSkill({ id: "s1", child_id: "c1" })];
    const m = computeIndependenceMetrics(skills, 3);
    expect(m.assessment_coverage).toBe(33.3);
  });

  it("assessment_coverage is 0 with empty skills and positive totalChildren", () => {
    const m = computeIndependenceMetrics([], 5);
    expect(m.assessment_coverage).toBe(0);
  });

  // ── competency level counts ──────────────────────────────────────────

  it("not_started_count counts skills at not_started", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "not_started" }),
      makeSkill({ id: "s2", competency_level: "not_started" }),
      makeSkill({ id: "s3", competency_level: "emerging" }),
    ];
    const m = computeIndependenceMetrics(skills, 3);
    expect(m.not_started_count).toBe(2);
  });

  it("emerging_count counts skills at emerging", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "emerging" }),
      makeSkill({ id: "s2", competency_level: "developing" }),
      makeSkill({ id: "s3", competency_level: "emerging" }),
    ];
    const m = computeIndependenceMetrics(skills, 3);
    expect(m.emerging_count).toBe(2);
  });

  it("developing_count counts skills at developing", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "developing" }),
      makeSkill({ id: "s2", competency_level: "developing" }),
      makeSkill({ id: "s3", competency_level: "developing" }),
    ];
    const m = computeIndependenceMetrics(skills, 3);
    expect(m.developing_count).toBe(3);
  });

  it("competent_count counts skills at competent", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "competent" }),
      makeSkill({ id: "s2", competency_level: "independent" }),
    ];
    const m = computeIndependenceMetrics(skills, 2);
    expect(m.competent_count).toBe(1);
  });

  it("independent_count counts skills at independent", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "independent" }),
      makeSkill({ id: "s2", competency_level: "independent" }),
      makeSkill({ id: "s3", competency_level: "competent" }),
    ];
    const m = computeIndependenceMetrics(skills, 3);
    expect(m.independent_count).toBe(2);
  });

  it("all competency counts sum to total_assessments", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "not_started" }),
      makeSkill({ id: "s2", competency_level: "emerging" }),
      makeSkill({ id: "s3", competency_level: "developing" }),
      makeSkill({ id: "s4", competency_level: "competent" }),
      makeSkill({ id: "s5", competency_level: "independent" }),
    ];
    const m = computeIndependenceMetrics(skills, 5);
    const sum =
      m.not_started_count +
      m.emerging_count +
      m.developing_count +
      m.competent_count +
      m.independent_count;
    expect(sum).toBe(m.total_assessments);
  });

  it("all competency counts are 0 for empty skills", () => {
    const m = computeIndependenceMetrics([], 0);
    expect(m.not_started_count).toBe(0);
    expect(m.emerging_count).toBe(0);
    expect(m.developing_count).toBe(0);
    expect(m.competent_count).toBe(0);
    expect(m.independent_count).toBe(0);
  });

  // ── on_target_count / skills_at_target ───────────────────────────────

  it("on_target_count counts skills at or above target level", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "competent", target_level: "competent" }),
      makeSkill({ id: "s2", competency_level: "independent", target_level: "competent" }),
      makeSkill({ id: "s3", competency_level: "developing", target_level: "competent" }),
    ];
    const m = computeIndependenceMetrics(skills, 3);
    expect(m.on_target_count).toBe(2);
  });

  it("on_target_count is 0 when all skills below target", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "not_started", target_level: "emerging" }),
      makeSkill({ id: "s2", competency_level: "emerging", target_level: "competent" }),
    ];
    const m = computeIndependenceMetrics(skills, 2);
    expect(m.on_target_count).toBe(0);
  });

  it("on_target_count equals total when all at or above target", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "independent", target_level: "not_started" }),
      makeSkill({ id: "s2", competency_level: "competent", target_level: "developing" }),
      makeSkill({ id: "s3", competency_level: "emerging", target_level: "emerging" }),
    ];
    const m = computeIndependenceMetrics(skills, 3);
    expect(m.on_target_count).toBe(3);
  });

  it("skills_at_target equals on_target_count", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "competent", target_level: "competent" }),
      makeSkill({ id: "s2", competency_level: "developing", target_level: "independent" }),
    ];
    const m = computeIndependenceMetrics(skills, 2);
    expect(m.skills_at_target).toBe(m.on_target_count);
  });

  it("on_target_count uses level ordering not_started=0 emerging=1 developing=2 competent=3 independent=4", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "not_started", target_level: "not_started" }),
      makeSkill({ id: "s2", competency_level: "emerging", target_level: "not_started" }),
      makeSkill({ id: "s3", competency_level: "developing", target_level: "emerging" }),
      makeSkill({ id: "s4", competency_level: "competent", target_level: "developing" }),
      makeSkill({ id: "s5", competency_level: "independent", target_level: "competent" }),
    ];
    const m = computeIndependenceMetrics(skills, 5);
    expect(m.on_target_count).toBe(5);
  });

  it("not_started is below emerging in level ordering", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "not_started", target_level: "emerging" }),
    ];
    const m = computeIndependenceMetrics(skills, 1);
    expect(m.on_target_count).toBe(0);
  });

  it("independent is at or above every target level", () => {
    const levels: CompetencyLevel[] = ["not_started", "emerging", "developing", "competent", "independent"];
    const skills = levels.map((lvl, i) =>
      makeSkill({ id: `s${i}`, competency_level: "independent", target_level: lvl }),
    );
    const m = computeIndependenceMetrics(skills, 5);
    expect(m.on_target_count).toBe(5);
  });

  it("not_started is only at target when target is not_started", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "not_started", target_level: "not_started" }),
      makeSkill({ id: "s2", competency_level: "not_started", target_level: "emerging" }),
    ];
    const m = computeIndependenceMetrics(skills, 2);
    expect(m.on_target_count).toBe(1);
  });

  // ── mentor_assigned_rate ─────────────────────────────────────────────

  it("mentor_assigned_rate is 100 when all skills have mentors", () => {
    const skills = [
      makeSkill({ id: "s1", mentor_assigned: "Mentor A" }),
      makeSkill({ id: "s2", mentor_assigned: "Mentor B" }),
    ];
    const m = computeIndependenceMetrics(skills, 2);
    expect(m.mentor_assigned_rate).toBe(100);
  });

  it("mentor_assigned_rate is 0 when no skills have mentors", () => {
    const skills = [
      makeSkill({ id: "s1", mentor_assigned: null }),
      makeSkill({ id: "s2", mentor_assigned: null }),
    ];
    const m = computeIndependenceMetrics(skills, 2);
    expect(m.mentor_assigned_rate).toBe(0);
  });

  it("mentor_assigned_rate is 50 when half have mentors", () => {
    const skills = [
      makeSkill({ id: "s1", mentor_assigned: "Mentor A" }),
      makeSkill({ id: "s2", mentor_assigned: null }),
    ];
    const m = computeIndependenceMetrics(skills, 2);
    expect(m.mentor_assigned_rate).toBe(50);
  });

  it("mentor_assigned_rate rounds to one decimal place", () => {
    const skills = [
      makeSkill({ id: "s1", mentor_assigned: "M" }),
      makeSkill({ id: "s2", mentor_assigned: null }),
      makeSkill({ id: "s3", mentor_assigned: null }),
    ];
    const m = computeIndependenceMetrics(skills, 3);
    expect(m.mentor_assigned_rate).toBe(33.3);
  });

  it("mentor_assigned_rate is 0 for empty skills", () => {
    const m = computeIndependenceMetrics([], 0);
    expect(m.mentor_assigned_rate).toBe(0);
  });

  // ── young_person_views_rate ──────────────────────────────────────────

  it("young_person_views_rate is 100 when all skills have views", () => {
    const skills = [
      makeSkill({ id: "s1", young_person_views: "I enjoy this" }),
      makeSkill({ id: "s2", young_person_views: "It's fine" }),
    ];
    const m = computeIndependenceMetrics(skills, 2);
    expect(m.young_person_views_rate).toBe(100);
  });

  it("young_person_views_rate is 0 when no skills have views", () => {
    const skills = [
      makeSkill({ id: "s1", young_person_views: null }),
      makeSkill({ id: "s2", young_person_views: null }),
    ];
    const m = computeIndependenceMetrics(skills, 2);
    expect(m.young_person_views_rate).toBe(0);
  });

  it("young_person_views_rate is 50 when half have views", () => {
    const skills = [
      makeSkill({ id: "s1", young_person_views: "Views here" }),
      makeSkill({ id: "s2", young_person_views: null }),
    ];
    const m = computeIndependenceMetrics(skills, 2);
    expect(m.young_person_views_rate).toBe(50);
  });

  it("young_person_views_rate rounds to one decimal place", () => {
    const skills = [
      makeSkill({ id: "s1", young_person_views: "Yes" }),
      makeSkill({ id: "s2", young_person_views: "Yes" }),
      makeSkill({ id: "s3", young_person_views: null }),
    ];
    const m = computeIndependenceMetrics(skills, 3);
    expect(m.young_person_views_rate).toBe(66.7);
  });

  it("young_person_views_rate is 0 for empty skills", () => {
    const m = computeIndependenceMetrics([], 0);
    expect(m.young_person_views_rate).toBe(0);
  });

  // ── average_activities_per_skill ─────────────────────────────────────

  it("average_activities_per_skill computes correct average", () => {
    const skills = [
      makeSkill({ id: "s1", activities_completed: ["a", "b", "c"] }),
      makeSkill({ id: "s2", activities_completed: ["x"] }),
    ];
    const m = computeIndependenceMetrics(skills, 2);
    expect(m.average_activities_per_skill).toBe(2);
  });

  it("average_activities_per_skill is 0 when all have empty arrays", () => {
    const skills = [
      makeSkill({ id: "s1", activities_completed: [] }),
      makeSkill({ id: "s2", activities_completed: [] }),
    ];
    const m = computeIndependenceMetrics(skills, 2);
    expect(m.average_activities_per_skill).toBe(0);
  });

  it("average_activities_per_skill rounds to one decimal place", () => {
    const skills = [
      makeSkill({ id: "s1", activities_completed: ["a"] }),
      makeSkill({ id: "s2", activities_completed: ["b", "c"] }),
      makeSkill({ id: "s3", activities_completed: [] }),
    ];
    const m = computeIndependenceMetrics(skills, 3);
    expect(m.average_activities_per_skill).toBe(1);
  });

  it("average_activities_per_skill is 0 for empty skills", () => {
    const m = computeIndependenceMetrics([], 0);
    expect(m.average_activities_per_skill).toBe(0);
  });

  it("average_activities_per_skill with single skill and many activities", () => {
    const skills = [
      makeSkill({ id: "s1", activities_completed: ["a", "b", "c", "d", "e", "f", "g"] }),
    ];
    const m = computeIndependenceMetrics(skills, 1);
    expect(m.average_activities_per_skill).toBe(7);
  });

  // ── by_skill_area ────────────────────────────────────────────────────

  it("by_skill_area groups counts by skill area", () => {
    const skills = [
      makeSkill({ id: "s1", skill_area: "cooking_nutrition" }),
      makeSkill({ id: "s2", skill_area: "cooking_nutrition" }),
      makeSkill({ id: "s3", skill_area: "budgeting_finance" }),
    ];
    const m = computeIndependenceMetrics(skills, 3);
    expect(m.by_skill_area["cooking_nutrition"]).toBe(2);
    expect(m.by_skill_area["budgeting_finance"]).toBe(1);
  });

  it("by_skill_area is empty for no skills", () => {
    const m = computeIndependenceMetrics([], 0);
    expect(Object.keys(m.by_skill_area)).toHaveLength(0);
  });

  it("by_skill_area has one entry per unique area", () => {
    const skills = [
      makeSkill({ id: "s1", skill_area: "cooking_nutrition" }),
      makeSkill({ id: "s2", skill_area: "travel_transport" }),
      makeSkill({ id: "s3", skill_area: "digital_literacy" }),
      makeSkill({ id: "s4", skill_area: "travel_transport" }),
    ];
    const m = computeIndependenceMetrics(skills, 4);
    expect(Object.keys(m.by_skill_area)).toHaveLength(3);
  });

  it("by_skill_area values sum to total_assessments", () => {
    const skills = [
      makeSkill({ id: "s1", skill_area: "cooking_nutrition" }),
      makeSkill({ id: "s2", skill_area: "budgeting_finance" }),
      makeSkill({ id: "s3", skill_area: "cooking_nutrition" }),
      makeSkill({ id: "s4", skill_area: "housing_knowledge" }),
    ];
    const m = computeIndependenceMetrics(skills, 4);
    const sum = Object.values(m.by_skill_area).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_assessments);
  });

  // ── by_competency_level ──────────────────────────────────────────────

  it("by_competency_level groups counts by competency level", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "developing" }),
      makeSkill({ id: "s2", competency_level: "developing" }),
      makeSkill({ id: "s3", competency_level: "competent" }),
    ];
    const m = computeIndependenceMetrics(skills, 3);
    expect(m.by_competency_level["developing"]).toBe(2);
    expect(m.by_competency_level["competent"]).toBe(1);
  });

  it("by_competency_level is empty for no skills", () => {
    const m = computeIndependenceMetrics([], 0);
    expect(Object.keys(m.by_competency_level)).toHaveLength(0);
  });

  it("by_competency_level values sum to total_assessments", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "not_started" }),
      makeSkill({ id: "s2", competency_level: "emerging" }),
      makeSkill({ id: "s3", competency_level: "developing" }),
      makeSkill({ id: "s4", competency_level: "competent" }),
      makeSkill({ id: "s5", competency_level: "independent" }),
    ];
    const m = computeIndependenceMetrics(skills, 5);
    const sum = Object.values(m.by_competency_level).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_assessments);
  });

  it("by_competency_level has 5 entries when all levels represented", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "not_started" }),
      makeSkill({ id: "s2", competency_level: "emerging" }),
      makeSkill({ id: "s3", competency_level: "developing" }),
      makeSkill({ id: "s4", competency_level: "competent" }),
      makeSkill({ id: "s5", competency_level: "independent" }),
    ];
    const m = computeIndependenceMetrics(skills, 5);
    expect(Object.keys(m.by_competency_level)).toHaveLength(5);
  });

  // ── by_child ─────────────────────────────────────────────────────────

  it("by_child groups counts by child name", () => {
    const skills = [
      makeSkill({ id: "s1", child_name: "Alice Smith", child_id: "c1" }),
      makeSkill({ id: "s2", child_name: "Alice Smith", child_id: "c1" }),
      makeSkill({ id: "s3", child_name: "Bob Jones", child_id: "c2" }),
    ];
    const m = computeIndependenceMetrics(skills, 2);
    expect(m.by_child["Alice Smith"]).toBe(2);
    expect(m.by_child["Bob Jones"]).toBe(1);
  });

  it("by_child is empty for no skills", () => {
    const m = computeIndependenceMetrics([], 0);
    expect(Object.keys(m.by_child)).toHaveLength(0);
  });

  it("by_child has one entry per unique child name", () => {
    const skills = [
      makeSkill({ id: "s1", child_name: "Alice", child_id: "c1" }),
      makeSkill({ id: "s2", child_name: "Bob", child_id: "c2" }),
      makeSkill({ id: "s3", child_name: "Alice", child_id: "c1" }),
    ];
    const m = computeIndependenceMetrics(skills, 2);
    expect(Object.keys(m.by_child)).toHaveLength(2);
  });

  it("by_child values sum to total_assessments", () => {
    const skills = [
      makeSkill({ id: "s1", child_name: "Alice", child_id: "c1" }),
      makeSkill({ id: "s2", child_name: "Bob", child_id: "c2" }),
      makeSkill({ id: "s3", child_name: "Alice", child_id: "c1" }),
      makeSkill({ id: "s4", child_name: "Charlie", child_id: "c3" }),
    ];
    const m = computeIndependenceMetrics(skills, 3);
    const sum = Object.values(m.by_child).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_assessments);
  });

  // ── single skill ─────────────────────────────────────────────────────

  it("single skill at not_started level", () => {
    const skills = [makeSkill({ id: "s1", competency_level: "not_started", target_level: "competent" })];
    const m = computeIndependenceMetrics(skills, 1);
    expect(m.not_started_count).toBe(1);
    expect(m.on_target_count).toBe(0);
  });

  it("single skill at independent level", () => {
    const skills = [makeSkill({ id: "s1", competency_level: "independent", target_level: "independent" })];
    const m = computeIndependenceMetrics(skills, 1);
    expect(m.independent_count).toBe(1);
    expect(m.on_target_count).toBe(1);
  });

  // ── mixed multi-child scenario ───────────────────────────────────────

  it("correctly computes metrics for multi-child mixed-level scenario", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", child_name: "Alice", competency_level: "competent", target_level: "competent", mentor_assigned: "M1", young_person_views: "Good", activities_completed: ["a", "b"] }),
      makeSkill({ id: "s2", child_id: "c1", child_name: "Alice", competency_level: "emerging", target_level: "developing", mentor_assigned: null, young_person_views: null, activities_completed: [] }),
      makeSkill({ id: "s3", child_id: "c2", child_name: "Bob", competency_level: "independent", target_level: "competent", mentor_assigned: "M2", young_person_views: "Great", activities_completed: ["x", "y", "z"] }),
      makeSkill({ id: "s4", child_id: "c3", child_name: "Carol", competency_level: "not_started", target_level: "emerging", mentor_assigned: null, young_person_views: null, activities_completed: [] }),
    ];
    const m = computeIndependenceMetrics(skills, 5);
    expect(m.total_assessments).toBe(4);
    expect(m.children_assessed).toBe(3);
    expect(m.assessment_coverage).toBe(60);
    expect(m.not_started_count).toBe(1);
    expect(m.emerging_count).toBe(1);
    expect(m.competent_count).toBe(1);
    expect(m.independent_count).toBe(1);
    expect(m.on_target_count).toBe(2);
    expect(m.mentor_assigned_rate).toBe(50);
    expect(m.young_person_views_rate).toBe(50);
    expect(m.average_activities_per_skill).toBe(1.3);
    expect(m.by_child["Alice"]).toBe(2);
    expect(m.by_child["Bob"]).toBe(1);
    expect(m.by_child["Carol"]).toBe(1);
  });

  // ── large dataset ────────────────────────────────────────────────────

  it("handles large skills array efficiently", () => {
    const skills: IndependenceSkill[] = [];
    const levels: CompetencyLevel[] = ["not_started", "emerging", "developing", "competent", "independent"];
    const areas: SkillArea[] = ["cooking_nutrition", "budgeting_finance", "travel_transport", "digital_literacy", "housing_knowledge"];
    for (let i = 0; i < 100; i++) {
      skills.push(
        makeSkill({
          id: `s-${i}`,
          child_id: `c-${i % 20}`,
          child_name: `Child ${i % 20}`,
          competency_level: levels[i % 5],
          target_level: levels[Math.min((i % 5) + 1, 4)],
          skill_area: areas[i % 5],
          mentor_assigned: i % 3 === 0 ? "Mentor" : null,
          young_person_views: i % 4 === 0 ? "views" : null,
          activities_completed: i % 2 === 0 ? ["a", "b"] : [],
        }),
      );
    }
    const m = computeIndependenceMetrics(skills, 25);
    expect(m.total_assessments).toBe(100);
    expect(m.children_assessed).toBe(20);
    expect(m.assessment_coverage).toBe(80);
    expect(m.not_started_count).toBe(20);
    expect(m.emerging_count).toBe(20);
    expect(m.developing_count).toBe(20);
    expect(m.competent_count).toBe(20);
    expect(m.independent_count).toBe(20);
  });

  it("totalChildren parameter does not affect per-skill metrics", () => {
    const skills = [makeSkill({ id: "s1", child_id: "c1" })];
    const m1 = computeIndependenceMetrics(skills, 1);
    const m2 = computeIndependenceMetrics(skills, 100);
    expect(m1.total_assessments).toBe(m2.total_assessments);
    expect(m1.not_started_count).toBe(m2.not_started_count);
    expect(m1.on_target_count).toBe(m2.on_target_count);
    expect(m1.mentor_assigned_rate).toBe(m2.mentor_assigned_rate);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyIndependenceAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyIndependenceAlerts", () => {
  // ── no alerts when clean ─────────────────────────────────────────────

  it("returns empty array for empty skills and zero children", () => {
    const alerts = identifyIndependenceAlerts([], 0);
    expect(alerts).toEqual([]);
  });

  it("returns empty array when all children assessed and data is clean", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", competency_level: "competent", target_level: "competent", target_date: daysFromNow(30), young_person_views: "Great" }),
      makeSkill({ id: "s2", child_id: "c2", competency_level: "developing", target_level: "developing", target_date: daysFromNow(60), young_person_views: "Fine" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 2);
    expect(alerts).toEqual([]);
  });

  // ── no_assessment alert ──────────────────────────────────────────────

  it("generates no_assessment alert when children lack skills", () => {
    const alerts = identifyIndependenceAlerts([], 3);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe("no_assessment");
    expect(alerts[0].severity).toBe("high");
    expect(alerts[0].id).toBe("assessment_gap");
  });

  it("no_assessment alert includes correct gap count for 1 child", () => {
    const alerts = identifyIndependenceAlerts([], 1);
    expect(alerts[0].message).toContain("1");
    expect(alerts[0].message).toContain("child has");
  });

  it("no_assessment alert uses plural for multiple children", () => {
    const alerts = identifyIndependenceAlerts([], 5);
    expect(alerts[0].message).toContain("5");
    expect(alerts[0].message).toContain("children have");
  });

  it("no_assessment alert counts only unassessed children", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", young_person_views: "Yes" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 4);
    const gap = alerts.find((a) => a.type === "no_assessment");
    expect(gap).toBeTruthy();
    expect(gap!.message).toContain("3");
  });

  it("no no_assessment alert when all children have assessments", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", young_person_views: "Yes" }),
      makeSkill({ id: "s2", child_id: "c2", young_person_views: "Yes" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 2);
    const gap = alerts.find((a) => a.type === "no_assessment");
    expect(gap).toBeUndefined();
  });

  it("no no_assessment alert when totalChildren is 0", () => {
    const alerts = identifyIndependenceAlerts([], 0);
    const gap = alerts.find((a) => a.type === "no_assessment");
    expect(gap).toBeUndefined();
  });

  // ── target_missed alert ──────────────────────────────────────────────

  it("generates target_missed alert for past target date with skill below target", () => {
    const skills = [
      makeSkill({
        id: "s1",
        child_name: "Alice",
        competency_level: "emerging",
        target_level: "competent",
        target_date: daysAgo(10),
        young_person_views: "Views",
      }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const missed = alerts.find((a) => a.type === "target_missed");
    expect(missed).toBeTruthy();
    expect(missed!.severity).toBe("medium");
    expect(missed!.id).toBe("s1");
  });

  it("target_missed alert includes child name and skill area", () => {
    const skills = [
      makeSkill({
        id: "s1",
        child_name: "Bob Jones",
        skill_area: "budgeting_finance",
        competency_level: "not_started",
        target_level: "developing",
        target_date: daysAgo(5),
        young_person_views: "Views",
      }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const missed = alerts.find((a) => a.type === "target_missed");
    expect(missed!.message).toContain("Bob Jones");
    expect(missed!.message).toContain("budgeting finance");
  });

  it("target_missed alert includes competency level and target level", () => {
    const skills = [
      makeSkill({
        id: "s1",
        competency_level: "emerging",
        target_level: "independent",
        target_date: daysAgo(1),
        young_person_views: "Yes",
      }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const missed = alerts.find((a) => a.type === "target_missed");
    expect(missed!.message).toContain("emerging");
    expect(missed!.message).toContain("independent");
  });

  it("no target_missed alert when target date is in the future", () => {
    const skills = [
      makeSkill({
        id: "s1",
        competency_level: "not_started",
        target_level: "competent",
        target_date: daysFromNow(30),
        young_person_views: "Yes",
      }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const missed = alerts.find((a) => a.type === "target_missed");
    expect(missed).toBeUndefined();
  });

  it("no target_missed alert when skill is at target level", () => {
    const skills = [
      makeSkill({
        id: "s1",
        competency_level: "competent",
        target_level: "competent",
        target_date: daysAgo(10),
        young_person_views: "Yes",
      }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const missed = alerts.find((a) => a.type === "target_missed");
    expect(missed).toBeUndefined();
  });

  it("no target_missed alert when skill is above target level", () => {
    const skills = [
      makeSkill({
        id: "s1",
        competency_level: "independent",
        target_level: "competent",
        target_date: daysAgo(10),
        young_person_views: "Yes",
      }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const missed = alerts.find((a) => a.type === "target_missed");
    expect(missed).toBeUndefined();
  });

  it("no target_missed alert when target_date is null", () => {
    const skills = [
      makeSkill({
        id: "s1",
        competency_level: "not_started",
        target_level: "competent",
        target_date: null,
        young_person_views: "Yes",
      }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const missed = alerts.find((a) => a.type === "target_missed");
    expect(missed).toBeUndefined();
  });

  it("generates multiple target_missed alerts for different skills", () => {
    const skills = [
      makeSkill({
        id: "s1",
        child_name: "Alice",
        competency_level: "not_started",
        target_level: "competent",
        target_date: daysAgo(5),
        young_person_views: "Yes",
      }),
      makeSkill({
        id: "s2",
        child_name: "Bob",
        competency_level: "emerging",
        target_level: "independent",
        target_date: daysAgo(3),
        young_person_views: "Yes",
      }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 2);
    const missed = alerts.filter((a) => a.type === "target_missed");
    expect(missed).toHaveLength(2);
  });

  it("target_missed uses underscore-replaced skill area in message", () => {
    const skills = [
      makeSkill({
        id: "s1",
        skill_area: "healthcare_management",
        competency_level: "not_started",
        target_level: "developing",
        target_date: daysAgo(1),
        young_person_views: "Yes",
      }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const missed = alerts.find((a) => a.type === "target_missed");
    expect(missed!.message).toContain("healthcare management");
  });

  // ── many_not_started alert ───────────────────────────────────────────

  it("generates many_not_started alert when child has 3+ not_started skills", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", child_name: "Alice", competency_level: "not_started", young_person_views: "Yes" }),
      makeSkill({ id: "s2", child_id: "c1", child_name: "Alice", competency_level: "not_started", skill_area: "budgeting_finance", young_person_views: "Yes" }),
      makeSkill({ id: "s3", child_id: "c1", child_name: "Alice", competency_level: "not_started", skill_area: "travel_transport", young_person_views: "Yes" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const nsa = alerts.find((a) => a.type === "many_not_started");
    expect(nsa).toBeTruthy();
    expect(nsa!.severity).toBe("high");
  });

  it("many_not_started alert includes child name and count", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", child_name: "Bob Jones", competency_level: "not_started", young_person_views: "Yes" }),
      makeSkill({ id: "s2", child_id: "c1", child_name: "Bob Jones", competency_level: "not_started", skill_area: "budgeting_finance", young_person_views: "Yes" }),
      makeSkill({ id: "s3", child_id: "c1", child_name: "Bob Jones", competency_level: "not_started", skill_area: "travel_transport", young_person_views: "Yes" }),
      makeSkill({ id: "s4", child_id: "c1", child_name: "Bob Jones", competency_level: "not_started", skill_area: "digital_literacy", young_person_views: "Yes" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const nsa = alerts.find((a) => a.type === "many_not_started");
    expect(nsa!.message).toContain("Bob Jones");
    expect(nsa!.message).toContain("4");
  });

  it("many_not_started alert id includes child id", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c42", child_name: "Alice", competency_level: "not_started", young_person_views: "Yes" }),
      makeSkill({ id: "s2", child_id: "c42", child_name: "Alice", competency_level: "not_started", skill_area: "budgeting_finance", young_person_views: "Yes" }),
      makeSkill({ id: "s3", child_id: "c42", child_name: "Alice", competency_level: "not_started", skill_area: "travel_transport", young_person_views: "Yes" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const nsa = alerts.find((a) => a.type === "many_not_started");
    expect(nsa!.id).toBe("not_started_c42");
  });

  it("no many_not_started alert when child has only 2 not_started skills", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", child_name: "Alice", competency_level: "not_started", young_person_views: "Yes" }),
      makeSkill({ id: "s2", child_id: "c1", child_name: "Alice", competency_level: "not_started", skill_area: "budgeting_finance", young_person_views: "Yes" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const nsa = alerts.find((a) => a.type === "many_not_started");
    expect(nsa).toBeUndefined();
  });

  it("no many_not_started alert when child has only 1 not_started skill", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", child_name: "Alice", competency_level: "not_started", young_person_views: "Yes" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const nsa = alerts.find((a) => a.type === "many_not_started");
    expect(nsa).toBeUndefined();
  });

  it("no many_not_started alert when no skills at not_started", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", competency_level: "emerging", young_person_views: "Yes" }),
      makeSkill({ id: "s2", child_id: "c1", competency_level: "developing", skill_area: "budgeting_finance", young_person_views: "Yes" }),
      makeSkill({ id: "s3", child_id: "c1", competency_level: "competent", skill_area: "travel_transport", young_person_views: "Yes" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const nsa = alerts.find((a) => a.type === "many_not_started");
    expect(nsa).toBeUndefined();
  });

  it("many_not_started tracks per-child independently", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", child_name: "Alice", competency_level: "not_started", young_person_views: "Yes" }),
      makeSkill({ id: "s2", child_id: "c1", child_name: "Alice", competency_level: "not_started", skill_area: "budgeting_finance", young_person_views: "Yes" }),
      makeSkill({ id: "s3", child_id: "c1", child_name: "Alice", competency_level: "not_started", skill_area: "travel_transport", young_person_views: "Yes" }),
      makeSkill({ id: "s4", child_id: "c2", child_name: "Bob", competency_level: "not_started", young_person_views: "Yes" }),
      makeSkill({ id: "s5", child_id: "c2", child_name: "Bob", competency_level: "not_started", skill_area: "budgeting_finance", young_person_views: "Yes" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 2);
    const nsa = alerts.filter((a) => a.type === "many_not_started");
    expect(nsa).toHaveLength(1);
    expect(nsa[0].message).toContain("Alice");
  });

  it("many_not_started generates alerts for multiple children exceeding threshold", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", child_name: "Alice", competency_level: "not_started", young_person_views: "Yes" }),
      makeSkill({ id: "s2", child_id: "c1", child_name: "Alice", competency_level: "not_started", skill_area: "budgeting_finance", young_person_views: "Yes" }),
      makeSkill({ id: "s3", child_id: "c1", child_name: "Alice", competency_level: "not_started", skill_area: "travel_transport", young_person_views: "Yes" }),
      makeSkill({ id: "s4", child_id: "c2", child_name: "Bob", competency_level: "not_started", young_person_views: "Yes" }),
      makeSkill({ id: "s5", child_id: "c2", child_name: "Bob", competency_level: "not_started", skill_area: "budgeting_finance", young_person_views: "Yes" }),
      makeSkill({ id: "s6", child_id: "c2", child_name: "Bob", competency_level: "not_started", skill_area: "travel_transport", young_person_views: "Yes" }),
      makeSkill({ id: "s7", child_id: "c2", child_name: "Bob", competency_level: "not_started", skill_area: "digital_literacy", young_person_views: "Yes" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 2);
    const nsa = alerts.filter((a) => a.type === "many_not_started");
    expect(nsa).toHaveLength(2);
  });

  // ── no_yp_views alert ────────────────────────────────────────────────

  it("generates no_yp_views alert for skill with null young_person_views", () => {
    const skills = [
      makeSkill({ id: "s1", child_name: "Alice", young_person_views: null }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const ypv = alerts.find((a) => a.type === "no_yp_views");
    expect(ypv).toBeTruthy();
    expect(ypv!.severity).toBe("medium");
    expect(ypv!.id).toBe("s1");
  });

  it("no_yp_views alert includes child name and skill area", () => {
    const skills = [
      makeSkill({
        id: "s1",
        child_name: "Carol Davies",
        skill_area: "employment_readiness",
        young_person_views: null,
      }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const ypv = alerts.find((a) => a.type === "no_yp_views");
    expect(ypv!.message).toContain("Carol Davies");
    expect(ypv!.message).toContain("employment readiness");
  });

  it("no no_yp_views alert when young_person_views is set", () => {
    const skills = [
      makeSkill({ id: "s1", young_person_views: "I feel confident" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const ypv = alerts.find((a) => a.type === "no_yp_views");
    expect(ypv).toBeUndefined();
  });

  it("generates no_yp_views for each skill with null views", () => {
    const skills = [
      makeSkill({ id: "s1", young_person_views: null }),
      makeSkill({ id: "s2", young_person_views: null, skill_area: "budgeting_finance" }),
      makeSkill({ id: "s3", young_person_views: "Set" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const ypv = alerts.filter((a) => a.type === "no_yp_views");
    expect(ypv).toHaveLength(2);
  });

  it("no_yp_views uses underscore-replaced skill area in message", () => {
    const skills = [
      makeSkill({
        id: "s1",
        skill_area: "social_relationships",
        young_person_views: null,
      }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const ypv = alerts.find((a) => a.type === "no_yp_views");
    expect(ypv!.message).toContain("social relationships");
  });

  // ── combined alerts ──────────────────────────────────────────────────

  it("generates all alert types together when conditions are met", () => {
    const skills = [
      makeSkill({
        id: "s1",
        child_id: "c1",
        child_name: "Alice",
        competency_level: "not_started",
        target_level: "competent",
        target_date: daysAgo(10),
        young_person_views: null,
      }),
      makeSkill({
        id: "s2",
        child_id: "c1",
        child_name: "Alice",
        competency_level: "not_started",
        target_level: "emerging",
        target_date: daysFromNow(30),
        young_person_views: null,
        skill_area: "budgeting_finance",
      }),
      makeSkill({
        id: "s3",
        child_id: "c1",
        child_name: "Alice",
        competency_level: "not_started",
        target_level: "developing",
        target_date: daysFromNow(60),
        young_person_views: null,
        skill_area: "travel_transport",
      }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 3);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("no_assessment");
    expect(types).toContain("target_missed");
    expect(types).toContain("many_not_started");
    expect(types).toContain("no_yp_views");
  });

  it("alert severity values are correct types", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", child_name: "Alice", competency_level: "not_started", young_person_views: null }),
      makeSkill({ id: "s2", child_id: "c1", child_name: "Alice", competency_level: "not_started", skill_area: "budgeting_finance", young_person_views: null }),
      makeSkill({ id: "s3", child_id: "c1", child_name: "Alice", competency_level: "not_started", skill_area: "travel_transport", young_person_views: null, target_level: "competent", target_date: daysAgo(5) }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 3);
    for (const alert of alerts) {
      expect(["critical", "high", "medium"]).toContain(alert.severity);
    }
  });

  it("each alert has a non-empty message", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", child_name: "Alice", competency_level: "not_started", young_person_views: null }),
      makeSkill({ id: "s2", child_id: "c1", child_name: "Alice", competency_level: "not_started", skill_area: "budgeting_finance", young_person_views: null }),
      makeSkill({ id: "s3", child_id: "c1", child_name: "Alice", competency_level: "not_started", skill_area: "travel_transport", young_person_views: null }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 2);
    for (const alert of alerts) {
      expect(alert.message.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty id", () => {
    const skills = [
      makeSkill({ id: "s1", young_person_views: null }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 2);
    for (const alert of alerts) {
      expect(alert.id.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty type", () => {
    const skills = [
      makeSkill({ id: "s1", young_person_views: null }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 2);
    for (const alert of alerts) {
      expect(alert.type.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listSkills ─────────────────────────────────────────────────────

  it("listSkills returns ok: true with empty array", async () => {
    const result = await listSkills("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listSkills returns ok: true with childId filter", async () => {
    const result = await listSkills("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listSkills returns ok: true with skillArea filter", async () => {
    const result = await listSkills("home-1", { skillArea: "cooking_nutrition" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listSkills returns ok: true with competencyLevel filter", async () => {
    const result = await listSkills("home-1", { competencyLevel: "developing" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listSkills returns ok: true with limit filter", async () => {
    const result = await listSkills("home-1", { limit: 50 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listSkills returns ok: true with all filters combined", async () => {
    const result = await listSkills("home-1", {
      childId: "child-1",
      skillArea: "budgeting_finance",
      competencyLevel: "competent",
      limit: 10,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createSkill ────────────────────────────────────────────────────

  it("createSkill returns ok: false with error message", async () => {
    const result = await createSkill({
      homeId: "home-1",
      childName: "Alice Smith",
      childId: "child-1",
      skillArea: "cooking_nutrition",
      competencyLevel: "developing",
      assessedDate: daysAgo(1),
      assessedBy: "staff-1",
      targetLevel: "competent",
      activitiesCompleted: [],
      nextSteps: ["learn to cook"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createSkill error message is a string", async () => {
    const result = await createSkill({
      homeId: "home-1",
      childName: "Bob Jones",
      childId: "child-2",
      skillArea: "budgeting_finance",
      competencyLevel: "emerging",
      assessedDate: daysAgo(3),
      assessedBy: "staff-2",
      targetLevel: "developing",
      targetDate: daysFromNow(90),
      activitiesCompleted: ["opened a savings account", "practiced counting change"],
      youngPersonViews: "I want to learn about money",
      nextSteps: ["weekly budget exercise"],
      supportNeeded: "Help understanding bills",
      mentorAssigned: "Mentor Smith",
      notes: "Good progress",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  // ── updateSkill ────────────────────────────────────────────────────

  it("updateSkill returns ok: false with error message", async () => {
    const result = await updateSkill("skill-1", { competency_level: "competent" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateSkill error message is a string for partial updates", async () => {
    const result = await updateSkill("skill-1", {
      competency_level: "independent",
      notes: "Achieved target",
      young_person_views: "Very happy",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("computeIndependenceMetrics with skills from a single child across all 15 skill areas", () => {
    const areas: SkillArea[] = [
      "cooking_nutrition", "budgeting_finance", "household_tasks",
      "personal_hygiene", "healthcare_management", "travel_transport",
      "employment_readiness", "education_training", "housing_knowledge",
      "social_relationships", "digital_literacy", "emotional_resilience",
      "safety_awareness", "rights_entitlements", "community_engagement",
    ];
    const skills = areas.map((area, i) =>
      makeSkill({
        id: `s-${i}`,
        child_id: "c1",
        child_name: "Alice",
        skill_area: area,
        competency_level: "developing",
        target_level: "competent",
      }),
    );
    const m = computeIndependenceMetrics(skills, 1);
    expect(m.total_assessments).toBe(15);
    expect(m.children_assessed).toBe(1);
    expect(Object.keys(m.by_skill_area)).toHaveLength(15);
    expect(m.by_child["Alice"]).toBe(15);
  });

  it("computeIndependenceMetrics with all skills at independent targeting independent", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "independent", target_level: "independent" }),
      makeSkill({ id: "s2", competency_level: "independent", target_level: "independent", child_id: "c2" }),
    ];
    const m = computeIndependenceMetrics(skills, 2);
    expect(m.independent_count).toBe(2);
    expect(m.on_target_count).toBe(2);
    expect(m.skills_at_target).toBe(2);
  });

  it("computeIndependenceMetrics with all skills at not_started targeting independent", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "not_started", target_level: "independent" }),
      makeSkill({ id: "s2", competency_level: "not_started", target_level: "independent", child_id: "c2" }),
    ];
    const m = computeIndependenceMetrics(skills, 2);
    expect(m.not_started_count).toBe(2);
    expect(m.on_target_count).toBe(0);
  });

  it("identifyIndependenceAlerts with exactly 3 not_started skills triggers alert", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", child_name: "Alice", competency_level: "not_started", young_person_views: "Yes" }),
      makeSkill({ id: "s2", child_id: "c1", child_name: "Alice", competency_level: "not_started", skill_area: "budgeting_finance", young_person_views: "Yes" }),
      makeSkill({ id: "s3", child_id: "c1", child_name: "Alice", competency_level: "not_started", skill_area: "travel_transport", young_person_views: "Yes" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const nsa = alerts.find((a) => a.type === "many_not_started");
    expect(nsa).toBeTruthy();
    expect(nsa!.message).toContain("3");
  });

  it("identifyIndependenceAlerts with exactly 2 not_started skills does not trigger", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", child_name: "Alice", competency_level: "not_started", young_person_views: "Yes" }),
      makeSkill({ id: "s2", child_id: "c1", child_name: "Alice", competency_level: "not_started", skill_area: "budgeting_finance", young_person_views: "Yes" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const nsa = alerts.find((a) => a.type === "many_not_started");
    expect(nsa).toBeUndefined();
  });

  it("computeIndependenceMetrics with mixed mentor and views combinations", () => {
    const skills = [
      makeSkill({ id: "s1", mentor_assigned: "M1", young_person_views: "Yes", activities_completed: ["a"] }),
      makeSkill({ id: "s2", mentor_assigned: null, young_person_views: "Yes", activities_completed: ["b", "c"] }),
      makeSkill({ id: "s3", mentor_assigned: "M2", young_person_views: null, activities_completed: [] }),
      makeSkill({ id: "s4", mentor_assigned: null, young_person_views: null, activities_completed: ["d"] }),
    ];
    const m = computeIndependenceMetrics(skills, 4);
    expect(m.mentor_assigned_rate).toBe(50);
    expect(m.young_person_views_rate).toBe(50);
    expect(m.average_activities_per_skill).toBe(1);
  });

  it("identifyIndependenceAlerts with target_date exactly today and skill below target", () => {
    // target_date of today: new Date(today) < new Date() should be false (same day)
    // The comparison is < new Date() which includes time, so same-day date string
    // parsed at midnight will be < current time => triggers alert
    const today = new Date().toISOString().split("T")[0];
    const skills = [
      makeSkill({
        id: "s1",
        competency_level: "not_started",
        target_level: "competent",
        target_date: today,
        young_person_views: "Yes",
      }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const missed = alerts.find((a) => a.type === "target_missed");
    // new Date(today) is midnight, new Date() includes time, so midnight < now is true
    expect(missed).toBeTruthy();
  });

  it("computeIndependenceMetrics assessment_coverage with 1 child in 3 totalChildren", () => {
    const skills = [makeSkill({ id: "s1", child_id: "c1" })];
    const m = computeIndependenceMetrics(skills, 3);
    expect(m.assessment_coverage).toBe(33.3);
  });

  it("computeIndependenceMetrics assessment_coverage with 2 children in 3 totalChildren", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1" }),
      makeSkill({ id: "s2", child_id: "c2" }),
    ];
    const m = computeIndependenceMetrics(skills, 3);
    expect(m.assessment_coverage).toBe(66.7);
  });

  it("identifyIndependenceAlerts no_assessment message mentions preparation plans", () => {
    const alerts = identifyIndependenceAlerts([], 2);
    const gap = alerts.find((a) => a.type === "no_assessment");
    expect(gap!.message).toContain("preparation plans");
  });

  it("identifyIndependenceAlerts many_not_started message mentions practical skills development", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", child_name: "A", competency_level: "not_started", young_person_views: "Yes" }),
      makeSkill({ id: "s2", child_id: "c1", child_name: "A", competency_level: "not_started", skill_area: "budgeting_finance", young_person_views: "Yes" }),
      makeSkill({ id: "s3", child_id: "c1", child_name: "A", competency_level: "not_started", skill_area: "travel_transport", young_person_views: "Yes" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const nsa = alerts.find((a) => a.type === "many_not_started");
    expect(nsa!.message).toContain("practical skills development");
  });

  it("identifyIndependenceAlerts no_yp_views message mentions involve them", () => {
    const skills = [
      makeSkill({ id: "s1", young_person_views: null }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const ypv = alerts.find((a) => a.type === "no_yp_views");
    expect(ypv!.message).toContain("involve them");
  });

  it("identifyIndependenceAlerts target_missed message includes target_date", () => {
    const date = daysAgo(7);
    const skills = [
      makeSkill({
        id: "s1",
        competency_level: "not_started",
        target_level: "developing",
        target_date: date,
        young_person_views: "Yes",
      }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const missed = alerts.find((a) => a.type === "target_missed");
    expect(missed!.message).toContain(date);
  });

  it("computeIndependenceMetrics handles skills with empty next_steps and support_needed", () => {
    const skills = [
      makeSkill({ id: "s1", next_steps: [], support_needed: null, activities_completed: [] }),
    ];
    const m = computeIndependenceMetrics(skills, 1);
    expect(m.total_assessments).toBe(1);
    expect(m.average_activities_per_skill).toBe(0);
  });

  it("computeIndependenceMetrics by_competency_level matches individual counts", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "not_started" }),
      makeSkill({ id: "s2", competency_level: "emerging" }),
      makeSkill({ id: "s3", competency_level: "emerging" }),
      makeSkill({ id: "s4", competency_level: "competent" }),
    ];
    const m = computeIndependenceMetrics(skills, 4);
    expect(m.by_competency_level["not_started"]).toBe(m.not_started_count);
    expect(m.by_competency_level["emerging"]).toBe(m.emerging_count);
    expect(m.by_competency_level["competent"]).toBe(m.competent_count);
  });

  it("computeIndependenceMetrics developing at target developing is on target", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "developing", target_level: "developing" }),
    ];
    const m = computeIndependenceMetrics(skills, 1);
    expect(m.on_target_count).toBe(1);
  });

  it("computeIndependenceMetrics competent below independent target is not on target", () => {
    const skills = [
      makeSkill({ id: "s1", competency_level: "competent", target_level: "independent" }),
    ];
    const m = computeIndependenceMetrics(skills, 1);
    expect(m.on_target_count).toBe(0);
  });

  it("identifyIndependenceAlerts empty skills with 0 totalChildren produces no alerts", () => {
    const alerts = identifyIndependenceAlerts([], 0);
    expect(alerts).toHaveLength(0);
  });

  it("identifyIndependenceAlerts no_yp_views does not trigger for non-null empty string", () => {
    // The function checks === null, so an empty string should NOT trigger
    const skills = [
      makeSkill({ id: "s1", young_person_views: "" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const ypv = alerts.find((a) => a.type === "no_yp_views");
    expect(ypv).toBeUndefined();
  });

  it("computeIndependenceMetrics mentor_assigned_rate 100 with single mentored skill", () => {
    const skills = [makeSkill({ id: "s1", mentor_assigned: "John" })];
    const m = computeIndependenceMetrics(skills, 1);
    expect(m.mentor_assigned_rate).toBe(100);
  });

  it("computeIndependenceMetrics young_person_views_rate 100 with single skill having views", () => {
    const skills = [makeSkill({ id: "s1", young_person_views: "My views" })];
    const m = computeIndependenceMetrics(skills, 1);
    expect(m.young_person_views_rate).toBe(100);
  });

  it("identifyIndependenceAlerts target_missed not triggered when competency equals target despite past date", () => {
    const skills = [
      makeSkill({
        id: "s1",
        competency_level: "developing",
        target_level: "developing",
        target_date: daysAgo(30),
        young_person_views: "Yes",
      }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const missed = alerts.find((a) => a.type === "target_missed");
    expect(missed).toBeUndefined();
  });

  it("identifyIndependenceAlerts target_missed not triggered when competency above target despite past date", () => {
    const skills = [
      makeSkill({
        id: "s1",
        competency_level: "independent",
        target_level: "developing",
        target_date: daysAgo(30),
        young_person_views: "Yes",
      }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 1);
    const missed = alerts.find((a) => a.type === "target_missed");
    expect(missed).toBeUndefined();
  });

  it("computeIndependenceMetrics average_activities_per_skill with uneven distribution", () => {
    const skills = [
      makeSkill({ id: "s1", activities_completed: ["a", "b", "c", "d", "e"] }),
      makeSkill({ id: "s2", activities_completed: [] }),
      makeSkill({ id: "s3", activities_completed: ["x"] }),
    ];
    const m = computeIndependenceMetrics(skills, 3);
    expect(m.average_activities_per_skill).toBe(2);
  });

  it("computeIndependenceMetrics by_skill_area with single area", () => {
    const skills = [
      makeSkill({ id: "s1", skill_area: "digital_literacy" }),
      makeSkill({ id: "s2", skill_area: "digital_literacy", child_id: "c2" }),
    ];
    const m = computeIndependenceMetrics(skills, 2);
    expect(Object.keys(m.by_skill_area)).toHaveLength(1);
    expect(m.by_skill_area["digital_literacy"]).toBe(2);
  });

  it("identifyIndependenceAlerts no_assessment gap is exact difference", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", young_person_views: "Yes" }),
      makeSkill({ id: "s2", child_id: "c2", young_person_views: "Yes" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 7);
    const gap = alerts.find((a) => a.type === "no_assessment");
    expect(gap!.message).toContain("5");
    expect(gap!.message).toContain("children have");
  });
});
