// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — GIFTS & HOSPITALITY SERVICE TESTS
// Pure-function tests for gift metrics, alert identification,
// constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  GIFT_DIRECTIONS,
  GIFT_SOURCES,
  APPROVAL_STATUSES,
  DECLARATION_STATUSES,
  _testing,
} from "../gifts-hospitality-service";

import type {
  GiftRecord,
  GiftDirection,
  GiftSource,
  ApprovalStatus,
  DeclarationStatus,
} from "../gifts-hospitality-service";

const { computeGiftMetrics, identifyGiftAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides?: Partial<GiftRecord>,
): GiftRecord {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    gift_date: "gift_date" in (overrides ?? {}) ? overrides!.gift_date! : "2026-05-01",
    direction: "direction" in (overrides ?? {}) ? overrides!.direction! : "received",
    source: "source" in (overrides ?? {}) ? overrides!.source! : "parent_carer",
    description: "description" in (overrides ?? {}) ? overrides!.description! : "Box of chocolates",
    estimated_value: "estimated_value" in (overrides ?? {}) ? overrides!.estimated_value! : 10,
    approval_status: "approval_status" in (overrides ?? {}) ? overrides!.approval_status! : "approved",
    declaration_status: "declaration_status" in (overrides ?? {}) ? overrides!.declaration_status! : "declared",
    staff_name: "staff_name" in (overrides ?? {}) ? overrides!.staff_name! : "Jane Smith",
    approved_by: "approved_by" in (overrides ?? {}) ? (overrides!.approved_by ?? null) : null,
    conflict_of_interest: "conflict_of_interest" in (overrides ?? {}) ? overrides!.conflict_of_interest! : false,
    child_involved: "child_involved" in (overrides ?? {}) ? overrides!.child_involved! : false,
    receipt_kept: "receipt_kept" in (overrides ?? {}) ? overrides!.receipt_kept! : true,
    policy_compliant: "policy_compliant" in (overrides ?? {}) ? overrides!.policy_compliant! : true,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-05-01T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-05-01T08:00:00Z",
  };
}

// ── Constants ──────────────────────────────────────────────────────────────

describe("Constants", () => {
  describe("GIFT_DIRECTIONS", () => {
    it("has exactly 5 items", () => {
      expect(GIFT_DIRECTIONS).toHaveLength(5);
    });

    it("contains received", () => {
      expect(GIFT_DIRECTIONS).toContainEqual({ direction: "received", label: "Received" });
    });

    it("contains given", () => {
      expect(GIFT_DIRECTIONS).toContainEqual({ direction: "given", label: "Given" });
    });

    it("contains offered_declined", () => {
      expect(GIFT_DIRECTIONS).toContainEqual({ direction: "offered_declined", label: "Offered & Declined" });
    });

    it("contains hospitality_received", () => {
      expect(GIFT_DIRECTIONS).toContainEqual({ direction: "hospitality_received", label: "Hospitality Received" });
    });

    it("contains hospitality_given", () => {
      expect(GIFT_DIRECTIONS).toContainEqual({ direction: "hospitality_given", label: "Hospitality Given" });
    });

    it("has unique direction values", () => {
      const directions = GIFT_DIRECTIONS.map((d) => d.direction);
      expect(new Set(directions).size).toBe(directions.length);
    });

    it("has unique labels", () => {
      const labels = GIFT_DIRECTIONS.map((d) => d.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of GIFT_DIRECTIONS) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("GIFT_SOURCES", () => {
    it("has exactly 8 items", () => {
      expect(GIFT_SOURCES).toHaveLength(8);
    });

    it("contains parent_carer", () => {
      expect(GIFT_SOURCES).toContainEqual({ source: "parent_carer", label: "Parent/Carer" });
    });

    it("contains child_young_person", () => {
      expect(GIFT_SOURCES).toContainEqual({ source: "child_young_person", label: "Child/Young Person" });
    });

    it("contains professional", () => {
      expect(GIFT_SOURCES).toContainEqual({ source: "professional", label: "Professional" });
    });

    it("contains contractor", () => {
      expect(GIFT_SOURCES).toContainEqual({ source: "contractor", label: "Contractor" });
    });

    it("contains placing_authority", () => {
      expect(GIFT_SOURCES).toContainEqual({ source: "placing_authority", label: "Placing Authority" });
    });

    it("contains charity", () => {
      expect(GIFT_SOURCES).toContainEqual({ source: "charity", label: "Charity" });
    });

    it("contains supplier", () => {
      expect(GIFT_SOURCES).toContainEqual({ source: "supplier", label: "Supplier" });
    });

    it("contains other", () => {
      expect(GIFT_SOURCES).toContainEqual({ source: "other", label: "Other" });
    });

    it("has unique source values", () => {
      const sources = GIFT_SOURCES.map((s) => s.source);
      expect(new Set(sources).size).toBe(sources.length);
    });

    it("has unique labels", () => {
      const labels = GIFT_SOURCES.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of GIFT_SOURCES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("APPROVAL_STATUSES", () => {
    it("has exactly 5 items", () => {
      expect(APPROVAL_STATUSES).toHaveLength(5);
    });

    it("contains approved", () => {
      expect(APPROVAL_STATUSES).toContainEqual({ status: "approved", label: "Approved" });
    });

    it("contains pending", () => {
      expect(APPROVAL_STATUSES).toContainEqual({ status: "pending", label: "Pending" });
    });

    it("contains declined", () => {
      expect(APPROVAL_STATUSES).toContainEqual({ status: "declined", label: "Declined" });
    });

    it("contains returned", () => {
      expect(APPROVAL_STATUSES).toContainEqual({ status: "returned", label: "Returned" });
    });

    it("contains not_required", () => {
      expect(APPROVAL_STATUSES).toContainEqual({ status: "not_required", label: "Not Required" });
    });

    it("has unique status values", () => {
      const statuses = APPROVAL_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has unique labels", () => {
      const labels = APPROVAL_STATUSES.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of APPROVAL_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe("DECLARATION_STATUSES", () => {
    it("has exactly 4 items", () => {
      expect(DECLARATION_STATUSES).toHaveLength(4);
    });

    it("contains declared", () => {
      expect(DECLARATION_STATUSES).toContainEqual({ status: "declared", label: "Declared" });
    });

    it("contains not_declared", () => {
      expect(DECLARATION_STATUSES).toContainEqual({ status: "not_declared", label: "Not Declared" });
    });

    it("contains late_declaration", () => {
      expect(DECLARATION_STATUSES).toContainEqual({ status: "late_declaration", label: "Late Declaration" });
    });

    it("contains under_review", () => {
      expect(DECLARATION_STATUSES).toContainEqual({ status: "under_review", label: "Under Review" });
    });

    it("has unique status values", () => {
      const statuses = DECLARATION_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });

    it("has unique labels", () => {
      const labels = DECLARATION_STATUSES.map((s) => s.label);
      expect(new Set(labels).size).toBe(labels.length);
    });

    it("every entry has a non-empty label", () => {
      for (const entry of DECLARATION_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── computeGiftMetrics ─────────────────────────────────────────────────────

describe("computeGiftMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_records", () => {
      const m = computeGiftMetrics([]);
      expect(m.total_records).toBe(0);
    });

    it("returns zero received_count", () => {
      const m = computeGiftMetrics([]);
      expect(m.received_count).toBe(0);
    });

    it("returns zero given_count", () => {
      const m = computeGiftMetrics([]);
      expect(m.given_count).toBe(0);
    });

    it("returns zero declined_count", () => {
      const m = computeGiftMetrics([]);
      expect(m.declined_count).toBe(0);
    });

    it("returns zero hospitality_count", () => {
      const m = computeGiftMetrics([]);
      expect(m.hospitality_count).toBe(0);
    });

    it("returns zero total_value", () => {
      const m = computeGiftMetrics([]);
      expect(m.total_value).toBe(0);
    });

    it("returns zero average_value", () => {
      const m = computeGiftMetrics([]);
      expect(m.average_value).toBe(0);
    });

    it("returns zero approved_rate", () => {
      const m = computeGiftMetrics([]);
      expect(m.approved_rate).toBe(0);
    });

    it("returns zero pending_count", () => {
      const m = computeGiftMetrics([]);
      expect(m.pending_count).toBe(0);
    });

    it("returns zero declared_rate", () => {
      const m = computeGiftMetrics([]);
      expect(m.declared_rate).toBe(0);
    });

    it("returns zero not_declared_count", () => {
      const m = computeGiftMetrics([]);
      expect(m.not_declared_count).toBe(0);
    });

    it("returns zero late_declaration_count", () => {
      const m = computeGiftMetrics([]);
      expect(m.late_declaration_count).toBe(0);
    });

    it("returns zero conflict_of_interest_count", () => {
      const m = computeGiftMetrics([]);
      expect(m.conflict_of_interest_count).toBe(0);
    });

    it("returns zero child_involved_count", () => {
      const m = computeGiftMetrics([]);
      expect(m.child_involved_count).toBe(0);
    });

    it("returns zero receipt_kept_rate", () => {
      const m = computeGiftMetrics([]);
      expect(m.receipt_kept_rate).toBe(0);
    });

    it("returns zero policy_compliant_rate", () => {
      const m = computeGiftMetrics([]);
      expect(m.policy_compliant_rate).toBe(0);
    });

    it("returns empty by_direction", () => {
      const m = computeGiftMetrics([]);
      expect(m.by_direction).toEqual({});
    });

    it("returns empty by_source", () => {
      const m = computeGiftMetrics([]);
      expect(m.by_source).toEqual({});
    });

    it("returns empty by_approval_status", () => {
      const m = computeGiftMetrics([]);
      expect(m.by_approval_status).toEqual({});
    });

    it("returns empty by_declaration_status", () => {
      const m = computeGiftMetrics([]);
      expect(m.by_declaration_status).toEqual({});
    });
  });

  describe("single record — all positive flags", () => {
    const record = makeRecord({
      direction: "received",
      source: "parent_carer",
      estimated_value: 25,
      approval_status: "approved",
      declaration_status: "declared",
      conflict_of_interest: true,
      child_involved: true,
      receipt_kept: true,
      policy_compliant: true,
    });

    it("returns total_records = 1", () => {
      const m = computeGiftMetrics([record]);
      expect(m.total_records).toBe(1);
    });

    it("returns received_count = 1", () => {
      const m = computeGiftMetrics([record]);
      expect(m.received_count).toBe(1);
    });

    it("returns given_count = 0", () => {
      const m = computeGiftMetrics([record]);
      expect(m.given_count).toBe(0);
    });

    it("returns declined_count = 0", () => {
      const m = computeGiftMetrics([record]);
      expect(m.declined_count).toBe(0);
    });

    it("returns hospitality_count = 0", () => {
      const m = computeGiftMetrics([record]);
      expect(m.hospitality_count).toBe(0);
    });

    it("returns total_value = 25", () => {
      const m = computeGiftMetrics([record]);
      expect(m.total_value).toBe(25);
    });

    it("returns average_value = 25", () => {
      const m = computeGiftMetrics([record]);
      expect(m.average_value).toBe(25);
    });

    it("returns approved_rate = 100", () => {
      const m = computeGiftMetrics([record]);
      expect(m.approved_rate).toBe(100);
    });

    it("returns pending_count = 0", () => {
      const m = computeGiftMetrics([record]);
      expect(m.pending_count).toBe(0);
    });

    it("returns declared_rate = 100", () => {
      const m = computeGiftMetrics([record]);
      expect(m.declared_rate).toBe(100);
    });

    it("returns not_declared_count = 0", () => {
      const m = computeGiftMetrics([record]);
      expect(m.not_declared_count).toBe(0);
    });

    it("returns late_declaration_count = 0", () => {
      const m = computeGiftMetrics([record]);
      expect(m.late_declaration_count).toBe(0);
    });

    it("returns conflict_of_interest_count = 1", () => {
      const m = computeGiftMetrics([record]);
      expect(m.conflict_of_interest_count).toBe(1);
    });

    it("returns child_involved_count = 1", () => {
      const m = computeGiftMetrics([record]);
      expect(m.child_involved_count).toBe(1);
    });

    it("returns receipt_kept_rate = 100", () => {
      const m = computeGiftMetrics([record]);
      expect(m.receipt_kept_rate).toBe(100);
    });

    it("returns policy_compliant_rate = 100", () => {
      const m = computeGiftMetrics([record]);
      expect(m.policy_compliant_rate).toBe(100);
    });

    it("returns by_direction with single entry", () => {
      const m = computeGiftMetrics([record]);
      expect(m.by_direction).toEqual({ received: 1 });
    });

    it("returns by_source with single entry", () => {
      const m = computeGiftMetrics([record]);
      expect(m.by_source).toEqual({ parent_carer: 1 });
    });

    it("returns by_approval_status with single entry", () => {
      const m = computeGiftMetrics([record]);
      expect(m.by_approval_status).toEqual({ approved: 1 });
    });

    it("returns by_declaration_status with single entry", () => {
      const m = computeGiftMetrics([record]);
      expect(m.by_declaration_status).toEqual({ declared: 1 });
    });
  });

  describe("multiple records — mixed directions", () => {
    const records = [
      makeRecord({ direction: "received", source: "parent_carer", estimated_value: 20, approval_status: "approved", declaration_status: "declared", conflict_of_interest: false, child_involved: false, receipt_kept: true, policy_compliant: true }),
      makeRecord({ direction: "given", source: "professional", estimated_value: 30, approval_status: "pending", declaration_status: "not_declared", conflict_of_interest: true, child_involved: true, receipt_kept: false, policy_compliant: false }),
      makeRecord({ direction: "offered_declined", source: "contractor", estimated_value: 15, approval_status: "declined", declaration_status: "late_declaration", conflict_of_interest: false, child_involved: false, receipt_kept: true, policy_compliant: true }),
      makeRecord({ direction: "hospitality_received", source: "placing_authority", estimated_value: 55, approval_status: "approved", declaration_status: "declared", conflict_of_interest: true, child_involved: true, receipt_kept: true, policy_compliant: true }),
      makeRecord({ direction: "hospitality_given", source: "charity", estimated_value: 80, approval_status: "pending", declaration_status: "under_review", conflict_of_interest: false, child_involved: false, receipt_kept: false, policy_compliant: false }),
    ];

    it("returns total_records = 5", () => {
      const m = computeGiftMetrics(records);
      expect(m.total_records).toBe(5);
    });

    it("returns received_count = 1", () => {
      const m = computeGiftMetrics(records);
      expect(m.received_count).toBe(1);
    });

    it("returns given_count = 1", () => {
      const m = computeGiftMetrics(records);
      expect(m.given_count).toBe(1);
    });

    it("returns declined_count = 1", () => {
      const m = computeGiftMetrics(records);
      expect(m.declined_count).toBe(1);
    });

    it("returns hospitality_count = 2", () => {
      const m = computeGiftMetrics(records);
      expect(m.hospitality_count).toBe(2);
    });

    it("returns total_value = 200", () => {
      const m = computeGiftMetrics(records);
      expect(m.total_value).toBe(200);
    });

    it("returns average_value = 40", () => {
      const m = computeGiftMetrics(records);
      expect(m.average_value).toBe(40);
    });

    it("calculates approved_rate correctly (2/5 = 40%)", () => {
      const m = computeGiftMetrics(records);
      expect(m.approved_rate).toBe(40);
    });

    it("returns pending_count = 2", () => {
      const m = computeGiftMetrics(records);
      expect(m.pending_count).toBe(2);
    });

    it("calculates declared_rate correctly (2/5 = 40%)", () => {
      const m = computeGiftMetrics(records);
      expect(m.declared_rate).toBe(40);
    });

    it("returns not_declared_count = 1", () => {
      const m = computeGiftMetrics(records);
      expect(m.not_declared_count).toBe(1);
    });

    it("returns late_declaration_count = 1", () => {
      const m = computeGiftMetrics(records);
      expect(m.late_declaration_count).toBe(1);
    });

    it("returns conflict_of_interest_count = 2", () => {
      const m = computeGiftMetrics(records);
      expect(m.conflict_of_interest_count).toBe(2);
    });

    it("returns child_involved_count = 2", () => {
      const m = computeGiftMetrics(records);
      expect(m.child_involved_count).toBe(2);
    });

    it("calculates receipt_kept_rate correctly (3/5 = 60%)", () => {
      const m = computeGiftMetrics(records);
      expect(m.receipt_kept_rate).toBe(60);
    });

    it("calculates policy_compliant_rate correctly (3/5 = 60%)", () => {
      const m = computeGiftMetrics(records);
      expect(m.policy_compliant_rate).toBe(60);
    });

    it("returns by_direction with all five directions", () => {
      const m = computeGiftMetrics(records);
      expect(m.by_direction).toEqual({
        received: 1,
        given: 1,
        offered_declined: 1,
        hospitality_received: 1,
        hospitality_given: 1,
      });
    });

    it("returns by_source with correct counts", () => {
      const m = computeGiftMetrics(records);
      expect(m.by_source).toEqual({
        parent_carer: 1,
        professional: 1,
        contractor: 1,
        placing_authority: 1,
        charity: 1,
      });
    });

    it("returns by_approval_status with correct counts", () => {
      const m = computeGiftMetrics(records);
      expect(m.by_approval_status).toEqual({
        approved: 2,
        pending: 2,
        declined: 1,
      });
    });

    it("returns by_declaration_status with correct counts", () => {
      const m = computeGiftMetrics(records);
      expect(m.by_declaration_status).toEqual({
        declared: 2,
        not_declared: 1,
        late_declaration: 1,
        under_review: 1,
      });
    });
  });

  describe("rate calculations — fractional percentages", () => {
    const records = [
      makeRecord({ approval_status: "approved", declaration_status: "declared", receipt_kept: true, policy_compliant: true }),
      makeRecord({ approval_status: "pending", declaration_status: "not_declared", receipt_kept: false, policy_compliant: false }),
      makeRecord({ approval_status: "declined", declaration_status: "late_declaration", receipt_kept: true, policy_compliant: true }),
    ];

    it("calculates approved_rate correctly (1/3 = 33.3%)", () => {
      const m = computeGiftMetrics(records);
      expect(m.approved_rate).toBe(33.3);
    });

    it("calculates declared_rate correctly (1/3 = 33.3%)", () => {
      const m = computeGiftMetrics(records);
      expect(m.declared_rate).toBe(33.3);
    });

    it("calculates receipt_kept_rate correctly (2/3 = 66.7%)", () => {
      const m = computeGiftMetrics(records);
      expect(m.receipt_kept_rate).toBe(66.7);
    });

    it("calculates policy_compliant_rate correctly (2/3 = 66.7%)", () => {
      const m = computeGiftMetrics(records);
      expect(m.policy_compliant_rate).toBe(66.7);
    });
  });

  describe("financial precision — total_value and average_value", () => {
    it("handles decimal values without floating-point drift", () => {
      const records = [
        makeRecord({ estimated_value: 10.1 }),
        makeRecord({ estimated_value: 20.2 }),
        makeRecord({ estimated_value: 30.3 }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.total_value).toBe(60.6);
    });

    it("rounds average_value to 2 decimal places", () => {
      const records = [
        makeRecord({ estimated_value: 10 }),
        makeRecord({ estimated_value: 20 }),
        makeRecord({ estimated_value: 33 }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.average_value).toBe(21);
    });

    it("rounds average_value for non-even split", () => {
      const records = [
        makeRecord({ estimated_value: 10 }),
        makeRecord({ estimated_value: 10 }),
        makeRecord({ estimated_value: 10 }),
        makeRecord({ estimated_value: 10 }),
        makeRecord({ estimated_value: 10 }),
        makeRecord({ estimated_value: 10 }),
        makeRecord({ estimated_value: 10 }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.average_value).toBe(10);
    });

    it("handles zero estimated_value records", () => {
      const records = [
        makeRecord({ estimated_value: 0 }),
        makeRecord({ estimated_value: 0 }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.total_value).toBe(0);
      expect(m.average_value).toBe(0);
    });

    it("handles single high-value record", () => {
      const records = [makeRecord({ estimated_value: 999.99 })];
      const m = computeGiftMetrics(records);
      expect(m.total_value).toBe(999.99);
      expect(m.average_value).toBe(999.99);
    });

    it("handles many small decimal values", () => {
      const records = [
        makeRecord({ estimated_value: 0.01 }),
        makeRecord({ estimated_value: 0.02 }),
        makeRecord({ estimated_value: 0.03 }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.total_value).toBe(0.06);
      expect(m.average_value).toBe(0.02);
    });
  });

  describe("direction counting — all types", () => {
    it("counts only received records", () => {
      const records = [
        makeRecord({ direction: "received" }),
        makeRecord({ direction: "received" }),
        makeRecord({ direction: "given" }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.received_count).toBe(2);
    });

    it("counts only given records", () => {
      const records = [
        makeRecord({ direction: "given" }),
        makeRecord({ direction: "given" }),
        makeRecord({ direction: "given" }),
        makeRecord({ direction: "received" }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.given_count).toBe(3);
    });

    it("counts only offered_declined records", () => {
      const records = [
        makeRecord({ direction: "offered_declined" }),
        makeRecord({ direction: "received" }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.declined_count).toBe(1);
    });

    it("counts hospitality_received as hospitality", () => {
      const records = [
        makeRecord({ direction: "hospitality_received" }),
        makeRecord({ direction: "received" }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.hospitality_count).toBe(1);
    });

    it("counts hospitality_given as hospitality", () => {
      const records = [
        makeRecord({ direction: "hospitality_given" }),
        makeRecord({ direction: "received" }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.hospitality_count).toBe(1);
    });

    it("counts both hospitality types together", () => {
      const records = [
        makeRecord({ direction: "hospitality_received" }),
        makeRecord({ direction: "hospitality_given" }),
        makeRecord({ direction: "hospitality_received" }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.hospitality_count).toBe(3);
    });
  });

  describe("approval status counting", () => {
    it("counts pending records correctly", () => {
      const records = [
        makeRecord({ approval_status: "pending" }),
        makeRecord({ approval_status: "pending" }),
        makeRecord({ approval_status: "approved" }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.pending_count).toBe(2);
    });

    it("calculates approved_rate for all approved", () => {
      const records = [
        makeRecord({ approval_status: "approved" }),
        makeRecord({ approval_status: "approved" }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.approved_rate).toBe(100);
    });

    it("calculates approved_rate for none approved", () => {
      const records = [
        makeRecord({ approval_status: "pending" }),
        makeRecord({ approval_status: "declined" }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.approved_rate).toBe(0);
    });
  });

  describe("declaration status counting", () => {
    it("counts not_declared records correctly", () => {
      const records = [
        makeRecord({ declaration_status: "not_declared" }),
        makeRecord({ declaration_status: "not_declared" }),
        makeRecord({ declaration_status: "declared" }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.not_declared_count).toBe(2);
    });

    it("counts late_declaration records correctly", () => {
      const records = [
        makeRecord({ declaration_status: "late_declaration" }),
        makeRecord({ declaration_status: "late_declaration" }),
        makeRecord({ declaration_status: "late_declaration" }),
        makeRecord({ declaration_status: "declared" }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.late_declaration_count).toBe(3);
    });

    it("calculates declared_rate for all declared", () => {
      const records = [
        makeRecord({ declaration_status: "declared" }),
        makeRecord({ declaration_status: "declared" }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.declared_rate).toBe(100);
    });

    it("calculates declared_rate for none declared", () => {
      const records = [
        makeRecord({ declaration_status: "not_declared" }),
        makeRecord({ declaration_status: "late_declaration" }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.declared_rate).toBe(0);
    });
  });

  describe("boolean field counting", () => {
    it("counts conflict_of_interest records correctly", () => {
      const records = [
        makeRecord({ conflict_of_interest: true }),
        makeRecord({ conflict_of_interest: true }),
        makeRecord({ conflict_of_interest: false }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.conflict_of_interest_count).toBe(2);
    });

    it("counts zero conflict_of_interest when all false", () => {
      const records = [
        makeRecord({ conflict_of_interest: false }),
        makeRecord({ conflict_of_interest: false }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.conflict_of_interest_count).toBe(0);
    });

    it("counts child_involved records correctly", () => {
      const records = [
        makeRecord({ child_involved: true }),
        makeRecord({ child_involved: false }),
        makeRecord({ child_involved: true }),
        makeRecord({ child_involved: true }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.child_involved_count).toBe(3);
    });

    it("counts zero child_involved when all false", () => {
      const records = [
        makeRecord({ child_involved: false }),
        makeRecord({ child_involved: false }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.child_involved_count).toBe(0);
    });

    it("calculates receipt_kept_rate for all kept", () => {
      const records = [
        makeRecord({ receipt_kept: true }),
        makeRecord({ receipt_kept: true }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.receipt_kept_rate).toBe(100);
    });

    it("calculates receipt_kept_rate for none kept", () => {
      const records = [
        makeRecord({ receipt_kept: false }),
        makeRecord({ receipt_kept: false }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.receipt_kept_rate).toBe(0);
    });

    it("calculates policy_compliant_rate for all compliant", () => {
      const records = [
        makeRecord({ policy_compliant: true }),
        makeRecord({ policy_compliant: true }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.policy_compliant_rate).toBe(100);
    });

    it("calculates policy_compliant_rate for none compliant", () => {
      const records = [
        makeRecord({ policy_compliant: false }),
        makeRecord({ policy_compliant: false }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.policy_compliant_rate).toBe(0);
    });
  });

  describe("by_direction breakdown", () => {
    it("groups multiple records into correct direction buckets", () => {
      const records = [
        makeRecord({ direction: "received" }),
        makeRecord({ direction: "received" }),
        makeRecord({ direction: "given" }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.by_direction).toEqual({ received: 2, given: 1 });
    });

    it("includes all directions when present", () => {
      const records = [
        makeRecord({ direction: "received" }),
        makeRecord({ direction: "given" }),
        makeRecord({ direction: "offered_declined" }),
        makeRecord({ direction: "hospitality_received" }),
        makeRecord({ direction: "hospitality_given" }),
      ];
      const m = computeGiftMetrics(records);
      expect(Object.keys(m.by_direction)).toHaveLength(5);
    });
  });

  describe("by_source breakdown", () => {
    it("groups multiple records into correct source buckets", () => {
      const records = [
        makeRecord({ source: "parent_carer" }),
        makeRecord({ source: "parent_carer" }),
        makeRecord({ source: "professional" }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.by_source).toEqual({ parent_carer: 2, professional: 1 });
    });

    it("handles all source types", () => {
      const records = [
        makeRecord({ source: "parent_carer" }),
        makeRecord({ source: "child_young_person" }),
        makeRecord({ source: "professional" }),
        makeRecord({ source: "contractor" }),
        makeRecord({ source: "placing_authority" }),
        makeRecord({ source: "charity" }),
        makeRecord({ source: "supplier" }),
        makeRecord({ source: "other" }),
      ];
      const m = computeGiftMetrics(records);
      expect(Object.keys(m.by_source)).toHaveLength(8);
    });
  });

  describe("by_approval_status breakdown", () => {
    it("groups multiple records into correct approval buckets", () => {
      const records = [
        makeRecord({ approval_status: "approved" }),
        makeRecord({ approval_status: "approved" }),
        makeRecord({ approval_status: "pending" }),
        makeRecord({ approval_status: "declined" }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.by_approval_status).toEqual({ approved: 2, pending: 1, declined: 1 });
    });

    it("handles all approval status types", () => {
      const records = [
        makeRecord({ approval_status: "approved" }),
        makeRecord({ approval_status: "pending" }),
        makeRecord({ approval_status: "declined" }),
        makeRecord({ approval_status: "returned" }),
        makeRecord({ approval_status: "not_required" }),
      ];
      const m = computeGiftMetrics(records);
      expect(Object.keys(m.by_approval_status)).toHaveLength(5);
    });
  });

  describe("by_declaration_status breakdown", () => {
    it("groups multiple records into correct declaration buckets", () => {
      const records = [
        makeRecord({ declaration_status: "declared" }),
        makeRecord({ declaration_status: "declared" }),
        makeRecord({ declaration_status: "not_declared" }),
      ];
      const m = computeGiftMetrics(records);
      expect(m.by_declaration_status).toEqual({ declared: 2, not_declared: 1 });
    });

    it("handles all declaration status types", () => {
      const records = [
        makeRecord({ declaration_status: "declared" }),
        makeRecord({ declaration_status: "not_declared" }),
        makeRecord({ declaration_status: "late_declaration" }),
        makeRecord({ declaration_status: "under_review" }),
      ];
      const m = computeGiftMetrics(records);
      expect(Object.keys(m.by_declaration_status)).toHaveLength(4);
    });
  });

  describe("large dataset", () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      makeRecord({
        direction: i % 5 === 0 ? "received" : i % 5 === 1 ? "given" : i % 5 === 2 ? "offered_declined" : i % 5 === 3 ? "hospitality_received" : "hospitality_given",
        source: i % 2 === 0 ? "parent_carer" : "professional",
        estimated_value: 10,
        approval_status: i % 4 === 0 ? "approved" : "pending",
        declaration_status: i % 3 === 0 ? "declared" : "not_declared",
        conflict_of_interest: i % 7 === 0,
        child_involved: i % 5 === 0,
        receipt_kept: i % 2 === 0,
        policy_compliant: i % 3 === 0,
      }),
    );

    it("returns total_records = 100", () => {
      const m = computeGiftMetrics(records);
      expect(m.total_records).toBe(100);
    });

    it("returns received_count = 20", () => {
      const m = computeGiftMetrics(records);
      expect(m.received_count).toBe(20);
    });

    it("returns given_count = 20", () => {
      const m = computeGiftMetrics(records);
      expect(m.given_count).toBe(20);
    });

    it("returns declined_count = 20", () => {
      const m = computeGiftMetrics(records);
      expect(m.declined_count).toBe(20);
    });

    it("returns hospitality_count = 40", () => {
      const m = computeGiftMetrics(records);
      expect(m.hospitality_count).toBe(40);
    });

    it("returns total_value = 1000", () => {
      const m = computeGiftMetrics(records);
      expect(m.total_value).toBe(1000);
    });

    it("returns average_value = 10", () => {
      const m = computeGiftMetrics(records);
      expect(m.average_value).toBe(10);
    });

    it("returns child_involved_count = 20", () => {
      const m = computeGiftMetrics(records);
      expect(m.child_involved_count).toBe(20);
    });

    it("calculates receipt_kept_rate correctly (50/100 = 50%)", () => {
      const m = computeGiftMetrics(records);
      expect(m.receipt_kept_rate).toBe(50);
    });
  });
});

// ── identifyGiftAlerts ──────────────────────────────────────────────────────

describe("identifyGiftAlerts", () => {
  describe("empty array", () => {
    it("returns no alerts", () => {
      const alerts = identifyGiftAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns an empty array", () => {
      const alerts = identifyGiftAlerts([]);
      expect(alerts).toEqual([]);
    });
  });

  describe("no triggers — clean records", () => {
    it("returns no alerts for fully compliant records below threshold", () => {
      const records = [
        makeRecord({ conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, approval_status: "approved", estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("returns no alerts when one pending (threshold is 2)", () => {
      const records = [
        makeRecord({ conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, approval_status: "pending", estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      expect(alerts).toHaveLength(0);
    });
  });

  describe("conflict_of_interest alert", () => {
    it("fires a critical alert for a single conflict record", () => {
      const records = [
        makeRecord({ conflict_of_interest: true, staff_name: "Alice", gift_date: "2026-03-15", declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const conflict = alerts.find((a) => a.type === "conflict_of_interest");
      expect(conflict).toBeDefined();
      expect(conflict!.severity).toBe("critical");
    });

    it("includes staff_name in conflict alert message", () => {
      const records = [
        makeRecord({ conflict_of_interest: true, staff_name: "Bob Jones", gift_date: "2026-04-10", declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const conflict = alerts.find((a) => a.type === "conflict_of_interest");
      expect(conflict!.message).toContain("Bob Jones");
    });

    it("includes gift_date in conflict alert message", () => {
      const records = [
        makeRecord({ conflict_of_interest: true, staff_name: "Alice", gift_date: "2026-06-20", declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const conflict = alerts.find((a) => a.type === "conflict_of_interest");
      expect(conflict!.message).toContain("2026-06-20");
    });

    it("uses the record id as the alert id", () => {
      const records = [
        makeRecord({ id: "rec-conflict-1", conflict_of_interest: true, staff_name: "Alice", gift_date: "2026-01-01", declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const conflict = alerts.find((a) => a.type === "conflict_of_interest");
      expect(conflict!.id).toBe("rec-conflict-1");
    });

    it("fires one alert per conflict record", () => {
      const records = [
        makeRecord({ conflict_of_interest: true, staff_name: "A", gift_date: "2026-01-01", declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
        makeRecord({ conflict_of_interest: true, staff_name: "B", gift_date: "2026-01-02", declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
        makeRecord({ conflict_of_interest: true, staff_name: "C", gift_date: "2026-01-03", declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const conflicts = alerts.filter((a) => a.type === "conflict_of_interest");
      expect(conflicts).toHaveLength(3);
    });

    it("does not fire when conflict_of_interest is false", () => {
      const records = [
        makeRecord({ conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const conflict = alerts.find((a) => a.type === "conflict_of_interest");
      expect(conflict).toBeUndefined();
    });
  });

  describe("not_declared alert", () => {
    it("fires a high alert when one record is not declared", () => {
      const records = [
        makeRecord({ declaration_status: "not_declared", conflict_of_interest: false, policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const nd = alerts.find((a) => a.type === "not_declared");
      expect(nd).toBeDefined();
      expect(nd!.severity).toBe("high");
    });

    it("uses singular 'gift' for one undeclared record", () => {
      const records = [
        makeRecord({ declaration_status: "not_declared", conflict_of_interest: false, policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const nd = alerts.find((a) => a.type === "not_declared");
      expect(nd!.message).toContain("1 undeclared gift");
    });

    it("uses plural 'gifts' for multiple undeclared records", () => {
      const records = [
        makeRecord({ declaration_status: "not_declared", conflict_of_interest: false, policy_compliant: true, estimated_value: 10 }),
        makeRecord({ declaration_status: "not_declared", conflict_of_interest: false, policy_compliant: true, estimated_value: 10 }),
        makeRecord({ declaration_status: "not_declared", conflict_of_interest: false, policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const nd = alerts.find((a) => a.type === "not_declared");
      expect(nd!.message).toContain("3 undeclared gifts");
    });

    it("has id = 'not_declared'", () => {
      const records = [
        makeRecord({ declaration_status: "not_declared", conflict_of_interest: false, policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const nd = alerts.find((a) => a.type === "not_declared");
      expect(nd!.id).toBe("not_declared");
    });

    it("does not fire when all records are declared", () => {
      const records = [
        makeRecord({ declaration_status: "declared", conflict_of_interest: false, policy_compliant: true, estimated_value: 10 }),
        makeRecord({ declaration_status: "declared", conflict_of_interest: false, policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const nd = alerts.find((a) => a.type === "not_declared");
      expect(nd).toBeUndefined();
    });

    it("does not fire for late_declaration status", () => {
      const records = [
        makeRecord({ declaration_status: "late_declaration", conflict_of_interest: false, policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const nd = alerts.find((a) => a.type === "not_declared");
      expect(nd).toBeUndefined();
    });
  });

  describe("policy_non_compliant alert", () => {
    it("fires a high alert when one record is non-compliant", () => {
      const records = [
        makeRecord({ policy_compliant: false, conflict_of_interest: false, declaration_status: "declared", estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const nc = alerts.find((a) => a.type === "policy_non_compliant");
      expect(nc).toBeDefined();
      expect(nc!.severity).toBe("high");
    });

    it("uses singular 'gift is' for one non-compliant record", () => {
      const records = [
        makeRecord({ policy_compliant: false, conflict_of_interest: false, declaration_status: "declared", estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const nc = alerts.find((a) => a.type === "policy_non_compliant");
      expect(nc!.message).toContain("1 gift is");
    });

    it("uses plural 'gifts are' for multiple non-compliant records", () => {
      const records = [
        makeRecord({ policy_compliant: false, conflict_of_interest: false, declaration_status: "declared", estimated_value: 10 }),
        makeRecord({ policy_compliant: false, conflict_of_interest: false, declaration_status: "declared", estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const nc = alerts.find((a) => a.type === "policy_non_compliant");
      expect(nc!.message).toContain("2 gifts are");
    });

    it("has id = 'policy_non_compliant'", () => {
      const records = [
        makeRecord({ policy_compliant: false, conflict_of_interest: false, declaration_status: "declared", estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const nc = alerts.find((a) => a.type === "policy_non_compliant");
      expect(nc!.id).toBe("policy_non_compliant");
    });

    it("does not fire when all records are compliant", () => {
      const records = [
        makeRecord({ policy_compliant: true, conflict_of_interest: false, declaration_status: "declared", estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const nc = alerts.find((a) => a.type === "policy_non_compliant");
      expect(nc).toBeUndefined();
    });
  });

  describe("pending_approval alert", () => {
    it("does not fire for one pending record (threshold is 2)", () => {
      const records = [
        makeRecord({ approval_status: "pending", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const pa = alerts.find((a) => a.type === "pending_approval");
      expect(pa).toBeUndefined();
    });

    it("fires a medium alert for exactly 2 pending records", () => {
      const records = [
        makeRecord({ approval_status: "pending", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
        makeRecord({ approval_status: "pending", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const pa = alerts.find((a) => a.type === "pending_approval");
      expect(pa).toBeDefined();
      expect(pa!.severity).toBe("medium");
    });

    it("fires for more than 2 pending records", () => {
      const records = [
        makeRecord({ approval_status: "pending", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
        makeRecord({ approval_status: "pending", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
        makeRecord({ approval_status: "pending", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const pa = alerts.find((a) => a.type === "pending_approval");
      expect(pa).toBeDefined();
      expect(pa!.message).toContain("3");
    });

    it("includes count in message", () => {
      const records = [
        makeRecord({ approval_status: "pending", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
        makeRecord({ approval_status: "pending", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
        makeRecord({ approval_status: "pending", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
        makeRecord({ approval_status: "pending", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
        makeRecord({ approval_status: "pending", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const pa = alerts.find((a) => a.type === "pending_approval");
      expect(pa!.message).toContain("5");
    });

    it("has id = 'pending_approval'", () => {
      const records = [
        makeRecord({ approval_status: "pending", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
        makeRecord({ approval_status: "pending", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const pa = alerts.find((a) => a.type === "pending_approval");
      expect(pa!.id).toBe("pending_approval");
    });

    it("does not fire when no records are pending", () => {
      const records = [
        makeRecord({ approval_status: "approved", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
        makeRecord({ approval_status: "declined", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const pa = alerts.find((a) => a.type === "pending_approval");
      expect(pa).toBeUndefined();
    });
  });

  describe("high_value alert", () => {
    it("fires a medium alert when one gift exceeds 50", () => {
      const records = [
        makeRecord({ estimated_value: 51, conflict_of_interest: false, declaration_status: "declared", policy_compliant: true }),
      ];
      const alerts = identifyGiftAlerts(records);
      const hv = alerts.find((a) => a.type === "high_value");
      expect(hv).toBeDefined();
      expect(hv!.severity).toBe("medium");
    });

    it("does not fire when value is exactly 50", () => {
      const records = [
        makeRecord({ estimated_value: 50, conflict_of_interest: false, declaration_status: "declared", policy_compliant: true }),
      ];
      const alerts = identifyGiftAlerts(records);
      const hv = alerts.find((a) => a.type === "high_value");
      expect(hv).toBeUndefined();
    });

    it("does not fire when value is below 50", () => {
      const records = [
        makeRecord({ estimated_value: 49.99, conflict_of_interest: false, declaration_status: "declared", policy_compliant: true }),
      ];
      const alerts = identifyGiftAlerts(records);
      const hv = alerts.find((a) => a.type === "high_value");
      expect(hv).toBeUndefined();
    });

    it("uses singular 'gift' for one high-value record", () => {
      const records = [
        makeRecord({ estimated_value: 100, conflict_of_interest: false, declaration_status: "declared", policy_compliant: true }),
      ];
      const alerts = identifyGiftAlerts(records);
      const hv = alerts.find((a) => a.type === "high_value");
      expect(hv!.message).toContain("1 high-value gift");
    });

    it("uses plural 'gifts' for multiple high-value records", () => {
      const records = [
        makeRecord({ estimated_value: 75, conflict_of_interest: false, declaration_status: "declared", policy_compliant: true }),
        makeRecord({ estimated_value: 200, conflict_of_interest: false, declaration_status: "declared", policy_compliant: true }),
        makeRecord({ estimated_value: 60, conflict_of_interest: false, declaration_status: "declared", policy_compliant: true }),
      ];
      const alerts = identifyGiftAlerts(records);
      const hv = alerts.find((a) => a.type === "high_value");
      expect(hv!.message).toContain("3 high-value gifts");
    });

    it("has id = 'high_value'", () => {
      const records = [
        makeRecord({ estimated_value: 100, conflict_of_interest: false, declaration_status: "declared", policy_compliant: true }),
      ];
      const alerts = identifyGiftAlerts(records);
      const hv = alerts.find((a) => a.type === "high_value");
      expect(hv!.id).toBe("high_value");
    });

    it("counts only records over 50, not those at or below", () => {
      const records = [
        makeRecord({ estimated_value: 50, conflict_of_interest: false, declaration_status: "declared", policy_compliant: true }),
        makeRecord({ estimated_value: 50.01, conflict_of_interest: false, declaration_status: "declared", policy_compliant: true }),
        makeRecord({ estimated_value: 10, conflict_of_interest: false, declaration_status: "declared", policy_compliant: true }),
      ];
      const alerts = identifyGiftAlerts(records);
      const hv = alerts.find((a) => a.type === "high_value");
      expect(hv).toBeDefined();
      expect(hv!.message).toContain("1 high-value gift");
    });
  });

  describe("multiple alerts at once", () => {
    it("fires all alert types simultaneously", () => {
      const records = [
        makeRecord({ conflict_of_interest: true, staff_name: "Alice", gift_date: "2026-01-01", declaration_status: "not_declared", policy_compliant: false, approval_status: "pending", estimated_value: 100 }),
        makeRecord({ conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, approval_status: "pending", estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("conflict_of_interest");
      expect(types).toContain("not_declared");
      expect(types).toContain("policy_non_compliant");
      expect(types).toContain("pending_approval");
      expect(types).toContain("high_value");
    });

    it("returns conflict alerts before aggregate alerts", () => {
      const records = [
        makeRecord({ conflict_of_interest: true, staff_name: "Alice", gift_date: "2026-01-01", declaration_status: "not_declared", policy_compliant: false, approval_status: "pending", estimated_value: 100 }),
        makeRecord({ conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, approval_status: "pending", estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const conflictIdx = alerts.findIndex((a) => a.type === "conflict_of_interest");
      const ndIdx = alerts.findIndex((a) => a.type === "not_declared");
      expect(conflictIdx).toBeLessThan(ndIdx);
    });

    it("conflict alerts appear before not_declared", () => {
      const records = [
        makeRecord({ conflict_of_interest: true, staff_name: "X", gift_date: "2026-01-01", declaration_status: "not_declared", policy_compliant: false, approval_status: "pending", estimated_value: 100 }),
        makeRecord({ conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, approval_status: "pending", estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const conflictIdx = alerts.findIndex((a) => a.type === "conflict_of_interest");
      const pncIdx = alerts.findIndex((a) => a.type === "policy_non_compliant");
      expect(conflictIdx).toBeLessThan(pncIdx);
    });

    it("not_declared alerts appear before pending_approval", () => {
      const records = [
        makeRecord({ conflict_of_interest: false, declaration_status: "not_declared", policy_compliant: false, approval_status: "pending", estimated_value: 100 }),
        makeRecord({ conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, approval_status: "pending", estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const ndIdx = alerts.findIndex((a) => a.type === "not_declared");
      const paIdx = alerts.findIndex((a) => a.type === "pending_approval");
      expect(ndIdx).toBeLessThan(paIdx);
    });

    it("policy_non_compliant appears before pending_approval", () => {
      const records = [
        makeRecord({ conflict_of_interest: false, declaration_status: "not_declared", policy_compliant: false, approval_status: "pending", estimated_value: 100 }),
        makeRecord({ conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, approval_status: "pending", estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const pncIdx = alerts.findIndex((a) => a.type === "policy_non_compliant");
      const paIdx = alerts.findIndex((a) => a.type === "pending_approval");
      expect(pncIdx).toBeLessThan(paIdx);
    });

    it("pending_approval appears before high_value", () => {
      const records = [
        makeRecord({ conflict_of_interest: false, declaration_status: "not_declared", policy_compliant: false, approval_status: "pending", estimated_value: 100 }),
        makeRecord({ conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, approval_status: "pending", estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const paIdx = alerts.findIndex((a) => a.type === "pending_approval");
      const hvIdx = alerts.findIndex((a) => a.type === "high_value");
      expect(paIdx).toBeLessThan(hvIdx);
    });
  });

  describe("alert severity levels", () => {
    it("conflict_of_interest is critical", () => {
      const records = [makeRecord({ conflict_of_interest: true, staff_name: "A", gift_date: "2026-01-01", declaration_status: "declared", policy_compliant: true, estimated_value: 10 })];
      const alerts = identifyGiftAlerts(records);
      expect(alerts.find((a) => a.type === "conflict_of_interest")!.severity).toBe("critical");
    });

    it("not_declared is high", () => {
      const records = [makeRecord({ declaration_status: "not_declared", conflict_of_interest: false, policy_compliant: true, estimated_value: 10 })];
      const alerts = identifyGiftAlerts(records);
      expect(alerts.find((a) => a.type === "not_declared")!.severity).toBe("high");
    });

    it("policy_non_compliant is high", () => {
      const records = [makeRecord({ policy_compliant: false, conflict_of_interest: false, declaration_status: "declared", estimated_value: 10 })];
      const alerts = identifyGiftAlerts(records);
      expect(alerts.find((a) => a.type === "policy_non_compliant")!.severity).toBe("high");
    });

    it("pending_approval is medium", () => {
      const records = [
        makeRecord({ approval_status: "pending", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
        makeRecord({ approval_status: "pending", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      expect(alerts.find((a) => a.type === "pending_approval")!.severity).toBe("medium");
    });

    it("high_value is medium", () => {
      const records = [makeRecord({ estimated_value: 100, conflict_of_interest: false, declaration_status: "declared", policy_compliant: true })];
      const alerts = identifyGiftAlerts(records);
      expect(alerts.find((a) => a.type === "high_value")!.severity).toBe("medium");
    });
  });

  describe("edge cases", () => {
    it("value of 50.01 triggers high_value", () => {
      const records = [makeRecord({ estimated_value: 50.01, conflict_of_interest: false, declaration_status: "declared", policy_compliant: true })];
      const alerts = identifyGiftAlerts(records);
      const hv = alerts.find((a) => a.type === "high_value");
      expect(hv).toBeDefined();
    });

    it("value of 50 does not trigger high_value", () => {
      const records = [makeRecord({ estimated_value: 50, conflict_of_interest: false, declaration_status: "declared", policy_compliant: true })];
      const alerts = identifyGiftAlerts(records);
      const hv = alerts.find((a) => a.type === "high_value");
      expect(hv).toBeUndefined();
    });

    it("exactly 1 pending does not trigger pending_approval", () => {
      const records = [makeRecord({ approval_status: "pending", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 })];
      const alerts = identifyGiftAlerts(records);
      const pa = alerts.find((a) => a.type === "pending_approval");
      expect(pa).toBeUndefined();
    });

    it("exactly 2 pending triggers pending_approval", () => {
      const records = [
        makeRecord({ approval_status: "pending", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
        makeRecord({ approval_status: "pending", conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const pa = alerts.find((a) => a.type === "pending_approval");
      expect(pa).toBeDefined();
    });

    it("under_review declaration does not trigger not_declared", () => {
      const records = [makeRecord({ declaration_status: "under_review", conflict_of_interest: false, policy_compliant: true, estimated_value: 10 })];
      const alerts = identifyGiftAlerts(records);
      const nd = alerts.find((a) => a.type === "not_declared");
      expect(nd).toBeUndefined();
    });

    it("late_declaration does not trigger not_declared", () => {
      const records = [makeRecord({ declaration_status: "late_declaration", conflict_of_interest: false, policy_compliant: true, estimated_value: 10 })];
      const alerts = identifyGiftAlerts(records);
      const nd = alerts.find((a) => a.type === "not_declared");
      expect(nd).toBeUndefined();
    });

    it("multiple conflict records produce individual alerts with unique ids", () => {
      const records = [
        makeRecord({ id: "c1", conflict_of_interest: true, staff_name: "A", gift_date: "2026-01-01", declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
        makeRecord({ id: "c2", conflict_of_interest: true, staff_name: "B", gift_date: "2026-01-02", declaration_status: "declared", policy_compliant: true, estimated_value: 10 }),
      ];
      const alerts = identifyGiftAlerts(records);
      const conflicts = alerts.filter((a) => a.type === "conflict_of_interest");
      expect(conflicts).toHaveLength(2);
      const ids = conflicts.map((a) => a.id);
      expect(new Set(ids).size).toBe(2);
      expect(ids).toContain("c1");
      expect(ids).toContain("c2");
    });

    it("all records compliant and low value produces no alerts", () => {
      const records = Array.from({ length: 10 }, () =>
        makeRecord({ conflict_of_interest: false, declaration_status: "declared", policy_compliant: true, approval_status: "approved", estimated_value: 5 }),
      );
      const alerts = identifyGiftAlerts(records);
      expect(alerts).toHaveLength(0);
    });
  });
});
