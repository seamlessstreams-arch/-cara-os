import { describe, it, expect } from "vitest";
import { _testing, type PositiveBehaviourReinforcementRecord } from "../positive-behaviour-reinforcement-service";
import { todayStr } from "@/lib/utils";

const { computePositiveBehaviourMetrics, identifyPositiveBehaviourAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<PositiveBehaviourReinforcementRecord>): PositiveBehaviourReinforcementRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    reinforcement_type: overrides?.reinforcement_type ?? "verbal_praise",
    praise_quality: overrides?.praise_quality ?? "specific_genuine",
    child_response: overrides?.child_response ?? "positive",
    consistency_level: overrides?.consistency_level ?? "consistent",
    session_date: overrides?.session_date ?? todayStr(),
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    supported_by: overrides?.supported_by ?? "Staff A",
    behaviour_specific: overrides?.behaviour_specific ?? true,
    age_appropriate: overrides?.age_appropriate ?? true,
    culturally_sensitive: overrides?.culturally_sensitive ?? true,
    timely_delivery: overrides?.timely_delivery ?? true,
    proportionate_response: overrides?.proportionate_response ?? true,
    care_plan_reflects: overrides?.care_plan_reflects ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    parent_informed: overrides?.parent_informed ?? true,
    peers_included: overrides?.peers_included ?? true,
    child_input_sought: overrides?.child_input_sought ?? true,
    progress_tracked: overrides?.progress_tracked ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("positive-behaviour-reinforcement-service", () => {
  describe("computePositiveBehaviourMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computePositiveBehaviourMetrics([]);
      expect(m.total_sessions).toBe(0);;
      expect(m.absent_praise_count).toBe(0);
      expect(m.negative_response_count).toBe(0);
      expect(m.inconsistent_count).toBe(0);
      expect(m.indifferent_count).toBe(0);
      expect(m.behaviour_specific_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computePositiveBehaviourMetrics([]);
      expect(m.by_reinforcement_type).toEqual({});
      expect(m.by_praise_quality).toEqual({});
      expect(m.by_child_response).toEqual({});
      expect(m.by_consistency_level).toEqual({});
    });
    it("total_sessions counts records", () => { expect(computePositiveBehaviourMetrics([makeRecord(), makeRecord()]).total_sessions).toBe(2); });
    it("counts absent_praise", () => { expect(computePositiveBehaviourMetrics([makeRecord({ praise_quality: "absent" })]).absent_praise_count).toBe(1); });
    it("does not count inconsistent as absent", () => { expect(computePositiveBehaviourMetrics([makeRecord({ praise_quality: "inconsistent" })]).absent_praise_count).toBe(0); });
    it("counts negative_response", () => { expect(computePositiveBehaviourMetrics([makeRecord({ child_response: "negative" })]).negative_response_count).toBe(1); });
    it("does not count indifferent as negative", () => { expect(computePositiveBehaviourMetrics([makeRecord({ child_response: "indifferent" })]).negative_response_count).toBe(0); });
    it("counts inconsistent", () => { expect(computePositiveBehaviourMetrics([makeRecord({ consistency_level: "inconsistent" })]).inconsistent_count).toBe(1); });
    it("counts absent as inconsistent", () => { expect(computePositiveBehaviourMetrics([makeRecord({ consistency_level: "absent" })]).inconsistent_count).toBe(1); });
    it("does not count variable as inconsistent", () => { expect(computePositiveBehaviourMetrics([makeRecord({ consistency_level: "variable" })]).inconsistent_count).toBe(0); });
    it("counts indifferent", () => { expect(computePositiveBehaviourMetrics([makeRecord({ child_response: "indifferent" })]).indifferent_count).toBe(1); });
    it("counts negative as indifferent", () => { expect(computePositiveBehaviourMetrics([makeRecord({ child_response: "negative" })]).indifferent_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computePositiveBehaviourMetrics([makeRecord()]);
      expect(m.behaviour_specific_rate).toBe(100);
      expect(m.age_appropriate_rate).toBe(100);
      expect(m.culturally_sensitive_rate).toBe(100);
      expect(m.timely_delivery_rate).toBe(100);
      expect(m.proportionate_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.peers_included_rate).toBe(100);
      expect(m.child_input_rate).toBe(100);
      expect(m.progress_tracked_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("behaviour_specific_rate 0 when false", () => { expect(computePositiveBehaviourMetrics([makeRecord({ behaviour_specific: false })]).behaviour_specific_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computePositiveBehaviourMetrics([makeRecord({ timely_delivery: true }), makeRecord({ timely_delivery: false }), makeRecord({ timely_delivery: true })]); expect(m.timely_delivery_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computePositiveBehaviourMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 reinforcement types", () => { const types = ["verbal_praise","written_recognition","reward_chart","special_privilege","activity_reward","token_economy","peer_recognition","certificate_award","family_celebration","other"] as const; const records = types.map(t => makeRecord({ reinforcement_type: t })); const m = computePositiveBehaviourMetrics(records); for (const t of types) expect(m.by_reinforcement_type[t]).toBe(1); });
    it("counts all 5 praise qualities", () => { const qualities = ["specific_genuine","appropriate","generic","inconsistent","absent"] as const; const records = qualities.map(q => makeRecord({ praise_quality: q })); const m = computePositiveBehaviourMetrics(records); for (const q of qualities) expect(m.by_praise_quality[q]).toBe(1); });
    it("counts all 5 child responses", () => { const responses = ["very_positive","positive","neutral","indifferent","negative"] as const; const records = responses.map(r => makeRecord({ child_response: r })); const m = computePositiveBehaviourMetrics(records); for (const r of responses) expect(m.by_child_response[r]).toBe(1); });
    it("counts all 5 consistency levels", () => { const levels = ["highly_consistent","consistent","variable","inconsistent","absent"] as const; const records = levels.map(l => makeRecord({ consistency_level: l })); const m = computePositiveBehaviourMetrics(records); for (const l of levels) expect(m.by_consistency_level[l]).toBe(1); });
  });

  describe("identifyPositiveBehaviourAlerts", () => {
    it("returns empty for clean", () => { expect(identifyPositiveBehaviourAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyPositiveBehaviourAlerts([])).toEqual([]); });
    it("fires absent_negative", () => { 
      const a = identifyPositiveBehaviourAlerts([makeRecord({ praise_quality: "absent", child_response: "negative", child_name: "Jo" })]);
      expect(a[0].type).toBe("absent_negative");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("absent_negative per-record", () => { const a = identifyPositiveBehaviourAlerts([makeRecord({ id: "a-1", praise_quality: "absent", child_response: "negative" }), makeRecord({ id: "a-2", praise_quality: "absent", child_response: "negative" })]); expect(a.filter(x => x.type === "absent_negative")).toHaveLength(2); });
    it("absent without negative no critical", () => { expect(identifyPositiveBehaviourAlerts([makeRecord({ praise_quality: "absent", child_response: "positive" })]).find(x => x.type === "absent_negative")).toBeUndefined(); });
    it("negative without absent no critical", () => { expect(identifyPositiveBehaviourAlerts([makeRecord({ child_response: "negative", praise_quality: "appropriate" })]).find(x => x.type === "absent_negative")).toBeUndefined(); });
    it("fires not_behaviour_specific singular", () => { 
      const a = identifyPositiveBehaviourAlerts([makeRecord({ behaviour_specific: false })]);
      const f = a.find(x => x.type === "not_behaviour_specific");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("not_behaviour_specific plural", () => { const a = identifyPositiveBehaviourAlerts([makeRecord({ behaviour_specific: false }), makeRecord({ behaviour_specific: false })]); const f = a.find(x => x.type === "not_behaviour_specific"); expect(f!.message).toContain("2 sessions have"); });
    it("fires not_timely singular", () => { 
      const a = identifyPositiveBehaviourAlerts([makeRecord({ timely_delivery: false })]);
      const f = a.find(x => x.type === "not_timely");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("no_child_input not for 1", () => { expect(identifyPositiveBehaviourAlerts([makeRecord({ child_input_sought: false })]).find(x => x.type === "no_child_input")).toBeUndefined(); });
    it("no_child_input fires for 2", () => { const a = identifyPositiveBehaviourAlerts([makeRecord({ child_input_sought: false }), makeRecord({ child_input_sought: false })]); expect(a.find(x => x.type === "no_child_input")).toBeDefined(); expect(a.find(x => x.type === "no_child_input")!.severity).toBe("medium"); });
    it("not_culturally_sensitive not for 1", () => { expect(identifyPositiveBehaviourAlerts([makeRecord({ culturally_sensitive: false })]).find(x => x.type === "not_culturally_sensitive")).toBeUndefined(); });
    it("not_culturally_sensitive fires for 2", () => { const a = identifyPositiveBehaviourAlerts([makeRecord({ culturally_sensitive: false }), makeRecord({ culturally_sensitive: false })]); expect(a.find(x => x.type === "not_culturally_sensitive")).toBeDefined(); expect(a.find(x => x.type === "not_culturally_sensitive")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyPositiveBehaviourAlerts([makeRecord({ praise_quality: "absent", child_response: "negative", behaviour_specific: false, timely_delivery: false, child_input_sought: false, culturally_sensitive: false }), makeRecord({ behaviour_specific: false, timely_delivery: false, child_input_sought: false, culturally_sensitive: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("absent_negative");
      expect(types).toContain("not_behaviour_specific");
      expect(types).toContain("not_timely");
      expect(types).toContain("no_child_input");
      expect(types).toContain("not_culturally_sensitive");
    });
  });
});
