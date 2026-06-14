import { describe, it, expect } from "vitest";

import {
  RISK_LEVELS,
  ABUSE_TYPES,
  PERPETRATOR_RELATIONSHIPS,
  COMPLIANCE_STATUSES,
  _testing,
} from "../child-honour-based-abuse-risk-service";

import type {
  ChildHonourBasedAbuseRiskRow,
} from "../child-honour-based-abuse-risk-service";

const {
  computeMetrics,
  computeAlerts,
  generateCaraInsights,
} = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<ChildHonourBasedAbuseRiskRow>,
): ChildHonourBasedAbuseRiskRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: overrides?.home_id ?? "home-1",
    assessment_date: overrides?.assessment_date ?? now.toISOString().split("T")[0],
    assessor_name: overrides?.assessor_name ?? "Assessor X",
    child_name: overrides?.child_name ?? "Child A",
    risk_level: overrides?.risk_level ?? "Low",
    abuse_type: overrides?.abuse_type ?? "Not Determined",
    perpetrator_relationship: overrides?.perpetrator_relationship ?? "Unknown",
    safety_plan_in_place: overrides?.safety_plan_in_place ?? true,
    multi_agency_referral: overrides?.multi_agency_referral ?? true,
    police_notification: overrides?.police_notification ?? true,
    specialist_service_engaged: overrides?.specialist_service_engaged ?? true,
    safe_accommodation_secured: overrides?.safe_accommodation_secured ?? true,
    one_chance_rule_applied: overrides?.one_chance_rule_applied ?? true,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    compliance_status: overrides?.compliance_status ?? "Compliant",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("child-honour-based-abuse-risk-service", () => {
  // ── Enum validation ──────────────────────────────────────────────────
  describe("Enum validation", () => {
    it("RISK_LEVELS has 5 values", () => { expect(RISK_LEVELS).toHaveLength(5); });
    it("RISK_LEVELS contains No Identified Risk", () => { expect(RISK_LEVELS).toContain("No Identified Risk"); });
    it("RISK_LEVELS contains Low", () => { expect(RISK_LEVELS).toContain("Low"); });
    it("RISK_LEVELS contains Medium", () => { expect(RISK_LEVELS).toContain("Medium"); });
    it("RISK_LEVELS contains High", () => { expect(RISK_LEVELS).toContain("High"); });
    it("RISK_LEVELS contains Immediate", () => { expect(RISK_LEVELS).toContain("Immediate"); });

    it("ABUSE_TYPES has 8 values", () => { expect(ABUSE_TYPES).toHaveLength(8); });
    it("ABUSE_TYPES contains Forced Marriage", () => { expect(ABUSE_TYPES).toContain("Forced Marriage"); });
    it("ABUSE_TYPES contains FGM", () => { expect(ABUSE_TYPES).toContain("FGM"); });
    it("ABUSE_TYPES contains Honour Killing Threat", () => { expect(ABUSE_TYPES).toContain("Honour Killing Threat"); });
    it("ABUSE_TYPES contains Physical Violence", () => { expect(ABUSE_TYPES).toContain("Physical Violence"); });
    it("ABUSE_TYPES contains Emotional Abuse", () => { expect(ABUSE_TYPES).toContain("Emotional Abuse"); });
    it("ABUSE_TYPES contains Isolation", () => { expect(ABUSE_TYPES).toContain("Isolation"); });
    it("ABUSE_TYPES contains Financial Control", () => { expect(ABUSE_TYPES).toContain("Financial Control"); });
    it("ABUSE_TYPES contains Not Determined", () => { expect(ABUSE_TYPES).toContain("Not Determined"); });

    it("PERPETRATOR_RELATIONSHIPS has 7 values", () => { expect(PERPETRATOR_RELATIONSHIPS).toHaveLength(7); });
    it("PERPETRATOR_RELATIONSHIPS contains Parent", () => { expect(PERPETRATOR_RELATIONSHIPS).toContain("Parent"); });
    it("PERPETRATOR_RELATIONSHIPS contains Sibling", () => { expect(PERPETRATOR_RELATIONSHIPS).toContain("Sibling"); });
    it("PERPETRATOR_RELATIONSHIPS contains Extended Family", () => { expect(PERPETRATOR_RELATIONSHIPS).toContain("Extended Family"); });
    it("PERPETRATOR_RELATIONSHIPS contains Community Member", () => { expect(PERPETRATOR_RELATIONSHIPS).toContain("Community Member"); });
    it("PERPETRATOR_RELATIONSHIPS contains Partner", () => { expect(PERPETRATOR_RELATIONSHIPS).toContain("Partner"); });
    it("PERPETRATOR_RELATIONSHIPS contains Unknown", () => { expect(PERPETRATOR_RELATIONSHIPS).toContain("Unknown"); });
    it("PERPETRATOR_RELATIONSHIPS contains Other", () => { expect(PERPETRATOR_RELATIONSHIPS).toContain("Other"); });

    it("COMPLIANCE_STATUSES has 4 values", () => { expect(COMPLIANCE_STATUSES).toHaveLength(4); });
    it("COMPLIANCE_STATUSES contains Compliant", () => { expect(COMPLIANCE_STATUSES).toContain("Compliant"); });
    it("COMPLIANCE_STATUSES contains Non-Compliant", () => { expect(COMPLIANCE_STATUSES).toContain("Non-Compliant"); });
    it("COMPLIANCE_STATUSES contains Under Review", () => { expect(COMPLIANCE_STATUSES).toContain("Under Review"); });
    it("COMPLIANCE_STATUSES contains Escalated", () => { expect(COMPLIANCE_STATUSES).toContain("Escalated"); });
  });

  // ── computeMetrics ──────────────────────────────────────────────────
  describe("computeMetrics", () => {
    it("returns zeros for empty array", () => {
      const m = computeMetrics([]);
      expect(m.total_assessments).toBe(0);
      expect(m.high_risk_count).toBe(0);
      expect(m.immediate_count).toBe(0);
      expect(m.safety_plan_rate).toBe(0);
      expect(m.multi_agency_rate).toBe(0);
      expect(m.police_notification_rate).toBe(0);
      expect(m.specialist_rate).toBe(0);
      expect(m.safe_accommodation_rate).toBe(0);
      expect(m.one_chance_rule_rate).toBe(0);
      expect(m.unique_children).toBe(0);
      expect(m.unique_assessors).toBe(0);
    });
    it("total_assessments counts rows", () => { expect(computeMetrics([makeRow(), makeRow(), makeRow()]).total_assessments).toBe(3); });
    it("total_assessments single row", () => { expect(computeMetrics([makeRow()]).total_assessments).toBe(1); });

    // high_risk_count
    it("counts High as high_risk_count", () => { expect(computeMetrics([makeRow({ risk_level: "High" })]).high_risk_count).toBe(1); });
    it("counts Immediate as high_risk_count", () => { expect(computeMetrics([makeRow({ risk_level: "Immediate" })]).high_risk_count).toBe(1); });
    it("does not count Medium as high_risk_count", () => { expect(computeMetrics([makeRow({ risk_level: "Medium" })]).high_risk_count).toBe(0); });
    it("does not count Low as high_risk_count", () => { expect(computeMetrics([makeRow({ risk_level: "Low" })]).high_risk_count).toBe(0); });
    it("does not count No Identified Risk as high_risk_count", () => { expect(computeMetrics([makeRow({ risk_level: "No Identified Risk" })]).high_risk_count).toBe(0); });
    it("high_risk_count sums High and Immediate", () => {
      const m = computeMetrics([
        makeRow({ risk_level: "High" }),
        makeRow({ risk_level: "Immediate" }),
        makeRow({ risk_level: "Low" }),
      ]);
      expect(m.high_risk_count).toBe(2);
    });

    // immediate_count
    it("counts Immediate as immediate_count", () => { expect(computeMetrics([makeRow({ risk_level: "Immediate" })]).immediate_count).toBe(1); });
    it("does not count High as immediate_count", () => { expect(computeMetrics([makeRow({ risk_level: "High" })]).immediate_count).toBe(0); });
    it("does not count Medium as immediate_count", () => { expect(computeMetrics([makeRow({ risk_level: "Medium" })]).immediate_count).toBe(0); });
    it("does not count Low as immediate_count", () => { expect(computeMetrics([makeRow({ risk_level: "Low" })]).immediate_count).toBe(0); });
    it("does not count No Identified Risk as immediate_count", () => { expect(computeMetrics([makeRow({ risk_level: "No Identified Risk" })]).immediate_count).toBe(0); });
    it("immediate_count sums correctly", () => {
      const m = computeMetrics([
        makeRow({ risk_level: "Immediate" }),
        makeRow({ risk_level: "Immediate" }),
        makeRow({ risk_level: "High" }),
      ]);
      expect(m.immediate_count).toBe(2);
    });

    // safety_plan_rate
    it("safety_plan_rate 100 when all true", () => { expect(computeMetrics([makeRow({ safety_plan_in_place: true })]).safety_plan_rate).toBe(100); });
    it("safety_plan_rate 0 when all false", () => { expect(computeMetrics([makeRow({ safety_plan_in_place: false })]).safety_plan_rate).toBe(0); });
    it("safety_plan_rate mixed 2 of 3 gives 66.7", () => {
      const m = computeMetrics([
        makeRow({ safety_plan_in_place: true }),
        makeRow({ safety_plan_in_place: false }),
        makeRow({ safety_plan_in_place: true }),
      ]);
      expect(m.safety_plan_rate).toBe(66.7);
    });
    it("safety_plan_rate mixed 1 of 3 gives 33.3", () => {
      const m = computeMetrics([
        makeRow({ safety_plan_in_place: true }),
        makeRow({ safety_plan_in_place: false }),
        makeRow({ safety_plan_in_place: false }),
      ]);
      expect(m.safety_plan_rate).toBe(33.3);
    });

    // multi_agency_rate
    it("multi_agency_rate 100 when all true", () => { expect(computeMetrics([makeRow({ multi_agency_referral: true })]).multi_agency_rate).toBe(100); });
    it("multi_agency_rate 0 when all false", () => { expect(computeMetrics([makeRow({ multi_agency_referral: false })]).multi_agency_rate).toBe(0); });
    it("multi_agency_rate mixed 1 of 2 gives 50", () => {
      const m = computeMetrics([
        makeRow({ multi_agency_referral: true }),
        makeRow({ multi_agency_referral: false }),
      ]);
      expect(m.multi_agency_rate).toBe(50);
    });

    // police_notification_rate
    it("police_notification_rate 100 when all true", () => { expect(computeMetrics([makeRow({ police_notification: true })]).police_notification_rate).toBe(100); });
    it("police_notification_rate 0 when all false", () => { expect(computeMetrics([makeRow({ police_notification: false })]).police_notification_rate).toBe(0); });
    it("police_notification_rate mixed 1 of 4 gives 25", () => {
      const m = computeMetrics([
        makeRow({ police_notification: true }),
        makeRow({ police_notification: false }),
        makeRow({ police_notification: false }),
        makeRow({ police_notification: false }),
      ]);
      expect(m.police_notification_rate).toBe(25);
    });

    // specialist_rate
    it("specialist_rate 100 when all true", () => { expect(computeMetrics([makeRow({ specialist_service_engaged: true })]).specialist_rate).toBe(100); });
    it("specialist_rate 0 when all false", () => { expect(computeMetrics([makeRow({ specialist_service_engaged: false })]).specialist_rate).toBe(0); });

    // safe_accommodation_rate
    it("safe_accommodation_rate 100 when all true", () => { expect(computeMetrics([makeRow({ safe_accommodation_secured: true })]).safe_accommodation_rate).toBe(100); });
    it("safe_accommodation_rate 0 when all false", () => { expect(computeMetrics([makeRow({ safe_accommodation_secured: false })]).safe_accommodation_rate).toBe(0); });
    it("safe_accommodation_rate mixed 3 of 4 gives 75", () => {
      const m = computeMetrics([
        makeRow({ safe_accommodation_secured: true }),
        makeRow({ safe_accommodation_secured: true }),
        makeRow({ safe_accommodation_secured: true }),
        makeRow({ safe_accommodation_secured: false }),
      ]);
      expect(m.safe_accommodation_rate).toBe(75);
    });

    // one_chance_rule_rate
    it("one_chance_rule_rate 100 when all true", () => { expect(computeMetrics([makeRow({ one_chance_rule_applied: true })]).one_chance_rule_rate).toBe(100); });
    it("one_chance_rule_rate 0 when all false", () => { expect(computeMetrics([makeRow({ one_chance_rule_applied: false })]).one_chance_rule_rate).toBe(0); });
    it("one_chance_rule_rate mixed 2 of 4 gives 50", () => {
      const m = computeMetrics([
        makeRow({ one_chance_rule_applied: true }),
        makeRow({ one_chance_rule_applied: true }),
        makeRow({ one_chance_rule_applied: false }),
        makeRow({ one_chance_rule_applied: false }),
      ]);
      expect(m.one_chance_rule_rate).toBe(50);
    });

    // unique_children
    it("unique_children counts distinct child_name values", () => {
      const m = computeMetrics([
        makeRow({ child_name: "Alice" }),
        makeRow({ child_name: "Bob" }),
        makeRow({ child_name: "Alice" }),
      ]);
      expect(m.unique_children).toBe(2);
    });
    it("unique_children single child", () => { expect(computeMetrics([makeRow()]).unique_children).toBe(1); });
    it("unique_children all distinct", () => {
      const m = computeMetrics([
        makeRow({ child_name: "A" }),
        makeRow({ child_name: "B" }),
        makeRow({ child_name: "C" }),
      ]);
      expect(m.unique_children).toBe(3);
    });
    it("unique_children all same", () => {
      const m = computeMetrics([
        makeRow({ child_name: "Same" }),
        makeRow({ child_name: "Same" }),
      ]);
      expect(m.unique_children).toBe(1);
    });

    // unique_assessors
    it("unique_assessors counts distinct assessor_name values", () => {
      const m = computeMetrics([
        makeRow({ assessor_name: "Dr. Smith" }),
        makeRow({ assessor_name: "Dr. Jones" }),
        makeRow({ assessor_name: "Dr. Smith" }),
      ]);
      expect(m.unique_assessors).toBe(2);
    });
    it("unique_assessors single assessor", () => { expect(computeMetrics([makeRow()]).unique_assessors).toBe(1); });
    it("unique_assessors all distinct", () => {
      const m = computeMetrics([
        makeRow({ assessor_name: "A" }),
        makeRow({ assessor_name: "B" }),
        makeRow({ assessor_name: "C" }),
      ]);
      expect(m.unique_assessors).toBe(3);
    });

    // Multiple rows aggregate correctly
    it("multiple rows aggregate correctly", () => {
      const m = computeMetrics([
        makeRow({ risk_level: "High", safety_plan_in_place: true, multi_agency_referral: true, child_name: "A", assessor_name: "X" }),
        makeRow({ risk_level: "Immediate", safety_plan_in_place: false, multi_agency_referral: false, child_name: "B", assessor_name: "Y" }),
        makeRow({ risk_level: "Low", safety_plan_in_place: true, multi_agency_referral: true, child_name: "A", assessor_name: "X" }),
        makeRow({ risk_level: "Medium", safety_plan_in_place: false, multi_agency_referral: false, child_name: "C", assessor_name: "Z" }),
      ]);
      expect(m.total_assessments).toBe(4);
      expect(m.high_risk_count).toBe(2);
      expect(m.immediate_count).toBe(1);
      expect(m.safety_plan_rate).toBe(50);
      expect(m.unique_children).toBe(3);
      expect(m.unique_assessors).toBe(3);
    });

    // Rate rounding precision
    it("rate rounding uses Math.round with 1000/10 pattern", () => {
      // 1 of 6 = 16.666... should round to 16.7
      const rows = Array.from({ length: 6 }, (_, i) =>
        makeRow({ safety_plan_in_place: i === 0 }),
      );
      expect(computeMetrics(rows).safety_plan_rate).toBe(16.7);
    });
    it("rate 5 of 6 gives 83.3", () => {
      const rows = Array.from({ length: 6 }, (_, i) =>
        makeRow({ police_notification: i < 5 }),
      );
      expect(computeMetrics(rows).police_notification_rate).toBe(83.3);
    });
    it("rate 2 of 7 gives 28.6", () => {
      const rows = Array.from({ length: 7 }, (_, i) =>
        makeRow({ specialist_service_engaged: i < 2 }),
      );
      expect(computeMetrics(rows).specialist_rate).toBe(28.6);
    });
    it("rate 3 of 7 gives 42.9", () => {
      const rows = Array.from({ length: 7 }, (_, i) =>
        makeRow({ safe_accommodation_secured: i < 3 }),
      );
      expect(computeMetrics(rows).safe_accommodation_rate).toBe(42.9);
    });
    it("rate 4 of 7 gives 57.1", () => {
      const rows = Array.from({ length: 7 }, (_, i) =>
        makeRow({ one_chance_rule_applied: i < 4 }),
      );
      expect(computeMetrics(rows).one_chance_rule_rate).toBe(57.1);
    });
  });

  // ── computeAlerts ──────────────────────────────────────────────────
  describe("computeAlerts", () => {
    it("returns empty for empty", () => { expect(computeAlerts([])).toEqual([]); });
    it("returns empty for clean rows", () => { expect(computeAlerts([makeRow()])).toEqual([]); });

    // Critical: immediate_no_safety_plan
    it("fires immediate_no_safety_plan for Immediate risk without safety plan", () => {
      const a = computeAlerts([makeRow({ risk_level: "Immediate", safety_plan_in_place: false, child_name: "Jo" })]);
      const f = a.find((x) => x.type === "immediate_no_safety_plan");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
      expect(f!.message).toContain("Jo");
      expect(f!.message).toContain("Immediate");
      expect(f!.record_id).toBeDefined();
    });
    it("does not fire immediate_no_safety_plan for High risk", () => {
      const a = computeAlerts([makeRow({ risk_level: "High", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "immediate_no_safety_plan")).toBeUndefined();
    });
    it("does not fire immediate_no_safety_plan for Medium risk", () => {
      const a = computeAlerts([makeRow({ risk_level: "Medium", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "immediate_no_safety_plan")).toBeUndefined();
    });
    it("does not fire immediate_no_safety_plan for Low risk", () => {
      const a = computeAlerts([makeRow({ risk_level: "Low", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "immediate_no_safety_plan")).toBeUndefined();
    });
    it("does not fire immediate_no_safety_plan for No Identified Risk", () => {
      const a = computeAlerts([makeRow({ risk_level: "No Identified Risk", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "immediate_no_safety_plan")).toBeUndefined();
    });
    it("does not fire immediate_no_safety_plan when safety plan in place", () => {
      const a = computeAlerts([makeRow({ risk_level: "Immediate", safety_plan_in_place: true })]);
      expect(a.find((x) => x.type === "immediate_no_safety_plan")).toBeUndefined();
    });
    it("immediate_no_safety_plan fires per-record", () => {
      const a = computeAlerts([
        makeRow({ id: "a-1", risk_level: "Immediate", safety_plan_in_place: false }),
        makeRow({ id: "a-2", risk_level: "Immediate", safety_plan_in_place: false }),
      ]);
      expect(a.filter((x) => x.type === "immediate_no_safety_plan")).toHaveLength(2);
    });
    it("immediate_no_safety_plan message contains honour-based abuse", () => {
      const a = computeAlerts([makeRow({ risk_level: "Immediate", safety_plan_in_place: false })]);
      const f = a.find((x) => x.type === "immediate_no_safety_plan");
      expect(f!.message).toContain("honour-based abuse");
    });

    // Critical: high_risk_no_multi_agency
    it("fires high_risk_no_multi_agency for High risk without multi-agency", () => {
      const a = computeAlerts([makeRow({ risk_level: "High", multi_agency_referral: false, child_name: "Sam" })]);
      const f = a.find((x) => x.type === "high_risk_no_multi_agency");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
      expect(f!.message).toContain("Sam");
      expect(f!.message).toContain("High");
      expect(f!.record_id).toBeDefined();
    });
    it("fires high_risk_no_multi_agency for Immediate risk without multi-agency", () => {
      const a = computeAlerts([makeRow({ risk_level: "Immediate", multi_agency_referral: false })]);
      expect(a.find((x) => x.type === "high_risk_no_multi_agency")).toBeDefined();
    });
    it("does not fire high_risk_no_multi_agency for Medium risk", () => {
      const a = computeAlerts([makeRow({ risk_level: "Medium", multi_agency_referral: false })]);
      expect(a.find((x) => x.type === "high_risk_no_multi_agency")).toBeUndefined();
    });
    it("does not fire high_risk_no_multi_agency for Low risk", () => {
      const a = computeAlerts([makeRow({ risk_level: "Low", multi_agency_referral: false })]);
      expect(a.find((x) => x.type === "high_risk_no_multi_agency")).toBeUndefined();
    });
    it("does not fire high_risk_no_multi_agency for No Identified Risk", () => {
      const a = computeAlerts([makeRow({ risk_level: "No Identified Risk", multi_agency_referral: false })]);
      expect(a.find((x) => x.type === "high_risk_no_multi_agency")).toBeUndefined();
    });
    it("does not fire high_risk_no_multi_agency when multi-agency referral made", () => {
      const a = computeAlerts([makeRow({ risk_level: "High", multi_agency_referral: true })]);
      expect(a.find((x) => x.type === "high_risk_no_multi_agency")).toBeUndefined();
    });
    it("high_risk_no_multi_agency fires per-record", () => {
      const a = computeAlerts([
        makeRow({ id: "a-1", risk_level: "High", multi_agency_referral: false }),
        makeRow({ id: "a-2", risk_level: "Immediate", multi_agency_referral: false }),
      ]);
      expect(a.filter((x) => x.type === "high_risk_no_multi_agency")).toHaveLength(2);
    });
    it("high_risk_no_multi_agency message contains honour-based abuse", () => {
      const a = computeAlerts([makeRow({ risk_level: "High", multi_agency_referral: false })]);
      const f = a.find((x) => x.type === "high_risk_no_multi_agency");
      expect(f!.message).toContain("honour-based abuse");
    });

    // High: no_police_high_risk
    it("fires no_police_high_risk for High risk without police notification", () => {
      const a = computeAlerts([makeRow({ risk_level: "High", police_notification: false, child_name: "Amy" })]);
      const f = a.find((x) => x.type === "no_police_high_risk");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("Amy");
    });
    it("fires no_police_high_risk for Immediate risk without police notification", () => {
      const a = computeAlerts([makeRow({ risk_level: "Immediate", police_notification: false })]);
      expect(a.find((x) => x.type === "no_police_high_risk")).toBeDefined();
    });
    it("does not fire no_police_high_risk for Medium risk", () => {
      const a = computeAlerts([makeRow({ risk_level: "Medium", police_notification: false })]);
      expect(a.find((x) => x.type === "no_police_high_risk")).toBeUndefined();
    });
    it("does not fire no_police_high_risk for Low risk", () => {
      const a = computeAlerts([makeRow({ risk_level: "Low", police_notification: false })]);
      expect(a.find((x) => x.type === "no_police_high_risk")).toBeUndefined();
    });
    it("does not fire no_police_high_risk for No Identified Risk", () => {
      const a = computeAlerts([makeRow({ risk_level: "No Identified Risk", police_notification: false })]);
      expect(a.find((x) => x.type === "no_police_high_risk")).toBeUndefined();
    });
    it("does not fire no_police_high_risk when police notified", () => {
      const a = computeAlerts([makeRow({ risk_level: "High", police_notification: true })]);
      expect(a.find((x) => x.type === "no_police_high_risk")).toBeUndefined();
    });
    it("no_police_high_risk fires per-record", () => {
      const a = computeAlerts([
        makeRow({ id: "a-1", risk_level: "High", police_notification: false }),
        makeRow({ id: "a-2", risk_level: "Immediate", police_notification: false }),
      ]);
      expect(a.filter((x) => x.type === "no_police_high_risk")).toHaveLength(2);
    });
    it("no_police_high_risk message contains honour-based abuse", () => {
      const a = computeAlerts([makeRow({ risk_level: "High", police_notification: false })]);
      const f = a.find((x) => x.type === "no_police_high_risk");
      expect(f!.message).toContain("honour-based abuse");
    });

    // Medium: no_specialist_high_risk
    it("fires no_specialist_high_risk for High risk without specialist", () => {
      const a = computeAlerts([makeRow({ risk_level: "High", specialist_service_engaged: false, child_name: "Zara" })]);
      const f = a.find((x) => x.type === "no_specialist_high_risk");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("medium");
      expect(f!.message).toContain("Zara");
    });
    it("fires no_specialist_high_risk for Immediate risk without specialist", () => {
      const a = computeAlerts([makeRow({ risk_level: "Immediate", specialist_service_engaged: false })]);
      expect(a.find((x) => x.type === "no_specialist_high_risk")).toBeDefined();
    });
    it("does not fire no_specialist_high_risk for Medium risk", () => {
      const a = computeAlerts([makeRow({ risk_level: "Medium", specialist_service_engaged: false })]);
      expect(a.find((x) => x.type === "no_specialist_high_risk")).toBeUndefined();
    });
    it("does not fire no_specialist_high_risk for Low risk", () => {
      const a = computeAlerts([makeRow({ risk_level: "Low", specialist_service_engaged: false })]);
      expect(a.find((x) => x.type === "no_specialist_high_risk")).toBeUndefined();
    });
    it("does not fire no_specialist_high_risk for No Identified Risk", () => {
      const a = computeAlerts([makeRow({ risk_level: "No Identified Risk", specialist_service_engaged: false })]);
      expect(a.find((x) => x.type === "no_specialist_high_risk")).toBeUndefined();
    });
    it("does not fire no_specialist_high_risk when specialist engaged", () => {
      const a = computeAlerts([makeRow({ risk_level: "High", specialist_service_engaged: true })]);
      expect(a.find((x) => x.type === "no_specialist_high_risk")).toBeUndefined();
    });
    it("no_specialist_high_risk fires per-record", () => {
      const a = computeAlerts([
        makeRow({ id: "a-1", risk_level: "High", specialist_service_engaged: false }),
        makeRow({ id: "a-2", risk_level: "Immediate", specialist_service_engaged: false }),
      ]);
      expect(a.filter((x) => x.type === "no_specialist_high_risk")).toHaveLength(2);
    });
    it("no_specialist_high_risk message contains honour-based abuse", () => {
      const a = computeAlerts([makeRow({ risk_level: "High", specialist_service_engaged: false })]);
      const f = a.find((x) => x.type === "no_specialist_high_risk");
      expect(f!.message).toContain("honour-based abuse");
    });

    // Multiple alerts simultaneously
    it("fires multiple alert types simultaneously", () => {
      const a = computeAlerts([
        makeRow({
          risk_level: "Immediate",
          safety_plan_in_place: false,
          multi_agency_referral: false,
          police_notification: false,
          specialist_service_engaged: false,
        }),
      ]);
      const types = a.map((x) => x.type);
      expect(types).toContain("immediate_no_safety_plan");
      expect(types).toContain("high_risk_no_multi_agency");
      expect(types).toContain("no_police_high_risk");
      expect(types).toContain("no_specialist_high_risk");
    });
    it("does not fire alerts for well-managed No Identified Risk row", () => {
      const a = computeAlerts([makeRow({
        risk_level: "No Identified Risk",
        safety_plan_in_place: true,
        multi_agency_referral: true,
        police_notification: true,
        specialist_service_engaged: true,
      })]);
      expect(a).toEqual([]);
    });
    it("all alerts have record_id", () => {
      const a = computeAlerts([
        makeRow({
          id: "test-id",
          risk_level: "Immediate",
          safety_plan_in_place: false,
          multi_agency_referral: false,
          police_notification: false,
          specialist_service_engaged: false,
        }),
      ]);
      for (const alert of a) {
        expect(alert.record_id).toBe("test-id");
      }
    });
    it("all alerts have valid severity", () => {
      const a = computeAlerts([
        makeRow({
          risk_level: "Immediate",
          safety_plan_in_place: false,
          multi_agency_referral: false,
          police_notification: false,
          specialist_service_engaged: false,
        }),
      ]);
      for (const alert of a) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });
    it("critical alerts come before high alerts for same row", () => {
      const a = computeAlerts([
        makeRow({
          risk_level: "Immediate",
          safety_plan_in_place: false,
          multi_agency_referral: false,
          police_notification: false,
          specialist_service_engaged: false,
        }),
      ]);
      const criticalIdx = a.findIndex((x) => x.severity === "critical");
      const highIdx = a.findIndex((x) => x.severity === "high");
      expect(criticalIdx).toBeLessThan(highIdx);
    });
    it("high alerts come before medium alerts for same row", () => {
      const a = computeAlerts([
        makeRow({
          risk_level: "Immediate",
          safety_plan_in_place: false,
          multi_agency_referral: false,
          police_notification: false,
          specialist_service_engaged: false,
        }),
      ]);
      const highIdx = a.findIndex((x) => x.severity === "high");
      const mediumIdx = a.findIndex((x) => x.severity === "medium");
      expect(highIdx).toBeLessThan(mediumIdx);
    });

    // Edge: mixed rows produce correct alerts
    it("mixed rows produce correct alert counts", () => {
      const a = computeAlerts([
        makeRow({ risk_level: "Immediate", safety_plan_in_place: false, multi_agency_referral: false, police_notification: false, specialist_service_engaged: false }),
        makeRow({ risk_level: "Low", multi_agency_referral: true }),
        makeRow({ risk_level: "No Identified Risk", multi_agency_referral: false }),
      ]);
      // Row 1: immediate_no_safety_plan, high_risk_no_multi_agency, no_police_high_risk, no_specialist_high_risk
      // Row 2: none (clean)
      // Row 3: No Identified Risk excluded from all alerts
      expect(a.filter((x) => x.type === "immediate_no_safety_plan")).toHaveLength(1);
      expect(a.filter((x) => x.type === "high_risk_no_multi_agency")).toHaveLength(1);
      expect(a.filter((x) => x.type === "no_police_high_risk")).toHaveLength(1);
      expect(a.filter((x) => x.type === "no_specialist_high_risk")).toHaveLength(1);
    });
    it("No Identified Risk row with all false booleans produces no alerts", () => {
      const a = computeAlerts([makeRow({
        risk_level: "No Identified Risk",
        safety_plan_in_place: false,
        multi_agency_referral: false,
        police_notification: false,
        specialist_service_engaged: false,
      })]);
      expect(a).toEqual([]);
    });
    it("all alert messages are non-empty strings", () => {
      const a = computeAlerts([
        makeRow({
          risk_level: "Immediate",
          safety_plan_in_place: false,
          multi_agency_referral: false,
          police_notification: false,
          specialist_service_engaged: false,
        }),
      ]);
      for (const alert of a) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
    it("all alert types are non-empty strings", () => {
      const a = computeAlerts([
        makeRow({
          risk_level: "Immediate",
          safety_plan_in_place: false,
          multi_agency_referral: false,
          police_notification: false,
          specialist_service_engaged: false,
        }),
      ]);
      for (const alert of a) {
        expect(typeof alert.type).toBe("string");
        expect(alert.type.length).toBeGreaterThan(0);
      }
    });
  });

  // ── generateCaraInsights ─────────────────────────────────────────────
  describe("generateCaraInsights", () => {
    it("returns 3 insights for empty data", () => {
      const insights = generateCaraInsights([]);
      expect(insights).toHaveLength(3);
    });
    it("returns 3 insights for populated data", () => {
      const insights = generateCaraInsights([makeRow(), makeRow()]);
      expect(insights).toHaveLength(3);
    });
    it("insight 1 starts with [red]", () => {
      expect(generateCaraInsights([])[0]).toMatch(/^\[red\]/);
    });
    it("insight 2 starts with [amber]", () => {
      expect(generateCaraInsights([])[1]).toMatch(/^\[amber\]/);
    });
    it("insight 3 starts with [reflect]", () => {
      expect(generateCaraInsights([])[2]).toMatch(/^\[reflect\]/);
    });
    it("insight 1 contains total assessments count", () => {
      const insights = generateCaraInsights([makeRow(), makeRow()]);
      expect(insights[0]).toContain("2 honour-based abuse risk assessments");
    });
    it("insight 1 contains unique children count", () => {
      const insights = generateCaraInsights([makeRow({ child_name: "A" }), makeRow({ child_name: "B" })]);
      expect(insights[0]).toContain("2 children");
    });
    it("insight 1 uses singular child for 1", () => {
      const insights = generateCaraInsights([makeRow()]);
      expect(insights[0]).toContain("1 child");
    });
    it("insight 1 contains high risk count", () => {
      const insights = generateCaraInsights([
        makeRow({ risk_level: "High" }),
        makeRow({ risk_level: "Immediate" }),
      ]);
      expect(insights[0]).toContain("2 at High or Immediate");
    });
    it("insight 1 contains immediate count", () => {
      const insights = generateCaraInsights([makeRow({ risk_level: "Immediate" })]);
      expect(insights[0]).toContain("1 at Immediate risk");
    });
    it("insight 1 contains safety plan rate", () => {
      const insights = generateCaraInsights([makeRow({ safety_plan_in_place: true })]);
      expect(insights[0]).toContain("Safety plan rate");
      expect(insights[0]).toContain("100%");
    });
    it("insight 2 mentions critical and high alert counts when present", () => {
      const rows = [
        makeRow({ risk_level: "Immediate", safety_plan_in_place: false, multi_agency_referral: false, police_notification: false }),
      ];
      const insights = generateCaraInsights(rows);
      expect(insights[1]).toContain("critical");
      expect(insights[1]).toContain("high-priority");
    });
    it("insight 2 shows no concerns when none", () => {
      const insights = generateCaraInsights([makeRow()]);
      expect(insights[1]).toContain("No critical or high-priority concerns");
    });
    it("insight 2 contains multi-agency rate", () => {
      const insights = generateCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Multi-agency rate");
    });
    it("insight 2 contains police notification rate", () => {
      const insights = generateCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Police notification rate");
    });
    it("insight 2 contains specialist service rate", () => {
      const insights = generateCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Specialist service rate");
    });
    it("insight 3 contains reflective question about one chance rule", () => {
      const insights = generateCaraInsights([]);
      expect(insights[2]).toContain("one chance rule");
    });
    it("insight 3 mentions specialist services", () => {
      const insights = generateCaraInsights([]);
      expect(insights[2]).toContain("specialist services");
    });
    it("insight 3 mentions safe accommodation", () => {
      const insights = generateCaraInsights([]);
      expect(insights[2]).toContain("safe accommodation");
    });
    it("insight 3 mentions multi-agency", () => {
      const insights = generateCaraInsights([]);
      expect(insights[2]).toContain("multi-agency");
    });
    it("all insights are strings", () => {
      const insights = generateCaraInsights([makeRow()]);
      for (const i of insights) expect(typeof i).toBe("string");
    });
    it("empty array still produces meaningful content", () => {
      const insights = generateCaraInsights([]);
      expect(insights[0]).toContain("0 honour-based abuse risk assessments");
      expect(insights[0]).toContain("0 children");
    });
    it("single high-risk row produces all 3 insights", () => {
      const insights = generateCaraInsights([makeRow({ risk_level: "High" })]);
      expect(insights).toHaveLength(3);
      expect(insights[0]).toMatch(/^\[red\]/);
      expect(insights[1]).toMatch(/^\[amber\]/);
      expect(insights[2]).toMatch(/^\[reflect\]/);
    });
    it("insight 2 with alerts shows correct critical count", () => {
      const rows = [
        makeRow({ risk_level: "Immediate", safety_plan_in_place: false, multi_agency_referral: false }),
      ];
      const insights = generateCaraInsights(rows);
      expect(insights[1]).toContain("2 critical");
    });
    it("insight 2 with alerts shows correct high-priority count", () => {
      const rows = [
        makeRow({ risk_level: "Immediate", safety_plan_in_place: false, multi_agency_referral: false, police_notification: false }),
      ];
      const insights = generateCaraInsights(rows);
      expect(insights[1]).toContain("1 high-priority");
    });
    it("insight 1 with zero high risk shows 0", () => {
      const insights = generateCaraInsights([makeRow({ risk_level: "Low" })]);
      expect(insights[0]).toContain("0 at High or Immediate");
    });
    it("insight 1 with zero immediate shows 0", () => {
      const insights = generateCaraInsights([makeRow({ risk_level: "Low" })]);
      expect(insights[0]).toContain("0 at Immediate risk");
    });
  });

  // ── makeRow helper ──────────────────────────────────────────────────
  describe("makeRow helper", () => {
    it("produces valid default row", () => {
      const r = makeRow();
      expect(r.id).toBeDefined();
      expect(r.home_id).toBe("home-1");
      expect(r.child_name).toBe("Child A");
      expect(r.risk_level).toBe("Low");
      expect(r.abuse_type).toBe("Not Determined");
      expect(r.perpetrator_relationship).toBe("Unknown");
      expect(r.safety_plan_in_place).toBe(true);
      expect(r.multi_agency_referral).toBe(true);
      expect(r.police_notification).toBe(true);
      expect(r.specialist_service_engaged).toBe(true);
      expect(r.safe_accommodation_secured).toBe(true);
      expect(r.one_chance_rule_applied).toBe(true);
      expect(r.next_review_date).toBeNull();
      expect(r.compliance_status).toBe("Compliant");
      expect(r.assessor_name).toBe("Assessor X");
      expect(r.notes).toBeNull();
      expect(r.created_at).toBeDefined();
      expect(r.updated_at).toBeDefined();
    });
    it("overrides id", () => {
      const r = makeRow({ id: "custom-id" });
      expect(r.id).toBe("custom-id");
    });
    it("overrides risk_level", () => {
      const r = makeRow({ risk_level: "Immediate" });
      expect(r.risk_level).toBe("Immediate");
    });
    it("overrides abuse_type", () => {
      const r = makeRow({ abuse_type: "FGM" });
      expect(r.abuse_type).toBe("FGM");
    });
    it("overrides perpetrator_relationship", () => {
      const r = makeRow({ perpetrator_relationship: "Parent" });
      expect(r.perpetrator_relationship).toBe("Parent");
    });
    it("overrides compliance_status", () => {
      const r = makeRow({ compliance_status: "Escalated" });
      expect(r.compliance_status).toBe("Escalated");
    });
    it("overrides notes", () => {
      const r = makeRow({ notes: "Test note" });
      expect(r.notes).toBe("Test note");
    });
    it("overrides assessor_name", () => {
      const r = makeRow({ assessor_name: "Dr. Custom" });
      expect(r.assessor_name).toBe("Dr. Custom");
    });
    it("overrides next_review_date", () => {
      const r = makeRow({ next_review_date: "2025-12-31" });
      expect(r.next_review_date).toBe("2025-12-31");
    });
    it("generates unique ids", () => {
      const r1 = makeRow();
      const r2 = makeRow();
      expect(r1.id).not.toBe(r2.id);
    });
    it("overrides child_name", () => {
      const r = makeRow({ child_name: "Custom Child" });
      expect(r.child_name).toBe("Custom Child");
    });
    it("overrides home_id", () => {
      const r = makeRow({ home_id: "home-99" });
      expect(r.home_id).toBe("home-99");
    });
    it("overrides safety_plan_in_place", () => {
      const r = makeRow({ safety_plan_in_place: false });
      expect(r.safety_plan_in_place).toBe(false);
    });
    it("overrides multi_agency_referral", () => {
      const r = makeRow({ multi_agency_referral: false });
      expect(r.multi_agency_referral).toBe(false);
    });
    it("overrides police_notification", () => {
      const r = makeRow({ police_notification: false });
      expect(r.police_notification).toBe(false);
    });
    it("overrides specialist_service_engaged", () => {
      const r = makeRow({ specialist_service_engaged: false });
      expect(r.specialist_service_engaged).toBe(false);
    });
    it("overrides safe_accommodation_secured", () => {
      const r = makeRow({ safe_accommodation_secured: false });
      expect(r.safe_accommodation_secured).toBe(false);
    });
    it("overrides one_chance_rule_applied", () => {
      const r = makeRow({ one_chance_rule_applied: false });
      expect(r.one_chance_rule_applied).toBe(false);
    });
  });

  // ── Edge cases and boundary tests ──────────────────────────────────
  describe("Edge cases", () => {
    it("metrics handles single row correctly", () => {
      const m = computeMetrics([makeRow({
        risk_level: "Immediate",
        safety_plan_in_place: true,
        multi_agency_referral: true,
        police_notification: true,
        specialist_service_engaged: true,
        safe_accommodation_secured: true,
        one_chance_rule_applied: true,
      })]);
      expect(m.total_assessments).toBe(1);
      expect(m.high_risk_count).toBe(1);
      expect(m.immediate_count).toBe(1);
      expect(m.safety_plan_rate).toBe(100);
      expect(m.multi_agency_rate).toBe(100);
      expect(m.police_notification_rate).toBe(100);
      expect(m.specialist_rate).toBe(100);
      expect(m.safe_accommodation_rate).toBe(100);
      expect(m.one_chance_rule_rate).toBe(100);
    });

    it("alerts empty when all rows are No Identified Risk with all booleans false", () => {
      const rows = Array.from({ length: 5 }, () =>
        makeRow({
          risk_level: "No Identified Risk",
          safety_plan_in_place: false,
          multi_agency_referral: false,
          police_notification: false,
          specialist_service_engaged: false,
        }),
      );
      expect(computeAlerts(rows)).toEqual([]);
    });

    it("metrics all rates 0 when all booleans false", () => {
      const m = computeMetrics([makeRow({
        safety_plan_in_place: false,
        multi_agency_referral: false,
        police_notification: false,
        specialist_service_engaged: false,
        safe_accommodation_secured: false,
        one_chance_rule_applied: false,
      })]);
      expect(m.safety_plan_rate).toBe(0);
      expect(m.multi_agency_rate).toBe(0);
      expect(m.police_notification_rate).toBe(0);
      expect(m.specialist_rate).toBe(0);
      expect(m.safe_accommodation_rate).toBe(0);
      expect(m.one_chance_rule_rate).toBe(0);
    });

    it("metrics all rates 100 when all booleans true", () => {
      const m = computeMetrics([makeRow({
        safety_plan_in_place: true,
        multi_agency_referral: true,
        police_notification: true,
        specialist_service_engaged: true,
        safe_accommodation_secured: true,
        one_chance_rule_applied: true,
      })]);
      expect(m.safety_plan_rate).toBe(100);
      expect(m.multi_agency_rate).toBe(100);
      expect(m.police_notification_rate).toBe(100);
      expect(m.specialist_rate).toBe(100);
      expect(m.safe_accommodation_rate).toBe(100);
      expect(m.one_chance_rule_rate).toBe(100);
    });

    it("handles large number of rows", () => {
      const rows = Array.from({ length: 200 }, (_, i) =>
        makeRow({ child_name: `Child ${i}`, risk_level: i % 2 === 0 ? "High" : "Low" }),
      );
      const m = computeMetrics(rows);
      expect(m.total_assessments).toBe(200);
      expect(m.high_risk_count).toBe(100);
      expect(m.unique_children).toBe(200);
    });

    it("handles all abuse types in metrics", () => {
      const types = ["Forced Marriage", "FGM", "Honour Killing Threat", "Physical Violence", "Emotional Abuse", "Isolation", "Financial Control", "Not Determined"] as const;
      const rows = types.map((t) => makeRow({ abuse_type: t }));
      const m = computeMetrics(rows);
      expect(m.total_assessments).toBe(8);
    });

    it("handles all risk levels in metrics", () => {
      const levels = ["No Identified Risk", "Low", "Medium", "High", "Immediate"] as const;
      const rows = levels.map((l) => makeRow({ risk_level: l }));
      const m = computeMetrics(rows);
      expect(m.total_assessments).toBe(5);
      expect(m.high_risk_count).toBe(2);
      expect(m.immediate_count).toBe(1);
    });

    it("handles all perpetrator relationships", () => {
      const rels = ["Parent", "Sibling", "Extended Family", "Community Member", "Partner", "Unknown", "Other"] as const;
      const rows = rels.map((r) => makeRow({ perpetrator_relationship: r }));
      const m = computeMetrics(rows);
      expect(m.total_assessments).toBe(7);
    });

    it("handles all compliance statuses", () => {
      const statuses = ["Compliant", "Non-Compliant", "Under Review", "Escalated"] as const;
      const rows = statuses.map((s) => makeRow({ compliance_status: s }));
      const m = computeMetrics(rows);
      expect(m.total_assessments).toBe(4);
    });

    it("insights handle all-Immediate data set", () => {
      const rows = Array.from({ length: 3 }, () =>
        makeRow({ risk_level: "Immediate", safety_plan_in_place: true, multi_agency_referral: true }),
      );
      const insights = generateCaraInsights(rows);
      expect(insights).toHaveLength(3);
      expect(insights[0]).toContain("3 at High or Immediate");
    });

    it("insights handle mixed risk levels", () => {
      const rows = [
        makeRow({ risk_level: "No Identified Risk" }),
        makeRow({ risk_level: "Low" }),
        makeRow({ risk_level: "Medium" }),
        makeRow({ risk_level: "High" }),
        makeRow({ risk_level: "Immediate" }),
      ];
      const insights = generateCaraInsights(rows);
      expect(insights[0]).toContain("5 honour-based abuse risk assessments");
      expect(insights[0]).toContain("2 at High or Immediate");
    });

    it("alerts for High risk without multi-agency but with safety plan is only high_risk_no_multi_agency", () => {
      const a = computeAlerts([makeRow({
        risk_level: "High",
        safety_plan_in_place: true,
        multi_agency_referral: false,
        police_notification: true,
        specialist_service_engaged: true,
      })]);
      expect(a).toHaveLength(1);
      expect(a[0].type).toBe("high_risk_no_multi_agency");
    });

    it("alerts for High risk only missing police produces single high alert type", () => {
      const a = computeAlerts([makeRow({
        risk_level: "High",
        safety_plan_in_place: true,
        multi_agency_referral: true,
        police_notification: false,
        specialist_service_engaged: true,
      })]);
      expect(a).toHaveLength(1);
      expect(a[0].type).toBe("no_police_high_risk");
    });

    it("alerts for High risk only missing specialist produces single medium alert type", () => {
      const a = computeAlerts([makeRow({
        risk_level: "High",
        safety_plan_in_place: true,
        multi_agency_referral: true,
        police_notification: true,
        specialist_service_engaged: false,
      })]);
      expect(a).toHaveLength(1);
      expect(a[0].type).toBe("no_specialist_high_risk");
    });

    it("Low risk with all false booleans produces no alerts", () => {
      const a = computeAlerts([makeRow({
        risk_level: "Low",
        safety_plan_in_place: false,
        multi_agency_referral: false,
        police_notification: false,
        specialist_service_engaged: false,
      })]);
      expect(a).toEqual([]);
    });

    it("Medium risk with all false booleans produces no alerts", () => {
      const a = computeAlerts([makeRow({
        risk_level: "Medium",
        safety_plan_in_place: false,
        multi_agency_referral: false,
        police_notification: false,
        specialist_service_engaged: false,
      })]);
      expect(a).toEqual([]);
    });

    it("multiple Immediate rows each produce all 4 alert types", () => {
      const a = computeAlerts([
        makeRow({ risk_level: "Immediate", safety_plan_in_place: false, multi_agency_referral: false, police_notification: false, specialist_service_engaged: false }),
        makeRow({ risk_level: "Immediate", safety_plan_in_place: false, multi_agency_referral: false, police_notification: false, specialist_service_engaged: false }),
      ]);
      expect(a.filter((x) => x.type === "immediate_no_safety_plan")).toHaveLength(2);
      expect(a.filter((x) => x.type === "high_risk_no_multi_agency")).toHaveLength(2);
      expect(a.filter((x) => x.type === "no_police_high_risk")).toHaveLength(2);
      expect(a.filter((x) => x.type === "no_specialist_high_risk")).toHaveLength(2);
    });

    it("insights with all-Low data set show 0 high risk", () => {
      const rows = Array.from({ length: 4 }, () => makeRow({ risk_level: "Low" }));
      const insights = generateCaraInsights(rows);
      expect(insights[0]).toContain("0 at High or Immediate");
      expect(insights[0]).toContain("0 at Immediate risk");
    });

    it("insights with mixed booleans show correct rates", () => {
      const rows = [
        makeRow({ safety_plan_in_place: true }),
        makeRow({ safety_plan_in_place: false }),
      ];
      const insights = generateCaraInsights(rows);
      expect(insights[0]).toContain("50%");
    });

    it("rate 1 of 7 gives 14.3", () => {
      const rows = Array.from({ length: 7 }, (_, i) =>
        makeRow({ multi_agency_referral: i === 0 }),
      );
      expect(computeMetrics(rows).multi_agency_rate).toBe(14.3);
    });

    it("rate 6 of 7 gives 85.7", () => {
      const rows = Array.from({ length: 7 }, (_, i) =>
        makeRow({ one_chance_rule_applied: i < 6 }),
      );
      expect(computeMetrics(rows).one_chance_rule_rate).toBe(85.7);
    });
  });
});
