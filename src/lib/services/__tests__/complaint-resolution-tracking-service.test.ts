import { describe, it, expect } from "vitest";
import { _testing, type ComplaintResolutionTrackingRecord } from "../complaint-resolution-tracking-service";

const { computeComplaintResolutionMetrics, identifyComplaintResolutionAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<ComplaintResolutionTrackingRecord>): ComplaintResolutionTrackingRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    complaint_category: overrides?.complaint_category ?? "care_quality",
    resolution_status: overrides?.resolution_status ?? "resolved",
    outcome_type: overrides?.outcome_type ?? "not_upheld",
    response_timeline: overrides?.response_timeline ?? "within_7_days",
    complaint_date: overrides?.complaint_date ?? now.toISOString().split("T")[0],
    complainant_name: overrides?.complainant_name ?? "Parent A",
    handled_by: overrides?.handled_by ?? "Staff A",
    acknowledged_promptly: overrides?.acknowledged_promptly ?? true,
    investigation_thorough: overrides?.investigation_thorough ?? true,
    child_views_sought: overrides?.child_views_sought ?? true,
    complainant_updated: overrides?.complainant_updated ?? true,
    ofsted_notified: overrides?.ofsted_notified ?? true,
    learning_identified: overrides?.learning_identified ?? true,
    action_plan_created: overrides?.action_plan_created ?? true,
    outcome_communicated: overrides?.outcome_communicated ?? true,
    satisfaction_assessed: overrides?.satisfaction_assessed ?? true,
    appeal_offered: overrides?.appeal_offered ?? true,
    records_updated: overrides?.records_updated ?? true,
    manager_oversight: overrides?.manager_oversight ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    resolution_days: overrides?.resolution_days ?? 7,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("complaint-resolution-tracking-service", () => {
  describe("computeComplaintResolutionMetrics", () => {
    it("returns zeros for empty", () => { const m = computeComplaintResolutionMetrics([]); expect(m.total_complaints).toBe(0); expect(m.upheld_count).toBe(0); expect(m.escalated_count).toBe(0); expect(m.overdue_count).toBe(0); expect(m.pending_count).toBe(0); expect(m.acknowledged_rate).toBe(0); expect(m.average_resolution_days).toBe(0); });
    it("returns empty breakdowns", () => { const m = computeComplaintResolutionMetrics([]); expect(m.by_complaint_category).toEqual({}); expect(m.by_resolution_status).toEqual({}); expect(m.by_outcome_type).toEqual({}); expect(m.by_response_timeline).toEqual({}); });
    it("total_complaints counts records", () => { expect(computeComplaintResolutionMetrics([makeRecord(), makeRecord()]).total_complaints).toBe(2); });
    it("counts upheld", () => { expect(computeComplaintResolutionMetrics([makeRecord({ outcome_type: "upheld" })]).upheld_count).toBe(1); });
    it("counts escalated", () => { expect(computeComplaintResolutionMetrics([makeRecord({ resolution_status: "escalated" })]).escalated_count).toBe(1); });
    it("counts overdue", () => { expect(computeComplaintResolutionMetrics([makeRecord({ response_timeline: "overdue" })]).overdue_count).toBe(1); });
    it("counts pending", () => { expect(computeComplaintResolutionMetrics([makeRecord({ outcome_type: "pending" })]).pending_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { const m = computeComplaintResolutionMetrics([makeRecord()]); expect(m.acknowledged_rate).toBe(100); expect(m.investigation_rate).toBe(100); expect(m.child_views_rate).toBe(100); expect(m.complainant_updated_rate).toBe(100); expect(m.ofsted_notified_rate).toBe(100); expect(m.learning_identified_rate).toBe(100); expect(m.action_plan_rate).toBe(100); expect(m.outcome_communicated_rate).toBe(100); expect(m.satisfaction_rate).toBe(100); expect(m.appeal_offered_rate).toBe(100); expect(m.records_updated_rate).toBe(100); expect(m.manager_oversight_rate).toBe(100); expect(m.recorded_promptly_rate).toBe(100); });
    it("acknowledged_rate 0 when false", () => { expect(computeComplaintResolutionMetrics([makeRecord({ acknowledged_promptly: false })]).acknowledged_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeComplaintResolutionMetrics([makeRecord({ learning_identified: true }), makeRecord({ learning_identified: false }), makeRecord({ learning_identified: true })]); expect(m.learning_identified_rate).toBe(66.7); });
    it("average_resolution_days correct", () => { const m = computeComplaintResolutionMetrics([makeRecord({ resolution_days: 5 }), makeRecord({ resolution_days: 15 })]); expect(m.average_resolution_days).toBe(10); });
    it("counts all 10 complaint categories", () => { const cats = ["care_quality","staff_conduct","safeguarding","medication","environment","food_nutrition","education","contact_arrangements","discrimination","other"] as const; const records = cats.map(c => makeRecord({ complaint_category: c })); const m = computeComplaintResolutionMetrics(records); for (const c of cats) expect(m.by_complaint_category[c]).toBe(1); });
    it("counts all 5 resolution statuses", () => { const statuses = ["received","investigating","resolved","escalated","withdrawn"] as const; const records = statuses.map(s => makeRecord({ resolution_status: s })); const m = computeComplaintResolutionMetrics(records); for (const s of statuses) expect(m.by_resolution_status[s]).toBe(1); });
    it("counts all 5 outcome types", () => { const outcomes = ["upheld","partially_upheld","not_upheld","withdrawn","pending"] as const; const records = outcomes.map(o => makeRecord({ outcome_type: o })); const m = computeComplaintResolutionMetrics(records); for (const o of outcomes) expect(m.by_outcome_type[o]).toBe(1); });
    it("counts all 5 response timelines", () => { const timelines = ["within_24h","within_3_days","within_7_days","within_28_days","overdue"] as const; const records = timelines.map(t => makeRecord({ response_timeline: t })); const m = computeComplaintResolutionMetrics(records); for (const t of timelines) expect(m.by_response_timeline[t]).toBe(1); });
  });

  describe("identifyComplaintResolutionAlerts", () => {
    it("returns empty for clean", () => { expect(identifyComplaintResolutionAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyComplaintResolutionAlerts([])).toEqual([]); });
    it("fires safeguarding_complaint_open", () => { const a = identifyComplaintResolutionAlerts([makeRecord({ complaint_category: "safeguarding", resolution_status: "investigating", complainant_name: "Parent Jo" })]); expect(a[0].type).toBe("safeguarding_complaint_open"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Parent Jo"); });
    it("safeguarding resolved no alert", () => { expect(identifyComplaintResolutionAlerts([makeRecord({ complaint_category: "safeguarding", resolution_status: "resolved" })]).find(x => x.type === "safeguarding_complaint_open")).toBeUndefined(); });
    it("safeguarding escalated no alert", () => { expect(identifyComplaintResolutionAlerts([makeRecord({ complaint_category: "safeguarding", resolution_status: "escalated" })]).find(x => x.type === "safeguarding_complaint_open")).toBeUndefined(); });
    it("fires response_overdue singular", () => { const a = identifyComplaintResolutionAlerts([makeRecord({ response_timeline: "overdue" })]); const f = a.find(x => x.type === "response_overdue"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 complaint has"); });
    it("response_overdue plural", () => { const a = identifyComplaintResolutionAlerts([makeRecord({ response_timeline: "overdue" }), makeRecord({ response_timeline: "overdue" })]); const f = a.find(x => x.type === "response_overdue"); expect(f!.message).toContain("2 complaints have"); });
    it("fires no_learning_identified singular", () => { const a = identifyComplaintResolutionAlerts([makeRecord({ learning_identified: false })]); const f = a.find(x => x.type === "no_learning_identified"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 complaint has"); });
    it("satisfaction_not_assessed not for 1", () => { expect(identifyComplaintResolutionAlerts([makeRecord({ satisfaction_assessed: false })]).find(x => x.type === "satisfaction_not_assessed")).toBeUndefined(); });
    it("satisfaction_not_assessed fires for 2", () => { const a = identifyComplaintResolutionAlerts([makeRecord({ satisfaction_assessed: false }), makeRecord({ satisfaction_assessed: false })]); expect(a.find(x => x.type === "satisfaction_not_assessed")).toBeDefined(); expect(a.find(x => x.type === "satisfaction_not_assessed")!.severity).toBe("medium"); });
    it("appeal_not_offered not for 1", () => { expect(identifyComplaintResolutionAlerts([makeRecord({ appeal_offered: false })]).find(x => x.type === "appeal_not_offered")).toBeUndefined(); });
    it("appeal_not_offered fires for 2", () => { const a = identifyComplaintResolutionAlerts([makeRecord({ appeal_offered: false }), makeRecord({ appeal_offered: false })]); expect(a.find(x => x.type === "appeal_not_offered")).toBeDefined(); expect(a.find(x => x.type === "appeal_not_offered")!.severity).toBe("medium"); });
    it("fires all applicable", () => { const a = identifyComplaintResolutionAlerts([makeRecord({ complaint_category: "safeguarding", resolution_status: "received", response_timeline: "overdue", learning_identified: false, satisfaction_assessed: false, appeal_offered: false }), makeRecord({ response_timeline: "overdue", learning_identified: false, satisfaction_assessed: false, appeal_offered: false })]); const types = a.map(x => x.type); expect(types).toContain("safeguarding_complaint_open"); expect(types).toContain("response_overdue"); expect(types).toContain("no_learning_identified"); expect(types).toContain("satisfaction_not_assessed"); expect(types).toContain("appeal_not_offered"); });
  });
});
