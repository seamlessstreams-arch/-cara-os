import { describe, it, expect } from "vitest";
import { _testing, type StaffDebriefSupportRecord } from "../staff-debrief-support-service";
import { todayStr } from "@/lib/utils";

const { computeStaffDebriefMetrics, identifyStaffDebriefAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<StaffDebriefSupportRecord>): StaffDebriefSupportRecord {
  return {
    id: "a-1", home_id: "home-1",
    debrief_type: "post_incident",
    incident_severity: "medium",
    staff_impact: "mildly_affected",
    support_outcome: "fully_supported",
    debrief_date: todayStr(),
    staff_name: "Staff A",
    facilitated_by: "Manager A",
    timely_debrief: true,
    safe_space_provided: true,
    confidentiality_assured: true,
    emotional_support_offered: true,
    learning_captured: true,
    action_plan_agreed: true,
    follow_up_scheduled: true,
    supervision_linked: true,
    occupational_health_considered: true,
    eap_signposted: true,
    peer_support_offered: true,
    recorded_promptly: true,
    issues_found: [], actions_taken: [],
    debrief_duration_minutes: 30,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("staff-debrief-support-service", () => {
  describe("computeStaffDebriefMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeStaffDebriefMetrics([]);
      expect(m.total_debriefs).toBe(0);;
      expect(m.critical_severity_count).toBe(0);
      expect(m.significantly_affected_count).toBe(0);
      expect(m.further_support_count).toBe(0);
      expect(m.declined_support_count).toBe(0);
      expect(m.timely_debrief_rate).toBeNull();;
      expect(m.average_duration).toBeNull();;
      expect(m.unique_staff).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeStaffDebriefMetrics([]);
      expect(m.by_debrief_type).toEqual({});
      expect(m.by_incident_severity).toEqual({});
      expect(m.by_staff_impact).toEqual({});
      expect(m.by_support_outcome).toEqual({});
    });
    it("counts critical_severity", () => { expect(computeStaffDebriefMetrics([makeRecord({ incident_severity: "critical" })]).critical_severity_count).toBe(1); });
    it("counts significantly_affected", () => { expect(computeStaffDebriefMetrics([makeRecord({ staff_impact: "significantly_affected" })]).significantly_affected_count).toBe(1); });
    it("counts further_support", () => { expect(computeStaffDebriefMetrics([makeRecord({ support_outcome: "further_support_needed" })]).further_support_count).toBe(1); });
    it("counts declined_support", () => { expect(computeStaffDebriefMetrics([makeRecord({ support_outcome: "declined_support" })]).declined_support_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeStaffDebriefMetrics([makeRecord()]);
      expect(m.timely_debrief_rate).toBe(100);
      expect(m.safe_space_rate).toBe(100);
      expect(m.confidentiality_rate).toBe(100);
      expect(m.emotional_support_rate).toBe(100);
      expect(m.learning_captured_rate).toBe(100);
      expect(m.action_plan_rate).toBe(100);
      expect(m.follow_up_rate).toBe(100);
      expect(m.supervision_linked_rate).toBe(100);
      expect(m.occupational_health_rate).toBe(100);
      expect(m.eap_signposted_rate).toBe(100);
      expect(m.peer_support_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("timely_debrief_rate 0 when false", () => { expect(computeStaffDebriefMetrics([makeRecord({ timely_debrief: false })]).timely_debrief_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeStaffDebriefMetrics([makeRecord({ timely_debrief: true }), makeRecord({ timely_debrief: false }), makeRecord({ timely_debrief: true })]); expect(m.timely_debrief_rate).toBe(66.7); });
    it("average_duration single", () => { expect(computeStaffDebriefMetrics([makeRecord({ debrief_duration_minutes: 45 })]).average_duration).toBe(45); });
    it("average_duration multi", () => { expect(computeStaffDebriefMetrics([makeRecord({ debrief_duration_minutes: 20 }), makeRecord({ debrief_duration_minutes: 40 })]).average_duration).toBe(30); });
    it("unique_staff distinct", () => { const m = computeStaffDebriefMetrics([makeRecord({ staff_name: "A" }), makeRecord({ staff_name: "B" }), makeRecord({ staff_name: "A" })]); expect(m.unique_staff).toBe(2); });
    it("counts all 10 debrief types", () => { const types = ["post_incident","post_restraint","post_missing","post_safeguarding","routine_end_of_shift","team_reflection","supervision_debrief","critical_incident","complaint_related","other"] as const; const records = types.map(t => makeRecord({ debrief_type: t })); const m = computeStaffDebriefMetrics(records); for (const t of types) expect(m.by_debrief_type[t]).toBe(1); });
    it("counts all 5 incident severities", () => { const severities = ["critical","high","medium","low","not_applicable"] as const; const records = severities.map(s => makeRecord({ incident_severity: s })); const m = computeStaffDebriefMetrics(records); for (const s of severities) expect(m.by_incident_severity[s]).toBe(1); });
    it("counts all 5 staff impacts", () => { const impacts = ["significantly_affected","moderately_affected","mildly_affected","not_affected","not_assessed"] as const; const records = impacts.map(i => makeRecord({ staff_impact: i })); const m = computeStaffDebriefMetrics(records); for (const i of impacts) expect(m.by_staff_impact[i]).toBe(1); });
    it("counts all 5 support outcomes", () => { const outcomes = ["fully_supported","partially_supported","further_support_needed","referred_externally","declined_support"] as const; const records = outcomes.map(o => makeRecord({ support_outcome: o })); const m = computeStaffDebriefMetrics(records); for (const o of outcomes) expect(m.by_support_outcome[o]).toBe(1); });
  });

  describe("identifyStaffDebriefAlerts", () => {
    it("returns empty for clean", () => { expect(identifyStaffDebriefAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyStaffDebriefAlerts([])).toEqual([]); });
    it("fires significantly_affected_no_followup", () => { 
      const a = identifyStaffDebriefAlerts([makeRecord({ staff_impact: "significantly_affected", follow_up_scheduled: false, staff_name: "Jo", debrief_type: "post_restraint" })]);
      expect(a[0].type).toBe("significantly_affected_no_followup");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
      expect(a[0].message).toContain("post restraint");
    });
    it("significantly_affected_no_followup per-record", () => { const a = identifyStaffDebriefAlerts([makeRecord({ id: "a-1", staff_impact: "significantly_affected", follow_up_scheduled: false }), makeRecord({ id: "a-2", staff_impact: "significantly_affected", follow_up_scheduled: false })]); expect(a.filter(x => x.type === "significantly_affected_no_followup")).toHaveLength(2); });
    it("no alert if sig affected with follow-up", () => { expect(identifyStaffDebriefAlerts([makeRecord({ staff_impact: "significantly_affected", follow_up_scheduled: true })]).filter(x => x.type === "significantly_affected_no_followup")).toHaveLength(0); });
    it("fires not_timely singular", () => { 
      const a = identifyStaffDebriefAlerts([makeRecord({ timely_debrief: false })]);
      const f = a.find(x => x.type === "not_timely");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 debrief was");
    });
    it("not_timely plural", () => { const a = identifyStaffDebriefAlerts([makeRecord({ timely_debrief: false }), makeRecord({ timely_debrief: false })]); const f = a.find(x => x.type === "not_timely"); expect(f!.message).toContain("2 debriefs were"); });
    it("fires learning_not_captured singular", () => { const a = identifyStaffDebriefAlerts([makeRecord({ learning_captured: false })]); const f = a.find(x => x.type === "learning_not_captured"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); });
    it("no_emotional_support not for 1", () => { expect(identifyStaffDebriefAlerts([makeRecord({ emotional_support_offered: false })]).find(x => x.type === "no_emotional_support")).toBeUndefined(); });
    it("no_emotional_support fires for 2", () => { const a = identifyStaffDebriefAlerts([makeRecord({ emotional_support_offered: false }), makeRecord({ emotional_support_offered: false })]); expect(a.find(x => x.type === "no_emotional_support")).toBeDefined(); });
    it("no_safe_space not for 1", () => { expect(identifyStaffDebriefAlerts([makeRecord({ safe_space_provided: false })]).find(x => x.type === "no_safe_space")).toBeUndefined(); });
    it("no_safe_space fires for 2", () => { const a = identifyStaffDebriefAlerts([makeRecord({ safe_space_provided: false }), makeRecord({ safe_space_provided: false })]); expect(a.find(x => x.type === "no_safe_space")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyStaffDebriefAlerts([makeRecord({ staff_impact: "significantly_affected", follow_up_scheduled: false, timely_debrief: false, learning_captured: false, emotional_support_offered: false, safe_space_provided: false }), makeRecord({ emotional_support_offered: false, safe_space_provided: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("significantly_affected_no_followup");
      expect(types).toContain("not_timely");
      expect(types).toContain("learning_not_captured");
      expect(types).toContain("no_emotional_support");
      expect(types).toContain("no_safe_space");
    });
  });
});
