import { describe, it, expect } from "vitest";
import {
  computeIndependenceMetrics,
  identifyIndependenceAlerts,
  type IndependenceSkill,
} from "./independence-preparation-service";

function makeSkill(overrides: Partial<IndependenceSkill> = {}): IndependenceSkill {
  return {
    id: "skill-1",
    home_id: "home-1",
    child_name: "Child A",
    child_id: "child-1",
    skill_area: "cooking_nutrition",
    competency_level: "developing",
    assessed_date: "2026-05-01",
    assessed_by: "Staff A",
    target_level: "competent",
    target_date: "2026-12-01",
    activities_completed: ["Baked cake", "Made pasta"],
    young_person_views: "Enjoying cooking",
    next_steps: ["Learn budgeting for meals"],
    support_needed: null,
    mentor_assigned: "Mentor A",
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeIndependenceMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeIndependenceMetrics([], 4);
    expect(m.total_assessments).toBe(0);
    expect(m.children_assessed).toBe(0);
    expect(m.assessment_coverage).toBe(0);
    expect(m.not_started_count).toBe(0);
    expect(m.emerging_count).toBe(0);
    expect(m.developing_count).toBe(0);
    expect(m.competent_count).toBe(0);
    expect(m.independent_count).toBe(0);
    expect(m.mentor_assigned_rate).toBeNull();;
    expect(m.young_person_views_rate).toBeNull();;
    expect(m.average_activities_per_skill).toBeNull();;
  });

  it("counts correctly for populated data", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", competency_level: "not_started", target_level: "competent", activities_completed: [], young_person_views: null, mentor_assigned: null }),
      makeSkill({ id: "s2", child_id: "c1", competency_level: "competent", target_level: "competent", activities_completed: ["A", "B", "C"] }),
      makeSkill({ id: "s3", child_id: "c2", competency_level: "independent", target_level: "independent", activities_completed: ["A"] }),
      makeSkill({ id: "s4", child_id: "c2", competency_level: "emerging", target_level: "developing" }),
    ];
    const m = computeIndependenceMetrics(skills, 4);
    expect(m.total_assessments).toBe(4);
    expect(m.children_assessed).toBe(2);
    // coverage: 2/4 = 50%
    expect(m.assessment_coverage).toBe(50);
    expect(m.not_started_count).toBe(1);
    expect(m.emerging_count).toBe(1);
    expect(m.developing_count).toBe(0);
    expect(m.competent_count).toBe(1);
    expect(m.independent_count).toBe(1);
    // on_target: s2 (competent >= competent), s3 (independent >= independent) = 2
    expect(m.on_target_count).toBe(2);
    expect(m.skills_at_target).toBe(2);
    // mentor assigned: 3/4 = 75%
    expect(m.mentor_assigned_rate).toBe(75);
    // views recorded: 3/4 = 75%
    expect(m.young_person_views_rate).toBe(75);
    // activities: (0+3+1+2)/4 = 1.5
    expect(m.average_activities_per_skill).toBe(1.5);
    expect(m.by_child["Child A"]).toBe(4);
  });
});

describe("identifyIndependenceAlerts", () => {
  it("returns empty for empty data with no totalChildren", () => {
    expect(identifyIndependenceAlerts([], 0)).toEqual([]);
  });

  it("fires high no_assessment when totalChildren > children assessed", () => {
    const skills = [makeSkill()];
    const alerts = identifyIndependenceAlerts(skills, 4);
    const found = alerts.find((a) => a.type === "no_assessment");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
    expect(found!.message).toContain("3");
  });

  it("does NOT fire no_assessment when all children have assessments", () => {
    const skills = [
      makeSkill({ child_id: "c1" }),
      makeSkill({ child_id: "c2" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 2);
    expect(alerts.find((a) => a.type === "no_assessment")).toBeUndefined();
  });

  it("fires medium target_missed when target_date passed and competency below target", () => {
    const skills = [makeSkill({ competency_level: "emerging", target_level: "competent", target_date: "2020-01-01" })];
    const alerts = identifyIndependenceAlerts(skills, 4);
    const found = alerts.find((a) => a.type === "target_missed");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("does NOT fire target_missed when competency meets target", () => {
    const skills = [makeSkill({ competency_level: "competent", target_level: "competent", target_date: "2020-01-01" })];
    const alerts = identifyIndependenceAlerts(skills, 4);
    expect(alerts.find((a) => a.type === "target_missed")).toBeUndefined();
  });

  it("fires high many_not_started when child has >= 3 not_started skills", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", competency_level: "not_started", skill_area: "cooking_nutrition" }),
      makeSkill({ id: "s2", child_id: "c1", competency_level: "not_started", skill_area: "budgeting_finance" }),
      makeSkill({ id: "s3", child_id: "c1", competency_level: "not_started", skill_area: "household_tasks" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 4);
    const found = alerts.find((a) => a.type === "many_not_started");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
    expect(found!.message).toContain("3");
  });

  it("does NOT fire many_not_started when child has fewer than 3 not_started", () => {
    const skills = [
      makeSkill({ id: "s1", child_id: "c1", competency_level: "not_started" }),
      makeSkill({ id: "s2", child_id: "c1", competency_level: "not_started" }),
    ];
    const alerts = identifyIndependenceAlerts(skills, 4);
    expect(alerts.find((a) => a.type === "many_not_started")).toBeUndefined();
  });

  it("fires medium no_yp_views when young_person_views is null", () => {
    const skills = [makeSkill({ young_person_views: null })];
    const alerts = identifyIndependenceAlerts(skills, 4);
    const found = alerts.find((a) => a.type === "no_yp_views");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("does NOT fire no_yp_views when views are recorded", () => {
    const skills = [makeSkill({ young_person_views: "Great progress" })];
    const alerts = identifyIndependenceAlerts(skills, 4);
    expect(alerts.find((a) => a.type === "no_yp_views")).toBeUndefined();
  });
});
