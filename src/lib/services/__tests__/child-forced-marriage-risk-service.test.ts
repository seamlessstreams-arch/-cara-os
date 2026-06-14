import { describe, it, expect } from "vitest";

import {
  FORCED_MARRIAGE_RISK_LEVELS,
  _testing,
} from "../child-forced-marriage-risk-service";

import type {
  ChildForcedMarriageRiskRow,
} from "../child-forced-marriage-risk-service";

const {
  computeForcedMarriageRiskMetrics,
  computeForcedMarriageRiskAlerts,
  generateForcedMarriageRiskCaraInsights,
} = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<ChildForcedMarriageRiskRow>,
): ChildForcedMarriageRiskRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: overrides?.home_id ?? "home-1",
    child_name: overrides?.child_name ?? "Child A",
    assessment_date: overrides?.assessment_date ?? now.toISOString().split("T")[0],
    risk_level: overrides?.risk_level ?? "Low",
    risk_indicators_count: overrides?.risk_indicators_count ?? 0,
    fmpo_in_place: overrides?.fmpo_in_place ?? false,
    police_notified: overrides?.police_notified ?? true,
    social_worker_notified: overrides?.social_worker_notified ?? true,
    forced_marriage_unit_contacted: overrides?.forced_marriage_unit_contacted ?? false,
    multi_agency_referral: overrides?.multi_agency_referral ?? true,
    safety_plan_in_place: overrides?.safety_plan_in_place ?? true,
    passport_secured: overrides?.passport_secured ?? false,
    travel_restrictions: overrides?.travel_restrictions ?? false,
    specialist_service_involved: overrides?.specialist_service_involved ?? false,
    review_date: "review_date" in (overrides ?? {}) ? (overrides!.review_date ?? null) : null,
    assessor_name: overrides?.assessor_name ?? "Assessor 1",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("child-forced-marriage-risk-service", () => {
  // ── Enum validation ──────────────────────────────────────────────────
  describe("Enum validation", () => {
    it("FORCED_MARRIAGE_RISK_LEVELS has 5 values", () => { expect(FORCED_MARRIAGE_RISK_LEVELS).toHaveLength(5); });
    it("FORCED_MARRIAGE_RISK_LEVELS contains No Identified Risk", () => { expect(FORCED_MARRIAGE_RISK_LEVELS).toContain("No Identified Risk"); });
    it("FORCED_MARRIAGE_RISK_LEVELS contains Low", () => { expect(FORCED_MARRIAGE_RISK_LEVELS).toContain("Low"); });
    it("FORCED_MARRIAGE_RISK_LEVELS contains Medium", () => { expect(FORCED_MARRIAGE_RISK_LEVELS).toContain("Medium"); });
    it("FORCED_MARRIAGE_RISK_LEVELS contains High", () => { expect(FORCED_MARRIAGE_RISK_LEVELS).toContain("High"); });
    it("FORCED_MARRIAGE_RISK_LEVELS contains Immediate", () => { expect(FORCED_MARRIAGE_RISK_LEVELS).toContain("Immediate"); });
  });

  // ── makeRow factory ─────────────────────────────────────────────────
  describe("makeRow factory", () => {
    it("produces a valid default row", () => {
      const r = makeRow();
      expect(r.id).toBeDefined();
      expect(r.home_id).toBe("home-1");
      expect(r.child_name).toBe("Child A");
    });
    it("overrides child_name", () => { expect(makeRow({ child_name: "Zara" }).child_name).toBe("Zara"); });
    it("overrides risk_level", () => { expect(makeRow({ risk_level: "High" }).risk_level).toBe("High"); });
    it("overrides id when provided", () => { expect(makeRow({ id: "my-id" }).id).toBe("my-id"); });
    it("overrides assessor_name", () => { expect(makeRow({ assessor_name: "Jane" }).assessor_name).toBe("Jane"); });
    it("default assessor_name is Assessor 1", () => { expect(makeRow().assessor_name).toBe("Assessor 1"); });
    it("overrides review_date", () => { expect(makeRow({ review_date: "2025-06-01" }).review_date).toBe("2025-06-01"); });
    it("overrides review_date to null explicitly", () => { expect(makeRow({ review_date: null }).review_date).toBeNull(); });
    it("default review_date is null", () => { expect(makeRow().review_date).toBeNull(); });
    it("overrides notes", () => { expect(makeRow({ notes: "some notes" }).notes).toBe("some notes"); });
    it("overrides notes to null explicitly", () => { expect(makeRow({ notes: null }).notes).toBeNull(); });
    it("default notes is null", () => { expect(makeRow().notes).toBeNull(); });
    it("overrides risk_indicators_count", () => { expect(makeRow({ risk_indicators_count: 5 }).risk_indicators_count).toBe(5); });
    it("default risk_indicators_count is 0", () => { expect(makeRow().risk_indicators_count).toBe(0); });
    it("overrides booleans", () => {
      const r = makeRow({ fmpo_in_place: true, police_notified: false });
      expect(r.fmpo_in_place).toBe(true);
      expect(r.police_notified).toBe(false);
    });
    it("default fmpo_in_place is false", () => { expect(makeRow().fmpo_in_place).toBe(false); });
    it("default police_notified is true", () => { expect(makeRow().police_notified).toBe(true); });
    it("default social_worker_notified is true", () => { expect(makeRow().social_worker_notified).toBe(true); });
    it("default forced_marriage_unit_contacted is false", () => { expect(makeRow().forced_marriage_unit_contacted).toBe(false); });
    it("default multi_agency_referral is true", () => { expect(makeRow().multi_agency_referral).toBe(true); });
    it("default safety_plan_in_place is true", () => { expect(makeRow().safety_plan_in_place).toBe(true); });
    it("default passport_secured is false", () => { expect(makeRow().passport_secured).toBe(false); });
    it("default travel_restrictions is false", () => { expect(makeRow().travel_restrictions).toBe(false); });
    it("default specialist_service_involved is false", () => { expect(makeRow().specialist_service_involved).toBe(false); });
    it("overrides home_id", () => { expect(makeRow({ home_id: "home-2" }).home_id).toBe("home-2"); });
    it("overrides assessment_date", () => { expect(makeRow({ assessment_date: "2025-01-15" }).assessment_date).toBe("2025-01-15"); });
    it("overrides passport_secured", () => { expect(makeRow({ passport_secured: true }).passport_secured).toBe(true); });
    it("overrides travel_restrictions", () => { expect(makeRow({ travel_restrictions: true }).travel_restrictions).toBe(true); });
    it("overrides specialist_service_involved", () => { expect(makeRow({ specialist_service_involved: true }).specialist_service_involved).toBe(true); });
    it("overrides forced_marriage_unit_contacted", () => { expect(makeRow({ forced_marriage_unit_contacted: true }).forced_marriage_unit_contacted).toBe(true); });
    it("default created_at is defined", () => { expect(makeRow().created_at).toBeDefined(); });
    it("default updated_at is defined", () => { expect(makeRow().updated_at).toBeDefined(); });
  });

  // ── computeForcedMarriageRiskMetrics ──────────────────────────────────
  describe("computeForcedMarriageRiskMetrics", () => {
    it("returns zeros for empty array", () => {
      const m = computeForcedMarriageRiskMetrics([]);
      expect(m.total_assessments).toBe(0);
      expect(m.high_risk_count).toBe(0);
      expect(m.fmpo_count).toBe(0);
      expect(m.fmu_contacted_count).toBe(0);
      expect(m.safety_plan_rate).toBe(0);
      expect(m.multi_agency_rate).toBe(0);
      expect(m.police_notification_rate).toBe(0);
      expect(m.passport_secured_rate).toBe(0);
      expect(m.travel_restriction_rate).toBe(0);
      expect(m.review_scheduled_rate).toBe(0);
      expect(m.unique_children).toBe(0);
      expect(m.unique_assessors).toBe(0);
    });

    // total_assessments
    it("total_assessments counts rows", () => { expect(computeForcedMarriageRiskMetrics([makeRow(), makeRow(), makeRow()]).total_assessments).toBe(3); });
    it("total_assessments 1 for single row", () => { expect(computeForcedMarriageRiskMetrics([makeRow()]).total_assessments).toBe(1); });

    // high_risk_count (High + Immediate)
    it("counts High as high_risk_count", () => { expect(computeForcedMarriageRiskMetrics([makeRow({ risk_level: "High" })]).high_risk_count).toBe(1); });
    it("counts Immediate as high_risk_count", () => { expect(computeForcedMarriageRiskMetrics([makeRow({ risk_level: "Immediate" })]).high_risk_count).toBe(1); });
    it("does not count Medium as high_risk_count", () => { expect(computeForcedMarriageRiskMetrics([makeRow({ risk_level: "Medium" })]).high_risk_count).toBe(0); });
    it("does not count Low as high_risk_count", () => { expect(computeForcedMarriageRiskMetrics([makeRow({ risk_level: "Low" })]).high_risk_count).toBe(0); });
    it("does not count No Identified Risk as high_risk_count", () => { expect(computeForcedMarriageRiskMetrics([makeRow({ risk_level: "No Identified Risk" })]).high_risk_count).toBe(0); });
    it("high_risk_count sums High and Immediate", () => {
      const m = computeForcedMarriageRiskMetrics([
        makeRow({ risk_level: "High" }),
        makeRow({ risk_level: "Immediate" }),
        makeRow({ risk_level: "Medium" }),
      ]);
      expect(m.high_risk_count).toBe(2);
    });
    it("high_risk_count 0 when all No Identified Risk", () => {
      const m = computeForcedMarriageRiskMetrics([
        makeRow({ risk_level: "No Identified Risk" }),
        makeRow({ risk_level: "No Identified Risk" }),
      ]);
      expect(m.high_risk_count).toBe(0);
    });

    // fmpo_count
    it("fmpo_count counts true", () => { expect(computeForcedMarriageRiskMetrics([makeRow({ fmpo_in_place: true })]).fmpo_count).toBe(1); });
    it("fmpo_count excludes false", () => { expect(computeForcedMarriageRiskMetrics([makeRow({ fmpo_in_place: false })]).fmpo_count).toBe(0); });
    it("fmpo_count sums correctly", () => {
      const m = computeForcedMarriageRiskMetrics([
        makeRow({ fmpo_in_place: true }),
        makeRow({ fmpo_in_place: false }),
        makeRow({ fmpo_in_place: true }),
      ]);
      expect(m.fmpo_count).toBe(2);
    });

    // fmu_contacted_count
    it("fmu_contacted_count counts true", () => { expect(computeForcedMarriageRiskMetrics([makeRow({ forced_marriage_unit_contacted: true })]).fmu_contacted_count).toBe(1); });
    it("fmu_contacted_count excludes false", () => { expect(computeForcedMarriageRiskMetrics([makeRow({ forced_marriage_unit_contacted: false })]).fmu_contacted_count).toBe(0); });
    it("fmu_contacted_count sums correctly", () => {
      const m = computeForcedMarriageRiskMetrics([
        makeRow({ forced_marriage_unit_contacted: true }),
        makeRow({ forced_marriage_unit_contacted: false }),
        makeRow({ forced_marriage_unit_contacted: true }),
      ]);
      expect(m.fmu_contacted_count).toBe(2);
    });

    // safety_plan_rate
    it("safety_plan_rate 100 when all true", () => { expect(computeForcedMarriageRiskMetrics([makeRow({ safety_plan_in_place: true })]).safety_plan_rate).toBe(100); });
    it("safety_plan_rate 0 when all false", () => { expect(computeForcedMarriageRiskMetrics([makeRow({ safety_plan_in_place: false })]).safety_plan_rate).toBe(0); });
    it("safety_plan_rate mixed calculates correctly", () => {
      const m = computeForcedMarriageRiskMetrics([
        makeRow({ safety_plan_in_place: true }),
        makeRow({ safety_plan_in_place: false }),
        makeRow({ safety_plan_in_place: true }),
      ]);
      expect(m.safety_plan_rate).toBe(66.7);
    });

    // multi_agency_rate
    it("multi_agency_rate 100 when all true", () => { expect(computeForcedMarriageRiskMetrics([makeRow({ multi_agency_referral: true })]).multi_agency_rate).toBe(100); });
    it("multi_agency_rate 0 when all false", () => { expect(computeForcedMarriageRiskMetrics([makeRow({ multi_agency_referral: false })]).multi_agency_rate).toBe(0); });
    it("multi_agency_rate mixed (1 of 3)", () => {
      const m = computeForcedMarriageRiskMetrics([
        makeRow({ multi_agency_referral: true }),
        makeRow({ multi_agency_referral: false }),
        makeRow({ multi_agency_referral: false }),
      ]);
      expect(m.multi_agency_rate).toBe(33.3);
    });

    // police_notification_rate
    it("police_notification_rate 100 when all true", () => { expect(computeForcedMarriageRiskMetrics([makeRow({ police_notified: true })]).police_notification_rate).toBe(100); });
    it("police_notification_rate 0 when all false", () => { expect(computeForcedMarriageRiskMetrics([makeRow({ police_notified: false })]).police_notification_rate).toBe(0); });
    it("police_notification_rate 50 for 1 of 2", () => {
      const m = computeForcedMarriageRiskMetrics([
        makeRow({ police_notified: true }),
        makeRow({ police_notified: false }),
      ]);
      expect(m.police_notification_rate).toBe(50);
    });

    // passport_secured_rate
    it("passport_secured_rate 100 when all true", () => { expect(computeForcedMarriageRiskMetrics([makeRow({ passport_secured: true })]).passport_secured_rate).toBe(100); });
    it("passport_secured_rate 0 when all false", () => { expect(computeForcedMarriageRiskMetrics([makeRow({ passport_secured: false })]).passport_secured_rate).toBe(0); });
    it("passport_secured_rate mixed (1 of 3)", () => {
      const m = computeForcedMarriageRiskMetrics([
        makeRow({ passport_secured: true }),
        makeRow({ passport_secured: false }),
        makeRow({ passport_secured: false }),
      ]);
      expect(m.passport_secured_rate).toBe(33.3);
    });
    it("passport_secured_rate 50 for 1 of 2", () => {
      const m = computeForcedMarriageRiskMetrics([
        makeRow({ passport_secured: true }),
        makeRow({ passport_secured: false }),
      ]);
      expect(m.passport_secured_rate).toBe(50);
    });

    // travel_restriction_rate
    it("travel_restriction_rate 100 when all true", () => { expect(computeForcedMarriageRiskMetrics([makeRow({ travel_restrictions: true })]).travel_restriction_rate).toBe(100); });
    it("travel_restriction_rate 0 when all false", () => { expect(computeForcedMarriageRiskMetrics([makeRow({ travel_restrictions: false })]).travel_restriction_rate).toBe(0); });
    it("travel_restriction_rate mixed (2 of 3)", () => {
      const m = computeForcedMarriageRiskMetrics([
        makeRow({ travel_restrictions: true }),
        makeRow({ travel_restrictions: true }),
        makeRow({ travel_restrictions: false }),
      ]);
      expect(m.travel_restriction_rate).toBe(66.7);
    });

    // review_scheduled_rate
    it("review_scheduled_rate 100 when all have review_date", () => {
      expect(computeForcedMarriageRiskMetrics([makeRow({ review_date: "2025-06-01" })]).review_scheduled_rate).toBe(100);
    });
    it("review_scheduled_rate 0 when none have review_date", () => {
      expect(computeForcedMarriageRiskMetrics([makeRow()]).review_scheduled_rate).toBe(0);
    });
    it("review_scheduled_rate mixed (1 of 2)", () => {
      const m = computeForcedMarriageRiskMetrics([
        makeRow({ review_date: "2025-06-01" }),
        makeRow(),
      ]);
      expect(m.review_scheduled_rate).toBe(50);
    });
    it("review_scheduled_rate 0 for empty", () => {
      expect(computeForcedMarriageRiskMetrics([]).review_scheduled_rate).toBe(0);
    });
    it("review_scheduled_rate 100 when all have review dates", () => {
      const m = computeForcedMarriageRiskMetrics([
        makeRow({ review_date: "2025-06-01" }),
        makeRow({ review_date: "2025-07-01" }),
      ]);
      expect(m.review_scheduled_rate).toBe(100);
    });

    // unique_children
    it("unique_children counts distinct child_name values", () => {
      const m = computeForcedMarriageRiskMetrics([
        makeRow({ child_name: "Alice" }),
        makeRow({ child_name: "Bob" }),
        makeRow({ child_name: "Alice" }),
      ]);
      expect(m.unique_children).toBe(2);
    });
    it("unique_children single child", () => { expect(computeForcedMarriageRiskMetrics([makeRow()]).unique_children).toBe(1); });
    it("unique_children 0 for empty", () => { expect(computeForcedMarriageRiskMetrics([]).unique_children).toBe(0); });
    it("unique_children with three distinct", () => {
      const m = computeForcedMarriageRiskMetrics([
        makeRow({ child_name: "A" }),
        makeRow({ child_name: "B" }),
        makeRow({ child_name: "C" }),
      ]);
      expect(m.unique_children).toBe(3);
    });

    // unique_assessors
    it("unique_assessors counts distinct assessor_name values", () => {
      const m = computeForcedMarriageRiskMetrics([
        makeRow({ assessor_name: "Jane" }),
        makeRow({ assessor_name: "Tom" }),
        makeRow({ assessor_name: "Jane" }),
      ]);
      expect(m.unique_assessors).toBe(2);
    });
    it("unique_assessors single assessor", () => { expect(computeForcedMarriageRiskMetrics([makeRow()]).unique_assessors).toBe(1); });
    it("unique_assessors 0 for empty", () => { expect(computeForcedMarriageRiskMetrics([]).unique_assessors).toBe(0); });
    it("unique_assessors with three distinct assessors", () => {
      const m = computeForcedMarriageRiskMetrics([
        makeRow({ assessor_name: "A" }),
        makeRow({ assessor_name: "B" }),
        makeRow({ assessor_name: "C" }),
      ]);
      expect(m.unique_assessors).toBe(3);
    });

    // Multiple rows aggregate
    it("multiple rows aggregate correctly", () => {
      const m = computeForcedMarriageRiskMetrics([
        makeRow({ risk_level: "High", safety_plan_in_place: true, fmpo_in_place: true, child_name: "A", assessor_name: "X" }),
        makeRow({ risk_level: "Immediate", safety_plan_in_place: false, fmpo_in_place: false, child_name: "B", assessor_name: "Y" }),
        makeRow({ risk_level: "Medium", safety_plan_in_place: true, fmpo_in_place: false, child_name: "A", assessor_name: "X" }),
        makeRow({ risk_level: "Low", safety_plan_in_place: false, fmpo_in_place: false, child_name: "C", assessor_name: "Z" }),
      ]);
      expect(m.total_assessments).toBe(4);
      expect(m.high_risk_count).toBe(2);
      expect(m.fmpo_count).toBe(1);
      expect(m.safety_plan_rate).toBe(50);
      expect(m.unique_children).toBe(3);
      expect(m.unique_assessors).toBe(3);
    });

    // specialist rate via boolRate
    it("specialist rate via boolRate returns 100 when all true", () => {
      // specialist_service_involved is not a named metric but goes through boolRate indirectly
      const m = computeForcedMarriageRiskMetrics([makeRow({ specialist_service_involved: true })]);
      expect(m.total_assessments).toBe(1);
    });

    // social_worker_notified rate (via boolRate pathway)
    it("social_worker_notified does not break metrics", () => {
      const m = computeForcedMarriageRiskMetrics([makeRow({ social_worker_notified: true })]);
      expect(m.total_assessments).toBe(1);
    });

    // Edge: all same child, different assessors
    it("all same child different assessors", () => {
      const m = computeForcedMarriageRiskMetrics([
        makeRow({ child_name: "X", assessor_name: "A1" }),
        makeRow({ child_name: "X", assessor_name: "A2" }),
        makeRow({ child_name: "X", assessor_name: "A3" }),
      ]);
      expect(m.unique_children).toBe(1);
      expect(m.unique_assessors).toBe(3);
    });

    // Edge: all same assessor, different children
    it("all same assessor different children", () => {
      const m = computeForcedMarriageRiskMetrics([
        makeRow({ child_name: "C1", assessor_name: "A" }),
        makeRow({ child_name: "C2", assessor_name: "A" }),
        makeRow({ child_name: "C3", assessor_name: "A" }),
      ]);
      expect(m.unique_children).toBe(3);
      expect(m.unique_assessors).toBe(1);
    });
  });

  // ── computeForcedMarriageRiskAlerts ──────────────────────────────────
  describe("computeForcedMarriageRiskAlerts", () => {
    it("returns empty for empty", () => { expect(computeForcedMarriageRiskAlerts([])).toEqual([]); });
    it("returns empty for clean rows", () => {
      expect(computeForcedMarriageRiskAlerts([makeRow({ risk_level: "No Identified Risk" })])).toEqual([]);
    });

    // Critical: immediate_risk_no_fmpo
    it("fires immediate_risk_no_fmpo for Immediate risk without FMPO", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "Immediate", fmpo_in_place: false, child_name: "Jo" })]);
      const f = a.find((x) => x.type === "immediate_risk_no_fmpo");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
      expect(f!.message).toContain("Jo");
      expect(f!.message).toContain("Immediate");
      expect(f!.message).toContain("FMPO");
      expect(f!.record_id).toBeDefined();
    });
    it("does not fire immediate_risk_no_fmpo when FMPO in place", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "Immediate", fmpo_in_place: true })]);
      expect(a.find((x) => x.type === "immediate_risk_no_fmpo")).toBeUndefined();
    });
    it("does not fire immediate_risk_no_fmpo for High risk", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "High", fmpo_in_place: false })]);
      expect(a.find((x) => x.type === "immediate_risk_no_fmpo")).toBeUndefined();
    });
    it("does not fire immediate_risk_no_fmpo for Medium risk", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "Medium", fmpo_in_place: false })]);
      expect(a.find((x) => x.type === "immediate_risk_no_fmpo")).toBeUndefined();
    });
    it("does not fire immediate_risk_no_fmpo for Low risk", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "Low", fmpo_in_place: false })]);
      expect(a.find((x) => x.type === "immediate_risk_no_fmpo")).toBeUndefined();
    });
    it("does not fire immediate_risk_no_fmpo for No Identified Risk", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "No Identified Risk", fmpo_in_place: false })]);
      expect(a.find((x) => x.type === "immediate_risk_no_fmpo")).toBeUndefined();
    });
    it("immediate_risk_no_fmpo fires per-record", () => {
      const a = computeForcedMarriageRiskAlerts([
        makeRow({ id: "a-1", risk_level: "Immediate", fmpo_in_place: false }),
        makeRow({ id: "a-2", risk_level: "Immediate", fmpo_in_place: false }),
      ]);
      expect(a.filter((x) => x.type === "immediate_risk_no_fmpo")).toHaveLength(2);
    });
    it("immediate_risk_no_fmpo includes record_id", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ id: "rec-1", risk_level: "Immediate", fmpo_in_place: false })]);
      expect(a.find((x) => x.type === "immediate_risk_no_fmpo")!.record_id).toBe("rec-1");
    });

    // Critical: high_risk_no_safety_plan
    it("fires high_risk_no_safety_plan for High risk without safety plan", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "High", safety_plan_in_place: false, child_name: "Sam" })]);
      const f = a.find((x) => x.type === "high_risk_no_safety_plan");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
      expect(f!.message).toContain("Sam");
      expect(f!.message).toContain("High");
      expect(f!.record_id).toBeDefined();
    });
    it("does not fire high_risk_no_safety_plan when safety plan in place", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "High", safety_plan_in_place: true })]);
      expect(a.find((x) => x.type === "high_risk_no_safety_plan")).toBeUndefined();
    });
    it("does not fire high_risk_no_safety_plan for Immediate risk", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "Immediate", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "high_risk_no_safety_plan")).toBeUndefined();
    });
    it("does not fire high_risk_no_safety_plan for Medium risk", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "Medium", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "high_risk_no_safety_plan")).toBeUndefined();
    });
    it("does not fire high_risk_no_safety_plan for Low risk", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "Low", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "high_risk_no_safety_plan")).toBeUndefined();
    });
    it("does not fire high_risk_no_safety_plan for No Identified Risk", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "No Identified Risk", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "high_risk_no_safety_plan")).toBeUndefined();
    });
    it("high_risk_no_safety_plan fires per-record", () => {
      const a = computeForcedMarriageRiskAlerts([
        makeRow({ id: "b-1", risk_level: "High", safety_plan_in_place: false }),
        makeRow({ id: "b-2", risk_level: "High", safety_plan_in_place: false }),
      ]);
      expect(a.filter((x) => x.type === "high_risk_no_safety_plan")).toHaveLength(2);
    });
    it("high_risk_no_safety_plan includes record_id", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ id: "rec-2", risk_level: "High", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "high_risk_no_safety_plan")!.record_id).toBe("rec-2");
    });

    // High: high_risk_no_fmu_contact
    it("fires high_risk_no_fmu_contact for High risk without FMU contact", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "High", forced_marriage_unit_contacted: false, child_name: "Amy" })]);
      const f = a.find((x) => x.type === "high_risk_no_fmu_contact");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("Amy");
      expect(f!.message).toContain("Forced Marriage Unit");
    });
    it("fires high_risk_no_fmu_contact for Immediate risk without FMU contact", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "Immediate", forced_marriage_unit_contacted: false })]);
      expect(a.find((x) => x.type === "high_risk_no_fmu_contact")).toBeDefined();
    });
    it("does not fire high_risk_no_fmu_contact when FMU contacted", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "High", forced_marriage_unit_contacted: true })]);
      expect(a.find((x) => x.type === "high_risk_no_fmu_contact")).toBeUndefined();
    });
    it("does not fire high_risk_no_fmu_contact for Medium risk", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "Medium", forced_marriage_unit_contacted: false })]);
      expect(a.find((x) => x.type === "high_risk_no_fmu_contact")).toBeUndefined();
    });
    it("does not fire high_risk_no_fmu_contact for Low risk", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "Low", forced_marriage_unit_contacted: false })]);
      expect(a.find((x) => x.type === "high_risk_no_fmu_contact")).toBeUndefined();
    });
    it("does not fire high_risk_no_fmu_contact for No Identified Risk", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "No Identified Risk", forced_marriage_unit_contacted: false })]);
      expect(a.find((x) => x.type === "high_risk_no_fmu_contact")).toBeUndefined();
    });
    it("high_risk_no_fmu_contact fires per-record", () => {
      const a = computeForcedMarriageRiskAlerts([
        makeRow({ id: "c-1", risk_level: "High", forced_marriage_unit_contacted: false }),
        makeRow({ id: "c-2", risk_level: "Immediate", forced_marriage_unit_contacted: false }),
      ]);
      expect(a.filter((x) => x.type === "high_risk_no_fmu_contact")).toHaveLength(2);
    });
    it("high_risk_no_fmu_contact includes record_id", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ id: "rec-3", risk_level: "High", forced_marriage_unit_contacted: false })]);
      expect(a.find((x) => x.type === "high_risk_no_fmu_contact")!.record_id).toBe("rec-3");
    });
    it("high_risk_no_fmu_contact message contains risk level", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "High", forced_marriage_unit_contacted: false })]);
      expect(a.find((x) => x.type === "high_risk_no_fmu_contact")!.message).toContain("High");
    });
    it("high_risk_no_fmu_contact message for Immediate contains Immediate", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "Immediate", forced_marriage_unit_contacted: false })]);
      expect(a.find((x) => x.type === "high_risk_no_fmu_contact")!.message).toContain("Immediate");
    });

    // Medium: risk_no_multi_agency_referral
    it("fires risk_no_multi_agency_referral for Low risk without referral", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "Low", multi_agency_referral: false, child_name: "Kai" })]);
      const f = a.find((x) => x.type === "risk_no_multi_agency_referral");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("medium");
      expect(f!.message).toContain("Kai");
    });
    it("fires risk_no_multi_agency_referral for Medium risk without referral", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "Medium", multi_agency_referral: false })]);
      expect(a.find((x) => x.type === "risk_no_multi_agency_referral")).toBeDefined();
    });
    it("fires risk_no_multi_agency_referral for High risk without referral", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "High", multi_agency_referral: false })]);
      expect(a.find((x) => x.type === "risk_no_multi_agency_referral")).toBeDefined();
    });
    it("fires risk_no_multi_agency_referral for Immediate risk without referral", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "Immediate", multi_agency_referral: false })]);
      expect(a.find((x) => x.type === "risk_no_multi_agency_referral")).toBeDefined();
    });
    it("does not fire risk_no_multi_agency_referral for No Identified Risk", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "No Identified Risk", multi_agency_referral: false })]);
      expect(a.find((x) => x.type === "risk_no_multi_agency_referral")).toBeUndefined();
    });
    it("does not fire risk_no_multi_agency_referral when referral made", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "High", multi_agency_referral: true })]);
      expect(a.find((x) => x.type === "risk_no_multi_agency_referral")).toBeUndefined();
    });
    it("risk_no_multi_agency_referral fires per-record", () => {
      const a = computeForcedMarriageRiskAlerts([
        makeRow({ id: "d-1", risk_level: "Medium", multi_agency_referral: false }),
        makeRow({ id: "d-2", risk_level: "High", multi_agency_referral: false }),
      ]);
      expect(a.filter((x) => x.type === "risk_no_multi_agency_referral")).toHaveLength(2);
    });
    it("risk_no_multi_agency_referral includes record_id", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ id: "rec-4", risk_level: "Low", multi_agency_referral: false })]);
      expect(a.find((x) => x.type === "risk_no_multi_agency_referral")!.record_id).toBe("rec-4");
    });
    it("risk_no_multi_agency_referral message contains risk level", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "Medium", multi_agency_referral: false })]);
      expect(a.find((x) => x.type === "risk_no_multi_agency_referral")!.message).toContain("Medium");
    });

    // Multiple alerts simultaneously
    it("fires multiple alert types simultaneously", () => {
      const a = computeForcedMarriageRiskAlerts([
        makeRow({
          risk_level: "Immediate",
          fmpo_in_place: false,
          forced_marriage_unit_contacted: false,
          multi_agency_referral: false,
        }),
      ]);
      const types = a.map((x) => x.type);
      expect(types).toContain("immediate_risk_no_fmpo");
      expect(types).toContain("high_risk_no_fmu_contact");
      expect(types).toContain("risk_no_multi_agency_referral");
    });
    it("fires both critical types when High risk no safety plan and Immediate no FMPO exist", () => {
      const a = computeForcedMarriageRiskAlerts([
        makeRow({ risk_level: "High", safety_plan_in_place: false, multi_agency_referral: true, forced_marriage_unit_contacted: true }),
        makeRow({ risk_level: "Immediate", fmpo_in_place: false, multi_agency_referral: true, forced_marriage_unit_contacted: true }),
      ]);
      const types = a.map((x) => x.type);
      expect(types).toContain("high_risk_no_safety_plan");
      expect(types).toContain("immediate_risk_no_fmpo");
    });
    it("does not fire alerts for well-managed No Identified Risk row", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({
        risk_level: "No Identified Risk",
        fmpo_in_place: true,
        safety_plan_in_place: true,
        multi_agency_referral: true,
        forced_marriage_unit_contacted: true,
      })]);
      expect(a).toEqual([]);
    });
    it("does not fire high_risk_no_safety_plan for Immediate (only High)", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "Immediate", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "high_risk_no_safety_plan")).toBeUndefined();
    });
    it("critical alerts have severity critical", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "Immediate", fmpo_in_place: false })]);
      const critical = a.filter((x) => x.severity === "critical");
      expect(critical.length).toBeGreaterThan(0);
    });
    it("high alerts have severity high", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "High", forced_marriage_unit_contacted: false })]);
      const high = a.filter((x) => x.severity === "high");
      expect(high.length).toBeGreaterThan(0);
    });
    it("medium alerts have severity medium", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({ risk_level: "Low", multi_agency_referral: false })]);
      const medium = a.filter((x) => x.severity === "medium");
      expect(medium.length).toBeGreaterThan(0);
    });
    it("all alerts have a type string", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({
        risk_level: "Immediate",
        fmpo_in_place: false,
        forced_marriage_unit_contacted: false,
        multi_agency_referral: false,
      })]);
      for (const alert of a) expect(typeof alert.type).toBe("string");
    });
    it("all alerts have a message string", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({
        risk_level: "High",
        safety_plan_in_place: false,
        forced_marriage_unit_contacted: false,
        multi_agency_referral: false,
      })]);
      for (const alert of a) expect(typeof alert.message).toBe("string");
    });
    it("all alerts have a severity", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({
        risk_level: "High",
        safety_plan_in_place: false,
        forced_marriage_unit_contacted: false,
        multi_agency_referral: false,
      })]);
      for (const alert of a) expect(["critical", "high", "medium"]).toContain(alert.severity);
    });
    it("Immediate with all protections in place fires no critical alerts", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({
        risk_level: "Immediate",
        fmpo_in_place: true,
        forced_marriage_unit_contacted: true,
        multi_agency_referral: true,
        safety_plan_in_place: true,
      })]);
      expect(a.filter((x) => x.severity === "critical")).toHaveLength(0);
    });
    it("High with all protections in place fires no alerts", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({
        risk_level: "High",
        fmpo_in_place: true,
        forced_marriage_unit_contacted: true,
        multi_agency_referral: true,
        safety_plan_in_place: true,
      })]);
      expect(a).toHaveLength(0);
    });
    it("Low risk with only multi_agency_referral false fires exactly one alert", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({
        risk_level: "Low",
        multi_agency_referral: false,
        fmpo_in_place: true,
        forced_marriage_unit_contacted: true,
        safety_plan_in_place: true,
      })]);
      expect(a).toHaveLength(1);
      expect(a[0].type).toBe("risk_no_multi_agency_referral");
    });
    it("Medium risk with only multi_agency_referral false fires exactly one alert", () => {
      const a = computeForcedMarriageRiskAlerts([makeRow({
        risk_level: "Medium",
        multi_agency_referral: false,
        fmpo_in_place: true,
        forced_marriage_unit_contacted: true,
        safety_plan_in_place: true,
      })]);
      expect(a).toHaveLength(1);
    });
  });

  // ── generateForcedMarriageRiskCaraInsights ────────────────────────────
  describe("generateForcedMarriageRiskCaraInsights", () => {
    it("returns 3 insights for empty data", () => {
      const insights = generateForcedMarriageRiskCaraInsights([]);
      expect(insights).toHaveLength(3);
    });
    it("returns 3 insights for populated data", () => {
      const insights = generateForcedMarriageRiskCaraInsights([makeRow(), makeRow()]);
      expect(insights).toHaveLength(3);
    });
    it("insight 1 starts with [red]", () => {
      expect(generateForcedMarriageRiskCaraInsights([])[0]).toMatch(/^\[red\]/);
    });
    it("insight 2 starts with [amber]", () => {
      expect(generateForcedMarriageRiskCaraInsights([])[1]).toMatch(/^\[amber\]/);
    });
    it("insight 3 starts with [reflect]", () => {
      expect(generateForcedMarriageRiskCaraInsights([])[2]).toMatch(/^\[reflect\]/);
    });
    it("insight 1 contains total assessments count", () => {
      const insights = generateForcedMarriageRiskCaraInsights([makeRow(), makeRow()]);
      expect(insights[0]).toContain("2 forced marriage risk assessments");
    });
    it("insight 1 uses singular assessment for 1", () => {
      const insights = generateForcedMarriageRiskCaraInsights([makeRow()]);
      expect(insights[0]).toContain("1 forced marriage risk assessment ");
    });
    it("insight 1 contains unique children count", () => {
      const insights = generateForcedMarriageRiskCaraInsights([makeRow({ child_name: "A" }), makeRow({ child_name: "B" })]);
      expect(insights[0]).toContain("2 children");
    });
    it("insight 1 uses singular child for 1", () => {
      const insights = generateForcedMarriageRiskCaraInsights([makeRow()]);
      expect(insights[0]).toContain("1 child");
    });
    it("insight 1 contains high risk count", () => {
      const insights = generateForcedMarriageRiskCaraInsights([
        makeRow({ risk_level: "High" }),
        makeRow({ risk_level: "Immediate" }),
      ]);
      expect(insights[0]).toContain("2 at High or Immediate risk level");
    });
    it("insight 1 contains FMPO count", () => {
      const insights = generateForcedMarriageRiskCaraInsights([makeRow({ fmpo_in_place: true })]);
      expect(insights[0]).toContain("1 FMPO in place");
    });
    it("insight 1 uses plural FMPOs for multiple", () => {
      const insights = generateForcedMarriageRiskCaraInsights([
        makeRow({ fmpo_in_place: true }),
        makeRow({ fmpo_in_place: true }),
      ]);
      expect(insights[0]).toContain("2 FMPOs in place");
    });
    it("insight 1 contains FMU contact count", () => {
      const insights = generateForcedMarriageRiskCaraInsights([makeRow({ forced_marriage_unit_contacted: true })]);
      expect(insights[0]).toContain("1 Forced Marriage Unit contact made");
    });
    it("insight 1 uses plural contacts for multiple", () => {
      const insights = generateForcedMarriageRiskCaraInsights([
        makeRow({ forced_marriage_unit_contacted: true }),
        makeRow({ forced_marriage_unit_contacted: true }),
      ]);
      expect(insights[0]).toContain("2 Forced Marriage Unit contacts made");
    });
    it("insight 2 mentions critical and high alert counts when present", () => {
      const rows = [
        makeRow({ risk_level: "Immediate", fmpo_in_place: false, forced_marriage_unit_contacted: false }),
      ];
      const insights = generateForcedMarriageRiskCaraInsights(rows);
      expect(insights[1]).toContain("critical");
      expect(insights[1]).toContain("high-priority");
    });
    it("insight 2 shows no concerns when none", () => {
      const insights = generateForcedMarriageRiskCaraInsights([makeRow({ risk_level: "No Identified Risk" })]);
      expect(insights[1]).toContain("No critical or high-priority concerns");
    });
    it("insight 2 contains safety plan rate", () => {
      const insights = generateForcedMarriageRiskCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Safety plan rate");
    });
    it("insight 2 contains multi-agency rate", () => {
      const insights = generateForcedMarriageRiskCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Multi-agency rate");
    });
    it("insight 2 contains passport secured rate", () => {
      const insights = generateForcedMarriageRiskCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Passport secured rate");
    });
    it("insight 3 contains reflective question about forced marriage risk assessments", () => {
      const insights = generateForcedMarriageRiskCaraInsights([]);
      expect(insights[2]).toContain("forced marriage risk assessments");
    });
    it("insight 3 mentions multi-agency", () => {
      const insights = generateForcedMarriageRiskCaraInsights([]);
      expect(insights[2]).toContain("multi-agency");
    });
    it("insight 3 mentions Forced Marriage Unit", () => {
      const insights = generateForcedMarriageRiskCaraInsights([]);
      expect(insights[2]).toContain("Forced Marriage Unit");
    });
    it("insight 3 mentions travel restrictions", () => {
      const insights = generateForcedMarriageRiskCaraInsights([]);
      expect(insights[2]).toContain("travel restrictions");
    });
    it("insight 3 mentions passport security", () => {
      const insights = generateForcedMarriageRiskCaraInsights([]);
      expect(insights[2]).toContain("passport security");
    });
    it("insight 3 mentions specialist service", () => {
      const insights = generateForcedMarriageRiskCaraInsights([]);
      expect(insights[2]).toContain("specialist service");
    });
    it("all insights are strings", () => {
      const insights = generateForcedMarriageRiskCaraInsights([makeRow()]);
      for (const i of insights) expect(typeof i).toBe("string");
    });
    it("empty array still produces meaningful content", () => {
      const insights = generateForcedMarriageRiskCaraInsights([]);
      expect(insights[0]).toContain("0 forced marriage risk assessments");
      expect(insights[0]).toContain("0 children");
    });
    it("insight 1 for zero assessments shows 0 at High or Immediate", () => {
      const insights = generateForcedMarriageRiskCaraInsights([]);
      expect(insights[0]).toContain("0 at High or Immediate risk level");
    });
    it("insight 1 for zero assessments shows 0 FMPOs", () => {
      const insights = generateForcedMarriageRiskCaraInsights([]);
      expect(insights[0]).toContain("0 FMPOs in place");
    });
    it("insight 1 for zero assessments shows 0 FMU contacts", () => {
      const insights = generateForcedMarriageRiskCaraInsights([]);
      expect(insights[0]).toContain("0 Forced Marriage Unit contacts made");
    });
    it("insight 2 with only medium alerts shows no critical or high", () => {
      const rows = [makeRow({ risk_level: "Low", multi_agency_referral: false })];
      const insights = generateForcedMarriageRiskCaraInsights(rows);
      expect(insights[1]).toContain("No critical or high-priority concerns");
    });
    it("insight 2 with critical alerts shows count", () => {
      const rows = [makeRow({ risk_level: "Immediate", fmpo_in_place: false })];
      const insights = generateForcedMarriageRiskCaraInsights(rows);
      expect(insights[1]).toMatch(/1 critical/);
    });
    it("insight 2 with high alerts shows count", () => {
      const rows = [makeRow({ risk_level: "High", forced_marriage_unit_contacted: false })];
      const insights = generateForcedMarriageRiskCaraInsights(rows);
      expect(insights[1]).toMatch(/1 high-priority/);
    });
    it("insight 2 safety plan rate value is correct", () => {
      const insights = generateForcedMarriageRiskCaraInsights([makeRow({ safety_plan_in_place: true })]);
      expect(insights[1]).toContain("100%");
    });
    it("insight 3 is a reflective question", () => {
      const insights = generateForcedMarriageRiskCaraInsights([]);
      expect(insights[2]).toContain("?");
    });
    it("insight 2 with multiple critical alerts shows correct count", () => {
      const rows = [
        makeRow({ risk_level: "Immediate", fmpo_in_place: false }),
        makeRow({ risk_level: "High", safety_plan_in_place: false }),
      ];
      const insights = generateForcedMarriageRiskCaraInsights(rows);
      expect(insights[1]).toMatch(/2 critical/);
    });
    it("insight 2 with multiple high alerts shows correct count", () => {
      const rows = [
        makeRow({ risk_level: "High", forced_marriage_unit_contacted: false }),
        makeRow({ risk_level: "Immediate", forced_marriage_unit_contacted: false, fmpo_in_place: true }),
      ];
      const insights = generateForcedMarriageRiskCaraInsights(rows);
      expect(insights[1]).toMatch(/2 high-priority/);
    });
    it("insight 1 with single FMPO uses singular", () => {
      const insights = generateForcedMarriageRiskCaraInsights([makeRow({ fmpo_in_place: true })]);
      expect(insights[0]).toContain("1 FMPO in place");
      expect(insights[0]).not.toContain("1 FMPOs");
    });
    it("insight 1 with single FMU contact uses singular", () => {
      const insights = generateForcedMarriageRiskCaraInsights([makeRow({ forced_marriage_unit_contacted: true })]);
      expect(insights[0]).toContain("1 Forced Marriage Unit contact made");
      expect(insights[0]).not.toContain("1 Forced Marriage Unit contacts");
    });
  });
});
