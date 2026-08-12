import { describe, it, expect } from "vitest";
import { _testing, type RestraintDebriefRecord } from "../restraint-debrief-service";
import { todayStr } from "@/lib/utils";

const { computeRestraintDebriefMetrics, identifyRestraintDebriefAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<RestraintDebriefRecord>): RestraintDebriefRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    debrief_type: overrides?.debrief_type ?? "child_debrief",
    restraint_type: overrides?.restraint_type ?? "planned_intervention",
    debrief_outcome: overrides?.debrief_outcome ?? "no_concerns",
    child_emotional_state: overrides?.child_emotional_state ?? "calm",
    debrief_date: overrides?.debrief_date ?? todayStr(),
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : "child-1",
    staff_involved: overrides?.staff_involved ?? "Staff A",
    child_debrief_completed: overrides?.child_debrief_completed ?? true,
    staff_debrief_completed: overrides?.staff_debrief_completed ?? true,
    medical_check_done: overrides?.medical_check_done ?? true,
    body_map_completed: overrides?.body_map_completed ?? true,
    ofsted_notified: overrides?.ofsted_notified ?? true,
    social_worker_notified: overrides?.social_worker_notified ?? true,
    parent_notified: overrides?.parent_notified ?? true,
    witness_statements_taken: overrides?.witness_statements_taken ?? true,
    cctv_reviewed: overrides?.cctv_reviewed ?? true,
    proportionate_response: overrides?.proportionate_response ?? true,
    learning_documented: overrides?.learning_documented ?? true,
    plan_updated: overrides?.plan_updated ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    debriefed_by: overrides?.debriefed_by ?? "Manager A",
    restraint_duration_minutes: overrides?.restraint_duration_minutes ?? 5,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("restraint-debrief-service", () => {
  describe("computeRestraintDebriefMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeRestraintDebriefMetrics([]);
      expect(m.total_debriefs).toBe(0);;
      expect(m.no_concerns_count).toBe(0);
      expect(m.learning_identified_count).toBe(0);
      expect(m.investigation_count).toBe(0);
      expect(m.distressed_count).toBe(0);
      expect(m.child_debrief_rate).toBeNull();;
      expect(m.average_restraint_duration).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeRestraintDebriefMetrics([]);
      expect(m.by_debrief_type).toEqual({});
      expect(m.by_restraint_type).toEqual({});
      expect(m.by_debrief_outcome).toEqual({});
      expect(m.by_emotional_state).toEqual({});
    });
    it("counts no_concerns", () => { expect(computeRestraintDebriefMetrics([makeRecord()]).no_concerns_count).toBe(1); });
    it("counts learning_identified", () => { expect(computeRestraintDebriefMetrics([makeRecord({ debrief_outcome: "learning_identified" })]).learning_identified_count).toBe(1); });
    it("counts investigation", () => { expect(computeRestraintDebriefMetrics([makeRecord({ debrief_outcome: "investigation_required" })]).investigation_count).toBe(1); });
    it("counts distressed", () => { expect(computeRestraintDebriefMetrics([makeRecord({ child_emotional_state: "distressed" })]).distressed_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeRestraintDebriefMetrics([makeRecord()]);
      expect(m.child_debrief_rate).toBe(100);
      expect(m.staff_debrief_rate).toBe(100);
      expect(m.medical_check_rate).toBe(100);
      expect(m.body_map_rate).toBe(100);
      expect(m.ofsted_notified_rate).toBe(100);
      expect(m.social_worker_notified_rate).toBe(100);
      expect(m.parent_notified_rate).toBe(100);
      expect(m.witness_statements_rate).toBe(100);
      expect(m.cctv_reviewed_rate).toBe(100);
      expect(m.proportionate_rate).toBe(100);
      expect(m.learning_documented_rate).toBe(100);
      expect(m.plan_updated_rate).toBe(100);
    });
    it("child_debrief_rate 0 when false", () => { expect(computeRestraintDebriefMetrics([makeRecord({ child_debrief_completed: false })]).child_debrief_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeRestraintDebriefMetrics([makeRecord({ child_debrief_completed: true }), makeRecord({ child_debrief_completed: false }), makeRecord({ child_debrief_completed: true })]); expect(m.child_debrief_rate).toBe(66.7); });
    it("average_restraint_duration single", () => { expect(computeRestraintDebriefMetrics([makeRecord({ restraint_duration_minutes: 10 })]).average_restraint_duration).toBe(10); });
    it("average_restraint_duration multi", () => { expect(computeRestraintDebriefMetrics([makeRecord({ restraint_duration_minutes: 4 }), makeRecord({ restraint_duration_minutes: 8 })]).average_restraint_duration).toBe(6); });
    it("unique_children distinct", () => { const m = computeRestraintDebriefMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 debrief types", () => { const types = ["child_debrief","staff_debrief","combined_debrief","management_review","multi_agency_review","independent_review","follow_up_debrief","formal_investigation","learning_review","other"] as const; const records = types.map(t => makeRecord({ debrief_type: t })); const m = computeRestraintDebriefMetrics(records); for (const t of types) expect(m.by_debrief_type[t]).toBe(1); });
    it("counts all 10 restraint types", () => { const types = ["planned_intervention","unplanned_intervention","emergency_response","guided_away","standing_hold","seated_hold","ground_hold","separation","seclusion","other"] as const; const records = types.map(t => makeRecord({ restraint_type: t })); const m = computeRestraintDebriefMetrics(records); for (const t of types) expect(m.by_restraint_type[t]).toBe(1); });
    it("counts all 5 outcomes", () => { const outcomes = ["no_concerns","learning_identified","plan_updated","training_needed","investigation_required"] as const; const records = outcomes.map(o => makeRecord({ debrief_outcome: o })); const m = computeRestraintDebriefMetrics(records); for (const o of outcomes) expect(m.by_debrief_outcome[o]).toBe(1); });
    it("counts all 5 emotional states", () => { const states = ["calm","upset_but_recovering","distressed","angry","withdrawn"] as const; const records = states.map(s => makeRecord({ child_emotional_state: s })); const m = computeRestraintDebriefMetrics(records); for (const s of states) expect(m.by_emotional_state[s]).toBe(1); });
  });

  describe("identifyRestraintDebriefAlerts", () => {
    it("returns empty for clean", () => { expect(identifyRestraintDebriefAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyRestraintDebriefAlerts([])).toEqual([]); });
    it("fires disproportionate_response", () => { 
      const a = identifyRestraintDebriefAlerts([makeRecord({ proportionate_response: false, child_name: "Jo", debrief_date: "2026-05-14" })]);
      expect(a[0].type).toBe("disproportionate_response");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("disproportionate_response per-record", () => { const a = identifyRestraintDebriefAlerts([makeRecord({ id: "a-1", proportionate_response: false }), makeRecord({ id: "a-2", proportionate_response: false })]); expect(a.filter(x => x.type === "disproportionate_response")).toHaveLength(2); });
    it("fires no_child_debrief singular", () => { 
      const a = identifyRestraintDebriefAlerts([makeRecord({ child_debrief_completed: false })]);
      const f = a.find(x => x.type === "no_child_debrief");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 restraint has");
    });
    it("no_child_debrief plural", () => { const a = identifyRestraintDebriefAlerts([makeRecord({ child_debrief_completed: false }), makeRecord({ child_debrief_completed: false })]); const f = a.find(x => x.type === "no_child_debrief"); expect(f!.message).toContain("2 restraints have"); });
    it("fires no_medical_check singular", () => { const a = identifyRestraintDebriefAlerts([makeRecord({ medical_check_done: false })]); expect(a.find(x => x.type === "no_medical_check")).toBeDefined(); });
    it("no_medical_check plural", () => { const a = identifyRestraintDebriefAlerts([makeRecord({ medical_check_done: false }), makeRecord({ medical_check_done: false })]); const f = a.find(x => x.type === "no_medical_check"); expect(f!.message).toContain("2 restraints have"); });
    it("ofsted_not_notified not for 1", () => { expect(identifyRestraintDebriefAlerts([makeRecord({ ofsted_notified: false })]).find(x => x.type === "ofsted_not_notified")).toBeUndefined(); });
    it("ofsted_not_notified fires for 2", () => { const a = identifyRestraintDebriefAlerts([makeRecord({ ofsted_notified: false }), makeRecord({ ofsted_notified: false })]); expect(a.find(x => x.type === "ofsted_not_notified")).toBeDefined(); });
    it("learning_not_documented not for 1", () => { expect(identifyRestraintDebriefAlerts([makeRecord({ learning_documented: false })]).find(x => x.type === "learning_not_documented")).toBeUndefined(); });
    it("learning_not_documented fires for 2", () => { const a = identifyRestraintDebriefAlerts([makeRecord({ learning_documented: false }), makeRecord({ learning_documented: false })]); expect(a.find(x => x.type === "learning_not_documented")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyRestraintDebriefAlerts([makeRecord({ proportionate_response: false, child_debrief_completed: false, medical_check_done: false, ofsted_notified: false, learning_documented: false }), makeRecord({ ofsted_notified: false, learning_documented: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("disproportionate_response");
      expect(types).toContain("no_child_debrief");
      expect(types).toContain("no_medical_check");
      expect(types).toContain("ofsted_not_notified");
      expect(types).toContain("learning_not_documented");
    });
  });
});
