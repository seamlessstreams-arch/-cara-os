import { describe, it, expect } from "vitest";
import {
  computeEventMetrics,
  identifyEventAlerts,
  type SignificantEvent,
} from "./significant-events-service";

function makeEvent(
  overrides: Partial<SignificantEvent> = {},
): SignificantEvent {
  return {
    id: overrides.id ?? "ev-1",
    home_id: "home-1",
    child_name: "Child A",
    child_id: "child-1",
    event_date: "2025-06-01",
    category: "achievement",
    title: "Test Event",
    description: "A test event",
    sentiment: "positive",
    impact: "medium",
    recorded_by: "Staff",
    child_views: "Happy",
    follow_up_actions: [],
    shared_with_family: true,
    shared_with_social_worker: true,
    added_to_life_story: true,
    photos_attached: false,
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2025-06-01T00:00:00Z",
    ...overrides,
  };
}

// ── Metrics ──────────────────────────────────────────────────────────────

describe("computeEventMetrics", () => {
  const now = new Date("2025-06-15T12:00:00Z");

  it("returns zeroes for empty array", () => {
    const m = computeEventMetrics([], 5, now);
    expect(m.total_events).toBe(0);
    expect(m.events_this_month).toBe(0);
    expect(m.positive_events).toBe(0);
    expect(m.negative_events).toBe(0);
    expect(m.positive_ratio).toBeNull();;
    expect(m.achievements).toBe(0);
    expect(m.children_with_events).toBe(0);
    expect(m.event_coverage).toBe(0);
    expect(m.child_views_recorded_rate).toBeNull();;
  });

  it("counts positive and negative events", () => {
    const events = [
      makeEvent({ sentiment: "very_positive" }),
      makeEvent({ sentiment: "positive" }),
      makeEvent({ sentiment: "neutral" }),
      makeEvent({ sentiment: "negative" }),
      makeEvent({ sentiment: "very_negative" }),
    ];
    const m = computeEventMetrics(events, 3, now);
    expect(m.positive_events).toBe(2);
    expect(m.negative_events).toBe(2);
    expect(m.positive_ratio).toBe(40);
  });

  it("counts events this month within 30-day window", () => {
    const events = [
      makeEvent({ event_date: "2025-06-10" }), // within
      makeEvent({ event_date: "2025-05-20" }), // within (15 days + 30 days back)
      makeEvent({ event_date: "2025-04-01" }), // outside
    ];
    const m = computeEventMetrics(events, 3, now);
    expect(m.events_this_month).toBe(2);
  });

  it("computes event coverage as percentage of totalChildren", () => {
    const events = [
      makeEvent({ child_id: "c1" }),
      makeEvent({ child_id: "c1" }),
      makeEvent({ child_id: "c2" }),
    ];
    const m = computeEventMetrics(events, 4, now);
    expect(m.children_with_events).toBe(2);
    expect(m.event_coverage).toBe(50);
  });

  it("counts achievements and high impact", () => {
    const events = [
      makeEvent({ category: "achievement", impact: "high" }),
      makeEvent({ category: "birthday", impact: "high" }),
      makeEvent({ category: "achievement", impact: "low" }),
    ];
    const m = computeEventMetrics(events, 2, now);
    expect(m.achievements).toBe(2);
    expect(m.high_impact_count).toBe(2);
  });

  it("computes child_views_recorded_rate (null = not recorded)", () => {
    const events = [
      makeEvent({ child_views: "Great" }),
      makeEvent({ child_views: null }),
    ];
    const m = computeEventMetrics(events, 2, now);
    expect(m.child_views_recorded_rate).toBe(50);
  });

  it("computes shared_with_family_rate and added_to_life_story_rate", () => {
    const events = [
      makeEvent({ shared_with_family: true, added_to_life_story: false }),
      makeEvent({ shared_with_family: false, added_to_life_story: false }),
    ];
    const m = computeEventMetrics(events, 2, now);
    expect(m.shared_with_family_rate).toBe(50);
    expect(m.added_to_life_story_rate).toBe(0);
  });
});

// ── Alerts ───────────────────────────────────────────────────────────────

describe("identifyEventAlerts", () => {
  const now = new Date("2025-06-15T12:00:00Z");

  it("returns no alerts for empty array", () => {
    expect(identifyEventAlerts([], 0, now)).toEqual([]);
  });

  it("fires high alert for high-impact negative event not shared with SW", () => {
    const ev = makeEvent({
      impact: "high",
      sentiment: "negative",
      shared_with_social_worker: false,
    });
    const alerts = identifyEventAlerts([ev], 1, now);
    expect(alerts.some((a) => a.type === "not_shared_sw" && a.severity === "high")).toBe(true);
  });

  it("does NOT fire not_shared_sw for low-impact negative event", () => {
    const ev = makeEvent({
      impact: "low",
      sentiment: "negative",
      shared_with_social_worker: false,
    });
    const alerts = identifyEventAlerts([ev], 1, now);
    expect(alerts.some((a) => a.type === "not_shared_sw")).toBe(false);
  });

  it("fires medium alert when some children have no events", () => {
    const ev = makeEvent({ child_id: "c1" });
    const alerts = identifyEventAlerts([ev], 3, now);
    expect(alerts.some((a) => a.type === "no_events_recorded" && a.severity === "medium")).toBe(true);
  });

  it("fires high alert for bereavement without follow-up", () => {
    const ev = makeEvent({ category: "bereavement", follow_up_actions: [] });
    const alerts = identifyEventAlerts([ev], 1, now);
    expect(alerts.some((a) => a.type === "bereavement_no_followup" && a.severity === "high")).toBe(true);
  });

  it("does NOT fire bereavement alert if follow-up exists", () => {
    const ev = makeEvent({ category: "bereavement", follow_up_actions: ["Support session"] });
    const alerts = identifyEventAlerts([ev], 1, now);
    expect(alerts.some((a) => a.type === "bereavement_no_followup")).toBe(false);
  });

  it("fires medium alert for negative pattern (>= 3 events, negative > positive)", () => {
    const events = [
      makeEvent({ child_id: "c1", sentiment: "negative" }),
      makeEvent({ child_id: "c1", sentiment: "negative" }),
      makeEvent({ child_id: "c1", sentiment: "very_negative" }),
      makeEvent({ child_id: "c1", sentiment: "positive" }),
    ];
    const alerts = identifyEventAlerts(events, 1, now);
    expect(alerts.some((a) => a.type === "negative_pattern")).toBe(true);
  });
});
