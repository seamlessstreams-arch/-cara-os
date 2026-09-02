import { describe, it, expect } from "vitest";
import { _testing, type AdvocacyRepresentationRecord } from "../advocacy-representation-service";
import { todayStr } from "@/lib/utils";

const { computeAdvocacyRepresentationMetrics, identifyAdvocacyRepresentationAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<AdvocacyRepresentationRecord>): AdvocacyRepresentationRecord {
  return {
    id: "a-1", home_id: "home-1",
    advocacy_type: "independent_advocate",
    representation_quality: "good",
    child_satisfaction: "satisfied",
    outcome_effectiveness: "mostly_effective",
    session_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    facilitated_by: "Staff A",
    child_voice_heard: true,
    child_understood_rights: true,
    independent_access: true,
    confidentiality_maintained: true,
    outcome_communicated: true,
    follow_up_arranged: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    irm_notified: true,
    decision_influenced: true,
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

describe("advocacy-representation-service", () => {
  describe("computeAdvocacyRepresentationMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeAdvocacyRepresentationMetrics([]);
      expect(m.total_sessions).toBe(0);;
      expect(m.poor_quality_count).toBe(0);
      expect(m.dissatisfied_count).toBe(0);
      expect(m.ineffective_count).toBe(0);
      expect(m.counterproductive_count).toBe(0);
      expect(m.child_voice_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeAdvocacyRepresentationMetrics([]);
      expect(m.by_advocacy_type).toEqual({});
      expect(m.by_representation_quality).toEqual({});
      expect(m.by_child_satisfaction).toEqual({});
      expect(m.by_outcome_effectiveness).toEqual({});
    });
    it("total_sessions counts records", () => { expect(computeAdvocacyRepresentationMetrics([makeRecord(), makeRecord()]).total_sessions).toBe(2); });
    it("counts poor_quality for poor", () => { expect(computeAdvocacyRepresentationMetrics([makeRecord({ representation_quality: "poor" })]).poor_quality_count).toBe(1); });
    it("counts poor_quality for not_provided", () => { expect(computeAdvocacyRepresentationMetrics([makeRecord({ representation_quality: "not_provided" })]).poor_quality_count).toBe(1); });
    it("does not count adequate as poor_quality", () => { expect(computeAdvocacyRepresentationMetrics([makeRecord({ representation_quality: "adequate" })]).poor_quality_count).toBe(0); });
    it("counts dissatisfied for dissatisfied", () => { expect(computeAdvocacyRepresentationMetrics([makeRecord({ child_satisfaction: "dissatisfied" })]).dissatisfied_count).toBe(1); });
    it("counts dissatisfied for very_dissatisfied", () => { expect(computeAdvocacyRepresentationMetrics([makeRecord({ child_satisfaction: "very_dissatisfied" })]).dissatisfied_count).toBe(1); });
    it("does not count neutral as dissatisfied", () => { expect(computeAdvocacyRepresentationMetrics([makeRecord({ child_satisfaction: "neutral" })]).dissatisfied_count).toBe(0); });
    it("counts ineffective", () => { expect(computeAdvocacyRepresentationMetrics([makeRecord({ outcome_effectiveness: "ineffective" })]).ineffective_count).toBe(1); });
    it("counts counterproductive", () => { expect(computeAdvocacyRepresentationMetrics([makeRecord({ outcome_effectiveness: "counterproductive" })]).counterproductive_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeAdvocacyRepresentationMetrics([makeRecord()]);
      expect(m.child_voice_rate).toBe(100);
      expect(m.rights_understood_rate).toBe(100);
      expect(m.independent_access_rate).toBe(100);
      expect(m.confidentiality_rate).toBe(100);
      expect(m.outcome_communicated_rate).toBe(100);
      expect(m.follow_up_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.irm_notified_rate).toBe(100);
      expect(m.decision_influenced_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_voice_rate 0 when false", () => { expect(computeAdvocacyRepresentationMetrics([makeRecord({ child_voice_heard: false })]).child_voice_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeAdvocacyRepresentationMetrics([makeRecord({ independent_access: true }), makeRecord({ independent_access: false }), makeRecord({ independent_access: true })]); expect(m.independent_access_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeAdvocacyRepresentationMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 advocacy types", () => { const types = ["independent_advocate","peer_advocacy","self_advocacy","formal_representation","informal_support","complaints_advocacy","review_advocacy","rights_education","group_advocacy","other"] as const; const records = types.map(t => makeRecord({ advocacy_type: t })); const m = computeAdvocacyRepresentationMetrics(records); for (const t of types) expect(m.by_advocacy_type[t]).toBe(1); });
    it("counts all 5 representation qualities", () => { const qualities = ["excellent","good","adequate","poor","not_provided"] as const; const records = qualities.map(q => makeRecord({ representation_quality: q })); const m = computeAdvocacyRepresentationMetrics(records); for (const q of qualities) expect(m.by_representation_quality[q]).toBe(1); });
    it("counts all 5 child satisfactions", () => { const satisfactions = ["very_satisfied","satisfied","neutral","dissatisfied","very_dissatisfied"] as const; const records = satisfactions.map(s => makeRecord({ child_satisfaction: s })); const m = computeAdvocacyRepresentationMetrics(records); for (const s of satisfactions) expect(m.by_child_satisfaction[s]).toBe(1); });
    it("counts all 5 outcome effectivenesses", () => { const effs = ["fully_effective","mostly_effective","partially_effective","ineffective","counterproductive"] as const; const records = effs.map(e => makeRecord({ outcome_effectiveness: e })); const m = computeAdvocacyRepresentationMetrics(records); for (const e of effs) expect(m.by_outcome_effectiveness[e]).toBe(1); });
  });

  describe("identifyAdvocacyRepresentationAlerts", () => {
    it("returns empty for clean", () => { expect(identifyAdvocacyRepresentationAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyAdvocacyRepresentationAlerts([])).toEqual([]); });
    it("fires dissatisfied_counterproductive", () => { 
      const a = identifyAdvocacyRepresentationAlerts([makeRecord({ child_satisfaction: "dissatisfied", outcome_effectiveness: "counterproductive", child_name: "Jo" })]);
      expect(a[0].type).toBe("dissatisfied_counterproductive");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("dissatisfied_counterproductive for very_dissatisfied too", () => { const a = identifyAdvocacyRepresentationAlerts([makeRecord({ child_satisfaction: "very_dissatisfied", outcome_effectiveness: "counterproductive" })]); expect(a.filter(x => x.type === "dissatisfied_counterproductive")).toHaveLength(1); });
    it("dissatisfied_counterproductive per-record", () => { const a = identifyAdvocacyRepresentationAlerts([makeRecord({ id: "a-1", child_satisfaction: "dissatisfied", outcome_effectiveness: "counterproductive" }), makeRecord({ id: "a-2", child_satisfaction: "very_dissatisfied", outcome_effectiveness: "counterproductive" })]); expect(a.filter(x => x.type === "dissatisfied_counterproductive")).toHaveLength(2); });
    it("dissatisfied with effective no critical", () => { expect(identifyAdvocacyRepresentationAlerts([makeRecord({ child_satisfaction: "dissatisfied", outcome_effectiveness: "fully_effective" })]).find(x => x.type === "dissatisfied_counterproductive")).toBeUndefined(); });
    it("satisfied with counterproductive no critical", () => { expect(identifyAdvocacyRepresentationAlerts([makeRecord({ child_satisfaction: "satisfied", outcome_effectiveness: "counterproductive" })]).find(x => x.type === "dissatisfied_counterproductive")).toBeUndefined(); });
    it("fires no_independent_access singular", () => { 
      const a = identifyAdvocacyRepresentationAlerts([makeRecord({ independent_access: false })]);
      const f = a.find(x => x.type === "no_independent_access");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("no_independent_access plural", () => { const a = identifyAdvocacyRepresentationAlerts([makeRecord({ independent_access: false }), makeRecord({ independent_access: false })]); const f = a.find(x => x.type === "no_independent_access"); expect(f!.message).toContain("2 sessions have"); });
    it("fires child_voice_not_heard singular", () => { 
      const a = identifyAdvocacyRepresentationAlerts([makeRecord({ child_voice_heard: false })]);
      const f = a.find(x => x.type === "child_voice_not_heard");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("confidentiality_breach not for 1", () => { expect(identifyAdvocacyRepresentationAlerts([makeRecord({ confidentiality_maintained: false })]).find(x => x.type === "confidentiality_breach")).toBeUndefined(); });
    it("confidentiality_breach fires for 2", () => { const a = identifyAdvocacyRepresentationAlerts([makeRecord({ confidentiality_maintained: false }), makeRecord({ confidentiality_maintained: false })]); expect(a.find(x => x.type === "confidentiality_breach")).toBeDefined(); expect(a.find(x => x.type === "confidentiality_breach")!.severity).toBe("medium"); });
    it("rights_not_understood not for 1", () => { expect(identifyAdvocacyRepresentationAlerts([makeRecord({ child_understood_rights: false })]).find(x => x.type === "rights_not_understood")).toBeUndefined(); });
    it("rights_not_understood fires for 2", () => { const a = identifyAdvocacyRepresentationAlerts([makeRecord({ child_understood_rights: false }), makeRecord({ child_understood_rights: false })]); expect(a.find(x => x.type === "rights_not_understood")).toBeDefined(); expect(a.find(x => x.type === "rights_not_understood")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyAdvocacyRepresentationAlerts([makeRecord({ child_satisfaction: "dissatisfied", outcome_effectiveness: "counterproductive", independent_access: false, child_voice_heard: false, confidentiality_maintained: false, child_understood_rights: false }), makeRecord({ independent_access: false, child_voice_heard: false, confidentiality_maintained: false, child_understood_rights: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("dissatisfied_counterproductive");
      expect(types).toContain("no_independent_access");
      expect(types).toContain("child_voice_not_heard");
      expect(types).toContain("confidentiality_breach");
      expect(types).toContain("rights_not_understood");
    });
  });
});
