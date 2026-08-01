import { describe, it, expect } from "vitest";
import {
  computeFaithSpiritualMetrics,
  identifyFaithSpiritualAlerts,
  type FaithSpiritualObservanceRecord,
} from "./faith-spiritual-observance-service";

function makeRecord(overrides: Partial<FaithSpiritualObservanceRecord> = {}): FaithSpiritualObservanceRecord {
  return {
    id: "fso-1",
    home_id: "home-1",
    observance_type: "place_of_worship",
    support_level: "fully_supported",
    child_engagement: "engaged",
    cultural_sensitivity: "good",
    session_date: "2026-05-01",
    child_name: "Child A",
    child_id: "child-1",
    supported_by: "Staff A",
    child_wishes_respected: true,
    dietary_needs_met: true,
    attendance_facilitated: true,
    resources_provided: true,
    care_plan_reflects: true,
    social_worker_informed: false,
    parent_informed: false,
    cultural_awareness_shown: true,
    privacy_respected: true,
    peer_understanding_promoted: true,
    festivals_acknowledged: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeFaithSpiritualMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeFaithSpiritualMetrics([]);
    expect(m.total_sessions).toBe(0);
    expect(m.not_supported_count).toBe(0);
    expect(m.disengaged_count).toBe(0);
    expect(m.poor_sensitivity_count).toBe(0);
    expect(m.insensitive_count).toBe(0);
    expect(m.child_wishes_rate).toBeNull();;
    expect(m.dietary_needs_rate).toBeNull();;
    expect(m.attendance_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("computes correct counts and rates for populated data", () => {
    const records: FaithSpiritualObservanceRecord[] = [
      makeRecord({ id: "r1", child_name: "Child A", support_level: "not_supported", child_engagement: "disengaged", cultural_sensitivity: "insensitive" }),
      makeRecord({ id: "r2", child_name: "Child B", support_level: "fully_supported", child_engagement: "refused", cultural_sensitivity: "poor" }),
      makeRecord({ id: "r3", child_name: "Child A", child_wishes_respected: false, attendance_facilitated: false }),
      makeRecord({ id: "r4", child_name: "Child C", cultural_awareness_shown: false, festivals_acknowledged: false }),
    ];
    const m = computeFaithSpiritualMetrics(records);
    expect(m.total_sessions).toBe(4);
    expect(m.not_supported_count).toBe(1);
    // disengaged + refused = 2
    expect(m.disengaged_count).toBe(2);
    // poor + insensitive = 2
    expect(m.poor_sensitivity_count).toBe(2);
    expect(m.insensitive_count).toBe(1);
    // child_wishes_respected: 3/4 = 75%
    expect(m.child_wishes_rate).toBe(75);
    // attendance: 3/4 = 75%
    expect(m.attendance_rate).toBe(75);
    // unique children: A, B, C
    expect(m.unique_children).toBe(3);
    // by_observance_type
    expect(m.by_observance_type["place_of_worship"]).toBe(4);
  });
});

describe("identifyFaithSpiritualAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyFaithSpiritualAlerts([])).toEqual([]);
  });

  it("generates critical alert for insensitive + not_supported", () => {
    const records = [makeRecord({ cultural_sensitivity: "insensitive", support_level: "not_supported" })];
    const alerts = identifyFaithSpiritualAlerts(records);
    const crit = alerts.filter((a) => a.type === "insensitive_not_supported");
    expect(crit).toHaveLength(1);
    expect(crit[0].severity).toBe("critical");
    expect(crit[0].message).toContain("Child A");
  });

  it("generates high alert when >= 1 session has wishes not respected", () => {
    const records = [makeRecord({ child_wishes_respected: false })];
    const alerts = identifyFaithSpiritualAlerts(records);
    const wishes = alerts.filter((a) => a.type === "wishes_not_respected");
    expect(wishes).toHaveLength(1);
    expect(wishes[0].severity).toBe("high");
  });

  it("generates high alert when >= 1 session has attendance not facilitated", () => {
    const records = [makeRecord({ attendance_facilitated: false })];
    const alerts = identifyFaithSpiritualAlerts(records);
    const att = alerts.filter((a) => a.type === "attendance_not_facilitated");
    expect(att).toHaveLength(1);
    expect(att[0].severity).toBe("high");
  });

  it("generates medium alert when >= 2 sessions have no cultural awareness", () => {
    const records = [
      makeRecord({ id: "r1", cultural_awareness_shown: false }),
      makeRecord({ id: "r2", cultural_awareness_shown: false }),
    ];
    const alerts = identifyFaithSpiritualAlerts(records);
    const noAwareness = alerts.filter((a) => a.type === "no_cultural_awareness");
    expect(noAwareness).toHaveLength(1);
    expect(noAwareness[0].severity).toBe("medium");
  });

  it("generates medium alert when >= 2 sessions have festivals not acknowledged", () => {
    const records = [
      makeRecord({ id: "r1", festivals_acknowledged: false }),
      makeRecord({ id: "r2", festivals_acknowledged: false }),
    ];
    const alerts = identifyFaithSpiritualAlerts(records);
    const noFest = alerts.filter((a) => a.type === "festivals_not_acknowledged");
    expect(noFest).toHaveLength(1);
    expect(noFest[0].severity).toBe("medium");
  });

  it("does not trigger medium alerts when only 1 session lacks awareness", () => {
    const records = [
      makeRecord({ id: "r1", cultural_awareness_shown: false }),
      makeRecord({ id: "r2", cultural_awareness_shown: true }),
    ];
    const alerts = identifyFaithSpiritualAlerts(records);
    expect(alerts.filter((a) => a.type === "no_cultural_awareness")).toHaveLength(0);
  });
});
