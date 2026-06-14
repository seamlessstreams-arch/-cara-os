// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME FIRE RISK ASSESSMENT SERVICE TESTS
// Pure-function tests for fire risk metrics, alert identification,
// Cara insight generation, constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  RISK_RATINGS,
  ASSESSMENT_AREAS,
  COMPLIANCE_STATUSES,
  ACTION_PRIORITIES,
  _testing,
} from "../home-fire-risk-assessment-service";

import type {
  HomeFireRiskAssessmentRow,
  RiskRating,
  AssessmentArea,
  ComplianceStatus,
  ActionPriority,
} from "../home-fire-risk-assessment-service";

const {
  computeFireRiskMetrics,
  computeFireRiskAlerts,
  generateFireRiskCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<HomeFireRiskAssessmentRow>,
): HomeFireRiskAssessmentRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : "home-1",
    assessor_name: "assessor_name" in (overrides ?? {}) ? overrides!.assessor_name! : "Staff A",
    assessor_id: "assessor_id" in (overrides ?? {}) ? (overrides!.assessor_id ?? null) : null,
    assessment_date: "assessment_date" in (overrides ?? {}) ? overrides!.assessment_date! : now.toISOString().split("T")[0],
    risk_rating: "risk_rating" in (overrides ?? {}) ? overrides!.risk_rating! : "low",
    assessment_area: "assessment_area" in (overrides ?? {}) ? overrides!.assessment_area! : "means_of_escape",
    compliance_status: "compliance_status" in (overrides ?? {}) ? overrides!.compliance_status! : "compliant",
    action_priority: "action_priority" in (overrides ?? {}) ? overrides!.action_priority! : "routine",
    escape_routes_clear: "escape_routes_clear" in (overrides ?? {}) ? overrides!.escape_routes_clear! : true,
    fire_doors_functional: "fire_doors_functional" in (overrides ?? {}) ? overrides!.fire_doors_functional! : true,
    detection_system_tested: "detection_system_tested" in (overrides ?? {}) ? overrides!.detection_system_tested! : true,
    extinguishers_serviced: "extinguishers_serviced" in (overrides ?? {}) ? overrides!.extinguishers_serviced! : true,
    evacuation_plan_current: "evacuation_plan_current" in (overrides ?? {}) ? overrides!.evacuation_plan_current! : true,
    staff_fire_trained: "staff_fire_trained" in (overrides ?? {}) ? overrides!.staff_fire_trained! : true,
    fire_drills_completed: "fire_drills_completed" in (overrides ?? {}) ? overrides!.fire_drills_completed! : true,
    compartmentation_intact: "compartmentation_intact" in (overrides ?? {}) ? overrides!.compartmentation_intact! : true,
    emergency_lighting_tested: "emergency_lighting_tested" in (overrides ?? {}) ? overrides!.emergency_lighting_tested! : true,
    signage_adequate: "signage_adequate" in (overrides ?? {}) ? overrides!.signage_adequate! : true,
    electrical_safety_tested: "electrical_safety_tested" in (overrides ?? {}) ? overrides!.electrical_safety_tested! : true,
    peep_in_place: "peep_in_place" in (overrides ?? {}) ? overrides!.peep_in_place! : true,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    action_details: "action_details" in (overrides ?? {}) ? (overrides!.action_details ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : now.toISOString(),
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : now.toISOString(),
  };
}

// ── Enum completeness ───────────────────────────────────────────────────

describe("enum arrays", () => {
  it("RISK_RATINGS has 5 entries", () => {
    expect(RISK_RATINGS).toHaveLength(5);
  });

  it("RISK_RATINGS contains expected values", () => {
    expect(RISK_RATINGS).toContain("low");
    expect(RISK_RATINGS).toContain("medium");
    expect(RISK_RATINGS).toContain("significant");
    expect(RISK_RATINGS).toContain("high");
    expect(RISK_RATINGS).toContain("intolerable");
  });

  it("ASSESSMENT_AREAS has 8 entries", () => {
    expect(ASSESSMENT_AREAS).toHaveLength(8);
  });

  it("ASSESSMENT_AREAS contains expected values", () => {
    expect(ASSESSMENT_AREAS).toContain("means_of_escape");
    expect(ASSESSMENT_AREAS).toContain("fire_detection");
    expect(ASSESSMENT_AREAS).toContain("fire_fighting_equipment");
    expect(ASSESSMENT_AREAS).toContain("compartmentation");
    expect(ASSESSMENT_AREAS).toContain("emergency_lighting");
    expect(ASSESSMENT_AREAS).toContain("signage");
    expect(ASSESSMENT_AREAS).toContain("housekeeping");
    expect(ASSESSMENT_AREAS).toContain("electrical_safety");
  });

  it("COMPLIANCE_STATUSES has 5 entries", () => {
    expect(COMPLIANCE_STATUSES).toHaveLength(5);
  });

  it("COMPLIANCE_STATUSES contains expected values", () => {
    expect(COMPLIANCE_STATUSES).toContain("compliant");
    expect(COMPLIANCE_STATUSES).toContain("minor_deficiency");
    expect(COMPLIANCE_STATUSES).toContain("major_deficiency");
    expect(COMPLIANCE_STATUSES).toContain("non_compliant");
    expect(COMPLIANCE_STATUSES).toContain("not_assessed");
  });

  it("ACTION_PRIORITIES has 6 entries", () => {
    expect(ACTION_PRIORITIES).toHaveLength(6);
  });

  it("ACTION_PRIORITIES contains expected values", () => {
    expect(ACTION_PRIORITIES).toContain("immediate");
    expect(ACTION_PRIORITIES).toContain("within_24_hours");
    expect(ACTION_PRIORITIES).toContain("within_1_week");
    expect(ACTION_PRIORITIES).toContain("within_1_month");
    expect(ACTION_PRIORITIES).toContain("routine");
    expect(ACTION_PRIORITIES).toContain("completed");
  });
});

// ── computeFireRiskMetrics ──────────────────────────────────────────────

describe("computeFireRiskMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_assessments", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.total_assessments).toBe(0);
    });

    it("returns zero high_risk_count", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.high_risk_count).toBe(0);
    });

    it("returns zero intolerable_count", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.intolerable_count).toBe(0);
    });

    it("returns zero non_compliant_count", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns zero major_deficiency_count", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.major_deficiency_count).toBe(0);
    });

    it("returns zero escape_routes_clear_rate", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.escape_routes_clear_rate).toBe(0);
    });

    it("returns zero fire_doors_functional_rate", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.fire_doors_functional_rate).toBe(0);
    });

    it("returns zero detection_system_tested_rate", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.detection_system_tested_rate).toBe(0);
    });

    it("returns zero extinguishers_serviced_rate", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.extinguishers_serviced_rate).toBe(0);
    });

    it("returns zero evacuation_plan_current_rate", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.evacuation_plan_current_rate).toBe(0);
    });

    it("returns zero staff_fire_trained_rate", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.staff_fire_trained_rate).toBe(0);
    });

    it("returns zero fire_drills_completed_rate", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.fire_drills_completed_rate).toBe(0);
    });

    it("returns zero compartmentation_intact_rate", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.compartmentation_intact_rate).toBe(0);
    });

    it("returns zero emergency_lighting_tested_rate", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.emergency_lighting_tested_rate).toBe(0);
    });

    it("returns zero signage_adequate_rate", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.signage_adequate_rate).toBe(0);
    });

    it("returns zero electrical_safety_tested_rate", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.electrical_safety_tested_rate).toBe(0);
    });

    it("returns zero peep_in_place_rate", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.peep_in_place_rate).toBe(0);
    });

    it("returns empty risk_breakdown", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.risk_breakdown).toEqual({});
    });

    it("returns empty area_breakdown", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.area_breakdown).toEqual({});
    });

    it("returns zero unique_assessors", () => {
      const m = computeFireRiskMetrics([]);
      expect(m.unique_assessors).toBe(0);
    });
  });

  describe("single row", () => {
    const row = makeRow({
      risk_rating: "low",
      compliance_status: "compliant",
      assessment_area: "means_of_escape",
      assessor_name: "Staff A",
      escape_routes_clear: true,
      fire_doors_functional: true,
      detection_system_tested: true,
      extinguishers_serviced: true,
      evacuation_plan_current: true,
      staff_fire_trained: true,
      fire_drills_completed: true,
      compartmentation_intact: true,
      emergency_lighting_tested: true,
      signage_adequate: true,
      electrical_safety_tested: true,
      peep_in_place: true,
    });

    it("returns total_assessments = 1", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.total_assessments).toBe(1);
    });

    it("returns high_risk_count = 0", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.high_risk_count).toBe(0);
    });

    it("returns intolerable_count = 0", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.intolerable_count).toBe(0);
    });

    it("returns non_compliant_count = 0", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns major_deficiency_count = 0", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.major_deficiency_count).toBe(0);
    });

    it("returns escape_routes_clear_rate = 100", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.escape_routes_clear_rate).toBe(100);
    });

    it("returns fire_doors_functional_rate = 100", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.fire_doors_functional_rate).toBe(100);
    });

    it("returns detection_system_tested_rate = 100", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.detection_system_tested_rate).toBe(100);
    });

    it("returns extinguishers_serviced_rate = 100", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.extinguishers_serviced_rate).toBe(100);
    });

    it("returns evacuation_plan_current_rate = 100", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.evacuation_plan_current_rate).toBe(100);
    });

    it("returns staff_fire_trained_rate = 100", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.staff_fire_trained_rate).toBe(100);
    });

    it("returns fire_drills_completed_rate = 100", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.fire_drills_completed_rate).toBe(100);
    });

    it("returns compartmentation_intact_rate = 100", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.compartmentation_intact_rate).toBe(100);
    });

    it("returns emergency_lighting_tested_rate = 100", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.emergency_lighting_tested_rate).toBe(100);
    });

    it("returns signage_adequate_rate = 100", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.signage_adequate_rate).toBe(100);
    });

    it("returns electrical_safety_tested_rate = 100", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.electrical_safety_tested_rate).toBe(100);
    });

    it("returns peep_in_place_rate = 100", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.peep_in_place_rate).toBe(100);
    });

    it("returns risk_breakdown with single entry", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.risk_breakdown).toEqual({ low: 1 });
    });

    it("returns area_breakdown with single entry", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.area_breakdown).toEqual({ means_of_escape: 1 });
    });

    it("returns unique_assessors = 1", () => {
      const m = computeFireRiskMetrics([row]);
      expect(m.unique_assessors).toBe(1);
    });
  });

  describe("multiple rows", () => {
    const rows = [
      makeRow({ risk_rating: "low", compliance_status: "compliant", assessment_area: "means_of_escape", assessor_name: "Staff A", escape_routes_clear: true, fire_doors_functional: true, detection_system_tested: true, extinguishers_serviced: true, evacuation_plan_current: true, staff_fire_trained: true, fire_drills_completed: true, compartmentation_intact: true, emergency_lighting_tested: true, signage_adequate: true, electrical_safety_tested: true, peep_in_place: true }),
      makeRow({ risk_rating: "high", compliance_status: "non_compliant", assessment_area: "fire_detection", assessor_name: "Staff B", escape_routes_clear: false, fire_doors_functional: false, detection_system_tested: false, extinguishers_serviced: false, evacuation_plan_current: false, staff_fire_trained: false, fire_drills_completed: false, compartmentation_intact: false, emergency_lighting_tested: false, signage_adequate: false, electrical_safety_tested: false, peep_in_place: false }),
      makeRow({ risk_rating: "intolerable", compliance_status: "major_deficiency", assessment_area: "compartmentation", assessor_name: "Staff C", escape_routes_clear: true, fire_doors_functional: false, detection_system_tested: true, extinguishers_serviced: true, evacuation_plan_current: false, staff_fire_trained: true, fire_drills_completed: false, compartmentation_intact: false, emergency_lighting_tested: true, signage_adequate: true, electrical_safety_tested: false, peep_in_place: true }),
    ];

    it("returns total_assessments = 3", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.total_assessments).toBe(3);
    });

    it("returns high_risk_count = 1", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.high_risk_count).toBe(1);
    });

    it("returns intolerable_count = 1", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.intolerable_count).toBe(1);
    });

    it("returns non_compliant_count = 1", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.non_compliant_count).toBe(1);
    });

    it("returns major_deficiency_count = 1", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.major_deficiency_count).toBe(1);
    });

    it("calculates escape_routes_clear_rate correctly (2/3 = 66.7%)", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.escape_routes_clear_rate).toBe(66.7);
    });

    it("calculates fire_doors_functional_rate correctly (1/3 = 33.3%)", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.fire_doors_functional_rate).toBe(33.3);
    });

    it("calculates detection_system_tested_rate correctly (2/3 = 66.7%)", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.detection_system_tested_rate).toBe(66.7);
    });

    it("calculates extinguishers_serviced_rate correctly (2/3 = 66.7%)", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.extinguishers_serviced_rate).toBe(66.7);
    });

    it("calculates evacuation_plan_current_rate correctly (1/3 = 33.3%)", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.evacuation_plan_current_rate).toBe(33.3);
    });

    it("calculates staff_fire_trained_rate correctly (2/3 = 66.7%)", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.staff_fire_trained_rate).toBe(66.7);
    });

    it("calculates fire_drills_completed_rate correctly (1/3 = 33.3%)", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.fire_drills_completed_rate).toBe(33.3);
    });

    it("calculates compartmentation_intact_rate correctly (1/3 = 33.3%)", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.compartmentation_intact_rate).toBe(33.3);
    });

    it("calculates emergency_lighting_tested_rate correctly (2/3 = 66.7%)", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.emergency_lighting_tested_rate).toBe(66.7);
    });

    it("calculates signage_adequate_rate correctly (2/3 = 66.7%)", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.signage_adequate_rate).toBe(66.7);
    });

    it("calculates electrical_safety_tested_rate correctly (1/3 = 33.3%)", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.electrical_safety_tested_rate).toBe(33.3);
    });

    it("calculates peep_in_place_rate correctly (2/3 = 66.7%)", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.peep_in_place_rate).toBe(66.7);
    });

    it("groups risk_breakdown correctly", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.risk_breakdown).toEqual({ low: 1, high: 1, intolerable: 1 });
    });

    it("groups area_breakdown correctly", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.area_breakdown).toEqual({ means_of_escape: 1, fire_detection: 1, compartmentation: 1 });
    });

    it("returns unique_assessors = 3", () => {
      const m = computeFireRiskMetrics(rows);
      expect(m.unique_assessors).toBe(3);
    });
  });

  describe("high_risk_count", () => {
    it("counts only high risk_rating", () => {
      const rows = [
        makeRow({ risk_rating: "high" }),
        makeRow({ risk_rating: "high" }),
        makeRow({ risk_rating: "intolerable" }),
      ];
      const m = computeFireRiskMetrics(rows);
      expect(m.high_risk_count).toBe(2);
    });

    it("does not count low as high", () => {
      const m = computeFireRiskMetrics([makeRow({ risk_rating: "low" })]);
      expect(m.high_risk_count).toBe(0);
    });

    it("does not count medium as high", () => {
      const m = computeFireRiskMetrics([makeRow({ risk_rating: "medium" })]);
      expect(m.high_risk_count).toBe(0);
    });

    it("does not count significant as high", () => {
      const m = computeFireRiskMetrics([makeRow({ risk_rating: "significant" })]);
      expect(m.high_risk_count).toBe(0);
    });

    it("does not count intolerable as high", () => {
      const m = computeFireRiskMetrics([makeRow({ risk_rating: "intolerable" })]);
      expect(m.high_risk_count).toBe(0);
    });
  });

  describe("intolerable_count", () => {
    it("counts only intolerable risk_rating", () => {
      const rows = [
        makeRow({ risk_rating: "intolerable" }),
        makeRow({ risk_rating: "intolerable" }),
        makeRow({ risk_rating: "high" }),
      ];
      const m = computeFireRiskMetrics(rows);
      expect(m.intolerable_count).toBe(2);
    });

    it("does not count high as intolerable", () => {
      const m = computeFireRiskMetrics([makeRow({ risk_rating: "high" })]);
      expect(m.intolerable_count).toBe(0);
    });
  });

  describe("non_compliant_count", () => {
    it("counts only non_compliant compliance_status", () => {
      const rows = [
        makeRow({ compliance_status: "non_compliant" }),
        makeRow({ compliance_status: "non_compliant" }),
        makeRow({ compliance_status: "major_deficiency" }),
      ];
      const m = computeFireRiskMetrics(rows);
      expect(m.non_compliant_count).toBe(2);
    });

    it("does not count major_deficiency as non_compliant", () => {
      const m = computeFireRiskMetrics([makeRow({ compliance_status: "major_deficiency" })]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("does not count minor_deficiency as non_compliant", () => {
      const m = computeFireRiskMetrics([makeRow({ compliance_status: "minor_deficiency" })]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("does not count compliant as non_compliant", () => {
      const m = computeFireRiskMetrics([makeRow({ compliance_status: "compliant" })]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("does not count not_assessed as non_compliant", () => {
      const m = computeFireRiskMetrics([makeRow({ compliance_status: "not_assessed" })]);
      expect(m.non_compliant_count).toBe(0);
    });
  });

  describe("major_deficiency_count", () => {
    it("counts only major_deficiency compliance_status", () => {
      const rows = [
        makeRow({ compliance_status: "major_deficiency" }),
        makeRow({ compliance_status: "major_deficiency" }),
        makeRow({ compliance_status: "non_compliant" }),
      ];
      const m = computeFireRiskMetrics(rows);
      expect(m.major_deficiency_count).toBe(2);
    });

    it("does not count non_compliant as major_deficiency", () => {
      const m = computeFireRiskMetrics([makeRow({ compliance_status: "non_compliant" })]);
      expect(m.major_deficiency_count).toBe(0);
    });
  });

  describe("percentage calculations with known values", () => {
    it("returns 0 when all booleans false for single row", () => {
      const row = makeRow({
        escape_routes_clear: false,
        fire_doors_functional: false,
        detection_system_tested: false,
        extinguishers_serviced: false,
        evacuation_plan_current: false,
        staff_fire_trained: false,
        fire_drills_completed: false,
        compartmentation_intact: false,
        emergency_lighting_tested: false,
        signage_adequate: false,
        electrical_safety_tested: false,
        peep_in_place: false,
      });
      const m = computeFireRiskMetrics([row]);
      expect(m.escape_routes_clear_rate).toBe(0);
      expect(m.fire_doors_functional_rate).toBe(0);
      expect(m.detection_system_tested_rate).toBe(0);
      expect(m.extinguishers_serviced_rate).toBe(0);
      expect(m.evacuation_plan_current_rate).toBe(0);
      expect(m.staff_fire_trained_rate).toBe(0);
      expect(m.fire_drills_completed_rate).toBe(0);
      expect(m.compartmentation_intact_rate).toBe(0);
      expect(m.emergency_lighting_tested_rate).toBe(0);
      expect(m.signage_adequate_rate).toBe(0);
      expect(m.electrical_safety_tested_rate).toBe(0);
      expect(m.peep_in_place_rate).toBe(0);
    });

    it("mixed boolean rate (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ escape_routes_clear: true }),
        makeRow({ escape_routes_clear: false }),
        makeRow({ escape_routes_clear: false }),
      ];
      const m = computeFireRiskMetrics(rows);
      expect(m.escape_routes_clear_rate).toBe(33.3);
    });

    it("mixed boolean rate (2/3 = 66.7%)", () => {
      const rows = [
        makeRow({ fire_doors_functional: true }),
        makeRow({ fire_doors_functional: true }),
        makeRow({ fire_doors_functional: false }),
      ];
      const m = computeFireRiskMetrics(rows);
      expect(m.fire_doors_functional_rate).toBe(66.7);
    });

    it("50% rate for half true", () => {
      const rows = [
        makeRow({ peep_in_place: true }),
        makeRow({ peep_in_place: false }),
      ];
      const m = computeFireRiskMetrics(rows);
      expect(m.peep_in_place_rate).toBe(50);
    });
  });

  describe("risk_breakdown", () => {
    it("counts duplicate risk ratings", () => {
      const rows = [
        makeRow({ risk_rating: "low" }),
        makeRow({ risk_rating: "low" }),
        makeRow({ risk_rating: "high" }),
      ];
      const m = computeFireRiskMetrics(rows);
      expect(m.risk_breakdown).toEqual({ low: 2, high: 1 });
    });

    it("handles all 5 risk ratings", () => {
      const rows = RISK_RATINGS.map((r) => makeRow({ risk_rating: r }));
      const m = computeFireRiskMetrics(rows);
      for (const r of RISK_RATINGS) {
        expect(m.risk_breakdown[r]).toBe(1);
      }
    });
  });

  describe("area_breakdown", () => {
    it("counts duplicate assessment areas", () => {
      const rows = [
        makeRow({ assessment_area: "means_of_escape" }),
        makeRow({ assessment_area: "means_of_escape" }),
        makeRow({ assessment_area: "fire_detection" }),
      ];
      const m = computeFireRiskMetrics(rows);
      expect(m.area_breakdown).toEqual({ means_of_escape: 2, fire_detection: 1 });
    });

    it("handles all 8 assessment areas", () => {
      const rows = ASSESSMENT_AREAS.map((a) => makeRow({ assessment_area: a }));
      const m = computeFireRiskMetrics(rows);
      for (const a of ASSESSMENT_AREAS) {
        expect(m.area_breakdown[a]).toBe(1);
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
      const m = computeFireRiskMetrics(rows);
      expect(m.unique_assessors).toBe(2);
    });

    it("returns 1 when all rows have the same assessor", () => {
      const rows = [
        makeRow({ assessor_name: "Staff A" }),
        makeRow({ assessor_name: "Staff A" }),
        makeRow({ assessor_name: "Staff A" }),
      ];
      const m = computeFireRiskMetrics(rows);
      expect(m.unique_assessors).toBe(1);
    });

    it("counts each unique assessor name", () => {
      const rows = [
        makeRow({ assessor_name: "Alice" }),
        makeRow({ assessor_name: "Bob" }),
        makeRow({ assessor_name: "Charlie" }),
        makeRow({ assessor_name: "Alice" }),
      ];
      const m = computeFireRiskMetrics(rows);
      expect(m.unique_assessors).toBe(3);
    });
  });
});

// ── computeFireRiskAlerts ───────────────────────────────────────────────

describe("computeFireRiskAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no rows", () => {
      const alerts = computeFireRiskAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all rows are clean", () => {
      const rows = [
        makeRow({
          risk_rating: "low",
          compliance_status: "compliant",
          assessment_area: "means_of_escape",
          escape_routes_clear: true,
          fire_doors_functional: true,
          fire_drills_completed: true,
          peep_in_place: true,
        }),
      ];
      const alerts = computeFireRiskAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  describe("intolerable_risk alert", () => {
    it("fires for intolerable risk rating", () => {
      const rows = [makeRow({ risk_rating: "intolerable" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "intolerable_risk");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ risk_rating: "intolerable" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "intolerable_risk")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "int-1", risk_rating: "intolerable" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "intolerable_risk")!;
      expect(alert.record_id).toBe("int-1");
    });

    it("replaces underscores in assessment_area in message", () => {
      const rows = [makeRow({ risk_rating: "intolerable", assessment_area: "means_of_escape" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "intolerable_risk")!;
      expect(alert.message).toContain("means of escape");
    });

    it("includes assessment_date in message", () => {
      const rows = [makeRow({ risk_rating: "intolerable", assessment_date: "2026-05-01" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "intolerable_risk")!;
      expect(alert.message).toContain("2026-05-01");
    });

    it("does not fire for high risk", () => {
      const rows = [makeRow({ risk_rating: "high" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "intolerable_risk");
      expect(alert).toBeUndefined();
    });

    it("does not fire for low risk", () => {
      const rows = [makeRow({ risk_rating: "low" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "intolerable_risk");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple intolerable", () => {
      const rows = [
        makeRow({ risk_rating: "intolerable" }),
        makeRow({ risk_rating: "intolerable" }),
      ];
      const alerts = computeFireRiskAlerts(rows);
      const intAlerts = alerts.filter((a) => a.type === "intolerable_risk");
      expect(intAlerts).toHaveLength(2);
    });

    it("message contains Fire Safety Order 2005", () => {
      const rows = [makeRow({ risk_rating: "intolerable" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "intolerable_risk")!;
      expect(alert.message).toContain("Fire Safety Order 2005");
    });
  });

  describe("high_risk alert", () => {
    it("fires for high risk rating", () => {
      const rows = [makeRow({ risk_rating: "high" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ risk_rating: "high" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "high-1", risk_rating: "high" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk")!;
      expect(alert.record_id).toBe("high-1");
    });

    it("replaces underscores in assessment_area in message", () => {
      const rows = [makeRow({ risk_rating: "high", assessment_area: "fire_fighting_equipment" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk")!;
      expect(alert.message).toContain("fire fighting equipment");
    });

    it("does not fire for significant risk", () => {
      const rows = [makeRow({ risk_rating: "significant" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk");
      expect(alert).toBeUndefined();
    });

    it("does not fire for medium risk", () => {
      const rows = [makeRow({ risk_rating: "medium" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk");
      expect(alert).toBeUndefined();
    });

    it("does not fire for low risk", () => {
      const rows = [makeRow({ risk_rating: "low" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "high_risk");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple high risks", () => {
      const rows = [
        makeRow({ risk_rating: "high" }),
        makeRow({ risk_rating: "high" }),
        makeRow({ risk_rating: "high" }),
      ];
      const alerts = computeFireRiskAlerts(rows);
      const highAlerts = alerts.filter((a) => a.type === "high_risk");
      expect(highAlerts).toHaveLength(3);
    });
  });

  describe("non_compliant_critical_area alert", () => {
    it("fires for non_compliant in means_of_escape", () => {
      const rows = [makeRow({ compliance_status: "non_compliant", assessment_area: "means_of_escape" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_critical_area");
      expect(alert).toBeDefined();
    });

    it("fires for non_compliant in fire_detection", () => {
      const rows = [makeRow({ compliance_status: "non_compliant", assessment_area: "fire_detection" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_critical_area");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ compliance_status: "non_compliant", assessment_area: "means_of_escape" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_critical_area")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "nc-crit-1", compliance_status: "non_compliant", assessment_area: "fire_detection" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_critical_area")!;
      expect(alert.record_id).toBe("nc-crit-1");
    });

    it("replaces underscores in assessment_area in message", () => {
      const rows = [makeRow({ compliance_status: "non_compliant", assessment_area: "means_of_escape" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_critical_area")!;
      expect(alert.message).toContain("means of escape");
    });

    it("does not fire for non_compliant in compartmentation", () => {
      const rows = [makeRow({ compliance_status: "non_compliant", assessment_area: "compartmentation" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_critical_area");
      expect(alert).toBeUndefined();
    });

    it("does not fire for non_compliant in signage", () => {
      const rows = [makeRow({ compliance_status: "non_compliant", assessment_area: "signage" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_critical_area");
      expect(alert).toBeUndefined();
    });

    it("does not fire for compliant in means_of_escape", () => {
      const rows = [makeRow({ compliance_status: "compliant", assessment_area: "means_of_escape" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_critical_area");
      expect(alert).toBeUndefined();
    });

    it("does not fire for major_deficiency in means_of_escape", () => {
      const rows = [makeRow({ compliance_status: "major_deficiency", assessment_area: "means_of_escape" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_critical_area");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple non_compliant critical areas", () => {
      const rows = [
        makeRow({ compliance_status: "non_compliant", assessment_area: "means_of_escape" }),
        makeRow({ compliance_status: "non_compliant", assessment_area: "fire_detection" }),
      ];
      const alerts = computeFireRiskAlerts(rows);
      const ncCritAlerts = alerts.filter((a) => a.type === "non_compliant_critical_area");
      expect(ncCritAlerts).toHaveLength(2);
    });
  });

  describe("escape_routes_not_clear alert", () => {
    it("fires when escape routes not clear", () => {
      const rows = [makeRow({ escape_routes_clear: false })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "escape_routes_not_clear");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ escape_routes_clear: false })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "escape_routes_not_clear")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "esc-1", escape_routes_clear: false })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "escape_routes_not_clear")!;
      expect(alert.record_id).toBe("esc-1");
    });

    it("replaces underscores in assessment_area in message", () => {
      const rows = [makeRow({ escape_routes_clear: false, assessment_area: "fire_fighting_equipment" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "escape_routes_not_clear")!;
      expect(alert.message).toContain("fire fighting equipment");
    });

    it("does not fire when escape routes are clear", () => {
      const rows = [makeRow({ escape_routes_clear: true })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "escape_routes_not_clear");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple rows with escape routes not clear", () => {
      const rows = [
        makeRow({ escape_routes_clear: false }),
        makeRow({ escape_routes_clear: false }),
      ];
      const alerts = computeFireRiskAlerts(rows);
      const escAlerts = alerts.filter((a) => a.type === "escape_routes_not_clear");
      expect(escAlerts).toHaveLength(2);
    });
  });

  describe("fire_doors_not_functional alert", () => {
    it("fires when fire doors not functional", () => {
      const rows = [makeRow({ fire_doors_functional: false })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "fire_doors_not_functional");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ fire_doors_functional: false })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "fire_doors_not_functional")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "fd-1", fire_doors_functional: false })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "fire_doors_not_functional")!;
      expect(alert.record_id).toBe("fd-1");
    });

    it("does not fire when fire doors are functional", () => {
      const rows = [makeRow({ fire_doors_functional: true })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "fire_doors_not_functional");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple rows with non-functional fire doors", () => {
      const rows = [
        makeRow({ fire_doors_functional: false }),
        makeRow({ fire_doors_functional: false }),
        makeRow({ fire_doors_functional: false }),
      ];
      const alerts = computeFireRiskAlerts(rows);
      const fdAlerts = alerts.filter((a) => a.type === "fire_doors_not_functional");
      expect(fdAlerts).toHaveLength(3);
    });

    it("message contains compartmentation wording", () => {
      const rows = [makeRow({ fire_doors_functional: false })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "fire_doors_not_functional")!;
      expect(alert.message).toContain("compartmentation");
    });
  });

  describe("fire_drills_not_completed alert", () => {
    it("fires when fire drills not completed", () => {
      const rows = [makeRow({ fire_drills_completed: false })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "fire_drills_not_completed");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ fire_drills_completed: false })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "fire_drills_not_completed")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "drill-1", fire_drills_completed: false })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "fire_drills_not_completed")!;
      expect(alert.record_id).toBe("drill-1");
    });

    it("does not fire when fire drills are completed", () => {
      const rows = [makeRow({ fire_drills_completed: true })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "fire_drills_not_completed");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple rows with drills not completed", () => {
      const rows = [
        makeRow({ fire_drills_completed: false }),
        makeRow({ fire_drills_completed: false }),
      ];
      const alerts = computeFireRiskAlerts(rows);
      const drillAlerts = alerts.filter((a) => a.type === "fire_drills_not_completed");
      expect(drillAlerts).toHaveLength(2);
    });

    it("message contains Fire Safety Order 2005", () => {
      const rows = [makeRow({ fire_drills_completed: false })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "fire_drills_not_completed")!;
      expect(alert.message).toContain("Fire Safety Order 2005");
    });
  });

  describe("peep_not_in_place alert", () => {
    it("fires when PEEP not in place", () => {
      const rows = [makeRow({ peep_in_place: false })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "peep_not_in_place");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ peep_in_place: false })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "peep_not_in_place")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "peep-1", peep_in_place: false })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "peep_not_in_place")!;
      expect(alert.record_id).toBe("peep-1");
    });

    it("does not fire when PEEP is in place", () => {
      const rows = [makeRow({ peep_in_place: true })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "peep_not_in_place");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple rows without PEEP", () => {
      const rows = [
        makeRow({ peep_in_place: false }),
        makeRow({ peep_in_place: false }),
      ];
      const alerts = computeFireRiskAlerts(rows);
      const peepAlerts = alerts.filter((a) => a.type === "peep_not_in_place");
      expect(peepAlerts).toHaveLength(2);
    });

    it("message contains Personal Emergency Evacuation Plan", () => {
      const rows = [makeRow({ peep_in_place: false })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "peep_not_in_place")!;
      expect(alert.message).toContain("Personal Emergency Evacuation Plan");
    });
  });

  describe("combined alerts", () => {
    it("can fire all six alert types simultaneously", () => {
      const rows = [
        makeRow({
          risk_rating: "intolerable",
          compliance_status: "non_compliant",
          assessment_area: "means_of_escape",
          escape_routes_clear: false,
          fire_doors_functional: false,
          fire_drills_completed: false,
          peep_in_place: false,
        }),
      ];
      const alerts = computeFireRiskAlerts(rows);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("intolerable_risk");
      expect(types).toContain("non_compliant_critical_area");
      expect(types).toContain("escape_routes_not_clear");
      expect(types).toContain("fire_doors_not_functional");
      expect(types).toContain("fire_drills_not_completed");
      expect(types).toContain("peep_not_in_place");
    });

    it("high_risk and intolerable_risk can fire together on different rows", () => {
      const rows = [
        makeRow({ risk_rating: "intolerable" }),
        makeRow({ risk_rating: "high" }),
      ];
      const alerts = computeFireRiskAlerts(rows);
      expect(alerts.find((a) => a.type === "intolerable_risk")).toBeDefined();
      expect(alerts.find((a) => a.type === "high_risk")).toBeDefined();
    });

    it("per-record alerts multiply across rows", () => {
      const rows = [
        makeRow({ escape_routes_clear: false, fire_doors_functional: false }),
        makeRow({ escape_routes_clear: false, fire_doors_functional: false }),
      ];
      const alerts = computeFireRiskAlerts(rows);
      expect(alerts.filter((a) => a.type === "escape_routes_not_clear")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "fire_doors_not_functional")).toHaveLength(2);
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const rows = [
        makeRow({ risk_rating: "intolerable", escape_routes_clear: false }),
      ];
      const alerts = computeFireRiskAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const rows = [
        makeRow({
          risk_rating: "intolerable",
          compliance_status: "non_compliant",
          assessment_area: "means_of_escape",
          escape_routes_clear: false,
          fire_doors_functional: false,
          fire_drills_completed: false,
          peep_in_place: false,
        }),
      ];
      const alerts = computeFireRiskAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const rows = [makeRow({ risk_rating: "intolerable" })];
      const alerts = computeFireRiskAlerts(rows);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe("edge cases", () => {
    it("non_compliant in electrical_safety does not trigger non_compliant_critical_area", () => {
      const rows = [makeRow({ compliance_status: "non_compliant", assessment_area: "electrical_safety" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_critical_area");
      expect(alert).toBeUndefined();
    });

    it("non_compliant in housekeeping does not trigger non_compliant_critical_area", () => {
      const rows = [makeRow({ compliance_status: "non_compliant", assessment_area: "housekeeping" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_critical_area");
      expect(alert).toBeUndefined();
    });

    it("non_compliant in emergency_lighting does not trigger non_compliant_critical_area", () => {
      const rows = [makeRow({ compliance_status: "non_compliant", assessment_area: "emergency_lighting" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_critical_area");
      expect(alert).toBeUndefined();
    });

    it("non_compliant in fire_fighting_equipment does not trigger non_compliant_critical_area", () => {
      const rows = [makeRow({ compliance_status: "non_compliant", assessment_area: "fire_fighting_equipment" })];
      const alerts = computeFireRiskAlerts(rows);
      const alert = alerts.find((a) => a.type === "non_compliant_critical_area");
      expect(alert).toBeUndefined();
    });

    it("multiple alert types for underscore replacement in assessment_area", () => {
      const areas: AssessmentArea[] = ["means_of_escape", "fire_detection", "fire_fighting_equipment", "emergency_lighting", "electrical_safety"];
      for (const area of areas) {
        const rows = [makeRow({ escape_routes_clear: false, assessment_area: area })];
        const alerts = computeFireRiskAlerts(rows);
        const alert = alerts.find((a) => a.type === "escape_routes_not_clear")!;
        expect(alert.message).toContain(area.replace(/_/g, " "));
      }
    });
  });
});

// ── generateFireRiskCaraInsights ────────────────────────────────────────

describe("generateFireRiskCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const insights = generateFireRiskCaraInsights([]);
    expect(insights).toHaveLength(3);
  });

  it("first insight starts with [red]", () => {
    const insights = generateFireRiskCaraInsights([makeRow()]);
    expect(insights[0]).toMatch(/^\[red\]/);
  });

  it("first insight includes total_assessments count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const insights = generateFireRiskCaraInsights(rows);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes escape_routes_clear_rate", () => {
    const rows = [makeRow({ escape_routes_clear: true }), makeRow({ escape_routes_clear: false })];
    const insights = generateFireRiskCaraInsights(rows);
    expect(insights[0]).toContain("50%");
  });

  it("first insight includes detection_system_tested_rate", () => {
    const rows = [makeRow({ detection_system_tested: true }), makeRow({ detection_system_tested: false })];
    const insights = generateFireRiskCaraInsights(rows);
    expect(insights[0]).toContain("50%");
  });

  it("second insight starts with [amber]", () => {
    const insights = generateFireRiskCaraInsights([makeRow()]);
    expect(insights[1]).toMatch(/^\[amber\]/);
  });

  it("second insight mentions critical and high alerts when present", () => {
    const rows = [
      makeRow({ risk_rating: "intolerable", escape_routes_clear: false }),
    ];
    const insights = generateFireRiskCaraInsights(rows);
    expect(insights[1]).toContain("critical");
    expect(insights[1]).toContain("high");
  });

  it("second insight mentions no alerts when none present", () => {
    const rows = [makeRow({
      risk_rating: "low",
      compliance_status: "compliant",
      escape_routes_clear: true,
      fire_doors_functional: true,
      fire_drills_completed: true,
      peep_in_place: true,
    })];
    const insights = generateFireRiskCaraInsights(rows);
    expect(insights[1]).toContain("No critical or high-priority fire risk alerts");
  });

  it("second insight includes intolerable count when alerts present", () => {
    const rows = [
      makeRow({ risk_rating: "intolerable" }),
    ];
    const insights = generateFireRiskCaraInsights(rows);
    expect(insights[1]).toContain("1 intolerable");
  });

  it("third insight starts with [reflect]", () => {
    const insights = generateFireRiskCaraInsights([makeRow()]);
    expect(insights[2]).toMatch(/^\[reflect\]/);
  });

  it("third insight mentions intolerable/high when some have those ratings", () => {
    const rows = [makeRow({ risk_rating: "intolerable" })];
    const insights = generateFireRiskCaraInsights(rows);
    expect(insights[2]).toContain("intolerable or high fire risk");
  });

  it("third insight asks about fire drills when no intolerable/high but drills not all completed", () => {
    const rows = [
      makeRow({ risk_rating: "low", fire_drills_completed: false }),
      makeRow({ risk_rating: "low", fire_drills_completed: true }),
    ];
    const insights = generateFireRiskCaraInsights(rows);
    expect(insights[2]).toContain("Fire drills are completed");
  });

  it("third insight celebrates when all drills completed and no high/intolerable", () => {
    const rows = [
      makeRow({ risk_rating: "low", fire_drills_completed: true }),
      makeRow({ risk_rating: "low", fire_drills_completed: true }),
    ];
    const insights = generateFireRiskCaraInsights(rows);
    expect(insights[2]).toContain("fire drills completed and no high or intolerable");
  });

  it("uses singular assessor wording when unique_assessors is 1", () => {
    const rows = [makeRow({ assessor_name: "Staff A" })];
    const insights = generateFireRiskCaraInsights(rows);
    expect(insights[0]).toContain("1 assessor");
  });

  it("uses plural assessors wording when unique_assessors > 1", () => {
    const rows = [
      makeRow({ assessor_name: "Staff A" }),
      makeRow({ assessor_name: "Staff B" }),
    ];
    const insights = generateFireRiskCaraInsights(rows);
    expect(insights[0]).toContain("2 assessors");
  });

  it("all insights are non-empty strings", () => {
    const insights = generateFireRiskCaraInsights([makeRow()]);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  it("uses singular assessment wording when 1 intolerable/high", () => {
    const rows = [makeRow({ risk_rating: "high" })];
    const insights = generateFireRiskCaraInsights(rows);
    expect(insights[2]).toContain("assessment has");
  });

  it("uses plural assessments wording when multiple intolerable/high", () => {
    const rows = [
      makeRow({ risk_rating: "high" }),
      makeRow({ risk_rating: "intolerable" }),
    ];
    const insights = generateFireRiskCaraInsights(rows);
    expect(insights[2]).toContain("assessments have");
  });
});

// ── Factory helper validation ──────────────────────────────────────────

describe("makeRow factory helper", () => {
  it("creates a row with sensible defaults", () => {
    const r = makeRow();
    expect(r.home_id).toBe("home-1");
    expect(r.assessor_name).toBe("Staff A");
    expect(r.assessor_id).toBeNull();
    expect(r.risk_rating).toBe("low");
    expect(r.assessment_area).toBe("means_of_escape");
    expect(r.compliance_status).toBe("compliant");
    expect(r.action_priority).toBe("routine");
    expect(r.escape_routes_clear).toBe(true);
    expect(r.fire_doors_functional).toBe(true);
    expect(r.detection_system_tested).toBe(true);
    expect(r.extinguishers_serviced).toBe(true);
    expect(r.evacuation_plan_current).toBe(true);
    expect(r.staff_fire_trained).toBe(true);
    expect(r.fire_drills_completed).toBe(true);
    expect(r.compartmentation_intact).toBe(true);
    expect(r.emergency_lighting_tested).toBe(true);
    expect(r.signage_adequate).toBe(true);
    expect(r.electrical_safety_tested).toBe(true);
    expect(r.peep_in_place).toBe(true);
    expect(r.next_review_date).toBeNull();
    expect(r.action_details).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRow({ risk_rating: "high", compliance_status: "non_compliant" });
    expect(r.risk_rating).toBe("high");
    expect(r.compliance_status).toBe("non_compliant");
    // defaults still apply
    expect(r.assessment_area).toBe("means_of_escape");
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
    const r = makeRow({ assessor_id: null, next_review_date: null, action_details: null, notes: null });
    expect(r.assessor_id).toBeNull();
    expect(r.next_review_date).toBeNull();
    expect(r.action_details).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows setting nullable fields to values", () => {
    const r = makeRow({ assessor_id: "user-1", next_review_date: "2026-06-01", action_details: "Replace door closers", notes: "Follow-up needed" });
    expect(r.assessor_id).toBe("user-1");
    expect(r.next_review_date).toBe("2026-06-01");
    expect(r.action_details).toBe("Replace door closers");
    expect(r.notes).toBe("Follow-up needed");
  });
});
