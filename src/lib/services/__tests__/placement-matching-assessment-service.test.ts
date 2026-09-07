import { describe, it, expect } from "vitest";
import { _testing, type PlacementMatchingAssessmentRecord } from "../placement-matching-assessment-service";
import { todayStr } from "@/lib/utils";

const { computePlacementMatchingMetrics, identifyPlacementMatchingAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<PlacementMatchingAssessmentRecord>): PlacementMatchingAssessmentRecord {
  return {
    id: "a-1", home_id: "home-1",
    matching_domain: "peer_dynamics",
    match_quality: "good_match",
    assessment_timing: "pre_admission",
    impact_level: "positive",
    session_date: todayStr(),
    child_name: "Child A",
    assessed_by: "Manager A",
    matching_rationale: "Test rationale",
    evidence_summary: "Test evidence",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    peer_group_analysis: "peer_group_analysis" in (overrides ?? {}) ? (overrides!.peer_group_analysis ?? null) : null,
    risk_assessment_summary: "risk_assessment_summary" in (overrides ?? {}) ? (overrides!.risk_assessment_summary ?? null) : null,
    child_views_on_placement: "child_views_on_placement" in (overrides ?? {}) ? (overrides!.child_views_on_placement ?? null) : null,
    existing_children_views: "existing_children_views" in (overrides ?? {}) ? (overrides!.existing_children_views ?? null) : null,
    staff_views: "staff_views" in (overrides ?? {}) ? (overrides!.staff_views ?? null) : null,
    improvements_needed: "improvements_needed" in (overrides ?? {}) ? (overrides!.improvements_needed ?? null) : null,
    contingency_plan: "contingency_plan" in (overrides ?? {}) ? (overrides!.contingency_plan ?? null) : null,
    escalation_notes: "escalation_notes" in (overrides ?? {}) ? (overrides!.escalation_notes ?? null) : null,
    approved_by: "approved_by" in (overrides ?? {}) ? (overrides!.approved_by ?? null) : null,
    approved_at: "approved_at" in (overrides ?? {}) ? (overrides!.approved_at ?? null) : null,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    child_views_sought: true,
    existing_children_consulted: true,
    staff_consulted: true,
    risk_assessment_completed: true,
    impact_on_others_assessed: true,
    cultural_needs_considered: true,
    education_access_confirmed: true,
    health_access_confirmed: true,
    family_contact_feasible: true,
    matching_panel_agreed: true,
    contingency_planned: true,
    recorded_promptly: true,
    issues_found: [], actions_taken: [],
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("placement-matching-assessment-service", () => {
  describe("computePlacementMatchingMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computePlacementMatchingMetrics([]);
      expect(m.total_assessments).toBe(0);;
      expect(m.poor_match_count).toBe(0);
      expect(m.negative_impact_count).toBe(0);
      expect(m.unsuitable_count).toBe(0);
      expect(m.pre_admission_count).toBe(0);
      expect(m.child_views_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computePlacementMatchingMetrics([]);
      expect(m.by_matching_domain).toEqual({});
      expect(m.by_match_quality).toEqual({});
      expect(m.by_assessment_timing).toEqual({});
      expect(m.by_impact_level).toEqual({});
    });
    it("counts total", () => { const m = computePlacementMatchingMetrics([makeRecord(), makeRecord({ id: "a-2" })]); expect(m.total_assessments).toBe(2); });
    it("counts poor_match for poor_match", () => { const m = computePlacementMatchingMetrics([makeRecord({ match_quality: "poor_match" })]); expect(m.poor_match_count).toBe(1); });
    it("counts poor_match for unsuitable", () => { const m = computePlacementMatchingMetrics([makeRecord({ match_quality: "unsuitable" })]); expect(m.poor_match_count).toBe(1); });
    it("does not count adequate_match as poor", () => { const m = computePlacementMatchingMetrics([makeRecord({ match_quality: "adequate_match" })]); expect(m.poor_match_count).toBe(0); });
    it("counts negative_impact for negative", () => { const m = computePlacementMatchingMetrics([makeRecord({ impact_level: "negative" })]); expect(m.negative_impact_count).toBe(1); });
    it("counts negative_impact for very_negative", () => { const m = computePlacementMatchingMetrics([makeRecord({ impact_level: "very_negative" })]); expect(m.negative_impact_count).toBe(1); });
    it("counts unsuitable_count", () => { const m = computePlacementMatchingMetrics([makeRecord({ match_quality: "unsuitable" })]); expect(m.unsuitable_count).toBe(1); });
    it("counts pre_admission_count", () => { const m = computePlacementMatchingMetrics([makeRecord()]); expect(m.pre_admission_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computePlacementMatchingMetrics([makeRecord()]);
      expect(m.child_views_rate).toBe(100);
      expect(m.existing_children_rate).toBe(100);
      expect(m.staff_consulted_rate).toBe(100);
      expect(m.risk_assessment_rate).toBe(100);
      expect(m.impact_assessed_rate).toBe(100);
      expect(m.cultural_needs_rate).toBe(100);
      expect(m.education_access_rate).toBe(100);
      expect(m.health_access_rate).toBe(100);
      expect(m.family_contact_rate).toBe(100);
      expect(m.matching_panel_rate).toBe(100);
      expect(m.contingency_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_views_rate 0 when false", () => { expect(computePlacementMatchingMetrics([makeRecord({ child_views_sought: false })]).child_views_rate).toBe(0); });
    it("mixed boolean rate 66.7", () => { const m = computePlacementMatchingMetrics([makeRecord({ child_views_sought: true }), makeRecord({ child_views_sought: false }), makeRecord({ child_views_sought: true })]); expect(m.child_views_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computePlacementMatchingMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 matching domains", () => { const domains = ["peer_dynamics","location_access","education_provision","health_provision","cultural_match","identity_needs","risk_compatibility","staff_skills_match","family_contact","other"] as const; const records = domains.map(d => makeRecord({ matching_domain: d })); const m = computePlacementMatchingMetrics(records); for (const d of domains) expect(m.by_matching_domain[d]).toBe(1); });
    it("counts all 5 match qualities", () => { const qualities = ["excellent_match","good_match","adequate_match","poor_match","unsuitable"] as const; const records = qualities.map(q => makeRecord({ match_quality: q })); const m = computePlacementMatchingMetrics(records); for (const q of qualities) expect(m.by_match_quality[q]).toBe(1); });
    it("counts all 10 assessment timings", () => { const timings = ["pre_admission","72_hour_review","2_week_review","monthly_review","quarterly_review","triggered_review","annual_review","disruption_review","transition_review","other"] as const; const records = timings.map(t => makeRecord({ assessment_timing: t })); const m = computePlacementMatchingMetrics(records); for (const t of timings) expect(m.by_assessment_timing[t]).toBe(1); });
    it("counts all 5 impact levels", () => { const levels = ["very_positive","positive","neutral","negative","very_negative"] as const; const records = levels.map(l => makeRecord({ impact_level: l })); const m = computePlacementMatchingMetrics(records); for (const l of levels) expect(m.by_impact_level[l]).toBe(1); });
  });

  describe("identifyPlacementMatchingAlerts", () => {
    it("returns empty for clean", () => { expect(identifyPlacementMatchingAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyPlacementMatchingAlerts([])).toEqual([]); });
    it("fires unsuitable_negative critical for unsuitable + negative", () => { 
      const a = identifyPlacementMatchingAlerts([makeRecord({ match_quality: "unsuitable", impact_level: "negative", child_name: "X" })]);
      expect(a[0].type).toBe("unsuitable_negative");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("X");
    });
    it("fires unsuitable_negative for unsuitable + very_negative", () => { const a = identifyPlacementMatchingAlerts([makeRecord({ match_quality: "unsuitable", impact_level: "very_negative" })]); expect(a.find(x => x.type === "unsuitable_negative")).toBeDefined(); });
    it("no critical when poor_match + negative", () => { const a = identifyPlacementMatchingAlerts([makeRecord({ match_quality: "poor_match", impact_level: "negative" })]); expect(a.filter(x => x.type === "unsuitable_negative")).toHaveLength(0); });
    it("no critical when unsuitable + neutral", () => { const a = identifyPlacementMatchingAlerts([makeRecord({ match_quality: "unsuitable", impact_level: "neutral" })]); expect(a.filter(x => x.type === "unsuitable_negative")).toHaveLength(0); });
    it("unsuitable_negative per-record", () => { 
      const a = identifyPlacementMatchingAlerts([makeRecord({ id: "a-1", match_quality: "unsuitable", impact_level: "negative" }), makeRecord({ id: "a-2", match_quality: "unsuitable", impact_level: "very_negative" })]);
      const matched = a.filter(x => x.type === "unsuitable_negative");
      expect(matched).toHaveLength(2);
      expect(matched[0].record_id).toBe("a-1");
      expect(matched[1].record_id).toBe("a-2");
    });
    it("fires child_views_not_sought high", () => { 
      const a = identifyPlacementMatchingAlerts([makeRecord({ child_views_sought: false })]);
      const f = a.find(x => x.type === "child_views_not_sought");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 assessment has");
    });
    it("fires existing_children_not_consulted high", () => { 
      const a = identifyPlacementMatchingAlerts([makeRecord({ existing_children_consulted: false })]);
      const f = a.find(x => x.type === "existing_children_not_consulted");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 assessment has");
    });
    it("no_contingency_planned not for 1", () => { expect(identifyPlacementMatchingAlerts([makeRecord({ contingency_planned: false })]).find(x => x.type === "no_contingency_planned")).toBeUndefined(); });
    it("no_contingency_planned fires for 2 medium", () => { const a = identifyPlacementMatchingAlerts([makeRecord({ contingency_planned: false }), makeRecord({ contingency_planned: false })]); const f = a.find(x => x.type === "no_contingency_planned"); expect(f).toBeDefined(); expect(f!.severity).toBe("medium"); });
    it("no_risk_assessment not for 1", () => { expect(identifyPlacementMatchingAlerts([makeRecord({ risk_assessment_completed: false })]).find(x => x.type === "no_risk_assessment")).toBeUndefined(); });
    it("no_risk_assessment fires for 2 medium", () => { const a = identifyPlacementMatchingAlerts([makeRecord({ risk_assessment_completed: false }), makeRecord({ risk_assessment_completed: false })]); const f = a.find(x => x.type === "no_risk_assessment"); expect(f).toBeDefined(); expect(f!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyPlacementMatchingAlerts([makeRecord({ match_quality: "unsuitable", impact_level: "negative", child_views_sought: false, existing_children_consulted: false, contingency_planned: false, risk_assessment_completed: false }), makeRecord({ contingency_planned: false, risk_assessment_completed: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("unsuitable_negative");
      expect(types).toContain("child_views_not_sought");
      expect(types).toContain("existing_children_not_consulted");
      expect(types).toContain("no_contingency_planned");
      expect(types).toContain("no_risk_assessment");
    });
  });
});
