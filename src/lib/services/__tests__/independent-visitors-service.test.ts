// ══════════════════════════════════════════════════════════════════════════════
// CARA — INDEPENDENT VISITORS SERVICE TESTS
// Pure-function unit tests for IV metrics computation, alert identification,
// constant validation, and CRUD fallback behaviour (Supabase disabled).
// Children Act 1989 s23ZB (IV appointment duty), CHR 2015 Reg 44
// (independent person visiting children's homes), IRO Handbook 2010
// (IV provision review).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { todayStr } from "@/lib/utils";
import {
  _testing,
  ASSIGNMENT_REASONS,
  VISIT_FREQUENCIES,
  ASSIGNMENT_STATUSES,
  VISIT_TYPES,
  listAssignments,
  createAssignment,
  updateAssignment,
  listVisits,
  createVisit,
} from "../independent-visitors-service";

import type {
  IndependentVisitorAssignment,
  IndependentVisitorVisit,
} from "../independent-visitors-service";

const {
  computeIVMetrics,
  identifyIVAlerts,
} = _testing;

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

/** Build a minimal IndependentVisitorAssignment with sensible defaults. */
function makeAssignment(
  overrides: Partial<IndependentVisitorAssignment> = {},
): IndependentVisitorAssignment {
  return {
    id: "assign-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alice Smith",
    visitor_name: "John Visitor",
    visitor_organisation: null,
    visitor_contact: null,
    dbs_check_date: null,
    dbs_reference: null,
    assignment_date: daysAgo(30),
    assignment_reason: "child_request",
    visit_frequency: "monthly",
    last_visit_date: null,
    next_visit_due: null,
    status: "active",
    end_date: null,
    end_reason: null,
    notes: null,
    created_at: daysAgoISO(30),
    updated_at: daysAgoISO(30),
    ...overrides,
  };
}

/** Build a minimal IndependentVisitorVisit with sensible defaults. */
function makeVisit(
  overrides: Partial<IndependentVisitorVisit> = {},
): IndependentVisitorVisit {
  return {
    id: "visit-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alice Smith",
    assignment_id: "assign-1",
    visit_date: daysAgo(5),
    visit_duration_minutes: 60,
    visit_type: "in_person",
    visitor_name: "John Visitor",
    location: null,
    child_attended: true,
    child_views: null,
    topics_discussed: [],
    concerns_raised: false,
    concern_details: null,
    concerns_escalated: false,
    escalated_to: null,
    child_wishes_recorded: true,
    child_wishes: null,
    next_visit_date: null,
    notes: null,
    created_at: daysAgoISO(5),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("ASSIGNMENT_REASONS", () => {
  it("has exactly 6 reasons", () => {
    expect(ASSIGNMENT_REASONS).toHaveLength(6);
  });

  it("contains unique reason values", () => {
    const reasons = ASSIGNMENT_REASONS.map((r) => r.reason);
    expect(new Set(reasons).size).toBe(reasons.length);
  });

  it("contains unique label values", () => {
    const labels = ASSIGNMENT_REASONS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes no_contact_with_parent", () => {
    expect(ASSIGNMENT_REASONS.find((r) => r.reason === "no_contact_with_parent")).toBeDefined();
  });

  it("includes infrequent_contact", () => {
    expect(ASSIGNMENT_REASONS.find((r) => r.reason === "infrequent_contact")).toBeDefined();
  });

  it("includes child_request", () => {
    expect(ASSIGNMENT_REASONS.find((r) => r.reason === "child_request")).toBeDefined();
  });

  it("includes social_worker_recommendation", () => {
    expect(ASSIGNMENT_REASONS.find((r) => r.reason === "social_worker_recommendation")).toBeDefined();
  });

  it("includes lac_review_recommendation", () => {
    expect(ASSIGNMENT_REASONS.find((r) => r.reason === "lac_review_recommendation")).toBeDefined();
  });

  it("includes statutory_requirement", () => {
    expect(ASSIGNMENT_REASONS.find((r) => r.reason === "statutory_requirement")).toBeDefined();
  });

  it("every entry has both reason and label", () => {
    for (const entry of ASSIGNMENT_REASONS) {
      expect(entry.reason).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("VISIT_FREQUENCIES", () => {
  it("has exactly 4 frequencies", () => {
    expect(VISIT_FREQUENCIES).toHaveLength(4);
  });

  it("contains unique frequency values", () => {
    const frequencies = VISIT_FREQUENCIES.map((f) => f.frequency);
    expect(new Set(frequencies).size).toBe(frequencies.length);
  });

  it("contains unique label values", () => {
    const labels = VISIT_FREQUENCIES.map((f) => f.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes weekly", () => {
    expect(VISIT_FREQUENCIES.find((f) => f.frequency === "weekly")).toBeDefined();
  });

  it("includes fortnightly", () => {
    expect(VISIT_FREQUENCIES.find((f) => f.frequency === "fortnightly")).toBeDefined();
  });

  it("includes monthly", () => {
    expect(VISIT_FREQUENCIES.find((f) => f.frequency === "monthly")).toBeDefined();
  });

  it("includes six_weekly", () => {
    expect(VISIT_FREQUENCIES.find((f) => f.frequency === "six_weekly")).toBeDefined();
  });

  it("every entry has both frequency and label", () => {
    for (const entry of VISIT_FREQUENCIES) {
      expect(entry.frequency).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("ASSIGNMENT_STATUSES", () => {
  it("has exactly 4 statuses", () => {
    expect(ASSIGNMENT_STATUSES).toHaveLength(4);
  });

  it("contains unique status values", () => {
    const statuses = ASSIGNMENT_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("contains unique label values", () => {
    const labels = ASSIGNMENT_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes pending", () => {
    expect(ASSIGNMENT_STATUSES.find((s) => s.status === "pending")).toBeDefined();
  });

  it("includes active", () => {
    expect(ASSIGNMENT_STATUSES.find((s) => s.status === "active")).toBeDefined();
  });

  it("includes paused", () => {
    expect(ASSIGNMENT_STATUSES.find((s) => s.status === "paused")).toBeDefined();
  });

  it("includes ended", () => {
    expect(ASSIGNMENT_STATUSES.find((s) => s.status === "ended")).toBeDefined();
  });

  it("every entry has both status and label", () => {
    for (const entry of ASSIGNMENT_STATUSES) {
      expect(entry.status).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

describe("VISIT_TYPES", () => {
  it("has exactly 5 types", () => {
    expect(VISIT_TYPES).toHaveLength(5);
  });

  it("contains unique type values", () => {
    const types = VISIT_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("contains unique label values", () => {
    const labels = VISIT_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes in_person", () => {
    expect(VISIT_TYPES.find((t) => t.type === "in_person")).toBeDefined();
  });

  it("includes phone_call", () => {
    expect(VISIT_TYPES.find((t) => t.type === "phone_call")).toBeDefined();
  });

  it("includes video_call", () => {
    expect(VISIT_TYPES.find((t) => t.type === "video_call")).toBeDefined();
  });

  it("includes activity_outing", () => {
    expect(VISIT_TYPES.find((t) => t.type === "activity_outing")).toBeDefined();
  });

  it("includes letter", () => {
    expect(VISIT_TYPES.find((t) => t.type === "letter")).toBeDefined();
  });

  it("every entry has both type and label", () => {
    for (const entry of VISIT_TYPES) {
      expect(entry.type).toBeTruthy();
      expect(entry.label).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// computeIVMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeIVMetrics", () => {
  // ── Empty inputs ─────────────────────────────────────────────────────

  it("returns zeroed metrics for empty arrays", () => {
    const m = computeIVMetrics([], []);
    expect(m.children_with_iv).toBe(0);
    expect(m.active_assignments).toBe(0);
    expect(m.overdue_visits).toBe(0);
    expect(m.visits_this_quarter).toBe(0);
    expect(m.avg_visit_duration).toBeNull();;
    expect(m.child_attendance_rate).toBeNull();;
    expect(m.concerns_raised_count).toBe(0);
    expect(m.by_visit_type).toEqual({});
    expect(m.by_assignment_reason).toEqual({});
  });

  it("returns empty by_visit_type when no visits provided", () => {
    const m = computeIVMetrics([makeAssignment()], []);
    expect(m.by_visit_type).toEqual({});
  });

  it("returns empty by_assignment_reason when no assignments provided", () => {
    const m = computeIVMetrics([], [makeVisit()]);
    expect(m.by_assignment_reason).toEqual({});
  });

  // ── children_with_iv ─────────────────────────────────────────────────

  it("counts unique child_ids from active assignments only", () => {
    const assignments = [
      makeAssignment({ id: "a1", child_id: "c1", status: "active" }),
      makeAssignment({ id: "a2", child_id: "c2", status: "active" }),
      makeAssignment({ id: "a3", child_id: "c3", status: "ended" }),
      makeAssignment({ id: "a4", child_id: "c4", status: "pending" }),
    ];
    const m = computeIVMetrics(assignments, []);
    expect(m.children_with_iv).toBe(2);
  });

  it("deduplicates children with multiple active assignments", () => {
    const assignments = [
      makeAssignment({ id: "a1", child_id: "c1", status: "active" }),
      makeAssignment({ id: "a2", child_id: "c1", status: "active" }),
    ];
    const m = computeIVMetrics(assignments, []);
    expect(m.children_with_iv).toBe(1);
  });

  it("returns 0 children_with_iv when all assignments are ended", () => {
    const assignments = [
      makeAssignment({ id: "a1", status: "ended" }),
      makeAssignment({ id: "a2", status: "ended" }),
    ];
    const m = computeIVMetrics(assignments, []);
    expect(m.children_with_iv).toBe(0);
  });

  it("returns 0 children_with_iv when all assignments are paused", () => {
    const assignments = [
      makeAssignment({ id: "a1", status: "paused" }),
    ];
    const m = computeIVMetrics(assignments, []);
    expect(m.children_with_iv).toBe(0);
  });

  // ── active_assignments ───────────────────────────────────────────────

  it("counts only active assignments", () => {
    const assignments = [
      makeAssignment({ id: "a1", status: "active" }),
      makeAssignment({ id: "a2", status: "active" }),
      makeAssignment({ id: "a3", status: "pending" }),
      makeAssignment({ id: "a4", status: "ended" }),
      makeAssignment({ id: "a5", status: "paused" }),
    ];
    const m = computeIVMetrics(assignments, []);
    expect(m.active_assignments).toBe(2);
  });

  it("returns 0 active_assignments when no assignments are active", () => {
    const assignments = [
      makeAssignment({ id: "a1", status: "pending" }),
      makeAssignment({ id: "a2", status: "ended" }),
    ];
    const m = computeIVMetrics(assignments, []);
    expect(m.active_assignments).toBe(0);
  });

  it("returns single active assignment for single active assignment input", () => {
    const assignments = [makeAssignment({ status: "active" })];
    const m = computeIVMetrics(assignments, []);
    expect(m.active_assignments).toBe(1);
  });

  // ── overdue_visits ───────────────────────────────────────────────────

  it("counts active assignments where next_visit_due is in the past", () => {
    const assignments = [
      makeAssignment({ id: "a1", status: "active", next_visit_due: daysAgo(5) }),
      makeAssignment({ id: "a2", status: "active", next_visit_due: daysAgo(1) }),
      makeAssignment({ id: "a3", status: "active", next_visit_due: daysFromNow(5) }),
    ];
    const m = computeIVMetrics(assignments, []);
    expect(m.overdue_visits).toBe(2);
  });

  it("does not count ended assignments as overdue even if next_visit_due is past", () => {
    const assignments = [
      makeAssignment({ id: "a1", status: "ended", next_visit_due: daysAgo(5) }),
    ];
    const m = computeIVMetrics(assignments, []);
    expect(m.overdue_visits).toBe(0);
  });

  it("does not count pending assignments as overdue", () => {
    const assignments = [
      makeAssignment({ id: "a1", status: "pending", next_visit_due: daysAgo(5) }),
    ];
    const m = computeIVMetrics(assignments, []);
    expect(m.overdue_visits).toBe(0);
  });

  it("returns 0 overdue when next_visit_due is null on active assignments", () => {
    const assignments = [
      makeAssignment({ id: "a1", status: "active", next_visit_due: null }),
    ];
    const m = computeIVMetrics(assignments, []);
    expect(m.overdue_visits).toBe(0);
  });

  it("does not count future next_visit_due as overdue", () => {
    const assignments = [
      makeAssignment({ id: "a1", status: "active", next_visit_due: daysFromNow(10) }),
    ];
    const m = computeIVMetrics(assignments, []);
    expect(m.overdue_visits).toBe(0);
  });

  // ── visits_this_quarter ──────────────────────────────────────────────

  it("counts visits with visit_date in the current quarter", () => {
    const now = new Date();
    const quarterStart = new Date(
      now.getFullYear(),
      Math.floor(now.getMonth() / 3) * 3,
      1,
    );
    const inQuarter = new Date(quarterStart.getTime() + 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const beforeQuarter = new Date(quarterStart.getTime() - 10 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const visits = [
      makeVisit({ id: "v1", visit_date: inQuarter }),
      makeVisit({ id: "v2", visit_date: daysAgo(1) }),
      makeVisit({ id: "v3", visit_date: beforeQuarter }),
    ];
    const m = computeIVMetrics([], visits);
    expect(m.visits_this_quarter).toBe(2);
  });

  it("returns 0 visits_this_quarter when all visits are from previous quarters", () => {
    const now = new Date();
    const quarterStart = new Date(
      now.getFullYear(),
      Math.floor(now.getMonth() / 3) * 3,
      1,
    );
    const beforeQuarter = new Date(quarterStart.getTime() - 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const visits = [
      makeVisit({ id: "v1", visit_date: beforeQuarter }),
    ];
    const m = computeIVMetrics([], visits);
    expect(m.visits_this_quarter).toBe(0);
  });

  it("counts today's visit as this quarter", () => {
    const visits = [makeVisit({ id: "v1", visit_date: daysAgo(0) })];
    const m = computeIVMetrics([], visits);
    expect(m.visits_this_quarter).toBe(1);
  });

  // ── avg_visit_duration ───────────────────────────────────────────────

  it("calculates average of non-null visit durations", () => {
    const visits = [
      makeVisit({ id: "v1", visit_duration_minutes: 60 }),
      makeVisit({ id: "v2", visit_duration_minutes: 90 }),
      makeVisit({ id: "v3", visit_duration_minutes: 30 }),
    ];
    const m = computeIVMetrics([], visits);
    expect(m.avg_visit_duration).toBe(60);
  });

  it("ignores null visit durations in average calculation", () => {
    const visits = [
      makeVisit({ id: "v1", visit_duration_minutes: 60 }),
      makeVisit({ id: "v2", visit_duration_minutes: null }),
      makeVisit({ id: "v3", visit_duration_minutes: 90 }),
    ];
    const m = computeIVMetrics([], visits);
    expect(m.avg_visit_duration).toBe(75);
  });

  it("returns 0 avg_visit_duration when all durations are null", () => {
    const visits = [
      makeVisit({ id: "v1", visit_duration_minutes: null }),
      makeVisit({ id: "v2", visit_duration_minutes: null }),
    ];
    const m = computeIVMetrics([], visits);
    expect(m.avg_visit_duration).toBeNull();;
  });

  it("returns 0 avg_visit_duration when no visits provided", () => {
    const m = computeIVMetrics([], []);
    expect(m.avg_visit_duration).toBeNull();;
  });

  it("rounds avg_visit_duration to 1 decimal place", () => {
    const visits = [
      makeVisit({ id: "v1", visit_duration_minutes: 45 }),
      makeVisit({ id: "v2", visit_duration_minutes: 50 }),
      makeVisit({ id: "v3", visit_duration_minutes: 55 }),
    ];
    const m = computeIVMetrics([], visits);
    expect(m.avg_visit_duration).toBe(50);
  });

  it("rounds fractional avg_visit_duration correctly", () => {
    const visits = [
      makeVisit({ id: "v1", visit_duration_minutes: 10 }),
      makeVisit({ id: "v2", visit_duration_minutes: 20 }),
      makeVisit({ id: "v3", visit_duration_minutes: 30 }),
    ];
    const m = computeIVMetrics([], visits);
    expect(m.avg_visit_duration).toBe(20);
  });

  it("handles single visit duration", () => {
    const visits = [makeVisit({ id: "v1", visit_duration_minutes: 45 })];
    const m = computeIVMetrics([], visits);
    expect(m.avg_visit_duration).toBe(45);
  });

  it("ignores zero-duration visits in average", () => {
    const visits = [
      makeVisit({ id: "v1", visit_duration_minutes: 0 }),
      makeVisit({ id: "v2", visit_duration_minutes: 60 }),
    ];
    const m = computeIVMetrics([], visits);
    expect(m.avg_visit_duration).toBe(60);
  });

  // ── child_attendance_rate ────────────────────────────────────────────

  it("calculates attendance rate as percentage", () => {
    const visits = [
      makeVisit({ id: "v1", child_attended: true }),
      makeVisit({ id: "v2", child_attended: true }),
      makeVisit({ id: "v3", child_attended: false }),
      makeVisit({ id: "v4", child_attended: true }),
    ];
    const m = computeIVMetrics([], visits);
    expect(m.child_attendance_rate).toBe(75);
  });

  it("returns 100 when all children attended", () => {
    const visits = [
      makeVisit({ id: "v1", child_attended: true }),
      makeVisit({ id: "v2", child_attended: true }),
    ];
    const m = computeIVMetrics([], visits);
    expect(m.child_attendance_rate).toBe(100);
  });

  it("returns 0 when no children attended", () => {
    const visits = [
      makeVisit({ id: "v1", child_attended: false }),
      makeVisit({ id: "v2", child_attended: false }),
    ];
    const m = computeIVMetrics([], visits);
    expect(m.child_attendance_rate).toBe(0);
  });

  it("returns 0 attendance rate when no visits provided", () => {
    const m = computeIVMetrics([], []);
    expect(m.child_attendance_rate).toBeNull();;
  });

  it("rounds attendance rate to 1 decimal place", () => {
    const visits = [
      makeVisit({ id: "v1", child_attended: true }),
      makeVisit({ id: "v2", child_attended: true }),
      makeVisit({ id: "v3", child_attended: false }),
    ];
    const m = computeIVMetrics([], visits);
    expect(m.child_attendance_rate).toBe(66.7);
  });

  it("handles single attended visit", () => {
    const visits = [makeVisit({ id: "v1", child_attended: true })];
    const m = computeIVMetrics([], visits);
    expect(m.child_attendance_rate).toBe(100);
  });

  it("handles single non-attended visit", () => {
    const visits = [makeVisit({ id: "v1", child_attended: false })];
    const m = computeIVMetrics([], visits);
    expect(m.child_attendance_rate).toBe(0);
  });

  // ── concerns_raised_count ────────────────────────────────────────────

  it("counts visits where concerns_raised is true", () => {
    const visits = [
      makeVisit({ id: "v1", concerns_raised: true }),
      makeVisit({ id: "v2", concerns_raised: false }),
      makeVisit({ id: "v3", concerns_raised: true }),
    ];
    const m = computeIVMetrics([], visits);
    expect(m.concerns_raised_count).toBe(2);
  });

  it("returns 0 concerns when no concerns raised", () => {
    const visits = [
      makeVisit({ id: "v1", concerns_raised: false }),
      makeVisit({ id: "v2", concerns_raised: false }),
    ];
    const m = computeIVMetrics([], visits);
    expect(m.concerns_raised_count).toBe(0);
  });

  it("returns 0 concerns when no visits provided", () => {
    const m = computeIVMetrics([], []);
    expect(m.concerns_raised_count).toBe(0);
  });

  it("counts all concerns when every visit has concerns", () => {
    const visits = [
      makeVisit({ id: "v1", concerns_raised: true }),
      makeVisit({ id: "v2", concerns_raised: true }),
      makeVisit({ id: "v3", concerns_raised: true }),
    ];
    const m = computeIVMetrics([], visits);
    expect(m.concerns_raised_count).toBe(3);
  });

  // ── by_visit_type ────────────────────────────────────────────────────

  it("groups visits by visit_type", () => {
    const visits = [
      makeVisit({ id: "v1", visit_type: "in_person" }),
      makeVisit({ id: "v2", visit_type: "in_person" }),
      makeVisit({ id: "v3", visit_type: "phone_call" }),
      makeVisit({ id: "v4", visit_type: "video_call" }),
    ];
    const m = computeIVMetrics([], visits);
    expect(m.by_visit_type).toEqual({
      in_person: 2,
      phone_call: 1,
      video_call: 1,
    });
  });

  it("returns single visit type when all visits are same type", () => {
    const visits = [
      makeVisit({ id: "v1", visit_type: "letter" }),
      makeVisit({ id: "v2", visit_type: "letter" }),
    ];
    const m = computeIVMetrics([], visits);
    expect(m.by_visit_type).toEqual({ letter: 2 });
  });

  it("handles all five visit types", () => {
    const visits = [
      makeVisit({ id: "v1", visit_type: "in_person" }),
      makeVisit({ id: "v2", visit_type: "phone_call" }),
      makeVisit({ id: "v3", visit_type: "video_call" }),
      makeVisit({ id: "v4", visit_type: "activity_outing" }),
      makeVisit({ id: "v5", visit_type: "letter" }),
    ];
    const m = computeIVMetrics([], visits);
    expect(m.by_visit_type).toEqual({
      in_person: 1,
      phone_call: 1,
      video_call: 1,
      activity_outing: 1,
      letter: 1,
    });
  });

  // ── by_assignment_reason ─────────────────────────────────────────────

  it("groups all assignments by assignment_reason", () => {
    const assignments = [
      makeAssignment({ id: "a1", assignment_reason: "child_request" }),
      makeAssignment({ id: "a2", assignment_reason: "child_request" }),
      makeAssignment({ id: "a3", assignment_reason: "statutory_requirement" }),
    ];
    const m = computeIVMetrics(assignments, []);
    expect(m.by_assignment_reason).toEqual({
      child_request: 2,
      statutory_requirement: 1,
    });
  });

  it("includes all statuses in by_assignment_reason (not just active)", () => {
    const assignments = [
      makeAssignment({ id: "a1", assignment_reason: "child_request", status: "active" }),
      makeAssignment({ id: "a2", assignment_reason: "child_request", status: "ended" }),
      makeAssignment({ id: "a3", assignment_reason: "infrequent_contact", status: "pending" }),
    ];
    const m = computeIVMetrics(assignments, []);
    expect(m.by_assignment_reason).toEqual({
      child_request: 2,
      infrequent_contact: 1,
    });
  });

  it("handles all six assignment reasons", () => {
    const assignments = [
      makeAssignment({ id: "a1", assignment_reason: "no_contact_with_parent" }),
      makeAssignment({ id: "a2", assignment_reason: "infrequent_contact" }),
      makeAssignment({ id: "a3", assignment_reason: "child_request" }),
      makeAssignment({ id: "a4", assignment_reason: "social_worker_recommendation" }),
      makeAssignment({ id: "a5", assignment_reason: "lac_review_recommendation" }),
      makeAssignment({ id: "a6", assignment_reason: "statutory_requirement" }),
    ];
    const m = computeIVMetrics(assignments, []);
    expect(m.by_assignment_reason).toEqual({
      no_contact_with_parent: 1,
      infrequent_contact: 1,
      child_request: 1,
      social_worker_recommendation: 1,
      lac_review_recommendation: 1,
      statutory_requirement: 1,
    });
  });

  // ── Mixed statuses ───────────────────────────────────────────────────

  it("correctly computes metrics with mixed assignment statuses", () => {
    const assignments = [
      makeAssignment({ id: "a1", child_id: "c1", status: "active", next_visit_due: daysAgo(3) }),
      makeAssignment({ id: "a2", child_id: "c2", status: "active", next_visit_due: daysFromNow(10) }),
      makeAssignment({ id: "a3", child_id: "c3", status: "pending" }),
      makeAssignment({ id: "a4", child_id: "c4", status: "ended" }),
      makeAssignment({ id: "a5", child_id: "c5", status: "paused" }),
    ];
    const visits = [
      makeVisit({ id: "v1", child_attended: true, concerns_raised: false, visit_duration_minutes: 60 }),
      makeVisit({ id: "v2", child_attended: false, concerns_raised: true, visit_duration_minutes: 30 }),
    ];
    const m = computeIVMetrics(assignments, visits);
    expect(m.children_with_iv).toBe(2);
    expect(m.active_assignments).toBe(2);
    expect(m.overdue_visits).toBe(1);
    expect(m.avg_visit_duration).toBe(45);
    expect(m.child_attendance_rate).toBe(50);
    expect(m.concerns_raised_count).toBe(1);
  });

  it("handles large number of assignments and visits", () => {
    const assignments = Array.from({ length: 20 }, (_, i) =>
      makeAssignment({
        id: `a${i}`,
        child_id: `c${i}`,
        status: i % 2 === 0 ? "active" : "ended",
        assignment_reason: i % 2 === 0 ? "child_request" : "statutory_requirement",
      }),
    );
    const visits = Array.from({ length: 30 }, (_, i) =>
      makeVisit({
        id: `v${i}`,
        visit_type: i % 3 === 0 ? "in_person" : "phone_call",
        child_attended: i % 4 !== 0,
        visit_duration_minutes: 30 + (i % 5) * 10,
      }),
    );
    const m = computeIVMetrics(assignments, visits);
    expect(m.children_with_iv).toBe(10);
    expect(m.active_assignments).toBe(10);
    expect(m.by_assignment_reason).toEqual({
      child_request: 10,
      statutory_requirement: 10,
    });
    expect(m.concerns_raised_count).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// identifyIVAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyIVAlerts", () => {
  const now = new Date("2026-06-15T12:00:00Z");

  // ── No alerts ────────────────────────────────────────────────────────

  it("returns empty array when given empty inputs", () => {
    const alerts = identifyIVAlerts([], [], now);
    expect(alerts).toEqual([]);
  });

  it("returns no alerts for a clean active assignment with recent visit", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        next_visit_due: "2026-07-01",
        dbs_check_date: "2026-01-01",
        assignment_date: "2026-01-01",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "assign-1",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
        concerns_raised: false,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    expect(alerts).toEqual([]);
  });

  it("returns no alerts for ended assignment with reason", () => {
    const assignments = [
      makeAssignment({
        status: "ended",
        end_reason: "Child moved placement",
        dbs_check_date: "2026-01-01",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    expect(alerts).toEqual([]);
  });

  // ── visit_overdue ────────────────────────────────────────────────────

  it("raises visit_overdue alert for active assignment with past next_visit_due", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        next_visit_due: "2026-06-01",
        dbs_check_date: "2026-01-01",
        assignment_date: "2026-01-01",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "assign-1",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const overdue = alerts.filter((a) => a.category === "visit_overdue");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].severity).toBe("high");
    expect(overdue[0].related_type).toBe("assignment");
    expect(overdue[0].related_id).toBe("assign-1");
  });

  it("includes days overdue in visit_overdue message", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        next_visit_due: "2026-06-01",
        dbs_check_date: "2026-01-01",
        assignment_date: "2026-01-01",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "assign-1",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const overdue = alerts.find((a) => a.category === "visit_overdue");
    expect(overdue?.message).toMatch(/\d+ days overdue/);
  });

  it("does not raise visit_overdue for pending assignments", () => {
    const assignments = [
      makeAssignment({
        status: "pending",
        next_visit_due: "2026-06-01",
        dbs_check_date: "2026-01-01",
        assignment_date: "2026-06-10",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    const overdue = alerts.filter((a) => a.category === "visit_overdue");
    expect(overdue).toHaveLength(0);
  });

  it("does not raise visit_overdue for ended assignments", () => {
    const assignments = [
      makeAssignment({
        status: "ended",
        next_visit_due: "2026-06-01",
        end_reason: "Completed",
        dbs_check_date: "2026-01-01",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    const overdue = alerts.filter((a) => a.category === "visit_overdue");
    expect(overdue).toHaveLength(0);
  });

  it("does not raise visit_overdue when next_visit_due is in the future", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        next_visit_due: "2026-07-01",
        dbs_check_date: "2026-01-01",
        assignment_date: "2026-01-01",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "assign-1",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const overdue = alerts.filter((a) => a.category === "visit_overdue");
    expect(overdue).toHaveLength(0);
  });

  it("does not raise visit_overdue when next_visit_due is null", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        next_visit_due: null,
        dbs_check_date: "2026-01-01",
        assignment_date: "2026-01-01",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "assign-1",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const overdue = alerts.filter((a) => a.category === "visit_overdue");
    expect(overdue).toHaveLength(0);
  });

  // ── assignment_pending_too_long ──────────────────────────────────────

  it("raises assignment_pending_too_long for pending > 14 days", () => {
    const assignments = [
      makeAssignment({
        status: "pending",
        assignment_date: "2026-05-01",
        dbs_check_date: "2026-01-01",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    const pending = alerts.filter((a) => a.category === "assignment_pending_too_long");
    expect(pending).toHaveLength(1);
    expect(pending[0].severity).toBe("high");
    expect(pending[0].related_type).toBe("assignment");
  });

  it("includes days pending in assignment_pending_too_long message", () => {
    const assignments = [
      makeAssignment({
        status: "pending",
        assignment_date: "2026-05-01",
        dbs_check_date: "2026-01-01",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    const pending = alerts.find((a) => a.category === "assignment_pending_too_long");
    expect(pending?.message).toMatch(/\d+ days/);
  });

  it("does not raise pending alert for recently created pending assignment", () => {
    const assignments = [
      makeAssignment({
        status: "pending",
        assignment_date: "2026-06-10",
        dbs_check_date: "2026-01-01",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    const pending = alerts.filter((a) => a.category === "assignment_pending_too_long");
    expect(pending).toHaveLength(0);
  });

  it("does not raise pending alert for active assignments", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        assignment_date: "2026-01-01",
        dbs_check_date: "2026-01-01",
        next_visit_due: "2026-07-01",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "assign-1",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const pending = alerts.filter((a) => a.category === "assignment_pending_too_long");
    expect(pending).toHaveLength(0);
  });

  it("raises pending alert at exactly 15 days", () => {
    const assignments = [
      makeAssignment({
        status: "pending",
        assignment_date: "2026-05-31",
        dbs_check_date: "2026-01-01",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    const pending = alerts.filter((a) => a.category === "assignment_pending_too_long");
    expect(pending).toHaveLength(1);
  });

  // ── dbs_missing ──────────────────────────────────────────────────────

  it("raises dbs_missing for active assignment with no dbs_check_date", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        dbs_check_date: null,
        assignment_date: "2026-06-10",
        next_visit_due: "2026-07-01",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "assign-1",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const dbs = alerts.filter((a) => a.category === "dbs_missing");
    expect(dbs).toHaveLength(1);
    expect(dbs[0].severity).toBe("critical");
    expect(dbs[0].related_type).toBe("assignment");
  });

  it("raises dbs_missing for pending assignment with no dbs_check_date", () => {
    const assignments = [
      makeAssignment({
        status: "pending",
        dbs_check_date: null,
        assignment_date: "2026-06-10",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    const dbs = alerts.filter((a) => a.category === "dbs_missing");
    expect(dbs).toHaveLength(1);
    expect(dbs[0].severity).toBe("critical");
  });

  it("does not raise dbs_missing for ended assignment", () => {
    const assignments = [
      makeAssignment({
        status: "ended",
        dbs_check_date: null,
        end_reason: "Completed",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    const dbs = alerts.filter((a) => a.category === "dbs_missing");
    expect(dbs).toHaveLength(0);
  });

  it("does not raise dbs_missing for paused assignment", () => {
    const assignments = [
      makeAssignment({
        status: "paused",
        dbs_check_date: null,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    const dbs = alerts.filter((a) => a.category === "dbs_missing");
    expect(dbs).toHaveLength(0);
  });

  it("does not raise dbs_missing when dbs_check_date is present", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        dbs_check_date: "2026-01-01",
        assignment_date: "2026-06-10",
        next_visit_due: "2026-07-01",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "assign-1",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const dbs = alerts.filter((a) => a.category === "dbs_missing");
    expect(dbs).toHaveLength(0);
  });

  it("includes visitor name and child name in dbs_missing message", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        dbs_check_date: null,
        visitor_name: "Jane Doe",
        child_name: "Bobby Tables",
        assignment_date: "2026-06-10",
        next_visit_due: "2026-07-01",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "assign-1",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const dbs = alerts.find((a) => a.category === "dbs_missing");
    expect(dbs?.message).toContain("Jane Doe");
    expect(dbs?.message).toContain("Bobby Tables");
  });

  // ── dbs_expired ──────────────────────────────────────────────────────

  it("raises dbs_expired for active assignment with dbs_check_date > 1 year ago", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        dbs_check_date: "2025-01-01",
        assignment_date: "2026-01-01",
        next_visit_due: "2026-07-01",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "assign-1",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const dbs = alerts.filter((a) => a.category === "dbs_expired");
    expect(dbs).toHaveLength(1);
    expect(dbs[0].severity).toBe("critical");
    expect(dbs[0].related_type).toBe("assignment");
  });

  it("raises dbs_expired for pending assignment with expired DBS", () => {
    const assignments = [
      makeAssignment({
        status: "pending",
        dbs_check_date: "2024-06-01",
        assignment_date: "2026-06-10",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    const dbs = alerts.filter((a) => a.category === "dbs_expired");
    expect(dbs).toHaveLength(1);
    expect(dbs[0].severity).toBe("critical");
  });

  it("does not raise dbs_expired for recent DBS check", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        dbs_check_date: "2026-03-01",
        assignment_date: "2026-01-01",
        next_visit_due: "2026-07-01",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "assign-1",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const dbs = alerts.filter((a) => a.category === "dbs_expired");
    expect(dbs).toHaveLength(0);
  });

  it("does not raise dbs_expired for ended assignment", () => {
    const assignments = [
      makeAssignment({
        status: "ended",
        dbs_check_date: "2024-01-01",
        end_reason: "Done",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    const dbs = alerts.filter((a) => a.category === "dbs_expired");
    expect(dbs).toHaveLength(0);
  });

  it("includes months expired in dbs_expired message", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        dbs_check_date: "2025-01-01",
        assignment_date: "2026-01-01",
        next_visit_due: "2026-07-01",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "assign-1",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const dbs = alerts.find((a) => a.category === "dbs_expired");
    expect(dbs?.message).toMatch(/expired \d+ months ago/);
  });

  // ── no_visits_recorded ───────────────────────────────────────────────

  it("raises no_visits_recorded for active assignment > 60 days old with no visits", () => {
    const assignments = [
      makeAssignment({
        id: "a-no-visits",
        status: "active",
        assignment_date: "2026-03-01",
        dbs_check_date: "2026-01-01",
        next_visit_due: "2026-07-01",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    const noVisits = alerts.filter((a) => a.category === "no_visits_recorded");
    expect(noVisits).toHaveLength(1);
    expect(noVisits[0].severity).toBe("high");
    expect(noVisits[0].related_id).toBe("a-no-visits");
  });

  it("does not raise no_visits_recorded for recent assignment with no visits", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        assignment_date: "2026-06-01",
        dbs_check_date: "2026-01-01",
        next_visit_due: "2026-07-01",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    const noVisits = alerts.filter((a) => a.category === "no_visits_recorded");
    expect(noVisits).toHaveLength(0);
  });

  it("does not raise no_visits_recorded when visits exist for the assignment", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        assignment_date: "2026-03-01",
        dbs_check_date: "2026-01-01",
        next_visit_due: "2026-07-01",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "assign-1",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const noVisits = alerts.filter((a) => a.category === "no_visits_recorded");
    expect(noVisits).toHaveLength(0);
  });

  it("does not raise no_visits_recorded for ended assignment", () => {
    const assignments = [
      makeAssignment({
        status: "ended",
        assignment_date: "2026-01-01",
        dbs_check_date: "2026-01-01",
        end_reason: "Done",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    const noVisits = alerts.filter((a) => a.category === "no_visits_recorded");
    expect(noVisits).toHaveLength(0);
  });

  it("does not raise no_visits_recorded for pending assignment", () => {
    const assignments = [
      makeAssignment({
        status: "pending",
        assignment_date: "2026-03-01",
        dbs_check_date: "2026-01-01",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    const noVisits = alerts.filter((a) => a.category === "no_visits_recorded");
    expect(noVisits).toHaveLength(0);
  });

  it("includes assignment date in no_visits_recorded message", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        assignment_date: "2026-03-01",
        dbs_check_date: "2026-01-01",
        next_visit_due: "2026-07-01",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    const noVisits = alerts.find((a) => a.category === "no_visits_recorded");
    expect(noVisits?.message).toContain("2026-03-01");
  });

  // ── no_recent_visit ──────────────────────────────────────────────────

  it("raises no_recent_visit when latest visit > 60 days ago", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        assignment_date: "2026-01-01",
        dbs_check_date: "2026-01-01",
        next_visit_due: "2026-07-01",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "assign-1",
        visit_date: "2026-03-01",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const noRecent = alerts.filter((a) => a.category === "no_recent_visit");
    expect(noRecent).toHaveLength(1);
    expect(noRecent[0].severity).toBe("high");
    expect(noRecent[0].related_id).toBe("assign-1");
  });

  it("does not raise no_recent_visit when latest visit is within 60 days", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        assignment_date: "2026-01-01",
        dbs_check_date: "2026-01-01",
        next_visit_due: "2026-07-01",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "assign-1",
        visit_date: "2026-06-01",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const noRecent = alerts.filter((a) => a.category === "no_recent_visit");
    expect(noRecent).toHaveLength(0);
  });

  it("uses the most recent visit date when multiple visits exist", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        assignment_date: "2026-01-01",
        dbs_check_date: "2026-01-01",
        next_visit_due: "2026-07-01",
      }),
    ];
    const visits = [
      makeVisit({
        id: "v1",
        assignment_id: "assign-1",
        visit_date: "2026-02-01",
        child_attended: true,
        child_wishes_recorded: true,
      }),
      makeVisit({
        id: "v2",
        assignment_id: "assign-1",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const noRecent = alerts.filter((a) => a.category === "no_recent_visit");
    expect(noRecent).toHaveLength(0);
  });

  it("includes days since last visit in no_recent_visit message", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        assignment_date: "2026-01-01",
        dbs_check_date: "2026-01-01",
        next_visit_due: "2026-07-01",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "assign-1",
        visit_date: "2026-03-01",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const noRecent = alerts.find((a) => a.category === "no_recent_visit");
    expect(noRecent?.message).toMatch(/\d+ days/);
  });

  // ── ended_without_reason ─────────────────────────────────────────────

  it("raises ended_without_reason for ended assignment with no end_reason", () => {
    const assignments = [
      makeAssignment({
        status: "ended",
        end_reason: null,
        dbs_check_date: "2026-01-01",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    const ended = alerts.filter((a) => a.category === "ended_without_reason");
    expect(ended).toHaveLength(1);
    expect(ended[0].severity).toBe("medium");
    expect(ended[0].related_type).toBe("assignment");
  });

  it("does not raise ended_without_reason when end_reason is provided", () => {
    const assignments = [
      makeAssignment({
        status: "ended",
        end_reason: "Child moved to new placement",
        dbs_check_date: "2026-01-01",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    const ended = alerts.filter((a) => a.category === "ended_without_reason");
    expect(ended).toHaveLength(0);
  });

  it("does not raise ended_without_reason for active assignment", () => {
    const assignments = [
      makeAssignment({
        status: "active",
        end_reason: null,
        dbs_check_date: "2026-01-01",
        assignment_date: "2026-06-10",
        next_visit_due: "2026-07-01",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "assign-1",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const ended = alerts.filter((a) => a.category === "ended_without_reason");
    expect(ended).toHaveLength(0);
  });

  it("includes child name in ended_without_reason message", () => {
    const assignments = [
      makeAssignment({
        status: "ended",
        end_reason: null,
        child_name: "Charlie Brown",
        dbs_check_date: "2026-01-01",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, [], now);
    const ended = alerts.find((a) => a.category === "ended_without_reason");
    expect(ended?.message).toContain("Charlie Brown");
  });

  // ── concerns_not_escalated ───────────────────────────────────────────

  it("raises concerns_not_escalated when concerns raised but not escalated", () => {
    const visits = [
      makeVisit({
        concerns_raised: true,
        concerns_escalated: false,
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts([], visits, now);
    const concerns = alerts.filter((a) => a.category === "concerns_not_escalated");
    expect(concerns).toHaveLength(1);
    expect(concerns[0].severity).toBe("critical");
    expect(concerns[0].related_type).toBe("visit");
  });

  it("does not raise concerns_not_escalated when concerns are escalated", () => {
    const visits = [
      makeVisit({
        concerns_raised: true,
        concerns_escalated: true,
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts([], visits, now);
    const concerns = alerts.filter((a) => a.category === "concerns_not_escalated");
    expect(concerns).toHaveLength(0);
  });

  it("does not raise concerns_not_escalated when no concerns raised", () => {
    const visits = [
      makeVisit({
        concerns_raised: false,
        concerns_escalated: false,
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts([], visits, now);
    const concerns = alerts.filter((a) => a.category === "concerns_not_escalated");
    expect(concerns).toHaveLength(0);
  });

  it("raises multiple concerns_not_escalated for multiple visits with unescalated concerns", () => {
    const visits = [
      makeVisit({
        id: "v1",
        concerns_raised: true,
        concerns_escalated: false,
        child_attended: true,
        child_wishes_recorded: true,
      }),
      makeVisit({
        id: "v2",
        concerns_raised: true,
        concerns_escalated: false,
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts([], visits, now);
    const concerns = alerts.filter((a) => a.category === "concerns_not_escalated");
    expect(concerns).toHaveLength(2);
  });

  it("includes child name and visit date in concerns_not_escalated message", () => {
    const visits = [
      makeVisit({
        child_name: "Danny Dyer",
        visit_date: "2026-06-10",
        concerns_raised: true,
        concerns_escalated: false,
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts([], visits, now);
    const concern = alerts.find((a) => a.category === "concerns_not_escalated");
    expect(concern?.message).toContain("Danny Dyer");
    expect(concern?.message).toContain("2026-06-10");
  });

  // ── wishes_not_recorded ──────────────────────────────────────────────

  it("raises wishes_not_recorded when child attended but wishes not recorded", () => {
    const visits = [
      makeVisit({
        child_attended: true,
        child_wishes_recorded: false,
        concerns_raised: false,
      }),
    ];
    const alerts = identifyIVAlerts([], visits, now);
    const wishes = alerts.filter((a) => a.category === "wishes_not_recorded");
    expect(wishes).toHaveLength(1);
    expect(wishes[0].severity).toBe("medium");
    expect(wishes[0].related_type).toBe("visit");
  });

  it("does not raise wishes_not_recorded when wishes are recorded", () => {
    const visits = [
      makeVisit({
        child_attended: true,
        child_wishes_recorded: true,
        concerns_raised: false,
      }),
    ];
    const alerts = identifyIVAlerts([], visits, now);
    const wishes = alerts.filter((a) => a.category === "wishes_not_recorded");
    expect(wishes).toHaveLength(0);
  });

  it("does not raise wishes_not_recorded when child did not attend", () => {
    const visits = [
      makeVisit({
        child_attended: false,
        child_wishes_recorded: false,
        concerns_raised: false,
      }),
    ];
    const alerts = identifyIVAlerts([], visits, now);
    const wishes = alerts.filter((a) => a.category === "wishes_not_recorded");
    expect(wishes).toHaveLength(0);
  });

  it("includes child name in wishes_not_recorded message", () => {
    const visits = [
      makeVisit({
        child_name: "Eve Garcia",
        child_attended: true,
        child_wishes_recorded: false,
        concerns_raised: false,
      }),
    ];
    const alerts = identifyIVAlerts([], visits, now);
    const wishes = alerts.find((a) => a.category === "wishes_not_recorded");
    expect(wishes?.message).toContain("Eve Garcia");
  });

  it("raises wishes_not_recorded for each applicable visit", () => {
    const visits = [
      makeVisit({
        id: "v1",
        child_attended: true,
        child_wishes_recorded: false,
        concerns_raised: false,
      }),
      makeVisit({
        id: "v2",
        child_attended: true,
        child_wishes_recorded: false,
        concerns_raised: false,
      }),
      makeVisit({
        id: "v3",
        child_attended: true,
        child_wishes_recorded: true,
        concerns_raised: false,
      }),
    ];
    const alerts = identifyIVAlerts([], visits, now);
    const wishes = alerts.filter((a) => a.category === "wishes_not_recorded");
    expect(wishes).toHaveLength(2);
  });

  // ── child_not_attending ──────────────────────────────────────────────

  it("raises child_not_attending for 3 consecutive non-attended visits", () => {
    const visits = [
      makeVisit({ id: "v1", child_id: "c1", child_attended: false, visit_date: "2026-06-01", child_wishes_recorded: true, concerns_raised: false }),
      makeVisit({ id: "v2", child_id: "c1", child_attended: false, visit_date: "2026-06-05", child_wishes_recorded: true, concerns_raised: false }),
      makeVisit({ id: "v3", child_id: "c1", child_attended: false, visit_date: "2026-06-10", child_wishes_recorded: true, concerns_raised: false }),
    ];
    const alerts = identifyIVAlerts([], visits, now);
    const notAttending = alerts.filter((a) => a.category === "child_not_attending");
    expect(notAttending).toHaveLength(1);
    expect(notAttending[0].severity).toBe("medium");
    expect(notAttending[0].related_type).toBe("visit");
  });

  it("does not raise child_not_attending for fewer than 3 non-attended visits", () => {
    const visits = [
      makeVisit({ id: "v1", child_id: "c1", child_attended: false, visit_date: "2026-06-01", child_wishes_recorded: true, concerns_raised: false }),
      makeVisit({ id: "v2", child_id: "c1", child_attended: false, visit_date: "2026-06-05", child_wishes_recorded: true, concerns_raised: false }),
    ];
    const alerts = identifyIVAlerts([], visits, now);
    const notAttending = alerts.filter((a) => a.category === "child_not_attending");
    expect(notAttending).toHaveLength(0);
  });

  it("does not raise child_not_attending when most recent visit is attended", () => {
    const visits = [
      makeVisit({ id: "v1", child_id: "c1", child_attended: false, visit_date: "2026-06-01", child_wishes_recorded: true, concerns_raised: false }),
      makeVisit({ id: "v2", child_id: "c1", child_attended: false, visit_date: "2026-06-05", child_wishes_recorded: true, concerns_raised: false }),
      makeVisit({ id: "v3", child_id: "c1", child_attended: true, visit_date: "2026-06-10", child_wishes_recorded: true, concerns_raised: false }),
    ];
    const alerts = identifyIVAlerts([], visits, now);
    const notAttending = alerts.filter((a) => a.category === "child_not_attending");
    expect(notAttending).toHaveLength(0);
  });

  it("checks per child separately for child_not_attending", () => {
    const visits = [
      // Child c1: 3 consecutive non-attended
      makeVisit({ id: "v1", child_id: "c1", child_name: "Child A", child_attended: false, visit_date: "2026-06-01", child_wishes_recorded: true, concerns_raised: false }),
      makeVisit({ id: "v2", child_id: "c1", child_name: "Child A", child_attended: false, visit_date: "2026-06-05", child_wishes_recorded: true, concerns_raised: false }),
      makeVisit({ id: "v3", child_id: "c1", child_name: "Child A", child_attended: false, visit_date: "2026-06-10", child_wishes_recorded: true, concerns_raised: false }),
      // Child c2: only 1 non-attended
      makeVisit({ id: "v4", child_id: "c2", child_name: "Child B", child_attended: false, visit_date: "2026-06-01", child_wishes_recorded: true, concerns_raised: false }),
      makeVisit({ id: "v5", child_id: "c2", child_name: "Child B", child_attended: true, visit_date: "2026-06-05", child_wishes_recorded: true, concerns_raised: false }),
      makeVisit({ id: "v6", child_id: "c2", child_name: "Child B", child_attended: true, visit_date: "2026-06-10", child_wishes_recorded: true, concerns_raised: false }),
    ];
    const alerts = identifyIVAlerts([], visits, now);
    const notAttending = alerts.filter((a) => a.category === "child_not_attending");
    expect(notAttending).toHaveLength(1);
    expect(notAttending[0].message).toContain("Child A");
  });

  it("includes child name in child_not_attending message", () => {
    const visits = [
      makeVisit({ id: "v1", child_id: "c1", child_name: "Frank Fritz", child_attended: false, visit_date: "2026-06-01", child_wishes_recorded: true, concerns_raised: false }),
      makeVisit({ id: "v2", child_id: "c1", child_name: "Frank Fritz", child_attended: false, visit_date: "2026-06-05", child_wishes_recorded: true, concerns_raised: false }),
      makeVisit({ id: "v3", child_id: "c1", child_name: "Frank Fritz", child_attended: false, visit_date: "2026-06-10", child_wishes_recorded: true, concerns_raised: false }),
    ];
    const alerts = identifyIVAlerts([], visits, now);
    const notAttending = alerts.find((a) => a.category === "child_not_attending");
    expect(notAttending?.message).toContain("Frank Fritz");
  });

  it("uses the 3 most recent visits for child_not_attending check", () => {
    const visits = [
      makeVisit({ id: "v1", child_id: "c1", child_attended: false, visit_date: "2026-04-01", child_wishes_recorded: true, concerns_raised: false }),
      makeVisit({ id: "v2", child_id: "c1", child_attended: false, visit_date: "2026-04-15", child_wishes_recorded: true, concerns_raised: false }),
      makeVisit({ id: "v3", child_id: "c1", child_attended: true, visit_date: "2026-05-01", child_wishes_recorded: true, concerns_raised: false }),
      makeVisit({ id: "v4", child_id: "c1", child_attended: false, visit_date: "2026-06-01", child_wishes_recorded: true, concerns_raised: false }),
      makeVisit({ id: "v5", child_id: "c1", child_attended: false, visit_date: "2026-06-10", child_wishes_recorded: true, concerns_raised: false }),
    ];
    const alerts = identifyIVAlerts([], visits, now);
    const notAttending = alerts.filter((a) => a.category === "child_not_attending");
    // Most recent 3: v5 (not attended), v4 (not attended), v3 (attended) => not all non-attended
    expect(notAttending).toHaveLength(0);
  });

  // ── Multiple alerts combined ─────────────────────────────────────────

  it("raises multiple alert types simultaneously", () => {
    const assignments = [
      makeAssignment({
        id: "a1",
        status: "active",
        dbs_check_date: null,
        next_visit_due: "2026-06-01",
        assignment_date: "2026-03-01",
      }),
      makeAssignment({
        id: "a2",
        status: "ended",
        end_reason: null,
        dbs_check_date: "2026-01-01",
      }),
    ];
    const visits = [
      makeVisit({
        id: "v1",
        assignment_id: "a1",
        visit_date: "2026-03-01",
        concerns_raised: true,
        concerns_escalated: false,
        child_attended: true,
        child_wishes_recorded: false,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const categories = alerts.map((a) => a.category);
    expect(categories).toContain("visit_overdue");
    expect(categories).toContain("dbs_missing");
    expect(categories).toContain("no_recent_visit");
    expect(categories).toContain("ended_without_reason");
    expect(categories).toContain("concerns_not_escalated");
    expect(categories).toContain("wishes_not_recorded");
  });

  it("can raise both dbs_missing and visit_overdue for same assignment", () => {
    const assignments = [
      makeAssignment({
        id: "a1",
        status: "active",
        dbs_check_date: null,
        next_visit_due: "2026-06-01",
        assignment_date: "2026-06-10",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "a1",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const a1Alerts = alerts.filter((a) => a.related_id === "a1");
    const categories = a1Alerts.map((a) => a.category);
    expect(categories).toContain("visit_overdue");
    expect(categories).toContain("dbs_missing");
  });

  // ── Alert sorting ────────────────────────────────────────────────────

  it("sorts alerts with critical first, then high, then medium", () => {
    const assignments = [
      makeAssignment({
        id: "a1",
        status: "active",
        dbs_check_date: null,
        next_visit_due: "2026-06-01",
        assignment_date: "2026-06-10",
      }),
      makeAssignment({
        id: "a2",
        status: "ended",
        end_reason: null,
        dbs_check_date: "2026-01-01",
      }),
    ];
    const visits = [
      makeVisit({
        id: "v1",
        assignment_id: "a1",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    expect(alerts.length).toBeGreaterThan(1);

    // Verify ordering: all critical before high, all high before medium
    let seenHigh = false;
    let seenMedium = false;
    for (const alert of alerts) {
      if (alert.severity === "critical") {
        expect(seenHigh).toBe(false);
        expect(seenMedium).toBe(false);
      }
      if (alert.severity === "high") {
        seenHigh = true;
        expect(seenMedium).toBe(false);
      }
      if (alert.severity === "medium") {
        seenMedium = true;
      }
    }
  });

  it("critical alerts always appear before high alerts", () => {
    const assignments = [
      makeAssignment({
        id: "a1",
        status: "active",
        dbs_check_date: null,
        next_visit_due: "2026-06-01",
        assignment_date: "2026-06-10",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "a1",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const criticalIndex = alerts.findIndex((a) => a.severity === "critical");
    const highIndex = alerts.findIndex((a) => a.severity === "high");
    if (criticalIndex !== -1 && highIndex !== -1) {
      expect(criticalIndex).toBeLessThan(highIndex);
    }
  });

  it("high alerts always appear before medium alerts", () => {
    const assignments = [
      makeAssignment({
        id: "a1",
        status: "active",
        dbs_check_date: "2026-01-01",
        next_visit_due: "2026-06-01",
        assignment_date: "2026-06-10",
      }),
      makeAssignment({
        id: "a2",
        status: "ended",
        end_reason: null,
        dbs_check_date: "2026-01-01",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "a1",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const lastHigh = alerts.map((a, i) => ({ ...a, i })).filter((a) => a.severity === "high").pop();
    const firstMedium = alerts.map((a, i) => ({ ...a, i })).find((a) => a.severity === "medium");
    if (lastHigh && firstMedium) {
      expect(lastHigh.i).toBeLessThan(firstMedium.i);
    }
  });

  // ── Edge cases ───────────────────────────────────────────────────────

  it("handles assignment with visits from a different assignment_id", () => {
    const assignments = [
      makeAssignment({
        id: "a1",
        status: "active",
        assignment_date: "2026-03-01",
        dbs_check_date: "2026-01-01",
        next_visit_due: "2026-07-01",
      }),
    ];
    // Visit belongs to a different assignment
    const visits = [
      makeVisit({
        assignment_id: "a-other",
        visit_date: "2026-06-10",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    const noVisits = alerts.filter((a) => a.category === "no_visits_recorded");
    expect(noVisits).toHaveLength(1);
  });

  it("uses provided now parameter for all date comparisons", () => {
    const customNow = new Date("2026-08-01T12:00:00Z");
    const assignments = [
      makeAssignment({
        status: "active",
        next_visit_due: "2026-07-01",
        dbs_check_date: "2026-01-01",
        assignment_date: "2026-01-01",
      }),
    ];
    const visits = [
      makeVisit({
        assignment_id: "assign-1",
        visit_date: "2026-07-25",
        child_attended: true,
        child_wishes_recorded: true,
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, customNow);
    const overdue = alerts.filter((a) => a.category === "visit_overdue");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].message).toMatch(/\d+ days overdue/);
  });

  it("all alerts have required fields", () => {
    const assignments = [
      makeAssignment({
        id: "a1",
        status: "active",
        dbs_check_date: null,
        next_visit_due: "2026-06-01",
        assignment_date: "2026-03-01",
      }),
    ];
    const visits = [
      makeVisit({
        id: "v1",
        assignment_id: "a1",
        concerns_raised: true,
        concerns_escalated: false,
        child_attended: true,
        child_wishes_recorded: false,
        visit_date: "2026-03-01",
      }),
    ];
    const alerts = identifyIVAlerts(assignments, visits, now);
    for (const alert of alerts) {
      expect(alert.severity).toBeDefined();
      expect(alert.category).toBeDefined();
      expect(alert.message).toBeDefined();
      expect(alert.related_id).toBeDefined();
      expect(alert.related_type).toBeDefined();
      expect(["critical", "high", "medium", "low"]).toContain(alert.severity);
      expect(["assignment", "visit"]).toContain(alert.related_type);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CRUD — Supabase disabled fallback
// ═══════════════════════════════════════════════════════════════════════════

describe("listAssignments", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listAssignments("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of childId filter", async () => {
    const result = await listAssignments("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of status filter", async () => {
    const result = await listAssignments("home-1", { status: "active" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of assignmentReason filter", async () => {
    const result = await listAssignments("home-1", { assignmentReason: "child_request" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of limit filter", async () => {
    const result = await listAssignments("home-1", { limit: 25 });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of combined filters", async () => {
    const result = await listAssignments("home-1", {
      childId: "child-1",
      status: "pending",
      assignmentReason: "statutory_requirement",
      limit: 10,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createAssignment", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createAssignment({
      homeId: "home-1",
      childId: "child-1",
      childName: "Alice Smith",
      visitorName: "John Visitor",
      assignmentReason: "child_request",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error with all optional fields", async () => {
    const result = await createAssignment({
      homeId: "home-1",
      childId: "child-1",
      childName: "Alice Smith",
      visitorName: "John Visitor",
      visitorOrganisation: "IV Services Ltd",
      visitorContact: "john@example.com",
      dbsCheckDate: "2026-01-01",
      dbsReference: "DBS-12345",
      assignmentDate: "2026-05-01",
      assignmentReason: "statutory_requirement",
      visitFrequency: "fortnightly",
      nextVisitDue: "2026-06-01",
      notes: "Initial assignment",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error with minimal required fields", async () => {
    const result = await createAssignment({
      homeId: "home-1",
      childId: "child-1",
      childName: "Bob Brown",
      visitorName: "Jane Visitor",
      assignmentReason: "no_contact_with_parent",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

describe("updateAssignment", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await updateAssignment("assign-1", { status: "active" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error with multiple updates", async () => {
    const result = await updateAssignment("assign-1", {
      status: "ended",
      end_date: "2026-06-15",
      end_reason: "Child moved placement",
      notes: "Assignment concluded",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error with single field update", async () => {
    const result = await updateAssignment("assign-1", { next_visit_due: "2026-07-01" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

describe("listVisits", () => {
  it("returns ok: true with empty data array when Supabase is disabled", async () => {
    const result = await listVisits("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of childId filter", async () => {
    const result = await listVisits("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of assignmentId filter", async () => {
    const result = await listVisits("home-1", { assignmentId: "assign-1" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of visitType filter", async () => {
    const result = await listVisits("home-1", { visitType: "in_person" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of limit filter", async () => {
    const result = await listVisits("home-1", { limit: 50 });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("returns ok: true with empty data array regardless of combined filters", async () => {
    const result = await listVisits("home-1", {
      childId: "child-1",
      assignmentId: "assign-1",
      visitType: "phone_call",
      limit: 10,
    });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });
});

describe("createVisit", () => {
  it("returns ok: false with Supabase not configured error", async () => {
    const result = await createVisit({
      homeId: "home-1",
      childId: "child-1",
      childName: "Alice Smith",
      assignmentId: "assign-1",
      visitType: "in_person",
      visitorName: "John Visitor",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error with all optional fields", async () => {
    const result = await createVisit({
      homeId: "home-1",
      childId: "child-1",
      childName: "Alice Smith",
      assignmentId: "assign-1",
      visitDate: "2026-06-15",
      visitDurationMinutes: 90,
      visitType: "activity_outing",
      visitorName: "John Visitor",
      location: "Local park",
      childAttended: true,
      childViews: "Enjoyed the visit",
      topicsDiscussed: ["school", "hobbies"],
      concernsRaised: false,
      concernDetails: undefined,
      concernsEscalated: false,
      escalatedTo: undefined,
      childWishesRecorded: true,
      childWishes: "Wants to visit zoo next time",
      nextVisitDate: "2026-07-01",
      notes: "Good session",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  it("returns ok: false with Supabase not configured error with concern details", async () => {
    const result = await createVisit({
      homeId: "home-1",
      childId: "child-1",
      childName: "Alice Smith",
      assignmentId: "assign-1",
      visitType: "phone_call",
      visitorName: "John Visitor",
      concernsRaised: true,
      concernDetails: "Child expressed unhappiness",
      concernsEscalated: true,
      escalatedTo: "Social worker",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});
