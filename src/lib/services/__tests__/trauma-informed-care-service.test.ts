// ══════════════════════════════════════════════════════════════════════════════
// CARA — TRAUMA-INFORMED CARE SERVICE TESTS
// Pure-function unit tests for trauma metrics computation,
// alert identification, constant validation.
// CHR 2015 Reg 6 (quality and purpose of care — therapeutic care),
// Reg 14 (care planning — trauma-informed approach),
// Reg 16 (providing suitable staff — TIC training).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { todayStr } from "@/lib/utils";
import {
  _testing,
  TRAUMA_TYPES,
  THERAPEUTIC_MODELS,
  TIC_COMPETENCIES,
  RECOVERY_PROGRESS_RATINGS,
} from "../trauma-informed-care-service";

import type {
  TraumaRecord,
  TraumaType,
  TherapeuticModel,
  TicCompetency,
  RecoveryProgress,
} from "../trauma-informed-care-service";

const { computeTraumaMetrics, identifyTraumaAlerts } = _testing;

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
  const d = new Date(todayStr());
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Build a minimal TraumaRecord with sensible defaults. */
function makeRecord(
  overrides?: Partial<TraumaRecord>,
): TraumaRecord {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    child_name: "Child A",
    child_id: "child-1",
    assessment_date: daysAgo(5),
    trauma_types: ["neglect"],
    aces_score: "aces_score" in (overrides ?? {}) ? (overrides!.aces_score ?? null) : 3,
    therapeutic_model: "pace",
    recovery_progress: "stable",
    tic_competency: "competent",
    staff_trained_percentage: 80,
    therapeutic_environment_score: "therapeutic_environment_score" in (overrides ?? {}) ? (overrides!.therapeutic_environment_score ?? null) : 7,
    key_triggers: ["loud noises"],
    calming_strategies: ["deep breathing"],
    therapist_involved: true,
    therapist_name: "therapist_name" in (overrides ?? {}) ? (overrides!.therapist_name ?? null) : "Dr Smith",
    child_engaged_in_therapy: true,
    trauma_informed_plan_in_place: true,
    staff_aware_of_triggers: true,
    review_date: "review_date" in (overrides ?? {}) ? (overrides!.review_date ?? null) : futureDateISO(30),
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: daysAgoISO(5),
    updated_at: daysAgoISO(5),
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("TRAUMA_TYPES", () => {
  it("contains exactly 13 entries", () => {
    expect(TRAUMA_TYPES).toHaveLength(13);
  });

  it("every entry has a non-empty type string", () => {
    for (const t of TRAUMA_TYPES) {
      expect(typeof t.type).toBe("string");
      expect(t.type.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const t of TRAUMA_TYPES) {
      expect(typeof t.label).toBe("string");
      expect(t.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate types", () => {
    const types = TRAUMA_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("has no duplicate labels", () => {
    const labels = TRAUMA_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected types", () => {
    const types = TRAUMA_TYPES.map((t) => t.type);
    const expected: TraumaType[] = [
      "physical_abuse", "sexual_abuse", "emotional_abuse", "neglect",
      "domestic_violence", "parental_substance_misuse", "parental_mental_health",
      "bereavement", "separation_loss", "community_violence",
      "institutional_abuse", "multiple_placements", "other",
    ];
    for (const e of expected) {
      expect(types).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const t of TRAUMA_TYPES) {
      expect(t.label[0]).toBe(t.label[0].toUpperCase());
    }
  });

  it("includes physical_abuse", () => {
    expect(TRAUMA_TYPES.map((t) => t.type)).toContain("physical_abuse");
  });

  it("includes sexual_abuse", () => {
    expect(TRAUMA_TYPES.map((t) => t.type)).toContain("sexual_abuse");
  });

  it("includes emotional_abuse", () => {
    expect(TRAUMA_TYPES.map((t) => t.type)).toContain("emotional_abuse");
  });

  it("includes neglect", () => {
    expect(TRAUMA_TYPES.map((t) => t.type)).toContain("neglect");
  });

  it("includes domestic_violence", () => {
    expect(TRAUMA_TYPES.map((t) => t.type)).toContain("domestic_violence");
  });

  it("includes bereavement", () => {
    expect(TRAUMA_TYPES.map((t) => t.type)).toContain("bereavement");
  });
});

describe("THERAPEUTIC_MODELS", () => {
  it("contains exactly 13 entries", () => {
    expect(THERAPEUTIC_MODELS).toHaveLength(13);
  });

  it("every entry has a non-empty model string", () => {
    for (const m of THERAPEUTIC_MODELS) {
      expect(typeof m.model).toBe("string");
      expect(m.model.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const m of THERAPEUTIC_MODELS) {
      expect(typeof m.label).toBe("string");
      expect(m.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate models", () => {
    const models = THERAPEUTIC_MODELS.map((m) => m.model);
    expect(new Set(models).size).toBe(models.length);
  });

  it("has no duplicate labels", () => {
    const labels = THERAPEUTIC_MODELS.map((m) => m.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected models", () => {
    const models = THERAPEUTIC_MODELS.map((m) => m.model);
    const expected: TherapeuticModel[] = [
      "pace", "dan_hughes", "theraplay", "dyrr", "sensory_integration",
      "cbt", "emdr", "art_therapy", "play_therapy", "life_story_work",
      "dbt", "psychodynamic", "other",
    ];
    for (const e of expected) {
      expect(models).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const m of THERAPEUTIC_MODELS) {
      expect(m.label[0]).toBe(m.label[0].toUpperCase());
    }
  });

  it("includes pace", () => {
    expect(THERAPEUTIC_MODELS.map((m) => m.model)).toContain("pace");
  });

  it("includes cbt", () => {
    expect(THERAPEUTIC_MODELS.map((m) => m.model)).toContain("cbt");
  });

  it("includes emdr", () => {
    expect(THERAPEUTIC_MODELS.map((m) => m.model)).toContain("emdr");
  });
});

describe("TIC_COMPETENCIES", () => {
  it("contains exactly 5 entries", () => {
    expect(TIC_COMPETENCIES).toHaveLength(5);
  });

  it("every entry has a non-empty competency string", () => {
    for (const c of TIC_COMPETENCIES) {
      expect(typeof c.competency).toBe("string");
      expect(c.competency.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const c of TIC_COMPETENCIES) {
      expect(typeof c.label).toBe("string");
      expect(c.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate competencies", () => {
    const competencies = TIC_COMPETENCIES.map((c) => c.competency);
    expect(new Set(competencies).size).toBe(competencies.length);
  });

  it("has no duplicate labels", () => {
    const labels = TIC_COMPETENCIES.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected competencies", () => {
    const competencies = TIC_COMPETENCIES.map((c) => c.competency);
    const expected: TicCompetency[] = [
      "advanced", "competent", "developing", "awareness", "not_trained",
    ];
    for (const e of expected) {
      expect(competencies).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const c of TIC_COMPETENCIES) {
      expect(c.label[0]).toBe(c.label[0].toUpperCase());
    }
  });
});

describe("RECOVERY_PROGRESS_RATINGS", () => {
  it("contains exactly 5 entries", () => {
    expect(RECOVERY_PROGRESS_RATINGS).toHaveLength(5);
  });

  it("every entry has a non-empty progress string", () => {
    for (const r of RECOVERY_PROGRESS_RATINGS) {
      expect(typeof r.progress).toBe("string");
      expect(r.progress.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const r of RECOVERY_PROGRESS_RATINGS) {
      expect(typeof r.label).toBe("string");
      expect(r.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate progress values", () => {
    const progresses = RECOVERY_PROGRESS_RATINGS.map((r) => r.progress);
    expect(new Set(progresses).size).toBe(progresses.length);
  });

  it("has no duplicate labels", () => {
    const labels = RECOVERY_PROGRESS_RATINGS.map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected progress values", () => {
    const progresses = RECOVERY_PROGRESS_RATINGS.map((r) => r.progress);
    const expected: RecoveryProgress[] = [
      "significant_improvement", "some_improvement", "stable",
      "deteriorating", "not_assessed",
    ];
    for (const e of expected) {
      expect(progresses).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const r of RECOVERY_PROGRESS_RATINGS) {
      expect(r.label[0]).toBe(r.label[0].toUpperCase());
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeTraumaMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeTraumaMetrics", () => {
  // ── Empty records ──────────────────────────────────────────────────────────

  describe("empty records", () => {
    it("returns total_records = 0", () => {
      const m = computeTraumaMetrics([], 5);
      expect(m.total_records).toBe(0);
    });

    it("returns children_assessed = 0", () => {
      const m = computeTraumaMetrics([], 5);
      expect(m.children_assessed).toBe(0);
    });

    it("returns assessment_coverage = 0 when totalChildren > 0", () => {
      const m = computeTraumaMetrics([], 5);
      expect(m.assessment_coverage).toBe(0);
    });

    it("returns assessment_coverage = 0 when totalChildren = 0", () => {
      const m = computeTraumaMetrics([], 0);
      expect(m.assessment_coverage).toBeNull();;
    });

    it("returns average_aces_score = 0", () => {
      const m = computeTraumaMetrics([], 5);
      expect(m.average_aces_score).toBeNull();;
    });

    it("returns therapist_involved_rate = 0", () => {
      const m = computeTraumaMetrics([], 5);
      expect(m.therapist_involved_rate).toBeNull();;
    });

    it("returns child_engaged_rate = 0", () => {
      const m = computeTraumaMetrics([], 5);
      expect(m.child_engaged_rate).toBeNull();;
    });

    it("returns plan_in_place_rate = 0", () => {
      const m = computeTraumaMetrics([], 5);
      expect(m.plan_in_place_rate).toBeNull();;
    });

    it("returns staff_aware_rate = 0", () => {
      const m = computeTraumaMetrics([], 5);
      expect(m.staff_aware_rate).toBeNull();;
    });

    it("returns average_staff_trained = 0", () => {
      const m = computeTraumaMetrics([], 5);
      expect(m.average_staff_trained).toBeNull();;
    });

    it("returns significant_improvement_count = 0", () => {
      const m = computeTraumaMetrics([], 5);
      expect(m.significant_improvement_count).toBe(0);
    });

    it("returns some_improvement_count = 0", () => {
      const m = computeTraumaMetrics([], 5);
      expect(m.some_improvement_count).toBe(0);
    });

    it("returns stable_count = 0", () => {
      const m = computeTraumaMetrics([], 5);
      expect(m.stable_count).toBe(0);
    });

    it("returns deteriorating_count = 0", () => {
      const m = computeTraumaMetrics([], 5);
      expect(m.deteriorating_count).toBe(0);
    });

    it("returns review_overdue_count = 0", () => {
      const m = computeTraumaMetrics([], 5);
      expect(m.review_overdue_count).toBe(0);
    });

    it("returns empty by_trauma_type", () => {
      const m = computeTraumaMetrics([], 5);
      expect(m.by_trauma_type).toEqual({});
    });

    it("returns empty by_therapeutic_model", () => {
      const m = computeTraumaMetrics([], 5);
      expect(m.by_therapeutic_model).toEqual({});
    });

    it("returns empty by_tic_competency", () => {
      const m = computeTraumaMetrics([], 5);
      expect(m.by_tic_competency).toEqual({});
    });

    it("returns empty by_recovery_progress", () => {
      const m = computeTraumaMetrics([], 5);
      expect(m.by_recovery_progress).toEqual({});
    });
  });

  // ── Single record ────────────────────────────────────────────────────────

  describe("single record", () => {
    const rec = makeRecord({
      child_id: "child-1",
      child_name: "Alice",
      trauma_types: ["physical_abuse"],
      aces_score: 5,
      therapeutic_model: "cbt",
      recovery_progress: "some_improvement",
      tic_competency: "advanced",
      staff_trained_percentage: 90,
      therapist_involved: true,
      child_engaged_in_therapy: true,
      trauma_informed_plan_in_place: true,
      staff_aware_of_triggers: true,
      review_date: futureDateISO(30),
    });

    it("returns total_records = 1", () => {
      const m = computeTraumaMetrics([rec], 4);
      expect(m.total_records).toBe(1);
    });

    it("returns children_assessed = 1", () => {
      const m = computeTraumaMetrics([rec], 4);
      expect(m.children_assessed).toBe(1);
    });

    it("calculates assessment_coverage correctly (1 of 4 = 25%)", () => {
      const m = computeTraumaMetrics([rec], 4);
      expect(m.assessment_coverage).toBe(25);
    });

    it("returns average_aces_score = 5", () => {
      const m = computeTraumaMetrics([rec], 4);
      expect(m.average_aces_score).toBe(5);
    });

    it("returns therapist_involved_rate = 100", () => {
      const m = computeTraumaMetrics([rec], 4);
      expect(m.therapist_involved_rate).toBe(100);
    });

    it("returns child_engaged_rate = 100", () => {
      const m = computeTraumaMetrics([rec], 4);
      expect(m.child_engaged_rate).toBe(100);
    });

    it("returns plan_in_place_rate = 100", () => {
      const m = computeTraumaMetrics([rec], 4);
      expect(m.plan_in_place_rate).toBe(100);
    });

    it("returns staff_aware_rate = 100", () => {
      const m = computeTraumaMetrics([rec], 4);
      expect(m.staff_aware_rate).toBe(100);
    });

    it("returns average_staff_trained = 90", () => {
      const m = computeTraumaMetrics([rec], 4);
      expect(m.average_staff_trained).toBe(90);
    });

    it("returns some_improvement_count = 1", () => {
      const m = computeTraumaMetrics([rec], 4);
      expect(m.some_improvement_count).toBe(1);
    });

    it("returns significant_improvement_count = 0", () => {
      const m = computeTraumaMetrics([rec], 4);
      expect(m.significant_improvement_count).toBe(0);
    });

    it("returns stable_count = 0", () => {
      const m = computeTraumaMetrics([rec], 4);
      expect(m.stable_count).toBe(0);
    });

    it("returns deteriorating_count = 0", () => {
      const m = computeTraumaMetrics([rec], 4);
      expect(m.deteriorating_count).toBe(0);
    });

    it("returns review_overdue_count = 0 for future review_date", () => {
      const m = computeTraumaMetrics([rec], 4);
      expect(m.review_overdue_count).toBe(0);
    });

    it("by_trauma_type has single entry for physical_abuse", () => {
      const m = computeTraumaMetrics([rec], 4);
      expect(m.by_trauma_type).toEqual({ physical_abuse: 1 });
    });

    it("by_therapeutic_model has single entry for cbt", () => {
      const m = computeTraumaMetrics([rec], 4);
      expect(m.by_therapeutic_model).toEqual({ cbt: 1 });
    });

    it("by_tic_competency has single entry for advanced", () => {
      const m = computeTraumaMetrics([rec], 4);
      expect(m.by_tic_competency).toEqual({ advanced: 1 });
    });

    it("by_recovery_progress has single entry for some_improvement", () => {
      const m = computeTraumaMetrics([rec], 4);
      expect(m.by_recovery_progress).toEqual({ some_improvement: 1 });
    });
  });

  // ── Multiple records ──────────────────────────────────────────────────────

  describe("multiple records", () => {
    const records = [
      makeRecord({
        child_id: "c1", child_name: "Alice",
        trauma_types: ["physical_abuse", "neglect"],
        aces_score: 6, therapeutic_model: "pace",
        recovery_progress: "significant_improvement",
        tic_competency: "advanced", staff_trained_percentage: 100,
        therapist_involved: true, child_engaged_in_therapy: true,
        trauma_informed_plan_in_place: true, staff_aware_of_triggers: true,
        review_date: futureDateISO(10),
      }),
      makeRecord({
        child_id: "c2", child_name: "Bob",
        trauma_types: ["sexual_abuse"],
        aces_score: 4, therapeutic_model: "emdr",
        recovery_progress: "some_improvement",
        tic_competency: "competent", staff_trained_percentage: 80,
        therapist_involved: true, child_engaged_in_therapy: false,
        trauma_informed_plan_in_place: true, staff_aware_of_triggers: true,
        review_date: futureDateISO(20),
      }),
      makeRecord({
        child_id: "c3", child_name: "Charlie",
        trauma_types: ["emotional_abuse", "domestic_violence"],
        aces_score: 8, therapeutic_model: "cbt",
        recovery_progress: "stable",
        tic_competency: "developing", staff_trained_percentage: 60,
        therapist_involved: false, child_engaged_in_therapy: false,
        trauma_informed_plan_in_place: false, staff_aware_of_triggers: false,
        review_date: daysAgo(5),
      }),
      makeRecord({
        child_id: "c4", child_name: "Dana",
        trauma_types: ["bereavement"],
        aces_score: 2, therapeutic_model: "art_therapy",
        recovery_progress: "deteriorating",
        tic_competency: "awareness", staff_trained_percentage: 40,
        therapist_involved: false, child_engaged_in_therapy: true,
        trauma_informed_plan_in_place: true, staff_aware_of_triggers: true,
        review_date: daysAgo(10),
      }),
      makeRecord({
        child_id: "c5", child_name: "Eve",
        trauma_types: ["neglect", "separation_loss"],
        aces_score: null, therapeutic_model: "pace",
        recovery_progress: "not_assessed",
        tic_competency: "not_trained", staff_trained_percentage: 20,
        therapist_involved: true, child_engaged_in_therapy: false,
        trauma_informed_plan_in_place: false, staff_aware_of_triggers: false,
        review_date: null,
      }),
    ];

    it("returns total_records = 5", () => {
      const m = computeTraumaMetrics(records, 8);
      expect(m.total_records).toBe(5);
    });

    it("returns children_assessed = 5", () => {
      const m = computeTraumaMetrics(records, 8);
      expect(m.children_assessed).toBe(5);
    });

    it("calculates assessment_coverage correctly (5 of 8 = 62.5%)", () => {
      const m = computeTraumaMetrics(records, 8);
      expect(m.assessment_coverage).toBe(62.5);
    });

    it("calculates average_aces_score excluding null (mean of 6,4,8,2 = 5)", () => {
      const m = computeTraumaMetrics(records, 8);
      expect(m.average_aces_score).toBe(5);
    });

    it("calculates therapist_involved_rate (3 of 5 = 60%)", () => {
      const m = computeTraumaMetrics(records, 8);
      expect(m.therapist_involved_rate).toBe(60);
    });

    it("calculates child_engaged_rate (2 of 5 = 40%)", () => {
      const m = computeTraumaMetrics(records, 8);
      expect(m.child_engaged_rate).toBe(40);
    });

    it("calculates plan_in_place_rate (3 of 5 = 60%)", () => {
      const m = computeTraumaMetrics(records, 8);
      expect(m.plan_in_place_rate).toBe(60);
    });

    it("calculates staff_aware_rate (3 of 5 = 60%)", () => {
      const m = computeTraumaMetrics(records, 8);
      expect(m.staff_aware_rate).toBe(60);
    });

    it("calculates average_staff_trained ((100+80+60+40+20)/5 = 60)", () => {
      const m = computeTraumaMetrics(records, 8);
      expect(m.average_staff_trained).toBe(60);
    });

    it("counts significant_improvement_count = 1", () => {
      const m = computeTraumaMetrics(records, 8);
      expect(m.significant_improvement_count).toBe(1);
    });

    it("counts some_improvement_count = 1", () => {
      const m = computeTraumaMetrics(records, 8);
      expect(m.some_improvement_count).toBe(1);
    });

    it("counts stable_count = 1", () => {
      const m = computeTraumaMetrics(records, 8);
      expect(m.stable_count).toBe(1);
    });

    it("counts deteriorating_count = 1", () => {
      const m = computeTraumaMetrics(records, 8);
      expect(m.deteriorating_count).toBe(1);
    });

    it("counts review_overdue_count = 2 (two past dates)", () => {
      const m = computeTraumaMetrics(records, 8);
      expect(m.review_overdue_count).toBe(2);
    });

    it("groups by_trauma_type correctly (array items expand)", () => {
      const m = computeTraumaMetrics(records, 8);
      expect(m.by_trauma_type).toEqual({
        physical_abuse: 1,
        neglect: 2,
        sexual_abuse: 1,
        emotional_abuse: 1,
        domestic_violence: 1,
        bereavement: 1,
        separation_loss: 1,
      });
    });

    it("groups by_therapeutic_model correctly", () => {
      const m = computeTraumaMetrics(records, 8);
      expect(m.by_therapeutic_model).toEqual({
        pace: 2, emdr: 1, cbt: 1, art_therapy: 1,
      });
    });

    it("groups by_tic_competency correctly", () => {
      const m = computeTraumaMetrics(records, 8);
      expect(m.by_tic_competency).toEqual({
        advanced: 1, competent: 1, developing: 1, awareness: 1, not_trained: 1,
      });
    });

    it("groups by_recovery_progress correctly", () => {
      const m = computeTraumaMetrics(records, 8);
      expect(m.by_recovery_progress).toEqual({
        significant_improvement: 1, some_improvement: 1,
        stable: 1, deteriorating: 1, not_assessed: 1,
      });
    });
  });

  // ── assessment_coverage edge cases ────────────────────────────────────────

  describe("assessment_coverage edge cases", () => {
    it("returns 0 when totalChildren = 0", () => {
      const recs = [makeRecord()];
      const m = computeTraumaMetrics(recs, 0);
      expect(m.assessment_coverage).toBeNull();;
    });

    it("returns 100 when all children assessed", () => {
      const recs = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c2" }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.assessment_coverage).toBe(100);
    });

    it("deduplicates children by child_id", () => {
      const recs = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
      ];
      const m = computeTraumaMetrics(recs, 3);
      expect(m.children_assessed).toBe(1);
      expect(m.assessment_coverage).toBe(33.3);
    });

    it("rounds coverage to 1 decimal place (1 of 3 = 33.3%)", () => {
      const recs = [makeRecord({ child_id: "c1" })];
      const m = computeTraumaMetrics(recs, 3);
      expect(m.assessment_coverage).toBe(33.3);
    });

    it("rounds coverage correctly (2 of 3 = 66.7%)", () => {
      const recs = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c2" }),
      ];
      const m = computeTraumaMetrics(recs, 3);
      expect(m.assessment_coverage).toBe(66.7);
    });
  });

  // ── average_aces_score ────────────────────────────────────────────────────

  describe("average_aces_score", () => {
    it("only considers records where aces_score !== null", () => {
      const recs = [
        makeRecord({ aces_score: 4 }),
        makeRecord({ aces_score: null }),
        makeRecord({ aces_score: 6 }),
      ];
      const m = computeTraumaMetrics(recs, 3);
      // (4 + 6) / 2 = 5
      expect(m.average_aces_score).toBe(5);
    });

    it("returns 0 when all aces_score values are null", () => {
      const recs = [
        makeRecord({ aces_score: null }),
        makeRecord({ aces_score: null }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.average_aces_score).toBeNull();;
    });

    it("rounds to 1 decimal place", () => {
      const recs = [
        makeRecord({ aces_score: 3 }),
        makeRecord({ aces_score: 4 }),
        makeRecord({ aces_score: 5 }),
      ];
      const m = computeTraumaMetrics(recs, 3);
      // (3 + 4 + 5) / 3 = 4
      expect(m.average_aces_score).toBe(4);
    });

    it("rounds fractional averages correctly (7 / 3 = 2.3)", () => {
      const recs = [
        makeRecord({ aces_score: 2 }),
        makeRecord({ aces_score: 2 }),
        makeRecord({ aces_score: 3 }),
      ];
      const m = computeTraumaMetrics(recs, 3);
      expect(m.average_aces_score).toBe(2.3);
    });

    it("handles single record with aces_score", () => {
      const recs = [makeRecord({ aces_score: 7 })];
      const m = computeTraumaMetrics(recs, 1);
      expect(m.average_aces_score).toBe(7);
    });

    it("handles aces_score of 0", () => {
      const recs = [makeRecord({ aces_score: 0 })];
      const m = computeTraumaMetrics(recs, 1);
      expect(m.average_aces_score).toBe(0);
    });
  });

  // ── therapist_involved_rate ───────────────────────────────────────────────

  describe("therapist_involved_rate", () => {
    it("returns 0 when no therapists involved", () => {
      const recs = [
        makeRecord({ therapist_involved: false }),
        makeRecord({ therapist_involved: false }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.therapist_involved_rate).toBe(0);
    });

    it("returns 100 when all have therapists", () => {
      const recs = [
        makeRecord({ therapist_involved: true }),
        makeRecord({ therapist_involved: true }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.therapist_involved_rate).toBe(100);
    });

    it("rounds to 1 decimal place (1 of 3 = 33.3%)", () => {
      const recs = [
        makeRecord({ therapist_involved: true }),
        makeRecord({ therapist_involved: false }),
        makeRecord({ therapist_involved: false }),
      ];
      const m = computeTraumaMetrics(recs, 3);
      expect(m.therapist_involved_rate).toBe(33.3);
    });
  });

  // ── child_engaged_rate ────────────────────────────────────────────────────

  describe("child_engaged_rate", () => {
    it("returns 0 when no children engaged", () => {
      const recs = [
        makeRecord({ child_engaged_in_therapy: false }),
        makeRecord({ child_engaged_in_therapy: false }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.child_engaged_rate).toBe(0);
    });

    it("returns 100 when all children engaged", () => {
      const recs = [
        makeRecord({ child_engaged_in_therapy: true }),
        makeRecord({ child_engaged_in_therapy: true }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.child_engaged_rate).toBe(100);
    });

    it("rounds to 1 decimal place (2 of 3 = 66.7%)", () => {
      const recs = [
        makeRecord({ child_engaged_in_therapy: true }),
        makeRecord({ child_engaged_in_therapy: true }),
        makeRecord({ child_engaged_in_therapy: false }),
      ];
      const m = computeTraumaMetrics(recs, 3);
      expect(m.child_engaged_rate).toBe(66.7);
    });
  });

  // ── plan_in_place_rate ────────────────────────────────────────────────────

  describe("plan_in_place_rate", () => {
    it("returns 0 when no plans in place", () => {
      const recs = [
        makeRecord({ trauma_informed_plan_in_place: false }),
        makeRecord({ trauma_informed_plan_in_place: false }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.plan_in_place_rate).toBe(0);
    });

    it("returns 100 when all have plans", () => {
      const recs = [
        makeRecord({ trauma_informed_plan_in_place: true }),
        makeRecord({ trauma_informed_plan_in_place: true }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.plan_in_place_rate).toBe(100);
    });

    it("rounds to 1 decimal place (1 of 3 = 33.3%)", () => {
      const recs = [
        makeRecord({ trauma_informed_plan_in_place: true }),
        makeRecord({ trauma_informed_plan_in_place: false }),
        makeRecord({ trauma_informed_plan_in_place: false }),
      ];
      const m = computeTraumaMetrics(recs, 3);
      expect(m.plan_in_place_rate).toBe(33.3);
    });
  });

  // ── staff_aware_rate ──────────────────────────────────────────────────────

  describe("staff_aware_rate", () => {
    it("returns 0 when no staff aware", () => {
      const recs = [
        makeRecord({ staff_aware_of_triggers: false }),
        makeRecord({ staff_aware_of_triggers: false }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.staff_aware_rate).toBe(0);
    });

    it("returns 100 when all staff aware", () => {
      const recs = [
        makeRecord({ staff_aware_of_triggers: true }),
        makeRecord({ staff_aware_of_triggers: true }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.staff_aware_rate).toBe(100);
    });

    it("rounds to 1 decimal place (2 of 3 = 66.7%)", () => {
      const recs = [
        makeRecord({ staff_aware_of_triggers: true }),
        makeRecord({ staff_aware_of_triggers: true }),
        makeRecord({ staff_aware_of_triggers: false }),
      ];
      const m = computeTraumaMetrics(recs, 3);
      expect(m.staff_aware_rate).toBe(66.7);
    });
  });

  // ── average_staff_trained ─────────────────────────────────────────────────

  describe("average_staff_trained", () => {
    it("returns 0 when no records", () => {
      const m = computeTraumaMetrics([], 0);
      expect(m.average_staff_trained).toBeNull();;
    });

    it("returns the value itself for a single record", () => {
      const recs = [makeRecord({ staff_trained_percentage: 75 })];
      const m = computeTraumaMetrics(recs, 1);
      expect(m.average_staff_trained).toBe(75);
    });

    it("rounds to 1 decimal place", () => {
      const recs = [
        makeRecord({ staff_trained_percentage: 33 }),
        makeRecord({ staff_trained_percentage: 33 }),
        makeRecord({ staff_trained_percentage: 34 }),
      ];
      const m = computeTraumaMetrics(recs, 3);
      // (33 + 33 + 34) / 3 = 33.333... -> 33.3
      expect(m.average_staff_trained).toBe(33.3);
    });

    it("handles 100% across all records", () => {
      const recs = [
        makeRecord({ staff_trained_percentage: 100 }),
        makeRecord({ staff_trained_percentage: 100 }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.average_staff_trained).toBe(100);
    });

    it("handles 0% across all records", () => {
      const recs = [
        makeRecord({ staff_trained_percentage: 0 }),
        makeRecord({ staff_trained_percentage: 0 }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.average_staff_trained).toBe(0);
    });

    it("averages varied percentages correctly", () => {
      const recs = [
        makeRecord({ staff_trained_percentage: 10 }),
        makeRecord({ staff_trained_percentage: 90 }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.average_staff_trained).toBe(50);
    });
  });

  // ── Recovery progress counts ──────────────────────────────────────────────

  describe("recovery progress counts", () => {
    it("counts multiple significant_improvement records", () => {
      const recs = [
        makeRecord({ recovery_progress: "significant_improvement" }),
        makeRecord({ recovery_progress: "significant_improvement" }),
        makeRecord({ recovery_progress: "stable" }),
      ];
      const m = computeTraumaMetrics(recs, 3);
      expect(m.significant_improvement_count).toBe(2);
    });

    it("counts multiple some_improvement records", () => {
      const recs = [
        makeRecord({ recovery_progress: "some_improvement" }),
        makeRecord({ recovery_progress: "some_improvement" }),
        makeRecord({ recovery_progress: "some_improvement" }),
      ];
      const m = computeTraumaMetrics(recs, 3);
      expect(m.some_improvement_count).toBe(3);
    });

    it("counts multiple stable records", () => {
      const recs = [
        makeRecord({ recovery_progress: "stable" }),
        makeRecord({ recovery_progress: "stable" }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.stable_count).toBe(2);
    });

    it("counts multiple deteriorating records", () => {
      const recs = [
        makeRecord({ recovery_progress: "deteriorating" }),
        makeRecord({ recovery_progress: "deteriorating" }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.deteriorating_count).toBe(2);
    });

    it("does not count not_assessed in any progress bucket", () => {
      const recs = [
        makeRecord({ recovery_progress: "not_assessed" }),
      ];
      const m = computeTraumaMetrics(recs, 1);
      expect(m.significant_improvement_count).toBe(0);
      expect(m.some_improvement_count).toBe(0);
      expect(m.stable_count).toBe(0);
      expect(m.deteriorating_count).toBe(0);
    });
  });

  // ── review_overdue_count ──────────────────────────────────────────────────

  describe("review_overdue_count", () => {
    it("counts records with past review_date as overdue", () => {
      const recs = [
        makeRecord({ review_date: daysAgo(1) }),
        makeRecord({ review_date: daysAgo(30) }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.review_overdue_count).toBe(2);
    });

    it("does not count records with future review_date", () => {
      const recs = [
        makeRecord({ review_date: futureDateISO(1) }),
        makeRecord({ review_date: futureDateISO(30) }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.review_overdue_count).toBe(0);
    });

    it("does not count records with null review_date", () => {
      const recs = [
        makeRecord({ review_date: null }),
        makeRecord({ review_date: null }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.review_overdue_count).toBe(0);
    });

    it("mixes overdue, future, and null correctly", () => {
      const recs = [
        makeRecord({ review_date: daysAgo(5) }),
        makeRecord({ review_date: futureDateISO(5) }),
        makeRecord({ review_date: null }),
      ];
      const m = computeTraumaMetrics(recs, 3);
      expect(m.review_overdue_count).toBe(1);
    });
  });

  // ── by_trauma_type ────────────────────────────────────────────────────────

  describe("by_trauma_type", () => {
    it("expands array items so a record with 2 types adds 1 to each", () => {
      const recs = [
        makeRecord({ trauma_types: ["physical_abuse", "neglect"] }),
      ];
      const m = computeTraumaMetrics(recs, 1);
      expect(m.by_trauma_type).toEqual({ physical_abuse: 1, neglect: 1 });
    });

    it("accumulates across multiple records", () => {
      const recs = [
        makeRecord({ trauma_types: ["neglect"] }),
        makeRecord({ trauma_types: ["neglect", "bereavement"] }),
        makeRecord({ trauma_types: ["bereavement"] }),
      ];
      const m = computeTraumaMetrics(recs, 3);
      expect(m.by_trauma_type).toEqual({ neglect: 2, bereavement: 2 });
    });

    it("handles empty trauma_types array", () => {
      const recs = [makeRecord({ trauma_types: [] })];
      const m = computeTraumaMetrics(recs, 1);
      expect(m.by_trauma_type).toEqual({});
    });

    it("handles record with all types", () => {
      const allTypes: TraumaType[] = [
        "physical_abuse", "sexual_abuse", "emotional_abuse", "neglect",
        "domestic_violence", "parental_substance_misuse", "parental_mental_health",
        "bereavement", "separation_loss", "community_violence",
        "institutional_abuse", "multiple_placements", "other",
      ];
      const recs = [makeRecord({ trauma_types: allTypes })];
      const m = computeTraumaMetrics(recs, 1);
      for (const t of allTypes) {
        expect(m.by_trauma_type[t]).toBe(1);
      }
    });
  });

  // ── by_therapeutic_model ──────────────────────────────────────────────────

  describe("by_therapeutic_model", () => {
    it("groups multiple models correctly", () => {
      const recs = [
        makeRecord({ therapeutic_model: "pace" }),
        makeRecord({ therapeutic_model: "pace" }),
        makeRecord({ therapeutic_model: "cbt" }),
        makeRecord({ therapeutic_model: "emdr" }),
      ];
      const m = computeTraumaMetrics(recs, 4);
      expect(m.by_therapeutic_model).toEqual({ pace: 2, cbt: 1, emdr: 1 });
    });

    it("handles all records with same model", () => {
      const recs = [
        makeRecord({ therapeutic_model: "dbt" }),
        makeRecord({ therapeutic_model: "dbt" }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.by_therapeutic_model).toEqual({ dbt: 2 });
    });
  });

  // ── by_tic_competency ─────────────────────────────────────────────────────

  describe("by_tic_competency", () => {
    it("groups multiple competencies correctly", () => {
      const recs = [
        makeRecord({ tic_competency: "advanced" }),
        makeRecord({ tic_competency: "competent" }),
        makeRecord({ tic_competency: "competent" }),
        makeRecord({ tic_competency: "not_trained" }),
      ];
      const m = computeTraumaMetrics(recs, 4);
      expect(m.by_tic_competency).toEqual({ advanced: 1, competent: 2, not_trained: 1 });
    });

    it("handles all records with same competency", () => {
      const recs = [
        makeRecord({ tic_competency: "developing" }),
        makeRecord({ tic_competency: "developing" }),
        makeRecord({ tic_competency: "developing" }),
      ];
      const m = computeTraumaMetrics(recs, 3);
      expect(m.by_tic_competency).toEqual({ developing: 3 });
    });
  });

  // ── by_recovery_progress ──────────────────────────────────────────────────

  describe("by_recovery_progress", () => {
    it("groups multiple progress values correctly", () => {
      const recs = [
        makeRecord({ recovery_progress: "stable" }),
        makeRecord({ recovery_progress: "stable" }),
        makeRecord({ recovery_progress: "deteriorating" }),
        makeRecord({ recovery_progress: "not_assessed" }),
      ];
      const m = computeTraumaMetrics(recs, 4);
      expect(m.by_recovery_progress).toEqual({ stable: 2, deteriorating: 1, not_assessed: 1 });
    });

    it("handles all records with same progress", () => {
      const recs = [
        makeRecord({ recovery_progress: "significant_improvement" }),
        makeRecord({ recovery_progress: "significant_improvement" }),
      ];
      const m = computeTraumaMetrics(recs, 2);
      expect(m.by_recovery_progress).toEqual({ significant_improvement: 2 });
    });
  });

  // ── Return shape ──────────────────────────────────────────────────────────

  describe("return shape", () => {
    it("returns exactly 18 keys", () => {
      const m = computeTraumaMetrics([], 0);
      expect(Object.keys(m)).toHaveLength(18);
    });

    it("contains all expected keys", () => {
      const m = computeTraumaMetrics([], 0);
      const keys = Object.keys(m);
      const expected = [
        "total_records", "children_assessed", "assessment_coverage",
        "average_aces_score", "therapist_involved_rate", "child_engaged_rate",
        "plan_in_place_rate", "staff_aware_rate", "average_staff_trained",
        "significant_improvement_count", "some_improvement_count", "stable_count",
        "deteriorating_count", "review_overdue_count", "by_trauma_type",
        "by_therapeutic_model", "by_tic_competency", "by_recovery_progress",
      ];
      for (const k of expected) {
        expect(keys).toContain(k);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// identifyTraumaAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyTraumaAlerts", () => {
  // ── No alerts ─────────────────────────────────────────────────────────────

  describe("no alerts", () => {
    it("returns empty array when no records and no children", () => {
      const alerts = identifyTraumaAlerts([], 0);
      expect(alerts).toEqual([]);
    });

    it("returns empty array when all conditions are clean", () => {
      const recs = [
        makeRecord({
          child_id: "c1", child_name: "Alice",
          recovery_progress: "stable",
          trauma_informed_plan_in_place: true, aces_score: 5,
          staff_aware_of_triggers: true,
          staff_trained_percentage: 80,
        }),
        makeRecord({
          child_id: "c2", child_name: "Bob",
          recovery_progress: "some_improvement",
          trauma_informed_plan_in_place: true, aces_score: 3,
          staff_aware_of_triggers: true,
          staff_trained_percentage: 60,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 2);
      expect(alerts).toEqual([]);
    });
  });

  // ── deteriorating alert ───────────────────────────────────────────────────

  describe("deteriorating alert", () => {
    it("fires when recovery_progress is deteriorating", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Alice",
          recovery_progress: "deteriorating",
          staff_trained_percentage: 80,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "deteriorating");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Alice",
          recovery_progress: "deteriorating",
          staff_trained_percentage: 80,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "deteriorating")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses record id as alert id", () => {
      const recs = [
        makeRecord({
          id: "rec-unique-abc", child_name: "Alice",
          recovery_progress: "deteriorating",
          staff_trained_percentage: 80,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "deteriorating")!;
      expect(alert.id).toBe("rec-unique-abc");
    });

    it("includes child_name in message", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Alice",
          recovery_progress: "deteriorating",
          staff_trained_percentage: 80,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "deteriorating")!;
      expect(alert.message).toContain("Alice");
    });

    it("includes guidance about reviewing therapeutic approach", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Alice",
          recovery_progress: "deteriorating",
          staff_trained_percentage: 80,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "deteriorating")!;
      expect(alert.message).toContain("review therapeutic approach");
    });

    it("creates one alert per deteriorating record", () => {
      const recs = [
        makeRecord({ id: "r1", child_name: "Alice", recovery_progress: "deteriorating", child_id: "c1", staff_trained_percentage: 80 }),
        makeRecord({ id: "r2", child_name: "Bob", recovery_progress: "deteriorating", child_id: "c2", staff_trained_percentage: 80 }),
        makeRecord({ id: "r3", child_name: "Charlie", recovery_progress: "deteriorating", child_id: "c3", staff_trained_percentage: 80 }),
      ];
      const alerts = identifyTraumaAlerts(recs, 3);
      const dAlerts = alerts.filter((a) => a.type === "deteriorating");
      expect(dAlerts).toHaveLength(3);
    });

    it("does not fire for non-deteriorating progress", () => {
      const progresses: RecoveryProgress[] = ["significant_improvement", "some_improvement", "stable", "not_assessed"];
      for (const p of progresses) {
        const recs = [makeRecord({ recovery_progress: p, staff_trained_percentage: 80 })];
        const alerts = identifyTraumaAlerts(recs, 1);
        const dAlerts = alerts.filter((a) => a.type === "deteriorating");
        expect(dAlerts).toHaveLength(0);
      }
    });
  });

  // ── no_plan_high_aces alert ───────────────────────────────────────────────

  describe("no_plan_high_aces alert", () => {
    it("fires when no plan and aces_score >= 4", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Alice",
          trauma_informed_plan_in_place: false,
          aces_score: 4,
          staff_trained_percentage: 80,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "no_plan_high_aces");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Alice",
          trauma_informed_plan_in_place: false,
          aces_score: 5,
          staff_trained_percentage: 80,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "no_plan_high_aces")!;
      expect(alert.severity).toBe("high");
    });

    it("uses record id as alert id", () => {
      const recs = [
        makeRecord({
          id: "rec-plan-xyz", child_name: "Alice",
          trauma_informed_plan_in_place: false,
          aces_score: 6,
          staff_trained_percentage: 80,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "no_plan_high_aces")!;
      expect(alert.id).toBe("rec-plan-xyz");
    });

    it("includes child_name in message", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Alice",
          trauma_informed_plan_in_place: false,
          aces_score: 7,
          staff_trained_percentage: 80,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "no_plan_high_aces")!;
      expect(alert.message).toContain("Alice");
    });

    it("includes aces_score in message", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Alice",
          trauma_informed_plan_in_place: false,
          aces_score: 8,
          staff_trained_percentage: 80,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "no_plan_high_aces")!;
      expect(alert.message).toContain("8");
    });

    it("does not fire when aces_score < 4", () => {
      const recs = [
        makeRecord({
          trauma_informed_plan_in_place: false,
          aces_score: 3,
          staff_trained_percentage: 80,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "no_plan_high_aces");
      expect(alert).toBeUndefined();
    });

    it("does not fire when plan is in place even with high aces", () => {
      const recs = [
        makeRecord({
          trauma_informed_plan_in_place: true,
          aces_score: 10,
          staff_trained_percentage: 80,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "no_plan_high_aces");
      expect(alert).toBeUndefined();
    });

    it("does not fire when aces_score is null", () => {
      const recs = [
        makeRecord({
          trauma_informed_plan_in_place: false,
          aces_score: null,
          staff_trained_percentage: 80,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "no_plan_high_aces");
      expect(alert).toBeUndefined();
    });

    it("fires at exact threshold of aces_score = 4", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Alice",
          trauma_informed_plan_in_place: false,
          aces_score: 4,
          staff_trained_percentage: 80,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "no_plan_high_aces");
      expect(alert).toBeDefined();
    });

    it("fires for each qualifying record", () => {
      const recs = [
        makeRecord({ id: "r1", child_name: "Alice", trauma_informed_plan_in_place: false, aces_score: 5, child_id: "c1", staff_trained_percentage: 80 }),
        makeRecord({ id: "r2", child_name: "Bob", trauma_informed_plan_in_place: false, aces_score: 6, child_id: "c2", staff_trained_percentage: 80 }),
      ];
      const alerts = identifyTraumaAlerts(recs, 2);
      const planAlerts = alerts.filter((a) => a.type === "no_plan_high_aces");
      expect(planAlerts).toHaveLength(2);
    });
  });

  // ── staff_unaware alert ───────────────────────────────────────────────────

  describe("staff_unaware alert", () => {
    it("fires when staff_aware_of_triggers is false", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Alice",
          staff_aware_of_triggers: false,
          staff_trained_percentage: 80,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "staff_unaware");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Alice",
          staff_aware_of_triggers: false,
          staff_trained_percentage: 80,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "staff_unaware")!;
      expect(alert.severity).toBe("high");
    });

    it("uses record id as alert id", () => {
      const recs = [
        makeRecord({
          id: "rec-unaware-123", child_name: "Alice",
          staff_aware_of_triggers: false,
          staff_trained_percentage: 80,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "staff_unaware")!;
      expect(alert.id).toBe("rec-unaware-123");
    });

    it("includes child_name in message", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Bob",
          staff_aware_of_triggers: false,
          staff_trained_percentage: 80,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "staff_unaware")!;
      expect(alert.message).toContain("Bob");
    });

    it("includes guidance about briefing staff", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Alice",
          staff_aware_of_triggers: false,
          staff_trained_percentage: 80,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "staff_unaware")!;
      expect(alert.message).toContain("brief all staff");
    });

    it("creates one alert per unaware record", () => {
      const recs = [
        makeRecord({ id: "r1", child_name: "Alice", staff_aware_of_triggers: false, child_id: "c1", staff_trained_percentage: 80 }),
        makeRecord({ id: "r2", child_name: "Bob", staff_aware_of_triggers: false, child_id: "c2", staff_trained_percentage: 80 }),
      ];
      const alerts = identifyTraumaAlerts(recs, 2);
      const uAlerts = alerts.filter((a) => a.type === "staff_unaware");
      expect(uAlerts).toHaveLength(2);
    });

    it("does not fire when staff_aware_of_triggers is true", () => {
      const recs = [
        makeRecord({ staff_aware_of_triggers: true }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "staff_unaware");
      expect(alert).toBeUndefined();
    });
  });

  // ── low_training alert ────────────────────────────────────────────────────

  describe("low_training alert", () => {
    it("fires when staff_trained_percentage < 50", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Alice",
          staff_trained_percentage: 49,
          therapeutic_model: "pace",
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "low_training");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Alice",
          staff_trained_percentage: 30,
          therapeutic_model: "cbt",
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "low_training")!;
      expect(alert.severity).toBe("medium");
    });

    it("uses record id as alert id", () => {
      const recs = [
        makeRecord({
          id: "rec-low-train", child_name: "Alice",
          staff_trained_percentage: 20,
          therapeutic_model: "emdr",
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "low_training")!;
      expect(alert.id).toBe("rec-low-train");
    });

    it("includes staff_trained_percentage in message", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Alice",
          staff_trained_percentage: 25,
          therapeutic_model: "pace",
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "low_training")!;
      expect(alert.message).toContain("25%");
    });

    it("includes child_name in message", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Charlie",
          staff_trained_percentage: 10,
          therapeutic_model: "pace",
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "low_training")!;
      expect(alert.message).toContain("Charlie");
    });

    it("includes therapeutic model with underscores replaced by spaces", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Alice",
          staff_trained_percentage: 40,
          therapeutic_model: "art_therapy",
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "low_training")!;
      expect(alert.message).toContain("art therapy");
    });

    it("does not fire when staff_trained_percentage = 50", () => {
      const recs = [
        makeRecord({
          staff_trained_percentage: 50,
          therapeutic_model: "pace",
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "low_training");
      expect(alert).toBeUndefined();
    });

    it("does not fire when staff_trained_percentage > 50", () => {
      const recs = [
        makeRecord({
          staff_trained_percentage: 80,
          therapeutic_model: "pace",
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 1);
      const alert = alerts.find((a) => a.type === "low_training");
      expect(alert).toBeUndefined();
    });

    it("fires at exact threshold boundary (49 fires, 50 does not)", () => {
      const recs49 = [makeRecord({ id: "r49", child_name: "A", staff_trained_percentage: 49, therapeutic_model: "pace" })];
      const recs50 = [makeRecord({ staff_trained_percentage: 50, therapeutic_model: "pace" })];
      expect(identifyTraumaAlerts(recs49, 1).find((a) => a.type === "low_training")).toBeDefined();
      expect(identifyTraumaAlerts(recs50, 1).find((a) => a.type === "low_training")).toBeUndefined();
    });

    it("fires for each qualifying record", () => {
      const recs = [
        makeRecord({ id: "r1", child_name: "Alice", staff_trained_percentage: 20, therapeutic_model: "pace", child_id: "c1" }),
        makeRecord({ id: "r2", child_name: "Bob", staff_trained_percentage: 30, therapeutic_model: "cbt", child_id: "c2" }),
        makeRecord({ id: "r3", child_name: "Charlie", staff_trained_percentage: 10, therapeutic_model: "emdr", child_id: "c3" }),
      ];
      const alerts = identifyTraumaAlerts(recs, 3);
      const lowAlerts = alerts.filter((a) => a.type === "low_training");
      expect(lowAlerts).toHaveLength(3);
    });
  });

  // ── not_assessed alert ────────────────────────────────────────────────────

  describe("not_assessed alert", () => {
    it("fires when gap exists between totalChildren and assessed children", () => {
      const recs = [makeRecord({ child_id: "c1" })];
      const alerts = identifyTraumaAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "not_assessed");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const recs = [makeRecord({ child_id: "c1" })];
      const alerts = identifyTraumaAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "not_assessed")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id 'assessment_gap'", () => {
      const recs = [makeRecord({ child_id: "c1" })];
      const alerts = identifyTraumaAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "not_assessed")!;
      expect(alert.id).toBe("assessment_gap");
    });

    it("uses singular 'child has' when gap is 1", () => {
      const recs = [makeRecord({ child_id: "c1" })];
      const alerts = identifyTraumaAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "not_assessed")!;
      expect(alert.message).toContain("1 child has");
    });

    it("uses plural 'children have' when gap > 1", () => {
      const recs = [makeRecord({ child_id: "c1" })];
      const alerts = identifyTraumaAlerts(recs, 4);
      const alert = alerts.find((a) => a.type === "not_assessed")!;
      expect(alert.message).toContain("3 children have");
    });

    it("does not fire when all children have records", () => {
      const recs = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c2" }),
      ];
      const alerts = identifyTraumaAlerts(recs, 2);
      const alert = alerts.find((a) => a.type === "not_assessed");
      expect(alert).toBeUndefined();
    });

    it("does not fire when totalChildren is 0", () => {
      const alerts = identifyTraumaAlerts([], 0);
      const alert = alerts.find((a) => a.type === "not_assessed");
      expect(alert).toBeUndefined();
    });

    it("fires when no records and totalChildren > 0", () => {
      const alerts = identifyTraumaAlerts([], 5);
      const alert = alerts.find((a) => a.type === "not_assessed")!;
      expect(alert.message).toContain("5 children have");
    });

    it("correctly deduplicates children when same child has multiple records", () => {
      const recs = [
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
        makeRecord({ child_id: "c1" }),
      ];
      const alerts = identifyTraumaAlerts(recs, 3);
      const alert = alerts.find((a) => a.type === "not_assessed")!;
      expect(alert.message).toContain("2 children have");
    });
  });

  // ── Combined alerts ───────────────────────────────────────────────────────

  describe("combined alerts", () => {
    it("can return all 5 alert types simultaneously", () => {
      const recs = [
        // deteriorating + staff_unaware + low_training
        makeRecord({
          id: "r1", child_id: "c1", child_name: "Alice",
          recovery_progress: "deteriorating",
          staff_aware_of_triggers: false,
          staff_trained_percentage: 30,
          therapeutic_model: "pace",
          trauma_informed_plan_in_place: false,
          aces_score: 6,
        }),
        // no_plan_high_aces (another one)
        makeRecord({
          id: "r2", child_id: "c2", child_name: "Bob",
          trauma_informed_plan_in_place: false,
          aces_score: 5,
          staff_trained_percentage: 80,
          recovery_progress: "stable",
          staff_aware_of_triggers: true,
        }),
      ];
      // totalChildren = 4, assessed = 2 => gap = 2 => not_assessed
      const alerts = identifyTraumaAlerts(recs, 4);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("deteriorating");
      expect(types).toContain("no_plan_high_aces");
      expect(types).toContain("staff_unaware");
      expect(types).toContain("low_training");
      expect(types).toContain("not_assessed");
    });

    it("returns correct total count when multiple alert types fire", () => {
      const recs = [
        makeRecord({
          id: "r1", child_id: "c1", child_name: "Alice",
          recovery_progress: "deteriorating",
          staff_aware_of_triggers: false,
          staff_trained_percentage: 30,
          therapeutic_model: "pace",
          trauma_informed_plan_in_place: false,
          aces_score: 6,
        }),
      ];
      // r1: deteriorating (1) + no_plan_high_aces (1) + staff_unaware (1) + low_training (1)
      // totalChildren = 3, assessed = 1 => not_assessed (1)
      const alerts = identifyTraumaAlerts(recs, 3);
      expect(alerts.length).toBe(5);
    });
  });

  // ── Alert structure ───────────────────────────────────────────────────────

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const recs = [
        makeRecord({
          id: "r1", child_name: "Alice",
          recovery_progress: "deteriorating",
          staff_aware_of_triggers: false,
          staff_trained_percentage: 30,
          therapeutic_model: "pace",
          trauma_informed_plan_in_place: false,
          aces_score: 7,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 3);
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
          id: "r1", child_name: "Alice",
          recovery_progress: "deteriorating",
          staff_aware_of_triggers: false,
          staff_trained_percentage: 30,
          therapeutic_model: "pace",
          trauma_informed_plan_in_place: false,
          aces_score: 7,
        }),
      ];
      const alerts = identifyTraumaAlerts(recs, 3);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });
  });
});
