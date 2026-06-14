import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  generateCaraInsights,
  validateIndependentTravel,
  type IndependentTravelRow,
} from "./independent-travel-service";

function makeRow(overrides: Partial<IndependentTravelRow> = {}): IndependentTravelRow {
  return {
    id: "row-1",
    home_id: "home-1",
    young_person_name: "Alex Smith",
    session_date: "2026-05-10",
    supporting_staff: "Jane Doe",
    skill_area: "Bus Route Learning",
    delivery_method: "Accompanied Practice",
    route_description: "Route 42 to town centre",
    competency_level: "Developing",
    risk_assessment_completed: true,
    young_person_engaged: true,
    gps_tracking_agreed: true,
    emergency_plan_in_place: true,
    phone_charged_checked: true,
    money_available: true,
    id_carried: null,
    confidence_level: "Medium",
    incident_occurred: false,
    incident_details: null,
    next_session_date: null,
    notes: null,
    created_at: "2026-05-10T10:00:00Z",
    updated_at: "2026-05-10T10:00:00Z",
    ...overrides,
  };
}

describe("independent-travel-service", () => {
  // -- computeMetrics -----------------------------------------------------------

  describe("computeMetrics", () => {
    it("returns zeroes for empty data", () => {
      const m = computeMetrics([]);
      expect(m.total_records).toBe(0);
      expect(m.unique_young_people).toBe(0);
      expect(m.risk_assessment_rate).toBe(0);
      expect(m.engagement_rate).toBe(0);
      expect(m.incident_rate).toBe(0);
      expect(m.competent_or_independent_rate).toBe(0);
      expect(m.high_confidence_rate).toBe(0);
      expect(m.average_sessions_per_person).toBe(0);
      expect(m.gps_tracking_agreed_rate).toBe(0);
    });

    it("counts totals and unique young people", () => {
      const rows = [
        makeRow({ young_person_name: "Alex Smith" }),
        makeRow({ id: "row-2", young_person_name: "Alex Smith" }),
        makeRow({ id: "row-3", young_person_name: "Beth Jones" }),
      ];
      const m = computeMetrics(rows);
      expect(m.total_records).toBe(3);
      expect(m.unique_young_people).toBe(2);
      expect(m.average_sessions_per_person).toBe(1.5);
    });

    it("computes category counts correctly", () => {
      const rows = [
        makeRow({ skill_area: "Road Safety Awareness", delivery_method: "Theory Session" }),
        makeRow({ id: "r2", skill_area: "Bus Route Learning", delivery_method: "Accompanied Practice" }),
        makeRow({ id: "r3", skill_area: "Journey to School", delivery_method: "Independent Practice" }),
        makeRow({ id: "r4", skill_area: "Long-Distance Travel", delivery_method: "Online Module" }),
      ];
      const m = computeMetrics(rows);
      expect(m.road_safety_count).toBe(1);
      expect(m.public_transport_count).toBe(1);
      expect(m.essential_journey_count).toBe(1);
      expect(m.advanced_skills_count).toBe(1);
      expect(m.practice_session_count).toBe(2);
      expect(m.theory_session_count).toBe(2);
    });

    it("computes boolean rates and competency outcomes", () => {
      const rows = [
        makeRow({
          competency_level: "Independent",
          confidence_level: "High",
          risk_assessment_completed: true,
          young_person_engaged: true,
          incident_occurred: false,
        }),
        makeRow({
          id: "r2",
          competency_level: "Competent",
          confidence_level: "Very High",
          risk_assessment_completed: false,
          young_person_engaged: false,
          incident_occurred: true,
        }),
      ];
      const m = computeMetrics(rows);
      expect(m.risk_assessment_rate).toBe(50);
      expect(m.engagement_rate).toBe(50);
      expect(m.incident_rate).toBe(50);
      expect(m.independent_competency_count).toBe(1);
      expect(m.competent_or_independent_rate).toBe(100);
      expect(m.high_confidence_rate).toBe(100);
    });

    it("computes GPS tracking rate only from non-null rows", () => {
      const rows = [
        makeRow({ gps_tracking_agreed: true }),
        makeRow({ id: "r2", gps_tracking_agreed: false }),
        makeRow({ id: "r3", gps_tracking_agreed: null }),
      ];
      const m = computeMetrics(rows);
      expect(m.gps_tracking_agreed_rate).toBe(50);
    });
  });

  // -- computeAlerts ------------------------------------------------------------

  describe("computeAlerts", () => {
    it("returns no alerts for empty data", () => {
      expect(computeAlerts([])).toHaveLength(0);
    });

    it("fires critical incident_occurred alert", () => {
      const rows = [makeRow({ incident_occurred: true, incident_details: "Got lost" })];
      const alerts = computeAlerts(rows);
      const incident = alerts.find((a) => a.type === "incident_occurred");
      expect(incident).toBeDefined();
      expect(incident!.severity).toBe("critical");
    });

    it("fires critical no_risk_assessment_practice for practice without RA", () => {
      const rows = [
        makeRow({
          risk_assessment_completed: false,
          delivery_method: "Accompanied Practice",
        }),
      ];
      const alerts = computeAlerts(rows);
      const ra = alerts.find((a) => a.type === "no_risk_assessment_practice");
      expect(ra).toBeDefined();
      expect(ra!.severity).toBe("critical");
    });

    it("fires critical no_emergency_plan_independent for Independent Practice without plan", () => {
      const rows = [
        makeRow({
          delivery_method: "Independent Practice",
          emergency_plan_in_place: false,
          risk_assessment_completed: true,
          phone_charged_checked: true,
        }),
      ];
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "no_emergency_plan_independent")).toBeDefined();
    });

    it("fires high low_engagement when <40% engaged over 3+ sessions", () => {
      const rows = [
        makeRow({ young_person_engaged: false }),
        makeRow({ id: "r2", young_person_engaged: false }),
        makeRow({ id: "r3", young_person_engaged: false }),
      ];
      const alerts = computeAlerts(rows);
      const eng = alerts.find((a) => a.type === "low_engagement");
      expect(eng).toBeDefined();
      expect(eng!.severity).toBe("high");
    });

    it("fires medium very_low_confidence", () => {
      const rows = [makeRow({ confidence_level: "Very Low" })];
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "very_low_confidence")).toBeDefined();
    });

    it("fires medium theory_only when 4+ sessions all theory", () => {
      const rows = Array.from({ length: 4 }, (_, i) =>
        makeRow({ id: `r${i}`, delivery_method: "Theory Session" }),
      );
      const alerts = computeAlerts(rows);
      expect(alerts.find((a) => a.type === "theory_only")).toBeDefined();
    });
  });

  // -- validateIndependentTravel -------------------------------------------------

  describe("validateIndependentTravel", () => {
    it("returns valid for complete valid input", () => {
      const result = validateIndependentTravel({
        youngPersonName: "Alex",
        sessionDate: "2026-05-10",
        supportingStaff: "Jane",
        skillArea: "Bus Route Learning",
        deliveryMethod: "Theory Session",
        competencyLevel: "Developing",
        confidenceLevel: "Medium",
        riskAssessmentCompleted: true,
        youngPersonEngaged: true,
        emergencyPlanInPlace: true,
        phoneChargedChecked: true,
        moneyAvailable: true,
        incidentOccurred: false,
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects missing required fields", () => {
      const result = validateIndependentTravel({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });

    it("rejects practice without risk assessment", () => {
      const result = validateIndependentTravel({
        youngPersonName: "Alex",
        sessionDate: "2026-05-10",
        supportingStaff: "Jane",
        skillArea: "Bus Route Learning",
        deliveryMethod: "Accompanied Practice",
        riskAssessmentCompleted: false,
        emergencyPlanInPlace: true,
        phoneChargedChecked: true,
        moneyAvailable: true,
        incidentOccurred: false,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Risk assessment not completed"))).toBe(true);
    });

    it("rejects incident without details", () => {
      const result = validateIndependentTravel({
        youngPersonName: "Alex",
        sessionDate: "2026-05-10",
        supportingStaff: "Jane",
        skillArea: "Bus Route Learning",
        deliveryMethod: "Theory Session",
        incidentOccurred: true,
        incidentDetails: "",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Incident occurred but no details"))).toBe(true);
    });
  });

  // -- generateCaraInsights -----------------------------------------------------

  describe("generateCaraInsights", () => {
    it("returns 3 insights", () => {
      const rows = [makeRow()];
      const insights = generateCaraInsights(rows);
      expect(insights).toHaveLength(3);
      expect(insights[0]).toContain("[sky]");
      expect(insights[1]).toContain("[amber]");
      expect(insights[2]).toContain("[reflect]");
    });
  });
});
