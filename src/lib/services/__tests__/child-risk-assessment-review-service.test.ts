import { describe, it, expect } from "vitest";
import { _testing, type ChildRiskAssessmentReviewRecord } from "../child-risk-assessment-review-service";
import { todayStr } from "@/lib/utils";

const { computeChildRiskReviewMetrics, identifyChildRiskReviewAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<ChildRiskAssessmentReviewRecord>): ChildRiskAssessmentReviewRecord {
  return {
    id: "a-1", home_id: "home-1",
    risk_domain: "self_harm",
    review_outcome: "risk_reduced",
    current_risk_level: "medium",
    review_frequency: "monthly",
    review_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : "child-1",
    reviewed_by: "Manager A",
    child_participated: true,
    social_worker_consulted: true,
    multi_agency_input: true,
    triggers_updated: true,
    protective_factors_reviewed: true,
    safety_plan_updated: true,
    staff_briefed: true,
    management_oversight: true,
    evidence_documented: true,
    dynamic_factors_assessed: true,
    historical_factors_reviewed: true,
    contingency_plan_current: true,
    issues_found: [], actions_taken: [],
    previous_risk_level: "previous_risk_level" in (overrides ?? {}) ? (overrides!.previous_risk_level ?? null) : null,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("child-risk-assessment-review-service", () => {
  describe("computeChildRiskReviewMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeChildRiskReviewMetrics([]);
      expect(m.total_reviews).toBe(0);;
      expect(m.risk_increased_count).toBe(0);
      expect(m.new_risk_count).toBe(0);
      expect(m.risk_reduced_count).toBe(0);
      expect(m.very_high_count).toBe(0);
      expect(m.child_participated_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeChildRiskReviewMetrics([]);
      expect(m.by_risk_domain).toEqual({});
      expect(m.by_review_outcome).toEqual({});
      expect(m.by_risk_level).toEqual({});
      expect(m.by_review_frequency).toEqual({});
    });
    it("counts risk_increased", () => { expect(computeChildRiskReviewMetrics([makeRecord({ review_outcome: "risk_increased" })]).risk_increased_count).toBe(1); });
    it("counts new_risk", () => { expect(computeChildRiskReviewMetrics([makeRecord({ review_outcome: "new_risk_identified" })]).new_risk_count).toBe(1); });
    it("counts risk_reduced", () => { expect(computeChildRiskReviewMetrics([makeRecord()]).risk_reduced_count).toBe(1); });
    it("counts very_high", () => { expect(computeChildRiskReviewMetrics([makeRecord({ current_risk_level: "very_high" })]).very_high_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeChildRiskReviewMetrics([makeRecord()]);
      expect(m.child_participated_rate).toBe(100);
      expect(m.social_worker_consulted_rate).toBe(100);
      expect(m.multi_agency_rate).toBe(100);
      expect(m.triggers_updated_rate).toBe(100);
      expect(m.protective_factors_rate).toBe(100);
      expect(m.safety_plan_updated_rate).toBe(100);
      expect(m.staff_briefed_rate).toBe(100);
      expect(m.management_oversight_rate).toBe(100);
      expect(m.evidence_documented_rate).toBe(100);
      expect(m.dynamic_factors_rate).toBe(100);
      expect(m.historical_factors_rate).toBe(100);
      expect(m.contingency_plan_rate).toBe(100);
    });
    it("child_participated_rate 0 when false", () => { expect(computeChildRiskReviewMetrics([makeRecord({ child_participated: false })]).child_participated_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeChildRiskReviewMetrics([makeRecord({ child_participated: true }), makeRecord({ child_participated: false }), makeRecord({ child_participated: true })]); expect(m.child_participated_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeChildRiskReviewMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 domains", () => { const domains = ["self_harm","harm_to_others","exploitation","missing_from_care","substance_misuse","online_safety","bullying","radicalisation","fire_setting","other"] as const; const records = domains.map(d => makeRecord({ risk_domain: d })); const m = computeChildRiskReviewMetrics(records); for (const d of domains) expect(m.by_risk_domain[d]).toBe(1); });
    it("counts all 5 outcomes", () => { const outcomes = ["risk_reduced","risk_unchanged","risk_increased","new_risk_identified","risk_closed"] as const; const records = outcomes.map(o => makeRecord({ review_outcome: o })); const m = computeChildRiskReviewMetrics(records); for (const o of outcomes) expect(m.by_review_outcome[o]).toBe(1); });
    it("counts all 5 levels", () => { const levels = ["very_high","high","medium","low","minimal"] as const; const records = levels.map(l => makeRecord({ current_risk_level: l })); const m = computeChildRiskReviewMetrics(records); for (const l of levels) expect(m.by_risk_level[l]).toBe(1); });
    it("counts all 5 frequencies", () => { const freqs = ["weekly","fortnightly","monthly","quarterly","six_monthly"] as const; const records = freqs.map(f => makeRecord({ review_frequency: f })); const m = computeChildRiskReviewMetrics(records); for (const f of freqs) expect(m.by_review_frequency[f]).toBe(1); });
  });

  describe("identifyChildRiskReviewAlerts", () => {
    it("returns empty for clean", () => { expect(identifyChildRiskReviewAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyChildRiskReviewAlerts([])).toEqual([]); });
    it("fires risk_increased_no_plan", () => { 
      const a = identifyChildRiskReviewAlerts([makeRecord({ review_outcome: "risk_increased", safety_plan_updated: false, child_name: "Jo", risk_domain: "self_harm", review_date: "2026-05-14" })]);
      expect(a[0].type).toBe("risk_increased_no_plan");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
      expect(a[0].message).toContain("self harm");
    });
    it("risk_increased_no_plan per-record", () => { const a = identifyChildRiskReviewAlerts([makeRecord({ id: "a-1", review_outcome: "risk_increased", safety_plan_updated: false }), makeRecord({ id: "a-2", review_outcome: "risk_increased", safety_plan_updated: false })]); expect(a.filter(x => x.type === "risk_increased_no_plan")).toHaveLength(2); });
    it("no critical if safety plan updated", () => { expect(identifyChildRiskReviewAlerts([makeRecord({ review_outcome: "risk_increased", safety_plan_updated: true })]).filter(x => x.type === "risk_increased_no_plan")).toHaveLength(0); });
    it("fires child_not_participated singular", () => { 
      const a = identifyChildRiskReviewAlerts([makeRecord({ child_participated: false })]);
      const f = a.find(x => x.type === "child_not_participated");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 review has");
    });
    it("child_not_participated plural", () => { const a = identifyChildRiskReviewAlerts([makeRecord({ child_participated: false }), makeRecord({ child_participated: false })]); const f = a.find(x => x.type === "child_not_participated"); expect(f!.message).toContain("2 reviews have"); });
    it("fires staff_not_briefed singular", () => { const a = identifyChildRiskReviewAlerts([makeRecord({ staff_briefed: false })]); expect(a.find(x => x.type === "staff_not_briefed")).toBeDefined(); });
    it("triggers_not_updated not for 1", () => { expect(identifyChildRiskReviewAlerts([makeRecord({ triggers_updated: false })]).find(x => x.type === "triggers_not_updated")).toBeUndefined(); });
    it("triggers_not_updated fires for 2", () => { const a = identifyChildRiskReviewAlerts([makeRecord({ triggers_updated: false }), makeRecord({ triggers_updated: false })]); expect(a.find(x => x.type === "triggers_not_updated")).toBeDefined(); });
    it("contingency_not_current not for 1", () => { expect(identifyChildRiskReviewAlerts([makeRecord({ contingency_plan_current: false })]).find(x => x.type === "contingency_not_current")).toBeUndefined(); });
    it("contingency_not_current fires for 2", () => { const a = identifyChildRiskReviewAlerts([makeRecord({ contingency_plan_current: false }), makeRecord({ contingency_plan_current: false })]); expect(a.find(x => x.type === "contingency_not_current")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyChildRiskReviewAlerts([makeRecord({ review_outcome: "risk_increased", safety_plan_updated: false, child_participated: false, staff_briefed: false, triggers_updated: false, contingency_plan_current: false }), makeRecord({ triggers_updated: false, contingency_plan_current: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("risk_increased_no_plan");
      expect(types).toContain("child_not_participated");
      expect(types).toContain("staff_not_briefed");
      expect(types).toContain("triggers_not_updated");
      expect(types).toContain("contingency_not_current");
    });
  });
});

// ── Tri-state: risk-up with unrecorded plan-update alerts as a gap ──
describe("tri-state judgements", () => {
  it("words an unrecorded update as a gap", () => {
    const alerts = _testing.identifyChildRiskReviewAlerts([
      makeRecord({ review_outcome: "risk_increased", safety_plan_updated: null }),
    ]);
    const a = alerts.find((x) => x.type === "risk_increased_no_plan");
    expect(a?.message).toMatch(/no safety-plan update recorded/i);
  });
  it("still asserts a recorded not-updated", () => {
    const alerts = _testing.identifyChildRiskReviewAlerts([
      makeRecord({ review_outcome: "risk_increased", safety_plan_updated: false }),
    ]);
    expect(alerts.some((x) => /safety plan not updated/i.test(x.message))).toBe(true);
  });
});
