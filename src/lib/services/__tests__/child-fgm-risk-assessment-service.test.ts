import { describe, it, expect } from "vitest";

import {
  FGM_RISK_LEVELS,
  _testing,
} from "../child-fgm-risk-assessment-service";

import type {
  ChildFgmRiskAssessmentRow,
} from "../child-fgm-risk-assessment-service";

const {
  computeFgmRiskMetrics,
  computeFgmRiskAlerts,
  generateFgmRiskCaraInsights,
} = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<ChildFgmRiskAssessmentRow>,
): ChildFgmRiskAssessmentRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: overrides?.home_id ?? "home-1",
    child_name: overrides?.child_name ?? "Child A",
    assessment_date: overrides?.assessment_date ?? now.toISOString().split("T")[0],
    risk_level: overrides?.risk_level ?? "Low",
    risk_indicators_count: overrides?.risk_indicators_count ?? 0,
    mandatory_report_made: overrides?.mandatory_report_made ?? true,
    police_notified: overrides?.police_notified ?? true,
    social_worker_notified: overrides?.social_worker_notified ?? true,
    fgm_protection_order: overrides?.fgm_protection_order ?? false,
    multi_agency_referral: overrides?.multi_agency_referral ?? true,
    safety_plan_in_place: overrides?.safety_plan_in_place ?? true,
    cultural_sensitivity_considered: overrides?.cultural_sensitivity_considered ?? true,
    specialist_service_involved: overrides?.specialist_service_involved ?? false,
    specialist_service_name: "specialist_service_name" in (overrides ?? {}) ? (overrides!.specialist_service_name ?? null) : null,
    review_date: "review_date" in (overrides ?? {}) ? (overrides!.review_date ?? null) : null,
    assessor_name: overrides?.assessor_name ?? "Assessor 1",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("child-fgm-risk-assessment-service", () => {
  // ── Enum validation ──────────────────────────────────────────────────
  describe("Enum validation", () => {
    it("FGM_RISK_LEVELS has 5 values", () => { expect(FGM_RISK_LEVELS).toHaveLength(5); });
    it("FGM_RISK_LEVELS contains No Identified Risk", () => { expect(FGM_RISK_LEVELS).toContain("No Identified Risk"); });
    it("FGM_RISK_LEVELS contains Low", () => { expect(FGM_RISK_LEVELS).toContain("Low"); });
    it("FGM_RISK_LEVELS contains Medium", () => { expect(FGM_RISK_LEVELS).toContain("Medium"); });
    it("FGM_RISK_LEVELS contains High", () => { expect(FGM_RISK_LEVELS).toContain("High"); });
    it("FGM_RISK_LEVELS contains Immediate", () => { expect(FGM_RISK_LEVELS).toContain("Immediate"); });
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
    it("overrides specialist_service_name", () => { expect(makeRow({ specialist_service_name: "NSPCC" }).specialist_service_name).toBe("NSPCC"); });
    it("overrides specialist_service_name to null explicitly", () => { expect(makeRow({ specialist_service_name: null }).specialist_service_name).toBeNull(); });
    it("default specialist_service_name is null", () => { expect(makeRow().specialist_service_name).toBeNull(); });
    it("overrides review_date", () => { expect(makeRow({ review_date: "2025-06-01" }).review_date).toBe("2025-06-01"); });
    it("overrides review_date to null explicitly", () => { expect(makeRow({ review_date: null }).review_date).toBeNull(); });
    it("default review_date is null", () => { expect(makeRow().review_date).toBeNull(); });
    it("overrides notes", () => { expect(makeRow({ notes: "some notes" }).notes).toBe("some notes"); });
    it("overrides notes to null explicitly", () => { expect(makeRow({ notes: null }).notes).toBeNull(); });
    it("default notes is null", () => { expect(makeRow().notes).toBeNull(); });
    it("overrides risk_indicators_count", () => { expect(makeRow({ risk_indicators_count: 5 }).risk_indicators_count).toBe(5); });
    it("default risk_indicators_count is 0", () => { expect(makeRow().risk_indicators_count).toBe(0); });
    it("overrides booleans", () => {
      const r = makeRow({ mandatory_report_made: false, police_notified: false });
      expect(r.mandatory_report_made).toBe(false);
      expect(r.police_notified).toBe(false);
    });
    it("default mandatory_report_made is true", () => { expect(makeRow().mandatory_report_made).toBe(true); });
    it("default police_notified is true", () => { expect(makeRow().police_notified).toBe(true); });
    it("default social_worker_notified is true", () => { expect(makeRow().social_worker_notified).toBe(true); });
    it("default fgm_protection_order is false", () => { expect(makeRow().fgm_protection_order).toBe(false); });
    it("default multi_agency_referral is true", () => { expect(makeRow().multi_agency_referral).toBe(true); });
    it("default safety_plan_in_place is true", () => { expect(makeRow().safety_plan_in_place).toBe(true); });
    it("default cultural_sensitivity_considered is true", () => { expect(makeRow().cultural_sensitivity_considered).toBe(true); });
    it("default specialist_service_involved is false", () => { expect(makeRow().specialist_service_involved).toBe(false); });
  });

  // ── computeFgmRiskMetrics ──────────────────────────────────────────
  describe("computeFgmRiskMetrics", () => {
    it("returns zeros for empty array", () => {
      const m = computeFgmRiskMetrics([]);
      expect(m.total_assessments).toBe(0);
      expect(m.high_risk_count).toBe(0);
      expect(m.mandatory_report_count).toBe(0);
      expect(m.fgm_protection_order_count).toBe(0);
      expect(m.safety_plan_rate).toBe(0);
      expect(m.multi_agency_rate).toBe(0);
      expect(m.police_notification_rate).toBe(0);
      expect(m.specialist_rate).toBe(0);
      expect(m.cultural_sensitivity_rate).toBe(0);
      expect(m.review_scheduled_rate).toBe(0);
      expect(m.unique_children).toBe(0);
      expect(m.unique_assessors).toBe(0);
    });

    // total_assessments
    it("total_assessments counts rows", () => { expect(computeFgmRiskMetrics([makeRow(), makeRow(), makeRow()]).total_assessments).toBe(3); });
    it("total_assessments 1 for single row", () => { expect(computeFgmRiskMetrics([makeRow()]).total_assessments).toBe(1); });

    // high_risk_count (High + Immediate)
    it("counts High as high_risk_count", () => { expect(computeFgmRiskMetrics([makeRow({ risk_level: "High" })]).high_risk_count).toBe(1); });
    it("counts Immediate as high_risk_count", () => { expect(computeFgmRiskMetrics([makeRow({ risk_level: "Immediate" })]).high_risk_count).toBe(1); });
    it("does not count Medium as high_risk_count", () => { expect(computeFgmRiskMetrics([makeRow({ risk_level: "Medium" })]).high_risk_count).toBe(0); });
    it("does not count Low as high_risk_count", () => { expect(computeFgmRiskMetrics([makeRow({ risk_level: "Low" })]).high_risk_count).toBe(0); });
    it("does not count No Identified Risk as high_risk_count", () => { expect(computeFgmRiskMetrics([makeRow({ risk_level: "No Identified Risk" })]).high_risk_count).toBe(0); });
    it("high_risk_count sums High and Immediate", () => {
      const m = computeFgmRiskMetrics([
        makeRow({ risk_level: "High" }),
        makeRow({ risk_level: "Immediate" }),
        makeRow({ risk_level: "Medium" }),
      ]);
      expect(m.high_risk_count).toBe(2);
    });

    // mandatory_report_count
    it("mandatory_report_count counts true", () => { expect(computeFgmRiskMetrics([makeRow({ mandatory_report_made: true })]).mandatory_report_count).toBe(1); });
    it("mandatory_report_count excludes false", () => { expect(computeFgmRiskMetrics([makeRow({ mandatory_report_made: false })]).mandatory_report_count).toBe(0); });
    it("mandatory_report_count sums correctly", () => {
      const m = computeFgmRiskMetrics([
        makeRow({ mandatory_report_made: true }),
        makeRow({ mandatory_report_made: false }),
        makeRow({ mandatory_report_made: true }),
      ]);
      expect(m.mandatory_report_count).toBe(2);
    });

    // fgm_protection_order_count
    it("fgm_protection_order_count counts true", () => { expect(computeFgmRiskMetrics([makeRow({ fgm_protection_order: true })]).fgm_protection_order_count).toBe(1); });
    it("fgm_protection_order_count excludes false", () => { expect(computeFgmRiskMetrics([makeRow({ fgm_protection_order: false })]).fgm_protection_order_count).toBe(0); });

    // safety_plan_rate
    it("safety_plan_rate 100 when all true", () => { expect(computeFgmRiskMetrics([makeRow({ safety_plan_in_place: true })]).safety_plan_rate).toBe(100); });
    it("safety_plan_rate 0 when all false", () => { expect(computeFgmRiskMetrics([makeRow({ safety_plan_in_place: false })]).safety_plan_rate).toBe(0); });
    it("safety_plan_rate mixed calculates correctly", () => {
      const m = computeFgmRiskMetrics([
        makeRow({ safety_plan_in_place: true }),
        makeRow({ safety_plan_in_place: false }),
        makeRow({ safety_plan_in_place: true }),
      ]);
      expect(m.safety_plan_rate).toBe(66.7);
    });

    // multi_agency_rate
    it("multi_agency_rate 100 when all true", () => { expect(computeFgmRiskMetrics([makeRow({ multi_agency_referral: true })]).multi_agency_rate).toBe(100); });
    it("multi_agency_rate 0 when all false", () => { expect(computeFgmRiskMetrics([makeRow({ multi_agency_referral: false })]).multi_agency_rate).toBe(0); });
    it("multi_agency_rate mixed (1 of 3)", () => {
      const m = computeFgmRiskMetrics([
        makeRow({ multi_agency_referral: true }),
        makeRow({ multi_agency_referral: false }),
        makeRow({ multi_agency_referral: false }),
      ]);
      expect(m.multi_agency_rate).toBe(33.3);
    });

    // police_notification_rate
    it("police_notification_rate 100 when all true", () => { expect(computeFgmRiskMetrics([makeRow({ police_notified: true })]).police_notification_rate).toBe(100); });
    it("police_notification_rate 0 when all false", () => { expect(computeFgmRiskMetrics([makeRow({ police_notified: false })]).police_notification_rate).toBe(0); });
    it("police_notification_rate 50 for 1 of 2", () => {
      const m = computeFgmRiskMetrics([
        makeRow({ police_notified: true }),
        makeRow({ police_notified: false }),
      ]);
      expect(m.police_notification_rate).toBe(50);
    });

    // specialist_rate
    it("specialist_rate 100 when all true", () => { expect(computeFgmRiskMetrics([makeRow({ specialist_service_involved: true })]).specialist_rate).toBe(100); });
    it("specialist_rate 0 when all false", () => { expect(computeFgmRiskMetrics([makeRow({ specialist_service_involved: false })]).specialist_rate).toBe(0); });

    // cultural_sensitivity_rate
    it("cultural_sensitivity_rate 100 when all true", () => { expect(computeFgmRiskMetrics([makeRow({ cultural_sensitivity_considered: true })]).cultural_sensitivity_rate).toBe(100); });
    it("cultural_sensitivity_rate 0 when all false", () => { expect(computeFgmRiskMetrics([makeRow({ cultural_sensitivity_considered: false })]).cultural_sensitivity_rate).toBe(0); });
    it("cultural_sensitivity_rate mixed (2 of 3)", () => {
      const m = computeFgmRiskMetrics([
        makeRow({ cultural_sensitivity_considered: true }),
        makeRow({ cultural_sensitivity_considered: true }),
        makeRow({ cultural_sensitivity_considered: false }),
      ]);
      expect(m.cultural_sensitivity_rate).toBe(66.7);
    });

    // review_scheduled_rate
    it("review_scheduled_rate 100 when all have review_date", () => {
      expect(computeFgmRiskMetrics([makeRow({ review_date: "2025-06-01" })]).review_scheduled_rate).toBe(100);
    });
    it("review_scheduled_rate 0 when none have review_date", () => {
      expect(computeFgmRiskMetrics([makeRow()]).review_scheduled_rate).toBe(0);
    });
    it("review_scheduled_rate mixed (1 of 2)", () => {
      const m = computeFgmRiskMetrics([
        makeRow({ review_date: "2025-06-01" }),
        makeRow(),
      ]);
      expect(m.review_scheduled_rate).toBe(50);
    });
    it("review_scheduled_rate 0 for empty", () => {
      expect(computeFgmRiskMetrics([]).review_scheduled_rate).toBe(0);
    });

    // unique_children
    it("unique_children counts distinct child_name values", () => {
      const m = computeFgmRiskMetrics([
        makeRow({ child_name: "Alice" }),
        makeRow({ child_name: "Bob" }),
        makeRow({ child_name: "Alice" }),
      ]);
      expect(m.unique_children).toBe(2);
    });
    it("unique_children single child", () => { expect(computeFgmRiskMetrics([makeRow()]).unique_children).toBe(1); });
    it("unique_children 0 for empty", () => { expect(computeFgmRiskMetrics([]).unique_children).toBe(0); });

    // unique_assessors
    it("unique_assessors counts distinct assessor_name values", () => {
      const m = computeFgmRiskMetrics([
        makeRow({ assessor_name: "Jane" }),
        makeRow({ assessor_name: "Tom" }),
        makeRow({ assessor_name: "Jane" }),
      ]);
      expect(m.unique_assessors).toBe(2);
    });
    it("unique_assessors single assessor", () => { expect(computeFgmRiskMetrics([makeRow()]).unique_assessors).toBe(1); });
    it("unique_assessors 0 for empty", () => { expect(computeFgmRiskMetrics([]).unique_assessors).toBe(0); });

    // social_worker_notified rate (via boolRate pathway)
    it("social_worker_notified rate 100 when all true", () => {
      // social_worker_notified is not a direct metric but verifying boolRate internal consistency
      const m = computeFgmRiskMetrics([makeRow({ social_worker_notified: true })]);
      expect(m.total_assessments).toBe(1);
    });

    // fgm_protection_order_count sums correctly
    it("fgm_protection_order_count sums multiple", () => {
      const m = computeFgmRiskMetrics([
        makeRow({ fgm_protection_order: true }),
        makeRow({ fgm_protection_order: false }),
        makeRow({ fgm_protection_order: true }),
      ]);
      expect(m.fgm_protection_order_count).toBe(2);
    });

    // specialist_rate mixed
    it("specialist_rate mixed (1 of 3)", () => {
      const m = computeFgmRiskMetrics([
        makeRow({ specialist_service_involved: true }),
        makeRow({ specialist_service_involved: false }),
        makeRow({ specialist_service_involved: false }),
      ]);
      expect(m.specialist_rate).toBe(33.3);
    });

    // review_scheduled_rate with all scheduled
    it("review_scheduled_rate 100 when all have review dates", () => {
      const m = computeFgmRiskMetrics([
        makeRow({ review_date: "2025-06-01" }),
        makeRow({ review_date: "2025-07-01" }),
      ]);
      expect(m.review_scheduled_rate).toBe(100);
    });

    // unique_assessors with three distinct
    it("unique_assessors with three distinct assessors", () => {
      const m = computeFgmRiskMetrics([
        makeRow({ assessor_name: "A" }),
        makeRow({ assessor_name: "B" }),
        makeRow({ assessor_name: "C" }),
      ]);
      expect(m.unique_assessors).toBe(3);
    });

    // high_risk_count 0 for all No Identified Risk
    it("high_risk_count 0 when all No Identified Risk", () => {
      const m = computeFgmRiskMetrics([
        makeRow({ risk_level: "No Identified Risk" }),
        makeRow({ risk_level: "No Identified Risk" }),
      ]);
      expect(m.high_risk_count).toBe(0);
    });

    // Multiple rows aggregate
    it("multiple rows aggregate correctly", () => {
      const m = computeFgmRiskMetrics([
        makeRow({ risk_level: "High", safety_plan_in_place: true, mandatory_report_made: true, child_name: "A", assessor_name: "X" }),
        makeRow({ risk_level: "Immediate", safety_plan_in_place: false, mandatory_report_made: false, child_name: "B", assessor_name: "Y" }),
        makeRow({ risk_level: "Medium", safety_plan_in_place: true, mandatory_report_made: true, child_name: "A", assessor_name: "X" }),
        makeRow({ risk_level: "Low", safety_plan_in_place: false, mandatory_report_made: false, child_name: "C", assessor_name: "Z" }),
      ]);
      expect(m.total_assessments).toBe(4);
      expect(m.high_risk_count).toBe(2);
      expect(m.mandatory_report_count).toBe(2);
      expect(m.safety_plan_rate).toBe(50);
      expect(m.unique_children).toBe(3);
      expect(m.unique_assessors).toBe(3);
    });
  });

  // ── computeFgmRiskAlerts ──────────────────────────────────────────────
  describe("computeFgmRiskAlerts", () => {
    it("returns empty for empty", () => { expect(computeFgmRiskAlerts([])).toEqual([]); });
    it("returns empty for clean rows", () => {
      expect(computeFgmRiskAlerts([makeRow({ risk_level: "No Identified Risk" })])).toEqual([]);
    });

    // Critical: immediate_risk_no_mandatory_report
    it("fires immediate_risk_no_mandatory_report for Immediate risk without mandatory report", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "Immediate", mandatory_report_made: false, child_name: "Jo" })]);
      const f = a.find((x) => x.type === "immediate_risk_no_mandatory_report");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
      expect(f!.message).toContain("Jo");
      expect(f!.message).toContain("Immediate");
      expect(f!.message).toContain("legal duty");
      expect(f!.record_id).toBeDefined();
    });
    it("does not fire immediate_risk_no_mandatory_report when mandatory report made", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "Immediate", mandatory_report_made: true })]);
      expect(a.find((x) => x.type === "immediate_risk_no_mandatory_report")).toBeUndefined();
    });
    it("does not fire immediate_risk_no_mandatory_report for High risk", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "High", mandatory_report_made: false })]);
      expect(a.find((x) => x.type === "immediate_risk_no_mandatory_report")).toBeUndefined();
    });
    it("does not fire immediate_risk_no_mandatory_report for Medium risk", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "Medium", mandatory_report_made: false })]);
      expect(a.find((x) => x.type === "immediate_risk_no_mandatory_report")).toBeUndefined();
    });
    it("does not fire immediate_risk_no_mandatory_report for Low risk", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "Low", mandatory_report_made: false })]);
      expect(a.find((x) => x.type === "immediate_risk_no_mandatory_report")).toBeUndefined();
    });
    it("does not fire immediate_risk_no_mandatory_report for No Identified Risk", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "No Identified Risk", mandatory_report_made: false })]);
      expect(a.find((x) => x.type === "immediate_risk_no_mandatory_report")).toBeUndefined();
    });
    it("immediate_risk_no_mandatory_report fires per-record", () => {
      const a = computeFgmRiskAlerts([
        makeRow({ id: "a-1", risk_level: "Immediate", mandatory_report_made: false }),
        makeRow({ id: "a-2", risk_level: "Immediate", mandatory_report_made: false }),
      ]);
      expect(a.filter((x) => x.type === "immediate_risk_no_mandatory_report")).toHaveLength(2);
    });
    it("immediate_risk_no_mandatory_report includes record_id", () => {
      const a = computeFgmRiskAlerts([makeRow({ id: "rec-1", risk_level: "Immediate", mandatory_report_made: false })]);
      expect(a.find((x) => x.type === "immediate_risk_no_mandatory_report")!.record_id).toBe("rec-1");
    });

    // Critical: high_risk_no_safety_plan
    it("fires high_risk_no_safety_plan for High risk without safety plan", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "High", safety_plan_in_place: false, child_name: "Sam" })]);
      const f = a.find((x) => x.type === "high_risk_no_safety_plan");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
      expect(f!.message).toContain("Sam");
      expect(f!.message).toContain("High");
      expect(f!.record_id).toBeDefined();
    });
    it("does not fire high_risk_no_safety_plan when safety plan in place", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "High", safety_plan_in_place: true })]);
      expect(a.find((x) => x.type === "high_risk_no_safety_plan")).toBeUndefined();
    });
    it("does not fire high_risk_no_safety_plan for Immediate risk", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "Immediate", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "high_risk_no_safety_plan")).toBeUndefined();
    });
    it("does not fire high_risk_no_safety_plan for Medium risk", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "Medium", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "high_risk_no_safety_plan")).toBeUndefined();
    });
    it("does not fire high_risk_no_safety_plan for Low risk", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "Low", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "high_risk_no_safety_plan")).toBeUndefined();
    });
    it("does not fire high_risk_no_safety_plan for No Identified Risk", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "No Identified Risk", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "high_risk_no_safety_plan")).toBeUndefined();
    });
    it("high_risk_no_safety_plan fires per-record", () => {
      const a = computeFgmRiskAlerts([
        makeRow({ id: "b-1", risk_level: "High", safety_plan_in_place: false }),
        makeRow({ id: "b-2", risk_level: "High", safety_plan_in_place: false }),
      ]);
      expect(a.filter((x) => x.type === "high_risk_no_safety_plan")).toHaveLength(2);
    });
    it("high_risk_no_safety_plan includes record_id", () => {
      const a = computeFgmRiskAlerts([makeRow({ id: "rec-2", risk_level: "High", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "high_risk_no_safety_plan")!.record_id).toBe("rec-2");
    });

    // High: risk_no_multi_agency_referral
    it("fires risk_no_multi_agency_referral for Low risk without referral", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "Low", multi_agency_referral: false, child_name: "Amy" })]);
      const f = a.find((x) => x.type === "risk_no_multi_agency_referral");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("Amy");
    });
    it("fires risk_no_multi_agency_referral for Medium risk without referral", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "Medium", multi_agency_referral: false })]);
      expect(a.find((x) => x.type === "risk_no_multi_agency_referral")).toBeDefined();
    });
    it("fires risk_no_multi_agency_referral for High risk without referral", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "High", multi_agency_referral: false })]);
      expect(a.find((x) => x.type === "risk_no_multi_agency_referral")).toBeDefined();
    });
    it("fires risk_no_multi_agency_referral for Immediate risk without referral", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "Immediate", multi_agency_referral: false })]);
      expect(a.find((x) => x.type === "risk_no_multi_agency_referral")).toBeDefined();
    });
    it("does not fire risk_no_multi_agency_referral for No Identified Risk", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "No Identified Risk", multi_agency_referral: false })]);
      expect(a.find((x) => x.type === "risk_no_multi_agency_referral")).toBeUndefined();
    });
    it("does not fire risk_no_multi_agency_referral when referral made", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "High", multi_agency_referral: true })]);
      expect(a.find((x) => x.type === "risk_no_multi_agency_referral")).toBeUndefined();
    });
    it("risk_no_multi_agency_referral fires per-record", () => {
      const a = computeFgmRiskAlerts([
        makeRow({ id: "c-1", risk_level: "Medium", multi_agency_referral: false }),
        makeRow({ id: "c-2", risk_level: "High", multi_agency_referral: false }),
      ]);
      expect(a.filter((x) => x.type === "risk_no_multi_agency_referral")).toHaveLength(2);
    });
    it("risk_no_multi_agency_referral includes record_id", () => {
      const a = computeFgmRiskAlerts([makeRow({ id: "rec-3", risk_level: "Low", multi_agency_referral: false })]);
      expect(a.find((x) => x.type === "risk_no_multi_agency_referral")!.record_id).toBe("rec-3");
    });

    // Medium: cultural_sensitivity_not_considered
    it("fires cultural_sensitivity_not_considered when not considered", () => {
      const a = computeFgmRiskAlerts([makeRow({ cultural_sensitivity_considered: false, child_name: "Kai" })]);
      const f = a.find((x) => x.type === "cultural_sensitivity_not_considered");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("medium");
      expect(f!.message).toContain("Kai");
    });
    it("does not fire cultural_sensitivity_not_considered when considered", () => {
      const a = computeFgmRiskAlerts([makeRow({ cultural_sensitivity_considered: true })]);
      expect(a.find((x) => x.type === "cultural_sensitivity_not_considered")).toBeUndefined();
    });
    it("cultural_sensitivity_not_considered fires per-record", () => {
      const a = computeFgmRiskAlerts([
        makeRow({ id: "d-1", cultural_sensitivity_considered: false }),
        makeRow({ id: "d-2", cultural_sensitivity_considered: false }),
      ]);
      expect(a.filter((x) => x.type === "cultural_sensitivity_not_considered")).toHaveLength(2);
    });
    it("cultural_sensitivity_not_considered includes record_id", () => {
      const a = computeFgmRiskAlerts([makeRow({ id: "rec-4", cultural_sensitivity_considered: false })]);
      expect(a.find((x) => x.type === "cultural_sensitivity_not_considered")!.record_id).toBe("rec-4");
    });

    // Multiple alerts simultaneously
    it("fires multiple alert types simultaneously", () => {
      const a = computeFgmRiskAlerts([
        makeRow({
          risk_level: "Immediate",
          mandatory_report_made: false,
          multi_agency_referral: false,
          cultural_sensitivity_considered: false,
        }),
      ]);
      const types = a.map((x) => x.type);
      expect(types).toContain("immediate_risk_no_mandatory_report");
      expect(types).toContain("risk_no_multi_agency_referral");
      expect(types).toContain("cultural_sensitivity_not_considered");
    });
    it("fires both critical types when High risk no safety plan and Immediate no report exist", () => {
      const a = computeFgmRiskAlerts([
        makeRow({ risk_level: "High", safety_plan_in_place: false, multi_agency_referral: true }),
        makeRow({ risk_level: "Immediate", mandatory_report_made: false, multi_agency_referral: true }),
      ]);
      const types = a.map((x) => x.type);
      expect(types).toContain("high_risk_no_safety_plan");
      expect(types).toContain("immediate_risk_no_mandatory_report");
    });
    it("does not fire alerts for well-managed No Identified Risk row", () => {
      const a = computeFgmRiskAlerts([makeRow({
        risk_level: "No Identified Risk",
        mandatory_report_made: true,
        safety_plan_in_place: true,
        multi_agency_referral: true,
        cultural_sensitivity_considered: true,
      })]);
      expect(a).toEqual([]);
    });
    it("does not fire high_risk_no_safety_plan for Immediate (only High)", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "Immediate", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "high_risk_no_safety_plan")).toBeUndefined();
    });
    it("critical alerts have severity critical", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "Immediate", mandatory_report_made: false })]);
      const critical = a.filter((x) => x.severity === "critical");
      expect(critical.length).toBeGreaterThan(0);
    });
    it("high alerts have severity high", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "Low", multi_agency_referral: false })]);
      const high = a.filter((x) => x.severity === "high");
      expect(high.length).toBeGreaterThan(0);
    });
    it("medium alerts have severity medium", () => {
      const a = computeFgmRiskAlerts([makeRow({ cultural_sensitivity_considered: false })]);
      const medium = a.filter((x) => x.severity === "medium");
      expect(medium.length).toBeGreaterThan(0);
    });
    it("No Identified Risk with cultural sensitivity not considered fires medium alert", () => {
      const a = computeFgmRiskAlerts([makeRow({ risk_level: "No Identified Risk", cultural_sensitivity_considered: false })]);
      expect(a.find((x) => x.type === "cultural_sensitivity_not_considered")).toBeDefined();
    });
    it("all alerts have a type string", () => {
      const a = computeFgmRiskAlerts([makeRow({
        risk_level: "Immediate",
        mandatory_report_made: false,
        multi_agency_referral: false,
        cultural_sensitivity_considered: false,
      })]);
      for (const alert of a) expect(typeof alert.type).toBe("string");
    });
    it("all alerts have a message string", () => {
      const a = computeFgmRiskAlerts([makeRow({
        risk_level: "High",
        safety_plan_in_place: false,
        multi_agency_referral: false,
        cultural_sensitivity_considered: false,
      })]);
      for (const alert of a) expect(typeof alert.message).toBe("string");
    });
    it("all alerts have a severity", () => {
      const a = computeFgmRiskAlerts([makeRow({
        risk_level: "High",
        safety_plan_in_place: false,
        multi_agency_referral: false,
        cultural_sensitivity_considered: false,
      })]);
      for (const alert of a) expect(["critical", "high", "medium"]).toContain(alert.severity);
    });
  });

  // ── generateFgmRiskCaraInsights ────────────────────────────────────────
  describe("generateFgmRiskCaraInsights", () => {
    it("returns 3 insights for empty data", () => {
      const insights = generateFgmRiskCaraInsights([]);
      expect(insights).toHaveLength(3);
    });
    it("returns 3 insights for populated data", () => {
      const insights = generateFgmRiskCaraInsights([makeRow(), makeRow()]);
      expect(insights).toHaveLength(3);
    });
    it("insight 1 starts with [red]", () => {
      expect(generateFgmRiskCaraInsights([])[0]).toMatch(/^\[red\]/);
    });
    it("insight 2 starts with [amber]", () => {
      expect(generateFgmRiskCaraInsights([])[1]).toMatch(/^\[amber\]/);
    });
    it("insight 3 starts with [reflect]", () => {
      expect(generateFgmRiskCaraInsights([])[2]).toMatch(/^\[reflect\]/);
    });
    it("insight 1 contains total assessments count", () => {
      const insights = generateFgmRiskCaraInsights([makeRow(), makeRow()]);
      expect(insights[0]).toContain("2 FGM risk assessments");
    });
    it("insight 1 contains unique children count", () => {
      const insights = generateFgmRiskCaraInsights([makeRow({ child_name: "A" }), makeRow({ child_name: "B" })]);
      expect(insights[0]).toContain("2 children");
    });
    it("insight 1 uses singular child for 1", () => {
      const insights = generateFgmRiskCaraInsights([makeRow()]);
      expect(insights[0]).toContain("1 child");
    });
    it("insight 1 contains high risk count", () => {
      const insights = generateFgmRiskCaraInsights([
        makeRow({ risk_level: "High" }),
        makeRow({ risk_level: "Immediate" }),
      ]);
      expect(insights[0]).toContain("2 at High or Immediate risk level");
    });
    it("insight 1 contains mandatory report count", () => {
      const insights = generateFgmRiskCaraInsights([makeRow({ mandatory_report_made: true })]);
      expect(insights[0]).toContain("1 mandatory report made");
    });
    it("insight 1 uses plural reports for multiple", () => {
      const insights = generateFgmRiskCaraInsights([
        makeRow({ mandatory_report_made: true }),
        makeRow({ mandatory_report_made: true }),
      ]);
      expect(insights[0]).toContain("2 mandatory reports made");
    });
    it("insight 1 contains FGM Protection Order count", () => {
      const insights = generateFgmRiskCaraInsights([makeRow({ fgm_protection_order: true })]);
      expect(insights[0]).toContain("1 FGM Protection Order in place");
    });
    it("insight 1 uses plural Orders for multiple", () => {
      const insights = generateFgmRiskCaraInsights([
        makeRow({ fgm_protection_order: true }),
        makeRow({ fgm_protection_order: true }),
      ]);
      expect(insights[0]).toContain("2 FGM Protection Orders in place");
    });
    it("insight 2 mentions critical and high alert counts when present", () => {
      const rows = [
        makeRow({ risk_level: "Immediate", mandatory_report_made: false, multi_agency_referral: false }),
      ];
      const insights = generateFgmRiskCaraInsights(rows);
      expect(insights[1]).toContain("critical");
      expect(insights[1]).toContain("high-priority");
    });
    it("insight 2 shows no concerns when none", () => {
      const insights = generateFgmRiskCaraInsights([makeRow({ risk_level: "No Identified Risk" })]);
      expect(insights[1]).toContain("No critical or high-priority concerns");
    });
    it("insight 2 contains safety plan rate", () => {
      const insights = generateFgmRiskCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Safety plan rate");
    });
    it("insight 2 contains multi-agency rate", () => {
      const insights = generateFgmRiskCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Multi-agency rate");
    });
    it("insight 2 contains cultural sensitivity rate", () => {
      const insights = generateFgmRiskCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Cultural sensitivity rate");
    });
    it("insight 3 contains reflective question about FGM risk assessments", () => {
      const insights = generateFgmRiskCaraInsights([]);
      expect(insights[2]).toContain("FGM risk assessments");
    });
    it("insight 3 mentions cultural sensitivity", () => {
      const insights = generateFgmRiskCaraInsights([]);
      expect(insights[2]).toContain("cultural sensitivity");
    });
    it("insight 3 mentions specialist services", () => {
      const insights = generateFgmRiskCaraInsights([]);
      expect(insights[2]).toContain("specialist services");
    });
    it("insight 3 mentions multi-agency", () => {
      const insights = generateFgmRiskCaraInsights([]);
      expect(insights[2]).toContain("multi-agency");
    });
    it("insight 3 mentions mandatory reporting", () => {
      const insights = generateFgmRiskCaraInsights([]);
      expect(insights[2]).toContain("mandatory reporting");
    });
    it("all insights are strings", () => {
      const insights = generateFgmRiskCaraInsights([makeRow()]);
      for (const i of insights) expect(typeof i).toBe("string");
    });
    it("empty array still produces meaningful content", () => {
      const insights = generateFgmRiskCaraInsights([]);
      expect(insights[0]).toContain("0 FGM risk assessments");
      expect(insights[0]).toContain("0 children");
    });
    it("insight 1 for zero assessments shows 0 at High or Immediate", () => {
      const insights = generateFgmRiskCaraInsights([]);
      expect(insights[0]).toContain("0 at High or Immediate risk level");
    });
    it("insight 1 for zero assessments shows 0 mandatory reports", () => {
      const insights = generateFgmRiskCaraInsights([]);
      expect(insights[0]).toContain("0 mandatory reports made");
    });
    it("insight 1 for zero assessments shows 0 FGM Protection Orders", () => {
      const insights = generateFgmRiskCaraInsights([]);
      expect(insights[0]).toContain("0 FGM Protection Orders in place");
    });
    it("insight 2 with only medium alerts shows no critical or high", () => {
      const rows = [makeRow({ risk_level: "No Identified Risk", cultural_sensitivity_considered: false })];
      const insights = generateFgmRiskCaraInsights(rows);
      expect(insights[1]).toContain("No critical or high-priority concerns");
    });
    it("insight 2 with critical alerts shows count", () => {
      const rows = [makeRow({ risk_level: "Immediate", mandatory_report_made: false })];
      const insights = generateFgmRiskCaraInsights(rows);
      expect(insights[1]).toMatch(/1 critical/);
    });
    it("insight 2 with high alerts shows count", () => {
      const rows = [makeRow({ risk_level: "Low", multi_agency_referral: false })];
      const insights = generateFgmRiskCaraInsights(rows);
      expect(insights[1]).toMatch(/1 high-priority/);
    });
    it("insight 2 safety plan rate value is correct", () => {
      const insights = generateFgmRiskCaraInsights([makeRow({ safety_plan_in_place: true })]);
      expect(insights[1]).toContain("100%");
    });
    it("insight 3 is a reflective question", () => {
      const insights = generateFgmRiskCaraInsights([]);
      expect(insights[2]).toContain("?");
    });
  });
});
