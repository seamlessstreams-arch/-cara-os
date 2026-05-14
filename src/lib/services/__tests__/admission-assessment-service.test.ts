import { describe, it, expect } from "vitest";
import { _testing, type AdmissionAssessmentRecord } from "../admission-assessment-service";

const { computeAdmissionAssessmentMetrics, identifyAdmissionAssessmentAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<AdmissionAssessmentRecord>): AdmissionAssessmentRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    assessment_stage: overrides?.assessment_stage ?? "initial_assessment",
    suitability_decision: overrides?.suitability_decision ?? "suitable",
    matching_outcome: overrides?.matching_outcome ?? "good_match",
    referral_source: overrides?.referral_source ?? "local_authority",
    assessment_date: overrides?.assessment_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : "child-1",
    placing_authority: overrides?.placing_authority ?? "LA-1",
    impact_risk_completed: overrides?.impact_risk_completed ?? true,
    matching_criteria_met: overrides?.matching_criteria_met ?? true,
    existing_children_consulted: overrides?.existing_children_consulted ?? true,
    pre_admission_visit_completed: overrides?.pre_admission_visit_completed ?? true,
    care_plan_received: overrides?.care_plan_received ?? true,
    health_assessment_available: overrides?.health_assessment_available ?? true,
    education_info_received: overrides?.education_info_received ?? true,
    risk_assessments_reviewed: overrides?.risk_assessments_reviewed ?? true,
    safeguarding_info_shared: overrides?.safeguarding_info_shared ?? true,
    placement_plan_agreed: overrides?.placement_plan_agreed ?? true,
    key_worker_allocated: overrides?.key_worker_allocated ?? true,
    bedroom_prepared: overrides?.bedroom_prepared ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    assessed_by: overrides?.assessed_by ?? "Staff A",
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("admission-assessment-service", () => {
  describe("computeAdmissionAssessmentMetrics", () => {
    it("returns zeros for empty", () => { const m = computeAdmissionAssessmentMetrics([]); expect(m.total_assessments).toBe(0); expect(m.suitable_count).toBe(0); expect(m.unsuitable_count).toBe(0); expect(m.pending_count).toBe(0); expect(m.impact_risk_rate).toBe(0); expect(m.unique_children).toBe(0); });
    it("returns empty breakdowns", () => { const m = computeAdmissionAssessmentMetrics([]); expect(m.by_assessment_stage).toEqual({}); expect(m.by_suitability_decision).toEqual({}); expect(m.by_matching_outcome).toEqual({}); expect(m.by_referral_source).toEqual({}); });
    it("counts suitable", () => { const m = computeAdmissionAssessmentMetrics([makeRecord()]); expect(m.suitable_count).toBe(1); });
    it("counts unsuitable", () => { const m = computeAdmissionAssessmentMetrics([makeRecord({ suitability_decision: "unsuitable" })]); expect(m.unsuitable_count).toBe(1); });
    it("counts pending", () => { const m = computeAdmissionAssessmentMetrics([makeRecord({ suitability_decision: "pending" })]); expect(m.pending_count).toBe(1); });
    it("counts excellent_match", () => { const m = computeAdmissionAssessmentMetrics([makeRecord({ matching_outcome: "excellent_match" })]); expect(m.excellent_match_count).toBe(1); });
    it("counts poor_match", () => { const m = computeAdmissionAssessmentMetrics([makeRecord({ matching_outcome: "poor_match" })]); expect(m.poor_match_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { const m = computeAdmissionAssessmentMetrics([makeRecord()]); expect(m.impact_risk_rate).toBe(100); expect(m.matching_criteria_rate).toBe(100); expect(m.existing_children_consulted_rate).toBe(100); expect(m.pre_admission_visit_rate).toBe(100); expect(m.care_plan_received_rate).toBe(100); expect(m.health_assessment_rate).toBe(100); expect(m.education_info_rate).toBe(100); expect(m.risk_assessments_rate).toBe(100); expect(m.safeguarding_shared_rate).toBe(100); expect(m.placement_plan_rate).toBe(100); expect(m.key_worker_rate).toBe(100); expect(m.bedroom_prepared_rate).toBe(100); });
    it("impact_risk_rate 0 when false", () => { expect(computeAdmissionAssessmentMetrics([makeRecord({ impact_risk_completed: false })]).impact_risk_rate).toBe(0); });
    it("unique_children distinct", () => { const m = computeAdmissionAssessmentMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("mixed boolean rate", () => { const m = computeAdmissionAssessmentMetrics([makeRecord({ impact_risk_completed: true }), makeRecord({ impact_risk_completed: false }), makeRecord({ impact_risk_completed: true })]); expect(m.impact_risk_rate).toBe(66.7); });
    it("counts all 10 stages", () => { const stages = ["pre_referral_screening","referral_received","initial_assessment","matching_review","pre_admission_visit","panel_decision","admission_day","72_hour_review","initial_care_plan","other"] as const; const records = stages.map(s => makeRecord({ assessment_stage: s })); const m = computeAdmissionAssessmentMetrics(records); for (const s of stages) expect(m.by_assessment_stage[s]).toBe(1); });
    it("counts all 5 decisions", () => { const decs = ["suitable","suitable_with_conditions","unsuitable","further_assessment","pending"] as const; const records = decs.map(d => makeRecord({ suitability_decision: d })); const m = computeAdmissionAssessmentMetrics(records); for (const d of decs) expect(m.by_suitability_decision[d]).toBe(1); });
    it("counts all 5 outcomes", () => { const outcomes = ["excellent_match","good_match","acceptable_match","poor_match","not_assessed"] as const; const records = outcomes.map(o => makeRecord({ matching_outcome: o })); const m = computeAdmissionAssessmentMetrics(records); for (const o of outcomes) expect(m.by_matching_outcome[o]).toBe(1); });
    it("counts all 10 sources", () => { const sources = ["local_authority","other_provider","emergency_placement","court_directed","step_down","step_up","sibling_placement","parent_request","secure_transfer","other"] as const; const records = sources.map(s => makeRecord({ referral_source: s })); const m = computeAdmissionAssessmentMetrics(records); for (const s of sources) expect(m.by_referral_source[s]).toBe(1); });
  });

  describe("identifyAdmissionAssessmentAlerts", () => {
    it("returns empty for clean", () => { expect(identifyAdmissionAssessmentAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyAdmissionAssessmentAlerts([])).toEqual([]); });
    it("fires poor_match_admitted", () => { const a = identifyAdmissionAssessmentAlerts([makeRecord({ matching_outcome: "poor_match", suitability_decision: "suitable", child_name: "X", assessment_date: "2026-05-14" })]); expect(a[0].type).toBe("poor_match_admitted"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("X"); });
    it("poor_match_admitted per-record", () => { const a = identifyAdmissionAssessmentAlerts([makeRecord({ id: "a-1", matching_outcome: "poor_match", suitability_decision: "suitable" }), makeRecord({ id: "a-2", matching_outcome: "poor_match", suitability_decision: "suitable" })]); expect(a.filter(x => x.type === "poor_match_admitted")).toHaveLength(2); });
    it("no poor_match if unsuitable", () => { const a = identifyAdmissionAssessmentAlerts([makeRecord({ matching_outcome: "poor_match", suitability_decision: "unsuitable" })]); expect(a.filter(x => x.type === "poor_match_admitted")).toHaveLength(0); });
    it("fires impact_risk_incomplete singular", () => { const a = identifyAdmissionAssessmentAlerts([makeRecord({ impact_risk_completed: false })]); const f = a.find(x => x.type === "impact_risk_incomplete"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 assessment has"); });
    it("impact_risk_incomplete plural", () => { const a = identifyAdmissionAssessmentAlerts([makeRecord({ impact_risk_completed: false }), makeRecord({ impact_risk_completed: false })]); const f = a.find(x => x.type === "impact_risk_incomplete"); expect(f!.message).toContain("2 assessments have"); });
    it("fires children_not_consulted", () => { const a = identifyAdmissionAssessmentAlerts([makeRecord({ existing_children_consulted: false })]); expect(a.find(x => x.type === "children_not_consulted")).toBeDefined(); });
    it("care_plan_missing not for 1", () => { expect(identifyAdmissionAssessmentAlerts([makeRecord({ care_plan_received: false })]).find(x => x.type === "care_plan_missing")).toBeUndefined(); });
    it("care_plan_missing fires for 2", () => { const a = identifyAdmissionAssessmentAlerts([makeRecord({ care_plan_received: false }), makeRecord({ care_plan_received: false })]); expect(a.find(x => x.type === "care_plan_missing")).toBeDefined(); });
    it("key_worker_not_allocated not for 1", () => { expect(identifyAdmissionAssessmentAlerts([makeRecord({ key_worker_allocated: false })]).find(x => x.type === "key_worker_not_allocated")).toBeUndefined(); });
    it("key_worker_not_allocated fires for 2", () => { const a = identifyAdmissionAssessmentAlerts([makeRecord({ key_worker_allocated: false }), makeRecord({ key_worker_allocated: false })]); expect(a.find(x => x.type === "key_worker_not_allocated")).toBeDefined(); });
    it("fires all applicable", () => { const a = identifyAdmissionAssessmentAlerts([makeRecord({ matching_outcome: "poor_match", suitability_decision: "suitable", impact_risk_completed: false, existing_children_consulted: false, care_plan_received: false, key_worker_allocated: false }), makeRecord({ care_plan_received: false, key_worker_allocated: false })]); const types = a.map(x => x.type); expect(types).toContain("poor_match_admitted"); expect(types).toContain("impact_risk_incomplete"); expect(types).toContain("children_not_consulted"); expect(types).toContain("care_plan_missing"); expect(types).toContain("key_worker_not_allocated"); });
  });
});
