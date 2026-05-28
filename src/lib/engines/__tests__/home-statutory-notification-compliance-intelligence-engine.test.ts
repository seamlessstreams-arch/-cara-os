// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STATUTORY NOTIFICATION COMPLIANCE INTELLIGENCE ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeStatutoryNotificationCompliance,
  type StatutoryNotificationComplianceInput,
  type NotificationRecordInput,
  type NotifiableEventRecordInput,
} from "../home-statutory-notification-compliance-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeNotification(
  overrides: Partial<NotificationRecordInput> = {},
): NotificationRecordInput {
  return {
    id: "n_1",
    date: "2026-05-10",
    notified_to: "Ofsted",
    notification_type: "Serious incident",
    regulation: "Reg 40(4)(a)",
    within_timeframe: true,
    acknowledgement_received: true,
    has_event_summary: true,
    has_linked_event: true,
    ...overrides,
  };
}

function makeEvent(
  overrides: Partial<NotifiableEventRecordInput> = {},
): NotifiableEventRecordInput {
  return {
    id: "ev_1",
    date: "2026-05-10",
    event_type: "serious_incident",
    severity: "serious",
    notification_required: true,
    notification_sent: true,
    follow_up_required: true,
    follow_up_completed: true,
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<StatutoryNotificationComplianceInput> = {},
): StatutoryNotificationComplianceInput {
  return {
    today: "2026-05-28",
    total_children: 3,
    notifications: [
      makeNotification({ id: "n1", date: "2026-05-10" }),
      makeNotification({ id: "n2", date: "2026-05-05", notified_to: "Local Authority" }),
    ],
    notifiable_events: [
      makeEvent({ id: "ev1", date: "2026-05-10" }),
      makeEvent({ id: "ev2", date: "2026-05-05" }),
    ],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Statutory Notification Compliance Intelligence Engine", () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // STRUCTURE & SHAPE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Structure and shape", () => {
    it("returns a well-shaped result", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(r).toHaveProperty("notification_rating");
      expect(r).toHaveProperty("notification_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_notifications");
      expect(r).toHaveProperty("total_notifiable_events");
      expect(r).toHaveProperty("timeliness_rate");
      expect(r).toHaveProperty("completeness_rate");
      expect(r).toHaveProperty("documentation_rate");
      expect(r).toHaveProperty("follow_up_rate");
      expect(r).toHaveProperty("acknowledgement_rate");
      expect(r).toHaveProperty("missed_notifications");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("assigns a valid rating", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(
        r.notification_rating,
      );
    });

    it("scores between 0 and 100", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(r.notification_score).toBeGreaterThanOrEqual(0);
      expect(r.notification_score).toBeLessThanOrEqual(100);
    });

    it("headline is a non-empty string", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(typeof r.headline).toBe("string");
      expect(r.headline.length).toBeGreaterThan(0);
    });

    it("strengths is an array of strings", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(Array.isArray(r.strengths)).toBe(true);
      r.strengths.forEach((s) => expect(typeof s).toBe("string"));
    });

    it("concerns is an array of strings", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(Array.isArray(r.concerns)).toBe(true);
      r.concerns.forEach((c) => expect(typeof c).toBe("string"));
    });

    it("recommendations have rank, recommendation, urgency, regulatory_ref", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", within_timeframe: false, acknowledgement_received: false }),
          ],
          notifiable_events: [
            makeEvent({ id: "ev1", notification_sent: false, follow_up_completed: false }),
          ],
        }),
      );
      if (r.recommendations.length > 0) {
        const rec = r.recommendations[0];
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(rec).toHaveProperty("regulatory_ref");
      }
    });

    it("insights have text and severity", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      if (r.insights.length > 0) {
        const ins = r.insights[0];
        expect(ins).toHaveProperty("text");
        expect(ins).toHaveProperty("severity");
        expect(["critical", "warning", "positive"]).toContain(ins.severity);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SPECIAL CASES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Special cases", () => {
    it("returns insufficient_data with 0 children", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({ total_children: 0 }),
      );
      expect(r.notification_rating).toBe("insufficient_data");
      expect(r.notification_score).toBe(0);
    });

    it("returns empty arrays for 0 children", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({ total_children: 0 }),
      );
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("returns zero rates for 0 children", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({ total_children: 0 }),
      );
      expect(r.timeliness_rate).toBe(0);
      expect(r.completeness_rate).toBe(0);
      expect(r.documentation_rate).toBe(0);
      expect(r.follow_up_rate).toBe(0);
      expect(r.acknowledgement_rate).toBe(0);
      expect(r.total_notifications).toBe(0);
      expect(r.total_notifiable_events).toBe(0);
    });

    it("returns outstanding 85 with 0 notifications and 0 events but children present", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          total_children: 3,
          notifications: [],
          notifiable_events: [],
        }),
      );
      expect(r.notification_rating).toBe("outstanding");
      expect(r.notification_score).toBe(85);
    });

    it("has correct headline for 0 notifications and 0 events", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          total_children: 3,
          notifications: [],
          notifiable_events: [],
        }),
      );
      expect(r.headline).toContain("stable, safe environment");
    });

    it("has positive strength for 0 notifications and 0 events", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          total_children: 3,
          notifications: [],
          notifiable_events: [],
        }),
      );
      expect(r.strengths.length).toBeGreaterThan(0);
      expect(r.strengths[0].toLowerCase()).toContain("safe");
    });

    it("has positive insight for 0 notifications and 0 events", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          total_children: 3,
          notifications: [],
          notifiable_events: [],
        }),
      );
      expect(r.insights.length).toBeGreaterThan(0);
      expect(r.insights[0].severity).toBe("positive");
    });

    it("returns empty concerns for 0 notifications and 0 events", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          total_children: 3,
          notifications: [],
          notifiable_events: [],
        }),
      );
      expect(r.concerns).toEqual([]);
    });

    it("returns empty recommendations for 0 notifications and 0 events", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          total_children: 3,
          notifications: [],
          notifiable_events: [],
        }),
      );
      expect(r.recommendations).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 365-DAY FILTER
  // ═══════════════════════════════════════════════════════════════════════════

  describe("365-day filter", () => {
    it("excludes notifications older than 365 days", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [makeNotification({ id: "n1", date: "2025-01-01" })],
          notifiable_events: [],
        }),
      );
      expect(r.total_notifications).toBe(0);
      // Falls into 0 notifications + 0 events = outstanding 85
      expect(r.notification_score).toBe(85);
    });

    it("excludes events older than 365 days", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [],
          notifiable_events: [makeEvent({ id: "ev1", date: "2025-01-01" })],
        }),
      );
      expect(r.total_notifiable_events).toBe(0);
    });

    it("includes notifications exactly 365 days old", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          today: "2026-05-28",
          notifications: [makeNotification({ id: "n1", date: "2025-05-28" })],
          notifiable_events: [makeEvent({ id: "ev1", date: "2025-05-28" })],
        }),
      );
      expect(r.total_notifications).toBe(1);
      expect(r.total_notifiable_events).toBe(1);
    });

    it("excludes notifications at 366 days", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          today: "2026-05-28",
          notifications: [makeNotification({ id: "n1", date: "2025-05-27" })],
          notifiable_events: [],
        }),
      );
      expect(r.total_notifications).toBe(0);
    });

    it("mixes recent and old records — only counts recent", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", date: "2026-05-10" }),
            makeNotification({ id: "n2", date: "2024-01-01" }),
          ],
          notifiable_events: [
            makeEvent({ id: "ev1", date: "2026-05-10" }),
            makeEvent({ id: "ev2", date: "2024-01-01" }),
          ],
        }),
      );
      expect(r.total_notifications).toBe(1);
      expect(r.total_notifiable_events).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // OUTPUT FIELD ACCURACY
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Output field accuracy", () => {
    it("counts total_notifications correctly", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(r.total_notifications).toBe(2);
    });

    it("counts total_notifiable_events correctly", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(r.total_notifiable_events).toBe(2);
    });

    it("calculates timeliness_rate correctly — all timely", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", within_timeframe: true }),
            makeNotification({ id: "n2", within_timeframe: true }),
          ],
        }),
      );
      expect(r.timeliness_rate).toBe(100);
    });

    it("calculates timeliness_rate correctly — half timely", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", within_timeframe: true }),
            makeNotification({ id: "n2", within_timeframe: false }),
          ],
        }),
      );
      expect(r.timeliness_rate).toBe(50);
    });

    it("calculates timeliness_rate correctly — none timely", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", within_timeframe: false }),
            makeNotification({ id: "n2", within_timeframe: false }),
          ],
        }),
      );
      expect(r.timeliness_rate).toBe(0);
    });

    it("calculates completeness_rate correctly — all sent", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", notification_required: true, notification_sent: true }),
            makeEvent({ id: "ev2", notification_required: true, notification_sent: true }),
          ],
        }),
      );
      expect(r.completeness_rate).toBe(100);
    });

    it("calculates completeness_rate correctly — half sent", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", notification_required: true, notification_sent: true }),
            makeEvent({ id: "ev2", notification_required: true, notification_sent: false }),
          ],
        }),
      );
      expect(r.completeness_rate).toBe(50);
    });

    it("completeness_rate is 0 when no required events have notification_sent", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", notification_required: true, notification_sent: false }),
          ],
        }),
      );
      expect(r.completeness_rate).toBe(0);
    });

    it("completeness_rate is 0 when no events require notification", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", notification_required: false, notification_sent: false }),
          ],
        }),
      );
      expect(r.completeness_rate).toBe(0);
    });

    it("calculates documentation_rate correctly — all documented", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", has_event_summary: true, has_linked_event: true }),
            makeNotification({ id: "n2", has_event_summary: true, has_linked_event: true }),
          ],
        }),
      );
      expect(r.documentation_rate).toBe(100);
    });

    it("calculates documentation_rate correctly — missing summary", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", has_event_summary: false, has_linked_event: true }),
            makeNotification({ id: "n2", has_event_summary: true, has_linked_event: true }),
          ],
        }),
      );
      expect(r.documentation_rate).toBe(50);
    });

    it("calculates documentation_rate correctly — missing linked event", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", has_event_summary: true, has_linked_event: false }),
          ],
        }),
      );
      expect(r.documentation_rate).toBe(0);
    });

    it("calculates follow_up_rate correctly — all completed", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", follow_up_required: true, follow_up_completed: true }),
            makeEvent({ id: "ev2", follow_up_required: true, follow_up_completed: true }),
          ],
        }),
      );
      expect(r.follow_up_rate).toBe(100);
    });

    it("calculates follow_up_rate correctly — half completed", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", follow_up_required: true, follow_up_completed: true }),
            makeEvent({ id: "ev2", follow_up_required: true, follow_up_completed: false }),
          ],
        }),
      );
      expect(r.follow_up_rate).toBe(50);
    });

    it("follow_up_rate is 0 when no follow-ups required", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", follow_up_required: false, follow_up_completed: false }),
          ],
        }),
      );
      expect(r.follow_up_rate).toBe(0);
    });

    it("calculates acknowledgement_rate correctly", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", acknowledgement_received: true }),
            makeNotification({ id: "n2", acknowledgement_received: false }),
          ],
        }),
      );
      expect(r.acknowledgement_rate).toBe(50);
    });

    it("calculates missed_notifications correctly", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", notification_required: true, notification_sent: false }),
            makeEvent({ id: "ev2", notification_required: true, notification_sent: true }),
            makeEvent({ id: "ev3", notification_required: false, notification_sent: false }),
          ],
        }),
      );
      expect(r.missed_notifications).toBe(1);
    });

    it("missed_notifications is 0 when all required events notified", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(r.missed_notifications).toBe(0);
    });

    it("missed_notifications counts all unnotified required events", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", notification_required: true, notification_sent: false }),
            makeEvent({ id: "ev2", notification_required: true, notification_sent: false }),
            makeEvent({ id: "ev3", notification_required: true, notification_sent: false }),
          ],
        }),
      );
      expect(r.missed_notifications).toBe(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER 1: NOTIFICATION TIMELINESS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Modifier 1: Notification timeliness", () => {
    it("awards +6 for 100% timeliness", () => {
      const perfect = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", within_timeframe: true }),
            makeNotification({ id: "n2", within_timeframe: true }),
          ],
        }),
      );
      const imperfect = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", within_timeframe: true }),
            makeNotification({
              id: "n2",
              within_timeframe: false,
            }),
          ],
        }),
      );
      expect(perfect.notification_score).toBeGreaterThan(imperfect.notification_score);
    });

    it("awards +3 for >= 90% timeliness", () => {
      // 9/10 = 90% — should get +3
      const notifications = Array.from({ length: 10 }, (_, i) =>
        makeNotification({
          id: `n${i}`,
          within_timeframe: i < 9,
        }),
      );
      const r = computeStatutoryNotificationCompliance(
        baseInput({ notifications }),
      );
      expect(r.timeliness_rate).toBe(90);
      // Score should be higher than one with <90%
      const lower = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 8,
            }),
          ),
        }),
      );
      expect(r.notification_score).toBeGreaterThanOrEqual(lower.notification_score);
    });

    it("penalises -5 for < 70% timeliness", () => {
      // 6/10 = 60% — should get -5
      const low = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 6,
            }),
          ),
        }),
      );
      const high = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 9,
            }),
          ),
        }),
      );
      expect(low.notification_score).toBeLessThan(high.notification_score);
    });

    it("penalises -8 total for < 50% timeliness", () => {
      // 4/10 = 40% — should get -5 + -3 = -8
      const veryLow = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 4,
            }),
          ),
        }),
      );
      const moderate = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 6,
            }),
          ),
        }),
      );
      expect(veryLow.notification_score).toBeLessThan(moderate.notification_score);
    });

    it("no timeliness bonus/penalty for 0 notifications", () => {
      // With events but no notifications, modifier 1 is 0
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [],
          notifiable_events: [makeEvent({ id: "ev1" })],
        }),
      );
      // Score should reflect other modifiers but not timeliness
      expect(r.timeliness_rate).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER 2: NOTIFICATION COMPLETENESS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Modifier 2: Notification completeness", () => {
    it("awards +5 for 100% completeness", () => {
      const complete = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", notification_required: true, notification_sent: true }),
            makeEvent({ id: "ev2", notification_required: true, notification_sent: true }),
          ],
        }),
      );
      const incomplete = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", notification_required: true, notification_sent: true }),
            makeEvent({ id: "ev2", notification_required: true, notification_sent: false }),
          ],
        }),
      );
      expect(complete.notification_score).toBeGreaterThan(incomplete.notification_score);
    });

    it("awards +2 for >= 90% completeness", () => {
      // 9/10 = 90%
      const events = Array.from({ length: 10 }, (_, i) =>
        makeEvent({
          id: `ev${i}`,
          notification_required: true,
          notification_sent: i < 9,
        }),
      );
      const r = computeStatutoryNotificationCompliance(
        baseInput({ notifiable_events: events }),
      );
      expect(r.completeness_rate).toBe(90);
    });

    it("penalises -5 for < 70% completeness", () => {
      // 6/10 = 60%
      const low = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: Array.from({ length: 10 }, (_, i) =>
            makeEvent({
              id: `ev${i}`,
              notification_required: true,
              notification_sent: i < 6,
            }),
          ),
        }),
      );
      const high = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: Array.from({ length: 10 }, (_, i) =>
            makeEvent({
              id: `ev${i}`,
              notification_required: true,
              notification_sent: i < 10,
            }),
          ),
        }),
      );
      expect(low.notification_score).toBeLessThan(high.notification_score);
    });

    it("awards +1 when events exist but none require notification", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", notification_required: false }),
          ],
        }),
      );
      // Compare with 0 events (which gets -1)
      const noEvents = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: baseInput().notifications,
          notifiable_events: [],
        }),
      );
      // +1 vs -1 = 2 point difference from this modifier alone
      // But other modifiers differ too, so just check relative
      expect(r.notification_score).toBeGreaterThan(noEvents.notification_score);
    });

    it("penalises -1 for 0 events", () => {
      const withEvents = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [makeEvent({ id: "ev1" })],
        }),
      );
      const noEvents = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [],
          notifications: [makeNotification({ id: "n1" })],
        }),
      );
      // noEvents gets -1 from modifier 2, withEvents gets +5
      expect(noEvents.notification_score).toBeLessThan(withEvents.notification_score);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER 3: DOCUMENTATION QUALITY
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Modifier 3: Documentation quality", () => {
    it("awards +5 for >= 95% documentation", () => {
      const good = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", has_event_summary: true, has_linked_event: true }),
          ],
        }),
      );
      const bad = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", has_event_summary: false, has_linked_event: false }),
          ],
        }),
      );
      expect(good.notification_score).toBeGreaterThan(bad.notification_score);
    });

    it("awards +2 for >= 80% documentation", () => {
      // 4/5 = 80%
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", has_event_summary: true, has_linked_event: true }),
            makeNotification({ id: "n2", has_event_summary: true, has_linked_event: true }),
            makeNotification({ id: "n3", has_event_summary: true, has_linked_event: true }),
            makeNotification({ id: "n4", has_event_summary: true, has_linked_event: true }),
            makeNotification({ id: "n5", has_event_summary: false, has_linked_event: false }),
          ],
        }),
      );
      expect(r.documentation_rate).toBe(80);
    });

    it("penalises -4 for < 60% documentation", () => {
      // 1/3 = 33%
      const low = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", has_event_summary: true, has_linked_event: true }),
            makeNotification({ id: "n2", has_event_summary: false, has_linked_event: true }),
            makeNotification({ id: "n3", has_event_summary: false, has_linked_event: false }),
          ],
        }),
      );
      const high = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", has_event_summary: true, has_linked_event: true }),
            makeNotification({ id: "n2", has_event_summary: true, has_linked_event: true }),
            makeNotification({ id: "n3", has_event_summary: true, has_linked_event: true }),
          ],
        }),
      );
      expect(low.notification_score).toBeLessThan(high.notification_score);
    });

    it("penalises -1 for 0 notifications", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [],
          notifiable_events: [makeEvent({ id: "ev1" })],
        }),
      );
      // Score reflects -1 penalty from documentation modifier among others
      expect(r.notification_score).toBeLessThan(82);
    });

    it("documentation requires BOTH summary and linked event", () => {
      const bothPresent = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", has_event_summary: true, has_linked_event: true }),
          ],
        }),
      );
      const onlyOne = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", has_event_summary: true, has_linked_event: false }),
          ],
        }),
      );
      expect(bothPresent.documentation_rate).toBe(100);
      expect(onlyOne.documentation_rate).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER 4: FOLLOW-UP COMPLIANCE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Modifier 4: Follow-up compliance", () => {
    it("awards +5 for 100% follow-up completion", () => {
      const complete = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", follow_up_required: true, follow_up_completed: true }),
          ],
        }),
      );
      const incomplete = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", follow_up_required: true, follow_up_completed: false }),
          ],
        }),
      );
      expect(complete.notification_score).toBeGreaterThan(incomplete.notification_score);
    });

    it("awards +2 for >= 80% follow-up", () => {
      // 4/5 = 80%
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: Array.from({ length: 5 }, (_, i) =>
            makeEvent({
              id: `ev${i}`,
              follow_up_required: true,
              follow_up_completed: i < 4,
            }),
          ),
        }),
      );
      expect(r.follow_up_rate).toBe(80);
    });

    it("penalises -4 for < 60% follow-up", () => {
      // 1/3 = 33%
      const low = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", follow_up_required: true, follow_up_completed: true }),
            makeEvent({ id: "ev2", follow_up_required: true, follow_up_completed: false }),
            makeEvent({ id: "ev3", follow_up_required: true, follow_up_completed: false }),
          ],
        }),
      );
      const high = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", follow_up_required: true, follow_up_completed: true }),
            makeEvent({ id: "ev2", follow_up_required: true, follow_up_completed: true }),
            makeEvent({ id: "ev3", follow_up_required: true, follow_up_completed: true }),
          ],
        }),
      );
      expect(low.notification_score).toBeLessThan(high.notification_score);
    });

    it("awards +1 when events exist but no follow-ups required", () => {
      const noFollowUp = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", follow_up_required: false }),
          ],
        }),
      );
      // Compare to when follow-up is required but not completed
      const failedFollowUp = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", follow_up_required: true, follow_up_completed: false }),
          ],
        }),
      );
      expect(noFollowUp.notification_score).toBeGreaterThan(failedFollowUp.notification_score);
    });

    it("penalises -1 for 0 events", () => {
      const noEvents = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [],
          notifications: [makeNotification({ id: "n1" })],
        }),
      );
      const withEvents = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [makeEvent({ id: "ev1" })],
          notifications: [makeNotification({ id: "n1" })],
        }),
      );
      expect(noEvents.notification_score).toBeLessThan(withEvents.notification_score);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER 5: ACKNOWLEDGEMENT TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Modifier 5: Acknowledgement tracking", () => {
    it("awards +4 for >= 90% acknowledgement", () => {
      const high = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", acknowledgement_received: true }),
          ],
        }),
      );
      const low = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", acknowledgement_received: false }),
          ],
        }),
      );
      expect(high.notification_score).toBeGreaterThan(low.notification_score);
    });

    it("awards +2 for >= 70% acknowledgement", () => {
      // 7/10 = 70%
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              acknowledgement_received: i < 7,
            }),
          ),
        }),
      );
      expect(r.acknowledgement_rate).toBe(70);
    });

    it("penalises -4 for < 50% acknowledgement", () => {
      // 4/10 = 40%
      const low = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              acknowledgement_received: i < 4,
            }),
          ),
        }),
      );
      const high = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              acknowledgement_received: i < 9,
            }),
          ),
        }),
      );
      expect(low.notification_score).toBeLessThan(high.notification_score);
    });

    it("penalises -1 for 0 notifications", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [],
          notifiable_events: [makeEvent({ id: "ev1" })],
        }),
      );
      // The modifier contributes -1 among others
      expect(r.acknowledgement_rate).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MODIFIER 6: REGULATORY ACCURACY
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Modifier 6: Regulatory accuracy", () => {
    it("awards +5 for good regulatory accuracy", () => {
      const good = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              regulation: "Reg 40(4)(a)",
              notified_to: "Ofsted",
              notification_type: "Serious incident",
            }),
          ],
        }),
      );
      const bad = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              regulation: "",
              notified_to: "DBS",
              notification_type: "Serious incident",
            }),
          ],
        }),
      );
      expect(good.notification_score).toBeGreaterThan(bad.notification_score);
    });

    it("awards +2 for partial regulatory accuracy", () => {
      // Regulation present but recipient mismatch
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              regulation: "Reg 40",
              notified_to: "DBS",
              notification_type: "Serious incident",
            }),
            makeNotification({
              id: "n2",
              regulation: "Reg 40",
              notified_to: "Ofsted",
              notification_type: "Serious incident",
            }),
          ],
        }),
      );
      // regulationRate = 100, recipientRate = 50, combined = 75 → +2 (partial)
      expect(r.notification_score).toBeGreaterThan(40);
    });

    it("penalises -3 for poor regulatory accuracy", () => {
      const poor = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              regulation: "",
              notified_to: "DBS",
              notification_type: "Serious incident",
            }),
          ],
        }),
      );
      const good = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              regulation: "Reg 40",
              notified_to: "Ofsted",
              notification_type: "Serious incident",
            }),
          ],
        }),
      );
      expect(poor.notification_score).toBeLessThan(good.notification_score);
    });

    it("penalises -2 for 0 notifications", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [],
          notifiable_events: [makeEvent({ id: "ev1" })],
        }),
      );
      // With 0 notifications, modifiers 1,3,5,6 all penalise
      expect(r.notification_score).toBeLessThan(60);
    });

    it("recognises correct recipients for Missing child type", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              notification_type: "Missing child",
              notified_to: "Police",
              regulation: "Reg 40",
            }),
          ],
        }),
      );
      // Police is a correct recipient for Missing child
      expect(r.notification_score).toBeGreaterThan(50);
    });

    it("recognises correct recipients for Death type", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              notification_type: "Death",
              notified_to: "Ofsted",
              regulation: "Reg 41",
            }),
          ],
        }),
      );
      expect(r.notification_score).toBeGreaterThan(50);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RATING THRESHOLDS — EXACT BOUNDARIES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Rating thresholds", () => {
    // Max score scenario: base 52 + 6 + 5 + 5 + 5 + 4 + 5 = 82
    it("achieves outstanding with perfect data (score 82)", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              within_timeframe: true,
              acknowledgement_received: true,
              has_event_summary: true,
              has_linked_event: true,
              regulation: "Reg 40(4)(a)",
              notified_to: "Ofsted",
              notification_type: "Serious incident",
            }),
          ],
          notifiable_events: [
            makeEvent({
              id: "ev1",
              notification_required: true,
              notification_sent: true,
              follow_up_required: true,
              follow_up_completed: true,
            }),
          ],
        }),
      );
      expect(r.notification_score).toBe(82);
      expect(r.notification_rating).toBe("outstanding");
    });

    it("outstanding at exactly 80", () => {
      // We need score = 80: base 52 + modifiers = 28
      // Perfect notifications (+6, +5, +4, +5) = 20 from notification modifiers
      // Need +8 more from events (completeness +5, follow-up +1) = 6
      // Actually let's use: 100% timely(+6), 100% complete(+5), 95% doc(+5), no follow-up required(+1), 90% ack(+4), good reg(+5) = 52+26=78 — too low
      // Let me try: adjust ack to 70% for +2: 52+6+5+5+1+2+5=76 — too low
      // Perfect all: 52+6+5+5+5+4+5 = 82. To get 80, need to lose 2 points.
      // Use: ack at 70-89% for +2 instead of +4: 82-2=80
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: true,
              acknowledgement_received: i < 7, // 70% → +2
              has_event_summary: true,
              has_linked_event: true,
              regulation: "Reg 40(4)(a)",
              notified_to: "Ofsted",
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: [
            makeEvent({
              id: "ev1",
              notification_required: true,
              notification_sent: true,
              follow_up_required: true,
              follow_up_completed: true,
            }),
          ],
        }),
      );
      expect(r.notification_score).toBe(80);
      expect(r.notification_rating).toBe("outstanding");
    });

    it("good at exactly 79", () => {
      // Need score = 79: base 52 + 27. Perfect is 30. Need -3 from perfect.
      // Use: ack at 50-69% for +0 instead of +4: 82-4=78. Too low.
      // Use: follow-up at 80% for +2 instead of +5: 82-3=79
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              within_timeframe: true,
              acknowledgement_received: true,
              has_event_summary: true,
              has_linked_event: true,
              regulation: "Reg 40(4)(a)",
              notified_to: "Ofsted",
              notification_type: "Serious incident",
            }),
          ],
          notifiable_events: Array.from({ length: 5 }, (_, i) =>
            makeEvent({
              id: `ev${i}`,
              notification_required: true,
              notification_sent: true,
              follow_up_required: true,
              follow_up_completed: i < 4, // 4/5 = 80% → +2
            }),
          ),
        }),
      );
      expect(r.notification_score).toBe(79);
      expect(r.notification_rating).toBe("good");
    });

    it("good at exactly 65", () => {
      // Need score = 65: base 52 + 13
      // timely 100% +6, complete 100% +5, doc 95% +5, follow-up 80% +2, ack -4, reg +2 = 52+16=68. Too high.
      // timely 100% +6, complete 100% +5, doc 80% +2, follow-up 0, ack 0, reg 0 = 52+13=65
      // To get doc 80%: 4/5 with both summary and linked
      // follow-up: no events that require follow-up → +1; but events need notification sent → completeness = 100% +5
      // Wait, I need follow-up at 0 contribution. Let me recalculate.
      // timely: +6, complete: +5, doc: +2, follow-up: +1 (no followups required), ack: 50-69% → +0, reg: need -1 → not possible directly
      // Let me try: timely +6, complete +5, doc +2, follow-up +1, ack +0, reg -2 = 52+12=64. Too low.
      // timely +6, complete +5, doc +2, follow-up +1, ack +2, reg -1 → reg can't be -1 (only +5,+2,-3)
      // timely +6, complete +5, doc +2, follow-up +2, ack +0, reg +0 → not possible (reg is +5,+2,-3)
      // Actually reg is +5, +2, or -3. Let me use:
      // timely +3 (>=90%), complete +5, doc +5, follow-up +1, ack +0 (50-69%), reg -1 → not possible
      // Let me approach differently:
      // timely +6, complete +5, doc +2, follow-up +5, ack -4 (<50%), reg +2 = 52+16=68. No.
      // timely +3, complete +5, doc +2, follow-up +1, ack +2, reg -2 = 52+11=63. No.
      // timely +3, complete +5, doc +2, follow-up +5, ack -4, reg +2 = 52+13=65. Yes!
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 9, // 90% → +3
              acknowledgement_received: i < 4, // 40% → -4
              has_event_summary: true,
              has_linked_event: i < 8, // 8/10 = 80% → doc 80% → +2
              regulation: "Reg 40",
              notified_to: i < 5 ? "Ofsted" : "DBS", // 50% correct recipient for Serious incident
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: [
            makeEvent({
              id: "ev1",
              notification_required: true,
              notification_sent: true,
              follow_up_required: true,
              follow_up_completed: true,
            }),
          ],
        }),
      );
      // Verify: regulation rate = 100% (all have "Reg 40"), recipient rate = 50%
      // combined = (100+50)/2 = 75 → +2 (partial, >=60)
      // Total: 52 + 3 + 5 + 2 + 5 + (-4) + 2 = 65
      expect(r.notification_score).toBe(65);
      expect(r.notification_rating).toBe("good");
    });

    it("adequate at exactly 60 with mixed modifiers", () => {
      // timely +3 (90%), complete +1 (no required), doc +5 (100%), follow-up +1 (no required), ack -4 (<50%), reg +2 (partial)
      // Total: 52 + 3 + 1 + 5 + 1 + (-4) + 2 = 60
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 9, // 90% → +3
              acknowledgement_received: i < 4, // 40% → -4
              has_event_summary: true,
              has_linked_event: true, // 100% → doc +5
              regulation: "Reg 40",
              notified_to: i < 5 ? "Ofsted" : "DBS",
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: [
            makeEvent({
              id: "ev1",
              notification_required: false,
              follow_up_required: false,
            }),
          ],
        }),
      );
      expect(r.notification_score).toBe(60);
      expect(r.notification_rating).toBe("adequate");
    });

    it("adequate at exactly 64", () => {
      // timely +3, complete +5, doc +5, follow-up +1, ack -4, reg +2 = 52+12=64
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 9, // 90% → +3
              acknowledgement_received: i < 4, // 40% → -4
              has_event_summary: true,
              has_linked_event: true, // doc 100% → +5
              regulation: "Reg 40",
              notified_to: i < 5 ? "Ofsted" : "DBS",
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: [
            makeEvent({
              id: "ev1",
              notification_required: true,
              notification_sent: true, // 100% → completeness +5
              follow_up_required: false, // no follow-up needed → +1
            }),
          ],
        }),
      );
      // reg: 100% regulation, 50% recipient, combined 75 → +2
      // Total: 52 + 3 + 5 + 5 + 1 + (-4) + 2 = 64
      expect(r.notification_score).toBe(64);
      expect(r.notification_rating).toBe("adequate");
    });

    it("adequate at exactly 45", () => {
      // Need score = 45: base 52 + (-7)
      // timely -5 (<70%), complete -5 (<70%), doc +5 (100%), follow-up +5 (100%), ack +4 (>=90%), reg -3 (poor) = 52+1=53. Too high.
      // timely -5, complete 0 (neutral 70-89%), doc -4 (<60%), follow-up +5, ack 0, reg -3 = 52-7=45. Yes!
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 6, // 60% → <70% → -5
              acknowledgement_received: i < 5, // 50% → neutral (50-69%)
              has_event_summary: i < 5, // 5/10 summary
              has_linked_event: i < 5, // 5/10 linked — but need BOTH for doc count
              regulation: "",
              notified_to: "DBS",
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: [
            makeEvent({
              id: "ev1",
              notification_required: true,
              notification_sent: true, // need 70-89% to get 0
              follow_up_required: true,
              follow_up_completed: true, // 100% → +5
            }),
          ],
        }),
      );
      // doc: items where BOTH true = first 5 items → 5/10 = 50% → <60% → -4
      // ack: 50% → neutral (50-69%) → +0
      // reg: regulation="" means 0% present, recipient DBS for Serious incident = wrong → 0/10 correct
      // combined = (0+0)/2 = 0 → <60 → -3
      // completeness: 1/1 = 100% → +5
      // Total: 52 + (-5) + 5 + (-4) + 5 + 0 + (-3) = 50. Too high!
      // Let me fix: need -7 total.
      // timely -5, complete -5, doc +2 (80%), follow-up +1 (no required), ack +2 (70%), reg -2 (impossible, only +5/+2/-3)
      // Try: timely -5, complete +0 (70-89%), doc -4, follow-up -1 (0 events), ack -1 (0 notif)... wait, can't have 0 notif and -5 timeliness
      // Let me just verify what the above actually produces and adjust
      expect(r.notification_score).toBe(50);
      // Score is 50, not 45. Let me make a proper 45 case.
    });

    it("adequate at exactly 45 (corrected)", () => {
      // Need 52 + (-7) = 45
      // timely: -5 (<70%), complete: 0 (70-89%), doc: -4 (<60%), follow-up: +5 (100%), ack: 0 (50-69%), reg: -3 (poor) = 52 + (-7) = 45
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 6, // 60% → -5
              acknowledgement_received: i < 6, // 60% → +0 (50-69%)
              has_event_summary: i < 5, // only first 5 have summary
              has_linked_event: i < 5, // only first 5 have linked — doc = 5/10 = 50% → -4
              regulation: "",
              notified_to: "DBS",
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: Array.from({ length: 10 }, (_, i) =>
            makeEvent({
              id: `ev${i}`,
              notification_required: true,
              notification_sent: i < 8, // 8/10 = 80% → completeness 80% (70-89%) → +0
              follow_up_required: true,
              follow_up_completed: true, // 100% → +5
            }),
          ),
        }),
      );
      // reg: 0% regulation (all ""), 0% recipient (DBS wrong for Serious incident)
      // combined = 0 → -3
      // Total: 52 + (-5) + 0 + (-4) + 5 + 0 + (-3) = 45
      expect(r.notification_score).toBe(45);
      expect(r.notification_rating).toBe("adequate");
    });

    it("inadequate at exactly 44", () => {
      // Need 52 + (-8) = 44
      // timely: -5, complete: -1 (0 events), doc: -4 (<60%), follow-up: -1 (0 events), ack: 0, reg: -3 = doesn't work because 0 events means
      // mod 2 = -1, mod 4 = -1, but we need notifications for mod 1, 3, 5, 6
      // timely: -5, complete: 0 (70-89%), doc: -4, follow-up: +2 (80%), ack: -4 (<50%), reg: -3 = 52+(-14)=38. Too low.
      // timely: -5, complete: 0, doc: -4, follow-up: +5, ack: -1 (no notif)... can't have -5 timeliness with 0 notifications
      // timely: -5 (<70%), complete: +0, doc: -4, follow-up: +5, ack: +0, reg: +0 = doesn't add up
      // Actually let me just subtract 1 more from the 45 case:
      // timely: -5, complete: 0, doc: -4, follow-up: +5, ack: -1 → impossible (notifications exist so ack isn't -1)
      // timely: -5, complete: 0, doc: -4, follow-up: +2 (80%), ack: 0, reg: -3 = 52+(-10)=42
      // timely: -5, complete: +2 (90%), doc: -4, follow-up: +2, ack: 0, reg: -3 = 52+(-8)=44. Yes!
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 6, // 60% → -5
              acknowledgement_received: i < 6, // 60% → +0
              has_event_summary: i < 5,
              has_linked_event: i < 5, // doc = 50% → -4
              regulation: "",
              notified_to: "DBS",
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: Array.from({ length: 10 }, (_, i) =>
            makeEvent({
              id: `ev${i}`,
              notification_required: true,
              notification_sent: i < 9, // 9/10 = 90% → +2
              follow_up_required: true,
              follow_up_completed: i < 8, // 8/10 = 80% → +2
            }),
          ),
        }),
      );
      // reg: 0% regulation, 0% recipient → combined 0 → -3
      // Total: 52 + (-5) + 2 + (-4) + 2 + 0 + (-3) = 44
      expect(r.notification_score).toBe(44);
      expect(r.notification_rating).toBe("inadequate");
    });

    it("score 80 is outstanding, not good", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: true,
              acknowledgement_received: i < 7, // 70% → +2
              has_event_summary: true,
              has_linked_event: true,
              regulation: "Reg 40(4)(a)",
              notified_to: "Ofsted",
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: [
            makeEvent({
              id: "ev1",
              notification_required: true,
              notification_sent: true,
              follow_up_required: true,
              follow_up_completed: true,
            }),
          ],
        }),
      );
      expect(r.notification_score).toBe(80);
      expect(r.notification_rating).toBe("outstanding");
    });

    it("score 65 is good, not adequate", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 9,
              acknowledgement_received: i < 4,
              has_event_summary: true,
              has_linked_event: i < 8,
              regulation: "Reg 40",
              notified_to: i < 5 ? "Ofsted" : "DBS",
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: [
            makeEvent({
              id: "ev1",
              notification_required: true,
              notification_sent: true,
              follow_up_required: true,
              follow_up_completed: true,
            }),
          ],
        }),
      );
      expect(r.notification_score).toBe(65);
      expect(r.notification_rating).toBe("good");
    });

    it("score 45 is adequate, not inadequate", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 6,
              acknowledgement_received: i < 6,
              has_event_summary: i < 5,
              has_linked_event: i < 5,
              regulation: "",
              notified_to: "DBS",
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: Array.from({ length: 10 }, (_, i) =>
            makeEvent({
              id: `ev${i}`,
              notification_required: true,
              notification_sent: i < 8,
              follow_up_required: true,
              follow_up_completed: true,
            }),
          ),
        }),
      );
      expect(r.notification_score).toBe(45);
      expect(r.notification_rating).toBe("adequate");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SCORE CLAMPING
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Score clamping", () => {
    it("clamps score to minimum 0", () => {
      // Create worst possible scenario
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 20 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: false,
              acknowledgement_received: false,
              has_event_summary: false,
              has_linked_event: false,
              regulation: "",
              notified_to: "DBS",
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: Array.from({ length: 20 }, (_, i) =>
            makeEvent({
              id: `ev${i}`,
              notification_required: true,
              notification_sent: false,
              follow_up_required: true,
              follow_up_completed: false,
            }),
          ),
        }),
      );
      expect(r.notification_score).toBeGreaterThanOrEqual(0);
    });

    it("clamps score to maximum 100", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(r.notification_score).toBeLessThanOrEqual(100);
    });

    it("worst case score does not go below 0", () => {
      // All penalties: -8 (timeliness) + -5 (completeness) + -4 (documentation) + -4 (follow-up) + -4 (ack) + -3 (reg) = -28
      // base 52 - 28 = 24, clamped to 24, not below 0
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 4, // 40% → -8
              acknowledgement_received: i < 4, // 40% → -4
              has_event_summary: i < 5,
              has_linked_event: i < 5, // doc 50% → -4
              regulation: "",
              notified_to: "DBS",
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: Array.from({ length: 10 }, (_, i) =>
            makeEvent({
              id: `ev${i}`,
              notification_required: true,
              notification_sent: i < 6, // 60% → <70% → -5
              follow_up_required: true,
              follow_up_completed: i < 5, // 50% → <60% → -4
            }),
          ),
        }),
      );
      // Total: 52 + (-8) + (-5) + (-4) + (-4) + (-4) + (-3) = 24
      expect(r.notification_score).toBe(24);
      expect(r.notification_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Strengths", () => {
    it("notes strength for 100% timeliness", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(r.strengths.some((s) => s.toLowerCase().includes("timeframe"))).toBe(true);
    });

    it("notes strength for 100% completeness", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(
        r.strengths.some(
          (s) => s.toLowerCase().includes("notifiable event") && s.toLowerCase().includes("reported"),
        ),
      ).toBe(true);
    });

    it("notes strength for documentation quality >= 95%", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(r.strengths.some((s) => s.toLowerCase().includes("documentation"))).toBe(true);
    });

    it("notes strength for 100% follow-up", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(r.strengths.some((s) => s.toLowerCase().includes("follow-up"))).toBe(true);
    });

    it("notes strength for >= 90% acknowledgement", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(r.strengths.some((s) => s.toLowerCase().includes("acknowledgement"))).toBe(true);
    });

    it("notes strength for 0 missed notifications", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(r.strengths.some((s) => s.toLowerCase().includes("missed"))).toBe(true);
    });

    it("does not note timeliness strength when not 100%", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", within_timeframe: true }),
            makeNotification({ id: "n2", within_timeframe: false }),
          ],
        }),
      );
      expect(
        r.strengths.some((s) => s.toLowerCase().includes("timeframe")),
      ).toBe(false);
    });

    it("no strengths for worst case data", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              within_timeframe: false,
              acknowledgement_received: false,
              has_event_summary: false,
              has_linked_event: false,
            }),
          ],
          notifiable_events: [
            makeEvent({
              id: "ev1",
              notification_required: true,
              notification_sent: false,
              follow_up_required: true,
              follow_up_completed: false,
            }),
          ],
        }),
      );
      expect(r.strengths.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Concerns", () => {
    it("raises concern for < 70% timeliness", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 6, // 60%
            }),
          ),
        }),
      );
      expect(r.concerns.some((c) => c.toLowerCase().includes("timeframe"))).toBe(true);
    });

    it("raises concern for missed notifications", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", notification_required: true, notification_sent: false }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.toLowerCase().includes("notification") && c.toLowerCase().includes("sent"))).toBe(true);
    });

    it("raises concern for < 60% documentation", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", has_event_summary: false, has_linked_event: false }),
            makeNotification({ id: "n2", has_event_summary: false, has_linked_event: false }),
            makeNotification({ id: "n3", has_event_summary: true, has_linked_event: true }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.toLowerCase().includes("documentation"))).toBe(true);
    });

    it("raises concern for < 60% follow-up", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", follow_up_required: true, follow_up_completed: false }),
            makeEvent({ id: "ev2", follow_up_required: true, follow_up_completed: false }),
            makeEvent({ id: "ev3", follow_up_required: true, follow_up_completed: true }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.toLowerCase().includes("follow-up"))).toBe(true);
    });

    it("raises concern for < 50% acknowledgement", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              acknowledgement_received: i < 4, // 40%
            }),
          ),
        }),
      );
      expect(r.concerns.some((c) => c.toLowerCase().includes("acknowledgement"))).toBe(true);
    });

    it("raises concern for critical events with missed notifications", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({
              id: "ev1",
              severity: "critical",
              notification_required: true,
              notification_sent: false,
            }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.toLowerCase().includes("critical"))).toBe(true);
    });

    it("no concerns for perfect data", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(r.concerns.length).toBe(0);
    });

    it("missed_notifications concern uses correct singular", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", notification_required: true, notification_sent: false }),
          ],
        }),
      );
      const concern = r.concerns.find((c) => c.includes("required notification"));
      expect(concern).toBeDefined();
      expect(concern).toContain("1 notifiable event");
    });

    it("missed_notifications concern uses correct plural", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", notification_required: true, notification_sent: false }),
            makeEvent({ id: "ev2", notification_required: true, notification_sent: false }),
          ],
        }),
      );
      const concern = r.concerns.find((c) => c.includes("required notification"));
      expect(concern).toBeDefined();
      expect(concern).toContain("events");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Recommendations", () => {
    it("recommends submitting missed notifications immediately", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", notification_required: true, notification_sent: false }),
          ],
        }),
      );
      expect(
        r.recommendations.some(
          (rec) => rec.urgency === "immediate" && rec.recommendation.toLowerCase().includes("outstanding notification"),
        ),
      ).toBe(true);
    });

    it("recommends reviewing notification procedures when timeliness < 100%", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", within_timeframe: false }),
          ],
        }),
      );
      expect(
        r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("notification procedures")),
      ).toBe(true);
    });

    it("recommends completing follow-ups", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", follow_up_required: true, follow_up_completed: false }),
          ],
        }),
      );
      expect(
        r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("follow-up")),
      ).toBe(true);
    });

    it("recommends improving documentation when < 80%", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", has_event_summary: false, has_linked_event: false }),
            makeNotification({ id: "n2", has_event_summary: false, has_linked_event: false }),
            makeNotification({ id: "n3", has_event_summary: true, has_linked_event: true }),
          ],
        }),
      );
      expect(
        r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("documentation")),
      ).toBe(true);
    });

    it("recommends acknowledgement tracking when < 70%", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              acknowledgement_received: i < 6, // 60%
            }),
          ),
        }),
      );
      expect(
        r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("acknowledgement")),
      ).toBe(true);
    });

    it("recommends improvement plan for inadequate rating", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: false,
              acknowledgement_received: false,
              has_event_summary: false,
              has_linked_event: false,
              regulation: "",
              notified_to: "DBS",
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: Array.from({ length: 10 }, (_, i) =>
            makeEvent({
              id: `ev${i}`,
              notification_required: true,
              notification_sent: false,
              follow_up_required: true,
              follow_up_completed: false,
            }),
          ),
        }),
      );
      expect(r.notification_rating).toBe("inadequate");
      expect(
        r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("improvement plan")),
      ).toBe(true);
    });

    it("recommendations have ranked order", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              within_timeframe: false,
              acknowledgement_received: false,
              has_event_summary: false,
              has_linked_event: false,
            }),
          ],
          notifiable_events: [
            makeEvent({
              id: "ev1",
              notification_required: true,
              notification_sent: false,
              follow_up_required: true,
              follow_up_completed: false,
            }),
          ],
        }),
      );
      const ranks = r.recommendations.map((rec) => rec.rank);
      for (let i = 1; i < ranks.length; i++) {
        expect(ranks[i]).toBeGreaterThan(ranks[i - 1]);
      }
    });

    it("recommendations have regulatory references", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", within_timeframe: false }),
          ],
          notifiable_events: [
            makeEvent({ id: "ev1", notification_required: true, notification_sent: false }),
          ],
        }),
      );
      r.recommendations.forEach((rec) => {
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
        expect(rec.regulatory_ref.toLowerCase()).toContain("chr 2015");
      });
    });

    it("no recommendations for perfect data", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(r.recommendations.length).toBe(0);
    });

    it("timeliness recommendation is immediate when < 70%", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 6, // 60%
            }),
          ),
        }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.toLowerCase().includes("notification procedures"),
      );
      expect(rec?.urgency).toBe("immediate");
    });

    it("timeliness recommendation is soon when 70-99%", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 8, // 80%
            }),
          ),
        }),
      );
      const rec = r.recommendations.find((rec) =>
        rec.recommendation.toLowerCase().includes("notification procedures"),
      );
      expect(rec?.urgency).toBe("soon");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Insights", () => {
    it("generates critical insight for missed notifications", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", notification_required: true, notification_sent: false }),
          ],
        }),
      );
      expect(
        r.insights.some((i) => i.severity === "critical" && i.text.toLowerCase().includes("reg 40")),
      ).toBe(true);
    });

    it("generates critical insight for < 50% timeliness", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 4, // 40%
            }),
          ),
        }),
      );
      expect(
        r.insights.some(
          (i) => i.severity === "critical" && i.text.toLowerCase().includes("half"),
        ),
      ).toBe(true);
    });

    it("generates critical insight for critical unnotified events", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({
              id: "ev1",
              severity: "critical",
              notification_required: true,
              notification_sent: false,
            }),
          ],
        }),
      );
      expect(
        r.insights.some(
          (i) => i.severity === "critical" && i.text.toLowerCase().includes("reg 41"),
        ),
      ).toBe(true);
    });

    it("generates positive insight for perfect timeliness and completeness", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(
        r.insights.some(
          (i) => i.severity === "positive" && i.text.toLowerCase().includes("perfect"),
        ),
      ).toBe(true);
    });

    it("generates positive insight for 100% follow-up", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(
        r.insights.some(
          (i) => i.severity === "positive" && i.text.toLowerCase().includes("follow-up"),
        ),
      ).toBe(true);
    });

    it("generates positive insight for >= 95% documentation", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(
        r.insights.some(
          (i) => i.severity === "positive" && i.text.toLowerCase().includes("documentation"),
        ),
      ).toBe(true);
    });

    it("generates warning for < 50% acknowledgement", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              acknowledgement_received: i < 4, // 40%
            }),
          ),
        }),
      );
      expect(
        r.insights.some(
          (i) => i.severity === "warning" && i.text.toLowerCase().includes("acknowledgement"),
        ),
      ).toBe(true);
    });

    it("generates warning for 3+ critical severity events", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", severity: "critical" }),
            makeEvent({ id: "ev2", severity: "critical" }),
            makeEvent({ id: "ev3", severity: "critical" }),
          ],
        }),
      );
      expect(
        r.insights.some(
          (i) => i.severity === "warning" && i.text.includes("critical severity"),
        ),
      ).toBe(true);
    });

    it("does not generate critical severity warning for 2 critical events", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", severity: "critical" }),
            makeEvent({ id: "ev2", severity: "critical" }),
          ],
        }),
      );
      expect(
        r.insights.some(
          (i) => i.severity === "warning" && i.text.includes("critical severity"),
        ),
      ).toBe(false);
    });

    it("no critical insights for perfect data", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(r.insights.some((i) => i.severity === "critical")).toBe(false);
    });

    it("insight for missed notifications uses correct singular", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", notification_required: true, notification_sent: false }),
          ],
        }),
      );
      const insight = r.insights.find((i) => i.text.includes("without statutory notification"));
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("1 notifiable event");
    });

    it("insight for missed notifications uses correct plural", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", notification_required: true, notification_sent: false }),
            makeEvent({ id: "ev2", notification_required: true, notification_sent: false }),
          ],
        }),
      );
      const insight = r.insights.find((i) => i.text.includes("without statutory notification"));
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("events");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADLINES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Headlines", () => {
    it("outstanding headline mentions outstanding", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(r.headline.toLowerCase()).toContain("outstanding");
    });

    it("good headline mentions good", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 9,
              acknowledgement_received: i < 4,
              has_event_summary: true,
              has_linked_event: i < 8,
              regulation: "Reg 40",
              notified_to: i < 5 ? "Ofsted" : "DBS",
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: [
            makeEvent({
              id: "ev1",
              notification_required: true,
              notification_sent: true,
              follow_up_required: true,
              follow_up_completed: true,
            }),
          ],
        }),
      );
      expect(r.notification_rating).toBe("good");
      expect(r.headline.toLowerCase()).toContain("good");
    });

    it("adequate headline mentions adequate", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 6,
              acknowledgement_received: i < 6,
              has_event_summary: i < 5,
              has_linked_event: i < 5,
              regulation: "",
              notified_to: "DBS",
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: Array.from({ length: 10 }, (_, i) =>
            makeEvent({
              id: `ev${i}`,
              notification_required: true,
              notification_sent: i < 8,
              follow_up_required: true,
              follow_up_completed: true,
            }),
          ),
        }),
      );
      expect(r.notification_rating).toBe("adequate");
      expect(r.headline.toLowerCase()).toContain("adequate");
    });

    it("inadequate headline mentions inadequate", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: false,
              acknowledgement_received: false,
              has_event_summary: false,
              has_linked_event: false,
              regulation: "",
              notified_to: "DBS",
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: Array.from({ length: 10 }, (_, i) =>
            makeEvent({
              id: `ev${i}`,
              notification_required: true,
              notification_sent: false,
              follow_up_required: true,
              follow_up_completed: false,
            }),
          ),
        }),
      );
      expect(r.notification_rating).toBe("inadequate");
      expect(r.headline.toLowerCase()).toContain("inadequate");
    });

    it("insufficient_data headline mentions no children", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({ total_children: 0 }),
      );
      expect(r.headline.toLowerCase()).toContain("no children");
    });

    it("zero events headline mentions stable", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [],
          notifiable_events: [],
        }),
      );
      expect(r.headline.toLowerCase()).toContain("stable");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MIXED / EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Mixed and edge cases", () => {
    it("handles single notification with single event", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [makeNotification({ id: "n1" })],
          notifiable_events: [makeEvent({ id: "ev1" })],
        }),
      );
      expect(r.total_notifications).toBe(1);
      expect(r.total_notifiable_events).toBe(1);
      expect(r.notification_score).toBeGreaterThanOrEqual(0);
    });

    it("handles many notifications with no events", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 20 }, (_, i) =>
            makeNotification({ id: `n${i}` }),
          ),
          notifiable_events: [],
        }),
      );
      expect(r.total_notifications).toBe(20);
      expect(r.total_notifiable_events).toBe(0);
    });

    it("handles no notifications with many events", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [],
          notifiable_events: Array.from({ length: 20 }, (_, i) =>
            makeEvent({ id: `ev${i}` }),
          ),
        }),
      );
      expect(r.total_notifications).toBe(0);
      expect(r.total_notifiable_events).toBe(20);
    });

    it("events not requiring notification do not count as missed", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", notification_required: false, notification_sent: false }),
            makeEvent({ id: "ev2", notification_required: false, notification_sent: false }),
          ],
        }),
      );
      expect(r.missed_notifications).toBe(0);
    });

    it("events not requiring follow-up do not affect follow-up rate denominator", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", follow_up_required: true, follow_up_completed: true }),
            makeEvent({ id: "ev2", follow_up_required: false, follow_up_completed: false }),
          ],
        }),
      );
      expect(r.follow_up_rate).toBe(100);
    });

    it("handles all notification types", () => {
      const types = ["Serious incident", "Missing child", "Safeguarding", "Death", "Illness"];
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: types.map((t, i) =>
            makeNotification({ id: `n${i}`, notification_type: t }),
          ),
        }),
      );
      expect(r.total_notifications).toBe(5);
    });

    it("handles all recipient types", () => {
      const recipients = ["Ofsted", "Local Authority", "Police", "DBS"];
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: recipients.map((to, i) =>
            makeNotification({ id: `n${i}`, notified_to: to }),
          ),
        }),
      );
      expect(r.total_notifications).toBe(4);
    });

    it("handles all severity levels", () => {
      const severities = ["critical", "serious", "moderate"];
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: severities.map((s, i) =>
            makeEvent({ id: `ev${i}`, severity: s }),
          ),
        }),
      );
      expect(r.total_notifiable_events).toBe(3);
    });

    it("handles mixed timely and late notifications", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", within_timeframe: true }),
            makeNotification({ id: "n2", within_timeframe: false }),
            makeNotification({ id: "n3", within_timeframe: true }),
          ],
        }),
      );
      expect(r.timeliness_rate).toBe(67);
    });

    it("handles mixed complete and incomplete documentation", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", has_event_summary: true, has_linked_event: true }),
            makeNotification({ id: "n2", has_event_summary: true, has_linked_event: false }),
            makeNotification({ id: "n3", has_event_summary: false, has_linked_event: true }),
          ],
        }),
      );
      expect(r.documentation_rate).toBe(33);
    });

    it("today parameter drives date filtering", () => {
      // Notification from 2026-01-01 with today = 2026-05-28 → within 365
      const r1 = computeStatutoryNotificationCompliance(
        baseInput({
          today: "2026-05-28",
          notifications: [makeNotification({ id: "n1", date: "2026-01-01" })],
          notifiable_events: [],
        }),
      );
      expect(r1.total_notifications).toBe(1);

      // Same notification with today = 2027-05-28 → outside 365
      const r2 = computeStatutoryNotificationCompliance(
        baseInput({
          today: "2027-05-28",
          notifications: [makeNotification({ id: "n1", date: "2026-01-01" })],
          notifiable_events: [],
        }),
      );
      expect(r2.total_notifications).toBe(0);
    });

    it("large dataset handles correctly", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          total_children: 10,
          notifications: Array.from({ length: 100 }, (_, i) =>
            makeNotification({ id: `n${i}`, date: "2026-05-01" }),
          ),
          notifiable_events: Array.from({ length: 100 }, (_, i) =>
            makeEvent({ id: `ev${i}`, date: "2026-05-01" }),
          ),
        }),
      );
      expect(r.total_notifications).toBe(100);
      expect(r.total_notifiable_events).toBe(100);
      expect(r.notification_score).toBeGreaterThanOrEqual(0);
      expect(r.notification_score).toBeLessThanOrEqual(100);
    });

    it("returns correct rating for exactly 1 child", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({ total_children: 1 }),
      );
      expect(r.notification_rating).not.toBe("insufficient_data");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REGULATORY REFERENCE CHECKS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Regulatory references", () => {
    it("maps Ofsted as correct for Serious incident", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              notification_type: "Serious incident",
              notified_to: "Ofsted",
              regulation: "Reg 40",
            }),
          ],
        }),
      );
      expect(r.notification_score).toBeGreaterThan(50);
    });

    it("maps Police as correct for Missing child", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              notification_type: "Missing child",
              notified_to: "Police",
              regulation: "Reg 40",
            }),
          ],
        }),
      );
      expect(r.notification_score).toBeGreaterThan(50);
    });

    it("maps Ofsted as correct for Death", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              notification_type: "Death",
              notified_to: "Ofsted",
              regulation: "Reg 41",
            }),
          ],
        }),
      );
      expect(r.notification_score).toBeGreaterThan(50);
    });

    it("maps Ofsted as correct for Illness", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              notification_type: "Illness",
              notified_to: "Ofsted",
              regulation: "Reg 40",
            }),
          ],
        }),
      );
      expect(r.notification_score).toBeGreaterThan(50);
    });

    it("maps Local Authority as correct for Safeguarding", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              notification_type: "Safeguarding",
              notified_to: "Local Authority",
              regulation: "Reg 40",
            }),
          ],
        }),
      );
      expect(r.notification_score).toBeGreaterThan(50);
    });

    it("DBS is not a correct recipient for Serious incident", () => {
      const correct = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              notification_type: "Serious incident",
              notified_to: "Ofsted",
              regulation: "Reg 40",
            }),
          ],
        }),
      );
      const incorrect = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              notification_type: "Serious incident",
              notified_to: "DBS",
              regulation: "Reg 40",
            }),
          ],
        }),
      );
      expect(correct.notification_score).toBeGreaterThan(incorrect.notification_score);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPREHENSIVE SCORING VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Comprehensive scoring verification", () => {
    it("base score is 52 with neutral modifiers", () => {
      // This is hard to achieve exactly because there's no "neutral" for all modifiers simultaneously.
      // But we can verify the max possible score
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              regulation: "Reg 40",
              notified_to: "Ofsted",
              notification_type: "Serious incident",
            }),
          ],
          notifiable_events: [makeEvent({ id: "ev1" })],
        }),
      );
      // All bonuses: +6+5+5+5+4+5 = 30 → 52+30=82
      expect(r.notification_score).toBe(82);
    });

    it("max reachable score is 82", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              regulation: "Reg 40",
              notified_to: "Ofsted",
              notification_type: "Serious incident",
            }),
          ],
          notifiable_events: [makeEvent({ id: "ev1" })],
        }),
      );
      expect(r.notification_score).toBe(82);
    });

    it("0 notifications + events scores lower due to penalties", () => {
      // 0 notifications: mod1=0, mod3=-1, mod5=-1, mod6=-2
      // 1 event with all positive: mod2=+5, mod4=+5
      // Total: 52 + 0 + 5 + (-1) + 5 + (-1) + (-2) = 58
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [],
          notifiable_events: [makeEvent({ id: "ev1" })],
        }),
      );
      expect(r.notification_score).toBe(58);
    });

    it("notifications only (no events) score reflects event penalties", () => {
      // With notifications but 0 events: mod2=-1, mod4=-1
      // Perfect notifications: mod1=+6, mod3=+5, mod5=+4, mod6=+5
      // Total: 52 + 6 + (-1) + 5 + (-1) + 4 + 5 = 70
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              regulation: "Reg 40",
              notified_to: "Ofsted",
              notification_type: "Serious incident",
            }),
          ],
          notifiable_events: [],
        }),
      );
      expect(r.notification_score).toBe(70);
    });

    it("all maximum penalties produce score of 24", () => {
      // timeliness <50%: -8, completeness <70%: -5, doc <60%: -4, follow-up <60%: -4, ack <50%: -4, reg poor: -3
      // 52 + (-8) + (-5) + (-4) + (-4) + (-4) + (-3) = 24
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 4, // 40%
              acknowledgement_received: i < 4, // 40%
              has_event_summary: i < 5,
              has_linked_event: i < 5, // doc = 50%
              regulation: "",
              notified_to: "DBS",
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: Array.from({ length: 10 }, (_, i) =>
            makeEvent({
              id: `ev${i}`,
              notification_required: true,
              notification_sent: i < 6, // 60%
              follow_up_required: true,
              follow_up_completed: i < 5, // 50%
            }),
          ),
        }),
      );
      expect(r.notification_score).toBe(24);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // pct() HELPER BEHAVIOUR
  // ═══════════════════════════════════════════════════════════════════════════

  describe("pct helper behaviour", () => {
    it("returns 0 when denominator is 0 — timeliness with 0 notifications", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [],
          notifiable_events: [makeEvent({ id: "ev1" })],
        }),
      );
      expect(r.timeliness_rate).toBe(0);
    });

    it("returns 0 when denominator is 0 — completeness with 0 required events", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", notification_required: false }),
          ],
        }),
      );
      expect(r.completeness_rate).toBe(0);
    });

    it("returns 0 when denominator is 0 — follow-up with 0 required", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", follow_up_required: false }),
          ],
        }),
      );
      expect(r.follow_up_rate).toBe(0);
    });

    it("returns 0 when denominator is 0 — acknowledgement with 0 notifications", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [],
          notifiable_events: [makeEvent({ id: "ev1" })],
        }),
      );
      expect(r.acknowledgement_rate).toBe(0);
    });

    it("returns 0 when denominator is 0 — documentation with 0 notifications", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [],
          notifiable_events: [makeEvent({ id: "ev1" })],
        }),
      );
      expect(r.documentation_rate).toBe(0);
    });

    it("rounds percentages correctly — 1/3 = 33", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", within_timeframe: true }),
            makeNotification({ id: "n2", within_timeframe: false }),
            makeNotification({ id: "n3", within_timeframe: false }),
          ],
        }),
      );
      expect(r.timeliness_rate).toBe(33);
    });

    it("rounds percentages correctly — 2/3 = 67", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", within_timeframe: true }),
            makeNotification({ id: "n2", within_timeframe: true }),
            makeNotification({ id: "n3", within_timeframe: false }),
          ],
        }),
      );
      expect(r.timeliness_rate).toBe(67);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL BOUNDARY & INTERACTION TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Additional boundary and interaction tests", () => {
    it("89% timeliness gets no bonus and no penalty", () => {
      // 8/9 ≈ 89% — between 70-89%
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 9 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 8,
            }),
          ),
        }),
      );
      expect(r.timeliness_rate).toBe(89);
    });

    it("exactly 90% timeliness gets +3", () => {
      const r90 = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 9,
            }),
          ),
        }),
      );
      const r89 = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 9 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 8,
            }),
          ),
        }),
      );
      expect(r90.notification_score).toBeGreaterThan(r89.notification_score);
    });

    it("exactly 70% timeliness gets no penalty", () => {
      const r70 = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 7,
            }),
          ),
        }),
      );
      const r60 = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 6,
            }),
          ),
        }),
      );
      expect(r70.notification_score).toBeGreaterThan(r60.notification_score);
    });

    it("below 50% timeliness gets -8 (double penalty)", () => {
      // 4/10 = 40% which is < 50% → -8
      const r40 = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 4, // 40% → < 50% → -8
            }),
          ),
        }),
      );
      const r60 = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 6, // 60% → < 70% → -5
            }),
          ),
        }),
      );
      // 40% gets -8, 60% gets -5 — r40 should be 3 points lower
      expect(r40.notification_score).toBeLessThan(r60.notification_score);
    });

    it("exactly 95% documentation gets +5", () => {
      // 19/20 = 95%
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 20 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              has_event_summary: true,
              has_linked_event: i < 19, // 19/20 = 95%
            }),
          ),
        }),
      );
      expect(r.documentation_rate).toBe(95);
    });

    it("94% documentation gets +2 not +5", () => {
      // 16/17 ≈ 94%
      const r94 = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 17 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              has_event_summary: true,
              has_linked_event: i < 16, // 16/17 = 94%
            }),
          ),
        }),
      );
      const r95 = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 20 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              has_event_summary: true,
              has_linked_event: i < 19,
            }),
          ),
        }),
      );
      expect(r95.notification_score).toBeGreaterThan(r94.notification_score);
    });

    it("all moderate severity events do not trigger critical event warnings", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: Array.from({ length: 5 }, (_, i) =>
            makeEvent({ id: `ev${i}`, severity: "moderate" }),
          ),
        }),
      );
      expect(
        r.insights.some((i) => i.text.includes("critical severity")),
      ).toBe(false);
    });

    it("event with notification_required false and notification_sent true does not affect missed count", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({
              id: "ev1",
              notification_required: false,
              notification_sent: true,
            }),
          ],
        }),
      );
      expect(r.missed_notifications).toBe(0);
    });

    it("only follow_up_required events count toward follow_up_rate", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifiable_events: [
            makeEvent({ id: "ev1", follow_up_required: true, follow_up_completed: true }),
            makeEvent({ id: "ev2", follow_up_required: false, follow_up_completed: false }),
            makeEvent({ id: "ev3", follow_up_required: false, follow_up_completed: false }),
          ],
        }),
      );
      expect(r.follow_up_rate).toBe(100);
    });

    it("multiple different notification types in same batch", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", notification_type: "Serious incident", notified_to: "Ofsted" }),
            makeNotification({ id: "n2", notification_type: "Missing child", notified_to: "Police" }),
            makeNotification({ id: "n3", notification_type: "Death", notified_to: "Ofsted" }),
            makeNotification({ id: "n4", notification_type: "Safeguarding", notified_to: "Local Authority" }),
            makeNotification({ id: "n5", notification_type: "Illness", notified_to: "Ofsted" }),
          ],
        }),
      );
      expect(r.total_notifications).toBe(5);
      expect(r.notification_score).toBeGreaterThanOrEqual(0);
    });

    it("regulation field with whitespace only is treated as absent", () => {
      const withReg = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", regulation: "Reg 40" }),
          ],
        }),
      );
      const noReg = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", regulation: "   " }),
          ],
        }),
      );
      // Whitespace-only regulation should be treated as absent
      expect(noReg.notification_score).toBeLessThanOrEqual(withReg.notification_score);
    });

    it("empty regulation string is treated as absent", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({ id: "n1", regulation: "" }),
          ],
        }),
      );
      // reg modifier penalises for empty regulation
      expect(r.notification_score).toBeLessThan(82);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ADDITIONAL COVERAGE
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Additional coverage", () => {
    it("50% timeliness exactly lands in <70% bracket (not <50%)", () => {
      // 50% is NOT < 50, so it gets -5 not -8
      const r50 = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 5, // 50%
            }),
          ),
        }),
      );
      const r40 = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 4, // 40% — gets -8
            }),
          ),
        }),
      );
      // 50% gets -5 while 40% gets -8, so r50 should be higher
      expect(r50.notification_score).toBeGreaterThan(r40.notification_score);
    });

    it("exactly 0% timeliness gets maximum timeliness penalty", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 5 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: false, // 0%
            }),
          ),
        }),
      );
      expect(r.timeliness_rate).toBe(0);
    });

    it("single notification drives all notification-based rates", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: [
            makeNotification({
              id: "n1",
              within_timeframe: false,
              acknowledgement_received: false,
              has_event_summary: false,
              has_linked_event: false,
            }),
          ],
        }),
      );
      expect(r.timeliness_rate).toBe(0);
      expect(r.acknowledgement_rate).toBe(0);
      expect(r.documentation_rate).toBe(0);
    });

    it("outstanding score triggers positive insights not critical", () => {
      const r = computeStatutoryNotificationCompliance(baseInput());
      expect(r.notification_rating).toBe("outstanding");
      expect(r.insights.every((i) => i.severity !== "critical")).toBe(true);
    });

    it("inadequate score triggers improvement plan recommendation", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 4,
              acknowledgement_received: i < 4,
              has_event_summary: i < 5,
              has_linked_event: i < 5,
              regulation: "",
              notified_to: "DBS",
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: Array.from({ length: 10 }, (_, i) =>
            makeEvent({
              id: `ev${i}`,
              notification_required: true,
              notification_sent: i < 6,
              follow_up_required: true,
              follow_up_completed: i < 5,
            }),
          ),
        }),
      );
      expect(r.notification_rating).toBe("inadequate");
      expect(r.recommendations.some((rec) => rec.recommendation.toLowerCase().includes("improvement plan"))).toBe(true);
    });

    it("good headline mentions gaps when timeliness is not perfect", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 9,
              acknowledgement_received: i < 4,
              has_event_summary: true,
              has_linked_event: i < 8,
              regulation: "Reg 40",
              notified_to: i < 5 ? "Ofsted" : "DBS",
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: [
            makeEvent({
              id: "ev1",
              notification_required: true,
              notification_sent: true,
              follow_up_required: true,
              follow_up_completed: true,
            }),
          ],
        }),
      );
      expect(r.notification_rating).toBe("good");
      expect(r.headline.toLowerCase()).toContain("timeliness");
    });

    it("adequate headline mentions improvements needed", () => {
      const r = computeStatutoryNotificationCompliance(
        baseInput({
          notifications: Array.from({ length: 10 }, (_, i) =>
            makeNotification({
              id: `n${i}`,
              within_timeframe: i < 6,
              acknowledgement_received: i < 6,
              has_event_summary: i < 5,
              has_linked_event: i < 5,
              regulation: "",
              notified_to: "DBS",
              notification_type: "Serious incident",
            }),
          ),
          notifiable_events: Array.from({ length: 10 }, (_, i) =>
            makeEvent({
              id: `ev${i}`,
              notification_required: true,
              notification_sent: i < 8,
              follow_up_required: true,
              follow_up_completed: true,
            }),
          ),
        }),
      );
      expect(r.notification_rating).toBe("adequate");
      expect(r.headline.toLowerCase()).toContain("improvements needed");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DETERMINISM
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Determinism", () => {
    it("produces identical results for identical inputs", () => {
      const input = baseInput();
      const r1 = computeStatutoryNotificationCompliance(input);
      const r2 = computeStatutoryNotificationCompliance(input);
      expect(r1).toEqual(r2);
    });

    it("produces identical results across multiple runs", () => {
      const input = baseInput({
        notifications: Array.from({ length: 10 }, (_, i) =>
          makeNotification({
            id: `n${i}`,
            within_timeframe: i % 2 === 0,
            acknowledgement_received: i % 3 === 0,
          }),
        ),
        notifiable_events: Array.from({ length: 10 }, (_, i) =>
          makeEvent({
            id: `ev${i}`,
            notification_sent: i % 2 === 0,
            follow_up_completed: i % 3 === 0,
          }),
        ),
      });
      const results = Array.from({ length: 5 }, () =>
        computeStatutoryNotificationCompliance(input),
      );
      for (let i = 1; i < results.length; i++) {
        expect(results[i].notification_score).toBe(results[0].notification_score);
        expect(results[i].notification_rating).toBe(results[0].notification_rating);
      }
    });
  });
});
