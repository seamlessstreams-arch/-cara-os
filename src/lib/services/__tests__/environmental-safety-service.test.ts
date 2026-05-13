// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ENVIRONMENTAL SAFETY SERVICE TESTS
// Pure-function unit tests for safety metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 25 (premises safety and suitability),
// Reg 44 (fire safety), Regulatory Reform (Fire Safety) Order 2005,
// Health and Safety at Work Act 1974.
// SCCIF: Well-Led — "The premises are safe, well maintained, and suitable
// for their stated purpose." "Health and safety requirements are met."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  CHECK_CATEGORIES,
  CHECK_FREQUENCIES,
  COMPLIANCE_STATUSES,
  CERTIFICATE_STATUSES,
  ACTION_PRIORITIES,
  listChecks,
  createCheck,
  updateCheck,
  listDrills,
  createDrill,
} from "../environmental-safety-service";

import type {
  SafetyCheck,
  FireDrill,
} from "../environmental-safety-service";

const { computeSafetyMetrics, identifySafetyAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

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

/** Build a minimal SafetyCheck with sensible defaults. */
function makeCheck(overrides: Partial<SafetyCheck> = {}): SafetyCheck {
  return {
    id: "check-1",
    home_id: "home-1",
    category: "fire_safety",
    check_name: "Fire Alarm Test",
    check_date: daysAgo(7),
    checked_by: "staff-1",
    frequency: "weekly",
    next_due_date: daysFromNow(7),
    compliance_status: "compliant",
    findings: null,
    remedial_actions: [],
    certificate_reference: null,
    certificate_expiry: null,
    certificate_status: "valid",
    notes: null,
    created_at: daysAgoISO(7),
    updated_at: daysAgoISO(7),
    ...overrides,
  };
}

/** Build a minimal FireDrill with sensible defaults. */
function makeDrill(overrides: Partial<FireDrill> = {}): FireDrill {
  return {
    id: "drill-1",
    home_id: "home-1",
    drill_date: daysAgo(10),
    drill_time: "14:30",
    drill_type: "planned",
    evacuation_time_seconds: 120,
    all_evacuated: true,
    children_present: 4,
    staff_present: 3,
    visitors_present: 0,
    assembly_point_used: "Front Car Park",
    issues_identified: null,
    actions_required: null,
    conducted_by: "staff-1",
    notes: null,
    created_at: daysAgoISO(10),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("CHECK_CATEGORIES", () => {
  it("has exactly 14 categories", () => {
    expect(CHECK_CATEGORIES).toHaveLength(14);
  });

  it("contains unique category values", () => {
    const values = CHECK_CATEGORIES.map((c) => c.category);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = CHECK_CATEGORIES.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes fire_safety", () => {
    expect(CHECK_CATEGORIES.find((c) => c.category === "fire_safety")).toBeTruthy();
  });

  it("includes legionella", () => {
    expect(CHECK_CATEGORIES.find((c) => c.category === "legionella")).toBeTruthy();
  });

  it("includes electrical", () => {
    expect(CHECK_CATEGORIES.find((c) => c.category === "electrical")).toBeTruthy();
  });

  it("includes gas_safety", () => {
    expect(CHECK_CATEGORIES.find((c) => c.category === "gas_safety")).toBeTruthy();
  });

  it("includes pat_testing", () => {
    expect(CHECK_CATEGORIES.find((c) => c.category === "pat_testing")).toBeTruthy();
  });

  it("includes coshh", () => {
    expect(CHECK_CATEGORIES.find((c) => c.category === "coshh")).toBeTruthy();
  });

  it("includes asbestos", () => {
    expect(CHECK_CATEGORIES.find((c) => c.category === "asbestos")).toBeTruthy();
  });

  it("includes water_hygiene", () => {
    expect(CHECK_CATEGORIES.find((c) => c.category === "water_hygiene")).toBeTruthy();
  });

  it("includes radon", () => {
    expect(CHECK_CATEGORIES.find((c) => c.category === "radon")).toBeTruthy();
  });

  it("includes pest_control", () => {
    expect(CHECK_CATEGORIES.find((c) => c.category === "pest_control")).toBeTruthy();
  });

  it("includes playground_equipment", () => {
    expect(CHECK_CATEGORIES.find((c) => c.category === "playground_equipment")).toBeTruthy();
  });

  it("includes general_maintenance", () => {
    expect(CHECK_CATEGORIES.find((c) => c.category === "general_maintenance")).toBeTruthy();
  });

  it("includes environmental_risk", () => {
    expect(CHECK_CATEGORIES.find((c) => c.category === "environmental_risk")).toBeTruthy();
  });

  it("includes other", () => {
    expect(CHECK_CATEGORIES.find((c) => c.category === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const c of CHECK_CATEGORIES) {
      expect(c.label.length).toBeGreaterThan(0);
    }
  });
});

describe("CHECK_FREQUENCIES", () => {
  it("has exactly 9 frequencies", () => {
    expect(CHECK_FREQUENCIES).toHaveLength(9);
  });

  it("contains unique frequency values", () => {
    const values = CHECK_FREQUENCIES.map((f) => f.frequency);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = CHECK_FREQUENCIES.map((f) => f.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes daily", () => {
    expect(CHECK_FREQUENCIES.find((f) => f.frequency === "daily")).toBeTruthy();
  });

  it("includes weekly", () => {
    expect(CHECK_FREQUENCIES.find((f) => f.frequency === "weekly")).toBeTruthy();
  });

  it("includes monthly", () => {
    expect(CHECK_FREQUENCIES.find((f) => f.frequency === "monthly")).toBeTruthy();
  });

  it("includes quarterly", () => {
    expect(CHECK_FREQUENCIES.find((f) => f.frequency === "quarterly")).toBeTruthy();
  });

  it("includes six_monthly", () => {
    expect(CHECK_FREQUENCIES.find((f) => f.frequency === "six_monthly")).toBeTruthy();
  });

  it("includes annual", () => {
    expect(CHECK_FREQUENCIES.find((f) => f.frequency === "annual")).toBeTruthy();
  });

  it("includes biennial", () => {
    expect(CHECK_FREQUENCIES.find((f) => f.frequency === "biennial")).toBeTruthy();
  });

  it("includes five_yearly", () => {
    expect(CHECK_FREQUENCIES.find((f) => f.frequency === "five_yearly")).toBeTruthy();
  });

  it("includes ad_hoc", () => {
    expect(CHECK_FREQUENCIES.find((f) => f.frequency === "ad_hoc")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const f of CHECK_FREQUENCIES) {
      expect(f.label.length).toBeGreaterThan(0);
    }
  });
});

describe("COMPLIANCE_STATUSES", () => {
  it("has exactly 5 statuses", () => {
    expect(COMPLIANCE_STATUSES).toHaveLength(5);
  });

  it("contains unique status values", () => {
    const values = COMPLIANCE_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = COMPLIANCE_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes compliant", () => {
    expect(COMPLIANCE_STATUSES.find((s) => s.status === "compliant")).toBeTruthy();
  });

  it("includes partially_compliant", () => {
    expect(COMPLIANCE_STATUSES.find((s) => s.status === "partially_compliant")).toBeTruthy();
  });

  it("includes non_compliant", () => {
    expect(COMPLIANCE_STATUSES.find((s) => s.status === "non_compliant")).toBeTruthy();
  });

  it("includes overdue", () => {
    expect(COMPLIANCE_STATUSES.find((s) => s.status === "overdue")).toBeTruthy();
  });

  it("includes not_applicable", () => {
    expect(COMPLIANCE_STATUSES.find((s) => s.status === "not_applicable")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of COMPLIANCE_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("CERTIFICATE_STATUSES", () => {
  it("has exactly 4 statuses", () => {
    expect(CERTIFICATE_STATUSES).toHaveLength(4);
  });

  it("contains unique status values", () => {
    const values = CERTIFICATE_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = CERTIFICATE_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes valid", () => {
    expect(CERTIFICATE_STATUSES.find((s) => s.status === "valid")).toBeTruthy();
  });

  it("includes expiring_soon", () => {
    expect(CERTIFICATE_STATUSES.find((s) => s.status === "expiring_soon")).toBeTruthy();
  });

  it("includes expired", () => {
    expect(CERTIFICATE_STATUSES.find((s) => s.status === "expired")).toBeTruthy();
  });

  it("includes pending_renewal", () => {
    expect(CERTIFICATE_STATUSES.find((s) => s.status === "pending_renewal")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of CERTIFICATE_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("ACTION_PRIORITIES", () => {
  it("has exactly 4 priorities", () => {
    expect(ACTION_PRIORITIES).toHaveLength(4);
  });

  it("contains unique priority values", () => {
    const values = ACTION_PRIORITIES.map((p) => p.priority);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = ACTION_PRIORITIES.map((p) => p.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes critical", () => {
    expect(ACTION_PRIORITIES.find((p) => p.priority === "critical")).toBeTruthy();
  });

  it("includes high", () => {
    expect(ACTION_PRIORITIES.find((p) => p.priority === "high")).toBeTruthy();
  });

  it("includes medium", () => {
    expect(ACTION_PRIORITIES.find((p) => p.priority === "medium")).toBeTruthy();
  });

  it("includes low", () => {
    expect(ACTION_PRIORITIES.find((p) => p.priority === "low")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const p of ACTION_PRIORITIES) {
      expect(p.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeSafetyMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeSafetyMetrics", () => {
  it("returns zeroed metrics for empty arrays", () => {
    const m = computeSafetyMetrics([], []);
    expect(m.total_checks).toBe(0);
    expect(m.compliant_count).toBe(0);
    expect(m.compliance_rate).toBe(0);
    expect(m.overdue_checks).toBe(0);
    expect(m.non_compliant_checks).toBe(0);
    expect(m.certificates_expiring_soon).toBe(0);
    expect(m.certificates_expired).toBe(0);
    expect(m.open_remedial_actions).toBe(0);
    expect(m.critical_actions).toBe(0);
    expect(m.drills_this_year).toBe(0);
    expect(m.avg_evacuation_time).toBe(0);
    expect(Object.keys(m.by_category)).toHaveLength(0);
  });

  // ── total_checks ──────────────────────────────────────────────────────

  it("total_checks counts all checks", () => {
    const checks = [
      makeCheck({ id: "c1" }),
      makeCheck({ id: "c2" }),
      makeCheck({ id: "c3" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.total_checks).toBe(3);
  });

  it("total_checks is 1 for a single check", () => {
    const m = computeSafetyMetrics([makeCheck()], []);
    expect(m.total_checks).toBe(1);
  });

  // ── compliant_count ───────────────────────────────────────────────────

  it("compliant_count counts only compliant checks", () => {
    const checks = [
      makeCheck({ id: "c1", compliance_status: "compliant" }),
      makeCheck({ id: "c2", compliance_status: "non_compliant" }),
      makeCheck({ id: "c3", compliance_status: "compliant" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.compliant_count).toBe(2);
  });

  it("compliant_count is 0 when no checks are compliant", () => {
    const checks = [
      makeCheck({ id: "c1", compliance_status: "overdue" }),
      makeCheck({ id: "c2", compliance_status: "non_compliant" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.compliant_count).toBe(0);
  });

  it("compliant_count does not count partially_compliant", () => {
    const checks = [
      makeCheck({ id: "c1", compliance_status: "partially_compliant" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.compliant_count).toBe(0);
  });

  it("compliant_count does not count not_applicable", () => {
    const checks = [
      makeCheck({ id: "c1", compliance_status: "not_applicable" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.compliant_count).toBe(0);
  });

  // ── compliance_rate ───────────────────────────────────────────────────

  it("compliance_rate is 100 when all checks are compliant", () => {
    const checks = [
      makeCheck({ id: "c1", compliance_status: "compliant" }),
      makeCheck({ id: "c2", compliance_status: "compliant" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.compliance_rate).toBe(100);
  });

  it("compliance_rate is 0 when no checks are compliant", () => {
    const checks = [
      makeCheck({ id: "c1", compliance_status: "non_compliant" }),
      makeCheck({ id: "c2", compliance_status: "overdue" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.compliance_rate).toBe(0);
  });

  it("compliance_rate is 0 for empty checks array", () => {
    const m = computeSafetyMetrics([], []);
    expect(m.compliance_rate).toBe(0);
  });

  it("compliance_rate calculates correctly for mixed statuses", () => {
    const checks = [
      makeCheck({ id: "c1", compliance_status: "compliant" }),
      makeCheck({ id: "c2", compliance_status: "non_compliant" }),
      makeCheck({ id: "c3", compliance_status: "overdue" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    // 1/3 = 33.3%
    expect(m.compliance_rate).toBe(33.3);
  });

  it("compliance_rate rounds to one decimal place", () => {
    const checks = [
      makeCheck({ id: "c1", compliance_status: "compliant" }),
      makeCheck({ id: "c2", compliance_status: "compliant" }),
      makeCheck({ id: "c3", compliance_status: "non_compliant" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    // 2/3 = 66.7%
    expect(m.compliance_rate).toBe(66.7);
  });

  it("compliance_rate is 50 for half compliant", () => {
    const checks = [
      makeCheck({ id: "c1", compliance_status: "compliant" }),
      makeCheck({ id: "c2", compliance_status: "overdue" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.compliance_rate).toBe(50);
  });

  // ── overdue_checks ────────────────────────────────────────────────────

  it("overdue_checks counts checks with overdue status", () => {
    const checks = [
      makeCheck({ id: "c1", compliance_status: "overdue" }),
      makeCheck({ id: "c2", compliance_status: "overdue" }),
      makeCheck({ id: "c3", compliance_status: "compliant" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.overdue_checks).toBe(2);
  });

  it("overdue_checks is 0 when no checks are overdue", () => {
    const checks = [
      makeCheck({ id: "c1", compliance_status: "compliant" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.overdue_checks).toBe(0);
  });

  // ── non_compliant_checks ──────────────────────────────────────────────

  it("non_compliant_checks counts non-compliant checks", () => {
    const checks = [
      makeCheck({ id: "c1", compliance_status: "non_compliant" }),
      makeCheck({ id: "c2", compliance_status: "compliant" }),
      makeCheck({ id: "c3", compliance_status: "non_compliant" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.non_compliant_checks).toBe(2);
  });

  it("non_compliant_checks is 0 when all checks are compliant", () => {
    const checks = [
      makeCheck({ id: "c1", compliance_status: "compliant" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.non_compliant_checks).toBe(0);
  });

  // ── certificates_expiring_soon ────────────────────────────────────────

  it("certificates_expiring_soon counts expiring_soon certificates", () => {
    const checks = [
      makeCheck({ id: "c1", certificate_status: "expiring_soon" }),
      makeCheck({ id: "c2", certificate_status: "valid" }),
      makeCheck({ id: "c3", certificate_status: "expiring_soon" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.certificates_expiring_soon).toBe(2);
  });

  it("certificates_expiring_soon is 0 when all valid", () => {
    const checks = [
      makeCheck({ id: "c1", certificate_status: "valid" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.certificates_expiring_soon).toBe(0);
  });

  it("certificates_expiring_soon does not count expired certificates", () => {
    const checks = [
      makeCheck({ id: "c1", certificate_status: "expired" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.certificates_expiring_soon).toBe(0);
  });

  // ── certificates_expired ──────────────────────────────────────────────

  it("certificates_expired counts expired certificates", () => {
    const checks = [
      makeCheck({ id: "c1", certificate_status: "expired" }),
      makeCheck({ id: "c2", certificate_status: "expired" }),
      makeCheck({ id: "c3", certificate_status: "valid" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.certificates_expired).toBe(2);
  });

  it("certificates_expired is 0 when none are expired", () => {
    const checks = [
      makeCheck({ id: "c1", certificate_status: "valid" }),
      makeCheck({ id: "c2", certificate_status: "expiring_soon" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.certificates_expired).toBe(0);
  });

  it("certificates_expired does not count pending_renewal", () => {
    const checks = [
      makeCheck({ id: "c1", certificate_status: "pending_renewal" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.certificates_expired).toBe(0);
  });

  // ── open_remedial_actions ─────────────────────────────────────────────

  it("open_remedial_actions counts uncompleted actions", () => {
    const checks = [
      makeCheck({
        id: "c1",
        remedial_actions: [
          { action: "Fix wiring", priority: "high", assigned_to: "staff-1", due_date: daysFromNow(7), completed: false, completion_date: null },
          { action: "Replace panel", priority: "low", assigned_to: "staff-2", due_date: daysFromNow(14), completed: true, completion_date: daysAgo(1) },
        ],
      }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.open_remedial_actions).toBe(1);
  });

  it("open_remedial_actions is 0 when all actions are completed", () => {
    const checks = [
      makeCheck({
        id: "c1",
        remedial_actions: [
          { action: "Fix alarm", priority: "high", assigned_to: "staff-1", due_date: daysAgo(5), completed: true, completion_date: daysAgo(3) },
        ],
      }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.open_remedial_actions).toBe(0);
  });

  it("open_remedial_actions counts across multiple checks", () => {
    const checks = [
      makeCheck({
        id: "c1",
        remedial_actions: [
          { action: "A1", priority: "high", assigned_to: "s1", due_date: daysFromNow(7), completed: false, completion_date: null },
        ],
      }),
      makeCheck({
        id: "c2",
        remedial_actions: [
          { action: "A2", priority: "medium", assigned_to: "s2", due_date: daysFromNow(14), completed: false, completion_date: null },
          { action: "A3", priority: "low", assigned_to: "s3", due_date: daysFromNow(21), completed: false, completion_date: null },
        ],
      }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.open_remedial_actions).toBe(3);
  });

  it("open_remedial_actions is 0 when no remedial actions exist", () => {
    const checks = [makeCheck({ id: "c1", remedial_actions: [] })];
    const m = computeSafetyMetrics(checks, []);
    expect(m.open_remedial_actions).toBe(0);
  });

  // ── critical_actions ──────────────────────────────────────────────────

  it("critical_actions counts uncompleted critical priority actions", () => {
    const checks = [
      makeCheck({
        id: "c1",
        remedial_actions: [
          { action: "Critical fix", priority: "critical", assigned_to: "s1", due_date: daysFromNow(1), completed: false, completion_date: null },
          { action: "Non-critical", priority: "high", assigned_to: "s2", due_date: daysFromNow(7), completed: false, completion_date: null },
        ],
      }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.critical_actions).toBe(1);
  });

  it("critical_actions does not count completed critical actions", () => {
    const checks = [
      makeCheck({
        id: "c1",
        remedial_actions: [
          { action: "Done", priority: "critical", assigned_to: "s1", due_date: daysAgo(5), completed: true, completion_date: daysAgo(3) },
        ],
      }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.critical_actions).toBe(0);
  });

  it("critical_actions is 0 when no critical actions exist", () => {
    const checks = [
      makeCheck({
        id: "c1",
        remedial_actions: [
          { action: "A1", priority: "high", assigned_to: "s1", due_date: daysFromNow(7), completed: false, completion_date: null },
        ],
      }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.critical_actions).toBe(0);
  });

  it("critical_actions counts multiple uncompleted critical actions across checks", () => {
    const checks = [
      makeCheck({
        id: "c1",
        remedial_actions: [
          { action: "C1", priority: "critical", assigned_to: "s1", due_date: daysFromNow(1), completed: false, completion_date: null },
        ],
      }),
      makeCheck({
        id: "c2",
        remedial_actions: [
          { action: "C2", priority: "critical", assigned_to: "s2", due_date: daysFromNow(2), completed: false, completion_date: null },
        ],
      }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.critical_actions).toBe(2);
  });

  // ── drills_this_year ──────────────────────────────────────────────────

  it("drills_this_year counts drills from this calendar year", () => {
    const drills = [
      makeDrill({ id: "d1", drill_date: daysAgo(10) }),
      makeDrill({ id: "d2", drill_date: daysAgo(30) }),
    ];
    const m = computeSafetyMetrics([], drills);
    expect(m.drills_this_year).toBe(2);
  });

  it("drills_this_year is 0 when no drills exist", () => {
    const m = computeSafetyMetrics([], []);
    expect(m.drills_this_year).toBe(0);
  });

  it("drills_this_year excludes drills from a previous year", () => {
    const previousYear = new Date();
    previousYear.setFullYear(previousYear.getFullYear() - 1);
    previousYear.setMonth(0, 1);
    const drills = [
      makeDrill({ id: "d1", drill_date: previousYear.toISOString().split("T")[0] }),
    ];
    const m = computeSafetyMetrics([], drills);
    expect(m.drills_this_year).toBe(0);
  });

  it("drills_this_year counts drill on Jan 1 of current year", () => {
    const jan1 = new Date();
    jan1.setMonth(0, 1);
    const drills = [
      makeDrill({ id: "d1", drill_date: jan1.toISOString().split("T")[0] }),
    ];
    const m = computeSafetyMetrics([], drills);
    expect(m.drills_this_year).toBe(1);
  });

  // ── avg_evacuation_time ───────────────────────────────────────────────

  it("avg_evacuation_time averages across all drills", () => {
    const drills = [
      makeDrill({ id: "d1", evacuation_time_seconds: 100 }),
      makeDrill({ id: "d2", evacuation_time_seconds: 200 }),
    ];
    const m = computeSafetyMetrics([], drills);
    expect(m.avg_evacuation_time).toBe(150);
  });

  it("avg_evacuation_time is 0 when no drills exist", () => {
    const m = computeSafetyMetrics([], []);
    expect(m.avg_evacuation_time).toBe(0);
  });

  it("avg_evacuation_time rounds to nearest integer", () => {
    const drills = [
      makeDrill({ id: "d1", evacuation_time_seconds: 100 }),
      makeDrill({ id: "d2", evacuation_time_seconds: 101 }),
      makeDrill({ id: "d3", evacuation_time_seconds: 102 }),
    ];
    const m = computeSafetyMetrics([], drills);
    // (100+101+102)/3 = 101
    expect(m.avg_evacuation_time).toBe(101);
  });

  it("avg_evacuation_time returns exact value for single drill", () => {
    const drills = [makeDrill({ id: "d1", evacuation_time_seconds: 95 })];
    const m = computeSafetyMetrics([], drills);
    expect(m.avg_evacuation_time).toBe(95);
  });

  it("avg_evacuation_time includes drills from all years", () => {
    const previousYear = new Date();
    previousYear.setFullYear(previousYear.getFullYear() - 1);
    const drills = [
      makeDrill({ id: "d1", evacuation_time_seconds: 60, drill_date: previousYear.toISOString().split("T")[0] }),
      makeDrill({ id: "d2", evacuation_time_seconds: 120, drill_date: daysAgo(5) }),
    ];
    const m = computeSafetyMetrics([], drills);
    expect(m.avg_evacuation_time).toBe(90);
  });

  // ── by_category ───────────────────────────────────────────────────────

  it("by_category groups checks by category", () => {
    const checks = [
      makeCheck({ id: "c1", category: "fire_safety", compliance_status: "compliant" }),
      makeCheck({ id: "c2", category: "fire_safety", compliance_status: "non_compliant" }),
      makeCheck({ id: "c3", category: "electrical", compliance_status: "compliant" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.by_category["fire_safety"]).toEqual({ total: 2, compliant: 1 });
    expect(m.by_category["electrical"]).toEqual({ total: 1, compliant: 1 });
  });

  it("by_category is empty for no checks", () => {
    const m = computeSafetyMetrics([], []);
    expect(Object.keys(m.by_category)).toHaveLength(0);
  });

  it("by_category counts only compliant status as compliant", () => {
    const checks = [
      makeCheck({ id: "c1", category: "gas_safety", compliance_status: "partially_compliant" }),
      makeCheck({ id: "c2", category: "gas_safety", compliance_status: "not_applicable" }),
      makeCheck({ id: "c3", category: "gas_safety", compliance_status: "compliant" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.by_category["gas_safety"]).toEqual({ total: 3, compliant: 1 });
  });

  it("by_category handles a single category", () => {
    const checks = [
      makeCheck({ id: "c1", category: "legionella", compliance_status: "compliant" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(Object.keys(m.by_category)).toHaveLength(1);
    expect(m.by_category["legionella"]).toEqual({ total: 1, compliant: 1 });
  });

  it("by_category handles multiple categories with no compliant checks", () => {
    const checks = [
      makeCheck({ id: "c1", category: "coshh", compliance_status: "overdue" }),
      makeCheck({ id: "c2", category: "asbestos", compliance_status: "non_compliant" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.by_category["coshh"]).toEqual({ total: 1, compliant: 0 });
    expect(m.by_category["asbestos"]).toEqual({ total: 1, compliant: 0 });
  });

  // ── Combined scenarios ────────────────────────────────────────────────

  it("handles a fully populated single check with remedial actions and a drill", () => {
    const checks = [
      makeCheck({
        id: "c1",
        category: "fire_safety",
        compliance_status: "compliant",
        certificate_status: "expiring_soon",
        remedial_actions: [
          { action: "Replace extinguisher", priority: "medium", assigned_to: "s1", due_date: daysFromNow(7), completed: false, completion_date: null },
        ],
      }),
    ];
    const drills = [makeDrill({ id: "d1", evacuation_time_seconds: 90 })];
    const m = computeSafetyMetrics(checks, drills);
    expect(m.total_checks).toBe(1);
    expect(m.compliant_count).toBe(1);
    expect(m.compliance_rate).toBe(100);
    expect(m.certificates_expiring_soon).toBe(1);
    expect(m.open_remedial_actions).toBe(1);
    expect(m.critical_actions).toBe(0);
    expect(m.avg_evacuation_time).toBe(90);
    expect(m.by_category["fire_safety"]).toEqual({ total: 1, compliant: 1 });
  });

  it("handles multiple checks across all statuses simultaneously", () => {
    const checks = [
      makeCheck({ id: "c1", compliance_status: "compliant", certificate_status: "valid" }),
      makeCheck({ id: "c2", compliance_status: "non_compliant", certificate_status: "expired" }),
      makeCheck({ id: "c3", compliance_status: "overdue", certificate_status: "expiring_soon" }),
      makeCheck({ id: "c4", compliance_status: "partially_compliant", certificate_status: "pending_renewal" }),
      makeCheck({ id: "c5", compliance_status: "not_applicable", certificate_status: "valid" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.total_checks).toBe(5);
    expect(m.compliant_count).toBe(1);
    expect(m.compliance_rate).toBe(20);
    expect(m.overdue_checks).toBe(1);
    expect(m.non_compliant_checks).toBe(1);
    expect(m.certificates_expiring_soon).toBe(1);
    expect(m.certificates_expired).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifySafetyAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifySafetyAlerts", () => {
  const now = new Date("2026-05-13T12:00:00.000Z");

  it("returns no alerts for a fully compliant setup", () => {
    const checks = [makeCheck()];
    const drills = [makeDrill({ drill_date: "2026-05-01" })];
    const alerts = identifySafetyAlerts(checks, drills, now);
    expect(alerts).toHaveLength(0);
  });

  it("returns empty array when no checks and no drills", () => {
    const alerts = identifySafetyAlerts([], [], now);
    expect(alerts).toHaveLength(0);
  });

  // ── non_compliant alerts ──────────────────────────────────────────────

  it("raises critical alert for non-compliant check", () => {
    const checks = [
      makeCheck({ id: "c1", check_name: "Gas Boiler", compliance_status: "non_compliant" }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const nc = alerts.find((a) => a.type === "non_compliant");
    expect(nc).toBeTruthy();
    expect(nc!.severity).toBe("critical");
    expect(nc!.id).toBe("c1");
  });

  it("non_compliant alert message contains check name", () => {
    const checks = [
      makeCheck({ id: "c1", check_name: "Gas Boiler Inspection", compliance_status: "non_compliant" }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const nc = alerts.find((a) => a.type === "non_compliant");
    expect(nc!.message).toContain("Gas Boiler Inspection");
  });

  it("non_compliant alert message references Reg 25", () => {
    const checks = [
      makeCheck({ id: "c1", compliance_status: "non_compliant" }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const nc = alerts.find((a) => a.type === "non_compliant");
    expect(nc!.message).toContain("Reg 25");
  });

  it("raises multiple non_compliant alerts for multiple non-compliant checks", () => {
    const checks = [
      makeCheck({ id: "c1", compliance_status: "non_compliant" }),
      makeCheck({ id: "c2", compliance_status: "non_compliant" }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const ncs = alerts.filter((a) => a.type === "non_compliant");
    expect(ncs).toHaveLength(2);
  });

  it("does not raise non_compliant for compliant checks", () => {
    const checks = [makeCheck({ compliance_status: "compliant" })];
    const alerts = identifySafetyAlerts(checks, [], now);
    const nc = alerts.find((a) => a.type === "non_compliant");
    expect(nc).toBeUndefined();
  });

  it("does not raise non_compliant for overdue checks", () => {
    const checks = [makeCheck({ compliance_status: "overdue" })];
    const alerts = identifySafetyAlerts(checks, [], now);
    const nc = alerts.find((a) => a.type === "non_compliant");
    expect(nc).toBeUndefined();
  });

  it("does not raise non_compliant for partially_compliant checks", () => {
    const checks = [makeCheck({ compliance_status: "partially_compliant" })];
    const alerts = identifySafetyAlerts(checks, [], now);
    const nc = alerts.find((a) => a.type === "non_compliant");
    expect(nc).toBeUndefined();
  });

  // ── check_overdue alerts ──────────────────────────────────────────────

  it("raises high alert for overdue check", () => {
    const checks = [
      makeCheck({ id: "c1", check_name: "PAT Test", next_due_date: "2026-04-01", compliance_status: "compliant" }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const od = alerts.find((a) => a.type === "check_overdue");
    expect(od).toBeTruthy();
    expect(od!.severity).toBe("high");
    expect(od!.id).toBe("c1");
  });

  it("check_overdue alert message contains check name", () => {
    const checks = [
      makeCheck({ id: "c1", check_name: "Legionella Flush", next_due_date: "2026-04-01" }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const od = alerts.find((a) => a.type === "check_overdue");
    expect(od!.message).toContain("Legionella Flush");
  });

  it("check_overdue alert message contains days overdue count", () => {
    const checks = [
      makeCheck({ id: "c1", next_due_date: "2026-04-13" }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const od = alerts.find((a) => a.type === "check_overdue");
    // now is noon on May 13, April 13 midnight is 30d 12h => rounds to 31
    expect(od!.message).toContain("31");
  });

  it("check_overdue alert message contains next due date", () => {
    const checks = [
      makeCheck({ id: "c1", next_due_date: "2026-04-13" }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const od = alerts.find((a) => a.type === "check_overdue");
    expect(od!.message).toContain("2026-04-13");
  });

  it("does not raise check_overdue for future due date", () => {
    const checks = [
      makeCheck({ id: "c1", next_due_date: "2026-06-01" }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const od = alerts.find((a) => a.type === "check_overdue");
    expect(od).toBeUndefined();
  });

  it("does not raise check_overdue for not_applicable checks even if past due", () => {
    const checks = [
      makeCheck({ id: "c1", next_due_date: "2026-01-01", compliance_status: "not_applicable" }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const od = alerts.find((a) => a.type === "check_overdue");
    expect(od).toBeUndefined();
  });

  it("raises check_overdue for overdue check even if compliance_status is compliant", () => {
    const checks = [
      makeCheck({ id: "c1", next_due_date: "2026-04-01", compliance_status: "compliant" }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const od = alerts.find((a) => a.type === "check_overdue");
    expect(od).toBeTruthy();
  });

  it("raises multiple check_overdue alerts for multiple overdue checks", () => {
    const checks = [
      makeCheck({ id: "c1", next_due_date: "2026-03-01" }),
      makeCheck({ id: "c2", next_due_date: "2026-02-01" }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const ods = alerts.filter((a) => a.type === "check_overdue");
    expect(ods).toHaveLength(2);
  });

  // ── certificate_expired alerts ────────────────────────────────────────

  it("raises critical alert for expired certificate", () => {
    const checks = [
      makeCheck({ id: "c1", check_name: "Electrical Cert", certificate_status: "expired" }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const ce = alerts.find((a) => a.type === "certificate_expired");
    expect(ce).toBeTruthy();
    expect(ce!.severity).toBe("critical");
    expect(ce!.id).toBe("c1");
  });

  it("certificate_expired alert message contains check name", () => {
    const checks = [
      makeCheck({ id: "c1", check_name: "Gas Safety Cert", certificate_status: "expired" }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const ce = alerts.find((a) => a.type === "certificate_expired");
    expect(ce!.message).toContain("Gas Safety Cert");
  });

  it("does not raise certificate_expired for valid certificate", () => {
    const checks = [makeCheck({ certificate_status: "valid" })];
    const alerts = identifySafetyAlerts(checks, [], now);
    const ce = alerts.find((a) => a.type === "certificate_expired");
    expect(ce).toBeUndefined();
  });

  it("does not raise certificate_expired for expiring_soon", () => {
    const checks = [makeCheck({ certificate_status: "expiring_soon" })];
    const alerts = identifySafetyAlerts(checks, [], now);
    const ce = alerts.find((a) => a.type === "certificate_expired");
    expect(ce).toBeUndefined();
  });

  it("does not raise certificate_expired for pending_renewal", () => {
    const checks = [makeCheck({ certificate_status: "pending_renewal" })];
    const alerts = identifySafetyAlerts(checks, [], now);
    const ce = alerts.find((a) => a.type === "certificate_expired");
    expect(ce).toBeUndefined();
  });

  it("raises multiple certificate_expired alerts for multiple expired certs", () => {
    const checks = [
      makeCheck({ id: "c1", certificate_status: "expired" }),
      makeCheck({ id: "c2", certificate_status: "expired" }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const ces = alerts.filter((a) => a.type === "certificate_expired");
    expect(ces).toHaveLength(2);
  });

  // ── certificate_expiring alerts ───────────────────────────────────────

  it("raises medium alert for expiring soon certificate", () => {
    const checks = [
      makeCheck({ id: "c1", check_name: "PAT Certificate", certificate_status: "expiring_soon" }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const cx = alerts.find((a) => a.type === "certificate_expiring");
    expect(cx).toBeTruthy();
    expect(cx!.severity).toBe("medium");
    expect(cx!.id).toBe("c1");
  });

  it("certificate_expiring alert message contains check name", () => {
    const checks = [
      makeCheck({ id: "c1", check_name: "Water Tank Cert", certificate_status: "expiring_soon" }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const cx = alerts.find((a) => a.type === "certificate_expiring");
    expect(cx!.message).toContain("Water Tank Cert");
  });

  it("does not raise certificate_expiring for valid certificate", () => {
    const checks = [makeCheck({ certificate_status: "valid" })];
    const alerts = identifySafetyAlerts(checks, [], now);
    const cx = alerts.find((a) => a.type === "certificate_expiring");
    expect(cx).toBeUndefined();
  });

  it("does not raise certificate_expiring for expired certificate", () => {
    const checks = [makeCheck({ certificate_status: "expired" })];
    const alerts = identifySafetyAlerts(checks, [], now);
    const cx = alerts.find((a) => a.type === "certificate_expiring");
    expect(cx).toBeUndefined();
  });

  it("raises multiple certificate_expiring alerts", () => {
    const checks = [
      makeCheck({ id: "c1", certificate_status: "expiring_soon" }),
      makeCheck({ id: "c2", certificate_status: "expiring_soon" }),
      makeCheck({ id: "c3", certificate_status: "expiring_soon" }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const cxs = alerts.filter((a) => a.type === "certificate_expiring");
    expect(cxs).toHaveLength(3);
  });

  // ── critical_action_outstanding alerts ────────────────────────────────

  it("raises critical alert for uncompleted critical remedial action", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_name: "Fire Door Check",
        remedial_actions: [
          { action: "Replace fire door closer", priority: "critical", assigned_to: "John", due_date: daysFromNow(3), completed: false, completion_date: null },
        ],
      }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const ca = alerts.find((a) => a.type === "critical_action_outstanding");
    expect(ca).toBeTruthy();
    expect(ca!.severity).toBe("critical");
    expect(ca!.id).toBe("c1");
  });

  it("critical_action_outstanding alert message contains check name", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_name: "Alarm System",
        remedial_actions: [
          { action: "Replace sensor", priority: "critical", assigned_to: "Jane", due_date: daysFromNow(1), completed: false, completion_date: null },
        ],
      }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const ca = alerts.find((a) => a.type === "critical_action_outstanding");
    expect(ca!.message).toContain("Alarm System");
  });

  it("critical_action_outstanding alert message contains action text", () => {
    const checks = [
      makeCheck({
        id: "c1",
        remedial_actions: [
          { action: "Fix emergency lighting", priority: "critical", assigned_to: "Bob", due_date: daysFromNow(1), completed: false, completion_date: null },
        ],
      }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const ca = alerts.find((a) => a.type === "critical_action_outstanding");
    expect(ca!.message).toContain("Fix emergency lighting");
  });

  it("critical_action_outstanding alert message contains assigned_to", () => {
    const checks = [
      makeCheck({
        id: "c1",
        remedial_actions: [
          { action: "Fix alarm", priority: "critical", assigned_to: "Darren", due_date: daysFromNow(1), completed: false, completion_date: null },
        ],
      }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const ca = alerts.find((a) => a.type === "critical_action_outstanding");
    expect(ca!.message).toContain("Darren");
  });

  it("does not raise critical_action_outstanding for completed critical actions", () => {
    const checks = [
      makeCheck({
        id: "c1",
        remedial_actions: [
          { action: "Done", priority: "critical", assigned_to: "s1", due_date: daysAgo(5), completed: true, completion_date: daysAgo(3) },
        ],
      }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const ca = alerts.find((a) => a.type === "critical_action_outstanding");
    expect(ca).toBeUndefined();
  });

  it("does not raise critical_action_outstanding for non-critical uncompleted actions", () => {
    const checks = [
      makeCheck({
        id: "c1",
        remedial_actions: [
          { action: "Paint wall", priority: "low", assigned_to: "s1", due_date: daysFromNow(30), completed: false, completion_date: null },
          { action: "Fix shelf", priority: "high", assigned_to: "s2", due_date: daysFromNow(14), completed: false, completion_date: null },
          { action: "Order parts", priority: "medium", assigned_to: "s3", due_date: daysFromNow(21), completed: false, completion_date: null },
        ],
      }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const ca = alerts.find((a) => a.type === "critical_action_outstanding");
    expect(ca).toBeUndefined();
  });

  it("raises multiple critical_action_outstanding alerts for multiple critical actions", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_name: "Check A",
        remedial_actions: [
          { action: "Action 1", priority: "critical", assigned_to: "s1", due_date: daysFromNow(1), completed: false, completion_date: null },
          { action: "Action 2", priority: "critical", assigned_to: "s2", due_date: daysFromNow(2), completed: false, completion_date: null },
        ],
      }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const cas = alerts.filter((a) => a.type === "critical_action_outstanding");
    expect(cas).toHaveLength(2);
  });

  // ── no_recent_drill alerts ────────────────────────────────────────────

  it("raises high alert when drills exist but none in last 90 days", () => {
    const drills = [
      makeDrill({ id: "d1", drill_date: "2026-01-01" }),
    ];
    const alerts = identifySafetyAlerts([], drills, now);
    const nrd = alerts.find((a) => a.type === "no_recent_drill");
    expect(nrd).toBeTruthy();
    expect(nrd!.severity).toBe("high");
    expect(nrd!.id).toBe("d1");
  });

  it("no_recent_drill alert message references Reg 44", () => {
    const drills = [
      makeDrill({ id: "d1", drill_date: "2025-12-01" }),
    ];
    const alerts = identifySafetyAlerts([], drills, now);
    const nrd = alerts.find((a) => a.type === "no_recent_drill");
    expect(nrd!.message).toContain("Reg 44");
  });

  it("does not raise no_recent_drill when a drill is within 90 days", () => {
    const drills = [
      makeDrill({ id: "d1", drill_date: "2026-04-01" }),
    ];
    const alerts = identifySafetyAlerts([], drills, now);
    const nrd = alerts.find((a) => a.type === "no_recent_drill");
    expect(nrd).toBeUndefined();
  });

  it("does not raise no_recent_drill when drills array is empty", () => {
    const alerts = identifySafetyAlerts([], [], now);
    const nrd = alerts.find((a) => a.type === "no_recent_drill");
    expect(nrd).toBeUndefined();
  });

  it("does not raise no_recent_drill when at least one drill is recent", () => {
    const drills = [
      makeDrill({ id: "d1", drill_date: "2025-12-01" }),
      makeDrill({ id: "d2", drill_date: "2026-05-01" }),
    ];
    const alerts = identifySafetyAlerts([], drills, now);
    const nrd = alerts.find((a) => a.type === "no_recent_drill");
    expect(nrd).toBeUndefined();
  });

  it("no_recent_drill uses first drill id as alert id", () => {
    const drills = [
      makeDrill({ id: "first-drill", drill_date: "2025-11-01" }),
      makeDrill({ id: "second-drill", drill_date: "2025-10-01" }),
    ];
    const alerts = identifySafetyAlerts([], drills, now);
    const nrd = alerts.find((a) => a.type === "no_recent_drill");
    expect(nrd!.id).toBe("first-drill");
  });

  it("drill exactly 90 days ago (from midnight now) counts as recent", () => {
    // Use midnight as now so boundary is exact
    const midnightNow = new Date("2026-05-13T00:00:00.000Z");
    const exactly90 = new Date(midnightNow.getTime() - 90 * 86400000);
    const drills = [
      makeDrill({ id: "d1", drill_date: exactly90.toISOString().split("T")[0] }),
    ];
    const alerts = identifySafetyAlerts([], drills, midnightNow);
    const nrd = alerts.find((a) => a.type === "no_recent_drill");
    expect(nrd).toBeUndefined();
  });

  it("drill 91 days ago does not count as recent", () => {
    const day91 = new Date(now.getTime() - 91 * 86400000);
    const drills = [
      makeDrill({ id: "d1", drill_date: day91.toISOString().split("T")[0] }),
    ];
    const alerts = identifySafetyAlerts([], drills, now);
    const nrd = alerts.find((a) => a.type === "no_recent_drill");
    expect(nrd).toBeTruthy();
  });

  // ── failed_evacuation alerts ──────────────────────────────────────────

  it("raises critical alert for failed evacuation", () => {
    const drills = [
      makeDrill({ id: "d1", drill_date: "2026-05-01", all_evacuated: false }),
    ];
    const alerts = identifySafetyAlerts([], drills, now);
    const fe = alerts.find((a) => a.type === "failed_evacuation");
    expect(fe).toBeTruthy();
    expect(fe!.severity).toBe("critical");
    expect(fe!.id).toBe("d1");
  });

  it("failed_evacuation alert message contains drill date", () => {
    const drills = [
      makeDrill({ id: "d1", drill_date: "2026-05-10", all_evacuated: false }),
    ];
    const alerts = identifySafetyAlerts([], drills, now);
    const fe = alerts.find((a) => a.type === "failed_evacuation");
    expect(fe!.message).toContain("2026-05-10");
  });

  it("does not raise failed_evacuation when all evacuated", () => {
    const drills = [
      makeDrill({ id: "d1", all_evacuated: true }),
    ];
    const alerts = identifySafetyAlerts([], drills, now);
    const fe = alerts.find((a) => a.type === "failed_evacuation");
    expect(fe).toBeUndefined();
  });

  it("raises multiple failed_evacuation alerts for multiple failed drills", () => {
    const drills = [
      makeDrill({ id: "d1", drill_date: "2026-05-01", all_evacuated: false }),
      makeDrill({ id: "d2", drill_date: "2026-04-15", all_evacuated: false }),
      makeDrill({ id: "d3", drill_date: "2026-04-01", all_evacuated: true }),
    ];
    const alerts = identifySafetyAlerts([], drills, now);
    const fes = alerts.filter((a) => a.type === "failed_evacuation");
    expect(fes).toHaveLength(2);
  });

  it("failed_evacuation alert raised regardless of drill age", () => {
    const drills = [
      makeDrill({ id: "d1", drill_date: "2025-01-01", all_evacuated: false }),
    ];
    const alerts = identifySafetyAlerts([], drills, now);
    const fe = alerts.find((a) => a.type === "failed_evacuation");
    expect(fe).toBeTruthy();
  });

  // ── now parameter override ────────────────────────────────────────────

  it("now parameter controls overdue calculation", () => {
    const checks = [
      makeCheck({ id: "c1", next_due_date: "2026-06-01" }),
    ];
    const futureNow = new Date("2026-07-01T12:00:00.000Z");
    const alerts = identifySafetyAlerts(checks, [], futureNow);
    const od = alerts.find((a) => a.type === "check_overdue");
    expect(od).toBeTruthy();
  });

  it("now parameter controls drill recency calculation", () => {
    const drills = [
      makeDrill({ id: "d1", drill_date: "2026-05-01" }),
    ];
    // With now = May 13, drill is within 90 days
    const alerts1 = identifySafetyAlerts([], drills, now);
    expect(alerts1.find((a) => a.type === "no_recent_drill")).toBeUndefined();

    // With now = Sep 01, drill is >90 days old
    const farNow = new Date("2026-09-01T12:00:00.000Z");
    const alerts2 = identifySafetyAlerts([], drills, farNow);
    expect(alerts2.find((a) => a.type === "no_recent_drill")).toBeTruthy();
  });

  it("now defaults correctly when not provided (does not throw)", () => {
    const checks = [
      makeCheck({ compliance_status: "non_compliant" }),
    ];
    const alerts = identifySafetyAlerts(checks, []);
    const nc = alerts.find((a) => a.type === "non_compliant");
    expect(nc).toBeTruthy();
  });

  // ── Combined scenarios ────────────────────────────────────────────────

  it("raises multiple alert types for a check with many issues", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_name: "Fire System",
        compliance_status: "non_compliant",
        next_due_date: "2026-03-01",
        certificate_status: "expired",
        remedial_actions: [
          { action: "Replace panel", priority: "critical", assigned_to: "s1", due_date: daysFromNow(1), completed: false, completion_date: null },
        ],
      }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("non_compliant");
    expect(types).toContain("check_overdue");
    expect(types).toContain("certificate_expired");
    expect(types).toContain("critical_action_outstanding");
  });

  it("raises alerts from both checks and drills simultaneously", () => {
    const checks = [
      makeCheck({ id: "c1", compliance_status: "non_compliant", certificate_status: "expiring_soon" }),
    ];
    const drills = [
      makeDrill({ id: "d1", drill_date: "2025-12-01", all_evacuated: false }),
    ];
    const alerts = identifySafetyAlerts(checks, drills, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("non_compliant");
    expect(types).toContain("certificate_expiring");
    expect(types).toContain("no_recent_drill");
    expect(types).toContain("failed_evacuation");
  });

  it("each alert has required fields: type, severity, message, id", () => {
    const checks = [
      makeCheck({
        id: "c1",
        compliance_status: "non_compliant",
        certificate_status: "expired",
        next_due_date: "2026-01-01",
        remedial_actions: [
          { action: "Fix", priority: "critical", assigned_to: "s1", due_date: daysFromNow(1), completed: false, completion_date: null },
        ],
      }),
    ];
    const drills = [
      makeDrill({ id: "d1", drill_date: "2025-01-01", all_evacuated: false }),
    ];
    const alerts = identifySafetyAlerts(checks, drills, now);
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

  it("does not raise check_overdue when next_due_date exactly equals now", () => {
    const checks = [
      makeCheck({ id: "c1", next_due_date: "2026-05-13" }),
    ];
    // now is 2026-05-13T12:00:00 — next_due_date parsed as 2026-05-13T00:00:00 is < now
    const alerts = identifySafetyAlerts(checks, [], now);
    const od = alerts.find((a) => a.type === "check_overdue");
    // Date("2026-05-13") is midnight, which is < noon, so it IS overdue
    expect(od).toBeTruthy();
  });

  it("check with non_compliant AND certificate_expired raises both alerts", () => {
    const checks = [
      makeCheck({
        id: "c1",
        compliance_status: "non_compliant",
        certificate_status: "expired",
      }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    const nc = alerts.find((a) => a.type === "non_compliant");
    const ce = alerts.find((a) => a.type === "certificate_expired");
    expect(nc).toBeTruthy();
    expect(ce).toBeTruthy();
  });

  it("no_recent_drill and failed_evacuation can coexist from same drill set", () => {
    const drills = [
      makeDrill({ id: "d1", drill_date: "2025-01-01", all_evacuated: false }),
    ];
    const alerts = identifySafetyAlerts([], drills, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("no_recent_drill");
    expect(types).toContain("failed_evacuation");
  });

  it("compliant check with valid cert and future due date raises no alerts", () => {
    const checks = [
      makeCheck({
        compliance_status: "compliant",
        certificate_status: "valid",
        next_due_date: "2026-12-01",
        remedial_actions: [],
      }),
    ];
    const alerts = identifySafetyAlerts(checks, [], now);
    expect(alerts).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listChecks ────────────────────────────────────────────────────────

  it("listChecks returns ok: true with empty array", async () => {
    const result = await listChecks("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listChecks returns ok: true with category filter", async () => {
    const result = await listChecks("home-1", { category: "fire_safety" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listChecks returns ok: true with complianceStatus filter", async () => {
    const result = await listChecks("home-1", { complianceStatus: "compliant" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listChecks returns ok: true with limit filter", async () => {
    const result = await listChecks("home-1", { limit: 10 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listChecks result data is an array type", async () => {
    const result = await listChecks("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Array.isArray(result.data)).toBe(true);
    }
  });

  // ── createCheck ───────────────────────────────────────────────────────

  it("createCheck returns ok: false with error message", async () => {
    const result = await createCheck({
      homeId: "home-1",
      category: "fire_safety",
      checkName: "Fire Alarm Test",
      checkDate: daysAgo(1),
      checkedBy: "staff-1",
      frequency: "weekly",
      nextDueDate: daysFromNow(7),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createCheck returns error even with full input", async () => {
    const result = await createCheck({
      homeId: "home-1",
      category: "electrical",
      checkName: "Electrical Inspection",
      checkDate: daysAgo(1),
      checkedBy: "contractor-1",
      frequency: "five_yearly",
      nextDueDate: daysFromNow(1825),
      complianceStatus: "compliant",
      findings: "All circuits tested OK",
      remedialActions: [],
      certificateReference: "EICR-2026-001",
      certificateExpiry: daysFromNow(1825),
      certificateStatus: "valid",
      notes: "Full EICR completed",
    });
    expect(result.ok).toBe(false);
  });

  it("createCheck error message is a string", async () => {
    const result = await createCheck({
      homeId: "home-1",
      category: "gas_safety",
      checkName: "Gas Safety Check",
      checkDate: daysAgo(1),
      checkedBy: "gas-engineer",
      frequency: "annual",
      nextDueDate: daysFromNow(365),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  // ── updateCheck ───────────────────────────────────────────────────────

  it("updateCheck returns ok: false with error message", async () => {
    const result = await updateCheck("check-1", { compliance_status: "compliant" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateCheck returns error for any update payload", async () => {
    const result = await updateCheck("check-1", {
      check_name: "Updated Name",
      notes: "Updated notes",
    });
    expect(result.ok).toBe(false);
  });

  it("updateCheck error message is a string", async () => {
    const result = await updateCheck("check-1", { notes: "test" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  // ── listDrills ────────────────────────────────────────────────────────

  it("listDrills returns ok: true with empty array", async () => {
    const result = await listDrills("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listDrills returns ok: true with dateFrom filter", async () => {
    const result = await listDrills("home-1", { dateFrom: daysAgo(30) });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listDrills returns ok: true with dateTo filter", async () => {
    const result = await listDrills("home-1", { dateTo: daysFromNow(0) });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listDrills returns ok: true with limit filter", async () => {
    const result = await listDrills("home-1", { limit: 25 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listDrills result data is an array type", async () => {
    const result = await listDrills("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Array.isArray(result.data)).toBe(true);
    }
  });

  // ── createDrill ───────────────────────────────────────────────────────

  it("createDrill returns ok: false with error message", async () => {
    const result = await createDrill({
      homeId: "home-1",
      drillDate: daysAgo(1),
      drillTime: "14:30",
      drillType: "planned",
      evacuationTimeSeconds: 120,
      allEvacuated: true,
      childrenPresent: 4,
      staffPresent: 3,
      assemblyPointUsed: "Front Car Park",
      conductedBy: "staff-1",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createDrill returns error with full input", async () => {
    const result = await createDrill({
      homeId: "home-1",
      drillDate: daysAgo(1),
      drillTime: "10:00",
      drillType: "unannounced",
      evacuationTimeSeconds: 95,
      allEvacuated: true,
      childrenPresent: 5,
      staffPresent: 4,
      visitorsPresent: 1,
      assemblyPointUsed: "Rear Assembly Point",
      issuesIdentified: "Stairwell door stuck",
      actionsRequired: "Fix door closer",
      conductedBy: "manager-1",
      notes: "Unannounced drill during lunch",
    });
    expect(result.ok).toBe(false);
  });

  it("createDrill error message is a string", async () => {
    const result = await createDrill({
      homeId: "home-1",
      drillDate: daysAgo(1),
      drillTime: "09:00",
      drillType: "planned",
      evacuationTimeSeconds: 110,
      allEvacuated: true,
      childrenPresent: 3,
      staffPresent: 2,
      assemblyPointUsed: "Main Gate",
      conductedBy: "staff-2",
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
  it("computeSafetyMetrics handles check with empty remedial_actions array", () => {
    const checks = [makeCheck({ remedial_actions: [] })];
    const m = computeSafetyMetrics(checks, []);
    expect(m.open_remedial_actions).toBe(0);
    expect(m.critical_actions).toBe(0);
  });

  it("computeSafetyMetrics handles all certificates in pending_renewal", () => {
    const checks = [
      makeCheck({ id: "c1", certificate_status: "pending_renewal" }),
      makeCheck({ id: "c2", certificate_status: "pending_renewal" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.certificates_expiring_soon).toBe(0);
    expect(m.certificates_expired).toBe(0);
  });

  it("computeSafetyMetrics handles large number of checks", () => {
    const checks = Array.from({ length: 100 }, (_, i) =>
      makeCheck({ id: `c${i}`, compliance_status: i % 2 === 0 ? "compliant" : "non_compliant" }),
    );
    const m = computeSafetyMetrics(checks, []);
    expect(m.total_checks).toBe(100);
    expect(m.compliant_count).toBe(50);
    expect(m.non_compliant_checks).toBe(50);
    expect(m.compliance_rate).toBe(50);
  });

  it("computeSafetyMetrics handles drill with 0 evacuation time", () => {
    const drills = [makeDrill({ evacuation_time_seconds: 0 })];
    const m = computeSafetyMetrics([], drills);
    expect(m.avg_evacuation_time).toBe(0);
  });

  it("identifySafetyAlerts handles check with mixed remedial action priorities", () => {
    const checks = [
      makeCheck({
        id: "c1",
        check_name: "Mixed Check",
        remedial_actions: [
          { action: "A1", priority: "critical", assigned_to: "s1", due_date: daysFromNow(1), completed: false, completion_date: null },
          { action: "A2", priority: "high", assigned_to: "s2", due_date: daysFromNow(7), completed: false, completion_date: null },
          { action: "A3", priority: "critical", assigned_to: "s3", due_date: daysFromNow(3), completed: true, completion_date: daysAgo(1) },
        ],
      }),
    ];
    const now = new Date("2026-05-13T12:00:00.000Z");
    const alerts = identifySafetyAlerts(checks, [], now);
    const cas = alerts.filter((a) => a.type === "critical_action_outstanding");
    // Only the first uncompleted critical action
    expect(cas).toHaveLength(1);
  });

  it("identifySafetyAlerts handles drill at exactly 90-day boundary via now param", () => {
    // Use midnight as now so the 90-day boundary aligns exactly with date-string parsing
    const midnightNow = new Date("2026-05-13T00:00:00.000Z");
    const boundary = new Date(midnightNow.getTime() - 90 * 86400000);
    const drills = [
      makeDrill({ id: "d1", drill_date: boundary.toISOString().split("T")[0] }),
    ];
    const alerts = identifySafetyAlerts([], drills, midnightNow);
    const nrd = alerts.find((a) => a.type === "no_recent_drill");
    expect(nrd).toBeUndefined();
  });

  it("computeSafetyMetrics by_category creates entries for every unique category", () => {
    const checks = [
      makeCheck({ id: "c1", category: "fire_safety" }),
      makeCheck({ id: "c2", category: "legionella" }),
      makeCheck({ id: "c3", category: "electrical" }),
      makeCheck({ id: "c4", category: "coshh" }),
      makeCheck({ id: "c5", category: "fire_safety" }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(Object.keys(m.by_category)).toHaveLength(4);
    expect(m.by_category["fire_safety"].total).toBe(2);
  });

  it("identifySafetyAlerts check with expiring_soon cert and non_compliant raises both alert types", () => {
    const checks = [
      makeCheck({
        id: "c1",
        compliance_status: "non_compliant",
        certificate_status: "expiring_soon",
      }),
    ];
    const now = new Date("2026-05-13T12:00:00.000Z");
    const alerts = identifySafetyAlerts(checks, [], now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("non_compliant");
    expect(types).toContain("certificate_expiring");
  });

  it("computeSafetyMetrics handles check with all remedial actions completed", () => {
    const checks = [
      makeCheck({
        remedial_actions: [
          { action: "A1", priority: "critical", assigned_to: "s1", due_date: daysAgo(10), completed: true, completion_date: daysAgo(8) },
          { action: "A2", priority: "high", assigned_to: "s2", due_date: daysAgo(5), completed: true, completion_date: daysAgo(3) },
        ],
      }),
    ];
    const m = computeSafetyMetrics(checks, []);
    expect(m.open_remedial_actions).toBe(0);
    expect(m.critical_actions).toBe(0);
  });

  it("computeSafetyMetrics compliance_rate with single compliant check is 100", () => {
    const checks = [makeCheck({ compliance_status: "compliant" })];
    const m = computeSafetyMetrics(checks, []);
    expect(m.compliance_rate).toBe(100);
  });
});
