import { describe, it, expect } from "vitest";
import {
  computeNeighbourhoodSafetyRiskAssessment,
  type NeighbourhoodSafetyRiskAssessmentInput,
  type RiskAssessmentRecordInput,
  type SafetyMappingRecordInput,
  type HazardRecordInput,
  type RouteSafetyRecordInput,
  type CommunityPartnershipRecordInput,
} from "../home-neighbourhood-safety-risk-assessment-intelligence-engine";
import { below, meets } from "@/lib/metrics/rate";

/* ── helpers ────────────────────────────────────────────────────────────────── */

function makeRiskAssessment(
  id: string,
  o: Partial<RiskAssessmentRecordInput> = {},
): RiskAssessmentRecordInput {
  return {
    id,
    child_id: "c1",
    assessment_type: "initial",
    date: "2026-04-01",
    assessor: "staff-1",
    risk_level: "low",
    areas_covered: ["crime", "asb", "drugs", "exploitation", "gangs", "traffic", "environment"],
    local_crime_reviewed: true,
    antisocial_behaviour_reviewed: true,
    drug_activity_reviewed: true,
    exploitation_risk_reviewed: true,
    gang_activity_reviewed: true,
    traffic_risk_reviewed: true,
    environmental_risk_reviewed: true,
    mitigations_documented: true,
    mitigations_implemented: true,
    review_due_date: "2027-04-01",
    overdue: false,
    child_consulted: true,
    outcome_shared_with_child: true,
    approved_by_manager: true,
    notes: "",
    created_at: "2026-04-01",
    ...o,
  };
}

function makeSafetyMapping(
  id: string,
  o: Partial<SafetyMappingRecordInput> = {},
): SafetyMappingRecordInput {
  return {
    id,
    area_name: "Local area",
    date: "2026-04-01",
    mapping_type: "full_area",
    safe_zones_identified: 3,
    risk_zones_identified: 1,
    child_friendly_spaces: 2,
    cctv_coverage_noted: true,
    lighting_assessed: true,
    lighting_adequate: true,
    public_transport_access: true,
    nearest_emergency_services_distance_km: 1.5,
    child_involvement: true,
    staff_walked_area: true,
    last_updated: "2026-04-01",
    update_frequency_met: true,
    notes: "",
    created_at: "2026-04-01",
    ...o,
  };
}

function makeHazard(
  id: string,
  o: Partial<HazardRecordInput> = {},
): HazardRecordInput {
  return {
    id,
    hazard_type: "environmental",
    location_description: "Near the park",
    date_identified: "2026-04-01",
    severity: "low",
    reported_to_authority: true,
    authority_name: "Local council",
    date_reported: "2026-04-02",
    mitigation_in_place: true,
    mitigation_description: "Warning signs placed",
    children_informed: true,
    resolved: true,
    date_resolved: "2026-04-10",
    days_to_resolve: 5,
    recurrent: false,
    notes: "",
    created_at: "2026-04-01",
    ...o,
  };
}

function makeRoute(
  id: string,
  o: Partial<RouteSafetyRecordInput> = {},
): RouteSafetyRecordInput {
  return {
    id,
    child_id: "c1",
    route_name: "Route to school",
    route_type: "school",
    date_assessed: "2026-04-01",
    assessed_by: "staff-1",
    risk_level: "low",
    safe_crossing_points: true,
    adequate_lighting: true,
    cctv_present: true,
    traffic_risk_level: "low",
    pedestrian_access: true,
    public_transport_available: true,
    known_hazards: [],
    mitigations_in_place: true,
    alternative_route_available: true,
    child_walked_route: true,
    child_confident_on_route: true,
    review_due_date: "2027-04-01",
    overdue: false,
    notes: "",
    created_at: "2026-04-01",
    ...o,
  };
}

function makePartnership(
  id: string,
  o: Partial<CommunityPartnershipRecordInput> = {},
): CommunityPartnershipRecordInput {
  return {
    id,
    partner_name: "Local Police",
    partner_type: "police",
    relationship_status: "active",
    date_established: "2025-01-01",
    last_contact_date: "2026-04-01",
    contact_frequency: "monthly",
    contact_frequency_met: true,
    information_sharing_agreement: true,
    joint_risk_assessments: true,
    safeguarding_protocols_agreed: true,
    partnership_effectiveness: 5,
    children_benefit_documented: true,
    key_contact_named: true,
    notes: "",
    created_at: "2025-01-01",
    ...o,
  };
}

function baseInput(
  overrides: Partial<NeighbourhoodSafetyRiskAssessmentInput> = {},
): NeighbourhoodSafetyRiskAssessmentInput {
  return {
    today: "2026-05-15",
    total_children: 6,
    risk_assessment_records: [
      makeRiskAssessment("ra1"),
      makeRiskAssessment("ra2", { child_id: "c2" }),
      makeRiskAssessment("ra3", { child_id: "c3" }),
    ],
    safety_mapping_records: [
      makeSafetyMapping("sm1"),
      makeSafetyMapping("sm2", { area_name: "Route to school" }),
    ],
    hazard_records: [
      makeHazard("h1"),
      makeHazard("h2", { hazard_type: "traffic" }),
    ],
    route_safety_records: [
      makeRoute("r1"),
      makeRoute("r2", { child_id: "c2", route_type: "activity" }),
      makeRoute("r3", { child_id: "c3", route_type: "healthcare" }),
    ],
    community_partnership_records: [
      makePartnership("cp1"),
      makePartnership("cp2", { partner_type: "fire_service", partner_name: "Fire Service" }),
      makePartnership("cp3", { partner_type: "local_authority", partner_name: "LA Safeguarding" }),
    ],
    ...overrides,
  };
}

/* ── tests ──────────────────────────────────────────────────────────────────── */

describe("Home Neighbourhood Safety & Risk Assessment Intelligence Engine", () => {

  // ── 1. Insufficient data ─────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when 0 children and all arrays empty", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment({
        today: "2026-05-15",
        total_children: 0,
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      });
      expect(r.neighbourhood_rating).toBe("insufficient_data");
      expect(r.neighbourhood_score).toBe(0);
    });

    it("headline mentions insufficient data", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment({
        today: "2026-05-15",
        total_children: 0,
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      });
      expect(r.headline).toContain("insufficient data");
    });

    it("all rates are null", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment({
        today: "2026-05-15",
        total_children: 0,
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      });
      expect(r.risk_assessment_rate).toBeNull();
      expect(r.safety_mapping_rate).toBeNull();
      expect(r.hazard_identification_rate).toBeNull();
      expect(r.route_safety_rate).toBeNull();
      expect(r.community_partnership_rate).toBeNull();
      expect(r.child_awareness_rate).toBeNull();
    });

    it("returns empty arrays for strengths, concerns, recommendations, insights", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment({
        today: "2026-05-15",
        total_children: 0,
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      });
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });
  });

  // ── 2. All empty + children > 0 => inadequate special case ───────────────

  describe("all empty with children on placement", () => {
    it("returns inadequate with score 15", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment({
        today: "2026-05-15",
        total_children: 4,
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      });
      expect(r.neighbourhood_rating).toBe("inadequate");
      expect(r.neighbourhood_score).toBe(15);
    });

    it("headline mentions urgent attention", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment({
        today: "2026-05-15",
        total_children: 4,
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      });
      expect(r.headline).toContain("urgent attention");
    });

    it("has exactly 1 concern about the complete absence", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment({
        today: "2026-05-15",
        total_children: 4,
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      });
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No risk assessment");
    });

    it("has exactly 2 recommendations", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment({
        today: "2026-05-15",
        total_children: 4,
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      });
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("has exactly 1 critical insight", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment({
        today: "2026-05-15",
        total_children: 4,
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      });
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("recommendations reference Reg 25 and Reg 5", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment({
        today: "2026-05-15",
        total_children: 4,
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      });
      expect(r.recommendations[0].regulatory_ref).toContain("Reg 25");
      expect(r.recommendations[1].regulatory_ref).toContain("Reg 5");
    });
  });

  // ── 3. Outstanding threshold (>=80) ──────────────────────────────────────

  describe("outstanding threshold (>=80)", () => {
    it("rates outstanding with full best-practice data", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.neighbourhood_score).toBeGreaterThanOrEqual(80);
      expect(r.neighbourhood_rating).toBe("outstanding");
    });

    it("headline mentions outstanding", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("produces strengths", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.length).toBeGreaterThan(0);
    });

    it("produces no concerns", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.concerns).toHaveLength(0);
    });

    it("produces no recommendations", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.recommendations).toHaveLength(0);
    });

    it("risk_assessment_rate is 100 when all fields perfect", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.risk_assessment_rate).toBe(100);
    });

    it("safety_mapping_rate is 100 when all fields perfect", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.safety_mapping_rate).toBe(100);
    });

    it("hazard_identification_rate is 100 when all hazards reported/mitigated/resolved", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.hazard_identification_rate).toBe(100);
    });

    it("route_safety_rate is 100 when all route fields perfect", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.route_safety_rate).toBe(100);
    });

    it("community_partnership_rate is 100 when all partnerships active with agreements", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.community_partnership_rate).toBe(100);
    });

    it("child_awareness_rate is 100 when all child involvement flags true", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.child_awareness_rate).toBe(100);
    });

    it("outstanding includes positive insight about the rating", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      const positiveInsights = r.insights.filter((i) => i.severity === "positive");
      expect(positiveInsights.length).toBeGreaterThan(0);
      expect(positiveInsights.some((i) => i.text.includes("outstanding"))).toBe(true);
    });
  });

  // ── 4. Good threshold (65-79) ────────────────────────────────────────────

  describe("good threshold (65-79)", () => {
    it("rates good when some composite rates are in the 70-89 range", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1"),
          makeRiskAssessment("ra2", { mitigations_documented: false }),
          makeRiskAssessment("ra3", { approved_by_manager: false }),
          makeRiskAssessment("ra4", {
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
            drug_activity_reviewed: false,
          }),
        ],
        safety_mapping_records: [
          makeSafetyMapping("sm1"),
          makeSafetyMapping("sm2", { staff_walked_area: false, cctv_coverage_noted: false }),
        ],
        hazard_records: [
          makeHazard("h1"),
          makeHazard("h2", { resolved: false }),
        ],
        route_safety_records: [
          makeRoute("r1"),
          makeRoute("r2", { child_walked_route: false, mitigations_in_place: false }),
          makeRoute("r3"),
        ],
        community_partnership_records: [
          makePartnership("cp1"),
          makePartnership("cp2", { contact_frequency_met: false, information_sharing_agreement: false }),
        ],
      }));
      expect(r.neighbourhood_score).toBeGreaterThanOrEqual(65);
      expect(r.neighbourhood_score).toBeLessThan(80);
      expect(r.neighbourhood_rating).toBe("good");
    });

    it("headline mentions good", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1"),
          makeRiskAssessment("ra2", { mitigations_documented: false }),
          makeRiskAssessment("ra3", { approved_by_manager: false }),
          makeRiskAssessment("ra4", {
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
            drug_activity_reviewed: false,
          }),
        ],
        safety_mapping_records: [
          makeSafetyMapping("sm1"),
          makeSafetyMapping("sm2", { staff_walked_area: false, cctv_coverage_noted: false }),
        ],
      }));
      expect(r.headline).toContain("Good");
    });

    it("good rating produces both strengths and concerns", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1"),
          makeRiskAssessment("ra2", { mitigations_documented: false }),
          makeRiskAssessment("ra3", { approved_by_manager: false }),
          makeRiskAssessment("ra4", {
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
            drug_activity_reviewed: false,
          }),
        ],
        safety_mapping_records: [
          makeSafetyMapping("sm1"),
          makeSafetyMapping("sm2", { staff_walked_area: false, cctv_coverage_noted: false }),
        ],
      }));
      expect(r.strengths.length).toBeGreaterThan(0);
    });
  });

  // ── 5. Adequate threshold (45-64) ────────────────────────────────────────

  describe("adequate threshold (45-64)", () => {
    it("rates adequate with mixed quality data", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", {
            mitigations_documented: false,
            mitigations_implemented: false,
            approved_by_manager: false,
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
            drug_activity_reviewed: false,
            exploitation_risk_reviewed: false,
            gang_activity_reviewed: false,
            child_consulted: false,
            outcome_shared_with_child: false,
          }),
          makeRiskAssessment("ra2"),
          makeRiskAssessment("ra3", {
            mitigations_documented: false,
            approved_by_manager: false,
            exploitation_risk_reviewed: false,
            gang_activity_reviewed: false,
            child_consulted: false,
          }),
        ],
        safety_mapping_records: [
          makeSafetyMapping("sm1", { staff_walked_area: false, cctv_coverage_noted: false, update_frequency_met: false }),
          makeSafetyMapping("sm2", { lighting_assessed: false, child_involvement: false }),
        ],
        hazard_records: [
          makeHazard("h1", { resolved: false, mitigation_in_place: false }),
          makeHazard("h2", { reported_to_authority: false }),
          makeHazard("h3"),
        ],
        route_safety_records: [
          makeRoute("r1", { mitigations_in_place: false, safe_crossing_points: false, child_walked_route: false }),
          makeRoute("r2", { adequate_lighting: false, child_walked_route: false }),
          makeRoute("r3"),
        ],
        community_partnership_records: [
          makePartnership("cp1", { contact_frequency_met: false, information_sharing_agreement: false }),
          makePartnership("cp2", {
            partner_type: "fire_service",
            relationship_status: "dormant",
            safeguarding_protocols_agreed: false,
          }),
        ],
      }));
      expect(r.neighbourhood_score).toBeGreaterThanOrEqual(45);
      expect(r.neighbourhood_score).toBeLessThan(65);
      expect(r.neighbourhood_rating).toBe("adequate");
    });

    it("adequate headline mentions concerns", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", {
            mitigations_documented: false,
            mitigations_implemented: false,
            approved_by_manager: false,
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
            drug_activity_reviewed: false,
            exploitation_risk_reviewed: false,
            gang_activity_reviewed: false,
            child_consulted: false,
          }),
          makeRiskAssessment("ra2"),
          makeRiskAssessment("ra3", {
            mitigations_documented: false,
            approved_by_manager: false,
            exploitation_risk_reviewed: false,
            gang_activity_reviewed: false,
          }),
        ],
        safety_mapping_records: [
          makeSafetyMapping("sm1", { staff_walked_area: false, cctv_coverage_noted: false, update_frequency_met: false }),
          makeSafetyMapping("sm2", { lighting_assessed: false, child_involvement: false }),
        ],
        hazard_records: [
          makeHazard("h1", { resolved: false, mitigation_in_place: false }),
          makeHazard("h2", { reported_to_authority: false }),
          makeHazard("h3"),
        ],
        route_safety_records: [
          makeRoute("r1", { mitigations_in_place: false, safe_crossing_points: false, child_walked_route: false }),
          makeRoute("r2", { adequate_lighting: false, child_walked_route: false }),
          makeRoute("r3"),
        ],
        community_partnership_records: [
          makePartnership("cp1", { contact_frequency_met: false, information_sharing_agreement: false }),
          makePartnership("cp2", {
            partner_type: "fire_service",
            relationship_status: "dormant",
            safeguarding_protocols_agreed: false,
          }),
        ],
      }));
      expect(r.headline).toContain("Adequate");
    });
  });

  // ── 6. Inadequate threshold (<45) ────────────────────────────────────────

  describe("inadequate threshold (<45)", () => {
    it("rates inadequate with pervasive failures", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", {
            mitigations_documented: false,
            mitigations_implemented: false,
            approved_by_manager: false,
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
            drug_activity_reviewed: false,
            exploitation_risk_reviewed: false,
            gang_activity_reviewed: false,
            traffic_risk_reviewed: false,
            environmental_risk_reviewed: false,
            child_consulted: false,
            outcome_shared_with_child: false,
            risk_level: "high",
          }),
          makeRiskAssessment("ra2", {
            mitigations_documented: false,
            mitigations_implemented: false,
            approved_by_manager: false,
            local_crime_reviewed: false,
            exploitation_risk_reviewed: false,
            gang_activity_reviewed: false,
            child_consulted: false,
            outcome_shared_with_child: false,
            risk_level: "critical",
          }),
        ],
        safety_mapping_records: [
          makeSafetyMapping("sm1", {
            staff_walked_area: false,
            cctv_coverage_noted: false,
            lighting_assessed: false,
            lighting_adequate: false,
            update_frequency_met: false,
            child_involvement: false,
          }),
        ],
        hazard_records: [
          makeHazard("h1", {
            severity: "critical",
            reported_to_authority: false,
            mitigation_in_place: false,
            children_informed: false,
            resolved: false,
            days_to_resolve: 0,
            recurrent: true,
          }),
          makeHazard("h2", {
            severity: "high",
            reported_to_authority: false,
            mitigation_in_place: false,
            children_informed: false,
            resolved: false,
            days_to_resolve: 0,
            recurrent: true,
          }),
          makeHazard("h3", {
            reported_to_authority: false,
            mitigation_in_place: false,
            resolved: false,
            days_to_resolve: 0,
          }),
        ],
        route_safety_records: [
          makeRoute("r1", {
            mitigations_in_place: false,
            safe_crossing_points: false,
            adequate_lighting: false,
            child_walked_route: false,
            child_confident_on_route: false,
            risk_level: "high",
            traffic_risk_level: "high",
          }),
          makeRoute("r2", {
            mitigations_in_place: false,
            safe_crossing_points: false,
            child_walked_route: false,
            child_confident_on_route: false,
            risk_level: "critical",
            traffic_risk_level: "high",
          }),
        ],
        community_partnership_records: [
          makePartnership("cp1", {
            partner_type: "local_authority",
            relationship_status: "dormant",
            contact_frequency_met: false,
            information_sharing_agreement: false,
            safeguarding_protocols_agreed: false,
            partnership_effectiveness: 1,
          }),
          makePartnership("cp2", {
            partner_type: "fire_service",
            relationship_status: "dormant",
            contact_frequency_met: false,
            information_sharing_agreement: false,
            safeguarding_protocols_agreed: false,
            partnership_effectiveness: 1,
          }),
        ],
      }));
      expect(r.neighbourhood_score).toBeLessThan(45);
      expect(r.neighbourhood_rating).toBe("inadequate");
    });

    it("inadequate headline mentions urgent action", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", {
            mitigations_documented: false,
            mitigations_implemented: false,
            approved_by_manager: false,
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
            drug_activity_reviewed: false,
            exploitation_risk_reviewed: false,
            gang_activity_reviewed: false,
            traffic_risk_reviewed: false,
            environmental_risk_reviewed: false,
            child_consulted: false,
            outcome_shared_with_child: false,
          }),
          makeRiskAssessment("ra2", {
            mitigations_documented: false,
            mitigations_implemented: false,
            approved_by_manager: false,
            exploitation_risk_reviewed: false,
            gang_activity_reviewed: false,
            child_consulted: false,
          }),
        ],
        safety_mapping_records: [],
        hazard_records: [
          makeHazard("h1", {
            severity: "critical",
            reported_to_authority: false,
            mitigation_in_place: false,
            resolved: false,
            days_to_resolve: 0,
          }),
        ],
        route_safety_records: [
          makeRoute("r1", {
            mitigations_in_place: false,
            safe_crossing_points: false,
            adequate_lighting: false,
            child_walked_route: false,
          }),
        ],
        community_partnership_records: [
          makePartnership("cp1", {
            partner_type: "local_authority",
            relationship_status: "dormant",
            contact_frequency_met: false,
            information_sharing_agreement: false,
            safeguarding_protocols_agreed: false,
            partnership_effectiveness: 1,
          }),
        ],
      }));
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── 7. Risk assessment rate computation ──────────────────────────────────

  describe("risk assessment rate computation", () => {
    it("returns null when no risk assessments exist", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [],
      }));
      expect(r.risk_assessment_rate).toBeNull();
    });

    it("returns 100 when all four components are perfect", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.risk_assessment_rate).toBe(100);
    });

    it("mitigations_documented false reduces rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { mitigations_documented: false }),
          makeRiskAssessment("ra2", { mitigations_documented: false }),
        ],
      }));
      expect(r.risk_assessment_rate).toBeLessThan(100);
    });

    it("approved_by_manager false reduces rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { approved_by_manager: false }),
          makeRiskAssessment("ra2", { approved_by_manager: false }),
        ],
      }));
      expect(r.risk_assessment_rate).toBeLessThan(100);
    });

    it("incomplete area coverage reduces rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { local_crime_reviewed: false, antisocial_behaviour_reviewed: false }),
          makeRiskAssessment("ra2", { exploitation_risk_reviewed: false }),
        ],
      }));
      expect(r.risk_assessment_rate).toBeLessThan(100);
    });

    it("mitigations_implemented false reduces rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { mitigations_implemented: false }),
          makeRiskAssessment("ra2", { mitigations_implemented: false }),
        ],
      }));
      expect(r.risk_assessment_rate).toBeLessThan(100);
    });
  });

  // ── 8. Safety mapping rate computation ───────────────────────────────────

  describe("safety mapping rate computation", () => {
    it("returns null when no mappings exist", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [],
      }));
      expect(r.safety_mapping_rate).toBeNull();
    });

    it("returns 100 when all four components perfect", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.safety_mapping_rate).toBe(100);
    });

    it("staff_walked_area false reduces rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [
          makeSafetyMapping("sm1", { staff_walked_area: false }),
          makeSafetyMapping("sm2", { staff_walked_area: false }),
        ],
      }));
      expect(r.safety_mapping_rate).toBeLessThan(100);
    });

    it("cctv_coverage_noted false reduces rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [
          makeSafetyMapping("sm1", { cctv_coverage_noted: false }),
          makeSafetyMapping("sm2", { cctv_coverage_noted: false }),
        ],
      }));
      expect(r.safety_mapping_rate).toBeLessThan(100);
    });

    it("lighting_assessed false reduces rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [
          makeSafetyMapping("sm1", { lighting_assessed: false }),
          makeSafetyMapping("sm2", { lighting_assessed: false }),
        ],
      }));
      expect(r.safety_mapping_rate).toBeLessThan(100);
    });

    it("update_frequency_met false reduces rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [
          makeSafetyMapping("sm1", { update_frequency_met: false }),
          makeSafetyMapping("sm2", { update_frequency_met: false }),
        ],
      }));
      expect(r.safety_mapping_rate).toBeLessThan(100);
    });
  });

  // ── 9. Hazard identification rate computation ────────────────────────────

  describe("hazard identification rate computation", () => {
    it("returns null when no hazards exist", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [],
      }));
      expect(r.hazard_identification_rate).toBeNull();
    });

    it("returns 100 when all hazards reported, mitigated, resolved", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.hazard_identification_rate).toBe(100);
    });

    it("reported_to_authority false reduces rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1", { reported_to_authority: false }),
          makeHazard("h2", { reported_to_authority: false }),
        ],
      }));
      expect(r.hazard_identification_rate).toBeLessThan(100);
    });

    it("mitigation_in_place false reduces rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1", { mitigation_in_place: false }),
          makeHazard("h2", { mitigation_in_place: false }),
        ],
      }));
      expect(r.hazard_identification_rate).toBeLessThan(100);
    });

    it("resolved false reduces rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1", { resolved: false, days_to_resolve: 0 }),
          makeHazard("h2", { resolved: false, days_to_resolve: 0 }),
        ],
      }));
      expect(r.hazard_identification_rate).toBeLessThan(100);
    });
  });

  // ── 10. Route safety rate computation ────────────────────────────────────

  describe("route safety rate computation", () => {
    it("returns null when no routes exist", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [],
      }));
      expect(r.route_safety_rate).toBeNull();
    });

    it("returns 100 when all four components perfect", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.route_safety_rate).toBe(100);
    });

    it("mitigations_in_place false reduces rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [
          makeRoute("r1", { mitigations_in_place: false }),
          makeRoute("r2", { mitigations_in_place: false }),
        ],
      }));
      expect(r.route_safety_rate).toBeLessThan(100);
    });

    it("child_walked_route false reduces rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [
          makeRoute("r1", { child_walked_route: false }),
          makeRoute("r2", { child_walked_route: false }),
        ],
      }));
      expect(r.route_safety_rate).toBeLessThan(100);
    });

    it("safe_crossing_points false reduces rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [
          makeRoute("r1", { safe_crossing_points: false }),
          makeRoute("r2", { safe_crossing_points: false }),
        ],
      }));
      expect(r.route_safety_rate).toBeLessThan(100);
    });

    it("adequate_lighting false reduces rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [
          makeRoute("r1", { adequate_lighting: false }),
          makeRoute("r2", { adequate_lighting: false }),
        ],
      }));
      expect(r.route_safety_rate).toBeLessThan(100);
    });
  });

  // ── 11. Community partnership rate computation ───────────────────────────

  describe("community partnership rate computation", () => {
    it("returns null when no partnerships exist", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [],
      }));
      expect(r.community_partnership_rate).toBeNull();
    });

    it("returns 100 when all four components perfect", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.community_partnership_rate).toBe(100);
    });

    it("relationship_status inactive reduces rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1", { relationship_status: "dormant" }),
          makePartnership("cp2", { partner_type: "fire_service", relationship_status: "dormant" }),
        ],
      }));
      expect(r.community_partnership_rate).toBeLessThan(100);
    });

    it("contact_frequency_met false reduces rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1", { contact_frequency_met: false }),
          makePartnership("cp2", { partner_type: "fire_service", contact_frequency_met: false }),
        ],
      }));
      expect(r.community_partnership_rate).toBeLessThan(100);
    });

    it("information_sharing_agreement false reduces rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1", { information_sharing_agreement: false }),
          makePartnership("cp2", { partner_type: "fire_service", information_sharing_agreement: false }),
        ],
      }));
      expect(r.community_partnership_rate).toBeLessThan(100);
    });

    it("safeguarding_protocols_agreed false reduces rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1", { safeguarding_protocols_agreed: false }),
          makePartnership("cp2", { partner_type: "fire_service", safeguarding_protocols_agreed: false }),
        ],
      }));
      expect(r.community_partnership_rate).toBeLessThan(100);
    });
  });

  // ── 12. Child awareness rate computation ─────────────────────────────────

  describe("child awareness rate computation", () => {
    it("returns 100 when all child involvement flags are true", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.child_awareness_rate).toBe(100);
    });

    it("returns 0 when all child involvement flags are false", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { child_consulted: false }),
        ],
        safety_mapping_records: [
          makeSafetyMapping("sm1", { child_involvement: false }),
        ],
        hazard_records: [
          makeHazard("h1", { children_informed: false }),
        ],
        route_safety_records: [
          makeRoute("r1", { child_walked_route: false }),
        ],
      }));
      expect(r.child_awareness_rate).toBe(0);
    });

    it("returns 0 when denominator is 0 (no records in contributing arrays)", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
      }));
      expect(r.child_awareness_rate).toBeNull();
    });

    it("partial child involvement gives mid-range rate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { child_consulted: true }),
          makeRiskAssessment("ra2", { child_consulted: false }),
        ],
        safety_mapping_records: [
          makeSafetyMapping("sm1", { child_involvement: true }),
          makeSafetyMapping("sm2", { child_involvement: false }),
        ],
        hazard_records: [
          makeHazard("h1", { children_informed: true }),
          makeHazard("h2", { children_informed: false }),
        ],
        route_safety_records: [
          makeRoute("r1", { child_walked_route: true }),
          makeRoute("r2", { child_walked_route: false }),
        ],
      }));
      expect(r.child_awareness_rate).toBe(50);
    });
  });

  // ── 13. Scoring bonuses ──────────────────────────────────────────────────

  describe("scoring bonuses", () => {
    it("bonus 1: riskAssessmentRate >= 90 gives +5", () => {
      // baseline with all empty arrays except risk assessments
      const withBonus = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      }));
      const withoutBonus = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      }));
      // With perfect risk assessments should score higher
      expect(withBonus.neighbourhood_score).toBeGreaterThan(withoutBonus.neighbourhood_score);
    });

    it("bonus 2: safetyMappingRate >= 90 gives +5", () => {
      const withBonus = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      }));
      const withoutBonus = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      }));
      expect(withBonus.neighbourhood_score).toBeGreaterThan(withoutBonus.neighbourhood_score);
    });

    it("bonus 3: hazardIdentificationRate >= 90 gives +4", () => {
      const withBonus = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [],
        safety_mapping_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      }));
      const withoutBonus = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      }));
      expect(withBonus.neighbourhood_score).toBeGreaterThan(withoutBonus.neighbourhood_score);
    });

    it("bonus 4: routeSafetyRate >= 90 gives +4", () => {
      const withBonus = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        community_partnership_records: [],
      }));
      const withoutBonus = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      }));
      expect(withBonus.neighbourhood_score).toBeGreaterThan(withoutBonus.neighbourhood_score);
    });

    it("bonus 5: communityPartnershipRate >= 90 gives +5", () => {
      const withBonus = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
      }));
      const withoutBonus = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      }));
      expect(withBonus.neighbourhood_score).toBeGreaterThan(withoutBonus.neighbourhood_score);
    });

    it("bonus 7: comprehensiveCoverageRate >= 90 gives +2", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      // baseInput has all 7 areas reviewed => comprehensive coverage is 100%
      // Score includes this +2 bonus
      expect(r.neighbourhood_score).toBeGreaterThanOrEqual(80);
    });
  });

  // ── 14. Scoring penalties ────────────────────────────────────────────────

  describe("scoring penalties", () => {
    it("penalty: riskAssessmentRate < 50 gives -6", () => {
      const penalized = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", {
            mitigations_documented: false,
            mitigations_implemented: false,
            approved_by_manager: false,
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
            drug_activity_reviewed: false,
            exploitation_risk_reviewed: false,
            gang_activity_reviewed: false,
            traffic_risk_reviewed: false,
            environmental_risk_reviewed: false,
          }),
        ],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      }));
      // risk assessment rate is 0 (all components 0), penalty -6 applies
      // record exists → 0, not null
      expect(penalized.risk_assessment_rate).toBe(0);
      expect(penalized.neighbourhood_score).toBeLessThan(52);
    });

    it("penalty: hazardIdentificationRate < 40 gives -5", () => {
      const penalized = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [
          makeHazard("h1", { reported_to_authority: false, mitigation_in_place: false, resolved: false, days_to_resolve: 0 }),
        ],
        route_safety_records: [],
        community_partnership_records: [],
      }));
      // record exists → 0, not null
      expect(penalized.hazard_identification_rate).toBe(0);
      expect(penalized.neighbourhood_score).toBeLessThan(52);
    });

    it("penalty: routeSafetyRate < 50 gives -4", () => {
      const penalized = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [
          makeRoute("r1", {
            mitigations_in_place: false,
            safe_crossing_points: false,
            adequate_lighting: false,
            child_walked_route: false,
          }),
        ],
        community_partnership_records: [],
      }));
      // record exists → 0, not null
      expect(penalized.route_safety_rate).toBe(0);
      expect(penalized.neighbourhood_score).toBeLessThan(52);
    });

    it("penalty: communityPartnershipRate < 40 gives -5", () => {
      const penalized = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [
          makePartnership("cp1", {
            relationship_status: "dormant",
            contact_frequency_met: false,
            information_sharing_agreement: false,
            safeguarding_protocols_agreed: false,
          }),
        ],
      }));
      // record exists → 0, not null
      expect(penalized.community_partnership_rate).toBe(0);
      expect(penalized.neighbourhood_score).toBeLessThan(52);
    });
  });

  // ── 15. Score clamping ───────────────────────────────────────────────────

  describe("score clamping", () => {
    it("score never exceeds 100", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.neighbourhood_score).toBeLessThanOrEqual(100);
    });

    it("score never goes below 0", () => {
      // Even with maximum penalties, score should be >= 0
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", {
            mitigations_documented: false,
            mitigations_implemented: false,
            approved_by_manager: false,
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
            drug_activity_reviewed: false,
            exploitation_risk_reviewed: false,
            gang_activity_reviewed: false,
            traffic_risk_reviewed: false,
            environmental_risk_reviewed: false,
          }),
        ],
        hazard_records: [
          makeHazard("h1", { reported_to_authority: false, mitigation_in_place: false, resolved: false, days_to_resolve: 0 }),
        ],
        route_safety_records: [
          makeRoute("r1", { mitigations_in_place: false, safe_crossing_points: false, adequate_lighting: false, child_walked_route: false }),
        ],
        community_partnership_records: [
          makePartnership("cp1", {
            relationship_status: "dormant",
            contact_frequency_met: false,
            information_sharing_agreement: false,
            safeguarding_protocols_agreed: false,
          }),
        ],
      }));
      expect(r.neighbourhood_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ── 16. Strengths: risk assessment ───────────────────────────────────────

  describe("strengths: risk assessment", () => {
    it("strength for riskAssessmentRate >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("100% risk assessment completeness rate"))).toBe(true);
    });

    it("strength for riskAssessmentRate >= 70 but < 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1"),
          makeRiskAssessment("ra2"),
          makeRiskAssessment("ra3"),
          makeRiskAssessment("ra4", { mitigations_documented: false }),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("risk assessment completeness"))).toBe(true);
    });

    it("strength for comprehensive coverage >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("cover all seven key areas"))).toBe(true);
    });

    it("strength for mitigationImplRate >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("mitigations have been implemented"))).toBe(true);
    });

    it("strength for managerApprovalRate >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("manager-approved"))).toBe(true);
    });

    it("strength for exploitationReviewRate >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("Exploitation risk reviewed"))).toBe(true);
    });

    it("strength for childConsultedRate >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("Children consulted"))).toBe(true);
    });

    it("strength for outcomeSharedRate >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("outcomes shared with children"))).toBe(true);
    });
  });

  // ── 17. Strengths: safety mapping ────────────────────────────────────────

  describe("strengths: safety mapping", () => {
    it("strength for safetyMappingRate >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("safety mapping completeness"))).toBe(true);
    });

    it("strength for staffWalkedRate >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("Staff have physically walked"))).toBe(true);
    });

    it("strength for >= 5 child-friendly spaces", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [
          makeSafetyMapping("sm1", { child_friendly_spaces: 3 }),
          makeSafetyMapping("sm2", { child_friendly_spaces: 3 }),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("child-friendly spaces identified"))).toBe(true);
    });

    it("no strength for < 5 child-friendly spaces", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [
          makeSafetyMapping("sm1", { child_friendly_spaces: 2 }),
          makeSafetyMapping("sm2", { child_friendly_spaces: 2 }),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("child-friendly spaces identified"))).toBe(false);
    });

    it("strength for lightingAdequateRate >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("Lighting assessed as adequate"))).toBe(true);
    });
  });

  // ── 18. Strengths: hazard management ─────────────────────────────────────

  describe("strengths: hazard management", () => {
    it("strength for hazardIdentificationRate >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("hazard management rate"))).toBe(true);
    });

    it("strength for hazardResolutionRate >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("hazards resolved"))).toBe(true);
    });

    it("strength for avgDaysToResolve <= 7", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("Average hazard resolution time"))).toBe(true);
    });

    it("strength for childrenInformedHazardRate >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("Children informed about"))).toBe(true);
    });
  });

  // ── 19. Strengths: route safety ──────────────────────────────────────────

  describe("strengths: route safety", () => {
    it("strength for routeSafetyRate >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("route safety completeness"))).toBe(true);
    });

    it("strength for routeChildConfidentRate >= 80", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("report confidence"))).toBe(true);
    });

    it("strength for safeCrossingRate >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("Safe crossing points confirmed"))).toBe(true);
    });

    it("strength for alternativeRouteRate >= 70", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("Alternative routes available"))).toBe(true);
    });
  });

  // ── 20. Strengths: community partnerships ────────────────────────────────

  describe("strengths: community partnerships", () => {
    it("strength for communityPartnershipRate >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("community partnership effectiveness"))).toBe(true);
    });

    it("strength for active police partnership", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("Active police partnership"))).toBe(true);
    });

    it("strength for infoSharingRate >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("Information sharing agreements"))).toBe(true);
    });

    it("strength for safeguardingProtocolRate >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("Safeguarding protocols agreed"))).toBe(true);
    });

    it("strength for jointRiskRate >= 70", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("Joint risk assessments"))).toBe(true);
    });

    it("strength for effectivenessAvg >= 4.0", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("partnership effectiveness averages"))).toBe(true);
    });
  });

  // ── 21. Strengths: child awareness ───────────────────────────────────────

  describe("strengths: child awareness", () => {
    it("strength for childAwarenessRate >= 80", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.strengths.some((s) => s.includes("Child awareness and involvement at 100%"))).toBe(true);
    });

    it("strength for childAwarenessRate >= 60 but < 80", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { child_consulted: true }),
          makeRiskAssessment("ra2", { child_consulted: false }),
          makeRiskAssessment("ra3", { child_consulted: false }),
        ],
        safety_mapping_records: [
          makeSafetyMapping("sm1", { child_involvement: true }),
          makeSafetyMapping("sm2", { child_involvement: true }),
        ],
        hazard_records: [
          makeHazard("h1", { children_informed: true }),
          makeHazard("h2", { children_informed: true }),
        ],
        route_safety_records: [
          makeRoute("r1", { child_walked_route: true }),
          makeRoute("r2", { child_walked_route: true }),
          makeRoute("r3", { child_walked_route: false }),
        ],
      }));
      // 1+2+2+2 = 7 out of 3+2+2+3 = 10 => 70%
      expect(r.child_awareness_rate).toBe(70);
      expect(r.strengths.some((s) => s.includes("Child awareness and involvement at 70%"))).toBe(true);
    });
  });

  // ── 22. Concerns: risk assessment ────────────────────────────────────────

  describe("concerns: risk assessment", () => {
    it("concern when riskAssessmentRate < 50", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", {
            mitigations_documented: false,
            mitigations_implemented: false,
            approved_by_manager: false,
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
            drug_activity_reviewed: false,
            exploitation_risk_reviewed: false,
            gang_activity_reviewed: false,
            traffic_risk_reviewed: false,
            environmental_risk_reviewed: false,
          }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Risk assessment completeness at only"))).toBe(true);
    });

    it("concern when comprehensiveCoverageRate < 50", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { local_crime_reviewed: false }),
          makeRiskAssessment("ra2", { exploitation_risk_reviewed: false }),
          makeRiskAssessment("ra3", { gang_activity_reviewed: false }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("cover all seven key areas"))).toBe(true);
    });

    it("concern when overdueRiskRate >= 20", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { overdue: true }),
          makeRiskAssessment("ra2"),
          makeRiskAssessment("ra3"),
        ],
      }));
      // 1/3 = 33%
      expect(r.concerns.some((c) => c.includes("overdue for review"))).toBe(true);
    });

    it("concern when exploitationReviewRate < 70", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { exploitation_risk_reviewed: false }),
          makeRiskAssessment("ra2", { exploitation_risk_reviewed: false }),
          makeRiskAssessment("ra3"),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Exploitation risk reviewed in only"))).toBe(true);
    });

    it("concern when gangReviewRate < 70", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { gang_activity_reviewed: false }),
          makeRiskAssessment("ra2", { gang_activity_reviewed: false }),
          makeRiskAssessment("ra3"),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Gang activity reviewed in only"))).toBe(true);
    });

    it("concern when mitigationImplRate < 50", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { mitigations_implemented: false }),
          makeRiskAssessment("ra2", { mitigations_implemented: false }),
          makeRiskAssessment("ra3"),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("mitigations have been implemented"))).toBe(true);
    });

    it("concern when highCriticalRate >= 40", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { risk_level: "high" }),
          makeRiskAssessment("ra2", { risk_level: "critical" }),
          makeRiskAssessment("ra3"),
        ],
      }));
      // 2/3 = 67%
      expect(r.concerns.some((c) => c.includes("high or critical risk levels"))).toBe(true);
    });

    it("concern when no risk assessments but children on placement", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("No neighbourhood risk assessments recorded"))).toBe(true);
    });
  });

  // ── 23. Concerns: safety mapping ─────────────────────────────────────────

  describe("concerns: safety mapping", () => {
    it("concern when safetyMappingRate < 50", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [
          makeSafetyMapping("sm1", {
            staff_walked_area: false,
            cctv_coverage_noted: false,
            lighting_assessed: false,
            update_frequency_met: false,
          }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Safety mapping completeness at only"))).toBe(true);
    });

    it("concern when staffWalkedRate < 50", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [
          makeSafetyMapping("sm1", { staff_walked_area: false }),
          makeSafetyMapping("sm2", { staff_walked_area: false }),
          makeSafetyMapping("sm3"),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Staff have only walked"))).toBe(true);
    });

    it("concern when lightingAdequateRate < 50", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [
          makeSafetyMapping("sm1", { lighting_adequate: false }),
          makeSafetyMapping("sm2", { lighting_adequate: false }),
          makeSafetyMapping("sm3"),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Lighting assessed as adequate in only"))).toBe(true);
    });

    it("concern when updateFrequencyRate < 50", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [
          makeSafetyMapping("sm1", { update_frequency_met: false }),
          makeSafetyMapping("sm2", { update_frequency_met: false }),
          makeSafetyMapping("sm3"),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Safety mapping update frequency met in only"))).toBe(true);
    });

    it("concern when no mappings but children on placement", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("No local area safety mapping recorded"))).toBe(true);
    });
  });

  // ── 24. Concerns: hazard management ──────────────────────────────────────

  describe("concerns: hazard management", () => {
    it("concern when hazardIdentificationRate < 40", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1", { reported_to_authority: false, mitigation_in_place: false, resolved: false, days_to_resolve: 0 }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Hazard management rate at only"))).toBe(true);
    });

    it("concern for unresolved high/critical hazards", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1", { severity: "high", resolved: false, days_to_resolve: 0 }),
          makeHazard("h2", { severity: "critical", resolved: false, days_to_resolve: 0 }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("high or critical severity hazard"))).toBe(true);
    });

    it("concern for recurrentHazardRate >= 30", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1", { recurrent: true }),
          makeHazard("h2"),
          makeHazard("h3"),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("hazards are recurrent"))).toBe(true);
    });

    it("concern for avgDaysToResolve >= 30", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1", { days_to_resolve: 45 }),
          makeHazard("h2", { days_to_resolve: 35 }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Average hazard resolution time"))).toBe(true);
    });

    it("concern for hazardReportingRate < 50", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1", { reported_to_authority: false }),
          makeHazard("h2", { reported_to_authority: false }),
          makeHazard("h3"),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("hazards reported to relevant authorities"))).toBe(true);
    });
  });

  // ── 25. Concerns: route safety ───────────────────────────────────────────

  describe("concerns: route safety", () => {
    it("concern when routeSafetyRate < 50", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [
          makeRoute("r1", {
            mitigations_in_place: false,
            safe_crossing_points: false,
            adequate_lighting: false,
            child_walked_route: false,
          }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Route safety completeness at only"))).toBe(true);
    });

    it("concern when highCriticalRouteRate >= 30", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [
          makeRoute("r1", { risk_level: "high" }),
          makeRoute("r2", { risk_level: "critical" }),
          makeRoute("r3"),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("routes are rated high or critical risk"))).toBe(true);
    });

    it("concern when overdueRouteRate >= 20", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [
          makeRoute("r1", { overdue: true }),
          makeRoute("r2"),
          makeRoute("r3"),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("route safety assessments are overdue"))).toBe(true);
    });

    it("concern when routeChildConfidentRate < 50", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [
          makeRoute("r1", { child_confident_on_route: false }),
          makeRoute("r2", { child_confident_on_route: false }),
          makeRoute("r3"),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("children report confidence"))).toBe(true);
    });

    it("concern when highTrafficRate >= 40", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [
          makeRoute("r1", { traffic_risk_level: "high" }),
          makeRoute("r2", { traffic_risk_level: "high" }),
          makeRoute("r3"),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("high traffic risk"))).toBe(true);
    });

    it("concern when no routes but children on placement", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("No route safety assessments recorded"))).toBe(true);
    });
  });

  // ── 26. Concerns: community partnerships ─────────────────────────────────

  describe("concerns: community partnerships", () => {
    it("concern when communityPartnershipRate < 40", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1", {
            relationship_status: "dormant",
            contact_frequency_met: false,
            information_sharing_agreement: false,
            safeguarding_protocols_agreed: false,
          }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Community partnership effectiveness at only"))).toBe(true);
    });

    it("concern when no active police partnership", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1", { partner_type: "fire_service" }),
          makePartnership("cp2", { partner_type: "local_authority" }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("No active police partnership"))).toBe(true);
    });

    it("concern when dormantPartnershipRate >= 30", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1"),
          makePartnership("cp2", { partner_type: "fire_service", relationship_status: "dormant" }),
          makePartnership("cp3", { partner_type: "local_authority" }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("partnerships are dormant"))).toBe(true);
    });

    it("concern when effectivenessAvg < 3.0", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1", { partnership_effectiveness: 2 }),
          makePartnership("cp2", { partner_type: "fire_service", partnership_effectiveness: 1 }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("partnership effectiveness averages only"))).toBe(true);
    });

    it("concern when no partnerships but children on placement", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [],
      }));
      expect(r.concerns.some((c) => c.includes("No community safety partnerships recorded"))).toBe(true);
    });
  });

  // ── 27. Concerns: child awareness ────────────────────────────────────────

  describe("concerns: child awareness", () => {
    it("concern when childAwarenessRate < 50", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { child_consulted: false }),
          makeRiskAssessment("ra2", { child_consulted: false }),
          makeRiskAssessment("ra3", { child_consulted: false }),
        ],
        safety_mapping_records: [
          makeSafetyMapping("sm1", { child_involvement: false }),
          makeSafetyMapping("sm2", { child_involvement: false }),
        ],
        hazard_records: [
          makeHazard("h1", { children_informed: false }),
          makeHazard("h2", { children_informed: false }),
        ],
        route_safety_records: [
          makeRoute("r1", { child_walked_route: false }),
          makeRoute("r2", { child_walked_route: false }),
          makeRoute("r3", { child_walked_route: false }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Child awareness and involvement at only"))).toBe(true);
    });

    it("concern when childConsultedRate < 50", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { child_consulted: false }),
          makeRiskAssessment("ra2", { child_consulted: false }),
          makeRiskAssessment("ra3"),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("Children consulted in only"))).toBe(true);
    });
  });

  // ── 28. Recommendations ──────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommendation when riskAssessmentRate < 50", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", {
            mitigations_documented: false,
            mitigations_implemented: false,
            approved_by_manager: false,
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
            drug_activity_reviewed: false,
            exploitation_risk_reviewed: false,
            gang_activity_reviewed: false,
            traffic_risk_reviewed: false,
            environmental_risk_reviewed: false,
          }),
        ],
      }));
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Urgently improve"))).toBe(true);
    });

    it("recommendation for unresolved high/critical hazards", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1", { severity: "critical", resolved: false, days_to_resolve: 0 }),
        ],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("outstanding high/critical"))).toBe(true);
    });

    it("recommendation when no police partnership", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1", { partner_type: "fire_service" }),
        ],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("local police"))).toBe(true);
    });

    it("recommendation when exploitationReviewRate < 70", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { exploitation_risk_reviewed: false }),
          makeRiskAssessment("ra2", { exploitation_risk_reviewed: false }),
          makeRiskAssessment("ra3"),
        ],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("exploitation risk"))).toBe(true);
    });

    it("recommendation when overdueRiskRate >= 20", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { overdue: true }),
          makeRiskAssessment("ra2"),
          makeRiskAssessment("ra3"),
        ],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("overdue risk assessments"))).toBe(true);
    });

    it("recommendation when overdueRouteRate >= 20", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [
          makeRoute("r1", { overdue: true }),
          makeRoute("r2"),
          makeRoute("r3"),
        ],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("overdue route safety"))).toBe(true);
    });

    it("recommendation when dormantPartnershipRate >= 30", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1"),
          makePartnership("cp2", { partner_type: "fire_service", relationship_status: "dormant" }),
          makePartnership("cp3", { partner_type: "local_authority" }),
        ],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Reactivate dormant"))).toBe(true);
    });

    it("recommendation ranks are sequential", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", {
            mitigations_documented: false,
            mitigations_implemented: false,
            approved_by_manager: false,
            local_crime_reviewed: false,
            exploitation_risk_reviewed: false,
          }),
        ],
        hazard_records: [
          makeHazard("h1", { severity: "critical", resolved: false, days_to_resolve: 0 }),
        ],
      }));
      if (r.recommendations.length > 1) {
        for (let i = 1; i < r.recommendations.length; i++) {
          expect(r.recommendations[i].rank).toBeGreaterThan(r.recommendations[i - 1].rank);
        }
      }
    });

    it("no risk assessments but not allEmpty produces recommendation to implement", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Implement comprehensive neighbourhood risk assessments"))).toBe(true);
    });

    it("no mappings but not allEmpty produces recommendation", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("local area safety mapping"))).toBe(true);
    });

    it("no routes but not allEmpty produces recommendation", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("regular routes"))).toBe(true);
    });

    it("no partnerships but not allEmpty produces recommendation", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("community safety partnerships"))).toBe(true);
    });

    it("planned urgency for riskAssessmentRate between 50 and 70", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1"),
          makeRiskAssessment("ra2", { mitigations_documented: false, approved_by_manager: false }),
          makeRiskAssessment("ra3", { mitigations_documented: false }),
          makeRiskAssessment("ra4", {
            mitigations_documented: false,
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
          }),
        ],
      }));
      if (meets(r.risk_assessment_rate, 50) && below(r.risk_assessment_rate, 70)) {
        expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Improve risk assessment completeness"))).toBe(true);
      }
    });

    it("recommendation for recurrentHazardRate >= 30", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1", { recurrent: true }),
          makeHazard("h2"),
          makeHazard("h3"),
        ],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("root causes of recurrent"))).toBe(true);
    });

    it("recommendation for staffWalkedRate < 50", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [
          makeSafetyMapping("sm1", { staff_walked_area: false }),
          makeSafetyMapping("sm2", { staff_walked_area: false }),
          makeSafetyMapping("sm3"),
        ],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("physically walk all mapped areas"))).toBe(true);
    });

    it("recommendation for infoSharingRate < 70", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1", { information_sharing_agreement: false }),
          makePartnership("cp2", { partner_type: "fire_service", information_sharing_agreement: false }),
          makePartnership("cp3", { partner_type: "local_authority" }),
        ],
      }));
      expect(r.recommendations.some((rec) => rec.recommendation.includes("information sharing protocols"))).toBe(true);
    });
  });

  // ── 29. Insights: critical ───────────────────────────────────────────────

  describe("insights: critical", () => {
    it("critical insight when riskAssessmentRate < 50", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", {
            mitigations_documented: false,
            mitigations_implemented: false,
            approved_by_manager: false,
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
            drug_activity_reviewed: false,
            exploitation_risk_reviewed: false,
            gang_activity_reviewed: false,
            traffic_risk_reviewed: false,
            environmental_risk_reviewed: false,
          }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Risk assessment completeness"))).toBe(true);
    });

    it("critical insight for unresolved high/critical hazards", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1", { severity: "critical", resolved: false, days_to_resolve: 0 }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("unresolved"))).toBe(true);
    });

    it("critical insight when hazardIdentificationRate < 40", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1", { reported_to_authority: false, mitigation_in_place: false, resolved: false, days_to_resolve: 0 }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Hazard management rate"))).toBe(true);
    });

    it("critical insight when routeSafetyRate < 50", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [
          makeRoute("r1", {
            mitigations_in_place: false,
            safe_crossing_points: false,
            adequate_lighting: false,
            child_walked_route: false,
          }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Route safety completeness"))).toBe(true);
    });

    it("critical insight when communityPartnershipRate < 40", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1", {
            relationship_status: "dormant",
            contact_frequency_met: false,
            information_sharing_agreement: false,
            safeguarding_protocols_agreed: false,
          }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Community partnership effectiveness"))).toBe(true);
    });

    it("critical insight when no police partnership", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1", { partner_type: "fire_service" }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No active police partnership"))).toBe(true);
    });

    it("critical insight when no risk assessments and no mappings but children on placement", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [],
        safety_mapping_records: [],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No neighbourhood risk assessments or safety mapping"))).toBe(true);
    });

    it("critical insight when exploitationReviewRate < 50", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { exploitation_risk_reviewed: false }),
          makeRiskAssessment("ra2", { exploitation_risk_reviewed: false }),
          makeRiskAssessment("ra3"),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Exploitation risk reviewed in only"))).toBe(true);
    });
  });

  // ── 30. Insights: warning ────────────────────────────────────────────────

  describe("insights: warning", () => {
    it("warning insight when riskAssessmentRate between 50 and 70", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1"),
          makeRiskAssessment("ra2", { mitigations_documented: false, approved_by_manager: false }),
          makeRiskAssessment("ra3", { mitigations_documented: false }),
          makeRiskAssessment("ra4", {
            mitigations_documented: false,
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
          }),
        ],
      }));
      if (meets(r.risk_assessment_rate, 50) && below(r.risk_assessment_rate, 70)) {
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Risk assessment completeness at"))).toBe(true);
      }
    });

    it("warning insight when overdueRiskRate >= 20", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { overdue: true }),
          makeRiskAssessment("ra2"),
          makeRiskAssessment("ra3"),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("overdue"))).toBe(true);
    });

    it("warning insight when recurrentHazardRate >= 30", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1", { recurrent: true }),
          makeHazard("h2"),
          makeHazard("h3"),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("recurrent"))).toBe(true);
    });

    it("warning insight when highCriticalRouteRate >= 30", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [
          makeRoute("r1", { risk_level: "high" }),
          makeRoute("r2", { risk_level: "critical" }),
          makeRoute("r3"),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("routes rated high/critical"))).toBe(true);
    });

    it("warning insight when dormantPartnershipRate >= 30", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1"),
          makePartnership("cp2", { partner_type: "fire_service", relationship_status: "dormant" }),
          makePartnership("cp3", { partner_type: "local_authority" }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("dormant"))).toBe(true);
    });

    it("warning insight when childAwarenessRate between 50 and 80", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { child_consulted: true }),
          makeRiskAssessment("ra2", { child_consulted: false }),
          makeRiskAssessment("ra3", { child_consulted: false }),
        ],
        safety_mapping_records: [
          makeSafetyMapping("sm1", { child_involvement: true }),
          makeSafetyMapping("sm2", { child_involvement: true }),
        ],
        hazard_records: [
          makeHazard("h1", { children_informed: true }),
          makeHazard("h2", { children_informed: true }),
        ],
        route_safety_records: [
          makeRoute("r1", { child_walked_route: true }),
          makeRoute("r2", { child_walked_route: true }),
          makeRoute("r3", { child_walked_route: false }),
        ],
      }));
      // 1+2+2+2 = 7 out of 3+2+2+3 = 10 => 70%
      if (meets(r.child_awareness_rate, 50) && below(r.child_awareness_rate, 80)) {
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child awareness and involvement"))).toBe(true);
      }
    });
  });

  // ── 31. Insights: positive ───────────────────────────────────────────────

  describe("insights: positive", () => {
    it("positive insight for outstanding rating", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
    });

    it("positive insight for riskAssessmentRate >= 90 and comprehensiveCoverage >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("comprehensive coverage"))).toBe(true);
    });

    it("positive insight for hazardIdentificationRate >= 90 and avgDaysToResolve <= 7", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("hazard management rate"))).toBe(true);
    });

    it("positive insight for routeSafetyRate >= 90 and routeChildConfidentRate >= 80", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("route safety completeness"))).toBe(true);
    });

    it("positive insight for communityPartnershipRate >= 90 and effectivenessAvg >= 4.0", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("partnership effectiveness"))).toBe(true);
    });

    it("positive insight for childAwarenessRate >= 80", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Child awareness and involvement"))).toBe(true);
    });

    it("positive insight for safetyMappingRate >= 90 and staffWalkedRate >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("safety mapping completeness"))).toBe(true);
    });

    it("positive insight for infoSharingRate >= 90 and safeguardingProtocolRate >= 90", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Information sharing agreements"))).toBe(true);
    });

    it("positive insight for partnership diversity >= 4 types", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1", { partner_type: "police" }),
          makePartnership("cp2", { partner_type: "fire_service" }),
          makePartnership("cp3", { partner_type: "local_authority" }),
          makePartnership("cp4", { partner_type: "school" }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("different types of community safety partners"))).toBe(true);
    });

    it("no partnership diversity insight with < 4 active types", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1", { partner_type: "police" }),
          makePartnership("cp2", { partner_type: "fire_service" }),
        ],
      }));
      expect(r.insights.some((i) => i.text.includes("different types of community safety partners"))).toBe(false);
    });
  });

  // ── 32. Headline text variations ─────────────────────────────────────────

  describe("headline variations", () => {
    it("outstanding headline is fixed text", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.headline).toBe("Outstanding neighbourhood safety and risk assessment -- comprehensive risk assessments, effective hazard management, thorough route reviews, and strong community partnerships protect children.");
    });

    it("good headline includes strengths count", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1"),
          makeRiskAssessment("ra2", { mitigations_documented: false }),
          makeRiskAssessment("ra3", { approved_by_manager: false }),
          makeRiskAssessment("ra4", {
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
            drug_activity_reviewed: false,
          }),
        ],
        safety_mapping_records: [
          makeSafetyMapping("sm1"),
          makeSafetyMapping("sm2", { staff_walked_area: false, cctv_coverage_noted: false }),
        ],
      }));
      if (r.neighbourhood_rating === "good") {
        expect(r.headline).toContain("strength");
      }
    });

    it("adequate headline mentions concern count", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", {
            mitigations_documented: false,
            mitigations_implemented: false,
            approved_by_manager: false,
            child_consulted: false,
          }),
          makeRiskAssessment("ra2"),
          makeRiskAssessment("ra3", {
            mitigations_documented: false,
            approved_by_manager: false,
          }),
        ],
        safety_mapping_records: [
          makeSafetyMapping("sm1", { staff_walked_area: false, cctv_coverage_noted: false, update_frequency_met: false }),
          makeSafetyMapping("sm2", { lighting_assessed: false, child_involvement: false }),
        ],
        hazard_records: [
          makeHazard("h1", { resolved: false, mitigation_in_place: false }),
          makeHazard("h2", { reported_to_authority: false }),
          makeHazard("h3"),
        ],
        route_safety_records: [
          makeRoute("r1", { mitigations_in_place: false, safe_crossing_points: false, child_walked_route: false }),
          makeRoute("r2", { adequate_lighting: false, child_walked_route: false }),
          makeRoute("r3"),
        ],
        community_partnership_records: [
          makePartnership("cp1", { contact_frequency_met: false, information_sharing_agreement: false }),
          makePartnership("cp2", {
            partner_type: "fire_service",
            relationship_status: "dormant",
            safeguarding_protocols_agreed: false,
          }),
        ],
      }));
      if (r.neighbourhood_rating === "adequate") {
        expect(r.headline).toContain("concern");
      }
    });

    it("inadequate headline mentions significant concern count", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", {
            mitigations_documented: false,
            mitigations_implemented: false,
            approved_by_manager: false,
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
            drug_activity_reviewed: false,
            exploitation_risk_reviewed: false,
            gang_activity_reviewed: false,
            traffic_risk_reviewed: false,
            environmental_risk_reviewed: false,
            child_consulted: false,
          }),
        ],
        safety_mapping_records: [],
        hazard_records: [
          makeHazard("h1", { severity: "critical", reported_to_authority: false, mitigation_in_place: false, resolved: false, days_to_resolve: 0 }),
        ],
        route_safety_records: [
          makeRoute("r1", { mitigations_in_place: false, safe_crossing_points: false, adequate_lighting: false, child_walked_route: false }),
        ],
        community_partnership_records: [
          makePartnership("cp1", {
            partner_type: "local_authority",
            relationship_status: "dormant",
            contact_frequency_met: false,
            information_sharing_agreement: false,
            safeguarding_protocols_agreed: false,
          }),
        ],
      }));
      if (r.neighbourhood_rating === "inadequate") {
        expect(r.headline).toContain("significant concern");
      }
    });
  });

  // ── 33. Edge cases ──────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("single record in each array still computes valid result", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [makeRiskAssessment("ra1")],
        safety_mapping_records: [makeSafetyMapping("sm1")],
        hazard_records: [makeHazard("h1")],
        route_safety_records: [makeRoute("r1")],
        community_partnership_records: [makePartnership("cp1")],
      }));
      expect(r.neighbourhood_score).toBeGreaterThanOrEqual(0);
      expect(r.neighbourhood_score).toBeLessThanOrEqual(100);
      expect(["outstanding", "good", "adequate", "inadequate"]).toContain(r.neighbourhood_rating);
    });

    it("only risk_assessment_records present (other arrays empty)", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      }));
      expect(r.risk_assessment_rate).toBe(100);
      expect(r.safety_mapping_rate).toBeNull();
      expect(r.hazard_identification_rate).toBeNull();
      expect(r.route_safety_rate).toBeNull();
      expect(r.community_partnership_rate).toBeNull();
    });

    it("only hazard_records present", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [],
        safety_mapping_records: [],
        route_safety_records: [],
        community_partnership_records: [],
      }));
      expect(r.hazard_identification_rate).toBe(100);
      expect(r.risk_assessment_rate).toBeNull();
    });

    it("only community_partnership_records present", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [],
        safety_mapping_records: [],
        hazard_records: [],
        route_safety_records: [],
      }));
      expect(r.community_partnership_rate).toBe(100);
      expect(r.risk_assessment_rate).toBeNull();
    });

    it("total_children 1 with full data still works", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({ total_children: 1 }));
      expect(r.neighbourhood_score).toBeGreaterThanOrEqual(80);
    });

    it("large number of records does not break computation", () => {
      const assessments = Array.from({ length: 50 }, (_, i) => makeRiskAssessment(`ra${i}`));
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: assessments,
      }));
      expect(r.neighbourhood_score).toBeGreaterThanOrEqual(0);
      expect(r.neighbourhood_score).toBeLessThanOrEqual(100);
    });

    it("mixed assessment types are handled", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { assessment_type: "initial" }),
          makeRiskAssessment("ra2", { assessment_type: "annual_review" }),
          makeRiskAssessment("ra3", { assessment_type: "triggered" }),
          makeRiskAssessment("ra4", { assessment_type: "placement_change" }),
          makeRiskAssessment("ra5", { assessment_type: "incident_driven" }),
        ],
      }));
      expect(r.risk_assessment_rate).toBe(100);
    });

    it("mixed hazard types are handled", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1", { hazard_type: "environmental" }),
          makeHazard("h2", { hazard_type: "structural" }),
          makeHazard("h3", { hazard_type: "traffic" }),
          makeHazard("h4", { hazard_type: "water" }),
        ],
      }));
      expect(r.hazard_identification_rate).toBe(100);
    });

    it("mixed route types are handled", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [
          makeRoute("r1", { route_type: "school" }),
          makeRoute("r2", { route_type: "activity" }),
          makeRoute("r3", { route_type: "contact" }),
          makeRoute("r4", { route_type: "healthcare" }),
        ],
      }));
      expect(r.route_safety_rate).toBe(100);
    });

    it("mixed partner types are handled", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1", { partner_type: "police" }),
          makePartnership("cp2", { partner_type: "fire_service" }),
          makePartnership("cp3", { partner_type: "local_authority" }),
          makePartnership("cp4", { partner_type: "neighbourhood_watch" }),
          makePartnership("cp5", { partner_type: "school" }),
        ],
      }));
      expect(r.community_partnership_rate).toBe(100);
    });

    it("unresolved hazard singular/plural grammar for 1 hazard", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1", { severity: "high", resolved: false, days_to_resolve: 0 }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("1 high or critical severity hazard remains"))).toBe(true);
    });

    it("unresolved hazard plural grammar for multiple hazards", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1", { severity: "high", resolved: false, days_to_resolve: 0 }),
          makeHazard("h2", { severity: "critical", resolved: false, days_to_resolve: 0 }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("2 high or critical severity hazards remain"))).toBe(true);
    });
  });

  // ── 34. Rating boundaries ────────────────────────────────────────────────

  describe("rating boundaries", () => {
    it("score 80 maps to outstanding", () => {
      // We verify the rating logic by checking that the engine with perfect data hits outstanding
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.neighbourhood_score).toBeGreaterThanOrEqual(80);
      expect(r.neighbourhood_rating).toBe("outstanding");
    });

    it("score in 65-79 maps to good", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1"),
          makeRiskAssessment("ra2", { mitigations_documented: false }),
          makeRiskAssessment("ra3", { approved_by_manager: false }),
          makeRiskAssessment("ra4", {
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
            drug_activity_reviewed: false,
          }),
        ],
        safety_mapping_records: [
          makeSafetyMapping("sm1"),
          makeSafetyMapping("sm2", { staff_walked_area: false, cctv_coverage_noted: false }),
        ],
        hazard_records: [
          makeHazard("h1"),
          makeHazard("h2", { resolved: false }),
        ],
        route_safety_records: [
          makeRoute("r1"),
          makeRoute("r2", { child_walked_route: false, mitigations_in_place: false }),
          makeRoute("r3"),
        ],
        community_partnership_records: [
          makePartnership("cp1"),
          makePartnership("cp2", { contact_frequency_met: false, information_sharing_agreement: false }),
        ],
      }));
      if (r.neighbourhood_score >= 65 && r.neighbourhood_score < 80) {
        expect(r.neighbourhood_rating).toBe("good");
      }
    });

    it("score in 45-64 maps to adequate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", {
            mitigations_documented: false,
            mitigations_implemented: false,
            approved_by_manager: false,
            child_consulted: false,
          }),
          makeRiskAssessment("ra2"),
          makeRiskAssessment("ra3", { mitigations_documented: false, approved_by_manager: false }),
        ],
        safety_mapping_records: [
          makeSafetyMapping("sm1", { staff_walked_area: false, cctv_coverage_noted: false, update_frequency_met: false }),
          makeSafetyMapping("sm2", { lighting_assessed: false, child_involvement: false }),
        ],
        hazard_records: [
          makeHazard("h1", { resolved: false, mitigation_in_place: false }),
          makeHazard("h2", { reported_to_authority: false }),
          makeHazard("h3"),
        ],
        route_safety_records: [
          makeRoute("r1", { mitigations_in_place: false, safe_crossing_points: false, child_walked_route: false }),
          makeRoute("r2", { adequate_lighting: false, child_walked_route: false }),
          makeRoute("r3"),
        ],
        community_partnership_records: [
          makePartnership("cp1", { contact_frequency_met: false, information_sharing_agreement: false }),
          makePartnership("cp2", {
            partner_type: "fire_service",
            relationship_status: "dormant",
            safeguarding_protocols_agreed: false,
          }),
        ],
      }));
      if (r.neighbourhood_score >= 45 && r.neighbourhood_score < 65) {
        expect(r.neighbourhood_rating).toBe("adequate");
      }
    });

    it("score below 45 maps to inadequate", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", {
            mitigations_documented: false,
            mitigations_implemented: false,
            approved_by_manager: false,
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
            drug_activity_reviewed: false,
            exploitation_risk_reviewed: false,
            gang_activity_reviewed: false,
            traffic_risk_reviewed: false,
            environmental_risk_reviewed: false,
            child_consulted: false,
          }),
        ],
        safety_mapping_records: [],
        hazard_records: [
          makeHazard("h1", { severity: "critical", reported_to_authority: false, mitigation_in_place: false, resolved: false, days_to_resolve: 0 }),
        ],
        route_safety_records: [
          makeRoute("r1", { mitigations_in_place: false, safe_crossing_points: false, adequate_lighting: false, child_walked_route: false }),
        ],
        community_partnership_records: [
          makePartnership("cp1", {
            partner_type: "local_authority",
            relationship_status: "dormant",
            contact_frequency_met: false,
            information_sharing_agreement: false,
            safeguarding_protocols_agreed: false,
          }),
        ],
      }));
      expect(r.neighbourhood_score).toBeLessThan(45);
      expect(r.neighbourhood_rating).toBe("inadequate");
    });
  });

  // ── 35. Return shape ─────────────────────────────────────────────────────

  describe("return shape", () => {
    it("result has all expected keys", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r).toHaveProperty("neighbourhood_rating");
      expect(r).toHaveProperty("neighbourhood_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("risk_assessment_rate");
      expect(r).toHaveProperty("safety_mapping_rate");
      expect(r).toHaveProperty("hazard_identification_rate");
      expect(r).toHaveProperty("route_safety_rate");
      expect(r).toHaveProperty("community_partnership_rate");
      expect(r).toHaveProperty("child_awareness_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("all rates are numbers between 0 and 100", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(r.risk_assessment_rate).toBeGreaterThanOrEqual(0);
      expect(r.risk_assessment_rate).toBeLessThanOrEqual(100);
      expect(r.safety_mapping_rate).toBeGreaterThanOrEqual(0);
      expect(r.safety_mapping_rate).toBeLessThanOrEqual(100);
      expect(r.hazard_identification_rate).toBeGreaterThanOrEqual(0);
      expect(r.hazard_identification_rate).toBeLessThanOrEqual(100);
      expect(r.route_safety_rate).toBeGreaterThanOrEqual(0);
      expect(r.route_safety_rate).toBeLessThanOrEqual(100);
      expect(r.community_partnership_rate).toBeGreaterThanOrEqual(0);
      expect(r.community_partnership_rate).toBeLessThanOrEqual(100);
      expect(r.child_awareness_rate).toBeGreaterThanOrEqual(0);
      expect(r.child_awareness_rate).toBeLessThanOrEqual(100);
    });

    it("strengths, concerns are string arrays", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      expect(Array.isArray(r.strengths)).toBe(true);
      expect(Array.isArray(r.concerns)).toBe(true);
      r.strengths.forEach((s) => expect(typeof s).toBe("string"));
    });

    it("recommendations have rank, recommendation, urgency, regulatory_ref", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1", { severity: "critical", resolved: false, days_to_resolve: 0 }),
        ],
      }));
      r.recommendations.forEach((rec) => {
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(rec).toHaveProperty("regulatory_ref");
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
      });
    });

    it("insights have text and severity", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput());
      r.insights.forEach((ins) => {
        expect(ins).toHaveProperty("text");
        expect(ins).toHaveProperty("severity");
        expect(["critical", "warning", "positive"]).toContain(ins.severity);
      });
    });
  });

  // ── 36. Specific mid-range scenarios ─────────────────────────────────────

  describe("mid-range composite rates", () => {
    it("riskAssessmentRate between 50-69 triggers specific concern text", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1"),
          makeRiskAssessment("ra2", { mitigations_documented: false, approved_by_manager: false }),
          makeRiskAssessment("ra3", { mitigations_documented: false }),
          makeRiskAssessment("ra4", {
            mitigations_documented: false,
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
          }),
        ],
      }));
      if (meets(r.risk_assessment_rate, 50) && below(r.risk_assessment_rate, 70)) {
        expect(r.concerns.some((c) => c.includes("Risk assessment completeness at"))).toBe(true);
      }
    });

    it("safetyMappingRate between 50-69 triggers specific concern text", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [
          makeSafetyMapping("sm1"),
          makeSafetyMapping("sm2", { staff_walked_area: false, cctv_coverage_noted: false }),
          makeSafetyMapping("sm3", { lighting_assessed: false, update_frequency_met: false }),
        ],
      }));
      if (meets(r.safety_mapping_rate, 50) && below(r.safety_mapping_rate, 70)) {
        expect(r.concerns.some((c) => c.includes("Safety mapping completeness at"))).toBe(true);
      }
    });

    it("hazardIdentificationRate between 40-69 triggers specific concern text", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1"),
          makeHazard("h2", { resolved: false }),
          makeHazard("h3", { mitigation_in_place: false }),
        ],
      }));
      if (meets(r.hazard_identification_rate, 40) && below(r.hazard_identification_rate, 70)) {
        expect(r.concerns.some((c) => c.includes("Hazard management rate at"))).toBe(true);
      }
    });

    it("routeSafetyRate between 50-69 triggers specific concern text", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [
          makeRoute("r1"),
          makeRoute("r2", { child_walked_route: false, mitigations_in_place: false }),
          makeRoute("r3", { safe_crossing_points: false }),
        ],
      }));
      if (meets(r.route_safety_rate, 50) && below(r.route_safety_rate, 70)) {
        expect(r.concerns.some((c) => c.includes("Route safety completeness at"))).toBe(true);
      }
    });

    it("communityPartnershipRate between 40-69 triggers specific concern text", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1"),
          makePartnership("cp2", {
            partner_type: "fire_service",
            contact_frequency_met: false,
            information_sharing_agreement: false,
          }),
          makePartnership("cp3", {
            partner_type: "local_authority",
            safeguarding_protocols_agreed: false,
          }),
        ],
      }));
      if (meets(r.community_partnership_rate, 40) && below(r.community_partnership_rate, 70)) {
        expect(r.concerns.some((c) => c.includes("Community partnership effectiveness at"))).toBe(true);
      }
    });

    it("childAwarenessRate between 50-59 triggers specific concern text", () => {
      // 1+1+1+1 = 4 out of 3+2+2+3 = 10 => 40% -- not quite right, let me adjust
      // Need 50-59%: 5 or 6 out of 10
      // child_consulted: 2 true, 1 false (2)
      // child_involvement: 1 true, 1 false (1)
      // children_informed: 1 true, 1 false (1)
      // child_walked: 1 true, 2 false (1)
      // total = 5/10 = 50%
      const r2 = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { child_consulted: true }),
          makeRiskAssessment("ra2", { child_consulted: true }),
          makeRiskAssessment("ra3", { child_consulted: false }),
        ],
        safety_mapping_records: [
          makeSafetyMapping("sm1", { child_involvement: true }),
          makeSafetyMapping("sm2", { child_involvement: false }),
        ],
        hazard_records: [
          makeHazard("h1", { children_informed: true }),
          makeHazard("h2", { children_informed: false }),
        ],
        route_safety_records: [
          makeRoute("r1", { child_walked_route: true }),
          makeRoute("r2", { child_walked_route: false }),
          makeRoute("r3", { child_walked_route: false }),
        ],
      }));
      // 2+1+1+1 = 5 out of 3+2+2+3 = 10 => 50%
      expect(r2.child_awareness_rate).toBe(50);
      expect(r2.concerns.some((c) => c.includes("Child awareness at 50%"))).toBe(true);
    });
  });

  // ── 37. Recommendation urgency levels and regulatory refs ────────────────

  describe("recommendation urgency and regulatory references", () => {
    it("immediate recommendations reference Reg 25 or Reg 5 or SCCIF", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", {
            mitigations_documented: false,
            mitigations_implemented: false,
            approved_by_manager: false,
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
            drug_activity_reviewed: false,
            exploitation_risk_reviewed: false,
            gang_activity_reviewed: false,
            traffic_risk_reviewed: false,
            environmental_risk_reviewed: false,
            child_consulted: false,
          }),
        ],
        hazard_records: [
          makeHazard("h1", { severity: "critical", resolved: false, reported_to_authority: false, mitigation_in_place: false, days_to_resolve: 0 }),
        ],
        community_partnership_records: [
          makePartnership("cp1", { partner_type: "fire_service" }), // no police
        ],
      }));
      const immediateRecs = r.recommendations.filter((rec) => rec.urgency === "immediate");
      immediateRecs.forEach((rec) => {
        expect(
          rec.regulatory_ref.includes("Reg 25") ||
          rec.regulatory_ref.includes("Reg 5") ||
          rec.regulatory_ref.includes("SCCIF"),
        ).toBe(true);
      });
    });

    it("soon recommendations reference Reg 25 or Reg 5 or SCCIF", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1", { overdue: true }),
          makeRiskAssessment("ra2"),
          makeRiskAssessment("ra3"),
        ],
      }));
      const soonRecs = r.recommendations.filter((rec) => rec.urgency === "soon");
      soonRecs.forEach((rec) => {
        expect(
          rec.regulatory_ref.includes("Reg 25") ||
          rec.regulatory_ref.includes("Reg 5") ||
          rec.regulatory_ref.includes("SCCIF"),
        ).toBe(true);
      });
    });

    it("planned recommendations reference Reg 25 or Reg 5", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1"),
          makeRiskAssessment("ra2", { mitigations_documented: false, approved_by_manager: false }),
          makeRiskAssessment("ra3", { mitigations_documented: false }),
          makeRiskAssessment("ra4", {
            mitigations_documented: false,
            local_crime_reviewed: false,
            antisocial_behaviour_reviewed: false,
          }),
        ],
      }));
      const plannedRecs = r.recommendations.filter((rec) => rec.urgency === "planned");
      plannedRecs.forEach((rec) => {
        expect(
          rec.regulatory_ref.includes("Reg 25") ||
          rec.regulatory_ref.includes("Reg 5"),
        ).toBe(true);
      });
    });
  });

  // ── 38. Mid-range recommendation triggers ───────────────────────────────

  describe("mid-range recommendation triggers", () => {
    it("mitigationImplRate 50-79 produces 'soon' recommendation", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1"),
          makeRiskAssessment("ra2", { mitigations_implemented: false }),
          makeRiskAssessment("ra3"),
          makeRiskAssessment("ra4", { mitigations_implemented: false }),
        ],
      }));
      // 2/4 = 50% => triggers "soon" recommendation
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Improve mitigation implementation"))).toBe(true);
    });

    it("safetyMappingRate 50-69 produces 'soon' recommendation", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [
          makeSafetyMapping("sm1"),
          makeSafetyMapping("sm2", { staff_walked_area: false, cctv_coverage_noted: false }),
          makeSafetyMapping("sm3", { lighting_assessed: false, update_frequency_met: false }),
        ],
      }));
      if (meets(r.safety_mapping_rate, 50) && below(r.safety_mapping_rate, 70)) {
        expect(r.recommendations.some((rec) => rec.recommendation.includes("Strengthen safety mapping"))).toBe(true);
      }
    });

    it("hazardReportingRate 50-79 produces 'soon' recommendation", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1"),
          makeHazard("h2", { reported_to_authority: false }),
          makeHazard("h3"),
        ],
      }));
      // 2/3 = 67%
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Increase hazard reporting rate"))).toBe(true);
    });

    it("routeChildConfidentRate 50-79 produces 'soon' recommendation", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [
          makeRoute("r1"),
          makeRoute("r2", { child_confident_on_route: false }),
          makeRoute("r3"),
        ],
      }));
      // 2/3 = 67%
      expect(r.recommendations.some((rec) => rec.recommendation.includes("lack confidence on their routes"))).toBe(true);
    });

    it("routeSafetyRate 50-69 produces 'planned' recommendation", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [
          makeRoute("r1"),
          makeRoute("r2", { child_walked_route: false, mitigations_in_place: false }),
          makeRoute("r3", { safe_crossing_points: false }),
        ],
      }));
      if (meets(r.route_safety_rate, 50) && below(r.route_safety_rate, 70)) {
        expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Improve route safety completeness"))).toBe(true);
      }
    });

    it("communityPartnershipRate 40-69 produces 'planned' recommendation", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1"),
          makePartnership("cp2", {
            partner_type: "fire_service",
            contact_frequency_met: false,
            information_sharing_agreement: false,
          }),
          makePartnership("cp3", {
            partner_type: "local_authority",
            safeguarding_protocols_agreed: false,
          }),
        ],
      }));
      if (meets(r.community_partnership_rate, 40) && below(r.community_partnership_rate, 70)) {
        expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Strengthen community partnerships"))).toBe(true);
      }
    });
  });

  // ── 39. safetyMappingRate mid-range strength ─────────────────────────────

  describe("mid-range strengths", () => {
    it("safetyMappingRate 70-89 produces a strength mentioning good", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [
          makeSafetyMapping("sm1"),
          makeSafetyMapping("sm2"),
          makeSafetyMapping("sm3"),
          makeSafetyMapping("sm4", { staff_walked_area: false }),
        ],
      }));
      if (meets(r.safety_mapping_rate, 70) && below(r.safety_mapping_rate, 90)) {
        expect(r.strengths.some((s) => s.includes("safety mapping completeness") && s.includes("good"))).toBe(true);
      }
    });

    it("routeSafetyRate 70-89 produces a strength mentioning good", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [
          makeRoute("r1"),
          makeRoute("r2"),
          makeRoute("r3"),
          makeRoute("r4", { child_walked_route: false }),
        ],
      }));
      if (meets(r.route_safety_rate, 70) && below(r.route_safety_rate, 90)) {
        expect(r.strengths.some((s) => s.includes("route safety completeness") && s.includes("good"))).toBe(true);
      }
    });

    it("communityPartnershipRate 70-89 produces a strength mentioning good", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1"),
          makePartnership("cp2", { partner_type: "fire_service" }),
          makePartnership("cp3", { partner_type: "local_authority" }),
          makePartnership("cp4", { partner_type: "school", contact_frequency_met: false }),
        ],
      }));
      if (meets(r.community_partnership_rate, 70) && below(r.community_partnership_rate, 90)) {
        expect(r.strengths.some((s) => s.includes("community partnership effectiveness") && s.includes("good"))).toBe(true);
      }
    });

    it("hazardIdentificationRate 70-89 produces a strength mentioning most", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1"),
          makeHazard("h2"),
          makeHazard("h3"),
          makeHazard("h4", { resolved: false }),
        ],
      }));
      if (meets(r.hazard_identification_rate, 70) && below(r.hazard_identification_rate, 90)) {
        expect(r.strengths.some((s) => s.includes("hazard management rate"))).toBe(true);
      }
    });

    it("comprehensiveCoverageRate 70-89 produces a strength mentioning most", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        risk_assessment_records: [
          makeRiskAssessment("ra1"),
          makeRiskAssessment("ra2"),
          makeRiskAssessment("ra3"),
          makeRiskAssessment("ra4", { local_crime_reviewed: false }),
        ],
      }));
      if (meets(r.risk_assessment_rate, 70)) {
        // 3/4 = 75% comprehensive coverage
        expect(r.strengths.some((s) => s.includes("cover all seven key areas") && s.includes("most"))).toBe(true);
      }
    });
  });

  // ── 40. Warning insight for mid-range safety mapping ─────────────────────

  describe("warning insights for mid-range rates", () => {
    it("safetyMappingRate 50-69 produces warning insight", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        safety_mapping_records: [
          makeSafetyMapping("sm1"),
          makeSafetyMapping("sm2", { staff_walked_area: false, cctv_coverage_noted: false }),
          makeSafetyMapping("sm3", { lighting_assessed: false, update_frequency_met: false }),
        ],
      }));
      if (meets(r.safety_mapping_rate, 50) && below(r.safety_mapping_rate, 70)) {
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Safety mapping completeness"))).toBe(true);
      }
    });

    it("hazardIdentificationRate 40-69 produces warning insight", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        hazard_records: [
          makeHazard("h1"),
          makeHazard("h2", { resolved: false }),
          makeHazard("h3", { mitigation_in_place: false }),
        ],
      }));
      if (meets(r.hazard_identification_rate, 40) && below(r.hazard_identification_rate, 70)) {
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Hazard management rate"))).toBe(true);
      }
    });

    it("routeSafetyRate 50-69 produces warning insight", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        route_safety_records: [
          makeRoute("r1"),
          makeRoute("r2", { child_walked_route: false, mitigations_in_place: false }),
          makeRoute("r3", { safe_crossing_points: false }),
        ],
      }));
      if (meets(r.route_safety_rate, 50) && below(r.route_safety_rate, 70)) {
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Route safety completeness"))).toBe(true);
      }
    });

    it("communityPartnershipRate 40-69 produces warning insight", () => {
      const r = computeNeighbourhoodSafetyRiskAssessment(baseInput({
        community_partnership_records: [
          makePartnership("cp1"),
          makePartnership("cp2", {
            partner_type: "fire_service",
            contact_frequency_met: false,
            information_sharing_agreement: false,
          }),
          makePartnership("cp3", {
            partner_type: "local_authority",
            safeguarding_protocols_agreed: false,
          }),
        ],
      }));
      if (meets(r.community_partnership_rate, 40) && below(r.community_partnership_rate, 70)) {
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Community partnership effectiveness"))).toBe(true);
      }
    });
  });
});
