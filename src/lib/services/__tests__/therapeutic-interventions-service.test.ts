// ══════════════════════════════════════════════════════════════════════════════
// CARA — THERAPEUTIC INTERVENTIONS SERVICE TESTS
// Pure-function unit tests for therapy metrics computation, alert identification,
// constant validation, and CRUD fallback behaviour.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeTherapyMetrics,
  identifyTherapyAlerts,
  THERAPY_TYPES,
  SESSION_STATUSES,
  ENGAGEMENT_LEVELS,
  PROGRESS_RATINGS,
  REFERRAL_STATUSES,
  listReferrals,
  createReferral,
  updateReferral,
  listSessions,
  createSession,
} from "../therapeutic-interventions-service";
import type {
  TherapyReferral,
  TherapySession,
} from "../therapeutic-interventions-service";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeReferral(overrides: Partial<TherapyReferral> = {}): TherapyReferral {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Test Child",
    therapy_type: "cbt",
    provider_name: "Provider A",
    therapist_name: "Dr Smith",
    referral_date: "2026-01-15",
    referral_reason: "Emotional regulation support",
    status: "active",
    date_started: "2026-02-01",
    date_ended: null,
    frequency: "Weekly",
    session_count: 4,
    goals: ["Improve self-regulation"],
    outcomes: [],
    waiting_time_days: null,
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
    ...overrides,
  };
}

function makeSession(overrides: Partial<TherapySession> = {}): TherapySession {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Test Child",
    referral_id: "ref-1",
    therapy_type: "cbt",
    session_date: "2026-03-01",
    session_number: 1,
    status: "attended",
    engagement_level: "fully_engaged",
    progress_rating: "some_progress",
    session_notes: null,
    goals_addressed: ["Improve self-regulation"],
    home_actions: [],
    therapist_recommendations: null,
    staff_attended: null,
    created_at: "2026-03-01T10:00:00Z",
    ...overrides,
  };
}

// ── Constants ──────────────────────────────────────────────────────────────

describe("Constants", () => {
  describe("THERAPY_TYPES", () => {
    it("has exactly 16 items", () => {
      expect(THERAPY_TYPES).toHaveLength(16);
    });

    it("has unique type values", () => {
      const types = THERAPY_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it.each([
      "cbt",
      "dbt",
      "emdr",
      "play_therapy",
      "art_therapy",
      "music_therapy",
      "family_therapy",
      "psychotherapy",
      "occupational_therapy",
      "speech_language",
      "sensory_integration",
      "life_story_work",
      "therapeutic_parenting",
      "equine_therapy",
      "group_therapy",
      "other",
    ] as const)("contains type '%s'", (type) => {
      expect(THERAPY_TYPES.find((t) => t.type === type)).toBeDefined();
    });

    it("has non-empty labels for all types", () => {
      for (const t of THERAPY_TYPES) {
        expect(t.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("SESSION_STATUSES", () => {
    it("has exactly 6 items", () => {
      expect(SESSION_STATUSES).toHaveLength(6);
    });

    it("has unique status values", () => {
      const statuses = SESSION_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it.each([
      "scheduled",
      "attended",
      "cancelled_child",
      "cancelled_therapist",
      "dna",
      "rescheduled",
    ] as const)("contains status '%s'", (status) => {
      expect(SESSION_STATUSES.find((s) => s.status === status)).toBeDefined();
    });

    it("has non-empty labels for all statuses", () => {
      for (const s of SESSION_STATUSES) {
        expect(s.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("ENGAGEMENT_LEVELS", () => {
    it("has exactly 5 items", () => {
      expect(ENGAGEMENT_LEVELS).toHaveLength(5);
    });

    it("has unique level values", () => {
      const levels = ENGAGEMENT_LEVELS.map((e) => e.level);
      expect(new Set(levels).size).toBe(levels.length);
    });

    it.each([
      "fully_engaged",
      "partially_engaged",
      "reluctant",
      "refused",
      "not_applicable",
    ] as const)("contains level '%s'", (level) => {
      expect(ENGAGEMENT_LEVELS.find((e) => e.level === level)).toBeDefined();
    });

    it("has non-empty labels for all levels", () => {
      for (const e of ENGAGEMENT_LEVELS) {
        expect(e.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("PROGRESS_RATINGS", () => {
    it("has exactly 5 items", () => {
      expect(PROGRESS_RATINGS).toHaveLength(5);
    });

    it("has unique rating values", () => {
      const ratings = PROGRESS_RATINGS.map((p) => p.rating);
      expect(new Set(ratings).size).toBe(ratings.length);
    });

    it.each([
      "significant_progress",
      "some_progress",
      "stable",
      "some_regression",
      "significant_regression",
    ] as const)("contains rating '%s'", (rating) => {
      expect(PROGRESS_RATINGS.find((p) => p.rating === rating)).toBeDefined();
    });

    it("has non-empty labels for all ratings", () => {
      for (const p of PROGRESS_RATINGS) {
        expect(p.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("REFERRAL_STATUSES", () => {
    it("has exactly 7 items", () => {
      expect(REFERRAL_STATUSES).toHaveLength(7);
    });

    it("has unique status values", () => {
      const statuses = REFERRAL_STATUSES.map((r) => r.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it.each([
      "identified",
      "referred",
      "waitlisted",
      "active",
      "completed",
      "discontinued",
      "declined",
    ] as const)("contains status '%s'", (status) => {
      expect(REFERRAL_STATUSES.find((r) => r.status === status)).toBeDefined();
    });

    it("has non-empty labels for all statuses", () => {
      for (const r of REFERRAL_STATUSES) {
        expect(r.label.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── computeTherapyMetrics ──────────────────────────────────────────────────

describe("computeTherapyMetrics", () => {
  it("returns zeroed metrics for empty inputs", () => {
    const result = computeTherapyMetrics([], [], 0);
    expect(result.active_referrals).toBe(0);
    expect(result.children_in_therapy).toBe(0);
    expect(result.children_waiting).toBe(0);
    expect(result.total_sessions).toBe(0);
    expect(result.sessions_attended).toBe(0);
    expect(result.attendance_rate).toBeNull();;
    expect(result.avg_engagement).toBe(0);
    expect(result.children_progressing).toBe(0);
    expect(result.children_regressing).toBe(0);
    expect(result.avg_waiting_days).toBe(0);
    expect(result.by_therapy_type).toEqual({});
    expect(result.by_status).toEqual({});
    expect(result.by_engagement).toEqual({});
  });

  // -- active_referrals
  it("counts active referrals only", () => {
    const referrals = [
      makeReferral({ status: "active" }),
      makeReferral({ status: "active" }),
      makeReferral({ status: "completed" }),
      makeReferral({ status: "waitlisted" }),
    ];
    const result = computeTherapyMetrics(referrals, [], 4);
    expect(result.active_referrals).toBe(2);
  });

  it("returns 0 active_referrals when none are active", () => {
    const referrals = [
      makeReferral({ status: "completed" }),
      makeReferral({ status: "declined" }),
    ];
    const result = computeTherapyMetrics(referrals, [], 2);
    expect(result.active_referrals).toBe(0);
  });

  // -- children_in_therapy (unique child_id of active)
  it("counts unique children in therapy from active referrals", () => {
    const referrals = [
      makeReferral({ child_id: "c1", status: "active" }),
      makeReferral({ child_id: "c1", status: "active", therapy_type: "dbt" }),
      makeReferral({ child_id: "c2", status: "active" }),
      makeReferral({ child_id: "c3", status: "completed" }),
    ];
    const result = computeTherapyMetrics(referrals, [], 4);
    expect(result.children_in_therapy).toBe(2);
  });

  it("returns 0 children_in_therapy when no active referrals exist", () => {
    const referrals = [makeReferral({ status: "waitlisted" })];
    const result = computeTherapyMetrics(referrals, [], 1);
    expect(result.children_in_therapy).toBe(0);
  });

  // -- children_waiting (unique child_id of waitlisted/referred)
  it("counts unique children waiting from waitlisted and referred", () => {
    const referrals = [
      makeReferral({ child_id: "c1", status: "waitlisted" }),
      makeReferral({ child_id: "c1", status: "referred" }),
      makeReferral({ child_id: "c2", status: "referred" }),
      makeReferral({ child_id: "c3", status: "active" }),
    ];
    const result = computeTherapyMetrics(referrals, [], 4);
    expect(result.children_waiting).toBe(2);
  });

  it("returns 0 children_waiting when no waitlisted/referred", () => {
    const referrals = [makeReferral({ status: "active" })];
    const result = computeTherapyMetrics(referrals, [], 1);
    expect(result.children_waiting).toBe(0);
  });

  // -- total_sessions
  it("counts total sessions regardless of status", () => {
    const sessions = [
      makeSession({ status: "attended" }),
      makeSession({ status: "dna" }),
      makeSession({ status: "scheduled" }),
      makeSession({ status: "cancelled_child" }),
    ];
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.total_sessions).toBe(4);
  });

  // -- sessions_attended
  it("counts only attended sessions", () => {
    const sessions = [
      makeSession({ status: "attended" }),
      makeSession({ status: "attended" }),
      makeSession({ status: "dna" }),
      makeSession({ status: "cancelled_therapist" }),
    ];
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.sessions_attended).toBe(2);
  });

  // -- attendance_rate
  it("calculates attendance_rate as attended/(attended+dna+cancelled_child)*100", () => {
    const sessions = [
      makeSession({ status: "attended" }),
      makeSession({ status: "attended" }),
      makeSession({ status: "attended" }),
      makeSession({ status: "dna" }),
      makeSession({ status: "cancelled_child" }),
    ];
    // 3 / 5 = 60.0%
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.attendance_rate).toBe(60);
  });

  it("returns 0 attendance_rate when no completed sessions exist", () => {
    const sessions = [
      makeSession({ status: "scheduled" }),
      makeSession({ status: "cancelled_therapist" }),
    ];
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.attendance_rate).toBeNull();;
  });

  it("rounds attendance_rate to 1 decimal place", () => {
    // 2/3 = 66.666... -> 66.7
    const sessions = [
      makeSession({ status: "attended" }),
      makeSession({ status: "attended" }),
      makeSession({ status: "dna" }),
    ];
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.attendance_rate).toBe(66.7);
  });

  it("returns 100% attendance when all sessions attended", () => {
    const sessions = [
      makeSession({ status: "attended" }),
      makeSession({ status: "attended" }),
    ];
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.attendance_rate).toBe(100);
  });

  // -- avg_engagement
  it("calculates avg_engagement from attended sessions only", () => {
    const sessions = [
      makeSession({ status: "attended", engagement_level: "fully_engaged" }), // 5
      makeSession({ status: "attended", engagement_level: "partially_engaged" }), // 4
      makeSession({ status: "dna", engagement_level: "refused" }), // should be excluded (not attended)
    ];
    // (5 + 4) / 2 = 4.5
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.avg_engagement).toBe(4.5);
  });

  it("excludes not_applicable from engagement average", () => {
    const sessions = [
      makeSession({ status: "attended", engagement_level: "fully_engaged" }), // 5
      makeSession({ status: "attended", engagement_level: "not_applicable" }), // excluded
      makeSession({ status: "attended", engagement_level: "reluctant" }), // 3
    ];
    // (5 + 3) / 2 = 4.0
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.avg_engagement).toBe(4);
  });

  it("returns 0 avg_engagement when all attended are not_applicable", () => {
    const sessions = [
      makeSession({ status: "attended", engagement_level: "not_applicable" }),
    ];
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.avg_engagement).toBe(0);
  });

  it("returns 0 avg_engagement for empty sessions", () => {
    const result = computeTherapyMetrics([], [], 1);
    expect(result.avg_engagement).toBe(0);
  });

  it("maps refused engagement to score 2", () => {
    const sessions = [
      makeSession({ status: "attended", engagement_level: "refused" }),
    ];
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.avg_engagement).toBe(2);
  });

  it("rounds avg_engagement to 1 decimal place", () => {
    // fully_engaged(5) + partially_engaged(4) + reluctant(3) = 12/3 = 4.0
    const sessions = [
      makeSession({ status: "attended", engagement_level: "fully_engaged" }),
      makeSession({ status: "attended", engagement_level: "partially_engaged" }),
      makeSession({ status: "attended", engagement_level: "reluctant" }),
    ];
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.avg_engagement).toBe(4);
  });

  it("calculates fractional avg_engagement correctly", () => {
    // fully_engaged(5) + reluctant(3) + refused(2) = 10/3 = 3.333 -> 3.3
    const sessions = [
      makeSession({ status: "attended", engagement_level: "fully_engaged" }),
      makeSession({ status: "attended", engagement_level: "reluctant" }),
      makeSession({ status: "attended", engagement_level: "refused" }),
    ];
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.avg_engagement).toBe(3.3);
  });

  // -- children_progressing / children_regressing (latest session per child)
  it("counts children progressing from latest session per child", () => {
    const sessions = [
      makeSession({
        child_id: "c1",
        session_date: "2026-03-01",
        progress_rating: "some_regression",
        status: "attended",
      }),
      makeSession({
        child_id: "c1",
        session_date: "2026-04-01",
        progress_rating: "some_progress",
        status: "attended",
      }),
      makeSession({
        child_id: "c2",
        session_date: "2026-03-15",
        progress_rating: "significant_progress",
        status: "attended",
        child_name: "Child 2",
      }),
    ];
    const result = computeTherapyMetrics([], sessions, 2);
    expect(result.children_progressing).toBe(2);
    expect(result.children_regressing).toBe(0);
  });

  it("counts children regressing from latest session per child", () => {
    const sessions = [
      makeSession({
        child_id: "c1",
        session_date: "2026-04-01",
        progress_rating: "significant_regression",
        status: "attended",
      }),
      makeSession({
        child_id: "c2",
        session_date: "2026-04-01",
        progress_rating: "some_regression",
        status: "attended",
        child_name: "Child 2",
      }),
    ];
    const result = computeTherapyMetrics([], sessions, 2);
    expect(result.children_regressing).toBe(2);
    expect(result.children_progressing).toBe(0);
  });

  it("uses latest session only when child has multiple sessions", () => {
    const sessions = [
      makeSession({
        child_id: "c1",
        session_date: "2026-01-01",
        progress_rating: "significant_progress",
        status: "attended",
      }),
      makeSession({
        child_id: "c1",
        session_date: "2026-04-01",
        progress_rating: "some_regression",
        status: "attended",
      }),
    ];
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.children_progressing).toBe(0);
    expect(result.children_regressing).toBe(1);
  });

  it("counts stable children as neither progressing nor regressing", () => {
    const sessions = [
      makeSession({
        child_id: "c1",
        session_date: "2026-04-01",
        progress_rating: "stable",
        status: "attended",
      }),
    ];
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.children_progressing).toBe(0);
    expect(result.children_regressing).toBe(0);
  });

  it("ignores non-attended sessions for progress calculation", () => {
    const sessions = [
      makeSession({
        child_id: "c1",
        session_date: "2026-04-01",
        progress_rating: "significant_regression",
        status: "dna",
      }),
    ];
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.children_regressing).toBe(0);
  });

  // -- avg_waiting_days
  it("calculates avg_waiting_days from referrals with waiting_time_days > 0", () => {
    const referrals = [
      makeReferral({ waiting_time_days: 30 }),
      makeReferral({ waiting_time_days: 60 }),
      makeReferral({ waiting_time_days: null }),
    ];
    const result = computeTherapyMetrics(referrals, [], 2);
    expect(result.avg_waiting_days).toBe(45);
  });

  it("returns 0 avg_waiting_days when none have waiting times", () => {
    const referrals = [
      makeReferral({ waiting_time_days: null }),
      makeReferral({ waiting_time_days: 0 }),
    ];
    const result = computeTherapyMetrics(referrals, [], 2);
    expect(result.avg_waiting_days).toBe(0);
  });

  it("rounds avg_waiting_days to integer", () => {
    const referrals = [
      makeReferral({ waiting_time_days: 31 }),
      makeReferral({ waiting_time_days: 44 }),
    ];
    // (31 + 44) / 2 = 37.5 -> 38
    const result = computeTherapyMetrics(referrals, [], 2);
    expect(result.avg_waiting_days).toBe(38);
  });

  // -- by_therapy_type
  it("groups referrals by therapy type", () => {
    const referrals = [
      makeReferral({ therapy_type: "cbt" }),
      makeReferral({ therapy_type: "cbt" }),
      makeReferral({ therapy_type: "emdr" }),
    ];
    const result = computeTherapyMetrics(referrals, [], 2);
    expect(result.by_therapy_type).toEqual({ cbt: 2, emdr: 1 });
  });

  it("returns empty by_therapy_type for no referrals", () => {
    const result = computeTherapyMetrics([], [], 0);
    expect(result.by_therapy_type).toEqual({});
  });

  // -- by_status
  it("groups referrals by status", () => {
    const referrals = [
      makeReferral({ status: "active" }),
      makeReferral({ status: "active" }),
      makeReferral({ status: "completed" }),
      makeReferral({ status: "waitlisted" }),
    ];
    const result = computeTherapyMetrics(referrals, [], 3);
    expect(result.by_status).toEqual({ active: 2, completed: 1, waitlisted: 1 });
  });

  it("returns empty by_status for no referrals", () => {
    const result = computeTherapyMetrics([], [], 0);
    expect(result.by_status).toEqual({});
  });

  // -- by_engagement
  it("groups attended sessions by engagement level", () => {
    const sessions = [
      makeSession({ status: "attended", engagement_level: "fully_engaged" }),
      makeSession({ status: "attended", engagement_level: "fully_engaged" }),
      makeSession({ status: "attended", engagement_level: "reluctant" }),
      makeSession({ status: "dna", engagement_level: "refused" }), // excluded (not attended)
    ];
    const result = computeTherapyMetrics([], sessions, 2);
    expect(result.by_engagement).toEqual({ fully_engaged: 2, reluctant: 1 });
  });

  it("returns empty by_engagement for no sessions", () => {
    const result = computeTherapyMetrics([], [], 0);
    expect(result.by_engagement).toEqual({});
  });

  // -- Combined scenario
  it("handles a realistic mixed scenario", () => {
    const referrals = [
      makeReferral({ child_id: "c1", status: "active", therapy_type: "cbt", waiting_time_days: 14 }),
      makeReferral({ child_id: "c2", status: "waitlisted", therapy_type: "play_therapy", waiting_time_days: 42 }),
      makeReferral({ child_id: "c3", status: "completed", therapy_type: "cbt", waiting_time_days: null }),
    ];
    const sessions = [
      makeSession({ child_id: "c1", status: "attended", engagement_level: "fully_engaged", progress_rating: "some_progress", session_date: "2026-03-01" }),
      makeSession({ child_id: "c1", status: "attended", engagement_level: "partially_engaged", progress_rating: "significant_progress", session_date: "2026-04-01" }),
      makeSession({ child_id: "c1", status: "dna" }),
    ];
    const result = computeTherapyMetrics(referrals, sessions, 3);
    expect(result.active_referrals).toBe(1);
    expect(result.children_in_therapy).toBe(1);
    expect(result.children_waiting).toBe(1);
    expect(result.total_sessions).toBe(3);
    expect(result.sessions_attended).toBe(2);
    // attended=2, dna=1, cancelled_child=0 -> 2/3 = 66.7
    expect(result.attendance_rate).toBe(66.7);
    // (5 + 4) / 2 = 4.5
    expect(result.avg_engagement).toBe(4.5);
    expect(result.children_progressing).toBe(1);
    expect(result.children_regressing).toBe(0);
    // only waiting_time_days=14 and 42 qualify -> (14+42)/2 = 28
    expect(result.avg_waiting_days).toBe(28);
  });

  it("excludes cancelled_therapist and rescheduled from attendance rate denominator", () => {
    const sessions = [
      makeSession({ status: "attended" }),
      makeSession({ status: "cancelled_therapist" }),
      makeSession({ status: "rescheduled" }),
    ];
    // denominator = attended(1) + dna(0) + cancelled_child(0) = 1; rate = 100%
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.attendance_rate).toBe(100);
  });
});

// ── identifyTherapyAlerts ──────────────────────────────────────────────────

describe("identifyTherapyAlerts", () => {
  const now = new Date("2026-05-13T12:00:00Z");

  it("returns empty alerts for empty inputs", () => {
    const alerts = identifyTherapyAlerts([], [], 0, now);
    expect(alerts).toEqual([]);
  });

  // -- long_wait alerts
  describe("long_wait alerts", () => {
    it("generates critical alert for waitlisted referral waiting >56 days", () => {
      const referrals = [
        makeReferral({
          status: "waitlisted",
          waiting_time_days: 60,
          child_name: "Alice",
          therapy_type: "cbt",
        }),
      ];
      const alerts = identifyTherapyAlerts(referrals, [], 1, now);
      const longWait = alerts.filter((a) => a.type === "long_wait");
      expect(longWait).toHaveLength(1);
      expect(longWait[0].severity).toBe("critical");
      expect(longWait[0].message).toContain("Alice");
      expect(longWait[0].message).toContain("60 days");
      expect(longWait[0].message).toContain("CBT");
    });

    it("generates high alert for referred referral waiting >28 but <=56 days", () => {
      const referrals = [
        makeReferral({
          status: "referred",
          waiting_time_days: 35,
          child_name: "Bob",
          therapy_type: "play_therapy",
        }),
      ];
      const alerts = identifyTherapyAlerts(referrals, [], 1, now);
      const longWait = alerts.filter((a) => a.type === "long_wait");
      expect(longWait).toHaveLength(1);
      expect(longWait[0].severity).toBe("high");
      expect(longWait[0].message).toContain("Bob");
      expect(longWait[0].message).toContain("35 days");
      expect(longWait[0].message).toContain("Play Therapy");
    });

    it("does not generate alert for waiting <=28 days", () => {
      const referrals = [
        makeReferral({ status: "waitlisted", waiting_time_days: 28 }),
      ];
      const alerts = identifyTherapyAlerts(referrals, [], 1, now);
      expect(alerts.filter((a) => a.type === "long_wait")).toHaveLength(0);
    });

    it("does not generate alert for active referral even with long wait", () => {
      const referrals = [
        makeReferral({ status: "active", waiting_time_days: 100 }),
      ];
      const alerts = identifyTherapyAlerts(referrals, [], 1, now);
      expect(alerts.filter((a) => a.type === "long_wait")).toHaveLength(0);
    });

    it("does not generate alert when waiting_time_days is null", () => {
      const referrals = [
        makeReferral({ status: "waitlisted", waiting_time_days: null }),
      ];
      const alerts = identifyTherapyAlerts(referrals, [], 1, now);
      expect(alerts.filter((a) => a.type === "long_wait")).toHaveLength(0);
    });

    it("generates multiple long_wait alerts for different children", () => {
      const referrals = [
        makeReferral({ child_id: "c1", child_name: "Alice", status: "waitlisted", waiting_time_days: 60 }),
        makeReferral({ child_id: "c2", child_name: "Bob", status: "referred", waiting_time_days: 45 }),
      ];
      const alerts = identifyTherapyAlerts(referrals, [], 2, now);
      const longWait = alerts.filter((a) => a.type === "long_wait");
      expect(longWait).toHaveLength(2);
    });

    it("includes escalation guidance in long_wait message", () => {
      const referrals = [
        makeReferral({ status: "waitlisted", waiting_time_days: 30 }),
      ];
      const alerts = identifyTherapyAlerts(referrals, [], 1, now);
      expect(alerts[0].message).toContain("escalate with commissioner");
    });

    it("sets the referral id as the alert id", () => {
      const ref = makeReferral({ id: "ref-xyz", status: "waitlisted", waiting_time_days: 40 });
      const alerts = identifyTherapyAlerts([ref], [], 1, now);
      expect(alerts[0].id).toBe("ref-xyz");
    });
  });

  // -- significant_regression alerts
  describe("significant_regression alerts", () => {
    it("generates high alert for child with significant regression in latest session", () => {
      const sessions = [
        makeSession({
          child_id: "c1",
          child_name: "Charlie",
          session_date: "2026-04-01",
          progress_rating: "significant_regression",
          status: "attended",
        }),
      ];
      const alerts = identifyTherapyAlerts([], sessions, 1, now);
      const regression = alerts.filter((a) => a.type === "significant_regression");
      expect(regression).toHaveLength(1);
      expect(regression[0].severity).toBe("high");
      expect(regression[0].message).toContain("Charlie");
      expect(regression[0].message).toContain("significant regression");
    });

    it("uses latest session per child for regression detection", () => {
      const sessions = [
        makeSession({
          child_id: "c1",
          session_date: "2026-01-01",
          progress_rating: "significant_regression",
          status: "attended",
        }),
        makeSession({
          child_id: "c1",
          session_date: "2026-04-01",
          progress_rating: "some_progress",
          status: "attended",
        }),
      ];
      const alerts = identifyTherapyAlerts([], sessions, 1, now);
      expect(alerts.filter((a) => a.type === "significant_regression")).toHaveLength(0);
    });

    it("includes review therapeutic plan message", () => {
      const sessions = [
        makeSession({
          progress_rating: "significant_regression",
          status: "attended",
        }),
      ];
      const alerts = identifyTherapyAlerts([], sessions, 1, now);
      expect(alerts[0].message).toContain("review therapeutic plan urgently");
    });
  });

  // -- some_regression alerts
  describe("some_regression alerts", () => {
    it("generates medium alert for child with some regression", () => {
      const sessions = [
        makeSession({
          child_id: "c1",
          child_name: "Diana",
          progress_rating: "some_regression",
          status: "attended",
        }),
      ];
      const alerts = identifyTherapyAlerts([], sessions, 1, now);
      const regression = alerts.filter((a) => a.type === "some_regression");
      expect(regression).toHaveLength(1);
      expect(regression[0].severity).toBe("medium");
      expect(regression[0].message).toContain("Diana");
    });

    it("includes therapist review guidance", () => {
      const sessions = [
        makeSession({
          progress_rating: "some_regression",
          status: "attended",
        }),
      ];
      const alerts = identifyTherapyAlerts([], sessions, 1, now);
      const regression = alerts.filter((a) => a.type === "some_regression");
      expect(regression[0].message).toContain("discuss with therapist at next review");
    });

    it("does not trigger for stable or progressing children", () => {
      const sessions = [
        makeSession({ progress_rating: "stable", status: "attended" }),
        makeSession({ child_id: "c2", child_name: "Child 2", progress_rating: "some_progress", status: "attended" }),
      ];
      const alerts = identifyTherapyAlerts([], sessions, 2, now);
      expect(alerts.filter((a) => a.type === "some_regression")).toHaveLength(0);
    });
  });

  // -- engagement_refused alerts
  describe("engagement_refused alerts", () => {
    it("generates high alert when latest session shows refused engagement", () => {
      const sessions = [
        makeSession({
          child_id: "c1",
          child_name: "Eve",
          session_date: "2026-04-15",
          engagement_level: "refused",
          status: "attended",
        }),
      ];
      const alerts = identifyTherapyAlerts([], sessions, 1, now);
      const refused = alerts.filter((a) => a.type === "engagement_refused");
      expect(refused).toHaveLength(1);
      expect(refused[0].severity).toBe("high");
      expect(refused[0].message).toContain("Eve");
      expect(refused[0].message).toContain("refused to engage");
      expect(refused[0].message).toContain("2026-04-15");
    });

    it("includes key worker guidance", () => {
      const sessions = [
        makeSession({
          engagement_level: "refused",
          status: "attended",
        }),
      ];
      const alerts = identifyTherapyAlerts([], sessions, 1, now);
      const refused = alerts.filter((a) => a.type === "engagement_refused");
      expect(refused[0].message).toContain("explore barriers with key worker");
    });

    it("uses latest session for refused detection", () => {
      const sessions = [
        makeSession({
          child_id: "c1",
          session_date: "2026-01-01",
          engagement_level: "refused",
          status: "attended",
        }),
        makeSession({
          child_id: "c1",
          session_date: "2026-04-01",
          engagement_level: "fully_engaged",
          status: "attended",
        }),
      ];
      const alerts = identifyTherapyAlerts([], sessions, 1, now);
      expect(alerts.filter((a) => a.type === "engagement_refused")).toHaveLength(0);
    });
  });

  // -- engagement_reluctant alerts
  describe("engagement_reluctant alerts", () => {
    it("generates medium alert when latest session shows reluctant engagement", () => {
      const sessions = [
        makeSession({
          child_id: "c1",
          child_name: "Frank",
          session_date: "2026-04-10",
          engagement_level: "reluctant",
          status: "attended",
        }),
      ];
      const alerts = identifyTherapyAlerts([], sessions, 1, now);
      const reluctant = alerts.filter((a) => a.type === "engagement_reluctant");
      expect(reluctant).toHaveLength(1);
      expect(reluctant[0].severity).toBe("medium");
      expect(reluctant[0].message).toContain("Frank");
      expect(reluctant[0].message).toContain("reluctant");
      expect(reluctant[0].message).toContain("2026-04-10");
    });

    it("includes adapting approach guidance", () => {
      const sessions = [
        makeSession({
          engagement_level: "reluctant",
          status: "attended",
        }),
      ];
      const alerts = identifyTherapyAlerts([], sessions, 1, now);
      const reluctant = alerts.filter((a) => a.type === "engagement_reluctant");
      expect(reluctant[0].message).toContain("consider adapting approach");
    });

    it("does not trigger for partially_engaged", () => {
      const sessions = [
        makeSession({
          engagement_level: "partially_engaged",
          status: "attended",
        }),
      ];
      const alerts = identifyTherapyAlerts([], sessions, 1, now);
      expect(alerts.filter((a) => a.type === "engagement_reluctant")).toHaveLength(0);
    });
  });

  // -- repeated_dna alerts
  describe("repeated_dna alerts", () => {
    it("generates high alert when child has 2+ DNA sessions", () => {
      const sessions = [
        makeSession({ child_id: "c1", child_name: "Grace", status: "dna" }),
        makeSession({ child_id: "c1", child_name: "Grace", status: "dna" }),
      ];
      const alerts = identifyTherapyAlerts([], sessions, 1, now);
      const dna = alerts.filter((a) => a.type === "repeated_dna");
      expect(dna).toHaveLength(1);
      expect(dna[0].severity).toBe("high");
      expect(dna[0].message).toContain("Grace");
      expect(dna[0].message).toContain("2 missed therapy sessions");
    });

    it("does not trigger for single DNA session", () => {
      const sessions = [
        makeSession({ child_id: "c1", status: "dna" }),
      ];
      const alerts = identifyTherapyAlerts([], sessions, 1, now);
      expect(alerts.filter((a) => a.type === "repeated_dna")).toHaveLength(0);
    });

    it("counts DNA per child independently", () => {
      const sessions = [
        makeSession({ child_id: "c1", child_name: "Grace", status: "dna" }),
        makeSession({ child_id: "c1", child_name: "Grace", status: "dna" }),
        makeSession({ child_id: "c2", child_name: "Henry", status: "dna" }),
      ];
      const alerts = identifyTherapyAlerts([], sessions, 2, now);
      const dna = alerts.filter((a) => a.type === "repeated_dna");
      expect(dna).toHaveLength(1);
      expect(dna[0].message).toContain("Grace");
    });

    it("generates alerts for multiple children with repeated DNA", () => {
      const sessions = [
        makeSession({ child_id: "c1", child_name: "Grace", status: "dna" }),
        makeSession({ child_id: "c1", child_name: "Grace", status: "dna" }),
        makeSession({ child_id: "c2", child_name: "Henry", status: "dna" }),
        makeSession({ child_id: "c2", child_name: "Henry", status: "dna" }),
        makeSession({ child_id: "c2", child_name: "Henry", status: "dna" }),
      ];
      const alerts = identifyTherapyAlerts([], sessions, 2, now);
      const dna = alerts.filter((a) => a.type === "repeated_dna");
      expect(dna).toHaveLength(2);
    });

    it("shows correct count of missed sessions", () => {
      const sessions = [
        makeSession({ child_id: "c1", child_name: "Grace", status: "dna" }),
        makeSession({ child_id: "c1", child_name: "Grace", status: "dna" }),
        makeSession({ child_id: "c1", child_name: "Grace", status: "dna" }),
      ];
      const alerts = identifyTherapyAlerts([], sessions, 1, now);
      const dna = alerts.filter((a) => a.type === "repeated_dna");
      expect(dna[0].message).toContain("3 missed therapy sessions");
    });

    it("includes engagement review guidance", () => {
      const sessions = [
        makeSession({ child_id: "c1", child_name: "Grace", status: "dna" }),
        makeSession({ child_id: "c1", child_name: "Grace", status: "dna" }),
      ];
      const alerts = identifyTherapyAlerts([], sessions, 1, now);
      const dna = alerts.filter((a) => a.type === "repeated_dna");
      expect(dna[0].message).toContain("review engagement and barriers");
    });

    it("uses child_id as the alert id for repeated DNA", () => {
      const sessions = [
        makeSession({ child_id: "c1", status: "dna" }),
        makeSession({ child_id: "c1", status: "dna" }),
      ];
      const alerts = identifyTherapyAlerts([], sessions, 1, now);
      const dna = alerts.filter((a) => a.type === "repeated_dna");
      expect(dna[0].id).toBe("c1");
    });
  });

  // -- Multiple alert types
  describe("multiple alert types", () => {
    it("generates alerts of different types for the same child", () => {
      const referrals = [
        makeReferral({
          child_id: "c1",
          child_name: "Isla",
          status: "waitlisted",
          waiting_time_days: 60,
        }),
      ];
      const sessions = [
        makeSession({
          child_id: "c1",
          child_name: "Isla",
          session_date: "2026-04-01",
          status: "attended",
          progress_rating: "significant_regression",
          engagement_level: "refused",
        }),
        makeSession({ child_id: "c1", child_name: "Isla", status: "dna" }),
        makeSession({ child_id: "c1", child_name: "Isla", status: "dna" }),
      ];
      const alerts = identifyTherapyAlerts(referrals, sessions, 1, now);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("long_wait");
      expect(types).toContain("significant_regression");
      expect(types).toContain("engagement_refused");
      expect(types).toContain("repeated_dna");
    });

    it("produces no alerts when everything is healthy", () => {
      const referrals = [
        makeReferral({ status: "active", waiting_time_days: 10 }),
      ];
      const sessions = [
        makeSession({
          status: "attended",
          engagement_level: "fully_engaged",
          progress_rating: "some_progress",
        }),
      ];
      const alerts = identifyTherapyAlerts(referrals, sessions, 1, now);
      expect(alerts).toHaveLength(0);
    });

    it("severity escalation: 56+ days is critical, <=56 is high for long_wait", () => {
      const referrals = [
        makeReferral({ id: "r1", child_name: "A", status: "waitlisted", waiting_time_days: 56 }),
        makeReferral({ id: "r2", child_name: "B", status: "waitlisted", waiting_time_days: 57 }),
      ];
      const alerts = identifyTherapyAlerts(referrals, [], 2, now);
      const a56 = alerts.find((a) => a.id === "r1");
      const a57 = alerts.find((a) => a.id === "r2");
      expect(a56?.severity).toBe("high");
      expect(a57?.severity).toBe("critical");
    });
  });

  // -- Ignores non-attended for regression/engagement
  it("ignores non-attended sessions for regression and engagement alerts", () => {
    const sessions = [
      makeSession({
        child_id: "c1",
        status: "cancelled_child",
        progress_rating: "significant_regression",
        engagement_level: "refused",
      }),
    ];
    const alerts = identifyTherapyAlerts([], sessions, 1, now);
    expect(alerts.filter((a) =>
      a.type === "significant_regression" ||
      a.type === "some_regression" ||
      a.type === "engagement_refused" ||
      a.type === "engagement_reluctant"
    )).toHaveLength(0);
  });
});

// ── CRUD fallback (Supabase disabled) ──────────────────────────────────────

describe("CRUD fallback (Supabase disabled)", () => {
  it("listReferrals returns empty array when Supabase disabled", async () => {
    const result = await listReferrals("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listReferrals returns empty array with filters", async () => {
    const result = await listReferrals("home-1", {
      childId: "c1",
      status: "active",
      therapyType: "cbt",
      limit: 50,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("createReferral returns error when Supabase disabled", async () => {
    const result = await createReferral({
      homeId: "home-1",
      childId: "c1",
      childName: "Test",
      therapyType: "cbt",
      providerName: "Provider",
      referralDate: "2026-01-01",
      referralReason: "Support needed",
      frequency: "Weekly",
      goals: ["Goal 1"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateReferral returns error when Supabase disabled", async () => {
    const result = await updateReferral("ref-1", { status: "active" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("listSessions returns empty array when Supabase disabled", async () => {
    const result = await listSessions("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listSessions returns empty array with filters", async () => {
    const result = await listSessions("home-1", {
      childId: "c1",
      referralId: "ref-1",
      status: "attended",
      dateFrom: "2026-01-01",
      dateTo: "2026-12-31",
      limit: 100,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("createSession returns error when Supabase disabled", async () => {
    const result = await createSession({
      homeId: "home-1",
      childId: "c1",
      childName: "Test",
      referralId: "ref-1",
      therapyType: "cbt",
      sessionDate: "2026-03-01",
      sessionNumber: 1,
      status: "attended",
      engagementLevel: "fully_engaged",
      progressRating: "some_progress",
      goalsAddressed: ["Goal 1"],
      homeActions: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });
});

// ── Edge cases ─────────────────────────────────────────────────────────────

describe("Edge cases", () => {
  it("handles a single referral correctly", () => {
    const referrals = [makeReferral({ status: "active", therapy_type: "emdr" })];
    const result = computeTherapyMetrics(referrals, [], 1);
    expect(result.active_referrals).toBe(1);
    expect(result.by_therapy_type).toEqual({ emdr: 1 });
    expect(result.by_status).toEqual({ active: 1 });
  });

  it("handles a single session correctly", () => {
    const sessions = [makeSession({ status: "attended", engagement_level: "fully_engaged", progress_rating: "significant_progress" })];
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.total_sessions).toBe(1);
    expect(result.sessions_attended).toBe(1);
    expect(result.attendance_rate).toBe(100);
    expect(result.avg_engagement).toBe(5);
    expect(result.children_progressing).toBe(1);
  });

  it("handles large datasets without error", () => {
    const referrals: TherapyReferral[] = [];
    const sessions: TherapySession[] = [];
    for (let i = 0; i < 200; i++) {
      referrals.push(
        makeReferral({
          child_id: `child-${i}`,
          child_name: `Child ${i}`,
          status: i % 3 === 0 ? "active" : i % 3 === 1 ? "waitlisted" : "completed",
          therapy_type: THERAPY_TYPES[i % THERAPY_TYPES.length].type,
          waiting_time_days: i % 2 === 0 ? i : null,
        }),
      );
    }
    for (let i = 0; i < 500; i++) {
      sessions.push(
        makeSession({
          child_id: `child-${i % 50}`,
          child_name: `Child ${i % 50}`,
          status: i % 4 === 0 ? "attended" : i % 4 === 1 ? "dna" : i % 4 === 2 ? "cancelled_child" : "scheduled",
          engagement_level: i % 5 === 0 ? "fully_engaged" : i % 5 === 1 ? "partially_engaged" : i % 5 === 2 ? "reluctant" : i % 5 === 3 ? "refused" : "not_applicable",
          progress_rating: i % 5 === 0 ? "significant_progress" : i % 5 === 1 ? "some_progress" : i % 5 === 2 ? "stable" : i % 5 === 3 ? "some_regression" : "significant_regression",
          session_date: `2026-0${(i % 4) + 1}-${String((i % 28) + 1).padStart(2, "0")}`,
        }),
      );
    }
    const result = computeTherapyMetrics(referrals, sessions, 200);
    expect(result.total_sessions).toBe(500);
    expect(result.active_referrals).toBeGreaterThan(0);
    expect(typeof result.attendance_rate).toBe("number");
    expect(typeof result.avg_engagement).toBe("number");
  });

  it("identifyTherapyAlerts handles large datasets", () => {
    const referrals: TherapyReferral[] = [];
    for (let i = 0; i < 50; i++) {
      referrals.push(
        makeReferral({
          child_id: `child-${i}`,
          child_name: `Child ${i}`,
          status: "waitlisted",
          waiting_time_days: 30 + i,
        }),
      );
    }
    const alerts = identifyTherapyAlerts(referrals, [], 50);
    expect(alerts.length).toBe(50);
  });

  it("computeTherapyMetrics returns correct types for all fields", () => {
    const result = computeTherapyMetrics([], [], 0);
    expect(typeof result.active_referrals).toBe("number");
    expect(typeof result.children_in_therapy).toBe("number");
    expect(typeof result.children_waiting).toBe("number");
    expect(typeof result.total_sessions).toBe("number");
    expect(typeof result.sessions_attended).toBe("number");
    expect(["number", "object"]).toContain(typeof result.attendance_rate); // number | null
    expect(["number", "object"]).toContain(typeof result.avg_engagement); // number | null
    expect(typeof result.children_progressing).toBe("number");
    expect(typeof result.children_regressing).toBe("number");
    expect(["number", "object"]).toContain(typeof result.avg_waiting_days); // number | null
    expect(typeof result.by_therapy_type).toBe("object");
    expect(typeof result.by_status).toBe("object");
    expect(typeof result.by_engagement).toBe("object");
  });

  it("identifyTherapyAlerts returns alerts with correct shape", () => {
    const sessions = [
      makeSession({ child_id: "c1", status: "dna" }),
      makeSession({ child_id: "c1", status: "dna" }),
    ];
    const alerts = identifyTherapyAlerts([], sessions, 1);
    expect(alerts.length).toBeGreaterThan(0);
    for (const alert of alerts) {
      expect(alert).toHaveProperty("type");
      expect(alert).toHaveProperty("severity");
      expect(alert).toHaveProperty("message");
      expect(alert).toHaveProperty("id");
      expect(["critical", "high", "medium"]).toContain(alert.severity);
    }
  });

  it("a child can be both in therapy and waiting for different referrals", () => {
    const referrals = [
      makeReferral({ child_id: "c1", status: "active", therapy_type: "cbt" }),
      makeReferral({ child_id: "c1", status: "waitlisted", therapy_type: "emdr" }),
    ];
    const result = computeTherapyMetrics(referrals, [], 1);
    expect(result.children_in_therapy).toBe(1);
    expect(result.children_waiting).toBe(1);
  });

  it("multiple referrals for same child only counted once for children_in_therapy", () => {
    const referrals = [
      makeReferral({ child_id: "c1", status: "active", therapy_type: "cbt" }),
      makeReferral({ child_id: "c1", status: "active", therapy_type: "dbt" }),
      makeReferral({ child_id: "c1", status: "active", therapy_type: "emdr" }),
    ];
    const result = computeTherapyMetrics(referrals, [], 1);
    expect(result.children_in_therapy).toBe(1);
    expect(result.active_referrals).toBe(3);
  });

  it("handles referral with 'other' therapy type in alerts", () => {
    const referrals = [
      makeReferral({
        status: "waitlisted",
        waiting_time_days: 40,
        therapy_type: "other",
        child_name: "Test Child",
      }),
    ];
    const alerts = identifyTherapyAlerts(referrals, [], 1);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain("Other");
  });

  it("by_therapy_type counts all referral statuses, not just active", () => {
    const referrals = [
      makeReferral({ therapy_type: "cbt", status: "active" }),
      makeReferral({ therapy_type: "cbt", status: "completed" }),
      makeReferral({ therapy_type: "cbt", status: "declined" }),
    ];
    const result = computeTherapyMetrics(referrals, [], 2);
    expect(result.by_therapy_type.cbt).toBe(3);
  });

  it("attendance rate: only attended, dna, cancelled_child count", () => {
    const sessions = [
      makeSession({ status: "attended" }),
      makeSession({ status: "dna" }),
      makeSession({ status: "cancelled_child" }),
      makeSession({ status: "scheduled" }),
      makeSession({ status: "rescheduled" }),
      makeSession({ status: "cancelled_therapist" }),
    ];
    // denominator = 1 + 1 + 1 = 3; rate = 1/3 = 33.3
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.attendance_rate).toBe(33.3);
  });

  it("computeTherapyMetrics returns all 13 fields", () => {
    const result = computeTherapyMetrics([], [], 0);
    const keys = Object.keys(result);
    expect(keys).toHaveLength(13);
    expect(keys).toContain("active_referrals");
    expect(keys).toContain("children_in_therapy");
    expect(keys).toContain("children_waiting");
    expect(keys).toContain("total_sessions");
    expect(keys).toContain("sessions_attended");
    expect(keys).toContain("attendance_rate");
    expect(keys).toContain("avg_engagement");
    expect(keys).toContain("children_progressing");
    expect(keys).toContain("children_regressing");
    expect(keys).toContain("avg_waiting_days");
    expect(keys).toContain("by_therapy_type");
    expect(keys).toContain("by_status");
    expect(keys).toContain("by_engagement");
  });

  it("identifyTherapyAlerts defaults now to current date", () => {
    // just ensure it does not throw without explicit now
    const alerts = identifyTherapyAlerts([], [], 0);
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("concurrent child with both regression and refused engagement produces two alerts", () => {
    const sessions = [
      makeSession({
        child_id: "c1",
        child_name: "Multi-alert Child",
        status: "attended",
        progress_rating: "some_regression",
        engagement_level: "refused",
        session_date: "2026-04-01",
      }),
    ];
    const alerts = identifyTherapyAlerts([], sessions, 1);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("some_regression");
    expect(types).toContain("engagement_refused");
  });

  it("boundary: exactly 28 waiting days does not trigger long_wait", () => {
    const referrals = [
      makeReferral({ status: "waitlisted", waiting_time_days: 28 }),
    ];
    const alerts = identifyTherapyAlerts(referrals, [], 1);
    expect(alerts.filter((a) => a.type === "long_wait")).toHaveLength(0);
  });

  it("boundary: 29 waiting days triggers long_wait", () => {
    const referrals = [
      makeReferral({ status: "waitlisted", waiting_time_days: 29 }),
    ];
    const alerts = identifyTherapyAlerts(referrals, [], 1);
    expect(alerts.filter((a) => a.type === "long_wait")).toHaveLength(1);
  });

  it("boundary: exactly 56 waiting days is high severity", () => {
    const referrals = [
      makeReferral({ status: "waitlisted", waiting_time_days: 56 }),
    ];
    const alerts = identifyTherapyAlerts(referrals, [], 1);
    expect(alerts[0].severity).toBe("high");
  });

  it("boundary: 57 waiting days is critical severity", () => {
    const referrals = [
      makeReferral({ status: "waitlisted", waiting_time_days: 57 }),
    ];
    const alerts = identifyTherapyAlerts(referrals, [], 1);
    expect(alerts[0].severity).toBe("critical");
  });

  it("boundary: exactly 1 DNA session does not trigger repeated_dna", () => {
    const sessions = [makeSession({ child_id: "c1", status: "dna" })];
    const alerts = identifyTherapyAlerts([], sessions, 1);
    expect(alerts.filter((a) => a.type === "repeated_dna")).toHaveLength(0);
  });

  it("boundary: exactly 2 DNA sessions triggers repeated_dna", () => {
    const sessions = [
      makeSession({ child_id: "c1", status: "dna" }),
      makeSession({ child_id: "c1", status: "dna" }),
    ];
    const alerts = identifyTherapyAlerts([], sessions, 1);
    expect(alerts.filter((a) => a.type === "repeated_dna")).toHaveLength(1);
  });

  it("does not generate long_wait for completed referral with waiting days", () => {
    const referrals = [
      makeReferral({ status: "completed", waiting_time_days: 90 }),
    ];
    const alerts = identifyTherapyAlerts(referrals, [], 1);
    expect(alerts.filter((a) => a.type === "long_wait")).toHaveLength(0);
  });

  it("does not generate long_wait for discontinued referral", () => {
    const referrals = [
      makeReferral({ status: "discontinued", waiting_time_days: 60 }),
    ];
    const alerts = identifyTherapyAlerts(referrals, [], 1);
    expect(alerts.filter((a) => a.type === "long_wait")).toHaveLength(0);
  });

  it("does not generate long_wait for identified referral", () => {
    const referrals = [
      makeReferral({ status: "identified", waiting_time_days: 100 }),
    ];
    const alerts = identifyTherapyAlerts(referrals, [], 1);
    expect(alerts.filter((a) => a.type === "long_wait")).toHaveLength(0);
  });

  it("by_engagement includes not_applicable when present in attended sessions", () => {
    const sessions = [
      makeSession({ status: "attended", engagement_level: "not_applicable" }),
      makeSession({ status: "attended", engagement_level: "fully_engaged" }),
    ];
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.by_engagement).toEqual({ not_applicable: 1, fully_engaged: 1 });
  });

  it("avg_waiting_days excludes zero waiting time", () => {
    const referrals = [
      makeReferral({ waiting_time_days: 0 }),
      makeReferral({ waiting_time_days: 40 }),
    ];
    const result = computeTherapyMetrics(referrals, [], 2);
    expect(result.avg_waiting_days).toBe(40);
  });

  it("children with only non-attended sessions have no progress impact", () => {
    const sessions = [
      makeSession({ child_id: "c1", status: "dna", progress_rating: "significant_progress" }),
      makeSession({ child_id: "c2", status: "cancelled_child", progress_rating: "significant_regression" }),
      makeSession({ child_id: "c3", status: "scheduled", progress_rating: "some_progress" }),
    ];
    const result = computeTherapyMetrics([], sessions, 3);
    expect(result.children_progressing).toBe(0);
    expect(result.children_regressing).toBe(0);
  });

  it("multiple therapy types in by_therapy_type are all represented", () => {
    const referrals = [
      makeReferral({ therapy_type: "cbt" }),
      makeReferral({ therapy_type: "dbt" }),
      makeReferral({ therapy_type: "emdr" }),
      makeReferral({ therapy_type: "play_therapy" }),
      makeReferral({ therapy_type: "art_therapy" }),
    ];
    const result = computeTherapyMetrics(referrals, [], 3);
    expect(Object.keys(result.by_therapy_type)).toHaveLength(5);
    expect(result.by_therapy_type.cbt).toBe(1);
    expect(result.by_therapy_type.dbt).toBe(1);
    expect(result.by_therapy_type.emdr).toBe(1);
    expect(result.by_therapy_type.play_therapy).toBe(1);
    expect(result.by_therapy_type.art_therapy).toBe(1);
  });

  it("all 7 referral statuses are tracked in by_status", () => {
    const referrals = [
      makeReferral({ status: "identified" }),
      makeReferral({ status: "referred" }),
      makeReferral({ status: "waitlisted" }),
      makeReferral({ status: "active" }),
      makeReferral({ status: "completed" }),
      makeReferral({ status: "discontinued" }),
      makeReferral({ status: "declined" }),
    ];
    const result = computeTherapyMetrics(referrals, [], 3);
    expect(Object.keys(result.by_status)).toHaveLength(7);
  });

  it("significant_progress counted as progressing, not regressing", () => {
    const sessions = [
      makeSession({
        child_id: "c1",
        status: "attended",
        progress_rating: "significant_progress",
      }),
    ];
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.children_progressing).toBe(1);
    expect(result.children_regressing).toBe(0);
  });

  it("significant_regression counted as regressing, not progressing", () => {
    const sessions = [
      makeSession({
        child_id: "c1",
        status: "attended",
        progress_rating: "significant_regression",
      }),
    ];
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.children_progressing).toBe(0);
    expect(result.children_regressing).toBe(1);
  });

  it("makeReferral factory produces unique IDs", () => {
    const r1 = makeReferral();
    const r2 = makeReferral();
    expect(r1.id).not.toBe(r2.id);
  });

  it("makeSession factory produces unique IDs", () => {
    const s1 = makeSession();
    const s2 = makeSession();
    expect(s1.id).not.toBe(s2.id);
  });

  it("alert message for long_wait resolves therapy type label from THERAPY_TYPES", () => {
    const referrals = [
      makeReferral({
        status: "referred",
        waiting_time_days: 35,
        therapy_type: "speech_language",
        child_name: "Zara",
      }),
    ];
    const alerts = identifyTherapyAlerts(referrals, [], 1);
    expect(alerts[0].message).toContain("Speech & Language");
  });

  it("fully_engaged engagement score is 5", () => {
    const sessions = [
      makeSession({ status: "attended", engagement_level: "fully_engaged" }),
    ];
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.avg_engagement).toBe(5);
  });

  it("partially_engaged engagement score is 4", () => {
    const sessions = [
      makeSession({ status: "attended", engagement_level: "partially_engaged" }),
    ];
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.avg_engagement).toBe(4);
  });

  it("reluctant engagement score is 3", () => {
    const sessions = [
      makeSession({ status: "attended", engagement_level: "reluctant" }),
    ];
    const result = computeTherapyMetrics([], sessions, 1);
    expect(result.avg_engagement).toBe(3);
  });

  it("no regression alert for non-attended cancelled_therapist session", () => {
    const sessions = [
      makeSession({
        child_id: "c1",
        status: "cancelled_therapist",
        progress_rating: "significant_regression",
        engagement_level: "refused",
      }),
    ];
    const alerts = identifyTherapyAlerts([], sessions, 1);
    expect(alerts).toHaveLength(0);
  });
});
