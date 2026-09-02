import { describe, it, expect } from "vitest";
import { _testing, type StaffPatternInsightRecord } from "../staff-pattern-intelligence-service";
import { todayStr } from "@/lib/utils";

const { computePatternInsightMetrics, identifyPatternInsightAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<StaffPatternInsightRecord>): StaffPatternInsightRecord {
  return {
    id: "a-1", home_id: "home-1",
    insight_type: "repeated_strength",
    insight_severity: "informational",
    confidence_level: "high",
    insight_status: "reviewed",
    session_date: todayStr(),
    staff_name: "Staff A",
    staff_id: "staff_id" in (overrides ?? {}) ? (overrides!.staff_id ?? null) : null,
    identified_by: "Manager A",
    title: "Test Insight",
    description: "Test description",
    evidence_summary: "Test evidence",
    period_start: "period_start" in (overrides ?? {}) ? (overrides!.period_start ?? null) : null,
    period_end: "period_end" in (overrides ?? {}) ? (overrides!.period_end ?? null) : null,
    context: "context" in (overrides ?? {}) ? (overrides!.context ?? null) : null,
    alternative_explanations: "alternative_explanations" in (overrides ?? {}) ? (overrides!.alternative_explanations ?? null) : null,
    manager_notes: "manager_notes" in (overrides ?? {}) ? (overrides!.manager_notes ?? null) : null,
    staff_comment: "staff_comment" in (overrides ?? {}) ? (overrides!.staff_comment ?? null) : null,
    evidence_verified: true,
    context_provided: true,
    alternative_explanations_considered: true,
    manager_reviewed: true,
    staff_notified: true,
    staff_commented: true,
    action_plan_created: true,
    support_offered: true,
    training_identified: true,
    supervision_discussed: true,
    wellbeing_checked: true,
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

describe("staff-pattern-intelligence-service", () => {
  describe("computePatternInsightMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computePatternInsightMetrics([]);
      expect(m.total_insights).toBe(0);;
      expect(m.manager_review_count).toBe(0);
      expect(m.support_recommended_count).toBe(0);
      expect(m.low_confidence_count).toBe(0);
      expect(m.unreviewed_count).toBe(0);
      expect(m.concern_count).toBe(0);
      expect(m.strength_count).toBe(0);
      expect(m.evidence_verified_rate).toBeNull();;
      expect(m.unique_staff).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computePatternInsightMetrics([]);
      expect(m.by_insight_type).toEqual({});
      expect(m.by_insight_severity).toEqual({});
      expect(m.by_confidence_level).toEqual({});
      expect(m.by_insight_status).toEqual({});
    });
    it("total_insights counts records", () => { expect(computePatternInsightMetrics([makeRecord(), makeRecord()]).total_insights).toBe(2); });
    it("counts manager_review_required", () => { expect(computePatternInsightMetrics([makeRecord({ insight_severity: "manager_review_required" })]).manager_review_count).toBe(1); });
    it("does not count support_recommended as manager_review", () => { expect(computePatternInsightMetrics([makeRecord({ insight_severity: "support_recommended" })]).manager_review_count).toBe(0); });
    it("counts support_recommended", () => { expect(computePatternInsightMetrics([makeRecord({ insight_severity: "support_recommended" })]).support_recommended_count).toBe(1); });
    it("counts low confidence", () => { expect(computePatternInsightMetrics([makeRecord({ confidence_level: "low" })]).low_confidence_count).toBe(1); });
    it("counts very_low as low confidence", () => { expect(computePatternInsightMetrics([makeRecord({ confidence_level: "very_low" })]).low_confidence_count).toBe(1); });
    it("does not count medium as low confidence", () => { expect(computePatternInsightMetrics([makeRecord({ confidence_level: "medium" })]).low_confidence_count).toBe(0); });
    it("counts draft as unreviewed", () => { expect(computePatternInsightMetrics([makeRecord({ insight_status: "draft" })]).unreviewed_count).toBe(1); });
    it("counts pending_review as unreviewed", () => { expect(computePatternInsightMetrics([makeRecord({ insight_status: "pending_review" })]).unreviewed_count).toBe(1); });
    it("does not count reviewed as unreviewed", () => { expect(computePatternInsightMetrics([makeRecord({ insight_status: "reviewed" })]).unreviewed_count).toBe(0); });
    it("counts repeated_concern as concern", () => { expect(computePatternInsightMetrics([makeRecord({ insight_type: "repeated_concern" })]).concern_count).toBe(1); });
    it("counts performance_dip as concern", () => { expect(computePatternInsightMetrics([makeRecord({ insight_type: "performance_dip" })]).concern_count).toBe(1); });
    it("counts repeated_strength as strength", () => { expect(computePatternInsightMetrics([makeRecord({ insight_type: "repeated_strength" })]).strength_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computePatternInsightMetrics([makeRecord()]);
      expect(m.evidence_verified_rate).toBe(100);
      expect(m.context_provided_rate).toBe(100);
      expect(m.alternatives_considered_rate).toBe(100);
      expect(m.manager_reviewed_rate).toBe(100);
      expect(m.staff_notified_rate).toBe(100);
      expect(m.staff_commented_rate).toBe(100);
      expect(m.action_plan_rate).toBe(100);
      expect(m.support_offered_rate).toBe(100);
      expect(m.training_identified_rate).toBe(100);
      expect(m.supervision_discussed_rate).toBe(100);
      expect(m.wellbeing_checked_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("evidence_verified_rate 0 when false", () => { expect(computePatternInsightMetrics([makeRecord({ evidence_verified: false })]).evidence_verified_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computePatternInsightMetrics([makeRecord({ wellbeing_checked: true }), makeRecord({ wellbeing_checked: false }), makeRecord({ wellbeing_checked: true })]); expect(m.wellbeing_checked_rate).toBe(66.7); });
    it("unique_staff distinct", () => { const m = computePatternInsightMetrics([makeRecord({ staff_name: "A" }), makeRecord({ staff_name: "B" }), makeRecord({ staff_name: "A" })]); expect(m.unique_staff).toBe(2); });
    it("counts all 10 insight types", () => { const types = ["performance_dip","repeated_strength","repeated_concern","confidence_gap","training_gap","wellbeing_indicator","burnout_risk","relationship_pattern","recording_quality_change","task_avoidance"] as const; const records = types.map(t => makeRecord({ insight_type: t })); const m = computePatternInsightMetrics(records); for (const t of types) expect(m.by_insight_type[t]).toBe(1); });
    it("counts all 5 severities", () => { const sevs = ["informational","needs_exploration","pattern_emerging","support_recommended","manager_review_required"] as const; const records = sevs.map(s => makeRecord({ insight_severity: s })); const m = computePatternInsightMetrics(records); for (const s of sevs) expect(m.by_insight_severity[s]).toBe(1); });
    it("counts all 5 confidence levels", () => { const levels = ["very_high","high","medium","low","very_low"] as const; const records = levels.map(l => makeRecord({ confidence_level: l })); const m = computePatternInsightMetrics(records); for (const l of levels) expect(m.by_confidence_level[l]).toBe(1); });
    it("counts all 5 statuses", () => { const statuses = ["draft","pending_review","reviewed","actioned","dismissed"] as const; const records = statuses.map(s => makeRecord({ insight_status: s })); const m = computePatternInsightMetrics(records); for (const s of statuses) expect(m.by_insight_status[s]).toBe(1); });
  });

  describe("identifyPatternInsightAlerts", () => {
    it("returns empty for clean", () => { expect(identifyPatternInsightAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyPatternInsightAlerts([])).toEqual([]); });
    it("fires unreviewed_serious for support_recommended + draft", () => { 
      const a = identifyPatternInsightAlerts([makeRecord({ insight_severity: "support_recommended", insight_status: "draft", staff_name: "Jo" })]);
      expect(a[0].type).toBe("unreviewed_serious");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("fires unreviewed_serious for manager_review_required + pending_review", () => { const a = identifyPatternInsightAlerts([makeRecord({ insight_severity: "manager_review_required", insight_status: "pending_review" })]); expect(a[0].type).toBe("unreviewed_serious"); expect(a[0].severity).toBe("critical"); });
    it("unreviewed_serious per-record", () => { const a = identifyPatternInsightAlerts([makeRecord({ id: "a-1", insight_severity: "manager_review_required", insight_status: "draft" }), makeRecord({ id: "a-2", insight_severity: "support_recommended", insight_status: "pending_review" })]); expect(a.filter(x => x.type === "unreviewed_serious")).toHaveLength(2); });
    it("no critical when reviewed", () => { expect(identifyPatternInsightAlerts([makeRecord({ insight_severity: "manager_review_required", insight_status: "reviewed" })]).find(x => x.type === "unreviewed_serious")).toBeUndefined(); });
    it("no critical for informational", () => { expect(identifyPatternInsightAlerts([makeRecord({ insight_severity: "informational", insight_status: "draft" })]).find(x => x.type === "unreviewed_serious")).toBeUndefined(); });
    it("fires no_evidence_verified singular", () => { 
      const a = identifyPatternInsightAlerts([makeRecord({ evidence_verified: false })]);
      const f = a.find(x => x.type === "no_evidence_verified");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 insight has");
    });
    it("no_evidence_verified plural", () => { const a = identifyPatternInsightAlerts([makeRecord({ evidence_verified: false }), makeRecord({ evidence_verified: false })]); const f = a.find(x => x.type === "no_evidence_verified"); expect(f!.message).toContain("2 insights have"); });
    it("fires staff_not_notified singular", () => { 
      const a = identifyPatternInsightAlerts([makeRecord({ staff_notified: false })]);
      const f = a.find(x => x.type === "staff_not_notified");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 insight has");
    });
    it("no_alternatives_considered not for 1", () => { expect(identifyPatternInsightAlerts([makeRecord({ alternative_explanations_considered: false })]).find(x => x.type === "no_alternatives_considered")).toBeUndefined(); });
    it("no_alternatives_considered fires for 2", () => { const a = identifyPatternInsightAlerts([makeRecord({ alternative_explanations_considered: false }), makeRecord({ alternative_explanations_considered: false })]); expect(a.find(x => x.type === "no_alternatives_considered")).toBeDefined(); expect(a.find(x => x.type === "no_alternatives_considered")!.severity).toBe("medium"); });
    it("no_wellbeing_check not for 1", () => { expect(identifyPatternInsightAlerts([makeRecord({ wellbeing_checked: false })]).find(x => x.type === "no_wellbeing_check")).toBeUndefined(); });
    it("no_wellbeing_check fires for 2", () => { const a = identifyPatternInsightAlerts([makeRecord({ wellbeing_checked: false }), makeRecord({ wellbeing_checked: false })]); expect(a.find(x => x.type === "no_wellbeing_check")).toBeDefined(); expect(a.find(x => x.type === "no_wellbeing_check")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyPatternInsightAlerts([makeRecord({ insight_severity: "manager_review_required", insight_status: "draft", evidence_verified: false, staff_notified: false, alternative_explanations_considered: false, wellbeing_checked: false }), makeRecord({ evidence_verified: false, staff_notified: false, alternative_explanations_considered: false, wellbeing_checked: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("unreviewed_serious");
      expect(types).toContain("no_evidence_verified");
      expect(types).toContain("staff_not_notified");
      expect(types).toContain("no_alternatives_considered");
      expect(types).toContain("no_wellbeing_check");
    });
  });
});
