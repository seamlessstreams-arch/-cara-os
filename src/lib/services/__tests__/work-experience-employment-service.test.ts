import { describe, it, expect } from "vitest";
import { _testing, type WorkExperienceEmploymentRecord } from "../work-experience-employment-service";

const { computeWorkExperienceMetrics, identifyWorkExperienceAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<WorkExperienceEmploymentRecord>): WorkExperienceEmploymentRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    placement_type: overrides?.placement_type ?? "work_experience",
    readiness_level: overrides?.readiness_level ?? "nearly_ready",
    employer_feedback: overrides?.employer_feedback ?? "good",
    skill_acquisition: overrides?.skill_acquisition ?? "good_gain",
    session_date: overrides?.session_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    supported_by: overrides?.supported_by ?? "Staff A",
    child_consented: overrides?.child_consented ?? true,
    age_appropriate: overrides?.age_appropriate ?? true,
    risk_assessed: overrides?.risk_assessed ?? true,
    safeguarding_checked: overrides?.safeguarding_checked ?? true,
    dbs_verified: overrides?.dbs_verified ?? true,
    insurance_confirmed: overrides?.insurance_confirmed ?? true,
    care_plan_reflects: overrides?.care_plan_reflects ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    parent_informed: overrides?.parent_informed ?? true,
    pathway_plan_updated: overrides?.pathway_plan_updated ?? true,
    transport_arranged: overrides?.transport_arranged ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("work-experience-employment-service", () => {
  describe("computeWorkExperienceMetrics", () => {
    it("returns zeros for empty", () => { const m = computeWorkExperienceMetrics([]); expect(m.total_placements).toBe(0); expect(m.not_ready_count).toBe(0); expect(m.not_suitable_count).toBe(0); expect(m.no_gain_count).toBe(0); expect(m.decline_count).toBe(0); expect(m.child_consented_rate).toBe(0); expect(m.unique_children).toBe(0); });
    it("returns empty breakdowns", () => { const m = computeWorkExperienceMetrics([]); expect(m.by_placement_type).toEqual({}); expect(m.by_readiness_level).toEqual({}); expect(m.by_employer_feedback).toEqual({}); expect(m.by_skill_acquisition).toEqual({}); });
    it("total_placements counts records", () => { expect(computeWorkExperienceMetrics([makeRecord(), makeRecord()]).total_placements).toBe(2); });
    it("counts not_ready", () => { expect(computeWorkExperienceMetrics([makeRecord({ readiness_level: "not_ready" })]).not_ready_count).toBe(1); });
    it("counts not_suitable", () => { expect(computeWorkExperienceMetrics([makeRecord({ employer_feedback: "not_suitable" })]).not_suitable_count).toBe(1); });
    it("does not count needs_improvement as not_suitable", () => { expect(computeWorkExperienceMetrics([makeRecord({ employer_feedback: "needs_improvement" })]).not_suitable_count).toBe(0); });
    it("counts no_gain", () => { expect(computeWorkExperienceMetrics([makeRecord({ skill_acquisition: "no_gain" })]).no_gain_count).toBe(1); });
    it("counts decline", () => { expect(computeWorkExperienceMetrics([makeRecord({ skill_acquisition: "decline" })]).decline_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { const m = computeWorkExperienceMetrics([makeRecord()]); expect(m.child_consented_rate).toBe(100); expect(m.age_appropriate_rate).toBe(100); expect(m.risk_assessed_rate).toBe(100); expect(m.safeguarding_rate).toBe(100); expect(m.dbs_verified_rate).toBe(100); expect(m.insurance_rate).toBe(100); expect(m.care_plan_rate).toBe(100); expect(m.social_worker_rate).toBe(100); expect(m.parent_informed_rate).toBe(100); expect(m.pathway_plan_rate).toBe(100); expect(m.transport_rate).toBe(100); expect(m.recorded_promptly_rate).toBe(100); });
    it("child_consented_rate 0 when false", () => { expect(computeWorkExperienceMetrics([makeRecord({ child_consented: false })]).child_consented_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeWorkExperienceMetrics([makeRecord({ dbs_verified: true }), makeRecord({ dbs_verified: false }), makeRecord({ dbs_verified: true })]); expect(m.dbs_verified_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeWorkExperienceMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 placement types", () => { const types = ["work_experience","volunteer_placement","apprenticeship","part_time_employment","career_taster","cv_workshop","interview_practice","job_search_support","enterprise_activity","other"] as const; const records = types.map(t => makeRecord({ placement_type: t })); const m = computeWorkExperienceMetrics(records); for (const t of types) expect(m.by_placement_type[t]).toBe(1); });
    it("counts all 5 readiness levels", () => { const levels = ["work_ready","nearly_ready","developing","early_stage","not_ready"] as const; const records = levels.map(l => makeRecord({ readiness_level: l })); const m = computeWorkExperienceMetrics(records); for (const l of levels) expect(m.by_readiness_level[l]).toBe(1); });
    it("counts all 5 employer feedbacks", () => { const feedbacks = ["excellent","good","satisfactory","needs_improvement","not_suitable"] as const; const records = feedbacks.map(f => makeRecord({ employer_feedback: f })); const m = computeWorkExperienceMetrics(records); for (const f of feedbacks) expect(m.by_employer_feedback[f]).toBe(1); });
    it("counts all 5 skill acquisitions", () => { const acquisitions = ["significant_gain","good_gain","some_gain","no_gain","decline"] as const; const records = acquisitions.map(a => makeRecord({ skill_acquisition: a })); const m = computeWorkExperienceMetrics(records); for (const a of acquisitions) expect(m.by_skill_acquisition[a]).toBe(1); });
  });

  describe("identifyWorkExperienceAlerts", () => {
    it("returns empty for clean", () => { expect(identifyWorkExperienceAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyWorkExperienceAlerts([])).toEqual([]); });
    it("fires not_suitable_declining", () => { const a = identifyWorkExperienceAlerts([makeRecord({ employer_feedback: "not_suitable", skill_acquisition: "decline", child_name: "Jo" })]); expect(a[0].type).toBe("not_suitable_declining"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Jo"); });
    it("not_suitable_declining per-record", () => { const a = identifyWorkExperienceAlerts([makeRecord({ id: "a-1", employer_feedback: "not_suitable", skill_acquisition: "decline" }), makeRecord({ id: "a-2", employer_feedback: "not_suitable", skill_acquisition: "decline" })]); expect(a.filter(x => x.type === "not_suitable_declining")).toHaveLength(2); });
    it("not_suitable without decline no critical", () => { expect(identifyWorkExperienceAlerts([makeRecord({ employer_feedback: "not_suitable", skill_acquisition: "good_gain" })]).find(x => x.type === "not_suitable_declining")).toBeUndefined(); });
    it("decline without not_suitable no critical", () => { expect(identifyWorkExperienceAlerts([makeRecord({ employer_feedback: "good", skill_acquisition: "decline" })]).find(x => x.type === "not_suitable_declining")).toBeUndefined(); });
    it("fires no_safeguarding_check singular", () => { const a = identifyWorkExperienceAlerts([makeRecord({ safeguarding_checked: false })]); const f = a.find(x => x.type === "no_safeguarding_check"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 placement has"); });
    it("fires no_dbs_verified singular", () => { const a = identifyWorkExperienceAlerts([makeRecord({ dbs_verified: false })]); const f = a.find(x => x.type === "no_dbs_verified"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 placement has"); });
    it("no_risk_assessment not for 1", () => { expect(identifyWorkExperienceAlerts([makeRecord({ risk_assessed: false })]).find(x => x.type === "no_risk_assessment")).toBeUndefined(); });
    it("no_risk_assessment fires for 2", () => { const a = identifyWorkExperienceAlerts([makeRecord({ risk_assessed: false }), makeRecord({ risk_assessed: false })]); expect(a.find(x => x.type === "no_risk_assessment")).toBeDefined(); expect(a.find(x => x.type === "no_risk_assessment")!.severity).toBe("medium"); });
    it("no_pathway_plan not for 1", () => { expect(identifyWorkExperienceAlerts([makeRecord({ pathway_plan_updated: false })]).find(x => x.type === "no_pathway_plan")).toBeUndefined(); });
    it("no_pathway_plan fires for 2", () => { const a = identifyWorkExperienceAlerts([makeRecord({ pathway_plan_updated: false }), makeRecord({ pathway_plan_updated: false })]); expect(a.find(x => x.type === "no_pathway_plan")).toBeDefined(); expect(a.find(x => x.type === "no_pathway_plan")!.severity).toBe("medium"); });
    it("fires all applicable", () => { const a = identifyWorkExperienceAlerts([makeRecord({ employer_feedback: "not_suitable", skill_acquisition: "decline", safeguarding_checked: false, dbs_verified: false, risk_assessed: false, pathway_plan_updated: false }), makeRecord({ safeguarding_checked: false, dbs_verified: false, risk_assessed: false, pathway_plan_updated: false })]); const types = a.map(x => x.type); expect(types).toContain("not_suitable_declining"); expect(types).toContain("no_safeguarding_check"); expect(types).toContain("no_dbs_verified"); expect(types).toContain("no_risk_assessment"); expect(types).toContain("no_pathway_plan"); });
  });
});
