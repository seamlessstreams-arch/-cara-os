// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEDICATION ERRORS SERVICE TESTS
// Pure-function tests for medication error metrics, alert identification,
// and constant arrays. CHR 2015 Reg 23 / Reg 40 — Duty of Candour.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../medication-errors-service";
import { todayStr } from "@/lib/utils";
import {
  ERROR_TYPES,
  ERROR_SEVERITIES,
  ROOT_CAUSES,
  INVESTIGATION_STATUSES,
} from "../medication-errors-service";
import type {
  MedicationError,
  ErrorType,
  ErrorSeverity,
  RootCause,
  InvestigationStatus,
} from "../medication-errors-service";

const { computeMedErrorMetrics, identifyMedErrorAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(todayStr());

/** Build a minimal MedicationError with sensible defaults. */
function medError(overrides?: Partial<MedicationError>): MedicationError {
  return {
    id: overrides?.id ?? "err-1",
    home_id: overrides?.home_id ?? "home-1",
    child_name: overrides?.child_name ?? "Alex Smith",
    child_id: overrides?.child_id ?? "child-1",
    error_date: overrides?.error_date ?? todayStr(),
    error_time: overrides?.error_time ?? "08:00",
    error_type: overrides?.error_type ?? "wrong_dose",
    error_severity: overrides?.error_severity ?? "no_harm",
    medication_name: overrides?.medication_name ?? "Methylphenidate",
    reported_by: overrides?.reported_by ?? "staff-1",
    root_cause: overrides?.root_cause ?? "human_error",
    investigation_status: overrides?.investigation_status ?? "closed",
    corrective_actions: overrides?.corrective_actions ?? [],
    actions_completed: overrides?.actions_completed ?? true,
    child_harmed: overrides?.child_harmed ?? false,
    medical_attention_required: overrides?.medical_attention_required ?? false,
    parent_informed: overrides?.parent_informed ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? false,
    ofsted_notified: overrides?.ofsted_notified ?? false,
    duty_of_candour_applied: overrides?.duty_of_candour_applied ?? false,
    staff_involved: "staff_involved" in (overrides ?? {}) ? (overrides!.staff_involved ?? null) : null,
    lessons_learned: "lessons_learned" in (overrides ?? {}) ? (overrides!.lessons_learned ?? null) : null,
    policy_reviewed: overrides?.policy_reviewed ?? false,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("ERROR_TYPES", () => {
  it("contains exactly 12 entries", () => {
    expect(ERROR_TYPES).toHaveLength(12);
  });

  it("includes wrong_dose", () => {
    expect(ERROR_TYPES.find((t) => t.type === "wrong_dose")).toBeDefined();
  });

  it("includes wrong_medication", () => {
    expect(ERROR_TYPES.find((t) => t.type === "wrong_medication")).toBeDefined();
  });

  it("includes wrong_time", () => {
    expect(ERROR_TYPES.find((t) => t.type === "wrong_time")).toBeDefined();
  });

  it("includes wrong_child", () => {
    expect(ERROR_TYPES.find((t) => t.type === "wrong_child")).toBeDefined();
  });

  it("includes omission", () => {
    expect(ERROR_TYPES.find((t) => t.type === "omission")).toBeDefined();
  });

  it("includes double_dose", () => {
    expect(ERROR_TYPES.find((t) => t.type === "double_dose")).toBeDefined();
  });

  it("includes wrong_route", () => {
    expect(ERROR_TYPES.find((t) => t.type === "wrong_route")).toBeDefined();
  });

  it("includes expired_medication", () => {
    expect(ERROR_TYPES.find((t) => t.type === "expired_medication")).toBeDefined();
  });

  it("includes documentation_error", () => {
    expect(ERROR_TYPES.find((t) => t.type === "documentation_error")).toBeDefined();
  });

  it("includes storage_error", () => {
    expect(ERROR_TYPES.find((t) => t.type === "storage_error")).toBeDefined();
  });

  it("includes near_miss", () => {
    expect(ERROR_TYPES.find((t) => t.type === "near_miss")).toBeDefined();
  });

  it("includes other", () => {
    expect(ERROR_TYPES.find((t) => t.type === "other")).toBeDefined();
  });

  it("each entry has a type and label", () => {
    for (const entry of ERROR_TYPES) {
      expect(entry).toHaveProperty("type");
      expect(entry).toHaveProperty("label");
      expect(typeof entry.type).toBe("string");
      expect(typeof entry.label).toBe("string");
    }
  });

  it("has unique types", () => {
    const types = ERROR_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("has non-empty labels", () => {
    for (const entry of ERROR_TYPES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

describe("ERROR_SEVERITIES", () => {
  it("contains exactly 5 entries", () => {
    expect(ERROR_SEVERITIES).toHaveLength(5);
  });

  it("includes no_harm", () => {
    expect(ERROR_SEVERITIES.find((s) => s.severity === "no_harm")).toBeDefined();
  });

  it("includes low_harm", () => {
    expect(ERROR_SEVERITIES.find((s) => s.severity === "low_harm")).toBeDefined();
  });

  it("includes moderate_harm", () => {
    expect(ERROR_SEVERITIES.find((s) => s.severity === "moderate_harm")).toBeDefined();
  });

  it("includes severe_harm", () => {
    expect(ERROR_SEVERITIES.find((s) => s.severity === "severe_harm")).toBeDefined();
  });

  it("includes death", () => {
    expect(ERROR_SEVERITIES.find((s) => s.severity === "death")).toBeDefined();
  });

  it("each entry has a severity and label", () => {
    for (const entry of ERROR_SEVERITIES) {
      expect(entry).toHaveProperty("severity");
      expect(entry).toHaveProperty("label");
    }
  });

  it("has unique severities", () => {
    const sevs = ERROR_SEVERITIES.map((s) => s.severity);
    expect(new Set(sevs).size).toBe(sevs.length);
  });
});

describe("ROOT_CAUSES", () => {
  it("contains exactly 10 entries", () => {
    expect(ROOT_CAUSES).toHaveLength(10);
  });

  it("includes human_error", () => {
    expect(ROOT_CAUSES.find((c) => c.cause === "human_error")).toBeDefined();
  });

  it("includes system_failure", () => {
    expect(ROOT_CAUSES.find((c) => c.cause === "system_failure")).toBeDefined();
  });

  it("includes training_gap", () => {
    expect(ROOT_CAUSES.find((c) => c.cause === "training_gap")).toBeDefined();
  });

  it("includes communication_breakdown", () => {
    expect(ROOT_CAUSES.find((c) => c.cause === "communication_breakdown")).toBeDefined();
  });

  it("includes workload_pressure", () => {
    expect(ROOT_CAUSES.find((c) => c.cause === "workload_pressure")).toBeDefined();
  });

  it("includes unclear_instructions", () => {
    expect(ROOT_CAUSES.find((c) => c.cause === "unclear_instructions")).toBeDefined();
  });

  it("includes equipment_failure", () => {
    expect(ROOT_CAUSES.find((c) => c.cause === "equipment_failure")).toBeDefined();
  });

  it("includes environmental_factor", () => {
    expect(ROOT_CAUSES.find((c) => c.cause === "environmental_factor")).toBeDefined();
  });

  it("includes under_investigation", () => {
    expect(ROOT_CAUSES.find((c) => c.cause === "under_investigation")).toBeDefined();
  });

  it("includes other", () => {
    expect(ROOT_CAUSES.find((c) => c.cause === "other")).toBeDefined();
  });

  it("each entry has a cause and label", () => {
    for (const entry of ROOT_CAUSES) {
      expect(entry).toHaveProperty("cause");
      expect(entry).toHaveProperty("label");
    }
  });

  it("has unique causes", () => {
    const causes = ROOT_CAUSES.map((c) => c.cause);
    expect(new Set(causes).size).toBe(causes.length);
  });
});

describe("INVESTIGATION_STATUSES", () => {
  it("contains exactly 6 entries", () => {
    expect(INVESTIGATION_STATUSES).toHaveLength(6);
  });

  it("includes reported", () => {
    expect(INVESTIGATION_STATUSES.find((s) => s.status === "reported")).toBeDefined();
  });

  it("includes under_investigation", () => {
    expect(INVESTIGATION_STATUSES.find((s) => s.status === "under_investigation")).toBeDefined();
  });

  it("includes investigation_complete", () => {
    expect(INVESTIGATION_STATUSES.find((s) => s.status === "investigation_complete")).toBeDefined();
  });

  it("includes actions_identified", () => {
    expect(INVESTIGATION_STATUSES.find((s) => s.status === "actions_identified")).toBeDefined();
  });

  it("includes actions_completed", () => {
    expect(INVESTIGATION_STATUSES.find((s) => s.status === "actions_completed")).toBeDefined();
  });

  it("includes closed", () => {
    expect(INVESTIGATION_STATUSES.find((s) => s.status === "closed")).toBeDefined();
  });

  it("each entry has a status and label", () => {
    for (const entry of INVESTIGATION_STATUSES) {
      expect(entry).toHaveProperty("status");
      expect(entry).toHaveProperty("label");
    }
  });

  it("has unique statuses", () => {
    const statuses = INVESTIGATION_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeMedErrorMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMedErrorMetrics", () => {
  // ── Empty array ──────────────────────────────────────────────────────────

  describe("empty array", () => {
    const m = computeMedErrorMetrics([]);

    it("returns total_errors 0", () => {
      expect(m.total_errors).toBe(0);
    });

    it("returns near_miss_count 0", () => {
      expect(m.near_miss_count).toBe(0);
    });

    it("returns actual_error_count 0", () => {
      expect(m.actual_error_count).toBe(0);
    });

    it("returns no_harm_count 0", () => {
      expect(m.no_harm_count).toBe(0);
    });

    it("returns harm_caused_count 0", () => {
      expect(m.harm_caused_count).toBe(0);
    });

    it("returns severe_harm_count 0", () => {
      expect(m.severe_harm_count).toBe(0);
    });

    it("returns child_harmed_count 0", () => {
      expect(m.child_harmed_count).toBe(0);
    });

    it("returns medical_attention_count 0", () => {
      expect(m.medical_attention_count).toBe(0);
    });

    it("returns open_investigations 0", () => {
      expect(m.open_investigations).toBe(0);
    });

    it("returns actions_outstanding 0", () => {
      expect(m.actions_outstanding).toBe(0);
    });

    it("returns parent_informed_rate 0", () => {
      expect(m.parent_informed_rate).toBeNull();;
    });

    it("returns duty_of_candour_rate 0", () => {
      expect(m.duty_of_candour_rate).toBeNull();;
    });

    it("returns ofsted_notified_count 0", () => {
      expect(m.ofsted_notified_count).toBe(0);
    });

    it("returns policy_reviewed_rate 0", () => {
      expect(m.policy_reviewed_rate).toBeNull();;
    });

    it("returns lessons_learned_rate 0", () => {
      expect(m.lessons_learned_rate).toBeNull();;
    });

    it("returns empty by_error_type", () => {
      expect(m.by_error_type).toEqual({});
    });

    it("returns empty by_severity", () => {
      expect(m.by_severity).toEqual({});
    });

    it("returns empty by_root_cause", () => {
      expect(m.by_root_cause).toEqual({});
    });

    it("returns empty by_investigation_status", () => {
      expect(m.by_investigation_status).toEqual({});
    });
  });

  // ── Single error ─────────────────────────────────────────────────────────

  describe("single error — default (no_harm, closed)", () => {
    const m = computeMedErrorMetrics([medError()]);

    it("returns total_errors 1", () => {
      expect(m.total_errors).toBe(1);
    });

    it("returns near_miss_count 0 (wrong_dose is not near_miss)", () => {
      expect(m.near_miss_count).toBe(0);
    });

    it("returns actual_error_count 1", () => {
      expect(m.actual_error_count).toBe(1);
    });

    it("returns no_harm_count 1", () => {
      expect(m.no_harm_count).toBe(1);
    });

    it("returns harm_caused_count 0", () => {
      expect(m.harm_caused_count).toBe(0);
    });

    it("returns severe_harm_count 0", () => {
      expect(m.severe_harm_count).toBe(0);
    });

    it("returns parent_informed_rate 100", () => {
      expect(m.parent_informed_rate).toBe(100);
    });

    it("populates by_error_type with wrong_dose=1", () => {
      expect(m.by_error_type).toEqual({ wrong_dose: 1 });
    });

    it("populates by_severity with no_harm=1", () => {
      expect(m.by_severity).toEqual({ no_harm: 1 });
    });

    it("populates by_root_cause with human_error=1", () => {
      expect(m.by_root_cause).toEqual({ human_error: 1 });
    });

    it("populates by_investigation_status with closed=1", () => {
      expect(m.by_investigation_status).toEqual({ closed: 1 });
    });
  });

  // ── near_miss vs actual ──────────────────────────────────────────────────

  describe("near_miss vs actual counts", () => {
    const errors = [
      medError({ id: "e1", error_type: "near_miss" }),
      medError({ id: "e2", error_type: "near_miss" }),
      medError({ id: "e3", error_type: "wrong_dose" }),
      medError({ id: "e4", error_type: "omission" }),
      medError({ id: "e5", error_type: "wrong_medication" }),
    ];
    const m = computeMedErrorMetrics(errors);

    it("counts 2 near misses", () => {
      expect(m.near_miss_count).toBe(2);
    });

    it("counts 3 actual errors", () => {
      expect(m.actual_error_count).toBe(3);
    });

    it("total is sum of near_miss + actual", () => {
      expect(m.total_errors).toBe(5);
      expect(m.near_miss_count + m.actual_error_count).toBe(m.total_errors);
    });
  });

  // ── harm_caused vs no_harm ───────────────────────────────────────────────

  describe("harm_caused vs no_harm", () => {
    const errors = [
      medError({ id: "h1", error_severity: "no_harm" }),
      medError({ id: "h2", error_severity: "low_harm" }),
      medError({ id: "h3", error_severity: "moderate_harm" }),
      medError({ id: "h4", error_severity: "no_harm" }),
    ];
    const m = computeMedErrorMetrics(errors);

    it("counts no_harm correctly", () => {
      expect(m.no_harm_count).toBe(2);
    });

    it("counts harm_caused correctly (low + moderate)", () => {
      expect(m.harm_caused_count).toBe(2);
    });

    it("no_harm + harm_caused equals total", () => {
      expect(m.no_harm_count + m.harm_caused_count).toBe(m.total_errors);
    });
  });

  // ── severe_harm including death ──────────────────────────────────────────

  describe("severe_harm including death", () => {
    const errors = [
      medError({ id: "s1", error_severity: "severe_harm" }),
      medError({ id: "s2", error_severity: "death" }),
      medError({ id: "s3", error_severity: "moderate_harm" }),
      medError({ id: "s4", error_severity: "low_harm" }),
      medError({ id: "s5", error_severity: "no_harm" }),
    ];
    const m = computeMedErrorMetrics(errors);

    it("counts severe_harm_count as 2 (severe_harm + death)", () => {
      expect(m.severe_harm_count).toBe(2);
    });

    it("counts harm_caused as 4 (everything except no_harm)", () => {
      expect(m.harm_caused_count).toBe(4);
    });

    it("no_harm is 1", () => {
      expect(m.no_harm_count).toBe(1);
    });
  });

  // ── child_harmed and medical_attention ────────────────────────────────────

  describe("child_harmed and medical_attention", () => {
    const errors = [
      medError({ id: "c1", child_harmed: true, medical_attention_required: true }),
      medError({ id: "c2", child_harmed: true, medical_attention_required: false }),
      medError({ id: "c3", child_harmed: false, medical_attention_required: true }),
      medError({ id: "c4", child_harmed: false, medical_attention_required: false }),
    ];
    const m = computeMedErrorMetrics(errors);

    it("counts child_harmed correctly", () => {
      expect(m.child_harmed_count).toBe(2);
    });

    it("counts medical_attention correctly", () => {
      expect(m.medical_attention_count).toBe(2);
    });
  });

  // ── open_investigations ──────────────────────────────────────────────────

  describe("open_investigations (reported + under_investigation)", () => {
    const errors = [
      medError({ id: "oi1", investigation_status: "reported" }),
      medError({ id: "oi2", investigation_status: "under_investigation" }),
      medError({ id: "oi3", investigation_status: "investigation_complete" }),
      medError({ id: "oi4", investigation_status: "actions_identified" }),
      medError({ id: "oi5", investigation_status: "actions_completed" }),
      medError({ id: "oi6", investigation_status: "closed" }),
    ];
    const m = computeMedErrorMetrics(errors);

    it("counts reported + under_investigation as open", () => {
      expect(m.open_investigations).toBe(2);
    });

    it("does not count investigation_complete as open", () => {
      const m2 = computeMedErrorMetrics([
        medError({ id: "ic1", investigation_status: "investigation_complete" }),
      ]);
      expect(m2.open_investigations).toBe(0);
    });

    it("does not count actions_completed as open", () => {
      const m2 = computeMedErrorMetrics([
        medError({ id: "ac1", investigation_status: "actions_completed" }),
      ]);
      expect(m2.open_investigations).toBe(0);
    });

    it("does not count closed as open", () => {
      const m2 = computeMedErrorMetrics([
        medError({ id: "cl1", investigation_status: "closed" }),
      ]);
      expect(m2.open_investigations).toBe(0);
    });
  });

  // ── actions_outstanding ──────────────────────────────────────────────────

  describe("actions_outstanding (actions_identified && !actions_completed)", () => {
    it("counts actions_identified with actions_completed=false", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "ao1", investigation_status: "actions_identified", actions_completed: false }),
      ]);
      expect(m.actions_outstanding).toBe(1);
    });

    it("does not count actions_identified with actions_completed=true", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "ao2", investigation_status: "actions_identified", actions_completed: true }),
      ]);
      expect(m.actions_outstanding).toBe(0);
    });

    it("does not count other statuses even if actions not completed", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "ao3", investigation_status: "reported", actions_completed: false }),
        medError({ id: "ao4", investigation_status: "under_investigation", actions_completed: false }),
        medError({ id: "ao5", investigation_status: "closed", actions_completed: false }),
      ]);
      expect(m.actions_outstanding).toBe(0);
    });

    it("counts multiple outstanding actions", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "ao6", investigation_status: "actions_identified", actions_completed: false }),
        medError({ id: "ao7", investigation_status: "actions_identified", actions_completed: false }),
        medError({ id: "ao8", investigation_status: "actions_identified", actions_completed: true }),
      ]);
      expect(m.actions_outstanding).toBe(2);
    });
  });

  // ── parent_informed_rate ─────────────────────────────────────────────────

  describe("parent_informed_rate", () => {
    it("returns 100 when all parents informed", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "pi1", parent_informed: true }),
        medError({ id: "pi2", parent_informed: true }),
      ]);
      expect(m.parent_informed_rate).toBe(100);
    });

    it("returns 0 when no parents informed", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "pi3", parent_informed: false }),
        medError({ id: "pi4", parent_informed: false }),
      ]);
      expect(m.parent_informed_rate).toBe(0);
    });

    it("returns 50 when half informed", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "pi5", parent_informed: true }),
        medError({ id: "pi6", parent_informed: false }),
      ]);
      expect(m.parent_informed_rate).toBe(50);
    });

    it("rounds to 1 decimal place", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "pi7", parent_informed: true }),
        medError({ id: "pi8", parent_informed: false }),
        medError({ id: "pi9", parent_informed: false }),
      ]);
      // 1/3 = 33.333... -> Math.round(333.33)/10 = 33.3
      expect(m.parent_informed_rate).toBe(33.3);
    });

    it("returns 0 for empty array", () => {
      const m = computeMedErrorMetrics([]);
      expect(m.parent_informed_rate).toBeNull();;
    });
  });

  // ── duty_of_candour_rate ─────────────────────────────────────────────────

  describe("duty_of_candour_rate", () => {
    it("returns 100 when all have duty of candour applied", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "dc1", duty_of_candour_applied: true }),
        medError({ id: "dc2", duty_of_candour_applied: true }),
      ]);
      expect(m.duty_of_candour_rate).toBe(100);
    });

    it("returns 0 when none have duty of candour", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "dc3", duty_of_candour_applied: false }),
      ]);
      expect(m.duty_of_candour_rate).toBe(0);
    });

    it("calculates partial rate correctly", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "dc4", duty_of_candour_applied: true }),
        medError({ id: "dc5", duty_of_candour_applied: false }),
        medError({ id: "dc6", duty_of_candour_applied: false }),
        medError({ id: "dc7", duty_of_candour_applied: false }),
      ]);
      // 1/4 = 25.0
      expect(m.duty_of_candour_rate).toBe(25);
    });
  });

  // ── ofsted_notified_count ────────────────────────────────────────────────

  describe("ofsted_notified_count", () => {
    it("counts ofsted notifications", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "of1", ofsted_notified: true }),
        medError({ id: "of2", ofsted_notified: false }),
        medError({ id: "of3", ofsted_notified: true }),
      ]);
      expect(m.ofsted_notified_count).toBe(2);
    });

    it("returns 0 when none notified", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "of4", ofsted_notified: false }),
      ]);
      expect(m.ofsted_notified_count).toBe(0);
    });
  });

  // ── policy_reviewed_rate ─────────────────────────────────────────────────

  describe("policy_reviewed_rate", () => {
    it("returns 100 when all policies reviewed", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "pr1", policy_reviewed: true }),
        medError({ id: "pr2", policy_reviewed: true }),
      ]);
      expect(m.policy_reviewed_rate).toBe(100);
    });

    it("returns 0 when no policies reviewed", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "pr3", policy_reviewed: false }),
        medError({ id: "pr4", policy_reviewed: false }),
      ]);
      expect(m.policy_reviewed_rate).toBe(0);
    });

    it("rounds correctly for fractional rate", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "pr5", policy_reviewed: true }),
        medError({ id: "pr6", policy_reviewed: true }),
        medError({ id: "pr7", policy_reviewed: false }),
      ]);
      // 2/3 = 66.666... -> Math.round(666.66)/10 = 66.7
      expect(m.policy_reviewed_rate).toBe(66.7);
    });
  });

  // ── lessons_learned_rate ─────────────────────────────────────────────────

  describe("lessons_learned_rate", () => {
    it("returns 100 when all have lessons learned (non-null)", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "ll1", lessons_learned: "Lesson A" }),
        medError({ id: "ll2", lessons_learned: "Lesson B" }),
      ]);
      expect(m.lessons_learned_rate).toBe(100);
    });

    it("returns 0 when all lessons_learned are null", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "ll3", lessons_learned: null }),
        medError({ id: "ll4", lessons_learned: null }),
      ]);
      expect(m.lessons_learned_rate).toBe(0);
    });

    it("calculates partial rate correctly", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "ll5", lessons_learned: "Some lesson" }),
        medError({ id: "ll6", lessons_learned: null }),
      ]);
      expect(m.lessons_learned_rate).toBe(50);
    });

    it("treats empty string as non-null (counted)", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "ll7", lessons_learned: "" }),
      ]);
      // empty string !== null so it counts
      expect(m.lessons_learned_rate).toBe(100);
    });
  });

  // ── by_error_type breakdown ──────────────────────────────────────────────

  describe("by_error_type breakdown", () => {
    it("groups errors by error_type", () => {
      const errors = [
        medError({ id: "bt1", error_type: "wrong_dose" }),
        medError({ id: "bt2", error_type: "wrong_dose" }),
        medError({ id: "bt3", error_type: "omission" }),
        medError({ id: "bt4", error_type: "near_miss" }),
      ];
      const m = computeMedErrorMetrics(errors);
      expect(m.by_error_type).toEqual({
        wrong_dose: 2,
        omission: 1,
        near_miss: 1,
      });
    });

    it("handles single type", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "bt5", error_type: "documentation_error" }),
      ]);
      expect(m.by_error_type).toEqual({ documentation_error: 1 });
    });

    it("handles all different types", () => {
      const types: ErrorType[] = [
        "wrong_dose", "wrong_medication", "wrong_time", "wrong_child",
        "omission", "double_dose", "wrong_route", "expired_medication",
        "documentation_error", "storage_error", "near_miss", "other",
      ];
      const errors = types.map((t, i) =>
        medError({ id: `bt-all-${i}`, error_type: t }),
      );
      const m = computeMedErrorMetrics(errors);
      for (const t of types) {
        expect(m.by_error_type[t]).toBe(1);
      }
      expect(Object.keys(m.by_error_type)).toHaveLength(12);
    });
  });

  // ── by_severity breakdown ────────────────────────────────────────────────

  describe("by_severity breakdown", () => {
    it("groups errors by error_severity", () => {
      const errors = [
        medError({ id: "bs1", error_severity: "no_harm" }),
        medError({ id: "bs2", error_severity: "no_harm" }),
        medError({ id: "bs3", error_severity: "low_harm" }),
        medError({ id: "bs4", error_severity: "severe_harm" }),
        medError({ id: "bs5", error_severity: "death" }),
      ];
      const m = computeMedErrorMetrics(errors);
      expect(m.by_severity).toEqual({
        no_harm: 2,
        low_harm: 1,
        severe_harm: 1,
        death: 1,
      });
    });

    it("handles all severity levels", () => {
      const sevs: ErrorSeverity[] = ["no_harm", "low_harm", "moderate_harm", "severe_harm", "death"];
      const errors = sevs.map((s, i) =>
        medError({ id: `bs-all-${i}`, error_severity: s }),
      );
      const m = computeMedErrorMetrics(errors);
      for (const s of sevs) {
        expect(m.by_severity[s]).toBe(1);
      }
    });
  });

  // ── by_root_cause breakdown ──────────────────────────────────────────────

  describe("by_root_cause breakdown", () => {
    it("groups errors by root_cause", () => {
      const errors = [
        medError({ id: "bc1", root_cause: "human_error" }),
        medError({ id: "bc2", root_cause: "human_error" }),
        medError({ id: "bc3", root_cause: "training_gap" }),
        medError({ id: "bc4", root_cause: "system_failure" }),
      ];
      const m = computeMedErrorMetrics(errors);
      expect(m.by_root_cause).toEqual({
        human_error: 2,
        training_gap: 1,
        system_failure: 1,
      });
    });

    it("handles all root causes", () => {
      const causes: RootCause[] = [
        "human_error", "system_failure", "training_gap", "communication_breakdown",
        "workload_pressure", "unclear_instructions", "equipment_failure",
        "environmental_factor", "under_investigation", "other",
      ];
      const errors = causes.map((c, i) =>
        medError({ id: `bc-all-${i}`, root_cause: c }),
      );
      const m = computeMedErrorMetrics(errors);
      for (const c of causes) {
        expect(m.by_root_cause[c]).toBe(1);
      }
      expect(Object.keys(m.by_root_cause)).toHaveLength(10);
    });
  });

  // ── by_investigation_status breakdown ────────────────────────────────────

  describe("by_investigation_status breakdown", () => {
    it("groups errors by investigation_status", () => {
      const errors = [
        medError({ id: "bi1", investigation_status: "reported" }),
        medError({ id: "bi2", investigation_status: "reported" }),
        medError({ id: "bi3", investigation_status: "closed" }),
      ];
      const m = computeMedErrorMetrics(errors);
      expect(m.by_investigation_status).toEqual({
        reported: 2,
        closed: 1,
      });
    });

    it("handles all investigation statuses", () => {
      const statuses: InvestigationStatus[] = [
        "reported", "under_investigation", "investigation_complete",
        "actions_identified", "actions_completed", "closed",
      ];
      const errors = statuses.map((s, i) =>
        medError({ id: `bi-all-${i}`, investigation_status: s }),
      );
      const m = computeMedErrorMetrics(errors);
      for (const s of statuses) {
        expect(m.by_investigation_status[s]).toBe(1);
      }
      expect(Object.keys(m.by_investigation_status)).toHaveLength(6);
    });
  });

  // ── Multiple errors — comprehensive scenario ────────────────────────────

  describe("multiple errors — comprehensive scenario", () => {
    const errors = [
      medError({
        id: "comp-1",
        error_type: "wrong_dose",
        error_severity: "low_harm",
        child_harmed: true,
        medical_attention_required: true,
        parent_informed: true,
        duty_of_candour_applied: true,
        ofsted_notified: true,
        policy_reviewed: true,
        lessons_learned: "Staff retraining completed",
        investigation_status: "closed",
        root_cause: "human_error",
      }),
      medError({
        id: "comp-2",
        error_type: "near_miss",
        error_severity: "no_harm",
        child_harmed: false,
        medical_attention_required: false,
        parent_informed: false,
        duty_of_candour_applied: false,
        ofsted_notified: false,
        policy_reviewed: false,
        lessons_learned: null,
        investigation_status: "reported",
        root_cause: "training_gap",
      }),
      medError({
        id: "comp-3",
        error_type: "omission",
        error_severity: "severe_harm",
        child_harmed: true,
        medical_attention_required: true,
        parent_informed: true,
        duty_of_candour_applied: true,
        ofsted_notified: true,
        policy_reviewed: true,
        lessons_learned: "Medication round process updated",
        investigation_status: "actions_identified",
        actions_completed: false,
        root_cause: "workload_pressure",
      }),
      medError({
        id: "comp-4",
        error_type: "wrong_medication",
        error_severity: "death",
        child_harmed: true,
        medical_attention_required: true,
        parent_informed: false,
        duty_of_candour_applied: false,
        ofsted_notified: true,
        policy_reviewed: false,
        lessons_learned: null,
        investigation_status: "under_investigation",
        root_cause: "communication_breakdown",
      }),
    ];
    const m = computeMedErrorMetrics(errors);

    it("total_errors is 4", () => {
      expect(m.total_errors).toBe(4);
    });

    it("near_miss_count is 1", () => {
      expect(m.near_miss_count).toBe(1);
    });

    it("actual_error_count is 3", () => {
      expect(m.actual_error_count).toBe(3);
    });

    it("no_harm_count is 1", () => {
      expect(m.no_harm_count).toBe(1);
    });

    it("harm_caused_count is 3", () => {
      expect(m.harm_caused_count).toBe(3);
    });

    it("severe_harm_count is 2 (severe_harm + death)", () => {
      expect(m.severe_harm_count).toBe(2);
    });

    it("child_harmed_count is 3", () => {
      expect(m.child_harmed_count).toBe(3);
    });

    it("medical_attention_count is 3", () => {
      expect(m.medical_attention_count).toBe(3);
    });

    it("open_investigations is 2 (reported + under_investigation)", () => {
      expect(m.open_investigations).toBe(2);
    });

    it("actions_outstanding is 1 (actions_identified && !completed)", () => {
      expect(m.actions_outstanding).toBe(1);
    });

    it("parent_informed_rate is 50 (2/4)", () => {
      expect(m.parent_informed_rate).toBe(50);
    });

    it("duty_of_candour_rate is 50 (2/4)", () => {
      expect(m.duty_of_candour_rate).toBe(50);
    });

    it("ofsted_notified_count is 3", () => {
      expect(m.ofsted_notified_count).toBe(3);
    });

    it("policy_reviewed_rate is 50 (2/4)", () => {
      expect(m.policy_reviewed_rate).toBe(50);
    });

    it("lessons_learned_rate is 50 (2/4)", () => {
      expect(m.lessons_learned_rate).toBe(50);
    });

    it("by_error_type is correct", () => {
      expect(m.by_error_type).toEqual({
        wrong_dose: 1,
        near_miss: 1,
        omission: 1,
        wrong_medication: 1,
      });
    });

    it("by_severity is correct", () => {
      expect(m.by_severity).toEqual({
        low_harm: 1,
        no_harm: 1,
        severe_harm: 1,
        death: 1,
      });
    });

    it("by_root_cause is correct", () => {
      expect(m.by_root_cause).toEqual({
        human_error: 1,
        training_gap: 1,
        workload_pressure: 1,
        communication_breakdown: 1,
      });
    });

    it("by_investigation_status is correct", () => {
      expect(m.by_investigation_status).toEqual({
        closed: 1,
        reported: 1,
        actions_identified: 1,
        under_investigation: 1,
      });
    });
  });

  // ── Rate rounding edge cases ─────────────────────────────────────────────

  describe("rate rounding edge cases", () => {
    it("handles 1/7 correctly (14.3)", () => {
      const errors = Array.from({ length: 7 }, (_, i) =>
        medError({ id: `r7-${i}`, parent_informed: i === 0 }),
      );
      const m = computeMedErrorMetrics(errors);
      // 1/7 = 14.2857... -> Math.round(142.857)/10 = 14.3
      expect(m.parent_informed_rate).toBe(14.3);
    });

    it("handles 5/6 correctly (83.3)", () => {
      const errors = Array.from({ length: 6 }, (_, i) =>
        medError({ id: `r6-${i}`, policy_reviewed: i < 5 }),
      );
      const m = computeMedErrorMetrics(errors);
      // 5/6 = 83.333... -> Math.round(833.33)/10 = 83.3
      expect(m.policy_reviewed_rate).toBe(83.3);
    });

    it("returns exactly 100 for single true entry", () => {
      const m = computeMedErrorMetrics([
        medError({ id: "r100", duty_of_candour_applied: true }),
      ]);
      expect(m.duty_of_candour_rate).toBe(100);
    });
  });

  // ── All metrics fields present ───────────────────────────────────────────

  describe("all metric fields present", () => {
    it("returns an object with exactly 19 keys", () => {
      const m = computeMedErrorMetrics([]);
      const keys = Object.keys(m);
      expect(keys).toHaveLength(19);
    });

    it("contains all expected fields", () => {
      const m = computeMedErrorMetrics([]);
      const expectedFields = [
        "total_errors",
        "near_miss_count",
        "actual_error_count",
        "no_harm_count",
        "harm_caused_count",
        "severe_harm_count",
        "child_harmed_count",
        "medical_attention_count",
        "open_investigations",
        "actions_outstanding",
        "parent_informed_rate",
        "duty_of_candour_rate",
        "ofsted_notified_count",
        "policy_reviewed_rate",
        "lessons_learned_rate",
        "by_error_type",
        "by_severity",
        "by_root_cause",
        "by_investigation_status",
      ];
      for (const field of expectedFields) {
        expect(m).toHaveProperty(field);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// identifyMedErrorAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyMedErrorAlerts", () => {
  // ── No alerts ────────────────────────────────────────────────────────────

  describe("no alerts when conditions not met", () => {
    it("returns empty array for empty input", () => {
      expect(identifyMedErrorAlerts([])).toEqual([]);
    });

    it("returns no alerts for a benign closed error", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "safe-1",
          error_severity: "no_harm",
          child_harmed: false,
          parent_informed: true,
          investigation_status: "closed",
          actions_completed: true,
          root_cause: "human_error",
        }),
      ]);
      expect(alerts).toEqual([]);
    });

    it("returns no alerts when low_harm, parent informed, investigation complete", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "safe-2",
          error_severity: "low_harm",
          child_harmed: false,
          parent_informed: true,
          investigation_status: "investigation_complete",
          actions_completed: true,
          root_cause: "system_failure",
        }),
      ]);
      expect(alerts).toEqual([]);
    });

    it("returns no alerts when moderate_harm but parent informed and no outstanding issues", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "safe-3",
          error_severity: "moderate_harm",
          child_harmed: false,
          parent_informed: true,
          investigation_status: "actions_completed",
          actions_completed: true,
          root_cause: "human_error",
        }),
      ]);
      expect(alerts).toEqual([]);
    });

    it("returns no alerts for single training_gap (needs >=2)", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "safe-4",
          error_severity: "no_harm",
          child_harmed: false,
          parent_informed: true,
          investigation_status: "closed",
          root_cause: "training_gap",
        }),
      ]);
      expect(alerts).toEqual([]);
    });
  });

  // ── severe_error alerts ──────────────────────────────────────────────────

  describe("severe_error alerts (severe_harm and death)", () => {
    it("generates alert for severe_harm", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "sev-1",
          error_severity: "severe_harm",
          error_type: "wrong_dose",
          child_name: "Jamie",
          medication_name: "Ritalin",
          parent_informed: true,
          investigation_status: "closed",
        }),
      ]);
      const severe = alerts.filter((a) => a.type === "severe_error");
      expect(severe).toHaveLength(1);
      expect(severe[0].severity).toBe("critical");
      expect(severe[0].id).toBe("sev-1");
      expect(severe[0].message).toContain("Jamie");
      expect(severe[0].message).toContain("Ritalin");
      expect(severe[0].message).toContain("wrong dose");
      expect(severe[0].message).toContain("severe harm");
    });

    it("generates alert for death", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "sev-2",
          error_severity: "death",
          error_type: "wrong_medication",
          child_name: "Sam",
          medication_name: "Morphine",
          parent_informed: true,
          investigation_status: "closed",
        }),
      ]);
      const severe = alerts.filter((a) => a.type === "severe_error");
      expect(severe).toHaveLength(1);
      expect(severe[0].severity).toBe("critical");
      expect(severe[0].message).toContain("death");
    });

    it("does not generate severe_error for no_harm", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "sev-3",
          error_severity: "no_harm",
          parent_informed: true,
          investigation_status: "closed",
        }),
      ]);
      expect(alerts.filter((a) => a.type === "severe_error")).toHaveLength(0);
    });

    it("does not generate severe_error for low_harm", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "sev-4",
          error_severity: "low_harm",
          parent_informed: true,
          investigation_status: "closed",
        }),
      ]);
      expect(alerts.filter((a) => a.type === "severe_error")).toHaveLength(0);
    });

    it("does not generate severe_error for moderate_harm", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "sev-5",
          error_severity: "moderate_harm",
          parent_informed: true,
          investigation_status: "closed",
        }),
      ]);
      expect(alerts.filter((a) => a.type === "severe_error")).toHaveLength(0);
    });

    it("generates multiple severe_error alerts for multiple severe errors", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "sev-6",
          error_severity: "severe_harm",
          parent_informed: true,
          investigation_status: "closed",
        }),
        medError({
          id: "sev-7",
          error_severity: "death",
          parent_informed: true,
          investigation_status: "closed",
        }),
      ]);
      const severe = alerts.filter((a) => a.type === "severe_error");
      expect(severe).toHaveLength(2);
    });

    it("message replaces underscores with spaces in error_type", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "sev-8",
          error_severity: "severe_harm",
          error_type: "expired_medication",
          parent_informed: true,
          investigation_status: "closed",
        }),
      ]);
      const severe = alerts.filter((a) => a.type === "severe_error");
      expect(severe[0].message).toContain("expired medication");
      expect(severe[0].message).not.toContain("expired_medication");
    });

    it("message replaces underscores with spaces in severity", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "sev-9",
          error_severity: "severe_harm",
          error_type: "wrong_dose",
          parent_informed: true,
          investigation_status: "closed",
        }),
      ]);
      const severe = alerts.filter((a) => a.type === "severe_error");
      expect(severe[0].message).toContain("severe harm");
      expect(severe[0].message).not.toContain("severe_harm");
    });
  });

  // ── parent_not_informed alerts ───────────────────────────────────────────

  describe("parent_not_informed alerts (child_harmed && !parent_informed)", () => {
    it("generates alert when child harmed and parent not informed", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "pni-1",
          child_harmed: true,
          parent_informed: false,
          child_name: "Jordan",
          error_severity: "no_harm",
          investigation_status: "closed",
        }),
      ]);
      const pni = alerts.filter((a) => a.type === "parent_not_informed");
      expect(pni).toHaveLength(1);
      expect(pni[0].severity).toBe("critical");
      expect(pni[0].id).toBe("pni-1");
      expect(pni[0].message).toContain("Jordan");
      expect(pni[0].message).toContain("duty of candour");
    });

    it("does not generate alert when child harmed but parent informed", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "pni-2",
          child_harmed: true,
          parent_informed: true,
          error_severity: "no_harm",
          investigation_status: "closed",
        }),
      ]);
      expect(alerts.filter((a) => a.type === "parent_not_informed")).toHaveLength(0);
    });

    it("does not generate alert when child not harmed and parent not informed", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "pni-3",
          child_harmed: false,
          parent_informed: false,
          error_severity: "no_harm",
          investigation_status: "closed",
        }),
      ]);
      expect(alerts.filter((a) => a.type === "parent_not_informed")).toHaveLength(0);
    });

    it("does not generate alert when child not harmed and parent informed", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "pni-4",
          child_harmed: false,
          parent_informed: true,
          error_severity: "no_harm",
          investigation_status: "closed",
        }),
      ]);
      expect(alerts.filter((a) => a.type === "parent_not_informed")).toHaveLength(0);
    });

    it("generates multiple parent_not_informed alerts", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "pni-5",
          child_harmed: true,
          parent_informed: false,
          error_severity: "no_harm",
          investigation_status: "closed",
        }),
        medError({
          id: "pni-6",
          child_harmed: true,
          parent_informed: false,
          error_severity: "no_harm",
          investigation_status: "closed",
        }),
      ]);
      expect(alerts.filter((a) => a.type === "parent_not_informed")).toHaveLength(2);
    });
  });

  // ── actions_outstanding alerts ───────────────────────────────────────────

  describe("actions_outstanding alerts", () => {
    it("generates alert when actions_identified and not completed", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "act-1",
          investigation_status: "actions_identified",
          actions_completed: false,
          child_name: "Riley",
          medication_name: "Paracetamol",
          error_severity: "no_harm",
          parent_informed: true,
        }),
      ]);
      const outstanding = alerts.filter((a) => a.type === "actions_outstanding");
      expect(outstanding).toHaveLength(1);
      expect(outstanding[0].severity).toBe("high");
      expect(outstanding[0].id).toBe("act-1");
      expect(outstanding[0].message).toContain("Riley");
      expect(outstanding[0].message).toContain("Paracetamol");
    });

    it("does not generate alert when actions_identified and completed", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "act-2",
          investigation_status: "actions_identified",
          actions_completed: true,
          error_severity: "no_harm",
          parent_informed: true,
        }),
      ]);
      expect(alerts.filter((a) => a.type === "actions_outstanding")).toHaveLength(0);
    });

    it("does not generate alert when status is not actions_identified", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "act-3",
          investigation_status: "under_investigation",
          actions_completed: false,
          error_severity: "no_harm",
          parent_informed: true,
        }),
      ]);
      expect(alerts.filter((a) => a.type === "actions_outstanding")).toHaveLength(0);
    });

    it("generates multiple actions_outstanding alerts", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "act-4",
          investigation_status: "actions_identified",
          actions_completed: false,
          error_severity: "no_harm",
          parent_informed: true,
        }),
        medError({
          id: "act-5",
          investigation_status: "actions_identified",
          actions_completed: false,
          error_severity: "no_harm",
          parent_informed: true,
        }),
      ]);
      expect(alerts.filter((a) => a.type === "actions_outstanding")).toHaveLength(2);
    });
  });

  // ── training_gap_pattern alerts ──────────────────────────────────────────

  describe("training_gap_pattern alerts (>=2 training_gap root causes)", () => {
    it("generates alert when exactly 2 training_gap errors", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "tg-1",
          root_cause: "training_gap",
          error_severity: "no_harm",
          parent_informed: true,
          investigation_status: "closed",
        }),
        medError({
          id: "tg-2",
          root_cause: "training_gap",
          error_severity: "no_harm",
          parent_informed: true,
          investigation_status: "closed",
        }),
      ]);
      const tgAlerts = alerts.filter((a) => a.type === "training_gap_pattern");
      expect(tgAlerts).toHaveLength(1);
      expect(tgAlerts[0].severity).toBe("high");
      expect(tgAlerts[0].id).toBe("training_pattern");
      expect(tgAlerts[0].message).toContain("2");
      expect(tgAlerts[0].message).toContain("training gaps");
    });

    it("generates alert when 3+ training_gap errors", () => {
      const alerts = identifyMedErrorAlerts([
        medError({ id: "tg-3a", root_cause: "training_gap", error_severity: "no_harm", parent_informed: true, investigation_status: "closed" }),
        medError({ id: "tg-3b", root_cause: "training_gap", error_severity: "no_harm", parent_informed: true, investigation_status: "closed" }),
        medError({ id: "tg-3c", root_cause: "training_gap", error_severity: "no_harm", parent_informed: true, investigation_status: "closed" }),
      ]);
      const tgAlerts = alerts.filter((a) => a.type === "training_gap_pattern");
      expect(tgAlerts).toHaveLength(1);
      expect(tgAlerts[0].message).toContain("3");
    });

    it("does not generate alert for 1 training_gap error", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "tg-4",
          root_cause: "training_gap",
          error_severity: "no_harm",
          parent_informed: true,
          investigation_status: "closed",
        }),
      ]);
      expect(alerts.filter((a) => a.type === "training_gap_pattern")).toHaveLength(0);
    });

    it("does not generate alert for 0 training_gap errors", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "tg-5",
          root_cause: "human_error",
          error_severity: "no_harm",
          parent_informed: true,
          investigation_status: "closed",
        }),
      ]);
      expect(alerts.filter((a) => a.type === "training_gap_pattern")).toHaveLength(0);
    });

    it("only counts training_gap root causes, not others", () => {
      const alerts = identifyMedErrorAlerts([
        medError({ id: "tg-6a", root_cause: "training_gap", error_severity: "no_harm", parent_informed: true, investigation_status: "closed" }),
        medError({ id: "tg-6b", root_cause: "human_error", error_severity: "no_harm", parent_informed: true, investigation_status: "closed" }),
        medError({ id: "tg-6c", root_cause: "system_failure", error_severity: "no_harm", parent_informed: true, investigation_status: "closed" }),
      ]);
      expect(alerts.filter((a) => a.type === "training_gap_pattern")).toHaveLength(0);
    });

    it("generates exactly one training_gap_pattern alert regardless of count", () => {
      const errors = Array.from({ length: 5 }, (_, i) =>
        medError({
          id: `tg-many-${i}`,
          root_cause: "training_gap",
          error_severity: "no_harm",
          parent_informed: true,
          investigation_status: "closed",
        }),
      );
      const alerts = identifyMedErrorAlerts(errors);
      expect(alerts.filter((a) => a.type === "training_gap_pattern")).toHaveLength(1);
    });
  });

  // ── not_investigated alerts ──────────────────────────────────────────────

  describe("not_investigated alerts (status reported)", () => {
    it("generates alert when status is reported", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "ni-1",
          investigation_status: "reported",
          child_name: "Taylor",
          medication_name: "Ibuprofen",
          error_severity: "no_harm",
          parent_informed: true,
        }),
      ]);
      const niAlerts = alerts.filter((a) => a.type === "not_investigated");
      expect(niAlerts).toHaveLength(1);
      expect(niAlerts[0].severity).toBe("medium");
      expect(niAlerts[0].id).toBe("ni-1");
      expect(niAlerts[0].message).toContain("Taylor");
      expect(niAlerts[0].message).toContain("Ibuprofen");
      expect(niAlerts[0].message).toContain("not yet investigated");
    });

    it("does not generate alert for under_investigation status", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "ni-2",
          investigation_status: "under_investigation",
          error_severity: "no_harm",
          parent_informed: true,
        }),
      ]);
      expect(alerts.filter((a) => a.type === "not_investigated")).toHaveLength(0);
    });

    it("does not generate alert for closed status", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "ni-3",
          investigation_status: "closed",
          error_severity: "no_harm",
          parent_informed: true,
        }),
      ]);
      expect(alerts.filter((a) => a.type === "not_investigated")).toHaveLength(0);
    });

    it("does not generate alert for investigation_complete status", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "ni-4",
          investigation_status: "investigation_complete",
          error_severity: "no_harm",
          parent_informed: true,
        }),
      ]);
      expect(alerts.filter((a) => a.type === "not_investigated")).toHaveLength(0);
    });

    it("does not generate alert for actions_identified status", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "ni-5",
          investigation_status: "actions_identified",
          actions_completed: true,
          error_severity: "no_harm",
          parent_informed: true,
        }),
      ]);
      expect(alerts.filter((a) => a.type === "not_investigated")).toHaveLength(0);
    });

    it("does not generate alert for actions_completed status", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "ni-6",
          investigation_status: "actions_completed",
          error_severity: "no_harm",
          parent_informed: true,
        }),
      ]);
      expect(alerts.filter((a) => a.type === "not_investigated")).toHaveLength(0);
    });

    it("generates multiple not_investigated alerts", () => {
      const alerts = identifyMedErrorAlerts([
        medError({ id: "ni-7", investigation_status: "reported", error_severity: "no_harm", parent_informed: true }),
        medError({ id: "ni-8", investigation_status: "reported", error_severity: "no_harm", parent_informed: true }),
        medError({ id: "ni-9", investigation_status: "reported", error_severity: "no_harm", parent_informed: true }),
      ]);
      expect(alerts.filter((a) => a.type === "not_investigated")).toHaveLength(3);
    });
  });

  // ── Mixed scenarios ──────────────────────────────────────────────────────

  describe("mixed scenarios", () => {
    it("generates all alert types simultaneously", () => {
      const alerts = identifyMedErrorAlerts([
        // severe_error
        medError({
          id: "mix-1",
          error_severity: "severe_harm",
          child_harmed: false,
          parent_informed: true,
          investigation_status: "closed",
          root_cause: "training_gap",
        }),
        // parent_not_informed
        medError({
          id: "mix-2",
          error_severity: "no_harm",
          child_harmed: true,
          parent_informed: false,
          investigation_status: "closed",
          root_cause: "training_gap",
        }),
        // actions_outstanding
        medError({
          id: "mix-3",
          error_severity: "no_harm",
          child_harmed: false,
          parent_informed: true,
          investigation_status: "actions_identified",
          actions_completed: false,
          root_cause: "human_error",
        }),
        // not_investigated
        medError({
          id: "mix-4",
          error_severity: "no_harm",
          child_harmed: false,
          parent_informed: true,
          investigation_status: "reported",
          root_cause: "human_error",
        }),
      ]);

      // training_gap_pattern (2 training_gap errors: mix-1 and mix-2)
      expect(alerts.filter((a) => a.type === "severe_error")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "parent_not_informed")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "actions_outstanding")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "training_gap_pattern")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "not_investigated")).toHaveLength(1);
      expect(alerts).toHaveLength(5);
    });

    it("severe_harm error that is also parent_not_informed generates both alerts", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "mix-5",
          error_severity: "severe_harm",
          child_harmed: true,
          parent_informed: false,
          investigation_status: "closed",
        }),
      ]);
      expect(alerts.filter((a) => a.type === "severe_error")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "parent_not_informed")).toHaveLength(1);
      expect(alerts).toHaveLength(2);
    });

    it("death error with actions outstanding and not investigated generates correct alerts", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "mix-6",
          error_severity: "death",
          child_harmed: true,
          parent_informed: false,
          investigation_status: "reported",
        }),
      ]);
      // severe_error (death) + parent_not_informed + not_investigated
      expect(alerts.filter((a) => a.type === "severe_error")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "parent_not_informed")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "not_investigated")).toHaveLength(1);
      expect(alerts).toHaveLength(3);
    });

    it("error with actions_identified but reported status does not trigger actions_outstanding", () => {
      // Only actions_identified status triggers actions_outstanding
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "mix-7",
          error_severity: "no_harm",
          child_harmed: false,
          parent_informed: true,
          investigation_status: "reported",
          actions_completed: false,
        }),
      ]);
      expect(alerts.filter((a) => a.type === "actions_outstanding")).toHaveLength(0);
      expect(alerts.filter((a) => a.type === "not_investigated")).toHaveLength(1);
    });
  });

  // ── Alert ordering ───────────────────────────────────────────────────────

  describe("alert ordering", () => {
    it("severe_error alerts appear before parent_not_informed", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "order-1",
          error_severity: "severe_harm",
          child_harmed: true,
          parent_informed: false,
          investigation_status: "closed",
        }),
      ]);
      const sevIdx = alerts.findIndex((a) => a.type === "severe_error");
      const pniIdx = alerts.findIndex((a) => a.type === "parent_not_informed");
      expect(sevIdx).toBeLessThan(pniIdx);
    });

    it("parent_not_informed alerts appear before actions_outstanding", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "order-2",
          error_severity: "no_harm",
          child_harmed: true,
          parent_informed: false,
          investigation_status: "actions_identified",
          actions_completed: false,
        }),
      ]);
      const pniIdx = alerts.findIndex((a) => a.type === "parent_not_informed");
      const actIdx = alerts.findIndex((a) => a.type === "actions_outstanding");
      expect(pniIdx).toBeLessThan(actIdx);
    });

    it("actions_outstanding alerts appear before training_gap_pattern", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "order-3",
          error_severity: "no_harm",
          child_harmed: false,
          parent_informed: true,
          investigation_status: "actions_identified",
          actions_completed: false,
          root_cause: "training_gap",
        }),
        medError({
          id: "order-4",
          error_severity: "no_harm",
          child_harmed: false,
          parent_informed: true,
          investigation_status: "closed",
          root_cause: "training_gap",
        }),
      ]);
      const actIdx = alerts.findIndex((a) => a.type === "actions_outstanding");
      const tgIdx = alerts.findIndex((a) => a.type === "training_gap_pattern");
      expect(actIdx).toBeLessThan(tgIdx);
    });

    it("training_gap_pattern alerts appear before not_investigated", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "order-5",
          root_cause: "training_gap",
          error_severity: "no_harm",
          parent_informed: true,
          investigation_status: "closed",
        }),
        medError({
          id: "order-6",
          root_cause: "training_gap",
          error_severity: "no_harm",
          parent_informed: true,
          investigation_status: "reported",
        }),
      ]);
      const tgIdx = alerts.findIndex((a) => a.type === "training_gap_pattern");
      const niIdx = alerts.findIndex((a) => a.type === "not_investigated");
      expect(tgIdx).toBeLessThan(niIdx);
    });
  });

  // ── Alert shape ──────────────────────────────────────────────────────────

  describe("alert shape", () => {
    it("each alert has type, severity, message, and id", () => {
      const alerts = identifyMedErrorAlerts([
        medError({
          id: "shape-1",
          error_severity: "severe_harm",
          child_harmed: true,
          parent_informed: false,
          investigation_status: "reported",
          root_cause: "training_gap",
        }),
        medError({
          id: "shape-2",
          error_severity: "no_harm",
          investigation_status: "actions_identified",
          actions_completed: false,
          parent_informed: true,
          root_cause: "training_gap",
        }),
      ]);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
        expect(typeof alert.type).toBe("string");
        expect(typeof alert.message).toBe("string");
        expect(typeof alert.id).toBe("string");
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("severity levels: severe_error is critical", () => {
      const alerts = identifyMedErrorAlerts([
        medError({ id: "sev-level-1", error_severity: "death", parent_informed: true, investigation_status: "closed" }),
      ]);
      expect(alerts.find((a) => a.type === "severe_error")!.severity).toBe("critical");
    });

    it("severity levels: parent_not_informed is critical", () => {
      const alerts = identifyMedErrorAlerts([
        medError({ id: "sev-level-2", child_harmed: true, parent_informed: false, error_severity: "no_harm", investigation_status: "closed" }),
      ]);
      expect(alerts.find((a) => a.type === "parent_not_informed")!.severity).toBe("critical");
    });

    it("severity levels: actions_outstanding is high", () => {
      const alerts = identifyMedErrorAlerts([
        medError({ id: "sev-level-3", investigation_status: "actions_identified", actions_completed: false, error_severity: "no_harm", parent_informed: true }),
      ]);
      expect(alerts.find((a) => a.type === "actions_outstanding")!.severity).toBe("high");
    });

    it("severity levels: training_gap_pattern is high", () => {
      const alerts = identifyMedErrorAlerts([
        medError({ id: "sev-level-4a", root_cause: "training_gap", error_severity: "no_harm", parent_informed: true, investigation_status: "closed" }),
        medError({ id: "sev-level-4b", root_cause: "training_gap", error_severity: "no_harm", parent_informed: true, investigation_status: "closed" }),
      ]);
      expect(alerts.find((a) => a.type === "training_gap_pattern")!.severity).toBe("high");
    });

    it("severity levels: not_investigated is medium", () => {
      const alerts = identifyMedErrorAlerts([
        medError({ id: "sev-level-5", investigation_status: "reported", error_severity: "no_harm", parent_informed: true }),
      ]);
      expect(alerts.find((a) => a.type === "not_investigated")!.severity).toBe("medium");
    });
  });
});
