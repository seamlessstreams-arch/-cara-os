// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME NOTIFIABLE EVENTS INTELLIGENCE ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeNotifiableEvents,
  type HomeNotifiableEventsInput,
  type NotifiableEventInput,
} from "../home-notifiable-events-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeEvent(overrides: Partial<NotifiableEventInput> = {}): NotifiableEventInput {
  return {
    id: "ne_1",
    date: "2026-05-20",
    event_type: "restraint",
    child_id: "yp_alex",
    ofsted_status: "notified_within_24h",
    has_ofsted_notification: true,
    has_la_notification: true,
    has_placing_notification: true,
    has_follow_up: true,
    has_lesson_learned: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeNotifiableEventsInput> = {}): HomeNotifiableEventsInput {
  return {
    today: "2026-05-26",
    total_children: 3,
    child_ids: ["yp_alex", "yp_jordan", "yp_casey"],
    events: [
      makeEvent({ id: "e1", date: "2026-05-20", child_id: "yp_alex", event_type: "restraint" }),
      makeEvent({ id: "e2", date: "2026-05-10", child_id: "yp_jordan", event_type: "absconding" }),
    ],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Notifiable Events Intelligence Engine", () => {

  // ── Structure ─────────────────────────────────────────────────────────────

  it("returns a well-shaped result", () => {
    const r = computeHomeNotifiableEvents(baseInput());
    expect(r).toHaveProperty("events_rating");
    expect(r).toHaveProperty("events_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("events_profile");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("assigns a valid rating", () => {
    const r = computeHomeNotifiableEvents(baseInput());
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.events_rating);
  });

  it("scores between 0 and 100", () => {
    const r = computeHomeNotifiableEvents(baseInput());
    expect(r.events_score).toBeGreaterThanOrEqual(0);
    expect(r.events_score).toBeLessThanOrEqual(100);
  });

  // ── Zero Events ───────────────────────────────────────────────────────────

  it("reports insufficient data when nothing has ever been recorded", () => {
    const r = computeHomeNotifiableEvents(baseInput({ events: [] }));
    expect(r.events_rating).toBe("insufficient_data");
    expect(r.events_score).toBe(0);
  });

  it("does not claim a strength from an empty register", () => {
    const r = computeHomeNotifiableEvents(baseInput({ events: [] }));
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns.length).toBeGreaterThan(0);
    expect(r.headline.toLowerCase()).toContain("cannot be evidenced");
  });

  it("rates outstanding when events are recorded but none fall in the window", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: [makeEvent({ id: "old", date: "2026-01-01" })],
    }));
    expect(r.events_rating).toBe("outstanding");
    expect(r.events_score).toBe(90);
    expect(r.headline.toLowerCase()).toContain("excellent");
  });

  it("excludes events outside 90 days", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: [makeEvent({ id: "e1", date: "2026-01-01" })],
    }));
    expect(r.events_rating).toBe("outstanding");
    expect(r.events_profile.total_events_90d).toBe(0);
  });

  // ── Events Profile ────────────────────────────────────────────────────────

  it("counts events in 90-day window", () => {
    const r = computeHomeNotifiableEvents(baseInput());
    expect(r.events_profile.total_events_90d).toBe(2);
  });

  it("counts event types", () => {
    const r = computeHomeNotifiableEvents(baseInput());
    expect(r.events_profile.event_types["restraint"]).toBe(1);
    expect(r.events_profile.event_types["absconding"]).toBe(1);
  });

  it("calculates notification compliance rate", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: [
        makeEvent({ id: "e1", ofsted_status: "notified_within_24h" }),
        makeEvent({ id: "e2", ofsted_status: "pending", has_ofsted_notification: false }),
      ],
    }));
    expect(r.events_profile.notification_compliance_rate).toBe(50);
  });

  it("counts pending notifications", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: [
        makeEvent({ id: "e1", ofsted_status: "pending" }),
        makeEvent({ id: "e2", ofsted_status: "notified_within_24h" }),
      ],
    }));
    expect(r.events_profile.pending_count).toBe(1);
  });

  it("calculates follow-up rate", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: [
        makeEvent({ id: "e1", has_follow_up: true }),
        makeEvent({ id: "e2", has_follow_up: false }),
      ],
    }));
    expect(r.events_profile.follow_up_rate).toBe(50);
  });

  it("calculates lesson learned rate", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: [
        makeEvent({ id: "e1", has_lesson_learned: true }),
        makeEvent({ id: "e2", has_lesson_learned: false }),
      ],
    }));
    expect(r.events_profile.lesson_learned_rate).toBe(50);
  });

  it("calculates multi-agency rate", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: [
        makeEvent({ id: "e1", has_ofsted_notification: true, has_la_notification: true }),
        makeEvent({ id: "e2", has_ofsted_notification: false, ofsted_status: "pending", has_la_notification: false }),
      ],
    }));
    expect(r.events_profile.multi_agency_rate).toBe(50);
  });

  it("identifies children involved", () => {
    const r = computeHomeNotifiableEvents(baseInput());
    expect(r.events_profile.children_involved).toEqual(
      expect.arrayContaining(["yp_alex", "yp_jordan"]),
    );
  });

  it("excludes null child_id from children involved", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: [
        makeEvent({ id: "e1", child_id: "yp_alex" }),
        makeEvent({ id: "e2", child_id: null, event_type: "allegation_against_staff" }),
      ],
    }));
    expect(r.events_profile.children_involved).toEqual(["yp_alex"]);
  });

  it("detects repeat children", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: [
        makeEvent({ id: "e1", child_id: "yp_alex" }),
        makeEvent({ id: "e2", child_id: "yp_alex", event_type: "absconding" }),
        makeEvent({ id: "e3", child_id: "yp_jordan" }),
      ],
    }));
    expect(r.events_profile.repeat_children).toEqual(["yp_alex"]);
  });

  // ── Rating Boundaries ─────────────────────────────────────────────────────

  it("rates outstanding (score >= 80)", () => {
    // Low volume, perfect compliance
    const r = computeHomeNotifiableEvents(baseInput());
    expect(r.events_score).toBeGreaterThanOrEqual(80);
    expect(r.events_rating).toBe("outstanding");
  });

  it("rates good (65 <= score < 80)", () => {
    // Low volume, all notified, one repeat child, one missing lesson
    const r = computeHomeNotifiableEvents(baseInput({
      events: [
        makeEvent({ id: "e1", child_id: "yp_alex" }),
        makeEvent({ id: "e2", child_id: "yp_alex", event_type: "absconding", has_lesson_learned: false }),
        makeEvent({ id: "e3", child_id: "yp_jordan" }),
      ],
    }));
    expect(r.events_score).toBeGreaterThanOrEqual(65);
    expect(r.events_score).toBeLessThan(80);
    expect(r.events_rating).toBe("good");
  });

  it("rates adequate (45 <= score < 65)", () => {
    // Pending notification, missing lessons, but follow-ups complete
    const r = computeHomeNotifiableEvents(baseInput({
      events: [
        makeEvent({ id: "e1", child_id: "yp_alex", ofsted_status: "pending", has_ofsted_notification: false, has_lesson_learned: false }),
        makeEvent({ id: "e2", child_id: "yp_jordan" }),
        makeEvent({ id: "e3", child_id: "yp_casey", has_lesson_learned: false }),
      ],
    }));
    expect(r.events_score).toBeGreaterThanOrEqual(45);
    expect(r.events_score).toBeLessThan(65);
    expect(r.events_rating).toBe("adequate");
  });

  it("rates inadequate (score < 45)", () => {
    // Many events, poor compliance, missing follow-ups
    const r = computeHomeNotifiableEvents(baseInput({
      events: [
        makeEvent({ id: "e1", child_id: "yp_alex", ofsted_status: "pending", has_ofsted_notification: false, has_la_notification: false, has_follow_up: false, has_lesson_learned: false }),
        makeEvent({ id: "e2", child_id: "yp_alex", ofsted_status: "pending", has_ofsted_notification: false, has_la_notification: false, has_follow_up: false, has_lesson_learned: false }),
        makeEvent({ id: "e3", child_id: "yp_jordan", ofsted_status: "pending", has_ofsted_notification: false, has_la_notification: false, has_follow_up: false, has_lesson_learned: false }),
        makeEvent({ id: "e4", child_id: "yp_casey", ofsted_status: "pending", has_ofsted_notification: false, has_la_notification: false, has_follow_up: false, has_lesson_learned: false }),
        makeEvent({ id: "e5", child_id: "yp_alex", ofsted_status: "pending", has_ofsted_notification: false, has_la_notification: false, has_follow_up: false, has_lesson_learned: false }),
        makeEvent({ id: "e6", child_id: "yp_jordan", ofsted_status: "pending", has_ofsted_notification: false, has_la_notification: false, has_follow_up: false, has_lesson_learned: false }),
      ],
    }));
    expect(r.events_score).toBeLessThan(45);
    expect(r.events_rating).toBe("inadequate");
  });

  // ── Scoring Modifiers ─────────────────────────────────────────────────────

  it("penalises pending notifications", () => {
    const noPending = computeHomeNotifiableEvents(baseInput({
      events: [makeEvent({ id: "e1", ofsted_status: "notified_within_24h" })],
    }));
    const withPending = computeHomeNotifiableEvents(baseInput({
      events: [makeEvent({ id: "e1", ofsted_status: "pending", has_ofsted_notification: false })],
    }));
    expect(withPending.events_score).toBeLessThan(noPending.events_score);
  });

  it("rewards full follow-up", () => {
    const complete = computeHomeNotifiableEvents(baseInput({
      events: [makeEvent({ id: "e1", has_follow_up: true })],
    }));
    const incomplete = computeHomeNotifiableEvents(baseInput({
      events: [makeEvent({ id: "e1", has_follow_up: false })],
    }));
    expect(complete.events_score).toBeGreaterThan(incomplete.events_score);
  });

  it("rewards lessons learned", () => {
    const withLessons = computeHomeNotifiableEvents(baseInput({
      events: [makeEvent({ id: "e1", has_lesson_learned: true })],
    }));
    const noLessons = computeHomeNotifiableEvents(baseInput({
      events: [makeEvent({ id: "e1", has_lesson_learned: false })],
    }));
    expect(withLessons.events_score).toBeGreaterThan(noLessons.events_score);
  });

  it("penalises high event volume", () => {
    const low = computeHomeNotifiableEvents(baseInput({
      events: [makeEvent({ id: "e1" })],
    }));
    const high = computeHomeNotifiableEvents(baseInput({
      events: Array.from({ length: 7 }, (_, i) =>
        makeEvent({ id: `e${i}`, child_id: `yp_c${i}` }),
      ),
    }));
    expect(high.events_score).toBeLessThan(low.events_score);
  });

  // ── Strengths ─────────────────────────────────────────────────────────────

  it("notes strength for notification compliance", () => {
    const r = computeHomeNotifiableEvents(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("24 hours") || s.toLowerCase().includes("compliance"))).toBe(true);
  });

  it("notes strength for follow-up documentation", () => {
    const r = computeHomeNotifiableEvents(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("follow-up") || s.toLowerCase().includes("follow up"))).toBe(true);
  });

  it("notes strength for lessons learned", () => {
    const r = computeHomeNotifiableEvents(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("lesson"))).toBe(true);
  });

  it("notes strength for low volume", () => {
    const r = computeHomeNotifiableEvents(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("2") || s.toLowerCase().includes("low"))).toBe(true);
  });

  // ── Concerns ──────────────────────────────────────────────────────────────

  it("raises concern for pending notifications", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: [makeEvent({ id: "e1", ofsted_status: "pending" })],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("pending"))).toBe(true);
  });

  it("raises concern for repeat children", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: [
        makeEvent({ id: "e1", child_id: "yp_alex" }),
        makeEvent({ id: "e2", child_id: "yp_alex" }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("multiple") || c.toLowerCase().includes("pattern"))).toBe(true);
  });

  it("raises concern for high volume", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: Array.from({ length: 7 }, (_, i) =>
        makeEvent({ id: `e${i}`, child_id: `yp_c${i}` }),
      ),
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("volume") || c.toLowerCase().includes("7"))).toBe(true);
  });

  // ── Recommendations ───────────────────────────────────────────────────────

  it("recommends submitting pending notifications", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: [makeEvent({ id: "e1", ofsted_status: "pending" })],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.toLowerCase().includes("pending") && rec.urgency === "immediate")).toBe(true);
  });

  it("recommends pattern analysis for repeat children", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: [
        makeEvent({ id: "e1", child_id: "yp_alex" }),
        makeEvent({ id: "e2", child_id: "yp_alex" }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.toLowerCase().includes("pattern"))).toBe(true);
  });

  it("recommendations have ranked order", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: [
        makeEvent({ id: "e1", ofsted_status: "pending", has_follow_up: false, has_lesson_learned: false }),
        makeEvent({ id: "e2", ofsted_status: "pending", has_follow_up: false }),
      ],
    }));
    const ranks = r.recommendations.map(rec => rec.rank);
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThan(ranks[i - 1]);
    }
  });

  // ── Insights ──────────────────────────────────────────────────────────────

  it("generates critical insight for pending notifications", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: [makeEvent({ id: "e1", ofsted_status: "pending" })],
    }));
    expect(r.insights.some(i => i.severity === "critical" && i.text.toLowerCase().includes("pending"))).toBe(true);
  });

  it("generates positive insight for perfect compliance", () => {
    const r = computeHomeNotifiableEvents(baseInput());
    expect(r.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("compliance"))).toBe(true);
  });

  it("generates positive insight for lessons learned", () => {
    const r = computeHomeNotifiableEvents(baseInput());
    expect(r.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("lesson"))).toBe(true);
  });

  it("generates warning for repeat children", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: [
        makeEvent({ id: "e1", child_id: "yp_alex" }),
        makeEvent({ id: "e2", child_id: "yp_alex" }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "warning" && i.text.toLowerCase().includes("multiple"))).toBe(true);
  });

  // ── Headlines ─────────────────────────────────────────────────────────────

  it("outstanding headline mentions outstanding", () => {
    const r = computeHomeNotifiableEvents(baseInput());
    expect(r.headline.toLowerCase()).toContain("outstanding");
  });

  it("inadequate headline mentions inadequate", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: Array.from({ length: 7 }, (_, i) =>
        makeEvent({ id: `e${i}`, child_id: `yp_c${i}`, ofsted_status: "pending", has_ofsted_notification: false, has_la_notification: false, has_follow_up: false, has_lesson_learned: false }),
      ),
    }));
    expect(r.headline.toLowerCase()).toContain("inadequate");
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  it("clamps score to minimum 0", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: Array.from({ length: 10 }, (_, i) =>
        makeEvent({ id: `e${i}`, child_id: `yp_c${i % 3}`, ofsted_status: "pending", has_ofsted_notification: false, has_la_notification: false, has_follow_up: false, has_lesson_learned: false }),
      ),
    }));
    expect(r.events_score).toBeGreaterThanOrEqual(0);
  });

  it("clamps score to maximum 100", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: [makeEvent({ id: "e1" })],
    }));
    expect(r.events_score).toBeLessThanOrEqual(100);
  });

  it("handles events with not_required ofsted status", () => {
    const r = computeHomeNotifiableEvents(baseInput({
      events: [
        makeEvent({ id: "e1", ofsted_status: "not_required" }),
      ],
    }));
    // not_required excluded from compliance calculation — nothing left to rate
    expect(r.events_profile.notification_compliance_rate).toBeNull();
  });
});
