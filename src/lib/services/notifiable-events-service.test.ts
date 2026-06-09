import { describe, it, expect } from "vitest";
import {
  computeNotificationCompliance,
  computeEventAnalysis,
  identifyNotificationAlerts,
  type NotifiableEvent,
  type EventNotification,
} from "./notifiable-events-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeEvent(overrides: Partial<NotifiableEvent> = {}): NotifiableEvent {
  return {
    id: "ev-1",
    home_id: "home-1",
    event_type: "serious_injury",
    event_date: "2026-05-20",
    event_time: "14:00",
    child_id: "child-1",
    child_name: "Alex Taylor",
    staff_involved: ["Staff A"],
    description: "Fall from trampoline",
    immediate_actions_taken: "First aid administered",
    outcome: "Recovered",
    reported_by: "Staff A",
    created_at: "2026-05-20T14:30:00Z",
    updated_at: "2026-05-20T14:30:00Z",
    ...overrides,
  };
}

function makeNotification(overrides: Partial<EventNotification> = {}): EventNotification {
  return {
    id: "n-1",
    home_id: "home-1",
    event_id: "ev-1",
    recipient_type: "ofsted",
    recipient_name: "Ofsted",
    sent_date: "2026-05-20T16:00:00Z",
    sent_by: "Manager",
    method: "online_portal",
    reference_number: "REF-001",
    status: "sent",
    deadline: "2026-05-21T14:30:00Z",
    acknowledged_date: null,
    acknowledged_by: null,
    created_at: "2026-05-20T15:00:00Z",
    ...overrides,
  };
}

// ── computeNotificationCompliance ──────────────────────────────────────

describe("computeNotificationCompliance", () => {
  it("returns zeroes for empty data", () => {
    const m = computeNotificationCompliance([], []);
    expect(m.total_events).toBe(0);
    expect(m.total_notifications_required).toBe(0);
    expect(m.total_notifications_sent).toBe(0);
    expect(m.compliance_rate).toBe(100); // 0 required => 100%
    expect(m.overdue).toHaveLength(0);
    expect(m.avg_response_hours).toBe(0);
  });

  it("computes compliance for events with sent notifications", () => {
    // serious_injury requires: ofsted + placing_authority = 2
    const events = [makeEvent({ id: "ev-1", event_type: "serious_injury" })];
    const notifications = [
      makeNotification({ id: "n-1", event_id: "ev-1", status: "sent" }),
      makeNotification({ id: "n-2", event_id: "ev-1", recipient_type: "placing_authority", status: "acknowledged" }),
    ];
    const m = computeNotificationCompliance(events, notifications);
    expect(m.total_events).toBe(1);
    expect(m.total_notifications_required).toBe(2); // ofsted + placing_authority
    expect(m.total_notifications_sent).toBe(2);
    expect(m.compliance_rate).toBe(100);
    expect(m.overdue).toHaveLength(0);
  });

  it("identifies overdue notifications", () => {
    const events = [makeEvent({ id: "ev-1" })];
    const notifications = [
      makeNotification({
        id: "n-1",
        event_id: "ev-1",
        status: "pending_approval",
        deadline: "2026-05-20T00:00:00Z", // past NOW
      }),
    ];
    const m = computeNotificationCompliance(events, notifications);
    expect(m.overdue.length).toBe(1);
  });

  it("computes average response hours", () => {
    const events = [makeEvent({ id: "ev-1", created_at: "2026-05-20T12:00:00Z" })];
    const notifications = [
      makeNotification({
        id: "n-1",
        event_id: "ev-1",
        status: "sent",
        sent_date: "2026-05-20T18:00:00Z", // 6 hours later
      }),
    ];
    const m = computeNotificationCompliance(events, notifications);
    expect(m.avg_response_hours).toBe(6);
  });
});

// ── computeEventAnalysis ───────────────────────────────────────────────

describe("computeEventAnalysis", () => {
  it("returns zeroes for empty data", () => {
    const m = computeEventAnalysis([]);
    expect(m.total_events).toBe(0);
    expect(m.trend).toBe("stable");
    expect(m.children_involved).toHaveLength(0);
  });

  it("counts by type and tracks children/staff involvement", () => {
    const events = [
      makeEvent({ id: "ev-1", event_type: "serious_injury", child_id: "child-1", child_name: "Alex", staff_involved: ["Staff A"] }),
      makeEvent({ id: "ev-2", event_type: "missing", child_id: "child-1", child_name: "Alex", staff_involved: ["Staff B"] }),
      makeEvent({ id: "ev-3", event_type: "serious_injury", child_id: "child-2", child_name: "Sam", staff_involved: ["Staff A"] }),
    ];
    const m = computeEventAnalysis(events);
    expect(m.total_events).toBe(3);
    expect(m.by_type["serious_injury"]).toBe(2);
    expect(m.by_type["missing"]).toBe(1);
    expect(m.children_involved.length).toBe(2);
    expect(m.children_involved[0].count).toBe(2); // Alex has 2
    expect(m.staff_involved.find((s) => s.name === "Staff A")?.count).toBe(2);
  });
});

// ── identifyNotificationAlerts ─────────────────────────────────────────

describe("identifyNotificationAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyNotificationAlerts([], [])).toHaveLength(0);
  });

  it("flags overdue_notification (critical) when past deadline and not sent", () => {
    const events = [makeEvent({ id: "ev-1" })];
    const notifications = [
      makeNotification({
        id: "n-1",
        event_id: "ev-1",
        status: "draft",
        deadline: "2026-05-19T00:00:00Z",
      }),
    ];
    const alerts = identifyNotificationAlerts(events, notifications);
    const found = alerts.filter((a) => a.type === "overdue_notification");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("critical");
  });

  it("flags missing_notification (high) when event has no notifications", () => {
    const events = [makeEvent({ id: "ev-1" })];
    const alerts = identifyNotificationAlerts(events, []);
    const found = alerts.filter((a) => a.type === "missing_notification");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags high_frequency (high) when 3+ events in 7 days", () => {
    const events = [
      makeEvent({ id: "ev-1", event_date: "2026-05-20" }),
      makeEvent({ id: "ev-2", event_date: "2026-05-19" }),
      makeEvent({ id: "ev-3", event_date: "2026-05-18" }),
    ];
    const alerts = identifyNotificationAlerts(events, [
      makeNotification({ id: "n-1", event_id: "ev-1" }),
      makeNotification({ id: "n-2", event_id: "ev-2" }),
      makeNotification({ id: "n-3", event_id: "ev-3" }),
    ], NOW);
    const found = alerts.filter((a) => a.type === "high_frequency");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags repeat_child (medium) when same child in 3+ events in 30 days", () => {
    const events = [
      makeEvent({ id: "ev-1", child_id: "child-1", child_name: "Alex", event_date: "2026-05-20" }),
      makeEvent({ id: "ev-2", child_id: "child-1", child_name: "Alex", event_date: "2026-05-15" }),
      makeEvent({ id: "ev-3", child_id: "child-1", child_name: "Alex", event_date: "2026-05-10" }),
    ];
    const alerts = identifyNotificationAlerts(events, [
      makeNotification({ id: "n-1", event_id: "ev-1" }),
      makeNotification({ id: "n-2", event_id: "ev-2" }),
      makeNotification({ id: "n-3", event_id: "ev-3" }),
    ], NOW);
    const found = alerts.filter((a) => a.type === "repeat_child");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("medium");
  });

  it("flags pending_acknowledgement (medium) when sent > 48h with no ack", () => {
    const events = [makeEvent({ id: "ev-1" })];
    const notifications = [
      makeNotification({
        id: "n-1",
        event_id: "ev-1",
        status: "sent",
        sent_date: "2026-05-18T00:00:00Z", // 3+ days ago
      }),
    ];
    const alerts = identifyNotificationAlerts(events, notifications);
    const found = alerts.filter((a) => a.type === "pending_acknowledgement");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("medium");
  });
});
