import { describe, it, expect } from "vitest";
import { _testing, type StaffMedicationCompetencyRecord } from "../staff-medication-competency-service";

const { computeStaffMedicationCompetencyMetrics, identifyStaffMedicationCompetencyAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<StaffMedicationCompetencyRecord>): StaffMedicationCompetencyRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    competency_type: overrides?.competency_type ?? "initial_assessment",
    assessment_outcome: overrides?.assessment_outcome ?? "competent",
    medication_category: overrides?.medication_category ?? "oral_medication",
    training_provider: overrides?.training_provider ?? "in_house_trainer",
    assessment_date: overrides?.assessment_date ?? now.toISOString().split("T")[0],
    staff_name: overrides?.staff_name ?? "Staff A",
    assessed_by: overrides?.assessed_by ?? "Manager A",
    theory_passed: overrides?.theory_passed ?? true,
    practical_observed: overrides?.practical_observed ?? true,
    error_procedure_known: overrides?.error_procedure_known ?? true,
    storage_knowledge: overrides?.storage_knowledge ?? true,
    controlled_drug_trained: overrides?.controlled_drug_trained ?? true,
    side_effects_knowledge: overrides?.side_effects_knowledge ?? true,
    consent_understanding: overrides?.consent_understanding ?? true,
    record_keeping_competent: overrides?.record_keeping_competent ?? true,
    emergency_response_trained: overrides?.emergency_response_trained ?? true,
    disposal_knowledge: overrides?.disposal_knowledge ?? true,
    child_specific_trained: overrides?.child_specific_trained ?? true,
    refresher_scheduled: overrides?.refresher_scheduled ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("staff-medication-competency-service", () => {
  describe("computeStaffMedicationCompetencyMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeStaffMedicationCompetencyMetrics([]);
      expect(m.total_assessments).toBe(0);;
      expect(m.competent_count).toBe(0);
      expect(m.not_yet_competent_count).toBe(0);
      expect(m.requires_retraining_count).toBe(0);
      expect(m.suspended_count).toBe(0);
      expect(m.theory_passed_rate).toBeNull();;
      expect(m.unique_staff).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeStaffMedicationCompetencyMetrics([]);
      expect(m.by_competency_type).toEqual({});
      expect(m.by_assessment_outcome).toEqual({});
      expect(m.by_medication_category).toEqual({});
      expect(m.by_training_provider).toEqual({});
    });
    it("counts competent", () => { expect(computeStaffMedicationCompetencyMetrics([makeRecord()]).competent_count).toBe(1); });
    it("counts not_yet_competent", () => { expect(computeStaffMedicationCompetencyMetrics([makeRecord({ assessment_outcome: "not_yet_competent" })]).not_yet_competent_count).toBe(1); });
    it("counts requires_retraining", () => { expect(computeStaffMedicationCompetencyMetrics([makeRecord({ assessment_outcome: "requires_retraining" })]).requires_retraining_count).toBe(1); });
    it("counts suspended", () => { expect(computeStaffMedicationCompetencyMetrics([makeRecord({ assessment_outcome: "suspended" })]).suspended_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeStaffMedicationCompetencyMetrics([makeRecord()]);
      expect(m.theory_passed_rate).toBe(100);
      expect(m.practical_observed_rate).toBe(100);
      expect(m.error_procedure_rate).toBe(100);
      expect(m.storage_knowledge_rate).toBe(100);
      expect(m.controlled_drug_rate).toBe(100);
      expect(m.side_effects_rate).toBe(100);
      expect(m.consent_understanding_rate).toBe(100);
      expect(m.record_keeping_rate).toBe(100);
      expect(m.emergency_response_rate).toBe(100);
      expect(m.disposal_knowledge_rate).toBe(100);
      expect(m.child_specific_rate).toBe(100);
      expect(m.refresher_scheduled_rate).toBe(100);
    });
    it("theory_passed_rate 0 when false", () => { expect(computeStaffMedicationCompetencyMetrics([makeRecord({ theory_passed: false })]).theory_passed_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeStaffMedicationCompetencyMetrics([makeRecord({ theory_passed: true }), makeRecord({ theory_passed: false }), makeRecord({ theory_passed: true })]); expect(m.theory_passed_rate).toBe(66.7); });
    it("unique_staff distinct", () => { const m = computeStaffMedicationCompetencyMetrics([makeRecord({ staff_name: "A" }), makeRecord({ staff_name: "B" }), makeRecord({ staff_name: "A" })]); expect(m.unique_staff).toBe(2); });
    it("counts all 10 competency types", () => { const types = ["initial_assessment","annual_review","observed_practice","knowledge_test","controlled_drug_competency","self_administration_support","error_retraining","specialist_medication","emergency_medication","other"] as const; const records = types.map(t => makeRecord({ competency_type: t })); const m = computeStaffMedicationCompetencyMetrics(records); for (const t of types) expect(m.by_competency_type[t]).toBe(1); });
    it("counts all 5 assessment outcomes", () => { const outcomes = ["competent","competent_with_conditions","not_yet_competent","requires_retraining","suspended"] as const; const records = outcomes.map(o => makeRecord({ assessment_outcome: o })); const m = computeStaffMedicationCompetencyMetrics(records); for (const o of outcomes) expect(m.by_assessment_outcome[o]).toBe(1); });
    it("counts all 10 medication categories", () => { const cats = ["oral_medication","topical","inhaler","injection","controlled_drugs","prn_medication","emergency_medication","homely_remedies","supplements","other"] as const; const records = cats.map(c => makeRecord({ medication_category: c })); const m = computeStaffMedicationCompetencyMetrics(records); for (const c of cats) expect(m.by_medication_category[c]).toBe(1); });
    it("counts all 5 training providers", () => { const providers = ["in_house_trainer","external_provider","pharmacy","nhs_training","online_module"] as const; const records = providers.map(p => makeRecord({ training_provider: p })); const m = computeStaffMedicationCompetencyMetrics(records); for (const p of providers) expect(m.by_training_provider[p]).toBe(1); });
    it("total_assessments counts all", () => { expect(computeStaffMedicationCompetencyMetrics([makeRecord(), makeRecord(), makeRecord()]).total_assessments).toBe(3); });
  });

  describe("identifyStaffMedicationCompetencyAlerts", () => {
    it("returns empty for clean", () => { expect(identifyStaffMedicationCompetencyAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyStaffMedicationCompetencyAlerts([])).toEqual([]); });
    it("fires suspended_controlled_drugs", () => { 
      const a = identifyStaffMedicationCompetencyAlerts([makeRecord({ assessment_outcome: "suspended", medication_category: "controlled_drugs", staff_name: "Jo" })]);
      expect(a[0].type).toBe("suspended_controlled_drugs");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("no alert if suspended but not controlled", () => { expect(identifyStaffMedicationCompetencyAlerts([makeRecord({ assessment_outcome: "suspended", medication_category: "oral_medication" })]).filter(x => x.type === "suspended_controlled_drugs")).toHaveLength(0); });
    it("fires not_competent for not_yet_competent", () => { 
      const a = identifyStaffMedicationCompetencyAlerts([makeRecord({ assessment_outcome: "not_yet_competent" })]);
      const f = a.find(x => x.type === "not_competent");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 staff member");
    });
    it("fires not_competent for requires_retraining", () => { const a = identifyStaffMedicationCompetencyAlerts([makeRecord({ assessment_outcome: "requires_retraining" })]); expect(a.find(x => x.type === "not_competent")).toBeDefined(); });
    it("not_competent counts both", () => { const a = identifyStaffMedicationCompetencyAlerts([makeRecord({ assessment_outcome: "not_yet_competent" }), makeRecord({ assessment_outcome: "requires_retraining" })]); const f = a.find(x => x.type === "not_competent"); expect(f!.message).toContain("2 staff members"); });
    it("fires practical_not_observed singular", () => { 
      const a = identifyStaffMedicationCompetencyAlerts([makeRecord({ practical_observed: false })]);
      const f = a.find(x => x.type === "practical_not_observed");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 assessment has");
    });
    it("practical_not_observed plural", () => { const a = identifyStaffMedicationCompetencyAlerts([makeRecord({ practical_observed: false }), makeRecord({ practical_observed: false })]); const f = a.find(x => x.type === "practical_not_observed"); expect(f!.message).toContain("2 assessments have"); });
    it("no_refresher_scheduled not for 1", () => { expect(identifyStaffMedicationCompetencyAlerts([makeRecord({ refresher_scheduled: false })]).find(x => x.type === "no_refresher_scheduled")).toBeUndefined(); });
    it("no_refresher_scheduled fires for 2", () => { const a = identifyStaffMedicationCompetencyAlerts([makeRecord({ refresher_scheduled: false }), makeRecord({ refresher_scheduled: false })]); expect(a.find(x => x.type === "no_refresher_scheduled")).toBeDefined(); });
    it("error_procedure_unknown not for 1", () => { expect(identifyStaffMedicationCompetencyAlerts([makeRecord({ error_procedure_known: false })]).find(x => x.type === "error_procedure_unknown")).toBeUndefined(); });
    it("error_procedure_unknown fires for 2", () => { const a = identifyStaffMedicationCompetencyAlerts([makeRecord({ error_procedure_known: false }), makeRecord({ error_procedure_known: false })]); expect(a.find(x => x.type === "error_procedure_unknown")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyStaffMedicationCompetencyAlerts([makeRecord({ assessment_outcome: "suspended", medication_category: "controlled_drugs", practical_observed: false, refresher_scheduled: false, error_procedure_known: false }), makeRecord({ assessment_outcome: "not_yet_competent", refresher_scheduled: false, error_procedure_known: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("suspended_controlled_drugs");
      expect(types).toContain("not_competent");
      expect(types).toContain("practical_not_observed");
      expect(types).toContain("no_refresher_scheduled");
      expect(types).toContain("error_procedure_unknown");
    });
  });
});
