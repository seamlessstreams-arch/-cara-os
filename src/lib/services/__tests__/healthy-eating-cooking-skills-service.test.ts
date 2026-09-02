import { describe, it, expect } from "vitest";
import { _testing, type HealthyEatingCookingSkillsRecord } from "../healthy-eating-cooking-skills-service";
import { todayStr } from "@/lib/utils";

const { computeHealthyEatingMetrics, identifyHealthyEatingAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<HealthyEatingCookingSkillsRecord>): HealthyEatingCookingSkillsRecord {
  return {
    id: "a-1", home_id: "home-1",
    session_type: "meal_preparation",
    skill_level: "competent",
    engagement_level: "engaged",
    health_outcome: "some_improvement",
    session_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    supported_by: "Staff A",
    age_appropriate: true,
    food_hygiene_followed: true,
    child_chose_recipe: true,
    dietary_needs_met: true,
    allergy_awareness: true,
    kitchen_safety_followed: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    healthy_options_promoted: true,
    skills_transferable: true,
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

describe("healthy-eating-cooking-skills-service", () => {
  describe("computeHealthyEatingMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeHealthyEatingMetrics([]);
      expect(m.total_sessions).toBe(0);;
      expect(m.not_started_count).toBe(0);
      expect(m.disengaged_count).toBe(0);
      expect(m.declined_count).toBe(0);
      expect(m.refused_count).toBe(0);
      expect(m.age_appropriate_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeHealthyEatingMetrics([]);
      expect(m.by_session_type).toEqual({});
      expect(m.by_skill_level).toEqual({});
      expect(m.by_engagement_level).toEqual({});
      expect(m.by_health_outcome).toEqual({});
    });
    it("total_sessions counts records", () => { expect(computeHealthyEatingMetrics([makeRecord(), makeRecord()]).total_sessions).toBe(2); });
    it("counts not_started", () => { expect(computeHealthyEatingMetrics([makeRecord({ skill_level: "not_started" })]).not_started_count).toBe(1); });
    it("does not count basic as not_started", () => { expect(computeHealthyEatingMetrics([makeRecord({ skill_level: "basic" })]).not_started_count).toBe(0); });
    it("counts disengaged", () => { expect(computeHealthyEatingMetrics([makeRecord({ engagement_level: "disengaged" })]).disengaged_count).toBe(1); });
    it("counts refused as disengaged", () => { expect(computeHealthyEatingMetrics([makeRecord({ engagement_level: "refused" })]).disengaged_count).toBe(1); });
    it("does not count partially as disengaged", () => { expect(computeHealthyEatingMetrics([makeRecord({ engagement_level: "partially_engaged" })]).disengaged_count).toBe(0); });
    it("counts slight_decline as declined", () => { expect(computeHealthyEatingMetrics([makeRecord({ health_outcome: "slight_decline" })]).declined_count).toBe(1); });
    it("counts declined as declined", () => { expect(computeHealthyEatingMetrics([makeRecord({ health_outcome: "declined" })]).declined_count).toBe(1); });
    it("does not count maintained as declined", () => { expect(computeHealthyEatingMetrics([makeRecord({ health_outcome: "maintained" })]).declined_count).toBe(0); });
    it("counts refused", () => { expect(computeHealthyEatingMetrics([makeRecord({ engagement_level: "refused" })]).refused_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeHealthyEatingMetrics([makeRecord()]);
      expect(m.age_appropriate_rate).toBe(100);
      expect(m.food_hygiene_rate).toBe(100);
      expect(m.child_chose_recipe_rate).toBe(100);
      expect(m.dietary_needs_rate).toBe(100);
      expect(m.allergy_awareness_rate).toBe(100);
      expect(m.kitchen_safety_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.healthy_options_rate).toBe(100);
      expect(m.skills_transferable_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("food_hygiene_rate 0 when false", () => { expect(computeHealthyEatingMetrics([makeRecord({ food_hygiene_followed: false })]).food_hygiene_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeHealthyEatingMetrics([makeRecord({ kitchen_safety_followed: true }), makeRecord({ kitchen_safety_followed: false }), makeRecord({ kitchen_safety_followed: true })]); expect(m.kitchen_safety_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeHealthyEatingMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 session types", () => { const types = ["meal_preparation","baking","food_hygiene","menu_planning","shopping_skills","budget_cooking","cultural_cuisine","nutrition_education","dietary_management","other"] as const; const records = types.map(t => makeRecord({ session_type: t })); const m = computeHealthyEatingMetrics(records); for (const t of types) expect(m.by_session_type[t]).toBe(1); });
    it("counts all 5 skill levels", () => { const levels = ["advanced","competent","developing","basic","not_started"] as const; const records = levels.map(l => makeRecord({ skill_level: l })); const m = computeHealthyEatingMetrics(records); for (const l of levels) expect(m.by_skill_level[l]).toBe(1); });
    it("counts all 5 engagement levels", () => { const levels = ["highly_engaged","engaged","partially_engaged","disengaged","refused"] as const; const records = levels.map(l => makeRecord({ engagement_level: l })); const m = computeHealthyEatingMetrics(records); for (const l of levels) expect(m.by_engagement_level[l]).toBe(1); });
    it("counts all 5 health outcomes", () => { const outcomes = ["significant_improvement","some_improvement","maintained","slight_decline","declined"] as const; const records = outcomes.map(o => makeRecord({ health_outcome: o })); const m = computeHealthyEatingMetrics(records); for (const o of outcomes) expect(m.by_health_outcome[o]).toBe(1); });
  });

  describe("identifyHealthyEatingAlerts", () => {
    it("returns empty for clean", () => { expect(identifyHealthyEatingAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyHealthyEatingAlerts([])).toEqual([]); });
    it("fires refused_declining", () => { 
      const a = identifyHealthyEatingAlerts([makeRecord({ engagement_level: "refused", health_outcome: "declined", child_name: "Jo" })]);
      expect(a[0].type).toBe("refused_declining");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("refused with slight_decline also critical", () => { const a = identifyHealthyEatingAlerts([makeRecord({ engagement_level: "refused", health_outcome: "slight_decline" })]); expect(a[0].type).toBe("refused_declining"); expect(a[0].severity).toBe("critical"); });
    it("refused_declining per-record", () => { const a = identifyHealthyEatingAlerts([makeRecord({ id: "a-1", engagement_level: "refused", health_outcome: "declined" }), makeRecord({ id: "a-2", engagement_level: "refused", health_outcome: "slight_decline" })]); expect(a.filter(x => x.type === "refused_declining")).toHaveLength(2); });
    it("refused without decline no critical", () => { expect(identifyHealthyEatingAlerts([makeRecord({ engagement_level: "refused", health_outcome: "maintained" })]).find(x => x.type === "refused_declining")).toBeUndefined(); });
    it("declined without refused no critical", () => { expect(identifyHealthyEatingAlerts([makeRecord({ health_outcome: "declined", engagement_level: "engaged" })]).find(x => x.type === "refused_declining")).toBeUndefined(); });
    it("fires no_food_hygiene singular", () => { 
      const a = identifyHealthyEatingAlerts([makeRecord({ food_hygiene_followed: false })]);
      const f = a.find(x => x.type === "no_food_hygiene");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("fires no_kitchen_safety singular", () => { 
      const a = identifyHealthyEatingAlerts([makeRecord({ kitchen_safety_followed: false })]);
      const f = a.find(x => x.type === "no_kitchen_safety");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("no_child_choice not for 1", () => { expect(identifyHealthyEatingAlerts([makeRecord({ child_chose_recipe: false })]).find(x => x.type === "no_child_choice")).toBeUndefined(); });
    it("no_child_choice fires for 2", () => { const a = identifyHealthyEatingAlerts([makeRecord({ child_chose_recipe: false }), makeRecord({ child_chose_recipe: false })]); expect(a.find(x => x.type === "no_child_choice")).toBeDefined(); expect(a.find(x => x.type === "no_child_choice")!.severity).toBe("medium"); });
    it("no_allergy_awareness not for 1", () => { expect(identifyHealthyEatingAlerts([makeRecord({ allergy_awareness: false })]).find(x => x.type === "no_allergy_awareness")).toBeUndefined(); });
    it("no_allergy_awareness fires for 2", () => { const a = identifyHealthyEatingAlerts([makeRecord({ allergy_awareness: false }), makeRecord({ allergy_awareness: false })]); expect(a.find(x => x.type === "no_allergy_awareness")).toBeDefined(); expect(a.find(x => x.type === "no_allergy_awareness")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyHealthyEatingAlerts([makeRecord({ engagement_level: "refused", health_outcome: "declined", food_hygiene_followed: false, kitchen_safety_followed: false, child_chose_recipe: false, allergy_awareness: false }), makeRecord({ food_hygiene_followed: false, kitchen_safety_followed: false, child_chose_recipe: false, allergy_awareness: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("refused_declining");
      expect(types).toContain("no_food_hygiene");
      expect(types).toContain("no_kitchen_safety");
      expect(types).toContain("no_child_choice");
      expect(types).toContain("no_allergy_awareness");
    });
  });
});
