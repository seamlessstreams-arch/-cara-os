import { describe, it, expect } from "vitest";
import { _testing, type MedicationSideEffectsRecord } from "../medication-side-effects-service";
import { todayStr } from "@/lib/utils";

const { computeMedicationSideEffectsMetrics, identifyMedicationSideEffectsAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<MedicationSideEffectsRecord>): MedicationSideEffectsRecord {
  return {
    id: "a-1", home_id: "home-1",
    side_effect_type: "drowsiness",
    severity: "mild",
    gp_response: "no_change_needed",
    medication_category: "antidepressant",
    reported_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    reported_by: "Staff A",
    child_informed: true,
    parent_informed: true,
    social_worker_informed: true,
    gp_contacted_promptly: true,
    pharmacy_consulted: true,
    medication_review_requested: true,
    daily_functioning_assessed: true,
    wellbeing_monitored: true,
    care_plan_updated: true,
    yellow_card_considered: true,
    staff_aware: true,
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

describe("medication-side-effects-service", () => {
  describe("computeMedicationSideEffectsMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeMedicationSideEffectsMetrics([]);
      expect(m.total_reports).toBe(0);;
      expect(m.severe_count).toBe(0);
      expect(m.life_threatening_count).toBe(0);
      expect(m.gp_not_contacted_count).toBe(0);
      expect(m.awaiting_review_count).toBe(0);
      expect(m.child_informed_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeMedicationSideEffectsMetrics([]);
      expect(m.by_side_effect_type).toEqual({});
      expect(m.by_severity).toEqual({});
      expect(m.by_gp_response).toEqual({});
      expect(m.by_medication_category).toEqual({});
    });
    it("total_reports counts records", () => { expect(computeMedicationSideEffectsMetrics([makeRecord(), makeRecord()]).total_reports).toBe(2); });
    it("counts severe", () => { expect(computeMedicationSideEffectsMetrics([makeRecord({ severity: "severe" })]).severe_count).toBe(1); });
    it("counts life_threatening", () => { expect(computeMedicationSideEffectsMetrics([makeRecord({ severity: "life_threatening" })]).life_threatening_count).toBe(1); });
    it("does not count moderate as severe", () => { expect(computeMedicationSideEffectsMetrics([makeRecord({ severity: "moderate" })]).severe_count).toBe(0); });
    it("counts gp_not_contacted", () => { expect(computeMedicationSideEffectsMetrics([makeRecord({ gp_response: "gp_not_contacted" })]).gp_not_contacted_count).toBe(1); });
    it("counts awaiting_review", () => { expect(computeMedicationSideEffectsMetrics([makeRecord({ gp_response: "awaiting_review" })]).awaiting_review_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeMedicationSideEffectsMetrics([makeRecord()]);
      expect(m.child_informed_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.social_worker_informed_rate).toBe(100);
      expect(m.gp_contacted_promptly_rate).toBe(100);
      expect(m.pharmacy_consulted_rate).toBe(100);
      expect(m.medication_review_rate).toBe(100);
      expect(m.daily_functioning_rate).toBe(100);
      expect(m.wellbeing_monitored_rate).toBe(100);
      expect(m.care_plan_updated_rate).toBe(100);
      expect(m.yellow_card_rate).toBe(100);
      expect(m.staff_aware_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_informed_rate 0 when false", () => { expect(computeMedicationSideEffectsMetrics([makeRecord({ child_informed: false })]).child_informed_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeMedicationSideEffectsMetrics([makeRecord({ gp_contacted_promptly: true }), makeRecord({ gp_contacted_promptly: false }), makeRecord({ gp_contacted_promptly: true })]); expect(m.gp_contacted_promptly_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeMedicationSideEffectsMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 side effect types", () => { const types = ["drowsiness","appetite_change","nausea","headache","mood_change","sleep_disruption","weight_change","skin_reaction","behavioural_change","other"] as const; const records = types.map(t => makeRecord({ side_effect_type: t })); const m = computeMedicationSideEffectsMetrics(records); for (const t of types) expect(m.by_side_effect_type[t]).toBe(1); });
    it("counts all 5 severities", () => { const sevs = ["mild","moderate","severe","life_threatening","not_assessed"] as const; const records = sevs.map(s => makeRecord({ severity: s })); const m = computeMedicationSideEffectsMetrics(records); for (const s of sevs) expect(m.by_severity[s]).toBe(1); });
    it("counts all 10 gp responses", () => { const responses = ["dose_adjusted","medication_changed","monitoring_increased","no_change_needed","referred_to_specialist","medication_stopped","awaiting_review","gp_not_contacted","advice_given","other"] as const; const records = responses.map(r => makeRecord({ gp_response: r })); const m = computeMedicationSideEffectsMetrics(records); for (const r of responses) expect(m.by_gp_response[r]).toBe(1); });
    it("counts all 10 medication categories", () => { const cats = ["antidepressant","antipsychotic","anxiolytic","stimulant","anticonvulsant","analgesic","antibiotic","antihistamine","hormone","other"] as const; const records = cats.map(c => makeRecord({ medication_category: c })); const m = computeMedicationSideEffectsMetrics(records); for (const c of cats) expect(m.by_medication_category[c]).toBe(1); });
  });

  describe("identifyMedicationSideEffectsAlerts", () => {
    it("returns empty for clean", () => { expect(identifyMedicationSideEffectsAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyMedicationSideEffectsAlerts([])).toEqual([]); });
    it("fires severe_no_gp_contact for severe", () => { 
      const a = identifyMedicationSideEffectsAlerts([makeRecord({ severity: "severe", gp_contacted_promptly: false, child_name: "Jo" })]);
      expect(a[0].type).toBe("severe_no_gp_contact");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
      expect(a[0].message).toContain("severe");
    });
    it("fires severe_no_gp_contact for life_threatening", () => { const a = identifyMedicationSideEffectsAlerts([makeRecord({ severity: "life_threatening", gp_contacted_promptly: false })]); expect(a[0].type).toBe("severe_no_gp_contact"); expect(a[0].message).toContain("life threatening"); });
    it("severe_no_gp_contact per-record", () => { const a = identifyMedicationSideEffectsAlerts([makeRecord({ id: "a-1", severity: "severe", gp_contacted_promptly: false }), makeRecord({ id: "a-2", severity: "severe", gp_contacted_promptly: false })]); expect(a.filter(x => x.type === "severe_no_gp_contact")).toHaveLength(2); });
    it("severe with gp contact no critical alert", () => { expect(identifyMedicationSideEffectsAlerts([makeRecord({ severity: "severe", gp_contacted_promptly: true })]).find(x => x.type === "severe_no_gp_contact")).toBeUndefined(); });
    it("moderate without gp contact no critical alert", () => { expect(identifyMedicationSideEffectsAlerts([makeRecord({ severity: "moderate", gp_contacted_promptly: false })]).find(x => x.type === "severe_no_gp_contact")).toBeUndefined(); });
    it("fires gp_not_contacted singular", () => { 
      const a = identifyMedicationSideEffectsAlerts([makeRecord({ gp_response: "gp_not_contacted" })]);
      const f = a.find(x => x.type === "gp_not_contacted");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 side effect report has");
    });
    it("gp_not_contacted plural", () => { const a = identifyMedicationSideEffectsAlerts([makeRecord({ gp_response: "gp_not_contacted" }), makeRecord({ gp_response: "gp_not_contacted" })]); const f = a.find(x => x.type === "gp_not_contacted"); expect(f!.message).toContain("2 side effect reports have"); });
    it("fires no_medication_review singular", () => { 
      const a = identifyMedicationSideEffectsAlerts([makeRecord({ medication_review_requested: false })]);
      const f = a.find(x => x.type === "no_medication_review");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 report has");
    });
    it("no_medication_review plural", () => { const a = identifyMedicationSideEffectsAlerts([makeRecord({ medication_review_requested: false }), makeRecord({ medication_review_requested: false })]); const f = a.find(x => x.type === "no_medication_review"); expect(f!.message).toContain("2 reports have"); });
    it("wellbeing_not_monitored not for 1", () => { expect(identifyMedicationSideEffectsAlerts([makeRecord({ wellbeing_monitored: false })]).find(x => x.type === "wellbeing_not_monitored")).toBeUndefined(); });
    it("wellbeing_not_monitored fires for 2", () => { const a = identifyMedicationSideEffectsAlerts([makeRecord({ wellbeing_monitored: false }), makeRecord({ wellbeing_monitored: false })]); expect(a.find(x => x.type === "wellbeing_not_monitored")).toBeDefined(); expect(a.find(x => x.type === "wellbeing_not_monitored")!.severity).toBe("medium"); });
    it("functioning_not_assessed not for 1", () => { expect(identifyMedicationSideEffectsAlerts([makeRecord({ daily_functioning_assessed: false })]).find(x => x.type === "functioning_not_assessed")).toBeUndefined(); });
    it("functioning_not_assessed fires for 2", () => { const a = identifyMedicationSideEffectsAlerts([makeRecord({ daily_functioning_assessed: false }), makeRecord({ daily_functioning_assessed: false })]); expect(a.find(x => x.type === "functioning_not_assessed")).toBeDefined(); expect(a.find(x => x.type === "functioning_not_assessed")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyMedicationSideEffectsAlerts([makeRecord({ severity: "severe", gp_contacted_promptly: false, gp_response: "gp_not_contacted", medication_review_requested: false, wellbeing_monitored: false, daily_functioning_assessed: false }), makeRecord({ gp_response: "gp_not_contacted", medication_review_requested: false, wellbeing_monitored: false, daily_functioning_assessed: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("severe_no_gp_contact");
      expect(types).toContain("gp_not_contacted");
      expect(types).toContain("no_medication_review");
      expect(types).toContain("wellbeing_not_monitored");
      expect(types).toContain("functioning_not_assessed");
    });
  });
});
