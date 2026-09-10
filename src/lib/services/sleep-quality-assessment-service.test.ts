import { describe, it, expect } from "vitest";
import {
  computeSleepQualityMetrics,
  identifySleepQualityAlerts,
  type SleepQualityAssessmentRecord,
} from "./sleep-quality-assessment-service";

function makeRecord(
  overrides: Partial<SleepQualityAssessmentRecord> = {},
): SleepQualityAssessmentRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    sleep_quality: "good",
    bedtime_routine: "fully_followed",
    sleep_environment: "good",
    waking_frequency: "none",
    sleep_concern: "none_identified",
    assessment_date: "2025-06-01",
    child_name: "Child A",
    child_id: null,
    assessed_by: "Staff",
    bedtime_consistent: true,
    wake_time_consistent: true,
    room_comfortable: true,
    temperature_appropriate: true,
    noise_minimised: true,
    screen_free_before_bed: true,
    relaxation_supported: true,
    child_preferences_met: true,
    gp_referral_considered: false,
    sleep_plan_in_place: true,
    care_plan_linked: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    sleep_hours: 9,
    next_review_date: null,
    notes: null,
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2025-06-01T00:00:00Z",
    ...overrides,
  };
}

// ── Metrics ──────────────────────────────────────────────────────────────

describe("computeSleepQualityMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeSleepQualityMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.poor_sleep_count).toBe(0);
    expect(m.very_poor_sleep_count).toBe(0);
    expect(m.no_routine_count).toBe(0);
    expect(m.unsuitable_environment_count).toBe(0);
    expect(m.continuous_disturbance_count).toBe(0);
    expect(m.bedtime_consistent_rate).toBeNull();;
    expect(m.average_sleep_hours).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts problem categories correctly", () => {
    const records = [
      makeRecord({ sleep_quality: "poor" }),
      makeRecord({ sleep_quality: "very_poor" }),
      makeRecord({ sleep_quality: "very_poor" }),
      makeRecord({ bedtime_routine: "no_routine_set" }),
      makeRecord({ sleep_environment: "unsuitable" }),
      makeRecord({ waking_frequency: "continuous_disturbance" }),
    ];
    const m = computeSleepQualityMetrics(records);
    expect(m.total_assessments).toBe(6);
    expect(m.poor_sleep_count).toBe(1);
    expect(m.very_poor_sleep_count).toBe(2);
    expect(m.no_routine_count).toBe(1);
    expect(m.unsuitable_environment_count).toBe(1);
    expect(m.continuous_disturbance_count).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ bedtime_consistent: true, screen_free_before_bed: false }),
      makeRecord({ bedtime_consistent: false, screen_free_before_bed: false }),
    ];
    const m = computeSleepQualityMetrics(records);
    expect(m.bedtime_consistent_rate).toBe(50);
    expect(m.screen_free_rate).toBe(0);
  });

  it("computes average sleep hours", () => {
    const records = [
      makeRecord({ sleep_hours: 8 }),
      makeRecord({ sleep_hours: 10 }),
    ];
    const m = computeSleepQualityMetrics(records);
    expect(m.average_sleep_hours).toBe(9);
  });

  it("counts unique children by child_name", () => {
    const records = [
      makeRecord({ child_name: "Alice" }),
      makeRecord({ child_name: "Alice" }),
      makeRecord({ child_name: "Bob" }),
    ];
    const m = computeSleepQualityMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("builds breakdowns by quality, routine, environment, waking, concern", () => {
    const records = [
      makeRecord({ sleep_quality: "poor", bedtime_routine: "not_followed" }),
      makeRecord({ sleep_quality: "good", bedtime_routine: "fully_followed" }),
    ];
    const m = computeSleepQualityMetrics(records);
    expect(m.by_sleep_quality["poor"]).toBe(1);
    expect(m.by_sleep_quality["good"]).toBe(1);
    expect(m.by_bedtime_routine["not_followed"]).toBe(1);
  });
});

// ── Alerts ───────────────────────────────────────────────────────────────

describe("identifySleepQualityAlerts", () => {
  it("returns no alerts for empty array", () => {
    expect(identifySleepQualityAlerts([])).toEqual([]);
  });

  it("returns no alerts for fully compliant records", () => {
    const alerts = identifySleepQualityAlerts([makeRecord()]);
    expect(alerts).toEqual([]);
  });

  it("fires critical for very poor sleep without GP referral", () => {
    const rec = makeRecord({
      sleep_quality: "very_poor",
      gp_referral_considered: false,
    });
    const alerts = identifySleepQualityAlerts([rec]);
    expect(alerts.some((a) => a.type === "very_poor_no_gp_referral" && a.severity === "critical")).toBe(true);
  });

  it("does NOT fire critical when GP referral was considered", () => {
    const rec = makeRecord({
      sleep_quality: "very_poor",
      gp_referral_considered: true,
    });
    const alerts = identifySleepQualityAlerts([rec]);
    expect(alerts.some((a) => a.type === "very_poor_no_gp_referral")).toBe(false);
  });

  it("fires high alert for no sleep plan (>= 1)", () => {
    const alerts = identifySleepQualityAlerts([
      makeRecord({ sleep_plan_in_place: false }),
    ]);
    expect(alerts.some((a) => a.type === "no_sleep_plan" && a.severity === "high")).toBe(true);
  });

  it("fires high alert for no bedtime routine (>= 1)", () => {
    const alerts = identifySleepQualityAlerts([
      makeRecord({ bedtime_routine: "no_routine_set" }),
    ]);
    expect(alerts.some((a) => a.type === "no_bedtime_routine" && a.severity === "high")).toBe(true);
  });

  it("fires medium alert for screens before bed when count >= 2", () => {
    const records = [
      makeRecord({ id: "r1", screen_free_before_bed: false }),
      makeRecord({ id: "r2", screen_free_before_bed: false }),
    ];
    const alerts = identifySleepQualityAlerts(records);
    expect(alerts.some((a) => a.type === "screens_before_bed" && a.severity === "medium")).toBe(true);
  });

  it("does NOT fire screens_before_bed when count is 1", () => {
    const alerts = identifySleepQualityAlerts([
      makeRecord({ screen_free_before_bed: false }),
    ]);
    expect(alerts.some((a) => a.type === "screens_before_bed")).toBe(false);
  });

  it("fires medium alert for room not comfortable when count >= 2", () => {
    const records = [
      makeRecord({ id: "r1", room_comfortable: false }),
      makeRecord({ id: "r2", room_comfortable: false }),
    ];
    const alerts = identifySleepQualityAlerts(records);
    expect(alerts.some((a) => a.type === "room_not_comfortable" && a.severity === "medium")).toBe(true);
  });
});
