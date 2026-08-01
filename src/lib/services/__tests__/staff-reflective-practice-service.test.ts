import { describe, it, expect } from "vitest";
import { _testing, type StaffReflectivePracticeRecord } from "../staff-reflective-practice-service";

const { computeStaffReflectiveMetrics, identifyStaffReflectiveAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<StaffReflectivePracticeRecord>): StaffReflectivePracticeRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    reflection_type: overrides?.reflection_type ?? "individual_reflection",
    reflection_model: overrides?.reflection_model ?? "gibbs",
    reflection_outcome: overrides?.reflection_outcome ?? "practice_improved",
    reflection_depth: overrides?.reflection_depth ?? "deep",
    reflection_date: overrides?.reflection_date ?? now.toISOString().split("T")[0],
    staff_name: overrides?.staff_name ?? "Staff A",
    facilitator_name: overrides?.facilitator_name ?? "Manager A",
    child_focused: overrides?.child_focused ?? true,
    values_explored: overrides?.values_explored ?? true,
    emotions_acknowledged: overrides?.emotions_acknowledged ?? true,
    learning_identified: overrides?.learning_identified ?? true,
    action_plan_created: overrides?.action_plan_created ?? true,
    practice_changed: overrides?.practice_changed ?? true,
    shared_with_team: overrides?.shared_with_team ?? true,
    linked_to_supervision: overrides?.linked_to_supervision ?? true,
    linked_to_training: overrides?.linked_to_training ?? true,
    evidence_documented: overrides?.evidence_documented ?? true,
    manager_reviewed: overrides?.manager_reviewed ?? true,
    child_impact_considered: overrides?.child_impact_considered ?? true,
    ethical_considerations: overrides?.ethical_considerations ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    session_duration_minutes: overrides?.session_duration_minutes ?? 45,
    next_reflection_date: "next_reflection_date" in (overrides ?? {}) ? (overrides!.next_reflection_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("staff-reflective-practice-service", () => {
  describe("computeStaffReflectiveMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeStaffReflectiveMetrics([]);
      expect(m.total_reflections).toBe(0);;
      expect(m.practice_improved_count).toBe(0);
      expect(m.further_support_count).toBe(0);
      expect(m.deep_count).toBe(0);
      expect(m.surface_count).toBe(0);
      expect(m.child_focused_rate).toBeNull();;
      expect(m.average_duration).toBeNull();;
      expect(m.unique_staff).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeStaffReflectiveMetrics([]);
      expect(m.by_reflection_type).toEqual({});
      expect(m.by_reflection_model).toEqual({});
      expect(m.by_reflection_outcome).toEqual({});
      expect(m.by_reflection_depth).toEqual({});
    });
    it("counts practice_improved", () => { expect(computeStaffReflectiveMetrics([makeRecord()]).practice_improved_count).toBe(1); });
    it("counts further_support", () => { expect(computeStaffReflectiveMetrics([makeRecord({ reflection_outcome: "further_support_needed" })]).further_support_count).toBe(1); });
    it("counts deep includes deep", () => { expect(computeStaffReflectiveMetrics([makeRecord({ reflection_depth: "deep" })]).deep_count).toBe(1); });
    it("counts deep includes transformative", () => { expect(computeStaffReflectiveMetrics([makeRecord({ reflection_depth: "transformative" })]).deep_count).toBe(1); });
    it("deep_count combines deep and transformative", () => { const m = computeStaffReflectiveMetrics([makeRecord({ reflection_depth: "deep" }), makeRecord({ reflection_depth: "transformative" })]); expect(m.deep_count).toBe(2); });
    it("counts surface", () => { expect(computeStaffReflectiveMetrics([makeRecord({ reflection_depth: "surface" })]).surface_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeStaffReflectiveMetrics([makeRecord()]);
      expect(m.child_focused_rate).toBe(100);
      expect(m.values_explored_rate).toBe(100);
      expect(m.emotions_acknowledged_rate).toBe(100);
      expect(m.learning_identified_rate).toBe(100);
      expect(m.action_plan_created_rate).toBe(100);
      expect(m.practice_changed_rate).toBe(100);
      expect(m.shared_with_team_rate).toBe(100);
      expect(m.linked_to_supervision_rate).toBe(100);
      expect(m.linked_to_training_rate).toBe(100);
      expect(m.evidence_documented_rate).toBe(100);
      expect(m.manager_reviewed_rate).toBe(100);
      expect(m.child_impact_rate).toBe(100);
    });
    it("child_focused_rate 0 when false", () => { expect(computeStaffReflectiveMetrics([makeRecord({ child_focused: false })]).child_focused_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeStaffReflectiveMetrics([makeRecord({ child_focused: true }), makeRecord({ child_focused: false }), makeRecord({ child_focused: true })]); expect(m.child_focused_rate).toBe(66.7); });
    it("average_duration single", () => { expect(computeStaffReflectiveMetrics([makeRecord({ session_duration_minutes: 60 })]).average_duration).toBe(60); });
    it("average_duration multi", () => { expect(computeStaffReflectiveMetrics([makeRecord({ session_duration_minutes: 30 }), makeRecord({ session_duration_minutes: 60 })]).average_duration).toBe(45); });
    it("unique_staff distinct", () => { const m = computeStaffReflectiveMetrics([makeRecord({ staff_name: "A" }), makeRecord({ staff_name: "B" }), makeRecord({ staff_name: "A" })]); expect(m.unique_staff).toBe(2); });
    it("counts all 10 reflection types", () => { const types = ["individual_reflection","group_reflection","critical_incident","supervision_reflection","peer_reflection","reflective_journal","action_learning","case_study_reflection","training_reflection","other"] as const; const records = types.map(t => makeRecord({ reflection_type: t })); const m = computeStaffReflectiveMetrics(records); for (const t of types) expect(m.by_reflection_type[t]).toBe(1); });
    it("counts all 10 reflection models", () => { const models = ["gibbs","kolb","driscoll","johns","schon","brookfield","rolfe","informal","structured_template","other"] as const; const records = models.map(model => makeRecord({ reflection_model: model })); const m = computeStaffReflectiveMetrics(records); for (const model of models) expect(m.by_reflection_model[model]).toBe(1); });
    it("counts all 5 outcomes", () => { const outcomes = ["practice_improved","learning_identified","action_planned","no_change_needed","further_support_needed"] as const; const records = outcomes.map(o => makeRecord({ reflection_outcome: o })); const m = computeStaffReflectiveMetrics(records); for (const o of outcomes) expect(m.by_reflection_outcome[o]).toBe(1); });
    it("counts all 5 depths", () => { const depths = ["surface","moderate","deep","transformative","not_assessed"] as const; const records = depths.map(d => makeRecord({ reflection_depth: d })); const m = computeStaffReflectiveMetrics(records); for (const d of depths) expect(m.by_reflection_depth[d]).toBe(1); });
  });

  describe("identifyStaffReflectiveAlerts", () => {
    it("returns empty for clean", () => { expect(identifyStaffReflectiveAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyStaffReflectiveAlerts([])).toEqual([]); });
    it("fires critical_incident_no_supervision", () => { 
      const a = identifyStaffReflectiveAlerts([makeRecord({ reflection_type: "critical_incident", linked_to_supervision: false, staff_name: "Jo", reflection_date: "2026-05-14" })]);
      expect(a[0].type).toBe("critical_incident_no_supervision");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("critical_incident_no_supervision per-record", () => { const a = identifyStaffReflectiveAlerts([makeRecord({ id: "a-1", reflection_type: "critical_incident", linked_to_supervision: false }), makeRecord({ id: "a-2", reflection_type: "critical_incident", linked_to_supervision: false })]); expect(a.filter(x => x.type === "critical_incident_no_supervision")).toHaveLength(2); });
    it("no alert if critical_incident with supervision", () => { expect(identifyStaffReflectiveAlerts([makeRecord({ reflection_type: "critical_incident", linked_to_supervision: true })]).filter(x => x.type === "critical_incident_no_supervision")).toHaveLength(0); });
    it("fires no_child_impact singular", () => { 
      const a = identifyStaffReflectiveAlerts([makeRecord({ child_impact_considered: false })]);
      const f = a.find(x => x.type === "no_child_impact");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 reflection has");
    });
    it("no_child_impact plural", () => { const a = identifyStaffReflectiveAlerts([makeRecord({ child_impact_considered: false }), makeRecord({ child_impact_considered: false })]); const f = a.find(x => x.type === "no_child_impact"); expect(f!.message).toContain("2 reflections have"); });
    it("no_learning_identified not for 1", () => { expect(identifyStaffReflectiveAlerts([makeRecord({ learning_identified: false })]).find(x => x.type === "no_learning_identified")).toBeUndefined(); });
    it("no_learning_identified fires for 2", () => { const a = identifyStaffReflectiveAlerts([makeRecord({ learning_identified: false }), makeRecord({ learning_identified: false })]); expect(a.find(x => x.type === "no_learning_identified")).toBeDefined(); });
    it("evidence_not_documented not for 1", () => { expect(identifyStaffReflectiveAlerts([makeRecord({ evidence_documented: false })]).find(x => x.type === "evidence_not_documented")).toBeUndefined(); });
    it("evidence_not_documented fires for 2", () => { const a = identifyStaffReflectiveAlerts([makeRecord({ evidence_documented: false }), makeRecord({ evidence_documented: false })]); expect(a.find(x => x.type === "evidence_not_documented")).toBeDefined(); });
    it("not_shared_with_team not for 2", () => { expect(identifyStaffReflectiveAlerts([makeRecord({ shared_with_team: false }), makeRecord({ shared_with_team: false })]).find(x => x.type === "not_shared_with_team")).toBeUndefined(); });
    it("not_shared_with_team fires for 3", () => { const a = identifyStaffReflectiveAlerts([makeRecord({ shared_with_team: false }), makeRecord({ shared_with_team: false }), makeRecord({ shared_with_team: false })]); expect(a.find(x => x.type === "not_shared_with_team")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyStaffReflectiveAlerts([makeRecord({ reflection_type: "critical_incident", linked_to_supervision: false, child_impact_considered: false, learning_identified: false, evidence_documented: false, shared_with_team: false }), makeRecord({ learning_identified: false, evidence_documented: false, shared_with_team: false }), makeRecord({ shared_with_team: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("critical_incident_no_supervision");
      expect(types).toContain("no_child_impact");
      expect(types).toContain("no_learning_identified");
      expect(types).toContain("evidence_not_documented");
      expect(types).toContain("not_shared_with_team");
    });
  });
});
