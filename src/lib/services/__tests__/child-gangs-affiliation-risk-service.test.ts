// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD GANGS AFFILIATION RISK SERVICE TESTS
// Pure-function unit tests for gang affiliation risk metrics computation,
// alert identification, ARIA insights, and constant validation.
// CHR 2015 Reg 12 (protection of children — safeguarding from exploitation),
// Reg 34 (fitness of workers — recognising exploitation indicators).
// Working Together to Safeguard Children 2023, Serious Violence Strategy.
//
// SCCIF: Safety — "Children are protected from gang exploitation and
// criminal affiliation."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  RISK_LEVELS,
  DISRUPTION_STRATEGIES,
  _testing,
} from "../child-gangs-affiliation-risk-service";

import type {
  ChildGangsAffiliationRiskRow,
} from "../child-gangs-affiliation-risk-service";

const { computeMetrics, computeAlerts, computeAriaInsights } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<ChildGangsAffiliationRiskRow>,
): ChildGangsAffiliationRiskRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: overrides?.home_id ?? "home-1",
    child_name: overrides?.child_name ?? "Child A",
    assessment_date: overrides?.assessment_date ?? now.toISOString().split("T")[0],
    risk_level: overrides?.risk_level ?? "Low",
    gang_involvement_indicators: overrides?.gang_involvement_indicators ?? 0,
    county_lines_risk: overrides?.county_lines_risk ?? false,
    nrm_referral_made: overrides?.nrm_referral_made ?? false,
    police_notified: overrides?.police_notified ?? false,
    social_worker_notified: overrides?.social_worker_notified ?? true,
    disruption_strategy: "disruption_strategy" in (overrides ?? {})
      ? (overrides!.disruption_strategy ?? null)
      : null,
    multi_agency_meeting_held: overrides?.multi_agency_meeting_held ?? false,
    safety_plan_in_place: overrides?.safety_plan_in_place ?? true,
    exploitation_screening_completed: overrides?.exploitation_screening_completed ?? true,
    missing_episodes_linked: overrides?.missing_episodes_linked ?? 0,
    review_date: "review_date" in (overrides ?? {})
      ? (overrides!.review_date ?? null)
      : null,
    assessor_name: overrides?.assessor_name ?? "Assessor X",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("RISK_LEVELS", () => {
  it("has exactly 5 values", () => {
    expect(RISK_LEVELS).toHaveLength(5);
  });
  it("contains No Identified Risk", () => {
    expect(RISK_LEVELS).toContain("No Identified Risk");
  });
  it("contains Low", () => {
    expect(RISK_LEVELS).toContain("Low");
  });
  it("contains Medium", () => {
    expect(RISK_LEVELS).toContain("Medium");
  });
  it("contains High", () => {
    expect(RISK_LEVELS).toContain("High");
  });
  it("contains Significant", () => {
    expect(RISK_LEVELS).toContain("Significant");
  });
  it("contains unique values", () => {
    expect(new Set(RISK_LEVELS).size).toBe(RISK_LEVELS.length);
  });
});

describe("DISRUPTION_STRATEGIES", () => {
  it("has exactly 6 values", () => {
    expect(DISRUPTION_STRATEGIES).toHaveLength(6);
  });
  it("contains Placement Move", () => {
    expect(DISRUPTION_STRATEGIES).toContain("Placement Move");
  });
  it("contains Education Change", () => {
    expect(DISRUPTION_STRATEGIES).toContain("Education Change");
  });
  it("contains Restricted Contact", () => {
    expect(DISRUPTION_STRATEGIES).toContain("Restricted Contact");
  });
  it("contains Multi-Agency Plan", () => {
    expect(DISRUPTION_STRATEGIES).toContain("Multi-Agency Plan");
  });
  it("contains Safety Plan", () => {
    expect(DISRUPTION_STRATEGIES).toContain("Safety Plan");
  });
  it("contains None Required", () => {
    expect(DISRUPTION_STRATEGIES).toContain("None Required");
  });
  it("contains unique values", () => {
    expect(new Set(DISRUPTION_STRATEGIES).size).toBe(DISRUPTION_STRATEGIES.length);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeMetrics", () => {
  // ── Empty array ──────────────────────────────────────────────────────
  describe("empty records", () => {
    it("returns zero total_assessments", () => {
      expect(computeMetrics([]).total_assessments).toBe(0);
    });
    it("returns zero high_risk_count", () => {
      expect(computeMetrics([]).high_risk_count).toBe(0);
    });
    it("returns zero county_lines_count", () => {
      expect(computeMetrics([]).county_lines_count).toBe(0);
    });
    it("returns zero nrm_referral_count", () => {
      expect(computeMetrics([]).nrm_referral_count).toBe(0);
    });
    it("returns zero safety_plan_rate", () => {
      expect(computeMetrics([]).safety_plan_rate).toBe(0);
    });
    it("returns zero exploitation_screening_rate", () => {
      expect(computeMetrics([]).exploitation_screening_rate).toBe(0);
    });
    it("returns zero multi_agency_rate", () => {
      expect(computeMetrics([]).multi_agency_rate).toBe(0);
    });
    it("returns zero police_notification_rate", () => {
      expect(computeMetrics([]).police_notification_rate).toBe(0);
    });
    it("returns zero avg_indicators", () => {
      expect(computeMetrics([]).avg_indicators).toBe(0);
    });
    it("returns zero avg_missing_episodes", () => {
      expect(computeMetrics([]).avg_missing_episodes).toBe(0);
    });
    it("returns zero unique_children", () => {
      expect(computeMetrics([]).unique_children).toBe(0);
    });
    it("returns zero unique_assessors", () => {
      expect(computeMetrics([]).unique_assessors).toBe(0);
    });
  });

  // ── Single record ──────────────────────────────────────────────────
  describe("single record", () => {
    const single = [makeRow()];

    it("total_assessments is 1", () => {
      expect(computeMetrics(single).total_assessments).toBe(1);
    });
    it("high_risk_count is 0 for Low risk", () => {
      expect(computeMetrics(single).high_risk_count).toBe(0);
    });
    it("high_risk_count is 1 for High risk", () => {
      const r = [makeRow({ risk_level: "High" })];
      expect(computeMetrics(r).high_risk_count).toBe(1);
    });
    it("high_risk_count is 1 for Significant risk", () => {
      const r = [makeRow({ risk_level: "Significant" })];
      expect(computeMetrics(r).high_risk_count).toBe(1);
    });
    it("high_risk_count is 0 for Medium risk", () => {
      const r = [makeRow({ risk_level: "Medium" })];
      expect(computeMetrics(r).high_risk_count).toBe(0);
    });
    it("high_risk_count is 0 for No Identified Risk", () => {
      const r = [makeRow({ risk_level: "No Identified Risk" })];
      expect(computeMetrics(r).high_risk_count).toBe(0);
    });
    it("county_lines_count is 0 when county_lines_risk is false", () => {
      expect(computeMetrics(single).county_lines_count).toBe(0);
    });
    it("county_lines_count is 1 when county_lines_risk is true", () => {
      const r = [makeRow({ county_lines_risk: true })];
      expect(computeMetrics(r).county_lines_count).toBe(1);
    });
    it("nrm_referral_count is 0 when nrm_referral_made is false", () => {
      expect(computeMetrics(single).nrm_referral_count).toBe(0);
    });
    it("nrm_referral_count is 1 when nrm_referral_made is true", () => {
      const r = [makeRow({ nrm_referral_made: true })];
      expect(computeMetrics(r).nrm_referral_count).toBe(1);
    });
    it("safety_plan_rate is 100 when safety_plan_in_place is true", () => {
      expect(computeMetrics(single).safety_plan_rate).toBe(100);
    });
    it("safety_plan_rate is 0 when safety_plan_in_place is false", () => {
      const r = [makeRow({ safety_plan_in_place: false })];
      expect(computeMetrics(r).safety_plan_rate).toBe(0);
    });
    it("exploitation_screening_rate is 100 when exploitation_screening_completed is true", () => {
      expect(computeMetrics(single).exploitation_screening_rate).toBe(100);
    });
    it("exploitation_screening_rate is 0 when false", () => {
      const r = [makeRow({ exploitation_screening_completed: false })];
      expect(computeMetrics(r).exploitation_screening_rate).toBe(0);
    });
    it("multi_agency_rate is 0 when multi_agency_meeting_held is false", () => {
      expect(computeMetrics(single).multi_agency_rate).toBe(0);
    });
    it("multi_agency_rate is 100 when multi_agency_meeting_held is true", () => {
      const r = [makeRow({ multi_agency_meeting_held: true })];
      expect(computeMetrics(r).multi_agency_rate).toBe(100);
    });
    it("police_notification_rate is 0 when police_notified is false", () => {
      expect(computeMetrics(single).police_notification_rate).toBe(0);
    });
    it("police_notification_rate is 100 when police_notified is true", () => {
      const r = [makeRow({ police_notified: true })];
      expect(computeMetrics(r).police_notification_rate).toBe(100);
    });
    it("avg_indicators is 0 for default record", () => {
      expect(computeMetrics(single).avg_indicators).toBe(0);
    });
    it("avg_indicators returns the value for single record", () => {
      const r = [makeRow({ gang_involvement_indicators: 5 })];
      expect(computeMetrics(r).avg_indicators).toBe(5);
    });
    it("avg_missing_episodes is 0 for default record", () => {
      expect(computeMetrics(single).avg_missing_episodes).toBe(0);
    });
    it("avg_missing_episodes returns value for single record", () => {
      const r = [makeRow({ missing_episodes_linked: 3 })];
      expect(computeMetrics(r).avg_missing_episodes).toBe(3);
    });
    it("unique_children is 1 for single record", () => {
      expect(computeMetrics(single).unique_children).toBe(1);
    });
    it("unique_assessors is 1 for single record", () => {
      expect(computeMetrics(single).unique_assessors).toBe(1);
    });
  });

  // ── Multiple records ─────────────────────────────────────────────────
  describe("multiple records", () => {
    const records = [
      makeRow({
        id: "r-1",
        child_name: "Child A",
        risk_level: "High",
        county_lines_risk: true,
        nrm_referral_made: true,
        police_notified: true,
        safety_plan_in_place: true,
        exploitation_screening_completed: true,
        multi_agency_meeting_held: true,
        gang_involvement_indicators: 4,
        missing_episodes_linked: 2,
        assessor_name: "Assessor X",
      }),
      makeRow({
        id: "r-2",
        child_name: "Child B",
        risk_level: "Significant",
        county_lines_risk: true,
        nrm_referral_made: true,
        police_notified: true,
        safety_plan_in_place: true,
        exploitation_screening_completed: true,
        multi_agency_meeting_held: true,
        gang_involvement_indicators: 6,
        missing_episodes_linked: 4,
        assessor_name: "Assessor Y",
      }),
      makeRow({
        id: "r-3",
        child_name: "Child C",
        risk_level: "Low",
        county_lines_risk: false,
        nrm_referral_made: false,
        police_notified: false,
        safety_plan_in_place: false,
        exploitation_screening_completed: false,
        multi_agency_meeting_held: false,
        gang_involvement_indicators: 0,
        missing_episodes_linked: 0,
        assessor_name: "Assessor X",
      }),
      makeRow({
        id: "r-4",
        child_name: "Child A",
        risk_level: "Medium",
        county_lines_risk: false,
        nrm_referral_made: false,
        police_notified: false,
        safety_plan_in_place: false,
        exploitation_screening_completed: true,
        multi_agency_meeting_held: false,
        gang_involvement_indicators: 2,
        missing_episodes_linked: 1,
        assessor_name: "Assessor Z",
      }),
      makeRow({
        id: "r-5",
        child_name: "Child D",
        risk_level: "No Identified Risk",
        county_lines_risk: false,
        nrm_referral_made: false,
        police_notified: false,
        safety_plan_in_place: true,
        exploitation_screening_completed: true,
        multi_agency_meeting_held: false,
        gang_involvement_indicators: 0,
        missing_episodes_linked: 0,
        assessor_name: "Assessor Y",
      }),
    ];

    it("total_assessments is 5", () => {
      expect(computeMetrics(records).total_assessments).toBe(5);
    });
    it("high_risk_count is 2 (High + Significant)", () => {
      expect(computeMetrics(records).high_risk_count).toBe(2);
    });
    it("county_lines_count is 2", () => {
      expect(computeMetrics(records).county_lines_count).toBe(2);
    });
    it("nrm_referral_count is 2", () => {
      expect(computeMetrics(records).nrm_referral_count).toBe(2);
    });
    it("safety_plan_rate is 60 (3 of 5)", () => {
      expect(computeMetrics(records).safety_plan_rate).toBe(60);
    });
    it("exploitation_screening_rate is 80 (4 of 5)", () => {
      expect(computeMetrics(records).exploitation_screening_rate).toBe(80);
    });
    it("multi_agency_rate is 40 (2 of 5)", () => {
      expect(computeMetrics(records).multi_agency_rate).toBe(40);
    });
    it("police_notification_rate is 40 (2 of 5)", () => {
      expect(computeMetrics(records).police_notification_rate).toBe(40);
    });
    it("avg_indicators is 2.4 ((4+6+0+2+0)/5)", () => {
      expect(computeMetrics(records).avg_indicators).toBe(2.4);
    });
    it("avg_missing_episodes is 1.4 ((2+4+0+1+0)/5)", () => {
      expect(computeMetrics(records).avg_missing_episodes).toBe(1.4);
    });
    it("unique_children is 4 (Child A appears twice)", () => {
      expect(computeMetrics(records).unique_children).toBe(4);
    });
    it("unique_assessors is 3", () => {
      expect(computeMetrics(records).unique_assessors).toBe(3);
    });
  });

  // ── high_risk_count logic ────────────────────────────────────────────
  describe("high_risk_count logic", () => {
    it("counts High as high risk", () => {
      const r = [makeRow({ risk_level: "High" })];
      expect(computeMetrics(r).high_risk_count).toBe(1);
    });
    it("counts Significant as high risk", () => {
      const r = [makeRow({ risk_level: "Significant" })];
      expect(computeMetrics(r).high_risk_count).toBe(1);
    });
    it("does not count Medium as high risk", () => {
      const r = [makeRow({ risk_level: "Medium" })];
      expect(computeMetrics(r).high_risk_count).toBe(0);
    });
    it("does not count Low as high risk", () => {
      const r = [makeRow({ risk_level: "Low" })];
      expect(computeMetrics(r).high_risk_count).toBe(0);
    });
    it("does not count No Identified Risk as high risk", () => {
      const r = [makeRow({ risk_level: "No Identified Risk" })];
      expect(computeMetrics(r).high_risk_count).toBe(0);
    });
    it("counts correctly with mixed risk levels", () => {
      const r = [
        makeRow({ id: "1", risk_level: "High" }),
        makeRow({ id: "2", risk_level: "Significant" }),
        makeRow({ id: "3", risk_level: "Medium" }),
        makeRow({ id: "4", risk_level: "Low" }),
        makeRow({ id: "5", risk_level: "No Identified Risk" }),
      ];
      expect(computeMetrics(r).high_risk_count).toBe(2);
    });
  });

  // ── Rate rounding ────────────────────────────────────────────────────
  describe("rate rounding", () => {
    it("rounds 1 of 3 to 33.3", () => {
      const r = [
        makeRow({ id: "1", safety_plan_in_place: true }),
        makeRow({ id: "2", safety_plan_in_place: false }),
        makeRow({ id: "3", safety_plan_in_place: false }),
      ];
      expect(computeMetrics(r).safety_plan_rate).toBe(33.3);
    });
    it("rounds 2 of 3 to 66.7", () => {
      const r = [
        makeRow({ id: "1", safety_plan_in_place: true }),
        makeRow({ id: "2", safety_plan_in_place: true }),
        makeRow({ id: "3", safety_plan_in_place: false }),
      ];
      expect(computeMetrics(r).safety_plan_rate).toBe(66.7);
    });
    it("all rates use Math.round(value * 1000) / 10 formula", () => {
      const r = [
        makeRow({
          id: "1",
          safety_plan_in_place: true,
          exploitation_screening_completed: true,
          multi_agency_meeting_held: true,
          police_notified: true,
        }),
        makeRow({
          id: "2",
          safety_plan_in_place: true,
          exploitation_screening_completed: true,
          multi_agency_meeting_held: true,
          police_notified: true,
        }),
        makeRow({
          id: "3",
          safety_plan_in_place: false,
          exploitation_screening_completed: false,
          multi_agency_meeting_held: false,
          police_notified: false,
        }),
      ];
      const m = computeMetrics(r);
      expect(m.safety_plan_rate).toBe(66.7);
      expect(m.exploitation_screening_rate).toBe(66.7);
      expect(m.multi_agency_rate).toBe(66.7);
      expect(m.police_notification_rate).toBe(66.7);
    });
    it("returns 100 when all true", () => {
      const r = [
        makeRow({ id: "1", police_notified: true }),
        makeRow({ id: "2", police_notified: true }),
      ];
      expect(computeMetrics(r).police_notification_rate).toBe(100);
    });
    it("returns 0 when all false", () => {
      const r = [
        makeRow({ id: "1", police_notified: false }),
        makeRow({ id: "2", police_notified: false }),
      ];
      expect(computeMetrics(r).police_notification_rate).toBe(0);
    });
    it("returns 50 for 1 of 2", () => {
      const r = [
        makeRow({ id: "1", police_notified: true }),
        makeRow({ id: "2", police_notified: false }),
      ];
      expect(computeMetrics(r).police_notification_rate).toBe(50);
    });
  });

  // ── avg_indicators logic ─────────────────────────────────────────────
  describe("avg_indicators logic", () => {
    it("averages correctly for two records", () => {
      const r = [
        makeRow({ id: "1", gang_involvement_indicators: 3 }),
        makeRow({ id: "2", gang_involvement_indicators: 7 }),
      ];
      expect(computeMetrics(r).avg_indicators).toBe(5);
    });
    it("rounds to 1 decimal place", () => {
      const r = [
        makeRow({ id: "1", gang_involvement_indicators: 1 }),
        makeRow({ id: "2", gang_involvement_indicators: 2 }),
        makeRow({ id: "3", gang_involvement_indicators: 3 }),
      ];
      expect(computeMetrics(r).avg_indicators).toBe(2);
    });
    it("handles non-round average (3.3)", () => {
      const r = [
        makeRow({ id: "1", gang_involvement_indicators: 2 }),
        makeRow({ id: "2", gang_involvement_indicators: 3 }),
        makeRow({ id: "3", gang_involvement_indicators: 5 }),
      ];
      // (2+3+5)/3 = 3.333... -> 3.3
      expect(computeMetrics(r).avg_indicators).toBe(3.3);
    });
    it("handles all zeros", () => {
      const r = [
        makeRow({ id: "1", gang_involvement_indicators: 0 }),
        makeRow({ id: "2", gang_involvement_indicators: 0 }),
      ];
      expect(computeMetrics(r).avg_indicators).toBe(0);
    });
  });

  // ── avg_missing_episodes logic ──────────────────────────────────────
  describe("avg_missing_episodes logic", () => {
    it("averages correctly for two records", () => {
      const r = [
        makeRow({ id: "1", missing_episodes_linked: 2 }),
        makeRow({ id: "2", missing_episodes_linked: 4 }),
      ];
      expect(computeMetrics(r).avg_missing_episodes).toBe(3);
    });
    it("handles non-round average (1.7)", () => {
      const r = [
        makeRow({ id: "1", missing_episodes_linked: 1 }),
        makeRow({ id: "2", missing_episodes_linked: 2 }),
        makeRow({ id: "3", missing_episodes_linked: 2 }),
      ];
      // (1+2+2)/3 = 1.666... -> 1.7
      expect(computeMetrics(r).avg_missing_episodes).toBe(1.7);
    });
    it("handles all zeros", () => {
      const r = [
        makeRow({ id: "1", missing_episodes_linked: 0 }),
        makeRow({ id: "2", missing_episodes_linked: 0 }),
      ];
      expect(computeMetrics(r).avg_missing_episodes).toBe(0);
    });
  });

  // ── unique_children logic ───────────────────────────────────────────
  describe("unique_children logic", () => {
    it("counts distinct child names", () => {
      const r = [
        makeRow({ id: "1", child_name: "Child A" }),
        makeRow({ id: "2", child_name: "Child A" }),
        makeRow({ id: "3", child_name: "Child B" }),
      ];
      expect(computeMetrics(r).unique_children).toBe(2);
    });
    it("counts each unique child once", () => {
      const r = [
        makeRow({ id: "1", child_name: "Alice" }),
        makeRow({ id: "2", child_name: "Bob" }),
        makeRow({ id: "3", child_name: "Charlie" }),
      ];
      expect(computeMetrics(r).unique_children).toBe(3);
    });
    it("counts 1 when all same child", () => {
      const r = [
        makeRow({ id: "1", child_name: "Same" }),
        makeRow({ id: "2", child_name: "Same" }),
        makeRow({ id: "3", child_name: "Same" }),
      ];
      expect(computeMetrics(r).unique_children).toBe(1);
    });
  });

  // ── unique_assessors logic ──────────────────────────────────────────
  describe("unique_assessors logic", () => {
    it("counts distinct assessor names", () => {
      const r = [
        makeRow({ id: "1", assessor_name: "Assessor X" }),
        makeRow({ id: "2", assessor_name: "Assessor X" }),
        makeRow({ id: "3", assessor_name: "Assessor Y" }),
      ];
      expect(computeMetrics(r).unique_assessors).toBe(2);
    });
    it("counts each unique assessor once", () => {
      const r = [
        makeRow({ id: "1", assessor_name: "A" }),
        makeRow({ id: "2", assessor_name: "B" }),
        makeRow({ id: "3", assessor_name: "C" }),
      ];
      expect(computeMetrics(r).unique_assessors).toBe(3);
    });
    it("counts 1 when all same assessor", () => {
      const r = [
        makeRow({ id: "1", assessor_name: "Same" }),
        makeRow({ id: "2", assessor_name: "Same" }),
      ];
      expect(computeMetrics(r).unique_assessors).toBe(1);
    });
  });

  // ── exploitation_screening_rate ──────────────────────────────────────
  describe("exploitation_screening_rate", () => {
    it("is 100 when all true", () => {
      const r = [
        makeRow({ id: "1", exploitation_screening_completed: true }),
        makeRow({ id: "2", exploitation_screening_completed: true }),
      ];
      expect(computeMetrics(r).exploitation_screening_rate).toBe(100);
    });
    it("is 0 when all false", () => {
      const r = [
        makeRow({ id: "1", exploitation_screening_completed: false }),
        makeRow({ id: "2", exploitation_screening_completed: false }),
      ];
      expect(computeMetrics(r).exploitation_screening_rate).toBe(0);
    });
    it("rounds 1 of 3 to 33.3", () => {
      const r = [
        makeRow({ id: "1", exploitation_screening_completed: true }),
        makeRow({ id: "2", exploitation_screening_completed: false }),
        makeRow({ id: "3", exploitation_screening_completed: false }),
      ];
      expect(computeMetrics(r).exploitation_screening_rate).toBe(33.3);
    });
  });

  // ── multi_agency_rate ────────────────────────────────────────────────
  describe("multi_agency_rate", () => {
    it("is 100 when all true", () => {
      const r = [
        makeRow({ id: "1", multi_agency_meeting_held: true }),
        makeRow({ id: "2", multi_agency_meeting_held: true }),
      ];
      expect(computeMetrics(r).multi_agency_rate).toBe(100);
    });
    it("is 0 when all false", () => {
      const r = [
        makeRow({ id: "1", multi_agency_meeting_held: false }),
        makeRow({ id: "2", multi_agency_meeting_held: false }),
      ];
      expect(computeMetrics(r).multi_agency_rate).toBe(0);
    });
    it("rounds 2 of 3 to 66.7", () => {
      const r = [
        makeRow({ id: "1", multi_agency_meeting_held: true }),
        makeRow({ id: "2", multi_agency_meeting_held: true }),
        makeRow({ id: "3", multi_agency_meeting_held: false }),
      ];
      expect(computeMetrics(r).multi_agency_rate).toBe(66.7);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. computeAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("computeAlerts", () => {
  // ── No alerts ──────────────────────────────────────────────────────
  describe("no alerts scenario", () => {
    it("returns empty array for empty records", () => {
      expect(computeAlerts([])).toEqual([]);
    });
    it("returns empty array when everything is well-managed", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "Low",
          county_lines_risk: false,
          safety_plan_in_place: true,
          multi_agency_meeting_held: true,
          exploitation_screening_completed: true,
        }),
      ];
      expect(computeAlerts(r)).toEqual([]);
    });
    it("returns empty for No Identified Risk without screening", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "No Identified Risk",
          exploitation_screening_completed: false,
          safety_plan_in_place: true,
        }),
      ];
      expect(computeAlerts(r)).toEqual([]);
    });
    it("returns empty for Low risk with safety plan and screening", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "Low",
          safety_plan_in_place: true,
          exploitation_screening_completed: true,
        }),
      ];
      expect(computeAlerts(r)).toEqual([]);
    });
  });

  // ── significant_risk_no_safety_plan (critical) ─────────────────────
  describe("significant_risk_no_safety_plan alert", () => {
    it("fires for Significant risk without safety plan", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "Significant",
          safety_plan_in_place: false,
          exploitation_screening_completed: true,
        }),
      ];
      const alerts = computeAlerts(r);
      expect(alerts.find((a) => a.type === "significant_risk_no_safety_plan")).toBeTruthy();
    });
    it("has critical severity", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "Significant",
          safety_plan_in_place: false,
          exploitation_screening_completed: true,
        }),
      ];
      const alert = computeAlerts(r).find((a) => a.type === "significant_risk_no_safety_plan")!;
      expect(alert.severity).toBe("critical");
    });
    it("uses record id as record_id", () => {
      const r = [
        makeRow({
          id: "r-42",
          risk_level: "Significant",
          safety_plan_in_place: false,
          exploitation_screening_completed: true,
        }),
      ];
      const alert = computeAlerts(r).find((a) => a.type === "significant_risk_no_safety_plan")!;
      expect(alert.record_id).toBe("r-42");
    });
    it("message contains child_name", () => {
      const r = [
        makeRow({
          id: "r-1",
          child_name: "Alice Brown",
          risk_level: "Significant",
          safety_plan_in_place: false,
          exploitation_screening_completed: true,
        }),
      ];
      const alert = computeAlerts(r).find((a) => a.type === "significant_risk_no_safety_plan")!;
      expect(alert.message).toContain("Alice Brown");
    });
    it("does NOT fire for Significant risk WITH safety plan", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "Significant",
          safety_plan_in_place: true,
          exploitation_screening_completed: true,
        }),
      ];
      expect(computeAlerts(r).find((a) => a.type === "significant_risk_no_safety_plan")).toBeUndefined();
    });
    it("does NOT fire for High risk without safety plan", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "High",
          safety_plan_in_place: false,
          exploitation_screening_completed: true,
        }),
      ];
      expect(computeAlerts(r).find((a) => a.type === "significant_risk_no_safety_plan")).toBeUndefined();
    });
    it("does NOT fire for Medium risk without safety plan", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "Medium",
          safety_plan_in_place: false,
          exploitation_screening_completed: true,
        }),
      ];
      expect(computeAlerts(r).find((a) => a.type === "significant_risk_no_safety_plan")).toBeUndefined();
    });
    it("does NOT fire for Low risk without safety plan", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "Low",
          safety_plan_in_place: false,
          exploitation_screening_completed: true,
        }),
      ];
      expect(computeAlerts(r).find((a) => a.type === "significant_risk_no_safety_plan")).toBeUndefined();
    });
    it("fires per record for multiple Significant without safety plan", () => {
      const r = [
        makeRow({ id: "r-1", risk_level: "Significant", safety_plan_in_place: false, exploitation_screening_completed: true }),
        makeRow({ id: "r-2", risk_level: "Significant", safety_plan_in_place: false, exploitation_screening_completed: true }),
      ];
      const alerts = computeAlerts(r).filter((a) => a.type === "significant_risk_no_safety_plan");
      expect(alerts).toHaveLength(2);
    });
    it("fires only for qualifying records in mixed set", () => {
      const r = [
        makeRow({ id: "r-1", risk_level: "Significant", safety_plan_in_place: false, exploitation_screening_completed: true }),
        makeRow({ id: "r-2", risk_level: "Significant", safety_plan_in_place: true, exploitation_screening_completed: true }),
        makeRow({ id: "r-3", risk_level: "High", safety_plan_in_place: false, exploitation_screening_completed: true }),
      ];
      const alerts = computeAlerts(r).filter((a) => a.type === "significant_risk_no_safety_plan");
      expect(alerts).toHaveLength(1);
      expect(alerts[0].record_id).toBe("r-1");
    });
  });

  // ── county_lines_no_nrm (critical) ────────────────────────────────
  describe("county_lines_no_nrm alert", () => {
    it("fires for county_lines_risk without nrm_referral_made", () => {
      const r = [
        makeRow({
          id: "r-1",
          county_lines_risk: true,
          nrm_referral_made: false,
          exploitation_screening_completed: true,
        }),
      ];
      expect(computeAlerts(r).find((a) => a.type === "county_lines_no_nrm")).toBeTruthy();
    });
    it("has critical severity", () => {
      const r = [
        makeRow({
          id: "r-1",
          county_lines_risk: true,
          nrm_referral_made: false,
          exploitation_screening_completed: true,
        }),
      ];
      const alert = computeAlerts(r).find((a) => a.type === "county_lines_no_nrm")!;
      expect(alert.severity).toBe("critical");
    });
    it("uses record id as record_id", () => {
      const r = [
        makeRow({
          id: "r-99",
          county_lines_risk: true,
          nrm_referral_made: false,
          exploitation_screening_completed: true,
        }),
      ];
      const alert = computeAlerts(r).find((a) => a.type === "county_lines_no_nrm")!;
      expect(alert.record_id).toBe("r-99");
    });
    it("message contains child_name", () => {
      const r = [
        makeRow({
          id: "r-1",
          child_name: "Bob Jones",
          county_lines_risk: true,
          nrm_referral_made: false,
          exploitation_screening_completed: true,
        }),
      ];
      const alert = computeAlerts(r).find((a) => a.type === "county_lines_no_nrm")!;
      expect(alert.message).toContain("Bob Jones");
    });
    it("does NOT fire when nrm_referral_made is true", () => {
      const r = [
        makeRow({
          id: "r-1",
          county_lines_risk: true,
          nrm_referral_made: true,
          exploitation_screening_completed: true,
        }),
      ];
      expect(computeAlerts(r).find((a) => a.type === "county_lines_no_nrm")).toBeUndefined();
    });
    it("does NOT fire when county_lines_risk is false", () => {
      const r = [
        makeRow({
          id: "r-1",
          county_lines_risk: false,
          nrm_referral_made: false,
          exploitation_screening_completed: true,
        }),
      ];
      expect(computeAlerts(r).find((a) => a.type === "county_lines_no_nrm")).toBeUndefined();
    });
    it("fires per record for multiple county lines without NRM", () => {
      const r = [
        makeRow({ id: "r-1", county_lines_risk: true, nrm_referral_made: false, exploitation_screening_completed: true }),
        makeRow({ id: "r-2", county_lines_risk: true, nrm_referral_made: false, exploitation_screening_completed: true }),
      ];
      const alerts = computeAlerts(r).filter((a) => a.type === "county_lines_no_nrm");
      expect(alerts).toHaveLength(2);
    });
    it("fires only for qualifying records in mixed set", () => {
      const r = [
        makeRow({ id: "r-1", county_lines_risk: true, nrm_referral_made: false, exploitation_screening_completed: true }),
        makeRow({ id: "r-2", county_lines_risk: true, nrm_referral_made: true, exploitation_screening_completed: true }),
        makeRow({ id: "r-3", county_lines_risk: false, nrm_referral_made: false, exploitation_screening_completed: true }),
      ];
      const alerts = computeAlerts(r).filter((a) => a.type === "county_lines_no_nrm");
      expect(alerts).toHaveLength(1);
      expect(alerts[0].record_id).toBe("r-1");
    });
  });

  // ── high_risk_no_multi_agency (high) ──────────────────────────────
  describe("high_risk_no_multi_agency alert", () => {
    it("fires for High risk without multi-agency meeting", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "High",
          multi_agency_meeting_held: false,
          exploitation_screening_completed: true,
        }),
      ];
      expect(computeAlerts(r).find((a) => a.type === "high_risk_no_multi_agency")).toBeTruthy();
    });
    it("has high severity", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "High",
          multi_agency_meeting_held: false,
          exploitation_screening_completed: true,
        }),
      ];
      const alert = computeAlerts(r).find((a) => a.type === "high_risk_no_multi_agency")!;
      expect(alert.severity).toBe("high");
    });
    it("uses record id as record_id", () => {
      const r = [
        makeRow({
          id: "r-77",
          risk_level: "High",
          multi_agency_meeting_held: false,
          exploitation_screening_completed: true,
        }),
      ];
      const alert = computeAlerts(r).find((a) => a.type === "high_risk_no_multi_agency")!;
      expect(alert.record_id).toBe("r-77");
    });
    it("message contains child_name", () => {
      const r = [
        makeRow({
          id: "r-1",
          child_name: "Carol White",
          risk_level: "High",
          multi_agency_meeting_held: false,
          exploitation_screening_completed: true,
        }),
      ];
      const alert = computeAlerts(r).find((a) => a.type === "high_risk_no_multi_agency")!;
      expect(alert.message).toContain("Carol White");
    });
    it("does NOT fire when multi_agency_meeting_held is true", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "High",
          multi_agency_meeting_held: true,
          exploitation_screening_completed: true,
        }),
      ];
      expect(computeAlerts(r).find((a) => a.type === "high_risk_no_multi_agency")).toBeUndefined();
    });
    it("does NOT fire for Significant risk without multi-agency", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "Significant",
          multi_agency_meeting_held: false,
          exploitation_screening_completed: true,
        }),
      ];
      expect(computeAlerts(r).find((a) => a.type === "high_risk_no_multi_agency")).toBeUndefined();
    });
    it("does NOT fire for Medium risk without multi-agency", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "Medium",
          multi_agency_meeting_held: false,
          exploitation_screening_completed: true,
        }),
      ];
      expect(computeAlerts(r).find((a) => a.type === "high_risk_no_multi_agency")).toBeUndefined();
    });
    it("does NOT fire for Low risk without multi-agency", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "Low",
          multi_agency_meeting_held: false,
          exploitation_screening_completed: true,
        }),
      ];
      expect(computeAlerts(r).find((a) => a.type === "high_risk_no_multi_agency")).toBeUndefined();
    });
    it("fires per record for multiple High without multi-agency", () => {
      const r = [
        makeRow({ id: "r-1", risk_level: "High", multi_agency_meeting_held: false, exploitation_screening_completed: true }),
        makeRow({ id: "r-2", risk_level: "High", multi_agency_meeting_held: false, exploitation_screening_completed: true }),
      ];
      const alerts = computeAlerts(r).filter((a) => a.type === "high_risk_no_multi_agency");
      expect(alerts).toHaveLength(2);
    });
    it("fires only for qualifying records in mixed set", () => {
      const r = [
        makeRow({ id: "r-1", risk_level: "High", multi_agency_meeting_held: false, exploitation_screening_completed: true }),
        makeRow({ id: "r-2", risk_level: "High", multi_agency_meeting_held: true, exploitation_screening_completed: true }),
        makeRow({ id: "r-3", risk_level: "Medium", multi_agency_meeting_held: false, exploitation_screening_completed: true }),
      ];
      const alerts = computeAlerts(r).filter((a) => a.type === "high_risk_no_multi_agency");
      expect(alerts).toHaveLength(1);
      expect(alerts[0].record_id).toBe("r-1");
    });
  });

  // ── no_exploitation_screening (medium) ────────────────────────────
  describe("no_exploitation_screening alert", () => {
    it("fires for Low risk without screening", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "Low",
          exploitation_screening_completed: false,
        }),
      ];
      expect(computeAlerts(r).find((a) => a.type === "no_exploitation_screening")).toBeTruthy();
    });
    it("fires for Medium risk without screening", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "Medium",
          exploitation_screening_completed: false,
        }),
      ];
      expect(computeAlerts(r).find((a) => a.type === "no_exploitation_screening")).toBeTruthy();
    });
    it("fires for High risk without screening", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "High",
          exploitation_screening_completed: false,
        }),
      ];
      expect(computeAlerts(r).find((a) => a.type === "no_exploitation_screening")).toBeTruthy();
    });
    it("fires for Significant risk without screening", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "Significant",
          exploitation_screening_completed: false,
        }),
      ];
      expect(computeAlerts(r).find((a) => a.type === "no_exploitation_screening")).toBeTruthy();
    });
    it("has medium severity", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "Low",
          exploitation_screening_completed: false,
        }),
      ];
      const alert = computeAlerts(r).find((a) => a.type === "no_exploitation_screening")!;
      expect(alert.severity).toBe("medium");
    });
    it("uses record id as record_id", () => {
      const r = [
        makeRow({
          id: "r-55",
          risk_level: "Medium",
          exploitation_screening_completed: false,
        }),
      ];
      const alert = computeAlerts(r).find((a) => a.type === "no_exploitation_screening")!;
      expect(alert.record_id).toBe("r-55");
    });
    it("message contains child_name", () => {
      const r = [
        makeRow({
          id: "r-1",
          child_name: "Danny Green",
          risk_level: "Medium",
          exploitation_screening_completed: false,
        }),
      ];
      const alert = computeAlerts(r).find((a) => a.type === "no_exploitation_screening")!;
      expect(alert.message).toContain("Danny Green");
    });
    it("message contains risk level", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "High",
          exploitation_screening_completed: false,
        }),
      ];
      const alert = computeAlerts(r).find((a) => a.type === "no_exploitation_screening")!;
      expect(alert.message).toContain("High");
    });
    it("does NOT fire for No Identified Risk without screening", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "No Identified Risk",
          exploitation_screening_completed: false,
        }),
      ];
      expect(computeAlerts(r).find((a) => a.type === "no_exploitation_screening")).toBeUndefined();
    });
    it("does NOT fire when exploitation_screening_completed is true", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "High",
          exploitation_screening_completed: true,
        }),
      ];
      expect(computeAlerts(r).find((a) => a.type === "no_exploitation_screening")).toBeUndefined();
    });
    it("fires per record for multiple without screening", () => {
      const r = [
        makeRow({ id: "r-1", risk_level: "Low", exploitation_screening_completed: false }),
        makeRow({ id: "r-2", risk_level: "Medium", exploitation_screening_completed: false }),
        makeRow({ id: "r-3", risk_level: "High", exploitation_screening_completed: false }),
      ];
      const alerts = computeAlerts(r).filter((a) => a.type === "no_exploitation_screening");
      expect(alerts).toHaveLength(3);
    });
    it("fires only for qualifying records in mixed set", () => {
      const r = [
        makeRow({ id: "r-1", risk_level: "Medium", exploitation_screening_completed: false }),
        makeRow({ id: "r-2", risk_level: "Medium", exploitation_screening_completed: true }),
        makeRow({ id: "r-3", risk_level: "No Identified Risk", exploitation_screening_completed: false }),
      ];
      const alerts = computeAlerts(r).filter((a) => a.type === "no_exploitation_screening");
      expect(alerts).toHaveLength(1);
      expect(alerts[0].record_id).toBe("r-1");
    });
  });

  // ── Combined alert scenarios ───────────────────────────────────────
  describe("combined alert scenarios", () => {
    it("can fire all four alert types simultaneously", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "Significant",
          safety_plan_in_place: false,
          county_lines_risk: true,
          nrm_referral_made: false,
          exploitation_screening_completed: false,
        }),
        makeRow({
          id: "r-2",
          risk_level: "High",
          multi_agency_meeting_held: false,
          exploitation_screening_completed: false,
        }),
      ];
      const alerts = computeAlerts(r);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("significant_risk_no_safety_plan");
      expect(types).toContain("county_lines_no_nrm");
      expect(types).toContain("high_risk_no_multi_agency");
      expect(types).toContain("no_exploitation_screening");
    });

    it("returns no alerts for a clean set of records", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "Low",
          safety_plan_in_place: true,
          exploitation_screening_completed: true,
          multi_agency_meeting_held: true,
          county_lines_risk: false,
        }),
        makeRow({
          id: "r-2",
          risk_level: "No Identified Risk",
          safety_plan_in_place: true,
          exploitation_screening_completed: false,
          county_lines_risk: false,
        }),
      ];
      expect(computeAlerts(r)).toEqual([]);
    });

    it("alert order: significant_risk_no_safety_plan before county_lines_no_nrm before high_risk_no_multi_agency before no_exploitation_screening", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "Significant",
          safety_plan_in_place: false,
          county_lines_risk: true,
          nrm_referral_made: false,
          exploitation_screening_completed: false,
        }),
        makeRow({
          id: "r-2",
          risk_level: "High",
          multi_agency_meeting_held: false,
          exploitation_screening_completed: false,
        }),
      ];
      const alerts = computeAlerts(r);
      const types = alerts.map((a) => a.type);
      const sigIdx = types.indexOf("significant_risk_no_safety_plan");
      const clIdx = types.indexOf("county_lines_no_nrm");
      const hmIdx = types.indexOf("high_risk_no_multi_agency");
      const nesIdx = types.indexOf("no_exploitation_screening");
      expect(sigIdx).toBeLessThan(clIdx);
      expect(clIdx).toBeLessThan(hmIdx);
      expect(hmIdx).toBeLessThan(nesIdx);
    });

    it("generates multiple per-record alerts for different records", () => {
      const r = [
        makeRow({ id: "r-1", county_lines_risk: true, nrm_referral_made: false, exploitation_screening_completed: true }),
        makeRow({ id: "r-2", county_lines_risk: true, nrm_referral_made: false, exploitation_screening_completed: true }),
      ];
      const alerts = computeAlerts(r);
      const cl = alerts.filter((a) => a.type === "county_lines_no_nrm");
      expect(cl).toHaveLength(2);
    });

    it("single record can generate multiple alert types", () => {
      const r = [
        makeRow({
          id: "r-1",
          risk_level: "Significant",
          safety_plan_in_place: false,
          county_lines_risk: true,
          nrm_referral_made: false,
          exploitation_screening_completed: false,
        }),
      ];
      const alerts = computeAlerts(r);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("significant_risk_no_safety_plan");
      expect(types).toContain("county_lines_no_nrm");
      expect(types).toContain("no_exploitation_screening");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. computeAriaInsights
// ═══════════════════════════════════════════════════════════════════════════

describe("computeAriaInsights", () => {
  // ── Structure ──────────────────────────────────────────────────────
  describe("structure", () => {
    it("returns an array of 3 strings", () => {
      const metrics = computeMetrics([]);
      const insights = computeAriaInsights(metrics);
      expect(insights).toHaveLength(3);
      for (const i of insights) {
        expect(typeof i).toBe("string");
      }
    });
    it("first insight starts with [red]", () => {
      const metrics = computeMetrics([]);
      expect(computeAriaInsights(metrics)[0]).toMatch(/^\[red\]/);
    });
    it("second insight starts with [amber]", () => {
      const metrics = computeMetrics([]);
      expect(computeAriaInsights(metrics)[1]).toMatch(/^\[amber\]/);
    });
    it("third insight starts with [reflect]", () => {
      const metrics = computeMetrics([]);
      expect(computeAriaInsights(metrics)[2]).toMatch(/^\[reflect\]/);
    });
  });

  // ── Empty data ─────────────────────────────────────────────────────
  describe("empty data", () => {
    it("first insight mentions 0 assessments", () => {
      const metrics = computeMetrics([]);
      expect(computeAriaInsights(metrics)[0]).toContain("0 gang affiliation risk assessments");
    });
    it("first insight mentions 0 children", () => {
      const metrics = computeMetrics([]);
      expect(computeAriaInsights(metrics)[0]).toContain("0 children");
    });
    it("second insight mentions no critical or high-priority concerns", () => {
      const metrics = computeMetrics([]);
      expect(computeAriaInsights(metrics)[1]).toContain("No critical or high-priority concerns");
    });
  });

  // ── With data ──────────────────────────────────────────────────────
  describe("with data", () => {
    const rows = [
      makeRow({ id: "r-1", child_name: "Child A", risk_level: "High", county_lines_risk: true, nrm_referral_made: true }),
      makeRow({ id: "r-2", child_name: "Child B", risk_level: "Low" }),
    ];
    const metrics = computeMetrics(rows);
    const alerts = computeAlerts(rows);

    it("first insight mentions total assessments", () => {
      expect(computeAriaInsights(metrics, alerts)[0]).toContain("2 gang affiliation risk assessments");
    });
    it("first insight mentions unique children", () => {
      expect(computeAriaInsights(metrics, alerts)[0]).toContain("2 children");
    });
    it("first insight mentions high risk count", () => {
      expect(computeAriaInsights(metrics, alerts)[0]).toContain("1 at High or Significant risk level");
    });
    it("first insight mentions county lines count", () => {
      expect(computeAriaInsights(metrics, alerts)[0]).toContain("1 county lines case");
    });
    it("first insight mentions NRM referral count", () => {
      expect(computeAriaInsights(metrics, alerts)[0]).toContain("NRM referral count: 1");
    });
  });

  // ── Singular/plural ────────────────────────────────────────────────
  describe("singular/plural", () => {
    it("uses singular 'assessment' for 1 record", () => {
      const metrics = computeMetrics([makeRow()]);
      expect(computeAriaInsights(metrics)[0]).toContain("1 gang affiliation risk assessment ");
    });
    it("uses plural 'assessments' for 2 records", () => {
      const metrics = computeMetrics([makeRow({ id: "1" }), makeRow({ id: "2" })]);
      expect(computeAriaInsights(metrics)[0]).toContain("2 gang affiliation risk assessments");
    });
    it("uses singular 'child' for 1 unique child", () => {
      const metrics = computeMetrics([makeRow()]);
      expect(computeAriaInsights(metrics)[0]).toContain("1 child");
    });
    it("uses plural 'children' for 2 unique children", () => {
      const metrics = computeMetrics([
        makeRow({ id: "1", child_name: "A" }),
        makeRow({ id: "2", child_name: "B" }),
      ]);
      expect(computeAriaInsights(metrics)[0]).toContain("2 children");
    });
    it("uses singular 'case' for 1 county lines", () => {
      const metrics = computeMetrics([makeRow({ county_lines_risk: true })]);
      expect(computeAriaInsights(metrics)[0]).toContain("1 county lines case.");
    });
    it("uses plural 'cases' for 2 county lines", () => {
      const metrics = computeMetrics([
        makeRow({ id: "1", county_lines_risk: true }),
        makeRow({ id: "2", county_lines_risk: true }),
      ]);
      expect(computeAriaInsights(metrics)[0]).toContain("2 county lines cases");
    });
  });

  // ── Alert-dependent insight (second insight) ───────────────────────
  describe("alert-dependent second insight", () => {
    it("mentions critical and high counts when alerts present", () => {
      const rows = [
        makeRow({
          id: "r-1",
          risk_level: "Significant",
          safety_plan_in_place: false,
          exploitation_screening_completed: true,
        }),
        makeRow({
          id: "r-2",
          risk_level: "High",
          multi_agency_meeting_held: false,
          exploitation_screening_completed: true,
        }),
      ];
      const metrics = computeMetrics(rows);
      const alerts = computeAlerts(rows);
      const insight = computeAriaInsights(metrics, alerts)[1];
      expect(insight).toContain("1 critical and 1 high-priority concerns");
    });
    it("mentions no concerns when no alerts", () => {
      const rows = [
        makeRow({ id: "r-1", risk_level: "Low", exploitation_screening_completed: true }),
      ];
      const metrics = computeMetrics(rows);
      const alerts = computeAlerts(rows);
      const insight = computeAriaInsights(metrics, alerts)[1];
      expect(insight).toContain("No critical or high-priority concerns");
    });
    it("includes safety plan rate", () => {
      const metrics = computeMetrics([makeRow()]);
      expect(computeAriaInsights(metrics)[1]).toContain("Safety plan rate:");
    });
    it("includes multi-agency rate", () => {
      const metrics = computeMetrics([makeRow()]);
      expect(computeAriaInsights(metrics)[1]).toContain("Multi-agency rate:");
    });
    it("includes police notification rate", () => {
      const metrics = computeMetrics([makeRow()]);
      expect(computeAriaInsights(metrics)[1]).toContain("Police notification rate:");
    });
    it("handles alerts being undefined", () => {
      const metrics = computeMetrics([makeRow()]);
      const insights = computeAriaInsights(metrics);
      expect(insights[1]).toContain("No critical or high-priority concerns");
    });
  });

  // ── Reflective question (third insight) ────────────────────────────
  describe("reflective question", () => {
    it("contains a question mark", () => {
      const metrics = computeMetrics([]);
      expect(computeAriaInsights(metrics)[2]).toContain("?");
    });
    it("mentions gang affiliation", () => {
      const metrics = computeMetrics([]);
      expect(computeAriaInsights(metrics)[2]).toContain("gang affiliation");
    });
    it("mentions multi-agency partners", () => {
      const metrics = computeMetrics([]);
      expect(computeAriaInsights(metrics)[2]).toContain("multi-agency partners");
    });
    it("mentions disruption strategy", () => {
      const metrics = computeMetrics([]);
      expect(computeAriaInsights(metrics)[2]).toContain("disruption strategy");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. Row factory (makeRow)
// ═══════════════════════════════════════════════════════════════════════════

describe("makeRow factory", () => {
  it("creates a valid row with defaults", () => {
    const row = makeRow();
    expect(row.home_id).toBe("home-1");
    expect(row.child_name).toBe("Child A");
    expect(row.risk_level).toBe("Low");
    expect(row.gang_involvement_indicators).toBe(0);
    expect(row.county_lines_risk).toBe(false);
    expect(row.nrm_referral_made).toBe(false);
    expect(row.police_notified).toBe(false);
    expect(row.social_worker_notified).toBe(true);
    expect(row.disruption_strategy).toBeNull();
    expect(row.multi_agency_meeting_held).toBe(false);
    expect(row.safety_plan_in_place).toBe(true);
    expect(row.exploitation_screening_completed).toBe(true);
    expect(row.missing_episodes_linked).toBe(0);
    expect(row.review_date).toBeNull();
    expect(row.assessor_name).toBe("Assessor X");
    expect(row.notes).toBeNull();
  });
  it("overrides disruption_strategy with null explicitly", () => {
    const row = makeRow({ disruption_strategy: null });
    expect(row.disruption_strategy).toBeNull();
  });
  it("overrides disruption_strategy with a value", () => {
    const row = makeRow({ disruption_strategy: "Safety Plan" });
    expect(row.disruption_strategy).toBe("Safety Plan");
  });
  it("overrides review_date with null explicitly", () => {
    const row = makeRow({ review_date: null });
    expect(row.review_date).toBeNull();
  });
  it("overrides review_date with a value", () => {
    const row = makeRow({ review_date: "2024-12-01" });
    expect(row.review_date).toBe("2024-12-01");
  });
  it("overrides notes with null explicitly", () => {
    const row = makeRow({ notes: null });
    expect(row.notes).toBeNull();
  });
  it("overrides notes with a value", () => {
    const row = makeRow({ notes: "Some notes" });
    expect(row.notes).toBe("Some notes");
  });
  it("generates unique ids by default", () => {
    const row1 = makeRow();
    const row2 = makeRow();
    expect(row1.id).not.toBe(row2.id);
  });
  it("uses explicit id when provided", () => {
    const row = makeRow({ id: "custom-id" });
    expect(row.id).toBe("custom-id");
  });
  it("sets assessment_date to today by default", () => {
    const row = makeRow();
    expect(row.assessment_date).toBe(now.toISOString().split("T")[0]);
  });
});
