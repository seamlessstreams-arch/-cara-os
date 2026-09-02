import { describe, it, expect } from "vitest";
import { _testing, type PositiveHandlingRecord } from "../positive-handling-service";
import { todayStr } from "@/lib/utils";

const { computePositiveHandlingMetrics, identifyPositiveHandlingAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<PositiveHandlingRecord>): PositiveHandlingRecord {
  return {
    id: "a-1", home_id: "home-1",
    plan_type: "positive_handling_plan",
    review_outcome: "plan_effective",
    trigger_category: "emotional",
    intervention_level: "verbal_de_escalation",
    review_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : "child-1",
    triggers_identified: true,
    early_warning_signs: true,
    de_escalation_steps: true,
    calming_strategies: true,
    staff_trained: true,
    child_consulted: true,
    parent_informed: true,
    social_worker_informed: true,
    plan_accessible: true,
    regularly_reviewed: true,
    post_incident_support: true,
    medication_considered: false,
    issues_found: [], actions_taken: [],
    reviewed_by: "Manager A",
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("positive-handling-service", () => {
  describe("computePositiveHandlingMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computePositiveHandlingMetrics([]);
      expect(m.total_reviews).toBe(0);;
      expect(m.effective_count).toBe(0);
      expect(m.needs_revision_count).toBe(0);
      expect(m.escalation_required_count).toBe(0);
      expect(m.triggers_identified_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computePositiveHandlingMetrics([]);
      expect(m.by_plan_type).toEqual({});
      expect(m.by_review_outcome).toEqual({});
      expect(m.by_trigger_category).toEqual({});
      expect(m.by_intervention_level).toEqual({});
    });
    it("counts effective", () => { expect(computePositiveHandlingMetrics([makeRecord()]).effective_count).toBe(1); });
    it("counts needs_revision", () => { expect(computePositiveHandlingMetrics([makeRecord({ review_outcome: "plan_needs_revision" })]).needs_revision_count).toBe(1); });
    it("counts escalation", () => { expect(computePositiveHandlingMetrics([makeRecord({ review_outcome: "escalation_required" })]).escalation_required_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computePositiveHandlingMetrics([makeRecord()]);
      expect(m.triggers_identified_rate).toBe(100);
      expect(m.early_warning_rate).toBe(100);
      expect(m.de_escalation_rate).toBe(100);
      expect(m.calming_strategies_rate).toBe(100);
      expect(m.staff_trained_rate).toBe(100);
      expect(m.child_consulted_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.social_worker_informed_rate).toBe(100);
      expect(m.plan_accessible_rate).toBe(100);
      expect(m.regularly_reviewed_rate).toBe(100);
      expect(m.post_incident_support_rate).toBe(100);
    });
    it("de_escalation_rate 0 when false", () => { expect(computePositiveHandlingMetrics([makeRecord({ de_escalation_steps: false })]).de_escalation_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computePositiveHandlingMetrics([makeRecord({ de_escalation_steps: true }), makeRecord({ de_escalation_steps: false }), makeRecord({ de_escalation_steps: true })]); expect(m.de_escalation_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computePositiveHandlingMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 plan types", () => { const types = ["positive_handling_plan","de_escalation_strategy","behaviour_support_plan","crisis_intervention_plan","risk_reduction_plan","calming_strategy","sensory_regulation","communication_passport","transition_support","other"] as const; const records = types.map(t => makeRecord({ plan_type: t })); const m = computePositiveHandlingMetrics(records); for (const t of types) expect(m.by_plan_type[t]).toBe(1); });
    it("counts all 5 outcomes", () => { const outcomes = ["plan_effective","plan_partially_effective","plan_needs_revision","plan_no_longer_needed","escalation_required"] as const; const records = outcomes.map(o => makeRecord({ review_outcome: o })); const m = computePositiveHandlingMetrics(records); for (const o of outcomes) expect(m.by_review_outcome[o]).toBe(1); });
    it("counts all 10 triggers", () => { const triggers = ["environmental","emotional","social","sensory","communication","transition","demand","health_related","trauma_related","other"] as const; const records = triggers.map(t => makeRecord({ trigger_category: t })); const m = computePositiveHandlingMetrics(records); for (const t of triggers) expect(m.by_trigger_category[t]).toBe(1); });
    it("counts all 5 levels", () => { const levels = ["verbal_de_escalation","distraction_redirect","planned_ignoring","physical_proximity","guided_away"] as const; const records = levels.map(l => makeRecord({ intervention_level: l })); const m = computePositiveHandlingMetrics(records); for (const l of levels) expect(m.by_intervention_level[l]).toBe(1); });
  });

  describe("identifyPositiveHandlingAlerts", () => {
    it("returns empty for clean", () => { expect(identifyPositiveHandlingAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyPositiveHandlingAlerts([])).toEqual([]); });
    it("fires escalation_untrained", () => { 
      const a = identifyPositiveHandlingAlerts([makeRecord({ review_outcome: "escalation_required", staff_trained: false, child_name: "Jo", review_date: "2026-05-14" })]);
      expect(a[0].type).toBe("escalation_untrained");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("escalation_untrained per-record", () => { const a = identifyPositiveHandlingAlerts([makeRecord({ id: "a-1", review_outcome: "escalation_required", staff_trained: false }), makeRecord({ id: "a-2", review_outcome: "escalation_required", staff_trained: false })]); expect(a.filter(x => x.type === "escalation_untrained")).toHaveLength(2); });
    it("no escalation alert if trained", () => { expect(identifyPositiveHandlingAlerts([makeRecord({ review_outcome: "escalation_required", staff_trained: true })]).filter(x => x.type === "escalation_untrained")).toHaveLength(0); });
    it("fires no_de_escalation singular", () => { 
      const a = identifyPositiveHandlingAlerts([makeRecord({ de_escalation_steps: false })]);
      const f = a.find(x => x.type === "no_de_escalation");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 plan has");
    });
    it("no_de_escalation plural", () => { const a = identifyPositiveHandlingAlerts([makeRecord({ de_escalation_steps: false }), makeRecord({ de_escalation_steps: false })]); const f = a.find(x => x.type === "no_de_escalation"); expect(f!.message).toContain("2 plans have"); });
    it("fires child_not_consulted singular", () => { const a = identifyPositiveHandlingAlerts([makeRecord({ child_consulted: false })]); expect(a.find(x => x.type === "child_not_consulted")).toBeDefined(); });
    it("plan_not_accessible not for 1", () => { expect(identifyPositiveHandlingAlerts([makeRecord({ plan_accessible: false })]).find(x => x.type === "plan_not_accessible")).toBeUndefined(); });
    it("plan_not_accessible fires for 2", () => { const a = identifyPositiveHandlingAlerts([makeRecord({ plan_accessible: false }), makeRecord({ plan_accessible: false })]); expect(a.find(x => x.type === "plan_not_accessible")).toBeDefined(); });
    it("not_regularly_reviewed not for 1", () => { expect(identifyPositiveHandlingAlerts([makeRecord({ regularly_reviewed: false })]).find(x => x.type === "not_regularly_reviewed")).toBeUndefined(); });
    it("not_regularly_reviewed fires for 2", () => { const a = identifyPositiveHandlingAlerts([makeRecord({ regularly_reviewed: false }), makeRecord({ regularly_reviewed: false })]); expect(a.find(x => x.type === "not_regularly_reviewed")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyPositiveHandlingAlerts([makeRecord({ review_outcome: "escalation_required", staff_trained: false, de_escalation_steps: false, child_consulted: false, plan_accessible: false, regularly_reviewed: false }), makeRecord({ plan_accessible: false, regularly_reviewed: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("escalation_untrained");
      expect(types).toContain("no_de_escalation");
      expect(types).toContain("child_not_consulted");
      expect(types).toContain("plan_not_accessible");
      expect(types).toContain("not_regularly_reviewed");
    });
  });
});
