import { describe, it, expect } from "vitest";
import {
  computeAdmissionMetrics,
  identifyAdmissionAlerts,
  type EmergencyAdmission,
} from "./emergency-admissions-service";

function makeAdmission(overrides: Partial<EmergencyAdmission> = {}): EmergencyAdmission {
  return {
    id: "adm-1",
    home_id: "home-1",
    child_name: "Child A",
    child_id: "child-1",
    admission_date: "2026-05-01",
    admission_type: "planned",
    referral_source: "local_authority",
    matching_outcome: "good_match",
    impact_on_existing_children: "no_impact",
    risk_assessment_completed: true,
    placement_plan_within_24h: true,
    social_worker_contacted: true,
    ofsted_notified: true,
    existing_children_consulted: true,
    staff_briefed: true,
    child_needs_identified: true,
    child_views_captured: true,
    disruption_to_placement: false,
    admission_approved_by: "Manager",
    review_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("emergency-admissions-service", () => {
  // ── computeAdmissionMetrics ───────────────────────────────────────

  describe("computeAdmissionMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeAdmissionMetrics([]);
      expect(m.total_admissions).toBe(0);
      expect(m.emergency_count).toBe(0);
      expect(m.crisis_count).toBe(0);
      expect(m.planned_count).toBe(0);
      expect(m.risk_assessment_rate).toBeNull();;
      expect(m.good_match_rate).toBeNull();;
    });

    it("counts admission types correctly", () => {
      const admissions = [
        makeAdmission({ id: "1", admission_type: "emergency" }),
        makeAdmission({ id: "2", admission_type: "crisis" }),
        makeAdmission({ id: "3", admission_type: "planned" }),
        makeAdmission({ id: "4", admission_type: "emergency" }),
      ];
      const m = computeAdmissionMetrics(admissions);
      expect(m.total_admissions).toBe(4);
      expect(m.emergency_count).toBe(2);
      expect(m.crisis_count).toBe(1);
      expect(m.planned_count).toBe(1);
    });

    it("computes rates correctly", () => {
      const admissions = [
        makeAdmission({ id: "1", risk_assessment_completed: true, placement_plan_within_24h: true, social_worker_contacted: true }),
        makeAdmission({ id: "2", risk_assessment_completed: false, placement_plan_within_24h: false, social_worker_contacted: false }),
      ];
      const m = computeAdmissionMetrics(admissions);
      expect(m.risk_assessment_rate).toBe(50);
      expect(m.placement_plan_rate).toBe(50);
      expect(m.social_worker_contacted_rate).toBe(50);
    });

    it("computes good_match_rate only from assessed admissions", () => {
      const admissions = [
        makeAdmission({ id: "1", matching_outcome: "good_match" }),
        makeAdmission({ id: "2", matching_outcome: "poor_match" }),
        makeAdmission({ id: "3", matching_outcome: "not_assessed" }),
      ];
      const m = computeAdmissionMetrics(admissions);
      // Only 2 assessed. 1 good match out of 2 = 50%
      expect(m.good_match_rate).toBe(50);
      expect(m.poor_match_count).toBe(1);
    });

    it("counts significant impact and disruption", () => {
      const admissions = [
        makeAdmission({ id: "1", impact_on_existing_children: "significant_impact", disruption_to_placement: true }),
        makeAdmission({ id: "2", impact_on_existing_children: "no_impact", disruption_to_placement: false }),
      ];
      const m = computeAdmissionMetrics(admissions);
      expect(m.significant_impact_count).toBe(1);
      expect(m.disruption_count).toBe(1);
    });
  });

  // ── identifyAdmissionAlerts ───────────────────────────────────────

  describe("identifyAdmissionAlerts", () => {
    it("returns empty alerts for empty data", () => {
      expect(identifyAdmissionAlerts([])).toHaveLength(0);
    });

    it("fires significant_impact alert (critical)", () => {
      const adm = makeAdmission({
        id: "si-1",
        impact_on_existing_children: "significant_impact",
      });
      const alerts = identifyAdmissionAlerts([adm]);
      const found = alerts.filter((a) => a.type === "significant_impact");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("critical");
    });

    it("fires no_risk_assessment for emergency/crisis without risk assessment (high)", () => {
      const adm = makeAdmission({
        id: "nr-1",
        admission_type: "emergency",
        risk_assessment_completed: false,
      });
      const alerts = identifyAdmissionAlerts([adm]);
      const found = alerts.filter((a) => a.type === "no_risk_assessment");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires poor_match alert (high)", () => {
      const adm = makeAdmission({
        id: "pm-1",
        matching_outcome: "poor_match",
      });
      const alerts = identifyAdmissionAlerts([adm]);
      const found = alerts.filter((a) => a.type === "poor_match");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires children_not_consulted for non-planned admissions (medium)", () => {
      const adm = makeAdmission({
        id: "nc-1",
        admission_type: "emergency",
        existing_children_consulted: false,
      });
      const alerts = identifyAdmissionAlerts([adm]);
      const found = alerts.filter((a) => a.type === "children_not_consulted");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("medium");
    });

    it("fires no_placement_plan when >= 1 without plan (medium)", () => {
      const adm = makeAdmission({
        id: "np-1",
        placement_plan_within_24h: false,
      });
      const alerts = identifyAdmissionAlerts([adm]);
      const found = alerts.filter((a) => a.type === "no_placement_plan");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("medium");
    });

    it("does not fire no_risk_assessment for planned admission without assessment", () => {
      const adm = makeAdmission({
        id: "nra-2",
        admission_type: "planned",
        risk_assessment_completed: false,
      });
      const alerts = identifyAdmissionAlerts([adm]);
      const found = alerts.filter((a) => a.type === "no_risk_assessment");
      expect(found).toHaveLength(0);
    });
  });
});
