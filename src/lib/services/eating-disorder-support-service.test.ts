import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateEatingDisorderSupport,
  generateCaraInsights,
  type EatingDisorderSupportRow,
} from "./eating-disorder-support-service";

function makeRow(overrides: Partial<EatingDisorderSupportRow> = {}): EatingDisorderSupportRow {
  return {
    id: "row-1",
    home_id: "home-1",
    child_name: "Child A",
    assessment_date: "2026-05-01",
    lead_professional: "Dr Smith",
    concern_type: "Anorexia Nervosa",
    risk_level: "Medium",
    weight_monitoring_in_place: true,
    gp_consulted: true,
    specialist_referral_made: true,
    specialist_service: "CAMHS ED",
    camhs_engaged: true,
    dietitian_involved: true,
    meal_plan_in_place: true,
    supervised_meals: false,
    bathroom_supervision: false,
    exercise_monitoring: false,
    purging_behaviours_identified: false,
    food_restriction_identified: false,
    binge_behaviours_identified: false,
    self_induced_vomiting: false,
    laxative_misuse: false,
    body_weight_status: "Healthy Weight",
    young_person_engaged: true,
    family_involved: true,
    school_aware: true,
    social_worker_informed: true,
    review_date: null,
    status: "Active",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("eating-disorder-support-service", () => {
  // ── computeMetrics ────────────────────────────────────────────────

  describe("computeMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeMetrics([]);
      expect(m.total_records).toBe(0);
      expect(m.unique_children).toBe(0);
      expect(m.active_cases).toBe(0);
      expect(m.specialist_referral_rate).toBe(0);
      expect(m.recovery_count).toBe(0);
    });

    it("computes counts and rates for populated data", () => {
      const rows = [
        makeRow({ id: "1", child_name: "A", status: "Active", risk_level: "High", specialist_referral_made: true, gp_consulted: true }),
        makeRow({ id: "2", child_name: "B", status: "Relapse", risk_level: "Critical", specialist_referral_made: false, gp_consulted: false }),
        makeRow({ id: "3", child_name: "C", status: "Recovery", risk_level: "Low", specialist_referral_made: true, gp_consulted: true }),
      ];
      const m = computeMetrics(rows);
      expect(m.total_records).toBe(3);
      expect(m.unique_children).toBe(3);
      expect(m.active_cases).toBe(2); // Active + Relapse
      expect(m.high_risk_count).toBe(1);
      expect(m.critical_count).toBe(1);
      expect(m.recovery_count).toBe(1);
      expect(m.relapse_count).toBe(1);
      // 2/3 specialist referrals = 66.7%
      expect(m.specialist_referral_rate).toBe(66.7);
      expect(m.gp_consulted_rate).toBe(66.7);
    });

    it("builds by_concern_type and by_risk_level breakdowns", () => {
      const rows = [
        makeRow({ id: "1", concern_type: "ARFID", risk_level: "High" }),
        makeRow({ id: "2", concern_type: "ARFID", risk_level: "Low" }),
      ];
      const m = computeMetrics(rows);
      expect(m.by_concern_type["ARFID"]).toBe(2);
      expect(m.by_risk_level["High"]).toBe(1);
      expect(m.by_risk_level["Low"]).toBe(1);
    });
  });

  // ── computeAlerts ─────────────────────────────────────────────────

  describe("computeAlerts", () => {
    it("returns empty alerts for empty data", () => {
      expect(computeAlerts([])).toHaveLength(0);
    });

    it("fires sig_underweight_no_specialist for significantly underweight active without specialist", () => {
      const row = makeRow({
        body_weight_status: "Significantly Underweight",
        specialist_referral_made: false,
        status: "Active",
      });
      const alerts = computeAlerts([row]);
      const found = alerts.filter((a) => a.type === "sig_underweight_no_specialist");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("critical");
    });

    it("fires critical_no_gp for critical risk without GP", () => {
      const row = makeRow({
        risk_level: "Critical",
        gp_consulted: false,
        status: "Active",
      });
      const alerts = computeAlerts([row]);
      const found = alerts.filter((a) => a.type === "critical_no_gp");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("critical");
    });

    it("fires vomiting_no_medical for self-induced vomiting without medical oversight", () => {
      const row = makeRow({
        self_induced_vomiting: true,
        gp_consulted: false,
        specialist_referral_made: false,
        status: "Active",
      });
      const alerts = computeAlerts([row]);
      const found = alerts.filter((a) => a.type === "vomiting_no_medical");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("critical");
    });

    it("fires anorexia_no_weight_monitoring for anorexia without weight monitoring", () => {
      const row = makeRow({
        concern_type: "Anorexia Nervosa",
        weight_monitoring_in_place: false,
        status: "Active",
      });
      const alerts = computeAlerts([row]);
      const found = alerts.filter((a) => a.type === "anorexia_no_weight_monitoring");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires high_risk_no_meal_plan for high/critical risk without meal plan", () => {
      const row = makeRow({
        risk_level: "High",
        meal_plan_in_place: false,
        status: "Active",
      });
      const alerts = computeAlerts([row]);
      const found = alerts.filter((a) => a.type === "high_risk_no_meal_plan");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires relapse_no_camhs for Relapse status without CAMHS", () => {
      const row = makeRow({
        status: "Relapse",
        camhs_engaged: false,
      });
      const alerts = computeAlerts([row]);
      const found = alerts.filter((a) => a.type === "relapse_no_camhs");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("high");
    });

    it("fires arfid_no_dietitian for ARFID without dietitian", () => {
      const row = makeRow({
        concern_type: "ARFID",
        dietitian_involved: false,
        status: "Active",
      });
      const alerts = computeAlerts([row]);
      const found = alerts.filter((a) => a.type === "arfid_no_dietitian");
      expect(found).toHaveLength(1);
      expect(found[0].severity).toBe("medium");
    });
  });

  // ── validateEatingDisorderSupport ─────────────────────────────────

  describe("validateEatingDisorderSupport", () => {
    it("returns valid for correct input", () => {
      const result = validateEatingDisorderSupport({
        childName: "Child A",
        assessmentDate: "2026-05-01",
        leadProfessional: "Dr Smith",
        concernType: "Anorexia Nervosa",
        riskLevel: "Medium",
        bodyWeightStatus: "Healthy Weight",
        status: "Active",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns errors for missing required fields", () => {
      const result = validateEatingDisorderSupport({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(5);
    });

    it("requires specialist service when referral made", () => {
      const result = validateEatingDisorderSupport({
        childName: "Child A",
        assessmentDate: "2026-05-01",
        leadProfessional: "Dr Smith",
        concernType: "Anorexia Nervosa",
        riskLevel: "Medium",
        bodyWeightStatus: "Healthy Weight",
        specialistReferralMade: true,
        specialistService: null,
      });
      expect(result.errors).toContain(
        "Specialist service name is required when a specialist referral has been made",
      );
    });

    it("requires purging behaviours when self-induced vomiting is recorded", () => {
      const result = validateEatingDisorderSupport({
        childName: "Child A",
        assessmentDate: "2026-05-01",
        leadProfessional: "Dr Smith",
        concernType: "Bulimia Nervosa",
        riskLevel: "High",
        bodyWeightStatus: "Healthy Weight",
        selfInducedVomiting: true,
        purgingBehavioursIdentified: false,
      });
      expect(result.errors).toContain(
        "Purging behaviours should be identified when self-induced vomiting is recorded",
      );
    });

    it("requires specialist referral for critical risk", () => {
      const result = validateEatingDisorderSupport({
        childName: "Child A",
        assessmentDate: "2026-05-01",
        leadProfessional: "Dr Smith",
        concernType: "Anorexia Nervosa",
        riskLevel: "Critical",
        bodyWeightStatus: "Significantly Underweight",
        specialistReferralMade: false,
      });
      expect(result.errors).toContain(
        "Critical risk cases should have a specialist referral per NICE NG69",
      );
    });
  });

  // ── generateCaraInsights ──────────────────────────────────────────

  describe("generateCaraInsights", () => {
    it("returns 3 insights for populated data", () => {
      const rows = [makeRow()];
      const insights = generateCaraInsights(rows);
      expect(insights).toHaveLength(3);
      expect(insights[0]).toContain("[sky]");
      expect(insights[1]).toContain("[amber]");
      expect(insights[2]).toContain("[reflect]");
    });
  });
});
