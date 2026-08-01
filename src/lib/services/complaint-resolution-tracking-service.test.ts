import { describe, it, expect } from "vitest";
import {
  computeComplaintResolutionMetrics,
  identifyComplaintResolutionAlerts,
  type ComplaintResolutionTrackingRecord,
} from "./complaint-resolution-tracking-service";

function makeRecord(overrides: Partial<ComplaintResolutionTrackingRecord> = {}): ComplaintResolutionTrackingRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    complaint_category: "care_quality",
    resolution_status: "resolved",
    outcome_type: "upheld",
    response_timeline: "within_7_days",
    complaint_date: "2026-05-01",
    complainant_name: "Jane Doe",
    handled_by: "manager-1",
    acknowledged_promptly: true,
    investigation_thorough: true,
    child_views_sought: true,
    complainant_updated: true,
    ofsted_notified: false,
    learning_identified: true,
    action_plan_created: true,
    outcome_communicated: true,
    satisfaction_assessed: true,
    appeal_offered: true,
    records_updated: true,
    manager_oversight: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    resolution_days: 5,
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T08:00:00Z",
    updated_at: "2026-05-06T08:00:00Z",
    ...overrides,
  };
}

describe("computeComplaintResolutionMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeComplaintResolutionMetrics([]);
    expect(m.total_complaints).toBe(0);
    expect(m.upheld_count).toBe(0);
    expect(m.average_resolution_days).toBeNull();;
    expect(m.acknowledged_rate).toBeNull();;
  });

  it("counts statuses and outcomes correctly", () => {
    const records = [
      makeRecord({ id: "r1", outcome_type: "upheld", resolution_status: "resolved", response_timeline: "within_24h" }),
      makeRecord({ id: "r2", outcome_type: "not_upheld", resolution_status: "escalated", response_timeline: "overdue" }),
      makeRecord({ id: "r3", outcome_type: "pending", resolution_status: "investigating", response_timeline: "within_3_days" }),
    ];
    const m = computeComplaintResolutionMetrics(records);
    expect(m.total_complaints).toBe(3);
    expect(m.upheld_count).toBe(1);
    expect(m.escalated_count).toBe(1);
    expect(m.overdue_count).toBe(1);
    expect(m.pending_count).toBe(1);
    expect(m.by_outcome_type.upheld).toBe(1);
    expect(m.by_resolution_status.escalated).toBe(1);
    expect(m.by_response_timeline.overdue).toBe(1);
  });

  it("computes boolean rates and average resolution days", () => {
    const records = [
      makeRecord({ id: "r1", acknowledged_promptly: true, learning_identified: true, resolution_days: 3 }),
      makeRecord({ id: "r2", acknowledged_promptly: false, learning_identified: false, resolution_days: 7 }),
    ];
    const m = computeComplaintResolutionMetrics(records);
    expect(m.acknowledged_rate).toBe(50);
    expect(m.learning_identified_rate).toBe(50);
    expect(m.average_resolution_days).toBe(5); // (3+7)/2
  });

  it("counts by complaint category", () => {
    const records = [
      makeRecord({ id: "r1", complaint_category: "staff_conduct" }),
      makeRecord({ id: "r2", complaint_category: "staff_conduct" }),
      makeRecord({ id: "r3", complaint_category: "safeguarding" }),
    ];
    const m = computeComplaintResolutionMetrics(records);
    expect(m.by_complaint_category.staff_conduct).toBe(2);
    expect(m.by_complaint_category.safeguarding).toBe(1);
  });
});

describe("identifyComplaintResolutionAlerts", () => {
  it("returns empty alerts for empty data", () => {
    const alerts = identifyComplaintResolutionAlerts([]);
    expect(alerts).toEqual([]);
  });

  it("flags safeguarding complaint not escalated/resolved", () => {
    const records = [
      makeRecord({ complaint_category: "safeguarding", resolution_status: "investigating" }),
    ];
    const alerts = identifyComplaintResolutionAlerts(records);
    const sgAlerts = alerts.filter((a) => a.type === "safeguarding_complaint_open");
    expect(sgAlerts).toHaveLength(1);
    expect(sgAlerts[0].severity).toBe("critical");
  });

  it("does not flag resolved safeguarding complaint", () => {
    const records = [
      makeRecord({ complaint_category: "safeguarding", resolution_status: "resolved" }),
    ];
    const alerts = identifyComplaintResolutionAlerts(records);
    const sgAlerts = alerts.filter((a) => a.type === "safeguarding_complaint_open");
    expect(sgAlerts).toHaveLength(0);
  });

  it("flags overdue responses (>=1)", () => {
    const records = [makeRecord({ response_timeline: "overdue" })];
    const alerts = identifyComplaintResolutionAlerts(records);
    const overdueAlerts = alerts.filter((a) => a.type === "response_overdue");
    expect(overdueAlerts).toHaveLength(1);
    expect(overdueAlerts[0].severity).toBe("high");
  });

  it("flags no learning identified (>=1)", () => {
    const records = [makeRecord({ learning_identified: false })];
    const alerts = identifyComplaintResolutionAlerts(records);
    const learningAlerts = alerts.filter((a) => a.type === "no_learning_identified");
    expect(learningAlerts).toHaveLength(1);
    expect(learningAlerts[0].severity).toBe("high");
  });

  it("flags satisfaction not assessed (>=2)", () => {
    const records = [
      makeRecord({ id: "r1", satisfaction_assessed: false }),
      makeRecord({ id: "r2", satisfaction_assessed: false }),
    ];
    const alerts = identifyComplaintResolutionAlerts(records);
    const satAlerts = alerts.filter((a) => a.type === "satisfaction_not_assessed");
    expect(satAlerts).toHaveLength(1);
    expect(satAlerts[0].severity).toBe("medium");
  });

  it("flags appeal not offered (>=2)", () => {
    const records = [
      makeRecord({ id: "r1", appeal_offered: false }),
      makeRecord({ id: "r2", appeal_offered: false }),
    ];
    const alerts = identifyComplaintResolutionAlerts(records);
    const appealAlerts = alerts.filter((a) => a.type === "appeal_not_offered");
    expect(appealAlerts).toHaveLength(1);
    expect(appealAlerts[0].severity).toBe("medium");
  });
});
