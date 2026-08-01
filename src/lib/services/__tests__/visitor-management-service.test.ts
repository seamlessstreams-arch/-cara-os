// ══════════════════════════════════════════════════════════════════════════════
// CARA — VISITOR MANAGEMENT SERVICE TESTS
// Pure-function tests for visitor management metrics, alert identification,
// constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  VISITOR_TYPES,
  VISIT_PURPOSES,
  DBS_STATUSES,
  SUPERVISION_LEVELS,
  _testing,
} from "../visitor-management-service";

import type {
  VisitorRecord,
  VisitorType,
  VisitPurpose,
  DbsStatus,
  SupervisionLevel,
} from "../visitor-management-service";

const { computeVisitorMetrics, identifyVisitorAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(
  overrides?: Partial<VisitorRecord>,
): VisitorRecord {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    visitor_name: "visitor_name" in (overrides ?? {}) ? overrides!.visitor_name! : "Jane Smith",
    visitor_type: "visitor_type" in (overrides ?? {}) ? overrides!.visitor_type! : "family_member",
    visit_purpose: "visit_purpose" in (overrides ?? {}) ? overrides!.visit_purpose! : "family_contact",
    visit_date: "visit_date" in (overrides ?? {}) ? overrides!.visit_date! : "2026-05-01",
    arrival_time: "arrival_time" in (overrides ?? {}) ? overrides!.arrival_time! : "10:00",
    departure_time: "departure_time" in (overrides ?? {}) ? (overrides!.departure_time ?? null) : "11:00",
    child_visited: "child_visited" in (overrides ?? {}) ? (overrides!.child_visited ?? null) : null,
    dbs_status: "dbs_status" in (overrides ?? {}) ? overrides!.dbs_status! : "enhanced_verified",
    id_verified: "id_verified" in (overrides ?? {}) ? overrides!.id_verified! : true,
    supervision_level: "supervision_level" in (overrides ?? {}) ? overrides!.supervision_level! : "supervised",
    safeguarding_check_completed: "safeguarding_check_completed" in (overrides ?? {}) ? overrides!.safeguarding_check_completed! : true,
    signed_in: "signed_in" in (overrides ?? {}) ? overrides!.signed_in! : true,
    signed_out: "signed_out" in (overrides ?? {}) ? overrides!.signed_out! : true,
    visit_approved_by: "visit_approved_by" in (overrides ?? {}) ? overrides!.visit_approved_by! : "Manager",
    child_informed: "child_informed" in (overrides ?? {}) ? overrides!.child_informed! : true,
    child_consent_given: "child_consent_given" in (overrides ?? {}) ? (overrides!.child_consent_given ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-05-01T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-05-01T08:00:00Z",
  };
}

// ── Constants ──────────────────────────────────────────────────────────────

describe("Constants", () => {
  describe("VISITOR_TYPES", () => {
    it("has exactly 12 items", () => {
      expect(VISITOR_TYPES).toHaveLength(12);
    });

    it("contains family_member", () => {
      expect(VISITOR_TYPES).toContainEqual({ type: "family_member", label: "Family Member" });
    });

    it("contains social_worker", () => {
      expect(VISITOR_TYPES).toContainEqual({ type: "social_worker", label: "Social Worker" });
    });

    it("contains irp", () => {
      expect(VISITOR_TYPES).toContainEqual({ type: "irp", label: "IRP" });
    });

    it("contains therapist", () => {
      expect(VISITOR_TYPES).toContainEqual({ type: "therapist", label: "Therapist" });
    });

    it("contains health_professional", () => {
      expect(VISITOR_TYPES).toContainEqual({ type: "health_professional", label: "Health Professional" });
    });

    it("contains education_professional", () => {
      expect(VISITOR_TYPES).toContainEqual({ type: "education_professional", label: "Education Professional" });
    });

    it("contains ofsted_inspector", () => {
      expect(VISITOR_TYPES).toContainEqual({ type: "ofsted_inspector", label: "Ofsted Inspector" });
    });

    it("contains placing_authority", () => {
      expect(VISITOR_TYPES).toContainEqual({ type: "placing_authority", label: "Placing Authority" });
    });

    it("contains maintenance", () => {
      expect(VISITOR_TYPES).toContainEqual({ type: "maintenance", label: "Maintenance" });
    });

    it("contains advocate", () => {
      expect(VISITOR_TYPES).toContainEqual({ type: "advocate", label: "Advocate" });
    });

    it("contains friend", () => {
      expect(VISITOR_TYPES).toContainEqual({ type: "friend", label: "Friend" });
    });

    it("contains other", () => {
      expect(VISITOR_TYPES).toContainEqual({ type: "other", label: "Other" });
    });

    it("has unique type values", () => {
      const types = VISITOR_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });

    it("has unique labels", () => {
      const labels = VISITOR_TYPES.map((t) => t.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of VISITOR_TYPES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("VISIT_PURPOSES", () => {
    it("has exactly 10 items", () => {
      expect(VISIT_PURPOSES).toHaveLength(10);
    });

    it("contains family_contact", () => {
      expect(VISIT_PURPOSES).toContainEqual({ purpose: "family_contact", label: "Family Contact" });
    });

    it("contains professional_review", () => {
      expect(VISIT_PURPOSES).toContainEqual({ purpose: "professional_review", label: "Professional Review" });
    });

    it("contains inspection", () => {
      expect(VISIT_PURPOSES).toContainEqual({ purpose: "inspection", label: "Inspection" });
    });

    it("contains therapy_session", () => {
      expect(VISIT_PURPOSES).toContainEqual({ purpose: "therapy_session", label: "Therapy Session" });
    });

    it("contains health_appointment", () => {
      expect(VISIT_PURPOSES).toContainEqual({ purpose: "health_appointment", label: "Health Appointment" });
    });

    it("contains maintenance_repair", () => {
      expect(VISIT_PURPOSES).toContainEqual({ purpose: "maintenance_repair", label: "Maintenance/Repair" });
    });

    it("contains advocacy", () => {
      expect(VISIT_PURPOSES).toContainEqual({ purpose: "advocacy", label: "Advocacy" });
    });

    it("contains social_visit", () => {
      expect(VISIT_PURPOSES).toContainEqual({ purpose: "social_visit", label: "Social Visit" });
    });

    it("contains assessment", () => {
      expect(VISIT_PURPOSES).toContainEqual({ purpose: "assessment", label: "Assessment" });
    });

    it("contains other", () => {
      expect(VISIT_PURPOSES).toContainEqual({ purpose: "other", label: "Other" });
    });

    it("has unique purpose values", () => {
      const purposes = VISIT_PURPOSES.map((p) => p.purpose);
      expect(new Set(purposes).size).toBe(purposes.length);
    });

    it("has unique labels", () => {
      const labels = VISIT_PURPOSES.map((p) => p.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of VISIT_PURPOSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("DBS_STATUSES", () => {
    it("has exactly 6 items", () => {
      expect(DBS_STATUSES).toHaveLength(6);
    });

    it("contains enhanced_verified", () => {
      expect(DBS_STATUSES).toContainEqual({ status: "enhanced_verified", label: "Enhanced — Verified" });
    });

    it("contains standard_verified", () => {
      expect(DBS_STATUSES).toContainEqual({ status: "standard_verified", label: "Standard — Verified" });
    });

    it("contains not_required", () => {
      expect(DBS_STATUSES).toContainEqual({ status: "not_required", label: "Not Required" });
    });

    it("contains pending", () => {
      expect(DBS_STATUSES).toContainEqual({ status: "pending", label: "Pending" });
    });

    it("contains expired", () => {
      expect(DBS_STATUSES).toContainEqual({ status: "expired", label: "Expired" });
    });

    it("contains not_checked", () => {
      expect(DBS_STATUSES).toContainEqual({ status: "not_checked", label: "Not Checked" });
    });

    it("has unique status values", () => {
      const statuses = DBS_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has unique labels", () => {
      const labels = DBS_STATUSES.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of DBS_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("SUPERVISION_LEVELS", () => {
    it("has exactly 4 items", () => {
      expect(SUPERVISION_LEVELS).toHaveLength(4);
    });

    it("contains unsupervised", () => {
      expect(SUPERVISION_LEVELS).toContainEqual({ level: "unsupervised", label: "Unsupervised" });
    });

    it("contains supervised", () => {
      expect(SUPERVISION_LEVELS).toContainEqual({ level: "supervised", label: "Supervised" });
    });

    it("contains escorted", () => {
      expect(SUPERVISION_LEVELS).toContainEqual({ level: "escorted", label: "Escorted" });
    });

    it("contains restricted_area_only", () => {
      expect(SUPERVISION_LEVELS).toContainEqual({ level: "restricted_area_only", label: "Restricted Area Only" });
    });

    it("has unique level values", () => {
      const levels = SUPERVISION_LEVELS.map((l) => l.level);
      expect(new Set(levels).size).toBe(levels.length);
    });

    it("has unique labels", () => {
      const labels = SUPERVISION_LEVELS.map((l) => l.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of SUPERVISION_LEVELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── computeVisitorMetrics ──────────────────────────────────────────────────

describe("computeVisitorMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_visits", () => {
      const m = computeVisitorMetrics([]);
      expect(m.total_visits).toBe(0);
    });

    it("returns zero unique_visitors", () => {
      const m = computeVisitorMetrics([]);
      expect(m.unique_visitors).toBe(0);
    });

    it("returns zero family_visits", () => {
      const m = computeVisitorMetrics([]);
      expect(m.family_visits).toBe(0);
    });

    it("returns zero professional_visits", () => {
      const m = computeVisitorMetrics([]);
      expect(m.professional_visits).toBe(0);
    });

    it("returns zero dbs_verified_rate", () => {
      const m = computeVisitorMetrics([]);
      expect(m.dbs_verified_rate).toBeNull();;
    });

    it("returns zero id_verified_rate", () => {
      const m = computeVisitorMetrics([]);
      expect(m.id_verified_rate).toBeNull();;
    });

    it("returns zero safeguarding_check_rate", () => {
      const m = computeVisitorMetrics([]);
      expect(m.safeguarding_check_rate).toBeNull();;
    });

    it("returns zero signed_in_rate", () => {
      const m = computeVisitorMetrics([]);
      expect(m.signed_in_rate).toBeNull();;
    });

    it("returns zero signed_out_rate", () => {
      const m = computeVisitorMetrics([]);
      expect(m.signed_out_rate).toBeNull();;
    });

    it("returns zero child_informed_rate", () => {
      const m = computeVisitorMetrics([]);
      expect(m.child_informed_rate).toBeNull();;
    });

    it("returns zero unsupervised_count", () => {
      const m = computeVisitorMetrics([]);
      expect(m.unsupervised_count).toBe(0);
    });

    it("returns zero dbs_expired_count", () => {
      const m = computeVisitorMetrics([]);
      expect(m.dbs_expired_count).toBe(0);
    });

    it("returns zero dbs_not_checked_count", () => {
      const m = computeVisitorMetrics([]);
      expect(m.dbs_not_checked_count).toBe(0);
    });

    it("returns empty by_visitor_type", () => {
      const m = computeVisitorMetrics([]);
      expect(m.by_visitor_type).toEqual({});
    });

    it("returns empty by_visit_purpose", () => {
      const m = computeVisitorMetrics([]);
      expect(m.by_visit_purpose).toEqual({});
    });

    it("returns empty by_dbs_status", () => {
      const m = computeVisitorMetrics([]);
      expect(m.by_dbs_status).toEqual({});
    });

    it("returns empty by_supervision_level", () => {
      const m = computeVisitorMetrics([]);
      expect(m.by_supervision_level).toEqual({});
    });
  });

  describe("single record", () => {
    const record = makeRecord({
      visitor_name: "Alice Brown",
      visitor_type: "family_member",
      visit_purpose: "family_contact",
      dbs_status: "enhanced_verified",
      id_verified: true,
      supervision_level: "supervised",
      safeguarding_check_completed: true,
      signed_in: true,
      signed_out: true,
      child_informed: true,
    });

    it("returns total_visits = 1", () => {
      const m = computeVisitorMetrics([record]);
      expect(m.total_visits).toBe(1);
    });

    it("returns unique_visitors = 1", () => {
      const m = computeVisitorMetrics([record]);
      expect(m.unique_visitors).toBe(1);
    });

    it("returns family_visits = 1 for family_member", () => {
      const m = computeVisitorMetrics([record]);
      expect(m.family_visits).toBe(1);
    });

    it("returns professional_visits = 0 for family_member", () => {
      const m = computeVisitorMetrics([record]);
      expect(m.professional_visits).toBe(0);
    });

    it("returns dbs_verified_rate = 100 for enhanced_verified", () => {
      const m = computeVisitorMetrics([record]);
      expect(m.dbs_verified_rate).toBe(100);
    });

    it("returns id_verified_rate = 100", () => {
      const m = computeVisitorMetrics([record]);
      expect(m.id_verified_rate).toBe(100);
    });

    it("returns safeguarding_check_rate = 100", () => {
      const m = computeVisitorMetrics([record]);
      expect(m.safeguarding_check_rate).toBe(100);
    });

    it("returns signed_in_rate = 100", () => {
      const m = computeVisitorMetrics([record]);
      expect(m.signed_in_rate).toBe(100);
    });

    it("returns signed_out_rate = 100", () => {
      const m = computeVisitorMetrics([record]);
      expect(m.signed_out_rate).toBe(100);
    });

    it("returns child_informed_rate = 100", () => {
      const m = computeVisitorMetrics([record]);
      expect(m.child_informed_rate).toBe(100);
    });

    it("returns unsupervised_count = 0 for supervised", () => {
      const m = computeVisitorMetrics([record]);
      expect(m.unsupervised_count).toBe(0);
    });

    it("returns dbs_expired_count = 0", () => {
      const m = computeVisitorMetrics([record]);
      expect(m.dbs_expired_count).toBe(0);
    });

    it("returns dbs_not_checked_count = 0", () => {
      const m = computeVisitorMetrics([record]);
      expect(m.dbs_not_checked_count).toBe(0);
    });

    it("returns by_visitor_type with single entry", () => {
      const m = computeVisitorMetrics([record]);
      expect(m.by_visitor_type).toEqual({ family_member: 1 });
    });

    it("returns by_visit_purpose with single entry", () => {
      const m = computeVisitorMetrics([record]);
      expect(m.by_visit_purpose).toEqual({ family_contact: 1 });
    });

    it("returns by_dbs_status with single entry", () => {
      const m = computeVisitorMetrics([record]);
      expect(m.by_dbs_status).toEqual({ enhanced_verified: 1 });
    });

    it("returns by_supervision_level with single entry", () => {
      const m = computeVisitorMetrics([record]);
      expect(m.by_supervision_level).toEqual({ supervised: 1 });
    });
  });

  describe("unique_visitors uses visitor_name Set", () => {
    it("counts distinct visitor names", () => {
      const records = [
        makeRecord({ visitor_name: "Alice" }),
        makeRecord({ visitor_name: "Bob" }),
        makeRecord({ visitor_name: "Charlie" }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.unique_visitors).toBe(3);
    });

    it("deduplicates same visitor name across multiple records", () => {
      const records = [
        makeRecord({ visitor_name: "Alice" }),
        makeRecord({ visitor_name: "Alice" }),
        makeRecord({ visitor_name: "Bob" }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.unique_visitors).toBe(2);
    });

    it("returns 1 when all records have the same visitor name", () => {
      const records = [
        makeRecord({ visitor_name: "Alice" }),
        makeRecord({ visitor_name: "Alice" }),
        makeRecord({ visitor_name: "Alice" }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.unique_visitors).toBe(1);
    });
  });

  describe("family_visits", () => {
    it("counts family_member as family visit", () => {
      const records = [makeRecord({ visitor_type: "family_member" })];
      const m = computeVisitorMetrics(records);
      expect(m.family_visits).toBe(1);
    });

    it("counts friend as family visit", () => {
      const records = [makeRecord({ visitor_type: "friend" })];
      const m = computeVisitorMetrics(records);
      expect(m.family_visits).toBe(1);
    });

    it("does not count social_worker as family visit", () => {
      const records = [makeRecord({ visitor_type: "social_worker" })];
      const m = computeVisitorMetrics(records);
      expect(m.family_visits).toBe(0);
    });

    it("does not count maintenance as family visit", () => {
      const records = [makeRecord({ visitor_type: "maintenance" })];
      const m = computeVisitorMetrics(records);
      expect(m.family_visits).toBe(0);
    });

    it("does not count other as family visit", () => {
      const records = [makeRecord({ visitor_type: "other" })];
      const m = computeVisitorMetrics(records);
      expect(m.family_visits).toBe(0);
    });

    it("counts mixed family_member and friend", () => {
      const records = [
        makeRecord({ visitor_type: "family_member" }),
        makeRecord({ visitor_type: "friend" }),
        makeRecord({ visitor_type: "social_worker" }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.family_visits).toBe(2);
    });
  });

  describe("professional_visits", () => {
    it("counts social_worker as professional", () => {
      const records = [makeRecord({ visitor_type: "social_worker" })];
      const m = computeVisitorMetrics(records);
      expect(m.professional_visits).toBe(1);
    });

    it("counts irp as professional", () => {
      const records = [makeRecord({ visitor_type: "irp" })];
      const m = computeVisitorMetrics(records);
      expect(m.professional_visits).toBe(1);
    });

    it("counts therapist as professional", () => {
      const records = [makeRecord({ visitor_type: "therapist" })];
      const m = computeVisitorMetrics(records);
      expect(m.professional_visits).toBe(1);
    });

    it("counts health_professional as professional", () => {
      const records = [makeRecord({ visitor_type: "health_professional" })];
      const m = computeVisitorMetrics(records);
      expect(m.professional_visits).toBe(1);
    });

    it("counts education_professional as professional", () => {
      const records = [makeRecord({ visitor_type: "education_professional" })];
      const m = computeVisitorMetrics(records);
      expect(m.professional_visits).toBe(1);
    });

    it("counts ofsted_inspector as professional", () => {
      const records = [makeRecord({ visitor_type: "ofsted_inspector" })];
      const m = computeVisitorMetrics(records);
      expect(m.professional_visits).toBe(1);
    });

    it("counts placing_authority as professional", () => {
      const records = [makeRecord({ visitor_type: "placing_authority" })];
      const m = computeVisitorMetrics(records);
      expect(m.professional_visits).toBe(1);
    });

    it("counts advocate as professional", () => {
      const records = [makeRecord({ visitor_type: "advocate" })];
      const m = computeVisitorMetrics(records);
      expect(m.professional_visits).toBe(1);
    });

    it("does not count family_member as professional", () => {
      const records = [makeRecord({ visitor_type: "family_member" })];
      const m = computeVisitorMetrics(records);
      expect(m.professional_visits).toBe(0);
    });

    it("does not count friend as professional", () => {
      const records = [makeRecord({ visitor_type: "friend" })];
      const m = computeVisitorMetrics(records);
      expect(m.professional_visits).toBe(0);
    });

    it("does not count maintenance as professional", () => {
      const records = [makeRecord({ visitor_type: "maintenance" })];
      const m = computeVisitorMetrics(records);
      expect(m.professional_visits).toBe(0);
    });

    it("does not count other as professional", () => {
      const records = [makeRecord({ visitor_type: "other" })];
      const m = computeVisitorMetrics(records);
      expect(m.professional_visits).toBe(0);
    });

    it("counts all 8 professional types together", () => {
      const professionalTypes: VisitorType[] = [
        "social_worker", "irp", "therapist", "health_professional",
        "education_professional", "ofsted_inspector", "placing_authority", "advocate",
      ];
      const records = professionalTypes.map((t) => makeRecord({ visitor_type: t }));
      const m = computeVisitorMetrics(records);
      expect(m.professional_visits).toBe(8);
    });
  });

  describe("dbs_verified_rate", () => {
    it("counts enhanced_verified as verified", () => {
      const records = [makeRecord({ dbs_status: "enhanced_verified" })];
      const m = computeVisitorMetrics(records);
      expect(m.dbs_verified_rate).toBe(100);
    });

    it("counts standard_verified as verified", () => {
      const records = [makeRecord({ dbs_status: "standard_verified" })];
      const m = computeVisitorMetrics(records);
      expect(m.dbs_verified_rate).toBe(100);
    });

    it("does not count not_required as verified", () => {
      const records = [makeRecord({ dbs_status: "not_required" })];
      const m = computeVisitorMetrics(records);
      expect(m.dbs_verified_rate).toBe(0);
    });

    it("does not count pending as verified", () => {
      const records = [makeRecord({ dbs_status: "pending" })];
      const m = computeVisitorMetrics(records);
      expect(m.dbs_verified_rate).toBe(0);
    });

    it("does not count expired as verified", () => {
      const records = [makeRecord({ dbs_status: "expired" })];
      const m = computeVisitorMetrics(records);
      expect(m.dbs_verified_rate).toBe(0);
    });

    it("does not count not_checked as verified", () => {
      const records = [makeRecord({ dbs_status: "not_checked" })];
      const m = computeVisitorMetrics(records);
      expect(m.dbs_verified_rate).toBe(0);
    });

    it("calculates rate with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ dbs_status: "enhanced_verified" }),
        makeRecord({ dbs_status: "expired" }),
        makeRecord({ dbs_status: "not_checked" }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.dbs_verified_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ dbs_status: "enhanced_verified" }),
        makeRecord({ dbs_status: "standard_verified" }),
        makeRecord({ dbs_status: "expired" }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.dbs_verified_rate).toBe(66.7);
    });

    it("calculates 50% for 1 verified and 1 not", () => {
      const records = [
        makeRecord({ dbs_status: "enhanced_verified" }),
        makeRecord({ dbs_status: "pending" }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.dbs_verified_rate).toBe(50);
    });
  });

  describe("id_verified_rate", () => {
    it("returns 100 when all verified", () => {
      const records = [
        makeRecord({ id_verified: true }),
        makeRecord({ id_verified: true }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.id_verified_rate).toBe(100);
    });

    it("returns 0 when none verified", () => {
      const records = [
        makeRecord({ id_verified: false }),
        makeRecord({ id_verified: false }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.id_verified_rate).toBe(0);
    });

    it("calculates 50% for 1/2", () => {
      const records = [
        makeRecord({ id_verified: true }),
        makeRecord({ id_verified: false }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.id_verified_rate).toBe(50);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ id_verified: true }),
        makeRecord({ id_verified: false }),
        makeRecord({ id_verified: false }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.id_verified_rate).toBe(33.3);
    });
  });

  describe("safeguarding_check_rate", () => {
    it("returns 100 when all completed", () => {
      const records = [
        makeRecord({ safeguarding_check_completed: true }),
        makeRecord({ safeguarding_check_completed: true }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.safeguarding_check_rate).toBe(100);
    });

    it("returns 0 when none completed", () => {
      const records = [
        makeRecord({ safeguarding_check_completed: false }),
        makeRecord({ safeguarding_check_completed: false }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.safeguarding_check_rate).toBe(0);
    });

    it("calculates with rounding (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ safeguarding_check_completed: true }),
        makeRecord({ safeguarding_check_completed: true }),
        makeRecord({ safeguarding_check_completed: false }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.safeguarding_check_rate).toBe(66.7);
    });
  });

  describe("signed_in_rate", () => {
    it("returns 100 when all signed in", () => {
      const records = [
        makeRecord({ signed_in: true }),
        makeRecord({ signed_in: true }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.signed_in_rate).toBe(100);
    });

    it("returns 0 when none signed in", () => {
      const records = [
        makeRecord({ signed_in: false }),
        makeRecord({ signed_in: false }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.signed_in_rate).toBe(0);
    });

    it("calculates 50% for 1/2", () => {
      const records = [
        makeRecord({ signed_in: true }),
        makeRecord({ signed_in: false }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.signed_in_rate).toBe(50);
    });
  });

  describe("signed_out_rate", () => {
    it("returns 100 when all signed out", () => {
      const records = [
        makeRecord({ signed_out: true }),
        makeRecord({ signed_out: true }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.signed_out_rate).toBe(100);
    });

    it("returns 0 when none signed out", () => {
      const records = [
        makeRecord({ signed_out: false }),
        makeRecord({ signed_out: false }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.signed_out_rate).toBe(0);
    });

    it("calculates with rounding (1/3 = 33.3%)", () => {
      const records = [
        makeRecord({ signed_out: true }),
        makeRecord({ signed_out: false }),
        makeRecord({ signed_out: false }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.signed_out_rate).toBe(33.3);
    });
  });

  describe("child_informed_rate", () => {
    it("returns 100 when all informed", () => {
      const records = [
        makeRecord({ child_informed: true }),
        makeRecord({ child_informed: true }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.child_informed_rate).toBe(100);
    });

    it("returns 0 when none informed", () => {
      const records = [
        makeRecord({ child_informed: false }),
        makeRecord({ child_informed: false }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.child_informed_rate).toBe(0);
    });

    it("calculates with rounding (2/3 = 66.7%)", () => {
      const records = [
        makeRecord({ child_informed: true }),
        makeRecord({ child_informed: true }),
        makeRecord({ child_informed: false }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.child_informed_rate).toBe(66.7);
    });
  });

  describe("unsupervised_count", () => {
    it("counts unsupervised records", () => {
      const records = [
        makeRecord({ supervision_level: "unsupervised" }),
        makeRecord({ supervision_level: "unsupervised" }),
        makeRecord({ supervision_level: "supervised" }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.unsupervised_count).toBe(2);
    });

    it("returns 0 when no unsupervised", () => {
      const records = [
        makeRecord({ supervision_level: "supervised" }),
        makeRecord({ supervision_level: "escorted" }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.unsupervised_count).toBe(0);
    });

    it("does not count escorted as unsupervised", () => {
      const records = [makeRecord({ supervision_level: "escorted" })];
      const m = computeVisitorMetrics(records);
      expect(m.unsupervised_count).toBe(0);
    });

    it("does not count restricted_area_only as unsupervised", () => {
      const records = [makeRecord({ supervision_level: "restricted_area_only" })];
      const m = computeVisitorMetrics(records);
      expect(m.unsupervised_count).toBe(0);
    });
  });

  describe("dbs_expired_count and dbs_not_checked_count", () => {
    it("counts expired DBS records", () => {
      const records = [
        makeRecord({ dbs_status: "expired" }),
        makeRecord({ dbs_status: "expired" }),
        makeRecord({ dbs_status: "enhanced_verified" }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.dbs_expired_count).toBe(2);
    });

    it("counts not_checked DBS records", () => {
      const records = [
        makeRecord({ dbs_status: "not_checked" }),
        makeRecord({ dbs_status: "not_checked" }),
        makeRecord({ dbs_status: "not_checked" }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.dbs_not_checked_count).toBe(3);
    });

    it("does not count pending as expired", () => {
      const records = [makeRecord({ dbs_status: "pending" })];
      const m = computeVisitorMetrics(records);
      expect(m.dbs_expired_count).toBe(0);
    });

    it("does not count not_required as not_checked", () => {
      const records = [makeRecord({ dbs_status: "not_required" })];
      const m = computeVisitorMetrics(records);
      expect(m.dbs_not_checked_count).toBe(0);
    });
  });

  describe("by_visitor_type breakdown", () => {
    it("counts each visitor type separately", () => {
      const records = [
        makeRecord({ visitor_type: "family_member" }),
        makeRecord({ visitor_type: "family_member" }),
        makeRecord({ visitor_type: "social_worker" }),
        makeRecord({ visitor_type: "therapist" }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.by_visitor_type).toEqual({ family_member: 2, social_worker: 1, therapist: 1 });
    });

    it("handles all 12 visitor types", () => {
      const types: VisitorType[] = [
        "family_member", "social_worker", "irp", "therapist", "health_professional",
        "education_professional", "ofsted_inspector", "placing_authority",
        "maintenance", "advocate", "friend", "other",
      ];
      const records = types.map((t) => makeRecord({ visitor_type: t }));
      const m = computeVisitorMetrics(records);
      for (const t of types) {
        expect(m.by_visitor_type[t]).toBe(1);
      }
    });
  });

  describe("by_visit_purpose breakdown", () => {
    it("counts each visit purpose separately", () => {
      const records = [
        makeRecord({ visit_purpose: "family_contact" }),
        makeRecord({ visit_purpose: "family_contact" }),
        makeRecord({ visit_purpose: "inspection" }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.by_visit_purpose).toEqual({ family_contact: 2, inspection: 1 });
    });

    it("handles all 10 visit purposes", () => {
      const purposes: VisitPurpose[] = [
        "family_contact", "professional_review", "inspection", "therapy_session",
        "health_appointment", "maintenance_repair", "advocacy", "social_visit",
        "assessment", "other",
      ];
      const records = purposes.map((p) => makeRecord({ visit_purpose: p }));
      const m = computeVisitorMetrics(records);
      for (const p of purposes) {
        expect(m.by_visit_purpose[p]).toBe(1);
      }
    });
  });

  describe("by_dbs_status breakdown", () => {
    it("counts each DBS status separately", () => {
      const records = [
        makeRecord({ dbs_status: "enhanced_verified" }),
        makeRecord({ dbs_status: "enhanced_verified" }),
        makeRecord({ dbs_status: "expired" }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.by_dbs_status).toEqual({ enhanced_verified: 2, expired: 1 });
    });

    it("handles all 6 DBS statuses", () => {
      const statuses: DbsStatus[] = [
        "enhanced_verified", "standard_verified", "not_required", "pending", "expired", "not_checked",
      ];
      const records = statuses.map((s) => makeRecord({ dbs_status: s }));
      const m = computeVisitorMetrics(records);
      for (const s of statuses) {
        expect(m.by_dbs_status[s]).toBe(1);
      }
    });
  });

  describe("by_supervision_level breakdown", () => {
    it("counts each supervision level separately", () => {
      const records = [
        makeRecord({ supervision_level: "supervised" }),
        makeRecord({ supervision_level: "supervised" }),
        makeRecord({ supervision_level: "unsupervised" }),
      ];
      const m = computeVisitorMetrics(records);
      expect(m.by_supervision_level).toEqual({ supervised: 2, unsupervised: 1 });
    });

    it("handles all 4 supervision levels", () => {
      const levels: SupervisionLevel[] = ["unsupervised", "supervised", "escorted", "restricted_area_only"];
      const records = levels.map((l) => makeRecord({ supervision_level: l }));
      const m = computeVisitorMetrics(records);
      for (const l of levels) {
        expect(m.by_supervision_level[l]).toBe(1);
      }
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRecord({ visitor_name: "Alice", visitor_type: "family_member", dbs_status: "enhanced_verified", id_verified: true, safeguarding_check_completed: true, signed_in: true, signed_out: true, child_informed: true, supervision_level: "supervised" }),
      makeRecord({ visitor_name: "Bob", visitor_type: "social_worker", dbs_status: "standard_verified", id_verified: true, safeguarding_check_completed: true, signed_in: true, signed_out: false, child_informed: false, supervision_level: "unsupervised" }),
      makeRecord({ visitor_name: "Charlie", visitor_type: "maintenance", dbs_status: "not_required", id_verified: false, safeguarding_check_completed: false, signed_in: false, signed_out: false, child_informed: false, supervision_level: "escorted" }),
      makeRecord({ visitor_name: "Alice", visitor_type: "friend", dbs_status: "expired", id_verified: true, safeguarding_check_completed: true, signed_in: true, signed_out: true, child_informed: true, supervision_level: "supervised" }),
      makeRecord({ visitor_name: "Diana", visitor_type: "therapist", dbs_status: "not_checked", id_verified: false, safeguarding_check_completed: false, signed_in: true, signed_out: false, child_informed: true, supervision_level: "supervised" }),
    ];

    it("returns total_visits = 5", () => {
      const m = computeVisitorMetrics(records);
      expect(m.total_visits).toBe(5);
    });

    it("returns unique_visitors = 4 (Alice appears twice)", () => {
      const m = computeVisitorMetrics(records);
      expect(m.unique_visitors).toBe(4);
    });

    it("returns family_visits = 2 (family_member + friend)", () => {
      const m = computeVisitorMetrics(records);
      expect(m.family_visits).toBe(2);
    });

    it("returns professional_visits = 2 (social_worker + therapist)", () => {
      const m = computeVisitorMetrics(records);
      expect(m.professional_visits).toBe(2);
    });

    it("calculates dbs_verified_rate (2/5 = 40%)", () => {
      const m = computeVisitorMetrics(records);
      expect(m.dbs_verified_rate).toBe(40);
    });

    it("calculates id_verified_rate (3/5 = 60%)", () => {
      const m = computeVisitorMetrics(records);
      expect(m.id_verified_rate).toBe(60);
    });

    it("calculates safeguarding_check_rate (3/5 = 60%)", () => {
      const m = computeVisitorMetrics(records);
      expect(m.safeguarding_check_rate).toBe(60);
    });

    it("calculates signed_in_rate (4/5 = 80%)", () => {
      const m = computeVisitorMetrics(records);
      expect(m.signed_in_rate).toBe(80);
    });

    it("calculates signed_out_rate (2/5 = 40%)", () => {
      const m = computeVisitorMetrics(records);
      expect(m.signed_out_rate).toBe(40);
    });

    it("calculates child_informed_rate (3/5 = 60%)", () => {
      const m = computeVisitorMetrics(records);
      expect(m.child_informed_rate).toBe(60);
    });

    it("returns unsupervised_count = 1", () => {
      const m = computeVisitorMetrics(records);
      expect(m.unsupervised_count).toBe(1);
    });

    it("returns dbs_expired_count = 1", () => {
      const m = computeVisitorMetrics(records);
      expect(m.dbs_expired_count).toBe(1);
    });

    it("returns dbs_not_checked_count = 1", () => {
      const m = computeVisitorMetrics(records);
      expect(m.dbs_not_checked_count).toBe(1);
    });
  });

  describe("large data set", () => {
    it("handles 100 records correctly", () => {
      const records: VisitorRecord[] = [];
      for (let i = 0; i < 100; i++) {
        records.push(
          makeRecord({
            visitor_name: `Visitor ${i}`,
            visitor_type: i % 2 === 0 ? "family_member" : "social_worker",
            dbs_status: i % 3 === 0 ? "enhanced_verified" : "pending",
            id_verified: i % 4 === 0,
            safeguarding_check_completed: true,
            signed_in: true,
            signed_out: true,
            child_informed: true,
            supervision_level: "supervised",
          }),
        );
      }
      const m = computeVisitorMetrics(records);
      expect(m.total_visits).toBe(100);
      expect(m.unique_visitors).toBe(100);
      expect(m.family_visits).toBe(50);
      expect(m.professional_visits).toBe(50);
      expect(m.safeguarding_check_rate).toBe(100);
      expect(m.signed_in_rate).toBe(100);
      expect(m.signed_out_rate).toBe(100);
      expect(m.child_informed_rate).toBe(100);
    });
  });
});

// ── identifyVisitorAlerts ──────────────────────────────────────────────────

describe("identifyVisitorAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no records", () => {
      const alerts = identifyVisitorAlerts([]);
      expect(alerts).toEqual([]);
    });

    it("returns empty array when all records are clean", () => {
      const records = [
        makeRecord({
          supervision_level: "supervised",
          dbs_status: "enhanced_verified",
          signed_in: true,
          signed_out: true,
          safeguarding_check_completed: true,
          child_informed: true,
          child_visited: "Child A",
        }),
      ];
      const alerts = identifyVisitorAlerts(records);
      expect(alerts).toEqual([]);
    });
  });

  describe("unsupervised_no_dbs alert", () => {
    it("fires for unsupervised + expired DBS", () => {
      const records = [makeRecord({ supervision_level: "unsupervised", dbs_status: "expired" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "unsupervised_no_dbs");
      expect(alert).toBeDefined();
    });

    it("fires for unsupervised + not_checked DBS", () => {
      const records = [makeRecord({ supervision_level: "unsupervised", dbs_status: "not_checked" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "unsupervised_no_dbs");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRecord({ supervision_level: "unsupervised", dbs_status: "expired" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "unsupervised_no_dbs")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as alert id", () => {
      const records = [makeRecord({ id: "rec-unsup-1", supervision_level: "unsupervised", dbs_status: "expired" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "unsupervised_no_dbs")!;
      expect(alert.id).toBe("rec-unsup-1");
    });

    it("includes visitor_name in message", () => {
      const records = [makeRecord({ visitor_name: "John Doe", supervision_level: "unsupervised", dbs_status: "expired" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "unsupervised_no_dbs")!;
      expect(alert.message).toContain("John Doe");
    });

    it("includes visit_date in message", () => {
      const records = [makeRecord({ visit_date: "2026-03-15", supervision_level: "unsupervised", dbs_status: "expired" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "unsupervised_no_dbs")!;
      expect(alert.message).toContain("2026-03-15");
    });

    it("replaces underscores with spaces in dbs_status for expired", () => {
      const records = [makeRecord({ supervision_level: "unsupervised", dbs_status: "expired" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "unsupervised_no_dbs")!;
      expect(alert.message).toContain("expired");
    });

    it("replaces underscores with spaces in dbs_status for not_checked", () => {
      const records = [makeRecord({ supervision_level: "unsupervised", dbs_status: "not_checked" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "unsupervised_no_dbs")!;
      expect(alert.message).toContain("not checked");
    });

    it("fires per record for multiple unsupervised no DBS records", () => {
      const records = [
        makeRecord({ supervision_level: "unsupervised", dbs_status: "expired" }),
        makeRecord({ supervision_level: "unsupervised", dbs_status: "not_checked" }),
        makeRecord({ supervision_level: "unsupervised", dbs_status: "expired" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const unsupAlerts = alerts.filter((a) => a.type === "unsupervised_no_dbs");
      expect(unsupAlerts).toHaveLength(3);
    });

    it("does not fire for unsupervised + enhanced_verified", () => {
      const records = [makeRecord({ supervision_level: "unsupervised", dbs_status: "enhanced_verified" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "unsupervised_no_dbs");
      expect(alert).toBeUndefined();
    });

    it("does not fire for unsupervised + standard_verified", () => {
      const records = [makeRecord({ supervision_level: "unsupervised", dbs_status: "standard_verified" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "unsupervised_no_dbs");
      expect(alert).toBeUndefined();
    });

    it("does not fire for unsupervised + not_required", () => {
      const records = [makeRecord({ supervision_level: "unsupervised", dbs_status: "not_required" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "unsupervised_no_dbs");
      expect(alert).toBeUndefined();
    });

    it("does not fire for unsupervised + pending", () => {
      const records = [makeRecord({ supervision_level: "unsupervised", dbs_status: "pending" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "unsupervised_no_dbs");
      expect(alert).toBeUndefined();
    });

    it("does not fire for supervised + expired", () => {
      const records = [makeRecord({ supervision_level: "supervised", dbs_status: "expired" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "unsupervised_no_dbs");
      expect(alert).toBeUndefined();
    });

    it("does not fire for escorted + not_checked", () => {
      const records = [makeRecord({ supervision_level: "escorted", dbs_status: "not_checked" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "unsupervised_no_dbs");
      expect(alert).toBeUndefined();
    });

    it("does not fire for restricted_area_only + expired", () => {
      const records = [makeRecord({ supervision_level: "restricted_area_only", dbs_status: "expired" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "unsupervised_no_dbs");
      expect(alert).toBeUndefined();
    });

    it("message contains safeguarding risk wording", () => {
      const records = [makeRecord({ supervision_level: "unsupervised", dbs_status: "expired" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "unsupervised_no_dbs")!;
      expect(alert.message).toContain("safeguarding risk");
    });
  });

  describe("not_signed_out alert", () => {
    it("fires when 1 visitor signed in but not signed out", () => {
      const records = [makeRecord({ signed_in: true, signed_out: false })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "not_signed_out");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRecord({ signed_in: true, signed_out: false })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "not_signed_out")!;
      expect(alert.severity).toBe("high");
    });

    it("has id not_signed_out", () => {
      const records = [makeRecord({ signed_in: true, signed_out: false })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "not_signed_out")!;
      expect(alert.id).toBe("not_signed_out");
    });

    it("uses singular message for 1 visitor", () => {
      const records = [makeRecord({ signed_in: true, signed_out: false })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "not_signed_out")!;
      expect(alert.message).toContain("1 visitor has");
    });

    it("uses plural message for 2 visitors", () => {
      const records = [
        makeRecord({ signed_in: true, signed_out: false }),
        makeRecord({ signed_in: true, signed_out: false }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "not_signed_out")!;
      expect(alert.message).toContain("2 visitors have");
    });

    it("uses plural message for 3 visitors", () => {
      const records = [
        makeRecord({ signed_in: true, signed_out: false }),
        makeRecord({ signed_in: true, signed_out: false }),
        makeRecord({ signed_in: true, signed_out: false }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "not_signed_out")!;
      expect(alert.message).toContain("3 visitors have");
    });

    it("does not fire when signed_in=false and signed_out=false", () => {
      const records = [makeRecord({ signed_in: false, signed_out: false })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "not_signed_out");
      expect(alert).toBeUndefined();
    });

    it("does not fire when signed_in=true and signed_out=true", () => {
      const records = [makeRecord({ signed_in: true, signed_out: true })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "not_signed_out");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert, not per record", () => {
      const records = [
        makeRecord({ signed_in: true, signed_out: false }),
        makeRecord({ signed_in: true, signed_out: false }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const nsoAlerts = alerts.filter((a) => a.type === "not_signed_out");
      expect(nsoAlerts).toHaveLength(1);
    });

    it("message contains verify departure wording", () => {
      const records = [makeRecord({ signed_in: true, signed_out: false })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "not_signed_out")!;
      expect(alert.message).toContain("verify departure and update records");
    });
  });

  describe("no_safeguarding_check alert", () => {
    it("does not fire for 1 record without safeguarding check (threshold >= 2)", () => {
      const records = [makeRecord({ safeguarding_check_completed: false, supervision_level: "supervised" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "no_safeguarding_check");
      expect(alert).toBeUndefined();
    });

    it("fires for 2 records without safeguarding check", () => {
      const records = [
        makeRecord({ safeguarding_check_completed: false, supervision_level: "supervised" }),
        makeRecord({ safeguarding_check_completed: false, supervision_level: "supervised" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "no_safeguarding_check");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [
        makeRecord({ safeguarding_check_completed: false, supervision_level: "supervised" }),
        makeRecord({ safeguarding_check_completed: false, supervision_level: "unsupervised" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "no_safeguarding_check")!;
      expect(alert.severity).toBe("high");
    });

    it("has id no_safeguarding_check", () => {
      const records = [
        makeRecord({ safeguarding_check_completed: false, supervision_level: "supervised" }),
        makeRecord({ safeguarding_check_completed: false, supervision_level: "supervised" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "no_safeguarding_check")!;
      expect(alert.id).toBe("no_safeguarding_check");
    });

    it("excludes restricted_area_only from count", () => {
      const records = [
        makeRecord({ safeguarding_check_completed: false, supervision_level: "restricted_area_only" }),
        makeRecord({ safeguarding_check_completed: false, supervision_level: "restricted_area_only" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "no_safeguarding_check");
      expect(alert).toBeUndefined();
    });

    it("excludes restricted_area_only but counts others", () => {
      const records = [
        makeRecord({ safeguarding_check_completed: false, supervision_level: "restricted_area_only" }),
        makeRecord({ safeguarding_check_completed: false, supervision_level: "supervised" }),
        makeRecord({ safeguarding_check_completed: false, supervision_level: "supervised" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "no_safeguarding_check")!;
      expect(alert).toBeDefined();
      expect(alert.message).toContain("2");
    });

    it("does not fire when all have safeguarding checks completed", () => {
      const records = [
        makeRecord({ safeguarding_check_completed: true, supervision_level: "supervised" }),
        makeRecord({ safeguarding_check_completed: true, supervision_level: "supervised" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "no_safeguarding_check");
      expect(alert).toBeUndefined();
    });

    it("message contains all visitors must be vetted wording", () => {
      const records = [
        makeRecord({ safeguarding_check_completed: false, supervision_level: "supervised" }),
        makeRecord({ safeguarding_check_completed: false, supervision_level: "supervised" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "no_safeguarding_check")!;
      expect(alert.message).toContain("all visitors must be vetted");
    });

    it("includes count in message for 3 records", () => {
      const records = [
        makeRecord({ safeguarding_check_completed: false, supervision_level: "supervised" }),
        makeRecord({ safeguarding_check_completed: false, supervision_level: "unsupervised" }),
        makeRecord({ safeguarding_check_completed: false, supervision_level: "escorted" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "no_safeguarding_check")!;
      expect(alert.message).toContain("3");
    });
  });

  describe("child_not_informed alert", () => {
    it("does not fire for 1 record where child not informed (threshold >= 2)", () => {
      const records = [makeRecord({ child_informed: false, child_visited: "Child A" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "child_not_informed");
      expect(alert).toBeUndefined();
    });

    it("fires for 2 records where child not informed", () => {
      const records = [
        makeRecord({ child_informed: false, child_visited: "Child A" }),
        makeRecord({ child_informed: false, child_visited: "Child B" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "child_not_informed");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [
        makeRecord({ child_informed: false, child_visited: "Child A" }),
        makeRecord({ child_informed: false, child_visited: "Child B" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "child_not_informed")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id child_not_informed", () => {
      const records = [
        makeRecord({ child_informed: false, child_visited: "Child A" }),
        makeRecord({ child_informed: false, child_visited: "Child B" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "child_not_informed")!;
      expect(alert.id).toBe("child_not_informed");
    });

    it("only counts records where child_visited is not null", () => {
      const records = [
        makeRecord({ child_informed: false, child_visited: null }),
        makeRecord({ child_informed: false, child_visited: null }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "child_not_informed");
      expect(alert).toBeUndefined();
    });

    it("counts records with child_visited set and child not informed", () => {
      const records = [
        makeRecord({ child_informed: false, child_visited: "Child A" }),
        makeRecord({ child_informed: false, child_visited: null }),
        makeRecord({ child_informed: false, child_visited: "Child C" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "child_not_informed")!;
      expect(alert).toBeDefined();
      expect(alert.message).toContain("2");
    });

    it("does not fire when children are informed", () => {
      const records = [
        makeRecord({ child_informed: true, child_visited: "Child A" }),
        makeRecord({ child_informed: true, child_visited: "Child B" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "child_not_informed");
      expect(alert).toBeUndefined();
    });

    it("message contains children should know who is visiting wording", () => {
      const records = [
        makeRecord({ child_informed: false, child_visited: "Child A" }),
        makeRecord({ child_informed: false, child_visited: "Child B" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "child_not_informed")!;
      expect(alert.message).toContain("children should know who is visiting");
    });

    it("includes count in message for 3 records", () => {
      const records = [
        makeRecord({ child_informed: false, child_visited: "Child A" }),
        makeRecord({ child_informed: false, child_visited: "Child B" }),
        makeRecord({ child_informed: false, child_visited: "Child C" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "child_not_informed")!;
      expect(alert.message).toContain("3");
    });
  });

  describe("dbs_expired alert", () => {
    it("fires when 1 visitor has expired DBS", () => {
      const records = [makeRecord({ dbs_status: "expired" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "dbs_expired");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRecord({ dbs_status: "expired" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "dbs_expired")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id dbs_expired", () => {
      const records = [makeRecord({ dbs_status: "expired" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "dbs_expired")!;
      expect(alert.id).toBe("dbs_expired");
    });

    it("uses singular message for 1 visitor", () => {
      const records = [makeRecord({ dbs_status: "expired" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "dbs_expired")!;
      expect(alert.message).toContain("1 visitor has");
    });

    it("uses plural message for 2 visitors", () => {
      const records = [
        makeRecord({ dbs_status: "expired" }),
        makeRecord({ dbs_status: "expired" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "dbs_expired")!;
      expect(alert.message).toContain("2 visitors have");
    });

    it("uses plural message for 3 visitors", () => {
      const records = [
        makeRecord({ dbs_status: "expired" }),
        makeRecord({ dbs_status: "expired" }),
        makeRecord({ dbs_status: "expired" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "dbs_expired")!;
      expect(alert.message).toContain("3 visitors have");
    });

    it("does not fire when no expired DBS", () => {
      const records = [
        makeRecord({ dbs_status: "enhanced_verified" }),
        makeRecord({ dbs_status: "not_checked" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "dbs_expired");
      expect(alert).toBeUndefined();
    });

    it("does not fire for pending DBS", () => {
      const records = [makeRecord({ dbs_status: "pending" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "dbs_expired");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert", () => {
      const records = [
        makeRecord({ dbs_status: "expired" }),
        makeRecord({ dbs_status: "expired" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const dbsAlerts = alerts.filter((a) => a.type === "dbs_expired");
      expect(dbsAlerts).toHaveLength(1);
    });

    it("message contains request renewal before next visit wording", () => {
      const records = [makeRecord({ dbs_status: "expired" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "dbs_expired")!;
      expect(alert.message).toContain("request renewal before next visit");
    });
  });

  describe("combined alerts", () => {
    it("can fire all five alert types simultaneously", () => {
      const records = [
        // unsupervised_no_dbs (critical, per-record)
        makeRecord({ supervision_level: "unsupervised", dbs_status: "expired", signed_in: true, signed_out: false, safeguarding_check_completed: false, child_informed: false, child_visited: "Child A" }),
        // second record for threshold alerts
        makeRecord({ supervision_level: "supervised", dbs_status: "expired", signed_in: true, signed_out: true, safeguarding_check_completed: false, child_informed: false, child_visited: "Child B" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("unsupervised_no_dbs");
      expect(types).toContain("not_signed_out");
      expect(types).toContain("no_safeguarding_check");
      expect(types).toContain("child_not_informed");
      expect(types).toContain("dbs_expired");
    });

    it("per-record alerts multiply while threshold alerts stay singular", () => {
      const records = [
        makeRecord({ supervision_level: "unsupervised", dbs_status: "expired", signed_in: true, signed_out: false, safeguarding_check_completed: false, child_informed: false, child_visited: "Child A" }),
        makeRecord({ supervision_level: "unsupervised", dbs_status: "not_checked", signed_in: true, signed_out: false, safeguarding_check_completed: false, child_informed: false, child_visited: "Child B" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      expect(alerts.filter((a) => a.type === "unsupervised_no_dbs")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "not_signed_out")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "no_safeguarding_check")).toHaveLength(1);
      expect(alerts.filter((a) => a.type === "child_not_informed")).toHaveLength(1);
      // dbs_expired only counts expired, not not_checked
      expect(alerts.filter((a) => a.type === "dbs_expired")).toHaveLength(1);
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const records = [
        makeRecord({ supervision_level: "unsupervised", dbs_status: "expired", signed_in: true, signed_out: false }),
      ];
      const alerts = identifyVisitorAlerts(records);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const records = [
        makeRecord({ supervision_level: "unsupervised", dbs_status: "expired", signed_in: true, signed_out: false, safeguarding_check_completed: false, child_informed: false, child_visited: "Child A" }),
        makeRecord({ supervision_level: "supervised", dbs_status: "expired", safeguarding_check_completed: false, child_informed: false, child_visited: "Child B" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const records = [makeRecord({ supervision_level: "unsupervised", dbs_status: "expired" })];
      const alerts = identifyVisitorAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe("edge cases", () => {
    it("signed_in=false and signed_out=true does not trigger not_signed_out", () => {
      const records = [makeRecord({ signed_in: false, signed_out: true })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "not_signed_out");
      expect(alert).toBeUndefined();
    });

    it("supervised with expired DBS does not trigger unsupervised_no_dbs", () => {
      const records = [makeRecord({ supervision_level: "supervised", dbs_status: "expired" })];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "unsupervised_no_dbs");
      expect(alert).toBeUndefined();
    });

    it("restricted_area_only with no safeguarding check excluded from no_safeguarding_check count", () => {
      const records = [
        makeRecord({ safeguarding_check_completed: false, supervision_level: "restricted_area_only" }),
        makeRecord({ safeguarding_check_completed: false, supervision_level: "restricted_area_only" }),
        makeRecord({ safeguarding_check_completed: false, supervision_level: "restricted_area_only" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "no_safeguarding_check");
      expect(alert).toBeUndefined();
    });

    it("child_informed=false with child_visited=null does not count toward child_not_informed", () => {
      const records = [
        makeRecord({ child_informed: false, child_visited: null }),
        makeRecord({ child_informed: false, child_visited: null }),
        makeRecord({ child_informed: false, child_visited: null }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "child_not_informed");
      expect(alert).toBeUndefined();
    });

    it("not_checked DBS does not contribute to dbs_expired count", () => {
      const records = [
        makeRecord({ dbs_status: "not_checked" }),
        makeRecord({ dbs_status: "not_checked" }),
      ];
      const alerts = identifyVisitorAlerts(records);
      const alert = alerts.find((a) => a.type === "dbs_expired");
      expect(alert).toBeUndefined();
    });

    it("clean record triggers no alerts at all", () => {
      const records = [
        makeRecord({
          supervision_level: "supervised",
          dbs_status: "enhanced_verified",
          signed_in: true,
          signed_out: true,
          safeguarding_check_completed: true,
          child_informed: true,
          child_visited: "Child A",
        }),
        makeRecord({
          supervision_level: "escorted",
          dbs_status: "standard_verified",
          signed_in: true,
          signed_out: true,
          safeguarding_check_completed: true,
          child_informed: true,
          child_visited: "Child B",
        }),
      ];
      const alerts = identifyVisitorAlerts(records);
      expect(alerts).toEqual([]);
    });
  });
});

// ── Factory helper validation ──────────────────────────────────────────────

describe("makeRecord factory helper", () => {
  it("creates a record with sensible defaults", () => {
    const r = makeRecord();
    expect(r.home_id).toBe("home-1");
    expect(r.visitor_name).toBe("Jane Smith");
    expect(r.visitor_type).toBe("family_member");
    expect(r.visit_purpose).toBe("family_contact");
    expect(r.visit_date).toBe("2026-05-01");
    expect(r.arrival_time).toBe("10:00");
    expect(r.departure_time).toBe("11:00");
    expect(r.child_visited).toBeNull();
    expect(r.dbs_status).toBe("enhanced_verified");
    expect(r.id_verified).toBe(true);
    expect(r.supervision_level).toBe("supervised");
    expect(r.safeguarding_check_completed).toBe(true);
    expect(r.signed_in).toBe(true);
    expect(r.signed_out).toBe(true);
    expect(r.visit_approved_by).toBe("Manager");
    expect(r.child_informed).toBe(true);
    expect(r.child_consent_given).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRecord({ visitor_type: "social_worker", dbs_status: "expired" });
    expect(r.visitor_type).toBe("social_worker");
    expect(r.dbs_status).toBe("expired");
    // defaults still apply
    expect(r.visit_purpose).toBe("family_contact");
  });

  it("generates unique ids by default", () => {
    const r1 = makeRecord();
    const r2 = makeRecord();
    expect(r1.id).not.toBe(r2.id);
  });

  it("allows overriding id", () => {
    const r = makeRecord({ id: "custom-id" });
    expect(r.id).toBe("custom-id");
  });

  it("allows setting nullable fields to null", () => {
    const r = makeRecord({ departure_time: null, child_visited: null, child_consent_given: null, notes: null });
    expect(r.departure_time).toBeNull();
    expect(r.child_visited).toBeNull();
    expect(r.child_consent_given).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows setting child_visited to a value", () => {
    const r = makeRecord({ child_visited: "Child A" });
    expect(r.child_visited).toBe("Child A");
  });
});
