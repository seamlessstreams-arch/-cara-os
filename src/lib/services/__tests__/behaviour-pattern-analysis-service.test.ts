import { describe, it, expect } from "vitest";
import { _testing, type BehaviourPatternAnalysisRecord } from "../behaviour-pattern-analysis-service";

const { computeBehaviourPatternMetrics, identifyBehaviourPatternAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<BehaviourPatternAnalysisRecord>): BehaviourPatternAnalysisRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    behaviour_category: overrides?.behaviour_category ?? "other",
    trigger_type: overrides?.trigger_type ?? "peer_conflict",
    intervention_outcome: overrides?.intervention_outcome ?? "de_escalated",
    behaviour_severity: overrides?.behaviour_severity ?? "low",
    incident_date: overrides?.incident_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    staff_involved: overrides?.staff_involved ?? "Staff A",
    trigger_identified: overrides?.trigger_identified ?? true,
    de_escalation_attempted: overrides?.de_escalation_attempted ?? true,
    child_views_sought: overrides?.child_views_sought ?? true,
    debrief_completed: overrides?.debrief_completed ?? true,
    pattern_identified: overrides?.pattern_identified ?? true,
    care_plan_updated: overrides?.care_plan_updated ?? true,
    risk_assessment_updated: overrides?.risk_assessment_updated ?? true,
    positive_strategies_used: overrides?.positive_strategies_used ?? true,
    therapeutic_input_considered: overrides?.therapeutic_input_considered ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    parent_informed: overrides?.parent_informed ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("behaviour-pattern-analysis-service", () => {
  describe("computeBehaviourPatternMetrics", () => {
    it("returns zeros for empty", () => { const m = computeBehaviourPatternMetrics([]); expect(m.total_incidents).toBe(0); expect(m.severe_count).toBe(0); expect(m.critical_count).toBe(0); expect(m.restraint_count).toBe(0); expect(m.unknown_trigger_count).toBe(0); expect(m.trigger_identified_rate).toBe(0); expect(m.unique_children).toBe(0); });
    it("returns empty breakdowns", () => { const m = computeBehaviourPatternMetrics([]); expect(m.by_behaviour_category).toEqual({}); expect(m.by_trigger_type).toEqual({}); expect(m.by_intervention_outcome).toEqual({}); expect(m.by_behaviour_severity).toEqual({}); });
    it("total_incidents counts records", () => { expect(computeBehaviourPatternMetrics([makeRecord(), makeRecord()]).total_incidents).toBe(2); });
    it("counts severe", () => { expect(computeBehaviourPatternMetrics([makeRecord({ behaviour_severity: "severe" })]).severe_count).toBe(1); });
    it("counts critical", () => { expect(computeBehaviourPatternMetrics([makeRecord({ behaviour_severity: "critical" })]).critical_count).toBe(1); });
    it("does not count high as severe", () => { expect(computeBehaviourPatternMetrics([makeRecord({ behaviour_severity: "high" })]).severe_count).toBe(0); });
    it("counts restraint", () => { expect(computeBehaviourPatternMetrics([makeRecord({ intervention_outcome: "required_restraint" })]).restraint_count).toBe(1); });
    it("counts unknown_trigger", () => { expect(computeBehaviourPatternMetrics([makeRecord({ trigger_type: "unknown" })]).unknown_trigger_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { const m = computeBehaviourPatternMetrics([makeRecord()]); expect(m.trigger_identified_rate).toBe(100); expect(m.de_escalation_rate).toBe(100); expect(m.child_views_rate).toBe(100); expect(m.debrief_rate).toBe(100); expect(m.pattern_identified_rate).toBe(100); expect(m.care_plan_rate).toBe(100); expect(m.risk_assessment_rate).toBe(100); expect(m.positive_strategies_rate).toBe(100); expect(m.therapeutic_input_rate).toBe(100); expect(m.social_worker_rate).toBe(100); expect(m.parent_informed_rate).toBe(100); expect(m.recorded_promptly_rate).toBe(100); });
    it("de_escalation_rate 0 when false", () => { expect(computeBehaviourPatternMetrics([makeRecord({ de_escalation_attempted: false })]).de_escalation_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeBehaviourPatternMetrics([makeRecord({ debrief_completed: true }), makeRecord({ debrief_completed: false }), makeRecord({ debrief_completed: true })]); expect(m.debrief_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeBehaviourPatternMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 behaviour categories", () => { const categories = ["verbal_aggression","physical_aggression","self_harm","property_damage","absconding","substance_use","sexualised_behaviour","withdrawal","defiance","other"] as const; const records = categories.map(c => makeRecord({ behaviour_category: c })); const m = computeBehaviourPatternMetrics(records); for (const c of categories) expect(m.by_behaviour_category[c]).toBe(1); });
    it("counts all 10 trigger types", () => { const triggers = ["contact_related","peer_conflict","staff_interaction","routine_change","sensory_overload","anxiety","trauma_response","unmet_need","unknown","other"] as const; const records = triggers.map(t => makeRecord({ trigger_type: t })); const m = computeBehaviourPatternMetrics(records); for (const t of triggers) expect(m.by_trigger_type[t]).toBe(1); });
    it("counts all 5 intervention outcomes", () => { const outcomes = ["de_escalated","partially_resolved","required_restraint","required_separation","self_resolved"] as const; const records = outcomes.map(o => makeRecord({ intervention_outcome: o })); const m = computeBehaviourPatternMetrics(records); for (const o of outcomes) expect(m.by_intervention_outcome[o]).toBe(1); });
    it("counts all 5 behaviour severities", () => { const severities = ["low","moderate","high","severe","critical"] as const; const records = severities.map(s => makeRecord({ behaviour_severity: s })); const m = computeBehaviourPatternMetrics(records); for (const s of severities) expect(m.by_behaviour_severity[s]).toBe(1); });
  });

  describe("identifyBehaviourPatternAlerts", () => {
    it("returns empty for clean", () => { expect(identifyBehaviourPatternAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyBehaviourPatternAlerts([])).toEqual([]); });
    it("fires restraint_no_deescalation", () => { const a = identifyBehaviourPatternAlerts([makeRecord({ intervention_outcome: "required_restraint", de_escalation_attempted: false, child_name: "Jo" })]); expect(a[0].type).toBe("restraint_no_deescalation"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Jo"); });
    it("restraint_no_deescalation per-record", () => { const a = identifyBehaviourPatternAlerts([makeRecord({ id: "a-1", intervention_outcome: "required_restraint", de_escalation_attempted: false }), makeRecord({ id: "a-2", intervention_outcome: "required_restraint", de_escalation_attempted: false })]); expect(a.filter(x => x.type === "restraint_no_deescalation")).toHaveLength(2); });
    it("restraint with de-escalation no critical", () => { expect(identifyBehaviourPatternAlerts([makeRecord({ intervention_outcome: "required_restraint", de_escalation_attempted: true })]).find(x => x.type === "restraint_no_deescalation")).toBeUndefined(); });
    it("non-restraint no de-escalation no critical", () => { expect(identifyBehaviourPatternAlerts([makeRecord({ intervention_outcome: "de_escalated", de_escalation_attempted: false })]).find(x => x.type === "restraint_no_deescalation")).toBeUndefined(); });
    it("fires debrief_not_completed singular", () => { const a = identifyBehaviourPatternAlerts([makeRecord({ debrief_completed: false })]); const f = a.find(x => x.type === "debrief_not_completed"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 incident has"); });
    it("debrief_not_completed plural", () => { const a = identifyBehaviourPatternAlerts([makeRecord({ debrief_completed: false }), makeRecord({ debrief_completed: false })]); const f = a.find(x => x.type === "debrief_not_completed"); expect(f!.message).toContain("2 incidents have"); });
    it("fires positive_strategies_not_used singular", () => { const a = identifyBehaviourPatternAlerts([makeRecord({ positive_strategies_used: false })]); const f = a.find(x => x.type === "positive_strategies_not_used"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 incident has"); });
    it("pattern_not_identified not for 1", () => { expect(identifyBehaviourPatternAlerts([makeRecord({ pattern_identified: false })]).find(x => x.type === "pattern_not_identified")).toBeUndefined(); });
    it("pattern_not_identified fires for 2", () => { const a = identifyBehaviourPatternAlerts([makeRecord({ pattern_identified: false }), makeRecord({ pattern_identified: false })]); expect(a.find(x => x.type === "pattern_not_identified")).toBeDefined(); expect(a.find(x => x.type === "pattern_not_identified")!.severity).toBe("medium"); });
    it("risk_not_updated not for 1", () => { expect(identifyBehaviourPatternAlerts([makeRecord({ risk_assessment_updated: false })]).find(x => x.type === "risk_not_updated")).toBeUndefined(); });
    it("risk_not_updated fires for 2", () => { const a = identifyBehaviourPatternAlerts([makeRecord({ risk_assessment_updated: false }), makeRecord({ risk_assessment_updated: false })]); expect(a.find(x => x.type === "risk_not_updated")).toBeDefined(); expect(a.find(x => x.type === "risk_not_updated")!.severity).toBe("medium"); });
    it("fires all applicable", () => { const a = identifyBehaviourPatternAlerts([makeRecord({ intervention_outcome: "required_restraint", de_escalation_attempted: false, debrief_completed: false, positive_strategies_used: false, pattern_identified: false, risk_assessment_updated: false }), makeRecord({ debrief_completed: false, positive_strategies_used: false, pattern_identified: false, risk_assessment_updated: false })]); const types = a.map(x => x.type); expect(types).toContain("restraint_no_deescalation"); expect(types).toContain("debrief_not_completed"); expect(types).toContain("positive_strategies_not_used"); expect(types).toContain("pattern_not_identified"); expect(types).toContain("risk_not_updated"); });
  });
});
