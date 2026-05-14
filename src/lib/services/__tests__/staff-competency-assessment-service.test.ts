import { describe, it, expect } from "vitest";
import { _testing, type StaffCompetencyAssessmentRecord } from "../staff-competency-assessment-service";

const { computeStaffCompetencyMetrics, identifyStaffCompetencyAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<StaffCompetencyAssessmentRecord>): StaffCompetencyAssessmentRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    competency_area: overrides?.competency_area ?? "medication_administration",
    assessment_method: overrides?.assessment_method ?? "direct_observation",
    competency_rating: overrides?.competency_rating ?? "meets_expectations",
    action_required: overrides?.action_required ?? "none",
    assessment_date: overrides?.assessment_date ?? now.toISOString().split("T")[0],
    staff_name: overrides?.staff_name ?? "Staff A",
    staff_role: overrides?.staff_role ?? "RSW",
    assessor_name: overrides?.assessor_name ?? "Manager A",
    theory_demonstrated: overrides?.theory_demonstrated ?? true,
    practical_demonstrated: overrides?.practical_demonstrated ?? true,
    reflective_practice_shown: overrides?.reflective_practice_shown ?? true,
    values_aligned: overrides?.values_aligned ?? true,
    child_centred_approach: overrides?.child_centred_approach ?? true,
    evidence_documented: overrides?.evidence_documented ?? true,
    development_plan_updated: overrides?.development_plan_updated ?? true,
    staff_agreed_outcome: overrides?.staff_agreed_outcome ?? true,
    follow_up_date_set: overrides?.follow_up_date_set ?? true,
    competency_maintained: overrides?.competency_maintained ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_assessment_date: "next_assessment_date" in (overrides ?? {}) ? (overrides!.next_assessment_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("staff-competency-assessment-service", () => {
  describe("computeStaffCompetencyMetrics", () => {
    it("returns zeros for empty", () => { const m = computeStaffCompetencyMetrics([]); expect(m.total_assessments).toBe(0); expect(m.exceeds_count).toBe(0); expect(m.meets_count).toBe(0); expect(m.developing_count).toBe(0); expect(m.below_count).toBe(0); expect(m.not_competent_count).toBe(0); expect(m.competency_maintained_rate).toBe(0); expect(m.action_required_count).toBe(0); expect(m.unique_staff).toBe(0); });
    it("returns empty breakdowns", () => { const m = computeStaffCompetencyMetrics([]); expect(m.by_competency_area).toEqual({}); expect(m.by_assessment_method).toEqual({}); expect(m.by_competency_rating).toEqual({}); expect(m.by_action_required).toEqual({}); });
    it("counts exceeds", () => { expect(computeStaffCompetencyMetrics([makeRecord({ competency_rating: "exceeds_expectations" })]).exceeds_count).toBe(1); });
    it("counts meets", () => { expect(computeStaffCompetencyMetrics([makeRecord()]).meets_count).toBe(1); });
    it("counts developing", () => { expect(computeStaffCompetencyMetrics([makeRecord({ competency_rating: "developing" })]).developing_count).toBe(1); });
    it("counts below", () => { expect(computeStaffCompetencyMetrics([makeRecord({ competency_rating: "below_expectations" })]).below_count).toBe(1); });
    it("counts not_competent", () => { expect(computeStaffCompetencyMetrics([makeRecord({ competency_rating: "not_yet_competent" })]).not_competent_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { const m = computeStaffCompetencyMetrics([makeRecord()]); expect(m.competency_maintained_rate).toBe(100); expect(m.theory_demonstrated_rate).toBe(100); expect(m.practical_demonstrated_rate).toBe(100); expect(m.reflective_practice_rate).toBe(100); expect(m.values_aligned_rate).toBe(100); expect(m.child_centred_rate).toBe(100); expect(m.evidence_documented_rate).toBe(100); expect(m.development_plan_rate).toBe(100); expect(m.staff_agreed_rate).toBe(100); expect(m.follow_up_set_rate).toBe(100); });
    it("competency_maintained_rate 0 when false", () => { expect(computeStaffCompetencyMetrics([makeRecord({ competency_maintained: false })]).competency_maintained_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeStaffCompetencyMetrics([makeRecord({ competency_maintained: true }), makeRecord({ competency_maintained: false }), makeRecord({ competency_maintained: true })]); expect(m.competency_maintained_rate).toBe(66.7); });
    it("action_required_count excludes none", () => { const m = computeStaffCompetencyMetrics([makeRecord(), makeRecord({ action_required: "additional_training" }), makeRecord({ action_required: "mentoring" })]); expect(m.action_required_count).toBe(2); });
    it("unique_staff distinct", () => { const m = computeStaffCompetencyMetrics([makeRecord({ staff_name: "A" }), makeRecord({ staff_name: "B" }), makeRecord({ staff_name: "A" })]); expect(m.unique_staff).toBe(2); });
    it("counts all 10 areas", () => { const areas = ["medication_administration","physical_intervention","safeguarding_knowledge","first_aid","recording_standards","communication_skills","key_working","behaviour_management","health_and_safety","other"] as const; const records = areas.map(a => makeRecord({ competency_area: a })); const m = computeStaffCompetencyMetrics(records); for (const a of areas) expect(m.by_competency_area[a]).toBe(1); });
    it("counts all 10 methods", () => { const methods = ["direct_observation","knowledge_test","practical_demonstration","case_study","supervision_discussion","peer_review","self_assessment","portfolio_review","scenario_exercise","other"] as const; const records = methods.map(m => makeRecord({ assessment_method: m })); const met = computeStaffCompetencyMetrics(records); for (const m of methods) expect(met.by_assessment_method[m]).toBe(1); });
    it("counts all 5 ratings", () => { const ratings = ["exceeds_expectations","meets_expectations","developing","below_expectations","not_yet_competent"] as const; const records = ratings.map(r => makeRecord({ competency_rating: r })); const m = computeStaffCompetencyMetrics(records); for (const r of ratings) expect(m.by_competency_rating[r]).toBe(1); });
    it("counts all 5 actions", () => { const actions = ["none","additional_training","mentoring","supervised_practice","reassessment"] as const; const records = actions.map(a => makeRecord({ action_required: a })); const m = computeStaffCompetencyMetrics(records); for (const a of actions) expect(m.by_action_required[a]).toBe(1); });
  });

  describe("identifyStaffCompetencyAlerts", () => {
    it("returns empty for clean", () => { expect(identifyStaffCompetencyAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyStaffCompetencyAlerts([])).toEqual([]); });
    it("fires medication_not_competent", () => { const a = identifyStaffCompetencyAlerts([makeRecord({ competency_area: "medication_administration", competency_rating: "not_yet_competent", staff_name: "Jo", assessment_date: "2026-05-14" })]); expect(a[0].type).toBe("medication_not_competent"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Jo"); });
    it("medication_not_competent per-record", () => { const a = identifyStaffCompetencyAlerts([makeRecord({ id: "a-1", competency_area: "medication_administration", competency_rating: "not_yet_competent" }), makeRecord({ id: "a-2", competency_area: "medication_administration", competency_rating: "not_yet_competent" })]); expect(a.filter(x => x.type === "medication_not_competent")).toHaveLength(2); });
    it("no medication alert if other area", () => { const a = identifyStaffCompetencyAlerts([makeRecord({ competency_area: "first_aid", competency_rating: "not_yet_competent" })]); expect(a.filter(x => x.type === "medication_not_competent")).toHaveLength(0); });
    it("fires below_expectations singular", () => { const a = identifyStaffCompetencyAlerts([makeRecord({ competency_rating: "below_expectations" })]); const f = a.find(x => x.type === "below_expectations"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 assessment is"); });
    it("below_expectations counts not_yet_competent too", () => { const a = identifyStaffCompetencyAlerts([makeRecord({ competency_area: "first_aid", competency_rating: "not_yet_competent" })]); expect(a.find(x => x.type === "below_expectations")).toBeDefined(); });
    it("below_expectations plural", () => { const a = identifyStaffCompetencyAlerts([makeRecord({ competency_rating: "below_expectations" }), makeRecord({ competency_rating: "below_expectations" })]); const f = a.find(x => x.type === "below_expectations"); expect(f!.message).toContain("2 assessments are"); });
    it("evidence_not_documented not for 1", () => { expect(identifyStaffCompetencyAlerts([makeRecord({ evidence_documented: false })]).find(x => x.type === "evidence_not_documented")).toBeUndefined(); });
    it("evidence_not_documented fires for 2", () => { const a = identifyStaffCompetencyAlerts([makeRecord({ evidence_documented: false }), makeRecord({ evidence_documented: false })]); expect(a.find(x => x.type === "evidence_not_documented")).toBeDefined(); });
    it("development_plan_not_updated not for 2", () => { expect(identifyStaffCompetencyAlerts([makeRecord({ development_plan_updated: false }), makeRecord({ development_plan_updated: false })]).find(x => x.type === "development_plan_not_updated")).toBeUndefined(); });
    it("development_plan_not_updated fires for 3", () => { const a = identifyStaffCompetencyAlerts([makeRecord({ development_plan_updated: false }), makeRecord({ development_plan_updated: false }), makeRecord({ development_plan_updated: false })]); expect(a.find(x => x.type === "development_plan_not_updated")).toBeDefined(); });
    it("staff_not_agreed not for 1", () => { expect(identifyStaffCompetencyAlerts([makeRecord({ staff_agreed_outcome: false })]).find(x => x.type === "staff_not_agreed")).toBeUndefined(); });
    it("staff_not_agreed fires for 2", () => { const a = identifyStaffCompetencyAlerts([makeRecord({ staff_agreed_outcome: false }), makeRecord({ staff_agreed_outcome: false })]); expect(a.find(x => x.type === "staff_not_agreed")).toBeDefined(); });
    it("fires all applicable", () => { const a = identifyStaffCompetencyAlerts([makeRecord({ competency_area: "medication_administration", competency_rating: "not_yet_competent", evidence_documented: false, development_plan_updated: false, staff_agreed_outcome: false }), makeRecord({ evidence_documented: false, development_plan_updated: false, staff_agreed_outcome: false }), makeRecord({ development_plan_updated: false })]); const types = a.map(x => x.type); expect(types).toContain("medication_not_competent"); expect(types).toContain("below_expectations"); expect(types).toContain("evidence_not_documented"); expect(types).toContain("development_plan_not_updated"); expect(types).toContain("staff_not_agreed"); });
  });
});
