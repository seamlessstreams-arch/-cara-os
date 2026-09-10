import { describe, it, expect } from "vitest";
import { _testing, type SocialSkillsDevelopmentRecord } from "../social-skills-development-service";
import { todayStr } from "@/lib/utils";

const { computeSocialSkillsMetrics, identifySocialSkillsAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<SocialSkillsDevelopmentRecord>): SocialSkillsDevelopmentRecord {
  return {
    id: "a-1", home_id: "home-1",
    skill_area: "communication",
    competence_level: "proficient",
    progress_assessment: "good_progress",
    group_dynamic: "active_participant",
    session_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    facilitated_by: "Staff A",
    child_engaged: true,
    age_appropriate: true,
    strengths_identified: true,
    targets_set: true,
    positive_reinforcement: true,
    peer_modelling_used: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    family_updated: true,
    school_linked: true,
    therapeutic_input: true,
    recorded_promptly: true,
    issues_found: [], actions_taken: [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("social-skills-development-service", () => {
  describe("computeSocialSkillsMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeSocialSkillsMetrics([]);
      expect(m.total_sessions).toBe(0);;
      expect(m.regression_count).toBe(0);
      expect(m.no_progress_count).toBe(0);
      expect(m.disruptive_count).toBe(0);
      expect(m.withdrawn_count).toBe(0);
      expect(m.child_engaged_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeSocialSkillsMetrics([]);
      expect(m.by_skill_area).toEqual({});
      expect(m.by_competence_level).toEqual({});
      expect(m.by_progress_assessment).toEqual({});
      expect(m.by_group_dynamic).toEqual({});
    });
    it("total_sessions counts records", () => { expect(computeSocialSkillsMetrics([makeRecord(), makeRecord()]).total_sessions).toBe(2); });
    it("counts regression", () => { expect(computeSocialSkillsMetrics([makeRecord({ progress_assessment: "regression" })]).regression_count).toBe(1); });
    it("counts no_progress", () => { expect(computeSocialSkillsMetrics([makeRecord({ progress_assessment: "no_progress" })]).no_progress_count).toBe(1); });
    it("does not count some_progress as regression", () => { expect(computeSocialSkillsMetrics([makeRecord({ progress_assessment: "some_progress" })]).regression_count).toBe(0); });
    it("counts disruptive", () => { expect(computeSocialSkillsMetrics([makeRecord({ group_dynamic: "disruptive" })]).disruptive_count).toBe(1); });
    it("counts withdrawn", () => { expect(computeSocialSkillsMetrics([makeRecord({ group_dynamic: "withdrawn" })]).withdrawn_count).toBe(1); });
    it("does not count passive as disruptive", () => { expect(computeSocialSkillsMetrics([makeRecord({ group_dynamic: "passive_participant" })]).disruptive_count).toBe(0); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeSocialSkillsMetrics([makeRecord()]);
      expect(m.child_engaged_rate).toBe(100);
      expect(m.age_appropriate_rate).toBe(100);
      expect(m.strengths_rate).toBe(100);
      expect(m.targets_rate).toBe(100);
      expect(m.positive_reinforcement_rate).toBe(100);
      expect(m.peer_modelling_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.family_updated_rate).toBe(100);
      expect(m.school_linked_rate).toBe(100);
      expect(m.therapeutic_input_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_engaged_rate 0 when false", () => { expect(computeSocialSkillsMetrics([makeRecord({ child_engaged: false })]).child_engaged_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeSocialSkillsMetrics([makeRecord({ targets_set: true }), makeRecord({ targets_set: false }), makeRecord({ targets_set: true })]); expect(m.targets_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeSocialSkillsMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 skill areas", () => { const areas = ["communication","conflict_resolution","empathy_building","teamwork","turn_taking","active_listening","emotional_literacy","boundary_setting","friendship_skills","other"] as const; const records = areas.map(a => makeRecord({ skill_area: a })); const m = computeSocialSkillsMetrics(records); for (const a of areas) expect(m.by_skill_area[a]).toBe(1); });
    it("counts all 5 competence levels", () => { const levels = ["advanced","proficient","developing","emerging","not_demonstrated"] as const; const records = levels.map(l => makeRecord({ competence_level: l })); const m = computeSocialSkillsMetrics(records); for (const l of levels) expect(m.by_competence_level[l]).toBe(1); });
    it("counts all 5 progress assessments", () => { const assessments = ["significant_progress","good_progress","some_progress","no_progress","regression"] as const; const records = assessments.map(a => makeRecord({ progress_assessment: a })); const m = computeSocialSkillsMetrics(records); for (const a of assessments) expect(m.by_progress_assessment[a]).toBe(1); });
    it("counts all 5 group dynamics", () => { const dynamics = ["positive_leader","active_participant","passive_participant","disruptive","withdrawn"] as const; const records = dynamics.map(d => makeRecord({ group_dynamic: d })); const m = computeSocialSkillsMetrics(records); for (const d of dynamics) expect(m.by_group_dynamic[d]).toBe(1); });
  });

  describe("identifySocialSkillsAlerts", () => {
    it("returns empty for clean", () => { expect(identifySocialSkillsAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifySocialSkillsAlerts([])).toEqual([]); });
    it("fires regression_disruptive", () => { 
      const a = identifySocialSkillsAlerts([makeRecord({ progress_assessment: "regression", group_dynamic: "disruptive", child_name: "Jo" })]);
      expect(a[0].type).toBe("regression_disruptive");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("regression_disruptive per-record", () => { const a = identifySocialSkillsAlerts([makeRecord({ id: "a-1", progress_assessment: "regression", group_dynamic: "disruptive" }), makeRecord({ id: "a-2", progress_assessment: "regression", group_dynamic: "disruptive" })]); expect(a.filter(x => x.type === "regression_disruptive")).toHaveLength(2); });
    it("regression without disruptive no critical", () => { expect(identifySocialSkillsAlerts([makeRecord({ progress_assessment: "regression", group_dynamic: "withdrawn" })]).find(x => x.type === "regression_disruptive")).toBeUndefined(); });
    it("disruptive without regression no critical", () => { expect(identifySocialSkillsAlerts([makeRecord({ progress_assessment: "good_progress", group_dynamic: "disruptive" })]).find(x => x.type === "regression_disruptive")).toBeUndefined(); });
    it("fires no_targets_set singular", () => { 
      const a = identifySocialSkillsAlerts([makeRecord({ targets_set: false })]);
      const f = a.find(x => x.type === "no_targets_set");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("no_targets_set plural", () => { const a = identifySocialSkillsAlerts([makeRecord({ targets_set: false }), makeRecord({ targets_set: false })]); const f = a.find(x => x.type === "no_targets_set"); expect(f!.message).toContain("2 sessions have"); });
    it("fires strengths_not_identified singular", () => { 
      const a = identifySocialSkillsAlerts([makeRecord({ strengths_identified: false })]);
      const f = a.find(x => x.type === "strengths_not_identified");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("no_positive_reinforcement not for 1", () => { expect(identifySocialSkillsAlerts([makeRecord({ positive_reinforcement: false })]).find(x => x.type === "no_positive_reinforcement")).toBeUndefined(); });
    it("no_positive_reinforcement fires for 2", () => { const a = identifySocialSkillsAlerts([makeRecord({ positive_reinforcement: false }), makeRecord({ positive_reinforcement: false })]); expect(a.find(x => x.type === "no_positive_reinforcement")).toBeDefined(); expect(a.find(x => x.type === "no_positive_reinforcement")!.severity).toBe("medium"); });
    it("no_therapeutic_input not for 1", () => { expect(identifySocialSkillsAlerts([makeRecord({ therapeutic_input: false })]).find(x => x.type === "no_therapeutic_input")).toBeUndefined(); });
    it("no_therapeutic_input fires for 2", () => { const a = identifySocialSkillsAlerts([makeRecord({ therapeutic_input: false }), makeRecord({ therapeutic_input: false })]); expect(a.find(x => x.type === "no_therapeutic_input")).toBeDefined(); expect(a.find(x => x.type === "no_therapeutic_input")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifySocialSkillsAlerts([makeRecord({ progress_assessment: "regression", group_dynamic: "disruptive", targets_set: false, strengths_identified: false, positive_reinforcement: false, therapeutic_input: false }), makeRecord({ targets_set: false, strengths_identified: false, positive_reinforcement: false, therapeutic_input: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("regression_disruptive");
      expect(types).toContain("no_targets_set");
      expect(types).toContain("strengths_not_identified");
      expect(types).toContain("no_positive_reinforcement");
      expect(types).toContain("no_therapeutic_input");
    });
  });
});

describe("tri-state judgements", () => {
  it("counts an unrecorded targets judgement in the gap alert, worded as unevidenced", () => {
    const alerts = identifySocialSkillsAlerts([makeRecord({ targets_set: null })]);
    const alert = alerts.find((a) => a.type === "no_targets_set");
    expect(alert).toBeTruthy();
    expect(alert!.message).toContain("evidenced");
  });
  it("raises no targets gap when targets are recorded as set", () => {
    const alerts = identifySocialSkillsAlerts([makeRecord({ targets_set: true })]);
    expect(alerts.some((a) => a.type === "no_targets_set")).toBe(false);
  });
  it("does not dilute engagement rates with unrecorded rows", () => {
    const rows = [true, null, null, null].map((v, i) => makeRecord({ id: `s-${i}`, child_engaged: v }));
    expect(computeSocialSkillsMetrics(rows).child_engaged_rate).toBe(100);
  });
});
