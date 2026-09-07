// ══════════════════════════════════════════════════════════════════════════════
// CARA — WORKFORCE PLANNING SERVICE TESTS
// Pure-function unit tests for workforce metrics computation, alert
// identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 33 (employment of staff — sufficient
// numbers, suitable qualifications, skills, experience),
// Reg 34 (fitness of workers — ongoing suitability).
// SCCIF: Well-Led — "The home has sufficient, suitably qualified and
// experienced staff." "Staffing arrangements ensure children's needs
// are met at all times."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  computeWorkforceMetrics,
  identifyWorkforceAlerts,
  STAFF_ROLES,
  VACANCY_STATUSES,
  SHIFT_TYPES,
  SUCCESSION_READINESS,
  listSnapshots,
  createSnapshot,
  listVacancies,
  createVacancy,
  updateVacancy,
  listSuccessionPlans,
  createSuccessionPlan,
  updateSuccessionPlan,
} from "../workforce-planning-service";

import type {
  StaffingSnapshot,
  VacancyRecord,
  SuccessionPlan,
} from "../workforce-planning-service";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeSnapshot(overrides: Partial<StaffingSnapshot> = {}): StaffingSnapshot {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    snapshot_date: "2026-05-01",
    established_posts: 20,
    filled_posts: 18,
    vacancies: 2,
    agency_staff: 1,
    bank_staff: 0,
    staff_on_leave: 1,
    staff_on_sickness: 0,
    children_in_placement: 4,
    staff_child_ratio: 4.5,
    meets_minimum_ratio: true,
    commentary: overrides.commentary ?? null,
    recorded_by: "user-1",
    created_at: "2026-05-01T08:00:00Z",
      ...overrides,
  };
}

function makeVacancy(overrides: Partial<VacancyRecord> = {}): VacancyRecord {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    role: "residential_care_worker",
    title: "Residential Care Worker",
    status: "open",
    date_opened: "2026-04-01",
    date_filled: overrides.date_filled ?? null,
    closing_date: overrides.closing_date ?? null,
    applications_received: 0,
    interviews_scheduled: 0,
    offers_made: 0,
    agency_cover: false,
    recruitment_notes: overrides.recruitment_notes ?? null,
    created_at: "2026-04-01T08:00:00Z",
    updated_at: "2026-04-01T08:00:00Z",
      ...overrides,
  };
}

function makeSuccessionPlan(overrides: Partial<SuccessionPlan> = {}): SuccessionPlan {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    critical_role: "registered_manager",
    role_title: "Registered Manager",
    current_holder: "Alice Smith",
    successor_name: overrides.successor_name ?? null,
    readiness: "ready_now",
    development_actions: [],
    risk_if_vacant: "High regulatory risk",
    last_reviewed: "2026-04-15",
    created_at: "2026-04-01T08:00:00Z",
    updated_at: "2026-04-01T08:00:00Z",
      ...overrides,
  };
}

/** Date string N days ago from a reference date. */
function daysAgo(n: number, from: Date = new Date("2026-05-13")): string {
  const d = new Date(from.getTime() - n * 86400000);
  return d.toISOString().split("T")[0];
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  // ── STAFF_ROLES ──────────────────────────────────────────────────────────

  describe("STAFF_ROLES", () => {
    it("contains exactly 11 items", () => {
      expect(STAFF_ROLES).toHaveLength(11);
    });

    it("has unique role values", () => {
      const roles = STAFF_ROLES.map((r) => r.role);
      expect(new Set(roles).size).toBe(roles.length);
    });

    it("has non-empty labels for every role", () => {
      for (const r of STAFF_ROLES) {
        expect(r.label.length).toBeGreaterThan(0);
      }
    });

    it.each([
      "registered_manager",
      "deputy_manager",
      "senior_rcw",
      "residential_care_worker",
      "waking_night",
      "bank_staff",
      "agency",
      "team_leader",
      "admin",
      "maintenance",
      "other",
    ] as const)("includes role %s", (role) => {
      expect(STAFF_ROLES.find((r) => r.role === role)).toBeDefined();
    });
  });

  // ── VACANCY_STATUSES ────────────────────────────────────────────────────

  describe("VACANCY_STATUSES", () => {
    it("contains exactly 7 items", () => {
      expect(VACANCY_STATUSES).toHaveLength(7);
    });

    it("has unique status values", () => {
      const statuses = VACANCY_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has non-empty labels for every status", () => {
      for (const s of VACANCY_STATUSES) {
        expect(s.label.length).toBeGreaterThan(0);
      }
    });

    it.each([
      "open",
      "advertised",
      "shortlisted",
      "interviewing",
      "offered",
      "filled",
      "withdrawn",
    ] as const)("includes status %s", (status) => {
      expect(VACANCY_STATUSES.find((s) => s.status === status)).toBeDefined();
    });
  });

  // ── SHIFT_TYPES ─────────────────────────────────────────────────────────

  describe("SHIFT_TYPES", () => {
    it("contains exactly 7 items", () => {
      expect(SHIFT_TYPES).toHaveLength(7);
    });

    it("has unique type values", () => {
      const types = SHIFT_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has non-empty labels for every type", () => {
      for (const t of SHIFT_TYPES) {
        expect(t.label.length).toBeGreaterThan(0);
      }
    });

    it.each([
      "day",
      "long_day",
      "early",
      "late",
      "waking_night",
      "sleep_in",
      "on_call",
    ] as const)("includes type %s", (type) => {
      expect(SHIFT_TYPES.find((t) => t.type === type)).toBeDefined();
    });
  });

  // ── SUCCESSION_READINESS ────────────────────────────────────────────────

  describe("SUCCESSION_READINESS", () => {
    it("contains exactly 5 items", () => {
      expect(SUCCESSION_READINESS).toHaveLength(5);
    });

    it("has unique readiness values", () => {
      const vals = SUCCESSION_READINESS.map((r) => r.readiness);
      expect(new Set(vals).size).toBe(vals.length);
    });

    it("has non-empty labels for every readiness level", () => {
      for (const r of SUCCESSION_READINESS) {
        expect(r.label.length).toBeGreaterThan(0);
      }
    });

    it.each([
      "ready_now",
      "ready_1_year",
      "ready_2_years",
      "development_needed",
      "not_identified",
    ] as const)("includes readiness %s", (readiness) => {
      expect(SUCCESSION_READINESS.find((r) => r.readiness === readiness)).toBeDefined();
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeWorkforceMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeWorkforceMetrics", () => {
  // ── Empty inputs ────────────────────────────────────────────────────────

  it("returns zeroed stats for empty inputs", () => {
    const result = computeWorkforceMetrics([], [], []);
    expect(result.latest_established).toBe(0);
    expect(result.latest_filled).toBe(0);
    expect(result.latest_vacancies).toBe(0);
    expect(result.vacancy_rate).toBeNull();;
    expect(result.agency_count).toBe(0);
    expect(result.agency_rate).toBeNull();;
    expect(result.staff_child_ratio).toBe(0);
    expect(result.meets_ratio).toBe(null);
    expect(result.open_vacancies).toBe(0);
    expect(result.avg_time_to_fill).toBe(0);
    expect(result.succession_coverage).toBeNull();;
    expect(result.roles_at_risk).toBe(0);
    expect(result.by_role).toEqual({});
    expect(result.by_vacancy_status).toEqual({});
  });

  // ── latest_established ──────────────────────────────────────────────────

  it("uses the latest snapshot by date for latest_established", () => {
    const snapshots = [
      makeSnapshot({ snapshot_date: "2026-04-01", established_posts: 15 }),
      makeSnapshot({ snapshot_date: "2026-05-01", established_posts: 20 }),
      makeSnapshot({ snapshot_date: "2026-03-01", established_posts: 12 }),
    ];
    const result = computeWorkforceMetrics(snapshots, [], []);
    expect(result.latest_established).toBe(20);
  });

  // ── latest_filled ───────────────────────────────────────────────────────

  it("uses the latest snapshot for latest_filled", () => {
    const snapshots = [
      makeSnapshot({ snapshot_date: "2026-03-01", filled_posts: 10 }),
      makeSnapshot({ snapshot_date: "2026-05-01", filled_posts: 18 }),
    ];
    const result = computeWorkforceMetrics(snapshots, [], []);
    expect(result.latest_filled).toBe(18);
  });

  // ── latest_vacancies ────────────────────────────────────────────────────

  it("uses the latest snapshot for latest_vacancies", () => {
    const snapshots = [
      makeSnapshot({ snapshot_date: "2026-04-01", vacancies: 5 }),
      makeSnapshot({ snapshot_date: "2026-05-01", vacancies: 2 }),
    ];
    const result = computeWorkforceMetrics(snapshots, [], []);
    expect(result.latest_vacancies).toBe(2);
  });

  // ── vacancy_rate ────────────────────────────────────────────────────────

  it("computes vacancy_rate as vacancies/established * 100, 1 decimal", () => {
    const snapshots = [makeSnapshot({ established_posts: 20, vacancies: 3 })];
    const result = computeWorkforceMetrics(snapshots, [], []);
    expect(result.vacancy_rate).toBe(15);
  });

  it("returns vacancy_rate of 0 when established_posts is 0", () => {
    const snapshots = [makeSnapshot({ established_posts: 0, vacancies: 3 })];
    const result = computeWorkforceMetrics(snapshots, [], []);
    expect(result.vacancy_rate).toBeNull();;
  });

  it("rounds vacancy_rate to 1 decimal place", () => {
    // 1/3 * 100 = 33.333... => 33.3
    const snapshots = [makeSnapshot({ established_posts: 3, vacancies: 1 })];
    const result = computeWorkforceMetrics(snapshots, [], []);
    expect(result.vacancy_rate).toBe(33.3);
  });

  // ── agency_count ────────────────────────────────────────────────────────

  it("returns agency_count from the latest snapshot", () => {
    const snapshots = [
      makeSnapshot({ snapshot_date: "2026-03-01", agency_staff: 5 }),
      makeSnapshot({ snapshot_date: "2026-05-01", agency_staff: 3 }),
    ];
    const result = computeWorkforceMetrics(snapshots, [], []);
    expect(result.agency_count).toBe(3);
  });

  // ── agency_rate ─────────────────────────────────────────────────────────

  it("computes agency_rate as agency/(filled+agency) * 100, 1 decimal", () => {
    const snapshots = [makeSnapshot({ filled_posts: 17, agency_staff: 3 })];
    const result = computeWorkforceMetrics(snapshots, [], []);
    expect(result.agency_rate).toBe(15);
  });

  it("returns agency_rate of 0 when filled_posts is 0 and agency_staff is 0", () => {
    const snapshots = [makeSnapshot({ filled_posts: 0, agency_staff: 0 })];
    const result = computeWorkforceMetrics(snapshots, [], []);
    expect(result.agency_rate).toBeNull();;
  });

  it("rounds agency_rate to 1 decimal place", () => {
    // 1 / (2 + 1) * 100 = 33.333... => 33.3
    const snapshots = [makeSnapshot({ filled_posts: 2, agency_staff: 1 })];
    const result = computeWorkforceMetrics(snapshots, [], []);
    expect(result.agency_rate).toBe(33.3);
  });

  // ── staff_child_ratio ───────────────────────────────────────────────────

  it("returns staff_child_ratio from the latest snapshot", () => {
    const snapshots = [makeSnapshot({ staff_child_ratio: 3.5 })];
    const result = computeWorkforceMetrics(snapshots, [], []);
    expect(result.staff_child_ratio).toBe(3.5);
  });

  it("defaults staff_child_ratio to 0 with no snapshots", () => {
    const result = computeWorkforceMetrics([], [], []);
    expect(result.staff_child_ratio).toBe(0);
  });

  // ── meets_ratio ─────────────────────────────────────────────────────────

  it("returns meets_ratio from the latest snapshot", () => {
    const snapshots = [makeSnapshot({ meets_minimum_ratio: false })];
    const result = computeWorkforceMetrics(snapshots, [], []);
    expect(result.meets_ratio).toBe(false);
  });

  it("reports meets_ratio as not recorded with no snapshots", () => {
    const result = computeWorkforceMetrics([], [], []);
    expect(result.meets_ratio).toBe(null);
  });

  // ── open_vacancies ──────────────────────────────────────────────────────

  it("counts open vacancies (not filled or withdrawn)", () => {
    const vacancies = [
      makeVacancy({ status: "open" }),
      makeVacancy({ status: "advertised" }),
      makeVacancy({ status: "shortlisted" }),
      makeVacancy({ status: "interviewing" }),
      makeVacancy({ status: "offered" }),
      makeVacancy({ status: "filled" }),
      makeVacancy({ status: "withdrawn" }),
    ];
    const result = computeWorkforceMetrics([], vacancies, []);
    expect(result.open_vacancies).toBe(5);
  });

  it("returns 0 open_vacancies when all are filled", () => {
    const vacancies = [
      makeVacancy({ status: "filled" }),
      makeVacancy({ status: "withdrawn" }),
    ];
    const result = computeWorkforceMetrics([], vacancies, []);
    expect(result.open_vacancies).toBe(0);
  });

  // ── avg_time_to_fill ────────────────────────────────────────────────────

  it("computes avg_time_to_fill from filled vacancies with date_filled", () => {
    const vacancies = [
      makeVacancy({
        status: "filled",
        date_opened: "2026-03-01",
        date_filled: "2026-03-31",
      }),
      makeVacancy({
        status: "filled",
        date_opened: "2026-04-01",
        date_filled: "2026-04-11",
      }),
    ];
    // First: 30 days, Second: 10 days => avg = 20
    const result = computeWorkforceMetrics([], vacancies, []);
    expect(result.avg_time_to_fill).toBe(20);
  });

  it("returns 0 avg_time_to_fill when no filled vacancies exist", () => {
    const vacancies = [makeVacancy({ status: "open" })];
    const result = computeWorkforceMetrics([], vacancies, []);
    expect(result.avg_time_to_fill).toBe(0);
  });

  it("ignores filled vacancies without date_filled", () => {
    const vacancies = [
      makeVacancy({ status: "filled", date_filled: null }),
      makeVacancy({
        status: "filled",
        date_opened: "2026-04-01",
        date_filled: "2026-04-21",
      }),
    ];
    // Only the second has date_filled: 20 days
    const result = computeWorkforceMetrics([], vacancies, []);
    expect(result.avg_time_to_fill).toBe(20);
  });

  it("rounds avg_time_to_fill to nearest integer", () => {
    const vacancies = [
      makeVacancy({
        status: "filled",
        date_opened: "2026-04-01",
        date_filled: "2026-04-08",
      }),
      makeVacancy({
        status: "filled",
        date_opened: "2026-04-01",
        date_filled: "2026-04-06",
      }),
    ];
    // 7 + 5 = 12 / 2 = 6
    const result = computeWorkforceMetrics([], vacancies, []);
    expect(result.avg_time_to_fill).toBe(6);
  });

  // ── succession_coverage ─────────────────────────────────────────────────

  it("computes succession_coverage as (ready_now + ready_1_year) / total * 100", () => {
    const plans = [
      makeSuccessionPlan({ readiness: "ready_now" }),
      makeSuccessionPlan({ readiness: "ready_1_year" }),
      makeSuccessionPlan({ readiness: "ready_2_years" }),
      makeSuccessionPlan({ readiness: "development_needed" }),
    ];
    const result = computeWorkforceMetrics([], [], plans);
    expect(result.succession_coverage).toBe(50);
  });

  it("returns 0 succession_coverage with no plans", () => {
    const result = computeWorkforceMetrics([], [], []);
    expect(result.succession_coverage).toBeNull();;
  });

  it("rounds succession_coverage to 1 decimal place", () => {
    // 1 out of 3 => 33.333... => 33.3
    const plans = [
      makeSuccessionPlan({ readiness: "ready_now" }),
      makeSuccessionPlan({ readiness: "development_needed" }),
      makeSuccessionPlan({ readiness: "not_identified" }),
    ];
    const result = computeWorkforceMetrics([], [], plans);
    expect(result.succession_coverage).toBe(33.3);
  });

  it("returns 100 succession_coverage when all are covered", () => {
    const plans = [
      makeSuccessionPlan({ readiness: "ready_now" }),
      makeSuccessionPlan({ readiness: "ready_1_year" }),
    ];
    const result = computeWorkforceMetrics([], [], plans);
    expect(result.succession_coverage).toBe(100);
  });

  // ── roles_at_risk ───────────────────────────────────────────────────────

  it("counts roles_at_risk (not_identified + development_needed)", () => {
    const plans = [
      makeSuccessionPlan({ readiness: "ready_now" }),
      makeSuccessionPlan({ readiness: "not_identified" }),
      makeSuccessionPlan({ readiness: "development_needed" }),
      makeSuccessionPlan({ readiness: "ready_2_years" }),
    ];
    const result = computeWorkforceMetrics([], [], plans);
    expect(result.roles_at_risk).toBe(2);
  });

  it("returns 0 roles_at_risk when all are covered", () => {
    const plans = [
      makeSuccessionPlan({ readiness: "ready_now" }),
      makeSuccessionPlan({ readiness: "ready_1_year" }),
    ];
    const result = computeWorkforceMetrics([], [], plans);
    expect(result.roles_at_risk).toBe(0);
  });

  // ── by_role ─────────────────────────────────────────────────────────────

  it("groups open vacancies by role", () => {
    const vacancies = [
      makeVacancy({ role: "residential_care_worker", status: "open" }),
      makeVacancy({ role: "residential_care_worker", status: "advertised" }),
      makeVacancy({ role: "senior_rcw", status: "open" }),
      makeVacancy({ role: "waking_night", status: "filled" }),
    ];
    const result = computeWorkforceMetrics([], vacancies, []);
    expect(result.by_role).toEqual({
      residential_care_worker: 2,
      senior_rcw: 1,
    });
  });

  it("excludes filled and withdrawn vacancies from by_role", () => {
    const vacancies = [
      makeVacancy({ role: "agency", status: "filled" }),
      makeVacancy({ role: "admin", status: "withdrawn" }),
    ];
    const result = computeWorkforceMetrics([], vacancies, []);
    expect(result.by_role).toEqual({});
  });

  it("returns empty by_role with no vacancies", () => {
    const result = computeWorkforceMetrics([], [], []);
    expect(result.by_role).toEqual({});
  });

  // ── by_vacancy_status ───────────────────────────────────────────────────

  it("groups all vacancies by status", () => {
    const vacancies = [
      makeVacancy({ status: "open" }),
      makeVacancy({ status: "open" }),
      makeVacancy({ status: "filled" }),
      makeVacancy({ status: "withdrawn" }),
      makeVacancy({ status: "interviewing" }),
    ];
    const result = computeWorkforceMetrics([], vacancies, []);
    expect(result.by_vacancy_status).toEqual({
      open: 2,
      filled: 1,
      withdrawn: 1,
      interviewing: 1,
    });
  });

  it("includes filled and withdrawn in by_vacancy_status", () => {
    const vacancies = [
      makeVacancy({ status: "filled" }),
      makeVacancy({ status: "withdrawn" }),
    ];
    const result = computeWorkforceMetrics([], vacancies, []);
    expect(result.by_vacancy_status).toEqual({ filled: 1, withdrawn: 1 });
  });

  it("returns empty by_vacancy_status with no vacancies", () => {
    const result = computeWorkforceMetrics([], [], []);
    expect(result.by_vacancy_status).toEqual({});
  });

  // ── Snapshot sort order ─────────────────────────────────────────────────

  it("selects the most recent snapshot regardless of array order", () => {
    const snapshots = [
      makeSnapshot({ snapshot_date: "2026-01-01", established_posts: 10 }),
      makeSnapshot({ snapshot_date: "2026-06-01", established_posts: 30 }),
      makeSnapshot({ snapshot_date: "2026-03-01", established_posts: 20 }),
    ];
    const result = computeWorkforceMetrics(snapshots, [], []);
    expect(result.latest_established).toBe(30);
  });

  // ── Single item inputs ──────────────────────────────────────────────────

  it("handles a single snapshot correctly", () => {
    const snapshots = [
      makeSnapshot({
        established_posts: 10,
        filled_posts: 8,
        vacancies: 2,
        agency_staff: 2,
        staff_child_ratio: 2.0,
        meets_minimum_ratio: false,
      }),
    ];
    const result = computeWorkforceMetrics(snapshots, [], []);
    expect(result.latest_established).toBe(10);
    expect(result.latest_filled).toBe(8);
    expect(result.latest_vacancies).toBe(2);
    expect(result.vacancy_rate).toBe(20);
    expect(result.agency_count).toBe(2);
    expect(result.agency_rate).toBe(20);
    expect(result.staff_child_ratio).toBe(2.0);
    expect(result.meets_ratio).toBe(false);
  });

  it("handles a single vacancy correctly", () => {
    const vacancies = [makeVacancy({ status: "open", role: "admin" })];
    const result = computeWorkforceMetrics([], vacancies, []);
    expect(result.open_vacancies).toBe(1);
    expect(result.by_role).toEqual({ admin: 1 });
    expect(result.by_vacancy_status).toEqual({ open: 1 });
  });

  it("handles a single succession plan correctly", () => {
    const plans = [makeSuccessionPlan({ readiness: "not_identified" })];
    const result = computeWorkforceMetrics([], [], plans);
    expect(result.succession_coverage).toBe(0);
    expect(result.roles_at_risk).toBe(1);
  });

  // ── Combined inputs ─────────────────────────────────────────────────────

  it("returns all 14 fields with combined inputs", () => {
    const snapshots = [
      makeSnapshot({
        established_posts: 20,
        filled_posts: 17,
        vacancies: 3,
        agency_staff: 2,
        staff_child_ratio: 3.5,
        meets_minimum_ratio: true,
      }),
    ];
    const vacancies = [
      makeVacancy({ status: "open", role: "residential_care_worker" }),
      makeVacancy({
        status: "filled",
        date_opened: "2026-03-01",
        date_filled: "2026-03-21",
      }),
    ];
    const plans = [
      makeSuccessionPlan({ readiness: "ready_now" }),
      makeSuccessionPlan({ readiness: "not_identified" }),
    ];
    const result = computeWorkforceMetrics(snapshots, vacancies, plans);

    expect(result.latest_established).toBe(20);
    expect(result.latest_filled).toBe(17);
    expect(result.latest_vacancies).toBe(3);
    expect(result.vacancy_rate).toBe(15);
    expect(result.agency_count).toBe(2);
    expect(result.agency_rate).toBe(10.5);
    expect(result.staff_child_ratio).toBe(3.5);
    expect(result.meets_ratio).toBe(true);
    expect(result.open_vacancies).toBe(1);
    expect(result.avg_time_to_fill).toBe(20);
    expect(result.succession_coverage).toBe(50);
    expect(result.roles_at_risk).toBe(1);
    expect(result.by_role).toEqual({ residential_care_worker: 1 });
    expect(result.by_vacancy_status).toEqual({ open: 1, filled: 1 });
  });

  // ── Rounding edge cases ─────────────────────────────────────────────────

  it("handles vacancy_rate rounding for exact decimals", () => {
    // 1/7 * 100 = 14.2857... => 14.3
    const snapshots = [makeSnapshot({ established_posts: 7, vacancies: 1 })];
    const result = computeWorkforceMetrics(snapshots, [], []);
    expect(result.vacancy_rate).toBe(14.3);
  });

  it("handles agency_rate rounding for exact decimals", () => {
    // 1/(6+1) * 100 = 14.2857... => 14.3
    const snapshots = [makeSnapshot({ filled_posts: 6, agency_staff: 1 })];
    const result = computeWorkforceMetrics(snapshots, [], []);
    expect(result.agency_rate).toBe(14.3);
  });

  it("handles succession_coverage rounding for exact decimals", () => {
    // 2/7 * 100 = 28.5714... => 28.6
    const plans = [
      makeSuccessionPlan({ readiness: "ready_now" }),
      makeSuccessionPlan({ readiness: "ready_1_year" }),
      makeSuccessionPlan({ readiness: "development_needed" }),
      makeSuccessionPlan({ readiness: "development_needed" }),
      makeSuccessionPlan({ readiness: "not_identified" }),
      makeSuccessionPlan({ readiness: "not_identified" }),
      makeSuccessionPlan({ readiness: "ready_2_years" }),
    ];
    const result = computeWorkforceMetrics([], [], plans);
    expect(result.succession_coverage).toBe(28.6);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. identifyWorkforceAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyWorkforceAlerts", () => {
  const now = new Date("2026-05-13T12:00:00Z");

  // ── Empty inputs ────────────────────────────────────────────────────────

  it("returns no alerts for empty inputs", () => {
    const alerts = identifyWorkforceAlerts([], [], [], now);
    expect(alerts).toEqual([]);
  });

  // ── ratio_not_met ───────────────────────────────────────────────────────

  describe("ratio_not_met", () => {
    it("fires when latest snapshot meets_minimum_ratio is false", () => {
      const snapshots = [
        makeSnapshot({
          meets_minimum_ratio: false,
          staff_child_ratio: 1.5,
          vacancies: 3,
          agency_staff: 2,
        }),
      ];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      const alert = alerts.find((a) => a.type === "ratio_not_met");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("critical");
    });

    it("does not fire when meets_minimum_ratio is true", () => {
      const snapshots = [makeSnapshot({ meets_minimum_ratio: true })];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      expect(alerts.find((a) => a.type === "ratio_not_met")).toBeUndefined();
    });

    it("uses the latest snapshot for ratio check", () => {
      const snapshots = [
        makeSnapshot({ snapshot_date: "2026-04-01", meets_minimum_ratio: false }),
        makeSnapshot({ snapshot_date: "2026-05-01", meets_minimum_ratio: true }),
      ];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      expect(alerts.find((a) => a.type === "ratio_not_met")).toBeUndefined();
    });

    it("includes staff_child_ratio in the message", () => {
      const snapshots = [
        makeSnapshot({
          meets_minimum_ratio: false,
          staff_child_ratio: 1.2,
          vacancies: 2,
          agency_staff: 1,
        }),
      ];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      const alert = alerts.find((a) => a.type === "ratio_not_met");
      expect(alert!.message).toContain("1.2");
    });

    it("includes vacancy count in the message", () => {
      const snapshots = [
        makeSnapshot({
          meets_minimum_ratio: false,
          staff_child_ratio: 1.5,
          vacancies: 4,
          agency_staff: 1,
        }),
      ];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      const alert = alerts.find((a) => a.type === "ratio_not_met");
      expect(alert!.message).toContain("4 vacancies");
    });

    it("sets id to the snapshot id", () => {
      const snapshots = [
        makeSnapshot({
          id: "snap-abc",
          meets_minimum_ratio: false,
          staff_child_ratio: 1.5,
          vacancies: 2,
          agency_staff: 1,
        }),
      ];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      const alert = alerts.find((a) => a.type === "ratio_not_met");
      expect(alert!.id).toBe("snap-abc");
    });
  });

  // ── high_agency_usage ───────────────────────────────────────────────────

  describe("high_agency_usage", () => {
    it("fires when agency rate exceeds 15%", () => {
      // agency=4, filled=16, total=20, rate=20%
      const snapshots = [
        makeSnapshot({ filled_posts: 16, agency_staff: 4 }),
      ];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      const alert = alerts.find((a) => a.type === "high_agency_usage");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("high");
    });

    it("does not fire when agency rate is exactly 15%", () => {
      // agency=3, filled=17, total=20, rate=15%
      const snapshots = [
        makeSnapshot({ filled_posts: 17, agency_staff: 3 }),
      ];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      expect(alerts.find((a) => a.type === "high_agency_usage")).toBeUndefined();
    });

    it("does not fire when agency rate is below 15%", () => {
      // agency=1, filled=19, total=20, rate=5%
      const snapshots = [
        makeSnapshot({ filled_posts: 19, agency_staff: 1 }),
      ];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      expect(alerts.find((a) => a.type === "high_agency_usage")).toBeUndefined();
    });

    it("does not fire when no agency staff", () => {
      const snapshots = [
        makeSnapshot({ filled_posts: 18, agency_staff: 0 }),
      ];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      expect(alerts.find((a) => a.type === "high_agency_usage")).toBeUndefined();
    });

    it("does not fire when both filled and agency are 0", () => {
      const snapshots = [
        makeSnapshot({ filled_posts: 0, agency_staff: 0 }),
      ];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      expect(alerts.find((a) => a.type === "high_agency_usage")).toBeUndefined();
    });

    it("includes percentage in the message", () => {
      const snapshots = [
        makeSnapshot({ filled_posts: 16, agency_staff: 4 }),
      ];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      const alert = alerts.find((a) => a.type === "high_agency_usage");
      expect(alert!.message).toContain("20%");
    });
  });

  // ── long_vacancy ────────────────────────────────────────────────────────

  describe("long_vacancy", () => {
    it("fires critical for vacancies open > 60 days", () => {
      const vacancies = [
        makeVacancy({
          status: "open",
          title: "Senior RCW",
          date_opened: daysAgo(65, now),
        }),
      ];
      const alerts = identifyWorkforceAlerts([], vacancies, [], now);
      const alert = alerts.find((a) => a.type === "long_vacancy");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("critical");
    });

    it("fires high for vacancies open > 30 days but <= 60 days", () => {
      const vacancies = [
        makeVacancy({
          status: "open",
          title: "RCW",
          date_opened: daysAgo(45, now),
        }),
      ];
      const alerts = identifyWorkforceAlerts([], vacancies, [], now);
      const alert = alerts.find((a) => a.type === "long_vacancy");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("high");
    });

    it("does not fire for vacancies open <= 30 days", () => {
      const vacancies = [
        makeVacancy({
          status: "open",
          title: "RCW",
          date_opened: daysAgo(25, now),
        }),
      ];
      const alerts = identifyWorkforceAlerts([], vacancies, [], now);
      expect(alerts.find((a) => a.type === "long_vacancy")).toBeUndefined();
    });

    it("does not fire for filled vacancies regardless of age", () => {
      const vacancies = [
        makeVacancy({
          status: "filled",
          date_opened: daysAgo(90, now),
        }),
      ];
      const alerts = identifyWorkforceAlerts([], vacancies, [], now);
      expect(alerts.find((a) => a.type === "long_vacancy")).toBeUndefined();
    });

    it("does not fire for withdrawn vacancies regardless of age", () => {
      const vacancies = [
        makeVacancy({
          status: "withdrawn",
          date_opened: daysAgo(90, now),
        }),
      ];
      const alerts = identifyWorkforceAlerts([], vacancies, [], now);
      expect(alerts.find((a) => a.type === "long_vacancy")).toBeUndefined();
    });

    it("includes vacancy title in the message", () => {
      const vacancies = [
        makeVacancy({
          status: "open",
          title: "Deputy Manager",
          date_opened: daysAgo(40, now),
        }),
      ];
      const alerts = identifyWorkforceAlerts([], vacancies, [], now);
      const alert = alerts.find((a) => a.type === "long_vacancy");
      expect(alert!.message).toContain("Deputy Manager");
    });

    it("includes days count in the message", () => {
      const vacancies = [
        makeVacancy({
          status: "open",
          title: "Admin",
          date_opened: "2026-04-01",
        }),
      ];
      // From 2026-04-01 to 2026-05-13 = 42 days
      const alerts = identifyWorkforceAlerts([], vacancies, [], new Date("2026-05-13T00:00:00Z"));
      const alert = alerts.find((a) => a.type === "long_vacancy");
      expect(alert!.message).toContain("42 days");
    });

    it("creates separate alerts for multiple long vacancies", () => {
      const vacancies = [
        makeVacancy({
          id: "v1",
          status: "open",
          title: "RCW 1",
          date_opened: daysAgo(35, now),
        }),
        makeVacancy({
          id: "v2",
          status: "open",
          title: "RCW 2",
          date_opened: daysAgo(70, now),
        }),
      ];
      const alerts = identifyWorkforceAlerts([], vacancies, [], now);
      const longAlerts = alerts.filter((a) => a.type === "long_vacancy");
      expect(longAlerts).toHaveLength(2);
      expect(longAlerts.find((a) => a.severity === "critical")).toBeDefined();
      expect(longAlerts.find((a) => a.severity === "high")).toBeDefined();
    });

    it("fires for advertised vacancies open > 30 days", () => {
      const vacancies = [
        makeVacancy({
          status: "advertised",
          title: "Waking Night",
          date_opened: daysAgo(35, now),
        }),
      ];
      const alerts = identifyWorkforceAlerts([], vacancies, [], now);
      expect(alerts.find((a) => a.type === "long_vacancy")).toBeDefined();
    });

    it("sets id to the vacancy id", () => {
      const vacancies = [
        makeVacancy({
          id: "vac-xyz",
          status: "open",
          title: "RCW",
          date_opened: daysAgo(35, now),
        }),
      ];
      const alerts = identifyWorkforceAlerts([], vacancies, [], now);
      const alert = alerts.find((a) => a.type === "long_vacancy");
      expect(alert!.id).toBe("vac-xyz");
    });

    it("does not fire for exactly 30 days", () => {
      // Use midnight-aligned dates to avoid rounding issues
      const refNow = new Date("2026-05-13T00:00:00Z");
      const vacancies = [
        makeVacancy({
          status: "open",
          title: "RCW",
          date_opened: "2026-04-13", // exactly 30 days before
        }),
      ];
      const alerts = identifyWorkforceAlerts([], vacancies, [], refNow);
      expect(alerts.find((a) => a.type === "long_vacancy")).toBeUndefined();
    });

    it("fires high for exactly 31 days", () => {
      const refNow = new Date("2026-05-13T00:00:00Z");
      const vacancies = [
        makeVacancy({
          status: "open",
          title: "RCW",
          date_opened: "2026-04-12", // exactly 31 days before
        }),
      ];
      const alerts = identifyWorkforceAlerts([], vacancies, [], refNow);
      const alert = alerts.find((a) => a.type === "long_vacancy");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("high");
    });

    it("fires critical for exactly 61 days", () => {
      const refNow = new Date("2026-05-13T00:00:00Z");
      const vacancies = [
        makeVacancy({
          status: "open",
          title: "RCW",
          date_opened: "2026-03-13", // exactly 61 days before
        }),
      ];
      const alerts = identifyWorkforceAlerts([], vacancies, [], refNow);
      const alert = alerts.find((a) => a.type === "long_vacancy");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("critical");
    });
  });

  // ── succession_gap ──────────────────────────────────────────────────────

  describe("succession_gap", () => {
    it("fires for plans with readiness 'not_identified'", () => {
      const plans = [
        makeSuccessionPlan({
          readiness: "not_identified",
          role_title: "Registered Manager",
          current_holder: "Alice Smith",
          risk_if_vacant: "Regulatory non-compliance",
        }),
      ];
      const alerts = identifyWorkforceAlerts([], [], plans, now);
      const alert = alerts.find((a) => a.type === "succession_gap");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("high");
    });

    it("does not fire for 'ready_now' plans", () => {
      const plans = [makeSuccessionPlan({ readiness: "ready_now" })];
      const alerts = identifyWorkforceAlerts([], [], plans, now);
      expect(alerts.find((a) => a.type === "succession_gap")).toBeUndefined();
    });

    it("does not fire for 'ready_1_year' plans", () => {
      const plans = [makeSuccessionPlan({ readiness: "ready_1_year" })];
      const alerts = identifyWorkforceAlerts([], [], plans, now);
      expect(alerts.find((a) => a.type === "succession_gap")).toBeUndefined();
    });

    it("does not fire for 'ready_2_years' plans", () => {
      const plans = [makeSuccessionPlan({ readiness: "ready_2_years" })];
      const alerts = identifyWorkforceAlerts([], [], plans, now);
      expect(alerts.find((a) => a.type === "succession_gap")).toBeUndefined();
    });

    it("does not fire for 'development_needed' plans", () => {
      const plans = [makeSuccessionPlan({ readiness: "development_needed" })];
      const alerts = identifyWorkforceAlerts([], [], plans, now);
      expect(alerts.find((a) => a.type === "succession_gap")).toBeUndefined();
    });

    it("includes role_title in the message", () => {
      const plans = [
        makeSuccessionPlan({
          readiness: "not_identified",
          role_title: "Deputy Manager",
          current_holder: "Bob",
          risk_if_vacant: "Loss of leadership",
        }),
      ];
      const alerts = identifyWorkforceAlerts([], [], plans, now);
      const alert = alerts.find((a) => a.type === "succession_gap");
      expect(alert!.message).toContain("Deputy Manager");
    });

    it("includes current_holder in the message", () => {
      const plans = [
        makeSuccessionPlan({
          readiness: "not_identified",
          role_title: "RM",
          current_holder: "Carol Jones",
          risk_if_vacant: "Regulatory risk",
        }),
      ];
      const alerts = identifyWorkforceAlerts([], [], plans, now);
      const alert = alerts.find((a) => a.type === "succession_gap");
      expect(alert!.message).toContain("Carol Jones");
    });

    it("includes risk_if_vacant in the message", () => {
      const plans = [
        makeSuccessionPlan({
          readiness: "not_identified",
          role_title: "RM",
          current_holder: "Dan",
          risk_if_vacant: "Ofsted enforcement",
        }),
      ];
      const alerts = identifyWorkforceAlerts([], [], plans, now);
      const alert = alerts.find((a) => a.type === "succession_gap");
      expect(alert!.message).toContain("Ofsted enforcement");
    });

    it("creates separate alerts for multiple not_identified plans", () => {
      const plans = [
        makeSuccessionPlan({ id: "sp-1", readiness: "not_identified", role_title: "RM" }),
        makeSuccessionPlan({ id: "sp-2", readiness: "not_identified", role_title: "DM" }),
      ];
      const alerts = identifyWorkforceAlerts([], [], plans, now);
      const gapAlerts = alerts.filter((a) => a.type === "succession_gap");
      expect(gapAlerts).toHaveLength(2);
    });

    it("sets id to the succession plan id", () => {
      const plans = [
        makeSuccessionPlan({
          id: "sp-abc",
          readiness: "not_identified",
          role_title: "RM",
          current_holder: "Eve",
          risk_if_vacant: "Risk",
        }),
      ];
      const alerts = identifyWorkforceAlerts([], [], plans, now);
      const alert = alerts.find((a) => a.type === "succession_gap");
      expect(alert!.id).toBe("sp-abc");
    });
  });

  // ── high_sickness ───────────────────────────────────────────────────────

  describe("high_sickness", () => {
    it("fires when sickness rate exceeds 15%", () => {
      // 4/20 = 20%
      const snapshots = [
        makeSnapshot({ established_posts: 20, staff_on_sickness: 4 }),
      ];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      const alert = alerts.find((a) => a.type === "high_sickness");
      expect(alert).toBeDefined();
      expect(alert!.severity).toBe("high");
    });

    it("does not fire when sickness rate is exactly 15%", () => {
      // 3/20 = 15%
      const snapshots = [
        makeSnapshot({ established_posts: 20, staff_on_sickness: 3 }),
      ];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      expect(alerts.find((a) => a.type === "high_sickness")).toBeUndefined();
    });

    it("does not fire when sickness rate is below 15%", () => {
      // 2/20 = 10%
      const snapshots = [
        makeSnapshot({ established_posts: 20, staff_on_sickness: 2 }),
      ];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      expect(alerts.find((a) => a.type === "high_sickness")).toBeUndefined();
    });

    it("does not fire when staff_on_sickness is 0", () => {
      const snapshots = [
        makeSnapshot({ established_posts: 20, staff_on_sickness: 0 }),
      ];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      expect(alerts.find((a) => a.type === "high_sickness")).toBeUndefined();
    });

    it("does not fire when established_posts is 0", () => {
      const snapshots = [
        makeSnapshot({ established_posts: 0, staff_on_sickness: 1 }),
      ];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      expect(alerts.find((a) => a.type === "high_sickness")).toBeUndefined();
    });

    it("includes sickness count in the message", () => {
      const snapshots = [
        makeSnapshot({ established_posts: 20, staff_on_sickness: 5 }),
      ];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      const alert = alerts.find((a) => a.type === "high_sickness");
      expect(alert!.message).toContain("5 staff on sickness");
    });

    it("includes percentage in the message", () => {
      const snapshots = [
        makeSnapshot({ established_posts: 20, staff_on_sickness: 5 }),
      ];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      const alert = alerts.find((a) => a.type === "high_sickness");
      expect(alert!.message).toContain("25%");
    });

    it("sets id to the snapshot id", () => {
      const snapshots = [
        makeSnapshot({
          id: "snap-sick",
          established_posts: 20,
          staff_on_sickness: 5,
        }),
      ];
      const alerts = identifyWorkforceAlerts(snapshots, [], [], now);
      const alert = alerts.find((a) => a.type === "high_sickness");
      expect(alert!.id).toBe("snap-sick");
    });
  });

  // ── Severity escalation ─────────────────────────────────────────────────

  it("escalates long_vacancy from high to critical at 60 day boundary", () => {
    // Use midnight-aligned dates for exact day calculations
    const refNow = new Date("2026-05-13T00:00:00Z");
    const vacancies = [
      makeVacancy({
        id: "v-60",
        status: "open",
        title: "RCW boundary",
        date_opened: "2026-03-14", // exactly 60 days before => not > 60, so high
      }),
      makeVacancy({
        id: "v-61",
        status: "open",
        title: "RCW over",
        date_opened: "2026-03-13", // exactly 61 days before => > 60, so critical
      }),
    ];
    const alerts = identifyWorkforceAlerts([], vacancies, [], refNow);
    const longAlerts = alerts.filter((a) => a.type === "long_vacancy");
    expect(longAlerts).toHaveLength(2);
    const at60 = longAlerts.find((a) => a.id === "v-60");
    const at61 = longAlerts.find((a) => a.id === "v-61");
    expect(at60!.severity).toBe("high");
    expect(at61!.severity).toBe("critical");
  });

  // ── Multiple alert types concurrently ───────────────────────────────────

  it("can produce multiple alert types simultaneously", () => {
    const snapshots = [
      makeSnapshot({
        meets_minimum_ratio: false,
        staff_child_ratio: 1.0,
        filled_posts: 14,
        agency_staff: 6,
        vacancies: 3,
        established_posts: 20,
        staff_on_sickness: 5,
      }),
    ];
    const vacancies = [
      makeVacancy({
        status: "open",
        title: "Long running",
        date_opened: daysAgo(90, now),
      }),
    ];
    const plans = [
      makeSuccessionPlan({ readiness: "not_identified", role_title: "RM" }),
    ];
    const alerts = identifyWorkforceAlerts(snapshots, vacancies, plans, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("ratio_not_met");
    expect(types).toContain("high_agency_usage");
    expect(types).toContain("long_vacancy");
    expect(types).toContain("succession_gap");
    expect(types).toContain("high_sickness");
  });

  // ── now parameter defaults ──────────────────────────────────────────────

  it("defaults now parameter if not provided", () => {
    // This test just verifies no error is thrown when now is not passed
    const vacancies = [
      makeVacancy({
        status: "open",
        title: "RCW",
        date_opened: "2020-01-01",
      }),
    ];
    const alerts = identifyWorkforceAlerts([], vacancies, []);
    // Should produce a critical long_vacancy since 2020 was years ago
    const longAlert = alerts.find((a) => a.type === "long_vacancy");
    expect(longAlert).toBeDefined();
    expect(longAlert!.severity).toBe("critical");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── Snapshots ───────────────────────────────────────────────────────────

  describe("listSnapshots", () => {
    it("returns ok with empty array", async () => {
      const result = await listSnapshots("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok with empty array when filters provided", async () => {
      const result = await listSnapshots("home-1", {
        dateFrom: "2026-01-01",
        dateTo: "2026-12-31",
        limit: 10,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });
  });

  describe("createSnapshot", () => {
    it("returns error when Supabase disabled", async () => {
      const result = await createSnapshot({
        homeId: "home-1",
        snapshotDate: "2026-05-01",
        establishedPosts: 20,
        filledPosts: 18,
        vacancies: 2,
        agencyStaff: 1,
        bankStaff: 0,
        staffOnLeave: 1,
        staffOnSickness: 0,
        childrenInPlacement: 4,
        staffChildRatio: 4.5,
        meetsMinimumRatio: true,
        recordedBy: "user-1",
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ── Vacancies ───────────────────────────────────────────────────────────

  describe("listVacancies", () => {
    it("returns ok with empty array", async () => {
      const result = await listVacancies("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok with empty array when filters provided", async () => {
      const result = await listVacancies("home-1", {
        status: "open",
        role: "admin",
        limit: 5,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });
  });

  describe("createVacancy", () => {
    it("returns error when Supabase disabled", async () => {
      const result = await createVacancy({
        homeId: "home-1",
        role: "residential_care_worker",
        title: "RCW",
        dateOpened: "2026-04-01",
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("updateVacancy", () => {
    it("returns error when Supabase disabled", async () => {
      const result = await updateVacancy("v-1", { status: "filled" });
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ── Succession Plans ────────────────────────────────────────────────────

  describe("listSuccessionPlans", () => {
    it("returns ok with empty array", async () => {
      const result = await listSuccessionPlans("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok with empty array when filters provided", async () => {
      const result = await listSuccessionPlans("home-1", {
        readiness: "ready_now",
        limit: 10,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });
  });

  describe("createSuccessionPlan", () => {
    it("returns error when Supabase disabled", async () => {
      const result = await createSuccessionPlan({
        homeId: "home-1",
        criticalRole: "registered_manager",
        roleTitle: "Registered Manager",
        currentHolder: "Alice Smith",
        readiness: "ready_now",
        developmentActions: [],
        riskIfVacant: "High regulatory risk",
        lastReviewed: "2026-04-15",
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("updateSuccessionPlan", () => {
    it("returns error when Supabase disabled", async () => {
      const result = await updateSuccessionPlan("sp-1", {
        readiness: "ready_now",
      });
      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("handles a large number of vacancies without error", () => {
    const vacancies = Array.from({ length: 500 }, (_, i) =>
      makeVacancy({
        status: i % 2 === 0 ? "open" : "filled",
        role: i % 3 === 0 ? "senior_rcw" : "residential_care_worker",
        date_opened: "2026-01-01",
        date_filled: i % 2 === 1 ? "2026-02-01" : null,
      }),
    );
    const result = computeWorkforceMetrics([], vacancies, []);
    expect(result.open_vacancies).toBe(250);
    expect(result.avg_time_to_fill).toBe(31);
  });

  it("handles a large number of snapshots without error", () => {
    const snapshots = Array.from({ length: 365 }, (_, i) => {
      const d = new Date("2025-01-01");
      d.setDate(d.getDate() + i);
      return makeSnapshot({
        snapshot_date: d.toISOString().split("T")[0],
        established_posts: 20 + (i % 5),
      });
    });
    const result = computeWorkforceMetrics(snapshots, [], []);
    // The latest snapshot should be the one from the last day
    expect(result.latest_established).toBeGreaterThanOrEqual(20);
  });

  it("handles a large number of succession plans without error", () => {
    const readinessValues: SuccessionPlan["readiness"][] = [
      "ready_now",
      "ready_1_year",
      "ready_2_years",
      "development_needed",
      "not_identified",
    ];
    const plans = Array.from({ length: 100 }, (_, i) =>
      makeSuccessionPlan({
        readiness: readinessValues[i % 5],
      }),
    );
    const result = computeWorkforceMetrics([], [], plans);
    // 20 ready_now + 20 ready_1_year = 40 out of 100 = 40%
    expect(result.succession_coverage).toBe(40);
    // 20 not_identified + 20 development_needed = 40
    expect(result.roles_at_risk).toBe(40);
  });

  it("returns correct types for all metrics fields", () => {
    const result = computeWorkforceMetrics([], [], []);
    expect(typeof result.latest_established).toBe("number");
    expect(typeof result.latest_filled).toBe("number");
    expect(typeof result.latest_vacancies).toBe("number");
    expect(["number", "object"]).toContain(typeof result.vacancy_rate); // number | null
    expect(typeof result.agency_count).toBe("number");
    expect(["number", "object"]).toContain(typeof result.agency_rate); // number | null
    expect(typeof result.staff_child_ratio).toBe("number");
    expect(["boolean", "object"]).toContain(typeof result.meets_ratio); // boolean | null
    expect(typeof result.open_vacancies).toBe("number");
    expect(typeof result.avg_time_to_fill).toBe("number");
    expect(["number", "object"]).toContain(typeof result.succession_coverage); // number | null
    expect(typeof result.roles_at_risk).toBe("number");
    expect(typeof result.by_role).toBe("object");
    expect(typeof result.by_vacancy_status).toBe("object");
  });

  it("returns correct types for all alert fields", () => {
    const snapshots = [
      makeSnapshot({ meets_minimum_ratio: false, staff_child_ratio: 1.0, vacancies: 2, agency_staff: 1 }),
    ];
    const alerts = identifyWorkforceAlerts(snapshots, [], []);
    expect(alerts.length).toBeGreaterThan(0);
    for (const alert of alerts) {
      expect(typeof alert.type).toBe("string");
      expect(["critical", "high", "medium"]).toContain(alert.severity);
      expect(typeof alert.message).toBe("string");
      expect(typeof alert.id).toBe("string");
    }
  });

  it("handles snapshot with zero filled_posts for agency_rate", () => {
    // The service guards with `filled > 0`, so when filled_posts=0,
    // agency_rate returns 0 regardless of agency_staff count
    const snapshots = [makeSnapshot({ filled_posts: 0, agency_staff: 5 })];
    const result = computeWorkforceMetrics(snapshots, [], []);
    expect(result.agency_rate).toBeNull();;
  });

  it("handles vacancy opened and filled on the same day", () => {
    const vacancies = [
      makeVacancy({
        status: "filled",
        date_opened: "2026-04-01",
        date_filled: "2026-04-01",
      }),
    ];
    const result = computeWorkforceMetrics([], vacancies, []);
    expect(result.avg_time_to_fill).toBe(0);
  });

  it("does not include interviewing vacancies in by_role as excluded", () => {
    // interviewing is NOT filled or withdrawn, so it IS included
    const vacancies = [
      makeVacancy({ status: "interviewing", role: "team_leader" }),
    ];
    const result = computeWorkforceMetrics([], vacancies, []);
    expect(result.by_role).toEqual({ team_leader: 1 });
  });

  it("does not include offered vacancies in by_role as excluded", () => {
    // offered is NOT filled or withdrawn, so it IS included
    const vacancies = [
      makeVacancy({ status: "offered", role: "deputy_manager" }),
    ];
    const result = computeWorkforceMetrics([], vacancies, []);
    expect(result.by_role).toEqual({ deputy_manager: 1 });
  });

  it("handles all vacancy statuses correctly for open_vacancies count", () => {
    const statuses: VacancyRecord["status"][] = [
      "open",
      "advertised",
      "shortlisted",
      "interviewing",
      "offered",
      "filled",
      "withdrawn",
    ];
    const vacancies = statuses.map((status) => makeVacancy({ status }));
    const result = computeWorkforceMetrics([], vacancies, []);
    // filled + withdrawn are excluded = 5 open
    expect(result.open_vacancies).toBe(5);
  });

  it("handles succession plans with all the same readiness", () => {
    const plans = Array.from({ length: 5 }, () =>
      makeSuccessionPlan({ readiness: "ready_now" }),
    );
    const result = computeWorkforceMetrics([], [], plans);
    expect(result.succession_coverage).toBe(100);
    expect(result.roles_at_risk).toBe(0);
  });

  it("handles identifyWorkforceAlerts with no snapshot and only long vacancies", () => {
    const now = new Date("2026-05-13T12:00:00Z");
    const vacancies = [
      makeVacancy({
        status: "open",
        title: "RCW",
        date_opened: daysAgo(45, now),
      }),
    ];
    const alerts = identifyWorkforceAlerts([], vacancies, [], now);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe("long_vacancy");
  });

  it("agency_rate handles when filled is 0 but agency > 0", () => {
    // In alerts: total = 0 + 5 = 5, rate = 5/5 * 100 = 100%
    const snapshots = [
      makeSnapshot({ filled_posts: 0, agency_staff: 5 }),
    ];
    const alerts = identifyWorkforceAlerts(snapshots, [], []);
    const alert = alerts.find((a) => a.type === "high_agency_usage");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("high");
  });

  it("does not produce duplicate alerts for the same snapshot", () => {
    const snapshots = [
      makeSnapshot({
        id: "snap-1",
        meets_minimum_ratio: false,
        staff_child_ratio: 1.0,
        filled_posts: 14,
        agency_staff: 6,
        vacancies: 3,
        established_posts: 20,
        staff_on_sickness: 5,
      }),
    ];
    const alerts = identifyWorkforceAlerts(snapshots, [], []);
    // Should have ratio_not_met, high_agency_usage, high_sickness = 3 unique types
    const types = alerts.map((a) => a.type);
    expect(types.filter((t) => t === "ratio_not_met")).toHaveLength(1);
    expect(types.filter((t) => t === "high_agency_usage")).toHaveLength(1);
    expect(types.filter((t) => t === "high_sickness")).toHaveLength(1);
  });

  it("ready_2_years does not count towards succession_coverage", () => {
    const plans = [
      makeSuccessionPlan({ readiness: "ready_2_years" }),
    ];
    const result = computeWorkforceMetrics([], [], plans);
    expect(result.succession_coverage).toBe(0);
  });

  it("ready_2_years does not count towards roles_at_risk", () => {
    const plans = [
      makeSuccessionPlan({ readiness: "ready_2_years" }),
    ];
    const result = computeWorkforceMetrics([], [], plans);
    expect(result.roles_at_risk).toBe(0);
  });
});
