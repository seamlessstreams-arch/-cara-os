// ══════════════════════════════════════════════════════════════════════════════
// CARA — INFECTION CONTROL SERVICE TESTS
// Pure-function unit tests for infection control metrics computation, alert
// identification, and constant validation.
// CHR 2015 Reg 25 (health and safety — infection prevention),
// Reg 12 (protection — preventing harm from infection),
// Reg 36 (premises — cleanliness).
//
// Covers: hand hygiene audits, cleaning schedules, PPE compliance,
// outbreak management, deep cleans, and immunisation compliance.
//
// SCCIF: Helped & Protected — "Infection control measures protect children."
// "The home is clean and hygienic."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  INFECTION_EVENT_TYPES,
  HYGIENE_STANDARDS,
  OUTBREAK_STATUSES,
  PPE_COMPLIANCES,
} from "../infection-control-service";

import type { InfectionControlRecord } from "../infection-control-service";
import { todayStr } from "@/lib/utils";

const { computeInfectionControlMetrics, identifyInfectionControlAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(todayStr());

/** Build a minimal InfectionControlRecord with sensible defaults. */
function makeRecord(overrides: Partial<InfectionControlRecord> = {}): InfectionControlRecord {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    event_type: "hand_hygiene_audit",
    event_date: "2024-06-01",
    hygiene_standard: "good",
    outbreak_status: "no_outbreak",
    ppe_compliance: "fully_compliant",
    hand_washing_observed: true,
    sanitiser_available: true,
    cleaning_schedule_followed: true,
    laundry_procedures_followed: true,
    food_hygiene_maintained: true,
    children_symptomatic: 0,
    staff_symptomatic: 0,
    gp_contacted: false,
    public_health_notified: false,
    isolation_measures_in_place: false,
    issues_found: [],
    actions_taken: [],
    assessed_by: "Nurse Jones",
    next_review_date:
      "next_review_date" in (overrides ?? {})
        ? (overrides!.next_review_date ?? null)
        : null,
    notes:
      "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "2024-06-01T10:00:00.000Z",
    updated_at: "2024-06-01T10:00:00.000Z",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("INFECTION_EVENT_TYPES", () => {
  it("has exactly 10 entries", () => {
    expect(INFECTION_EVENT_TYPES).toHaveLength(10);
  });

  it("contains unique type values", () => {
    const values = INFECTION_EVENT_TYPES.map((e) => e.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = INFECTION_EVENT_TYPES.map((e) => e.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const e of INFECTION_EVENT_TYPES) {
      expect(e.label.length).toBeGreaterThan(0);
    }
  });

  it("includes hand_hygiene_audit", () => {
    expect(INFECTION_EVENT_TYPES.find((e) => e.type === "hand_hygiene_audit")).toBeTruthy();
  });

  it("includes cleaning_schedule_check", () => {
    expect(INFECTION_EVENT_TYPES.find((e) => e.type === "cleaning_schedule_check")).toBeTruthy();
  });

  it("includes ppe_compliance_check", () => {
    expect(INFECTION_EVENT_TYPES.find((e) => e.type === "ppe_compliance_check")).toBeTruthy();
  });

  it("includes outbreak_management", () => {
    expect(INFECTION_EVENT_TYPES.find((e) => e.type === "outbreak_management")).toBeTruthy();
  });

  it("includes deep_clean", () => {
    expect(INFECTION_EVENT_TYPES.find((e) => e.type === "deep_clean")).toBeTruthy();
  });

  it("includes immunisation_check", () => {
    expect(INFECTION_EVENT_TYPES.find((e) => e.type === "immunisation_check")).toBeTruthy();
  });

  it("includes illness_report", () => {
    expect(INFECTION_EVENT_TYPES.find((e) => e.type === "illness_report")).toBeTruthy();
  });

  it("includes infection_incident", () => {
    expect(INFECTION_EVENT_TYPES.find((e) => e.type === "infection_incident")).toBeTruthy();
  });

  it("includes laundry_hygiene", () => {
    expect(INFECTION_EVENT_TYPES.find((e) => e.type === "laundry_hygiene")).toBeTruthy();
  });

  it("includes other", () => {
    expect(INFECTION_EVENT_TYPES.find((e) => e.type === "other")).toBeTruthy();
  });
});

describe("HYGIENE_STANDARDS", () => {
  it("has exactly 5 entries", () => {
    expect(HYGIENE_STANDARDS).toHaveLength(5);
  });

  it("contains unique standard values", () => {
    const values = HYGIENE_STANDARDS.map((s) => s.standard);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = HYGIENE_STANDARDS.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const s of HYGIENE_STANDARDS) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("includes excellent", () => {
    expect(HYGIENE_STANDARDS.find((s) => s.standard === "excellent")).toBeTruthy();
  });

  it("includes good", () => {
    expect(HYGIENE_STANDARDS.find((s) => s.standard === "good")).toBeTruthy();
  });

  it("includes acceptable", () => {
    expect(HYGIENE_STANDARDS.find((s) => s.standard === "acceptable")).toBeTruthy();
  });

  it("includes poor", () => {
    expect(HYGIENE_STANDARDS.find((s) => s.standard === "poor")).toBeTruthy();
  });

  it("includes not_assessed", () => {
    expect(HYGIENE_STANDARDS.find((s) => s.standard === "not_assessed")).toBeTruthy();
  });
});

describe("OUTBREAK_STATUSES", () => {
  it("has exactly 5 entries", () => {
    expect(OUTBREAK_STATUSES).toHaveLength(5);
  });

  it("contains unique status values", () => {
    const values = OUTBREAK_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = OUTBREAK_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const s of OUTBREAK_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("includes no_outbreak", () => {
    expect(OUTBREAK_STATUSES.find((s) => s.status === "no_outbreak")).toBeTruthy();
  });

  it("includes suspected", () => {
    expect(OUTBREAK_STATUSES.find((s) => s.status === "suspected")).toBeTruthy();
  });

  it("includes confirmed", () => {
    expect(OUTBREAK_STATUSES.find((s) => s.status === "confirmed")).toBeTruthy();
  });

  it("includes contained", () => {
    expect(OUTBREAK_STATUSES.find((s) => s.status === "contained")).toBeTruthy();
  });

  it("includes resolved", () => {
    expect(OUTBREAK_STATUSES.find((s) => s.status === "resolved")).toBeTruthy();
  });
});

describe("PPE_COMPLIANCES", () => {
  it("has exactly 5 entries", () => {
    expect(PPE_COMPLIANCES).toHaveLength(5);
  });

  it("contains unique compliance values", () => {
    const values = PPE_COMPLIANCES.map((p) => p.compliance);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = PPE_COMPLIANCES.map((p) => p.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const p of PPE_COMPLIANCES) {
      expect(p.label.length).toBeGreaterThan(0);
    }
  });

  it("includes fully_compliant", () => {
    expect(PPE_COMPLIANCES.find((p) => p.compliance === "fully_compliant")).toBeTruthy();
  });

  it("includes partially_compliant", () => {
    expect(PPE_COMPLIANCES.find((p) => p.compliance === "partially_compliant")).toBeTruthy();
  });

  it("includes non_compliant", () => {
    expect(PPE_COMPLIANCES.find((p) => p.compliance === "non_compliant")).toBeTruthy();
  });

  it("includes not_applicable", () => {
    expect(PPE_COMPLIANCES.find((p) => p.compliance === "not_applicable")).toBeTruthy();
  });

  it("includes not_checked", () => {
    expect(PPE_COMPLIANCES.find((p) => p.compliance === "not_checked")).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeInfectionControlMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeInfectionControlMetrics", () => {
  // ── Empty array ──────────────────────────────────────────────────────
  describe("empty records", () => {
    it("returns zero total_records", () => {
      expect(computeInfectionControlMetrics([]).total_records).toBe(0);
    });

    it("returns zero hand_hygiene_audit_count", () => {
      expect(computeInfectionControlMetrics([]).hand_hygiene_audit_count).toBe(0);
    });

    it("returns zero cleaning_check_count", () => {
      expect(computeInfectionControlMetrics([]).cleaning_check_count).toBe(0);
    });

    it("returns zero outbreak_count", () => {
      expect(computeInfectionControlMetrics([]).outbreak_count).toBe(0);
    });

    it("returns zero infection_incident_count", () => {
      expect(computeInfectionControlMetrics([]).infection_incident_count).toBe(0);
    });

    it("returns zero excellent_hygiene_rate", () => {
      expect(computeInfectionControlMetrics([]).excellent_hygiene_rate).toBeNull();;
    });

    it("returns zero poor_hygiene_count", () => {
      expect(computeInfectionControlMetrics([]).poor_hygiene_count).toBe(0);
    });

    it("returns zero hand_washing_observed_rate", () => {
      expect(computeInfectionControlMetrics([]).hand_washing_observed_rate).toBeNull();;
    });

    it("returns zero sanitiser_available_rate", () => {
      expect(computeInfectionControlMetrics([]).sanitiser_available_rate).toBeNull();;
    });

    it("returns zero cleaning_schedule_followed_rate", () => {
      expect(computeInfectionControlMetrics([]).cleaning_schedule_followed_rate).toBeNull();;
    });

    it("returns zero laundry_procedures_rate", () => {
      expect(computeInfectionControlMetrics([]).laundry_procedures_rate).toBeNull();;
    });

    it("returns zero food_hygiene_rate", () => {
      expect(computeInfectionControlMetrics([]).food_hygiene_rate).toBeNull();;
    });

    it("returns zero ppe_fully_compliant_rate", () => {
      expect(computeInfectionControlMetrics([]).ppe_fully_compliant_rate).toBeNull();;
    });

    it("returns zero ppe_non_compliant_count", () => {
      expect(computeInfectionControlMetrics([]).ppe_non_compliant_count).toBe(0);
    });

    it("returns zero total_children_symptomatic", () => {
      expect(computeInfectionControlMetrics([]).total_children_symptomatic).toBe(0);
    });

    it("returns zero total_staff_symptomatic", () => {
      expect(computeInfectionControlMetrics([]).total_staff_symptomatic).toBe(0);
    });

    it("returns zero active_outbreak_count", () => {
      expect(computeInfectionControlMetrics([]).active_outbreak_count).toBe(0);
    });

    it("returns zero review_overdue_count", () => {
      expect(computeInfectionControlMetrics([]).review_overdue_count).toBe(0);
    });

    it("returns empty by_event_type", () => {
      expect(computeInfectionControlMetrics([]).by_event_type).toEqual({});
    });

    it("returns empty by_hygiene_standard", () => {
      expect(computeInfectionControlMetrics([]).by_hygiene_standard).toEqual({});
    });

    it("returns empty by_outbreak_status", () => {
      expect(computeInfectionControlMetrics([]).by_outbreak_status).toEqual({});
    });

    it("returns empty by_ppe_compliance", () => {
      expect(computeInfectionControlMetrics([]).by_ppe_compliance).toEqual({});
    });
  });

  // ── Single record ──────────────────────────────────────────────────
  describe("single record", () => {
    const single = [makeRecord()];

    it("total_records is 1", () => {
      expect(computeInfectionControlMetrics(single).total_records).toBe(1);
    });

    it("hand_hygiene_audit_count is 1 for hand_hygiene_audit event", () => {
      expect(computeInfectionControlMetrics(single).hand_hygiene_audit_count).toBe(1);
    });

    it("cleaning_check_count is 0 for hand_hygiene_audit event", () => {
      expect(computeInfectionControlMetrics(single).cleaning_check_count).toBe(0);
    });

    it("outbreak_count is 0 for hand_hygiene_audit event", () => {
      expect(computeInfectionControlMetrics(single).outbreak_count).toBe(0);
    });

    it("infection_incident_count is 0 for hand_hygiene_audit event", () => {
      expect(computeInfectionControlMetrics(single).infection_incident_count).toBe(0);
    });

    it("excellent_hygiene_rate is 0 for good hygiene standard", () => {
      expect(computeInfectionControlMetrics(single).excellent_hygiene_rate).toBe(0);
    });

    it("poor_hygiene_count is 0 for good hygiene standard", () => {
      expect(computeInfectionControlMetrics(single).poor_hygiene_count).toBe(0);
    });

    it("hand_washing_observed_rate is 100 when hand_washing_observed is true", () => {
      expect(computeInfectionControlMetrics(single).hand_washing_observed_rate).toBe(100);
    });

    it("sanitiser_available_rate is 100 when sanitiser_available is true", () => {
      expect(computeInfectionControlMetrics(single).sanitiser_available_rate).toBe(100);
    });

    it("cleaning_schedule_followed_rate is 100 when cleaning_schedule_followed is true", () => {
      expect(computeInfectionControlMetrics(single).cleaning_schedule_followed_rate).toBe(100);
    });

    it("laundry_procedures_rate is 100 when laundry_procedures_followed is true", () => {
      expect(computeInfectionControlMetrics(single).laundry_procedures_rate).toBe(100);
    });

    it("food_hygiene_rate is 100 when food_hygiene_maintained is true", () => {
      expect(computeInfectionControlMetrics(single).food_hygiene_rate).toBe(100);
    });

    it("ppe_fully_compliant_rate is 100 for fully_compliant record", () => {
      expect(computeInfectionControlMetrics(single).ppe_fully_compliant_rate).toBe(100);
    });

    it("ppe_non_compliant_count is 0 for fully_compliant record", () => {
      expect(computeInfectionControlMetrics(single).ppe_non_compliant_count).toBe(0);
    });

    it("total_children_symptomatic is 0 when children_symptomatic is 0", () => {
      expect(computeInfectionControlMetrics(single).total_children_symptomatic).toBe(0);
    });

    it("total_staff_symptomatic is 0 when staff_symptomatic is 0", () => {
      expect(computeInfectionControlMetrics(single).total_staff_symptomatic).toBe(0);
    });

    it("active_outbreak_count is 0 for no_outbreak status", () => {
      expect(computeInfectionControlMetrics(single).active_outbreak_count).toBe(0);
    });

    it("review_overdue_count is 0 when next_review_date is null", () => {
      expect(computeInfectionControlMetrics(single).review_overdue_count).toBe(0);
    });

    it("by_event_type groups single record correctly", () => {
      expect(computeInfectionControlMetrics(single).by_event_type).toEqual({ hand_hygiene_audit: 1 });
    });

    it("by_hygiene_standard groups single record correctly", () => {
      expect(computeInfectionControlMetrics(single).by_hygiene_standard).toEqual({ good: 1 });
    });

    it("by_outbreak_status groups single record correctly", () => {
      expect(computeInfectionControlMetrics(single).by_outbreak_status).toEqual({ no_outbreak: 1 });
    });

    it("by_ppe_compliance groups single record correctly", () => {
      expect(computeInfectionControlMetrics(single).by_ppe_compliance).toEqual({ fully_compliant: 1 });
    });

    it("cleaning_check_count is 1 for cleaning_schedule_check event", () => {
      const r = [makeRecord({ event_type: "cleaning_schedule_check" })];
      expect(computeInfectionControlMetrics(r).cleaning_check_count).toBe(1);
    });

    it("outbreak_count is 1 for outbreak_management event", () => {
      const r = [makeRecord({ event_type: "outbreak_management" })];
      expect(computeInfectionControlMetrics(r).outbreak_count).toBe(1);
    });

    it("infection_incident_count is 1 for infection_incident event", () => {
      const r = [makeRecord({ event_type: "infection_incident" })];
      expect(computeInfectionControlMetrics(r).infection_incident_count).toBe(1);
    });
  });

  // ── Multiple records ─────────────────────────────────────────────────
  describe("multiple records", () => {
    const records = [
      makeRecord({
        id: "r-1",
        event_type: "hand_hygiene_audit",
        hygiene_standard: "excellent",
        outbreak_status: "no_outbreak",
        ppe_compliance: "fully_compliant",
        hand_washing_observed: true,
        sanitiser_available: true,
        cleaning_schedule_followed: true,
        laundry_procedures_followed: true,
        food_hygiene_maintained: true,
        children_symptomatic: 0,
        staff_symptomatic: 0,
      }),
      makeRecord({
        id: "r-2",
        event_type: "cleaning_schedule_check",
        hygiene_standard: "poor",
        outbreak_status: "confirmed",
        ppe_compliance: "non_compliant",
        hand_washing_observed: false,
        sanitiser_available: false,
        cleaning_schedule_followed: false,
        laundry_procedures_followed: false,
        food_hygiene_maintained: false,
        children_symptomatic: 3,
        staff_symptomatic: 1,
      }),
      makeRecord({
        id: "r-3",
        event_type: "outbreak_management",
        hygiene_standard: "good",
        outbreak_status: "suspected",
        ppe_compliance: "partially_compliant",
        hand_washing_observed: true,
        sanitiser_available: true,
        cleaning_schedule_followed: true,
        laundry_procedures_followed: false,
        food_hygiene_maintained: true,
        children_symptomatic: 2,
        staff_symptomatic: 0,
      }),
      makeRecord({
        id: "r-4",
        event_type: "infection_incident",
        hygiene_standard: "acceptable",
        outbreak_status: "contained",
        ppe_compliance: "fully_compliant",
        hand_washing_observed: false,
        sanitiser_available: false,
        cleaning_schedule_followed: false,
        laundry_procedures_followed: true,
        food_hygiene_maintained: false,
        children_symptomatic: 0,
        staff_symptomatic: 2,
      }),
      makeRecord({
        id: "r-5",
        event_type: "hand_hygiene_audit",
        hygiene_standard: "excellent",
        outbreak_status: "resolved",
        ppe_compliance: "not_checked",
        hand_washing_observed: true,
        sanitiser_available: true,
        cleaning_schedule_followed: true,
        laundry_procedures_followed: true,
        food_hygiene_maintained: true,
        children_symptomatic: 1,
        staff_symptomatic: 0,
      }),
    ];

    it("total_records is 5", () => {
      expect(computeInfectionControlMetrics(records).total_records).toBe(5);
    });

    it("hand_hygiene_audit_count is 2", () => {
      expect(computeInfectionControlMetrics(records).hand_hygiene_audit_count).toBe(2);
    });

    it("cleaning_check_count is 1", () => {
      expect(computeInfectionControlMetrics(records).cleaning_check_count).toBe(1);
    });

    it("outbreak_count is 1", () => {
      expect(computeInfectionControlMetrics(records).outbreak_count).toBe(1);
    });

    it("infection_incident_count is 1", () => {
      expect(computeInfectionControlMetrics(records).infection_incident_count).toBe(1);
    });

    it("excellent_hygiene_rate is 40 (2 of 5)", () => {
      expect(computeInfectionControlMetrics(records).excellent_hygiene_rate).toBe(40);
    });

    it("poor_hygiene_count is 1", () => {
      expect(computeInfectionControlMetrics(records).poor_hygiene_count).toBe(1);
    });

    it("hand_washing_observed_rate is 60 (3 of 5)", () => {
      expect(computeInfectionControlMetrics(records).hand_washing_observed_rate).toBe(60);
    });

    it("sanitiser_available_rate is 60 (3 of 5)", () => {
      expect(computeInfectionControlMetrics(records).sanitiser_available_rate).toBe(60);
    });

    it("cleaning_schedule_followed_rate is 60 (3 of 5)", () => {
      expect(computeInfectionControlMetrics(records).cleaning_schedule_followed_rate).toBe(60);
    });

    it("laundry_procedures_rate is 60 (3 of 5)", () => {
      expect(computeInfectionControlMetrics(records).laundry_procedures_rate).toBe(60);
    });

    it("food_hygiene_rate is 60 (3 of 5)", () => {
      expect(computeInfectionControlMetrics(records).food_hygiene_rate).toBe(60);
    });

    it("ppe_fully_compliant_rate is 40 (2 of 5)", () => {
      expect(computeInfectionControlMetrics(records).ppe_fully_compliant_rate).toBe(40);
    });

    it("ppe_non_compliant_count is 1", () => {
      expect(computeInfectionControlMetrics(records).ppe_non_compliant_count).toBe(1);
    });

    it("total_children_symptomatic is 6", () => {
      expect(computeInfectionControlMetrics(records).total_children_symptomatic).toBe(6);
    });

    it("total_staff_symptomatic is 3", () => {
      expect(computeInfectionControlMetrics(records).total_staff_symptomatic).toBe(3);
    });

    it("active_outbreak_count is 2 (suspected + confirmed)", () => {
      expect(computeInfectionControlMetrics(records).active_outbreak_count).toBe(2);
    });

    it("by_event_type groups correctly", () => {
      expect(computeInfectionControlMetrics(records).by_event_type).toEqual({
        hand_hygiene_audit: 2,
        cleaning_schedule_check: 1,
        outbreak_management: 1,
        infection_incident: 1,
      });
    });

    it("by_hygiene_standard groups correctly", () => {
      expect(computeInfectionControlMetrics(records).by_hygiene_standard).toEqual({
        excellent: 2,
        poor: 1,
        good: 1,
        acceptable: 1,
      });
    });

    it("by_outbreak_status groups correctly", () => {
      expect(computeInfectionControlMetrics(records).by_outbreak_status).toEqual({
        no_outbreak: 1,
        confirmed: 1,
        suspected: 1,
        contained: 1,
        resolved: 1,
      });
    });

    it("by_ppe_compliance groups correctly", () => {
      expect(computeInfectionControlMetrics(records).by_ppe_compliance).toEqual({
        fully_compliant: 2,
        non_compliant: 1,
        partially_compliant: 1,
        not_checked: 1,
      });
    });
  });

  // ── excellent_hygiene_rate ──────────────────────────────────────────
  describe("excellent_hygiene_rate", () => {
    it("is 100 when all records are excellent", () => {
      const r = [
        makeRecord({ id: "1", hygiene_standard: "excellent" }),
        makeRecord({ id: "2", hygiene_standard: "excellent" }),
      ];
      expect(computeInfectionControlMetrics(r).excellent_hygiene_rate).toBe(100);
    });

    it("is 0 when no records are excellent", () => {
      const r = [
        makeRecord({ id: "1", hygiene_standard: "good" }),
        makeRecord({ id: "2", hygiene_standard: "poor" }),
      ];
      expect(computeInfectionControlMetrics(r).excellent_hygiene_rate).toBe(0);
    });

    it("is 50 for 1 of 2 excellent", () => {
      const r = [
        makeRecord({ id: "1", hygiene_standard: "excellent" }),
        makeRecord({ id: "2", hygiene_standard: "good" }),
      ];
      expect(computeInfectionControlMetrics(r).excellent_hygiene_rate).toBe(50);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const r = [
        makeRecord({ id: "1", hygiene_standard: "excellent" }),
        makeRecord({ id: "2", hygiene_standard: "good" }),
        makeRecord({ id: "3", hygiene_standard: "poor" }),
      ];
      expect(computeInfectionControlMetrics(r).excellent_hygiene_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const r = [
        makeRecord({ id: "1", hygiene_standard: "excellent" }),
        makeRecord({ id: "2", hygiene_standard: "excellent" }),
        makeRecord({ id: "3", hygiene_standard: "good" }),
      ];
      expect(computeInfectionControlMetrics(r).excellent_hygiene_rate).toBe(66.7);
    });
  });

  // ── poor_hygiene_count ─────────────────────────────────────────────
  describe("poor_hygiene_count", () => {
    it("counts all poor records", () => {
      const r = [
        makeRecord({ id: "1", hygiene_standard: "poor" }),
        makeRecord({ id: "2", hygiene_standard: "poor" }),
        makeRecord({ id: "3", hygiene_standard: "good" }),
      ];
      expect(computeInfectionControlMetrics(r).poor_hygiene_count).toBe(2);
    });

    it("is 0 when none are poor", () => {
      const r = [
        makeRecord({ id: "1", hygiene_standard: "excellent" }),
        makeRecord({ id: "2", hygiene_standard: "good" }),
      ];
      expect(computeInfectionControlMetrics(r).poor_hygiene_count).toBe(0);
    });

    it("does not count acceptable as poor", () => {
      const r = [makeRecord({ id: "1", hygiene_standard: "acceptable" })];
      expect(computeInfectionControlMetrics(r).poor_hygiene_count).toBe(0);
    });

    it("does not count not_assessed as poor", () => {
      const r = [makeRecord({ id: "1", hygiene_standard: "not_assessed" })];
      expect(computeInfectionControlMetrics(r).poor_hygiene_count).toBe(0);
    });
  });

  // ── hand_washing_observed_rate ─────────────────────────────────────
  describe("hand_washing_observed_rate", () => {
    it("is 100 when all have hand_washing_observed", () => {
      const r = [
        makeRecord({ id: "1", hand_washing_observed: true }),
        makeRecord({ id: "2", hand_washing_observed: true }),
      ];
      expect(computeInfectionControlMetrics(r).hand_washing_observed_rate).toBe(100);
    });

    it("is 0 when none have hand_washing_observed", () => {
      const r = [
        makeRecord({ id: "1", hand_washing_observed: false }),
        makeRecord({ id: "2", hand_washing_observed: false }),
      ];
      expect(computeInfectionControlMetrics(r).hand_washing_observed_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const r = [
        makeRecord({ id: "1", hand_washing_observed: true }),
        makeRecord({ id: "2", hand_washing_observed: false }),
        makeRecord({ id: "3", hand_washing_observed: false }),
      ];
      expect(computeInfectionControlMetrics(r).hand_washing_observed_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const r = [
        makeRecord({ id: "1", hand_washing_observed: true }),
        makeRecord({ id: "2", hand_washing_observed: true }),
        makeRecord({ id: "3", hand_washing_observed: false }),
      ];
      expect(computeInfectionControlMetrics(r).hand_washing_observed_rate).toBe(66.7);
    });
  });

  // ── sanitiser_available_rate ───────────────────────────────────────
  describe("sanitiser_available_rate", () => {
    it("is 100 when all have sanitiser_available", () => {
      const r = [
        makeRecord({ id: "1", sanitiser_available: true }),
        makeRecord({ id: "2", sanitiser_available: true }),
      ];
      expect(computeInfectionControlMetrics(r).sanitiser_available_rate).toBe(100);
    });

    it("is 0 when none have sanitiser_available", () => {
      const r = [
        makeRecord({ id: "1", sanitiser_available: false }),
        makeRecord({ id: "2", sanitiser_available: false }),
      ];
      expect(computeInfectionControlMetrics(r).sanitiser_available_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const r = [
        makeRecord({ id: "1", sanitiser_available: true }),
        makeRecord({ id: "2", sanitiser_available: false }),
        makeRecord({ id: "3", sanitiser_available: false }),
      ];
      expect(computeInfectionControlMetrics(r).sanitiser_available_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const r = [
        makeRecord({ id: "1", sanitiser_available: true }),
        makeRecord({ id: "2", sanitiser_available: true }),
        makeRecord({ id: "3", sanitiser_available: false }),
      ];
      expect(computeInfectionControlMetrics(r).sanitiser_available_rate).toBe(66.7);
    });
  });

  // ── cleaning_schedule_followed_rate ────────────────────────────────
  describe("cleaning_schedule_followed_rate", () => {
    it("is 100 when all have cleaning_schedule_followed", () => {
      const r = [
        makeRecord({ id: "1", cleaning_schedule_followed: true }),
        makeRecord({ id: "2", cleaning_schedule_followed: true }),
      ];
      expect(computeInfectionControlMetrics(r).cleaning_schedule_followed_rate).toBe(100);
    });

    it("is 0 when none have cleaning_schedule_followed", () => {
      const r = [
        makeRecord({ id: "1", cleaning_schedule_followed: false }),
        makeRecord({ id: "2", cleaning_schedule_followed: false }),
      ];
      expect(computeInfectionControlMetrics(r).cleaning_schedule_followed_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const r = [
        makeRecord({ id: "1", cleaning_schedule_followed: true }),
        makeRecord({ id: "2", cleaning_schedule_followed: false }),
        makeRecord({ id: "3", cleaning_schedule_followed: false }),
      ];
      expect(computeInfectionControlMetrics(r).cleaning_schedule_followed_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const r = [
        makeRecord({ id: "1", cleaning_schedule_followed: true }),
        makeRecord({ id: "2", cleaning_schedule_followed: true }),
        makeRecord({ id: "3", cleaning_schedule_followed: false }),
      ];
      expect(computeInfectionControlMetrics(r).cleaning_schedule_followed_rate).toBe(66.7);
    });
  });

  // ── laundry_procedures_rate ────────────────────────────────────────
  describe("laundry_procedures_rate", () => {
    it("is 100 when all have laundry_procedures_followed", () => {
      const r = [
        makeRecord({ id: "1", laundry_procedures_followed: true }),
        makeRecord({ id: "2", laundry_procedures_followed: true }),
      ];
      expect(computeInfectionControlMetrics(r).laundry_procedures_rate).toBe(100);
    });

    it("is 0 when none have laundry_procedures_followed", () => {
      const r = [
        makeRecord({ id: "1", laundry_procedures_followed: false }),
        makeRecord({ id: "2", laundry_procedures_followed: false }),
      ];
      expect(computeInfectionControlMetrics(r).laundry_procedures_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const r = [
        makeRecord({ id: "1", laundry_procedures_followed: true }),
        makeRecord({ id: "2", laundry_procedures_followed: false }),
        makeRecord({ id: "3", laundry_procedures_followed: false }),
      ];
      expect(computeInfectionControlMetrics(r).laundry_procedures_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const r = [
        makeRecord({ id: "1", laundry_procedures_followed: true }),
        makeRecord({ id: "2", laundry_procedures_followed: true }),
        makeRecord({ id: "3", laundry_procedures_followed: false }),
      ];
      expect(computeInfectionControlMetrics(r).laundry_procedures_rate).toBe(66.7);
    });
  });

  // ── food_hygiene_rate ──────────────────────────────────────────────
  describe("food_hygiene_rate", () => {
    it("is 100 when all have food_hygiene_maintained", () => {
      const r = [
        makeRecord({ id: "1", food_hygiene_maintained: true }),
        makeRecord({ id: "2", food_hygiene_maintained: true }),
      ];
      expect(computeInfectionControlMetrics(r).food_hygiene_rate).toBe(100);
    });

    it("is 0 when none have food_hygiene_maintained", () => {
      const r = [
        makeRecord({ id: "1", food_hygiene_maintained: false }),
        makeRecord({ id: "2", food_hygiene_maintained: false }),
      ];
      expect(computeInfectionControlMetrics(r).food_hygiene_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const r = [
        makeRecord({ id: "1", food_hygiene_maintained: true }),
        makeRecord({ id: "2", food_hygiene_maintained: false }),
        makeRecord({ id: "3", food_hygiene_maintained: false }),
      ];
      expect(computeInfectionControlMetrics(r).food_hygiene_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const r = [
        makeRecord({ id: "1", food_hygiene_maintained: true }),
        makeRecord({ id: "2", food_hygiene_maintained: true }),
        makeRecord({ id: "3", food_hygiene_maintained: false }),
      ];
      expect(computeInfectionControlMetrics(r).food_hygiene_rate).toBe(66.7);
    });
  });

  // ── ppe_fully_compliant_rate ───────────────────────────────────────
  describe("ppe_fully_compliant_rate", () => {
    it("is 100 when all are fully_compliant", () => {
      const r = [
        makeRecord({ id: "1", ppe_compliance: "fully_compliant" }),
        makeRecord({ id: "2", ppe_compliance: "fully_compliant" }),
      ];
      expect(computeInfectionControlMetrics(r).ppe_fully_compliant_rate).toBe(100);
    });

    it("is 0 when none are fully_compliant", () => {
      const r = [
        makeRecord({ id: "1", ppe_compliance: "non_compliant" }),
        makeRecord({ id: "2", ppe_compliance: "partially_compliant" }),
      ];
      expect(computeInfectionControlMetrics(r).ppe_fully_compliant_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const r = [
        makeRecord({ id: "1", ppe_compliance: "fully_compliant" }),
        makeRecord({ id: "2", ppe_compliance: "non_compliant" }),
        makeRecord({ id: "3", ppe_compliance: "partially_compliant" }),
      ];
      expect(computeInfectionControlMetrics(r).ppe_fully_compliant_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const r = [
        makeRecord({ id: "1", ppe_compliance: "fully_compliant" }),
        makeRecord({ id: "2", ppe_compliance: "fully_compliant" }),
        makeRecord({ id: "3", ppe_compliance: "non_compliant" }),
      ];
      expect(computeInfectionControlMetrics(r).ppe_fully_compliant_rate).toBe(66.7);
    });
  });

  // ── ppe_non_compliant_count ────────────────────────────────────────
  describe("ppe_non_compliant_count", () => {
    it("counts all non_compliant records", () => {
      const r = [
        makeRecord({ id: "1", ppe_compliance: "non_compliant" }),
        makeRecord({ id: "2", ppe_compliance: "non_compliant" }),
        makeRecord({ id: "3", ppe_compliance: "fully_compliant" }),
      ];
      expect(computeInfectionControlMetrics(r).ppe_non_compliant_count).toBe(2);
    });

    it("is 0 when none are non_compliant", () => {
      const r = [
        makeRecord({ id: "1", ppe_compliance: "fully_compliant" }),
        makeRecord({ id: "2", ppe_compliance: "partially_compliant" }),
      ];
      expect(computeInfectionControlMetrics(r).ppe_non_compliant_count).toBe(0);
    });

    it("does not count partially_compliant as non_compliant", () => {
      const r = [makeRecord({ id: "1", ppe_compliance: "partially_compliant" })];
      expect(computeInfectionControlMetrics(r).ppe_non_compliant_count).toBe(0);
    });

    it("does not count not_applicable as non_compliant", () => {
      const r = [makeRecord({ id: "1", ppe_compliance: "not_applicable" })];
      expect(computeInfectionControlMetrics(r).ppe_non_compliant_count).toBe(0);
    });

    it("does not count not_checked as non_compliant", () => {
      const r = [makeRecord({ id: "1", ppe_compliance: "not_checked" })];
      expect(computeInfectionControlMetrics(r).ppe_non_compliant_count).toBe(0);
    });
  });

  // ── total_children_symptomatic ─────────────────────────────────────
  describe("total_children_symptomatic", () => {
    it("sums children_symptomatic across records", () => {
      const r = [
        makeRecord({ id: "1", children_symptomatic: 3 }),
        makeRecord({ id: "2", children_symptomatic: 2 }),
        makeRecord({ id: "3", children_symptomatic: 1 }),
      ];
      expect(computeInfectionControlMetrics(r).total_children_symptomatic).toBe(6);
    });

    it("is 0 when all records have 0 symptomatic", () => {
      const r = [
        makeRecord({ id: "1", children_symptomatic: 0 }),
        makeRecord({ id: "2", children_symptomatic: 0 }),
      ];
      expect(computeInfectionControlMetrics(r).total_children_symptomatic).toBe(0);
    });

    it("handles single record with high count", () => {
      const r = [makeRecord({ id: "1", children_symptomatic: 10 })];
      expect(computeInfectionControlMetrics(r).total_children_symptomatic).toBe(10);
    });
  });

  // ── total_staff_symptomatic ────────────────────────────────────────
  describe("total_staff_symptomatic", () => {
    it("sums staff_symptomatic across records", () => {
      const r = [
        makeRecord({ id: "1", staff_symptomatic: 2 }),
        makeRecord({ id: "2", staff_symptomatic: 3 }),
        makeRecord({ id: "3", staff_symptomatic: 0 }),
      ];
      expect(computeInfectionControlMetrics(r).total_staff_symptomatic).toBe(5);
    });

    it("is 0 when all records have 0 symptomatic", () => {
      const r = [
        makeRecord({ id: "1", staff_symptomatic: 0 }),
        makeRecord({ id: "2", staff_symptomatic: 0 }),
      ];
      expect(computeInfectionControlMetrics(r).total_staff_symptomatic).toBe(0);
    });

    it("handles single record with high count", () => {
      const r = [makeRecord({ id: "1", staff_symptomatic: 8 })];
      expect(computeInfectionControlMetrics(r).total_staff_symptomatic).toBe(8);
    });
  });

  // ── active_outbreak_count ──────────────────────────────────────────
  describe("active_outbreak_count", () => {
    it("counts suspected as active", () => {
      const r = [makeRecord({ id: "1", outbreak_status: "suspected" })];
      expect(computeInfectionControlMetrics(r).active_outbreak_count).toBe(1);
    });

    it("counts confirmed as active", () => {
      const r = [makeRecord({ id: "1", outbreak_status: "confirmed" })];
      expect(computeInfectionControlMetrics(r).active_outbreak_count).toBe(1);
    });

    it("does not count no_outbreak as active", () => {
      const r = [makeRecord({ id: "1", outbreak_status: "no_outbreak" })];
      expect(computeInfectionControlMetrics(r).active_outbreak_count).toBe(0);
    });

    it("does not count contained as active", () => {
      const r = [makeRecord({ id: "1", outbreak_status: "contained" })];
      expect(computeInfectionControlMetrics(r).active_outbreak_count).toBe(0);
    });

    it("does not count resolved as active", () => {
      const r = [makeRecord({ id: "1", outbreak_status: "resolved" })];
      expect(computeInfectionControlMetrics(r).active_outbreak_count).toBe(0);
    });

    it("counts both suspected and confirmed in mixed set", () => {
      const r = [
        makeRecord({ id: "1", outbreak_status: "suspected" }),
        makeRecord({ id: "2", outbreak_status: "confirmed" }),
        makeRecord({ id: "3", outbreak_status: "contained" }),
        makeRecord({ id: "4", outbreak_status: "resolved" }),
        makeRecord({ id: "5", outbreak_status: "no_outbreak" }),
      ];
      expect(computeInfectionControlMetrics(r).active_outbreak_count).toBe(2);
    });
  });

  // ── review_overdue_count ───────────────────────────────────────────
  describe("review_overdue_count", () => {
    it("is 0 when next_review_date is null", () => {
      const r = [makeRecord({ next_review_date: null })];
      expect(computeInfectionControlMetrics(r).review_overdue_count).toBe(0);
    });

    it("is 0 when next_review_date is in the future", () => {
      const future = new Date(now);
      future.setDate(future.getDate() + 30);
      const r = [makeRecord({ next_review_date: future.toISOString().split("T")[0] })];
      expect(computeInfectionControlMetrics(r).review_overdue_count).toBe(0);
    });

    it("counts past next_review_date as overdue", () => {
      const past = new Date(now);
      past.setDate(past.getDate() - 5);
      const r = [makeRecord({ next_review_date: past.toISOString().split("T")[0] })];
      expect(computeInfectionControlMetrics(r).review_overdue_count).toBe(1);
    });

    it("counts multiple overdue reviews", () => {
      const past1 = new Date(now);
      past1.setDate(past1.getDate() - 5);
      const past2 = new Date(now);
      past2.setDate(past2.getDate() - 10);
      const r = [
        makeRecord({ id: "1", next_review_date: past1.toISOString().split("T")[0] }),
        makeRecord({ id: "2", next_review_date: past2.toISOString().split("T")[0] }),
      ];
      expect(computeInfectionControlMetrics(r).review_overdue_count).toBe(2);
    });

    it("excludes null from overdue count", () => {
      const past = new Date(now);
      past.setDate(past.getDate() - 5);
      const r = [
        makeRecord({ id: "1", next_review_date: past.toISOString().split("T")[0] }),
        makeRecord({ id: "2", next_review_date: null }),
      ];
      expect(computeInfectionControlMetrics(r).review_overdue_count).toBe(1);
    });

    it("mixes future and past dates correctly", () => {
      const past = new Date(now);
      past.setDate(past.getDate() - 5);
      const future = new Date(now);
      future.setDate(future.getDate() + 30);
      const r = [
        makeRecord({ id: "1", next_review_date: past.toISOString().split("T")[0] }),
        makeRecord({ id: "2", next_review_date: future.toISOString().split("T")[0] }),
        makeRecord({ id: "3", next_review_date: null }),
      ];
      expect(computeInfectionControlMetrics(r).review_overdue_count).toBe(1);
    });
  });

  // ── Event type counts ──────────────────────────────────────────────
  describe("event type counts", () => {
    it("counts multiple hand_hygiene_audit events", () => {
      const r = [
        makeRecord({ id: "1", event_type: "hand_hygiene_audit" }),
        makeRecord({ id: "2", event_type: "hand_hygiene_audit" }),
        makeRecord({ id: "3", event_type: "cleaning_schedule_check" }),
      ];
      expect(computeInfectionControlMetrics(r).hand_hygiene_audit_count).toBe(2);
    });

    it("counts multiple cleaning_schedule_check events", () => {
      const r = [
        makeRecord({ id: "1", event_type: "cleaning_schedule_check" }),
        makeRecord({ id: "2", event_type: "cleaning_schedule_check" }),
        makeRecord({ id: "3", event_type: "hand_hygiene_audit" }),
      ];
      expect(computeInfectionControlMetrics(r).cleaning_check_count).toBe(2);
    });

    it("counts multiple outbreak_management events", () => {
      const r = [
        makeRecord({ id: "1", event_type: "outbreak_management" }),
        makeRecord({ id: "2", event_type: "outbreak_management" }),
        makeRecord({ id: "3", event_type: "hand_hygiene_audit" }),
      ];
      expect(computeInfectionControlMetrics(r).outbreak_count).toBe(2);
    });

    it("counts multiple infection_incident events", () => {
      const r = [
        makeRecord({ id: "1", event_type: "infection_incident" }),
        makeRecord({ id: "2", event_type: "infection_incident" }),
        makeRecord({ id: "3", event_type: "hand_hygiene_audit" }),
      ];
      expect(computeInfectionControlMetrics(r).infection_incident_count).toBe(2);
    });

    it("returns 0 for event types not in records", () => {
      const r = [
        makeRecord({ id: "1", event_type: "deep_clean" }),
        makeRecord({ id: "2", event_type: "other" }),
      ];
      const m = computeInfectionControlMetrics(r);
      expect(m.hand_hygiene_audit_count).toBe(0);
      expect(m.cleaning_check_count).toBe(0);
      expect(m.outbreak_count).toBe(0);
      expect(m.infection_incident_count).toBe(0);
    });
  });

  // ── by_ breakdown maps ───────────────────────────────────────────────
  describe("by_ breakdown maps", () => {
    it("by_event_type handles all event types present", () => {
      const r = [
        makeRecord({ id: "1", event_type: "hand_hygiene_audit" }),
        makeRecord({ id: "2", event_type: "hand_hygiene_audit" }),
        makeRecord({ id: "3", event_type: "cleaning_schedule_check" }),
        makeRecord({ id: "4", event_type: "infection_incident" }),
      ];
      expect(computeInfectionControlMetrics(r).by_event_type).toEqual({
        hand_hygiene_audit: 2,
        cleaning_schedule_check: 1,
        infection_incident: 1,
      });
    });

    it("by_hygiene_standard handles multiple standards", () => {
      const r = [
        makeRecord({ id: "1", hygiene_standard: "excellent" }),
        makeRecord({ id: "2", hygiene_standard: "excellent" }),
        makeRecord({ id: "3", hygiene_standard: "poor" }),
      ];
      expect(computeInfectionControlMetrics(r).by_hygiene_standard).toEqual({
        excellent: 2,
        poor: 1,
      });
    });

    it("by_outbreak_status handles multiple statuses", () => {
      const r = [
        makeRecord({ id: "1", outbreak_status: "no_outbreak" }),
        makeRecord({ id: "2", outbreak_status: "no_outbreak" }),
        makeRecord({ id: "3", outbreak_status: "confirmed" }),
        makeRecord({ id: "4", outbreak_status: "suspected" }),
      ];
      expect(computeInfectionControlMetrics(r).by_outbreak_status).toEqual({
        no_outbreak: 2,
        confirmed: 1,
        suspected: 1,
      });
    });

    it("by_ppe_compliance handles all statuses present", () => {
      const r = [
        makeRecord({ id: "1", ppe_compliance: "fully_compliant" }),
        makeRecord({ id: "2", ppe_compliance: "non_compliant" }),
        makeRecord({ id: "3", ppe_compliance: "partially_compliant" }),
        makeRecord({ id: "4", ppe_compliance: "not_applicable" }),
        makeRecord({ id: "5", ppe_compliance: "not_checked" }),
      ];
      expect(computeInfectionControlMetrics(r).by_ppe_compliance).toEqual({
        fully_compliant: 1,
        non_compliant: 1,
        partially_compliant: 1,
        not_applicable: 1,
        not_checked: 1,
      });
    });
  });

  // ── Rate rounding consistency ─────────────────────────────────────────
  describe("rate rounding consistency", () => {
    it("all rates use Math.round(value * 1000) / 10 formula", () => {
      const r = [
        makeRecord({
          id: "1",
          hygiene_standard: "excellent",
          hand_washing_observed: true,
          sanitiser_available: true,
          cleaning_schedule_followed: true,
          laundry_procedures_followed: true,
          food_hygiene_maintained: true,
          ppe_compliance: "fully_compliant",
        }),
        makeRecord({
          id: "2",
          hygiene_standard: "excellent",
          hand_washing_observed: true,
          sanitiser_available: true,
          cleaning_schedule_followed: true,
          laundry_procedures_followed: true,
          food_hygiene_maintained: true,
          ppe_compliance: "fully_compliant",
        }),
        makeRecord({
          id: "3",
          hygiene_standard: "good",
          hand_washing_observed: false,
          sanitiser_available: false,
          cleaning_schedule_followed: false,
          laundry_procedures_followed: false,
          food_hygiene_maintained: false,
          ppe_compliance: "non_compliant",
        }),
      ];
      const m = computeInfectionControlMetrics(r);
      // 2/3 = 66.7
      expect(m.excellent_hygiene_rate).toBe(66.7);
      expect(m.hand_washing_observed_rate).toBe(66.7);
      expect(m.sanitiser_available_rate).toBe(66.7);
      expect(m.cleaning_schedule_followed_rate).toBe(66.7);
      expect(m.laundry_procedures_rate).toBe(66.7);
      expect(m.food_hygiene_rate).toBe(66.7);
      expect(m.ppe_fully_compliant_rate).toBe(66.7);
    });

    it("all rates are 0 for empty array", () => {
      const m = computeInfectionControlMetrics([]);
      expect(m.excellent_hygiene_rate).toBeNull();;
      expect(m.hand_washing_observed_rate).toBeNull();;
      expect(m.sanitiser_available_rate).toBeNull();;
      expect(m.cleaning_schedule_followed_rate).toBeNull();;
      expect(m.laundry_procedures_rate).toBeNull();;
      expect(m.food_hygiene_rate).toBeNull();;
      expect(m.ppe_fully_compliant_rate).toBeNull();;
    });

    it("rates are 100 when all true", () => {
      const r = [
        makeRecord({
          id: "1",
          hygiene_standard: "excellent",
          hand_washing_observed: true,
          sanitiser_available: true,
          cleaning_schedule_followed: true,
          laundry_procedures_followed: true,
          food_hygiene_maintained: true,
          ppe_compliance: "fully_compliant",
        }),
      ];
      const m = computeInfectionControlMetrics(r);
      expect(m.excellent_hygiene_rate).toBe(100);
      expect(m.hand_washing_observed_rate).toBe(100);
      expect(m.sanitiser_available_rate).toBe(100);
      expect(m.cleaning_schedule_followed_rate).toBe(100);
      expect(m.laundry_procedures_rate).toBe(100);
      expect(m.food_hygiene_rate).toBe(100);
      expect(m.ppe_fully_compliant_rate).toBe(100);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyInfectionControlAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyInfectionControlAlerts", () => {
  // ── No alerts ─────────────────────────────────────────────────────
  describe("no alerts scenario", () => {
    it("returns empty array for empty records", () => {
      expect(identifyInfectionControlAlerts([])).toEqual([]);
    });

    it("returns empty array when everything is clean", () => {
      const r = [
        makeRecord({
          id: "r-1",
          hygiene_standard: "good",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      expect(identifyInfectionControlAlerts(r)).toEqual([]);
    });

    it("returns empty for clean record with future review date", () => {
      const future = new Date(now);
      future.setDate(future.getDate() + 30);
      const r = [
        makeRecord({
          id: "r-1",
          hygiene_standard: "excellent",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
          next_review_date: future.toISOString().split("T")[0],
        }),
      ];
      expect(identifyInfectionControlAlerts(r)).toEqual([]);
    });

    it("returns empty for 2 records where cleaning not followed (threshold is 3)", () => {
      const r = [
        makeRecord({ id: "r-1", cleaning_schedule_followed: false }),
        makeRecord({ id: "r-2", cleaning_schedule_followed: false }),
      ];
      expect(identifyInfectionControlAlerts(r)).toEqual([]);
    });

    it("returns empty for suspected outbreak (not confirmed)", () => {
      const r = [
        makeRecord({
          id: "r-1",
          outbreak_status: "suspected",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      expect(identifyInfectionControlAlerts(r)).toEqual([]);
    });
  });

  // ── confirmed_outbreak alert (critical) ───────────────────────────
  describe("confirmed_outbreak alert", () => {
    it("fires for outbreak_status=confirmed", () => {
      const r = [
        makeRecord({
          id: "r-1",
          outbreak_status: "confirmed",
          event_date: "2024-07-01",
          children_symptomatic: 3,
          staff_symptomatic: 1,
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const co = alerts.find((a) => a.type === "confirmed_outbreak");
      expect(co).toBeTruthy();
    });

    it("has critical severity", () => {
      const r = [
        makeRecord({
          id: "r-1",
          outbreak_status: "confirmed",
          event_date: "2024-07-01",
          children_symptomatic: 3,
          staff_symptomatic: 1,
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const co = alerts.find((a) => a.type === "confirmed_outbreak")!;
      expect(co.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const r = [
        makeRecord({
          id: "r-42",
          outbreak_status: "confirmed",
          event_date: "2024-07-01",
          children_symptomatic: 3,
          staff_symptomatic: 1,
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const co = alerts.find((a) => a.type === "confirmed_outbreak")!;
      expect(co.id).toBe("r-42");
    });

    it("message contains event_date", () => {
      const r = [
        makeRecord({
          id: "r-1",
          outbreak_status: "confirmed",
          event_date: "2024-07-15",
          children_symptomatic: 2,
          staff_symptomatic: 0,
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const co = alerts.find((a) => a.type === "confirmed_outbreak")!;
      expect(co.message).toContain("2024-07-15");
    });

    it("message contains children_symptomatic count", () => {
      const r = [
        makeRecord({
          id: "r-1",
          outbreak_status: "confirmed",
          event_date: "2024-07-01",
          children_symptomatic: 5,
          staff_symptomatic: 2,
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const co = alerts.find((a) => a.type === "confirmed_outbreak")!;
      expect(co.message).toContain("5");
    });

    it("message contains staff_symptomatic count", () => {
      const r = [
        makeRecord({
          id: "r-1",
          outbreak_status: "confirmed",
          event_date: "2024-07-01",
          children_symptomatic: 3,
          staff_symptomatic: 4,
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const co = alerts.find((a) => a.type === "confirmed_outbreak")!;
      expect(co.message).toContain("4");
    });

    it("does NOT fire for no_outbreak status", () => {
      const r = [
        makeRecord({
          id: "r-1",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "confirmed_outbreak")).toBeUndefined();
    });

    it("does NOT fire for suspected status", () => {
      const r = [
        makeRecord({
          id: "r-1",
          outbreak_status: "suspected",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "confirmed_outbreak")).toBeUndefined();
    });

    it("does NOT fire for contained status", () => {
      const r = [
        makeRecord({
          id: "r-1",
          outbreak_status: "contained",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "confirmed_outbreak")).toBeUndefined();
    });

    it("does NOT fire for resolved status", () => {
      const r = [
        makeRecord({
          id: "r-1",
          outbreak_status: "resolved",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "confirmed_outbreak")).toBeUndefined();
    });

    it("fires per record for multiple confirmed outbreaks", () => {
      const r = [
        makeRecord({
          id: "r-1",
          outbreak_status: "confirmed",
          event_date: "2024-07-01",
          children_symptomatic: 1,
          staff_symptomatic: 0,
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
        makeRecord({
          id: "r-2",
          outbreak_status: "confirmed",
          event_date: "2024-07-02",
          children_symptomatic: 2,
          staff_symptomatic: 1,
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const cos = alerts.filter((a) => a.type === "confirmed_outbreak");
      expect(cos).toHaveLength(2);
    });

    it("fires only for confirmed records in mixed set", () => {
      const r = [
        makeRecord({
          id: "r-1",
          outbreak_status: "confirmed",
          event_date: "2024-07-01",
          children_symptomatic: 3,
          staff_symptomatic: 1,
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
        makeRecord({
          id: "r-2",
          outbreak_status: "suspected",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
        makeRecord({
          id: "r-3",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const cos = alerts.filter((a) => a.type === "confirmed_outbreak");
      expect(cos).toHaveLength(1);
      expect(cos[0].id).toBe("r-1");
    });
  });

  // ── poor_hygiene alert (high) ─────────────────────────────────────
  describe("poor_hygiene alert", () => {
    it("fires for hygiene_standard=poor", () => {
      const r = [
        makeRecord({
          id: "r-1",
          hygiene_standard: "poor",
          event_date: "2024-08-01",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const ph = alerts.find((a) => a.type === "poor_hygiene");
      expect(ph).toBeTruthy();
    });

    it("has high severity", () => {
      const r = [
        makeRecord({
          id: "r-1",
          hygiene_standard: "poor",
          event_date: "2024-08-01",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const ph = alerts.find((a) => a.type === "poor_hygiene")!;
      expect(ph.severity).toBe("high");
    });

    it("uses the record id as alert id", () => {
      const r = [
        makeRecord({
          id: "r-99",
          hygiene_standard: "poor",
          event_date: "2024-08-01",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const ph = alerts.find((a) => a.type === "poor_hygiene")!;
      expect(ph.id).toBe("r-99");
    });

    it("message contains event_date", () => {
      const r = [
        makeRecord({
          id: "r-1",
          hygiene_standard: "poor",
          event_date: "2024-08-15",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const ph = alerts.find((a) => a.type === "poor_hygiene")!;
      expect(ph.message).toContain("2024-08-15");
    });

    it("does NOT fire for excellent standard", () => {
      const r = [
        makeRecord({
          id: "r-1",
          hygiene_standard: "excellent",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "poor_hygiene")).toBeUndefined();
    });

    it("does NOT fire for good standard", () => {
      const r = [
        makeRecord({
          id: "r-1",
          hygiene_standard: "good",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "poor_hygiene")).toBeUndefined();
    });

    it("does NOT fire for acceptable standard", () => {
      const r = [
        makeRecord({
          id: "r-1",
          hygiene_standard: "acceptable",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "poor_hygiene")).toBeUndefined();
    });

    it("does NOT fire for not_assessed standard", () => {
      const r = [
        makeRecord({
          id: "r-1",
          hygiene_standard: "not_assessed",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "poor_hygiene")).toBeUndefined();
    });

    it("fires per record for multiple poor hygiene records", () => {
      const r = [
        makeRecord({
          id: "r-1",
          hygiene_standard: "poor",
          event_date: "2024-08-01",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
        makeRecord({
          id: "r-2",
          hygiene_standard: "poor",
          event_date: "2024-08-02",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const phs = alerts.filter((a) => a.type === "poor_hygiene");
      expect(phs).toHaveLength(2);
    });

    it("fires only for poor records in mixed set", () => {
      const r = [
        makeRecord({
          id: "r-1",
          hygiene_standard: "poor",
          event_date: "2024-08-01",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
        makeRecord({
          id: "r-2",
          hygiene_standard: "good",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
        makeRecord({
          id: "r-3",
          hygiene_standard: "excellent",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const phs = alerts.filter((a) => a.type === "poor_hygiene");
      expect(phs).toHaveLength(1);
      expect(phs[0].id).toBe("r-1");
    });
  });

  // ── ppe_non_compliant alert (high) ────────────────────────────────
  describe("ppe_non_compliant alert", () => {
    it("fires when 1 record has ppe_compliance=non_compliant", () => {
      const r = [
        makeRecord({
          id: "r-1",
          ppe_compliance: "non_compliant",
          outbreak_status: "no_outbreak",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const pnc = alerts.find((a) => a.type === "ppe_non_compliant");
      expect(pnc).toBeTruthy();
    });

    it("has high severity", () => {
      const r = [
        makeRecord({
          id: "r-1",
          ppe_compliance: "non_compliant",
          outbreak_status: "no_outbreak",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const pnc = alerts.find((a) => a.type === "ppe_non_compliant")!;
      expect(pnc.severity).toBe("high");
    });

    it("has id ppe_non_compliant", () => {
      const r = [
        makeRecord({
          id: "r-1",
          ppe_compliance: "non_compliant",
          outbreak_status: "no_outbreak",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const pnc = alerts.find((a) => a.type === "ppe_non_compliant")!;
      expect(pnc.id).toBe("ppe_non_compliant");
    });

    it("message uses singular for exactly 1", () => {
      const r = [
        makeRecord({
          id: "r-1",
          ppe_compliance: "non_compliant",
          outbreak_status: "no_outbreak",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const pnc = alerts.find((a) => a.type === "ppe_non_compliant")!;
      expect(pnc.message).toContain("finding");
      expect(pnc.message).not.toContain("findings");
    });

    it("message uses plural for 2", () => {
      const r = [
        makeRecord({ id: "r-1", ppe_compliance: "non_compliant", outbreak_status: "no_outbreak", cleaning_schedule_followed: true }),
        makeRecord({ id: "r-2", ppe_compliance: "non_compliant", outbreak_status: "no_outbreak", cleaning_schedule_followed: true }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const pnc = alerts.find((a) => a.type === "ppe_non_compliant")!;
      expect(pnc.message).toContain("findings");
    });

    it("message contains count", () => {
      const r = [
        makeRecord({ id: "r-1", ppe_compliance: "non_compliant", outbreak_status: "no_outbreak", cleaning_schedule_followed: true }),
        makeRecord({ id: "r-2", ppe_compliance: "non_compliant", outbreak_status: "no_outbreak", cleaning_schedule_followed: true }),
        makeRecord({ id: "r-3", ppe_compliance: "non_compliant", outbreak_status: "no_outbreak", cleaning_schedule_followed: true }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const pnc = alerts.find((a) => a.type === "ppe_non_compliant")!;
      expect(pnc.message).toContain("3");
    });

    it("does NOT fire when no records have non_compliant", () => {
      const r = [
        makeRecord({ id: "r-1", ppe_compliance: "fully_compliant", outbreak_status: "no_outbreak", cleaning_schedule_followed: true }),
        makeRecord({ id: "r-2", ppe_compliance: "partially_compliant", outbreak_status: "no_outbreak", cleaning_schedule_followed: true }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "ppe_non_compliant")).toBeUndefined();
    });

    it("counts only non_compliant in mixed ppe set", () => {
      const r = [
        makeRecord({ id: "r-1", ppe_compliance: "non_compliant", outbreak_status: "no_outbreak", cleaning_schedule_followed: true }),
        makeRecord({ id: "r-2", ppe_compliance: "fully_compliant", outbreak_status: "no_outbreak", cleaning_schedule_followed: true }),
        makeRecord({ id: "r-3", ppe_compliance: "partially_compliant", outbreak_status: "no_outbreak", cleaning_schedule_followed: true }),
        makeRecord({ id: "r-4", ppe_compliance: "non_compliant", outbreak_status: "no_outbreak", cleaning_schedule_followed: true }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const pnc = alerts.find((a) => a.type === "ppe_non_compliant")!;
      expect(pnc.message).toContain("2");
      expect(pnc.message).toContain("findings");
    });

    it("does not count not_applicable as non_compliant", () => {
      const r = [
        makeRecord({ id: "r-1", ppe_compliance: "not_applicable", outbreak_status: "no_outbreak", cleaning_schedule_followed: true }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "ppe_non_compliant")).toBeUndefined();
    });

    it("does not count not_checked as non_compliant", () => {
      const r = [
        makeRecord({ id: "r-1", ppe_compliance: "not_checked", outbreak_status: "no_outbreak", cleaning_schedule_followed: true }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "ppe_non_compliant")).toBeUndefined();
    });
  });

  // ── cleaning_not_followed alert (medium) ──────────────────────────
  describe("cleaning_not_followed alert", () => {
    it("fires when 3 records have cleaning_schedule_followed=false", () => {
      const r = [
        makeRecord({ id: "r-1", cleaning_schedule_followed: false }),
        makeRecord({ id: "r-2", cleaning_schedule_followed: false }),
        makeRecord({ id: "r-3", cleaning_schedule_followed: false }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const cnf = alerts.find((a) => a.type === "cleaning_not_followed");
      expect(cnf).toBeTruthy();
    });

    it("does NOT fire when only 2 records have cleaning_schedule_followed=false", () => {
      const r = [
        makeRecord({ id: "r-1", cleaning_schedule_followed: false }),
        makeRecord({ id: "r-2", cleaning_schedule_followed: false }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "cleaning_not_followed")).toBeUndefined();
    });

    it("does NOT fire when only 1 record has cleaning_schedule_followed=false", () => {
      const r = [
        makeRecord({ id: "r-1", cleaning_schedule_followed: false }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "cleaning_not_followed")).toBeUndefined();
    });

    it("has medium severity", () => {
      const r = [
        makeRecord({ id: "r-1", cleaning_schedule_followed: false }),
        makeRecord({ id: "r-2", cleaning_schedule_followed: false }),
        makeRecord({ id: "r-3", cleaning_schedule_followed: false }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const cnf = alerts.find((a) => a.type === "cleaning_not_followed")!;
      expect(cnf.severity).toBe("medium");
    });

    it("has id cleaning_not_followed", () => {
      const r = [
        makeRecord({ id: "r-1", cleaning_schedule_followed: false }),
        makeRecord({ id: "r-2", cleaning_schedule_followed: false }),
        makeRecord({ id: "r-3", cleaning_schedule_followed: false }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const cnf = alerts.find((a) => a.type === "cleaning_not_followed")!;
      expect(cnf.id).toBe("cleaning_not_followed");
    });

    it("message contains count", () => {
      const r = [
        makeRecord({ id: "r-1", cleaning_schedule_followed: false }),
        makeRecord({ id: "r-2", cleaning_schedule_followed: false }),
        makeRecord({ id: "r-3", cleaning_schedule_followed: false }),
        makeRecord({ id: "r-4", cleaning_schedule_followed: false }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const cnf = alerts.find((a) => a.type === "cleaning_not_followed")!;
      expect(cnf.message).toContain("4");
    });

    it("does NOT fire when all cleaning_schedule_followed are true", () => {
      const r = [
        makeRecord({ id: "r-1", cleaning_schedule_followed: true }),
        makeRecord({ id: "r-2", cleaning_schedule_followed: true }),
        makeRecord({ id: "r-3", cleaning_schedule_followed: true }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "cleaning_not_followed")).toBeUndefined();
    });

    it("counts only false values in mixed set", () => {
      const r = [
        makeRecord({ id: "r-1", cleaning_schedule_followed: false }),
        makeRecord({ id: "r-2", cleaning_schedule_followed: true }),
        makeRecord({ id: "r-3", cleaning_schedule_followed: false }),
        makeRecord({ id: "r-4", cleaning_schedule_followed: true }),
        makeRecord({ id: "r-5", cleaning_schedule_followed: false }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const cnf = alerts.find((a) => a.type === "cleaning_not_followed")!;
      expect(cnf.message).toContain("3");
    });

    it("fires at exactly 3 threshold", () => {
      const r = [
        makeRecord({ id: "r-1", cleaning_schedule_followed: false }),
        makeRecord({ id: "r-2", cleaning_schedule_followed: false }),
        makeRecord({ id: "r-3", cleaning_schedule_followed: false }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const cnf = alerts.find((a) => a.type === "cleaning_not_followed")!;
      expect(cnf.message).toContain("3");
    });
  });

  // ── review_overdue alert (medium) ─────────────────────────────────
  describe("review_overdue alert", () => {
    it("fires when 1 review is overdue", () => {
      const past = new Date(now);
      past.setDate(past.getDate() - 5);
      const r = [
        makeRecord({
          id: "r-1",
          next_review_date: past.toISOString().split("T")[0],
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const ro = alerts.find((a) => a.type === "review_overdue");
      expect(ro).toBeTruthy();
    });

    it("has medium severity", () => {
      const past = new Date(now);
      past.setDate(past.getDate() - 5);
      const r = [
        makeRecord({
          id: "r-1",
          next_review_date: past.toISOString().split("T")[0],
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const ro = alerts.find((a) => a.type === "review_overdue")!;
      expect(ro.severity).toBe("medium");
    });

    it("has id review_overdue", () => {
      const past = new Date(now);
      past.setDate(past.getDate() - 5);
      const r = [
        makeRecord({
          id: "r-1",
          next_review_date: past.toISOString().split("T")[0],
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const ro = alerts.find((a) => a.type === "review_overdue")!;
      expect(ro.id).toBe("review_overdue");
    });

    it("message uses singular for exactly 1", () => {
      const past = new Date(now);
      past.setDate(past.getDate() - 5);
      const r = [
        makeRecord({
          id: "r-1",
          next_review_date: past.toISOString().split("T")[0],
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const ro = alerts.find((a) => a.type === "review_overdue")!;
      expect(ro.message).toContain("review is");
    });

    it("message uses plural for 2", () => {
      const past1 = new Date(now);
      past1.setDate(past1.getDate() - 5);
      const past2 = new Date(now);
      past2.setDate(past2.getDate() - 10);
      const r = [
        makeRecord({ id: "r-1", next_review_date: past1.toISOString().split("T")[0], outbreak_status: "no_outbreak", ppe_compliance: "fully_compliant", cleaning_schedule_followed: true }),
        makeRecord({ id: "r-2", next_review_date: past2.toISOString().split("T")[0], outbreak_status: "no_outbreak", ppe_compliance: "fully_compliant", cleaning_schedule_followed: true }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const ro = alerts.find((a) => a.type === "review_overdue")!;
      expect(ro.message).toContain("reviews are");
    });

    it("message contains count", () => {
      const past1 = new Date(now);
      past1.setDate(past1.getDate() - 5);
      const past2 = new Date(now);
      past2.setDate(past2.getDate() - 10);
      const past3 = new Date(now);
      past3.setDate(past3.getDate() - 15);
      const r = [
        makeRecord({ id: "r-1", next_review_date: past1.toISOString().split("T")[0], outbreak_status: "no_outbreak", ppe_compliance: "fully_compliant", cleaning_schedule_followed: true }),
        makeRecord({ id: "r-2", next_review_date: past2.toISOString().split("T")[0], outbreak_status: "no_outbreak", ppe_compliance: "fully_compliant", cleaning_schedule_followed: true }),
        makeRecord({ id: "r-3", next_review_date: past3.toISOString().split("T")[0], outbreak_status: "no_outbreak", ppe_compliance: "fully_compliant", cleaning_schedule_followed: true }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const ro = alerts.find((a) => a.type === "review_overdue")!;
      expect(ro.message).toContain("3");
    });

    it("does NOT fire when next_review_date is null", () => {
      const r = [
        makeRecord({
          id: "r-1",
          next_review_date: null,
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "review_overdue")).toBeUndefined();
    });

    it("does NOT fire when next_review_date is in the future", () => {
      const future = new Date(now);
      future.setDate(future.getDate() + 30);
      const r = [
        makeRecord({
          id: "r-1",
          next_review_date: future.toISOString().split("T")[0],
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "review_overdue")).toBeUndefined();
    });

    it("excludes null from overdue count", () => {
      const past = new Date(now);
      past.setDate(past.getDate() - 5);
      const r = [
        makeRecord({ id: "r-1", next_review_date: past.toISOString().split("T")[0], outbreak_status: "no_outbreak", ppe_compliance: "fully_compliant", cleaning_schedule_followed: true }),
        makeRecord({ id: "r-2", next_review_date: null, outbreak_status: "no_outbreak", ppe_compliance: "fully_compliant", cleaning_schedule_followed: true }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const ro = alerts.find((a) => a.type === "review_overdue")!;
      expect(ro.message).toContain("1");
      expect(ro.message).toContain("review is");
    });

    it("counts only past dates in mixed set", () => {
      const past = new Date(now);
      past.setDate(past.getDate() - 5);
      const future = new Date(now);
      future.setDate(future.getDate() + 30);
      const r = [
        makeRecord({ id: "r-1", next_review_date: past.toISOString().split("T")[0], outbreak_status: "no_outbreak", ppe_compliance: "fully_compliant", cleaning_schedule_followed: true }),
        makeRecord({ id: "r-2", next_review_date: future.toISOString().split("T")[0], outbreak_status: "no_outbreak", ppe_compliance: "fully_compliant", cleaning_schedule_followed: true }),
        makeRecord({ id: "r-3", next_review_date: null, outbreak_status: "no_outbreak", ppe_compliance: "fully_compliant", cleaning_schedule_followed: true }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const ro = alerts.find((a) => a.type === "review_overdue")!;
      expect(ro.message).toContain("1");
      expect(ro.message).toContain("review is");
    });
  });

  // ── Combined alert scenarios ──────────────────────────────────────
  describe("combined alert scenarios", () => {
    it("can fire all five alert types simultaneously", () => {
      const past = new Date(now);
      past.setDate(past.getDate() - 5);
      const r = [
        // confirmed_outbreak + poor_hygiene + ppe_non_compliant + cleaning_not_followed + review_overdue
        makeRecord({
          id: "r-1",
          outbreak_status: "confirmed",
          event_date: "2024-07-01",
          children_symptomatic: 3,
          staff_symptomatic: 1,
          hygiene_standard: "poor",
          ppe_compliance: "non_compliant",
          cleaning_schedule_followed: false,
          next_review_date: past.toISOString().split("T")[0],
        }),
        makeRecord({
          id: "r-2",
          cleaning_schedule_followed: false,
        }),
        makeRecord({
          id: "r-3",
          cleaning_schedule_followed: false,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("confirmed_outbreak");
      expect(types).toContain("poor_hygiene");
      expect(types).toContain("ppe_non_compliant");
      expect(types).toContain("cleaning_not_followed");
      expect(types).toContain("review_overdue");
    });

    it("returns no alerts for a clean set of records", () => {
      const future = new Date(now);
      future.setDate(future.getDate() + 30);
      const r = [
        makeRecord({
          id: "r-1",
          hygiene_standard: "good",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
          next_review_date: future.toISOString().split("T")[0],
        }),
        makeRecord({
          id: "r-2",
          hygiene_standard: "excellent",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts).toEqual([]);
    });

    it("alert order: confirmed_outbreak before poor_hygiene before ppe_non_compliant before cleaning_not_followed before review_overdue", () => {
      const past = new Date(now);
      past.setDate(past.getDate() - 5);
      const r = [
        makeRecord({
          id: "r-1",
          outbreak_status: "confirmed",
          event_date: "2024-07-01",
          children_symptomatic: 1,
          staff_symptomatic: 0,
          hygiene_standard: "poor",
          ppe_compliance: "non_compliant",
          cleaning_schedule_followed: false,
          next_review_date: past.toISOString().split("T")[0],
        }),
        makeRecord({
          id: "r-2",
          cleaning_schedule_followed: false,
        }),
        makeRecord({
          id: "r-3",
          cleaning_schedule_followed: false,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const types = alerts.map((a) => a.type);

      const coIdx = types.indexOf("confirmed_outbreak");
      const phIdx = types.indexOf("poor_hygiene");
      const pncIdx = types.indexOf("ppe_non_compliant");
      const cnfIdx = types.indexOf("cleaning_not_followed");
      const roIdx = types.indexOf("review_overdue");

      expect(coIdx).toBeLessThan(phIdx);
      expect(phIdx).toBeLessThan(pncIdx);
      expect(pncIdx).toBeLessThan(cnfIdx);
      expect(cnfIdx).toBeLessThan(roIdx);
    });

    it("generates multiple confirmed_outbreak and poor_hygiene alerts for different records", () => {
      const r = [
        makeRecord({
          id: "r-1",
          outbreak_status: "confirmed",
          event_date: "2024-07-01",
          children_symptomatic: 1,
          staff_symptomatic: 0,
          hygiene_standard: "poor",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
        makeRecord({
          id: "r-2",
          outbreak_status: "confirmed",
          event_date: "2024-07-02",
          children_symptomatic: 2,
          staff_symptomatic: 1,
          hygiene_standard: "poor",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      const cos = alerts.filter((a) => a.type === "confirmed_outbreak");
      const phs = alerts.filter((a) => a.type === "poor_hygiene");
      expect(cos).toHaveLength(2);
      expect(phs).toHaveLength(2);
    });

    it("confirmed_outbreak does not require poor hygiene standard", () => {
      const r = [
        makeRecord({
          id: "r-1",
          outbreak_status: "confirmed",
          event_date: "2024-07-01",
          children_symptomatic: 1,
          staff_symptomatic: 0,
          hygiene_standard: "good",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "confirmed_outbreak")).toBeTruthy();
      expect(alerts.find((a) => a.type === "poor_hygiene")).toBeUndefined();
    });

    it("poor_hygiene does not require confirmed outbreak", () => {
      const r = [
        makeRecord({
          id: "r-1",
          hygiene_standard: "poor",
          event_date: "2024-08-01",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "poor_hygiene")).toBeTruthy();
      expect(alerts.find((a) => a.type === "confirmed_outbreak")).toBeUndefined();
    });

    it("ppe_non_compliant alert is independent of outbreak_status", () => {
      const r = [
        makeRecord({
          id: "r-1",
          ppe_compliance: "non_compliant",
          outbreak_status: "no_outbreak",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "ppe_non_compliant")).toBeTruthy();
      expect(alerts.find((a) => a.type === "confirmed_outbreak")).toBeUndefined();
    });

    it("cleaning_not_followed alert is independent of ppe_compliance", () => {
      const r = [
        makeRecord({ id: "r-1", cleaning_schedule_followed: false, ppe_compliance: "fully_compliant" }),
        makeRecord({ id: "r-2", cleaning_schedule_followed: false, ppe_compliance: "fully_compliant" }),
        makeRecord({ id: "r-3", cleaning_schedule_followed: false, ppe_compliance: "fully_compliant" }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "cleaning_not_followed")).toBeTruthy();
      expect(alerts.find((a) => a.type === "ppe_non_compliant")).toBeUndefined();
    });

    it("review_overdue alert is independent of hygiene_standard", () => {
      const past = new Date(now);
      past.setDate(past.getDate() - 5);
      const r = [
        makeRecord({
          id: "r-1",
          next_review_date: past.toISOString().split("T")[0],
          hygiene_standard: "excellent",
          outbreak_status: "no_outbreak",
          ppe_compliance: "fully_compliant",
          cleaning_schedule_followed: true,
        }),
      ];
      const alerts = identifyInfectionControlAlerts(r);
      expect(alerts.find((a) => a.type === "review_overdue")).toBeTruthy();
      expect(alerts.find((a) => a.type === "poor_hygiene")).toBeUndefined();
    });
  });
});
