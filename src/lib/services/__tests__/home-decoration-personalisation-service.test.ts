import { describe, it, expect } from "vitest";
import { _testing, type HomeDecorationPersonalisationRecord } from "../home-decoration-personalisation-service";
import { todayStr } from "@/lib/utils";

const { computeHomeDecorationMetrics, identifyHomeDecorationAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<HomeDecorationPersonalisationRecord>): HomeDecorationPersonalisationRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    personalisation_type: overrides?.personalisation_type ?? "bedroom_decoration",
    satisfaction_level: overrides?.satisfaction_level ?? "satisfied",
    personalisation_scope: overrides?.personalisation_scope ?? "bedroom_only",
    budget_status: overrides?.budget_status ?? "within_budget",
    assessment_date: overrides?.assessment_date ?? todayStr(),
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : "child-1",
    assessed_by: overrides?.assessed_by ?? "Staff A",
    child_chose: overrides?.child_chose ?? true,
    child_involved_planning: overrides?.child_involved_planning ?? true,
    reflects_identity: overrides?.reflects_identity ?? true,
    culturally_appropriate: overrides?.culturally_appropriate ?? true,
    sensory_needs_met: overrides?.sensory_needs_met ?? true,
    age_appropriate: overrides?.age_appropriate ?? true,
    safety_checked: overrides?.safety_checked ?? true,
    photographs_taken: overrides?.photographs_taken ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    budget_discussed: overrides?.budget_discussed ?? true,
    child_satisfied: overrides?.child_satisfied ?? true,
    regularly_updated: overrides?.regularly_updated ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    budget_amount: "budget_amount" in (overrides ?? {}) ? (overrides!.budget_amount ?? null) : null,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("home-decoration-personalisation-service", () => {
  describe("computeHomeDecorationMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeHomeDecorationMetrics([]);
      expect(m.total_assessments).toBe(0);;
      expect(m.very_satisfied_count).toBe(0);
      expect(m.dissatisfied_count).toBe(0);
      expect(m.over_budget_count).toBe(0);
      expect(m.within_budget_count).toBe(0);
      expect(m.child_chose_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeHomeDecorationMetrics([]);
      expect(m.by_personalisation_type).toEqual({});
      expect(m.by_satisfaction_level).toEqual({});
      expect(m.by_personalisation_scope).toEqual({});
      expect(m.by_budget_status).toEqual({});
    });
    it("counts very_satisfied", () => { expect(computeHomeDecorationMetrics([makeRecord({ satisfaction_level: "very_satisfied" })]).very_satisfied_count).toBe(1); });
    it("counts dissatisfied includes dissatisfied", () => { expect(computeHomeDecorationMetrics([makeRecord({ satisfaction_level: "dissatisfied" })]).dissatisfied_count).toBe(1); });
    it("counts dissatisfied includes very_dissatisfied", () => { expect(computeHomeDecorationMetrics([makeRecord({ satisfaction_level: "very_dissatisfied" })]).dissatisfied_count).toBe(1); });
    it("dissatisfied_count combines both", () => { const m = computeHomeDecorationMetrics([makeRecord({ satisfaction_level: "dissatisfied" }), makeRecord({ satisfaction_level: "very_dissatisfied" })]); expect(m.dissatisfied_count).toBe(2); });
    it("counts over_budget", () => { expect(computeHomeDecorationMetrics([makeRecord({ budget_status: "over_budget" })]).over_budget_count).toBe(1); });
    it("counts within_budget", () => { expect(computeHomeDecorationMetrics([makeRecord()]).within_budget_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeHomeDecorationMetrics([makeRecord()]);
      expect(m.child_chose_rate).toBe(100);
      expect(m.child_involved_rate).toBe(100);
      expect(m.reflects_identity_rate).toBe(100);
      expect(m.culturally_appropriate_rate).toBe(100);
      expect(m.sensory_needs_rate).toBe(100);
      expect(m.age_appropriate_rate).toBe(100);
      expect(m.safety_checked_rate).toBe(100);
      expect(m.photographs_taken_rate).toBe(100);
      expect(m.social_worker_informed_rate).toBe(100);
      expect(m.budget_discussed_rate).toBe(100);
      expect(m.child_satisfied_rate).toBe(100);
      expect(m.regularly_updated_rate).toBe(100);
    });
    it("child_chose_rate 0 when false", () => { expect(computeHomeDecorationMetrics([makeRecord({ child_chose: false })]).child_chose_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeHomeDecorationMetrics([makeRecord({ child_chose: true }), makeRecord({ child_chose: false }), makeRecord({ child_chose: true })]); expect(m.child_chose_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeHomeDecorationMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 types", () => { const types = ["bedroom_decoration","bedding_choice","wall_art_posters","furniture_arrangement","colour_scheme","communal_area_input","garden_outdoor","sensory_items","cultural_items","other"] as const; const records = types.map(t => makeRecord({ personalisation_type: t })); const m = computeHomeDecorationMetrics(records); for (const t of types) expect(m.by_personalisation_type[t]).toBe(1); });
    it("counts all 5 satisfaction levels", () => { const levels = ["very_satisfied","satisfied","neutral","dissatisfied","very_dissatisfied"] as const; const records = levels.map(l => makeRecord({ satisfaction_level: l })); const m = computeHomeDecorationMetrics(records); for (const l of levels) expect(m.by_satisfaction_level[l]).toBe(1); });
    it("counts all 5 scopes", () => { const scopes = ["bedroom_only","communal_areas","both","outdoor","whole_home"] as const; const records = scopes.map(s => makeRecord({ personalisation_scope: s })); const m = computeHomeDecorationMetrics(records); for (const s of scopes) expect(m.by_personalisation_scope[s]).toBe(1); });
    it("counts all 5 budget statuses", () => { const statuses = ["within_budget","over_budget","under_budget","no_budget_set","awaiting_approval"] as const; const records = statuses.map(s => makeRecord({ budget_status: s })); const m = computeHomeDecorationMetrics(records); for (const s of statuses) expect(m.by_budget_status[s]).toBe(1); });
  });

  describe("identifyHomeDecorationAlerts", () => {
    it("returns empty for clean", () => { expect(identifyHomeDecorationAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyHomeDecorationAlerts([])).toEqual([]); });
    it("fires dissatisfied_no_choice", () => { 
      const a = identifyHomeDecorationAlerts([makeRecord({ satisfaction_level: "dissatisfied", child_chose: false, child_name: "Jo", personalisation_type: "colour_scheme" })]);
      expect(a[0].type).toBe("dissatisfied_no_choice");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
      expect(a[0].message).toContain("colour scheme");
    });
    it("dissatisfied_no_choice with very_dissatisfied", () => { const a = identifyHomeDecorationAlerts([makeRecord({ satisfaction_level: "very_dissatisfied", child_chose: false })]); expect(a.filter(x => x.type === "dissatisfied_no_choice")).toHaveLength(1); });
    it("dissatisfied_no_choice per-record", () => { const a = identifyHomeDecorationAlerts([makeRecord({ id: "a-1", satisfaction_level: "dissatisfied", child_chose: false }), makeRecord({ id: "a-2", satisfaction_level: "dissatisfied", child_chose: false })]); expect(a.filter(x => x.type === "dissatisfied_no_choice")).toHaveLength(2); });
    it("no alert if dissatisfied but chose", () => { expect(identifyHomeDecorationAlerts([makeRecord({ satisfaction_level: "dissatisfied", child_chose: true })]).filter(x => x.type === "dissatisfied_no_choice")).toHaveLength(0); });
    it("fires not_reflecting_identity singular", () => { 
      const a = identifyHomeDecorationAlerts([makeRecord({ reflects_identity: false })]);
      const f = a.find(x => x.type === "not_reflecting_identity");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 assessment shows");
    });
    it("not_reflecting_identity plural", () => { const a = identifyHomeDecorationAlerts([makeRecord({ reflects_identity: false }), makeRecord({ reflects_identity: false })]); const f = a.find(x => x.type === "not_reflecting_identity"); expect(f!.message).toContain("2 assessments show"); });
    it("fires safety_not_checked singular", () => { const a = identifyHomeDecorationAlerts([makeRecord({ safety_checked: false })]); expect(a.find(x => x.type === "safety_not_checked")).toBeDefined(); });
    it("not_culturally_appropriate not for 1", () => { expect(identifyHomeDecorationAlerts([makeRecord({ culturally_appropriate: false })]).find(x => x.type === "not_culturally_appropriate")).toBeUndefined(); });
    it("not_culturally_appropriate fires for 2", () => { const a = identifyHomeDecorationAlerts([makeRecord({ culturally_appropriate: false }), makeRecord({ culturally_appropriate: false })]); expect(a.find(x => x.type === "not_culturally_appropriate")).toBeDefined(); });
    it("not_regularly_updated not for 2", () => { expect(identifyHomeDecorationAlerts([makeRecord({ regularly_updated: false }), makeRecord({ regularly_updated: false })]).find(x => x.type === "not_regularly_updated")).toBeUndefined(); });
    it("not_regularly_updated fires for 3", () => { const a = identifyHomeDecorationAlerts([makeRecord({ regularly_updated: false }), makeRecord({ regularly_updated: false }), makeRecord({ regularly_updated: false })]); expect(a.find(x => x.type === "not_regularly_updated")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyHomeDecorationAlerts([makeRecord({ satisfaction_level: "dissatisfied", child_chose: false, reflects_identity: false, safety_checked: false, culturally_appropriate: false, regularly_updated: false }), makeRecord({ culturally_appropriate: false, regularly_updated: false }), makeRecord({ regularly_updated: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("dissatisfied_no_choice");
      expect(types).toContain("not_reflecting_identity");
      expect(types).toContain("safety_not_checked");
      expect(types).toContain("not_culturally_appropriate");
      expect(types).toContain("not_regularly_updated");
    });
  });
});
