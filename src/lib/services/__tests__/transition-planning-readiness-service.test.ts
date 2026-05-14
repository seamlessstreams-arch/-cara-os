import { describe, it, expect } from "vitest";
import { _testing, type TransitionPlanningReadinessRecord } from "../transition-planning-readiness-service";

const { computeTransitionPlanningMetrics, identifyTransitionPlanningAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<TransitionPlanningReadinessRecord>): TransitionPlanningReadinessRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    transition_type: overrides?.transition_type ?? "leaving_care",
    readiness_level: overrides?.readiness_level ?? "mostly_ready",
    independence_skill: overrides?.independence_skill ?? "good",
    pathway_plan_status: overrides?.pathway_plan_status ?? "in_place",
    assessment_date: overrides?.assessment_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    assessed_by: overrides?.assessed_by ?? "Staff A",
    child_views_included: overrides?.child_views_included ?? true,
    life_skills_assessed: overrides?.life_skills_assessed ?? true,
    budgeting_skills: overrides?.budgeting_skills ?? true,
    cooking_skills: overrides?.cooking_skills ?? true,
    housing_identified: overrides?.housing_identified ?? true,
    education_employment_plan: overrides?.education_employment_plan ?? true,
    health_needs_addressed: overrides?.health_needs_addressed ?? true,
    social_network_mapped: overrides?.social_network_mapped ?? true,
    personal_advisor_allocated: overrides?.personal_advisor_allocated ?? true,
    social_worker_involved: overrides?.social_worker_involved ?? true,
    care_plan_reflects: overrides?.care_plan_reflects ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("transition-planning-readiness-service", () => {
  describe("computeTransitionPlanningMetrics", () => {
    it("returns zeros for empty", () => { const m = computeTransitionPlanningMetrics([]); expect(m.total_assessments).toBe(0); expect(m.not_ready_count).toBe(0); expect(m.not_assessed_count).toBe(0); expect(m.overdue_pathway_count).toBe(0); expect(m.not_started_pathway_count).toBe(0); expect(m.child_views_rate).toBe(0); expect(m.unique_children).toBe(0); });
    it("returns empty breakdowns", () => { const m = computeTransitionPlanningMetrics([]); expect(m.by_transition_type).toEqual({}); expect(m.by_readiness_level).toEqual({}); expect(m.by_independence_skill).toEqual({}); expect(m.by_pathway_plan_status).toEqual({}); });
    it("total_assessments counts records", () => { expect(computeTransitionPlanningMetrics([makeRecord(), makeRecord()]).total_assessments).toBe(2); });
    it("counts not_ready", () => { expect(computeTransitionPlanningMetrics([makeRecord({ readiness_level: "not_ready" })]).not_ready_count).toBe(1); });
    it("counts not_assessed", () => { expect(computeTransitionPlanningMetrics([makeRecord({ readiness_level: "not_assessed" })]).not_assessed_count).toBe(1); });
    it("does not count partially_ready as not_ready", () => { expect(computeTransitionPlanningMetrics([makeRecord({ readiness_level: "partially_ready" })]).not_ready_count).toBe(0); });
    it("counts overdue_pathway", () => { expect(computeTransitionPlanningMetrics([makeRecord({ pathway_plan_status: "overdue" })]).overdue_pathway_count).toBe(1); });
    it("counts not_started_pathway", () => { expect(computeTransitionPlanningMetrics([makeRecord({ pathway_plan_status: "not_started" })]).not_started_pathway_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { const m = computeTransitionPlanningMetrics([makeRecord()]); expect(m.child_views_rate).toBe(100); expect(m.life_skills_rate).toBe(100); expect(m.budgeting_rate).toBe(100); expect(m.cooking_rate).toBe(100); expect(m.housing_rate).toBe(100); expect(m.education_employment_rate).toBe(100); expect(m.health_needs_rate).toBe(100); expect(m.social_network_rate).toBe(100); expect(m.personal_advisor_rate).toBe(100); expect(m.social_worker_rate).toBe(100); expect(m.care_plan_rate).toBe(100); expect(m.recorded_promptly_rate).toBe(100); });
    it("child_views_rate 0 when false", () => { expect(computeTransitionPlanningMetrics([makeRecord({ child_views_included: false })]).child_views_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeTransitionPlanningMetrics([makeRecord({ budgeting_skills: true }), makeRecord({ budgeting_skills: false }), makeRecord({ budgeting_skills: true })]); expect(m.budgeting_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeTransitionPlanningMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 transition types", () => { const types = ["leaving_care","placement_move","school_transition","age_transition","step_down","return_home","semi_independence","supported_living","adoption","other"] as const; const records = types.map(t => makeRecord({ transition_type: t })); const m = computeTransitionPlanningMetrics(records); for (const t of types) expect(m.by_transition_type[t]).toBe(1); });
    it("counts all 5 readiness levels", () => { const levels = ["fully_ready","mostly_ready","partially_ready","not_ready","not_assessed"] as const; const records = levels.map(l => makeRecord({ readiness_level: l })); const m = computeTransitionPlanningMetrics(records); for (const l of levels) expect(m.by_readiness_level[l]).toBe(1); });
    it("counts all 5 independence skills", () => { const skills = ["excellent","good","developing","limited","not_assessed"] as const; const records = skills.map(s => makeRecord({ independence_skill: s })); const m = computeTransitionPlanningMetrics(records); for (const s of skills) expect(m.by_independence_skill[s]).toBe(1); });
    it("counts all 5 pathway plan statuses", () => { const statuses = ["in_place","in_progress","overdue","not_started","not_applicable"] as const; const records = statuses.map(s => makeRecord({ pathway_plan_status: s })); const m = computeTransitionPlanningMetrics(records); for (const s of statuses) expect(m.by_pathway_plan_status[s]).toBe(1); });
  });

  describe("identifyTransitionPlanningAlerts", () => {
    it("returns empty for clean", () => { expect(identifyTransitionPlanningAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyTransitionPlanningAlerts([])).toEqual([]); });
    it("fires leaving_care_not_ready with overdue pathway", () => { const a = identifyTransitionPlanningAlerts([makeRecord({ transition_type: "leaving_care", readiness_level: "not_ready", pathway_plan_status: "overdue", child_name: "Jo" })]); expect(a[0].type).toBe("leaving_care_not_ready"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Jo"); });
    it("fires leaving_care_not_ready with not_started pathway", () => { const a = identifyTransitionPlanningAlerts([makeRecord({ transition_type: "leaving_care", readiness_level: "not_ready", pathway_plan_status: "not_started" })]); expect(a.find(x => x.type === "leaving_care_not_ready")).toBeDefined(); });
    it("leaving_care not_ready with in_place no critical", () => { expect(identifyTransitionPlanningAlerts([makeRecord({ transition_type: "leaving_care", readiness_level: "not_ready", pathway_plan_status: "in_place" })]).find(x => x.type === "leaving_care_not_ready")).toBeUndefined(); });
    it("non-leaving_care not_ready with overdue no critical", () => { expect(identifyTransitionPlanningAlerts([makeRecord({ transition_type: "school_transition", readiness_level: "not_ready", pathway_plan_status: "overdue" })]).find(x => x.type === "leaving_care_not_ready")).toBeUndefined(); });
    it("fires pathway_overdue singular", () => { const a = identifyTransitionPlanningAlerts([makeRecord({ pathway_plan_status: "overdue" })]); const f = a.find(x => x.type === "pathway_overdue"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 assessment has"); });
    it("pathway_overdue plural", () => { const a = identifyTransitionPlanningAlerts([makeRecord({ pathway_plan_status: "overdue" }), makeRecord({ pathway_plan_status: "overdue" })]); const f = a.find(x => x.type === "pathway_overdue"); expect(f!.message).toContain("2 assessments have"); });
    it("fires housing_not_identified singular", () => { const a = identifyTransitionPlanningAlerts([makeRecord({ housing_identified: false })]); const f = a.find(x => x.type === "housing_not_identified"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 assessment has"); });
    it("life_skills_not_assessed not for 1", () => { expect(identifyTransitionPlanningAlerts([makeRecord({ life_skills_assessed: false })]).find(x => x.type === "life_skills_not_assessed")).toBeUndefined(); });
    it("life_skills_not_assessed fires for 2", () => { const a = identifyTransitionPlanningAlerts([makeRecord({ life_skills_assessed: false }), makeRecord({ life_skills_assessed: false })]); expect(a.find(x => x.type === "life_skills_not_assessed")).toBeDefined(); expect(a.find(x => x.type === "life_skills_not_assessed")!.severity).toBe("medium"); });
    it("no_personal_advisor not for 1", () => { expect(identifyTransitionPlanningAlerts([makeRecord({ personal_advisor_allocated: false })]).find(x => x.type === "no_personal_advisor")).toBeUndefined(); });
    it("no_personal_advisor fires for 2", () => { const a = identifyTransitionPlanningAlerts([makeRecord({ personal_advisor_allocated: false }), makeRecord({ personal_advisor_allocated: false })]); expect(a.find(x => x.type === "no_personal_advisor")).toBeDefined(); expect(a.find(x => x.type === "no_personal_advisor")!.severity).toBe("medium"); });
    it("fires all applicable", () => { const a = identifyTransitionPlanningAlerts([makeRecord({ transition_type: "leaving_care", readiness_level: "not_ready", pathway_plan_status: "overdue", housing_identified: false, life_skills_assessed: false, personal_advisor_allocated: false }), makeRecord({ pathway_plan_status: "overdue", housing_identified: false, life_skills_assessed: false, personal_advisor_allocated: false })]); const types = a.map(x => x.type); expect(types).toContain("leaving_care_not_ready"); expect(types).toContain("pathway_overdue"); expect(types).toContain("housing_not_identified"); expect(types).toContain("life_skills_not_assessed"); expect(types).toContain("no_personal_advisor"); });
  });
});
