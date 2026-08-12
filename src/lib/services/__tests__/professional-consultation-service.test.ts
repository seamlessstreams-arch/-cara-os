import { describe, it, expect } from "vitest";
import { _testing, type ProfessionalConsultationRecord } from "../professional-consultation-service";
import { todayStr } from "@/lib/utils";

const { computeProfessionalConsultationMetrics, identifyProfessionalConsultationAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<ProfessionalConsultationRecord>): ProfessionalConsultationRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    professional_type: overrides?.professional_type ?? "camhs_therapist",
    consultation_type: overrides?.consultation_type ?? "planned_session",
    consultation_outcome: overrides?.consultation_outcome ?? "recommendations_made",
    consultation_urgency: overrides?.consultation_urgency ?? "routine",
    consultation_date: overrides?.consultation_date ?? todayStr(),
    professional_name: overrides?.professional_name ?? "Dr Smith",
    professional_organisation: overrides?.professional_organisation ?? "NHS Trust",
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : "child-1",
    recommendations_documented: overrides?.recommendations_documented ?? true,
    actions_agreed: overrides?.actions_agreed ?? true,
    actions_completed: overrides?.actions_completed ?? true,
    staff_informed: overrides?.staff_informed ?? true,
    care_plan_updated: overrides?.care_plan_updated ?? true,
    parent_carer_informed: overrides?.parent_carer_informed ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    follow_up_required: overrides?.follow_up_required ?? false,
    follow_up_completed: overrides?.follow_up_completed ?? false,
    child_participated: overrides?.child_participated ?? true,
    child_views_recorded: overrides?.child_views_recorded ?? true,
    consent_obtained: overrides?.consent_obtained ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    consulted_by: overrides?.consulted_by ?? "Staff A",
    next_consultation_date: "next_consultation_date" in (overrides ?? {}) ? (overrides!.next_consultation_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("professional-consultation-service", () => {
  describe("computeProfessionalConsultationMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeProfessionalConsultationMetrics([]);
      expect(m.total_consultations).toBe(0);
      expect(m.recommendations_made_count).toBe(0);
      expect(m.further_referral_count).toBe(0);
      expect(m.escalated_count).toBe(0);
      expect(m.emergency_count).toBe(0);
      expect(m.recommendations_documented_rate).toBeNull();
      expect(m.follow_up_required_count).toBe(0);
      expect(m.follow_up_completed_rate).toBeNull();
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeProfessionalConsultationMetrics([]);
      expect(m.by_professional_type).toEqual({});
      expect(m.by_consultation_type).toEqual({});
      expect(m.by_consultation_outcome).toEqual({});
      expect(m.by_consultation_urgency).toEqual({});
    });
    it("counts recommendations_made", () => { expect(computeProfessionalConsultationMetrics([makeRecord()]).recommendations_made_count).toBe(1); });
    it("counts further_referral", () => { expect(computeProfessionalConsultationMetrics([makeRecord({ consultation_outcome: "further_referral" })]).further_referral_count).toBe(1); });
    it("counts escalated", () => { expect(computeProfessionalConsultationMetrics([makeRecord({ consultation_outcome: "escalated" })]).escalated_count).toBe(1); });
    it("counts emergency", () => { expect(computeProfessionalConsultationMetrics([makeRecord({ consultation_urgency: "emergency" })]).emergency_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeProfessionalConsultationMetrics([makeRecord()]);
      expect(m.recommendations_documented_rate).toBe(100);
      expect(m.actions_agreed_rate).toBe(100);
      expect(m.actions_completed_rate).toBe(100);
      expect(m.staff_informed_rate).toBe(100);
      expect(m.care_plan_updated_rate).toBe(100);
      expect(m.parent_carer_informed_rate).toBe(100);
      expect(m.social_worker_informed_rate).toBe(100);
      expect(m.child_participated_rate).toBe(100);
      expect(m.child_views_recorded_rate).toBe(100);
      expect(m.consent_obtained_rate).toBe(100);
    });
    it("recommendations_documented_rate 0 when false", () => { expect(computeProfessionalConsultationMetrics([makeRecord({ recommendations_documented: false })]).recommendations_documented_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeProfessionalConsultationMetrics([makeRecord({ recommendations_documented: true }), makeRecord({ recommendations_documented: false }), makeRecord({ recommendations_documented: true })]); expect(m.recommendations_documented_rate).toBe(66.7); });
    it("follow_up_required_count", () => { const m = computeProfessionalConsultationMetrics([makeRecord({ follow_up_required: true }), makeRecord({ follow_up_required: true }), makeRecord()]); expect(m.follow_up_required_count).toBe(2); });
    it("follow_up_completed_rate from required only", () => { const m = computeProfessionalConsultationMetrics([makeRecord({ follow_up_required: true, follow_up_completed: true }), makeRecord({ follow_up_required: true, follow_up_completed: false })]); expect(m.follow_up_completed_rate).toBe(50); });
    it("follow_up_completed_rate 0 when none required", () => { expect(computeProfessionalConsultationMetrics([makeRecord()]).follow_up_completed_rate).toBeNull();; });
    it("unique_children distinct", () => { const m = computeProfessionalConsultationMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 professional types", () => { const types = ["camhs_therapist","clinical_psychologist","social_worker","iro","lado","educational_psychologist","speech_therapist","occupational_therapist","psychiatrist","other"] as const; const records = types.map(t => makeRecord({ professional_type: t })); const m = computeProfessionalConsultationMetrics(records); for (const t of types) expect(m.by_professional_type[t]).toBe(1); });
    it("counts all 10 consultation types", () => { const types = ["assessment","review","advice_and_guidance","crisis_intervention","planned_session","telephone_consultation","multi_agency_meeting","case_conference","training_support","other"] as const; const records = types.map(t => makeRecord({ consultation_type: t })); const m = computeProfessionalConsultationMetrics(records); for (const t of types) expect(m.by_consultation_type[t]).toBe(1); });
    it("counts all 5 outcomes", () => { const outcomes = ["recommendations_made","further_referral","no_further_action","ongoing_support","escalated"] as const; const records = outcomes.map(o => makeRecord({ consultation_outcome: o })); const m = computeProfessionalConsultationMetrics(records); for (const o of outcomes) expect(m.by_consultation_outcome[o]).toBe(1); });
    it("counts all 5 urgencies", () => { const urgencies = ["emergency","urgent","routine","planned","follow_up"] as const; const records = urgencies.map(u => makeRecord({ consultation_urgency: u })); const m = computeProfessionalConsultationMetrics(records); for (const u of urgencies) expect(m.by_consultation_urgency[u]).toBe(1); });
  });

  describe("identifyProfessionalConsultationAlerts", () => {
    it("returns empty for clean", () => { expect(identifyProfessionalConsultationAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyProfessionalConsultationAlerts([])).toEqual([]); });
    it("fires emergency_actions_incomplete", () => { 
      const a = identifyProfessionalConsultationAlerts([makeRecord({ consultation_urgency: "emergency", actions_completed: false, child_name: "Jo", consultation_date: "2026-05-14" })]);
      expect(a[0].type).toBe("emergency_actions_incomplete");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("emergency_actions_incomplete per-record", () => { const a = identifyProfessionalConsultationAlerts([makeRecord({ id: "a-1", consultation_urgency: "emergency", actions_completed: false }), makeRecord({ id: "a-2", consultation_urgency: "emergency", actions_completed: false })]); expect(a.filter(x => x.type === "emergency_actions_incomplete")).toHaveLength(2); });
    it("no emergency alert if actions completed", () => { const a = identifyProfessionalConsultationAlerts([makeRecord({ consultation_urgency: "emergency", actions_completed: true })]); expect(a.filter(x => x.type === "emergency_actions_incomplete")).toHaveLength(0); });
    it("fires recommendations_not_documented singular", () => { 
      const a = identifyProfessionalConsultationAlerts([makeRecord({ recommendations_documented: false })]);
      const f = a.find(x => x.type === "recommendations_not_documented");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 consultation has");
    });
    it("recommendations_not_documented plural", () => { const a = identifyProfessionalConsultationAlerts([makeRecord({ recommendations_documented: false }), makeRecord({ recommendations_documented: false })]); const f = a.find(x => x.type === "recommendations_not_documented"); expect(f!.message).toContain("2 consultations have"); });
    it("fires follow_up_overdue singular", () => { 
      const a = identifyProfessionalConsultationAlerts([makeRecord({ follow_up_required: true, follow_up_completed: false })]);
      const f = a.find(x => x.type === "follow_up_overdue");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 consultation has");
    });
    it("follow_up_overdue plural", () => { const a = identifyProfessionalConsultationAlerts([makeRecord({ follow_up_required: true, follow_up_completed: false }), makeRecord({ follow_up_required: true, follow_up_completed: false })]); const f = a.find(x => x.type === "follow_up_overdue"); expect(f!.message).toContain("2 consultations have"); });
    it("no follow_up if completed", () => { expect(identifyProfessionalConsultationAlerts([makeRecord({ follow_up_required: true, follow_up_completed: true })]).find(x => x.type === "follow_up_overdue")).toBeUndefined(); });
    it("care_plan_not_updated not for 1", () => { expect(identifyProfessionalConsultationAlerts([makeRecord({ care_plan_updated: false })]).find(x => x.type === "care_plan_not_updated")).toBeUndefined(); });
    it("care_plan_not_updated fires for 2", () => { const a = identifyProfessionalConsultationAlerts([makeRecord({ care_plan_updated: false }), makeRecord({ care_plan_updated: false })]); expect(a.find(x => x.type === "care_plan_not_updated")).toBeDefined(); });
    it("consent_not_obtained not for 1", () => { expect(identifyProfessionalConsultationAlerts([makeRecord({ consent_obtained: false })]).find(x => x.type === "consent_not_obtained")).toBeUndefined(); });
    it("consent_not_obtained fires for 2", () => { const a = identifyProfessionalConsultationAlerts([makeRecord({ consent_obtained: false }), makeRecord({ consent_obtained: false })]); expect(a.find(x => x.type === "consent_not_obtained")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyProfessionalConsultationAlerts([makeRecord({ consultation_urgency: "emergency", actions_completed: false, recommendations_documented: false, follow_up_required: true, follow_up_completed: false, care_plan_updated: false, consent_obtained: false }), makeRecord({ care_plan_updated: false, consent_obtained: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("emergency_actions_incomplete");
      expect(types).toContain("recommendations_not_documented");
      expect(types).toContain("follow_up_overdue");
      expect(types).toContain("care_plan_not_updated");
      expect(types).toContain("consent_not_obtained");
    });
  });
});
