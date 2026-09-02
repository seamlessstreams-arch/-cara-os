import { describe, it, expect } from "vitest";
import { _testing, type MedicationEffectivenessReviewRecord } from "../medication-effectiveness-review-service";
import { todayStr } from "@/lib/utils";

const { computeMedicationEffectivenessMetrics, identifyMedicationEffectivenessAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<MedicationEffectivenessReviewRecord>): MedicationEffectivenessReviewRecord {
  return {
    id: "a-1", home_id: "home-1",
    medication_category: "other",
    effectiveness_rating: "effective",
    adherence_level: "full_adherence",
    review_compliance: "fully_compliant",
    review_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    reviewed_by: "Staff A",
    child_views_sought: true,
    side_effects_monitored: true,
    prescriber_consulted: true,
    gp_informed: true,
    dosage_appropriate: true,
    consent_current: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    school_aware: true,
    storage_compliant: true,
    administration_correct: true,
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

describe("medication-effectiveness-review-service", () => {
  describe("computeMedicationEffectivenessMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeMedicationEffectivenessMetrics([]);
      expect(m.total_reviews).toBe(0);;
      expect(m.ineffective_count).toBe(0);
      expect(m.adverse_effects_count).toBe(0);
      expect(m.non_adherent_count).toBe(0);
      expect(m.overdue_review_count).toBe(0);
      expect(m.child_views_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeMedicationEffectivenessMetrics([]);
      expect(m.by_medication_category).toEqual({});
      expect(m.by_effectiveness_rating).toEqual({});
      expect(m.by_adherence_level).toEqual({});
      expect(m.by_review_compliance).toEqual({});
    });
    it("total_reviews counts records", () => { expect(computeMedicationEffectivenessMetrics([makeRecord(), makeRecord()]).total_reviews).toBe(2); });
    it("counts ineffective", () => { expect(computeMedicationEffectivenessMetrics([makeRecord({ effectiveness_rating: "ineffective" })]).ineffective_count).toBe(1); });
    it("counts adverse_effects", () => { expect(computeMedicationEffectivenessMetrics([makeRecord({ effectiveness_rating: "adverse_effects" })]).adverse_effects_count).toBe(1); });
    it("does not count partially_effective as ineffective", () => { expect(computeMedicationEffectivenessMetrics([makeRecord({ effectiveness_rating: "partially_effective" })]).ineffective_count).toBe(0); });
    it("counts non_adherent", () => { expect(computeMedicationEffectivenessMetrics([makeRecord({ adherence_level: "non_adherent" })]).non_adherent_count).toBe(1); });
    it("counts overdue_review", () => { expect(computeMedicationEffectivenessMetrics([makeRecord({ review_compliance: "significantly_overdue" })]).overdue_review_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeMedicationEffectivenessMetrics([makeRecord()]);
      expect(m.child_views_rate).toBe(100);
      expect(m.side_effects_rate).toBe(100);
      expect(m.prescriber_rate).toBe(100);
      expect(m.gp_informed_rate).toBe(100);
      expect(m.dosage_rate).toBe(100);
      expect(m.consent_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.school_aware_rate).toBe(100);
      expect(m.storage_rate).toBe(100);
      expect(m.administration_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("side_effects_rate 0 when false", () => { expect(computeMedicationEffectivenessMetrics([makeRecord({ side_effects_monitored: false })]).side_effects_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeMedicationEffectivenessMetrics([makeRecord({ prescriber_consulted: true }), makeRecord({ prescriber_consulted: false }), makeRecord({ prescriber_consulted: true })]); expect(m.prescriber_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeMedicationEffectivenessMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 medication categories", () => { const categories = ["antidepressant","antipsychotic","anxiolytic","stimulant","anticonvulsant","pain_management","inhaler_respiratory","hormone_treatment","antibiotic","other"] as const; const records = categories.map(c => makeRecord({ medication_category: c })); const m = computeMedicationEffectivenessMetrics(records); for (const c of categories) expect(m.by_medication_category[c]).toBe(1); });
    it("counts all 5 effectiveness ratings", () => { const ratings = ["highly_effective","effective","partially_effective","ineffective","adverse_effects"] as const; const records = ratings.map(r => makeRecord({ effectiveness_rating: r })); const m = computeMedicationEffectivenessMetrics(records); for (const r of ratings) expect(m.by_effectiveness_rating[r]).toBe(1); });
    it("counts all 5 adherence levels", () => { const levels = ["full_adherence","mostly_adherent","variable_adherence","poor_adherence","non_adherent"] as const; const records = levels.map(l => makeRecord({ adherence_level: l })); const m = computeMedicationEffectivenessMetrics(records); for (const l of levels) expect(m.by_adherence_level[l]).toBe(1); });
    it("counts all 5 review compliances", () => { const compliances = ["fully_compliant","minor_delay","significantly_overdue","no_review","not_applicable"] as const; const records = compliances.map(c => makeRecord({ review_compliance: c })); const m = computeMedicationEffectivenessMetrics(records); for (const c of compliances) expect(m.by_review_compliance[c]).toBe(1); });
  });

  describe("identifyMedicationEffectivenessAlerts", () => {
    it("returns empty for clean", () => { expect(identifyMedicationEffectivenessAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyMedicationEffectivenessAlerts([])).toEqual([]); });
    it("fires adverse_no_prescriber", () => { 
      const a = identifyMedicationEffectivenessAlerts([makeRecord({ effectiveness_rating: "adverse_effects", prescriber_consulted: false, child_name: "Jo" })]);
      expect(a[0].type).toBe("adverse_no_prescriber");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("adverse_no_prescriber per-record", () => { const a = identifyMedicationEffectivenessAlerts([makeRecord({ id: "a-1", effectiveness_rating: "adverse_effects", prescriber_consulted: false }), makeRecord({ id: "a-2", effectiveness_rating: "adverse_effects", prescriber_consulted: false })]); expect(a.filter(x => x.type === "adverse_no_prescriber")).toHaveLength(2); });
    it("adverse with prescriber no critical", () => { expect(identifyMedicationEffectivenessAlerts([makeRecord({ effectiveness_rating: "adverse_effects", prescriber_consulted: true })]).find(x => x.type === "adverse_no_prescriber")).toBeUndefined(); });
    it("effective no prescriber no critical", () => { expect(identifyMedicationEffectivenessAlerts([makeRecord({ effectiveness_rating: "effective", prescriber_consulted: false })]).find(x => x.type === "adverse_no_prescriber")).toBeUndefined(); });
    it("fires side_effects_not_monitored singular", () => { 
      const a = identifyMedicationEffectivenessAlerts([makeRecord({ side_effects_monitored: false })]);
      const f = a.find(x => x.type === "side_effects_not_monitored");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 review has");
    });
    it("side_effects_not_monitored plural", () => { const a = identifyMedicationEffectivenessAlerts([makeRecord({ side_effects_monitored: false }), makeRecord({ side_effects_monitored: false })]); const f = a.find(x => x.type === "side_effects_not_monitored"); expect(f!.message).toContain("2 reviews have"); });
    it("fires consent_not_current singular", () => { 
      const a = identifyMedicationEffectivenessAlerts([makeRecord({ consent_current: false })]);
      const f = a.find(x => x.type === "consent_not_current");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 review has");
    });
    it("storage_not_compliant not for 1", () => { expect(identifyMedicationEffectivenessAlerts([makeRecord({ storage_compliant: false })]).find(x => x.type === "storage_not_compliant")).toBeUndefined(); });
    it("storage_not_compliant fires for 2", () => { const a = identifyMedicationEffectivenessAlerts([makeRecord({ storage_compliant: false }), makeRecord({ storage_compliant: false })]); expect(a.find(x => x.type === "storage_not_compliant")).toBeDefined(); expect(a.find(x => x.type === "storage_not_compliant")!.severity).toBe("medium"); });
    it("administration_issues not for 1", () => { expect(identifyMedicationEffectivenessAlerts([makeRecord({ administration_correct: false })]).find(x => x.type === "administration_issues")).toBeUndefined(); });
    it("administration_issues fires for 2", () => { const a = identifyMedicationEffectivenessAlerts([makeRecord({ administration_correct: false }), makeRecord({ administration_correct: false })]); expect(a.find(x => x.type === "administration_issues")).toBeDefined(); expect(a.find(x => x.type === "administration_issues")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyMedicationEffectivenessAlerts([makeRecord({ effectiveness_rating: "adverse_effects", prescriber_consulted: false, side_effects_monitored: false, consent_current: false, storage_compliant: false, administration_correct: false }), makeRecord({ side_effects_monitored: false, consent_current: false, storage_compliant: false, administration_correct: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("adverse_no_prescriber");
      expect(types).toContain("side_effects_not_monitored");
      expect(types).toContain("consent_not_current");
      expect(types).toContain("storage_not_compliant");
      expect(types).toContain("administration_issues");
    });
  });
});
