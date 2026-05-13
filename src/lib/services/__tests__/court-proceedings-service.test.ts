// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — COURT PROCEEDINGS SERVICE TESTS
// Pure-function unit tests for court proceedings metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 38 (providing information to courts),
// Reg 8 (parental responsibility — court orders),
// Children Act 1989 (court involvement in care proceedings).
//
// SCCIF: Leadership & Management — "The home cooperates with courts
// and provides timely, accurate information."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  PROCEEDING_TYPES,
  PROCEEDING_STATUSES,
  HEARING_TYPES,
  STATEMENT_STATUSES,
  listProceedings,
  createProceeding,
  updateProceeding,
} from "../court-proceedings-service";

import type {
  CourtProceeding,
  ProceedingType,
  ProceedingStatus,
  HearingType,
  StatementStatus,
} from "../court-proceedings-service";

const { computeCourtMetrics, identifyCourtAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

/** Build a minimal CourtProceeding with sensible defaults. */
function makeProceeding(overrides: Partial<CourtProceeding> = {}): CourtProceeding {
  return {
    id: "cp-1",
    home_id: "home-1",
    child_name: "Alice Smith",
    child_id: "child-1",
    proceeding_type: "care_order",
    proceeding_status: "active",
    court_name: "Family Court",
    case_number: "FC-2025-001",
    start_date: "2025-06-01",
    next_hearing_date: "2025-07-01",
    next_hearing_type: "case_management",
    guardian_appointed: true,
    guardian_name: "Jane Guardian",
    solicitor_name: "John Solicitor",
    statement_status: "submitted",
    statement_deadline: "2025-06-20",
    la_social_worker: "Sarah SW",
    home_statement_required: true,
    home_statement_submitted: true,
    court_actions: ["file position statement"],
    child_views_sought: true,
    child_wishes_communicated: true,
    notes: null,
    created_at: "2025-06-01T10:00:00.000Z",
    updated_at: "2025-06-01T10:00:00.000Z",
    ...overrides,
  } as CourtProceeding;
}

/** Returns an ISO date string offset from `now` by the given number of days. */
function daysFromNow(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("PROCEEDING_TYPES", () => {
  it("has exactly 11 entries", () => {
    expect(PROCEEDING_TYPES).toHaveLength(11);
  });

  it("contains unique type values", () => {
    const values = PROCEEDING_TYPES.map((t) => t.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = PROCEEDING_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes care_order", () => {
    expect(PROCEEDING_TYPES.find((t) => t.type === "care_order")).toBeTruthy();
  });

  it("includes epo", () => {
    expect(PROCEEDING_TYPES.find((t) => t.type === "epo")).toBeTruthy();
  });

  it("includes adoption", () => {
    expect(PROCEEDING_TYPES.find((t) => t.type === "adoption")).toBeTruthy();
  });

  it("includes other", () => {
    expect(PROCEEDING_TYPES.find((t) => t.type === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const t of PROCEEDING_TYPES) {
      expect(t.label.length).toBeGreaterThan(0);
    }
  });
});

describe("PROCEEDING_STATUSES", () => {
  it("has exactly 6 entries", () => {
    expect(PROCEEDING_STATUSES).toHaveLength(6);
  });

  it("contains unique status values", () => {
    const values = PROCEEDING_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = PROCEEDING_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes active", () => {
    expect(PROCEEDING_STATUSES.find((s) => s.status === "active")).toBeTruthy();
  });

  it("includes pending_decision", () => {
    expect(PROCEEDING_STATUSES.find((s) => s.status === "pending_decision")).toBeTruthy();
  });

  it("includes appeal_pending", () => {
    expect(PROCEEDING_STATUSES.find((s) => s.status === "appeal_pending")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of PROCEEDING_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("HEARING_TYPES", () => {
  it("has exactly 9 entries", () => {
    expect(HEARING_TYPES).toHaveLength(9);
  });

  it("contains unique type values", () => {
    const values = HEARING_TYPES.map((h) => h.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = HEARING_TYPES.map((h) => h.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes first_hearing", () => {
    expect(HEARING_TYPES.find((h) => h.type === "first_hearing")).toBeTruthy();
  });

  it("includes final_hearing", () => {
    expect(HEARING_TYPES.find((h) => h.type === "final_hearing")).toBeTruthy();
  });

  it("includes emergency", () => {
    expect(HEARING_TYPES.find((h) => h.type === "emergency")).toBeTruthy();
  });

  it("includes other", () => {
    expect(HEARING_TYPES.find((h) => h.type === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const h of HEARING_TYPES) {
      expect(h.label.length).toBeGreaterThan(0);
    }
  });
});

describe("STATEMENT_STATUSES", () => {
  it("has exactly 6 entries", () => {
    expect(STATEMENT_STATUSES).toHaveLength(6);
  });

  it("contains unique status values", () => {
    const values = STATEMENT_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = STATEMENT_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes submitted", () => {
    expect(STATEMENT_STATUSES.find((s) => s.status === "submitted")).toBeTruthy();
  });

  it("includes filed_with_court", () => {
    expect(STATEMENT_STATUSES.find((s) => s.status === "filed_with_court")).toBeTruthy();
  });

  it("includes late", () => {
    expect(STATEMENT_STATUSES.find((s) => s.status === "late")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of STATEMENT_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeCourtMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeCourtMetrics", () => {
  it("returns zeroed metrics for empty proceedings array", () => {
    const m = computeCourtMetrics([]);
    expect(m.total_proceedings).toBe(0);
    expect(m.active_count).toBe(0);
    expect(m.concluded_count).toBe(0);
    expect(m.adjourned_count).toBe(0);
    expect(m.pending_decision_count).toBe(0);
    expect(m.children_involved).toBe(0);
    expect(m.guardian_appointed_rate).toBe(0);
    expect(m.statement_submitted_rate).toBe(0);
    expect(m.statement_late_count).toBe(0);
    expect(m.home_statement_required_count).toBe(0);
    expect(m.home_statement_submitted_rate).toBe(0);
    expect(m.child_views_sought_rate).toBe(0);
    expect(m.child_wishes_communicated_rate).toBe(0);
    expect(m.upcoming_hearings).toBe(0);
    expect(Object.keys(m.by_proceeding_type)).toHaveLength(0);
    expect(Object.keys(m.by_proceeding_status)).toHaveLength(0);
    expect(Object.keys(m.by_hearing_type)).toHaveLength(0);
    expect(Object.keys(m.by_statement_status)).toHaveLength(0);
  });

  // ── total_proceedings ────────────────────────────────────────────────

  it("total_proceedings equals the number of proceedings", () => {
    const proceedings = [
      makeProceeding({ id: "cp1" }),
      makeProceeding({ id: "cp2" }),
      makeProceeding({ id: "cp3" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.total_proceedings).toBe(3);
  });

  it("total_proceedings is 1 for single proceeding", () => {
    const m = computeCourtMetrics([makeProceeding()]);
    expect(m.total_proceedings).toBe(1);
  });

  // ── active_count ─────────────────────────────────────────────────────

  it("active_count counts proceedings with active status", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "active" }),
      makeProceeding({ id: "cp2", proceeding_status: "active" }),
      makeProceeding({ id: "cp3", proceeding_status: "concluded" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.active_count).toBe(2);
  });

  it("active_count is 0 when no proceedings are active", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "concluded" }),
      makeProceeding({ id: "cp2", proceeding_status: "withdrawn" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.active_count).toBe(0);
  });

  // ── concluded_count ──────────────────────────────────────────────────

  it("concluded_count counts proceedings with concluded status", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "concluded" }),
      makeProceeding({ id: "cp2", proceeding_status: "concluded" }),
      makeProceeding({ id: "cp3", proceeding_status: "active" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.concluded_count).toBe(2);
  });

  it("concluded_count is 0 when no proceedings concluded", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "active" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.concluded_count).toBe(0);
  });

  // ── adjourned_count ──────────────────────────────────────────────────

  it("adjourned_count counts proceedings with adjourned status", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "adjourned" }),
      makeProceeding({ id: "cp2", proceeding_status: "adjourned" }),
      makeProceeding({ id: "cp3", proceeding_status: "active" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.adjourned_count).toBe(2);
  });

  it("adjourned_count is 0 when no proceedings adjourned", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "active" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.adjourned_count).toBe(0);
  });

  // ── pending_decision_count ───────────────────────────────────────────

  it("pending_decision_count counts proceedings with pending_decision status", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "pending_decision" }),
      makeProceeding({ id: "cp2", proceeding_status: "pending_decision" }),
      makeProceeding({ id: "cp3", proceeding_status: "active" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.pending_decision_count).toBe(2);
  });

  it("pending_decision_count is 0 when no proceedings pending decision", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "active" }),
      makeProceeding({ id: "cp2", proceeding_status: "concluded" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.pending_decision_count).toBe(0);
  });

  // ── children_involved ────────────────────────────────────────────────

  it("children_involved counts unique child IDs", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", child_id: "child-1" }),
      makeProceeding({ id: "cp2", child_id: "child-2" }),
      makeProceeding({ id: "cp3", child_id: "child-1" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.children_involved).toBe(2);
  });

  it("children_involved is 1 when all proceedings for same child", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", child_id: "child-1" }),
      makeProceeding({ id: "cp2", child_id: "child-1" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.children_involved).toBe(1);
  });

  it("children_involved is 0 for empty proceedings", () => {
    const m = computeCourtMetrics([]);
    expect(m.children_involved).toBe(0);
  });

  // ── guardian_appointed_rate ───────────────────────────────────────────

  it("guardian_appointed_rate is 100 when all have guardians", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", guardian_appointed: true }),
      makeProceeding({ id: "cp2", guardian_appointed: true }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.guardian_appointed_rate).toBe(100);
  });

  it("guardian_appointed_rate is 0 when none have guardians", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", guardian_appointed: false }),
      makeProceeding({ id: "cp2", guardian_appointed: false }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.guardian_appointed_rate).toBe(0);
  });

  it("guardian_appointed_rate is 50 when half have guardians", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", guardian_appointed: true }),
      makeProceeding({ id: "cp2", guardian_appointed: false }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.guardian_appointed_rate).toBe(50);
  });

  it("guardian_appointed_rate rounds to one decimal place", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", guardian_appointed: true }),
      makeProceeding({ id: "cp2", guardian_appointed: false }),
      makeProceeding({ id: "cp3", guardian_appointed: false }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.guardian_appointed_rate).toBe(33.3);
  });

  it("guardian_appointed_rate is 0 for empty proceedings", () => {
    const m = computeCourtMetrics([]);
    expect(m.guardian_appointed_rate).toBe(0);
  });

  // ── statement_submitted_rate ─────────────────────────────────────────

  it("statement_submitted_rate is 100 when all submitted", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", statement_status: "submitted" }),
      makeProceeding({ id: "cp2", statement_status: "submitted" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.statement_submitted_rate).toBe(100);
  });

  it("statement_submitted_rate counts filed_with_court as submitted", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", statement_status: "filed_with_court" }),
      makeProceeding({ id: "cp2", statement_status: "filed_with_court" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.statement_submitted_rate).toBe(100);
  });

  it("statement_submitted_rate counts both submitted and filed_with_court", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", statement_status: "submitted" }),
      makeProceeding({ id: "cp2", statement_status: "filed_with_court" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.statement_submitted_rate).toBe(100);
  });

  it("statement_submitted_rate is 0 when none submitted or filed", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", statement_status: "not_started" }),
      makeProceeding({ id: "cp2", statement_status: "drafting" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.statement_submitted_rate).toBe(0);
  });

  it("statement_submitted_rate rounds to one decimal place", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", statement_status: "submitted" }),
      makeProceeding({ id: "cp2", statement_status: "not_started" }),
      makeProceeding({ id: "cp3", statement_status: "drafting" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.statement_submitted_rate).toBe(33.3);
  });

  it("statement_submitted_rate is 0 for empty proceedings", () => {
    const m = computeCourtMetrics([]);
    expect(m.statement_submitted_rate).toBe(0);
  });

  // ── statement_late_count ─────────────────────────────────────────────

  it("statement_late_count counts proceedings with late statement status", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", statement_status: "late" }),
      makeProceeding({ id: "cp2", statement_status: "late" }),
      makeProceeding({ id: "cp3", statement_status: "submitted" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.statement_late_count).toBe(2);
  });

  it("statement_late_count is 0 when no statements are late", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", statement_status: "submitted" }),
      makeProceeding({ id: "cp2", statement_status: "drafting" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.statement_late_count).toBe(0);
  });

  // ── home_statement_required_count ────────────────────────────────────

  it("home_statement_required_count counts proceedings where home statement required", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", home_statement_required: true }),
      makeProceeding({ id: "cp2", home_statement_required: true }),
      makeProceeding({ id: "cp3", home_statement_required: false }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.home_statement_required_count).toBe(2);
  });

  it("home_statement_required_count is 0 when none required", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", home_statement_required: false }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.home_statement_required_count).toBe(0);
  });

  // ── home_statement_submitted_rate ────────────────────────────────────

  it("home_statement_submitted_rate is 100 when all required are submitted", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", home_statement_required: true, home_statement_submitted: true }),
      makeProceeding({ id: "cp2", home_statement_required: true, home_statement_submitted: true }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.home_statement_submitted_rate).toBe(100);
  });

  it("home_statement_submitted_rate is 0 when none submitted of required", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", home_statement_required: true, home_statement_submitted: false }),
      makeProceeding({ id: "cp2", home_statement_required: true, home_statement_submitted: false }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.home_statement_submitted_rate).toBe(0);
  });

  it("home_statement_submitted_rate is 50 when half of required are submitted", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", home_statement_required: true, home_statement_submitted: true }),
      makeProceeding({ id: "cp2", home_statement_required: true, home_statement_submitted: false }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.home_statement_submitted_rate).toBe(50);
  });

  it("home_statement_submitted_rate is based only on required proceedings", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", home_statement_required: true, home_statement_submitted: true }),
      makeProceeding({ id: "cp2", home_statement_required: false, home_statement_submitted: false }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.home_statement_submitted_rate).toBe(100);
  });

  it("home_statement_submitted_rate is 0 when no home statements required", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", home_statement_required: false, home_statement_submitted: false }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.home_statement_submitted_rate).toBe(0);
  });

  it("home_statement_submitted_rate rounds to one decimal place", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", home_statement_required: true, home_statement_submitted: true }),
      makeProceeding({ id: "cp2", home_statement_required: true, home_statement_submitted: false }),
      makeProceeding({ id: "cp3", home_statement_required: true, home_statement_submitted: false }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.home_statement_submitted_rate).toBe(33.3);
  });

  // ── child_views_sought_rate ──────────────────────────────────────────

  it("child_views_sought_rate is 100 when all have views sought", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", child_views_sought: true }),
      makeProceeding({ id: "cp2", child_views_sought: true }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.child_views_sought_rate).toBe(100);
  });

  it("child_views_sought_rate is 0 when none have views sought", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", child_views_sought: false }),
      makeProceeding({ id: "cp2", child_views_sought: false }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.child_views_sought_rate).toBe(0);
  });

  it("child_views_sought_rate is 50 when half have views sought", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", child_views_sought: true }),
      makeProceeding({ id: "cp2", child_views_sought: false }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.child_views_sought_rate).toBe(50);
  });

  it("child_views_sought_rate rounds to one decimal place", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", child_views_sought: true }),
      makeProceeding({ id: "cp2", child_views_sought: false }),
      makeProceeding({ id: "cp3", child_views_sought: false }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.child_views_sought_rate).toBe(33.3);
  });

  it("child_views_sought_rate is 0 for empty proceedings", () => {
    const m = computeCourtMetrics([]);
    expect(m.child_views_sought_rate).toBe(0);
  });

  // ── child_wishes_communicated_rate ───────────────────────────────────

  it("child_wishes_communicated_rate is 100 when all communicated", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", child_wishes_communicated: true }),
      makeProceeding({ id: "cp2", child_wishes_communicated: true }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.child_wishes_communicated_rate).toBe(100);
  });

  it("child_wishes_communicated_rate rounds to one decimal place", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", child_wishes_communicated: true }),
      makeProceeding({ id: "cp2", child_wishes_communicated: false }),
      makeProceeding({ id: "cp3", child_wishes_communicated: false }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.child_wishes_communicated_rate).toBe(33.3);
  });

  it("child_wishes_communicated_rate is 0 for empty proceedings", () => {
    const m = computeCourtMetrics([]);
    expect(m.child_wishes_communicated_rate).toBe(0);
  });

  // ── upcoming_hearings ────────────────────────────────────────────────

  it("upcoming_hearings counts proceedings with non-null next_hearing_date", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", next_hearing_date: "2025-07-01" }),
      makeProceeding({ id: "cp2", next_hearing_date: "2025-08-01" }),
      makeProceeding({ id: "cp3", next_hearing_date: null }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.upcoming_hearings).toBe(2);
  });

  it("upcoming_hearings is 0 when all next_hearing_date are null", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", next_hearing_date: null }),
      makeProceeding({ id: "cp2", next_hearing_date: null }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.upcoming_hearings).toBe(0);
  });

  // ── by_proceeding_type ───────────────────────────────────────────────

  it("by_proceeding_type groups counts by type", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_type: "care_order" }),
      makeProceeding({ id: "cp2", proceeding_type: "care_order" }),
      makeProceeding({ id: "cp3", proceeding_type: "epo" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.by_proceeding_type["care_order"]).toBe(2);
    expect(m.by_proceeding_type["epo"]).toBe(1);
  });

  it("by_proceeding_type is empty for no proceedings", () => {
    const m = computeCourtMetrics([]);
    expect(Object.keys(m.by_proceeding_type)).toHaveLength(0);
  });

  it("by_proceeding_type has one entry per unique type", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_type: "care_order" }),
      makeProceeding({ id: "cp2", proceeding_type: "epo" }),
      makeProceeding({ id: "cp3", proceeding_type: "adoption" }),
      makeProceeding({ id: "cp4", proceeding_type: "epo" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(Object.keys(m.by_proceeding_type)).toHaveLength(3);
  });

  it("by_proceeding_type values sum to total_proceedings", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_type: "care_order" }),
      makeProceeding({ id: "cp2", proceeding_type: "supervision_order" }),
      makeProceeding({ id: "cp3", proceeding_type: "care_order" }),
      makeProceeding({ id: "cp4", proceeding_type: "other" }),
    ];
    const m = computeCourtMetrics(proceedings);
    const sum = Object.values(m.by_proceeding_type).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_proceedings);
  });

  it("by_proceeding_type has 11 entries when all types represented", () => {
    const types: ProceedingType[] = [
      "care_order", "supervision_order", "epo", "secure_accommodation",
      "adoption", "special_guardianship", "child_arrangement",
      "discharge_of_order", "variation", "appeal", "other",
    ];
    const proceedings = types.map((type, i) =>
      makeProceeding({ id: `cp${i}`, proceeding_type: type }),
    );
    const m = computeCourtMetrics(proceedings);
    expect(Object.keys(m.by_proceeding_type)).toHaveLength(11);
  });

  // ── by_proceeding_status ─────────────────────────────────────────────

  it("by_proceeding_status groups counts by status", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "active" }),
      makeProceeding({ id: "cp2", proceeding_status: "active" }),
      makeProceeding({ id: "cp3", proceeding_status: "concluded" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.by_proceeding_status["active"]).toBe(2);
    expect(m.by_proceeding_status["concluded"]).toBe(1);
  });

  it("by_proceeding_status is empty for no proceedings", () => {
    const m = computeCourtMetrics([]);
    expect(Object.keys(m.by_proceeding_status)).toHaveLength(0);
  });

  it("by_proceeding_status values sum to total_proceedings", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "active" }),
      makeProceeding({ id: "cp2", proceeding_status: "concluded" }),
      makeProceeding({ id: "cp3", proceeding_status: "adjourned" }),
    ];
    const m = computeCourtMetrics(proceedings);
    const sum = Object.values(m.by_proceeding_status).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_proceedings);
  });

  it("by_proceeding_status has 6 entries when all statuses represented", () => {
    const statuses: ProceedingStatus[] = [
      "active", "adjourned", "concluded", "withdrawn", "pending_decision", "appeal_pending",
    ];
    const proceedings = statuses.map((status, i) =>
      makeProceeding({ id: `cp${i}`, proceeding_status: status }),
    );
    const m = computeCourtMetrics(proceedings);
    expect(Object.keys(m.by_proceeding_status)).toHaveLength(6);
  });

  // ── by_hearing_type ──────────────────────────────────────────────────

  it("by_hearing_type groups counts by hearing type", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", next_hearing_type: "case_management" }),
      makeProceeding({ id: "cp2", next_hearing_type: "case_management" }),
      makeProceeding({ id: "cp3", next_hearing_type: "final_hearing" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.by_hearing_type["case_management"]).toBe(2);
    expect(m.by_hearing_type["final_hearing"]).toBe(1);
  });

  it("by_hearing_type is empty for no proceedings", () => {
    const m = computeCourtMetrics([]);
    expect(Object.keys(m.by_hearing_type)).toHaveLength(0);
  });

  it("by_hearing_type excludes null hearing types", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", next_hearing_type: "case_management" }),
      makeProceeding({ id: "cp2", next_hearing_type: null }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(Object.keys(m.by_hearing_type)).toHaveLength(1);
    expect(m.by_hearing_type["case_management"]).toBe(1);
  });

  it("by_hearing_type is empty when all hearing types are null", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", next_hearing_type: null }),
      makeProceeding({ id: "cp2", next_hearing_type: null }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(Object.keys(m.by_hearing_type)).toHaveLength(0);
  });

  it("by_hearing_type has 9 entries when all types represented", () => {
    const types: HearingType[] = [
      "first_hearing", "case_management", "issues_resolution", "final_hearing",
      "review_hearing", "directions_hearing", "emergency", "appeal", "other",
    ];
    const proceedings = types.map((type, i) =>
      makeProceeding({ id: `cp${i}`, next_hearing_type: type }),
    );
    const m = computeCourtMetrics(proceedings);
    expect(Object.keys(m.by_hearing_type)).toHaveLength(9);
  });

  // ── by_statement_status ──────────────────────────────────────────────

  it("by_statement_status groups counts by statement status", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", statement_status: "submitted" }),
      makeProceeding({ id: "cp2", statement_status: "submitted" }),
      makeProceeding({ id: "cp3", statement_status: "late" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.by_statement_status["submitted"]).toBe(2);
    expect(m.by_statement_status["late"]).toBe(1);
  });

  it("by_statement_status is empty for no proceedings", () => {
    const m = computeCourtMetrics([]);
    expect(Object.keys(m.by_statement_status)).toHaveLength(0);
  });

  it("by_statement_status values sum to total_proceedings", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", statement_status: "submitted" }),
      makeProceeding({ id: "cp2", statement_status: "late" }),
      makeProceeding({ id: "cp3", statement_status: "drafting" }),
    ];
    const m = computeCourtMetrics(proceedings);
    const sum = Object.values(m.by_statement_status).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_proceedings);
  });

  it("by_statement_status has 6 entries when all statuses represented", () => {
    const statuses: StatementStatus[] = [
      "not_started", "drafting", "under_review", "submitted", "filed_with_court", "late",
    ];
    const proceedings = statuses.map((status, i) =>
      makeProceeding({ id: `cp${i}`, statement_status: status }),
    );
    const m = computeCourtMetrics(proceedings);
    expect(Object.keys(m.by_statement_status)).toHaveLength(6);
  });

  // ── mixed multi-proceeding scenario ──────────────────────────────────

  it("correctly computes metrics for mixed multi-proceeding scenario", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_id: "child-1", proceeding_status: "active",
        proceeding_type: "care_order", guardian_appointed: true,
        statement_status: "submitted", home_statement_required: true,
        home_statement_submitted: true, child_views_sought: true,
        child_wishes_communicated: true, next_hearing_date: "2025-07-01",
        next_hearing_type: "case_management",
      }),
      makeProceeding({
        id: "cp2", child_id: "child-2", proceeding_status: "concluded",
        proceeding_type: "epo", guardian_appointed: false,
        statement_status: "filed_with_court", home_statement_required: false,
        home_statement_submitted: false, child_views_sought: false,
        child_wishes_communicated: false, next_hearing_date: null,
        next_hearing_type: null,
      }),
      makeProceeding({
        id: "cp3", child_id: "child-1", proceeding_status: "adjourned",
        proceeding_type: "supervision_order", guardian_appointed: true,
        statement_status: "late", home_statement_required: true,
        home_statement_submitted: false, child_views_sought: true,
        child_wishes_communicated: false, next_hearing_date: "2025-08-15",
        next_hearing_type: "final_hearing",
      }),
      makeProceeding({
        id: "cp4", child_id: "child-3", proceeding_status: "pending_decision",
        proceeding_type: "adoption", guardian_appointed: false,
        statement_status: "not_started", home_statement_required: true,
        home_statement_submitted: false, child_views_sought: false,
        child_wishes_communicated: false, next_hearing_date: null,
        next_hearing_type: null,
      }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.total_proceedings).toBe(4);
    expect(m.active_count).toBe(1);
    expect(m.concluded_count).toBe(1);
    expect(m.adjourned_count).toBe(1);
    expect(m.pending_decision_count).toBe(1);
    expect(m.children_involved).toBe(3);
    expect(m.guardian_appointed_rate).toBe(50);
    expect(m.statement_submitted_rate).toBe(50);
    expect(m.statement_late_count).toBe(1);
    expect(m.home_statement_required_count).toBe(3);
    expect(m.home_statement_submitted_rate).toBe(33.3);
    expect(m.child_views_sought_rate).toBe(50);
    expect(m.child_wishes_communicated_rate).toBe(25);
    expect(m.upcoming_hearings).toBe(2);
    expect(m.by_proceeding_type["care_order"]).toBe(1);
    expect(m.by_proceeding_type["epo"]).toBe(1);
    expect(m.by_proceeding_type["supervision_order"]).toBe(1);
    expect(m.by_proceeding_type["adoption"]).toBe(1);
    expect(m.by_proceeding_status["active"]).toBe(1);
    expect(m.by_proceeding_status["concluded"]).toBe(1);
    expect(m.by_proceeding_status["adjourned"]).toBe(1);
    expect(m.by_proceeding_status["pending_decision"]).toBe(1);
    expect(m.by_hearing_type["case_management"]).toBe(1);
    expect(m.by_hearing_type["final_hearing"]).toBe(1);
  });

  // ── large dataset ────────────────────────────────────────────────────

  it("handles large proceedings array efficiently", () => {
    const types: ProceedingType[] = [
      "care_order", "supervision_order", "epo", "secure_accommodation",
      "adoption", "special_guardianship", "child_arrangement",
      "discharge_of_order", "variation", "appeal", "other",
    ];
    const statuses: ProceedingStatus[] = [
      "active", "adjourned", "concluded", "withdrawn", "pending_decision", "appeal_pending",
    ];
    const proceedings: CourtProceeding[] = [];
    for (let i = 0; i < 100; i++) {
      proceedings.push(
        makeProceeding({
          id: `cp-${i}`,
          child_id: `child-${i % 20}`,
          proceeding_type: types[i % 11],
          proceeding_status: statuses[i % 6],
          guardian_appointed: i % 3 === 0,
          statement_status: i % 4 === 0 ? "submitted" : "drafting",
          child_views_sought: i % 2 === 0,
          next_hearing_date: i % 5 === 0 ? "2025-07-01" : null,
        }),
      );
    }
    const m = computeCourtMetrics(proceedings);
    expect(m.total_proceedings).toBe(100);
    expect(m.children_involved).toBe(20);
  });

  // ── single proceeding all flags true ─────────────────────────────────

  it("single proceeding with all positive flags", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", guardian_appointed: true, statement_status: "submitted",
        home_statement_required: true, home_statement_submitted: true,
        child_views_sought: true, child_wishes_communicated: true,
        next_hearing_date: "2025-07-01",
      }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.guardian_appointed_rate).toBe(100);
    expect(m.statement_submitted_rate).toBe(100);
    expect(m.home_statement_submitted_rate).toBe(100);
    expect(m.child_views_sought_rate).toBe(100);
    expect(m.child_wishes_communicated_rate).toBe(100);
    expect(m.upcoming_hearings).toBe(1);
  });

  it("single proceeding with all negative flags", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", guardian_appointed: false, statement_status: "not_started",
        home_statement_required: false, home_statement_submitted: false,
        child_views_sought: false, child_wishes_communicated: false,
        next_hearing_date: null,
      }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.guardian_appointed_rate).toBe(0);
    expect(m.statement_submitted_rate).toBe(0);
    expect(m.home_statement_submitted_rate).toBe(0);
    expect(m.child_views_sought_rate).toBe(0);
    expect(m.child_wishes_communicated_rate).toBe(0);
    expect(m.upcoming_hearings).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyCourtAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyCourtAlerts", () => {
  // ── no alerts when clean ───────────────────────────────────────────

  it("returns empty array for empty proceedings", () => {
    const alerts = identifyCourtAlerts([], now);
    expect(alerts).toEqual([]);
  });

  it("returns empty array when all data is clean", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", proceeding_status: "active",
        statement_status: "submitted",
        home_statement_required: true, home_statement_submitted: true,
        child_views_sought: true,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts).toEqual([]);
  });

  it("returns empty array for concluded proceeding with issues", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", proceeding_status: "concluded",
        statement_status: "drafting",
        home_statement_required: true, home_statement_submitted: false,
        child_views_sought: false,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    // home_statement_pending and child_views_not_sought only fire for active status
    // statement_deadline_soon needs deadline within 7 days
    // statement_late needs statement_status === "late"
    // pending_decision needs proceeding_status === "pending_decision"
    expect(alerts).toEqual([]);
  });

  // ── statement_late alert ─────────────────────────────────────────────

  it("generates statement_late alert for late statement status", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_name: "Alice", court_name: "Family Court",
        statement_status: "late",
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "statement_late");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("critical");
    expect(alert!.id).toBe("cp1");
  });

  it("statement_late alert includes child name", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_name: "Bob Jones",
        statement_status: "late", court_name: "Crown Court",
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "statement_late");
    expect(alert!.message).toContain("Bob Jones");
  });

  it("statement_late alert includes court name", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_name: "Alice",
        statement_status: "late", court_name: "Manchester Family Court",
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "statement_late");
    expect(alert!.message).toContain("Manchester Family Court");
  });

  it("statement_late fires regardless of proceeding_status", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", proceeding_status: "concluded",
        statement_status: "late",
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "statement_late");
    expect(alert).toBeTruthy();
  });

  it("no statement_late alert when statement is submitted", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", statement_status: "submitted" }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "statement_late")).toBeUndefined();
  });

  it("no statement_late alert when statement is filed_with_court", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", statement_status: "filed_with_court" }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "statement_late")).toBeUndefined();
  });

  it("no statement_late alert when statement is not_started", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", statement_status: "not_started" }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "statement_late")).toBeUndefined();
  });

  it("generates multiple statement_late alerts for different proceedings", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", child_name: "Alice", statement_status: "late" }),
      makeProceeding({ id: "cp2", child_name: "Bob", statement_status: "late" }),
      makeProceeding({ id: "cp3", child_name: "Carol", statement_status: "submitted" }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const lateAlerts = alerts.filter((a) => a.type === "statement_late");
    expect(lateAlerts).toHaveLength(2);
  });

  // ── statement_deadline_soon alert ────────────────────────────────────

  it("generates statement_deadline_soon alert when deadline is within 7 days", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_name: "Alice",
        statement_status: "drafting",
        statement_deadline: daysFromNow(5),
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "statement_deadline_soon");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("high");
    expect(alert!.id).toBe("cp1");
  });

  it("statement_deadline_soon alert includes child name", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_name: "Bob Jones",
        statement_status: "not_started",
        statement_deadline: daysFromNow(3),
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "statement_deadline_soon");
    expect(alert!.message).toContain("Bob Jones");
  });

  it("statement_deadline_soon fires at exactly 7 days", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", statement_status: "drafting",
        statement_deadline: daysFromNow(7),
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "statement_deadline_soon")).toBeTruthy();
  });

  it("statement_deadline_soon fires at exactly 0 days (today)", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", statement_status: "drafting",
        statement_deadline: daysFromNow(0),
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "statement_deadline_soon")).toBeTruthy();
  });

  it("statement_deadline_soon fires at 1 day and uses singular", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_name: "Alice",
        statement_status: "under_review",
        statement_deadline: daysFromNow(1),
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "statement_deadline_soon");
    expect(alert).toBeTruthy();
    expect(alert!.message).toContain("1 day");
  });

  it("statement_deadline_soon uses plural for multiple days", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_name: "Alice",
        statement_status: "drafting",
        statement_deadline: daysFromNow(5),
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "statement_deadline_soon");
    expect(alert).toBeTruthy();
    expect(alert!.message).toContain("5 days");
  });

  it("no statement_deadline_soon when deadline is more than 7 days away", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", statement_status: "drafting",
        statement_deadline: daysFromNow(8),
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "statement_deadline_soon")).toBeUndefined();
  });

  it("no statement_deadline_soon when deadline is in the past", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", statement_status: "drafting",
        statement_deadline: daysFromNow(-1),
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "statement_deadline_soon")).toBeUndefined();
  });

  it("no statement_deadline_soon when statement_status is submitted", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", statement_status: "submitted",
        statement_deadline: daysFromNow(3),
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "statement_deadline_soon")).toBeUndefined();
  });

  it("no statement_deadline_soon when statement_status is late", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", statement_status: "late",
        statement_deadline: daysFromNow(3),
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "statement_deadline_soon")).toBeUndefined();
  });

  it("no statement_deadline_soon when statement_deadline is null", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", statement_status: "drafting",
        statement_deadline: null,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "statement_deadline_soon")).toBeUndefined();
  });

  it("statement_deadline_soon fires for under_review status within deadline", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", statement_status: "under_review",
        statement_deadline: daysFromNow(4),
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "statement_deadline_soon")).toBeTruthy();
  });

  it("generates multiple statement_deadline_soon alerts for different proceedings", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", statement_status: "drafting", statement_deadline: daysFromNow(2) }),
      makeProceeding({ id: "cp2", statement_status: "not_started", statement_deadline: daysFromNow(5) }),
      makeProceeding({ id: "cp3", statement_status: "submitted", statement_deadline: daysFromNow(1) }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const deadlineAlerts = alerts.filter((a) => a.type === "statement_deadline_soon");
    expect(deadlineAlerts).toHaveLength(2);
  });

  // ── home_statement_pending alert ─────────────────────────────────────

  it("generates home_statement_pending alert for active + required + not submitted", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_name: "Alice", proceeding_status: "active",
        proceeding_type: "care_order",
        home_statement_required: true, home_statement_submitted: false,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "home_statement_pending");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("high");
    expect(alert!.id).toBe("cp1");
  });

  it("home_statement_pending alert includes child name", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_name: "Carol Davies", proceeding_status: "active",
        home_statement_required: true, home_statement_submitted: false,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "home_statement_pending");
    expect(alert!.message).toContain("Carol Davies");
  });

  it("home_statement_pending alert message includes proceeding type", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_name: "Alice", proceeding_status: "active",
        proceeding_type: "care_order",
        home_statement_required: true, home_statement_submitted: false,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "home_statement_pending");
    expect(alert!.message).toContain("care order");
  });

  it("no home_statement_pending when home statement is submitted", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", proceeding_status: "active",
        home_statement_required: true, home_statement_submitted: true,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "home_statement_pending")).toBeUndefined();
  });

  it("no home_statement_pending when home statement not required", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", proceeding_status: "active",
        home_statement_required: false, home_statement_submitted: false,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "home_statement_pending")).toBeUndefined();
  });

  it("no home_statement_pending when proceeding_status is concluded", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", proceeding_status: "concluded",
        home_statement_required: true, home_statement_submitted: false,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "home_statement_pending")).toBeUndefined();
  });

  it("no home_statement_pending when proceeding_status is pending_decision", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", proceeding_status: "pending_decision",
        home_statement_required: true, home_statement_submitted: false,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "home_statement_pending")).toBeUndefined();
  });

  it("generates multiple home_statement_pending alerts for different proceedings", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "active", home_statement_required: true, home_statement_submitted: false }),
      makeProceeding({ id: "cp2", proceeding_status: "active", home_statement_required: true, home_statement_submitted: false }),
      makeProceeding({ id: "cp3", proceeding_status: "active", home_statement_required: true, home_statement_submitted: true }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const pendingAlerts = alerts.filter((a) => a.type === "home_statement_pending");
    expect(pendingAlerts).toHaveLength(2);
  });

  // ── child_views_not_sought alert ─────────────────────────────────────

  it("generates child_views_not_sought alert for active + views not sought", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_name: "Alice", proceeding_status: "active",
        child_views_sought: false,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "child_views_not_sought");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("high");
    expect(alert!.id).toBe("cp1");
  });

  it("child_views_not_sought alert includes child name", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_name: "Bob Jones", proceeding_status: "active",
        child_views_sought: false,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "child_views_not_sought");
    expect(alert!.message).toContain("Bob Jones");
  });

  it("child_views_not_sought alert mentions Reg 7", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_name: "Alice", proceeding_status: "active",
        child_views_sought: false,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "child_views_not_sought");
    expect(alert!.message).toContain("Reg 7");
  });

  it("no child_views_not_sought when views are sought", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", proceeding_status: "active",
        child_views_sought: true,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "child_views_not_sought")).toBeUndefined();
  });

  it("no child_views_not_sought when proceeding_status is concluded", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", proceeding_status: "concluded",
        child_views_sought: false,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "child_views_not_sought")).toBeUndefined();
  });

  it("no child_views_not_sought when proceeding_status is appeal_pending", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", proceeding_status: "appeal_pending",
        child_views_sought: false,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "child_views_not_sought")).toBeUndefined();
  });

  it("generates multiple child_views_not_sought alerts for different proceedings", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "active", child_views_sought: false }),
      makeProceeding({ id: "cp2", proceeding_status: "active", child_views_sought: false }),
      makeProceeding({ id: "cp3", proceeding_status: "active", child_views_sought: true }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const viewsAlerts = alerts.filter((a) => a.type === "child_views_not_sought");
    expect(viewsAlerts).toHaveLength(2);
  });

  // ── pending_decision alert ───────────────────────────────────────────

  it("generates pending_decision alert for pending_decision status", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_name: "Alice",
        proceeding_status: "pending_decision",
        proceeding_type: "care_order",
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "pending_decision");
    expect(alert).toBeTruthy();
    expect(alert!.severity).toBe("medium");
    expect(alert!.id).toBe("cp1");
  });

  it("pending_decision alert includes child name", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_name: "Bob Jones",
        proceeding_status: "pending_decision",
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "pending_decision");
    expect(alert!.message).toContain("Bob Jones");
  });

  it("pending_decision alert includes proceeding type", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_name: "Alice",
        proceeding_status: "pending_decision",
        proceeding_type: "adoption",
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "pending_decision");
    expect(alert!.message).toContain("adoption");
  });

  it("no pending_decision alert when proceeding_status is active", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "active" }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "pending_decision")).toBeUndefined();
  });

  it("no pending_decision alert when proceeding_status is concluded", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "concluded" }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "pending_decision")).toBeUndefined();
  });

  it("no pending_decision alert when proceeding_status is appeal_pending", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "appeal_pending" }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "pending_decision")).toBeUndefined();
  });

  it("generates multiple pending_decision alerts for different proceedings", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", child_name: "Alice", proceeding_status: "pending_decision" }),
      makeProceeding({ id: "cp2", child_name: "Bob", proceeding_status: "pending_decision" }),
      makeProceeding({ id: "cp3", child_name: "Carol", proceeding_status: "active" }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const pendingAlerts = alerts.filter((a) => a.type === "pending_decision");
    expect(pendingAlerts).toHaveLength(2);
  });

  // ── combined alerts ──────────────────────────────────────────────────

  it("generates all five alert types together when conditions are met", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_name: "Alice", proceeding_status: "active",
        statement_status: "late",
        home_statement_required: true, home_statement_submitted: false,
        child_views_sought: false,
      }),
      makeProceeding({
        id: "cp2", child_name: "Bob",
        proceeding_status: "active",
        statement_status: "drafting",
        statement_deadline: daysFromNow(3),
        home_statement_required: false,
        child_views_sought: true,
      }),
      makeProceeding({
        id: "cp3", child_name: "Carol",
        proceeding_status: "pending_decision",
        statement_status: "submitted",
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("statement_late");
    expect(types).toContain("statement_deadline_soon");
    expect(types).toContain("home_statement_pending");
    expect(types).toContain("child_views_not_sought");
    expect(types).toContain("pending_decision");
  });

  it("alert severity values are correct types", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", proceeding_status: "active",
        statement_status: "late",
        home_statement_required: true, home_statement_submitted: false,
        child_views_sought: false,
      }),
      makeProceeding({
        id: "cp2", proceeding_status: "pending_decision",
        statement_status: "submitted",
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    for (const alert of alerts) {
      expect(["critical", "high", "medium"]).toContain(alert.severity);
    }
  });

  it("each alert has a non-empty message", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_name: "Alice", proceeding_status: "active",
        statement_status: "late",
        home_statement_required: true, home_statement_submitted: false,
        child_views_sought: false,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    for (const alert of alerts) {
      expect(alert.message.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty id", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", proceeding_status: "active",
        statement_status: "late",
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    for (const alert of alerts) {
      expect(alert.id.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty type", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", proceeding_status: "pending_decision",
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    for (const alert of alerts) {
      expect(alert.type.length).toBeGreaterThan(0);
    }
  });

  it("statement_late is critical severity", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", statement_status: "late" }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "statement_late");
    expect(alert!.severity).toBe("critical");
  });

  it("statement_deadline_soon is high severity", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", statement_status: "drafting",
        statement_deadline: daysFromNow(3),
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "statement_deadline_soon");
    expect(alert!.severity).toBe("high");
  });

  it("home_statement_pending is high severity", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", proceeding_status: "active",
        home_statement_required: true, home_statement_submitted: false,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "home_statement_pending");
    expect(alert!.severity).toBe("high");
  });

  it("child_views_not_sought is high severity", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", proceeding_status: "active",
        child_views_sought: false,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "child_views_not_sought");
    expect(alert!.severity).toBe("high");
  });

  it("pending_decision is medium severity", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "pending_decision" }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    const alert = alerts.find((a) => a.type === "pending_decision");
    expect(alert!.severity).toBe("medium");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listProceedings ──────────────────────────────────────────────────

  it("listProceedings returns ok: true with empty array", async () => {
    const result = await listProceedings("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listProceedings returns ok: true with childId filter", async () => {
    const result = await listProceedings("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listProceedings returns ok: true with proceedingType filter", async () => {
    const result = await listProceedings("home-1", { proceedingType: "care_order" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listProceedings returns ok: true with proceedingStatus filter", async () => {
    const result = await listProceedings("home-1", { proceedingStatus: "active" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listProceedings returns ok: true with limit filter", async () => {
    const result = await listProceedings("home-1", { limit: 50 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listProceedings returns ok: true with all filters combined", async () => {
    const result = await listProceedings("home-1", {
      childId: "child-1",
      proceedingType: "epo",
      proceedingStatus: "active",
      limit: 10,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createProceeding ─────────────────────────────────────────────────

  it("createProceeding returns ok: false with error message", async () => {
    const result = await createProceeding({
      homeId: "home-1",
      childName: "Alice Smith",
      childId: "child-1",
      proceedingType: "care_order",
      proceedingStatus: "active",
      courtName: "Family Court",
      startDate: "2025-06-01",
      guardianAppointed: true,
      statementStatus: "not_started",
      laSocialWorker: "Jane Doe",
      homeStatementRequired: true,
      homeStatementSubmitted: false,
      courtActions: [],
      childViewsSought: false,
      childWishesCommunicated: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createProceeding error message is a string", async () => {
    const result = await createProceeding({
      homeId: "home-1",
      childName: "Bob Jones",
      childId: "child-2",
      proceedingType: "epo",
      proceedingStatus: "active",
      courtName: "Crown Court",
      caseNumber: "CC-2025-002",
      startDate: "2025-06-02",
      nextHearingDate: "2025-07-01",
      nextHearingType: "first_hearing",
      guardianAppointed: false,
      guardianName: "Guardian A",
      solicitorName: "Solicitor B",
      statementStatus: "drafting",
      statementDeadline: "2025-06-25",
      laSocialWorker: "John Smith",
      homeStatementRequired: true,
      homeStatementSubmitted: false,
      courtActions: ["file statement", "attend hearing"],
      childViewsSought: true,
      childWishesCommunicated: true,
      notes: "Urgent case",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  // ── updateProceeding ─────────────────────────────────────────────────

  it("updateProceeding returns ok: false with error message", async () => {
    const result = await updateProceeding("cp-1", { proceeding_status: "concluded" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateProceeding error message is a string for partial updates", async () => {
    const result = await updateProceeding("cp-1", {
      statement_status: "submitted",
      home_statement_submitted: true,
      notes: "Statement filed successfully",
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
  it("computeCourtMetrics with all proceedings active", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "active" }),
      makeProceeding({ id: "cp2", proceeding_status: "active" }),
      makeProceeding({ id: "cp3", proceeding_status: "active" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.active_count).toBe(3);
    expect(m.concluded_count).toBe(0);
    expect(m.adjourned_count).toBe(0);
    expect(m.pending_decision_count).toBe(0);
  });

  it("computeCourtMetrics with all proceedings pending_decision", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "pending_decision" }),
      makeProceeding({ id: "cp2", proceeding_status: "pending_decision" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.active_count).toBe(0);
    expect(m.pending_decision_count).toBe(2);
  });

  it("computeCourtMetrics with all statements late", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", statement_status: "late" }),
      makeProceeding({ id: "cp2", statement_status: "late" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.statement_late_count).toBe(2);
    expect(m.statement_submitted_rate).toBe(0);
  });

  it("computeCourtMetrics by_proceeding_status matches individual counts", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "active" }),
      makeProceeding({ id: "cp2", proceeding_status: "active" }),
      makeProceeding({ id: "cp3", proceeding_status: "concluded" }),
      makeProceeding({ id: "cp4", proceeding_status: "pending_decision" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.by_proceeding_status["active"]).toBe(m.active_count);
    expect(m.by_proceeding_status["concluded"]).toBe(m.concluded_count);
    expect(m.by_proceeding_status["pending_decision"]).toBe(m.pending_decision_count);
  });

  it("computeCourtMetrics with withdrawn proceedings", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", proceeding_status: "withdrawn" }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.active_count).toBe(0);
    expect(m.concluded_count).toBe(0);
    expect(m.adjourned_count).toBe(0);
    expect(m.pending_decision_count).toBe(0);
    expect(m.by_proceeding_status["withdrawn"]).toBe(1);
  });

  it("computeCourtMetrics rates are independent of proceeding status", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", proceeding_status: "active",
        guardian_appointed: true, child_views_sought: true,
        child_wishes_communicated: true,
      }),
      makeProceeding({
        id: "cp2", proceeding_status: "concluded",
        guardian_appointed: false, child_views_sought: false,
        child_wishes_communicated: false,
      }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.guardian_appointed_rate).toBe(50);
    expect(m.child_views_sought_rate).toBe(50);
    expect(m.child_wishes_communicated_rate).toBe(50);
  });

  it("computeCourtMetrics home_statement_submitted_rate ignores non-required", () => {
    const proceedings = [
      makeProceeding({ id: "cp1", home_statement_required: true, home_statement_submitted: true }),
      makeProceeding({ id: "cp2", home_statement_required: false, home_statement_submitted: true }),
      makeProceeding({ id: "cp3", home_statement_required: false, home_statement_submitted: false }),
    ];
    const m = computeCourtMetrics(proceedings);
    expect(m.home_statement_required_count).toBe(1);
    expect(m.home_statement_submitted_rate).toBe(100);
  });

  it("identifyCourtAlerts with maximum concurrent alerts for single proceeding", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", child_name: "Alice", proceeding_status: "active",
        statement_status: "late",
        statement_deadline: daysFromNow(3),
        home_statement_required: true, home_statement_submitted: false,
        child_views_sought: false,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    // statement_late fires (status === "late")
    // statement_deadline_soon does NOT fire (status === "late" is excluded)
    // home_statement_pending fires (active + required + not submitted)
    // child_views_not_sought fires (active + not sought)
    // pending_decision does NOT fire (status is active not pending_decision)
    const types = alerts.map((a) => a.type);
    expect(types).toContain("statement_late");
    expect(types).toContain("home_statement_pending");
    expect(types).toContain("child_views_not_sought");
    expect(types).not.toContain("statement_deadline_soon");
  });

  it("identifyCourtAlerts with no alerts for fully clean active proceeding", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", proceeding_status: "active",
        statement_status: "filed_with_court",
        home_statement_required: true, home_statement_submitted: true,
        child_views_sought: true,
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts).toEqual([]);
  });

  it("identifyCourtAlerts deadline boundary at exactly 7 days with not_started", () => {
    const proceedings = [
      makeProceeding({
        id: "cp1", statement_status: "not_started",
        statement_deadline: daysFromNow(7),
      }),
    ];
    const alerts = identifyCourtAlerts(proceedings, now);
    expect(alerts.find((a) => a.type === "statement_deadline_soon")).toBeTruthy();
  });
});
