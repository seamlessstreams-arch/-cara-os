// ══════════════════════════════════════════════════════════════════════════════
// CARA — PROFESSIONAL DEVELOPMENT SERVICE TESTS
// Pure-function unit tests for CPD metrics computation, development alert
// identification, constant validation, and CRUD fallback behaviour.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeDevelopmentMetrics,
  identifyDevelopmentAlerts,
  CPD_CATEGORIES,
  CPD_METHODS,
  QUALIFICATION_STATUSES,
  DEVELOPMENT_GOAL_STATUSES,
  REGISTRATION_BODIES,
  listCpdRecords,
  createCpdRecord,
  listQualifications,
  createQualification,
  updateQualification,
  listGoals,
  createGoal,
  updateGoal,
} from "../professional-development-service";
import type {
  CpdRecord,
  QualificationRecord,
  DevelopmentGoal,
} from "../professional-development-service";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Fixed "now" for deterministic date tests. */
const NOW = new Date("2026-06-01T00:00:00Z");

function makeCpdRecord(overrides?: Partial<CpdRecord>): CpdRecord {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    staff_id: "staff-1",
    staff_name: "Alice Smith",
    category: "safeguarding",
    method: "course",
    title: "Safeguarding Level 3",
    description: "Annual safeguarding refresher",
    provider: "Training Co",
    date_completed: "2026-05-15",
    cpd_hours: 6,
    certificate_reference: null,
    learning_outcomes: ["Understand child protection procedures"],
    impact_on_practice: null,
    evidence_attached: false,
    verified_by: null,
    created_at: "2026-05-15T10:00:00Z",
    ...overrides,
  };
}

function makeQualification(overrides?: Partial<QualificationRecord>): QualificationRecord {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    staff_id: "staff-1",
    staff_name: "Alice Smith",
    qualification_name: "Level 3 Diploma",
    awarding_body: "CACHE",
    level: "3",
    status: "achieved",
    date_achieved: "2025-01-15",
    expiry_date: null,
    registration_number: null,
    registration_body: null,
    mandatory: false,
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-01-15T10:00:00Z",
    ...overrides,
  };
}

function makeGoal(overrides?: Partial<DevelopmentGoal>): DevelopmentGoal {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    staff_id: "staff-1",
    staff_name: "Alice Smith",
    goal: "Complete Level 5 Leadership",
    rationale: "Career development",
    target_date: "2026-12-31",
    status: "in_progress",
    progress_notes: [],
    linked_cpd_ids: [],
    date_completed: null,
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
    ...overrides,
  };
}

/** Helper to produce a date string N days before NOW. */
function daysAgo(n: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Helper to produce a date string N days after NOW. */
function daysFromNow(n: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. Constants
// ══════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  describe("CPD_CATEGORIES", () => {
    it("has exactly 16 items", () => {
      expect(CPD_CATEGORIES).toHaveLength(16);
    });

    it("has unique category values", () => {
      const values = CPD_CATEGORIES.map((c) => c.category);
      expect(new Set(values).size).toBe(values.length);
    });

    it("contains safeguarding", () => {
      expect(CPD_CATEGORIES.find((c) => c.category === "safeguarding")).toBeDefined();
    });

    it("contains therapeutic_care", () => {
      expect(CPD_CATEGORIES.find((c) => c.category === "therapeutic_care")).toBeDefined();
    });

    it("contains behaviour_management", () => {
      expect(CPD_CATEGORIES.find((c) => c.category === "behaviour_management")).toBeDefined();
    });

    it("contains medication", () => {
      expect(CPD_CATEGORIES.find((c) => c.category === "medication")).toBeDefined();
    });

    it("contains health_safety", () => {
      expect(CPD_CATEGORIES.find((c) => c.category === "health_safety")).toBeDefined();
    });

    it("contains first_aid", () => {
      expect(CPD_CATEGORIES.find((c) => c.category === "first_aid")).toBeDefined();
    });

    it("contains mental_health", () => {
      expect(CPD_CATEGORIES.find((c) => c.category === "mental_health")).toBeDefined();
    });

    it("contains other", () => {
      expect(CPD_CATEGORIES.find((c) => c.category === "other")).toBeDefined();
    });

    it("every item has a non-empty label", () => {
      for (const item of CPD_CATEGORIES) {
        expect(item.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("CPD_METHODS", () => {
    it("has exactly 12 items", () => {
      expect(CPD_METHODS).toHaveLength(12);
    });

    it("has unique method values", () => {
      const values = CPD_METHODS.map((m) => m.method);
      expect(new Set(values).size).toBe(values.length);
    });

    it("contains course", () => {
      expect(CPD_METHODS.find((m) => m.method === "course")).toBeDefined();
    });

    it("contains e_learning", () => {
      expect(CPD_METHODS.find((m) => m.method === "e_learning")).toBeDefined();
    });

    it("contains reflective_practice", () => {
      expect(CPD_METHODS.find((m) => m.method === "reflective_practice")).toBeDefined();
    });

    it("contains qualification", () => {
      expect(CPD_METHODS.find((m) => m.method === "qualification")).toBeDefined();
    });

    it("contains other", () => {
      expect(CPD_METHODS.find((m) => m.method === "other")).toBeDefined();
    });

    it("every item has a non-empty label", () => {
      for (const item of CPD_METHODS) {
        expect(item.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("QUALIFICATION_STATUSES", () => {
    it("has exactly 5 items", () => {
      expect(QUALIFICATION_STATUSES).toHaveLength(5);
    });

    it("has unique status values", () => {
      const values = QUALIFICATION_STATUSES.map((s) => s.status);
      expect(new Set(values).size).toBe(values.length);
    });

    it("contains achieved", () => {
      expect(QUALIFICATION_STATUSES.find((s) => s.status === "achieved")).toBeDefined();
    });

    it("contains in_progress", () => {
      expect(QUALIFICATION_STATUSES.find((s) => s.status === "in_progress")).toBeDefined();
    });

    it("contains expired", () => {
      expect(QUALIFICATION_STATUSES.find((s) => s.status === "expired")).toBeDefined();
    });

    it("contains planned", () => {
      expect(QUALIFICATION_STATUSES.find((s) => s.status === "planned")).toBeDefined();
    });

    it("contains not_started", () => {
      expect(QUALIFICATION_STATUSES.find((s) => s.status === "not_started")).toBeDefined();
    });

    it("every item has a non-empty label", () => {
      for (const item of QUALIFICATION_STATUSES) {
        expect(item.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("DEVELOPMENT_GOAL_STATUSES", () => {
    it("has exactly 5 items", () => {
      expect(DEVELOPMENT_GOAL_STATUSES).toHaveLength(5);
    });

    it("has unique status values", () => {
      const values = DEVELOPMENT_GOAL_STATUSES.map((s) => s.status);
      expect(new Set(values).size).toBe(values.length);
    });

    it("contains not_started", () => {
      expect(DEVELOPMENT_GOAL_STATUSES.find((s) => s.status === "not_started")).toBeDefined();
    });

    it("contains in_progress", () => {
      expect(DEVELOPMENT_GOAL_STATUSES.find((s) => s.status === "in_progress")).toBeDefined();
    });

    it("contains completed", () => {
      expect(DEVELOPMENT_GOAL_STATUSES.find((s) => s.status === "completed")).toBeDefined();
    });

    it("contains deferred", () => {
      expect(DEVELOPMENT_GOAL_STATUSES.find((s) => s.status === "deferred")).toBeDefined();
    });

    it("contains cancelled", () => {
      expect(DEVELOPMENT_GOAL_STATUSES.find((s) => s.status === "cancelled")).toBeDefined();
    });

    it("every item has a non-empty label", () => {
      for (const item of DEVELOPMENT_GOAL_STATUSES) {
        expect(item.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("REGISTRATION_BODIES", () => {
    it("has exactly 6 items", () => {
      expect(REGISTRATION_BODIES).toHaveLength(6);
    });

    it("has unique body values", () => {
      const values = REGISTRATION_BODIES.map((b) => b.body);
      expect(new Set(values).size).toBe(values.length);
    });

    it("contains social_work_england", () => {
      expect(REGISTRATION_BODIES.find((b) => b.body === "social_work_england")).toBeDefined();
    });

    it("contains ofsted", () => {
      expect(REGISTRATION_BODIES.find((b) => b.body === "ofsted")).toBeDefined();
    });

    it("contains dbs", () => {
      expect(REGISTRATION_BODIES.find((b) => b.body === "dbs")).toBeDefined();
    });

    it("contains hcpc", () => {
      expect(REGISTRATION_BODIES.find((b) => b.body === "hcpc")).toBeDefined();
    });

    it("contains nmc", () => {
      expect(REGISTRATION_BODIES.find((b) => b.body === "nmc")).toBeDefined();
    });

    it("contains other", () => {
      expect(REGISTRATION_BODIES.find((b) => b.body === "other")).toBeDefined();
    });

    it("every item has a non-empty label", () => {
      for (const item of REGISTRATION_BODIES) {
        expect(item.label.length).toBeGreaterThan(0);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeDevelopmentMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeDevelopmentMetrics", () => {
  // ── Empty inputs ───────────────────────────────────────────────────────

  it("returns all zeros for empty inputs", () => {
    const m = computeDevelopmentMetrics([], [], [], 0, NOW);
    expect(m.total_cpd_records).toBe(0);
    expect(m.total_cpd_hours).toBe(0);
    expect(m.avg_cpd_hours_per_staff).toBeNull();;
    expect(m.cpd_this_quarter).toBe(0);
    expect(m.cpd_hours_this_quarter).toBe(0);
    expect(m.staff_with_cpd).toBe(0);
    expect(m.qualifications_achieved).toBe(0);
    expect(m.qualifications_in_progress).toBe(0);
    expect(m.qualifications_expired).toBe(0);
    expect(m.qualifications_expiring_soon).toBe(0);
    expect(m.goals_completed).toBe(0);
    expect(m.goals_in_progress).toBe(0);
    expect(m.goals_overdue).toBe(0);
    expect(m.by_category).toEqual({});
    expect(m.by_method).toEqual({});
  });

  // ── total_cpd_records ──────────────────────────────────────────────────

  it("counts total CPD records", () => {
    const records = [makeCpdRecord(), makeCpdRecord(), makeCpdRecord()];
    const m = computeDevelopmentMetrics(records, [], [], 5, NOW);
    expect(m.total_cpd_records).toBe(3);
  });

  // ── total_cpd_hours ────────────────────────────────────────────────────

  it("sums total CPD hours across all records", () => {
    const records = [
      makeCpdRecord({ cpd_hours: 4 }),
      makeCpdRecord({ cpd_hours: 8 }),
      makeCpdRecord({ cpd_hours: 2.5 }),
    ];
    const m = computeDevelopmentMetrics(records, [], [], 5, NOW);
    expect(m.total_cpd_hours).toBe(14.5);
  });

  // ── avg_cpd_hours_per_staff ────────────────────────────────────────────

  it("computes average CPD hours per staff rounded to 1 decimal", () => {
    const records = [
      makeCpdRecord({ cpd_hours: 10 }),
      makeCpdRecord({ cpd_hours: 7 }),
    ];
    // total = 17, staff = 3 => 17/3 = 5.666... => 5.7
    const m = computeDevelopmentMetrics(records, [], [], 3, NOW);
    expect(m.avg_cpd_hours_per_staff).toBe(5.7);
  });

  it("returns 0 for avg when totalStaff is 0", () => {
    const records = [makeCpdRecord({ cpd_hours: 10 })];
    const m = computeDevelopmentMetrics(records, [], [], 0, NOW);
    expect(m.avg_cpd_hours_per_staff).toBeNull();;
  });

  it("rounds average correctly for 1 decimal place", () => {
    // 10 / 7 = 1.42857... => 1.4
    const records = [makeCpdRecord({ cpd_hours: 10 })];
    const m = computeDevelopmentMetrics(records, [], [], 7, NOW);
    expect(m.avg_cpd_hours_per_staff).toBe(1.4);
  });

  it("rounds .x5 values correctly", () => {
    // 5 / 4 = 1.25 => 1.3 (banker's rounding with Math.round)
    const records = [makeCpdRecord({ cpd_hours: 5 })];
    const m = computeDevelopmentMetrics(records, [], [], 4, NOW);
    expect(m.avg_cpd_hours_per_staff).toBe(1.3);
  });

  // ── cpd_this_quarter (90 days) ─────────────────────────────────────────

  it("counts CPD records from the last 90 days", () => {
    const records = [
      makeCpdRecord({ date_completed: daysAgo(10) }),
      makeCpdRecord({ date_completed: daysAgo(89) }),
      makeCpdRecord({ date_completed: daysAgo(91) }), // outside
    ];
    const m = computeDevelopmentMetrics(records, [], [], 5, NOW);
    expect(m.cpd_this_quarter).toBe(2);
  });

  it("includes record from 89 days ago (within 90-day window)", () => {
    const records = [makeCpdRecord({ date_completed: daysAgo(89) })];
    const m = computeDevelopmentMetrics(records, [], [], 5, NOW);
    expect(m.cpd_this_quarter).toBe(1);
  });

  it("excludes CPD record dated in the future", () => {
    const records = [makeCpdRecord({ date_completed: daysFromNow(1) })];
    const m = computeDevelopmentMetrics(records, [], [], 5, NOW);
    expect(m.cpd_this_quarter).toBe(0);
  });

  // ── cpd_hours_this_quarter ─────────────────────────────────────────────

  it("sums CPD hours only for records in last 90 days", () => {
    const records = [
      makeCpdRecord({ date_completed: daysAgo(5), cpd_hours: 8 }),
      makeCpdRecord({ date_completed: daysAgo(100), cpd_hours: 4 }),
    ];
    const m = computeDevelopmentMetrics(records, [], [], 5, NOW);
    expect(m.cpd_hours_this_quarter).toBe(8);
  });

  // ── staff_with_cpd ─────────────────────────────────────────────────────

  it("counts unique staff IDs across all CPD records", () => {
    const records = [
      makeCpdRecord({ staff_id: "s1" }),
      makeCpdRecord({ staff_id: "s1" }),
      makeCpdRecord({ staff_id: "s2" }),
      makeCpdRecord({ staff_id: "s3" }),
    ];
    const m = computeDevelopmentMetrics(records, [], [], 5, NOW);
    expect(m.staff_with_cpd).toBe(3);
  });

  it("returns 0 staff_with_cpd when no records", () => {
    const m = computeDevelopmentMetrics([], [], [], 5, NOW);
    expect(m.staff_with_cpd).toBe(0);
  });

  // ── qualifications_achieved ────────────────────────────────────────────

  it("counts qualifications with achieved status", () => {
    const quals = [
      makeQualification({ status: "achieved" }),
      makeQualification({ status: "achieved" }),
      makeQualification({ status: "in_progress" }),
    ];
    const m = computeDevelopmentMetrics([], quals, [], 5, NOW);
    expect(m.qualifications_achieved).toBe(2);
  });

  // ── qualifications_in_progress ─────────────────────────────────────────

  it("counts qualifications with in_progress status", () => {
    const quals = [
      makeQualification({ status: "in_progress" }),
      makeQualification({ status: "achieved" }),
    ];
    const m = computeDevelopmentMetrics([], quals, [], 5, NOW);
    expect(m.qualifications_in_progress).toBe(1);
  });

  // ── qualifications_expired ─────────────────────────────────────────────

  it("counts qualifications with expired status", () => {
    const quals = [
      makeQualification({ status: "expired" }),
      makeQualification({ status: "expired" }),
      makeQualification({ status: "achieved" }),
    ];
    const m = computeDevelopmentMetrics([], quals, [], 5, NOW);
    expect(m.qualifications_expired).toBe(2);
  });

  // ── qualifications_expiring_soon ───────────────────────────────────────

  it("counts achieved qualifications expiring within 30 days", () => {
    const quals = [
      makeQualification({ status: "achieved", expiry_date: daysFromNow(15) }),
      makeQualification({ status: "achieved", expiry_date: daysFromNow(29) }),
    ];
    const m = computeDevelopmentMetrics([], quals, [], 5, NOW);
    expect(m.qualifications_expiring_soon).toBe(2);
  });

  it("includes qualification expiring on exactly day 30", () => {
    const quals = [
      makeQualification({ status: "achieved", expiry_date: daysFromNow(30) }),
    ];
    const m = computeDevelopmentMetrics([], quals, [], 5, NOW);
    expect(m.qualifications_expiring_soon).toBe(1);
  });

  it("excludes qualification expiring on day 31", () => {
    const quals = [
      makeQualification({ status: "achieved", expiry_date: daysFromNow(31) }),
    ];
    const m = computeDevelopmentMetrics([], quals, [], 5, NOW);
    expect(m.qualifications_expiring_soon).toBe(0);
  });

  it("excludes already-expired qualifications from expiring_soon", () => {
    const quals = [
      makeQualification({ status: "achieved", expiry_date: daysAgo(1) }),
    ];
    const m = computeDevelopmentMetrics([], quals, [], 5, NOW);
    expect(m.qualifications_expiring_soon).toBe(0);
  });

  it("excludes non-achieved qualifications from expiring_soon", () => {
    const quals = [
      makeQualification({ status: "in_progress", expiry_date: daysFromNow(10) }),
    ];
    const m = computeDevelopmentMetrics([], quals, [], 5, NOW);
    expect(m.qualifications_expiring_soon).toBe(0);
  });

  it("excludes qualifications with no expiry_date from expiring_soon", () => {
    const quals = [
      makeQualification({ status: "achieved", expiry_date: null }),
    ];
    const m = computeDevelopmentMetrics([], quals, [], 5, NOW);
    expect(m.qualifications_expiring_soon).toBe(0);
  });

  // ── goals_completed ────────────────────────────────────────────────────

  it("counts goals with completed status", () => {
    const goals = [
      makeGoal({ status: "completed" }),
      makeGoal({ status: "completed" }),
      makeGoal({ status: "in_progress" }),
    ];
    const m = computeDevelopmentMetrics([], [], goals, 5, NOW);
    expect(m.goals_completed).toBe(2);
  });

  // ── goals_in_progress ──────────────────────────────────────────────────

  it("counts goals with in_progress status", () => {
    const goals = [
      makeGoal({ status: "in_progress" }),
      makeGoal({ status: "not_started" }),
    ];
    const m = computeDevelopmentMetrics([], [], goals, 5, NOW);
    expect(m.goals_in_progress).toBe(1);
  });

  // ── goals_overdue ──────────────────────────────────────────────────────

  it("counts not_started goals past target_date as overdue", () => {
    const goals = [
      makeGoal({ status: "not_started", target_date: daysAgo(5) }),
    ];
    const m = computeDevelopmentMetrics([], [], goals, 5, NOW);
    expect(m.goals_overdue).toBe(1);
  });

  it("counts in_progress goals past target_date as overdue", () => {
    const goals = [
      makeGoal({ status: "in_progress", target_date: daysAgo(10) }),
    ];
    const m = computeDevelopmentMetrics([], [], goals, 5, NOW);
    expect(m.goals_overdue).toBe(1);
  });

  it("does not count completed goals as overdue even if past target_date", () => {
    const goals = [
      makeGoal({ status: "completed", target_date: daysAgo(10) }),
    ];
    const m = computeDevelopmentMetrics([], [], goals, 5, NOW);
    expect(m.goals_overdue).toBe(0);
  });

  it("does not count deferred goals as overdue", () => {
    const goals = [
      makeGoal({ status: "deferred", target_date: daysAgo(10) }),
    ];
    const m = computeDevelopmentMetrics([], [], goals, 5, NOW);
    expect(m.goals_overdue).toBe(0);
  });

  it("does not count cancelled goals as overdue", () => {
    const goals = [
      makeGoal({ status: "cancelled", target_date: daysAgo(10) }),
    ];
    const m = computeDevelopmentMetrics([], [], goals, 5, NOW);
    expect(m.goals_overdue).toBe(0);
  });

  it("does not count in_progress goals with future target_date as overdue", () => {
    const goals = [
      makeGoal({ status: "in_progress", target_date: daysFromNow(30) }),
    ];
    const m = computeDevelopmentMetrics([], [], goals, 5, NOW);
    expect(m.goals_overdue).toBe(0);
  });

  // ── by_category ────────────────────────────────────────────────────────

  it("groups CPD records by category", () => {
    const records = [
      makeCpdRecord({ category: "safeguarding" }),
      makeCpdRecord({ category: "safeguarding" }),
      makeCpdRecord({ category: "first_aid" }),
    ];
    const m = computeDevelopmentMetrics(records, [], [], 5, NOW);
    expect(m.by_category).toEqual({ safeguarding: 2, first_aid: 1 });
  });

  it("returns empty by_category for no records", () => {
    const m = computeDevelopmentMetrics([], [], [], 5, NOW);
    expect(m.by_category).toEqual({});
  });

  // ── by_method ──────────────────────────────────────────────────────────

  it("groups CPD records by method", () => {
    const records = [
      makeCpdRecord({ method: "course" }),
      makeCpdRecord({ method: "e_learning" }),
      makeCpdRecord({ method: "e_learning" }),
    ];
    const m = computeDevelopmentMetrics(records, [], [], 5, NOW);
    expect(m.by_method).toEqual({ course: 1, e_learning: 2 });
  });

  it("returns empty by_method for no records", () => {
    const m = computeDevelopmentMetrics([], [], [], 5, NOW);
    expect(m.by_method).toEqual({});
  });

  // ── Combined / integration ─────────────────────────────────────────────

  it("handles a combined scenario with all input types", () => {
    const records = [
      makeCpdRecord({ staff_id: "s1", cpd_hours: 4, date_completed: daysAgo(10), category: "safeguarding", method: "course" }),
      makeCpdRecord({ staff_id: "s2", cpd_hours: 8, date_completed: daysAgo(100), category: "first_aid", method: "workshop" }),
    ];
    const quals = [
      makeQualification({ status: "achieved" }),
      makeQualification({ status: "in_progress" }),
      makeQualification({ status: "expired" }),
    ];
    const goals = [
      makeGoal({ status: "completed" }),
      makeGoal({ status: "in_progress", target_date: daysAgo(5) }),
    ];
    const m = computeDevelopmentMetrics(records, quals, goals, 10, NOW);

    expect(m.total_cpd_records).toBe(2);
    expect(m.total_cpd_hours).toBe(12);
    expect(m.avg_cpd_hours_per_staff).toBe(1.2);
    expect(m.cpd_this_quarter).toBe(1);
    expect(m.cpd_hours_this_quarter).toBe(4);
    expect(m.staff_with_cpd).toBe(2);
    expect(m.qualifications_achieved).toBe(1);
    expect(m.qualifications_in_progress).toBe(1);
    expect(m.qualifications_expired).toBe(1);
    expect(m.goals_completed).toBe(1);
    expect(m.goals_in_progress).toBe(1);
    expect(m.goals_overdue).toBe(1);
  });

  it("returns all 15 fields in the result object", () => {
    const m = computeDevelopmentMetrics([], [], [], 0, NOW);
    const keys = Object.keys(m);
    expect(keys).toContain("total_cpd_records");
    expect(keys).toContain("total_cpd_hours");
    expect(keys).toContain("avg_cpd_hours_per_staff");
    expect(keys).toContain("cpd_this_quarter");
    expect(keys).toContain("cpd_hours_this_quarter");
    expect(keys).toContain("staff_with_cpd");
    expect(keys).toContain("qualifications_achieved");
    expect(keys).toContain("qualifications_in_progress");
    expect(keys).toContain("qualifications_expired");
    expect(keys).toContain("qualifications_expiring_soon");
    expect(keys).toContain("goals_completed");
    expect(keys).toContain("goals_in_progress");
    expect(keys).toContain("goals_overdue");
    expect(keys).toContain("by_category");
    expect(keys).toContain("by_method");
    expect(keys).toHaveLength(15);
  });

  it("single CPD record produces correct metrics", () => {
    const records = [makeCpdRecord({ cpd_hours: 6, date_completed: daysAgo(5), staff_id: "s1" })];
    const m = computeDevelopmentMetrics(records, [], [], 1, NOW);
    expect(m.total_cpd_records).toBe(1);
    expect(m.total_cpd_hours).toBe(6);
    expect(m.avg_cpd_hours_per_staff).toBe(6);
    expect(m.cpd_this_quarter).toBe(1);
    expect(m.cpd_hours_this_quarter).toBe(6);
    expect(m.staff_with_cpd).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. identifyDevelopmentAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyDevelopmentAlerts", () => {
  // ── qualification_expired ──────────────────────────────────────────────

  it("generates critical alert for expired qualification", () => {
    const quals = [makeQualification({ status: "expired", staff_name: "Bob", qualification_name: "First Aid" })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    const expired = alerts.filter((a) => a.type === "qualification_expired");
    expect(expired).toHaveLength(1);
    expect(expired[0].severity).toBe("critical");
  });

  it("includes staff name in expired qualification message", () => {
    const quals = [makeQualification({ status: "expired", staff_name: "Bob Jones" })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    expect(alerts[0].message).toContain("Bob Jones");
  });

  it("includes qualification name in expired message", () => {
    const quals = [makeQualification({ status: "expired", qualification_name: "Safeguarding L3" })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    expect(alerts[0].message).toContain("Safeguarding L3");
  });

  it("includes mandatory note in expired message when mandatory", () => {
    const quals = [makeQualification({ status: "expired", mandatory: true })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    expect(alerts[0].message).toContain("mandatory");
  });

  it("does not include mandatory note for non-mandatory expired qualification", () => {
    const quals = [makeQualification({ status: "expired", mandatory: false })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    expect(alerts[0].message).not.toContain("mandatory");
  });

  it("generates multiple expired alerts for multiple expired qualifications", () => {
    const quals = [
      makeQualification({ status: "expired" }),
      makeQualification({ status: "expired" }),
    ];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    const expired = alerts.filter((a) => a.type === "qualification_expired");
    expect(expired).toHaveLength(2);
  });

  it("sets alert id to the qualification id for expired alerts", () => {
    const qId = crypto.randomUUID();
    const quals = [makeQualification({ id: qId, status: "expired" })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    expect(alerts[0].id).toBe(qId);
  });

  // ── qualification_expiring ─────────────────────────────────────────────

  it("generates high alert for qualification expiring within 30 days", () => {
    const quals = [makeQualification({ status: "achieved", expiry_date: daysFromNow(15) })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    const expiring = alerts.filter((a) => a.type === "qualification_expiring");
    expect(expiring).toHaveLength(1);
    expect(expiring[0].severity).toBe("high");
  });

  it("includes expiry_date in expiring message", () => {
    const expiryDate = daysFromNow(10);
    const quals = [makeQualification({ status: "achieved", expiry_date: expiryDate })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    const expiring = alerts.find((a) => a.type === "qualification_expiring");
    expect(expiring!.message).toContain(expiryDate);
  });

  it("includes staff name and qualification name in expiring message", () => {
    const quals = [makeQualification({
      status: "achieved",
      expiry_date: daysFromNow(10),
      staff_name: "Carol",
      qualification_name: "DBS Enhanced",
    })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    const expiring = alerts.find((a) => a.type === "qualification_expiring");
    expect(expiring!.message).toContain("Carol");
    expect(expiring!.message).toContain("DBS Enhanced");
  });

  it("does not generate expiring alert for qualification expiring in 31 days", () => {
    const quals = [makeQualification({ status: "achieved", expiry_date: daysFromNow(31) })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    expect(alerts.filter((a) => a.type === "qualification_expiring")).toHaveLength(0);
  });

  it("does not generate expiring alert for already expired qualification", () => {
    const quals = [makeQualification({ status: "achieved", expiry_date: daysAgo(1) })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    expect(alerts.filter((a) => a.type === "qualification_expiring")).toHaveLength(0);
  });

  it("does not generate expiring alert for in_progress qualification", () => {
    const quals = [makeQualification({ status: "in_progress", expiry_date: daysFromNow(10) })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    expect(alerts.filter((a) => a.type === "qualification_expiring")).toHaveLength(0);
  });

  // ── mandatory_not_started ──────────────────────────────────────────────

  it("generates high alert for mandatory qualification not achieved or in_progress", () => {
    const quals = [makeQualification({ mandatory: true, status: "not_started" })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    const mandatory = alerts.filter((a) => a.type === "mandatory_not_started");
    expect(mandatory).toHaveLength(1);
    expect(mandatory[0].severity).toBe("high");
  });

  it("generates mandatory_not_started for planned mandatory qualification", () => {
    const quals = [makeQualification({ mandatory: true, status: "planned" })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    expect(alerts.filter((a) => a.type === "mandatory_not_started")).toHaveLength(1);
  });

  it("generates mandatory_not_started for expired mandatory qualification", () => {
    const quals = [makeQualification({ mandatory: true, status: "expired" })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    expect(alerts.filter((a) => a.type === "mandatory_not_started")).toHaveLength(1);
  });

  it("does not generate mandatory_not_started when achieved", () => {
    const quals = [makeQualification({ mandatory: true, status: "achieved" })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    expect(alerts.filter((a) => a.type === "mandatory_not_started")).toHaveLength(0);
  });

  it("does not generate mandatory_not_started when in_progress", () => {
    const quals = [makeQualification({ mandatory: true, status: "in_progress" })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    expect(alerts.filter((a) => a.type === "mandatory_not_started")).toHaveLength(0);
  });

  it("does not generate mandatory_not_started for non-mandatory qualifications", () => {
    const quals = [makeQualification({ mandatory: false, status: "not_started" })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    expect(alerts.filter((a) => a.type === "mandatory_not_started")).toHaveLength(0);
  });

  it("includes staff name in mandatory_not_started message", () => {
    const quals = [makeQualification({ mandatory: true, status: "not_started", staff_name: "Dave" })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    expect(alerts.find((a) => a.type === "mandatory_not_started")!.message).toContain("Dave");
  });

  it("includes qualification name in mandatory_not_started message", () => {
    const quals = [makeQualification({ mandatory: true, status: "not_started", qualification_name: "First Aid" })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    expect(alerts.find((a) => a.type === "mandatory_not_started")!.message).toContain("First Aid");
  });

  // ── goal_overdue ───────────────────────────────────────────────────────

  it("generates medium alert for overdue not_started goal", () => {
    const goals = [makeGoal({ status: "not_started", target_date: daysAgo(5) })];
    const alerts = identifyDevelopmentAlerts([], [], goals, 5, NOW);
    const overdue = alerts.filter((a) => a.type === "goal_overdue");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].severity).toBe("medium");
  });

  it("generates medium alert for overdue in_progress goal", () => {
    const goals = [makeGoal({ status: "in_progress", target_date: daysAgo(5) })];
    const alerts = identifyDevelopmentAlerts([], [], goals, 5, NOW);
    expect(alerts.filter((a) => a.type === "goal_overdue")).toHaveLength(1);
  });

  it("does not generate overdue alert for completed goal past target", () => {
    const goals = [makeGoal({ status: "completed", target_date: daysAgo(5) })];
    const alerts = identifyDevelopmentAlerts([], [], goals, 5, NOW);
    expect(alerts.filter((a) => a.type === "goal_overdue")).toHaveLength(0);
  });

  it("does not generate overdue alert for deferred goal past target", () => {
    const goals = [makeGoal({ status: "deferred", target_date: daysAgo(5) })];
    const alerts = identifyDevelopmentAlerts([], [], goals, 5, NOW);
    expect(alerts.filter((a) => a.type === "goal_overdue")).toHaveLength(0);
  });

  it("does not generate overdue alert for in_progress goal with future target", () => {
    const goals = [makeGoal({ status: "in_progress", target_date: daysFromNow(10) })];
    const alerts = identifyDevelopmentAlerts([], [], goals, 5, NOW);
    expect(alerts.filter((a) => a.type === "goal_overdue")).toHaveLength(0);
  });

  it("includes staff name in overdue goal message", () => {
    const goals = [makeGoal({ status: "in_progress", target_date: daysAgo(5), staff_name: "Eve" })];
    const alerts = identifyDevelopmentAlerts([], [], goals, 5, NOW);
    expect(alerts.find((a) => a.type === "goal_overdue")!.message).toContain("Eve");
  });

  it("includes goal title in overdue goal message", () => {
    const goals = [makeGoal({ status: "in_progress", target_date: daysAgo(5), goal: "Complete NVQ L5" })];
    const alerts = identifyDevelopmentAlerts([], [], goals, 5, NOW);
    expect(alerts.find((a) => a.type === "goal_overdue")!.message).toContain("Complete NVQ L5");
  });

  it("includes target_date in overdue goal message", () => {
    const targetDate = daysAgo(5);
    const goals = [makeGoal({ status: "in_progress", target_date: targetDate })];
    const alerts = identifyDevelopmentAlerts([], [], goals, 5, NOW);
    expect(alerts.find((a) => a.type === "goal_overdue")!.message).toContain(targetDate);
  });

  // ── no_recent_cpd ──────────────────────────────────────────────────────

  it("generates medium alert for staff with CPD records but none in last 90 days", () => {
    const records = [makeCpdRecord({ staff_id: "s1", staff_name: "Frank", date_completed: daysAgo(100) })];
    const alerts = identifyDevelopmentAlerts(records, [], [], 5, NOW);
    const noRecent = alerts.filter((a) => a.type === "no_recent_cpd");
    expect(noRecent).toHaveLength(1);
    expect(noRecent[0].severity).toBe("medium");
  });

  it("includes staff name in no_recent_cpd message", () => {
    const records = [makeCpdRecord({ staff_id: "s1", staff_name: "Frank", date_completed: daysAgo(100) })];
    const alerts = identifyDevelopmentAlerts(records, [], [], 5, NOW);
    expect(alerts.find((a) => a.type === "no_recent_cpd")!.message).toContain("Frank");
  });

  it("uses staff_id as the alert id for no_recent_cpd", () => {
    const records = [makeCpdRecord({ staff_id: "s1", date_completed: daysAgo(100) })];
    const alerts = identifyDevelopmentAlerts(records, [], [], 5, NOW);
    expect(alerts.find((a) => a.type === "no_recent_cpd")!.id).toBe("s1");
  });

  it("does not alert for staff who have recent CPD", () => {
    const records = [makeCpdRecord({ staff_id: "s1", date_completed: daysAgo(30) })];
    const alerts = identifyDevelopmentAlerts(records, [], [], 5, NOW);
    expect(alerts.filter((a) => a.type === "no_recent_cpd")).toHaveLength(0);
  });

  it("does not generate no_recent_cpd when there are no CPD records at all", () => {
    const alerts = identifyDevelopmentAlerts([], [], [], 5, NOW);
    expect(alerts.filter((a) => a.type === "no_recent_cpd")).toHaveLength(0);
  });

  it("only alerts once per staff member for no_recent_cpd", () => {
    const records = [
      makeCpdRecord({ staff_id: "s1", staff_name: "Frank", date_completed: daysAgo(100) }),
      makeCpdRecord({ staff_id: "s1", staff_name: "Frank", date_completed: daysAgo(120) }),
    ];
    const alerts = identifyDevelopmentAlerts(records, [], [], 5, NOW);
    expect(alerts.filter((a) => a.type === "no_recent_cpd")).toHaveLength(1);
  });

  it("generates no_recent_cpd for each staff member without recent CPD", () => {
    const records = [
      makeCpdRecord({ staff_id: "s1", staff_name: "Frank", date_completed: daysAgo(100) }),
      makeCpdRecord({ staff_id: "s2", staff_name: "Grace", date_completed: daysAgo(95) }),
    ];
    const alerts = identifyDevelopmentAlerts(records, [], [], 5, NOW);
    expect(alerts.filter((a) => a.type === "no_recent_cpd")).toHaveLength(2);
  });

  it("does not alert staff who have at least one recent CPD among many old ones", () => {
    const records = [
      makeCpdRecord({ staff_id: "s1", date_completed: daysAgo(100) }),
      makeCpdRecord({ staff_id: "s1", date_completed: daysAgo(120) }),
      makeCpdRecord({ staff_id: "s1", date_completed: daysAgo(10) }), // recent
    ];
    const alerts = identifyDevelopmentAlerts(records, [], [], 5, NOW);
    expect(alerts.filter((a) => a.type === "no_recent_cpd")).toHaveLength(0);
  });

  // ── No alerts ──────────────────────────────────────────────────────────

  it("returns empty array when no alerts are applicable", () => {
    const records = [makeCpdRecord({ date_completed: daysAgo(10) })];
    const quals = [makeQualification({ status: "achieved", expiry_date: null })];
    const goals = [makeGoal({ status: "completed" })];
    const alerts = identifyDevelopmentAlerts(records, quals, goals, 5, NOW);
    expect(alerts).toHaveLength(0);
  });

  it("returns empty array for all empty inputs", () => {
    const alerts = identifyDevelopmentAlerts([], [], [], 0, NOW);
    expect(alerts).toEqual([]);
  });

  // ── Combined scenario ──────────────────────────────────────────────────

  it("generates multiple alert types in a combined scenario", () => {
    const records = [
      makeCpdRecord({ staff_id: "s1", staff_name: "Alice", date_completed: daysAgo(100) }),
    ];
    const quals = [
      makeQualification({ status: "expired", staff_name: "Bob", qualification_name: "DBS" }),
      makeQualification({ status: "achieved", expiry_date: daysFromNow(10), staff_name: "Carol" }),
      makeQualification({ mandatory: true, status: "not_started", staff_name: "Dave" }),
    ];
    const goals = [
      makeGoal({ status: "in_progress", target_date: daysAgo(5), staff_name: "Eve" }),
    ];

    const alerts = identifyDevelopmentAlerts(records, quals, goals, 5, NOW);

    const types = alerts.map((a) => a.type);
    expect(types).toContain("qualification_expired");
    expect(types).toContain("qualification_expiring");
    expect(types).toContain("mandatory_not_started");
    expect(types).toContain("goal_overdue");
    expect(types).toContain("no_recent_cpd");
    expect(alerts.length).toBe(5);
  });

  it("expired mandatory qualification generates both expired and mandatory_not_started alerts", () => {
    const quals = [makeQualification({ status: "expired", mandatory: true })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("qualification_expired");
    expect(types).toContain("mandatory_not_started");
    expect(alerts).toHaveLength(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. CRUD fallback (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listCpdRecords ─────────────────────────────────────────────────────

  it("listCpdRecords returns ok with empty array", async () => {
    const result = await listCpdRecords("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("listCpdRecords returns ok with filters", async () => {
    const result = await listCpdRecords("home-1", { staffId: "s1", category: "safeguarding" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  // ── createCpdRecord ────────────────────────────────────────────────────

  it("createCpdRecord returns error when Supabase disabled", async () => {
    const result = await createCpdRecord({
      homeId: "home-1",
      staffId: "s1",
      staffName: "Alice",
      category: "safeguarding",
      method: "course",
      title: "Test",
      description: "Test desc",
      provider: "Provider",
      dateCompleted: "2026-01-01",
      cpdHours: 6,
      learningOutcomes: ["outcome1"],
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  // ── listQualifications ─────────────────────────────────────────────────

  it("listQualifications returns ok with empty array", async () => {
    const result = await listQualifications("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("listQualifications returns ok with filters", async () => {
    const result = await listQualifications("home-1", { staffId: "s1", status: "achieved", mandatory: true });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  // ── createQualification ────────────────────────────────────────────────

  it("createQualification returns error when Supabase disabled", async () => {
    const result = await createQualification({
      homeId: "home-1",
      staffId: "s1",
      staffName: "Alice",
      qualificationName: "Level 3",
      awardingBody: "CACHE",
      level: "3",
      status: "achieved",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  // ── updateQualification ────────────────────────────────────────────────

  it("updateQualification returns error when Supabase disabled", async () => {
    const result = await updateQualification("qual-1", { status: "expired" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  // ── listGoals ──────────────────────────────────────────────────────────

  it("listGoals returns ok with empty array", async () => {
    const result = await listGoals("home-1");
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  it("listGoals returns ok with filters", async () => {
    const result = await listGoals("home-1", { staffId: "s1", status: "in_progress" });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual([]);
  });

  // ── createGoal ─────────────────────────────────────────────────────────

  it("createGoal returns error when Supabase disabled", async () => {
    const result = await createGoal({
      homeId: "home-1",
      staffId: "s1",
      staffName: "Alice",
      goal: "Complete Level 5",
      rationale: "Career development",
      targetDate: "2026-12-31",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });

  // ── updateGoal ─────────────────────────────────────────────────────────

  it("updateGoal returns error when Supabase disabled", async () => {
    const result = await updateGoal("goal-1", { status: "completed" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Supabase not configured");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Edge cases
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("handles single CPD record correctly", () => {
    const records = [makeCpdRecord({ cpd_hours: 3, date_completed: daysAgo(5), category: "medication", method: "e_learning" })];
    const m = computeDevelopmentMetrics(records, [], [], 1, NOW);
    expect(m.total_cpd_records).toBe(1);
    expect(m.total_cpd_hours).toBe(3);
    expect(m.cpd_this_quarter).toBe(1);
    expect(m.by_category).toEqual({ medication: 1 });
    expect(m.by_method).toEqual({ e_learning: 1 });
  });

  it("handles single qualification correctly", () => {
    const quals = [makeQualification({ status: "in_progress" })];
    const m = computeDevelopmentMetrics([], quals, [], 1, NOW);
    expect(m.qualifications_in_progress).toBe(1);
    expect(m.qualifications_achieved).toBe(0);
  });

  it("handles single goal correctly", () => {
    const goals = [makeGoal({ status: "not_started", target_date: daysAgo(1) })];
    const m = computeDevelopmentMetrics([], [], goals, 1, NOW);
    expect(m.goals_overdue).toBe(1);
    expect(m.goals_in_progress).toBe(0);
  });

  it("handles large dataset of CPD records", () => {
    const records: CpdRecord[] = [];
    for (let i = 0; i < 500; i++) {
      records.push(makeCpdRecord({
        staff_id: `staff-${i % 50}`,
        cpd_hours: 2,
        date_completed: daysAgo(i % 120),
        category: i % 2 === 0 ? "safeguarding" : "first_aid",
        method: i % 3 === 0 ? "course" : "workshop",
      }));
    }
    const m = computeDevelopmentMetrics(records, [], [], 50, NOW);
    expect(m.total_cpd_records).toBe(500);
    expect(m.total_cpd_hours).toBe(1000);
    expect(m.staff_with_cpd).toBe(50);
    expect(m.avg_cpd_hours_per_staff).toBe(20);
  });

  it("handles large dataset of qualifications", () => {
    const quals: QualificationRecord[] = [];
    for (let i = 0; i < 200; i++) {
      const statuses: QualificationRecord["status"][] = ["achieved", "in_progress", "expired", "planned", "not_started"];
      quals.push(makeQualification({ status: statuses[i % 5] }));
    }
    const m = computeDevelopmentMetrics([], quals, [], 50, NOW);
    expect(m.qualifications_achieved).toBe(40);
    expect(m.qualifications_in_progress).toBe(40);
    expect(m.qualifications_expired).toBe(40);
  });

  it("handles large dataset of goals", () => {
    const goals: DevelopmentGoal[] = [];
    for (let i = 0; i < 100; i++) {
      goals.push(makeGoal({
        status: i % 2 === 0 ? "completed" : "in_progress",
        target_date: daysAgo(10),
      }));
    }
    const m = computeDevelopmentMetrics([], [], goals, 50, NOW);
    expect(m.goals_completed).toBe(50);
    expect(m.goals_in_progress).toBe(50);
    expect(m.goals_overdue).toBe(50); // in_progress past target_date
  });

  it("computeDevelopmentMetrics returns correct types for all fields", () => {
    const m = computeDevelopmentMetrics(
      [makeCpdRecord()],
      [makeQualification()],
      [makeGoal()],
      5,
      NOW,
    );
    expect(typeof m.total_cpd_records).toBe("number");
    expect(typeof m.total_cpd_hours).toBe("number");
    expect(typeof m.avg_cpd_hours_per_staff).toBe("number");
    expect(typeof m.cpd_this_quarter).toBe("number");
    expect(typeof m.cpd_hours_this_quarter).toBe("number");
    expect(typeof m.staff_with_cpd).toBe("number");
    expect(typeof m.qualifications_achieved).toBe("number");
    expect(typeof m.qualifications_in_progress).toBe("number");
    expect(typeof m.qualifications_expired).toBe("number");
    expect(typeof m.qualifications_expiring_soon).toBe("number");
    expect(typeof m.goals_completed).toBe("number");
    expect(typeof m.goals_in_progress).toBe("number");
    expect(typeof m.goals_overdue).toBe("number");
    expect(typeof m.by_category).toBe("object");
    expect(typeof m.by_method).toBe("object");
  });

  it("identifyDevelopmentAlerts returns array of objects with correct shape", () => {
    const quals = [makeQualification({ status: "expired" })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    expect(Array.isArray(alerts)).toBe(true);
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

  it("CPD record dated today is included in this quarter", () => {
    const records = [makeCpdRecord({ date_completed: NOW.toISOString().slice(0, 10) })];
    const m = computeDevelopmentMetrics(records, [], [], 5, NOW);
    expect(m.cpd_this_quarter).toBe(1);
  });

  it("qualification expiring today is not counted as expiring_soon (must be > now)", () => {
    const quals = [makeQualification({
      status: "achieved",
      expiry_date: NOW.toISOString().slice(0, 10),
    })];
    const m = computeDevelopmentMetrics([], quals, [], 5, NOW);
    // expiry_date = now, new Date(expiry_date) > now is false for same day at midnight
    // This depends on time — if expiry_date is midnight and now is midnight, > fails
    // NOW is 2026-06-01T00:00:00Z and expiry_date "2026-06-01" parses to midnight UTC
    expect(m.qualifications_expiring_soon).toBe(0);
  });

  it("goal with target_date equal to now is not overdue (must be < now)", () => {
    const goals = [makeGoal({ status: "in_progress", target_date: NOW.toISOString().slice(0, 10) })];
    const m = computeDevelopmentMetrics([], [], goals, 5, NOW);
    // target_date "2026-06-01" parses to midnight UTC, now is midnight UTC, < fails
    expect(m.goals_overdue).toBe(0);
  });

  it("CPD records with 0 hours contribute to count but not hours", () => {
    const records = [
      makeCpdRecord({ cpd_hours: 0, date_completed: daysAgo(5) }),
      makeCpdRecord({ cpd_hours: 4, date_completed: daysAgo(5) }),
    ];
    const m = computeDevelopmentMetrics(records, [], [], 2, NOW);
    expect(m.total_cpd_records).toBe(2);
    expect(m.total_cpd_hours).toBe(4);
    expect(m.cpd_this_quarter).toBe(2);
    expect(m.cpd_hours_this_quarter).toBe(4);
  });

  it("multiple categories produce complete by_category breakdown", () => {
    const records = [
      makeCpdRecord({ category: "safeguarding" }),
      makeCpdRecord({ category: "medication" }),
      makeCpdRecord({ category: "first_aid" }),
      makeCpdRecord({ category: "safeguarding" }),
      makeCpdRecord({ category: "mental_health" }),
    ];
    const m = computeDevelopmentMetrics(records, [], [], 5, NOW);
    expect(Object.keys(m.by_category)).toHaveLength(4);
    expect(m.by_category["safeguarding"]).toBe(2);
    expect(m.by_category["medication"]).toBe(1);
    expect(m.by_category["first_aid"]).toBe(1);
    expect(m.by_category["mental_health"]).toBe(1);
  });

  it("multiple methods produce complete by_method breakdown", () => {
    const records = [
      makeCpdRecord({ method: "course" }),
      makeCpdRecord({ method: "course" }),
      makeCpdRecord({ method: "webinar" }),
    ];
    const m = computeDevelopmentMetrics(records, [], [], 5, NOW);
    expect(Object.keys(m.by_method)).toHaveLength(2);
    expect(m.by_method["course"]).toBe(2);
    expect(m.by_method["webinar"]).toBe(1);
  });

  it("alert severity values are valid enum values", () => {
    const records = [makeCpdRecord({ staff_id: "s1", date_completed: daysAgo(100) })];
    const quals = [
      makeQualification({ status: "expired" }),
      makeQualification({ status: "achieved", expiry_date: daysFromNow(10) }),
      makeQualification({ mandatory: true, status: "not_started" }),
    ];
    const goals = [makeGoal({ status: "in_progress", target_date: daysAgo(5) })];
    const alerts = identifyDevelopmentAlerts(records, quals, goals, 5, NOW);
    const validSeverities = ["critical", "high", "medium"];
    for (const alert of alerts) {
      expect(validSeverities).toContain(alert.severity);
    }
  });

  it("handles decimal cpd_hours for rounding", () => {
    const records = [
      makeCpdRecord({ cpd_hours: 1.5 }),
      makeCpdRecord({ cpd_hours: 2.3 }),
      makeCpdRecord({ cpd_hours: 0.7 }),
    ];
    // total = 4.5, staff = 2 => 4.5/2 = 2.25 => 2.3
    const m = computeDevelopmentMetrics(records, [], [], 2, NOW);
    expect(m.total_cpd_hours).toBeCloseTo(4.5);
    expect(m.avg_cpd_hours_per_staff).toBe(2.3);
  });

  it("multiple staff IDs counted correctly", () => {
    const records = [
      makeCpdRecord({ staff_id: "a" }),
      makeCpdRecord({ staff_id: "b" }),
      makeCpdRecord({ staff_id: "c" }),
      makeCpdRecord({ staff_id: "a" }),
      makeCpdRecord({ staff_id: "b" }),
    ];
    const m = computeDevelopmentMetrics(records, [], [], 5, NOW);
    expect(m.staff_with_cpd).toBe(3);
  });

  it("planned qualifications are not counted as achieved, in_progress, or expired", () => {
    const quals = [makeQualification({ status: "planned" })];
    const m = computeDevelopmentMetrics([], quals, [], 5, NOW);
    expect(m.qualifications_achieved).toBe(0);
    expect(m.qualifications_in_progress).toBe(0);
    expect(m.qualifications_expired).toBe(0);
  });

  it("not_started qualifications are not counted as achieved, in_progress, or expired", () => {
    const quals = [makeQualification({ status: "not_started" })];
    const m = computeDevelopmentMetrics([], quals, [], 5, NOW);
    expect(m.qualifications_achieved).toBe(0);
    expect(m.qualifications_in_progress).toBe(0);
    expect(m.qualifications_expired).toBe(0);
  });

  it("cancelled goals are not counted as completed or in_progress", () => {
    const goals = [makeGoal({ status: "cancelled" })];
    const m = computeDevelopmentMetrics([], [], goals, 5, NOW);
    expect(m.goals_completed).toBe(0);
    expect(m.goals_in_progress).toBe(0);
  });

  it("deferred goals are not counted as completed or in_progress", () => {
    const goals = [makeGoal({ status: "deferred" })];
    const m = computeDevelopmentMetrics([], [], goals, 5, NOW);
    expect(m.goals_completed).toBe(0);
    expect(m.goals_in_progress).toBe(0);
  });

  it("avg rounds 33.333... to 33.3", () => {
    // 100 / 3 = 33.333... => 33.3
    const records = [makeCpdRecord({ cpd_hours: 100 })];
    const m = computeDevelopmentMetrics(records, [], [], 3, NOW);
    expect(m.avg_cpd_hours_per_staff).toBe(33.3);
  });

  it("avg rounds 16.666... to 16.7", () => {
    // 50 / 3 = 16.666... => 16.7
    const records = [makeCpdRecord({ cpd_hours: 50 })];
    const m = computeDevelopmentMetrics(records, [], [], 3, NOW);
    expect(m.avg_cpd_hours_per_staff).toBe(16.7);
  });

  it("qualifications_expiring_soon excludes qualification expiring on day 1 (tomorrow)", () => {
    const quals = [makeQualification({ status: "achieved", expiry_date: daysFromNow(1) })];
    const m = computeDevelopmentMetrics([], quals, [], 5, NOW);
    expect(m.qualifications_expiring_soon).toBe(1);
  });

  it("no_recent_cpd alert message contains 90 days text", () => {
    const records = [makeCpdRecord({ staff_id: "s1", staff_name: "Zara", date_completed: daysAgo(100) })];
    const alerts = identifyDevelopmentAlerts(records, [], [], 5, NOW);
    const noRecent = alerts.find((a) => a.type === "no_recent_cpd");
    expect(noRecent!.message).toContain("90 days");
  });

  it("expired qualification alert message contains 'expired'", () => {
    const quals = [makeQualification({ status: "expired" })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    expect(alerts[0].message.toLowerCase()).toContain("expired");
  });

  it("expiring qualification alert message contains 'expires'", () => {
    const quals = [makeQualification({ status: "achieved", expiry_date: daysFromNow(10) })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    const expiring = alerts.find((a) => a.type === "qualification_expiring");
    expect(expiring!.message.toLowerCase()).toContain("expires");
  });

  it("overdue goal alert message contains 'overdue'", () => {
    const goals = [makeGoal({ status: "in_progress", target_date: daysAgo(5) })];
    const alerts = identifyDevelopmentAlerts([], [], goals, 5, NOW);
    const overdue = alerts.find((a) => a.type === "goal_overdue");
    expect(overdue!.message.toLowerCase()).toContain("overdue");
  });

  it("mandatory_not_started alert message contains 'mandatory'", () => {
    const quals = [makeQualification({ mandatory: true, status: "not_started" })];
    const alerts = identifyDevelopmentAlerts([], quals, [], 5, NOW);
    const mandatory = alerts.find((a) => a.type === "mandatory_not_started");
    expect(mandatory!.message.toLowerCase()).toContain("mandatory");
  });

  it("CPD_CATEGORIES contains attachment_trauma", () => {
    expect(CPD_CATEGORIES.find((c) => c.category === "attachment_trauma")).toBeDefined();
  });

  it("CPD_CATEGORIES contains leadership_management", () => {
    expect(CPD_CATEGORIES.find((c) => c.category === "leadership_management")).toBeDefined();
  });

  it("CPD_CATEGORIES contains specialist_training", () => {
    expect(CPD_CATEGORIES.find((c) => c.category === "specialist_training")).toBeDefined();
  });

  it("CPD_METHODS contains shadowing", () => {
    expect(CPD_METHODS.find((m) => m.method === "shadowing")).toBeDefined();
  });

  it("CPD_METHODS contains mentoring", () => {
    expect(CPD_METHODS.find((m) => m.method === "mentoring")).toBeDefined();
  });

  it("CPD_METHODS contains peer_learning", () => {
    expect(CPD_METHODS.find((m) => m.method === "peer_learning")).toBeDefined();
  });

  it("CPD_METHODS contains webinar", () => {
    expect(CPD_METHODS.find((m) => m.method === "webinar")).toBeDefined();
  });

  it("CPD_METHODS contains reading", () => {
    expect(CPD_METHODS.find((m) => m.method === "reading")).toBeDefined();
  });

  it("CPD_METHODS contains workshop", () => {
    expect(CPD_METHODS.find((m) => m.method === "workshop")).toBeDefined();
  });

  it("CPD_METHODS contains conference", () => {
    expect(CPD_METHODS.find((m) => m.method === "conference")).toBeDefined();
  });

  it("CPD_CATEGORIES contains legislation_regulation", () => {
    expect(CPD_CATEGORIES.find((c) => c.category === "legislation_regulation")).toBeDefined();
  });
});
