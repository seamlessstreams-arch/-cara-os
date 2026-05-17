// ══════════════════════════════════════════════════════════════════════════════
// Notifiable Events Engine — Tests
//
// Covers: notification compliance, deadline tracking, required recipients,
// metrics calculation, timeline building, category urgency mapping.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateNotificationCompliance,
  calculateNotifiableEventsMetrics,
  buildNotificationTimeline,
  getRequiredNotifications,
  getCategoryLabel,
  getRecipientLabel,
  getUrgencyLabel,
  getCategoryUrgency,
} from "../notifiable-events-engine";
import type {
  NotifiableEvent,
  NotificationEntry,
  NotifiableEventCategory,
} from "../notifiable-events-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const NOW = "2026-05-17T12:00:00Z";

function makeEvent(overrides: Partial<NotifiableEvent> = {}): NotifiableEvent {
  return {
    id: "evt-001",
    homeId: "home-oak",
    category: "serious_injury",
    title: "Child sustained broken arm during activity",
    description: "Fall from climbing frame during outdoor activities.",
    occurredAt: "2026-05-16T14:30:00Z",
    discoveredAt: "2026-05-16T14:30:00Z",
    childId: "child-001",
    childName: "Jordan Williams",
    severity: 3,
    loggedBy: "staff-001",
    loggedAt: "2026-05-16T15:00:00Z",
    notifications: [
      {
        recipient: "ofsted",
        method: "online_form",
        sentAt: "2026-05-16T16:00:00Z",
        status: "submitted",
        deadline: "2026-05-17T14:30:00Z",
      },
      {
        recipient: "local_authority",
        method: "email",
        sentAt: "2026-05-16T16:30:00Z",
        status: "submitted",
        deadline: "2026-05-17T14:30:00Z",
      },
      {
        recipient: "parent_carer",
        method: "phone",
        sentAt: "2026-05-16T15:00:00Z",
        status: "acknowledged",
        acknowledgedAt: "2026-05-16T15:05:00Z",
        deadline: "2026-05-17T14:30:00Z",
      },
      {
        recipient: "placing_authority",
        method: "email",
        sentAt: "2026-05-16T17:00:00Z",
        status: "submitted",
        deadline: "2026-05-17T14:30:00Z",
      },
    ],
    ...overrides,
  };
}

function makeNotification(overrides: Partial<NotificationEntry> = {}): NotificationEntry {
  return {
    recipient: "ofsted",
    method: "online_form",
    status: "pending",
    deadline: "2026-05-17T14:30:00Z",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Notification Compliance Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateNotificationCompliance", () => {
  it("marks fully compliant event when all recipients notified on time", () => {
    const event = makeEvent();
    const result = evaluateNotificationCompliance(event, NOW);

    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.timeliness).toBe("on_time");
    expect(result.missingRecipients).toHaveLength(0);
  });

  it("flags overdue notification when deadline passed without sending", () => {
    const event = makeEvent({
      notifications: [
        makeNotification({ recipient: "ofsted", sentAt: "2026-05-16T16:00:00Z", status: "submitted" }),
        makeNotification({ recipient: "local_authority", status: "pending" }), // not sent
        makeNotification({ recipient: "parent_carer", sentAt: "2026-05-16T15:00:00Z", status: "submitted" }),
        makeNotification({ recipient: "placing_authority", sentAt: "2026-05-16T17:00:00Z", status: "submitted" }),
      ],
    });

    // NOW is 2026-05-17T12:00:00Z, deadline is 2026-05-17T14:30:00Z — still within deadline
    const result = evaluateNotificationCompliance(event, NOW);
    expect(result.isCompliant).toBe(true); // not yet overdue

    // Check with time past deadline
    const lateResult = evaluateNotificationCompliance(event, "2026-05-17T15:00:00Z");
    expect(lateResult.isCompliant).toBe(false);
    expect(lateResult.overdueNotifications.length).toBeGreaterThan(0);
    expect(lateResult.timeliness).toBe("late");
  });

  it("flags missing recipient when no notification entry exists and deadline passed", () => {
    const event = makeEvent({
      notifications: [
        makeNotification({ recipient: "ofsted", sentAt: "2026-05-16T16:00:00Z", status: "submitted" }),
        // Missing: local_authority, parent_carer, placing_authority
      ],
    });

    const result = evaluateNotificationCompliance(event, "2026-05-18T12:00:00Z");
    expect(result.isCompliant).toBe(false);
    expect(result.missingRecipients).toContain("local_authority");
    expect(result.missingRecipients).toContain("parent_carer");
    expect(result.overdueNotifications.length).toBe(3);
  });

  it("warns when notification sent late but still marks issues for late send", () => {
    const event = makeEvent({
      discoveredAt: "2026-05-15T10:00:00Z",
      notifications: [
        makeNotification({
          recipient: "ofsted",
          deadline: "2026-05-16T10:00:00Z",
          sentAt: "2026-05-16T14:00:00Z", // 4 hours late
          status: "submitted",
        }),
        makeNotification({ recipient: "local_authority", sentAt: "2026-05-15T12:00:00Z", deadline: "2026-05-16T10:00:00Z", status: "submitted" }),
        makeNotification({ recipient: "parent_carer", sentAt: "2026-05-15T11:00:00Z", deadline: "2026-05-16T10:00:00Z", status: "submitted" }),
        makeNotification({ recipient: "placing_authority", sentAt: "2026-05-15T12:00:00Z", deadline: "2026-05-16T10:00:00Z", status: "submitted" }),
      ],
    });

    const result = evaluateNotificationCompliance(event, NOW);
    expect(result.warnings.some(w => w.includes("Ofsted") && w.includes("late"))).toBe(true);
  });

  it("identifies pending timeliness when within deadline", () => {
    const event = makeEvent({
      discoveredAt: "2026-05-17T10:00:00Z", // discovered 2h ago
      notifications: [
        makeNotification({ recipient: "ofsted", status: "pending", deadline: "2026-05-18T10:00:00Z" }),
      ],
    });

    const result = evaluateNotificationCompliance(event, NOW);
    expect(result.timeliness).toBe("pending");
  });

  it("handles death category requiring immediate (4h) notification", () => {
    const event = makeEvent({
      category: "death",
      discoveredAt: "2026-05-17T06:00:00Z", // 6 hours ago
      notifications: [], // nothing sent
    });

    const result = evaluateNotificationCompliance(event, NOW);
    expect(result.isCompliant).toBe(false);
    expect(result.overdueNotifications.length).toBeGreaterThan(0);
    // Death requires ofsted, local_authority, police, parent_carer, placing_authority
    expect(result.requiredRecipients).toContain("police");
  });

  it("returns correct required recipients for allegation category", () => {
    const event = makeEvent({
      category: "allegation_against_staff",
      notifications: [],
    });

    const result = evaluateNotificationCompliance(event, "2026-05-20T00:00:00Z");
    expect(result.requiredRecipients).toContain("ofsted");
    expect(result.requiredRecipients).toContain("designated_officer");
    expect(result.requiredRecipients).toContain("local_authority");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Metrics Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateNotifiableEventsMetrics", () => {
  it("calculates basic metrics", () => {
    const events = [makeEvent(), makeEvent({ id: "evt-002", category: "child_missing" })];
    const result = calculateNotifiableEventsMetrics(events, "home-oak", NOW);

    expect(result.totalEvents).toBe(2);
    expect(result.eventsThisMonth).toBe(2);
    expect(result.complianceRate).toBeGreaterThan(0);
    expect(result.byCategory.length).toBe(2);
  });

  it("counts overdue notifications", () => {
    const overdueEvent = makeEvent({
      discoveredAt: "2026-05-14T10:00:00Z",
      notifications: [], // nothing sent, well past 24h deadline
    });
    const result = calculateNotifiableEventsMetrics([overdueEvent], "home-oak", NOW);

    expect(result.overdueNotifications).toBeGreaterThan(0);
    expect(result.complianceRate).toBe(0);
  });

  it("counts children involved", () => {
    const events = [
      makeEvent({ childId: "c1" }),
      makeEvent({ id: "evt-002", childId: "c1" }),
      makeEvent({ id: "evt-003", childId: "c2" }),
    ];
    const result = calculateNotifiableEventsMetrics(events, "home-oak", NOW);
    expect(result.childrenInvolved).toBe(2);
  });

  it("filters by homeId", () => {
    const events = [
      makeEvent({ homeId: "home-oak" }),
      makeEvent({ id: "evt-002", homeId: "home-other" }),
    ];
    const result = calculateNotifiableEventsMetrics(events, "home-oak", NOW);
    expect(result.totalEvents).toBe(1);
  });

  it("identifies events requiring immediate action", () => {
    const immediateEvent = makeEvent({
      category: "death",
      discoveredAt: "2026-05-17T10:00:00Z", // 2 hours ago
      notifications: [], // nothing sent yet
    });
    const result = calculateNotifiableEventsMetrics([immediateEvent], "home-oak", NOW);
    expect(result.requiresImmediateAction.length).toBe(1);
  });

  it("calculates average response hours", () => {
    const event = makeEvent({
      discoveredAt: "2026-05-16T12:00:00Z",
      notifications: [
        makeNotification({ recipient: "ofsted", sentAt: "2026-05-16T14:00:00Z", status: "submitted", deadline: "2026-05-17T12:00:00Z" }),
        makeNotification({ recipient: "local_authority", sentAt: "2026-05-16T15:00:00Z", status: "submitted", deadline: "2026-05-17T12:00:00Z" }),
        makeNotification({ recipient: "parent_carer", sentAt: "2026-05-16T13:00:00Z", status: "submitted", deadline: "2026-05-17T12:00:00Z" }),
        makeNotification({ recipient: "placing_authority", sentAt: "2026-05-16T16:00:00Z", status: "submitted", deadline: "2026-05-17T12:00:00Z" }),
      ],
    });
    const result = calculateNotifiableEventsMetrics([event], "home-oak", NOW);
    // Average: (2 + 3 + 1 + 4) / 4 = 2.5, rounded = 3 (or 2 depending on rounding)
    expect(result.averageResponseHours).toBeGreaterThan(0);
    expect(result.averageResponseHours).toBeLessThan(5);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Timeline Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("buildNotificationTimeline", () => {
  it("builds timeline with all required recipients", () => {
    const event = makeEvent();
    const timeline = buildNotificationTimeline(event, NOW);

    expect(timeline.eventId).toBe("evt-001");
    expect(timeline.entries.length).toBe(4); // serious_injury requires 4 recipients
    expect(timeline.entries.every(e => e.deadline)).toBe(true);
  });

  it("marks late entries correctly", () => {
    const event = makeEvent({
      discoveredAt: "2026-05-15T10:00:00Z",
      notifications: [
        makeNotification({
          recipient: "ofsted",
          deadline: "2026-05-16T10:00:00Z",
          sentAt: "2026-05-16T14:00:00Z", // 4h late
          status: "submitted",
        }),
        makeNotification({ recipient: "local_authority", deadline: "2026-05-16T10:00:00Z", sentAt: "2026-05-16T09:00:00Z", status: "submitted" }),
        makeNotification({ recipient: "parent_carer", deadline: "2026-05-16T10:00:00Z", sentAt: "2026-05-15T11:00:00Z", status: "submitted" }),
        makeNotification({ recipient: "placing_authority", deadline: "2026-05-16T10:00:00Z", sentAt: "2026-05-16T09:00:00Z", status: "submitted" }),
      ],
    });

    const timeline = buildNotificationTimeline(event, NOW);
    const ofstedEntry = timeline.entries.find(e => e.recipient === "ofsted");
    expect(ofstedEntry?.isLate).toBe(true);
    expect(ofstedEntry?.hoursLate).toBe(4);
  });

  it("marks unsent past-deadline entries as overdue", () => {
    const event = makeEvent({
      discoveredAt: "2026-05-15T10:00:00Z",
      notifications: [
        makeNotification({ recipient: "ofsted", deadline: "2026-05-16T10:00:00Z" }), // not sent
      ],
    });

    const timeline = buildNotificationTimeline(event, NOW);
    const ofstedEntry = timeline.entries.find(e => e.recipient === "ofsted");
    expect(ofstedEntry?.status).toBe("overdue");
    expect(ofstedEntry?.isLate).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Required Notifications Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("getRequiredNotifications", () => {
  it("returns correct recipients and deadlines for death", () => {
    const result = getRequiredNotifications("death", "2026-05-17T10:00:00Z");
    expect(result.length).toBe(5); // ofsted, LA, police, parent, placing authority
    expect(result[0].urgency).toBe("immediate");
    // Deadline should be 4h after discovery
    expect(new Date(result[0].deadline).getTime()).toBe(
      new Date("2026-05-17T14:00:00Z").getTime()
    );
  });

  it("returns 5 working day deadline for police involvement", () => {
    const result = getRequiredNotifications("police_involvement", "2026-05-17T10:00:00Z");
    expect(result[0].urgency).toBe("within_5_working_days");
  });

  it("returns correct recipients for outbreak infection", () => {
    const result = getRequiredNotifications("outbreak_infection", "2026-05-17T10:00:00Z");
    const recipients = result.map(r => r.recipient);
    expect(recipients).toContain("public_health");
    expect(recipients).toContain("ofsted");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Helper functions", () => {
  it("getCategoryLabel returns readable labels", () => {
    expect(getCategoryLabel("death")).toBe("Death of a Child");
    expect(getCategoryLabel("allegation_against_staff")).toBe("Allegation Against Staff");
    expect(getCategoryLabel("child_missing")).toBe("Child Missing");
  });

  it("getRecipientLabel returns readable labels", () => {
    expect(getRecipientLabel("ofsted")).toBe("Ofsted");
    expect(getRecipientLabel("designated_officer")).toBe("LADO/Designated Officer");
    expect(getRecipientLabel("public_health")).toBe("Public Health");
  });

  it("getUrgencyLabel returns readable labels", () => {
    expect(getUrgencyLabel("immediate")).toBe("Immediate (within 4 hours)");
    expect(getUrgencyLabel("within_24h")).toBe("Within 24 hours");
    expect(getUrgencyLabel("within_5_working_days")).toBe("Within 5 working days");
  });

  it("getCategoryUrgency maps correctly", () => {
    expect(getCategoryUrgency("death")).toBe("immediate");
    expect(getCategoryUrgency("serious_injury")).toBe("within_24h");
    expect(getCategoryUrgency("police_involvement")).toBe("within_5_working_days");
    expect(getCategoryUrgency("child_protection")).toBe("immediate");
  });
});
