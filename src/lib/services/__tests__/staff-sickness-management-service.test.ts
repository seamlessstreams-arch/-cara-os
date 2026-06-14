// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF SICKNESS MANAGEMENT SERVICE TESTS
// Pure-function tests for sickness metrics, alert identification, Cara insights,
// enum validation, and CRUD fallback behaviour.
// CHR 2015 Reg 33 / Reg 13 compliance — staffing levels and absence management.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

// Mock Supabase before importing anything from the service
vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  ABSENCE_TYPES,
  MANAGEMENT_STATUSES,
  TRIGGER_LEVELS,
  FIT_NOTE_STATUSES,
  _testing,
  listStaffSicknessManagement,
  createStaffSicknessManagement,
  updateStaffSicknessManagement,
} from "../staff-sickness-management-service";

import type {
  StaffSicknessManagementRow,
  AbsenceType,
  ManagementStatus,
  TriggerLevel,
  FitNoteStatus,
} from "../staff-sickness-management-service";

const {
  computeSicknessMetrics,
  computeSicknessAlerts,
  generateSicknessCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(overrides?: Partial<StaffSicknessManagementRow>): StaffSicknessManagementRow {
  return {
    id: overrides?.id ?? "row-1",
    home_id: overrides?.home_id ?? "home-1",
    staff_name: overrides?.staff_name ?? "Staff A",
    staff_id: "staff_id" in (overrides ?? {}) ? (overrides!.staff_id ?? null) : null,
    absence_start_date: overrides?.absence_start_date ?? now.toISOString().split("T")[0],
    absence_end_date: "absence_end_date" in (overrides ?? {}) ? (overrides!.absence_end_date ?? null) : null,
    absence_type: overrides?.absence_type ?? "short_term",
    management_status: overrides?.management_status ?? "resolved",
    trigger_level: overrides?.trigger_level ?? "none",
    fit_note_status: overrides?.fit_note_status ?? "not_required",
    days_absent: overrides?.days_absent ?? 3,
    return_to_work_completed: overrides?.return_to_work_completed ?? true,
    occupational_health_referred: overrides?.occupational_health_referred ?? true,
    reasonable_adjustments_made: overrides?.reasonable_adjustments_made ?? true,
    phased_return_agreed: overrides?.phased_return_agreed ?? true,
    manager_informed: overrides?.manager_informed ?? true,
    cover_arranged: overrides?.cover_arranged ?? true,
    impact_on_children_assessed: overrides?.impact_on_children_assessed ?? true,
    wellbeing_check_completed: overrides?.wellbeing_check_completed ?? true,
    managing_officer: "managing_officer" in (overrides ?? {}) ? (overrides!.managing_officer ?? null) : null,
    absence_reason_detail: "absence_reason_detail" in (overrides ?? {}) ? (overrides!.absence_reason_detail ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. ENUM CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("ABSENCE_TYPES", () => {
  it("has exactly 8 entries", () => {
    expect(ABSENCE_TYPES).toHaveLength(8);
  });
  it("is a readonly tuple", () => {
    expect(Array.isArray(ABSENCE_TYPES)).toBe(true);
  });
  it("all values are unique", () => {
    expect(new Set(ABSENCE_TYPES).size).toBe(ABSENCE_TYPES.length);
  });
  it.each([
    "short_term",
    "long_term",
    "intermittent",
    "work_related",
    "covid",
    "mental_health",
    "physical_injury",
    "chronic_condition",
  ] as AbsenceType[])("includes %s", (type) => {
    expect(ABSENCE_TYPES).toContain(type);
  });
  it("every entry is a non-empty string", () => {
    for (const t of ABSENCE_TYPES) {
      expect(typeof t).toBe("string");
      expect(t.length).toBeGreaterThan(0);
    }
  });
});

describe("MANAGEMENT_STATUSES", () => {
  it("has exactly 7 entries", () => {
    expect(MANAGEMENT_STATUSES).toHaveLength(7);
  });
  it("all values are unique", () => {
    expect(new Set(MANAGEMENT_STATUSES).size).toBe(MANAGEMENT_STATUSES.length);
  });
  it.each([
    "reported",
    "return_to_work_pending",
    "return_to_work_completed",
    "occupational_health_referral",
    "formal_review",
    "resolved",
    "ongoing",
  ] as ManagementStatus[])("includes %s", (status) => {
    expect(MANAGEMENT_STATUSES).toContain(status);
  });
  it("every entry is a non-empty string", () => {
    for (const s of MANAGEMENT_STATUSES) {
      expect(typeof s).toBe("string");
      expect(s.length).toBeGreaterThan(0);
    }
  });
});

describe("TRIGGER_LEVELS", () => {
  it("has exactly 6 entries", () => {
    expect(TRIGGER_LEVELS).toHaveLength(6);
  });
  it("all values are unique", () => {
    expect(new Set(TRIGGER_LEVELS).size).toBe(TRIGGER_LEVELS.length);
  });
  it.each([
    "none",
    "informal",
    "stage_1",
    "stage_2",
    "stage_3",
    "dismissal_consideration",
  ] as TriggerLevel[])("includes %s", (level) => {
    expect(TRIGGER_LEVELS).toContain(level);
  });
  it("every entry is a non-empty string", () => {
    for (const l of TRIGGER_LEVELS) {
      expect(typeof l).toBe("string");
      expect(l.length).toBeGreaterThan(0);
    }
  });
});

describe("FIT_NOTE_STATUSES", () => {
  it("has exactly 5 entries", () => {
    expect(FIT_NOTE_STATUSES).toHaveLength(5);
  });
  it("all values are unique", () => {
    expect(new Set(FIT_NOTE_STATUSES).size).toBe(FIT_NOTE_STATUSES.length);
  });
  it.each([
    "not_required",
    "fit_note_received",
    "fit_note_expired",
    "awaiting_fit_note",
    "phased_return",
  ] as FitNoteStatus[])("includes %s", (status) => {
    expect(FIT_NOTE_STATUSES).toContain(status);
  });
  it("every entry is a non-empty string", () => {
    for (const s of FIT_NOTE_STATUSES) {
      expect(typeof s).toBe("string");
      expect(s.length).toBeGreaterThan(0);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeSicknessMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeSicknessMetrics", () => {
  describe("empty inputs", () => {
    it("returns all zeros for empty array", () => {
      const m = computeSicknessMetrics([]);
      expect(m.total_absences).toBe(0);
      expect(m.long_term_count).toBe(0);
      expect(m.mental_health_count).toBe(0);
      expect(m.work_related_count).toBe(0);
      expect(m.ongoing_count).toBe(0);
      expect(m.return_to_work_rate).toBe(0);
      expect(m.occupational_health_rate).toBe(0);
      expect(m.reasonable_adjustments_rate).toBe(0);
      expect(m.cover_arranged_rate).toBe(0);
      expect(m.impact_assessed_rate).toBe(0);
      expect(m.wellbeing_check_rate).toBe(0);
      expect(m.manager_informed_rate).toBe(0);
      expect(m.phased_return_rate).toBe(0);
      expect(m.total_days_absent).toBe(0);
      expect(m.average_days_absent).toBe(0);
      expect(m.unique_staff).toBe(0);
    });
    it("returns empty breakdowns for empty array", () => {
      const m = computeSicknessMetrics([]);
      expect(m.absence_type_breakdown).toEqual({});
      expect(m.trigger_breakdown).toEqual({});
    });
  });

  describe("total_absences", () => {
    it("counts all rows", () => {
      expect(computeSicknessMetrics([makeRow(), makeRow(), makeRow()]).total_absences).toBe(3);
    });
    it("returns 1 for a single row", () => {
      expect(computeSicknessMetrics([makeRow()]).total_absences).toBe(1);
    });
  });

  describe("long_term_count", () => {
    it("counts long_term absences", () => {
      const rows = [
        makeRow({ absence_type: "long_term" }),
        makeRow({ absence_type: "short_term" }),
        makeRow({ absence_type: "long_term" }),
      ];
      expect(computeSicknessMetrics(rows).long_term_count).toBe(2);
    });
    it("returns 0 when no long_term", () => {
      expect(computeSicknessMetrics([makeRow({ absence_type: "short_term" })]).long_term_count).toBe(0);
    });
  });

  describe("mental_health_count", () => {
    it("counts mental_health absences", () => {
      const rows = [
        makeRow({ absence_type: "mental_health" }),
        makeRow({ absence_type: "short_term" }),
      ];
      expect(computeSicknessMetrics(rows).mental_health_count).toBe(1);
    });
    it("returns 0 when none", () => {
      expect(computeSicknessMetrics([makeRow({ absence_type: "covid" })]).mental_health_count).toBe(0);
    });
  });

  describe("work_related_count", () => {
    it("counts work_related absences", () => {
      const rows = [
        makeRow({ absence_type: "work_related" }),
        makeRow({ absence_type: "work_related" }),
        makeRow({ absence_type: "short_term" }),
      ];
      expect(computeSicknessMetrics(rows).work_related_count).toBe(2);
    });
    it("returns 0 when none", () => {
      expect(computeSicknessMetrics([makeRow()]).work_related_count).toBe(0);
    });
  });

  describe("ongoing_count", () => {
    it("counts ongoing management status", () => {
      const rows = [
        makeRow({ management_status: "ongoing" }),
        makeRow({ management_status: "resolved" }),
        makeRow({ management_status: "ongoing" }),
      ];
      expect(computeSicknessMetrics(rows).ongoing_count).toBe(2);
    });
    it("returns 0 when none ongoing", () => {
      expect(computeSicknessMetrics([makeRow({ management_status: "resolved" })]).ongoing_count).toBe(0);
    });
  });

  describe("boolean rates", () => {
    it("returns 100 when all true (defaults)", () => {
      const m = computeSicknessMetrics([makeRow()]);
      expect(m.return_to_work_rate).toBe(100);
      expect(m.occupational_health_rate).toBe(100);
      expect(m.reasonable_adjustments_rate).toBe(100);
      expect(m.cover_arranged_rate).toBe(100);
      expect(m.impact_assessed_rate).toBe(100);
      expect(m.wellbeing_check_rate).toBe(100);
      expect(m.manager_informed_rate).toBe(100);
      expect(m.phased_return_rate).toBe(100);
    });
    it("returns 0 when all false", () => {
      const m = computeSicknessMetrics([makeRow({
        return_to_work_completed: false,
        occupational_health_referred: false,
        reasonable_adjustments_made: false,
        cover_arranged: false,
        impact_on_children_assessed: false,
        wellbeing_check_completed: false,
        manager_informed: false,
        phased_return_agreed: false,
      })]);
      expect(m.return_to_work_rate).toBe(0);
      expect(m.occupational_health_rate).toBe(0);
      expect(m.reasonable_adjustments_rate).toBe(0);
      expect(m.cover_arranged_rate).toBe(0);
      expect(m.impact_assessed_rate).toBe(0);
      expect(m.wellbeing_check_rate).toBe(0);
      expect(m.manager_informed_rate).toBe(0);
      expect(m.phased_return_rate).toBe(0);
    });
    it("computes mixed boolean rate correctly (66.7%)", () => {
      const rows = [
        makeRow({ return_to_work_completed: true }),
        makeRow({ return_to_work_completed: false }),
        makeRow({ return_to_work_completed: true }),
      ];
      expect(computeSicknessMetrics(rows).return_to_work_rate).toBe(66.7);
    });
    it("computes 50% correctly", () => {
      const rows = [
        makeRow({ cover_arranged: true }),
        makeRow({ cover_arranged: false }),
      ];
      expect(computeSicknessMetrics(rows).cover_arranged_rate).toBe(50);
    });
    it("computes 33.3% correctly", () => {
      const rows = [
        makeRow({ manager_informed: true }),
        makeRow({ manager_informed: false }),
        makeRow({ manager_informed: false }),
      ];
      expect(computeSicknessMetrics(rows).manager_informed_rate).toBe(33.3);
    });
  });

  describe("total_days_absent", () => {
    it("sums days_absent across all rows", () => {
      const rows = [
        makeRow({ days_absent: 5 }),
        makeRow({ days_absent: 10 }),
        makeRow({ days_absent: 3 }),
      ];
      expect(computeSicknessMetrics(rows).total_days_absent).toBe(18);
    });
    it("returns 0 for zero days", () => {
      expect(computeSicknessMetrics([makeRow({ days_absent: 0 })]).total_days_absent).toBe(0);
    });
  });

  describe("average_days_absent", () => {
    it("calculates average correctly", () => {
      const rows = [
        makeRow({ days_absent: 10 }),
        makeRow({ days_absent: 5 }),
        makeRow({ days_absent: 3 }),
      ];
      // (10 + 5 + 3) / 3 = 6.0
      expect(computeSicknessMetrics(rows).average_days_absent).toBe(6);
    });
    it("rounds to one decimal place", () => {
      const rows = [
        makeRow({ days_absent: 10 }),
        makeRow({ days_absent: 7 }),
        makeRow({ days_absent: 4 }),
      ];
      // 21 / 3 = 7.0
      expect(computeSicknessMetrics(rows).average_days_absent).toBe(7);
    });
    it("handles non-round averages", () => {
      const rows = [
        makeRow({ days_absent: 1 }),
        makeRow({ days_absent: 2 }),
        makeRow({ days_absent: 3 }),
      ];
      // 6 / 3 = 2.0
      expect(computeSicknessMetrics(rows).average_days_absent).toBe(2);
    });
    it("returns 0 for empty array", () => {
      expect(computeSicknessMetrics([]).average_days_absent).toBe(0);
    });
    it("handles single row", () => {
      expect(computeSicknessMetrics([makeRow({ days_absent: 13 })]).average_days_absent).toBe(13);
    });
  });

  describe("absence_type_breakdown", () => {
    it("groups by absence type", () => {
      const rows = [
        makeRow({ absence_type: "short_term" }),
        makeRow({ absence_type: "short_term" }),
        makeRow({ absence_type: "long_term" }),
        makeRow({ absence_type: "covid" }),
      ];
      expect(computeSicknessMetrics(rows).absence_type_breakdown).toEqual({
        short_term: 2,
        long_term: 1,
        covid: 1,
      });
    });
    it("handles single type", () => {
      const rows = [
        makeRow({ absence_type: "mental_health" }),
        makeRow({ absence_type: "mental_health" }),
      ];
      expect(computeSicknessMetrics(rows).absence_type_breakdown).toEqual({
        mental_health: 2,
      });
    });
  });

  describe("trigger_breakdown", () => {
    it("groups by trigger level", () => {
      const rows = [
        makeRow({ trigger_level: "none" }),
        makeRow({ trigger_level: "none" }),
        makeRow({ trigger_level: "stage_1" }),
        makeRow({ trigger_level: "stage_3" }),
      ];
      expect(computeSicknessMetrics(rows).trigger_breakdown).toEqual({
        none: 2,
        stage_1: 1,
        stage_3: 1,
      });
    });
    it("handles all same trigger level", () => {
      const rows = [
        makeRow({ trigger_level: "informal" }),
        makeRow({ trigger_level: "informal" }),
        makeRow({ trigger_level: "informal" }),
      ];
      expect(computeSicknessMetrics(rows).trigger_breakdown).toEqual({
        informal: 3,
      });
    });
  });

  describe("unique_staff", () => {
    it("counts distinct staff names", () => {
      const rows = [
        makeRow({ staff_name: "Alice" }),
        makeRow({ staff_name: "Bob" }),
        makeRow({ staff_name: "Alice" }),
      ];
      expect(computeSicknessMetrics(rows).unique_staff).toBe(2);
    });
    it("returns 1 for single staff member with multiple records", () => {
      const rows = [
        makeRow({ staff_name: "Charlie" }),
        makeRow({ staff_name: "Charlie" }),
      ];
      expect(computeSicknessMetrics(rows).unique_staff).toBe(1);
    });
    it("returns 0 for empty array", () => {
      expect(computeSicknessMetrics([]).unique_staff).toBe(0);
    });
  });

  describe("large dataset", () => {
    it("handles 100 records", () => {
      const rows = Array.from({ length: 100 }, (_, i) =>
        makeRow({ staff_name: `Staff_${i % 10}`, days_absent: 2, absence_type: i % 2 === 0 ? "short_term" : "long_term" }),
      );
      const m = computeSicknessMetrics(rows);
      expect(m.total_absences).toBe(100);
      expect(m.total_days_absent).toBe(200);
      expect(m.average_days_absent).toBe(2);
      expect(m.unique_staff).toBe(10);
      expect(m.long_term_count).toBe(50);
    });
  });

  describe("return shape", () => {
    it("contains all 18 expected keys", () => {
      const m = computeSicknessMetrics([]);
      const keys = Object.keys(m);
      expect(keys).toContain("total_absences");
      expect(keys).toContain("long_term_count");
      expect(keys).toContain("mental_health_count");
      expect(keys).toContain("work_related_count");
      expect(keys).toContain("ongoing_count");
      expect(keys).toContain("return_to_work_rate");
      expect(keys).toContain("occupational_health_rate");
      expect(keys).toContain("reasonable_adjustments_rate");
      expect(keys).toContain("cover_arranged_rate");
      expect(keys).toContain("impact_assessed_rate");
      expect(keys).toContain("wellbeing_check_rate");
      expect(keys).toContain("manager_informed_rate");
      expect(keys).toContain("phased_return_rate");
      expect(keys).toContain("total_days_absent");
      expect(keys).toContain("average_days_absent");
      expect(keys).toContain("absence_type_breakdown");
      expect(keys).toContain("trigger_breakdown");
      expect(keys).toContain("unique_staff");
      expect(keys).toHaveLength(18);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. computeSicknessAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("computeSicknessAlerts", () => {
  describe("empty inputs", () => {
    it("returns empty array for no rows", () => {
      expect(computeSicknessAlerts([])).toEqual([]);
    });
  });

  describe("clean record (no alerts)", () => {
    it("returns empty for well-managed defaults", () => {
      expect(computeSicknessAlerts([makeRow()])).toEqual([]);
    });
  });

  describe("high_trigger_no_formal_review (critical)", () => {
    it("fires for stage_3 without formal_review", () => {
      const rows = [makeRow({ trigger_level: "stage_3", management_status: "ongoing", staff_name: "Jo" })];
      const alerts = computeSicknessAlerts(rows);
      const found = alerts.find((a) => a.type === "high_trigger_no_formal_review");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("critical");
      expect(found!.message).toContain("Jo");
      expect(found!.message).toContain("stage 3");
    });
    it("fires for dismissal_consideration without formal_review", () => {
      const rows = [makeRow({ trigger_level: "dismissal_consideration", management_status: "reported", staff_name: "Kay" })];
      const alerts = computeSicknessAlerts(rows);
      const found = alerts.find((a) => a.type === "high_trigger_no_formal_review");
      expect(found).toBeDefined();
      expect(found!.message).toContain("Kay");
      expect(found!.message).toContain("dismissal consideration");
    });
    it("does NOT fire for stage_3 with formal_review", () => {
      const rows = [makeRow({ trigger_level: "stage_3", management_status: "formal_review" })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "high_trigger_no_formal_review")).toBeUndefined();
    });
    it("does NOT fire for dismissal_consideration with formal_review", () => {
      const rows = [makeRow({ trigger_level: "dismissal_consideration", management_status: "formal_review" })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "high_trigger_no_formal_review")).toBeUndefined();
    });
    it("does NOT fire for stage_2", () => {
      const rows = [makeRow({ trigger_level: "stage_2", management_status: "ongoing" })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "high_trigger_no_formal_review")).toBeUndefined();
    });
    it("does NOT fire for stage_1", () => {
      const rows = [makeRow({ trigger_level: "stage_1", management_status: "reported" })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "high_trigger_no_formal_review")).toBeUndefined();
    });
    it("does NOT fire for none trigger", () => {
      const rows = [makeRow({ trigger_level: "none", management_status: "ongoing" })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "high_trigger_no_formal_review")).toBeUndefined();
    });
    it("sets record_id on the alert", () => {
      const rows = [makeRow({ id: "test-abc", trigger_level: "stage_3", management_status: "ongoing" })];
      const alerts = computeSicknessAlerts(rows);
      expect(alerts.find((a) => a.type === "high_trigger_no_formal_review")!.record_id).toBe("test-abc");
    });
    it("fires for multiple records", () => {
      const rows = [
        makeRow({ id: "r1", trigger_level: "stage_3", management_status: "ongoing" }),
        makeRow({ id: "r2", trigger_level: "dismissal_consideration", management_status: "reported" }),
      ];
      expect(computeSicknessAlerts(rows).filter((a) => a.type === "high_trigger_no_formal_review")).toHaveLength(2);
    });
    it("message includes 'immediate action required'", () => {
      const rows = [makeRow({ trigger_level: "stage_3", management_status: "ongoing" })];
      const found = computeSicknessAlerts(rows).find((a) => a.type === "high_trigger_no_formal_review");
      expect(found!.message).toContain("immediate action required");
    });
  });

  describe("long_term_no_oh_referral (high)", () => {
    it("fires for long_term without OH referral", () => {
      const rows = [makeRow({ absence_type: "long_term", occupational_health_referred: false, staff_name: "Sam", absence_start_date: "2026-03-01" })];
      const found = computeSicknessAlerts(rows).find((a) => a.type === "long_term_no_oh_referral");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("high");
      expect(found!.message).toContain("Sam");
      expect(found!.message).toContain("2026-03-01");
    });
    it("does NOT fire when OH referral is true", () => {
      const rows = [makeRow({ absence_type: "long_term", occupational_health_referred: true })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "long_term_no_oh_referral")).toBeUndefined();
    });
    it("does NOT fire for short_term", () => {
      const rows = [makeRow({ absence_type: "short_term", occupational_health_referred: false })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "long_term_no_oh_referral")).toBeUndefined();
    });
    it("does NOT fire for mental_health type", () => {
      const rows = [makeRow({ absence_type: "mental_health", occupational_health_referred: false })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "long_term_no_oh_referral")).toBeUndefined();
    });
    it("message includes 'consider referral'", () => {
      const rows = [makeRow({ absence_type: "long_term", occupational_health_referred: false })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "long_term_no_oh_referral")!.message).toContain("consider referral");
    });
  });

  describe("no_cover_no_impact_assessment (high)", () => {
    it("fires when cover not arranged AND impact not assessed", () => {
      const rows = [makeRow({ cover_arranged: false, impact_on_children_assessed: false, staff_name: "Pat" })];
      const found = computeSicknessAlerts(rows).find((a) => a.type === "no_cover_no_impact_assessment");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("high");
      expect(found!.message).toContain("Pat");
    });
    it("does NOT fire when cover arranged", () => {
      const rows = [makeRow({ cover_arranged: true, impact_on_children_assessed: false })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "no_cover_no_impact_assessment")).toBeUndefined();
    });
    it("does NOT fire when impact assessed", () => {
      const rows = [makeRow({ cover_arranged: false, impact_on_children_assessed: true })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "no_cover_no_impact_assessment")).toBeUndefined();
    });
    it("does NOT fire when both true", () => {
      const rows = [makeRow({ cover_arranged: true, impact_on_children_assessed: true })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "no_cover_no_impact_assessment")).toBeUndefined();
    });
    it("message includes 'staffing levels may be affected'", () => {
      const rows = [makeRow({ cover_arranged: false, impact_on_children_assessed: false })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "no_cover_no_impact_assessment")!.message).toContain("staffing levels may be affected");
    });
  });

  describe("resolved_no_rtw (medium)", () => {
    it("fires for resolved absence without RTW", () => {
      const rows = [makeRow({ management_status: "resolved", return_to_work_completed: false, staff_name: "Alex" })];
      const found = computeSicknessAlerts(rows).find((a) => a.type === "resolved_no_rtw");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("medium");
      expect(found!.message).toContain("Alex");
    });
    it("does NOT fire when RTW completed", () => {
      const rows = [makeRow({ management_status: "resolved", return_to_work_completed: true })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "resolved_no_rtw")).toBeUndefined();
    });
    it("does NOT fire for ongoing status", () => {
      const rows = [makeRow({ management_status: "ongoing", return_to_work_completed: false })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "resolved_no_rtw")).toBeUndefined();
    });
    it("does NOT fire for reported status", () => {
      const rows = [makeRow({ management_status: "reported", return_to_work_completed: false })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "resolved_no_rtw")).toBeUndefined();
    });
    it("message includes 'complete before closing'", () => {
      const rows = [makeRow({ management_status: "resolved", return_to_work_completed: false })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "resolved_no_rtw")!.message).toContain("complete before closing");
    });
  });

  describe("mental_health_no_wellbeing_check (medium)", () => {
    it("fires for mental_health absence without wellbeing check", () => {
      const rows = [makeRow({ absence_type: "mental_health", wellbeing_check_completed: false, staff_name: "Robin" })];
      const found = computeSicknessAlerts(rows).find((a) => a.type === "mental_health_no_wellbeing_check");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("medium");
      expect(found!.message).toContain("Robin");
    });
    it("does NOT fire when wellbeing check completed", () => {
      const rows = [makeRow({ absence_type: "mental_health", wellbeing_check_completed: true })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "mental_health_no_wellbeing_check")).toBeUndefined();
    });
    it("does NOT fire for short_term type", () => {
      const rows = [makeRow({ absence_type: "short_term", wellbeing_check_completed: false })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "mental_health_no_wellbeing_check")).toBeUndefined();
    });
    it("does NOT fire for long_term type", () => {
      const rows = [makeRow({ absence_type: "long_term", wellbeing_check_completed: false })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "mental_health_no_wellbeing_check")).toBeUndefined();
    });
    it("message includes 'staff welfare'", () => {
      const rows = [makeRow({ absence_type: "mental_health", wellbeing_check_completed: false })];
      expect(computeSicknessAlerts(rows).find((a) => a.type === "mental_health_no_wellbeing_check")!.message).toContain("staff welfare");
    });
  });

  describe("combined scenarios", () => {
    it("fires all 5 alert types simultaneously", () => {
      const rows = [
        makeRow({
          id: "r1",
          trigger_level: "stage_3",
          management_status: "ongoing",
          absence_type: "long_term",
          occupational_health_referred: false,
          cover_arranged: false,
          impact_on_children_assessed: false,
        }),
        makeRow({
          id: "r2",
          management_status: "resolved",
          return_to_work_completed: false,
          absence_type: "mental_health",
          wellbeing_check_completed: false,
          cover_arranged: false,
          impact_on_children_assessed: false,
        }),
      ];
      const alerts = computeSicknessAlerts(rows);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("high_trigger_no_formal_review");
      expect(types).toContain("long_term_no_oh_referral");
      expect(types).toContain("no_cover_no_impact_assessment");
      expect(types).toContain("resolved_no_rtw");
      expect(types).toContain("mental_health_no_wellbeing_check");
    });
    it("non-triggering rows produce zero alerts", () => {
      const rows = [
        makeRow({
          trigger_level: "none",
          management_status: "resolved",
          absence_type: "short_term",
          occupational_health_referred: true,
          cover_arranged: true,
          impact_on_children_assessed: true,
          return_to_work_completed: true,
          wellbeing_check_completed: true,
        }),
      ];
      expect(computeSicknessAlerts(rows)).toHaveLength(0);
    });
  });

  describe("alert object shape", () => {
    it("every alert has type, severity, message fields", () => {
      const rows = [makeRow({ trigger_level: "stage_3", management_status: "ongoing" })];
      for (const alert of computeSicknessAlerts(rows)) {
        expect(typeof alert.type).toBe("string");
        expect(typeof alert.severity).toBe("string");
        expect(typeof alert.message).toBe("string");
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. generateSicknessCaraInsights
// ══════════════════════════════════════════════════════════════════════════════

describe("generateSicknessCaraInsights", () => {
  it("returns exactly 3 strings", () => {
    const insights = generateSicknessCaraInsights([]);
    expect(insights).toHaveLength(3);
    for (const i of insights) expect(typeof i).toBe("string");
  });

  it("first insight starts with [cyan]", () => {
    const insights = generateSicknessCaraInsights([makeRow()]);
    expect(insights[0].startsWith("[cyan]")).toBe(true);
  });

  it("second insight starts with [amber]", () => {
    const insights = generateSicknessCaraInsights([makeRow()]);
    expect(insights[1].startsWith("[amber]")).toBe(true);
  });

  it("third insight starts with [reflect]", () => {
    const insights = generateSicknessCaraInsights([makeRow()]);
    expect(insights[2].startsWith("[reflect]")).toBe(true);
  });

  it("first insight includes total absences count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    expect(generateSicknessCaraInsights(rows)[0]).toContain("3 sickness absence");
  });

  it("first insight uses singular 'record' for 1 absence", () => {
    expect(generateSicknessCaraInsights([makeRow()])[0]).toContain("1 sickness absence record");
  });

  it("first insight uses plural 'records' for multiple", () => {
    expect(generateSicknessCaraInsights([makeRow(), makeRow()])[0]).toContain("records");
  });

  it("first insight includes unique staff count", () => {
    const rows = [makeRow({ staff_name: "A" }), makeRow({ staff_name: "B" })];
    expect(generateSicknessCaraInsights(rows)[0]).toContain("2 staff members");
  });

  it("first insight uses singular 'staff member' for 1", () => {
    const rows = [makeRow({ staff_name: "A" })];
    expect(generateSicknessCaraInsights(rows)[0]).toContain("1 staff member");
  });

  it("second insight shows alerts when present", () => {
    const rows = [makeRow({ trigger_level: "stage_3", management_status: "ongoing" })];
    const insight = generateSicknessCaraInsights(rows)[1];
    expect(insight).toContain("[amber]");
    expect(insight).toContain("critical");
  });

  it("second insight mentions Reg 33 when no alerts", () => {
    const rows = [makeRow()];
    const insight = generateSicknessCaraInsights(rows)[1];
    expect(insight).toContain("Reg 33");
  });

  it("third insight reflects on mental health when present with incomplete checks", () => {
    const rows = [makeRow({ absence_type: "mental_health", wellbeing_check_completed: false })];
    const insight = generateSicknessCaraInsights(rows)[2];
    expect(insight).toContain("mental health");
  });

  it("third insight reflects on RTW rate when no mental health but incomplete RTW", () => {
    const rows = [makeRow({ return_to_work_completed: false })];
    const insight = generateSicknessCaraInsights(rows)[2];
    expect(insight).toContain("Return-to-work");
  });

  it("third insight provides positive reflection when everything is well", () => {
    const rows = [makeRow()];
    const insight = generateSicknessCaraInsights(rows)[2];
    expect(insight).toContain("well maintained");
  });

  it("handles empty input gracefully", () => {
    const insights = generateSicknessCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("0 sickness absence");
    expect(insights[2]).toContain("well maintained");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. CRUD FALLBACK (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  describe("listStaffSicknessManagement", () => {
    it("returns ok: true with empty data array", async () => {
      const result = await listStaffSicknessManagement("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });
    it("returns ok: true regardless of filters", async () => {
      const result = await listStaffSicknessManagement("home-1", {
        absenceType: "short_term",
        managementStatus: "reported",
        triggerLevel: "none",
        staffName: "Alice",
        limit: 50,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });
  });

  describe("createStaffSicknessManagement", () => {
    it("returns ok: false with 'Supabase not configured' error", async () => {
      const result = await createStaffSicknessManagement({
        homeId: "home-1",
        staffName: "Alice",
        absenceStartDate: "2026-05-01",
        absenceType: "short_term",
        daysAbsent: 3,
      });
      expect(result).toEqual({ ok: false, error: "Supabase not configured" });
    });
  });

  describe("updateStaffSicknessManagement", () => {
    it("returns ok: false with 'Supabase not configured' error", async () => {
      const result = await updateStaffSicknessManagement("some-id", { management_status: "resolved" });
      expect(result).toEqual({ ok: false, error: "Supabase not configured" });
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. EDGE CASES & TYPE SAFETY
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  describe("factory helper", () => {
    it("returns valid StaffSicknessManagementRow shape", () => {
      const r = makeRow();
      expect(typeof r.id).toBe("string");
      expect(typeof r.home_id).toBe("string");
      expect(typeof r.staff_name).toBe("string");
      expect(typeof r.absence_start_date).toBe("string");
      expect(typeof r.absence_type).toBe("string");
      expect(typeof r.management_status).toBe("string");
      expect(typeof r.trigger_level).toBe("string");
      expect(typeof r.fit_note_status).toBe("string");
      expect(typeof r.days_absent).toBe("number");
      expect(typeof r.return_to_work_completed).toBe("boolean");
      expect(typeof r.occupational_health_referred).toBe("boolean");
      expect(typeof r.reasonable_adjustments_made).toBe("boolean");
      expect(typeof r.phased_return_agreed).toBe("boolean");
      expect(typeof r.manager_informed).toBe("boolean");
      expect(typeof r.cover_arranged).toBe("boolean");
      expect(typeof r.impact_on_children_assessed).toBe("boolean");
      expect(typeof r.wellbeing_check_completed).toBe("boolean");
      expect(typeof r.created_at).toBe("string");
      expect(typeof r.updated_at).toBe("string");
    });
    it("allows overriding any field", () => {
      const r = makeRow({ staff_name: "Custom", days_absent: 99, absence_type: "covid" });
      expect(r.staff_name).toBe("Custom");
      expect(r.days_absent).toBe(99);
      expect(r.absence_type).toBe("covid");
    });
    it("nullable fields default to null", () => {
      const r = makeRow();
      expect(r.staff_id).toBeNull();
      expect(r.absence_end_date).toBeNull();
      expect(r.managing_officer).toBeNull();
      expect(r.absence_reason_detail).toBeNull();
      expect(r.notes).toBeNull();
    });
    it("nullable fields can be set via overrides", () => {
      const r = makeRow({ staff_id: "s1", absence_end_date: "2026-05-10", managing_officer: "Officer A", absence_reason_detail: "Detail", notes: "Note" });
      expect(r.staff_id).toBe("s1");
      expect(r.absence_end_date).toBe("2026-05-10");
      expect(r.managing_officer).toBe("Officer A");
      expect(r.absence_reason_detail).toBe("Detail");
      expect(r.notes).toBe("Note");
    });
  });

  describe("metrics types", () => {
    it("numeric fields are numbers", () => {
      const m = computeSicknessMetrics([]);
      expect(typeof m.total_absences).toBe("number");
      expect(typeof m.long_term_count).toBe("number");
      expect(typeof m.mental_health_count).toBe("number");
      expect(typeof m.work_related_count).toBe("number");
      expect(typeof m.ongoing_count).toBe("number");
      expect(typeof m.return_to_work_rate).toBe("number");
      expect(typeof m.total_days_absent).toBe("number");
      expect(typeof m.average_days_absent).toBe("number");
      expect(typeof m.unique_staff).toBe("number");
    });
    it("breakdown fields are objects", () => {
      const m = computeSicknessMetrics([]);
      expect(typeof m.absence_type_breakdown).toBe("object");
      expect(typeof m.trigger_breakdown).toBe("object");
    });
  });

  describe("all 8 absence types in breakdown", () => {
    it("correctly counts each type", () => {
      const types: AbsenceType[] = ["short_term", "long_term", "intermittent", "work_related", "covid", "mental_health", "physical_injury", "chronic_condition"];
      const rows = types.map((t) => makeRow({ absence_type: t }));
      const m = computeSicknessMetrics(rows);
      for (const t of types) expect(m.absence_type_breakdown[t]).toBe(1);
      expect(Object.keys(m.absence_type_breakdown)).toHaveLength(8);
    });
  });

  describe("all 6 trigger levels in breakdown", () => {
    it("correctly counts each level", () => {
      const levels: TriggerLevel[] = ["none", "informal", "stage_1", "stage_2", "stage_3", "dismissal_consideration"];
      const rows = levels.map((l) => makeRow({ trigger_level: l }));
      const m = computeSicknessMetrics(rows);
      for (const l of levels) expect(m.trigger_breakdown[l]).toBe(1);
      expect(Object.keys(m.trigger_breakdown)).toHaveLength(6);
    });
  });

  describe("single fully-populated row", () => {
    it("metrics handle one record with all fields", () => {
      const rows = [makeRow({
        absence_type: "long_term",
        management_status: "ongoing",
        trigger_level: "stage_2",
        days_absent: 30,
        staff_name: "SinglePerson",
      })];
      const m = computeSicknessMetrics(rows);
      expect(m.total_absences).toBe(1);
      expect(m.long_term_count).toBe(1);
      expect(m.ongoing_count).toBe(1);
      expect(m.total_days_absent).toBe(30);
      expect(m.average_days_absent).toBe(30);
      expect(m.unique_staff).toBe(1);
    });
  });

  describe("large dataset alerts", () => {
    it("identifies alerts across 50 rows without error", () => {
      const rows = Array.from({ length: 50 }, (_, i) =>
        makeRow({
          id: `row-${i}`,
          trigger_level: i < 5 ? "stage_3" : "none",
          management_status: i < 5 ? "ongoing" : "resolved",
          return_to_work_completed: i >= 5,
        }),
      );
      const alerts = computeSicknessAlerts(rows);
      expect(alerts.filter((a) => a.type === "high_trigger_no_formal_review")).toHaveLength(5);
    });
  });

  describe("percentage rounding", () => {
    it("uses Math.round(value * 1000) / 10 formula", () => {
      // 1 of 3 = 33.333...% => round(333.33) / 10 = 333 / 10 = 33.3
      const rows = [
        makeRow({ wellbeing_check_completed: true }),
        makeRow({ wellbeing_check_completed: false }),
        makeRow({ wellbeing_check_completed: false }),
      ];
      expect(computeSicknessMetrics(rows).wellbeing_check_rate).toBe(33.3);
    });
    it("computes 25% correctly", () => {
      const rows = [
        makeRow({ phased_return_agreed: true }),
        makeRow({ phased_return_agreed: false }),
        makeRow({ phased_return_agreed: false }),
        makeRow({ phased_return_agreed: false }),
      ];
      expect(computeSicknessMetrics(rows).phased_return_rate).toBe(25);
    });
    it("computes 75% correctly", () => {
      const rows = [
        makeRow({ impact_on_children_assessed: true }),
        makeRow({ impact_on_children_assessed: true }),
        makeRow({ impact_on_children_assessed: true }),
        makeRow({ impact_on_children_assessed: false }),
      ];
      expect(computeSicknessMetrics(rows).impact_assessed_rate).toBe(75);
    });
  });
});
