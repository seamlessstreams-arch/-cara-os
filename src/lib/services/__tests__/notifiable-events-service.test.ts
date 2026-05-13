// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — NOTIFIABLE EVENTS SERVICE TESTS
// Pure-function tests for notification compliance, event analysis,
// notification alert identification, and constant validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../notifiable-events-service";
import {
  NOTIFIABLE_EVENT_TYPES,
  NOTIFICATION_STATUS,
} from "../notifiable-events-service";
import type {
  NotifiableEvent,
  EventNotification,
} from "../notifiable-events-service";

const {
  computeNotificationCompliance,
  computeEventAnalysis,
  identifyNotificationAlerts,
  requiredNotificationsForType,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal NotifiableEvent with sensible defaults. */
function makeNotifiableEvent(
  overrides: Partial<{
    id: string;
    home_id: string;
    event_type: string;
    event_date: string;
    event_time: string | null;
    child_id: string | null;
    child_name: string | null;
    staff_involved: string[] | null;
    description: string;
    immediate_actions_taken: string;
    outcome: string | null;
    reported_by: string;
    created_at: string;
    updated_at: string;
  }> = {},
): NotifiableEvent {
  return {
    id: "id" in overrides ? overrides.id! : "ev-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    event_type: "event_type" in overrides ? overrides.event_type! : "missing",
    event_date: "event_date" in overrides ? overrides.event_date! : "2026-05-01",
    event_time: "event_time" in overrides ? overrides.event_time! : null,
    child_id: "child_id" in overrides ? overrides.child_id! : null,
    child_name: "child_name" in overrides ? overrides.child_name! : null,
    staff_involved: "staff_involved" in overrides ? overrides.staff_involved! : null,
    description: "description" in overrides ? overrides.description! : "Test event",
    immediate_actions_taken: "immediate_actions_taken" in overrides ? overrides.immediate_actions_taken! : "Actions taken",
    outcome: "outcome" in overrides ? overrides.outcome! : null,
    reported_by: "reported_by" in overrides ? overrides.reported_by! : "staff-1",
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-05-01T10:00:00Z",
    updated_at: "updated_at" in overrides ? overrides.updated_at! : "2026-05-01T10:00:00Z",
  };
}

/** Build a minimal EventNotification with sensible defaults. */
function makeEventNotification(
  overrides: Partial<{
    id: string;
    home_id: string;
    event_id: string;
    recipient_type: "ofsted" | "placing_authority" | "police" | "lado" | "parent";
    recipient_name: string | null;
    sent_date: string | null;
    sent_by: string | null;
    method: "phone" | "email" | "online_portal" | "in_person";
    reference_number: string | null;
    status: string;
    deadline: string;
    acknowledged_date: string | null;
    acknowledged_by: string | null;
    created_at: string;
  }> = {},
): EventNotification {
  return {
    id: "id" in overrides ? overrides.id! : "notif-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    event_id: "event_id" in overrides ? overrides.event_id! : "ev-1",
    recipient_type: "recipient_type" in overrides ? overrides.recipient_type! : "ofsted",
    recipient_name: "recipient_name" in overrides ? overrides.recipient_name! : null,
    sent_date: "sent_date" in overrides ? overrides.sent_date! : null,
    sent_by: "sent_by" in overrides ? overrides.sent_by! : null,
    method: "method" in overrides ? overrides.method! : "phone",
    reference_number: "reference_number" in overrides ? overrides.reference_number! : null,
    status: "status" in overrides ? overrides.status! : "draft",
    deadline: "deadline" in overrides ? overrides.deadline! : "2026-05-02T10:00:00Z",
    acknowledged_date: "acknowledged_date" in overrides ? overrides.acknowledged_date! : null,
    acknowledged_by: "acknowledged_by" in overrides ? overrides.acknowledged_by! : null,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-05-01T10:00:00Z",
  };
}

// ── NOTIFIABLE_EVENT_TYPES ───────────────────────────────────────────────

describe("NOTIFIABLE_EVENT_TYPES", () => {
  it("has exactly 16 entries", () => {
    expect(NOTIFIABLE_EVENT_TYPES).toHaveLength(16);
  });

  it("each entry has type, label, deadline_hours, and notification flags", () => {
    for (const et of NOTIFIABLE_EVENT_TYPES) {
      expect(typeof et.type).toBe("string");
      expect(typeof et.label).toBe("string");
      expect(typeof et.deadline_hours).toBe("number");
      expect(typeof et.notify_ofsted).toBe("boolean");
      expect(typeof et.notify_placing_authority).toBe("boolean");
      expect(typeof et.notify_police).toBe("boolean");
    }
  });

  it("contains expected types", () => {
    const types = NOTIFIABLE_EVENT_TYPES.map((t) => t.type);
    expect(types).toContain("death");
    expect(types).toContain("serious_injury");
    expect(types).toContain("missing");
    expect(types).toContain("absconding");
    expect(types).toContain("physical_intervention");
    expect(types).toContain("cse_cce");
    expect(types).toContain("other");
  });

  it("death event requires all three notification bodies", () => {
    const death = NOTIFIABLE_EVENT_TYPES.find((t) => t.type === "death");
    expect(death?.deadline_hours).toBe(24);
    expect(death?.notify_ofsted).toBe(true);
    expect(death?.notify_placing_authority).toBe(true);
    expect(death?.notify_police).toBe(true);
  });

  it("physical_intervention only requires placing authority notification", () => {
    const pi = NOTIFIABLE_EVENT_TYPES.find((t) => t.type === "physical_intervention");
    expect(pi?.deadline_hours).toBe(72);
    expect(pi?.notify_ofsted).toBe(false);
    expect(pi?.notify_placing_authority).toBe(true);
    expect(pi?.notify_police).toBe(false);
  });

  it("missing event requires ofsted, placing authority, and police", () => {
    const missing = NOTIFIABLE_EVENT_TYPES.find((t) => t.type === "missing");
    expect(missing?.label).toBe("Child missing from home");
    expect(missing?.notify_ofsted).toBe(true);
    expect(missing?.notify_placing_authority).toBe(true);
    expect(missing?.notify_police).toBe(true);
  });
});

// ── NOTIFICATION_STATUS ──────────────────────────────────────────────────

describe("NOTIFICATION_STATUS", () => {
  it("has exactly 5 statuses", () => {
    expect(NOTIFICATION_STATUS).toHaveLength(5);
  });

  it("contains expected statuses", () => {
    expect(NOTIFICATION_STATUS).toContain("draft");
    expect(NOTIFICATION_STATUS).toContain("pending_approval");
    expect(NOTIFICATION_STATUS).toContain("sent");
    expect(NOTIFICATION_STATUS).toContain("acknowledged");
    expect(NOTIFICATION_STATUS).toContain("overdue");
  });

  it("starts with draft and ends with overdue", () => {
    expect(NOTIFICATION_STATUS[0]).toBe("draft");
    expect(NOTIFICATION_STATUS[NOTIFICATION_STATUS.length - 1]).toBe("overdue");
  });

  it("all entries are strings", () => {
    for (const s of NOTIFICATION_STATUS) {
      expect(typeof s).toBe("string");
    }
  });
});

// ── requiredNotificationsForType ─────────────────────────────────────────

describe("requiredNotificationsForType", () => {
  it("returns 3 for death (ofsted + placing_authority + police)", () => {
    expect(requiredNotificationsForType("death")).toBe(3);
  });

  it("returns 3 for missing (ofsted + placing_authority + police)", () => {
    expect(requiredNotificationsForType("missing")).toBe(3);
  });

  it("returns 2 for serious_injury (ofsted + placing_authority)", () => {
    expect(requiredNotificationsForType("serious_injury")).toBe(2);
  });

  it("returns 1 for physical_intervention (placing_authority only)", () => {
    expect(requiredNotificationsForType("physical_intervention")).toBe(1);
  });

  it("returns 1 for substance_misuse (placing_authority only)", () => {
    expect(requiredNotificationsForType("substance_misuse")).toBe(1);
  });

  it("returns 3 for cse_cce (ofsted + placing_authority + police)", () => {
    expect(requiredNotificationsForType("cse_cce")).toBe(3);
  });

  it("returns 1 for other (placing_authority only)", () => {
    expect(requiredNotificationsForType("other")).toBe(1);
  });

  it("returns 1 (fallback) for unknown event type", () => {
    expect(requiredNotificationsForType("unknown_type")).toBe(1);
  });

  it("returns 2 for allegation_against_staff (ofsted + placing_authority)", () => {
    expect(requiredNotificationsForType("allegation_against_staff")).toBe(2);
  });

  it("returns 1 for medication_error (placing_authority only)", () => {
    expect(requiredNotificationsForType("medication_error")).toBe(1);
  });
});

// ── computeNotificationCompliance ───────────────────────────────────────

describe("computeNotificationCompliance", () => {
  it("returns zeroed metrics with 100% compliance for empty arrays", () => {
    const result = computeNotificationCompliance([], []);
    expect(result.total_events).toBe(0);
    expect(result.total_notifications_required).toBe(0);
    expect(result.total_notifications_sent).toBe(0);
    expect(result.compliance_rate).toBe(100);
    expect(result.overdue).toEqual([]);
    expect(result.by_event_type).toEqual({});
    expect(result.avg_response_hours).toBe(0);
  });

  it("counts total events", () => {
    const result = computeNotificationCompliance(
      [makeNotifiableEvent(), makeNotifiableEvent({ id: "ev-2" })],
      [],
    );
    expect(result.total_events).toBe(2);
  });

  it("computes total required notifications based on event types", () => {
    const result = computeNotificationCompliance(
      [
        makeNotifiableEvent({ event_type: "death" }),       // 3 required
        makeNotifiableEvent({ id: "ev-2", event_type: "physical_intervention" }), // 1 required
      ],
      [],
    );
    expect(result.total_notifications_required).toBe(4);
  });

  it("counts sent and acknowledged notifications as sent", () => {
    const result = computeNotificationCompliance(
      [makeNotifiableEvent()],
      [
        makeEventNotification({ status: "sent" }),
        makeEventNotification({ id: "notif-2", status: "acknowledged" }),
        makeEventNotification({ id: "notif-3", status: "draft" }),
      ],
    );
    expect(result.total_notifications_sent).toBe(2);
  });

  it("does not count draft or pending_approval as sent", () => {
    const result = computeNotificationCompliance(
      [makeNotifiableEvent()],
      [
        makeEventNotification({ status: "draft" }),
        makeEventNotification({ id: "notif-2", status: "pending_approval" }),
      ],
    );
    expect(result.total_notifications_sent).toBe(0);
  });

  it("computes compliance rate correctly", () => {
    // death requires 3 notifications; we send 1
    const result = computeNotificationCompliance(
      [makeNotifiableEvent({ event_type: "death" })],
      [makeEventNotification({ status: "sent", event_id: "ev-1" })],
    );
    // 1/3 * 100 = 33.3333... rounded to 1 decimal = 33.3
    expect(result.compliance_rate).toBe(33.3);
  });

  it("returns 100% compliance when all required notifications are sent", () => {
    // physical_intervention requires only 1 (placing_authority)
    const result = computeNotificationCompliance(
      [makeNotifiableEvent({ event_type: "physical_intervention" })],
      [makeEventNotification({ status: "sent", event_id: "ev-1" })],
    );
    expect(result.compliance_rate).toBe(100);
  });

  it("groups events by type with notified counts", () => {
    const result = computeNotificationCompliance(
      [
        makeNotifiableEvent({ event_type: "missing" }),
        makeNotifiableEvent({ id: "ev-2", event_type: "missing" }),
        makeNotifiableEvent({ id: "ev-3", event_type: "fire" }),
      ],
      [
        makeEventNotification({ status: "sent", event_id: "ev-1" }),
        makeEventNotification({ id: "notif-2", status: "sent", event_id: "ev-1" }),
        makeEventNotification({ id: "notif-3", status: "acknowledged", event_id: "ev-3" }),
      ],
    );
    expect(result.by_event_type.missing).toEqual({ count: 2, notified: 2 });
    expect(result.by_event_type.fire).toEqual({ count: 1, notified: 1 });
  });

  it("identifies overdue notifications (past deadline, not sent/acknowledged)", () => {
    const pastDeadline = "2020-01-01T00:00:00Z";
    const result = computeNotificationCompliance(
      [makeNotifiableEvent()],
      [
        makeEventNotification({ status: "draft", deadline: pastDeadline }),
        makeEventNotification({ id: "notif-2", status: "pending_approval", deadline: pastDeadline }),
        makeEventNotification({ id: "notif-3", status: "sent", deadline: pastDeadline }),
      ],
    );
    expect(result.overdue).toHaveLength(2);
    expect(result.overdue.map((o) => o.id).sort()).toEqual(["notif-1", "notif-2"]);
  });

  it("does not mark notifications as overdue when deadline is far in the future", () => {
    const futureDeadline = "2099-12-31T23:59:59Z";
    const result = computeNotificationCompliance(
      [makeNotifiableEvent()],
      [makeEventNotification({ status: "draft", deadline: futureDeadline })],
    );
    expect(result.overdue).toHaveLength(0);
  });

  it("computes avg_response_hours from earliest sent notification per event", () => {
    // Event created at 10:00, earliest sent notification at 16:00 = 6 hours
    const result = computeNotificationCompliance(
      [makeNotifiableEvent({ created_at: "2026-05-01T10:00:00Z" })],
      [
        makeEventNotification({
          event_id: "ev-1",
          status: "sent",
          sent_date: "2026-05-01T16:00:00Z",
        }),
        makeEventNotification({
          id: "notif-2",
          event_id: "ev-1",
          status: "sent",
          sent_date: "2026-05-01T20:00:00Z",
        }),
      ],
    );
    // Earliest sent is 16:00, created at 10:00 = 6 hours
    expect(result.avg_response_hours).toBe(6);
  });

  it("averages response hours across multiple events", () => {
    const result = computeNotificationCompliance(
      [
        makeNotifiableEvent({ created_at: "2026-05-01T10:00:00Z" }),
        makeNotifiableEvent({ id: "ev-2", created_at: "2026-05-01T10:00:00Z" }),
      ],
      [
        makeEventNotification({
          event_id: "ev-1",
          status: "sent",
          sent_date: "2026-05-01T16:00:00Z", // 6 hours
        }),
        makeEventNotification({
          id: "notif-2",
          event_id: "ev-2",
          status: "sent",
          sent_date: "2026-05-01T22:00:00Z", // 12 hours
        }),
      ],
    );
    // (6 + 12) / 2 = 9.0
    expect(result.avg_response_hours).toBe(9);
  });

  it("returns 0 avg_response_hours when no sent notifications exist", () => {
    const result = computeNotificationCompliance(
      [makeNotifiableEvent()],
      [makeEventNotification({ status: "draft" })],
    );
    expect(result.avg_response_hours).toBe(0);
  });

  it("ignores notifications without sent_date for avg_response_hours", () => {
    const result = computeNotificationCompliance(
      [makeNotifiableEvent()],
      [makeEventNotification({ status: "sent", sent_date: null })],
    );
    expect(result.avg_response_hours).toBe(0);
  });
});

// ── computeEventAnalysis ────────────────────────────────────────────────

describe("computeEventAnalysis", () => {
  it("returns zeroed metrics for empty array", () => {
    const result = computeEventAnalysis([]);
    expect(result.total_events).toBe(0);
    expect(result.by_type).toEqual({});
    expect(result.by_month).toEqual({});
    expect(result.children_involved).toEqual([]);
    expect(result.staff_involved).toEqual([]);
    expect(result.trend).toBe("stable");
  });

  it("counts total events", () => {
    const result = computeEventAnalysis([
      makeNotifiableEvent(),
      makeNotifiableEvent({ id: "ev-2" }),
      makeNotifiableEvent({ id: "ev-3" }),
    ]);
    expect(result.total_events).toBe(3);
  });

  it("groups events by type", () => {
    const result = computeEventAnalysis([
      makeNotifiableEvent({ event_type: "missing" }),
      makeNotifiableEvent({ id: "ev-2", event_type: "missing" }),
      makeNotifiableEvent({ id: "ev-3", event_type: "fire" }),
    ]);
    expect(result.by_type).toEqual({ missing: 2, fire: 1 });
  });

  it("groups events by month in YYYY-MM format", () => {
    const result = computeEventAnalysis([
      makeNotifiableEvent({ event_date: "2026-03-15" }),
      makeNotifiableEvent({ id: "ev-2", event_date: "2026-03-20" }),
      makeNotifiableEvent({ id: "ev-3", event_date: "2026-04-10" }),
    ]);
    expect(result.by_month).toEqual({ "2026-03": 2, "2026-04": 1 });
  });

  it("tracks children involved with counts sorted descending", () => {
    const result = computeEventAnalysis([
      makeNotifiableEvent({ child_id: "c-1", child_name: "Alice" }),
      makeNotifiableEvent({ id: "ev-2", child_id: "c-1", child_name: "Alice" }),
      makeNotifiableEvent({ id: "ev-3", child_id: "c-2", child_name: "Bob" }),
    ]);
    expect(result.children_involved).toHaveLength(2);
    expect(result.children_involved[0]).toEqual({ child_id: "c-1", child_name: "Alice", count: 2 });
    expect(result.children_involved[1]).toEqual({ child_id: "c-2", child_name: "Bob", count: 1 });
  });

  it("uses 'Unknown' for child_name when null", () => {
    const result = computeEventAnalysis([
      makeNotifiableEvent({ child_id: "c-1", child_name: null }),
    ]);
    expect(result.children_involved[0].child_name).toBe("Unknown");
  });

  it("excludes events without child_id from children_involved", () => {
    const result = computeEventAnalysis([
      makeNotifiableEvent({ child_id: null }),
    ]);
    expect(result.children_involved).toEqual([]);
  });

  it("tracks staff involved with counts sorted descending", () => {
    const result = computeEventAnalysis([
      makeNotifiableEvent({ staff_involved: ["Jane", "Bob"] }),
      makeNotifiableEvent({ id: "ev-2", staff_involved: ["Jane"] }),
    ]);
    expect(result.staff_involved).toHaveLength(2);
    expect(result.staff_involved[0]).toEqual({ name: "Jane", count: 2 });
    expect(result.staff_involved[1]).toEqual({ name: "Bob", count: 1 });
  });

  it("excludes events without staff_involved from staff counts", () => {
    const result = computeEventAnalysis([
      makeNotifiableEvent({ staff_involved: null }),
    ]);
    expect(result.staff_involved).toEqual([]);
  });

  it("returns 'increasing' trend when last 30 days > prev 30 days * 1.25", () => {
    const now = new Date();
    const recent = new Date(now);
    recent.setDate(now.getDate() - 5);
    const older = new Date(now);
    older.setDate(now.getDate() - 40);

    // 3 events in last 30 days, 1 in prev 30 days: 3 > 1 * 1.25 = 1.25
    const result = computeEventAnalysis([
      makeNotifiableEvent({ event_date: recent.toISOString().split("T")[0] }),
      makeNotifiableEvent({ id: "ev-2", event_date: recent.toISOString().split("T")[0] }),
      makeNotifiableEvent({ id: "ev-3", event_date: recent.toISOString().split("T")[0] }),
      makeNotifiableEvent({ id: "ev-4", event_date: older.toISOString().split("T")[0] }),
    ]);
    expect(result.trend).toBe("increasing");
  });

  it("returns 'decreasing' trend when last 30 days < prev 30 days * 0.75", () => {
    const now = new Date();
    const older = new Date(now);
    older.setDate(now.getDate() - 40);

    // 0 events in last 30 days, 3 in prev 30 days: 0 < 3 * 0.75 = 2.25
    const result = computeEventAnalysis([
      makeNotifiableEvent({ event_date: older.toISOString().split("T")[0] }),
      makeNotifiableEvent({ id: "ev-2", event_date: older.toISOString().split("T")[0] }),
      makeNotifiableEvent({ id: "ev-3", event_date: older.toISOString().split("T")[0] }),
    ]);
    expect(result.trend).toBe("decreasing");
  });

  it("returns 'stable' trend when last 30 and prev 30 days are similar", () => {
    const now = new Date();
    const recent = new Date(now);
    recent.setDate(now.getDate() - 5);
    const older = new Date(now);
    older.setDate(now.getDate() - 40);

    // 2 events in last 30 days, 2 in prev 30 days: 2 is between 1.5 and 2.5
    const result = computeEventAnalysis([
      makeNotifiableEvent({ event_date: recent.toISOString().split("T")[0] }),
      makeNotifiableEvent({ id: "ev-2", event_date: recent.toISOString().split("T")[0] }),
      makeNotifiableEvent({ id: "ev-3", event_date: older.toISOString().split("T")[0] }),
      makeNotifiableEvent({ id: "ev-4", event_date: older.toISOString().split("T")[0] }),
    ]);
    expect(result.trend).toBe("stable");
  });

  it("returns 'stable' when no events exist in either period", () => {
    // Events far in the past (beyond 60 days)
    const result = computeEventAnalysis([
      makeNotifiableEvent({ event_date: "2020-01-01" }),
    ]);
    // last30 = 0, prev30 = 0; 0 > 0*1.25 = false, 0 < 0*0.75 = false => stable
    expect(result.trend).toBe("stable");
  });
});

// ── identifyNotificationAlerts ──────────────────────────────────────────

describe("identifyNotificationAlerts", () => {
  it("returns empty array when no events and no notifications", () => {
    const result = identifyNotificationAlerts([], []);
    expect(result).toEqual([]);
  });

  // ── Overdue notification alerts ──

  it("generates critical alert for notification past deadline that is not sent/acknowledged", () => {
    const pastDeadline = "2020-01-01T00:00:00Z";
    const result = identifyNotificationAlerts(
      [],
      [makeEventNotification({ status: "draft", deadline: pastDeadline, recipient_type: "ofsted" })],
    );
    const overdueAlerts = result.filter((a) => a.type === "overdue_notification");
    expect(overdueAlerts).toHaveLength(1);
    expect(overdueAlerts[0].severity).toBe("critical");
    expect(overdueAlerts[0].message).toContain("ofsted");
  });

  it("generates critical overdue alert for pending_approval past deadline", () => {
    const pastDeadline = "2020-01-01T00:00:00Z";
    const result = identifyNotificationAlerts(
      [],
      [makeEventNotification({ status: "pending_approval", deadline: pastDeadline })],
    );
    const overdueAlerts = result.filter((a) => a.type === "overdue_notification");
    expect(overdueAlerts).toHaveLength(1);
    expect(overdueAlerts[0].severity).toBe("critical");
  });

  it("does not generate overdue alert for sent notification past deadline", () => {
    const pastDeadline = "2020-01-01T00:00:00Z";
    const result = identifyNotificationAlerts(
      [],
      [makeEventNotification({ status: "sent", deadline: pastDeadline })],
    );
    const overdueAlerts = result.filter((a) => a.type === "overdue_notification");
    expect(overdueAlerts).toHaveLength(0);
  });

  it("does not generate overdue alert for acknowledged notification past deadline", () => {
    const pastDeadline = "2020-01-01T00:00:00Z";
    const result = identifyNotificationAlerts(
      [],
      [makeEventNotification({ status: "acknowledged", deadline: pastDeadline })],
    );
    const overdueAlerts = result.filter((a) => a.type === "overdue_notification");
    expect(overdueAlerts).toHaveLength(0);
  });

  it("does not generate overdue alert when deadline is in the future", () => {
    const futureDeadline = "2099-12-31T23:59:59Z";
    const result = identifyNotificationAlerts(
      [],
      [makeEventNotification({ status: "draft", deadline: futureDeadline })],
    );
    const overdueAlerts = result.filter((a) => a.type === "overdue_notification");
    expect(overdueAlerts).toHaveLength(0);
  });

  // ── Pending acknowledgement alerts ──

  it("generates medium alert when sent notification is not acknowledged after 48 hours", () => {
    // sent_date far in the past so >48h elapsed
    const result = identifyNotificationAlerts(
      [],
      [makeEventNotification({
        status: "sent",
        sent_date: "2020-01-01T00:00:00Z",
        recipient_type: "placing_authority",
      })],
    );
    const pendingAckAlerts = result.filter((a) => a.type === "pending_acknowledgement");
    expect(pendingAckAlerts).toHaveLength(1);
    expect(pendingAckAlerts[0].severity).toBe("medium");
    expect(pendingAckAlerts[0].message).toContain("placing_authority");
    expect(pendingAckAlerts[0].message).toContain("48 hours");
  });

  it("does not generate pending_acknowledgement when sent less than 48 hours ago", () => {
    const recentSent = new Date();
    recentSent.setHours(recentSent.getHours() - 1);
    const result = identifyNotificationAlerts(
      [],
      [makeEventNotification({ status: "sent", sent_date: recentSent.toISOString() })],
    );
    const pendingAckAlerts = result.filter((a) => a.type === "pending_acknowledgement");
    expect(pendingAckAlerts).toHaveLength(0);
  });

  it("does not generate pending_acknowledgement for acknowledged notifications", () => {
    const result = identifyNotificationAlerts(
      [],
      [makeEventNotification({ status: "acknowledged", sent_date: "2020-01-01T00:00:00Z" })],
    );
    const pendingAckAlerts = result.filter((a) => a.type === "pending_acknowledgement");
    expect(pendingAckAlerts).toHaveLength(0);
  });

  it("does not generate pending_acknowledgement for sent notification without sent_date", () => {
    const result = identifyNotificationAlerts(
      [],
      [makeEventNotification({ status: "sent", sent_date: null })],
    );
    const pendingAckAlerts = result.filter((a) => a.type === "pending_acknowledgement");
    expect(pendingAckAlerts).toHaveLength(0);
  });

  // ── Missing notification alerts ──

  it("generates high alert for event with no notifications at all", () => {
    const result = identifyNotificationAlerts(
      [makeNotifiableEvent({ event_type: "serious_injury", event_date: "2026-05-01" })],
      [],
    );
    const missingAlerts = result.filter((a) => a.type === "missing_notification");
    expect(missingAlerts).toHaveLength(1);
    expect(missingAlerts[0].severity).toBe("high");
    expect(missingAlerts[0].message).toContain("serious_injury");
    expect(missingAlerts[0].message).toContain("2026-05-01");
  });

  it("does not generate missing_notification alert when event has notifications", () => {
    const result = identifyNotificationAlerts(
      [makeNotifiableEvent()],
      [makeEventNotification({ event_id: "ev-1" })],
    );
    const missingAlerts = result.filter((a) => a.type === "missing_notification");
    expect(missingAlerts).toHaveLength(0);
  });

  it("generates missing_notification for each event without notifications", () => {
    const result = identifyNotificationAlerts(
      [
        makeNotifiableEvent(),
        makeNotifiableEvent({ id: "ev-2" }),
      ],
      [],
    );
    const missingAlerts = result.filter((a) => a.type === "missing_notification");
    expect(missingAlerts).toHaveLength(2);
  });

  // ── High frequency alerts ──

  it("generates high alert when 3+ events occurred in the last 7 days", () => {
    const now = new Date();
    const recent = new Date(now);
    recent.setDate(now.getDate() - 2);
    const dateStr = recent.toISOString().split("T")[0];

    const result = identifyNotificationAlerts(
      [
        makeNotifiableEvent({ event_date: dateStr }),
        makeNotifiableEvent({ id: "ev-2", event_date: dateStr }),
        makeNotifiableEvent({ id: "ev-3", event_date: dateStr }),
      ],
      [
        makeEventNotification({ event_id: "ev-1" }),
        makeEventNotification({ id: "notif-2", event_id: "ev-2" }),
        makeEventNotification({ id: "notif-3", event_id: "ev-3" }),
      ],
    );
    const freqAlerts = result.filter((a) => a.type === "high_frequency");
    expect(freqAlerts).toHaveLength(1);
    expect(freqAlerts[0].severity).toBe("high");
    expect(freqAlerts[0].message).toContain("3");
  });

  it("does not generate high_frequency alert for fewer than 3 recent events", () => {
    const now = new Date();
    const recent = new Date(now);
    recent.setDate(now.getDate() - 2);
    const dateStr = recent.toISOString().split("T")[0];

    const result = identifyNotificationAlerts(
      [
        makeNotifiableEvent({ event_date: dateStr }),
        makeNotifiableEvent({ id: "ev-2", event_date: dateStr }),
      ],
      [
        makeEventNotification({ event_id: "ev-1" }),
        makeEventNotification({ id: "notif-2", event_id: "ev-2" }),
      ],
    );
    const freqAlerts = result.filter((a) => a.type === "high_frequency");
    expect(freqAlerts).toHaveLength(0);
  });

  it("does not count events older than 7 days for high_frequency", () => {
    const result = identifyNotificationAlerts(
      [
        makeNotifiableEvent({ event_date: "2020-01-01" }),
        makeNotifiableEvent({ id: "ev-2", event_date: "2020-01-02" }),
        makeNotifiableEvent({ id: "ev-3", event_date: "2020-01-03" }),
      ],
      [
        makeEventNotification({ event_id: "ev-1" }),
        makeEventNotification({ id: "notif-2", event_id: "ev-2" }),
        makeEventNotification({ id: "notif-3", event_id: "ev-3" }),
      ],
    );
    const freqAlerts = result.filter((a) => a.type === "high_frequency");
    expect(freqAlerts).toHaveLength(0);
  });

  // ── Repeat child alerts ──

  it("generates medium alert when same child involved in 3+ events in 30 days", () => {
    const now = new Date();
    const recent = new Date(now);
    recent.setDate(now.getDate() - 5);
    const dateStr = recent.toISOString().split("T")[0];

    const result = identifyNotificationAlerts(
      [
        makeNotifiableEvent({ child_id: "c-1", child_name: "Alice", event_date: dateStr }),
        makeNotifiableEvent({ id: "ev-2", child_id: "c-1", child_name: "Alice", event_date: dateStr }),
        makeNotifiableEvent({ id: "ev-3", child_id: "c-1", child_name: "Alice", event_date: dateStr }),
      ],
      [
        makeEventNotification({ event_id: "ev-1" }),
        makeEventNotification({ id: "notif-2", event_id: "ev-2" }),
        makeEventNotification({ id: "notif-3", event_id: "ev-3" }),
      ],
    );
    const repeatAlerts = result.filter((a) => a.type === "repeat_child");
    expect(repeatAlerts).toHaveLength(1);
    expect(repeatAlerts[0].severity).toBe("medium");
    expect(repeatAlerts[0].message).toContain("Alice");
    expect(repeatAlerts[0].message).toContain("3");
  });

  it("does not generate repeat_child alert for fewer than 3 events for same child", () => {
    const now = new Date();
    const recent = new Date(now);
    recent.setDate(now.getDate() - 5);
    const dateStr = recent.toISOString().split("T")[0];

    const result = identifyNotificationAlerts(
      [
        makeNotifiableEvent({ child_id: "c-1", child_name: "Alice", event_date: dateStr }),
        makeNotifiableEvent({ id: "ev-2", child_id: "c-1", child_name: "Alice", event_date: dateStr }),
      ],
      [
        makeEventNotification({ event_id: "ev-1" }),
        makeEventNotification({ id: "notif-2", event_id: "ev-2" }),
      ],
    );
    const repeatAlerts = result.filter((a) => a.type === "repeat_child");
    expect(repeatAlerts).toHaveLength(0);
  });

  it("does not count events older than 30 days for repeat_child", () => {
    const result = identifyNotificationAlerts(
      [
        makeNotifiableEvent({ child_id: "c-1", child_name: "Alice", event_date: "2020-01-01" }),
        makeNotifiableEvent({ id: "ev-2", child_id: "c-1", child_name: "Alice", event_date: "2020-01-05" }),
        makeNotifiableEvent({ id: "ev-3", child_id: "c-1", child_name: "Alice", event_date: "2020-01-10" }),
      ],
      [
        makeEventNotification({ event_id: "ev-1" }),
        makeEventNotification({ id: "notif-2", event_id: "ev-2" }),
        makeEventNotification({ id: "notif-3", event_id: "ev-3" }),
      ],
    );
    const repeatAlerts = result.filter((a) => a.type === "repeat_child");
    expect(repeatAlerts).toHaveLength(0);
  });

  it("uses 'Unknown' for child name when child_name is null in repeat_child alert", () => {
    const now = new Date();
    const recent = new Date(now);
    recent.setDate(now.getDate() - 5);
    const dateStr = recent.toISOString().split("T")[0];

    const result = identifyNotificationAlerts(
      [
        makeNotifiableEvent({ child_id: "c-1", child_name: null, event_date: dateStr }),
        makeNotifiableEvent({ id: "ev-2", child_id: "c-1", child_name: null, event_date: dateStr }),
        makeNotifiableEvent({ id: "ev-3", child_id: "c-1", child_name: null, event_date: dateStr }),
      ],
      [
        makeEventNotification({ event_id: "ev-1" }),
        makeEventNotification({ id: "notif-2", event_id: "ev-2" }),
        makeEventNotification({ id: "notif-3", event_id: "ev-3" }),
      ],
    );
    const repeatAlerts = result.filter((a) => a.type === "repeat_child");
    expect(repeatAlerts).toHaveLength(1);
    expect(repeatAlerts[0].message).toContain("Unknown");
  });

  it("skips events without child_id for repeat_child check", () => {
    const now = new Date();
    const recent = new Date(now);
    recent.setDate(now.getDate() - 5);
    const dateStr = recent.toISOString().split("T")[0];

    const result = identifyNotificationAlerts(
      [
        makeNotifiableEvent({ child_id: null, event_date: dateStr }),
        makeNotifiableEvent({ id: "ev-2", child_id: null, event_date: dateStr }),
        makeNotifiableEvent({ id: "ev-3", child_id: null, event_date: dateStr }),
      ],
      [
        makeEventNotification({ event_id: "ev-1" }),
        makeEventNotification({ id: "notif-2", event_id: "ev-2" }),
        makeEventNotification({ id: "notif-3", event_id: "ev-3" }),
      ],
    );
    const repeatAlerts = result.filter((a) => a.type === "repeat_child");
    expect(repeatAlerts).toHaveLength(0);
  });

  // ── Combined alerts ──

  it("generates multiple alert types simultaneously", () => {
    const now = new Date();
    const recent = new Date(now);
    recent.setDate(now.getDate() - 2);
    const dateStr = recent.toISOString().split("T")[0];
    const pastDeadline = "2020-01-01T00:00:00Z";

    const result = identifyNotificationAlerts(
      [
        // 3 recent events with same child triggers high_frequency + repeat_child
        makeNotifiableEvent({ child_id: "c-1", child_name: "Alice", event_date: dateStr }),
        makeNotifiableEvent({ id: "ev-2", child_id: "c-1", child_name: "Alice", event_date: dateStr }),
        makeNotifiableEvent({ id: "ev-3", child_id: "c-1", child_name: "Alice", event_date: dateStr }),
        // event with no notifications triggers missing_notification
        makeNotifiableEvent({ id: "ev-4", event_date: "2026-01-01" }),
      ],
      [
        makeEventNotification({ event_id: "ev-1", status: "draft", deadline: pastDeadline }),
        makeEventNotification({ id: "notif-2", event_id: "ev-2", status: "sent", sent_date: "2020-01-01T00:00:00Z" }),
        makeEventNotification({ id: "notif-3", event_id: "ev-3" }),
      ],
    );

    const types = result.map((a) => a.type);
    expect(types).toContain("overdue_notification");
    expect(types).toContain("pending_acknowledgement");
    expect(types).toContain("missing_notification");
    expect(types).toContain("high_frequency");
    expect(types).toContain("repeat_child");
  });
});
