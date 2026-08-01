import { describe, it, expect } from "vitest";
import {
  computeKeyworkerSessionMetrics,
  identifyKeyworkerSessionAlerts,
  type KeyworkerSessionRecord,
} from "./keyworker-sessions-service";

function makeRecord(overrides: Partial<KeyworkerSessionRecord> = {}): KeyworkerSessionRecord {
  return {
    id: "ks-1",
    home_id: "home-1",
    session_focus: "emotional_check_in",
    session_quality: "good",
    child_mood: "positive",
    session_location: "in_home",
    session_date: "2026-05-01",
    child_name: "Alice",
    child_id: "child-1",
    keyworker_name: "Jane Smith",
    child_led: true,
    targets_reviewed: true,
    wishes_feelings_recorded: true,
    advocacy_provided: false,
    care_plan_discussed: false,
    safety_discussed: false,
    achievements_celebrated: true,
    worries_explored: true,
    next_steps_agreed: true,
    session_recorded: true,
    child_signed: false,
    social_worker_updated: false,
    issues_found: [],
    actions_taken: [],
    session_duration_minutes: 30,
    next_session_date: null,
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeKeyworkerSessionMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeKeyworkerSessionMetrics([]);
    expect(m.total_sessions).toBe(0);
    expect(m.excellent_count).toBe(0);
    expect(m.good_count).toBe(0);
    expect(m.poor_count).toBe(0);
    expect(m.distressed_count).toBe(0);
    expect(m.child_led_rate).toBeNull();;
    expect(m.average_duration).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("computes correct counts and rates for populated data", () => {
    const records = [
      makeRecord({ id: "1", session_quality: "excellent", child_mood: "very_positive", child_name: "Alice", session_focus: "emotional_check_in", session_location: "in_home", session_duration_minutes: 20 }),
      makeRecord({ id: "2", session_quality: "good", child_mood: "positive", child_name: "Bob", session_focus: "care_plan_review", session_location: "community", session_duration_minutes: 40 }),
      makeRecord({ id: "3", session_quality: "poor", child_mood: "distressed", child_name: "Alice", session_focus: "emotional_check_in", session_location: "in_home", session_duration_minutes: 30, child_led: false }),
    ];

    const m = computeKeyworkerSessionMetrics(records);
    expect(m.total_sessions).toBe(3);
    expect(m.excellent_count).toBe(1);
    expect(m.good_count).toBe(1);
    expect(m.poor_count).toBe(1);
    expect(m.distressed_count).toBe(1);
    expect(m.unique_children).toBe(2);
    expect(m.average_duration).toBe(30);
    // child_led: 2 out of 3 = 66.7%
    expect(m.child_led_rate).toBe(66.7);
    expect(m.by_session_focus).toEqual({ emotional_check_in: 2, care_plan_review: 1 });
    expect(m.by_session_quality).toEqual({ excellent: 1, good: 1, poor: 1 });
    expect(m.by_child_mood).toEqual({ very_positive: 1, positive: 1, distressed: 1 });
    expect(m.by_session_location).toEqual({ in_home: 2, community: 1 });
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", wishes_feelings_recorded: true, advocacy_provided: true }),
      makeRecord({ id: "2", wishes_feelings_recorded: false, advocacy_provided: false }),
    ];
    const m = computeKeyworkerSessionMetrics(records);
    expect(m.wishes_feelings_rate).toBe(50);
    expect(m.advocacy_rate).toBe(50);
  });
});

describe("identifyKeyworkerSessionAlerts", () => {
  it("returns empty alerts for empty data", () => {
    expect(identifyKeyworkerSessionAlerts([])).toEqual([]);
  });

  it("triggers distressed_poor_session alert (critical)", () => {
    const records = [
      makeRecord({ id: "alert-1", child_mood: "distressed", session_quality: "poor", child_name: "Charlie" }),
    ];
    const alerts = identifyKeyworkerSessionAlerts(records);
    const found = alerts.find((a) => a.type === "distressed_poor_session");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
    expect(found!.id).toBe("alert-1");
  });

  it("triggers not_recorded alert when >= 1 session not recorded (high)", () => {
    const records = [
      makeRecord({ id: "1", session_recorded: false }),
    ];
    const alerts = identifyKeyworkerSessionAlerts(records);
    const found = alerts.find((a) => a.type === "not_recorded");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("triggers wishes_not_recorded alert when >= 2 without wishes (high)", () => {
    const records = [
      makeRecord({ id: "1", wishes_feelings_recorded: false }),
      makeRecord({ id: "2", wishes_feelings_recorded: false }),
    ];
    const alerts = identifyKeyworkerSessionAlerts(records);
    const found = alerts.find((a) => a.type === "wishes_not_recorded");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("does not trigger wishes_not_recorded when only 1 without wishes", () => {
    const records = [
      makeRecord({ id: "1", wishes_feelings_recorded: false }),
      makeRecord({ id: "2", wishes_feelings_recorded: true }),
    ];
    const alerts = identifyKeyworkerSessionAlerts(records);
    const found = alerts.find((a) => a.type === "wishes_not_recorded");
    expect(found).toBeUndefined();
  });

  it("triggers not_child_led alert when >= 3 not child-led (medium)", () => {
    const records = [
      makeRecord({ id: "1", child_led: false }),
      makeRecord({ id: "2", child_led: false }),
      makeRecord({ id: "3", child_led: false }),
    ];
    const alerts = identifyKeyworkerSessionAlerts(records);
    const found = alerts.find((a) => a.type === "not_child_led");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("triggers no_next_steps alert when >= 3 without next steps (medium)", () => {
    const records = [
      makeRecord({ id: "1", next_steps_agreed: false }),
      makeRecord({ id: "2", next_steps_agreed: false }),
      makeRecord({ id: "3", next_steps_agreed: false }),
    ];
    const alerts = identifyKeyworkerSessionAlerts(records);
    const found = alerts.find((a) => a.type === "no_next_steps");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("does not trigger not_child_led when only 2 not child-led", () => {
    const records = [
      makeRecord({ id: "1", child_led: false }),
      makeRecord({ id: "2", child_led: false }),
      makeRecord({ id: "3", child_led: true }),
    ];
    const alerts = identifyKeyworkerSessionAlerts(records);
    const found = alerts.find((a) => a.type === "not_child_led");
    expect(found).toBeUndefined();
  });
});
