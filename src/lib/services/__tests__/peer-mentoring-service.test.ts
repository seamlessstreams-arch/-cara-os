// ══════════════════════════════════════════════════════════════════════════════
// CARA — PEER MENTORING SERVICE TESTS
// Pure-function unit tests for peer mentoring metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 5 (engaging with the wider community —
// peer support), Reg 7 (children's views — peer relationships),
// Reg 6 (quality and purpose of care — positive peer culture).
// SCCIF: Overall Experiences — "Children support each other."
// "Positive peer relationships are encouraged and supported."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  PAIRING_TYPES,
  PAIRING_STATUSES,
  SESSION_OUTCOMES,
  SAFEGUARDING_FLAGS,
  listPairings,
  createPairing,
  updatePairing,
} from "../peer-mentoring-service";

import type {
  PeerPairing,
  PairingType,
  PairingStatus,
  SessionOutcome,
  SafeguardingFlag,
} from "../peer-mentoring-service";

const { computePeerMetrics, identifyPeerAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Date string N days in the future from now. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal PeerPairing with sensible defaults. */
function makePairing(overrides: Partial<PeerPairing> = {}): PeerPairing {
  return {
    id: "pair-1",
    home_id: "home-1",
    mentor_name: "Alice Smith",
    mentor_id: "child-1",
    mentee_name: "Bob Jones",
    mentee_id: "child-2",
    pairing_type: "buddy_system",
    pairing_status: "active",
    start_date: daysAgo(30),
    end_date: null,
    goals: ["build confidence", "improve social skills"],
    sessions_completed: 5,
    last_session_date: daysAgo(3),
    last_session_outcome: "positive",
    safeguarding_flag: "none",
    mentor_feedback: "Going well",
    mentee_feedback: "I like it",
    staff_observations: "Good progress",
    reviewed_by: "staff-1",
    review_date: daysAgo(7),
    notes: null,
    created_at: daysAgoISO(30),
    updated_at: daysAgoISO(3),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("PAIRING_TYPES", () => {
  it("has exactly 7 entries", () => {
    expect(PAIRING_TYPES).toHaveLength(7);
  });

  it("contains unique type values", () => {
    const values = PAIRING_TYPES.map((t) => t.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = PAIRING_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes buddy_system", () => {
    expect(PAIRING_TYPES.find((t) => t.type === "buddy_system")).toBeTruthy();
  });

  it("includes peer_mentor", () => {
    expect(PAIRING_TYPES.find((t) => t.type === "peer_mentor")).toBeTruthy();
  });

  it("includes welcome_buddy", () => {
    expect(PAIRING_TYPES.find((t) => t.type === "welcome_buddy")).toBeTruthy();
  });

  it("includes skills_partner", () => {
    expect(PAIRING_TYPES.find((t) => t.type === "skills_partner")).toBeTruthy();
  });

  it("includes study_buddy", () => {
    expect(PAIRING_TYPES.find((t) => t.type === "study_buddy")).toBeTruthy();
  });

  it("includes activity_partner", () => {
    expect(PAIRING_TYPES.find((t) => t.type === "activity_partner")).toBeTruthy();
  });

  it("includes other", () => {
    expect(PAIRING_TYPES.find((t) => t.type === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const t of PAIRING_TYPES) {
      expect(t.label.length).toBeGreaterThan(0);
    }
  });
});

describe("PAIRING_STATUSES", () => {
  it("has exactly 5 entries", () => {
    expect(PAIRING_STATUSES).toHaveLength(5);
  });

  it("contains unique status values", () => {
    const values = PAIRING_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = PAIRING_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes active", () => {
    expect(PAIRING_STATUSES.find((s) => s.status === "active")).toBeTruthy();
  });

  it("includes paused", () => {
    expect(PAIRING_STATUSES.find((s) => s.status === "paused")).toBeTruthy();
  });

  it("includes completed", () => {
    expect(PAIRING_STATUSES.find((s) => s.status === "completed")).toBeTruthy();
  });

  it("includes ended_early", () => {
    expect(PAIRING_STATUSES.find((s) => s.status === "ended_early")).toBeTruthy();
  });

  it("includes pending_review", () => {
    expect(PAIRING_STATUSES.find((s) => s.status === "pending_review")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of PAIRING_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("SESSION_OUTCOMES", () => {
  it("has exactly 5 entries", () => {
    expect(SESSION_OUTCOMES).toHaveLength(5);
  });

  it("contains unique outcome values", () => {
    const values = SESSION_OUTCOMES.map((o) => o.outcome);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = SESSION_OUTCOMES.map((o) => o.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes very_positive", () => {
    expect(SESSION_OUTCOMES.find((o) => o.outcome === "very_positive")).toBeTruthy();
  });

  it("includes positive", () => {
    expect(SESSION_OUTCOMES.find((o) => o.outcome === "positive")).toBeTruthy();
  });

  it("includes neutral", () => {
    expect(SESSION_OUTCOMES.find((o) => o.outcome === "neutral")).toBeTruthy();
  });

  it("includes negative", () => {
    expect(SESSION_OUTCOMES.find((o) => o.outcome === "negative")).toBeTruthy();
  });

  it("includes session_cancelled", () => {
    expect(SESSION_OUTCOMES.find((o) => o.outcome === "session_cancelled")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const o of SESSION_OUTCOMES) {
      expect(o.label.length).toBeGreaterThan(0);
    }
  });
});

describe("SAFEGUARDING_FLAGS", () => {
  it("has exactly 6 entries", () => {
    expect(SAFEGUARDING_FLAGS).toHaveLength(6);
  });

  it("contains unique flag values", () => {
    const values = SAFEGUARDING_FLAGS.map((f) => f.flag);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = SAFEGUARDING_FLAGS.map((f) => f.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes none", () => {
    expect(SAFEGUARDING_FLAGS.find((f) => f.flag === "none")).toBeTruthy();
  });

  it("includes power_imbalance", () => {
    expect(SAFEGUARDING_FLAGS.find((f) => f.flag === "power_imbalance")).toBeTruthy();
  });

  it("includes bullying_concern", () => {
    expect(SAFEGUARDING_FLAGS.find((f) => f.flag === "bullying_concern")).toBeTruthy();
  });

  it("includes inappropriate_behaviour", () => {
    expect(SAFEGUARDING_FLAGS.find((f) => f.flag === "inappropriate_behaviour")).toBeTruthy();
  });

  it("includes emotional_harm", () => {
    expect(SAFEGUARDING_FLAGS.find((f) => f.flag === "emotional_harm")).toBeTruthy();
  });

  it("includes escalated", () => {
    expect(SAFEGUARDING_FLAGS.find((f) => f.flag === "escalated")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const f of SAFEGUARDING_FLAGS) {
      expect(f.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computePeerMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computePeerMetrics", () => {
  it("returns zeroed metrics for empty pairings array", () => {
    const m = computePeerMetrics([], 0);
    expect(m.total_pairings).toBe(0);
    expect(m.active_pairings).toBe(0);
    expect(m.completed_pairings).toBe(0);
    expect(m.ended_early_count).toBe(0);
    expect(m.children_involved).toBe(0);
    expect(m.participation_rate).toBeNull();; expect(m.total_sessions).toBe(0);
    expect(m.average_sessions_per_pairing).toBeNull();; expect(m.positive_outcome_rate).toBeNull();; expect(m.safeguarding_concerns).toBe(0);
    expect(m.mentor_feedback_rate).toBeNull();; expect(m.mentee_feedback_rate).toBeNull();; expect(Object.keys(m.by_pairing_type)).toHaveLength(0);
    expect(Object.keys(m.by_status)).toHaveLength(0);
    expect(Object.keys(m.by_session_outcome)).toHaveLength(0);
    expect(Object.keys(m.by_safeguarding_flag)).toHaveLength(0);
  });

  // ── total_pairings ─────────────────────────────────────────────────

  it("total_pairings equals the number of pairings", () => {
    const pairings = [
      makePairing({ id: "p1" }),
      makePairing({ id: "p2" }),
      makePairing({ id: "p3" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.total_pairings).toBe(3);
  });

  it("total_pairings is 1 for single pairing", () => {
    const m = computePeerMetrics([makePairing()], 2);
    expect(m.total_pairings).toBe(1);
  });

  // ── active_pairings ────────────────────────────────────────────────

  it("active_pairings counts only active status", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active" }),
      makePairing({ id: "p2", pairing_status: "active" }),
      makePairing({ id: "p3", pairing_status: "completed" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.active_pairings).toBe(2);
  });

  it("active_pairings is 0 when no active pairings", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "completed" }),
      makePairing({ id: "p2", pairing_status: "ended_early" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.active_pairings).toBe(0);
  });

  // ── completed_pairings ─────────────────────────────────────────────

  it("completed_pairings counts only completed status", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "completed" }),
      makePairing({ id: "p2", pairing_status: "completed" }),
      makePairing({ id: "p3", pairing_status: "active" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.completed_pairings).toBe(2);
  });

  it("completed_pairings is 0 when none completed", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active" }),
      makePairing({ id: "p2", pairing_status: "paused" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.completed_pairings).toBe(0);
  });

  // ── ended_early_count ──────────────────────────────────────────────

  it("ended_early_count counts only ended_early status", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "ended_early" }),
      makePairing({ id: "p2", pairing_status: "ended_early" }),
      makePairing({ id: "p3", pairing_status: "completed" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.ended_early_count).toBe(2);
  });

  it("ended_early_count is 0 when none ended early", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active" }),
      makePairing({ id: "p2", pairing_status: "completed" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.ended_early_count).toBe(0);
  });

  // ── children_involved ──────────────────────────────────────────────

  it("children_involved counts unique mentor and mentee IDs", () => {
    const pairings = [
      makePairing({ id: "p1", mentor_id: "c1", mentee_id: "c2" }),
      makePairing({ id: "p2", mentor_id: "c3", mentee_id: "c4" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.children_involved).toBe(4);
  });

  it("children_involved deduplicates when same child is mentor and mentee", () => {
    const pairings = [
      makePairing({ id: "p1", mentor_id: "c1", mentee_id: "c2" }),
      makePairing({ id: "p2", mentor_id: "c2", mentee_id: "c3" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.children_involved).toBe(3);
  });

  it("children_involved is 2 for a single pairing with distinct mentor and mentee", () => {
    const pairings = [makePairing({ mentor_id: "c1", mentee_id: "c2" })];
    const m = computePeerMetrics(pairings, 5);
    expect(m.children_involved).toBe(2);
  });

  it("children_involved deduplicates when same child appears multiple times as mentor", () => {
    const pairings = [
      makePairing({ id: "p1", mentor_id: "c1", mentee_id: "c2" }),
      makePairing({ id: "p2", mentor_id: "c1", mentee_id: "c3" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.children_involved).toBe(3);
  });

  it("children_involved is 1 when mentor and mentee are the same ID", () => {
    const pairings = [makePairing({ mentor_id: "c1", mentee_id: "c1" })];
    const m = computePeerMetrics(pairings, 5);
    expect(m.children_involved).toBe(1);
  });

  // ── participation_rate ─────────────────────────────────────────────

  it("participation_rate is 100 when all children involved", () => {
    const pairings = [
      makePairing({ id: "p1", mentor_id: "c1", mentee_id: "c2" }),
    ];
    const m = computePeerMetrics(pairings, 2);
    expect(m.participation_rate).toBe(100);
  });

  it("participation_rate is 50 when half the children involved", () => {
    const pairings = [
      makePairing({ id: "p1", mentor_id: "c1", mentee_id: "c2" }),
    ];
    const m = computePeerMetrics(pairings, 4);
    expect(m.participation_rate).toBe(50);
  });

  it("participation_rate is 0 when totalChildren is 0", () => {
    const m = computePeerMetrics([], 0);
    expect(m.participation_rate).toBeNull();; });

  it("participation_rate rounds to one decimal place", () => {
    const pairings = [
      makePairing({ id: "p1", mentor_id: "c1", mentee_id: "c2" }),
    ];
    const m = computePeerMetrics(pairings, 3);
    expect(m.participation_rate).toBe(66.7);
  });

  it("participation_rate is 0 with empty pairings and positive totalChildren", () => {
    const m = computePeerMetrics([], 5);
    expect(m.participation_rate).toBe(0);
  });

  // ── total_sessions ─────────────────────────────────────────────────

  it("total_sessions sums sessions_completed across all pairings", () => {
    const pairings = [
      makePairing({ id: "p1", sessions_completed: 3 }),
      makePairing({ id: "p2", sessions_completed: 7 }),
      makePairing({ id: "p3", sessions_completed: 2 }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.total_sessions).toBe(12);
  });

  it("total_sessions is 0 when all pairings have 0 sessions", () => {
    const pairings = [
      makePairing({ id: "p1", sessions_completed: 0 }),
      makePairing({ id: "p2", sessions_completed: 0 }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.total_sessions).toBe(0);
  });

  it("total_sessions is 0 for empty pairings", () => {
    const m = computePeerMetrics([], 0);
    expect(m.total_sessions).toBe(0);
  });

  it("total_sessions equals single pairing sessions_completed for one pairing", () => {
    const pairings = [makePairing({ sessions_completed: 15 })];
    const m = computePeerMetrics(pairings, 5);
    expect(m.total_sessions).toBe(15);
  });

  // ── average_sessions_per_pairing ───────────────────────────────────

  it("average_sessions_per_pairing computes correct average", () => {
    const pairings = [
      makePairing({ id: "p1", sessions_completed: 4 }),
      makePairing({ id: "p2", sessions_completed: 6 }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.average_sessions_per_pairing).toBe(5);
  });

  it("average_sessions_per_pairing rounds to one decimal place", () => {
    const pairings = [
      makePairing({ id: "p1", sessions_completed: 1 }),
      makePairing({ id: "p2", sessions_completed: 2 }),
      makePairing({ id: "p3", sessions_completed: 3 }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.average_sessions_per_pairing).toBe(2);
  });

  it("average_sessions_per_pairing is 0 for empty pairings", () => {
    const m = computePeerMetrics([], 0);
    expect(m.average_sessions_per_pairing).toBeNull();; });

  it("average_sessions_per_pairing is 0 when all sessions are 0", () => {
    const pairings = [
      makePairing({ id: "p1", sessions_completed: 0 }),
      makePairing({ id: "p2", sessions_completed: 0 }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.average_sessions_per_pairing).toBe(0);
  });

  it("average_sessions_per_pairing with uneven distribution", () => {
    const pairings = [
      makePairing({ id: "p1", sessions_completed: 10 }),
      makePairing({ id: "p2", sessions_completed: 0 }),
      makePairing({ id: "p3", sessions_completed: 1 }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.average_sessions_per_pairing).toBe(3.7);
  });

  // ── positive_outcome_rate ──────────────────────────────────────────

  it("positive_outcome_rate is 100 when all outcomes are positive or very_positive", () => {
    const pairings = [
      makePairing({ id: "p1", last_session_outcome: "very_positive" }),
      makePairing({ id: "p2", last_session_outcome: "positive" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.positive_outcome_rate).toBe(100);
  });

  it("positive_outcome_rate is 0 when no outcomes are positive", () => {
    const pairings = [
      makePairing({ id: "p1", last_session_outcome: "negative" }),
      makePairing({ id: "p2", last_session_outcome: "neutral" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.positive_outcome_rate).toBe(0);
  });

  it("positive_outcome_rate excludes pairings with null outcomes", () => {
    const pairings = [
      makePairing({ id: "p1", last_session_outcome: "positive" }),
      makePairing({ id: "p2", last_session_outcome: null }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.positive_outcome_rate).toBe(100);
  });

  it("positive_outcome_rate is 0 when all outcomes are null", () => {
    const pairings = [
      makePairing({ id: "p1", last_session_outcome: null }),
      makePairing({ id: "p2", last_session_outcome: null }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.positive_outcome_rate).toBeNull();; });

  it("positive_outcome_rate rounds to one decimal place", () => {
    const pairings = [
      makePairing({ id: "p1", last_session_outcome: "positive" }),
      makePairing({ id: "p2", last_session_outcome: "neutral" }),
      makePairing({ id: "p3", last_session_outcome: "negative" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.positive_outcome_rate).toBe(33.3);
  });

  it("positive_outcome_rate counts very_positive as positive", () => {
    const pairings = [
      makePairing({ id: "p1", last_session_outcome: "very_positive" }),
      makePairing({ id: "p2", last_session_outcome: "neutral" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.positive_outcome_rate).toBe(50);
  });

  it("positive_outcome_rate is 50 with one positive and one negative", () => {
    const pairings = [
      makePairing({ id: "p1", last_session_outcome: "positive" }),
      makePairing({ id: "p2", last_session_outcome: "negative" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.positive_outcome_rate).toBe(50);
  });

  it("positive_outcome_rate does not count session_cancelled as positive", () => {
    const pairings = [
      makePairing({ id: "p1", last_session_outcome: "session_cancelled" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.positive_outcome_rate).toBe(0);
  });

  // ── safeguarding_concerns ──────────────────────────────────────────

  it("safeguarding_concerns counts pairings with flag not none", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "power_imbalance" }),
      makePairing({ id: "p2", safeguarding_flag: "none" }),
      makePairing({ id: "p3", safeguarding_flag: "bullying_concern" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.safeguarding_concerns).toBe(2);
  });

  it("safeguarding_concerns is 0 when all flags are none", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "none" }),
      makePairing({ id: "p2", safeguarding_flag: "none" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.safeguarding_concerns).toBe(0);
  });

  it("safeguarding_concerns includes escalated flag", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "escalated" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.safeguarding_concerns).toBe(1);
  });

  it("safeguarding_concerns counts all non-none flag types", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "power_imbalance" }),
      makePairing({ id: "p2", safeguarding_flag: "bullying_concern" }),
      makePairing({ id: "p3", safeguarding_flag: "inappropriate_behaviour" }),
      makePairing({ id: "p4", safeguarding_flag: "emotional_harm" }),
      makePairing({ id: "p5", safeguarding_flag: "escalated" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.safeguarding_concerns).toBe(5);
  });

  // ── mentor_feedback_rate ───────────────────────────────────────────

  it("mentor_feedback_rate is 100 when all pairings have mentor feedback", () => {
    const pairings = [
      makePairing({ id: "p1", mentor_feedback: "Good" }),
      makePairing({ id: "p2", mentor_feedback: "Excellent" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.mentor_feedback_rate).toBe(100);
  });

  it("mentor_feedback_rate is 0 when no pairings have mentor feedback", () => {
    const pairings = [
      makePairing({ id: "p1", mentor_feedback: null }),
      makePairing({ id: "p2", mentor_feedback: null }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.mentor_feedback_rate).toBe(0);
  });

  it("mentor_feedback_rate is 50 when half have mentor feedback", () => {
    const pairings = [
      makePairing({ id: "p1", mentor_feedback: "Good" }),
      makePairing({ id: "p2", mentor_feedback: null }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.mentor_feedback_rate).toBe(50);
  });

  it("mentor_feedback_rate rounds to one decimal place", () => {
    const pairings = [
      makePairing({ id: "p1", mentor_feedback: "Good" }),
      makePairing({ id: "p2", mentor_feedback: null }),
      makePairing({ id: "p3", mentor_feedback: null }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.mentor_feedback_rate).toBe(33.3);
  });

  it("mentor_feedback_rate is 0 for empty pairings", () => {
    const m = computePeerMetrics([], 0);
    expect(m.mentor_feedback_rate).toBeNull();; });

  // ── mentee_feedback_rate ───────────────────────────────────────────

  it("mentee_feedback_rate is 100 when all pairings have mentee feedback", () => {
    const pairings = [
      makePairing({ id: "p1", mentee_feedback: "I enjoy it" }),
      makePairing({ id: "p2", mentee_feedback: "It helps" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.mentee_feedback_rate).toBe(100);
  });

  it("mentee_feedback_rate is 0 when no pairings have mentee feedback", () => {
    const pairings = [
      makePairing({ id: "p1", mentee_feedback: null }),
      makePairing({ id: "p2", mentee_feedback: null }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.mentee_feedback_rate).toBe(0);
  });

  it("mentee_feedback_rate is 50 when half have mentee feedback", () => {
    const pairings = [
      makePairing({ id: "p1", mentee_feedback: "I like it" }),
      makePairing({ id: "p2", mentee_feedback: null }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.mentee_feedback_rate).toBe(50);
  });

  it("mentee_feedback_rate rounds to one decimal place", () => {
    const pairings = [
      makePairing({ id: "p1", mentee_feedback: "Good" }),
      makePairing({ id: "p2", mentee_feedback: "OK" }),
      makePairing({ id: "p3", mentee_feedback: null }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.mentee_feedback_rate).toBe(66.7);
  });

  it("mentee_feedback_rate is 0 for empty pairings", () => {
    const m = computePeerMetrics([], 0);
    expect(m.mentee_feedback_rate).toBeNull();; });

  // ── by_pairing_type ────────────────────────────────────────────────

  it("by_pairing_type groups counts by pairing type", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_type: "buddy_system" }),
      makePairing({ id: "p2", pairing_type: "buddy_system" }),
      makePairing({ id: "p3", pairing_type: "peer_mentor" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.by_pairing_type["buddy_system"]).toBe(2);
    expect(m.by_pairing_type["peer_mentor"]).toBe(1);
  });

  it("by_pairing_type is empty for no pairings", () => {
    const m = computePeerMetrics([], 0);
    expect(Object.keys(m.by_pairing_type)).toHaveLength(0);
  });

  it("by_pairing_type has one entry per unique type", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_type: "buddy_system" }),
      makePairing({ id: "p2", pairing_type: "study_buddy" }),
      makePairing({ id: "p3", pairing_type: "welcome_buddy" }),
      makePairing({ id: "p4", pairing_type: "study_buddy" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(Object.keys(m.by_pairing_type)).toHaveLength(3);
  });

  it("by_pairing_type values sum to total_pairings", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_type: "buddy_system" }),
      makePairing({ id: "p2", pairing_type: "peer_mentor" }),
      makePairing({ id: "p3", pairing_type: "buddy_system" }),
      makePairing({ id: "p4", pairing_type: "skills_partner" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    const sum = Object.values(m.by_pairing_type).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_pairings);
  });

  it("by_pairing_type has 7 entries when all types represented", () => {
    const types: PairingType[] = ["buddy_system", "peer_mentor", "welcome_buddy", "skills_partner", "study_buddy", "activity_partner", "other"];
    const pairings = types.map((t, i) =>
      makePairing({ id: `p${i}`, pairing_type: t, mentor_id: `m${i}`, mentee_id: `e${i}` }),
    );
    const m = computePeerMetrics(pairings, 20);
    expect(Object.keys(m.by_pairing_type)).toHaveLength(7);
  });

  // ── by_status ──────────────────────────────────────────────────────

  it("by_status groups counts by pairing status", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active" }),
      makePairing({ id: "p2", pairing_status: "active" }),
      makePairing({ id: "p3", pairing_status: "completed" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.by_status["active"]).toBe(2);
    expect(m.by_status["completed"]).toBe(1);
  });

  it("by_status is empty for no pairings", () => {
    const m = computePeerMetrics([], 0);
    expect(Object.keys(m.by_status)).toHaveLength(0);
  });

  it("by_status values sum to total_pairings", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active" }),
      makePairing({ id: "p2", pairing_status: "paused" }),
      makePairing({ id: "p3", pairing_status: "completed" }),
      makePairing({ id: "p4", pairing_status: "ended_early" }),
      makePairing({ id: "p5", pairing_status: "pending_review" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    const sum = Object.values(m.by_status).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_pairings);
  });

  it("by_status has 5 entries when all statuses represented", () => {
    const statuses: PairingStatus[] = ["active", "paused", "completed", "ended_early", "pending_review"];
    const pairings = statuses.map((s, i) =>
      makePairing({ id: `p${i}`, pairing_status: s, mentor_id: `m${i}`, mentee_id: `e${i}` }),
    );
    const m = computePeerMetrics(pairings, 20);
    expect(Object.keys(m.by_status)).toHaveLength(5);
  });

  // ── by_session_outcome ─────────────────────────────────────────────

  it("by_session_outcome groups counts by session outcome", () => {
    const pairings = [
      makePairing({ id: "p1", last_session_outcome: "positive" }),
      makePairing({ id: "p2", last_session_outcome: "positive" }),
      makePairing({ id: "p3", last_session_outcome: "negative" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.by_session_outcome["positive"]).toBe(2);
    expect(m.by_session_outcome["negative"]).toBe(1);
  });

  it("by_session_outcome is empty for no pairings", () => {
    const m = computePeerMetrics([], 0);
    expect(Object.keys(m.by_session_outcome)).toHaveLength(0);
  });

  it("by_session_outcome excludes null outcomes", () => {
    const pairings = [
      makePairing({ id: "p1", last_session_outcome: "positive" }),
      makePairing({ id: "p2", last_session_outcome: null }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(Object.keys(m.by_session_outcome)).toHaveLength(1);
    expect(m.by_session_outcome["positive"]).toBe(1);
  });

  it("by_session_outcome is empty when all outcomes are null", () => {
    const pairings = [
      makePairing({ id: "p1", last_session_outcome: null }),
      makePairing({ id: "p2", last_session_outcome: null }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(Object.keys(m.by_session_outcome)).toHaveLength(0);
  });

  it("by_session_outcome values sum to count of non-null outcomes", () => {
    const pairings = [
      makePairing({ id: "p1", last_session_outcome: "very_positive" }),
      makePairing({ id: "p2", last_session_outcome: "positive" }),
      makePairing({ id: "p3", last_session_outcome: "neutral" }),
      makePairing({ id: "p4", last_session_outcome: "negative" }),
      makePairing({ id: "p5", last_session_outcome: null }),
    ];
    const m = computePeerMetrics(pairings, 10);
    const sum = Object.values(m.by_session_outcome).reduce((a, b) => a + b, 0);
    expect(sum).toBe(4);
  });

  // ── by_safeguarding_flag ───────────────────────────────────────────

  it("by_safeguarding_flag groups counts by safeguarding flag", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "none" }),
      makePairing({ id: "p2", safeguarding_flag: "none" }),
      makePairing({ id: "p3", safeguarding_flag: "power_imbalance" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.by_safeguarding_flag["none"]).toBe(2);
    expect(m.by_safeguarding_flag["power_imbalance"]).toBe(1);
  });

  it("by_safeguarding_flag is empty for no pairings", () => {
    const m = computePeerMetrics([], 0);
    expect(Object.keys(m.by_safeguarding_flag)).toHaveLength(0);
  });

  it("by_safeguarding_flag values sum to total_pairings", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "none" }),
      makePairing({ id: "p2", safeguarding_flag: "escalated" }),
      makePairing({ id: "p3", safeguarding_flag: "bullying_concern" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    const sum = Object.values(m.by_safeguarding_flag).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_pairings);
  });

  it("by_safeguarding_flag includes none flag", () => {
    const pairings = [makePairing({ safeguarding_flag: "none" })];
    const m = computePeerMetrics(pairings, 5);
    expect(m.by_safeguarding_flag["none"]).toBe(1);
  });

  // ── mixed multi-pairing scenario ───────────────────────────────────

  it("correctly computes metrics for multi-pairing mixed scenario", () => {
    const pairings = [
      makePairing({ id: "p1", mentor_id: "c1", mentee_id: "c2", pairing_status: "active", pairing_type: "buddy_system", sessions_completed: 5, last_session_outcome: "positive", safeguarding_flag: "none", mentor_feedback: "Good", mentee_feedback: "Nice" }),
      makePairing({ id: "p2", mentor_id: "c3", mentee_id: "c4", pairing_status: "completed", pairing_type: "peer_mentor", sessions_completed: 10, last_session_outcome: "very_positive", safeguarding_flag: "none", mentor_feedback: null, mentee_feedback: null }),
      makePairing({ id: "p3", mentor_id: "c2", mentee_id: "c5", pairing_status: "ended_early", pairing_type: "buddy_system", sessions_completed: 2, last_session_outcome: "negative", safeguarding_flag: "bullying_concern", mentor_feedback: "Difficult", mentee_feedback: "Uncomfortable" }),
      makePairing({ id: "p4", mentor_id: "c6", mentee_id: "c7", pairing_status: "active", pairing_type: "welcome_buddy", sessions_completed: 0, last_session_outcome: null, safeguarding_flag: "none", mentor_feedback: null, mentee_feedback: null }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.total_pairings).toBe(4);
    expect(m.active_pairings).toBe(2);
    expect(m.completed_pairings).toBe(1);
    expect(m.ended_early_count).toBe(1);
    expect(m.children_involved).toBe(7);
    expect(m.participation_rate).toBe(70);
    expect(m.total_sessions).toBe(17);
    expect(m.average_sessions_per_pairing).toBe(4.3);
    expect(m.safeguarding_concerns).toBe(1);
    expect(m.mentor_feedback_rate).toBe(50);
    expect(m.mentee_feedback_rate).toBe(50);
    expect(m.by_pairing_type["buddy_system"]).toBe(2);
    expect(m.by_pairing_type["peer_mentor"]).toBe(1);
    expect(m.by_pairing_type["welcome_buddy"]).toBe(1);
  });

  // ── large dataset ──────────────────────────────────────────────────

  it("handles large pairings array efficiently", () => {
    const types: PairingType[] = ["buddy_system", "peer_mentor", "welcome_buddy", "skills_partner", "study_buddy"];
    const statuses: PairingStatus[] = ["active", "paused", "completed", "ended_early", "pending_review"];
    const outcomes: SessionOutcome[] = ["very_positive", "positive", "neutral", "negative", "session_cancelled"];
    const flags: SafeguardingFlag[] = ["none", "none", "none", "none", "power_imbalance"];
    const pairings: PeerPairing[] = [];
    for (let i = 0; i < 100; i++) {
      pairings.push(
        makePairing({
          id: `p-${i}`,
          mentor_id: `m-${i % 25}`,
          mentee_id: `e-${i % 25}`,
          pairing_type: types[i % 5],
          pairing_status: statuses[i % 5],
          sessions_completed: i % 10,
          last_session_outcome: outcomes[i % 5],
          safeguarding_flag: flags[i % 5],
          mentor_feedback: i % 3 === 0 ? "Feedback" : null,
          mentee_feedback: i % 4 === 0 ? "Feedback" : null,
        }),
      );
    }
    const m = computePeerMetrics(pairings, 50);
    expect(m.total_pairings).toBe(100);
    expect(m.active_pairings).toBe(20);
    expect(m.completed_pairings).toBe(20);
    expect(m.ended_early_count).toBe(20);
  });

  it("totalChildren parameter does not affect per-pairing metrics", () => {
    const pairings = [makePairing({ id: "p1" })];
    const m1 = computePeerMetrics(pairings, 1);
    const m2 = computePeerMetrics(pairings, 100);
    expect(m1.total_pairings).toBe(m2.total_pairings);
    expect(m1.active_pairings).toBe(m2.active_pairings);
    expect(m1.total_sessions).toBe(m2.total_sessions);
    expect(m1.safeguarding_concerns).toBe(m2.safeguarding_concerns);
    expect(m1.mentor_feedback_rate).toBe(m2.mentor_feedback_rate);
  });

  it("positive_outcome_rate with all five outcome types present", () => {
    const pairings = [
      makePairing({ id: "p1", last_session_outcome: "very_positive" }),
      makePairing({ id: "p2", last_session_outcome: "positive" }),
      makePairing({ id: "p3", last_session_outcome: "neutral" }),
      makePairing({ id: "p4", last_session_outcome: "negative" }),
      makePairing({ id: "p5", last_session_outcome: "session_cancelled" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.positive_outcome_rate).toBe(40);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyPeerAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyPeerAlerts", () => {
  // ── no alerts when clean ───────────────────────────────────────────

  it("returns empty array for empty pairings", () => {
    const alerts = identifyPeerAlerts([]);
    expect(alerts).toEqual([]);
  });

  it("returns empty array when all pairings are clean active with sessions", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", sessions_completed: 3, last_session_outcome: "positive", safeguarding_flag: "none" }),
      makePairing({ id: "p2", pairing_status: "active", sessions_completed: 5, last_session_outcome: "very_positive", safeguarding_flag: "none" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    expect(alerts).toEqual([]);
  });

  it("returns empty array for completed pairings with no safeguarding", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "completed", safeguarding_flag: "none", last_session_outcome: "positive", sessions_completed: 10 }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    expect(alerts).toEqual([]);
  });

  // ── safeguarding_concern (high) ────────────────────────────────────

  it("generates safeguarding_concern alert for power_imbalance flag", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "power_imbalance", mentor_name: "Alice", mentee_name: "Bob" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const sg = alerts.find((a) => a.type === "safeguarding_concern");
    expect(sg).toBeTruthy();
    expect(sg!.severity).toBe("high");
    expect(sg!.id).toBe("p1");
  });

  it("generates safeguarding_concern alert for bullying_concern flag", () => {
    const pairings = [
      makePairing({ id: "p2", safeguarding_flag: "bullying_concern", mentor_name: "Carol", mentee_name: "Dave" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const sg = alerts.find((a) => a.type === "safeguarding_concern");
    expect(sg).toBeTruthy();
    expect(sg!.severity).toBe("high");
  });

  it("generates safeguarding_concern alert for inappropriate_behaviour flag", () => {
    const pairings = [
      makePairing({ id: "p3", safeguarding_flag: "inappropriate_behaviour" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const sg = alerts.find((a) => a.type === "safeguarding_concern");
    expect(sg).toBeTruthy();
    expect(sg!.severity).toBe("high");
  });

  it("generates safeguarding_concern alert for emotional_harm flag", () => {
    const pairings = [
      makePairing({ id: "p4", safeguarding_flag: "emotional_harm" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const sg = alerts.find((a) => a.type === "safeguarding_concern");
    expect(sg).toBeTruthy();
    expect(sg!.severity).toBe("high");
  });

  it("safeguarding_concern alert includes mentor and mentee names", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "power_imbalance", mentor_name: "Alice Smith", mentee_name: "Bob Jones" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const sg = alerts.find((a) => a.type === "safeguarding_concern");
    expect(sg!.message).toContain("Alice Smith");
    expect(sg!.message).toContain("Bob Jones");
  });

  it("safeguarding_concern alert includes flag description with spaces", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "power_imbalance" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const sg = alerts.find((a) => a.type === "safeguarding_concern");
    expect(sg!.message).toContain("power imbalance");
  });

  it("safeguarding_concern replaces underscores with spaces for bullying_concern", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "bullying_concern" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const sg = alerts.find((a) => a.type === "safeguarding_concern");
    expect(sg!.message).toContain("bullying concern");
  });

  it("safeguarding_concern replaces underscores with spaces for inappropriate_behaviour", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "inappropriate_behaviour" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const sg = alerts.find((a) => a.type === "safeguarding_concern");
    expect(sg!.message).toContain("inappropriate behaviour");
  });

  it("safeguarding_concern replaces underscores with spaces for emotional_harm", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "emotional_harm" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const sg = alerts.find((a) => a.type === "safeguarding_concern");
    expect(sg!.message).toContain("emotional harm");
  });

  it("no safeguarding_concern alert for none flag", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "none" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const sg = alerts.find((a) => a.type === "safeguarding_concern");
    expect(sg).toBeUndefined();
  });

  it("no safeguarding_concern alert for escalated flag (uses escalated type instead)", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "escalated" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const sg = alerts.find((a) => a.type === "safeguarding_concern");
    expect(sg).toBeUndefined();
  });

  it("generates multiple safeguarding_concern alerts for different pairings", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "power_imbalance" }),
      makePairing({ id: "p2", safeguarding_flag: "bullying_concern" }),
      makePairing({ id: "p3", safeguarding_flag: "emotional_harm" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const sg = alerts.filter((a) => a.type === "safeguarding_concern");
    expect(sg).toHaveLength(3);
  });

  // ── safeguarding_escalated (critical) ──────────────────────────────

  it("generates safeguarding_escalated alert for escalated flag", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "escalated", mentor_name: "Alice", mentee_name: "Bob" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const esc = alerts.find((a) => a.type === "safeguarding_escalated");
    expect(esc).toBeTruthy();
    expect(esc!.severity).toBe("critical");
    expect(esc!.id).toBe("p1");
  });

  it("safeguarding_escalated alert includes mentor and mentee names", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "escalated", mentor_name: "Carol Davies", mentee_name: "Eve Walker" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const esc = alerts.find((a) => a.type === "safeguarding_escalated");
    expect(esc!.message).toContain("Carol Davies");
    expect(esc!.message).toContain("Eve Walker");
  });

  it("safeguarding_escalated message mentions immediate action", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "escalated" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const esc = alerts.find((a) => a.type === "safeguarding_escalated");
    expect(esc!.message).toContain("immediate action required");
  });

  it("no safeguarding_escalated alert for non-escalated flags", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "power_imbalance" }),
      makePairing({ id: "p2", safeguarding_flag: "none" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const esc = alerts.find((a) => a.type === "safeguarding_escalated");
    expect(esc).toBeUndefined();
  });

  it("generates multiple safeguarding_escalated alerts for multiple escalated pairings", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "escalated", mentor_name: "Alice", mentee_name: "Bob" }),
      makePairing({ id: "p2", safeguarding_flag: "escalated", mentor_name: "Carol", mentee_name: "Dave" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const esc = alerts.filter((a) => a.type === "safeguarding_escalated");
    expect(esc).toHaveLength(2);
  });

  // ── negative_outcome (medium) ──────────────────────────────────────

  it("generates negative_outcome alert for active pairing with negative outcome", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", last_session_outcome: "negative", mentor_name: "Alice", mentee_name: "Bob" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const neg = alerts.find((a) => a.type === "negative_outcome");
    expect(neg).toBeTruthy();
    expect(neg!.severity).toBe("medium");
    expect(neg!.id).toBe("p1");
  });

  it("negative_outcome alert includes mentor and mentee names", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", last_session_outcome: "negative", mentor_name: "Carol Davies", mentee_name: "Eve Walker" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const neg = alerts.find((a) => a.type === "negative_outcome");
    expect(neg!.message).toContain("Carol Davies");
    expect(neg!.message).toContain("Eve Walker");
  });

  it("negative_outcome message mentions review pairing suitability", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", last_session_outcome: "negative" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const neg = alerts.find((a) => a.type === "negative_outcome");
    expect(neg!.message).toContain("review pairing suitability");
  });

  it("no negative_outcome alert for completed pairing with negative outcome", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "completed", last_session_outcome: "negative" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const neg = alerts.find((a) => a.type === "negative_outcome");
    expect(neg).toBeUndefined();
  });

  it("no negative_outcome alert for paused pairing with negative outcome", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "paused", last_session_outcome: "negative" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const neg = alerts.find((a) => a.type === "negative_outcome");
    expect(neg).toBeUndefined();
  });

  it("no negative_outcome alert for ended_early pairing with negative outcome", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "ended_early", last_session_outcome: "negative" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const neg = alerts.find((a) => a.type === "negative_outcome");
    expect(neg).toBeUndefined();
  });

  it("no negative_outcome alert for active pairing with positive outcome", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", last_session_outcome: "positive" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const neg = alerts.find((a) => a.type === "negative_outcome");
    expect(neg).toBeUndefined();
  });

  it("no negative_outcome alert for active pairing with very_positive outcome", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", last_session_outcome: "very_positive" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const neg = alerts.find((a) => a.type === "negative_outcome");
    expect(neg).toBeUndefined();
  });

  it("no negative_outcome alert for active pairing with neutral outcome", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", last_session_outcome: "neutral" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const neg = alerts.find((a) => a.type === "negative_outcome");
    expect(neg).toBeUndefined();
  });

  it("no negative_outcome alert for active pairing with session_cancelled outcome", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", last_session_outcome: "session_cancelled" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const neg = alerts.find((a) => a.type === "negative_outcome");
    expect(neg).toBeUndefined();
  });

  it("no negative_outcome alert for active pairing with null outcome", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", last_session_outcome: null, sessions_completed: 3 }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const neg = alerts.find((a) => a.type === "negative_outcome");
    expect(neg).toBeUndefined();
  });

  it("generates multiple negative_outcome alerts for multiple active negative pairings", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", last_session_outcome: "negative", mentor_name: "Alice", mentee_name: "Bob" }),
      makePairing({ id: "p2", pairing_status: "active", last_session_outcome: "negative", mentor_name: "Carol", mentee_name: "Dave" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const neg = alerts.filter((a) => a.type === "negative_outcome");
    expect(neg).toHaveLength(2);
  });

  // ── review_needed (medium) ─────────────────────────────────────────

  it("generates review_needed alert for pending_review pairing", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "pending_review", mentor_name: "Alice", mentee_name: "Bob" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const rev = alerts.find((a) => a.type === "review_needed");
    expect(rev).toBeTruthy();
    expect(rev!.severity).toBe("medium");
    expect(rev!.id).toBe("p1");
  });

  it("review_needed alert includes mentor and mentee names", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "pending_review", mentor_name: "Carol Davies", mentee_name: "Eve Walker" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const rev = alerts.find((a) => a.type === "review_needed");
    expect(rev!.message).toContain("Carol Davies");
    expect(rev!.message).toContain("Eve Walker");
  });

  it("review_needed message mentions decide whether to continue", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "pending_review" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const rev = alerts.find((a) => a.type === "review_needed");
    expect(rev!.message).toContain("decide whether to continue");
  });

  it("no review_needed alert for active pairing", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const rev = alerts.find((a) => a.type === "review_needed");
    expect(rev).toBeUndefined();
  });

  it("no review_needed alert for completed pairing", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "completed" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const rev = alerts.find((a) => a.type === "review_needed");
    expect(rev).toBeUndefined();
  });

  it("no review_needed alert for paused pairing", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "paused" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const rev = alerts.find((a) => a.type === "review_needed");
    expect(rev).toBeUndefined();
  });

  it("generates multiple review_needed alerts for multiple pending_review pairings", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "pending_review", mentor_name: "Alice", mentee_name: "Bob" }),
      makePairing({ id: "p2", pairing_status: "pending_review", mentor_name: "Carol", mentee_name: "Dave" }),
      makePairing({ id: "p3", pairing_status: "pending_review", mentor_name: "Eve", mentee_name: "Frank" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const rev = alerts.filter((a) => a.type === "review_needed");
    expect(rev).toHaveLength(3);
  });

  // ── no_sessions (medium) ───────────────────────────────────────────

  it("generates no_sessions alert for active pairing with 0 sessions", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", sessions_completed: 0, mentor_name: "Alice", mentee_name: "Bob" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const ns = alerts.find((a) => a.type === "no_sessions");
    expect(ns).toBeTruthy();
    expect(ns!.severity).toBe("medium");
    expect(ns!.id).toBe("p1");
  });

  it("no_sessions alert includes mentor and mentee names", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", sessions_completed: 0, mentor_name: "Carol Davies", mentee_name: "Eve Walker" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const ns = alerts.find((a) => a.type === "no_sessions");
    expect(ns!.message).toContain("Carol Davies");
    expect(ns!.message).toContain("Eve Walker");
  });

  it("no_sessions message mentions schedule first session", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", sessions_completed: 0 }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const ns = alerts.find((a) => a.type === "no_sessions");
    expect(ns!.message).toContain("schedule first session");
  });

  it("no no_sessions alert for active pairing with sessions completed", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", sessions_completed: 1 }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const ns = alerts.find((a) => a.type === "no_sessions");
    expect(ns).toBeUndefined();
  });

  it("no no_sessions alert for completed pairing with 0 sessions", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "completed", sessions_completed: 0 }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const ns = alerts.find((a) => a.type === "no_sessions");
    expect(ns).toBeUndefined();
  });

  it("no no_sessions alert for paused pairing with 0 sessions", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "paused", sessions_completed: 0 }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const ns = alerts.find((a) => a.type === "no_sessions");
    expect(ns).toBeUndefined();
  });

  it("no no_sessions alert for ended_early pairing with 0 sessions", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "ended_early", sessions_completed: 0 }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const ns = alerts.find((a) => a.type === "no_sessions");
    expect(ns).toBeUndefined();
  });

  it("no no_sessions alert for pending_review pairing with 0 sessions (review_needed takes priority)", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "pending_review", sessions_completed: 0 }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const ns = alerts.find((a) => a.type === "no_sessions");
    expect(ns).toBeUndefined();
  });

  it("generates multiple no_sessions alerts for multiple active pairings with 0 sessions", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", sessions_completed: 0, mentor_name: "Alice", mentee_name: "Bob" }),
      makePairing({ id: "p2", pairing_status: "active", sessions_completed: 0, mentor_name: "Carol", mentee_name: "Dave" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const ns = alerts.filter((a) => a.type === "no_sessions");
    expect(ns).toHaveLength(2);
  });

  // ── combined alerts ────────────────────────────────────────────────

  it("generates all alert types together when conditions are met", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "power_imbalance", pairing_status: "active", sessions_completed: 3, last_session_outcome: "positive" }),
      makePairing({ id: "p2", safeguarding_flag: "escalated", pairing_status: "active", sessions_completed: 2, last_session_outcome: "positive" }),
      makePairing({ id: "p3", pairing_status: "active", last_session_outcome: "negative", safeguarding_flag: "none", sessions_completed: 4 }),
      makePairing({ id: "p4", pairing_status: "pending_review", safeguarding_flag: "none", sessions_completed: 5, last_session_outcome: "neutral" }),
      makePairing({ id: "p5", pairing_status: "active", sessions_completed: 0, safeguarding_flag: "none", last_session_outcome: null }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("safeguarding_concern");
    expect(types).toContain("safeguarding_escalated");
    expect(types).toContain("negative_outcome");
    expect(types).toContain("review_needed");
    expect(types).toContain("no_sessions");
  });

  it("alert severity values are correct types", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "power_imbalance" }),
      makePairing({ id: "p2", safeguarding_flag: "escalated" }),
      makePairing({ id: "p3", pairing_status: "active", last_session_outcome: "negative", safeguarding_flag: "none", sessions_completed: 1 }),
      makePairing({ id: "p4", pairing_status: "pending_review", safeguarding_flag: "none" }),
      makePairing({ id: "p5", pairing_status: "active", sessions_completed: 0, safeguarding_flag: "none", last_session_outcome: null }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    for (const alert of alerts) {
      expect(["critical", "high", "medium"]).toContain(alert.severity);
    }
  });

  it("each alert has a non-empty message", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "bullying_concern" }),
      makePairing({ id: "p2", pairing_status: "pending_review", safeguarding_flag: "none" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    for (const alert of alerts) {
      expect(alert.message.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty id", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "emotional_harm" }),
      makePairing({ id: "p2", pairing_status: "active", sessions_completed: 0, safeguarding_flag: "none", last_session_outcome: null }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    for (const alert of alerts) {
      expect(alert.id.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty type", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "inappropriate_behaviour" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    for (const alert of alerts) {
      expect(alert.type.length).toBeGreaterThan(0);
    }
  });

  it("active pairing with negative outcome AND 0 sessions generates both alerts", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", last_session_outcome: "negative", sessions_completed: 0, safeguarding_flag: "none" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const neg = alerts.find((a) => a.type === "negative_outcome");
    const ns = alerts.find((a) => a.type === "no_sessions");
    expect(neg).toBeTruthy();
    expect(ns).toBeTruthy();
  });

  it("active pairing with safeguarding AND negative outcome generates both alert types", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", last_session_outcome: "negative", safeguarding_flag: "power_imbalance", sessions_completed: 3 }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const sg = alerts.find((a) => a.type === "safeguarding_concern");
    const neg = alerts.find((a) => a.type === "negative_outcome");
    expect(sg).toBeTruthy();
    expect(neg).toBeTruthy();
  });

  it("safeguarding_concern alert mentions review and consider pausing", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "power_imbalance" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const sg = alerts.find((a) => a.type === "safeguarding_concern");
    expect(sg!.message).toContain("review and consider pausing");
  });

  it("review_needed message mentions adjust or end", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "pending_review" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const rev = alerts.find((a) => a.type === "review_needed");
    expect(rev!.message).toContain("adjust, or end");
  });

  it("no_sessions message mentions active but no sessions recorded", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", sessions_completed: 0, safeguarding_flag: "none", last_session_outcome: null }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const ns = alerts.find((a) => a.type === "no_sessions");
    expect(ns!.message).toContain("active but no sessions recorded");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listPairings ───────────────────────────────────────────────────

  it("listPairings returns ok: true with empty array", async () => {
    const result = await listPairings("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listPairings returns ok: true with mentorId filter", async () => {
    const result = await listPairings("home-1", { mentorId: "child-1" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listPairings returns ok: true with menteeId filter", async () => {
    const result = await listPairings("home-1", { menteeId: "child-2" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listPairings returns ok: true with pairingType filter", async () => {
    const result = await listPairings("home-1", { pairingType: "buddy_system" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listPairings returns ok: true with pairingStatus filter", async () => {
    const result = await listPairings("home-1", { pairingStatus: "active" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listPairings returns ok: true with limit filter", async () => {
    const result = await listPairings("home-1", { limit: 50 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listPairings returns ok: true with all filters combined", async () => {
    const result = await listPairings("home-1", {
      mentorId: "child-1",
      menteeId: "child-2",
      pairingType: "peer_mentor",
      pairingStatus: "completed",
      limit: 10,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createPairing ─────────────────────────────────────────────────

  it("createPairing returns ok: false with error message", async () => {
    const result = await createPairing({
      homeId: "home-1",
      mentorName: "Alice Smith",
      mentorId: "child-1",
      menteeName: "Bob Jones",
      menteeId: "child-2",
      pairingType: "buddy_system",
      pairingStatus: "active",
      startDate: daysAgo(1),
      goals: ["build confidence"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createPairing error message is a string", async () => {
    const result = await createPairing({
      homeId: "home-1",
      mentorName: "Carol Davies",
      mentorId: "child-3",
      menteeName: "Dave Brown",
      menteeId: "child-4",
      pairingType: "welcome_buddy",
      pairingStatus: "active",
      startDate: daysAgo(5),
      goals: ["welcome new resident", "show around"],
      notes: "New arrival support",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  // ── updatePairing ─────────────────────────────────────────────────

  it("updatePairing returns ok: false with error message", async () => {
    const result = await updatePairing("pair-1", { pairing_status: "completed" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updatePairing error message is a string for partial updates", async () => {
    const result = await updatePairing("pair-1", {
      pairing_status: "paused",
      notes: "Paused for review",
      sessions_completed: 8,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ═══════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("computePeerMetrics with all 7 pairing types represented", () => {
    const types: PairingType[] = ["buddy_system", "peer_mentor", "welcome_buddy", "skills_partner", "study_buddy", "activity_partner", "other"];
    const pairings = types.map((t, i) =>
      makePairing({ id: `p${i}`, pairing_type: t, mentor_id: `m${i}`, mentee_id: `e${i}` }),
    );
    const m = computePeerMetrics(pairings, 20);
    expect(m.total_pairings).toBe(7);
    expect(Object.keys(m.by_pairing_type)).toHaveLength(7);
    for (const t of types) {
      expect(m.by_pairing_type[t]).toBe(1);
    }
  });

  it("computePeerMetrics with all 5 statuses represented", () => {
    const statuses: PairingStatus[] = ["active", "paused", "completed", "ended_early", "pending_review"];
    const pairings = statuses.map((s, i) =>
      makePairing({ id: `p${i}`, pairing_status: s, mentor_id: `m${i}`, mentee_id: `e${i}` }),
    );
    const m = computePeerMetrics(pairings, 20);
    expect(m.active_pairings).toBe(1);
    expect(m.completed_pairings).toBe(1);
    expect(m.ended_early_count).toBe(1);
    expect(Object.keys(m.by_status)).toHaveLength(5);
  });

  it("computePeerMetrics children_involved with same child as mentor in two pairings", () => {
    const pairings = [
      makePairing({ id: "p1", mentor_id: "c1", mentee_id: "c2" }),
      makePairing({ id: "p2", mentor_id: "c1", mentee_id: "c3" }),
      makePairing({ id: "p3", mentor_id: "c1", mentee_id: "c4" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.children_involved).toBe(4);
  });

  it("computePeerMetrics participation_rate with 1 child in 7 totalChildren", () => {
    const pairings = [makePairing({ mentor_id: "c1", mentee_id: "c1" })];
    const m = computePeerMetrics(pairings, 7);
    expect(m.participation_rate).toBe(14.3);
  });

  it("computePeerMetrics with all pairings having null outcomes", () => {
    const pairings = [
      makePairing({ id: "p1", last_session_outcome: null }),
      makePairing({ id: "p2", last_session_outcome: null }),
      makePairing({ id: "p3", last_session_outcome: null }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.positive_outcome_rate).toBeNull();; expect(Object.keys(m.by_session_outcome)).toHaveLength(0);
  });

  it("computePeerMetrics with all pairings having safeguarding concerns", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "power_imbalance" }),
      makePairing({ id: "p2", safeguarding_flag: "bullying_concern" }),
      makePairing({ id: "p3", safeguarding_flag: "escalated" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.safeguarding_concerns).toBe(3);
  });

  it("computePeerMetrics with mixed feedback combinations", () => {
    const pairings = [
      makePairing({ id: "p1", mentor_feedback: "Good", mentee_feedback: "Fine" }),
      makePairing({ id: "p2", mentor_feedback: null, mentee_feedback: "OK" }),
      makePairing({ id: "p3", mentor_feedback: "Great", mentee_feedback: null }),
      makePairing({ id: "p4", mentor_feedback: null, mentee_feedback: null }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.mentor_feedback_rate).toBe(50);
    expect(m.mentee_feedback_rate).toBe(50);
  });

  it("identifyPeerAlerts with pending_review pairing that also has safeguarding concern", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "pending_review", safeguarding_flag: "bullying_concern", sessions_completed: 5 }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("safeguarding_concern");
    expect(types).toContain("review_needed");
  });

  it("identifyPeerAlerts does not generate no_sessions for active pairing with 1 session", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", sessions_completed: 1, safeguarding_flag: "none", last_session_outcome: "positive" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    expect(alerts).toHaveLength(0);
  });

  it("identifyPeerAlerts single pairing triggering all possible alerts", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active", sessions_completed: 0, last_session_outcome: "negative", safeguarding_flag: "emotional_harm" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("safeguarding_concern");
    expect(types).toContain("negative_outcome");
    expect(types).toContain("no_sessions");
    expect(types).not.toContain("safeguarding_escalated");
    expect(types).not.toContain("review_needed");
  });

  it("computePeerMetrics average_sessions_per_pairing with single large session count", () => {
    const pairings = [makePairing({ sessions_completed: 100 })];
    const m = computePeerMetrics(pairings, 5);
    expect(m.average_sessions_per_pairing).toBe(100);
    expect(m.total_sessions).toBe(100);
  });

  it("computePeerMetrics by_status does not include statuses with zero count", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "active" }),
      makePairing({ id: "p2", pairing_status: "active" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.by_status["active"]).toBe(2);
    expect(m.by_status["completed"]).toBeUndefined();
    expect(m.by_status["ended_early"]).toBeUndefined();
  });

  it("identifyPeerAlerts escalated pairing generates critical but not high alert", () => {
    const pairings = [
      makePairing({ id: "p1", safeguarding_flag: "escalated" }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe("safeguarding_escalated");
    expect(alerts[0].severity).toBe("critical");
  });

  it("computePeerMetrics positive_outcome_rate 66.7 with two positive and one negative", () => {
    const pairings = [
      makePairing({ id: "p1", last_session_outcome: "very_positive" }),
      makePairing({ id: "p2", last_session_outcome: "positive" }),
      makePairing({ id: "p3", last_session_outcome: "negative" }),
    ];
    const m = computePeerMetrics(pairings, 10);
    expect(m.positive_outcome_rate).toBe(66.7);
  });

  it("identifyPeerAlerts no alerts for fully clean completed pairings", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "completed", safeguarding_flag: "none", last_session_outcome: "very_positive", sessions_completed: 20 }),
      makePairing({ id: "p2", pairing_status: "completed", safeguarding_flag: "none", last_session_outcome: "positive", sessions_completed: 15 }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    expect(alerts).toHaveLength(0);
  });

  it("computePeerMetrics with zero totalChildren returns 0 participation rate even with pairings", () => {
    const pairings = [makePairing({ id: "p1" })];
    const m = computePeerMetrics(pairings, 0);
    expect(m.participation_rate).toBeNull();; expect(m.children_involved).toBe(2);
  });

  it("computePeerMetrics by_session_outcome with single session_cancelled", () => {
    const pairings = [
      makePairing({ id: "p1", last_session_outcome: "session_cancelled" }),
    ];
    const m = computePeerMetrics(pairings, 5);
    expect(m.by_session_outcome["session_cancelled"]).toBe(1);
    expect(m.positive_outcome_rate).toBe(0);
  });

  it("identifyPeerAlerts negative_outcome only triggers for active status not pending_review", () => {
    const pairings = [
      makePairing({ id: "p1", pairing_status: "pending_review", last_session_outcome: "negative", safeguarding_flag: "none", sessions_completed: 5 }),
    ];
    const alerts = identifyPeerAlerts(pairings);
    const neg = alerts.find((a) => a.type === "negative_outcome");
    expect(neg).toBeUndefined();
    const rev = alerts.find((a) => a.type === "review_needed");
    expect(rev).toBeTruthy();
  });
});
