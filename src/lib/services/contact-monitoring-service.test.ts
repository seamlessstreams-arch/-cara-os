import { describe, it, expect } from "vitest";
import {
  computeContactMetrics,
  identifyContactAlerts,
  type ContactSession,
} from "./contact-monitoring-service";

function makeSession(overrides: Partial<ContactSession> = {}): ContactSession {
  return {
    id: "sess-1",
    home_id: "home-1",
    child_name: "Child A",
    child_id: "child-1",
    contact_with: "Parent A",
    relationship: "birth_parent",
    contact_type: "face_to_face",
    supervision_level: "supervised",
    scheduled_date: "2026-05-01",
    actual_date: "2026-05-01",
    duration_minutes: 60,
    outcome: "completed_positive",
    child_mood_before: "calm",
    child_mood_after: "happy",
    child_views: "It was nice to see mum",
    staff_observations: "Contact went well",
    concerns_raised: false,
    concern_details: null,
    social_worker_informed: true,
    court_ordered: false,
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("contact-monitoring-service", () => {
  // ── computeContactMetrics ─────────────────────────────────────────────

  describe("computeContactMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeContactMetrics([], 4);
      expect(m.total_sessions).toBe(0);
      expect(m.completed_count).toBe(0);
      expect(m.cancelled_count).toBe(0);
      expect(m.no_show_count).toBe(0);
      expect(m.refused_count).toBe(0);
      // fab-0: null when sessions=[] (no data to compute rate over).
      expect(m.completion_rate).toBeNull();
      expect(m.positive_outcome_rate).toBeNull();
      expect(m.negative_outcome_rate).toBeNull();
      expect(m.children_with_contact).toBe(0);
      // totalChildren=4 → 0/4 = real 0.
      expect(m.contact_coverage).toBe(0);
      // fab-0: null when no sessions have durations.
      expect(m.average_duration).toBeNull();
      expect(m.child_views_recorded_rate).toBeNull();
    });

    it("computes populated metrics correctly", () => {
      const sessions = [
        makeSession({ id: "s1", child_id: "c1", child_name: "A", outcome: "completed_positive", duration_minutes: 60 }),
        makeSession({ id: "s2", child_id: "c2", child_name: "B", outcome: "completed_neutral", duration_minutes: 90 }),
        makeSession({ id: "s3", child_id: "c1", child_name: "A", outcome: "completed_negative", duration_minutes: 30 }),
        makeSession({ id: "s4", child_id: "c3", child_name: "C", outcome: "cancelled_by_parent" }),
        makeSession({ id: "s5", child_id: "c1", child_name: "A", outcome: "no_show" }),
        makeSession({ id: "s6", child_id: "c2", child_name: "B", outcome: "refused_by_child" }),
      ];
      const m = computeContactMetrics(sessions, 4);
      expect(m.total_sessions).toBe(6);
      expect(m.completed_count).toBe(3);
      expect(m.cancelled_count).toBe(1);
      expect(m.no_show_count).toBe(1);
      expect(m.refused_count).toBe(1);
      expect(m.completion_rate).toBe(50);
      // positive: 1/3 completed = 33.3%
      expect(m.positive_outcome_rate).toBe(33.3);
      // negative: 1/3 completed = 33.3%
      expect(m.negative_outcome_rate).toBe(33.3);
      expect(m.children_with_contact).toBe(3);
      expect(m.contact_coverage).toBe(75);
      // average duration: only completed (60+90+30)/3 = 60
      expect(m.average_duration).toBe(60);
    });

    it("counts breakdowns by type, outcome, supervision, and child", () => {
      const sessions = [
        makeSession({ id: "s1", contact_type: "phone_call", supervision_level: "none", child_name: "A" }),
        makeSession({ id: "s2", contact_type: "phone_call", supervision_level: "supervised", child_name: "B" }),
        makeSession({ id: "s3", contact_type: "video_call", supervision_level: "none", child_name: "A" }),
      ];
      const m = computeContactMetrics(sessions, 4);
      expect(m.by_contact_type["phone_call"]).toBe(2);
      expect(m.by_contact_type["video_call"]).toBe(1);
      expect(m.by_supervision_level["none"]).toBe(2);
      expect(m.by_supervision_level["supervised"]).toBe(1);
      expect(m.by_child["A"]).toBe(2);
      expect(m.by_child["B"]).toBe(1);
      expect(m.supervised_count).toBe(1);
    });

    it("computes concerns_raised_count and court_ordered_count", () => {
      const sessions = [
        makeSession({ id: "s1", concerns_raised: true, court_ordered: true }),
        makeSession({ id: "s2", concerns_raised: true, court_ordered: false }),
        makeSession({ id: "s3", concerns_raised: false, court_ordered: true }),
      ];
      const m = computeContactMetrics(sessions, 4);
      expect(m.concerns_raised_count).toBe(2);
      expect(m.court_ordered_count).toBe(2);
    });
  });

  // ── identifyContactAlerts ─────────────────────────────────────────────

  describe("identifyContactAlerts", () => {
    it("returns empty alerts for empty data with zero children", () => {
      expect(identifyContactAlerts([], 0)).toEqual([]);
    });

    it("flags concern_not_reported when concern raised but SW not informed", () => {
      const sessions = [
        makeSession({ concerns_raised: true, social_worker_informed: false }),
      ];
      const alerts = identifyContactAlerts(sessions, 4);
      expect(alerts.some((a) => a.type === "concern_not_reported" && a.severity === "critical")).toBe(true);
    });

    it("flags repeated_no_show when parent has 2+ no-shows", () => {
      const sessions = [
        makeSession({ id: "s1", child_id: "c1", child_name: "A", contact_with: "Dad", outcome: "no_show" }),
        makeSession({ id: "s2", child_id: "c1", child_name: "A", contact_with: "Dad", outcome: "no_show" }),
      ];
      const alerts = identifyContactAlerts(sessions, 4);
      expect(alerts.some((a) => a.type === "repeated_no_show" && a.severity === "high")).toBe(true);
    });

    it("does NOT flag repeated_no_show for only 1 no-show", () => {
      const sessions = [
        makeSession({ id: "s1", child_id: "c1", contact_with: "Dad", outcome: "no_show" }),
      ];
      const alerts = identifyContactAlerts(sessions, 4);
      expect(alerts.some((a) => a.type === "repeated_no_show")).toBe(false);
    });

    it("flags repeated_refusal when child refuses 2+ times", () => {
      const sessions = [
        makeSession({ id: "s1", child_id: "c1", child_name: "A", outcome: "refused_by_child" }),
        makeSession({ id: "s2", child_id: "c1", child_name: "A", outcome: "refused_by_child" }),
      ];
      const alerts = identifyContactAlerts(sessions, 4);
      expect(alerts.some((a) => a.type === "repeated_refusal" && a.severity === "high")).toBe(true);
    });

    it("flags distress_after_contact for negative outcome with upset/angry/withdrawn mood", () => {
      const sessions = [
        makeSession({ outcome: "completed_negative", child_mood_after: "upset" }),
      ];
      const alerts = identifyContactAlerts(sessions, 4);
      expect(alerts.some((a) => a.type === "distress_after_contact" && a.severity === "medium")).toBe(true);
    });

    it("flags no_contact_recorded when totalChildren > children with sessions", () => {
      const sessions = [
        makeSession({ child_id: "c1" }),
        makeSession({ child_id: "c2" }),
      ];
      const alerts = identifyContactAlerts(sessions, 4);
      const gap = alerts.find((a) => a.type === "no_contact_recorded");
      expect(gap).toBeDefined();
      expect(gap!.severity).toBe("medium");
      expect(gap!.message).toContain("2 children have");
    });
  });
});
