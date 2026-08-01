import { describe, it, expect } from "vitest";
import {
  computeComplaintMetrics,
  identifyComplaintAlerts,
  type ComplaintInvestigation,
} from "./complaints-investigation-service";

function makeRecord(overrides: Partial<ComplaintInvestigation> = {}): ComplaintInvestigation {
  return {
    id: "rec-1",
    home_id: "home-1",
    complaint_date: "2026-05-01",
    complaint_source: "parent_carer",
    complaint_category: "care_quality",
    investigation_stage: "resolved",
    complaint_outcome: "upheld",
    complainant_name: "Jane Doe",
    is_child_complaint: false,
    investigating_officer: "Officer A",
    acknowledged_within_24h: true,
    investigation_started_within_5_days: true,
    resolved_within_28_days: true,
    days_to_resolution: 14,
    learning_identified: true,
    learning_details: "Improved communication",
    actions_taken: ["Retrained staff"],
    ofsted_notified: false,
    complainant_satisfaction: "satisfied",
    review_date: null,
    notes: null,
    created_at: "2026-05-01T08:00:00Z",
    updated_at: "2026-05-15T08:00:00Z",
    ...overrides,
  };
}

describe("computeComplaintMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeComplaintMetrics([]);
    expect(m.total_complaints).toBe(0);
    expect(m.child_complaints).toBe(0);
    expect(m.open_complaints).toBe(0);
    expect(m.acknowledged_rate).toBeNull(); // fab-0.;
    expect(m.average_days_to_resolution).toBeNull(); // fab-0.;
    expect(m.satisfaction_rate).toBeNull(); // fab-0.;
  });

  it("counts statuses and outcomes correctly", () => {
    const records = [
      makeRecord({ id: "r1", investigation_stage: "received", complaint_outcome: "pending", is_child_complaint: true }),
      makeRecord({ id: "r2", investigation_stage: "resolved", complaint_outcome: "upheld" }),
      makeRecord({ id: "r3", investigation_stage: "escalated", complaint_outcome: "not_upheld" }),
      makeRecord({ id: "r4", investigation_stage: "withdrawn", complaint_outcome: "withdrawn" }),
    ];
    const m = computeComplaintMetrics(records);
    expect(m.total_complaints).toBe(4);
    expect(m.child_complaints).toBe(1);
    expect(m.open_complaints).toBe(2); // received + escalated
    expect(m.resolved_complaints).toBe(1);
    expect(m.escalated_complaints).toBe(1);
    expect(m.upheld_count).toBe(1);
    expect(m.not_upheld_count).toBe(1);
    expect(m.by_stage.received).toBe(1);
    expect(m.by_stage.resolved).toBe(1);
  });

  it("calculates acknowledgement and investigation rates", () => {
    const records = [
      makeRecord({ id: "r1", acknowledged_within_24h: true, investigation_started_within_5_days: true }),
      makeRecord({ id: "r2", acknowledged_within_24h: false, investigation_started_within_5_days: false }),
    ];
    const m = computeComplaintMetrics(records);
    expect(m.acknowledged_rate).toBe(50);
    expect(m.investigation_started_rate).toBe(50);
  });

  it("calculates resolved_within_28_days_rate excluding nulls", () => {
    const records = [
      makeRecord({ id: "r1", resolved_within_28_days: true }),
      makeRecord({ id: "r2", resolved_within_28_days: false }),
      makeRecord({ id: "r3", resolved_within_28_days: null }),
    ];
    const m = computeComplaintMetrics(records);
    // 1 of 2 with non-null = 50%
    expect(m.resolved_within_28_days_rate).toBe(50);
  });

  it("calculates average days to resolution", () => {
    const records = [
      makeRecord({ id: "r1", days_to_resolution: 10 }),
      makeRecord({ id: "r2", days_to_resolution: 20 }),
      makeRecord({ id: "r3", days_to_resolution: null }),
    ];
    const m = computeComplaintMetrics(records);
    expect(m.average_days_to_resolution).toBe(15);
  });

  it("calculates satisfaction rate from non-null/non-not_recorded entries", () => {
    const records = [
      makeRecord({ id: "r1", complainant_satisfaction: "satisfied" }),
      makeRecord({ id: "r2", complainant_satisfaction: "dissatisfied" }),
      makeRecord({ id: "r3", complainant_satisfaction: "not_recorded" }),
      makeRecord({ id: "r4", complainant_satisfaction: null }),
    ];
    const m = computeComplaintMetrics(records);
    // 1 satisfied of 2 valid = 50%
    expect(m.satisfaction_rate).toBe(50);
  });

  it("groups by source and category", () => {
    const records = [
      makeRecord({ id: "r1", complaint_source: "child", complaint_category: "safeguarding" }),
      makeRecord({ id: "r2", complaint_source: "child", complaint_category: "staff_conduct" }),
      makeRecord({ id: "r3", complaint_source: "staff", complaint_category: "safeguarding" }),
    ];
    const m = computeComplaintMetrics(records);
    expect(m.by_source.child).toBe(2);
    expect(m.by_source.staff).toBe(1);
    expect(m.by_category.safeguarding).toBe(2);
    expect(m.by_category.staff_conduct).toBe(1);
  });
});

describe("identifyComplaintAlerts", () => {
  it("returns empty alerts for empty data", () => {
    const alerts = identifyComplaintAlerts([]);
    expect(alerts).toEqual([]);
  });

  it("flags active safeguarding complaints", () => {
    const records = [
      makeRecord({ complaint_category: "safeguarding", investigation_stage: "investigating" }),
    ];
    const alerts = identifyComplaintAlerts(records);
    const sgAlerts = alerts.filter((a) => a.type === "safeguarding_complaint");
    expect(sgAlerts).toHaveLength(1);
    expect(sgAlerts[0].severity).toBe("critical");
  });

  it("does not flag resolved safeguarding complaint", () => {
    const records = [
      makeRecord({ complaint_category: "safeguarding", investigation_stage: "resolved" }),
    ];
    const alerts = identifyComplaintAlerts(records);
    const sgAlerts = alerts.filter((a) => a.type === "safeguarding_complaint");
    expect(sgAlerts).toHaveLength(0);
  });

  it("flags late acknowledgements (>=1)", () => {
    const records = [
      makeRecord({ acknowledged_within_24h: false, investigation_stage: "investigating" }),
    ];
    const alerts = identifyComplaintAlerts(records);
    const ackAlerts = alerts.filter((a) => a.type === "late_acknowledgement");
    expect(ackAlerts).toHaveLength(1);
    expect(ackAlerts[0].severity).toBe("high");
  });

  it("flags escalated complaints (>=1)", () => {
    const records = [makeRecord({ investigation_stage: "escalated" })];
    const alerts = identifyComplaintAlerts(records);
    const escAlerts = alerts.filter((a) => a.type === "escalated");
    expect(escAlerts).toHaveLength(1);
    expect(escAlerts[0].severity).toBe("high");
  });

  it("flags upheld complaints without learning (>=1)", () => {
    const records = [makeRecord({ complaint_outcome: "upheld", learning_identified: false })];
    const alerts = identifyComplaintAlerts(records);
    const learnAlerts = alerts.filter((a) => a.type === "no_learning");
    expect(learnAlerts).toHaveLength(1);
    expect(learnAlerts[0].severity).toBe("medium");
  });

  it("flags dissatisfied complainants (>=1)", () => {
    const records = [makeRecord({ complainant_satisfaction: "dissatisfied" })];
    const alerts = identifyComplaintAlerts(records);
    const satAlerts = alerts.filter((a) => a.type === "dissatisfied");
    expect(satAlerts).toHaveLength(1);
    expect(satAlerts[0].severity).toBe("medium");
  });
});
