import { describe, it, expect } from "vitest";
import {
  computeLifeStoryWorkMetrics,
  identifyLifeStoryWorkAlerts,
  type LifeStoryWorkRecord,
} from "./life-story-work-service";

function makeRecord(
  overrides: Partial<LifeStoryWorkRecord> = {},
): LifeStoryWorkRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    session_type: "life_story_book",
    child_engagement: "fully_engaged",
    emotional_response: "positive",
    session_frequency: "weekly",
    session_date: "2026-05-20",
    child_name: "Child A",
    child_id: "child-1",
    facilitator_name: "Staff A",
    age_appropriate: true,
    trauma_informed: true,
    child_led: true,
    consent_obtained: true,
    social_worker_aware: true,
    therapist_consulted: false,
    materials_created: false,
    securely_stored: true,
    shared_with_child: false,
    parent_involvement: false,
    cultural_sensitivity: true,
    follow_up_planned: false,
    issues_found: [],
    actions_taken: [],
    session_duration_minutes: 45,
    next_session_date: null,
    notes: null,
    created_at: "2026-05-20T10:00:00Z",
    updated_at: "2026-05-20T10:00:00Z",
    ...overrides,
  };
}

describe("computeLifeStoryWorkMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeLifeStoryWorkMetrics([]);
    expect(m.total_sessions).toBe(0);
    expect(m.fully_engaged_count).toBe(0);
    expect(m.declined_count).toBe(0);
    expect(m.distressed_count).toBe(0);
    expect(m.average_session_duration).toBeNull();;
    expect(m.unique_children).toBe(0);
    expect(m.age_appropriate_rate).toBeNull();;
  });

  it("computes correct counts and rates for populated data", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Child A", child_engagement: "fully_engaged", emotional_response: "positive", session_duration_minutes: 30 }),
      makeRecord({ id: "2", child_name: "Child B", child_engagement: "declined", emotional_response: "distressed", session_duration_minutes: 60, trauma_informed: false }),
      makeRecord({ id: "3", child_name: "Child A", session_type: "memory_box", session_duration_minutes: 45 }),
    ];
    const m = computeLifeStoryWorkMetrics(records);
    expect(m.total_sessions).toBe(3);
    expect(m.fully_engaged_count).toBe(2); // records 1 and 3
    expect(m.declined_count).toBe(1);
    expect(m.distressed_count).toBe(1);
    expect(m.unique_children).toBe(2);
    expect(m.average_session_duration).toBe(45);
    expect(m.trauma_informed_rate).toBe(66.7);
    expect(m.by_session_type["life_story_book"]).toBe(2);
    expect(m.by_session_type["memory_box"]).toBe(1);
    expect(m.by_child_engagement["declined"]).toBe(1);
    expect(m.by_emotional_response["distressed"]).toBe(1);
  });
});

describe("identifyLifeStoryWorkAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyLifeStoryWorkAlerts([])).toHaveLength(0);
  });

  it("triggers distressed_no_therapist (critical) when distressed and therapist not consulted", () => {
    const records = [
      makeRecord({ id: "r1", emotional_response: "distressed", therapist_consulted: false }),
    ];
    const alerts = identifyLifeStoryWorkAlerts(records);
    const a = alerts.find((x) => x.type === "distressed_no_therapist");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
    expect(a!.id).toBe("r1");
  });

  it("triggers not_trauma_informed (high) when >= 1 session not trauma informed", () => {
    const records = [
      makeRecord({ id: "1", trauma_informed: false }),
    ];
    const alerts = identifyLifeStoryWorkAlerts(records);
    const a = alerts.find((x) => x.type === "not_trauma_informed");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers materials_not_secure (high) when materials created but not securely stored", () => {
    const records = [
      makeRecord({ id: "1", materials_created: true, securely_stored: false }),
    ];
    const alerts = identifyLifeStoryWorkAlerts(records);
    const a = alerts.find((x) => x.type === "materials_not_secure");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("does NOT trigger materials_not_secure when materials are NOT created", () => {
    const records = [
      makeRecord({ id: "1", materials_created: false, securely_stored: false }),
    ];
    const alerts = identifyLifeStoryWorkAlerts(records);
    expect(alerts.find((x) => x.type === "materials_not_secure")).toBeUndefined();
  });

  it("triggers consent_not_obtained (medium) when >= 2 sessions without consent", () => {
    const records = [
      makeRecord({ id: "1", consent_obtained: false }),
      makeRecord({ id: "2", consent_obtained: false }),
    ];
    const alerts = identifyLifeStoryWorkAlerts(records);
    const a = alerts.find((x) => x.type === "consent_not_obtained");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });

  it("does NOT trigger consent_not_obtained when only 1 session lacks consent", () => {
    const records = [
      makeRecord({ id: "1", consent_obtained: false }),
    ];
    const alerts = identifyLifeStoryWorkAlerts(records);
    expect(alerts.find((x) => x.type === "consent_not_obtained")).toBeUndefined();
  });

  it("triggers not_culturally_sensitive (medium) when >= 3 sessions lack cultural sensitivity", () => {
    const records = [
      makeRecord({ id: "1", cultural_sensitivity: false }),
      makeRecord({ id: "2", cultural_sensitivity: false }),
      makeRecord({ id: "3", cultural_sensitivity: false }),
    ];
    const alerts = identifyLifeStoryWorkAlerts(records);
    const a = alerts.find((x) => x.type === "not_culturally_sensitive");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });

  it("does NOT trigger not_culturally_sensitive when only 2 sessions lack it", () => {
    const records = [
      makeRecord({ id: "1", cultural_sensitivity: false }),
      makeRecord({ id: "2", cultural_sensitivity: false }),
    ];
    const alerts = identifyLifeStoryWorkAlerts(records);
    expect(alerts.find((x) => x.type === "not_culturally_sensitive")).toBeUndefined();
  });
});
