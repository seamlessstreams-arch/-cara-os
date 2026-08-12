// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONTACT MONITORING SERVICE TESTS
// Pure-function unit tests for contact metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 7 (children's views on contact),
// Reg 8 (parental responsibility — contact arrangements),
// Care Planning Regs 2010 (contact provisions).
// SCCIF: Overall Experiences — "Contact arrangements support
// children's wellbeing." "Children's wishes about contact are respected."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";
import { todayStr } from "@/lib/utils";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  CONTACT_TYPES,
  SUPERVISION_LEVELS,
  CONTACT_OUTCOMES,
  CHILD_MOODS,
  listSessions,
  createSession,
  updateSession,
} from "../contact-monitoring-service";

import type {
  ContactSession,
  ContactType,
  SupervisionLevel,
  ContactOutcome,
  ChildMood,
} from "../contact-monitoring-service";

const { computeContactMetrics, identifyContactAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(todayStr());

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date(todayStr());
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Date string N days in the future from now. */
function daysFromNow(n: number): string {
  const d = new Date(todayStr());
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal ContactSession with sensible defaults. */
function makeSession(overrides: Partial<ContactSession> = {}): ContactSession {
  return {
    id: "session-1",
    home_id: "home-1",
    child_name: "Alice Smith",
    child_id: "child-1",
    contact_with: "Jane Smith",
    relationship: "Mother",
    contact_type: "face_to_face",
    supervision_level: "none",
    scheduled_date: daysAgo(7),
    actual_date: daysAgo(7),
    duration_minutes: 60,
    outcome: "completed_positive",
    child_mood_before: "calm",
    child_mood_after: "happy",
    child_views: "I enjoyed seeing mum",
    staff_observations: "Session went well",
    concerns_raised: false,
    concern_details: null,
    social_worker_informed: false,
    court_ordered: false,
    notes: null,
    created_at: daysAgoISO(30),
    updated_at: daysAgoISO(7),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("CONTACT_TYPES", () => {
  it("has exactly 9 entries", () => {
    expect(CONTACT_TYPES).toHaveLength(9);
  });

  it("contains unique type values", () => {
    const values = CONTACT_TYPES.map((c) => c.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = CONTACT_TYPES.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected contact types", () => {
    const expected: ContactType[] = [
      "face_to_face", "phone_call", "video_call", "letter",
      "supervised_visit", "unsupervised_visit", "community_outing",
      "overnight_stay", "other",
    ];
    for (const t of expected) {
      expect(CONTACT_TYPES.find((c) => c.type === t)).toBeTruthy();
    }
  });

  it("each entry has a non-empty label", () => {
    for (const c of CONTACT_TYPES) {
      expect(c.label.length).toBeGreaterThan(0);
    }
  });
});

describe("SUPERVISION_LEVELS", () => {
  it("has exactly 5 entries", () => {
    expect(SUPERVISION_LEVELS).toHaveLength(5);
  });

  it("contains unique level values", () => {
    const values = SUPERVISION_LEVELS.map((s) => s.level);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = SUPERVISION_LEVELS.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected supervision levels", () => {
    const expected: SupervisionLevel[] = ["none", "monitored", "supervised", "observed", "restricted"];
    for (const lvl of expected) {
      expect(SUPERVISION_LEVELS.find((s) => s.level === lvl)).toBeTruthy();
    }
  });

  it("each entry has a non-empty label", () => {
    for (const s of SUPERVISION_LEVELS) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("CONTACT_OUTCOMES", () => {
  it("has exactly 9 entries", () => {
    expect(CONTACT_OUTCOMES).toHaveLength(9);
  });

  it("contains unique outcome values", () => {
    const values = CONTACT_OUTCOMES.map((o) => o.outcome);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = CONTACT_OUTCOMES.map((o) => o.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected contact outcomes", () => {
    const expected: ContactOutcome[] = [
      "completed_positive", "completed_neutral", "completed_negative",
      "cancelled_by_parent", "cancelled_by_child", "cancelled_by_la",
      "no_show", "refused_by_child", "rescheduled",
    ];
    for (const o of expected) {
      expect(CONTACT_OUTCOMES.find((c) => c.outcome === o)).toBeTruthy();
    }
  });

  it("each entry has a non-empty label", () => {
    for (const o of CONTACT_OUTCOMES) {
      expect(o.label.length).toBeGreaterThan(0);
    }
  });
});

describe("CHILD_MOODS", () => {
  it("has exactly 8 entries", () => {
    expect(CHILD_MOODS).toHaveLength(8);
  });

  it("contains unique mood values", () => {
    const values = CHILD_MOODS.map((m) => m.mood);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = CHILD_MOODS.map((m) => m.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected child moods", () => {
    const expected: ChildMood[] = [
      "happy", "excited", "calm", "anxious",
      "upset", "angry", "withdrawn", "mixed",
    ];
    for (const mood of expected) {
      expect(CHILD_MOODS.find((m) => m.mood === mood)).toBeTruthy();
    }
  });

  it("each entry has a non-empty label", () => {
    for (const m of CHILD_MOODS) {
      expect(m.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeContactMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeContactMetrics", () => {
  it("returns zeroed metrics for empty sessions array", () => {
    const m = computeContactMetrics([], 0);
    expect(m.total_sessions).toBe(0);
    expect(m.completed_count).toBe(0);
    expect(m.cancelled_count).toBe(0);
    expect(m.no_show_count).toBe(0);
    expect(m.refused_count).toBe(0);
    // fab-0: null when sessions=[] (nothing to compute rate over).
    expect(m.completion_rate).toBeNull();
    expect(m.positive_outcome_rate).toBeNull();
    expect(m.negative_outcome_rate).toBeNull();
    expect(m.children_with_contact).toBe(0);
    // totalChildren=0 → null (no cohort).
    expect(m.contact_coverage).toBeNull();
    expect(m.concerns_raised_count).toBe(0);
    expect(m.supervised_count).toBe(0);
    expect(m.court_ordered_count).toBe(0);
    expect(m.average_duration).toBeNull(); // fab-0.
    expect(m.child_views_recorded_rate).toBeNull();
    expect(Object.keys(m.by_contact_type)).toHaveLength(0);
    expect(Object.keys(m.by_outcome)).toHaveLength(0);
    expect(Object.keys(m.by_supervision_level)).toHaveLength(0);
    expect(Object.keys(m.by_child)).toHaveLength(0);
  });

  // ── total_sessions ──────────────────────────────────────────────────

  it("total_sessions equals the number of sessions", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1" }),
      makeSession({ id: "s2", child_id: "c2" }),
      makeSession({ id: "s3", child_id: "c3" }),
    ];
    const m = computeContactMetrics(sessions, 5);
    expect(m.total_sessions).toBe(3);
  });

  it("total_sessions is 1 for single session", () => {
    const m = computeContactMetrics([makeSession()], 1);
    expect(m.total_sessions).toBe(1);
  });

  // ── completed_count ─────────────────────────────────────────────────

  it("completed_count includes positive, neutral, and negative individually", () => {
    for (const outcome of ["completed_positive", "completed_neutral", "completed_negative"] as ContactOutcome[]) {
      const sessions = [makeSession({ id: "s1", outcome })];
      const m = computeContactMetrics(sessions, 1);
      expect(m.completed_count).toBe(1);
    }
  });

  it("completed_count sums all three completed outcomes", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive" }),
      makeSession({ id: "s2", outcome: "completed_neutral" }),
      makeSession({ id: "s3", outcome: "completed_negative" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.completed_count).toBe(3);
  });

  it("completed_count excludes non-completed outcomes", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "cancelled_by_parent" }),
      makeSession({ id: "s2", outcome: "no_show" }),
      makeSession({ id: "s3", outcome: "refused_by_child" }),
      makeSession({ id: "s4", outcome: "rescheduled" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.completed_count).toBe(0);
  });

  // ── cancelled_count ─────────────────────────────────────────────────

  it("cancelled_count includes all three cancellation types individually", () => {
    for (const outcome of ["cancelled_by_parent", "cancelled_by_child", "cancelled_by_la"] as ContactOutcome[]) {
      const sessions = [makeSession({ id: "s1", outcome })];
      const m = computeContactMetrics(sessions, 1);
      expect(m.cancelled_count).toBe(1);
    }
  });

  it("cancelled_count sums all three cancellation types", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "cancelled_by_parent" }),
      makeSession({ id: "s2", outcome: "cancelled_by_child" }),
      makeSession({ id: "s3", outcome: "cancelled_by_la" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.cancelled_count).toBe(3);
  });

  it("cancelled_count excludes non-cancelled outcomes", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive" }),
      makeSession({ id: "s2", outcome: "no_show" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.cancelled_count).toBe(0);
  });

  // ── no_show_count ───────────────────────────────────────────────────

  it("no_show_count counts no_show outcomes", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "no_show" }),
      makeSession({ id: "s2", outcome: "no_show" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.no_show_count).toBe(2);
  });

  it("no_show_count is 0 when no no_show outcomes", () => {
    const sessions = [makeSession({ id: "s1", outcome: "completed_positive" })];
    const m = computeContactMetrics(sessions, 1);
    expect(m.no_show_count).toBe(0);
  });

  // ── refused_count ───────────────────────────────────────────────────

  it("refused_count counts refused_by_child outcomes", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "refused_by_child" }),
      makeSession({ id: "s2", outcome: "refused_by_child" }),
      makeSession({ id: "s3", outcome: "refused_by_child" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.refused_count).toBe(3);
  });

  it("refused_count is 0 when no refusals", () => {
    const sessions = [makeSession({ id: "s1", outcome: "completed_neutral" })];
    const m = computeContactMetrics(sessions, 1);
    expect(m.refused_count).toBe(0);
  });

  // ── all outcome counts sum to total ─────────────────────────────────

  it("completed + cancelled + no_show + refused + rescheduled sum to total", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive" }),
      makeSession({ id: "s2", outcome: "completed_neutral" }),
      makeSession({ id: "s3", outcome: "completed_negative" }),
      makeSession({ id: "s4", outcome: "cancelled_by_parent" }),
      makeSession({ id: "s5", outcome: "cancelled_by_child" }),
      makeSession({ id: "s6", outcome: "cancelled_by_la" }),
      makeSession({ id: "s7", outcome: "no_show" }),
      makeSession({ id: "s8", outcome: "refused_by_child" }),
      makeSession({ id: "s9", outcome: "rescheduled" }),
    ];
    const m = computeContactMetrics(sessions, 5);
    const rescheduled = sessions.filter((s) => s.outcome === "rescheduled").length;
    expect(m.completed_count + m.cancelled_count + m.no_show_count + m.refused_count + rescheduled).toBe(m.total_sessions);
  });

  // ── completion_rate ─────────────────────────────────────────────────

  it("completion_rate is 100 when all sessions completed", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive" }),
      makeSession({ id: "s2", outcome: "completed_neutral" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.completion_rate).toBe(100);
  });

  it("completion_rate is 0 when no sessions completed", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "no_show" }),
      makeSession({ id: "s2", outcome: "cancelled_by_parent" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.completion_rate).toBe(0);
  });

  it("completion_rate is 50 when half the sessions completed", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive" }),
      makeSession({ id: "s2", outcome: "no_show" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.completion_rate).toBe(50);
  });

  it("completion_rate rounds to one decimal place", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive" }),
      makeSession({ id: "s2", outcome: "no_show" }),
      makeSession({ id: "s3", outcome: "cancelled_by_parent" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.completion_rate).toBe(33.3);
  });

  it("completion_rate is 0 for empty sessions", () => {
    const m = computeContactMetrics([], 0);
    expect(m.completion_rate).toBeNull();
  });

  // ── positive_outcome_rate ───────────────────────────────────────────

  it("positive_outcome_rate is 100 when all completed are positive", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive" }),
      makeSession({ id: "s2", outcome: "completed_positive" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.positive_outcome_rate).toBe(100);
  });

  it("positive_outcome_rate is 0 when no completed sessions are positive", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_neutral" }),
      makeSession({ id: "s2", outcome: "completed_negative" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.positive_outcome_rate).toBe(0);
  });

  it("positive_outcome_rate is 50 when half of completed are positive", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive" }),
      makeSession({ id: "s2", outcome: "completed_neutral" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.positive_outcome_rate).toBe(50);
  });

  it("positive_outcome_rate rounds to one decimal place", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive" }),
      makeSession({ id: "s2", outcome: "completed_neutral" }),
      makeSession({ id: "s3", outcome: "completed_negative" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.positive_outcome_rate).toBe(33.3);
  });

  it("positive_outcome_rate is 0 when no completed sessions exist", () => {
    const sessions = [makeSession({ id: "s1", outcome: "no_show" })];
    const m = computeContactMetrics(sessions, 1);
    expect(m.positive_outcome_rate).toBeNull();
  });

  it("positive_outcome_rate ignores non-completed sessions", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive" }),
      makeSession({ id: "s2", outcome: "no_show" }),
      makeSession({ id: "s3", outcome: "cancelled_by_parent" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.positive_outcome_rate).toBe(100);
  });

  // ── negative_outcome_rate ───────────────────────────────────────────

  it("negative_outcome_rate is 100 when all completed are negative", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_negative" }),
      makeSession({ id: "s2", outcome: "completed_negative" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.negative_outcome_rate).toBe(100);
  });

  it("negative_outcome_rate is 0 when no completed sessions are negative", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive" }),
      makeSession({ id: "s2", outcome: "completed_neutral" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.negative_outcome_rate).toBe(0);
  });

  it("negative_outcome_rate rounds to one decimal place", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_negative" }),
      makeSession({ id: "s2", outcome: "completed_positive" }),
      makeSession({ id: "s3", outcome: "completed_neutral" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.negative_outcome_rate).toBe(33.3);
  });

  it("negative_outcome_rate is 0 when no completed sessions exist", () => {
    const sessions = [makeSession({ id: "s1", outcome: "refused_by_child" })];
    const m = computeContactMetrics(sessions, 1);
    expect(m.negative_outcome_rate).toBeNull();
  });

  // ── children_with_contact ───────────────────────────────────────────

  it("children_with_contact counts unique child IDs", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1" }),
      makeSession({ id: "s2", child_id: "c1" }),
      makeSession({ id: "s3", child_id: "c2" }),
    ];
    const m = computeContactMetrics(sessions, 3);
    expect(m.children_with_contact).toBe(2);
  });

  it("children_with_contact is 1 when all sessions belong to same child", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1" }),
      makeSession({ id: "s2", child_id: "c1" }),
    ];
    const m = computeContactMetrics(sessions, 5);
    expect(m.children_with_contact).toBe(1);
  });

  it("children_with_contact is 0 for empty sessions", () => {
    const m = computeContactMetrics([], 5);
    expect(m.children_with_contact).toBe(0);
  });

  // ── contact_coverage ────────────────────────────────────────────────

  it("contact_coverage is 100 when all children have contact", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1" }),
      makeSession({ id: "s2", child_id: "c2" }),
    ];
    const m = computeContactMetrics(sessions, 2);
    expect(m.contact_coverage).toBe(100);
  });

  it("contact_coverage is 50 when half the children have contact", () => {
    const sessions = [makeSession({ id: "s1", child_id: "c1" })];
    const m = computeContactMetrics(sessions, 2);
    expect(m.contact_coverage).toBe(50);
  });

  it("contact_coverage is 0 when totalChildren is 0", () => {
    const m = computeContactMetrics([], 0);
    expect(m.contact_coverage).toBeNull(); // fab-0.
  });

  it("contact_coverage rounds to one decimal place", () => {
    const sessions = [makeSession({ id: "s1", child_id: "c1" })];
    const m = computeContactMetrics(sessions, 3);
    expect(m.contact_coverage).toBe(33.3);
  });

  it("contact_coverage is 0 with empty sessions and positive totalChildren", () => {
    const m = computeContactMetrics([], 5);
    expect(m.contact_coverage).toBe(0); // fab-0.
  });

  // ── concerns_raised_count ───────────────────────────────────────────

  it("concerns_raised_count counts sessions with concerns_raised true", () => {
    const sessions = [
      makeSession({ id: "s1", concerns_raised: true }),
      makeSession({ id: "s2", concerns_raised: true }),
      makeSession({ id: "s3", concerns_raised: false }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.concerns_raised_count).toBe(2);
  });

  it("concerns_raised_count is 0 when no concerns", () => {
    const sessions = [
      makeSession({ id: "s1", concerns_raised: false }),
      makeSession({ id: "s2", concerns_raised: false }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.concerns_raised_count).toBe(0);
  });

  // ── supervised_count ────────────────────────────────────────────────

  it("supervised_count counts sessions with supervision_level not none", () => {
    const sessions = [
      makeSession({ id: "s1", supervision_level: "supervised" }),
      makeSession({ id: "s2", supervision_level: "monitored" }),
      makeSession({ id: "s3", supervision_level: "none" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.supervised_count).toBe(2);
  });

  it("supervised_count is 0 when all sessions are unsupervised", () => {
    const sessions = [
      makeSession({ id: "s1", supervision_level: "none" }),
      makeSession({ id: "s2", supervision_level: "none" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.supervised_count).toBe(0);
  });

  it("supervised_count counts all non-none levels including observed and restricted", () => {
    const sessions = [
      makeSession({ id: "s1", supervision_level: "monitored" }),
      makeSession({ id: "s2", supervision_level: "supervised" }),
      makeSession({ id: "s3", supervision_level: "observed" }),
      makeSession({ id: "s4", supervision_level: "restricted" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.supervised_count).toBe(4);
  });

  // ── court_ordered_count ─────────────────────────────────────────────

  it("court_ordered_count counts sessions with court_ordered true", () => {
    const sessions = [
      makeSession({ id: "s1", court_ordered: true }),
      makeSession({ id: "s2", court_ordered: true }),
      makeSession({ id: "s3", court_ordered: false }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.court_ordered_count).toBe(2);
  });

  it("court_ordered_count is 0 when no court ordered sessions", () => {
    const sessions = [
      makeSession({ id: "s1", court_ordered: false }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.court_ordered_count).toBe(0);
  });

  // ── average_duration ────────────────────────────────────────────────

  it("average_duration computes correct average for completed sessions", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive", duration_minutes: 60 }),
      makeSession({ id: "s2", outcome: "completed_neutral", duration_minutes: 90 }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.average_duration).toBe(75);
  });

  it("average_duration excludes non-completed sessions", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive", duration_minutes: 60 }),
      makeSession({ id: "s2", outcome: "no_show", duration_minutes: 30 }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.average_duration).toBe(60);
  });

  it("average_duration excludes completed sessions with null duration", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive", duration_minutes: 60 }),
      makeSession({ id: "s2", outcome: "completed_positive", duration_minutes: null }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.average_duration).toBe(60);
  });

  it("average_duration is 0 when no completed sessions with duration", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive", duration_minutes: null }),
      makeSession({ id: "s2", outcome: "no_show", duration_minutes: 30 }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.average_duration).toBeNull(); // fab-0.
  });

  it("average_duration is 0 for empty sessions", () => {
    const m = computeContactMetrics([], 0);
    expect(m.average_duration).toBeNull(); // fab-0.
  });

  it("average_duration rounds to nearest integer", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive", duration_minutes: 60 }),
      makeSession({ id: "s2", outcome: "completed_positive", duration_minutes: 61 }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.average_duration).toBe(61);
  });

  it("average_duration with single completed session equals its duration", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_negative", duration_minutes: 45 }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.average_duration).toBe(45);
  });

  // ── child_views_recorded_rate ───────────────────────────────────────

  it("child_views_recorded_rate is 100 when all sessions have child_views", () => {
    const sessions = [
      makeSession({ id: "s1", child_views: "Enjoyed it" }),
      makeSession({ id: "s2", child_views: "It was ok" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.child_views_recorded_rate).toBe(100);
  });

  it("child_views_recorded_rate is 0 when no sessions have child_views", () => {
    const sessions = [
      makeSession({ id: "s1", child_views: null }),
      makeSession({ id: "s2", child_views: null }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.child_views_recorded_rate).toBe(0);
  });

  it("child_views_recorded_rate is 50 when half have views", () => {
    const sessions = [
      makeSession({ id: "s1", child_views: "Good session" }),
      makeSession({ id: "s2", child_views: null }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.child_views_recorded_rate).toBe(50);
  });

  it("child_views_recorded_rate rounds to one decimal place", () => {
    const sessions = [
      makeSession({ id: "s1", child_views: "Views" }),
      makeSession({ id: "s2", child_views: null }),
      makeSession({ id: "s3", child_views: null }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.child_views_recorded_rate).toBe(33.3);
  });

  it("child_views_recorded_rate is 0 for empty sessions", () => {
    const m = computeContactMetrics([], 0);
    expect(m.child_views_recorded_rate).toBeNull();
  });

  // ── by_contact_type ─────────────────────────────────────────────────

  it("by_contact_type groups counts by contact type", () => {
    const sessions = [
      makeSession({ id: "s1", contact_type: "face_to_face" }),
      makeSession({ id: "s2", contact_type: "face_to_face" }),
      makeSession({ id: "s3", contact_type: "phone_call" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.by_contact_type["face_to_face"]).toBe(2);
    expect(m.by_contact_type["phone_call"]).toBe(1);
  });

  it("by_contact_type is empty for no sessions", () => {
    const m = computeContactMetrics([], 0);
    expect(Object.keys(m.by_contact_type)).toHaveLength(0);
  });

  it("by_contact_type has one entry per unique type", () => {
    const sessions = [
      makeSession({ id: "s1", contact_type: "face_to_face" }),
      makeSession({ id: "s2", contact_type: "video_call" }),
      makeSession({ id: "s3", contact_type: "letter" }),
      makeSession({ id: "s4", contact_type: "video_call" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(Object.keys(m.by_contact_type)).toHaveLength(3);
  });

  it("by_contact_type values sum to total_sessions", () => {
    const sessions = [
      makeSession({ id: "s1", contact_type: "face_to_face" }),
      makeSession({ id: "s2", contact_type: "phone_call" }),
      makeSession({ id: "s3", contact_type: "face_to_face" }),
      makeSession({ id: "s4", contact_type: "supervised_visit" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    const sum = Object.values(m.by_contact_type).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_sessions);
  });

  // ── by_outcome ──────────────────────────────────────────────────────

  it("by_outcome groups counts by outcome", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive" }),
      makeSession({ id: "s2", outcome: "completed_positive" }),
      makeSession({ id: "s3", outcome: "no_show" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.by_outcome["completed_positive"]).toBe(2);
    expect(m.by_outcome["no_show"]).toBe(1);
  });

  it("by_outcome is empty for no sessions", () => {
    const m = computeContactMetrics([], 0);
    expect(Object.keys(m.by_outcome)).toHaveLength(0);
  });

  it("by_outcome values sum to total_sessions", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive" }),
      makeSession({ id: "s2", outcome: "cancelled_by_parent" }),
      makeSession({ id: "s3", outcome: "no_show" }),
      makeSession({ id: "s4", outcome: "refused_by_child" }),
      makeSession({ id: "s5", outcome: "rescheduled" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    const sum = Object.values(m.by_outcome).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_sessions);
  });

  it("by_outcome has 9 entries when all outcomes represented", () => {
    const outcomes: ContactOutcome[] = [
      "completed_positive", "completed_neutral", "completed_negative",
      "cancelled_by_parent", "cancelled_by_child", "cancelled_by_la",
      "no_show", "refused_by_child", "rescheduled",
    ];
    const sessions = outcomes.map((o, i) => makeSession({ id: `s${i}`, outcome: o }));
    const m = computeContactMetrics(sessions, 1);
    expect(Object.keys(m.by_outcome)).toHaveLength(9);
  });

  // ── by_supervision_level ────────────────────────────────────────────

  it("by_supervision_level groups counts by supervision level", () => {
    const sessions = [
      makeSession({ id: "s1", supervision_level: "none" }),
      makeSession({ id: "s2", supervision_level: "none" }),
      makeSession({ id: "s3", supervision_level: "supervised" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.by_supervision_level["none"]).toBe(2);
    expect(m.by_supervision_level["supervised"]).toBe(1);
  });

  it("by_supervision_level is empty for no sessions", () => {
    const m = computeContactMetrics([], 0);
    expect(Object.keys(m.by_supervision_level)).toHaveLength(0);
  });

  it("by_supervision_level values sum to total_sessions", () => {
    const sessions = [
      makeSession({ id: "s1", supervision_level: "none" }),
      makeSession({ id: "s2", supervision_level: "monitored" }),
      makeSession({ id: "s3", supervision_level: "supervised" }),
      makeSession({ id: "s4", supervision_level: "observed" }),
      makeSession({ id: "s5", supervision_level: "restricted" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    const sum = Object.values(m.by_supervision_level).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_sessions);
  });

  it("by_supervision_level has 5 entries when all levels represented", () => {
    const levels: SupervisionLevel[] = ["none", "monitored", "supervised", "observed", "restricted"];
    const sessions = levels.map((lvl, i) => makeSession({ id: `s${i}`, supervision_level: lvl }));
    const m = computeContactMetrics(sessions, 1);
    expect(Object.keys(m.by_supervision_level)).toHaveLength(5);
  });

  // ── by_child ────────────────────────────────────────────────────────

  it("by_child groups counts by child name", () => {
    const sessions = [
      makeSession({ id: "s1", child_name: "Alice Smith", child_id: "c1" }),
      makeSession({ id: "s2", child_name: "Alice Smith", child_id: "c1" }),
      makeSession({ id: "s3", child_name: "Bob Jones", child_id: "c2" }),
    ];
    const m = computeContactMetrics(sessions, 2);
    expect(m.by_child["Alice Smith"]).toBe(2);
    expect(m.by_child["Bob Jones"]).toBe(1);
  });

  it("by_child is empty for no sessions", () => {
    const m = computeContactMetrics([], 0);
    expect(Object.keys(m.by_child)).toHaveLength(0);
  });

  it("by_child has one entry per unique child name", () => {
    const sessions = [
      makeSession({ id: "s1", child_name: "Alice", child_id: "c1" }),
      makeSession({ id: "s2", child_name: "Bob", child_id: "c2" }),
      makeSession({ id: "s3", child_name: "Alice", child_id: "c1" }),
    ];
    const m = computeContactMetrics(sessions, 2);
    expect(Object.keys(m.by_child)).toHaveLength(2);
  });

  it("by_child values sum to total_sessions", () => {
    const sessions = [
      makeSession({ id: "s1", child_name: "Alice", child_id: "c1" }),
      makeSession({ id: "s2", child_name: "Bob", child_id: "c2" }),
      makeSession({ id: "s3", child_name: "Alice", child_id: "c1" }),
      makeSession({ id: "s4", child_name: "Carol", child_id: "c3" }),
    ];
    const m = computeContactMetrics(sessions, 3);
    const sum = Object.values(m.by_child).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_sessions);
  });

  // ── mixed multi-child scenario ──────────────────────────────────────

  it("correctly computes metrics for multi-child mixed scenario", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Alice", outcome: "completed_positive", duration_minutes: 60, supervision_level: "supervised", court_ordered: true, concerns_raised: true, child_views: "Good" }),
      makeSession({ id: "s2", child_id: "c1", child_name: "Alice", outcome: "completed_neutral", duration_minutes: 45, supervision_level: "none", court_ordered: false, concerns_raised: false, child_views: null }),
      makeSession({ id: "s3", child_id: "c2", child_name: "Bob", outcome: "no_show", duration_minutes: null, supervision_level: "monitored", court_ordered: true, concerns_raised: false, child_views: null }),
      makeSession({ id: "s4", child_id: "c3", child_name: "Carol", outcome: "refused_by_child", duration_minutes: null, supervision_level: "none", court_ordered: false, concerns_raised: false, child_views: "Didn't want to go" }),
    ];
    const m = computeContactMetrics(sessions, 5);
    expect(m.total_sessions).toBe(4);
    expect(m.completed_count).toBe(2);
    expect(m.cancelled_count).toBe(0);
    expect(m.no_show_count).toBe(1);
    expect(m.refused_count).toBe(1);
    expect(m.completion_rate).toBe(50);
    expect(m.positive_outcome_rate).toBe(50);
    expect(m.negative_outcome_rate).toBe(0);
    expect(m.children_with_contact).toBe(3);
    expect(m.contact_coverage).toBe(60);
    expect(m.concerns_raised_count).toBe(1);
    expect(m.supervised_count).toBe(2);
    expect(m.court_ordered_count).toBe(2);
    expect(m.average_duration).toBe(53);
    expect(m.child_views_recorded_rate).toBe(50);
    expect(m.by_child["Alice"]).toBe(2);
    expect(m.by_child["Bob"]).toBe(1);
    expect(m.by_child["Carol"]).toBe(1);
  });

  // ── large dataset ───────────────────────────────────────────────────

  it("handles large sessions array efficiently", () => {
    const outcomes: ContactOutcome[] = [
      "completed_positive", "completed_neutral", "completed_negative",
      "cancelled_by_parent", "cancelled_by_child", "cancelled_by_la",
      "no_show", "refused_by_child", "rescheduled",
    ];
    const types: ContactType[] = ["face_to_face", "phone_call", "video_call", "letter", "supervised_visit"];
    const levels: SupervisionLevel[] = ["none", "monitored", "supervised", "observed", "restricted"];
    const sessions: ContactSession[] = [];
    for (let i = 0; i < 100; i++) {
      sessions.push(
        makeSession({
          id: `s-${i}`,
          child_id: `c-${i % 20}`,
          child_name: `Child ${i % 20}`,
          outcome: outcomes[i % 9],
          contact_type: types[i % 5],
          supervision_level: levels[i % 5],
          duration_minutes: i % 3 === 0 ? 60 : null,
          concerns_raised: i % 10 === 0,
          court_ordered: i % 7 === 0,
          child_views: i % 4 === 0 ? "views" : null,
        }),
      );
    }
    const m = computeContactMetrics(sessions, 25);
    expect(m.total_sessions).toBe(100);
    expect(m.children_with_contact).toBe(20);
    expect(m.contact_coverage).toBe(80);
  });

  it("totalChildren parameter does not affect per-session metrics", () => {
    const sessions = [makeSession({ id: "s1", child_id: "c1" })];
    const m1 = computeContactMetrics(sessions, 1);
    const m2 = computeContactMetrics(sessions, 100);
    expect(m1.total_sessions).toBe(m2.total_sessions);
    expect(m1.completed_count).toBe(m2.completed_count);
    expect(m1.completion_rate).toBe(m2.completion_rate);
    expect(m1.positive_outcome_rate).toBe(m2.positive_outcome_rate);
    expect(m1.average_duration).toBe(m2.average_duration);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyContactAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyContactAlerts", () => {
  // ── no alerts when clean ────────────────────────────────────────────

  it("returns empty array for empty sessions and zero children", () => {
    const alerts = identifyContactAlerts([], 0);
    expect(alerts).toEqual([]);
  });

  it("returns empty array when all data is clean", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", outcome: "completed_positive", concerns_raised: false }),
      makeSession({ id: "s2", child_id: "c2", outcome: "completed_neutral", concerns_raised: false }),
    ];
    const alerts = identifyContactAlerts(sessions, 2);
    expect(alerts).toEqual([]);
  });

  // ── concern_not_reported alert (critical) ───────────────────────────

  it("generates concern_not_reported alert when concerns raised but SW not informed", () => {
    const sessions = [
      makeSession({ id: "s1", concerns_raised: true, social_worker_informed: false }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const concern = alerts.find((a) => a.type === "concern_not_reported");
    expect(concern).toBeTruthy();
    expect(concern!.severity).toBe("critical");
    expect(concern!.id).toBe("s1");
  });

  it("concern_not_reported alert includes child name", () => {
    const sessions = [
      makeSession({ id: "s1", child_name: "Alice Smith", concerns_raised: true, social_worker_informed: false }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const concern = alerts.find((a) => a.type === "concern_not_reported");
    expect(concern!.message).toContain("Alice Smith");
  });

  it("concern_not_reported alert includes contact_with name", () => {
    const sessions = [
      makeSession({ id: "s1", contact_with: "Jane Smith", concerns_raised: true, social_worker_informed: false }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const concern = alerts.find((a) => a.type === "concern_not_reported");
    expect(concern!.message).toContain("Jane Smith");
  });

  it("concern_not_reported alert includes scheduled_date", () => {
    const date = daysAgo(3);
    const sessions = [
      makeSession({ id: "s1", scheduled_date: date, concerns_raised: true, social_worker_informed: false }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const concern = alerts.find((a) => a.type === "concern_not_reported");
    expect(concern!.message).toContain(date);
  });

  it("no concern_not_reported alert when concerns raised and SW informed", () => {
    const sessions = [
      makeSession({ id: "s1", concerns_raised: true, social_worker_informed: true }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const concern = alerts.find((a) => a.type === "concern_not_reported");
    expect(concern).toBeUndefined();
  });

  it("no concern_not_reported alert when no concerns raised", () => {
    const sessions = [
      makeSession({ id: "s1", concerns_raised: false, social_worker_informed: false }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const concern = alerts.find((a) => a.type === "concern_not_reported");
    expect(concern).toBeUndefined();
  });

  it("generates multiple concern_not_reported alerts for different sessions", () => {
    const sessions = [
      makeSession({ id: "s1", child_name: "Alice", concerns_raised: true, social_worker_informed: false }),
      makeSession({ id: "s2", child_name: "Bob", concerns_raised: true, social_worker_informed: false }),
      makeSession({ id: "s3", child_name: "Carol", concerns_raised: true, social_worker_informed: true }),
    ];
    const alerts = identifyContactAlerts(sessions, 3);
    const concerns = alerts.filter((a) => a.type === "concern_not_reported");
    expect(concerns).toHaveLength(2);
  });

  it("concern_not_reported alert id matches session id", () => {
    const sessions = [
      makeSession({ id: "session-42", concerns_raised: true, social_worker_informed: false }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const concern = alerts.find((a) => a.type === "concern_not_reported");
    expect(concern!.id).toBe("session-42");
  });

  // ── repeated_no_show alert (high) ───────────────────────────────────

  it("generates repeated_no_show alert when parent has 2+ no-shows for same child", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Alice", contact_with: "Dad", outcome: "no_show" }),
      makeSession({ id: "s2", child_id: "c1", child_name: "Alice", contact_with: "Dad", outcome: "no_show" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const noShow = alerts.find((a) => a.type === "repeated_no_show");
    expect(noShow).toBeTruthy();
    expect(noShow!.severity).toBe("high");
  });

  it("repeated_no_show alert includes parent name", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Alice", contact_with: "John Smith", outcome: "no_show" }),
      makeSession({ id: "s2", child_id: "c1", child_name: "Alice", contact_with: "John Smith", outcome: "no_show" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const noShow = alerts.find((a) => a.type === "repeated_no_show");
    expect(noShow!.message).toContain("John Smith");
  });

  it("repeated_no_show alert includes child name", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Alice Smith", contact_with: "Dad", outcome: "no_show" }),
      makeSession({ id: "s2", child_id: "c1", child_name: "Alice Smith", contact_with: "Dad", outcome: "no_show" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const noShow = alerts.find((a) => a.type === "repeated_no_show");
    expect(noShow!.message).toContain("Alice Smith");
  });

  it("repeated_no_show alert includes count", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Alice", contact_with: "Dad", outcome: "no_show" }),
      makeSession({ id: "s2", child_id: "c1", child_name: "Alice", contact_with: "Dad", outcome: "no_show" }),
      makeSession({ id: "s3", child_id: "c1", child_name: "Alice", contact_with: "Dad", outcome: "no_show" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const noShow = alerts.find((a) => a.type === "repeated_no_show");
    expect(noShow!.message).toContain("3");
  });

  it("no repeated_no_show alert when only 1 no-show from same parent", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Alice", contact_with: "Dad", outcome: "no_show" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const noShow = alerts.find((a) => a.type === "repeated_no_show");
    expect(noShow).toBeUndefined();
  });

  it("no repeated_no_show when no-shows are from different parents", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Alice", contact_with: "Dad", outcome: "no_show" }),
      makeSession({ id: "s2", child_id: "c1", child_name: "Alice", contact_with: "Mum", outcome: "no_show" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const noShow = alerts.find((a) => a.type === "repeated_no_show");
    expect(noShow).toBeUndefined();
  });

  it("no repeated_no_show when no-shows are for different children by same parent", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Alice", contact_with: "Dad", outcome: "no_show" }),
      makeSession({ id: "s2", child_id: "c2", child_name: "Bob", contact_with: "Dad", outcome: "no_show" }),
    ];
    const alerts = identifyContactAlerts(sessions, 2);
    const noShow = alerts.find((a) => a.type === "repeated_no_show");
    expect(noShow).toBeUndefined();
  });

  it("repeated_no_show tracks per child-parent pair independently", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Alice", contact_with: "Dad", outcome: "no_show" }),
      makeSession({ id: "s2", child_id: "c1", child_name: "Alice", contact_with: "Dad", outcome: "no_show" }),
      makeSession({ id: "s3", child_id: "c2", child_name: "Bob", contact_with: "Mum", outcome: "no_show" }),
      makeSession({ id: "s4", child_id: "c2", child_name: "Bob", contact_with: "Mum", outcome: "no_show" }),
    ];
    const alerts = identifyContactAlerts(sessions, 2);
    const noShows = alerts.filter((a) => a.type === "repeated_no_show");
    expect(noShows).toHaveLength(2);
  });

  it("repeated_no_show alert id includes child_id and contact_with key", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", contact_with: "Dad", outcome: "no_show" }),
      makeSession({ id: "s2", child_id: "c1", contact_with: "Dad", outcome: "no_show" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const noShow = alerts.find((a) => a.type === "repeated_no_show");
    expect(noShow!.id).toContain("no_show_");
    expect(noShow!.id).toContain("c1");
    expect(noShow!.id).toContain("Dad");
  });

  // ── repeated_refusal alert (high) ───────────────────────────────────

  it("generates repeated_refusal alert when child refuses 2+ times", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Alice", outcome: "refused_by_child" }),
      makeSession({ id: "s2", child_id: "c1", child_name: "Alice", outcome: "refused_by_child" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const refusal = alerts.find((a) => a.type === "repeated_refusal");
    expect(refusal).toBeTruthy();
    expect(refusal!.severity).toBe("high");
  });

  it("repeated_refusal alert includes child name", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Bob Jones", outcome: "refused_by_child" }),
      makeSession({ id: "s2", child_id: "c1", child_name: "Bob Jones", outcome: "refused_by_child" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const refusal = alerts.find((a) => a.type === "repeated_refusal");
    expect(refusal!.message).toContain("Bob Jones");
  });

  it("repeated_refusal alert includes count", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Alice", outcome: "refused_by_child" }),
      makeSession({ id: "s2", child_id: "c1", child_name: "Alice", outcome: "refused_by_child" }),
      makeSession({ id: "s3", child_id: "c1", child_name: "Alice", outcome: "refused_by_child" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const refusal = alerts.find((a) => a.type === "repeated_refusal");
    expect(refusal!.message).toContain("3");
  });

  it("no repeated_refusal alert when child refuses only once", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Alice", outcome: "refused_by_child" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const refusal = alerts.find((a) => a.type === "repeated_refusal");
    expect(refusal).toBeUndefined();
  });

  it("repeated_refusal tracks per child independently", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Alice", outcome: "refused_by_child" }),
      makeSession({ id: "s2", child_id: "c1", child_name: "Alice", outcome: "refused_by_child" }),
      makeSession({ id: "s3", child_id: "c2", child_name: "Bob", outcome: "refused_by_child" }),
    ];
    const alerts = identifyContactAlerts(sessions, 2);
    const refusals = alerts.filter((a) => a.type === "repeated_refusal");
    expect(refusals).toHaveLength(1);
    expect(refusals[0].message).toContain("Alice");
  });

  it("repeated_refusal generates alerts for multiple children exceeding threshold", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Alice", outcome: "refused_by_child" }),
      makeSession({ id: "s2", child_id: "c1", child_name: "Alice", outcome: "refused_by_child" }),
      makeSession({ id: "s3", child_id: "c2", child_name: "Bob", outcome: "refused_by_child" }),
      makeSession({ id: "s4", child_id: "c2", child_name: "Bob", outcome: "refused_by_child" }),
      makeSession({ id: "s5", child_id: "c2", child_name: "Bob", outcome: "refused_by_child" }),
    ];
    const alerts = identifyContactAlerts(sessions, 2);
    const refusals = alerts.filter((a) => a.type === "repeated_refusal");
    expect(refusals).toHaveLength(2);
  });

  it("repeated_refusal alert id includes child_id", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c42", child_name: "Alice", outcome: "refused_by_child" }),
      makeSession({ id: "s2", child_id: "c42", child_name: "Alice", outcome: "refused_by_child" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const refusal = alerts.find((a) => a.type === "repeated_refusal");
    expect(refusal!.id).toBe("refusal_c42");
  });

  // ── distress_after_contact alert (medium) ───────────────────────────

  it("generates distress_after_contact alert for negative outcome with upset mood", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_negative", child_mood_after: "upset" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const distress = alerts.find((a) => a.type === "distress_after_contact");
    expect(distress).toBeTruthy();
    expect(distress!.severity).toBe("medium");
  });

  it("generates distress_after_contact alert for negative outcome with angry mood", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_negative", child_mood_after: "angry" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const distress = alerts.find((a) => a.type === "distress_after_contact");
    expect(distress).toBeTruthy();
  });

  it("generates distress_after_contact alert for negative outcome with withdrawn mood", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_negative", child_mood_after: "withdrawn" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const distress = alerts.find((a) => a.type === "distress_after_contact");
    expect(distress).toBeTruthy();
  });

  it("distress_after_contact alert includes child name", () => {
    const sessions = [
      makeSession({ id: "s1", child_name: "Alice Smith", outcome: "completed_negative", child_mood_after: "upset" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const distress = alerts.find((a) => a.type === "distress_after_contact");
    expect(distress!.message).toContain("Alice Smith");
  });

  it("distress_after_contact alert includes mood description", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_negative", child_mood_after: "withdrawn" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const distress = alerts.find((a) => a.type === "distress_after_contact");
    expect(distress!.message).toContain("withdrawn");
  });

  it("distress_after_contact alert includes contact_with name", () => {
    const sessions = [
      makeSession({ id: "s1", contact_with: "John Smith", outcome: "completed_negative", child_mood_after: "angry" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const distress = alerts.find((a) => a.type === "distress_after_contact");
    expect(distress!.message).toContain("John Smith");
  });

  it("distress_after_contact alert includes scheduled_date", () => {
    const date = daysAgo(2);
    const sessions = [
      makeSession({ id: "s1", scheduled_date: date, outcome: "completed_negative", child_mood_after: "upset" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const distress = alerts.find((a) => a.type === "distress_after_contact");
    expect(distress!.message).toContain(date);
  });

  it("no distress_after_contact alert for negative outcome with non-distress moods", () => {
    const nonDistressMoods: (ChildMood | null)[] = ["happy", "calm", "anxious", "excited", "mixed", null];
    for (const mood of nonDistressMoods) {
      const sessions = [
        makeSession({ id: "s1", outcome: "completed_negative", child_mood_after: mood }),
      ];
      const alerts = identifyContactAlerts(sessions, 1);
      const distress = alerts.find((a) => a.type === "distress_after_contact");
      expect(distress).toBeUndefined();
    }
  });

  it("no distress_after_contact alert for non-negative outcomes with distress moods", () => {
    const nonNegativeOutcomes: ContactOutcome[] = [
      "completed_positive", "completed_neutral", "cancelled_by_parent",
      "cancelled_by_child", "no_show", "refused_by_child", "rescheduled",
    ];
    for (const outcome of nonNegativeOutcomes) {
      const sessions = [
        makeSession({ id: "s1", outcome, child_mood_after: "upset" }),
      ];
      const alerts = identifyContactAlerts(sessions, 1);
      const distress = alerts.find((a) => a.type === "distress_after_contact");
      expect(distress).toBeUndefined();
    }
  });

  it("generates multiple distress_after_contact alerts for different sessions", () => {
    const sessions = [
      makeSession({ id: "s1", child_name: "Alice", outcome: "completed_negative", child_mood_after: "upset" }),
      makeSession({ id: "s2", child_name: "Bob", outcome: "completed_negative", child_mood_after: "angry" }),
      makeSession({ id: "s3", child_name: "Carol", outcome: "completed_negative", child_mood_after: "withdrawn" }),
    ];
    const alerts = identifyContactAlerts(sessions, 3);
    const distress = alerts.filter((a) => a.type === "distress_after_contact");
    expect(distress).toHaveLength(3);
  });

  it("distress_after_contact alert id matches session id", () => {
    const sessions = [
      makeSession({ id: "session-99", outcome: "completed_negative", child_mood_after: "upset" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const distress = alerts.find((a) => a.type === "distress_after_contact");
    expect(distress!.id).toBe("session-99");
  });

  // ── no_contact_recorded alert (medium) ──────────────────────────────

  it("generates no_contact_recorded alert when children lack sessions", () => {
    const alerts = identifyContactAlerts([], 3);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe("no_contact_recorded");
    expect(alerts[0].severity).toBe("medium");
    expect(alerts[0].id).toBe("contact_gap");
  });

  it("no_contact_recorded alert includes correct gap count for 1 child", () => {
    const alerts = identifyContactAlerts([], 1);
    expect(alerts[0].message).toContain("1");
    expect(alerts[0].message).toContain("child has");
  });

  it("no_contact_recorded alert uses plural for multiple children", () => {
    const alerts = identifyContactAlerts([], 5);
    expect(alerts[0].message).toContain("5");
    expect(alerts[0].message).toContain("children have");
  });

  it("no_contact_recorded alert counts only children without sessions", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1" }),
    ];
    const alerts = identifyContactAlerts(sessions, 4);
    const gap = alerts.find((a) => a.type === "no_contact_recorded");
    expect(gap).toBeTruthy();
    expect(gap!.message).toContain("3");
  });

  it("no no_contact_recorded alert when all children have sessions", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1" }),
      makeSession({ id: "s2", child_id: "c2" }),
    ];
    const alerts = identifyContactAlerts(sessions, 2);
    const gap = alerts.find((a) => a.type === "no_contact_recorded");
    expect(gap).toBeUndefined();
  });

  it("no no_contact_recorded alert when totalChildren is 0", () => {
    const alerts = identifyContactAlerts([], 0);
    const gap = alerts.find((a) => a.type === "no_contact_recorded");
    expect(gap).toBeUndefined();
  });

  it("no no_contact_recorded alert when more unique children than totalChildren", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1" }),
      makeSession({ id: "s2", child_id: "c2" }),
      makeSession({ id: "s3", child_id: "c3" }),
    ];
    const alerts = identifyContactAlerts(sessions, 2);
    const gap = alerts.find((a) => a.type === "no_contact_recorded");
    expect(gap).toBeUndefined();
  });

  // ── combined alerts ─────────────────────────────────────────────────

  it("generates all alert types together when conditions are met", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Alice", contact_with: "Dad", concerns_raised: true, social_worker_informed: false, outcome: "completed_negative", child_mood_after: "upset" }),
      makeSession({ id: "s2", child_id: "c1", child_name: "Alice", contact_with: "Dad", outcome: "no_show" }),
      makeSession({ id: "s3", child_id: "c1", child_name: "Alice", contact_with: "Dad", outcome: "no_show" }),
      makeSession({ id: "s4", child_id: "c1", child_name: "Alice", outcome: "refused_by_child" }),
      makeSession({ id: "s5", child_id: "c1", child_name: "Alice", outcome: "refused_by_child" }),
    ];
    const alerts = identifyContactAlerts(sessions, 3);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("concern_not_reported");
    expect(types).toContain("repeated_no_show");
    expect(types).toContain("repeated_refusal");
    expect(types).toContain("distress_after_contact");
    expect(types).toContain("no_contact_recorded");
  });

  it("alert severity values are correct types", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Alice", concerns_raised: true, social_worker_informed: false, outcome: "completed_negative", child_mood_after: "upset" }),
    ];
    const alerts = identifyContactAlerts(sessions, 2);
    for (const alert of alerts) {
      expect(["critical", "high", "medium"]).toContain(alert.severity);
    }
  });

  it("each alert has a non-empty message", () => {
    const sessions = [
      makeSession({ id: "s1", concerns_raised: true, social_worker_informed: false }),
    ];
    const alerts = identifyContactAlerts(sessions, 2);
    for (const alert of alerts) {
      expect(alert.message.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty id", () => {
    const sessions = [
      makeSession({ id: "s1", concerns_raised: true, social_worker_informed: false }),
    ];
    const alerts = identifyContactAlerts(sessions, 2);
    for (const alert of alerts) {
      expect(alert.id.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty type", () => {
    const sessions = [
      makeSession({ id: "s1", concerns_raised: true, social_worker_informed: false }),
    ];
    const alerts = identifyContactAlerts(sessions, 2);
    for (const alert of alerts) {
      expect(alert.type.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listSessions ────────────────────────────────────────────────────

  it("listSessions returns ok: true with empty array", async () => {
    const result = await listSessions("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listSessions returns ok: true with individual filters", async () => {
    const r1 = await listSessions("home-1", { childId: "child-1" });
    expect(r1.ok).toBe(true);
    const r2 = await listSessions("home-1", { contactType: "face_to_face" });
    expect(r2.ok).toBe(true);
    const r3 = await listSessions("home-1", { outcome: "completed_positive" });
    expect(r3.ok).toBe(true);
    const r4 = await listSessions("home-1", { limit: 50 });
    expect(r4.ok).toBe(true);
  });

  it("listSessions returns ok: true with all filters combined", async () => {
    const result = await listSessions("home-1", {
      childId: "child-1",
      contactType: "phone_call",
      outcome: "completed_neutral",
      dateFrom: daysAgo(60),
      dateTo: daysAgo(1),
      limit: 10,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createSession ───────────────────────────────────────────────────

  it("createSession returns ok: false with error message", async () => {
    const result = await createSession({
      homeId: "home-1",
      childName: "Alice Smith",
      childId: "child-1",
      contactWith: "Jane Smith",
      relationship: "Mother",
      contactType: "face_to_face",
      supervisionLevel: "none",
      scheduledDate: daysAgo(1),
      outcome: "completed_positive",
      concernsRaised: false,
      socialWorkerInformed: false,
      courtOrdered: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createSession error message is a string with all optional fields", async () => {
    const result = await createSession({
      homeId: "home-1",
      childName: "Bob Jones",
      childId: "child-2",
      contactWith: "John Jones",
      relationship: "Father",
      contactType: "supervised_visit",
      supervisionLevel: "supervised",
      scheduledDate: daysAgo(3),
      actualDate: daysAgo(3),
      durationMinutes: 90,
      outcome: "completed_neutral",
      childMoodBefore: "anxious",
      childMoodAfter: "calm",
      childViews: "It was nice to see dad",
      staffObservations: "Child settled after 15 minutes",
      concernsRaised: true,
      concernDetails: "Child mentioned sleeping problems",
      socialWorkerInformed: true,
      courtOrdered: true,
      notes: "Follow up needed",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  // ── updateSession ───────────────────────────────────────────────────

  it("updateSession returns ok: false with error message", async () => {
    const result = await updateSession("session-1", { outcome: "completed_positive" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateSession error message is a string for partial updates", async () => {
    const result = await updateSession("session-1", {
      outcome: "completed_negative",
      child_mood_after: "upset",
      concerns_raised: true,
      concern_details: "Child became distressed",
      social_worker_informed: true,
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
  it("computeContactMetrics with sessions across all 9 outcomes validates breakdown counts", () => {
    const outcomes: ContactOutcome[] = [
      "completed_positive", "completed_neutral", "completed_negative",
      "cancelled_by_parent", "cancelled_by_child", "cancelled_by_la",
      "no_show", "refused_by_child", "rescheduled",
    ];
    const sessions = outcomes.map((o, i) =>
      makeSession({ id: `s-${i}`, outcome: o }),
    );
    const m = computeContactMetrics(sessions, 1);
    expect(m.total_sessions).toBe(9);
    expect(m.completed_count).toBe(3);
    expect(m.cancelled_count).toBe(3);
    expect(m.no_show_count).toBe(1);
    expect(m.refused_count).toBe(1);
    expect(Object.keys(m.by_outcome)).toHaveLength(9);
  });

  it("computeContactMetrics with all sessions positive", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive" }),
      makeSession({ id: "s2", outcome: "completed_positive" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.positive_outcome_rate).toBe(100);
    expect(m.negative_outcome_rate).toBe(0);
    expect(m.completion_rate).toBe(100);
  });

  it("computeContactMetrics with all sessions negative", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_negative" }),
      makeSession({ id: "s2", outcome: "completed_negative" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.positive_outcome_rate).toBe(0);
    expect(m.negative_outcome_rate).toBe(100);
  });

  it("computeContactMetrics completion_rate with 2 completed out of 3", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive" }),
      makeSession({ id: "s2", outcome: "completed_neutral" }),
      makeSession({ id: "s3", outcome: "no_show" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.completion_rate).toBe(66.7);
  });

  it("computeContactMetrics contact_coverage with 2 children in 3 totalChildren", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1" }),
      makeSession({ id: "s2", child_id: "c2" }),
    ];
    const m = computeContactMetrics(sessions, 3);
    expect(m.contact_coverage).toBe(66.7);
  });

  it("computeContactMetrics child_views_recorded_rate counts non-null views including empty strings", () => {
    const sessions = [
      makeSession({ id: "s1", child_views: "" }),
      makeSession({ id: "s2", child_views: null }),
    ];
    const m = computeContactMetrics(sessions, 1);
    // empty string is non-null so it is counted
    expect(m.child_views_recorded_rate).toBe(50);
  });

  it("computeContactMetrics average_duration only considers completed_negative as completed", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_negative", duration_minutes: 30 }),
      makeSession({ id: "s2", outcome: "rescheduled", duration_minutes: 90 }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.average_duration).toBe(30);
  });

  it("identifyContactAlerts concern_not_reported does not trigger for false concerns", () => {
    const sessions = [
      makeSession({ id: "s1", concerns_raised: false, social_worker_informed: false }),
      makeSession({ id: "s2", concerns_raised: false, social_worker_informed: true }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const concern = alerts.find((a) => a.type === "concern_not_reported");
    expect(concern).toBeUndefined();
  });

  it("identifyContactAlerts repeated_no_show exactly at threshold of 2", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", contact_with: "Dad", outcome: "no_show" }),
      makeSession({ id: "s2", child_id: "c1", contact_with: "Dad", outcome: "no_show" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const noShow = alerts.find((a) => a.type === "repeated_no_show");
    expect(noShow).toBeTruthy();
    expect(noShow!.message).toContain("2");
  });

  it("identifyContactAlerts repeated_refusal exactly at threshold of 2", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Alice", outcome: "refused_by_child" }),
      makeSession({ id: "s2", child_id: "c1", child_name: "Alice", outcome: "refused_by_child" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const refusal = alerts.find((a) => a.type === "repeated_refusal");
    expect(refusal).toBeTruthy();
    expect(refusal!.message).toContain("2");
  });

  it("identifyContactAlerts no_contact_recorded gap is exact difference", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1" }),
      makeSession({ id: "s2", child_id: "c2" }),
    ];
    const alerts = identifyContactAlerts(sessions, 7);
    const gap = alerts.find((a) => a.type === "no_contact_recorded");
    expect(gap!.message).toContain("5");
    expect(gap!.message).toContain("children have");
  });

  it("identifyContactAlerts empty sessions with 0 totalChildren produces no alerts", () => {
    const alerts = identifyContactAlerts([], 0);
    expect(alerts).toHaveLength(0);
  });

  it("computeContactMetrics handles mix of court ordered and non-court ordered", () => {
    const sessions = [
      makeSession({ id: "s1", court_ordered: true }),
      makeSession({ id: "s2", court_ordered: false }),
      makeSession({ id: "s3", court_ordered: true }),
      makeSession({ id: "s4", court_ordered: false }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.court_ordered_count).toBe(2);
  });

  it("computeContactMetrics handles mix of concerns and no concerns", () => {
    const sessions = [
      makeSession({ id: "s1", concerns_raised: true }),
      makeSession({ id: "s2", concerns_raised: false }),
      makeSession({ id: "s3", concerns_raised: true }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.concerns_raised_count).toBe(2);
  });

  it("computeContactMetrics by_outcome matches individual metric counts", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive" }),
      makeSession({ id: "s2", outcome: "completed_positive" }),
      makeSession({ id: "s3", outcome: "no_show" }),
      makeSession({ id: "s4", outcome: "refused_by_child" }),
      makeSession({ id: "s5", outcome: "cancelled_by_parent" }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.by_outcome["completed_positive"]).toBe(2);
    expect(m.by_outcome["no_show"]).toBe(m.no_show_count);
    expect(m.by_outcome["refused_by_child"]).toBe(m.refused_count);
    expect(m.by_outcome["cancelled_by_parent"]).toBe(1);
  });

  it("computeContactMetrics average_duration with three completed sessions", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_positive", duration_minutes: 30 }),
      makeSession({ id: "s2", outcome: "completed_neutral", duration_minutes: 60 }),
      makeSession({ id: "s3", outcome: "completed_negative", duration_minutes: 90 }),
    ];
    const m = computeContactMetrics(sessions, 1);
    expect(m.average_duration).toBe(60);
  });

  it("identifyContactAlerts no_contact_recorded message mentions review contact arrangements", () => {
    const alerts = identifyContactAlerts([], 2);
    const gap = alerts.find((a) => a.type === "no_contact_recorded");
    expect(gap!.message).toContain("review contact arrangements");
  });

  it("identifyContactAlerts repeated_no_show message mentions discuss with social worker", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Alice", contact_with: "Dad", outcome: "no_show" }),
      makeSession({ id: "s2", child_id: "c1", child_name: "Alice", contact_with: "Dad", outcome: "no_show" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const noShow = alerts.find((a) => a.type === "repeated_no_show");
    expect(noShow!.message).toContain("social worker");
  });

  it("identifyContactAlerts repeated_refusal message mentions wishes and feelings", () => {
    const sessions = [
      makeSession({ id: "s1", child_id: "c1", child_name: "Alice", outcome: "refused_by_child" }),
      makeSession({ id: "s2", child_id: "c1", child_name: "Alice", outcome: "refused_by_child" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const refusal = alerts.find((a) => a.type === "repeated_refusal");
    expect(refusal!.message).toContain("wishes and feelings");
  });

  it("identifyContactAlerts distress_after_contact message mentions review contact arrangements", () => {
    const sessions = [
      makeSession({ id: "s1", outcome: "completed_negative", child_mood_after: "upset" }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const distress = alerts.find((a) => a.type === "distress_after_contact");
    expect(distress!.message).toContain("review contact arrangements");
  });

  it("identifyContactAlerts concern_not_reported message mentions social worker not informed", () => {
    const sessions = [
      makeSession({ id: "s1", concerns_raised: true, social_worker_informed: false }),
    ];
    const alerts = identifyContactAlerts(sessions, 1);
    const concern = alerts.find((a) => a.type === "concern_not_reported");
    expect(concern!.message).toContain("social worker not informed");
  });
});
