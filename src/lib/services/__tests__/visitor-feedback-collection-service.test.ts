import { describe, it, expect } from "vitest";
import { _testing, type VisitorFeedbackCollectionRecord } from "../visitor-feedback-collection-service";
import { todayStr } from "@/lib/utils";

const { computeVisitorFeedbackMetrics, identifyVisitorFeedbackAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<VisitorFeedbackCollectionRecord>): VisitorFeedbackCollectionRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    visitor_type: overrides?.visitor_type ?? "parent",
    feedback_rating: overrides?.feedback_rating ?? "good",
    visit_purpose: overrides?.visit_purpose ?? "family_contact",
    satisfaction_level: overrides?.satisfaction_level ?? "satisfied",
    visit_date: overrides?.visit_date ?? todayStr(),
    visitor_name: overrides?.visitor_name ?? "Parent A",
    collected_by: overrides?.collected_by ?? "Staff A",
    feedback_sought_proactively: overrides?.feedback_sought_proactively ?? true,
    child_views_included: overrides?.child_views_included ?? true,
    environment_commented: overrides?.environment_commented ?? true,
    staff_interaction_positive: overrides?.staff_interaction_positive ?? true,
    concerns_raised: overrides?.concerns_raised ?? false,
    complaints_linked: overrides?.complaints_linked ?? false,
    action_plan_created: overrides?.action_plan_created ?? true,
    feedback_shared_with_team: overrides?.feedback_shared_with_team ?? true,
    improvement_identified: overrides?.improvement_identified ?? true,
    follow_up_arranged: overrides?.follow_up_arranged ?? true,
    anonymity_offered: overrides?.anonymity_offered ?? true,
    manager_reviewed: overrides?.manager_reviewed ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("visitor-feedback-collection-service", () => {
  describe("computeVisitorFeedbackMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeVisitorFeedbackMetrics([]);
      expect(m.total_feedback).toBe(0);;
      expect(m.poor_rating_count).toBe(0);
      expect(m.very_poor_rating_count).toBe(0);
      expect(m.dissatisfied_count).toBe(0);
      expect(m.concerns_raised_count).toBe(0);
      expect(m.feedback_sought_rate).toBeNull();;
    });
    it("returns empty breakdowns", () => { 
      const m = computeVisitorFeedbackMetrics([]);
      expect(m.by_visitor_type).toEqual({});
      expect(m.by_feedback_rating).toEqual({});
      expect(m.by_visit_purpose).toEqual({});
      expect(m.by_satisfaction_level).toEqual({});
    });
    it("total_feedback counts records", () => { expect(computeVisitorFeedbackMetrics([makeRecord(), makeRecord()]).total_feedback).toBe(2); });
    it("counts poor_rating", () => { expect(computeVisitorFeedbackMetrics([makeRecord({ feedback_rating: "poor" })]).poor_rating_count).toBe(1); });
    it("counts very_poor_rating", () => { expect(computeVisitorFeedbackMetrics([makeRecord({ feedback_rating: "very_poor" })]).very_poor_rating_count).toBe(1); });
    it("does not count satisfactory as poor", () => { expect(computeVisitorFeedbackMetrics([makeRecord({ feedback_rating: "satisfactory" })]).poor_rating_count).toBe(0); });
    it("counts dissatisfied", () => { expect(computeVisitorFeedbackMetrics([makeRecord({ satisfaction_level: "dissatisfied" })]).dissatisfied_count).toBe(1); });
    it("counts very_dissatisfied in dissatisfied", () => { expect(computeVisitorFeedbackMetrics([makeRecord({ satisfaction_level: "very_dissatisfied" })]).dissatisfied_count).toBe(1); });
    it("does not count neutral as dissatisfied", () => { expect(computeVisitorFeedbackMetrics([makeRecord({ satisfaction_level: "neutral" })]).dissatisfied_count).toBe(0); });
    it("counts concerns_raised", () => { expect(computeVisitorFeedbackMetrics([makeRecord({ concerns_raised: true })]).concerns_raised_count).toBe(1); });
    it("does not count concerns_raised false", () => { expect(computeVisitorFeedbackMetrics([makeRecord({ concerns_raised: false })]).concerns_raised_count).toBe(0); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeVisitorFeedbackMetrics([makeRecord()]);
      expect(m.feedback_sought_rate).toBe(100);
      expect(m.child_views_rate).toBe(100);
      expect(m.environment_commented_rate).toBe(100);
      expect(m.staff_interaction_rate).toBe(100);
      expect(m.action_plan_rate).toBe(100);
      expect(m.feedback_shared_rate).toBe(100);
      expect(m.improvement_rate).toBe(100);
      expect(m.follow_up_rate).toBe(100);
      expect(m.anonymity_rate).toBe(100);
      expect(m.manager_reviewed_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("feedback_sought_rate 0 when false", () => { expect(computeVisitorFeedbackMetrics([makeRecord({ feedback_sought_proactively: false })]).feedback_sought_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeVisitorFeedbackMetrics([makeRecord({ improvement_identified: true }), makeRecord({ improvement_identified: false }), makeRecord({ improvement_identified: true })]); expect(m.improvement_rate).toBe(66.7); });
    it("counts all 10 visitor types", () => { const types = ["parent","social_worker","independent_visitor","advocate","therapist","education_professional","health_professional","ofsted_inspector","reg44_visitor","other"] as const; const records = types.map(t => makeRecord({ visitor_type: t })); const m = computeVisitorFeedbackMetrics(records); for (const t of types) expect(m.by_visitor_type[t]).toBe(1); });
    it("counts all 5 feedback ratings", () => { const ratings = ["excellent","good","satisfactory","poor","very_poor"] as const; const records = ratings.map(r => makeRecord({ feedback_rating: r })); const m = computeVisitorFeedbackMetrics(records); for (const r of ratings) expect(m.by_feedback_rating[r]).toBe(1); });
    it("counts all 10 visit purposes", () => { const purposes = ["family_contact","professional_review","inspection","therapy_session","social_work_visit","advocacy_visit","health_appointment","education_meeting","reg44_visit","other"] as const; const records = purposes.map(p => makeRecord({ visit_purpose: p })); const m = computeVisitorFeedbackMetrics(records); for (const p of purposes) expect(m.by_visit_purpose[p]).toBe(1); });
    it("counts all 5 satisfaction levels", () => { const levels = ["very_satisfied","satisfied","neutral","dissatisfied","very_dissatisfied"] as const; const records = levels.map(l => makeRecord({ satisfaction_level: l })); const m = computeVisitorFeedbackMetrics(records); for (const l of levels) expect(m.by_satisfaction_level[l]).toBe(1); });
  });

  describe("identifyVisitorFeedbackAlerts", () => {
    it("returns empty for clean", () => { expect(identifyVisitorFeedbackAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyVisitorFeedbackAlerts([])).toEqual([]); });
    it("fires very_poor_with_concerns", () => { 
      const a = identifyVisitorFeedbackAlerts([makeRecord({ feedback_rating: "very_poor", concerns_raised: true, visitor_name: "Dr Smith", visitor_type: "health_professional" })]);
      expect(a[0].type).toBe("very_poor_with_concerns");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Dr Smith");
      expect(a[0].message).toContain("health professional");
    });
    it("very_poor_with_concerns per-record", () => { const a = identifyVisitorFeedbackAlerts([makeRecord({ id: "a-1", feedback_rating: "very_poor", concerns_raised: true }), makeRecord({ id: "a-2", feedback_rating: "very_poor", concerns_raised: true })]); expect(a.filter(x => x.type === "very_poor_with_concerns")).toHaveLength(2); });
    it("very_poor without concerns no critical alert", () => { expect(identifyVisitorFeedbackAlerts([makeRecord({ feedback_rating: "very_poor", concerns_raised: false })]).find(x => x.type === "very_poor_with_concerns")).toBeUndefined(); });
    it("poor with concerns no critical alert", () => { expect(identifyVisitorFeedbackAlerts([makeRecord({ feedback_rating: "poor", concerns_raised: true })]).find(x => x.type === "very_poor_with_concerns")).toBeUndefined(); });
    it("fires no_improvement_identified singular", () => { 
      const a = identifyVisitorFeedbackAlerts([makeRecord({ improvement_identified: false })]);
      const f = a.find(x => x.type === "no_improvement_identified");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 feedback has");
    });
    it("no_improvement_identified plural", () => { const a = identifyVisitorFeedbackAlerts([makeRecord({ improvement_identified: false }), makeRecord({ improvement_identified: false })]); const f = a.find(x => x.type === "no_improvement_identified"); expect(f!.message).toContain("2 feedbacks have"); });
    it("fires feedback_not_shared singular", () => { 
      const a = identifyVisitorFeedbackAlerts([makeRecord({ feedback_shared_with_team: false })]);
      const f = a.find(x => x.type === "feedback_not_shared");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 feedback has");
    });
    it("feedback_not_shared plural", () => { const a = identifyVisitorFeedbackAlerts([makeRecord({ feedback_shared_with_team: false }), makeRecord({ feedback_shared_with_team: false })]); const f = a.find(x => x.type === "feedback_not_shared"); expect(f!.message).toContain("2 feedbacks have"); });
    it("no_follow_up not for 1", () => { expect(identifyVisitorFeedbackAlerts([makeRecord({ follow_up_arranged: false })]).find(x => x.type === "no_follow_up")).toBeUndefined(); });
    it("no_follow_up fires for 2", () => { const a = identifyVisitorFeedbackAlerts([makeRecord({ follow_up_arranged: false }), makeRecord({ follow_up_arranged: false })]); expect(a.find(x => x.type === "no_follow_up")).toBeDefined(); expect(a.find(x => x.type === "no_follow_up")!.severity).toBe("medium"); });
    it("manager_not_reviewed not for 1", () => { expect(identifyVisitorFeedbackAlerts([makeRecord({ manager_reviewed: false })]).find(x => x.type === "manager_not_reviewed")).toBeUndefined(); });
    it("manager_not_reviewed fires for 2", () => { const a = identifyVisitorFeedbackAlerts([makeRecord({ manager_reviewed: false }), makeRecord({ manager_reviewed: false })]); expect(a.find(x => x.type === "manager_not_reviewed")).toBeDefined(); expect(a.find(x => x.type === "manager_not_reviewed")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyVisitorFeedbackAlerts([makeRecord({ feedback_rating: "very_poor", concerns_raised: true, improvement_identified: false, feedback_shared_with_team: false, follow_up_arranged: false, manager_reviewed: false }), makeRecord({ improvement_identified: false, feedback_shared_with_team: false, follow_up_arranged: false, manager_reviewed: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("very_poor_with_concerns");
      expect(types).toContain("no_improvement_identified");
      expect(types).toContain("feedback_not_shared");
      expect(types).toContain("no_follow_up");
      expect(types).toContain("manager_not_reviewed");
    });
  });
});
