import { describe, it, expect } from "vitest";
import { _testing, type SelfEsteemConfidenceBuildingRecord } from "../self-esteem-confidence-building-service";
import { todayStr } from "@/lib/utils";

const { computeSelfEsteemMetrics, identifySelfEsteemAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<SelfEsteemConfidenceBuildingRecord>): SelfEsteemConfidenceBuildingRecord {
  return {
    id: "a-1", home_id: "home-1",
    intervention_type: "one_to_one_session",
    confidence_level: "confident",
    progress_assessment: "some_improvement",
    self_image_rating: "positive",
    session_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    supported_by: "Staff A",
    child_led_activity: true,
    strengths_identified: true,
    goals_set: true,
    achievements_celebrated: true,
    safe_space_provided: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    peers_supportive: true,
    culturally_affirming: true,
    progress_shared: true,
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

describe("self-esteem-confidence-building-service", () => {
  describe("computeSelfEsteemMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeSelfEsteemMetrics([]);
      expect(m.total_sessions).toBe(0);;
      expect(m.very_low_count).toBe(0);
      expect(m.decline_count).toBe(0);
      expect(m.negative_image_count).toBe(0);
      expect(m.significant_decline_count).toBe(0);
      expect(m.child_led_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeSelfEsteemMetrics([]);
      expect(m.by_intervention_type).toEqual({});
      expect(m.by_confidence_level).toEqual({});
      expect(m.by_progress_assessment).toEqual({});
      expect(m.by_self_image_rating).toEqual({});
    });
    it("total_sessions counts records", () => { expect(computeSelfEsteemMetrics([makeRecord(), makeRecord()]).total_sessions).toBe(2); });
    it("counts very_low", () => { expect(computeSelfEsteemMetrics([makeRecord({ confidence_level: "very_low" })]).very_low_count).toBe(1); });
    it("does not count low_confidence as very_low", () => { expect(computeSelfEsteemMetrics([makeRecord({ confidence_level: "low_confidence" })]).very_low_count).toBe(0); });
    it("counts slight_decline as decline", () => { expect(computeSelfEsteemMetrics([makeRecord({ progress_assessment: "slight_decline" })]).decline_count).toBe(1); });
    it("counts significant_decline as decline", () => { expect(computeSelfEsteemMetrics([makeRecord({ progress_assessment: "significant_decline" })]).decline_count).toBe(1); });
    it("does not count maintained as decline", () => { expect(computeSelfEsteemMetrics([makeRecord({ progress_assessment: "maintained" })]).decline_count).toBe(0); });
    it("counts negative as negative_image", () => { expect(computeSelfEsteemMetrics([makeRecord({ self_image_rating: "negative" })]).negative_image_count).toBe(1); });
    it("counts very_negative as negative_image", () => { expect(computeSelfEsteemMetrics([makeRecord({ self_image_rating: "very_negative" })]).negative_image_count).toBe(1); });
    it("does not count neutral as negative_image", () => { expect(computeSelfEsteemMetrics([makeRecord({ self_image_rating: "neutral" })]).negative_image_count).toBe(0); });
    it("counts significant_decline", () => { expect(computeSelfEsteemMetrics([makeRecord({ progress_assessment: "significant_decline" })]).significant_decline_count).toBe(1); });
    it("does not count slight as significant_decline", () => { expect(computeSelfEsteemMetrics([makeRecord({ progress_assessment: "slight_decline" })]).significant_decline_count).toBe(0); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeSelfEsteemMetrics([makeRecord()]);
      expect(m.child_led_rate).toBe(100);
      expect(m.strengths_identified_rate).toBe(100);
      expect(m.goals_set_rate).toBe(100);
      expect(m.achievements_celebrated_rate).toBe(100);
      expect(m.safe_space_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.peers_supportive_rate).toBe(100);
      expect(m.culturally_affirming_rate).toBe(100);
      expect(m.progress_shared_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_led_rate 0 when false", () => { expect(computeSelfEsteemMetrics([makeRecord({ child_led_activity: false })]).child_led_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeSelfEsteemMetrics([makeRecord({ strengths_identified: true }), makeRecord({ strengths_identified: false }), makeRecord({ strengths_identified: true })]); expect(m.strengths_identified_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeSelfEsteemMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 intervention types", () => { const types = ["one_to_one_session","group_activity","achievement_recognition","skill_building","peer_support","creative_expression","physical_activity","therapeutic_support","role_modelling","other"] as const; const records = types.map(t => makeRecord({ intervention_type: t })); const m = computeSelfEsteemMetrics(records); for (const t of types) expect(m.by_intervention_type[t]).toBe(1); });
    it("counts all 5 confidence levels", () => { const levels = ["very_confident","confident","developing","low_confidence","very_low"] as const; const records = levels.map(l => makeRecord({ confidence_level: l })); const m = computeSelfEsteemMetrics(records); for (const l of levels) expect(m.by_confidence_level[l]).toBe(1); });
    it("counts all 5 progress assessments", () => { const assessments = ["significant_improvement","some_improvement","maintained","slight_decline","significant_decline"] as const; const records = assessments.map(a => makeRecord({ progress_assessment: a })); const m = computeSelfEsteemMetrics(records); for (const a of assessments) expect(m.by_progress_assessment[a]).toBe(1); });
    it("counts all 5 self-image ratings", () => { const ratings = ["very_positive","positive","neutral","negative","very_negative"] as const; const records = ratings.map(r => makeRecord({ self_image_rating: r })); const m = computeSelfEsteemMetrics(records); for (const r of ratings) expect(m.by_self_image_rating[r]).toBe(1); });
  });

  describe("identifySelfEsteemAlerts", () => {
    it("returns empty for clean", () => { expect(identifySelfEsteemAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifySelfEsteemAlerts([])).toEqual([]); });
    it("fires very_low_declining", () => { 
      const a = identifySelfEsteemAlerts([makeRecord({ confidence_level: "very_low", progress_assessment: "significant_decline", child_name: "Jo" })]);
      expect(a[0].type).toBe("very_low_declining");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("very_low_declining per-record", () => { const a = identifySelfEsteemAlerts([makeRecord({ id: "a-1", confidence_level: "very_low", progress_assessment: "significant_decline" }), makeRecord({ id: "a-2", confidence_level: "very_low", progress_assessment: "significant_decline" })]); expect(a.filter(x => x.type === "very_low_declining")).toHaveLength(2); });
    it("very_low without significant_decline no critical", () => { expect(identifySelfEsteemAlerts([makeRecord({ confidence_level: "very_low", progress_assessment: "some_improvement" })]).find(x => x.type === "very_low_declining")).toBeUndefined(); });
    it("significant_decline without very_low no critical", () => { expect(identifySelfEsteemAlerts([makeRecord({ progress_assessment: "significant_decline", confidence_level: "confident" })]).find(x => x.type === "very_low_declining")).toBeUndefined(); });
    it("fires no_strengths_identified singular", () => { 
      const a = identifySelfEsteemAlerts([makeRecord({ strengths_identified: false })]);
      const f = a.find(x => x.type === "no_strengths_identified");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("no_strengths_identified plural", () => { const a = identifySelfEsteemAlerts([makeRecord({ strengths_identified: false }), makeRecord({ strengths_identified: false })]); const f = a.find(x => x.type === "no_strengths_identified"); expect(f!.message).toContain("2 sessions have"); });
    it("fires not_child_led singular", () => { 
      const a = identifySelfEsteemAlerts([makeRecord({ child_led_activity: false })]);
      const f = a.find(x => x.type === "not_child_led");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session is");
    });
    it("not_child_led plural", () => { const a = identifySelfEsteemAlerts([makeRecord({ child_led_activity: false }), makeRecord({ child_led_activity: false })]); const f = a.find(x => x.type === "not_child_led"); expect(f!.message).toContain("2 sessions are"); });
    it("no_safe_space not for 1", () => { expect(identifySelfEsteemAlerts([makeRecord({ safe_space_provided: false })]).find(x => x.type === "no_safe_space")).toBeUndefined(); });
    it("no_safe_space fires for 2", () => { const a = identifySelfEsteemAlerts([makeRecord({ safe_space_provided: false }), makeRecord({ safe_space_provided: false })]); expect(a.find(x => x.type === "no_safe_space")).toBeDefined(); expect(a.find(x => x.type === "no_safe_space")!.severity).toBe("medium"); });
    it("not_culturally_affirming not for 1", () => { expect(identifySelfEsteemAlerts([makeRecord({ culturally_affirming: false })]).find(x => x.type === "not_culturally_affirming")).toBeUndefined(); });
    it("not_culturally_affirming fires for 2", () => { const a = identifySelfEsteemAlerts([makeRecord({ culturally_affirming: false }), makeRecord({ culturally_affirming: false })]); expect(a.find(x => x.type === "not_culturally_affirming")).toBeDefined(); expect(a.find(x => x.type === "not_culturally_affirming")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifySelfEsteemAlerts([makeRecord({ confidence_level: "very_low", progress_assessment: "significant_decline", strengths_identified: false, child_led_activity: false, safe_space_provided: false, culturally_affirming: false }), makeRecord({ strengths_identified: false, child_led_activity: false, safe_space_provided: false, culturally_affirming: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("very_low_declining");
      expect(types).toContain("no_strengths_identified");
      expect(types).toContain("not_child_led");
      expect(types).toContain("no_safe_space");
      expect(types).toContain("not_culturally_affirming");
    });
  });
});
