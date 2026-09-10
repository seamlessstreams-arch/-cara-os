// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF WELLBEING SERVICE TESTS
// Pure-function unit tests for staff wellbeing metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 33 (employment of staff — support and
// welfare), Reg 34 (employment policies), Health and Safety at Work Act 1974.
// SCCIF: Well-Led — "Staff are well supported, feel valued, and are able
// to fulfil their roles effectively." "Staff wellbeing is prioritised."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";
import { todayStr } from "@/lib/utils";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  WELLBEING_RATINGS,
  STRESS_LEVELS,
  SUPPORT_TYPES,
  DEBRIEF_TRIGGERS,
  listChecks,
  createCheck,
  listDebriefs,
  createDebrief,
} from "../staff-wellbeing-service";

import type {
  WellbeingCheck,
  DebriefRecord,
} from "../staff-wellbeing-service";

const { computeWellbeingMetrics, identifyWellbeingAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  // UTC throughout: parsing todayStr() gives UTC midnight, so the day shift
  // must stay in UTC too — a local setDate lands an hour off across a DST
  // boundary and toISOString().slice(0,10) then names the wrong day.
  const [y, m, d] = todayStr().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - n)).toISOString().slice(0, 10);
}

/** Date string N days in the future from now. */
function daysFromNow(n: number): string {
  // UTC throughout: parsing todayStr() gives UTC midnight, so the day shift
  // must stay in UTC too — a local setDate lands an hour off across a DST
  // boundary and toISOString().slice(0,10) then names the wrong day.
  const [y, m, d] = todayStr().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal WellbeingCheck with sensible defaults. */
function makeCheck(overrides: Partial<WellbeingCheck> = {}): WellbeingCheck {
  return {
    id: "check-1",
    home_id: "home-1",
    staff_member: "staff-1",
    check_date: daysAgo(5),
    checked_by: "manager-1",
    wellbeing_rating: "good",
    stress_level: "low",
    workload_manageable: true,
    sleep_quality: "good",
    feeling_supported: true,
    concerns: null,
    support_offered: [],
    support_accepted: false,
    follow_up_date: null,
    follow_up_completed: false,
    notes: null,
    created_at: daysAgoISO(5),
    ...overrides,
  };
}

/** Build a minimal DebriefRecord with sensible defaults. */
function makeDebrief(overrides: Partial<DebriefRecord> = {}): DebriefRecord {
  return {
    id: "debrief-1",
    home_id: "home-1",
    debrief_date: daysAgo(5),
    staff_members: ["staff-1"],
    facilitated_by: "manager-1",
    trigger: "critical_incident",
    incident_date: daysAgo(6),
    incident_summary: "An incident occurred requiring debrief",
    emotional_impact: null,
    lessons_learned: null,
    support_needs_identified: null,
    actions_agreed: [],
    follow_up_required: false,
    follow_up_date: null,
    follow_up_completed: false,
    notes: null,
    created_at: daysAgoISO(5),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("WELLBEING_RATINGS", () => {
  it("has exactly 5 ratings", () => {
    expect(WELLBEING_RATINGS).toHaveLength(5);
  });

  it("contains unique rating values", () => {
    const values = WELLBEING_RATINGS.map((r) => r.rating);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = WELLBEING_RATINGS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes excellent", () => {
    expect(WELLBEING_RATINGS.find((r) => r.rating === "excellent")).toBeTruthy();
  });

  it("includes good", () => {
    expect(WELLBEING_RATINGS.find((r) => r.rating === "good")).toBeTruthy();
  });

  it("includes fair", () => {
    expect(WELLBEING_RATINGS.find((r) => r.rating === "fair")).toBeTruthy();
  });

  it("includes struggling", () => {
    expect(WELLBEING_RATINGS.find((r) => r.rating === "struggling")).toBeTruthy();
  });

  it("includes crisis", () => {
    expect(WELLBEING_RATINGS.find((r) => r.rating === "crisis")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const r of WELLBEING_RATINGS) {
      expect(r.label.length).toBeGreaterThan(0);
    }
  });
});

describe("STRESS_LEVELS", () => {
  it("has exactly 5 levels", () => {
    expect(STRESS_LEVELS).toHaveLength(5);
  });

  it("contains unique level values", () => {
    const values = STRESS_LEVELS.map((s) => s.level);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = STRESS_LEVELS.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes very_low", () => {
    expect(STRESS_LEVELS.find((s) => s.level === "very_low")).toBeTruthy();
  });

  it("includes low", () => {
    expect(STRESS_LEVELS.find((s) => s.level === "low")).toBeTruthy();
  });

  it("includes moderate", () => {
    expect(STRESS_LEVELS.find((s) => s.level === "moderate")).toBeTruthy();
  });

  it("includes high", () => {
    expect(STRESS_LEVELS.find((s) => s.level === "high")).toBeTruthy();
  });

  it("includes very_high", () => {
    expect(STRESS_LEVELS.find((s) => s.level === "very_high")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of STRESS_LEVELS) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("SUPPORT_TYPES", () => {
  it("has exactly 10 types", () => {
    expect(SUPPORT_TYPES).toHaveLength(10);
  });

  it("contains unique type values", () => {
    const values = SUPPORT_TYPES.map((t) => t.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = SUPPORT_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes supervision", () => {
    expect(SUPPORT_TYPES.find((t) => t.type === "supervision")).toBeTruthy();
  });

  it("includes debrief", () => {
    expect(SUPPORT_TYPES.find((t) => t.type === "debrief")).toBeTruthy();
  });

  it("includes eap_referral", () => {
    expect(SUPPORT_TYPES.find((t) => t.type === "eap_referral")).toBeTruthy();
  });

  it("includes counselling", () => {
    expect(SUPPORT_TYPES.find((t) => t.type === "counselling")).toBeTruthy();
  });

  it("includes peer_support", () => {
    expect(SUPPORT_TYPES.find((t) => t.type === "peer_support")).toBeTruthy();
  });

  it("includes occupational_health", () => {
    expect(SUPPORT_TYPES.find((t) => t.type === "occupational_health")).toBeTruthy();
  });

  it("includes time_off", () => {
    expect(SUPPORT_TYPES.find((t) => t.type === "time_off")).toBeTruthy();
  });

  it("includes workload_adjustment", () => {
    expect(SUPPORT_TYPES.find((t) => t.type === "workload_adjustment")).toBeTruthy();
  });

  it("includes training", () => {
    expect(SUPPORT_TYPES.find((t) => t.type === "training")).toBeTruthy();
  });

  it("includes other", () => {
    expect(SUPPORT_TYPES.find((t) => t.type === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const t of SUPPORT_TYPES) {
      expect(t.label.length).toBeGreaterThan(0);
    }
  });
});

describe("DEBRIEF_TRIGGERS", () => {
  it("has exactly 9 triggers", () => {
    expect(DEBRIEF_TRIGGERS).toHaveLength(9);
  });

  it("contains unique trigger values", () => {
    const values = DEBRIEF_TRIGGERS.map((t) => t.trigger);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = DEBRIEF_TRIGGERS.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes critical_incident", () => {
    expect(DEBRIEF_TRIGGERS.find((t) => t.trigger === "critical_incident")).toBeTruthy();
  });

  it("includes restraint", () => {
    expect(DEBRIEF_TRIGGERS.find((t) => t.trigger === "restraint")).toBeTruthy();
  });

  it("includes safeguarding", () => {
    expect(DEBRIEF_TRIGGERS.find((t) => t.trigger === "safeguarding")).toBeTruthy();
  });

  it("includes bereavement", () => {
    expect(DEBRIEF_TRIGGERS.find((t) => t.trigger === "bereavement")).toBeTruthy();
  });

  it("includes violence_aggression", () => {
    expect(DEBRIEF_TRIGGERS.find((t) => t.trigger === "violence_aggression")).toBeTruthy();
  });

  it("includes missing_child", () => {
    expect(DEBRIEF_TRIGGERS.find((t) => t.trigger === "missing_child")).toBeTruthy();
  });

  it("includes self_harm", () => {
    expect(DEBRIEF_TRIGGERS.find((t) => t.trigger === "self_harm")).toBeTruthy();
  });

  it("includes complaint", () => {
    expect(DEBRIEF_TRIGGERS.find((t) => t.trigger === "complaint")).toBeTruthy();
  });

  it("includes other", () => {
    expect(DEBRIEF_TRIGGERS.find((t) => t.trigger === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const t of DEBRIEF_TRIGGERS) {
      expect(t.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeWellbeingMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeWellbeingMetrics", () => {
  // ── Zeroed / empty ──────────────────────────────────────────────────────

  it("returns zeroed metrics for empty arrays", () => {
    const m = computeWellbeingMetrics([], [], 0);
    expect(m.staff_checked).toBe(0);
    expect(m.checks_this_quarter).toBe(0);
    expect(m.avg_wellbeing_score).toBeNull();
    expect(m.avg_stress_score).toBeNull();
    expect(m.staff_struggling_or_crisis).toBe(0);
    expect(m.high_stress_count).toBe(0);
    expect(m.workload_manageable_rate).toBeNull();; expect(m.feeling_supported_rate).toBeNull();; expect(m.support_acceptance_rate).toBeNull();; expect(m.debriefs_this_quarter).toBe(0);
    expect(Object.keys(m.by_wellbeing_rating)).toHaveLength(0);
    expect(Object.keys(m.by_stress_level)).toHaveLength(0);
    expect(m.overdue_follow_ups).toBe(0);
  });

  // ── staff_checked ───────────────────────────────────────────────────────

  it("counts unique staff members checked", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "staff-1" }),
      makeCheck({ id: "c2", staff_member: "staff-2" }),
      makeCheck({ id: "c3", staff_member: "staff-3" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.staff_checked).toBe(3);
  });

  it("does not double-count the same staff member", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "staff-1" }),
      makeCheck({ id: "c2", staff_member: "staff-1" }),
      makeCheck({ id: "c3", staff_member: "staff-2" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.staff_checked).toBe(2);
  });

  it("returns 0 staff_checked when no checks", () => {
    const m = computeWellbeingMetrics([], [], 10);
    expect(m.staff_checked).toBe(0);
  });

  // ── checks_this_quarter ─────────────────────────────────────────────────

  it("counts checks within the last 90 days", () => {
    const checks = [
      makeCheck({ id: "c1", check_date: daysAgo(10) }),
      makeCheck({ id: "c2", check_date: daysAgo(50) }),
      makeCheck({ id: "c3", check_date: daysAgo(89) }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.checks_this_quarter).toBe(3);
  });

  it("excludes checks older than 90 days from quarter count", () => {
    const checks = [
      makeCheck({ id: "c1", check_date: daysAgo(10) }),
      makeCheck({ id: "c2", check_date: daysAgo(100) }),
      makeCheck({ id: "c3", check_date: daysAgo(200) }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.checks_this_quarter).toBe(1);
  });

  it("returns 0 checks_this_quarter when all checks are old", () => {
    const checks = [
      makeCheck({ id: "c1", check_date: daysAgo(100) }),
      makeCheck({ id: "c2", check_date: daysAgo(150) }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.checks_this_quarter).toBe(0);
  });

  // ── avg_wellbeing_score ─────────────────────────────────────────────────

  it("calculates avg_wellbeing_score for all excellent (5)", () => {
    const checks = [
      makeCheck({ id: "c1", wellbeing_rating: "excellent" }),
      makeCheck({ id: "c2", wellbeing_rating: "excellent" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.avg_wellbeing_score).toBe(5);
  });

  it("calculates avg_wellbeing_score for all good (4)", () => {
    const checks = [
      makeCheck({ id: "c1", wellbeing_rating: "good" }),
      makeCheck({ id: "c2", wellbeing_rating: "good" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.avg_wellbeing_score).toBe(4);
  });

  it("calculates avg_wellbeing_score for all fair (3)", () => {
    const checks = [
      makeCheck({ id: "c1", wellbeing_rating: "fair" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.avg_wellbeing_score).toBe(3);
  });

  it("calculates avg_wellbeing_score for all struggling (2)", () => {
    const checks = [
      makeCheck({ id: "c1", wellbeing_rating: "struggling" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.avg_wellbeing_score).toBe(2);
  });

  it("calculates avg_wellbeing_score for all crisis (1)", () => {
    const checks = [
      makeCheck({ id: "c1", wellbeing_rating: "crisis" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.avg_wellbeing_score).toBe(1);
  });

  it("calculates avg_wellbeing_score for mixed ratings", () => {
    const checks = [
      makeCheck({ id: "c1", wellbeing_rating: "excellent" }), // 5
      makeCheck({ id: "c2", wellbeing_rating: "good" }),      // 4
      makeCheck({ id: "c3", wellbeing_rating: "fair" }),       // 3
      makeCheck({ id: "c4", wellbeing_rating: "struggling" }), // 2
      makeCheck({ id: "c5", wellbeing_rating: "crisis" }),     // 1
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    // (5+4+3+2+1)/5 = 3.0
    expect(m.avg_wellbeing_score).toBe(3);
  });

  it("rounds avg_wellbeing_score to one decimal place", () => {
    const checks = [
      makeCheck({ id: "c1", wellbeing_rating: "excellent" }), // 5
      makeCheck({ id: "c2", wellbeing_rating: "fair" }),       // 3
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    // (5+3)/2 = 4.0
    expect(m.avg_wellbeing_score).toBe(4);
  });

  it("returns 0 avg_wellbeing_score when no checks", () => {
    const m = computeWellbeingMetrics([], [], 5);
    expect(m.avg_wellbeing_score).toBeNull();
  });

  it("avg_wellbeing_score with good and struggling rounds correctly", () => {
    const checks = [
      makeCheck({ id: "c1", wellbeing_rating: "good" }),       // 4
      makeCheck({ id: "c2", wellbeing_rating: "struggling" }), // 2
      makeCheck({ id: "c3", wellbeing_rating: "fair" }),        // 3
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    // (4+2+3)/3 = 3.0
    expect(m.avg_wellbeing_score).toBe(3);
  });

  // ── avg_stress_score ────────────────────────────────────────────────────

  it("calculates avg_stress_score for all very_low (1)", () => {
    const checks = [
      makeCheck({ id: "c1", stress_level: "very_low" }),
      makeCheck({ id: "c2", stress_level: "very_low" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.avg_stress_score).toBe(1);
  });

  it("calculates avg_stress_score for all low (2)", () => {
    const checks = [
      makeCheck({ id: "c1", stress_level: "low" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.avg_stress_score).toBe(2);
  });

  it("calculates avg_stress_score for all moderate (3)", () => {
    const checks = [
      makeCheck({ id: "c1", stress_level: "moderate" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.avg_stress_score).toBe(3);
  });

  it("calculates avg_stress_score for all high (4)", () => {
    const checks = [
      makeCheck({ id: "c1", stress_level: "high" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.avg_stress_score).toBe(4);
  });

  it("calculates avg_stress_score for all very_high (5)", () => {
    const checks = [
      makeCheck({ id: "c1", stress_level: "very_high" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.avg_stress_score).toBe(5);
  });

  it("calculates avg_stress_score for mixed levels", () => {
    const checks = [
      makeCheck({ id: "c1", stress_level: "very_low" }),  // 1
      makeCheck({ id: "c2", stress_level: "low" }),        // 2
      makeCheck({ id: "c3", stress_level: "moderate" }),   // 3
      makeCheck({ id: "c4", stress_level: "high" }),       // 4
      makeCheck({ id: "c5", stress_level: "very_high" }),  // 5
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    // (1+2+3+4+5)/5 = 3.0
    expect(m.avg_stress_score).toBe(3);
  });

  it("returns 0 avg_stress_score when no checks", () => {
    const m = computeWellbeingMetrics([], [], 5);
    expect(m.avg_stress_score).toBeNull();
  });

  it("rounds avg_stress_score to one decimal place", () => {
    const checks = [
      makeCheck({ id: "c1", stress_level: "low" }),      // 2
      makeCheck({ id: "c2", stress_level: "moderate" }), // 3
      makeCheck({ id: "c3", stress_level: "high" }),     // 4
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    // (2+3+4)/3 = 3.0
    expect(m.avg_stress_score).toBe(3);
  });

  // ── staff_struggling_or_crisis ──────────────────────────────────────────

  it("counts struggling staff", () => {
    const checks = [
      makeCheck({ id: "c1", wellbeing_rating: "struggling" }),
      makeCheck({ id: "c2", wellbeing_rating: "good" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.staff_struggling_or_crisis).toBe(1);
  });

  it("counts crisis staff", () => {
    const checks = [
      makeCheck({ id: "c1", wellbeing_rating: "crisis" }),
      makeCheck({ id: "c2", wellbeing_rating: "good" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.staff_struggling_or_crisis).toBe(1);
  });

  it("counts both struggling and crisis staff", () => {
    const checks = [
      makeCheck({ id: "c1", wellbeing_rating: "struggling" }),
      makeCheck({ id: "c2", wellbeing_rating: "crisis" }),
      makeCheck({ id: "c3", wellbeing_rating: "good" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.staff_struggling_or_crisis).toBe(2);
  });

  it("does not count excellent, good, or fair as struggling_or_crisis", () => {
    const checks = [
      makeCheck({ id: "c1", wellbeing_rating: "excellent" }),
      makeCheck({ id: "c2", wellbeing_rating: "good" }),
      makeCheck({ id: "c3", wellbeing_rating: "fair" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.staff_struggling_or_crisis).toBe(0);
  });

  // ── high_stress_count ───────────────────────────────────────────────────

  it("counts high stress", () => {
    const checks = [
      makeCheck({ id: "c1", stress_level: "high" }),
      makeCheck({ id: "c2", stress_level: "low" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.high_stress_count).toBe(1);
  });

  it("counts very_high stress", () => {
    const checks = [
      makeCheck({ id: "c1", stress_level: "very_high" }),
      makeCheck({ id: "c2", stress_level: "low" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.high_stress_count).toBe(1);
  });

  it("counts both high and very_high stress", () => {
    const checks = [
      makeCheck({ id: "c1", stress_level: "high" }),
      makeCheck({ id: "c2", stress_level: "very_high" }),
      makeCheck({ id: "c3", stress_level: "moderate" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.high_stress_count).toBe(2);
  });

  it("does not count very_low, low, or moderate as high stress", () => {
    const checks = [
      makeCheck({ id: "c1", stress_level: "very_low" }),
      makeCheck({ id: "c2", stress_level: "low" }),
      makeCheck({ id: "c3", stress_level: "moderate" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.high_stress_count).toBe(0);
  });

  // ── workload_manageable_rate ────────────────────────────────────────────

  it("calculates 100% workload_manageable_rate when all manageable", () => {
    const checks = [
      makeCheck({ id: "c1", workload_manageable: true }),
      makeCheck({ id: "c2", workload_manageable: true }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.workload_manageable_rate).toBe(100);
  });

  it("calculates 0% workload_manageable_rate when none manageable", () => {
    const checks = [
      makeCheck({ id: "c1", workload_manageable: false }),
      makeCheck({ id: "c2", workload_manageable: false }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.workload_manageable_rate).toBe(0);
  });

  it("calculates workload_manageable_rate for mixed", () => {
    const checks = [
      makeCheck({ id: "c1", workload_manageable: true }),
      makeCheck({ id: "c2", workload_manageable: false }),
      makeCheck({ id: "c3", workload_manageable: true }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    // 2/3 = 66.7%
    expect(m.workload_manageable_rate).toBe(66.7);
  });

  it("returns 0 workload_manageable_rate when no checks", () => {
    const m = computeWellbeingMetrics([], [], 5);
    expect(m.workload_manageable_rate).toBeNull();
  });

  // ── feeling_supported_rate ──────────────────────────────────────────────

  it("calculates 100% feeling_supported_rate when all supported", () => {
    const checks = [
      makeCheck({ id: "c1", feeling_supported: true }),
      makeCheck({ id: "c2", feeling_supported: true }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.feeling_supported_rate).toBe(100);
  });

  it("calculates 0% feeling_supported_rate when none supported", () => {
    const checks = [
      makeCheck({ id: "c1", feeling_supported: false }),
      makeCheck({ id: "c2", feeling_supported: false }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.feeling_supported_rate).toBe(0);
  });

  it("calculates feeling_supported_rate for mixed", () => {
    const checks = [
      makeCheck({ id: "c1", feeling_supported: true }),
      makeCheck({ id: "c2", feeling_supported: false }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    // 1/2 = 50%
    expect(m.feeling_supported_rate).toBe(50);
  });

  it("returns 0 feeling_supported_rate when no checks", () => {
    const m = computeWellbeingMetrics([], [], 5);
    expect(m.feeling_supported_rate).toBeNull();
  });

  // ── support_acceptance_rate ─────────────────────────────────────────────

  it("returns 0 support_acceptance_rate when no support was offered", () => {
    const checks = [
      makeCheck({ id: "c1", support_offered: [], support_accepted: false }),
      makeCheck({ id: "c2", support_offered: [], support_accepted: false }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.support_acceptance_rate).toBeNull();
  });

  it("calculates 100% support_acceptance_rate when all accepted", () => {
    const checks = [
      makeCheck({ id: "c1", support_offered: ["supervision"], support_accepted: true }),
      makeCheck({ id: "c2", support_offered: ["counselling"], support_accepted: true }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.support_acceptance_rate).toBe(100);
  });

  it("calculates 0% support_acceptance_rate when all declined", () => {
    const checks = [
      makeCheck({ id: "c1", support_offered: ["supervision"], support_accepted: false }),
      makeCheck({ id: "c2", support_offered: ["counselling"], support_accepted: false }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.support_acceptance_rate).toBe(0);
  });

  it("calculates support_acceptance_rate for mixed", () => {
    const checks = [
      makeCheck({ id: "c1", support_offered: ["supervision"], support_accepted: true }),
      makeCheck({ id: "c2", support_offered: ["counselling"], support_accepted: false }),
      makeCheck({ id: "c3", support_offered: ["eap_referral"], support_accepted: true }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    // 2/3 = 66.7%
    expect(m.support_acceptance_rate).toBe(66.7);
  });

  it("only considers checks where support was offered for acceptance rate", () => {
    const checks = [
      makeCheck({ id: "c1", support_offered: ["supervision"], support_accepted: true }),
      makeCheck({ id: "c2", support_offered: [], support_accepted: false }), // not counted
      makeCheck({ id: "c3", support_offered: ["counselling"], support_accepted: false }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    // 1 accepted out of 2 offered = 50%
    expect(m.support_acceptance_rate).toBe(50);
  });

  // ── debriefs_this_quarter ───────────────────────────────────────────────

  it("counts debriefs within the last 90 days", () => {
    const debriefs = [
      makeDebrief({ id: "d1", debrief_date: daysAgo(10) }),
      makeDebrief({ id: "d2", debrief_date: daysAgo(50) }),
      makeDebrief({ id: "d3", debrief_date: daysAgo(89) }),
    ];
    const m = computeWellbeingMetrics([], debriefs, 5);
    expect(m.debriefs_this_quarter).toBe(3);
  });

  it("excludes debriefs older than 90 days", () => {
    const debriefs = [
      makeDebrief({ id: "d1", debrief_date: daysAgo(10) }),
      makeDebrief({ id: "d2", debrief_date: daysAgo(100) }),
      makeDebrief({ id: "d3", debrief_date: daysAgo(200) }),
    ];
    const m = computeWellbeingMetrics([], debriefs, 5);
    expect(m.debriefs_this_quarter).toBe(1);
  });

  it("returns 0 debriefs_this_quarter when no debriefs", () => {
    const m = computeWellbeingMetrics([], [], 5);
    expect(m.debriefs_this_quarter).toBe(0);
  });

  // ── by_wellbeing_rating ─────────────────────────────────────────────────

  it("tallies by_wellbeing_rating for each rating", () => {
    const checks = [
      makeCheck({ id: "c1", wellbeing_rating: "excellent" }),
      makeCheck({ id: "c2", wellbeing_rating: "good" }),
      makeCheck({ id: "c3", wellbeing_rating: "good" }),
      makeCheck({ id: "c4", wellbeing_rating: "crisis" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.by_wellbeing_rating["excellent"]).toBe(1);
    expect(m.by_wellbeing_rating["good"]).toBe(2);
    expect(m.by_wellbeing_rating["crisis"]).toBe(1);
  });

  it("by_wellbeing_rating is empty when no checks", () => {
    const m = computeWellbeingMetrics([], [], 5);
    expect(Object.keys(m.by_wellbeing_rating)).toHaveLength(0);
  });

  it("by_wellbeing_rating only includes ratings present in data", () => {
    const checks = [
      makeCheck({ id: "c1", wellbeing_rating: "fair" }),
      makeCheck({ id: "c2", wellbeing_rating: "fair" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.by_wellbeing_rating["fair"]).toBe(2);
    expect(m.by_wellbeing_rating["excellent"]).toBeUndefined();
    expect(m.by_wellbeing_rating["crisis"]).toBeUndefined();
  });

  // ── by_stress_level ─────────────────────────────────────────────────────

  it("tallies by_stress_level for each level", () => {
    const checks = [
      makeCheck({ id: "c1", stress_level: "very_low" }),
      makeCheck({ id: "c2", stress_level: "high" }),
      makeCheck({ id: "c3", stress_level: "high" }),
      makeCheck({ id: "c4", stress_level: "very_high" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.by_stress_level["very_low"]).toBe(1);
    expect(m.by_stress_level["high"]).toBe(2);
    expect(m.by_stress_level["very_high"]).toBe(1);
  });

  it("by_stress_level is empty when no checks", () => {
    const m = computeWellbeingMetrics([], [], 5);
    expect(Object.keys(m.by_stress_level)).toHaveLength(0);
  });

  it("by_stress_level only includes levels present in data", () => {
    const checks = [
      makeCheck({ id: "c1", stress_level: "moderate" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.by_stress_level["moderate"]).toBe(1);
    expect(m.by_stress_level["very_low"]).toBeUndefined();
    expect(m.by_stress_level["very_high"]).toBeUndefined();
  });

  // ── overdue_follow_ups ──────────────────────────────────────────────────

  it("counts overdue follow-ups from checks", () => {
    const checks = [
      makeCheck({ id: "c1", follow_up_date: daysAgo(5), follow_up_completed: false }),
      makeCheck({ id: "c2", follow_up_date: daysAgo(10), follow_up_completed: false }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.overdue_follow_ups).toBe(2);
  });

  it("does not count completed check follow-ups as overdue", () => {
    const checks = [
      makeCheck({ id: "c1", follow_up_date: daysAgo(5), follow_up_completed: true }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.overdue_follow_ups).toBe(0);
  });

  it("does not count future check follow-ups as overdue", () => {
    const checks = [
      makeCheck({ id: "c1", follow_up_date: daysFromNow(5), follow_up_completed: false }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.overdue_follow_ups).toBe(0);
  });

  it("does not count checks without follow_up_date as overdue", () => {
    const checks = [
      makeCheck({ id: "c1", follow_up_date: null, follow_up_completed: false }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(m.overdue_follow_ups).toBe(0);
  });

  it("counts overdue follow-ups from debriefs", () => {
    const debriefs = [
      makeDebrief({
        id: "d1",
        follow_up_required: true,
        follow_up_date: daysAgo(5),
        follow_up_completed: false,
      }),
    ];
    const m = computeWellbeingMetrics([], debriefs, 5);
    expect(m.overdue_follow_ups).toBe(1);
  });

  it("does not count debrief follow-ups that are not required", () => {
    const debriefs = [
      makeDebrief({
        id: "d1",
        follow_up_required: false,
        follow_up_date: daysAgo(5),
        follow_up_completed: false,
      }),
    ];
    const m = computeWellbeingMetrics([], debriefs, 5);
    expect(m.overdue_follow_ups).toBe(0);
  });

  it("does not count completed debrief follow-ups as overdue", () => {
    const debriefs = [
      makeDebrief({
        id: "d1",
        follow_up_required: true,
        follow_up_date: daysAgo(5),
        follow_up_completed: true,
      }),
    ];
    const m = computeWellbeingMetrics([], debriefs, 5);
    expect(m.overdue_follow_ups).toBe(0);
  });

  it("does not count future debrief follow-ups as overdue", () => {
    const debriefs = [
      makeDebrief({
        id: "d1",
        follow_up_required: true,
        follow_up_date: daysFromNow(5),
        follow_up_completed: false,
      }),
    ];
    const m = computeWellbeingMetrics([], debriefs, 5);
    expect(m.overdue_follow_ups).toBe(0);
  });

  it("combines overdue follow-ups from both checks and debriefs", () => {
    const checks = [
      makeCheck({ id: "c1", follow_up_date: daysAgo(5), follow_up_completed: false }),
    ];
    const debriefs = [
      makeDebrief({
        id: "d1",
        follow_up_required: true,
        follow_up_date: daysAgo(3),
        follow_up_completed: false,
      }),
    ];
    const m = computeWellbeingMetrics(checks, debriefs, 5);
    expect(m.overdue_follow_ups).toBe(2);
  });

  // ── Comprehensive / combo tests ─────────────────────────────────────────

  it("handles a single check with all data populated", () => {
    const check = makeCheck({
      id: "c1",
      staff_member: "staff-1",
      check_date: daysAgo(10),
      wellbeing_rating: "good",
      stress_level: "low",
      workload_manageable: true,
      feeling_supported: true,
      support_offered: ["supervision"],
      support_accepted: true,
    });
    const m = computeWellbeingMetrics([check], [], 3);
    expect(m.staff_checked).toBe(1);
    expect(m.checks_this_quarter).toBe(1);
    expect(m.avg_wellbeing_score).toBe(4);
    expect(m.avg_stress_score).toBe(2);
    expect(m.staff_struggling_or_crisis).toBe(0);
    expect(m.high_stress_count).toBe(0);
    expect(m.workload_manageable_rate).toBe(100);
    expect(m.feeling_supported_rate).toBe(100);
    expect(m.support_acceptance_rate).toBe(100);
  });

  it("workload_manageable_rate rounds to one decimal place", () => {
    const checks = [
      makeCheck({ id: "c1", workload_manageable: true }),
      makeCheck({ id: "c2", workload_manageable: true }),
      makeCheck({ id: "c3", workload_manageable: false }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    // 2/3 = 66.7%
    expect(m.workload_manageable_rate).toBe(66.7);
  });

  it("feeling_supported_rate rounds to one decimal place", () => {
    const checks = [
      makeCheck({ id: "c1", feeling_supported: true }),
      makeCheck({ id: "c2", feeling_supported: false }),
      makeCheck({ id: "c3", feeling_supported: false }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    // 1/3 = 33.3%
    expect(m.feeling_supported_rate).toBe(33.3);
  });

  it("support_acceptance_rate rounds to one decimal place", () => {
    const checks = [
      makeCheck({ id: "c1", support_offered: ["supervision"], support_accepted: true }),
      makeCheck({ id: "c2", support_offered: ["counselling"], support_accepted: false }),
      makeCheck({ id: "c3", support_offered: ["eap_referral"], support_accepted: false }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    // 1/3 = 33.3%
    expect(m.support_acceptance_rate).toBe(33.3);
  });

  it("by_wellbeing_rating counts all 5 rating types when present", () => {
    const checks = [
      makeCheck({ id: "c1", wellbeing_rating: "excellent" }),
      makeCheck({ id: "c2", wellbeing_rating: "good" }),
      makeCheck({ id: "c3", wellbeing_rating: "fair" }),
      makeCheck({ id: "c4", wellbeing_rating: "struggling" }),
      makeCheck({ id: "c5", wellbeing_rating: "crisis" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(Object.keys(m.by_wellbeing_rating)).toHaveLength(5);
    expect(m.by_wellbeing_rating["excellent"]).toBe(1);
    expect(m.by_wellbeing_rating["good"]).toBe(1);
    expect(m.by_wellbeing_rating["fair"]).toBe(1);
    expect(m.by_wellbeing_rating["struggling"]).toBe(1);
    expect(m.by_wellbeing_rating["crisis"]).toBe(1);
  });

  it("by_stress_level counts all 5 level types when present", () => {
    const checks = [
      makeCheck({ id: "c1", stress_level: "very_low" }),
      makeCheck({ id: "c2", stress_level: "low" }),
      makeCheck({ id: "c3", stress_level: "moderate" }),
      makeCheck({ id: "c4", stress_level: "high" }),
      makeCheck({ id: "c5", stress_level: "very_high" }),
    ];
    const m = computeWellbeingMetrics(checks, [], 5);
    expect(Object.keys(m.by_stress_level)).toHaveLength(5);
    expect(m.by_stress_level["very_low"]).toBe(1);
    expect(m.by_stress_level["low"]).toBe(1);
    expect(m.by_stress_level["moderate"]).toBe(1);
    expect(m.by_stress_level["high"]).toBe(1);
    expect(m.by_stress_level["very_high"]).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyWellbeingAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyWellbeingAlerts", () => {
  const now = new Date();

  // ── No alerts scenario ──────────────────────────────────────────────────

  it("returns no alerts for a fully healthy team", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "staff-1", wellbeing_rating: "good", stress_level: "low" }),
      makeCheck({ id: "c2", staff_member: "staff-2", wellbeing_rating: "excellent", stress_level: "very_low" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 2, now);
    expect(alerts).toHaveLength(0);
  });

  // ── staff_crisis ────────────────────────────────────────────────────────

  it("raises critical alert for staff in crisis", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "Jane", wellbeing_rating: "crisis", check_date: "2025-03-15" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const crisis = alerts.find((a) => a.type === "staff_crisis");
    expect(crisis).toBeTruthy();
    expect(crisis!.severity).toBe("critical");
    expect(crisis!.id).toBe("c1");
  });

  it("staff_crisis message contains staff member name", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "Jane Doe", wellbeing_rating: "crisis", check_date: "2025-03-15" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const crisis = alerts.find((a) => a.type === "staff_crisis");
    expect(crisis!.message).toContain("Jane Doe");
  });

  it("staff_crisis message contains check date", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "Jane", wellbeing_rating: "crisis", check_date: "2025-03-15" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const crisis = alerts.find((a) => a.type === "staff_crisis");
    expect(crisis!.message).toContain("2025-03-15");
  });

  it("raises multiple staff_crisis alerts for multiple crisis checks", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "Jane", wellbeing_rating: "crisis" }),
      makeCheck({ id: "c2", staff_member: "John", wellbeing_rating: "crisis" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 2, now);
    const crises = alerts.filter((a) => a.type === "staff_crisis");
    expect(crises).toHaveLength(2);
  });

  it("does not raise staff_crisis for non-crisis ratings", () => {
    const checks = [
      makeCheck({ id: "c1", wellbeing_rating: "struggling" }),
      makeCheck({ id: "c2", wellbeing_rating: "fair" }),
      makeCheck({ id: "c3", wellbeing_rating: "good" }),
      makeCheck({ id: "c4", wellbeing_rating: "excellent" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 4, now);
    const crises = alerts.filter((a) => a.type === "staff_crisis");
    expect(crises).toHaveLength(0);
  });

  // ── staff_struggling ────────────────────────────────────────────────────

  it("raises high alert for staff struggling", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "Bob", wellbeing_rating: "struggling", check_date: "2025-04-01" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const struggling = alerts.find((a) => a.type === "staff_struggling");
    expect(struggling).toBeTruthy();
    expect(struggling!.severity).toBe("high");
    expect(struggling!.id).toBe("c1");
  });

  it("staff_struggling message contains staff member name", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "Bob Smith", wellbeing_rating: "struggling", check_date: "2025-04-01" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const struggling = alerts.find((a) => a.type === "staff_struggling");
    expect(struggling!.message).toContain("Bob Smith");
  });

  it("staff_struggling message contains check date", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "Bob", wellbeing_rating: "struggling", check_date: "2025-04-01" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const struggling = alerts.find((a) => a.type === "staff_struggling");
    expect(struggling!.message).toContain("2025-04-01");
  });

  it("raises multiple staff_struggling alerts for multiple struggling checks", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "Bob", wellbeing_rating: "struggling" }),
      makeCheck({ id: "c2", staff_member: "Sue", wellbeing_rating: "struggling" }),
      makeCheck({ id: "c3", staff_member: "Tim", wellbeing_rating: "struggling" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 3, now);
    const struggles = alerts.filter((a) => a.type === "staff_struggling");
    expect(struggles).toHaveLength(3);
  });

  it("does not raise staff_struggling for non-struggling ratings", () => {
    const checks = [
      makeCheck({ id: "c1", wellbeing_rating: "excellent" }),
      makeCheck({ id: "c2", wellbeing_rating: "good" }),
      makeCheck({ id: "c3", wellbeing_rating: "fair" }),
      makeCheck({ id: "c4", wellbeing_rating: "crisis" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 4, now);
    const struggles = alerts.filter((a) => a.type === "staff_struggling");
    expect(struggles).toHaveLength(0);
  });

  // ── very_high_stress ────────────────────────────────────────────────────

  it("raises high alert for very high stress", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "Tom", stress_level: "very_high", check_date: "2025-05-01" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const vhs = alerts.find((a) => a.type === "very_high_stress");
    expect(vhs).toBeTruthy();
    expect(vhs!.severity).toBe("high");
    expect(vhs!.id).toBe("c1");
  });

  it("very_high_stress message contains staff member name", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "Tom Jones", stress_level: "very_high", check_date: "2025-05-01" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const vhs = alerts.find((a) => a.type === "very_high_stress");
    expect(vhs!.message).toContain("Tom Jones");
  });

  it("very_high_stress message contains check date", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "Tom", stress_level: "very_high", check_date: "2025-05-01" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const vhs = alerts.find((a) => a.type === "very_high_stress");
    expect(vhs!.message).toContain("2025-05-01");
  });

  it("raises multiple very_high_stress alerts for multiple checks", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "Tom", stress_level: "very_high" }),
      makeCheck({ id: "c2", staff_member: "Amy", stress_level: "very_high" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 2, now);
    const vhsList = alerts.filter((a) => a.type === "very_high_stress");
    expect(vhsList).toHaveLength(2);
  });

  it("does not raise very_high_stress for lower stress levels", () => {
    const checks = [
      makeCheck({ id: "c1", stress_level: "very_low" }),
      makeCheck({ id: "c2", stress_level: "low" }),
      makeCheck({ id: "c3", stress_level: "moderate" }),
      makeCheck({ id: "c4", stress_level: "high" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 4, now);
    const vhsList = alerts.filter((a) => a.type === "very_high_stress");
    expect(vhsList).toHaveLength(0);
  });

  // ── support_declined ────────────────────────────────────────────────────

  it("raises medium alert when support is offered but declined", () => {
    const checks = [
      makeCheck({
        id: "c1",
        staff_member: "Lisa",
        support_offered: ["supervision", "counselling"],
        support_accepted: false,
        check_date: "2025-06-01",
      }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const declined = alerts.find((a) => a.type === "support_declined");
    expect(declined).toBeTruthy();
    expect(declined!.severity).toBe("medium");
    expect(declined!.id).toBe("c1");
  });

  it("support_declined message contains staff member name", () => {
    const checks = [
      makeCheck({
        id: "c1",
        staff_member: "Lisa Brown",
        support_offered: ["supervision"],
        support_accepted: false,
        check_date: "2025-06-01",
      }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const declined = alerts.find((a) => a.type === "support_declined");
    expect(declined!.message).toContain("Lisa Brown");
  });

  it("support_declined message contains check date", () => {
    const checks = [
      makeCheck({
        id: "c1",
        staff_member: "Lisa",
        support_offered: ["supervision"],
        support_accepted: false,
        check_date: "2025-06-01",
      }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const declined = alerts.find((a) => a.type === "support_declined");
    expect(declined!.message).toContain("2025-06-01");
  });

  it("does not raise support_declined when support was accepted", () => {
    const checks = [
      makeCheck({
        id: "c1",
        support_offered: ["supervision"],
        support_accepted: true,
      }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const declined = alerts.find((a) => a.type === "support_declined");
    expect(declined).toBeUndefined();
  });

  it("does not raise support_declined when no support was offered", () => {
    const checks = [
      makeCheck({
        id: "c1",
        support_offered: [],
        support_accepted: false,
      }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const declined = alerts.find((a) => a.type === "support_declined");
    expect(declined).toBeUndefined();
  });

  it("raises multiple support_declined alerts for multiple checks", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "Lisa", support_offered: ["supervision"], support_accepted: false }),
      makeCheck({ id: "c2", staff_member: "Mark", support_offered: ["counselling"], support_accepted: false }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 2, now);
    const declined = alerts.filter((a) => a.type === "support_declined");
    expect(declined).toHaveLength(2);
  });

  // ── follow_up_overdue ───────────────────────────────────────────────────

  it("raises medium alert for overdue check follow-up", () => {
    const checks = [
      makeCheck({
        id: "c1",
        staff_member: "Dave",
        follow_up_date: daysAgo(5),
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue).toBeTruthy();
    expect(overdue!.severity).toBe("medium");
    expect(overdue!.id).toBe("c1");
  });

  it("follow_up_overdue message contains staff member name", () => {
    const checks = [
      makeCheck({
        id: "c1",
        staff_member: "Dave Wilson",
        follow_up_date: daysAgo(5),
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue!.message).toContain("Dave Wilson");
  });

  it("follow_up_overdue message contains follow-up date", () => {
    const fuDate = daysAgo(5);
    const checks = [
      makeCheck({
        id: "c1",
        staff_member: "Dave",
        follow_up_date: fuDate,
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue!.message).toContain(fuDate);
  });

  it("does not raise follow_up_overdue when follow-up is completed", () => {
    const checks = [
      makeCheck({
        id: "c1",
        follow_up_date: daysAgo(5),
        follow_up_completed: true,
      }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue).toBeUndefined();
  });

  it("does not raise follow_up_overdue for future follow-up dates", () => {
    const checks = [
      makeCheck({
        id: "c1",
        follow_up_date: daysFromNow(10),
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue).toBeUndefined();
  });

  it("does not raise follow_up_overdue when no follow-up date set", () => {
    const checks = [
      makeCheck({
        id: "c1",
        follow_up_date: null,
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue).toBeUndefined();
  });

  it("raises multiple follow_up_overdue alerts for multiple checks", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "Dave", follow_up_date: daysAgo(5), follow_up_completed: false }),
      makeCheck({ id: "c2", staff_member: "Eva", follow_up_date: daysAgo(3), follow_up_completed: false }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 2, now);
    const overdues = alerts.filter((a) => a.type === "follow_up_overdue");
    expect(overdues).toHaveLength(2);
  });

  // ── debrief_follow_up_overdue ───────────────────────────────────────────

  it("raises high alert for overdue debrief follow-up", () => {
    const debriefs = [
      makeDebrief({
        id: "d1",
        follow_up_required: true,
        follow_up_date: daysAgo(3),
        follow_up_completed: false,
        debrief_date: "2025-04-01",
        trigger: "critical_incident",
        staff_members: ["staff-1", "staff-2"],
      }),
    ];
    const alerts = identifyWellbeingAlerts([], debriefs, 0, now);
    const overdue = alerts.find((a) => a.type === "debrief_follow_up_overdue");
    expect(overdue).toBeTruthy();
    expect(overdue!.severity).toBe("high");
    expect(overdue!.id).toBe("d1");
  });

  it("debrief_follow_up_overdue message contains debrief date", () => {
    const debriefs = [
      makeDebrief({
        id: "d1",
        follow_up_required: true,
        follow_up_date: daysAgo(3),
        follow_up_completed: false,
        debrief_date: "2025-04-01",
        trigger: "restraint",
        staff_members: ["staff-1"],
      }),
    ];
    const alerts = identifyWellbeingAlerts([], debriefs, 0, now);
    const overdue = alerts.find((a) => a.type === "debrief_follow_up_overdue");
    expect(overdue!.message).toContain("2025-04-01");
  });

  it("debrief_follow_up_overdue message contains trigger type", () => {
    const debriefs = [
      makeDebrief({
        id: "d1",
        follow_up_required: true,
        follow_up_date: daysAgo(3),
        follow_up_completed: false,
        trigger: "violence_aggression",
        staff_members: ["staff-1"],
      }),
    ];
    const alerts = identifyWellbeingAlerts([], debriefs, 0, now);
    const overdue = alerts.find((a) => a.type === "debrief_follow_up_overdue");
    // trigger.replace(/_/g, " ") => "violence aggression"
    expect(overdue!.message).toContain("violence aggression");
  });

  it("debrief_follow_up_overdue message contains staff count", () => {
    const debriefs = [
      makeDebrief({
        id: "d1",
        follow_up_required: true,
        follow_up_date: daysAgo(3),
        follow_up_completed: false,
        staff_members: ["staff-1", "staff-2", "staff-3"],
      }),
    ];
    const alerts = identifyWellbeingAlerts([], debriefs, 0, now);
    const overdue = alerts.find((a) => a.type === "debrief_follow_up_overdue");
    expect(overdue!.message).toContain("3");
  });

  it("does not raise debrief_follow_up_overdue when follow-up not required", () => {
    const debriefs = [
      makeDebrief({
        id: "d1",
        follow_up_required: false,
        follow_up_date: daysAgo(3),
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyWellbeingAlerts([], debriefs, 0, now);
    const overdue = alerts.find((a) => a.type === "debrief_follow_up_overdue");
    expect(overdue).toBeUndefined();
  });

  it("does not raise debrief_follow_up_overdue when follow-up completed", () => {
    const debriefs = [
      makeDebrief({
        id: "d1",
        follow_up_required: true,
        follow_up_date: daysAgo(3),
        follow_up_completed: true,
      }),
    ];
    const alerts = identifyWellbeingAlerts([], debriefs, 0, now);
    const overdue = alerts.find((a) => a.type === "debrief_follow_up_overdue");
    expect(overdue).toBeUndefined();
  });

  it("does not raise debrief_follow_up_overdue for future dates", () => {
    const debriefs = [
      makeDebrief({
        id: "d1",
        follow_up_required: true,
        follow_up_date: daysFromNow(10),
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyWellbeingAlerts([], debriefs, 0, now);
    const overdue = alerts.find((a) => a.type === "debrief_follow_up_overdue");
    expect(overdue).toBeUndefined();
  });

  it("does not raise debrief_follow_up_overdue when no follow_up_date", () => {
    const debriefs = [
      makeDebrief({
        id: "d1",
        follow_up_required: true,
        follow_up_date: null,
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyWellbeingAlerts([], debriefs, 0, now);
    const overdue = alerts.find((a) => a.type === "debrief_follow_up_overdue");
    expect(overdue).toBeUndefined();
  });

  it("raises multiple debrief_follow_up_overdue alerts", () => {
    const debriefs = [
      makeDebrief({ id: "d1", follow_up_required: true, follow_up_date: daysAgo(5), follow_up_completed: false }),
      makeDebrief({ id: "d2", follow_up_required: true, follow_up_date: daysAgo(3), follow_up_completed: false }),
    ];
    const alerts = identifyWellbeingAlerts([], debriefs, 0, now);
    const overdues = alerts.filter((a) => a.type === "debrief_follow_up_overdue");
    expect(overdues).toHaveLength(2);
  });

  // ── staff_not_checked ───────────────────────────────────────────────────

  it("raises medium alert when some staff have not been checked", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "staff-1" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 3, now);
    const notChecked = alerts.find((a) => a.type === "staff_not_checked");
    expect(notChecked).toBeTruthy();
    expect(notChecked!.severity).toBe("medium");
  });

  it("staff_not_checked message contains unchecked count", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "staff-1" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 4, now);
    const notChecked = alerts.find((a) => a.type === "staff_not_checked");
    // 4 - 1 = 3 unchecked
    expect(notChecked!.message).toContain("3");
  });

  it("staff_not_checked uses first check id as alert id when checks exist", () => {
    const checks = [
      makeCheck({ id: "first-check", staff_member: "staff-1" }),
      makeCheck({ id: "second-check", staff_member: "staff-2" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 5, now);
    const notChecked = alerts.find((a) => a.type === "staff_not_checked");
    expect(notChecked!.id).toBe("first-check");
  });

  it("staff_not_checked uses 'system' as id when no checks exist", () => {
    const alerts = identifyWellbeingAlerts([], [], 3, now);
    const notChecked = alerts.find((a) => a.type === "staff_not_checked");
    expect(notChecked).toBeTruthy();
    expect(notChecked!.id).toBe("system");
  });

  it("does not raise staff_not_checked when all staff are checked", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "staff-1" }),
      makeCheck({ id: "c2", staff_member: "staff-2" }),
      makeCheck({ id: "c3", staff_member: "staff-3" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 3, now);
    const notChecked = alerts.find((a) => a.type === "staff_not_checked");
    expect(notChecked).toBeUndefined();
  });

  it("does not raise staff_not_checked when totalStaff is 0", () => {
    const alerts = identifyWellbeingAlerts([], [], 0, now);
    const notChecked = alerts.find((a) => a.type === "staff_not_checked");
    expect(notChecked).toBeUndefined();
  });

  it("does not double-count unique staff for staff_not_checked", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "staff-1" }),
      makeCheck({ id: "c2", staff_member: "staff-1" }), // same person
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 2, now);
    const notChecked = alerts.find((a) => a.type === "staff_not_checked");
    // 1 unique checked, 2 total => 1 unchecked
    expect(notChecked).toBeTruthy();
    expect(notChecked!.message).toContain("1");
  });

  // ── now parameter ───────────────────────────────────────────────────────

  it("now parameter defaults correctly (does not throw without it)", () => {
    const checks = [
      makeCheck({
        id: "c1",
        staff_member: "staff-1",
        follow_up_date: daysAgo(5),
        follow_up_completed: false,
      }),
    ];
    // Call without the now parameter
    const alerts = identifyWellbeingAlerts(checks, [], 1);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue).toBeTruthy();
  });

  it("respects custom now parameter for follow-up checks", () => {
    const pastDate = new Date("2025-01-01");
    const checks = [
      makeCheck({
        id: "c1",
        staff_member: "staff-1",
        follow_up_date: "2025-01-15", // after pastDate, so not overdue
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, pastDate);
    const overdue = alerts.find((a) => a.type === "follow_up_overdue");
    expect(overdue).toBeUndefined();
  });

  it("respects custom now parameter for debrief follow-up checks", () => {
    const futureDate = new Date("2030-01-01");
    const debriefs = [
      makeDebrief({
        id: "d1",
        follow_up_required: true,
        follow_up_date: "2029-12-01", // before futureDate, so overdue
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyWellbeingAlerts([], debriefs, 0, futureDate);
    const overdue = alerts.find((a) => a.type === "debrief_follow_up_overdue");
    expect(overdue).toBeTruthy();
  });

  // ── Combined / multiple alert types ─────────────────────────────────────

  it("raises combined alerts from crisis, struggling, and high stress", () => {
    const checks = [
      makeCheck({ id: "c1", staff_member: "staff-1", wellbeing_rating: "crisis", stress_level: "very_high" }),
      makeCheck({ id: "c2", staff_member: "staff-2", wellbeing_rating: "struggling", stress_level: "moderate" }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 2, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("staff_crisis");
    expect(types).toContain("staff_struggling");
    expect(types).toContain("very_high_stress");
  });

  it("raises alerts from both checks and debriefs simultaneously", () => {
    const checks = [
      makeCheck({
        id: "c1",
        staff_member: "staff-1",
        wellbeing_rating: "crisis",
        follow_up_date: daysAgo(5),
        follow_up_completed: false,
      }),
    ];
    const debriefs = [
      makeDebrief({
        id: "d1",
        follow_up_required: true,
        follow_up_date: daysAgo(3),
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyWellbeingAlerts(checks, debriefs, 3, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("staff_crisis");
    expect(types).toContain("follow_up_overdue");
    expect(types).toContain("debrief_follow_up_overdue");
    expect(types).toContain("staff_not_checked");
  });

  it("a single check can trigger multiple alert types at once", () => {
    const checks = [
      makeCheck({
        id: "c1",
        staff_member: "staff-1",
        wellbeing_rating: "crisis",
        stress_level: "very_high",
        support_offered: ["counselling"],
        support_accepted: false,
        follow_up_date: daysAgo(5),
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyWellbeingAlerts(checks, [], 1, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("staff_crisis");
    expect(types).toContain("very_high_stress");
    expect(types).toContain("support_declined");
    expect(types).toContain("follow_up_overdue");
  });

  it("each alert has required fields: type, severity, message, id", () => {
    const checks = [
      makeCheck({
        id: "c1",
        staff_member: "staff-1",
        wellbeing_rating: "crisis",
        stress_level: "very_high",
        support_offered: ["counselling"],
        support_accepted: false,
        follow_up_date: daysAgo(5),
        follow_up_completed: false,
      }),
    ];
    const debriefs = [
      makeDebrief({
        id: "d1",
        follow_up_required: true,
        follow_up_date: daysAgo(3),
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyWellbeingAlerts(checks, debriefs, 3, now);
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

  it("returns empty alerts for empty inputs with 0 totalStaff", () => {
    const alerts = identifyWellbeingAlerts([], [], 0, now);
    expect(alerts).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listChecks ──────────────────────────────────────────────────────────

  it("listChecks returns ok: true with empty array", async () => {
    const result = await listChecks("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listChecks returns ok: true with filters", async () => {
    const result = await listChecks("home-1", {
      staffMember: "staff-1",
      wellbeingRating: "good",
      dateFrom: "2025-01-01",
      dateTo: "2025-12-31",
      limit: 50,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createCheck ─────────────────────────────────────────────────────────

  it("createCheck returns ok: false with error message", async () => {
    const result = await createCheck({
      homeId: "home-1",
      staffMember: "staff-1",
      checkDate: daysAgo(1),
      checkedBy: "manager-1",
      wellbeingRating: "good",
      stressLevel: "low",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createCheck returns error even with full input", async () => {
    const result = await createCheck({
      homeId: "home-1",
      staffMember: "staff-1",
      checkDate: daysAgo(1),
      checkedBy: "manager-1",
      wellbeingRating: "fair",
      stressLevel: "moderate",
      workloadManageable: true,
      sleepQuality: "fair",
      feelingSupported: true,
      concerns: "Some concerns",
      supportOffered: ["supervision", "counselling"],
      supportAccepted: true,
      followUpDate: daysFromNow(14),
      notes: "Test notes",
    });
    expect(result.ok).toBe(false);
  });

  // ── listDebriefs ────────────────────────────────────────────────────────

  it("listDebriefs returns ok: true with empty array", async () => {
    const result = await listDebriefs("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listDebriefs returns ok: true with filters", async () => {
    const result = await listDebriefs("home-1", {
      trigger: "critical_incident",
      dateFrom: "2025-01-01",
      dateTo: "2025-12-31",
      limit: 25,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createDebrief ───────────────────────────────────────────────────────

  it("createDebrief returns ok: false with error message", async () => {
    const result = await createDebrief({
      homeId: "home-1",
      debriefDate: daysAgo(1),
      staffMembers: ["staff-1", "staff-2"],
      facilitatedBy: "manager-1",
      trigger: "critical_incident",
      incidentDate: daysAgo(2),
      incidentSummary: "A critical incident occurred",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createDebrief returns error even with full input", async () => {
    const result = await createDebrief({
      homeId: "home-1",
      debriefDate: daysAgo(1),
      staffMembers: ["staff-1"],
      facilitatedBy: "manager-1",
      trigger: "restraint",
      incidentDate: daysAgo(2),
      incidentSummary: "A restraint was used",
      emotionalImpact: "Staff felt shaken",
      lessonsLearned: "Better de-escalation needed",
      supportNeedsIdentified: "Additional training",
      actionsAgreed: ["Review de-escalation training"],
      followUpRequired: true,
      followUpDate: daysFromNow(7),
      notes: "Follow up next week",
    });
    expect(result.ok).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("computeWellbeingMetrics handles a single check with minimal data", () => {
    const check = makeCheck({ id: "c1" });
    const m = computeWellbeingMetrics([check], [], 1);
    expect(m.staff_checked).toBe(1);
    expect(m.avg_wellbeing_score).toBeGreaterThan(0);
    expect(m.avg_stress_score).toBeGreaterThan(0);
  });

  it("computeWellbeingMetrics handles a single debrief with minimal data", () => {
    const debrief = makeDebrief({ id: "d1", debrief_date: daysAgo(10) });
    const m = computeWellbeingMetrics([], [debrief], 0);
    expect(m.debriefs_this_quarter).toBe(1);
  });

  it("computeWellbeingMetrics handles large number of checks", () => {
    const checks: WellbeingCheck[] = [];
    for (let i = 0; i < 100; i++) {
      checks.push(
        makeCheck({
          id: `c${i}`,
          staff_member: `staff-${i}`,
          check_date: daysAgo(i % 120),
          wellbeing_rating: i % 2 === 0 ? "good" : "fair",
          stress_level: i % 2 === 0 ? "low" : "moderate",
        }),
      );
    }
    const m = computeWellbeingMetrics(checks, [], 100);
    expect(m.staff_checked).toBe(100);
    expect(m.avg_wellbeing_score).toBeGreaterThan(0);
    expect(m.avg_stress_score).toBeGreaterThan(0);
  });

  it("identifyWellbeingAlerts handles empty arrays with positive totalStaff", () => {
    const alerts = identifyWellbeingAlerts([], [], 5, new Date());
    const notChecked = alerts.find((a) => a.type === "staff_not_checked");
    expect(notChecked).toBeTruthy();
    expect(notChecked!.message).toContain("5");
  });

  it("identifyWellbeingAlerts returns no alerts for empty arrays with 0 totalStaff", () => {
    const alerts = identifyWellbeingAlerts([], [], 0, new Date());
    expect(alerts).toHaveLength(0);
  });

  it("computeWellbeingMetrics totalStaff parameter does not affect metrics", () => {
    const check = makeCheck({ id: "c1" });
    const m1 = computeWellbeingMetrics([check], [], 1);
    const m2 = computeWellbeingMetrics([check], [], 100);
    expect(m1.staff_checked).toBe(m2.staff_checked);
    expect(m1.avg_wellbeing_score).toBe(m2.avg_wellbeing_score);
    expect(m1.avg_stress_score).toBe(m2.avg_stress_score);
  });

  it("listChecks result data is an array type", async () => {
    const result = await listChecks("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Array.isArray(result.data)).toBe(true);
    }
  });

  it("listDebriefs result data is an array type", async () => {
    const result = await listDebriefs("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Array.isArray(result.data)).toBe(true);
    }
  });

  it("createCheck error message is a string", async () => {
    const result = await createCheck({
      homeId: "home-1",
      staffMember: "staff-1",
      checkDate: daysAgo(1),
      checkedBy: "manager-1",
      wellbeingRating: "good",
      stressLevel: "low",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  it("createDebrief error message is a string", async () => {
    const result = await createDebrief({
      homeId: "home-1",
      debriefDate: daysAgo(1),
      staffMembers: ["staff-1"],
      facilitatedBy: "manager-1",
      trigger: "safeguarding",
      incidentDate: daysAgo(2),
      incidentSummary: "Safeguarding concern",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });
});
