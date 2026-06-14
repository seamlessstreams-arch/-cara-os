// ==============================================================================
// CARA -- HOME CCTV COMPLIANCE SERVICE TESTS
// Pure-function tests for CCTV compliance metrics, alert identification,
// Cara insights, constant validation, and edge cases.
// ==============================================================================

import { describe, it, expect } from "vitest";

import {
  CAMERA_PURPOSES,
  COMPLIANCE_STATUSES,
  CAMERA_PURPOSE_LABELS,
  COMPLIANCE_STATUS_LABELS,
  _testing,
} from "../home-cctv-compliance-service";

import type {
  HomeCctvComplianceRow,
  CameraPurpose,
  ComplianceStatus,
} from "../home-cctv-compliance-service";

const {
  computeCctvComplianceMetrics,
  identifyCctvComplianceAlerts,
  generateCctvComplianceCaraInsights,
} = _testing;

// -- Helpers ------------------------------------------------------------------

function makeRow(
  overrides?: Partial<HomeCctvComplianceRow>,
): HomeCctvComplianceRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    review_date: "review_date" in (overrides ?? {}) ? overrides!.review_date! : "2026-05-01",
    reviewer_name: "reviewer_name" in (overrides ?? {}) ? overrides!.reviewer_name! : "John Smith",
    camera_location: "camera_location" in (overrides ?? {}) ? overrides!.camera_location! : "Front Entrance",
    camera_purpose: "camera_purpose" in (overrides ?? {}) ? overrides!.camera_purpose! : "Security",
    dpia_completed: "dpia_completed" in (overrides ?? {}) ? overrides!.dpia_completed! : true,
    signage_in_place: "signage_in_place" in (overrides ?? {}) ? overrides!.signage_in_place! : true,
    retention_period_days: "retention_period_days" in (overrides ?? {}) ? overrides!.retention_period_days! : 30,
    retention_compliant: "retention_compliant" in (overrides ?? {}) ? overrides!.retention_compliant! : true,
    data_protection_registered: "data_protection_registered" in (overrides ?? {}) ? overrides!.data_protection_registered! : true,
    footage_accessible: "footage_accessible" in (overrides ?? {}) ? overrides!.footage_accessible! : true,
    footage_encrypted: "footage_encrypted" in (overrides ?? {}) ? overrides!.footage_encrypted! : true,
    access_log_maintained: "access_log_maintained" in (overrides ?? {}) ? overrides!.access_log_maintained! : true,
    sar_received: "sar_received" in (overrides ?? {}) ? overrides!.sar_received! : false,
    sar_responded_in_time: "sar_responded_in_time" in (overrides ?? {}) ? (overrides!.sar_responded_in_time ?? null) : null,
    children_informed: "children_informed" in (overrides ?? {}) ? overrides!.children_informed! : true,
    staff_informed: "staff_informed" in (overrides ?? {}) ? overrides!.staff_informed! : true,
    privacy_zones_set: "privacy_zones_set" in (overrides ?? {}) ? overrides!.privacy_zones_set! : true,
    compliance_status: "compliance_status" in (overrides ?? {}) ? overrides!.compliance_status! : "Compliant",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-05-01T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-05-01T08:00:00Z",
  };
}

// ==============================================================================
// CONSTANTS
// ==============================================================================

describe("Constants", () => {
  describe("CAMERA_PURPOSES", () => {
    it("has exactly 7 items", () => {
      expect(CAMERA_PURPOSES).toHaveLength(7);
    });

    it("contains Security", () => {
      expect(CAMERA_PURPOSES).toContain("Security");
    });

    it("contains Safeguarding", () => {
      expect(CAMERA_PURPOSES).toContain("Safeguarding");
    });

    it("contains Health & Safety", () => {
      expect(CAMERA_PURPOSES).toContain("Health & Safety");
    });

    it("contains Monitoring", () => {
      expect(CAMERA_PURPOSES).toContain("Monitoring");
    });

    it("contains Entrance", () => {
      expect(CAMERA_PURPOSES).toContain("Entrance");
    });

    it("contains Car Park", () => {
      expect(CAMERA_PURPOSES).toContain("Car Park");
    });

    it("contains Other", () => {
      expect(CAMERA_PURPOSES).toContain("Other");
    });

    it("has unique values", () => {
      expect(new Set(CAMERA_PURPOSES).size).toBe(CAMERA_PURPOSES.length);
    });

    it("every entry is a non-empty string", () => {
      for (const p of CAMERA_PURPOSES) {
        expect(p.length).toBeGreaterThan(0);
      }
    });
  });

  describe("COMPLIANCE_STATUSES", () => {
    it("has exactly 4 items", () => {
      expect(COMPLIANCE_STATUSES).toHaveLength(4);
    });

    it("contains Compliant", () => {
      expect(COMPLIANCE_STATUSES).toContain("Compliant");
    });

    it("contains Non-Compliant", () => {
      expect(COMPLIANCE_STATUSES).toContain("Non-Compliant");
    });

    it("contains Action Required", () => {
      expect(COMPLIANCE_STATUSES).toContain("Action Required");
    });

    it("contains Under Review", () => {
      expect(COMPLIANCE_STATUSES).toContain("Under Review");
    });

    it("has unique values", () => {
      expect(new Set(COMPLIANCE_STATUSES).size).toBe(COMPLIANCE_STATUSES.length);
    });

    it("every entry is a non-empty string", () => {
      for (const s of COMPLIANCE_STATUSES) {
        expect(s.length).toBeGreaterThan(0);
      }
    });
  });

  describe("CAMERA_PURPOSE_LABELS", () => {
    it("has exactly 7 items", () => {
      expect(CAMERA_PURPOSE_LABELS).toHaveLength(7);
    });

    it("has unique purpose values", () => {
      const purposes = CAMERA_PURPOSE_LABELS.map((p) => p.purpose);
      expect(new Set(purposes).size).toBe(purposes.length);
    });

    it("has unique labels", () => {
      const labels = CAMERA_PURPOSE_LABELS.map((p) => p.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of CAMERA_PURPOSE_LABELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("matches CAMERA_PURPOSES values", () => {
      const labelPurposes = CAMERA_PURPOSE_LABELS.map((p) => p.purpose);
      for (const p of CAMERA_PURPOSES) {
        expect(labelPurposes).toContain(p);
      }
    });
  });

  describe("COMPLIANCE_STATUS_LABELS", () => {
    it("has exactly 4 items", () => {
      expect(COMPLIANCE_STATUS_LABELS).toHaveLength(4);
    });

    it("has unique status fields", () => {
      const statuses = COMPLIANCE_STATUS_LABELS.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has unique labels", () => {
      const labels = COMPLIANCE_STATUS_LABELS.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of COMPLIANCE_STATUS_LABELS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("matches COMPLIANCE_STATUSES values", () => {
      const labelStatuses = COMPLIANCE_STATUS_LABELS.map((s) => s.status);
      for (const s of COMPLIANCE_STATUSES) {
        expect(labelStatuses).toContain(s);
      }
    });
  });
});

// ==============================================================================
// computeCctvComplianceMetrics
// ==============================================================================

describe("computeCctvComplianceMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_reviews", () => {
      const m = computeCctvComplianceMetrics([]);
      expect(m.total_reviews).toBe(0);
    });

    it("returns zero non_compliant_count", () => {
      const m = computeCctvComplianceMetrics([]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns zero action_required_count", () => {
      const m = computeCctvComplianceMetrics([]);
      expect(m.action_required_count).toBe(0);
    });

    it("returns zero dpia_rate", () => {
      const m = computeCctvComplianceMetrics([]);
      expect(m.dpia_rate).toBe(0);
    });

    it("returns zero signage_rate", () => {
      const m = computeCctvComplianceMetrics([]);
      expect(m.signage_rate).toBe(0);
    });

    it("returns zero retention_compliant_rate", () => {
      const m = computeCctvComplianceMetrics([]);
      expect(m.retention_compliant_rate).toBe(0);
    });

    it("returns zero encryption_rate", () => {
      const m = computeCctvComplianceMetrics([]);
      expect(m.encryption_rate).toBe(0);
    });

    it("returns zero access_log_rate", () => {
      const m = computeCctvComplianceMetrics([]);
      expect(m.access_log_rate).toBe(0);
    });

    it("returns zero children_informed_rate", () => {
      const m = computeCctvComplianceMetrics([]);
      expect(m.children_informed_rate).toBe(0);
    });

    it("returns zero staff_informed_rate", () => {
      const m = computeCctvComplianceMetrics([]);
      expect(m.staff_informed_rate).toBe(0);
    });

    it("returns zero privacy_zones_rate", () => {
      const m = computeCctvComplianceMetrics([]);
      expect(m.privacy_zones_rate).toBe(0);
    });

    it("returns zero sar_count", () => {
      const m = computeCctvComplianceMetrics([]);
      expect(m.sar_count).toBe(0);
    });

    it("returns zero sar_response_rate", () => {
      const m = computeCctvComplianceMetrics([]);
      expect(m.sar_response_rate).toBe(0);
    });

    it("returns zero avg_retention_days", () => {
      const m = computeCctvComplianceMetrics([]);
      expect(m.avg_retention_days).toBe(0);
    });

    it("returns zero unique_locations", () => {
      const m = computeCctvComplianceMetrics([]);
      expect(m.unique_locations).toBe(0);
    });

    it("returns zero unique_reviewers", () => {
      const m = computeCctvComplianceMetrics([]);
      expect(m.unique_reviewers).toBe(0);
    });
  });

  describe("single compliant record", () => {
    const record = makeRow({
      camera_location: "Front Entrance",
      camera_purpose: "Security",
      dpia_completed: true,
      signage_in_place: true,
      retention_period_days: 30,
      retention_compliant: true,
      footage_encrypted: true,
      access_log_maintained: true,
      children_informed: true,
      staff_informed: true,
      privacy_zones_set: true,
      sar_received: false,
      compliance_status: "Compliant",
      reviewer_name: "John Smith",
    });

    it("returns total_reviews = 1", () => {
      const m = computeCctvComplianceMetrics([record]);
      expect(m.total_reviews).toBe(1);
    });

    it("returns non_compliant_count = 0", () => {
      const m = computeCctvComplianceMetrics([record]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns action_required_count = 0", () => {
      const m = computeCctvComplianceMetrics([record]);
      expect(m.action_required_count).toBe(0);
    });

    it("returns dpia_rate = 100", () => {
      const m = computeCctvComplianceMetrics([record]);
      expect(m.dpia_rate).toBe(100);
    });

    it("returns signage_rate = 100", () => {
      const m = computeCctvComplianceMetrics([record]);
      expect(m.signage_rate).toBe(100);
    });

    it("returns retention_compliant_rate = 100", () => {
      const m = computeCctvComplianceMetrics([record]);
      expect(m.retention_compliant_rate).toBe(100);
    });

    it("returns encryption_rate = 100", () => {
      const m = computeCctvComplianceMetrics([record]);
      expect(m.encryption_rate).toBe(100);
    });

    it("returns access_log_rate = 100", () => {
      const m = computeCctvComplianceMetrics([record]);
      expect(m.access_log_rate).toBe(100);
    });

    it("returns children_informed_rate = 100", () => {
      const m = computeCctvComplianceMetrics([record]);
      expect(m.children_informed_rate).toBe(100);
    });

    it("returns staff_informed_rate = 100", () => {
      const m = computeCctvComplianceMetrics([record]);
      expect(m.staff_informed_rate).toBe(100);
    });

    it("returns privacy_zones_rate = 100", () => {
      const m = computeCctvComplianceMetrics([record]);
      expect(m.privacy_zones_rate).toBe(100);
    });

    it("returns sar_count = 0", () => {
      const m = computeCctvComplianceMetrics([record]);
      expect(m.sar_count).toBe(0);
    });

    it("returns sar_response_rate = 0 (no SARs)", () => {
      const m = computeCctvComplianceMetrics([record]);
      expect(m.sar_response_rate).toBe(0);
    });

    it("returns avg_retention_days = 30", () => {
      const m = computeCctvComplianceMetrics([record]);
      expect(m.avg_retention_days).toBe(30);
    });

    it("returns unique_locations = 1", () => {
      const m = computeCctvComplianceMetrics([record]);
      expect(m.unique_locations).toBe(1);
    });

    it("returns unique_reviewers = 1", () => {
      const m = computeCctvComplianceMetrics([record]);
      expect(m.unique_reviewers).toBe(1);
    });
  });

  describe("multiple records", () => {
    const records = [
      makeRow({ camera_location: "Front Entrance", dpia_completed: true, signage_in_place: true, retention_period_days: 30, retention_compliant: true, footage_encrypted: true, access_log_maintained: true, children_informed: true, staff_informed: true, privacy_zones_set: true, sar_received: true, sar_responded_in_time: true, compliance_status: "Compliant", reviewer_name: "Reviewer A" }),
      makeRow({ camera_location: "Rear Garden", dpia_completed: false, signage_in_place: false, retention_period_days: 60, retention_compliant: false, footage_encrypted: false, access_log_maintained: false, children_informed: false, staff_informed: false, privacy_zones_set: false, sar_received: true, sar_responded_in_time: false, compliance_status: "Non-Compliant", reviewer_name: "Reviewer B" }),
      makeRow({ camera_location: "Car Park", dpia_completed: true, signage_in_place: true, retention_period_days: 14, retention_compliant: true, footage_encrypted: true, access_log_maintained: true, children_informed: true, staff_informed: true, privacy_zones_set: true, sar_received: false, compliance_status: "Compliant", reviewer_name: "Reviewer A" }),
      makeRow({ camera_location: "Side Entrance", dpia_completed: true, signage_in_place: false, retention_period_days: 30, retention_compliant: true, footage_encrypted: false, access_log_maintained: true, children_informed: true, staff_informed: false, privacy_zones_set: false, sar_received: true, sar_responded_in_time: true, compliance_status: "Action Required", reviewer_name: "Reviewer C" }),
      makeRow({ camera_location: "Hallway", dpia_completed: false, signage_in_place: true, retention_period_days: 90, retention_compliant: false, footage_encrypted: true, access_log_maintained: false, children_informed: false, staff_informed: true, privacy_zones_set: true, sar_received: false, compliance_status: "Under Review", reviewer_name: "Reviewer B" }),
    ];

    it("returns total_reviews = 5", () => {
      const m = computeCctvComplianceMetrics(records);
      expect(m.total_reviews).toBe(5);
    });

    it("returns non_compliant_count = 1", () => {
      const m = computeCctvComplianceMetrics(records);
      expect(m.non_compliant_count).toBe(1);
    });

    it("returns action_required_count = 1", () => {
      const m = computeCctvComplianceMetrics(records);
      expect(m.action_required_count).toBe(1);
    });

    it("calculates dpia_rate (3/5 = 60%)", () => {
      const m = computeCctvComplianceMetrics(records);
      expect(m.dpia_rate).toBe(60);
    });

    it("calculates signage_rate (3/5 = 60%)", () => {
      const m = computeCctvComplianceMetrics(records);
      expect(m.signage_rate).toBe(60);
    });

    it("calculates retention_compliant_rate (3/5 = 60%)", () => {
      const m = computeCctvComplianceMetrics(records);
      expect(m.retention_compliant_rate).toBe(60);
    });

    it("calculates encryption_rate (3/5 = 60%)", () => {
      const m = computeCctvComplianceMetrics(records);
      expect(m.encryption_rate).toBe(60);
    });

    it("calculates access_log_rate (3/5 = 60%)", () => {
      const m = computeCctvComplianceMetrics(records);
      expect(m.access_log_rate).toBe(60);
    });

    it("calculates children_informed_rate (3/5 = 60%)", () => {
      const m = computeCctvComplianceMetrics(records);
      expect(m.children_informed_rate).toBe(60);
    });

    it("calculates staff_informed_rate (3/5 = 60%)", () => {
      const m = computeCctvComplianceMetrics(records);
      expect(m.staff_informed_rate).toBe(60);
    });

    it("calculates privacy_zones_rate (3/5 = 60%)", () => {
      const m = computeCctvComplianceMetrics(records);
      expect(m.privacy_zones_rate).toBe(60);
    });

    it("returns sar_count = 3", () => {
      const m = computeCctvComplianceMetrics(records);
      expect(m.sar_count).toBe(3);
    });

    it("calculates sar_response_rate (2/3 responded with non-null = 66.7%)", () => {
      const m = computeCctvComplianceMetrics(records);
      expect(m.sar_response_rate).toBe(66.7);
    });

    it("calculates avg_retention_days ((30+60+14+30+90)/5 = 44.8)", () => {
      const m = computeCctvComplianceMetrics(records);
      expect(m.avg_retention_days).toBe(44.8);
    });

    it("returns unique_locations = 5", () => {
      const m = computeCctvComplianceMetrics(records);
      expect(m.unique_locations).toBe(5);
    });

    it("returns unique_reviewers = 3", () => {
      const m = computeCctvComplianceMetrics(records);
      expect(m.unique_reviewers).toBe(3);
    });
  });

  describe("dpia_rate", () => {
    it("returns 100 when all DPIA completed", () => {
      const records = [
        makeRow({ dpia_completed: true }),
        makeRow({ dpia_completed: true }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.dpia_rate).toBe(100);
    });

    it("returns 0 when no DPIA completed", () => {
      const records = [
        makeRow({ dpia_completed: false }),
        makeRow({ dpia_completed: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.dpia_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ dpia_completed: true }),
        makeRow({ dpia_completed: false }),
        makeRow({ dpia_completed: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.dpia_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ dpia_completed: true }),
        makeRow({ dpia_completed: true }),
        makeRow({ dpia_completed: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.dpia_rate).toBe(66.7);
    });
  });

  describe("signage_rate", () => {
    it("returns 100 when all signage in place", () => {
      const records = [
        makeRow({ signage_in_place: true }),
        makeRow({ signage_in_place: true }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.signage_rate).toBe(100);
    });

    it("returns 0 when no signage in place", () => {
      const records = [
        makeRow({ signage_in_place: false }),
        makeRow({ signage_in_place: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.signage_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ signage_in_place: true }),
        makeRow({ signage_in_place: false }),
        makeRow({ signage_in_place: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.signage_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ signage_in_place: true }),
        makeRow({ signage_in_place: true }),
        makeRow({ signage_in_place: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.signage_rate).toBe(66.7);
    });
  });

  describe("encryption_rate", () => {
    it("returns 100 when all footage encrypted", () => {
      const records = [
        makeRow({ footage_encrypted: true }),
        makeRow({ footage_encrypted: true }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.encryption_rate).toBe(100);
    });

    it("returns 0 when no footage encrypted", () => {
      const records = [
        makeRow({ footage_encrypted: false }),
        makeRow({ footage_encrypted: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.encryption_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ footage_encrypted: true }),
        makeRow({ footage_encrypted: false }),
        makeRow({ footage_encrypted: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.encryption_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ footage_encrypted: true }),
        makeRow({ footage_encrypted: true }),
        makeRow({ footage_encrypted: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.encryption_rate).toBe(66.7);
    });
  });

  describe("access_log_rate", () => {
    it("returns 100 when all access logs maintained", () => {
      const records = [
        makeRow({ access_log_maintained: true }),
        makeRow({ access_log_maintained: true }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.access_log_rate).toBe(100);
    });

    it("returns 0 when no access logs maintained", () => {
      const records = [
        makeRow({ access_log_maintained: false }),
        makeRow({ access_log_maintained: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.access_log_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ access_log_maintained: true }),
        makeRow({ access_log_maintained: false }),
        makeRow({ access_log_maintained: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.access_log_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ access_log_maintained: true }),
        makeRow({ access_log_maintained: true }),
        makeRow({ access_log_maintained: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.access_log_rate).toBe(66.7);
    });
  });

  describe("children_informed_rate", () => {
    it("returns 100 when all children informed", () => {
      const records = [
        makeRow({ children_informed: true }),
        makeRow({ children_informed: true }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.children_informed_rate).toBe(100);
    });

    it("returns 0 when no children informed", () => {
      const records = [
        makeRow({ children_informed: false }),
        makeRow({ children_informed: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.children_informed_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ children_informed: true }),
        makeRow({ children_informed: false }),
        makeRow({ children_informed: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.children_informed_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ children_informed: true }),
        makeRow({ children_informed: true }),
        makeRow({ children_informed: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.children_informed_rate).toBe(66.7);
    });
  });

  describe("staff_informed_rate", () => {
    it("returns 100 when all staff informed", () => {
      const records = [
        makeRow({ staff_informed: true }),
        makeRow({ staff_informed: true }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.staff_informed_rate).toBe(100);
    });

    it("returns 0 when no staff informed", () => {
      const records = [
        makeRow({ staff_informed: false }),
        makeRow({ staff_informed: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.staff_informed_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ staff_informed: true }),
        makeRow({ staff_informed: false }),
        makeRow({ staff_informed: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.staff_informed_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ staff_informed: true }),
        makeRow({ staff_informed: true }),
        makeRow({ staff_informed: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.staff_informed_rate).toBe(66.7);
    });
  });

  describe("privacy_zones_rate", () => {
    it("returns 100 when all privacy zones set", () => {
      const records = [
        makeRow({ privacy_zones_set: true }),
        makeRow({ privacy_zones_set: true }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.privacy_zones_rate).toBe(100);
    });

    it("returns 0 when no privacy zones set", () => {
      const records = [
        makeRow({ privacy_zones_set: false }),
        makeRow({ privacy_zones_set: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.privacy_zones_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ privacy_zones_set: true }),
        makeRow({ privacy_zones_set: false }),
        makeRow({ privacy_zones_set: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.privacy_zones_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ privacy_zones_set: true }),
        makeRow({ privacy_zones_set: true }),
        makeRow({ privacy_zones_set: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.privacy_zones_rate).toBe(66.7);
    });

    it("calculates rate (1/6 = 16.7%)", () => {
      const records = Array.from({ length: 6 }, (_, i) =>
        makeRow({ privacy_zones_set: i === 0 }),
      );
      const m = computeCctvComplianceMetrics(records);
      expect(m.privacy_zones_rate).toBe(16.7);
    });
  });

  describe("retention_compliant_rate", () => {
    it("returns 100 when all retention compliant", () => {
      const records = [
        makeRow({ retention_compliant: true }),
        makeRow({ retention_compliant: true }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.retention_compliant_rate).toBe(100);
    });

    it("returns 0 when no retention compliant", () => {
      const records = [
        makeRow({ retention_compliant: false }),
        makeRow({ retention_compliant: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.retention_compliant_rate).toBe(0);
    });

    it("calculates mixed rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ retention_compliant: true }),
        makeRow({ retention_compliant: false }),
        makeRow({ retention_compliant: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.retention_compliant_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ retention_compliant: true }),
        makeRow({ retention_compliant: true }),
        makeRow({ retention_compliant: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.retention_compliant_rate).toBe(66.7);
    });
  });

  describe("non_compliant_count", () => {
    it("counts Non-Compliant status", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const m = computeCctvComplianceMetrics(records);
      expect(m.non_compliant_count).toBe(1);
    });

    it("does not count Compliant", () => {
      const records = [makeRow({ compliance_status: "Compliant" })];
      const m = computeCctvComplianceMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });

    it("does not count Action Required", () => {
      const records = [makeRow({ compliance_status: "Action Required" })];
      const m = computeCctvComplianceMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });

    it("does not count Under Review", () => {
      const records = [makeRow({ compliance_status: "Under Review" })];
      const m = computeCctvComplianceMetrics(records);
      expect(m.non_compliant_count).toBe(0);
    });

    it("counts multiple Non-Compliant records", () => {
      const records = [
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Compliant" }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.non_compliant_count).toBe(2);
    });
  });

  describe("action_required_count", () => {
    it("counts Action Required status", () => {
      const records = [makeRow({ compliance_status: "Action Required" })];
      const m = computeCctvComplianceMetrics(records);
      expect(m.action_required_count).toBe(1);
    });

    it("does not count Compliant", () => {
      const records = [makeRow({ compliance_status: "Compliant" })];
      const m = computeCctvComplianceMetrics(records);
      expect(m.action_required_count).toBe(0);
    });

    it("does not count Non-Compliant", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const m = computeCctvComplianceMetrics(records);
      expect(m.action_required_count).toBe(0);
    });

    it("does not count Under Review", () => {
      const records = [makeRow({ compliance_status: "Under Review" })];
      const m = computeCctvComplianceMetrics(records);
      expect(m.action_required_count).toBe(0);
    });

    it("counts multiple Action Required records", () => {
      const records = [
        makeRow({ compliance_status: "Action Required" }),
        makeRow({ compliance_status: "Action Required" }),
        makeRow({ compliance_status: "Compliant" }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.action_required_count).toBe(2);
    });
  });

  describe("sar_count", () => {
    it("counts sar_received = true", () => {
      const records = [
        makeRow({ sar_received: true }),
        makeRow({ sar_received: true }),
        makeRow({ sar_received: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.sar_count).toBe(2);
    });

    it("returns zero when no SARs received", () => {
      const records = [
        makeRow({ sar_received: false }),
        makeRow({ sar_received: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.sar_count).toBe(0);
    });
  });

  describe("sar_response_rate", () => {
    it("returns 100 when all SARs responded in time", () => {
      const records = [
        makeRow({ sar_received: true, sar_responded_in_time: true }),
        makeRow({ sar_received: true, sar_responded_in_time: true }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.sar_response_rate).toBe(100);
    });

    it("returns 0 when no SARs responded in time", () => {
      const records = [
        makeRow({ sar_received: true, sar_responded_in_time: false }),
        makeRow({ sar_received: true, sar_responded_in_time: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.sar_response_rate).toBe(0);
    });

    it("returns 0 when no SARs received", () => {
      const records = [
        makeRow({ sar_received: false }),
        makeRow({ sar_received: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.sar_response_rate).toBe(0);
    });

    it("excludes rows where sar_responded_in_time is null", () => {
      const records = [
        makeRow({ sar_received: true, sar_responded_in_time: true }),
        makeRow({ sar_received: true, sar_responded_in_time: null }),
      ];
      const m = computeCctvComplianceMetrics(records);
      // only 1 row has non-null, and it responded => 100%
      expect(m.sar_response_rate).toBe(100);
    });

    it("calculates mixed rate (1/2 = 50%)", () => {
      const records = [
        makeRow({ sar_received: true, sar_responded_in_time: true }),
        makeRow({ sar_received: true, sar_responded_in_time: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.sar_response_rate).toBe(50);
    });

    it("calculates rate (1/3 = 33.3%)", () => {
      const records = [
        makeRow({ sar_received: true, sar_responded_in_time: true }),
        makeRow({ sar_received: true, sar_responded_in_time: false }),
        makeRow({ sar_received: true, sar_responded_in_time: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.sar_response_rate).toBe(33.3);
    });

    it("calculates rate (2/3 = 66.7%)", () => {
      const records = [
        makeRow({ sar_received: true, sar_responded_in_time: true }),
        makeRow({ sar_received: true, sar_responded_in_time: true }),
        makeRow({ sar_received: true, sar_responded_in_time: false }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.sar_response_rate).toBe(66.7);
    });

    it("ignores rows where sar_received is false", () => {
      const records = [
        makeRow({ sar_received: true, sar_responded_in_time: true }),
        makeRow({ sar_received: false, sar_responded_in_time: null }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.sar_response_rate).toBe(100);
    });
  });

  describe("avg_retention_days", () => {
    it("returns exact value for single record", () => {
      const records = [makeRow({ retention_period_days: 30 })];
      const m = computeCctvComplianceMetrics(records);
      expect(m.avg_retention_days).toBe(30);
    });

    it("calculates average of two records", () => {
      const records = [
        makeRow({ retention_period_days: 30 }),
        makeRow({ retention_period_days: 60 }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.avg_retention_days).toBe(45);
    });

    it("calculates average with 1 decimal place", () => {
      const records = [
        makeRow({ retention_period_days: 30 }),
        makeRow({ retention_period_days: 60 }),
        makeRow({ retention_period_days: 14 }),
      ];
      const m = computeCctvComplianceMetrics(records);
      // (30+60+14)/3 = 34.666... => 34.7
      expect(m.avg_retention_days).toBe(34.7);
    });

    it("returns 0 for empty array", () => {
      const m = computeCctvComplianceMetrics([]);
      expect(m.avg_retention_days).toBe(0);
    });

    it("handles all same values", () => {
      const records = [
        makeRow({ retention_period_days: 30 }),
        makeRow({ retention_period_days: 30 }),
        makeRow({ retention_period_days: 30 }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.avg_retention_days).toBe(30);
    });

    it("handles large retention periods", () => {
      const records = [
        makeRow({ retention_period_days: 365 }),
        makeRow({ retention_period_days: 180 }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.avg_retention_days).toBe(272.5);
    });
  });

  describe("unique_locations", () => {
    it("counts distinct camera locations", () => {
      const records = [
        makeRow({ camera_location: "Front Entrance" }),
        makeRow({ camera_location: "Rear Garden" }),
        makeRow({ camera_location: "Front Entrance" }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.unique_locations).toBe(2);
    });

    it("returns 1 when all same location", () => {
      const records = [
        makeRow({ camera_location: "Front Entrance" }),
        makeRow({ camera_location: "Front Entrance" }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.unique_locations).toBe(1);
    });

    it("treats different locations as different", () => {
      const records = [
        makeRow({ camera_location: "Front Entrance" }),
        makeRow({ camera_location: "Rear Garden" }),
        makeRow({ camera_location: "Car Park" }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.unique_locations).toBe(3);
    });
  });

  describe("unique_reviewers", () => {
    it("counts distinct reviewer names", () => {
      const records = [
        makeRow({ reviewer_name: "Reviewer A" }),
        makeRow({ reviewer_name: "Reviewer B" }),
        makeRow({ reviewer_name: "Reviewer A" }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.unique_reviewers).toBe(2);
    });

    it("returns 1 when all same reviewer", () => {
      const records = [
        makeRow({ reviewer_name: "John Smith" }),
        makeRow({ reviewer_name: "John Smith" }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.unique_reviewers).toBe(1);
    });

    it("treats different names as different reviewers", () => {
      const records = [
        makeRow({ reviewer_name: "Reviewer A" }),
        makeRow({ reviewer_name: "Reviewer B" }),
        makeRow({ reviewer_name: "Reviewer C" }),
      ];
      const m = computeCctvComplianceMetrics(records);
      expect(m.unique_reviewers).toBe(3);
    });
  });

  describe("large data set", () => {
    it("handles 100 records correctly", () => {
      const records: HomeCctvComplianceRow[] = [];
      for (let i = 0; i < 100; i++) {
        records.push(
          makeRow({
            camera_purpose: i % 2 === 0 ? "Security" : "Safeguarding",
            dpia_completed: i % 3 !== 0,
            signage_in_place: i % 4 !== 0,
            footage_encrypted: i % 5 !== 0,
            access_log_maintained: i % 6 !== 0,
            compliance_status: "Compliant",
            reviewer_name: `Reviewer ${i % 5}`,
            camera_location: `Location ${i % 10}`,
          }),
        );
      }
      const m = computeCctvComplianceMetrics(records);
      expect(m.total_reviews).toBe(100);
      expect(m.unique_reviewers).toBe(5);
      expect(m.unique_locations).toBe(10);
    });
  });
});

// ==============================================================================
// identifyCctvComplianceAlerts
// ==============================================================================

describe("identifyCctvComplianceAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no records", () => {
      const alerts = identifyCctvComplianceAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all records are clean", () => {
      const records = [
        makeRow({
          dpia_completed: true,
          children_informed: true,
          signage_in_place: true,
          compliance_status: "Compliant",
          footage_encrypted: true,
          sar_received: false,
        }),
      ];
      const alerts = identifyCctvComplianceAlerts(records);
      expect(alerts).toEqual([]);
    });
  });

  // -- no_dpia alert ----------------------------------------------------------

  describe("no_dpia alert", () => {
    it("fires when dpia_completed is false", () => {
      const records = [makeRow({ dpia_completed: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_dpia");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRow({ dpia_completed: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_dpia")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-dpia-1", dpia_completed: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_dpia")!;
      expect(alert.record_id).toBe("rec-dpia-1");
    });

    it("includes camera_location in message", () => {
      const records = [makeRow({ dpia_completed: false, camera_location: "Rear Garden" })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_dpia")!;
      expect(alert.message).toContain("Rear Garden");
    });

    it("includes review_date in message", () => {
      const records = [makeRow({ dpia_completed: false, review_date: "2026-03-15" })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_dpia")!;
      expect(alert.message).toContain("2026-03-15");
    });

    it("does not fire when dpia_completed is true", () => {
      const records = [makeRow({ dpia_completed: true })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_dpia");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple records without DPIA", () => {
      const records = [
        makeRow({ dpia_completed: false }),
        makeRow({ dpia_completed: false }),
        makeRow({ dpia_completed: true }),
      ];
      const alerts = identifyCctvComplianceAlerts(records);
      const dpiaAlerts = alerts.filter((a) => a.type === "no_dpia");
      expect(dpiaAlerts).toHaveLength(2);
    });
  });

  // -- children_not_informed alert --------------------------------------------

  describe("children_not_informed alert", () => {
    it("fires when children_informed is false", () => {
      const records = [makeRow({ children_informed: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "children_not_informed");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const records = [makeRow({ children_informed: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "children_not_informed")!;
      expect(alert.severity).toBe("critical");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-ci-1", children_informed: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "children_not_informed")!;
      expect(alert.record_id).toBe("rec-ci-1");
    });

    it("includes camera_location in message", () => {
      const records = [makeRow({ children_informed: false, camera_location: "Hallway" })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "children_not_informed")!;
      expect(alert.message).toContain("Hallway");
    });

    it("includes review_date in message", () => {
      const records = [makeRow({ children_informed: false, review_date: "2026-04-20" })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "children_not_informed")!;
      expect(alert.message).toContain("2026-04-20");
    });

    it("does not fire when children_informed is true", () => {
      const records = [makeRow({ children_informed: true })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "children_not_informed");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple records where children not informed", () => {
      const records = [
        makeRow({ children_informed: false }),
        makeRow({ children_informed: false }),
        makeRow({ children_informed: true }),
      ];
      const alerts = identifyCctvComplianceAlerts(records);
      const ciAlerts = alerts.filter((a) => a.type === "children_not_informed");
      expect(ciAlerts).toHaveLength(2);
    });
  });

  // -- no_signage alert -------------------------------------------------------

  describe("no_signage alert", () => {
    it("fires when signage_in_place is false", () => {
      const records = [makeRow({ signage_in_place: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_signage");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRow({ signage_in_place: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_signage")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-sig-1", signage_in_place: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_signage")!;
      expect(alert.record_id).toBe("rec-sig-1");
    });

    it("includes camera_location in message", () => {
      const records = [makeRow({ signage_in_place: false, camera_location: "Side Entrance" })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_signage")!;
      expect(alert.message).toContain("Side Entrance");
    });

    it("includes review_date in message", () => {
      const records = [makeRow({ signage_in_place: false, review_date: "2026-02-10" })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_signage")!;
      expect(alert.message).toContain("2026-02-10");
    });

    it("does not fire when signage_in_place is true", () => {
      const records = [makeRow({ signage_in_place: true })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_signage");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple records without signage", () => {
      const records = [
        makeRow({ signage_in_place: false }),
        makeRow({ signage_in_place: false }),
        makeRow({ signage_in_place: true }),
      ];
      const alerts = identifyCctvComplianceAlerts(records);
      const sigAlerts = alerts.filter((a) => a.type === "no_signage");
      expect(sigAlerts).toHaveLength(2);
    });
  });

  // -- non_compliant_status alert ---------------------------------------------

  describe("non_compliant_status alert", () => {
    it("fires when compliance_status is Non-Compliant", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_status");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_status")!;
      expect(alert.severity).toBe("high");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-nc-1", compliance_status: "Non-Compliant" })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_status")!;
      expect(alert.record_id).toBe("rec-nc-1");
    });

    it("includes camera_location in message", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant", camera_location: "Car Park" })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_status")!;
      expect(alert.message).toContain("Car Park");
    });

    it("includes review_date in message", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant", review_date: "2026-02-20" })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_status")!;
      expect(alert.message).toContain("2026-02-20");
    });

    it("does not fire when compliance_status is Compliant", () => {
      const records = [makeRow({ compliance_status: "Compliant" })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_status");
      expect(alert).toBeUndefined();
    });

    it("does not fire when compliance_status is Action Required", () => {
      const records = [makeRow({ compliance_status: "Action Required" })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_status");
      expect(alert).toBeUndefined();
    });

    it("does not fire when compliance_status is Under Review", () => {
      const records = [makeRow({ compliance_status: "Under Review" })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "non_compliant_status");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple Non-Compliant records", () => {
      const records = [
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Compliant" }),
      ];
      const alerts = identifyCctvComplianceAlerts(records);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant_status");
      expect(ncAlerts).toHaveLength(2);
    });
  });

  // -- no_encryption alert ----------------------------------------------------

  describe("no_encryption alert", () => {
    it("fires when footage_encrypted is false", () => {
      const records = [makeRow({ footage_encrypted: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_encryption");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRow({ footage_encrypted: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_encryption")!;
      expect(alert.severity).toBe("medium");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-enc-1", footage_encrypted: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_encryption")!;
      expect(alert.record_id).toBe("rec-enc-1");
    });

    it("includes camera_location in message", () => {
      const records = [makeRow({ footage_encrypted: false, camera_location: "Utility Room" })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_encryption")!;
      expect(alert.message).toContain("Utility Room");
    });

    it("includes review_date in message", () => {
      const records = [makeRow({ footage_encrypted: false, review_date: "2026-03-01" })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_encryption")!;
      expect(alert.message).toContain("2026-03-01");
    });

    it("does not fire when footage_encrypted is true", () => {
      const records = [makeRow({ footage_encrypted: true })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "no_encryption");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple unencrypted records", () => {
      const records = [
        makeRow({ footage_encrypted: false }),
        makeRow({ footage_encrypted: false }),
        makeRow({ footage_encrypted: true }),
      ];
      const alerts = identifyCctvComplianceAlerts(records);
      const encAlerts = alerts.filter((a) => a.type === "no_encryption");
      expect(encAlerts).toHaveLength(2);
    });
  });

  // -- sar_not_responded alert ------------------------------------------------

  describe("sar_not_responded alert", () => {
    it("fires when SAR received but not responded in time", () => {
      const records = [makeRow({ sar_received: true, sar_responded_in_time: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "sar_not_responded");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const records = [makeRow({ sar_received: true, sar_responded_in_time: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "sar_not_responded")!;
      expect(alert.severity).toBe("medium");
    });

    it("uses the record id as record_id", () => {
      const records = [makeRow({ id: "rec-sar-1", sar_received: true, sar_responded_in_time: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "sar_not_responded")!;
      expect(alert.record_id).toBe("rec-sar-1");
    });

    it("includes camera_location in message", () => {
      const records = [makeRow({ sar_received: true, sar_responded_in_time: false, camera_location: "Stairwell" })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "sar_not_responded")!;
      expect(alert.message).toContain("Stairwell");
    });

    it("includes review_date in message", () => {
      const records = [makeRow({ sar_received: true, sar_responded_in_time: false, review_date: "2026-01-15" })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "sar_not_responded")!;
      expect(alert.message).toContain("2026-01-15");
    });

    it("does not fire when sar_received is false", () => {
      const records = [makeRow({ sar_received: false, sar_responded_in_time: null })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "sar_not_responded");
      expect(alert).toBeUndefined();
    });

    it("does not fire when sar_responded_in_time is true", () => {
      const records = [makeRow({ sar_received: true, sar_responded_in_time: true })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "sar_not_responded");
      expect(alert).toBeUndefined();
    });

    it("does not fire when sar_responded_in_time is null", () => {
      const records = [makeRow({ sar_received: true, sar_responded_in_time: null })];
      const alerts = identifyCctvComplianceAlerts(records);
      const alert = alerts.find((a) => a.type === "sar_not_responded");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple SARs not responded", () => {
      const records = [
        makeRow({ sar_received: true, sar_responded_in_time: false }),
        makeRow({ sar_received: true, sar_responded_in_time: false }),
        makeRow({ sar_received: true, sar_responded_in_time: true }),
      ];
      const alerts = identifyCctvComplianceAlerts(records);
      const sarAlerts = alerts.filter((a) => a.type === "sar_not_responded");
      expect(sarAlerts).toHaveLength(2);
    });
  });

  // -- combined alerts --------------------------------------------------------

  describe("combined alerts", () => {
    it("can fire all alert types simultaneously", () => {
      const records = [
        makeRow({
          id: "r1",
          dpia_completed: false,
          children_informed: false,
          signage_in_place: false,
          compliance_status: "Non-Compliant",
          footage_encrypted: false,
          sar_received: true,
          sar_responded_in_time: false,
        }),
      ];
      const alerts = identifyCctvComplianceAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("no_dpia");
      expect(types).toContain("children_not_informed");
      expect(types).toContain("no_signage");
      expect(types).toContain("non_compliant_status");
      expect(types).toContain("no_encryption");
      expect(types).toContain("sar_not_responded");
    });

    it("returns correct total number of alerts for combined scenario", () => {
      const records = [
        makeRow({
          dpia_completed: false,
          children_informed: false,
          signage_in_place: false,
          compliance_status: "Non-Compliant",
          footage_encrypted: false,
          sar_received: true,
          sar_responded_in_time: false,
        }),
      ];
      const alerts = identifyCctvComplianceAlerts(records);
      // no_dpia=1, children_not_informed=1, no_signage=1, non_compliant=1, no_encryption=1, sar_not_responded=1
      expect(alerts).toHaveLength(6);
    });

    it("per-record alerts multiply with multiple records", () => {
      const records = [
        makeRow({ dpia_completed: false }),
        makeRow({ dpia_completed: false }),
      ];
      const alerts = identifyCctvComplianceAlerts(records);
      expect(alerts.filter((a) => a.type === "no_dpia")).toHaveLength(2);
    });
  });

  // -- alert structure --------------------------------------------------------

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const records = [
        makeRow({ dpia_completed: false, footage_encrypted: false }),
      ];
      const alerts = identifyCctvComplianceAlerts(records);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const records = [
        makeRow({
          dpia_completed: false,
          children_informed: false,
          signage_in_place: false,
          compliance_status: "Non-Compliant",
          footage_encrypted: false,
          sar_received: true,
          sar_responded_in_time: false,
        }),
      ];
      const alerts = identifyCctvComplianceAlerts(records);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const records = [makeRow({ dpia_completed: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });

  // -- edge cases -------------------------------------------------------------

  describe("edge cases", () => {
    it("clean record triggers no alerts", () => {
      const records = [makeRow({ dpia_completed: true, children_informed: true, signage_in_place: true, compliance_status: "Compliant", footage_encrypted: true, sar_received: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("Compliant status does not trigger non_compliant_status", () => {
      const records = [makeRow({ compliance_status: "Compliant", dpia_completed: true, children_informed: true, signage_in_place: true, footage_encrypted: true, sar_received: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant_status");
      expect(ncAlerts).toHaveLength(0);
    });

    it("Action Required status does not trigger non_compliant_status", () => {
      const records = [makeRow({ compliance_status: "Action Required", dpia_completed: true, children_informed: true, signage_in_place: true, footage_encrypted: true, sar_received: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant_status");
      expect(ncAlerts).toHaveLength(0);
    });

    it("Under Review status does not trigger non_compliant_status", () => {
      const records = [makeRow({ compliance_status: "Under Review", dpia_completed: true, children_informed: true, signage_in_place: true, footage_encrypted: true, sar_received: false })];
      const alerts = identifyCctvComplianceAlerts(records);
      const ncAlerts = alerts.filter((a) => a.type === "non_compliant_status");
      expect(ncAlerts).toHaveLength(0);
    });

    it("SAR received with null response does not trigger sar_not_responded", () => {
      const records = [makeRow({ sar_received: true, sar_responded_in_time: null, dpia_completed: true, children_informed: true, signage_in_place: true, compliance_status: "Compliant", footage_encrypted: true })];
      const alerts = identifyCctvComplianceAlerts(records);
      const sarAlerts = alerts.filter((a) => a.type === "sar_not_responded");
      expect(sarAlerts).toHaveLength(0);
    });

    it("SAR received with true response does not trigger sar_not_responded", () => {
      const records = [makeRow({ sar_received: true, sar_responded_in_time: true, dpia_completed: true, children_informed: true, signage_in_place: true, compliance_status: "Compliant", footage_encrypted: true })];
      const alerts = identifyCctvComplianceAlerts(records);
      const sarAlerts = alerts.filter((a) => a.type === "sar_not_responded");
      expect(sarAlerts).toHaveLength(0);
    });

    it("no SAR received does not trigger sar_not_responded", () => {
      const records = [makeRow({ sar_received: false, dpia_completed: true, children_informed: true, signage_in_place: true, compliance_status: "Compliant", footage_encrypted: true })];
      const alerts = identifyCctvComplianceAlerts(records);
      const sarAlerts = alerts.filter((a) => a.type === "sar_not_responded");
      expect(sarAlerts).toHaveLength(0);
    });
  });
});

// ==============================================================================
// generateCctvComplianceCaraInsights
// ==============================================================================

describe("generateCctvComplianceCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const records = [makeRow()];
    const insights = generateCctvComplianceCaraInsights(records);
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights for empty array", () => {
    const insights = generateCctvComplianceCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [zinc]", () => {
    const records = [makeRow()];
    const insights = generateCctvComplianceCaraInsights(records);
    expect(insights[0]).toMatch(/^\[zinc\]/);
  });

  it("second insight starts with [amber]", () => {
    const records = [makeRow()];
    const insights = generateCctvComplianceCaraInsights(records);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("third insight starts with [reflect]", () => {
    const records = [makeRow()];
    const insights = generateCctvComplianceCaraInsights(records);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("all insights are non-empty strings", () => {
    const records = [makeRow()];
    const insights = generateCctvComplianceCaraInsights(records);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  describe("first insight (zinc) -- summary stats", () => {
    it("includes total review count", () => {
      const records = [makeRow(), makeRow(), makeRow()];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[0]).toContain("3 CCTV compliance reviews");
    });

    it("includes unique location count", () => {
      const records = [
        makeRow({ camera_location: "Front Entrance" }),
        makeRow({ camera_location: "Rear Garden" }),
      ];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[0]).toContain("2 locations");
    });

    it("uses singular location for count of 1", () => {
      const records = [makeRow({ camera_location: "Front Entrance" })];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[0]).toContain("1 location");
    });

    it("includes unique reviewer count", () => {
      const records = [
        makeRow({ reviewer_name: "Reviewer A" }),
        makeRow({ reviewer_name: "Reviewer B" }),
      ];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[0]).toContain("2 reviewers");
    });

    it("uses singular reviewer for count of 1", () => {
      const records = [makeRow({ reviewer_name: "Single Reviewer" })];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[0]).toContain("1 reviewer");
    });

    it("includes DPIA rate", () => {
      const records = [makeRow({ dpia_completed: true })];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[0]).toContain("100%");
    });

    it("uses singular review for count of 1", () => {
      const records = [makeRow()];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[0]).toContain("1 CCTV compliance review");
    });
  });

  describe("second insight (amber) -- priority concerns", () => {
    it("mentions critical and high alerts when present", () => {
      const records = [makeRow({ dpia_completed: false, signage_in_place: false })];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[1]).toContain("critical");
      expect(insights[1]).toContain("high");
    });

    it("mentions non-compliant count when alerts present", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[1]).toContain("non-compliant");
    });

    it("mentions no critical alerts when all clean", () => {
      const records = [makeRow({ dpia_completed: true, children_informed: true, signage_in_place: true, compliance_status: "Compliant", footage_encrypted: true, sar_received: false })];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[1]).toContain("No critical or high-priority");
    });

    it("mentions data protection standards when no alerts", () => {
      const records = [makeRow({ dpia_completed: true, children_informed: true, signage_in_place: true, compliance_status: "Compliant", footage_encrypted: true, sar_received: false })];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[1]).toContain("data protection");
    });

    it("uses singular for 1 non-compliant camera", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[1]).toContain("camera is");
    });

    it("uses plural for multiple non-compliant cameras", () => {
      const records = [
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Non-Compliant" }),
      ];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[1]).toContain("cameras are");
    });

    it("uses singular for 1 review requiring action", () => {
      const records = [makeRow({ compliance_status: "Action Required", dpia_completed: false })];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[1]).toContain("review requires");
    });

    it("uses plural for multiple reviews requiring action", () => {
      const records = [
        makeRow({ compliance_status: "Action Required", dpia_completed: false }),
        makeRow({ compliance_status: "Action Required", dpia_completed: false }),
      ];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[1]).toContain("reviews require");
    });
  });

  describe("third insight (reflect) -- reflective question", () => {
    it("mentions non-compliant when present", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[2]).toContain("non-compliant");
    });

    it("uses singular for 1 non-compliant camera", () => {
      const records = [makeRow({ compliance_status: "Non-Compliant" })];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[2]).toContain("CCTV camera has");
    });

    it("uses plural for multiple non-compliant cameras", () => {
      const records = [
        makeRow({ compliance_status: "Non-Compliant" }),
        makeRow({ compliance_status: "Non-Compliant" }),
      ];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[2]).toContain("CCTV cameras have");
    });

    it("asks about action required and SARs when no non-compliant but issues found", () => {
      const records = [makeRow({ compliance_status: "Action Required", dpia_completed: false })];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[2]).toContain("action");
    });

    it("asks about SARs when SARs received but no non-compliant", () => {
      const records = [makeRow({ compliance_status: "Compliant", sar_received: true, sar_responded_in_time: true, dpia_completed: true, children_informed: true, signage_in_place: true, footage_encrypted: true })];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[2]).toContain("SAR");
    });

    it("provides positive reflection when all clean", () => {
      const records = [makeRow({ compliance_status: "Compliant", dpia_completed: true, children_informed: true, signage_in_place: true, footage_encrypted: true, sar_received: false })];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[2]).toContain("no non-compliant");
    });

    it("asks about children and staff awareness in positive reflection", () => {
      const records = [makeRow({ compliance_status: "Compliant", dpia_completed: true, children_informed: true, signage_in_place: true, footage_encrypted: true, sar_received: false })];
      const insights = generateCctvComplianceCaraInsights(records);
      expect(insights[2]).toContain("children");
      expect(insights[2]).toContain("staff");
    });
  });
});

// ==============================================================================
// makeRow factory helper validation
// ==============================================================================

describe("makeRow factory helper", () => {
  it("creates a record with sensible defaults", () => {
    const r = makeRow();
    expect(r.home_id).toBe("home-1");
    expect(r.review_date).toBe("2026-05-01");
    expect(r.reviewer_name).toBe("John Smith");
    expect(r.camera_location).toBe("Front Entrance");
    expect(r.camera_purpose).toBe("Security");
    expect(r.dpia_completed).toBe(true);
    expect(r.signage_in_place).toBe(true);
    expect(r.retention_period_days).toBe(30);
    expect(r.retention_compliant).toBe(true);
    expect(r.data_protection_registered).toBe(true);
    expect(r.footage_accessible).toBe(true);
    expect(r.footage_encrypted).toBe(true);
    expect(r.access_log_maintained).toBe(true);
    expect(r.sar_received).toBe(false);
    expect(r.sar_responded_in_time).toBeNull();
    expect(r.children_informed).toBe(true);
    expect(r.staff_informed).toBe(true);
    expect(r.privacy_zones_set).toBe(true);
    expect(r.compliance_status).toBe("Compliant");
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRow({ camera_purpose: "Safeguarding", compliance_status: "Non-Compliant" });
    expect(r.camera_purpose).toBe("Safeguarding");
    expect(r.compliance_status).toBe("Non-Compliant");
    // defaults still apply
    expect(r.camera_location).toBe("Front Entrance");
  });

  it("generates unique ids by default", () => {
    const r1 = makeRow();
    const r2 = makeRow();
    expect(r1.id).not.toBe(r2.id);
  });

  it("allows overriding id", () => {
    const r = makeRow({ id: "custom-id" });
    expect(r.id).toBe("custom-id");
  });

  it("allows setting nullable fields to null", () => {
    const r = makeRow({ sar_responded_in_time: null, notes: null });
    expect(r.sar_responded_in_time).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows setting camera_purpose", () => {
    const r = makeRow({ camera_purpose: "Car Park" });
    expect(r.camera_purpose).toBe("Car Park");
  });

  it("allows setting boolean fields", () => {
    const r = makeRow({ dpia_completed: false, signage_in_place: false, retention_compliant: false, data_protection_registered: false, footage_accessible: false, footage_encrypted: false, access_log_maintained: false, sar_received: true, children_informed: false, staff_informed: false, privacy_zones_set: false });
    expect(r.dpia_completed).toBe(false);
    expect(r.signage_in_place).toBe(false);
    expect(r.retention_compliant).toBe(false);
    expect(r.data_protection_registered).toBe(false);
    expect(r.footage_accessible).toBe(false);
    expect(r.footage_encrypted).toBe(false);
    expect(r.access_log_maintained).toBe(false);
    expect(r.sar_received).toBe(true);
    expect(r.children_informed).toBe(false);
    expect(r.staff_informed).toBe(false);
    expect(r.privacy_zones_set).toBe(false);
  });

  it("allows setting camera_location", () => {
    const r = makeRow({ camera_location: "Car Park" });
    expect(r.camera_location).toBe("Car Park");
  });

  it("allows setting retention_period_days", () => {
    const r = makeRow({ retention_period_days: 90 });
    expect(r.retention_period_days).toBe(90);
  });

  it("allows setting sar_responded_in_time", () => {
    const r = makeRow({ sar_responded_in_time: true });
    expect(r.sar_responded_in_time).toBe(true);
  });

  it("allows setting notes", () => {
    const r = makeRow({ notes: "Test note" });
    expect(r.notes).toBe("Test note");
  });

  it("allows setting compliance_status", () => {
    const r = makeRow({ compliance_status: "Under Review" });
    expect(r.compliance_status).toBe("Under Review");
  });

  it("allows setting reviewer_name", () => {
    const r = makeRow({ reviewer_name: "Jane Doe" });
    expect(r.reviewer_name).toBe("Jane Doe");
  });

  it("allows setting review_date", () => {
    const r = makeRow({ review_date: "2026-06-15" });
    expect(r.review_date).toBe("2026-06-15");
  });
});
