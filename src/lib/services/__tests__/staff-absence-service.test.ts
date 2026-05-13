// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF ABSENCE SERVICE TESTS
// Pure-function tests for absence metrics, alert identification, constant
// validation, and CRUD fallback behaviour.
// CHR 2015 Reg 33/34 compliance — staffing fitness and sufficiency.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";

// Mock Supabase before importing anything from the service
vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  ABSENCE_TYPES,
  SICKNESS_REASONS,
  ABSENCE_STATUSES,
  RETURN_TO_WORK_STATUSES,
  _testing,
  listAbsences,
  createAbsence,
  updateAbsence,
} from "../staff-absence-service";

import type {
  StaffAbsence,
  AbsenceType,
  SicknessReason,
  AbsenceStatus,
  ReturnToWorkStatus,
} from "../staff-absence-service";

const { computeAbsenceMetrics, identifyAbsenceAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const NOW = new Date("2026-05-13");

const absenceDefaults: StaffAbsence = {
  id: crypto.randomUUID(),
  home_id: "home-1",
  staff_name: "Alice Walker",
  staff_role: "Residential Worker",
  absence_type: "annual_leave",
  sickness_reason: null,
  start_date: "2026-05-01",
  end_date: null,
  days_lost: 3,
  status: "current",
  covered_by: null,
  agency_cover_used: false,
  return_to_work_status: "not_required",
  return_to_work_date: null,
  return_to_work_notes: null,
  occupational_health_referral: false,
  impact_on_children: null,
  fit_note_received: false,
  created_at: "2026-05-01T10:00:00Z",
  updated_at: "2026-05-01T10:00:00Z",
};

function makeStaffAbsence(overrides: Partial<StaffAbsence> = {}): StaffAbsence {
  return { ...absenceDefaults, id: crypto.randomUUID(), ...overrides };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("ABSENCE_TYPES", () => {
  it("has exactly 12 entries", () => {
    expect(ABSENCE_TYPES).toHaveLength(12);
  });

  it("every entry has a non-empty type string", () => {
    for (const item of ABSENCE_TYPES) {
      expect(typeof item.type).toBe("string");
      expect(item.type.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label", () => {
    for (const item of ABSENCE_TYPES) {
      expect(typeof item.label).toBe("string");
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("all type values are unique", () => {
    const types = ABSENCE_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it.each([
    "sickness_short_term",
    "sickness_long_term",
    "annual_leave",
    "compassionate_leave",
    "parental_leave",
    "maternity_paternity",
    "training",
    "unauthorised",
    "unpaid_leave",
    "jury_service",
    "suspension",
    "other",
  ] as AbsenceType[])("includes type %s", (type) => {
    expect(ABSENCE_TYPES.map((t) => t.type)).toContain(type);
  });

  it("maps sickness_short_term to 'Sickness (Short-Term)'", () => {
    const found = ABSENCE_TYPES.find((t) => t.type === "sickness_short_term");
    expect(found?.label).toBe("Sickness (Short-Term)");
  });

  it("maps sickness_long_term to 'Sickness (Long-Term)'", () => {
    const found = ABSENCE_TYPES.find((t) => t.type === "sickness_long_term");
    expect(found?.label).toBe("Sickness (Long-Term)");
  });

  it("maps unauthorised to 'Unauthorised'", () => {
    const found = ABSENCE_TYPES.find((t) => t.type === "unauthorised");
    expect(found?.label).toBe("Unauthorised");
  });

  it("maps maternity_paternity to 'Maternity/Paternity'", () => {
    const found = ABSENCE_TYPES.find((t) => t.type === "maternity_paternity");
    expect(found?.label).toBe("Maternity/Paternity");
  });

  it("maps jury_service to 'Jury Service'", () => {
    const found = ABSENCE_TYPES.find((t) => t.type === "jury_service");
    expect(found?.label).toBe("Jury Service");
  });
});

describe("SICKNESS_REASONS", () => {
  it("has exactly 12 entries", () => {
    expect(SICKNESS_REASONS).toHaveLength(12);
  });

  it("every entry has a non-empty reason string", () => {
    for (const item of SICKNESS_REASONS) {
      expect(typeof item.reason).toBe("string");
      expect(item.reason.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label", () => {
    for (const item of SICKNESS_REASONS) {
      expect(typeof item.label).toBe("string");
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("all reason values are unique", () => {
    const reasons = SICKNESS_REASONS.map((r) => r.reason);
    expect(new Set(reasons).size).toBe(reasons.length);
  });

  it.each([
    "cold_flu",
    "musculoskeletal",
    "stress_anxiety",
    "mental_health",
    "gastric",
    "migraine_headache",
    "surgery_recovery",
    "covid",
    "injury_at_work",
    "chronic_condition",
    "hospital_appointment",
    "other",
  ] as SicknessReason[])("includes reason %s", (reason) => {
    expect(SICKNESS_REASONS.map((r) => r.reason)).toContain(reason);
  });

  it("maps cold_flu to 'Cold/Flu'", () => {
    const found = SICKNESS_REASONS.find((r) => r.reason === "cold_flu");
    expect(found?.label).toBe("Cold/Flu");
  });

  it("maps stress_anxiety to 'Stress/Anxiety'", () => {
    const found = SICKNESS_REASONS.find((r) => r.reason === "stress_anxiety");
    expect(found?.label).toBe("Stress/Anxiety");
  });

  it("maps covid to 'COVID-19'", () => {
    const found = SICKNESS_REASONS.find((r) => r.reason === "covid");
    expect(found?.label).toBe("COVID-19");
  });

  it("maps injury_at_work to 'Injury at Work'", () => {
    const found = SICKNESS_REASONS.find((r) => r.reason === "injury_at_work");
    expect(found?.label).toBe("Injury at Work");
  });

  it("maps hospital_appointment to 'Hospital Appointment'", () => {
    const found = SICKNESS_REASONS.find((r) => r.reason === "hospital_appointment");
    expect(found?.label).toBe("Hospital Appointment");
  });
});

describe("ABSENCE_STATUSES", () => {
  it("has exactly 4 entries", () => {
    expect(ABSENCE_STATUSES).toHaveLength(4);
  });

  it("every entry has a non-empty status string", () => {
    for (const item of ABSENCE_STATUSES) {
      expect(typeof item.status).toBe("string");
      expect(item.status.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label", () => {
    for (const item of ABSENCE_STATUSES) {
      expect(typeof item.label).toBe("string");
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("all status values are unique", () => {
    const statuses = ABSENCE_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it.each(["planned", "current", "returned", "cancelled"] as AbsenceStatus[])(
    "includes status %s",
    (status) => {
      expect(ABSENCE_STATUSES.map((s) => s.status)).toContain(status);
    },
  );

  it("maps planned to 'Planned'", () => {
    expect(ABSENCE_STATUSES.find((s) => s.status === "planned")?.label).toBe("Planned");
  });

  it("maps cancelled to 'Cancelled'", () => {
    expect(ABSENCE_STATUSES.find((s) => s.status === "cancelled")?.label).toBe("Cancelled");
  });
});

describe("RETURN_TO_WORK_STATUSES", () => {
  it("has exactly 4 entries", () => {
    expect(RETURN_TO_WORK_STATUSES).toHaveLength(4);
  });

  it("every entry has a non-empty status string", () => {
    for (const item of RETURN_TO_WORK_STATUSES) {
      expect(typeof item.status).toBe("string");
      expect(item.status.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label", () => {
    for (const item of RETURN_TO_WORK_STATUSES) {
      expect(typeof item.label).toBe("string");
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("all status values are unique", () => {
    const statuses = RETURN_TO_WORK_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it.each(["not_required", "pending", "completed", "overdue"] as ReturnToWorkStatus[])(
    "includes status %s",
    (status) => {
      expect(RETURN_TO_WORK_STATUSES.map((s) => s.status)).toContain(status);
    },
  );

  it("maps not_required to 'Not Required'", () => {
    expect(
      RETURN_TO_WORK_STATUSES.find((s) => s.status === "not_required")?.label,
    ).toBe("Not Required");
  });

  it("maps overdue to 'Overdue'", () => {
    expect(
      RETURN_TO_WORK_STATUSES.find((s) => s.status === "overdue")?.label,
    ).toBe("Overdue");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeAbsenceMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeAbsenceMetrics", () => {
  describe("empty inputs", () => {
    it("returns all zeros for empty absences array", () => {
      const result = computeAbsenceMetrics([], 10, NOW);
      expect(result.total_absences).toBe(0);
      expect(result.current_absences).toBe(0);
      expect(result.sickness_absences).toBe(0);
      expect(result.total_days_lost).toBe(0);
      expect(result.avg_days_per_absence).toBe(0);
      expect(result.absence_rate).toBe(0);
      expect(result.agency_cover_count).toBe(0);
      expect(result.return_to_work_pending).toBe(0);
      expect(result.return_to_work_overdue).toBe(0);
      expect(result.occupational_health_referrals).toBe(0);
      expect(result.unauthorised_absences).toBe(0);
      expect(result.long_term_sickness).toBe(0);
      expect(result.stress_related).toBe(0);
    });

    it("returns empty grouping objects for empty absences", () => {
      const result = computeAbsenceMetrics([], 10, NOW);
      expect(result.by_type).toEqual({});
      expect(result.by_reason).toEqual({});
      expect(result.by_status).toEqual({});
      expect(result.by_staff).toEqual({});
    });
  });

  describe("total_absences", () => {
    it("counts all absences regardless of status", () => {
      const absences = [
        makeStaffAbsence({ status: "current" }),
        makeStaffAbsence({ status: "returned" }),
        makeStaffAbsence({ status: "cancelled" }),
        makeStaffAbsence({ status: "planned" }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).total_absences).toBe(4);
    });

    it("returns 1 for a single absence", () => {
      const absences = [makeStaffAbsence()];
      expect(computeAbsenceMetrics(absences, 10, NOW).total_absences).toBe(1);
    });
  });

  describe("current_absences", () => {
    it("counts only absences with status 'current'", () => {
      const absences = [
        makeStaffAbsence({ status: "current" }),
        makeStaffAbsence({ status: "current" }),
        makeStaffAbsence({ status: "returned" }),
        makeStaffAbsence({ status: "planned" }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).current_absences).toBe(2);
    });

    it("returns 0 when no current absences exist", () => {
      const absences = [
        makeStaffAbsence({ status: "returned" }),
        makeStaffAbsence({ status: "cancelled" }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).current_absences).toBe(0);
    });
  });

  describe("sickness_absences", () => {
    it("counts short-term sickness", () => {
      const absences = [
        makeStaffAbsence({ absence_type: "sickness_short_term" }),
        makeStaffAbsence({ absence_type: "annual_leave" }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).sickness_absences).toBe(1);
    });

    it("counts long-term sickness", () => {
      const absences = [
        makeStaffAbsence({ absence_type: "sickness_long_term" }),
        makeStaffAbsence({ absence_type: "training" }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).sickness_absences).toBe(1);
    });

    it("counts both short and long term sickness together", () => {
      const absences = [
        makeStaffAbsence({ absence_type: "sickness_short_term" }),
        makeStaffAbsence({ absence_type: "sickness_long_term" }),
        makeStaffAbsence({ absence_type: "annual_leave" }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).sickness_absences).toBe(2);
    });

    it("returns 0 when no sickness absences", () => {
      const absences = [
        makeStaffAbsence({ absence_type: "annual_leave" }),
        makeStaffAbsence({ absence_type: "training" }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).sickness_absences).toBe(0);
    });
  });

  describe("total_days_lost", () => {
    it("sums days_lost across all absences", () => {
      const absences = [
        makeStaffAbsence({ days_lost: 5 }),
        makeStaffAbsence({ days_lost: 3 }),
        makeStaffAbsence({ days_lost: 10 }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).total_days_lost).toBe(18);
    });

    it("returns 0 for zero days_lost entries", () => {
      const absences = [
        makeStaffAbsence({ days_lost: 0 }),
        makeStaffAbsence({ days_lost: 0 }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).total_days_lost).toBe(0);
    });

    it("includes cancelled absences in total days lost", () => {
      const absences = [
        makeStaffAbsence({ days_lost: 5, status: "cancelled" }),
        makeStaffAbsence({ days_lost: 3, status: "current" }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).total_days_lost).toBe(8);
    });
  });

  describe("avg_days_per_absence", () => {
    it("calculates average excluding cancelled absences", () => {
      const absences = [
        makeStaffAbsence({ days_lost: 10, status: "current" }),
        makeStaffAbsence({ days_lost: 5, status: "returned" }),
        makeStaffAbsence({ days_lost: 100, status: "cancelled" }),
      ];
      // totalDaysLost = 115, activeAbsences = 2 (non-cancelled)
      // avg = round((115 / 2) * 10) / 10 = 57.5
      expect(computeAbsenceMetrics(absences, 10, NOW).avg_days_per_absence).toBe(57.5);
    });

    it("returns 0 when all absences are cancelled", () => {
      const absences = [
        makeStaffAbsence({ days_lost: 10, status: "cancelled" }),
        makeStaffAbsence({ days_lost: 5, status: "cancelled" }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).avg_days_per_absence).toBe(0);
    });

    it("rounds to one decimal place", () => {
      const absences = [
        makeStaffAbsence({ days_lost: 10, status: "current" }),
        makeStaffAbsence({ days_lost: 7, status: "returned" }),
        makeStaffAbsence({ days_lost: 4, status: "current" }),
      ];
      // totalDaysLost = 21, activeAbsences = 3
      // avg = round((21 / 3) * 10) / 10 = 7.0
      expect(computeAbsenceMetrics(absences, 10, NOW).avg_days_per_absence).toBe(7);
    });

    it("handles single active absence", () => {
      const absences = [makeStaffAbsence({ days_lost: 13, status: "current" })];
      expect(computeAbsenceMetrics(absences, 10, NOW).avg_days_per_absence).toBe(13);
    });
  });

  describe("absence_rate", () => {
    it("calculates annualised rate correctly", () => {
      // rate = round((totalDaysLost / (totalStaff * 365)) * 1000) / 10
      const absences = [makeStaffAbsence({ days_lost: 365 })];
      // rate = round((365 / (10 * 365)) * 1000) / 10 = round(100) / 10 = 10.0
      expect(computeAbsenceMetrics(absences, 10, NOW).absence_rate).toBe(10);
    });

    it("returns 0 when totalStaff is 0", () => {
      const absences = [makeStaffAbsence({ days_lost: 10 })];
      expect(computeAbsenceMetrics(absences, 0, NOW).absence_rate).toBe(0);
    });

    it("rounds correctly", () => {
      // 50 days, 20 staff: rate = round((50 / (20*365)) * 1000) / 10
      // = round((50/7300)*1000) / 10 = round(6.849...) / 10 = 7 / 10 = 0.7
      const absences = [makeStaffAbsence({ days_lost: 50 })];
      expect(computeAbsenceMetrics(absences, 20, NOW).absence_rate).toBe(0.7);
    });

    it("calculates rate for large days lost", () => {
      // 730 days, 10 staff: rate = round((730 / 3650) * 1000) / 10
      // = round(200) / 10 = 20.0
      const absences = [makeStaffAbsence({ days_lost: 730 })];
      expect(computeAbsenceMetrics(absences, 10, NOW).absence_rate).toBe(20);
    });
  });

  describe("agency_cover_count", () => {
    it("counts absences with agency cover used", () => {
      const absences = [
        makeStaffAbsence({ agency_cover_used: true }),
        makeStaffAbsence({ agency_cover_used: true }),
        makeStaffAbsence({ agency_cover_used: false }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).agency_cover_count).toBe(2);
    });

    it("returns 0 when no agency cover used", () => {
      const absences = [
        makeStaffAbsence({ agency_cover_used: false }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).agency_cover_count).toBe(0);
    });
  });

  describe("return_to_work_pending", () => {
    it("counts absences with pending return-to-work status", () => {
      const absences = [
        makeStaffAbsence({ return_to_work_status: "pending" }),
        makeStaffAbsence({ return_to_work_status: "pending" }),
        makeStaffAbsence({ return_to_work_status: "completed" }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).return_to_work_pending).toBe(2);
    });
  });

  describe("return_to_work_overdue", () => {
    it("counts absences with overdue return-to-work status", () => {
      const absences = [
        makeStaffAbsence({ return_to_work_status: "overdue" }),
        makeStaffAbsence({ return_to_work_status: "pending" }),
        makeStaffAbsence({ return_to_work_status: "overdue" }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).return_to_work_overdue).toBe(2);
    });

    it("returns 0 when no overdue return-to-work", () => {
      const absences = [
        makeStaffAbsence({ return_to_work_status: "completed" }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).return_to_work_overdue).toBe(0);
    });
  });

  describe("occupational_health_referrals", () => {
    it("counts absences with OH referral flag", () => {
      const absences = [
        makeStaffAbsence({ occupational_health_referral: true }),
        makeStaffAbsence({ occupational_health_referral: false }),
        makeStaffAbsence({ occupational_health_referral: true }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).occupational_health_referrals).toBe(2);
    });
  });

  describe("unauthorised_absences", () => {
    it("counts absences with type unauthorised", () => {
      const absences = [
        makeStaffAbsence({ absence_type: "unauthorised" }),
        makeStaffAbsence({ absence_type: "unauthorised" }),
        makeStaffAbsence({ absence_type: "annual_leave" }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).unauthorised_absences).toBe(2);
    });
  });

  describe("long_term_sickness", () => {
    it("counts long-term sickness only", () => {
      const absences = [
        makeStaffAbsence({ absence_type: "sickness_long_term" }),
        makeStaffAbsence({ absence_type: "sickness_short_term" }),
        makeStaffAbsence({ absence_type: "sickness_long_term" }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).long_term_sickness).toBe(2);
    });
  });

  describe("stress_related", () => {
    it("counts stress_anxiety sickness reasons", () => {
      const absences = [
        makeStaffAbsence({ sickness_reason: "stress_anxiety" }),
        makeStaffAbsence({ sickness_reason: "cold_flu" }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).stress_related).toBe(1);
    });

    it("counts mental_health sickness reasons", () => {
      const absences = [
        makeStaffAbsence({ sickness_reason: "mental_health" }),
        makeStaffAbsence({ sickness_reason: "gastric" }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).stress_related).toBe(1);
    });

    it("counts both stress_anxiety and mental_health combined", () => {
      const absences = [
        makeStaffAbsence({ sickness_reason: "stress_anxiety" }),
        makeStaffAbsence({ sickness_reason: "mental_health" }),
        makeStaffAbsence({ sickness_reason: "cold_flu" }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).stress_related).toBe(2);
    });

    it("returns 0 when no stress-related reasons", () => {
      const absences = [
        makeStaffAbsence({ sickness_reason: "cold_flu" }),
        makeStaffAbsence({ sickness_reason: null }),
      ];
      expect(computeAbsenceMetrics(absences, 10, NOW).stress_related).toBe(0);
    });
  });

  describe("by_type grouping", () => {
    it("groups absences by type", () => {
      const absences = [
        makeStaffAbsence({ absence_type: "annual_leave" }),
        makeStaffAbsence({ absence_type: "annual_leave" }),
        makeStaffAbsence({ absence_type: "training" }),
        makeStaffAbsence({ absence_type: "sickness_short_term" }),
      ];
      const result = computeAbsenceMetrics(absences, 10, NOW);
      expect(result.by_type).toEqual({
        annual_leave: 2,
        training: 1,
        sickness_short_term: 1,
      });
    });

    it("handles single type", () => {
      const absences = [
        makeStaffAbsence({ absence_type: "unauthorised" }),
        makeStaffAbsence({ absence_type: "unauthorised" }),
      ];
      const result = computeAbsenceMetrics(absences, 10, NOW);
      expect(result.by_type).toEqual({ unauthorised: 2 });
    });
  });

  describe("by_reason grouping", () => {
    it("groups absences by sickness reason", () => {
      const absences = [
        makeStaffAbsence({ sickness_reason: "cold_flu" }),
        makeStaffAbsence({ sickness_reason: "cold_flu" }),
        makeStaffAbsence({ sickness_reason: "gastric" }),
      ];
      const result = computeAbsenceMetrics(absences, 10, NOW);
      expect(result.by_reason).toEqual({ cold_flu: 2, gastric: 1 });
    });

    it("excludes null sickness reasons", () => {
      const absences = [
        makeStaffAbsence({ sickness_reason: null }),
        makeStaffAbsence({ sickness_reason: "cold_flu" }),
        makeStaffAbsence({ sickness_reason: null }),
      ];
      const result = computeAbsenceMetrics(absences, 10, NOW);
      expect(result.by_reason).toEqual({ cold_flu: 1 });
    });

    it("returns empty object when all reasons are null", () => {
      const absences = [
        makeStaffAbsence({ sickness_reason: null }),
        makeStaffAbsence({ sickness_reason: null }),
      ];
      const result = computeAbsenceMetrics(absences, 10, NOW);
      expect(result.by_reason).toEqual({});
    });
  });

  describe("by_status grouping", () => {
    it("groups absences by status", () => {
      const absences = [
        makeStaffAbsence({ status: "current" }),
        makeStaffAbsence({ status: "current" }),
        makeStaffAbsence({ status: "returned" }),
        makeStaffAbsence({ status: "cancelled" }),
      ];
      const result = computeAbsenceMetrics(absences, 10, NOW);
      expect(result.by_status).toEqual({
        current: 2,
        returned: 1,
        cancelled: 1,
      });
    });
  });

  describe("by_staff grouping", () => {
    it("aggregates days_lost by staff name", () => {
      const absences = [
        makeStaffAbsence({ staff_name: "Alice", days_lost: 5 }),
        makeStaffAbsence({ staff_name: "Alice", days_lost: 3 }),
        makeStaffAbsence({ staff_name: "Bob", days_lost: 10 }),
      ];
      const result = computeAbsenceMetrics(absences, 10, NOW);
      expect(result.by_staff).toEqual({ Alice: 8, Bob: 10 });
    });

    it("handles single staff member with multiple absences", () => {
      const absences = [
        makeStaffAbsence({ staff_name: "Charlie", days_lost: 2 }),
        makeStaffAbsence({ staff_name: "Charlie", days_lost: 7 }),
        makeStaffAbsence({ staff_name: "Charlie", days_lost: 1 }),
      ];
      const result = computeAbsenceMetrics(absences, 10, NOW);
      expect(result.by_staff).toEqual({ Charlie: 10 });
    });
  });

  describe("totalStaff edge cases", () => {
    it("handles totalStaff = 0 gracefully", () => {
      const absences = [makeStaffAbsence({ days_lost: 10 })];
      const result = computeAbsenceMetrics(absences, 0, NOW);
      expect(result.absence_rate).toBe(0);
      expect(result.total_absences).toBe(1);
    });
  });

  describe("all cancelled absences", () => {
    it("avg_days_per_absence is 0 when all cancelled", () => {
      const absences = [
        makeStaffAbsence({ status: "cancelled", days_lost: 10 }),
        makeStaffAbsence({ status: "cancelled", days_lost: 20 }),
      ];
      const result = computeAbsenceMetrics(absences, 10, NOW);
      expect(result.avg_days_per_absence).toBe(0);
      expect(result.total_absences).toBe(2);
      expect(result.total_days_lost).toBe(30);
    });
  });

  describe("single absence", () => {
    it("handles a single absence correctly", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "sickness_short_term",
          sickness_reason: "cold_flu",
          days_lost: 5,
          status: "current",
          staff_name: "Eve",
          agency_cover_used: true,
        }),
      ];
      const result = computeAbsenceMetrics(absences, 10, NOW);
      expect(result.total_absences).toBe(1);
      expect(result.current_absences).toBe(1);
      expect(result.sickness_absences).toBe(1);
      expect(result.total_days_lost).toBe(5);
      expect(result.avg_days_per_absence).toBe(5);
      expect(result.agency_cover_count).toBe(1);
      expect(result.by_type).toEqual({ sickness_short_term: 1 });
      expect(result.by_reason).toEqual({ cold_flu: 1 });
      expect(result.by_status).toEqual({ current: 1 });
      expect(result.by_staff).toEqual({ Eve: 5 });
    });
  });

  describe("large dataset", () => {
    it("handles 100 absences correctly", () => {
      const absences: StaffAbsence[] = [];
      for (let i = 0; i < 100; i++) {
        absences.push(
          makeStaffAbsence({
            staff_name: `Staff_${i % 10}`,
            days_lost: 2,
            status: i % 5 === 0 ? "cancelled" : "current",
            absence_type: i % 3 === 0 ? "sickness_short_term" : "annual_leave",
          }),
        );
      }
      const result = computeAbsenceMetrics(absences, 50, NOW);
      expect(result.total_absences).toBe(100);
      expect(result.total_days_lost).toBe(200);
      // 20 cancelled, 80 active => avg = round((200/80)*10)/10 = 2.5
      expect(result.avg_days_per_absence).toBe(2.5);
    });
  });

  describe("returns object with all 17 fields", () => {
    it("contains every expected key", () => {
      const result = computeAbsenceMetrics([], 10, NOW);
      const keys = Object.keys(result);
      expect(keys).toContain("total_absences");
      expect(keys).toContain("current_absences");
      expect(keys).toContain("sickness_absences");
      expect(keys).toContain("total_days_lost");
      expect(keys).toContain("avg_days_per_absence");
      expect(keys).toContain("absence_rate");
      expect(keys).toContain("agency_cover_count");
      expect(keys).toContain("return_to_work_pending");
      expect(keys).toContain("return_to_work_overdue");
      expect(keys).toContain("occupational_health_referrals");
      expect(keys).toContain("unauthorised_absences");
      expect(keys).toContain("long_term_sickness");
      expect(keys).toContain("stress_related");
      expect(keys).toContain("by_type");
      expect(keys).toContain("by_reason");
      expect(keys).toContain("by_status");
      expect(keys).toContain("by_staff");
      expect(keys).toHaveLength(17);
    });
  });

  describe("default now parameter", () => {
    it("accepts call without explicit now parameter", () => {
      const result = computeAbsenceMetrics([], 10);
      expect(result.total_absences).toBe(0);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. identifyAbsenceAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyAbsenceAlerts", () => {
  describe("empty inputs", () => {
    it("returns no alerts for empty absences", () => {
      expect(identifyAbsenceAlerts([], 10, NOW)).toEqual([]);
    });

    it("returns no alerts for empty absences with zero staff", () => {
      expect(identifyAbsenceAlerts([], 0, NOW)).toEqual([]);
    });
  });

  describe("unauthorised_absence alert", () => {
    it("fires for current + unauthorised absence", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "unauthorised",
          status: "current",
          staff_name: "Jane Smith",
          staff_role: "Senior Carer",
          start_date: "2026-05-10",
        }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      const found = alerts.find((a) => a.type === "unauthorised_absence");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("high");
      expect(found!.message).toContain("Jane Smith");
      expect(found!.message).toContain("Senior Carer");
      expect(found!.message).toContain("2026-05-10");
    });

    it("does not fire for unauthorised + returned", () => {
      const absences = [
        makeStaffAbsence({ absence_type: "unauthorised", status: "returned" }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      expect(alerts.find((a) => a.type === "unauthorised_absence")).toBeUndefined();
    });

    it("does not fire for current + non-unauthorised type", () => {
      const absences = [
        makeStaffAbsence({ absence_type: "annual_leave", status: "current" }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      expect(alerts.find((a) => a.type === "unauthorised_absence")).toBeUndefined();
    });

    it("does not fire for unauthorised + planned", () => {
      const absences = [
        makeStaffAbsence({ absence_type: "unauthorised", status: "planned" }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      expect(alerts.find((a) => a.type === "unauthorised_absence")).toBeUndefined();
    });

    it("fires multiple alerts for multiple unauthorised current absences", () => {
      const absences = [
        makeStaffAbsence({ absence_type: "unauthorised", status: "current", staff_name: "A" }),
        makeStaffAbsence({ absence_type: "unauthorised", status: "current", staff_name: "B" }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      const found = alerts.filter((a) => a.type === "unauthorised_absence");
      expect(found).toHaveLength(2);
    });

    it("sets the absence id on the alert", () => {
      const absence = makeStaffAbsence({
        id: "test-id-123",
        absence_type: "unauthorised",
        status: "current",
      });
      const alerts = identifyAbsenceAlerts([absence], 10, NOW);
      const found = alerts.find((a) => a.type === "unauthorised_absence");
      expect(found!.id).toBe("test-id-123");
    });
  });

  describe("rtw_overdue alert", () => {
    it("fires for overdue return-to-work status", () => {
      const absences = [
        makeStaffAbsence({
          return_to_work_status: "overdue",
          staff_name: "Bob Clarke",
          return_to_work_date: "2026-05-05",
        }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      const found = alerts.find((a) => a.type === "rtw_overdue");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("medium");
      expect(found!.message).toContain("Bob Clarke");
      expect(found!.message).toContain("2026-05-05");
    });

    it("shows 'unknown date' when return_to_work_date is null", () => {
      const absences = [
        makeStaffAbsence({
          return_to_work_status: "overdue",
          return_to_work_date: null,
          staff_name: "Dave",
        }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      const found = alerts.find((a) => a.type === "rtw_overdue");
      expect(found!.message).toContain("unknown date");
    });

    it("does not fire for pending return-to-work", () => {
      const absences = [
        makeStaffAbsence({ return_to_work_status: "pending" }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      expect(alerts.find((a) => a.type === "rtw_overdue")).toBeUndefined();
    });

    it("does not fire for completed return-to-work", () => {
      const absences = [
        makeStaffAbsence({ return_to_work_status: "completed" }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      expect(alerts.find((a) => a.type === "rtw_overdue")).toBeUndefined();
    });
  });

  describe("no_oh_referral alert", () => {
    it("fires for long-term sickness, current, no OH referral", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "sickness_long_term",
          status: "current",
          occupational_health_referral: false,
          staff_name: "Carol Adams",
          start_date: "2026-04-01",
        }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      const found = alerts.find((a) => a.type === "no_oh_referral");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("high");
      expect(found!.message).toContain("Carol Adams");
      expect(found!.message).toContain("2026-04-01");
    });

    it("does not fire when OH referral is true", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "sickness_long_term",
          status: "current",
          occupational_health_referral: true,
        }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      expect(alerts.find((a) => a.type === "no_oh_referral")).toBeUndefined();
    });

    it("does not fire for short-term sickness", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "sickness_short_term",
          status: "current",
          occupational_health_referral: false,
        }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      expect(alerts.find((a) => a.type === "no_oh_referral")).toBeUndefined();
    });

    it("does not fire for returned status", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "sickness_long_term",
          status: "returned",
          occupational_health_referral: false,
        }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      expect(alerts.find((a) => a.type === "no_oh_referral")).toBeUndefined();
    });
  });

  describe("no_fit_note alert", () => {
    it("fires for sickness + current + no fit note + >7 days", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "sickness_short_term",
          status: "current",
          fit_note_received: false,
          days_lost: 10,
          staff_name: "Dan Jones",
        }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      const found = alerts.find((a) => a.type === "no_fit_note");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("medium");
      expect(found!.message).toContain("Dan Jones");
      expect(found!.message).toContain("10 days");
    });

    it("fires for long-term sickness + current + no fit note + >7 days", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "sickness_long_term",
          status: "current",
          fit_note_received: false,
          days_lost: 15,
        }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      expect(alerts.find((a) => a.type === "no_fit_note")).toBeDefined();
    });

    it("does NOT fire when days_lost <= 7", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "sickness_short_term",
          status: "current",
          fit_note_received: false,
          days_lost: 7,
        }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      expect(alerts.find((a) => a.type === "no_fit_note")).toBeUndefined();
    });

    it("does NOT fire when days_lost is exactly 5", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "sickness_short_term",
          status: "current",
          fit_note_received: false,
          days_lost: 5,
        }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      expect(alerts.find((a) => a.type === "no_fit_note")).toBeUndefined();
    });

    it("does NOT fire when fit_note_received is true", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "sickness_short_term",
          status: "current",
          fit_note_received: true,
          days_lost: 15,
        }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      expect(alerts.find((a) => a.type === "no_fit_note")).toBeUndefined();
    });

    it("does NOT fire for non-sickness absence type", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "annual_leave",
          status: "current",
          fit_note_received: false,
          days_lost: 15,
        }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      expect(alerts.find((a) => a.type === "no_fit_note")).toBeUndefined();
    });

    it("does NOT fire for returned status even with >7 days", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "sickness_short_term",
          status: "returned",
          fit_note_received: false,
          days_lost: 15,
        }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      expect(alerts.find((a) => a.type === "no_fit_note")).toBeUndefined();
    });

    it("fires at exactly 8 days (just over threshold)", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "sickness_short_term",
          status: "current",
          fit_note_received: false,
          days_lost: 8,
        }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      expect(alerts.find((a) => a.type === "no_fit_note")).toBeDefined();
    });
  });

  describe("high_absence_rate alert", () => {
    it("fires when >=25% of staff are currently absent", () => {
      // 10 staff, ceil(10 * 0.25) = 3, need 3 current absences
      const absences = [
        makeStaffAbsence({ status: "current" }),
        makeStaffAbsence({ status: "current" }),
        makeStaffAbsence({ status: "current" }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      const found = alerts.find((a) => a.type === "high_absence_rate");
      expect(found).toBeDefined();
      expect(found!.severity).toBe("critical");
      expect(found!.id).toBe("staffing_alert");
      expect(found!.message).toContain("3 of 10");
    });

    it("does not fire when below threshold", () => {
      // 10 staff, ceil(10 * 0.25) = 3, need at least 3 current
      const absences = [
        makeStaffAbsence({ status: "current" }),
        makeStaffAbsence({ status: "current" }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      expect(alerts.find((a) => a.type === "high_absence_rate")).toBeUndefined();
    });

    it("uses Math.ceil for threshold calculation", () => {
      // 5 staff, ceil(5 * 0.25) = ceil(1.25) = 2
      const absences = [
        makeStaffAbsence({ status: "current" }),
        makeStaffAbsence({ status: "current" }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 5, NOW);
      const found = alerts.find((a) => a.type === "high_absence_rate");
      expect(found).toBeDefined();
    });

    it("fires at threshold with 4 staff", () => {
      // 4 staff, ceil(4 * 0.25) = ceil(1.0) = 1
      const absences = [
        makeStaffAbsence({ status: "current" }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 4, NOW);
      expect(alerts.find((a) => a.type === "high_absence_rate")).toBeDefined();
    });

    it("does not fire when totalStaff is 0", () => {
      const absences = [makeStaffAbsence({ status: "current" })];
      const alerts = identifyAbsenceAlerts(absences, 0, NOW);
      expect(alerts.find((a) => a.type === "high_absence_rate")).toBeUndefined();
    });

    it("does not count non-current statuses", () => {
      // 4 staff, threshold = 1; only returned absences
      const absences = [
        makeStaffAbsence({ status: "returned" }),
        makeStaffAbsence({ status: "cancelled" }),
        makeStaffAbsence({ status: "planned" }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 4, NOW);
      expect(alerts.find((a) => a.type === "high_absence_rate")).toBeUndefined();
    });

    it("includes percentage in message", () => {
      const absences = [
        makeStaffAbsence({ status: "current" }),
        makeStaffAbsence({ status: "current" }),
        makeStaffAbsence({ status: "current" }),
        makeStaffAbsence({ status: "current" }),
        makeStaffAbsence({ status: "current" }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      const found = alerts.find((a) => a.type === "high_absence_rate");
      expect(found!.message).toContain("50%");
    });
  });

  describe("combined scenarios", () => {
    it("generates multiple different alert types simultaneously", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "unauthorised",
          status: "current",
          staff_name: "Unauth Person",
        }),
        makeStaffAbsence({
          return_to_work_status: "overdue",
          staff_name: "Overdue Person",
        }),
        makeStaffAbsence({
          absence_type: "sickness_long_term",
          status: "current",
          occupational_health_referral: false,
          staff_name: "No OH Person",
        }),
        makeStaffAbsence({
          absence_type: "sickness_short_term",
          status: "current",
          fit_note_received: false,
          days_lost: 10,
          staff_name: "No Fit Note",
        }),
      ];
      // 4 current out of 4 staff = 100% => high_absence_rate too
      const alerts = identifyAbsenceAlerts(absences, 4, NOW);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("unauthorised_absence");
      expect(types).toContain("rtw_overdue");
      expect(types).toContain("no_oh_referral");
      expect(types).toContain("no_fit_note");
      expect(types).toContain("high_absence_rate");
    });

    it("non-triggering absences produce no alerts", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "annual_leave",
          status: "returned",
          return_to_work_status: "completed",
          fit_note_received: true,
          occupational_health_referral: false,
        }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 20, NOW);
      expect(alerts).toHaveLength(0);
    });
  });

  describe("message content", () => {
    it("unauthorised alert message includes 'follow up immediately'", () => {
      const absences = [
        makeStaffAbsence({ absence_type: "unauthorised", status: "current" }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      const found = alerts.find((a) => a.type === "unauthorised_absence");
      expect(found!.message).toContain("follow up immediately");
    });

    it("rtw_overdue message includes 'Return-to-work interview overdue'", () => {
      const absences = [
        makeStaffAbsence({ return_to_work_status: "overdue" }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      const found = alerts.find((a) => a.type === "rtw_overdue");
      expect(found!.message).toContain("Return-to-work interview overdue");
    });

    it("no_oh_referral message includes 'consider referral'", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "sickness_long_term",
          status: "current",
          occupational_health_referral: false,
        }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      const found = alerts.find((a) => a.type === "no_oh_referral");
      expect(found!.message).toContain("consider referral");
    });

    it("no_fit_note message includes 'request from GP'", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "sickness_short_term",
          status: "current",
          fit_note_received: false,
          days_lost: 10,
        }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      const found = alerts.find((a) => a.type === "no_fit_note");
      expect(found!.message).toContain("request from GP");
    });

    it("high_absence_rate message includes 'critically impacted'", () => {
      const absences = [
        makeStaffAbsence({ status: "current" }),
        makeStaffAbsence({ status: "current" }),
        makeStaffAbsence({ status: "current" }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 4, NOW);
      const found = alerts.find((a) => a.type === "high_absence_rate");
      expect(found!.message).toContain("critically impacted");
    });
  });

  describe("default now parameter", () => {
    it("accepts call without explicit now parameter", () => {
      const alerts = identifyAbsenceAlerts([], 10);
      expect(alerts).toEqual([]);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  describe("listAbsences", () => {
    it("returns ok: true with empty data array", async () => {
      const result = await listAbsences("home-1");
      expect(result).toEqual({ ok: true, data: [] });
    });

    it("returns ok: true regardless of filters", async () => {
      const result = await listAbsences("home-1", {
        absenceType: "sickness_short_term",
        status: "current",
        staffName: "Alice",
        dateFrom: "2026-01-01",
        dateTo: "2026-12-31",
        limit: 50,
      });
      expect(result).toEqual({ ok: true, data: [] });
    });
  });

  describe("createAbsence", () => {
    it("returns ok: false with 'Supabase not configured' error", async () => {
      const result = await createAbsence({
        homeId: "home-1",
        staffName: "Alice",
        staffRole: "Carer",
        absenceType: "annual_leave",
        startDate: "2026-05-01",
        daysLost: 3,
        agencyCoverUsed: false,
      });
      expect(result).toEqual({ ok: false, error: "Supabase not configured" });
    });
  });

  describe("updateAbsence", () => {
    it("returns ok: false with 'Supabase not configured' error", async () => {
      const result = await updateAbsence("some-id", { status: "returned" });
      expect(result).toEqual({ ok: false, error: "Supabase not configured" });
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  describe("single item handling", () => {
    it("computeAbsenceMetrics handles single absence with all fields populated", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "sickness_long_term",
          sickness_reason: "stress_anxiety",
          days_lost: 30,
          status: "current",
          agency_cover_used: true,
          return_to_work_status: "pending",
          occupational_health_referral: true,
          staff_name: "SinglePerson",
        }),
      ];
      const result = computeAbsenceMetrics(absences, 1, NOW);
      expect(result.total_absences).toBe(1);
      expect(result.sickness_absences).toBe(1);
      expect(result.long_term_sickness).toBe(1);
      expect(result.stress_related).toBe(1);
      expect(result.agency_cover_count).toBe(1);
      expect(result.return_to_work_pending).toBe(1);
      expect(result.occupational_health_referrals).toBe(1);
    });

    it("identifyAbsenceAlerts handles single alert-triggering absence", () => {
      const absences = [
        makeStaffAbsence({
          absence_type: "unauthorised",
          status: "current",
        }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("large dataset (100 absences)", () => {
    it("computes metrics for 100 absences without error", () => {
      const absences: StaffAbsence[] = Array.from({ length: 100 }, (_, i) =>
        makeStaffAbsence({
          staff_name: `Worker_${i}`,
          absence_type: "annual_leave",
          days_lost: 1,
          status: "returned",
        }),
      );
      const result = computeAbsenceMetrics(absences, 50, NOW);
      expect(result.total_absences).toBe(100);
      expect(result.total_days_lost).toBe(100);
    });

    it("identifies alerts for large dataset", () => {
      const absences: StaffAbsence[] = Array.from({ length: 100 }, (_, i) =>
        makeStaffAbsence({
          staff_name: `Worker_${i}`,
          status: "current",
          days_lost: 1,
        }),
      );
      // 100 current out of 50 staff = well over threshold
      const alerts = identifyAbsenceAlerts(absences, 50, NOW);
      expect(alerts.find((a) => a.type === "high_absence_rate")).toBeDefined();
    });
  });

  describe("totalStaff = 0", () => {
    it("absence_rate is 0", () => {
      const absences = [makeStaffAbsence({ days_lost: 100 })];
      expect(computeAbsenceMetrics(absences, 0, NOW).absence_rate).toBe(0);
    });

    it("no high_absence_rate alert fires", () => {
      const absences = [makeStaffAbsence({ status: "current" })];
      const alerts = identifyAbsenceAlerts(absences, 0, NOW);
      expect(alerts.find((a) => a.type === "high_absence_rate")).toBeUndefined();
    });
  });

  describe("all same type", () => {
    it("by_type groups all under one key", () => {
      const absences = Array.from({ length: 5 }, () =>
        makeStaffAbsence({ absence_type: "training" }),
      );
      const result = computeAbsenceMetrics(absences, 10, NOW);
      expect(Object.keys(result.by_type)).toHaveLength(1);
      expect(result.by_type.training).toBe(5);
    });
  });

  describe("all same staff member", () => {
    it("by_staff aggregates all days under one name", () => {
      const absences = [
        makeStaffAbsence({ staff_name: "OnlyPerson", days_lost: 3 }),
        makeStaffAbsence({ staff_name: "OnlyPerson", days_lost: 7 }),
        makeStaffAbsence({ staff_name: "OnlyPerson", days_lost: 2 }),
      ];
      const result = computeAbsenceMetrics(absences, 10, NOW);
      expect(Object.keys(result.by_staff)).toHaveLength(1);
      expect(result.by_staff.OnlyPerson).toBe(12);
    });
  });

  describe("type safety checks", () => {
    it("factory helper returns a valid StaffAbsence shape", () => {
      const a = makeStaffAbsence();
      expect(typeof a.id).toBe("string");
      expect(typeof a.home_id).toBe("string");
      expect(typeof a.staff_name).toBe("string");
      expect(typeof a.staff_role).toBe("string");
      expect(typeof a.absence_type).toBe("string");
      expect(typeof a.start_date).toBe("string");
      expect(typeof a.days_lost).toBe("number");
      expect(typeof a.status).toBe("string");
      expect(typeof a.agency_cover_used).toBe("boolean");
      expect(typeof a.return_to_work_status).toBe("string");
      expect(typeof a.occupational_health_referral).toBe("boolean");
      expect(typeof a.fit_note_received).toBe("boolean");
      expect(typeof a.created_at).toBe("string");
      expect(typeof a.updated_at).toBe("string");
    });

    it("factory helper generates unique IDs", () => {
      const a1 = makeStaffAbsence();
      const a2 = makeStaffAbsence();
      expect(a1.id).not.toBe(a2.id);
    });

    it("factory helper allows overriding any field", () => {
      const a = makeStaffAbsence({
        staff_name: "Custom Name",
        days_lost: 99,
        absence_type: "jury_service",
      });
      expect(a.staff_name).toBe("Custom Name");
      expect(a.days_lost).toBe(99);
      expect(a.absence_type).toBe("jury_service");
    });

    it("metrics return has correct types for numeric fields", () => {
      const result = computeAbsenceMetrics([], 10, NOW);
      expect(typeof result.total_absences).toBe("number");
      expect(typeof result.current_absences).toBe("number");
      expect(typeof result.sickness_absences).toBe("number");
      expect(typeof result.total_days_lost).toBe("number");
      expect(typeof result.avg_days_per_absence).toBe("number");
      expect(typeof result.absence_rate).toBe("number");
      expect(typeof result.agency_cover_count).toBe("number");
      expect(typeof result.return_to_work_pending).toBe("number");
      expect(typeof result.return_to_work_overdue).toBe("number");
      expect(typeof result.occupational_health_referrals).toBe("number");
      expect(typeof result.unauthorised_absences).toBe("number");
      expect(typeof result.long_term_sickness).toBe("number");
      expect(typeof result.stress_related).toBe("number");
    });

    it("metrics return has correct types for grouping fields", () => {
      const result = computeAbsenceMetrics([], 10, NOW);
      expect(typeof result.by_type).toBe("object");
      expect(typeof result.by_reason).toBe("object");
      expect(typeof result.by_status).toBe("object");
      expect(typeof result.by_staff).toBe("object");
    });

    it("alert objects have all required fields", () => {
      const absences = [
        makeStaffAbsence({ absence_type: "unauthorised", status: "current" }),
      ];
      const alerts = identifyAbsenceAlerts(absences, 10, NOW);
      for (const alert of alerts) {
        expect(typeof alert.type).toBe("string");
        expect(typeof alert.severity).toBe("string");
        expect(typeof alert.message).toBe("string");
        expect(typeof alert.id).toBe("string");
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });
  });
});
