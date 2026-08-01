// ══════════════════════════════════════════════════════════════════════════════
// CARA — CCTV & SURVEILLANCE SERVICE TESTS
// Pure-function unit tests for CCTV metrics computation, alert
// identification, and constant validation.
// CHR 2015 Reg 36 (fitness of premises — surveillance),
// Reg 12 (protection — safeguarding evidence),
// ICO CCTV Code of Practice, GDPR Article 6.
//
// Covers: camera locations, recording schedules, data retention,
// access requests, footage reviews, and privacy compliance.
//
// SCCIF: Helped & Protected — "CCTV is used proportionately
// and in line with data protection law."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest";
import crypto from "crypto";

vi.mock("@/lib/supabase/server", () => ({
  isSupabaseEnabled: () => false,
  createServerClient: () => null,
}));

import {
  _testing,
  CCTV_EVENT_TYPES,
  CAMERA_LOCATIONS,
  COMPLIANCE_STATUSES,
  RETENTION_STATUSES,
} from "../cctv-surveillance-service";

import type { CctvRecord } from "../cctv-surveillance-service";

const { computeCctvMetrics, identifyCctvAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

/** Build a minimal CctvRecord with sensible defaults. */
function makeRecord(overrides: Partial<CctvRecord> = {}): CctvRecord {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    event_type: "system_check",
    event_date: "2024-06-01",
    camera_location: "entrance",
    compliance_status: "compliant",
    retention_status: "within_schedule",
    gdpr_compliant: true,
    signage_visible: true,
    children_informed: true,
    staff_informed: true,
    footage_accessed: false,
    accessed_by:
      "accessed_by" in (overrides ?? {})
        ? (overrides!.accessed_by ?? null)
        : null,
    access_reason:
      "access_reason" in (overrides ?? {})
        ? (overrides!.access_reason ?? null)
        : null,
    privacy_impact_completed: true,
    data_protection_officer_consulted: false,
    issues_found: [],
    actions_taken: [],
    reviewed_by: "Officer Smith",
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

describe("CCTV_EVENT_TYPES", () => {
  it("has exactly 9 entries", () => {
    expect(CCTV_EVENT_TYPES).toHaveLength(9);
  });

  it("contains unique type values", () => {
    const values = CCTV_EVENT_TYPES.map((e) => e.type);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = CCTV_EVENT_TYPES.map((e) => e.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const e of CCTV_EVENT_TYPES) {
      expect(e.label.length).toBeGreaterThan(0);
    }
  });

  it("includes system_check", () => {
    expect(CCTV_EVENT_TYPES.find((e) => e.type === "system_check")).toBeTruthy();
  });

  it("includes footage_review", () => {
    expect(CCTV_EVENT_TYPES.find((e) => e.type === "footage_review")).toBeTruthy();
  });

  it("includes access_request", () => {
    expect(CCTV_EVENT_TYPES.find((e) => e.type === "access_request")).toBeTruthy();
  });

  it("includes retention_review", () => {
    expect(CCTV_EVENT_TYPES.find((e) => e.type === "retention_review")).toBeTruthy();
  });

  it("includes privacy_impact_assessment", () => {
    expect(CCTV_EVENT_TYPES.find((e) => e.type === "privacy_impact_assessment")).toBeTruthy();
  });

  it("includes signage_check", () => {
    expect(CCTV_EVENT_TYPES.find((e) => e.type === "signage_check")).toBeTruthy();
  });

  it("includes data_breach", () => {
    expect(CCTV_EVENT_TYPES.find((e) => e.type === "data_breach")).toBeTruthy();
  });

  it("includes maintenance", () => {
    expect(CCTV_EVENT_TYPES.find((e) => e.type === "maintenance")).toBeTruthy();
  });

  it("includes other", () => {
    expect(CCTV_EVENT_TYPES.find((e) => e.type === "other")).toBeTruthy();
  });
});

describe("CAMERA_LOCATIONS", () => {
  it("has exactly 9 entries", () => {
    expect(CAMERA_LOCATIONS).toHaveLength(9);
  });

  it("contains unique location values", () => {
    const values = CAMERA_LOCATIONS.map((l) => l.location);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = CAMERA_LOCATIONS.map((l) => l.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const l of CAMERA_LOCATIONS) {
      expect(l.label.length).toBeGreaterThan(0);
    }
  });

  it("includes entrance", () => {
    expect(CAMERA_LOCATIONS.find((l) => l.location === "entrance")).toBeTruthy();
  });

  it("includes exit", () => {
    expect(CAMERA_LOCATIONS.find((l) => l.location === "exit")).toBeTruthy();
  });

  it("includes communal_area", () => {
    expect(CAMERA_LOCATIONS.find((l) => l.location === "communal_area")).toBeTruthy();
  });

  it("includes garden", () => {
    expect(CAMERA_LOCATIONS.find((l) => l.location === "garden")).toBeTruthy();
  });

  it("includes car_park", () => {
    expect(CAMERA_LOCATIONS.find((l) => l.location === "car_park")).toBeTruthy();
  });

  it("includes corridor", () => {
    expect(CAMERA_LOCATIONS.find((l) => l.location === "corridor")).toBeTruthy();
  });

  it("includes kitchen", () => {
    expect(CAMERA_LOCATIONS.find((l) => l.location === "kitchen")).toBeTruthy();
  });

  it("includes office", () => {
    expect(CAMERA_LOCATIONS.find((l) => l.location === "office")).toBeTruthy();
  });

  it("includes other", () => {
    expect(CAMERA_LOCATIONS.find((l) => l.location === "other")).toBeTruthy();
  });
});

describe("COMPLIANCE_STATUSES", () => {
  it("has exactly 4 entries", () => {
    expect(COMPLIANCE_STATUSES).toHaveLength(4);
  });

  it("contains unique status values", () => {
    const values = COMPLIANCE_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = COMPLIANCE_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const s of COMPLIANCE_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
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

  it("includes not_assessed", () => {
    expect(COMPLIANCE_STATUSES.find((s) => s.status === "not_assessed")).toBeTruthy();
  });
});

describe("RETENTION_STATUSES", () => {
  it("has exactly 4 entries", () => {
    expect(RETENTION_STATUSES).toHaveLength(4);
  });

  it("contains unique status values", () => {
    const values = RETENTION_STATUSES.map((s) => s.status);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = RETENTION_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const s of RETENTION_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("includes within_schedule", () => {
    expect(RETENTION_STATUSES.find((s) => s.status === "within_schedule")).toBeTruthy();
  });

  it("includes overdue_deletion", () => {
    expect(RETENTION_STATUSES.find((s) => s.status === "overdue_deletion")).toBeTruthy();
  });

  it("includes extended_retention", () => {
    expect(RETENTION_STATUSES.find((s) => s.status === "extended_retention")).toBeTruthy();
  });

  it("includes not_checked", () => {
    expect(RETENTION_STATUSES.find((s) => s.status === "not_checked")).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeCctvMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeCctvMetrics", () => {
  // ── Empty array ──────────────────────────────────────────────────────
  describe("empty records", () => {
    it("returns zero total_records", () => {
      expect(computeCctvMetrics([]).total_records).toBe(0);
    });

    it("returns zero system_check_count", () => {
      expect(computeCctvMetrics([]).system_check_count).toBe(0);
    });

    it("returns zero footage_review_count", () => {
      expect(computeCctvMetrics([]).footage_review_count).toBe(0);
    });

    it("returns zero access_request_count", () => {
      expect(computeCctvMetrics([]).access_request_count).toBe(0);
    });

    it("returns zero data_breach_count", () => {
      expect(computeCctvMetrics([]).data_breach_count).toBe(0);
    });

    it("returns zero compliant_rate", () => {
      expect(computeCctvMetrics([]).compliant_rate).toBeNull();;
    });

    it("returns zero non_compliant_count", () => {
      expect(computeCctvMetrics([]).non_compliant_count).toBe(0);
    });

    it("returns zero gdpr_compliant_rate", () => {
      expect(computeCctvMetrics([]).gdpr_compliant_rate).toBeNull();;
    });

    it("returns zero signage_visible_rate", () => {
      expect(computeCctvMetrics([]).signage_visible_rate).toBeNull();;
    });

    it("returns zero children_informed_rate", () => {
      expect(computeCctvMetrics([]).children_informed_rate).toBeNull();;
    });

    it("returns zero staff_informed_rate", () => {
      expect(computeCctvMetrics([]).staff_informed_rate).toBeNull();;
    });

    it("returns zero privacy_impact_completed_rate", () => {
      expect(computeCctvMetrics([]).privacy_impact_completed_rate).toBeNull();;
    });

    it("returns zero overdue_deletion_count", () => {
      expect(computeCctvMetrics([]).overdue_deletion_count).toBe(0);
    });

    it("returns zero review_overdue_count", () => {
      expect(computeCctvMetrics([]).review_overdue_count).toBe(0);
    });

    it("returns empty by_event_type", () => {
      expect(computeCctvMetrics([]).by_event_type).toEqual({});
    });

    it("returns empty by_camera_location", () => {
      expect(computeCctvMetrics([]).by_camera_location).toEqual({});
    });

    it("returns empty by_compliance_status", () => {
      expect(computeCctvMetrics([]).by_compliance_status).toEqual({});
    });

    it("returns empty by_retention_status", () => {
      expect(computeCctvMetrics([]).by_retention_status).toEqual({});
    });
  });

  // ── Single record ──────────────────────────────────────────────────
  describe("single record", () => {
    const single = [makeRecord()];

    it("total_records is 1", () => {
      expect(computeCctvMetrics(single).total_records).toBe(1);
    });

    it("system_check_count is 1 for system_check event", () => {
      expect(computeCctvMetrics(single).system_check_count).toBe(1);
    });

    it("footage_review_count is 0 for system_check event", () => {
      expect(computeCctvMetrics(single).footage_review_count).toBe(0);
    });

    it("access_request_count is 0 for system_check event", () => {
      expect(computeCctvMetrics(single).access_request_count).toBe(0);
    });

    it("data_breach_count is 0 for system_check event", () => {
      expect(computeCctvMetrics(single).data_breach_count).toBe(0);
    });

    it("compliant_rate is 100 for compliant record", () => {
      expect(computeCctvMetrics(single).compliant_rate).toBe(100);
    });

    it("non_compliant_count is 0 for compliant record", () => {
      expect(computeCctvMetrics(single).non_compliant_count).toBe(0);
    });

    it("gdpr_compliant_rate is 100 when gdpr_compliant is true", () => {
      expect(computeCctvMetrics(single).gdpr_compliant_rate).toBe(100);
    });

    it("signage_visible_rate is 100 when signage_visible is true", () => {
      expect(computeCctvMetrics(single).signage_visible_rate).toBe(100);
    });

    it("children_informed_rate is 100 when children_informed is true", () => {
      expect(computeCctvMetrics(single).children_informed_rate).toBe(100);
    });

    it("staff_informed_rate is 100 when staff_informed is true", () => {
      expect(computeCctvMetrics(single).staff_informed_rate).toBe(100);
    });

    it("privacy_impact_completed_rate is 100 when privacy_impact_completed is true", () => {
      expect(computeCctvMetrics(single).privacy_impact_completed_rate).toBe(100);
    });

    it("overdue_deletion_count is 0 for within_schedule record", () => {
      expect(computeCctvMetrics(single).overdue_deletion_count).toBe(0);
    });

    it("review_overdue_count is 0 when next_review_date is null", () => {
      expect(computeCctvMetrics(single).review_overdue_count).toBe(0);
    });

    it("by_event_type groups single record correctly", () => {
      expect(computeCctvMetrics(single).by_event_type).toEqual({ system_check: 1 });
    });

    it("by_camera_location groups single record correctly", () => {
      expect(computeCctvMetrics(single).by_camera_location).toEqual({ entrance: 1 });
    });

    it("by_compliance_status groups single record correctly", () => {
      expect(computeCctvMetrics(single).by_compliance_status).toEqual({ compliant: 1 });
    });

    it("by_retention_status groups single record correctly", () => {
      expect(computeCctvMetrics(single).by_retention_status).toEqual({ within_schedule: 1 });
    });

    it("footage_review_count is 1 for footage_review event", () => {
      const r = [makeRecord({ event_type: "footage_review" })];
      expect(computeCctvMetrics(r).footage_review_count).toBe(1);
    });

    it("access_request_count is 1 for access_request event", () => {
      const r = [makeRecord({ event_type: "access_request" })];
      expect(computeCctvMetrics(r).access_request_count).toBe(1);
    });

    it("data_breach_count is 1 for data_breach event", () => {
      const r = [makeRecord({ event_type: "data_breach" })];
      expect(computeCctvMetrics(r).data_breach_count).toBe(1);
    });
  });

  // ── Multiple records ─────────────────────────────────────────────────
  describe("multiple records", () => {
    const records = [
      makeRecord({
        id: "r-1",
        event_type: "system_check",
        camera_location: "entrance",
        compliance_status: "compliant",
        retention_status: "within_schedule",
        gdpr_compliant: true,
        signage_visible: true,
        children_informed: true,
        staff_informed: true,
        privacy_impact_completed: true,
      }),
      makeRecord({
        id: "r-2",
        event_type: "footage_review",
        camera_location: "communal_area",
        compliance_status: "non_compliant",
        retention_status: "overdue_deletion",
        gdpr_compliant: false,
        signage_visible: false,
        children_informed: false,
        staff_informed: false,
        privacy_impact_completed: false,
      }),
      makeRecord({
        id: "r-3",
        event_type: "access_request",
        camera_location: "car_park",
        compliance_status: "partially_compliant",
        retention_status: "extended_retention",
        gdpr_compliant: true,
        signage_visible: true,
        children_informed: true,
        staff_informed: false,
        privacy_impact_completed: true,
      }),
      makeRecord({
        id: "r-4",
        event_type: "data_breach",
        camera_location: "office",
        compliance_status: "compliant",
        retention_status: "not_checked",
        gdpr_compliant: true,
        signage_visible: false,
        children_informed: false,
        staff_informed: true,
        privacy_impact_completed: false,
      }),
      makeRecord({
        id: "r-5",
        event_type: "system_check",
        camera_location: "entrance",
        compliance_status: "not_assessed",
        retention_status: "within_schedule",
        gdpr_compliant: false,
        signage_visible: true,
        children_informed: true,
        staff_informed: true,
        privacy_impact_completed: true,
      }),
    ];

    it("total_records is 5", () => {
      expect(computeCctvMetrics(records).total_records).toBe(5);
    });

    it("system_check_count is 2", () => {
      expect(computeCctvMetrics(records).system_check_count).toBe(2);
    });

    it("footage_review_count is 1", () => {
      expect(computeCctvMetrics(records).footage_review_count).toBe(1);
    });

    it("access_request_count is 1", () => {
      expect(computeCctvMetrics(records).access_request_count).toBe(1);
    });

    it("data_breach_count is 1", () => {
      expect(computeCctvMetrics(records).data_breach_count).toBe(1);
    });

    it("compliant_rate is 40 (2 of 5)", () => {
      expect(computeCctvMetrics(records).compliant_rate).toBe(40);
    });

    it("non_compliant_count is 1", () => {
      expect(computeCctvMetrics(records).non_compliant_count).toBe(1);
    });

    it("gdpr_compliant_rate is 60 (3 of 5)", () => {
      expect(computeCctvMetrics(records).gdpr_compliant_rate).toBe(60);
    });

    it("signage_visible_rate is 60 (3 of 5)", () => {
      expect(computeCctvMetrics(records).signage_visible_rate).toBe(60);
    });

    it("children_informed_rate is 60 (3 of 5)", () => {
      expect(computeCctvMetrics(records).children_informed_rate).toBe(60);
    });

    it("staff_informed_rate is 60 (3 of 5)", () => {
      expect(computeCctvMetrics(records).staff_informed_rate).toBe(60);
    });

    it("privacy_impact_completed_rate is 60 (3 of 5)", () => {
      expect(computeCctvMetrics(records).privacy_impact_completed_rate).toBe(60);
    });

    it("overdue_deletion_count is 1", () => {
      expect(computeCctvMetrics(records).overdue_deletion_count).toBe(1);
    });

    it("by_event_type groups correctly", () => {
      expect(computeCctvMetrics(records).by_event_type).toEqual({
        system_check: 2,
        footage_review: 1,
        access_request: 1,
        data_breach: 1,
      });
    });

    it("by_camera_location groups correctly", () => {
      expect(computeCctvMetrics(records).by_camera_location).toEqual({
        entrance: 2,
        communal_area: 1,
        car_park: 1,
        office: 1,
      });
    });

    it("by_compliance_status groups correctly", () => {
      expect(computeCctvMetrics(records).by_compliance_status).toEqual({
        compliant: 2,
        non_compliant: 1,
        partially_compliant: 1,
        not_assessed: 1,
      });
    });

    it("by_retention_status groups correctly", () => {
      expect(computeCctvMetrics(records).by_retention_status).toEqual({
        within_schedule: 2,
        overdue_deletion: 1,
        extended_retention: 1,
        not_checked: 1,
      });
    });
  });

  // ── compliant_rate ──────────────────────────────────────────────────
  describe("compliant_rate", () => {
    it("is 100 when all records are compliant", () => {
      const r = [
        makeRecord({ id: "1", compliance_status: "compliant" }),
        makeRecord({ id: "2", compliance_status: "compliant" }),
      ];
      expect(computeCctvMetrics(r).compliant_rate).toBe(100);
    });

    it("is 0 when no records are compliant", () => {
      const r = [
        makeRecord({ id: "1", compliance_status: "non_compliant" }),
        makeRecord({ id: "2", compliance_status: "partially_compliant" }),
      ];
      expect(computeCctvMetrics(r).compliant_rate).toBe(0);
    });

    it("is 50 for 1 of 2 compliant", () => {
      const r = [
        makeRecord({ id: "1", compliance_status: "compliant" }),
        makeRecord({ id: "2", compliance_status: "non_compliant" }),
      ];
      expect(computeCctvMetrics(r).compliant_rate).toBe(50);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const r = [
        makeRecord({ id: "1", compliance_status: "compliant" }),
        makeRecord({ id: "2", compliance_status: "non_compliant" }),
        makeRecord({ id: "3", compliance_status: "partially_compliant" }),
      ];
      expect(computeCctvMetrics(r).compliant_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const r = [
        makeRecord({ id: "1", compliance_status: "compliant" }),
        makeRecord({ id: "2", compliance_status: "compliant" }),
        makeRecord({ id: "3", compliance_status: "non_compliant" }),
      ];
      expect(computeCctvMetrics(r).compliant_rate).toBe(66.7);
    });
  });

  // ── non_compliant_count ─────────────────────────────────────────────
  describe("non_compliant_count", () => {
    it("counts all non_compliant records", () => {
      const r = [
        makeRecord({ id: "1", compliance_status: "non_compliant" }),
        makeRecord({ id: "2", compliance_status: "non_compliant" }),
        makeRecord({ id: "3", compliance_status: "compliant" }),
      ];
      expect(computeCctvMetrics(r).non_compliant_count).toBe(2);
    });

    it("is 0 when none are non_compliant", () => {
      const r = [
        makeRecord({ id: "1", compliance_status: "compliant" }),
        makeRecord({ id: "2", compliance_status: "partially_compliant" }),
      ];
      expect(computeCctvMetrics(r).non_compliant_count).toBe(0);
    });

    it("does not count partially_compliant as non_compliant", () => {
      const r = [
        makeRecord({ id: "1", compliance_status: "partially_compliant" }),
      ];
      expect(computeCctvMetrics(r).non_compliant_count).toBe(0);
    });

    it("does not count not_assessed as non_compliant", () => {
      const r = [
        makeRecord({ id: "1", compliance_status: "not_assessed" }),
      ];
      expect(computeCctvMetrics(r).non_compliant_count).toBe(0);
    });
  });

  // ── gdpr_compliant_rate ─────────────────────────────────────────────
  describe("gdpr_compliant_rate", () => {
    it("is 100 when all are gdpr_compliant", () => {
      const r = [
        makeRecord({ id: "1", gdpr_compliant: true }),
        makeRecord({ id: "2", gdpr_compliant: true }),
      ];
      expect(computeCctvMetrics(r).gdpr_compliant_rate).toBe(100);
    });

    it("is 0 when none are gdpr_compliant", () => {
      const r = [
        makeRecord({ id: "1", gdpr_compliant: false }),
        makeRecord({ id: "2", gdpr_compliant: false }),
      ];
      expect(computeCctvMetrics(r).gdpr_compliant_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const r = [
        makeRecord({ id: "1", gdpr_compliant: true }),
        makeRecord({ id: "2", gdpr_compliant: false }),
        makeRecord({ id: "3", gdpr_compliant: false }),
      ];
      expect(computeCctvMetrics(r).gdpr_compliant_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const r = [
        makeRecord({ id: "1", gdpr_compliant: true }),
        makeRecord({ id: "2", gdpr_compliant: true }),
        makeRecord({ id: "3", gdpr_compliant: false }),
      ];
      expect(computeCctvMetrics(r).gdpr_compliant_rate).toBe(66.7);
    });
  });

  // ── signage_visible_rate ────────────────────────────────────────────
  describe("signage_visible_rate", () => {
    it("is 100 when all have signage_visible", () => {
      const r = [
        makeRecord({ id: "1", signage_visible: true }),
        makeRecord({ id: "2", signage_visible: true }),
      ];
      expect(computeCctvMetrics(r).signage_visible_rate).toBe(100);
    });

    it("is 0 when none have signage_visible", () => {
      const r = [
        makeRecord({ id: "1", signage_visible: false }),
        makeRecord({ id: "2", signage_visible: false }),
      ];
      expect(computeCctvMetrics(r).signage_visible_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const r = [
        makeRecord({ id: "1", signage_visible: true }),
        makeRecord({ id: "2", signage_visible: false }),
        makeRecord({ id: "3", signage_visible: false }),
      ];
      expect(computeCctvMetrics(r).signage_visible_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const r = [
        makeRecord({ id: "1", signage_visible: true }),
        makeRecord({ id: "2", signage_visible: true }),
        makeRecord({ id: "3", signage_visible: false }),
      ];
      expect(computeCctvMetrics(r).signage_visible_rate).toBe(66.7);
    });
  });

  // ── children_informed_rate ──────────────────────────────────────────
  describe("children_informed_rate", () => {
    it("is 100 when all have children_informed", () => {
      const r = [
        makeRecord({ id: "1", children_informed: true }),
        makeRecord({ id: "2", children_informed: true }),
      ];
      expect(computeCctvMetrics(r).children_informed_rate).toBe(100);
    });

    it("is 0 when none have children_informed", () => {
      const r = [
        makeRecord({ id: "1", children_informed: false }),
        makeRecord({ id: "2", children_informed: false }),
      ];
      expect(computeCctvMetrics(r).children_informed_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const r = [
        makeRecord({ id: "1", children_informed: true }),
        makeRecord({ id: "2", children_informed: false }),
        makeRecord({ id: "3", children_informed: false }),
      ];
      expect(computeCctvMetrics(r).children_informed_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const r = [
        makeRecord({ id: "1", children_informed: true }),
        makeRecord({ id: "2", children_informed: true }),
        makeRecord({ id: "3", children_informed: false }),
      ];
      expect(computeCctvMetrics(r).children_informed_rate).toBe(66.7);
    });
  });

  // ── staff_informed_rate ─────────────────────────────────────────────
  describe("staff_informed_rate", () => {
    it("is 100 when all have staff_informed", () => {
      const r = [
        makeRecord({ id: "1", staff_informed: true }),
        makeRecord({ id: "2", staff_informed: true }),
      ];
      expect(computeCctvMetrics(r).staff_informed_rate).toBe(100);
    });

    it("is 0 when none have staff_informed", () => {
      const r = [
        makeRecord({ id: "1", staff_informed: false }),
        makeRecord({ id: "2", staff_informed: false }),
      ];
      expect(computeCctvMetrics(r).staff_informed_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const r = [
        makeRecord({ id: "1", staff_informed: true }),
        makeRecord({ id: "2", staff_informed: false }),
        makeRecord({ id: "3", staff_informed: false }),
      ];
      expect(computeCctvMetrics(r).staff_informed_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const r = [
        makeRecord({ id: "1", staff_informed: true }),
        makeRecord({ id: "2", staff_informed: true }),
        makeRecord({ id: "3", staff_informed: false }),
      ];
      expect(computeCctvMetrics(r).staff_informed_rate).toBe(66.7);
    });
  });

  // ── privacy_impact_completed_rate ───────────────────────────────────
  describe("privacy_impact_completed_rate", () => {
    it("is 100 when all have privacy_impact_completed", () => {
      const r = [
        makeRecord({ id: "1", privacy_impact_completed: true }),
        makeRecord({ id: "2", privacy_impact_completed: true }),
      ];
      expect(computeCctvMetrics(r).privacy_impact_completed_rate).toBe(100);
    });

    it("is 0 when none have privacy_impact_completed", () => {
      const r = [
        makeRecord({ id: "1", privacy_impact_completed: false }),
        makeRecord({ id: "2", privacy_impact_completed: false }),
      ];
      expect(computeCctvMetrics(r).privacy_impact_completed_rate).toBe(0);
    });

    it("rounds correctly for 1 of 3 (33.3)", () => {
      const r = [
        makeRecord({ id: "1", privacy_impact_completed: true }),
        makeRecord({ id: "2", privacy_impact_completed: false }),
        makeRecord({ id: "3", privacy_impact_completed: false }),
      ];
      expect(computeCctvMetrics(r).privacy_impact_completed_rate).toBe(33.3);
    });

    it("rounds correctly for 2 of 3 (66.7)", () => {
      const r = [
        makeRecord({ id: "1", privacy_impact_completed: true }),
        makeRecord({ id: "2", privacy_impact_completed: true }),
        makeRecord({ id: "3", privacy_impact_completed: false }),
      ];
      expect(computeCctvMetrics(r).privacy_impact_completed_rate).toBe(66.7);
    });
  });

  // ── overdue_deletion_count ──────────────────────────────────────────
  describe("overdue_deletion_count", () => {
    it("counts all overdue_deletion records", () => {
      const r = [
        makeRecord({ id: "1", retention_status: "overdue_deletion" }),
        makeRecord({ id: "2", retention_status: "overdue_deletion" }),
        makeRecord({ id: "3", retention_status: "within_schedule" }),
      ];
      expect(computeCctvMetrics(r).overdue_deletion_count).toBe(2);
    });

    it("is 0 when none are overdue_deletion", () => {
      const r = [
        makeRecord({ id: "1", retention_status: "within_schedule" }),
        makeRecord({ id: "2", retention_status: "extended_retention" }),
      ];
      expect(computeCctvMetrics(r).overdue_deletion_count).toBe(0);
    });

    it("does not count extended_retention as overdue", () => {
      const r = [
        makeRecord({ id: "1", retention_status: "extended_retention" }),
      ];
      expect(computeCctvMetrics(r).overdue_deletion_count).toBe(0);
    });

    it("does not count not_checked as overdue", () => {
      const r = [
        makeRecord({ id: "1", retention_status: "not_checked" }),
      ];
      expect(computeCctvMetrics(r).overdue_deletion_count).toBe(0);
    });
  });

  // ── review_overdue_count ────────────────────────────────────────────
  describe("review_overdue_count", () => {
    it("is 0 when next_review_date is null", () => {
      const r = [makeRecord({ next_review_date: null })];
      expect(computeCctvMetrics(r).review_overdue_count).toBe(0);
    });

    it("is 0 when next_review_date is in the future", () => {
      const future = new Date(now);
      future.setDate(future.getDate() + 30);
      const r = [makeRecord({ next_review_date: future.toISOString().split("T")[0] })];
      expect(computeCctvMetrics(r).review_overdue_count).toBe(0);
    });

    it("counts past next_review_date as overdue", () => {
      const past = new Date(now);
      past.setDate(past.getDate() - 5);
      const r = [makeRecord({ next_review_date: past.toISOString().split("T")[0] })];
      expect(computeCctvMetrics(r).review_overdue_count).toBe(1);
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
      expect(computeCctvMetrics(r).review_overdue_count).toBe(2);
    });

    it("excludes null from overdue count", () => {
      const past = new Date(now);
      past.setDate(past.getDate() - 5);
      const r = [
        makeRecord({ id: "1", next_review_date: past.toISOString().split("T")[0] }),
        makeRecord({ id: "2", next_review_date: null }),
      ];
      expect(computeCctvMetrics(r).review_overdue_count).toBe(1);
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
      expect(computeCctvMetrics(r).review_overdue_count).toBe(1);
    });
  });

  // ── Event type counts ───────────────────────────────────────────────
  describe("event type counts", () => {
    it("counts multiple system_check events", () => {
      const r = [
        makeRecord({ id: "1", event_type: "system_check" }),
        makeRecord({ id: "2", event_type: "system_check" }),
        makeRecord({ id: "3", event_type: "footage_review" }),
      ];
      expect(computeCctvMetrics(r).system_check_count).toBe(2);
    });

    it("counts multiple footage_review events", () => {
      const r = [
        makeRecord({ id: "1", event_type: "footage_review" }),
        makeRecord({ id: "2", event_type: "footage_review" }),
        makeRecord({ id: "3", event_type: "system_check" }),
      ];
      expect(computeCctvMetrics(r).footage_review_count).toBe(2);
    });

    it("counts multiple access_request events", () => {
      const r = [
        makeRecord({ id: "1", event_type: "access_request" }),
        makeRecord({ id: "2", event_type: "access_request" }),
        makeRecord({ id: "3", event_type: "system_check" }),
      ];
      expect(computeCctvMetrics(r).access_request_count).toBe(2);
    });

    it("counts multiple data_breach events", () => {
      const r = [
        makeRecord({ id: "1", event_type: "data_breach" }),
        makeRecord({ id: "2", event_type: "data_breach" }),
        makeRecord({ id: "3", event_type: "system_check" }),
      ];
      expect(computeCctvMetrics(r).data_breach_count).toBe(2);
    });

    it("returns 0 for event types not in records", () => {
      const r = [
        makeRecord({ id: "1", event_type: "maintenance" }),
        makeRecord({ id: "2", event_type: "other" }),
      ];
      const m = computeCctvMetrics(r);
      expect(m.system_check_count).toBe(0);
      expect(m.footage_review_count).toBe(0);
      expect(m.access_request_count).toBe(0);
      expect(m.data_breach_count).toBe(0);
    });
  });

  // ── by_ breakdown maps ────────────────────────────────────────────────
  describe("by_ breakdown maps", () => {
    it("by_event_type handles all event types present", () => {
      const r = [
        makeRecord({ id: "1", event_type: "system_check" }),
        makeRecord({ id: "2", event_type: "system_check" }),
        makeRecord({ id: "3", event_type: "footage_review" }),
        makeRecord({ id: "4", event_type: "data_breach" }),
      ];
      expect(computeCctvMetrics(r).by_event_type).toEqual({
        system_check: 2,
        footage_review: 1,
        data_breach: 1,
      });
    });

    it("by_camera_location handles multiple locations", () => {
      const r = [
        makeRecord({ id: "1", camera_location: "entrance" }),
        makeRecord({ id: "2", camera_location: "entrance" }),
        makeRecord({ id: "3", camera_location: "garden" }),
      ];
      expect(computeCctvMetrics(r).by_camera_location).toEqual({
        entrance: 2,
        garden: 1,
      });
    });

    it("by_compliance_status handles multiple statuses", () => {
      const r = [
        makeRecord({ id: "1", compliance_status: "compliant" }),
        makeRecord({ id: "2", compliance_status: "compliant" }),
        makeRecord({ id: "3", compliance_status: "non_compliant" }),
        makeRecord({ id: "4", compliance_status: "not_assessed" }),
      ];
      expect(computeCctvMetrics(r).by_compliance_status).toEqual({
        compliant: 2,
        non_compliant: 1,
        not_assessed: 1,
      });
    });

    it("by_retention_status handles all statuses present", () => {
      const r = [
        makeRecord({ id: "1", retention_status: "within_schedule" }),
        makeRecord({ id: "2", retention_status: "overdue_deletion" }),
        makeRecord({ id: "3", retention_status: "extended_retention" }),
        makeRecord({ id: "4", retention_status: "not_checked" }),
      ];
      expect(computeCctvMetrics(r).by_retention_status).toEqual({
        within_schedule: 1,
        overdue_deletion: 1,
        extended_retention: 1,
        not_checked: 1,
      });
    });
  });

  // ── Rate rounding consistency ──────────────────────────────────────────
  describe("rate rounding consistency", () => {
    it("all rates use Math.round(value * 1000) / 10 formula", () => {
      const r = [
        makeRecord({
          id: "1",
          compliance_status: "compliant",
          gdpr_compliant: true,
          signage_visible: true,
          children_informed: true,
          staff_informed: true,
          privacy_impact_completed: true,
        }),
        makeRecord({
          id: "2",
          compliance_status: "compliant",
          gdpr_compliant: true,
          signage_visible: true,
          children_informed: true,
          staff_informed: true,
          privacy_impact_completed: true,
        }),
        makeRecord({
          id: "3",
          compliance_status: "non_compliant",
          gdpr_compliant: false,
          signage_visible: false,
          children_informed: false,
          staff_informed: false,
          privacy_impact_completed: false,
        }),
      ];
      const m = computeCctvMetrics(r);
      // 2/3 = 66.7
      expect(m.compliant_rate).toBe(66.7);
      expect(m.gdpr_compliant_rate).toBe(66.7);
      expect(m.signage_visible_rate).toBe(66.7);
      expect(m.children_informed_rate).toBe(66.7);
      expect(m.staff_informed_rate).toBe(66.7);
      expect(m.privacy_impact_completed_rate).toBe(66.7);
    });

    it("all rates are 0 for empty array", () => {
      const m = computeCctvMetrics([]);
      expect(m.compliant_rate).toBeNull();;
      expect(m.gdpr_compliant_rate).toBeNull();;
      expect(m.signage_visible_rate).toBeNull();;
      expect(m.children_informed_rate).toBeNull();;
      expect(m.staff_informed_rate).toBeNull();;
      expect(m.privacy_impact_completed_rate).toBeNull();;
    });

    it("rates are 100 when all true", () => {
      const r = [
        makeRecord({
          id: "1",
          compliance_status: "compliant",
          gdpr_compliant: true,
          signage_visible: true,
          children_informed: true,
          staff_informed: true,
          privacy_impact_completed: true,
        }),
      ];
      const m = computeCctvMetrics(r);
      expect(m.compliant_rate).toBe(100);
      expect(m.gdpr_compliant_rate).toBe(100);
      expect(m.signage_visible_rate).toBe(100);
      expect(m.children_informed_rate).toBe(100);
      expect(m.staff_informed_rate).toBe(100);
      expect(m.privacy_impact_completed_rate).toBe(100);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyCctvAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyCctvAlerts", () => {
  // ── No alerts ──────────────────────────────────────────────────────
  describe("no alerts scenario", () => {
    it("returns empty array for empty records", () => {
      expect(identifyCctvAlerts([])).toEqual([]);
    });

    it("returns empty array when everything is compliant", () => {
      const r = [
        makeRecord({
          id: "r-1",
          event_type: "system_check",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      expect(identifyCctvAlerts(r)).toEqual([]);
    });

    it("returns empty for compliant record with future review date", () => {
      const future = new Date(now);
      future.setDate(future.getDate() + 30);
      const r = [
        makeRecord({
          id: "r-1",
          event_type: "system_check",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
          next_review_date: future.toISOString().split("T")[0],
        }),
      ];
      expect(identifyCctvAlerts(r)).toEqual([]);
    });

    it("returns empty for single children_not_informed (threshold is 2)", () => {
      const r = [
        makeRecord({
          id: "r-1",
          event_type: "system_check",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: false,
        }),
      ];
      expect(identifyCctvAlerts(r)).toEqual([]);
    });
  });

  // ── data_breach alert (critical) ──────────────────────────────────
  describe("data_breach alert", () => {
    it("fires for event_type=data_breach", () => {
      const r = [
        makeRecord({
          id: "r-1",
          event_type: "data_breach",
          event_date: "2024-07-01",
          camera_location: "entrance",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const db = alerts.find((a) => a.type === "data_breach");
      expect(db).toBeTruthy();
    });

    it("has critical severity", () => {
      const r = [
        makeRecord({
          id: "r-1",
          event_type: "data_breach",
          event_date: "2024-07-01",
          camera_location: "entrance",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const db = alerts.find((a) => a.type === "data_breach")!;
      expect(db.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const r = [
        makeRecord({
          id: "r-42",
          event_type: "data_breach",
          event_date: "2024-07-01",
          camera_location: "entrance",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const db = alerts.find((a) => a.type === "data_breach")!;
      expect(db.id).toBe("r-42");
    });

    it("message contains event_date", () => {
      const r = [
        makeRecord({
          id: "r-1",
          event_type: "data_breach",
          event_date: "2024-07-15",
          camera_location: "entrance",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const db = alerts.find((a) => a.type === "data_breach")!;
      expect(db.message).toContain("2024-07-15");
    });

    it("message contains camera_location with underscores replaced by spaces", () => {
      const r = [
        makeRecord({
          id: "r-1",
          event_type: "data_breach",
          event_date: "2024-07-01",
          camera_location: "communal_area",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const db = alerts.find((a) => a.type === "data_breach")!;
      expect(db.message).toContain("communal area");
    });

    it("message replaces underscores in car_park location", () => {
      const r = [
        makeRecord({
          id: "r-1",
          event_type: "data_breach",
          event_date: "2024-07-01",
          camera_location: "car_park",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const db = alerts.find((a) => a.type === "data_breach")!;
      expect(db.message).toContain("car park");
    });

    it("does NOT fire for non-data_breach event types", () => {
      const r = [
        makeRecord({
          id: "r-1",
          event_type: "system_check",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      expect(alerts.find((a) => a.type === "data_breach")).toBeUndefined();
    });

    it("fires per record for multiple data breaches", () => {
      const r = [
        makeRecord({
          id: "r-1",
          event_type: "data_breach",
          event_date: "2024-07-01",
          camera_location: "entrance",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
        makeRecord({
          id: "r-2",
          event_type: "data_breach",
          event_date: "2024-07-02",
          camera_location: "office",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const dbs = alerts.filter((a) => a.type === "data_breach");
      expect(dbs).toHaveLength(2);
    });

    it("fires only for data_breach events among mixed set", () => {
      const r = [
        makeRecord({
          id: "r-1",
          event_type: "data_breach",
          event_date: "2024-07-01",
          camera_location: "entrance",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
        makeRecord({
          id: "r-2",
          event_type: "system_check",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
        makeRecord({
          id: "r-3",
          event_type: "footage_review",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const dbs = alerts.filter((a) => a.type === "data_breach");
      expect(dbs).toHaveLength(1);
      expect(dbs[0].id).toBe("r-1");
    });

    it("message contains location without underscores for single-word location", () => {
      const r = [
        makeRecord({
          id: "r-1",
          event_type: "data_breach",
          event_date: "2024-07-01",
          camera_location: "entrance",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const db = alerts.find((a) => a.type === "data_breach")!;
      expect(db.message).toContain("entrance");
    });
  });

  // ── non_compliant alert (high) ────────────────────────────────────
  describe("non_compliant alert", () => {
    it("fires for compliance_status=non_compliant", () => {
      const r = [
        makeRecord({
          id: "r-1",
          event_type: "system_check",
          compliance_status: "non_compliant",
          camera_location: "entrance",
          event_date: "2024-08-01",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const nc = alerts.find((a) => a.type === "non_compliant");
      expect(nc).toBeTruthy();
    });

    it("has high severity", () => {
      const r = [
        makeRecord({
          id: "r-1",
          compliance_status: "non_compliant",
          camera_location: "entrance",
          event_date: "2024-08-01",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const nc = alerts.find((a) => a.type === "non_compliant")!;
      expect(nc.severity).toBe("high");
    });

    it("uses the record id as alert id", () => {
      const r = [
        makeRecord({
          id: "r-99",
          compliance_status: "non_compliant",
          camera_location: "entrance",
          event_date: "2024-08-01",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const nc = alerts.find((a) => a.type === "non_compliant")!;
      expect(nc.id).toBe("r-99");
    });

    it("message contains camera_location with underscores replaced by spaces", () => {
      const r = [
        makeRecord({
          id: "r-1",
          compliance_status: "non_compliant",
          camera_location: "communal_area",
          event_date: "2024-08-01",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const nc = alerts.find((a) => a.type === "non_compliant")!;
      expect(nc.message).toContain("communal area");
    });

    it("message contains event_date", () => {
      const r = [
        makeRecord({
          id: "r-1",
          compliance_status: "non_compliant",
          camera_location: "entrance",
          event_date: "2024-08-15",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const nc = alerts.find((a) => a.type === "non_compliant")!;
      expect(nc.message).toContain("2024-08-15");
    });

    it("does NOT fire for compliant status", () => {
      const r = [
        makeRecord({
          id: "r-1",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      expect(alerts.find((a) => a.type === "non_compliant")).toBeUndefined();
    });

    it("does NOT fire for partially_compliant status", () => {
      const r = [
        makeRecord({
          id: "r-1",
          compliance_status: "partially_compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      expect(alerts.find((a) => a.type === "non_compliant")).toBeUndefined();
    });

    it("does NOT fire for not_assessed status", () => {
      const r = [
        makeRecord({
          id: "r-1",
          compliance_status: "not_assessed",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      expect(alerts.find((a) => a.type === "non_compliant")).toBeUndefined();
    });

    it("fires per record for multiple non_compliant records", () => {
      const r = [
        makeRecord({
          id: "r-1",
          compliance_status: "non_compliant",
          camera_location: "entrance",
          event_date: "2024-08-01",
          retention_status: "within_schedule",
          children_informed: true,
        }),
        makeRecord({
          id: "r-2",
          compliance_status: "non_compliant",
          camera_location: "office",
          event_date: "2024-08-02",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const ncs = alerts.filter((a) => a.type === "non_compliant");
      expect(ncs).toHaveLength(2);
    });

    it("fires only for non_compliant records in mixed set", () => {
      const r = [
        makeRecord({
          id: "r-1",
          compliance_status: "non_compliant",
          camera_location: "entrance",
          event_date: "2024-08-01",
          retention_status: "within_schedule",
          children_informed: true,
        }),
        makeRecord({
          id: "r-2",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
        makeRecord({
          id: "r-3",
          compliance_status: "partially_compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const ncs = alerts.filter((a) => a.type === "non_compliant");
      expect(ncs).toHaveLength(1);
      expect(ncs[0].id).toBe("r-1");
    });

    it("message replaces underscores in car_park location", () => {
      const r = [
        makeRecord({
          id: "r-1",
          compliance_status: "non_compliant",
          camera_location: "car_park",
          event_date: "2024-08-01",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const nc = alerts.find((a) => a.type === "non_compliant")!;
      expect(nc.message).toContain("car park");
    });
  });

  // ── overdue_deletion alert (high) ─────────────────────────────────
  describe("overdue_deletion alert", () => {
    it("fires when 1 record has overdue_deletion", () => {
      const r = [
        makeRecord({
          id: "r-1",
          retention_status: "overdue_deletion",
          compliance_status: "compliant",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const od = alerts.find((a) => a.type === "overdue_deletion");
      expect(od).toBeTruthy();
    });

    it("has high severity", () => {
      const r = [
        makeRecord({
          id: "r-1",
          retention_status: "overdue_deletion",
          compliance_status: "compliant",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const od = alerts.find((a) => a.type === "overdue_deletion")!;
      expect(od.severity).toBe("high");
    });

    it("has id overdue_deletion", () => {
      const r = [
        makeRecord({
          id: "r-1",
          retention_status: "overdue_deletion",
          compliance_status: "compliant",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const od = alerts.find((a) => a.type === "overdue_deletion")!;
      expect(od.id).toBe("overdue_deletion");
    });

    it("message uses singular for exactly 1", () => {
      const r = [
        makeRecord({
          id: "r-1",
          retention_status: "overdue_deletion",
          compliance_status: "compliant",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const od = alerts.find((a) => a.type === "overdue_deletion")!;
      expect(od.message).toContain("recording");
      expect(od.message).not.toContain("recordings");
    });

    it("message uses plural for 2", () => {
      const r = [
        makeRecord({ id: "r-1", retention_status: "overdue_deletion", compliance_status: "compliant", children_informed: true }),
        makeRecord({ id: "r-2", retention_status: "overdue_deletion", compliance_status: "compliant", children_informed: true }),
      ];
      const alerts = identifyCctvAlerts(r);
      const od = alerts.find((a) => a.type === "overdue_deletion")!;
      expect(od.message).toContain("recordings");
    });

    it("message contains count", () => {
      const r = [
        makeRecord({ id: "r-1", retention_status: "overdue_deletion", compliance_status: "compliant", children_informed: true }),
        makeRecord({ id: "r-2", retention_status: "overdue_deletion", compliance_status: "compliant", children_informed: true }),
        makeRecord({ id: "r-3", retention_status: "overdue_deletion", compliance_status: "compliant", children_informed: true }),
      ];
      const alerts = identifyCctvAlerts(r);
      const od = alerts.find((a) => a.type === "overdue_deletion")!;
      expect(od.message).toContain("3");
    });

    it("does NOT fire when no records have overdue_deletion", () => {
      const r = [
        makeRecord({ id: "r-1", retention_status: "within_schedule", compliance_status: "compliant", children_informed: true }),
        makeRecord({ id: "r-2", retention_status: "extended_retention", compliance_status: "compliant", children_informed: true }),
      ];
      const alerts = identifyCctvAlerts(r);
      expect(alerts.find((a) => a.type === "overdue_deletion")).toBeUndefined();
    });

    it("counts only overdue_deletion in mixed retention set", () => {
      const r = [
        makeRecord({ id: "r-1", retention_status: "overdue_deletion", compliance_status: "compliant", children_informed: true }),
        makeRecord({ id: "r-2", retention_status: "within_schedule", compliance_status: "compliant", children_informed: true }),
        makeRecord({ id: "r-3", retention_status: "extended_retention", compliance_status: "compliant", children_informed: true }),
        makeRecord({ id: "r-4", retention_status: "overdue_deletion", compliance_status: "compliant", children_informed: true }),
      ];
      const alerts = identifyCctvAlerts(r);
      const od = alerts.find((a) => a.type === "overdue_deletion")!;
      expect(od.message).toContain("2");
      expect(od.message).toContain("recordings");
    });

    it("does not count not_checked as overdue_deletion", () => {
      const r = [
        makeRecord({ id: "r-1", retention_status: "not_checked", compliance_status: "compliant", children_informed: true }),
      ];
      const alerts = identifyCctvAlerts(r);
      expect(alerts.find((a) => a.type === "overdue_deletion")).toBeUndefined();
    });
  });

  // ── children_not_informed alert (medium) ──────────────────────────
  describe("children_not_informed alert", () => {
    it("fires when 2 records have children_informed=false", () => {
      const r = [
        makeRecord({ id: "r-1", children_informed: false, compliance_status: "compliant", retention_status: "within_schedule" }),
        makeRecord({ id: "r-2", children_informed: false, compliance_status: "compliant", retention_status: "within_schedule" }),
      ];
      const alerts = identifyCctvAlerts(r);
      const cni = alerts.find((a) => a.type === "children_not_informed");
      expect(cni).toBeTruthy();
    });

    it("does NOT fire when only 1 record has children_informed=false", () => {
      const r = [
        makeRecord({ id: "r-1", children_informed: false, compliance_status: "compliant", retention_status: "within_schedule" }),
      ];
      const alerts = identifyCctvAlerts(r);
      expect(alerts.find((a) => a.type === "children_not_informed")).toBeUndefined();
    });

    it("has medium severity", () => {
      const r = [
        makeRecord({ id: "r-1", children_informed: false, compliance_status: "compliant", retention_status: "within_schedule" }),
        makeRecord({ id: "r-2", children_informed: false, compliance_status: "compliant", retention_status: "within_schedule" }),
      ];
      const alerts = identifyCctvAlerts(r);
      const cni = alerts.find((a) => a.type === "children_not_informed")!;
      expect(cni.severity).toBe("medium");
    });

    it("has id children_not_informed", () => {
      const r = [
        makeRecord({ id: "r-1", children_informed: false, compliance_status: "compliant", retention_status: "within_schedule" }),
        makeRecord({ id: "r-2", children_informed: false, compliance_status: "compliant", retention_status: "within_schedule" }),
      ];
      const alerts = identifyCctvAlerts(r);
      const cni = alerts.find((a) => a.type === "children_not_informed")!;
      expect(cni.id).toBe("children_not_informed");
    });

    it("message contains count", () => {
      const r = [
        makeRecord({ id: "r-1", children_informed: false, compliance_status: "compliant", retention_status: "within_schedule" }),
        makeRecord({ id: "r-2", children_informed: false, compliance_status: "compliant", retention_status: "within_schedule" }),
        makeRecord({ id: "r-3", children_informed: false, compliance_status: "compliant", retention_status: "within_schedule" }),
      ];
      const alerts = identifyCctvAlerts(r);
      const cni = alerts.find((a) => a.type === "children_not_informed")!;
      expect(cni.message).toContain("3");
    });

    it("does NOT fire when all children_informed are true", () => {
      const r = [
        makeRecord({ id: "r-1", children_informed: true, compliance_status: "compliant", retention_status: "within_schedule" }),
        makeRecord({ id: "r-2", children_informed: true, compliance_status: "compliant", retention_status: "within_schedule" }),
      ];
      const alerts = identifyCctvAlerts(r);
      expect(alerts.find((a) => a.type === "children_not_informed")).toBeUndefined();
    });

    it("counts only false values in mixed set", () => {
      const r = [
        makeRecord({ id: "r-1", children_informed: false, compliance_status: "compliant", retention_status: "within_schedule" }),
        makeRecord({ id: "r-2", children_informed: true, compliance_status: "compliant", retention_status: "within_schedule" }),
        makeRecord({ id: "r-3", children_informed: false, compliance_status: "compliant", retention_status: "within_schedule" }),
        makeRecord({ id: "r-4", children_informed: true, compliance_status: "compliant", retention_status: "within_schedule" }),
        makeRecord({ id: "r-5", children_informed: false, compliance_status: "compliant", retention_status: "within_schedule" }),
      ];
      const alerts = identifyCctvAlerts(r);
      const cni = alerts.find((a) => a.type === "children_not_informed")!;
      expect(cni.message).toContain("3");
    });

    it("fires at exactly 2 threshold", () => {
      const r = [
        makeRecord({ id: "r-1", children_informed: false, compliance_status: "compliant", retention_status: "within_schedule" }),
        makeRecord({ id: "r-2", children_informed: false, compliance_status: "compliant", retention_status: "within_schedule" }),
      ];
      const alerts = identifyCctvAlerts(r);
      const cni = alerts.find((a) => a.type === "children_not_informed")!;
      expect(cni.message).toContain("2");
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
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
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
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
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
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
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
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const ro = alerts.find((a) => a.type === "review_overdue")!;
      expect(ro.message).toContain("review is");
    });

    it("message uses plural for 2", () => {
      const past1 = new Date(now);
      past1.setDate(past1.getDate() - 5);
      const past2 = new Date(now);
      past2.setDate(past2.getDate() - 10);
      const r = [
        makeRecord({ id: "r-1", next_review_date: past1.toISOString().split("T")[0], compliance_status: "compliant", retention_status: "within_schedule", children_informed: true }),
        makeRecord({ id: "r-2", next_review_date: past2.toISOString().split("T")[0], compliance_status: "compliant", retention_status: "within_schedule", children_informed: true }),
      ];
      const alerts = identifyCctvAlerts(r);
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
        makeRecord({ id: "r-1", next_review_date: past1.toISOString().split("T")[0], compliance_status: "compliant", retention_status: "within_schedule", children_informed: true }),
        makeRecord({ id: "r-2", next_review_date: past2.toISOString().split("T")[0], compliance_status: "compliant", retention_status: "within_schedule", children_informed: true }),
        makeRecord({ id: "r-3", next_review_date: past3.toISOString().split("T")[0], compliance_status: "compliant", retention_status: "within_schedule", children_informed: true }),
      ];
      const alerts = identifyCctvAlerts(r);
      const ro = alerts.find((a) => a.type === "review_overdue")!;
      expect(ro.message).toContain("3");
    });

    it("does NOT fire when next_review_date is null", () => {
      const r = [
        makeRecord({
          id: "r-1",
          next_review_date: null,
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      expect(alerts.find((a) => a.type === "review_overdue")).toBeUndefined();
    });

    it("does NOT fire when next_review_date is in the future", () => {
      const future = new Date(now);
      future.setDate(future.getDate() + 30);
      const r = [
        makeRecord({
          id: "r-1",
          next_review_date: future.toISOString().split("T")[0],
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      expect(alerts.find((a) => a.type === "review_overdue")).toBeUndefined();
    });

    it("excludes null from overdue count", () => {
      const past = new Date(now);
      past.setDate(past.getDate() - 5);
      const r = [
        makeRecord({ id: "r-1", next_review_date: past.toISOString().split("T")[0], compliance_status: "compliant", retention_status: "within_schedule", children_informed: true }),
        makeRecord({ id: "r-2", next_review_date: null, compliance_status: "compliant", retention_status: "within_schedule", children_informed: true }),
      ];
      const alerts = identifyCctvAlerts(r);
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
        makeRecord({ id: "r-1", next_review_date: past.toISOString().split("T")[0], compliance_status: "compliant", retention_status: "within_schedule", children_informed: true }),
        makeRecord({ id: "r-2", next_review_date: future.toISOString().split("T")[0], compliance_status: "compliant", retention_status: "within_schedule", children_informed: true }),
        makeRecord({ id: "r-3", next_review_date: null, compliance_status: "compliant", retention_status: "within_schedule", children_informed: true }),
      ];
      const alerts = identifyCctvAlerts(r);
      const ro = alerts.find((a) => a.type === "review_overdue")!;
      expect(ro.message).toContain("1");
      expect(ro.message).toContain("review is");
    });
  });

  // ── Combined alert scenarios ───────────────────────────────────────
  describe("combined alert scenarios", () => {
    it("can fire all five alert types simultaneously", () => {
      const past = new Date(now);
      past.setDate(past.getDate() - 5);
      const r = [
        // data_breach + non_compliant + overdue_deletion + children_not_informed + review_overdue
        makeRecord({
          id: "r-1",
          event_type: "data_breach",
          event_date: "2024-07-01",
          camera_location: "entrance",
          compliance_status: "non_compliant",
          retention_status: "overdue_deletion",
          children_informed: false,
          next_review_date: past.toISOString().split("T")[0],
        }),
        makeRecord({
          id: "r-2",
          event_type: "system_check",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: false,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("data_breach");
      expect(types).toContain("non_compliant");
      expect(types).toContain("overdue_deletion");
      expect(types).toContain("children_not_informed");
      expect(types).toContain("review_overdue");
    });

    it("returns no alerts for a clean set of records", () => {
      const future = new Date(now);
      future.setDate(future.getDate() + 30);
      const r = [
        makeRecord({
          id: "r-1",
          event_type: "system_check",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
          next_review_date: future.toISOString().split("T")[0],
        }),
        makeRecord({
          id: "r-2",
          event_type: "footage_review",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      expect(alerts).toEqual([]);
    });

    it("alert order: data_breach before non_compliant before overdue_deletion before children_not_informed before review_overdue", () => {
      const past = new Date(now);
      past.setDate(past.getDate() - 5);
      const r = [
        makeRecord({
          id: "r-1",
          event_type: "data_breach",
          event_date: "2024-07-01",
          camera_location: "entrance",
          compliance_status: "non_compliant",
          retention_status: "overdue_deletion",
          children_informed: false,
          next_review_date: past.toISOString().split("T")[0],
        }),
        makeRecord({
          id: "r-2",
          event_type: "system_check",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: false,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const types = alerts.map((a) => a.type);

      const dbIdx = types.indexOf("data_breach");
      const ncIdx = types.indexOf("non_compliant");
      const odIdx = types.indexOf("overdue_deletion");
      const cniIdx = types.indexOf("children_not_informed");
      const roIdx = types.indexOf("review_overdue");

      expect(dbIdx).toBeLessThan(ncIdx);
      expect(ncIdx).toBeLessThan(odIdx);
      expect(odIdx).toBeLessThan(cniIdx);
      expect(cniIdx).toBeLessThan(roIdx);
    });

    it("generates multiple data_breach and non_compliant alerts for different records", () => {
      const r = [
        makeRecord({
          id: "r-1",
          event_type: "data_breach",
          event_date: "2024-07-01",
          camera_location: "entrance",
          compliance_status: "non_compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
        makeRecord({
          id: "r-2",
          event_type: "data_breach",
          event_date: "2024-07-02",
          camera_location: "office",
          compliance_status: "non_compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      const dbs = alerts.filter((a) => a.type === "data_breach");
      const ncs = alerts.filter((a) => a.type === "non_compliant");
      expect(dbs).toHaveLength(2);
      expect(ncs).toHaveLength(2);
    });

    it("data_breach does not require non_compliant status", () => {
      const r = [
        makeRecord({
          id: "r-1",
          event_type: "data_breach",
          event_date: "2024-07-01",
          camera_location: "entrance",
          compliance_status: "compliant",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      expect(alerts.find((a) => a.type === "data_breach")).toBeTruthy();
      expect(alerts.find((a) => a.type === "non_compliant")).toBeUndefined();
    });

    it("non_compliant does not require data_breach event", () => {
      const r = [
        makeRecord({
          id: "r-1",
          event_type: "system_check",
          compliance_status: "non_compliant",
          camera_location: "entrance",
          event_date: "2024-08-01",
          retention_status: "within_schedule",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      expect(alerts.find((a) => a.type === "non_compliant")).toBeTruthy();
      expect(alerts.find((a) => a.type === "data_breach")).toBeUndefined();
    });

    it("overdue_deletion alert is independent of compliance_status", () => {
      const r = [
        makeRecord({
          id: "r-1",
          retention_status: "overdue_deletion",
          compliance_status: "compliant",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      expect(alerts.find((a) => a.type === "overdue_deletion")).toBeTruthy();
      expect(alerts.find((a) => a.type === "non_compliant")).toBeUndefined();
    });

    it("children_not_informed alert is independent of compliance_status", () => {
      const r = [
        makeRecord({ id: "r-1", children_informed: false, compliance_status: "compliant", retention_status: "within_schedule" }),
        makeRecord({ id: "r-2", children_informed: false, compliance_status: "compliant", retention_status: "within_schedule" }),
      ];
      const alerts = identifyCctvAlerts(r);
      expect(alerts.find((a) => a.type === "children_not_informed")).toBeTruthy();
      expect(alerts.find((a) => a.type === "non_compliant")).toBeUndefined();
    });

    it("review_overdue alert is independent of retention_status", () => {
      const past = new Date(now);
      past.setDate(past.getDate() - 5);
      const r = [
        makeRecord({
          id: "r-1",
          next_review_date: past.toISOString().split("T")[0],
          retention_status: "within_schedule",
          compliance_status: "compliant",
          children_informed: true,
        }),
      ];
      const alerts = identifyCctvAlerts(r);
      expect(alerts.find((a) => a.type === "review_overdue")).toBeTruthy();
      expect(alerts.find((a) => a.type === "overdue_deletion")).toBeUndefined();
    });
  });
});
