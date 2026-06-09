// ══════════════════════════════════════════════════════════════════════════════
// Notification Timeliness Intelligence Engine — Tests
//
// Covers: event timeliness evaluation, metrics calculation, scoring,
// strengths/areas/actions generation, main intelligence function,
// helpers, edge cases.
//
// Demo data: Chamberlain House with 3 children (Alex, Jordan, Morgan).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateEventTimeliness,
  calculateTimelinessMetrics,
  calculateScore,
  generateStrengths,
  generateAreasForImprovement,
  generateActions,
  generateNotificationTimelinessIntelligence,
  getDeadlineHours,
  getNotificationTypeCategory,
  getRequiredRecipients,
  getNotificationTypeLabel,
  getRecipientLabel,
  getRating,
  getRatingLabel,
} from "../notification-timeliness-engine";
import type {
  NotifiableEvent,
  NotificationRecord,
  NotificationPolicy,
  NotificationAudit,
  NotificationCategory,
  NotificationType,
  NotificationRecipient,
  TimelinessMetrics,
  TimelinessScoreBreakdown,
  EventTimelinessResult,
} from "../notification-timeliness-engine";

// ── Test Fixtures ──────────────────────────────────────────────────────────

const NOW = "2026-05-18T12:00:00Z";
const HOME_ID = "oak-house";

function makeEvent(overrides: Partial<NotifiableEvent> = {}): NotifiableEvent {
  return {
    id: "evt-001",
    homeId: HOME_ID,
    category: "schedule_5",
    type: "serious_injury",
    title: "Alex sustained broken arm during activity",
    description: "Fall from climbing frame during outdoor activities.",
    childId: "child-alex",
    childName: "Alex",
    occurredAt: "2026-05-15T14:00:00Z",
    discoveredAt: "2026-05-15T14:00:00Z",
    severity: 3,
    loggedBy: "staff-darren",
    loggedAt: "2026-05-15T14:30:00Z",
    notifications: [
      {
        recipient: "ofsted",
        method: "online_form",
        sentAt: "2026-05-15T16:00:00Z",
        acknowledgedAt: "2026-05-15T18:00:00Z",
        status: "submitted_on_time",
        contentSummary: "Notification of serious injury to child.",
        reference: "OF-2026-1234",
      },
      {
        recipient: "local_authority",
        method: "email",
        sentAt: "2026-05-15T16:30:00Z",
        status: "submitted_on_time",
        contentSummary: "Notification of serious injury.",
      },
      {
        recipient: "parent_carer",
        method: "phone",
        sentAt: "2026-05-15T14:45:00Z",
        acknowledgedAt: "2026-05-15T14:50:00Z",
        status: "submitted_on_time",
        contentSummary: "Phone call to parent regarding injury.",
      },
      {
        recipient: "placing_authority",
        method: "email",
        sentAt: "2026-05-15T17:00:00Z",
        status: "submitted_on_time",
        contentSummary: "Email to placing authority.",
      },
    ],
    followUpRequired: true,
    followUpCompletedAt: "2026-05-16T10:00:00Z",
    ...overrides,
  };
}

function makeNotification(overrides: Partial<NotificationRecord> = {}): NotificationRecord {
  return {
    recipient: "ofsted",
    method: "online_form",
    sentAt: "2026-05-15T16:00:00Z",
    status: "submitted_on_time",
    contentSummary: "Standard notification.",
    ...overrides,
  };
}

function makePolicy(overrides: Partial<NotificationPolicy> = {}): NotificationPolicy {
  return {
    homeId: HOME_ID,
    policyDocumentTitle: "Chamberlain House Notification Policy v3.1",
    lastReviewedAt: "2026-03-01",
    nextReviewDue: "2026-09-01",
    approvedBy: "Darren Laville",
    coversSchedule5: true,
    coversSchedule6: true,
    coversStakeholderNotification: true,
    staffTrainedCount: 8,
    totalStaffCount: 10,
    escalationProcedureDocumented: true,
    outOfHoursContactsDocumented: true,
    ...overrides,
  };
}

function makeAudit(overrides: Partial<NotificationAudit> = {}): NotificationAudit {
  return {
    id: "audit-001",
    homeId: HOME_ID,
    auditDate: "2026-04-01",
    auditor: "Sarah Johnson",
    findings: ["All Schedule 5 notifications submitted on time"],
    recommendations: ["Improve acknowledgement tracking"],
    overallCompliance: "compliant",
    actionPlanInPlace: true,
    nextAuditDue: "2026-10-01",
    ...overrides,
  };
}

// Chamberlain House demo events for Alex, Jordan, Morgan
function makeOakHouseEvents(): NotifiableEvent[] {
  return [
    // Event 1: Alex serious injury — all on time
    makeEvent({
      id: "evt-alex-001",
      childId: "child-alex",
      childName: "Alex",
      type: "serious_injury",
      category: "schedule_5",
      title: "Alex broke arm during outdoor activity",
      occurredAt: "2026-05-10T10:00:00Z",
      discoveredAt: "2026-05-10T10:00:00Z",
      loggedAt: "2026-05-10T10:30:00Z",
      notifications: [
        makeNotification({ recipient: "ofsted", sentAt: "2026-05-10T12:00:00Z", acknowledgedAt: "2026-05-10T14:00:00Z", status: "submitted_on_time" }),
        makeNotification({ recipient: "local_authority", sentAt: "2026-05-10T12:30:00Z", method: "email", status: "submitted_on_time" }),
        makeNotification({ recipient: "parent_carer", sentAt: "2026-05-10T10:30:00Z", method: "phone", acknowledgedAt: "2026-05-10T10:35:00Z", status: "submitted_on_time" }),
        makeNotification({ recipient: "placing_authority", sentAt: "2026-05-10T13:00:00Z", method: "email", status: "submitted_on_time" }),
      ],
      followUpRequired: true,
      followUpCompletedAt: "2026-05-11T09:00:00Z",
    }),
    // Event 2: Jordan absconding — Ofsted late, police not notified
    makeEvent({
      id: "evt-jordan-001",
      childId: "child-jordan",
      childName: "Jordan",
      type: "absconding",
      category: "schedule_5",
      title: "Jordan left the home without permission",
      occurredAt: "2026-05-12T22:00:00Z",
      discoveredAt: "2026-05-12T22:30:00Z",
      loggedAt: "2026-05-12T23:00:00Z",
      notifications: [
        makeNotification({ recipient: "ofsted", sentAt: "2026-05-14T10:00:00Z", status: "submitted_late" }),
        makeNotification({ recipient: "local_authority", sentAt: "2026-05-13T08:00:00Z", method: "email", status: "submitted_on_time" }),
        makeNotification({ recipient: "parent_carer", sentAt: "2026-05-12T23:00:00Z", method: "phone", acknowledgedAt: "2026-05-12T23:05:00Z", status: "submitted_on_time" }),
        // police NOT notified — missing
      ],
      followUpRequired: true,
      followUpCompletedAt: "2026-05-13T12:00:00Z",
    }),
    // Event 3: Morgan allegation against staff — all on time
    makeEvent({
      id: "evt-morgan-001",
      childId: "child-morgan",
      childName: "Morgan",
      type: "allegation_against_staff",
      category: "schedule_5",
      title: "Morgan disclosed allegation against night staff",
      occurredAt: "2026-05-14T08:00:00Z",
      discoveredAt: "2026-05-14T08:00:00Z",
      loggedAt: "2026-05-14T08:15:00Z",
      notifications: [
        makeNotification({ recipient: "ofsted", sentAt: "2026-05-14T09:00:00Z", acknowledgedAt: "2026-05-14T11:00:00Z", status: "submitted_on_time" }),
        makeNotification({ recipient: "local_authority", sentAt: "2026-05-14T09:30:00Z", method: "email", status: "submitted_on_time" }),
        makeNotification({ recipient: "lado", sentAt: "2026-05-14T08:30:00Z", method: "phone", acknowledgedAt: "2026-05-14T09:00:00Z", status: "submitted_on_time" }),
      ],
      followUpRequired: true,
      followUpCompletedAt: "2026-05-15T14:00:00Z",
    }),
    // Event 4: Jordan child protection — Schedule 6, on time
    makeEvent({
      id: "evt-jordan-002",
      childId: "child-jordan",
      childName: "Jordan",
      type: "child_protection",
      category: "schedule_6",
      title: "Jordan disclosed historical abuse",
      occurredAt: "2026-05-16T11:00:00Z",
      discoveredAt: "2026-05-16T11:00:00Z",
      loggedAt: "2026-05-16T11:15:00Z",
      notifications: [
        makeNotification({ recipient: "ofsted", sentAt: "2026-05-16T12:00:00Z", status: "submitted_on_time" }),
        makeNotification({ recipient: "local_authority", sentAt: "2026-05-16T12:00:00Z", method: "phone", acknowledgedAt: "2026-05-16T12:15:00Z", status: "submitted_on_time" }),
        makeNotification({ recipient: "parent_carer", sentAt: "2026-05-16T13:00:00Z", method: "phone", status: "submitted_on_time" }),
        makeNotification({ recipient: "placing_authority", sentAt: "2026-05-16T13:30:00Z", method: "email", status: "submitted_on_time" }),
      ],
      followUpRequired: true,
      followUpCompletedAt: "2026-05-17T10:00:00Z",
    }),
    // Event 5: Alex police involvement — not submitted to Ofsted
    makeEvent({
      id: "evt-alex-002",
      childId: "child-alex",
      childName: "Alex",
      type: "police_involvement",
      category: "schedule_5",
      title: "Police called after Alex found with suspected stolen goods",
      occurredAt: "2026-05-17T16:00:00Z",
      discoveredAt: "2026-05-17T16:00:00Z",
      loggedAt: "2026-05-17T16:30:00Z",
      notifications: [
        // Ofsted NOT notified — pending (within deadline still)
        makeNotification({ recipient: "local_authority", sentAt: "2026-05-17T17:00:00Z", method: "email", status: "submitted_on_time" }),
        makeNotification({ recipient: "placing_authority", sentAt: "2026-05-17T17:30:00Z", method: "email", status: "submitted_on_time" }),
      ],
      followUpRequired: false,
    }),
  ];
}

// ── Helper Function Tests ──────────────────────────────────────────────────

describe("getDeadlineHours", () => {
  it("returns 24 hours for schedule_5", () => {
    expect(getDeadlineHours("schedule_5")).toBe(24);
  });

  it("returns 4 hours for schedule_6", () => {
    expect(getDeadlineHours("schedule_6")).toBe(4);
  });
});

describe("getNotificationTypeCategory", () => {
  it("maps death to schedule_5", () => {
    expect(getNotificationTypeCategory("death")).toBe("schedule_5");
  });

  it("maps child_protection to schedule_6", () => {
    expect(getNotificationTypeCategory("child_protection")).toBe("schedule_6");
  });

  it("maps deprivation_of_liberty to schedule_6", () => {
    expect(getNotificationTypeCategory("deprivation_of_liberty")).toBe("schedule_6");
  });

  it("maps serious_injury to schedule_5", () => {
    expect(getNotificationTypeCategory("serious_injury")).toBe("schedule_5");
  });

  it("maps allegation_against_staff to schedule_5", () => {
    expect(getNotificationTypeCategory("allegation_against_staff")).toBe("schedule_5");
  });

  it("maps absconding to schedule_5", () => {
    expect(getNotificationTypeCategory("absconding")).toBe("schedule_5");
  });

  it("maps manager_change to schedule_5", () => {
    expect(getNotificationTypeCategory("manager_change")).toBe("schedule_5");
  });

  it("maps closure to schedule_5", () => {
    expect(getNotificationTypeCategory("closure")).toBe("schedule_5");
  });

  it("maps other to schedule_5", () => {
    expect(getNotificationTypeCategory("other")).toBe("schedule_5");
  });
});

describe("getRequiredRecipients", () => {
  it("includes ofsted, LA, parent, placing auth, police for death", () => {
    const recipients = getRequiredRecipients("death");
    expect(recipients).toContain("ofsted");
    expect(recipients).toContain("local_authority");
    expect(recipients).toContain("parent_carer");
    expect(recipients).toContain("placing_authority");
    expect(recipients).toContain("police");
    expect(recipients).toHaveLength(5);
  });

  it("includes ofsted, LA, LADO for allegation_against_staff", () => {
    const recipients = getRequiredRecipients("allegation_against_staff");
    expect(recipients).toContain("ofsted");
    expect(recipients).toContain("local_authority");
    expect(recipients).toContain("lado");
    expect(recipients).toHaveLength(3);
  });

  it("returns only ofsted for accommodation_change", () => {
    const recipients = getRequiredRecipients("accommodation_change");
    expect(recipients).toEqual(["ofsted"]);
  });

  it("returns only ofsted for manager_change", () => {
    const recipients = getRequiredRecipients("manager_change");
    expect(recipients).toEqual(["ofsted"]);
  });

  it("includes police for absconding", () => {
    const recipients = getRequiredRecipients("absconding");
    expect(recipients).toContain("police");
  });

  it("includes placing_authority for closure", () => {
    const recipients = getRequiredRecipients("closure");
    expect(recipients).toContain("placing_authority");
    expect(recipients).toContain("parent_carer");
  });
});

describe("getNotificationTypeLabel", () => {
  it("returns 'Death of a Child' for death", () => {
    expect(getNotificationTypeLabel("death")).toBe("Death of a Child");
  });

  it("returns 'Serious Injury' for serious_injury", () => {
    expect(getNotificationTypeLabel("serious_injury")).toBe("Serious Injury");
  });

  it("returns 'Absconding / Missing' for absconding", () => {
    expect(getNotificationTypeLabel("absconding")).toBe("Absconding / Missing");
  });

  it("returns 'Manager Change' for manager_change", () => {
    expect(getNotificationTypeLabel("manager_change")).toBe("Manager Change");
  });
});

describe("getRecipientLabel", () => {
  it("returns 'Ofsted' for ofsted", () => {
    expect(getRecipientLabel("ofsted")).toBe("Ofsted");
  });

  it("returns 'Local Authority' for local_authority", () => {
    expect(getRecipientLabel("local_authority")).toBe("Local Authority");
  });

  it("returns 'LADO' for lado", () => {
    expect(getRecipientLabel("lado")).toBe("LADO");
  });

  it("returns 'Parent/Carer' for parent_carer", () => {
    expect(getRecipientLabel("parent_carer")).toBe("Parent/Carer");
  });

  it("returns 'Police' for police", () => {
    expect(getRecipientLabel("police")).toBe("Police");
  });

  it("returns 'Other' for other", () => {
    expect(getRecipientLabel("other")).toBe("Other");
  });
});

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(10)).toBe("inadequate");
  });
});

describe("getRatingLabel", () => {
  it("returns correct labels for all ratings", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateEventTimeliness Tests ──────────────────────────────────────────

describe("evaluateEventTimeliness", () => {
  it("identifies a fully compliant event with all on-time notifications", () => {
    const event = makeEvent();
    const result = evaluateEventTimeliness(event, NOW);
    expect(result.ofstedNotifiedOnTime).toBe(true);
    expect(result.ofstedDelayHours).toBe(0);
    expect(result.allRecipientsNotified).toBe(true);
    expect(result.missingRecipients).toHaveLength(0);
    expect(result.issues).toHaveLength(0);
  });

  it("identifies late Ofsted notification for schedule_5 event", () => {
    const event = makeEvent({
      discoveredAt: "2026-05-15T10:00:00Z",
      notifications: [
        makeNotification({ recipient: "ofsted", sentAt: "2026-05-16T14:00:00Z", status: "submitted_late" }),
        makeNotification({ recipient: "local_authority", sentAt: "2026-05-15T12:00:00Z", method: "email" }),
        makeNotification({ recipient: "parent_carer", sentAt: "2026-05-15T11:00:00Z", method: "phone" }),
        makeNotification({ recipient: "placing_authority", sentAt: "2026-05-15T13:00:00Z", method: "email" }),
      ],
    });
    const result = evaluateEventTimeliness(event, NOW);
    expect(result.ofstedNotifiedOnTime).toBe(false);
    expect(result.ofstedDelayHours).toBeGreaterThan(0);
    expect(result.issues.some(i => i.includes("Ofsted"))).toBe(true);
  });

  it("identifies missing recipients", () => {
    const event = makeEvent({
      type: "death",
      notifications: [
        makeNotification({ recipient: "ofsted", sentAt: "2026-05-15T15:00:00Z" }),
        // Missing: local_authority, parent_carer, placing_authority, police
      ],
    });
    const result = evaluateEventTimeliness(event, NOW);
    expect(result.missingRecipients).toContain("local_authority");
    expect(result.missingRecipients).toContain("parent_carer");
    expect(result.missingRecipients).toContain("placing_authority");
    expect(result.missingRecipients).toContain("police");
    expect(result.allRecipientsNotified).toBe(false);
  });

  it("handles schedule_6 events with 4-hour deadline", () => {
    const event = makeEvent({
      category: "schedule_6",
      type: "child_protection",
      discoveredAt: "2026-05-15T10:00:00Z",
      notifications: [
        makeNotification({ recipient: "ofsted", sentAt: "2026-05-15T15:00:00Z" }),
        makeNotification({ recipient: "local_authority", sentAt: "2026-05-15T11:00:00Z" }),
        makeNotification({ recipient: "parent_carer", sentAt: "2026-05-15T11:30:00Z" }),
        makeNotification({ recipient: "placing_authority", sentAt: "2026-05-15T12:00:00Z" }),
      ],
    });
    const result = evaluateEventTimeliness(event, NOW);
    // Ofsted sent at 15:00, deadline was 14:00 (10:00 + 4h) — 1 hour late
    expect(result.ofstedNotifiedOnTime).toBe(false);
    expect(result.ofstedDelayHours).toBe(1);
  });

  it("detects not-submitted Ofsted notification past deadline", () => {
    const event = makeEvent({
      discoveredAt: "2026-05-16T10:00:00Z",
      notifications: [
        // No Ofsted notification at all
        makeNotification({ recipient: "local_authority", sentAt: "2026-05-16T12:00:00Z", method: "email" }),
        makeNotification({ recipient: "parent_carer", sentAt: "2026-05-16T11:00:00Z", method: "phone" }),
        makeNotification({ recipient: "placing_authority", sentAt: "2026-05-16T13:00:00Z", method: "email" }),
      ],
    });
    const result = evaluateEventTimeliness(event, NOW);
    expect(result.ofstedNotifiedOnTime).toBe(false);
    expect(result.ofstedDelayHours).toBeGreaterThan(0);
    expect(result.issues.some(i => i.includes("Ofsted notification overdue"))).toBe(true);
  });

  it("returns correct acknowledgement rate", () => {
    const event = makeEvent({
      notifications: [
        makeNotification({ recipient: "ofsted", sentAt: "2026-05-15T16:00:00Z", acknowledgedAt: "2026-05-15T18:00:00Z" }),
        makeNotification({ recipient: "local_authority", sentAt: "2026-05-15T16:30:00Z" }),
        makeNotification({ recipient: "parent_carer", sentAt: "2026-05-15T14:45:00Z", acknowledgedAt: "2026-05-15T14:50:00Z" }),
        makeNotification({ recipient: "placing_authority", sentAt: "2026-05-15T17:00:00Z" }),
      ],
    });
    const result = evaluateEventTimeliness(event, NOW);
    expect(result.acknowledgementRate).toBe(50);
    expect(result.hasAcknowledgements).toBe(true);
  });

  it("identifies incomplete follow-up", () => {
    const event = makeEvent({
      followUpRequired: true,
      followUpCompletedAt: undefined,
    });
    const result = evaluateEventTimeliness(event, NOW);
    expect(result.hasFollowUp).toBe(false);
    expect(result.issues.some(i => i.includes("Follow-up"))).toBe(true);
  });

  it("counts follow-up as complete when not required", () => {
    const event = makeEvent({
      followUpRequired: false,
      followUpCompletedAt: undefined,
    });
    const result = evaluateEventTimeliness(event, NOW);
    expect(result.hasFollowUp).toBe(true);
  });

  it("flags missing content summaries", () => {
    const event = makeEvent({
      notifications: [
        makeNotification({ recipient: "ofsted", sentAt: "2026-05-15T16:00:00Z", contentSummary: undefined }),
        makeNotification({ recipient: "local_authority", sentAt: "2026-05-15T16:30:00Z", contentSummary: undefined }),
        makeNotification({ recipient: "parent_carer", sentAt: "2026-05-15T14:45:00Z", contentSummary: undefined }),
        makeNotification({ recipient: "placing_authority", sentAt: "2026-05-15T17:00:00Z", contentSummary: undefined }),
      ],
    });
    const result = evaluateEventTimeliness(event, NOW);
    expect(result.issues.some(i => i.includes("content summaries"))).toBe(true);
  });

  it("returns correct event ID, type, and category", () => {
    const event = makeEvent({ id: "evt-test-123", type: "allegation_against_staff", category: "schedule_5" });
    const result = evaluateEventTimeliness(event, NOW);
    expect(result.eventId).toBe("evt-test-123");
    expect(result.type).toBe("allegation_against_staff");
    expect(result.category).toBe("schedule_5");
  });

  it("handles event where Ofsted notification not sent but still within deadline", () => {
    // discoveredAt is close to NOW so deadline hasn't passed
    const event = makeEvent({
      discoveredAt: "2026-05-18T11:00:00Z",
      notifications: [
        makeNotification({ recipient: "local_authority", sentAt: "2026-05-18T11:30:00Z", method: "email" }),
        makeNotification({ recipient: "parent_carer", sentAt: "2026-05-18T11:15:00Z", method: "phone" }),
        makeNotification({ recipient: "placing_authority", sentAt: "2026-05-18T11:45:00Z", method: "email" }),
      ],
    });
    const result = evaluateEventTimeliness(event, NOW);
    // Ofsted not notified but deadline is 2026-05-19T11:00:00Z, NOW is before that
    expect(result.ofstedNotifiedOnTime).toBe(false);
    expect(result.ofstedDelayHours).toBe(0);
  });

  it("handles event with empty notifications array", () => {
    const event = makeEvent({
      notifications: [],
      discoveredAt: "2026-05-10T10:00:00Z",
    });
    const result = evaluateEventTimeliness(event, NOW);
    expect(result.ofstedNotifiedOnTime).toBe(false);
    expect(result.missingRecipients.length).toBeGreaterThan(0);
    expect(result.notifiedRecipients).toHaveLength(0);
  });
});

// ── calculateTimelinessMetrics Tests ───────────────────────────────────────

describe("calculateTimelinessMetrics", () => {
  it("returns perfect metrics for all on-time events", () => {
    const events = [makeEvent(), makeEvent({ id: "evt-002" })];
    const metrics = calculateTimelinessMetrics(events, NOW);
    expect(metrics.totalEvents).toBe(2);
    expect(metrics.onTimeCount).toBe(2);
    expect(metrics.lateCount).toBe(0);
    expect(metrics.notSubmittedCount).toBe(0);
    expect(metrics.onTimeRate).toBe(100);
    expect(metrics.lateRate).toBe(0);
  });

  it("correctly counts schedule 5 and schedule 6 events", () => {
    const events = [
      makeEvent({ category: "schedule_5" }),
      makeEvent({ id: "evt-002", category: "schedule_6", type: "child_protection" }),
      makeEvent({ id: "evt-003", category: "schedule_5" }),
    ];
    const metrics = calculateTimelinessMetrics(events, NOW);
    expect(metrics.schedule5Count).toBe(2);
    expect(metrics.schedule6Count).toBe(1);
  });

  it("returns defaults for empty events array", () => {
    const metrics = calculateTimelinessMetrics([], NOW);
    expect(metrics.totalEvents).toBe(0);
    expect(metrics.onTimeRate).toBe(100);
    expect(metrics.lateRate).toBe(0);
    expect(metrics.notSubmittedRate).toBe(0);
    expect(metrics.averageDelayHours).toBe(0);
    expect(metrics.completenessRate).toBe(100);
    expect(metrics.followUpRate).toBe(100);
  });

  it("calculates correct late rate when some events are late", () => {
    const events = [
      makeEvent(),
      makeEvent({
        id: "evt-002",
        discoveredAt: "2026-05-14T10:00:00Z",
        notifications: [
          makeNotification({ recipient: "ofsted", sentAt: "2026-05-15T14:00:00Z" }),
          makeNotification({ recipient: "local_authority", sentAt: "2026-05-14T12:00:00Z" }),
          makeNotification({ recipient: "parent_carer", sentAt: "2026-05-14T11:00:00Z" }),
          makeNotification({ recipient: "placing_authority", sentAt: "2026-05-14T13:00:00Z" }),
        ],
      }),
    ];
    const metrics = calculateTimelinessMetrics(events, NOW);
    expect(metrics.lateCount).toBe(1);
    expect(metrics.onTimeCount).toBe(1);
    expect(metrics.lateRate).toBe(50);
    expect(metrics.onTimeRate).toBe(50);
  });

  it("calculates average delay hours", () => {
    const events = [
      makeEvent({
        id: "evt-late",
        discoveredAt: "2026-05-14T10:00:00Z",
        notifications: [
          makeNotification({ recipient: "ofsted", sentAt: "2026-05-15T14:00:00Z" }),
          makeNotification({ recipient: "local_authority", sentAt: "2026-05-14T12:00:00Z" }),
          makeNotification({ recipient: "parent_carer", sentAt: "2026-05-14T11:00:00Z" }),
          makeNotification({ recipient: "placing_authority", sentAt: "2026-05-14T13:00:00Z" }),
        ],
      }),
    ];
    const metrics = calculateTimelinessMetrics(events, NOW);
    expect(metrics.averageDelayHours).toBeGreaterThan(0);
  });

  it("calculates completeness rate correctly", () => {
    // serious_injury requires: ofsted, local_authority, parent_carer, placing_authority (4 recipients)
    const events = [
      makeEvent({
        type: "serious_injury",
        notifications: [
          makeNotification({ recipient: "ofsted", sentAt: "2026-05-15T16:00:00Z" }),
          makeNotification({ recipient: "local_authority", sentAt: "2026-05-15T16:30:00Z" }),
          // parent_carer and placing_authority missing
        ],
      }),
    ];
    const metrics = calculateTimelinessMetrics(events, NOW);
    expect(metrics.completenessRate).toBe(50); // 2 of 4
  });

  it("calculates acknowledgement rate", () => {
    const events = [
      makeEvent({
        notifications: [
          makeNotification({ recipient: "ofsted", sentAt: "2026-05-15T16:00:00Z", acknowledgedAt: "2026-05-15T18:00:00Z" }),
          makeNotification({ recipient: "local_authority", sentAt: "2026-05-15T16:30:00Z" }),
          makeNotification({ recipient: "parent_carer", sentAt: "2026-05-15T14:45:00Z" }),
          makeNotification({ recipient: "placing_authority", sentAt: "2026-05-15T17:00:00Z" }),
        ],
      }),
    ];
    const metrics = calculateTimelinessMetrics(events, NOW);
    expect(metrics.acknowledgementRate).toBe(25); // 1 of 4 acknowledged
  });

  it("calculates follow-up rate", () => {
    const events = [
      makeEvent({ followUpRequired: true, followUpCompletedAt: "2026-05-16T10:00:00Z" }),
      makeEvent({ id: "evt-002", followUpRequired: true, followUpCompletedAt: undefined }),
      makeEvent({ id: "evt-003", followUpRequired: false }),
    ];
    const metrics = calculateTimelinessMetrics(events, NOW);
    expect(metrics.followUpRate).toBe(50); // 1 of 2 required follow-ups completed
  });

  it("handles events with no Ofsted notification past deadline", () => {
    const events = [
      makeEvent({
        discoveredAt: "2026-05-10T10:00:00Z",
        notifications: [
          makeNotification({ recipient: "local_authority", sentAt: "2026-05-10T12:00:00Z", method: "email" }),
        ],
      }),
    ];
    const metrics = calculateTimelinessMetrics(events, NOW);
    expect(metrics.notSubmittedCount).toBe(1);
    expect(metrics.notSubmittedRate).toBe(100);
  });

  it("handles mixed statuses across multiple events", () => {
    const events = makeOakHouseEvents();
    const metrics = calculateTimelinessMetrics(events, NOW);
    expect(metrics.totalEvents).toBe(5);
    expect(metrics.onTimeCount).toBeGreaterThan(0);
    expect(metrics.lateCount).toBeGreaterThan(0);
  });

  it("returns 100% follow-up rate when no follow-ups required", () => {
    const events = [
      makeEvent({ followUpRequired: false }),
    ];
    const metrics = calculateTimelinessMetrics(events, NOW);
    expect(metrics.followUpRate).toBe(100);
  });

  it("handles pending events still within deadline", () => {
    const events = [
      makeEvent({
        discoveredAt: "2026-05-18T11:00:00Z",
        notifications: [],
      }),
    ];
    const metrics = calculateTimelinessMetrics(events, NOW);
    expect(metrics.pendingCount).toBe(1);
    expect(metrics.notSubmittedCount).toBe(0);
  });
});

// ── calculateScore Tests ───────────────────────────────────────────────────

describe("calculateScore", () => {
  it("returns max score (100) for perfect metrics and policy", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 10,
      schedule5Count: 8,
      schedule6Count: 2,
      onTimeCount: 10,
      lateCount: 0,
      notSubmittedCount: 0,
      pendingCount: 0,
      onTimeRate: 100,
      lateRate: 0,
      notSubmittedRate: 0,
      averageDelayHours: 0,
      completenessRate: 100,
      acknowledgementRate: 100,
      followUpRate: 100,
    };
    const policy = makePolicy({ staffTrainedCount: 10, totalStaffCount: 10 });
    const audit = makeAudit();
    const score = calculateScore(metrics, policy, [audit], NOW);

    expect(score.ofstedTimeliness).toBe(30);
    expect(score.stakeholderNotification).toBe(25);
    expect(score.qualityCompleteness).toBe(25);
    expect(score.policyCompliance).toBeLessThanOrEqual(20);
    expect(score.total).toBeGreaterThanOrEqual(80);
  });

  it("returns 0 for ofstedTimeliness when nothing is on time", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 5,
      schedule5Count: 5,
      schedule6Count: 0,
      onTimeCount: 0,
      lateCount: 3,
      notSubmittedCount: 2,
      pendingCount: 0,
      onTimeRate: 0,
      lateRate: 60,
      notSubmittedRate: 40,
      averageDelayHours: 36,
      completenessRate: 30,
      acknowledgementRate: 10,
      followUpRate: 20,
    };
    const score = calculateScore(metrics, null, [], NOW);
    expect(score.ofstedTimeliness).toBe(0);
  });

  it("penalises for not-submitted events", () => {
    const metricsAllOnTime: TimelinessMetrics = {
      totalEvents: 10, schedule5Count: 10, schedule6Count: 0,
      onTimeCount: 10, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const metricsWithMissing: TimelinessMetrics = {
      ...metricsAllOnTime,
      onTimeCount: 5, notSubmittedCount: 5,
      onTimeRate: 50, notSubmittedRate: 50,
    };
    const scoreAll = calculateScore(metricsAllOnTime, null, [], NOW);
    const scoreMissing = calculateScore(metricsWithMissing, null, [], NOW);
    expect(scoreMissing.ofstedTimeliness).toBeLessThan(scoreAll.ofstedTimeliness);
  });

  it("gives 0 policy compliance when no policy provided", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const score = calculateScore(metrics, null, [], NOW);
    expect(score.policyCompliance).toBe(0);
  });

  it("gives partial policy score for incomplete policy", () => {
    const policy = makePolicy({
      coversSchedule5: true,
      coversSchedule6: false,
      coversStakeholderNotification: false,
      escalationProcedureDocumented: false,
      outOfHoursContactsDocumented: false,
      staffTrainedCount: 3,
      totalStaffCount: 10,
    });
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const score = calculateScore(metrics, policy, [], NOW);
    expect(score.policyCompliance).toBeGreaterThan(0);
    expect(score.policyCompliance).toBeLessThan(20);
  });

  it("penalises for overdue policy review", () => {
    const policyOnTime = makePolicy({ nextReviewDue: "2026-09-01" });
    const policyOverdue = makePolicy({ nextReviewDue: "2026-01-01" });
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const scoreOnTime = calculateScore(metrics, policyOnTime, [], NOW);
    const scoreOverdue = calculateScore(metrics, policyOverdue, [], NOW);
    expect(scoreOverdue.policyCompliance).toBeLessThan(scoreOnTime.policyCompliance);
  });

  it("penalises for non-compliant audit", () => {
    const goodAudit = makeAudit({ overallCompliance: "compliant" });
    const badAudit = makeAudit({ overallCompliance: "non_compliant" });
    const policy = makePolicy();
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const scoreGood = calculateScore(metrics, policy, [goodAudit], NOW);
    const scoreBad = calculateScore(metrics, policy, [badAudit], NOW);
    expect(scoreBad.policyCompliance).toBeLessThan(scoreGood.policyCompliance);
  });

  it("penalises for overdue audit", () => {
    const currentAudit = makeAudit({ nextAuditDue: "2026-10-01" });
    const overdueAudit = makeAudit({ nextAuditDue: "2026-01-01" });
    const policy = makePolicy();
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const scoreCurrent = calculateScore(metrics, policy, [currentAudit], NOW);
    const scoreOverdue = calculateScore(metrics, policy, [overdueAudit], NOW);
    expect(scoreOverdue.policyCompliance).toBeLessThan(scoreCurrent.policyCompliance);
  });

  it("scores stakeholder notification based on completeness and acknowledgement", () => {
    const metricsHigh: TimelinessMetrics = {
      totalEvents: 5, schedule5Count: 5, schedule6Count: 0,
      onTimeCount: 5, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const metricsLow: TimelinessMetrics = {
      ...metricsHigh,
      completenessRate: 20,
      acknowledgementRate: 0,
    };
    const scoreHigh = calculateScore(metricsHigh, null, [], NOW);
    const scoreLow = calculateScore(metricsLow, null, [], NOW);
    expect(scoreHigh.stakeholderNotification).toBeGreaterThan(scoreLow.stakeholderNotification);
  });

  it("scores quality completeness based on follow-up and delay", () => {
    const metricsGood: TimelinessMetrics = {
      totalEvents: 5, schedule5Count: 5, schedule6Count: 0,
      onTimeCount: 5, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const metricsBad: TimelinessMetrics = {
      ...metricsGood,
      averageDelayHours: 72,
      followUpRate: 0,
    };
    const scoreGood = calculateScore(metricsGood, null, [], NOW);
    const scoreBad = calculateScore(metricsBad, null, [], NOW);
    expect(scoreGood.qualityCompleteness).toBeGreaterThan(scoreBad.qualityCompleteness);
  });

  it("total never exceeds 100", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 10, schedule5Count: 10, schedule6Count: 0,
      onTimeCount: 10, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const policy = makePolicy({ staffTrainedCount: 10, totalStaffCount: 10 });
    const audit = makeAudit();
    const score = calculateScore(metrics, policy, [audit], NOW);
    expect(score.total).toBeLessThanOrEqual(100);
  });

  it("handles no events gracefully", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 0, schedule5Count: 0, schedule6Count: 0,
      onTimeCount: 0, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 0, followUpRate: 100,
    };
    const score = calculateScore(metrics, makePolicy(), [makeAudit()], NOW);
    expect(score.total).toBeGreaterThan(0);
    expect(score.ofstedTimeliness).toBe(30);
  });

  it("uses latest audit when multiple provided", () => {
    const olderAudit = makeAudit({ auditDate: "2026-01-01", overallCompliance: "non_compliant", nextAuditDue: "2026-07-01" });
    const newerAudit = makeAudit({ id: "audit-002", auditDate: "2026-04-01", overallCompliance: "compliant", nextAuditDue: "2026-10-01" });
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const policy = makePolicy();
    const score = calculateScore(metrics, policy, [olderAudit, newerAudit], NOW);
    // Should use the newer (compliant) audit — no penalty
    expect(score.policyCompliance).toBeGreaterThan(15);
  });
});

// ── generateStrengths Tests ────────────────────────────────────────────────

describe("generateStrengths", () => {
  it("generates strength for high on-time rate", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 10, schedule5Count: 8, schedule6Count: 2,
      onTimeCount: 10, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 95, acknowledgementRate: 80, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 25, qualityCompleteness: 25, policyCompliance: 18, total: 98 };
    const strengths = generateStrengths(metrics, score, makePolicy(), []);
    expect(strengths.some(s => s.includes("100%"))).toBe(true);
  });

  it("generates strength for high completeness", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 5, schedule5Count: 5, schedule6Count: 0,
      onTimeCount: 5, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 95, acknowledgementRate: 50, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 20, qualityCompleteness: 25, policyCompliance: 15, total: 90 };
    const strengths = generateStrengths(metrics, score, null, []);
    expect(strengths.some(s => s.includes("stakeholder"))).toBe(true);
  });

  it("generates strength for zero missed notifications", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 3, schedule5Count: 3, schedule6Count: 0,
      onTimeCount: 3, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 80, acknowledgementRate: 40, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 16, qualityCompleteness: 25, policyCompliance: 10, total: 81 };
    const strengths = generateStrengths(metrics, score, null, []);
    expect(strengths.some(s => s.includes("No missed notifications"))).toBe(true);
  });

  it("generates strength for good policy compliance", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 25, qualityCompleteness: 25, policyCompliance: 18, total: 98 };
    const strengths = generateStrengths(metrics, score, makePolicy(), []);
    expect(strengths.some(s => s.includes("policy") || s.includes("Escalation"))).toBe(true);
  });

  it("returns empty array when no criteria met", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 5, schedule5Count: 5, schedule6Count: 0,
      onTimeCount: 1, lateCount: 2, notSubmittedCount: 2, pendingCount: 0,
      onTimeRate: 20, lateRate: 40, notSubmittedRate: 40,
      averageDelayHours: 36, completenessRate: 30, acknowledgementRate: 10, followUpRate: 20,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 0, stakeholderNotification: 3, qualityCompleteness: 3, policyCompliance: 0, total: 6 };
    const strengths = generateStrengths(metrics, score, null, []);
    expect(strengths.length).toBeLessThanOrEqual(1);
  });
});

// ── generateAreasForImprovement Tests ──────────────────────────────────────

describe("generateAreasForImprovement", () => {
  it("flags high late rate", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 5, schedule5Count: 5, schedule6Count: 0,
      onTimeCount: 2, lateCount: 3, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 40, lateRate: 60, notSubmittedRate: 0,
      averageDelayHours: 12, completenessRate: 80, acknowledgementRate: 50, followUpRate: 80,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 12, stakeholderNotification: 17, qualityCompleteness: 16, policyCompliance: 10, total: 55 };
    const areas = generateAreasForImprovement(metrics, score, makePolicy(), [], [], NOW);
    expect(areas.some(a => a.includes("Late notification rate"))).toBe(true);
  });

  it("flags not-submitted events", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 3, schedule5Count: 3, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 2, pendingCount: 0,
      onTimeRate: 33.3, lateRate: 0, notSubmittedRate: 66.7,
      averageDelayHours: 48, completenessRate: 50, acknowledgementRate: 20, followUpRate: 50,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 0, stakeholderNotification: 9, qualityCompleteness: 6, policyCompliance: 0, total: 15 };
    const areas = generateAreasForImprovement(metrics, score, null, [], [], NOW);
    expect(areas.some(a => a.includes("not been notified to Ofsted"))).toBe(true);
  });

  it("flags missing policy", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 25, qualityCompleteness: 25, policyCompliance: 0, total: 80 };
    const areas = generateAreasForImprovement(metrics, score, null, [], [], NOW);
    expect(areas.some(a => a.includes("No notification policy found"))).toBe(true);
  });

  it("flags overdue policy review", () => {
    const policy = makePolicy({ nextReviewDue: "2026-01-01" });
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 25, qualityCompleteness: 25, policyCompliance: 14, total: 94 };
    const areas = generateAreasForImprovement(metrics, score, policy, [], [], NOW);
    expect(areas.some(a => a.includes("overdue for review"))).toBe(true);
  });

  it("flags low training rate", () => {
    const policy = makePolicy({ staffTrainedCount: 2, totalStaffCount: 10 });
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 25, qualityCompleteness: 25, policyCompliance: 10, total: 90 };
    const areas = generateAreasForImprovement(metrics, score, policy, [], [], NOW);
    expect(areas.some(a => a.includes("staff trained"))).toBe(true);
  });

  it("flags low acknowledgement rate", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 5, schedule5Count: 5, schedule6Count: 0,
      onTimeCount: 5, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 90, acknowledgementRate: 20, followUpRate: 80,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 16, qualityCompleteness: 22, policyCompliance: 15, total: 83 };
    const areas = generateAreasForImprovement(metrics, score, makePolicy(), [], [], NOW);
    expect(areas.some(a => a.includes("acknowledgement rate"))).toBe(true);
  });

  it("flags no audits on record", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 25, qualityCompleteness: 25, policyCompliance: 15, total: 95 };
    const areas = generateAreasForImprovement(metrics, score, makePolicy(), [], [], NOW);
    expect(areas.some(a => a.includes("No notification audits"))).toBe(true);
  });

  it("flags overdue audit", () => {
    const audit = makeAudit({ nextAuditDue: "2026-01-01" });
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 25, qualityCompleteness: 25, policyCompliance: 15, total: 95 };
    const areas = generateAreasForImprovement(metrics, score, makePolicy(), [audit], [], NOW);
    expect(areas.some(a => a.includes("audit is overdue"))).toBe(true);
  });

  it("flags events with multiple missing recipients", () => {
    const eventResults: EventTimelinessResult[] = [
      {
        eventId: "evt-1", type: "death", category: "schedule_5", title: "Test",
        ofstedNotifiedOnTime: true, ofstedDelayHours: 0,
        requiredRecipients: ["ofsted", "local_authority", "parent_carer", "placing_authority", "police"],
        notifiedRecipients: ["ofsted"],
        missingRecipients: ["local_authority", "parent_carer", "placing_authority", "police"],
        allRecipientsNotified: false, hasAcknowledgements: false, acknowledgementRate: 0, hasFollowUp: true, issues: [],
      },
    ];
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 20, acknowledgementRate: 0, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 3, qualityCompleteness: 25, policyCompliance: 0, total: 58 };
    const areas = generateAreasForImprovement(metrics, score, null, [], eventResults, NOW);
    expect(areas.some(a => a.includes("2 or more required recipients"))).toBe(true);
  });

  it("flags undocumented escalation procedure", () => {
    const policy = makePolicy({ escalationProcedureDocumented: false });
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 25, qualityCompleteness: 25, policyCompliance: 12, total: 92 };
    const areas = generateAreasForImprovement(metrics, score, policy, [], [], NOW);
    expect(areas.some(a => a.includes("Escalation procedure"))).toBe(true);
  });
});

// ── generateActions Tests ──────────────────────────────────────────────────

describe("generateActions", () => {
  it("generates urgent action for not-submitted Ofsted notifications", () => {
    const eventResults: EventTimelinessResult[] = [
      {
        eventId: "evt-1", type: "serious_injury", category: "schedule_5", title: "Test",
        ofstedNotifiedOnTime: false, ofstedDelayHours: 48,
        requiredRecipients: ["ofsted", "local_authority", "parent_carer", "placing_authority"],
        notifiedRecipients: ["local_authority"],
        missingRecipients: ["ofsted", "parent_carer", "placing_authority"],
        allRecipientsNotified: false, hasAcknowledgements: false, acknowledgementRate: 0, hasFollowUp: true, issues: [],
      },
    ];
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 0, lateCount: 0, notSubmittedCount: 1, pendingCount: 0,
      onTimeRate: 0, lateRate: 0, notSubmittedRate: 100,
      averageDelayHours: 48, completenessRate: 25, acknowledgementRate: 0, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 0, stakeholderNotification: 4, qualityCompleteness: 12, policyCompliance: 0, total: 16 };
    const actions = generateActions(metrics, score, null, [], eventResults, NOW);
    expect(actions.some(a => a.includes("URGENT"))).toBe(true);
  });

  it("generates action for missing policy", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 25, qualityCompleteness: 25, policyCompliance: 0, total: 80 };
    const actions = generateActions(metrics, score, null, [], [], NOW);
    expect(actions.some(a => a.includes("Develop and implement"))).toBe(true);
  });

  it("generates action for untrained staff", () => {
    const policy = makePolicy({ staffTrainedCount: 5, totalStaffCount: 10 });
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 25, qualityCompleteness: 25, policyCompliance: 14, total: 94 };
    const actions = generateActions(metrics, score, policy, [], [], NOW);
    expect(actions.some(a => a.includes("5 untrained staff"))).toBe(true);
  });

  it("generates action for no audits", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 25, qualityCompleteness: 25, policyCompliance: 15, total: 95 };
    const actions = generateActions(metrics, score, makePolicy(), [], [], NOW);
    expect(actions.some(a => a.includes("Schedule an internal notification audit"))).toBe(true);
  });

  it("generates action for overdue policy review", () => {
    const policy = makePolicy({ nextReviewDue: "2026-01-01" });
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 25, qualityCompleteness: 25, policyCompliance: 14, total: 94 };
    const actions = generateActions(metrics, score, policy, [makeAudit()], [], NOW);
    expect(actions.some(a => a.includes("Review and update the notification policy"))).toBe(true);
  });

  it("generates action for events with missing recipients", () => {
    const eventResults: EventTimelinessResult[] = [
      {
        eventId: "evt-1", type: "serious_injury", category: "schedule_5", title: "Test",
        ofstedNotifiedOnTime: true, ofstedDelayHours: 0,
        requiredRecipients: ["ofsted", "local_authority", "parent_carer", "placing_authority"],
        notifiedRecipients: ["ofsted", "local_authority"],
        missingRecipients: ["parent_carer", "placing_authority"],
        allRecipientsNotified: false, hasAcknowledgements: false, acknowledgementRate: 0, hasFollowUp: true, issues: [],
      },
    ];
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 50, acknowledgementRate: 0, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 8, qualityCompleteness: 25, policyCompliance: 0, total: 63 };
    const actions = generateActions(metrics, score, null, [], eventResults, NOW);
    expect(actions.some(a => a.includes("Complete notifications"))).toBe(true);
  });

  it("generates action for low acknowledgement rate", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 5, schedule5Count: 5, schedule6Count: 0,
      onTimeCount: 5, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 10, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 16, qualityCompleteness: 25, policyCompliance: 15, total: 86 };
    const actions = generateActions(metrics, score, makePolicy({ staffTrainedCount: 10, totalStaffCount: 10 }), [makeAudit()], [], NOW);
    expect(actions.some(a => a.includes("acknowledgement"))).toBe(true);
  });

  it("generates action for high average delay", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 3, schedule5Count: 3, schedule6Count: 0,
      onTimeCount: 0, lateCount: 3, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 0, lateRate: 100, notSubmittedRate: 0,
      averageDelayHours: 36, completenessRate: 80, acknowledgementRate: 50, followUpRate: 80,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 0, stakeholderNotification: 17, qualityCompleteness: 13, policyCompliance: 0, total: 30 };
    const actions = generateActions(metrics, score, null, [], [], NOW);
    expect(actions.some(a => a.includes("root-cause analysis"))).toBe(true);
  });

  it("generates action for incomplete follow-ups", () => {
    const metrics: TimelinessMetrics = {
      totalEvents: 3, schedule5Count: 3, schedule6Count: 0,
      onTimeCount: 3, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 80, followUpRate: 50,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 23, qualityCompleteness: 19, policyCompliance: 15, total: 87 };
    const actions = generateActions(metrics, score, makePolicy({ staffTrainedCount: 10, totalStaffCount: 10 }), [makeAudit()], [], NOW);
    expect(actions.some(a => a.includes("follow-up actions"))).toBe(true);
  });

  it("generates action for undocumented escalation", () => {
    const policy = makePolicy({ escalationProcedureDocumented: false });
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 25, qualityCompleteness: 25, policyCompliance: 12, total: 92 };
    const actions = generateActions(metrics, score, policy, [makeAudit()], [], NOW);
    expect(actions.some(a => a.includes("escalation procedure"))).toBe(true);
  });

  it("generates action for undocumented out-of-hours contacts", () => {
    const policy = makePolicy({ outOfHoursContactsDocumented: false });
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const score: TimelinessScoreBreakdown = { ofstedTimeliness: 30, stakeholderNotification: 25, qualityCompleteness: 25, policyCompliance: 12, total: 92 };
    const actions = generateActions(metrics, score, policy, [makeAudit()], [], NOW);
    expect(actions.some(a => a.includes("out-of-hours"))).toBe(true);
  });
});

// ── generateNotificationTimelinessIntelligence Tests ───────────────────────

describe("generateNotificationTimelinessIntelligence", () => {
  it("produces a complete intelligence result for Chamberlain House demo data", () => {
    const events = makeOakHouseEvents();
    const policy = makePolicy();
    const audits = [makeAudit()];
    const result = generateNotificationTimelinessIntelligence(
      events, policy, audits, HOME_ID,
      "2026-05-01", "2026-05-18", NOW,
    );
    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe("2026-05-01");
    expect(result.periodEnd).toBe("2026-05-18");
    expect(result.metrics.totalEvents).toBe(5);
    expect(result.score.total).toBeGreaterThan(0);
    expect(result.score.total).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.eventResults).toHaveLength(5);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("filters events to the correct home", () => {
    const events = [
      makeEvent({ homeId: HOME_ID }),
      makeEvent({ id: "evt-other", homeId: "other-home" }),
    ];
    const result = generateNotificationTimelinessIntelligence(
      events, null, [], HOME_ID,
      "2026-05-01", "2026-05-31", NOW,
    );
    expect(result.metrics.totalEvents).toBe(1);
  });

  it("filters events to the correct period", () => {
    const events = [
      makeEvent({ occurredAt: "2026-05-10T10:00:00Z" }),
      makeEvent({ id: "evt-outside", occurredAt: "2026-04-01T10:00:00Z" }),
    ];
    const result = generateNotificationTimelinessIntelligence(
      events, null, [], HOME_ID,
      "2026-05-01", "2026-05-31", NOW,
    );
    expect(result.metrics.totalEvents).toBe(1);
  });

  it("handles empty events returning a sensible default", () => {
    const result = generateNotificationTimelinessIntelligence(
      [], makePolicy(), [makeAudit()], HOME_ID,
      "2026-05-01", "2026-05-31", NOW,
    );
    expect(result.metrics.totalEvents).toBe(0);
    expect(result.eventResults).toHaveLength(0);
    expect(result.score.total).toBeGreaterThan(0);
  });

  it("generates strengths array", () => {
    const events = makeOakHouseEvents();
    const result = generateNotificationTimelinessIntelligence(
      events, makePolicy(), [makeAudit()], HOME_ID,
      "2026-05-01", "2026-05-18", NOW,
    );
    expect(Array.isArray(result.strengths)).toBe(true);
  });

  it("generates areasForImprovement array", () => {
    const events = makeOakHouseEvents();
    const result = generateNotificationTimelinessIntelligence(
      events, makePolicy(), [makeAudit()], HOME_ID,
      "2026-05-01", "2026-05-18", NOW,
    );
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
  });

  it("generates actions array", () => {
    const events = makeOakHouseEvents();
    const result = generateNotificationTimelinessIntelligence(
      events, makePolicy(), [makeAudit()], HOME_ID,
      "2026-05-01", "2026-05-18", NOW,
    );
    expect(Array.isArray(result.actions)).toBe(true);
  });

  it("includes all regulatory links", () => {
    const result = generateNotificationTimelinessIntelligence(
      [], null, [], HOME_ID,
      "2026-05-01", "2026-05-31", NOW,
    );
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 40 — Notification of significant events");
    expect(result.regulatoryLinks).toContain("CHR 2015 Schedule 5 — Events to be notified to HMCI within 24 hours");
    expect(result.regulatoryLinks).toContain("CHR 2015 Schedule 6 — Events to be notified to HMCI without delay");
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 39 — Notification of concerns, etc. to persons and bodies");
    expect(result.regulatoryLinks).toContain("SCCIF — Social Care Common Inspection Framework");
  });

  it("returns rating consistent with score", () => {
    const events = makeOakHouseEvents();
    const result = generateNotificationTimelinessIntelligence(
      events, makePolicy(), [makeAudit()], HOME_ID,
      "2026-05-01", "2026-05-18", NOW,
    );
    if (result.score.total >= 80) expect(result.rating).toBe("outstanding");
    else if (result.score.total >= 60) expect(result.rating).toBe("good");
    else if (result.score.total >= 40) expect(result.rating).toBe("requires_improvement");
    else expect(result.rating).toBe("inadequate");
  });
});

// ── Edge Case Tests ────────────────────────────────────────────────────────

describe("Edge cases", () => {
  it("handles all-late events", () => {
    const events = Array.from({ length: 5 }, (_, i) =>
      makeEvent({
        id: `evt-late-${i}`,
        discoveredAt: "2026-05-10T10:00:00Z",
        notifications: [
          makeNotification({ recipient: "ofsted", sentAt: "2026-05-12T10:00:00Z" }),
          makeNotification({ recipient: "local_authority", sentAt: "2026-05-12T10:00:00Z" }),
          makeNotification({ recipient: "parent_carer", sentAt: "2026-05-12T10:00:00Z" }),
          makeNotification({ recipient: "placing_authority", sentAt: "2026-05-12T10:00:00Z" }),
        ],
      }),
    );
    const result = generateNotificationTimelinessIntelligence(
      events, null, [], HOME_ID,
      "2026-05-01", "2026-05-31", NOW,
    );
    expect(result.metrics.lateRate).toBe(100);
    expect(result.metrics.onTimeRate).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("handles all-on-time events scoring outstanding", () => {
    const events = Array.from({ length: 5 }, (_, i) =>
      makeEvent({
        id: `evt-good-${i}`,
        followUpRequired: true,
        followUpCompletedAt: "2026-05-16T10:00:00Z",
      }),
    );
    const policy = makePolicy({ staffTrainedCount: 10, totalStaffCount: 10 });
    const audit = makeAudit();
    const result = generateNotificationTimelinessIntelligence(
      events, policy, [audit], HOME_ID,
      "2026-05-01", "2026-05-31", NOW,
    );
    expect(result.metrics.onTimeRate).toBe(100);
    expect(result.score.total).toBeGreaterThanOrEqual(80);
  });

  it("handles event with all recipients missing", () => {
    const event = makeEvent({
      type: "death",
      notifications: [],
      discoveredAt: "2026-05-10T10:00:00Z",
    });
    const result = evaluateEventTimeliness(event, NOW);
    expect(result.missingRecipients.length).toBe(5); // death requires 5 recipients
    expect(result.ofstedNotifiedOnTime).toBe(false);
  });

  it("handles event with only 'other' recipients notified", () => {
    const event = makeEvent({
      notifications: [
        makeNotification({ recipient: "other", sentAt: "2026-05-15T16:00:00Z" }),
      ],
      discoveredAt: "2026-05-10T10:00:00Z",
    });
    const result = evaluateEventTimeliness(event, NOW);
    expect(result.ofstedNotifiedOnTime).toBe(false);
    expect(result.notifiedRecipients).not.toContain("ofsted");
  });

  it("handles policy with zero staff count", () => {
    const policy = makePolicy({ staffTrainedCount: 0, totalStaffCount: 0 });
    const metrics: TimelinessMetrics = {
      totalEvents: 1, schedule5Count: 1, schedule6Count: 0,
      onTimeCount: 1, lateCount: 0, notSubmittedCount: 0, pendingCount: 0,
      onTimeRate: 100, lateRate: 0, notSubmittedRate: 0,
      averageDelayHours: 0, completenessRate: 100, acknowledgementRate: 100, followUpRate: 100,
    };
    const score = calculateScore(metrics, policy, [], NOW);
    expect(score.policyCompliance).toBeGreaterThanOrEqual(0);
    expect(score.policyCompliance).toBeLessThanOrEqual(20);
  });

  it("handles event exactly at deadline boundary", () => {
    const event = makeEvent({
      discoveredAt: "2026-05-15T10:00:00Z",
      category: "schedule_5",
      notifications: [
        makeNotification({ recipient: "ofsted", sentAt: "2026-05-16T10:00:00Z" }),
        makeNotification({ recipient: "local_authority", sentAt: "2026-05-15T12:00:00Z" }),
        makeNotification({ recipient: "parent_carer", sentAt: "2026-05-15T11:00:00Z" }),
        makeNotification({ recipient: "placing_authority", sentAt: "2026-05-15T13:00:00Z" }),
      ],
    });
    const result = evaluateEventTimeliness(event, NOW);
    // sentAt exactly at discoveredAt + 24h = on time
    expect(result.ofstedNotifiedOnTime).toBe(true);
  });

  it("handles very large delay correctly", () => {
    const event = makeEvent({
      discoveredAt: "2026-01-01T10:00:00Z",
      notifications: [
        makeNotification({ recipient: "ofsted", sentAt: "2026-05-01T10:00:00Z" }),
        makeNotification({ recipient: "local_authority", sentAt: "2026-05-01T10:00:00Z" }),
        makeNotification({ recipient: "parent_carer", sentAt: "2026-05-01T10:00:00Z" }),
        makeNotification({ recipient: "placing_authority", sentAt: "2026-05-01T10:00:00Z" }),
      ],
    });
    const result = evaluateEventTimeliness(event, NOW);
    expect(result.ofstedNotifiedOnTime).toBe(false);
    expect(result.ofstedDelayHours).toBeGreaterThan(100);
  });

  it("handles single event with all notification methods", () => {
    const event = makeEvent({
      notifications: [
        makeNotification({ recipient: "ofsted", method: "online_form", sentAt: "2026-05-15T16:00:00Z" }),
        makeNotification({ recipient: "local_authority", method: "email", sentAt: "2026-05-15T16:30:00Z" }),
        makeNotification({ recipient: "parent_carer", method: "phone", sentAt: "2026-05-15T14:45:00Z" }),
        makeNotification({ recipient: "placing_authority", method: "letter", sentAt: "2026-05-15T17:00:00Z" }),
      ],
    });
    const result = evaluateEventTimeliness(event, NOW);
    expect(result.allRecipientsNotified).toBe(true);
  });

  it("score breakdown adds up to total", () => {
    const events = makeOakHouseEvents();
    const result = generateNotificationTimelinessIntelligence(
      events, makePolicy(), [makeAudit()], HOME_ID,
      "2026-05-01", "2026-05-18", NOW,
    );
    const { ofstedTimeliness, stakeholderNotification, qualityCompleteness, policyCompliance, total } = result.score;
    expect(ofstedTimeliness + stakeholderNotification + qualityCompleteness + policyCompliance).toBe(total);
  });

  it("handles schedule_6 with 4-hour window correctly", () => {
    const event = makeEvent({
      category: "schedule_6",
      type: "deprivation_of_liberty",
      discoveredAt: "2026-05-15T10:00:00Z",
      notifications: [
        makeNotification({ recipient: "ofsted", sentAt: "2026-05-15T13:00:00Z" }),
        makeNotification({ recipient: "local_authority", sentAt: "2026-05-15T11:00:00Z" }),
        makeNotification({ recipient: "placing_authority", sentAt: "2026-05-15T12:00:00Z" }),
      ],
    });
    const result = evaluateEventTimeliness(event, NOW);
    // 13:00 is within 10:00 + 4h = 14:00
    expect(result.ofstedNotifiedOnTime).toBe(true);
  });

  it("schedule_6 event barely over 4-hour deadline is late", () => {
    const event = makeEvent({
      category: "schedule_6",
      type: "deprivation_of_liberty",
      discoveredAt: "2026-05-15T10:00:00Z",
      notifications: [
        makeNotification({ recipient: "ofsted", sentAt: "2026-05-15T14:30:00Z" }),
        makeNotification({ recipient: "local_authority", sentAt: "2026-05-15T11:00:00Z" }),
        makeNotification({ recipient: "placing_authority", sentAt: "2026-05-15T12:00:00Z" }),
      ],
    });
    const result = evaluateEventTimeliness(event, NOW);
    // 14:30 is after 10:00 + 4h = 14:00
    expect(result.ofstedNotifiedOnTime).toBe(false);
    expect(result.ofstedDelayHours).toBe(0.5);
  });

  it("multiple events from different children produce per-child results", () => {
    const events = makeOakHouseEvents();
    const result = generateNotificationTimelinessIntelligence(
      events, makePolicy(), [makeAudit()], HOME_ID,
      "2026-05-01", "2026-05-18", NOW,
    );
    const childIds = new Set(events.map(e => e.childId));
    expect(childIds.size).toBe(3); // Alex, Jordan, Morgan
    expect(result.eventResults.length).toBe(5);
  });

  it("no events with full policy still produces a scored result", () => {
    const result = generateNotificationTimelinessIntelligence(
      [], makePolicy({ staffTrainedCount: 10, totalStaffCount: 10 }), [makeAudit()], HOME_ID,
      "2026-05-01", "2026-05-31", NOW,
    );
    expect(result.score.ofstedTimeliness).toBe(30);
    expect(result.score.policyCompliance).toBeGreaterThan(0);
    expect(result.rating).toBe("outstanding");
  });

  it("handles event with Ofsted notification but no sentAt", () => {
    const event = makeEvent({
      discoveredAt: "2026-05-10T10:00:00Z",
      notifications: [
        makeNotification({ recipient: "ofsted", sentAt: undefined, status: "pending" }),
        makeNotification({ recipient: "local_authority", sentAt: "2026-05-10T12:00:00Z" }),
        makeNotification({ recipient: "parent_carer", sentAt: "2026-05-10T11:00:00Z" }),
        makeNotification({ recipient: "placing_authority", sentAt: "2026-05-10T13:00:00Z" }),
      ],
    });
    const result = evaluateEventTimeliness(event, NOW);
    expect(result.ofstedNotifiedOnTime).toBe(false);
    expect(result.ofstedDelayHours).toBeGreaterThan(0);
  });

  it("regulatory links are always a fresh copy", () => {
    const result1 = generateNotificationTimelinessIntelligence([], null, [], HOME_ID, "2026-05-01", "2026-05-31", NOW);
    const result2 = generateNotificationTimelinessIntelligence([], null, [], HOME_ID, "2026-05-01", "2026-05-31", NOW);
    expect(result1.regulatoryLinks).toEqual(result2.regulatoryLinks);
    expect(result1.regulatoryLinks).not.toBe(result2.regulatoryLinks);
  });

  it("handles accommodation_change with only Ofsted as required recipient", () => {
    const event = makeEvent({
      type: "accommodation_change",
      category: "schedule_5",
      notifications: [
        makeNotification({ recipient: "ofsted", sentAt: "2026-05-15T16:00:00Z" }),
      ],
    });
    const result = evaluateEventTimeliness(event, NOW);
    expect(result.requiredRecipients).toEqual(["ofsted"]);
    expect(result.allRecipientsNotified).toBe(true);
    expect(result.missingRecipients).toHaveLength(0);
  });

  it("handles manager_change notification type", () => {
    const event = makeEvent({
      type: "manager_change",
      category: "schedule_5",
      title: "Registered Manager change",
      notifications: [
        makeNotification({ recipient: "ofsted", sentAt: "2026-05-15T16:00:00Z" }),
      ],
    });
    const result = evaluateEventTimeliness(event, NOW);
    expect(result.type).toBe("manager_change");
    expect(result.requiredRecipients).toEqual(["ofsted"]);
    expect(result.ofstedNotifiedOnTime).toBe(true);
  });
});
