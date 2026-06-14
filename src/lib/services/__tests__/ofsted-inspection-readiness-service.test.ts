// ══════════════════════════════════════════════════════════════════════════════
// CARA — OFSTED INSPECTION READINESS SERVICE TESTS
// Pure-function tests for inspection readiness metrics, alert identification,
// Cara insight generation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  READINESS_AREAS,
  READINESS_RATINGS,
  EVIDENCE_STATUSES,
  INSPECTION_TYPES,
  _testing,
} from "../ofsted-inspection-readiness-service";

import type {
  OfstedInspectionReadinessRow,
  ReadinessArea,
  ReadinessRating,
  EvidenceStatus,
  InspectionType,
} from "../ofsted-inspection-readiness-service";

const {
  computeOfstedReadinessMetrics,
  computeOfstedReadinessAlerts,
  generateOfstedReadinessCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<OfstedInspectionReadinessRow>,
): OfstedInspectionReadinessRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    assessor_name: "assessor_name" in (overrides ?? {}) ? overrides!.assessor_name! : "Jane Manager",
    assessor_id: "assessor_id" in (overrides ?? {}) ? (overrides!.assessor_id ?? null) : null,
    assessment_date: "assessment_date" in (overrides ?? {}) ? overrides!.assessment_date! : "2026-05-01",
    readiness_area: "readiness_area" in (overrides ?? {}) ? overrides!.readiness_area! : "overall_experiences_progress",
    readiness_rating: "readiness_rating" in (overrides ?? {}) ? overrides!.readiness_rating! : "good",
    evidence_status: "evidence_status" in (overrides ?? {}) ? overrides!.evidence_status! : "evidence_gathered",
    inspection_type: "inspection_type" in (overrides ?? {}) ? overrides!.inspection_type! : "full_inspection",
    evidence_documented: "evidence_documented" in (overrides ?? {}) ? overrides!.evidence_documented! : true,
    staff_prepared: "staff_prepared" in (overrides ?? {}) ? overrides!.staff_prepared! : true,
    children_consulted: "children_consulted" in (overrides ?? {}) ? overrides!.children_consulted! : true,
    environment_ready: "environment_ready" in (overrides ?? {}) ? overrides!.environment_ready! : true,
    policies_up_to_date: "policies_up_to_date" in (overrides ?? {}) ? overrides!.policies_up_to_date! : true,
    records_accessible: "records_accessible" in (overrides ?? {}) ? overrides!.records_accessible! : true,
    improvement_actions_identified: "improvement_actions_identified" in (overrides ?? {}) ? overrides!.improvement_actions_identified! : true,
    improvement_actions_completed: "improvement_actions_completed" in (overrides ?? {}) ? overrides!.improvement_actions_completed! : true,
    manager_self_evaluation_done: "manager_self_evaluation_done" in (overrides ?? {}) ? overrides!.manager_self_evaluation_done! : true,
    regulatory_requirements_met: "regulatory_requirements_met" in (overrides ?? {}) ? overrides!.regulatory_requirements_met! : true,
    previous_recommendations_addressed: "previous_recommendations_addressed" in (overrides ?? {}) ? overrides!.previous_recommendations_addressed! : true,
    mock_inspection_completed: "mock_inspection_completed" in (overrides ?? {}) ? overrides!.mock_inspection_completed! : true,
    key_findings: "key_findings" in (overrides ?? {}) ? (overrides!.key_findings ?? null) : null,
    improvement_plan_notes: "improvement_plan_notes" in (overrides ?? {}) ? (overrides!.improvement_plan_notes ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : "2026-05-01T08:00:00Z",
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : "2026-05-01T08:00:00Z",
  };
}

// ── computeOfstedReadinessMetrics ──────────────────────────────────────────

describe("computeOfstedReadinessMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_assessments", () => {
      const m = computeOfstedReadinessMetrics([]);
      expect(m.total_assessments).toBe(0);
    });

    it("returns zero inadequate_count", () => {
      const m = computeOfstedReadinessMetrics([]);
      expect(m.inadequate_count).toBe(0);
    });

    it("returns zero requires_improvement_count", () => {
      const m = computeOfstedReadinessMetrics([]);
      expect(m.requires_improvement_count).toBe(0);
    });

    it("returns zero outstanding_count", () => {
      const m = computeOfstedReadinessMetrics([]);
      expect(m.outstanding_count).toBe(0);
    });

    it("returns zero evidence_missing_count", () => {
      const m = computeOfstedReadinessMetrics([]);
      expect(m.evidence_missing_count).toBe(0);
    });

    it("returns zero evidence_documented_rate", () => {
      const m = computeOfstedReadinessMetrics([]);
      expect(m.evidence_documented_rate).toBe(0);
    });

    it("returns zero staff_prepared_rate", () => {
      const m = computeOfstedReadinessMetrics([]);
      expect(m.staff_prepared_rate).toBe(0);
    });

    it("returns zero children_consulted_rate", () => {
      const m = computeOfstedReadinessMetrics([]);
      expect(m.children_consulted_rate).toBe(0);
    });

    it("returns zero environment_ready_rate", () => {
      const m = computeOfstedReadinessMetrics([]);
      expect(m.environment_ready_rate).toBe(0);
    });

    it("returns zero policies_current_rate", () => {
      const m = computeOfstedReadinessMetrics([]);
      expect(m.policies_current_rate).toBe(0);
    });

    it("returns zero records_accessible_rate", () => {
      const m = computeOfstedReadinessMetrics([]);
      expect(m.records_accessible_rate).toBe(0);
    });

    it("returns zero improvement_completed_rate", () => {
      const m = computeOfstedReadinessMetrics([]);
      expect(m.improvement_completed_rate).toBe(0);
    });

    it("returns zero self_evaluation_rate", () => {
      const m = computeOfstedReadinessMetrics([]);
      expect(m.self_evaluation_rate).toBe(0);
    });

    it("returns zero mock_inspection_rate", () => {
      const m = computeOfstedReadinessMetrics([]);
      expect(m.mock_inspection_rate).toBe(0);
    });

    it("returns zero regulatory_met_rate", () => {
      const m = computeOfstedReadinessMetrics([]);
      expect(m.regulatory_met_rate).toBe(0);
    });

    it("returns zero previous_recommendations_rate", () => {
      const m = computeOfstedReadinessMetrics([]);
      expect(m.previous_recommendations_rate).toBe(0);
    });

    it("returns empty area_breakdown", () => {
      const m = computeOfstedReadinessMetrics([]);
      expect(m.area_breakdown).toEqual({});
    });

    it("returns empty rating_breakdown", () => {
      const m = computeOfstedReadinessMetrics([]);
      expect(m.rating_breakdown).toEqual({});
    });

    it("returns zero unique_assessors", () => {
      const m = computeOfstedReadinessMetrics([]);
      expect(m.unique_assessors).toBe(0);
    });
  });

  describe("single row with all flags true and good rating", () => {
    const row = makeRow({
      readiness_rating: "good",
      evidence_status: "evidence_gathered",
      evidence_documented: true,
      staff_prepared: true,
      children_consulted: true,
      environment_ready: true,
      policies_up_to_date: true,
      records_accessible: true,
      improvement_actions_completed: true,
      manager_self_evaluation_done: true,
      mock_inspection_completed: true,
      regulatory_requirements_met: true,
      previous_recommendations_addressed: true,
      readiness_area: "safety",
      assessor_name: "Alice",
    });

    it("returns total_assessments = 1", () => {
      const m = computeOfstedReadinessMetrics([row]);
      expect(m.total_assessments).toBe(1);
    });

    it("returns outstanding_count = 0", () => {
      const m = computeOfstedReadinessMetrics([row]);
      expect(m.outstanding_count).toBe(0);
    });

    it("returns inadequate_count = 0", () => {
      const m = computeOfstedReadinessMetrics([row]);
      expect(m.inadequate_count).toBe(0);
    });

    it("returns evidence_documented_rate = 100", () => {
      const m = computeOfstedReadinessMetrics([row]);
      expect(m.evidence_documented_rate).toBe(100);
    });

    it("returns staff_prepared_rate = 100", () => {
      const m = computeOfstedReadinessMetrics([row]);
      expect(m.staff_prepared_rate).toBe(100);
    });

    it("returns children_consulted_rate = 100", () => {
      const m = computeOfstedReadinessMetrics([row]);
      expect(m.children_consulted_rate).toBe(100);
    });

    it("returns environment_ready_rate = 100", () => {
      const m = computeOfstedReadinessMetrics([row]);
      expect(m.environment_ready_rate).toBe(100);
    });

    it("returns policies_current_rate = 100", () => {
      const m = computeOfstedReadinessMetrics([row]);
      expect(m.policies_current_rate).toBe(100);
    });

    it("returns records_accessible_rate = 100", () => {
      const m = computeOfstedReadinessMetrics([row]);
      expect(m.records_accessible_rate).toBe(100);
    });

    it("returns improvement_completed_rate = 100", () => {
      const m = computeOfstedReadinessMetrics([row]);
      expect(m.improvement_completed_rate).toBe(100);
    });

    it("returns self_evaluation_rate = 100", () => {
      const m = computeOfstedReadinessMetrics([row]);
      expect(m.self_evaluation_rate).toBe(100);
    });

    it("returns mock_inspection_rate = 100", () => {
      const m = computeOfstedReadinessMetrics([row]);
      expect(m.mock_inspection_rate).toBe(100);
    });

    it("returns regulatory_met_rate = 100", () => {
      const m = computeOfstedReadinessMetrics([row]);
      expect(m.regulatory_met_rate).toBe(100);
    });

    it("returns previous_recommendations_rate = 100", () => {
      const m = computeOfstedReadinessMetrics([row]);
      expect(m.previous_recommendations_rate).toBe(100);
    });

    it("returns area_breakdown with single entry", () => {
      const m = computeOfstedReadinessMetrics([row]);
      expect(m.area_breakdown).toEqual({ safety: 1 });
    });

    it("returns rating_breakdown with single entry", () => {
      const m = computeOfstedReadinessMetrics([row]);
      expect(m.rating_breakdown).toEqual({ good: 1 });
    });

    it("returns unique_assessors = 1", () => {
      const m = computeOfstedReadinessMetrics([row]);
      expect(m.unique_assessors).toBe(1);
    });
  });

  describe("multiple rows", () => {
    const rows = [
      makeRow({ readiness_rating: "outstanding", readiness_area: "safety", evidence_status: "evidence_gathered", assessor_name: "Alice", evidence_documented: true, staff_prepared: true, children_consulted: true, environment_ready: true, policies_up_to_date: true, records_accessible: true, improvement_actions_completed: true, manager_self_evaluation_done: true, mock_inspection_completed: true, regulatory_requirements_met: true, previous_recommendations_addressed: true }),
      makeRow({ readiness_rating: "inadequate", readiness_area: "leadership_management", evidence_status: "evidence_missing", assessor_name: "Bob", evidence_documented: false, staff_prepared: false, children_consulted: false, environment_ready: false, policies_up_to_date: false, records_accessible: false, improvement_actions_completed: false, manager_self_evaluation_done: false, mock_inspection_completed: false, regulatory_requirements_met: false, previous_recommendations_addressed: false }),
      makeRow({ readiness_rating: "requires_improvement", readiness_area: "health", evidence_status: "evidence_partial", assessor_name: "Alice", evidence_documented: true, staff_prepared: true, children_consulted: false, environment_ready: true, policies_up_to_date: true, records_accessible: true, improvement_actions_completed: false, manager_self_evaluation_done: true, mock_inspection_completed: false, regulatory_requirements_met: true, previous_recommendations_addressed: true }),
    ];

    it("returns total_assessments = 3", () => {
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.total_assessments).toBe(3);
    });

    it("returns inadequate_count = 1", () => {
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.inadequate_count).toBe(1);
    });

    it("returns requires_improvement_count = 1", () => {
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.requires_improvement_count).toBe(1);
    });

    it("returns outstanding_count = 1", () => {
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.outstanding_count).toBe(1);
    });

    it("returns evidence_missing_count = 1", () => {
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.evidence_missing_count).toBe(1);
    });

    it("calculates evidence_documented_rate correctly (2/3 = 66.7%)", () => {
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.evidence_documented_rate).toBe(66.7);
    });

    it("calculates staff_prepared_rate correctly (2/3 = 66.7%)", () => {
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.staff_prepared_rate).toBe(66.7);
    });

    it("calculates children_consulted_rate correctly (1/3 = 33.3%)", () => {
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.children_consulted_rate).toBe(33.3);
    });

    it("calculates environment_ready_rate correctly (2/3 = 66.7%)", () => {
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.environment_ready_rate).toBe(66.7);
    });

    it("calculates policies_current_rate correctly (2/3 = 66.7%)", () => {
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.policies_current_rate).toBe(66.7);
    });

    it("calculates records_accessible_rate correctly (2/3 = 66.7%)", () => {
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.records_accessible_rate).toBe(66.7);
    });

    it("calculates improvement_completed_rate correctly (1/3 = 33.3%)", () => {
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.improvement_completed_rate).toBe(33.3);
    });

    it("calculates self_evaluation_rate correctly (2/3 = 66.7%)", () => {
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.self_evaluation_rate).toBe(66.7);
    });

    it("calculates mock_inspection_rate correctly (1/3 = 33.3%)", () => {
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.mock_inspection_rate).toBe(33.3);
    });

    it("calculates regulatory_met_rate correctly (2/3 = 66.7%)", () => {
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.regulatory_met_rate).toBe(66.7);
    });

    it("calculates previous_recommendations_rate correctly (2/3 = 66.7%)", () => {
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.previous_recommendations_rate).toBe(66.7);
    });

    it("groups area_breakdown correctly", () => {
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.area_breakdown).toEqual({
        safety: 1,
        leadership_management: 1,
        health: 1,
      });
    });

    it("groups rating_breakdown correctly", () => {
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.rating_breakdown).toEqual({
        outstanding: 1,
        inadequate: 1,
        requires_improvement: 1,
      });
    });

    it("returns unique_assessors = 2 (Alice appears twice)", () => {
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.unique_assessors).toBe(2);
    });
  });

  describe("area_breakdown", () => {
    it("counts duplicate readiness areas", () => {
      const rows = [
        makeRow({ readiness_area: "safety" }),
        makeRow({ readiness_area: "safety" }),
        makeRow({ readiness_area: "health" }),
      ];
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.area_breakdown).toEqual({ safety: 2, health: 1 });
    });

    it("handles all 7 readiness areas", () => {
      const rows = READINESS_AREAS.map((a) => makeRow({ readiness_area: a }));
      const m = computeOfstedReadinessMetrics(rows);
      for (const a of READINESS_AREAS) {
        expect(m.area_breakdown[a]).toBe(1);
      }
    });
  });

  describe("rating_breakdown", () => {
    it("counts duplicate ratings", () => {
      const rows = [
        makeRow({ readiness_rating: "good" }),
        makeRow({ readiness_rating: "good" }),
        makeRow({ readiness_rating: "outstanding" }),
      ];
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.rating_breakdown).toEqual({ good: 2, outstanding: 1 });
    });

    it("handles all 5 readiness ratings", () => {
      const rows = READINESS_RATINGS.map((r) => makeRow({ readiness_rating: r }));
      const m = computeOfstedReadinessMetrics(rows);
      for (const r of READINESS_RATINGS) {
        expect(m.rating_breakdown[r]).toBe(1);
      }
    });
  });

  describe("unique_assessors", () => {
    it("counts distinct assessor names", () => {
      const rows = [
        makeRow({ assessor_name: "Alice" }),
        makeRow({ assessor_name: "Alice" }),
        makeRow({ assessor_name: "Bob" }),
      ];
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.unique_assessors).toBe(2);
    });

    it("returns 1 when all rows have the same assessor", () => {
      const rows = [
        makeRow({ assessor_name: "Carol" }),
        makeRow({ assessor_name: "Carol" }),
        makeRow({ assessor_name: "Carol" }),
      ];
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.unique_assessors).toBe(1);
    });

    it("counts all unique assessors", () => {
      const rows = [
        makeRow({ assessor_name: "Alice" }),
        makeRow({ assessor_name: "Bob" }),
        makeRow({ assessor_name: "Carol" }),
        makeRow({ assessor_name: "Dave" }),
      ];
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.unique_assessors).toBe(4);
    });
  });

  describe("percentage calculations with known values", () => {
    it("calculates evidence_documented_rate (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ evidence_documented: true }),
        makeRow({ evidence_documented: false }),
        makeRow({ evidence_documented: false }),
      ];
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.evidence_documented_rate).toBe(33.3);
    });

    it("calculates staff_prepared_rate (2/3 = 66.7%)", () => {
      const rows = [
        makeRow({ staff_prepared: true }),
        makeRow({ staff_prepared: true }),
        makeRow({ staff_prepared: false }),
      ];
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.staff_prepared_rate).toBe(66.7);
    });

    it("returns 100 for all rates when single row has all flags true", () => {
      const rows = [makeRow()];
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.evidence_documented_rate).toBe(100);
      expect(m.staff_prepared_rate).toBe(100);
      expect(m.children_consulted_rate).toBe(100);
      expect(m.environment_ready_rate).toBe(100);
      expect(m.policies_current_rate).toBe(100);
      expect(m.records_accessible_rate).toBe(100);
      expect(m.improvement_completed_rate).toBe(100);
      expect(m.self_evaluation_rate).toBe(100);
      expect(m.mock_inspection_rate).toBe(100);
      expect(m.regulatory_met_rate).toBe(100);
      expect(m.previous_recommendations_rate).toBe(100);
    });

    it("returns 0 for all rates when single row has all flags false", () => {
      const rows = [makeRow({
        evidence_documented: false,
        staff_prepared: false,
        children_consulted: false,
        environment_ready: false,
        policies_up_to_date: false,
        records_accessible: false,
        improvement_actions_completed: false,
        manager_self_evaluation_done: false,
        mock_inspection_completed: false,
        regulatory_requirements_met: false,
        previous_recommendations_addressed: false,
      })];
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.evidence_documented_rate).toBe(0);
      expect(m.staff_prepared_rate).toBe(0);
      expect(m.children_consulted_rate).toBe(0);
      expect(m.environment_ready_rate).toBe(0);
      expect(m.policies_current_rate).toBe(0);
      expect(m.records_accessible_rate).toBe(0);
      expect(m.improvement_completed_rate).toBe(0);
      expect(m.self_evaluation_rate).toBe(0);
      expect(m.mock_inspection_rate).toBe(0);
      expect(m.regulatory_met_rate).toBe(0);
      expect(m.previous_recommendations_rate).toBe(0);
    });

    it("calculates 50% correctly (1/2)", () => {
      const rows = [
        makeRow({ evidence_documented: true }),
        makeRow({ evidence_documented: false }),
      ];
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.evidence_documented_rate).toBe(50);
    });
  });

  describe("evidence_missing_count", () => {
    it("counts only evidence_missing status", () => {
      const rows = [
        makeRow({ evidence_status: "evidence_missing" }),
        makeRow({ evidence_status: "evidence_gathered" }),
        makeRow({ evidence_status: "evidence_partial" }),
      ];
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.evidence_missing_count).toBe(1);
    });

    it("does not count evidence_partial as missing", () => {
      const rows = [makeRow({ evidence_status: "evidence_partial" })];
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.evidence_missing_count).toBe(0);
    });

    it("does not count action_planned as missing", () => {
      const rows = [makeRow({ evidence_status: "action_planned" })];
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.evidence_missing_count).toBe(0);
    });

    it("does not count action_completed as missing", () => {
      const rows = [makeRow({ evidence_status: "action_completed" })];
      const m = computeOfstedReadinessMetrics(rows);
      expect(m.evidence_missing_count).toBe(0);
    });
  });
});

// ── computeOfstedReadinessAlerts ─────────────────────────────────────────

describe("computeOfstedReadinessAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no rows", () => {
      const alerts = computeOfstedReadinessAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all rows are fully compliant", () => {
      const rows = [makeRow()];
      const alerts = computeOfstedReadinessAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  describe("inadequate_rating alert", () => {
    it("fires for inadequate rating", () => {
      const rows = [makeRow({ readiness_rating: "inadequate" })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "inadequate_rating");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ readiness_rating: "inadequate" })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "inadequate_rating")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "rec-1", readiness_rating: "inadequate" })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "inadequate_rating")!;
      expect(alert.record_id).toBe("rec-1");
    });

    it("replaces underscores in readiness_area in message", () => {
      const rows = [makeRow({ readiness_rating: "inadequate", readiness_area: "leadership_management" })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "inadequate_rating")!;
      expect(alert.message).toContain("leadership management");
    });

    it("does not fire for good rating", () => {
      const rows = [makeRow({ readiness_rating: "good" })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "inadequate_rating");
      expect(alert).toBeUndefined();
    });

    it("does not fire for outstanding rating", () => {
      const rows = [makeRow({ readiness_rating: "outstanding" })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "inadequate_rating");
      expect(alert).toBeUndefined();
    });

    it("does not fire for requires_improvement rating", () => {
      const rows = [makeRow({ readiness_rating: "requires_improvement" })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "inadequate_rating");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple inadequate ratings", () => {
      const rows = [
        makeRow({ readiness_rating: "inadequate", readiness_area: "safety" }),
        makeRow({ readiness_rating: "inadequate", readiness_area: "health" }),
      ];
      const alerts = computeOfstedReadinessAlerts(rows);
      const inadequateAlerts = alerts.filter((a) => a.type === "inadequate_rating");
      expect(inadequateAlerts).toHaveLength(2);
    });
  });

  describe("regulatory_not_met alert", () => {
    it("fires when regulatory requirements not met", () => {
      const rows = [makeRow({ regulatory_requirements_met: false })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "regulatory_not_met");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ regulatory_requirements_met: false })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "regulatory_not_met")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "reg-1", regulatory_requirements_met: false })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "regulatory_not_met")!;
      expect(alert.record_id).toBe("reg-1");
    });

    it("does not fire when regulatory requirements are met", () => {
      const rows = [makeRow({ regulatory_requirements_met: true })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "regulatory_not_met");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple non-compliant rows", () => {
      const rows = [
        makeRow({ regulatory_requirements_met: false }),
        makeRow({ regulatory_requirements_met: false }),
        makeRow({ regulatory_requirements_met: true }),
      ];
      const alerts = computeOfstedReadinessAlerts(rows);
      const regAlerts = alerts.filter((a) => a.type === "regulatory_not_met");
      expect(regAlerts).toHaveLength(2);
    });
  });

  describe("no_improvement_actions alert", () => {
    it("fires when requires_improvement with no improvement actions identified", () => {
      const rows = [makeRow({ readiness_rating: "requires_improvement", improvement_actions_identified: false })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_improvement_actions");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ readiness_rating: "requires_improvement", improvement_actions_identified: false })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_improvement_actions")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "imp-1", readiness_rating: "requires_improvement", improvement_actions_identified: false })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_improvement_actions")!;
      expect(alert.record_id).toBe("imp-1");
    });

    it("does not fire when requires_improvement with actions identified", () => {
      const rows = [makeRow({ readiness_rating: "requires_improvement", improvement_actions_identified: true })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_improvement_actions");
      expect(alert).toBeUndefined();
    });

    it("does not fire when good rating without actions identified", () => {
      const rows = [makeRow({ readiness_rating: "good", improvement_actions_identified: false })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_improvement_actions");
      expect(alert).toBeUndefined();
    });

    it("does not fire when inadequate without actions identified (different alert)", () => {
      const rows = [makeRow({ readiness_rating: "inadequate", improvement_actions_identified: false })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_improvement_actions");
      expect(alert).toBeUndefined();
    });
  });

  describe("evidence_missing_critical_area alert", () => {
    it("fires for evidence missing in safety area", () => {
      const rows = [makeRow({ evidence_status: "evidence_missing", readiness_area: "safety" })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "evidence_missing_critical_area");
      expect(alert).toBeDefined();
    });

    it("fires for evidence missing in leadership_management area", () => {
      const rows = [makeRow({ evidence_status: "evidence_missing", readiness_area: "leadership_management" })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "evidence_missing_critical_area");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ evidence_status: "evidence_missing", readiness_area: "safety" })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "evidence_missing_critical_area")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "ev-1", evidence_status: "evidence_missing", readiness_area: "safety" })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "evidence_missing_critical_area")!;
      expect(alert.record_id).toBe("ev-1");
    });

    it("does not fire for evidence missing in health area", () => {
      const rows = [makeRow({ evidence_status: "evidence_missing", readiness_area: "health" })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "evidence_missing_critical_area");
      expect(alert).toBeUndefined();
    });

    it("does not fire for evidence missing in education_skills_work area", () => {
      const rows = [makeRow({ evidence_status: "evidence_missing", readiness_area: "education_skills_work" })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "evidence_missing_critical_area");
      expect(alert).toBeUndefined();
    });

    it("does not fire for evidence_gathered in safety area", () => {
      const rows = [makeRow({ evidence_status: "evidence_gathered", readiness_area: "safety" })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "evidence_missing_critical_area");
      expect(alert).toBeUndefined();
    });

    it("does not fire for evidence_partial in safety area", () => {
      const rows = [makeRow({ evidence_status: "evidence_partial", readiness_area: "safety" })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "evidence_missing_critical_area");
      expect(alert).toBeUndefined();
    });
  });

  describe("mock_inspection_not_completed alert", () => {
    it("fires when mock inspection not completed", () => {
      const rows = [makeRow({ mock_inspection_completed: false })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "mock_inspection_not_completed");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ mock_inspection_completed: false })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "mock_inspection_not_completed")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "mock-1", mock_inspection_completed: false })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "mock_inspection_not_completed")!;
      expect(alert.record_id).toBe("mock-1");
    });

    it("does not fire when mock inspection is completed", () => {
      const rows = [makeRow({ mock_inspection_completed: true })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "mock_inspection_not_completed");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple incomplete mock inspections", () => {
      const rows = [
        makeRow({ mock_inspection_completed: false }),
        makeRow({ mock_inspection_completed: false }),
        makeRow({ mock_inspection_completed: true }),
      ];
      const alerts = computeOfstedReadinessAlerts(rows);
      const mockAlerts = alerts.filter((a) => a.type === "mock_inspection_not_completed");
      expect(mockAlerts).toHaveLength(2);
    });
  });

  describe("previous_recommendations_not_addressed alert", () => {
    it("fires when previous recommendations not addressed", () => {
      const rows = [makeRow({ previous_recommendations_addressed: false })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "previous_recommendations_not_addressed");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ previous_recommendations_addressed: false })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "previous_recommendations_not_addressed")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "prev-1", previous_recommendations_addressed: false })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "previous_recommendations_not_addressed")!;
      expect(alert.record_id).toBe("prev-1");
    });

    it("does not fire when previous recommendations are addressed", () => {
      const rows = [makeRow({ previous_recommendations_addressed: true })];
      const alerts = computeOfstedReadinessAlerts(rows);
      const alert = alerts.find((a) => a.type === "previous_recommendations_not_addressed");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple unaddressed recommendations", () => {
      const rows = [
        makeRow({ previous_recommendations_addressed: false }),
        makeRow({ previous_recommendations_addressed: false }),
      ];
      const alerts = computeOfstedReadinessAlerts(rows);
      const prevAlerts = alerts.filter((a) => a.type === "previous_recommendations_not_addressed");
      expect(prevAlerts).toHaveLength(2);
    });
  });

  describe("combined alerts", () => {
    it("can fire all six alert types simultaneously", () => {
      const rows = [
        makeRow({
          readiness_rating: "inadequate",
          regulatory_requirements_met: false,
          mock_inspection_completed: false,
          previous_recommendations_addressed: false,
          evidence_status: "evidence_missing",
          readiness_area: "safety",
          improvement_actions_identified: false,
        }),
        makeRow({
          readiness_rating: "requires_improvement",
          improvement_actions_identified: false,
          regulatory_requirements_met: false,
          mock_inspection_completed: false,
          previous_recommendations_addressed: false,
          evidence_status: "evidence_missing",
          readiness_area: "leadership_management",
        }),
      ];
      const alerts = computeOfstedReadinessAlerts(rows);
      const types = new Set(alerts.map((a) => a.type));
      expect(types.has("inadequate_rating")).toBe(true);
      expect(types.has("regulatory_not_met")).toBe(true);
      expect(types.has("no_improvement_actions")).toBe(true);
      expect(types.has("evidence_missing_critical_area")).toBe(true);
      expect(types.has("mock_inspection_not_completed")).toBe(true);
      expect(types.has("previous_recommendations_not_addressed")).toBe(true);
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const rows = [
        makeRow({ readiness_rating: "inadequate", regulatory_requirements_met: false, mock_inspection_completed: false, previous_recommendations_addressed: false }),
      ];
      const alerts = computeOfstedReadinessAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const rows = [
        makeRow({
          readiness_rating: "inadequate",
          regulatory_requirements_met: false,
          mock_inspection_completed: false,
          previous_recommendations_addressed: false,
          evidence_status: "evidence_missing",
          readiness_area: "safety",
        }),
      ];
      const alerts = computeOfstedReadinessAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const rows = [makeRow({ readiness_rating: "inadequate" })];
      const alerts = computeOfstedReadinessAlerts(rows);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── generateOfstedReadinessCaraInsights ──────────────────────────────────

describe("generateOfstedReadinessCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const insights = generateOfstedReadinessCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("returns exactly 3 insights with data", () => {
    const insights = generateOfstedReadinessCaraInsights([makeRow()]);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [cyan]", () => {
    const insights = generateOfstedReadinessCaraInsights([makeRow()]);
    expect(insights[0]).toMatch(/^\[cyan\]/);
  });

  it("first insight includes total assessments count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const insights = generateOfstedReadinessCaraInsights(rows);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes outstanding count", () => {
    const rows = [makeRow({ readiness_rating: "outstanding" })];
    const insights = generateOfstedReadinessCaraInsights(rows);
    expect(insights[0]).toContain("1 rated outstanding");
  });

  it("first insight includes inadequate count", () => {
    const rows = [makeRow({ readiness_rating: "inadequate" })];
    const insights = generateOfstedReadinessCaraInsights(rows);
    expect(insights[0]).toContain("1 inadequate");
  });

  it("first insight includes evidence missing count", () => {
    const rows = [makeRow({ evidence_status: "evidence_missing" })];
    const insights = generateOfstedReadinessCaraInsights(rows);
    expect(insights[0]).toContain("1 with evidence missing");
  });

  it("first insight uses singular assessment when 1 row", () => {
    const rows = [makeRow()];
    const insights = generateOfstedReadinessCaraInsights(rows);
    expect(insights[0]).toContain("1 inspection readiness assessment");
  });

  it("first insight uses plural assessments when multiple rows", () => {
    const rows = [makeRow(), makeRow()];
    const insights = generateOfstedReadinessCaraInsights(rows);
    expect(insights[0]).toContain("2 inspection readiness assessments");
  });

  it("first insight uses singular assessor when 1 assessor", () => {
    const rows = [makeRow({ assessor_name: "Alice" })];
    const insights = generateOfstedReadinessCaraInsights(rows);
    expect(insights[0]).toContain("1 assessor");
  });

  it("first insight uses plural assessors when multiple assessors", () => {
    const rows = [makeRow({ assessor_name: "Alice" }), makeRow({ assessor_name: "Bob" })];
    const insights = generateOfstedReadinessCaraInsights(rows);
    expect(insights[0]).toContain("2 assessors");
  });

  it("second insight starts with [amber]", () => {
    const insights = generateOfstedReadinessCaraInsights([makeRow()]);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions critical and high alerts when present", () => {
    const rows = [makeRow({ readiness_rating: "inadequate", regulatory_requirements_met: false })];
    const insights = generateOfstedReadinessCaraInsights(rows);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high");
  });

  it("second insight mentions no alerts when none present", () => {
    const rows = [makeRow()];
    const insights = generateOfstedReadinessCaraInsights(rows);
    expect(insights[1]).toContain("No critical or high-priority alerts");
  });

  it("second insight includes self_evaluation_rate", () => {
    const rows = [makeRow({ manager_self_evaluation_done: true }), makeRow({ manager_self_evaluation_done: false })];
    const insights = generateOfstedReadinessCaraInsights(rows);
    expect(insights[1]).toContain("50%");
  });

  it("third insight starts with [reflect]", () => {
    const insights = generateOfstedReadinessCaraInsights([makeRow()]);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions inadequate when some areas are inadequate", () => {
    const rows = [makeRow({ readiness_rating: "inadequate" })];
    const insights = generateOfstedReadinessCaraInsights(rows);
    expect(insights[2]).toContain("inadequate");
  });

  it("third insight uses singular area wording when 1 inadequate", () => {
    const rows = [makeRow({ readiness_rating: "inadequate" })];
    const insights = generateOfstedReadinessCaraInsights(rows);
    expect(insights[2]).toContain("area is");
  });

  it("third insight uses plural areas wording when multiple inadequate", () => {
    const rows = [
      makeRow({ readiness_rating: "inadequate" }),
      makeRow({ readiness_rating: "inadequate" }),
    ];
    const insights = generateOfstedReadinessCaraInsights(rows);
    expect(insights[2]).toContain("areas are");
  });

  it("third insight asks about evidence when no inadequate but evidence missing", () => {
    const rows = [
      makeRow({ readiness_rating: "good", evidence_status: "evidence_missing" }),
    ];
    const insights = generateOfstedReadinessCaraInsights(rows);
    expect(insights[2]).toContain("evidence missing");
  });

  it("third insight uses singular assessment when 1 evidence missing", () => {
    const rows = [makeRow({ readiness_rating: "good", evidence_status: "evidence_missing" })];
    const insights = generateOfstedReadinessCaraInsights(rows);
    expect(insights[2]).toContain("assessment has");
  });

  it("third insight uses plural assessments when multiple evidence missing", () => {
    const rows = [
      makeRow({ readiness_rating: "good", evidence_status: "evidence_missing" }),
      makeRow({ readiness_rating: "good", evidence_status: "evidence_missing" }),
    ];
    const insights = generateOfstedReadinessCaraInsights(rows);
    expect(insights[2]).toContain("assessments have");
  });

  it("third insight celebrates strong position when no inadequate and no evidence missing", () => {
    const rows = [
      makeRow({ readiness_rating: "good", evidence_status: "evidence_gathered" }),
      makeRow({ readiness_rating: "outstanding", evidence_status: "evidence_gathered" }),
    ];
    const insights = generateOfstedReadinessCaraInsights(rows);
    expect(insights[2]).toContain("continuous improvement");
  });

  it("all insights are non-empty strings", () => {
    const insights = generateOfstedReadinessCaraInsights([makeRow()]);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  it("handles empty array gracefully", () => {
    const insights = generateOfstedReadinessCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("0 inspection readiness assessments");
    expect(insights[2]).toContain("continuous improvement");
  });
});

// ── Enum constants ───────────────────────────────────────────────────────

describe("Enum constants", () => {
  it("READINESS_AREAS has exactly 7 items", () => {
    expect(READINESS_AREAS).toHaveLength(7);
  });

  it("READINESS_RATINGS has exactly 5 items", () => {
    expect(READINESS_RATINGS).toHaveLength(5);
  });

  it("EVIDENCE_STATUSES has exactly 5 items", () => {
    expect(EVIDENCE_STATUSES).toHaveLength(5);
  });

  it("INSPECTION_TYPES has exactly 5 items", () => {
    expect(INSPECTION_TYPES).toHaveLength(5);
  });

  it("READINESS_AREAS values are unique", () => {
    expect(new Set(READINESS_AREAS).size).toBe(READINESS_AREAS.length);
  });

  it("READINESS_RATINGS values are unique", () => {
    expect(new Set(READINESS_RATINGS).size).toBe(READINESS_RATINGS.length);
  });

  it("EVIDENCE_STATUSES values are unique", () => {
    expect(new Set(EVIDENCE_STATUSES).size).toBe(EVIDENCE_STATUSES.length);
  });

  it("INSPECTION_TYPES values are unique", () => {
    expect(new Set(INSPECTION_TYPES).size).toBe(INSPECTION_TYPES.length);
  });

  it("READINESS_AREAS contains expected values", () => {
    expect(READINESS_AREAS).toContain("overall_experiences_progress");
    expect(READINESS_AREAS).toContain("safety");
    expect(READINESS_AREAS).toContain("leadership_management");
    expect(READINESS_AREAS).toContain("education_skills_work");
    expect(READINESS_AREAS).toContain("health");
    expect(READINESS_AREAS).toContain("impact_of_leaders");
    expect(READINESS_AREAS).toContain("helping_children_make_progress");
  });

  it("READINESS_RATINGS contains expected values", () => {
    expect(READINESS_RATINGS).toContain("outstanding");
    expect(READINESS_RATINGS).toContain("good");
    expect(READINESS_RATINGS).toContain("requires_improvement");
    expect(READINESS_RATINGS).toContain("inadequate");
    expect(READINESS_RATINGS).toContain("not_assessed");
  });

  it("EVIDENCE_STATUSES contains expected values", () => {
    expect(EVIDENCE_STATUSES).toContain("evidence_gathered");
    expect(EVIDENCE_STATUSES).toContain("evidence_partial");
    expect(EVIDENCE_STATUSES).toContain("evidence_missing");
    expect(EVIDENCE_STATUSES).toContain("action_planned");
    expect(EVIDENCE_STATUSES).toContain("action_completed");
  });

  it("INSPECTION_TYPES contains expected values", () => {
    expect(INSPECTION_TYPES).toContain("full_inspection");
    expect(INSPECTION_TYPES).toContain("focused_visit");
    expect(INSPECTION_TYPES).toContain("monitoring_visit");
    expect(INSPECTION_TYPES).toContain("emergency_inspection");
    expect(INSPECTION_TYPES).toContain("mock_inspection");
  });
});

// ── Factory helper validation ────────────────────────────────────────────

describe("makeRow factory helper", () => {
  it("creates a row with sensible defaults", () => {
    const r = makeRow();
    expect(r.home_id).toBe("home-1");
    expect(r.assessor_name).toBe("Jane Manager");
    expect(r.assessor_id).toBeNull();
    expect(r.assessment_date).toBe("2026-05-01");
    expect(r.readiness_area).toBe("overall_experiences_progress");
    expect(r.readiness_rating).toBe("good");
    expect(r.evidence_status).toBe("evidence_gathered");
    expect(r.inspection_type).toBe("full_inspection");
    expect(r.evidence_documented).toBe(true);
    expect(r.staff_prepared).toBe(true);
    expect(r.children_consulted).toBe(true);
    expect(r.environment_ready).toBe(true);
    expect(r.policies_up_to_date).toBe(true);
    expect(r.records_accessible).toBe(true);
    expect(r.improvement_actions_identified).toBe(true);
    expect(r.improvement_actions_completed).toBe(true);
    expect(r.manager_self_evaluation_done).toBe(true);
    expect(r.regulatory_requirements_met).toBe(true);
    expect(r.previous_recommendations_addressed).toBe(true);
    expect(r.mock_inspection_completed).toBe(true);
    expect(r.key_findings).toBeNull();
    expect(r.improvement_plan_notes).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRow({ readiness_rating: "outstanding", readiness_area: "safety" });
    expect(r.readiness_rating).toBe("outstanding");
    expect(r.readiness_area).toBe("safety");
    // defaults still apply
    expect(r.assessor_name).toBe("Jane Manager");
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
    const r = makeRow({ assessor_id: null, key_findings: null, improvement_plan_notes: null, notes: null });
    expect(r.assessor_id).toBeNull();
    expect(r.key_findings).toBeNull();
    expect(r.improvement_plan_notes).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows setting nullable fields to values", () => {
    const r = makeRow({ assessor_id: "user-123", key_findings: "Strong safeguarding", improvement_plan_notes: "Focus on education", notes: "Reviewed by RI" });
    expect(r.assessor_id).toBe("user-123");
    expect(r.key_findings).toBe("Strong safeguarding");
    expect(r.improvement_plan_notes).toBe("Focus on education");
    expect(r.notes).toBe("Reviewed by RI");
  });
});
