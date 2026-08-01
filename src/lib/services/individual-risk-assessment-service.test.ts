import { describe, it, expect } from "vitest";
import {
  computeIndividualRiskMetrics,
  identifyIndividualRiskAlerts,
  type IndividualRiskAssessment,
} from "./individual-risk-assessment-service";

function makeAssessment(overrides: Partial<IndividualRiskAssessment> = {}): IndividualRiskAssessment {
  return {
    id: "assess-1",
    home_id: "home-1",
    child_name: "Alex Smith",
    child_id: "child-1",
    risk_domain: "self_harm",
    risk_rating: "medium",
    assessment_status: "current",
    assessed_by: "Jane Doe",
    assessment_date: "2026-05-01",
    review_date: "2026-08-01",
    review_trigger: "scheduled",
    risk_indicators: ["Previous SH history"],
    protective_factors: ["Good relationships"],
    management_strategies: ["Daily check-ins"],
    triggers: ["Family contact"],
    staff_aware: true,
    staff_briefed_date: "2026-05-02",
    multi_agency_involved: false,
    social_worker_informed: true,
    child_involved_in_plan: true,
    parent_informed: true,
    linked_incident_ids: [],
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("individual-risk-assessment-service", () => {
  // -- computeIndividualRiskMetrics ----------------------------------------------

  describe("computeIndividualRiskMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeIndividualRiskMetrics([], 4);
      expect(m.total_assessments).toBe(0);
      expect(m.children_assessed).toBe(0);
      expect(m.assessment_coverage).toBe(0);
      expect(m.very_high_count).toBe(0);
      expect(m.staff_aware_rate).toBeNull();; expect(m.average_per_child).toBeNull();; expect(m.average_strategies_per_assessment).toBeNull();; });

    it("computes counts and coverage correctly", () => {
      const assessments = [
        makeAssessment({ risk_rating: "very_high", assessment_status: "current" }),
        makeAssessment({ id: "a2", child_id: "child-2", risk_rating: "high", assessment_status: "expired" }),
        makeAssessment({ id: "a3", child_id: "child-1", risk_rating: "low", assessment_status: "under_review" }),
      ];
      const m = computeIndividualRiskMetrics(assessments, 4);
      expect(m.total_assessments).toBe(3);
      expect(m.children_assessed).toBe(2);
      expect(m.assessment_coverage).toBe(50);
      expect(m.current_count).toBe(1);
      expect(m.expired_count).toBe(1);
      expect(m.under_review_count).toBe(1);
      expect(m.very_high_count).toBe(1);
      expect(m.high_count).toBe(1);
      expect(m.low_count).toBe(1);
      expect(m.average_per_child).toBe(1.5);
    });

    it("computes boolean rates", () => {
      const assessments = [
        makeAssessment({ staff_aware: true, multi_agency_involved: true, child_involved_in_plan: true, parent_informed: false }),
        makeAssessment({ id: "a2", staff_aware: false, multi_agency_involved: false, child_involved_in_plan: false, parent_informed: true }),
      ];
      const m = computeIndividualRiskMetrics(assessments, 4);
      expect(m.staff_aware_rate).toBe(50);
      expect(m.multi_agency_rate).toBe(50);
      expect(m.child_involved_rate).toBe(50);
      expect(m.parent_informed_rate).toBe(50);
    });

    it("computes average strategies per assessment", () => {
      const assessments = [
        makeAssessment({ management_strategies: ["a", "b", "c"] }),
        makeAssessment({ id: "a2", management_strategies: ["x"] }),
      ];
      const m = computeIndividualRiskMetrics(assessments, 4);
      expect(m.average_strategies_per_assessment).toBe(2);
    });

    it("builds breakdown records", () => {
      const assessments = [
        makeAssessment({ risk_domain: "self_harm", review_trigger: "incident" }),
      ];
      const m = computeIndividualRiskMetrics(assessments, 4);
      expect(m.by_risk_domain["self_harm"]).toBe(1);
      expect(m.by_review_trigger["incident"]).toBe(1);
    });
  });

  // -- identifyIndividualRiskAlerts -----------------------------------------------

  describe("identifyIndividualRiskAlerts", () => {
    it("returns no alerts for empty data with no children", () => {
      expect(identifyIndividualRiskAlerts([], 0)).toHaveLength(0);
    });

    it("fires critical very_high_risk for current very_high rated assessment", () => {
      const assessments = [makeAssessment({ risk_rating: "very_high", assessment_status: "current" })];
      const alerts = identifyIndividualRiskAlerts(assessments, 4);
      const vhr = alerts.find((a) => a.type === "very_high_risk");
      expect(vhr).toBeDefined();
      expect(vhr!.severity).toBe("critical");
    });

    it("fires critical expired_high_risk for expired high/very_high assessment", () => {
      const assessments = [makeAssessment({ risk_rating: "high", assessment_status: "expired" })];
      const alerts = identifyIndividualRiskAlerts(assessments, 4);
      expect(alerts.find((a) => a.type === "expired_high_risk")).toBeDefined();
    });

    it("fires high staff_not_aware for current high risk with staff unaware", () => {
      const assessments = [
        makeAssessment({ risk_rating: "high", assessment_status: "current", staff_aware: false }),
      ];
      const alerts = identifyIndividualRiskAlerts(assessments, 4);
      const sna = alerts.find((a) => a.type === "staff_not_aware");
      expect(sna).toBeDefined();
      expect(sna!.severity).toBe("high");
    });

    it("fires high no_strategies for current assessment with empty strategies", () => {
      const assessments = [makeAssessment({ management_strategies: [] })];
      const alerts = identifyIndividualRiskAlerts(assessments, 4);
      expect(alerts.find((a) => a.type === "no_strategies")).toBeDefined();
    });

    it("fires medium no_assessment when children are unassessed", () => {
      const assessments = [makeAssessment()]; // only child-1 assessed
      const alerts = identifyIndividualRiskAlerts(assessments, 4);
      const gap = alerts.find((a) => a.type === "no_assessment");
      expect(gap).toBeDefined();
      expect(gap!.severity).toBe("medium");
      expect(gap!.message).toContain("3 children have");
    });
  });
});
