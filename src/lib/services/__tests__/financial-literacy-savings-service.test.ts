import { describe, it, expect } from "vitest";
import { _testing, type FinancialLiteracySavingsRecord } from "../financial-literacy-savings-service";
import { todayStr } from "@/lib/utils";

const { computeFinancialLiteracyMetrics, identifyFinancialLiteracyAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<FinancialLiteracySavingsRecord>): FinancialLiteracySavingsRecord {
  return {
    id: "a-1", home_id: "home-1",
    topic_area: "budgeting_basics",
    understanding_level: "good_understanding",
    engagement_quality: "engaged",
    saving_progress: "on_target",
    session_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    supported_by: "Staff A",
    age_appropriate: true,
    practical_exercise: true,
    real_money_used: true,
    savings_account_active: true,
    budget_created: true,
    targets_set: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    pathway_plan_updated: true,
    resources_provided: true,
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

describe("financial-literacy-savings-service", () => {
  describe("computeFinancialLiteracyMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeFinancialLiteracyMetrics([]);
      expect(m.total_sessions).toBe(0);;
      expect(m.not_understood_count).toBe(0);
      expect(m.disengaged_count).toBe(0);
      expect(m.no_savings_count).toBe(0);
      expect(m.in_debt_count).toBe(0);
      expect(m.age_appropriate_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeFinancialLiteracyMetrics([]);
      expect(m.by_topic_area).toEqual({});
      expect(m.by_understanding_level).toEqual({});
      expect(m.by_engagement_quality).toEqual({});
      expect(m.by_saving_progress).toEqual({});
    });
    it("total_sessions counts records", () => { expect(computeFinancialLiteracyMetrics([makeRecord(), makeRecord()]).total_sessions).toBe(2); });
    it("counts not_understood", () => { expect(computeFinancialLiteracyMetrics([makeRecord({ understanding_level: "not_understood" })]).not_understood_count).toBe(1); });
    it("does not count limited as not_understood", () => { expect(computeFinancialLiteracyMetrics([makeRecord({ understanding_level: "limited" })]).not_understood_count).toBe(0); });
    it("counts disengaged", () => { expect(computeFinancialLiteracyMetrics([makeRecord({ engagement_quality: "disengaged" })]).disengaged_count).toBe(1); });
    it("counts refused as disengaged", () => { expect(computeFinancialLiteracyMetrics([makeRecord({ engagement_quality: "refused" })]).disengaged_count).toBe(1); });
    it("does not count partially_engaged as disengaged", () => { expect(computeFinancialLiteracyMetrics([makeRecord({ engagement_quality: "partially_engaged" })]).disengaged_count).toBe(0); });
    it("counts no_savings", () => { expect(computeFinancialLiteracyMetrics([makeRecord({ saving_progress: "no_savings" })]).no_savings_count).toBe(1); });
    it("counts in_debt", () => { expect(computeFinancialLiteracyMetrics([makeRecord({ saving_progress: "in_debt" })]).in_debt_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeFinancialLiteracyMetrics([makeRecord()]);
      expect(m.age_appropriate_rate).toBe(100);
      expect(m.practical_exercise_rate).toBe(100);
      expect(m.real_money_rate).toBe(100);
      expect(m.savings_account_rate).toBe(100);
      expect(m.budget_created_rate).toBe(100);
      expect(m.targets_set_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.pathway_plan_rate).toBe(100);
      expect(m.resources_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("age_appropriate_rate 0 when false", () => { expect(computeFinancialLiteracyMetrics([makeRecord({ age_appropriate: false })]).age_appropriate_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeFinancialLiteracyMetrics([makeRecord({ budget_created: true }), makeRecord({ budget_created: false }), makeRecord({ budget_created: true })]); expect(m.budget_created_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeFinancialLiteracyMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 topic areas", () => { const areas = ["budgeting_basics","savings_accounts","spending_tracking","shopping_comparison","bills_utilities","banking_skills","benefits_entitlements","debt_awareness","earning_income","other"] as const; const records = areas.map(a => makeRecord({ topic_area: a })); const m = computeFinancialLiteracyMetrics(records); for (const a of areas) expect(m.by_topic_area[a]).toBe(1); });
    it("counts all 5 understanding levels", () => { const levels = ["confident","good_understanding","developing","limited","not_understood"] as const; const records = levels.map(l => makeRecord({ understanding_level: l })); const m = computeFinancialLiteracyMetrics(records); for (const l of levels) expect(m.by_understanding_level[l]).toBe(1); });
    it("counts all 5 engagement qualities", () => { const qualities = ["highly_engaged","engaged","partially_engaged","disengaged","refused"] as const; const records = qualities.map(q => makeRecord({ engagement_quality: q })); const m = computeFinancialLiteracyMetrics(records); for (const q of qualities) expect(m.by_engagement_quality[q]).toBe(1); });
    it("counts all 5 saving progresses", () => { const progresses = ["exceeding_target","on_target","below_target","no_savings","in_debt"] as const; const records = progresses.map(p => makeRecord({ saving_progress: p })); const m = computeFinancialLiteracyMetrics(records); for (const p of progresses) expect(m.by_saving_progress[p]).toBe(1); });
  });

  describe("identifyFinancialLiteracyAlerts", () => {
    it("returns empty for clean", () => { expect(identifyFinancialLiteracyAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyFinancialLiteracyAlerts([])).toEqual([]); });
    it("fires in_debt_not_understood", () => { 
      const a = identifyFinancialLiteracyAlerts([makeRecord({ saving_progress: "in_debt", understanding_level: "not_understood", child_name: "Jo" })]);
      expect(a[0].type).toBe("in_debt_not_understood");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("in_debt_not_understood per-record", () => { const a = identifyFinancialLiteracyAlerts([makeRecord({ id: "a-1", saving_progress: "in_debt", understanding_level: "not_understood" }), makeRecord({ id: "a-2", saving_progress: "in_debt", understanding_level: "not_understood" })]); expect(a.filter(x => x.type === "in_debt_not_understood")).toHaveLength(2); });
    it("in_debt without not_understood no critical", () => { expect(identifyFinancialLiteracyAlerts([makeRecord({ saving_progress: "in_debt", understanding_level: "good_understanding" })]).find(x => x.type === "in_debt_not_understood")).toBeUndefined(); });
    it("not_understood without in_debt no critical", () => { expect(identifyFinancialLiteracyAlerts([makeRecord({ understanding_level: "not_understood", saving_progress: "on_target" })]).find(x => x.type === "in_debt_not_understood")).toBeUndefined(); });
    it("fires no_savings_account singular", () => { 
      const a = identifyFinancialLiteracyAlerts([makeRecord({ savings_account_active: false })]);
      const f = a.find(x => x.type === "no_savings_account");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("no_savings_account plural", () => { const a = identifyFinancialLiteracyAlerts([makeRecord({ savings_account_active: false }), makeRecord({ savings_account_active: false })]); const f = a.find(x => x.type === "no_savings_account"); expect(f!.message).toContain("2 sessions have"); });
    it("fires no_pathway_plan singular", () => { 
      const a = identifyFinancialLiteracyAlerts([makeRecord({ pathway_plan_updated: false })]);
      const f = a.find(x => x.type === "no_pathway_plan");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("no_practical_exercise not for 1", () => { expect(identifyFinancialLiteracyAlerts([makeRecord({ practical_exercise: false })]).find(x => x.type === "no_practical_exercise")).toBeUndefined(); });
    it("no_practical_exercise fires for 2", () => { const a = identifyFinancialLiteracyAlerts([makeRecord({ practical_exercise: false }), makeRecord({ practical_exercise: false })]); expect(a.find(x => x.type === "no_practical_exercise")).toBeDefined(); expect(a.find(x => x.type === "no_practical_exercise")!.severity).toBe("medium"); });
    it("no_budget_created not for 1", () => { expect(identifyFinancialLiteracyAlerts([makeRecord({ budget_created: false })]).find(x => x.type === "no_budget_created")).toBeUndefined(); });
    it("no_budget_created fires for 2", () => { const a = identifyFinancialLiteracyAlerts([makeRecord({ budget_created: false }), makeRecord({ budget_created: false })]); expect(a.find(x => x.type === "no_budget_created")).toBeDefined(); expect(a.find(x => x.type === "no_budget_created")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyFinancialLiteracyAlerts([makeRecord({ saving_progress: "in_debt", understanding_level: "not_understood", savings_account_active: false, pathway_plan_updated: false, practical_exercise: false, budget_created: false }), makeRecord({ savings_account_active: false, pathway_plan_updated: false, practical_exercise: false, budget_created: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("in_debt_not_understood");
      expect(types).toContain("no_savings_account");
      expect(types).toContain("no_pathway_plan");
      expect(types).toContain("no_practical_exercise");
      expect(types).toContain("no_budget_created");
    });
  });
});
