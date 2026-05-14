import { describe, it, expect } from "vitest";
import { _testing, type PhysicalActivityTrackingRecord } from "../physical-activity-tracking-service";

const { computePhysicalActivityMetrics, identifyPhysicalActivityAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<PhysicalActivityTrackingRecord>): PhysicalActivityTrackingRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    activity_type: overrides?.activity_type ?? "team_sport",
    participation_level: overrides?.participation_level ?? "willing",
    fitness_assessment: overrides?.fitness_assessment ?? "average",
    enjoyment_rating: overrides?.enjoyment_rating ?? "enjoyed",
    activity_date: overrides?.activity_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    supervised_by: overrides?.supervised_by ?? "Staff A",
    child_choice_offered: overrides?.child_choice_offered ?? true,
    age_appropriate: overrides?.age_appropriate ?? true,
    health_needs_considered: overrides?.health_needs_considered ?? true,
    risk_assessed: overrides?.risk_assessed ?? true,
    inclusive_activity: overrides?.inclusive_activity ?? true,
    peer_interaction_positive: overrides?.peer_interaction_positive ?? true,
    equipment_suitable: overrides?.equipment_suitable ?? true,
    safeguarding_considered: overrides?.safeguarding_considered ?? true,
    achievement_celebrated: overrides?.achievement_celebrated ?? true,
    care_plan_reflects: overrides?.care_plan_reflects ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("physical-activity-tracking-service", () => {
  describe("computePhysicalActivityMetrics", () => {
    it("returns zeros for empty", () => { const m = computePhysicalActivityMetrics([]); expect(m.total_activities).toBe(0); expect(m.refused_count).toBe(0); expect(m.unable_count).toBe(0); expect(m.disliked_count).toBe(0); expect(m.below_average_count).toBe(0); expect(m.child_choice_rate).toBe(0); expect(m.unique_children).toBe(0); });
    it("returns empty breakdowns", () => { const m = computePhysicalActivityMetrics([]); expect(m.by_activity_type).toEqual({}); expect(m.by_participation_level).toEqual({}); expect(m.by_fitness_assessment).toEqual({}); expect(m.by_enjoyment_rating).toEqual({}); });
    it("total_activities counts records", () => { expect(computePhysicalActivityMetrics([makeRecord(), makeRecord()]).total_activities).toBe(2); });
    it("counts refused", () => { expect(computePhysicalActivityMetrics([makeRecord({ participation_level: "refused" })]).refused_count).toBe(1); });
    it("counts unable", () => { expect(computePhysicalActivityMetrics([makeRecord({ participation_level: "unable" })]).unable_count).toBe(1); });
    it("does not count reluctant as refused", () => { expect(computePhysicalActivityMetrics([makeRecord({ participation_level: "reluctant" })]).refused_count).toBe(0); });
    it("counts disliked", () => { expect(computePhysicalActivityMetrics([makeRecord({ enjoyment_rating: "disliked" })]).disliked_count).toBe(1); });
    it("counts below_average", () => { expect(computePhysicalActivityMetrics([makeRecord({ fitness_assessment: "below_average" })]).below_average_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { const m = computePhysicalActivityMetrics([makeRecord()]); expect(m.child_choice_rate).toBe(100); expect(m.age_appropriate_rate).toBe(100); expect(m.health_needs_rate).toBe(100); expect(m.risk_assessed_rate).toBe(100); expect(m.inclusive_rate).toBe(100); expect(m.peer_interaction_rate).toBe(100); expect(m.equipment_rate).toBe(100); expect(m.safeguarding_rate).toBe(100); expect(m.achievement_rate).toBe(100); expect(m.care_plan_rate).toBe(100); expect(m.social_worker_rate).toBe(100); expect(m.recorded_promptly_rate).toBe(100); });
    it("child_choice_rate 0 when false", () => { expect(computePhysicalActivityMetrics([makeRecord({ child_choice_offered: false })]).child_choice_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computePhysicalActivityMetrics([makeRecord({ risk_assessed: true }), makeRecord({ risk_assessed: false }), makeRecord({ risk_assessed: true })]); expect(m.risk_assessed_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computePhysicalActivityMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 activity types", () => { const types = ["team_sport","individual_sport","swimming","gym_fitness","dance","martial_arts","outdoor_adventure","walking_cycling","playground","other"] as const; const records = types.map(t => makeRecord({ activity_type: t })); const m = computePhysicalActivityMetrics(records); for (const t of types) expect(m.by_activity_type[t]).toBe(1); });
    it("counts all 5 participation levels", () => { const levels = ["enthusiastic","willing","reluctant","refused","unable"] as const; const records = levels.map(l => makeRecord({ participation_level: l })); const m = computePhysicalActivityMetrics(records); for (const l of levels) expect(m.by_participation_level[l]).toBe(1); });
    it("counts all 5 fitness assessments", () => { const assessments = ["excellent","good","average","below_average","not_assessed"] as const; const records = assessments.map(a => makeRecord({ fitness_assessment: a })); const m = computePhysicalActivityMetrics(records); for (const a of assessments) expect(m.by_fitness_assessment[a]).toBe(1); });
    it("counts all 5 enjoyment ratings", () => { const ratings = ["loved_it","enjoyed","neutral","disliked","refused_to_rate"] as const; const records = ratings.map(r => makeRecord({ enjoyment_rating: r })); const m = computePhysicalActivityMetrics(records); for (const r of ratings) expect(m.by_enjoyment_rating[r]).toBe(1); });
  });

  describe("identifyPhysicalActivityAlerts", () => {
    it("returns empty for clean", () => { expect(identifyPhysicalActivityAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyPhysicalActivityAlerts([])).toEqual([]); });
    it("fires refused_no_health_check", () => { const a = identifyPhysicalActivityAlerts([makeRecord({ participation_level: "refused", health_needs_considered: false, child_name: "Jo" })]); expect(a[0].type).toBe("refused_no_health_check"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Jo"); });
    it("refused_no_health_check per-record", () => { const a = identifyPhysicalActivityAlerts([makeRecord({ id: "a-1", participation_level: "refused", health_needs_considered: false }), makeRecord({ id: "a-2", participation_level: "refused", health_needs_considered: false })]); expect(a.filter(x => x.type === "refused_no_health_check")).toHaveLength(2); });
    it("refused with health considered no critical", () => { expect(identifyPhysicalActivityAlerts([makeRecord({ participation_level: "refused", health_needs_considered: true })]).find(x => x.type === "refused_no_health_check")).toBeUndefined(); });
    it("willing no health considered no critical", () => { expect(identifyPhysicalActivityAlerts([makeRecord({ participation_level: "willing", health_needs_considered: false })]).find(x => x.type === "refused_no_health_check")).toBeUndefined(); });
    it("fires no_child_choice singular", () => { const a = identifyPhysicalActivityAlerts([makeRecord({ child_choice_offered: false })]); const f = a.find(x => x.type === "no_child_choice"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 activity has"); });
    it("no_child_choice plural", () => { const a = identifyPhysicalActivityAlerts([makeRecord({ child_choice_offered: false }), makeRecord({ child_choice_offered: false })]); const f = a.find(x => x.type === "no_child_choice"); expect(f!.message).toContain("2 activities have"); });
    it("fires risk_not_assessed singular", () => { const a = identifyPhysicalActivityAlerts([makeRecord({ risk_assessed: false })]); const f = a.find(x => x.type === "risk_not_assessed"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 activity has"); });
    it("achievement_not_celebrated not for 1", () => { expect(identifyPhysicalActivityAlerts([makeRecord({ achievement_celebrated: false })]).find(x => x.type === "achievement_not_celebrated")).toBeUndefined(); });
    it("achievement_not_celebrated fires for 2", () => { const a = identifyPhysicalActivityAlerts([makeRecord({ achievement_celebrated: false }), makeRecord({ achievement_celebrated: false })]); expect(a.find(x => x.type === "achievement_not_celebrated")).toBeDefined(); expect(a.find(x => x.type === "achievement_not_celebrated")!.severity).toBe("medium"); });
    it("not_inclusive not for 1", () => { expect(identifyPhysicalActivityAlerts([makeRecord({ inclusive_activity: false })]).find(x => x.type === "not_inclusive")).toBeUndefined(); });
    it("not_inclusive fires for 2", () => { const a = identifyPhysicalActivityAlerts([makeRecord({ inclusive_activity: false }), makeRecord({ inclusive_activity: false })]); expect(a.find(x => x.type === "not_inclusive")).toBeDefined(); expect(a.find(x => x.type === "not_inclusive")!.severity).toBe("medium"); });
    it("fires all applicable", () => { const a = identifyPhysicalActivityAlerts([makeRecord({ participation_level: "refused", health_needs_considered: false, child_choice_offered: false, risk_assessed: false, achievement_celebrated: false, inclusive_activity: false }), makeRecord({ child_choice_offered: false, risk_assessed: false, achievement_celebrated: false, inclusive_activity: false })]); const types = a.map(x => x.type); expect(types).toContain("refused_no_health_check"); expect(types).toContain("no_child_choice"); expect(types).toContain("risk_not_assessed"); expect(types).toContain("achievement_not_celebrated"); expect(types).toContain("not_inclusive"); });
  });
});
