import { describe, it, expect } from "vitest";
import { _testing, type CreativeEnrichmentActivitiesRecord } from "../creative-enrichment-activities-service";

const { computeCreativeEnrichmentMetrics, identifyCreativeEnrichmentAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<CreativeEnrichmentActivitiesRecord>): CreativeEnrichmentActivitiesRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    activity_type: overrides?.activity_type ?? "art_drawing",
    engagement_level: overrides?.engagement_level ?? "engaged",
    skill_development: overrides?.skill_development ?? "some_progress",
    creative_output: overrides?.creative_output ?? "work_in_progress",
    activity_date: overrides?.activity_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    facilitated_by: overrides?.facilitated_by ?? "Staff A",
    child_choice_offered: overrides?.child_choice_offered ?? true,
    age_appropriate: overrides?.age_appropriate ?? true,
    therapeutic_value: overrides?.therapeutic_value ?? true,
    peer_interaction: overrides?.peer_interaction ?? true,
    self_expression_supported: overrides?.self_expression_supported ?? true,
    achievement_recognised: overrides?.achievement_recognised ?? true,
    resources_available: overrides?.resources_available ?? true,
    care_plan_reflects: overrides?.care_plan_reflects ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    family_updated: overrides?.family_updated ?? true,
    continuation_planned: overrides?.continuation_planned ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("creative-enrichment-activities-service", () => {
  describe("computeCreativeEnrichmentMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeCreativeEnrichmentMetrics([]);
      expect(m.total_activities).toBe(0);;
      expect(m.refused_count).toBe(0);
      expect(m.reluctant_count).toBe(0);
      expect(m.no_progress_count).toBe(0);
      expect(m.no_output_count).toBe(0);
      expect(m.child_choice_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeCreativeEnrichmentMetrics([]);
      expect(m.by_activity_type).toEqual({});
      expect(m.by_engagement_level).toEqual({});
      expect(m.by_skill_development).toEqual({});
      expect(m.by_creative_output).toEqual({});
    });
    it("total_activities counts records", () => { expect(computeCreativeEnrichmentMetrics([makeRecord(), makeRecord()]).total_activities).toBe(2); });
    it("counts refused", () => { expect(computeCreativeEnrichmentMetrics([makeRecord({ engagement_level: "refused" })]).refused_count).toBe(1); });
    it("counts reluctant", () => { expect(computeCreativeEnrichmentMetrics([makeRecord({ engagement_level: "reluctant" })]).reluctant_count).toBe(1); });
    it("does not count participating as refused", () => { expect(computeCreativeEnrichmentMetrics([makeRecord({ engagement_level: "participating" })]).refused_count).toBe(0); });
    it("counts no_progress", () => { expect(computeCreativeEnrichmentMetrics([makeRecord({ skill_development: "no_progress" })]).no_progress_count).toBe(1); });
    it("counts no_output", () => { expect(computeCreativeEnrichmentMetrics([makeRecord({ creative_output: "no_output" })]).no_output_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeCreativeEnrichmentMetrics([makeRecord()]);
      expect(m.child_choice_rate).toBe(100);
      expect(m.age_appropriate_rate).toBe(100);
      expect(m.therapeutic_value_rate).toBe(100);
      expect(m.peer_interaction_rate).toBe(100);
      expect(m.self_expression_rate).toBe(100);
      expect(m.achievement_rate).toBe(100);
      expect(m.resources_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.family_updated_rate).toBe(100);
      expect(m.continuation_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_choice_rate 0 when false", () => { expect(computeCreativeEnrichmentMetrics([makeRecord({ child_choice_offered: false })]).child_choice_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeCreativeEnrichmentMetrics([makeRecord({ achievement_recognised: true }), makeRecord({ achievement_recognised: false }), makeRecord({ achievement_recognised: true })]); expect(m.achievement_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeCreativeEnrichmentMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 activity types", () => { const types = ["art_drawing","music_instrument","singing_choir","drama_theatre","dance_movement","creative_writing","photography","cooking_baking","crafts_making","other"] as const; const records = types.map(t => makeRecord({ activity_type: t })); const m = computeCreativeEnrichmentMetrics(records); for (const t of types) expect(m.by_activity_type[t]).toBe(1); });
    it("counts all 5 engagement levels", () => { const levels = ["deeply_engaged","engaged","participating","reluctant","refused"] as const; const records = levels.map(l => makeRecord({ engagement_level: l })); const m = computeCreativeEnrichmentMetrics(records); for (const l of levels) expect(m.by_engagement_level[l]).toBe(1); });
    it("counts all 5 skill developments", () => { const developments = ["significant_progress","good_progress","some_progress","no_progress","not_assessed"] as const; const records = developments.map(d => makeRecord({ skill_development: d })); const m = computeCreativeEnrichmentMetrics(records); for (const d of developments) expect(m.by_skill_development[d]).toBe(1); });
    it("counts all 5 creative outputs", () => { const outputs = ["exhibited_shared","completed_piece","work_in_progress","exploratory","no_output"] as const; const records = outputs.map(o => makeRecord({ creative_output: o })); const m = computeCreativeEnrichmentMetrics(records); for (const o of outputs) expect(m.by_creative_output[o]).toBe(1); });
  });

  describe("identifyCreativeEnrichmentAlerts", () => {
    it("returns empty for clean", () => { expect(identifyCreativeEnrichmentAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyCreativeEnrichmentAlerts([])).toEqual([]); });
    it("fires refused_no_expression", () => { 
      const a = identifyCreativeEnrichmentAlerts([makeRecord({ engagement_level: "refused", self_expression_supported: false, child_name: "Jo" })]);
      expect(a[0].type).toBe("refused_no_expression");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("refused_no_expression per-record", () => { const a = identifyCreativeEnrichmentAlerts([makeRecord({ id: "a-1", engagement_level: "refused", self_expression_supported: false }), makeRecord({ id: "a-2", engagement_level: "refused", self_expression_supported: false })]); expect(a.filter(x => x.type === "refused_no_expression")).toHaveLength(2); });
    it("refused with expression no critical", () => { expect(identifyCreativeEnrichmentAlerts([makeRecord({ engagement_level: "refused", self_expression_supported: true })]).find(x => x.type === "refused_no_expression")).toBeUndefined(); });
    it("engaged no expression no critical", () => { expect(identifyCreativeEnrichmentAlerts([makeRecord({ engagement_level: "engaged", self_expression_supported: false })]).find(x => x.type === "refused_no_expression")).toBeUndefined(); });
    it("fires achievement_not_recognised singular", () => { 
      const a = identifyCreativeEnrichmentAlerts([makeRecord({ achievement_recognised: false })]);
      const f = a.find(x => x.type === "achievement_not_recognised");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 activity has");
    });
    it("achievement_not_recognised plural", () => { const a = identifyCreativeEnrichmentAlerts([makeRecord({ achievement_recognised: false }), makeRecord({ achievement_recognised: false })]); const f = a.find(x => x.type === "achievement_not_recognised"); expect(f!.message).toContain("2 activities have"); });
    it("fires no_child_choice singular", () => { 
      const a = identifyCreativeEnrichmentAlerts([makeRecord({ child_choice_offered: false })]);
      const f = a.find(x => x.type === "no_child_choice");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 activity has");
    });
    it("continuation_not_planned not for 1", () => { expect(identifyCreativeEnrichmentAlerts([makeRecord({ continuation_planned: false })]).find(x => x.type === "continuation_not_planned")).toBeUndefined(); });
    it("continuation_not_planned fires for 2", () => { const a = identifyCreativeEnrichmentAlerts([makeRecord({ continuation_planned: false }), makeRecord({ continuation_planned: false })]); expect(a.find(x => x.type === "continuation_not_planned")).toBeDefined(); expect(a.find(x => x.type === "continuation_not_planned")!.severity).toBe("medium"); });
    it("resources_not_available not for 1", () => { expect(identifyCreativeEnrichmentAlerts([makeRecord({ resources_available: false })]).find(x => x.type === "resources_not_available")).toBeUndefined(); });
    it("resources_not_available fires for 2", () => { const a = identifyCreativeEnrichmentAlerts([makeRecord({ resources_available: false }), makeRecord({ resources_available: false })]); expect(a.find(x => x.type === "resources_not_available")).toBeDefined(); expect(a.find(x => x.type === "resources_not_available")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyCreativeEnrichmentAlerts([makeRecord({ engagement_level: "refused", self_expression_supported: false, achievement_recognised: false, child_choice_offered: false, continuation_planned: false, resources_available: false }), makeRecord({ achievement_recognised: false, child_choice_offered: false, continuation_planned: false, resources_available: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("refused_no_expression");
      expect(types).toContain("achievement_not_recognised");
      expect(types).toContain("no_child_choice");
      expect(types).toContain("continuation_not_planned");
      expect(types).toContain("resources_not_available");
    });
  });
});
