// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME ATMOSPHERE ASSESSMENT SERVICE TESTS
// Pure-function tests for home atmosphere metrics, alert identification,
// Cara insight generation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  ATMOSPHERE_DIMENSIONS,
  ATMOSPHERE_RATINGS,
  ASSESSMENT_METHODS,
  ACTIONS_REQUIRED,
  _testing,
} from "../home-atmosphere-assessment-service";

import type {
  HomeAtmosphereAssessmentRow,
  AtmosphereDimension,
  AtmosphereRating,
  AssessmentMethod,
  ActionRequired,
} from "../home-atmosphere-assessment-service";

const {
  computeHomeAtmosphereMetrics,
  computeHomeAtmosphereAlerts,
  generateHomeAtmosphereCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<HomeAtmosphereAssessmentRow>,
): HomeAtmosphereAssessmentRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    assessment_date: "assessment_date" in (overrides ?? {}) ? overrides!.assessment_date! : now.toISOString().split("T")[0],
    atmosphere_dimension: "atmosphere_dimension" in (overrides ?? {}) ? overrides!.atmosphere_dimension! : "warmth_welcome",
    atmosphere_rating: "atmosphere_rating" in (overrides ?? {}) ? overrides!.atmosphere_rating! : "good",
    assessment_method: "assessment_method" in (overrides ?? {}) ? overrides!.assessment_method! : "staff_observation",
    action_required: "action_required" in (overrides ?? {}) ? overrides!.action_required! : "none",
    assessor_name: "assessor_name" in (overrides ?? {}) ? overrides!.assessor_name! : "Staff A",
    child_views_included: "child_views_included" in (overrides ?? {}) ? overrides!.child_views_included! : true,
    staff_views_included: "staff_views_included" in (overrides ?? {}) ? overrides!.staff_views_included! : true,
    visitor_views_included: "visitor_views_included" in (overrides ?? {}) ? overrides!.visitor_views_included! : true,
    improvement_actions_identified: "improvement_actions_identified" in (overrides ?? {}) ? overrides!.improvement_actions_identified! : false,
    actions_implemented: "actions_implemented" in (overrides ?? {}) ? overrides!.actions_implemented! : false,
    shared_with_children: "shared_with_children" in (overrides ?? {}) ? overrides!.shared_with_children! : true,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : now.toISOString(),
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : now.toISOString(),
  };
}

// ── computeHomeAtmosphereMetrics ────────────────────────────────────────

describe("computeHomeAtmosphereMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_assessments", () => {
      const m = computeHomeAtmosphereMetrics([]);
      expect(m.total_assessments).toBe(0);
    });

    it("returns zero inadequate_count", () => {
      const m = computeHomeAtmosphereMetrics([]);
      expect(m.inadequate_count).toBe(0);
    });

    it("returns zero requires_improvement_count", () => {
      const m = computeHomeAtmosphereMetrics([]);
      expect(m.requires_improvement_count).toBe(0);
    });

    it("returns zero urgent_action_count", () => {
      const m = computeHomeAtmosphereMetrics([]);
      expect(m.urgent_action_count).toBe(0);
    });

    it("returns zero actions_not_implemented_count", () => {
      const m = computeHomeAtmosphereMetrics([]);
      expect(m.actions_not_implemented_count).toBe(0);
    });

    it("returns zero child_views_rate", () => {
      const m = computeHomeAtmosphereMetrics([]);
      expect(m.child_views_rate).toBe(0);
    });

    it("returns zero staff_views_rate", () => {
      const m = computeHomeAtmosphereMetrics([]);
      expect(m.staff_views_rate).toBe(0);
    });

    it("returns zero visitor_views_rate", () => {
      const m = computeHomeAtmosphereMetrics([]);
      expect(m.visitor_views_rate).toBe(0);
    });

    it("returns zero actions_implemented_rate", () => {
      const m = computeHomeAtmosphereMetrics([]);
      expect(m.actions_implemented_rate).toBe(0);
    });

    it("returns zero shared_with_children_rate", () => {
      const m = computeHomeAtmosphereMetrics([]);
      expect(m.shared_with_children_rate).toBe(0);
    });

    it("returns empty dimension_breakdown", () => {
      const m = computeHomeAtmosphereMetrics([]);
      expect(m.dimension_breakdown).toEqual({});
    });

    it("returns empty rating_breakdown", () => {
      const m = computeHomeAtmosphereMetrics([]);
      expect(m.rating_breakdown).toEqual({});
    });

    it("returns zero unique_assessors", () => {
      const m = computeHomeAtmosphereMetrics([]);
      expect(m.unique_assessors).toBe(0);
    });
  });

  describe("single row", () => {
    const row = makeRow({
      atmosphere_rating: "good",
      action_required: "none",
      child_views_included: true,
      staff_views_included: true,
      visitor_views_included: true,
      improvement_actions_identified: false,
      actions_implemented: false,
      shared_with_children: true,
      atmosphere_dimension: "warmth_welcome",
      assessor_name: "Staff A",
    });

    it("returns total_assessments = 1", () => {
      const m = computeHomeAtmosphereMetrics([row]);
      expect(m.total_assessments).toBe(1);
    });

    it("returns child_views_rate = 100", () => {
      const m = computeHomeAtmosphereMetrics([row]);
      expect(m.child_views_rate).toBe(100);
    });

    it("returns staff_views_rate = 100", () => {
      const m = computeHomeAtmosphereMetrics([row]);
      expect(m.staff_views_rate).toBe(100);
    });

    it("returns visitor_views_rate = 100", () => {
      const m = computeHomeAtmosphereMetrics([row]);
      expect(m.visitor_views_rate).toBe(100);
    });

    it("returns shared_with_children_rate = 100", () => {
      const m = computeHomeAtmosphereMetrics([row]);
      expect(m.shared_with_children_rate).toBe(100);
    });

    it("returns inadequate_count = 0", () => {
      const m = computeHomeAtmosphereMetrics([row]);
      expect(m.inadequate_count).toBe(0);
    });

    it("returns dimension_breakdown with single entry", () => {
      const m = computeHomeAtmosphereMetrics([row]);
      expect(m.dimension_breakdown).toEqual({ warmth_welcome: 1 });
    });

    it("returns rating_breakdown with single entry", () => {
      const m = computeHomeAtmosphereMetrics([row]);
      expect(m.rating_breakdown).toEqual({ good: 1 });
    });

    it("returns unique_assessors = 1", () => {
      const m = computeHomeAtmosphereMetrics([row]);
      expect(m.unique_assessors).toBe(1);
    });
  });

  describe("multiple rows", () => {
    const rows = [
      makeRow({ atmosphere_rating: "good", atmosphere_dimension: "warmth_welcome", assessor_name: "Staff A", child_views_included: true, staff_views_included: true, visitor_views_included: true, improvement_actions_identified: false, actions_implemented: false, shared_with_children: true, action_required: "none" }),
      makeRow({ atmosphere_rating: "inadequate", atmosphere_dimension: "safety_feeling", assessor_name: "Staff B", child_views_included: false, staff_views_included: true, visitor_views_included: false, improvement_actions_identified: true, actions_implemented: false, shared_with_children: false, action_required: "urgent_action" }),
      makeRow({ atmosphere_rating: "requires_improvement", atmosphere_dimension: "child_relationships", assessor_name: "Staff C", child_views_included: true, staff_views_included: false, visitor_views_included: true, improvement_actions_identified: true, actions_implemented: true, shared_with_children: true, action_required: "minor_action" }),
    ];

    it("returns total_assessments = 3", () => {
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.total_assessments).toBe(3);
    });

    it("returns inadequate_count = 1", () => {
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.inadequate_count).toBe(1);
    });

    it("returns requires_improvement_count = 1", () => {
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.requires_improvement_count).toBe(1);
    });

    it("returns urgent_action_count = 1", () => {
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.urgent_action_count).toBe(1);
    });

    it("returns actions_not_implemented_count = 1", () => {
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.actions_not_implemented_count).toBe(1);
    });

    it("calculates child_views_rate correctly (2/3 = 66.7%)", () => {
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.child_views_rate).toBe(66.7);
    });

    it("calculates staff_views_rate correctly (2/3 = 66.7%)", () => {
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.staff_views_rate).toBe(66.7);
    });

    it("calculates visitor_views_rate correctly (2/3 = 66.7%)", () => {
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.visitor_views_rate).toBe(66.7);
    });

    it("calculates actions_implemented_rate correctly (1/3 = 33.3%)", () => {
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.actions_implemented_rate).toBe(33.3);
    });

    it("calculates shared_with_children_rate correctly (2/3 = 66.7%)", () => {
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.shared_with_children_rate).toBe(66.7);
    });

    it("groups dimension_breakdown correctly", () => {
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.dimension_breakdown).toEqual({
        warmth_welcome: 1,
        safety_feeling: 1,
        child_relationships: 1,
      });
    });

    it("groups rating_breakdown correctly", () => {
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.rating_breakdown).toEqual({
        good: 1,
        inadequate: 1,
        requires_improvement: 1,
      });
    });

    it("returns unique_assessors = 3", () => {
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.unique_assessors).toBe(3);
    });
  });

  describe("dimension_breakdown", () => {
    it("counts duplicate dimensions", () => {
      const rows = [
        makeRow({ atmosphere_dimension: "warmth_welcome" }),
        makeRow({ atmosphere_dimension: "warmth_welcome" }),
        makeRow({ atmosphere_dimension: "fun_enjoyment" }),
      ];
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.dimension_breakdown).toEqual({ warmth_welcome: 2, fun_enjoyment: 1 });
    });

    it("handles all 10 atmosphere dimensions", () => {
      const rows = ATMOSPHERE_DIMENSIONS.map((d) => makeRow({ atmosphere_dimension: d }));
      const m = computeHomeAtmosphereMetrics(rows);
      for (const d of ATMOSPHERE_DIMENSIONS) {
        expect(m.dimension_breakdown[d]).toBe(1);
      }
    });
  });

  describe("rating_breakdown", () => {
    it("counts duplicate ratings", () => {
      const rows = [
        makeRow({ atmosphere_rating: "good" }),
        makeRow({ atmosphere_rating: "good" }),
        makeRow({ atmosphere_rating: "inadequate" }),
      ];
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.rating_breakdown).toEqual({ good: 2, inadequate: 1 });
    });

    it("handles all 5 atmosphere ratings", () => {
      const rows = ATMOSPHERE_RATINGS.map((r) => makeRow({ atmosphere_rating: r }));
      const m = computeHomeAtmosphereMetrics(rows);
      for (const r of ATMOSPHERE_RATINGS) {
        expect(m.rating_breakdown[r]).toBe(1);
      }
    });
  });

  describe("unique_assessors", () => {
    it("counts distinct assessors", () => {
      const rows = [
        makeRow({ assessor_name: "Staff A" }),
        makeRow({ assessor_name: "Staff A" }),
        makeRow({ assessor_name: "Staff B" }),
      ];
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.unique_assessors).toBe(2);
    });

    it("returns 1 when all rows have the same assessor", () => {
      const rows = [
        makeRow({ assessor_name: "Staff A" }),
        makeRow({ assessor_name: "Staff A" }),
        makeRow({ assessor_name: "Staff A" }),
      ];
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.unique_assessors).toBe(1);
    });

    it("counts each unique assessor name", () => {
      const rows = [
        makeRow({ assessor_name: "Alice" }),
        makeRow({ assessor_name: "Bob" }),
        makeRow({ assessor_name: "Charlie" }),
        makeRow({ assessor_name: "Alice" }),
      ];
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.unique_assessors).toBe(3);
    });
  });

  describe("percentage calculations with known values", () => {
    it("child_views_rate 0 when all false", () => {
      expect(computeHomeAtmosphereMetrics([makeRow({ child_views_included: false })]).child_views_rate).toBe(0);
    });

    it("mixed boolean rate (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ child_views_included: true }),
        makeRow({ child_views_included: false }),
        makeRow({ child_views_included: false }),
      ];
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.child_views_rate).toBe(33.3);
    });

    it("returns 100 for all rates when single row has all flags true", () => {
      const rows = [
        makeRow({ child_views_included: true, staff_views_included: true, visitor_views_included: true, actions_implemented: true, shared_with_children: true }),
      ];
      const m = computeHomeAtmosphereMetrics(rows);
      expect(m.child_views_rate).toBe(100);
      expect(m.staff_views_rate).toBe(100);
      expect(m.visitor_views_rate).toBe(100);
      expect(m.actions_implemented_rate).toBe(100);
      expect(m.shared_with_children_rate).toBe(100);
    });
  });

  describe("counts", () => {
    it("counts inadequate_count", () => {
      expect(computeHomeAtmosphereMetrics([makeRow({ atmosphere_rating: "inadequate" })]).inadequate_count).toBe(1);
    });

    it("does not count adequate as inadequate", () => {
      expect(computeHomeAtmosphereMetrics([makeRow({ atmosphere_rating: "adequate" })]).inadequate_count).toBe(0);
    });

    it("counts requires_improvement_count", () => {
      expect(computeHomeAtmosphereMetrics([makeRow({ atmosphere_rating: "requires_improvement" })]).requires_improvement_count).toBe(1);
    });

    it("counts urgent_action_count", () => {
      expect(computeHomeAtmosphereMetrics([makeRow({ action_required: "urgent_action" })]).urgent_action_count).toBe(1);
    });

    it("does not count significant_action as urgent_action", () => {
      expect(computeHomeAtmosphereMetrics([makeRow({ action_required: "significant_action" })]).urgent_action_count).toBe(0);
    });

    it("counts actions_not_implemented only when improvement_actions_identified and not implemented", () => {
      expect(computeHomeAtmosphereMetrics([makeRow({ improvement_actions_identified: true, actions_implemented: false })]).actions_not_implemented_count).toBe(1);
    });

    it("does not count actions_not_implemented when actions are implemented", () => {
      expect(computeHomeAtmosphereMetrics([makeRow({ improvement_actions_identified: true, actions_implemented: true })]).actions_not_implemented_count).toBe(0);
    });

    it("does not count actions_not_implemented when no improvement actions identified", () => {
      expect(computeHomeAtmosphereMetrics([makeRow({ improvement_actions_identified: false, actions_implemented: false })]).actions_not_implemented_count).toBe(0);
    });
  });
});

// ── computeHomeAtmosphereAlerts ────────────────────────────────────────

describe("computeHomeAtmosphereAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no rows", () => {
      const alerts = computeHomeAtmosphereAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all rows are clean", () => {
      const rows = [
        makeRow({ atmosphere_rating: "good", action_required: "none", child_views_included: true, improvement_actions_identified: false, actions_implemented: false }),
      ];
      const alerts = computeHomeAtmosphereAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  describe("inadequate_urgent alert", () => {
    it("fires when inadequate rating and urgent action", () => {
      const rows = [makeRow({ atmosphere_rating: "inadequate", action_required: "urgent_action" })];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "inadequate_urgent");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ atmosphere_rating: "inadequate", action_required: "urgent_action" })];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "inadequate_urgent")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "atm-1", atmosphere_rating: "inadequate", action_required: "urgent_action" })];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "inadequate_urgent")!;
      expect(alert.record_id).toBe("atm-1");
    });

    it("replaces underscores in dimension in message", () => {
      const rows = [makeRow({ atmosphere_rating: "inadequate", action_required: "urgent_action", atmosphere_dimension: "safety_feeling" })];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "inadequate_urgent")!;
      expect(alert.message).toContain("safety feeling");
    });

    it("does not fire for inadequate without urgent action", () => {
      const rows = [makeRow({ atmosphere_rating: "inadequate", action_required: "significant_action" })];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "inadequate_urgent");
      expect(alert).toBeUndefined();
    });

    it("does not fire for urgent action without inadequate rating", () => {
      const rows = [makeRow({ atmosphere_rating: "requires_improvement", action_required: "urgent_action" })];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "inadequate_urgent");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple inadequate + urgent", () => {
      const rows = [
        makeRow({ atmosphere_rating: "inadequate", action_required: "urgent_action" }),
        makeRow({ atmosphere_rating: "inadequate", action_required: "urgent_action" }),
      ];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const critical = alerts.filter((a) => a.type === "inadequate_urgent");
      expect(critical).toHaveLength(2);
    });
  });

  describe("improvement_actions_outstanding alert", () => {
    it("fires when requires_improvement with actions identified but not implemented", () => {
      const rows = [makeRow({ atmosphere_rating: "requires_improvement", improvement_actions_identified: true, actions_implemented: false })];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "improvement_actions_outstanding");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ atmosphere_rating: "requires_improvement", improvement_actions_identified: true, actions_implemented: false })];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "improvement_actions_outstanding")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "atm-2", atmosphere_rating: "requires_improvement", improvement_actions_identified: true, actions_implemented: false })];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "improvement_actions_outstanding")!;
      expect(alert.record_id).toBe("atm-2");
    });

    it("does not fire when actions are implemented", () => {
      const rows = [makeRow({ atmosphere_rating: "requires_improvement", improvement_actions_identified: true, actions_implemented: true })];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "improvement_actions_outstanding");
      expect(alert).toBeUndefined();
    });

    it("does not fire when no improvement actions identified", () => {
      const rows = [makeRow({ atmosphere_rating: "requires_improvement", improvement_actions_identified: false, actions_implemented: false })];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "improvement_actions_outstanding");
      expect(alert).toBeUndefined();
    });

    it("does not fire for good rating with actions not implemented", () => {
      const rows = [makeRow({ atmosphere_rating: "good", improvement_actions_identified: true, actions_implemented: false })];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "improvement_actions_outstanding");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple outstanding", () => {
      const rows = [
        makeRow({ atmosphere_rating: "requires_improvement", improvement_actions_identified: true, actions_implemented: false }),
        makeRow({ atmosphere_rating: "requires_improvement", improvement_actions_identified: true, actions_implemented: false }),
      ];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const outstanding = alerts.filter((a) => a.type === "improvement_actions_outstanding");
      expect(outstanding).toHaveLength(2);
    });
  });

  describe("child_views_missing alert", () => {
    it("fires when 2 or more assessments lack child views", () => {
      const rows = [
        makeRow({ child_views_included: false }),
        makeRow({ child_views_included: false }),
      ];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_views_missing");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [
        makeRow({ child_views_included: false }),
        makeRow({ child_views_included: false }),
      ];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_views_missing")!;
      expect(alert.severity).toBe("high");
    });

    it("includes count in message", () => {
      const rows = [
        makeRow({ child_views_included: false }),
        makeRow({ child_views_included: false }),
        makeRow({ child_views_included: false }),
      ];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_views_missing")!;
      expect(alert.message).toContain("3");
    });

    it("does not fire when only 1 assessment lacks child views", () => {
      const rows = [makeRow({ child_views_included: false })];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_views_missing");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all include child views", () => {
      const rows = [makeRow({ child_views_included: true }), makeRow({ child_views_included: true })];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "child_views_missing");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert", () => {
      const rows = [
        makeRow({ child_views_included: false }),
        makeRow({ child_views_included: false }),
        makeRow({ child_views_included: false }),
      ];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const missing = alerts.filter((a) => a.type === "child_views_missing");
      expect(missing).toHaveLength(1);
    });
  });

  describe("actions_not_implemented alert", () => {
    it("fires when 2 or more assessments have actions identified but not implemented", () => {
      const rows = [
        makeRow({ improvement_actions_identified: true, actions_implemented: false }),
        makeRow({ improvement_actions_identified: true, actions_implemented: false }),
      ];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "actions_not_implemented");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [
        makeRow({ improvement_actions_identified: true, actions_implemented: false }),
        makeRow({ improvement_actions_identified: true, actions_implemented: false }),
      ];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "actions_not_implemented")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes count in message", () => {
      const rows = [
        makeRow({ improvement_actions_identified: true, actions_implemented: false }),
        makeRow({ improvement_actions_identified: true, actions_implemented: false }),
        makeRow({ improvement_actions_identified: true, actions_implemented: false }),
      ];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "actions_not_implemented")!;
      expect(alert.message).toContain("3");
    });

    it("does not fire when only 1 assessment has unimplemented actions", () => {
      const rows = [makeRow({ improvement_actions_identified: true, actions_implemented: false })];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "actions_not_implemented");
      expect(alert).toBeUndefined();
    });

    it("does not fire when all actions are implemented", () => {
      const rows = [
        makeRow({ improvement_actions_identified: true, actions_implemented: true }),
        makeRow({ improvement_actions_identified: true, actions_implemented: true }),
      ];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "actions_not_implemented");
      expect(alert).toBeUndefined();
    });

    it("does not count rows without improvement_actions_identified", () => {
      const rows = [
        makeRow({ improvement_actions_identified: false, actions_implemented: false }),
        makeRow({ improvement_actions_identified: false, actions_implemented: false }),
      ];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const alert = alerts.find((a) => a.type === "actions_not_implemented");
      expect(alert).toBeUndefined();
    });

    it("fires only once as aggregate alert", () => {
      const rows = [
        makeRow({ improvement_actions_identified: true, actions_implemented: false }),
        makeRow({ improvement_actions_identified: true, actions_implemented: false }),
        makeRow({ improvement_actions_identified: true, actions_implemented: false }),
      ];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const notImpl = alerts.filter((a) => a.type === "actions_not_implemented");
      expect(notImpl).toHaveLength(1);
    });
  });

  describe("combined alerts", () => {
    it("can fire all four alert types simultaneously", () => {
      const rows = [
        makeRow({ atmosphere_rating: "inadequate", action_required: "urgent_action", child_views_included: false, improvement_actions_identified: true, actions_implemented: false }),
        makeRow({ atmosphere_rating: "requires_improvement", child_views_included: false, improvement_actions_identified: true, actions_implemented: false }),
      ];
      const alerts = computeHomeAtmosphereAlerts(rows);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("inadequate_urgent");
      expect(types).toContain("improvement_actions_outstanding");
      expect(types).toContain("child_views_missing");
      expect(types).toContain("actions_not_implemented");
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const rows = [
        makeRow({ atmosphere_rating: "inadequate", action_required: "urgent_action", improvement_actions_identified: true, actions_implemented: false }),
      ];
      const alerts = computeHomeAtmosphereAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const rows = [
        makeRow({ atmosphere_rating: "inadequate", action_required: "urgent_action", child_views_included: false, improvement_actions_identified: true, actions_implemented: false }),
        makeRow({ atmosphere_rating: "requires_improvement", child_views_included: false, improvement_actions_identified: true, actions_implemented: false }),
      ];
      const alerts = computeHomeAtmosphereAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const rows = [makeRow({ atmosphere_rating: "inadequate", action_required: "urgent_action" })];
      const alerts = computeHomeAtmosphereAlerts(rows);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });
});

// ── generateHomeAtmosphereCaraInsights ──────────────────────────────────

describe("generateHomeAtmosphereCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const metrics = computeHomeAtmosphereMetrics([]);
    const alerts = computeHomeAtmosphereAlerts([]);
    const insights = generateHomeAtmosphereCaraInsights(metrics, alerts);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [cyan]", () => {
    const metrics = computeHomeAtmosphereMetrics([makeRow()]);
    const alerts = computeHomeAtmosphereAlerts([makeRow()]);
    const insights = generateHomeAtmosphereCaraInsights(metrics, alerts);
    expect(insights[0]).toMatch(/^\[cyan\]/);
  });

  it("first insight includes total_assessments count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const metrics = computeHomeAtmosphereMetrics(rows);
    const alerts = computeHomeAtmosphereAlerts(rows);
    const insights = generateHomeAtmosphereCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes child_views_rate", () => {
    const rows = [makeRow({ child_views_included: true }), makeRow({ child_views_included: false })];
    const metrics = computeHomeAtmosphereMetrics(rows);
    const alerts = computeHomeAtmosphereAlerts(rows);
    const insights = generateHomeAtmosphereCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("50%");
  });

  it("second insight starts with [amber]", () => {
    const metrics = computeHomeAtmosphereMetrics([makeRow()]);
    const alerts = computeHomeAtmosphereAlerts([makeRow()]);
    const insights = generateHomeAtmosphereCaraInsights(metrics, alerts);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions critical and high alerts when present", () => {
    const rows = [
      makeRow({ atmosphere_rating: "inadequate", action_required: "urgent_action", improvement_actions_identified: true, actions_implemented: false }),
    ];
    const metrics = computeHomeAtmosphereMetrics(rows);
    const alerts = computeHomeAtmosphereAlerts(rows);
    const insights = generateHomeAtmosphereCaraInsights(metrics, alerts);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high");
  });

  it("second insight mentions no alerts when none present", () => {
    const rows = [makeRow({ atmosphere_rating: "good", action_required: "none", child_views_included: true, improvement_actions_identified: false })];
    const metrics = computeHomeAtmosphereMetrics(rows);
    const alerts = computeHomeAtmosphereAlerts(rows);
    const insights = generateHomeAtmosphereCaraInsights(metrics, alerts);
    expect(insights[1]).toContain("No critical or high-priority alerts");
  });

  it("third insight starts with [reflect]", () => {
    const metrics = computeHomeAtmosphereMetrics([makeRow()]);
    const alerts = computeHomeAtmosphereAlerts([makeRow()]);
    const insights = generateHomeAtmosphereCaraInsights(metrics, alerts);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions inadequate when some are inadequate", () => {
    const rows = [makeRow({ atmosphere_rating: "inadequate" })];
    const metrics = computeHomeAtmosphereMetrics(rows);
    const alerts = computeHomeAtmosphereAlerts(rows);
    const insights = generateHomeAtmosphereCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("inadequate");
  });

  it("third insight asks about child views when no inadequate but not all include child views", () => {
    const rows = [
      makeRow({ atmosphere_rating: "good", child_views_included: false }),
      makeRow({ atmosphere_rating: "good", child_views_included: true }),
    ];
    const metrics = computeHomeAtmosphereMetrics(rows);
    const alerts = computeHomeAtmosphereAlerts(rows);
    const insights = generateHomeAtmosphereCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("Child views");
  });

  it("third insight celebrates when all include child views and no inadequate", () => {
    const rows = [
      makeRow({ atmosphere_rating: "good", child_views_included: true }),
      makeRow({ atmosphere_rating: "good", child_views_included: true }),
    ];
    const metrics = computeHomeAtmosphereMetrics(rows);
    const alerts = computeHomeAtmosphereAlerts(rows);
    const insights = generateHomeAtmosphereCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("child views and no inadequate");
  });

  it("uses singular assessor wording when unique_assessors is 1", () => {
    const rows = [makeRow({ assessor_name: "Staff A" })];
    const metrics = computeHomeAtmosphereMetrics(rows);
    const alerts = computeHomeAtmosphereAlerts(rows);
    const insights = generateHomeAtmosphereCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("1 assessor");
  });

  it("uses plural assessors wording when unique_assessors > 1", () => {
    const rows = [
      makeRow({ assessor_name: "Staff A" }),
      makeRow({ assessor_name: "Staff B" }),
    ];
    const metrics = computeHomeAtmosphereMetrics(rows);
    const alerts = computeHomeAtmosphereAlerts(rows);
    const insights = generateHomeAtmosphereCaraInsights(metrics, alerts);
    expect(insights[0]).toContain("2 assessors");
  });

  it("all insights are non-empty strings", () => {
    const metrics = computeHomeAtmosphereMetrics([makeRow()]);
    const alerts = computeHomeAtmosphereAlerts([makeRow()]);
    const insights = generateHomeAtmosphereCaraInsights(metrics, alerts);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  it("uses singular assessment wording when 1 inadequate", () => {
    const rows = [makeRow({ atmosphere_rating: "inadequate" })];
    const metrics = computeHomeAtmosphereMetrics(rows);
    const alerts = computeHomeAtmosphereAlerts(rows);
    const insights = generateHomeAtmosphereCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("assessment has");
  });

  it("uses plural assessments wording when multiple inadequate", () => {
    const rows = [
      makeRow({ atmosphere_rating: "inadequate" }),
      makeRow({ atmosphere_rating: "inadequate" }),
    ];
    const metrics = computeHomeAtmosphereMetrics(rows);
    const alerts = computeHomeAtmosphereAlerts(rows);
    const insights = generateHomeAtmosphereCaraInsights(metrics, alerts);
    expect(insights[2]).toContain("assessments have");
  });
});
