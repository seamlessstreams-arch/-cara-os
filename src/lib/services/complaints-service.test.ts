import { describe, it, expect } from "vitest";
import {
  computeComplaintsSummary,
  computeNotificationCompliance,
  computeComplaintTrends,
  identifyComplaintAlerts,
  type Complaint,
  type Reg40Notification,
} from "./complaints-service";

function makeComplaint(overrides: Partial<Complaint> = {}): Complaint {
  return {
    id: "c-1",
    home_id: "home-1",
    complaint_category: "care_quality",
    source: "parent",
    complainant_name: "Jane Doe",
    child_id: null,
    staff_id: null,
    date_received: "2026-05-01",
    date_acknowledged: "2026-05-02",
    date_responded: "2026-05-10",
    stage: "formal_stage1",
    description: "Concern about care",
    desired_outcome: null,
    investigation_notes: null,
    outcome: "resolved",
    actions_taken: ["Spoke to staff"],
    lessons_learned: "Improve communication",
    complainant_satisfied: true,
    advocacy_offered: true,
    status: "closed",
    created_at: "2026-05-01T08:00:00Z",
    updated_at: "2026-05-10T08:00:00Z",
    ...overrides,
  };
}

function makeNotification(overrides: Partial<Reg40Notification> = {}): Reg40Notification {
  return {
    id: "n-1",
    home_id: "home-1",
    notification_type: "missing",
    child_id: null,
    staff_id: null,
    linked_incident_id: null,
    linked_complaint_id: null,
    event_date: "2026-05-20T08:00:00Z",
    notification_date: "2026-05-20T16:00:00Z",
    sent_by: "manager",
    ofsted_reference: null,
    description: "Child missing",
    status: "sent",
    created_at: "2026-05-20T08:00:00Z",
    updated_at: "2026-05-20T16:00:00Z",
    ...overrides,
  };
}

describe("computeComplaintsSummary", () => {
  it("returns zeroes for empty data", () => {
    const m = computeComplaintsSummary([]);
    expect(m.total).toBe(0);
    expect(m.open).toBe(0);
    expect(m.avg_response_days).toBeNull();; expect(m.satisfaction_rate).toBeNull();; expect(m.advocacy_offered_rate).toBeNull();; });

  it("counts statuses correctly", () => {
    const complaints = [
      makeComplaint({ id: "c1", status: "open" }),
      makeComplaint({ id: "c2", status: "investigating" }),
      makeComplaint({ id: "c3", status: "responded" }),
      makeComplaint({ id: "c4", status: "closed" }),
      makeComplaint({ id: "c5", status: "escalated" }),
    ];
    const m = computeComplaintsSummary(complaints);
    expect(m.total).toBe(5);
    expect(m.open).toBe(1);
    expect(m.investigating).toBe(1);
    expect(m.responded).toBe(1);
    expect(m.closed).toBe(1);
    expect(m.escalated).toBe(1);
  });

  it("calculates average response days for responded/closed", () => {
    const complaints = [
      makeComplaint({ id: "c1", status: "closed", date_received: "2026-05-01", date_responded: "2026-05-11" }),
      makeComplaint({ id: "c2", status: "responded", date_received: "2026-05-01", date_responded: "2026-05-06" }),
    ];
    const m = computeComplaintsSummary(complaints);
    // c1: 10 days, c2: 5 days => avg = 7.5
    expect(m.avg_response_days).toBe(7.5);
  });

  it("counts acknowledgement within 2 days", () => {
    const complaints = [
      makeComplaint({ id: "c1", date_received: "2026-05-01", date_acknowledged: "2026-05-02" }),
      makeComplaint({ id: "c2", date_received: "2026-05-01", date_acknowledged: "2026-05-05" }),
      makeComplaint({ id: "c3", date_received: "2026-05-01", date_acknowledged: null }),
    ];
    const m = computeComplaintsSummary(complaints);
    expect(m.acknowledged_within_2_days).toBe(1);
    expect(m.acknowledged_total).toBe(2);
  });

  it("calculates satisfaction rate from known outcomes", () => {
    const complaints = [
      makeComplaint({ id: "c1", complainant_satisfied: true }),
      makeComplaint({ id: "c2", complainant_satisfied: false }),
      makeComplaint({ id: "c3", complainant_satisfied: null }),
    ];
    const m = computeComplaintsSummary(complaints);
    // 1 satisfied / 2 known = 50%
    expect(m.satisfaction_rate).toBe(50);
  });

  it("calculates advocacy offered rate", () => {
    const complaints = [
      makeComplaint({ id: "c1", advocacy_offered: true }),
      makeComplaint({ id: "c2", advocacy_offered: false }),
    ];
    const m = computeComplaintsSummary(complaints);
    expect(m.advocacy_offered_rate).toBe(50);
  });

  it("groups by category and source", () => {
    const complaints = [
      makeComplaint({ id: "c1", complaint_category: "staff_conduct", source: "child" }),
      makeComplaint({ id: "c2", complaint_category: "staff_conduct", source: "parent" }),
    ];
    const m = computeComplaintsSummary(complaints);
    expect(m.by_category.staff_conduct).toBe(2);
    expect(m.by_source.child).toBe(1);
    expect(m.by_source.parent).toBe(1);
  });
});

describe("computeNotificationCompliance", () => {
  it("returns 100% compliance for empty data", () => {
    const m = computeNotificationCompliance([]);
    expect(m.total).toBe(0);
    expect(m.compliance_rate).toBe(100);
  });

  it("counts sent on time vs sent late", () => {
    const notifications = [
      makeNotification({ id: "n1", status: "sent", event_date: "2026-05-20T08:00:00Z", notification_date: "2026-05-20T16:00:00Z" }), // 8h, within 24h
      makeNotification({ id: "n2", status: "sent", event_date: "2026-05-18T08:00:00Z", notification_date: "2026-05-20T16:00:00Z" }), // 56h, late
    ];
    const m = computeNotificationCompliance(notifications);
    expect(m.sent_on_time).toBe(1);
    expect(m.sent_late).toBe(1);
    expect(m.compliance_rate).toBe(50);
  });

  it("counts overdue notifications", () => {
    const notifications = [
      makeNotification({ id: "n1", status: "overdue" }),
    ];
    const m = computeNotificationCompliance(notifications);
    expect(m.overdue).toBe(1);
  });

  it("groups by notification type", () => {
    const notifications = [
      makeNotification({ id: "n1", notification_type: "missing" }),
      makeNotification({ id: "n2", notification_type: "missing" }),
      makeNotification({ id: "n3", notification_type: "serious_injury" }),
    ];
    const m = computeNotificationCompliance(notifications);
    expect(m.by_type.missing).toBe(2);
    expect(m.by_type.serious_injury).toBe(1);
  });
});

describe("computeComplaintTrends", () => {
  it("returns empty arrays for no data", () => {
    const t = computeComplaintTrends([]);
    expect(t.monthly_counts).toHaveLength(6);
    expect(t.top_categories).toHaveLength(0);
    expect(t.repeat_complainants).toHaveLength(0);
    expect(t.child_complaints_count).toBe(0);
    expect(t.lessons_identified).toBe(0);
  });

  it("counts child complaints and lessons", () => {
    const complaints = [
      makeComplaint({ id: "c1", source: "child", lessons_learned: "Improve process", date_received: "2026-05-01" }),
      makeComplaint({ id: "c2", source: "parent", lessons_learned: null, date_received: "2026-05-01" }),
    ];
    const t = computeComplaintTrends(complaints);
    expect(t.child_complaints_count).toBe(1);
    expect(t.lessons_identified).toBe(1);
  });

  it("detects repeat complainants (2+)", () => {
    const complaints = [
      makeComplaint({ id: "c1", complainant_name: "Jane Doe", date_received: "2026-05-01" }),
      makeComplaint({ id: "c2", complainant_name: "Jane Doe", date_received: "2026-05-05" }),
      makeComplaint({ id: "c3", complainant_name: "John Smith", date_received: "2026-05-01" }),
    ];
    const t = computeComplaintTrends(complaints);
    expect(t.repeat_complainants).toHaveLength(1);
    expect(t.repeat_complainants[0].name).toBe("jane doe");
    expect(t.repeat_complainants[0].count).toBe(2);
  });
});

describe("identifyComplaintAlerts", () => {
  it("returns empty alerts for empty data", () => {
    const alerts = identifyComplaintAlerts([], []);
    expect(alerts).toEqual([]);
  });

  it("flags overdue Reg 40 notifications", () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(); // 48h ago
    const notifications = [
      makeNotification({ id: "n1", status: "pending", notification_type: "missing", event_date: pastDate }),
    ];
    const alerts = identifyComplaintAlerts([], notifications);
    const overdueAlerts = alerts.filter((a) => a.type === "notification_overdue");
    expect(overdueAlerts).toHaveLength(1);
    expect(overdueAlerts[0].severity).toBe("critical");
  });

  it("flags escalated complaints (stage formal_stage2+)", () => {
    const complaints = [
      makeComplaint({ stage: "formal_stage2", status: "investigating" }),
    ];
    const alerts = identifyComplaintAlerts(complaints, []);
    const escAlerts = alerts.filter((a) => a.type === "escalated_complaint");
    expect(escAlerts).toHaveLength(1);
    expect(escAlerts[0].severity).toBe("high");
  });

  it("flags pattern detection: 3+ in same category within 30 days", () => {
    const now = new Date();
    const recentDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // 5 days ago
    const complaints = [
      makeComplaint({ id: "c1", complaint_category: "staff_conduct", date_received: recentDate }),
      makeComplaint({ id: "c2", complaint_category: "staff_conduct", date_received: recentDate }),
      makeComplaint({ id: "c3", complaint_category: "staff_conduct", date_received: recentDate }),
    ];
    const alerts = identifyComplaintAlerts(complaints, []);
    const patternAlerts = alerts.filter((a) => a.type === "pattern_detected");
    expect(patternAlerts).toHaveLength(1);
    expect(patternAlerts[0].severity).toBe("medium");
  });
});
