import { describe, it, expect } from "vitest";
import { _testing, type FirstAidMedicalEmergencyRecord } from "../first-aid-medical-emergency-service";
import { todayStr } from "@/lib/utils";

const { computeFirstAidMetrics, identifyFirstAidAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<FirstAidMedicalEmergencyRecord>): FirstAidMedicalEmergencyRecord {
  return {
    id: "a-1", home_id: "home-1",
    incident_type: "minor_injury",
    severity_level: "minor",
    response_quality: "good",
    outcome_assessment: "full_recovery",
    incident_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    responded_by: "Staff A",
    first_aid_trained: true,
    correct_procedure_followed: true,
    equipment_available: true,
    ambulance_called: true,
    parent_notified: true,
    gp_informed: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    incident_recorded: true,
    ofsted_notified: true,
    debrief_completed: true,
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

describe("first-aid-medical-emergency-service", () => {
  describe("computeFirstAidMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeFirstAidMetrics([]);
      expect(m.total_incidents).toBe(0);
      expect(m.serious_count).toBe(0);
      expect(m.poor_response_count).toBe(0);
      expect(m.hospitalised_count).toBe(0);
      expect(m.untrained_count).toBe(0);
      expect(m.first_aid_trained_rate).toBeNull();
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeFirstAidMetrics([]);
      expect(m.by_incident_type).toEqual({});
      expect(m.by_severity_level).toEqual({});
      expect(m.by_response_quality).toEqual({});
      expect(m.by_outcome_assessment).toEqual({});
    });
    it("total_incidents counts records", () => { expect(computeFirstAidMetrics([makeRecord(), makeRecord()]).total_incidents).toBe(2); });
    it("counts serious", () => { expect(computeFirstAidMetrics([makeRecord({ severity_level: "serious" })]).serious_count).toBe(1); });
    it("counts life_threatening as serious", () => { expect(computeFirstAidMetrics([makeRecord({ severity_level: "life_threatening" })]).serious_count).toBe(1); });
    it("does not count moderate as serious", () => { expect(computeFirstAidMetrics([makeRecord({ severity_level: "moderate" })]).serious_count).toBe(0); });
    it("counts poor response", () => { expect(computeFirstAidMetrics([makeRecord({ response_quality: "poor" })]).poor_response_count).toBe(1); });
    it("counts failed as poor response", () => { expect(computeFirstAidMetrics([makeRecord({ response_quality: "failed" })]).poor_response_count).toBe(1); });
    it("does not count adequate as poor", () => { expect(computeFirstAidMetrics([makeRecord({ response_quality: "adequate" })]).poor_response_count).toBe(0); });
    it("counts hospitalised", () => { expect(computeFirstAidMetrics([makeRecord({ outcome_assessment: "hospitalised" })]).hospitalised_count).toBe(1); });
    it("does not count escalated as hospitalised", () => { expect(computeFirstAidMetrics([makeRecord({ outcome_assessment: "escalated" })]).hospitalised_count).toBe(0); });
    it("counts untrained", () => { expect(computeFirstAidMetrics([makeRecord({ first_aid_trained: false })]).untrained_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeFirstAidMetrics([makeRecord()]);
      expect(m.first_aid_trained_rate).toBe(100);
      expect(m.correct_procedure_rate).toBe(100);
      expect(m.equipment_rate).toBe(100);
      expect(m.ambulance_rate).toBe(100);
      expect(m.parent_notified_rate).toBe(100);
      expect(m.gp_informed_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.incident_recorded_rate).toBe(100);
      expect(m.ofsted_notified_rate).toBe(100);
      expect(m.debrief_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("first_aid_trained_rate 0 when false", () => { expect(computeFirstAidMetrics([makeRecord({ first_aid_trained: false })]).first_aid_trained_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeFirstAidMetrics([makeRecord({ debrief_completed: true }), makeRecord({ debrief_completed: false }), makeRecord({ debrief_completed: true })]); expect(m.debrief_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeFirstAidMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 incident types", () => { const types = ["minor_injury","major_injury","allergic_reaction","seizure","breathing_difficulty","choking","mental_health_crisis","medication_error","equipment_check","other"] as const; const records = types.map(t => makeRecord({ incident_type: t })); const m = computeFirstAidMetrics(records); for (const t of types) expect(m.by_incident_type[t]).toBe(1); });
    it("counts all 5 severity levels", () => { const levels = ["minor","moderate","serious","life_threatening","preventive"] as const; const records = levels.map(l => makeRecord({ severity_level: l })); const m = computeFirstAidMetrics(records); for (const l of levels) expect(m.by_severity_level[l]).toBe(1); });
    it("counts all 5 response qualities", () => { const qualities = ["excellent","good","adequate","poor","failed"] as const; const records = qualities.map(q => makeRecord({ response_quality: q })); const m = computeFirstAidMetrics(records); for (const q of qualities) expect(m.by_response_quality[q]).toBe(1); });
    it("counts all 5 outcome assessments", () => { const assessments = ["full_recovery","improving","ongoing_treatment","hospitalised","escalated"] as const; const records = assessments.map(a => makeRecord({ outcome_assessment: a })); const m = computeFirstAidMetrics(records); for (const a of assessments) expect(m.by_outcome_assessment[a]).toBe(1); });
  });

  describe("identifyFirstAidAlerts", () => {
    it("returns empty for clean", () => { expect(identifyFirstAidAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyFirstAidAlerts([])).toEqual([]); });
    it("fires serious_poor_response", () => { 
      const a = identifyFirstAidAlerts([makeRecord({ severity_level: "serious", response_quality: "poor", child_name: "Jo" })]);
      expect(a[0].type).toBe("serious_poor_response");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("life_threatening with failed also critical", () => { const a = identifyFirstAidAlerts([makeRecord({ severity_level: "life_threatening", response_quality: "failed" })]); expect(a[0].type).toBe("serious_poor_response"); expect(a[0].severity).toBe("critical"); });
    it("serious_poor_response per-record", () => { const a = identifyFirstAidAlerts([makeRecord({ id: "a-1", severity_level: "serious", response_quality: "poor" }), makeRecord({ id: "a-2", severity_level: "life_threatening", response_quality: "failed" })]); expect(a.filter(x => x.type === "serious_poor_response")).toHaveLength(2); });
    it("serious without poor no critical", () => { expect(identifyFirstAidAlerts([makeRecord({ severity_level: "serious", response_quality: "good" })]).find(x => x.type === "serious_poor_response")).toBeUndefined(); });
    it("poor without serious no critical", () => { expect(identifyFirstAidAlerts([makeRecord({ response_quality: "poor", severity_level: "minor" })]).find(x => x.type === "serious_poor_response")).toBeUndefined(); });
    it("fires untrained_responder singular", () => { 
      const a = identifyFirstAidAlerts([makeRecord({ first_aid_trained: false })]);
      const f = a.find(x => x.type === "untrained_responder");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 incident has");
    });
    it("untrained_responder plural", () => { const a = identifyFirstAidAlerts([makeRecord({ first_aid_trained: false }), makeRecord({ first_aid_trained: false })]); const f = a.find(x => x.type === "untrained_responder"); expect(f!.message).toContain("2 incidents have"); });
    it("fires incorrect_procedure singular", () => { 
      const a = identifyFirstAidAlerts([makeRecord({ correct_procedure_followed: false })]);
      const f = a.find(x => x.type === "incorrect_procedure");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 incident has");
    });
    it("no_debrief not for 1", () => { expect(identifyFirstAidAlerts([makeRecord({ debrief_completed: false })]).find(x => x.type === "no_debrief")).toBeUndefined(); });
    it("no_debrief fires for 2", () => { const a = identifyFirstAidAlerts([makeRecord({ debrief_completed: false }), makeRecord({ debrief_completed: false })]); expect(a.find(x => x.type === "no_debrief")).toBeDefined(); expect(a.find(x => x.type === "no_debrief")!.severity).toBe("medium"); });
    it("no_equipment not for 1", () => { expect(identifyFirstAidAlerts([makeRecord({ equipment_available: false })]).find(x => x.type === "no_equipment")).toBeUndefined(); });
    it("no_equipment fires for 2", () => { const a = identifyFirstAidAlerts([makeRecord({ equipment_available: false }), makeRecord({ equipment_available: false })]); expect(a.find(x => x.type === "no_equipment")).toBeDefined(); expect(a.find(x => x.type === "no_equipment")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyFirstAidAlerts([makeRecord({ severity_level: "serious", response_quality: "poor", first_aid_trained: false, correct_procedure_followed: false, debrief_completed: false, equipment_available: false }), makeRecord({ first_aid_trained: false, correct_procedure_followed: false, debrief_completed: false, equipment_available: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("serious_poor_response");
      expect(types).toContain("untrained_responder");
      expect(types).toContain("incorrect_procedure");
      expect(types).toContain("no_debrief");
      expect(types).toContain("no_equipment");
    });
  });
});

describe("tri-state judgements", () => {
  it("counts an unrecorded responder qualification in the gap alert, worded as unevidenced", () => {
    const alerts = identifyFirstAidAlerts([makeRecord({ first_aid_trained: null })]);
    const alert = alerts.find((a) => a.type === "untrained_responder");
    expect(alert).toBeTruthy();
    expect(alert!.message).toContain("evidenced");
  });
  it("counts only recorded untrained responders in the metric", () => {
    const rows = [null, null, false].map((v, i) => makeRecord({ id: `r-${i}`, first_aid_trained: v }));
    expect(computeFirstAidMetrics(rows).untrained_count).toBe(1);
  });
  it("does not dilute the trained rate with unrecorded rows", () => {
    const rows = [true, null, null, null].map((v, i) => makeRecord({ id: `r-${i}`, first_aid_trained: v }));
    expect(computeFirstAidMetrics(rows).first_aid_trained_rate).toBe(100);
  });
});
