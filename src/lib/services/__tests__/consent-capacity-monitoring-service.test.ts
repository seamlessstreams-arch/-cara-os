import { describe, it, expect } from "vitest";
import { _testing, type ConsentCapacityMonitoringRecord } from "../consent-capacity-monitoring-service";

const { computeConsentCapacityMetrics, identifyConsentCapacityAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<ConsentCapacityMonitoringRecord>): ConsentCapacityMonitoringRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    consent_area: overrides?.consent_area ?? "medical_treatment",
    capacity_level: overrides?.capacity_level ?? "full_capacity",
    decision_type: overrides?.decision_type ?? "consent_given",
    competence_assessment: overrides?.competence_assessment ?? "age_appropriate",
    assessment_date: overrides?.assessment_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    assessed_by: overrides?.assessed_by ?? "Staff A",
    child_views_sought: overrides?.child_views_sought ?? true,
    information_provided: overrides?.information_provided ?? true,
    age_appropriate_explanation: overrides?.age_appropriate_explanation ?? true,
    advocacy_offered: overrides?.advocacy_offered ?? true,
    parent_consulted: overrides?.parent_consulted ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    best_interest_documented: overrides?.best_interest_documented ?? true,
    decision_respected: overrides?.decision_respected ?? true,
    review_date_set: overrides?.review_date_set ?? true,
    care_plan_updated: overrides?.care_plan_updated ?? true,
    legal_framework_followed: overrides?.legal_framework_followed ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("consent-capacity-monitoring-service", () => {
  describe("computeConsentCapacityMetrics", () => {
    it("returns zeros for empty", () => { const m = computeConsentCapacityMetrics([]); expect(m.total_assessments).toBe(0); expect(m.lacks_capacity_count).toBe(0); expect(m.not_assessed_count).toBe(0); expect(m.refused_count).toBe(0); expect(m.best_interest_count).toBe(0); expect(m.child_views_rate).toBe(0); expect(m.unique_children).toBe(0); });
    it("returns empty breakdowns", () => { const m = computeConsentCapacityMetrics([]); expect(m.by_consent_area).toEqual({}); expect(m.by_capacity_level).toEqual({}); expect(m.by_decision_type).toEqual({}); expect(m.by_competence_assessment).toEqual({}); });
    it("total_assessments counts records", () => { expect(computeConsentCapacityMetrics([makeRecord(), makeRecord()]).total_assessments).toBe(2); });
    it("counts lacks_capacity", () => { expect(computeConsentCapacityMetrics([makeRecord({ capacity_level: "lacks_capacity" })]).lacks_capacity_count).toBe(1); });
    it("counts not_assessed", () => { expect(computeConsentCapacityMetrics([makeRecord({ capacity_level: "not_assessed" })]).not_assessed_count).toBe(1); });
    it("does not count partial_capacity as lacks", () => { expect(computeConsentCapacityMetrics([makeRecord({ capacity_level: "partial_capacity" })]).lacks_capacity_count).toBe(0); });
    it("counts refused", () => { expect(computeConsentCapacityMetrics([makeRecord({ decision_type: "consent_refused" })]).refused_count).toBe(1); });
    it("counts best_interest", () => { expect(computeConsentCapacityMetrics([makeRecord({ decision_type: "best_interest_decision" })]).best_interest_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { const m = computeConsentCapacityMetrics([makeRecord()]); expect(m.child_views_rate).toBe(100); expect(m.information_provided_rate).toBe(100); expect(m.age_appropriate_rate).toBe(100); expect(m.advocacy_rate).toBe(100); expect(m.parent_consulted_rate).toBe(100); expect(m.social_worker_rate).toBe(100); expect(m.best_interest_documented_rate).toBe(100); expect(m.decision_respected_rate).toBe(100); expect(m.review_date_rate).toBe(100); expect(m.care_plan_rate).toBe(100); expect(m.legal_framework_rate).toBe(100); expect(m.recorded_promptly_rate).toBe(100); });
    it("child_views_rate 0 when false", () => { expect(computeConsentCapacityMetrics([makeRecord({ child_views_sought: false })]).child_views_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeConsentCapacityMetrics([makeRecord({ advocacy_offered: true }), makeRecord({ advocacy_offered: false }), makeRecord({ advocacy_offered: true })]); expect(m.advocacy_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeConsentCapacityMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 consent areas", () => { const areas = ["medical_treatment","dental_treatment","mental_health","education_decisions","contact_arrangements","data_sharing","photography","activities_trips","research_participation","other"] as const; const records = areas.map(a => makeRecord({ consent_area: a })); const m = computeConsentCapacityMetrics(records); for (const a of areas) expect(m.by_consent_area[a]).toBe(1); });
    it("counts all 5 capacity levels", () => { const levels = ["full_capacity","partial_capacity","fluctuating","lacks_capacity","not_assessed"] as const; const records = levels.map(l => makeRecord({ capacity_level: l })); const m = computeConsentCapacityMetrics(records); for (const l of levels) expect(m.by_capacity_level[l]).toBe(1); });
    it("counts all 5 decision types", () => { const types = ["consent_given","consent_refused","consent_withdrawn","best_interest_decision","deferred"] as const; const records = types.map(t => makeRecord({ decision_type: t })); const m = computeConsentCapacityMetrics(records); for (const t of types) expect(m.by_decision_type[t]).toBe(1); });
    it("counts all 5 competence assessments", () => { const assessments = ["gillick_competent","approaching_competence","not_yet_competent","age_appropriate","not_assessed"] as const; const records = assessments.map(a => makeRecord({ competence_assessment: a })); const m = computeConsentCapacityMetrics(records); for (const a of assessments) expect(m.by_competence_assessment[a]).toBe(1); });
  });

  describe("identifyConsentCapacityAlerts", () => {
    it("returns empty for clean", () => { expect(identifyConsentCapacityAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyConsentCapacityAlerts([])).toEqual([]); });
    it("fires best_interest_not_documented", () => { const a = identifyConsentCapacityAlerts([makeRecord({ decision_type: "best_interest_decision", best_interest_documented: false, child_name: "Jo" })]); expect(a[0].type).toBe("best_interest_not_documented"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Jo"); });
    it("best_interest_not_documented per-record", () => { const a = identifyConsentCapacityAlerts([makeRecord({ id: "a-1", decision_type: "best_interest_decision", best_interest_documented: false }), makeRecord({ id: "a-2", decision_type: "best_interest_decision", best_interest_documented: false })]); expect(a.filter(x => x.type === "best_interest_not_documented")).toHaveLength(2); });
    it("best_interest documented no critical", () => { expect(identifyConsentCapacityAlerts([makeRecord({ decision_type: "best_interest_decision", best_interest_documented: true })]).find(x => x.type === "best_interest_not_documented")).toBeUndefined(); });
    it("non-best_interest undocumented no critical", () => { expect(identifyConsentCapacityAlerts([makeRecord({ decision_type: "consent_given", best_interest_documented: false })]).find(x => x.type === "best_interest_not_documented")).toBeUndefined(); });
    it("fires decision_not_respected singular", () => { const a = identifyConsentCapacityAlerts([makeRecord({ decision_respected: false })]); const f = a.find(x => x.type === "decision_not_respected"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 assessment shows"); });
    it("decision_not_respected plural", () => { const a = identifyConsentCapacityAlerts([makeRecord({ decision_respected: false }), makeRecord({ decision_respected: false })]); const f = a.find(x => x.type === "decision_not_respected"); expect(f!.message).toContain("2 assessments show"); });
    it("fires advocacy_not_offered singular", () => { const a = identifyConsentCapacityAlerts([makeRecord({ advocacy_offered: false })]); const f = a.find(x => x.type === "advocacy_not_offered"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 assessment has"); });
    it("information_not_provided not for 1", () => { expect(identifyConsentCapacityAlerts([makeRecord({ information_provided: false })]).find(x => x.type === "information_not_provided")).toBeUndefined(); });
    it("information_not_provided fires for 2", () => { const a = identifyConsentCapacityAlerts([makeRecord({ information_provided: false }), makeRecord({ information_provided: false })]); expect(a.find(x => x.type === "information_not_provided")).toBeDefined(); expect(a.find(x => x.type === "information_not_provided")!.severity).toBe("medium"); });
    it("review_date_not_set not for 1", () => { expect(identifyConsentCapacityAlerts([makeRecord({ review_date_set: false })]).find(x => x.type === "review_date_not_set")).toBeUndefined(); });
    it("review_date_not_set fires for 2", () => { const a = identifyConsentCapacityAlerts([makeRecord({ review_date_set: false }), makeRecord({ review_date_set: false })]); expect(a.find(x => x.type === "review_date_not_set")).toBeDefined(); expect(a.find(x => x.type === "review_date_not_set")!.severity).toBe("medium"); });
    it("fires all applicable", () => { const a = identifyConsentCapacityAlerts([makeRecord({ decision_type: "best_interest_decision", best_interest_documented: false, decision_respected: false, advocacy_offered: false, information_provided: false, review_date_set: false }), makeRecord({ decision_respected: false, advocacy_offered: false, information_provided: false, review_date_set: false })]); const types = a.map(x => x.type); expect(types).toContain("best_interest_not_documented"); expect(types).toContain("decision_not_respected"); expect(types).toContain("advocacy_not_offered"); expect(types).toContain("information_not_provided"); expect(types).toContain("review_date_not_set"); });
  });
});
