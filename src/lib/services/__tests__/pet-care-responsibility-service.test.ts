import { describe, it, expect } from "vitest";
import { _testing, type PetCareResponsibilityRecord } from "../pet-care-responsibility-service";

const { computePetCareMetrics, identifyPetCareAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<PetCareResponsibilityRecord>): PetCareResponsibilityRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    pet_type: overrides?.pet_type ?? "dog",
    care_quality: overrides?.care_quality ?? "good",
    responsibility_level: overrides?.responsibility_level ?? "shared_responsibility",
    therapeutic_impact: overrides?.therapeutic_impact ?? "positive",
    session_date: overrides?.session_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    supported_by: overrides?.supported_by ?? "Staff A",
    animal_welfare_met: overrides?.animal_welfare_met ?? true,
    veterinary_care_current: overrides?.veterinary_care_current ?? true,
    child_chose_interaction: overrides?.child_chose_interaction ?? true,
    supervision_adequate: overrides?.supervision_adequate ?? true,
    hygiene_maintained: overrides?.hygiene_maintained ?? true,
    allergy_checked: overrides?.allergy_checked ?? true,
    care_plan_reflects: overrides?.care_plan_reflects ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    parent_informed: overrides?.parent_informed ?? true,
    risk_assessment_done: overrides?.risk_assessment_done ?? true,
    empathy_development_noted: overrides?.empathy_development_noted ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("pet-care-responsibility-service", () => {
  describe("computePetCareMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computePetCareMetrics([]);
      expect(m.total_sessions).toBe(0);;
      expect(m.neglectful_count).toBe(0);
      expect(m.not_involved_count).toBe(0);
      expect(m.negative_impact_count).toBe(0);
      expect(m.poor_care_count).toBe(0);
      expect(m.animal_welfare_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computePetCareMetrics([]);
      expect(m.by_pet_type).toEqual({});
      expect(m.by_care_quality).toEqual({});
      expect(m.by_responsibility_level).toEqual({});
      expect(m.by_therapeutic_impact).toEqual({});
    });
    it("total_sessions counts records", () => { expect(computePetCareMetrics([makeRecord(), makeRecord()]).total_sessions).toBe(2); });
    it("counts neglectful", () => { expect(computePetCareMetrics([makeRecord({ care_quality: "neglectful" })]).neglectful_count).toBe(1); });
    it("does not count poor as neglectful", () => { expect(computePetCareMetrics([makeRecord({ care_quality: "poor" })]).neglectful_count).toBe(0); });
    it("counts not_involved", () => { expect(computePetCareMetrics([makeRecord({ responsibility_level: "not_involved" })]).not_involved_count).toBe(1); });
    it("does not count minimal as not_involved", () => { expect(computePetCareMetrics([makeRecord({ responsibility_level: "minimal_responsibility" })]).not_involved_count).toBe(0); });
    it("counts negative_impact", () => { expect(computePetCareMetrics([makeRecord({ therapeutic_impact: "negative" })]).negative_impact_count).toBe(1); });
    it("does not count minimal as negative_impact", () => { expect(computePetCareMetrics([makeRecord({ therapeutic_impact: "minimal" })]).negative_impact_count).toBe(0); });
    it("counts poor as poor_care", () => { expect(computePetCareMetrics([makeRecord({ care_quality: "poor" })]).poor_care_count).toBe(1); });
    it("counts neglectful as poor_care", () => { expect(computePetCareMetrics([makeRecord({ care_quality: "neglectful" })]).poor_care_count).toBe(1); });
    it("does not count adequate as poor_care", () => { expect(computePetCareMetrics([makeRecord({ care_quality: "adequate" })]).poor_care_count).toBe(0); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computePetCareMetrics([makeRecord()]);
      expect(m.animal_welfare_rate).toBe(100);
      expect(m.veterinary_care_rate).toBe(100);
      expect(m.child_chose_rate).toBe(100);
      expect(m.supervision_rate).toBe(100);
      expect(m.hygiene_rate).toBe(100);
      expect(m.allergy_checked_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.risk_assessment_rate).toBe(100);
      expect(m.empathy_development_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("animal_welfare_rate 0 when false", () => { expect(computePetCareMetrics([makeRecord({ animal_welfare_met: false })]).animal_welfare_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computePetCareMetrics([makeRecord({ hygiene_maintained: true }), makeRecord({ hygiene_maintained: false }), makeRecord({ hygiene_maintained: true })]); expect(m.hygiene_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computePetCareMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 pet types", () => { const types = ["dog","cat","rabbit","fish","hamster","guinea_pig","bird","reptile","farm_animal","other"] as const; const records = types.map(t => makeRecord({ pet_type: t })); const m = computePetCareMetrics(records); for (const t of types) expect(m.by_pet_type[t]).toBe(1); });
    it("counts all 5 care qualities", () => { const qualities = ["excellent","good","adequate","poor","neglectful"] as const; const records = qualities.map(q => makeRecord({ care_quality: q })); const m = computePetCareMetrics(records); for (const q of qualities) expect(m.by_care_quality[q]).toBe(1); });
    it("counts all 5 responsibility levels", () => { const levels = ["fully_responsible","mostly_responsible","shared_responsibility","minimal_responsibility","not_involved"] as const; const records = levels.map(l => makeRecord({ responsibility_level: l })); const m = computePetCareMetrics(records); for (const l of levels) expect(m.by_responsibility_level[l]).toBe(1); });
    it("counts all 5 therapeutic impacts", () => { const impacts = ["very_positive","positive","neutral","minimal","negative"] as const; const records = impacts.map(i => makeRecord({ therapeutic_impact: i })); const m = computePetCareMetrics(records); for (const i of impacts) expect(m.by_therapeutic_impact[i]).toBe(1); });
  });

  describe("identifyPetCareAlerts", () => {
    it("returns empty for clean", () => { expect(identifyPetCareAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyPetCareAlerts([])).toEqual([]); });
    it("fires neglectful_negative", () => { 
      const a = identifyPetCareAlerts([makeRecord({ care_quality: "neglectful", therapeutic_impact: "negative", child_name: "Jo" })]);
      expect(a[0].type).toBe("neglectful_negative");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("neglectful_negative per-record", () => { const a = identifyPetCareAlerts([makeRecord({ id: "a-1", care_quality: "neglectful", therapeutic_impact: "negative" }), makeRecord({ id: "a-2", care_quality: "neglectful", therapeutic_impact: "negative" })]); expect(a.filter(x => x.type === "neglectful_negative")).toHaveLength(2); });
    it("neglectful without negative no critical", () => { expect(identifyPetCareAlerts([makeRecord({ care_quality: "neglectful", therapeutic_impact: "positive" })]).find(x => x.type === "neglectful_negative")).toBeUndefined(); });
    it("negative without neglectful no critical", () => { expect(identifyPetCareAlerts([makeRecord({ therapeutic_impact: "negative", care_quality: "good" })]).find(x => x.type === "neglectful_negative")).toBeUndefined(); });
    it("fires no_animal_welfare singular", () => { 
      const a = identifyPetCareAlerts([makeRecord({ animal_welfare_met: false })]);
      const f = a.find(x => x.type === "no_animal_welfare");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("no_animal_welfare plural", () => { const a = identifyPetCareAlerts([makeRecord({ animal_welfare_met: false }), makeRecord({ animal_welfare_met: false })]); const f = a.find(x => x.type === "no_animal_welfare"); expect(f!.message).toContain("2 sessions have"); });
    it("fires no_risk_assessment singular", () => { 
      const a = identifyPetCareAlerts([makeRecord({ risk_assessment_done: false })]);
      const f = a.find(x => x.type === "no_risk_assessment");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("no_child_choice not for 1", () => { expect(identifyPetCareAlerts([makeRecord({ child_chose_interaction: false })]).find(x => x.type === "no_child_choice")).toBeUndefined(); });
    it("no_child_choice fires for 2", () => { const a = identifyPetCareAlerts([makeRecord({ child_chose_interaction: false }), makeRecord({ child_chose_interaction: false })]); expect(a.find(x => x.type === "no_child_choice")).toBeDefined(); expect(a.find(x => x.type === "no_child_choice")!.severity).toBe("medium"); });
    it("no_hygiene not for 1", () => { expect(identifyPetCareAlerts([makeRecord({ hygiene_maintained: false })]).find(x => x.type === "no_hygiene")).toBeUndefined(); });
    it("no_hygiene fires for 2", () => { const a = identifyPetCareAlerts([makeRecord({ hygiene_maintained: false }), makeRecord({ hygiene_maintained: false })]); expect(a.find(x => x.type === "no_hygiene")).toBeDefined(); expect(a.find(x => x.type === "no_hygiene")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyPetCareAlerts([makeRecord({ care_quality: "neglectful", therapeutic_impact: "negative", animal_welfare_met: false, risk_assessment_done: false, child_chose_interaction: false, hygiene_maintained: false }), makeRecord({ animal_welfare_met: false, risk_assessment_done: false, child_chose_interaction: false, hygiene_maintained: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("neglectful_negative");
      expect(types).toContain("no_animal_welfare");
      expect(types).toContain("no_risk_assessment");
      expect(types).toContain("no_child_choice");
      expect(types).toContain("no_hygiene");
    });
  });
});
