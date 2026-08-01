// ══════════════════════════════════════════════════════════════════════════════
// CARA — WORKFORCE DIVERSITY & EQUALITY SERVICE TESTS
// Pure-function unit tests for diversity metrics computation,
// alert identification, constant validation.
// CHR 2015 Reg 16 (providing suitable staff — diversity),
// Equality Act 2010 (protected characteristics),
// PSED (Public Sector Equality Duty — due regard).
//
// Covers: diversity data, equality training, adjustments,
// EIAs, and representation analysis.
//
// SCCIF: Leadership & Management — "The workforce is diverse
// and reflects the community." "Equality and inclusion are
// promoted across the home."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
  _testing,
  DIVERSITY_CATEGORIES,
  TRAINING_STATUSES,
  ADJUSTMENT_STATUSES,
  EIA_OUTCOMES,
} from "../workforce-diversity-service";

import type {
  WorkforceDiversityRecord,
  DiversityCategory,
  TrainingStatus,
  AdjustmentStatus,
  EiaOutcome,
} from "../workforce-diversity-service";

const { computeDiversityMetrics, identifyDiversityAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysAgo(n: number): string {
  return daysAgoISO(n).split("T")[0];
}

/** Build a minimal WorkforceDiversityRecord with sensible defaults. */
function makeRecord(
  overrides?: Partial<WorkforceDiversityRecord>,
): WorkforceDiversityRecord {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    staff_name: "Staff A",
    staff_id: "staff-1",
    diversity_category: "ethnicity",
    disclosure_status: "disclosed",
    equality_training_status: "completed",
    equality_training_date: "equality_training_date" in (overrides ?? {}) ? (overrides!.equality_training_date ?? null) : daysAgo(30),
    adjustment_status: "in_place",
    adjustment_details: "adjustment_details" in (overrides ?? {}) ? (overrides!.adjustment_details ?? null) : null,
    eia_outcome: "neutral",
    discrimination_reported: false,
    discrimination_details: "discrimination_details" in (overrides ?? {}) ? (overrides!.discrimination_details ?? null) : null,
    inclusive_practice_rating: 8,
    staff_satisfaction_with_inclusion: "staff_satisfaction_with_inclusion" in (overrides ?? {}) ? (overrides!.staff_satisfaction_with_inclusion ?? null) : null,
    review_date: "review_date" in (overrides ?? {}) ? (overrides!.review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: daysAgoISO(5),
    updated_at: daysAgoISO(5),
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("DIVERSITY_CATEGORIES", () => {
  it("contains exactly 10 entries", () => {
    expect(DIVERSITY_CATEGORIES).toHaveLength(10);
  });

  it("every entry has a non-empty category string", () => {
    for (const c of DIVERSITY_CATEGORIES) {
      expect(typeof c.category).toBe("string");
      expect(c.category.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const c of DIVERSITY_CATEGORIES) {
      expect(typeof c.label).toBe("string");
      expect(c.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate categories", () => {
    const categories = DIVERSITY_CATEGORIES.map((c) => c.category);
    expect(new Set(categories).size).toBe(categories.length);
  });

  it("has no duplicate labels", () => {
    const labels = DIVERSITY_CATEGORIES.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected categories", () => {
    const categories = DIVERSITY_CATEGORIES.map((c) => c.category);
    const expected: DiversityCategory[] = [
      "ethnicity", "disability", "gender", "sexual_orientation",
      "religion_belief", "age_group", "marital_status",
      "pregnancy_maternity", "gender_reassignment", "other",
    ];
    for (const e of expected) {
      expect(categories).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const c of DIVERSITY_CATEGORIES) {
      expect(c.label[0]).toBe(c.label[0].toUpperCase());
    }
  });

  it("includes ethnicity", () => {
    expect(DIVERSITY_CATEGORIES.map((c) => c.category)).toContain("ethnicity");
  });

  it("includes disability", () => {
    expect(DIVERSITY_CATEGORIES.map((c) => c.category)).toContain("disability");
  });

  it("includes gender_reassignment", () => {
    expect(DIVERSITY_CATEGORIES.map((c) => c.category)).toContain("gender_reassignment");
  });
});

describe("TRAINING_STATUSES", () => {
  it("contains exactly 5 entries", () => {
    expect(TRAINING_STATUSES).toHaveLength(5);
  });

  it("every entry has a non-empty status string", () => {
    for (const t of TRAINING_STATUSES) {
      expect(typeof t.status).toBe("string");
      expect(t.status.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const t of TRAINING_STATUSES) {
      expect(typeof t.label).toBe("string");
      expect(t.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate statuses", () => {
    const statuses = TRAINING_STATUSES.map((t) => t.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("has no duplicate labels", () => {
    const labels = TRAINING_STATUSES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected statuses", () => {
    const statuses = TRAINING_STATUSES.map((t) => t.status);
    const expected: TrainingStatus[] = [
      "completed", "in_progress", "not_started", "overdue", "refresher_due",
    ];
    for (const e of expected) {
      expect(statuses).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const t of TRAINING_STATUSES) {
      expect(t.label[0]).toBe(t.label[0].toUpperCase());
    }
  });
});

describe("ADJUSTMENT_STATUSES", () => {
  it("contains exactly 5 entries", () => {
    expect(ADJUSTMENT_STATUSES).toHaveLength(5);
  });

  it("every entry has a non-empty status string", () => {
    for (const a of ADJUSTMENT_STATUSES) {
      expect(typeof a.status).toBe("string");
      expect(a.status.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const a of ADJUSTMENT_STATUSES) {
      expect(typeof a.label).toBe("string");
      expect(a.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate statuses", () => {
    const statuses = ADJUSTMENT_STATUSES.map((a) => a.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("has no duplicate labels", () => {
    const labels = ADJUSTMENT_STATUSES.map((a) => a.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected statuses", () => {
    const statuses = ADJUSTMENT_STATUSES.map((a) => a.status);
    const expected: AdjustmentStatus[] = [
      "in_place", "requested", "under_review", "denied", "no_longer_needed",
    ];
    for (const e of expected) {
      expect(statuses).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const a of ADJUSTMENT_STATUSES) {
      expect(a.label[0]).toBe(a.label[0].toUpperCase());
    }
  });
});

describe("EIA_OUTCOMES", () => {
  it("contains exactly 5 entries", () => {
    expect(EIA_OUTCOMES).toHaveLength(5);
  });

  it("every entry has a non-empty outcome string", () => {
    for (const e of EIA_OUTCOMES) {
      expect(typeof e.outcome).toBe("string");
      expect(e.outcome.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const e of EIA_OUTCOMES) {
      expect(typeof e.label).toBe("string");
      expect(e.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate outcomes", () => {
    const outcomes = EIA_OUTCOMES.map((e) => e.outcome);
    expect(new Set(outcomes).size).toBe(outcomes.length);
  });

  it("has no duplicate labels", () => {
    const labels = EIA_OUTCOMES.map((e) => e.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected outcomes", () => {
    const outcomes = EIA_OUTCOMES.map((e) => e.outcome);
    const expected: EiaOutcome[] = [
      "positive_impact", "neutral", "negative_impact_mitigated",
      "negative_impact_unmitigated", "not_assessed",
    ];
    for (const e of expected) {
      expect(outcomes).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const e of EIA_OUTCOMES) {
      expect(e.label[0]).toBe(e.label[0].toUpperCase());
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeDiversityMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeDiversityMetrics", () => {
  // ── Empty records ──────────────────────────────────────────────────────

  describe("empty records", () => {
    it("returns total_records = 0", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.total_records).toBe(0);
    });

    it("returns staff_with_records = 0", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.staff_with_records).toBe(0);
    });

    it("returns diversity_coverage = 0 when totalStaff > 0", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.diversity_coverage).toBe(0);
    });

    it("returns diversity_coverage = 0 when totalStaff = 0", () => {
      const m = computeDiversityMetrics([], 0);
      expect(m.diversity_coverage).toBeNull();;
    });

    it("returns disclosure_rate = 0", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.disclosure_rate).toBeNull();;
    });

    it("returns training_completed_count = 0", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.training_completed_count).toBe(0);
    });

    it("returns training_completed_rate = 0", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.training_completed_rate).toBeNull();;
    });

    it("returns training_overdue_count = 0", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.training_overdue_count).toBe(0);
    });

    it("returns adjustments_in_place = 0", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.adjustments_in_place).toBe(0);
    });

    it("returns adjustments_requested = 0", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.adjustments_requested).toBe(0);
    });

    it("returns discrimination_reported_count = 0", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.discrimination_reported_count).toBe(0);
    });

    it("returns average_inclusive_practice = 0", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.average_inclusive_practice).toBeNull();;
    });

    it("returns average_satisfaction = 0", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.average_satisfaction).toBeNull();;
    });

    it("returns eia_not_assessed_count = 0", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.eia_not_assessed_count).toBe(0);
    });

    it("returns negative_unmitigated_count = 0", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.negative_unmitigated_count).toBe(0);
    });

    it("returns empty by_diversity_category", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.by_diversity_category).toEqual({});
    });

    it("returns empty by_training_status", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.by_training_status).toEqual({});
    });

    it("returns empty by_adjustment_status", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.by_adjustment_status).toEqual({});
    });

    it("returns empty by_eia_outcome", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.by_eia_outcome).toEqual({});
    });
  });

  // ── Single record ──────────────────────────────────────────────────────

  describe("single record", () => {
    const rec = makeRecord({
      staff_id: "s1",
      diversity_category: "ethnicity",
      disclosure_status: "disclosed",
      equality_training_status: "completed",
      adjustment_status: "in_place",
      eia_outcome: "neutral",
      discrimination_reported: false,
      inclusive_practice_rating: 7,
      staff_satisfaction_with_inclusion: 8,
    });

    it("returns total_records = 1", () => {
      const m = computeDiversityMetrics([rec], 4);
      expect(m.total_records).toBe(1);
    });

    it("returns staff_with_records = 1", () => {
      const m = computeDiversityMetrics([rec], 4);
      expect(m.staff_with_records).toBe(1);
    });

    it("calculates diversity_coverage correctly (1 of 4 = 25%)", () => {
      const m = computeDiversityMetrics([rec], 4);
      expect(m.diversity_coverage).toBe(25);
    });

    it("returns disclosure_rate = 100 when all disclosed", () => {
      const m = computeDiversityMetrics([rec], 4);
      expect(m.disclosure_rate).toBe(100);
    });

    it("returns training_completed_count = 1", () => {
      const m = computeDiversityMetrics([rec], 4);
      expect(m.training_completed_count).toBe(1);
    });

    it("returns training_completed_rate = 100", () => {
      const m = computeDiversityMetrics([rec], 4);
      expect(m.training_completed_rate).toBe(100);
    });

    it("returns training_overdue_count = 0", () => {
      const m = computeDiversityMetrics([rec], 4);
      expect(m.training_overdue_count).toBe(0);
    });

    it("returns adjustments_in_place = 1", () => {
      const m = computeDiversityMetrics([rec], 4);
      expect(m.adjustments_in_place).toBe(1);
    });

    it("returns adjustments_requested = 0", () => {
      const m = computeDiversityMetrics([rec], 4);
      expect(m.adjustments_requested).toBe(0);
    });

    it("returns discrimination_reported_count = 0", () => {
      const m = computeDiversityMetrics([rec], 4);
      expect(m.discrimination_reported_count).toBe(0);
    });

    it("returns average_inclusive_practice = 7", () => {
      const m = computeDiversityMetrics([rec], 4);
      expect(m.average_inclusive_practice).toBe(7);
    });

    it("returns average_satisfaction = 8", () => {
      const m = computeDiversityMetrics([rec], 4);
      expect(m.average_satisfaction).toBe(8);
    });

    it("returns eia_not_assessed_count = 0", () => {
      const m = computeDiversityMetrics([rec], 4);
      expect(m.eia_not_assessed_count).toBe(0);
    });

    it("returns negative_unmitigated_count = 0", () => {
      const m = computeDiversityMetrics([rec], 4);
      expect(m.negative_unmitigated_count).toBe(0);
    });

    it("by_diversity_category has single entry for ethnicity", () => {
      const m = computeDiversityMetrics([rec], 4);
      expect(m.by_diversity_category).toEqual({ ethnicity: 1 });
    });

    it("by_training_status has single entry for completed", () => {
      const m = computeDiversityMetrics([rec], 4);
      expect(m.by_training_status).toEqual({ completed: 1 });
    });

    it("by_adjustment_status has single entry for in_place", () => {
      const m = computeDiversityMetrics([rec], 4);
      expect(m.by_adjustment_status).toEqual({ in_place: 1 });
    });

    it("by_eia_outcome has single entry for neutral", () => {
      const m = computeDiversityMetrics([rec], 4);
      expect(m.by_eia_outcome).toEqual({ neutral: 1 });
    });
  });

  // ── Multiple records ──────────────────────────────────────────────────

  describe("multiple records", () => {
    const records = [
      makeRecord({
        staff_id: "s1", diversity_category: "ethnicity",
        disclosure_status: "disclosed", equality_training_status: "completed",
        adjustment_status: "in_place", eia_outcome: "positive_impact",
        discrimination_reported: false, inclusive_practice_rating: 8,
        staff_satisfaction_with_inclusion: 9,
      }),
      makeRecord({
        staff_id: "s2", diversity_category: "disability",
        disclosure_status: "prefer_not_to_say", equality_training_status: "overdue",
        adjustment_status: "requested", eia_outcome: "negative_impact_unmitigated",
        discrimination_reported: true, discrimination_details: "Verbal abuse",
        inclusive_practice_rating: 4,
        staff_satisfaction_with_inclusion: 3,
      }),
      makeRecord({
        staff_id: "s3", diversity_category: "gender",
        disclosure_status: "disclosed", equality_training_status: "in_progress",
        adjustment_status: "under_review", eia_outcome: "not_assessed",
        discrimination_reported: false, inclusive_practice_rating: 6,
        staff_satisfaction_with_inclusion: null,
      }),
      makeRecord({
        staff_id: "s4", diversity_category: "ethnicity",
        disclosure_status: "not_asked", equality_training_status: "not_started",
        adjustment_status: "denied", eia_outcome: "neutral",
        discrimination_reported: false, inclusive_practice_rating: 5,
        staff_satisfaction_with_inclusion: 7,
      }),
      makeRecord({
        staff_id: "s5", diversity_category: "sexual_orientation",
        disclosure_status: "disclosed", equality_training_status: "overdue",
        adjustment_status: "no_longer_needed", eia_outcome: "negative_impact_mitigated",
        discrimination_reported: true, discrimination_details: "Exclusion from meetings",
        inclusive_practice_rating: 7,
        staff_satisfaction_with_inclusion: null,
      }),
    ];

    it("returns total_records = 5", () => {
      const m = computeDiversityMetrics(records, 8);
      expect(m.total_records).toBe(5);
    });

    it("returns staff_with_records = 5", () => {
      const m = computeDiversityMetrics(records, 8);
      expect(m.staff_with_records).toBe(5);
    });

    it("calculates diversity_coverage correctly (5 of 8 = 62.5%)", () => {
      const m = computeDiversityMetrics(records, 8);
      expect(m.diversity_coverage).toBe(62.5);
    });

    it("returns disclosure_rate (3 disclosed of 5 = 60%)", () => {
      const m = computeDiversityMetrics(records, 8);
      expect(m.disclosure_rate).toBe(60);
    });

    it("returns training_completed_count = 1", () => {
      const m = computeDiversityMetrics(records, 8);
      expect(m.training_completed_count).toBe(1);
    });

    it("returns training_completed_rate = 20 (1 of 5)", () => {
      const m = computeDiversityMetrics(records, 8);
      expect(m.training_completed_rate).toBe(20);
    });

    it("returns training_overdue_count = 2", () => {
      const m = computeDiversityMetrics(records, 8);
      expect(m.training_overdue_count).toBe(2);
    });

    it("returns adjustments_in_place = 1", () => {
      const m = computeDiversityMetrics(records, 8);
      expect(m.adjustments_in_place).toBe(1);
    });

    it("returns adjustments_requested = 1", () => {
      const m = computeDiversityMetrics(records, 8);
      expect(m.adjustments_requested).toBe(1);
    });

    it("returns discrimination_reported_count = 2", () => {
      const m = computeDiversityMetrics(records, 8);
      expect(m.discrimination_reported_count).toBe(2);
    });

    it("returns average_inclusive_practice = 6 ((8+4+6+5+7)/5 = 6)", () => {
      const m = computeDiversityMetrics(records, 8);
      expect(m.average_inclusive_practice).toBe(6);
    });

    it("returns average_satisfaction only from non-null values ((9+3+7)/3 = 6.3)", () => {
      const m = computeDiversityMetrics(records, 8);
      expect(m.average_satisfaction).toBe(6.3);
    });

    it("returns eia_not_assessed_count = 1", () => {
      const m = computeDiversityMetrics(records, 8);
      expect(m.eia_not_assessed_count).toBe(1);
    });

    it("returns negative_unmitigated_count = 1", () => {
      const m = computeDiversityMetrics(records, 8);
      expect(m.negative_unmitigated_count).toBe(1);
    });

    it("groups by_diversity_category correctly", () => {
      const m = computeDiversityMetrics(records, 8);
      expect(m.by_diversity_category).toEqual({
        ethnicity: 2, disability: 1, gender: 1, sexual_orientation: 1,
      });
    });

    it("groups by_training_status correctly", () => {
      const m = computeDiversityMetrics(records, 8);
      expect(m.by_training_status).toEqual({
        completed: 1, overdue: 2, in_progress: 1, not_started: 1,
      });
    });

    it("groups by_adjustment_status correctly", () => {
      const m = computeDiversityMetrics(records, 8);
      expect(m.by_adjustment_status).toEqual({
        in_place: 1, requested: 1, under_review: 1, denied: 1, no_longer_needed: 1,
      });
    });

    it("groups by_eia_outcome correctly", () => {
      const m = computeDiversityMetrics(records, 8);
      expect(m.by_eia_outcome).toEqual({
        positive_impact: 1, negative_impact_unmitigated: 1,
        not_assessed: 1, neutral: 1, negative_impact_mitigated: 1,
      });
    });
  });

  // ── diversity_coverage edge cases ──────────────────────────────────────

  describe("diversity_coverage edge cases", () => {
    it("returns 0 when totalStaff = 0", () => {
      const recs = [makeRecord()];
      const m = computeDiversityMetrics(recs, 0);
      expect(m.diversity_coverage).toBeNull();;
    });

    it("returns 100 when all staff have records", () => {
      const recs = [
        makeRecord({ staff_id: "s1" }),
        makeRecord({ staff_id: "s2" }),
      ];
      const m = computeDiversityMetrics(recs, 2);
      expect(m.diversity_coverage).toBe(100);
    });

    it("deduplicates staff by staff_id", () => {
      const recs = [
        makeRecord({ staff_id: "s1" }),
        makeRecord({ staff_id: "s1" }),
        makeRecord({ staff_id: "s1" }),
      ];
      const m = computeDiversityMetrics(recs, 3);
      expect(m.staff_with_records).toBe(1);
      expect(m.diversity_coverage).toBe(33.3);
    });

    it("rounds coverage to 1 decimal place (1 of 3 = 33.3%)", () => {
      const recs = [makeRecord({ staff_id: "s1" })];
      const m = computeDiversityMetrics(recs, 3);
      expect(m.diversity_coverage).toBe(33.3);
    });

    it("rounds coverage correctly (2 of 3 = 66.7%)", () => {
      const recs = [
        makeRecord({ staff_id: "s1" }),
        makeRecord({ staff_id: "s2" }),
      ];
      const m = computeDiversityMetrics(recs, 3);
      expect(m.diversity_coverage).toBe(66.7);
    });

    it("handles more unique staff than totalStaff gracefully", () => {
      const recs = [
        makeRecord({ staff_id: "s1" }),
        makeRecord({ staff_id: "s2" }),
        makeRecord({ staff_id: "s3" }),
      ];
      const m = computeDiversityMetrics(recs, 2);
      expect(m.diversity_coverage).toBe(150);
    });
  });

  // ── disclosure_rate ────────────────────────────────────────────────────

  describe("disclosure_rate", () => {
    it("returns 0 when no records", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.disclosure_rate).toBeNull();;
    });

    it("returns 100 when all disclosed", () => {
      const recs = [
        makeRecord({ disclosure_status: "disclosed" }),
        makeRecord({ disclosure_status: "disclosed" }),
      ];
      const m = computeDiversityMetrics(recs, 2);
      expect(m.disclosure_rate).toBe(100);
    });

    it("returns 0 when none disclosed", () => {
      const recs = [
        makeRecord({ disclosure_status: "prefer_not_to_say" }),
        makeRecord({ disclosure_status: "not_asked" }),
      ];
      const m = computeDiversityMetrics(recs, 2);
      expect(m.disclosure_rate).toBe(0);
    });

    it("rounds correctly (1 of 3 = 33.3%)", () => {
      const recs = [
        makeRecord({ disclosure_status: "disclosed" }),
        makeRecord({ disclosure_status: "prefer_not_to_say" }),
        makeRecord({ disclosure_status: "not_asked" }),
      ];
      const m = computeDiversityMetrics(recs, 3);
      expect(m.disclosure_rate).toBe(33.3);
    });

    it("rounds correctly (2 of 3 = 66.7%)", () => {
      const recs = [
        makeRecord({ disclosure_status: "disclosed" }),
        makeRecord({ disclosure_status: "disclosed" }),
        makeRecord({ disclosure_status: "not_asked" }),
      ];
      const m = computeDiversityMetrics(recs, 3);
      expect(m.disclosure_rate).toBe(66.7);
    });
  });

  // ── training_completed_rate ────────────────────────────────────────────

  describe("training_completed_rate", () => {
    it("returns 0 when no records", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.training_completed_rate).toBeNull();;
    });

    it("returns 100 when all completed", () => {
      const recs = [
        makeRecord({ equality_training_status: "completed" }),
        makeRecord({ equality_training_status: "completed" }),
      ];
      const m = computeDiversityMetrics(recs, 2);
      expect(m.training_completed_rate).toBe(100);
    });

    it("returns 0 when none completed", () => {
      const recs = [
        makeRecord({ equality_training_status: "overdue" }),
        makeRecord({ equality_training_status: "not_started" }),
      ];
      const m = computeDiversityMetrics(recs, 2);
      expect(m.training_completed_rate).toBe(0);
    });

    it("rounds correctly (1 of 3 = 33.3%)", () => {
      const recs = [
        makeRecord({ equality_training_status: "completed" }),
        makeRecord({ equality_training_status: "overdue" }),
        makeRecord({ equality_training_status: "in_progress" }),
      ];
      const m = computeDiversityMetrics(recs, 3);
      expect(m.training_completed_rate).toBe(33.3);
    });

    it("uses total records (not just completed) as denominator", () => {
      const recs = [
        makeRecord({ equality_training_status: "completed" }),
        makeRecord({ equality_training_status: "overdue" }),
        makeRecord({ equality_training_status: "not_started" }),
        makeRecord({ equality_training_status: "refresher_due" }),
      ];
      const m = computeDiversityMetrics(recs, 4);
      expect(m.training_completed_rate).toBe(25);
    });
  });

  // ── average_inclusive_practice ──────────────────────────────────────────

  describe("average_inclusive_practice", () => {
    it("returns 0 when no records", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.average_inclusive_practice).toBeNull();;
    });

    it("returns the value itself for a single record", () => {
      const recs = [makeRecord({ inclusive_practice_rating: 9 })];
      const m = computeDiversityMetrics(recs, 1);
      expect(m.average_inclusive_practice).toBe(9);
    });

    it("calculates average across all records", () => {
      const recs = [
        makeRecord({ inclusive_practice_rating: 6 }),
        makeRecord({ inclusive_practice_rating: 8 }),
      ];
      const m = computeDiversityMetrics(recs, 2);
      expect(m.average_inclusive_practice).toBe(7);
    });

    it("rounds to 1 decimal place (Math.round(avg * 10) / 10)", () => {
      const recs = [
        makeRecord({ inclusive_practice_rating: 7 }),
        makeRecord({ inclusive_practice_rating: 8 }),
        makeRecord({ inclusive_practice_rating: 6 }),
      ];
      // (7+8+6)/3 = 7
      const m = computeDiversityMetrics(recs, 3);
      expect(m.average_inclusive_practice).toBe(7);
    });

    it("rounds fractional averages correctly ((7+8+9)/3 = 8)", () => {
      const recs = [
        makeRecord({ inclusive_practice_rating: 7 }),
        makeRecord({ inclusive_practice_rating: 8 }),
        makeRecord({ inclusive_practice_rating: 9 }),
      ];
      const m = computeDiversityMetrics(recs, 3);
      expect(m.average_inclusive_practice).toBe(8);
    });

    it("handles non-round fractional averages ((5+6)/3 = 3.7)", () => {
      const recs = [
        makeRecord({ inclusive_practice_rating: 5 }),
        makeRecord({ inclusive_practice_rating: 6 }),
        makeRecord({ inclusive_practice_rating: 0 }),
      ];
      // (5+6+0)/3 = 3.666... => Math.round(3.666... * 10)/10 = 3.7
      const m = computeDiversityMetrics(recs, 3);
      expect(m.average_inclusive_practice).toBe(3.7);
    });
  });

  // ── average_satisfaction ───────────────────────────────────────────────

  describe("average_satisfaction", () => {
    it("returns 0 when no records", () => {
      const m = computeDiversityMetrics([], 5);
      expect(m.average_satisfaction).toBeNull();;
    });

    it("returns 0 when all satisfaction values are null", () => {
      const recs = [
        makeRecord({ staff_satisfaction_with_inclusion: null }),
        makeRecord({ staff_satisfaction_with_inclusion: null }),
      ];
      const m = computeDiversityMetrics(recs, 2);
      expect(m.average_satisfaction).toBeNull();;
    });

    it("only considers non-null values", () => {
      const recs = [
        makeRecord({ staff_satisfaction_with_inclusion: 8 }),
        makeRecord({ staff_satisfaction_with_inclusion: null }),
        makeRecord({ staff_satisfaction_with_inclusion: 6 }),
      ];
      // (8+6)/2 = 7
      const m = computeDiversityMetrics(recs, 3);
      expect(m.average_satisfaction).toBe(7);
    });

    it("returns the value itself for a single non-null record", () => {
      const recs = [makeRecord({ staff_satisfaction_with_inclusion: 9 })];
      const m = computeDiversityMetrics(recs, 1);
      expect(m.average_satisfaction).toBe(9);
    });

    it("rounds to 1 decimal place", () => {
      const recs = [
        makeRecord({ staff_satisfaction_with_inclusion: 7 }),
        makeRecord({ staff_satisfaction_with_inclusion: 8 }),
        makeRecord({ staff_satisfaction_with_inclusion: 9 }),
      ];
      // (7+8+9)/3 = 8
      const m = computeDiversityMetrics(recs, 3);
      expect(m.average_satisfaction).toBe(8);
    });

    it("handles fractional average correctly ((9+3+7)/3 = 6.3)", () => {
      const recs = [
        makeRecord({ staff_satisfaction_with_inclusion: 9 }),
        makeRecord({ staff_satisfaction_with_inclusion: 3 }),
        makeRecord({ staff_satisfaction_with_inclusion: 7 }),
      ];
      const m = computeDiversityMetrics(recs, 3);
      expect(m.average_satisfaction).toBe(6.3);
    });

    it("ignores null records when computing denominator", () => {
      const recs = [
        makeRecord({ staff_satisfaction_with_inclusion: 10 }),
        makeRecord({ staff_satisfaction_with_inclusion: null }),
        makeRecord({ staff_satisfaction_with_inclusion: null }),
        makeRecord({ staff_satisfaction_with_inclusion: null }),
      ];
      // only 1 non-null, so average = 10/1 = 10
      const m = computeDiversityMetrics(recs, 4);
      expect(m.average_satisfaction).toBe(10);
    });
  });

  // ── training_overdue_count ─────────────────────────────────────────────

  describe("training_overdue_count", () => {
    it("returns 0 when no records have overdue training", () => {
      const recs = [
        makeRecord({ equality_training_status: "completed" }),
        makeRecord({ equality_training_status: "in_progress" }),
      ];
      const m = computeDiversityMetrics(recs, 2);
      expect(m.training_overdue_count).toBe(0);
    });

    it("counts records with overdue training", () => {
      const recs = [
        makeRecord({ equality_training_status: "overdue" }),
        makeRecord({ equality_training_status: "overdue" }),
        makeRecord({ equality_training_status: "completed" }),
      ];
      const m = computeDiversityMetrics(recs, 3);
      expect(m.training_overdue_count).toBe(2);
    });

    it("does not count refresher_due as overdue", () => {
      const recs = [
        makeRecord({ equality_training_status: "refresher_due" }),
      ];
      const m = computeDiversityMetrics(recs, 1);
      expect(m.training_overdue_count).toBe(0);
    });
  });

  // ── adjustments counts ─────────────────────────────────────────────────

  describe("adjustments counts", () => {
    it("counts adjustments_in_place correctly", () => {
      const recs = [
        makeRecord({ adjustment_status: "in_place" }),
        makeRecord({ adjustment_status: "in_place" }),
        makeRecord({ adjustment_status: "requested" }),
      ];
      const m = computeDiversityMetrics(recs, 3);
      expect(m.adjustments_in_place).toBe(2);
    });

    it("counts adjustments_requested correctly", () => {
      const recs = [
        makeRecord({ adjustment_status: "requested" }),
        makeRecord({ adjustment_status: "requested" }),
        makeRecord({ adjustment_status: "in_place" }),
      ];
      const m = computeDiversityMetrics(recs, 3);
      expect(m.adjustments_requested).toBe(2);
    });

    it("does not count under_review as requested", () => {
      const recs = [
        makeRecord({ adjustment_status: "under_review" }),
      ];
      const m = computeDiversityMetrics(recs, 1);
      expect(m.adjustments_requested).toBe(0);
    });

    it("does not count denied as in_place", () => {
      const recs = [
        makeRecord({ adjustment_status: "denied" }),
      ];
      const m = computeDiversityMetrics(recs, 1);
      expect(m.adjustments_in_place).toBe(0);
    });
  });

  // ── discrimination_reported_count ──────────────────────────────────────

  describe("discrimination_reported_count", () => {
    it("counts records where discrimination_reported is true", () => {
      const recs = [
        makeRecord({ discrimination_reported: true }),
        makeRecord({ discrimination_reported: true }),
        makeRecord({ discrimination_reported: false }),
      ];
      const m = computeDiversityMetrics(recs, 3);
      expect(m.discrimination_reported_count).toBe(2);
    });

    it("returns 0 when no discrimination reported", () => {
      const recs = [
        makeRecord({ discrimination_reported: false }),
      ];
      const m = computeDiversityMetrics(recs, 1);
      expect(m.discrimination_reported_count).toBe(0);
    });
  });

  // ── EIA counts ─────────────────────────────────────────────────────────

  describe("EIA counts", () => {
    it("counts eia_not_assessed_count correctly", () => {
      const recs = [
        makeRecord({ eia_outcome: "not_assessed" }),
        makeRecord({ eia_outcome: "not_assessed" }),
        makeRecord({ eia_outcome: "neutral" }),
      ];
      const m = computeDiversityMetrics(recs, 3);
      expect(m.eia_not_assessed_count).toBe(2);
    });

    it("counts negative_unmitigated_count correctly", () => {
      const recs = [
        makeRecord({ eia_outcome: "negative_impact_unmitigated" }),
        makeRecord({ eia_outcome: "negative_impact_unmitigated" }),
        makeRecord({ eia_outcome: "positive_impact" }),
      ];
      const m = computeDiversityMetrics(recs, 3);
      expect(m.negative_unmitigated_count).toBe(2);
    });

    it("does not count negative_impact_mitigated as unmitigated", () => {
      const recs = [
        makeRecord({ eia_outcome: "negative_impact_mitigated" }),
      ];
      const m = computeDiversityMetrics(recs, 1);
      expect(m.negative_unmitigated_count).toBe(0);
    });
  });

  // ── by_diversity_category ──────────────────────────────────────────────

  describe("by_diversity_category", () => {
    it("groups multiple categories correctly", () => {
      const recs = [
        makeRecord({ diversity_category: "ethnicity" }),
        makeRecord({ diversity_category: "ethnicity" }),
        makeRecord({ diversity_category: "disability" }),
        makeRecord({ diversity_category: "gender" }),
      ];
      const m = computeDiversityMetrics(recs, 4);
      expect(m.by_diversity_category).toEqual({ ethnicity: 2, disability: 1, gender: 1 });
    });

    it("handles all records with same category", () => {
      const recs = [
        makeRecord({ diversity_category: "age_group" }),
        makeRecord({ diversity_category: "age_group" }),
      ];
      const m = computeDiversityMetrics(recs, 2);
      expect(m.by_diversity_category).toEqual({ age_group: 2 });
    });
  });

  // ── by_training_status ─────────────────────────────────────────────────

  describe("by_training_status", () => {
    it("groups multiple statuses correctly", () => {
      const recs = [
        makeRecord({ equality_training_status: "completed" }),
        makeRecord({ equality_training_status: "completed" }),
        makeRecord({ equality_training_status: "overdue" }),
        makeRecord({ equality_training_status: "not_started" }),
      ];
      const m = computeDiversityMetrics(recs, 4);
      expect(m.by_training_status).toEqual({ completed: 2, overdue: 1, not_started: 1 });
    });

    it("handles all same status", () => {
      const recs = [
        makeRecord({ equality_training_status: "in_progress" }),
        makeRecord({ equality_training_status: "in_progress" }),
      ];
      const m = computeDiversityMetrics(recs, 2);
      expect(m.by_training_status).toEqual({ in_progress: 2 });
    });
  });

  // ── by_adjustment_status ───────────────────────────────────────────────

  describe("by_adjustment_status", () => {
    it("groups multiple statuses correctly", () => {
      const recs = [
        makeRecord({ adjustment_status: "in_place" }),
        makeRecord({ adjustment_status: "in_place" }),
        makeRecord({ adjustment_status: "requested" }),
        makeRecord({ adjustment_status: "denied" }),
      ];
      const m = computeDiversityMetrics(recs, 4);
      expect(m.by_adjustment_status).toEqual({ in_place: 2, requested: 1, denied: 1 });
    });

    it("handles all same status", () => {
      const recs = [
        makeRecord({ adjustment_status: "under_review" }),
        makeRecord({ adjustment_status: "under_review" }),
      ];
      const m = computeDiversityMetrics(recs, 2);
      expect(m.by_adjustment_status).toEqual({ under_review: 2 });
    });
  });

  // ── by_eia_outcome ─────────────────────────────────────────────────────

  describe("by_eia_outcome", () => {
    it("groups multiple outcomes correctly", () => {
      const recs = [
        makeRecord({ eia_outcome: "positive_impact" }),
        makeRecord({ eia_outcome: "neutral" }),
        makeRecord({ eia_outcome: "neutral" }),
        makeRecord({ eia_outcome: "not_assessed" }),
      ];
      const m = computeDiversityMetrics(recs, 4);
      expect(m.by_eia_outcome).toEqual({ positive_impact: 1, neutral: 2, not_assessed: 1 });
    });

    it("handles all same outcome", () => {
      const recs = [
        makeRecord({ eia_outcome: "negative_impact_mitigated" }),
        makeRecord({ eia_outcome: "negative_impact_mitigated" }),
      ];
      const m = computeDiversityMetrics(recs, 2);
      expect(m.by_eia_outcome).toEqual({ negative_impact_mitigated: 2 });
    });
  });

  // ── Return shape ──────────────────────────────────────────────────────

  describe("return shape", () => {
    it("returns exactly 18 keys", () => {
      const m = computeDiversityMetrics([], 0);
      expect(Object.keys(m)).toHaveLength(18);
    });

    it("contains all expected keys", () => {
      const m = computeDiversityMetrics([], 0);
      const keys = Object.keys(m);
      const expected = [
        "total_records", "staff_with_records", "diversity_coverage",
        "disclosure_rate", "training_completed_count", "training_completed_rate",
        "training_overdue_count", "adjustments_in_place", "adjustments_requested",
        "discrimination_reported_count", "average_inclusive_practice",
        "average_satisfaction", "eia_not_assessed_count", "negative_unmitigated_count",
        "by_diversity_category", "by_training_status",
        "by_adjustment_status", "by_eia_outcome",
      ];
      for (const k of expected) {
        expect(keys).toContain(k);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// identifyDiversityAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyDiversityAlerts", () => {
  // ── No alerts ─────────────────────────────────────────────────────────

  describe("no alerts", () => {
    it("returns empty array when no records and no staff", () => {
      const alerts = identifyDiversityAlerts([], 0);
      expect(alerts).toEqual([]);
    });

    it("returns empty array when all conditions are clean", () => {
      const recs = [
        makeRecord({
          staff_id: "s1", discrimination_reported: false,
          eia_outcome: "neutral", equality_training_status: "completed",
          adjustment_status: "in_place",
        }),
        makeRecord({
          staff_id: "s2", discrimination_reported: false,
          eia_outcome: "positive_impact", equality_training_status: "completed",
          adjustment_status: "in_place",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 2);
      expect(alerts).toEqual([]);
    });

    it("returns empty for single clean record with totalStaff=1", () => {
      const recs = [
        makeRecord({
          staff_id: "s1", discrimination_reported: false,
          eia_outcome: "neutral", equality_training_status: "completed",
          adjustment_status: "in_place",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      expect(alerts).toEqual([]);
    });
  });

  // ── discrimination_reported alert ─────────────────────────────────────

  describe("discrimination_reported alert", () => {
    it("fires when discrimination_reported is true", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice", discrimination_reported: true,
          diversity_category: "ethnicity",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "discrimination_reported");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice", discrimination_reported: true,
          diversity_category: "ethnicity",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "discrimination_reported")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses record id as alert id", () => {
      const recs = [
        makeRecord({
          id: "disc-abc-123", staff_name: "Alice", discrimination_reported: true,
          diversity_category: "ethnicity",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "discrimination_reported")!;
      expect(alert.id).toBe("disc-abc-123");
    });

    it("includes staff_name in message", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Bob Johnson", discrimination_reported: true,
          diversity_category: "ethnicity",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "discrimination_reported")!;
      expect(alert.message).toContain("Bob Johnson");
    });

    it("includes category with underscores replaced by spaces", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice", discrimination_reported: true,
          diversity_category: "sexual_orientation",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "discrimination_reported")!;
      expect(alert.message).toContain("sexual orientation");
    });

    it("replaces underscores in religion_belief category", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice", discrimination_reported: true,
          diversity_category: "religion_belief",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "discrimination_reported")!;
      expect(alert.message).toContain("religion belief");
    });

    it("replaces underscores in pregnancy_maternity category", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice", discrimination_reported: true,
          diversity_category: "pregnancy_maternity",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "discrimination_reported")!;
      expect(alert.message).toContain("pregnancy maternity");
    });

    it("replaces underscores in gender_reassignment category", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice", discrimination_reported: true,
          diversity_category: "gender_reassignment",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "discrimination_reported")!;
      expect(alert.message).toContain("gender reassignment");
    });

    it("replaces underscores in marital_status category", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice", discrimination_reported: true,
          diversity_category: "marital_status",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "discrimination_reported")!;
      expect(alert.message).toContain("marital status");
    });

    it("replaces underscores in age_group category", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice", discrimination_reported: true,
          diversity_category: "age_group",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "discrimination_reported")!;
      expect(alert.message).toContain("age group");
    });

    it("uses discrimination_details when provided", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice", discrimination_reported: true,
          diversity_category: "ethnicity",
          discrimination_details: "Racial slur used during meeting",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "discrimination_reported")!;
      expect(alert.message).toContain("Racial slur used during meeting");
    });

    it("uses fallback message when discrimination_details is null", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice", discrimination_reported: true,
          diversity_category: "ethnicity",
          discrimination_details: null,
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "discrimination_reported")!;
      expect(alert.message).toContain("investigate and take action");
    });

    it("creates one alert per qualifying record", () => {
      const recs = [
        makeRecord({ id: "r1", staff_id: "s1", staff_name: "Alice", discrimination_reported: true, diversity_category: "ethnicity" }),
        makeRecord({ id: "r2", staff_id: "s2", staff_name: "Bob", discrimination_reported: true, diversity_category: "gender" }),
        makeRecord({ id: "r3", staff_id: "s3", staff_name: "Charlie", discrimination_reported: true, diversity_category: "disability" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 3);
      const discAlerts = alerts.filter((a) => a.type === "discrimination_reported");
      expect(discAlerts).toHaveLength(3);
    });

    it("does NOT fire when discrimination_reported is false", () => {
      const recs = [
        makeRecord({ discrimination_reported: false }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "discrimination_reported");
      expect(alert).toBeUndefined();
    });

    it("no underscore category passes through cleanly", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice", discrimination_reported: true,
          diversity_category: "ethnicity",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "discrimination_reported")!;
      expect(alert.message).toContain("ethnicity");
    });
  });

  // ── negative_unmitigated alert ────────────────────────────────────────

  describe("negative_unmitigated alert", () => {
    it("fires when eia_outcome is negative_impact_unmitigated", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice",
          eia_outcome: "negative_impact_unmitigated",
          diversity_category: "disability",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "negative_unmitigated");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice",
          eia_outcome: "negative_impact_unmitigated",
          diversity_category: "disability",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "negative_unmitigated")!;
      expect(alert.severity).toBe("high");
    });

    it("uses record id as alert id", () => {
      const recs = [
        makeRecord({
          id: "neg-xyz-456", staff_name: "Alice",
          eia_outcome: "negative_impact_unmitigated",
          diversity_category: "disability",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "negative_unmitigated")!;
      expect(alert.id).toBe("neg-xyz-456");
    });

    it("includes staff_name in message", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Jane Smith",
          eia_outcome: "negative_impact_unmitigated",
          diversity_category: "disability",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "negative_unmitigated")!;
      expect(alert.message).toContain("Jane Smith");
    });

    it("includes category with underscores replaced by spaces", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice",
          eia_outcome: "negative_impact_unmitigated",
          diversity_category: "sexual_orientation",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "negative_unmitigated")!;
      expect(alert.message).toContain("sexual orientation");
    });

    it("includes guidance about mitigation plan", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice",
          eia_outcome: "negative_impact_unmitigated",
          diversity_category: "disability",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "negative_unmitigated")!;
      expect(alert.message).toContain("develop mitigation plan");
    });

    it("creates one alert per qualifying record", () => {
      const recs = [
        makeRecord({ id: "r1", staff_id: "s1", staff_name: "Alice", eia_outcome: "negative_impact_unmitigated", diversity_category: "ethnicity" }),
        makeRecord({ id: "r2", staff_id: "s2", staff_name: "Bob", eia_outcome: "negative_impact_unmitigated", diversity_category: "gender" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 2);
      const negAlerts = alerts.filter((a) => a.type === "negative_unmitigated");
      expect(negAlerts).toHaveLength(2);
    });

    it("does NOT fire for negative_impact_mitigated", () => {
      const recs = [
        makeRecord({ eia_outcome: "negative_impact_mitigated" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "negative_unmitigated");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire for neutral", () => {
      const recs = [
        makeRecord({ eia_outcome: "neutral" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "negative_unmitigated");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire for positive_impact", () => {
      const recs = [
        makeRecord({ eia_outcome: "positive_impact" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "negative_unmitigated");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire for not_assessed", () => {
      const recs = [
        makeRecord({ eia_outcome: "not_assessed" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "negative_unmitigated");
      expect(alert).toBeUndefined();
    });
  });

  // ── training_overdue alert ────────────────────────────────────────────

  describe("training_overdue alert", () => {
    it("fires when overdue count >= 2", () => {
      const recs = [
        makeRecord({ equality_training_status: "overdue", staff_id: "s1" }),
        makeRecord({ equality_training_status: "overdue", staff_id: "s2" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "training_overdue");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const recs = [
        makeRecord({ equality_training_status: "overdue", staff_id: "s1" }),
        makeRecord({ equality_training_status: "overdue", staff_id: "s2" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "training_overdue")!;
      expect(alert.severity).toBe("high");
    });

    it("has id 'training_overdue'", () => {
      const recs = [
        makeRecord({ equality_training_status: "overdue", staff_id: "s1" }),
        makeRecord({ equality_training_status: "overdue", staff_id: "s2" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "training_overdue")!;
      expect(alert.id).toBe("training_overdue");
    });

    it("uses plural 'members have' when count > 1", () => {
      const recs = [
        makeRecord({ equality_training_status: "overdue", staff_id: "s1" }),
        makeRecord({ equality_training_status: "overdue", staff_id: "s2" }),
        makeRecord({ equality_training_status: "overdue", staff_id: "s3" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "training_overdue")!;
      expect(alert.message).toContain("members have");
    });

    it("includes count in message", () => {
      const recs = [
        makeRecord({ equality_training_status: "overdue", staff_id: "s1" }),
        makeRecord({ equality_training_status: "overdue", staff_id: "s2" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "training_overdue")!;
      expect(alert.message).toContain("2");
    });

    it("mentions schedule immediately in message", () => {
      const recs = [
        makeRecord({ equality_training_status: "overdue", staff_id: "s1" }),
        makeRecord({ equality_training_status: "overdue", staff_id: "s2" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "training_overdue")!;
      expect(alert.message).toContain("schedule immediately");
    });

    it("does NOT fire when only 1 record is overdue (threshold >= 2)", () => {
      const recs = [
        makeRecord({ equality_training_status: "overdue" }),
        makeRecord({ equality_training_status: "completed" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "training_overdue");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire when no records are overdue", () => {
      const recs = [
        makeRecord({ equality_training_status: "completed" }),
        makeRecord({ equality_training_status: "in_progress" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "training_overdue");
      expect(alert).toBeUndefined();
    });

    it("fires at exact threshold of 2", () => {
      const recs = [
        makeRecord({ equality_training_status: "overdue", staff_id: "s1" }),
        makeRecord({ equality_training_status: "overdue", staff_id: "s2" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "training_overdue");
      expect(alert).toBeDefined();
    });

    it("only produces one alert regardless of overdue count", () => {
      const recs = [
        makeRecord({ equality_training_status: "overdue", staff_id: "s1" }),
        makeRecord({ equality_training_status: "overdue", staff_id: "s2" }),
        makeRecord({ equality_training_status: "overdue", staff_id: "s3" }),
        makeRecord({ equality_training_status: "overdue", staff_id: "s4" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 4);
      const overdueAlerts = alerts.filter((a) => a.type === "training_overdue");
      expect(overdueAlerts).toHaveLength(1);
    });

    it("does not count refresher_due as overdue for the alert", () => {
      const recs = [
        makeRecord({ equality_training_status: "refresher_due" }),
        makeRecord({ equality_training_status: "refresher_due" }),
        makeRecord({ equality_training_status: "refresher_due" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "training_overdue");
      expect(alert).toBeUndefined();
    });

    it("does not count not_started as overdue for the alert", () => {
      const recs = [
        makeRecord({ equality_training_status: "not_started" }),
        makeRecord({ equality_training_status: "not_started" }),
        makeRecord({ equality_training_status: "not_started" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "training_overdue");
      expect(alert).toBeUndefined();
    });
  });

  // ── adjustments_pending alert ─────────────────────────────────────────

  describe("adjustments_pending alert", () => {
    it("fires when requested count >= 1", () => {
      const recs = [
        makeRecord({ adjustment_status: "requested" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "adjustments_pending");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const recs = [
        makeRecord({ adjustment_status: "requested" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "adjustments_pending")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id 'adjustments_pending'", () => {
      const recs = [
        makeRecord({ adjustment_status: "requested" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "adjustments_pending")!;
      expect(alert.id).toBe("adjustments_pending");
    });

    it("uses singular 'adjustment has' when count is 1", () => {
      const recs = [
        makeRecord({ adjustment_status: "requested" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "adjustments_pending")!;
      expect(alert.message).toContain("adjustment has");
    });

    it("uses plural 'adjustments have' when count > 1", () => {
      const recs = [
        makeRecord({ adjustment_status: "requested", staff_id: "s1" }),
        makeRecord({ adjustment_status: "requested", staff_id: "s2" }),
        makeRecord({ adjustment_status: "requested", staff_id: "s3" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "adjustments_pending")!;
      expect(alert.message).toContain("adjustments have");
    });

    it("includes count in message", () => {
      const recs = [
        makeRecord({ adjustment_status: "requested", staff_id: "s1" }),
        makeRecord({ adjustment_status: "requested", staff_id: "s2" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "adjustments_pending")!;
      expect(alert.message).toContain("2");
    });

    it("mentions Equality Act 2010 in message", () => {
      const recs = [
        makeRecord({ adjustment_status: "requested" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "adjustments_pending")!;
      expect(alert.message).toContain("Equality Act 2010");
    });

    it("does NOT fire when no adjustments are requested", () => {
      const recs = [
        makeRecord({ adjustment_status: "in_place" }),
        makeRecord({ adjustment_status: "under_review" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "adjustments_pending");
      expect(alert).toBeUndefined();
    });

    it("does not count under_review as requested for the alert", () => {
      const recs = [
        makeRecord({ adjustment_status: "under_review" }),
        makeRecord({ adjustment_status: "under_review" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "adjustments_pending");
      expect(alert).toBeUndefined();
    });

    it("does not count denied as requested for the alert", () => {
      const recs = [
        makeRecord({ adjustment_status: "denied" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "adjustments_pending");
      expect(alert).toBeUndefined();
    });

    it("does not count no_longer_needed as requested for the alert", () => {
      const recs = [
        makeRecord({ adjustment_status: "no_longer_needed" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "adjustments_pending");
      expect(alert).toBeUndefined();
    });

    it("only produces one alert regardless of requested count", () => {
      const recs = [
        makeRecord({ adjustment_status: "requested", staff_id: "s1" }),
        makeRecord({ adjustment_status: "requested", staff_id: "s2" }),
        makeRecord({ adjustment_status: "requested", staff_id: "s3" }),
        makeRecord({ adjustment_status: "requested", staff_id: "s4" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 4);
      const pendingAlerts = alerts.filter((a) => a.type === "adjustments_pending");
      expect(pendingAlerts).toHaveLength(1);
    });
  });

  // ── low_coverage alert ────────────────────────────────────────────────

  describe("low_coverage alert", () => {
    it("fires when gap exists between totalStaff and covered staff", () => {
      const recs = [makeRecord({ staff_id: "s1" })];
      const alerts = identifyDiversityAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "low_coverage");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const recs = [makeRecord({ staff_id: "s1" })];
      const alerts = identifyDiversityAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "low_coverage")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id 'low_coverage'", () => {
      const recs = [makeRecord({ staff_id: "s1" })];
      const alerts = identifyDiversityAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "low_coverage")!;
      expect(alert.id).toBe("low_coverage");
    });

    it("uses singular 'member has' when gap is 1", () => {
      const recs = [makeRecord({ staff_id: "s1" })];
      const alerts = identifyDiversityAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "low_coverage")!;
      expect(alert.message).toContain("member has");
    });

    it("uses plural 'members have' when gap > 1", () => {
      const recs = [makeRecord({ staff_id: "s1" })];
      const alerts = identifyDiversityAlerts(recs, 4);
      const alert = alerts.find((a) => a.type === "low_coverage")!;
      expect(alert.message).toContain("members have");
    });

    it("includes gap count in message", () => {
      const recs = [makeRecord({ staff_id: "s1" })];
      const alerts = identifyDiversityAlerts(recs, 6);
      const alert = alerts.find((a) => a.type === "low_coverage")!;
      expect(alert.message).toContain("5");
    });

    it("mentions ensuring all staff are included", () => {
      const recs = [makeRecord({ staff_id: "s1" })];
      const alerts = identifyDiversityAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "low_coverage")!;
      expect(alert.message).toContain("ensure all staff are included");
    });

    it("does NOT fire when all staff have records", () => {
      const recs = [
        makeRecord({ staff_id: "s1" }),
        makeRecord({ staff_id: "s2" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "low_coverage");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire when totalStaff is 0", () => {
      const alerts = identifyDiversityAlerts([], 0);
      const alert = alerts.find((a) => a.type === "low_coverage");
      expect(alert).toBeUndefined();
    });

    it("fires when no records and totalStaff > 0", () => {
      const alerts = identifyDiversityAlerts([], 5);
      const alert = alerts.find((a) => a.type === "low_coverage")!;
      expect(alert).toBeDefined();
      expect(alert.message).toContain("5");
    });

    it("deduplicates staff when same staff has multiple records", () => {
      const recs = [
        makeRecord({ staff_id: "s1" }),
        makeRecord({ staff_id: "s1" }),
        makeRecord({ staff_id: "s1" }),
      ];
      const alerts = identifyDiversityAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "low_coverage")!;
      expect(alert.message).toContain("2");
    });

    it("only produces one alert regardless of gap size", () => {
      const recs = [makeRecord({ staff_id: "s1" })];
      const alerts = identifyDiversityAlerts(recs, 10);
      const coverageAlerts = alerts.filter((a) => a.type === "low_coverage");
      expect(coverageAlerts).toHaveLength(1);
    });
  });

  // ── Combined alerts ───────────────────────────────────────────────────

  describe("combined alerts", () => {
    it("can return all 5 alert types simultaneously", () => {
      const recs = [
        // discrimination_reported (critical)
        makeRecord({
          id: "r1", staff_id: "s1", staff_name: "Alice",
          discrimination_reported: true, diversity_category: "ethnicity",
          discrimination_details: "Verbal harassment",
          equality_training_status: "overdue",
          adjustment_status: "requested",
          eia_outcome: "negative_impact_unmitigated",
        }),
        // another overdue to meet threshold >= 2
        makeRecord({
          id: "r2", staff_id: "s2", staff_name: "Bob",
          discrimination_reported: false,
          equality_training_status: "overdue",
          adjustment_status: "in_place",
          eia_outcome: "neutral",
        }),
      ];
      // totalStaff = 5 => gap = 3 => low_coverage
      const alerts = identifyDiversityAlerts(recs, 5);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("discrimination_reported");
      expect(types).toContain("negative_unmitigated");
      expect(types).toContain("training_overdue");
      expect(types).toContain("adjustments_pending");
      expect(types).toContain("low_coverage");
    });

    it("returns correct total count when all alert types fire", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_id: "s1", staff_name: "Alice",
          discrimination_reported: true, diversity_category: "ethnicity",
          equality_training_status: "overdue",
          adjustment_status: "requested",
          eia_outcome: "negative_impact_unmitigated",
        }),
        makeRecord({
          id: "r2", staff_id: "s2", staff_name: "Bob",
          discrimination_reported: false,
          equality_training_status: "overdue",
          adjustment_status: "in_place",
          eia_outcome: "neutral",
        }),
      ];
      // discrimination_reported(1) + negative_unmitigated(1) + training_overdue(1) + adjustments_pending(1) + low_coverage(1) = 5
      const alerts = identifyDiversityAlerts(recs, 5);
      expect(alerts.length).toBe(5);
    });

    it("multiple discrimination per-record alerts plus aggregate alerts", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_id: "s1", staff_name: "Alice",
          discrimination_reported: true, diversity_category: "ethnicity",
          equality_training_status: "overdue",
          adjustment_status: "requested",
        }),
        makeRecord({
          id: "r2", staff_id: "s2", staff_name: "Bob",
          discrimination_reported: true, diversity_category: "disability",
          equality_training_status: "overdue",
          adjustment_status: "requested",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 5);
      const discAlerts = alerts.filter((a) => a.type === "discrimination_reported");
      expect(discAlerts).toHaveLength(2);
      const trainingAlert = alerts.find((a) => a.type === "training_overdue");
      expect(trainingAlert).toBeDefined();
      const adjAlert = alerts.find((a) => a.type === "adjustments_pending");
      expect(adjAlert).toBeDefined();
      const covAlert = alerts.find((a) => a.type === "low_coverage");
      expect(covAlert).toBeDefined();
    });
  });

  // ── Alert structure ───────────────────────────────────────────────────

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice", staff_id: "s1",
          discrimination_reported: true, diversity_category: "ethnicity",
          eia_outcome: "negative_impact_unmitigated",
          equality_training_status: "overdue",
          adjustment_status: "requested",
        }),
        makeRecord({
          id: "r2", staff_id: "s2",
          equality_training_status: "overdue",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 5);
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
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice", staff_id: "s1",
          discrimination_reported: true, diversity_category: "ethnicity",
          eia_outcome: "negative_impact_unmitigated",
          equality_training_status: "overdue",
          adjustment_status: "requested",
        }),
        makeRecord({
          id: "r2", staff_id: "s2",
          equality_training_status: "overdue",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 5);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("alert type strings are non-empty", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice", staff_id: "s1",
          discrimination_reported: true, diversity_category: "ethnicity",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 3);
      for (const alert of alerts) {
        expect(alert.type.length).toBeGreaterThan(0);
      }
    });

    it("alert message strings are non-empty", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice", staff_id: "s1",
          discrimination_reported: true, diversity_category: "ethnicity",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 3);
      for (const alert of alerts) {
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });

    it("alert id strings are non-empty", () => {
      const recs = [
        makeRecord({
          id: "r1", staff_name: "Alice", staff_id: "s1",
          discrimination_reported: true, diversity_category: "ethnicity",
        }),
      ];
      const alerts = identifyDiversityAlerts(recs, 3);
      for (const alert of alerts) {
        expect(alert.id.length).toBeGreaterThan(0);
      }
    });
  });
});
