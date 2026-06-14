import { describe, it, expect } from "vitest";

import {
  RISK_LEVELS,
  EXPLOITATION_TYPES,
  NRM_DECISIONS,
  _testing,
} from "../child-modern-slavery-risk-service";

import type {
  ChildModernSlaveryRiskRow,
} from "../child-modern-slavery-risk-service";

const {
  computeModernSlaveryRiskMetrics,
  computeModernSlaveryRiskAlerts,
  generateModernSlaveryRiskCaraInsights,
} = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRow(
  overrides?: Partial<ChildModernSlaveryRiskRow>,
): ChildModernSlaveryRiskRow {
  return {
    id: "id" in (overrides ?? {}) ? overrides!.id! : crypto.randomUUID(),
    home_id: overrides?.home_id ?? "home-1",
    child_name: overrides?.child_name ?? "Child A",
    assessment_date: overrides?.assessment_date ?? now.toISOString().split("T")[0],
    risk_level: overrides?.risk_level ?? "Low",
    exploitation_type: overrides?.exploitation_type ?? "Labour",
    nrm_referral_made: overrides?.nrm_referral_made ?? true,
    nrm_decision: "nrm_decision" in (overrides ?? {}) ? (overrides!.nrm_decision ?? null) : null,
    police_notified: overrides?.police_notified ?? true,
    social_worker_notified: overrides?.social_worker_notified ?? true,
    multi_agency_referral: overrides?.multi_agency_referral ?? true,
    safety_plan_in_place: overrides?.safety_plan_in_place ?? true,
    specialist_service_involved: overrides?.specialist_service_involved ?? true,
    independent_advocate_appointed: overrides?.independent_advocate_appointed ?? true,
    missing_episodes_linked: overrides?.missing_episodes_linked ?? 0,
    review_date: "review_date" in (overrides ?? {}) ? (overrides!.review_date ?? null) : null,
    assessor_name: overrides?.assessor_name ?? "Assessor X",
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(),
    updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("child-modern-slavery-risk-service", () => {
  // ── Enum validation ──────────────────────────────────────────────────
  describe("Enum validation", () => {
    it("RISK_LEVELS has 5 values", () => { expect(RISK_LEVELS).toHaveLength(5); });
    it("RISK_LEVELS contains No Identified Risk", () => { expect(RISK_LEVELS).toContain("No Identified Risk"); });
    it("RISK_LEVELS contains Low", () => { expect(RISK_LEVELS).toContain("Low"); });
    it("RISK_LEVELS contains Medium", () => { expect(RISK_LEVELS).toContain("Medium"); });
    it("RISK_LEVELS contains High", () => { expect(RISK_LEVELS).toContain("High"); });
    it("RISK_LEVELS contains Immediate", () => { expect(RISK_LEVELS).toContain("Immediate"); });

    it("EXPLOITATION_TYPES has 7 values", () => { expect(EXPLOITATION_TYPES).toHaveLength(7); });
    it("EXPLOITATION_TYPES contains Labour", () => { expect(EXPLOITATION_TYPES).toContain("Labour"); });
    it("EXPLOITATION_TYPES contains Sexual", () => { expect(EXPLOITATION_TYPES).toContain("Sexual"); });
    it("EXPLOITATION_TYPES contains Criminal", () => { expect(EXPLOITATION_TYPES).toContain("Criminal"); });
    it("EXPLOITATION_TYPES contains Domestic Servitude", () => { expect(EXPLOITATION_TYPES).toContain("Domestic Servitude"); });
    it("EXPLOITATION_TYPES contains Organ Harvesting", () => { expect(EXPLOITATION_TYPES).toContain("Organ Harvesting"); });
    it("EXPLOITATION_TYPES contains Multiple", () => { expect(EXPLOITATION_TYPES).toContain("Multiple"); });
    it("EXPLOITATION_TYPES contains Not Determined", () => { expect(EXPLOITATION_TYPES).toContain("Not Determined"); });

    it("NRM_DECISIONS has 4 values", () => { expect(NRM_DECISIONS).toHaveLength(4); });
    it("NRM_DECISIONS contains Reasonable Grounds", () => { expect(NRM_DECISIONS).toContain("Reasonable Grounds"); });
    it("NRM_DECISIONS contains Conclusive Grounds", () => { expect(NRM_DECISIONS).toContain("Conclusive Grounds"); });
    it("NRM_DECISIONS contains Negative", () => { expect(NRM_DECISIONS).toContain("Negative"); });
    it("NRM_DECISIONS contains Pending", () => { expect(NRM_DECISIONS).toContain("Pending"); });
  });

  // ── computeModernSlaveryRiskMetrics ──────────────────────────────────
  describe("computeModernSlaveryRiskMetrics", () => {
    it("returns zeros for empty array", () => {
      const m = computeModernSlaveryRiskMetrics([]);
      expect(m.total_assessments).toBe(0);
      expect(m.high_risk_count).toBe(0);
      expect(m.nrm_referral_count).toBe(0);
      expect(m.safety_plan_rate).toBe(0);
      expect(m.multi_agency_rate).toBe(0);
      expect(m.police_notification_rate).toBe(0);
      expect(m.specialist_rate).toBe(0);
      expect(m.advocate_rate).toBe(0);
      expect(m.avg_missing_episodes).toBe(0);
      expect(m.unique_children).toBe(0);
      expect(m.unique_assessors).toBe(0);
    });
    it("total_assessments counts rows", () => { expect(computeModernSlaveryRiskMetrics([makeRow(), makeRow(), makeRow()]).total_assessments).toBe(3); });
    it("total_assessments single row", () => { expect(computeModernSlaveryRiskMetrics([makeRow()]).total_assessments).toBe(1); });

    // high_risk_count
    it("counts High as high_risk_count", () => { expect(computeModernSlaveryRiskMetrics([makeRow({ risk_level: "High" })]).high_risk_count).toBe(1); });
    it("counts Immediate as high_risk_count", () => { expect(computeModernSlaveryRiskMetrics([makeRow({ risk_level: "Immediate" })]).high_risk_count).toBe(1); });
    it("does not count Medium as high_risk_count", () => { expect(computeModernSlaveryRiskMetrics([makeRow({ risk_level: "Medium" })]).high_risk_count).toBe(0); });
    it("does not count Low as high_risk_count", () => { expect(computeModernSlaveryRiskMetrics([makeRow({ risk_level: "Low" })]).high_risk_count).toBe(0); });
    it("does not count No Identified Risk as high_risk_count", () => { expect(computeModernSlaveryRiskMetrics([makeRow({ risk_level: "No Identified Risk" })]).high_risk_count).toBe(0); });
    it("high_risk_count sums High and Immediate", () => {
      const m = computeModernSlaveryRiskMetrics([
        makeRow({ risk_level: "High" }),
        makeRow({ risk_level: "Immediate" }),
        makeRow({ risk_level: "Low" }),
      ]);
      expect(m.high_risk_count).toBe(2);
    });

    // nrm_referral_count
    it("counts nrm_referral_count when true", () => { expect(computeModernSlaveryRiskMetrics([makeRow({ nrm_referral_made: true })]).nrm_referral_count).toBe(1); });
    it("does not count nrm_referral_count when false", () => { expect(computeModernSlaveryRiskMetrics([makeRow({ nrm_referral_made: false })]).nrm_referral_count).toBe(0); });
    it("nrm_referral_count sums correctly", () => {
      const m = computeModernSlaveryRiskMetrics([
        makeRow({ nrm_referral_made: true }),
        makeRow({ nrm_referral_made: false }),
        makeRow({ nrm_referral_made: true }),
      ]);
      expect(m.nrm_referral_count).toBe(2);
    });

    // safety_plan_rate
    it("safety_plan_rate 100 when all true", () => { expect(computeModernSlaveryRiskMetrics([makeRow({ safety_plan_in_place: true })]).safety_plan_rate).toBe(100); });
    it("safety_plan_rate 0 when all false", () => { expect(computeModernSlaveryRiskMetrics([makeRow({ safety_plan_in_place: false })]).safety_plan_rate).toBe(0); });
    it("safety_plan_rate mixed 2 of 3 gives 66.7", () => {
      const m = computeModernSlaveryRiskMetrics([
        makeRow({ safety_plan_in_place: true }),
        makeRow({ safety_plan_in_place: false }),
        makeRow({ safety_plan_in_place: true }),
      ]);
      expect(m.safety_plan_rate).toBe(66.7);
    });
    it("safety_plan_rate mixed 1 of 3 gives 33.3", () => {
      const m = computeModernSlaveryRiskMetrics([
        makeRow({ safety_plan_in_place: true }),
        makeRow({ safety_plan_in_place: false }),
        makeRow({ safety_plan_in_place: false }),
      ]);
      expect(m.safety_plan_rate).toBe(33.3);
    });

    // multi_agency_rate
    it("multi_agency_rate 100 when all true", () => { expect(computeModernSlaveryRiskMetrics([makeRow({ multi_agency_referral: true })]).multi_agency_rate).toBe(100); });
    it("multi_agency_rate 0 when all false", () => { expect(computeModernSlaveryRiskMetrics([makeRow({ multi_agency_referral: false })]).multi_agency_rate).toBe(0); });
    it("multi_agency_rate mixed 1 of 2 gives 50", () => {
      const m = computeModernSlaveryRiskMetrics([
        makeRow({ multi_agency_referral: true }),
        makeRow({ multi_agency_referral: false }),
      ]);
      expect(m.multi_agency_rate).toBe(50);
    });

    // police_notification_rate
    it("police_notification_rate 100 when all true", () => { expect(computeModernSlaveryRiskMetrics([makeRow({ police_notified: true })]).police_notification_rate).toBe(100); });
    it("police_notification_rate 0 when all false", () => { expect(computeModernSlaveryRiskMetrics([makeRow({ police_notified: false })]).police_notification_rate).toBe(0); });
    it("police_notification_rate mixed 1 of 4 gives 25", () => {
      const m = computeModernSlaveryRiskMetrics([
        makeRow({ police_notified: true }),
        makeRow({ police_notified: false }),
        makeRow({ police_notified: false }),
        makeRow({ police_notified: false }),
      ]);
      expect(m.police_notification_rate).toBe(25);
    });

    // specialist_rate
    it("specialist_rate 100 when all true", () => { expect(computeModernSlaveryRiskMetrics([makeRow({ specialist_service_involved: true })]).specialist_rate).toBe(100); });
    it("specialist_rate 0 when all false", () => { expect(computeModernSlaveryRiskMetrics([makeRow({ specialist_service_involved: false })]).specialist_rate).toBe(0); });

    // advocate_rate
    it("advocate_rate 100 when all true", () => { expect(computeModernSlaveryRiskMetrics([makeRow({ independent_advocate_appointed: true })]).advocate_rate).toBe(100); });
    it("advocate_rate 0 when all false", () => { expect(computeModernSlaveryRiskMetrics([makeRow({ independent_advocate_appointed: false })]).advocate_rate).toBe(0); });
    it("advocate_rate mixed 3 of 4 gives 75", () => {
      const m = computeModernSlaveryRiskMetrics([
        makeRow({ independent_advocate_appointed: true }),
        makeRow({ independent_advocate_appointed: true }),
        makeRow({ independent_advocate_appointed: true }),
        makeRow({ independent_advocate_appointed: false }),
      ]);
      expect(m.advocate_rate).toBe(75);
    });

    // avg_missing_episodes
    it("avg_missing_episodes 0 for empty", () => { expect(computeModernSlaveryRiskMetrics([]).avg_missing_episodes).toBe(0); });
    it("avg_missing_episodes single row", () => { expect(computeModernSlaveryRiskMetrics([makeRow({ missing_episodes_linked: 5 })]).avg_missing_episodes).toBe(5); });
    it("avg_missing_episodes average of two", () => {
      const m = computeModernSlaveryRiskMetrics([
        makeRow({ missing_episodes_linked: 4 }),
        makeRow({ missing_episodes_linked: 6 }),
      ]);
      expect(m.avg_missing_episodes).toBe(5);
    });
    it("avg_missing_episodes with zero values", () => {
      const m = computeModernSlaveryRiskMetrics([
        makeRow({ missing_episodes_linked: 0 }),
        makeRow({ missing_episodes_linked: 0 }),
      ]);
      expect(m.avg_missing_episodes).toBe(0);
    });
    it("avg_missing_episodes fractional result", () => {
      const m = computeModernSlaveryRiskMetrics([
        makeRow({ missing_episodes_linked: 1 }),
        makeRow({ missing_episodes_linked: 2 }),
        makeRow({ missing_episodes_linked: 3 }),
      ]);
      expect(m.avg_missing_episodes).toBe(2);
    });

    // unique_children
    it("unique_children counts distinct child_name values", () => {
      const m = computeModernSlaveryRiskMetrics([
        makeRow({ child_name: "Alice" }),
        makeRow({ child_name: "Bob" }),
        makeRow({ child_name: "Alice" }),
      ]);
      expect(m.unique_children).toBe(2);
    });
    it("unique_children single child", () => { expect(computeModernSlaveryRiskMetrics([makeRow()]).unique_children).toBe(1); });
    it("unique_children all distinct", () => {
      const m = computeModernSlaveryRiskMetrics([
        makeRow({ child_name: "A" }),
        makeRow({ child_name: "B" }),
        makeRow({ child_name: "C" }),
      ]);
      expect(m.unique_children).toBe(3);
    });
    it("unique_children all same", () => {
      const m = computeModernSlaveryRiskMetrics([
        makeRow({ child_name: "Same" }),
        makeRow({ child_name: "Same" }),
      ]);
      expect(m.unique_children).toBe(1);
    });

    // unique_assessors
    it("unique_assessors counts distinct assessor_name values", () => {
      const m = computeModernSlaveryRiskMetrics([
        makeRow({ assessor_name: "Dr. Smith" }),
        makeRow({ assessor_name: "Dr. Jones" }),
        makeRow({ assessor_name: "Dr. Smith" }),
      ]);
      expect(m.unique_assessors).toBe(2);
    });
    it("unique_assessors single assessor", () => { expect(computeModernSlaveryRiskMetrics([makeRow()]).unique_assessors).toBe(1); });
    it("unique_assessors all distinct", () => {
      const m = computeModernSlaveryRiskMetrics([
        makeRow({ assessor_name: "A" }),
        makeRow({ assessor_name: "B" }),
        makeRow({ assessor_name: "C" }),
      ]);
      expect(m.unique_assessors).toBe(3);
    });

    // Multiple rows aggregate correctly
    it("multiple rows aggregate correctly", () => {
      const m = computeModernSlaveryRiskMetrics([
        makeRow({ risk_level: "High", safety_plan_in_place: true, nrm_referral_made: true, child_name: "A", assessor_name: "X" }),
        makeRow({ risk_level: "Immediate", safety_plan_in_place: false, nrm_referral_made: false, child_name: "B", assessor_name: "Y" }),
        makeRow({ risk_level: "Low", safety_plan_in_place: true, nrm_referral_made: true, child_name: "A", assessor_name: "X" }),
        makeRow({ risk_level: "Medium", safety_plan_in_place: false, nrm_referral_made: false, child_name: "C", assessor_name: "Z" }),
      ]);
      expect(m.total_assessments).toBe(4);
      expect(m.high_risk_count).toBe(2);
      expect(m.nrm_referral_count).toBe(2);
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
      expect(computeModernSlaveryRiskMetrics(rows).safety_plan_rate).toBe(16.7);
    });
    it("rate 5 of 6 gives 83.3", () => {
      const rows = Array.from({ length: 6 }, (_, i) =>
        makeRow({ police_notified: i < 5 }),
      );
      expect(computeModernSlaveryRiskMetrics(rows).police_notification_rate).toBe(83.3);
    });
    it("rate 2 of 7 gives 28.6", () => {
      const rows = Array.from({ length: 7 }, (_, i) =>
        makeRow({ specialist_service_involved: i < 2 }),
      );
      expect(computeModernSlaveryRiskMetrics(rows).specialist_rate).toBe(28.6);
    });
  });

  // ── computeModernSlaveryRiskAlerts ──────────────────────────────────
  describe("computeModernSlaveryRiskAlerts", () => {
    it("returns empty for empty", () => { expect(computeModernSlaveryRiskAlerts([])).toEqual([]); });
    it("returns empty for clean rows", () => { expect(computeModernSlaveryRiskAlerts([makeRow()])).toEqual([]); });

    // Critical: immediate_no_nrm
    it("fires immediate_no_nrm for Immediate risk without NRM", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "Immediate", nrm_referral_made: false, child_name: "Jo" })]);
      const f = a.find((x) => x.type === "immediate_no_nrm");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
      expect(f!.message).toContain("Jo");
      expect(f!.message).toContain("Immediate");
      expect(f!.record_id).toBeDefined();
    });
    it("does not fire immediate_no_nrm for High risk", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "High", nrm_referral_made: false })]);
      expect(a.find((x) => x.type === "immediate_no_nrm")).toBeUndefined();
    });
    it("does not fire immediate_no_nrm for Medium risk", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "Medium", nrm_referral_made: false })]);
      expect(a.find((x) => x.type === "immediate_no_nrm")).toBeUndefined();
    });
    it("does not fire immediate_no_nrm for Low risk", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "Low", nrm_referral_made: false })]);
      expect(a.find((x) => x.type === "immediate_no_nrm")).toBeUndefined();
    });
    it("does not fire immediate_no_nrm when NRM referral made", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "Immediate", nrm_referral_made: true })]);
      expect(a.find((x) => x.type === "immediate_no_nrm")).toBeUndefined();
    });
    it("immediate_no_nrm fires per-record", () => {
      const a = computeModernSlaveryRiskAlerts([
        makeRow({ id: "a-1", risk_level: "Immediate", nrm_referral_made: false }),
        makeRow({ id: "a-2", risk_level: "Immediate", nrm_referral_made: false }),
      ]);
      expect(a.filter((x) => x.type === "immediate_no_nrm")).toHaveLength(2);
    });
    it("immediate_no_nrm message contains NRM", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "Immediate", nrm_referral_made: false })]);
      const f = a.find((x) => x.type === "immediate_no_nrm");
      expect(f!.message).toContain("NRM");
    });

    // Critical: high_risk_no_safety_plan
    it("fires high_risk_no_safety_plan for High risk without safety plan", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "High", safety_plan_in_place: false, child_name: "Sam" })]);
      const f = a.find((x) => x.type === "high_risk_no_safety_plan");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("critical");
      expect(f!.message).toContain("Sam");
      expect(f!.message).toContain("High");
      expect(f!.record_id).toBeDefined();
    });
    it("fires high_risk_no_safety_plan for Immediate risk without safety plan", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "Immediate", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "high_risk_no_safety_plan")).toBeDefined();
    });
    it("does not fire high_risk_no_safety_plan for Medium risk", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "Medium", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "high_risk_no_safety_plan")).toBeUndefined();
    });
    it("does not fire high_risk_no_safety_plan for Low risk", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "Low", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "high_risk_no_safety_plan")).toBeUndefined();
    });
    it("does not fire high_risk_no_safety_plan for No Identified Risk", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "No Identified Risk", safety_plan_in_place: false })]);
      expect(a.find((x) => x.type === "high_risk_no_safety_plan")).toBeUndefined();
    });
    it("does not fire high_risk_no_safety_plan when safety plan in place", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "High", safety_plan_in_place: true })]);
      expect(a.find((x) => x.type === "high_risk_no_safety_plan")).toBeUndefined();
    });
    it("high_risk_no_safety_plan fires per-record", () => {
      const a = computeModernSlaveryRiskAlerts([
        makeRow({ id: "a-1", risk_level: "High", safety_plan_in_place: false }),
        makeRow({ id: "a-2", risk_level: "Immediate", safety_plan_in_place: false }),
      ]);
      expect(a.filter((x) => x.type === "high_risk_no_safety_plan")).toHaveLength(2);
    });
    it("high_risk_no_safety_plan message contains modern slavery", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "High", safety_plan_in_place: false })]);
      const f = a.find((x) => x.type === "high_risk_no_safety_plan");
      expect(f!.message).toContain("modern slavery");
    });

    // High: no_multi_agency_referral
    it("fires no_multi_agency_referral for Low risk without referral", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "Low", multi_agency_referral: false, child_name: "Amy" })]);
      const f = a.find((x) => x.type === "no_multi_agency_referral");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("Amy");
    });
    it("fires no_multi_agency_referral for Medium risk without referral", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "Medium", multi_agency_referral: false })]);
      expect(a.find((x) => x.type === "no_multi_agency_referral")).toBeDefined();
    });
    it("fires no_multi_agency_referral for High risk without referral", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "High", multi_agency_referral: false })]);
      expect(a.find((x) => x.type === "no_multi_agency_referral")).toBeDefined();
    });
    it("fires no_multi_agency_referral for Immediate risk without referral", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "Immediate", multi_agency_referral: false })]);
      expect(a.find((x) => x.type === "no_multi_agency_referral")).toBeDefined();
    });
    it("does not fire no_multi_agency_referral for No Identified Risk", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "No Identified Risk", multi_agency_referral: false })]);
      expect(a.find((x) => x.type === "no_multi_agency_referral")).toBeUndefined();
    });
    it("does not fire no_multi_agency_referral when referral made", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "Medium", multi_agency_referral: true })]);
      expect(a.find((x) => x.type === "no_multi_agency_referral")).toBeUndefined();
    });
    it("no_multi_agency_referral message contains modern slavery", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "Medium", multi_agency_referral: false })]);
      const f = a.find((x) => x.type === "no_multi_agency_referral");
      expect(f!.message).toContain("modern slavery");
    });
    it("no_multi_agency_referral fires per-record", () => {
      const a = computeModernSlaveryRiskAlerts([
        makeRow({ id: "a-1", risk_level: "Low", multi_agency_referral: false }),
        makeRow({ id: "a-2", risk_level: "Medium", multi_agency_referral: false }),
      ]);
      expect(a.filter((x) => x.type === "no_multi_agency_referral")).toHaveLength(2);
    });

    // Medium: no_advocate_high_risk
    it("fires no_advocate_high_risk for High risk without advocate", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "High", independent_advocate_appointed: false, child_name: "Zara" })]);
      const f = a.find((x) => x.type === "no_advocate_high_risk");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("medium");
      expect(f!.message).toContain("Zara");
    });
    it("fires no_advocate_high_risk for Immediate risk without advocate", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "Immediate", independent_advocate_appointed: false })]);
      expect(a.find((x) => x.type === "no_advocate_high_risk")).toBeDefined();
    });
    it("does not fire no_advocate_high_risk for Medium risk", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "Medium", independent_advocate_appointed: false })]);
      expect(a.find((x) => x.type === "no_advocate_high_risk")).toBeUndefined();
    });
    it("does not fire no_advocate_high_risk for Low risk", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "Low", independent_advocate_appointed: false })]);
      expect(a.find((x) => x.type === "no_advocate_high_risk")).toBeUndefined();
    });
    it("does not fire no_advocate_high_risk for No Identified Risk", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "No Identified Risk", independent_advocate_appointed: false })]);
      expect(a.find((x) => x.type === "no_advocate_high_risk")).toBeUndefined();
    });
    it("does not fire no_advocate_high_risk when advocate appointed", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "High", independent_advocate_appointed: true })]);
      expect(a.find((x) => x.type === "no_advocate_high_risk")).toBeUndefined();
    });
    it("no_advocate_high_risk fires per-record", () => {
      const a = computeModernSlaveryRiskAlerts([
        makeRow({ id: "a-1", risk_level: "High", independent_advocate_appointed: false }),
        makeRow({ id: "a-2", risk_level: "Immediate", independent_advocate_appointed: false }),
      ]);
      expect(a.filter((x) => x.type === "no_advocate_high_risk")).toHaveLength(2);
    });
    it("no_advocate_high_risk message contains modern slavery", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({ risk_level: "High", independent_advocate_appointed: false })]);
      const f = a.find((x) => x.type === "no_advocate_high_risk");
      expect(f!.message).toContain("modern slavery");
    });

    // Multiple alerts simultaneously
    it("fires multiple alert types simultaneously", () => {
      const a = computeModernSlaveryRiskAlerts([
        makeRow({
          risk_level: "Immediate",
          nrm_referral_made: false,
          safety_plan_in_place: false,
          multi_agency_referral: false,
          independent_advocate_appointed: false,
        }),
      ]);
      const types = a.map((x) => x.type);
      expect(types).toContain("immediate_no_nrm");
      expect(types).toContain("high_risk_no_safety_plan");
      expect(types).toContain("no_multi_agency_referral");
      expect(types).toContain("no_advocate_high_risk");
    });
    it("does not fire alerts for well-managed No Identified Risk row", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({
        risk_level: "No Identified Risk",
        nrm_referral_made: true,
        safety_plan_in_place: true,
        multi_agency_referral: true,
        independent_advocate_appointed: true,
      })]);
      expect(a).toEqual([]);
    });
    it("all alerts have record_id", () => {
      const a = computeModernSlaveryRiskAlerts([
        makeRow({
          id: "test-id",
          risk_level: "Immediate",
          nrm_referral_made: false,
          safety_plan_in_place: false,
          multi_agency_referral: false,
          independent_advocate_appointed: false,
        }),
      ]);
      for (const alert of a) {
        expect(alert.record_id).toBe("test-id");
      }
    });
    it("all alerts have valid severity", () => {
      const a = computeModernSlaveryRiskAlerts([
        makeRow({
          risk_level: "Immediate",
          nrm_referral_made: false,
          safety_plan_in_place: false,
          multi_agency_referral: false,
          independent_advocate_appointed: false,
        }),
      ]);
      for (const alert of a) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });
    it("critical alerts come before high alerts for same row", () => {
      const a = computeModernSlaveryRiskAlerts([
        makeRow({
          risk_level: "Immediate",
          nrm_referral_made: false,
          safety_plan_in_place: false,
          multi_agency_referral: false,
          independent_advocate_appointed: false,
        }),
      ]);
      const criticalIdx = a.findIndex((x) => x.severity === "critical");
      const highIdx = a.findIndex((x) => x.severity === "high");
      expect(criticalIdx).toBeLessThan(highIdx);
    });
    it("high alerts come before medium alerts for same row", () => {
      const a = computeModernSlaveryRiskAlerts([
        makeRow({
          risk_level: "Immediate",
          nrm_referral_made: false,
          safety_plan_in_place: false,
          multi_agency_referral: false,
          independent_advocate_appointed: false,
        }),
      ]);
      const highIdx = a.findIndex((x) => x.severity === "high");
      const mediumIdx = a.findIndex((x) => x.severity === "medium");
      expect(highIdx).toBeLessThan(mediumIdx);
    });

    // Edge: mixed rows produce correct alerts
    it("mixed rows produce correct alert counts", () => {
      const a = computeModernSlaveryRiskAlerts([
        makeRow({ risk_level: "Immediate", nrm_referral_made: false, safety_plan_in_place: false, multi_agency_referral: false, independent_advocate_appointed: false }),
        makeRow({ risk_level: "Low", multi_agency_referral: true }),
        makeRow({ risk_level: "No Identified Risk", multi_agency_referral: false }),
      ]);
      // Row 1: immediate_no_nrm, high_risk_no_safety_plan, no_multi_agency_referral, no_advocate_high_risk
      // Row 2: none (clean)
      // Row 3: No Identified Risk excluded from no_multi_agency_referral
      expect(a.filter((x) => x.type === "immediate_no_nrm")).toHaveLength(1);
      expect(a.filter((x) => x.type === "high_risk_no_safety_plan")).toHaveLength(1);
      expect(a.filter((x) => x.type === "no_multi_agency_referral")).toHaveLength(1);
      expect(a.filter((x) => x.type === "no_advocate_high_risk")).toHaveLength(1);
    });
    it("No Identified Risk row with all false booleans produces no alerts", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({
        risk_level: "No Identified Risk",
        nrm_referral_made: false,
        safety_plan_in_place: false,
        multi_agency_referral: false,
        independent_advocate_appointed: false,
      })]);
      expect(a).toEqual([]);
    });
    it("all alert messages are non-empty strings", () => {
      const a = computeModernSlaveryRiskAlerts([
        makeRow({
          risk_level: "Immediate",
          nrm_referral_made: false,
          safety_plan_in_place: false,
          multi_agency_referral: false,
          independent_advocate_appointed: false,
        }),
      ]);
      for (const alert of a) {
        expect(typeof alert.message).toBe("string");
        expect(alert.message.length).toBeGreaterThan(0);
      }
    });
    it("all alert types are non-empty strings", () => {
      const a = computeModernSlaveryRiskAlerts([
        makeRow({
          risk_level: "Immediate",
          nrm_referral_made: false,
          safety_plan_in_place: false,
          multi_agency_referral: false,
          independent_advocate_appointed: false,
        }),
      ]);
      for (const alert of a) {
        expect(typeof alert.type).toBe("string");
        expect(alert.type.length).toBeGreaterThan(0);
      }
    });
  });

  // ── generateModernSlaveryRiskCaraInsights ─────────────────────────────
  describe("generateModernSlaveryRiskCaraInsights", () => {
    it("returns 3 insights for empty data", () => {
      const insights = generateModernSlaveryRiskCaraInsights([]);
      expect(insights).toHaveLength(3);
    });
    it("returns 3 insights for populated data", () => {
      const insights = generateModernSlaveryRiskCaraInsights([makeRow(), makeRow()]);
      expect(insights).toHaveLength(3);
    });
    it("insight 1 starts with [red]", () => {
      expect(generateModernSlaveryRiskCaraInsights([])[0]).toMatch(/^\[red\]/);
    });
    it("insight 2 starts with [amber]", () => {
      expect(generateModernSlaveryRiskCaraInsights([])[1]).toMatch(/^\[amber\]/);
    });
    it("insight 3 starts with [reflect]", () => {
      expect(generateModernSlaveryRiskCaraInsights([])[2]).toMatch(/^\[reflect\]/);
    });
    it("insight 1 contains total assessments count", () => {
      const insights = generateModernSlaveryRiskCaraInsights([makeRow(), makeRow()]);
      expect(insights[0]).toContain("2 modern slavery risk assessments");
    });
    it("insight 1 contains unique children count", () => {
      const insights = generateModernSlaveryRiskCaraInsights([makeRow({ child_name: "A" }), makeRow({ child_name: "B" })]);
      expect(insights[0]).toContain("2 children");
    });
    it("insight 1 uses singular child for 1", () => {
      const insights = generateModernSlaveryRiskCaraInsights([makeRow()]);
      expect(insights[0]).toContain("1 child");
    });
    it("insight 1 contains high risk count", () => {
      const insights = generateModernSlaveryRiskCaraInsights([
        makeRow({ risk_level: "High" }),
        makeRow({ risk_level: "Immediate" }),
      ]);
      expect(insights[0]).toContain("2 at High or Immediate");
    });
    it("insight 1 contains NRM referral count", () => {
      const insights = generateModernSlaveryRiskCaraInsights([makeRow({ nrm_referral_made: true })]);
      expect(insights[0]).toContain("1 NRM referral");
    });
    it("insight 1 uses plural referrals for multiple", () => {
      const insights = generateModernSlaveryRiskCaraInsights([
        makeRow({ nrm_referral_made: true }),
        makeRow({ nrm_referral_made: true }),
      ]);
      expect(insights[0]).toContain("2 NRM referrals");
    });
    it("insight 1 contains safety plan rate", () => {
      const insights = generateModernSlaveryRiskCaraInsights([makeRow({ safety_plan_in_place: true })]);
      expect(insights[0]).toContain("Safety plan rate");
      expect(insights[0]).toContain("100%");
    });
    it("insight 2 mentions critical and high alert counts when present", () => {
      const rows = [
        makeRow({ risk_level: "Immediate", nrm_referral_made: false, safety_plan_in_place: false, multi_agency_referral: false }),
      ];
      const insights = generateModernSlaveryRiskCaraInsights(rows);
      expect(insights[1]).toContain("critical");
      expect(insights[1]).toContain("high-priority");
    });
    it("insight 2 shows no concerns when none", () => {
      const insights = generateModernSlaveryRiskCaraInsights([makeRow()]);
      expect(insights[1]).toContain("No critical or high-priority concerns");
    });
    it("insight 2 contains multi-agency rate", () => {
      const insights = generateModernSlaveryRiskCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Multi-agency rate");
    });
    it("insight 2 contains police notification rate", () => {
      const insights = generateModernSlaveryRiskCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Police notification rate");
    });
    it("insight 2 contains specialist service rate", () => {
      const insights = generateModernSlaveryRiskCaraInsights([makeRow()]);
      expect(insights[1]).toContain("Specialist service rate");
    });
    it("insight 3 contains reflective question about NRM", () => {
      const insights = generateModernSlaveryRiskCaraInsights([]);
      expect(insights[2]).toContain("NRM");
    });
    it("insight 3 mentions specialist services", () => {
      const insights = generateModernSlaveryRiskCaraInsights([]);
      expect(insights[2]).toContain("specialist services");
    });
    it("insight 3 mentions independent advocacy", () => {
      const insights = generateModernSlaveryRiskCaraInsights([]);
      expect(insights[2]).toContain("independent advocacy");
    });
    it("insight 3 mentions multi-agency", () => {
      const insights = generateModernSlaveryRiskCaraInsights([]);
      expect(insights[2]).toContain("multi-agency");
    });
    it("all insights are strings", () => {
      const insights = generateModernSlaveryRiskCaraInsights([makeRow()]);
      for (const i of insights) expect(typeof i).toBe("string");
    });
    it("empty array still produces meaningful content", () => {
      const insights = generateModernSlaveryRiskCaraInsights([]);
      expect(insights[0]).toContain("0 modern slavery risk assessments");
      expect(insights[0]).toContain("0 children");
    });
    it("single high-risk row produces all 3 insights", () => {
      const insights = generateModernSlaveryRiskCaraInsights([makeRow({ risk_level: "High" })]);
      expect(insights).toHaveLength(3);
      expect(insights[0]).toMatch(/^\[red\]/);
      expect(insights[1]).toMatch(/^\[amber\]/);
      expect(insights[2]).toMatch(/^\[reflect\]/);
    });
    it("insight 2 with alerts shows correct critical count", () => {
      const rows = [
        makeRow({ risk_level: "Immediate", nrm_referral_made: false, safety_plan_in_place: false }),
      ];
      const insights = generateModernSlaveryRiskCaraInsights(rows);
      expect(insights[1]).toContain("2 critical");
    });
    it("insight 2 with alerts shows correct high-priority count", () => {
      const rows = [
        makeRow({ risk_level: "Immediate", nrm_referral_made: false, safety_plan_in_place: false, multi_agency_referral: false }),
      ];
      const insights = generateModernSlaveryRiskCaraInsights(rows);
      expect(insights[1]).toContain("1 high-priority");
    });
    it("insight 1 with zero high risk shows 0", () => {
      const insights = generateModernSlaveryRiskCaraInsights([makeRow({ risk_level: "Low" })]);
      expect(insights[0]).toContain("0 at High or Immediate");
    });
    it("insight 1 with zero NRM referrals shows 0", () => {
      const insights = generateModernSlaveryRiskCaraInsights([makeRow({ nrm_referral_made: false })]);
      expect(insights[0]).toContain("0 NRM referrals");
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
      expect(r.exploitation_type).toBe("Labour");
      expect(r.nrm_referral_made).toBe(true);
      expect(r.nrm_decision).toBeNull();
      expect(r.police_notified).toBe(true);
      expect(r.social_worker_notified).toBe(true);
      expect(r.multi_agency_referral).toBe(true);
      expect(r.safety_plan_in_place).toBe(true);
      expect(r.specialist_service_involved).toBe(true);
      expect(r.independent_advocate_appointed).toBe(true);
      expect(r.missing_episodes_linked).toBe(0);
      expect(r.review_date).toBeNull();
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
    it("overrides exploitation_type", () => {
      const r = makeRow({ exploitation_type: "Sexual" });
      expect(r.exploitation_type).toBe("Sexual");
    });
    it("overrides nrm_decision", () => {
      const r = makeRow({ nrm_decision: "Pending" });
      expect(r.nrm_decision).toBe("Pending");
    });
    it("overrides missing_episodes_linked", () => {
      const r = makeRow({ missing_episodes_linked: 10 });
      expect(r.missing_episodes_linked).toBe(10);
    });
    it("overrides notes", () => {
      const r = makeRow({ notes: "Test note" });
      expect(r.notes).toBe("Test note");
    });
    it("overrides assessor_name", () => {
      const r = makeRow({ assessor_name: "Dr. Custom" });
      expect(r.assessor_name).toBe("Dr. Custom");
    });
    it("overrides review_date", () => {
      const r = makeRow({ review_date: "2025-12-31" });
      expect(r.review_date).toBe("2025-12-31");
    });
    it("generates unique ids", () => {
      const r1 = makeRow();
      const r2 = makeRow();
      expect(r1.id).not.toBe(r2.id);
    });
  });

  // ── Edge cases and boundary tests ──────────────────────────────────
  describe("Edge cases", () => {
    it("metrics handles single row correctly", () => {
      const m = computeModernSlaveryRiskMetrics([makeRow({
        risk_level: "Immediate",
        safety_plan_in_place: true,
        multi_agency_referral: true,
        police_notified: true,
        specialist_service_involved: true,
        independent_advocate_appointed: true,
        nrm_referral_made: true,
        missing_episodes_linked: 3,
      })]);
      expect(m.total_assessments).toBe(1);
      expect(m.high_risk_count).toBe(1);
      expect(m.nrm_referral_count).toBe(1);
      expect(m.safety_plan_rate).toBe(100);
      expect(m.multi_agency_rate).toBe(100);
      expect(m.police_notification_rate).toBe(100);
      expect(m.specialist_rate).toBe(100);
      expect(m.advocate_rate).toBe(100);
      expect(m.avg_missing_episodes).toBe(3);
    });

    it("alerts empty when all rows are No Identified Risk with all booleans false", () => {
      const rows = Array.from({ length: 5 }, () =>
        makeRow({
          risk_level: "No Identified Risk",
          nrm_referral_made: false,
          safety_plan_in_place: false,
          multi_agency_referral: false,
          independent_advocate_appointed: false,
        }),
      );
      expect(computeModernSlaveryRiskAlerts(rows)).toEqual([]);
    });

    it("metrics all rates 0 when all booleans false", () => {
      const m = computeModernSlaveryRiskMetrics([makeRow({
        safety_plan_in_place: false,
        multi_agency_referral: false,
        police_notified: false,
        specialist_service_involved: false,
        independent_advocate_appointed: false,
        nrm_referral_made: false,
      })]);
      expect(m.safety_plan_rate).toBe(0);
      expect(m.multi_agency_rate).toBe(0);
      expect(m.police_notification_rate).toBe(0);
      expect(m.specialist_rate).toBe(0);
      expect(m.advocate_rate).toBe(0);
      expect(m.nrm_referral_count).toBe(0);
    });

    it("metrics all rates 100 when all booleans true", () => {
      const m = computeModernSlaveryRiskMetrics([makeRow({
        safety_plan_in_place: true,
        multi_agency_referral: true,
        police_notified: true,
        specialist_service_involved: true,
        independent_advocate_appointed: true,
        nrm_referral_made: true,
      })]);
      expect(m.safety_plan_rate).toBe(100);
      expect(m.multi_agency_rate).toBe(100);
      expect(m.police_notification_rate).toBe(100);
      expect(m.specialist_rate).toBe(100);
      expect(m.advocate_rate).toBe(100);
    });

    it("handles large number of rows", () => {
      const rows = Array.from({ length: 200 }, (_, i) =>
        makeRow({ child_name: `Child ${i}`, risk_level: i % 2 === 0 ? "High" : "Low" }),
      );
      const m = computeModernSlaveryRiskMetrics(rows);
      expect(m.total_assessments).toBe(200);
      expect(m.high_risk_count).toBe(100);
      expect(m.unique_children).toBe(200);
    });

    it("handles all exploitation types in metrics", () => {
      const types = ["Labour", "Sexual", "Criminal", "Domestic Servitude", "Organ Harvesting", "Multiple", "Not Determined"] as const;
      const rows = types.map((t) => makeRow({ exploitation_type: t }));
      const m = computeModernSlaveryRiskMetrics(rows);
      expect(m.total_assessments).toBe(7);
    });

    it("handles all risk levels in metrics", () => {
      const levels = ["No Identified Risk", "Low", "Medium", "High", "Immediate"] as const;
      const rows = levels.map((l) => makeRow({ risk_level: l }));
      const m = computeModernSlaveryRiskMetrics(rows);
      expect(m.total_assessments).toBe(5);
      expect(m.high_risk_count).toBe(2);
    });

    it("handles all NRM decisions", () => {
      const decisions = ["Reasonable Grounds", "Conclusive Grounds", "Negative", "Pending"] as const;
      const rows = decisions.map((d) => makeRow({ nrm_decision: d }));
      const m = computeModernSlaveryRiskMetrics(rows);
      expect(m.total_assessments).toBe(4);
    });

    it("avg_missing_episodes with large values", () => {
      const m = computeModernSlaveryRiskMetrics([
        makeRow({ missing_episodes_linked: 100 }),
        makeRow({ missing_episodes_linked: 200 }),
      ]);
      expect(m.avg_missing_episodes).toBe(150);
    });

    it("insights handle all-Immediate data set", () => {
      const rows = Array.from({ length: 3 }, () =>
        makeRow({ risk_level: "Immediate", nrm_referral_made: true, safety_plan_in_place: true }),
      );
      const insights = generateModernSlaveryRiskCaraInsights(rows);
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
      const insights = generateModernSlaveryRiskCaraInsights(rows);
      expect(insights[0]).toContain("5 modern slavery risk assessments");
      expect(insights[0]).toContain("2 at High or Immediate");
    });

    it("alerts for High risk without safety plan but with NRM is only high_risk_no_safety_plan", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({
        risk_level: "High",
        nrm_referral_made: true,
        safety_plan_in_place: false,
        multi_agency_referral: true,
        independent_advocate_appointed: true,
      })]);
      expect(a).toHaveLength(1);
      expect(a[0].type).toBe("high_risk_no_safety_plan");
    });

    it("alerts for Medium risk only missing multi_agency produces single alert", () => {
      const a = computeModernSlaveryRiskAlerts([makeRow({
        risk_level: "Medium",
        multi_agency_referral: false,
        nrm_referral_made: true,
        safety_plan_in_place: true,
        independent_advocate_appointed: true,
      })]);
      expect(a).toHaveLength(1);
      expect(a[0].type).toBe("no_multi_agency_referral");
    });
  });
});
