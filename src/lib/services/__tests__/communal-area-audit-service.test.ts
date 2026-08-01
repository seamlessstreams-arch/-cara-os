// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMMUNAL AREA AUDIT SERVICE TESTS
// Pure-function tests for communal area audit metrics, alert identification,
// and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  AREA_TYPES,
  CLEANLINESS_RATINGS,
  HOMELINESS_RATINGS,
  SAFETY_CHECKS,
  _testing,
} from "../communal-area-audit-service";

import type { CommunalAreaRecord } from "../communal-area-audit-service";

const { computeCommunalAreaMetrics, identifyCommunalAreaAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<CommunalAreaRecord>,
): CommunalAreaRecord {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    area_type: "area_type" in (overrides ?? {}) ? overrides!.area_type! : "lounge",
    audit_date: "audit_date" in (overrides ?? {}) ? overrides!.audit_date! : "2026-05-01",
    cleanliness_rating: "cleanliness_rating" in (overrides ?? {}) ? overrides!.cleanliness_rating! : "clean",
    homeliness_rating: "homeliness_rating" in (overrides ?? {}) ? overrides!.homeliness_rating! : "homely",
    safety_check: "safety_check" in (overrides ?? {}) ? overrides!.safety_check! : "all_clear",
    furniture_good_condition: "furniture_good_condition" in (overrides ?? {}) ? overrides!.furniture_good_condition! : true,
    decoration_fresh: "decoration_fresh" in (overrides ?? {}) ? overrides!.decoration_fresh! : true,
    temperature_comfortable: "temperature_comfortable" in (overrides ?? {}) ? overrides!.temperature_comfortable! : true,
    lighting_adequate: "lighting_adequate" in (overrides ?? {}) ? overrides!.lighting_adequate! : true,
    ventilation_adequate: "ventilation_adequate" in (overrides ?? {}) ? overrides!.ventilation_adequate! : true,
    accessible: "accessible" in (overrides ?? {}) ? overrides!.accessible! : true,
    child_artwork_displayed: "child_artwork_displayed" in (overrides ?? {}) ? overrides!.child_artwork_displayed! : false,
    age_appropriate_resources: "age_appropriate_resources" in (overrides ?? {}) ? overrides!.age_appropriate_resources! : true,
    hazards_removed: "hazards_removed" in (overrides ?? {}) ? overrides!.hazards_removed! : true,
    fire_exits_clear: "fire_exits_clear" in (overrides ?? {}) ? overrides!.fire_exits_clear! : true,
    children_consulted: "children_consulted" in (overrides ?? {}) ? overrides!.children_consulted! : false,
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
  describe("AREA_TYPES", () => {
    it("has exactly 10 items", () => {
      expect(AREA_TYPES).toHaveLength(10);
    });

    it("contains lounge", () => {
      expect(AREA_TYPES).toContainEqual({ type: "lounge", label: "Lounge" });
    });

    it("contains kitchen", () => {
      expect(AREA_TYPES).toContainEqual({ type: "kitchen", label: "Kitchen" });
    });

    it("contains dining_room", () => {
      expect(AREA_TYPES).toContainEqual({ type: "dining_room", label: "Dining Room" });
    });

    it("contains garden", () => {
      expect(AREA_TYPES).toContainEqual({ type: "garden", label: "Garden" });
    });

    it("contains hallway", () => {
      expect(AREA_TYPES).toContainEqual({ type: "hallway", label: "Hallway" });
    });

    it("contains bathroom", () => {
      expect(AREA_TYPES).toContainEqual({ type: "bathroom", label: "Bathroom" });
    });

    it("contains utility_room", () => {
      expect(AREA_TYPES).toContainEqual({ type: "utility_room", label: "Utility Room" });
    });

    it("contains office", () => {
      expect(AREA_TYPES).toContainEqual({ type: "office", label: "Office" });
    });

    it("contains sensory_room", () => {
      expect(AREA_TYPES).toContainEqual({ type: "sensory_room", label: "Sensory Room" });
    });

    it("contains other", () => {
      expect(AREA_TYPES).toContainEqual({ type: "other", label: "Other" });
    });

    it("has unique type values", () => {
      const types = AREA_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique labels", () => {
      const labels = AREA_TYPES.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });
  });

  describe("CLEANLINESS_RATINGS", () => {
    it("has exactly 5 items", () => {
      expect(CLEANLINESS_RATINGS).toHaveLength(5);
    });

    it("contains spotless", () => {
      expect(CLEANLINESS_RATINGS).toContainEqual({ rating: "spotless", label: "Spotless" });
    });

    it("contains clean", () => {
      expect(CLEANLINESS_RATINGS).toContainEqual({ rating: "clean", label: "Clean" });
    });

    it("contains acceptable", () => {
      expect(CLEANLINESS_RATINGS).toContainEqual({ rating: "acceptable", label: "Acceptable" });
    });

    it("contains needs_attention", () => {
      expect(CLEANLINESS_RATINGS).toContainEqual({ rating: "needs_attention", label: "Needs Attention" });
    });

    it("contains unacceptable", () => {
      expect(CLEANLINESS_RATINGS).toContainEqual({ rating: "unacceptable", label: "Unacceptable" });
    });

    it("has unique rating values", () => {
      const ratings = CLEANLINESS_RATINGS.map((r) => r.rating);
      expect(new Set(ratings).size).toBe(ratings.length);
    });
  });

  describe("HOMELINESS_RATINGS", () => {
    it("has exactly 5 items", () => {
      expect(HOMELINESS_RATINGS).toHaveLength(5);
    });

    it("contains very_homely", () => {
      expect(HOMELINESS_RATINGS).toContainEqual({ rating: "very_homely", label: "Very Homely" });
    });

    it("contains homely", () => {
      expect(HOMELINESS_RATINGS).toContainEqual({ rating: "homely", label: "Homely" });
    });

    it("contains adequate", () => {
      expect(HOMELINESS_RATINGS).toContainEqual({ rating: "adequate", label: "Adequate" });
    });

    it("contains institutional", () => {
      expect(HOMELINESS_RATINGS).toContainEqual({ rating: "institutional", label: "Institutional" });
    });

    it("contains not_assessed", () => {
      expect(HOMELINESS_RATINGS).toContainEqual({ rating: "not_assessed", label: "Not Assessed" });
    });

    it("has unique rating values", () => {
      const ratings = HOMELINESS_RATINGS.map((r) => r.rating);
      expect(new Set(ratings).size).toBe(ratings.length);
    });
  });

  describe("SAFETY_CHECKS", () => {
    it("has exactly 5 items", () => {
      expect(SAFETY_CHECKS).toHaveLength(5);
    });

    it("contains all_clear", () => {
      expect(SAFETY_CHECKS).toContainEqual({ check: "all_clear", label: "All Clear" });
    });

    it("contains minor_hazard", () => {
      expect(SAFETY_CHECKS).toContainEqual({ check: "minor_hazard", label: "Minor Hazard" });
    });

    it("contains significant_hazard", () => {
      expect(SAFETY_CHECKS).toContainEqual({ check: "significant_hazard", label: "Significant Hazard" });
    });

    it("contains immediate_risk", () => {
      expect(SAFETY_CHECKS).toContainEqual({ check: "immediate_risk", label: "Immediate Risk" });
    });

    it("contains not_checked", () => {
      expect(SAFETY_CHECKS).toContainEqual({ check: "not_checked", label: "Not Checked" });
    });

    it("has unique check values", () => {
      const checks = SAFETY_CHECKS.map((c) => c.check);
      expect(new Set(checks).size).toBe(checks.length);
    });
  });
});

// ── computeCommunalAreaMetrics ─────────────────────────────────────────────

describe("communal-area-audit-service", () => {
  describe("computeCommunalAreaMetrics", () => {
    describe("empty array", () => {
      it("returns zero total_audits", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.total_audits).toBe(0);
      });

      it("returns zero spotless_rate", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.spotless_rate).toBeNull();;
      });

      it("returns zero clean_rate", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.clean_rate).toBeNull();;
      });

      it("returns zero unacceptable_count", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.unacceptable_count).toBe(0);
      });

      it("returns zero very_homely_rate", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.very_homely_rate).toBeNull();;
      });

      it("returns zero institutional_count", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.institutional_count).toBe(0);
      });

      it("returns zero all_clear_rate", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.all_clear_rate).toBeNull();;
      });

      it("returns zero immediate_risk_count", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.immediate_risk_count).toBe(0);
      });

      it("returns zero significant_hazard_count", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.significant_hazard_count).toBe(0);
      });

      it("returns zero furniture_good_rate", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.furniture_good_rate).toBeNull();;
      });

      it("returns zero decoration_fresh_rate", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.decoration_fresh_rate).toBeNull();;
      });

      it("returns zero temperature_comfortable_rate", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.temperature_comfortable_rate).toBeNull();;
      });

      it("returns zero lighting_adequate_rate", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.lighting_adequate_rate).toBeNull();;
      });

      it("returns zero accessible_rate", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.accessible_rate).toBeNull();;
      });

      it("returns zero child_artwork_rate", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.child_artwork_rate).toBeNull();;
      });

      it("returns zero age_appropriate_rate", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.age_appropriate_rate).toBeNull();;
      });

      it("returns zero hazards_removed_rate", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.hazards_removed_rate).toBeNull();;
      });

      it("returns zero fire_exits_clear_rate", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.fire_exits_clear_rate).toBeNull();;
      });

      it("returns zero children_consulted_rate", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.children_consulted_rate).toBeNull();;
      });

      it("returns zero audit_overdue_count", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.audit_overdue_count).toBe(0);
      });

      it("returns empty by_area_type", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.by_area_type).toEqual({});
      });

      it("returns empty by_cleanliness_rating", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.by_cleanliness_rating).toEqual({});
      });

      it("returns empty by_homeliness_rating", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.by_homeliness_rating).toEqual({});
      });

      it("returns empty by_safety_check", () => {
        const m = computeCommunalAreaMetrics([]);
        expect(m.by_safety_check).toEqual({});
      });
    });

    describe("total_audits", () => {
      it("counts a single record", () => {
        const m = computeCommunalAreaMetrics([makeRecord()]);
        expect(m.total_audits).toBe(1);
      });

      it("counts three records", () => {
        const m = computeCommunalAreaMetrics([makeRecord(), makeRecord(), makeRecord()]);
        expect(m.total_audits).toBe(3);
      });
    });

    describe("spotless_rate", () => {
      it("returns 100 when all records are spotless", () => {
        const records = [
          makeRecord({ cleanliness_rating: "spotless" }),
          makeRecord({ cleanliness_rating: "spotless" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.spotless_rate).toBe(100);
      });

      it("returns 0 when no records are spotless", () => {
        const records = [
          makeRecord({ cleanliness_rating: "clean" }),
          makeRecord({ cleanliness_rating: "acceptable" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.spotless_rate).toBe(0);
      });

      it("calculates 50% correctly (1/2)", () => {
        const records = [
          makeRecord({ cleanliness_rating: "spotless" }),
          makeRecord({ cleanliness_rating: "clean" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.spotless_rate).toBe(50);
      });

      it("rounds to 1 decimal place (1/3 = 33.3%)", () => {
        const records = [
          makeRecord({ cleanliness_rating: "spotless" }),
          makeRecord({ cleanliness_rating: "clean" }),
          makeRecord({ cleanliness_rating: "acceptable" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.spotless_rate).toBe(33.3);
      });

      it("rounds to 1 decimal place (2/3 = 66.7%)", () => {
        const records = [
          makeRecord({ cleanliness_rating: "spotless" }),
          makeRecord({ cleanliness_rating: "spotless" }),
          makeRecord({ cleanliness_rating: "clean" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.spotless_rate).toBe(66.7);
      });
    });

    describe("clean_rate", () => {
      it("returns 100 when all records are clean", () => {
        const records = [
          makeRecord({ cleanliness_rating: "clean" }),
          makeRecord({ cleanliness_rating: "clean" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.clean_rate).toBe(100);
      });

      it("returns 0 when no records are clean", () => {
        const records = [
          makeRecord({ cleanliness_rating: "spotless" }),
          makeRecord({ cleanliness_rating: "acceptable" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.clean_rate).toBe(0);
      });

      it("calculates 50% correctly (1/2)", () => {
        const records = [
          makeRecord({ cleanliness_rating: "clean" }),
          makeRecord({ cleanliness_rating: "spotless" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.clean_rate).toBe(50);
      });

      it("rounds to 1 decimal place (1/3 = 33.3%)", () => {
        const records = [
          makeRecord({ cleanliness_rating: "clean" }),
          makeRecord({ cleanliness_rating: "spotless" }),
          makeRecord({ cleanliness_rating: "acceptable" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.clean_rate).toBe(33.3);
      });

      it("does not count spotless as clean", () => {
        const records = [makeRecord({ cleanliness_rating: "spotless" })];
        const m = computeCommunalAreaMetrics(records);
        expect(m.clean_rate).toBe(0);
      });
    });

    describe("unacceptable_count", () => {
      it("counts a single unacceptable record", () => {
        const records = [makeRecord({ cleanliness_rating: "unacceptable" })];
        const m = computeCommunalAreaMetrics(records);
        expect(m.unacceptable_count).toBe(1);
      });

      it("counts multiple unacceptable records", () => {
        const records = [
          makeRecord({ cleanliness_rating: "unacceptable" }),
          makeRecord({ cleanliness_rating: "unacceptable" }),
          makeRecord({ cleanliness_rating: "unacceptable" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.unacceptable_count).toBe(3);
      });

      it("does not count needs_attention as unacceptable", () => {
        const records = [makeRecord({ cleanliness_rating: "needs_attention" })];
        const m = computeCommunalAreaMetrics(records);
        expect(m.unacceptable_count).toBe(0);
      });

      it("does not count acceptable as unacceptable", () => {
        const records = [makeRecord({ cleanliness_rating: "acceptable" })];
        const m = computeCommunalAreaMetrics(records);
        expect(m.unacceptable_count).toBe(0);
      });
    });

    describe("very_homely_rate", () => {
      it("returns 100 when all records are very_homely", () => {
        const records = [
          makeRecord({ homeliness_rating: "very_homely" }),
          makeRecord({ homeliness_rating: "very_homely" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.very_homely_rate).toBe(100);
      });

      it("returns 0 when no records are very_homely", () => {
        const records = [
          makeRecord({ homeliness_rating: "homely" }),
          makeRecord({ homeliness_rating: "adequate" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.very_homely_rate).toBe(0);
      });

      it("calculates 50% correctly (1/2)", () => {
        const records = [
          makeRecord({ homeliness_rating: "very_homely" }),
          makeRecord({ homeliness_rating: "homely" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.very_homely_rate).toBe(50);
      });

      it("rounds to 1 decimal place (1/3 = 33.3%)", () => {
        const records = [
          makeRecord({ homeliness_rating: "very_homely" }),
          makeRecord({ homeliness_rating: "homely" }),
          makeRecord({ homeliness_rating: "adequate" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.very_homely_rate).toBe(33.3);
      });

      it("does not count homely as very_homely", () => {
        const records = [makeRecord({ homeliness_rating: "homely" })];
        const m = computeCommunalAreaMetrics(records);
        expect(m.very_homely_rate).toBe(0);
      });
    });

    describe("institutional_count", () => {
      it("counts a single institutional record", () => {
        const records = [makeRecord({ homeliness_rating: "institutional" })];
        const m = computeCommunalAreaMetrics(records);
        expect(m.institutional_count).toBe(1);
      });

      it("counts multiple institutional records", () => {
        const records = [
          makeRecord({ homeliness_rating: "institutional" }),
          makeRecord({ homeliness_rating: "institutional" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.institutional_count).toBe(2);
      });

      it("does not count adequate as institutional", () => {
        const records = [makeRecord({ homeliness_rating: "adequate" })];
        const m = computeCommunalAreaMetrics(records);
        expect(m.institutional_count).toBe(0);
      });

      it("does not count not_assessed as institutional", () => {
        const records = [makeRecord({ homeliness_rating: "not_assessed" })];
        const m = computeCommunalAreaMetrics(records);
        expect(m.institutional_count).toBe(0);
      });
    });

    describe("all_clear_rate", () => {
      it("returns 100 when all records are all_clear", () => {
        const records = [
          makeRecord({ safety_check: "all_clear" }),
          makeRecord({ safety_check: "all_clear" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.all_clear_rate).toBe(100);
      });

      it("returns 0 when no records are all_clear", () => {
        const records = [
          makeRecord({ safety_check: "minor_hazard" }),
          makeRecord({ safety_check: "significant_hazard" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.all_clear_rate).toBe(0);
      });

      it("calculates 50% correctly (1/2)", () => {
        const records = [
          makeRecord({ safety_check: "all_clear" }),
          makeRecord({ safety_check: "minor_hazard" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.all_clear_rate).toBe(50);
      });

      it("rounds to 1 decimal place (2/3 = 66.7%)", () => {
        const records = [
          makeRecord({ safety_check: "all_clear" }),
          makeRecord({ safety_check: "all_clear" }),
          makeRecord({ safety_check: "minor_hazard" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.all_clear_rate).toBe(66.7);
      });
    });

    describe("immediate_risk_count", () => {
      it("counts a single immediate_risk record", () => {
        const records = [makeRecord({ safety_check: "immediate_risk" })];
        const m = computeCommunalAreaMetrics(records);
        expect(m.immediate_risk_count).toBe(1);
      });

      it("counts multiple immediate_risk records", () => {
        const records = [
          makeRecord({ safety_check: "immediate_risk" }),
          makeRecord({ safety_check: "immediate_risk" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.immediate_risk_count).toBe(2);
      });

      it("does not count significant_hazard as immediate_risk", () => {
        const records = [makeRecord({ safety_check: "significant_hazard" })];
        const m = computeCommunalAreaMetrics(records);
        expect(m.immediate_risk_count).toBe(0);
      });

      it("does not count minor_hazard as immediate_risk", () => {
        const records = [makeRecord({ safety_check: "minor_hazard" })];
        const m = computeCommunalAreaMetrics(records);
        expect(m.immediate_risk_count).toBe(0);
      });
    });

    describe("significant_hazard_count", () => {
      it("counts a single significant_hazard record", () => {
        const records = [makeRecord({ safety_check: "significant_hazard" })];
        const m = computeCommunalAreaMetrics(records);
        expect(m.significant_hazard_count).toBe(1);
      });

      it("counts multiple significant_hazard records", () => {
        const records = [
          makeRecord({ safety_check: "significant_hazard" }),
          makeRecord({ safety_check: "significant_hazard" }),
          makeRecord({ safety_check: "significant_hazard" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.significant_hazard_count).toBe(3);
      });

      it("does not count immediate_risk as significant_hazard", () => {
        const records = [makeRecord({ safety_check: "immediate_risk" })];
        const m = computeCommunalAreaMetrics(records);
        expect(m.significant_hazard_count).toBe(0);
      });

      it("does not count not_checked as significant_hazard", () => {
        const records = [makeRecord({ safety_check: "not_checked" })];
        const m = computeCommunalAreaMetrics(records);
        expect(m.significant_hazard_count).toBe(0);
      });
    });

    describe("furniture_good_rate (boolRate)", () => {
      it("returns 100 when all true", () => {
        const records = [
          makeRecord({ furniture_good_condition: true }),
          makeRecord({ furniture_good_condition: true }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.furniture_good_rate).toBe(100);
      });

      it("returns 0 when all false", () => {
        const records = [
          makeRecord({ furniture_good_condition: false }),
          makeRecord({ furniture_good_condition: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.furniture_good_rate).toBe(0);
      });

      it("returns 50 when half true", () => {
        const records = [
          makeRecord({ furniture_good_condition: true }),
          makeRecord({ furniture_good_condition: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.furniture_good_rate).toBe(50);
      });

      it("rounds to 1 decimal place (1/3 = 33.3%)", () => {
        const records = [
          makeRecord({ furniture_good_condition: true }),
          makeRecord({ furniture_good_condition: false }),
          makeRecord({ furniture_good_condition: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.furniture_good_rate).toBe(33.3);
      });
    });

    describe("decoration_fresh_rate (boolRate)", () => {
      it("returns 100 when all true", () => {
        const records = [
          makeRecord({ decoration_fresh: true }),
          makeRecord({ decoration_fresh: true }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.decoration_fresh_rate).toBe(100);
      });

      it("returns 0 when all false", () => {
        const records = [
          makeRecord({ decoration_fresh: false }),
          makeRecord({ decoration_fresh: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.decoration_fresh_rate).toBe(0);
      });

      it("returns 50 when half true", () => {
        const records = [
          makeRecord({ decoration_fresh: true }),
          makeRecord({ decoration_fresh: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.decoration_fresh_rate).toBe(50);
      });
    });

    describe("temperature_comfortable_rate (boolRate)", () => {
      it("returns 100 when all true", () => {
        const records = [
          makeRecord({ temperature_comfortable: true }),
          makeRecord({ temperature_comfortable: true }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.temperature_comfortable_rate).toBe(100);
      });

      it("returns 0 when all false", () => {
        const records = [
          makeRecord({ temperature_comfortable: false }),
          makeRecord({ temperature_comfortable: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.temperature_comfortable_rate).toBe(0);
      });

      it("rounds to 1 decimal place (2/3 = 66.7%)", () => {
        const records = [
          makeRecord({ temperature_comfortable: true }),
          makeRecord({ temperature_comfortable: true }),
          makeRecord({ temperature_comfortable: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.temperature_comfortable_rate).toBe(66.7);
      });
    });

    describe("lighting_adequate_rate (boolRate)", () => {
      it("returns 100 when all true", () => {
        const records = [
          makeRecord({ lighting_adequate: true }),
          makeRecord({ lighting_adequate: true }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.lighting_adequate_rate).toBe(100);
      });

      it("returns 0 when all false", () => {
        const records = [
          makeRecord({ lighting_adequate: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.lighting_adequate_rate).toBe(0);
      });

      it("returns 50 when half true", () => {
        const records = [
          makeRecord({ lighting_adequate: true }),
          makeRecord({ lighting_adequate: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.lighting_adequate_rate).toBe(50);
      });
    });

    describe("accessible_rate (boolRate)", () => {
      it("returns 100 when all true", () => {
        const records = [
          makeRecord({ accessible: true }),
          makeRecord({ accessible: true }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.accessible_rate).toBe(100);
      });

      it("returns 0 when all false", () => {
        const records = [
          makeRecord({ accessible: false }),
          makeRecord({ accessible: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.accessible_rate).toBe(0);
      });

      it("returns 50 when half true", () => {
        const records = [
          makeRecord({ accessible: true }),
          makeRecord({ accessible: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.accessible_rate).toBe(50);
      });
    });

    describe("child_artwork_rate (boolRate)", () => {
      it("returns 100 when all true", () => {
        const records = [
          makeRecord({ child_artwork_displayed: true }),
          makeRecord({ child_artwork_displayed: true }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.child_artwork_rate).toBe(100);
      });

      it("returns 0 when all false", () => {
        const records = [
          makeRecord({ child_artwork_displayed: false }),
          makeRecord({ child_artwork_displayed: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.child_artwork_rate).toBe(0);
      });

      it("returns 50 when half true", () => {
        const records = [
          makeRecord({ child_artwork_displayed: true }),
          makeRecord({ child_artwork_displayed: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.child_artwork_rate).toBe(50);
      });
    });

    describe("age_appropriate_rate (boolRate)", () => {
      it("returns 100 when all true", () => {
        const records = [
          makeRecord({ age_appropriate_resources: true }),
          makeRecord({ age_appropriate_resources: true }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.age_appropriate_rate).toBe(100);
      });

      it("returns 0 when all false", () => {
        const records = [
          makeRecord({ age_appropriate_resources: false }),
          makeRecord({ age_appropriate_resources: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.age_appropriate_rate).toBe(0);
      });

      it("rounds to 1 decimal place (1/3 = 33.3%)", () => {
        const records = [
          makeRecord({ age_appropriate_resources: true }),
          makeRecord({ age_appropriate_resources: false }),
          makeRecord({ age_appropriate_resources: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.age_appropriate_rate).toBe(33.3);
      });
    });

    describe("hazards_removed_rate (boolRate)", () => {
      it("returns 100 when all true", () => {
        const records = [
          makeRecord({ hazards_removed: true }),
          makeRecord({ hazards_removed: true }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.hazards_removed_rate).toBe(100);
      });

      it("returns 0 when all false", () => {
        const records = [
          makeRecord({ hazards_removed: false }),
          makeRecord({ hazards_removed: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.hazards_removed_rate).toBe(0);
      });

      it("returns 50 when half true", () => {
        const records = [
          makeRecord({ hazards_removed: true }),
          makeRecord({ hazards_removed: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.hazards_removed_rate).toBe(50);
      });
    });

    describe("fire_exits_clear_rate (boolRate)", () => {
      it("returns 100 when all true", () => {
        const records = [
          makeRecord({ fire_exits_clear: true }),
          makeRecord({ fire_exits_clear: true }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.fire_exits_clear_rate).toBe(100);
      });

      it("returns 0 when all false", () => {
        const records = [
          makeRecord({ fire_exits_clear: false }),
          makeRecord({ fire_exits_clear: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.fire_exits_clear_rate).toBe(0);
      });

      it("rounds to 1 decimal place (2/3 = 66.7%)", () => {
        const records = [
          makeRecord({ fire_exits_clear: true }),
          makeRecord({ fire_exits_clear: true }),
          makeRecord({ fire_exits_clear: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.fire_exits_clear_rate).toBe(66.7);
      });
    });

    describe("children_consulted_rate (boolRate)", () => {
      it("returns 100 when all true", () => {
        const records = [
          makeRecord({ children_consulted: true }),
          makeRecord({ children_consulted: true }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.children_consulted_rate).toBe(100);
      });

      it("returns 0 when all false", () => {
        const records = [
          makeRecord({ children_consulted: false }),
          makeRecord({ children_consulted: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.children_consulted_rate).toBe(0);
      });

      it("returns 50 when half true", () => {
        const records = [
          makeRecord({ children_consulted: true }),
          makeRecord({ children_consulted: false }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.children_consulted_rate).toBe(50);
      });
    });

    describe("audit_overdue_count", () => {
      it("returns 0 when no records have next_audit_date", () => {
        const records = [
          makeRecord({ next_audit_date: null }),
          makeRecord({ next_audit_date: null }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.audit_overdue_count).toBe(0);
      });

      it("counts records with past next_audit_date as overdue", () => {
        const records = [
          makeRecord({ next_audit_date: daysAgo(5) }),
          makeRecord({ next_audit_date: daysAgo(10) }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.audit_overdue_count).toBe(2);
      });

      it("does not count future next_audit_date as overdue", () => {
        const records = [
          makeRecord({ next_audit_date: daysFromNow(5) }),
          makeRecord({ next_audit_date: daysFromNow(10) }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.audit_overdue_count).toBe(0);
      });

      it("counts mix of overdue and future correctly", () => {
        const records = [
          makeRecord({ next_audit_date: daysAgo(5) }),
          makeRecord({ next_audit_date: daysFromNow(5) }),
          makeRecord({ next_audit_date: null }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.audit_overdue_count).toBe(1);
      });

      it("excludes null next_audit_date from overdue count", () => {
        const records = [
          makeRecord({ next_audit_date: null }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.audit_overdue_count).toBe(0);
      });
    });

    describe("by_area_type breakdown", () => {
      it("groups single area type", () => {
        const records = [
          makeRecord({ area_type: "lounge" }),
          makeRecord({ area_type: "lounge" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.by_area_type).toEqual({ lounge: 2 });
      });

      it("groups multiple area types", () => {
        const records = [
          makeRecord({ area_type: "lounge" }),
          makeRecord({ area_type: "kitchen" }),
          makeRecord({ area_type: "lounge" }),
          makeRecord({ area_type: "garden" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.by_area_type).toEqual({ lounge: 2, kitchen: 1, garden: 1 });
      });

      it("handles all different area types", () => {
        const records = [
          makeRecord({ area_type: "lounge" }),
          makeRecord({ area_type: "kitchen" }),
          makeRecord({ area_type: "dining_room" }),
          makeRecord({ area_type: "garden" }),
          makeRecord({ area_type: "hallway" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.by_area_type).toEqual({
          lounge: 1,
          kitchen: 1,
          dining_room: 1,
          garden: 1,
          hallway: 1,
        });
      });
    });

    describe("by_cleanliness_rating breakdown", () => {
      it("groups single cleanliness rating", () => {
        const records = [
          makeRecord({ cleanliness_rating: "clean" }),
          makeRecord({ cleanliness_rating: "clean" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.by_cleanliness_rating).toEqual({ clean: 2 });
      });

      it("groups multiple cleanliness ratings", () => {
        const records = [
          makeRecord({ cleanliness_rating: "spotless" }),
          makeRecord({ cleanliness_rating: "clean" }),
          makeRecord({ cleanliness_rating: "unacceptable" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.by_cleanliness_rating).toEqual({ spotless: 1, clean: 1, unacceptable: 1 });
      });
    });

    describe("by_homeliness_rating breakdown", () => {
      it("groups single homeliness rating", () => {
        const records = [
          makeRecord({ homeliness_rating: "homely" }),
          makeRecord({ homeliness_rating: "homely" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.by_homeliness_rating).toEqual({ homely: 2 });
      });

      it("groups multiple homeliness ratings", () => {
        const records = [
          makeRecord({ homeliness_rating: "very_homely" }),
          makeRecord({ homeliness_rating: "homely" }),
          makeRecord({ homeliness_rating: "institutional" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.by_homeliness_rating).toEqual({ very_homely: 1, homely: 1, institutional: 1 });
      });
    });

    describe("by_safety_check breakdown", () => {
      it("groups single safety check", () => {
        const records = [
          makeRecord({ safety_check: "all_clear" }),
          makeRecord({ safety_check: "all_clear" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.by_safety_check).toEqual({ all_clear: 2 });
      });

      it("groups multiple safety checks", () => {
        const records = [
          makeRecord({ safety_check: "all_clear" }),
          makeRecord({ safety_check: "minor_hazard" }),
          makeRecord({ safety_check: "immediate_risk" }),
        ];
        const m = computeCommunalAreaMetrics(records);
        expect(m.by_safety_check).toEqual({ all_clear: 1, minor_hazard: 1, immediate_risk: 1 });
      });
    });

    describe("single record metrics", () => {
      const record = makeRecord({
        area_type: "kitchen",
        cleanliness_rating: "spotless",
        homeliness_rating: "very_homely",
        safety_check: "all_clear",
        furniture_good_condition: true,
        decoration_fresh: true,
        temperature_comfortable: true,
        lighting_adequate: true,
        accessible: true,
        child_artwork_displayed: true,
        age_appropriate_resources: true,
        hazards_removed: true,
        fire_exits_clear: true,
        children_consulted: true,
      });

      it("returns total_audits = 1", () => {
        const m = computeCommunalAreaMetrics([record]);
        expect(m.total_audits).toBe(1);
      });

      it("returns spotless_rate = 100", () => {
        const m = computeCommunalAreaMetrics([record]);
        expect(m.spotless_rate).toBe(100);
      });

      it("returns clean_rate = 0 (not clean, spotless)", () => {
        const m = computeCommunalAreaMetrics([record]);
        expect(m.clean_rate).toBe(0);
      });

      it("returns very_homely_rate = 100", () => {
        const m = computeCommunalAreaMetrics([record]);
        expect(m.very_homely_rate).toBe(100);
      });

      it("returns all_clear_rate = 100", () => {
        const m = computeCommunalAreaMetrics([record]);
        expect(m.all_clear_rate).toBe(100);
      });

      it("returns furniture_good_rate = 100", () => {
        const m = computeCommunalAreaMetrics([record]);
        expect(m.furniture_good_rate).toBe(100);
      });

      it("returns decoration_fresh_rate = 100", () => {
        const m = computeCommunalAreaMetrics([record]);
        expect(m.decoration_fresh_rate).toBe(100);
      });

      it("returns temperature_comfortable_rate = 100", () => {
        const m = computeCommunalAreaMetrics([record]);
        expect(m.temperature_comfortable_rate).toBe(100);
      });

      it("returns lighting_adequate_rate = 100", () => {
        const m = computeCommunalAreaMetrics([record]);
        expect(m.lighting_adequate_rate).toBe(100);
      });

      it("returns accessible_rate = 100", () => {
        const m = computeCommunalAreaMetrics([record]);
        expect(m.accessible_rate).toBe(100);
      });

      it("returns child_artwork_rate = 100", () => {
        const m = computeCommunalAreaMetrics([record]);
        expect(m.child_artwork_rate).toBe(100);
      });

      it("returns age_appropriate_rate = 100", () => {
        const m = computeCommunalAreaMetrics([record]);
        expect(m.age_appropriate_rate).toBe(100);
      });

      it("returns hazards_removed_rate = 100", () => {
        const m = computeCommunalAreaMetrics([record]);
        expect(m.hazards_removed_rate).toBe(100);
      });

      it("returns fire_exits_clear_rate = 100", () => {
        const m = computeCommunalAreaMetrics([record]);
        expect(m.fire_exits_clear_rate).toBe(100);
      });

      it("returns children_consulted_rate = 100", () => {
        const m = computeCommunalAreaMetrics([record]);
        expect(m.children_consulted_rate).toBe(100);
      });

      it("returns by_area_type with single entry", () => {
        const m = computeCommunalAreaMetrics([record]);
        expect(m.by_area_type).toEqual({ kitchen: 1 });
      });

      it("returns by_cleanliness_rating with single entry", () => {
        const m = computeCommunalAreaMetrics([record]);
        expect(m.by_cleanliness_rating).toEqual({ spotless: 1 });
      });

      it("returns by_homeliness_rating with single entry", () => {
        const m = computeCommunalAreaMetrics([record]);
        expect(m.by_homeliness_rating).toEqual({ very_homely: 1 });
      });

      it("returns by_safety_check with single entry", () => {
        const m = computeCommunalAreaMetrics([record]);
        expect(m.by_safety_check).toEqual({ all_clear: 1 });
      });
    });

    describe("mixed dataset", () => {
      const records = [
        makeRecord({ area_type: "lounge", cleanliness_rating: "spotless", homeliness_rating: "very_homely", safety_check: "all_clear", furniture_good_condition: true, decoration_fresh: true, temperature_comfortable: true, lighting_adequate: true, accessible: true, child_artwork_displayed: true, age_appropriate_resources: true, hazards_removed: true, fire_exits_clear: true, children_consulted: true }),
        makeRecord({ area_type: "kitchen", cleanliness_rating: "clean", homeliness_rating: "homely", safety_check: "minor_hazard", furniture_good_condition: false, decoration_fresh: false, temperature_comfortable: false, lighting_adequate: false, accessible: false, child_artwork_displayed: false, age_appropriate_resources: false, hazards_removed: false, fire_exits_clear: false, children_consulted: false }),
        makeRecord({ area_type: "lounge", cleanliness_rating: "unacceptable", homeliness_rating: "institutional", safety_check: "immediate_risk", furniture_good_condition: true, decoration_fresh: true, temperature_comfortable: true, lighting_adequate: true, accessible: true, child_artwork_displayed: false, age_appropriate_resources: true, hazards_removed: true, fire_exits_clear: true, children_consulted: false }),
        makeRecord({ area_type: "garden", cleanliness_rating: "needs_attention", homeliness_rating: "adequate", safety_check: "significant_hazard", furniture_good_condition: false, decoration_fresh: false, temperature_comfortable: false, lighting_adequate: false, accessible: false, child_artwork_displayed: false, age_appropriate_resources: false, hazards_removed: false, fire_exits_clear: false, children_consulted: false }),
        makeRecord({ area_type: "bathroom", cleanliness_rating: "acceptable", homeliness_rating: "not_assessed", safety_check: "not_checked", furniture_good_condition: true, decoration_fresh: false, temperature_comfortable: true, lighting_adequate: false, accessible: true, child_artwork_displayed: true, age_appropriate_resources: false, hazards_removed: true, fire_exits_clear: true, children_consulted: true }),
      ];

      it("returns total_audits = 5", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.total_audits).toBe(5);
      });

      it("calculates spotless_rate correctly (1/5 = 20%)", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.spotless_rate).toBe(20);
      });

      it("calculates clean_rate correctly (1/5 = 20%)", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.clean_rate).toBe(20);
      });

      it("returns unacceptable_count = 1", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.unacceptable_count).toBe(1);
      });

      it("calculates very_homely_rate correctly (1/5 = 20%)", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.very_homely_rate).toBe(20);
      });

      it("returns institutional_count = 1", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.institutional_count).toBe(1);
      });

      it("calculates all_clear_rate correctly (1/5 = 20%)", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.all_clear_rate).toBe(20);
      });

      it("returns immediate_risk_count = 1", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.immediate_risk_count).toBe(1);
      });

      it("returns significant_hazard_count = 1", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.significant_hazard_count).toBe(1);
      });

      it("calculates furniture_good_rate correctly (3/5 = 60%)", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.furniture_good_rate).toBe(60);
      });

      it("calculates decoration_fresh_rate correctly (2/5 = 40%)", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.decoration_fresh_rate).toBe(40);
      });

      it("calculates temperature_comfortable_rate correctly (3/5 = 60%)", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.temperature_comfortable_rate).toBe(60);
      });

      it("calculates lighting_adequate_rate correctly (2/5 = 40%)", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.lighting_adequate_rate).toBe(40);
      });

      it("calculates accessible_rate correctly (3/5 = 60%)", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.accessible_rate).toBe(60);
      });

      it("calculates child_artwork_rate correctly (2/5 = 40%)", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.child_artwork_rate).toBe(40);
      });

      it("calculates age_appropriate_rate correctly (2/5 = 40%)", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.age_appropriate_rate).toBe(40);
      });

      it("calculates hazards_removed_rate correctly (3/5 = 60%)", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.hazards_removed_rate).toBe(60);
      });

      it("calculates fire_exits_clear_rate correctly (3/5 = 60%)", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.fire_exits_clear_rate).toBe(60);
      });

      it("calculates children_consulted_rate correctly (2/5 = 40%)", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.children_consulted_rate).toBe(40);
      });

      it("groups by_area_type correctly", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.by_area_type).toEqual({ lounge: 2, kitchen: 1, garden: 1, bathroom: 1 });
      });

      it("groups by_cleanliness_rating correctly", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.by_cleanliness_rating).toEqual({ spotless: 1, clean: 1, unacceptable: 1, needs_attention: 1, acceptable: 1 });
      });

      it("groups by_homeliness_rating correctly", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.by_homeliness_rating).toEqual({ very_homely: 1, homely: 1, institutional: 1, adequate: 1, not_assessed: 1 });
      });

      it("groups by_safety_check correctly", () => {
        const m = computeCommunalAreaMetrics(records);
        expect(m.by_safety_check).toEqual({ all_clear: 1, minor_hazard: 1, immediate_risk: 1, significant_hazard: 1, not_checked: 1 });
      });
    });

    describe("large dataset (20+ records)", () => {
      const largeRecords: CommunalAreaRecord[] = [];
      for (let i = 0; i < 24; i++) {
        largeRecords.push(
          makeRecord({
            area_type: i % 3 === 0 ? "lounge" : i % 3 === 1 ? "kitchen" : "garden",
            cleanliness_rating: i % 4 === 0 ? "spotless" : "clean",
            homeliness_rating: i % 5 === 0 ? "very_homely" : "homely",
            safety_check: i % 6 === 0 ? "immediate_risk" : "all_clear",
            furniture_good_condition: i % 2 === 0,
            fire_exits_clear: i % 3 !== 0,
          }),
        );
      }

      it("returns total_audits = 24", () => {
        const m = computeCommunalAreaMetrics(largeRecords);
        expect(m.total_audits).toBe(24);
      });

      it("calculates spotless_rate for large set (6/24 = 25%)", () => {
        const m = computeCommunalAreaMetrics(largeRecords);
        expect(m.spotless_rate).toBe(25);
      });

      it("calculates clean_rate for large set (18/24 = 75%)", () => {
        const m = computeCommunalAreaMetrics(largeRecords);
        expect(m.clean_rate).toBe(75);
      });

      it("groups by_area_type for large set", () => {
        const m = computeCommunalAreaMetrics(largeRecords);
        expect(m.by_area_type).toEqual({ lounge: 8, kitchen: 8, garden: 8 });
      });

      it("calculates furniture_good_rate for large set (12/24 = 50%)", () => {
        const m = computeCommunalAreaMetrics(largeRecords);
        expect(m.furniture_good_rate).toBe(50);
      });

      it("calculates fire_exits_clear_rate for large set (16/24 = 66.7%)", () => {
        const m = computeCommunalAreaMetrics(largeRecords);
        expect(m.fire_exits_clear_rate).toBe(66.7);
      });
    });
  });

  // ── identifyCommunalAreaAlerts ──────────────────────────────────────────

  describe("identifyCommunalAreaAlerts", () => {
    describe("empty array", () => {
      it("returns no alerts", () => {
        const alerts = identifyCommunalAreaAlerts([]);
        expect(alerts).toEqual([]);
      });

      it("returns an array", () => {
        const alerts = identifyCommunalAreaAlerts([]);
        expect(Array.isArray(alerts)).toBe(true);
      });
    });

    describe("no alerts scenario", () => {
      it("returns no alerts when all records are safe and well-maintained", () => {
        const records = [
          makeRecord({ safety_check: "all_clear", homeliness_rating: "very_homely", cleanliness_rating: "spotless", fire_exits_clear: true, next_audit_date: daysFromNow(30) }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        expect(alerts).toEqual([]);
      });

      it("returns no alerts when records have clean conditions and clear safety", () => {
        const records = [
          makeRecord({ safety_check: "all_clear", homeliness_rating: "homely", cleanliness_rating: "clean", fire_exits_clear: true }),
          makeRecord({ safety_check: "minor_hazard", homeliness_rating: "adequate", cleanliness_rating: "acceptable", fire_exits_clear: true }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        expect(alerts).toEqual([]);
      });
    });

    describe("immediate_risk alert", () => {
      it("fires for a single immediate risk record", () => {
        const records = [
          makeRecord({ id: "r1", safety_check: "immediate_risk", area_type: "lounge", audit_date: "2026-05-01" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const risk = alerts.filter((a) => a.type === "immediate_risk");
        expect(risk).toHaveLength(1);
      });

      it("has critical severity", () => {
        const records = [
          makeRecord({ id: "r1", safety_check: "immediate_risk", area_type: "lounge", audit_date: "2026-05-01" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const risk = alerts.find((a) => a.type === "immediate_risk");
        expect(risk!.severity).toBe("critical");
      });

      it("includes area_type in message with underscores replaced by spaces", () => {
        const records = [
          makeRecord({ id: "r1", safety_check: "immediate_risk", area_type: "dining_room", audit_date: "2026-05-01" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const risk = alerts.find((a) => a.type === "immediate_risk");
        expect(risk!.message).toContain("dining room");
      });

      it("includes audit_date in message", () => {
        const records = [
          makeRecord({ id: "r1", safety_check: "immediate_risk", area_type: "lounge", audit_date: "2026-03-15" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const risk = alerts.find((a) => a.type === "immediate_risk");
        expect(risk!.message).toContain("2026-03-15");
      });

      it("uses the record id as alert id", () => {
        const records = [
          makeRecord({ id: "risk-id-1", safety_check: "immediate_risk", area_type: "lounge", audit_date: "2026-05-01" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const risk = alerts.find((a) => a.type === "immediate_risk");
        expect(risk!.id).toBe("risk-id-1");
      });

      it("fires per-record for multiple immediate risk records", () => {
        const records = [
          makeRecord({ id: "r1", safety_check: "immediate_risk", area_type: "lounge", audit_date: "2026-05-01" }),
          makeRecord({ id: "r2", safety_check: "immediate_risk", area_type: "kitchen", audit_date: "2026-05-02" }),
          makeRecord({ id: "r3", safety_check: "immediate_risk", area_type: "garden", audit_date: "2026-05-03" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const risk = alerts.filter((a) => a.type === "immediate_risk");
        expect(risk).toHaveLength(3);
      });

      it("does not fire for all_clear safety check", () => {
        const records = [makeRecord({ safety_check: "all_clear" })];
        const alerts = identifyCommunalAreaAlerts(records);
        const risk = alerts.filter((a) => a.type === "immediate_risk");
        expect(risk).toHaveLength(0);
      });

      it("does not fire for minor_hazard safety check", () => {
        const records = [makeRecord({ safety_check: "minor_hazard" })];
        const alerts = identifyCommunalAreaAlerts(records);
        const risk = alerts.filter((a) => a.type === "immediate_risk");
        expect(risk).toHaveLength(0);
      });

      it("does not fire for significant_hazard safety check", () => {
        const records = [makeRecord({ safety_check: "significant_hazard" })];
        const alerts = identifyCommunalAreaAlerts(records);
        const risk = alerts.filter((a) => a.type === "immediate_risk");
        expect(risk).toHaveLength(0);
      });

      it("does not fire for not_checked safety check", () => {
        const records = [makeRecord({ safety_check: "not_checked" })];
        const alerts = identifyCommunalAreaAlerts(records);
        const risk = alerts.filter((a) => a.type === "immediate_risk");
        expect(risk).toHaveLength(0);
      });

      it("replaces underscores in utility_room area type", () => {
        const records = [
          makeRecord({ id: "r1", safety_check: "immediate_risk", area_type: "utility_room", audit_date: "2026-05-01" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const risk = alerts.find((a) => a.type === "immediate_risk");
        expect(risk!.message).toContain("utility room");
      });

      it("replaces underscores in sensory_room area type", () => {
        const records = [
          makeRecord({ id: "r1", safety_check: "immediate_risk", area_type: "sensory_room", audit_date: "2026-05-01" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const risk = alerts.find((a) => a.type === "immediate_risk");
        expect(risk!.message).toContain("sensory room");
      });
    });

    describe("institutional alert", () => {
      it("fires for a single institutional record", () => {
        const records = [
          makeRecord({ id: "r1", homeliness_rating: "institutional", area_type: "lounge", audit_date: "2026-05-01" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const inst = alerts.filter((a) => a.type === "institutional");
        expect(inst).toHaveLength(1);
      });

      it("has high severity", () => {
        const records = [
          makeRecord({ id: "r1", homeliness_rating: "institutional", area_type: "lounge", audit_date: "2026-05-01" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const inst = alerts.find((a) => a.type === "institutional");
        expect(inst!.severity).toBe("high");
      });

      it("includes area_type in message with underscores replaced by spaces", () => {
        const records = [
          makeRecord({ id: "r1", homeliness_rating: "institutional", area_type: "dining_room", audit_date: "2026-05-01" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const inst = alerts.find((a) => a.type === "institutional");
        expect(inst!.message).toContain("dining room");
      });

      it("includes audit_date in message", () => {
        const records = [
          makeRecord({ id: "r1", homeliness_rating: "institutional", area_type: "lounge", audit_date: "2026-04-10" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const inst = alerts.find((a) => a.type === "institutional");
        expect(inst!.message).toContain("2026-04-10");
      });

      it("uses the record id as alert id", () => {
        const records = [
          makeRecord({ id: "inst-id-1", homeliness_rating: "institutional", area_type: "lounge", audit_date: "2026-05-01" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const inst = alerts.find((a) => a.type === "institutional");
        expect(inst!.id).toBe("inst-id-1");
      });

      it("fires per-record for multiple institutional records", () => {
        const records = [
          makeRecord({ id: "r1", homeliness_rating: "institutional", area_type: "lounge", audit_date: "2026-05-01" }),
          makeRecord({ id: "r2", homeliness_rating: "institutional", area_type: "kitchen", audit_date: "2026-05-02" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const inst = alerts.filter((a) => a.type === "institutional");
        expect(inst).toHaveLength(2);
      });

      it("does not fire for homely rating", () => {
        const records = [makeRecord({ homeliness_rating: "homely" })];
        const alerts = identifyCommunalAreaAlerts(records);
        const inst = alerts.filter((a) => a.type === "institutional");
        expect(inst).toHaveLength(0);
      });

      it("does not fire for adequate rating", () => {
        const records = [makeRecord({ homeliness_rating: "adequate" })];
        const alerts = identifyCommunalAreaAlerts(records);
        const inst = alerts.filter((a) => a.type === "institutional");
        expect(inst).toHaveLength(0);
      });

      it("does not fire for very_homely rating", () => {
        const records = [makeRecord({ homeliness_rating: "very_homely" })];
        const alerts = identifyCommunalAreaAlerts(records);
        const inst = alerts.filter((a) => a.type === "institutional");
        expect(inst).toHaveLength(0);
      });

      it("does not fire for not_assessed rating", () => {
        const records = [makeRecord({ homeliness_rating: "not_assessed" })];
        const alerts = identifyCommunalAreaAlerts(records);
        const inst = alerts.filter((a) => a.type === "institutional");
        expect(inst).toHaveLength(0);
      });
    });

    describe("unacceptable_cleanliness alert", () => {
      it("fires when 1 area has unacceptable cleanliness (threshold >= 1)", () => {
        const records = [
          makeRecord({ cleanliness_rating: "unacceptable" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const unacc = alerts.filter((a) => a.type === "unacceptable_cleanliness");
        expect(unacc).toHaveLength(1);
      });

      it("has high severity", () => {
        const records = [
          makeRecord({ cleanliness_rating: "unacceptable" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const unacc = alerts.find((a) => a.type === "unacceptable_cleanliness");
        expect(unacc!.severity).toBe("high");
      });

      it("uses singular message for 1 area", () => {
        const records = [
          makeRecord({ cleanliness_rating: "unacceptable" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const unacc = alerts.find((a) => a.type === "unacceptable_cleanliness");
        expect(unacc!.message).toContain("area has");
      });

      it("uses plural message for 2 areas", () => {
        const records = [
          makeRecord({ cleanliness_rating: "unacceptable" }),
          makeRecord({ cleanliness_rating: "unacceptable" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const unacc = alerts.find((a) => a.type === "unacceptable_cleanliness");
        expect(unacc!.message).toContain("areas have");
      });

      it("includes count in message", () => {
        const records = [
          makeRecord({ cleanliness_rating: "unacceptable" }),
          makeRecord({ cleanliness_rating: "unacceptable" }),
          makeRecord({ cleanliness_rating: "unacceptable" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const unacc = alerts.find((a) => a.type === "unacceptable_cleanliness");
        expect(unacc!.message).toContain("3");
      });

      it("has id = 'unacceptable_cleanliness'", () => {
        const records = [
          makeRecord({ cleanliness_rating: "unacceptable" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const unacc = alerts.find((a) => a.type === "unacceptable_cleanliness");
        expect(unacc!.id).toBe("unacceptable_cleanliness");
      });

      it("does not fire when no areas are unacceptable", () => {
        const records = [
          makeRecord({ cleanliness_rating: "clean" }),
          makeRecord({ cleanliness_rating: "needs_attention" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const unacc = alerts.filter((a) => a.type === "unacceptable_cleanliness");
        expect(unacc).toHaveLength(0);
      });

      it("does not fire for needs_attention", () => {
        const records = [
          makeRecord({ cleanliness_rating: "needs_attention" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const unacc = alerts.filter((a) => a.type === "unacceptable_cleanliness");
        expect(unacc).toHaveLength(0);
      });

      it("produces exactly one alert regardless of count", () => {
        const records = [
          makeRecord({ cleanliness_rating: "unacceptable" }),
          makeRecord({ cleanliness_rating: "unacceptable" }),
          makeRecord({ cleanliness_rating: "unacceptable" }),
          makeRecord({ cleanliness_rating: "unacceptable" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const unacc = alerts.filter((a) => a.type === "unacceptable_cleanliness");
        expect(unacc).toHaveLength(1);
      });
    });

    describe("fire_exits_blocked alert", () => {
      it("fires when 1 area has blocked fire exits (threshold >= 1)", () => {
        const records = [
          makeRecord({ fire_exits_clear: false }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const blocked = alerts.filter((a) => a.type === "fire_exits_blocked");
        expect(blocked).toHaveLength(1);
      });

      it("has high severity", () => {
        const records = [
          makeRecord({ fire_exits_clear: false }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const blocked = alerts.find((a) => a.type === "fire_exits_blocked");
        expect(blocked!.severity).toBe("high");
      });

      it("uses singular message for 1 area", () => {
        const records = [
          makeRecord({ fire_exits_clear: false }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const blocked = alerts.find((a) => a.type === "fire_exits_blocked");
        expect(blocked!.message).toContain("area has");
      });

      it("uses plural message for 2 areas", () => {
        const records = [
          makeRecord({ fire_exits_clear: false }),
          makeRecord({ fire_exits_clear: false }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const blocked = alerts.find((a) => a.type === "fire_exits_blocked");
        expect(blocked!.message).toContain("areas have");
      });

      it("includes count in message", () => {
        const records = [
          makeRecord({ fire_exits_clear: false }),
          makeRecord({ fire_exits_clear: false }),
          makeRecord({ fire_exits_clear: false }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const blocked = alerts.find((a) => a.type === "fire_exits_blocked");
        expect(blocked!.message).toContain("3");
      });

      it("has id = 'fire_exits_blocked'", () => {
        const records = [
          makeRecord({ fire_exits_clear: false }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const blocked = alerts.find((a) => a.type === "fire_exits_blocked");
        expect(blocked!.id).toBe("fire_exits_blocked");
      });

      it("does not fire when all fire exits are clear", () => {
        const records = [
          makeRecord({ fire_exits_clear: true }),
          makeRecord({ fire_exits_clear: true }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const blocked = alerts.filter((a) => a.type === "fire_exits_blocked");
        expect(blocked).toHaveLength(0);
      });

      it("produces exactly one alert regardless of count", () => {
        const records = [
          makeRecord({ fire_exits_clear: false }),
          makeRecord({ fire_exits_clear: false }),
          makeRecord({ fire_exits_clear: false }),
          makeRecord({ fire_exits_clear: false }),
          makeRecord({ fire_exits_clear: false }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const blocked = alerts.filter((a) => a.type === "fire_exits_blocked");
        expect(blocked).toHaveLength(1);
      });
    });

    describe("audit_overdue alert", () => {
      it("fires when 1 audit is overdue (threshold >= 1)", () => {
        const records = [
          makeRecord({ next_audit_date: daysAgo(5) }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const overdue = alerts.filter((a) => a.type === "audit_overdue");
        expect(overdue).toHaveLength(1);
      });

      it("has medium severity", () => {
        const records = [
          makeRecord({ next_audit_date: daysAgo(5) }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const overdue = alerts.find((a) => a.type === "audit_overdue");
        expect(overdue!.severity).toBe("medium");
      });

      it("uses singular message for 1 overdue audit", () => {
        const records = [
          makeRecord({ next_audit_date: daysAgo(5) }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const overdue = alerts.find((a) => a.type === "audit_overdue");
        expect(overdue!.message).toContain("audit is");
      });

      it("uses plural message for 2 overdue audits", () => {
        const records = [
          makeRecord({ next_audit_date: daysAgo(5) }),
          makeRecord({ next_audit_date: daysAgo(10) }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const overdue = alerts.find((a) => a.type === "audit_overdue");
        expect(overdue!.message).toContain("audits are");
      });

      it("includes count in message", () => {
        const records = [
          makeRecord({ next_audit_date: daysAgo(1) }),
          makeRecord({ next_audit_date: daysAgo(2) }),
          makeRecord({ next_audit_date: daysAgo(3) }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const overdue = alerts.find((a) => a.type === "audit_overdue");
        expect(overdue!.message).toContain("3");
      });

      it("has id = 'audit_overdue'", () => {
        const records = [
          makeRecord({ next_audit_date: daysAgo(5) }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const overdue = alerts.find((a) => a.type === "audit_overdue");
        expect(overdue!.id).toBe("audit_overdue");
      });

      it("does not fire when no audits are overdue", () => {
        const records = [
          makeRecord({ next_audit_date: daysFromNow(5) }),
          makeRecord({ next_audit_date: daysFromNow(10) }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const overdue = alerts.filter((a) => a.type === "audit_overdue");
        expect(overdue).toHaveLength(0);
      });

      it("does not fire when all next_audit_date are null", () => {
        const records = [
          makeRecord({ next_audit_date: null }),
          makeRecord({ next_audit_date: null }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const overdue = alerts.filter((a) => a.type === "audit_overdue");
        expect(overdue).toHaveLength(0);
      });

      it("only counts past dates, not future or null", () => {
        const records = [
          makeRecord({ next_audit_date: daysAgo(5) }),
          makeRecord({ next_audit_date: daysFromNow(5) }),
          makeRecord({ next_audit_date: null }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
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
        const alerts = identifyCommunalAreaAlerts(records);
        const overdue = alerts.filter((a) => a.type === "audit_overdue");
        expect(overdue).toHaveLength(1);
      });
    });

    describe("combined alerts", () => {
      it("fires multiple alert types simultaneously", () => {
        const records = [
          makeRecord({ id: "r1", safety_check: "immediate_risk", area_type: "lounge", audit_date: "2026-05-01", homeliness_rating: "institutional", cleanliness_rating: "unacceptable", fire_exits_clear: false, next_audit_date: daysAgo(5) }),
          makeRecord({ id: "r2", safety_check: "immediate_risk", area_type: "kitchen", audit_date: "2026-05-02", homeliness_rating: "institutional", cleanliness_rating: "unacceptable", fire_exits_clear: false, next_audit_date: daysAgo(10) }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const types = new Set(alerts.map((a) => a.type));
        expect(types.has("immediate_risk")).toBe(true);
        expect(types.has("institutional")).toBe(true);
        expect(types.has("unacceptable_cleanliness")).toBe(true);
        expect(types.has("fire_exits_blocked")).toBe(true);
        expect(types.has("audit_overdue")).toBe(true);
      });

      it("immediate_risk alerts appear before institutional alerts", () => {
        const records = [
          makeRecord({ id: "r1", safety_check: "immediate_risk", area_type: "lounge", audit_date: "2026-05-01", homeliness_rating: "institutional" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const riskIdx = alerts.findIndex((a) => a.type === "immediate_risk");
        const instIdx = alerts.findIndex((a) => a.type === "institutional");
        expect(riskIdx).toBeLessThan(instIdx);
      });

      it("critical alerts appear before high alerts", () => {
        const records = [
          makeRecord({ id: "r1", safety_check: "immediate_risk", area_type: "lounge", audit_date: "2026-05-01", homeliness_rating: "institutional", cleanliness_rating: "unacceptable" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const criticalIdx = alerts.findIndex((a) => a.severity === "critical");
        const highIdxes = alerts.map((a, i) => a.severity === "high" ? i : -1).filter((i) => i >= 0);
        for (const hi of highIdxes) {
          expect(criticalIdx).toBeLessThan(hi);
        }
      });

      it("high alerts appear before medium alerts", () => {
        const records = [
          makeRecord({ id: "r1", homeliness_rating: "institutional", area_type: "lounge", audit_date: "2026-05-01", cleanliness_rating: "unacceptable", fire_exits_clear: false, next_audit_date: daysAgo(5) }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
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
          makeRecord({ safety_check: "all_clear", homeliness_rating: "homely", cleanliness_rating: "clean", fire_exits_clear: true, next_audit_date: daysFromNow(30) }),
          makeRecord({ safety_check: "all_clear", homeliness_rating: "very_homely", cleanliness_rating: "spotless", fire_exits_clear: true, next_audit_date: daysFromNow(60) }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        expect(alerts).toHaveLength(0);
      });
    });

    describe("edge cases", () => {
      it("exactly at threshold: 1 unacceptable triggers alert", () => {
        const records = [
          makeRecord({ cleanliness_rating: "unacceptable" }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const unacc = alerts.filter((a) => a.type === "unacceptable_cleanliness");
        expect(unacc).toHaveLength(1);
      });

      it("exactly at threshold: 1 blocked fire exit triggers alert", () => {
        const records = [
          makeRecord({ fire_exits_clear: false }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const blocked = alerts.filter((a) => a.type === "fire_exits_blocked");
        expect(blocked).toHaveLength(1);
      });

      it("exactly at threshold: 1 overdue audit triggers alert", () => {
        const records = [
          makeRecord({ next_audit_date: daysAgo(1) }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const overdue = alerts.filter((a) => a.type === "audit_overdue");
        expect(overdue).toHaveLength(1);
      });

      it("no immediate_risk and no institutional produces no per-record alerts", () => {
        const records = [
          makeRecord({ safety_check: "all_clear", homeliness_rating: "homely", cleanliness_rating: "clean", fire_exits_clear: true }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const perRecord = alerts.filter((a) => a.type === "immediate_risk" || a.type === "institutional");
        expect(perRecord).toHaveLength(0);
      });

      it("single record triggering all 5 alert types", () => {
        const records = [
          makeRecord({ id: "r1", safety_check: "immediate_risk", area_type: "lounge", audit_date: "2026-05-01", homeliness_rating: "institutional", cleanliness_rating: "unacceptable", fire_exits_clear: false, next_audit_date: daysAgo(5) }),
        ];
        const alerts = identifyCommunalAreaAlerts(records);
        const types = new Set(alerts.map((a) => a.type));
        expect(types.size).toBe(5);
        expect(types.has("immediate_risk")).toBe(true);
        expect(types.has("institutional")).toBe(true);
        expect(types.has("unacceptable_cleanliness")).toBe(true);
        expect(types.has("fire_exits_blocked")).toBe(true);
        expect(types.has("audit_overdue")).toBe(true);
      });
    });
  });
});
