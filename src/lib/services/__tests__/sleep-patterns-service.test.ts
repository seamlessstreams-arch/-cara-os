// ══════════════════════════════════════════════════════════════════════════════
// CARA — SLEEP PATTERNS SERVICE TESTS
// Pure-function unit tests for sleep metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 6 (quality of care — rest and sleep),
// Reg 9 (promoting good health — sleep as health factor),
// Reg 10 (dignity — respecting bedtime routines and privacy).
// SCCIF: Children's Experiences — "Children are well rested and have
// bedtime routines that meet their individual needs." "Night-time
// arrangements are safe and appropriate."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  SLEEP_QUALITIES,
  DISTURBANCE_TYPES,
  CHECK_OUTCOMES,
  CONCERN_SEVERITIES,
  listChecks,
  createCheck,
  listRecords,
  createRecord,
} from "../sleep-patterns-service";

import type {
  NightCheck,
  SleepRecord,
} from "../sleep-patterns-service";

const { computeSleepMetrics, identifySleepAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Date string N days ago from a reference date. */
function daysAgo(n: number, from: Date = new Date()): string {
  const d = new Date(from.getTime() - n * 86400000);
  return d.toISOString().split("T")[0];
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal NightCheck with sensible defaults. */
function makeCheck(overrides: Partial<NightCheck> = {}): NightCheck {
  return {
    id: "check-1",
    home_id: "home-1",
    check_date: daysAgo(0),
    check_time: "02:00",
    checked_by: "staff-1",
    child_checks: [
      {
        child_id: "child-1",
        child_name: "Alice Smith",
        outcome: "sleeping",
        notes: "",
      },
    ],
    environment_ok: true,
    security_checked: true,
    temperature_ok: true,
    notes: null,
    created_at: daysAgoISO(0),
    ...overrides,
  };
}

/** Build a minimal SleepRecord with sensible defaults. */
function makeRecord(overrides: Partial<SleepRecord> = {}): SleepRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alice Smith",
    record_date: daysAgo(0),
    bedtime: "21:00",
    settled_time: "21:30",
    wake_time: "07:00",
    sleep_quality: "good",
    disturbances: [],
    total_sleep_hours: 9.5,
    sleep_concern_flagged: false,
    concern_severity: null,
    concern_details: null,
    support_provided: null,
    notes: null,
    recorded_by: "staff-1",
    created_at: daysAgoISO(0),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("SLEEP_QUALITIES", () => {
  it("has exactly 5 qualities", () => {
    expect(SLEEP_QUALITIES).toHaveLength(5);
  });

  it("contains unique quality values", () => {
    const values = SLEEP_QUALITIES.map((s) => s.quality);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = SLEEP_QUALITIES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes excellent", () => {
    expect(SLEEP_QUALITIES.find((s) => s.quality === "excellent")).toBeTruthy();
  });

  it("includes good", () => {
    expect(SLEEP_QUALITIES.find((s) => s.quality === "good")).toBeTruthy();
  });

  it("includes fair", () => {
    expect(SLEEP_QUALITIES.find((s) => s.quality === "fair")).toBeTruthy();
  });

  it("includes poor", () => {
    expect(SLEEP_QUALITIES.find((s) => s.quality === "poor")).toBeTruthy();
  });

  it("includes very_poor", () => {
    expect(SLEEP_QUALITIES.find((s) => s.quality === "very_poor")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of SLEEP_QUALITIES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("DISTURBANCE_TYPES", () => {
  it("has exactly 11 types", () => {
    expect(DISTURBANCE_TYPES).toHaveLength(11);
  });

  it("contains unique type values", () => {
    const values = DISTURBANCE_TYPES.map((d) => d.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = DISTURBANCE_TYPES.map((d) => d.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes nightmare", () => {
    expect(DISTURBANCE_TYPES.find((d) => d.type === "nightmare")).toBeTruthy();
  });

  it("includes night_terror", () => {
    expect(DISTURBANCE_TYPES.find((d) => d.type === "night_terror")).toBeTruthy();
  });

  it("includes sleepwalking", () => {
    expect(DISTURBANCE_TYPES.find((d) => d.type === "sleepwalking")).toBeTruthy();
  });

  it("includes bedwetting", () => {
    expect(DISTURBANCE_TYPES.find((d) => d.type === "bedwetting")).toBeTruthy();
  });

  it("includes anxiety", () => {
    expect(DISTURBANCE_TYPES.find((d) => d.type === "anxiety")).toBeTruthy();
  });

  it("includes noise", () => {
    expect(DISTURBANCE_TYPES.find((d) => d.type === "noise")).toBeTruthy();
  });

  it("includes illness", () => {
    expect(DISTURBANCE_TYPES.find((d) => d.type === "illness")).toBeTruthy();
  });

  it("includes pain", () => {
    expect(DISTURBANCE_TYPES.find((d) => d.type === "pain")).toBeTruthy();
  });

  it("includes medication_related", () => {
    expect(DISTURBANCE_TYPES.find((d) => d.type === "medication_related")).toBeTruthy();
  });

  it("includes emotional_distress", () => {
    expect(DISTURBANCE_TYPES.find((d) => d.type === "emotional_distress")).toBeTruthy();
  });

  it("includes other", () => {
    expect(DISTURBANCE_TYPES.find((d) => d.type === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const d of DISTURBANCE_TYPES) {
      expect(d.label.length).toBeGreaterThan(0);
    }
  });
});

describe("CHECK_OUTCOMES", () => {
  it("has exactly 5 outcomes", () => {
    expect(CHECK_OUTCOMES).toHaveLength(5);
  });

  it("contains unique outcome values", () => {
    const values = CHECK_OUTCOMES.map((c) => c.outcome);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = CHECK_OUTCOMES.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes sleeping", () => {
    expect(CHECK_OUTCOMES.find((c) => c.outcome === "sleeping")).toBeTruthy();
  });

  it("includes awake_settled", () => {
    expect(CHECK_OUTCOMES.find((c) => c.outcome === "awake_settled")).toBeTruthy();
  });

  it("includes awake_unsettled", () => {
    expect(CHECK_OUTCOMES.find((c) => c.outcome === "awake_unsettled")).toBeTruthy();
  });

  it("includes not_in_room", () => {
    expect(CHECK_OUTCOMES.find((c) => c.outcome === "not_in_room")).toBeTruthy();
  });

  it("includes required_support", () => {
    expect(CHECK_OUTCOMES.find((c) => c.outcome === "required_support")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const c of CHECK_OUTCOMES) {
      expect(c.label.length).toBeGreaterThan(0);
    }
  });
});

describe("CONCERN_SEVERITIES", () => {
  it("has exactly 4 severities", () => {
    expect(CONCERN_SEVERITIES).toHaveLength(4);
  });

  it("contains unique severity values", () => {
    const values = CONCERN_SEVERITIES.map((c) => c.severity);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = CONCERN_SEVERITIES.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes low", () => {
    expect(CONCERN_SEVERITIES.find((c) => c.severity === "low")).toBeTruthy();
  });

  it("includes medium", () => {
    expect(CONCERN_SEVERITIES.find((c) => c.severity === "medium")).toBeTruthy();
  });

  it("includes high", () => {
    expect(CONCERN_SEVERITIES.find((c) => c.severity === "high")).toBeTruthy();
  });

  it("includes critical", () => {
    expect(CONCERN_SEVERITIES.find((c) => c.severity === "critical")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const c of CONCERN_SEVERITIES) {
      expect(c.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeSleepMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeSleepMetrics", () => {
  it("returns zeroed metrics for empty arrays", () => {
    const m = computeSleepMetrics([], [], 0);
    expect(m.total_night_checks).toBe(0);
    expect(m.checks_this_week).toBe(0);
    expect(m.avg_checks_per_night).toBeNull(); // fab-0.
    expect(m.environment_compliance_rate).toBeNull(); // fab-0.
    expect(m.avg_sleep_quality_score).toBeNull(); // fab-0.
    expect(m.children_with_concerns).toBe(0);
    expect(m.total_disturbances_this_week).toBe(0);
    expect(Object.keys(m.by_sleep_quality)).toHaveLength(0);
    expect(Object.keys(m.by_disturbance_type)).toHaveLength(0);
    expect(m.avg_sleep_hours).toBeNull(); // fab-0.
    expect(m.poor_sleep_rate).toBeNull(); // fab-0.
  });

  // ── total_night_checks ──────────────────────────────────────────────

  it("total_night_checks equals the number of checks provided", () => {
    const checks = [
      makeCheck({ id: "c1" }),
      makeCheck({ id: "c2" }),
      makeCheck({ id: "c3" }),
    ];
    const m = computeSleepMetrics(checks, [], 0);
    expect(m.total_night_checks).toBe(3);
  });

  it("total_night_checks is 1 for a single check", () => {
    const m = computeSleepMetrics([makeCheck()], [], 0);
    expect(m.total_night_checks).toBe(1);
  });

  // ── checks_this_week ────────────────────────────────────────────────

  it("checks_this_week counts only checks within the last 7 days", () => {
    const checks = [
      makeCheck({ id: "c1", check_date: daysAgo(2) }),
      makeCheck({ id: "c2", check_date: daysAgo(5) }),
      makeCheck({ id: "c3", check_date: daysAgo(10) }),
    ];
    const m = computeSleepMetrics(checks, [], 0);
    expect(m.checks_this_week).toBe(2);
  });

  it("checks_this_week includes today", () => {
    const checks = [makeCheck({ id: "c1", check_date: daysAgo(0) })];
    const m = computeSleepMetrics(checks, [], 0);
    expect(m.checks_this_week).toBe(1);
  });

  it("checks_this_week is 0 when all checks are older than 7 days", () => {
    const checks = [
      makeCheck({ id: "c1", check_date: daysAgo(10) }),
      makeCheck({ id: "c2", check_date: daysAgo(20) }),
    ];
    const m = computeSleepMetrics(checks, [], 0);
    expect(m.checks_this_week).toBe(0);
  });

  // ── avg_checks_per_night ────────────────────────────────────────────

  it("avg_checks_per_night divides weekly checks by unique nights", () => {
    const checks = [
      makeCheck({ id: "c1", check_date: daysAgo(1), check_time: "01:00" }),
      makeCheck({ id: "c2", check_date: daysAgo(1), check_time: "03:00" }),
      makeCheck({ id: "c3", check_date: daysAgo(2), check_time: "02:00" }),
    ];
    const m = computeSleepMetrics(checks, [], 0);
    // 3 checks / 2 unique nights = 1.5
    expect(m.avg_checks_per_night).toBe(1.5);
  });

  it("avg_checks_per_night is 0 when no checks this week", () => {
    const checks = [makeCheck({ id: "c1", check_date: daysAgo(14) })];
    const m = computeSleepMetrics(checks, [], 0);
    expect(m.avg_checks_per_night).toBeNull(); // fab-0.
  });

  it("avg_checks_per_night rounds to 1 decimal", () => {
    const checks = [
      makeCheck({ id: "c1", check_date: daysAgo(1), check_time: "01:00" }),
      makeCheck({ id: "c2", check_date: daysAgo(1), check_time: "02:00" }),
      makeCheck({ id: "c3", check_date: daysAgo(1), check_time: "04:00" }),
      makeCheck({ id: "c4", check_date: daysAgo(2), check_time: "01:00" }),
      makeCheck({ id: "c5", check_date: daysAgo(2), check_time: "03:00" }),
      makeCheck({ id: "c6", check_date: daysAgo(3), check_time: "02:00" }),
    ];
    const m = computeSleepMetrics(checks, [], 0);
    // 6 checks / 3 unique nights = 2.0
    expect(m.avg_checks_per_night).toBe(2);
  });

  it("avg_checks_per_night with single night is total checks", () => {
    const date = daysAgo(1);
    const checks = [
      makeCheck({ id: "c1", check_date: date, check_time: "01:00" }),
      makeCheck({ id: "c2", check_date: date, check_time: "03:00" }),
      makeCheck({ id: "c3", check_date: date, check_time: "05:00" }),
    ];
    const m = computeSleepMetrics(checks, [], 0);
    expect(m.avg_checks_per_night).toBe(3);
  });

  // ── environment_compliance_rate ─────────────────────────────────────

  it("environment_compliance_rate is 100 when all checks pass", () => {
    const checks = [
      makeCheck({ id: "c1", environment_ok: true, security_checked: true, temperature_ok: true }),
      makeCheck({ id: "c2", environment_ok: true, security_checked: true, temperature_ok: true }),
    ];
    const m = computeSleepMetrics(checks, [], 0);
    expect(m.environment_compliance_rate).toBe(100);
  });

  it("environment_compliance_rate is 0 when all checks fail", () => {
    const checks = [
      makeCheck({ id: "c1", environment_ok: false, security_checked: true, temperature_ok: true }),
      makeCheck({ id: "c2", environment_ok: true, security_checked: false, temperature_ok: true }),
    ];
    const m = computeSleepMetrics(checks, [], 0);
    expect(m.environment_compliance_rate).toBe(0); // records exist → real 0.
  });

  it("environment_compliance_rate requires all three booleans true", () => {
    const checks = [
      makeCheck({ id: "c1", environment_ok: true, security_checked: true, temperature_ok: true }),
      makeCheck({ id: "c2", environment_ok: true, security_checked: true, temperature_ok: false }),
    ];
    const m = computeSleepMetrics(checks, [], 0);
    // 1/2 = 50.0%
    expect(m.environment_compliance_rate).toBe(50);
  });

  it("environment_compliance_rate fails when only environment_ok is false", () => {
    const checks = [
      makeCheck({ id: "c1", environment_ok: false, security_checked: true, temperature_ok: true }),
    ];
    const m = computeSleepMetrics(checks, [], 0);
    expect(m.environment_compliance_rate).toBe(0); // records exist → real 0.
  });

  it("environment_compliance_rate fails when only security_checked is false", () => {
    const checks = [
      makeCheck({ id: "c1", environment_ok: true, security_checked: false, temperature_ok: true }),
    ];
    const m = computeSleepMetrics(checks, [], 0);
    expect(m.environment_compliance_rate).toBe(0); // records exist → real 0.
  });

  it("environment_compliance_rate fails when only temperature_ok is false", () => {
    const checks = [
      makeCheck({ id: "c1", environment_ok: true, security_checked: true, temperature_ok: false }),
    ];
    const m = computeSleepMetrics(checks, [], 0);
    expect(m.environment_compliance_rate).toBe(0); // records exist → real 0.
  });

  it("environment_compliance_rate is 0 when no checks exist", () => {
    const m = computeSleepMetrics([], [], 0);
    expect(m.environment_compliance_rate).toBeNull(); // fab-0.
  });

  it("environment_compliance_rate rounds to one decimal place", () => {
    const checks = [
      makeCheck({ id: "c1", environment_ok: true, security_checked: true, temperature_ok: true }),
      makeCheck({ id: "c2", environment_ok: true, security_checked: true, temperature_ok: true }),
      makeCheck({ id: "c3", environment_ok: false, security_checked: true, temperature_ok: true }),
    ];
    const m = computeSleepMetrics(checks, [], 0);
    // 2/3 = 66.7%
    expect(m.environment_compliance_rate).toBe(66.7);
  });

  // ── avg_sleep_quality_score ─────────────────────────────────────────

  it("avg_sleep_quality_score is 5 for all excellent", () => {
    const records = [
      makeRecord({ id: "r1", sleep_quality: "excellent" }),
      makeRecord({ id: "r2", sleep_quality: "excellent" }),
    ];
    const m = computeSleepMetrics([], records, 0);
    expect(m.avg_sleep_quality_score).toBe(5);
  });

  it("avg_sleep_quality_score is 4 for all good", () => {
    const records = [
      makeRecord({ id: "r1", sleep_quality: "good" }),
    ];
    const m = computeSleepMetrics([], records, 0);
    expect(m.avg_sleep_quality_score).toBe(4);
  });

  it("avg_sleep_quality_score is 3 for all fair", () => {
    const records = [
      makeRecord({ id: "r1", sleep_quality: "fair" }),
    ];
    const m = computeSleepMetrics([], records, 0);
    expect(m.avg_sleep_quality_score).toBe(3);
  });

  it("avg_sleep_quality_score is 2 for all poor", () => {
    const records = [
      makeRecord({ id: "r1", sleep_quality: "poor" }),
    ];
    const m = computeSleepMetrics([], records, 0);
    expect(m.avg_sleep_quality_score).toBe(2);
  });

  it("avg_sleep_quality_score is 1 for all very_poor", () => {
    const records = [
      makeRecord({ id: "r1", sleep_quality: "very_poor" }),
    ];
    const m = computeSleepMetrics([], records, 0);
    expect(m.avg_sleep_quality_score).toBe(1);
  });

  it("avg_sleep_quality_score averages mixed qualities", () => {
    const records = [
      makeRecord({ id: "r1", sleep_quality: "excellent" }), // 5
      makeRecord({ id: "r2", sleep_quality: "good" }),      // 4
      makeRecord({ id: "r3", sleep_quality: "fair" }),      // 3
      makeRecord({ id: "r4", sleep_quality: "poor" }),      // 2
      makeRecord({ id: "r5", sleep_quality: "very_poor" }), // 1
    ];
    const m = computeSleepMetrics([], records, 0);
    // (5+4+3+2+1)/5 = 3.0
    expect(m.avg_sleep_quality_score).toBe(3);
  });

  it("avg_sleep_quality_score rounds to one decimal place", () => {
    const records = [
      makeRecord({ id: "r1", sleep_quality: "excellent" }), // 5
      makeRecord({ id: "r2", sleep_quality: "good" }),      // 4
      makeRecord({ id: "r3", sleep_quality: "fair" }),      // 3
    ];
    const m = computeSleepMetrics([], records, 0);
    // (5+4+3)/3 = 4.0
    expect(m.avg_sleep_quality_score).toBe(4);
  });

  it("avg_sleep_quality_score is 0 when no records exist", () => {
    const m = computeSleepMetrics([], [], 0);
    expect(m.avg_sleep_quality_score).toBeNull(); // fab-0.
  });

  // ── children_with_concerns ──────────────────────────────────────────

  it("children_with_concerns counts unique child_ids with flagged concerns", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", sleep_concern_flagged: true }),
      makeRecord({ id: "r2", child_id: "c2", sleep_concern_flagged: true }),
      makeRecord({ id: "r3", child_id: "c3", sleep_concern_flagged: false }),
    ];
    const m = computeSleepMetrics([], records, 3);
    expect(m.children_with_concerns).toBe(2);
  });

  it("children_with_concerns does not double-count same child", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", sleep_concern_flagged: true }),
      makeRecord({ id: "r2", child_id: "c1", sleep_concern_flagged: true }),
      makeRecord({ id: "r3", child_id: "c1", sleep_concern_flagged: true }),
    ];
    const m = computeSleepMetrics([], records, 1);
    expect(m.children_with_concerns).toBe(1);
  });

  it("children_with_concerns is 0 when no concerns flagged", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", sleep_concern_flagged: false }),
      makeRecord({ id: "r2", child_id: "c2", sleep_concern_flagged: false }),
    ];
    const m = computeSleepMetrics([], records, 2);
    expect(m.children_with_concerns).toBe(0);
  });

  it("children_with_concerns is 0 with no records", () => {
    const m = computeSleepMetrics([], [], 5);
    expect(m.children_with_concerns).toBe(0);
  });

  // ── total_disturbances_this_week ────────────────────────────────────

  it("total_disturbances_this_week counts disturbances from recent records", () => {
    const records = [
      makeRecord({
        id: "r1",
        record_date: daysAgo(2),
        disturbances: [
          { time: "01:00", type: "nightmare", duration_minutes: 15, intervention: "comfort", resolved: true },
          { time: "03:00", type: "anxiety", duration_minutes: 10, intervention: "talk", resolved: true },
        ],
      }),
    ];
    const m = computeSleepMetrics([], records, 0);
    expect(m.total_disturbances_this_week).toBe(2);
  });

  it("total_disturbances_this_week excludes disturbances from old records", () => {
    const records = [
      makeRecord({
        id: "r1",
        record_date: daysAgo(10),
        disturbances: [
          { time: "01:00", type: "nightmare", duration_minutes: 15, intervention: "comfort", resolved: true },
        ],
      }),
    ];
    const m = computeSleepMetrics([], records, 0);
    expect(m.total_disturbances_this_week).toBe(0);
  });

  it("total_disturbances_this_week is 0 with no disturbances", () => {
    const records = [
      makeRecord({ id: "r1", record_date: daysAgo(1), disturbances: [] }),
    ];
    const m = computeSleepMetrics([], records, 0);
    expect(m.total_disturbances_this_week).toBe(0);
  });

  it("total_disturbances_this_week sums across multiple records", () => {
    const records = [
      makeRecord({
        id: "r1",
        record_date: daysAgo(1),
        disturbances: [
          { time: "01:00", type: "nightmare", duration_minutes: 15, intervention: "comfort", resolved: true },
        ],
      }),
      makeRecord({
        id: "r2",
        record_date: daysAgo(2),
        disturbances: [
          { time: "02:00", type: "anxiety", duration_minutes: 10, intervention: "talk", resolved: true },
          { time: "04:00", type: "noise", duration_minutes: 5, intervention: "none", resolved: true },
        ],
      }),
    ];
    const m = computeSleepMetrics([], records, 0);
    expect(m.total_disturbances_this_week).toBe(3);
  });

  // ── by_sleep_quality ────────────────────────────────────────────────

  it("by_sleep_quality tallies each quality level", () => {
    const records = [
      makeRecord({ id: "r1", sleep_quality: "excellent" }),
      makeRecord({ id: "r2", sleep_quality: "good" }),
      makeRecord({ id: "r3", sleep_quality: "good" }),
      makeRecord({ id: "r4", sleep_quality: "poor" }),
    ];
    const m = computeSleepMetrics([], records, 0);
    expect(m.by_sleep_quality["excellent"]).toBe(1);
    expect(m.by_sleep_quality["good"]).toBe(2);
    expect(m.by_sleep_quality["poor"]).toBe(1);
  });

  it("by_sleep_quality is empty when no records exist", () => {
    const m = computeSleepMetrics([], [], 0);
    expect(Object.keys(m.by_sleep_quality)).toHaveLength(0);
  });

  it("by_sleep_quality only includes qualities present in data", () => {
    const records = [
      makeRecord({ id: "r1", sleep_quality: "fair" }),
      makeRecord({ id: "r2", sleep_quality: "fair" }),
    ];
    const m = computeSleepMetrics([], records, 0);
    expect(m.by_sleep_quality["fair"]).toBe(2);
    expect(m.by_sleep_quality["excellent"]).toBeUndefined();
    expect(m.by_sleep_quality["poor"]).toBeUndefined();
  });

  // ── by_disturbance_type ─────────────────────────────────────────────

  it("by_disturbance_type tallies each disturbance type", () => {
    const records = [
      makeRecord({
        id: "r1",
        disturbances: [
          { time: "01:00", type: "nightmare", duration_minutes: 15, intervention: "comfort", resolved: true },
          { time: "03:00", type: "nightmare", duration_minutes: 10, intervention: "comfort", resolved: true },
        ],
      }),
      makeRecord({
        id: "r2",
        disturbances: [
          { time: "02:00", type: "anxiety", duration_minutes: 20, intervention: "talk", resolved: true },
        ],
      }),
    ];
    const m = computeSleepMetrics([], records, 0);
    expect(m.by_disturbance_type["nightmare"]).toBe(2);
    expect(m.by_disturbance_type["anxiety"]).toBe(1);
  });

  it("by_disturbance_type is empty when no disturbances exist", () => {
    const records = [makeRecord({ id: "r1", disturbances: [] })];
    const m = computeSleepMetrics([], records, 0);
    expect(Object.keys(m.by_disturbance_type)).toHaveLength(0);
  });

  it("by_disturbance_type counts across all records regardless of date", () => {
    const records = [
      makeRecord({
        id: "r1",
        record_date: daysAgo(1),
        disturbances: [
          { time: "01:00", type: "bedwetting", duration_minutes: 10, intervention: "change sheets", resolved: true },
        ],
      }),
      makeRecord({
        id: "r2",
        record_date: daysAgo(20),
        disturbances: [
          { time: "02:00", type: "bedwetting", duration_minutes: 15, intervention: "change sheets", resolved: true },
        ],
      }),
    ];
    const m = computeSleepMetrics([], records, 0);
    expect(m.by_disturbance_type["bedwetting"]).toBe(2);
  });

  // ── avg_sleep_hours ─────────────────────────────────────────────────

  it("avg_sleep_hours averages total_sleep_hours from records", () => {
    const records = [
      makeRecord({ id: "r1", total_sleep_hours: 8 }),
      makeRecord({ id: "r2", total_sleep_hours: 10 }),
    ];
    const m = computeSleepMetrics([], records, 0);
    // (8+10)/2 = 9.0
    expect(m.avg_sleep_hours).toBe(9);
  });

  it("avg_sleep_hours skips records with null total_sleep_hours", () => {
    const records = [
      makeRecord({ id: "r1", total_sleep_hours: 8 }),
      makeRecord({ id: "r2", total_sleep_hours: null }),
      makeRecord({ id: "r3", total_sleep_hours: 10 }),
    ];
    const m = computeSleepMetrics([], records, 0);
    // (8+10)/2 = 9.0
    expect(m.avg_sleep_hours).toBe(9);
  });

  it("avg_sleep_hours is 0 when all records have null hours", () => {
    const records = [
      makeRecord({ id: "r1", total_sleep_hours: null }),
      makeRecord({ id: "r2", total_sleep_hours: null }),
    ];
    const m = computeSleepMetrics([], records, 0);
    expect(m.avg_sleep_hours).toBeNull(); // fab-0.
  });

  it("avg_sleep_hours is 0 when no records exist", () => {
    const m = computeSleepMetrics([], [], 0);
    expect(m.avg_sleep_hours).toBeNull(); // fab-0.
  });

  it("avg_sleep_hours rounds to one decimal place", () => {
    const records = [
      makeRecord({ id: "r1", total_sleep_hours: 7 }),
      makeRecord({ id: "r2", total_sleep_hours: 8 }),
      makeRecord({ id: "r3", total_sleep_hours: 9 }),
    ];
    const m = computeSleepMetrics([], records, 0);
    // (7+8+9)/3 = 8.0
    expect(m.avg_sleep_hours).toBe(8);
  });

  // ── poor_sleep_rate ─────────────────────────────────────────────────

  it("poor_sleep_rate counts both poor and very_poor", () => {
    const records = [
      makeRecord({ id: "r1", sleep_quality: "poor" }),
      makeRecord({ id: "r2", sleep_quality: "very_poor" }),
      makeRecord({ id: "r3", sleep_quality: "good" }),
      makeRecord({ id: "r4", sleep_quality: "excellent" }),
    ];
    const m = computeSleepMetrics([], records, 0);
    // 2/4 = 50%
    expect(m.poor_sleep_rate).toBe(50);
  });

  it("poor_sleep_rate is 0 when no poor sleep exists", () => {
    const records = [
      makeRecord({ id: "r1", sleep_quality: "excellent" }),
      makeRecord({ id: "r2", sleep_quality: "good" }),
      makeRecord({ id: "r3", sleep_quality: "fair" }),
    ];
    const m = computeSleepMetrics([], records, 0);
    expect(m.poor_sleep_rate).toBe(0); // records exist → real 0.
  });

  it("poor_sleep_rate is 100 when all sleep is poor/very_poor", () => {
    const records = [
      makeRecord({ id: "r1", sleep_quality: "poor" }),
      makeRecord({ id: "r2", sleep_quality: "very_poor" }),
    ];
    const m = computeSleepMetrics([], records, 0);
    expect(m.poor_sleep_rate).toBe(100);
  });

  it("poor_sleep_rate is 0 when no records exist", () => {
    const m = computeSleepMetrics([], [], 0);
    expect(m.poor_sleep_rate).toBeNull(); // fab-0.
  });

  it("poor_sleep_rate does not count fair as poor", () => {
    const records = [
      makeRecord({ id: "r1", sleep_quality: "fair" }),
      makeRecord({ id: "r2", sleep_quality: "fair" }),
    ];
    const m = computeSleepMetrics([], records, 0);
    expect(m.poor_sleep_rate).toBe(0); // records exist → real 0.
  });

  it("poor_sleep_rate rounds to one decimal place", () => {
    const records = [
      makeRecord({ id: "r1", sleep_quality: "poor" }),
      makeRecord({ id: "r2", sleep_quality: "good" }),
      makeRecord({ id: "r3", sleep_quality: "excellent" }),
    ];
    const m = computeSleepMetrics([], records, 0);
    // 1/3 = 33.3%
    expect(m.poor_sleep_rate).toBe(33.3);
  });

  // ── Combined scenarios ──────────────────────────────────────────────

  it("handles a single check with all data populated", () => {
    const check = makeCheck({
      id: "c1",
      check_date: daysAgo(1),
      environment_ok: true,
      security_checked: true,
      temperature_ok: true,
    });
    const record = makeRecord({
      id: "r1",
      sleep_quality: "good",
      total_sleep_hours: 9,
    });
    const m = computeSleepMetrics([check], [record], 1);
    expect(m.total_night_checks).toBe(1);
    expect(m.checks_this_week).toBe(1);
    expect(m.avg_checks_per_night).toBe(1);
    expect(m.environment_compliance_rate).toBe(100);
    expect(m.avg_sleep_quality_score).toBe(4);
    expect(m.avg_sleep_hours).toBe(9);
  });

  it("handles multiple checks on same date correctly for avg_checks_per_night", () => {
    const date = daysAgo(1);
    const checks = [
      makeCheck({ id: "c1", check_date: date, check_time: "00:00" }),
      makeCheck({ id: "c2", check_date: date, check_time: "02:00" }),
      makeCheck({ id: "c3", check_date: date, check_time: "04:00" }),
      makeCheck({ id: "c4", check_date: date, check_time: "06:00" }),
    ];
    const m = computeSleepMetrics(checks, [], 0);
    // 4 checks / 1 night = 4.0
    expect(m.avg_checks_per_night).toBe(4);
  });

  it("by_sleep_quality counts all five quality levels when present", () => {
    const records = [
      makeRecord({ id: "r1", sleep_quality: "excellent" }),
      makeRecord({ id: "r2", sleep_quality: "good" }),
      makeRecord({ id: "r3", sleep_quality: "fair" }),
      makeRecord({ id: "r4", sleep_quality: "poor" }),
      makeRecord({ id: "r5", sleep_quality: "very_poor" }),
    ];
    const m = computeSleepMetrics([], records, 0);
    expect(Object.keys(m.by_sleep_quality)).toHaveLength(5);
    expect(m.by_sleep_quality["excellent"]).toBe(1);
    expect(m.by_sleep_quality["good"]).toBe(1);
    expect(m.by_sleep_quality["fair"]).toBe(1);
    expect(m.by_sleep_quality["poor"]).toBe(1);
    expect(m.by_sleep_quality["very_poor"]).toBe(1);
  });

  it("avg_sleep_quality_score with two values: excellent=5 + poor=2 => 3.5", () => {
    const records = [
      makeRecord({ id: "r1", sleep_quality: "excellent" }),
      makeRecord({ id: "r2", sleep_quality: "poor" }),
    ];
    const m = computeSleepMetrics([], records, 0);
    expect(m.avg_sleep_quality_score).toBe(3.5);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifySleepAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifySleepAlerts", () => {
  const now = new Date("2026-05-13T12:00:00.000Z");

  it("returns no alerts for a fully compliant setup", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_date: daysAgo(1, now),
        environment_ok: true,
        security_checked: true,
        temperature_ok: true,
        child_checks: [{ child_id: "child-1", child_name: "Alice", outcome: "sleeping", notes: "" }],
      }),
    ];
    const records = [
      makeRecord({
        id: "r1",
        child_id: "c1",
        child_name: "Alice",
        record_date: daysAgo(1, now),
        sleep_quality: "good",
        sleep_concern_flagged: false,
      }),
    ];
    const alerts = identifySleepAlerts(checks, records, 1, now);
    expect(alerts).toHaveLength(0);
  });

  // ── no_checks_last_night ────────────────────────────────────────────

  it("raises high alert when checks exist but none from last night", () => {
    const checks = [
      makeCheck({ id: "c1", check_date: daysAgo(3, now) }),
      makeCheck({ id: "c2", check_date: daysAgo(5, now) }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const noChecks = alerts.find((a) => a.type === "no_checks_last_night");
    expect(noChecks).toBeTruthy();
    expect(noChecks!.severity).toBe("high");
  });

  it("no_checks_last_night uses first check id as alert id", () => {
    const checks = [
      makeCheck({ id: "first-check", check_date: daysAgo(5, now) }),
      makeCheck({ id: "second-check", check_date: daysAgo(10, now) }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const noChecks = alerts.find((a) => a.type === "no_checks_last_night");
    expect(noChecks!.id).toBe("first-check");
  });

  it("does not raise no_checks_last_night when check exists for yesterday", () => {
    const checks = [
      makeCheck({ id: "c1", check_date: daysAgo(1, now) }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const noChecks = alerts.find((a) => a.type === "no_checks_last_night");
    expect(noChecks).toBeUndefined();
  });

  it("does not raise no_checks_last_night when checks array is empty", () => {
    const alerts = identifySleepAlerts([], [], 0, now);
    const noChecks = alerts.find((a) => a.type === "no_checks_last_night");
    expect(noChecks).toBeUndefined();
  });

  it("no_checks_last_night message mentions ensuring checks are completed", () => {
    const checks = [makeCheck({ id: "c1", check_date: daysAgo(3, now) })];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const noChecks = alerts.find((a) => a.type === "no_checks_last_night");
    expect(noChecks!.message).toContain("checks");
  });

  it("no_checks_last_night computes yesterday from the now parameter", () => {
    const customNow = new Date("2026-03-15T10:00:00.000Z");
    const checks = [
      makeCheck({ id: "c1", check_date: "2026-03-14" }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, customNow);
    const noChecks = alerts.find((a) => a.type === "no_checks_last_night");
    expect(noChecks).toBeUndefined();
  });

  it("no_checks_last_night triggers when yesterday has no match", () => {
    const customNow = new Date("2026-03-15T10:00:00.000Z");
    const checks = [
      makeCheck({ id: "c1", check_date: "2026-03-13" }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, customNow);
    const noChecks = alerts.find((a) => a.type === "no_checks_last_night");
    expect(noChecks).toBeTruthy();
  });

  // ── environment_issue ───────────────────────────────────────────────

  it("raises medium alert when environment_ok is false", () => {
    const checks = [
      makeCheck({ id: "c1", check_date: daysAgo(1, now), environment_ok: false }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const envIssue = alerts.find((a) => a.type === "environment_issue");
    expect(envIssue).toBeTruthy();
    expect(envIssue!.severity).toBe("medium");
  });

  it("raises medium alert when security_checked is false", () => {
    const checks = [
      makeCheck({ id: "c1", check_date: daysAgo(1, now), security_checked: false }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const envIssue = alerts.find((a) => a.type === "environment_issue");
    expect(envIssue).toBeTruthy();
    expect(envIssue!.severity).toBe("medium");
  });

  it("raises medium alert when temperature_ok is false", () => {
    const checks = [
      makeCheck({ id: "c1", check_date: daysAgo(1, now), temperature_ok: false }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const envIssue = alerts.find((a) => a.type === "environment_issue");
    expect(envIssue).toBeTruthy();
  });

  it("environment_issue message includes the specific issues", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_date: daysAgo(1, now),
        environment_ok: false,
        security_checked: false,
        temperature_ok: true,
      }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const envIssue = alerts.find((a) => a.type === "environment_issue");
    expect(envIssue!.message).toContain("environment");
    expect(envIssue!.message).toContain("security");
  });

  it("environment_issue message includes temperature when temperature_ok is false", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_date: daysAgo(1, now),
        environment_ok: true,
        security_checked: true,
        temperature_ok: false,
      }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const envIssue = alerts.find((a) => a.type === "environment_issue");
    expect(envIssue!.message).toContain("temperature");
  });

  it("does not raise environment_issue when all booleans are true", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_date: daysAgo(1, now),
        environment_ok: true,
        security_checked: true,
        temperature_ok: true,
      }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const envIssue = alerts.find((a) => a.type === "environment_issue");
    expect(envIssue).toBeUndefined();
  });

  it("raises multiple environment_issue alerts for multiple failing checks", () => {
    const checks = [
      makeCheck({ id: "c1", check_date: daysAgo(1, now), environment_ok: false }),
      makeCheck({ id: "c2", check_date: daysAgo(2, now), security_checked: false }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const envIssues = alerts.filter((a) => a.type === "environment_issue");
    expect(envIssues).toHaveLength(2);
  });

  it("environment_issue id matches the check id", () => {
    const checks = [
      makeCheck({ id: "check-abc", check_date: daysAgo(1, now), temperature_ok: false }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const envIssue = alerts.find((a) => a.type === "environment_issue");
    expect(envIssue!.id).toBe("check-abc");
  });

  it("environment_issue message includes check_date and check_time", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_date: "2026-05-10",
        check_time: "03:00",
        environment_ok: false,
      }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const envIssue = alerts.find((a) => a.type === "environment_issue");
    expect(envIssue!.message).toContain("2026-05-10");
    expect(envIssue!.message).toContain("03:00");
  });

  // ── child_not_in_room ───────────────────────────────────────────────

  it("raises critical alert when child outcome is not_in_room", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_date: daysAgo(1, now),
        child_checks: [
          { child_id: "child-1", child_name: "Alice", outcome: "not_in_room", notes: "" },
        ],
      }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const notInRoom = alerts.find((a) => a.type === "child_not_in_room");
    expect(notInRoom).toBeTruthy();
    expect(notInRoom!.severity).toBe("critical");
  });

  it("child_not_in_room message includes child name", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_date: daysAgo(1, now),
        child_checks: [
          { child_id: "child-1", child_name: "Bob Jones", outcome: "not_in_room", notes: "" },
        ],
      }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const notInRoom = alerts.find((a) => a.type === "child_not_in_room");
    expect(notInRoom!.message).toContain("Bob Jones");
  });

  it("child_not_in_room id matches the check id", () => {
    const checks = [
      makeCheck({
        id: "night-check-99",
        check_date: daysAgo(1, now),
        child_checks: [
          { child_id: "child-1", child_name: "Alice", outcome: "not_in_room", notes: "" },
        ],
      }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const notInRoom = alerts.find((a) => a.type === "child_not_in_room");
    expect(notInRoom!.id).toBe("night-check-99");
  });

  it("does not raise child_not_in_room for sleeping outcome", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_date: daysAgo(1, now),
        child_checks: [
          { child_id: "child-1", child_name: "Alice", outcome: "sleeping", notes: "" },
        ],
      }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const notInRoom = alerts.find((a) => a.type === "child_not_in_room");
    expect(notInRoom).toBeUndefined();
  });

  it("does not raise child_not_in_room for awake_settled outcome", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_date: daysAgo(1, now),
        child_checks: [
          { child_id: "child-1", child_name: "Alice", outcome: "awake_settled", notes: "" },
        ],
      }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const notInRoom = alerts.find((a) => a.type === "child_not_in_room");
    expect(notInRoom).toBeUndefined();
  });

  it("does not raise child_not_in_room for awake_unsettled outcome", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_date: daysAgo(1, now),
        child_checks: [
          { child_id: "child-1", child_name: "Alice", outcome: "awake_unsettled", notes: "" },
        ],
      }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const notInRoom = alerts.find((a) => a.type === "child_not_in_room");
    expect(notInRoom).toBeUndefined();
  });

  it("does not raise child_not_in_room for required_support outcome", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_date: daysAgo(1, now),
        child_checks: [
          { child_id: "child-1", child_name: "Alice", outcome: "required_support", notes: "" },
        ],
      }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const notInRoom = alerts.find((a) => a.type === "child_not_in_room");
    expect(notInRoom).toBeUndefined();
  });

  it("raises multiple child_not_in_room alerts for multiple children missing", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_date: daysAgo(1, now),
        child_checks: [
          { child_id: "child-1", child_name: "Alice", outcome: "not_in_room", notes: "" },
          { child_id: "child-2", child_name: "Bob", outcome: "not_in_room", notes: "" },
          { child_id: "child-3", child_name: "Charlie", outcome: "sleeping", notes: "" },
        ],
      }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const notInRoom = alerts.filter((a) => a.type === "child_not_in_room");
    expect(notInRoom).toHaveLength(2);
  });

  it("child_not_in_room message includes check_date and check_time", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_date: "2026-05-10",
        check_time: "02:30",
        child_checks: [
          { child_id: "child-1", child_name: "Alice", outcome: "not_in_room", notes: "" },
        ],
      }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    const notInRoom = alerts.find((a) => a.type === "child_not_in_room");
    expect(notInRoom!.message).toContain("2026-05-10");
    expect(notInRoom!.message).toContain("02:30");
  });

  // ── persistent_poor_sleep ───────────────────────────────────────────

  it("raises high alert when child has 3+ poor/very_poor in last 7 days", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", child_name: "Alice", record_date: daysAgo(1, now), sleep_quality: "poor" }),
      makeRecord({ id: "r2", child_id: "c1", child_name: "Alice", record_date: daysAgo(2, now), sleep_quality: "very_poor" }),
      makeRecord({ id: "r3", child_id: "c1", child_name: "Alice", record_date: daysAgo(3, now), sleep_quality: "poor" }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    const persistent = alerts.find((a) => a.type === "persistent_poor_sleep");
    expect(persistent).toBeTruthy();
    expect(persistent!.severity).toBe("high");
  });

  it("persistent_poor_sleep message includes child name and count", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", child_name: "Bob Jones", record_date: daysAgo(1, now), sleep_quality: "poor" }),
      makeRecord({ id: "r2", child_id: "c1", child_name: "Bob Jones", record_date: daysAgo(2, now), sleep_quality: "poor" }),
      makeRecord({ id: "r3", child_id: "c1", child_name: "Bob Jones", record_date: daysAgo(3, now), sleep_quality: "very_poor" }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    const persistent = alerts.find((a) => a.type === "persistent_poor_sleep");
    expect(persistent!.message).toContain("Bob Jones");
    expect(persistent!.message).toContain("3");
  });

  it("persistent_poor_sleep message suggests health professional referral", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", child_name: "Alice", record_date: daysAgo(1, now), sleep_quality: "poor" }),
      makeRecord({ id: "r2", child_id: "c1", child_name: "Alice", record_date: daysAgo(2, now), sleep_quality: "poor" }),
      makeRecord({ id: "r3", child_id: "c1", child_name: "Alice", record_date: daysAgo(3, now), sleep_quality: "poor" }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    const persistent = alerts.find((a) => a.type === "persistent_poor_sleep");
    expect(persistent!.message).toContain("health professional");
  });

  it("does not raise persistent_poor_sleep with only 2 poor nights", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", child_name: "Alice", record_date: daysAgo(1, now), sleep_quality: "poor" }),
      makeRecord({ id: "r2", child_id: "c1", child_name: "Alice", record_date: daysAgo(2, now), sleep_quality: "poor" }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    const persistent = alerts.find((a) => a.type === "persistent_poor_sleep");
    expect(persistent).toBeUndefined();
  });

  it("does not raise persistent_poor_sleep when poor nights are older than 7 days", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", child_name: "Alice", record_date: daysAgo(10, now), sleep_quality: "poor" }),
      makeRecord({ id: "r2", child_id: "c1", child_name: "Alice", record_date: daysAgo(11, now), sleep_quality: "poor" }),
      makeRecord({ id: "r3", child_id: "c1", child_name: "Alice", record_date: daysAgo(12, now), sleep_quality: "poor" }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    const persistent = alerts.find((a) => a.type === "persistent_poor_sleep");
    expect(persistent).toBeUndefined();
  });

  it("does not raise persistent_poor_sleep for fair quality", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", child_name: "Alice", record_date: daysAgo(1, now), sleep_quality: "fair" }),
      makeRecord({ id: "r2", child_id: "c1", child_name: "Alice", record_date: daysAgo(2, now), sleep_quality: "fair" }),
      makeRecord({ id: "r3", child_id: "c1", child_name: "Alice", record_date: daysAgo(3, now), sleep_quality: "fair" }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    const persistent = alerts.find((a) => a.type === "persistent_poor_sleep");
    expect(persistent).toBeUndefined();
  });

  it("persistent_poor_sleep tracks per child independently", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", child_name: "Alice", record_date: daysAgo(1, now), sleep_quality: "poor" }),
      makeRecord({ id: "r2", child_id: "c1", child_name: "Alice", record_date: daysAgo(2, now), sleep_quality: "poor" }),
      makeRecord({ id: "r3", child_id: "c1", child_name: "Alice", record_date: daysAgo(3, now), sleep_quality: "poor" }),
      makeRecord({ id: "r4", child_id: "c2", child_name: "Bob", record_date: daysAgo(1, now), sleep_quality: "poor" }),
      makeRecord({ id: "r5", child_id: "c2", child_name: "Bob", record_date: daysAgo(2, now), sleep_quality: "poor" }),
    ];
    const alerts = identifySleepAlerts([], records, 2, now);
    const persistent = alerts.filter((a) => a.type === "persistent_poor_sleep");
    // Only Alice has 3+ poor nights, Bob has only 2
    expect(persistent).toHaveLength(1);
    expect(persistent[0].message).toContain("Alice");
  });

  it("persistent_poor_sleep raises for multiple children with 3+ poor nights", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", child_name: "Alice", record_date: daysAgo(1, now), sleep_quality: "poor" }),
      makeRecord({ id: "r2", child_id: "c1", child_name: "Alice", record_date: daysAgo(2, now), sleep_quality: "poor" }),
      makeRecord({ id: "r3", child_id: "c1", child_name: "Alice", record_date: daysAgo(3, now), sleep_quality: "poor" }),
      makeRecord({ id: "r4", child_id: "c2", child_name: "Bob", record_date: daysAgo(1, now), sleep_quality: "very_poor" }),
      makeRecord({ id: "r5", child_id: "c2", child_name: "Bob", record_date: daysAgo(2, now), sleep_quality: "very_poor" }),
      makeRecord({ id: "r6", child_id: "c2", child_name: "Bob", record_date: daysAgo(3, now), sleep_quality: "poor" }),
    ];
    const alerts = identifySleepAlerts([], records, 2, now);
    const persistent = alerts.filter((a) => a.type === "persistent_poor_sleep");
    expect(persistent).toHaveLength(2);
  });

  it("persistent_poor_sleep with exactly 3 poor nights triggers", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", child_name: "Alice", record_date: daysAgo(1, now), sleep_quality: "poor" }),
      makeRecord({ id: "r2", child_id: "c1", child_name: "Alice", record_date: daysAgo(2, now), sleep_quality: "very_poor" }),
      makeRecord({ id: "r3", child_id: "c1", child_name: "Alice", record_date: daysAgo(3, now), sleep_quality: "poor" }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    const persistent = alerts.find((a) => a.type === "persistent_poor_sleep");
    expect(persistent).toBeTruthy();
  });

  it("persistent_poor_sleep with 4 poor nights shows count 4", () => {
    const records = [
      makeRecord({ id: "r1", child_id: "c1", child_name: "Alice", record_date: daysAgo(1, now), sleep_quality: "poor" }),
      makeRecord({ id: "r2", child_id: "c1", child_name: "Alice", record_date: daysAgo(2, now), sleep_quality: "poor" }),
      makeRecord({ id: "r3", child_id: "c1", child_name: "Alice", record_date: daysAgo(3, now), sleep_quality: "poor" }),
      makeRecord({ id: "r4", child_id: "c1", child_name: "Alice", record_date: daysAgo(4, now), sleep_quality: "poor" }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    const persistent = alerts.find((a) => a.type === "persistent_poor_sleep");
    expect(persistent!.message).toContain("4");
  });

  // ── sleep_concern ───────────────────────────────────────────────────

  it("raises high alert for sleep_concern_flagged with high severity", () => {
    const records = [
      makeRecord({
        id: "r1",
        child_id: "c1",
        child_name: "Alice",
        sleep_concern_flagged: true,
        concern_severity: "high",
        concern_details: "Recurring nightmares",
      }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    const concern = alerts.find((a) => a.type === "sleep_concern");
    expect(concern).toBeTruthy();
    expect(concern!.severity).toBe("high");
  });

  it("raises critical alert for sleep_concern_flagged with critical severity", () => {
    const records = [
      makeRecord({
        id: "r1",
        child_id: "c1",
        child_name: "Alice",
        sleep_concern_flagged: true,
        concern_severity: "critical",
        concern_details: "Severe insomnia",
      }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    const concern = alerts.find((a) => a.type === "sleep_concern");
    expect(concern).toBeTruthy();
    expect(concern!.severity).toBe("critical");
  });

  it("sleep_concern message includes child name", () => {
    const records = [
      makeRecord({
        id: "r1",
        child_name: "Charlie Davis",
        sleep_concern_flagged: true,
        concern_severity: "high",
        concern_details: "Poor sleep pattern",
      }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    const concern = alerts.find((a) => a.type === "sleep_concern");
    expect(concern!.message).toContain("Charlie Davis");
  });

  it("sleep_concern message includes concern details", () => {
    const records = [
      makeRecord({
        id: "r1",
        child_name: "Alice",
        sleep_concern_flagged: true,
        concern_severity: "high",
        concern_details: "Recurring nightmares affecting daily function",
      }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    const concern = alerts.find((a) => a.type === "sleep_concern");
    expect(concern!.message).toContain("Recurring nightmares affecting daily function");
  });

  it("sleep_concern message shows 'no details' when concern_details is null", () => {
    const records = [
      makeRecord({
        id: "r1",
        child_name: "Alice",
        sleep_concern_flagged: true,
        concern_severity: "high",
        concern_details: null,
      }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    const concern = alerts.find((a) => a.type === "sleep_concern");
    expect(concern!.message).toContain("no details");
  });

  it("sleep_concern id matches the record id", () => {
    const records = [
      makeRecord({
        id: "sleep-rec-42",
        sleep_concern_flagged: true,
        concern_severity: "critical",
      }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    const concern = alerts.find((a) => a.type === "sleep_concern");
    expect(concern!.id).toBe("sleep-rec-42");
  });

  it("does not raise sleep_concern for low severity", () => {
    const records = [
      makeRecord({
        id: "r1",
        sleep_concern_flagged: true,
        concern_severity: "low",
      }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    const concern = alerts.find((a) => a.type === "sleep_concern");
    expect(concern).toBeUndefined();
  });

  it("does not raise sleep_concern for medium severity", () => {
    const records = [
      makeRecord({
        id: "r1",
        sleep_concern_flagged: true,
        concern_severity: "medium",
      }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    const concern = alerts.find((a) => a.type === "sleep_concern");
    expect(concern).toBeUndefined();
  });

  it("does not raise sleep_concern when flagged is false even with high severity", () => {
    const records = [
      makeRecord({
        id: "r1",
        sleep_concern_flagged: false,
        concern_severity: "high",
      }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    const concern = alerts.find((a) => a.type === "sleep_concern");
    expect(concern).toBeUndefined();
  });

  it("raises multiple sleep_concern alerts for multiple flagged records", () => {
    const records = [
      makeRecord({
        id: "r1",
        child_name: "Alice",
        sleep_concern_flagged: true,
        concern_severity: "high",
        concern_details: "Night terrors",
      }),
      makeRecord({
        id: "r2",
        child_name: "Bob",
        sleep_concern_flagged: true,
        concern_severity: "critical",
        concern_details: "Severe insomnia",
      }),
    ];
    const alerts = identifySleepAlerts([], records, 2, now);
    const concerns = alerts.filter((a) => a.type === "sleep_concern");
    expect(concerns).toHaveLength(2);
  });

  it("sleep_concern message includes the severity level", () => {
    const records = [
      makeRecord({
        id: "r1",
        child_name: "Alice",
        sleep_concern_flagged: true,
        concern_severity: "critical",
        concern_details: "test",
      }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    const concern = alerts.find((a) => a.type === "sleep_concern");
    expect(concern!.message).toContain("critical");
  });

  it("sleep_concern message includes record_date", () => {
    const records = [
      makeRecord({
        id: "r1",
        child_name: "Alice",
        record_date: "2026-05-10",
        sleep_concern_flagged: true,
        concern_severity: "high",
        concern_details: "test",
      }),
    ];
    const alerts = identifySleepAlerts([], records, 1, now);
    const concern = alerts.find((a) => a.type === "sleep_concern");
    expect(concern!.message).toContain("2026-05-10");
  });

  // ── now parameter ───────────────────────────────────────────────────

  it("now parameter defaults correctly (does not throw without it)", () => {
    const checks = [
      makeCheck({ id: "c1", check_date: daysAgo(5) }),
    ];
    const alerts = identifySleepAlerts(checks, [], 0);
    // Should not throw
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("now parameter changes what counts as last night", () => {
    const customNow = new Date("2026-06-01T12:00:00.000Z");
    const checks = [
      makeCheck({ id: "c1", check_date: "2026-05-31" }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, customNow);
    const noChecks = alerts.find((a) => a.type === "no_checks_last_night");
    // Yesterday from 2026-06-01 is 2026-05-31 — match exists
    expect(noChecks).toBeUndefined();
  });

  // ── Combined alerts ─────────────────────────────────────────────────

  it("raises multiple alert types simultaneously", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_date: daysAgo(3, now),
        environment_ok: false,
        child_checks: [
          { child_id: "child-1", child_name: "Alice", outcome: "not_in_room", notes: "" },
        ],
      }),
    ];
    const records = [
      makeRecord({
        id: "r1",
        child_id: "c1",
        child_name: "Alice",
        record_date: daysAgo(1, now),
        sleep_quality: "poor",
        sleep_concern_flagged: true,
        concern_severity: "high",
        concern_details: "Severe issue",
      }),
      makeRecord({ id: "r2", child_id: "c1", child_name: "Alice", record_date: daysAgo(2, now), sleep_quality: "poor" }),
      makeRecord({ id: "r3", child_id: "c1", child_name: "Alice", record_date: daysAgo(3, now), sleep_quality: "poor" }),
    ];
    const alerts = identifySleepAlerts(checks, records, 1, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("no_checks_last_night");
    expect(types).toContain("environment_issue");
    expect(types).toContain("child_not_in_room");
    expect(types).toContain("persistent_poor_sleep");
    expect(types).toContain("sleep_concern");
  });

  it("each alert has required fields: type, severity, message, id", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_date: daysAgo(3, now),
        environment_ok: false,
        child_checks: [
          { child_id: "child-1", child_name: "Alice", outcome: "not_in_room", notes: "" },
        ],
      }),
    ];
    const alerts = identifySleepAlerts(checks, [], 1, now);
    for (const a of alerts) {
      expect(a).toHaveProperty("type");
      expect(a).toHaveProperty("severity");
      expect(a).toHaveProperty("message");
      expect(a).toHaveProperty("id");
      expect(typeof a.type).toBe("string");
      expect(["critical", "high", "medium"]).toContain(a.severity);
      expect(a.message.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listChecks ──────────────────────────────────────────────────────

  it("listChecks returns ok: true with empty array", async () => {
    const result = await listChecks("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listChecks returns ok: true with filters", async () => {
    const result = await listChecks("home-1", { dateFrom: "2026-01-01", dateTo: "2026-12-31", limit: 50 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createCheck ─────────────────────────────────────────────────────

  it("createCheck returns ok: false with error message", async () => {
    const result = await createCheck({
      homeId: "home-1",
      checkDate: "2026-05-12",
      checkTime: "02:00",
      checkedBy: "staff-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createCheck returns error even with full input", async () => {
    const result = await createCheck({
      homeId: "home-1",
      checkDate: "2026-05-12",
      checkTime: "02:00",
      checkedBy: "staff-1",
      childChecks: [{ child_id: "c1", child_name: "Alice", outcome: "sleeping", notes: "" }],
      environmentOk: true,
      securityChecked: true,
      temperatureOk: true,
      notes: "All fine",
    });
    expect(result.ok).toBe(false);
  });

  // ── listRecords ─────────────────────────────────────────────────────

  it("listRecords returns ok: true with empty array", async () => {
    const result = await listRecords("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listRecords returns ok: true with filters", async () => {
    const result = await listRecords("home-1", { childId: "c1", sleepQuality: "good", dateFrom: "2026-01-01", dateTo: "2026-12-31", limit: 25 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createRecord ────────────────────────────────────────────────────

  it("createRecord returns ok: false with error message", async () => {
    const result = await createRecord({
      homeId: "home-1",
      childId: "c1",
      childName: "Alice",
      recordDate: "2026-05-12",
      bedtime: "21:00",
      sleepQuality: "good",
      recordedBy: "staff-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createRecord returns error even with full input", async () => {
    const result = await createRecord({
      homeId: "home-1",
      childId: "c1",
      childName: "Alice Smith",
      recordDate: "2026-05-12",
      bedtime: "21:00",
      settledTime: "21:30",
      wakeTime: "07:00",
      sleepQuality: "excellent",
      disturbances: [
        { time: "01:00", type: "nightmare", duration_minutes: 10, intervention: "comfort", resolved: true },
      ],
      totalSleepHours: 9.5,
      sleepConcernFlagged: false,
      concernSeverity: undefined,
      concernDetails: undefined,
      supportProvided: undefined,
      notes: "Slept well overall",
      recordedBy: "staff-1",
    });
    expect(result.ok).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("computeSleepMetrics handles 0 totalChildren without errors", () => {
    const m = computeSleepMetrics([], [], 0);
    expect(m.total_night_checks).toBe(0);
    expect(m.children_with_concerns).toBe(0);
  });

  it("computeSleepMetrics handles large totalChildren value", () => {
    const m = computeSleepMetrics([], [], 1000);
    expect(m.total_night_checks).toBe(0);
    expect(m.children_with_concerns).toBe(0);
  });

  it("identifySleepAlerts returns empty array with no data", () => {
    const alerts = identifySleepAlerts([], [], 0);
    expect(alerts).toEqual([]);
  });

  it("computeSleepMetrics handles records with empty disturbances array", () => {
    const records = [makeRecord({ id: "r1", disturbances: [] })];
    const m = computeSleepMetrics([], records, 0);
    expect(m.total_disturbances_this_week).toBe(0);
    expect(Object.keys(m.by_disturbance_type)).toHaveLength(0);
  });

  it("computeSleepMetrics handles checks with empty child_checks array", () => {
    const checks = [makeCheck({ id: "c1", child_checks: [] })];
    const m = computeSleepMetrics(checks, [], 0);
    expect(m.total_night_checks).toBe(1);
  });

  it("identifySleepAlerts handles checks with empty child_checks for not_in_room", () => {
    const checks = [makeCheck({ id: "c1", check_date: daysAgo(1), child_checks: [] })];
    const alerts = identifySleepAlerts(checks, [], 1);
    const notInRoom = alerts.find((a) => a.type === "child_not_in_room");
    expect(notInRoom).toBeUndefined();
  });

  it("identifySleepAlerts handles records with no concern_severity when flagged", () => {
    const records = [
      makeRecord({
        id: "r1",
        sleep_concern_flagged: true,
        concern_severity: null,
      }),
    ];
    const alerts = identifySleepAlerts([], records, 1);
    const concern = alerts.find((a) => a.type === "sleep_concern");
    // concern_severity is null, not high/critical, so no alert
    expect(concern).toBeUndefined();
  });

  it("computeSleepMetrics correctly identifies unique nights across week boundary", () => {
    const checks = [
      makeCheck({ id: "c1", check_date: daysAgo(6) }),
      makeCheck({ id: "c2", check_date: daysAgo(6) }),
      makeCheck({ id: "c3", check_date: daysAgo(1) }),
    ];
    const m = computeSleepMetrics(checks, [], 0);
    // All 3 are within 7 days, but only 2 unique nights
    expect(m.checks_this_week).toBe(3);
    expect(m.avg_checks_per_night).toBe(1.5);
  });

  it("identifySleepAlerts uses child_name (not child_id) for persistent_poor_sleep grouping", () => {
    // The service groups by child_name for persistent_poor_sleep
    const records = [
      makeRecord({ id: "r1", child_id: "c1", child_name: "Alice", record_date: daysAgo(1), sleep_quality: "poor" }),
      makeRecord({ id: "r2", child_id: "c1", child_name: "Alice", record_date: daysAgo(2), sleep_quality: "poor" }),
      makeRecord({ id: "r3", child_id: "c1", child_name: "Alice", record_date: daysAgo(3), sleep_quality: "poor" }),
    ];
    const alerts = identifySleepAlerts([], records, 1);
    const persistent = alerts.find((a) => a.type === "persistent_poor_sleep");
    expect(persistent).toBeTruthy();
    expect(persistent!.message).toContain("Alice");
  });

  it("environment_compliance_rate counts across all checks not just recent ones", () => {
    const checks = [
      makeCheck({ id: "c1", check_date: daysAgo(1), environment_ok: true, security_checked: true, temperature_ok: true }),
      makeCheck({ id: "c2", check_date: daysAgo(30), environment_ok: false, security_checked: true, temperature_ok: true }),
    ];
    const m = computeSleepMetrics(checks, [], 0);
    // 1/2 = 50%
    expect(m.environment_compliance_rate).toBe(50);
  });
});
