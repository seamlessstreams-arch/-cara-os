import { describe, it, expect } from "vitest";
import {
  computeSleepMetrics,
  identifySleepAlerts,
  type NightCheck,
  type SleepRecord,
} from "./sleep-patterns-service";

function makeCheck(overrides: Partial<NightCheck> = {}): NightCheck {
  return {
    id: "chk-1",
    home_id: "home-1",
    check_date: "2025-06-01",
    check_time: "02:00",
    checked_by: "Staff",
    child_checks: [],
    environment_ok: true,
    security_checked: true,
    temperature_ok: true,
    notes: null,
    created_at: "2025-06-01T00:00:00Z",
    ...overrides,
  };
}

function makeSleepRecord(overrides: Partial<SleepRecord> = {}): SleepRecord {
  return {
    id: "sr-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Child A",
    record_date: "2025-06-01",
    bedtime: "21:00",
    settled_time: "21:30",
    wake_time: "07:00",
    sleep_quality: "good",
    disturbances: [],
    total_sleep_hours: 9,
    sleep_concern_flagged: false,
    concern_severity: null,
    concern_details: null,
    support_provided: null,
    notes: null,
    recorded_by: "Staff",
    created_at: "2025-06-01T00:00:00Z",
    ...overrides,
  };
}

// ── Metrics ──────────────────────────────────────────────────────────────

describe("computeSleepMetrics", () => {
  it("returns zeroes for empty arrays", () => {
    const m = computeSleepMetrics([], [], 5);
    expect(m.total_night_checks).toBe(0);
    expect(m.avg_checks_per_night).toBeNull(); // fab-0.
    expect(m.environment_compliance_rate).toBeNull(); // fab-0.
    expect(m.avg_sleep_quality_score).toBeNull(); // fab-0.
    expect(m.avg_sleep_hours).toBeNull(); // fab-0.
    expect(m.poor_sleep_rate).toBeNull(); // fab-0.
    expect(m.children_with_concerns).toBe(0);
  });

  it("computes environment compliance rate", () => {
    const checks = [
      makeCheck({ environment_ok: true, security_checked: true, temperature_ok: true }),
      makeCheck({ environment_ok: false, security_checked: true, temperature_ok: true }),
    ];
    const m = computeSleepMetrics(checks, [], 2);
    expect(m.environment_compliance_rate).toBe(50);
  });

  it("computes average sleep quality score", () => {
    const records = [
      makeSleepRecord({ sleep_quality: "excellent" }), // 5
      makeSleepRecord({ sleep_quality: "poor" }),       // 2
    ];
    const m = computeSleepMetrics([], records, 2);
    expect(m.avg_sleep_quality_score).toBe(3.5);
  });

  it("computes poor sleep rate", () => {
    const records = [
      makeSleepRecord({ sleep_quality: "poor" }),
      makeSleepRecord({ sleep_quality: "very_poor" }),
      makeSleepRecord({ sleep_quality: "good" }),
      makeSleepRecord({ sleep_quality: "excellent" }),
    ];
    const m = computeSleepMetrics([], records, 2);
    expect(m.poor_sleep_rate).toBe(50);
  });

  it("computes average sleep hours", () => {
    const records = [
      makeSleepRecord({ total_sleep_hours: 8 }),
      makeSleepRecord({ total_sleep_hours: 10 }),
    ];
    const m = computeSleepMetrics([], records, 2);
    expect(m.avg_sleep_hours).toBe(9);
  });

  it("counts children with concerns", () => {
    const records = [
      makeSleepRecord({ child_id: "c1", sleep_concern_flagged: true }),
      makeSleepRecord({ child_id: "c1", sleep_concern_flagged: true }),
      makeSleepRecord({ child_id: "c2", sleep_concern_flagged: true }),
      makeSleepRecord({ child_id: "c3", sleep_concern_flagged: false }),
    ];
    const m = computeSleepMetrics([], records, 3);
    expect(m.children_with_concerns).toBe(2);
  });

  it("counts disturbances by type", () => {
    const records = [
      makeSleepRecord({
        disturbances: [
          { time: "01:00", type: "nightmare", duration_minutes: 20, intervention: "comfort", resolved: true },
          { time: "03:00", type: "anxiety", duration_minutes: 15, intervention: "talk", resolved: true },
        ],
      }),
    ];
    const m = computeSleepMetrics([], records, 1);
    expect(m.by_disturbance_type["nightmare"]).toBe(1);
    expect(m.by_disturbance_type["anxiety"]).toBe(1);
  });
});

// ── Alerts ───────────────────────────────────────────────────────────────

describe("identifySleepAlerts", () => {
  const now = new Date("2025-06-15T12:00:00Z");

  it("returns no alerts for empty arrays", () => {
    expect(identifySleepAlerts([], [], 5, now)).toEqual([]);
  });

  it("fires critical alert for child not in room", () => {
    const check = makeCheck({
      child_checks: [
        { child_id: "c1", child_name: "Alice", outcome: "not_in_room", notes: "" },
      ],
    });
    const alerts = identifySleepAlerts([check], [], 1, now);
    expect(alerts.some((a) => a.type === "child_not_in_room" && a.severity === "critical")).toBe(true);
  });

  it("fires medium alert for environment issues", () => {
    const check = makeCheck({ environment_ok: false });
    const alerts = identifySleepAlerts([check], [], 1, now);
    expect(alerts.some((a) => a.type === "environment_issue" && a.severity === "medium")).toBe(true);
  });

  it("fires high alert for persistent poor sleep (3+ poor in 7 days)", () => {
    const recent = new Date(now.getTime() - 2 * 86400000).toISOString().split("T")[0];
    const records = [
      makeSleepRecord({ child_name: "Alice", sleep_quality: "poor", record_date: recent }),
      makeSleepRecord({ child_name: "Alice", sleep_quality: "very_poor", record_date: recent }),
      makeSleepRecord({ child_name: "Alice", sleep_quality: "poor", record_date: recent }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    expect(alerts.some((a) => a.type === "persistent_poor_sleep" && a.severity === "high")).toBe(true);
  });

  it("fires critical alert for critical sleep concern", () => {
    const record = makeSleepRecord({
      sleep_concern_flagged: true,
      concern_severity: "critical",
      concern_details: "Severe apnoea",
    });
    const alerts = identifySleepAlerts([], [record], 1, now);
    expect(alerts.some((a) => a.type === "sleep_concern" && a.severity === "critical")).toBe(true);
  });

  it("fires high alert for high sleep concern", () => {
    const record = makeSleepRecord({
      sleep_concern_flagged: true,
      concern_severity: "high",
    });
    const alerts = identifySleepAlerts([], [record], 1, now);
    expect(alerts.some((a) => a.type === "sleep_concern" && a.severity === "high")).toBe(true);
  });
});
