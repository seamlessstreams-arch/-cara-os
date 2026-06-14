// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF CONFLICT OF INTEREST SERVICE TESTS
// Pure-function tests for conflict metrics, alert identification,
// Cara insight generation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  CONFLICT_TYPES,
  RISK_LEVELS,
  MITIGATION_STATUSES,
  DECLARATION_STATUSES,
  _testing,
} from "../staff-conflict-of-interest-service";

import type {
  StaffConflictOfInterestRow,
  ConflictType,
  RiskLevel,
  MitigationStatus,
  DeclarationStatus,
} from "../staff-conflict-of-interest-service";

const {
  computeStaffConflictMetrics,
  computeStaffConflictAlerts,
  generateStaffConflictCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<StaffConflictOfInterestRow>,
): StaffConflictOfInterestRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    staff_name: "staff_name" in (overrides ?? {}) ? overrides!.staff_name! : "Staff A",
    staff_id: "staff_id" in (overrides ?? {}) ? (overrides!.staff_id ?? null) : null,
    declaration_date: "declaration_date" in (overrides ?? {}) ? overrides!.declaration_date! : now.toISOString().split("T")[0],
    conflict_type: "conflict_type" in (overrides ?? {}) ? overrides!.conflict_type! : "financial_interest",
    risk_level: "risk_level" in (overrides ?? {}) ? overrides!.risk_level! : "low",
    mitigation_status: "mitigation_status" in (overrides ?? {}) ? overrides!.mitigation_status! : "in_place",
    declaration_status: "declaration_status" in (overrides ?? {}) ? overrides!.declaration_status! : "accepted",
    conflict_description: "conflict_description" in (overrides ?? {}) ? overrides!.conflict_description! : "Test conflict",
    mitigation_plan: "mitigation_plan" in (overrides ?? {}) ? (overrides!.mitigation_plan ?? null) : null,
    reviewed_by: "reviewed_by" in (overrides ?? {}) ? (overrides!.reviewed_by ?? null) : null,
    annual_review_completed: "annual_review_completed" in (overrides ?? {}) ? overrides!.annual_review_completed! : true,
    manager_aware: "manager_aware" in (overrides ?? {}) ? overrides!.manager_aware! : true,
    documented_in_file: "documented_in_file" in (overrides ?? {}) ? overrides!.documented_in_file! : true,
    no_impact_on_children_confirmed: "no_impact_on_children_confirmed" in (overrides ?? {}) ? overrides!.no_impact_on_children_confirmed! : true,
    organisational_learning: "organisational_learning" in (overrides ?? {}) ? overrides!.organisational_learning! : true,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : now.toISOString(),
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : now.toISOString(),
  };
}

// ── computeStaffConflictMetrics ────────────────────────────────────────

describe("computeStaffConflictMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_declarations", () => {
      const m = computeStaffConflictMetrics([]);
      expect(m.total_declarations).toBe(0);
    });

    it("returns zero high_risk_count", () => {
      const m = computeStaffConflictMetrics([]);
      expect(m.high_risk_count).toBe(0);
    });

    it("returns zero critical_risk_count", () => {
      const m = computeStaffConflictMetrics([]);
      expect(m.critical_risk_count).toBe(0);
    });

    it("returns zero escalated_count", () => {
      const m = computeStaffConflictMetrics([]);
      expect(m.escalated_count).toBe(0);
    });

    it("returns zero mitigation_failed_count", () => {
      const m = computeStaffConflictMetrics([]);
      expect(m.mitigation_failed_count).toBe(0);
    });

    it("returns zero annual_review_rate", () => {
      const m = computeStaffConflictMetrics([]);
      expect(m.annual_review_rate).toBe(0);
    });

    it("returns zero manager_aware_rate", () => {
      const m = computeStaffConflictMetrics([]);
      expect(m.manager_aware_rate).toBe(0);
    });

    it("returns zero documented_rate", () => {
      const m = computeStaffConflictMetrics([]);
      expect(m.documented_rate).toBe(0);
    });

    it("returns zero no_impact_confirmed_rate", () => {
      const m = computeStaffConflictMetrics([]);
      expect(m.no_impact_confirmed_rate).toBe(0);
    });

    it("returns zero mitigation_in_place_rate", () => {
      const m = computeStaffConflictMetrics([]);
      expect(m.mitigation_in_place_rate).toBe(0);
    });

    it("returns empty conflict_type_breakdown", () => {
      const m = computeStaffConflictMetrics([]);
      expect(m.conflict_type_breakdown).toEqual({});
    });

    it("returns empty risk_breakdown", () => {
      const m = computeStaffConflictMetrics([]);
      expect(m.risk_breakdown).toEqual({});
    });

    it("returns zero unique_staff", () => {
      const m = computeStaffConflictMetrics([]);
      expect(m.unique_staff).toBe(0);
    });
  });

  describe("single row — all positive flags", () => {
    const row = makeRow({
      risk_level: "low",
      declaration_status: "accepted",
      mitigation_status: "in_place",
      conflict_type: "financial_interest",
      annual_review_completed: true,
      manager_aware: true,
      documented_in_file: true,
      no_impact_on_children_confirmed: true,
      organisational_learning: true,
      staff_name: "Staff A",
    });

    it("returns total_declarations = 1", () => {
      const m = computeStaffConflictMetrics([row]);
      expect(m.total_declarations).toBe(1);
    });

    it("returns high_risk_count = 0", () => {
      const m = computeStaffConflictMetrics([row]);
      expect(m.high_risk_count).toBe(0);
    });

    it("returns critical_risk_count = 0", () => {
      const m = computeStaffConflictMetrics([row]);
      expect(m.critical_risk_count).toBe(0);
    });

    it("returns annual_review_rate = 100", () => {
      const m = computeStaffConflictMetrics([row]);
      expect(m.annual_review_rate).toBe(100);
    });

    it("returns manager_aware_rate = 100", () => {
      const m = computeStaffConflictMetrics([row]);
      expect(m.manager_aware_rate).toBe(100);
    });

    it("returns documented_rate = 100", () => {
      const m = computeStaffConflictMetrics([row]);
      expect(m.documented_rate).toBe(100);
    });

    it("returns no_impact_confirmed_rate = 100", () => {
      const m = computeStaffConflictMetrics([row]);
      expect(m.no_impact_confirmed_rate).toBe(100);
    });

    it("returns mitigation_in_place_rate = 100 for non-none risk", () => {
      const m = computeStaffConflictMetrics([row]);
      expect(m.mitigation_in_place_rate).toBe(100);
    });

    it("returns conflict_type_breakdown with single entry", () => {
      const m = computeStaffConflictMetrics([row]);
      expect(m.conflict_type_breakdown).toEqual({ financial_interest: 1 });
    });

    it("returns risk_breakdown with single entry", () => {
      const m = computeStaffConflictMetrics([row]);
      expect(m.risk_breakdown).toEqual({ low: 1 });
    });

    it("returns unique_staff = 1", () => {
      const m = computeStaffConflictMetrics([row]);
      expect(m.unique_staff).toBe(1);
    });
  });

  describe("counts", () => {
    it("counts high_risk_count", () => {
      expect(computeStaffConflictMetrics([makeRow({ risk_level: "high" })]).high_risk_count).toBe(1);
    });

    it("does not count medium as high_risk", () => {
      expect(computeStaffConflictMetrics([makeRow({ risk_level: "medium" })]).high_risk_count).toBe(0);
    });

    it("counts critical_risk_count", () => {
      expect(computeStaffConflictMetrics([makeRow({ risk_level: "critical" })]).critical_risk_count).toBe(1);
    });

    it("does not count high as critical_risk", () => {
      expect(computeStaffConflictMetrics([makeRow({ risk_level: "high" })]).critical_risk_count).toBe(0);
    });

    it("counts escalated_count", () => {
      expect(computeStaffConflictMetrics([makeRow({ declaration_status: "escalated" })]).escalated_count).toBe(1);
    });

    it("does not count requires_action as escalated", () => {
      expect(computeStaffConflictMetrics([makeRow({ declaration_status: "requires_action" })]).escalated_count).toBe(0);
    });

    it("counts mitigation_failed_count", () => {
      expect(computeStaffConflictMetrics([makeRow({ mitigation_status: "failed" })]).mitigation_failed_count).toBe(1);
    });

    it("does not count under_review as failed", () => {
      expect(computeStaffConflictMetrics([makeRow({ mitigation_status: "under_review" })]).mitigation_failed_count).toBe(0);
    });

    it("total_declarations counts records", () => {
      expect(computeStaffConflictMetrics([makeRow(), makeRow()]).total_declarations).toBe(2);
    });
  });

  describe("boolean rates", () => {
    it("annual_review_rate 0 when false", () => {
      expect(computeStaffConflictMetrics([makeRow({ annual_review_completed: false })]).annual_review_rate).toBe(0);
    });

    it("manager_aware_rate 0 when false", () => {
      expect(computeStaffConflictMetrics([makeRow({ manager_aware: false })]).manager_aware_rate).toBe(0);
    });

    it("documented_rate 0 when false", () => {
      expect(computeStaffConflictMetrics([makeRow({ documented_in_file: false })]).documented_rate).toBe(0);
    });

    it("no_impact_confirmed_rate 0 when false", () => {
      expect(computeStaffConflictMetrics([makeRow({ no_impact_on_children_confirmed: false })]).no_impact_confirmed_rate).toBe(0);
    });

    it("mixed boolean rate (2/3 = 66.7%)", () => {
      const rows = [
        makeRow({ annual_review_completed: true }),
        makeRow({ annual_review_completed: true }),
        makeRow({ annual_review_completed: false }),
      ];
      const m = computeStaffConflictMetrics(rows);
      expect(m.annual_review_rate).toBe(66.7);
    });

    it("mixed boolean rate (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ manager_aware: true }),
        makeRow({ manager_aware: false }),
        makeRow({ manager_aware: false }),
      ];
      const m = computeStaffConflictMetrics(rows);
      expect(m.manager_aware_rate).toBe(33.3);
    });
  });

  describe("mitigation_in_place_rate", () => {
    it("excludes none_identified rows from denominator", () => {
      const rows = [
        makeRow({ risk_level: "none_identified", mitigation_status: "not_required" }),
        makeRow({ risk_level: "low", mitigation_status: "in_place" }),
      ];
      const m = computeStaffConflictMetrics(rows);
      expect(m.mitigation_in_place_rate).toBe(100);
    });

    it("returns 0 when all rows are none_identified", () => {
      const rows = [
        makeRow({ risk_level: "none_identified", mitigation_status: "not_required" }),
        makeRow({ risk_level: "none_identified", mitigation_status: "not_required" }),
      ];
      const m = computeStaffConflictMetrics(rows);
      expect(m.mitigation_in_place_rate).toBe(0);
    });

    it("calculates correctly for mixed mitigation statuses", () => {
      const rows = [
        makeRow({ risk_level: "low", mitigation_status: "in_place" }),
        makeRow({ risk_level: "medium", mitigation_status: "planned" }),
        makeRow({ risk_level: "high", mitigation_status: "in_place" }),
      ];
      const m = computeStaffConflictMetrics(rows);
      expect(m.mitigation_in_place_rate).toBe(66.7);
    });

    it("returns 0 when no mitigation is in place for needed rows", () => {
      const rows = [
        makeRow({ risk_level: "high", mitigation_status: "planned" }),
        makeRow({ risk_level: "medium", mitigation_status: "under_review" }),
      ];
      const m = computeStaffConflictMetrics(rows);
      expect(m.mitigation_in_place_rate).toBe(0);
    });
  });

  describe("unique_staff", () => {
    it("counts distinct staff names", () => {
      const rows = [
        makeRow({ staff_name: "Alice" }),
        makeRow({ staff_name: "Alice" }),
        makeRow({ staff_name: "Bob" }),
      ];
      const m = computeStaffConflictMetrics(rows);
      expect(m.unique_staff).toBe(2);
    });

    it("returns 1 when all rows have the same staff name", () => {
      const rows = [
        makeRow({ staff_name: "Staff A" }),
        makeRow({ staff_name: "Staff A" }),
      ];
      const m = computeStaffConflictMetrics(rows);
      expect(m.unique_staff).toBe(1);
    });
  });

  describe("conflict_type_breakdown", () => {
    it("counts duplicate conflict types", () => {
      const rows = [
        makeRow({ conflict_type: "financial_interest" }),
        makeRow({ conflict_type: "financial_interest" }),
        makeRow({ conflict_type: "personal_relationship" }),
      ];
      const m = computeStaffConflictMetrics(rows);
      expect(m.conflict_type_breakdown).toEqual({ financial_interest: 2, personal_relationship: 1 });
    });

    it("handles all 10 conflict types", () => {
      const rows = CONFLICT_TYPES.map((t) => makeRow({ conflict_type: t }));
      const m = computeStaffConflictMetrics(rows);
      for (const t of CONFLICT_TYPES) {
        expect(m.conflict_type_breakdown[t]).toBe(1);
      }
    });
  });

  describe("risk_breakdown", () => {
    it("counts duplicate risk levels", () => {
      const rows = [
        makeRow({ risk_level: "low" }),
        makeRow({ risk_level: "low" }),
        makeRow({ risk_level: "high" }),
      ];
      const m = computeStaffConflictMetrics(rows);
      expect(m.risk_breakdown).toEqual({ low: 2, high: 1 });
    });

    it("handles all 5 risk levels", () => {
      const rows = RISK_LEVELS.map((r) => makeRow({ risk_level: r }));
      const m = computeStaffConflictMetrics(rows);
      for (const r of RISK_LEVELS) {
        expect(m.risk_breakdown[r]).toBe(1);
      }
    });
  });
});

// ── computeStaffConflictAlerts ────────────────────────────────────────

describe("computeStaffConflictAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no rows", () => {
      const alerts = computeStaffConflictAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all rows are clean", () => {
      const rows = [
        makeRow({ risk_level: "low", mitigation_status: "in_place", manager_aware: true, declaration_status: "accepted", annual_review_completed: true }),
      ];
      const alerts = computeStaffConflictAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  describe("critical_mitigation_failed alert", () => {
    it("fires when critical risk and mitigation failed", () => {
      const rows = [makeRow({ risk_level: "critical", mitigation_status: "failed", staff_name: "Jo" })];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "critical_mitigation_failed");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ risk_level: "critical", mitigation_status: "failed" })];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "critical_mitigation_failed")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes staff_name in message", () => {
      const rows = [makeRow({ risk_level: "critical", mitigation_status: "failed", staff_name: "Jane Doe" })];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "critical_mitigation_failed")!;
      expect(alert.message).toContain("Jane Doe");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "coi-1", risk_level: "critical", mitigation_status: "failed" })];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "critical_mitigation_failed")!;
      expect(alert.record_id).toBe("coi-1");
    });

    it("fires per record for multiple critical+failed", () => {
      const rows = [
        makeRow({ risk_level: "critical", mitigation_status: "failed" }),
        makeRow({ risk_level: "critical", mitigation_status: "failed" }),
      ];
      const alerts = computeStaffConflictAlerts(rows);
      const critical = alerts.filter((a) => a.type === "critical_mitigation_failed");
      expect(critical).toHaveLength(2);
    });

    it("does not fire for critical risk without failed mitigation", () => {
      const rows = [makeRow({ risk_level: "critical", mitigation_status: "in_place" })];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "critical_mitigation_failed");
      expect(alert).toBeUndefined();
    });

    it("does not fire for failed mitigation without critical risk", () => {
      const rows = [makeRow({ risk_level: "high", mitigation_status: "failed" })];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "critical_mitigation_failed");
      expect(alert).toBeUndefined();
    });
  });

  describe("high_risk_manager_unaware alert", () => {
    it("fires when high risk and manager not aware", () => {
      const rows = [makeRow({ risk_level: "high", manager_aware: false })];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk_manager_unaware");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ risk_level: "high", manager_aware: false })];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk_manager_unaware")!;
      expect(alert.severity).toBe("high");
    });

    it("includes staff_name in message", () => {
      const rows = [makeRow({ risk_level: "high", manager_aware: false, staff_name: "Bob Smith" })];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk_manager_unaware")!;
      expect(alert.message).toContain("Bob Smith");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "coi-2", risk_level: "high", manager_aware: false })];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk_manager_unaware")!;
      expect(alert.record_id).toBe("coi-2");
    });

    it("does not fire when manager is aware", () => {
      const rows = [makeRow({ risk_level: "high", manager_aware: true })];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk_manager_unaware");
      expect(alert).toBeUndefined();
    });

    it("does not fire for medium risk with manager unaware", () => {
      const rows = [makeRow({ risk_level: "medium", manager_aware: false })];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk_manager_unaware");
      expect(alert).toBeUndefined();
    });
  });

  describe("declarations_not_reviewed alert", () => {
    it("fires when 2 or more declarations are submitted (not reviewed)", () => {
      const rows = [
        makeRow({ declaration_status: "submitted" }),
        makeRow({ declaration_status: "submitted" }),
      ];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "declarations_not_reviewed");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [
        makeRow({ declaration_status: "submitted" }),
        makeRow({ declaration_status: "submitted" }),
      ];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "declarations_not_reviewed")!;
      expect(alert.severity).toBe("high");
    });

    it("includes count in message", () => {
      const rows = [
        makeRow({ declaration_status: "submitted" }),
        makeRow({ declaration_status: "submitted" }),
        makeRow({ declaration_status: "submitted" }),
      ];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "declarations_not_reviewed")!;
      expect(alert.message).toContain("3");
    });

    it("does not fire for only 1 submitted declaration", () => {
      const rows = [makeRow({ declaration_status: "submitted" })];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "declarations_not_reviewed");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all declarations are reviewed", () => {
      const rows = [
        makeRow({ declaration_status: "reviewed" }),
        makeRow({ declaration_status: "accepted" }),
      ];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "declarations_not_reviewed");
      expect(alert).toBeUndefined();
    });
  });

  describe("annual_reviews_incomplete alert", () => {
    it("fires when 2 or more have annual reviews not completed", () => {
      const rows = [
        makeRow({ annual_review_completed: false }),
        makeRow({ annual_review_completed: false }),
      ];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "annual_reviews_incomplete");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [
        makeRow({ annual_review_completed: false }),
        makeRow({ annual_review_completed: false }),
      ];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "annual_reviews_incomplete")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes count in message", () => {
      const rows = [
        makeRow({ annual_review_completed: false }),
        makeRow({ annual_review_completed: false }),
        makeRow({ annual_review_completed: false }),
        makeRow({ annual_review_completed: false }),
      ];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "annual_reviews_incomplete")!;
      expect(alert.message).toContain("4");
    });

    it("does not fire for only 1 incomplete annual review", () => {
      const rows = [makeRow({ annual_review_completed: false })];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "annual_reviews_incomplete");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all reviews are completed", () => {
      const rows = [
        makeRow({ annual_review_completed: true }),
        makeRow({ annual_review_completed: true }),
      ];
      const alerts = computeStaffConflictAlerts(rows);
      const alert = alerts.find((a) => a.type === "annual_reviews_incomplete");
      expect(alert).toBeUndefined();
    });
  });

  describe("combined alerts", () => {
    it("can fire all four alert types simultaneously", () => {
      const rows = [
        makeRow({ risk_level: "critical", mitigation_status: "failed", manager_aware: true, declaration_status: "submitted", annual_review_completed: false }),
        makeRow({ risk_level: "high", manager_aware: false, declaration_status: "submitted", annual_review_completed: false }),
      ];
      const alerts = computeStaffConflictAlerts(rows);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("critical_mitigation_failed");
      expect(types).toContain("high_risk_manager_unaware");
      expect(types).toContain("declarations_not_reviewed");
      expect(types).toContain("annual_reviews_incomplete");
    });

    it("critical alerts appear before high alerts", () => {
      const rows = [
        makeRow({ risk_level: "critical", mitigation_status: "failed", declaration_status: "submitted", annual_review_completed: false }),
        makeRow({ risk_level: "high", manager_aware: false, declaration_status: "submitted", annual_review_completed: false }),
      ];
      const alerts = computeStaffConflictAlerts(rows);
      const critIdx = alerts.findIndex((a) => a.type === "critical_mitigation_failed");
      const highIdx = alerts.findIndex((a) => a.type === "high_risk_manager_unaware");
      expect(critIdx).toBeLessThan(highIdx);
    });

    it("high alerts appear before medium alerts", () => {
      const rows = [
        makeRow({ risk_level: "high", manager_aware: false, declaration_status: "submitted", annual_review_completed: false }),
        makeRow({ declaration_status: "submitted", annual_review_completed: false }),
      ];
      const alerts = computeStaffConflictAlerts(rows);
      const highIdx = alerts.findIndex((a) => a.type === "high_risk_manager_unaware");
      const medIdx = alerts.findIndex((a) => a.type === "annual_reviews_incomplete");
      expect(highIdx).toBeLessThan(medIdx);
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const rows = [
        makeRow({ risk_level: "critical", mitigation_status: "failed", declaration_status: "submitted", annual_review_completed: false }),
        makeRow({ risk_level: "high", manager_aware: false, declaration_status: "submitted", annual_review_completed: false }),
      ];
      const alerts = computeStaffConflictAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const rows = [
        makeRow({ risk_level: "critical", mitigation_status: "failed", declaration_status: "submitted", annual_review_completed: false }),
        makeRow({ risk_level: "high", manager_aware: false, declaration_status: "submitted", annual_review_completed: false }),
      ];
      const alerts = computeStaffConflictAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const rows = [makeRow({ risk_level: "critical", mitigation_status: "failed" })];
      const alerts = computeStaffConflictAlerts(rows);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── generateStaffConflictCaraInsights ──────────────────────────────────

describe("generateStaffConflictCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const metrics = computeStaffConflictMetrics([]);
    const alerts = computeStaffConflictAlerts([]);
    const insights = generateStaffConflictCaraInsights(metrics, alerts);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [cyan]", () => {
    const metrics = computeStaffConflictMetrics([makeRow()]);
    const alerts = computeStaffConflictAlerts([makeRow()]);
    const insights = generateStaffConflictCaraInsights(metrics, alerts);
    expect(insights[0]).toMatch(/^\[cyan\]/);
  });

  it("first insight includes total_declarations count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const metrics = computeStaffConflictMetrics(rows);
    const alerts = computeStaffConflictAlerts(rows);
    const insights = generateStaffConflictCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes manager_aware_rate", () => {
    const rows = [makeRow({ manager_aware: true }), makeRow({ manager_aware: false })];
    const metrics = computeStaffConflictMetrics(rows);
    const alerts = computeStaffConflictAlerts(rows);
    const insights = generateStaffConflictCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("50%");
  });

  it("second insight starts with [amber]", () => {
    const metrics = computeStaffConflictMetrics([makeRow()]);
    const alerts = computeStaffConflictAlerts([makeRow()]);
    const insights = generateStaffConflictCaraInsights(metrics, alerts);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions critical and high alerts when present", () => {
    const rows = [
      makeRow({ risk_level: "critical", mitigation_status: "failed" }),
    ];
    const metrics = computeStaffConflictMetrics(rows);
    const alerts = computeStaffConflictAlerts(rows);
    const insights = generateStaffConflictCaraInsights(metrics, alerts);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high");
  });

  it("second insight mentions no alerts when none present", () => {
    const rows = [makeRow({ risk_level: "low", mitigation_status: "in_place", manager_aware: true, declaration_status: "accepted", annual_review_completed: true })];
    const metrics = computeStaffConflictMetrics(rows);
    const alerts = computeStaffConflictAlerts(rows);
    const insights = generateStaffConflictCaraInsights(metrics, alerts);
    expect(insights[1]).toContain("No critical or high-priority alerts");
  });

  it("third insight starts with [reflect]", () => {
    const metrics = computeStaffConflictMetrics([makeRow()]);
    const alerts = computeStaffConflictAlerts([makeRow()]);
    const insights = generateStaffConflictCaraInsights(metrics, alerts);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions critical risk when critical declarations exist", () => {
    const rows = [makeRow({ risk_level: "critical" })];
    const metrics = computeStaffConflictMetrics(rows);
    const alerts = computeStaffConflictAlerts(rows);
    const insights = generateStaffConflictCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("critical-risk");
  });

  it("third insight asks about annual reviews when no critical but reviews incomplete", () => {
    const rows = [
      makeRow({ risk_level: "low", annual_review_completed: false }),
      makeRow({ risk_level: "low", annual_review_completed: true }),
    ];
    const metrics = computeStaffConflictMetrics(rows);
    const alerts = computeStaffConflictAlerts(rows);
    const insights = generateStaffConflictCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("Annual review completion");
  });

  it("third insight celebrates when all reviews completed and no critical risks", () => {
    const rows = [
      makeRow({ risk_level: "low", annual_review_completed: true }),
      makeRow({ risk_level: "low", annual_review_completed: true }),
    ];
    const metrics = computeStaffConflictMetrics(rows);
    const alerts = computeStaffConflictAlerts(rows);
    const insights = generateStaffConflictCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("annual reviews completed and no critical risks");
  });

  it("uses singular declaration wording when 1 declaration", () => {
    const rows = [makeRow()];
    const metrics = computeStaffConflictMetrics(rows);
    const alerts = computeStaffConflictAlerts(rows);
    const insights = generateStaffConflictCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("1 conflict of interest declaration recorded");
  });

  it("uses plural declarations wording when multiple", () => {
    const rows = [makeRow(), makeRow()];
    const metrics = computeStaffConflictMetrics(rows);
    const alerts = computeStaffConflictAlerts(rows);
    const insights = generateStaffConflictCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("declarations");
  });

  it("uses singular staff member wording when 1 unique staff", () => {
    const rows = [makeRow({ staff_name: "Staff A" })];
    const metrics = computeStaffConflictMetrics(rows);
    const alerts = computeStaffConflictAlerts(rows);
    const insights = generateStaffConflictCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("1 staff member");
  });

  it("uses plural staff members wording when multiple", () => {
    const rows = [makeRow({ staff_name: "Staff A" }), makeRow({ staff_name: "Staff B" })];
    const metrics = computeStaffConflictMetrics(rows);
    const alerts = computeStaffConflictAlerts(rows);
    const insights = generateStaffConflictCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("2 staff members");
  });

  it("all insights are non-empty strings", () => {
    const metrics = computeStaffConflictMetrics([makeRow()]);
    const alerts = computeStaffConflictAlerts([makeRow()]);
    const insights = generateStaffConflictCaraInsights(metrics, alerts);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });
});
