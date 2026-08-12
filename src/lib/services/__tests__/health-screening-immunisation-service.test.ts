import { describe, it, expect } from "vitest";
import { _testing, type HealthScreeningImmunisationRecord } from "../health-screening-immunisation-service";
import { todayStr } from "@/lib/utils";

const { computeHealthScreeningMetrics, identifyHealthScreeningAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<HealthScreeningImmunisationRecord>): HealthScreeningImmunisationRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    screening_type: overrides?.screening_type ?? "other",
    screening_outcome: overrides?.screening_outcome ?? "all_clear",
    immunisation_status: overrides?.immunisation_status ?? "fully_up_to_date",
    health_risk: overrides?.health_risk ?? "low",
    screening_date: overrides?.screening_date ?? todayStr(),
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    conducted_by: overrides?.conducted_by ?? "Staff A",
    child_consented: overrides?.child_consented ?? true,
    age_appropriate_explanation: overrides?.age_appropriate_explanation ?? true,
    parent_informed: overrides?.parent_informed ?? true,
    gp_notified: overrides?.gp_notified ?? true,
    follow_up_arranged: overrides?.follow_up_arranged ?? true,
    referral_made: overrides?.referral_made ?? true,
    care_plan_reflects: overrides?.care_plan_reflects ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    school_aware: overrides?.school_aware ?? true,
    records_updated: overrides?.records_updated ?? true,
    confidentiality_maintained: overrides?.confidentiality_maintained ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("health-screening-immunisation-service", () => {
  describe("computeHealthScreeningMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeHealthScreeningMetrics([]);
      expect(m.total_screenings).toBe(0);;
      expect(m.treatment_required_count).toBe(0);
      expect(m.referral_needed_count).toBe(0);
      expect(m.behind_immunisation_count).toBe(0);
      expect(m.high_risk_count).toBe(0);
      expect(m.child_consented_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeHealthScreeningMetrics([]);
      expect(m.by_screening_type).toEqual({});
      expect(m.by_screening_outcome).toEqual({});
      expect(m.by_immunisation_status).toEqual({});
      expect(m.by_health_risk).toEqual({});
    });
    it("total_screenings counts records", () => { expect(computeHealthScreeningMetrics([makeRecord(), makeRecord()]).total_screenings).toBe(2); });
    it("counts treatment_required", () => { expect(computeHealthScreeningMetrics([makeRecord({ screening_outcome: "treatment_required" })]).treatment_required_count).toBe(1); });
    it("counts referral_needed", () => { expect(computeHealthScreeningMetrics([makeRecord({ screening_outcome: "referral_needed" })]).referral_needed_count).toBe(1); });
    it("does not count minor_issues as treatment", () => { expect(computeHealthScreeningMetrics([makeRecord({ screening_outcome: "minor_issues" })]).treatment_required_count).toBe(0); });
    it("counts behind_immunisation", () => { expect(computeHealthScreeningMetrics([makeRecord({ immunisation_status: "significantly_behind" })]).behind_immunisation_count).toBe(1); });
    it("counts high_risk for high", () => { expect(computeHealthScreeningMetrics([makeRecord({ health_risk: "high" })]).high_risk_count).toBe(1); });
    it("counts high_risk for critical", () => { expect(computeHealthScreeningMetrics([makeRecord({ health_risk: "critical" })]).high_risk_count).toBe(1); });
    it("does not count moderate as high_risk", () => { expect(computeHealthScreeningMetrics([makeRecord({ health_risk: "moderate" })]).high_risk_count).toBe(0); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeHealthScreeningMetrics([makeRecord()]);
      expect(m.child_consented_rate).toBe(100);
      expect(m.age_appropriate_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.gp_notified_rate).toBe(100);
      expect(m.follow_up_rate).toBe(100);
      expect(m.referral_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.school_aware_rate).toBe(100);
      expect(m.records_updated_rate).toBe(100);
      expect(m.confidentiality_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_consented_rate 0 when false", () => { expect(computeHealthScreeningMetrics([makeRecord({ child_consented: false })]).child_consented_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeHealthScreeningMetrics([makeRecord({ gp_notified: true }), makeRecord({ gp_notified: false }), makeRecord({ gp_notified: true })]); expect(m.gp_notified_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeHealthScreeningMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 screening types", () => { const types = ["immunisation","dental_check","optical_check","hearing_test","developmental_assessment","mental_health_screening","bmi_growth_check","sexual_health","substance_screening","other"] as const; const records = types.map(t => makeRecord({ screening_type: t })); const m = computeHealthScreeningMetrics(records); for (const t of types) expect(m.by_screening_type[t]).toBe(1); });
    it("counts all 5 screening outcomes", () => { const outcomes = ["all_clear","minor_issues","referral_needed","treatment_required","further_assessment"] as const; const records = outcomes.map(o => makeRecord({ screening_outcome: o })); const m = computeHealthScreeningMetrics(records); for (const o of outcomes) expect(m.by_screening_outcome[o]).toBe(1); });
    it("counts all 5 immunisation statuses", () => { const statuses = ["fully_up_to_date","mostly_up_to_date","partially_complete","significantly_behind","not_assessed"] as const; const records = statuses.map(s => makeRecord({ immunisation_status: s })); const m = computeHealthScreeningMetrics(records); for (const s of statuses) expect(m.by_immunisation_status[s]).toBe(1); });
    it("counts all 5 health risks", () => { const risks = ["low","moderate","elevated","high","critical"] as const; const records = risks.map(r => makeRecord({ health_risk: r })); const m = computeHealthScreeningMetrics(records); for (const r of risks) expect(m.by_health_risk[r]).toBe(1); });
  });

  describe("identifyHealthScreeningAlerts", () => {
    it("returns empty for clean", () => { expect(identifyHealthScreeningAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyHealthScreeningAlerts([])).toEqual([]); });
    it("fires high_risk_no_followup", () => { 
      const a = identifyHealthScreeningAlerts([makeRecord({ health_risk: "high", follow_up_arranged: false, child_name: "Jo" })]);
      expect(a[0].type).toBe("high_risk_no_followup");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("high_risk_no_followup for critical too", () => { const a = identifyHealthScreeningAlerts([makeRecord({ health_risk: "critical", follow_up_arranged: false })]); expect(a.filter(x => x.type === "high_risk_no_followup")).toHaveLength(1); });
    it("high_risk_no_followup per-record", () => { const a = identifyHealthScreeningAlerts([makeRecord({ id: "a-1", health_risk: "high", follow_up_arranged: false }), makeRecord({ id: "a-2", health_risk: "critical", follow_up_arranged: false })]); expect(a.filter(x => x.type === "high_risk_no_followup")).toHaveLength(2); });
    it("high risk with follow-up no critical", () => { expect(identifyHealthScreeningAlerts([makeRecord({ health_risk: "high", follow_up_arranged: true })]).find(x => x.type === "high_risk_no_followup")).toBeUndefined(); });
    it("low risk no follow-up no critical", () => { expect(identifyHealthScreeningAlerts([makeRecord({ health_risk: "low", follow_up_arranged: false })]).find(x => x.type === "high_risk_no_followup")).toBeUndefined(); });
    it("fires immunisation_behind singular", () => { 
      const a = identifyHealthScreeningAlerts([makeRecord({ immunisation_status: "significantly_behind" })]);
      const f = a.find(x => x.type === "immunisation_behind");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 screening has");
    });
    it("immunisation_behind plural", () => { const a = identifyHealthScreeningAlerts([makeRecord({ immunisation_status: "significantly_behind" }), makeRecord({ immunisation_status: "significantly_behind" })]); const f = a.find(x => x.type === "immunisation_behind"); expect(f!.message).toContain("2 screenings have"); });
    it("fires gp_not_notified singular", () => { 
      const a = identifyHealthScreeningAlerts([makeRecord({ gp_notified: false })]);
      const f = a.find(x => x.type === "gp_not_notified");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 screening has");
    });
    it("confidentiality_breach not for 1", () => { expect(identifyHealthScreeningAlerts([makeRecord({ confidentiality_maintained: false })]).find(x => x.type === "confidentiality_breach")).toBeUndefined(); });
    it("confidentiality_breach fires for 2", () => { const a = identifyHealthScreeningAlerts([makeRecord({ confidentiality_maintained: false }), makeRecord({ confidentiality_maintained: false })]); expect(a.find(x => x.type === "confidentiality_breach")).toBeDefined(); expect(a.find(x => x.type === "confidentiality_breach")!.severity).toBe("medium"); });
    it("records_not_updated not for 1", () => { expect(identifyHealthScreeningAlerts([makeRecord({ records_updated: false })]).find(x => x.type === "records_not_updated")).toBeUndefined(); });
    it("records_not_updated fires for 2", () => { const a = identifyHealthScreeningAlerts([makeRecord({ records_updated: false }), makeRecord({ records_updated: false })]); expect(a.find(x => x.type === "records_not_updated")).toBeDefined(); expect(a.find(x => x.type === "records_not_updated")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyHealthScreeningAlerts([makeRecord({ health_risk: "high", follow_up_arranged: false, immunisation_status: "significantly_behind", gp_notified: false, confidentiality_maintained: false, records_updated: false }), makeRecord({ immunisation_status: "significantly_behind", gp_notified: false, confidentiality_maintained: false, records_updated: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("high_risk_no_followup");
      expect(types).toContain("immunisation_behind");
      expect(types).toContain("gp_not_notified");
      expect(types).toContain("confidentiality_breach");
      expect(types).toContain("records_not_updated");
    });
  });
});
