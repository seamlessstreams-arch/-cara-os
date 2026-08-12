import { describe, it, expect } from "vitest";
import { _testing, type RelationshipEducationSafetyRecord } from "../relationship-education-safety-service";
import { todayStr } from "@/lib/utils";

const { computeRelationshipEducationMetrics, identifyRelationshipEducationAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<RelationshipEducationSafetyRecord>): RelationshipEducationSafetyRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    topic_area: overrides?.topic_area ?? "consent_understanding",
    understanding_level: overrides?.understanding_level ?? "good_understanding",
    engagement_quality: overrides?.engagement_quality ?? "engaged",
    age_appropriateness: overrides?.age_appropriateness ?? "appropriate",
    session_date: overrides?.session_date ?? todayStr(),
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    delivered_by: overrides?.delivered_by ?? "Staff A",
    child_consented: overrides?.child_consented ?? true,
    age_appropriate_content: overrides?.age_appropriate_content ?? true,
    safe_space_provided: overrides?.safe_space_provided ?? true,
    trigger_warnings_given: overrides?.trigger_warnings_given ?? true,
    child_led_pace: overrides?.child_led_pace ?? true,
    resources_provided: overrides?.resources_provided ?? true,
    care_plan_reflects: overrides?.care_plan_reflects ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    parent_informed: overrides?.parent_informed ?? true,
    follow_up_offered: overrides?.follow_up_offered ?? true,
    confidentiality_maintained: overrides?.confidentiality_maintained ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("relationship-education-safety-service", () => {
  describe("computeRelationshipEducationMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeRelationshipEducationMetrics([]);
      expect(m.total_sessions).toBe(0);;
      expect(m.not_understood_count).toBe(0);
      expect(m.disengaged_count).toBe(0);
      expect(m.not_appropriate_count).toBe(0);
      expect(m.harmful_count).toBe(0);
      expect(m.child_consented_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeRelationshipEducationMetrics([]);
      expect(m.by_topic_area).toEqual({});
      expect(m.by_understanding_level).toEqual({});
      expect(m.by_engagement_quality).toEqual({});
      expect(m.by_age_appropriateness).toEqual({});
    });
    it("total_sessions counts records", () => { expect(computeRelationshipEducationMetrics([makeRecord(), makeRecord()]).total_sessions).toBe(2); });
    it("counts not_understood", () => { expect(computeRelationshipEducationMetrics([makeRecord({ understanding_level: "not_understood" })]).not_understood_count).toBe(1); });
    it("does not count limited as not_understood", () => { expect(computeRelationshipEducationMetrics([makeRecord({ understanding_level: "limited" })]).not_understood_count).toBe(0); });
    it("counts disengaged", () => { expect(computeRelationshipEducationMetrics([makeRecord({ engagement_quality: "disengaged" })]).disengaged_count).toBe(1); });
    it("counts refused as disengaged", () => { expect(computeRelationshipEducationMetrics([makeRecord({ engagement_quality: "refused" })]).disengaged_count).toBe(1); });
    it("does not count partially as disengaged", () => { expect(computeRelationshipEducationMetrics([makeRecord({ engagement_quality: "partially_engaged" })]).disengaged_count).toBe(0); });
    it("counts not_appropriate", () => { expect(computeRelationshipEducationMetrics([makeRecord({ age_appropriateness: "not_appropriate" })]).not_appropriate_count).toBe(1); });
    it("counts harmful as not_appropriate", () => { expect(computeRelationshipEducationMetrics([makeRecord({ age_appropriateness: "harmful" })]).not_appropriate_count).toBe(1); });
    it("does not count somewhat as not_appropriate", () => { expect(computeRelationshipEducationMetrics([makeRecord({ age_appropriateness: "somewhat_appropriate" })]).not_appropriate_count).toBe(0); });
    it("counts harmful", () => { expect(computeRelationshipEducationMetrics([makeRecord({ age_appropriateness: "harmful" })]).harmful_count).toBe(1); });
    it("does not count not_appropriate as harmful", () => { expect(computeRelationshipEducationMetrics([makeRecord({ age_appropriateness: "not_appropriate" })]).harmful_count).toBe(0); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeRelationshipEducationMetrics([makeRecord()]);
      expect(m.child_consented_rate).toBe(100);
      expect(m.age_appropriate_content_rate).toBe(100);
      expect(m.safe_space_rate).toBe(100);
      expect(m.trigger_warnings_rate).toBe(100);
      expect(m.child_led_pace_rate).toBe(100);
      expect(m.resources_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.follow_up_rate).toBe(100);
      expect(m.confidentiality_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_consented_rate 0 when false", () => { expect(computeRelationshipEducationMetrics([makeRecord({ child_consented: false })]).child_consented_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeRelationshipEducationMetrics([makeRecord({ safe_space_provided: true }), makeRecord({ safe_space_provided: false }), makeRecord({ safe_space_provided: true })]); expect(m.safe_space_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeRelationshipEducationMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 topic areas", () => { const areas = ["consent_understanding","healthy_relationships","body_safety","online_safety","personal_boundaries","gender_identity","emotional_literacy","peer_pressure","conflict_resolution","other"] as const; const records = areas.map(a => makeRecord({ topic_area: a })); const m = computeRelationshipEducationMetrics(records); for (const a of areas) expect(m.by_topic_area[a]).toBe(1); });
    it("counts all 5 understanding levels", () => { const levels = ["confident","good_understanding","developing","limited","not_understood"] as const; const records = levels.map(l => makeRecord({ understanding_level: l })); const m = computeRelationshipEducationMetrics(records); for (const l of levels) expect(m.by_understanding_level[l]).toBe(1); });
    it("counts all 5 engagement qualities", () => { const qualities = ["highly_engaged","engaged","partially_engaged","disengaged","refused"] as const; const records = qualities.map(q => makeRecord({ engagement_quality: q })); const m = computeRelationshipEducationMetrics(records); for (const q of qualities) expect(m.by_engagement_quality[q]).toBe(1); });
    it("counts all 5 age appropriateness", () => { const levels = ["very_appropriate","appropriate","somewhat_appropriate","not_appropriate","harmful"] as const; const records = levels.map(l => makeRecord({ age_appropriateness: l })); const m = computeRelationshipEducationMetrics(records); for (const l of levels) expect(m.by_age_appropriateness[l]).toBe(1); });
  });

  describe("identifyRelationshipEducationAlerts", () => {
    it("returns empty for clean", () => { expect(identifyRelationshipEducationAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyRelationshipEducationAlerts([])).toEqual([]); });
    it("fires harmful_not_understood", () => { 
      const a = identifyRelationshipEducationAlerts([makeRecord({ age_appropriateness: "harmful", understanding_level: "not_understood", child_name: "Jo" })]);
      expect(a[0].type).toBe("harmful_not_understood");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("harmful_not_understood per-record", () => { const a = identifyRelationshipEducationAlerts([makeRecord({ id: "a-1", age_appropriateness: "harmful", understanding_level: "not_understood" }), makeRecord({ id: "a-2", age_appropriateness: "harmful", understanding_level: "not_understood" })]); expect(a.filter(x => x.type === "harmful_not_understood")).toHaveLength(2); });
    it("harmful without not_understood no critical", () => { expect(identifyRelationshipEducationAlerts([makeRecord({ age_appropriateness: "harmful", understanding_level: "confident" })]).find(x => x.type === "harmful_not_understood")).toBeUndefined(); });
    it("not_understood without harmful no critical", () => { expect(identifyRelationshipEducationAlerts([makeRecord({ understanding_level: "not_understood", age_appropriateness: "appropriate" })]).find(x => x.type === "harmful_not_understood")).toBeUndefined(); });
    it("fires no_safe_space singular", () => { 
      const a = identifyRelationshipEducationAlerts([makeRecord({ safe_space_provided: false })]);
      const f = a.find(x => x.type === "no_safe_space");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("no_safe_space plural", () => { const a = identifyRelationshipEducationAlerts([makeRecord({ safe_space_provided: false }), makeRecord({ safe_space_provided: false })]); const f = a.find(x => x.type === "no_safe_space"); expect(f!.message).toContain("2 sessions have"); });
    it("fires no_consent singular", () => { 
      const a = identifyRelationshipEducationAlerts([makeRecord({ child_consented: false })]);
      const f = a.find(x => x.type === "no_consent");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("no_trigger_warnings not for 1", () => { expect(identifyRelationshipEducationAlerts([makeRecord({ trigger_warnings_given: false })]).find(x => x.type === "no_trigger_warnings")).toBeUndefined(); });
    it("no_trigger_warnings fires for 2", () => { const a = identifyRelationshipEducationAlerts([makeRecord({ trigger_warnings_given: false }), makeRecord({ trigger_warnings_given: false })]); expect(a.find(x => x.type === "no_trigger_warnings")).toBeDefined(); expect(a.find(x => x.type === "no_trigger_warnings")!.severity).toBe("medium"); });
    it("no_confidentiality not for 1", () => { expect(identifyRelationshipEducationAlerts([makeRecord({ confidentiality_maintained: false })]).find(x => x.type === "no_confidentiality")).toBeUndefined(); });
    it("no_confidentiality fires for 2", () => { const a = identifyRelationshipEducationAlerts([makeRecord({ confidentiality_maintained: false }), makeRecord({ confidentiality_maintained: false })]); expect(a.find(x => x.type === "no_confidentiality")).toBeDefined(); expect(a.find(x => x.type === "no_confidentiality")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyRelationshipEducationAlerts([makeRecord({ age_appropriateness: "harmful", understanding_level: "not_understood", safe_space_provided: false, child_consented: false, trigger_warnings_given: false, confidentiality_maintained: false }), makeRecord({ safe_space_provided: false, child_consented: false, trigger_warnings_given: false, confidentiality_maintained: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("harmful_not_understood");
      expect(types).toContain("no_safe_space");
      expect(types).toContain("no_consent");
      expect(types).toContain("no_trigger_warnings");
      expect(types).toContain("no_confidentiality");
    });
  });
});
