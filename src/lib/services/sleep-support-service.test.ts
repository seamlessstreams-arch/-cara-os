import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateSleepSupport,
  type SleepSupportRow,
} from "./sleep-support-service";

function makeRow(
  overrides: Partial<SleepSupportRow> = {},
): SleepSupportRow {
  return {
    id: overrides.id ?? "row-1",
    home_id: "home-1",
    child_name: "Child A",
    record_date: "2025-06-01",
    recorder_name: "Staff",
    record_type: "Sleep Diary Entry",
    sleep_quality: "Good",
    bedtime: "21:00",
    wake_time: "07:00",
    estimated_hours: 9,
    night_disturbances: 0,
    disturbance_type: null,
    medication_involved: false,
    medication_type: null,
    sleep_environment_suitable: true,
    screen_time_managed: true,
    routine_followed: true,
    young_person_input: true,
    underlying_cause_identified: null,
    referral_made: false,
    specialist_service: null,
    next_review_date: null,
    status: "Active",
    notes: null,
    created_at: "2025-06-01T00:00:00Z",
    updated_at: "2025-06-01T00:00:00Z",
    ...overrides,
  };
}

// ── Metrics ──────────────────────────────────────────────────────────────

describe("computeMetrics (sleep-support)", () => {
  it("returns zeroes for empty array", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.average_sleep_quality).toBeNull();
    expect(m.average_estimated_hours).toBeNull();
    expect(m.average_disturbances).toBeNull(); // fab-0.;
    expect(m.medication_rate).toBeNull(); // fab-0.;
    expect(m.poor_sleep_rate).toBeNull(); // fab-0.;
    expect(m.good_sleep_rate).toBeNull(); // fab-0.;
    expect(m.sleep_quality_trend).toBe("stable");
  });

  it("counts unique children (case-insensitive)", () => {
    const rows = [
      makeRow({ child_name: "Alice" }),
      makeRow({ child_name: "alice" }),
      makeRow({ child_name: "Bob" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_children).toBe(2);
  });

  it("computes average sleep quality score", () => {
    const rows = [
      makeRow({ sleep_quality: "Very Good" }), // 5
      makeRow({ sleep_quality: "Poor" }),       // 2
    ];
    const m = computeMetrics(rows);
    expect(m.average_sleep_quality).toBe(3.5);
  });

  it("computes poor and good sleep rates", () => {
    const rows = [
      makeRow({ sleep_quality: "Very Poor" }),
      makeRow({ sleep_quality: "Poor" }),
      makeRow({ sleep_quality: "Good" }),
      makeRow({ sleep_quality: "Very Good" }),
    ];
    const m = computeMetrics(rows);
    expect(m.poor_sleep_rate).toBe(50);
    expect(m.good_sleep_rate).toBe(50);
  });

  it("computes average estimated hours", () => {
    const rows = [
      makeRow({ estimated_hours: 8 }),
      makeRow({ estimated_hours: 10 }),
    ];
    const m = computeMetrics(rows);
    expect(m.average_estimated_hours).toBe(9);
  });

  it("counts children with disturbances", () => {
    const rows = [
      makeRow({ child_name: "Alice", night_disturbances: 2 }),
      makeRow({ child_name: "Alice", night_disturbances: 0 }),
      makeRow({ child_name: "Bob", night_disturbances: 1 }),
      makeRow({ child_name: "Carol", night_disturbances: null }),
    ];
    const m = computeMetrics(rows);
    expect(m.children_with_disturbances).toBe(2);
  });

  it("computes sleep quality trend for 4+ records", () => {
    // first half poor, second half good => improving
    const rows = [
      makeRow({ record_date: "2025-01-01", sleep_quality: "Poor" }),
      makeRow({ record_date: "2025-01-02", sleep_quality: "Poor" }),
      makeRow({ record_date: "2025-06-01", sleep_quality: "Very Good" }),
      makeRow({ record_date: "2025-06-02", sleep_quality: "Very Good" }),
    ];
    const m = computeMetrics(rows);
    expect(m.sleep_quality_trend).toBe("improving");
  });

  it("counts clinical records", () => {
    const rows = [
      makeRow({ record_type: "Sleep Assessment" }),
      makeRow({ record_type: "GP Referral" }),
      makeRow({ record_type: "Sleep Diary Entry" }),
    ];
    const m = computeMetrics(rows);
    expect(m.clinical_record_count).toBe(2);
  });
});

// ── Alerts ───────────────────────────────────────────────────────────────

describe("computeAlerts (sleep-support)", () => {
  it("returns no alerts for empty array", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires critical for critically low sleep hours (< 4)", () => {
    const row = makeRow({ estimated_hours: 3 });
    const alerts = computeAlerts([row]);
    expect(alerts.some((a) => a.type === "critically_low_sleep_hours" && a.severity === "critical")).toBe(true);
  });

  it("does NOT fire low hours alert for 4+ hours", () => {
    const row = makeRow({ estimated_hours: 4 });
    const alerts = computeAlerts([row]);
    expect(alerts.some((a) => a.type === "critically_low_sleep_hours")).toBe(false);
  });

  it("fires high alert for unsuitable sleep environment on active record", () => {
    const row = makeRow({ sleep_environment_suitable: false, status: "Active" });
    const alerts = computeAlerts([row]);
    expect(alerts.some((a) => a.type === "environment_not_suitable" && a.severity === "high")).toBe(true);
  });

  it("fires high alert for high disturbance count (>= 5)", () => {
    const row = makeRow({ night_disturbances: 5 });
    const alerts = computeAlerts([row]);
    expect(alerts.some((a) => a.type === "high_disturbance_count" && a.severity === "high")).toBe(true);
  });

  it("does NOT fire disturbance alert for 4 disturbances", () => {
    const row = makeRow({ night_disturbances: 4 });
    const alerts = computeAlerts([row]);
    expect(alerts.some((a) => a.type === "high_disturbance_count")).toBe(false);
  });
});

// ── Validation ──────────────────────────────────────────────────────────

describe("validateSleepSupport", () => {
  it("returns valid for correct input", () => {
    const result = validateSleepSupport({
      childName: "Alice",
      recordDate: "2025-01-01",
      recorderName: "Staff",
      recordType: "Sleep Diary Entry",
      sleepQuality: "Good",
      status: "Active",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("returns errors for missing required fields", () => {
    const result = validateSleepSupport({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes("Child name"))).toBe(true);
    expect(result.errors.some((e) => e.includes("Record date"))).toBe(true);
    expect(result.errors.some((e) => e.includes("Recorder name"))).toBe(true);
  });

  it("validates estimated hours bounds", () => {
    const neg = validateSleepSupport({
      childName: "A",
      recordDate: "2025-01-01",
      recorderName: "S",
      recordType: "Sleep Diary Entry",
      estimatedHours: -1,
    });
    expect(neg.errors.some((e) => e.includes("negative"))).toBe(true);

    const over = validateSleepSupport({
      childName: "A",
      recordDate: "2025-01-01",
      recorderName: "S",
      recordType: "Sleep Diary Entry",
      estimatedHours: 25,
    });
    expect(over.errors.some((e) => e.includes("24"))).toBe(true);
  });

  it("requires medication type when medication is involved", () => {
    const result = validateSleepSupport({
      childName: "A",
      recordDate: "2025-01-01",
      recorderName: "S",
      recordType: "Sleep Diary Entry",
      medicationInvolved: true,
      medicationType: "",
    });
    expect(result.errors.some((e) => e.includes("Medication type"))).toBe(true);
  });

  it("requires specialist service when referral is made", () => {
    const result = validateSleepSupport({
      childName: "A",
      recordDate: "2025-01-01",
      recorderName: "S",
      recordType: "Sleep Diary Entry",
      referralMade: true,
      specialistService: "",
    });
    expect(result.errors.some((e) => e.includes("Specialist service"))).toBe(true);
  });

  it("requires medication involvement for melatonin review", () => {
    const result = validateSleepSupport({
      childName: "A",
      recordDate: "2025-01-01",
      recorderName: "S",
      recordType: "Melatonin Review",
      medicationInvolved: false,
    });
    expect(result.errors.some((e) => e.includes("Melatonin"))).toBe(true);
  });
});
