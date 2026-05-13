// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SIGNIFICANT EVENTS SERVICE TESTS
// Pure-function unit tests for event metrics computation, alert identification,
// constant validation, and CRUD fallback behaviour.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";
import { _testing } from "../significant-events-service";
import {
  EVENT_CATEGORIES,
  EVENT_SENTIMENTS,
  EVENT_IMPACTS,
} from "../significant-events-service";

import type {
  SignificantEvent,
  EventCategory,
  EventSentiment,
  EventImpact,
} from "../significant-events-service";

const { computeEventMetrics, identifyEventAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Normalized today to avoid date-drift across midnight boundary. */
const now = new Date(new Date().toISOString().split("T")[0]);

/** Return a date string N days before a reference date. */
function daysAgo(n: number, from: Date = now): string {
  const d = new Date(from.getTime() - n * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

/** Return a date string N days after a reference date. */
function daysFromNow(n: number, from: Date = now): string {
  const d = new Date(from.getTime() + n * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

let _id = 0;
/** Build a minimal SignificantEvent with sensible defaults. */
function makeEvent(
  overrides: Partial<SignificantEvent> = {},
): SignificantEvent {
  _id += 1;
  return {
    id: overrides.id ?? `evt-${_id}`,
    home_id: overrides.home_id ?? "home-1",
    child_name: overrides.child_name ?? "Child A",
    child_id: overrides.child_id ?? "child-1",
    event_date: overrides.event_date ?? daysAgo(5),
    category: overrides.category ?? "achievement",
    title: overrides.title ?? "Test event",
    description: overrides.description ?? "A test significant event.",
    sentiment: overrides.sentiment ?? "positive",
    impact: overrides.impact ?? "medium",
    recorded_by: overrides.recorded_by ?? "staff-1",
    child_views: overrides.child_views ?? null,
    follow_up_actions: overrides.follow_up_actions ?? [],
    shared_with_family: overrides.shared_with_family ?? false,
    shared_with_social_worker: overrides.shared_with_social_worker ?? false,
    added_to_life_story: overrides.added_to_life_story ?? false,
    photos_attached: overrides.photos_attached ?? false,
    created_at: overrides.created_at ?? "2026-05-01T10:00:00Z",
    updated_at: overrides.updated_at ?? "2026-05-01T10:00:00Z",
  };
}

/** Build N events for a given child. */
function eventsForChild(
  childId: string,
  childName: string,
  count: number,
  overrides: Partial<SignificantEvent> = {},
): SignificantEvent[] {
  return Array.from({ length: count }, (_, i) =>
    makeEvent({
      child_id: childId,
      child_name: childName,
      event_date: daysAgo(i + 1),
      ...overrides,
    }),
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  // ── EVENT_CATEGORIES ─────────────────────────────────────────────────────

  describe("EVENT_CATEGORIES", () => {
    it("has exactly 16 items", () => {
      expect(EVENT_CATEGORIES).toHaveLength(16);
    });

    it("has unique category values", () => {
      const cats = EVENT_CATEGORIES.map((c) => c.category);
      expect(new Set(cats).size).toBe(cats.length);
    });

    it("has unique label values", () => {
      const labels = EVENT_CATEGORIES.map((c) => c.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty category string", () => {
      for (const c of EVENT_CATEGORIES) {
        expect(c.category.length).toBeGreaterThan(0);
      }
    });

    it("every entry has a non-empty label string", () => {
      for (const c of EVENT_CATEGORIES) {
        expect(c.label.length).toBeGreaterThan(0);
      }
    });

    it("includes achievement category", () => {
      expect(EVENT_CATEGORIES.find((c) => c.category === "achievement")).toBeDefined();
    });

    it("includes bereavement category", () => {
      expect(EVENT_CATEGORIES.find((c) => c.category === "bereavement")).toBeDefined();
    });

    it("includes other as last category", () => {
      expect(EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1].category).toBe("other");
    });
  });

  // ── EVENT_SENTIMENTS ─────────────────────────────────────────────────────

  describe("EVENT_SENTIMENTS", () => {
    it("has exactly 5 items", () => {
      expect(EVENT_SENTIMENTS).toHaveLength(5);
    });

    it("has unique sentiment values", () => {
      const sents = EVENT_SENTIMENTS.map((s) => s.sentiment);
      expect(new Set(sents).size).toBe(sents.length);
    });

    it("has unique label values", () => {
      const labels = EVENT_SENTIMENTS.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty sentiment string", () => {
      for (const s of EVENT_SENTIMENTS) {
        expect(s.sentiment.length).toBeGreaterThan(0);
      }
    });

    it("includes very_positive sentiment", () => {
      expect(EVENT_SENTIMENTS.find((s) => s.sentiment === "very_positive")).toBeDefined();
    });

    it("includes very_negative sentiment", () => {
      expect(EVENT_SENTIMENTS.find((s) => s.sentiment === "very_negative")).toBeDefined();
    });
  });

  // ── EVENT_IMPACTS ────────────────────────────────────────────────────────

  describe("EVENT_IMPACTS", () => {
    it("has exactly 3 items", () => {
      expect(EVENT_IMPACTS).toHaveLength(3);
    });

    it("has unique impact values", () => {
      const imps = EVENT_IMPACTS.map((i) => i.impact);
      expect(new Set(imps).size).toBe(imps.length);
    });

    it("has unique label values", () => {
      const labels = EVENT_IMPACTS.map((i) => i.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty impact string", () => {
      for (const i of EVENT_IMPACTS) {
        expect(i.impact.length).toBeGreaterThan(0);
      }
    });

    it("includes high impact", () => {
      expect(EVENT_IMPACTS.find((i) => i.impact === "high")).toBeDefined();
    });

    it("includes low impact", () => {
      expect(EVENT_IMPACTS.find((i) => i.impact === "low")).toBeDefined();
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeEventMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeEventMetrics", () => {
  // ── Empty / single ─────────────────────────────────────────────────────

  describe("empty array", () => {
    it("returns zero for total_events", () => {
      const m = computeEventMetrics([], 3, now);
      expect(m.total_events).toBe(0);
    });

    it("returns zero for events_this_month", () => {
      const m = computeEventMetrics([], 3, now);
      expect(m.events_this_month).toBe(0);
    });

    it("returns zero for positive_events", () => {
      const m = computeEventMetrics([], 3, now);
      expect(m.positive_events).toBe(0);
    });

    it("returns zero for negative_events", () => {
      const m = computeEventMetrics([], 3, now);
      expect(m.negative_events).toBe(0);
    });

    it("returns zero for positive_ratio", () => {
      const m = computeEventMetrics([], 3, now);
      expect(m.positive_ratio).toBe(0);
    });

    it("returns zero for achievements", () => {
      const m = computeEventMetrics([], 3, now);
      expect(m.achievements).toBe(0);
    });

    it("returns zero for children_with_events", () => {
      const m = computeEventMetrics([], 3, now);
      expect(m.children_with_events).toBe(0);
    });

    it("returns zero for event_coverage", () => {
      const m = computeEventMetrics([], 3, now);
      expect(m.event_coverage).toBe(0);
    });

    it("returns zero for child_views_recorded_rate", () => {
      const m = computeEventMetrics([], 3, now);
      expect(m.child_views_recorded_rate).toBe(0);
    });

    it("returns zero for shared_with_family_rate", () => {
      const m = computeEventMetrics([], 3, now);
      expect(m.shared_with_family_rate).toBe(0);
    });

    it("returns zero for added_to_life_story_rate", () => {
      const m = computeEventMetrics([], 3, now);
      expect(m.added_to_life_story_rate).toBe(0);
    });

    it("returns zero for follow_ups_pending", () => {
      const m = computeEventMetrics([], 3, now);
      expect(m.follow_ups_pending).toBe(0);
    });

    it("returns zero for high_impact_count", () => {
      const m = computeEventMetrics([], 3, now);
      expect(m.high_impact_count).toBe(0);
    });

    it("returns empty by_category", () => {
      const m = computeEventMetrics([], 3, now);
      expect(m.by_category).toEqual({});
    });

    it("returns empty by_sentiment", () => {
      const m = computeEventMetrics([], 3, now);
      expect(m.by_sentiment).toEqual({});
    });

    it("returns empty by_impact", () => {
      const m = computeEventMetrics([], 3, now);
      expect(m.by_impact).toEqual({});
    });

    it("returns empty by_child", () => {
      const m = computeEventMetrics([], 3, now);
      expect(m.by_child).toEqual({});
    });
  });

  describe("single event", () => {
    it("returns total_events of 1", () => {
      const events = [makeEvent()];
      const m = computeEventMetrics(events, 3, now);
      expect(m.total_events).toBe(1);
    });

    it("counts one child_with_events", () => {
      const events = [makeEvent()];
      const m = computeEventMetrics(events, 3, now);
      expect(m.children_with_events).toBe(1);
    });

    it("computes event_coverage for one child out of three", () => {
      const events = [makeEvent()];
      const m = computeEventMetrics(events, 3, now);
      expect(m.event_coverage).toBeCloseTo(33.3, 0);
    });

    it("counts a positive event in positive_events", () => {
      const events = [makeEvent({ sentiment: "positive" })];
      const m = computeEventMetrics(events, 3, now);
      expect(m.positive_events).toBe(1);
    });

    it("computes 100% positive_ratio for a single positive event", () => {
      const events = [makeEvent({ sentiment: "positive" })];
      const m = computeEventMetrics(events, 3, now);
      expect(m.positive_ratio).toBe(100);
    });
  });

  // ── Sentiment counting ─────────────────────────────────────────────────

  describe("sentiment counting", () => {
    it("counts very_positive as a positive event", () => {
      const events = [makeEvent({ sentiment: "very_positive" })];
      const m = computeEventMetrics(events, 3, now);
      expect(m.positive_events).toBe(1);
      expect(m.negative_events).toBe(0);
    });

    it("counts positive as a positive event", () => {
      const events = [makeEvent({ sentiment: "positive" })];
      const m = computeEventMetrics(events, 3, now);
      expect(m.positive_events).toBe(1);
      expect(m.negative_events).toBe(0);
    });

    it("does not count neutral as positive or negative", () => {
      const events = [makeEvent({ sentiment: "neutral" })];
      const m = computeEventMetrics(events, 3, now);
      expect(m.positive_events).toBe(0);
      expect(m.negative_events).toBe(0);
    });

    it("counts negative as a negative event", () => {
      const events = [makeEvent({ sentiment: "negative" })];
      const m = computeEventMetrics(events, 3, now);
      expect(m.negative_events).toBe(1);
      expect(m.positive_events).toBe(0);
    });

    it("counts very_negative as a negative event", () => {
      const events = [makeEvent({ sentiment: "very_negative" })];
      const m = computeEventMetrics(events, 3, now);
      expect(m.negative_events).toBe(1);
      expect(m.positive_events).toBe(0);
    });

    it("counts mixed sentiments correctly", () => {
      const events = [
        makeEvent({ sentiment: "very_positive" }),
        makeEvent({ sentiment: "positive" }),
        makeEvent({ sentiment: "neutral" }),
        makeEvent({ sentiment: "negative" }),
        makeEvent({ sentiment: "very_negative" }),
      ];
      const m = computeEventMetrics(events, 5, now);
      expect(m.positive_events).toBe(2);
      expect(m.negative_events).toBe(2);
    });
  });

  // ── positive_ratio ─────────────────────────────────────────────────────

  describe("positive_ratio", () => {
    it("returns 0 for all-negative events", () => {
      const events = [
        makeEvent({ sentiment: "negative" }),
        makeEvent({ sentiment: "very_negative" }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.positive_ratio).toBe(0);
    });

    it("returns 100 for all-positive events", () => {
      const events = [
        makeEvent({ sentiment: "positive" }),
        makeEvent({ sentiment: "very_positive" }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.positive_ratio).toBe(100);
    });

    it("returns 50 for equal positive and negative events", () => {
      const events = [
        makeEvent({ sentiment: "positive" }),
        makeEvent({ sentiment: "negative" }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.positive_ratio).toBe(50);
    });

    it("handles neutral events in the denominator", () => {
      const events = [
        makeEvent({ sentiment: "positive" }),
        makeEvent({ sentiment: "neutral" }),
        makeEvent({ sentiment: "neutral" }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.positive_ratio).toBeCloseTo(33.3, 0);
    });

    it("rounds to one decimal place", () => {
      const events = [
        makeEvent({ sentiment: "positive" }),
        makeEvent({ sentiment: "neutral" }),
        makeEvent({ sentiment: "neutral" }),
      ];
      const m = computeEventMetrics(events, 3, now);
      // 1/3 * 100 = 33.333... rounded to 33.3
      expect(m.positive_ratio).toBe(33.3);
    });
  });

  // ── events_this_month (30-day window) ──────────────────────────────────

  describe("events_this_month", () => {
    it("includes event from today", () => {
      const events = [makeEvent({ event_date: daysAgo(0) })];
      const m = computeEventMetrics(events, 3, now);
      expect(m.events_this_month).toBe(1);
    });

    it("includes event from 5 days ago", () => {
      const events = [makeEvent({ event_date: daysAgo(5) })];
      const m = computeEventMetrics(events, 3, now);
      expect(m.events_this_month).toBe(1);
    });

    it("includes event from 29 days ago", () => {
      const events = [makeEvent({ event_date: daysAgo(29) })];
      const m = computeEventMetrics(events, 3, now);
      expect(m.events_this_month).toBe(1);
    });

    it("includes event from exactly 30 days ago", () => {
      const events = [makeEvent({ event_date: daysAgo(30) })];
      const m = computeEventMetrics(events, 3, now);
      expect(m.events_this_month).toBe(1);
    });

    it("excludes event from 31 days ago", () => {
      const events = [makeEvent({ event_date: daysAgo(31) })];
      const m = computeEventMetrics(events, 3, now);
      expect(m.events_this_month).toBe(0);
    });

    it("excludes event from 60 days ago", () => {
      const events = [makeEvent({ event_date: daysAgo(60) })];
      const m = computeEventMetrics(events, 3, now);
      expect(m.events_this_month).toBe(0);
    });

    it("excludes future events", () => {
      const events = [makeEvent({ event_date: daysFromNow(1) })];
      const m = computeEventMetrics(events, 3, now);
      expect(m.events_this_month).toBe(0);
    });

    it("counts mix of recent and old events", () => {
      const events = [
        makeEvent({ event_date: daysAgo(2) }),
        makeEvent({ event_date: daysAgo(10) }),
        makeEvent({ event_date: daysAgo(45) }),
        makeEvent({ event_date: daysAgo(90) }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.events_this_month).toBe(2);
    });
  });

  // ── achievements ───────────────────────────────────────────────────────

  describe("achievements", () => {
    it("counts achievement category events", () => {
      const events = [
        makeEvent({ category: "achievement" }),
        makeEvent({ category: "achievement" }),
        makeEvent({ category: "birthday" }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.achievements).toBe(2);
    });

    it("returns zero when no achievements exist", () => {
      const events = [
        makeEvent({ category: "birthday" }),
        makeEvent({ category: "bereavement" }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.achievements).toBe(0);
    });
  });

  // ── children coverage ──────────────────────────────────────────────────

  describe("children coverage", () => {
    it("counts unique children", () => {
      const events = [
        makeEvent({ child_id: "c1", child_name: "Child A" }),
        makeEvent({ child_id: "c2", child_name: "Child B" }),
        makeEvent({ child_id: "c1", child_name: "Child A" }),
      ];
      const m = computeEventMetrics(events, 5, now);
      expect(m.children_with_events).toBe(2);
    });

    it("computes 100% event_coverage when all children covered", () => {
      const events = [
        makeEvent({ child_id: "c1" }),
        makeEvent({ child_id: "c2" }),
        makeEvent({ child_id: "c3" }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.event_coverage).toBe(100);
    });

    it("returns zero coverage when totalChildren is zero", () => {
      const events = [makeEvent()];
      const m = computeEventMetrics(events, 0, now);
      expect(m.event_coverage).toBe(0);
    });

    it("computes fractional coverage correctly", () => {
      const events = [
        makeEvent({ child_id: "c1" }),
        makeEvent({ child_id: "c2" }),
      ];
      const m = computeEventMetrics(events, 4, now);
      expect(m.event_coverage).toBe(50);
    });
  });

  // ── child_views_recorded_rate ──────────────────────────────────────────

  describe("child_views_recorded_rate", () => {
    it("returns 0 when no events have child views", () => {
      const events = [
        makeEvent({ child_views: null }),
        makeEvent({ child_views: null }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.child_views_recorded_rate).toBe(0);
    });

    it("returns 100 when all events have child views", () => {
      const events = [
        makeEvent({ child_views: "Happy about it" }),
        makeEvent({ child_views: "Excited" }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.child_views_recorded_rate).toBe(100);
    });

    it("computes partial rate correctly", () => {
      const events = [
        makeEvent({ child_views: "Happy" }),
        makeEvent({ child_views: null }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.child_views_recorded_rate).toBe(50);
    });

    it("treats empty string as recorded (not null)", () => {
      const events = [makeEvent({ child_views: "" })];
      const m = computeEventMetrics(events, 3, now);
      expect(m.child_views_recorded_rate).toBe(100);
    });
  });

  // ── shared_with_family_rate ────────────────────────────────────────────

  describe("shared_with_family_rate", () => {
    it("returns 0 when none shared with family", () => {
      const events = [
        makeEvent({ shared_with_family: false }),
        makeEvent({ shared_with_family: false }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.shared_with_family_rate).toBe(0);
    });

    it("returns 100 when all shared with family", () => {
      const events = [
        makeEvent({ shared_with_family: true }),
        makeEvent({ shared_with_family: true }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.shared_with_family_rate).toBe(100);
    });

    it("computes partial family sharing rate", () => {
      const events = [
        makeEvent({ shared_with_family: true }),
        makeEvent({ shared_with_family: false }),
        makeEvent({ shared_with_family: false }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.shared_with_family_rate).toBeCloseTo(33.3, 0);
    });
  });

  // ── added_to_life_story_rate ───────────────────────────────────────────

  describe("added_to_life_story_rate", () => {
    it("returns 0 when none added to life story", () => {
      const events = [
        makeEvent({ added_to_life_story: false }),
        makeEvent({ added_to_life_story: false }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.added_to_life_story_rate).toBe(0);
    });

    it("returns 100 when all added to life story", () => {
      const events = [
        makeEvent({ added_to_life_story: true }),
        makeEvent({ added_to_life_story: true }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.added_to_life_story_rate).toBe(100);
    });

    it("computes partial life story rate", () => {
      const events = [
        makeEvent({ added_to_life_story: true }),
        makeEvent({ added_to_life_story: false }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.added_to_life_story_rate).toBe(50);
    });
  });

  // ── follow_ups_pending ─────────────────────────────────────────────────

  describe("follow_ups_pending", () => {
    it("returns 0 when no events have follow-up actions", () => {
      const events = [
        makeEvent({ follow_up_actions: [] }),
        makeEvent({ follow_up_actions: [] }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.follow_ups_pending).toBe(0);
    });

    it("counts events that have follow-up actions", () => {
      const events = [
        makeEvent({ follow_up_actions: ["Call parent"] }),
        makeEvent({ follow_up_actions: ["Schedule meeting", "Write report"] }),
        makeEvent({ follow_up_actions: [] }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.follow_ups_pending).toBe(2);
    });

    it("counts each event once regardless of number of follow-up actions", () => {
      const events = [
        makeEvent({ follow_up_actions: ["A", "B", "C", "D"] }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.follow_ups_pending).toBe(1);
    });
  });

  // ── high_impact_count ──────────────────────────────────────────────────

  describe("high_impact_count", () => {
    it("counts high-impact events only", () => {
      const events = [
        makeEvent({ impact: "high" }),
        makeEvent({ impact: "medium" }),
        makeEvent({ impact: "low" }),
        makeEvent({ impact: "high" }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.high_impact_count).toBe(2);
    });

    it("returns 0 when no high-impact events exist", () => {
      const events = [
        makeEvent({ impact: "medium" }),
        makeEvent({ impact: "low" }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.high_impact_count).toBe(0);
    });
  });

  // ── by_category ────────────────────────────────────────────────────────

  describe("by_category", () => {
    it("groups events by category", () => {
      const events = [
        makeEvent({ category: "achievement" }),
        makeEvent({ category: "achievement" }),
        makeEvent({ category: "birthday" }),
        makeEvent({ category: "bereavement" }),
      ];
      const m = computeEventMetrics(events, 5, now);
      expect(m.by_category).toEqual({
        achievement: 2,
        birthday: 1,
        bereavement: 1,
      });
    });

    it("handles single-category events", () => {
      const events = [
        makeEvent({ category: "therapy_breakthrough" }),
        makeEvent({ category: "therapy_breakthrough" }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.by_category).toEqual({ therapy_breakthrough: 2 });
    });
  });

  // ── by_sentiment ───────────────────────────────────────────────────────

  describe("by_sentiment", () => {
    it("groups events by sentiment", () => {
      const events = [
        makeEvent({ sentiment: "very_positive" }),
        makeEvent({ sentiment: "positive" }),
        makeEvent({ sentiment: "neutral" }),
        makeEvent({ sentiment: "negative" }),
        makeEvent({ sentiment: "very_negative" }),
      ];
      const m = computeEventMetrics(events, 5, now);
      expect(m.by_sentiment).toEqual({
        very_positive: 1,
        positive: 1,
        neutral: 1,
        negative: 1,
        very_negative: 1,
      });
    });

    it("accumulates multiple events of same sentiment", () => {
      const events = [
        makeEvent({ sentiment: "positive" }),
        makeEvent({ sentiment: "positive" }),
        makeEvent({ sentiment: "positive" }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.by_sentiment).toEqual({ positive: 3 });
    });
  });

  // ── by_impact ──────────────────────────────────────────────────────────

  describe("by_impact", () => {
    it("groups events by impact level", () => {
      const events = [
        makeEvent({ impact: "high" }),
        makeEvent({ impact: "high" }),
        makeEvent({ impact: "medium" }),
        makeEvent({ impact: "low" }),
      ];
      const m = computeEventMetrics(events, 5, now);
      expect(m.by_impact).toEqual({
        high: 2,
        medium: 1,
        low: 1,
      });
    });
  });

  // ── by_child ───────────────────────────────────────────────────────────

  describe("by_child", () => {
    it("groups events by child_name", () => {
      const events = [
        makeEvent({ child_name: "Alice" }),
        makeEvent({ child_name: "Alice" }),
        makeEvent({ child_name: "Bob" }),
      ];
      const m = computeEventMetrics(events, 5, now);
      expect(m.by_child).toEqual({
        Alice: 2,
        Bob: 1,
      });
    });

    it("handles a single child with multiple events", () => {
      const events = eventsForChild("c1", "Charlie", 4);
      const m = computeEventMetrics(events, 3, now);
      expect(m.by_child).toEqual({ Charlie: 4 });
    });
  });

  // ── Multiple events ────────────────────────────────────────────────────

  describe("multiple events", () => {
    it("computes total_events for large set", () => {
      const events = Array.from({ length: 20 }, () => makeEvent());
      const m = computeEventMetrics(events, 5, now);
      expect(m.total_events).toBe(20);
    });

    it("computes correct positive_ratio with mixed sentiments", () => {
      const events = [
        makeEvent({ sentiment: "very_positive" }),
        makeEvent({ sentiment: "positive" }),
        makeEvent({ sentiment: "neutral" }),
        makeEvent({ sentiment: "negative" }),
      ];
      const m = computeEventMetrics(events, 5, now);
      // 2 positive out of 4 = 50%
      expect(m.positive_ratio).toBe(50);
    });

    it("works without explicit now parameter", () => {
      const events = [makeEvent({ event_date: new Date().toISOString().split("T")[0] })];
      const m = computeEventMetrics(events, 3);
      expect(m.total_events).toBe(1);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. identifyEventAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyEventAlerts", () => {
  // ── not_shared_sw ──────────────────────────────────────────────────────

  describe("not_shared_sw alert", () => {
    it("triggers for high-impact negative event not shared with SW", () => {
      const events = [
        makeEvent({
          impact: "high",
          sentiment: "negative",
          shared_with_social_worker: false,
          title: "Distressing incident",
          child_name: "Alice",
        }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      const found = alerts.find((a) => a.type === "not_shared_sw");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("high");
    });

    it("triggers for high-impact very_negative event not shared with SW", () => {
      const events = [
        makeEvent({
          impact: "high",
          sentiment: "very_negative",
          shared_with_social_worker: false,
        }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      expect(alerts.some((a) => a.type === "not_shared_sw")).toBe(true);
    });

    it("does not trigger when shared with social worker", () => {
      const events = [
        makeEvent({
          impact: "high",
          sentiment: "negative",
          shared_with_social_worker: true,
        }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      expect(alerts.some((a) => a.type === "not_shared_sw")).toBe(false);
    });

    it("does not trigger for medium-impact negative event", () => {
      const events = [
        makeEvent({
          impact: "medium",
          sentiment: "negative",
          shared_with_social_worker: false,
        }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      expect(alerts.some((a) => a.type === "not_shared_sw")).toBe(false);
    });

    it("does not trigger for low-impact negative event", () => {
      const events = [
        makeEvent({
          impact: "low",
          sentiment: "very_negative",
          shared_with_social_worker: false,
        }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      expect(alerts.some((a) => a.type === "not_shared_sw")).toBe(false);
    });

    it("does not trigger for high-impact positive event", () => {
      const events = [
        makeEvent({
          impact: "high",
          sentiment: "positive",
          shared_with_social_worker: false,
        }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      expect(alerts.some((a) => a.type === "not_shared_sw")).toBe(false);
    });

    it("does not trigger for high-impact neutral event", () => {
      const events = [
        makeEvent({
          impact: "high",
          sentiment: "neutral",
          shared_with_social_worker: false,
        }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      expect(alerts.some((a) => a.type === "not_shared_sw")).toBe(false);
    });

    it("includes event title and child_name in message", () => {
      const events = [
        makeEvent({
          impact: "high",
          sentiment: "negative",
          shared_with_social_worker: false,
          title: "Placement disruption",
          child_name: "Bob",
        }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      const found = alerts.find((a) => a.type === "not_shared_sw");
      expect(found!.message).toContain("Placement disruption");
      expect(found!.message).toContain("Bob");
    });

    it("uses the event id as alert id", () => {
      const events = [
        makeEvent({
          id: "evt-abc",
          impact: "high",
          sentiment: "negative",
          shared_with_social_worker: false,
        }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      const found = alerts.find((a) => a.type === "not_shared_sw");
      expect(found!.id).toBe("evt-abc");
    });

    it("generates multiple alerts for multiple qualifying events", () => {
      const events = [
        makeEvent({
          impact: "high",
          sentiment: "negative",
          shared_with_social_worker: false,
        }),
        makeEvent({
          impact: "high",
          sentiment: "very_negative",
          shared_with_social_worker: false,
        }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      const found = alerts.filter((a) => a.type === "not_shared_sw");
      expect(found).toHaveLength(2);
    });
  });

  // ── no_events_recorded ─────────────────────────────────────────────────

  describe("no_events_recorded alert", () => {
    it("triggers when totalChildren exceeds children with events", () => {
      const events = [makeEvent({ child_id: "c1" })];
      const alerts = identifyEventAlerts(events, 3, now);
      const found = alerts.find((a) => a.type === "no_events_recorded");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("medium");
    });

    it("reports correct gap count in message (singular)", () => {
      const events = [
        makeEvent({ child_id: "c1" }),
        makeEvent({ child_id: "c2" }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      const found = alerts.find((a) => a.type === "no_events_recorded");
      expect(found!.message).toContain("1 child has");
    });

    it("reports correct gap count in message (plural)", () => {
      const events = [makeEvent({ child_id: "c1" })];
      const alerts = identifyEventAlerts(events, 5, now);
      const found = alerts.find((a) => a.type === "no_events_recorded");
      expect(found!.message).toContain("4 children have");
    });

    it("does not trigger when all children have events", () => {
      const events = [
        makeEvent({ child_id: "c1" }),
        makeEvent({ child_id: "c2" }),
        makeEvent({ child_id: "c3" }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      expect(alerts.some((a) => a.type === "no_events_recorded")).toBe(false);
    });

    it("does not trigger when totalChildren is zero", () => {
      const alerts = identifyEventAlerts([], 0, now);
      expect(alerts.some((a) => a.type === "no_events_recorded")).toBe(false);
    });

    it("uses events_gap as the alert id", () => {
      const events = [makeEvent({ child_id: "c1" })];
      const alerts = identifyEventAlerts(events, 3, now);
      const found = alerts.find((a) => a.type === "no_events_recorded");
      expect(found!.id).toBe("events_gap");
    });
  });

  // ── bereavement_no_followup ────────────────────────────────────────────

  describe("bereavement_no_followup alert", () => {
    it("triggers for bereavement with empty follow-up actions", () => {
      const events = [
        makeEvent({
          category: "bereavement",
          follow_up_actions: [],
          child_name: "Charlie",
        }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      const found = alerts.find((a) => a.type === "bereavement_no_followup");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("high");
    });

    it("does not trigger for bereavement with follow-up actions", () => {
      const events = [
        makeEvent({
          category: "bereavement",
          follow_up_actions: ["Grief counselling referral"],
        }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      expect(alerts.some((a) => a.type === "bereavement_no_followup")).toBe(false);
    });

    it("does not trigger for non-bereavement with empty follow-up", () => {
      const events = [
        makeEvent({
          category: "achievement",
          follow_up_actions: [],
        }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      expect(alerts.some((a) => a.type === "bereavement_no_followup")).toBe(false);
    });

    it("includes child_name and event_date in message", () => {
      const events = [
        makeEvent({
          category: "bereavement",
          follow_up_actions: [],
          child_name: "Diana",
          event_date: "2026-04-20",
        }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      const found = alerts.find((a) => a.type === "bereavement_no_followup");
      expect(found!.message).toContain("Diana");
      expect(found!.message).toContain("2026-04-20");
    });

    it("uses event id as alert id", () => {
      const events = [
        makeEvent({
          id: "ber-1",
          category: "bereavement",
          follow_up_actions: [],
        }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      const found = alerts.find((a) => a.type === "bereavement_no_followup");
      expect(found!.id).toBe("ber-1");
    });

    it("generates alerts for multiple bereavements without follow-up", () => {
      const events = [
        makeEvent({ category: "bereavement", follow_up_actions: [] }),
        makeEvent({ category: "bereavement", follow_up_actions: [] }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      const found = alerts.filter((a) => a.type === "bereavement_no_followup");
      expect(found).toHaveLength(2);
    });
  });

  // ── negative_pattern ───────────────────────────────────────────────────

  describe("negative_pattern alert", () => {
    it("triggers when child has more negative than positive with >= 3 total", () => {
      const events = [
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "negative" }),
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "negative" }),
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "positive" }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      const found = alerts.find((a) => a.type === "negative_pattern");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("medium");
    });

    it("counts very_negative towards negative total", () => {
      const events = [
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "very_negative" }),
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "very_negative" }),
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "positive" }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      expect(alerts.some((a) => a.type === "negative_pattern")).toBe(true);
    });

    it("counts very_positive towards positive total", () => {
      const events = [
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "negative" }),
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "negative" }),
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "very_positive" }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      expect(alerts.some((a) => a.type === "negative_pattern")).toBe(true);
    });

    it("does not trigger when positive >= negative", () => {
      const events = [
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "negative" }),
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "positive" }),
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "positive" }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      expect(alerts.some((a) => a.type === "negative_pattern")).toBe(false);
    });

    it("does not trigger when equal positive and negative", () => {
      const events = [
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "negative" }),
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "positive" }),
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "negative" }),
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "positive" }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      expect(alerts.some((a) => a.type === "negative_pattern")).toBe(false);
    });

    it("does not trigger with fewer than 3 qualifying events", () => {
      const events = [
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "negative" }),
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "positive" }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      expect(alerts.some((a) => a.type === "negative_pattern")).toBe(false);
    });

    it("does not trigger for 2 negative + 0 positive (total < 3)", () => {
      const events = [
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "negative" }),
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "negative" }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      expect(alerts.some((a) => a.type === "negative_pattern")).toBe(false);
    });

    it("neutral events do not count towards positive or negative", () => {
      // 1 neg, 0 pos, 2 neutral => total pos+neg = 1, < 3, no alert
      const events = [
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "negative" }),
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "neutral" }),
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "neutral" }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      expect(alerts.some((a) => a.type === "negative_pattern")).toBe(false);
    });

    it("includes child name and counts in message", () => {
      const events = [
        makeEvent({ child_id: "c1", child_name: "Frank", sentiment: "negative" }),
        makeEvent({ child_id: "c1", child_name: "Frank", sentiment: "negative" }),
        makeEvent({ child_id: "c1", child_name: "Frank", sentiment: "very_negative" }),
        makeEvent({ child_id: "c1", child_name: "Frank", sentiment: "positive" }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      const found = alerts.find((a) => a.type === "negative_pattern");
      expect(found!.message).toContain("Frank");
      expect(found!.message).toContain("3");
      expect(found!.message).toContain("1");
    });

    it("uses pattern_{child_id} as alert id", () => {
      const events = [
        makeEvent({ child_id: "c-99", child_name: "Grace", sentiment: "negative" }),
        makeEvent({ child_id: "c-99", child_name: "Grace", sentiment: "negative" }),
        makeEvent({ child_id: "c-99", child_name: "Grace", sentiment: "positive" }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      const found = alerts.find((a) => a.type === "negative_pattern");
      expect(found!.id).toBe("pattern_c-99");
    });

    it("generates separate alerts for multiple children with negative patterns", () => {
      const events = [
        // Child A: 2 neg, 1 pos
        makeEvent({ child_id: "ca", child_name: "A", sentiment: "negative" }),
        makeEvent({ child_id: "ca", child_name: "A", sentiment: "negative" }),
        makeEvent({ child_id: "ca", child_name: "A", sentiment: "positive" }),
        // Child B: 3 neg, 1 pos
        makeEvent({ child_id: "cb", child_name: "B", sentiment: "very_negative" }),
        makeEvent({ child_id: "cb", child_name: "B", sentiment: "negative" }),
        makeEvent({ child_id: "cb", child_name: "B", sentiment: "negative" }),
        makeEvent({ child_id: "cb", child_name: "B", sentiment: "very_positive" }),
      ];
      const alerts = identifyEventAlerts(events, 5, now);
      const found = alerts.filter((a) => a.type === "negative_pattern");
      expect(found).toHaveLength(2);
    });

    it("does not trigger for child with only neutral events", () => {
      const events = [
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "neutral" }),
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "neutral" }),
        makeEvent({ child_id: "c1", child_name: "Eve", sentiment: "neutral" }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      expect(alerts.some((a) => a.type === "negative_pattern")).toBe(false);
    });
  });

  // ── Clean state (no alerts) ────────────────────────────────────────────

  describe("no alerts when clean", () => {
    it("returns empty array when no events and zero children", () => {
      const alerts = identifyEventAlerts([], 0, now);
      expect(alerts).toEqual([]);
    });

    it("returns empty array when all conditions are met", () => {
      const events = [
        makeEvent({
          child_id: "c1",
          child_name: "Alice",
          sentiment: "positive",
          impact: "medium",
          category: "achievement",
          shared_with_social_worker: true,
          follow_up_actions: [],
        }),
        makeEvent({
          child_id: "c2",
          child_name: "Bob",
          sentiment: "very_positive",
          impact: "low",
          category: "birthday",
          shared_with_social_worker: true,
          follow_up_actions: [],
        }),
        makeEvent({
          child_id: "c3",
          child_name: "Charlie",
          sentiment: "positive",
          impact: "medium",
          category: "education_milestone",
          shared_with_social_worker: true,
          follow_up_actions: [],
        }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      expect(alerts).toEqual([]);
    });

    it("returns empty array for single positive event matching totalChildren", () => {
      const events = [
        makeEvent({
          child_id: "c1",
          sentiment: "positive",
          impact: "low",
          shared_with_social_worker: true,
        }),
      ];
      const alerts = identifyEventAlerts(events, 1, now);
      expect(alerts).toHaveLength(0);
    });

    it("works without explicit now parameter", () => {
      const events = [
        makeEvent({
          child_id: "c1",
          sentiment: "positive",
          impact: "low",
          shared_with_social_worker: true,
        }),
      ];
      const alerts = identifyEventAlerts(events, 1);
      expect(alerts).toHaveLength(0);
    });
  });

  // ── Combined alerts ────────────────────────────────────────────────────

  describe("combined alerts", () => {
    it("can fire multiple alert types simultaneously", () => {
      const events = [
        // not_shared_sw
        makeEvent({
          child_id: "c1",
          child_name: "Alice",
          impact: "high",
          sentiment: "negative",
          shared_with_social_worker: false,
          category: "placement_change",
          follow_up_actions: [],
        }),
        // bereavement_no_followup
        makeEvent({
          child_id: "c1",
          child_name: "Alice",
          category: "bereavement",
          follow_up_actions: [],
          sentiment: "very_negative",
          impact: "high",
          shared_with_social_worker: false,
        }),
        // negative_pattern (c1 will have 2 neg + need 1 more)
        makeEvent({
          child_id: "c1",
          child_name: "Alice",
          sentiment: "negative",
          impact: "low",
          shared_with_social_worker: true,
          category: "other",
          follow_up_actions: [],
        }),
      ];
      // totalChildren = 5 => 4 without events => no_events_recorded
      const alerts = identifyEventAlerts(events, 5, now);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("not_shared_sw");
      expect(types).toContain("bereavement_no_followup");
      expect(types).toContain("no_events_recorded");
      expect(types).toContain("negative_pattern");
    });

    it("returns correct total count for overlapping alerts", () => {
      const events = [
        makeEvent({
          child_id: "c1",
          child_name: "Alice",
          impact: "high",
          sentiment: "negative",
          shared_with_social_worker: false,
          category: "bereavement",
          follow_up_actions: [],
        }),
        makeEvent({
          child_id: "c1",
          child_name: "Alice",
          sentiment: "negative",
          impact: "medium",
          shared_with_social_worker: true,
          follow_up_actions: [],
        }),
        makeEvent({
          child_id: "c1",
          child_name: "Alice",
          sentiment: "positive",
          impact: "low",
          shared_with_social_worker: true,
          follow_up_actions: [],
        }),
      ];
      const alerts = identifyEventAlerts(events, 3, now);
      // not_shared_sw (1), bereavement_no_followup (1), no_events_recorded (1), negative_pattern (1)
      expect(alerts.length).toBeGreaterThanOrEqual(3);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. CRUD fallback (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

describe("CRUD fallback (Supabase disabled)", () => {
  it("listEvents returns ok:true with empty array", async () => {
    const { listEvents } = await import("../significant-events-service");
    const result = await listEvents("home-1");
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("listEvents returns ok:true with filters", async () => {
    const { listEvents } = await import("../significant-events-service");
    const result = await listEvents("home-1", {
      childId: "c1",
      category: "achievement",
      sentiment: "positive",
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      limit: 50,
    });
    expect(result).toEqual({ ok: true, data: [] });
  });

  it("createEvent returns ok:false with error message", async () => {
    const { createEvent } = await import("../significant-events-service");
    const result = await createEvent({
      homeId: "home-1",
      childName: "Alice",
      childId: "c1",
      eventDate: "2026-05-01",
      category: "achievement",
      title: "Test",
      description: "A test event",
      sentiment: "positive",
      impact: "medium",
      recordedBy: "staff-1",
      followUpActions: [],
      sharedWithFamily: false,
      sharedWithSocialWorker: false,
      addedToLifeStory: false,
      photosAttached: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateEvent returns ok:false with error message", async () => {
    const { updateEvent } = await import("../significant-events-service");
    const result = await updateEvent("some-id", { title: "Updated" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Edge cases
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  describe("empty follow_up_actions arrays", () => {
    it("handles event with empty follow_up_actions array in metrics", () => {
      const events = [makeEvent({ follow_up_actions: [] })];
      const m = computeEventMetrics(events, 3, now);
      expect(m.total_events).toBe(1);
      expect(m.follow_ups_pending).toBe(0);
    });

    it("handles event with populated follow_up_actions array in metrics", () => {
      const events = [makeEvent({ follow_up_actions: ["action-1", "action-2"] })];
      const m = computeEventMetrics(events, 3, now);
      expect(m.total_events).toBe(1);
      expect(m.follow_ups_pending).toBe(1);
    });
  });

  describe("default now parameter", () => {
    it("computeEventMetrics works without explicit now", () => {
      const events = [makeEvent({ event_date: new Date().toISOString().split("T")[0] })];
      const m = computeEventMetrics(events, 3);
      expect(m.total_events).toBe(1);
    });

    it("identifyEventAlerts works without explicit now", () => {
      const events = [
        makeEvent({
          impact: "high",
          sentiment: "negative",
          shared_with_social_worker: false,
        }),
      ];
      const alerts = identifyEventAlerts(events, 3);
      expect(alerts.some((a) => a.type === "not_shared_sw")).toBe(true);
    });
  });

  describe("totalChildren zero", () => {
    it("computeEventMetrics returns 0 coverage with zero children", () => {
      const events = [makeEvent()];
      const m = computeEventMetrics(events, 0, now);
      expect(m.event_coverage).toBe(0);
    });

    it("identifyEventAlerts does not fire no_events_recorded for zero children", () => {
      const alerts = identifyEventAlerts([], 0, now);
      expect(alerts.some((a) => a.type === "no_events_recorded")).toBe(false);
    });
  });

  describe("large datasets", () => {
    it("handles 100 events without error", () => {
      const events = Array.from({ length: 100 }, (_, i) =>
        makeEvent({
          child_id: `c${i % 10}`,
          child_name: `Child ${i % 10}`,
          event_date: daysAgo(i % 60),
          sentiment: i % 3 === 0 ? "positive" : i % 3 === 1 ? "neutral" : "negative",
          category: i % 2 === 0 ? "achievement" : "birthday",
          impact: i % 4 === 0 ? "high" : "medium",
        }),
      );
      const m = computeEventMetrics(events, 10, now);
      expect(m.total_events).toBe(100);
      expect(m.children_with_events).toBe(10);
    });
  });

  describe("duplicate child events", () => {
    it("counts unique children correctly when same child has many events", () => {
      const events = eventsForChild("c1", "Alice", 10);
      const m = computeEventMetrics(events, 5, now);
      expect(m.children_with_events).toBe(1);
    });

    it("by_child sums all events for same child name", () => {
      const events = eventsForChild("c1", "Alice", 7);
      const m = computeEventMetrics(events, 5, now);
      expect(m.by_child["Alice"]).toBe(7);
    });
  });

  describe("all categories represented", () => {
    it("by_category contains an entry for each unique category in events", () => {
      const categories: EventCategory[] = [
        "achievement", "birthday", "education_milestone", "health_milestone",
        "family_contact", "placement_change", "court_hearing", "review_meeting",
        "therapy_breakthrough", "behavioural_progress", "life_skill_gained",
        "community_involvement", "religious_cultural", "transition",
        "bereavement", "other",
      ];
      const events = categories.map((cat) => makeEvent({ category: cat }));
      const m = computeEventMetrics(events, 5, now);
      expect(Object.keys(m.by_category).sort()).toEqual([...categories].sort());
    });
  });

  describe("all sentiments represented", () => {
    it("by_sentiment contains an entry for each unique sentiment in events", () => {
      const sentiments: EventSentiment[] = [
        "very_positive", "positive", "neutral", "negative", "very_negative",
      ];
      const events = sentiments.map((s) => makeEvent({ sentiment: s }));
      const m = computeEventMetrics(events, 5, now);
      expect(Object.keys(m.by_sentiment).sort()).toEqual([...sentiments].sort());
    });
  });

  describe("all impacts represented", () => {
    it("by_impact contains an entry for each unique impact in events", () => {
      const impacts: EventImpact[] = ["high", "medium", "low"];
      const events = impacts.map((imp) => makeEvent({ impact: imp }));
      const m = computeEventMetrics(events, 5, now);
      expect(Object.keys(m.by_impact).sort()).toEqual([...impacts].sort());
    });
  });

  describe("boolean field combinations", () => {
    it("event with all boolean fields true affects all rates", () => {
      const events = [
        makeEvent({
          shared_with_family: true,
          shared_with_social_worker: true,
          added_to_life_story: true,
          photos_attached: true,
          child_views: "I liked it",
        }),
      ];
      const m = computeEventMetrics(events, 1, now);
      expect(m.shared_with_family_rate).toBe(100);
      expect(m.added_to_life_story_rate).toBe(100);
      expect(m.child_views_recorded_rate).toBe(100);
    });

    it("event with all boolean fields false results in zero rates", () => {
      const events = [
        makeEvent({
          shared_with_family: false,
          shared_with_social_worker: false,
          added_to_life_story: false,
          photos_attached: false,
          child_views: null,
        }),
      ];
      const m = computeEventMetrics(events, 1, now);
      expect(m.shared_with_family_rate).toBe(0);
      expect(m.added_to_life_story_rate).toBe(0);
      expect(m.child_views_recorded_rate).toBe(0);
    });
  });

  describe("rate rounding precision", () => {
    it("child_views_recorded_rate rounds to one decimal", () => {
      const events = [
        makeEvent({ child_views: "View" }),
        makeEvent({ child_views: null }),
        makeEvent({ child_views: null }),
      ];
      const m = computeEventMetrics(events, 3, now);
      // 1/3 * 100 = 33.333... => 33.3
      expect(m.child_views_recorded_rate).toBe(33.3);
    });

    it("shared_with_family_rate rounds to one decimal", () => {
      const events = [
        makeEvent({ shared_with_family: true }),
        makeEvent({ shared_with_family: false }),
        makeEvent({ shared_with_family: false }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.shared_with_family_rate).toBe(33.3);
    });

    it("added_to_life_story_rate rounds to one decimal", () => {
      const events = [
        makeEvent({ added_to_life_story: true }),
        makeEvent({ added_to_life_story: false }),
        makeEvent({ added_to_life_story: false }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.added_to_life_story_rate).toBe(33.3);
    });

    it("event_coverage rounds to one decimal", () => {
      const events = [makeEvent({ child_id: "c1" })];
      const m = computeEventMetrics(events, 3, now);
      // 1/3 * 100 = 33.333... => 33.3
      expect(m.event_coverage).toBe(33.3);
    });

    it("positive_ratio rounds to one decimal", () => {
      const events = [
        makeEvent({ sentiment: "positive" }),
        makeEvent({ sentiment: "neutral" }),
        makeEvent({ sentiment: "neutral" }),
      ];
      const m = computeEventMetrics(events, 3, now);
      expect(m.positive_ratio).toBe(33.3);
    });
  });
});
