import { describe, it, expect } from "vitest";
import { _testing, type DentalOpticalHealthRecord } from "../dental-optical-health-service";

const { computeDentalOpticalMetrics, identifyDentalOpticalAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<DentalOpticalHealthRecord>): DentalOpticalHealthRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    appointment_type: overrides?.appointment_type ?? "dental_checkup",
    compliance_level: overrides?.compliance_level ?? "fully_compliant",
    treatment_outcome: overrides?.treatment_outcome ?? "no_treatment_needed",
    urgency_assessment: overrides?.urgency_assessment ?? "routine",
    appointment_date: overrides?.appointment_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    accompanied_by: overrides?.accompanied_by ?? "Staff A",
    appointment_attended: overrides?.appointment_attended ?? true,
    consent_obtained: overrides?.consent_obtained ?? true,
    child_prepared: overrides?.child_prepared ?? true,
    anxiety_managed: overrides?.anxiety_managed ?? true,
    treatment_explained: overrides?.treatment_explained ?? true,
    follow_up_booked: overrides?.follow_up_booked ?? true,
    care_plan_reflects: overrides?.care_plan_reflects ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    parent_informed: overrides?.parent_informed ?? true,
    prescription_collected: overrides?.prescription_collected ?? true,
    pain_managed: overrides?.pain_managed ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("dental-optical-health-service", () => {
  describe("computeDentalOpticalMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeDentalOpticalMetrics([]);
      expect(m.total_appointments).toBe(0);;
      expect(m.non_compliant_count).toBe(0);
      expect(m.refused_count).toBe(0);
      expect(m.treatment_refused_count).toBe(0);
      expect(m.emergency_count).toBe(0);
      expect(m.appointment_attended_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeDentalOpticalMetrics([]);
      expect(m.by_appointment_type).toEqual({});
      expect(m.by_compliance_level).toEqual({});
      expect(m.by_treatment_outcome).toEqual({});
      expect(m.by_urgency_assessment).toEqual({});
    });
    it("total_appointments counts records", () => { expect(computeDentalOpticalMetrics([makeRecord(), makeRecord()]).total_appointments).toBe(2); });
    it("counts non_compliant", () => { expect(computeDentalOpticalMetrics([makeRecord({ compliance_level: "non_compliant" })]).non_compliant_count).toBe(1); });
    it("does not count partially as non_compliant", () => { expect(computeDentalOpticalMetrics([makeRecord({ compliance_level: "partially_compliant" })]).non_compliant_count).toBe(0); });
    it("counts refused", () => { expect(computeDentalOpticalMetrics([makeRecord({ compliance_level: "refused" })]).refused_count).toBe(1); });
    it("counts treatment_refused", () => { expect(computeDentalOpticalMetrics([makeRecord({ treatment_outcome: "treatment_refused" })]).treatment_refused_count).toBe(1); });
    it("does not count ongoing as treatment_refused", () => { expect(computeDentalOpticalMetrics([makeRecord({ treatment_outcome: "ongoing_treatment" })]).treatment_refused_count).toBe(0); });
    it("counts emergency", () => { expect(computeDentalOpticalMetrics([makeRecord({ urgency_assessment: "emergency" })]).emergency_count).toBe(1); });
    it("counts urgent as emergency", () => { expect(computeDentalOpticalMetrics([makeRecord({ urgency_assessment: "urgent" })]).emergency_count).toBe(1); });
    it("does not count soon as emergency", () => { expect(computeDentalOpticalMetrics([makeRecord({ urgency_assessment: "soon" })]).emergency_count).toBe(0); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeDentalOpticalMetrics([makeRecord()]);
      expect(m.appointment_attended_rate).toBe(100);
      expect(m.consent_rate).toBe(100);
      expect(m.child_prepared_rate).toBe(100);
      expect(m.anxiety_managed_rate).toBe(100);
      expect(m.treatment_explained_rate).toBe(100);
      expect(m.follow_up_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.prescription_rate).toBe(100);
      expect(m.pain_managed_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("appointment_attended_rate 0 when false", () => { expect(computeDentalOpticalMetrics([makeRecord({ appointment_attended: false })]).appointment_attended_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeDentalOpticalMetrics([makeRecord({ anxiety_managed: true }), makeRecord({ anxiety_managed: false }), makeRecord({ anxiety_managed: true })]); expect(m.anxiety_managed_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeDentalOpticalMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 appointment types", () => { const types = ["dental_checkup","dental_treatment","dental_emergency","orthodontic","optical_exam","optical_prescription","optical_emergency","routine_screening","specialist_referral","other"] as const; const records = types.map(t => makeRecord({ appointment_type: t })); const m = computeDentalOpticalMetrics(records); for (const t of types) expect(m.by_appointment_type[t]).toBe(1); });
    it("counts all 5 compliance levels", () => { const levels = ["fully_compliant","mostly_compliant","partially_compliant","non_compliant","refused"] as const; const records = levels.map(l => makeRecord({ compliance_level: l })); const m = computeDentalOpticalMetrics(records); for (const l of levels) expect(m.by_compliance_level[l]).toBe(1); });
    it("counts all 5 treatment outcomes", () => { const outcomes = ["completed_successfully","ongoing_treatment","requires_follow_up","treatment_refused","no_treatment_needed"] as const; const records = outcomes.map(o => makeRecord({ treatment_outcome: o })); const m = computeDentalOpticalMetrics(records); for (const o of outcomes) expect(m.by_treatment_outcome[o]).toBe(1); });
    it("counts all 5 urgency assessments", () => { const assessments = ["routine","soon","urgent","emergency","preventive"] as const; const records = assessments.map(a => makeRecord({ urgency_assessment: a })); const m = computeDentalOpticalMetrics(records); for (const a of assessments) expect(m.by_urgency_assessment[a]).toBe(1); });
  });

  describe("identifyDentalOpticalAlerts", () => {
    it("returns empty for clean", () => { expect(identifyDentalOpticalAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyDentalOpticalAlerts([])).toEqual([]); });
    it("fires refused_urgent", () => { 
      const a = identifyDentalOpticalAlerts([makeRecord({ treatment_outcome: "treatment_refused", urgency_assessment: "emergency", child_name: "Jo" })]);
      expect(a[0].type).toBe("refused_urgent");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("refused with urgent also critical", () => { const a = identifyDentalOpticalAlerts([makeRecord({ treatment_outcome: "treatment_refused", urgency_assessment: "urgent" })]); expect(a[0].type).toBe("refused_urgent"); expect(a[0].severity).toBe("critical"); });
    it("refused_urgent per-record", () => { const a = identifyDentalOpticalAlerts([makeRecord({ id: "a-1", treatment_outcome: "treatment_refused", urgency_assessment: "emergency" }), makeRecord({ id: "a-2", treatment_outcome: "treatment_refused", urgency_assessment: "urgent" })]); expect(a.filter(x => x.type === "refused_urgent")).toHaveLength(2); });
    it("refused without urgent no critical", () => { expect(identifyDentalOpticalAlerts([makeRecord({ treatment_outcome: "treatment_refused", urgency_assessment: "routine" })]).find(x => x.type === "refused_urgent")).toBeUndefined(); });
    it("urgent without refused no critical", () => { expect(identifyDentalOpticalAlerts([makeRecord({ urgency_assessment: "emergency", treatment_outcome: "completed_successfully" })]).find(x => x.type === "refused_urgent")).toBeUndefined(); });
    it("fires not_attended singular", () => { 
      const a = identifyDentalOpticalAlerts([makeRecord({ appointment_attended: false })]);
      const f = a.find(x => x.type === "not_attended");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 appointment has");
    });
    it("not_attended plural", () => { const a = identifyDentalOpticalAlerts([makeRecord({ appointment_attended: false }), makeRecord({ appointment_attended: false })]); const f = a.find(x => x.type === "not_attended"); expect(f!.message).toContain("2 appointments have"); });
    it("fires no_consent singular", () => { 
      const a = identifyDentalOpticalAlerts([makeRecord({ consent_obtained: false })]);
      const f = a.find(x => x.type === "no_consent");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 appointment has");
    });
    it("no_follow_up not for 1", () => { expect(identifyDentalOpticalAlerts([makeRecord({ follow_up_booked: false })]).find(x => x.type === "no_follow_up")).toBeUndefined(); });
    it("no_follow_up fires for 2", () => { const a = identifyDentalOpticalAlerts([makeRecord({ follow_up_booked: false }), makeRecord({ follow_up_booked: false })]); expect(a.find(x => x.type === "no_follow_up")).toBeDefined(); expect(a.find(x => x.type === "no_follow_up")!.severity).toBe("medium"); });
    it("anxiety_not_managed not for 1", () => { expect(identifyDentalOpticalAlerts([makeRecord({ anxiety_managed: false })]).find(x => x.type === "anxiety_not_managed")).toBeUndefined(); });
    it("anxiety_not_managed fires for 2", () => { const a = identifyDentalOpticalAlerts([makeRecord({ anxiety_managed: false }), makeRecord({ anxiety_managed: false })]); expect(a.find(x => x.type === "anxiety_not_managed")).toBeDefined(); expect(a.find(x => x.type === "anxiety_not_managed")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyDentalOpticalAlerts([makeRecord({ treatment_outcome: "treatment_refused", urgency_assessment: "emergency", appointment_attended: false, consent_obtained: false, follow_up_booked: false, anxiety_managed: false }), makeRecord({ appointment_attended: false, consent_obtained: false, follow_up_booked: false, anxiety_managed: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("refused_urgent");
      expect(types).toContain("not_attended");
      expect(types).toContain("no_consent");
      expect(types).toContain("no_follow_up");
      expect(types).toContain("anxiety_not_managed");
    });
  });
});
