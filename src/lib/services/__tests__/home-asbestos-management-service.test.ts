// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME ASBESTOS MANAGEMENT SERVICE TESTS
// Pure-function tests for asbestos management metrics, alert identification,
// Cara insight generation, constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  ASBESTOS_TYPES,
  CONDITION_RATINGS,
  MANAGEMENT_ACTIONS,
  COMPLIANCE_STATUSES,
  _testing,
} from "../home-asbestos-management-service";

import type {
  HomeAsbestosManagementRow,
  AsbestosType,
  ConditionRating,
  ManagementAction,
  ComplianceStatus,
} from "../home-asbestos-management-service";

const {
  computeMetrics,
  computeAlerts,
  computeCaraInsights,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<HomeAsbestosManagementRow>,
): HomeAsbestosManagementRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: "home_id" in (overrides ?? {}) ? overrides!.home_id! : crypto.randomUUID(),
    survey_date: "survey_date" in (overrides ?? {}) ? overrides!.survey_date! : now.toISOString().split("T")[0],
    surveyor_name: "surveyor_name" in (overrides ?? {}) ? overrides!.surveyor_name! : "D. Laville",
    location: "location" in (overrides ?? {}) ? overrides!.location! : "Boiler Room",
    asbestos_type: "asbestos_type" in (overrides ?? {}) ? overrides!.asbestos_type! : "Chrysotile",
    condition_rating: "condition_rating" in (overrides ?? {}) ? overrides!.condition_rating! : "Good",
    risk_score: "risk_score" in (overrides ?? {}) ? overrides!.risk_score! : 3,
    management_action: "management_action" in (overrides ?? {}) ? overrides!.management_action! : "Monitor",
    management_plan_in_place: "management_plan_in_place" in (overrides ?? {}) ? overrides!.management_plan_in_place! : true,
    register_updated: "register_updated" in (overrides ?? {}) ? overrides!.register_updated! : true,
    staff_awareness_confirmed: "staff_awareness_confirmed" in (overrides ?? {}) ? overrides!.staff_awareness_confirmed! : true,
    labelling_in_place: "labelling_in_place" in (overrides ?? {}) ? overrides!.labelling_in_place! : true,
    reinspection_date: "reinspection_date" in (overrides ?? {}) ? (overrides!.reinspection_date ?? null) : "2027-01-15",
    compliance_status: "compliance_status" in (overrides ?? {}) ? overrides!.compliance_status! : "Compliant",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: "created_at" in (overrides ?? {}) ? overrides!.created_at! : now.toISOString(),
    updated_at: "updated_at" in (overrides ?? {}) ? overrides!.updated_at! : now.toISOString(),
  };
}

// ── Enum completeness ───────────────────────────────────────────────────

describe("enum arrays", () => {
  it("ASBESTOS_TYPES has 6 entries", () => {
    expect(ASBESTOS_TYPES).toHaveLength(6);
  });

  it("ASBESTOS_TYPES contains expected values", () => {
    expect(ASBESTOS_TYPES).toContain("Chrysotile");
    expect(ASBESTOS_TYPES).toContain("Amosite");
    expect(ASBESTOS_TYPES).toContain("Crocidolite");
    expect(ASBESTOS_TYPES).toContain("Mixed");
    expect(ASBESTOS_TYPES).toContain("Presumed ACM");
    expect(ASBESTOS_TYPES).toContain("No Asbestos Found");
  });

  it("CONDITION_RATINGS has 5 entries", () => {
    expect(CONDITION_RATINGS).toHaveLength(5);
  });

  it("CONDITION_RATINGS contains expected values", () => {
    expect(CONDITION_RATINGS).toContain("Good");
    expect(CONDITION_RATINGS).toContain("Fair");
    expect(CONDITION_RATINGS).toContain("Poor");
    expect(CONDITION_RATINGS).toContain("Damaged");
    expect(CONDITION_RATINGS).toContain("Severely Damaged");
  });

  it("MANAGEMENT_ACTIONS has 5 entries", () => {
    expect(MANAGEMENT_ACTIONS).toHaveLength(5);
  });

  it("MANAGEMENT_ACTIONS contains expected values", () => {
    expect(MANAGEMENT_ACTIONS).toContain("Monitor");
    expect(MANAGEMENT_ACTIONS).toContain("Encapsulate");
    expect(MANAGEMENT_ACTIONS).toContain("Enclose");
    expect(MANAGEMENT_ACTIONS).toContain("Remove");
    expect(MANAGEMENT_ACTIONS).toContain("No Action Required");
  });

  it("COMPLIANCE_STATUSES has 4 entries", () => {
    expect(COMPLIANCE_STATUSES).toHaveLength(4);
  });

  it("COMPLIANCE_STATUSES contains expected values", () => {
    expect(COMPLIANCE_STATUSES).toContain("Compliant");
    expect(COMPLIANCE_STATUSES).toContain("Minor Non-Compliance");
    expect(COMPLIANCE_STATUSES).toContain("Major Non-Compliance");
    expect(COMPLIANCE_STATUSES).toContain("Critical Non-Compliance");
  });
});

// ── computeMetrics ──────────────────────────────────────────────────────

describe("computeMetrics", () => {
  describe("empty array", () => {
    it("returns zero total_surveys", () => {
      const m = computeMetrics([]);
      expect(m.total_surveys).toBe(0);
    });

    it("returns zero damaged_count", () => {
      const m = computeMetrics([]);
      expect(m.damaged_count).toBe(0);
    });

    it("returns zero removal_required_count", () => {
      const m = computeMetrics([]);
      expect(m.removal_required_count).toBe(0);
    });

    it("returns zero non_compliant_count", () => {
      const m = computeMetrics([]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns zero management_plan_rate", () => {
      const m = computeMetrics([]);
      expect(m.management_plan_rate).toBe(0);
    });

    it("returns zero register_update_rate", () => {
      const m = computeMetrics([]);
      expect(m.register_update_rate).toBe(0);
    });

    it("returns zero staff_awareness_rate", () => {
      const m = computeMetrics([]);
      expect(m.staff_awareness_rate).toBe(0);
    });

    it("returns zero labelling_rate", () => {
      const m = computeMetrics([]);
      expect(m.labelling_rate).toBe(0);
    });

    it("returns zero reinspection_scheduled_rate", () => {
      const m = computeMetrics([]);
      expect(m.reinspection_scheduled_rate).toBe(0);
    });

    it("returns zero avg_risk_score", () => {
      const m = computeMetrics([]);
      expect(m.avg_risk_score).toBe(0);
    });

    it("returns zero unique_surveyors", () => {
      const m = computeMetrics([]);
      expect(m.unique_surveyors).toBe(0);
    });
  });

  describe("single compliant row", () => {
    const row = makeRow({
      condition_rating: "Good",
      management_action: "Monitor",
      compliance_status: "Compliant",
      management_plan_in_place: true,
      register_updated: true,
      staff_awareness_confirmed: true,
      labelling_in_place: true,
      reinspection_date: "2027-01-15",
      risk_score: 5,
      surveyor_name: "D. Laville",
    });

    it("returns total_surveys = 1", () => {
      const m = computeMetrics([row]);
      expect(m.total_surveys).toBe(1);
    });

    it("returns damaged_count = 0", () => {
      const m = computeMetrics([row]);
      expect(m.damaged_count).toBe(0);
    });

    it("returns removal_required_count = 0", () => {
      const m = computeMetrics([row]);
      expect(m.removal_required_count).toBe(0);
    });

    it("returns non_compliant_count = 0", () => {
      const m = computeMetrics([row]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("returns management_plan_rate = 100", () => {
      const m = computeMetrics([row]);
      expect(m.management_plan_rate).toBe(100);
    });

    it("returns register_update_rate = 100", () => {
      const m = computeMetrics([row]);
      expect(m.register_update_rate).toBe(100);
    });

    it("returns staff_awareness_rate = 100", () => {
      const m = computeMetrics([row]);
      expect(m.staff_awareness_rate).toBe(100);
    });

    it("returns labelling_rate = 100", () => {
      const m = computeMetrics([row]);
      expect(m.labelling_rate).toBe(100);
    });

    it("returns reinspection_scheduled_rate = 100", () => {
      const m = computeMetrics([row]);
      expect(m.reinspection_scheduled_rate).toBe(100);
    });

    it("returns avg_risk_score = 5", () => {
      const m = computeMetrics([row]);
      expect(m.avg_risk_score).toBe(5);
    });

    it("returns unique_surveyors = 1", () => {
      const m = computeMetrics([row]);
      expect(m.unique_surveyors).toBe(1);
    });
  });

  describe("multiple rows", () => {
    const rows = [
      makeRow({ condition_rating: "Good", management_action: "Monitor", compliance_status: "Compliant", surveyor_name: "Staff A", management_plan_in_place: true, register_updated: true, staff_awareness_confirmed: true, labelling_in_place: true, reinspection_date: "2027-06-01", risk_score: 2 }),
      makeRow({ condition_rating: "Damaged", management_action: "Remove", compliance_status: "Major Non-Compliance", surveyor_name: "Staff B", management_plan_in_place: false, register_updated: false, staff_awareness_confirmed: false, labelling_in_place: false, reinspection_date: null, risk_score: 12 }),
      makeRow({ condition_rating: "Severely Damaged", management_action: "Remove", compliance_status: "Critical Non-Compliance", surveyor_name: "Staff C", management_plan_in_place: true, register_updated: true, staff_awareness_confirmed: false, labelling_in_place: true, reinspection_date: "2026-12-01", risk_score: 16 }),
    ];

    it("returns total_surveys = 3", () => {
      const m = computeMetrics(rows);
      expect(m.total_surveys).toBe(3);
    });

    it("returns damaged_count = 2", () => {
      const m = computeMetrics(rows);
      expect(m.damaged_count).toBe(2);
    });

    it("returns removal_required_count = 2", () => {
      const m = computeMetrics(rows);
      expect(m.removal_required_count).toBe(2);
    });

    it("returns non_compliant_count = 2", () => {
      const m = computeMetrics(rows);
      expect(m.non_compliant_count).toBe(2);
    });

    it("calculates management_plan_rate correctly (2/3 = 66.7%)", () => {
      const m = computeMetrics(rows);
      expect(m.management_plan_rate).toBe(66.7);
    });

    it("calculates register_update_rate correctly (2/3 = 66.7%)", () => {
      const m = computeMetrics(rows);
      expect(m.register_update_rate).toBe(66.7);
    });

    it("calculates staff_awareness_rate correctly (1/3 = 33.3%)", () => {
      const m = computeMetrics(rows);
      expect(m.staff_awareness_rate).toBe(33.3);
    });

    it("calculates labelling_rate correctly (2/3 = 66.7%)", () => {
      const m = computeMetrics(rows);
      expect(m.labelling_rate).toBe(66.7);
    });

    it("calculates reinspection_scheduled_rate correctly (2/3 = 66.7%)", () => {
      const m = computeMetrics(rows);
      expect(m.reinspection_scheduled_rate).toBe(66.7);
    });

    it("calculates avg_risk_score correctly ((2+12+16)/3 = 10)", () => {
      const m = computeMetrics(rows);
      expect(m.avg_risk_score).toBe(10);
    });

    it("returns unique_surveyors = 3", () => {
      const m = computeMetrics(rows);
      expect(m.unique_surveyors).toBe(3);
    });
  });

  describe("damaged_count", () => {
    it("counts Poor condition", () => {
      const m = computeMetrics([makeRow({ condition_rating: "Poor" })]);
      expect(m.damaged_count).toBe(1);
    });

    it("counts Damaged condition", () => {
      const m = computeMetrics([makeRow({ condition_rating: "Damaged" })]);
      expect(m.damaged_count).toBe(1);
    });

    it("counts Severely Damaged condition", () => {
      const m = computeMetrics([makeRow({ condition_rating: "Severely Damaged" })]);
      expect(m.damaged_count).toBe(1);
    });

    it("does not count Good condition", () => {
      const m = computeMetrics([makeRow({ condition_rating: "Good" })]);
      expect(m.damaged_count).toBe(0);
    });

    it("does not count Fair condition", () => {
      const m = computeMetrics([makeRow({ condition_rating: "Fair" })]);
      expect(m.damaged_count).toBe(0);
    });

    it("counts all three damaged types together", () => {
      const rows = [
        makeRow({ condition_rating: "Poor" }),
        makeRow({ condition_rating: "Damaged" }),
        makeRow({ condition_rating: "Severely Damaged" }),
      ];
      const m = computeMetrics(rows);
      expect(m.damaged_count).toBe(3);
    });

    it("counts mixed condition ratings correctly", () => {
      const rows = [
        makeRow({ condition_rating: "Good" }),
        makeRow({ condition_rating: "Fair" }),
        makeRow({ condition_rating: "Poor" }),
        makeRow({ condition_rating: "Damaged" }),
      ];
      const m = computeMetrics(rows);
      expect(m.damaged_count).toBe(2);
    });
  });

  describe("removal_required_count", () => {
    it("counts only Remove action", () => {
      const rows = [
        makeRow({ management_action: "Remove" }),
        makeRow({ management_action: "Remove" }),
        makeRow({ management_action: "Monitor" }),
      ];
      const m = computeMetrics(rows);
      expect(m.removal_required_count).toBe(2);
    });

    it("does not count Monitor", () => {
      const m = computeMetrics([makeRow({ management_action: "Monitor" })]);
      expect(m.removal_required_count).toBe(0);
    });

    it("does not count Encapsulate", () => {
      const m = computeMetrics([makeRow({ management_action: "Encapsulate" })]);
      expect(m.removal_required_count).toBe(0);
    });

    it("does not count Enclose", () => {
      const m = computeMetrics([makeRow({ management_action: "Enclose" })]);
      expect(m.removal_required_count).toBe(0);
    });

    it("does not count No Action Required", () => {
      const m = computeMetrics([makeRow({ management_action: "No Action Required" })]);
      expect(m.removal_required_count).toBe(0);
    });
  });

  describe("non_compliant_count", () => {
    it("counts all non-Compliant statuses", () => {
      const rows = [
        makeRow({ compliance_status: "Minor Non-Compliance" }),
        makeRow({ compliance_status: "Major Non-Compliance" }),
        makeRow({ compliance_status: "Critical Non-Compliance" }),
      ];
      const m = computeMetrics(rows);
      expect(m.non_compliant_count).toBe(3);
    });

    it("does not count Compliant", () => {
      const m = computeMetrics([makeRow({ compliance_status: "Compliant" })]);
      expect(m.non_compliant_count).toBe(0);
    });

    it("counts Minor Non-Compliance", () => {
      const m = computeMetrics([makeRow({ compliance_status: "Minor Non-Compliance" })]);
      expect(m.non_compliant_count).toBe(1);
    });

    it("counts Major Non-Compliance", () => {
      const m = computeMetrics([makeRow({ compliance_status: "Major Non-Compliance" })]);
      expect(m.non_compliant_count).toBe(1);
    });

    it("counts Critical Non-Compliance", () => {
      const m = computeMetrics([makeRow({ compliance_status: "Critical Non-Compliance" })]);
      expect(m.non_compliant_count).toBe(1);
    });
  });

  describe("percentage calculations with known values", () => {
    it("returns 0 when all booleans false for single row", () => {
      const row = makeRow({
        management_plan_in_place: false,
        register_updated: false,
        staff_awareness_confirmed: false,
        labelling_in_place: false,
      });
      const m = computeMetrics([row]);
      expect(m.management_plan_rate).toBe(0);
      expect(m.register_update_rate).toBe(0);
      expect(m.staff_awareness_rate).toBe(0);
      expect(m.labelling_rate).toBe(0);
    });

    it("mixed boolean rate (1/3 = 33.3%)", () => {
      const rows = [
        makeRow({ management_plan_in_place: true }),
        makeRow({ management_plan_in_place: false }),
        makeRow({ management_plan_in_place: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.management_plan_rate).toBe(33.3);
    });

    it("mixed boolean rate (2/3 = 66.7%)", () => {
      const rows = [
        makeRow({ register_updated: true }),
        makeRow({ register_updated: true }),
        makeRow({ register_updated: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.register_update_rate).toBe(66.7);
    });

    it("50% rate for half true", () => {
      const rows = [
        makeRow({ staff_awareness_confirmed: true }),
        makeRow({ staff_awareness_confirmed: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.staff_awareness_rate).toBe(50);
    });

    it("100% rate when all true", () => {
      const rows = [
        makeRow({ labelling_in_place: true }),
        makeRow({ labelling_in_place: true }),
      ];
      const m = computeMetrics(rows);
      expect(m.labelling_rate).toBe(100);
    });

    it("0% rate when all false", () => {
      const rows = [
        makeRow({ labelling_in_place: false }),
        makeRow({ labelling_in_place: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.labelling_rate).toBe(0);
    });

    it("25% rate (1/4)", () => {
      const rows = [
        makeRow({ management_plan_in_place: true }),
        makeRow({ management_plan_in_place: false }),
        makeRow({ management_plan_in_place: false }),
        makeRow({ management_plan_in_place: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.management_plan_rate).toBe(25);
    });

    it("75% rate (3/4)", () => {
      const rows = [
        makeRow({ management_plan_in_place: true }),
        makeRow({ management_plan_in_place: true }),
        makeRow({ management_plan_in_place: true }),
        makeRow({ management_plan_in_place: false }),
      ];
      const m = computeMetrics(rows);
      expect(m.management_plan_rate).toBe(75);
    });
  });

  describe("reinspection_scheduled_rate", () => {
    it("returns 100 when all rows have reinspection_date", () => {
      const rows = [
        makeRow({ reinspection_date: "2027-01-15" }),
        makeRow({ reinspection_date: "2027-06-01" }),
      ];
      const m = computeMetrics(rows);
      expect(m.reinspection_scheduled_rate).toBe(100);
    });

    it("returns 0 when no rows have reinspection_date", () => {
      const rows = [
        makeRow({ reinspection_date: null }),
        makeRow({ reinspection_date: null }),
      ];
      const m = computeMetrics(rows);
      expect(m.reinspection_scheduled_rate).toBe(0);
    });

    it("calculates 50% for mixed reinspection dates", () => {
      const rows = [
        makeRow({ reinspection_date: "2027-01-15" }),
        makeRow({ reinspection_date: null }),
      ];
      const m = computeMetrics(rows);
      expect(m.reinspection_scheduled_rate).toBe(50);
    });

    it("calculates 33.3% for 1/3 with reinspection", () => {
      const rows = [
        makeRow({ reinspection_date: "2027-01-15" }),
        makeRow({ reinspection_date: null }),
        makeRow({ reinspection_date: null }),
      ];
      const m = computeMetrics(rows);
      expect(m.reinspection_scheduled_rate).toBe(33.3);
    });

    it("calculates 66.7% for 2/3 with reinspection", () => {
      const rows = [
        makeRow({ reinspection_date: "2027-01-15" }),
        makeRow({ reinspection_date: "2027-06-01" }),
        makeRow({ reinspection_date: null }),
      ];
      const m = computeMetrics(rows);
      expect(m.reinspection_scheduled_rate).toBe(66.7);
    });
  });

  describe("avg_risk_score", () => {
    it("returns single row risk_score as average", () => {
      const m = computeMetrics([makeRow({ risk_score: 7 })]);
      expect(m.avg_risk_score).toBe(7);
    });

    it("calculates average for multiple rows", () => {
      const rows = [
        makeRow({ risk_score: 4 }),
        makeRow({ risk_score: 6 }),
      ];
      const m = computeMetrics(rows);
      expect(m.avg_risk_score).toBe(5);
    });

    it("returns 0 for empty array", () => {
      const m = computeMetrics([]);
      expect(m.avg_risk_score).toBe(0);
    });

    it("handles zero risk scores", () => {
      const rows = [
        makeRow({ risk_score: 0 }),
        makeRow({ risk_score: 0 }),
      ];
      const m = computeMetrics(rows);
      expect(m.avg_risk_score).toBe(0);
    });

    it("handles non-integer average with rounding", () => {
      const rows = [
        makeRow({ risk_score: 1 }),
        makeRow({ risk_score: 2 }),
        makeRow({ risk_score: 3 }),
      ];
      const m = computeMetrics(rows);
      expect(m.avg_risk_score).toBe(2);
    });

    it("handles high risk scores", () => {
      const rows = [
        makeRow({ risk_score: 18 }),
        makeRow({ risk_score: 20 }),
      ];
      const m = computeMetrics(rows);
      expect(m.avg_risk_score).toBe(19);
    });
  });

  describe("unique_surveyors", () => {
    it("counts distinct surveyors", () => {
      const rows = [
        makeRow({ surveyor_name: "Staff A" }),
        makeRow({ surveyor_name: "Staff A" }),
        makeRow({ surveyor_name: "Staff B" }),
      ];
      const m = computeMetrics(rows);
      expect(m.unique_surveyors).toBe(2);
    });

    it("returns 1 when all rows have the same surveyor", () => {
      const rows = [
        makeRow({ surveyor_name: "Staff A" }),
        makeRow({ surveyor_name: "Staff A" }),
        makeRow({ surveyor_name: "Staff A" }),
      ];
      const m = computeMetrics(rows);
      expect(m.unique_surveyors).toBe(1);
    });

    it("counts each unique surveyor name", () => {
      const rows = [
        makeRow({ surveyor_name: "Alice" }),
        makeRow({ surveyor_name: "Bob" }),
        makeRow({ surveyor_name: "Charlie" }),
        makeRow({ surveyor_name: "Alice" }),
      ];
      const m = computeMetrics(rows);
      expect(m.unique_surveyors).toBe(3);
    });
  });
});

// ── computeAlerts ──────────────────────────────────────────────────────

describe("computeAlerts", () => {
  describe("no alerts", () => {
    it("returns empty array when no rows", () => {
      const alerts = computeAlerts([]);
      expect(alerts).toHaveLength(0);
    });

    it("returns empty array when all rows are clean", () => {
      const rows = [
        makeRow({
          condition_rating: "Good",
          management_action: "Monitor",
          asbestos_type: "Chrysotile",
          management_plan_in_place: true,
          staff_awareness_confirmed: true,
          labelling_in_place: true,
        }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts).toEqual([]);
    });

    it("returns empty for Fair condition with all flags set", () => {
      const rows = [
        makeRow({
          condition_rating: "Fair",
          management_plan_in_place: true,
          staff_awareness_confirmed: true,
          labelling_in_place: true,
        }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts).toEqual([]);
    });

    it("returns empty for No Asbestos Found without plan or labelling", () => {
      const rows = [
        makeRow({
          asbestos_type: "No Asbestos Found",
          condition_rating: "Good",
          management_plan_in_place: false,
          staff_awareness_confirmed: true,
          labelling_in_place: false,
        }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts).toEqual([]);
    });
  });

  describe("severely_damaged_asbestos alert", () => {
    it("fires for Severely Damaged condition", () => {
      const rows = [makeRow({ condition_rating: "Severely Damaged" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "severely_damaged_asbestos");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const rows = [makeRow({ condition_rating: "Severely Damaged" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "severely_damaged_asbestos")!;
      expect(alert.severity).toBe("critical");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "sd-1", condition_rating: "Severely Damaged" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "severely_damaged_asbestos")!;
      expect(alert.record_id).toBe("sd-1");
    });

    it("includes asbestos_type in message", () => {
      const rows = [makeRow({ condition_rating: "Severely Damaged", asbestos_type: "Amosite" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "severely_damaged_asbestos")!;
      expect(alert.message).toContain("Amosite");
    });

    it("includes location in message", () => {
      const rows = [makeRow({ condition_rating: "Severely Damaged", location: "Ceiling Tiles" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "severely_damaged_asbestos")!;
      expect(alert.message).toContain("Ceiling Tiles");
    });

    it("includes survey_date in message", () => {
      const rows = [makeRow({ condition_rating: "Severely Damaged", survey_date: "2026-05-01" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "severely_damaged_asbestos")!;
      expect(alert.message).toContain("2026-05-01");
    });

    it("message contains CAR 2012", () => {
      const rows = [makeRow({ condition_rating: "Severely Damaged" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "severely_damaged_asbestos")!;
      expect(alert.message).toContain("CAR 2012");
    });

    it("does not fire for Good condition", () => {
      const rows = [makeRow({ condition_rating: "Good" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "severely_damaged_asbestos");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Fair condition", () => {
      const rows = [makeRow({ condition_rating: "Fair" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "severely_damaged_asbestos");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Poor condition", () => {
      const rows = [makeRow({ condition_rating: "Poor" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "severely_damaged_asbestos");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Damaged condition", () => {
      const rows = [makeRow({ condition_rating: "Damaged" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "severely_damaged_asbestos");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple Severely Damaged", () => {
      const rows = [
        makeRow({ condition_rating: "Severely Damaged" }),
        makeRow({ condition_rating: "Severely Damaged" }),
      ];
      const alerts = computeAlerts(rows);
      const sdAlerts = alerts.filter((a) => a.type === "severely_damaged_asbestos");
      expect(sdAlerts).toHaveLength(2);
    });
  });

  describe("damaged_not_removal alert", () => {
    it("fires for Damaged without Remove action", () => {
      const rows = [makeRow({ condition_rating: "Damaged", management_action: "Monitor" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "damaged_not_removal");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ condition_rating: "Damaged", management_action: "Encapsulate" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "damaged_not_removal")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "dn-1", condition_rating: "Damaged", management_action: "Monitor" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "damaged_not_removal")!;
      expect(alert.record_id).toBe("dn-1");
    });

    it("includes asbestos_type in message", () => {
      const rows = [makeRow({ condition_rating: "Damaged", management_action: "Monitor", asbestos_type: "Crocidolite" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "damaged_not_removal")!;
      expect(alert.message).toContain("Crocidolite");
    });

    it("includes location in message", () => {
      const rows = [makeRow({ condition_rating: "Damaged", management_action: "Monitor", location: "Pipe Lagging" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "damaged_not_removal")!;
      expect(alert.message).toContain("Pipe Lagging");
    });

    it("includes survey_date in message", () => {
      const rows = [makeRow({ condition_rating: "Damaged", management_action: "Monitor", survey_date: "2026-04-20" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "damaged_not_removal")!;
      expect(alert.message).toContain("2026-04-20");
    });

    it("message contains CAR 2012", () => {
      const rows = [makeRow({ condition_rating: "Damaged", management_action: "Monitor" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "damaged_not_removal")!;
      expect(alert.message).toContain("CAR 2012");
    });

    it("does not fire when Damaged has Remove action", () => {
      const rows = [makeRow({ condition_rating: "Damaged", management_action: "Remove" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "damaged_not_removal");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Good condition without Remove", () => {
      const rows = [makeRow({ condition_rating: "Good", management_action: "Monitor" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "damaged_not_removal");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Fair condition without Remove", () => {
      const rows = [makeRow({ condition_rating: "Fair", management_action: "Encapsulate" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "damaged_not_removal");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Poor condition without Remove", () => {
      const rows = [makeRow({ condition_rating: "Poor", management_action: "Monitor" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "damaged_not_removal");
      expect(alert).toBeUndefined();
    });

    it("does not fire for Severely Damaged without Remove", () => {
      const rows = [makeRow({ condition_rating: "Severely Damaged", management_action: "Monitor" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "damaged_not_removal");
      expect(alert).toBeUndefined();
    });

    it("fires for Damaged with Encapsulate action", () => {
      const rows = [makeRow({ condition_rating: "Damaged", management_action: "Encapsulate" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "damaged_not_removal");
      expect(alert).toBeDefined();
    });

    it("fires for Damaged with Enclose action", () => {
      const rows = [makeRow({ condition_rating: "Damaged", management_action: "Enclose" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "damaged_not_removal");
      expect(alert).toBeDefined();
    });

    it("fires for Damaged with No Action Required", () => {
      const rows = [makeRow({ condition_rating: "Damaged", management_action: "No Action Required" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "damaged_not_removal");
      expect(alert).toBeDefined();
    });

    it("fires per record for multiple Damaged without Remove", () => {
      const rows = [
        makeRow({ condition_rating: "Damaged", management_action: "Monitor" }),
        makeRow({ condition_rating: "Damaged", management_action: "Encapsulate" }),
        makeRow({ condition_rating: "Damaged", management_action: "Remove" }),
      ];
      const alerts = computeAlerts(rows);
      const dnAlerts = alerts.filter((a) => a.type === "damaged_not_removal");
      expect(dnAlerts).toHaveLength(2);
    });
  });

  describe("no_management_plan alert", () => {
    it("fires when asbestos found without management plan", () => {
      const rows = [makeRow({ asbestos_type: "Chrysotile", management_plan_in_place: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_management_plan");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const rows = [makeRow({ asbestos_type: "Amosite", management_plan_in_place: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_management_plan")!;
      expect(alert.severity).toBe("high");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "nmp-1", asbestos_type: "Chrysotile", management_plan_in_place: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_management_plan")!;
      expect(alert.record_id).toBe("nmp-1");
    });

    it("includes asbestos_type in message", () => {
      const rows = [makeRow({ asbestos_type: "Mixed", management_plan_in_place: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_management_plan")!;
      expect(alert.message).toContain("Mixed");
    });

    it("includes location in message", () => {
      const rows = [makeRow({ asbestos_type: "Chrysotile", management_plan_in_place: false, location: "Roof Space" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_management_plan")!;
      expect(alert.message).toContain("Roof Space");
    });

    it("includes survey_date in message", () => {
      const rows = [makeRow({ asbestos_type: "Chrysotile", management_plan_in_place: false, survey_date: "2026-03-15" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_management_plan")!;
      expect(alert.message).toContain("2026-03-15");
    });

    it("message contains CAR 2012 Regulation 4", () => {
      const rows = [makeRow({ asbestos_type: "Chrysotile", management_plan_in_place: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_management_plan")!;
      expect(alert.message).toContain("CAR 2012 Regulation 4");
    });

    it("does not fire when management plan is in place", () => {
      const rows = [makeRow({ asbestos_type: "Chrysotile", management_plan_in_place: true })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_management_plan");
      expect(alert).toBeUndefined();
    });

    it("does not fire for No Asbestos Found without plan", () => {
      const rows = [makeRow({ asbestos_type: "No Asbestos Found", management_plan_in_place: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_management_plan");
      expect(alert).toBeUndefined();
    });

    it("fires for Presumed ACM without plan", () => {
      const rows = [makeRow({ asbestos_type: "Presumed ACM", management_plan_in_place: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_management_plan");
      expect(alert).toBeDefined();
    });

    it("fires for Crocidolite without plan", () => {
      const rows = [makeRow({ asbestos_type: "Crocidolite", management_plan_in_place: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_management_plan");
      expect(alert).toBeDefined();
    });

    it("fires per record for multiple without plan", () => {
      const rows = [
        makeRow({ asbestos_type: "Chrysotile", management_plan_in_place: false }),
        makeRow({ asbestos_type: "Amosite", management_plan_in_place: false }),
        makeRow({ asbestos_type: "Chrysotile", management_plan_in_place: true }),
      ];
      const alerts = computeAlerts(rows);
      const nmpAlerts = alerts.filter((a) => a.type === "no_management_plan");
      expect(nmpAlerts).toHaveLength(2);
    });
  });

  describe("staff_not_aware alert", () => {
    it("fires when staff awareness not confirmed", () => {
      const rows = [makeRow({ staff_awareness_confirmed: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "staff_not_aware");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ staff_awareness_confirmed: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "staff_not_aware")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "sna-1", staff_awareness_confirmed: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "staff_not_aware")!;
      expect(alert.record_id).toBe("sna-1");
    });

    it("includes location in message", () => {
      const rows = [makeRow({ staff_awareness_confirmed: false, location: "Laundry Room" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "staff_not_aware")!;
      expect(alert.message).toContain("Laundry Room");
    });

    it("includes survey_date in message", () => {
      const rows = [makeRow({ staff_awareness_confirmed: false, survey_date: "2026-02-10" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "staff_not_aware")!;
      expect(alert.message).toContain("2026-02-10");
    });

    it("does not fire when staff awareness is confirmed", () => {
      const rows = [makeRow({ staff_awareness_confirmed: true })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "staff_not_aware");
      expect(alert).toBeUndefined();
    });

    it("fires per record for multiple unaware", () => {
      const rows = [
        makeRow({ staff_awareness_confirmed: false }),
        makeRow({ staff_awareness_confirmed: false }),
      ];
      const alerts = computeAlerts(rows);
      const snaAlerts = alerts.filter((a) => a.type === "staff_not_aware");
      expect(snaAlerts).toHaveLength(2);
    });

    it("fires even for No Asbestos Found without awareness", () => {
      const rows = [makeRow({ asbestos_type: "No Asbestos Found", staff_awareness_confirmed: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "staff_not_aware");
      expect(alert).toBeDefined();
    });
  });

  describe("no_labelling alert", () => {
    it("fires when asbestos found without labelling", () => {
      const rows = [makeRow({ asbestos_type: "Chrysotile", labelling_in_place: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_labelling");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const rows = [makeRow({ asbestos_type: "Amosite", labelling_in_place: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_labelling")!;
      expect(alert.severity).toBe("medium");
    });

    it("includes record_id", () => {
      const rows = [makeRow({ id: "nl-1", asbestos_type: "Chrysotile", labelling_in_place: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_labelling")!;
      expect(alert.record_id).toBe("nl-1");
    });

    it("includes asbestos_type in message", () => {
      const rows = [makeRow({ asbestos_type: "Mixed", labelling_in_place: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_labelling")!;
      expect(alert.message).toContain("Mixed");
    });

    it("includes location in message", () => {
      const rows = [makeRow({ asbestos_type: "Chrysotile", labelling_in_place: false, location: "Hallway" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_labelling")!;
      expect(alert.message).toContain("Hallway");
    });

    it("includes survey_date in message", () => {
      const rows = [makeRow({ asbestos_type: "Chrysotile", labelling_in_place: false, survey_date: "2026-01-05" })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_labelling")!;
      expect(alert.message).toContain("2026-01-05");
    });

    it("does not fire when labelling is in place", () => {
      const rows = [makeRow({ asbestos_type: "Chrysotile", labelling_in_place: true })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_labelling");
      expect(alert).toBeUndefined();
    });

    it("does not fire for No Asbestos Found without labelling", () => {
      const rows = [makeRow({ asbestos_type: "No Asbestos Found", labelling_in_place: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_labelling");
      expect(alert).toBeUndefined();
    });

    it("fires for Presumed ACM without labelling", () => {
      const rows = [makeRow({ asbestos_type: "Presumed ACM", labelling_in_place: false })];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "no_labelling");
      expect(alert).toBeDefined();
    });

    it("fires per record for multiple without labelling", () => {
      const rows = [
        makeRow({ asbestos_type: "Chrysotile", labelling_in_place: false }),
        makeRow({ asbestos_type: "Amosite", labelling_in_place: false }),
        makeRow({ asbestos_type: "Chrysotile", labelling_in_place: true }),
      ];
      const alerts = computeAlerts(rows);
      const nlAlerts = alerts.filter((a) => a.type === "no_labelling");
      expect(nlAlerts).toHaveLength(2);
    });
  });

  describe("combined alerts", () => {
    it("can fire all five alert types simultaneously", () => {
      const rows = [
        makeRow({
          condition_rating: "Severely Damaged",
          asbestos_type: "Amosite",
          management_plan_in_place: false,
          staff_awareness_confirmed: false,
          labelling_in_place: false,
        }),
        makeRow({
          condition_rating: "Damaged",
          management_action: "Monitor",
          asbestos_type: "Chrysotile",
          management_plan_in_place: true,
          staff_awareness_confirmed: true,
          labelling_in_place: true,
        }),
      ];
      const alerts = computeAlerts(rows);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("severely_damaged_asbestos");
      expect(types).toContain("damaged_not_removal");
      expect(types).toContain("no_management_plan");
      expect(types).toContain("staff_not_aware");
      expect(types).toContain("no_labelling");
    });

    it("severely_damaged and no_management_plan can fire on same row", () => {
      const rows = [
        makeRow({ condition_rating: "Severely Damaged", asbestos_type: "Amosite", management_plan_in_place: false }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "severely_damaged_asbestos")).toBeDefined();
      expect(alerts.find((a) => a.type === "no_management_plan")).toBeDefined();
    });

    it("per-record alerts multiply across rows", () => {
      const rows = [
        makeRow({ staff_awareness_confirmed: false, asbestos_type: "Chrysotile", labelling_in_place: false }),
        makeRow({ staff_awareness_confirmed: false, asbestos_type: "Amosite", labelling_in_place: false }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts.filter((a) => a.type === "staff_not_aware")).toHaveLength(2);
      expect(alerts.filter((a) => a.type === "no_labelling")).toHaveLength(2);
    });

    it("Damaged with Remove does not generate damaged_not_removal alert", () => {
      const rows = [
        makeRow({ condition_rating: "Damaged", management_action: "Remove" }),
      ];
      const alerts = computeAlerts(rows);
      const alert = alerts.find((a) => a.type === "damaged_not_removal");
      expect(alert).toBeUndefined();
    });
  });

  describe("alert structure", () => {
    it("every alert has type, severity, and message fields", () => {
      const rows = [
        makeRow({ condition_rating: "Severely Damaged", staff_awareness_confirmed: false }),
      ];
      const alerts = computeAlerts(rows);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const rows = [
        makeRow({
          condition_rating: "Severely Damaged",
          asbestos_type: "Amosite",
          management_plan_in_place: false,
          staff_awareness_confirmed: false,
          labelling_in_place: false,
        }),
        makeRow({
          condition_rating: "Damaged",
          management_action: "Monitor",
        }),
      ];
      const alerts = computeAlerts(rows);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("message is always a non-empty string", () => {
      const rows = [makeRow({ condition_rating: "Severely Damaged" })];
      const alerts = computeAlerts(rows);
      for (const alert of alerts) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe("edge cases", () => {
    it("Damaged with Remove does not fire damaged_not_removal", () => {
      const rows = [makeRow({ condition_rating: "Damaged", management_action: "Remove" })];
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "damaged_not_removal")).toBeUndefined();
    });

    it("No Asbestos Found with plan still does not fire no_management_plan", () => {
      const rows = [makeRow({ asbestos_type: "No Asbestos Found", management_plan_in_place: true })];
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "no_management_plan")).toBeUndefined();
    });

    it("No Asbestos Found with labelling still does not fire no_labelling", () => {
      const rows = [makeRow({ asbestos_type: "No Asbestos Found", labelling_in_place: true })];
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "no_labelling")).toBeUndefined();
    });

    it("all asbestos types appear correctly in alert messages", () => {
      const types: AsbestosType[] = ["Chrysotile", "Amosite", "Crocidolite", "Mixed", "Presumed ACM"];
      for (const asbestosType of types) {
        const rows = [makeRow({ asbestos_type: asbestosType, management_plan_in_place: false })];
        const alerts = computeAlerts(rows);
        const alert = alerts.find((a) => a.type === "no_management_plan")!;
        expect(alert.message).toContain(asbestosType);
      }
    });

    it("various locations appear in alert messages", () => {
      const locations = ["Boiler Room", "Ceiling Tiles", "Pipe Lagging", "Roof Space", "Floor Tiles"];
      for (const loc of locations) {
        const rows = [makeRow({ staff_awareness_confirmed: false, location: loc })];
        const alerts = computeAlerts(rows);
        const alert = alerts.find((a) => a.type === "staff_not_aware")!;
        expect(alert.message).toContain(loc);
      }
    });
  });
});

// ── computeCaraInsights ────────────────────────────────────────────────

describe("computeCaraInsights", () => {
  it("returns exactly 3 insights", () => {
    const m = computeMetrics([]);
    const insights = computeCaraInsights(m);
    expect(insights).toHaveLength(3);
  });

  it("all insights are non-empty strings", () => {
    const m = computeMetrics([makeRow()]);
    const insights = computeCaraInsights(m);
    for (const insight of insights) {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    }
  });

  it("first insight includes total_surveys count", () => {
    const rows = [makeRow(), makeRow(), makeRow()];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("3");
  });

  it("first insight includes management_plan_rate", () => {
    const rows = [makeRow({ management_plan_in_place: true }), makeRow({ management_plan_in_place: false })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("50%");
  });

  it("first insight includes staff_awareness_rate", () => {
    const rows = [makeRow({ staff_awareness_confirmed: true }), makeRow({ staff_awareness_confirmed: false })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("50%");
  });

  it("first insight includes labelling_rate", () => {
    const rows = [makeRow({ labelling_in_place: true }), makeRow({ labelling_in_place: false })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("50%");
  });

  it("second insight mentions damaged and removal when present", () => {
    const rows = [
      makeRow({ condition_rating: "Damaged" }),
      makeRow({ management_action: "Remove" }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("damaged condition");
    expect(insights[1]).toContain("requiring removal");
  });

  it("second insight mentions no damaged when none present", () => {
    const rows = [makeRow({
      condition_rating: "Good",
      management_action: "Monitor",
      compliance_status: "Compliant",
    })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("No surveys with poor or damaged condition");
  });

  it("second insight includes avg_risk_score", () => {
    const rows = [
      makeRow({ risk_score: 5 }),
      makeRow({ risk_score: 15 }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("10");
  });

  it("second insight mentions CAR 2012 when no damaged", () => {
    const rows = [makeRow({ condition_rating: "Good" })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("CAR 2012");
  });

  it("third insight mentions damaged or removal when present", () => {
    const rows = [makeRow({ condition_rating: "Damaged" })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("damaged asbestos or removal requirements");
  });

  it("third insight asks about awareness when below 100%", () => {
    const rows = [
      makeRow({ condition_rating: "Good", management_action: "Monitor", staff_awareness_confirmed: false }),
      makeRow({ condition_rating: "Good", management_action: "Monitor", staff_awareness_confirmed: true }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("CAR 2012");
  });

  it("third insight celebrates when all good", () => {
    const rows = [
      makeRow({ condition_rating: "Good", management_action: "Monitor", staff_awareness_confirmed: true, labelling_in_place: true }),
      makeRow({ condition_rating: "Good", management_action: "Monitor", staff_awareness_confirmed: true, labelling_in_place: true }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("All surveys show good compliance");
  });

  it("uses singular surveyor wording when unique_surveyors is 1", () => {
    const rows = [makeRow({ surveyor_name: "D. Laville" })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("1 surveyor");
  });

  it("uses plural surveyors wording when unique_surveyors > 1", () => {
    const rows = [
      makeRow({ surveyor_name: "Staff A" }),
      makeRow({ surveyor_name: "Staff B" }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("2 surveyors");
  });

  it("uses singular survey wording when 1 damaged/removal", () => {
    const rows = [makeRow({ condition_rating: "Damaged" })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("survey has");
  });

  it("uses plural surveys wording when multiple damaged/removal", () => {
    const rows = [
      makeRow({ condition_rating: "Damaged" }),
      makeRow({ management_action: "Remove" }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("surveys have");
  });

  it("uses singular survey wording for first insight with 1 row", () => {
    const rows = [makeRow()];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("1 asbestos survey");
  });

  it("uses plural surveys wording for first insight with multiple rows", () => {
    const rows = [makeRow(), makeRow()];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[0]).toContain("2 asbestos surveys");
  });

  it("uses singular survey wording in second insight with 1 damaged", () => {
    const rows = [makeRow({ condition_rating: "Poor" })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("1 survey");
  });

  it("uses plural surveys wording in second insight with multiple damaged", () => {
    const rows = [makeRow({ condition_rating: "Poor" }), makeRow({ condition_rating: "Damaged" })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("2 surveys");
  });

  it("uses singular location wording in second insight with 1 removal", () => {
    const rows = [makeRow({ management_action: "Remove" })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("1 location");
  });

  it("uses plural locations wording in second insight with multiple removals", () => {
    const rows = [makeRow({ management_action: "Remove" }), makeRow({ management_action: "Remove" })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[1]).toContain("2 locations");
  });

  it("third insight mentions CAR 2012 when damaged present", () => {
    const rows = [makeRow({ condition_rating: "Damaged" })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("CAR 2012");
  });

  it("third insight mentions CAR 2012 when fully compliant", () => {
    const rows = [makeRow({ condition_rating: "Good", staff_awareness_confirmed: true, labelling_in_place: true })];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("CAR 2012");
  });

  it("third insight asks about labelling compliance when below 100", () => {
    const rows = [
      makeRow({ condition_rating: "Good", management_action: "Monitor", staff_awareness_confirmed: true, labelling_in_place: false }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("labelling compliance");
  });

  it("third insight asks about duty holders when awareness < 100%", () => {
    const rows = [
      makeRow({ condition_rating: "Good", management_action: "Monitor", staff_awareness_confirmed: false, labelling_in_place: true }),
    ];
    const m = computeMetrics(rows);
    const insights = computeCaraInsights(m);
    expect(insights[2]).toContain("duty holders");
  });
});

// ── Factory helper validation ──────────────────────────────────────────

describe("makeRow factory helper", () => {
  it("creates a row with sensible defaults", () => {
    const r = makeRow();
    expect(r.surveyor_name).toBe("D. Laville");
    expect(r.location).toBe("Boiler Room");
    expect(r.asbestos_type).toBe("Chrysotile");
    expect(r.condition_rating).toBe("Good");
    expect(r.risk_score).toBe(3);
    expect(r.management_action).toBe("Monitor");
    expect(r.management_plan_in_place).toBe(true);
    expect(r.register_updated).toBe(true);
    expect(r.staff_awareness_confirmed).toBe(true);
    expect(r.labelling_in_place).toBe(true);
    expect(r.reinspection_date).toBe("2027-01-15");
    expect(r.compliance_status).toBe("Compliant");
    expect(r.notes).toBeNull();
  });

  it("allows overriding individual fields", () => {
    const r = makeRow({ condition_rating: "Damaged", compliance_status: "Major Non-Compliance" });
    expect(r.condition_rating).toBe("Damaged");
    expect(r.compliance_status).toBe("Major Non-Compliance");
    // defaults still apply
    expect(r.asbestos_type).toBe("Chrysotile");
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
    const r = makeRow({ reinspection_date: null, notes: null });
    expect(r.reinspection_date).toBeNull();
    expect(r.notes).toBeNull();
  });

  it("allows setting nullable fields to values", () => {
    const r = makeRow({ reinspection_date: "2027-06-01", notes: "Follow-up needed" });
    expect(r.reinspection_date).toBe("2027-06-01");
    expect(r.notes).toBe("Follow-up needed");
  });

  it("allows setting asbestos_type to each value", () => {
    for (const t of ASBESTOS_TYPES) {
      const r = makeRow({ asbestos_type: t });
      expect(r.asbestos_type).toBe(t);
    }
  });

  it("allows setting condition_rating to each value", () => {
    for (const c of CONDITION_RATINGS) {
      const r = makeRow({ condition_rating: c });
      expect(r.condition_rating).toBe(c);
    }
  });

  it("allows setting management_action to each value", () => {
    for (const a of MANAGEMENT_ACTIONS) {
      const r = makeRow({ management_action: a });
      expect(r.management_action).toBe(a);
    }
  });

  it("allows setting compliance_status to each value", () => {
    for (const s of COMPLIANCE_STATUSES) {
      const r = makeRow({ compliance_status: s });
      expect(r.compliance_status).toBe(s);
    }
  });
});
