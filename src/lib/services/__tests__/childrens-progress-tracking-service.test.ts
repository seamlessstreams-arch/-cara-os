import { describe, it, expect } from "vitest";
import { _testing, type ChildrensProgressTrackingRecord } from "../childrens-progress-tracking-service";
import { todayStr } from "@/lib/utils";

const { computeChildrensProgressMetrics, identifyChildrensProgressAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<ChildrensProgressTrackingRecord>): ChildrensProgressTrackingRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    outcome_domain: overrides?.outcome_domain ?? "education_learning",
    progress_rating: overrides?.progress_rating ?? "good_progress",
    assessment_tool: overrides?.assessment_tool ?? "sdq",
    review_period: overrides?.review_period ?? "monthly",
    assessment_date: overrides?.assessment_date ?? todayStr(),
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : "child-1",
    baseline_established: overrides?.baseline_established ?? true,
    targets_set: overrides?.targets_set ?? true,
    targets_smart: overrides?.targets_smart ?? true,
    child_involved: overrides?.child_involved ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    parent_informed: overrides?.parent_informed ?? true,
    evidence_documented: overrides?.evidence_documented ?? true,
    care_plan_updated: overrides?.care_plan_updated ?? true,
    celebration_planned: overrides?.celebration_planned ?? true,
    barriers_identified: overrides?.barriers_identified ?? true,
    support_in_place: overrides?.support_in_place ?? true,
    multi_agency_input: overrides?.multi_agency_input ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    assessed_by: overrides?.assessed_by ?? "Staff A",
    current_score: "current_score" in (overrides ?? {}) ? (overrides!.current_score ?? null) : null,
    previous_score: "previous_score" in (overrides ?? {}) ? (overrides!.previous_score ?? null) : null,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("childrens-progress-tracking-service", () => {
  describe("computeChildrensProgressMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeChildrensProgressMetrics([]);
      expect(m.total_assessments).toBe(0);;
      expect(m.significant_progress_count).toBe(0);
      expect(m.good_progress_count).toBe(0);
      expect(m.some_progress_count).toBe(0);
      expect(m.no_change_count).toBe(0);
      expect(m.regression_count).toBe(0);
      expect(m.positive_progress_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeChildrensProgressMetrics([]);
      expect(m.by_outcome_domain).toEqual({});
      expect(m.by_progress_rating).toEqual({});
      expect(m.by_assessment_tool).toEqual({});
      expect(m.by_review_period).toEqual({});
    });
    it("counts significant_progress", () => { expect(computeChildrensProgressMetrics([makeRecord({ progress_rating: "significant_progress" })]).significant_progress_count).toBe(1); });
    it("counts good_progress", () => { expect(computeChildrensProgressMetrics([makeRecord()]).good_progress_count).toBe(1); });
    it("counts some_progress", () => { expect(computeChildrensProgressMetrics([makeRecord({ progress_rating: "some_progress" })]).some_progress_count).toBe(1); });
    it("counts no_change", () => { expect(computeChildrensProgressMetrics([makeRecord({ progress_rating: "no_change" })]).no_change_count).toBe(1); });
    it("counts regression", () => { expect(computeChildrensProgressMetrics([makeRecord({ progress_rating: "regression" })]).regression_count).toBe(1); });
    it("positive_progress_rate includes sig+good+some", () => { const m = computeChildrensProgressMetrics([makeRecord({ progress_rating: "significant_progress" }), makeRecord({ progress_rating: "good_progress" }), makeRecord({ progress_rating: "some_progress" }), makeRecord({ progress_rating: "no_change" })]); expect(m.positive_progress_rate).toBe(75); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeChildrensProgressMetrics([makeRecord()]);
      expect(m.baseline_established_rate).toBe(100);
      expect(m.targets_set_rate).toBe(100);
      expect(m.targets_smart_rate).toBe(100);
      expect(m.child_involved_rate).toBe(100);
      expect(m.social_worker_informed_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.evidence_documented_rate).toBe(100);
      expect(m.care_plan_updated_rate).toBe(100);
      expect(m.celebration_planned_rate).toBe(100);
      expect(m.barriers_identified_rate).toBe(100);
      expect(m.support_in_place_rate).toBe(100);
      expect(m.multi_agency_rate).toBe(100);
    });
    it("baseline_established_rate 0 when false", () => { expect(computeChildrensProgressMetrics([makeRecord({ baseline_established: false })]).baseline_established_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeChildrensProgressMetrics([makeRecord({ baseline_established: true }), makeRecord({ baseline_established: false }), makeRecord({ baseline_established: true })]); expect(m.baseline_established_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeChildrensProgressMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 domains", () => { const domains = ["education_learning","health_physical","emotional_wellbeing","social_relationships","independence_skills","participation_voice","cultural_identity","placement_stability","family_contact","other"] as const; const records = domains.map(d => makeRecord({ outcome_domain: d })); const m = computeChildrensProgressMetrics(records); for (const d of domains) expect(m.by_outcome_domain[d]).toBe(1); });
    it("counts all 5 ratings", () => { const ratings = ["significant_progress","good_progress","some_progress","no_change","regression"] as const; const records = ratings.map(r => makeRecord({ progress_rating: r })); const m = computeChildrensProgressMetrics(records); for (const r of ratings) expect(m.by_progress_rating[r]).toBe(1); });
    it("counts all 10 tools", () => { const tools = ["sdq","star_chart","observation","self_assessment","professional_assessment","standardised_test","care_plan_review","key_worker_report","multi_agency_assessment","other"] as const; const records = tools.map(t => makeRecord({ assessment_tool: t })); const m = computeChildrensProgressMetrics(records); for (const t of tools) expect(m.by_assessment_tool[t]).toBe(1); });
    it("counts all 5 periods", () => { const periods = ["weekly","monthly","termly","six_monthly","annual"] as const; const records = periods.map(p => makeRecord({ review_period: p })); const m = computeChildrensProgressMetrics(records); for (const p of periods) expect(m.by_review_period[p]).toBe(1); });
  });

  describe("identifyChildrensProgressAlerts", () => {
    it("returns empty for clean", () => { expect(identifyChildrensProgressAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyChildrensProgressAlerts([])).toEqual([]); });
    it("fires regression_detected", () => { 
      const a = identifyChildrensProgressAlerts([makeRecord({ progress_rating: "regression", child_name: "Jo", outcome_domain: "emotional_wellbeing", assessment_date: "2026-05-14" })]);
      expect(a[0].type).toBe("regression_detected");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
      expect(a[0].message).toContain("emotional wellbeing");
    });
    it("regression_detected per-record", () => { const a = identifyChildrensProgressAlerts([makeRecord({ id: "a-1", progress_rating: "regression" }), makeRecord({ id: "a-2", progress_rating: "regression" })]); expect(a.filter(x => x.type === "regression_detected")).toHaveLength(2); });
    it("fires no_baseline singular", () => { 
      const a = identifyChildrensProgressAlerts([makeRecord({ baseline_established: false })]);
      const f = a.find(x => x.type === "no_baseline");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 assessment has");
    });
    it("no_baseline plural", () => { const a = identifyChildrensProgressAlerts([makeRecord({ baseline_established: false }), makeRecord({ baseline_established: false })]); const f = a.find(x => x.type === "no_baseline"); expect(f!.message).toContain("2 assessments have"); });
    it("child_not_involved not for 1", () => { expect(identifyChildrensProgressAlerts([makeRecord({ child_involved: false })]).find(x => x.type === "child_not_involved")).toBeUndefined(); });
    it("child_not_involved fires for 2", () => { const a = identifyChildrensProgressAlerts([makeRecord({ child_involved: false }), makeRecord({ child_involved: false })]); expect(a.find(x => x.type === "child_not_involved")).toBeDefined(); });
    it("evidence_not_documented not for 1", () => { expect(identifyChildrensProgressAlerts([makeRecord({ evidence_documented: false })]).find(x => x.type === "evidence_not_documented")).toBeUndefined(); });
    it("evidence_not_documented fires for 2", () => { const a = identifyChildrensProgressAlerts([makeRecord({ evidence_documented: false }), makeRecord({ evidence_documented: false })]); expect(a.find(x => x.type === "evidence_not_documented")).toBeDefined(); });
    it("targets_not_smart not for 2", () => { expect(identifyChildrensProgressAlerts([makeRecord({ targets_set: true, targets_smart: false }), makeRecord({ targets_set: true, targets_smart: false })]).find(x => x.type === "targets_not_smart")).toBeUndefined(); });
    it("targets_not_smart fires for 3", () => { const a = identifyChildrensProgressAlerts([makeRecord({ targets_set: true, targets_smart: false }), makeRecord({ targets_set: true, targets_smart: false }), makeRecord({ targets_set: true, targets_smart: false })]); expect(a.find(x => x.type === "targets_not_smart")).toBeDefined(); });
    it("targets_not_smart only when targets_set", () => { expect(identifyChildrensProgressAlerts([makeRecord({ targets_set: false, targets_smart: false }), makeRecord({ targets_set: false, targets_smart: false }), makeRecord({ targets_set: false, targets_smart: false })]).find(x => x.type === "targets_not_smart")).toBeUndefined(); });
    it("fires all applicable", () => { 
      const a = identifyChildrensProgressAlerts([makeRecord({ progress_rating: "regression", baseline_established: false, child_involved: false, evidence_documented: false, targets_set: true, targets_smart: false }), makeRecord({ child_involved: false, evidence_documented: false, targets_set: true, targets_smart: false }), makeRecord({ targets_set: true, targets_smart: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("regression_detected");
      expect(types).toContain("no_baseline");
      expect(types).toContain("child_not_involved");
      expect(types).toContain("evidence_not_documented");
      expect(types).toContain("targets_not_smart");
    });
  });
});
