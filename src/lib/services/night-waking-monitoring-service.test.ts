import { describe, it, expect } from "vitest";
import {
  computeNightWakingMetrics,
  identifyNightWakingAlerts,
  type NightWakingMonitoringRecord,
} from "./night-waking-monitoring-service";

function makeRecord(overrides: Partial<NightWakingMonitoringRecord> = {}): NightWakingMonitoringRecord {
  return {
    id: "nw-1",
    home_id: "home-1",
    waking_reason: "nightmare",
    child_emotional_state: "mildly_unsettled",
    staff_response: "verbal_reassurance",
    sleep_return_time: "within_15_minutes",
    waking_date: "2026-05-20",
    waking_time: "02:30",
    child_name: "Alex Taylor",
    child_id: "child-1",
    staff_on_duty: "Night Worker A",
    child_comforted: true,
    environment_checked: true,
    temperature_appropriate: true,
    drink_offered: true,
    night_light_available: true,
    door_preference_respected: true,
    gp_referral_considered: false,
    sleep_plan_followed: true,
    pattern_identified: false,
    parent_informed: false,
    social_worker_informed: false,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    waking_duration_minutes: 15,
    next_review_date: null,
    notes: null,
    created_at: "2026-05-20T02:30:00Z",
    updated_at: "2026-05-20T02:45:00Z",
    ...overrides,
  };
}

// ── computeNightWakingMetrics ──────────────────────────────────────────

describe("computeNightWakingMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeNightWakingMetrics([]);
    expect(m.total_wakings).toBe(0);
    expect(m.distressed_count).toBe(0);
    expect(m.nightmare_count).toBe(0);
    expect(m.average_duration).toBeNull();;
    expect(m.unique_children).toBe(0);
    expect(m.child_comforted_rate).toBeNull();;
  });

  it("computes counts and rates for populated data", () => {
    const records = [
      makeRecord({ id: "nw-1", child_emotional_state: "distressed", waking_reason: "nightmare", child_comforted: true }),
      makeRecord({ id: "nw-2", child_emotional_state: "calm", waking_reason: "toileting", child_comforted: false }),
      makeRecord({ id: "nw-3", child_name: "Sam Rivers", child_emotional_state: "angry", waking_reason: "anxiety", child_comforted: true, sleep_return_time: "did_not_return_to_sleep" }),
    ];
    const m = computeNightWakingMetrics(records);
    expect(m.total_wakings).toBe(3);
    expect(m.distressed_count).toBe(1);
    expect(m.angry_count).toBe(1);
    expect(m.nightmare_count).toBe(1);
    expect(m.did_not_return_count).toBe(1);
    expect(m.unique_children).toBe(2);
    // 2 of 3 comforted => 66.7%
    expect(m.child_comforted_rate).toBe(66.7);
    expect(m.by_waking_reason["nightmare"]).toBe(1);
    expect(m.by_waking_reason["toileting"]).toBe(1);
    expect(m.by_waking_reason["anxiety"]).toBe(1);
  });

  it("computes average duration correctly", () => {
    const records = [
      makeRecord({ id: "nw-1", waking_duration_minutes: 10 }),
      makeRecord({ id: "nw-2", waking_duration_minutes: 30 }),
    ];
    const m = computeNightWakingMetrics(records);
    expect(m.average_duration).toBe(20);
  });
});

// ── identifyNightWakingAlerts ──────────────────────────────────────────

describe("identifyNightWakingAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyNightWakingAlerts([])).toHaveLength(0);
  });

  it("flags distressed_not_comforted (critical) when distressed and not comforted", () => {
    const records = [
      makeRecord({ child_emotional_state: "distressed", child_comforted: false }),
    ];
    const alerts = identifyNightWakingAlerts(records);
    const found = alerts.filter((a) => a.type === "distressed_not_comforted");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("critical");
  });

  it("flags distressed_not_comforted (critical) for angry child not comforted", () => {
    const records = [
      makeRecord({ child_emotional_state: "angry", child_comforted: false }),
    ];
    const alerts = identifyNightWakingAlerts(records);
    const found = alerts.filter((a) => a.type === "distressed_not_comforted");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("critical");
  });

  it("flags sleep_plan_not_followed (high) when >= 1 record without sleep plan", () => {
    const records = [
      makeRecord({ sleep_plan_followed: false }),
    ];
    const alerts = identifyNightWakingAlerts(records);
    const found = alerts.filter((a) => a.type === "sleep_plan_not_followed");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags not_recorded_promptly (high) when >= 1 record not recorded promptly", () => {
    const records = [
      makeRecord({ recorded_promptly: false }),
    ];
    const alerts = identifyNightWakingAlerts(records);
    const found = alerts.filter((a) => a.type === "not_recorded_promptly");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags environment_not_checked (medium) when >= 2 records without env check", () => {
    const records = [
      makeRecord({ id: "nw-1", environment_checked: false }),
      makeRecord({ id: "nw-2", environment_checked: false }),
    ];
    const alerts = identifyNightWakingAlerts(records);
    const found = alerts.filter((a) => a.type === "environment_not_checked");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("medium");
  });

  it("flags pattern_not_identified (medium) when >= 3 records without pattern analysis", () => {
    const records = [
      makeRecord({ id: "nw-1", pattern_identified: false }),
      makeRecord({ id: "nw-2", pattern_identified: false }),
      makeRecord({ id: "nw-3", pattern_identified: false }),
    ];
    const alerts = identifyNightWakingAlerts(records);
    const found = alerts.filter((a) => a.type === "pattern_not_identified");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("medium");
  });

  it("does NOT flag environment_not_checked when only 1 record without env check", () => {
    const records = [
      makeRecord({ id: "nw-1", environment_checked: false }),
    ];
    const alerts = identifyNightWakingAlerts(records);
    const found = alerts.filter((a) => a.type === "environment_not_checked");
    expect(found).toHaveLength(0);
  });
});
