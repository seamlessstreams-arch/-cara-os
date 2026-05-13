// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF SUPERVISION SESSIONS SERVICE TESTS
// Pure-function unit tests for supervision session metrics computation,
// alert identification, constant validation.
// CHR 2015 Reg 33 (employment of staff — supervision),
// Reg 16 (providing suitable staff — ongoing support).
//
// Covers: supervision records, frequency compliance, case discussions,
// action tracking, emotional wellbeing, and safeguarding awareness.
//
// SCCIF: Leadership & Management — "Staff receive regular supervision
// that supports them to practice effectively."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
  _testing,
  SUPERVISION_TYPES,
  SESSION_STATUSES,
  WELLBEING_RATINGS,
  ACTION_PRIORITIES,
} from "../staff-supervision-sessions-service";

import type {
  SupervisionSession,
  SupervisionType,
  SessionStatus,
  WellbeingRating,
  ActionPriority,
} from "../staff-supervision-sessions-service";

const { computeSupervisionSessionMetrics, identifySupervisionSessionAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysAgo(n: number): string {
  return daysAgoISO(n).split("T")[0];
}

function futureDateISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/** Build a minimal SupervisionSession with sensible defaults. */
function makeSession(
  overrides?: Partial<SupervisionSession>,
): SupervisionSession {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    staff_name: "Staff A",
    staff_id: "staff-1",
    supervisor_name: "Supervisor X",
    supervision_type: "formal_scheduled",
    session_status: "completed",
    session_date: daysAgo(5),
    next_session_date: "next_session_date" in (overrides ?? {}) ? (overrides!.next_session_date ?? null) : futureDateISO(30),
    duration_minutes: 60,
    children_discussed: ["child-1"],
    cases_discussed_count: 1,
    safeguarding_discussed: true,
    wellbeing_rating: "good",
    wellbeing_concerns_raised: false,
    actions_set: 3,
    actions_completed_from_last: 2,
    actions_outstanding_from_last: 1,
    training_needs_identified: false,
    reflective_practice_included: true,
    signed_by_supervisee: true,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: daysAgoISO(5),
    updated_at: daysAgoISO(5),
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("SUPERVISION_TYPES", () => {
  it("contains exactly 9 entries", () => {
    expect(SUPERVISION_TYPES).toHaveLength(9);
  });

  it("every entry has a non-empty type string", () => {
    for (const t of SUPERVISION_TYPES) {
      expect(typeof t.type).toBe("string");
      expect(t.type.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const t of SUPERVISION_TYPES) {
      expect(typeof t.label).toBe("string");
      expect(t.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate types", () => {
    const types = SUPERVISION_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("has no duplicate labels", () => {
    const labels = SUPERVISION_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected types", () => {
    const types = SUPERVISION_TYPES.map((t) => t.type);
    const expected: SupervisionType[] = [
      "formal_scheduled", "informal", "group", "peer", "clinical",
      "management", "safeguarding", "probation", "other",
    ];
    for (const e of expected) {
      expect(types).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const t of SUPERVISION_TYPES) {
      expect(t.label[0]).toBe(t.label[0].toUpperCase());
    }
  });

  it("includes formal_scheduled", () => {
    expect(SUPERVISION_TYPES.map((t) => t.type)).toContain("formal_scheduled");
  });

  it("includes clinical", () => {
    expect(SUPERVISION_TYPES.map((t) => t.type)).toContain("clinical");
  });

  it("includes safeguarding", () => {
    expect(SUPERVISION_TYPES.map((t) => t.type)).toContain("safeguarding");
  });
});

describe("SESSION_STATUSES", () => {
  it("contains exactly 6 entries", () => {
    expect(SESSION_STATUSES).toHaveLength(6);
  });

  it("every entry has a non-empty status string", () => {
    for (const s of SESSION_STATUSES) {
      expect(typeof s.status).toBe("string");
      expect(s.status.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const s of SESSION_STATUSES) {
      expect(typeof s.label).toBe("string");
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate statuses", () => {
    const statuses = SESSION_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("has no duplicate labels", () => {
    const labels = SESSION_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected statuses", () => {
    const statuses = SESSION_STATUSES.map((s) => s.status);
    const expected: SessionStatus[] = [
      "scheduled", "completed", "cancelled_by_supervisor",
      "cancelled_by_supervisee", "rescheduled", "overdue",
    ];
    for (const e of expected) {
      expect(statuses).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const s of SESSION_STATUSES) {
      expect(s.label[0]).toBe(s.label[0].toUpperCase());
    }
  });
});

describe("WELLBEING_RATINGS", () => {
  it("contains exactly 5 entries", () => {
    expect(WELLBEING_RATINGS).toHaveLength(5);
  });

  it("every entry has a non-empty rating string", () => {
    for (const w of WELLBEING_RATINGS) {
      expect(typeof w.rating).toBe("string");
      expect(w.rating.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const w of WELLBEING_RATINGS) {
      expect(typeof w.label).toBe("string");
      expect(w.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate ratings", () => {
    const ratings = WELLBEING_RATINGS.map((w) => w.rating);
    expect(new Set(ratings).size).toBe(ratings.length);
  });

  it("has no duplicate labels", () => {
    const labels = WELLBEING_RATINGS.map((w) => w.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected ratings", () => {
    const ratings = WELLBEING_RATINGS.map((w) => w.rating);
    const expected: WellbeingRating[] = [
      "excellent", "good", "satisfactory", "struggling", "crisis",
    ];
    for (const e of expected) {
      expect(ratings).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const w of WELLBEING_RATINGS) {
      expect(w.label[0]).toBe(w.label[0].toUpperCase());
    }
  });
});

describe("ACTION_PRIORITIES", () => {
  it("contains exactly 4 entries", () => {
    expect(ACTION_PRIORITIES).toHaveLength(4);
  });

  it("every entry has a non-empty priority string", () => {
    for (const a of ACTION_PRIORITIES) {
      expect(typeof a.priority).toBe("string");
      expect(a.priority.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const a of ACTION_PRIORITIES) {
      expect(typeof a.label).toBe("string");
      expect(a.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate priorities", () => {
    const priorities = ACTION_PRIORITIES.map((a) => a.priority);
    expect(new Set(priorities).size).toBe(priorities.length);
  });

  it("has no duplicate labels", () => {
    const labels = ACTION_PRIORITIES.map((a) => a.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected priorities", () => {
    const priorities = ACTION_PRIORITIES.map((a) => a.priority);
    const expected: ActionPriority[] = ["urgent", "high", "medium", "low"];
    for (const e of expected) {
      expect(priorities).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const a of ACTION_PRIORITIES) {
      expect(a.label[0]).toBe(a.label[0].toUpperCase());
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeSupervisionSessionMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeSupervisionSessionMetrics", () => {
  // ── Empty sessions ──────────────────────────────────────────────────────

  describe("empty sessions", () => {
    it("returns total_sessions = 0", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.total_sessions).toBe(0);
    });

    it("returns staff_supervised = 0", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.staff_supervised).toBe(0);
    });

    it("returns supervision_coverage = 0 when totalStaff > 0", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.supervision_coverage).toBe(0);
    });

    it("returns supervision_coverage = 0 when totalStaff = 0", () => {
      const m = computeSupervisionSessionMetrics([], 0);
      expect(m.supervision_coverage).toBe(0);
    });

    it("returns completed_count = 0", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.completed_count).toBe(0);
    });

    it("returns cancelled_count = 0", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.cancelled_count).toBe(0);
    });

    it("returns overdue_count = 0", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.overdue_count).toBe(0);
    });

    it("returns completion_rate = 0", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.completion_rate).toBe(0);
    });

    it("returns average_duration = 0", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.average_duration).toBe(0);
    });

    it("returns safeguarding_discussed_rate = 0", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.safeguarding_discussed_rate).toBe(0);
    });

    it("returns reflective_practice_rate = 0", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.reflective_practice_rate).toBe(0);
    });

    it("returns training_needs_rate = 0", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.training_needs_rate).toBe(0);
    });

    it("returns signed_rate = 0", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.signed_rate).toBe(0);
    });

    it("returns total_actions_set = 0", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.total_actions_set).toBe(0);
    });

    it("returns total_actions_completed = 0", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.total_actions_completed).toBe(0);
    });

    it("returns action_completion_rate = 0", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.action_completion_rate).toBe(0);
    });

    it("returns wellbeing_concerns_count = 0", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.wellbeing_concerns_count).toBe(0);
    });

    it("returns struggling_or_crisis_count = 0", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.struggling_or_crisis_count).toBe(0);
    });

    it("returns empty by_supervision_type", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.by_supervision_type).toEqual({});
    });

    it("returns empty by_session_status", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.by_session_status).toEqual({});
    });

    it("returns empty by_wellbeing_rating", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.by_wellbeing_rating).toEqual({});
    });
  });

  // ── Single completed session ────────────────────────────────────────────

  describe("single completed session", () => {
    const sess = makeSession({
      staff_id: "s1",
      session_status: "completed",
      duration_minutes: 45,
      safeguarding_discussed: true,
      reflective_practice_included: true,
      training_needs_identified: true,
      signed_by_supervisee: true,
      actions_set: 5,
      actions_completed_from_last: 3,
      wellbeing_rating: "good",
      wellbeing_concerns_raised: false,
      supervision_type: "formal_scheduled",
    });

    it("returns total_sessions = 1", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.total_sessions).toBe(1);
    });

    it("returns staff_supervised = 1", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.staff_supervised).toBe(1);
    });

    it("calculates supervision_coverage correctly (1 of 4 = 25%)", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.supervision_coverage).toBe(25);
    });

    it("returns completed_count = 1", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.completed_count).toBe(1);
    });

    it("returns cancelled_count = 0", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.cancelled_count).toBe(0);
    });

    it("returns overdue_count = 0", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.overdue_count).toBe(0);
    });

    it("returns completion_rate = 100", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.completion_rate).toBe(100);
    });

    it("returns average_duration = 45", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.average_duration).toBe(45);
    });

    it("returns safeguarding_discussed_rate = 100", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.safeguarding_discussed_rate).toBe(100);
    });

    it("returns reflective_practice_rate = 100", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.reflective_practice_rate).toBe(100);
    });

    it("returns training_needs_rate = 100", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.training_needs_rate).toBe(100);
    });

    it("returns signed_rate = 100", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.signed_rate).toBe(100);
    });

    it("returns total_actions_set = 5", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.total_actions_set).toBe(5);
    });

    it("returns total_actions_completed = 3", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.total_actions_completed).toBe(3);
    });

    it("returns action_completion_rate = 60 (3/5)", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.action_completion_rate).toBe(60);
    });

    it("returns wellbeing_concerns_count = 0", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.wellbeing_concerns_count).toBe(0);
    });

    it("returns struggling_or_crisis_count = 0", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.struggling_or_crisis_count).toBe(0);
    });

    it("by_supervision_type has single entry for formal_scheduled", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.by_supervision_type).toEqual({ formal_scheduled: 1 });
    });

    it("by_session_status has single entry for completed", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.by_session_status).toEqual({ completed: 1 });
    });

    it("by_wellbeing_rating has single entry for good", () => {
      const m = computeSupervisionSessionMetrics([sess], 4);
      expect(m.by_wellbeing_rating).toEqual({ good: 1 });
    });
  });

  // ── Multiple sessions ──────────────────────────────────────────────────

  describe("multiple sessions", () => {
    const sessions = [
      makeSession({
        staff_id: "s1", session_status: "completed", duration_minutes: 60,
        safeguarding_discussed: true, reflective_practice_included: true,
        training_needs_identified: true, signed_by_supervisee: true,
        actions_set: 4, actions_completed_from_last: 3,
        wellbeing_rating: "excellent", wellbeing_concerns_raised: false,
        supervision_type: "formal_scheduled",
      }),
      makeSession({
        staff_id: "s2", session_status: "completed", duration_minutes: 45,
        safeguarding_discussed: false, reflective_practice_included: false,
        training_needs_identified: false, signed_by_supervisee: false,
        actions_set: 2, actions_completed_from_last: 1,
        wellbeing_rating: "struggling", wellbeing_concerns_raised: true,
        supervision_type: "clinical",
      }),
      makeSession({
        staff_id: "s3", session_status: "cancelled_by_supervisor",
        duration_minutes: 0,
        safeguarding_discussed: false, reflective_practice_included: false,
        training_needs_identified: false, signed_by_supervisee: false,
        actions_set: 0, actions_completed_from_last: 0,
        wellbeing_rating: "good", wellbeing_concerns_raised: false,
        supervision_type: "formal_scheduled",
      }),
      makeSession({
        staff_id: "s4", session_status: "cancelled_by_supervisee",
        duration_minutes: 0,
        safeguarding_discussed: false, reflective_practice_included: false,
        training_needs_identified: false, signed_by_supervisee: false,
        actions_set: 1, actions_completed_from_last: 0,
        wellbeing_rating: "satisfactory", wellbeing_concerns_raised: false,
        supervision_type: "peer",
      }),
      makeSession({
        staff_id: "s5", session_status: "overdue", duration_minutes: 0,
        safeguarding_discussed: false, reflective_practice_included: false,
        training_needs_identified: false, signed_by_supervisee: false,
        actions_set: 0, actions_completed_from_last: 0,
        wellbeing_rating: "crisis", wellbeing_concerns_raised: true,
        supervision_type: "management",
      }),
    ];

    it("returns total_sessions = 5", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.total_sessions).toBe(5);
    });

    it("returns staff_supervised = 5", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.staff_supervised).toBe(5);
    });

    it("calculates supervision_coverage correctly (5 of 8 = 62.5%)", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.supervision_coverage).toBe(62.5);
    });

    it("returns completed_count = 2", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.completed_count).toBe(2);
    });

    it("returns cancelled_count = 2 (supervisor + supervisee)", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.cancelled_count).toBe(2);
    });

    it("returns overdue_count = 1", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.overdue_count).toBe(1);
    });

    it("calculates completion_rate correctly (2/5 = 40%)", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.completion_rate).toBe(40);
    });

    it("calculates average_duration from completed only (60+45)/2 = 52.5", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.average_duration).toBe(52.5);
    });

    it("calculates safeguarding_discussed_rate from completed (1/2 = 50%)", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.safeguarding_discussed_rate).toBe(50);
    });

    it("calculates reflective_practice_rate from completed (1/2 = 50%)", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.reflective_practice_rate).toBe(50);
    });

    it("calculates training_needs_rate from completed (1/2 = 50%)", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.training_needs_rate).toBe(50);
    });

    it("calculates signed_rate from completed (1/2 = 50%)", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.signed_rate).toBe(50);
    });

    it("returns total_actions_set = 7 (sum across all sessions)", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.total_actions_set).toBe(7);
    });

    it("returns total_actions_completed = 4", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.total_actions_completed).toBe(4);
    });

    it("calculates action_completion_rate from total_actions_set (4/7)", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.action_completion_rate).toBe(Math.round((4 / 7) * 1000) / 10);
    });

    it("returns wellbeing_concerns_count = 2", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.wellbeing_concerns_count).toBe(2);
    });

    it("returns struggling_or_crisis_count = 2 (all sessions, not just completed)", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.struggling_or_crisis_count).toBe(2);
    });

    it("groups by_supervision_type correctly", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.by_supervision_type).toEqual({
        formal_scheduled: 2, clinical: 1, peer: 1, management: 1,
      });
    });

    it("groups by_session_status correctly", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.by_session_status).toEqual({
        completed: 2, cancelled_by_supervisor: 1,
        cancelled_by_supervisee: 1, overdue: 1,
      });
    });

    it("groups by_wellbeing_rating correctly", () => {
      const m = computeSupervisionSessionMetrics(sessions, 8);
      expect(m.by_wellbeing_rating).toEqual({
        excellent: 1, struggling: 1, good: 1, satisfactory: 1, crisis: 1,
      });
    });
  });

  // ── supervision_coverage edge cases ────────────────────────────────────

  describe("supervision_coverage edge cases", () => {
    it("returns 0 when totalStaff = 0", () => {
      const sess = [makeSession()];
      const m = computeSupervisionSessionMetrics(sess, 0);
      expect(m.supervision_coverage).toBe(0);
    });

    it("returns 100 when all staff supervised", () => {
      const sess = [
        makeSession({ staff_id: "s1" }),
        makeSession({ staff_id: "s2" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 2);
      expect(m.supervision_coverage).toBe(100);
    });

    it("deduplicates staff by staff_id", () => {
      const sess = [
        makeSession({ staff_id: "s1" }),
        makeSession({ staff_id: "s1" }),
        makeSession({ staff_id: "s1" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 3);
      expect(m.staff_supervised).toBe(1);
      expect(m.supervision_coverage).toBe(33.3);
    });

    it("rounds coverage to 1 decimal place (1 of 3 = 33.3%)", () => {
      const sess = [makeSession({ staff_id: "s1" })];
      const m = computeSupervisionSessionMetrics(sess, 3);
      expect(m.supervision_coverage).toBe(33.3);
    });

    it("rounds coverage correctly (2 of 3 = 66.7%)", () => {
      const sess = [
        makeSession({ staff_id: "s1" }),
        makeSession({ staff_id: "s2" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 3);
      expect(m.supervision_coverage).toBe(66.7);
    });
  });

  // ── completion_rate ─────────────────────────────────────────────────────

  describe("completion_rate", () => {
    it("returns 0 when no sessions", () => {
      const m = computeSupervisionSessionMetrics([], 5);
      expect(m.completion_rate).toBe(0);
    });

    it("returns 100 when all completed", () => {
      const sess = [
        makeSession({ session_status: "completed" }),
        makeSession({ session_status: "completed" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 2);
      expect(m.completion_rate).toBe(100);
    });

    it("returns 0 when none completed", () => {
      const sess = [
        makeSession({ session_status: "overdue" }),
        makeSession({ session_status: "scheduled" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 2);
      expect(m.completion_rate).toBe(0);
    });

    it("rounds correctly (1 of 3 = 33.3%)", () => {
      const sess = [
        makeSession({ session_status: "completed" }),
        makeSession({ session_status: "overdue" }),
        makeSession({ session_status: "scheduled" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 3);
      expect(m.completion_rate).toBe(33.3);
    });

    it("uses total sessions (not just completed) as denominator", () => {
      const sess = [
        makeSession({ session_status: "completed" }),
        makeSession({ session_status: "cancelled_by_supervisor" }),
        makeSession({ session_status: "cancelled_by_supervisee" }),
        makeSession({ session_status: "rescheduled" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 4);
      expect(m.completion_rate).toBe(25);
    });
  });

  // ── average_duration ────────────────────────────────────────────────────

  describe("average_duration", () => {
    it("returns 0 when no completed sessions", () => {
      const sess = [
        makeSession({ session_status: "overdue", duration_minutes: 60 }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 1);
      expect(m.average_duration).toBe(0);
    });

    it("returns the value itself for a single completed session", () => {
      const sess = [makeSession({ session_status: "completed", duration_minutes: 90 })];
      const m = computeSupervisionSessionMetrics(sess, 1);
      expect(m.average_duration).toBe(90);
    });

    it("only considers completed sessions for average", () => {
      const sess = [
        makeSession({ session_status: "completed", duration_minutes: 60 }),
        makeSession({ session_status: "cancelled_by_supervisor", duration_minutes: 30 }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 2);
      expect(m.average_duration).toBe(60);
    });

    it("rounds to 1 decimal place", () => {
      const sess = [
        makeSession({ session_status: "completed", duration_minutes: 40 }),
        makeSession({ session_status: "completed", duration_minutes: 50 }),
        makeSession({ session_status: "completed", duration_minutes: 60 }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 3);
      expect(m.average_duration).toBe(50);
    });

    it("rounds fractional averages correctly (70/3 = 23.3)", () => {
      const sess = [
        makeSession({ session_status: "completed", duration_minutes: 20 }),
        makeSession({ session_status: "completed", duration_minutes: 25 }),
        makeSession({ session_status: "completed", duration_minutes: 25 }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 3);
      expect(m.average_duration).toBe(23.3);
    });
  });

  // ── safeguarding_discussed_rate ─────────────────────────────────────────

  describe("safeguarding_discussed_rate", () => {
    it("returns 0 when no completed sessions", () => {
      const sess = [
        makeSession({ session_status: "overdue", safeguarding_discussed: true }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 1);
      expect(m.safeguarding_discussed_rate).toBe(0);
    });

    it("returns 100 when all completed discuss safeguarding", () => {
      const sess = [
        makeSession({ session_status: "completed", safeguarding_discussed: true }),
        makeSession({ session_status: "completed", safeguarding_discussed: true }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 2);
      expect(m.safeguarding_discussed_rate).toBe(100);
    });

    it("returns 0 when none discuss safeguarding", () => {
      const sess = [
        makeSession({ session_status: "completed", safeguarding_discussed: false }),
        makeSession({ session_status: "completed", safeguarding_discussed: false }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 2);
      expect(m.safeguarding_discussed_rate).toBe(0);
    });

    it("rounds correctly (1 of 3 = 33.3%)", () => {
      const sess = [
        makeSession({ session_status: "completed", safeguarding_discussed: true }),
        makeSession({ session_status: "completed", safeguarding_discussed: false }),
        makeSession({ session_status: "completed", safeguarding_discussed: false }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 3);
      expect(m.safeguarding_discussed_rate).toBe(33.3);
    });
  });

  // ── reflective_practice_rate ────────────────────────────────────────────

  describe("reflective_practice_rate", () => {
    it("returns 0 when no completed sessions", () => {
      const sess = [
        makeSession({ session_status: "scheduled", reflective_practice_included: true }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 1);
      expect(m.reflective_practice_rate).toBe(0);
    });

    it("returns 100 when all completed include reflective practice", () => {
      const sess = [
        makeSession({ session_status: "completed", reflective_practice_included: true }),
        makeSession({ session_status: "completed", reflective_practice_included: true }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 2);
      expect(m.reflective_practice_rate).toBe(100);
    });

    it("rounds correctly (2 of 3 = 66.7%)", () => {
      const sess = [
        makeSession({ session_status: "completed", reflective_practice_included: true }),
        makeSession({ session_status: "completed", reflective_practice_included: true }),
        makeSession({ session_status: "completed", reflective_practice_included: false }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 3);
      expect(m.reflective_practice_rate).toBe(66.7);
    });
  });

  // ── training_needs_rate ─────────────────────────────────────────────────

  describe("training_needs_rate", () => {
    it("returns 0 when no completed sessions", () => {
      const sess = [
        makeSession({ session_status: "rescheduled", training_needs_identified: true }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 1);
      expect(m.training_needs_rate).toBe(0);
    });

    it("returns 100 when all completed identify training needs", () => {
      const sess = [
        makeSession({ session_status: "completed", training_needs_identified: true }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 1);
      expect(m.training_needs_rate).toBe(100);
    });

    it("returns 0 when no completed sessions identify training needs", () => {
      const sess = [
        makeSession({ session_status: "completed", training_needs_identified: false }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 1);
      expect(m.training_needs_rate).toBe(0);
    });
  });

  // ── signed_rate ─────────────────────────────────────────────────────────

  describe("signed_rate", () => {
    it("returns 0 when no completed sessions", () => {
      const sess = [
        makeSession({ session_status: "overdue", signed_by_supervisee: true }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 1);
      expect(m.signed_rate).toBe(0);
    });

    it("returns 100 when all completed are signed", () => {
      const sess = [
        makeSession({ session_status: "completed", signed_by_supervisee: true }),
        makeSession({ session_status: "completed", signed_by_supervisee: true }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 2);
      expect(m.signed_rate).toBe(100);
    });

    it("returns 0 when none are signed", () => {
      const sess = [
        makeSession({ session_status: "completed", signed_by_supervisee: false }),
        makeSession({ session_status: "completed", signed_by_supervisee: false }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 2);
      expect(m.signed_rate).toBe(0);
    });

    it("rounds correctly (1 of 3 = 33.3%)", () => {
      const sess = [
        makeSession({ session_status: "completed", signed_by_supervisee: true }),
        makeSession({ session_status: "completed", signed_by_supervisee: false }),
        makeSession({ session_status: "completed", signed_by_supervisee: false }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 3);
      expect(m.signed_rate).toBe(33.3);
    });
  });

  // ── action_completion_rate ──────────────────────────────────────────────

  describe("action_completion_rate", () => {
    it("returns 0 when total_actions_set = 0", () => {
      const sess = [
        makeSession({ actions_set: 0, actions_completed_from_last: 0 }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 1);
      expect(m.action_completion_rate).toBe(0);
    });

    it("returns 100 when all actions completed", () => {
      const sess = [
        makeSession({ actions_set: 5, actions_completed_from_last: 5 }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 1);
      expect(m.action_completion_rate).toBe(100);
    });

    it("sums actions across ALL sessions (not just completed) for denominator", () => {
      const sess = [
        makeSession({ session_status: "completed", actions_set: 3, actions_completed_from_last: 2 }),
        makeSession({ session_status: "cancelled_by_supervisor", actions_set: 2, actions_completed_from_last: 0 }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 2);
      // total_actions_set = 5, total_actions_completed = 2
      expect(m.action_completion_rate).toBe(40);
    });

    it("rounds correctly (2/3)", () => {
      const sess = [
        makeSession({ actions_set: 3, actions_completed_from_last: 2 }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 1);
      expect(m.action_completion_rate).toBe(66.7);
    });
  });

  // ── wellbeing_concerns_count ────────────────────────────────────────────

  describe("wellbeing_concerns_count", () => {
    it("counts sessions where wellbeing_concerns_raised is true", () => {
      const sess = [
        makeSession({ wellbeing_concerns_raised: true }),
        makeSession({ wellbeing_concerns_raised: true }),
        makeSession({ wellbeing_concerns_raised: false }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 3);
      expect(m.wellbeing_concerns_count).toBe(2);
    });

    it("returns 0 when no concerns raised", () => {
      const sess = [
        makeSession({ wellbeing_concerns_raised: false }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 1);
      expect(m.wellbeing_concerns_count).toBe(0);
    });
  });

  // ── struggling_or_crisis_count ──────────────────────────────────────────

  describe("struggling_or_crisis_count", () => {
    it("counts struggling wellbeing_rating across all sessions", () => {
      const sess = [
        makeSession({ session_status: "completed", wellbeing_rating: "struggling" }),
        makeSession({ session_status: "overdue", wellbeing_rating: "struggling" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 2);
      expect(m.struggling_or_crisis_count).toBe(2);
    });

    it("counts crisis wellbeing_rating across all sessions", () => {
      const sess = [
        makeSession({ session_status: "completed", wellbeing_rating: "crisis" }),
        makeSession({ session_status: "cancelled_by_supervisor", wellbeing_rating: "crisis" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 2);
      expect(m.struggling_or_crisis_count).toBe(2);
    });

    it("counts mix of struggling and crisis", () => {
      const sess = [
        makeSession({ wellbeing_rating: "struggling" }),
        makeSession({ wellbeing_rating: "crisis" }),
        makeSession({ wellbeing_rating: "good" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 3);
      expect(m.struggling_or_crisis_count).toBe(2);
    });

    it("returns 0 when all ratings are good or better", () => {
      const sess = [
        makeSession({ wellbeing_rating: "excellent" }),
        makeSession({ wellbeing_rating: "good" }),
        makeSession({ wellbeing_rating: "satisfactory" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 3);
      expect(m.struggling_or_crisis_count).toBe(0);
    });
  });

  // ── cancelled_count ─────────────────────────────────────────────────────

  describe("cancelled_count", () => {
    it("sums cancelled_by_supervisor and cancelled_by_supervisee", () => {
      const sess = [
        makeSession({ session_status: "cancelled_by_supervisor" }),
        makeSession({ session_status: "cancelled_by_supervisee" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 2);
      expect(m.cancelled_count).toBe(2);
    });

    it("does not count rescheduled as cancelled", () => {
      const sess = [
        makeSession({ session_status: "rescheduled" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 1);
      expect(m.cancelled_count).toBe(0);
    });

    it("does not count scheduled as cancelled", () => {
      const sess = [
        makeSession({ session_status: "scheduled" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 1);
      expect(m.cancelled_count).toBe(0);
    });

    it("does not count overdue as cancelled", () => {
      const sess = [
        makeSession({ session_status: "overdue" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 1);
      expect(m.cancelled_count).toBe(0);
    });
  });

  // ── by_supervision_type ─────────────────────────────────────────────────

  describe("by_supervision_type", () => {
    it("groups multiple types correctly", () => {
      const sess = [
        makeSession({ supervision_type: "formal_scheduled" }),
        makeSession({ supervision_type: "formal_scheduled" }),
        makeSession({ supervision_type: "clinical" }),
        makeSession({ supervision_type: "peer" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 4);
      expect(m.by_supervision_type).toEqual({ formal_scheduled: 2, clinical: 1, peer: 1 });
    });

    it("handles all sessions with same type", () => {
      const sess = [
        makeSession({ supervision_type: "group" }),
        makeSession({ supervision_type: "group" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 2);
      expect(m.by_supervision_type).toEqual({ group: 2 });
    });
  });

  // ── by_session_status ───────────────────────────────────────────────────

  describe("by_session_status", () => {
    it("groups multiple statuses correctly", () => {
      const sess = [
        makeSession({ session_status: "completed" }),
        makeSession({ session_status: "completed" }),
        makeSession({ session_status: "overdue" }),
        makeSession({ session_status: "scheduled" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 4);
      expect(m.by_session_status).toEqual({ completed: 2, overdue: 1, scheduled: 1 });
    });

    it("handles all same status", () => {
      const sess = [
        makeSession({ session_status: "completed" }),
        makeSession({ session_status: "completed" }),
        makeSession({ session_status: "completed" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 3);
      expect(m.by_session_status).toEqual({ completed: 3 });
    });
  });

  // ── by_wellbeing_rating ─────────────────────────────────────────────────

  describe("by_wellbeing_rating", () => {
    it("groups multiple ratings correctly", () => {
      const sess = [
        makeSession({ wellbeing_rating: "excellent" }),
        makeSession({ wellbeing_rating: "good" }),
        makeSession({ wellbeing_rating: "good" }),
        makeSession({ wellbeing_rating: "crisis" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 4);
      expect(m.by_wellbeing_rating).toEqual({ excellent: 1, good: 2, crisis: 1 });
    });

    it("handles all same rating", () => {
      const sess = [
        makeSession({ wellbeing_rating: "satisfactory" }),
        makeSession({ wellbeing_rating: "satisfactory" }),
      ];
      const m = computeSupervisionSessionMetrics(sess, 2);
      expect(m.by_wellbeing_rating).toEqual({ satisfactory: 2 });
    });
  });

  // ── Return shape ──────────────────────────────────────────────────────────

  describe("return shape", () => {
    it("returns exactly 20 keys", () => {
      const m = computeSupervisionSessionMetrics([], 0);
      expect(Object.keys(m)).toHaveLength(20);
    });

    it("contains all expected keys", () => {
      const m = computeSupervisionSessionMetrics([], 0);
      const keys = Object.keys(m);
      const expected = [
        "total_sessions", "staff_supervised", "supervision_coverage",
        "completed_count", "cancelled_count", "overdue_count",
        "completion_rate", "average_duration", "safeguarding_discussed_rate",
        "reflective_practice_rate", "training_needs_rate", "signed_rate",
        "total_actions_set", "total_actions_completed", "action_completion_rate",
        "wellbeing_concerns_count", "struggling_or_crisis_count",
        "by_supervision_type", "by_session_status", "by_wellbeing_rating",
      ];
      for (const k of expected) {
        expect(keys).toContain(k);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// identifySupervisionSessionAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifySupervisionSessionAlerts", () => {
  // ── No alerts ─────────────────────────────────────────────────────────────

  describe("no alerts", () => {
    it("returns empty array when no sessions and no staff", () => {
      const alerts = identifySupervisionSessionAlerts([], 0);
      expect(alerts).toEqual([]);
    });

    it("returns empty array when all conditions are clean", () => {
      const sess = [
        makeSession({
          staff_id: "s1", session_status: "completed",
          wellbeing_rating: "good", safeguarding_discussed: true,
        }),
        makeSession({
          staff_id: "s2", session_status: "completed",
          wellbeing_rating: "excellent", safeguarding_discussed: true,
        }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 2);
      expect(alerts).toEqual([]);
    });

    it("returns empty array for single clean completed session with totalStaff=1", () => {
      const sess = [
        makeSession({
          staff_id: "s1", session_status: "completed",
          wellbeing_rating: "good", safeguarding_discussed: true,
        }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 1);
      expect(alerts).toEqual([]);
    });
  });

  // ── staff_crisis alert ────────────────────────────────────────────────────

  describe("staff_crisis alert", () => {
    it("fires when session_status=completed AND wellbeing_rating=crisis", () => {
      const sess = [
        makeSession({
          id: "s1", staff_name: "Alice",
          session_status: "completed", wellbeing_rating: "crisis",
        }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 1);
      const alert = alerts.find((a) => a.type === "staff_crisis");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const sess = [
        makeSession({
          id: "s1", staff_name: "Alice",
          session_status: "completed", wellbeing_rating: "crisis",
        }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 1);
      const alert = alerts.find((a) => a.type === "staff_crisis")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses session id as alert id", () => {
      const sess = [
        makeSession({
          id: "crisis-abc-123", staff_name: "Alice",
          session_status: "completed", wellbeing_rating: "crisis",
        }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 1);
      const alert = alerts.find((a) => a.type === "staff_crisis")!;
      expect(alert.id).toBe("crisis-abc-123");
    });

    it("includes staff_name in message", () => {
      const sess = [
        makeSession({
          id: "s1", staff_name: "Bob Johnson",
          session_status: "completed", wellbeing_rating: "crisis",
        }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 1);
      const alert = alerts.find((a) => a.type === "staff_crisis")!;
      expect(alert.message).toContain("Bob Johnson");
    });

    it("includes guidance about immediate support", () => {
      const sess = [
        makeSession({
          id: "s1", staff_name: "Alice",
          session_status: "completed", wellbeing_rating: "crisis",
        }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 1);
      const alert = alerts.find((a) => a.type === "staff_crisis")!;
      expect(alert.message).toContain("immediate support");
    });

    it("creates one alert per qualifying session", () => {
      const sess = [
        makeSession({ id: "s1", staff_name: "Alice", staff_id: "st1", session_status: "completed", wellbeing_rating: "crisis" }),
        makeSession({ id: "s2", staff_name: "Bob", staff_id: "st2", session_status: "completed", wellbeing_rating: "crisis" }),
        makeSession({ id: "s3", staff_name: "Charlie", staff_id: "st3", session_status: "completed", wellbeing_rating: "crisis" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 3);
      const crisisAlerts = alerts.filter((a) => a.type === "staff_crisis");
      expect(crisisAlerts).toHaveLength(3);
    });

    it("does NOT fire when wellbeing_rating=crisis but session_status is NOT completed", () => {
      const statuses: SessionStatus[] = [
        "scheduled", "cancelled_by_supervisor", "cancelled_by_supervisee",
        "rescheduled", "overdue",
      ];
      for (const status of statuses) {
        const sess = [
          makeSession({
            session_status: status, wellbeing_rating: "crisis",
          }),
        ];
        const alerts = identifySupervisionSessionAlerts(sess, 1);
        const alert = alerts.find((a) => a.type === "staff_crisis");
        expect(alert).toBeUndefined();
      }
    });

    it("does NOT fire for struggling (only crisis)", () => {
      const sess = [
        makeSession({
          session_status: "completed", wellbeing_rating: "struggling",
        }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 1);
      const alert = alerts.find((a) => a.type === "staff_crisis");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire for good rating", () => {
      const sess = [
        makeSession({
          session_status: "completed", wellbeing_rating: "good",
        }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 1);
      const alert = alerts.find((a) => a.type === "staff_crisis");
      expect(alert).toBeUndefined();
    });
  });

  // ── overdue_sessions alert ────────────────────────────────────────────────

  describe("overdue_sessions alert", () => {
    it("fires when overdue count >= 1", () => {
      const sess = [
        makeSession({ session_status: "overdue" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 1);
      const alert = alerts.find((a) => a.type === "overdue_sessions");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const sess = [
        makeSession({ session_status: "overdue" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 1);
      const alert = alerts.find((a) => a.type === "overdue_sessions")!;
      expect(alert.severity).toBe("high");
    });

    it("has id 'overdue_sessions'", () => {
      const sess = [
        makeSession({ session_status: "overdue" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 1);
      const alert = alerts.find((a) => a.type === "overdue_sessions")!;
      expect(alert.id).toBe("overdue_sessions");
    });

    it("uses singular 'session is' when count is 1", () => {
      const sess = [
        makeSession({ session_status: "overdue" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 1);
      const alert = alerts.find((a) => a.type === "overdue_sessions")!;
      expect(alert.message).toContain("session is");
    });

    it("uses plural 'sessions are' when count > 1", () => {
      const sess = [
        makeSession({ session_status: "overdue", staff_id: "s1" }),
        makeSession({ session_status: "overdue", staff_id: "s2" }),
        makeSession({ session_status: "overdue", staff_id: "s3" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 3);
      const alert = alerts.find((a) => a.type === "overdue_sessions")!;
      expect(alert.message).toContain("sessions are");
    });

    it("includes count in message", () => {
      const sess = [
        makeSession({ session_status: "overdue", staff_id: "s1" }),
        makeSession({ session_status: "overdue", staff_id: "s2" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 2);
      const alert = alerts.find((a) => a.type === "overdue_sessions")!;
      expect(alert.message).toContain("2");
    });

    it("references Reg 33 in message", () => {
      const sess = [
        makeSession({ session_status: "overdue" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 1);
      const alert = alerts.find((a) => a.type === "overdue_sessions")!;
      expect(alert.message).toContain("Reg 33");
    });

    it("does NOT fire when no sessions are overdue", () => {
      const sess = [
        makeSession({ session_status: "completed" }),
        makeSession({ session_status: "scheduled" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 2);
      const alert = alerts.find((a) => a.type === "overdue_sessions");
      expect(alert).toBeUndefined();
    });

    it("only produces one alert regardless of overdue count", () => {
      const sess = [
        makeSession({ session_status: "overdue", staff_id: "s1" }),
        makeSession({ session_status: "overdue", staff_id: "s2" }),
        makeSession({ session_status: "overdue", staff_id: "s3" }),
        makeSession({ session_status: "overdue", staff_id: "s4" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 4);
      const overdueAlerts = alerts.filter((a) => a.type === "overdue_sessions");
      expect(overdueAlerts).toHaveLength(1);
    });
  });

  // ── not_supervised alert ──────────────────────────────────────────────────

  describe("not_supervised alert", () => {
    it("fires when gap exists between totalStaff and supervised staff", () => {
      const sess = [makeSession({ staff_id: "s1" })];
      const alerts = identifySupervisionSessionAlerts(sess, 3);
      const alert = alerts.find((a) => a.type === "not_supervised");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const sess = [makeSession({ staff_id: "s1" })];
      const alerts = identifySupervisionSessionAlerts(sess, 3);
      const alert = alerts.find((a) => a.type === "not_supervised")!;
      expect(alert.severity).toBe("high");
    });

    it("has id 'not_supervised'", () => {
      const sess = [makeSession({ staff_id: "s1" })];
      const alerts = identifySupervisionSessionAlerts(sess, 3);
      const alert = alerts.find((a) => a.type === "not_supervised")!;
      expect(alert.id).toBe("not_supervised");
    });

    it("uses singular 'member has' when gap is 1", () => {
      const sess = [makeSession({ staff_id: "s1" })];
      const alerts = identifySupervisionSessionAlerts(sess, 2);
      const alert = alerts.find((a) => a.type === "not_supervised")!;
      expect(alert.message).toContain("member has");
    });

    it("uses plural 'members have' when gap > 1", () => {
      const sess = [makeSession({ staff_id: "s1" })];
      const alerts = identifySupervisionSessionAlerts(sess, 4);
      const alert = alerts.find((a) => a.type === "not_supervised")!;
      expect(alert.message).toContain("members have");
    });

    it("includes gap count in message", () => {
      const sess = [makeSession({ staff_id: "s1" })];
      const alerts = identifySupervisionSessionAlerts(sess, 6);
      const alert = alerts.find((a) => a.type === "not_supervised")!;
      expect(alert.message).toContain("5");
    });

    it("does NOT fire when all staff have sessions", () => {
      const sess = [
        makeSession({ staff_id: "s1" }),
        makeSession({ staff_id: "s2" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 2);
      const alert = alerts.find((a) => a.type === "not_supervised");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire when totalStaff is 0", () => {
      const alerts = identifySupervisionSessionAlerts([], 0);
      const alert = alerts.find((a) => a.type === "not_supervised");
      expect(alert).toBeUndefined();
    });

    it("fires when no sessions and totalStaff > 0", () => {
      const alerts = identifySupervisionSessionAlerts([], 5);
      const alert = alerts.find((a) => a.type === "not_supervised")!;
      expect(alert).toBeDefined();
      expect(alert.message).toContain("5");
    });

    it("deduplicates staff when same staff has multiple sessions", () => {
      const sess = [
        makeSession({ staff_id: "s1" }),
        makeSession({ staff_id: "s1" }),
        makeSession({ staff_id: "s1" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 3);
      const alert = alerts.find((a) => a.type === "not_supervised")!;
      expect(alert.message).toContain("2");
    });
  });

  // ── high_cancellation alert ───────────────────────────────────────────────

  describe("high_cancellation alert", () => {
    it("fires when sessions.length >= 4 AND cancelled/total > 0.3", () => {
      const sess = [
        makeSession({ session_status: "cancelled_by_supervisor", staff_id: "s1" }),
        makeSession({ session_status: "cancelled_by_supervisee", staff_id: "s2" }),
        makeSession({ session_status: "completed", staff_id: "s3" }),
        makeSession({ session_status: "completed", staff_id: "s4" }),
      ];
      // 2/4 = 0.5 > 0.3
      const alerts = identifySupervisionSessionAlerts(sess, 4);
      const alert = alerts.find((a) => a.type === "high_cancellation");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const sess = [
        makeSession({ session_status: "cancelled_by_supervisor", staff_id: "s1" }),
        makeSession({ session_status: "cancelled_by_supervisee", staff_id: "s2" }),
        makeSession({ session_status: "completed", staff_id: "s3" }),
        makeSession({ session_status: "completed", staff_id: "s4" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 4);
      const alert = alerts.find((a) => a.type === "high_cancellation")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id 'high_cancellation'", () => {
      const sess = [
        makeSession({ session_status: "cancelled_by_supervisor", staff_id: "s1" }),
        makeSession({ session_status: "cancelled_by_supervisee", staff_id: "s2" }),
        makeSession({ session_status: "completed", staff_id: "s3" }),
        makeSession({ session_status: "completed", staff_id: "s4" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 4);
      const alert = alerts.find((a) => a.type === "high_cancellation")!;
      expect(alert.id).toBe("high_cancellation");
    });

    it("includes cancelled count and total in message", () => {
      const sess = [
        makeSession({ session_status: "cancelled_by_supervisor", staff_id: "s1" }),
        makeSession({ session_status: "cancelled_by_supervisee", staff_id: "s2" }),
        makeSession({ session_status: "completed", staff_id: "s3" }),
        makeSession({ session_status: "completed", staff_id: "s4" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 4);
      const alert = alerts.find((a) => a.type === "high_cancellation")!;
      expect(alert.message).toContain("2/4");
    });

    it("includes percentage with Math.round in message", () => {
      const sess = [
        makeSession({ session_status: "cancelled_by_supervisor", staff_id: "s1" }),
        makeSession({ session_status: "cancelled_by_supervisee", staff_id: "s2" }),
        makeSession({ session_status: "completed", staff_id: "s3" }),
        makeSession({ session_status: "completed", staff_id: "s4" }),
      ];
      // 2/4 = 50%
      const alerts = identifySupervisionSessionAlerts(sess, 4);
      const alert = alerts.find((a) => a.type === "high_cancellation")!;
      expect(alert.message).toContain("50%");
    });

    it("rounds percentage correctly for non-round values", () => {
      const sess = [
        makeSession({ session_status: "cancelled_by_supervisor", staff_id: "s1" }),
        makeSession({ session_status: "cancelled_by_supervisee", staff_id: "s2" }),
        makeSession({ session_status: "completed", staff_id: "s3" }),
        makeSession({ session_status: "completed", staff_id: "s4" }),
        makeSession({ session_status: "completed", staff_id: "s5" }),
      ];
      // 2/5 = 40%
      const alerts = identifySupervisionSessionAlerts(sess, 5);
      const alert = alerts.find((a) => a.type === "high_cancellation")!;
      expect(alert.message).toContain("40%");
    });

    it("does NOT fire when sessions.length < 4", () => {
      const sess = [
        makeSession({ session_status: "cancelled_by_supervisor", staff_id: "s1" }),
        makeSession({ session_status: "cancelled_by_supervisee", staff_id: "s2" }),
        makeSession({ session_status: "completed", staff_id: "s3" }),
      ];
      // 3 sessions total < 4 threshold
      const alerts = identifySupervisionSessionAlerts(sess, 3);
      const alert = alerts.find((a) => a.type === "high_cancellation");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire when cancellation rate <= 0.3", () => {
      const sess = [
        makeSession({ session_status: "cancelled_by_supervisor", staff_id: "s1" }),
        makeSession({ session_status: "completed", staff_id: "s2" }),
        makeSession({ session_status: "completed", staff_id: "s3" }),
        makeSession({ session_status: "completed", staff_id: "s4" }),
      ];
      // 1/4 = 0.25 <= 0.3
      const alerts = identifySupervisionSessionAlerts(sess, 4);
      const alert = alerts.find((a) => a.type === "high_cancellation");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire at exact 0.3 boundary (> not >=)", () => {
      // Need exactly 30%: impossible with integers to get 0.3 exactly from small counts
      // 3/10 = 0.3 exactly
      const sess: SupervisionSession[] = [];
      for (let i = 0; i < 3; i++) {
        sess.push(makeSession({ session_status: "cancelled_by_supervisor", staff_id: `s${i}` }));
      }
      for (let i = 3; i < 10; i++) {
        sess.push(makeSession({ session_status: "completed", staff_id: `s${i}` }));
      }
      // 3/10 = 0.3, not > 0.3
      const alerts = identifySupervisionSessionAlerts(sess, 10);
      const alert = alerts.find((a) => a.type === "high_cancellation");
      expect(alert).toBeUndefined();
    });

    it("fires just above 0.3 boundary", () => {
      // 4/10 = 0.4 > 0.3
      const sess: SupervisionSession[] = [];
      for (let i = 0; i < 4; i++) {
        sess.push(makeSession({ session_status: "cancelled_by_supervisor", staff_id: `s${i}` }));
      }
      for (let i = 4; i < 10; i++) {
        sess.push(makeSession({ session_status: "completed", staff_id: `s${i}` }));
      }
      const alerts = identifySupervisionSessionAlerts(sess, 10);
      const alert = alerts.find((a) => a.type === "high_cancellation");
      expect(alert).toBeDefined();
    });

    it("fires at exactly 4 sessions with > 0.3 rate", () => {
      const sess = [
        makeSession({ session_status: "cancelled_by_supervisor", staff_id: "s1" }),
        makeSession({ session_status: "cancelled_by_supervisee", staff_id: "s2" }),
        makeSession({ session_status: "completed", staff_id: "s3" }),
        makeSession({ session_status: "completed", staff_id: "s4" }),
      ];
      // 2/4 = 0.5 > 0.3
      const alerts = identifySupervisionSessionAlerts(sess, 4);
      const alert = alerts.find((a) => a.type === "high_cancellation");
      expect(alert).toBeDefined();
    });
  });

  // ── safeguarding_not_discussed alert ──────────────────────────────────────

  describe("safeguarding_not_discussed alert", () => {
    it("fires when >= 3 completed sessions have !safeguarding_discussed", () => {
      const sess = [
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s1" }),
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s2" }),
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s3" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 3);
      const alert = alerts.find((a) => a.type === "safeguarding_not_discussed");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const sess = [
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s1" }),
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s2" }),
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s3" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 3);
      const alert = alerts.find((a) => a.type === "safeguarding_not_discussed")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id 'safeguarding_not_discussed'", () => {
      const sess = [
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s1" }),
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s2" }),
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s3" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 3);
      const alert = alerts.find((a) => a.type === "safeguarding_not_discussed")!;
      expect(alert.id).toBe("safeguarding_not_discussed");
    });

    it("includes count of sessions in message", () => {
      const sess = [
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s1" }),
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s2" }),
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s3" }),
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s4" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 4);
      const alert = alerts.find((a) => a.type === "safeguarding_not_discussed")!;
      expect(alert.message).toContain("4");
    });

    it("mentions standing agenda item in message", () => {
      const sess = [
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s1" }),
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s2" }),
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s3" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 3);
      const alert = alerts.find((a) => a.type === "safeguarding_not_discussed")!;
      expect(alert.message).toContain("standing agenda item");
    });

    it("does NOT fire when fewer than 3 completed sessions lack safeguarding discussion", () => {
      const sess = [
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s1" }),
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s2" }),
        makeSession({ session_status: "completed", safeguarding_discussed: true, staff_id: "s3" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 3);
      const alert = alerts.find((a) => a.type === "safeguarding_not_discussed");
      expect(alert).toBeUndefined();
    });

    it("only counts completed sessions (not cancelled/overdue)", () => {
      const sess = [
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s1" }),
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s2" }),
        makeSession({ session_status: "cancelled_by_supervisor", safeguarding_discussed: false, staff_id: "s3" }),
        makeSession({ session_status: "overdue", safeguarding_discussed: false, staff_id: "s4" }),
        makeSession({ session_status: "scheduled", safeguarding_discussed: false, staff_id: "s5" }),
      ];
      // Only 2 completed without safeguarding < 3 threshold
      const alerts = identifySupervisionSessionAlerts(sess, 5);
      const alert = alerts.find((a) => a.type === "safeguarding_not_discussed");
      expect(alert).toBeUndefined();
    });

    it("fires at exact threshold of 3", () => {
      const sess = [
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s1" }),
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s2" }),
        makeSession({ session_status: "completed", safeguarding_discussed: false, staff_id: "s3" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 3);
      const alert = alerts.find((a) => a.type === "safeguarding_not_discussed");
      expect(alert).toBeDefined();
    });

    it("does NOT fire when all completed sessions discuss safeguarding", () => {
      const sess = [
        makeSession({ session_status: "completed", safeguarding_discussed: true, staff_id: "s1" }),
        makeSession({ session_status: "completed", safeguarding_discussed: true, staff_id: "s2" }),
        makeSession({ session_status: "completed", safeguarding_discussed: true, staff_id: "s3" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 3);
      const alert = alerts.find((a) => a.type === "safeguarding_not_discussed");
      expect(alert).toBeUndefined();
    });
  });

  // ── Combined alerts ───────────────────────────────────────────────────────

  describe("combined alerts", () => {
    it("can return all 5 alert types simultaneously", () => {
      const sess = [
        // staff_crisis: completed + crisis
        makeSession({
          id: "s1", staff_id: "st1", staff_name: "Alice",
          session_status: "completed", wellbeing_rating: "crisis",
          safeguarding_discussed: false,
        }),
        // more completed without safeguarding for safeguarding_not_discussed
        makeSession({
          id: "s2", staff_id: "st2", staff_name: "Bob",
          session_status: "completed", wellbeing_rating: "good",
          safeguarding_discussed: false,
        }),
        makeSession({
          id: "s3", staff_id: "st3", staff_name: "Charlie",
          session_status: "completed", wellbeing_rating: "good",
          safeguarding_discussed: false,
        }),
        // overdue
        makeSession({
          id: "s4", staff_id: "st4",
          session_status: "overdue", wellbeing_rating: "good",
        }),
        // cancelled sessions for high_cancellation (need > 0.3 with >= 4)
        makeSession({
          id: "s5", staff_id: "st5",
          session_status: "cancelled_by_supervisor", wellbeing_rating: "good",
        }),
        makeSession({
          id: "s6", staff_id: "st6",
          session_status: "cancelled_by_supervisee", wellbeing_rating: "good",
        }),
      ];
      // 6 sessions, 2 cancelled = 2/6 = 0.333 > 0.3 => high_cancellation
      // totalStaff = 10, supervised = 6 => gap = 4 => not_supervised
      const alerts = identifySupervisionSessionAlerts(sess, 10);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("staff_crisis");
      expect(types).toContain("overdue_sessions");
      expect(types).toContain("not_supervised");
      expect(types).toContain("high_cancellation");
      expect(types).toContain("safeguarding_not_discussed");
    });

    it("returns correct total count when multiple alert types fire", () => {
      const sess = [
        makeSession({
          id: "s1", staff_id: "st1", staff_name: "Alice",
          session_status: "completed", wellbeing_rating: "crisis",
          safeguarding_discussed: false,
        }),
        makeSession({
          id: "s2", staff_id: "st2",
          session_status: "completed", wellbeing_rating: "good",
          safeguarding_discussed: false,
        }),
        makeSession({
          id: "s3", staff_id: "st3",
          session_status: "completed", wellbeing_rating: "good",
          safeguarding_discussed: false,
        }),
        makeSession({
          id: "s4", staff_id: "st4",
          session_status: "overdue", wellbeing_rating: "good",
        }),
        makeSession({
          id: "s5", staff_id: "st5",
          session_status: "cancelled_by_supervisor", wellbeing_rating: "good",
        }),
        makeSession({
          id: "s6", staff_id: "st6",
          session_status: "cancelled_by_supervisee", wellbeing_rating: "good",
        }),
      ];
      // staff_crisis(1) + overdue_sessions(1) + not_supervised(1) + high_cancellation(1) + safeguarding_not_discussed(1) = 5
      const alerts = identifySupervisionSessionAlerts(sess, 10);
      expect(alerts.length).toBe(5);
    });
  });

  // ── Alert structure ───────────────────────────────────────────────────────

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const sess = [
        makeSession({
          id: "s1", staff_name: "Alice", staff_id: "st1",
          session_status: "completed", wellbeing_rating: "crisis",
          safeguarding_discussed: false,
        }),
        makeSession({
          id: "s2", staff_id: "st2",
          session_status: "completed", safeguarding_discussed: false,
        }),
        makeSession({
          id: "s3", staff_id: "st3",
          session_status: "completed", safeguarding_discussed: false,
        }),
        makeSession({ id: "s4", staff_id: "st4", session_status: "overdue" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 8);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
        expect(typeof alert.type).toBe("string");
        expect(typeof alert.severity).toBe("string");
        expect(typeof alert.message).toBe("string");
        expect(typeof alert.id).toBe("string");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const sess = [
        makeSession({
          id: "s1", staff_name: "Alice", staff_id: "st1",
          session_status: "completed", wellbeing_rating: "crisis",
          safeguarding_discussed: false,
        }),
        makeSession({
          id: "s2", staff_id: "st2",
          session_status: "completed", safeguarding_discussed: false,
        }),
        makeSession({
          id: "s3", staff_id: "st3",
          session_status: "completed", safeguarding_discussed: false,
        }),
        makeSession({ id: "s4", staff_id: "st4", session_status: "overdue" }),
      ];
      const alerts = identifySupervisionSessionAlerts(sess, 8);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });
  });
});
