// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DIVERSITY & INCLUSION SERVICE TESTS
// Pure-function unit tests for diversity metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 6 (quality and purpose of care),
// Reg 11 (positive relationships — respecting diversity),
// Equality Act 2010 (protected characteristics).
// SCCIF: Overall Experiences — "Children's diversity is celebrated."
// "The home promotes equality and prevents discrimination."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  PROTECTED_CHARACTERISTICS,
  SUPPORT_CATEGORIES,
  SUPPORT_STATUSES,
  REVIEW_OUTCOMES,
  listRecords,
  createRecord,
  updateRecord,
} from "../diversity-inclusion-service";

import type {
  DiversityRecord,
  ProtectedCharacteristic,
  SupportCategory,
  SupportStatus,
  ReviewOutcome,
} from "../diversity-inclusion-service";

const { computeDiversityMetrics, identifyDiversityAlerts } = _testing;

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

/** Build a minimal DiversityRecord with sensible defaults. */
function makeRecord(overrides: Partial<DiversityRecord> = {}): DiversityRecord {
  return {
    id: "dr-1",
    home_id: "home-1",
    child_name: "Alice Smith",
    child_id: "child-1",
    protected_characteristic: "race_ethnicity",
    characteristic_detail: "Mixed heritage",
    support_category: "cultural_activity",
    support_description: "Cultural celebrations",
    support_status: "in_place",
    review_outcome: "fully_effective",
    reviewed_date: daysAgo(7),
    next_review_date: daysFromNow(90),
    child_views: null,
    child_satisfied: null,
    staff_aware: true,
    staff_trained: true,
    external_support: null,
    equality_impact_assessed: true,
    notes: null,
    created_at: daysAgoISO(30),
    updated_at: daysAgoISO(7),
    ...overrides,
  } as DiversityRecord;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("PROTECTED_CHARACTERISTICS", () => {
  it("has exactly 9 entries", () => {
    expect(PROTECTED_CHARACTERISTICS).toHaveLength(9);
  });

  it("contains unique characteristic values", () => {
    const values = PROTECTED_CHARACTERISTICS.map((c) => c.characteristic);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = PROTECTED_CHARACTERISTICS.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes race_ethnicity", () => {
    expect(PROTECTED_CHARACTERISTICS.find((c) => c.characteristic === "race_ethnicity")).toBeTruthy();
  });

  it("includes religion_belief", () => {
    expect(PROTECTED_CHARACTERISTICS.find((c) => c.characteristic === "religion_belief")).toBeTruthy();
  });

  it("includes disability", () => {
    expect(PROTECTED_CHARACTERISTICS.find((c) => c.characteristic === "disability")).toBeTruthy();
  });

  it("includes gender_identity", () => {
    expect(PROTECTED_CHARACTERISTICS.find((c) => c.characteristic === "gender_identity")).toBeTruthy();
  });

  it("includes sexual_orientation", () => {
    expect(PROTECTED_CHARACTERISTICS.find((c) => c.characteristic === "sexual_orientation")).toBeTruthy();
  });

  it("includes age", () => {
    expect(PROTECTED_CHARACTERISTICS.find((c) => c.characteristic === "age")).toBeTruthy();
  });

  it("includes language", () => {
    expect(PROTECTED_CHARACTERISTICS.find((c) => c.characteristic === "language")).toBeTruthy();
  });

  it("includes cultural_heritage", () => {
    expect(PROTECTED_CHARACTERISTICS.find((c) => c.characteristic === "cultural_heritage")).toBeTruthy();
  });

  it("includes other", () => {
    expect(PROTECTED_CHARACTERISTICS.find((c) => c.characteristic === "other")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const c of PROTECTED_CHARACTERISTICS) {
      expect(c.label.length).toBeGreaterThan(0);
    }
  });
});

describe("SUPPORT_CATEGORIES", () => {
  it("has exactly 11 entries", () => {
    expect(SUPPORT_CATEGORIES).toHaveLength(11);
  });

  it("contains unique category values", () => {
    const values = SUPPORT_CATEGORIES.map((c) => c.category);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = SUPPORT_CATEGORIES.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected support categories", () => {
    const expected: SupportCategory[] = [
      "dietary_requirement", "religious_observance", "language_support",
      "accessibility_adaptation", "cultural_activity", "identity_support",
      "community_link", "specialist_provision", "staff_training",
      "policy_adaptation", "other",
    ];
    for (const cat of expected) {
      expect(SUPPORT_CATEGORIES.find((c) => c.category === cat)).toBeTruthy();
    }
  });

  it("each entry has a non-empty label", () => {
    for (const c of SUPPORT_CATEGORIES) {
      expect(c.label.length).toBeGreaterThan(0);
    }
  });
});

describe("SUPPORT_STATUSES", () => {
  it("has exactly 5 entries", () => {
    expect(SUPPORT_STATUSES).toHaveLength(5);
  });

  it("contains unique status values", () => {
    const values = SUPPORT_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = SUPPORT_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes in_place", () => {
    expect(SUPPORT_STATUSES.find((s) => s.status === "in_place")).toBeTruthy();
  });

  it("includes partially_met", () => {
    expect(SUPPORT_STATUSES.find((s) => s.status === "partially_met")).toBeTruthy();
  });

  it("includes not_met", () => {
    expect(SUPPORT_STATUSES.find((s) => s.status === "not_met")).toBeTruthy();
  });

  it("includes under_review", () => {
    expect(SUPPORT_STATUSES.find((s) => s.status === "under_review")).toBeTruthy();
  });

  it("includes not_applicable", () => {
    expect(SUPPORT_STATUSES.find((s) => s.status === "not_applicable")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const s of SUPPORT_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});

describe("REVIEW_OUTCOMES", () => {
  it("has exactly 5 entries", () => {
    expect(REVIEW_OUTCOMES).toHaveLength(5);
  });

  it("contains unique outcome values", () => {
    const values = REVIEW_OUTCOMES.map((o) => o.outcome);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = REVIEW_OUTCOMES.map((o) => o.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes fully_effective", () => {
    expect(REVIEW_OUTCOMES.find((o) => o.outcome === "fully_effective")).toBeTruthy();
  });

  it("includes partially_effective", () => {
    expect(REVIEW_OUTCOMES.find((o) => o.outcome === "partially_effective")).toBeTruthy();
  });

  it("includes not_effective", () => {
    expect(REVIEW_OUTCOMES.find((o) => o.outcome === "not_effective")).toBeTruthy();
  });

  it("includes needs_adjustment", () => {
    expect(REVIEW_OUTCOMES.find((o) => o.outcome === "needs_adjustment")).toBeTruthy();
  });

  it("includes not_reviewed", () => {
    expect(REVIEW_OUTCOMES.find((o) => o.outcome === "not_reviewed")).toBeTruthy();
  });

  it("each entry has a non-empty label", () => {
    for (const o of REVIEW_OUTCOMES) {
      expect(o.label.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeDiversityMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeDiversityMetrics", () => {
  it("returns zeroed metrics for empty records array", () => {
    const m = computeDiversityMetrics([], 0);
    expect(m.total_records).toBe(0);
    expect(m.children_with_records).toBe(0);
    expect(m.children_coverage).toBe(0);
    expect(m.in_place_count).toBe(0);
    expect(m.partially_met_count).toBe(0);
    expect(m.not_met_count).toBe(0);
    expect(m.under_review_count).toBe(0);
    expect(m.fully_effective_count).toBe(0);
    expect(m.not_effective_count).toBe(0);
    expect(m.child_satisfied_rate).toBe(0);
    expect(m.staff_aware_rate).toBe(0);
    expect(m.staff_trained_rate).toBe(0);
    expect(m.equality_impact_rate).toBe(0);
    expect(m.child_views_rate).toBe(0);
    expect(Object.keys(m.by_characteristic)).toHaveLength(0);
    expect(Object.keys(m.by_support_category)).toHaveLength(0);
    expect(Object.keys(m.by_support_status)).toHaveLength(0);
    expect(Object.keys(m.by_review_outcome)).toHaveLength(0);
  });

  // ── total_records ──────────────────────────────────────────────────

  it("total_records equals the number of records", () => {
    const records = [
      makeRecord({ id: "dr1", child_id: "c1" }),
      makeRecord({ id: "dr2", child_id: "c2" }),
      makeRecord({ id: "dr3", child_id: "c3" }),
    ];
    const m = computeDiversityMetrics(records, 5);
    expect(m.total_records).toBe(3);
  });

  it("total_records is 1 for single record", () => {
    const m = computeDiversityMetrics([makeRecord()], 1);
    expect(m.total_records).toBe(1);
  });

  // ── children_with_records ──────────────────────────────────────────

  it("children_with_records counts unique child IDs", () => {
    const records = [
      makeRecord({ id: "dr1", child_id: "c1", protected_characteristic: "race_ethnicity" }),
      makeRecord({ id: "dr2", child_id: "c1", protected_characteristic: "religion_belief" }),
      makeRecord({ id: "dr3", child_id: "c2", protected_characteristic: "disability" }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.children_with_records).toBe(2);
  });

  it("children_with_records is 1 when all records belong to same child", () => {
    const records = [
      makeRecord({ id: "dr1", child_id: "c1", protected_characteristic: "race_ethnicity" }),
      makeRecord({ id: "dr2", child_id: "c1", protected_characteristic: "language" }),
      makeRecord({ id: "dr3", child_id: "c1", protected_characteristic: "disability" }),
    ];
    const m = computeDiversityMetrics(records, 5);
    expect(m.children_with_records).toBe(1);
  });

  it("children_with_records equals total when each record is a different child", () => {
    const records = [
      makeRecord({ id: "dr1", child_id: "c1" }),
      makeRecord({ id: "dr2", child_id: "c2" }),
      makeRecord({ id: "dr3", child_id: "c3" }),
      makeRecord({ id: "dr4", child_id: "c4" }),
    ];
    const m = computeDiversityMetrics(records, 4);
    expect(m.children_with_records).toBe(4);
  });

  // ── children_coverage ──────────────────────────────────────────────

  it("children_coverage is 100 when all children have records", () => {
    const records = [
      makeRecord({ id: "dr1", child_id: "c1" }),
      makeRecord({ id: "dr2", child_id: "c2" }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.children_coverage).toBe(100);
  });

  it("children_coverage is 50 when half the children have records", () => {
    const records = [makeRecord({ id: "dr1", child_id: "c1" })];
    const m = computeDiversityMetrics(records, 2);
    expect(m.children_coverage).toBe(50);
  });

  it("children_coverage is 0 when totalChildren is 0", () => {
    const m = computeDiversityMetrics([], 0);
    expect(m.children_coverage).toBe(0);
  });

  it("children_coverage rounds to one decimal place", () => {
    const records = [makeRecord({ id: "dr1", child_id: "c1" })];
    const m = computeDiversityMetrics(records, 3);
    expect(m.children_coverage).toBe(33.3);
  });

  it("children_coverage is 0 with empty records and positive totalChildren", () => {
    const m = computeDiversityMetrics([], 5);
    expect(m.children_coverage).toBe(0);
  });

  it("children_coverage with 2 children in 3 totalChildren", () => {
    const records = [
      makeRecord({ id: "dr1", child_id: "c1" }),
      makeRecord({ id: "dr2", child_id: "c2" }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.children_coverage).toBe(66.7);
  });

  // ── support status counts ──────────────────────────────────────────

  it("in_place_count counts records with status in_place", () => {
    const records = [
      makeRecord({ id: "dr1", support_status: "in_place" }),
      makeRecord({ id: "dr2", support_status: "in_place" }),
      makeRecord({ id: "dr3", support_status: "not_met" }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.in_place_count).toBe(2);
  });

  it("partially_met_count counts records with status partially_met", () => {
    const records = [
      makeRecord({ id: "dr1", support_status: "partially_met" }),
      makeRecord({ id: "dr2", support_status: "partially_met" }),
      makeRecord({ id: "dr3", support_status: "in_place" }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.partially_met_count).toBe(2);
  });

  it("not_met_count counts records with status not_met", () => {
    const records = [
      makeRecord({ id: "dr1", support_status: "not_met" }),
      makeRecord({ id: "dr2", support_status: "not_met" }),
      makeRecord({ id: "dr3", support_status: "not_met" }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.not_met_count).toBe(3);
  });

  it("under_review_count counts records with status under_review", () => {
    const records = [
      makeRecord({ id: "dr1", support_status: "under_review" }),
      makeRecord({ id: "dr2", support_status: "under_review" }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.under_review_count).toBe(2);
  });

  it("not_applicable status is not counted in in_place, partially_met, not_met, or under_review", () => {
    const records = [
      makeRecord({ id: "dr1", support_status: "not_applicable" }),
    ];
    const m = computeDiversityMetrics(records, 1);
    expect(m.in_place_count).toBe(0);
    expect(m.partially_met_count).toBe(0);
    expect(m.not_met_count).toBe(0);
    expect(m.under_review_count).toBe(0);
  });

  it("all status counts are 0 for empty records", () => {
    const m = computeDiversityMetrics([], 0);
    expect(m.in_place_count).toBe(0);
    expect(m.partially_met_count).toBe(0);
    expect(m.not_met_count).toBe(0);
    expect(m.under_review_count).toBe(0);
  });

  // ── review outcome counts ──────────────────────────────────────────

  it("fully_effective_count counts fully_effective outcomes", () => {
    const records = [
      makeRecord({ id: "dr1", review_outcome: "fully_effective" }),
      makeRecord({ id: "dr2", review_outcome: "fully_effective" }),
      makeRecord({ id: "dr3", review_outcome: "not_effective" }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.fully_effective_count).toBe(2);
  });

  it("not_effective_count counts not_effective outcomes", () => {
    const records = [
      makeRecord({ id: "dr1", review_outcome: "not_effective" }),
      makeRecord({ id: "dr2", review_outcome: "not_effective" }),
      makeRecord({ id: "dr3", review_outcome: "fully_effective" }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.not_effective_count).toBe(2);
  });

  it("partially_effective is not counted in fully_effective or not_effective", () => {
    const records = [
      makeRecord({ id: "dr1", review_outcome: "partially_effective" }),
    ];
    const m = computeDiversityMetrics(records, 1);
    expect(m.fully_effective_count).toBe(0);
    expect(m.not_effective_count).toBe(0);
  });

  it("needs_adjustment is not counted in fully_effective or not_effective", () => {
    const records = [
      makeRecord({ id: "dr1", review_outcome: "needs_adjustment" }),
    ];
    const m = computeDiversityMetrics(records, 1);
    expect(m.fully_effective_count).toBe(0);
    expect(m.not_effective_count).toBe(0);
  });

  it("not_reviewed is not counted in fully_effective or not_effective", () => {
    const records = [
      makeRecord({ id: "dr1", review_outcome: "not_reviewed" }),
    ];
    const m = computeDiversityMetrics(records, 1);
    expect(m.fully_effective_count).toBe(0);
    expect(m.not_effective_count).toBe(0);
  });

  it("all outcome counts are 0 for empty records", () => {
    const m = computeDiversityMetrics([], 0);
    expect(m.fully_effective_count).toBe(0);
    expect(m.not_effective_count).toBe(0);
  });

  // ── child_satisfied_rate ───────────────────────────────────────────

  it("child_satisfied_rate is 100 when all children are satisfied", () => {
    const records = [
      makeRecord({ id: "dr1", child_satisfied: true }),
      makeRecord({ id: "dr2", child_satisfied: true }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.child_satisfied_rate).toBe(100);
  });

  it("child_satisfied_rate is 0 when no children are satisfied", () => {
    const records = [
      makeRecord({ id: "dr1", child_satisfied: false }),
      makeRecord({ id: "dr2", child_satisfied: false }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.child_satisfied_rate).toBe(0);
  });

  it("child_satisfied_rate is 50 when half are satisfied", () => {
    const records = [
      makeRecord({ id: "dr1", child_satisfied: true }),
      makeRecord({ id: "dr2", child_satisfied: false }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.child_satisfied_rate).toBe(50);
  });

  it("child_satisfied_rate excludes records with null child_satisfied", () => {
    const records = [
      makeRecord({ id: "dr1", child_satisfied: true }),
      makeRecord({ id: "dr2", child_satisfied: null }),
    ];
    const m = computeDiversityMetrics(records, 2);
    // Only 1 record has non-null child_satisfied; that 1 is true => 100%
    expect(m.child_satisfied_rate).toBe(100);
  });

  it("child_satisfied_rate is 0 when all child_satisfied are null", () => {
    const records = [
      makeRecord({ id: "dr1", child_satisfied: null }),
      makeRecord({ id: "dr2", child_satisfied: null }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.child_satisfied_rate).toBe(0);
  });

  it("child_satisfied_rate rounds to one decimal place", () => {
    const records = [
      makeRecord({ id: "dr1", child_satisfied: true }),
      makeRecord({ id: "dr2", child_satisfied: false }),
      makeRecord({ id: "dr3", child_satisfied: false }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.child_satisfied_rate).toBe(33.3);
  });

  it("child_satisfied_rate is 0 for empty records", () => {
    const m = computeDiversityMetrics([], 0);
    expect(m.child_satisfied_rate).toBe(0);
  });

  // ── staff_aware_rate ───────────────────────────────────────────────

  it("staff_aware_rate is 100 when all records have staff_aware true", () => {
    const records = [
      makeRecord({ id: "dr1", staff_aware: true }),
      makeRecord({ id: "dr2", staff_aware: true }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.staff_aware_rate).toBe(100);
  });

  it("staff_aware_rate is 0 when no records have staff_aware", () => {
    const records = [
      makeRecord({ id: "dr1", staff_aware: false }),
      makeRecord({ id: "dr2", staff_aware: false }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.staff_aware_rate).toBe(0);
  });

  it("staff_aware_rate is 50 when half have staff_aware", () => {
    const records = [
      makeRecord({ id: "dr1", staff_aware: true }),
      makeRecord({ id: "dr2", staff_aware: false }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.staff_aware_rate).toBe(50);
  });

  it("staff_aware_rate rounds to one decimal place", () => {
    const records = [
      makeRecord({ id: "dr1", staff_aware: true }),
      makeRecord({ id: "dr2", staff_aware: false }),
      makeRecord({ id: "dr3", staff_aware: false }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.staff_aware_rate).toBe(33.3);
  });

  it("staff_aware_rate is 0 for empty records", () => {
    const m = computeDiversityMetrics([], 0);
    expect(m.staff_aware_rate).toBe(0);
  });

  // ── staff_trained_rate ─────────────────────────────────────────────

  it("staff_trained_rate is 100 when all records have staff trained", () => {
    const records = [
      makeRecord({ id: "dr1", staff_trained: true }),
      makeRecord({ id: "dr2", staff_trained: true }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.staff_trained_rate).toBe(100);
  });

  it("staff_trained_rate is 0 when no records have staff trained", () => {
    const records = [
      makeRecord({ id: "dr1", staff_trained: false }),
      makeRecord({ id: "dr2", staff_trained: false }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.staff_trained_rate).toBe(0);
  });

  it("staff_trained_rate is 50 when half have staff trained", () => {
    const records = [
      makeRecord({ id: "dr1", staff_trained: true }),
      makeRecord({ id: "dr2", staff_trained: false }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.staff_trained_rate).toBe(50);
  });

  it("staff_trained_rate rounds to one decimal place", () => {
    const records = [
      makeRecord({ id: "dr1", staff_trained: true }),
      makeRecord({ id: "dr2", staff_trained: false }),
      makeRecord({ id: "dr3", staff_trained: false }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.staff_trained_rate).toBe(33.3);
  });

  it("staff_trained_rate is 0 for empty records", () => {
    const m = computeDiversityMetrics([], 0);
    expect(m.staff_trained_rate).toBe(0);
  });

  // ── equality_impact_rate ───────────────────────────────────────────

  it("equality_impact_rate is 100 when all records have EIA completed", () => {
    const records = [
      makeRecord({ id: "dr1", equality_impact_assessed: true }),
      makeRecord({ id: "dr2", equality_impact_assessed: true }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.equality_impact_rate).toBe(100);
  });

  it("equality_impact_rate is 0 when no records have EIA completed", () => {
    const records = [
      makeRecord({ id: "dr1", equality_impact_assessed: false }),
      makeRecord({ id: "dr2", equality_impact_assessed: false }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.equality_impact_rate).toBe(0);
  });

  it("equality_impact_rate is 50 when half have EIA completed", () => {
    const records = [
      makeRecord({ id: "dr1", equality_impact_assessed: true }),
      makeRecord({ id: "dr2", equality_impact_assessed: false }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.equality_impact_rate).toBe(50);
  });

  it("equality_impact_rate rounds to one decimal place", () => {
    const records = [
      makeRecord({ id: "dr1", equality_impact_assessed: true }),
      makeRecord({ id: "dr2", equality_impact_assessed: true }),
      makeRecord({ id: "dr3", equality_impact_assessed: false }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.equality_impact_rate).toBe(66.7);
  });

  it("equality_impact_rate is 0 for empty records", () => {
    const m = computeDiversityMetrics([], 0);
    expect(m.equality_impact_rate).toBe(0);
  });

  // ── child_views_rate ───────────────────────────────────────────────

  it("child_views_rate is 100 when all records have child views", () => {
    const records = [
      makeRecord({ id: "dr1", child_views: "I like being included" }),
      makeRecord({ id: "dr2", child_views: "I feel respected" }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.child_views_rate).toBe(100);
  });

  it("child_views_rate is 0 when no records have child views", () => {
    const records = [
      makeRecord({ id: "dr1", child_views: null }),
      makeRecord({ id: "dr2", child_views: null }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.child_views_rate).toBe(0);
  });

  it("child_views_rate is 50 when half have child views", () => {
    const records = [
      makeRecord({ id: "dr1", child_views: "Views here" }),
      makeRecord({ id: "dr2", child_views: null }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.child_views_rate).toBe(50);
  });

  it("child_views_rate rounds to one decimal place", () => {
    const records = [
      makeRecord({ id: "dr1", child_views: "Yes" }),
      makeRecord({ id: "dr2", child_views: "Yes" }),
      makeRecord({ id: "dr3", child_views: null }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.child_views_rate).toBe(66.7);
  });

  it("child_views_rate is 0 for empty records", () => {
    const m = computeDiversityMetrics([], 0);
    expect(m.child_views_rate).toBe(0);
  });

  it("child_views_rate counts non-null values including empty string", () => {
    const records = [
      makeRecord({ id: "dr1", child_views: "" }),
      makeRecord({ id: "dr2", child_views: null }),
    ];
    const m = computeDiversityMetrics(records, 2);
    // empty string is not null, so it counts
    expect(m.child_views_rate).toBe(50);
  });

  // ── by_characteristic ──────────────────────────────────────────────

  it("by_characteristic groups counts by protected characteristic", () => {
    const records = [
      makeRecord({ id: "dr1", protected_characteristic: "race_ethnicity" }),
      makeRecord({ id: "dr2", protected_characteristic: "race_ethnicity" }),
      makeRecord({ id: "dr3", protected_characteristic: "disability" }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.by_characteristic["race_ethnicity"]).toBe(2);
    expect(m.by_characteristic["disability"]).toBe(1);
  });

  it("by_characteristic is empty for no records", () => {
    const m = computeDiversityMetrics([], 0);
    expect(Object.keys(m.by_characteristic)).toHaveLength(0);
  });

  it("by_characteristic has one entry per unique characteristic", () => {
    const records = [
      makeRecord({ id: "dr1", protected_characteristic: "race_ethnicity" }),
      makeRecord({ id: "dr2", protected_characteristic: "disability" }),
      makeRecord({ id: "dr3", protected_characteristic: "language" }),
      makeRecord({ id: "dr4", protected_characteristic: "disability" }),
    ];
    const m = computeDiversityMetrics(records, 4);
    expect(Object.keys(m.by_characteristic)).toHaveLength(3);
  });

  it("by_characteristic values sum to total_records", () => {
    const records = [
      makeRecord({ id: "dr1", protected_characteristic: "race_ethnicity" }),
      makeRecord({ id: "dr2", protected_characteristic: "religion_belief" }),
      makeRecord({ id: "dr3", protected_characteristic: "race_ethnicity" }),
      makeRecord({ id: "dr4", protected_characteristic: "language" }),
    ];
    const m = computeDiversityMetrics(records, 4);
    const sum = Object.values(m.by_characteristic).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_records);
  });

  it("by_characteristic has 9 entries when all characteristics represented", () => {
    const chars: ProtectedCharacteristic[] = [
      "race_ethnicity", "religion_belief", "disability", "gender_identity",
      "sexual_orientation", "age", "language", "cultural_heritage", "other",
    ];
    const records = chars.map((c, i) =>
      makeRecord({ id: `dr${i}`, protected_characteristic: c }),
    );
    const m = computeDiversityMetrics(records, 9);
    expect(Object.keys(m.by_characteristic)).toHaveLength(9);
  });

  // ── by_support_category ────────────────────────────────────────────

  it("by_support_category groups counts by category", () => {
    const records = [
      makeRecord({ id: "dr1", support_category: "dietary_requirement" }),
      makeRecord({ id: "dr2", support_category: "dietary_requirement" }),
      makeRecord({ id: "dr3", support_category: "language_support" }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.by_support_category["dietary_requirement"]).toBe(2);
    expect(m.by_support_category["language_support"]).toBe(1);
  });

  it("by_support_category is empty for no records", () => {
    const m = computeDiversityMetrics([], 0);
    expect(Object.keys(m.by_support_category)).toHaveLength(0);
  });

  it("by_support_category values sum to total_records", () => {
    const records = [
      makeRecord({ id: "dr1", support_category: "dietary_requirement" }),
      makeRecord({ id: "dr2", support_category: "religious_observance" }),
      makeRecord({ id: "dr3", support_category: "cultural_activity" }),
    ];
    const m = computeDiversityMetrics(records, 3);
    const sum = Object.values(m.by_support_category).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_records);
  });

  it("by_support_category has 11 entries when all categories represented", () => {
    const cats: SupportCategory[] = [
      "dietary_requirement", "religious_observance", "language_support",
      "accessibility_adaptation", "cultural_activity", "identity_support",
      "community_link", "specialist_provision", "staff_training",
      "policy_adaptation", "other",
    ];
    const records = cats.map((c, i) =>
      makeRecord({ id: `dr${i}`, support_category: c }),
    );
    const m = computeDiversityMetrics(records, 11);
    expect(Object.keys(m.by_support_category)).toHaveLength(11);
  });

  // ── by_support_status ──────────────────────────────────────────────

  it("by_support_status groups counts by status", () => {
    const records = [
      makeRecord({ id: "dr1", support_status: "in_place" }),
      makeRecord({ id: "dr2", support_status: "in_place" }),
      makeRecord({ id: "dr3", support_status: "not_met" }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.by_support_status["in_place"]).toBe(2);
    expect(m.by_support_status["not_met"]).toBe(1);
  });

  it("by_support_status is empty for no records", () => {
    const m = computeDiversityMetrics([], 0);
    expect(Object.keys(m.by_support_status)).toHaveLength(0);
  });

  it("by_support_status values sum to total_records", () => {
    const records = [
      makeRecord({ id: "dr1", support_status: "in_place" }),
      makeRecord({ id: "dr2", support_status: "partially_met" }),
      makeRecord({ id: "dr3", support_status: "not_met" }),
      makeRecord({ id: "dr4", support_status: "under_review" }),
      makeRecord({ id: "dr5", support_status: "not_applicable" }),
    ];
    const m = computeDiversityMetrics(records, 5);
    const sum = Object.values(m.by_support_status).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_records);
  });

  it("by_support_status has 5 entries when all statuses represented", () => {
    const statuses: SupportStatus[] = [
      "in_place", "partially_met", "not_met", "under_review", "not_applicable",
    ];
    const records = statuses.map((s, i) =>
      makeRecord({ id: `dr${i}`, support_status: s }),
    );
    const m = computeDiversityMetrics(records, 5);
    expect(Object.keys(m.by_support_status)).toHaveLength(5);
  });

  // ── by_review_outcome ──────────────────────────────────────────────

  it("by_review_outcome groups counts by outcome", () => {
    const records = [
      makeRecord({ id: "dr1", review_outcome: "fully_effective" }),
      makeRecord({ id: "dr2", review_outcome: "fully_effective" }),
      makeRecord({ id: "dr3", review_outcome: "not_effective" }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.by_review_outcome["fully_effective"]).toBe(2);
    expect(m.by_review_outcome["not_effective"]).toBe(1);
  });

  it("by_review_outcome is empty for no records", () => {
    const m = computeDiversityMetrics([], 0);
    expect(Object.keys(m.by_review_outcome)).toHaveLength(0);
  });

  it("by_review_outcome values sum to total_records", () => {
    const records = [
      makeRecord({ id: "dr1", review_outcome: "fully_effective" }),
      makeRecord({ id: "dr2", review_outcome: "partially_effective" }),
      makeRecord({ id: "dr3", review_outcome: "not_effective" }),
      makeRecord({ id: "dr4", review_outcome: "needs_adjustment" }),
      makeRecord({ id: "dr5", review_outcome: "not_reviewed" }),
    ];
    const m = computeDiversityMetrics(records, 5);
    const sum = Object.values(m.by_review_outcome).reduce((a, b) => a + b, 0);
    expect(sum).toBe(m.total_records);
  });

  it("by_review_outcome has 5 entries when all outcomes represented", () => {
    const outcomes: ReviewOutcome[] = [
      "fully_effective", "partially_effective", "not_effective", "needs_adjustment", "not_reviewed",
    ];
    const records = outcomes.map((o, i) =>
      makeRecord({ id: `dr${i}`, review_outcome: o }),
    );
    const m = computeDiversityMetrics(records, 5);
    expect(Object.keys(m.by_review_outcome)).toHaveLength(5);
  });

  // ── single record scenario ─────────────────────────────────────────

  it("single record with all positive flags", () => {
    const records = [
      makeRecord({
        id: "dr1",
        support_status: "in_place",
        review_outcome: "fully_effective",
        child_satisfied: true,
        staff_aware: true,
        staff_trained: true,
        equality_impact_assessed: true,
        child_views: "I feel included",
      }),
    ];
    const m = computeDiversityMetrics(records, 1);
    expect(m.in_place_count).toBe(1);
    expect(m.fully_effective_count).toBe(1);
    expect(m.child_satisfied_rate).toBe(100);
    expect(m.staff_aware_rate).toBe(100);
    expect(m.staff_trained_rate).toBe(100);
    expect(m.equality_impact_rate).toBe(100);
    expect(m.child_views_rate).toBe(100);
  });

  // ── mixed multi-child scenario ─────────────────────────────────────

  it("correctly computes metrics for multi-child mixed scenario", () => {
    const records = [
      makeRecord({
        id: "dr1", child_id: "c1", child_name: "Alice",
        protected_characteristic: "race_ethnicity",
        support_category: "cultural_activity",
        support_status: "in_place",
        review_outcome: "fully_effective",
        child_satisfied: true,
        staff_aware: true, staff_trained: true,
        equality_impact_assessed: true,
        child_views: "Happy",
      }),
      makeRecord({
        id: "dr2", child_id: "c1", child_name: "Alice",
        protected_characteristic: "religion_belief",
        support_category: "religious_observance",
        support_status: "partially_met",
        review_outcome: "partially_effective",
        child_satisfied: false,
        staff_aware: true, staff_trained: false,
        equality_impact_assessed: false,
        child_views: null,
      }),
      makeRecord({
        id: "dr3", child_id: "c2", child_name: "Bob",
        protected_characteristic: "disability",
        support_category: "accessibility_adaptation",
        support_status: "not_met",
        review_outcome: "not_effective",
        child_satisfied: null,
        staff_aware: false, staff_trained: false,
        equality_impact_assessed: false,
        child_views: null,
      }),
      makeRecord({
        id: "dr4", child_id: "c3", child_name: "Carol",
        protected_characteristic: "language",
        support_category: "language_support",
        support_status: "under_review",
        review_outcome: "needs_adjustment",
        child_satisfied: true,
        staff_aware: true, staff_trained: true,
        equality_impact_assessed: true,
        child_views: "My views",
      }),
    ];
    const m = computeDiversityMetrics(records, 5);
    expect(m.total_records).toBe(4);
    expect(m.children_with_records).toBe(3);
    expect(m.children_coverage).toBe(60);
    expect(m.in_place_count).toBe(1);
    expect(m.partially_met_count).toBe(1);
    expect(m.not_met_count).toBe(1);
    expect(m.under_review_count).toBe(1);
    expect(m.fully_effective_count).toBe(1);
    expect(m.not_effective_count).toBe(1);
    // child_satisfied: true, false, null, true => 2 non-null, 2 satisfied => rate = 2/3 = 66.7
    expect(m.child_satisfied_rate).toBe(66.7);
    expect(m.staff_aware_rate).toBe(75);
    expect(m.staff_trained_rate).toBe(50);
    expect(m.equality_impact_rate).toBe(50);
    expect(m.child_views_rate).toBe(50);
    expect(m.by_characteristic["race_ethnicity"]).toBe(1);
    expect(m.by_characteristic["religion_belief"]).toBe(1);
    expect(m.by_characteristic["disability"]).toBe(1);
    expect(m.by_characteristic["language"]).toBe(1);
    expect(m.by_support_category["cultural_activity"]).toBe(1);
    expect(m.by_support_category["religious_observance"]).toBe(1);
    expect(m.by_support_category["accessibility_adaptation"]).toBe(1);
    expect(m.by_support_category["language_support"]).toBe(1);
  });

  // ── large dataset ──────────────────────────────────────────────────

  it("handles large records array efficiently", () => {
    const records: DiversityRecord[] = [];
    const chars: ProtectedCharacteristic[] = [
      "race_ethnicity", "religion_belief", "disability", "gender_identity",
      "sexual_orientation", "age", "language", "cultural_heritage", "other",
    ];
    const cats: SupportCategory[] = [
      "dietary_requirement", "religious_observance", "language_support",
      "accessibility_adaptation", "cultural_activity", "identity_support",
      "community_link", "specialist_provision", "staff_training",
      "policy_adaptation", "other",
    ];
    const statuses: SupportStatus[] = [
      "in_place", "partially_met", "not_met", "under_review", "not_applicable",
    ];
    for (let i = 0; i < 100; i++) {
      records.push(
        makeRecord({
          id: `dr-${i}`,
          child_id: `c-${i % 20}`,
          child_name: `Child ${i % 20}`,
          protected_characteristic: chars[i % 9],
          support_category: cats[i % 11],
          support_status: statuses[i % 5],
          staff_aware: i % 3 === 0,
          staff_trained: i % 4 === 0,
          equality_impact_assessed: i % 2 === 0,
          child_views: i % 2 === 0 ? "views" : null,
          child_satisfied: i % 3 === 0 ? true : i % 3 === 1 ? false : null,
        }),
      );
    }
    const m = computeDiversityMetrics(records, 25);
    expect(m.total_records).toBe(100);
    expect(m.children_with_records).toBe(20);
    expect(m.children_coverage).toBe(80);
  });

  it("totalChildren parameter does not affect per-record metrics", () => {
    const records = [makeRecord({ id: "dr1", child_id: "c1" })];
    const m1 = computeDiversityMetrics(records, 1);
    const m2 = computeDiversityMetrics(records, 100);
    expect(m1.total_records).toBe(m2.total_records);
    expect(m1.in_place_count).toBe(m2.in_place_count);
    expect(m1.staff_aware_rate).toBe(m2.staff_aware_rate);
    expect(m1.staff_trained_rate).toBe(m2.staff_trained_rate);
    expect(m1.equality_impact_rate).toBe(m2.equality_impact_rate);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyDiversityAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyDiversityAlerts", () => {
  // ── no alerts when clean ───────────────────────────────────────────

  it("returns empty array for empty records and zero children", () => {
    const alerts = identifyDiversityAlerts([], 0, now);
    expect(alerts).toEqual([]);
  });

  it("returns empty array when all data is clean", () => {
    const records = [
      makeRecord({
        id: "dr1", child_id: "c1",
        support_status: "in_place",
        review_outcome: "fully_effective",
        staff_aware: true,
        equality_impact_assessed: true,
        next_review_date: daysFromNow(30),
      }),
      makeRecord({
        id: "dr2", child_id: "c2",
        support_status: "in_place",
        review_outcome: "fully_effective",
        staff_aware: true,
        equality_impact_assessed: true,
        next_review_date: daysFromNow(60),
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 2, now);
    expect(alerts).toEqual([]);
  });

  // ── need_not_met alert (support_status === "not_met") ──────────────

  it("generates need_not_met alert when support_status is not_met", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Alice", support_status: "not_met",
        protected_characteristic: "race_ethnicity",
        support_description: "Cultural celebrations",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notMet = alerts.find((a) => a.type === "need_not_met");
    expect(notMet).toBeTruthy();
    expect(notMet!.severity).toBe("critical");
    expect(notMet!.id).toBe("dr1");
  });

  it("need_not_met alert includes child name in message", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Bob Jones", support_status: "not_met",
        protected_characteristic: "disability",
        support_description: "Wheelchair access",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notMet = alerts.find((a) => a.type === "need_not_met");
    expect(notMet!.message).toContain("Bob Jones");
  });

  it("need_not_met alert includes characteristic in message", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Alice", support_status: "not_met",
        protected_characteristic: "religion_belief",
        support_description: "Prayer room",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notMet = alerts.find((a) => a.type === "need_not_met");
    expect(notMet!.message).toContain("religion belief");
  });

  it("need_not_met alert includes support description in message", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Alice", support_status: "not_met",
        protected_characteristic: "race_ethnicity",
        support_description: "Halal food options",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notMet = alerts.find((a) => a.type === "need_not_met");
    expect(notMet!.message).toContain("Halal food options");
  });

  it("no need_not_met alert when support_status is in_place", () => {
    const records = [
      makeRecord({ id: "dr1", support_status: "in_place" }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notMet = alerts.find((a) => a.type === "need_not_met");
    expect(notMet).toBeUndefined();
  });

  it("no need_not_met alert when support_status is partially_met", () => {
    const records = [
      makeRecord({ id: "dr1", support_status: "partially_met" }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notMet = alerts.find((a) => a.type === "need_not_met");
    expect(notMet).toBeUndefined();
  });

  it("no need_not_met alert when support_status is under_review", () => {
    const records = [
      makeRecord({ id: "dr1", support_status: "under_review" }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notMet = alerts.find((a) => a.type === "need_not_met");
    expect(notMet).toBeUndefined();
  });

  it("no need_not_met alert when support_status is not_applicable", () => {
    const records = [
      makeRecord({ id: "dr1", support_status: "not_applicable" }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notMet = alerts.find((a) => a.type === "need_not_met");
    expect(notMet).toBeUndefined();
  });

  it("generates multiple need_not_met alerts for different records", () => {
    const records = [
      makeRecord({ id: "dr1", child_name: "Alice", support_status: "not_met", support_description: "Need A" }),
      makeRecord({ id: "dr2", child_name: "Bob", support_status: "not_met", support_description: "Need B" }),
      makeRecord({ id: "dr3", child_name: "Carol", support_status: "in_place", support_description: "Need C" }),
    ];
    const alerts = identifyDiversityAlerts(records, 3, now);
    const notMet = alerts.filter((a) => a.type === "need_not_met");
    expect(notMet).toHaveLength(2);
  });

  // ── staff_not_aware alert ──────────────────────────────────────────

  it("generates staff_not_aware alert when staff not aware and status is not not_applicable", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Alice",
        protected_characteristic: "race_ethnicity",
        staff_aware: false, support_status: "in_place",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notAware = alerts.find((a) => a.type === "staff_not_aware");
    expect(notAware).toBeTruthy();
    expect(notAware!.severity).toBe("high");
    expect(notAware!.id).toBe("dr1");
  });

  it("staff_not_aware alert includes child name in message", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Carol Davies",
        protected_characteristic: "disability",
        staff_aware: false, support_status: "in_place",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notAware = alerts.find((a) => a.type === "staff_not_aware");
    expect(notAware!.message).toContain("Carol Davies");
  });

  it("staff_not_aware alert includes characteristic in message", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Alice",
        protected_characteristic: "gender_identity",
        staff_aware: false, support_status: "in_place",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notAware = alerts.find((a) => a.type === "staff_not_aware");
    expect(notAware!.message).toContain("gender identity");
  });

  it("no staff_not_aware alert when staff is aware", () => {
    const records = [
      makeRecord({ id: "dr1", staff_aware: true, support_status: "in_place" }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notAware = alerts.find((a) => a.type === "staff_not_aware");
    expect(notAware).toBeUndefined();
  });

  it("no staff_not_aware alert when support_status is not_applicable", () => {
    const records = [
      makeRecord({ id: "dr1", staff_aware: false, support_status: "not_applicable" }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notAware = alerts.find((a) => a.type === "staff_not_aware");
    expect(notAware).toBeUndefined();
  });

  it("staff_not_aware fires for partially_met status", () => {
    const records = [
      makeRecord({ id: "dr1", staff_aware: false, support_status: "partially_met" }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notAware = alerts.find((a) => a.type === "staff_not_aware");
    expect(notAware).toBeTruthy();
  });

  it("staff_not_aware fires for not_met status", () => {
    const records = [
      makeRecord({ id: "dr1", staff_aware: false, support_status: "not_met" }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notAware = alerts.find((a) => a.type === "staff_not_aware");
    expect(notAware).toBeTruthy();
  });

  it("staff_not_aware fires for under_review status", () => {
    const records = [
      makeRecord({ id: "dr1", staff_aware: false, support_status: "under_review" }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notAware = alerts.find((a) => a.type === "staff_not_aware");
    expect(notAware).toBeTruthy();
  });

  it("generates multiple staff_not_aware alerts for different records", () => {
    const records = [
      makeRecord({ id: "dr1", child_name: "Alice", staff_aware: false, support_status: "in_place" }),
      makeRecord({ id: "dr2", child_name: "Bob", staff_aware: false, support_status: "partially_met" }),
    ];
    const alerts = identifyDiversityAlerts(records, 2, now);
    const notAware = alerts.filter((a) => a.type === "staff_not_aware");
    expect(notAware).toHaveLength(2);
  });

  // ── support_not_effective alert ────────────────────────────────────

  it("generates support_not_effective alert when review_outcome is not_effective", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Alice",
        protected_characteristic: "race_ethnicity",
        review_outcome: "not_effective",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notEff = alerts.find((a) => a.type === "support_not_effective");
    expect(notEff).toBeTruthy();
    expect(notEff!.severity).toBe("high");
    expect(notEff!.id).toBe("dr1");
  });

  it("support_not_effective alert includes child name in message", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Bob Jones",
        protected_characteristic: "disability",
        review_outcome: "not_effective",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notEff = alerts.find((a) => a.type === "support_not_effective");
    expect(notEff!.message).toContain("Bob Jones");
  });

  it("support_not_effective alert includes characteristic in message", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Alice",
        protected_characteristic: "cultural_heritage",
        review_outcome: "not_effective",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notEff = alerts.find((a) => a.type === "support_not_effective");
    expect(notEff!.message).toContain("cultural heritage");
  });

  it("no support_not_effective alert when outcome is fully_effective", () => {
    const records = [
      makeRecord({ id: "dr1", review_outcome: "fully_effective" }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notEff = alerts.find((a) => a.type === "support_not_effective");
    expect(notEff).toBeUndefined();
  });

  it("no support_not_effective alert when outcome is partially_effective", () => {
    const records = [
      makeRecord({ id: "dr1", review_outcome: "partially_effective" }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notEff = alerts.find((a) => a.type === "support_not_effective");
    expect(notEff).toBeUndefined();
  });

  it("no support_not_effective alert when outcome is needs_adjustment", () => {
    const records = [
      makeRecord({ id: "dr1", review_outcome: "needs_adjustment" }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notEff = alerts.find((a) => a.type === "support_not_effective");
    expect(notEff).toBeUndefined();
  });

  it("no support_not_effective alert when outcome is not_reviewed", () => {
    const records = [
      makeRecord({ id: "dr1", review_outcome: "not_reviewed" }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notEff = alerts.find((a) => a.type === "support_not_effective");
    expect(notEff).toBeUndefined();
  });

  it("generates multiple support_not_effective alerts for different records", () => {
    const records = [
      makeRecord({ id: "dr1", child_name: "Alice", review_outcome: "not_effective" }),
      makeRecord({ id: "dr2", child_name: "Bob", review_outcome: "not_effective" }),
      makeRecord({ id: "dr3", child_name: "Carol", review_outcome: "fully_effective" }),
    ];
    const alerts = identifyDiversityAlerts(records, 3, now);
    const notEff = alerts.filter((a) => a.type === "support_not_effective");
    expect(notEff).toHaveLength(2);
  });

  // ── review_overdue alert ───────────────────────────────────────────

  it("generates review_overdue alert when next_review_date is in the past", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Alice",
        protected_characteristic: "race_ethnicity",
        next_review_date: daysAgo(10),
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue).toBeTruthy();
    expect(overdue!.severity).toBe("medium");
    expect(overdue!.id).toBe("dr1");
  });

  it("review_overdue alert includes child name in message", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Bob Jones",
        protected_characteristic: "disability",
        next_review_date: daysAgo(5),
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue!.message).toContain("Bob Jones");
  });

  it("review_overdue alert includes characteristic in message", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Alice",
        protected_characteristic: "sexual_orientation",
        next_review_date: daysAgo(5),
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue!.message).toContain("sexual orientation");
  });

  it("review_overdue alert includes the overdue date in message", () => {
    const pastDate = daysAgo(15);
    const records = [
      makeRecord({ id: "dr1", next_review_date: pastDate }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue!.message).toContain(pastDate);
  });

  it("no review_overdue alert when next_review_date is in the future", () => {
    const records = [
      makeRecord({ id: "dr1", next_review_date: daysFromNow(30) }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue).toBeUndefined();
  });

  it("no review_overdue alert when next_review_date is null", () => {
    const records = [
      makeRecord({ id: "dr1", next_review_date: null }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue).toBeUndefined();
  });

  it("generates multiple review_overdue alerts for different records", () => {
    const records = [
      makeRecord({ id: "dr1", child_name: "Alice", next_review_date: daysAgo(5) }),
      makeRecord({ id: "dr2", child_name: "Bob", next_review_date: daysAgo(20) }),
      makeRecord({ id: "dr3", child_name: "Carol", next_review_date: daysFromNow(10) }),
    ];
    const alerts = identifyDiversityAlerts(records, 3, now);
    const overdue = alerts.filter((a) => a.type === "review_overdue");
    expect(overdue).toHaveLength(2);
  });

  it("review_overdue uses the now parameter for comparison", () => {
    const futureNow = new Date(daysFromNow(60));
    const records = [
      makeRecord({ id: "dr1", next_review_date: daysFromNow(30) }),
    ];
    // With the default now, this should NOT be overdue
    const alertsDefault = identifyDiversityAlerts(records, 1, now);
    expect(alertsDefault.find((a) => a.type === "review_overdue")).toBeUndefined();
    // With a future now, this SHOULD be overdue
    const alertsFuture = identifyDiversityAlerts(records, 1, futureNow);
    expect(alertsFuture.find((a) => a.type === "review_overdue")).toBeTruthy();
  });

  // ── no_eia alert ───────────────────────────────────────────────────

  it("generates no_eia alert when equality_impact_assessed is false and status is not not_applicable", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Alice",
        protected_characteristic: "race_ethnicity",
        equality_impact_assessed: false,
        support_status: "in_place",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const noEia = alerts.find((a) => a.type === "no_eia");
    expect(noEia).toBeTruthy();
    expect(noEia!.severity).toBe("medium");
    expect(noEia!.id).toBe("dr1");
  });

  it("no_eia alert includes child name in message", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Carol Davies",
        protected_characteristic: "disability",
        equality_impact_assessed: false,
        support_status: "in_place",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const noEia = alerts.find((a) => a.type === "no_eia");
    expect(noEia!.message).toContain("Carol Davies");
  });

  it("no_eia alert includes characteristic in message", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Alice",
        protected_characteristic: "language",
        equality_impact_assessed: false,
        support_status: "in_place",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const noEia = alerts.find((a) => a.type === "no_eia");
    expect(noEia!.message).toContain("language");
  });

  it("no no_eia alert when equality_impact_assessed is true", () => {
    const records = [
      makeRecord({ id: "dr1", equality_impact_assessed: true, support_status: "in_place" }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const noEia = alerts.find((a) => a.type === "no_eia");
    expect(noEia).toBeUndefined();
  });

  it("no no_eia alert when support_status is not_applicable", () => {
    const records = [
      makeRecord({ id: "dr1", equality_impact_assessed: false, support_status: "not_applicable" }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const noEia = alerts.find((a) => a.type === "no_eia");
    expect(noEia).toBeUndefined();
  });

  it("no_eia fires for partially_met status", () => {
    const records = [
      makeRecord({ id: "dr1", equality_impact_assessed: false, support_status: "partially_met" }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const noEia = alerts.find((a) => a.type === "no_eia");
    expect(noEia).toBeTruthy();
  });

  it("no_eia fires for not_met status", () => {
    const records = [
      makeRecord({ id: "dr1", equality_impact_assessed: false, support_status: "not_met" }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const noEia = alerts.find((a) => a.type === "no_eia");
    expect(noEia).toBeTruthy();
  });

  it("no_eia fires for under_review status", () => {
    const records = [
      makeRecord({ id: "dr1", equality_impact_assessed: false, support_status: "under_review" }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const noEia = alerts.find((a) => a.type === "no_eia");
    expect(noEia).toBeTruthy();
  });

  it("generates multiple no_eia alerts for different records", () => {
    const records = [
      makeRecord({ id: "dr1", child_name: "Alice", equality_impact_assessed: false, support_status: "in_place" }),
      makeRecord({ id: "dr2", child_name: "Bob", equality_impact_assessed: false, support_status: "partially_met" }),
      makeRecord({ id: "dr3", child_name: "Carol", equality_impact_assessed: true, support_status: "in_place" }),
    ];
    const alerts = identifyDiversityAlerts(records, 3, now);
    const noEia = alerts.filter((a) => a.type === "no_eia");
    expect(noEia).toHaveLength(2);
  });

  // ── combined alerts ────────────────────────────────────────────────

  it("generates all five alert types together when conditions are met", () => {
    const records = [
      makeRecord({
        id: "dr1", child_id: "c1", child_name: "Alice",
        protected_characteristic: "race_ethnicity",
        support_status: "not_met",
        review_outcome: "not_effective",
        staff_aware: false,
        equality_impact_assessed: false,
        next_review_date: daysAgo(10),
        support_description: "Cultural support",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("need_not_met");
    expect(types).toContain("staff_not_aware");
    expect(types).toContain("support_not_effective");
    expect(types).toContain("review_overdue");
    expect(types).toContain("no_eia");
  });

  it("alert severity values are correct types", () => {
    const records = [
      makeRecord({
        id: "dr1", child_id: "c1", child_name: "Alice",
        support_status: "not_met",
        review_outcome: "not_effective",
        staff_aware: false,
        equality_impact_assessed: false,
        next_review_date: daysAgo(5),
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    for (const alert of alerts) {
      expect(["critical", "high", "medium"]).toContain(alert.severity);
    }
  });

  it("each alert has a non-empty message", () => {
    const records = [
      makeRecord({
        id: "dr1", child_id: "c1", child_name: "Alice",
        support_status: "not_met",
        review_outcome: "not_effective",
        staff_aware: false,
        equality_impact_assessed: false,
        next_review_date: daysAgo(5),
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    for (const alert of alerts) {
      expect(alert.message.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty id", () => {
    const records = [
      makeRecord({
        id: "dr1",
        support_status: "not_met",
        staff_aware: false,
        equality_impact_assessed: false,
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    for (const alert of alerts) {
      expect(alert.id.length).toBeGreaterThan(0);
    }
  });

  it("each alert has a non-empty type", () => {
    const records = [
      makeRecord({
        id: "dr1",
        support_status: "not_met",
        staff_aware: false,
        equality_impact_assessed: false,
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    for (const alert of alerts) {
      expect(alert.type.length).toBeGreaterThan(0);
    }
  });

  it("need_not_met severity is always critical", () => {
    const records = [
      makeRecord({ id: "dr1", support_status: "not_met" }),
      makeRecord({ id: "dr2", support_status: "not_met" }),
    ];
    const alerts = identifyDiversityAlerts(records, 2, now);
    const notMet = alerts.filter((a) => a.type === "need_not_met");
    for (const a of notMet) {
      expect(a.severity).toBe("critical");
    }
  });

  it("staff_not_aware severity is always high", () => {
    const records = [
      makeRecord({ id: "dr1", staff_aware: false, support_status: "in_place" }),
      makeRecord({ id: "dr2", staff_aware: false, support_status: "partially_met" }),
    ];
    const alerts = identifyDiversityAlerts(records, 2, now);
    const notAware = alerts.filter((a) => a.type === "staff_not_aware");
    for (const a of notAware) {
      expect(a.severity).toBe("high");
    }
  });

  it("support_not_effective severity is always high", () => {
    const records = [
      makeRecord({ id: "dr1", review_outcome: "not_effective" }),
      makeRecord({ id: "dr2", review_outcome: "not_effective" }),
    ];
    const alerts = identifyDiversityAlerts(records, 2, now);
    const notEff = alerts.filter((a) => a.type === "support_not_effective");
    for (const a of notEff) {
      expect(a.severity).toBe("high");
    }
  });

  it("review_overdue severity is always medium", () => {
    const records = [
      makeRecord({ id: "dr1", next_review_date: daysAgo(5) }),
      makeRecord({ id: "dr2", next_review_date: daysAgo(30) }),
    ];
    const alerts = identifyDiversityAlerts(records, 2, now);
    const overdue = alerts.filter((a) => a.type === "review_overdue");
    for (const a of overdue) {
      expect(a.severity).toBe("medium");
    }
  });

  it("no_eia severity is always medium", () => {
    const records = [
      makeRecord({ id: "dr1", equality_impact_assessed: false, support_status: "in_place" }),
      makeRecord({ id: "dr2", equality_impact_assessed: false, support_status: "partially_met" }),
    ];
    const alerts = identifyDiversityAlerts(records, 2, now);
    const noEia = alerts.filter((a) => a.type === "no_eia");
    for (const a of noEia) {
      expect(a.severity).toBe("medium");
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ═══════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listRecords ────────────────────────────────────────────────────

  it("listRecords returns ok: true with empty array", async () => {
    const result = await listRecords("home-1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listRecords returns ok: true with childId filter", async () => {
    const result = await listRecords("home-1", { childId: "child-1" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listRecords returns ok: true with protectedCharacteristic filter", async () => {
    const result = await listRecords("home-1", { protectedCharacteristic: "race_ethnicity" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listRecords returns ok: true with supportCategory filter", async () => {
    const result = await listRecords("home-1", { supportCategory: "dietary_requirement" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listRecords returns ok: true with supportStatus filter", async () => {
    const result = await listRecords("home-1", { supportStatus: "in_place" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listRecords returns ok: true with limit filter", async () => {
    const result = await listRecords("home-1", { limit: 50 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  it("listRecords returns ok: true with all filters combined", async () => {
    const result = await listRecords("home-1", {
      childId: "child-1",
      protectedCharacteristic: "disability",
      supportCategory: "accessibility_adaptation",
      supportStatus: "in_place",
      limit: 10,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual([]);
    }
  });

  // ── createRecord ───────────────────────────────────────────────────

  it("createRecord returns ok: false with error message", async () => {
    const result = await createRecord({
      homeId: "home-1",
      childName: "Alice Smith",
      childId: "child-1",
      protectedCharacteristic: "race_ethnicity",
      characteristicDetail: "Mixed heritage",
      supportCategory: "cultural_activity",
      supportDescription: "Cultural celebrations",
      supportStatus: "in_place",
      reviewOutcome: "fully_effective",
      staffAware: true,
      staffTrained: true,
      equalityImpactAssessed: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("createRecord error message is a string", async () => {
    const result = await createRecord({
      homeId: "home-1",
      childName: "Bob Jones",
      childId: "child-2",
      protectedCharacteristic: "disability",
      characteristicDetail: "Physical disability",
      supportCategory: "accessibility_adaptation",
      supportDescription: "Wheelchair ramp",
      supportStatus: "in_place",
      reviewOutcome: "fully_effective",
      reviewedDate: daysAgo(3),
      nextReviewDate: daysFromNow(90),
      childViews: "I feel included",
      childSatisfied: true,
      staffAware: true,
      staffTrained: true,
      externalSupport: "OT referral",
      equalityImpactAssessed: true,
      notes: "Good progress",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.error).toBe("string");
    }
  });

  // ── updateRecord ───────────────────────────────────────────────────

  it("updateRecord returns ok: false with error message", async () => {
    const result = await updateRecord("dr-1", { support_status: "in_place" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Supabase not configured");
    }
  });

  it("updateRecord error message is a string for partial updates", async () => {
    const result = await updateRecord("dr-1", {
      support_status: "partially_met",
      notes: "Reassessed",
      staff_trained: true,
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
  it("computeDiversityMetrics with records from a single child across all 9 characteristics", () => {
    const chars: ProtectedCharacteristic[] = [
      "race_ethnicity", "religion_belief", "disability", "gender_identity",
      "sexual_orientation", "age", "language", "cultural_heritage", "other",
    ];
    const records = chars.map((c, i) =>
      makeRecord({
        id: `dr-${i}`,
        child_id: "c1",
        child_name: "Alice",
        protected_characteristic: c,
      }),
    );
    const m = computeDiversityMetrics(records, 1);
    expect(m.total_records).toBe(9);
    expect(m.children_with_records).toBe(1);
    expect(Object.keys(m.by_characteristic)).toHaveLength(9);
  });

  it("computeDiversityMetrics with all records at not_met", () => {
    const records = [
      makeRecord({ id: "dr1", support_status: "not_met" }),
      makeRecord({ id: "dr2", support_status: "not_met", child_id: "c2" }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.not_met_count).toBe(2);
    expect(m.in_place_count).toBe(0);
    expect(m.partially_met_count).toBe(0);
  });

  it("computeDiversityMetrics with all records at in_place", () => {
    const records = [
      makeRecord({ id: "dr1", support_status: "in_place" }),
      makeRecord({ id: "dr2", support_status: "in_place", child_id: "c2" }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.in_place_count).toBe(2);
    expect(m.not_met_count).toBe(0);
  });

  it("computeDiversityMetrics with all records at partially_met", () => {
    const records = [
      makeRecord({ id: "dr1", support_status: "partially_met" }),
      makeRecord({ id: "dr2", support_status: "partially_met", child_id: "c2" }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.partially_met_count).toBe(2);
    expect(m.in_place_count).toBe(0);
    expect(m.not_met_count).toBe(0);
  });

  it("computeDiversityMetrics with all records under_review", () => {
    const records = [
      makeRecord({ id: "dr1", support_status: "under_review" }),
      makeRecord({ id: "dr2", support_status: "under_review", child_id: "c2" }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.under_review_count).toBe(2);
    expect(m.in_place_count).toBe(0);
    expect(m.not_met_count).toBe(0);
  });

  it("computeDiversityMetrics with all records not_applicable", () => {
    const records = [
      makeRecord({ id: "dr1", support_status: "not_applicable" }),
      makeRecord({ id: "dr2", support_status: "not_applicable", child_id: "c2" }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.in_place_count).toBe(0);
    expect(m.partially_met_count).toBe(0);
    expect(m.not_met_count).toBe(0);
    expect(m.under_review_count).toBe(0);
  });

  it("computeDiversityMetrics by_support_status matches individual counts", () => {
    const records = [
      makeRecord({ id: "dr1", support_status: "in_place" }),
      makeRecord({ id: "dr2", support_status: "partially_met" }),
      makeRecord({ id: "dr3", support_status: "not_met" }),
      makeRecord({ id: "dr4", support_status: "under_review" }),
      makeRecord({ id: "dr5", support_status: "not_applicable" }),
    ];
    const m = computeDiversityMetrics(records, 5);
    expect(m.by_support_status["in_place"]).toBe(m.in_place_count);
    expect(m.by_support_status["partially_met"]).toBe(m.partially_met_count);
    expect(m.by_support_status["not_met"]).toBe(m.not_met_count);
    expect(m.by_support_status["under_review"]).toBe(m.under_review_count);
  });

  it("computeDiversityMetrics by_review_outcome matches individual counts", () => {
    const records = [
      makeRecord({ id: "dr1", review_outcome: "fully_effective" }),
      makeRecord({ id: "dr2", review_outcome: "not_effective" }),
      makeRecord({ id: "dr3", review_outcome: "partially_effective" }),
      makeRecord({ id: "dr4", review_outcome: "needs_adjustment" }),
      makeRecord({ id: "dr5", review_outcome: "not_reviewed" }),
    ];
    const m = computeDiversityMetrics(records, 5);
    expect(m.by_review_outcome["fully_effective"]).toBe(m.fully_effective_count);
    expect(m.by_review_outcome["not_effective"]).toBe(m.not_effective_count);
  });

  it("computeDiversityMetrics with mixed staff_aware, staff_trained, and EIA combinations", () => {
    const records = [
      makeRecord({ id: "dr1", staff_aware: true, staff_trained: true, equality_impact_assessed: true, child_views: "Yes" }),
      makeRecord({ id: "dr2", staff_aware: false, staff_trained: true, equality_impact_assessed: false, child_views: "Yes" }),
      makeRecord({ id: "dr3", staff_aware: true, staff_trained: false, equality_impact_assessed: true, child_views: null }),
      makeRecord({ id: "dr4", staff_aware: false, staff_trained: false, equality_impact_assessed: false, child_views: null }),
    ];
    const m = computeDiversityMetrics(records, 4);
    expect(m.staff_aware_rate).toBe(50);
    expect(m.staff_trained_rate).toBe(50);
    expect(m.equality_impact_rate).toBe(50);
    expect(m.child_views_rate).toBe(50);
  });

  it("identifyDiversityAlerts with all five alert types triggered simultaneously", () => {
    const records = [
      makeRecord({
        id: "dr1", child_id: "c1", child_name: "Alice",
        protected_characteristic: "race_ethnicity",
        support_status: "not_met",
        review_outcome: "not_effective",
        staff_aware: false,
        equality_impact_assessed: false,
        next_review_date: daysAgo(30),
        support_description: "Cultural support",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const types = new Set(alerts.map((a) => a.type));
    expect(types.has("need_not_met")).toBe(true);
    expect(types.has("staff_not_aware")).toBe(true);
    expect(types.has("support_not_effective")).toBe(true);
    expect(types.has("review_overdue")).toBe(true);
    expect(types.has("no_eia")).toBe(true);
    expect(types.size).toBe(5);
  });

  it("identifyDiversityAlerts empty records with 0 totalChildren produces no alerts", () => {
    const alerts = identifyDiversityAlerts([], 0, now);
    expect(alerts).toHaveLength(0);
  });

  it("identifyDiversityAlerts review_overdue with date exactly yesterday", () => {
    const records = [
      makeRecord({ id: "dr1", next_review_date: daysAgo(1) }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue).toBeTruthy();
  });

  it("identifyDiversityAlerts review_overdue with date far in the future", () => {
    const records = [
      makeRecord({ id: "dr1", next_review_date: daysFromNow(365) }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const overdue = alerts.find((a) => a.type === "review_overdue");
    expect(overdue).toBeUndefined();
  });

  it("identifyDiversityAlerts staff_not_aware excludes not_applicable but includes all other statuses", () => {
    const statuses: SupportStatus[] = ["in_place", "partially_met", "not_met", "under_review", "not_applicable"];
    const records = statuses.map((status, i) =>
      makeRecord({ id: `dr${i}`, staff_aware: false, support_status: status }),
    );
    const alerts = identifyDiversityAlerts(records, 5, now);
    const notAware = alerts.filter((a) => a.type === "staff_not_aware");
    expect(notAware).toHaveLength(4);
    const ids = notAware.map((a) => a.id);
    expect(ids).toContain("dr0"); // in_place
    expect(ids).toContain("dr1"); // partially_met
    expect(ids).toContain("dr2"); // not_met
    expect(ids).toContain("dr3"); // under_review
    expect(ids).not.toContain("dr4"); // not_applicable
  });

  it("identifyDiversityAlerts no_eia excludes not_applicable but includes all other statuses", () => {
    const statuses: SupportStatus[] = ["in_place", "partially_met", "not_met", "under_review", "not_applicable"];
    const records = statuses.map((status, i) =>
      makeRecord({ id: `dr${i}`, equality_impact_assessed: false, support_status: status }),
    );
    const alerts = identifyDiversityAlerts(records, 5, now);
    const noEia = alerts.filter((a) => a.type === "no_eia");
    expect(noEia).toHaveLength(4);
    const ids = noEia.map((a) => a.id);
    expect(ids).toContain("dr0"); // in_place
    expect(ids).toContain("dr1"); // partially_met
    expect(ids).toContain("dr2"); // not_met
    expect(ids).toContain("dr3"); // under_review
    expect(ids).not.toContain("dr4"); // not_applicable
  });

  it("computeDiversityMetrics with all 11 support categories present across records", () => {
    const cats: SupportCategory[] = [
      "dietary_requirement", "religious_observance", "language_support",
      "accessibility_adaptation", "cultural_activity", "identity_support",
      "community_link", "specialist_provision", "staff_training",
      "policy_adaptation", "other",
    ];
    const records = cats.map((cat, i) =>
      makeRecord({ id: `dr${i}`, support_category: cat }),
    );
    const m = computeDiversityMetrics(records, 11);
    expect(Object.keys(m.by_support_category)).toHaveLength(11);
    for (const cat of cats) {
      expect(m.by_support_category[cat]).toBe(1);
    }
  });

  it("computeDiversityMetrics by_characteristic with single characteristic", () => {
    const records = [
      makeRecord({ id: "dr1", protected_characteristic: "disability" }),
      makeRecord({ id: "dr2", protected_characteristic: "disability", child_id: "c2" }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(Object.keys(m.by_characteristic)).toHaveLength(1);
    expect(m.by_characteristic["disability"]).toBe(2);
  });

  it("need_not_met alert message mentions immediate action required", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Alice",
        support_status: "not_met",
        support_description: "Cultural support",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notMet = alerts.find((a) => a.type === "need_not_met");
    expect(notMet!.message).toContain("immediate action required");
  });

  it("staff_not_aware alert message mentions brief all staff", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Alice",
        staff_aware: false, support_status: "in_place",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notAware = alerts.find((a) => a.type === "staff_not_aware");
    expect(notAware!.message).toContain("brief all staff");
  });

  it("support_not_effective alert message mentions review and revise", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Alice",
        review_outcome: "not_effective",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notEff = alerts.find((a) => a.type === "support_not_effective");
    expect(notEff!.message).toContain("review and revise");
  });

  it("no_eia alert message mentions complete EIA", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Alice",
        equality_impact_assessed: false,
        support_status: "in_place",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const noEia = alerts.find((a) => a.type === "no_eia");
    expect(noEia!.message).toContain("complete EIA");
  });

  it("computeDiversityMetrics staff_aware_rate 100 with single aware record", () => {
    const records = [makeRecord({ id: "dr1", staff_aware: true })];
    const m = computeDiversityMetrics(records, 1);
    expect(m.staff_aware_rate).toBe(100);
  });

  it("computeDiversityMetrics staff_trained_rate 100 with single trained record", () => {
    const records = [makeRecord({ id: "dr1", staff_trained: true })];
    const m = computeDiversityMetrics(records, 1);
    expect(m.staff_trained_rate).toBe(100);
  });

  it("computeDiversityMetrics equality_impact_rate 100 with single EIA record", () => {
    const records = [makeRecord({ id: "dr1", equality_impact_assessed: true })];
    const m = computeDiversityMetrics(records, 1);
    expect(m.equality_impact_rate).toBe(100);
  });

  it("computeDiversityMetrics child_views_rate 100 with single record having views", () => {
    const records = [makeRecord({ id: "dr1", child_views: "My views" })];
    const m = computeDiversityMetrics(records, 1);
    expect(m.child_views_rate).toBe(100);
  });

  it("computeDiversityMetrics children_coverage with 1 child in 3 totalChildren", () => {
    const records = [makeRecord({ id: "dr1", child_id: "c1" })];
    const m = computeDiversityMetrics(records, 3);
    expect(m.children_coverage).toBe(33.3);
  });

  it("identifyDiversityAlerts characteristic underscore replacement in messages", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Alice",
        protected_characteristic: "sexual_orientation",
        support_status: "not_met",
        support_description: "Support",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notMet = alerts.find((a) => a.type === "need_not_met");
    expect(notMet!.message).toContain("sexual orientation");
    expect(notMet!.message).not.toContain("sexual_orientation");
  });

  it("identifyDiversityAlerts cultural_heritage underscore replacement in messages", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Alice",
        protected_characteristic: "cultural_heritage",
        staff_aware: false,
        support_status: "in_place",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notAware = alerts.find((a) => a.type === "staff_not_aware");
    expect(notAware!.message).toContain("cultural heritage");
    expect(notAware!.message).not.toContain("cultural_heritage");
  });

  it("identifyDiversityAlerts race_ethnicity underscore replacement in messages", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Alice",
        protected_characteristic: "race_ethnicity",
        review_outcome: "not_effective",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notEff = alerts.find((a) => a.type === "support_not_effective");
    expect(notEff!.message).toContain("race ethnicity");
    expect(notEff!.message).not.toContain("race_ethnicity");
  });

  it("identifyDiversityAlerts record with clean data produces no alerts", () => {
    const records = [
      makeRecord({
        id: "dr1",
        support_status: "in_place",
        review_outcome: "fully_effective",
        staff_aware: true,
        equality_impact_assessed: true,
        next_review_date: daysFromNow(90),
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    expect(alerts).toHaveLength(0);
  });

  it("identifyDiversityAlerts not_applicable record produces no staff_not_aware or no_eia alerts even with false flags", () => {
    const records = [
      makeRecord({
        id: "dr1",
        support_status: "not_applicable",
        staff_aware: false,
        equality_impact_assessed: false,
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const notAware = alerts.find((a) => a.type === "staff_not_aware");
    const noEia = alerts.find((a) => a.type === "no_eia");
    expect(notAware).toBeUndefined();
    expect(noEia).toBeUndefined();
  });

  it("identifyDiversityAlerts a record can trigger both need_not_met and staff_not_aware", () => {
    const records = [
      makeRecord({
        id: "dr1", child_name: "Alice",
        support_status: "not_met",
        staff_aware: false,
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("need_not_met");
    expect(types).toContain("staff_not_aware");
  });

  it("identifyDiversityAlerts a record can trigger both review_overdue and no_eia", () => {
    const records = [
      makeRecord({
        id: "dr1",
        next_review_date: daysAgo(10),
        equality_impact_assessed: false,
        support_status: "in_place",
      }),
    ];
    const alerts = identifyDiversityAlerts(records, 1, now);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("review_overdue");
    expect(types).toContain("no_eia");
  });

  it("identifyDiversityAlerts multiple records each triggering different alert types", () => {
    const records = [
      makeRecord({ id: "dr1", support_status: "not_met", support_description: "Need A" }),
      makeRecord({ id: "dr2", staff_aware: false, support_status: "in_place" }),
      makeRecord({ id: "dr3", review_outcome: "not_effective" }),
      makeRecord({ id: "dr4", next_review_date: daysAgo(10) }),
      makeRecord({ id: "dr5", equality_impact_assessed: false, support_status: "partially_met" }),
    ];
    const alerts = identifyDiversityAlerts(records, 5, now);
    const types = new Set(alerts.map((a) => a.type));
    expect(types.has("need_not_met")).toBe(true);
    expect(types.has("staff_not_aware")).toBe(true);
    expect(types.has("support_not_effective")).toBe(true);
    expect(types.has("review_overdue")).toBe(true);
    expect(types.has("no_eia")).toBe(true);
  });
});
