import { describe, it, expect } from "vitest";
import { _testing, type GardenHorticultureActivitiesRecord } from "../garden-horticulture-activities-service";
import { todayStr } from "@/lib/utils";

const { computeGardenHorticultureMetrics, identifyGardenHorticultureAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<GardenHorticultureActivitiesRecord>): GardenHorticultureActivitiesRecord {
  return {
    id: "a-1", home_id: "home-1",
    activity_type: "vegetable_growing",
    skill_level: "competent",
    engagement_level: "engaged",
    health_benefit: "some_benefit",
    session_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    supported_by: "Staff A",
    age_appropriate: true,
    risk_assessment_done: true,
    tools_safe: true,
    supervision_adequate: true,
    child_chose_activity: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    therapeutic_value_noted: true,
    seasonal_learning: true,
    organic_methods_used: true,
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

describe("garden-horticulture-activities-service", () => {
  describe("computeGardenHorticultureMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeGardenHorticultureMetrics([]);
      expect(m.total_sessions).toBe(0);;
      expect(m.not_started_count).toBe(0);
      expect(m.disengaged_count).toBe(0);
      expect(m.no_benefit_count).toBe(0);
      expect(m.refused_count).toBe(0);
      expect(m.age_appropriate_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeGardenHorticultureMetrics([]);
      expect(m.by_activity_type).toEqual({});
      expect(m.by_skill_level).toEqual({});
      expect(m.by_engagement_level).toEqual({});
      expect(m.by_health_benefit).toEqual({});
    });
    it("total_sessions counts records", () => { expect(computeGardenHorticultureMetrics([makeRecord(), makeRecord()]).total_sessions).toBe(2); });
    it("counts not_started", () => { expect(computeGardenHorticultureMetrics([makeRecord({ skill_level: "not_started" })]).not_started_count).toBe(1); });
    it("does not count basic as not_started", () => { expect(computeGardenHorticultureMetrics([makeRecord({ skill_level: "basic" })]).not_started_count).toBe(0); });
    it("counts disengaged", () => { expect(computeGardenHorticultureMetrics([makeRecord({ engagement_level: "disengaged" })]).disengaged_count).toBe(1); });
    it("counts refused as disengaged", () => { expect(computeGardenHorticultureMetrics([makeRecord({ engagement_level: "refused" })]).disengaged_count).toBe(1); });
    it("does not count partially as disengaged", () => { expect(computeGardenHorticultureMetrics([makeRecord({ engagement_level: "partially_engaged" })]).disengaged_count).toBe(0); });
    it("counts no_benefit", () => { expect(computeGardenHorticultureMetrics([makeRecord({ health_benefit: "no_benefit" })]).no_benefit_count).toBe(1); });
    it("does not count minimal as no_benefit", () => { expect(computeGardenHorticultureMetrics([makeRecord({ health_benefit: "minimal_benefit" })]).no_benefit_count).toBe(0); });
    it("counts refused", () => { expect(computeGardenHorticultureMetrics([makeRecord({ engagement_level: "refused" })]).refused_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeGardenHorticultureMetrics([makeRecord()]);
      expect(m.age_appropriate_rate).toBe(100);
      expect(m.risk_assessment_rate).toBe(100);
      expect(m.tools_safe_rate).toBe(100);
      expect(m.supervision_rate).toBe(100);
      expect(m.child_chose_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.therapeutic_value_rate).toBe(100);
      expect(m.seasonal_learning_rate).toBe(100);
      expect(m.organic_methods_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("risk_assessment_rate 0 when false", () => { expect(computeGardenHorticultureMetrics([makeRecord({ risk_assessment_done: false })]).risk_assessment_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeGardenHorticultureMetrics([makeRecord({ tools_safe: true }), makeRecord({ tools_safe: false }), makeRecord({ tools_safe: true })]); expect(m.tools_safe_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeGardenHorticultureMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 activity types", () => { const types = ["vegetable_growing","flower_gardening","herb_cultivation","composting","wildlife_habitat","outdoor_classroom","therapeutic_gardening","seasonal_planting","garden_design","other"] as const; const records = types.map(t => makeRecord({ activity_type: t })); const m = computeGardenHorticultureMetrics(records); for (const t of types) expect(m.by_activity_type[t]).toBe(1); });
    it("counts all 5 skill levels", () => { const levels = ["advanced","competent","developing","basic","not_started"] as const; const records = levels.map(l => makeRecord({ skill_level: l })); const m = computeGardenHorticultureMetrics(records); for (const l of levels) expect(m.by_skill_level[l]).toBe(1); });
    it("counts all 5 engagement levels", () => { const levels = ["highly_engaged","engaged","partially_engaged","disengaged","refused"] as const; const records = levels.map(l => makeRecord({ engagement_level: l })); const m = computeGardenHorticultureMetrics(records); for (const l of levels) expect(m.by_engagement_level[l]).toBe(1); });
    it("counts all 5 health benefits", () => { const benefits = ["significant_benefit","some_benefit","maintained","minimal_benefit","no_benefit"] as const; const records = benefits.map(b => makeRecord({ health_benefit: b })); const m = computeGardenHorticultureMetrics(records); for (const b of benefits) expect(m.by_health_benefit[b]).toBe(1); });
  });

  describe("identifyGardenHorticultureAlerts", () => {
    it("returns empty for clean", () => { expect(identifyGardenHorticultureAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyGardenHorticultureAlerts([])).toEqual([]); });
    it("fires refused_no_benefit", () => { 
      const a = identifyGardenHorticultureAlerts([makeRecord({ engagement_level: "refused", health_benefit: "no_benefit", child_name: "Jo" })]);
      expect(a[0].type).toBe("refused_no_benefit");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("refused_no_benefit per-record", () => { const a = identifyGardenHorticultureAlerts([makeRecord({ id: "a-1", engagement_level: "refused", health_benefit: "no_benefit" }), makeRecord({ id: "a-2", engagement_level: "refused", health_benefit: "no_benefit" })]); expect(a.filter(x => x.type === "refused_no_benefit")).toHaveLength(2); });
    it("refused without no_benefit no critical", () => { expect(identifyGardenHorticultureAlerts([makeRecord({ engagement_level: "refused", health_benefit: "some_benefit" })]).find(x => x.type === "refused_no_benefit")).toBeUndefined(); });
    it("no_benefit without refused no critical", () => { expect(identifyGardenHorticultureAlerts([makeRecord({ health_benefit: "no_benefit", engagement_level: "engaged" })]).find(x => x.type === "refused_no_benefit")).toBeUndefined(); });
    it("fires no_risk_assessment singular", () => { 
      const a = identifyGardenHorticultureAlerts([makeRecord({ risk_assessment_done: false })]);
      const f = a.find(x => x.type === "no_risk_assessment");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("no_risk_assessment plural", () => { const a = identifyGardenHorticultureAlerts([makeRecord({ risk_assessment_done: false }), makeRecord({ risk_assessment_done: false })]); const f = a.find(x => x.type === "no_risk_assessment"); expect(f!.message).toContain("2 sessions have"); });
    it("fires tools_not_safe singular", () => { 
      const a = identifyGardenHorticultureAlerts([makeRecord({ tools_safe: false })]);
      const f = a.find(x => x.type === "tools_not_safe");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("no_child_choice not for 1", () => { expect(identifyGardenHorticultureAlerts([makeRecord({ child_chose_activity: false })]).find(x => x.type === "no_child_choice")).toBeUndefined(); });
    it("no_child_choice fires for 2", () => { const a = identifyGardenHorticultureAlerts([makeRecord({ child_chose_activity: false }), makeRecord({ child_chose_activity: false })]); expect(a.find(x => x.type === "no_child_choice")).toBeDefined(); expect(a.find(x => x.type === "no_child_choice")!.severity).toBe("medium"); });
    it("no_therapeutic_value not for 1", () => { expect(identifyGardenHorticultureAlerts([makeRecord({ therapeutic_value_noted: false })]).find(x => x.type === "no_therapeutic_value")).toBeUndefined(); });
    it("no_therapeutic_value fires for 2", () => { const a = identifyGardenHorticultureAlerts([makeRecord({ therapeutic_value_noted: false }), makeRecord({ therapeutic_value_noted: false })]); expect(a.find(x => x.type === "no_therapeutic_value")).toBeDefined(); expect(a.find(x => x.type === "no_therapeutic_value")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyGardenHorticultureAlerts([makeRecord({ engagement_level: "refused", health_benefit: "no_benefit", risk_assessment_done: false, tools_safe: false, child_chose_activity: false, therapeutic_value_noted: false }), makeRecord({ risk_assessment_done: false, tools_safe: false, child_chose_activity: false, therapeutic_value_noted: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("refused_no_benefit");
      expect(types).toContain("no_risk_assessment");
      expect(types).toContain("tools_not_safe");
      expect(types).toContain("no_child_choice");
      expect(types).toContain("no_therapeutic_value");
    });
  });
});
