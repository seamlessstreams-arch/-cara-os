import { describe, it, expect } from "vitest";
import { _testing, type BoundaryManagementRecord } from "../boundary-management-service";

const { computeBoundaryManagementMetrics, identifyBoundaryManagementAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<BoundaryManagementRecord>): BoundaryManagementRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    boundary_type: overrides?.boundary_type ?? "house_rules",
    child_response: overrides?.child_response ?? "accepted",
    staff_approach: overrides?.staff_approach ?? "calm_explanation",
    consistency_rating: overrides?.consistency_rating ?? "fully_consistent",
    incident_date: overrides?.incident_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    staff_name: overrides?.staff_name ?? "Staff A",
    boundary_explained: overrides?.boundary_explained ?? true,
    age_appropriate: overrides?.age_appropriate ?? true,
    child_voice_heard: overrides?.child_voice_heard ?? true,
    trauma_informed: overrides?.trauma_informed ?? true,
    care_plan_consistent: overrides?.care_plan_consistent ?? true,
    relationship_maintained: overrides?.relationship_maintained ?? true,
    de_escalation_used: overrides?.de_escalation_used ?? true,
    restorative_offered: overrides?.restorative_offered ?? true,
    learning_identified: overrides?.learning_identified ?? true,
    parent_informed: overrides?.parent_informed ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    recorded_by: overrides?.recorded_by ?? "Manager A",
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("boundary-management-service", () => {
  describe("computeBoundaryManagementMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeBoundaryManagementMetrics([]);
      expect(m.total_incidents).toBe(0);;
      expect(m.accepted_count).toBe(0);
      expect(m.escalated_count).toBe(0);
      expect(m.refused_count).toBe(0);
      expect(m.inconsistent_count).toBe(0);
      expect(m.boundary_explained_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeBoundaryManagementMetrics([]);
      expect(m.by_boundary_type).toEqual({});
      expect(m.by_child_response).toEqual({});
      expect(m.by_staff_approach).toEqual({});
      expect(m.by_consistency_rating).toEqual({});
    });
    it("counts accepted", () => { expect(computeBoundaryManagementMetrics([makeRecord()]).accepted_count).toBe(1); });
    it("counts escalated", () => { expect(computeBoundaryManagementMetrics([makeRecord({ child_response: "escalated" })]).escalated_count).toBe(1); });
    it("counts refused", () => { expect(computeBoundaryManagementMetrics([makeRecord({ child_response: "refused" })]).refused_count).toBe(1); });
    it("counts inconsistent includes inconsistent", () => { expect(computeBoundaryManagementMetrics([makeRecord({ consistency_rating: "inconsistent" })]).inconsistent_count).toBe(1); });
    it("counts inconsistent includes contradictory", () => { expect(computeBoundaryManagementMetrics([makeRecord({ consistency_rating: "contradictory" })]).inconsistent_count).toBe(1); });
    it("inconsistent_count combines both", () => { const m = computeBoundaryManagementMetrics([makeRecord({ consistency_rating: "inconsistent" }), makeRecord({ consistency_rating: "contradictory" })]); expect(m.inconsistent_count).toBe(2); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeBoundaryManagementMetrics([makeRecord()]);
      expect(m.boundary_explained_rate).toBe(100);
      expect(m.age_appropriate_rate).toBe(100);
      expect(m.child_voice_rate).toBe(100);
      expect(m.trauma_informed_rate).toBe(100);
      expect(m.care_plan_consistent_rate).toBe(100);
      expect(m.relationship_maintained_rate).toBe(100);
      expect(m.de_escalation_rate).toBe(100);
      expect(m.restorative_rate).toBe(100);
      expect(m.learning_identified_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.social_worker_informed_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("boundary_explained_rate 0 when false", () => { expect(computeBoundaryManagementMetrics([makeRecord({ boundary_explained: false })]).boundary_explained_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeBoundaryManagementMetrics([makeRecord({ boundary_explained: true }), makeRecord({ boundary_explained: false }), makeRecord({ boundary_explained: true })]); expect(m.boundary_explained_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeBoundaryManagementMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 boundary types", () => { const types = ["bedtime_routine","screen_time","house_rules","personal_space","language_behaviour","visitors_contact","money_spending","community_access","self_care","other"] as const; const records = types.map(t => makeRecord({ boundary_type: t })); const m = computeBoundaryManagementMetrics(records); for (const t of types) expect(m.by_boundary_type[t]).toBe(1); });
    it("counts all 5 child responses", () => { const responses = ["accepted","negotiated","tested","refused","escalated"] as const; const records = responses.map(r => makeRecord({ child_response: r })); const m = computeBoundaryManagementMetrics(records); for (const r of responses) expect(m.by_child_response[r]).toBe(1); });
    it("counts all 10 staff approaches", () => { const approaches = ["calm_explanation","positive_reinforcement","natural_consequence","distraction_redirect","therapeutic_conversation","gave_space","de_escalation","restorative_approach","sought_support","other"] as const; const records = approaches.map(a => makeRecord({ staff_approach: a })); const m = computeBoundaryManagementMetrics(records); for (const a of approaches) expect(m.by_staff_approach[a]).toBe(1); });
    it("counts all 5 consistency ratings", () => { const ratings = ["fully_consistent","mostly_consistent","inconsistent","contradictory","not_assessed"] as const; const records = ratings.map(r => makeRecord({ consistency_rating: r })); const m = computeBoundaryManagementMetrics(records); for (const r of ratings) expect(m.by_consistency_rating[r]).toBe(1); });
  });

  describe("identifyBoundaryManagementAlerts", () => {
    it("returns empty for clean", () => { expect(identifyBoundaryManagementAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyBoundaryManagementAlerts([])).toEqual([]); });
    it("fires escalated_no_deescalation", () => { 
      const a = identifyBoundaryManagementAlerts([makeRecord({ child_response: "escalated", de_escalation_used: false, child_name: "Jo", boundary_type: "screen_time" })]);
      expect(a[0].type).toBe("escalated_no_deescalation");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
      expect(a[0].message).toContain("screen time");
    });
    it("escalated_no_deescalation per-record", () => { const a = identifyBoundaryManagementAlerts([makeRecord({ id: "a-1", child_response: "escalated", de_escalation_used: false }), makeRecord({ id: "a-2", child_response: "escalated", de_escalation_used: false })]); expect(a.filter(x => x.type === "escalated_no_deescalation")).toHaveLength(2); });
    it("no alert if escalated with de-escalation", () => { expect(identifyBoundaryManagementAlerts([makeRecord({ child_response: "escalated", de_escalation_used: true })]).filter(x => x.type === "escalated_no_deescalation")).toHaveLength(0); });
    it("fires not_trauma_informed singular", () => { 
      const a = identifyBoundaryManagementAlerts([makeRecord({ trauma_informed: false })]);
      const f = a.find(x => x.type === "not_trauma_informed");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 boundary interaction was");
    });
    it("not_trauma_informed plural", () => { const a = identifyBoundaryManagementAlerts([makeRecord({ trauma_informed: false }), makeRecord({ trauma_informed: false })]); const f = a.find(x => x.type === "not_trauma_informed"); expect(f!.message).toContain("2 boundary interactions were"); });
    it("fires child_voice_not_heard singular", () => { const a = identifyBoundaryManagementAlerts([makeRecord({ child_voice_heard: false })]); const f = a.find(x => x.type === "child_voice_not_heard"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); });
    it("inconsistent_boundaries not for 1", () => { expect(identifyBoundaryManagementAlerts([makeRecord({ consistency_rating: "inconsistent" })]).find(x => x.type === "inconsistent_boundaries")).toBeUndefined(); });
    it("inconsistent_boundaries fires for 2", () => { const a = identifyBoundaryManagementAlerts([makeRecord({ consistency_rating: "inconsistent" }), makeRecord({ consistency_rating: "contradictory" })]); expect(a.find(x => x.type === "inconsistent_boundaries")).toBeDefined(); });
    it("no_restorative not for 2", () => { expect(identifyBoundaryManagementAlerts([makeRecord({ restorative_offered: false }), makeRecord({ restorative_offered: false })]).find(x => x.type === "no_restorative")).toBeUndefined(); });
    it("no_restorative fires for 3", () => { const a = identifyBoundaryManagementAlerts([makeRecord({ restorative_offered: false }), makeRecord({ restorative_offered: false }), makeRecord({ restorative_offered: false })]); expect(a.find(x => x.type === "no_restorative")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyBoundaryManagementAlerts([makeRecord({ child_response: "escalated", de_escalation_used: false, trauma_informed: false, child_voice_heard: false, consistency_rating: "inconsistent", restorative_offered: false }), makeRecord({ consistency_rating: "contradictory", restorative_offered: false }), makeRecord({ restorative_offered: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("escalated_no_deescalation");
      expect(types).toContain("not_trauma_informed");
      expect(types).toContain("child_voice_not_heard");
      expect(types).toContain("inconsistent_boundaries");
      expect(types).toContain("no_restorative");
    });
  });
});
