// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BEDROOM AUDIT SERVICE TESTS
// Pure-function tests for bedroom audit metrics, alert identification,
// constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  AUDIT_TYPES,
  ROOM_CONDITIONS,
  PERSONALISATION_LEVELS,
  SAFETY_RATINGS,
  _testing,
} from "../bedroom-audit-service";

import type {
  BedroomAuditRecord,
  AuditType,
  RoomCondition,
  PersonalisationLevel,
  SafetyRating,
} from "../bedroom-audit-service";

const { computeBedroomAuditMetrics, identifyBedroomAuditAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<BedroomAuditRecord>,
): BedroomAuditRecord {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    audit_type: "audit_type" in (overrides ?? {}) ? overrides!.audit_type! : "routine_inspection",
    audit_date: "audit_date" in (overrides ?? {}) ? overrides!.audit_date! : "2026-05-01",
    room_name: "room_name" in (overrides ?? {}) ? overrides!.room_name! : "Room 1",
    child_name: "child_name" in (overrides ?? {}) ? (overrides!.child_name ?? null) : null,
    room_condition: "room_condition" in (overrides ?? {}) ? overrides!.room_condition! : "good",
    personalisation_level: "personalisation_level" in (overrides ?? {}) ? overrides!.personalisation_level! : "some_personalisation",
    safety_rating: "safety_rating" in (overrides ?? {}) ? overrides!.safety_rating! : "safe",
    furniture_adequate: "furniture_adequate" in (overrides ?? {}) ? overrides!.furniture_adequate! : true,
    furniture_good_condition: "furniture_good_condition" in (overrides ?? {}) ? overrides!.furniture_good_condition! : true,
    bedding_clean: "bedding_clean" in (overrides ?? {}) ? overrides!.bedding_clean! : true,
    window_restrictors_fitted: "window_restrictors_fitted" in (overrides ?? {}) ? overrides!.window_restrictors_fitted! : true,
    lock_working: "lock_working" in (overrides ?? {}) ? overrides!.lock_working! : true,
    lighting_adequate: "lighting_adequate" in (overrides ?? {}) ? overrides!.lighting_adequate! : true,
    heating_adequate: "heating_adequate" in (overrides ?? {}) ? overrides!.heating_adequate! : true,
    ventilation_adequate: "ventilation_adequate" in (overrides ?? {}) ? overrides!.ventilation_adequate! : true,
    decoration_acceptable: "decoration_acceptable" in (overrides ?? {}) ? overrides!.decoration_acceptable! : true,
    child_consulted: "child_consulted" in (overrides ?? {}) ? overrides!.child_consulted! : true,
    privacy_respected: "privacy_respected" in (overrides ?? {}) ? overrides!.privacy_respected! : true,
    issues_found: "issues_found" in (overrides ?? {}) ? overrides!.issues_found! : [],
    actions_taken: "actions_taken" in (overrides ?? {}) ? overrides!.actions_taken! : [],
    audited_by: "audited_by" in (overrides ?? {}) ? overrides!.audited_by! : "Staff Member",
    next_audit_date: "next_audit_date" in (overrides ?? {}) ? (overrides!.next_audit_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-05-01T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-05-01T08:00:00Z",
  };
}

/** Return an ISO date string for N days ago from now */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Return an ISO date string for N days from now (future) */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── Constants ──────────────────────────────────────────────────────────────

describe("Constants", () => {
  describe("AUDIT_TYPES", () => {
    it("has exactly 9 items", () => {
      expect(AUDIT_TYPES).toHaveLength(9);
    });

    it("contains routine_inspection", () => {
      expect(AUDIT_TYPES).toContainEqual({ type: "routine_inspection", label: "Routine Inspection" });
    });

    it("contains move_in_check", () => {
      expect(AUDIT_TYPES).toContainEqual({ type: "move_in_check", label: "Move-In Check" });
    });

    it("contains move_out_check", () => {
      expect(AUDIT_TYPES).toContainEqual({ type: "move_out_check", label: "Move-Out Check" });
    });

    it("contains safety_check", () => {
      expect(AUDIT_TYPES).toContainEqual({ type: "safety_check", label: "Safety Check" });
    });

    it("contains personalisation_review", () => {
      expect(AUDIT_TYPES).toContainEqual({ type: "personalisation_review", label: "Personalisation Review" });
    });

    it("contains furniture_check", () => {
      expect(AUDIT_TYPES).toContainEqual({ type: "furniture_check", label: "Furniture Check" });
    });

    it("contains deep_clean_check", () => {
      expect(AUDIT_TYPES).toContainEqual({ type: "deep_clean_check", label: "Deep Clean Check" });
    });

    it("contains complaint_follow_up", () => {
      expect(AUDIT_TYPES).toContainEqual({ type: "complaint_follow_up", label: "Complaint Follow-Up" });
    });

    it("contains other", () => {
      expect(AUDIT_TYPES).toContainEqual({ type: "other", label: "Other" });
    });

    it("has unique type values", () => {
      const types = AUDIT_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique labels", () => {
      const labels = AUDIT_TYPES.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of AUDIT_TYPES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("ROOM_CONDITIONS", () => {
    it("has exactly 5 items", () => {
      expect(ROOM_CONDITIONS).toHaveLength(5);
    });

    it("contains excellent", () => {
      expect(ROOM_CONDITIONS).toContainEqual({ condition: "excellent", label: "Excellent" });
    });

    it("contains good", () => {
      expect(ROOM_CONDITIONS).toContainEqual({ condition: "good", label: "Good" });
    });

    it("contains satisfactory", () => {
      expect(ROOM_CONDITIONS).toContainEqual({ condition: "satisfactory", label: "Satisfactory" });
    });

    it("contains poor", () => {
      expect(ROOM_CONDITIONS).toContainEqual({ condition: "poor", label: "Poor" });
    });

    it("contains unacceptable", () => {
      expect(ROOM_CONDITIONS).toContainEqual({ condition: "unacceptable", label: "Unacceptable" });
    });

    it("has unique condition values", () => {
      const conditions = ROOM_CONDITIONS.map((c) => c.condition);
      expect(new Set(conditions).size).toBe(conditions.length);
    });

    it("has unique labels", () => {
      const labels = ROOM_CONDITIONS.map((c) => c.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of ROOM_CONDITIONS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("PERSONALISATION_LEVELS", () => {
    it("has exactly 5 items", () => {
      expect(PERSONALISATION_LEVELS).toHaveLength(5);
    });

    it("contains highly_personalised", () => {
      expect(PERSONALISATION_LEVELS).toContainEqual({ level: "highly_personalised", label: "Highly Personalised" });
    });

    it("contains some_personalisation", () => {
      expect(PERSONALISATION_LEVELS).toContainEqual({ level: "some_personalisation", label: "Some Personalisation" });
    });

    it("contains minimal_personalisation", () => {
      expect(PERSONALISATION_LEVELS).toContainEqual({ level: "minimal_personalisation", label: "Minimal Personalisation" });
    });

    it("contains not_personalised", () => {
      expect(PERSONALISATION_LEVELS).toContainEqual({ level: "not_personalised", label: "Not Personalised" });
    });

    it("contains not_assessed", () => {
      expect(PERSONALISATION_LEVELS).toContainEqual({ level: "not_assessed", label: "Not Assessed" });
    });

    it("has unique level values", () => {
      const levels = PERSONALISATION_LEVELS.map((l) => l.level);
      expect(new Set(levels).size).toBe(levels.length);
    });

    it("has unique labels", () => {
      const labels = PERSONALISATION_LEVELS.map((l) => l.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of PERSONALISATION_LEVELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("SAFETY_RATINGS", () => {
    it("has exactly 5 items", () => {
      expect(SAFETY_RATINGS).toHaveLength(5);
    });

    it("contains safe", () => {
      expect(SAFETY_RATINGS).toContainEqual({ rating: "safe", label: "Safe" });
    });

    it("contains minor_concern", () => {
      expect(SAFETY_RATINGS).toContainEqual({ rating: "minor_concern", label: "Minor Concern" });
    });

    it("contains significant_concern", () => {
      expect(SAFETY_RATINGS).toContainEqual({ rating: "significant_concern", label: "Significant Concern" });
    });

    it("contains unsafe", () => {
      expect(SAFETY_RATINGS).toContainEqual({ rating: "unsafe", label: "Unsafe" });
    });

    it("contains not_assessed", () => {
      expect(SAFETY_RATINGS).toContainEqual({ rating: "not_assessed", label: "Not Assessed" });
    });

    it("has unique rating values", () => {
      const ratings = SAFETY_RATINGS.map((r) => r.rating);
      expect(new Set(ratings).size).toBe(ratings.length);
    });

    it("has unique labels", () => {
      const labels = SAFETY_RATINGS.map((r) => r.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of SAFETY_RATINGS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── computeBedroomAuditMetrics ─────────────────────────────────────────────

describe("computeBedroomAuditMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_audits", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.total_audits).toBe(0);
    });

    it("returns zero routine_inspection_count", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.routine_inspection_count).toBe(0);
    });

    it("returns zero safety_check_count", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.safety_check_count).toBe(0);
    });

    it("returns zero excellent_condition_rate", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.excellent_condition_rate).toBe(0);
    });

    it("returns zero poor_condition_count", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.poor_condition_count).toBe(0);
    });

    it("returns zero unacceptable_condition_count", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.unacceptable_condition_count).toBe(0);
    });

    it("returns zero highly_personalised_rate", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.highly_personalised_rate).toBe(0);
    });

    it("returns zero not_personalised_count", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.not_personalised_count).toBe(0);
    });

    it("returns zero safe_rating_rate", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.safe_rating_rate).toBe(0);
    });

    it("returns zero unsafe_count", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.unsafe_count).toBe(0);
    });

    it("returns zero significant_concern_count", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.significant_concern_count).toBe(0);
    });

    it("returns zero furniture_adequate_rate", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.furniture_adequate_rate).toBe(0);
    });

    it("returns zero furniture_good_condition_rate", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.furniture_good_condition_rate).toBe(0);
    });

    it("returns zero bedding_clean_rate", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.bedding_clean_rate).toBe(0);
    });

    it("returns zero window_restrictors_rate", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.window_restrictors_rate).toBe(0);
    });

    it("returns zero lock_working_rate", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.lock_working_rate).toBe(0);
    });

    it("returns zero lighting_adequate_rate", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.lighting_adequate_rate).toBe(0);
    });

    it("returns zero heating_adequate_rate", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.heating_adequate_rate).toBe(0);
    });

    it("returns zero ventilation_adequate_rate", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.ventilation_adequate_rate).toBe(0);
    });

    it("returns zero decoration_acceptable_rate", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.decoration_acceptable_rate).toBe(0);
    });

    it("returns zero child_consulted_rate", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.child_consulted_rate).toBe(0);
    });

    it("returns zero privacy_respected_rate", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.privacy_respected_rate).toBe(0);
    });

    it("returns zero audit_overdue_count", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.audit_overdue_count).toBe(0);
    });

    it("returns empty by_audit_type", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.by_audit_type).toEqual({});
    });

    it("returns empty by_room_condition", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.by_room_condition).toEqual({});
    });

    it("returns empty by_personalisation_level", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.by_personalisation_level).toEqual({});
    });

    it("returns empty by_safety_rating", () => {
      const m = computeBedroomAuditMetrics([]);
      expect(m.by_safety_rating).toEqual({});
    });
  });

  describe("single record", () => {
    const record = makeRecord({
      audit_type: "routine_inspection",
      room_condition: "excellent",
      personalisation_level: "highly_personalised",
      safety_rating: "safe",
      furniture_adequate: true,
      furniture_good_condition: true,
      bedding_clean: true,
      window_restrictors_fitted: true,
      lock_working: true,
      lighting_adequate: true,
      heating_adequate: true,
      ventilation_adequate: true,
      decoration_acceptable: true,
      child_consulted: true,
      privacy_respected: true,
    });

    it("returns total_audits = 1", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.total_audits).toBe(1);
    });

    it("returns routine_inspection_count = 1", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.routine_inspection_count).toBe(1);
    });

    it("returns safety_check_count = 0", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.safety_check_count).toBe(0);
    });

    it("returns excellent_condition_rate = 100", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.excellent_condition_rate).toBe(100);
    });

    it("returns poor_condition_count = 0", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.poor_condition_count).toBe(0);
    });

    it("returns unacceptable_condition_count = 0", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.unacceptable_condition_count).toBe(0);
    });

    it("returns highly_personalised_rate = 100", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.highly_personalised_rate).toBe(100);
    });

    it("returns not_personalised_count = 0", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.not_personalised_count).toBe(0);
    });

    it("returns safe_rating_rate = 100", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.safe_rating_rate).toBe(100);
    });

    it("returns unsafe_count = 0", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.unsafe_count).toBe(0);
    });

    it("returns significant_concern_count = 0", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.significant_concern_count).toBe(0);
    });

    it("returns furniture_adequate_rate = 100", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.furniture_adequate_rate).toBe(100);
    });

    it("returns furniture_good_condition_rate = 100", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.furniture_good_condition_rate).toBe(100);
    });

    it("returns bedding_clean_rate = 100", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.bedding_clean_rate).toBe(100);
    });

    it("returns window_restrictors_rate = 100", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.window_restrictors_rate).toBe(100);
    });

    it("returns lock_working_rate = 100", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.lock_working_rate).toBe(100);
    });

    it("returns lighting_adequate_rate = 100", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.lighting_adequate_rate).toBe(100);
    });

    it("returns heating_adequate_rate = 100", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.heating_adequate_rate).toBe(100);
    });

    it("returns ventilation_adequate_rate = 100", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.ventilation_adequate_rate).toBe(100);
    });

    it("returns decoration_acceptable_rate = 100", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.decoration_acceptable_rate).toBe(100);
    });

    it("returns child_consulted_rate = 100", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.child_consulted_rate).toBe(100);
    });

    it("returns privacy_respected_rate = 100", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.privacy_respected_rate).toBe(100);
    });

    it("returns by_audit_type with single entry", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.by_audit_type).toEqual({ routine_inspection: 1 });
    });

    it("returns by_room_condition with single entry", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.by_room_condition).toEqual({ excellent: 1 });
    });

    it("returns by_personalisation_level with single entry", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.by_personalisation_level).toEqual({ highly_personalised: 1 });
    });

    it("returns by_safety_rating with single entry", () => {
      const m = computeBedroomAuditMetrics([record]);
      expect(m.by_safety_rating).toEqual({ safe: 1 });
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRecord({ audit_type: "routine_inspection", room_condition: "excellent", personalisation_level: "highly_personalised", safety_rating: "safe", furniture_adequate: true, furniture_good_condition: true, bedding_clean: true, window_restrictors_fitted: true, lock_working: true, lighting_adequate: true, heating_adequate: true, ventilation_adequate: true, decoration_acceptable: true, child_consulted: true, privacy_respected: true }),
      makeRecord({ audit_type: "safety_check", room_condition: "good", personalisation_level: "some_personalisation", safety_rating: "minor_concern", furniture_adequate: false, furniture_good_condition: false, bedding_clean: false, window_restrictors_fitted: false, lock_working: false, lighting_adequate: false, heating_adequate: false, ventilation_adequate: false, decoration_acceptable: false, child_consulted: false, privacy_respected: false }),
      makeRecord({ audit_type: "routine_inspection", room_condition: "poor", personalisation_level: "not_personalised", safety_rating: "unsafe", furniture_adequate: true, furniture_good_condition: true, bedding_clean: true, window_restrictors_fitted: true, lock_working: true, lighting_adequate: true, heating_adequate: true, ventilation_adequate: true, decoration_acceptable: true, child_consulted: true, privacy_respected: true }),
      makeRecord({ audit_type: "move_in_check", room_condition: "satisfactory", personalisation_level: "minimal_personalisation", safety_rating: "significant_concern", furniture_adequate: false, furniture_good_condition: false, bedding_clean: false, window_restrictors_fitted: false, lock_working: false, lighting_adequate: false, heating_adequate: false, ventilation_adequate: false, decoration_acceptable: false, child_consulted: false, privacy_respected: false }),
      makeRecord({ audit_type: "safety_check", room_condition: "unacceptable", personalisation_level: "not_assessed", safety_rating: "safe", furniture_adequate: true, furniture_good_condition: false, bedding_clean: true, window_restrictors_fitted: true, lock_working: false, lighting_adequate: true, heating_adequate: false, ventilation_adequate: true, decoration_acceptable: false, child_consulted: true, privacy_respected: false }),
    ];

    it("returns total_audits = 5", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.total_audits).toBe(5);
    });

    it("returns routine_inspection_count = 2", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.routine_inspection_count).toBe(2);
    });

    it("returns safety_check_count = 2", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.safety_check_count).toBe(2);
    });

    it("calculates excellent_condition_rate correctly (1/5 = 20%)", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.excellent_condition_rate).toBe(20);
    });

    it("returns poor_condition_count = 1", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.poor_condition_count).toBe(1);
    });

    it("returns unacceptable_condition_count = 1", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.unacceptable_condition_count).toBe(1);
    });

    it("calculates highly_personalised_rate correctly (1/5 = 20%)", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.highly_personalised_rate).toBe(20);
    });

    it("returns not_personalised_count = 1", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.not_personalised_count).toBe(1);
    });

    it("calculates safe_rating_rate correctly (2/5 = 40%)", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.safe_rating_rate).toBe(40);
    });

    it("returns unsafe_count = 1", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.unsafe_count).toBe(1);
    });

    it("returns significant_concern_count = 1", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.significant_concern_count).toBe(1);
    });

    it("calculates furniture_adequate_rate correctly (3/5 = 60%)", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.furniture_adequate_rate).toBe(60);
    });

    it("calculates furniture_good_condition_rate correctly (2/5 = 40%)", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.furniture_good_condition_rate).toBe(40);
    });

    it("calculates bedding_clean_rate correctly (3/5 = 60%)", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.bedding_clean_rate).toBe(60);
    });

    it("calculates window_restrictors_rate correctly (3/5 = 60%)", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.window_restrictors_rate).toBe(60);
    });

    it("calculates lock_working_rate correctly (2/5 = 40%)", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.lock_working_rate).toBe(40);
    });

    it("calculates lighting_adequate_rate correctly (3/5 = 60%)", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.lighting_adequate_rate).toBe(60);
    });

    it("calculates heating_adequate_rate correctly (2/5 = 40%)", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.heating_adequate_rate).toBe(40);
    });

    it("calculates ventilation_adequate_rate correctly (3/5 = 60%)", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.ventilation_adequate_rate).toBe(60);
    });

    it("calculates decoration_acceptable_rate correctly (2/5 = 40%)", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.decoration_acceptable_rate).toBe(40);
    });

    it("calculates child_consulted_rate correctly (3/5 = 60%)", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.child_consulted_rate).toBe(60);
    });

    it("calculates privacy_respected_rate correctly (2/5 = 40%)", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.privacy_respected_rate).toBe(40);
    });

    it("groups by_audit_type correctly", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.by_audit_type).toEqual({ routine_inspection: 2, safety_check: 2, move_in_check: 1 });
    });

    it("groups by_room_condition correctly", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.by_room_condition).toEqual({ excellent: 1, good: 1, poor: 1, satisfactory: 1, unacceptable: 1 });
    });

    it("groups by_personalisation_level correctly", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.by_personalisation_level).toEqual({ highly_personalised: 1, some_personalisation: 1, not_personalised: 1, minimal_personalisation: 1, not_assessed: 1 });
    });

    it("groups by_safety_rating correctly", () => {
      const m = computeBedroomAuditMetrics(records);
      expect(m.by_safety_rating).toEqual({ safe: 2, minor_concern: 1, unsafe: 1, significant_concern: 1 });
    });
  });

  describe("audit type counts", () => {
    it("counts routine_inspection records", () => {
      const records = [
        makeRecord({ audit_type: "routine_inspection" }),
        makeRecord({ audit_type: "routine_inspection" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.routine_inspection_count).toBe(2);
    });

    it("counts safety_check records", () => {
      const records = [
        makeRecord({ audit_type: "safety_check" }),
        makeRecord({ audit_type: "safety_check" }),
        makeRecord({ audit_type: "safety_check" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.safety_check_count).toBe(3);
    });

    it("does not count move_in_check as routine_inspection", () => {
      const records = [makeRecord({ audit_type: "move_in_check" })];
      const m = computeBedroomAuditMetrics(records);
      expect(m.routine_inspection_count).toBe(0);
    });

    it("does not count furniture_check as safety_check", () => {
      const records = [makeRecord({ audit_type: "furniture_check" })];
      const m = computeBedroomAuditMetrics(records);
      expect(m.safety_check_count).toBe(0);
    });

    it("does not count other as any specific type", () => {
      const records = [makeRecord({ audit_type: "other" })];
      const m = computeBedroomAuditMetrics(records);
      expect(m.routine_inspection_count).toBe(0);
      expect(m.safety_check_count).toBe(0);
    });

    it("does not count personalisation_review as routine_inspection", () => {
      const records = [makeRecord({ audit_type: "personalisation_review" })];
      const m = computeBedroomAuditMetrics(records);
      expect(m.routine_inspection_count).toBe(0);
    });
  });

  describe("room condition metrics", () => {
    it("returns excellent_condition_rate = 100 when all excellent", () => {
      const records = [
        makeRecord({ room_condition: "excellent" }),
        makeRecord({ room_condition: "excellent" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.excellent_condition_rate).toBe(100);
    });

    it("returns excellent_condition_rate = 0 when none excellent", () => {
      const records = [
        makeRecord({ room_condition: "good" }),
        makeRecord({ room_condition: "poor" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.excellent_condition_rate).toBe(0);
    });

    it("calculates excellent_condition_rate with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ room_condition: "excellent" }),
        makeRecord({ room_condition: "good" }),
        makeRecord({ room_condition: "poor" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.excellent_condition_rate).toBe(33.3);
    });

    it("calculates excellent_condition_rate with rounding (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ room_condition: "excellent" }),
        makeRecord({ room_condition: "excellent" }),
        makeRecord({ room_condition: "poor" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.excellent_condition_rate).toBe(66.7);
    });

    it("counts multiple poor conditions", () => {
      const records = [
        makeRecord({ room_condition: "poor" }),
        makeRecord({ room_condition: "poor" }),
        makeRecord({ room_condition: "good" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.poor_condition_count).toBe(2);
    });

    it("counts multiple unacceptable conditions", () => {
      const records = [
        makeRecord({ room_condition: "unacceptable" }),
        makeRecord({ room_condition: "unacceptable" }),
        makeRecord({ room_condition: "unacceptable" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.unacceptable_condition_count).toBe(3);
    });

    it("does not count satisfactory as poor", () => {
      const records = [makeRecord({ room_condition: "satisfactory" })];
      const m = computeBedroomAuditMetrics(records);
      expect(m.poor_condition_count).toBe(0);
    });

    it("does not count poor as unacceptable", () => {
      const records = [makeRecord({ room_condition: "poor" })];
      const m = computeBedroomAuditMetrics(records);
      expect(m.unacceptable_condition_count).toBe(0);
    });
  });

  describe("personalisation metrics", () => {
    it("returns highly_personalised_rate = 100 when all highly personalised", () => {
      const records = [
        makeRecord({ personalisation_level: "highly_personalised" }),
        makeRecord({ personalisation_level: "highly_personalised" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.highly_personalised_rate).toBe(100);
    });

    it("returns highly_personalised_rate = 0 when none highly personalised", () => {
      const records = [
        makeRecord({ personalisation_level: "some_personalisation" }),
        makeRecord({ personalisation_level: "not_personalised" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.highly_personalised_rate).toBe(0);
    });

    it("calculates highly_personalised_rate with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ personalisation_level: "highly_personalised" }),
        makeRecord({ personalisation_level: "some_personalisation" }),
        makeRecord({ personalisation_level: "not_personalised" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.highly_personalised_rate).toBe(33.3);
    });

    it("counts multiple not_personalised", () => {
      const records = [
        makeRecord({ personalisation_level: "not_personalised" }),
        makeRecord({ personalisation_level: "not_personalised" }),
        makeRecord({ personalisation_level: "some_personalisation" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.not_personalised_count).toBe(2);
    });

    it("does not count not_assessed as not_personalised", () => {
      const records = [makeRecord({ personalisation_level: "not_assessed" })];
      const m = computeBedroomAuditMetrics(records);
      expect(m.not_personalised_count).toBe(0);
    });

    it("does not count minimal_personalisation as not_personalised", () => {
      const records = [makeRecord({ personalisation_level: "minimal_personalisation" })];
      const m = computeBedroomAuditMetrics(records);
      expect(m.not_personalised_count).toBe(0);
    });
  });

  describe("safety rating metrics", () => {
    it("returns safe_rating_rate = 100 when all safe", () => {
      const records = [
        makeRecord({ safety_rating: "safe" }),
        makeRecord({ safety_rating: "safe" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.safe_rating_rate).toBe(100);
    });

    it("returns safe_rating_rate = 0 when none safe", () => {
      const records = [
        makeRecord({ safety_rating: "minor_concern" }),
        makeRecord({ safety_rating: "unsafe" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.safe_rating_rate).toBe(0);
    });

    it("calculates safe_rating_rate with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ safety_rating: "safe" }),
        makeRecord({ safety_rating: "minor_concern" }),
        makeRecord({ safety_rating: "unsafe" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.safe_rating_rate).toBe(33.3);
    });

    it("counts multiple unsafe records", () => {
      const records = [
        makeRecord({ safety_rating: "unsafe" }),
        makeRecord({ safety_rating: "unsafe" }),
        makeRecord({ safety_rating: "safe" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.unsafe_count).toBe(2);
    });

    it("counts multiple significant_concern records", () => {
      const records = [
        makeRecord({ safety_rating: "significant_concern" }),
        makeRecord({ safety_rating: "significant_concern" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.significant_concern_count).toBe(2);
    });

    it("does not count minor_concern as unsafe", () => {
      const records = [makeRecord({ safety_rating: "minor_concern" })];
      const m = computeBedroomAuditMetrics(records);
      expect(m.unsafe_count).toBe(0);
    });

    it("does not count not_assessed as significant_concern", () => {
      const records = [makeRecord({ safety_rating: "not_assessed" })];
      const m = computeBedroomAuditMetrics(records);
      expect(m.significant_concern_count).toBe(0);
    });
  });

  describe("boolean rate metrics", () => {
    it("returns 0 for furniture_adequate_rate when all false", () => {
      const records = [
        makeRecord({ furniture_adequate: false }),
        makeRecord({ furniture_adequate: false }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.furniture_adequate_rate).toBe(0);
    });

    it("returns 50 for furniture_good_condition_rate when half true", () => {
      const records = [
        makeRecord({ furniture_good_condition: true }),
        makeRecord({ furniture_good_condition: false }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.furniture_good_condition_rate).toBe(50);
    });

    it("returns 0 for bedding_clean_rate when all false", () => {
      const records = [
        makeRecord({ bedding_clean: false }),
        makeRecord({ bedding_clean: false }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.bedding_clean_rate).toBe(0);
    });

    it("returns 50 for window_restrictors_rate when half true", () => {
      const records = [
        makeRecord({ window_restrictors_fitted: true }),
        makeRecord({ window_restrictors_fitted: false }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.window_restrictors_rate).toBe(50);
    });

    it("returns 0 for lock_working_rate when all false", () => {
      const records = [
        makeRecord({ lock_working: false }),
        makeRecord({ lock_working: false }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.lock_working_rate).toBe(0);
    });

    it("returns 100 for lighting_adequate_rate when all true", () => {
      const records = [
        makeRecord({ lighting_adequate: true }),
        makeRecord({ lighting_adequate: true }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.lighting_adequate_rate).toBe(100);
    });

    it("returns 0 for heating_adequate_rate when all false", () => {
      const records = [
        makeRecord({ heating_adequate: false }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.heating_adequate_rate).toBe(0);
    });

    it("returns 100 for ventilation_adequate_rate when all true", () => {
      const records = [
        makeRecord({ ventilation_adequate: true }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.ventilation_adequate_rate).toBe(100);
    });

    it("returns 0 for decoration_acceptable_rate when all false", () => {
      const records = [
        makeRecord({ decoration_acceptable: false }),
        makeRecord({ decoration_acceptable: false }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.decoration_acceptable_rate).toBe(0);
    });

    it("returns 0 for child_consulted_rate when all false", () => {
      const records = [
        makeRecord({ child_consulted: false }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.child_consulted_rate).toBe(0);
    });

    it("returns 0 for privacy_respected_rate when all false", () => {
      const records = [
        makeRecord({ privacy_respected: false }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.privacy_respected_rate).toBe(0);
    });

    it("calculates boolean rate with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ furniture_adequate: true }),
        makeRecord({ furniture_adequate: false }),
        makeRecord({ furniture_adequate: false }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.furniture_adequate_rate).toBe(33.3);
    });

    it("calculates boolean rate with rounding (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ bedding_clean: true }),
        makeRecord({ bedding_clean: true }),
        makeRecord({ bedding_clean: false }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.bedding_clean_rate).toBe(66.7);
    });
  });

  describe("audit_overdue_count", () => {
    it("returns 0 when no records have next_audit_date", () => {
      const records = [
        makeRecord({ next_audit_date: null }),
        makeRecord({ next_audit_date: null }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.audit_overdue_count).toBe(0);
    });

    it("counts records with past next_audit_date as overdue", () => {
      const records = [
        makeRecord({ next_audit_date: daysAgo(5) }),
        makeRecord({ next_audit_date: daysAgo(10) }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.audit_overdue_count).toBe(2);
    });

    it("does not count future next_audit_date as overdue", () => {
      const records = [
        makeRecord({ next_audit_date: daysFromNow(5) }),
        makeRecord({ next_audit_date: daysFromNow(10) }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.audit_overdue_count).toBe(0);
    });

    it("counts mix of overdue and future correctly", () => {
      const records = [
        makeRecord({ next_audit_date: daysAgo(5) }),
        makeRecord({ next_audit_date: daysFromNow(5) }),
        makeRecord({ next_audit_date: null }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.audit_overdue_count).toBe(1);
    });

    it("excludes null next_audit_date from overdue count", () => {
      const records = [
        makeRecord({ next_audit_date: null }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.audit_overdue_count).toBe(0);
    });
  });

  describe("breakdown maps", () => {
    it("groups by_audit_type with multiple types", () => {
      const records = [
        makeRecord({ audit_type: "routine_inspection" }),
        makeRecord({ audit_type: "routine_inspection" }),
        makeRecord({ audit_type: "safety_check" }),
        makeRecord({ audit_type: "move_in_check" }),
        makeRecord({ audit_type: "move_in_check" }),
        makeRecord({ audit_type: "move_in_check" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.by_audit_type).toEqual({ routine_inspection: 2, safety_check: 1, move_in_check: 3 });
    });

    it("groups by_room_condition with multiple conditions", () => {
      const records = [
        makeRecord({ room_condition: "excellent" }),
        makeRecord({ room_condition: "excellent" }),
        makeRecord({ room_condition: "good" }),
        makeRecord({ room_condition: "poor" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.by_room_condition).toEqual({ excellent: 2, good: 1, poor: 1 });
    });

    it("groups by_personalisation_level with multiple levels", () => {
      const records = [
        makeRecord({ personalisation_level: "highly_personalised" }),
        makeRecord({ personalisation_level: "highly_personalised" }),
        makeRecord({ personalisation_level: "not_personalised" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.by_personalisation_level).toEqual({ highly_personalised: 2, not_personalised: 1 });
    });

    it("groups by_safety_rating with multiple ratings", () => {
      const records = [
        makeRecord({ safety_rating: "safe" }),
        makeRecord({ safety_rating: "safe" }),
        makeRecord({ safety_rating: "safe" }),
        makeRecord({ safety_rating: "unsafe" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.by_safety_rating).toEqual({ safe: 3, unsafe: 1 });
    });

    it("returns single-entry maps for uniform records", () => {
      const records = [
        makeRecord({ audit_type: "other", room_condition: "satisfactory", personalisation_level: "not_assessed", safety_rating: "not_assessed" }),
        makeRecord({ audit_type: "other", room_condition: "satisfactory", personalisation_level: "not_assessed", safety_rating: "not_assessed" }),
      ];
      const m = computeBedroomAuditMetrics(records);
      expect(m.by_audit_type).toEqual({ other: 2 });
      expect(m.by_room_condition).toEqual({ satisfactory: 2 });
      expect(m.by_personalisation_level).toEqual({ not_assessed: 2 });
      expect(m.by_safety_rating).toEqual({ not_assessed: 2 });
    });
  });
});

// ── identifyBedroomAuditAlerts ─────────────────────────────────────────────

describe("identifyBedroomAuditAlerts", () => {
  describe("empty array", () => {
    it("returns no alerts", () => {
      const alerts = identifyBedroomAuditAlerts([]);
      expect(alerts).toEqual([]);
    });

    it("returns an array", () => {
      const alerts = identifyBedroomAuditAlerts([]);
      expect(Array.isArray(alerts)).toBe(true);
    });
  });

  describe("no alerts scenario", () => {
    it("returns no alerts when all records are safe and well-maintained", () => {
      const records = [
        makeRecord({ safety_rating: "safe", room_condition: "excellent", personalisation_level: "highly_personalised", child_consulted: true, next_audit_date: daysFromNow(30) }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      expect(alerts).toEqual([]);
    });
  });

  describe("unsafe_bedroom alert", () => {
    it("fires for a single unsafe bedroom", () => {
      const records = [
        makeRecord({ id: "r1", safety_rating: "unsafe", room_name: "Room A", audit_date: "2026-05-01" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const unsafe = alerts.filter((a) => a.type === "unsafe_bedroom");
      expect(unsafe).toHaveLength(1);
    });

    it("has critical severity", () => {
      const records = [
        makeRecord({ id: "r1", safety_rating: "unsafe", room_name: "Room A", audit_date: "2026-05-01" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const unsafe = alerts.find((a) => a.type === "unsafe_bedroom");
      expect(unsafe!.severity).toBe("critical");
    });

    it("includes room_name in message", () => {
      const records = [
        makeRecord({ id: "r1", safety_rating: "unsafe", room_name: "Room B", audit_date: "2026-05-01" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const unsafe = alerts.find((a) => a.type === "unsafe_bedroom");
      expect(unsafe!.message).toContain("Room B");
    });

    it("includes audit_date in message", () => {
      const records = [
        makeRecord({ id: "r1", safety_rating: "unsafe", room_name: "Room A", audit_date: "2026-03-15" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const unsafe = alerts.find((a) => a.type === "unsafe_bedroom");
      expect(unsafe!.message).toContain("2026-03-15");
    });

    it("uses the record id as alert id", () => {
      const records = [
        makeRecord({ id: "unique-id-1", safety_rating: "unsafe", room_name: "Room A", audit_date: "2026-05-01" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const unsafe = alerts.find((a) => a.type === "unsafe_bedroom");
      expect(unsafe!.id).toBe("unique-id-1");
    });

    it("fires per-record for multiple unsafe bedrooms", () => {
      const records = [
        makeRecord({ id: "r1", safety_rating: "unsafe", room_name: "Room A", audit_date: "2026-05-01" }),
        makeRecord({ id: "r2", safety_rating: "unsafe", room_name: "Room B", audit_date: "2026-05-02" }),
        makeRecord({ id: "r3", safety_rating: "unsafe", room_name: "Room C", audit_date: "2026-05-03" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const unsafe = alerts.filter((a) => a.type === "unsafe_bedroom");
      expect(unsafe).toHaveLength(3);
    });

    it("does not fire for safe rating", () => {
      const records = [makeRecord({ safety_rating: "safe" })];
      const alerts = identifyBedroomAuditAlerts(records);
      const unsafe = alerts.filter((a) => a.type === "unsafe_bedroom");
      expect(unsafe).toHaveLength(0);
    });

    it("does not fire for minor_concern rating", () => {
      const records = [makeRecord({ safety_rating: "minor_concern" })];
      const alerts = identifyBedroomAuditAlerts(records);
      const unsafe = alerts.filter((a) => a.type === "unsafe_bedroom");
      expect(unsafe).toHaveLength(0);
    });

    it("does not fire for significant_concern rating", () => {
      const records = [makeRecord({ safety_rating: "significant_concern" })];
      const alerts = identifyBedroomAuditAlerts(records);
      const unsafe = alerts.filter((a) => a.type === "unsafe_bedroom");
      expect(unsafe).toHaveLength(0);
    });

    it("does not fire for not_assessed rating", () => {
      const records = [makeRecord({ safety_rating: "not_assessed" })];
      const alerts = identifyBedroomAuditAlerts(records);
      const unsafe = alerts.filter((a) => a.type === "unsafe_bedroom");
      expect(unsafe).toHaveLength(0);
    });
  });

  describe("unacceptable_condition alert", () => {
    it("fires for a single unacceptable condition", () => {
      const records = [
        makeRecord({ id: "r1", room_condition: "unacceptable", room_name: "Room X", audit_date: "2026-05-01" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const unacc = alerts.filter((a) => a.type === "unacceptable_condition");
      expect(unacc).toHaveLength(1);
    });

    it("has high severity", () => {
      const records = [
        makeRecord({ id: "r1", room_condition: "unacceptable", room_name: "Room X", audit_date: "2026-05-01" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const unacc = alerts.find((a) => a.type === "unacceptable_condition");
      expect(unacc!.severity).toBe("high");
    });

    it("includes room_name in message", () => {
      const records = [
        makeRecord({ id: "r1", room_condition: "unacceptable", room_name: "Room Z", audit_date: "2026-05-01" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const unacc = alerts.find((a) => a.type === "unacceptable_condition");
      expect(unacc!.message).toContain("Room Z");
    });

    it("includes audit_date in message", () => {
      const records = [
        makeRecord({ id: "r1", room_condition: "unacceptable", room_name: "Room X", audit_date: "2026-04-20" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const unacc = alerts.find((a) => a.type === "unacceptable_condition");
      expect(unacc!.message).toContain("2026-04-20");
    });

    it("uses the record id as alert id", () => {
      const records = [
        makeRecord({ id: "unacc-id-1", room_condition: "unacceptable", room_name: "Room X", audit_date: "2026-05-01" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const unacc = alerts.find((a) => a.type === "unacceptable_condition");
      expect(unacc!.id).toBe("unacc-id-1");
    });

    it("fires per-record for multiple unacceptable rooms", () => {
      const records = [
        makeRecord({ id: "r1", room_condition: "unacceptable", room_name: "Room A", audit_date: "2026-05-01" }),
        makeRecord({ id: "r2", room_condition: "unacceptable", room_name: "Room B", audit_date: "2026-05-02" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const unacc = alerts.filter((a) => a.type === "unacceptable_condition");
      expect(unacc).toHaveLength(2);
    });

    it("does not fire for poor condition", () => {
      const records = [makeRecord({ room_condition: "poor" })];
      const alerts = identifyBedroomAuditAlerts(records);
      const unacc = alerts.filter((a) => a.type === "unacceptable_condition");
      expect(unacc).toHaveLength(0);
    });

    it("does not fire for good condition", () => {
      const records = [makeRecord({ room_condition: "good" })];
      const alerts = identifyBedroomAuditAlerts(records);
      const unacc = alerts.filter((a) => a.type === "unacceptable_condition");
      expect(unacc).toHaveLength(0);
    });

    it("does not fire for excellent condition", () => {
      const records = [makeRecord({ room_condition: "excellent" })];
      const alerts = identifyBedroomAuditAlerts(records);
      const unacc = alerts.filter((a) => a.type === "unacceptable_condition");
      expect(unacc).toHaveLength(0);
    });
  });

  describe("not_personalised alert", () => {
    it("fires when 1 bedroom is not personalised (threshold >= 1)", () => {
      const records = [
        makeRecord({ personalisation_level: "not_personalised" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const np = alerts.filter((a) => a.type === "not_personalised");
      expect(np).toHaveLength(1);
    });

    it("has high severity", () => {
      const records = [
        makeRecord({ personalisation_level: "not_personalised" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const np = alerts.find((a) => a.type === "not_personalised");
      expect(np!.severity).toBe("high");
    });

    it("uses singular message for 1 bedroom", () => {
      const records = [
        makeRecord({ personalisation_level: "not_personalised" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const np = alerts.find((a) => a.type === "not_personalised");
      expect(np!.message).toContain("bedroom is");
    });

    it("uses plural message for 2 bedrooms", () => {
      const records = [
        makeRecord({ personalisation_level: "not_personalised" }),
        makeRecord({ personalisation_level: "not_personalised" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const np = alerts.find((a) => a.type === "not_personalised");
      expect(np!.message).toContain("bedrooms are");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ personalisation_level: "not_personalised" }),
        makeRecord({ personalisation_level: "not_personalised" }),
        makeRecord({ personalisation_level: "not_personalised" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const np = alerts.find((a) => a.type === "not_personalised");
      expect(np!.message).toContain("3");
    });

    it("has id = 'not_personalised'", () => {
      const records = [
        makeRecord({ personalisation_level: "not_personalised" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const np = alerts.find((a) => a.type === "not_personalised");
      expect(np!.id).toBe("not_personalised");
    });

    it("does not fire when no bedrooms are not personalised", () => {
      const records = [
        makeRecord({ personalisation_level: "highly_personalised" }),
        makeRecord({ personalisation_level: "some_personalisation" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const np = alerts.filter((a) => a.type === "not_personalised");
      expect(np).toHaveLength(0);
    });

    it("does not fire for minimal_personalisation", () => {
      const records = [
        makeRecord({ personalisation_level: "minimal_personalisation" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const np = alerts.filter((a) => a.type === "not_personalised");
      expect(np).toHaveLength(0);
    });

    it("does not fire for not_assessed", () => {
      const records = [
        makeRecord({ personalisation_level: "not_assessed" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const np = alerts.filter((a) => a.type === "not_personalised");
      expect(np).toHaveLength(0);
    });

    it("produces exactly one alert regardless of count", () => {
      const records = [
        makeRecord({ personalisation_level: "not_personalised" }),
        makeRecord({ personalisation_level: "not_personalised" }),
        makeRecord({ personalisation_level: "not_personalised" }),
        makeRecord({ personalisation_level: "not_personalised" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const np = alerts.filter((a) => a.type === "not_personalised");
      expect(np).toHaveLength(1);
    });
  });

  describe("child_not_consulted alert", () => {
    it("fires when 2 audits lack child consultation with child assigned", () => {
      const records = [
        makeRecord({ child_consulted: false, child_name: "Alice" }),
        makeRecord({ child_consulted: false, child_name: "Bob" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const cnc = alerts.filter((a) => a.type === "child_not_consulted");
      expect(cnc).toHaveLength(1);
    });

    it("has medium severity", () => {
      const records = [
        makeRecord({ child_consulted: false, child_name: "Alice" }),
        makeRecord({ child_consulted: false, child_name: "Bob" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const cnc = alerts.find((a) => a.type === "child_not_consulted");
      expect(cnc!.severity).toBe("medium");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ child_consulted: false, child_name: "Alice" }),
        makeRecord({ child_consulted: false, child_name: "Bob" }),
        makeRecord({ child_consulted: false, child_name: "Charlie" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const cnc = alerts.find((a) => a.type === "child_not_consulted");
      expect(cnc!.message).toContain("3");
    });

    it("has id = 'child_not_consulted'", () => {
      const records = [
        makeRecord({ child_consulted: false, child_name: "Alice" }),
        makeRecord({ child_consulted: false, child_name: "Bob" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const cnc = alerts.find((a) => a.type === "child_not_consulted");
      expect(cnc!.id).toBe("child_not_consulted");
    });

    it("does not fire when only 1 audit lacks consultation", () => {
      const records = [
        makeRecord({ child_consulted: false, child_name: "Alice" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const cnc = alerts.filter((a) => a.type === "child_not_consulted");
      expect(cnc).toHaveLength(0);
    });

    it("does not fire when child_consulted is true", () => {
      const records = [
        makeRecord({ child_consulted: true, child_name: "Alice" }),
        makeRecord({ child_consulted: true, child_name: "Bob" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const cnc = alerts.filter((a) => a.type === "child_not_consulted");
      expect(cnc).toHaveLength(0);
    });

    it("does not count records where child_name is null", () => {
      const records = [
        makeRecord({ child_consulted: false, child_name: null }),
        makeRecord({ child_consulted: false, child_name: null }),
        makeRecord({ child_consulted: false, child_name: null }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const cnc = alerts.filter((a) => a.type === "child_not_consulted");
      expect(cnc).toHaveLength(0);
    });

    it("only counts records where child_name is not null and child_consulted is false", () => {
      const records = [
        makeRecord({ child_consulted: false, child_name: "Alice" }),
        makeRecord({ child_consulted: false, child_name: null }),
        makeRecord({ child_consulted: true, child_name: "Bob" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const cnc = alerts.filter((a) => a.type === "child_not_consulted");
      expect(cnc).toHaveLength(0);
    });

    it("fires when exactly 2 qualify", () => {
      const records = [
        makeRecord({ child_consulted: false, child_name: "Alice" }),
        makeRecord({ child_consulted: false, child_name: "Bob" }),
        makeRecord({ child_consulted: true, child_name: "Charlie" }),
        makeRecord({ child_consulted: false, child_name: null }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const cnc = alerts.filter((a) => a.type === "child_not_consulted");
      expect(cnc).toHaveLength(1);
    });

    it("produces exactly one alert regardless of qualifying count", () => {
      const records = [
        makeRecord({ child_consulted: false, child_name: "A" }),
        makeRecord({ child_consulted: false, child_name: "B" }),
        makeRecord({ child_consulted: false, child_name: "C" }),
        makeRecord({ child_consulted: false, child_name: "D" }),
        makeRecord({ child_consulted: false, child_name: "E" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const cnc = alerts.filter((a) => a.type === "child_not_consulted");
      expect(cnc).toHaveLength(1);
    });
  });

  describe("audit_overdue alert", () => {
    it("fires when 1 audit is overdue (threshold >= 1)", () => {
      const records = [
        makeRecord({ next_audit_date: daysAgo(5) }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const overdue = alerts.filter((a) => a.type === "audit_overdue");
      expect(overdue).toHaveLength(1);
    });

    it("has medium severity", () => {
      const records = [
        makeRecord({ next_audit_date: daysAgo(5) }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const overdue = alerts.find((a) => a.type === "audit_overdue");
      expect(overdue!.severity).toBe("medium");
    });

    it("uses singular message for 1 overdue audit", () => {
      const records = [
        makeRecord({ next_audit_date: daysAgo(5) }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const overdue = alerts.find((a) => a.type === "audit_overdue");
      expect(overdue!.message).toContain("audit is");
    });

    it("uses plural message for 2 overdue audits", () => {
      const records = [
        makeRecord({ next_audit_date: daysAgo(5) }),
        makeRecord({ next_audit_date: daysAgo(10) }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const overdue = alerts.find((a) => a.type === "audit_overdue");
      expect(overdue!.message).toContain("audits are");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ next_audit_date: daysAgo(1) }),
        makeRecord({ next_audit_date: daysAgo(2) }),
        makeRecord({ next_audit_date: daysAgo(3) }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const overdue = alerts.find((a) => a.type === "audit_overdue");
      expect(overdue!.message).toContain("3");
    });

    it("has id = 'audit_overdue'", () => {
      const records = [
        makeRecord({ next_audit_date: daysAgo(5) }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const overdue = alerts.find((a) => a.type === "audit_overdue");
      expect(overdue!.id).toBe("audit_overdue");
    });

    it("does not fire when no audits are overdue", () => {
      const records = [
        makeRecord({ next_audit_date: daysFromNow(5) }),
        makeRecord({ next_audit_date: daysFromNow(10) }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const overdue = alerts.filter((a) => a.type === "audit_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("does not fire when all next_audit_date are null", () => {
      const records = [
        makeRecord({ next_audit_date: null }),
        makeRecord({ next_audit_date: null }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const overdue = alerts.filter((a) => a.type === "audit_overdue");
      expect(overdue).toHaveLength(0);
    });

    it("only counts past dates, not future or null", () => {
      const records = [
        makeRecord({ next_audit_date: daysAgo(5) }),
        makeRecord({ next_audit_date: daysFromNow(5) }),
        makeRecord({ next_audit_date: null }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const overdue = alerts.find((a) => a.type === "audit_overdue");
      expect(overdue!.message).toContain("1");
    });

    it("produces exactly one alert regardless of overdue count", () => {
      const records = [
        makeRecord({ next_audit_date: daysAgo(1) }),
        makeRecord({ next_audit_date: daysAgo(2) }),
        makeRecord({ next_audit_date: daysAgo(3) }),
        makeRecord({ next_audit_date: daysAgo(4) }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const overdue = alerts.filter((a) => a.type === "audit_overdue");
      expect(overdue).toHaveLength(1);
    });
  });

  describe("combined alerts", () => {
    it("fires multiple alert types simultaneously", () => {
      const records = [
        makeRecord({ id: "r1", safety_rating: "unsafe", room_name: "Room A", audit_date: "2026-05-01", room_condition: "unacceptable", personalisation_level: "not_personalised", child_consulted: false, child_name: "Alice", next_audit_date: daysAgo(5) }),
        makeRecord({ id: "r2", safety_rating: "unsafe", room_name: "Room B", audit_date: "2026-05-02", room_condition: "unacceptable", personalisation_level: "not_personalised", child_consulted: false, child_name: "Bob", next_audit_date: daysAgo(10) }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const types = new Set(alerts.map((a) => a.type));
      expect(types.has("unsafe_bedroom")).toBe(true);
      expect(types.has("unacceptable_condition")).toBe(true);
      expect(types.has("not_personalised")).toBe(true);
      expect(types.has("child_not_consulted")).toBe(true);
      expect(types.has("audit_overdue")).toBe(true);
    });

    it("unsafe_bedroom alerts appear before unacceptable_condition alerts", () => {
      const records = [
        makeRecord({ id: "r1", safety_rating: "unsafe", room_name: "Room A", audit_date: "2026-05-01", room_condition: "unacceptable" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const unsafeIdx = alerts.findIndex((a) => a.type === "unsafe_bedroom");
      const unaccIdx = alerts.findIndex((a) => a.type === "unacceptable_condition");
      expect(unsafeIdx).toBeLessThan(unaccIdx);
    });

    it("critical alerts appear before high alerts", () => {
      const records = [
        makeRecord({ id: "r1", safety_rating: "unsafe", room_name: "Room A", audit_date: "2026-05-01", room_condition: "unacceptable", personalisation_level: "not_personalised" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const criticalIdx = alerts.findIndex((a) => a.severity === "critical");
      const highIdxes = alerts.map((a, i) => a.severity === "high" ? i : -1).filter((i) => i >= 0);
      for (const hi of highIdxes) {
        expect(criticalIdx).toBeLessThan(hi);
      }
    });

    it("high alerts appear before medium alerts", () => {
      const records = [
        makeRecord({ id: "r1", room_condition: "unacceptable", room_name: "Room A", audit_date: "2026-05-01", personalisation_level: "not_personalised", child_consulted: false, child_name: "Alice", next_audit_date: daysAgo(5) }),
        makeRecord({ id: "r2", child_consulted: false, child_name: "Bob" }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      const highIdxes = alerts.map((a, i) => a.severity === "high" ? i : -1).filter((i) => i >= 0);
      const mediumIdxes = alerts.map((a, i) => a.severity === "medium" ? i : -1).filter((i) => i >= 0);
      if (highIdxes.length > 0 && mediumIdxes.length > 0) {
        const lastHigh = Math.max(...highIdxes);
        const firstMedium = Math.min(...mediumIdxes);
        expect(lastHigh).toBeLessThan(firstMedium);
      }
    });

    it("safe records with good conditions produce no alerts", () => {
      const records = [
        makeRecord({ safety_rating: "safe", room_condition: "good", personalisation_level: "some_personalisation", child_consulted: true, next_audit_date: daysFromNow(30) }),
        makeRecord({ safety_rating: "safe", room_condition: "excellent", personalisation_level: "highly_personalised", child_consulted: true, next_audit_date: daysFromNow(60) }),
      ];
      const alerts = identifyBedroomAuditAlerts(records);
      expect(alerts).toHaveLength(0);
    });
  });
});
