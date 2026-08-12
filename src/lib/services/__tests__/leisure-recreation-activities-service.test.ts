import { describe, it, expect } from "vitest";
import { _testing, type LeisureRecreationActivitiesRecord } from "../leisure-recreation-activities-service";
import { todayStr } from "@/lib/utils";

const { computeLeisureRecreationMetrics, identifyLeisureRecreationAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<LeisureRecreationActivitiesRecord>): LeisureRecreationActivitiesRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    activity_type: overrides?.activity_type ?? "sport",
    participation_level: overrides?.participation_level ?? "enthusiastic",
    enjoyment_rating: overrides?.enjoyment_rating ?? "enjoyed",
    skill_development: overrides?.skill_development ?? "good_growth",
    activity_date: overrides?.activity_date ?? todayStr(),
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    facilitated_by: overrides?.facilitated_by ?? "Staff A",
    child_chose_activity: overrides?.child_chose_activity ?? true,
    age_appropriate: overrides?.age_appropriate ?? true,
    inclusive_access: overrides?.inclusive_access ?? true,
    peer_interaction: overrides?.peer_interaction ?? true,
    community_based: overrides?.community_based ?? true,
    new_experience: overrides?.new_experience ?? true,
    care_plan_reflects: overrides?.care_plan_reflects ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    parent_informed: overrides?.parent_informed ?? true,
    risk_assessed: overrides?.risk_assessed ?? true,
    transport_arranged: overrides?.transport_arranged ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("leisure-recreation-activities-service", () => {
  describe("computeLeisureRecreationMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeLeisureRecreationMetrics([]);
      expect(m.total_activities).toBe(0);;
      expect(m.refused_count).toBe(0);
      expect(m.disliked_count).toBe(0);
      expect(m.decline_count).toBe(0);
      expect(m.no_choice_count).toBe(0);
      expect(m.child_chose_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeLeisureRecreationMetrics([]);
      expect(m.by_activity_type).toEqual({});
      expect(m.by_participation_level).toEqual({});
      expect(m.by_enjoyment_rating).toEqual({});
      expect(m.by_skill_development).toEqual({});
    });
    it("total_activities counts records", () => { expect(computeLeisureRecreationMetrics([makeRecord(), makeRecord()]).total_activities).toBe(2); });
    it("counts refused", () => { expect(computeLeisureRecreationMetrics([makeRecord({ participation_level: "refused" })]).refused_count).toBe(1); });
    it("does not count reluctant as refused", () => { expect(computeLeisureRecreationMetrics([makeRecord({ participation_level: "reluctant" })]).refused_count).toBe(0); });
    it("counts disliked for disliked", () => { expect(computeLeisureRecreationMetrics([makeRecord({ enjoyment_rating: "disliked" })]).disliked_count).toBe(1); });
    it("counts disliked for hated", () => { expect(computeLeisureRecreationMetrics([makeRecord({ enjoyment_rating: "hated" })]).disliked_count).toBe(1); });
    it("does not count neutral as disliked", () => { expect(computeLeisureRecreationMetrics([makeRecord({ enjoyment_rating: "neutral" })]).disliked_count).toBe(0); });
    it("counts decline", () => { expect(computeLeisureRecreationMetrics([makeRecord({ skill_development: "decline" })]).decline_count).toBe(1); });
    it("counts no_choice", () => { expect(computeLeisureRecreationMetrics([makeRecord({ child_chose_activity: false })]).no_choice_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeLeisureRecreationMetrics([makeRecord()]);
      expect(m.child_chose_rate).toBe(100);
      expect(m.age_appropriate_rate).toBe(100);
      expect(m.inclusive_access_rate).toBe(100);
      expect(m.peer_interaction_rate).toBe(100);
      expect(m.community_based_rate).toBe(100);
      expect(m.new_experience_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.risk_assessed_rate).toBe(100);
      expect(m.transport_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_chose_rate 0 when false", () => { expect(computeLeisureRecreationMetrics([makeRecord({ child_chose_activity: false })]).child_chose_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeLeisureRecreationMetrics([makeRecord({ community_based: true }), makeRecord({ community_based: false }), makeRecord({ community_based: true })]); expect(m.community_based_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeLeisureRecreationMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 activity types", () => { const types = ["sport","creative_arts","music","outdoor_adventure","community_group","cultural_activity","reading_library","gaming_technology","cooking_baking","other"] as const; const records = types.map(t => makeRecord({ activity_type: t })); const m = computeLeisureRecreationMetrics(records); for (const t of types) expect(m.by_activity_type[t]).toBe(1); });
    it("counts all 5 participation levels", () => { const levels = ["enthusiastic","willing","reluctant","refused","unable"] as const; const records = levels.map(l => makeRecord({ participation_level: l })); const m = computeLeisureRecreationMetrics(records); for (const l of levels) expect(m.by_participation_level[l]).toBe(1); });
    it("counts all 5 enjoyment ratings", () => { const ratings = ["loved_it","enjoyed","neutral","disliked","hated"] as const; const records = ratings.map(r => makeRecord({ enjoyment_rating: r })); const m = computeLeisureRecreationMetrics(records); for (const r of ratings) expect(m.by_enjoyment_rating[r]).toBe(1); });
    it("counts all 5 skill developments", () => { const devs = ["significant_growth","good_growth","some_growth","no_growth","decline"] as const; const records = devs.map(d => makeRecord({ skill_development: d })); const m = computeLeisureRecreationMetrics(records); for (const d of devs) expect(m.by_skill_development[d]).toBe(1); });
  });

  describe("identifyLeisureRecreationAlerts", () => {
    it("returns empty for clean", () => { expect(identifyLeisureRecreationAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyLeisureRecreationAlerts([])).toEqual([]); });
    it("fires refused_declining", () => { 
      const a = identifyLeisureRecreationAlerts([makeRecord({ participation_level: "refused", skill_development: "decline", child_name: "Jo" })]);
      expect(a[0].type).toBe("refused_declining");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("refused_declining per-record", () => { const a = identifyLeisureRecreationAlerts([makeRecord({ id: "a-1", participation_level: "refused", skill_development: "decline" }), makeRecord({ id: "a-2", participation_level: "refused", skill_development: "decline" })]); expect(a.filter(x => x.type === "refused_declining")).toHaveLength(2); });
    it("refused without decline no critical", () => { expect(identifyLeisureRecreationAlerts([makeRecord({ participation_level: "refused", skill_development: "good_growth" })]).find(x => x.type === "refused_declining")).toBeUndefined(); });
    it("decline without refused no critical", () => { expect(identifyLeisureRecreationAlerts([makeRecord({ participation_level: "willing", skill_development: "decline" })]).find(x => x.type === "refused_declining")).toBeUndefined(); });
    it("fires no_child_choice singular", () => { 
      const a = identifyLeisureRecreationAlerts([makeRecord({ child_chose_activity: false })]);
      const f = a.find(x => x.type === "no_child_choice");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 activity has");
    });
    it("no_child_choice plural", () => { const a = identifyLeisureRecreationAlerts([makeRecord({ child_chose_activity: false }), makeRecord({ child_chose_activity: false })]); const f = a.find(x => x.type === "no_child_choice"); expect(f!.message).toContain("2 activities have"); });
    it("fires not_inclusive singular", () => { 
      const a = identifyLeisureRecreationAlerts([makeRecord({ inclusive_access: false })]);
      const f = a.find(x => x.type === "not_inclusive");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 activity has");
    });
    it("not_risk_assessed not for 1", () => { expect(identifyLeisureRecreationAlerts([makeRecord({ risk_assessed: false })]).find(x => x.type === "not_risk_assessed")).toBeUndefined(); });
    it("not_risk_assessed fires for 2", () => { const a = identifyLeisureRecreationAlerts([makeRecord({ risk_assessed: false }), makeRecord({ risk_assessed: false })]); expect(a.find(x => x.type === "not_risk_assessed")).toBeDefined(); expect(a.find(x => x.type === "not_risk_assessed")!.severity).toBe("medium"); });
    it("no_community_activities not for 1", () => { expect(identifyLeisureRecreationAlerts([makeRecord({ community_based: false })]).find(x => x.type === "no_community_activities")).toBeUndefined(); });
    it("no_community_activities fires for 2", () => { const a = identifyLeisureRecreationAlerts([makeRecord({ community_based: false }), makeRecord({ community_based: false })]); expect(a.find(x => x.type === "no_community_activities")).toBeDefined(); expect(a.find(x => x.type === "no_community_activities")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyLeisureRecreationAlerts([makeRecord({ participation_level: "refused", skill_development: "decline", child_chose_activity: false, inclusive_access: false, risk_assessed: false, community_based: false }), makeRecord({ child_chose_activity: false, inclusive_access: false, risk_assessed: false, community_based: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("refused_declining");
      expect(types).toContain("no_child_choice");
      expect(types).toContain("not_inclusive");
      expect(types).toContain("not_risk_assessed");
      expect(types).toContain("no_community_activities");
    });
  });
});
